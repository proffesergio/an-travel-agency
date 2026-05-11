import Link from 'next/link';
import Image from 'next/image';
import { Clock, Tag, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col">
      {/* Image */}
      <div className="relative h-52 bg-gray-200 overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_BADGE[category]}`}>
            {category.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-lg mb-3 leading-snug">{title}</h3>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-[#2d6a4f]" />
            {duration}
          </span>
          <span className="flex items-center gap-1 font-bold text-[#2d6a4f] text-base">
            <Tag className="w-4 h-4" />
            ৳{price.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Top inclusions */}
        <ul className="space-y-1 mb-5 flex-1">
          {inclusions.slice(0, 3).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className="block w-full text-center py-2.5 rounded-full bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
        >
          View Details & Book
        </Link>
      </div>
    </div>
  );
}
