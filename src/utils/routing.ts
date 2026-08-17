import type { UserLocation } from '../types/app';

export const OSRM_ROUTING_BASE_URL = 'https://router.project-osrm.org';

export interface RouteTarget {
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  roadName: string;
}

export interface DrivingRoute {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
  steps: RouteStep[];
}

interface OsrmManeuver {
  type?: string;
  modifier?: string;
  exit?: number;
}

interface OsrmStep {
  distance?: number;
  duration?: number;
  name?: string;
  destinations?: string;
  maneuver?: OsrmManeuver;
}

interface OsrmRoute {
  distance?: number;
  duration?: number;
  geometry?: {
    type?: string;
    coordinates?: [number, number][];
  };
  legs?: Array<{ steps?: OsrmStep[] }>;
}

interface OsrmResponse {
  code?: string;
  message?: string;
  routes?: OsrmRoute[];
}

const normalizeRoadName = (step: OsrmStep) => (step.name || step.destinations || '').trim();

const withRoad = (instruction: string, roadName: string) =>
  roadName ? `${instruction} onto ${roadName}` : instruction;

const capitalize = (value: string) => value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

export const formatRouteInstruction = (step: OsrmStep, destinationName = 'your destination') => {
  const maneuver = step.maneuver || {};
  const type = (maneuver.type || 'continue').toLowerCase();
  const modifier = (maneuver.modifier || '').toLowerCase();
  const roadName = normalizeRoadName(step);

  if (type === 'depart') {
    const direction = modifier ? ` ${modifier}` : '';
    return roadName ? `Start${direction} on ${roadName}` : `Start${direction}`;
  }

  if (type === 'arrive') return `Arrive at ${destinationName}`;

  if (type === 'roundabout' || type === 'rotary' || type === 'roundabout turn') {
    const exit = maneuver.exit ? ` and take exit ${maneuver.exit}` : '';
    return withRoad(`Enter the roundabout${exit}`, roadName);
  }

  if (type === 'merge') {
    const direction = modifier ? ` ${modifier}` : '';
    return withRoad(`Merge${direction}`, roadName);
  }

  if (type === 'fork') {
    const direction = modifier === 'left' || modifier === 'slight left'
      ? 'left'
      : modifier === 'right' || modifier === 'slight right'
        ? 'right'
        : modifier;
    return withRoad(direction ? `Keep ${direction}` : 'Keep at the fork', roadName);
  }

  if (type === 'end of road') {
    const direction = modifier ? ` ${modifier}` : '';
    return withRoad(`At the end of the road, turn${direction}`, roadName);
  }

  if (type === 'on ramp') {
    const direction = modifier ? ` ${modifier}` : '';
    return withRoad(`Take the ramp${direction}`, roadName);
  }

  if (type === 'off ramp') {
    const direction = modifier ? ` ${modifier}` : '';
    return withRoad(`Take the exit${direction}`, roadName);
  }

  if (type === 'new name' || type === 'continue' || type === 'notification') {
    return roadName ? `Continue on ${roadName}` : 'Continue';
  }

  if (type === 'turn') {
    const direction = modifier ? ` ${modifier}` : '';
    return withRoad(`Turn${direction}`, roadName);
  }

  const fallback = capitalize(type.replace(/_/g, ' '));
  const direction = modifier ? ` ${modifier}` : '';
  return withRoad(`${fallback}${direction}`, roadName);
};

export const buildOsrmRouteUrl = (
  start: Pick<UserLocation, 'latitude' | 'longitude'>,
  destination: Pick<RouteTarget, 'latitude' | 'longitude'>,
) => {
  const coordinates = `${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}`;
  const url = new URL(`/route/v1/driving/${coordinates}`, OSRM_ROUTING_BASE_URL);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'true');
  url.searchParams.set('alternatives', 'false');
  return url.toString();
};

export const fetchDrivingRoute = async (
  start: Pick<UserLocation, 'latitude' | 'longitude'>,
  destination: RouteTarget,
  signal?: AbortSignal,
): Promise<DrivingRoute> => {
  const response = await fetch(buildOsrmRouteUrl(start, destination), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) throw new Error(`Routing request failed (${response.status})`);

  const payload = await response.json() as OsrmResponse;
  if (payload.code !== 'Ok' || !payload.routes?.length) {
    throw new Error(payload.message || (payload.code === 'NoRoute' ? 'No route found.' : 'Routing service returned no route.'));
  }

  const route = payload.routes[0];
  const coordinates = route.geometry?.coordinates || [];
  if (!coordinates.length) throw new Error('Routing service returned no route geometry.');

  return {
    distanceMeters: Number(route.distance) || 0,
    durationSeconds: Number(route.duration) || 0,
    geometry: coordinates.map(([longitude, latitude]) => [latitude, longitude]),
    steps: (route.legs || [])
      .flatMap((leg) => leg.steps || [])
      .map((step) => ({
        instruction: formatRouteInstruction(step, destination.name),
        distanceMeters: Number(step.distance) || 0,
        durationSeconds: Number(step.duration) || 0,
        roadName: normalizeRoadName(step),
      })),
  };
};

export const formatRouteDuration = (durationSeconds: number) => {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
};

export const buildAppleMapsUrl = (destination: RouteTarget) =>
  `https://maps.apple.com/?daddr=${encodeURIComponent(`${destination.latitude},${destination.longitude}`)}&dirflg=d`;

export const buildGoogleMapsUrl = (destination: RouteTarget) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${destination.latitude},${destination.longitude}`)}&travelmode=driving`;

export const buildWazeUrl = (destination: RouteTarget) =>
  `https://www.waze.com/ul?ll=${encodeURIComponent(`${destination.latitude},${destination.longitude}`)}&navigate=yes`;
