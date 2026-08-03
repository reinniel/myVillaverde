import type React from 'react';

export type AppMode = 'home' | 'ko' | 'mo';
export type TransitionDirection = 'left' | 'right' | 'neutral';
export type ModalId = 'barangay' | 'saved' | 'nearby' | 'category' | null;
export type CategoryScope = 'local' | 'visitor';
export type MapCategoryId = 'all' | 'food' | 'services' | 'transport' | 'visit' | 'government';
export type MapPanelView = 'categories' | 'layers' | 'nearby' | 'location';
export type MapSheetLevel = 0 | 1 | 2;

export interface Barangay {
  id: string;
  name: string;
  municipality: string;
  province: string;
  zipCode: string;
  coordinates: [number, number];
  colors: [string, string, string];
  artworkPath: string;
  orb: [number, number, number];
}

export interface GuideCategory {
  id: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyMessage: string;
  icon: React.ElementType;
  tone: string;
}

export interface RecentlyViewedPlace {
  id: string;
  name: string;
  categoryId: string;
  barangayName: string;
}

export interface SelectedCategory {
  scope: CategoryScope;
  category: GuideCategory;
}

export interface MapCategory {
  id: MapCategoryId;
  label: string;
  icon: React.ElementType;
}

export interface StoredMapView {
  center: [number, number];
  zoom: number;
}


export interface PlaceRecord {
  id: string;
  name: string;
  category: string;
  categoryId: Exclude<MapCategoryId, 'all'>;
  subcategory: string;
  barangay: string;
  latitude: number;
  longitude: number;
  address: string;
  openingHours: string;
  phone: string;
  website: string;
  description: string;
  verificationSource: string;
  sourceUrl: string;
  lastChecked: string;
  status: string;
  notes: string;
  coverPhotoUrl?: string;
  photoUrls?: string[];
  photoSource?: string;
  photoCredit?: string;
  photoPermission?: string;
}

export type PlacesDataState = 'loading' | 'live' | 'snapshot' | 'offline';
export type MapTileState = 'loading' | 'ready' | 'error';
export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  updatedAt: number;
}
