import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, Bookmark, Check, ChevronRight, MapPin, Navigation, RefreshCw, Search, X,
} from 'lucide-react';
import type {
  AppMode, CategoryScope, GuideCategory, MapPanelView, ModalId, PlaceRecord,
  RecentlyViewedPlace, SelectedCategory, TransitionDirection, UserLocation,
} from './types/app';
import { MODE_ORDER, VILLAVERDE_BARANGAYS } from './data/barangays';
import { CATEGORY_MARKER_COLORS } from './data/categories';
import {
  RECENTLY_VIEWED_STORAGE_KEY, SAVED_PLACES_STORAGE_KEY, SELECTED_BARANGAY_STORAGE_KEY,
} from './data/config';
import { usePlacesData } from './hooks/usePlacesData';
import { ModeHeader } from './components/ModeHeader';
import { BottomSheet } from './components/BottomSheet';
import { BarangayArtwork } from './components/BarangayArtwork';
import { EmptyState } from './components/EmptyState';
import { WelcomeLanding } from './screens/WelcomeLanding';
import { LocalDashboard } from './screens/LocalDashboard';
import { VisitorDashboard } from './screens/VisitorDashboard';
import { MapScreen } from './screens/MapScreen';
import { PlacePage } from './screens/PlacePage';
import {
  buildPlacePageUrl, readPlacePageIdFromUrl, removePlacePageFromUrl,
} from './utils/placeNavigation';
import {
  formatDistance, getDirectionsUrl, getDistanceMeters, placeMatchesGuideCategory,
} from './utils/places';
import './styles/app.css';

