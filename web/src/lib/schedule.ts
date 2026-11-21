import { dayNames } from '@/lib/constants';

import type {
  NamedEntity,
  Period,
  TimetableCard,
  TimetableListItem,
} from '../../../api/src/types';

export type DateRange = {
  end: string;
  start: string;
};

export type LessonType = 'combined' | 'exercise' | 'lab' | 'lecture';

export type NowNext = {
  current: null | TimetableCard;
  next: null | TimetableCard;
};

export type SkopjeNow = {
  date: string;
  dayIndex: number;
  minutes: number;
};

export type VersionInfo = {
  label: string;
  range: DateRange | null;
  rangeLabel: null | string;
};

const MINUTES_PER_DAY = 1_440;
const DAYS_PER_WEEK = 7;
const ICS_LINE_BYTES = 73;

const rangePattern =
  /\((?<startDay>\d{1,2})\/(?<startMonth>\d{1,2})(?:\/(?<startYear>\d{4}))?\s*[-–]\s*(?<endDay>\d{1,2})\/(?<endMonth>\d{1,2})\/(?<endYear>\d{4})\)/u;
const slugPattern =
  /raspored-(?:za-)?(?<semester>leten|zimski)(?:-semestar)?-(?<firstYear>\d{4})-(?:\d{2})?(?<secondYear>\d{2})/u;
const lessonTypePattern = /\((?<type>п\+ав|п|ав|лаб|лв|л)\)\s*$/iu;

const legacyVersionLabels: Record<string, string> = {
  'raspored-prva': 'Зимски 2020/21 · прва недела',
  'raspored-vtora-nedela': 'Зимски 2020/21 · втора недела',
};

const semesterNames: Record<string, string> = {
  leten: 'Летен',
  zimski: 'Зимски',
};

const latinByCyrillic: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ѓ: 'gj',
  д: 'd',
  е: 'e',
  ж: 'z',
  з: 'z',
  ѕ: 'dz',
  и: 'i',
  ј: 'j',
  к: 'k',
  ќ: 'kj',
  л: 'l',
  љ: 'lj',
  м: 'm',
  н: 'n',
  њ: 'nj',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'c',
  џ: 'dz',
  ш: 's',
};

const pad = (value: number) => String(value).padStart(2, '0');

const isoDate = (year: number, month: number, day: number) =>
  `${String(year)}-${pad(month)}-${pad(day)}`;

export const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

export const cardTimeLabel = (card: TimetableCard) =>
  `${card.startTime} – ${card.endTime}`;

export const compareCards = (left: TimetableCard, right: TimetableCard) =>
  left.dayIndex - right.dayIndex ||
  toMinutes(left.startTime) - toMinutes(right.startTime) ||
  toMinutes(left.endTime) - toMinutes(right.endTime);

export const normalizeSearch = (value: string) => {
  const latin = Array.from(
    value.trim().toLocaleLowerCase('mk'),
    (character) => latinByCyrillic[character] ?? character,
  ).join('');

  return latin
    .replaceAll('zh', 'z')
    .replaceAll('ch', 'c')
    .replaceAll('sh', 's');
};

export const parseVersion = (title: string): VersionInfo => {
  const rangeMatch = rangePattern.exec(title);
  const slugMatch = slugPattern.exec(title);
  let range: DateRange | null = null;
  let rangeLabel: null | string = null;

  if (rangeMatch?.groups) {
    const { groups } = rangeMatch;
    const startDay = Number(groups['startDay']);
    const startMonth = Number(groups['startMonth']);
    const endDay = Number(groups['endDay']);
    const endMonth = Number(groups['endMonth']);
    const endYear = Number(groups['endYear']);
    const inferredYear = startMonth > endMonth ? endYear - 1 : endYear;
    const resolvedStartYear = groups['startYear']
      ? Number(groups['startYear'])
      : inferredYear;

    range = {
      end: isoDate(endYear, endMonth, endDay),
      start: isoDate(resolvedStartYear, startMonth, startDay),
    };
    rangeLabel = `${String(startDay)}.${String(startMonth)}.${String(resolvedStartYear)} – ${String(endDay)}.${String(endMonth)}.${String(endYear)}`;
  }

  if (!slugMatch?.groups) {
    return {
      label:
        legacyVersionLabels[title.replace(rangePattern, '').trim()] ??
        (title.replace(rangePattern, '').trim() || title),
      range,
      rangeLabel,
    };
  }

  const { firstYear = '', secondYear = '', semester = '' } = slugMatch.groups;
  const firstWeek = title.includes('prva-nedela') ? ' · прва недела' : '';

  return {
    label: `${semesterNames[semester] ?? semester} ${firstYear}/${secondYear}${firstWeek}`,
    range,
    rangeLabel,
  };
};

export const versionLabel = (version: TimetableListItem) => {
  const { label, rangeLabel } = parseVersion(version.title);

  return rangeLabel ? `${label} (${rangeLabel})` : label;
};

export const skopjeNow = (timestamp: number): SkopjeNow => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Skopje',
    weekday: 'short',
    year: 'numeric',
  }).formatToParts(timestamp);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    dayIndex: weekdays.indexOf(part('weekday')),
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
  };
};

export const isWithinRange = (date: string, range: DateRange | null) =>
  range !== null && date >= range.start && date <= range.end;

