import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';

export interface PhotoGalleryProps {
  placeName: string;
  photos: string[];
  initialIndex: number;
  photoSource?: string;
  photoCredit?: string;
  onClose: () => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  placeName,
  photos,
  initialIndex,
  photoSource,
  photoCredit,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(() => new Set());
  const touchStartX = useRef<number | null>(null);
  const hasMultiplePhotos = photos.length > 1;
  const activePhoto = photos[activeIndex];
  const photoSignature = photos.join('\n');

  const showPrevious = () => {
    setActiveIndex((index) => (index - 1 + photos.length) % photos.length);
  };

  const showNext = () => {
    setActiveIndex((index) => (index + 1) % photos.length);
  };

  useEffect(() => {
    setActiveIndex(Math.min(initialIndex, Math.max(photos.length - 1, 0)));
    setFailedPhotos(new Set());
  }, [initialIndex, photoSignature, photos.length]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && hasMultiplePhotos) showPrevious();
      if (event.key === 'ArrowRight' && hasMultiplePhotos) showNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasMultiplePhotos, onClose, photos.length]);

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!hasMultiplePhotos || touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 48) return;
    if (distance > 0) showPrevious();
    else showNext();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] flex-col bg-[#101713]/96 text-white backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={`${placeName} photo gallery`}
    >
      <header className="flex items-center justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]" style={{ paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        <div className="min-w-0">
          <p className="truncate font-serif-header text-lg font-bold">{placeName}</p>
          <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/60">
            Photo {activeIndex + 1} of {photos.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/12 transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
          aria-label="Close photo gallery"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
      >
        {failedPhotos.has(activePhoto) ? (
          <div className="flex max-w-xs flex-col items-center text-center text-white/70">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/10"><ImageOff className="h-7 w-7" /></span>
            <p className="mt-4 text-sm font-extrabold text-white">Photo unavailable</p>
            <p className="mt-1 text-xs font-medium leading-5">This image could not be loaded. Try another photo or return later.</p>
          </div>
        ) : (
          <img
            key={activePhoto}
            src={activePhoto}
            alt={`${placeName}, photo ${activeIndex + 1} of ${photos.length}`}
            className="max-h-full max-w-full select-none object-contain"
            onError={() => setFailedPhotos((failed) => new Set(failed).add(activePhoto))}
          />
        )}

        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-[max(0.75rem,env(safe-area-inset-left))] grid h-11 w-11 place-items-center rounded-full bg-black/45 shadow-lg backdrop-blur-md transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-[max(0.75rem,env(safe-area-inset-right))] grid h-11 w-11 place-items-center rounded-full bg-black/45 shadow-lg backdrop-blur-md transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      <footer className="px-[max(1rem,env(safe-area-inset-left))] pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center" style={{ paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        {(photoCredit || photoSource) ? (
          <p className="text-xs font-semibold leading-5 text-white/70">
            {photoCredit && <span>Photo: {photoCredit}</span>}
            {photoCredit && photoSource && <span aria-hidden="true"> · </span>}
            {photoSource && <span>Source: {photoSource}</span>}
          </p>
        ) : (
          <p className="text-xs font-semibold text-white/50">Photo attribution unavailable</p>
        )}
        {hasMultiplePhotos && <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">Swipe or use the arrow keys</p>}
      </footer>
    </div>
  );
};
