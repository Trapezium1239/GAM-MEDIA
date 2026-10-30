const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});
const BUCKET = env.R2_BUCKET_NAME;
const PUBLIC = (env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '');

const FOLDER = 'C:/Users/henry/Music/YORUBA BIBLE';
const MANIFEST = 'C:/Users/henry/Desktop/GAM APP/public/yoruba-bible.json';

const BOOKS = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'];

// Parse entries
const files = fs.readdirSync(FOLDER).filter(f => /\.mp3$/i.test(f));
const entries = [];
for (const f of files) {
  const m = f.match(/^\((\d+)\)\s*(.+?)\s+(\d+)\.mp3$/i);
  if (!m) { console.warn('SKIP (unparsed):', f); continue; }
  const bookNum = parseInt(m[1], 10);
  const yorubaName = m[2].trim();
  const chapter = parseInt(m[3], 10);
  const bookIndex = bookNum - 1;
  const bookName = BOOKS[bookIndex] || `Book ${bookNum}`;
  const key = `yoruba-bible/b${String(bookIndex).padStart(2,'0')}_c${String(chapter).padStart(3,'0')}.mp3`;
  const url = `${PUBLIC}/${key}`;
  entries.push({ bookIndex, bookName, yorubaName, chapter, key, url, localFile: f });
}
entries.sort((a,b) => a.bookIndex - b.bookIndex || a.chapter - b.chapter);
console.log('Parsed entries:', entries.length);

// Group by book for manifest
const booksMap = new Map();
for (const e of entries) {
  if (!booksMap.has(e.bookIndex)) booksMap.set(e.bookIndex, { index: e.bookIndex, name: e.bookName, yorubaName: e.yorubaName, chapters: [] });
  booksMap.get(e.bookIndex).chapters.push({ chapter: e.chapter, url: e.url });
}
const manifest = {
  language: 'yoruba',
  label: 'Yoruba Audio Bible',
  books: Array.from(booksMap.values()).sort((a,b)=>a.index-b.index),
};
fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
console.log('Manifest written:', MANIFEST, 'books:', manifest.books.length);

// Upload
const stats = { uploaded: 0, resumed: 0, failed: 0, verified: 0 };
const failures = [];
async function uploadOne(e) {
  const localPath = path.join(FOLDER, e.localFile);
  const size = fs.statSync(localPath).size;
  let have = null;
  try { const h = await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: e.key })); have = h.ContentLength; } catch {}
  if (have === size) { stats.resumed++; return; }
  const buf = fs.readFileSync(localPath);
  try {
    await R2.send(new PutObjectCommand({ Bucket: BUCKET, Key: e.key, Body: buf, ContentType: 'audio/mpeg' }));
  } catch (err) { stats.failed++; failures.push({ key: e.key, why: err?.message }); console.error('FAIL', e.key, err?.message); return; }
  stats.uploaded++;
  if (stats.verified < 3) {
    const got = await fetch(e.url);
    const back = Buffer.from(await got.arrayBuffer());
    const shaL = crypto.createHash('sha256').update(buf).digest('hex');
    const shaR = crypto.createHash('sha256').update(back).digest('hex');
    const equal = shaL === shaR && back.length === buf.length;
    console.log(`  verify ${equal?'OK':'FAIL'} ${e.key} (${back.length} bytes)`);
    if (equal) stats.verified++;
    else { stats.failed++; failures.push({ key: e.key, why: 'hash mismatch' }); }
  }
  if ((stats.uploaded + stats.resumed) % 25 === 0) console.log(`progress: uploaded=${stats.uploaded} resumed=${stats.resumed} failed=${stats.failed}`);
}
(async () => {
  const batch = 5;
  for (let i = 0; i < entries.length; i += batch) {
    await Promise.all(entries.slice(i, i+batch).map(uploadOne));
  }
  console.log('=== SUMMARY ===', JSON.stringify({ ...stats, failures: failures.length }, null, 2));
  if (failures.length) console.log('failures:', JSON.stringify(failures.slice(0,20)));
  fs.writeFileSync('scripts/yoruba-audio-progress.json', JSON.stringify({ ...stats, failures }, null, 2));
})();
