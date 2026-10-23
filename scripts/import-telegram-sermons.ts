import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { format, isValid } from 'date-fns';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TELEGRAM_DESKTOP_DIR = 'C:/Users/henry/Downloads/Telegram Desktop';

const EXPORT_DIRS = [
  path.join(TELEGRAM_DESKTOP_DIR, 'ChatExport_2026-10-11'),
  path.join(TELEGRAM_DESKTOP_DIR, 'ChatExport_2026-10-16'),
  path.join(TELEGRAM_DESKTOP_DIR, 'ChatExport_2026-10-16 (1)'),
];

interface RawMessage {
  id?: number;
  type?: string;
  date?: string;
  from?: string;
  text?: string | any[];
  rawText?: string;
  dateStr?: string;
}

function parseJsonExport(exportDir: string): RawMessage[] {
  const jsonPath = path.join(exportDir, 'result.json');
  if (!fs.existsSync(jsonPath)) return [];
  console.log(`📂 Parsing JSON export: ${exportDir}`);
  const raw = fs.readFileSync(jsonPath, 'utf8');
  let data: any;
  try { data = JSON.parse(raw); } catch { console.warn(`⚠️ Could not parse ${jsonPath}`); return []; }
  return (data.messages || []).map((m: any) => ({
    id: m.id, type: m.type, date: m.date, from: m.from, text: m.text,
  }));
}

function parseHtmlExport(exportDir: string): RawMessage[] {
  const htmlFiles = ['messages.html', 'messages2.html', 'messages3.html'];
  const messages: RawMessage[] = [];
  let total = 0;
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(exportDir, htmlFile);
    if (!fs.existsSync(htmlPath)) continue;
    console.log(`📂 Parsing HTML export: ${htmlFile}`);
    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);
    $('.message.default').each((_, el) => {
      const text = $(el).find('.text').text().trim();
      const dateStr = $(el).find('.pull_right.date.details').attr('title');
      const from = $(el).find('.from_name').text().trim() || undefined;
      if (text || dateStr) {
        messages.push({ rawText: text, dateStr, from });
        total++;
      }
    });
  }
  console.log(`   Found ${total} messages`);
  return messages;
}

function extractSermonInfo(msg: RawMessage): { title: string; preacher: string } | null {
  const text = msg.text ?? msg.rawText ?? '';
  const textStr = Array.isArray(text) ? text.map((t: any) => (typeof t === 'string' ? t : t.text || '')).join('') : String(text);
  if (!textStr || textStr.length < 5) return null;
  const skip = /^(voice message|audio|video|photo|sticker|contact|location|not included)/i;
  if (skip.test(textStr.trim())) return null;
  const from = msg.from ?? 'GAM';
  const title = textStr.trim().slice(0, 200);
  const preacher = from.trim().slice(0, 100) || 'GAM';
  return { title, preacher };
}

function parseSermonDate(msg: RawMessage): Date | null {
  if (msg.date) { const d = new Date(msg.date); if (isValid(d)) return d; }
  if (msg.dateStr) {
    const m = msg.dateStr.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
    if (m) { const d = new Date(`${m[3]}-${m[2]}-${m[1]}`); if (isValid(d)) return d; }
    const d = new Date(msg.dateStr);
    if (isValid(d)) return d;
  }
  return null;
}

async function main() {
  console.log('🚀 Starting Telegram sermon import...\n');

  const allMessages: RawMessage[] = [];
  for (const dir of EXPORT_DIRS) {
    if (!fs.existsSync(dir)) { console.log(`ℹ️ Skipping missing: ${dir}`); continue; }
    const jsonMsgs = parseJsonExport(dir);
    if (jsonMsgs.length > 0) { allMessages.push(...jsonMsgs); }
    else { const htmlMsgs = parseHtmlExport(dir); allMessages.push(...htmlMsgs); }
  }

  console.log(`\n📊 Total raw messages: ${allMessages.length}`);

  let { data: topic } = await supabase.from('topics').select('id').eq('slug', 'sermon').single();
  if (!topic) {
    const { data: newTopic, error: topicError } = await supabase.from('topics').insert({ name: 'Sermon', slug: 'sermon' }).select('id').single();
    if (topicError) throw topicError;
    topic = newTopic;
    console.log(`📌 Created topic: Sermon (${topic.id})`);
  } else {
    console.log(`📌 Using topic: Sermon (${topic.id})`);
  }

  const seen = new Set<string>();
  const sermons: { title: string; preacher: string; date: string; topic_id: string }[] = [];

  for (const msg of allMessages) {
    const info = extractSermonInfo(msg);
    if (!info) continue;
    const date = parseSermonDate(msg);
    if (!date) continue;
    const dateStr = format(date, 'yyyy-MM-dd');
    const dedupKey = `${info.title.toLowerCase()}|${dateStr}|${info.preacher.toLowerCase()}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    sermons.push({ title: info.title, preacher: info.preacher, date: dateStr, topic_id: topic.id });
  }

  console.log(`\n🎯 Unique sermons to import: ${sermons.length}`);

  let imported = 0;
  let skipped = 0;

  for (const s of sermons) {
    const { data: existing } = await supabase.from('sermons').select('id').eq('title', s.title).eq('date', s.date).maybeSingle();
    if (existing) { skipped++; continue; }
    const { error } = await supabase.from('sermons').insert({
      title: s.title, preacher: s.preacher, date: s.date, topic_id: s.topic_id,
      audio_url: null, video_link: null, notes: null,
      r2_key: 'audio/default-placeholder.mp3',
    });
    if (error) { console.error(`❌ Failed "${s.title}":`, error.message); skipped++; }
    else { imported++; if (imported % 100 === 0) console.log(`   ...imported ${imported}/${sermons.length}`); }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped (duplicates/errors): ${skipped}`);
}

main().catch(console.error);