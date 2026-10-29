import fs from 'fs';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}` };

const durations = JSON.parse(fs.readFileSync('scripts/audio-durations.json', 'utf8'));
const dropIds = new Set(durations.filter((d) => !d.keep).map((d) => d.id));
console.log(`Short-audio sermon ids (drop): ${dropIds.size}`);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});
const R2_BUCKET = env.R2_BUCKET_NAME;
const R2_PUBLIC = (env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '');

// Fetch all sermons with http audio
let page = 0, all = [];
while (true) {
  const r = await fetch(`${U}/rest/v1/sermons?select=id,audio_url,r2_key&audio_url=like.http*&limit=1000&offset=${page * 1000}`, { headers: H });
  const rows = await r.json();
  if (!Array.isArray(rows) || rows.length === 0) break;
  all = all.concat(rows);
  if (rows.length < 1000) break;
  page++;
}
console.log(`Sermons with http audio: ${all.length}`);

let reverted = 0, deletedR2 = 0, deletedSupa = 0, skipped = 0;
for (const s of all) {
  if (!dropIds.has(s.id)) { skipped++; continue; }
  const url = s.audio_url;
  const isR2 = url.startsWith(R2_PUBLIC);
  const isSupa = url.includes('.supabase.co/storage/');

  // delete object
  if (isR2) {
    const key = url.replace(R2_PUBLIC + '/', '');
    try { await r2.send(new (await import('@aws-sdk/client-s3')).DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })); deletedR2++; } catch (e) { console.error('r2 delete err', s.id, e?.message); }
  } else if (isSupa) {
    // supabase storage path: /storage/v1/object/public/church-media/sermons/...
    const m = url.match(/\/storage\/v1\/object\/public\/church-media\/(.+)$/);
    if (m) {
      const del = await fetch(`${U}/storage/v1/object/church-media/${m[1]}`, { method: 'DELETE', headers: H });
      if (del.ok) deletedSupa++; else console.error('supa delete err', s.id, del.status);
    }
  }

  // revert DB
  const upd = await fetch(`${U}/rest/v1/sermons?id=eq.${s.id}`, {
    method: 'PATCH',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ audio_url: 'audio/default-placeholder.mp3', r2_key: 'audio/default-placeholder.mp3' }),
  });
  if (upd.ok) reverted++; else console.error('db revert err', s.id, upd.status);
}

console.log(`\nDone. reverted=${reverted} deletedR2=${deletedR2} deletedSupa=${deletedSupa} kept(short-audio-not-uploaded) skipped=${skipped}`);
fs.writeFileSync('scripts/cleanup-short-audio-progress.json', JSON.stringify({ reverted, deletedR2, deletedSupa, skipped, total: all.length }, null, 2));
