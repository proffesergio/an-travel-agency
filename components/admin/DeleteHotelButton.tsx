'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteHotelAction } from '@/app/admin/(dashboard)/hotels/actions';

export default function DeleteHotelButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(`Delete hotel "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteHotelAction(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Hotel deleted');
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
      title="Delete hotel"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
