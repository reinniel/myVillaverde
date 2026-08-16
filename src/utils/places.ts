import type { MapCategoryId, PlaceRecord, SelectedCategory, UserLocation } from '../types/app';

export const getPlaceCategoryId = (category: string): Exclude<MapCategoryId, 'all'> | null => {
  const normalized = category.trim().toLowerCase();
  if (normalized === 'food & drinks') return 'food';
  if (normalized === 'shops & services') return 'services';
  if (normalized === 'transport') return 'transport';
  if (normalized === 'places to visit') return 'visit';
  if (normalized === 'government & public services') return 'government';
  return null;
};

export const parseCsv = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === ',' && !quoted) {
      row.push(value);
      value = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(value);
      value = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }

    value += character;
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
};

export const getSafeHttpUrl = (value: string) => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
};

const isSupportedPhotoUrl = (value: string) => Boolean(getSafeHttpUrl(value));

const parsePhotoUrls = (value: string) => {
  if (!value.trim()) return [];

  if (value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((entry): entry is string => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter(isSupportedPhotoUrl);
      }
    } catch {
      // Fall through to the delimiter-based format used by the Sheet.
    }
  }

  return value
    .split(/(?:\r?\n|[;|])+/)
    .map((entry) => entry.trim())
    .filter(isSupportedPhotoUrl);
};

export const hasApprovedPhotoPermission = (permission = '') => {
  const normalized = permission.trim().toLowerCase().replace(/[\s_]+/g, '-');
  return normalized === 'yes' || normalized === 'owner-provided';
};

export const getApprovedPhotoUrls = (place: PlaceRecord) => {
  if (!hasApprovedPhotoPermission(place.photoPermission)) return [];

  return Array.from(new Set([
    place.coverPhotoUrl || '',
    ...(place.photoUrls || []),
  ].filter(isSupportedPhotoUrl)));
};

export const normalizePlacesCsv = (csvText: string): PlaceRecord[] => {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim());
  const column = (name: string) => headers.indexOf(name);
  const read = (row: string[], name: string) => {
    const index = column(name);
    return index >= 0 ? (row[index] || '').trim() : '';
  };

  const places = rows.slice(1).flatMap((row): PlaceRecord[] => {
    const id = read(row, 'Place ID');
    const name = read(row, 'Name');
    const category = read(row, 'Category');
    const categoryId = getPlaceCategoryId(category);
    const latitude = Number.parseFloat(read(row, 'Latitude'));
    const longitude = Number.parseFloat(read(row, 'Longitude'));
    const status = read(row, 'Status') || 'Needs Checking';

    if (!id || !name || !categoryId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    if (['duplicate', 'permanently closed'].includes(status.toLowerCase())) return [];

    return [{
      id,
      name,
      category,
      categoryId,
      subcategory: read(row, 'Subcategory') || category,
      barangay: read(row, 'Barangay') || 'Barangay not listed',
      latitude,
      longitude,
      address: read(row, 'Address / Landmark'),
      openingHours: read(row, 'Opening Hours'),
      phone: read(row, 'Phone'),
      website: getSafeHttpUrl(read(row, 'Facebook / Website')),
      description: read(row, 'Short Description') || `${name} in Villaverde, Nueva Vizcaya.`,
      verificationSource: read(row, 'Verification Source'),
      sourceUrl: getSafeHttpUrl(read(row, 'Source URL')),
      lastChecked: read(row, 'Last Checked') || read(row, 'Last Verified'),
      status,
      notes: read(row, 'Notes'),
      coverPhotoUrl: read(row, 'Cover Photo URL'),
      photoUrls: parsePhotoUrls(read(row, 'Photo URLs')),
      photoSource: read(row, 'Photo Source'),
      photoCredit: read(row, 'Photo Credit'),
      photoPermission: read(row, 'Photo Permission'),
    }];
  });

  const uniquePlaces = new Map<string, PlaceRecord>();
  places.forEach((place) => {
    if (uniquePlaces.has(place.id)) throw new Error(`Duplicate Place ID: ${place.id}`);
    uniquePlaces.set(place.id, place);
  });
  return Array.from(uniquePlaces.values());
};

export const placeMatchesGuideCategory = (place: PlaceRecord, selection: SelectedCategory, activeBarangayName: string) => {
  if (selection.scope === 'local' && place.barangay !== activeBarangayName) return false;

  const categoryId = selection.category.id;
  if (categoryId === 'food' || categoryId === 'services' || categoryId === 'transport' || categoryId === 'visit' || categoryId === 'government') {
    return place.categoryId === categoryId;
  }

  if (categoryId === 'must-see') return place.categoryId === 'visit';
  if (categoryId === 'local-eats') return place.categoryId === 'food';
  if (categoryId === 'getting-around') return place.categoryId === 'transport';
  if (categoryId === 'local-finds') return place.categoryId === 'services';

  if (categoryId === 'stay') {
    const searchableText = `${place.name} ${place.subcategory} ${place.description}`.toLowerCase();
    return place.categoryId === 'services' && [
      'hotel',
      'inn',
      'lodge',
      'lodging',
      'hostel',
      'homestay',
      'guesthouse',
      'guest house',
      'resort',
      'accommodation',
      'stay',
      'rest stop',
    ].some((keyword) => searchableText.includes(keyword));
  }

  return false;
};

