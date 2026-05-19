import { NextRequest, NextResponse } from 'next/server';
import { enquiryInputSchema } from '@/lib/validation/enquiry';
import { createEnquiry } from '@/lib/services/enquiries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = enquiryInputSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstFieldError = Object.values(flat.fieldErrors)
        .flat()
        .find((m): m is string => typeof m === 'string' && m.length > 0);
      return NextResponse.json(
        { error: firstFieldError ?? 'Validation failed', issues: flat },
        { status: 400 }
      );
    }

    const enquiry = await createEnquiry(parsed.data);
    return NextResponse.json({
      success: true,
      enquiryId: enquiry._id.toString(),
      message: 'Enquiry submitted successfully. We will contact you shortly.',
    });
  } catch (error) {
    console.error('[api/enquiries] POST failed', error);
    return NextResponse.json(
      { error: 'Failed to submit enquiry. Please try again or contact us via WhatsApp.' },
      { status: 500 }
    );
  }
}
