import { useEffect, useMemo, useState } from 'react';

import type {
  EduPageTimetablePayload,
  NamedEntity,
  ResolvedTimetable,
  TimetableManifest,
  TimetableVersion,
  ViewMode,
} from '@/lib/types';

import { cardsForEntity, resolveTimetable } from '@/lib/resolve-cards';

type LoadState = {
  error: null | string;
  isLoading: boolean;
  manifest: null | TimetableManifest;
  payload: EduPageTimetablePayload | null;
};

type UseTimetableParams = {
  entityId: null | string;
  query: string;
  versionId: null | string;
  view: ViewMode;
};

const initialLoadState: LoadState = {
  error: null,
  isLoading: true,
  manifest: null,
  payload: null,
};

const noop = () => {};

const entitiesForView = (
  timetable: null | ResolvedTimetable,
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
  return timetable.classes;
};

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const useTimetable = ({
  entityId,
  query,
  versionId,
  view,
}: UseTimetableParams) => {
  const [state, setState] = useState<LoadState>(initialLoadState);

  useEffect(() => {
    const controller = new AbortController();

    const loadManifest = async () => {
      setState((current) => ({ ...current, error: null, isLoading: true }));
      try {
        const response = await fetch('/timetables/index.json', {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Manifest request failed with ${response.status}`);
        }
        const manifest = (await response.json()) as TimetableManifest;
        if (!controller.signal.aborted) {
          setState((current) => ({ ...current, manifest }));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState((current) => ({
            ...current,
            error: errorMessage(error, 'Could not load timetable manifest'),
            isLoading: false,
          }));
        }
      }
    };

    void loadManifest();
    return () => {
      controller.abort();
    };
  }, []);

  const selectedVersion = useMemo<null | TimetableVersion>(() => {
    const manifest = state.manifest;
    if (!manifest) {
      return null;
    }
    return (
      manifest.versions.find((version) => version.id === versionId) ??
      manifest.versions.find(
        (version) => version.id === manifest.defaultVersionId,
      ) ??
      manifest.versions.at(0) ??
      null
    );
  }, [state.manifest, versionId]);

  useEffect(() => {
    if (!selectedVersion) {
      return noop;
    }

    const controller = new AbortController();
    const versionFile = selectedVersion.file;

    const loadPayload = async () => {
      setState((current) => ({ ...current, error: null, isLoading: true }));
      try {
        const response = await fetch(versionFile, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Timetable request failed with ${response.status}`);
        }
        const payload = (await response.json()) as EduPageTimetablePayload;
        if (!controller.signal.aborted) {
          setState((current) => ({ ...current, isLoading: false, payload }));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState((current) => ({
            ...current,
            error: errorMessage(error, 'Could not load timetable'),
            isLoading: false,
          }));
        }
      }
    };

    void loadPayload();
    return () => {
      controller.abort();
    };
  }, [selectedVersion]);

  const timetable = useMemo(
    () => (state.payload ? resolveTimetable(state.payload) : null),
    [state.payload],
  );
  const entities = useMemo(
    () => entitiesForView(timetable, view),
    [timetable, view],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase('mk');
  const filteredEntities = useMemo(() => {
    if (normalizedQuery.length === 0) {
      return entities;
    }
    return entities.filter(
      (entity) =>
        entity.name.toLocaleLowerCase('mk').includes(normalizedQuery) ||
        entity.short.toLocaleLowerCase('mk').includes(normalizedQuery),
    );
  }, [entities, normalizedQuery]);
  const selectedEntity =
    entities.find((entity) => entity.id === entityId) ??
    filteredEntities.at(0) ??
    (normalizedQuery.length > 0 ? null : (entities.at(0) ?? null));
  const visibleCards = useMemo(
    () =>
      timetable !== null && selectedEntity !== null
        ? cardsForEntity(timetable.cards, view, selectedEntity.id)
        : [],
    [selectedEntity, timetable, view],
  );

  return {
    entities,
    error: state.error,
    filteredEntities,
    isLoading: state.isLoading,
    manifest: state.manifest,
    selectedEntity,
    selectedVersion,
    timetable,
    versions: state.manifest?.versions ?? [],
    visibleCards,
  };
};

export { useTimetable };
