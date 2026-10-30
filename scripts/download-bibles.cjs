// Download free English Bible JSONs from scrollmapper/bible_databases into public/bible/
const fs = require('fs');
const https = require('https');
const path = require('path');

const OUT = 'C:/Users/henry/Desktop/GAM APP/public/bible';
const BASE = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/';

const IDS = [
  'ACV','AKJV','ASV','Anderson','BBE','BSB','CPDV','DRC','Darby','Geneva1599',
  'Haweis','JPS','Jubilee2000','KJVPCE','LEB','LITV','MKJV','NHEB','NHEBJE',
  'NHEBME','Noyes','OEB','OEBcth','RLT','RNKJV','RWebster','Webster','YLT',
];

function download(name) {
  return new Promise((resolve, reject) => {
    const url = BASE + name + '.json';
    const out = path.join(OUT, name.toLowerCase() + '.json');
    if (fs.existsSync(out)) { console.log('SKIP (exists):', name); return resolve(); }
    const file = fs.createWriteStream(out);
    https.get(url, (res) => {
      if (res.statusCode !== 200) { file.close(); try { fs.unlinkSync(out); } catch(_){} return reject(new Error(name + ' HTTP ' + res.statusCode)); }
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log('OK:', name); resolve(); });
    }).on('error', (e) => { try { fs.unlinkSync(out); } catch(_){} reject(e); });
  });
}

(async () => {
  const batch = 6;
  for (let i = 0; i < IDS.length; i += batch) {
    const slice = IDS.slice(i, i + batch);
    await Promise.all(slice.map(download));
  }
  console.log('ALL DONE');
})();
