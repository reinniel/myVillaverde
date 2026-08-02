export const PLACE_QUERY_PARAM = 'place';

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

export const removePlacePageFromUrl = () => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete(PLACE_QUERY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
};
