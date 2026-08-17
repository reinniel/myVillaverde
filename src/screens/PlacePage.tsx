import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, Bookmark, Camera, Check, ChevronRight, Clock3, Database,
  ExternalLink, Globe2, ImageOff, Images, MapPin, Navigation, Phone, RefreshCw,
  Route, Share2, ShieldCheck,
} from 'lucide-react';
import type { Barangay, PlaceRecord, PlacesDataState, UserLocation } from '../types/app';
import { CATEGORY_MARKER_COLORS } from '../data/categories';
import { PhotoGallery } from '../components/PhotoGallery';
import {
  formatCheckedDate, formatDistance, formatWebsiteLabel, getApprovedPhotoUrls,
  getDirectionsUrl, getDistanceMeters, getOpeningHoursSummary, getSafeHttpUrl,
} from '../utils/places';
import {
  buildMapUrl, buildPlacePageUrl, readMapNavigationFromUrl,
} from '../utils/placeNavigation';
import {
  buildGalleryHistoryState, buildMapReturnHistoryState, readCategoryModalStateFromHistory,
  readGalleryIndexFromHistory,
} from '../utils/navigationHistory';

export interface PlacePageProps {
  place: PlaceRecord | null;
  requestedPlaceId: string;
  dataState: PlacesDataState;
  loadMessage: string;
  isSaved: boolean;
  isInTrip: boolean;
  isTripFull: boolean;
  userLocation: UserLocation | null;
  places: PlaceRecord[];
  onBack: () => void;
  onOpenPlace: (place: PlaceRecord) => void;
  onToggleSaved: (place: PlaceRecord) => void;
  onToggleTrip: (place: PlaceRecord) => void;
}

interface PlaceSuggestion {
  place: PlaceRecord;
  distanceMeters: number;
}

interface RecommendationSectionProps {
  title: string;
  subtitle: string;
  suggestions: PlaceSuggestion[];
  emptyMessage: string;
  onOpenPlace: (place: PlaceRecord) => void;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  subtitle,
  suggestions,
  emptyMessage,
  onOpenPlace,
}) => (
  <section className="mt-5">
    <div className="px-1">
      <h2 className="font-serif-header text-xl font-bold text-[#18241F]">{title}</h2>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#748078]">{subtitle}</p>
    </div>
    {suggestions.length > 0 ? (
      <div className="mt-3 space-y-2.5">
        {suggestions.map(({ place, distanceMeters }) => (
          <button
            key={place.id}
            type="button"
            onClick={() => onOpenPlace(place)}
            className="flex w-full items-center gap-3 rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] p-3 text-left shadow-xs transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
            aria-label={`Open ${place.name} place page`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }}>
              <MapPin className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold text-[#26372F]">{place.name}</span>
              <span className="mt-0.5 block truncate text-xs font-medium text-[#748078]">{place.subcategory} · {place.barangay}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#748078]">{formatDistance(distanceMeters)}</span>
              <ChevronRight className="ml-auto mt-1 h-4 w-4 text-[#9AA49C]" />
            </span>
          </button>
        ))}
      </div>
    ) : (
      <div className="mt-3 rounded-[22px] border border-dashed border-[#CBD4CC] bg-[#F6F8F2] px-5 py-4 text-sm font-semibold leading-6 text-[#748078]">{emptyMessage}</div>
    )}
  </section>
);

