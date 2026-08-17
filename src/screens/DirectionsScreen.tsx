import React, { useCallback, useEffect, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle, ArrowLeft, Car, Check, ChevronRight, Clock3, ExternalLink, LocateFixed,
  MapPin, Navigation, RefreshCw, Route, Smartphone, X,
} from 'lucide-react';
import type { LocationStatus, UserLocation } from '../types/app';
import { formatDistance } from '../utils/places';
import {
  buildAppleMapsUrl, buildGoogleMapsUrl, buildWazeUrl, fetchDrivingRoute,
  formatRouteDuration, type DrivingRoute, type RouteTarget,
} from '../utils/routing';

interface DirectionsScreenProps {
  destination: RouteTarget;
  onBack: () => void;
}

type RouteStatus = 'idle' | 'loading' | 'ready' | 'error';

const RouteViewport: React.FC<{
  destination: RouteTarget;
  userLocation: UserLocation | null;
  route: DrivingRoute | null;
}> = ({ destination, userLocation, route }) => {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = route?.geometry.length
      ? route.geometry
      : userLocation
        ? [[userLocation.latitude, userLocation.longitude], [destination.latitude, destination.longitude]]
        : [[destination.latitude, destination.longitude]];

    if (points.length === 1) {
      map.setView(points[0], 16, { animate: false });
      return;
    }

    map.fitBounds(points as LatLngBoundsExpression, {
      paddingTopLeft: [34, 52],
      paddingBottomRight: [34, 52],
      maxZoom: 16,
      animate: false,
    });
  }, [destination.latitude, destination.longitude, map, route, userLocation]);

  return null;
};

