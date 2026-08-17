import React, { useEffect, useState, type ReactNode } from 'react';
import { DirectionsScreen } from '../screens/DirectionsScreen';
import type { RouteTarget } from '../utils/routing';

interface NativeDirectionsBridgeProps {
  children: ReactNode;
}

interface StoredDirectionsState {
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
}

const DIRECTIONS_STATE_KEY = 'myVillaverdeDirections';

const readDirectionsState = (state: unknown): RouteTarget | null => {
  if (!state || typeof state !== 'object') return null;
  const stored = (state as Record<string, unknown>)[DIRECTIONS_STATE_KEY] as StoredDirectionsState | undefined;
  if (!stored || typeof stored !== 'object') return null;
  const name = typeof stored.name === 'string' ? stored.name.trim() : '';
  const latitude = typeof stored.latitude === 'number' ? stored.latitude : Number.NaN;
  const longitude = typeof stored.longitude === 'number' ? stored.longitude : Number.NaN;
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { name, latitude, longitude };
};

const parseGoogleDirectionsDestination = (href: string) => {
  try {
    const url = new URL(href, window.location.href);
    if (url.hostname !== 'www.google.com' && url.hostname !== 'google.com') return null;
    if (!url.pathname.startsWith('/maps/dir')) return null;
    const destination = url.searchParams.get('destination');
    if (!destination) return null;
    const [latitudeText, longitudeText] = destination.split(',');
    const latitude = Number.parseFloat(latitudeText || '');
    const longitude = Number.parseFloat(longitudeText || '');
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
};

const readVisiblePlaceName = () => {
  const heading = document.querySelector('main h1');
  const value = heading?.textContent?.trim();
  return value || 'Selected place';
};

export const NativeDirectionsBridge: React.FC<NativeDirectionsBridgeProps> = ({ children }) => {
  const [destination, setDestination] = useState<RouteTarget | null>(() =>
    typeof window === 'undefined' ? null : readDirectionsState(window.history.state),
  );

  useEffect(() => {
    const handlePopState = () => setDestination(readDirectionsState(window.history.state));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const interceptDirections = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!new URL(window.location.href).searchParams.get('place')) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.dataset.nativeDirectionsExternal === 'true') return;

      const coordinates = parseGoogleDirectionsDestination(anchor.href);
      if (!coordinates) return;

      event.preventDefault();
      event.stopPropagation();

      const nextDestination: RouteTarget = {
        name: readVisiblePlaceName(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };

      window.history.pushState(
        { ...window.history.state, [DIRECTIONS_STATE_KEY]: nextDestination },
        '',
        window.location.href,
      );
      setDestination(nextDestination);
    };

    document.addEventListener('click', interceptDirections, true);
    return () => document.removeEventListener('click', interceptDirections, true);
  }, []);

  const closeDirections = () => {
    if (readDirectionsState(window.history.state)) {
      window.history.back();
      return;
    }
    setDestination(null);
  };

  return (
    <>
      {children}
      {destination && (
        <div className="fixed inset-0 z-[9999] bg-[#D7DED2] sm:py-6">
          <div className="relative mx-auto h-full max-w-md overflow-hidden bg-[#EEF1E8] shadow-2xl sm:h-[864px] sm:rounded-[36px] sm:border-[8px] sm:border-[#9CAD9E]/25">
            <DirectionsScreen destination={destination} onBack={closeDirections} />
          </div>
        </div>
      )}
    </>
  );
};
