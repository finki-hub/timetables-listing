import type { ZodType } from 'zod';

import type {
  Group,
  NamedEntity,
  ParsedTimetable,
  Period,
  TimetableCard,
  TimetableListItem,
} from '@/types.js';

import {
  rawCardSchema,
  rawClassroomSchema,
  rawClassSchema,
  type RawEntity,
  type RawGroup,
  rawGroupSchema,
  type RawLesson,
  rawLessonSchema,
  type RawPeriod,
  rawPeriodSchema,
  rawSubjectSchema,
  type RawTeacher,
  rawTeacherSchema,
  timetableListingResponseSchema,
  timetableTablesSchema,
  upstreamErrorResponseSchema,
} from '@/schemas.js';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_COUNT = DAY_NAMES.length;
const CLEAN_ID_REGEX = /^[* ]+/u;
const NAME_COLLATOR = new Intl.Collator('mk');

type TimetableTable = {
  data_rows?: Record<string, unknown> | undefined | unknown[];
  id: string;
};

export const cleanId = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    return value.replace(CLEAN_ID_REGEX, '').trim();
  }

  return typeof value === 'number' ? String(value) : '';
};

export const decodeDays = (days: unknown): number[] => {
  const rawDays =
    typeof days === 'number' || typeof days === 'string' ? String(days) : '';
  const dayFlags = rawDays.trim().padStart(DAY_COUNT, '0');

  const dayIndices: number[] = [];

  for (const [index, flag] of dayFlags
    .slice(0, DAY_COUNT)
    .split('')
    .entries()) {
    if (flag !== '0') dayIndices.push(index);
  }

  return dayIndices;
};

const rowsFromTable = <Row>(
  tables: TimetableTable[],
  tableId: string,
  schema: ZodType<Row>,
): Row[] => {
  const table = tables.find((candidate) => candidate.id === tableId);
  const dataRows = table?.data_rows ?? [];
  const rows = Array.isArray(dataRows) ? dataRows : Object.values(dataRows);

  return schema.array().parse(rows);
};

const tableMap = <Row extends { id: unknown }>(rows: Row[]): Map<string, Row> =>
  new Map(rows.map((row) => [cleanId(row.id), row]));

const namedEntity = (
  entity: RawEntity | undefined,
  fallbackId: string,
): NamedEntity => {
  const id = entity ? cleanId(entity.id) : fallbackId;
  const entityName = entity?.name?.trim();
  const entityShort = entity?.short?.trim();
  const name =
    entityName === undefined || entityName === ''
      ? (entityShort ?? fallbackId)
      : entityName;
  const short =
    entityShort === undefined || entityShort === '' ? name : entityShort;

  return { id, name, short };
};

const namedTeacher = (
  teacher: RawTeacher | undefined,
  fallbackId: string,
): NamedEntity => {
  if (!teacher) return namedEntity(undefined, fallbackId);

  const fullName = [teacher.firstname, teacher.lastname]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)
    .join(' ');

  if (fullName.length === 0) return namedEntity(teacher, fallbackId);

  const id = cleanId(teacher.id);

  return {
    id,
    name: fullName,
    short:
      teacher.short?.trim() === ''
        ? fullName
        : (teacher.short?.trim() ?? fullName),
  };
};

const namedEntities = <Row extends RawEntity>(
  rows: Row[],
  mapper: (row: Row) => NamedEntity = (row) =>
    namedEntity(row, cleanId(row.id)),
): NamedEntity[] =>
  rows
    .map(mapper)
    .toSorted((left, right) => NAME_COLLATOR.compare(left.name, right.name));

const entitiesFromIds = <Row extends RawEntity>(
  ids: undefined | unknown[],
  entities: Map<string, Row>,
  mapper: (row: Row | undefined, fallbackId: string) => NamedEntity,
): NamedEntity[] =>
  (ids ?? []).map((id) => {
    const clean = cleanId(id);

    return mapper(entities.get(clean), clean);
  });

const durationPeriods = (lesson: RawLesson): number => {
  const duration = lesson.durationperiods ?? 1;

  return Number.isFinite(duration) && duration > 0 ? duration : 1;
};

