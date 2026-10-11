import fs from 'fs';
import path from 'path';

interface TelegramMessage {
  id: number;
  type?: string;
  date: string;
  date_unixtime?: number;
  from?: string;
  from_id?: string;
  text?: string | any[];
  media_type?: string;
  file?: string;
  thumbnail?: string;
  duration_seconds?: number;
  mime_type?: string;
  caption?: string | any[];
  // Converted format fields
  title?: string;
  preacher?: string;
  audio_url?: string;
  video_link?: string;
  notes?: string;
  topic_id?: string;
  source_message_id?: number;
  raw_text?: string;
}

interface ParsedSermon {
  title: string;
  preacher: string;
  date: string;
  audio_url: string;
  video_link: string;
  notes: string;
  topic_id?: string;
  source_message_id: number;
  raw_text: string;
}

function extractText(text: string | any): string {
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) return text.map(t => typeof t === 'string' ? t : t.text).join('');
  return '';
}

function parseSermonFromMessage(msg: any): ParsedSermon | null {
  // Handle both original Telegram format and converted format
  const title = msg.title || 'Sermon';
  const preacher = msg.preacher || 'GAM';
  const body = msg.notes || '';
  const audio_url = msg.audio_url || '';
  const video_link = msg.video_link || '';
  
  let normalizedDate = msg.date || '';
  // Handle "DD.MM.YYYY HH:MM:SS UTC+ZZ:ZZ" format
  const dateOnlyMatch = (msg.date || '').match(/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})/);
  if (dateOnlyMatch) {
    const d = dateOnlyMatch[1]!;
    const m = dateOnlyMatch[2]!;
    const y = dateOnlyMatch[3]!;
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    normalizedDate = `${y}-${mm}-${dd}`;
  } else {
    // Fallback: try parsing with Date constructor
    try {
      const fallbackDate = new Date(msg.date);
      if (!isNaN(fallbackDate.getTime()) && fallbackDate.getFullYear() > 2010) {
        const iso = fallbackDate.toISOString();
        normalizedDate = iso.split('T')[0] ?? '';
      }
    } catch {
      normalizedDate = new Date().toISOString().split('T')[0];
    }
  }

  // Ensure normalizedDate is always a string
  if (!normalizedDate) {
    normalizedDate = new Date().toISOString().split('T')[0];
  }

  return {
    title: (msg.title || 'Sermon').slice(0, 200),
    preacher: msg.preacher || 'GAM',
    date: normalizedDate,
    audio_url: msg.audio_url || '',
    video_link: msg.video_link || '',
    notes: (msg.notes || '').slice(0, 5000),
    topic_id: '',
    source_message_id: msg.id,
    raw_text: (msg.title || '') + '\n' + (msg.notes || ''),
  };
}

