import Link from 'next/link';
import Image from 'next/image';
import { Plus, Star, Hotel as HotelIcon } from 'lucide-react';
import { listHotels } from '@/lib/services/hotels';
import DeleteHotelButton from '@/components/admin/DeleteHotelButton';
import { formatMoney } from '@/lib/hotels-shared';

export const dynamic = 'force-dynamic';

export default async function AdminHotelsPage() {
  const hotels = await listHotels();

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage curated hotels — changes appear on the site immediately
          </p>
        </div>
        <Link
          href="/admin/hotels/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium self-start"
        >
          <Plus className="w-4 h-4" />
          Add Hotel
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <HotelIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hotels yet. Add your first hotel to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Hotel</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Stars</th>
                <th className="px-4 py-3 font-medium">Rooms</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hotels.map((hotel) => {
                const availableRooms = (hotel.rooms ?? []).filter((r) => r.available);
                const fromPrice = availableRooms.length
                  ? Math.min(...availableRooms.map((r) => r.pricePerNight))
                  : 0;
                return (
                  <tr key={String(hotel._id)} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded bg-gray-100 overflow-hidden relative flex-shrink-0">
                          {hotel.images?.[0] && (
                            <Image
                              src={hotel.images[0]}
                              alt={hotel.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          )}
                        </div>
                        <Link
                          href={`/admin/hotels/${hotel._id}`}
                          className="font-medium text-gray-900 hover:text-[#2d6a4f]"
                        >
                          {hotel.name}
                        </Link>
                        {hotel.featured && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {hotel.city}, {hotel.country}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        {hotel.starRating}
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{hotel.rooms?.length ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {fromPrice > 0 ? formatMoney(fromPrice, hotel.currency) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          hotel.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hotel.available ? 'Available' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/admin/hotels/${hotel._id}/edit`}
                          className="px-3 py-1.5 text-sm text-[#2d6a4f] hover:bg-green-50 rounded-lg font-medium"
                        >
                          Edit
                        </Link>
                        <DeleteHotelButton id={String(hotel._id)} name={hotel.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
