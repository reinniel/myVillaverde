import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark, ChevronDown, ChevronRight, Clock3, Heart, MapPin, Trash2,
} from 'lucide-react';
import type { PlaceRecord, RecentlyViewedPlace, UserLocation } from '../types/app';
import { CATEGORY_MARKER_COLORS } from '../data/categories';
import { formatDistance, getDistanceMeters } from '../utils/places';
import { EmptyState } from './EmptyState';

const WANT_TO_VISIT_STORAGE_KEY = 'myVillaverde_wantToVisitPlaceIds_v1';

type SavedCollectionId = 'favorites' | 'want-to-visit' | 'recent';

interface SavedPlacesSheetProps {
  savedPlaces: PlaceRecord[];
  recentlyViewedPlaces: RecentlyViewedPlace[];
  places: PlaceRecord[];
  userLocation: UserLocation | null;
  onOpenPlace: (place: PlaceRecord) => void;
  onToggleFavorite: (place: PlaceRecord) => void;
}

const readWantToVisitIds = () => {
  try {
    const raw = localStorage.getItem(WANT_TO_VISIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? Array.from(new Set(parsed.filter((value): value is string => typeof value === 'string')))
      : [];
  } catch (error) {
    console.error('Failed to read Want to Visit places', error);
    return [];
  }
};

export const SavedPlacesSheet: React.FC<SavedPlacesSheetProps> = ({
  savedPlaces,
  recentlyViewedPlaces,
  places,
  userLocation,
  onOpenPlace,
  onToggleFavorite,
}) => {
  const [activeCollection, setActiveCollection] = useState<SavedCollectionId>('favorites');
  const [wantToVisitIds, setWantToVisitIds] = useState<string[]>(readWantToVisitIds);

  useEffect(() => {
    try {
      localStorage.setItem(WANT_TO_VISIT_STORAGE_KEY, JSON.stringify(wantToVisitIds));
    } catch (error) {
      console.error('Failed to save Want to Visit places', error);
    }
  }, [wantToVisitIds]);

  const favoriteIds = useMemo(() => new Set(savedPlaces.map((place) => place.id)), [savedPlaces]);
  const wantToVisitPlaces = useMemo(
    () => wantToVisitIds
      .map((id) => places.find((place) => place.id === id))
      .filter((place): place is PlaceRecord => Boolean(place)),
    [places, wantToVisitIds],
  );
  const recentPlaces = useMemo(
    () => recentlyViewedPlaces
      .map((recent) => places.find((place) => place.id === recent.id))
      .filter((place): place is PlaceRecord => Boolean(place)),
    [places, recentlyViewedPlaces],
  );

  const collections = [
    { id: 'favorites' as const, label: 'Favorites', icon: Heart, count: savedPlaces.length },
    { id: 'want-to-visit' as const, label: 'Want to Visit', icon: Bookmark, count: wantToVisitPlaces.length },
    { id: 'recent' as const, label: 'Recently Viewed', icon: Clock3, count: recentPlaces.length },
  ];

  const visiblePlaces = activeCollection === 'favorites'
    ? savedPlaces
    : activeCollection === 'want-to-visit'
      ? wantToVisitPlaces
      : recentPlaces;

  const moveToWantToVisit = (place: PlaceRecord) => {
    if (favoriteIds.has(place.id)) onToggleFavorite(place);
    setWantToVisitIds((current) => [place.id, ...current.filter((id) => id !== place.id)]);
    setActiveCollection('want-to-visit');
  };

  const moveToFavorites = (place: PlaceRecord) => {
    if (!favoriteIds.has(place.id)) onToggleFavorite(place);
    setWantToVisitIds((current) => current.filter((id) => id !== place.id));
    setActiveCollection('favorites');
  };

  const removeFromCurrentCollection = (place: PlaceRecord) => {
    if (activeCollection === 'favorites') {
      if (favoriteIds.has(place.id)) onToggleFavorite(place);
      return;
    }
    if (activeCollection === 'want-to-visit') {
      setWantToVisitIds((current) => current.filter((id) => id !== place.id));
    }
  };

  const emptyCopy = activeCollection === 'favorites'
    ? {
        icon: Heart,
        title: 'No favorites yet',
        message: 'Places already saved before this update will appear here automatically.',
      }
    : activeCollection === 'want-to-visit'
      ? {
          icon: Bookmark,
          title: 'No places planned yet',
          message: 'Move a favorite here when it is somewhere you still want to visit.',
        }
      : {
          icon: Clock3,
          title: 'Nothing viewed recently',
          message: 'Places you open will appear here without changing your saved collections.',
        };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Saved place collections">
        {collections.map((collection) => {
          const Icon = collection.icon;
          const isActive = activeCollection === collection.id;
          return (
            <button
              key={collection.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCollection(collection.id)}
              className={`min-w-0 rounded-[20px] border px-2 py-3 text-center transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20 ${
                isActive
                  ? 'border-[#2B6A4E] bg-[#E7F0E8] text-[#2B6A4E] shadow-sm'
                  : 'border-[#D9E0D8] bg-[#FFFDF7] text-[#5C685F]'
              }`}
            >
              <Icon className={`mx-auto h-5 w-5 ${isActive && collection.id === 'favorites' ? 'fill-current' : ''}`} />
              <span className="mt-1.5 block truncate text-[10px] font-extrabold leading-4">{collection.label}</span>
              <span className="mt-0.5 block text-[10px] font-bold opacity-70">{collection.count}</span>
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {visiblePlaces.length} {collections.find((item) => item.id === activeCollection)?.label.toLowerCase()} place
        {visiblePlaces.length === 1 ? '' : 's'}
      </p>

      {visiblePlaces.length === 0 ? (
        <EmptyState icon={emptyCopy.icon} title={emptyCopy.title} message={emptyCopy.message} />
      ) : (
        <div className="space-y-2.5">
          {visiblePlaces.map((place) => (
            <article
              key={place.id}
              className="rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] p-2.5 shadow-xs"
            >
              <button
                type="button"
                onClick={() => onOpenPlace(place)}
                className="flex w-full min-w-0 items-center gap-3 rounded-[18px] p-1 text-left transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                aria-label={`Open ${place.name} place page`}
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-sm"
                  style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }}
                >
                  <MapPin className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-[#26372F]">{place.name}</span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-[#748078]">
                    {place.subcategory} · {place.barangay}
                    {userLocation ? ` · ${formatDistance(getDistanceMeters(userLocation, place))}` : ''}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#748078]" />
              </button>

              {activeCollection !== 'recent' && (
                <div className="mt-2 flex items-center justify-end gap-2 border-t border-[#E4E8E1] pt-2">
                  <button
                    type="button"
                    onClick={() => activeCollection === 'favorites' ? moveToWantToVisit(place) : moveToFavorites(place)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#EEF1E8] px-3 text-[10px] font-extrabold text-[#526158] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Move to {activeCollection === 'favorites' ? 'Want to Visit' : 'Favorites'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCurrentCollection(place)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#FBE9E7] text-[#9B4338] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#9B4338]/20"
                    aria-label={`Remove ${place.name} from ${activeCollection === 'favorites' ? 'Favorites' : 'Want to Visit'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
