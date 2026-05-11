import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}
