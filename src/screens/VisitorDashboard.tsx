import React, { useMemo } from 'react';
import {
  ArrowRight, Compass, Heart, LocateFixed, Map, MapPin, RefreshCw, Route, Sparkles,
  Store, Utensils, Mountain, Building2, WifiOff,
} from 'lucide-react';
import type {
  DashboardModalId, GuideCategory, PlaceRecord, PlacesDataState,
} from '../types/app';
import { VISITOR_CATEGORIES, CATEGORY_MARKER_COLORS } from '../data/categories';
import { CategoryList } from '../components/CategoryList';
import { BarangayDiscoverySection } from '../components/BarangayDiscoverySection';
import { EmptyState } from '../components/EmptyState';

export interface VisitorDashboardProps {
  places: PlaceRecord[];
  dataState: PlacesDataState;
  isOnline: boolean;
  onOpenMap: () => void;
  onOpenModal: (modal: DashboardModalId) => void;
  onOpenCategory: (category: GuideCategory) => void;
  onOpenPlace: (place: PlaceRecord) => void;
  onOpenBarangay: (barangayId: string) => void;
}

interface DiscoverySection {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  placeFilter: (place: PlaceRecord) => boolean;
  categoryId: GuideCategory['id'];
  tone: string;
}

const DISCOVERY_SECTIONS: DiscoverySection[] = [
  {
    id: 'food',
    title: 'Food to try',
    eyebrow: 'Eat local',
    description: 'Cafés, bakeries, meals, and roadside food stops from the live guide.',
    icon: Utensils,
    placeFilter: (place) => place.categoryId === 'food',
    categoryId: 'local-eats',
    tone: 'from-[#A45118] to-[#D08A45]',
  },
  {
    id: 'visit',
    title: 'Places worth a stop',
    eyebrow: 'See Villaverde',
    description: 'Nature spots, viewpoints, landmarks, and places listed for visitors.',
    icon: Mountain,
    placeFilter: (place) => place.categoryId === 'visit',
    categoryId: 'must-see',
    tone: 'from-[#326B3D] to-[#6F9658]',
  },
  {
    id: 'finds',
    title: 'Local finds',
    eyebrow: 'Small discoveries',
    description: 'Shops, products, and useful local businesses you can actually open in the guide.',
    icon: Store,
    placeFilter: (place) => place.categoryId === 'services',
    categoryId: 'local-finds',
    tone: 'from-[#6E4F73] to-[#A6748C]',
  },
  {
    id: 'practical',
    title: 'Practical stops',
    eyebrow: 'Good to know',
    description: 'Public services and everyday stops that may help during a visit.',
    icon: Building2,
    placeFilter: (place) => place.categoryId === 'government',
    categoryId: 'must-see',
    tone: 'from-[#2B6A4E] to-[#5E8D73]',
  },
];

const getVisitorCategory = (id: GuideCategory['id']) =>
  VISITOR_CATEGORIES.find((category) => category.id === id);

