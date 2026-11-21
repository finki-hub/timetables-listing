import { describe, expect, it } from 'vitest';

import type { Period } from '@/types.js';

import { canonicalPeriodTimes } from '@/parser.js';

const period = (
  overrides: Partial<Period> & Pick<Period, 'period'>,
): Period => ({
  endTime: '09:45',
  id: `period-${String(overrides.period)}`,
  name: '9:00 - 9:45',
  short: String(overrides.period),
  startTime: '09:00',
  ...overrides,
});

describe('canonicalPeriodTimes', () => {
  it('keeps the computed times when they are close to the names', () => {
    const periods = [
      period({
        endTime: '08:55',
        name: '8:00 - 8:45',
        period: 0,
        startTime: '08:10',
      }),
      period({ period: 1 }),
    ];

    const result = canonicalPeriodTimes(periods);

    expect(result[0]?.startTime).toBe('08:10');
    expect(result[0]?.endTime).toBe('08:55');
    expect(result[1]?.startTime).toBe('09:00');
  });

  it('falls back to the names when the drift is too large', () => {
    const result = canonicalPeriodTimes([
      period({
        endTime: '07:55',
        name: '8:00 - 8:45',
        period: 0,
        startTime: '07:10',
      }),
    ]);

    expect(result[0]?.startTime).toBe('08:00');
    expect(result[0]?.endTime).toBe('08:45');
  });

  it('falls back to the names when the computed times are not monotonic', () => {
    const result = canonicalPeriodTimes([
      period({
        endTime: '09:45',
        name: '09:00 - 09:45',
        period: 12,
        startTime: '09:00',
      }),
      period({
        endTime: '10:15',
        name: '09:45 - 10:30',
        period: 13,
        startTime: '09:30',
      }),
    ]);

    expect(result[0]?.startTime).toBe('09:00');
    expect(result[0]?.endTime).toBe('09:45');
    expect(result[1]?.startTime).toBe('09:45');
    expect(result[1]?.endTime).toBe('10:30');
  });

  it('uses the names for the whole timetable when one period is unreliable', () => {
    const result = canonicalPeriodTimes([
      period({
        endTime: '07:55',
        name: '8:00 - 8:45',
        period: 0,
        startTime: '07:10',
      }),
      period({
        endTime: '09:50',
        name: '9:00 - 9:45',
        period: 1,
        startTime: '09:05',
      }),
    ]);

    expect(result[0]?.startTime).toBe('08:00');
    expect(result[1]?.startTime).toBe('09:00');
  });

  it('accepts an en dash in the period name', () => {
    const result = canonicalPeriodTimes([
      period({
        endTime: '07:55',
        name: '8:00 \u{2013} 8:45',
        period: 0,
        startTime: '07:10',
      }),
    ]);

    expect(result[0]?.startTime).toBe('08:00');
    expect(result[0]?.endTime).toBe('08:45');
  });

  it('keeps the computed times when the name is not a range', () => {
    const result = canonicalPeriodTimes([
      period({
        endTime: '12:45',
        name: 'Lunch',
        period: 0,
        startTime: '12:00',
      }),
      period({
        endTime: '13:45',
        name: '13:00 - 13:45',
        period: 1,
        startTime: '13:00',
      }),
    ]);

    expect(result[0]?.startTime).toBe('12:00');
    expect(result[0]?.endTime).toBe('12:45');
  });

  it('leaves double-period overlaps unchanged', () => {
    const result = canonicalPeriodTimes([
      period({
        endTime: '09:45',
        name: '8:00 - 9:45',
        period: 1,
        startTime: '08:00',
      }),
      period({
        endTime: '09:45',
        name: '9:00 - 9:45',
        period: 2,
        startTime: '09:00',
      }),
    ]);

    expect(result[0]?.startTime).toBe('08:00');
    expect(result[0]?.endTime).toBe('09:45');
    expect(result[1]?.startTime).toBe('09:00');
    expect(result[1]?.endTime).toBe('09:45');
  });

  it('preserves the input order and does not mutate it', () => {
    const periods = [
      period({
        endTime: '07:55',
        name: '8:00 - 8:45',
        period: 0,
        startTime: '07:10',
      }),
      period({ period: 1 }),
    ];

    const result = canonicalPeriodTimes(periods);

    expect(result.map((entry) => entry.period)).toEqual([0, 1]);
    expect(periods[0]?.startTime).toBe('07:10');
  });
});
