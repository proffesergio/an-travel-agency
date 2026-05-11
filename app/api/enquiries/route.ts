import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, category, packageTitle, message, passengers } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Try to save to MongoDB if connected; otherwise log and return success
    // (Full DB integration happens in Phase 3 once MONGODB_URI is configured)
    try {
      const { connectDB } = await import('@/lib/mongodb');
      const Enquiry = (await import('@/models/Enquiry')).default;
      await connectDB();
      await Enquiry.create({
        name,
        phone,
        email: email || '',
        category: category || 'general',
        packageTitle: packageTitle || '',
        message: message || '',
        passengers: passengers || 1,
        status: 'new',
      });
    } catch (dbError) {
      // DB not yet configured — still acknowledge the enquiry
      console.log('Enquiry received (DB not connected):', { name, phone, category, packageTitle });
    }

    return NextResponse.json({ success: true, message: 'Enquiry submitted successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { connectDB } = await import('@/lib/mongodb');
    const Enquiry = (await import('@/models/Enquiry')).default;
    await connectDB();
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(enquiries);
  } catch {
    return NextResponse.json({ enquiries: [] });
  }
}
