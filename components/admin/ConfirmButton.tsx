'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConfirmButtonProps {
  action: () => Promise<void>;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  triggerLabel: string;
  triggerIcon?: React.ReactNode;
  triggerClassName?: string;
  successMessage?: string;
  destructive?: boolean;
}

export function ConfirmButton({
  action,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  triggerLabel,
  triggerIcon,
  triggerClassName = '',
  successMessage,
  destructive = false,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      try {
        await action();
        if (successMessage) toast.success(successMessage);
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Action failed');
      }
    });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerIcon}
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 id="confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-sm text-gray-600 mb-6">{description}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 ${
                  destructive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#2d6a4f] hover:bg-[#1b4332]'
                }`}
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
