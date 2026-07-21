import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/auth-guards';
import { isCloudinaryConfigured } from '@/lib/env';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.',
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_FILE_BYTES / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    configureCloudinary();
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader.upload(
          base64,
          {
            folder: 'atharnur-travels',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, uploadResult) => {
            if (error) reject(error);
            else if (uploadResult) resolve(uploadResult as { secure_url: string; public_id: string });
            else reject(new Error('No result from Cloudinary'));
          }
        );
      }
    );

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error: unknown) {
    console.error('[api/upload] failed', error);
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
