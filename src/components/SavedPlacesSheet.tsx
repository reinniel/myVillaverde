import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Bookmark, ChevronDown, ChevronRight, Clock3, Heart, MapPin, RefreshCw, Trash2,
} from 'lucide-react';
import type {
  PlaceRecord, PlacesDataState, RecentlyViewedPlace, UserLocation,
} from '../types/app';
import { CATEGORY_MARKER_COLORS } from '../data/categories';
import { formatDistance, getDistanceMeters } from '../utils/places';
import { EmptyState } from './EmptyState';

const WANT_TO_VISIT_STORAGE_KEY = 'myVillaverde_wantToVisitPlaces_v2';
const LEGACY_WANT_TO_VISIT_STORAGE_KEY = 'myVillaverde_wantToVisitPlaceIds_v1';

type SavedCollectionId = 'favorites' | 'want-to-visit' | 'recent';

interface SavedPlacesSheetProps {
  savedPlaces: PlaceRecord[];
  recentlyViewedPlaces: RecentlyViewedPlace[];
  places: PlaceRecord[];
  dataState: PlacesDataState;
  userLocation: UserLocation | null;
  onOpenPlace: (place: PlaceRecord) => void;
  onToggleFavorite: (place: PlaceRecord) => void;
}

const isStoredPlaceRecord = (value: unknown): value is PlaceRecord => {
  if (!value || typeof value !== 'object') return false;

  const place = value as Partial<PlaceRecord>;
  return (
    typeof place.id === 'string'
    && typeof place.name === 'string'
    && typeof place.categoryId === 'string'
    && typeof place.subcategory === 'string'
    && typeof place.barangay === 'string'
    && typeof place.latitude === 'number'
    && typeof place.longitude === 'number'
  );
};

const readWantToVisitPlaces = (): PlaceRecord[] => {
  try {
    const raw = localStorage.getItem(WANT_TO_VISIT_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredPlaceRecord) : [];
  } catch (error) {
    console.error('Failed to read Want to Visit places', error);
    return [];
  }
};

