import React from 'react';
import { ArrowRightLeft, Bookmark, ChevronRight, LocateFixed, Map as MapIcon, MapPin, Navigation } from 'lucide-react';
import type { Barangay, DashboardModalId, GuideCategory, RecentlyViewedPlace } from '../types/app';
import { LOCAL_CATEGORIES } from '../data/categories';
import { CategoryList } from '../components/CategoryList';
import { BarangayArtwork } from '../components/BarangayArtwork';
import { QuickAction } from '../components/QuickAction';

export interface LocalDashboardProps {
  activeBarangay: Barangay;
  recentlyViewedPlaces: RecentlyViewedPlace[];
  onOpenBarangay: () => void;
  onOpenMap: () => void;
  onOpenModal: (modal: DashboardModalId) => void;
  onOpenCategory: (category: GuideCategory) => void;
  onOpenPlace: (placeId: string) => void;
}

export const LocalDashboard: React.FC<LocalDashboardProps> = ({
  activeBarangay,
  recentlyViewedPlaces,
  onOpenBarangay,
  onOpenMap,
  onOpenModal,
  onOpenCategory,
  onOpenPlace,
}) => (
  <main className="space-y-4 px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-3">
    <section>
      <button
        type="button"
        onClick={onOpenBarangay}
        key={activeBarangay.id}
        className="barangay-theme-swap group relative w-full overflow-hidden rounded-[28px] text-left text-white shadow-[0_8px_22px_rgba(70,45,120,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(70,45,120,0.30)] active:translate-y-0 active:scale-[0.985] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/30"
        style={{
          backgroundImage: `linear-gradient(135deg, ${activeBarangay.colors[0]} 0%, ${activeBarangay.colors[1]} 52%, ${activeBarangay.colors[2]} 100%)`,
        }}
        aria-label={`Current barangay is ${activeBarangay.name}. Tap to change barangay.`}
      >
        <BarangayArtwork barangay={activeBarangay} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/5" />

        <div className="relative z-10 flex min-h-[176px] flex-col justify-between p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.15] px-3 py-2 backdrop-blur-md">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.18]">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/90">
                Current barangay
              </span>
            </div>

            <span className="rounded-full border border-white/20 bg-white/[0.15] px-3 py-1.5 text-xs font-extrabold tracking-wider backdrop-blur-md">
              {activeBarangay.zipCode}
            </span>
          </div>

          <div className="mt-7">
            <h2 className={`font-serif-header font-bold leading-[0.98] tracking-tight text-white drop-shadow-sm ${activeBarangay.name.length > 16 ? 'text-[27px]' : 'text-[31px]'}`}>
              {activeBarangay.name}
            </h2>

            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="min-w-0 text-xs font-semibold text-white/80">
                {activeBarangay.municipality}, {activeBarangay.province}
              </p>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-[#28553F] shadow-sm transition-transform group-hover:translate-x-0.5">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Change
              </span>
            </div>
          </div>
        </div>
      </button>
    </section>

    <section className="py-1">
      <div className="grid grid-cols-3 gap-3 text-center">
        <QuickAction label="Explore Map" icon={MapIcon} color={activeBarangay.colors[0]} onClick={onOpenMap} />
        <QuickAction label="Saved Places" icon={Bookmark} color={activeBarangay.colors[1]} onClick={() => onOpenModal('saved')} />
        <QuickAction label="Nearby" icon={Navigation} color={activeBarangay.colors[2]} onClick={() => onOpenModal('nearby')} />
      </div>
    </section>

    <CategoryList title="Explore Villaverde" categories={LOCAL_CATEGORIES} onOpenCategory={onOpenCategory} />

    {recentlyViewedPlaces.length > 0 && (
      <section className="pt-2">
        <div className="mb-2 px-1">
          <h3 className="font-serif-header text-[21px] font-bold text-[#18241F]">Recently viewed</h3>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-[#D9E0D8] bg-[#FFFDF7] px-4 shadow-xs">
          {recentlyViewedPlaces.map((place, index) => {
            const category = LOCAL_CATEGORIES.find((item) => item.id === place.categoryId) ?? LOCAL_CATEGORIES[0];
            const Icon = category.icon;
            return (
              <React.Fragment key={place.id}>
                {index > 0 && <div className="border-t border-[#E2E6DF]" />}
                <button type="button" onClick={() => onOpenPlace(place.id)} aria-label={`Open ${place.name}`} className="group -mx-4 flex w-[calc(100%+2rem)] items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F6F3E9]/90 active:bg-[#F0EEE5] focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#2B6A4E]/20">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${category.tone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#18241F]">{place.name}</p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-[#748078]">{category.title} • {place.barangayName}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#748078] transition-transform group-hover:translate-x-0.5" />
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </section>
    )}
  </main>
);
