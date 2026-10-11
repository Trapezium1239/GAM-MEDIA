import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function setupCors() {
  console.log('🔧 Configuring R2 CORS policy...');
  
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://gam.church",
    "https://www.gam.church",
    "https://*.vercel.app",
  ].filter(Boolean);

  const command = new PutBucketCorsCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: allowedOrigins,
          AllowedMethods: ["GET", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["Content-Length", "Content-Range", "Accept-Ranges", "Content-Type"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });

  try {
    await r2Client.send(command);
    console.log("✅ R2 CORS policy applied successfully!");
    console.log("   Allowed origins:", allowedOrigins.join(", "));
    console.log("   Allowed methods: GET, HEAD");
    console.log("   Exposed headers: Content-Length, Content-Range, Accept-Ranges, Content-Type");
  } catch (err) {
    console.error("❌ Failed to apply CORS policy:", err);
    process.exit(1);
  }
}

setupCors().catch(console.error);