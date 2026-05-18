import { describe, expect, it } from 'vitest';

import { cardsForEntity, resolveTimetable } from '@/lib/resolve-cards';

import tt28 from '../../public/timetables/tt28.json';

const periodTimePattern = /^\d{2}:\d{2}$/u;

describe('resolveTimetable', () => {
  const timetable = resolveTimetable(tt28);

  it('resolves core EduPage tables into named entities', () => {
    expect(timetable.classes.length).toBeGreaterThan(0);
    expect(timetable.teachers.length).toBeGreaterThan(0);
    expect(timetable.classrooms.length).toBeGreaterThan(0);
    expect(timetable.periods.length).toBeGreaterThan(0);
  });

  it('joins cards with lessons, subjects, periods, and linked entities', () => {
    const card = timetable.cards[0];

    expect(card.subject.name).toBeTruthy();
    expect(card.period.starttime).toMatch(periodTimePattern);
    expect(card.durationPeriods).toBeGreaterThan(0);
    expect(card.dayIndex).toBeGreaterThanOrEqual(0);
    expect(card.dayIndex).toBeLessThan(5);
  });

  it('filters cards by selected class', () => {
    const selectedClass = timetable.classes[0];
    const cards = cardsForEntity(timetable.cards, 'class', selectedClass.id);

    expect(
      cards.every((card) =>
        card.classes.some((entity) => entity.id === selectedClass.id),
      ),
    ).toBe(true);
  });

  it('filters cards by selected teacher and classroom', () => {
    const cardWithTeacher = timetable.cards.find(
      (card) => card.teachers.length > 0,
    );
    const cardWithClassroom = timetable.cards.find(
      (card) => card.classrooms.length > 0,
    );

    expect(cardWithTeacher).toBeDefined();
    expect(cardWithClassroom).toBeDefined();

    const teacher = cardWithTeacher?.teachers[0];
    const classroom = cardWithClassroom?.classrooms[0];

    expect(teacher).toBeDefined();
    expect(classroom).toBeDefined();

    if (teacher) {
      expect(
        cardsForEntity(timetable.cards, 'teacher', teacher.id).every((card) =>
          card.teachers.some((entity) => entity.id === teacher.id),
        ),
      ).toBe(true);
    }

    if (classroom) {
      expect(
        cardsForEntity(timetable.cards, 'classroom', classroom.id).every(
          (card) =>
            card.classrooms.some((entity) => entity.id === classroom.id),
        ),
      ).toBe(true);
    }
  });
});
