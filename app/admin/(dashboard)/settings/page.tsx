import { auth } from '@/lib/auth';
import { CheckCircle2, XCircle, Settings as SettingsIcon, ShieldCheck, Mail, Phone, KeyRound } from 'lucide-react';

interface IntegrationCheck {
  key: string;
  label: string;
  status: 'configured' | 'missing' | 'optional-missing';
  hint?: string;
}

function checkIntegrations(): IntegrationCheck[] {
  return [
    {
      key: 'mongodb',
      label: 'MongoDB Atlas',
      status: process.env.MONGODB_URI ? 'configured' : 'missing',
      hint: 'Connection string for the database. Required.',
    },
    {
      key: 'nextauth-secret',
      label: 'NextAuth Secret',
      status:
        process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32
          ? 'configured'
          : 'missing',
      hint: 'Random 32+ character string used to sign JWTs. Required.',
    },
    {
      key: 'admin-creds',
      label: 'Admin Credentials',
      status: process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD ? 'configured' : 'missing',
      hint: 'ADMIN_EMAIL and ADMIN_PASSWORD env vars. Required.',
    },
    {
      key: 'cloudinary',
      label: 'Cloudinary Image Hosting',
      status:
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
          ? 'configured'
          : 'missing',
      hint: 'Cloudinary credentials for package image uploads. Required if you upload images.',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp Public Number',
      status: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? 'configured' : 'missing',
      hint: 'NEXT_PUBLIC_WHATSAPP_NUMBER — used for the public-site floating WhatsApp button.',
    },
    {
      key: 'smtp',
      label: 'Email (SMTP)',
      status: process.env.GMAIL_USER || process.env.SMTP_HOST ? 'configured' : 'optional-missing',
      hint: 'Optional. Configure later when you want automated email notifications.',
    },
    {
      key: 'sslcommerz',
      label: 'SSLCommerz Payment',
      status: process.env.SSLCOMMERZ_STORE_ID ? 'configured' : 'optional-missing',
      hint: 'Optional. Currently deferred — admins handle payment manually via WhatsApp.',
    },
  ];
}

export default async function AdminSettingsPage() {
  const session = await auth();
  const integrations = checkIntegrations();
  const configuredCount = integrations.filter((i) => i.status === 'configured').length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-[#2d6a4f]/10 text-[#2d6a4f]">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Admin profile and environment configuration health
          </p>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Admin Profile
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
          <div>
            <dt className="text-xs text-gray-500">Name</dt>
            <dd className="mt-1 text-gray-900 font-medium">{session?.user?.name ?? 'Admin'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </dt>
            <dd className="mt-1 text-gray-900">{session?.user?.email ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-500 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Credentials
            </dt>
            <dd className="mt-1 text-sm text-gray-600">
              Admin credentials are set via the <code className="px-1.5 py-0.5 bg-gray-100 rounded">ADMIN_EMAIL</code> and{' '}
              <code className="px-1.5 py-0.5 bg-gray-100 rounded">ADMIN_PASSWORD</code> environment
              variables. To change them, update your <code className="px-1.5 py-0.5 bg-gray-100 rounded">.env.local</code> (development) or your cPanel Node.js App
              environment variables (production), then restart the app.
            </dd>
          </div>
        </dl>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Integrations Health
          </h2>
          <span className="text-sm text-gray-500">
            {configuredCount}/{integrations.length} configured
          </span>
        </div>
        <ul className="divide-y divide-gray-100">
          {integrations.map((i) => (
            <li key={i.key} className="py-3 flex items-start gap-3">
              {i.status === 'configured' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : i.status === 'optional-missing' ? (
                <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{i.label}</span>
                  <span
                    className={`text-xs font-medium ${
                      i.status === 'configured'
                        ? 'text-green-700'
                        : i.status === 'optional-missing'
                        ? 'text-gray-500'
                        : 'text-red-600'
                    }`}
                  >
                    {i.status === 'configured'
                      ? 'Configured'
                      : i.status === 'optional-missing'
                      ? 'Optional · Not set'
                      : 'Missing'}
                  </span>
                </div>
                {i.hint && <p className="text-xs text-gray-500 mt-0.5">{i.hint}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Phone className="w-4 h-4" /> Public WhatsApp Number
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          The public site shows a floating WhatsApp button using this number:
        </p>
        <p className="font-mono text-sm bg-gray-50 inline-block px-3 py-1.5 rounded border border-gray-200">
          {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '— not set —'}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          To change it, update <code className="px-1 bg-gray-100 rounded">NEXT_PUBLIC_WHATSAPP_NUMBER</code> in your environment and rebuild.
        </p>
      </section>
    </div>
  );
}