const readLegacyWantToVisitIds = (): string[] => {
  try {
    const raw = localStorage.getItem(LEGACY_WANT_TO_VISIT_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? Array.from(new Set(parsed.filter((value): value is string => typeof value === 'string')))
      : [];
  } catch (error) {
    console.error('Failed to read legacy Want to Visit places', error);
    return [];
  }
};

const dedupePlaces = (items: PlaceRecord[]) => {
  const seen = new Set<string>();
  return items.filter((place) => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
};

export const SavedPlacesSheet: React.FC<SavedPlacesSheetProps> = ({
  savedPlaces,
  recentlyViewedPlaces,
  places,
  dataState,
  userLocation,
  onOpenPlace,
  onToggleFavorite,
}) => {
  const [activeCollection, setActiveCollection] = useState<SavedCollectionId>('favorites');
  const [wantToVisitSnapshots, setWantToVisitSnapshots] = useState<PlaceRecord[]>(readWantToVisitPlaces);
  const [legacyWantToVisitIds, setLegacyWantToVisitIds] = useState<string[]>(readLegacyWantToVisitIds);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    try {
      localStorage.setItem(WANT_TO_VISIT_STORAGE_KEY, JSON.stringify(wantToVisitSnapshots));
    } catch (error) {
      console.error('Failed to save Want to Visit places', error);
    }
  }, [wantToVisitSnapshots]);

  useEffect(() => {
    if (legacyWantToVisitIds.length === 0) return;

    const resolvedPlaces = legacyWantToVisitIds
      .map((id) => places.find((place) => place.id === id))
      .filter((place): place is PlaceRecord => Boolean(place));

    if (resolvedPlaces.length === 0) return;

    const resolvedIds = new Set(resolvedPlaces.map((place) => place.id));
    setWantToVisitSnapshots((current) => dedupePlaces([...resolvedPlaces, ...current]));
    setLegacyWantToVisitIds((current) => {
      const next = current.filter((id) => !resolvedIds.has(id));

      try {
        if (next.length > 0) {
          localStorage.setItem(LEGACY_WANT_TO_VISIT_STORAGE_KEY, JSON.stringify(next));
        } else {
          localStorage.removeItem(LEGACY_WANT_TO_VISIT_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to finish Want to Visit migration', error);
      }

      return next;
    });
  }, [legacyWantToVisitIds, places]);

  const favoriteIds = useMemo(() => new Set(savedPlaces.map((place) => place.id)), [savedPlaces]);
  const wantToVisitSnapshotIds = useMemo(
    () => new Set(wantToVisitSnapshots.map((place) => place.id)),
    [wantToVisitSnapshots],
  );
  const unresolvedLegacyIds = useMemo(
    () => legacyWantToVisitIds.filter((id) => !wantToVisitSnapshotIds.has(id)),
    [legacyWantToVisitIds, wantToVisitSnapshotIds],
  );

  const wantToVisitPlaces = useMemo(
    () => wantToVisitSnapshots.map(
      (snapshot) => places.find((place) => place.id === snapshot.id) ?? snapshot,
    ),
    [places, wantToVisitSnapshots],
  );

  const recentPlaces = useMemo(
    () => recentlyViewedPlaces
      .map((recent) => places.find((place) => place.id === recent.id))
      .filter((place): place is PlaceRecord => Boolean(place)),
    [places, recentlyViewedPlaces],
  );

  const unresolvedRecentCount = Math.max(0, recentlyViewedPlaces.length - recentPlaces.length);

  const collections = [
    { id: 'favorites' as const, label: 'Favorites', icon: Heart, count: savedPlaces.length },
    {
      id: 'want-to-visit' as const,
      label: 'Want to Visit',
      icon: Bookmark,
      count: wantToVisitPlaces.length + unresolvedLegacyIds.length,
    },
    {
      id: 'recent' as const,
      label: 'Recently Viewed',
      icon: Clock3,
      count: recentlyViewedPlaces.length,
    },
  ];

  const visiblePlaces = activeCollection === 'favorites'
    ? savedPlaces
    : activeCollection === 'want-to-visit'
      ? wantToVisitPlaces
      : recentPlaces;

  const activeIndex = collections.findIndex((collection) => collection.id === activeCollection);
  const activeCollectionLabel = collections[activeIndex]?.label ?? 'Saved places';

  const focusCollection = (index: number) => {
    const nextIndex = (index + collections.length) % collections.length;
    const nextCollection = collections[nextIndex];
    if (!nextCollection) return;

    setActiveCollection(nextCollection.id);
    window.requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
  };

  const handleCollectionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusCollection(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusCollection(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusCollection(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusCollection(collections.length - 1);
    }
  };

  const persistLegacyIds = (ids: string[]) => {
    try {
      if (ids.length > 0) {
        localStorage.setItem(LEGACY_WANT_TO_VISIT_STORAGE_KEY, JSON.stringify(ids));
      } else {
        localStorage.removeItem(LEGACY_WANT_TO_VISIT_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to update legacy Want to Visit places', error);
    }
  };

  const moveToWantToVisit = (place: PlaceRecord) => {
    if (favoriteIds.has(place.id)) onToggleFavorite(place);

    setWantToVisitSnapshots((current) => dedupePlaces([place, ...current]));
    setLegacyWantToVisitIds((current) => {
      const next = current.filter((id) => id !== place.id);
      persistLegacyIds(next);
      return next;
    });
    setActiveCollection('want-to-visit');
  };

  const moveToFavorites = (place: PlaceRecord) => {
    if (!favoriteIds.has(place.id)) onToggleFavorite(place);
    setWantToVisitSnapshots((current) => current.filter((item) => item.id !== place.id));
    setActiveCollection('favorites');
  };

  const removeFromCurrentCollection = (place: PlaceRecord) => {
    if (activeCollection === 'favorites') {
      if (favoriteIds.has(place.id)) onToggleFavorite(place);
      return;
    }

    if (activeCollection === 'want-to-visit') {
      setWantToVisitSnapshots((current) => current.filter((item) => item.id !== place.id));
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

  const unresolvedCount = activeCollection === 'want-to-visit'
    ? unresolvedLegacyIds.length
    : activeCollection === 'recent'
      ? unresolvedRecentCount
      : 0;

  const isRestoring = unresolvedCount > 0 && dataState === 'loading';
  const hasUnresolvedItems = unresolvedCount > 0 && dataState !== 'loading';

  return (
    <div className="space-y-4">
      <div
        className="grid grid-cols-3 gap-2"
        role="tablist"
        aria-label="Saved place collections"
        aria-orientation="horizontal"
      >
        {collections.map((collection, index) => {
          const Icon = collection.icon;
          const isActive = activeCollection === collection.id;
          const tabId = `saved-tab-${collection.id}`;
          const panelId = `saved-panel-${collection.id}`;

          return (
            <button
              key={collection.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveCollection(collection.id)}
              onKeyDown={(event) => handleCollectionKeyDown(event, index)}
              className={`min-w-0 rounded-[20px] border px-2 py-3 text-center transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20 ${
                isActive
                  ? 'border-[#2B6A4E] bg-[#E7F0E8] text-[#2B6A4E] shadow-sm'
                  : 'border-[#D9E0D8] bg-[#FFFDF7] text-[#5C685F]'
              }`}
            >
              <Icon
                className={`mx-auto h-5 w-5 ${
                  isActive && collection.id === 'favorites' ? 'fill-current' : ''
                }`}
                aria-hidden="true"
              />
              <span className="mt-1.5 block truncate text-[10px] font-extrabold leading-4">
                {collection.label}
              </span>
              <span className="mt-0.5 block text-[10px] font-bold opacity-70">
                {collection.count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {collections[activeIndex]?.count ?? 0} {activeCollectionLabel.toLowerCase()} place
        {(collections[activeIndex]?.count ?? 0) === 1 ? '' : 's'}
      </p>

      {collections.map((collection) => {
        const isActive = activeCollection === collection.id;

        return (
          <div
            key={collection.id}
            id={`saved-panel-${collection.id}`}
            role="tabpanel"
            aria-labelledby={`saved-tab-${collection.id}`}
            tabIndex={isActive ? 0 : -1}
            hidden={!isActive}
            className="space-y-3 focus:outline-none"
          >
            {isActive && (
              <>
                {isRestoring && (
                  <div
                    className="flex items-start gap-3 rounded-[20px] border border-[#BFD2EA] bg-[#F2F7FF] p-4"
                    role="status"
                    aria-live="polite"
                  >
                    <RefreshCw
                      className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[#2563EB]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-extrabold text-[#1E3A5F]">
                        Restoring saved places
                      </p>
                      <p className="mt-1 text-xs font-medium leading-5 text-[#64748B]">
                        {unresolvedCount} saved {unresolvedCount === 1 ? 'place is' : 'places are'} still
                        being matched with the live database.
                      </p>
                    </div>
                  </div>
                )}

                {hasUnresolvedItems && (
                  <div
                    className="flex items-start gap-3 rounded-[20px] border border-[#E8D6AF] bg-[#FFF8E8] p-4"
                    role="status"
                  >
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#8A581F]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-extrabold text-[#6F451C]">
                        Some saved places are temporarily unavailable
                      </p>
                      <p className="mt-1 text-xs font-medium leading-5 text-[#7A644C]">
                        {unresolvedCount} saved {unresolvedCount === 1 ? 'place remains' : 'places remain'}
                        stored on this device and will return when matching place data is available.
                      </p>
                    </div>
                  </div>
                )}

                {visiblePlaces.length === 0 && unresolvedCount === 0 ? (
                  <EmptyState
                    icon={emptyCopy.icon}
                    title={emptyCopy.title}
                    message={emptyCopy.message}
                  />
                ) : visiblePlaces.length > 0 ? (
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
                            <MapPin className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-extrabold text-[#26372F]">
                              {place.name}
                            </span>
                            <span className="mt-0.5 block truncate text-xs font-medium text-[#748078]">
                              {place.subcategory} · {place.barangay}
                              {userLocation
                                ? ` · ${formatDistance(getDistanceMeters(userLocation, place))}`
                                : ''}
                            </span>
                          </span>
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-[#748078]"
                            aria-hidden="true"
                          />
                        </button>

                        {activeCollection !== 'recent' && (
                          <div className="mt-2 flex items-center justify-end gap-2 border-t border-[#E4E8E1] pt-2">
                            <button
                              type="button"
                              onClick={() => (
                                activeCollection === 'favorites'
                                  ? moveToWantToVisit(place)
                                  : moveToFavorites(place)
                              )}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#EEF1E8] px-3 text-[10px] font-extrabold text-[#526158] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                            >
                              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                              Move to {
                                activeCollection === 'favorites' ? 'Want to Visit' : 'Favorites'
                              }
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCurrentCollection(place)}
                              className="grid h-9 w-9 place-items-center rounded-full bg-[#FBE9E7] text-[#9B4338] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#9B4338]/20"
                              aria-label={`Remove ${place.name} from ${
                                activeCollection === 'favorites' ? 'Favorites' : 'Want to Visit'
                              }`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
