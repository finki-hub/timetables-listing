import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type StoredSchedule = Record<string, string[]>;

const STORAGE_KEY = 'my-schedule';

// Returns null when storage is unavailable or corrupt, so callers can keep
// the selection they already hold instead of overwriting it with nothing.
const readStored = (): null | StoredSchedule => {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}',
    ) as unknown;

    return typeof parsed !== 'object' || parsed === null
      ? null
      : Object.fromEntries(
          Object.entries(parsed).filter(
            (entry): entry is [string, string[]] =>
              Array.isArray(entry[1]) &&
              entry[1].every((id) => typeof id === 'string'),
          ),
        );
  } catch {
    return null;
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
  const [stored, setStored] = useState<StoredSchedule>(
    () => readStored() ?? {},
  );
  const latestRef = useRef(stored);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEY) {
        return;
      }

      const fresh = readStored();

      if (!fresh) {
        return;
      }

      latestRef.current = fresh;
      setStored(fresh);
    };

    addEventListener('storage', handleStorage);

    return () => {
      removeEventListener('storage', handleStorage);
    };
  }, []);

  const update = useCallback(
    (change: (ids: string[]) => string[]) => {
      if (versionId === null) {
        return;
      }

      // Re-read so a change made in another tab is merged, not overwritten.
      const current = readStored() ?? latestRef.current;
      const next = {
        ...current,
        [versionId]: change(current[versionId] ?? []),
      };

      latestRef.current = next;
      writeStored(next);
      setStored(next);
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
