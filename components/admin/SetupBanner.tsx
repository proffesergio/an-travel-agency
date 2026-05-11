import { AlertTriangle } from 'lucide-react';

export function DatabaseUnreachableBanner({ error }: { error?: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium text-amber-900">Database not connected</h3>
        <p className="text-sm text-amber-800 mt-1">
          The site can&apos;t reach MongoDB right now. Open <strong>Settings</strong> to see
          what&apos;s configured, and make sure <code className="px-1 bg-amber-100 rounded">MONGODB_URI</code> in
          your <code className="px-1 bg-amber-100 rounded">.env.local</code> (or cPanel
          environment variables) points at a real MongoDB Atlas cluster — not the example
          placeholder.
        </p>
        {error && (
          <p className="text-xs text-amber-700 mt-2 font-mono break-all">{error}</p>
        )}
      </div>
    </div>
  );
}