export const PlacePage: React.FC<PlacePageProps> = ({
  place,
  requestedPlaceId,
  dataState,
  loadMessage,
  isSaved,
  isInTrip,
  isTripFull,
  userLocation,
  places,
  onBack,
  onOpenPlace,
  onToggleSaved,
  onToggleTrip,
}) => {
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [coverPhotoFailed, setCoverPhotoFailed] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState<number | null>(null);
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const approvedPhotoUrls = place ? getApprovedPhotoUrls(place) : [];
  const photoSignature = approvedPhotoUrls.join('\n');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setShareState('idle');
  }, [requestedPlaceId]);

  useEffect(() => {
    if (!place && dataState === 'loading') return;
    pageHeadingRef.current?.focus({ preventScroll: true });
  }, [dataState, place, requestedPlaceId]);

  useEffect(() => {
    if (shareState !== 'copied') return;
    const timeout = window.setTimeout(() => setShareState('idle'), 1800);
    return () => window.clearTimeout(timeout);
  }, [shareState]);

  useEffect(() => {
    setCoverPhotoIndex(0);
    setCoverPhotoFailed(false);
    setGalleryStartIndex(readGalleryIndexFromHistory(window.history.state, approvedPhotoUrls.length));
  }, [requestedPlaceId, photoSignature]);

  useEffect(() => {
    const syncGalleryFromHistory = () => {
      setGalleryStartIndex(readGalleryIndexFromHistory(window.history.state, approvedPhotoUrls.length));
    };
    window.addEventListener('popstate', syncGalleryFromHistory);
    return () => window.removeEventListener('popstate', syncGalleryFromHistory);
  }, [approvedPhotoUrls.length]);

  const openGallery = (photoIndex: number) => {
    window.history.pushState(
      buildGalleryHistoryState(window.history.state, photoIndex),
      '',
      window.location.href,
    );
    setGalleryStartIndex(photoIndex);
  };

  const closeGallery = () => {
    const historyGalleryIndex = readGalleryIndexFromHistory(window.history.state, approvedPhotoUrls.length);
    setGalleryStartIndex(null);
    if (historyGalleryIndex !== null) window.history.back();
  };

  const copyPlaceLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setShareState('copied');
  };

  const sharePlace = async () => {
    if (!place) return;
    const url = buildPlacePageUrl(place.id);
    if (navigator.share) {
      try {
        await navigator.share({ title: place.name, text: `${place.name} in ${place.barangay}, Villaverde`, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    await copyPlaceLink(url);
  };

const showPlaceOnMap = () => {
  if (!place) return;
  const mapScopeFromUrl = readMapNavigationFromUrl()?.scope;
  const categoryScope = readCategoryModalStateFromHistory(window.history.state)?.scope;
  const storedMapScope = window.history.state && typeof window.history.state === 'object'
    ? (window.history.state as Record<string, unknown>).mapScope
    : null;
  const scope = mapScopeFromUrl
    ?? categoryScope
    ?? (storedMapScope === 'local' || storedMapScope === 'visitor' ? storedMapScope : null)
    ?? 'visitor';
  const mapState = {
    panelView: 'categories' as const,
    categoryId: 'all' as const,
    selectedPlaceId: place.id,
  };
  const nextHistoryState = buildMapReturnHistoryState({
    ...window.history.state,
    myVillaverdeMapEntry: true,
    mapScope: scope,
    barangayId: null,
  }, mapState);

  window.history.pushState(nextHistoryState, '', buildMapUrl(scope));
  window.dispatchEvent(new PopStateEvent('popstate', { state: nextHistoryState }));
};


  if (!place) {
    const isLoading = dataState === 'loading';
    return (
      <main className="min-h-[100dvh] bg-[#EEF1E8] pb-[max(2rem,env(safe-area-inset-bottom))]" aria-busy={isLoading}>
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#D9E0D8]/80 bg-[#EEF1E8]/95 px-[max(1rem,env(safe-area-inset-left))] pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <button type="button" onClick={onBack} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FFFDF7] text-[#26372F] shadow-sm transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
          <div className="min-w-0"><p className="font-serif-header text-lg font-bold text-[#18241F]">Place page</p><p className="truncate text-xs font-semibold text-[#748078]">myVillaverde</p></div>
        </header>
        <div className="mx-auto max-w-md px-5 pt-16 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FFFDF7] text-[#526158] shadow-sm">{isLoading ? <RefreshCw className="h-7 w-7 animate-spin" /> : <AlertTriangle className="h-7 w-7" />}</span>
          <h1 ref={pageHeadingRef} tabIndex={-1} className="mt-5 font-serif-header text-2xl font-bold text-[#18241F] focus:outline-none">{isLoading ? 'Loading place' : 'Place unavailable'}</h1>
          <p className="mx-auto mt-2 max-w-[310px] text-sm font-medium leading-6 text-[#748078]">{isLoading ? loadMessage : `The place ID “${requestedPlaceId}” is not available in the current database.`}</p>
          <button type="button" onClick={onBack} className="mt-6 rounded-full bg-[#26372F] px-6 py-3 text-sm font-extrabold text-white transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25">Back to myVillaverde</button>
        </div>
      </main>
    );
  }

  const accent = CATEGORY_MARKER_COLORS[place.categoryId];
  const distance = userLocation ? getDistanceMeters(userLocation, place) : null;
  const isVerified = place.status.toLowerCase() === 'verified';
  const primaryExternalUrl = getSafeHttpUrl(place.website);
  const coverPhotoUrl = coverPhotoFailed ? '' : (approvedPhotoUrls[coverPhotoIndex] || '');
  const photoFallbackLabel = approvedPhotoUrls.length > 0 ? 'Photo unavailable' : 'No approved photo';
  const openingHours = getOpeningHoursSummary(place.openingHours);
  const openingHoursTone = {
    open: 'bg-[#DDEBDF] text-[#2B6A4E]',
    closed: 'bg-[#F6E2DC] text-[#974A3B]',
    check: 'bg-[#FFF0D8] text-[#8A5726]',
    unknown: 'bg-[#E8ECE7] text-[#627066]',
  }[openingHours.state];
  const rankByDistance = (candidates: PlaceRecord[]) => candidates
    .map((candidate) => ({
      place: candidate,
      distanceMeters: getDistanceMeters(place, candidate),
    }))
    .sort((first, second) => first.distanceMeters - second.distanceMeters);
  const otherPlaces = places.filter((candidate) => candidate.id !== place.id);
  const relatedPlaces = rankByDistance(
    otherPlaces.filter((candidate) => candidate.categoryId === place.categoryId),
  ).slice(0, 3);
  const relatedPlaceIds = new Set(relatedPlaces.map(({ place: relatedPlace }) => relatedPlace.id));
  const nearbyPlaces = rankByDistance(
    otherPlaces.filter((candidate) => !relatedPlaceIds.has(candidate.id)),
  ).slice(0, 3);

  return (
    <>
    <main className="min-h-[100dvh] bg-[#EEF1E8] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/70 bg-[#EEF1E8]/90 px-[max(1rem,env(safe-area-inset-left))] pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <button type="button" onClick={onBack} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FFFDF7] text-[#26372F] shadow-sm transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 text-center"><p className="font-serif-header text-[18px] font-bold leading-tight text-[#18241F]">my<span className="text-[#2B6A4E]">Villaverde</span></p><p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#748078]">Place page</p></div>
        <button type="button" onClick={() => void sharePlace()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FFFDF7] text-[#26372F] shadow-sm transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={shareState === 'copied' ? 'Place link copied' : `Share ${place.name}`}><Share2 className="h-5 w-5" /></button>
      </header>

      <div className="mx-auto max-w-md px-[max(1rem,env(safe-area-inset-left))] pt-4" style={{ paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        <section className="relative overflow-hidden rounded-[32px] p-5 text-white shadow-[0_18px_44px_rgba(31,47,39,.18)]" style={{ backgroundImage: `linear-gradient(145deg, ${accent} 0%, #26372F 115%)` }}>
          {coverPhotoUrl ? (
            <button
              type="button"
              onClick={() => openGallery(coverPhotoIndex)}
              className="absolute inset-0 h-full w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/70"
              aria-label={`Open ${place.name} photo gallery`}
            >
              <img
                key={coverPhotoUrl}
                src={coverPhotoUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => {
                  if (coverPhotoIndex + 1 < approvedPhotoUrls.length) {
                    setCoverPhotoIndex((index) => index + 1);
                  } else {
                    setCoverPhotoFailed(true);
                  }
                }}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#17231D]/95 via-[#17231D]/32 to-[#17231D]/20" />
            </button>
          ) : (
            <>
              <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full border border-white/15 bg-white/10" />
              <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full border border-white/10 bg-black/10" />
            </>
          )}
          <div className="pointer-events-none relative z-10 flex min-h-[190px] flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-black/15 backdrop-blur-sm">{coverPhotoUrl ? <Camera className="h-6 w-6" /> : <ImageOff className="h-6 w-6" />}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] backdrop-blur-sm">
                {coverPhotoUrl ? <><Images className="h-3.5 w-3.5" />{approvedPhotoUrls.length} {approvedPhotoUrls.length === 1 ? 'photo' : 'photos'}</> : photoFallbackLabel}
              </span>
            </div>
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-extrabold">{place.category}</span>
                <span className="rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-extrabold">{place.barangay}</span>
              </div>
              <h1 ref={pageHeadingRef} tabIndex={-1} className="font-serif-header text-[30px] font-bold leading-[1.02] focus:outline-none [overflow-wrap:anywhere]">{place.name}</h1>
              <p className="mt-2 text-sm font-semibold text-white/78">{place.subcategory || 'Place in Villaverde'}</p>
            </div>
          </div>
        </section>
        {coverPhotoUrl && (place.photoCredit || place.photoSource) && (
          <p className="mt-2 px-2 text-[10px] font-semibold leading-4 text-[#748078]">
            {place.photoCredit && <span>Photo: {place.photoCredit}</span>}
            {place.photoCredit && place.photoSource && <span aria-hidden="true"> · </span>}
            {place.photoSource && <span>Source: {place.photoSource}</span>}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Listing status">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${isVerified ? 'bg-[#DDEBDF] text-[#2B6A4E]' : 'bg-[#FFF0D8] text-[#8A5726]'}`}>{isVerified ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{isVerified ? 'Verified location' : 'Needs local confirmation'}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${openingHoursTone}`}><Clock3 className="h-3.5 w-3.5" />{openingHours.label}</span>
          <span className="rounded-full bg-[#FFFDF7] px-3 py-1.5 text-[11px] font-extrabold text-[#627066] shadow-xs">{dataState === 'live' ? 'Live database' : dataState === 'cached' ? 'Last live data' : dataState === 'offline' ? 'Offline data' : dataState === 'snapshot' ? 'Snapshot data' : 'Loading database'}</span>
          {distance !== null && <span className="rounded-full bg-[#FFFDF7] px-3 py-1.5 text-[11px] font-extrabold text-[#627066] shadow-xs">{formatDistance(distance)} away</span>}
        </div>
        <p className="sr-only" role="status" aria-live="polite">{shareState === 'copied' ? 'Place link copied' : ''}</p>

        <section className="mt-5 grid grid-cols-2 gap-2.5" aria-label="Primary place actions">
          <a href={getDirectionsUrl(place)} target="_blank" rel="noreferrer" className="flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-[22px] bg-[#26372F] px-2 text-white shadow-sm transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25"><Navigation className="h-5 w-5" /><span className="text-[11px] font-extrabold">Directions</span></a>
          <button type="button" onClick={() => onToggleSaved(place)} className={`flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-[22px] border px-2 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20 ${isSaved ? 'border-[#2B6A4E] bg-[#DDEBDF] text-[#2B6A4E]' : 'border-[#D1DAD2] bg-[#FFFDF7] text-[#35463E]'}`} aria-pressed={isSaved}><Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} /><span className="text-[11px] font-extrabold">{isSaved ? 'Saved' : 'Save'}</span></button>
          <button type="button" onClick={() => onToggleTrip(place)} disabled={isTripFull && !isInTrip} className={`flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-[22px] border px-2 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#B5753D]/20 disabled:cursor-not-allowed disabled:opacity-45 ${isInTrip ? 'border-[#B5753D] bg-[#F6E7D5] text-[#8A5726]' : 'border-[#D1DAD2] bg-[#FFFDF7] text-[#35463E]'}`} aria-pressed={isInTrip}><Route className="h-5 w-5" /><span className="text-[11px] font-extrabold">{isInTrip ? 'In trip' : isTripFull ? 'Trip full' : 'Add to trip'}</span></button>
          <button type="button" onClick={showPlaceOnMap} className="flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-[22px] border border-[#D1DAD2] bg-[#FFFDF7] px-2 text-[#35463E] transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Show ${place.name} on the myVillaverde map`}><MapPin className="h-5 w-5" /><span className="text-[11px] font-extrabold">Show on map</span></button>
        </section>

        {(place.phone || primaryExternalUrl) && (
          <section className="mt-3 grid grid-cols-2 gap-2.5" aria-label="Contact actions">
            {place.phone && <a href={`tel:${place.phone.replace(/[^+\d]/g, '')}`} className="flex items-center justify-center gap-2 rounded-[20px] border border-[#D1DAD2] bg-[#FFFDF7] px-4 py-3.5 text-sm font-extrabold text-[#35463E] transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"><Phone className="h-4 w-4" />Call</a>}
            {primaryExternalUrl && <a href={primaryExternalUrl} target="_blank" rel="noreferrer" className={`flex items-center justify-center gap-2 rounded-[20px] border border-[#D1DAD2] bg-[#FFFDF7] px-4 py-3.5 text-sm font-extrabold text-[#35463E] transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20 ${!place.phone ? 'col-span-2' : ''}`}><Globe2 className="h-4 w-4" />Website</a>}
          </section>
        )}

        <section className="mt-5 rounded-[28px] border border-[#D9E0D8] bg-[#FFFDF7] p-5 shadow-xs">
          <h2 className="font-serif-header text-xl font-bold text-[#18241F]">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-6 text-[#526158]">{place.description || `${place.name} is listed in the myVillaverde places database.`}</p>
        </section>

        <section className="mt-4 overflow-hidden rounded-[28px] border border-[#D9E0D8] bg-[#FFFDF7] shadow-xs">
          <div className="border-b border-[#E2E7DF] px-5 py-4"><h2 className="font-serif-header text-xl font-bold text-[#18241F]">Place details</h2></div>
          <div className="divide-y divide-[#E7EAE3] px-5">
            <div className="flex items-start gap-3 py-4">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#89928A]">Opening hours</p>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${openingHoursTone}`}>{openingHours.label}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm font-bold leading-5 text-[#35463E]">{openingHours.detail}</p>
                {openingHours.state === 'check' && <p className="mt-1 text-xs font-medium leading-5 text-[#89928A]">Hours can change. Check the current listing or call before visiting.</p>}
              </div>
            </div>
            <div className="flex items-start gap-3 py-4"><MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} /><div><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#89928A]">Address</p><p className="mt-1 text-sm font-bold leading-5 text-[#35463E]">{place.address || `${place.barangay}, Villaverde, Nueva Vizcaya`}</p></div></div>
            {place.phone && <div className="flex items-start gap-3 py-4"><Phone className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} /><div><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#89928A]">Phone</p><p className="mt-1 text-sm font-bold leading-5 text-[#35463E]">{place.phone}</p></div></div>}
            {primaryExternalUrl && <div className="flex items-start gap-3 py-4"><Globe2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} /><div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#89928A]">Website</p><a href={primaryExternalUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 max-w-full items-center gap-1.5 text-sm font-bold leading-5 text-[#35463E] underline decoration-[#B8C4BA] underline-offset-4"><span className="truncate">{formatWebsiteLabel(primaryExternalUrl)}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" /></a></div></div>}
            <div className="flex items-start gap-3 py-4"><Database className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} /><div><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#89928A]">Verification source</p><p className="mt-1 text-sm font-bold leading-5 text-[#35463E]">{place.verificationSource || 'Source not documented'}</p></div></div>
            <div className="flex items-start gap-3 py-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} /><div><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#89928A]">Listing status</p><p className="mt-1 text-sm font-bold leading-5 text-[#35463E]">{place.status || 'Needs Checking'}{place.lastChecked ? ` · Checked ${formatCheckedDate(place.lastChecked)}` : ' · Check date unavailable'}</p></div></div>
          </div>
        </section>

        {place.notes && <section className="mt-4 rounded-[24px] bg-[#F7F2E7] p-5"><h2 className="text-sm font-extrabold text-[#35463E]">Listing notes</h2><p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[#627066] [overflow-wrap:anywhere]">{place.notes}</p></section>}
        {!isVerified && <section className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#E7C98D] bg-[#FFF6E6] p-5 text-[#85501D]"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="text-sm font-extrabold">Use this listing as a guide</h2><p className="mt-1 text-sm font-medium leading-6">This place still needs local confirmation. Details may change before the database is updated.</p></div></section>}

        <RecommendationSection
          title="Related places"
          subtitle={`More ${place.category.toLowerCase()} listings, ordered by distance.`}
          suggestions={relatedPlaces}
          emptyMessage="No other places in this category are listed yet."
          onOpenPlace={onOpenPlace}
        />
        <RecommendationSection
          title="Nearby places"
          subtitle={`Other useful places closest to ${place.name}.`}
          suggestions={nearbyPlaces}
          emptyMessage="No additional nearby places are available in the current database."
          onOpenPlace={onOpenPlace}
        />

        <button type="button" onClick={onBack} className="mt-5 w-full rounded-full border border-[#D1DAD2] bg-[#FFFDF7] px-5 py-3.5 text-sm font-extrabold text-[#35463E] shadow-sm transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">Back</button>
      </div>
    </main>
    {galleryStartIndex !== null && (
      <PhotoGallery
        placeName={place.name}
        photos={approvedPhotoUrls}
        initialIndex={galleryStartIndex}
        photoSource={place.photoSource}
        photoCredit={place.photoCredit}
        onClose={closeGallery}
      />
    )}
    </>
  );
};