export default function App() {
  const [mode, setMode] = useState<AppMode>('home');
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>('neutral');
  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const [mapScope, setMapScope] = useState<CategoryScope | null>(null);
  const [placePageId, setPlacePageId] = useState<string | null>(() => readPlacePageIdFromUrl());
  const [mapInitialPanelView, setMapInitialPanelView] = useState<MapPanelView>('categories');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategory | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const {
    places,
    dataState: placesDataState,
    loadMessage: placesLoadMessage,
    isOnline,
    refresh: refreshPlaces,
  } = usePlacesData();
  const [savedPlaces, setSavedPlaces] = useState<PlaceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_PLACES_STORAGE_KEY);
      if (!saved) return [];
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is PlaceRecord => {
        if (!item || typeof item !== 'object') return false;
        const place = item as Partial<PlaceRecord>;
        return typeof place.id === 'string' && typeof place.name === 'string' && typeof place.categoryId === 'string' && typeof place.barangay === 'string';
      });
    } catch (error) {
      console.error('Failed to read saved places from localStorage', error);
      return [];
    }
  });

  const [selectedBarangay, setSelectedBarangay] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_BARANGAY_STORAGE_KEY);
      if (saved && VILLAVERDE_BARANGAYS.some((barangay) => barangay.name === saved)) return saved;
    } catch (error) {
      console.error('Failed to read selectedBarangay from localStorage', error);
    }
    return 'Ibung';
  });

  const [recentlyViewedPlaces, setRecentlyViewedPlaces] = useState<RecentlyViewedPlace[]>(() => {
    try {
      const saved = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
      if (!saved) return [];
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item): item is RecentlyViewedPlace => {
          if (!item || typeof item !== 'object') return false;
          const place = item as Partial<RecentlyViewedPlace>;
          return typeof place.id === 'string' && typeof place.name === 'string' && typeof place.categoryId === 'string' && typeof place.barangayName === 'string';
        })
        .slice(0, 3);
    } catch (error) {
      console.error('Failed to read recently viewed places from localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    const syncPlacePageFromUrl = () => setPlacePageId(readPlacePageIdFromUrl());
    window.addEventListener('popstate', syncPlacePageFromUrl);

    const initialPlaceId = readPlacePageIdFromUrl();
    if (initialPlaceId && !window.history.state?.myVillaverdePlaceEntry) {
      window.history.replaceState({ ...window.history.state, myVillaverdeDirectPlace: true }, '', window.location.href);
    }

    return () => window.removeEventListener('popstate', syncPlacePageFromUrl);
  }, []);

  useEffect(() => {
    if (!activeModal) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [activeModal]);

  useEffect(() => {
    setCategorySearchQuery('');
  }, [activeModal, selectedCategory]);

  const activeBarangay =
    VILLAVERDE_BARANGAYS.find((barangay) => barangay.name === selectedBarangay) ??
    VILLAVERDE_BARANGAYS.find((barangay) => barangay.name === 'Ibung')!;

  const placePage = placePageId ? places.find((place) => place.id === placePageId) ?? null : null;

  const rememberRecentlyViewedPlace = (place: PlaceRecord) => {
    setRecentlyViewedPlaces((current) => {
      const next: RecentlyViewedPlace[] = [
        { id: place.id, name: place.name, categoryId: place.categoryId, barangayName: place.barangay },
        ...current.filter((item) => item.id !== place.id),
      ].slice(0, 3);
      try {
        localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save recently viewed places to localStorage', error);
      }
      return next;
    });
  };

  const navigateToPlacePage = (placeId: string) => {
    setActiveModal(null);
    window.history.pushState({ ...window.history.state, myVillaverdePlaceEntry: true, placeId }, '', buildPlacePageUrl(placeId));
    setPlacePageId(placeId);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const openPlacePage = (place: PlaceRecord) => {
    rememberRecentlyViewedPlace(place);
    navigateToPlacePage(place.id);
  };

  const openRecentlyViewedPlace = (placeId: string) => {
    const place = places.find((candidate) => candidate.id === placeId);
    if (place) rememberRecentlyViewedPlace(place);
    navigateToPlacePage(placeId);
  };

  const closePlacePage = () => {
    if (window.history.state?.myVillaverdePlaceEntry) {
      window.history.back();
      return;
    }
    window.history.replaceState({ ...window.history.state, myVillaverdeDirectPlace: false }, '', removePlacePageFromUrl());
    setPlacePageId(null);
  };

  const categoryPlacesInScope = selectedCategory
    ? places
      .filter((place) => placeMatchesGuideCategory(place, selectedCategory, activeBarangay.name))
      .sort((first, second) => first.name.localeCompare(second.name))
    : [];
  const normalizedCategorySearchQuery = categorySearchQuery.trim().toLowerCase();
  const filteredCategoryPlaces = normalizedCategorySearchQuery
    ? categoryPlacesInScope.filter((place) =>
      [place.name, place.subcategory, place.barangay]
        .some((value) => value.toLowerCase().includes(normalizedCategorySearchQuery)),
    )
    : categoryPlacesInScope;

  const handleModeChange = (nextMode: AppMode) => {
    if (nextMode === mode) return;

    setTransitionDirection(MODE_ORDER[nextMode] < MODE_ORDER[mode] ? 'left' : 'right');
    setActiveModal(null);
    setMode(nextMode);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleSelectBarangay = (barangayName: string) => {
    setSelectedBarangay(barangayName);
    try {
      localStorage.setItem(SELECTED_BARANGAY_STORAGE_KEY, barangayName);
    } catch (error) {
      console.error('Failed to save selectedBarangay to localStorage', error);
    }
    setActiveModal(null);
  };

  const handleToggleSavedPlace = (place: PlaceRecord) => {
    setSavedPlaces((current) => {
      const exists = current.some((savedPlace) => savedPlace.id === place.id);
      const next = exists
        ? current.filter((savedPlace) => savedPlace.id !== place.id)
        : [place, ...current];
      try {
        localStorage.setItem(SAVED_PLACES_STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save places to localStorage', error);
      }
      return next;
    });
  };

  const openCategory = (scope: CategoryScope, category: GuideCategory) => {
    setSelectedCategory({ scope, category });
    setActiveModal('category');
  };

  const openMap = (scope: CategoryScope, initialPanelView: MapPanelView = 'categories') => {
    setActiveModal(null);
    setMapInitialPanelView(initialPanelView);
    setMapScope(scope);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="min-h-[100dvh] bg-[#D7DED2] font-sans-body text-[#18241F] selection:bg-[#EED6A7] sm:py-6">

      <div className="relative mx-auto min-h-[100dvh] max-w-md overflow-hidden bg-[#EEF1E8] shadow-2xl sm:min-h-[880px] sm:rounded-[36px] sm:border-[8px] sm:border-[#9CAD9E]/25">
        {placePageId ? (
          <PlacePage
            place={placePage}
            requestedPlaceId={placePageId}
            dataState={placesDataState}
            loadMessage={placesLoadMessage}
            isSaved={Boolean(placePage && savedPlaces.some((savedPlace) => savedPlace.id === placePage.id))}
            userLocation={userLocation}
            places={places}
            onBack={closePlacePage}
            onOpenPlace={openPlacePage}
            onToggleSaved={handleToggleSavedPlace}
          />
        ) : mapScope ? (
          <MapScreen
            activeBarangay={activeBarangay}
            scope={mapScope}
            initialPanelView={mapInitialPanelView}
            places={places}
            placesDataState={placesDataState}
            placesLoadMessage={placesLoadMessage}
            isOnline={isOnline}
            savedPlaceIds={savedPlaces.map((place) => place.id)}
            userLocation={userLocation}
            onRefreshPlaces={refreshPlaces}
            onUserLocationChange={setUserLocation}
            onToggleSavedPlace={handleToggleSavedPlace}
            onOpenPlacePage={openPlacePage}
            onBack={() => setMapScope(null)}
          />
        ) : (
          <>
            <ModeHeader mode={mode} onModeChange={handleModeChange} />

            <div key={mode} className={`mode-page mode-page-${transitionDirection}`}>
              {mode === 'home' && <WelcomeLanding activeBarangay={activeBarangay} onSelectMode={handleModeChange} />}

              {mode === 'ko' && (
                <LocalDashboard
                  activeBarangay={activeBarangay}
                  recentlyViewedPlaces={recentlyViewedPlaces}
                  onOpenBarangay={() => setActiveModal('barangay')}
                  onOpenMap={() => openMap('local')}
                  onOpenModal={(modal) => modal === 'nearby' ? openMap('local', 'nearby') : setActiveModal(modal)}
                  onOpenCategory={(category) => openCategory('local', category)}
                  onOpenPlace={openRecentlyViewedPlace}
                />
              )}

              {mode === 'mo' && (
                <VisitorDashboard
                  onOpenMap={() => openMap('visitor')}
                  onOpenModal={(modal) => modal === 'nearby' ? openMap('visitor', 'nearby') : setActiveModal(modal)}
                  onOpenCategory={(category) => openCategory('visitor', category)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {activeModal === 'barangay' && (
        <BottomSheet title="Choose your barangay" subtitle="Every barangay has its own guide card and visual theme." onClose={() => setActiveModal(null)}>
          <div className="grid grid-cols-2 gap-3">
            {VILLAVERDE_BARANGAYS.map((barangay) => {
              const isSelected = barangay.name === selectedBarangay;
              return (
                <button
                  type="button"
                  key={barangay.id}
                  onClick={() => handleSelectBarangay(barangay.name)}
                  className={`relative h-[132px] touch-manipulation overflow-hidden rounded-[24px] p-3 text-left text-white shadow-sm transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/30 ${isSelected ? 'ring-[3px] ring-[#2B6A4E] ring-offset-2 ring-offset-[#FFFBF2]' : 'hover:-translate-y-0.5 hover:shadow-md'} focus-visible:ring-4 focus-visible:ring-white/60`}
                  style={{ backgroundImage: `linear-gradient(135deg, ${barangay.colors[0]} 0%, ${barangay.colors[1]} 54%, ${barangay.colors[2]} 100%)` }}
                  aria-label={`Select ${barangay.name}`}
                  aria-pressed={isSelected}
                >
                  <BarangayArtwork barangay={barangay} compact />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/5" />
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-white/15 backdrop-blur-sm">
                        <MapPin className="h-4 w-4" />
                      </span>
                      {isSelected && (
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FFFDF7] text-[#2B6A4E] shadow-md">
                          <Check className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                    <h3 className={`font-serif-header font-bold leading-[1.02] ${barangay.name.length > 16 ? 'text-[17px]' : 'text-[20px]'}`}>{barangay.name}</h3>
                  </div>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}


      {activeModal === 'saved' && (
        <BottomSheet title="Saved Places" subtitle="Places you bookmark stay on this device for quick access." onClose={() => setActiveModal(null)}>
          {savedPlaces.length === 0 ? (
            <EmptyState icon={Bookmark} title="Nothing saved yet" message="Save a place from its map preview and it will appear here." />
          ) : (
            <div className="space-y-2.5">
              {savedPlaces.map((place) => (
                <div key={place.id} className="flex items-center gap-2 rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] p-2.5 shadow-xs">
                  <button type="button" onClick={() => openPlacePage(place)} className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] p-1 text-left transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Open ${place.name} place page`}>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }}><MapPin className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-[#26372F]">{place.name}</span><span className="mt-0.5 block truncate text-xs font-medium text-[#748078]">{place.subcategory} · {place.barangay}{userLocation ? ` · ${formatDistance(getDistanceMeters(userLocation, place))}` : ''}</span></span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#748078]" />
                  </button>
                  <button type="button" onClick={() => handleToggleSavedPlace(place)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E7F0E8] text-[#2B6A4E] transition-all active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Remove ${place.name} from saved places`}><Bookmark className="h-4 w-4 fill-current" /></button>
                </div>
              ))}
            </div>
          )}
        </BottomSheet>
      )}

      {activeModal === 'nearby' && (
        <BottomSheet title="Nearby" subtitle={mode === 'mo' ? 'Find useful stops close to you.' : `Discover places near ${activeBarangay.name}.`} onClose={() => setActiveModal(null)}>
          <div className="rounded-[28px] border border-[#D9E0D8] bg-[#FFFDF7] p-7 text-center shadow-xs">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E7F0E8] text-[#2B6A4E]"><Navigation className="h-6 w-6" /></span>
            <h3 className="mt-4 font-serif-header text-xl font-bold text-[#18241F]">Nearby is ready on the map</h3>
            <p className="mx-auto mt-2 max-w-[290px] text-sm font-medium leading-6 text-[#748078]">Open the live map, then choose whether to share your location.</p>
            <button type="button" onClick={() => openMap(mode === 'mo' ? 'visitor' : 'local', 'nearby')} className="mt-5 rounded-full bg-[#26372F] px-5 py-3 text-sm font-extrabold text-white transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25">Open Nearby map</button>
          </div>
        </BottomSheet>
      )}

      {activeModal === 'category' && selectedCategory && (
        <BottomSheet
          title={selectedCategory.category.title}
          subtitle={selectedCategory.scope === 'local' ? `${activeBarangay.name} • VillaverdeKo` : 'VillaverdeMo visitor guide'}
          onClose={() => {
            setCategorySearchQuery('');
            setActiveModal(null);
          }}
        >
          <div className="relative mb-3">
            <label htmlFor="category-place-search" className="sr-only">Search {selectedCategory.category.title}</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748078]" aria-hidden="true" />
            <input
              id="category-place-search"
              type="search"
              value={categorySearchQuery}
              onChange={(event) => setCategorySearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && categorySearchQuery) {
                  event.preventDefault();
                  event.stopPropagation();
                  setCategorySearchQuery('');
                }
              }}
              placeholder="Search this category"
              autoComplete="off"
              enterKeyHint="search"
              className="h-12 w-full appearance-none rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] py-3 pl-11 pr-12 text-sm font-semibold text-[#26372F] shadow-xs outline-none transition focus:border-[#2B6A4E] focus:ring-4 focus:ring-[#2B6A4E]/15 placeholder:text-[#98A098]"
            />
            {categorySearchQuery && (
              <button
                type="button"
                onClick={() => setCategorySearchQuery('')}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#EEF1E8] text-[#627066] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                aria-label="Clear category search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {placesDataState !== 'live' && placesDataState !== 'loading' && (
            <div className="mb-3 flex items-start gap-2.5 rounded-[18px] border border-[#D9E0D8] bg-[#F3F5EF] px-3.5 py-3 text-xs font-medium leading-5 text-[#627066]" role="status">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6A2F]" aria-hidden="true" />
              <span>{placesDataState === 'offline' ? 'You are offline. Showing the last available place data.' : 'The live database could not be reached. Showing the built-in place snapshot.'}</span>
            </div>
          )}

          {placesDataState === 'loading' ? (
            <div className="rounded-[28px] border border-[#D9E0D8] bg-[#FFFDF7] p-7 text-center shadow-xs" role="status" aria-live="polite">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EEF1E8] text-[#405047]">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </span>
              <h3 className="mt-4 font-serif-header text-xl font-bold text-[#18241F]">Loading places</h3>
              <p className="mx-auto mt-2 max-w-[290px] text-sm font-medium leading-6 text-[#748078]">Checking the live Villaverde places database.</p>
            </div>
          ) : filteredCategoryPlaces.length > 0 ? (
            <div className="space-y-2.5" aria-live="polite">
              <p className="px-1 text-xs font-bold text-[#748078]">{filteredCategoryPlaces.length} place{filteredCategoryPlaces.length === 1 ? '' : 's'} found</p>
              {filteredCategoryPlaces.map((place) => (
                <article key={place.id} className="flex items-center gap-2 rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] p-2.5 shadow-xs">
                  <button type="button" onClick={() => openPlacePage(place)} className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] p-1 text-left transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Open ${place.name} place page`}>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }}>
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-[#26372F]">{place.name}</span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-[#748078]">{place.subcategory} · {place.barangay}{userLocation ? ` · ${formatDistance(getDistanceMeters(userLocation, place))}` : ''}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#748078]" />
                  </button>
                  <a
                    href={getDirectionsUrl(place)}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E7F0E8] text-[#2B6A4E] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                    aria-label={`Get directions to ${place.name}`}
                  >
                    <Navigation className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
          ) : normalizedCategorySearchQuery ? (
            <EmptyState icon={Search} title="No matching places" message="Try a different place name, subcategory, or barangay." />
          ) : (
            <EmptyState icon={selectedCategory.category.icon} title={selectedCategory.category.emptyTitle} message={selectedCategory.category.emptyMessage} />
          )}
        </BottomSheet>
      )}
    </div>
  );
}