export const getNowNext = (cards: TimetableCard[], now: SkopjeNow): NowNext => {
  const sorted = cards.toSorted(compareCards);
  const nowInWeek = now.dayIndex * MINUTES_PER_DAY + now.minutes;
  const current =
    sorted.find(
      (card) =>
        card.dayIndex === now.dayIndex &&
        toMinutes(card.startTime) <= now.minutes &&
        toMinutes(card.endTime) > now.minutes,
    ) ?? null;
  const next =
    sorted.find(
      (card) =>
        card.dayIndex * MINUTES_PER_DAY + toMinutes(card.startTime) > nowInWeek,
    ) ??
    sorted.at(0) ??
    null;

  return { current, next };
};

export const findConflicts = (cards: TimetableCard[]) => {
  const conflicts = new Set<string>();

  for (const [index, left] of cards.entries()) {
    const laterCards = cards.slice(index + 1);

    for (const right of laterCards) {
      if (!(
        left.dayIndex === right.dayIndex &&
        toMinutes(left.startTime) < toMinutes(right.endTime) &&
        toMinutes(right.startTime) < toMinutes(left.endTime)
      )) {
        continue;
      }

      conflicts.add(left.id);
      conflicts.add(right.id);
    }
  }

  return conflicts;
};

export const findFreeRooms = ({
  cards,
  classrooms,
  dayIndex,
  endMinutes,
  startMinutes,
}: {
  cards: TimetableCard[];
  classrooms: NamedEntity[];
  dayIndex: number;
  endMinutes: number;
  startMinutes: number;
}) => {
  const busyRoomIds = new Set(
    cards
      .filter(
        (card) =>
          card.dayIndex === dayIndex &&
          toMinutes(card.startTime) < endMinutes &&
          startMinutes < toMinutes(card.endTime),
      )
      .flatMap((card) => card.classrooms.map((room) => room.id)),
  );

  return classrooms.filter((room) => !busyRoomIds.has(room.id));
};

export const trimPeriods = (periods: Period[], cards: TimetableCard[]) => {
  const positions = new Map(
    periods.map((period, index) => [period.period, index]),
  );
  const spans = cards.flatMap((card): Array<[number, number]> => {
    const start = positions.get(card.periodIndex);

    return start === undefined ? [] : [[start, start + card.durationPeriods]];
  });

  return spans.length === 0
    ? periods
    : periods.slice(
        Math.min(...spans.map(([start]) => start)),
        Math.max(...spans.map(([, end]) => end)),
      );
};

export const lessonType = (subjectName: string): LessonType | null => {
  const suffix = lessonTypePattern
    .exec(subjectName)
    ?.groups?.['type']?.toLowerCase();

  if (suffix === 'п+ав') {
    return 'combined';
  }
  if (suffix === 'п') {
    return 'lecture';
  }
  if (suffix === 'ав') {
    return 'exercise';
  }

  return suffix ? 'lab' : null;
};

const escapeIcs = (value: string) =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n');

const foldIcsLine = (line: string) => {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let chunk = '';
  let bytes = 0;

  for (const character of line) {
    const size = encoder.encode(character).length;

    if (bytes + size > ICS_LINE_BYTES) {
      chunks.push(chunk);
      chunk = ' ';
      bytes = 1;
    }
    chunk += character;
    bytes += size;
  }
  chunks.push(chunk);

  return chunks.join('\r\n');
};

const compactDate = (date: string) => date.replaceAll('-', '');

const compactTime = (time: string) => `${time.replace(':', '')}00`;

const firstOccurrence = (range: DateRange, dayIndex: number) => {
  // eslint-disable-next-line unicorn/prefer-temporal -- Temporal is not available in every supported browser.
  const date = new Date(`${range.start}T00:00:00Z`);
  const startDayIndex = (date.getUTCDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;

  date.setUTCDate(
    date.getUTCDate() +
      ((dayIndex - startDayIndex + DAYS_PER_WEEK) % DAYS_PER_WEEK),
  );

  const occurrence = date.toISOString().slice(0, 10);

  return occurrence <= range.end ? occurrence : null;
};

const icsTimezone = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Skopje',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export const buildCalendar = ({
  cards,
  name,
  now,
  range,
  versionId,
}: {
  cards: TimetableCard[];
  name: string;
  now: Date;
  range: DateRange;
  versionId: string;
}) => {
  const stamp = now.toISOString().replaceAll(/[-:]|\.\d{3}/gu, '');
  const events = cards.flatMap((card) => {
    const date = firstOccurrence(range, card.dayIndex);

    if (date === null) {
      return [];
    }

    const description = [
      card.teachers.map((teacher) => teacher.name).join(', '),
      card.classes.map((entity) => entity.name).join(', '),
    ]
      .filter((line) => line.length > 0)
      .join('\n');

    return [
      'BEGIN:VEVENT',
      `UID:${versionId}-${card.id}@timetables.finki-hub.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Skopje:${compactDate(date)}T${compactTime(card.startTime)}`,
      `DTEND;TZID=Europe/Skopje:${compactDate(date)}T${compactTime(card.endTime)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${compactDate(range.end)}T225959Z`,
      `SUMMARY:${escapeIcs(card.subject.name)}`,
      `LOCATION:${escapeIcs(card.classrooms.map((room) => room.name).join(', '))}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      'END:VEVENT',
    ];
  });

  return `${[
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FINKI Hub//Timetables//MK',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcs(name)}`,
    'X-WR-TIMEZONE:Europe/Skopje',
    ...icsTimezone,
    ...events,
    'END:VCALENDAR',
  ]
    .map((line) => foldIcsLine(line))
    .join('\r\n')}\r\n`;
};

export const dayLabel = (dayIndex: number) => dayNames[dayIndex] ?? '';
