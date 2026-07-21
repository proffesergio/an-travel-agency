import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { isAdminSession } from '@/lib/auth-guards';
import {
  Package,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  LayoutDashboard,
  Hotel,
} from 'lucide-react';
import { Toaster } from '@/components/admin/Toaster';
import AdminShell from '@/components/admin/AdminShell';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/packages', label: 'Packages', icon: Package },
  { href: '/admin/hotels', label: 'Hotels', icon: Hotel },
  { href: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!isAdminSession(session)) redirect('/admin/login');

  const sidebar = (
    <>
      <div className="p-4 border-b border-green-800">
          <Link href="/en" className="flex items-center gap-3">
            <Image
              src="/ATHAR-NUR-Logo.png"
              alt="Athar Nur Travels"
              width={120}
              height={40}
              className="h-9 w-auto brightness-0 invert"
            />
          </Link>
          <span className="text-green-300 text-xs font-medium border-l border-green-600 pl-3 mt-2 block">
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-100 hover:bg-green-800 hover:text-white transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-green-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
              {session.user?.email?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user?.name ?? 'Admin'}</p>
              <p className="text-xs text-green-300 truncate">{session.user?.email}</p>
            </div>
          </div>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin/login' });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-green-100 hover:bg-green-800 hover:text-white transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
    </>
  );

  return (
    <>
      <AdminShell sidebar={sidebar}>{children}</AdminShell>
      <Toaster />
    </>
  );
}
