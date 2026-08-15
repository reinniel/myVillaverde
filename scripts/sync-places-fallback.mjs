import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(repositoryRoot, 'src/data/config.ts');
const outputPath = path.join(repositoryRoot, 'src/data/places.ts');

const parseArguments = () => {
  const args = process.argv.slice(2);
  const options = { check: false, source: '', output: '' };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--check') {
      options.check = true;
      continue;
    }
    if (argument === '--source') {
      options.source = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (argument === '--output') {
      options.output = args[index + 1] || '';
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
};

const parseCsv = (csvText) => {
  const rows = [];
  let row = [];
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

const categoryIds = new Map([
  ['food & drinks', 'food'],
  ['shops & services', 'services'],
  ['transport', 'transport'],
  ['places to visit', 'visit'],
  ['government & public services', 'government'],
]);

const isSupportedPhotoUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const parsePhotoUrls = (value) => {
  if (!value.trim()) return [];

  if (value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed
          .filter((entry) => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter(isSupportedPhotoUrl)));
      }
    } catch {
      // Fall through to the delimiter-based format used by the Sheet.
    }
  }

  return Array.from(new Set(value
    .split(/(?:\r?\n|[;|])+/)
    .map((entry) => entry.trim())
    .filter(isSupportedPhotoUrl)));
};

const normalizePlaces = (csvText) => {
  const rows = parseCsv(csvText);
  if (rows.length < 2) throw new Error('The Places source does not contain any data rows.');

  const headers = rows[0].map((header) => header.trim());
  const indexes = new Map(headers.map((header, index) => [header, index]));
  const read = (row, header) => {
    const index = indexes.get(header);
    return index === undefined ? '' : (row[index] || '').trim();
  };

  for (const requiredHeader of ['Place ID', 'Name', 'Category', 'Latitude', 'Longitude']) {
    if (!indexes.has(requiredHeader)) throw new Error(`Missing required column: ${requiredHeader}`);
  }

  const places = [];
  const seenIds = new Set();

  rows.slice(1).forEach((row, rowIndex) => {
    const id = read(row, 'Place ID');
    const name = read(row, 'Name');
    const category = read(row, 'Category');
    const status = read(row, 'Status') || 'Needs Checking';

    if (!id && !name && !category) return;
    if (['duplicate', 'permanently closed'].includes(status.toLowerCase())) return;
    if (!id || !name || !category) throw new Error(`Row ${rowIndex + 2} is missing an ID, name, or category.`);
    if (seenIds.has(id)) throw new Error(`Duplicate Place ID: ${id}`);

    const categoryId = categoryIds.get(category.toLowerCase());
    if (!categoryId) throw new Error(`Unsupported category for ${id}: ${category}`);

    const latitudeValue = Number.parseFloat(read(row, 'Latitude'));
    const longitudeValue = Number.parseFloat(read(row, 'Longitude'));
    const latitude = Number(latitudeValue.toFixed(6));
    const longitude = Number(longitudeValue.toFixed(6));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error(`Invalid coordinates for ${id}.`);
    }

    seenIds.add(id);
    places.push({
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
    });
  });

  if (places.length === 0) throw new Error('The Places source did not produce any usable records.');
  return places;
};

const readDefaultSource = async () => {
  const config = await fs.readFile(configPath, 'utf8');
  const match = config.match(/DEFAULT_PLACES_CSV_URL\s*=\s*'([^']+)'/);
  if (!match) throw new Error('Could not find DEFAULT_PLACES_CSV_URL in src/data/config.ts.');
  return match[1];
};

const readSource = async (source) => {
  if (source === '-') return fs.readFile(0, 'utf8');
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, { headers: { accept: 'text/csv' } });
    if (!response.ok) throw new Error(`Places source returned HTTP ${response.status}.`);
    return response.text();
  }
  return fs.readFile(path.resolve(repositoryRoot, source), 'utf8');
};

const serializePlaces = (places) => [
  "import type { PlaceRecord } from '../types/app';",
  '',
  `// Generated by scripts/sync-places-fallback.mjs from the canonical Places CSV (${places.length} records).`,
  `export const FALLBACK_PLACES: PlaceRecord[] = ${JSON.stringify(places, null, 2)};`,
  '',
].join('\n');

const options = parseArguments();
const source = options.source || await readDefaultSource();
const targetOutputPath = options.output ? path.resolve(repositoryRoot, options.output) : outputPath;
const places = normalizePlaces(await readSource(source));
const generated = serializePlaces(places);

if (options.check) {
  const current = await fs.readFile(targetOutputPath, 'utf8');
  if (current !== generated) {
    console.error(`Fallback data is out of sync with ${source}. Run npm run data:sync.`);
    process.exitCode = 1;
  } else {
    console.log(`Fallback data matches ${source} (${places.length} places).`);
  }
} else {
  await fs.writeFile(targetOutputPath, generated, 'utf8');
  console.log(`Updated ${path.relative(repositoryRoot, targetOutputPath)} from ${source} (${places.length} places).`);
}
