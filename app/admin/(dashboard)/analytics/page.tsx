import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import Package from '@/models/Package';
import Activity from '@/models/Activity';
import { TrendingUp, Package as PackageIcon, MessageSquare, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { DatabaseUnreachableBanner } from '@/components/admin/SetupBanner';

async function loadAnalytics() {
  try {
    await connectDB();
    const [
      totalEnquiries,
      newEnquiries,
      contactedEnquiries,
      closedEnquiries,
      totalPackages,
      activePackages,
      featuredPackages,
    ] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'new' }),
      Enquiry.countDocuments({ status: 'contacted' }),
      Enquiry.countDocuments({ status: 'closed' }),
      Package.countDocuments(),
      Package.countDocuments({ available: true }),
      Package.countDocuments({ featured: true }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = await Activity.find({ createdAt: { $gte: thirtyDaysAgo } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const enquiriesByCategory = await Enquiry.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const packagesByCategory = await Package.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
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
      enquiriesByCategory: [] as { _id: string; count: number }[],
      packagesByCategory: [] as { _id: string; count: number }[],
      dbError: error instanceof Error ? error.message : 'Database error',
    };
  }
}

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
    dbError,
  } = data;

  const stats = [
    {
      title: 'Total Enquiries',
      value: totalEnquiries,
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-700',
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'New Enquiries',
      value: newEnquiries,
      icon: Users,
      color: 'bg-amber-50 text-amber-700',
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'Closed Enquiries',
      value: closedEnquiries,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-700',
      change: '+15%',
      trend: 'up',
    },
    {
      title: 'Total Packages',
      value: totalPackages,
      icon: PackageIcon,
      color: 'bg-purple-50 text-purple-700',
      change: '+3',
      trend: 'up',
    },
  ];

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Track website performance and user activity</p>
      </div>

      {dbError && <DatabaseUnreachableBanner error={dbError} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enquiries by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enquiries by Category</h2>
          <div className="space-y-3">
            {enquiriesByCategory.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet</p>
            ) : (
              enquiriesByCategory.map((item: { _id: string; count: number }) => {
                const percentage = totalEnquiries > 0 ? Math.round((item.count / totalEnquiries) * 100) : 0;
                return (
                  <div key={item._id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item._id === 'air-ticketing' ? 'Air Ticketing' : item._id}
                      </span>
                      <span className="text-sm text-gray-500">{item.count} ({percentage}%)</span>
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
              packagesByCategory.map((item: { _id: string; count: number }) => {
                const percentage = totalPackages > 0 ? Math.round((item.count / totalPackages) * 100) : 0;
                const color = item._id === 'hajj' ? 'bg-amber-500' : item._id === 'umrah' ? 'bg-green-500' : 'bg-blue-500';
                return (
                  <div key={item._id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item._id}</span>
                      <span className="text-sm text-gray-500">{item.count} ({percentage}%)</span>
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
