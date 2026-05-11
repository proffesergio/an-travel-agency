'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { deletePackageAction } from '@/app/admin/(dashboard)/packages/actions';

interface DeletePackageButtonProps {
  id: string;
  packageTitle: string;
  variant?: 'icon' | 'button';
  redirectAfter?: string;
}

export function DeletePackageButton({
  id,
  packageTitle,
  variant = 'icon',
  redirectAfter,
}: DeletePackageButtonProps) {
  const triggerClassName =
    variant === 'icon'
      ? 'p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
      : 'inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium';

  return (
    <ConfirmButton
      action={async () => {
        await deletePackageAction(id, redirectAfter);
      }}
      title="Delete package?"
      description={`This will permanently delete "${packageTitle}". This action cannot be undone.`}
      confirmLabel="Delete package"
      destructive
      triggerLabel={variant === 'icon' ? '' : 'Delete'}
      triggerIcon={<Trash2 className="w-4 h-4" />}
      triggerClassName={triggerClassName}
      successMessage="Package deleted."
    />
  );
}
