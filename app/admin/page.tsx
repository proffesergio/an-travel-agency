import Link from 'next/link';
import Image from 'next/image';
import { Package, MessageSquare, BarChart3, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navbar */}
      <header className="bg-[#1b4332] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/ATHAR-NUR-Logo.png" alt="Logo" width={120} height={40} className="h-9 w-auto brightness-0 invert" />
          <span className="text-green-300 text-sm font-medium border-l border-green-600 pl-3">Admin</span>
        </div>
        <Link href="/en" className="text-green-300 text-sm hover:text-white transition-colors">
          ← View Site
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: 'Packages', desc: 'Manage Hajj, Umrah & Tour packages', icon: Package, href: '/admin/packages', color: 'bg-emerald-50 text-emerald-700' },
            { title: 'Enquiries', desc: 'View and respond to booking enquiries', icon: MessageSquare, href: '/admin/enquiries', color: 'bg-blue-50 text-blue-700' },
            { title: 'Analytics', desc: 'Website traffic & enquiry trends', icon: BarChart3, href: '#', color: 'bg-purple-50 text-purple-700' },
            { title: 'Settings', desc: 'Site settings & admin preferences', icon: Settings, href: '#', color: 'bg-orange-50 text-orange-700' },
          ].map(({ title, desc, icon: Icon, href, color }) => (
            <Link
              key={title}
              href={href}
              className={`p-6 rounded-2xl border ${color} border-transparent hover:shadow-md transition-shadow`}
            >
              <Icon className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm opacity-75 mt-1">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Setup checklist */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Setup Checklist</h2>
          <ul className="space-y-3 text-sm">
            {[
              { label: 'Connect MongoDB Atlas (add MONGODB_URI to .env.local)', done: false },
              { label: 'Configure Gmail SMTP for email notifications', done: false },
              { label: 'Set up Cloudinary for image uploads', done: false },
              { label: 'Register for SSLCommerz payment gateway', done: false },
              { label: 'Add real Hajj hero image to /public/images/hajj-hero.jpg', done: false },
              { label: 'Deploy to Vercel and set environment variables', done: false },
            ].map(({ label, done }) => (
              <li key={label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {done && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={done ? 'line-through text-gray-400' : 'text-gray-700'}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
