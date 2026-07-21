'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isValidObjectId } from 'mongoose';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/auth-guards';
import {
  updateEnquiryStatus as updateEnquiryStatusService,
  deleteEnquiry as deleteEnquiryService,
} from '@/lib/services/enquiries';
import { enquiryStatusSchema } from '@/lib/validation/enquiry';

export async function updateEnquiryStatusAction(id: string, status: string) {
  const session = await auth();
  if (!isAdminSession(session)) throw new Error('Unauthorized');
  if (!isValidObjectId(id)) throw new Error('Invalid enquiry id');

  const parsed = enquiryStatusSchema.safeParse({ status });
  if (!parsed.success) throw new Error('Invalid status value');

  const enquiry = await updateEnquiryStatusService(
    id,
    parsed.data.status,
    session.user?.email ?? 'unknown'
  );
  if (!enquiry) throw new Error('Enquiry not found');

  revalidatePath('/admin/enquiries');
  revalidatePath(`/admin/enquiries/${id}`);
}

export async function deleteEnquiryAction(id: string) {
  const session = await auth();
  if (!isAdminSession(session)) throw new Error('Unauthorized');
  if (!isValidObjectId(id)) throw new Error('Invalid enquiry id');

  const enquiry = await deleteEnquiryService(id, session.user?.email ?? 'unknown');
  if (!enquiry) throw new Error('Enquiry not found');

  revalidatePath('/admin/enquiries');
  redirect('/admin/enquiries');
}
