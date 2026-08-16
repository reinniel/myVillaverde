import assert from 'node:assert/strict';
import test from 'node:test';
import type { PlaceRecord } from '../types/app.ts';
import { resolvePlacesFetchFailure } from './placesDataState.ts';

const place = (id: string) => ({ id } as PlaceRecord);

test('an online refresh failure retains the last successful live dataset', () => {
  const fallback = [place('fallback')];
  const lastLive = [place('live-1'), place('live-2')];
  const result = resolvePlacesFetchFailure(lastLive, fallback, false);
  assert.equal(result.places, lastLive);
  assert.equal(result.dataState, 'cached');
  assert.match(result.message, /last successful live database load/);
});

test('an initial online failure uses the bundled snapshot', () => {
  const fallback = [place('fallback')];
  const result = resolvePlacesFetchFailure(fallback, fallback, false);
  assert.equal(result.places, fallback);
  assert.equal(result.dataState, 'snapshot');
});

test('offline mode keeps the best available dataset', () => {
  const fallback = [place('fallback')];
  const lastLive = [place('live')];
  const result = resolvePlacesFetchFailure(lastLive, fallback, true);
  assert.equal(result.places, lastLive);
  assert.equal(result.dataState, 'offline');
});
