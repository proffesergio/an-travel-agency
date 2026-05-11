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
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

type Stats = {
  totalEnquiries: number;
  newEnquiries: number;
  contactedEnquiries: number;
  closedEnquiries: number;
  totalPackages: number;
};

const EMPTY_STATS: Stats = {
  totalEnquiries: 0,
  newEnquiries: 0,
  contactedEnquiries: 0,
  closedEnquiries: 0,
  totalPackages: 0,
};

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
      recentActivity,
    ] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'new' }),
      Enquiry.countDocuments({ status: 'contacted' }),
      Enquiry.countDocuments({ status: 'closed' }),
      Package.countDocuments(),
      listRecentActivity(10),
    ]);
    return {
      stats: {
        totalEnquiries,
        newEnquiries,
        contactedEnquiries,
        closedEnquiries,
        totalPackages,
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

export default async function AdminDashboardPage() {
  const session = await auth();
  const { stats, recentActivity, dbError } = await loadDashboardData();

  const cards = [
    {
      title: 'Total Packages',
      value: stats.totalPackages,
      icon: PackageIcon,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'New Enquiries',
      value: stats.newEnquiries,
      icon: Users,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Contacted',
      value: stats.contactedEnquiries,
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Closed',
      value: stats.closedEnquiries,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-700',
    },
  ];

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
      label: 'Configure SMTP for email notifications (optional)',
      done: !!process.env.GMAIL_USER || !!process.env.SMTP_HOST,
    },
    {
      label: 'Register for SSLCommerz payment gateway (optional)',
      done: !!process.env.SSLCOMMERZ_STORE_ID,
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {session?.user?.name ?? 'Admin'}
        </p>
      </div>

      {dbError && <DatabaseUnreachableBanner error={dbError} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className={`p-3 rounded-lg w-fit mb-4 ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.title}</p>
          </div>
        ))}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:col-span-2 lg:col-span-4">
          <p className="text-sm text-gray-500">
            Total enquiries in the system:{' '}
            <span className="font-medium text-gray-900">{stats.totalEnquiries}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/admin/analytics" className="text-sm text-[#2d6a4f] hover:underline">
              View All
            </Link>
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

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Setup Checklist</h2>
            <span className="text-sm text-gray-500">
              {completedCount}/{checklist.length}
            </span>
          </div>
          <ul className="space-y-3 text-sm">
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
    </div>
  );
}
