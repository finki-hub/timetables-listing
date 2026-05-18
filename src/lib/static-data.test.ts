import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { EduPageTimetablePayload, TimetableManifest } from '@/lib/types';

import { resolveTimetable } from '@/lib/resolve-cards';

const timetableDirectory = fileURLToPath(
  new URL('../../public/timetables', import.meta.url),
);
const requiredTables = [
  'classes',
  'teachers',
  'subjects',
  'classrooms',
  'lessons',
  'cards',
  'periods',
];
const timetableFilePattern = /^tt\d+\.json$/u;

const readManifest = (path: string) =>
  JSON.parse(readFileSync(path, 'utf8')) as TimetableManifest;

const readTimetable = (path: string) =>
  JSON.parse(readFileSync(path, 'utf8')) as EduPageTimetablePayload;

const pathForVersionFile = (file: string) =>
  join(timetableDirectory, file.replace('/timetables/', ''));

describe('static timetable assets', () => {
  const manifest = readManifest(join(timetableDirectory, 'index.json'));

  it('has a manifest entry for every copied timetable file', () => {
    const timetableFiles = readdirSync(timetableDirectory).filter((file) =>
      timetableFilePattern.test(file),
    );

    expect(manifest.versions).toHaveLength(timetableFiles.length);
    expect(
      manifest.versions.every((version) =>
        existsSync(pathForVersionFile(version.file)),
      ),
    ).toBe(true);
    expect(
      manifest.versions.some(
        (version) => version.id === manifest.defaultVersionId,
      ),
    ).toBe(true);
  });

  it('loads every timetable payload with required EduPage tables', () => {
    for (const version of manifest.versions) {
      const payload = readTimetable(pathForVersionFile(version.file));
      const tableIds = new Set(
        payload.r.dbiAccessorRes.tables.map((table) => table.id),
      );

      expect(
        requiredTables.every((tableId) => tableIds.has(tableId)),
        version.id,
      ).toBe(true);

      const resolved = resolveTimetable(payload);

      expect(resolved.periods.length, version.id).toBeGreaterThan(0);
      expect(resolved.cards.length, version.id).toBeGreaterThan(0);
    }
  });
});
