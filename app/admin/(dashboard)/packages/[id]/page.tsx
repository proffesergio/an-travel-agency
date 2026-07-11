import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidObjectId } from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Package from '@/models/Package';
import { logActivity } from '@/lib/services/activity';
import { ArrowLeft, Edit, CheckCircle2, Calendar, MapPin, Globe } from 'lucide-react';
import { DeletePackageButton } from '@/components/admin/DeletePackageButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPackageDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const session = await auth();
  await connectDB();
  const pkg = await Package.findById(id).lean();
  if (!pkg) notFound();

  await logActivity({
    action: 'view',
    entityType: 'package',
    entityId: id,
    entityName: pkg.title,
    actor: session?.user?.email ?? 'unknown',
    details: `Viewed package: ${pkg.title}`,
  });

  const categoryColors: Record<string, string> = {
    hajj: 'bg-amber-100 text-amber-800',
    umrah: 'bg-green-100 text-green-800',
    tour: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/packages"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to packages"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pkg.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{pkg.titleBn}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/packages/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <DeletePackageButton
            id={id}
            packageTitle={pkg.title}
            variant="button"
            redirectAfter="/admin/packages"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {pkg.imageUrl && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pkg.imageUrl}
                alt={pkg.title}
                className="w-full h-72 object-cover"
              />
            </div>
          )}

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pkg.description}</p>
            {pkg.descriptionBn && (
              <>
                <h3 className="text-md font-medium text-gray-700 mt-6 mb-2">বাংলায়</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pkg.descriptionBn}</p>
              </>
            )}
          </section>

          {pkg.inclusions?.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Inclusions</h2>
              <ul className="space-y-2">
                {pkg.inclusions.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {pkg.inclusionsBn?.length > 0 && (
                <>
                  <h3 className="text-md font-medium text-gray-700 mt-6 mb-2">বাংলায়</h3>
                  <ul className="space-y-2">
                    {pkg.inclusionsBn.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {pkg.itinerary?.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Itinerary</h2>
              <ol className="space-y-4">
                {pkg.itinerary.map(
                  (item: { day: string; title: string; description: string }, i: number) => (
                    <li key={i} className="border-l-2 border-[#2d6a4f] pl-4">
                      <div className="font-medium text-gray-900">
                        {item.day} — {item.title}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                    </li>
                  )
                )}
              </ol>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Details
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">Category</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      categoryColors[pkg.category] ?? 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {pkg.category}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Price</dt>
                <dd className="mt-1 text-lg font-bold text-gray-900">
                  {pkg.currency} {pkg.price.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Duration
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{pkg.duration}</dd>
                {pkg.durationBn && <dd className="text-xs text-gray-500">{pkg.durationBn}</dd>}
              </div>
              <div>
                <dt className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Slug
                </dt>
                <dd className="mt-1 text-sm font-mono text-gray-700">{pkg.slug}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Status</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      pkg.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {pkg.available ? 'Available' : 'Unavailable'}
                  </span>
                  {pkg.featured && (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Featured
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Public View
            </h2>
            <Link
              href={`/en/${pkg.category}/${pkg.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#2d6a4f] hover:underline"
            >
              <Globe className="w-4 h-4" />
              View on public site
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
