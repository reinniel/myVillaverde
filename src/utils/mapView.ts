import type { StoredMapView } from '../types/app';

export const MAP_VIEW_STORAGE_KEY = 'myVillaverde_mapView_v1';
export const VILLAVERDE_CENTER: [number, number] = [16.60510, 121.18360];
export const LOCAL_DEFAULT_ZOOM = 15;
export const VISITOR_DEFAULT_ZOOM = 13;

export const readStoredMapView = (viewKey: string): StoredMapView | null => {
  try {
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const value = (parsed as Record<string, unknown>)[viewKey];
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<StoredMapView>;
    if (!Array.isArray(candidate.center) || candidate.center.length !== 2) return null;
    const [lat, lng] = candidate.center;
    if (typeof lat !== 'number' || typeof lng !== 'number' || typeof candidate.zoom !== 'number') return null;
    return { center: [lat, lng], zoom: candidate.zoom };
  } catch (error) {
    console.error('Failed to read saved map view', error);
    return null;
  }
};

export const saveStoredMapView = (viewKey: string, view: StoredMapView) => {
  try {
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const allViews = parsed && typeof parsed === 'object' ? parsed as Record<string, StoredMapView> : {};
    allViews[viewKey] = view;
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify(allViews));
  } catch (error) {
    console.error('Failed to save map view', error);
  }
};
