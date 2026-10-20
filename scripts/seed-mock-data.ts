import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOCK_MUSIC = [
  {
    title: 'Great Is Thy Faithfulness',
    artist_choir: 'GAM Choir',
    audio_url: 'https://b35953ab7a935c305d863f23e105f316.r2.cloudflarestorage.com/gam-media/audio/music-1.mp3',
    lyrics: 'Great is Thy faithfulness, O God my Father...\nThere is no shadow of turning with Thee...\nThou changest not, Thy compassions, they fail not\nAs Thou hast been, Thou forever wilt be.',
    release_date: '2025-10-15',
  },
  {
    title: 'Holy Spirit Come',
    artist_choir: 'GAM Worship Team',
    audio_url: 'https://b35953ab7a935c305d863f23e105f316.r2.cloudflarestorage.com/gam-media/audio/music-2.mp3',
    lyrics: 'Holy Spirit, come and fill this place...\nWe need Your presence more than anything...\nCome and breathe new life into our souls.',
    release_date: '2025-09-20',
  },
  {
    title: 'We Lift Our Hands',
    artist_choir: 'GAM Youth Choir',
    audio_url: 'https://b35953ab7a935c305d863f23e105f316.r2.cloudflarestorage.com/gam-media/audio/music-3.mp3',
    lyrics: 'We lift our hands in worship to You...\nThere is no one like You, Lord...\nWe surrender all to You.',
    release_date: '2025-08-10',
  },
  {
    title: 'Amazing Grace',
    artist_choir: 'GAM Central Choir',
    audio_url: 'https://b35953ab7a935c305d863f23e105f316.r2.cloudflarestorage.com/gam-media/audio/music-4.mp3',
    lyrics: 'Amazing grace, how sweet the sound...\nThat saved a wretch like me...\nI once was lost, but now am found.\nWas blind, but now I see.',
    release_date: '2025-07-05',
  },
  {
    title: 'Way Maker',
    artist_choir: 'GAM Worship Team',
    audio_url: 'https://b35953ab7a935c305d863f23e105f316.r2.cloudflarestorage.com/gam-media/audio/music-5.mp3',
    lyrics: 'You are here, moving in our midst...\nI worship You, I worship You...\nYou are here, working in this place...\nI worship You, I worship You.',
    release_date: '2025-06-12',
  },
];

const MOCK_PROGRAMS = [
  {
    title: 'New Year Crossover Service',
    description: 'Join us as we cross over into the new year with prayers and worship. A night of reflection, thanksgiving, and prophetic declarations for the year ahead.',
    event_date: '2025-12-31T22:00:00',
    venue: 'Main Auditorium',
    flyer_url: null,
  },
  {
    title: 'Annual Youth Conference',
    description: 'Three days of teaching, worship, and fellowship for young adults. Theme: "Rising Above" - Equipping the next generation for Kingdom impact.',
    event_date: '2026-01-15T10:00:00',
    venue: 'Chapel Hall',
    flyer_url: null,
  },
  {
    title: 'Midweek Bible Study',
    description: 'Weekly deep dive into the Word. Current series: "The Life of Christ" - Verse-by-verse study through the Gospels.',
    event_date: '2026-01-06T17:30:00',
    venue: 'Chapel Hall',
    flyer_url: null,
  },
  {
    title: 'Women\'s Fellowship Retreat',
    description: 'A weekend of restoration and sisterhood. Theme: "Beautifully Broken" - Finding wholeness in Christ.',
    event_date: '2026-02-14T09:00:00',
    venue: 'Prayer Mountain',
    flyer_url: null,
  },
  {
    title: 'Men\'s Breakfast & Conference',
    description: 'Quarterly gathering for men. Theme: "Iron Sharpens Iron" - Building godly character and leadership.',
    event_date: '2026-03-07T08:00:00',
    venue: 'Fellowship Hall',
    flyer_url: null,
  },
  {
    title: 'Children\'s Vacation Bible School',
    description: 'Week-long program for ages 5-12. Theme: "Heroes of Faith" - Interactive lessons, crafts, games, and worship.',
    event_date: '2026-04-20T09:00:00',
    venue: 'Children\'s Wing',
    flyer_url: null,
  },
];

