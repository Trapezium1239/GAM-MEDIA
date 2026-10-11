import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AUDIO_DIR = path.join(process.cwd(), 'data/raw-audio');

async function cleanupSermons() {
  console.log('🧹 Starting sermon cleanup...');
  
  // Fetch all sermons
  const { data: sermons, error } = await supabase
    .from('sermons')
    .select('id, title, preacher, date, duration, r2_key');
    
  if (error) {
    console.error('Error fetching sermons:', error);
    return;
  }
  
  console.log(`Total sermons: ${sermons?.length || 0}`);
  
  const toDelete: string[] = [];
  const toKeep: string[] = [];
  const r2KeysToDelete: string[] = [];
  
  for (const s of sermons || []) {
    const title = s.title.toLowerCase();
    const preacher = s.preacher.toLowerCase();
    const duration = s.duration || '00:00';
    
    // Parse duration (format: "MM:SS" or "H:MM:SS")
    const parts = duration.split(':').map(Number);
    let totalMinutes = 0;
    if (parts.length === 3) {
      totalMinutes = parts[0] * 60 + parts[1] + parts[2] / 60;
    } else if (parts.length === 2) {
      totalMinutes = parts[0] + parts[1] / 60;
    }
    
    // Check keep conditions
    const isSNRPst = title.includes('snr pst ministration') || preacher.includes('snr pst');
    const isMessage = title.includes('message') || title.includes('sermon');
    const isLongEnough = totalMinutes >= 30;
    
    const shouldKeep = isSNRPst || isMessage || isLongEnough;
    
    if (shouldKeep) {
      toKeep.push(s.id);
      console.log(`✅ KEEP: ${s.title} (${duration}) - ${s.preacher}`);
    } else {
      toDelete.push(s.id);
      if (s.r2_key && s.r2_key !== 'audio/default-placeholder.mp3') {
        r2KeysToDelete.push(s.r2_key);
      }
      console.log(`❌ DELETE: ${s.title} (${duration}) - ${s.preacher}`);
    }
  }
  
  console.log(`\nTo keep: ${toKeep.length}`);
  console.log(`To delete: ${toDelete.length}`);
  
  if (toDelete.length > 0) {
    console.log('\n🗑️ Deleting irrelevant sermons from Supabase...');
    // Delete in batches of 100 to avoid URL length limits
    for (let i = 0; i < toDelete.length; i += 100) {
      const batch = toDelete.slice(i, i + 100);
      const { error } = await supabase
        .from('sermons')
        .delete()
        .in('id', batch);
        
      if (error) {
        console.error('Delete batch error:', error);
      } else {
        console.log(`✅ Deleted batch ${i/100 + 1} (${batch.length} sermons)`);
      }
    }
  }
  
  // Delete local audio files for deleted sermons
  console.log('\n🗑️ Deleting local audio files...');
  let deletedLocal = 0;
  for (const r2Key of r2KeysToDelete) {
    // Extract filename from r2_key (format: audio/timestamp-filename)
    const filename = r2Key.replace('audio/', '');
    const localPath = path.join(AUDIO_DIR, filename);
    
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
        deletedLocal++;
        console.log(`🗑️ Deleted local: ${filename}`);
      } catch (e) {
        console.error(`Failed to delete ${filename}:`, e);
      }
    }
  }
  console.log(`✅ Deleted ${deletedLocal} local audio files`);
  
  // Refresh search view
  await supabase.rpc('refresh_sermons_search_view');
  console.log('🔄 Search view refreshed');
  
  console.log('\n✅ Cleanup complete!');
  console.log(`   Kept: ${toKeep.length} sermons`);
  console.log(`   Deleted: ${toDelete.length} sermons`);
  console.log(`   Local files removed: ${deletedLocal}`);
}

cleanupSermons().catch(console.error);