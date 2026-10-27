import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BibleVerse { book: string; chapter: number; verse: number }

async function main() {
  const bible = JSON.parse(fs.readFileSync('public/bible/kjv.json','utf8'));
  const verses: BibleVerse[] = [];
  for (const book of bible.books) {
    for (const ch of book.chapters) {
      if (ch.verses.length) verses.push({ book: book.name, chapter: ch.chapter, verse: ch.verses[Math.floor(Math.random()*ch.verses.length)].verse });
    }
  }
  const seen = new Set<string>();
  const pick: BibleVerse[] = [];
  for (let i=0; i<verses.length && pick.length<365; i++) {
    const v = verses[i];
    if (!v) continue;
    const k = v.book+'|'+v.chapter+'|'+v.verse;
    if (!seen.has(k)) { seen.add(k); pick.push(v); }
  }
  const start = new Date('2026-01-01');
  const themes = ['faith','hope','love','grace','peace','joy','strength','courage','wisdom','prayer','trust','blessing','protection','healing','salvation','worship','obedience','service','witness','endurance'];
  const titles: Record<string,string> = { faith:'Walk by Faith', hope:'Hope in God', love:'Walk in Love', grace:'Amazing Grace', peace:'Peace of God', joy:'Joy of the Lord', strength:'Strength in God', courage:'Be Courageous', wisdom:'Seek Wisdom', prayer:'Pray Without Ceasing', trust:'Trust in God', blessing:'God Blessings', protection:'God Protection', healing:'God Healing', salvation:'God Salvation', worship:'Worship God', obedience:'Obey God', service:'Serve Others', witness:'Be a Witness', endurance:'Endure with Faith' };
  const reflections: Record<string,string> = { faith:'Without faith it is impossible to please God. Trust Him today.', hope:'Hope anchors the soul. Put your hope in God.', love:'God is love. Love others as He loved you.', grace:'We are saved by grace through faith. Thank God for grace.', peace:'The peace of God guards hearts. Receive His peace.', joy:'The joy of the Lord is your strength. Rejoice today.', strength:'God strengthens the weary. Find strength in Him.', courage:'Be strong and courageous. God is with you.', wisdom:'The fear of the Lord is the beginning of wisdom.', prayer:'Pray without ceasing. Talk to God today.', trust:'Trust in the Lord with all your heart.', blessing:'Bless the Lord, O my soul. Count your blessings.', protection:'God is our refuge and strength. He protects us.', healing:'Jesus heals. Pray for healing today.', salvation:'For God so loved the world. Rejoice in salvation.', worship:'Worship the Lord in the beauty of holiness.', obedience:'Obey God and be blessed.', service:'Serve one another in love.', witness:'Be a witness for Christ today.', endurance:'Endure hardship as discipline. God is with you.' };
  const apps: Record<string,string> = { faith:'Take one step of faith today.', hope:'Hope in God when discouraged.', love:'Show love to someone today.', grace:'Extend grace to someone today.', peace:'Pray for peace in your heart.', joy:'Choose joy today.', strength:'Rely on strength today.', courage:'Face a fear with courage today.', wisdom:'Seek wisdom in a decision.', prayer:'Pray about something specific today.', trust:'Trust God with a worry today.', blessing:'Count 5 blessings today.', protection:'Thank God for protection today.', healing:'Pray for healing for yourself or others.', salvation:'Thank God for salvation today.', worship:'Worship God through song today.', obedience:'Obey God in a small way today.', service:'Help someone today.', witness:'Share your faith with someone today.', endurance:'Persevere through a challenge today.' };
  const devotionals = pick.map((p,i) => {
    const d = new Date(start); d.setDate(start.getDate()+i);
    const theme = themes[i % themes.length] as keyof typeof titles;
    return {
      date: d.toISOString().split('T')[0],
      title: titles[theme],
      scripture_reference: p.book + ' ' + p.chapter + ':' + p.verse,
      scripture_text: '', // filled below
      reflection: reflections[theme],
      prayer: 'Lord, help me live out ' + theme + ' today. Amen.',
      application_question: apps[theme],
      source: 'manual' as const,
      external_id: null,
      created_by: null,
      published_at: d.toISOString().split('T')[0] + 'T00:00:00Z',
    };
  });
  const lookup = new Map();
  for (const b of bible.books) for (const ch of b.chapters) for (const v of ch.verses) lookup.set(b.name+'|'+ch.chapter+'|'+v.verse, v.text);
  let missing=0;
  for (const d of devotionals) {
    const parts = d.scripture_reference.match(/^(.+?) (\d+):(\d+)$/);
    if (parts) {
      const t = lookup.get(parts[1]+'|'+parts[2]+'|'+parts[3]);
      if (t) d.scripture_text = t; else missing++;
    } else missing++;
  }
  console.log('Prepared', devotionals.length, 'devotionals, missing verses:', missing);

  // Upsert into daily_devotionals (the table get_todays_devotional() reads from).
  // Preflight the FIRST batch so a permissions problem aborts before any write.
  const firstBatch = devotionals.slice(0, 50);
  const first = await supabase
    .from('daily_devotionals')
    .upsert(firstBatch, { onConflict: 'date' });

  if (first.error) {
    printPermissionHint(first.error.message);
    process.exitCode = 1;
    return;
  }

  let ins = firstBatch.length;
  for (let i = 50; i < devotionals.length; i += 50) {
    const batch = devotionals.slice(i, i + 50);
    const { error } = await supabase
      .from('daily_devotionals')
      .upsert(batch, { onConflict: 'date' });
    if (error) {
      console.error('Batch failed at', i, '-', error.message);
      process.exitCode = 1;
    } else {
      ins += batch.length;
      if (ins % 100 === 0) console.log('inserted', ins, '/', devotionals.length);
    }
  }

  // Remove rows outside the generated year so the archive stays exact.
  const firstDate = devotionals[0]?.date;
  const lastDate = devotionals[devotionals.length - 1]?.date;
  if (firstDate && lastDate) {
    const { error: pruneError } = await supabase
      .from('daily_devotionals')
      .delete()
      .or(`date.lt.${firstDate},date.gt.${lastDate}`);
    if (pruneError) console.error('Prune failed:', pruneError.message);
  }

  console.log('Done. Inserted', ins, '/', devotionals.length, 'into daily_devotionals');
}

function printPermissionHint(message: string) {
  console.error('\nFAILED:', message);
  if (!/permission denied/i.test(message)) return;
  console.error(`
The Supabase roles have no table privileges yet. Run this once in the
Supabase SQL Editor, then re-run this script:

  https://supabase.com/dashboard/project/lxkugbswxdrkdhuyorwf/sql/new

  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_devotionals TO service_role;

(The full, copy-paste version lives in supabase/APPLY_NOW.sql.)
`);
}
main().catch(console.error);
