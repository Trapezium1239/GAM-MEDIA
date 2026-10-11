import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { secureApi, requireAdminRole } from '@/lib/security/api';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/aac'];

async function handler(req: Request) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  try {
    const formData = await req.formData();
    const file = formData.get('audio') as File;
    const folder = formData.get('folder') as string || 'sermons';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid audio format. Allowed: MP3, WAV, M4A, OGG, AAC' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 100MB' }, { status: 400 });
    }

    const supabase = await createClient();

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('church-media')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('church-media')
      .getPublicUrl(filePath);

    return NextResponse.json({
      status: 'uploaded',
      url: publicUrl,
      path: filePath,
      fileName: file.name,
      size: file.size,
      type: file.type,
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Upload failed' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return secureApi(req, handler);
}