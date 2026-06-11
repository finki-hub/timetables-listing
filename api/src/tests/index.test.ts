import { describe, expect, it } from 'vitest';

import { fetchTimetable, fetchTimetableList } from '@/fetch.js';
import {
  cleanId,
  decodeDays,
  parseTimetable,
  parseTimetableList,
  parseUpstreamError,
} from '@/parser.js';

const DIGITS_REGEX = /^\d+$/u;

describe('Timetables parser', () => {
  it('normalizes EduPage IDs and day flags', () => {
    expect(cleanId('*28')).toBe('28');
    expect(cleanId(' -72')).toBe('-72');
    expect(decodeDays('10100')).toEqual([0, 2]);
  });
});

describe('Timetables E2E', () => {
  it(
    'should fetch and parse the real timetable listing',
    { timeout: 30_000 },
    async () => {
      const payload = await fetchTimetableList();
      const timetables = parseTimetableList(payload);

      expect(timetables.length).toBeGreaterThan(0);

      for (const timetable of timetables) {
        expect(timetable.id).toMatch(DIGITS_REGEX);
        expect(timetable.title).not.toBe('');
        expect(timetable.dateFrom).not.toBe('');
        expect(typeof timetable.hidden).toBe('boolean');
      }
    },
  );

  it(
    'should fetch and parse a real timetable',
    { timeout: 30_000 },
    async () => {
      const payload = await fetchTimetable('28');
      const upstreamError = parseUpstreamError(payload);

      expect(upstreamError).toBe(null);

      const timetable = parseTimetable(payload, '28');

      expect(timetable.id).toBe('28');
      expect(timetable.periods.length).toBeGreaterThan(0);
      expect(timetable.classes.length).toBeGreaterThan(0);
      expect(timetable.teachers.length).toBeGreaterThan(0);
      expect(timetable.classrooms.length).toBeGreaterThan(0);
      expect(timetable.subjects.length).toBeGreaterThan(0);
      expect(timetable.cards.length).toBeGreaterThan(0);
    },
  );
});
