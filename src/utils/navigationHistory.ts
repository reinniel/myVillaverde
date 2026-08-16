import type {
  CategoryScope, MapCategoryId, MapPanelView, MapReturnState, ModalId,
} from '../types/app';

export type TransientModalId = Exclude<ModalId, 'visitor-barangay' | null>;

export interface CategoryModalState {
  scope: CategoryScope;
  categoryId: string;
}

const TRANSIENT_MODALS: TransientModalId[] = ['barangay', 'saved', 'trip', 'nearby', 'category'];
const MAP_PANEL_VIEWS: MapPanelView[] = ['categories', 'layers', 'nearby', 'location'];
const MAP_CATEGORY_IDS: MapCategoryId[] = ['all', 'food', 'services', 'transport', 'visit', 'government'];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;

export const readTransientModalFromHistory = (state: unknown): TransientModalId | null => {
  const value = asRecord(state)?.myVillaverdeModal;
  return typeof value === 'string' && TRANSIENT_MODALS.includes(value as TransientModalId)
    ? value as TransientModalId
    : null;
};

export const readCategoryModalStateFromHistory = (state: unknown): CategoryModalState | null => {
  const record = asRecord(state);
  if (record?.myVillaverdeModal !== 'category') return null;
  const scope = record.myVillaverdeCategoryScope;
  const categoryId = record.myVillaverdeGuideCategoryId;
  if ((scope !== 'local' && scope !== 'visitor') || typeof categoryId !== 'string') return null;
  return { scope, categoryId };
};

export const buildTransientModalHistoryState = (
  currentState: unknown,
  modal: TransientModalId,
  categoryState: CategoryModalState | null = null,
) => ({
  ...(asRecord(currentState) ?? {}),
  myVillaverdeModal: modal,
  myVillaverdeCategoryScope: categoryState?.scope ?? null,
  myVillaverdeGuideCategoryId: categoryState?.categoryId ?? null,
});

export const readMapReturnStateFromHistory = (state: unknown): MapReturnState => {
  const record = asRecord(state);
  const panelView = record?.myVillaverdeMapPanelView;
  const categoryId = record?.myVillaverdeMapCategoryId;
  const selectedPlaceId = record?.myVillaverdeMapPlaceId;

  return {
    panelView: typeof panelView === 'string' && MAP_PANEL_VIEWS.includes(panelView as MapPanelView)
      ? panelView as MapPanelView
      : 'categories',
    categoryId: typeof categoryId === 'string' && MAP_CATEGORY_IDS.includes(categoryId as MapCategoryId)
      ? categoryId as MapCategoryId
      : 'all',
    selectedPlaceId: typeof selectedPlaceId === 'string' ? selectedPlaceId : null,
  };
};

export const buildMapReturnHistoryState = (currentState: unknown, mapState: MapReturnState) => ({
  ...(asRecord(currentState) ?? {}),
  myVillaverdeMapPanelView: mapState.panelView,
  myVillaverdeMapCategoryId: mapState.categoryId,
  myVillaverdeMapPlaceId: mapState.selectedPlaceId,
});

export const isMapPreviewHistoryState = (state: unknown) =>
  asRecord(state)?.myVillaverdeMapPreviewEntry === true;

export const buildMapPreviewHistoryState = (currentState: unknown, mapState: MapReturnState) => ({
  ...buildMapReturnHistoryState(currentState, mapState),
  myVillaverdeMapPreviewEntry: true,
});

export const buildMapWithoutPreviewHistoryState = (currentState: unknown, mapState: MapReturnState) => ({
  ...buildMapReturnHistoryState(currentState, mapState),
  myVillaverdeMapPreviewEntry: false,
});

export const readGalleryIndexFromHistory = (state: unknown, photoCount: number) => {
  const value = asRecord(state)?.myVillaverdeGalleryIndex;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < photoCount
    ? value
    : null;
};

export const buildGalleryHistoryState = (currentState: unknown, photoIndex: number) => ({
  ...(asRecord(currentState) ?? {}),
  myVillaverdeGalleryIndex: photoIndex,
});
