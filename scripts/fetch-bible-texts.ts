import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

interface BibleBook {
  book: string;
  chapters: { chapter: number; verses: { verse: number; text: string }[] }[];
}

const TRANSLATION_SOURCES = {
  kjv: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/kjv.json',
  asv: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/asv.json',
  web: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/web.json',
  ylt: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ylt.json',
} as const;

async function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      res.on('error', reject);
    });
  });
}

async function downloadAllTranslations() {
  const outputDir = path.join(process.cwd(), 'public', 'bible');
  fs.mkdirSync(outputDir, { recursive: true });

  const translations = ['kjv', 'asv', 'web', 'ylt'] as const;

  for (const translation of translations) {
    console.log(`Fetching ${translation.toUpperCase()}...`);
    try {
      const url = (TRANSLATION_SOURCES as Record<string, string>)[translation];
      if (!url) throw new Error(`No source URL for ${translation}`);
      const data = await fetchJson(url);
      const outputPath = path.join(process.cwd(), 'public', 'bible', `${translation}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(data));
      console.log(`Saved ${translation} to ${outputPath}`);
    } catch (error) {
      console.error(`Failed to fetch ${translation}:`, error);
    }
  }
}

downloadAllTranslations().catch(console.error);