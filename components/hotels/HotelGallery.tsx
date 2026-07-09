'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, ImageOff, X, ZoomIn, ZoomOut } from 'lucide-react';

export default function HotelGallery({
  images,
  name,
  isBn,
}: {
  images: string[];
  name: string;
  isBn: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const count = images.length;

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
    setZoomed(false);
  }, [count]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % count);
    setZoomed(false);
  }, [count]);

  // Keyboard navigation + body scroll lock while the lightbox is open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, prev, next]);

  if (count === 0) {
    return (
      <div className="h-64 md:h-96 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 mb-6">
        <ImageOff className="w-10 h-10" />
      </div>
    );
  }

  const arrowCls =
    'absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm';

  return (
    <div className="mb-6">
      {/* Main carousel */}
      <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-gray-100 group">
        <Image
          src={images[index]}
          alt={`${name} — ${index + 1}`}
          fill
          className="object-cover cursor-zoom-in"
          sizes="(max-width: 1152px) 100vw, 1152px"
          priority
          onClick={() => setLightbox(true)}
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label={isBn ? 'আগের ছবি' : 'Previous photo'}
              className={`${arrowCls} left-3`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={isBn ? 'পরের ছবি' : 'Next photo'}
              className={`${arrowCls} right-3`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
        >
          <Expand className="w-3.5 h-3.5" />
          {index + 1} / {count}
        </button>
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${isBn ? 'ছবি' : 'Photo'} ${i + 1}`}
              className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                i === index ? 'border-[#2d6a4f]' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="text-sm font-medium truncate pr-4">
              {name} — {index + 1} / {count}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={() => setLightbox(false)}
                aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className={`relative flex-1 ${zoomed ? 'overflow-auto' : 'overflow-hidden flex items-center justify-center'}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setLightbox(false);
            }}
          >
            {zoomed ? (
              <div className="min-w-full min-h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[index]}
                  alt={`${name} — ${index + 1}`}
                  className="max-w-none w-[160vw] md:w-[120vw] cursor-zoom-out"
                  onClick={() => setZoomed(false)}
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[index]}
                alt={`${name} — ${index + 1}`}
                className="max-w-full max-h-full object-contain cursor-zoom-in"
                onClick={() => setZoomed(true)}
              />
            )}

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label={isBn ? 'আগের ছবি' : 'Previous photo'}
                  className={`${arrowCls} left-4 fixed`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label={isBn ? 'পরের ছবি' : 'Next photo'}
                  className={`${arrowCls} right-4 fixed`}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox thumbnails */}
          {count > 1 && (
            <div className="flex gap-2 px-4 py-3 overflow-x-auto justify-center">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setZoomed(false);
                  }}
                  aria-label={`${isBn ? 'ছবি' : 'Photo'} ${i + 1}`}
                  className={`relative w-16 h-11 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    i === index ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
