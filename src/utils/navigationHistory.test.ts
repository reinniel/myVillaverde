import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGalleryHistoryState, buildMapPreviewHistoryState, buildMapReturnHistoryState,
  buildMapWithoutPreviewHistoryState, buildTransientModalHistoryState, isMapPreviewHistoryState,
  readCategoryModalStateFromHistory, readGalleryIndexFromHistory,
  readMapReturnStateFromHistory, readTransientModalFromHistory,
} from './navigationHistory.ts';

test('transient modal history keeps the URL-independent overlay identity', () => {
  const state = buildTransientModalHistoryState({ existing: true }, 'saved');
  assert.equal(readTransientModalFromHistory(state), 'saved');
  assert.equal((state as Record<string, unknown>).existing, true);
  assert.equal(readTransientModalFromHistory({ myVillaverdeModal: 'visitor-barangay' }), null);
});

test('category modal history preserves its scope and category id', () => {
  const state = buildTransientModalHistoryState({}, 'category', {
    scope: 'visitor',
    categoryId: 'local-eats',
  });
  assert.deepEqual(readCategoryModalStateFromHistory(state), {
    scope: 'visitor',
    categoryId: 'local-eats',
  });
});

test('map return history restores valid context and rejects stale values', () => {
  const state = buildMapReturnHistoryState({}, {
    panelView: 'nearby',
    categoryId: 'food',
    selectedPlaceId: null,
  });
  assert.deepEqual(readMapReturnStateFromHistory(state), {
    panelView: 'nearby',
    categoryId: 'food',
    selectedPlaceId: null,
  });
  assert.deepEqual(readMapReturnStateFromHistory({
    myVillaverdeMapPanelView: 'broken',
    myVillaverdeMapCategoryId: 'missing',
    myVillaverdeMapPlaceId: 42,
  }), {
    panelView: 'categories',
    categoryId: 'all',
    selectedPlaceId: null,
  });
});

test('map marker previews get a distinct disposable history entry', () => {
  const mapState = { panelView: 'categories', categoryId: 'government', selectedPlaceId: 'police' } as const;
  const previewState = buildMapPreviewHistoryState({ myVillaverdeMapEntry: true }, mapState);

  assert.equal(isMapPreviewHistoryState(previewState), true);
  assert.deepEqual(readMapReturnStateFromHistory(previewState), mapState);
  assert.equal(isMapPreviewHistoryState(buildMapWithoutPreviewHistoryState(previewState, {
    ...mapState,
    selectedPlaceId: null,
  })), false);
});

test('gallery history accepts only an in-range integer index', () => {
  const state = buildGalleryHistoryState({}, 2);
  assert.equal(readGalleryIndexFromHistory(state, 3), 2);
  assert.equal(readGalleryIndexFromHistory(state, 2), null);
  assert.equal(readGalleryIndexFromHistory({ myVillaverdeGalleryIndex: 0.5 }, 3), null);
});
