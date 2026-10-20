// Converts BibleNLP ebible corpus .txt files (verse-per-line, aligned with
// metadata/vref.txt) into the app's bundled JSON schema:
//   { translation, books: [{ name, chapters: [{ chapter, verses: [{ verse, text }]}]}] }
// Run: node scripts/convert-ebible.js
// Inputs : scripts/tmp-ebible/{ibo-ibo,yor-yor,hau-hausa}.txt + vref.txt
// Outputs: public/bible/{igbo,yoruba,hausa}.json
const fs = require('fs');
const path = require('path');

const TMP = path.join(__dirname, 'tmp-ebible');
const OUT = path.join(__dirname, '..', 'public', 'bible');

// 3-letter code (vref) -> index + English name, derived from bundled KJV so
// book order/names match the existing translations exactly.
const kjv = JSON.parse(fs.readFileSync(path.join(OUT, 'kjv.json'), 'utf8'));
const BOOKS = kjv.books.map((b, i) => ({ index: i, name: b.name }));

// Manual 3-lettercode mapping. KJV order: Genesis..Revelation.
const CODE_ORDER = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI',
  '1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER',
  'LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP',
  'HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL',
  'EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE',
  '2PE','1JN','2JN','3JN','JUD','REV',
];
if (CODE_ORDER.length !== BOOKS.length) {
  throw new Error('CODE_ORDER length ' + CODE_ORDER.length + ' != KJV books ' + BOOKS.length);
}
const CODE_TO_BOOK = {};
CODE_ORDER.forEach((code, i) => { CODE_TO_BOOK[code] = BOOKS[i]; });

const JOBS = [
  { src: 'ibo-ibo.txt', out: 'igbo.json', label: 'Igbo Contemporary Bible', id: 'igbo' },
  { src: 'yor-yor.txt', out: 'yoruba.json', label: 'Yoruba Contemporary Bible', id: 'yoruba' },
  { src: 'hau-hausa.txt', out: 'hausa.json', label: 'Hausa Contemporary Bible', id: 'hausa' },
];

const vref = fs.readFileSync(path.join(TMP, 'vref.txt'), 'utf8').split('\n');

for (const job of JOBS) {
  const lines = fs.readFileSync(path.join(TMP, job.src), 'utf8').split('\n');
  // books[i] -> Map<chapter, Map<verse, text[]>>
  const acc = BOOKS.map(() => new Map());
  let used = 0, skipped = 0, blank = 0;
  const n = Math.min(lines.length, vref.length);
  for (let i = 0; i < n; i++) {
    const ref = (vref[i] || '').trim();
    const m = ref.match(/^([A-Z0-9]+)\s+(\d+):(\d+)$/);
    if (!m) { skipped++; continue; }
    const book = CODE_TO_BOOK[m[1]];
    if (!book) { skipped++; continue; }
    const text = (lines[i] || '').replace(/\r/g, '').trim();
    if (!text) { blank++; continue; }
    const ch = parseInt(m[2], 10), vs = parseInt(m[3], 10);
    let chap = acc[book.index].get(ch);
    if (!chap) { chap = new Map(); acc[book.index].set(ch, chap); }
    if (!chap.get(vs)) chap.set(vs, []);
    chap.get(vs).push(text);
    used++;
  }
  const books = BOOKS.map((b, i) => ({
    name: b.name,
    chapters: [...acc[i].entries()]
      .sort((a, c) => a[0] - c[0])
      .map(([ch, verses]) => ({
        chapter: ch,
        verses: [...verses.entries()]
          .sort((a, c) => a[0] - c[0])
          .map(([vs, parts]) => ({ verse: vs, text: parts.join(' ') })),
      })),
  }));
  const totalVerses = books.reduce((s, b) => s + b.chapters.reduce((x, c) => x + c.verses.length, 0), 0);
  const out = { translation: job.label, books };
  fs.writeFileSync(path.join(OUT, job.out), JSON.stringify(out));
  console.log(job.out + ': used=' + used + ' skipped=' + skipped + ' blank=' + blank +
    ' books=' + books.length + ' verses=' + totalVerses +
    ' bytes=' + fs.statSync(path.join(OUT, job.out)).size);
}
console.log('DONE');
