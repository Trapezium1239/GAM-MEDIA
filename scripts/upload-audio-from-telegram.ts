import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXPORT_DIR = 'C:/Users/henry/Downloads/Telegram Desktop/ChatExport_2026-10-11';
const FILES_DIR = path.join(EXPORT_DIR, 'files');
const RESULT_JSON = path.join(EXPORT_DIR, 'result.json');
const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.ogg', '.wav', '.opus', '.aac', '.mpeg']);
const LIMIT = parseInt(process.env.UPLOAD_LIMIT || '0', 10) || Infinity;

interface TgMsg { id: number; type: string; date: string; from?: string; file?: string; file_name?: string; media_type?: string; text?: string | any[]; }

function textOf(m: TgMsg): string {
  const t = m.text;
  if (Array.isArray(t)) return t.map((x: any) => (typeof x === 'string' ? x : x.text || '')).join('');
  return String(t || '');
}

function words(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
}

async function main() {
  console.log('Uploading audio via Telegram result.json mapping\n');

  const data = JSON.parse(fs.readFileSync(RESULT_JSON, 'utf8'));
  const msgs: TgMsg[] = data.messages || [];
  const audioMsgs = msgs.filter((m) => m.file && m.media_type === 'audio_file');
  console.log(`Audio messages in export: ${audioMsgs.length}`);

  const { data: sermons, error: sErr } = await supabase
    .from('sermons')
    .select('id, title, date, audio_url')
    .or('audio_url.is.null,audio_url.eq.audio/default-placeholder.mp3');
  if (sErr) throw sErr;
  console.log(`Sermons needing audio: ${sermons?.length ?? 0}`);

  const usedSermonIds = new Set<string>();
  let matched = 0, skipped = 0;
  const toProcess = audioMsgs.slice(0, LIMIT);

  for (const m of toProcess) {
    const relFile = m.file!;
    const fileName = path.basename(relFile);
    const ext = path.extname(fileName).toLowerCase();
    if (!AUDIO_EXTS.has(ext)) { skipped++; continue; }

    const localPath = path.join(EXPORT_DIR, relFile);
    if (!fs.existsSync(localPath)) { skipped++; continue; }

    const title = textOf(m).trim();
    const msgDate = m.date ? m.date.slice(0, 10) : null;

    let best: any = null;
    let bestScore = 0;
    for (const s of sermons ?? []) {
      if (usedSermonIds.has(s.id)) continue;
      const sw = words(s.title);
      const tw = words(title);
      let score = 0;
      for (const w of sw) {
        if (tw.some((fw) => fw.includes(w) || w.includes(fw))) score++;
      }
      if (msgDate && s.date === msgDate) score += 3;
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }

    if (!best || bestScore < 2) {
      skipped++;
      continue;
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `sermons/${Date.now()}-${safeName}`;

    const fileBuffer = fs.readFileSync(localPath);
    const { data: upData, error: upErr } = await supabase.storage
      .from('church-media')
      .upload(storagePath, fileBuffer, { contentType: 'audio/mpeg', upsert: false });

    if (upErr) {
      console.error(`Upload failed ${fileName}:`, upErr.message);
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
      console.error(`DB update failed:`, updErr.message);
      skipped++;
      continue;
    }

    usedSermonIds.add(best.id);
    matched++;
    console.log(`OK ${matched}: ${best.title.slice(0, 50)} <- ${fileName.slice(0, 40)} (score ${bestScore})`);
  }

  console.log(`\nDone. Matched+uploaded: ${matched}, skipped: ${skipped}, processed: ${toProcess.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
