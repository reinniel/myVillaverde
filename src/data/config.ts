export const RECENTLY_VIEWED_STORAGE_KEY = 'myVillaverde_recentlyViewedPlaces';
export const SAVED_PLACES_STORAGE_KEY = 'myVillaverde_savedPlaces_v1';
export const SELECTED_BARANGAY_STORAGE_KEY = 'myVillaverde_selectedBarangay_v2';
export const TRIP_PLAN_STORAGE_KEY = 'myVillaverde_tripPlan_v1';

export const DEFAULT_PLACES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQtimcVMQ-i5Td4gii1srAgWqnvRGnQumW3Av0lQhAqXJAPdtvhkNlW1O3lYtaeJ1wwojBrldMskl_L/pub?gid=527818954&single=true&output=csv';
export const PLACES_CSV_URL = (() => {
  try {
    const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return (viteEnv?.VITE_PLACES_CSV_URL || DEFAULT_PLACES_CSV_URL).trim();
  } catch {
    return DEFAULT_PLACES_CSV_URL;
  }
})();
