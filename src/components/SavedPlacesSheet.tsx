import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Bookmark, Check, ChevronDown, ChevronRight, Clock3, Filter,
  Heart, Layers3, MapPin, RefreshCw, Search, Trash2, X,
} from 'lucide-react';
import type {
  PlaceRecord, PlacesDataState, RecentlyViewedPlace, UserLocation,
} from '../types/app';
import { CATEGORY_MARKER_COLORS, LOCAL_CATEGORIES } from '../data/categories';
import { formatDistance, getDistanceMeters } from '../utils/places';
import { EmptyState } from './EmptyState';

const WANT_TO_VISIT_STORAGE_KEY = 'myVillaverde_wantToVisitPlaces_v2';
const LEGACY_WANT_TO_VISIT_STORAGE_KEY = 'myVillaverde_wantToVisitPlaceIds_v1';

type SavedCollectionId = 'favorites' | 'want-to-visit' | 'recent';
type SavedGroupMode = 'none' | 'category' | 'barangay';

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

const getCategoryLabel = (categoryId: PlaceRecord['categoryId']) =>
  LOCAL_CATEGORIES.find((category) => category.id === categoryId)?.title ?? categoryId;

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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [barangayFilter, setBarangayFilter] = useState<string>('all');
  const [groupMode, setGroupMode] = useState<SavedGroupMode>('none');
  const [showFilters, setShowFilters] = useState(false);
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

  const collectionPlaces = activeCollection === 'favorites'
    ? savedPlaces
    : activeCollection === 'want-to-visit'
      ? wantToVisitPlaces
      : recentPlaces;

  const availableCategories = useMemo(
    () => Array.from(new Set(collectionPlaces.map((place) => place.categoryId)))
      .sort((first, second) => getCategoryLabel(first).localeCompare(getCategoryLabel(second))),
    [collectionPlaces],
  );

  const availableBarangays = useMemo(
    () => Array.from(new Set(collectionPlaces.map((place) => place.barangay)))
      .sort((first, second) => first.localeCompare(second)),
    [collectionPlaces],
  );

  useEffect(() => {
    if (categoryFilter !== 'all' && !availableCategories.includes(categoryFilter as PlaceRecord['categoryId'])) {
      setCategoryFilter('all');
    }
  }, [availableCategories, categoryFilter]);

  useEffect(() => {
    if (barangayFilter !== 'all' && !availableBarangays.includes(barangayFilter)) {
      setBarangayFilter('all');
    }
  }, [availableBarangays, barangayFilter]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredPlaces = useMemo(
    () => collectionPlaces.filter((place) => {
      const categoryLabel = getCategoryLabel(place.categoryId);
      const matchesSearch = normalizedSearchQuery.length === 0 || [
        place.name,
        place.subcategory,
        place.barangay,
        place.categoryId,
        categoryLabel,
      ].some((value) => value.toLowerCase().includes(normalizedSearchQuery));

      const matchesCategory = categoryFilter === 'all' || place.categoryId === categoryFilter;
      const matchesBarangay = barangayFilter === 'all' || place.barangay === barangayFilter;

      return matchesSearch && matchesCategory && matchesBarangay;
    }),
    [barangayFilter, categoryFilter, collectionPlaces, normalizedSearchQuery],
  );

  const groupedPlaces = useMemo(() => {
    if (groupMode === 'none') {
      return [{ key: 'all', label: '', places: filteredPlaces }];
    }

    const groups = new Map<string, PlaceRecord[]>();
    filteredPlaces.forEach((place) => {
      const key = groupMode === 'category' ? place.categoryId : place.barangay;
      groups.set(key, [...(groups.get(key) ?? []), place]);
    });

    return Array.from(groups.entries())
      .map(([key, groupPlaces]) => ({
        key,
        label: groupMode === 'category'
          ? getCategoryLabel(key as PlaceRecord['categoryId'])
          : key,
        places: groupPlaces,
      }))
      .sort((first, second) => first.label.localeCompare(second.label));
  }, [filteredPlaces, groupMode]);

  const activeIndex = collections.findIndex((collection) => collection.id === activeCollection);
  const activeCollectionLabel = collections[activeIndex]?.label ?? 'Saved places';
  const hasActiveFilters = categoryFilter !== 'all' || barangayFilter !== 'all';
  const hasOrganizationControls = collectionPlaces.length > 0;

  const resetOrganization = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setBarangayFilter('all');
    setGroupMode('none');
  };

  const focusCollection = (index: number) => {
    const nextIndex = (index + collections.length) % collections.length;
    const nextCollection = collections[nextIndex];
    if (!nextCollection) return;

    setActiveCollection(nextCollection.id);
    setSearchQuery('');
    setCategoryFilter('all');
    setBarangayFilter('all');
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

  const renderPlaceCard = (place: PlaceRecord) => (
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
        <ChevronRight className="h-4 w-4 shrink-0 text-[#748078]" aria-hidden="true" />
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
            Move to {activeCollection === 'favorites' ? 'Want to Visit' : 'Favorites'}
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
  );

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
              onClick={() => {
                setActiveCollection(collection.id);
                setSearchQuery('');
                setCategoryFilter('all');
                setBarangayFilter('all');
              }}
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
        {filteredPlaces.length} matching {activeCollectionLabel.toLowerCase()} place
        {filteredPlaces.length === 1 ? '' : 's'}
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
                {hasOrganizationControls && (
                  <section className="space-y-2.5" aria-label="Search and organize saved places">
                    <div className="relative">
                      <label htmlFor="saved-place-search" className="sr-only">
                        Search {activeCollectionLabel}
                      </label>
                      <Search
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748078]"
                        aria-hidden="true"
                      />
                      <input
                        id="saved-place-search"
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape' && searchQuery) {
                            event.preventDefault();
                            setSearchQuery('');
                          }
                        }}
                        placeholder="Search name, category, or barangay"
                        autoComplete="off"
                        enterKeyHint="search"
                        className="h-12 w-full appearance-none rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] py-3 pl-11 pr-12 text-sm font-semibold text-[#26372F] shadow-xs outline-none transition focus:border-[#2B6A4E] focus:ring-4 focus:ring-[#2B6A4E]/15 placeholder:text-[#98A098]"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#EEF1E8] text-[#627066] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                          aria-label="Clear saved-place search"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFilters((current) => !current)}
                        aria-expanded={showFilters}
                        aria-controls="saved-place-filters"
                        className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border px-4 text-xs font-extrabold transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20 ${
                          showFilters || hasActiveFilters
                            ? 'border-[#2B6A4E] bg-[#E7F0E8] text-[#2B6A4E]'
                            : 'border-[#D9E0D8] bg-[#FFFDF7] text-[#526158]'
                        }`}
                      >
                        <Filter className="h-4 w-4" aria-hidden="true" />
                        Filters{hasActiveFilters ? ' active' : ''}
                      </button>

                      <label className="sr-only" htmlFor="saved-group-mode">
                        Group saved places
                      </label>
                      <div className="relative flex-1">
                        <Layers3
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#627066]"
                          aria-hidden="true"
                        />
                        <select
                          id="saved-group-mode"
                          value={groupMode}
                          onChange={(event) => setGroupMode(event.target.value as SavedGroupMode)}
                          className="h-10 w-full appearance-none rounded-full border border-[#D9E0D8] bg-[#FFFDF7] pl-10 pr-9 text-xs font-extrabold text-[#526158] outline-none transition focus:border-[#2B6A4E] focus:ring-4 focus:ring-[#2B6A4E]/15"
                        >
                          <option value="none">No grouping</option>
                          <option value="category">By category</option>
                          <option value="barangay">By barangay</option>
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#627066]"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    {showFilters && (
                      <div
                        id="saved-place-filters"
                        className="grid grid-cols-2 gap-2 rounded-[20px] border border-[#D9E0D8] bg-[#F3F5EF] p-3"
                      >
                        <div>
                          <label
                            htmlFor="saved-category-filter"
                            className="mb-1.5 block px-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#748078]"
                          >
                            Category
                          </label>
                          <select
                            id="saved-category-filter"
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                            className="h-10 w-full rounded-[16px] border border-[#D9E0D8] bg-[#FFFDF7] px-3 text-xs font-bold text-[#526158] outline-none focus:border-[#2B6A4E] focus:ring-4 focus:ring-[#2B6A4E]/15"
                          >
                            <option value="all">All categories</option>
                            {availableCategories.map((categoryId) => (
                              <option key={categoryId} value={categoryId}>
                                {getCategoryLabel(categoryId)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="saved-barangay-filter"
                            className="mb-1.5 block px-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#748078]"
                          >
                            Barangay
                          </label>
                          <select
                            id="saved-barangay-filter"
                            value={barangayFilter}
                            onChange={(event) => setBarangayFilter(event.target.value)}
                            className="h-10 w-full rounded-[16px] border border-[#D9E0D8] bg-[#FFFDF7] px-3 text-xs font-bold text-[#526158] outline-none focus:border-[#2B6A4E] focus:ring-4 focus:ring-[#2B6A4E]/15"
                          >
                            <option value="all">All barangays</option>
                            {availableBarangays.map((barangay) => (
                              <option key={barangay} value={barangay}>
                                {barangay}
                              </option>
                            ))}
                          </select>
                        </div>

                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryFilter('all');
                              setBarangayFilter('all');
                            }}
                            className="col-span-2 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[#FFFDF7] text-xs font-extrabold text-[#526158] transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            Clear filters
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                )}

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

                {collectionPlaces.length === 0 && unresolvedCount === 0 ? (
                  <EmptyState
                    icon={emptyCopy.icon}
                    title={emptyCopy.title}
                    message={emptyCopy.message}
                  />
                ) : filteredPlaces.length === 0 ? (
                  <div className="space-y-3">
                    <EmptyState
                      icon={Search}
                      title="No matching saved places"
                      message="Try another name, category, or barangay, or clear the current filters."
                    />
                    <button
                      type="button"
                      onClick={resetOrganization}
                      className="mx-auto flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#26372F] px-5 text-xs font-extrabold text-white transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Clear search and filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 px-1">
                      <p className="text-xs font-bold text-[#748078]">
                        {filteredPlaces.length} of {collectionPlaces.length} place
                        {collectionPlaces.length === 1 ? '' : 's'}
                      </p>
                      {(normalizedSearchQuery || hasActiveFilters || groupMode !== 'none') && (
                        <button
                          type="button"
                          onClick={resetOrganization}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-extrabold text-[#2B6A4E] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          Reset
                        </button>
                      )}
                    </div>

                    {groupedPlaces.map((group) => (
                      <section key={group.key} className="space-y-2.5">
                        {groupMode !== 'none' && (
                          <div className="flex items-center gap-2 px-1">
                            <h3 className="text-xs font-extrabold text-[#405047]">
                              {group.label}
                            </h3>
                            <span className="rounded-full bg-[#E7F0E8] px-2 py-0.5 text-[10px] font-extrabold text-[#2B6A4E]">
                              {group.places.length}
                            </span>
                          </div>
                        )}
                        <div className="space-y-2.5">
                          {group.places.map(renderPlaceCard)}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
