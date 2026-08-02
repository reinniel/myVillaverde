import React, { useEffect } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useMapEvents } from 'react-leaflet';
import type { StoredMapView } from '../types/app';
import { saveStoredMapView } from '../utils/mapView';

export interface MapViewPersistenceProps {
  viewKey: string;
  onZoomChange: (zoom: number) => void;
  onMapClick?: () => void;
}

export const MapViewPersistence: React.FC<MapViewPersistenceProps> = ({ viewKey, onZoomChange, onMapClick }) => {
  const persistView = (map: LeafletMap) => {
    const center = map.getCenter();
    saveStoredMapView(viewKey, { center: [center.lat, center.lng], zoom: map.getZoom() });
  };

  const map = useMapEvents({
    click: () => onMapClick?.(),
    moveend: () => persistView(map),
    zoomend: () => {
      persistView(map);
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
};
