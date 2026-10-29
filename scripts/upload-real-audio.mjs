// Uploads REAL sermon audio to Supabase Storage and wires the DB row to the
// public URL. Consumes scripts/audio-manifest.json (built by
// build-audio-manifest.mjs), so every byte uploaded was proven to exist on
// disk first.
//
// Properties:
//   idempotent  - storage key is `sermons/<db-id><ext>`, so re-runs resume
//                 instead of duplicating objects
//   verified    - the first `--verify N` uploads are downloaded back and
//                 compared byte-for-byte by SHA-256
//   honest      - stops loudly on quota/size errors instead of silently
//                 leaving rows pointing at files that were never stored
//
// Usage:
//   node scripts/upload-real-audio.mjs --limit 25 --verify 3
//   node scripts/upload-real-audio.mjs --dry-run
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
const BUCKET = 'church-media';

const MIME = {
  '.mp3': 'audio/mpeg', '.mpeg': 'audio/mpeg', '.ogg': 'audio/ogg', '.opus': 'audio/ogg',
  '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.wav': 'audio/wav', '.aac': 'audio/aac',
  '.amr': 'audio/amr', '.webm': 'audio/webm',
};
const MAX_BYTES = 50 * 1048576; // observed storage per-object ceiling (~50 MB)

const manifest = JSON.parse(fs.readFileSync('scripts/audio-manifest.json', 'utf8'));
// newest services first, undated last; sermon-ish titles ahead of choir bits
const SERMONISH = /SERMON|MESSAGE|MINISTRATION|PREACH|WORD/i;
let sorted = [...manifest].sort((a, b) => {
  const ad = a.serviceDate || '0000', bd = b.serviceDate || '0000';
  if (ad !== bd) return bd < ad ? -1 : 1;
  const as = SERMONISH.test(a.title) ? 0 : 1, bs = SERMONISH.test(b.title) ? 0 : 1;
  return as - bs;
});
// `--ids id1,id2` restricts the run to specific manifest entries (useful for
// wiring a row that must not be left on placeholder audio).
const onlyIds = flag('ids', '').split(',').map((s) => s.trim()).filter(Boolean);
if (onlyIds.length) {
  const want = new Set(onlyIds);
  sorted = sorted.filter((e) => want.has(e.id));
  console.log(`restricted to ${sorted.length}/${manifest.length} manifest entries by --ids`);
  if (!sorted.length) {
    console.error('none of the requested ids are in the manifest (no real file exists for them)');
    process.exit(1);
  }
}

const publicUrlOf = (key) => `${U}/storage/v1/object/public/${BUCKET}/${key}`;
const exists = async (key) => {
  const r = await fetch(`${U}/storage/v1/object/${BUCKET}/${key}`, { method: 'HEAD', headers: H });
  return r.ok ? parseInt(r.headers.get('content-length') || '0', 10) : null;
};

const stats = { uploaded: 0, resumed: 0, wired: 0, skippedTooBig: 0, missingFile: 0, failed: 0, verified: 0 };
const failures = [];
let processed = 0;
let aborted = null;

for (const e of sorted) {
  if (processed >= LIMIT) break;
  if (aborted) break;

  if (!fs.existsSync(e.file)) { stats.missingFile++; failures.push({ id: e.id, why: 'file missing', file: e.file }); continue; }
  const realSize = fs.statSync(e.file).size;
  if (realSize !== e.size) { stats.failed++; failures.push({ id: e.id, why: `size drift ${realSize} != ${e.size}` }); continue; }

  if (realSize >= MAX_BYTES) {
    stats.skippedTooBig++;
    failures.push({ id: e.id, why: `${(realSize / 1048576).toFixed(0)}MB exceeds 50MB object limit`, title: e.title });
    continue;
  }

  const key = `sermons/${e.id}${e.ext}`;
  const url = publicUrlOf(key);
  processed++;

  if (DRY) {
    console.log(`[dry-run] ${e.serviceDate || '????-??-??'} ${path.basename(e.file)} (${(realSize / 1048576).toFixed(1)}MB) -> ${key}`);
    continue;
  }

  // ---- upload (or resume if the object is already there with right size) ----
  const have = await exists(key);
  if (have === realSize) {
    stats.resumed++;
  } else {
    const buf = fs.readFileSync(e.file);
    const up = await fetch(`${U}/storage/v1/object/${BUCKET}/${key}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': MIME[e.ext] || 'application/octet-stream', 'x-upsert': 'true' },
      body: buf,
    });
    if (!up.ok) {
      const body = await up.text();
      stats.failed++;
      failures.push({ id: e.id, why: `upload ${up.status}: ${body.slice(0, 180)}`, title: e.title });
      console.error(`UPLOAD FAILED (${up.status}) ${e.title.slice(0, 50)}: ${body.slice(0, 200)}`);
      if (/Exceeded storage|allowance|Quota|402/.test(body)) {
        aborted = 'storage quota exceeded';
        break;
      }
      if (/Payload too large|EntityTooLarge/.test(body)) { continue; }
      continue;
    }
    stats.uploaded++;

    // ---- byte-for-byte verification for the first N ----
    if (stats.verified < VERIFY) {
      const got = await fetch(url);
      const back = Buffer.from(await got.arrayBuffer());
      const shaL = crypto.createHash('sha256').update(buf).digest('hex');
      const shaR = crypto.createHash('sha256').update(back).digest('hex');
      const equal = shaL === shaR && back.length === buf.length;
      console.log(`  verify ${equal ? 'OK  ' : 'FAIL'} sha256 ${shaR.slice(0, 16)}… (${back.length} bytes)`);
      if (!equal) { stats.failed++; failures.push({ id: e.id, why: 'hash mismatch after upload' }); continue; }
      stats.verified++;
    }
  }

  // ---- wire the DB row ----
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
fs.writeFileSync('scripts/upload-progress.json', JSON.stringify(summary, null, 2));
if (aborted) console.error(`\nABORTED: ${aborted}`);
