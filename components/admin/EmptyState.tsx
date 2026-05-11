import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';

interface EmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {message && <p className="text-gray-500 mb-4">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
