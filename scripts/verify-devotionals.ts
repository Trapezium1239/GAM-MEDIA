import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase.from('devotionals').select('date, title, scripture_reference, scripture_text').limit(10);
  console.log('Sample:', data);
  const { count } = await supabase.from('devotionals').select('*', { count: 'exact', head: true });
  console.log('Total:', count);
  
// Check first scripture text
  if (data && data.length > 0) {
    console.log('First scripture text:', data[0]?.scripture_text?.substring(0, 150));
  }
}

main().catch(console.error);