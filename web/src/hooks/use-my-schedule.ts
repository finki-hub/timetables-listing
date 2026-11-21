import { useCallback, useMemo, useState } from 'react';

type StoredSchedule = Record<string, string[]>;

const STORAGE_KEY = 'my-schedule';

const readStored = (): StoredSchedule => {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}',
    ) as unknown;

    return typeof parsed !== 'object' || parsed === null
      ? {}
      : Object.fromEntries(
          Object.entries(parsed).filter(
            (entry): entry is [string, string[]] =>
              Array.isArray(entry[1]) &&
              entry[1].every((id) => typeof id === 'string'),
          ),
        );
  } catch {
    return {};
  }
};

const writeStored = (schedule: StoredSchedule) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  } catch {
    // Storage can be unavailable; the selection then lasts for this visit.
  }
};

const useMySchedule = (versionId: null | string) => {
  const [stored, setStored] = useState<StoredSchedule>(readStored);

  const update = useCallback(
    (change: (ids: string[]) => string[]) => {
      if (versionId === null) {
        return;
      }

      setStored((current) => {
        const next = {
          ...current,
          [versionId]: change(current[versionId] ?? []),
        };

        writeStored(next);

        return next;
      });
    },
    [versionId],
  );

  const savedIds = useMemo(
    () => new Set(versionId === null ? [] : (stored[versionId] ?? [])),
    [stored, versionId],
  );

  const toggle = useCallback(
    (cardId: string) => {
      update((ids) =>
        ids.includes(cardId)
          ? ids.filter((id) => id !== cardId)
          : [...ids, cardId],
      );
    },
    [update],
  );

  const addMany = useCallback(
    (cardIds: string[]) => {
      update((ids) => [...new Set([...ids, ...cardIds])]);
    },
    [update],
  );

  const clear = useCallback(() => {
    update(() => []);
  }, [update]);

  return { addMany, clear, savedIds, toggle };
};

export { useMySchedule };
