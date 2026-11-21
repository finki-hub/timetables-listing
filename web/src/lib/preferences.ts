import type { ViewMode } from '@/lib/types';

export type LastSelection = {
  name: string;
  view: ViewMode;
};

const STORAGE_KEY = 'last-selection';

const views = new Set<string>(['class', 'classroom', 'subject', 'teacher']);

export const readLastSelection = (): LastSelection | null => {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null',
    ) as null | Partial<LastSelection>;

    return typeof parsed?.name === 'string' &&
      typeof parsed.view === 'string' &&
      views.has(parsed.view)
      ? { name: parsed.name, view: parsed.view }
      : null;
  } catch {
    return null;
  }
};

export const writeLastSelection = (selection: LastSelection) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // Storage can be unavailable; the selection then lasts for this visit.
  }
};
