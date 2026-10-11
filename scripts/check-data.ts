import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkData() {
  const [sermons, music, programs, devotionals] = await Promise.all([
    supabase.from('sermons').select('id, title, preacher, date').limit(5),
    supabase.from('church_music').select('id, title, artist_choir').limit(5),
    supabase.from('programs').select('id, title, event_date').limit(5),
    supabase.from('devotionals').select('id, title, date').limit(5),
  ]);
  
  console.log('Sermons:', sermons.data?.length || 0);
  console.log('Music:', music.data?.length || 0);
  console.log('Programs:', programs.data?.length || 0);
  console.log('Devotionals:', devotionals.data?.length || 0);
  
  if (sermons.data) console.log('Sample sermon:', sermons.data[0]);
  if (music.data) console.log('Sample music:', music.data[0]);
  if (programs.data) console.log('Sample program:', programs.data[0]);
  if (devotionals.data) console.log('Sample devotional:', devotionals.data[0]);
}

checkData().catch(console.error);