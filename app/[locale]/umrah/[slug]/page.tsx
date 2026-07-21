import { notFound } from 'next/navigation';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import BookingEnquiryForm from '@/components/packages/BookingEnquiryForm';
import BookNowTrigger from '@/components/packages/BookNowTrigger';
import { getDisplayPackageBySlug } from '@/lib/data/packages';
import { CheckCircle2, Clock, Tag, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UmrahDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const pkg = await getDisplayPackageBySlug(slug);
  if (!pkg || pkg.category !== 'umrah') notFound();

  const isBn = locale === 'bn';
  const title = isBn ? pkg.titleBn || pkg.title : pkg.title;

  return (
    <main className="flex-1">
      <div className="relative h-72 sm:h-96 bg-gray-800">
          <Image src={pkg.imageUrl} alt={title} fill className="object-cover opacity-60" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-4 w-full pb-8">
              <span className="inline-block bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase">Umrah</span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">{title}</h1>
              <div className="flex items-center gap-6 mt-3 text-white/80 text-sm">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{isBn ? pkg.durationBn : pkg.duration}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />Group & Private</span>
                <span className="flex items-center gap-1 font-bold text-[#74c69d] text-base"><Tag className="w-4 h-4" />৳{pkg.price.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {(isBn ? pkg.descriptionBn || pkg.description : pkg.description) && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Package Overview</h2>
                <p className="text-gray-600 leading-relaxed">
                  {isBn ? pkg.descriptionBn || pkg.description : pkg.description}
                </p>
              </div>
            )}
            {pkg.inclusions.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Included</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pkg.inclusions.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pkg.itinerary.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Itinerary</h2>
              <div className="space-y-4">
                {pkg.itinerary.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-20 text-right">
                      <span className="text-xs font-bold text-[#2d6a4f] bg-green-50 px-2 py-1 rounded-full">{item.day}</span>
                    </div>
                    <div className="flex-1 pb-4 border-b border-gray-100">
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
              <div className="mb-5">
                <div className="text-sm text-gray-500">Starting from</div>
                <div className="text-3xl font-extrabold text-[#2d6a4f]">৳{pkg.price.toLocaleString('en-IN')}</div>
                <div className="text-sm text-gray-500">per person</div>
              </div>
              <BookNowTrigger
                packageTitle={title}
                packageId={pkg.id}
                category={pkg.category}
                packagePrice={pkg.price}
                packageDuration={isBn ? pkg.durationBn : pkg.duration}
                locale={locale}
              />
              <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
                <span className="h-px flex-1 bg-gray-200" />
                <span>or send an enquiry</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <BookingEnquiryForm packageTitle={title} packageId={pkg.id} category={pkg.category} />
            </div>
          </div>
      </div>
    </main>
  );
}
