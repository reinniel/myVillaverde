import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { VILLAVERDE_BARANGAYS } from '../data/barangays';
import type { MapCategoryId, PlaceRecord, PlacesDataState } from '../types/app';
import { BarangayArtwork } from './BarangayArtwork';

interface BarangayDiscoverySectionProps {
  places: PlaceRecord[];
  dataState: PlacesDataState;
}

const CATEGORY_LABELS: Record<Exclude<MapCategoryId, 'all'>, string> = {
  food: 'Food & drinks',
  services: 'Shops & services',
  transport: 'Transport',
  visit: 'Places to visit',
  government: 'Public services',
};

const CATEGORY_ORDER: Exclude<MapCategoryId, 'all'>[] = [
  'food',
  'services',
  'transport',
  'visit',
  'government',
];

export const BarangayDiscoverySection: React.FC<BarangayDiscoverySectionProps> = ({
  places,
  dataState,
}) => {
  const barangayCards = useMemo(
    () => VILLAVERDE_BARANGAYS.map((barangay) => {
      const barangayPlaces = places
        .filter((place) => place.barangay === barangay.name)
        .sort((first, second) => first.name.localeCompare(second.name));
      const representedCategories = CATEGORY_ORDER
        .filter((categoryId) => barangayPlaces.some((place) => place.categoryId === categoryId))
        .map((categoryId) => CATEGORY_LABELS[categoryId]);

      return {
        barangay,
        places: barangayPlaces,
        representedCategories,
      };
    }),
    [places],
  );

  const isLoading = dataState === 'loading' && places.length === 0;
  const isUnavailable = dataState !== 'loading' && places.length === 0;

  return (
    <section className="space-y-3" aria-labelledby="visitor-barangays-title">
      <div className="px-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8B6E74]">
          Across Villaverde
        </p>
        <h2
          id="visitor-barangays-title"
          className="mt-1 font-serif-header text-[22px] font-bold text-[#26372F]"
        >
          Explore by barangay
        </h2>
        <p className="mt-2 text-xs font-medium leading-5 text-[#748078]">
          See the listings currently available in the shared guide, barangay by barangay.
        </p>
      </div>

      {isLoading ? (
        <div className="-mx-4 flex gap-3 overflow-hidden px-4" role="status" aria-label="Loading barangay listings">
          <span className="sr-only">Loading barangay listings…</span>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-[286px] w-[272px] shrink-0 rounded-[26px] border border-[#D7DED4] bg-[#FFFDF7] p-4 shadow-xs motion-safe:animate-pulse"
            >
              <div className="h-[116px] rounded-[20px] bg-[#E3E8E0]" />
              <div className="mt-4 h-3 w-28 rounded-full bg-[#E3E8E0]" />
              <div className="mt-3 h-3 w-44 rounded-full bg-[#E9EDE6]" />
              <div className="mt-8 h-3 w-36 rounded-full bg-[#E3E8E0]" />
              <div className="mt-3 h-3 w-24 rounded-full bg-[#E9EDE6]" />
            </div>
          ))}
        </div>
      ) : isUnavailable ? (
        <div className="flex items-start gap-3 rounded-[24px] border border-[#D7DED4] bg-[#FFFDF7] p-5" role="status">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#E7ECE5] text-[#526158]">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-[#26372F]">Barangay listings are unavailable</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#748078]">
              Try again when the shared place guide is available.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-label="Villaverde barangay listings"
        >
          {barangayCards.map(({ barangay, places: barangayPlaces, representedCategories }) => {
            const visiblePlaces = barangayPlaces.slice(0, 3);
            const remainingPlaceCount = barangayPlaces.length - visiblePlaces.length;
            const listingLabel = `${barangayPlaces.length} ${barangayPlaces.length === 1 ? 'listing' : 'listings'}`;

            return (
              <article
                key={barangay.id}
                aria-labelledby={`visitor-barangay-${barangay.id}`}
                className="w-[272px] shrink-0 snap-start overflow-hidden rounded-[26px] border border-[#D7DED4] bg-[#FFFDF7] shadow-xs"
              >
                <div
                  className="relative h-[126px] overflow-hidden p-4 text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${barangay.colors[0]} 0%, ${barangay.colors[1]} 54%, ${barangay.colors[2]} 100%)`,
                  }}
                >
                  <BarangayArtwork barangay={barangay} compact />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-white/5" />
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <span className="w-fit rounded-full border border-white/25 bg-black/15 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                      {listingLabel}
                    </span>
                    <h3
                      id={`visitor-barangay-${barangay.id}`}
                      className={`font-serif-header font-bold leading-[1.02] text-white drop-shadow-sm ${barangay.name.length > 16 ? 'text-[21px]' : 'text-[24px]'}`}
                    >
                      {barangay.name}
                    </h3>
                  </div>
                </div>

                <div className="min-h-[194px] p-4">
                  {barangayPlaces.length === 0 ? (
                    <div className="flex min-h-[150px] flex-col justify-center">
                      <p className="text-sm font-extrabold text-[#26372F]">No places listed yet</p>
                      <p className="mt-2 text-xs font-medium leading-5 text-[#748078]">
                        The shared guide does not currently have a listing for this barangay.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5" aria-label={`Categories represented in ${barangay.name}`}>
                        {representedCategories.map((category) => (
                          <span
                            key={category}
                            className="rounded-full bg-[#E7ECE5] px-2.5 py-1 text-[9px] font-extrabold text-[#526158]"
                          >
                            {category}
                          </span>
                        ))}
                      </div>

                      <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8A948C]">
                        Listed in the guide
                      </p>
                      <ul className="mt-2 space-y-2">
                        {visiblePlaces.map((place) => (
                          <li key={place.id} className="flex items-start gap-2 text-xs font-bold leading-4 text-[#35463E]">
                            <span
                              className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: barangay.colors[0] }}
                              aria-hidden="true"
                            />
                            <span className="line-clamp-1">{place.name}</span>
                          </li>
                        ))}
                      </ul>
                      {remainingPlaceCount > 0 && (
                        <p className="mt-3 text-[10px] font-extrabold text-[#76527D]">
                          +{remainingPlaceCount} more {remainingPlaceCount === 1 ? 'listing' : 'listings'}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
