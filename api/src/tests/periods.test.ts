import { describe, expect, it } from 'vitest';

import type { Period } from '@/types.js';

import { canonicalPeriodTimes } from '@/parser.js';

type PeriodInput = [number, string, string, string];

const period = ([number, name, startTime, endTime]: PeriodInput): Period => ({
  endTime,
  id: `period-${String(number)}`,
  name,
  period: number,
  short: String(number),
  startTime,
});

type PeriodCase = {
  expected: Array<[string, string]>;
  input: Period[];
  title: string;
};

const cases: PeriodCase[] = [
  {
    expected: [
      ['08:10', '08:55'],
      ['09:00', '09:45'],
    ],
    input: [
      period([0, '8:00 - 8:45', '08:10', '08:55']),
      period([1, '9:00 - 9:45', '09:00', '09:45']),
    ],
    title: 'keeps the computed times when they are close to the names',
  },
  {
    expected: [['08:00', '08:45']],
    input: [period([0, '8:00 - 8:45', '07:10', '07:55'])],
    title: 'falls back to the names when the drift is too large',
  },
  {
    expected: [
      ['09:00', '09:45'],
      ['09:45', '10:30'],
    ],
    input: [
      period([12, '09:00 - 09:45', '09:00', '09:45']),
      period([13, '09:45 - 10:30', '09:30', '10:15']),
    ],
    title: 'falls back to the names when the computed times are not monotonic',
  },
  {
    expected: [
      ['08:00', '08:45'],
      ['09:00', '09:45'],
    ],
    input: [
      period([0, '8:00 - 8:45', '07:10', '07:55']),
      period([1, '9:00 - 9:45', '09:05', '09:50']),
    ],
    title:
      'uses the names for the whole timetable when one period is unreliable',
  },
  {
    expected: [['08:00', '08:45']],
    input: [period([0, '8:00 \u{2013} 8:45', '07:10', '07:55'])],
    title: 'accepts an en dash in the period name',
  },
  {
    expected: [
      ['12:00', '12:45'],
      ['13:00', '13:45'],
    ],
    input: [
      period([0, 'Lunch', '12:00', '12:45']),
      period([1, '13:00 - 13:45', '13:00', '13:45']),
    ],
    title: 'keeps the computed times when the name is not a range',
  },
  {
    expected: [
      ['08:00', '09:45'],
      ['09:00', '09:45'],
    ],
    input: [
      period([1, '8:00 - 9:45', '08:00', '09:45']),
      period([2, '9:00 - 9:45', '09:00', '09:45']),
    ],
    title: 'leaves double-period overlaps unchanged',
  },
];

describe('canonicalPeriodTimes', () => {
  it.each(cases)('$title', ({ expected, input }) => {
    const result = canonicalPeriodTimes(input);

    expect(
      result.map(({ endTime, startTime }) => [startTime, endTime]),
    ).toEqual(expected);
  });

  it('preserves the input order and does not mutate it', () => {
    const input = [
      period([1, '9:00 - 9:45', '09:00', '09:45']),
      period([0, '8:00 - 8:45', '07:10', '07:55']),
    ];

    const result = canonicalPeriodTimes(input);

    expect(result.map((entry) => entry.period)).toEqual([1, 0]);
    expect(input[1]?.startTime).toBe('07:10');
  });
});
