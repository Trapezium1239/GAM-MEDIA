// Uploads REAL sermon audio to Cloudflare R2 and wires the DB row to the R2
// public URL (https://media.gam.church/...). Consumes scripts/audio-manifest.json.
//
// Idempotent: storage key is `sermons/<db-id><ext>`, so re-runs resume.
// Usage:
//   node scripts/upload-to-r2.mjs --limit 25 --verify 3
//   node scripts/upload-to-r2.mjs --dry-run
//   node scripts/upload-to-r2.mjs --ids id1,id2
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt;
};
const has = (name) => args.includes(`--${name}`);
const LIMIT = parseInt(flag('limit', '0'), 10) || Infinity;
const VERIFY = parseInt(flag('verify', '3'), 10);
const DRY = has('dry-run');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}` };

const R2_ACCOUNT = env.R2_ACCOUNT_ID;
const R2_KEY = env.R2_ACCESS_KEY_ID;
const R2_SECRET = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = env.R2_BUCKET_NAME;
const R2_PUBLIC = (env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
});

const MIME = {
  '.mp3': 'audio/mpeg', '.mpeg': 'audio/mpeg', '.ogg': 'audio/ogg', '.opus': 'audio/ogg',
  '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.wav': 'audio/wav', '.aac': 'audio/aac',
  '.amr': 'audio/amr', '.webm': 'audio/webm',
};
const MAX_BYTES = 100 * 1048576;

const manifest = JSON.parse(fs.readFileSync('scripts/audio-manifest.json', 'utf8'));
// Skip short (<30 min) recordings — only long sermons should carry audio.
let dropIds = new Set();
if (fs.existsSync('scripts/audio-durations.json')) {
  try {
    const durs = JSON.parse(fs.readFileSync('scripts/audio-durations.json', 'utf8'));
    dropIds = new Set(durs.filter((d) => !d.keep).map((d) => d.id));
  } catch {}
}
const filtered = manifest.filter((e) => !dropIds.has(e.id));
console.log(`manifest: ${manifest.length} total, ${dropIds.size} short (<30min) dropped, ${filtered.length} to process`);
const manifestToUse = filtered;
const SERMONISH = /SERMON|MESSAGE|MINISTRATION|PREACH|WORD/i;
let sorted = [...manifestToUse].sort((a, b) => {
  const ad = a.serviceDate || '0000', bd = b.serviceDate || '0000';
  if (ad !== bd) return bd < ad ? -1 : 1;
  const as = SERMONISH.test(a.title) ? 0 : 1, bs = SERMONISH.test(b.title) ? 0 : 1;
  return as - bs;
});
const onlyIds = flag('ids', '').split(',').map((s) => s.trim()).filter(Boolean);
if (onlyIds.length) {
  const want = new Set(onlyIds);
  sorted = sorted.filter((e) => want.has(e.id));
  console.log(`restricted to ${sorted.length}/${manifest.length} manifest entries by --ids`);
  if (!sorted.length) { console.error('none of the requested ids are in the manifest'); process.exit(1); }
}

const publicUrlOf = (key) => `${R2_PUBLIC}/${key}`;
const exists = async (key) => {
  try {
    const r = await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return r.ContentLength || 0;
  } catch { return null; }
};

const stats = { uploaded: 0, resumed: 0, wired: 0, skippedTooBig: 0, missingFile: 0, failed: 0, verified: 0 };
const failures = [];
let processed = 0;
let aborted = null;

const writeProgress = () => {
  const snapshot = { ...stats, processed, limit: LIMIT === Infinity ? 'all' : LIMIT, aborted, remaining: sorted.length - processed, failures: failures.slice(0, 40), updatedAt: new Date().toISOString() };
  fs.writeFileSync('scripts/r2-upload-progress.json', JSON.stringify(snapshot, null, 2));
};

for (const e of sorted) {
  if (processed >= LIMIT) break;
  if (aborted) break;
  if (!fs.existsSync(e.file)) { stats.missingFile++; failures.push({ id: e.id, why: 'file missing', file: e.file }); continue; }
  const realSize = fs.statSync(e.file).size;
  if (realSize !== e.size) { stats.failed++; failures.push({ id: e.id, why: `size drift ${realSize} != ${e.size}` }); continue; }
  if (realSize >= MAX_BYTES) { stats.skippedTooBig++; failures.push({ id: e.id, why: `${(realSize / 1048576).toFixed(0)}MB too large` }); continue; }

  const key = `sermons/${e.id}${e.ext}`;
  const url = publicUrlOf(key);
  processed++;
  if (processed % 25 === 0) writeProgress();

  if (DRY) {
    console.log(`[dry-run] ${e.serviceDate || '????-??-??'} ${path.basename(e.file)} (${(realSize / 1048576).toFixed(1)}MB) -> ${url}`);
    continue;
  }

  const have = await exists(key);
  if (have === realSize) {
    stats.resumed++;
  } else {
    const buf = fs.readFileSync(e.file);
    try {
      await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: MIME[e.ext] || 'application/octet-stream' }));
    } catch (err) {
      stats.failed++;
      failures.push({ id: e.id, why: `upload: ${err?.message || err}`.slice(0, 200), title: e.title });
      console.error(`UPLOAD FAILED ${e.title.slice(0, 50)}: ${err?.message || err}`);
      if (/quota|storage|limit/i.test(String(err?.message))) { aborted = 'quota/storage error'; break; }
      continue;
    }
    stats.uploaded++;

    if (stats.verified < VERIFY) {
      const got = await fetch(url);
      const back = Buffer.from(await got.arrayBuffer());
      const shaL = crypto.createHash('sha256').update(buf).digest('hex');
      const shaR = crypto.createHash('sha256').update(back).digest('hex');
      const equal = shaL === shaR && back.length === buf.length;
      console.log(`  verify ${equal ? 'OK  ' : 'FAIL'} sha256 ${shaR.slice(0, 16)}… (${back.length} bytes) via ${url}`);
      if (!equal) { stats.failed++; failures.push({ id: e.id, why: 'hash mismatch after upload' }); continue; }
      stats.verified++;
    }
  }

  if (e.currentAudioUrl === url) { continue; }
  const upd = await fetch(`${U}/rest/v1/sermons?id=eq.${e.id}`, {
    method: 'PATCH',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ audio_url: url, r2_key: url }),
  });
  if (!upd.ok) {
    stats.failed++;
    failures.push({ id: e.id, why: `db update ${upd.status}: ${(await upd.text()).slice(0, 160)}` });
    continue;
  }
  stats.wired++;
  if (stats.wired <= 12 || stats.wired % 25 === 0) {
    console.log(`wired ${stats.wired}: ${e.title.slice(0, 58)} <- ${path.basename(e.file)}`);
  }
}

const summary = { ...stats, processed, limit: LIMIT === Infinity ? 'all' : LIMIT, aborted, remaining: sorted.length - processed, failures: failures.slice(0, 40) };
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify({ ...summary, failures: `${failures.length} (showing ${summary.failures.length})` }, null, 2));
fs.writeFileSync('scripts/r2-upload-progress.json', JSON.stringify(summary, null, 2));
if (aborted) console.error(`\nABORTED: ${aborted}`);
