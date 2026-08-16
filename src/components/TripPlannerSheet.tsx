import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, ExternalLink, MapPin, Plus, RefreshCw, Route,
  Search, Trash2, WifiOff,
} from 'lucide-react';
import type { PlaceRecord, PlacesDataState } from '../types/app';
import { CATEGORY_MARKER_COLORS } from '../data/categories';
import { getTripDirectionsUrl, MAX_TRIP_STOPS } from '../utils/places';

interface TripPlannerSheetProps {
  placeIds: string[];
  places: PlaceRecord[];
  dataState: PlacesDataState;
  isOnline: boolean;
  onAddPlace: (place: PlaceRecord) => void;
  onRemovePlace: (placeId: string) => void;
  onMovePlace: (placeId: string, direction: -1 | 1) => void;
  onClear: () => void;
  onOpenPlace: (place: PlaceRecord) => void;
}

export const TripPlannerSheet: React.FC<TripPlannerSheetProps> = ({
  placeIds,
  places,
  dataState,
  isOnline,
  onAddPlace,
  onRemovePlace,
  onMovePlace,
  onClear,
  onOpenPlace,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const placeById = useMemo(
    () => new Map(places.map((place) => [place.id, place])),
    [places],
  );
  const tripPlaces = useMemo(
    () => placeIds.map((placeId) => placeById.get(placeId)).filter((place): place is PlaceRecord => Boolean(place)),
    [placeById, placeIds],
  );
  const unresolvedPlaceIds = useMemo(
    () => placeIds.filter((placeId) => !placeById.has(placeId)),
    [placeById, placeIds],
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const availablePlaces = useMemo(() => {
    const selectedIds = new Set(placeIds);
    return places
      .filter((place) => !selectedIds.has(place.id))
      .filter((place) => !normalizedQuery || [place.name, place.subcategory, place.barangay]
        .some((value) => value.toLowerCase().includes(normalizedQuery)))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [normalizedQuery, placeIds, places]);
  const isFull = placeIds.length >= MAX_TRIP_STOPS;
  const routeUrl = unresolvedPlaceIds.length === 0 ? getTripDirectionsUrl(tripPlaces) : '';

  return (
    <div className="space-y-5">
      {dataState === 'loading' && (
        <div className="flex items-start gap-3 rounded-[20px] border border-[#D9E0D8] bg-[#F5F4EA] p-4 text-[#526158]" role="status" aria-live="polite">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          <p className="text-xs font-semibold leading-5">Checking the live Places database. Your saved itinerary remains available.</p>
        </div>
      )}
      {dataState === 'offline' && (
        <div className="flex items-start gap-3 rounded-[20px] border border-[#E8D6AF] bg-[#FFF8E8] p-4 text-[#6F451C]" role="status">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-xs font-semibold leading-5">
            Your itinerary is available offline. Reconnect before opening the route in Google Maps.
          </p>
        </div>
      )}
      {dataState === 'snapshot' && (
        <div className="flex items-start gap-3 rounded-[20px] border border-[#E8D6AF] bg-[#FFF8E8] p-4 text-[#6F451C]" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-xs font-semibold leading-5">Using the built-in place snapshot because the live database could not be reached.</p>
        </div>
      )}

      <section aria-labelledby="trip-stops-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9A6A45]">Your route</p>
            <h3 id="trip-stops-heading" className="mt-1 font-serif-header text-[23px] font-bold text-[#18241F]" aria-live="polite">
              {placeIds.length === 0 ? 'Choose your stops' : `${placeIds.length} ${placeIds.length === 1 ? 'stop' : 'stops'}`}
            </h3>
          </div>
          {tripPlaces.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirmClear) {
                  onClear();
                  setConfirmClear(false);
                } else {
                  setConfirmClear(true);
                }
              }}
              className="min-h-10 rounded-full px-3 text-[10px] font-extrabold text-[#A4513D] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#A4513D]/20"
            >
              {confirmClear ? 'Tap again to clear' : 'Clear all'}
            </button>
          )}
        </div>

        {unresolvedPlaceIds.length > 0 && (
          <div className="mt-3 flex items-start justify-between gap-3 rounded-[18px] border border-[#E7C98D] bg-[#FFF6E6] p-4 text-[#85501D]" role="status">
            <div className="flex min-w-0 items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="text-xs font-semibold leading-5">{unresolvedPlaceIds.length} saved {unresolvedPlaceIds.length === 1 ? 'stop is' : 'stops are'} unavailable in the current place data. Remove {unresolvedPlaceIds.length === 1 ? 'it' : 'them'} before opening the route.</p>
            </div>
            <button type="button" onClick={() => unresolvedPlaceIds.forEach(onRemovePlace)} className="min-h-10 shrink-0 rounded-full bg-white/75 px-3 text-[10px] font-extrabold focus:outline-none focus-visible:ring-4 focus-visible:ring-[#9A5A24]/20">Remove</button>
          </div>
        )}

        {placeIds.length === 0 ? (
          <div className="mt-3 rounded-[26px] border border-dashed border-[#C9D3CA] bg-[#F6F8F2] px-5 py-7 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E7EEE5] text-[#2B6A4E]"><Route className="h-6 w-6" /></span>
            <p className="mt-4 text-sm font-extrabold text-[#26372F]">Start with a real place</p>
            <p className="mx-auto mt-1 max-w-[270px] text-xs font-medium leading-5 text-[#748078]">Add up to four stops, arrange their order, then open the route in Google Maps.</p>
          </div>
        ) : (
          <ol className="mt-3 space-y-2.5">
            {tripPlaces.map((place, index) => (
              <li key={place.id} className="flex items-center gap-2 rounded-[22px] border border-[#D7DED4] bg-[#FFFDF7] p-3 shadow-xs">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white" style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }}>{index + 1}</span>
                <button type="button" onClick={() => onOpenPlace(place)} className="min-w-0 flex-1 rounded-xl text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Open ${place.name} place page`}>
                  <span className="block truncate text-sm font-extrabold text-[#26372F]">{place.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-medium text-[#748078]">{place.subcategory} · {place.barangay}</span>
                </button>
                <div className="flex shrink-0 items-center" role="group" aria-label={`Reorder or remove ${place.name}`}>
                  <button type="button" onClick={() => onMovePlace(place.id, -1)} disabled={index === 0} className="grid h-10 w-9 place-items-center rounded-xl text-[#526158] disabled:opacity-25 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Move ${place.name} earlier`}><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => onMovePlace(place.id, 1)} disabled={index === tripPlaces.length - 1} className="grid h-10 w-9 place-items-center rounded-xl text-[#526158] disabled:opacity-25 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Move ${place.name} later`}><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => onRemovePlace(place.id)} className="grid h-10 w-9 place-items-center rounded-xl text-[#A4513D] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#A4513D]/20" aria-label={`Remove ${place.name} from trip`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ol>
        )}

        {routeUrl && (
          isOnline ? <a href={routeUrl} target="_blank" rel="noreferrer" className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#26372F] px-5 text-sm font-extrabold text-white shadow-sm transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25">
            <Route className="h-5 w-5" />
            {tripPlaces.length === 1 ? 'Directions to this stop' : 'Open route in Google Maps'}
            <ExternalLink className="h-4 w-4" />
          </a> : <button type="button" disabled className="mt-3 flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[20px] bg-[#DDE2DC] px-5 text-sm font-extrabold text-[#748078]">
            <WifiOff className="h-5 w-5" aria-hidden="true" />
            Reconnect to open route
          </button>
        )}
        <p className="mt-2 text-center text-[10px] font-semibold leading-4 text-[#89928A]">Order matters. Maps starts from your current location when available.</p>
      </section>

      <section aria-labelledby="add-stop-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7A667C]">From the guide</p>
            <h3 id="add-stop-heading" className="mt-1 font-serif-header text-[22px] font-bold text-[#18241F]">Add a stop</h3>
          </div>
          <span className="rounded-full bg-[#E7EEE5] px-3 py-1.5 text-[10px] font-extrabold text-[#526158]" aria-live="polite">{placeIds.length}/{MAX_TRIP_STOPS}</span>
        </div>
        <div className="relative mt-3">
          <label htmlFor="trip-place-search" className="sr-only">Search places to add</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748078]" aria-hidden="true" />
          <input id="trip-place-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search places or barangays…" className="min-h-12 w-full rounded-[18px] border border-[#D7DED4] bg-[#FFFDF7] py-3 pl-11 pr-4 text-sm font-semibold text-[#26372F] outline-none placeholder:text-[#98A29A] focus:border-[#2B6A4E] focus:ring-4 focus:ring-[#2B6A4E]/10" />
        </div>
        {isFull && <p className="mt-2 rounded-[16px] bg-[#FFF0D8] px-4 py-3 text-xs font-semibold leading-5 text-[#8A5726]">Four stops is the reliable mobile route limit. Remove one to add another.</p>}
        <div className="mt-3 space-y-2">
          {availablePlaces.slice(0, normalizedQuery ? 12 : 8).map((place) => (
            <div key={place.id} className="flex items-center gap-3 rounded-[20px] border border-[#DDE3DB] bg-[#FFFDF7] p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }}><MapPin className="h-4 w-4" /></span>
              <button type="button" onClick={() => onOpenPlace(place)} className="min-w-0 flex-1 rounded-xl text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Open ${place.name} place page`}>
                <span className="block truncate text-sm font-extrabold text-[#26372F]">{place.name}</span>
                <span className="mt-0.5 block truncate text-[11px] font-medium text-[#748078]">{place.subcategory} · {place.barangay}</span>
              </button>
              <button type="button" onClick={() => onAddPlace(place)} disabled={isFull} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E7EEE5] text-[#2B6A4E] disabled:opacity-35 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Add ${place.name} to trip`}><Plus className="h-5 w-5" /></button>
            </div>
          ))}
          {availablePlaces.length === 0 && (
            <p className="rounded-[20px] border border-dashed border-[#CBD4CC] px-4 py-5 text-center text-sm font-semibold text-[#748078]">{normalizedQuery ? 'No matching places found.' : 'Every available place is already in this trip.'}</p>
          )}
        </div>
      </section>
    </div>
  );
};
