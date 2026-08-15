import React, { useMemo } from 'react';
import {
  AlertTriangle, ChevronRight, Map, MapPin, RefreshCw,
} from 'lucide-react';
import type { Barangay, PlaceRecord, PlacesDataState } from '../types/app';
import { CATEGORY_MARKER_COLORS } from '../data/categories';
import { getBarangayCategoryLabels, getBarangayPlaces } from '../utils/barangayDiscovery';
import { BarangayArtwork } from './BarangayArtwork';

export interface BarangayDetailSheetProps {
  barangay: Barangay;
  places: PlaceRecord[];
  dataState: PlacesDataState;
  onOpenPlace: (place: PlaceRecord) => void;
  onOpenMap: (barangayId: string) => void;
}

export const BarangayDetailSheet: React.FC<BarangayDetailSheetProps> = ({
  barangay,
  places,
  dataState,
  onOpenPlace,
  onOpenMap,
}) => {
  const barangayPlaces = useMemo(
    () => getBarangayPlaces(places, barangay.name),
    [barangay.name, places],
  );
  const representedCategories = useMemo(
    () => getBarangayCategoryLabels(barangayPlaces),
    [barangayPlaces],
  );
  const isLoading = dataState === 'loading' && places.length === 0;
  const isUnavailable = dataState !== 'loading' && places.length === 0;
  const listingLabel = `${barangayPlaces.length} ${barangayPlaces.length === 1 ? 'listing' : 'listings'}`;

  return (
    <div className="space-y-4">
      <div
        className="relative h-[154px] overflow-hidden rounded-[26px] p-5 text-white shadow-sm"
        style={{
          backgroundImage: `linear-gradient(135deg, ${barangay.colors[0]} 0%, ${barangay.colors[1]} 54%, ${barangay.colors[2]} 100%)`,
        }}
      >
        <BarangayArtwork barangay={barangay} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-white/5" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <span className="w-fit rounded-full border border-white/25 bg-black/15 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] backdrop-blur-sm">
            {isLoading ? 'Loading listings' : listingLabel}
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/75">Villaverde, Nueva Vizcaya</p>
            <p className={`mt-1 font-serif-header font-bold leading-none ${barangay.name.length > 16 ? 'text-[26px]' : 'text-[30px]'}`}>
              {barangay.name}
            </p>
          </div>
        </div>
      </div>

      {dataState !== 'live' && dataState !== 'loading' && !isUnavailable && (
        <div className="flex items-start gap-2.5 rounded-[18px] border border-[#E7D6B2] bg-[#FFF8E8] px-3.5 py-3 text-xs font-medium leading-5 text-[#765A36]" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#9A5A24]" aria-hidden="true" />
          <span>{dataState === 'offline' ? 'You are offline. Showing the last available barangay listings.' : 'The live database could not be reached. Showing the built-in place snapshot.'}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenMap(barangay.id)}
        className="flex w-full items-center justify-between rounded-[22px] bg-[#26372F] px-4 py-3.5 text-left text-white shadow-sm transition-all hover:bg-[#31483D] active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12">
            <Map className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-extrabold">View {barangay.name} on the map</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-white/70">Centered on the mapped barangay location</span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
      </button>

      {isLoading ? (
        <div className="rounded-[24px] border border-[#D7DED4] bg-[#FFFDF7] p-6 text-center" role="status" aria-live="polite">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#526158]" aria-hidden="true" />
          <p className="mt-3 text-sm font-extrabold text-[#26372F]">Loading barangay listings</p>
          <p className="mt-1 text-xs font-medium leading-5 text-[#748078]">Checking the shared Villaverde places database.</p>
        </div>
      ) : isUnavailable ? (
        <div className="rounded-[24px] border border-[#D7DED4] bg-[#FFFDF7] p-6 text-center" role="status">
          <MapPin className="mx-auto h-6 w-6 text-[#748078]" aria-hidden="true" />
          <p className="mt-3 text-sm font-extrabold text-[#26372F]">Barangay listings are unavailable</p>
          <p className="mt-1 text-xs font-medium leading-5 text-[#748078]">Try again when the shared place guide is available.</p>
        </div>
      ) : barangayPlaces.length === 0 ? (
        <div className="rounded-[24px] border border-[#D7DED4] bg-[#FFFDF7] p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#E7ECE5] text-[#526158]">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-serif-header text-xl font-bold text-[#26372F]">No places listed yet</h3>
          <p className="mx-auto mt-2 max-w-[290px] text-xs font-medium leading-5 text-[#748078]">
            The shared guide does not currently have a listing for this barangay.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8B6E74]">Listed in the guide</p>
              <h3 className="mt-1 font-serif-header text-[22px] font-bold text-[#26372F]">{listingLabel}</h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 px-1" aria-label={`Categories represented in ${barangay.name}`}>
            {representedCategories.map((category) => (
              <span key={category} className="rounded-full bg-[#E7ECE5] px-2.5 py-1 text-[9px] font-extrabold text-[#526158]">
                {category}
              </span>
            ))}
          </div>

          <div className="space-y-2.5">
            {barangayPlaces.map((place) => (
              <button
                type="button"
                key={place.id}
                onClick={() => onOpenPlace(place)}
                className="flex w-full items-center gap-3 rounded-[20px] border border-[#D9E0D8] bg-[#FFFDF7] p-3.5 text-left shadow-xs transition-all hover:bg-white active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                aria-label={`Open ${place.name} place page`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-sm" style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }}>
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-[#26372F]">{place.name}</span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-[#748078]">{place.subcategory}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#748078]" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
