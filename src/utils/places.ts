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

const isSupportedPhotoUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

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
      website: read(row, 'Facebook / Website'),
      description: read(row, 'Short Description') || `${name} in Villaverde, Nueva Vizcaya.`,
      verificationSource: read(row, 'Verification Source'),
      sourceUrl: read(row, 'Source URL'),
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
  places.forEach((place) => uniquePlaces.set(place.id, place));
  return Array.from(uniquePlaces.values());
};

export const placeMatchesGuideCategory = (place: PlaceRecord, selection: SelectedCategory, activeBarangayName: string) => {
  if (selection.scope === 'local' && place.barangay !== activeBarangayName) return false;

  const categoryId = selection.category.id;
  if (categoryId === 'food' || categoryId === 'services' || categoryId === 'transport' || categoryId === 'visit') {
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
