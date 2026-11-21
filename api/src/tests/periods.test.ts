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
        endTime: '20:45',
        name: '17:30 - 18:15',
        period: 12,
        startTime: '20:00',
      }),
      period({
        endTime: '20:45',
        name: '18:20 - 19:05',
        period: 13,
        startTime: '20:00',
      }),
    ]);

    expect(result[0]?.startTime).toBe('17:30');
    expect(result[0]?.endTime).toBe('18:15');
    expect(result[1]?.startTime).toBe('18:20');
    expect(result[1]?.endTime).toBe('19:05');
  });

  it('keeps the computed times when the name is not a range', () => {
    const result = canonicalPeriodTimes([
      period({
        endTime: '12:45',
        name: 'Lunch',
        period: 0,
        startTime: '12:00',
      }),
      period({ period: 1 }),
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
