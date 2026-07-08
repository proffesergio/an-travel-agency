import HotelForm, { EMPTY_HOTEL } from '@/components/admin/HotelForm';

export default function NewHotelPage() {
  return <HotelForm initial={EMPTY_HOTEL} />;
}
