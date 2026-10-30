// Data repair for `sermons`, two idempotent phases:
//
//   dates       708 rows carry the import date (2026-*) instead of the real
//               service date. 690 of them state the date in the title
//               ("17TH OCTOBER 2023: ..." -> 2023-10-17). Without this the
//               app's `order=date.desc` list surfaces only import-dated rows,
//               so freshly uploaded audio never appears at the top.
//
//   duplicates  440 titles occur more than once (484 surplus rows). Only one
//               real file exists per title, so every row sharing that title
//               gets the same real audio URL instead of leaving the copies
//               dead with the placeholder.
//
// Usage:
//   node scripts/fix-sermon-metadata.mjs --dry-run
//   node scripts/fix-sermon-metadata.mjs --dates-only
//   node scripts/fix-sermon-metadata.mjs --duplicates-only
//   node scripts/fix-sermon-metadata.mjs
import fs from 'fs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const DATES_ONLY = args.includes('--dates-only');
const DUPS_ONLY = args.includes('--duplicates-only');
const runDates = !DUPS_ONLY;
const runDups = !DATES_ONLY;

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}` };

const MONTHS = 'JANUARY FEBRUARY MARCH APRIL MAY JUNE JULY AUGUST SEPTEMBER OCTOBER NOVEMBER DECEMBER'.split(' ');
const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function titleDate(title) {
  // Normalise classic OCR/typing slips: "2O21" -> "2021", "2O24" -> "2024".
  const u = (title || '').toUpperCase().replace(/(\d)O(\d)/g, (_, a, b) => `${a}0${b}`);
  let m = u.match(/(\d{1,2})\s*(?:ST|ND|RD|TH)?\s+(?:OF\s+)?([A-Z]{3,9})[A-Z]*\s*,?\s*([0-9]{4})/);
  if (m) {
    let year = Number(m[3]);
    // "2921"/"2924" are keying slips for 2021/2024 (9 vs 0 on a keypad).
    if (year >= 2900 && year <= 2930) year -= 900;
    if (year < 2000 || year > 2030) return null;
    const y = String(year);
    const i = MONTHS.indexOf(m[2]);
    if (i >= 0) return `${y}-${String(i + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    const j = MONTH_ABBR.indexOf(m[2].slice(0, 3));
    if (j >= 0 && m[2].length <= 4) return `${y}-${String(j + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    return null;
  }
  // "19TH SEPT 2021", "2024-02-20", "20 feb 2024"
  m = u.match(/(\d{1,2})[-\/ ](JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[-\/ ]([0-9]{4})/);
  if (m) {
    let year = Number(m[3]);
    if (year >= 2900 && year <= 2930) year -= 900;
    if (year < 2000 || year > 2030) return null;
    return `${year}-${String(MONTH_ABBR.indexOf(m[2]) + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  }
  m = u.match(/([0-9]{4})[-\/ ](\d{1,2})[-\/ ](\d{1,2})/);
  if (m) {
    const year = Number(m[1]);
    if (year < 2000 || year > 2030) return null;
    return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  }
  return null;
}

const norm = (s) => (s || '').toUpperCase().replace(/^AUDIO:\s*/, '').replace(/[^A-Z0-9]+/g, ' ').trim();

async function patch(id, body) {
  if (DRY) return { ok: true, dry: true };
  const r = await fetch(`${U}/rest/v1/sermons?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, status: r.status, body: (await r.text()).slice(0, 160) };
  return { ok: true };
}

const all = [];
for (let from = 0; from < 6000; from += 1000) {
  const j = await (await fetch(`${U}/rest/v1/sermons?select=id,title,date,audio_url,r2_key`, { headers: { ...H, Range: `${from}-${from + 1000}` } })).json();
  all.push(...j);
  if (j.length < 1000) break;
}
console.log(`loaded ${all.length} sermons`);

// ---------- phase 1: dates ----------
if (runDates) {
  const plan = [];
  for (const s of all) {
    if (!(s.date || '').startsWith('2026')) continue;
    const td = titleDate(s.title);
    if (td && td !== s.date) plan.push({ id: s.id, from: s.date, to: td, title: s.title });
  }
  console.log(`\n[dates] rows to correct: ${plan.length}${DRY ? ' (dry run)' : ''}`);
  let ok = 0;
  const errs = [];
  for (const p of plan) {
    const r = await patch(p.id, { date: p.to });
    if (r.ok) ok++; else errs.push({ ...p, err: r });
  }
  console.log(`[dates] updated ${ok}/${plan.length}${errs.length ? `, errors: ${errs.length}` : ''}`);
  if (errs.length) console.log('  first error:', JSON.stringify(errs[0]).slice(0, 300));
  const sample = plan.slice(0, 5);
  for (const s of sample) console.log(`  ${s.from} -> ${s.to}  ${(s.title || '').slice(0, 52)}`);
}

// ---------- phase 2: duplicates ----------
if (runDups) {
  const groups = new Map();
  for (const s of all) {
    const k = norm(s.title);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  }
  const plan = [];
  let dupGroups = 0;
  for (const [, g] of groups) {
    if (g.length < 2) continue;
    dupGroups++;
    const donor = g.find((x) => (x.audio_url || '').startsWith('http'));
    if (!donor) continue; // nobody in this group has real audio yet
    for (const x of g) {
      if (x.id === donor.id) continue;
      if ((x.audio_url || '') === donor.audio_url) continue;
      plan.push({ id: x.id, url: donor.audio_url, donorId: donor.id });
    }
  }
  console.log(`\n[duplicates] titles appearing >1x: ${dupGroups}; rows to wire: ${plan.length}${DRY ? ' (dry run)' : ''}`);
  // group by target url so each PATCH covers many ids
  const byUrl = new Map();
  for (const p of plan) { if (!byUrl.has(p.url)) byUrl.set(p.url, []); byUrl.get(p.url).push(p.id); }
  let ok = 0, errs = 0;
  for (const [url, ids] of byUrl) {
    if (DRY) { ok += ids.length; continue; }
    const r = await fetch(`${U}/rest/v1/sermons?id=in.(${ids.join(',')})`, {
      method: 'PATCH',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ audio_url: url, r2_key: url }),
    });
    if (r.ok) ok += ids.length; else { errs += ids.length; console.error(`  batch failed ${r.status}: ${(await r.text()).slice(0, 160)}`); }
  }
  console.log(`[duplicates] wired ${ok}/${plan.length}${errs ? `, errors: ${errs}` : ''}`);
}

// ---------- final state ----------
const check = [];
for (let from = 0; from < 6000; from += 1000) {
  const j = await (await fetch(`${U}/rest/v1/sermons?select=id,date,audio_url`, { headers: { ...H, Range: `${from}-${from + 1000}` } })).json();
  check.push(...j);
  if (j.length < 1000) break;
}
const stamped = check.filter((s) => (s.date || '').startsWith('2026')).length;
const wired = check.filter((s) => (s.audio_url || '').startsWith('http')).length;
const top = [...check].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const top200 = top.slice(0, 200).filter((s) => (s.audio_url || '').startsWith('http')).length;
console.log(`\nstate -> import-dated rows: ${stamped} | rows with real audio: ${wired} | of top 200 by date: ${top200} wired`);
