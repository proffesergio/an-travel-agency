import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidObjectId } from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import { logActivity } from '@/lib/services/activity';
import { buildWhatsAppLink, defaultEnquiryGreeting, normalizePhone } from '@/lib/whatsapp';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  Users,
  MessageSquare,
  Package as PackageIcon,
  Trash2,
  IdCard,
  CreditCard,
  Cake,
  MapPin,
  FileImage,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { updateEnquiryStatusAction, deleteEnquiryAction } from './actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusStyles: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  closed: 'bg-green-100 text-green-800',
};

const statusOrder = ['new', 'contacted', 'closed'] as const;

const paymentStatusStyles: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
};

const paymentMethodLabels: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash on Office',
  piprapay: 'PipraPay (Online)',
  sslcommerz: 'SSLCommerz (Online)',
};

const DOCUMENT_LABELS: Record<string, string> = {
  passportImage: 'Passport',
  nidImage: 'National ID',
  photoImage: 'Passport-size Photo',
};

export default async function AdminEnquiryDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const session = await auth();
  await connectDB();
  const enquiry = await Enquiry.findById(id).lean();
  if (!enquiry) notFound();

  await logActivity({
    action: 'view',
    entityType: 'enquiry',
    entityId: id,
    entityName: enquiry.name,
    actor: session?.user?.email ?? 'unknown',
    details: `Viewed enquiry from ${enquiry.name}`,
  });

  const normalizedPhone = normalizePhone(enquiry.phone);
  const whatsappLink = buildWhatsAppLink(
    enquiry.phone,
    defaultEnquiryGreeting(enquiry.name, enquiry.packageTitle)
  );

  const createdAt = enquiry.createdAt
    ? new Date(enquiry.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/enquiries"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to enquiries"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enquiry from {enquiry.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Received {createdAt}</p>
          </div>
        </div>
        <form action={async () => {
          'use server';
          await deleteEnquiryAction(id);
        }}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Customer Details
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Name
                </dt>
                <dd className="mt-1 text-gray-900 font-medium">{enquiry.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </dt>
                <dd className="mt-1 text-gray-900">
                  <a href={`tel:${enquiry.phone}`} className="hover:underline">
                    {enquiry.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </dt>
                <dd className="mt-1 text-gray-900">
                  {enquiry.email ? (
                    <a href={`mailto:${enquiry.email}`} className="hover:underline">
                      {enquiry.email}
                    </a>
                  ) : (
                    <span className="text-gray-400">Not provided</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Passengers
                </dt>
                <dd className="mt-1 text-gray-900">{enquiry.passengers ?? 1}</dd>
              </div>
              {enquiry.nameBn && (
                <div>
                  <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Name (Bangla)
                  </dt>
                  <dd className="mt-1 text-gray-900">{enquiry.nameBn}</dd>
                </div>
              )}
              {enquiry.nidNumber && (
                <div>
                  <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5" /> NID Number
                  </dt>
                  <dd className="mt-1 text-gray-900 font-mono">{enquiry.nidNumber}</dd>
                </div>
              )}
              {enquiry.passportNumber && (
                <div>
                  <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Passport Number
                  </dt>
                  <dd className="mt-1 text-gray-900 font-mono">{enquiry.passportNumber}</dd>
                </div>
              )}
              {enquiry.dateOfBirth && (
                <div>
                  <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Cake className="w-3.5 h-3.5" /> Date of Birth
                  </dt>
                  <dd className="mt-1 text-gray-900">{enquiry.dateOfBirth}</dd>
                </div>
              )}
              {enquiry.address && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Address
                  </dt>
                  <dd className="mt-1 text-gray-900">{enquiry.address}</dd>
                </div>
              )}
              {enquiry.packageTitle && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-gray-500 flex items-center gap-1.5">
                    <PackageIcon className="w-3.5 h-3.5" /> Package
                  </dt>
                  <dd className="mt-1 text-gray-900">{enquiry.packageTitle}</dd>
                </div>
              )}
            </dl>
          </section>

          {enquiry.documents &&
            Object.values(enquiry.documents).some(Boolean) && (
              <section className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <FileImage className="w-4 h-4" /> Uploaded Documents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['passportImage', 'nidImage', 'photoImage'] as const).map((key) => {
                    const url = enquiry.documents?.[key];
                    if (!url) return null;
                    const isPdf = url.toLowerCase().endsWith('.pdf');
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group block rounded-lg border border-gray-200 overflow-hidden hover:border-[#2d6a4f] hover:shadow-md transition-all"
                      >
                        <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
                          {isPdf ? (
                            <div className="flex flex-col items-center text-gray-400">
                              <FileImage className="w-8 h-8 mb-1" />
                              <span className="text-xs font-medium">PDF</span>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={url}
                              alt={DOCUMENT_LABELS[key]}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-700 p-2 text-center">
                          {DOCUMENT_LABELS[key]}
                        </p>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Message
            </h2>
            {enquiry.message ? (
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{enquiry.message}</p>
            ) : (
              <p className="text-sm text-gray-400">No message provided.</p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment
            </h2>
            {enquiry.paymentStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      paymentStatusStyles[enquiry.paymentStatus] ?? 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {enquiry.paymentStatus === 'paid' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : enquiry.paymentStatus === 'failed' ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {enquiry.paymentStatus}
                  </span>
                </div>
                {enquiry.paymentAmount ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="text-sm font-bold text-gray-900">
                      ৳{enquiry.paymentAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : null}
                {enquiry.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Method</span>
                    <span className="text-sm font-medium text-gray-900">
                      {paymentMethodLabels[enquiry.paymentMethod] ?? enquiry.paymentMethod}
                    </span>
                  </div>
                )}
                {enquiry.paymentReference && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-500">Reference</span>
                    <span className="text-sm font-mono text-gray-900 truncate max-w-[150px]" title={enquiry.paymentReference}>
                      {enquiry.paymentReference}
                    </span>
                  </div>
                )}
                {enquiry.transactionId && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-500">Txn ID</span>
                    <span className="text-sm font-mono text-gray-900 truncate max-w-[150px]" title={enquiry.transactionId}>
                      {enquiry.transactionId}
                    </span>
                  </div>
                )}
                {enquiry.paidAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Paid at</span>
                    <span className="text-sm text-gray-700">
                      {new Date(enquiry.paidAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No payment recorded yet.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Status
            </h2>
            <div className="mb-4">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  statusStyles[enquiry.status] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {enquiry.status}
              </span>
            </div>
            <div className="space-y-2">
              {statusOrder
                .filter((s) => s !== enquiry.status)
                .map((s) => (
                  <form
                    key={s}
                    action={async () => {
                      'use server';
                      await updateEnquiryStatusAction(id, s);
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors text-left capitalize"
                    >
                      Mark as {s}
                    </button>
                  </form>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Contact Customer
            </h2>
            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-lg hover:bg-[#1da851] transition-colors font-medium"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                </svg>
                WhatsApp {normalizedPhone}
              </a>
            ) : (
              <p className="text-sm text-gray-400">No valid phone number on file.</p>
            )}
            <a
              href={`tel:${enquiry.phone}`}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
            {enquiry.email && (
              <a
                href={`mailto:${enquiry.email}`}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Meta
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900 capitalize">
                  {enquiry.category === 'air-ticketing' ? 'Air Ticketing' : enquiry.category}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Created
                </dt>
                <dd className="text-gray-700">{createdAt}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
