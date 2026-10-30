// Proof that the audio the app advertises is really there.
//
// Every sermon row whose `audio_url` is an http(s) URL must resolve to a real
// object with a real byte size — not a URL that merely looks plausible. Also
// reconciles the >=30 min "keep" set against what is actually wired.
//
// Exit code 1 if any advertised URL is broken, so it can gate CI.
//
// Usage: node scripts/verify-audio.mjs [--quiet]
import fs from 'fs';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !K) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const H = { apikey: K, Authorization: `Bearer ${K}` };

// --- every sermon row ---
const all = [];
for (let from = 0; from < 20000; from += 1000) {
  const r = await fetch(`${U}/rest/v1/sermons?select=id,title,date,audio_url`, {
    headers: { ...H, Range: `${from}-${from + 999}` },
  });
  if (!r.ok) {
    console.error(`sermons fetch failed: ${r.status} ${(await r.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const j = await r.json();
  all.push(...j);
  if (j.length < 1000) break;
}

const wired = all.filter((s) => /^https?:\/\//i.test(s.audio_url || ''));
console.log(`sermons: ${all.length} total | ${wired.length} with an http(s) audio_url | ${all.length - wired.length} placeholder`);

// --- HEAD every advertised URL (bounded concurrency) ---
async function head(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return { status: r.status, len: parseInt(r.headers.get('content-length') || '0', 10), type: r.headers.get('content-type') };
  } catch (e) {
    return { status: 'ERR', len: 0, error: String(e?.message || e) };
  }
}
const results = [];
const CONCURRENCY = 12;
for (let i = 0; i < wired.length; i += CONCURRENCY) {
  const batch = wired.slice(i, i + CONCURRENCY);
  const rs = await Promise.all(batch.map((s) => head(s.audio_url)));
  batch.forEach((s, j) => results.push({ ...s, ...rs[j] }));
}

const ok = results.filter((r) => r.status === 200 && r.len > 0);
const bad = results.filter((r) => !(r.status === 200 && r.len > 0));
const bytes = ok.reduce((a, r) => a + r.len, 0);
const hosts = {};
for (const r of ok) {
  const h = new URL(r.audio_url).host;
  hosts[h] = (hosts[h] || 0) + 1;
}

console.log(`\nresolved to real bytes : ${ok.length}/${wired.length}`);
console.log(`total bytes served     : ${(bytes / 1073741824).toFixed(2)} GB (${Math.round(bytes / 1048576)} MB)`);
console.log('by host                :', hosts);

if (bad.length) {
  console.log(`\nBROKEN (${bad.length}):`);
  for (const b of bad.slice(0, 25)) {
    console.log(`  ${b.status} len=${b.len} | ${(b.title || '').slice(0, 55)} | ${b.audio_url}`);
  }
}

// --- reconcile the >=30min keep set, when the duration map is present ---
if (fs.existsSync('scripts/audio-durations.json') && fs.existsSync('scripts/audio-manifest.json')) {
  const durs = JSON.parse(fs.readFileSync('scripts/audio-durations.json', 'utf8'));
  const manifest = JSON.parse(fs.readFileSync('scripts/audio-manifest.json', 'utf8'));
  const byId = new Map(all.map((s) => [s.id, s]));
  const mfById = new Map(manifest.map((m) => [m.id, m]));
  const keep = durs.filter((d) => d.keep);
  const wiredKeep = keep.filter((d) => /^https?:\/\//i.test(byId.get(d.id)?.audio_url || ''));
  const keepNotWired = keep.filter((d) => !/^https?:\/\//i.test(byId.get(d.id)?.audio_url || ''));
  const keepIds = new Set(keep.map((d) => d.id));
  const wiredShort = wired.filter((s) => mfById.has(s.id) && !keepIds.has(s.id));

  console.log(`\nkeep set (>=30 min)    : ${keep.length} | wired ${wiredKeep.length} | not wired ${keepNotWired.length}`);
  for (const k of keepNotWired.slice(0, 10)) {
    const m = mfById.get(k.id);
    console.log(`  NOT WIRED: ${(byId.get(k.id)?.title || m?.title || '?').slice(0, 55)} | ${(k.duration / 60).toFixed(0)} min | ${m ? Math.round(m.size / 1048576) : '?'} MB`);
  }
  if (wiredShort.length) {
    console.log(`wired rows outside the keep set (short clips still live): ${wiredShort.length}`);
  }
}

process.exit(bad.length ? 1 : 0);
