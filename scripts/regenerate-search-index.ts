import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function regenerateSearchIndex() {
  console.log('🔄 Regenerating search index from Supabase...');
  
  // Fetch all remaining sermons with topics
  const { data: sermons, error } = await supabase
    .from('sermons')
    .select(`
      id,
      title,
      preacher,
      date,
      duration,
      r2_key,
      topic_id,
      topics:topic_id (name, slug)
    `)
    .order('date', { ascending: false });
    
  if (error) {
    console.error('Error fetching sermons:', error);
    return;
  }
  
  console.log(`Found ${sermons?.length || 0} sermons in Supabase`);
  
  const searchIndexRecords = (sermons || []).map(s => ({
    id: s.id,
    title: s.title,
    preacher: s.preacher,
    date: s.date,
    duration: s.duration || '00:00',
    r2_key: s.r2_key,
    topic_name: s.topics?.[0]?.name || 'Sermon',
  }));
  
  // Write out MiniSearch index payload for client-side instant search
  const outputPath = path.join(process.cwd(), 'public/search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(searchIndexRecords, null, 2));
  
  console.log(`\n✅ Search index regenerated!`);
  console.log(`   Records: ${searchIndexRecords.length}`);
  console.log(`   File: ${outputPath}`);
  
  // Also refresh the materialized view
  try {
    const { error: refreshError } = await supabase.rpc('refresh_sermons_search_view');
    if (refreshError) {
      console.warn('⚠️ Could not auto-refresh search view:', refreshError.message);
    } else {
      console.log('🔄 Materialized view refreshed');
    }
  } catch (e) {
    console.warn('⚠️ Could not refresh materialized view');
  }
}

regenerateSearchIndex().catch(console.error);