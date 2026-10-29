import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const manifest = JSON.parse(fs.readFileSync('scripts/audio-manifest.json', 'utf8'));

let done = [];
if (fs.existsSync('scripts/audio-durations.json')) {
  try { done = JSON.parse(fs.readFileSync('scripts/audio-durations.json', 'utf8')); } catch { done = []; }
}
const doneIds = new Set(done.map((d) => d.id));

const out = [...done];
let i = done.length;
for (const e of manifest) {
  if (doneIds.has(e.id)) continue;
  i++;
  if (!fs.existsSync(e.file)) { out.push({ id: e.id, file: e.file, duration: null, keep: false, reason: 'missing' }); doneIds.add(e.id); continue; }
  try {
    const raw = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', e.file], { encoding: 'utf8', timeout: 20000 });
    const dur = parseFloat(raw.trim());
    out.push({ id: e.id, file: e.file, duration: isNaN(dur) ? null : dur, keep: !isNaN(dur) && dur >= 1800 });
  } catch (err) {
    out.push({ id: e.id, file: e.file, duration: null, keep: false, reason: String(err?.message || err).slice(0, 120) });
  }
  doneIds.add(e.id);
  if (i % 50 === 0) {
    fs.writeFileSync('scripts/audio-durations.json', JSON.stringify(out, null, 2));
    console.log(`processed ${i}/${manifest.length}`);
  }
}
fs.writeFileSync('scripts/audio-durations.json', JSON.stringify(out, null, 2));
const keep = out.filter((x) => x.keep).length;
console.log(`done. total=${out.length} keep(>=30min)=${keep} drop=${out.length - keep}`);
