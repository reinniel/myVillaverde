export const PLACE_QUERY_PARAM = 'place';
export const MAP_QUERY_PARAM = 'map';
export const BARANGAY_QUERY_PARAM = 'barangay';

export interface MapNavigation {
  scope: 'local' | 'visitor';
  barangayId: string | null;
}

export const readPlacePageIdFromUrl = () => {
  if (typeof window === 'undefined') return null;
  return new URL(window.location.href).searchParams.get(PLACE_QUERY_PARAM);
};

export const buildPlacePageUrl = (placeId: string) => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set(PLACE_QUERY_PARAM, placeId);
  return url.toString();
};

export const readMapNavigationFromUrl = (): MapNavigation | null => {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const scope = url.searchParams.get(MAP_QUERY_PARAM);
  if (scope !== 'local' && scope !== 'visitor') return null;
  return {
    scope,
    barangayId: scope === 'visitor' ? url.searchParams.get(BARANGAY_QUERY_PARAM) : null,
  };
};

export const readVisitorBarangayIdFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  return url.searchParams.has(MAP_QUERY_PARAM)
    ? null
    : url.searchParams.get(BARANGAY_QUERY_PARAM);
};

export const buildVisitorBarangayUrl = (barangayId: string) => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete(PLACE_QUERY_PARAM);
  url.searchParams.delete(MAP_QUERY_PARAM);
  url.searchParams.set(BARANGAY_QUERY_PARAM, barangayId);
  return url.toString();
};

export const buildMapUrl = (scope: 'local' | 'visitor', barangayId: string | null = null) => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete(PLACE_QUERY_PARAM);
  url.searchParams.set(MAP_QUERY_PARAM, scope);
  if (scope === 'visitor' && barangayId) {
    url.searchParams.set(BARANGAY_QUERY_PARAM, barangayId);
  } else {
    url.searchParams.delete(BARANGAY_QUERY_PARAM);
  }
  return url.toString();
};

export const removeMapFromUrl = () => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete(MAP_QUERY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
};

export const removeVisitorBarangayFromUrl = () => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete(BARANGAY_QUERY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
};

export const removePlacePageFromUrl = () => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete(PLACE_QUERY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
};
