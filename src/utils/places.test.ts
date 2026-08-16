import assert from 'node:assert/strict';
import test from 'node:test';
import { getSafeHttpUrl, normalizePlacesCsv } from './places.ts';

const headers = [
  'Place ID', 'Name', 'Category', 'Latitude', 'Longitude', 'Facebook / Website',
].join(',');

test('external URL validation accepts only absolute HTTP and HTTPS URLs', () => {
  assert.equal(getSafeHttpUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(getSafeHttpUrl(' HTTP://EXAMPLE.COM '), 'http://example.com/');
  assert.equal(getSafeHttpUrl('javascript:alert(1)'), '');
  assert.equal(getSafeHttpUrl('data:text/html,hello'), '');
  assert.equal(getSafeHttpUrl('//example.com/path'), '');
  assert.equal(getSafeHttpUrl('example.com'), '');
});

test('CSV normalization strips unsafe website protocols', () => {
  const csv = `${headers}\nplace-1,Safe place,Food & Drinks,16.6,121.1,javascript:alert(1)`;
  const places = normalizePlacesCsv(csv);
  assert.equal(places.length, 1);
  assert.equal(places[0].website, '');
});

test('CSV normalization rejects duplicate place IDs instead of overwriting rows', () => {
  const csv = [
    headers,
    'place-1,First place,Food & Drinks,16.6,121.1,',
    'place-1,Second place,Food & Drinks,16.7,121.2,',
  ].join('\n');
  assert.throws(() => normalizePlacesCsv(csv), /Duplicate Place ID: place-1/);
});
