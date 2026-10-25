import { useEffect, useMemo, useState } from 'react';

import type { ViewMode } from '@/lib/types';

import { fetchTimetable, fetchTimetables } from '@/lib/api';

import type {
  NamedEntity,
  ParsedTimetable,
  TimetableCard,
  TimetableListItem,
} from '../../../api/src/types';

type LoadState = {
  error: null | string;
  isListLoading: boolean;
  isTimetableLoading: boolean;
  timetable: null | ParsedTimetable;
  timetables: TimetableListItem[];
};

type UseTimetableParams = {
  entityId: null | string;
  onVersionFallback?: (versionId: string) => void;
  query: string;
  versionId: null | string;
  view: ViewMode;
};

const initialLoadState: LoadState = {
  error: null,
  isListLoading: true,
  isTimetableLoading: false,
  timetable: null,
  timetables: [],
};

const noop = () => {};

const entitiesForView = (
  timetable: null | ParsedTimetable,
  view: ViewMode,
): NamedEntity[] => {
  if (!timetable) {
    return [];
  }
  if (view === 'teacher') {
    return timetable.teachers;
  }
  if (view === 'classroom') {
    return timetable.classrooms;
  }
  return view === 'subject' ? timetable.subjects : timetable.classes;
};

const cardsForEntity = (
  cards: TimetableCard[],
  view: ViewMode,
  entityId: string,
) =>
  cards.filter((card) => {
    if (view === 'class') {
      return card.classes.some((entity) => entity.id === entityId);
    }

    if (view === 'teacher') {
      return card.teachers.some((entity) => entity.id === entityId);
    }

    return view === 'subject'
      ? card.subject.id === entityId
      : card.classrooms.some((entity) => entity.id === entityId);
  });

const defaultTimetable = (timetables: TimetableListItem[]) =>
  timetables.find((timetable) => !timetable.hidden) ?? timetables.at(0) ?? null;

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const useTimetable = ({
  entityId,
  onVersionFallback,
  query,
  versionId,
  view,
}: UseTimetableParams) => {
  const [state, setState] = useState<LoadState>(initialLoadState);

  useEffect(() => {
    const controller = new AbortController();

    const loadTimetables = async () => {
      setState((current) => ({
        ...current,
        error: null,
        isListLoading: true,
      }));
      try {
        const timetables = await fetchTimetables(controller.signal);
        if (!controller.signal.aborted) {
          setState((current) => ({
            ...current,
            error: null,
            isListLoading: false,
            isTimetableLoading: timetables.length > 0,
            timetables,
          }));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState((current) => ({
            ...current,
            error: errorMessage(error, 'Could not load timetable list'),
            isListLoading: false,
            isTimetableLoading: false,
            timetable: null,
            timetables: [],
          }));
        }
      }
    };

    void loadTimetables();
    return () => {
      controller.abort();
    };
  }, []);

  const selectedVersion = useMemo<null | TimetableListItem>(() => {
    const timetables = state.timetables;
    return timetables.length === 0
      ? null
      : (timetables.find((candidate) => candidate.id === versionId) ??
          defaultTimetable(timetables));
  }, [state.timetables, versionId]);

  useEffect(() => {
    if (!versionId || !selectedVersion || selectedVersion.id === versionId) {
      return;
    }

    onVersionFallback?.(selectedVersion.id);
  }, [onVersionFallback, selectedVersion, versionId]);

  useEffect(() => {
    if (!selectedVersion) {
      setState((current) => ({
        ...current,
        isTimetableLoading: false,
        timetable: null,
      }));
      return noop;
    }

    const controller = new AbortController();
    const selectedVersionId = selectedVersion.id;

    const loadTimetable = async () => {
      setState((current) => ({
        ...current,
        error: null,
        isTimetableLoading: true,
        timetable: null,
      }));
      try {
        const loadedTimetable = await fetchTimetable(
          selectedVersionId,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setState((current) => ({
            ...current,
            error: null,
            isTimetableLoading: false,
            timetable: loadedTimetable,
          }));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState((current) => ({
            ...current,
            error: errorMessage(error, 'Could not load timetable'),
            isTimetableLoading: false,
            timetable: null,
          }));
        }
      }
    };

    void loadTimetable();
    return () => {
      controller.abort();
    };
  }, [selectedVersion]);

  const timetable = state.timetable;
  const entities = useMemo(
    () => entitiesForView(timetable, view),
    [timetable, view],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase('mk');
  const filteredEntities = useMemo(
    () =>
      normalizedQuery.length === 0
        ? entities
        : entities.filter(
            (entity) =>
              entity.name.toLocaleLowerCase('mk').includes(normalizedQuery) ||
              entity.short.toLocaleLowerCase('mk').includes(normalizedQuery),
          ),
    [entities, normalizedQuery],
  );
  const selectedEntity =
    entities.find((entity) => entity.id === entityId) ??
    filteredEntities.at(0) ??
    (normalizedQuery.length > 0 ? null : (entities.at(0) ?? null));
  const visibleCards = useMemo(
    () =>
      timetable === null || selectedEntity === null
        ? []
        : cardsForEntity(timetable.cards, view, selectedEntity.id),
    [selectedEntity, timetable, view],
  );

  return {
    entities,
    error: state.error,
    filteredEntities,
    isLoading: state.isListLoading || state.isTimetableLoading,
    selectedEntity,
    selectedVersion,
    timetable,
    versions: state.timetables,
    visibleCards,
  };
};

export { useTimetable };
