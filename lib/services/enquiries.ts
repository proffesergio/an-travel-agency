import { connectDB } from '@/lib/mongodb';
import Enquiry, { type IEnquiry } from '@/models/Enquiry';
import { logActivity } from '@/lib/services/activity';
import type { EnquiryInput } from '@/lib/validation/enquiry';

export interface EnquiryFilters {
  status?: string;
  category?: string;
}

export async function listEnquiries(filters: EnquiryFilters = {}) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.status && filters.status !== 'all') query.status = filters.status;
  if (filters.category && filters.category !== 'all') query.category = filters.category;
  return Enquiry.find(query).sort({ createdAt: -1 }).lean();
}

export async function getEnquiryById(id: string) {
  await connectDB();
  return Enquiry.findById(id).lean();
}

export async function createEnquiry(input: EnquiryInput): Promise<IEnquiry> {
  await connectDB();
  return Enquiry.create({ ...input, status: 'new' });
}

export async function updateEnquiryStatus(
  id: string,
  status: 'new' | 'contacted' | 'closed',
  actor: string
): Promise<IEnquiry | null> {
  await connectDB();
  const enquiry = await Enquiry.findByIdAndUpdate(id, { status }, { new: true });
  if (!enquiry) return null;
  await logActivity({
    action: 'update',
    entityType: 'enquiry',
    entityId: id,
    entityName: enquiry.name,
    actor,
    details: `Marked enquiry as ${status}`,
  });
  return enquiry;
}

export async function deleteEnquiry(id: string, actor: string): Promise<IEnquiry | null> {
  await connectDB();
  const enquiry = await Enquiry.findByIdAndDelete(id);
  if (!enquiry) return null;
  await logActivity({
    action: 'delete',
    entityType: 'enquiry',
    entityId: id,
    entityName: enquiry.name,
    actor,
    details: `Deleted enquiry from ${enquiry.name}`,
  });
  return enquiry;
}

export async function countEnquiriesByStatus() {
  await connectDB();
  const [total, fresh, contacted, closed] = await Promise.all([
    Enquiry.countDocuments(),
    Enquiry.countDocuments({ status: 'new' }),
    Enquiry.countDocuments({ status: 'contacted' }),
    Enquiry.countDocuments({ status: 'closed' }),
  ]);
  return { total, new: fresh, contacted, closed };
}
