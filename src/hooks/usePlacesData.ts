import { useCallback, useEffect, useRef, useState } from 'react';
import { PLACES_CSV_URL } from '../data/config';
import { FALLBACK_PLACES } from '../data/places';
import type { PlaceRecord, PlacesDataState } from '../types/app';
import { normalizePlacesCsv } from '../utils/places';

export const usePlacesData = () => {
  const [places, setPlaces] = useState<PlaceRecord[]>(FALLBACK_PLACES);
  const [dataState, setDataState] = useState<PlacesDataState>('loading');
  const [loadMessage, setLoadMessage] = useState('Connecting to the Places sheet...');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const lastSuccessfulPlacesRef = useRef<PlaceRecord[]>(FALLBACK_PLACES);
  const activeControllerRef = useRef<AbortController | null>(null);

  const getOfflinePlaces = useCallback(() => {
    const availablePlaces = lastSuccessfulPlacesRef.current;
    const isLiveCache = availablePlaces !== FALLBACK_PLACES;
    return {
      availablePlaces,
      message: isLiveCache
        ? `${availablePlaces.length} places remain available from the last successful live database load.`
        : `${FALLBACK_PLACES.length} places are available from the built-in snapshot while you are offline.`,
    };
  }, []);

  const refresh = useCallback(() => {
    const online = typeof navigator === 'undefined' ? true : navigator.onLine;
    setIsOnline(online);

    if (!online) {
      const offlineData = getOfflinePlaces();
      activeControllerRef.current?.abort();
      setPlaces(offlineData.availablePlaces);
      setDataState('offline');
      setLoadMessage(offlineData.message);
      return;
    }

    setReloadVersion((version) => version + 1);
  }, [getOfflinePlaces]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    activeControllerRef.current = controller;

    const loadPlaces = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const offlineData = getOfflinePlaces();
        setIsOnline(false);
        setPlaces(offlineData.availablePlaces);
        setDataState('offline');
        setLoadMessage(offlineData.message);
        return;
      }

      setIsOnline(true);
      setDataState('loading');
      setLoadMessage('Connecting to the Places sheet...');

      try {
        const response = await fetch(`${PLACES_CSV_URL}${PLACES_CSV_URL.includes('?') ? '&' : '?'}v=${Date.now()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Places feed returned ${response.status}.`);

        const livePlaces = normalizePlacesCsv(await response.text());
        if (livePlaces.length === 0) throw new Error('The Places feed did not contain usable rows.');
        if (cancelled) return;

        lastSuccessfulPlacesRef.current = livePlaces;
        setPlaces(livePlaces);
        setDataState('live');
        setLoadMessage(`${livePlaces.length} places loaded from the live database.`);
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;
        console.warn('Using built-in place snapshot because the live Sheet feed could not load.', error);

        const offline = typeof navigator !== 'undefined' && !navigator.onLine;
        setIsOnline(!offline);
        if (offline) {
          const offlineData = getOfflinePlaces();
          setPlaces(offlineData.availablePlaces);
          setDataState('offline');
          setLoadMessage(offlineData.message);
        } else {
          setPlaces(FALLBACK_PLACES);
          setDataState('snapshot');
          setLoadMessage(`${FALLBACK_PLACES.length} places loaded from the built-in snapshot because the live database could not be reached.`);
        }
      }
    };

    void loadPlaces();
    return () => {
      cancelled = true;
      controller.abort();
      if (activeControllerRef.current === controller) activeControllerRef.current = null;
    };
  }, [getOfflinePlaces, reloadVersion]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setReloadVersion((version) => version + 1);
    };
    const handleOffline = () => {
      const offlineData = getOfflinePlaces();
      activeControllerRef.current?.abort();
      setIsOnline(false);
      setPlaces(offlineData.availablePlaces);
      setDataState('offline');
      setLoadMessage(offlineData.message);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [getOfflinePlaces]);

  return { places, dataState, loadMessage, isOnline, refresh };
};
