const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}` };

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});
const BUCKET = env.R2_BUCKET_NAME;
const PUBLIC = (env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '');
const FOLDER = 'C:/Users/henry/Music/GLORIOUS/Playlist';

const MIME = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.wma': 'audio/x-ms-wma', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4' };

async function main() {
  const r = await fetch(`${U}/rest/v1/church_music?select=id,title,audio_url&limit=1000`, { headers: H });
  const rows = await r.json();
  console.log(`Music rows: ${rows.length}`);

  const stats = { uploaded: 0, resumed: 0, wired: 0, missingFile: 0, failed: 0, verified: 0 };
  const failures = [];

  for (const row of rows) {
    const rawName = (row.audio_url || '').replace(/^local:\/\//i, '').replace(/[\r\n]/g, '').trim();
    if (!rawName) { stats.missingFile++; failures.push({ id: row.id, why: 'no filename' }); continue; }
    const localPath = path.join(FOLDER, rawName);
    if (!fs.existsSync(localPath)) { stats.missingFile++; failures.push({ id: row.id, why: 'file not found: ' + rawName }); continue; }

    const ext = path.extname(rawName).toLowerCase();
    const key = `music/${row.id}${ext}`;
    const url = `${PUBLIC}/${key}`;
    const size = fs.statSync(localPath).size;

    let have = null;
    try { const h = await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); have = h.ContentLength; } catch {}
    if (have === size) {
      stats.resumed++;
    } else {
      const buf = fs.readFileSync(localPath);
      try {
        await R2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: MIME[ext] || 'application/octet-stream' }));
      } catch (e) {
        stats.failed++; failures.push({ id: row.id, why: 'upload: ' + (e?.message || e) }); console.error('UPLOAD FAIL', row.title, e?.message); continue;
      }
      stats.uploaded++;
      if (stats.verified < 3) {
        const got = await fetch(url);
        const back = Buffer.from(await got.arrayBuffer());
        const shaL = crypto.createHash('sha256').update(buf).digest('hex');
        const shaR = crypto.createHash('sha256').update(back).digest('hex');
        const equal = shaL === shaR && back.length === buf.length;
        console.log(`  verify ${equal ? 'OK  ' : 'FAIL'} ${row.title.slice(0, 40)} (${back.length} bytes)`);
        if (!equal) { stats.failed++; failures.push({ id: row.id, why: 'hash mismatch' }); continue; }
        stats.verified++;
      }
    }

    if (row.audio_url === url) { continue; }
    const upd = await fetch(`${U}/rest/v1/church_music?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ audio_url: url }),
    });
    if (!upd.ok) { stats.failed++; failures.push({ id: row.id, why: 'db update ' + upd.status }); continue; }
    stats.wired++;
    console.log(`wired ${stats.wired}: ${row.title.slice(0, 50)}`);
  }

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify({ ...stats, failures: `${failures.length} (showing ${failures.slice(0, 10).length})` }, null, 2));
  if (failures.length) console.log('failures:', JSON.stringify(failures.slice(0, 10)));
  fs.writeFileSync('scripts/music-upload-progress.json', JSON.stringify({ ...stats, failures }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