const ExternalNavigationSheet: React.FC<{
  destination: RouteTarget;
  onClose: () => void;
}> = ({ destination, onClose }) => (
  <div className="absolute inset-0 z-[80] flex items-end bg-[#17231D]/35 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="w-full rounded-[30px] border border-white/80 bg-[#FFFDF7] p-4 shadow-[0_24px_70px_rgba(23,35,29,.28)]" role="dialog" aria-modal="true" aria-labelledby="external-navigation-title">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#748078]">Navigation apps</p>
          <h2 id="external-navigation-title" className="mt-1 font-serif-header text-xl font-bold text-[#18241F]">Open somewhere else</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#748078]">myVillaverde stays the default. Pick another app only when you want it.</p>
        </div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEF1E8] text-[#35463E] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label="Close navigation app choices"><X className="h-4.5 w-4.5" /></button>
      </div>

      <div className="mt-4 grid gap-2">
        <a data-native-directions-external="true" href={buildAppleMapsUrl(destination)} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 rounded-[20px] border border-[#D9E0D8] bg-white px-4 text-left font-extrabold text-[#26372F] transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"><Smartphone className="h-5 w-5 text-[#2B6A4E]" /><span className="flex-1">Apple Maps</span><ExternalLink className="h-4 w-4 text-[#89928A]" /></a>
        <a data-native-directions-external="true" href={buildWazeUrl(destination)} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 rounded-[20px] border border-[#D9E0D8] bg-white px-4 text-left font-extrabold text-[#26372F] transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"><Navigation className="h-5 w-5 text-[#2B6A4E]" /><span className="flex-1">Waze</span><ExternalLink className="h-4 w-4 text-[#89928A]" /></a>
        <a data-native-directions-external="true" href={buildGoogleMapsUrl(destination)} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 rounded-[20px] border border-[#D9E0D8] bg-white px-4 text-left font-extrabold text-[#26372F] transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"><MapPin className="h-5 w-5 text-[#2B6A4E]" /><span className="flex-1">Google Maps</span><ExternalLink className="h-4 w-4 text-[#89928A]" /></a>
      </div>
    </section>
  </div>
);

export const DirectionsScreen: React.FC<DirectionsScreenProps> = ({ destination, onBack }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationMessage, setLocationMessage] = useState('Your location is needed to build a route.');
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle');
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [routeError, setRouteError] = useState('');
  const [showExternalApps, setShowExternalApps] = useState(false);

  const requestLocation = useCallback(() => {
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
        const nextLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.max(0, position.coords.accuracy || 0),
          updatedAt: position.timestamp || Date.now(),
        };
        setUserLocation(nextLocation);
        setLocationStatus('granted');
        setLocationMessage('Current location ready.');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setLocationMessage('Location permission was denied. Enable it in your browser settings or use another navigation app.');
          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationStatus('unavailable');
          setLocationMessage('Your device could not determine a current location.');
          return;
        }
        setLocationStatus('error');
        setLocationMessage('Location took too long or encountered an error. Try again.');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
  }, [locationStatus]);

  useEffect(() => {
    requestLocation();
    // The explicit Directions tap is the user gesture that enters this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userLocation) {
      setRoute(null);
      setRouteStatus('idle');
      return;
    }

    const controller = new AbortController();
    setRouteStatus('loading');
    setRouteError('');

    void fetchDrivingRoute(userLocation, destination, controller.signal)
      .then((nextRoute) => {
        setRoute(nextRoute);
        setRouteStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setRoute(null);
        setRouteStatus('error');
        setRouteError(error instanceof Error ? error.message : 'Could not calculate a driving route.');
      });

    return () => controller.abort();
  }, [destination, userLocation]);

  const routeMessage = routeStatus === 'loading'
    ? 'Calculating a route from OpenStreetMap road data…'
    : routeStatus === 'error'
      ? routeError || 'Could not calculate a route.'
      : routeStatus === 'ready'
        ? 'Route ready.'
        : locationMessage;

  return (
    <main className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#EEF1E8] sm:h-[864px]" aria-label={`Directions to ${destination.name}`} aria-busy={locationStatus === 'requesting' || routeStatus === 'loading'}>
      <header className="relative z-40 flex shrink-0 items-center gap-3 border-b border-white/70 bg-[#EEF1E8]/95 px-[max(1rem,env(safe-area-inset-left))] pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl" style={{ paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        <button type="button" onClick={onBack} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FFFDF7] text-[#26372F] shadow-sm transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label="Back to place page"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1 text-center">
          <p className="font-serif-header text-[18px] font-bold leading-tight text-[#18241F]">my<span className="text-[#2B6A4E]">Villaverde</span></p>
          <p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#748078]">Directions</p>
        </div>
        <button type="button" onClick={() => setShowExternalApps(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FFFDF7] text-[#26372F] shadow-sm transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20" aria-label="Open in another navigation app"><ExternalLink className="h-5 w-5" /></button>
      </header>

      <section className="relative h-[42%] min-h-[250px] shrink-0 border-b border-[#D2DAD2]" aria-label="Route map">
        <MapContainer
          center={[destination.latitude, destination.longitude]}
          zoom={16}
          minZoom={11}
          maxZoom={18}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          <RouteViewport destination={destination} userLocation={userLocation} route={route} />

          {route && <Polyline positions={route.geometry} pathOptions={{ color: '#2B6A4E', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />}

          {userLocation && (
            <>
              <Circle center={[userLocation.latitude, userLocation.longitude]} radius={Math.max(12, userLocation.accuracy)} interactive={false} pathOptions={{ color: '#2563EB', fillColor: '#3B82F6', fillOpacity: 0.08, opacity: 0.28, weight: 1.5 }} />
              <CircleMarker center={[userLocation.latitude, userLocation.longitude]} radius={9} pathOptions={{ color: '#FFFFFF', fillColor: '#2563EB', fillOpacity: 1, opacity: 1, weight: 3 }}>
                <Tooltip direction="top" offset={[0, -9]} opacity={1}>You are here</Tooltip>
              </CircleMarker>
            </>
          )}

          <CircleMarker center={[destination.latitude, destination.longitude]} radius={10} pathOptions={{ color: '#FFFFFF', fillColor: '#B5753D', fillOpacity: 1, opacity: 1, weight: 3 }}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>{destination.name}</Tooltip>
          </CircleMarker>
        </MapContainer>

        <div className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-full bg-[#FFFDF7]/92 px-2.5 py-1 text-[9px] font-bold text-[#627066] shadow-sm backdrop-blur-sm">
          Routing: OSRM · Map data © OpenStreetMap contributors
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[max(1rem,env(safe-area-inset-left))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4" style={{ paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        <div className="rounded-[26px] border border-[#D9E0D8] bg-[#FFFDF7] p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F6E7D5] text-[#8A5726]"><MapPin className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#89928A]">Destination</p>
              <h1 className="mt-1 font-serif-header text-xl font-bold leading-tight text-[#18241F] [overflow-wrap:anywhere]">{destination.name}</h1>
              <p className="mt-1 text-xs font-semibold text-[#748078]">{destination.latitude.toFixed(6)}, {destination.longitude.toFixed(6)}</p>
            </div>
          </div>

          {routeStatus === 'ready' && route ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[18px] bg-[#EEF1E8] px-3 py-3"><div className="flex items-center gap-1.5 text-[#2B6A4E]"><Route className="h-4 w-4" /><span className="text-[10px] font-extrabold uppercase tracking-[0.08em]">Distance</span></div><p className="mt-1 text-lg font-extrabold text-[#26372F]">{formatDistance(route.distanceMeters)}</p></div>
              <div className="rounded-[18px] bg-[#EEF1E8] px-3 py-3"><div className="flex items-center gap-1.5 text-[#2B6A4E]"><Clock3 className="h-4 w-4" /><span className="text-[10px] font-extrabold uppercase tracking-[0.08em]">Drive time</span></div><p className="mt-1 text-lg font-extrabold text-[#26372F]">{formatRouteDuration(route.durationSeconds)}</p></div>
            </div>
          ) : (
            <div className={`mt-4 flex items-start gap-3 rounded-[18px] px-3.5 py-3 ${routeStatus === 'error' || locationStatus === 'denied' || locationStatus === 'unavailable' || locationStatus === 'error' ? 'bg-[#FFF0D8] text-[#8A5726]' : 'bg-[#EEF1E8] text-[#526158]'}`}>
              {routeStatus === 'loading' || locationStatus === 'requesting' ? <RefreshCw className="mt-0.5 h-4.5 w-4.5 shrink-0 animate-spin" /> : routeStatus === 'error' || locationStatus === 'denied' || locationStatus === 'unavailable' || locationStatus === 'error' ? <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" /> : <LocateFixed className="mt-0.5 h-4.5 w-4.5 shrink-0" />}
              <p className="text-xs font-bold leading-5">{routeMessage}</p>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={requestLocation} disabled={locationStatus === 'requesting'} className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-[#D1DAD2] bg-white px-3 text-xs font-extrabold text-[#35463E] transition active:scale-[0.99] disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20"><LocateFixed className="h-4 w-4" />{userLocation ? 'Refresh location' : 'Use my location'}</button>
            <button type="button" onClick={() => setShowExternalApps(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-[#26372F] px-3 text-xs font-extrabold text-white transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25"><ExternalLink className="h-4 w-4" />Other navigation app</button>
          </div>
        </div>

        {routeStatus === 'ready' && route && (
          <section className="mt-4 rounded-[26px] border border-[#D9E0D8] bg-[#FFFDF7] p-4 shadow-xs" aria-labelledby="route-steps-title">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#89928A]">Driving route</p><h2 id="route-steps-title" className="mt-1 font-serif-header text-xl font-bold text-[#18241F]">Route steps</h2></div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDEBDF] px-3 py-1.5 text-[10px] font-extrabold text-[#2B6A4E]"><Check className="h-3.5 w-3.5" />Ready</span>
            </div>

            <ol className="mt-3 divide-y divide-[#E7EAE3]">
              {route.steps.map((step, index) => (
                <li key={`${index}-${step.instruction}`} className="flex gap-3 py-3.5 first:pt-2 last:pb-1">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EEF1E8] text-[#2B6A4E]"><ChevronRight className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-extrabold leading-5 text-[#35463E]">{step.instruction}</p>{step.distanceMeters > 0 && <p className="mt-1 text-[11px] font-semibold text-[#89928A]">{formatDistance(step.distanceMeters)}</p>}</div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <p className="mt-4 px-2 text-center text-[10px] font-semibold leading-4 text-[#89928A]">Route guidance is a preview based on OpenStreetMap road data. Follow posted signs and local road conditions.</p>
      </section>

      {showExternalApps && <ExternalNavigationSheet destination={destination} onClose={() => setShowExternalApps(false)} />}
    </main>
  );
};
