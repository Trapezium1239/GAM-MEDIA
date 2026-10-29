import { S3Client, CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function main() {
  const bucket = process.env.R2_BUCKET_NAME!;
  console.log('Creating bucket:', bucket);
  try {
    await r2.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log('✅ Bucket created');
  } catch (e: any) {
    if (e?.name === 'BucketAlreadyOwnedByYou' || e?.Code === 'BucketAlreadyExists') {
      console.log('ℹ️ Bucket already exists');
    } else {
      console.error('CreateBucket error:', e?.message || e);
    }
  }

  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://gam.church', 'https://www.gam.church', 'https://*.vercel.app'].filter(Boolean);
  await r2.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [{
        AllowedOrigins: allowedOrigins,
        AllowedMethods: ['GET', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Type'],
        MaxAgeSeconds: 3600,
      }],
    },
  }));
  console.log('✅ CORS applied');
}

main().catch((e) => { console.error(e); process.exit(1); });
