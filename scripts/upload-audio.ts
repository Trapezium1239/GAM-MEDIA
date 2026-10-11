import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

const EXPORT_FILES_DIR = 'C:/Users/henry/Downloads/Telegram Desktop/ChatExport_2026-10-04/files';
const SERMONS_PATH = 'scripts/parsed-sermons.json';

async function uploadAudioFiles() {
  // Load sermons
  const sermons = JSON.parse(fs.readFileSync('scripts/parsed-sermons.json', 'utf-8'));
  
  // Get all audio files
  const filesDir = 'C:/Users/henry/Downloads/Telegram Desktop/ChatExport_2026-10-04/files';
  const files = fs.readdirSync(filesDir).filter(f => 
    ['.mp3', '.mp4', '.m4a', '.ogg', '.wav', '.m4a', '.opus', '.webm'].includes(path.extname(f).toLowerCase())
  );
  
  console.log(`Found ${files.length} audio/video files in export`);
  
  let uploaded = 0;
  let matched = 0;
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.mp3', '.mp4', '.m4a', '.ogg', '.wav', '.m4a', '.opus', '.webm'].includes(path.extname(file).toLowerCase())) {
      continue;
    }
    
    const localPath = path.join('C:/Users/henry/Downloads/Telegram Desktop/ChatExport_2026-10-04/files', file);
    const stats = fs.statSync(localPath);
    
    // Find matching sermon by title similarity
    let bestMatch = null;
    let bestScore = 0;
    
    for (const sermon of sermons) {
      if (sermon.audio_url) continue;
      
      const sermonWords: string[] = sermon.title.toLowerCase().split(/[^a-z0-9]+/).filter((w: string) => w.length > 2);
      const fileWords: string[] = file.toLowerCase().split(/[^a-z0-9]+/).filter((w: string) => w.length > 2);
      
      let score = 0;
for (const w of sermonWords) {
          if (fileWords.some((fw) => fw.includes(w) || w.includes(fw))) score++;
        }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sermon;
      }
    }
    
    if (bestMatch && bestScore >= 2) {
      const localPath = path.join('C:/Users/henry/Downloads/Telegram Desktop/ChatExport_2026-10-04/files', file);
      const fileBuffer = fs.readFileSync(localPath);
      
      // Upload to Supabase Storage
      const fileName = `sermons/${Date.now()}-${file.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('church-media')
        .upload(`sermons/${Date.now()}-${file.replace(/[^a-zA-Z0-9.-]/g, '_')}`, 
          fs.readFileSync(localPath),
          { contentType: 'audio/mpeg', upsert: false });
      
      if (error) {
        console.error(`Failed to upload ${file}:`, error);
        continue;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('church-media')
        .getPublicUrl(data.path);
      
      // Find matching sermon and update
      let bestMatch = null;
      let bestScore = 0;
      
      for (const sermon of sermons) {
        if (sermon.audio_url) continue;
        
const sermonWords: string[] = sermon.title.toLowerCase().split(/[^a-z0-9]+/).filter((w: string) => w.length > 2);
      const fileWords: string[] = file.toLowerCase().split(/[^a-z0-9]+/).filter((w: string) => w.length > 2);
        
        let score = 0;
for (let i = 0; i < sermonWords.length; i++) {
          const w = sermonWords[i]!;
          if (fileWords.some((fw: string): boolean => fw.includes(w) || w.includes(fw))) score++;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = sermon;
        }
      }
      
      if (bestMatch && bestScore >= 2) {
        bestMatch.audio_url = publicUrl;
        matched++;
        console.log(`Matched: ${bestMatch.title.slice(0, 50)} -> ${file}`);
      } else {
        console.log(`No match for: ${file}`);
      }
      
      uploaded++;
    } else {
      console.log(`No match for: ${file}`);
    }
  }
  
  // Save updated sermons
  fs.writeFileSync('scripts/parsed-sermons.json', JSON.stringify(sermons, null, 2));
  console.log(`\nUploaded: ${uploaded}, Matched: ${matched}`);
}

uploadAudioFiles().catch(console.error);