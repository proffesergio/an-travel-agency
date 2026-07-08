import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Star, Pencil } from 'lucide-react';
import { getHotelById } from '@/lib/services/hotels';
import { AMENITY_LABELS, formatMoney, type AmenityKey } from '@/lib/hotels-shared';

export const dynamic = 'force-dynamic';

export default async function AdminHotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hotel = await getHotelById(id);
  if (!hotel) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/hotels" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {hotel.name}
              <span className="inline-flex items-center gap-0.5 text-amber-500 text-base">
                {hotel.starRating}
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {hotel.city}, {hotel.country}
              {hotel.distanceFromHaramMeters
                ? ` · ${hotel.distanceFromHaramMeters}m from Haram`
                : ''}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/hotels/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium"
        >
          <Pencil className="w-4 h-4" />
          Edit Hotel
        </Link>
      </div>

      {(hotel.images?.length ?? 0) > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {hotel.images.map((url: string) => (
            <div key={url} className="relative w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={url} alt={hotel.name} fill className="object-cover" sizes="192px" />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
        <p className="text-gray-600 whitespace-pre-line">{hotel.description}</p>
        <h3 className="text-md font-medium text-gray-700 mt-4 mb-2">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {(hotel.amenities ?? []).map((a: string) => (
            <span key={a} className="text-xs bg-green-50 text-[#2d6a4f] px-2.5 py-1 rounded-full">
              {AMENITY_LABELS[a as AmenityKey]?.en ?? a}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Room Types ({hotel.rooms?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {(hotel.rooms ?? []).map((room, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="relative w-20 h-14 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                {room.images?.[0] && (
                  <Image
                    src={room.images[0]}
                    alt={room.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{room.name}</p>
                <p className="text-sm text-gray-500">
                  {room.bedInfo ? `${room.bedInfo} · ` : ''}
                  {room.capacity?.adults} adults
                  {room.capacity?.children ? ` + ${room.capacity.children} children` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatMoney(room.pricePerNight, hotel.currency)}
                  <span className="text-xs text-gray-500 font-normal">/night</span>
                </p>
                <span className={`text-xs ${room.available ? 'text-green-700' : 'text-gray-400'}`}>
                  {room.available ? 'Available' : 'Hidden'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
