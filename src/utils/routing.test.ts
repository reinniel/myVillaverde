import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAppleMapsUrl, buildGoogleMapsUrl, buildOsrmRouteUrl, buildWazeUrl,
  formatRouteDuration, formatRouteInstruction,
} from './routing.ts';

const destination = {
  name: 'Sawmill Barangay Hall',
  latitude: 16.6261419,
  longitude: 121.1538272,
};

test('buildOsrmRouteUrl uses longitude-latitude coordinate order and route options', () => {
  const url = new URL(buildOsrmRouteUrl(
    { latitude: 16.632477, longitude: 121.168904 },
    destination,
  ));

  assert.equal(url.origin, 'https://router.project-osrm.org');
  assert.equal(url.pathname, '/route/v1/driving/121.168904,16.632477;121.1538272,16.6261419');
  assert.equal(url.searchParams.get('overview'), 'full');
  assert.equal(url.searchParams.get('geometries'), 'geojson');
  assert.equal(url.searchParams.get('steps'), 'true');
});

test('formatRouteInstruction creates readable turn instructions', () => {
  assert.equal(
    formatRouteInstruction({ name: 'Provincial Road', maneuver: { type: 'turn', modifier: 'right' } }),
    'Turn right onto Provincial Road',
  );
  assert.equal(
    formatRouteInstruction({ name: '', maneuver: { type: 'arrive' } }, 'Sawmill Barangay Hall'),
    'Arrive at Sawmill Barangay Hall',
  );
});

test('formatRouteDuration keeps short and hour-scale routes compact', () => {
  assert.equal(formatRouteDuration(90), '2 min');
  assert.equal(formatRouteDuration(3600), '1 hr');
  assert.equal(formatRouteDuration(4500), '1 hr 15 min');
});

test('external navigation links keep the exact destination coordinates', () => {
  assert.match(buildAppleMapsUrl(destination), /16\.6261419%2C121\.1538272/);
  assert.match(buildGoogleMapsUrl(destination), /16\.6261419%2C121\.1538272/);
  assert.match(buildWazeUrl(destination), /16\.6261419%2C121\.1538272/);
});