export const VisitorDashboard: React.FC<VisitorDashboardProps> = ({
  places,
  dataState,
  isOnline,
  onOpenMap,
  onOpenModal,
  onOpenCategory,
  onOpenPlace,
  onOpenBarangay,
}) => {
  const handleVisitorCategory = (category: GuideCategory) => {
    if (category.id === 'getting-around') {
      onOpenMap();
      return;
    }
    onOpenCategory(category);
  };

  const discoverySections = useMemo(
    () => DISCOVERY_SECTIONS.map((section) => ({
      ...section,
      places: places
        .filter(section.placeFilter)
        .sort((first, second) => first.name.localeCompare(second.name))
        .slice(0, 4),
    })),
    [places],
  );

  const availablePlaceCount = places.length;
  const isLoading = dataState === 'loading' && availablePlaceCount === 0;
  const isUnavailable = dataState !== 'loading' && availablePlaceCount === 0;

  return (
    <main className="space-y-5 px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-3">
      <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#263B34_0%,#6A5268_54%,#B96C50_100%)] p-5 text-white shadow-[0_12px_32px_rgba(96,72,78,0.24)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 400 230"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <circle cx="342" cy="20" r="66" fill="rgba(255,255,255,.10)" />
          <path
            d="M-25 188 C56 104 124 58 206 106 C286 152 332 116 430 40"
            fill="none"
            stroke="rgba(255,255,255,.18)"
            strokeWidth="34"
            strokeLinecap="round"
          />
          <path
            d="M-20 216 C80 132 160 112 236 146 C312 180 356 142 430 104"
            fill="none"
            stroke="rgba(255,255,255,.08)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md">
              <Compass className="h-4 w-4" aria-hidden="true" />
              VillaverdeMo
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-9 max-w-[320px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
              Visitor discovery guide
            </p>
            <h1 className="mt-2 font-serif-header text-[32px] font-bold leading-[1.02]">
              Find a real place for your next stop.
            </h1>
            <p className="mt-3 text-sm font-medium leading-5 text-white/80">
              Browse Villaverde using the same live place listings, map, directions, and saved collections.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenMap}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-extrabold text-[#443C45] shadow-sm transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <Map className="h-4 w-4" aria-hidden="true" />
              Explore the map
            </button>
            <button
              type="button"
              onClick={() => onOpenModal('nearby')}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 text-xs font-extrabold text-white backdrop-blur-md transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              Near me
            </button>
          </div>
        </div>
      </section>

      {!isOnline && (
        <div
          className="flex items-start gap-3 rounded-[22px] border border-[#E8D6AF] bg-[#FFF8E8] p-4"
          role="status"
        >
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-[#8A581F]" aria-hidden="true" />
          <div>
            <p className="text-sm font-extrabold text-[#6F451C]">You are offline</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#7A644C]">
              Cached places can still open, but live updates may be unavailable.
            </p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-2.5" aria-label="Visitor shortcuts">
        <button
          type="button"
          onClick={onOpenMap}
          className="rounded-[22px] border border-[#D7DED4] bg-[#FFFDF7] p-3 text-left shadow-xs transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#76527D]/20"
        >
          <Map className="h-5 w-5 text-[#76527D]" aria-hidden="true" />
          <span className="mt-3 block text-xs font-extrabold text-[#26372F]">Map</span>
          <span className="mt-1 block text-[10px] font-medium leading-4 text-[#748078]">
            See all listings
          </span>
        </button>
        <button
          type="button"
          onClick={() => onOpenModal('trip')}
          className="rounded-[22px] border border-[#D7DED4] bg-[#FFFDF7] p-3 text-left shadow-xs transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#B5753D]/20"
        >
          <Route className="h-5 w-5 text-[#B5753D]" aria-hidden="true" />
          <span className="mt-3 block text-xs font-extrabold text-[#26372F]">Plan</span>
          <span className="mt-1 block text-[10px] font-medium leading-4 text-[#748078]">
            Build a route
          </span>
        </button>
        <button
          type="button"
          onClick={() => onOpenModal('saved')}
          className="rounded-[22px] border border-[#D7DED4] bg-[#FFFDF7] p-3 text-left shadow-xs transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#A95E4B]/20"
        >
          <Heart className="h-5 w-5 text-[#A95E4B]" aria-hidden="true" />
          <span className="mt-3 block text-xs font-extrabold text-[#26372F]">Saved</span>
          <span className="mt-1 block text-[10px] font-medium leading-4 text-[#748078]">
            Keep trip ideas
          </span>
        </button>
        <button
          type="button"
          onClick={() => onOpenModal('nearby')}
          className="rounded-[22px] border border-[#D7DED4] bg-[#FFFDF7] p-3 text-left shadow-xs transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
        >
          <LocateFixed className="h-5 w-5 text-[#2D6C55]" aria-hidden="true" />
          <span className="mt-3 block text-xs font-extrabold text-[#26372F]">Nearby</span>
          <span className="mt-1 block text-[10px] font-medium leading-4 text-[#748078]">
            Use your location
          </span>
        </button>
      </section>

      <BarangayDiscoverySection places={places} dataState={dataState} onOpenBarangay={onOpenBarangay} />

      <CategoryList
        title="Browse by visitor need"
        categories={VISITOR_CATEGORIES}
        onOpenCategory={handleVisitorCategory}
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-[24px] border border-[#D7DED4] bg-[#FFFDF7] p-6 text-[#526158]" role="status">
          <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-extrabold">Loading visitor places…</span>
        </div>
      ) : isUnavailable ? (
        <EmptyState
          icon={MapPin}
          title="Visitor places are unavailable"
          message="The live place guide could not be loaded. Try the map again when the database is available."
        />
      ) : (
        <div className="space-y-5">
          {discoverySections.map((section) => {
            const Icon = section.icon;
            const category = getVisitorCategory(section.categoryId);

            if (section.places.length === 0) return null;

            return (
              <section key={section.id} className="space-y-3" aria-labelledby={`visitor-${section.id}`}>
                <div className="flex items-end justify-between gap-3 px-1">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8B6E74]">
                      {section.eyebrow}
                    </p>
                    <h2
                      id={`visitor-${section.id}`}
                      className="mt-1 font-serif-header text-[22px] font-bold text-[#26372F]"
                    >
                      {section.title}
                    </h2>
                  </div>
                  {category && (
                    <button
                      type="button"
                      onClick={() => handleVisitorCategory(category)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-[10px] font-extrabold text-[#76527D] transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#76527D]/20"
                    >
                      See all
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <p className="px-1 text-xs font-medium leading-5 text-[#748078]">
                  {section.description}
                </p>

                <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {section.places.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => onOpenPlace(place)}
                      className="w-[230px] shrink-0 snap-start overflow-hidden rounded-[24px] border border-[#D7DED4] bg-[#FFFDF7] text-left shadow-xs transition active:scale-[0.985] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#76527D]/20"
                      aria-label={`Open ${place.name}`}
                    >
                      <span className={`relative block h-24 bg-gradient-to-br ${section.tone}`}>
                        <span className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,.28),transparent_34%)]" />
                        <span className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-2xl border border-white/20 bg-white/15 text-white backdrop-blur-sm">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="absolute bottom-3 right-3 rounded-full bg-black/20 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                          {place.barangay}
                        </span>
                      </span>
                      <span className="block p-4">
                        <span className="block truncate text-sm font-extrabold text-[#26372F]">
                          {place.name}
                        </span>
                        <span className="mt-1 block truncate text-xs font-medium text-[#748078]">
                          {place.subcategory}
                        </span>
                        <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#76527D]">
                          Open place
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <section className="rounded-[28px] border border-[#D5DDD4] bg-[#E7ECE5] p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#263B34] text-white">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif-header text-[20px] font-bold text-[#26372F]">
              Listings, not made-up rankings
            </h2>
            <p className="mt-2 text-xs font-medium leading-5 text-[#66736B]">
              VillaverdeMo only shows places available in the shared guide. It does not invent ratings,
              popularity, or visitor claims that the database does not support.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