const MOCK_DEVOTIONALS = [
  {
    date: '2026-01-15',
    title: 'Trust in the Lord',
    scripture_reference: 'Proverbs 3:5-6',
    scripture_text: 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.',
    reflection: 'When life feels uncertain, our natural tendency is to rely on our own wisdom. But God calls us to a deeper trust — one that surrenders control and acknowledges His sovereignty in every area of life.',
    prayer: 'Lord, teach me to trust You completely. Help me release my need to understand everything and simply follow Your leading.',
    application_question: 'What is one area where you need to stop leaning on your own understanding and trust God instead?',
    source: 'manual',
    created_at: new Date('2026-01-15').toISOString(),
    published_at: new Date('2026-01-15').toISOString(),
  },
  {
    date: '2026-01-16',
    title: 'The Peace That Passes Understanding',
    scripture_reference: 'Philippians 4:6-7',
    scripture_text: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.',
    reflection: 'Anxiety is a natural response to uncertainty, but God offers a supernatural peace that transcends circumstances. This peace is not the absence of trouble, but the presence of Christ in the midst of it.',
    prayer: 'Father, I bring my anxieties to You. Replace my worry with Your peace that guards my heart and mind.',
    application_question: 'What situation are you anxious about today? Have you brought it to God in prayer with thanksgiving?',
    source: 'manual',
    created_at: new Date('2026-01-16').toISOString(),
    published_at: new Date('2026-01-16').toISOString(),
  },
  {
    date: '2026-01-17',
    title: 'Walking in the Light',
    scripture_reference: '1 John 1:7',
    scripture_text: 'But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus his Son cleanses us from all sin.',
    reflection: 'Walking in the light means living transparently before God and others. It\'s not about perfection, but about honesty and quick repentance when we stumble.',
    prayer: 'Lord, help me walk in Your light today. Reveal any darkness in me and give me the courage to bring it into Your light.',
    application_question: 'Is there an area of your life you\'ve been keeping in darkness? What would it look like to bring it into the light?',
    source: 'manual',
    created_at: new Date('2026-01-17').toISOString(),
    published_at: new Date('2026-01-17').toISOString(),
  },
  {
    date: '2026-01-18',
    title: 'The God Who Sees',
    scripture_reference: 'Genesis 16:13',
    scripture_text: 'She gave this name to the Lord who spoke to her: "You are the God who sees me," for she said, "I have now seen the One who sees me."',
    reflection: 'Hagar was alone, abandoned, and desperate. Yet God found her in the wilderness. No matter how isolated or forgotten you feel, God sees you. He knows your name, your pain, and your future.',
    prayer: 'Thank You, Lord, for seeing me when I feel invisible. Help me trust that You are with me in every wilderness.',
    application_question: 'When have you felt unseen by others? How does knowing God sees you change your perspective?',
    source: 'manual',
    created_at: new Date('2026-01-18').toISOString(),
    published_at: new Date('2026-01-18').toISOString(),
  },
  {
    date: '2026-01-19',
    title: 'Abiding in the Vine',
    scripture_reference: 'John 15:4-5',
    scripture_text: 'Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you, unless you abide in me. I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.',
    reflection: 'Fruitfulness doesn\'t come from striving, but from abiding. Our primary calling is not to produce fruit, but to stay connected to the Vine. Everything else flows from that connection.',
    prayer: 'Jesus, teach me to abide in You. Help me rest in Your love and draw my strength from You alone.',
    application_question: 'Are you trying to produce fruit in your own strength, or are you abiding in Christ? What does abiding look like practically today?',
    source: 'manual',
    created_at: new Date('2026-01-19').toISOString(),
    published_at: new Date('2026-01-19').toISOString(),
  },
];

async function seedMockData() {
  console.log('🌱 Seeding mock data into Supabase...');

  // Seed music
  console.log('🎵 Seeding church_music...');
  for (const track of MOCK_MUSIC) {
    const { error } = await supabase
      .from('church_music')
      .upsert(track, { onConflict: 'title' });
    if (error) console.error(`Error seeding music "${track.title}":`, error.message);
    else console.log(`✅ Music: ${track.title}`);
  }

  // Seed programs
  console.log('📅 Seeding programs...');
  for (const program of MOCK_PROGRAMS) {
    const { error } = await supabase
      .from('programs')
      .upsert(program, { onConflict: 'title' });
    if (error) console.error(`Error seeding program "${program.title}":`, error.message);
    else console.log(`✅ Program: ${program.title}`);
  }

  // Seed devotionals
  console.log('📖 Seeding devotionals...');
  for (const dev of MOCK_DEVOTIONALS) {
    const { error } = await supabase
      .from('devotionals')
      .upsert(dev, { onConflict: 'date' });
    if (error) console.error(`Error seeding devotional "${dev.title}":`, error.message);
    else console.log(`✅ Devotional: ${dev.title}`);
  }

  // Seed the daily-devotional table (used by the daily feed pages)
  console.log('📖 Seeding daily devotionals...');
  for (const dev of MOCK_DEVOTIONALS) {
    const { error } = await supabase
      .from('daily_devotionals')
      .upsert(dev, { onConflict: 'date' });
    if (error) console.error(`Error seeding daily devotional "${dev.title}":`, error.message);
    else console.log(`✅ Daily devotional: ${dev.title}`);
  }

  console.log('\n✅ All mock data seeded successfully!');
}

seedMockData().catch(console.error);
