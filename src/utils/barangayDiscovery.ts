import type { MapCategoryId, PlaceRecord } from '../types/app';

export const BARANGAY_CATEGORY_LABELS: Record<Exclude<MapCategoryId, 'all'>, string> = {
  food: 'Food & drinks',
  services: 'Shops & services',
  transport: 'Transport',
  visit: 'Places to visit',
  government: 'Public services',
};

export const BARANGAY_CATEGORY_ORDER: Exclude<MapCategoryId, 'all'>[] = [
  'food',
  'services',
  'transport',
  'visit',
  'government',
];

export const getBarangayPlaces = (places: PlaceRecord[], barangayName: string) =>
  places
    .filter((place) => place.barangay === barangayName)
    .sort((first, second) => first.name.localeCompare(second.name));

export const getBarangayCategoryLabels = (places: PlaceRecord[]) =>
  BARANGAY_CATEGORY_ORDER
    .filter((categoryId) => places.some((place) => place.categoryId === categoryId))
    .map((categoryId) => BARANGAY_CATEGORY_LABELS[categoryId]);
