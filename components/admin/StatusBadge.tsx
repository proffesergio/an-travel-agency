const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  closed: 'bg-green-100 text-green-800',
};

const CATEGORY_STYLES: Record<string, string> = {
  hajj: 'bg-amber-100 text-amber-800',
  umrah: 'bg-green-100 text-green-800',
  tour: 'bg-blue-100 text-blue-800',
  'air-ticketing': 'bg-cyan-100 text-cyan-800',
  general: 'bg-gray-100 text-gray-800',
};

const CATEGORY_LABELS: Record<string, string> = {
  'air-ticketing': 'Air Ticketing',
};

function labelFor(value: string): string {
  return CATEGORY_LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

interface BadgeProps {
  value: string;
  variant?: 'status' | 'category' | 'neutral';
  className?: string;
}

export function StatusBadge({ value, variant = 'neutral', className = '' }: BadgeProps) {
  const styleMap = variant === 'status' ? STATUS_STYLES : variant === 'category' ? CATEGORY_STYLES : {};
  const style = styleMap[value] ?? 'bg-gray-100 text-gray-800';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style} ${className}`}
    >
      {labelFor(value)}
    </span>
  );
}
