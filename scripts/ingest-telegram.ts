import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { parseFile } from 'music-metadata';
import { format, isValid } from 'date-fns';
import { uploadToR2 } from '../lib/r2';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SermonRecord {
  id: string;
  title: string;
  preacher: string;
  date: string;
  duration: string;
  r2_key: string;
  topic_name: string;
}

async function parseExportFolder(exportDir: string, messages: any[]) {
  const htmlPath = path.join(exportDir, 'messages.html');
  if (!fs.existsSync(htmlPath)) {
    console.warn(`⚠️ Warning: messages.html not found in ${exportDir}`);
    return;
  }

  console.log(`📂 Parsing export source: ${exportDir}`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  $('.message.default').each((_, el) => {
    const text = $(el).find('.text').text().trim();
    const dateStr = $(el).find('.pull_right.date_time').attr('title');
    const audioRelPath = $(el).find('.audio_file audio, .media_file.audio').attr('src');

    if (text || audioRelPath) {
      messages.push({
        rawText: text,
        dateStr,
        audioRelPath: audioRelPath ? path.join(exportDir, audioRelPath) : null,
      });
    }
  });
}

async function runMultiExportIngestion() {
  console.log('🚀 Starting Multi-Export Telegram Ingestion Pipeline...');

  const baseExportPath = path.join(process.cwd(), 'data/telegram-export');
  const exportFolders = [
    path.join(baseExportPath, 'chat-export-1'),
    path.join(baseExportPath, 'chat-export-2'),
  ];

  const allMessages: any[] = [];
  for (const folder of exportFolders) {
    if (fs.existsSync(folder)) {
      await parseExportFolder(folder, allMessages);
    } else {
      console.log(`ℹ️ Skipping missing path: ${folder}`);
    }
  }

  // Fallback if exports are directly in data/telegram-export/
  if (allMessages.length === 0 && fs.existsSync(path.join(baseExportPath, 'messages.html'))) {
    await parseExportFolder(baseExportPath, allMessages);
  }

  console.log(`📊 Total raw messages captured: ${allMessages.length}`);

  // Get or create topic
  const topicSlug = 'sermon';
  let { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('slug', topicSlug)
    .single();

  if (!topic) {
    const { data: newTopic, error: topicError } = await supabase
      .from('topics')
      .insert({ name: 'Sermon', slug: topicSlug })
      .select('id')
      .single();
    if (topicError) throw topicError;
    topic = newTopic;
  }

  const searchIndexRecords: SermonRecord[] = [];
  let processed = 0;
  let skipped = 0;
  let filteredOut = 0;

  for (const msg of allMessages) {
    // Basic date parsing and day mapping
    let parsedDate = new Date();
    if (msg.dateStr) {
      const parts = msg.dateStr.split(' ')[0].split('.');
      if (parts.length === 3) {
        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }

    if (!isValid(parsedDate)) {
      skipped++;
      continue;
    }

    const formattedDate = format(parsedDate, 'yyyy-MM-dd');

    // Extract title & preacher logic from text caption
    const title = msg.rawText.split('\n')[0] || 'Untitled Sermon';
    const preacher = msg.rawText.includes('-') ? msg.rawText.split('-')[1]?.trim() : 'Ministry Word';

    // Filter: only keep sermons with SNR PST MINISTRATION, Message/Sermon in title, or >=30 min duration
    const titleLower = title.toLowerCase();
    const preacherLower = preacher.toLowerCase();
    const isSNRPst = titleLower.includes('snr pst ministration') || preacherLower.includes('snr pst');
    const isMessage = titleLower.includes('message') || titleLower.includes('sermon');
    
    // We'll check duration after R2 upload, so for now assume it might be long enough
    // We'll do final filter after we know the actual duration
    const potentiallyRelevant = isSNRPst || isMessage;

    let r2Key = 'audio/default-placeholder.mp3';
    let duration = '00:00';

    // If companion audio file exists locally, read tags and upload to R2
    if (msg.audioRelPath && fs.existsSync(msg.audioRelPath)) {
      try {
        const metadata = await parseFile(msg.audioRelPath);
        const fileBuffer = fs.readFileSync(msg.audioRelPath);
        const fileName = path.basename(msg.audioRelPath);
        const contentType = (metadata.common as any).mimeType || 'audio/mpeg';
        
        r2Key = await uploadToR2(fileBuffer, fileName, contentType);
        console.log(`☁️ Uploaded to R2: ${fileName} -> ${r2Key}`);

        if (metadata.format?.duration) {
          duration = `${Math.floor(metadata.format.duration / 60)}:${String(Math.floor(metadata.format.duration) % 60).padStart(2, '0')}`;
        }
      } catch (err) {
        console.error(`❌ Failed processing audio file ${msg.audioRelPath}:`, err);
      }
    }

    // Final filter: must be SNR PST, Message/Sermon, or >=30 minutes
    const isLongEnough = (() => {
      const parts = duration.split(':').map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      if (parts.length === 3) return h * 60 + m >= 30;
      if (parts.length === 2) return h >= 30;
      return false;
    })();

    const shouldKeep = isSNRPst || isMessage || isLongEnough;

    if (!shouldKeep) {
      filteredOut++;
      console.log(`🚫 FILTERED OUT: ${title} (${duration}) - ${preacher}`);
      continue;
    }

    // Insert sermon into Supabase
    const { data: sermon, error: sermonError } = await supabase
      .from('sermons')
      .insert({
        title,
        preacher,
        date: formattedDate,
        duration,
        r2_key: r2Key,
        topic_id: topic.id,
      })
      .select('id')
      .single();

    if (sermonError) {
      console.error(`❌ Failed to insert sermon "${title}":`, sermonError.message);
      skipped++;
      continue;
    }

    // Add to search index
    searchIndexRecords.push({
      id: sermon.id,
      title,
      preacher,
      date: formattedDate,
      duration,
      r2_key: r2Key,
      topic_name: 'Sermon',
    });

    processed++;
    console.log(`✅ Processed: ${title}`);
  }

  // Refresh materialized view for full-text search
  try {
    const { error: refreshError } = await supabase.rpc('refresh_sermons_search_view');
    if (refreshError) {
      console.warn('⚠️ Could not auto-refresh search view:', refreshError.message);
    } else {
      console.log('🔄 Materialized view sermons_search refreshed successfully');
    }
  } catch (e) {
    console.warn('⚠️ refresh_sermons_search_view RPC not found. Create it in Supabase.');
  }

  // Write out MiniSearch index payload for client-side instant search
  const outputPath = path.join(process.cwd(), 'public/search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(searchIndexRecords, null, 2));

  console.log(`\n✅ Pipeline complete!`);
  console.log(`   Processed: ${processed} sermons`);
  console.log(`   Skipped: ${skipped} messages`);
  console.log(`   Filtered out: ${filteredOut} irrelevant messages`);
  console.log(`   Search index: ${outputPath}`);
}

runMultiExportIngestion().catch(console.error);