function parseTelegramExport(jsonPath: string): ParsedSermon[] {
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const exportData = JSON.parse(raw);

  if (!exportData.messages || !Array.isArray(exportData.messages)) {
    throw new Error('Invalid Telegram export format: no messages array');
  }

  console.log(`Total messages: ${exportData.messages.length}`);

  const sermons: ParsedSermon[] = [];
  const skipped: { id: number; reason: string }[] = [];

  for (const msg of exportData.messages) {
    // Only process messages with content
    if (!msg.title && !msg.notes) continue;

    // Filter 1: Only Sundays (0), Tuesdays (2), and Thursdays (3)
    const msgDate = new Date(msg.date);
    const dayOfWeek = msgDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 2 && dayOfWeek !== 3) {
      skipped.push({ id: msg.id, reason: `Wrong day: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}` });
      continue;
    }

    // Filter 2: Must have audio or sermon keywords
    const hasAudio = msg.audio_url && msg.audio_url.trim() !== '';

    // Filter 3: Check content type before parsing
    const fullText = (msg.title || '') + '\n' + (msg.notes || '');
    const fullTextLower = fullText.toLowerCase();
    
    // More inclusive check: allow any Sunday/Tue/Thu message with audio that looks like a sermon/teaching
    // Only exclude obvious non-sermon content
    const isObviouslyNotSermon = /worship set|choir rehearsal|song list|hymn|praise set|announcement|notice|birthday|wedding|funeral|naming|dedication|picnic|potluck|fellowship event/.test(fullTextLower);
    
    // Must have sermon-like keywords OR have audio
    const hasSermonKeywords = /sermon|message|ministration|teaching|preach|bible study|word of god|sunday service|tuesday service|thursday service|sunday school|prayer vigil|intercession|communion|altar call|healing|deliverance|faith|grace|salvation|scripture|bible|gospel/.test(fullTextLower);
    
    // Strict filter: must have sermon keywords OR have audio
    if ((!hasSermonKeywords && !msg.audio_url) || isObviouslyNotSermon) {
      skipped.push({ id: msg.id, reason: 'Not sermon/ministration content' });
      continue;
    }

    const parsed = parseSermonFromMessage(msg);
    if (parsed) {
      sermons.push(parsed);
    } else {
      skipped.push({ id: msg.id, reason: 'Could not parse' });
    }
  }

  console.log(`Parsed sermons: ${sermons.length}`);
  console.log(`Skipped messages: ${skipped.length}`);
  
  if (skipped.length > 0 && skipped.length < 20) {
    console.log('Skipped:', skipped);
  }
  
  // Sort by date (newest first)
  sermons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Default preacher to "GAM" for messages without explicit preacher
  for (const s of sermons) {
    if (!s.preacher || s.preacher === 'Unknown') {
      s.preacher = 'GAM';
    }
    s.topic_id = assignTopic(s);
  }

  // Output for review
  const outputPath = path.join(__dirname, 'parsed-sermons.json');
  fs.writeFileSync(outputPath, JSON.stringify(sermons, null, 2));
  console.log(`\nOutput written to: ${outputPath}`);
  console.log(`Total sermons parsed: ${sermons.length}`);
  
  // Stats
  const withAudio = sermons.filter(s => s.audio_url).length;
  const withVideo = sermons.filter(s => s.video_link).length;
  const withTopics = sermons.filter(s => s.topic_id).length;
  console.log(`With audio: ${withAudio}`);
  console.log(`With video links: ${withVideo}`);
  console.log(`Auto-assigned topics: ${withTopics}`);

  // Sample for review
  console.log('\n--- First 3 sermons ---');
  sermons.slice(0, 3).forEach((s, i) => {
    console.log(`${i + 1}. ${s.title} | ${s.preacher} | ${s.date} | Topic: ${s.topic_id || 'none'}`);
  });

  return sermons;
}

// Topic mapping based on keywords
const TOPIC_KEYWORDS: Record<string, string> = {
  'faith': 'faith',
  'prayer': 'prayer',
  'healing': 'healing',
  'deliverance': 'deliverance',
  'holy spirit': 'holy-spirit',
  'salvation': 'salvation',
  'grace': 'grace',
  'worship': 'worship',
  'tithe': 'giving',
  'offering': 'giving',
  'mission': 'missions',
  'evangelism': 'evangelism',
  'family': 'family',
  'marriage': 'marriage',
  'youth': 'youth',
  'children': 'children',
  'leadership': 'leadership',
  'discipleship': 'discipleship',
  'end times': 'end-times',
  'prophecy': 'prophecy',
  'revival': 'revival',
};

function assignTopic(sermon: ParsedSermon): string | undefined {
  const text = (sermon.title + ' ' + sermon.notes).toLowerCase();
  for (const [keyword, topicId] of Object.entries(TOPIC_KEYWORDS)) {
    if (text.includes(keyword)) return topicId;
  }
  return undefined;
}

// Main execution
async function main() {
  const exportPath = process.argv[2] || path.join(__dirname, 'telegram-export.json');
  
  if (!fs.existsSync(exportPath)) {
    console.error(`Export file not found: ${exportPath}`);
    console.error('Usage: npx tsx scripts/parse-telegram-sermons.ts <path-to-export.json>');
    process.exit(1);
  }

  console.log('Parsing Telegram export...');
  const sermons = parseTelegramExport(exportPath);

  // Sort by date
  sermons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Assign topics
  for (const s of sermons) {
    s.topic_id = assignTopic(s);
  }

  // Output for review
  const outputPath = path.join(__dirname, 'parsed-sermons.json');
  fs.writeFileSync(outputPath, JSON.stringify(sermons, null, 2));
  console.log(`\nOutput written to: ${outputPath}`);
  console.log(`Total sermons parsed: ${sermons.length}`);

  // Stats
  const withAudio = sermons.filter(s => s.audio_url).length;
  const withVideo = sermons.filter(s => s.video_link).length;
  const withTopics = sermons.filter(s => s.topic_id).length;
  console.log(`With audio: ${withAudio}`);
  console.log(`With video links: ${withVideo}`);
  console.log(`Auto-assigned topics: ${withTopics}`);

  // Sample for review
  console.log('\n--- First 3 sermons ---');
  sermons.slice(0, 3).forEach((s, i) => {
    console.log(`${i + 1}. ${s.title} | ${s.preacher} | ${s.date} | Topic: ${s.topic_id || 'none'}`);
  });
}

main().catch(console.error);