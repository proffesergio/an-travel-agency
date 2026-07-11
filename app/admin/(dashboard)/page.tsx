import Link from 'next/link';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import Package from '@/models/Package';
import { listRecentActivity } from '@/lib/services/activity';
import { DatabaseUnreachableBanner } from '@/components/admin/SetupBanner';
import {
  Package as PackageIcon,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Wallet,
  BadgeDollarSign,
  CreditCard,
  ArrowRight,
  Plus,
} from 'lucide-react';

type Stats = {
  totalEnquiries: number;
  newEnquiries: number;
  contactedEnquiries: number;
  closedEnquiries: number;
  totalPackages: number;
  paidBookings: number;
  pendingPayments: number;
  revenueCollected: number;
  revenuePending: number;
};

const EMPTY_STATS: Stats = {
  totalEnquiries: 0,
  newEnquiries: 0,
  contactedEnquiries: 0,
  closedEnquiries: 0,
  totalPackages: 0,
  paidBookings: 0,
  pendingPayments: 0,
  revenueCollected: 0,
  revenuePending: 0,
};

function sumAmount(rows: { _id: string | null; total: number }[], id: string): number {
  return rows.find((r) => r._id === id)?.total ?? 0;
}

async function loadDashboardData(): Promise<{
  stats: Stats;
  recentActivity: Awaited<ReturnType<typeof listRecentActivity>>;
  dbError?: string;
}> {
  try {
    await connectDB();
    const [
      totalEnquiries,
      newEnquiries,
      contactedEnquiries,
      closedEnquiries,
      totalPackages,
      paidBookings,
      pendingPayments,
      revenueRows,
      recentActivity,
    ] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'new' }),
      Enquiry.countDocuments({ status: 'contacted' }),
      Enquiry.countDocuments({ status: 'closed' }),
      Package.countDocuments(),
      Enquiry.countDocuments({ paymentStatus: 'paid' }),
      Enquiry.countDocuments({ paymentStatus: 'pending' }),
      Enquiry.aggregate<{ _id: string | null; total: number }>([
        { $match: { paymentStatus: { $in: ['paid', 'pending'] } } },
        { $group: { _id: '$paymentStatus', total: { $sum: '$paymentAmount' } } },
      ]),
      listRecentActivity(8),
    ]);
    return {
      stats: {
        totalEnquiries,
        newEnquiries,
        contactedEnquiries,
        closedEnquiries,
        totalPackages,
        paidBookings,
        pendingPayments,
        revenueCollected: sumAmount(revenueRows, 'paid'),
        revenuePending: sumAmount(revenueRows, 'pending'),
      },
      recentActivity,
    };
  } catch (error) {
    return {
      stats: EMPTY_STATS,
      recentActivity: [],
      dbError: error instanceof Error ? error.message : 'Database error',
    };
  }
}

const bdt = (n: number) => '৳' + n.toLocaleString('en-IN');

