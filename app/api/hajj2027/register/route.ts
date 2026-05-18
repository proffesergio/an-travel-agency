import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { hajj2027RegistrationSchema } from '@/lib/validation/hajj2027';
import { createEnquiry } from '@/lib/services/enquiries';
import { isCloudinaryConfigured } from '@/lib/env';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
const DOC_FIELDS = ['passportImage', 'nidImage', 'photoImage'] as const;
type DocField = (typeof DOC_FIELDS)[number];

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function uploadDocument(file: File, label: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload(
      base64,
      {
        folder: 'atharnur-travels/hajj2027',
        resource_type: 'auto',
        context: { label },
        transformation: file.type === 'application/pdf' ? undefined : [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto:good' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result.secure_url);
        else reject(new Error('No result from Cloudinary'));
      }
    );
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const fields = {
      name: formData.get('name')?.toString() ?? '',
      nameBn: formData.get('nameBn')?.toString() ?? '',
      phone: formData.get('phone')?.toString() ?? '',
      email: formData.get('email')?.toString() ?? '',
      nidNumber: formData.get('nidNumber')?.toString() ?? '',
      passportNumber: formData.get('passportNumber')?.toString() ?? '',
      dateOfBirth: formData.get('dateOfBirth')?.toString() ?? '',
      address: formData.get('address')?.toString() ?? '',
      packageType:
        (formData.get('packageType')?.toString() as 'economy' | 'standard' | 'premium' | 'undecided') ??
        'undecided',
      notes: formData.get('notes')?.toString() ?? '',
    };

    const parsed = hajj2027RegistrationSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Validate file fields
    const fileMap: Partial<Record<DocField, File>> = {};
    for (const key of DOC_FIELDS) {
      const f = formData.get(key);
      if (f && f instanceof File && f.size > 0) {
        if (!ALLOWED_TYPES.has(f.type)) {
          return NextResponse.json(
            { error: `Unsupported file type for ${key}. Use JPG, PNG, WebP or PDF.` },
            { status: 400 }
          );
        }
        if (f.size > MAX_FILE_BYTES) {
          return NextResponse.json(
            { error: `${key} is larger than 5MB. Please upload a smaller file.` },
            { status: 400 }
          );
        }
        fileMap[key] = f;
      }
    }

    // Upload documents to Cloudinary (when configured), otherwise note manually
    const documentUrls: Record<string, string> = {};
    const skipped: string[] = [];
    if (isCloudinaryConfigured() && Object.keys(fileMap).length > 0) {
      configureCloudinary();
      for (const [key, file] of Object.entries(fileMap) as [DocField, File][]) {
        try {
          const url = await uploadDocument(file, key);
          documentUrls[key] = url;
        } catch (err) {
          console.error(`[hajj2027/register] upload failed for ${key}`, err);
          skipped.push(key);
        }
      }
    } else if (Object.keys(fileMap).length > 0) {
      skipped.push(...Object.keys(fileMap));
    }

    // Compose the enquiry message
    const messageLines: string[] = [
      '🕋 Hajj 2027 Pre-Registration',
      `Name: ${data.name}${data.nameBn ? ` (${data.nameBn})` : ''}`,
      `Phone: ${data.phone}`,
      data.email ? `Email: ${data.email}` : null,
      `NID: ${data.nidNumber}`,
      data.passportNumber ? `Passport: ${data.passportNumber}` : null,
      data.dateOfBirth ? `DOB: ${data.dateOfBirth}` : null,
      data.address ? `Address: ${data.address}` : null,
      `Package interest: ${data.packageType}`,
      data.notes ? `Notes: ${data.notes}` : null,
    ].filter(Boolean) as string[];

    if (Object.keys(documentUrls).length > 0) {
      messageLines.push('', 'Uploaded documents:');
      for (const [key, url] of Object.entries(documentUrls)) {
        messageLines.push(`- ${key}: ${url}`);
      }
    }
    if (skipped.length > 0) {
      messageLines.push(
        '',
        `Pending documents (to collect over WhatsApp): ${skipped.join(', ')}`
      );
    }

    const enquiry = await createEnquiry({
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      category: 'hajj',
      packageTitle: 'Hajj 2027 Pre-Registration',
      passengers: 1,
      message: messageLines.join('\n'),
    });

    return NextResponse.json({
      success: true,
      enquiryId: enquiry._id.toString(),
      message:
        skipped.length > 0
          ? 'Registration received. We will contact you on WhatsApp to collect any pending documents.'
          : 'Pre-registration submitted successfully. Our team will contact you within 24 hours.',
    });
  } catch (error) {
    console.error('[api/hajj2027/register] POST failed', error);
    return NextResponse.json(
      { error: 'Failed to submit registration. Please try again or contact us over WhatsApp.' },
      { status: 500 }
    );
  }
}
