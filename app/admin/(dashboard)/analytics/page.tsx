import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import Package from '@/models/Package';
import Activity from '@/models/Activity';
import {
  TrendingUp,
  MessageSquare,
  BadgeDollarSign,
  Wallet,
  CreditCard,
  CalendarRange,
} from 'lucide-react';
import { DatabaseUnreachableBanner } from '@/components/admin/SetupBanner';

type CountRow = { _id: string | null; count: number };
type AmountRow = { _id: string | null; count: number; total: number };
type MonthRow = { _id: { y: number; m: number }; count: number };

async function loadAnalytics() {
  try {
    await connectDB();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalEnquiries,
      newEnquiries,
      contactedEnquiries,
      closedEnquiries,
      totalPackages,
      activePackages,
      featuredPackages,
      recentActivity,
      enquiriesByCategory,
      packagesByCategory,
      paymentByStatus,
      paymentByMethod,
      enquiriesByMonth,
    ] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'new' }),
      Enquiry.countDocuments({ status: 'contacted' }),
      Enquiry.countDocuments({ status: 'closed' }),
      Package.countDocuments(),
      Package.countDocuments({ available: true }),
      Package.countDocuments({ featured: true }),
      Activity.find({ createdAt: { $gte: thirtyDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
      Enquiry.aggregate<CountRow>([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Package.aggregate<CountRow>([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Enquiry.aggregate<AmountRow>([
        { $match: { paymentStatus: { $ne: null } } },
        { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$paymentAmount' } } },
      ]),
      Enquiry.aggregate<AmountRow>([
        { $match: { paymentMethod: { $ne: null } } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$paymentAmount' } } },
        { $sort: { count: -1 } },
      ]),
      Enquiry.aggregate<MonthRow>([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      totalEnquiries,
      newEnquiries,
      contactedEnquiries,
      closedEnquiries,
      totalPackages,
      activePackages,
      featuredPackages,
      recentActivity,
      enquiriesByCategory,
      packagesByCategory,
      paymentByStatus,
      paymentByMethod,
      enquiriesByMonth,
    };
  } catch (error) {
    return {
      totalEnquiries: 0,
      newEnquiries: 0,
      contactedEnquiries: 0,
      closedEnquiries: 0,
      totalPackages: 0,
      activePackages: 0,
      featuredPackages: 0,
      recentActivity: [] as Awaited<ReturnType<typeof Activity.find>>,
      enquiriesByCategory: [] as CountRow[],
      packagesByCategory: [] as CountRow[],
      paymentByStatus: [] as AmountRow[],
      paymentByMethod: [] as AmountRow[],
      enquiriesByMonth: [] as MonthRow[],
      dbError: error instanceof Error ? error.message : 'Database error',
    };
  }
}

const bdt = (n: number) => '৳' + n.toLocaleString('en-IN');

const METHOD_LABELS: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash on Office',
  piprapay: 'PipraPay',
  sslcommerz: 'SSLCommerz',
};

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-500',
  pending: 'bg-amber-500',
  failed: 'bg-red-500',
};

export default async function AdminAnalyticsPage() {
  const data = (await loadAnalytics()) as Awaited<ReturnType<typeof loadAnalytics>> & {
    dbError?: string;
  };
  const {
    totalEnquiries,
    newEnquiries,
    closedEnquiries,
    totalPackages,
    activePackages,
    featuredPackages,
    recentActivity,
    enquiriesByCategory,
    packagesByCategory,
    paymentByStatus,
    paymentByMethod,
    enquiriesByMonth,
    dbError,
  } = data;

  const findAmount = (rows: AmountRow[], id: string) => rows.find((r) => r._id === id);
  const revenueCollected = findAmount(paymentByStatus, 'paid')?.total ?? 0;
  const revenuePending = findAmount(paymentByStatus, 'pending')?.total ?? 0;
  const paidCount = findAmount(paymentByStatus, 'paid')?.count ?? 0;
  const totalPaymentRecords = paymentByStatus.reduce((s, r) => s + r.count, 0);
  const conversionRate =
    totalEnquiries > 0 ? Math.round((paidCount / totalEnquiries) * 100) : 0;

  const stats = [
    {
      title: 'Revenue Collected',
      value: bdt(revenueCollected),
      icon: BadgeDollarSign,
      color: 'bg-green-50 text-green-700',
    },
    {
      title: 'Pending Revenue',
      value: bdt(revenuePending),
      icon: Wallet,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Total Enquiries',
      value: totalEnquiries.toString(),
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Booking Conversion',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  // Build a continuous 6-month series so empty months still render.
  const months: { label: string; count: number }[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() - 5);
  for (let i = 0; i < 6; i++) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    const row = enquiriesByMonth.find((r) => r._id.y === y && r._id.m === m);
    months.push({
      label: cursor.toLocaleString('en-US', { month: 'short' }),
      count: row?.count ?? 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const monthMax = Math.max(1, ...months.map((m) => m.count));

  const methodMaxCount = Math.max(1, ...paymentByMethod.map((m) => m.count));

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return '🟢';
      case 'update':
        return '🔵';
      case 'delete':
        return '🔴';
      case 'view':
        return '👁️';
      default:
        return '📋';
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revenue, bookings and engagement at a glance
        </p>
      </div>

      {dbError && <DatabaseUnreachableBanner error={dbError} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className={`p-3 rounded-lg w-fit mb-4 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Enquiries trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-[#2d6a4f]" /> Enquiries — Last 6 Months
          </h2>
        </div>
        <div className="flex items-end justify-between gap-3 h-48">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-xs font-semibold text-gray-700 mb-1">{m.count}</span>
              <div
                className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-[#1b4332] to-[#52b788] transition-all"
                style={{ height: `${Math.max(4, Math.round((m.count / monthMax) * 100))}%` }}
              />
              <span className="text-xs text-gray-500 mt-2">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#2d6a4f]" /> Payments by Status
          </h2>
          {totalPaymentRecords === 0 ? (
            <p className="text-gray-500 text-sm">No payment records yet</p>
          ) : (
            <div className="space-y-3">
              {(['paid', 'pending', 'failed'] as const).map((s) => {
                const row = findAmount(paymentByStatus, s);
                const count = row?.count ?? 0;
                const percentage =
                  totalPaymentRecords > 0 ? Math.round((count / totalPaymentRecords) * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{s}</span>
                      <span className="text-sm text-gray-500">
                        {count} · {bdt(row?.total ?? 0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${STATUS_COLORS[s]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment method breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#2d6a4f]" /> Preferred Payment Methods
          </h2>
          {paymentByMethod.length === 0 ? (
            <p className="text-gray-500 text-sm">No payment methods used yet</p>
          ) : (
            <div className="space-y-3">
              {paymentByMethod.map((m) => (
                <div key={m._id ?? 'unknown'}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {METHOD_LABELS[m._id ?? ''] ?? m._id}
                    </span>
                    <span className="text-sm text-gray-500">{m.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#2d6a4f] h-2 rounded-full transition-all"
                      style={{ width: `${Math.round((m.count / methodMaxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enquiries by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enquiries by Category</h2>
          <div className="space-y-3">
            {enquiriesByCategory.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet</p>
            ) : (
              enquiriesByCategory.map((item) => {
                const percentage =
                  totalEnquiries > 0 ? Math.round((item.count / totalEnquiries) * 100) : 0;
                return (
                  <div key={item._id ?? 'unknown'}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item._id === 'air-ticketing' ? 'Air Ticketing' : item._id}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-[#2d6a4f] h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Packages by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Packages by Category</h2>
          <div className="space-y-3">
            {packagesByCategory.length === 0 ? (
              <p className="text-gray-500 text-sm">No packages yet</p>
            ) : (
              packagesByCategory.map((item) => {
                const percentage =
                  totalPackages > 0 ? Math.round((item.count / totalPackages) * 100) : 0;
                const color =
                  item._id === 'hajj'
                    ? 'bg-amber-500'
                    : item._id === 'umrah'
                    ? 'bg-green-500'
                    : 'bg-blue-500';
                return (
                  <div key={item._id ?? 'unknown'}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item._id}</span>
                      <span className="text-sm text-gray-500">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Active Packages</span>
              <span className="font-medium text-gray-900">{activePackages}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">Featured Packages</span>
              <span className="font-medium text-gray-900">{featuredPackages}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">Closed Enquiries</span>
              <span className="font-medium text-gray-900">{closedEnquiries}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">New Enquiries</span>
              <span className="font-medium text-gray-900">{newEnquiries}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={String(activity._id)}
                className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
              >
                <span className="text-lg">{getActionIcon(activity.action)}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium capitalize">{activity.action}</span>{' '}
                    {activity.entityType}
                    {activity.entityName ? `: ${activity.entityName}` : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    by {activity.adminEmail} •{' '}
                    {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
