import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXPORT_DIR = 'C:/Users/henry/Downloads/Telegram Desktop/ChatExport_2026-10-11/files';
const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.ogg', '.wav', '.opus', '.aac', '.mpeg']);
const LIMIT = parseInt(process.env.UPLOAD_LIMIT || '0', 10) || Infinity;

function words(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
}

async function main() {
  console.log('🚀 Uploading audio to Supabase Storage (bucket: church-media)\n');

  const files = fs.readdirSync(EXPORT_DIR).filter((f) => AUDIO_EXTS.has(path.extname(f).toLowerCase()));
  console.log(`Found ${files.length} audio files in export`);

  // Load sermons needing audio
  const { data: sermons, error: sErr } = await supabase
    .from('sermons')
    .select('id, title, audio_url')
    .or('audio_url.is.null,audio_url.eq.audio/default-placeholder.mp3');
  if (sErr) throw sErr;
  console.log(`Sermons needing audio: ${sermons?.length ?? 0}`);

  const pool = [...(sermons ?? [])];
  const usedSermonIds = new Set<string>();

  let uploaded = 0;
  let matched = 0;
  let skipped = 0;
  const toProcess = files.slice(0, LIMIT);

  for (const file of toProcess) {
    const localPath = path.join(EXPORT_DIR, file);
    const fileWords = words(file);

    // find best matching sermon
    let best: { id: string; title: string } | null = null;
    let bestScore = 0;
    for (const s of pool) {
      if (usedSermonIds.has(s.id)) continue;
      const sermonWords = words(s.title);
      let score = 0;
      for (const w of sermonWords) {
        if (fileWords.some((fw) => fw.includes(w) || w.includes(fw))) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }

    if (!best || bestScore < 2) {
      skipped++;
      continue;
    }

    const safeName = file.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `sermons/${Date.now()}-${safeName}`;

    const fileBuffer = fs.readFileSync(localPath);
    const { data: upData, error: upErr } = await supabase.storage
      .from('church-media')
      .upload(storagePath, fileBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (upErr) {
      console.error(`❌ Upload failed ${file}:`, upErr.message);
      skipped++;
      continue;
    }

    const { data: urlData } = supabase.storage.from('church-media').getPublicUrl(upData.path);
    const publicUrl = urlData.publicUrl;

    const { error: updErr } = await supabase
      .from('sermons')
      .update({ audio_url: publicUrl, r2_key: publicUrl })
      .eq('id', best.id);

    if (updErr) {
      console.error(`❌ DB update failed ${best.title.slice(0, 40)}:`, updErr.message);
      skipped++;
      continue;
    }

    usedSermonIds.add(best.id);
    uploaded++;
    matched++;
    console.log(`✅ ${matched}: ${best.title.slice(0, 50)} <- ${file.slice(0, 40)}`);
  }

  console.log(`\n📊 Done. Uploaded+matched: ${matched}, skipped: ${skipped}, processed: ${toProcess.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
