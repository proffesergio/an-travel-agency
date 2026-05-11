import { NextRequest, NextResponse } from 'next/server';
import { enquiryInputSchema } from '@/lib/validation/enquiry';
import { createEnquiry } from '@/lib/services/enquiries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = enquiryInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await createEnquiry(parsed.data);
    return NextResponse.json({
      success: true,
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
