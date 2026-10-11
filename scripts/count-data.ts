import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCounts() {
  const [sermons, music, programs, devotionals] = await Promise.all([
    supabase.from('sermons').select('id', { count: 'exact', head: true }),
    supabase.from('church_music').select('id', { count: 'exact', head: true }),
    supabase.from('programs').select('id', { count: 'exact', head: true }),
    supabase.from('devotionals').select('id', { count: 'exact', head: true }),
  ]);
  
  console.log('Total Sermons:', sermons.count);
  console.log('Total Music:', music.count);
  console.log('Total Programs:', programs.count);
  console.log('Total Devotionals:', devotionals.count);
}

checkCounts().catch(console.error);