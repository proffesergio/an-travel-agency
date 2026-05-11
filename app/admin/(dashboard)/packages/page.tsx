import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listPackages } from '@/lib/services/packages';
import { logActivity } from '@/lib/services/activity';
import { Plus, Search, Filter, Edit, Eye, Package as PackageIcon } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/admin/EmptyState';
import { DeletePackageButton } from '@/components/admin/DeletePackageButton';
import { DatabaseUnreachableBanner } from '@/components/admin/SetupBanner';

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const session = await auth();
  const { category, search } = await searchParams;

  let packages: Awaited<ReturnType<typeof listPackages>> = [];
  let dbError: string | undefined;
  try {
    packages = await listPackages({ category, search });
    await logActivity({
      action: 'view',
      entityType: 'package',
      actor: session?.user?.email ?? 'unknown',
      details: `Viewed packages list${category && category !== 'all' ? ` (filter: ${category})` : ''}`,
    });
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Database error';
  }

  const categories = ['all', 'hajj', 'umrah', 'tour'];

  return (
    <div className="p-6">
      {dbError && <DatabaseUnreachableBanner error={dbError} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your Hajj, Umrah, and Tour packages</p>
        </div>
        <Link
          href="/admin/packages/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <form className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Search packages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              name="category"
              defaultValue={category || 'all'}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Packages Grid */}
      {packages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <PackageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first package</p>
          <Link
            href="/admin/packages/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Package
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Package</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {packages.map((pkg) => (
                  <tr key={String(pkg._id)} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {pkg.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={pkg.imageUrl} alt={pkg.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <PackageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{pkg.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{pkg.titleBn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge value={pkg.category} variant="category" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {pkg.currency} {pkg.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pkg.duration}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {pkg.featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Featured
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            pkg.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pkg.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/packages/${pkg._id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/packages/${pkg._id}/edit`}
                          className="p-2 text-gray-400 hover:text-[#2d6a4f] hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DeletePackageButton
                          id={String(pkg._id)}
                          packageTitle={pkg.title}
                          variant="icon"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
