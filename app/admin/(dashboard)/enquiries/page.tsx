import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listEnquiries } from '@/lib/services/enquiries';
import { logActivity } from '@/lib/services/activity';
import { MessageSquare, Filter, Eye, Phone, Mail, Calendar, User } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/admin/EmptyState';
import { DatabaseUnreachableBanner } from '@/components/admin/SetupBanner';

const paymentStatusStyles: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
};

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; payment?: string }>;
}) {
  const session = await auth();
  const { status, category, payment } = await searchParams;

  let enquiries: Awaited<ReturnType<typeof listEnquiries>> = [];
  let dbError: string | undefined;
  try {
    enquiries = await listEnquiries({ status, category, payment });
    await logActivity({
      action: 'view',
      entityType: 'enquiry',
      actor: session?.user?.email ?? 'unknown',
      details: `Viewed enquiries list${status && status !== 'all' ? ` (status: ${status})` : ''}`,
    });
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Database error';
  }

  const statusOptions = ['all', 'new', 'contacted', 'closed'];
  const categoryOptions = ['all', 'hajj', 'umrah', 'tour', 'air-ticketing', 'hotel', 'general'];
  const paymentOptions = ['all', 'paid', 'pending', 'failed'];

  return (
    <div className="p-4 sm:p-6">
      {dbError && <DatabaseUnreachableBanner error={dbError} />}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage customer booking enquiries</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: <span className="font-medium text-gray-900">{enquiries.length}</span> enquiries
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <form className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              name="status"
              defaultValue={status || 'all'}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none bg-white"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <select
            name="category"
            defaultValue={category || 'all'}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none bg-white"
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c === 'air-ticketing' ? 'Air Ticketing' : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <select
            name="payment"
            defaultValue={payment || 'all'}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none bg-white"
          >
            {paymentOptions.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All Payments' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Filter
          </button>
        </form>
      </div>

      {enquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No enquiries found"
          message="Enquiries from customers will appear here."
        />
      ) : (
        <div className="space-y-4">
          {enquiries.map((enquiry) => (
            <div
              key={String(enquiry._id)}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#2d6a4f]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{enquiry.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
                        {enquiry.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {enquiry.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {enquiry.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusBadge value={enquiry.status} variant="status" />
                    <StatusBadge value={enquiry.category} variant="category" />
                    {enquiry.paymentStatus && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          paymentStatusStyles[enquiry.paymentStatus] ?? 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {enquiry.paymentStatus === 'paid'
                          ? '✓ Paid'
                          : enquiry.paymentStatus === 'failed'
                          ? 'Payment failed'
                          : `Payment ${enquiry.paymentStatus}`}
                        {enquiry.paymentAmount ? ` · ৳${enquiry.paymentAmount.toLocaleString('en-IN')}` : ''}
                      </span>
                    )}
                    {enquiry.packageTitle && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {enquiry.packageTitle}
                      </span>
                    )}
                    {enquiry.passengers ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {enquiry.passengers} passenger(s)
                      </span>
                    ) : null}
                  </div>

                  {enquiry.message && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {enquiry.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {enquiry.createdAt
                      ? new Date(enquiry.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </div>

                  <Link
                    href={`/admin/enquiries/${enquiry._id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
