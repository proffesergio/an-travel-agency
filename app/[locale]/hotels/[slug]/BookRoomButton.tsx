'use client';

export default function BookRoomButton({ roomName, label }: { roomName: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('hotel-book-room', { detail: roomName }))}
      className="px-5 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium text-sm whitespace-nowrap"
    >
      {label}
    </button>
  );
}