export default async function AdminDashboardPage() {
  const session = await auth();
  const { stats, recentActivity, dbError } = await loadDashboardData();

  const heroCards = [
    {
      title: 'Revenue Collected',
      value: bdt(stats.revenueCollected),
      sub: `${stats.paidBookings} confirmed booking${stats.paidBookings === 1 ? '' : 's'}`,
      icon: BadgeDollarSign,
      gradient: 'from-emerald-500 to-green-700',
    },
    {
      title: 'Pending Payments',
      value: bdt(stats.revenuePending),
      sub: `${stats.pendingPayments} awaiting confirmation`,
      icon: Wallet,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Total Enquiries',
      value: stats.totalEnquiries.toString(),
      sub: `${stats.newEnquiries} new · ${stats.contactedEnquiries} in progress`,
      icon: MessageSquare,
      gradient: 'from-sky-500 to-blue-700',
    },
    {
      title: 'Packages Live',
      value: stats.totalPackages.toString(),
      sub: 'Manage tours & pilgrimages',
      icon: PackageIcon,
      gradient: 'from-violet-500 to-purple-700',
    },
  ];

  const funnel = [
    { label: 'New', value: stats.newEnquiries, color: 'bg-blue-500', href: '/admin/enquiries?status=new' },
    { label: 'Contacted', value: stats.contactedEnquiries, color: 'bg-amber-500', href: '/admin/enquiries?status=contacted' },
    { label: 'Closed', value: stats.closedEnquiries, color: 'bg-green-500', href: '/admin/enquiries?status=closed' },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  const checklist = [
    { label: 'Connect MongoDB Atlas (MONGODB_URI)', done: !!process.env.MONGODB_URI && !dbError },
    {
      label: 'Set NEXTAUTH_SECRET (≥32 chars)',
      done: !!process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32,
    },
    {
      label: 'Set admin credentials (ADMIN_EMAIL & ADMIN_PASSWORD)',
      done: !!process.env.ADMIN_EMAIL && !!process.env.ADMIN_PASSWORD,
    },
    {
      label: 'Configure Cloudinary for image uploads',
      done:
        !!process.env.CLOUDINARY_CLOUD_NAME &&
        !!process.env.CLOUDINARY_API_KEY &&
        !!process.env.CLOUDINARY_API_SECRET,
    },
    {
      label: 'Set public WhatsApp number (NEXT_PUBLIC_WHATSAPP_NUMBER)',
      done: !!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    },
    {
      label: 'Configure online payment (SSLCommerz / PipraPay)',
      done: !!process.env.SSLCOMMERZ_STORE_ID || !!process.env.PIPRAPAY_API_KEY,
    },
  ];
  const completedCount = checklist.filter((item) => item.done).length;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'update':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'delete':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {session?.user?.name ?? 'Admin'} 👋
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/packages/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Package
          </Link>
          <Link
            href="/admin/enquiries"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <MessageSquare className="w-4 h-4" /> View Enquiries
          </Link>
        </div>
      </div>

      {dbError && <DatabaseUnreachableBanner error={dbError} />}

      {/* Hero metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {heroCards.map((card) => (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${card.gradient} shadow-sm`}
          >
            <div className="absolute -right-6 -top-6 opacity-20">
              <card.icon className="w-28 h-28" />
            </div>
            <div className="relative">
              <div className="p-2 rounded-lg bg-white/20 w-fit mb-4">
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-extrabold leading-tight">{card.value}</p>
              <p className="text-sm font-medium text-white/90">{card.title}</p>
              <p className="text-xs text-white/75 mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enquiry funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Enquiry Pipeline</h2>
            <Link href="/admin/analytics" className="text-sm text-[#2d6a4f] hover:underline flex items-center gap-1">
              Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            {funnel.map((f) => (
              <Link key={f.label} href={f.href} className="block group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#2d6a4f]">{f.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{f.value}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${f.color} h-3 rounded-full transition-all`}
                    style={{ width: `${Math.round((f.value / funnelMax) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-50 text-green-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.paidBookings}</p>
                <p className="text-xs text-gray-500">Confirmed bookings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.pendingPayments}</p>
                <p className="text-xs text-gray-500">Payments pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {dbError ? 'Connect the database to see activity.' : 'No recent activity'}
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={String(activity._id)} className="flex items-start gap-3">
                  {getActionIcon(activity.action)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      <span className="font-medium capitalize">{activity.action}</span>{' '}
                      {activity.entityType}
                      {activity.entityName ? `: ${activity.entityName}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.createdAt
                        ? new Date(activity.createdAt).toLocaleString()
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Setup checklist */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Setup Checklist</h2>
          <span className="text-sm text-gray-500">
            {completedCount}/{checklist.length} complete
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
          <div
            className="bg-[#2d6a4f] h-2 rounded-full transition-all"
            style={{ width: `${Math.round((completedCount / checklist.length) * 100)}%` }}
          />
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {checklist.map(({ label, done }) => (
            <li key={label} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}
              >
                {done && <span className="text-white text-xs">✓</span>}
              </div>
              <span className={done ? 'line-through text-gray-400' : 'text-gray-700'}>
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
