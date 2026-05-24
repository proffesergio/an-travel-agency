import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, Tag, CheckCircle2 } from 'lucide-react';

interface PackageCardProps {
  slug: string;
  category: 'hajj' | 'umrah' | 'tour';
  title: string;
  price: number;
  duration: string;
  imageUrl: string;
  inclusions: string[];
  locale: string;
}

const CATEGORY_HREF: Record<string, string> = {
  hajj: 'hajj',
  umrah: 'umrah',
  tour: 'tours',
};

const CATEGORY_BADGE: Record<string, string> = {
  hajj: 'bg-emerald-100 text-emerald-700',
  umrah: 'bg-teal-100 text-teal-700',
  tour: 'bg-blue-100 text-blue-700',
};

const FALLBACK_IMAGE: Record<string, string> = {
  hajj: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?auto=format&fit=crop&w=1200&q=80',
  umrah: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
  tour: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
};

export default function PackageCard({
  slug,
  category,
  title,
  price,
  duration,
  imageUrl,
  inclusions,
  locale,
}: PackageCardProps) {
  const href = `/${locale}/${CATEGORY_HREF[category]}/${slug}`;
  const src = imageUrl || FALLBACK_IMAGE[category];

  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out border border-gray-100 hover:shadow-2xl hover:border-[#74c69d]/60 hover:-translate-y-1.5 hover:ring-1 hover:ring-[#74c69d]/30 active:scale-[0.99] flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative h-52 bg-gray-200 overflow-hidden">
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_BADGE[category]} shadow-sm`}>
            {category.toUpperCase()}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#2d6a4f]/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Tag className="w-3 h-3" />
            ৳{price.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-lg mb-3 leading-snug line-clamp-2 group-hover:text-[#2d6a4f] transition-colors">
          {title}
        </h3>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-[#2d6a4f]" />
            {duration}
          </span>
          <span className="text-xs uppercase tracking-wider text-gray-400">per person</span>
        </div>

        {/* Top inclusions */}
        <ul className="space-y-1 mb-5 flex-1">
          {inclusions.slice(0, 3).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm font-semibold text-[#2d6a4f]">View Details & Book</span>
          <span className="w-9 h-9 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center group-hover:bg-[#1b4332] group-hover:translate-x-1 transition-all">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