const periodFromRaw = (period: RawPeriod): Period => ({
  endTime: period.endtime,
  id: cleanId(period.id),
  name:
    period.name?.trim() === ''
      ? `${period.starttime} - ${period.endtime}`
      : (period.name?.trim() ?? `${period.starttime} - ${period.endtime}`),
  period: period.period,
  short:
    period.short?.trim() === ''
      ? String(period.period)
      : (period.short?.trim() ?? String(period.period)),
  startTime: period.starttime,
});

// How far the computed times may drift from the period name before the
// upstream times are considered unreliable.
const MAX_PERIOD_DRIFT_MINUTES = 15;

const parseClockTime = (time: string): null | number => {
  const parts = time.trim().split(':');

  if (parts.length !== 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  const isValid =
    Number.isSafeInteger(hours) &&
    Number.isSafeInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59;

  return isValid ? hours * 60 + minutes : null;
};

const formatMinutes = (total: number): string =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

const periodNameRange = (
  name: string,
): null | { end: number; start: number } => {
  const parts = name
    .replaceAll('\u{2013}', '-')
    .split('-')
    .map((part) => part.trim());

  if (parts.length !== 2) {
    return null;
  }

  const start = parseClockTime(parts[0] ?? '');
  const end = parseClockTime(parts[1] ?? '');

  return start === null || end === null ? null : { end, start };
};

// EduPage sometimes returns period times that disagree with the timetable's
// period names: small drifts (the first period starting at 08:10 instead of
// 08:00) and corrupt ranges (evening periods shifted by more than an hour).
// Prefer the computed times while they are valid, monotonic and close to the
// names; otherwise fall back to the named ranges.
export const canonicalPeriodTimes = (periods: Period[]): Period[] => {
  const ordered = periods.toSorted((left, right) => left.period - right.period);

  const timesAreTrustworthy = ordered.every((period, index) => {
    const start = parseClockTime(period.startTime);
    const end = parseClockTime(period.endTime);

    if (start === null || end === null || start >= end) {
      return false;
    }

    const range = periodNameRange(period.name);

    if (
      range !== null &&
      (Math.abs(range.start - start) > MAX_PERIOD_DRIFT_MINUTES ||
        Math.abs(range.end - end) > MAX_PERIOD_DRIFT_MINUTES)
    ) {
      return false;
    }

    const previousEnd =
      index === 0 ? null : parseClockTime(ordered[index - 1]?.endTime ?? '');

    return previousEnd === null || start >= previousEnd;
  });

  // The choice is made for the whole timetable so the schedule stays coherent:
  // one unreliable period switches every period to its named range.
  if (timesAreTrustworthy) {
    return periods;
  }

  return periods.map((period) => {
    const range = periodNameRange(period.name);

    return range === null
      ? period
      : {
          ...period,
          endTime: formatMinutes(range.end),
          startTime: formatMinutes(range.start),
        };
  });
};

const groupFromRaw = (
  group: RawGroup | undefined,
  fallbackId: string,
): Group => ({
  classId: cleanId(group?.classid),
  entireClass: group?.entireclass ?? false,
  id: group ? cleanId(group.id) : fallbackId,
  name:
    group?.name?.trim() === ''
      ? fallbackId
      : (group?.name?.trim() ?? fallbackId),
});

const extractTables = (payload: unknown): TimetableTable[] => {
  const root =
    payload !== null && typeof payload === 'object' && 'r' in payload
      ? (payload as { r?: unknown }).r
      : payload;

  const candidates = [
    (root as { regularData?: { dbiAccessorRes?: { tables?: unknown } } })
      .regularData?.dbiAccessorRes?.tables,
    (root as { dbiAccessorRes?: { tables?: unknown } }).dbiAccessorRes?.tables,
    (
      root as {
        Timetable?: {
          data?: {
            '': {
              regularData?: { dbiAccessorRes?: { tables?: unknown } };
            };
          };
        };
      }
    ).Timetable?.data?.['']?.regularData?.dbiAccessorRes?.tables,
  ];

  const tables = candidates.find(Array.isArray);

  return timetableTablesSchema.parse(tables);
};

export const parseTimetableList = (payload: unknown): TimetableListItem[] => {
  const listing = timetableListingResponseSchema.parse(payload);

  return listing.r.regular.timetables
    .map((timetable) => ({
      dateFrom: timetable.datefrom,
      hidden: timetable.hidden,
      id: cleanId(timetable.tt_num),
      title: timetable.text,
      year: timetable.year,
    }))
    .toSorted((left, right) => Number(right.id) - Number(left.id));
};

export const parseUpstreamError = (payload: unknown): null | string => {
  const result = upstreamErrorResponseSchema.safeParse(payload);

  return result.success ? result.data.r.error : null;
};

export const parseTimetable = (
  payload: unknown,
  timetableId: string,
): ParsedTimetable => {
  const tables = extractTables(payload);
  const rawPeriods = rowsFromTable(tables, 'periods', rawPeriodSchema);
  const rawClasses = rowsFromTable(tables, 'classes', rawClassSchema);
  const rawTeachers = rowsFromTable(tables, 'teachers', rawTeacherSchema);
  const rawSubjects = rowsFromTable(tables, 'subjects', rawSubjectSchema);
  const rawClassrooms = rowsFromTable(tables, 'classrooms', rawClassroomSchema);
  const rawGroups = rowsFromTable(tables, 'groups', rawGroupSchema);
  const rawLessons = rowsFromTable(tables, 'lessons', rawLessonSchema);
  const rawCards = rowsFromTable(tables, 'cards', rawCardSchema);

  const periodRows = canonicalPeriodTimes(
    rawPeriods
      .map(periodFromRaw)
      .toSorted((left, right) => left.period - right.period),
  );
  const periodMap = new Map(periodRows.map((period) => [period.id, period]));
  const periodByNumber = new Map(
    periodRows.map((period) => [period.period, period]),
  );
  const classMap = tableMap(rawClasses);
  const teacherMap = tableMap(rawTeachers);
  const subjectMap = tableMap(rawSubjects);
  const classroomMap = tableMap(rawClassrooms);
  const groupMap = tableMap(rawGroups);
  const lessonMap = tableMap(rawLessons);

  const cards = rawCards.flatMap((card): TimetableCard[] => {
    const lessonId = cleanId(card.lessonid);
    const lesson = lessonMap.get(lessonId);
    const period = periodMap.get(cleanId(card.period));
    const days = decodeDays(card.days);

    if (!lesson || !period || days.length === 0) return [];

    const duration = durationPeriods(lesson);
    const finalPeriod = periodByNumber.get(period.period + duration - 1);
    const subjectId = cleanId(lesson.subjectid);
    const groupNames = (lesson.groupnames ?? []).filter(Boolean);
    const groups = (lesson.groupids ?? []).map((id) => {
      const clean = cleanId(id);

      return groupFromRaw(groupMap.get(clean), clean);
    });

    return days.map((dayIndex) => ({
      classes: entitiesFromIds(lesson.classids, classMap, namedEntity),
      classrooms: entitiesFromIds(card.classroomids, classroomMap, namedEntity),
      dayIndex,
      dayName: DAY_NAMES[dayIndex] ?? `Day ${String(dayIndex)}`,
      durationPeriods: duration,
      endTime: finalPeriod?.endTime ?? period.endTime,
      groupNames,
      groups,
      id: cleanId(card.id),
      lessonId,
      periodIndex: period.period,
      startTime: period.startTime,
      subject: namedEntity(subjectMap.get(subjectId), subjectId),
      teachers: entitiesFromIds(lesson.teacherids, teacherMap, namedTeacher),
      weeks: card.weeks ?? lesson.weeks ?? '',
    }));
  });

  return {
    cards: cards.toSorted(
      (left, right) =>
        left.dayIndex - right.dayIndex ||
        left.periodIndex - right.periodIndex ||
        NAME_COLLATOR.compare(left.subject.name, right.subject.name),
    ),
    classes: namedEntities(rawClasses),
    classrooms: namedEntities(rawClassrooms),
    id: timetableId,
    periods: periodRows,
    subjects: namedEntities(rawSubjects),
    teachers: namedEntities(rawTeachers, (teacher) =>
      namedTeacher(teacher, cleanId(teacher.id)),
    ),
  };
};
