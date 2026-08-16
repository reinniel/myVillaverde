import React, { useEffect, useId, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Bookmark, Check, ChevronRight, Clock3, Database, Globe2, Layers3,
  LocateFixed, Map as MapIcon, MapPin, Minus, Navigation, Phone, Plus, RefreshCw, Search,
  ShieldCheck, X,
} from 'lucide-react';
import type {
  Barangay, CategoryScope, LocationStatus, MapCategoryId, MapPanelView, MapSheetLevel,
  MapTileState, PlaceRecord, PlacesDataState, StoredMapView, UserLocation,
} from '../types/app';
import { CATEGORY_MARKER_COLORS, MAP_CATEGORIES } from '../data/categories';
import { VILLAVERDE_BARANGAYS } from '../data/barangays';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { MapViewPersistence } from '../components/MapViewPersistence';
import { EmptyState } from '../components/EmptyState';
import {
  LOCAL_DEFAULT_ZOOM, VISITOR_DEFAULT_ZOOM, VILLAVERDE_CENTER, readStoredMapView,
} from '../utils/mapView';
import { formatDistance, getDistanceMeters, getOpeningHoursSummary } from '../utils/places';

export interface MapScreenProps {
  activeBarangay: Barangay;
  scope: CategoryScope;
  initialPanelView: MapPanelView;
  initialBarangayId?: string | null;
  initialSelectedPlaceId?: string | null;
  places: PlaceRecord[];
  placesDataState: PlacesDataState;
  placesLoadMessage: string;
  isOnline: boolean;
  savedPlaceIds: string[];
  userLocation: UserLocation | null;
  onRefreshPlaces: () => void;
  onUserLocationChange: (location: UserLocation) => void;
  onToggleSavedPlace: (place: PlaceRecord) => void;
  onOpenPlacePage: (place: PlaceRecord) => void;
  onBack: () => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  activeBarangay,
  scope,
  initialPanelView,
  initialBarangayId = null,
  initialSelectedPlaceId = null,
  places,
  placesDataState,
  placesLoadMessage,
  isOnline,
  savedPlaceIds,
  userLocation,
  onRefreshPlaces,
  onUserLocationChange,
  onToggleSavedPlace,
  onOpenPlacePage,
  onBack,
}) => {
  const initialVisitorBarangay = scope === 'visitor'
    ? VILLAVERDE_BARANGAYS.find((barangay) => barangay.id === initialBarangayId) ?? null
    : null;
  const isFocusedVisitorMap = Boolean(initialVisitorBarangay);
  const viewKey = scope === 'local' ? `local:${activeBarangay.id}` : 'visitor';
  const defaultCenter = scope === 'local'
    ? activeBarangay.coordinates
    : initialVisitorBarangay?.coordinates ?? VILLAVERDE_CENTER;
  const defaultZoom = scope === 'local'
    ? LOCAL_DEFAULT_ZOOM
    : initialVisitorBarangay ? 16 : VISITOR_DEFAULT_ZOOM;
  const initialViewRef = useRef<StoredMapView>(initialVisitorBarangay
    ? { center: initialVisitorBarangay.coordinates, zoom: 16 }
    : readStoredMapView(viewKey) ?? { center: defaultCenter, zoom: defaultZoom });
  const mapRef = useRef<LeafletMap | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const mapPanelTitleId = useId();
  const mapPanelContentId = useId();

  const [selectedCategory, setSelectedCategory] = useState<MapCategoryId>('all');
  const [panelView, setPanelView] = useState<MapPanelView>(initialPanelView);
  const [sheetLevel, setSheetLevel] = useState<MapSheetLevel>(1);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visitorBarangayScopeId, setVisitorBarangayScopeId] = useState<string | null>(initialVisitorBarangay?.id ?? null);
  const [selectedBarangayId, setSelectedBarangayId] = useState<string | null>(
    scope === 'local' ? activeBarangay.id : initialVisitorBarangay?.id ?? null,
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialSelectedPlaceId);
  const [mapZoom, setMapZoom] = useState(initialViewRef.current.zoom);
  const [viewportHeight, setViewportHeight] = useState(() => typeof window === 'undefined' ? 800 : Math.round(window.visualViewport?.height ?? window.innerHeight));
  const [mapTileState, setMapTileState] = useState<MapTileState>('loading');
  const [mapTileReloadVersion, setMapTileReloadVersion] = useState(0);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(userLocation ? 'granted' : 'idle');
  const [locationMessage, setLocationMessage] = useState(userLocation ? 'Your location is active.' : 'Location is off until you choose to use it.');
  const dragStateRef = useRef<{ pointerId: number; startY: number } | null>(null);
  const locationWatchIdRef = useRef<number | null>(null);
  const latestLocationRef = useRef<UserLocation | null>(userLocation);
  const visitorBarangayScope = VILLAVERDE_BARANGAYS.find((barangay) => barangay.id === visitorBarangayScopeId) ?? null;
  const mapAccent = scope === 'local'
    ? activeBarangay.colors[0]
    : visitorBarangayScope?.colors[0] ?? '#76527D';
  const mapAccentSoft = `${mapAccent}18`;

  useEffect(() => {
    latestLocationRef.current = userLocation;
  }, [userLocation]);

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(Math.round(window.visualViewport?.height ?? window.innerHeight));
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.visualViewport?.addEventListener('resize', updateViewportHeight);
    window.visualViewport?.addEventListener('scroll', updateViewportHeight);
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('scroll', updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => mapRef.current?.invalidateSize({ animate: false }), 80);
    return () => window.clearTimeout(timeoutId);
  }, [viewportHeight]);

  useEffect(() => {
    if (!isOnline) {
      setMapTileState('error');
      return;
    }

    setMapTileState('loading');
    setMapTileReloadVersion((version) => version + 1);
  }, [isOnline]);

  useEffect(() => () => {
    if (locationWatchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (selectedPlaceId) {
        setSelectedPlaceId(null);
        setSheetLevel(1);
        setDragOffset(0);
        return;
      }
      if (searchQuery) {
        setSearchQuery('');
        return;
      }
      if (panelView !== 'categories') {
        setPanelView('categories');
        setSheetLevel(1);
        return;
      }
      if (sheetLevel > 0) {
        setSheetLevel(0);
        return;
      }
      onBack();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [onBack, panelView, searchQuery, selectedPlaceId, sheetLevel]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const scopePlaces = places
    .filter((place) => scope === 'visitor'
      ? !visitorBarangayScope || place.barangay === visitorBarangayScope.name
      : place.barangay === activeBarangay.name)
    .sort((a, b) => a.name.localeCompare(b.name));
  const villaverdePlaces = [...places].sort((a, b) => a.name.localeCompare(b.name));
  const activePanelPlaces = panelView === 'nearby' ? villaverdePlaces : scopePlaces;
  const distanceByPlaceId = new Map(villaverdePlaces.map((place) => [
    place.id,
    userLocation ? getDistanceMeters(userLocation, place) : null,
  ]));
  const filteredPlaces = activePanelPlaces
    .filter((place) => selectedCategory === 'all' || place.categoryId === selectedCategory)
    .sort((a, b) => {
      if (panelView === 'nearby' && userLocation) {
        return (distanceByPlaceId.get(a.id) ?? Number.POSITIVE_INFINITY)
          - (distanceByPlaceId.get(b.id) ?? Number.POSITIVE_INFINITY);
      }
      return a.name.localeCompare(b.name);
    });
  const searchPlaceResults = normalizedSearch
    ? scopePlaces.filter((place) => [place.name, place.subcategory, place.category, place.barangay, place.address]
      .some((value) => value.toLowerCase().includes(normalizedSearch)))
    : [];
  const searchBarangayResults = normalizedSearch
    ? VILLAVERDE_BARANGAYS.filter((barangay) => barangay.name.toLowerCase().includes(normalizedSearch))
    : [];
  const visibleBarangayMarkers = panelView !== 'nearby' && (scope === 'local' || isFocusedVisitorMap)
    ? VILLAVERDE_BARANGAYS.filter((barangay) => barangay.id === (scope === 'local' ? activeBarangay.id : visitorBarangayScope?.id))
    : VILLAVERDE_BARANGAYS;
  const selectedBarangayMarker = VILLAVERDE_BARANGAYS.find((barangay) => barangay.id === selectedBarangayId)
    ?? (isFocusedVisitorMap ? visitorBarangayScope : null);
  const selectedPlace = places.find((place) => place.id === selectedPlaceId) ?? null;
  const selectedPlaceDistance = selectedPlace && userLocation ? getDistanceMeters(userLocation, selectedPlace) : null;
  const isSelectedPlaceSaved = selectedPlace ? savedPlaceIds.includes(selectedPlace.id) : false;
  const selectedCategoryData = MAP_CATEGORIES.find((category) => category.id === selectedCategory)!;

  // Three stable detents, inspired by Apple Maps' mechanism but retaining
  // myVillaverde's own visual design. The sheet changes its actual height instead
  // of translating one oversized panel off-screen, which keeps every state fully
  // visible and makes scrolling reliable.
  const mapViewportHeight = Math.min(viewportHeight, 864);
  const compactSheetHeight = 78;
  const previewSheetHeight = Math.min(540, Math.max(360, Math.round(mapViewportHeight * 0.54)));
  const fullSheetHeight = Math.max(previewSheetHeight, mapViewportHeight - 12);
  const sheetDetentHeights: Record<MapSheetLevel, number> = {
    0: compactSheetHeight,
    1: previewSheetHeight,
    2: fullSheetHeight,
  };
  const baseSheetHeight = sheetDetentHeights[sheetLevel];
  const renderedSheetHeight = Math.max(78, Math.min(fullSheetHeight, baseSheetHeight - dragOffset));
  const availableMapControlSpace = Math.max(0, viewportHeight - renderedSheetHeight - 170);
  const showMapControls = sheetLevel !== 2 && availableMapControlSpace >= 54;
  const showZoomControls = sheetLevel === 0 && availableMapControlSpace >= 330;
  const showRecenterControl = availableMapControlSpace >= 54;
  const showLocationControl = availableMapControlSpace >= 108;
  const showNearbyControl = availableMapControlSpace >= 162;
  const showLayersControl = availableMapControlSpace >= 216;
  const placesStatusLabel = placesDataState === 'live'
    ? 'Live'
    : placesDataState === 'loading'
      ? 'Loading'
      : placesDataState === 'offline'
        ? 'Offline'
        : 'Snapshot';
  const nearbyLocationBlocked = locationStatus === 'denied' || locationStatus === 'unavailable' || locationStatus === 'error';
  const nearbyIsInitialLoading = placesDataState === 'loading' && villaverdePlaces.length === 0;
  const nearbyUsesFallbackData = placesDataState === 'offline' || placesDataState === 'snapshot';
  const panelTitle = panelView === 'layers'
    ? 'Map layers'
    : panelView === 'nearby'
      ? 'Nearby'
      : panelView === 'location'
        ? 'Your location'
        : selectedPlace
          ? selectedPlace.name
          : selectedBarangayMarker
            ? selectedBarangayMarker.name
            : 'Explore the map';
  const panelSubtitle = panelView === 'layers'
    ? 'Standard OpenStreetMap tiles are active.'
    : panelView === 'nearby'
      ? userLocation
        ? `${filteredPlaces.length} place${filteredPlaces.length === 1 ? '' : 's'} sorted nearest first.`
        : 'Use your location to sort places by distance.'
      : panelView === 'location'
        ? locationStatus === 'granted'
          ? `Accuracy about ${Math.max(1, Math.round(userLocation?.accuracy ?? 0))} m.`
          : locationMessage
        : selectedPlace
          ? `${selectedPlace.subcategory} · ${selectedPlace.barangay}`
          : selectedBarangayMarker
            ? 'Mapped barangay center · Villaverde, Nueva Vizcaya'
            : selectedCategory === 'all'
              ? `${filteredPlaces.length} place${filteredPlaces.length === 1 ? '' : 's'} shown`
              : `${filteredPlaces.length} ${selectedCategoryData.label.toLowerCase()} place${filteredPlaces.length === 1 ? '' : 's'} shown`;

  const openPanelView = (view: MapPanelView, level: MapSheetLevel = 1) => {
    setPanelView(view);
    setSheetLevel(level);
    setDragOffset(0);
  };

  const moveMap = (center: [number, number], zoom: number) => {
    const map = mapRef.current;
    if (!map) return;
    if (prefersReducedMotion) {
      map.setView(center, zoom, { animate: false });
      return;
    }
    map.flyTo(center, zoom, { duration: 0.75 });
  };

  const centerOnUser = (location = userLocation) => {
    if (!location) return;
    moveMap([location.latitude, location.longitude], Math.max(16, mapRef.current?.getZoom() ?? 16));
  };

  const applyLocation = (position: GeolocationPosition) => {
    const nextLocation: UserLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      updatedAt: position.timestamp || Date.now(),
    };
    latestLocationRef.current = nextLocation;
    onUserLocationChange(nextLocation);
    setLocationStatus('granted');
    setLocationMessage('Your location is active.');
    centerOnUser(nextLocation);
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) {
      setLocationStatus('denied');
      setLocationMessage('Location access was denied. You can still explore Villaverde manually.');
      return;
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      setLocationStatus('unavailable');
      setLocationMessage('Your location could not be determined. Try again or move the map manually.');
      return;
    }
    setLocationStatus('error');
    setLocationMessage('Location took too long or encountered an error. Please try again.');
  };

  const startLocationWatch = () => {
    if (locationWatchIdRef.current !== null || !('geolocation' in navigator)) return;
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      applyLocation,
      (error) => {
        // Keep the last good position if a later GPS refresh fails.
        if (!latestLocationRef.current) handleLocationError(error);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
  };

  const requestUserLocation = (targetView: MapPanelView = 'location') => {
    openPanelView(targetView, 1);
    if (userLocation) {
      setLocationStatus('granted');
      setLocationMessage('Your location is active.');
      centerOnUser(userLocation);
      startLocationWatch();
      return;
    }
    if (!('geolocation' in navigator)) {
      setLocationStatus('unavailable');
      setLocationMessage('Location is unavailable on this device or browser.');
      return;
    }
    if (locationStatus === 'requesting') return;
    setLocationStatus('requesting');
    setLocationMessage('Finding your current location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyLocation(position);
        startLocationWatch();
      },
      handleLocationError,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
  };

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = { pointerId: event.pointerId, startY: event.clientY };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;
    const delta = event.clientY - dragStateRef.current.startY;
    setDragOffset(Math.max(-140, Math.min(180, delta)));
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const delta = event.clientY - dragState.startY;
    if (Math.abs(delta) < 8) {
      setSheetLevel((current) => current === 2 ? 1 : (current + 1) as MapSheetLevel);
    } else if (delta < -55) {
      setSheetLevel((current) => Math.min(2, current + 1) as MapSheetLevel);
    } else if (delta > 55) {
      setSheetLevel((current) => Math.max(0, current - 1) as MapSheetLevel);
    }

    setDragOffset(0);
    setIsDragging(false);
    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const cancelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    setDragOffset(0);
    setIsDragging(false);
    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const chooseCategory = (categoryId: MapCategoryId) => {
    setSelectedCategory(categoryId);
    setSelectedPlaceId(null);
    setSelectedBarangayId(isFocusedVisitorMap ? visitorBarangayScope?.id ?? null : null);
    setPanelView('categories');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!value) return;
    setSelectedPlaceId(null);
    setSelectedBarangayId(null);
    setPanelView('categories');
    setSheetLevel((current) => Math.max(1, current) as MapSheetLevel);
  };

  const focusBarangay = (barangay: Barangay) => {
    if (isFocusedVisitorMap) setVisitorBarangayScopeId(barangay.id);
    setSelectedBarangayId(barangay.id);
    setSelectedPlaceId(null);
    setSearchQuery('');
    setPanelView('categories');
    setSheetLevel(0);
    moveMap(barangay.coordinates, 16);
  };

  const focusPlace = (place: PlaceRecord) => {
    setSelectedPlaceId(place.id);
    setSelectedBarangayId(null);
    setSearchQuery('');
    setPanelView('categories');
    // A marker tap should immediately reveal the useful preview state.
    setSheetLevel(1);
    setDragOffset(0);

    const map = mapRef.current;
    if (!map) return;
    moveMap([place.latitude, place.longitude], Math.max(16, map.getZoom() || 16));
    window.setTimeout(() => {
      if (mapRef.current === map) {
        // Shift the selected marker upward so it stays visible above the preview sheet.
        map.panBy([0, Math.min(150, viewportHeight * 0.17)], {
          animate: !prefersReducedMotion,
          duration: prefersReducedMotion ? 0 : 0.35,
        });
      }
    }, prefersReducedMotion ? 0 : 780);
  };

  const recenterMap = () => {
    setSelectedPlaceId(null);
    setSelectedBarangayId(scope === 'local' ? activeBarangay.id : visitorBarangayScope?.id ?? null);
    moveMap(
      scope === 'local' ? activeBarangay.coordinates : visitorBarangayScope?.coordinates ?? VILLAVERDE_CENTER,
      scope === 'local' ? LOCAL_DEFAULT_ZOOM : visitorBarangayScope ? 16 : VISITOR_DEFAULT_ZOOM,
    );
  };

  const zoomMap = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(Math.max(11, Math.min(18, map.getZoom() + delta)), { animate: !prefersReducedMotion });
  };

  return (
    <main className="map-screen-enter relative h-[100dvh] min-h-0 overflow-hidden bg-[#E8EDE2] sm:h-[864px]" style={{ height: `${viewportHeight}px` }} aria-label="Interactive Villaverde map" aria-busy={placesDataState === 'loading' || mapTileState === 'loading'}>
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={initialViewRef.current.center}
          zoom={initialViewRef.current.zoom}
          minZoom={11}
          maxZoom={18}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom
          touchZoom
          doubleClickZoom
          dragging
          className="h-full w-full"
          ref={mapRef}
          zoomAnimation={!prefersReducedMotion}
          fadeAnimation={!prefersReducedMotion}
          markerZoomAnimation={!prefersReducedMotion}
        >
          <TileLayer
            key={mapTileReloadVersion}
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            eventHandlers={{
              loading: () => setMapTileState('loading'),
              load: () => setMapTileState('ready'),
              tileerror: () => setMapTileState('error'),
            }}
          />
          <MapViewPersistence
            viewKey={viewKey}
            onZoomChange={setMapZoom}
            onMapClick={() => {
              if (selectedPlaceId) setSheetLevel(1);
              setSelectedPlaceId(null);
              if (scope === 'visitor') setSelectedBarangayId(isFocusedVisitorMap ? visitorBarangayScope?.id ?? null : null);
            }}
          />

          {scope === 'local' && (
            <Circle
              center={activeBarangay.coordinates}
              radius={420}
              pathOptions={{ color: activeBarangay.colors[0], fillColor: activeBarangay.colors[1], fillOpacity: 0.08, opacity: 0.35, weight: 2 }}
              interactive={false}
            />
          )}

          {userLocation && (
            <>
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={Math.max(12, userLocation.accuracy)}
                interactive={false}
                pathOptions={{ color: '#2563EB', fillColor: '#3B82F6', fillOpacity: 0.08, opacity: 0.28, weight: 1.5 }}
              />
              <CircleMarker
                center={[userLocation.latitude, userLocation.longitude]}
                radius={9}
                pathOptions={{ color: '#FFFFFF', fillColor: '#2563EB', fillOpacity: 1, opacity: 1, weight: 3 }}
              >
                <Tooltip direction="top" offset={[0, -9]} opacity={1} className="myvillaverde-map-tooltip">You are here</Tooltip>
              </CircleMarker>
            </>
          )}

          {visibleBarangayMarkers.map((barangay) => {
            const isActive = scope === 'local' && barangay.id === activeBarangay.id;
            const isSelected = barangay.id === selectedBarangayId;
            return (
              <CircleMarker
                key={barangay.id}
                center={barangay.coordinates}
                radius={isActive || isSelected ? 8 : 5}
                pathOptions={{
                  color: '#FFFFFF',
                  fillColor: isActive ? activeBarangay.colors[0] : barangay.colors[0],
                  fillOpacity: selectedPlace ? 0.35 : 0.92,
                  opacity: selectedPlace ? 0.45 : 0.92,
                  weight: isActive || isSelected ? 3 : 2,
                  bubblingMouseEvents: false,
                }}
                eventHandlers={{ click: () => focusBarangay(barangay) }}
              >
                <Tooltip
                  permanent={isActive || isSelected}
                  sticky
                  direction="top"
                  offset={[0, -8]}
                  opacity={1}
                  className="myvillaverde-map-tooltip myvillaverde-barangay-tooltip"
                >
                  {barangay.name}
                </Tooltip>
              </CircleMarker>
            );
          })}

          {filteredPlaces.map((place) => {
            const isSelected = place.id === selectedPlaceId;
            const markerColor = CATEGORY_MARKER_COLORS[place.categoryId];
            const markerRadius = isSelected ? 10 : mapZoom >= 17 ? 7 : mapZoom >= 15 ? 6 : 5;
            const markerOpacity = selectedPlace && !isSelected ? 0.28 : 0.96;

            return (
              <React.Fragment key={place.id}>
                {isSelected && (
                  <CircleMarker
                    center={[place.latitude, place.longitude]}
                    radius={17}
                    interactive={false}
                    pathOptions={{
                      color: markerColor,
                      fillColor: markerColor,
                      fillOpacity: 0.12,
                      opacity: 0.28,
                      weight: 2,
                    }}
                  />
                )}

                <CircleMarker
                  center={[place.latitude, place.longitude]}
                  radius={15}
                  pathOptions={{
                    color: '#FFFFFF',
                    fillColor: '#FFFFFF',
                    // Keep the enlarged touch target technically painted so Leaflet/SVG
                    // receives taps on mobile, while remaining visually invisible.
                    fillOpacity: 0.001,
                    opacity: 0.001,
                    weight: 0,
                    // Prevent the marker tap from immediately reaching the map's
                    // click handler, which would clear the newly selected place.
                    bubblingMouseEvents: false,
                  }}
                  eventHandlers={{ click: () => focusPlace(place) }}
                >
                  <Tooltip
                    permanent={isSelected}
                    sticky
                    direction="top"
                    offset={[0, -10]}
                    opacity={1}
                    className="myvillaverde-map-tooltip"
                  >
                    {place.name}
                  </Tooltip>
                </CircleMarker>

                <CircleMarker
                  center={[place.latitude, place.longitude]}
                  radius={markerRadius}
                  interactive={false}
                  pathOptions={{
                    color: '#FFFFFF',
                    fillColor: markerColor,
                    fillOpacity: markerOpacity,
                    opacity: selectedPlace && !isSelected ? 0.38 : 1,
                    weight: isSelected ? 4 : 2.5,
                  }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[5] bg-[linear-gradient(to_bottom,rgba(238,241,232,.18),transparent_24%,transparent_75%,rgba(232,237,226,.12))]" />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedPlace
          ? `${selectedPlace.name} selected. ${panelSubtitle}`
          : `${panelTitle}. ${panelSubtitle}. ${placesStatusLabel} database.`}
      </div>

      {mapTileState !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-6" role="status" aria-live="polite">
          <div className="pointer-events-auto flex max-w-[280px] items-center gap-3 rounded-full border border-white/80 bg-[#FFFDF7]/95 px-4 py-3 text-[#35463E] shadow-xl backdrop-blur-md">
            {mapTileState === 'loading' ? <RefreshCw className="h-4 w-4 shrink-0 animate-spin" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-[#9A5A24]" />}
            <span className="min-w-0 flex-1 text-xs font-extrabold">{mapTileState === 'loading' ? 'Loading map…' : isOnline ? 'Map tiles could not load.' : 'Map tiles are unavailable offline.'}</span>
            {mapTileState === 'error' && isOnline && (
              <button type="button" onClick={() => { setMapTileState('loading'); setMapTileReloadVersion((version) => version + 1); }} className="shrink-0 rounded-full bg-[#26372F] px-3 py-1.5 text-[10px] font-extrabold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25">Retry</button>
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 top-0 z-30 px-4 pt-[max(1rem,env(safe-area-inset-top))]" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onBack} className="grid h-12 w-12 shrink-0 touch-manipulation place-items-center rounded-full border border-white/70 bg-[#FFFDF7]/95 text-[#26372F] shadow-lg backdrop-blur-md transition-all hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/25" aria-label="Back to guide">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-white/70 bg-[#FFFDF7]/95 px-4 py-3 shadow-lg backdrop-blur-md focus-within:ring-4 focus-within:ring-[#2B6A4E]/20">
            <Search className="h-5 w-5 shrink-0 text-[#637169]" />
            <input value={searchQuery} onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(event.target.value)} onFocus={() => { setPanelView('categories'); setSheetLevel((current) => Math.max(1, current) as MapSheetLevel); }} placeholder="Search places or barangays..." autoComplete="off" enterKeyHint="search" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#18241F] outline-none placeholder:text-[#8B958E]" aria-label="Search Villaverde places and barangays" />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#637169] hover:bg-[#EEF1E8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6A4E]/25" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-[#FFFDF7]/90 px-3 py-2 text-[11px] font-extrabold text-[#32463C] shadow-md backdrop-blur-md">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: mapAccent }} />
            {scope === 'local' ? activeBarangay.name : visitorBarangayScope?.name ?? 'Visitor guide'}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-md backdrop-blur-md ${placesDataState === 'live' ? 'bg-[#2B6A4E]/90' : placesDataState === 'loading' ? 'bg-[#526158]/85' : placesDataState === 'offline' ? 'bg-[#7A4B2B]/90' : 'bg-[#9A5A24]/90'}`} role="status" aria-live="polite">
            {placesDataState === 'loading' ? <RefreshCw className="h-3 w-3 animate-spin" /> : placesDataState === 'offline' ? <AlertTriangle className="h-3 w-3" /> : <Database className="h-3 w-3" />}
            {placesStatusLabel}
          </span>
        </div>
      </div>

      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="absolute top-[158px] z-20 text-[8px] font-semibold text-[#526158]/65 drop-shadow-[0_1px_1px_rgba(255,255,255,.95)] transition-colors hover:text-[#26372F] focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#2B6A4E]/25" style={{ left: 'max(0.75rem, env(safe-area-inset-left))' }} aria-label="OpenStreetMap attribution">
        Map © OpenStreetMap
      </a>

      <div
        className={`absolute top-[154px] z-20 flex flex-col gap-2.5 transition-all duration-300 ${showMapControls ? 'opacity-100' : 'pointer-events-none translate-x-2 opacity-0'}`}
        style={{ right: 'max(1rem, env(safe-area-inset-right))' }}
        aria-hidden={!showMapControls}
        hidden={!showMapControls}
      >
        {showZoomControls && (
          <div className="overflow-hidden rounded-full border border-white/70 bg-[#FFFDF7]/95 shadow-lg backdrop-blur-md">
            <button type="button" onClick={() => zoomMap(1)} className="grid h-11 w-11 place-items-center text-[#26372F] transition-all hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#2B6A4E]/25" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
            <div className="mx-auto h-px w-6 bg-[#D9E0D8]" />
            <button type="button" onClick={() => zoomMap(-1)} className="grid h-11 w-11 place-items-center text-[#26372F] transition-all hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#2B6A4E]/25" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
          </div>
        )}
        {showRecenterControl && (
          <button type="button" onClick={recenterMap} className="grid h-12 w-12 touch-manipulation place-items-center rounded-full border border-white/70 bg-[#FFFDF7]/95 text-[#26372F] shadow-lg backdrop-blur-md transition-all hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/25" aria-label={scope === 'local' ? `Recenter on ${activeBarangay.name}` : visitorBarangayScope ? `Recenter on ${visitorBarangayScope.name}` : 'Recenter on Villaverde'}>
            <MapPin className="h-5 w-5" style={{ color: mapAccent }} />
          </button>
        )}
        {showLocationControl && (
          <button type="button" onClick={() => requestUserLocation('location')} className={`grid h-12 w-12 touch-manipulation place-items-center rounded-full border border-white/70 bg-[#FFFDF7]/95 shadow-lg backdrop-blur-md transition-all hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/25 ${panelView === 'location' || locationStatus === 'granted' ? 'ring-2' : 'text-[#26372F]'}`} aria-label={locationStatus === 'granted' ? 'Recenter on your location' : 'Use current location'} aria-pressed={panelView === 'location'} style={panelView === 'location' || locationStatus === 'granted' ? { color: locationStatus === 'granted' ? '#2563EB' : mapAccent, boxShadow: `0 0 0 2px ${locationStatus === 'granted' ? '#2563EB22' : mapAccentSoft}` } : undefined}>
            {locationStatus === 'requesting' ? <RefreshCw className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
          </button>
        )}
        {showNearbyControl && (
          <button type="button" onClick={() => openPanelView('nearby', 1)} className={`grid h-12 w-12 touch-manipulation place-items-center rounded-full border border-white/70 bg-[#FFFDF7]/95 shadow-lg backdrop-blur-md transition-all hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/25 ${panelView === 'nearby' ? '' : 'text-[#26372F]'}`} aria-label="Nearby places" style={panelView === 'nearby' ? { color: mapAccent } : undefined}>
            <Navigation className="h-5 w-5" />
          </button>
        )}
        {showLayersControl && (
          <button type="button" onClick={() => openPanelView('layers', 1)} className={`grid h-12 w-12 touch-manipulation place-items-center rounded-full border border-white/70 bg-[#FFFDF7]/95 shadow-lg backdrop-blur-md transition-all hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/25 ${panelView === 'layers' ? '' : 'text-[#26372F]'}`} aria-label="Map layers" style={panelView === 'layers' ? { color: mapAccent } : undefined}>
            <Layers3 className="h-5 w-5" />
          </button>
        )}
      </div>

      <section
        className={`absolute z-40 flex flex-col overflow-hidden bg-[#FFFBF2]/98 backdrop-blur-xl ${
          sheetLevel === 0
            ? 'left-4 right-4 rounded-[24px] border border-white/80 shadow-[0_10px_28px_rgba(31,47,39,.22)]'
            : 'inset-x-0 rounded-t-[32px] border-t border-white/70 shadow-[0_-16px_40px_rgba(31,47,39,.18)]'
        } ${isDragging ? 'transition-none' : 'transition-[height,bottom,left,right,border-radius] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]'}`}
        style={{
          height: `${renderedSheetHeight}px`,
          bottom: sheetLevel === 0
            ? 'calc(0.625rem + env(safe-area-inset-bottom))'
            : '0px',
          ...(sheetLevel === 0
            ? {
                left: 'max(1rem, env(safe-area-inset-left))',
                right: 'max(1rem, env(safe-area-inset-right))',
              }
            : {}),
        }}
        role="region"
        aria-labelledby={mapPanelTitleId}
        aria-describedby={mapPanelContentId}
      >
        <div className={`relative shrink-0 touch-none cursor-grab select-none active:cursor-grabbing ${sheetLevel === 0 ? 'flex h-full items-center px-3.5 py-0' : 'px-5 pb-3 pt-2'}`} onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={finishDrag} onPointerCancel={cancelDrag} role="slider" tabIndex={0} onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
          if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End', 'Enter', ' '].includes(event.key)) event.preventDefault();
          if (event.key === 'ArrowUp' || event.key === 'ArrowRight') setSheetLevel((current) => Math.min(2, current + 1) as MapSheetLevel);
          if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') setSheetLevel((current) => Math.max(0, current - 1) as MapSheetLevel);
          if (event.key === 'Home') setSheetLevel(0);
          if (event.key === 'End') setSheetLevel(2);
          if (event.key === 'Enter' || event.key === ' ') setSheetLevel((current) => current === 2 ? 1 : (current + 1) as MapSheetLevel);
        }} aria-label="Map options panel height" aria-controls={mapPanelContentId} aria-valuemin={0} aria-valuemax={2} aria-valuenow={sheetLevel} aria-valuetext={sheetLevel === 0 ? 'Compact' : sheetLevel === 1 ? 'Preview' : 'Full details'}>
          <div className={`rounded-full bg-[#BFC9C0] ${sheetLevel === 0 ? 'absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2' : 'mx-auto h-1.5 w-12'}`} />
          {sheetLevel === 0 ? (
            selectedPlace ? (
            <div className="flex w-full min-w-0 items-center gap-2">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white shadow-sm"
                style={{ backgroundColor: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }}
                aria-hidden="true"
              >
                <MapPin className="h-[17px] w-[17px]" />
              </span>
              <div className="min-w-0 flex-1">
                <h1
                  id={mapPanelTitleId}
                  className={`truncate font-serif-header font-bold leading-tight text-[#18241F] ${
                    selectedPlace.name.length > 31
                      ? 'text-[13.5px]'
                      : selectedPlace.name.length > 24
                        ? 'text-[15px]'
                        : 'text-[16px]'
                  }`}
                  title={panelTitle}
                >
                  {panelTitle}
                </h1>
                <p className="mt-0.5 truncate text-[10px] font-semibold leading-none text-[#748078]" aria-live="polite">
                  {panelSubtitle}
                </p>
              </div>
              <button
                type="button"
                onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  setSelectedPlaceId(null);
                  setSheetLevel(1);
                  setDragOffset(0);
                }}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEF1E8] text-[#526158] transition-all hover:bg-[#E5EAE1] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                aria-label="Close place preview"
              >
                <X className="h-[17px] w-[17px]" />
              </button>
            </div>
            ) : (
              <div className="flex w-full min-w-0 items-center gap-2">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white shadow-sm"
                  style={{ backgroundColor: mapAccent }}
                  aria-hidden="true"
                >
                  <MapIcon className="h-[17px] w-[17px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <h1 id={mapPanelTitleId} className="truncate font-serif-header text-[16px] font-bold leading-tight text-[#18241F]">
                    Explore the map
                  </h1>
                  <p className="mt-0.5 truncate text-[10px] font-semibold leading-none text-[#748078]" aria-live="polite">
                    {panelSubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    setSheetLevel(1);
                    setDragOffset(0);
                  }}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEF1E8] text-[#526158] transition-all hover:bg-[#E5EAE1] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                  aria-label="Expand map options"
                >
                  <ChevronRight className="h-[17px] w-[17px] -rotate-90" />
                </button>
              </div>
            )
          ) : (
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 pr-1">
                <h1
                  id={mapPanelTitleId}
                  className={`font-serif-header font-bold text-[#18241F] [overflow-wrap:anywhere] ${
                    selectedPlace
                      ? 'line-clamp-2 text-[24px] leading-[1.08]'
                      : 'truncate text-[25px] leading-tight'
                  }`}
                  title={panelTitle}
                >
                  {panelTitle}
                </h1>
                <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#748078]" aria-live="polite">{panelSubtitle}</p>
              </div>
              <div className="flex shrink-0 gap-1.5" onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => event.stopPropagation()} aria-label="Panel height controls">
                {(selectedPlace
                  ? (['Compact', 'Place preview', 'Full details'] as const)
                  : (['Compact', 'Browse', 'Full panel'] as const)
                ).map((label, level) => (
                  <button key={label} type="button" onClick={(event: React.MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); setSheetLevel(level as MapSheetLevel); setDragOffset(0); }} className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6A4E]/30 ${sheetLevel === level ? 'w-6' : 'w-2.5 bg-[#CCD5CC]'}`} style={sheetLevel === level ? { backgroundColor: mapAccent } : undefined} aria-label={`${label} panel`} aria-pressed={sheetLevel === level} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          id={mapPanelContentId}
          className={`hide-scrollbar min-h-0 flex-1 touch-pan-y overscroll-contain px-5 ${sheetLevel === 0 ? 'pointer-events-none overflow-hidden opacity-0' : 'overflow-y-auto opacity-100'}`}
          style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        >
          {panelView === 'categories' && (
            <>
              {selectedPlace ? (
                <div className="place-preview-enter space-y-3">
                  <article className="overflow-hidden rounded-[26px] border border-[#D9E0D8] bg-[#FFFDF7] shadow-[0_12px_28px_rgba(31,47,39,.10)]">
                    <div className="h-1.5" style={{ backgroundColor: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }} />
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }}>
                          <MapPin className="h-6 w-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ color: CATEGORY_MARKER_COLORS[selectedPlace.categoryId], backgroundColor: `${CATEGORY_MARKER_COLORS[selectedPlace.categoryId]}16` }}>{selectedPlace.category}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${selectedPlace.status.toLowerCase() === 'verified' ? 'bg-[#E7F0E8] text-[#2B6A4E]' : 'bg-[#FFF0D8] text-[#9A5A24]'}`}>
                              {selectedPlace.status.toLowerCase() === 'verified' ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              {selectedPlace.status.toLowerCase() === 'verified' ? 'Verified location' : 'Needs checking'}
                            </span>
                          </div>
                          <p className="mt-2 text-xs font-bold text-[#748078]">{selectedPlace.subcategory} · {selectedPlace.barangay}</p>
                        </div>
                        <button type="button" onClick={() => { setSelectedPlaceId(null); setSheetLevel(1); setDragOffset(0); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EEF1E8] text-[#526158] transition-all hover:bg-[#E5EAE1] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label="Close place preview"><X className="h-4 w-4" /></button>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5">
                        <div className="flex min-h-[58px] items-center gap-2.5 rounded-[18px] bg-[#F1F3EC] px-3.5 py-3">
                          <Clock3 className="h-4 w-4 shrink-0" style={{ color: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }} />
                          <span className="min-w-0 text-xs font-extrabold leading-4 text-[#35463E]">{selectedPlace.openingHours || 'Hours unavailable'}</span>
                        </div>
                        <div className="flex min-h-[58px] items-center gap-2.5 rounded-[18px] bg-[#F1F3EC] px-3.5 py-3">
                          {selectedPlaceDistance !== null ? <Navigation className="h-4 w-4 shrink-0" style={{ color: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }} /> : <MapPin className="h-4 w-4 shrink-0" style={{ color: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }} />}
                          <span className="min-w-0 truncate text-xs font-extrabold text-[#35463E]">{selectedPlaceDistance !== null ? `${formatDistance(selectedPlaceDistance)} away` : selectedPlace.barangay}</span>
                        </div>
                      </div>

                      <p className={`mt-4 text-sm font-medium leading-6 text-[#526158] ${sheetLevel === 2 ? '' : 'line-clamp-2'}`}>{selectedPlace.description || `${selectedPlace.name} is listed in the myVillaverde places database.`}</p>

                      <button
                        type="button"
                        onClick={() => onOpenPlacePage(selectedPlace)}
                        className="mt-5 flex w-full items-center justify-between rounded-[20px] bg-[#E7F0E8] px-4 py-3.5 text-left text-[#2B6A4E] transition-all hover:bg-[#DDEBDF] active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"
                      >
                        <span>
                          <span className="block text-sm font-extrabold">View place page</span>
                          <span className="mt-0.5 block text-[11px] font-semibold text-[#5B7465]">Complete details and shareable link</span>
                        </span>
                        <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
                      </button>

                      <div className={`mt-3 grid gap-2 ${selectedPlace.website ? 'grid-cols-3' : 'grid-cols-2'}`} aria-label="Place actions">
                        <button type="button" onClick={() => onToggleSavedPlace(selectedPlace)} className={`flex min-w-0 flex-col items-center gap-1.5 rounded-[18px] border px-2 py-3 transition-all active:scale-[0.97] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20 ${isSelectedPlaceSaved ? 'border-[#2B6A4E] bg-[#E7F0E8] text-[#2B6A4E]' : 'border-[#D1DAD2] bg-white text-[#35463E]'}`} aria-pressed={isSelectedPlaceSaved} aria-label={isSelectedPlaceSaved ? `Remove ${selectedPlace.name} from saved places` : `Save ${selectedPlace.name}`}><Bookmark className={`h-5 w-5 ${isSelectedPlaceSaved ? 'fill-current' : ''}`} /><span className="text-[10px] font-extrabold">{isSelectedPlaceSaved ? 'Saved' : 'Save'}</span></button>
                        {selectedPlace.phone ? (
                          <a href={`tel:${selectedPlace.phone.replace(/[^+\d]/g, '')}`} className="flex min-w-0 flex-col items-center gap-1.5 rounded-[18px] border border-[#D1DAD2] bg-white px-2 py-3 text-[#35463E] transition-all active:scale-[0.97] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"><Phone className="h-5 w-5" /><span className="text-[10px] font-extrabold">Call</span></a>
                        ) : (
                          <button type="button" disabled className="flex min-w-0 flex-col items-center gap-1.5 rounded-[18px] border border-[#E0E5DD] bg-[#F1F2EC] px-2 py-3 text-[#A1A8A1]"><Phone className="h-5 w-5" /><span className="text-[10px] font-extrabold">No phone</span></button>
                        )}
                        {selectedPlace.website && (
                          <a href={selectedPlace.website} target="_blank" rel="noreferrer" className="flex min-w-0 flex-col items-center gap-1.5 rounded-[18px] border border-[#D1DAD2] bg-white px-2 py-3 text-[#35463E] transition-all active:scale-[0.97] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"><Globe2 className="h-5 w-5" /><span className="text-[10px] font-extrabold">Website</span></a>
                        )}
                      </div>

                      {sheetLevel === 2 && (
                        <div className="mt-5 space-y-3 border-t border-[#E0E5DD] pt-5">
                          <div className="flex items-start gap-2.5 text-xs font-semibold leading-5 text-[#5F6D64]"><MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }} /><span>{selectedPlace.address || `${selectedPlace.barangay}, Villaverde, Nueva Vizcaya`}</span></div>
                          {selectedPlaceDistance !== null && <div className="flex items-start gap-2.5 text-xs font-semibold leading-5 text-[#5F6D64]"><Navigation className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }} /><span>{formatDistance(selectedPlaceDistance)} from your current location</span></div>}
                          {selectedPlace.phone && <div className="flex items-start gap-2.5 text-xs font-semibold leading-5 text-[#5F6D64]"><Phone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }} /><span>{selectedPlace.phone}</span></div>}
                          {selectedPlace.lastChecked && <div className="flex items-start gap-2.5 text-xs font-semibold leading-5 text-[#5F6D64]"><Database className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }} /><span>Last checked {selectedPlace.lastChecked}</span></div>}
                          {selectedPlace.verificationSource && <div className="flex items-start gap-2.5 text-xs font-semibold leading-5 text-[#5F6D64]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CATEGORY_MARKER_COLORS[selectedPlace.categoryId] }} /><span>Source: {selectedPlace.verificationSource}</span></div>}
                          {selectedPlace.notes && <div className="break-words whitespace-pre-wrap rounded-[18px] bg-[#F1F3EC] p-3.5 text-xs font-semibold leading-5 text-[#5F6D64] [overflow-wrap:anywhere]"><span className="font-extrabold text-[#35463E]">Listing notes: </span>{selectedPlace.notes}</div>}
                          {selectedPlace.status.toLowerCase() !== 'verified' && (
                            <div className="flex items-start gap-2.5 rounded-[18px] border border-[#E7C98D] bg-[#FFF6E6] p-3.5 text-xs font-semibold leading-5 text-[#85501D]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>This listing still needs local confirmation. Use the map pin as a guide, not a guarantee.</span></div>
                          )}
                          <div className="rounded-[18px] bg-[#F1F3EC] px-4 py-3 text-center text-xs font-bold text-[#748078]">Photos and richer media arrive in Phase 3B. Complete place details are available on the place page.</div>
                        </div>
                      )}
                    </div>
                  </article>
                  <div className="-mx-1 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
                    <button type="button" onClick={() => { setSelectedPlaceId(null); setSheetLevel(1); setDragOffset(0); }} className="w-full rounded-full border border-[#D1DAD2] bg-[#FFFDF7] px-4 py-3 text-sm font-extrabold text-[#35463E] shadow-[0_8px_22px_rgba(31,47,39,.10)] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">Back to places</button>
                  </div>
                </div>
              ) : searchQuery ? (
                <div className="space-y-4">
                  {searchPlaceResults.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="px-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7C877F]">Places</p>
                      {searchPlaceResults.slice(0, 20).map((place) => (
                        <button type="button" key={place.id} onClick={() => focusPlace(place)} className="flex w-full items-center gap-3 rounded-[20px] border border-[#D9E0D8] bg-[#FFFDF7] p-3.5 text-left transition-all hover:bg-white active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-sm" style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }}><MapPin className="h-5 w-5" /></span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-[#26372F]">{place.name}</span><span className="mt-0.5 block truncate text-xs font-medium text-[#748078]">{place.subcategory} · {place.barangay}{distanceByPlaceId.get(place.id) !== null && distanceByPlaceId.get(place.id) !== undefined ? ` · ${formatDistance(distanceByPlaceId.get(place.id)!)}` : ''}</span></span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchBarangayResults.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="px-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7C877F]">Barangays</p>
                      {searchBarangayResults.map((barangay) => (
                        <button type="button" key={barangay.id} onClick={() => focusBarangay(barangay)} className="flex w-full items-center gap-3 rounded-[20px] border border-[#D9E0D8] bg-[#FFFDF7] p-3.5 text-left transition-all hover:bg-white active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-sm" style={{ backgroundColor: barangay.colors[0] }}><MapPin className="h-5 w-5" /></span>
                          <span><span className="block text-sm font-extrabold text-[#26372F]">{barangay.name}</span><span className="mt-0.5 block text-xs font-medium text-[#748078]">Barangay center · Villaverde</span></span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchPlaceResults.length === 0 && searchBarangayResults.length === 0 && (
                    <div className="rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] p-5 text-center"><p className="text-sm font-bold text-[#26372F]">Nothing found</p><p className="mt-1 text-xs font-medium leading-5 text-[#748078]">Try a place name, category, service, or barangay.</p></div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    {MAP_CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      const isActive = selectedCategory === category.id;
                      const count = category.id === 'all' ? scopePlaces.length : scopePlaces.filter((place) => place.categoryId === category.id).length;
                      return (
                        <button type="button" key={category.id} onClick={() => chooseCategory(category.id)} className={`flex min-h-[68px] touch-manipulation items-center gap-3 rounded-[20px] border px-3.5 py-3 text-left transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20 ${isActive ? 'shadow-sm' : 'border-[#D9E0D8] bg-[#FFFDF7] text-[#35463E] hover:bg-white'}`} style={isActive ? { borderColor: mapAccent, backgroundColor: mapAccentSoft, color: mapAccent } : undefined} aria-pressed={isActive}>
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isActive ? 'text-white' : 'bg-[#EEF1E8] text-[#526158]'}`} style={isActive ? { backgroundColor: mapAccent } : undefined}><Icon className="h-[18px] w-[18px]" /></span>
                          <span className="min-w-0"><span className="block text-xs font-extrabold leading-4">{category.label}</span><span className={`mt-0.5 block text-[10px] font-bold ${isActive ? 'opacity-75' : 'text-[#8B958E]'}`}>{count} place{count === 1 ? '' : 's'}</span></span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={`mt-4 flex items-start gap-3 rounded-[22px] border p-4 ${placesDataState === 'live' ? 'border-[#C7D9C9] bg-[#EFF7EE]' : placesDataState === 'loading' ? 'border-[#D9E0D8] bg-[#F5F4EA]' : 'border-[#E7C98D] bg-[#FFF6E6]'}`} role="status" aria-live="polite">
                    {placesDataState === 'loading' ? <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#526158]" /> : placesDataState === 'live' ? <Database className="mt-0.5 h-5 w-5 shrink-0 text-[#2B6A4E]" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9A5A24]" />}
                    <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#26372F]">{placesDataState === 'live' ? 'Live Places database' : placesDataState === 'loading' ? 'Loading Places database' : placesDataState === 'offline' ? 'Offline places available' : 'Using built-in snapshot'}</p><p className="mt-1 text-xs font-medium leading-5 text-[#748078]">{placesLoadMessage}</p></div>
                    <button type="button" onClick={() => { if (!isOnline) return; onRefreshPlaces(); }} disabled={!isOnline || placesDataState === 'loading'} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/5 bg-white/70 text-[#526158] transition-all disabled:cursor-not-allowed disabled:opacity-45 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6A4E]/25" aria-label={isOnline ? 'Refresh place data' : 'Refresh unavailable while offline'}><RefreshCw className={`h-4 w-4 ${placesDataState === 'loading' ? 'animate-spin' : ''}`} /></button>
                  </div>

                  {filteredPlaces.length > 0 ? (
                    <div className="mt-4 space-y-2.5">
                      {filteredPlaces.map((place) => (
                        <button type="button" key={place.id} onClick={() => focusPlace(place)} className="flex w-full items-center gap-3 rounded-[20px] border border-[#D9E0D8] bg-[#FFFDF7] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-sm active:translate-y-0 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-sm" style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }}><MapPin className="h-5 w-5" /></span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-[#26372F]">{place.name}</span><span className="mt-0.5 block truncate text-xs font-medium text-[#748078]">{place.subcategory} · {place.barangay}{distanceByPlaceId.get(place.id) !== null && distanceByPlaceId.get(place.id) !== undefined ? ` · ${formatDistance(distanceByPlaceId.get(place.id)!)}` : ''}</span></span>
                          {place.status.toLowerCase() === 'verified' ? <ShieldCheck className="h-4 w-4 shrink-0 text-[#2B6A4E]" aria-label="Verified" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-[#B66A20]" aria-label="Needs checking" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] p-5 text-center"><p className="text-sm font-bold text-[#26372F]">No places in this filter yet</p><p className="mt-1 text-xs font-medium leading-5 text-[#748078]">The map is working. This empty state shows where the database still needs entries.</p></div>
                  )}
                </>
              )}
            </>
          )}

          {panelView === 'layers' && (
            <div className="space-y-2.5">
              <div className="space-y-2.5" role="list" aria-label="Available map layers">
                {[
                  { title: 'Standard', description: 'OpenStreetMap roads and mapped places', active: true },
                  { title: 'Terrain', description: 'Landscape and elevation details', active: false },
                  { title: 'Satellite', description: 'Aerial imagery from a future provider', active: false },
                ].map((layer) => (
                  <div key={layer.title} role="listitem" className={`flex w-full items-center justify-between rounded-[22px] border p-4 text-left ${layer.active ? '' : 'border-[#D9E0D8] bg-[#FFFDF7]'}`} style={layer.active ? { borderColor: mapAccent, backgroundColor: mapAccentSoft } : undefined}>
                    <div><p className="text-sm font-extrabold text-[#26372F]">{layer.title}</p><p className="mt-1 text-xs font-medium text-[#748078]">{layer.description}</p></div>
                    {layer.active ? <Check className="h-5 w-5" style={{ color: mapAccent }} aria-label="Selected" /> : <span className="rounded-full bg-[#EEF1E8] px-2.5 py-1 text-[10px] font-bold text-[#748078]">Later</span>}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => openPanelView('categories', 1)} className="mt-2 w-full rounded-full bg-[#26372F] px-4 py-3 text-sm font-extrabold text-white transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25">Back to categories</button>
            </div>
          )}

          {panelView === 'location' && (
            <div className="space-y-3">
              <div className={`rounded-[26px] border p-6 text-center shadow-xs ${locationStatus === 'granted' ? 'border-[#BFD2EA] bg-[#F2F7FF]' : locationStatus === 'denied' || locationStatus === 'error' || locationStatus === 'unavailable' ? 'border-[#E7C98D] bg-[#FFF6E6]' : 'border-[#D9E0D8] bg-[#FFFDF7]'}`}>
                <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${locationStatus === 'granted' ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-[#E7F0E8] text-[#2B6A4E]'}`}>
                  {locationStatus === 'requesting' ? <RefreshCw className="h-6 w-6 animate-spin" /> : <LocateFixed className="h-6 w-6" />}
                </span>
                <h2 className="mt-4 font-serif-header text-xl font-bold text-[#18241F]">{locationStatus === 'granted' ? 'You are on the map' : locationStatus === 'requesting' ? 'Finding your location' : locationStatus === 'denied' ? 'Location permission denied' : locationStatus === 'unavailable' ? 'Location unavailable' : locationStatus === 'error' ? 'Could not get location' : 'Use your current location'}</h2>
                <p className="mx-auto mt-2 max-w-[300px] text-sm font-medium leading-6 text-[#748078]">{locationStatus === 'granted' && userLocation ? `Accuracy is about ${Math.max(1, Math.round(userLocation.accuracy))} m. Distance labels now update across the map.` : locationMessage}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                  {locationStatus === 'granted' ? (
                    <>
                      <button type="button" onClick={() => centerOnUser()} className="rounded-full bg-[#2563EB] px-5 py-3 text-sm font-extrabold text-white transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/25">Center on me</button>
                      <button type="button" onClick={() => openPanelView('nearby', 1)} className="rounded-full border border-[#BFD2EA] bg-white px-5 py-3 text-sm font-extrabold text-[#1D4ED8] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/20">Show nearby</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => requestUserLocation('location')} disabled={locationStatus === 'requesting'} className="rounded-full bg-[#26372F] px-5 py-3 text-sm font-extrabold text-white transition-all disabled:cursor-wait disabled:opacity-60 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25">{locationStatus === 'requesting' ? 'Finding location…' : 'Use my location'}</button>
                  )}
                  <button type="button" onClick={() => openPanelView('categories', 1)} className="rounded-full border border-[#D1DAD2] bg-white px-5 py-3 text-sm font-extrabold text-[#35463E] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">Browse manually</button>
                </div>
              </div>
              <p className="px-2 text-center text-[11px] font-semibold leading-5 text-[#8A948D]">Your coordinates stay in this browser session and are never written to the Places database.</p>
            </div>
          )}

          {panelView === 'nearby' && (
            <div className="space-y-3">
              {!userLocation ? (
                <div className={`rounded-[26px] border p-6 text-center shadow-xs ${nearbyLocationBlocked ? 'border-[#E7C98D] bg-[#FFF6E6]' : 'border-[#D9E0D8] bg-[#FFFDF7]'}`}>
                  <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${nearbyLocationBlocked ? 'bg-[#FFF0D8] text-[#9A5A24]' : 'bg-[#E7F0E8] text-[#2B6A4E]'}`}>
                    {locationStatus === 'requesting'
                      ? <RefreshCw className="h-6 w-6 animate-spin" />
                      : nearbyLocationBlocked
                        ? <AlertTriangle className="h-6 w-6" />
                        : <Navigation className="h-6 w-6" />}
                  </span>
                  <h2 className="mt-4 font-serif-header text-xl font-bold text-[#18241F]">
                    {locationStatus === 'requesting'
                      ? 'Finding your location'
                      : locationStatus === 'denied'
                        ? 'Location permission denied'
                        : locationStatus === 'unavailable'
                          ? 'Location unavailable'
                          : locationStatus === 'error'
                            ? 'Could not get your location'
                            : 'Find places near you'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-[300px] text-sm font-medium leading-6 text-[#748078]">
                    {nearbyLocationBlocked
                      ? locationMessage
                      : 'Location stays off until you press the button. Without it, you can still browse every place normally.'}
                  </p>
                  {locationStatus === 'denied' && (
                    <p className="mx-auto mt-3 max-w-[300px] rounded-[16px] bg-white/75 px-3 py-2 text-xs font-semibold leading-5 text-[#85501D]">Allow location for this site in your browser settings, then try again.</p>
                  )}
                  <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                    <button type="button" onClick={() => requestUserLocation('nearby')} disabled={locationStatus === 'requesting'} className="rounded-full bg-[#26372F] px-5 py-3 text-sm font-extrabold text-white transition-all disabled:cursor-wait disabled:opacity-60 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25">
                      {locationStatus === 'requesting' ? 'Finding location…' : nearbyLocationBlocked ? 'Try location again' : 'Use my location'}
                    </button>
                    <button type="button" onClick={() => openPanelView('categories', 1)} className="rounded-full border border-[#D1DAD2] bg-white px-5 py-3 text-sm font-extrabold text-[#35463E] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">Browse manually</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-[22px] border border-[#BFD2EA] bg-[#F2F7FF] p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#2563EB] text-white"><LocateFixed className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-[#1E3A5F]">Location active</p><p className="mt-0.5 text-xs font-semibold text-[#64748B]">Closest places across Villaverde are listed first · accuracy about {Math.max(1, Math.round(userLocation.accuracy))} m</p></div>
                    <button type="button" onClick={() => centerOnUser()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#2563EB] shadow-sm transition-all active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/20" aria-label="Center map on my location"><LocateFixed className="h-4 w-4" /></button>
                  </div>

                  {placesDataState === 'loading' && (
                    <div className="flex items-start gap-3 rounded-[20px] border border-[#D9E0D8] bg-[#F5F4EA] p-4" role="status" aria-live="polite">
                      <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#526158]" />
                      <div><p className="text-sm font-extrabold text-[#26372F]">Updating nearby places</p><p className="mt-1 text-xs font-medium leading-5 text-[#748078]">{villaverdePlaces.length > 0 ? 'Showing available results while the live database refreshes.' : 'Loading the Villaverde Places database.'}</p></div>
                    </div>
                  )}

                  {nearbyUsesFallbackData && (
                    <div className="flex items-start gap-3 rounded-[20px] border border-[#E7C98D] bg-[#FFF6E6] p-4" role="status" aria-live="polite">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9A5A24]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-[#6F431C]">{placesDataState === 'offline' ? 'Offline nearby results' : 'Using saved nearby data'}</p>
                        <p className="mt-1 text-xs font-medium leading-5 text-[#85501D]">Distances still work from saved coordinates, but live listing updates and external directions may be unavailable.</p>
                      </div>
                      {isOnline && (
                        <button type="button" onClick={onRefreshPlaces} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/80 text-[#85501D] transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A5A24]/25" aria-label="Refresh nearby place data"><RefreshCw className="h-4 w-4" /></button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5" aria-label="Nearby place filters">
                    {MAP_CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      const isActive = selectedCategory === category.id;
                      const count = villaverdePlaces.filter((place) => category.id === 'all' || place.categoryId === category.id).length;
                      return (
                        <button key={category.id} type="button" onClick={() => setSelectedCategory(category.id)} className={`flex min-h-[58px] items-center gap-2.5 rounded-[18px] border px-3 py-2.5 text-left transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20 ${isActive ? 'shadow-sm' : 'border-[#D9E0D8] bg-[#FFFDF7]'}`} style={isActive ? { borderColor: mapAccent, backgroundColor: mapAccentSoft, color: mapAccent } : undefined} aria-pressed={isActive}>
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${isActive ? 'text-white' : 'bg-[#EEF1E8] text-[#526158]'}`} style={isActive ? { backgroundColor: mapAccent } : undefined}><Icon className="h-4 w-4" /></span>
                          <span className="min-w-0"><span className="block text-[11px] font-extrabold leading-4">{category.id === 'all' ? 'All nearby' : category.label}</span><span className="block text-[9px] font-bold opacity-70">{count}</span></span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="sr-only" aria-live="polite">{filteredPlaces.length} nearby place{filteredPlaces.length === 1 ? '' : 's'} in the selected filter.</p>

                  {nearbyIsInitialLoading ? (
                    <div className="rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] p-6 text-center" role="status">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#526158]" />
                      <p className="mt-3 text-sm font-extrabold text-[#26372F]">Loading nearby places</p>
                      <p className="mt-1 text-xs font-medium leading-5 text-[#748078]">Results will appear nearest-first when the database is ready.</p>
                    </div>
                  ) : filteredPlaces.length > 0 ? (
                    <div className="space-y-2.5">
                      {filteredPlaces.map((place, index) => {
                        const distance = distanceByPlaceId.get(place.id);
                        const openingHours = getOpeningHoursSummary(place.openingHours);
                        const openingHoursTone = openingHours.state === 'open'
                          ? 'bg-[#E7F0E8] text-[#2B6A4E]'
                          : openingHours.state === 'closed'
                            ? 'bg-[#FBE9E7] text-[#9B4338]'
                            : openingHours.state === 'check'
                              ? 'bg-[#FFF0D8] text-[#8A581F]'
                              : 'bg-[#EEF1E8] text-[#647068]';

                        return (
                          <article key={place.id} className="rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] p-3.5 shadow-xs">
                            <div className="flex items-start gap-3">
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-sm" style={{ backgroundColor: CATEGORY_MARKER_COLORS[place.categoryId] }} aria-hidden="true"><span className="text-xs font-black">{index + 1}</span></span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-extrabold text-[#26372F]">{place.name}</p>
                                <p className="mt-0.5 truncate text-xs font-medium text-[#748078]">{place.subcategory} · {place.barangay}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <span className="rounded-full bg-[#E7F0E8] px-2.5 py-1 text-[10px] font-extrabold text-[#2B6A4E]">{distance !== null && distance !== undefined ? formatDistance(distance) : '—'}</span>
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${openingHoursTone}`}>{openingHours.label}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3">
                              <button type="button" onClick={() => onOpenPlacePage(place)} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[16px] border border-[#C7D9C9] bg-[#EFF7EE] px-3 py-2.5 text-xs font-extrabold text-[#2B6A4E] transition-all hover:bg-[#E5F1E5] active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label={`Open the place page for ${place.name}`}>View place<ArrowRight className="h-4 w-4" /></button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-[#D9E0D8] bg-[#FFFDF7] p-5 text-center">
                      <p className="text-sm font-bold text-[#26372F]">{nearbyUsesFallbackData && villaverdePlaces.length === 0 ? 'No offline nearby data available' : 'No nearby places in this filter'}</p>
                      <p className="mt-1 text-xs font-medium leading-5 text-[#748078]">{nearbyUsesFallbackData && villaverdePlaces.length === 0 ? 'Reconnect and refresh the Places database, then try Nearby again.' : 'Try another category or choose All nearby.'}</p>
                      {selectedCategory !== 'all' && (
                        <button type="button" onClick={() => setSelectedCategory('all')} className="mt-4 rounded-full border border-[#C7D9C9] bg-[#EFF7EE] px-4 py-2.5 text-xs font-extrabold text-[#2B6A4E] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">Show all nearby</button>
                      )}
                    </div>
                  )}
                </>
              )}
              <button type="button" onClick={() => openPanelView('categories', 1)} className="w-full rounded-full border border-[#D1DAD2] bg-white px-4 py-3 text-sm font-extrabold text-[#35463E] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">Back to places</button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
