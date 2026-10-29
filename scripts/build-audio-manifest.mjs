// Builds scripts/audio-manifest.json: the authoritative link between a DB
// sermon row and a real audio file on disk.
//
// Matching, strongest first:
//   1. exact normalized title match against a message that has a file
//   2. same service date (from the title) + Dice coefficient >= 0.55
// Every entry carries the file's byte size so the uploader can verify it is
// uploading exactly what the manifest claims exists.
import fs from 'fs';
import path from 'path';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY;
const h = { apikey: K, Authorization: `Bearer ${K}` };

const DL = 'C:/Users/henry/Downloads/Telegram Desktop';
const EXPORTS = [`${DL}/ChatExport_2026-10-11`, `${DL}/ChatExport_2026-10-16 (1)`];
const AUDIO_RE = /\.(mp3|m4a|mp4|ogg|opus|wav|aac|amr|mpeg|webm)$/i;
const MONTHS = 'JANUARY FEBRUARY MARCH APRIL MAY JUNE JULY AUGUST SEPTEMBER OCTOBER NOVEMBER DECEMBER'.split(' ');

const norm = (s) => (s || '').toUpperCase().replace(/^AUDIO:\s*/, '').replace(/[^A-Z0-9]+/g, ' ').trim();
function dateKey(s) {
  const m = norm(s).match(/(\d{1,2})\s*(ST|ND|RD|TH)?\s+([A-Z]+)\s*,?\s*(20\d\d)/);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[3]);
  if (mi < 0) return null;
  return `${m[4]}-${String(mi + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
}
function bigrams(s) { const t = s.replace(/\s+/g, ''); const o = []; for (let i = 0; i < t.length - 1; i++) o.push(t.slice(i, i + 2)); return o; }
function dice(a, b) {
  const A = bigrams(a), B = bigrams(b);
  if (!A.length || !B.length) return 0;
  const bc = new Map();
  for (const x of B) bc.set(x, (bc.get(x) || 0) + 1);
  let hit = 0;
  for (const x of A) { const c = bc.get(x) || 0; if (c > 0) { hit++; bc.set(x, c - 1); } }
  return (2 * hit) / (A.length + B.length);
}

// ---- 1. every real file on disk ----
const byBase = new Map();
for (const ex of EXPORTS) {
  for (const sub of ['files', 'voice_messages']) {
    const root = path.join(ex, sub);
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const d = stack.pop();
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (AUDIO_RE.test(e.name)) {
          const key = e.name.toLowerCase();
          const size = fs.statSync(full).size;
          const cur = byBase.get(key);
          if (!cur || size > cur.size) byBase.set(key, { path: full, size }); // prefer ChatExport_2026-10-11 copy
        }
      }
    }
  }
}
console.log(`real audio files on disk: ${byBase.size}`);

// ---- 2. every message that has a file ----
const raw = fs.readFileSync('scripts/telegram-export.json', 'utf8');
const msgs = [];
{ // result.json is truncated: recover records by regex, don't parse whole doc
  const re = /"id":\s*(\d+),[\s\S]{0,600}?"file":\s*"([^"]+)"[\s\S]{0,900}?"text":\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(raw))) {
    let text = m[3];
    try { text = JSON.parse(`"${text}"`); } catch { /* keep raw */ }
    msgs.push({ id: m[1], file: m[2], text });
  }
}
// HTML exports (cover voice_messages the JSON scan may order differently)
for (const ex of EXPORTS) {
  for (const page of ['messages.html', 'messages2.html', 'messages3.html']) {
    const f = path.join(ex, page);
    if (!fs.existsSync(f)) continue;
    const s = fs.readFileSync(f, 'utf8');
    for (const part of s.split(/(?=<div class="message(?: |"))/)) {
      const href = part.match(/href="((?:files|voice_messages)\/[^"]+)"/);
      if (!href) continue;
      const text = part.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      msgs.push({ id: 'html', file: href[1], text });
    }
  }
}
const audioMsgs = msgs.filter((m) => AUDIO_RE.test(m.file) && byBase.has(path.posix.basename(m.file).toLowerCase()));
console.log(`messages with a real file on disk: ${audioMsgs.length}`);

const byTitle = new Map();
const byDate = new Map();
for (const m of audioMsgs) {
  const k = norm(m.text);
  const f = byBase.get(path.posix.basename(m.file).toLowerCase());
  const entry = { file: f.path, size: f.size, msgTitle: m.text.trim() };
  if (k && !byTitle.has(k)) byTitle.set(k, entry);
  const d = dateKey(m.text);
  if (d) { if (!byDate.has(d)) byDate.set(d, []); byDate.get(d).push({ ...entry, k }); }
}

// ---- 3. every DB sermon ----
const db = [];
for (let from = 0; from < 6000; from += 1000) {
  const r = await fetch(`${U}/rest/v1/sermons?select=id,title,date,audio_url`, {
    headers: { ...h, Range: `${from}-${from + 999}` },
  });
  const j = await r.json();
  db.push(...j);
  if (j.length < 1000) break;
}
console.log(`DB sermons: ${db.length}`);

// ---- 4. match ----
const manifest = [];
let exact = 0, fuzzy = 0, unmatched = 0;
const usedFiles = new Set();
for (const d of db) {
  const k = norm(d.title);
  let hit = null, method = null;
  const e = byTitle.get(k);
  if (e) { hit = e; method = 'exact'; exact++; }
  else {
    const dk = dateKey(d.title);
    let best = null, bestScore = 0;
    if (dk && byDate.has(dk)) {
      for (const c of byDate.get(dk)) {
        const sc = dice(k, c.k);
        if (sc > bestScore) { bestScore = sc; best = c; }
      }
    }
    if (best && bestScore >= 0.55) { hit = best; method = `fuzzy:${bestScore.toFixed(2)}`; fuzzy++; }
  }
  if (!hit) { unmatched++; continue; }
  // one file must not serve two different sermons
  const dupKey = hit.file.toLowerCase();
  if (usedFiles.has(dupKey)) { unmatched++; continue; }
  usedFiles.add(dupKey);
  const ext = path.extname(hit.file).toLowerCase();
  manifest.push({
    id: d.id,
    title: d.title,
    serviceDate: dateKey(d.title),
    file: hit.file,
    size: hit.size,
    ext,
    method,
    currentAudioUrl: d.audio_url,
  });
}

console.log(`\nmatched exactly : ${exact}`);
console.log(`matched fuzzily  : ${fuzzy}`);
console.log(`unmatched        : ${unmatched}`);
console.log(`manifest entries : ${manifest.length}`);

const overLimit = manifest.filter((m) => m.size >= 50 * 1048576);
const bytes = manifest.reduce((a, b) => a + b.size, 0);
console.log(`payload          : ${(bytes / 1073741824).toFixed(2)} GB across ${manifest.length} files`);
console.log(`over 50MB limit  : ${overLimit.length} -> ${overLimit.map((m) => path.basename(m.file) + ` (${(m.size / 1048576).toFixed(0)}MB)`).join(', ') || 'none'}`);

// sanity: every entry's file really exists with the stated size
let ok = 0;
for (const m of manifest) { try { if (fs.statSync(m.file).size === m.size) ok++; } catch { /* gone */ } }
console.log(`re-verified on disk: ${ok}/${manifest.length}`);

fs.writeFileSync('scripts/audio-manifest.json', JSON.stringify(manifest, null, 2));
console.log('-> scripts/audio-manifest.json');
