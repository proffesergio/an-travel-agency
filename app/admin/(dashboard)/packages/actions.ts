'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isValidObjectId } from 'mongoose';
import { auth } from '@/lib/auth';
import { deletePackage as deletePackageService } from '@/lib/services/packages';

export async function deletePackageAction(id: string, redirectAfter?: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  if (!isValidObjectId(id)) throw new Error('Invalid package id');

  const pkg = await deletePackageService(id, session.user?.email ?? 'unknown');
  if (!pkg) throw new Error('Package not found');

  revalidatePath('/admin/packages');
  if (redirectAfter) redirect(redirectAfter);
}
