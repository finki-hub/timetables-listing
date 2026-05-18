import type {
  EduPageCard,
  EduPageEntity,
  EduPageLesson,
  EduPagePeriod,
  EduPageTable,
  EduPageTimetablePayload,
  NamedEntity,
  ResolvedCard,
  ResolvedTimetable,
} from '@/lib/types';

const DAY_COUNT = 5;

const byId = <Row extends { id: string }>(rows: Row[]) =>
  new Map(rows.map((row) => [row.id, row]));

const duration = (lesson: EduPageLesson) => {
  const numeric = Number(lesson.durationperiods ?? 1);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
};

const entityName = (
  entity: EduPageEntity | undefined,
  fallbackId: string,
): NamedEntity => ({
  id: entity?.id ?? fallbackId,
  name: entity?.name ?? entity?.short ?? fallbackId,
  short: entity?.short ?? entity?.name ?? fallbackId,
});

const entitiesFromIds = (
  ids: string[] | undefined,
  map: Map<string, EduPageEntity>,
) => (ids ?? []).map((id) => entityName(map.get(id), id));

const firstActiveDay = (days: string) => {
  const index = days.slice(0, DAY_COUNT).split('').indexOf('1');
  return Math.max(index, 0);
};

const tableRows = <Row>(
  payload: EduPageTimetablePayload,
  tableId: string,
): Row[] => {
  const table = payload.r.dbiAccessorRes.tables.find(
    (candidate) => candidate.id === tableId,
  ) as EduPageTable<Row> | undefined;
  return table?.data_rows ?? [];
};

const cardsForEntity = (
  cards: ResolvedCard[],
  view: 'class' | 'classroom' | 'teacher',
  entityId: string,
) =>
  cards.filter((card) => {
    if (view === 'class') {
      return card.classes.some((entity) => entity.id === entityId);
    }

    if (view === 'teacher') {
      return card.teachers.some((entity) => entity.id === entityId);
    }

    return card.classrooms.some((entity) => entity.id === entityId);
  });

const resolveTimetable = (
  payload: EduPageTimetablePayload,
): ResolvedTimetable => {
  const classes = tableRows<EduPageEntity>(payload, 'classes');
  const teachers = tableRows<EduPageEntity>(payload, 'teachers');
  const subjects = tableRows<EduPageEntity>(payload, 'subjects');
  const classrooms = tableRows<EduPageEntity>(payload, 'classrooms');
  const lessons = tableRows<EduPageLesson>(payload, 'lessons');
  const cards = tableRows<EduPageCard>(payload, 'cards');
  const periods = tableRows<EduPagePeriod>(payload, 'periods').toSorted(
    (left, right) => Number(left.period) - Number(right.period),
  );

  const classMap = byId(classes);
  const teacherMap = byId(teachers);
  const subjectMap = byId(subjects);
  const classroomMap = byId(classrooms);
  const lessonMap = byId(lessons);
  const periodMap = byId(periods);

  const resolvedCards: ResolvedCard[] = cards.flatMap((card) => {
    const lesson = lessonMap.get(card.lessonid);
    const period = periodMap.get(card.period);

    if (!lesson || !period) {
      return [];
    }

    return [
      {
        classes: entitiesFromIds(lesson.classids, classMap),
        classrooms: entitiesFromIds(card.classroomids, classroomMap),
        dayIndex: firstActiveDay(card.days),
        durationPeriods: duration(lesson),
        groupNames: (lesson.groupnames ?? []).filter(Boolean),
        id: card.id,
        lessonId: lesson.id,
        period,
        periodIndex: Number(period.period),
        subject: entityName(subjectMap.get(lesson.subjectid), lesson.subjectid),
        teachers: entitiesFromIds(lesson.teacherids, teacherMap),
        weeks: card.weeks ?? lesson.weeks ?? '',
      } satisfies ResolvedCard,
    ];
  });

  const sortedCards = resolvedCards.toSorted(
    (left, right) =>
      left.dayIndex - right.dayIndex ||
      left.periodIndex - right.periodIndex ||
      left.subject.name.localeCompare(right.subject.name, 'mk'),
  );

  return {
    cards: sortedCards,
    classes: classes
      .map((entity) => entityName(entity, entity.id))
      .sort((left, right) => left.name.localeCompare(right.name, 'mk')),
    classrooms: classrooms
      .map((entity) => entityName(entity, entity.id))
      .sort((left, right) => left.name.localeCompare(right.name, 'mk')),
    periods,
    subjects: subjects
      .map((entity) => entityName(entity, entity.id))
      .sort((left, right) => left.name.localeCompare(right.name, 'mk')),
    teachers: teachers
      .map((entity) => entityName(entity, entity.id))
      .sort((left, right) => left.name.localeCompare(right.name, 'mk')),
  };
};

const dayNames = [
  'Понеделник',
  'Вторник',
  'Среда',
  'Четврток',
  'Петок',
] as const;

export { cardsForEntity, dayNames, resolveTimetable };
