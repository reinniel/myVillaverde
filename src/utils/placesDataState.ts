import type { PlaceRecord, PlacesDataState } from '../types/app';

export interface PlacesFailureResult {
  places: PlaceRecord[];
  dataState: Extract<PlacesDataState, 'cached' | 'snapshot' | 'offline'>;
  message: string;
}

export const resolvePlacesFetchFailure = (
  lastSuccessfulPlaces: PlaceRecord[],
  fallbackPlaces: PlaceRecord[],
  offline: boolean,
): PlacesFailureResult => {
  const hasLiveCache = lastSuccessfulPlaces !== fallbackPlaces;

  if (offline) {
    return {
      places: lastSuccessfulPlaces,
      dataState: 'offline',
      message: hasLiveCache
        ? `${lastSuccessfulPlaces.length} places remain available from the last successful live database load.`
        : `${fallbackPlaces.length} places are available from the built-in snapshot while you are offline.`,
    };
  }

  if (hasLiveCache) {
    return {
      places: lastSuccessfulPlaces,
      dataState: 'cached',
      message: `${lastSuccessfulPlaces.length} places retained from the last successful live database load because the latest refresh failed.`,
    };
  }

  return {
    places: fallbackPlaces,
    dataState: 'snapshot',
    message: `${fallbackPlaces.length} places loaded from the built-in snapshot because the live database could not be reached.`,
  };
};
