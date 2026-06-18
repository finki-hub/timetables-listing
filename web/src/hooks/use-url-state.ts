import { useCallback, useSyncExternalStore } from 'react';

import type { ViewMode } from '@/lib/types';

export type AppPage = 'sessions' | 'timetables';

export type UrlState = {
  entityId: null | string;
  page: AppPage;
  query: string;
  versionId: null | string;
  view: ViewMode;
};

type UpdateOptions = {
  replace?: boolean;
};

const viewModes = new Set<ViewMode>([
  'class',
  'classroom',
  'subject',
  'teacher',
]);

const parse = (search: string): UrlState => {
  const params = new URLSearchParams(search);
  const rawView = params.get('view');
  const view =
    rawView && viewModes.has(rawView as ViewMode)
      ? (rawView as ViewMode)
      : 'class';
  const page = params.get('page') === 'sessions' ? 'sessions' : 'timetables';

  return {
    entityId: params.get('entity'),
    page,
    query: params.get('q') ?? '',
    versionId: params.get('version'),
    view,
  };
};

const snapshot = () => location.search;

const subscribe = (onStoreChange: () => void) => {
  addEventListener('popstate', onStoreChange);
  return () => {
    removeEventListener('popstate', onStoreChange);
  };
};

const buildUrl = (params: URLSearchParams) => {
  const query = params.toString();
  return query.length > 0 ? `${location.pathname}?${query}` : location.pathname;
};

const useUrlState = () => {
  const search = useSyncExternalStore(subscribe, snapshot, () => '');
  const state = parse(search);

  const update = useCallback(
    (next: Partial<UrlState>, options: UpdateOptions = {}) => {
      const current = parse(location.search);
      const merged = { ...current, ...next };
      const params = new URLSearchParams();

      if (merged.page !== 'timetables') {
        params.set('page', merged.page);
      }
      if (merged.versionId) {
        params.set('version', merged.versionId);
      }
      if (merged.view !== 'class') {
        params.set('view', merged.view);
      }
      if (merged.entityId) {
        params.set('entity', merged.entityId);
      }
      if (merged.query.trim()) {
        params.set('q', merged.query.trim());
      }

      const url = buildUrl(params);
      if (options.replace) {
        history.replaceState(null, '', url);
      } else {
        history.pushState(null, '', url);
      }
      dispatchEvent(new PopStateEvent('popstate'));
    },
    [],
  );

  return [state, update] as const;
};

export { useUrlState };
