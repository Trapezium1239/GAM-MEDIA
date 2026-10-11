import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { parseFile } from 'music-metadata';
import { format, isValid, parseISO } from 'date-fns';
import { uploadToR2 } from '../lib/r2';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATE_FILE = path.join(process.cwd(), 'scripts/.ingest-state.json');

interface IngestState {
  lastProcessedDate: string; // ISO date string
  lastProcessedMessageIds: string[]; // Track specific message IDs to avoid duplicates
  totalProcessed: number;
  lastRun: string;
}

interface SermonRecord {
  id: string;
  title: string;
  preacher: string;
  date: string;
  duration: string;
  r2_key: string;
  topic_name: string;
}

function loadState(): IngestState {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      return getDefaultState();
    }
  }
  return getDefaultState();
}

function getDefaultState(): IngestState {
  return {
    lastProcessedDate: '2021-01-01', // Start from 2021
    lastProcessedMessageIds: [],
    totalProcessed: 0,
    lastRun: '',
  };
}

function saveState(state: IngestState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function parseExportFolder(exportDir: string, messages: any[], sinceDate: Date) {
  const htmlPath = path.join(exportDir, 'messages.html');
  if (!fs.existsSync(htmlPath)) {
    console.warn(`⚠️ Warning: messages.html not found in ${exportDir}`);
    return;
  }

  console.log(`📂 Parsing export source: ${exportDir}`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  $('.message.default').each((_, el) => {
    const $el = $(el);
    const text = $el.find('.text').text().trim();
    const dateStr = $el.find('.pull_right.date_time').attr('title');
    const audioRelPath = $el.find('.audio_file audio, .media_file.audio').attr('src');
    const messageId = $el.attr('id') || ''; // Unique message ID from Telegram export

    if (!text && !audioRelPath) return;

    // Parse date and check if it's newer than our last processed date
    let parsedDate = new Date();
    if (dateStr) {
      // @ts-ignore - dateStr.split returns string[]
      const parts = dateStr.split(' ')[0].split('.');
      if (parts.length >= 3) {
        const day = parts[0] as string;
        const month = parts[1] as string;
        const year = parts[2] as string;
        if (day && month && year) {
          parsedDate = new Date(`${year}-${month}-${day}`);
        }
      }
    }

    // Only process if date is after our last processed date
    if (parsedDate <= sinceDate) return;

    if (text || audioRelPath) {
      messages.push({
        messageId,
        rawText: text,
        dateStr,
        parsedDate,
        audioRelPath: audioRelPath ? path.join(exportDir, audioRelPath) : null,
      });
    }
  });
}

async function runIncrementalIngest() {
  console.log('🚀 Starting Incremental Telegram Ingestion...');
  
  const state = loadState();
  const sinceDate = parseISO(state.lastProcessedDate);
  
  console.log(`📅 Last processed date: ${state.lastProcessedDate}`);
  console.log(`📊 Total previously processed: ${state.totalProcessed}`);

  const baseExportPath = path.join(process.cwd(), 'data/telegram-export');
  const exportFolders = [
    path.join(baseExportPath, 'chat-export-1'),
    path.join(baseExportPath, 'chat-export-2'),
  ];

  const allMessages: any[] = [];
  for (const folder of exportFolders) {
    if (fs.existsSync(folder)) {
      await parseExportFolder(folder, allMessages, sinceDate);
    } else {
      console.log(`ℹ️ Skipping missing path: ${folder}`);
    }
  }

  // Fallback if exports are directly in data/telegram-export/
  if (allMessages.length === 0 && fs.existsSync(path.join(baseExportPath, 'messages.html'))) {
    await parseExportFolder(baseExportPath, allMessages, sinceDate);
  }

  if (allMessages.length === 0) {
    console.log('✅ No new messages to process. Already up to date!');
    return;
  }

  // Sort by date ascending
  allMessages.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  console.log(`📊 New messages to process: ${allMessages.length}`);

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

  const searchIndexRecords: any[] = [];
  let processed = 0;
  let skipped = 0;
  let filteredOut = 0;
  const newMessageIds: string[] = [];

  for (const msg of allMessages) {
    // Skip if already processed (deduplication by message ID)
    if (msg.messageId && state.lastProcessedMessageIds.includes(msg.messageId)) {
      console.log(`⏭️ Skipping duplicate message: ${msg.messageId}`);
      skipped++;
      continue;
    }

    const formattedDate = format(msg.parsedDate, 'yyyy-MM-dd');
    const dayOfWeek = format(msg.parsedDate, 'EEEE');

    // Extract title & preacher logic from text caption
    const title = msg.rawText.split('\n')[0] || 'Untitled Sermon';
    const preacher = msg.rawText.includes('-') ? msg.rawText.split('-')[1]?.trim() : 'Ministry Word';

    let r2Key = 'audio/default-placeholder.mp3';
    let duration = '00:00';

    // If companion audio file exists locally, read tags and upload to R2
    if (msg.audioRelPath && fs.existsSync(msg.audioRelPath)) {
      try {
        const metadata = await parseFile(msg.audioRelPath);
        const fileBuffer = fs.readFileSync(msg.audioRelPath);
        const fileName = path.basename(msg.audioRelPath);
        const contentType = (metadata.common as any).mimeType || 'audio/mpeg';
        
        r2Key = await uploadToR2(fileBuffer, path.basename(msg.audioRelPath), contentType);
        console.log(`☁️ Uploaded to R2: ${path.basename(msg.audioRelPath)} -> ${r2Key}`);

        if (metadata.format?.duration) {
          duration = `${Math.floor(metadata.format.duration / 60)}:${String(Math.floor(metadata.format.duration) % 60).padStart(2, '0')}`;
        }
      } catch (err) {
        console.error(`❌ Failed processing audio file ${msg.audioRelPath}:`, err);
      }
    }

    // Filter: must be SNR PST, Message/Sermon, or >=30 minutes
    const titleLower = msg.rawText.split('\n')[0]?.toLowerCase() || '';
    const preacherLower = preacher.toLowerCase();
    
    const isLongEnough = (() => {
      const parts = duration.split(':').map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      if (parts.length === 3) return h * 60 + m >= 30;
      if (parts.length === 2) return h >= 30;
      return false;
    })();

    const isSNRPst = titleLower.includes('snr pst ministration') || preacherLower.includes('snr pst');
    const isMessage = titleLower.includes('message') || titleLower.includes('sermon');
    const shouldKeep = titleLower.includes('snr pst ministration') || preacherLower.includes('snr pst') || 
                       titleLower.includes('message') || titleLower.includes('sermon') || 
                       (() => {
                         const parts = duration.split(':').map(Number);
                         const h = parts[0] ?? 0;
                         const m = parts[1] ?? 0;
                         if (parts.length === 3) return h * 60 + m >= 30;
                         if (parts.length === 2) return h >= 30;
                         return false;
                       })();

    if (!shouldKeep) {
      console.log(`🚫 FILTERED OUT: ${msg.rawText.split('\n')[0]} (${duration})`);
      continue;
    }

    // Insert sermon into Supabase
    const { data: sermon, error: sermonError } = await supabase
      .from('sermons')
      .insert({
        title: msg.rawText.split('\n')[0] || 'Untitled Sermon',
        preacher: msg.rawText.includes('-') ? msg.rawText.split('-')[1]?.trim() : 'Ministry Word',
        date: format(msg.parsedDate, 'yyyy-MM-dd'),
        duration: duration,
        r2_key: r2Key,
        topic_id: topic.id,
      })
      .select('id')
      .single();

    if (sermonError) {
      console.error(`❌ Failed to insert sermon:`, sermonError.message);
      continue;
    }

    // Track processed message ID
    if (msg.messageId) {
      newMessageIds.push(msg.messageId);
    }

    // Add to search index
    searchIndexRecords.push({
      id: sermon.id,
      title: msg.rawText.split('\n')[0] || 'Untitled Sermon',
      preacher: msg.rawText.includes('-') ? msg.rawText.split('-')[1]?.trim() : 'Ministry Word',
      date: format(msg.parsedDate, 'yyyy-MM-dd'),
      duration,
      r2_key: r2Key,
      topic_name: 'Sermon',
    });

    processed++;
    console.log(`✅ Processed: ${msg.rawText.split('\n')[0]}`);
  }

  // Update state with new processed data
  state.lastProcessedDate = format(new Date(), 'yyyy-MM-dd');
  state.lastProcessedMessageIds = [...state.lastProcessedMessageIds, ...newMessageIds].slice(-10000); // Keep last 10k IDs
  state.totalProcessed += processed;
  state.lastRun = new Date().toISOString();
  saveState(state);

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

  // Update search index
  const outputPath = path.join(process.cwd(), 'public/search-index.json');
  const existingIndex = fs.existsSync(path.join(process.cwd(), 'public/search-index.json')) 
    ? JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/search-index.json'), 'utf8'))
    : [];
  
  // Merge with existing index (avoid duplicates by ID)
  const existingIds = new Set(existingIndex.map((r: any) => r.id));
  const newRecords = searchIndexRecords.filter((r: any) => !existingIds.has(r.id));
  const mergedIndex = [...existingIndex, ...newRecords];
  
  fs.writeFileSync(path.join(process.cwd(), 'public/search-index.json'), JSON.stringify(mergedIndex, null, 2));

  console.log(`\n✅ Incremental ingestion complete!`);
  console.log(`   New processed: ${processed} sermons`);
  console.log(`   Skipped duplicates: ${skipped}`);
  console.log(`   Search index updated: ${mergedIndex.length} total records`);
  console.log(`   Next run will process from: ${state.lastProcessedDate}`);
}

runIncrementalIngest().catch(console.error);