export const getDirectionsUrl = (place: PlaceRecord) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`;

export const MAX_TRIP_STOPS = 4;

export const getTripDirectionsUrl = (places: PlaceRecord[]) => {
  const stops = places.slice(0, MAX_TRIP_STOPS);
  if (stops.length === 0) return '';
  if (stops.length === 1) return getDirectionsUrl(stops[0]);

  const destination = stops[stops.length - 1];
  const waypoints = stops
    .slice(0, -1)
    .map((place) => `${place.latitude},${place.longitude}`)
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${destination.latitude},${destination.longitude}`)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
};


export const toRadians = (value: number) => value * (Math.PI / 180);

export const getDistanceMeters = (from: Pick<UserLocation, 'latitude' | 'longitude'>, to: Pick<PlaceRecord, 'latitude' | 'longitude'>) => {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
};

export const formatDistance = (distanceMeters: number) => {
  if (distanceMeters < 1000) return `${Math.max(1, Math.round(distanceMeters / 10) * 10)} m`;
  const kilometers = distanceMeters / 1000;
  return `${kilometers < 10 ? kilometers.toFixed(1) : Math.round(kilometers)} km`;
};

export type OpeningHoursState = 'open' | 'closed' | 'check' | 'unknown';

export interface OpeningHoursSummary {
  state: OpeningHoursState;
  label: string;
  detail: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const expandWeekdays = (value: string) => {
  const indexes = new Set<number>();

  value.split(',').forEach((token) => {
    const [startName, endName] = token.trim().split(/\s*-\s*/);
    const startIndex = WEEKDAYS.findIndex((day) => day.toLowerCase() === startName?.slice(0, 3).toLowerCase());
    const endIndex = endName
      ? WEEKDAYS.findIndex((day) => day.toLowerCase() === endName.slice(0, 3).toLowerCase())
      : startIndex;
    if (startIndex < 0 || endIndex < 0) return;

    let index = startIndex;
    indexes.add(index);
    while (index !== endIndex) {
      index = (index + 1) % WEEKDAYS.length;
      indexes.add(index);
    }
  });

  return Array.from(indexes);
};

const parse24HourTime = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes > 59 || hours > 24 || (hours === 24 && minutes !== 0)) return null;
  return (hours * 60) + minutes;
};

interface WeeklyHoursWindow {
  days: number[];
  start: number;
  end: number;
}

const parseWeeklyHours = (value: string) => {
  const windows: WeeklyHoursWindow[] = [];
  let recognizedSegments = 0;

  value.split(';').forEach((segment) => {
    const match = segment.trim().match(/^([A-Za-z]{3,9}(?:\s*-\s*[A-Za-z]{3,9})?(?:\s*,\s*[A-Za-z]{3,9})*)\s+(.+)$/);
    if (!match) return;

    const days = expandWeekdays(match[1]);
    if (days.length === 0) return;
    const hoursText = match[2].trim();
    if (/^closed$/i.test(hoursText)) {
      recognizedSegments += 1;
      return;
    }

    const timeMatch = hoursText.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (!timeMatch) return;
    const start = parse24HourTime(timeMatch[1]);
    const end = parse24HourTime(timeMatch[2]);
    if (start === null || end === null) return;

    recognizedSegments += 1;
    windows.push({ days, start, end });
  });

  return recognizedSegments > 0 ? windows : null;
};

const getVillaverdeClock = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';

  return {
    weekday: WEEKDAYS.findIndex((day) => day === read('weekday').slice(0, 3)),
    minutes: (Number(read('hour')) * 60) + Number(read('minute')),
  };
};

export const getOpeningHoursSummary = (openingHours: string, now = new Date()): OpeningHoursSummary => {
  const value = openingHours.trim();
  if (!value) {
    return {
      state: 'unknown',
      label: 'Hours unavailable',
      detail: 'Confirm opening hours before visiting.',
    };
  }

  if (/^open 24 hours$/i.test(value)) {
    return {
      state: 'open',
      label: 'Open 24 hours',
      detail: value,
    };
  }

  const weeklyHours = parseWeeklyHours(value);
  if (!weeklyHours) {
    return {
      state: 'check',
      label: 'Check current hours',
      detail: value,
    };
  }

  const clock = getVillaverdeClock(now);
  const previousWeekday = (clock.weekday - 1 + WEEKDAYS.length) % WEEKDAYS.length;
  const isOpen = weeklyHours.some((window) => {
    if (window.end > window.start) {
      return window.days.includes(clock.weekday)
        && clock.minutes >= window.start
        && clock.minutes < window.end;
    }

    return (window.days.includes(clock.weekday) && clock.minutes >= window.start)
      || (window.days.includes(previousWeekday) && clock.minutes < window.end);
  });

  return {
    state: isOpen ? 'open' : 'closed',
    label: isOpen ? 'Open now' : 'Closed now',
    detail: value,
  };
};

export const formatWebsiteLabel = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value;
  }
};

export const formatCheckedDate = (value: string) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
