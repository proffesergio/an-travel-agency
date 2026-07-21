'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/auth-guards';
import { deleteHotel } from '@/lib/services/hotels';

export async function deleteHotelAction(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!isAdminSession(session)) return { error: 'Unauthorized' };

  try {
    const deleted = await deleteHotel(id, session.user?.email ?? 'unknown');
    if (!deleted) return { error: 'Hotel not found' };
    revalidatePath('/admin/hotels');
    return {};
  } catch (error) {
    console.error('[admin/hotels] delete failed', error);
    return { error: 'Failed to delete hotel' };
  }
}
