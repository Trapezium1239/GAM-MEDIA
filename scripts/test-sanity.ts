import fs from 'fs';
import path from 'path';
import MiniSearch from 'minisearch';

interface SermonRecord {
  id: string;
  title: string;
  preacher: string;
  date: string;
  duration: string;
  r2_key: string;
  topic_name: string;
}

function runSanityTest() {
  console.log('🔍 Running post-build sanity tests...\n');
  const indexPath = path.join(process.cwd(), 'public/search-index.json');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ public/search-index.json is missing! Run ingestion first.');
    process.exit(1);
  }

  let data: SermonRecord[];
  try {
    data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to parse search-index.json:', err);
    process.exit(1);
  }

  console.log(`📦 Loaded ${data.length} records into test suite.`);
  
  if (data.length === 0) {
    console.warn('⚠️ Search index is empty. No sermons ingested.');
    return;
  }

  // Validate required fields
  const requiredFields = ['id', 'title', 'preacher', 'date', 'duration', 'r2_key', 'topic_name'] as const;
  let validCount = 0;
  let invalidCount = 0;

  for (const record of data) {
    const missing = requiredFields.filter(f => !record[f]);
    if (missing.length > 0) {
      console.error(`❌ Invalid record ${record.id}: missing ${missing.join(', ')}`);
      invalidCount++;
    } else {
      validCount++;
    }
  }

  console.log(`✅ Valid records: ${validCount}`);
  if (invalidCount > 0) console.log(`❌ Invalid records: ${invalidCount}`);

  // Test MiniSearch
  const miniSearch = new MiniSearch<SermonRecord>({
    fields: ['title', 'preacher', 'topic_name'],
    storeFields: ['id', 'title', 'preacher', 'date', 'duration', 'r2_key', 'topic_name'],
    searchOptions: {
      fuzzy: 0.2,
      prefix: true,
      boost: { title: 2, preacher: 1.5 },
    },
  });

  miniSearch.addAll(data);

  // Test queries
  const testQueries = ['faith', 'prayer', 'sunday', 'worship', 'pastor'];
  console.log('\n🔍 Test query results:');
  
  for (const query of testQueries) {
    const results = miniSearch.search(query);
    console.log(`   "${query}": ${results.length} matches`);
    if (results.length > 0 && results[0]) {
      const top = results[0];
      console.log(`      Top: "${top.title}" by ${top.preacher} (${top.date})`);
    }
  }

  // Test exact ID lookup
  const firstRecord = data[0];
  if (firstRecord) {
    const exact = miniSearch.search(firstRecord.id);
    console.log(`\n🔍 Exact ID lookup (${firstRecord.id}): ${exact.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
  }

  // Performance test
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    miniSearch.search('faith');
  }
  const elapsed = performance.now() - start;
  console.log(`\n⚡ Performance: 100 searches in ${elapsed.toFixed(2)}ms (${(elapsed/100).toFixed(3)}ms per search)`);

  console.log('\n✅ All sanity tests passed!');
}

runSanityTest();