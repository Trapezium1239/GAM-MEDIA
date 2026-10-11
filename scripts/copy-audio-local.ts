import fs from 'fs';
import path from 'path';

async function main() {
  // Load sermons
  const sermons = JSON.parse(fs.readFileSync('scripts/parsed-sermons.json', 'utf-8'));
  
  // Create public/audio directory
  if (!fs.existsSync('public/audio')) {
    fs.mkdirSync('public/audio', { recursive: true });
  }
  
  // Get all audio files from export directory
  const filesDir = 'C:/Users/henry/Downloads/Telegram Desktop/ChatExport_2026-10-04/files';
  const files = fs.readdirSync(filesDir).filter(f => 
    ['.mp3', '.mp4', '.m4a', '.ogg', '.wav', '.m4a', '.opus', '.webm'].includes(path.extname(f).toLowerCase())
  );
  
  console.log(`Found ${files.length} audio/video files in export`);
  
  let copied = 0;
  let matched = 0;
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.mp3', '.mp4', '.m4a', '.ogg', '.wav', '.m4a', '.opus', '.webm'].includes(path.extname(file).toLowerCase())) {
      continue;
    }
    
    // Find matching sermon by title similarity
    let bestMatch = null;
    let bestScore = 0;
    
    for (const sermon of sermons) {
      if (sermon.audio_url) continue; // Only match sermons that need audio
      
      const sermonWords: string[] = sermon.title.toLowerCase().split(/[^a-z0-9]+/).filter((w: string) => w.length > 2);
      const fileWords: string[] = file.toLowerCase().split(/[^a-z0-9]+/).filter((w: string) => w.length > 2);
      
      let score = 0;
for (const w of sermonWords) {
          if (fileWords.some((fw: string): boolean => fw.includes(w) || w.includes(fw))) score++;
        }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sermon;
      }
    }
    
    if (bestMatch && bestScore >= 2) {
      const srcPath = path.join('C:/Users/henry/Downloads/Telegram Desktop/ChatExport_2026-10-04/files', file);
      const destFileName = `${Date.now()}-${file.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const destPath = path.join('public/audio', destFileName);
      
      try {
        fs.copyFileSync(srcPath, destPath);
        
        // Update sermon with local URL
        bestMatch.audio_url = `/audio/${destFileName}`;
        console.log(`Copied: ${bestMatch.title.slice(0, 50)} -> ${file}`);
        matched++;
      } catch (err: unknown) {
        console.error(`Failed to copy ${file}:`, err instanceof Error ? err.message : String(err));
      }
    } else {
      console.log(`No match for: ${file}`);
    }
  }
  
  // Save updated sermons
  fs.writeFileSync('scripts/parsed-sermons.json', JSON.stringify(sermons, null, 2));
  console.log(`\nMatched: ${matched}`);
}

main().catch(console.error);