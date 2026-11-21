import { useEffect, useState } from 'react';
import { siGithub } from 'simple-icons';

import type { ViewMode } from '@/lib/types';

import { ExamSessionsCard } from '@/components/ExamSessionsCard';
import { LoadError } from '@/components/LoadError';
import { PageTabs } from '@/components/PageTabs';
import { RoomFinder } from '@/components/RoomFinder';
import { SchedulePage } from '@/components/SchedulePage';
import { ThemeToggle } from '@/components/ThemeToggle';
import { IconLink } from '@/components/ui/icon-controls';
import { VersionSelect } from '@/components/VersionSelect';
import { useMySchedule } from '@/hooks/use-my-schedule';
import { useNow } from '@/hooks/use-now';
import { useTimetable } from '@/hooks/use-timetable';
import { useUrlState } from '@/hooks/use-url-state';
import { captureEvent } from '@/lib/analytics';
import { readLastSelection, writeLastSelection } from '@/lib/preferences';
import { skopjeNow } from '@/lib/schedule';

import type { NamedEntity } from '../../api/src/types';

const GitHubIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={siGithub.path} />
  </svg>
);

const App = () => {
  const [urlState, setUrlState] = useUrlState();
  const [lastSelection, setLastSelection] = useState(readLastSelection);
  const timetable = useTimetable({
    entityId: urlState.entityId,
    onVersionFallback: (versionId) => {
      setUrlState({ entityId: null, versionId }, { replace: true });
    },
    preferredEntityName:
      lastSelection?.view === urlState.view ? lastSelection.name : null,
    query: urlState.query,
    versionId: urlState.versionId,
    view: urlState.view,
  });
  const activeVersionId = timetable.selectedVersion?.id ?? null;
  const mySchedule = useMySchedule(activeVersionId);
  const now = skopjeNow(useNow());

  useEffect(() => {
    const saved = readLastSelection();

    if (saved && location.search === '') {
      setUrlState({ view: saved.view }, { replace: true });
    }
  }, [setUrlState]);

  useEffect(() => {
    const query = urlState.query.trim();
    const count = timetable.filteredEntities.length;

    let timer: ReturnType<typeof setTimeout> | undefined;

    if (query.length > 0) {
      timer = setTimeout(() => {
        // eslint-disable-next-line camelcase -- PostHog property names are snake_case.
        captureEvent('catalog_search', { query, result_count: count });
        if (count === 0) {
          captureEvent('search_zero_results', { query });
        }
      }, 500);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [urlState.query, timetable.filteredEntities.length]);

  const selectEntity = (view: ViewMode, entity: NamedEntity) => {
    const selection = { name: entity.name, view };

    writeLastSelection(selection);
    setLastSelection(selection);
    setUrlState({ entityId: entity.id, page: 'timetables', query: '', view });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b print:hidden">
        <div className="container mx-auto flex h-14 items-center gap-3">
          <img
            alt=""
            className="h-9 w-9 shrink-0 object-contain"
            src="/logo.png"
          />
          <h1 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight sm:text-lg">
            ФИНКИ Хаб / Распореди
          </h1>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <IconLink
              href="https://github.com/finki-hub/timetables-listing"
              rel="noopener noreferrer"
              target="_blank"
              title="GitHub репозиториум"
            >
              <GitHubIcon />
            </IconLink>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto grid grid-cols-[minmax(0,1fr)] gap-4 py-4 print:p-0">
        <div className="print:hidden">
          <PageTabs
            activePage={urlState.page}
            onChange={(page) => {
              setUrlState({ page, query: '' });
            }}
          />
        </div>

        <div
          aria-labelledby={`page-panel-tab-${urlState.page}`}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4"
          id="page-panel"
          role="tabpanel"
        >
          {urlState.page === 'sessions' ? <ExamSessionsCard /> : null}

          {urlState.page === 'rooms' ? (
            <>
              <div className="rounded-xl border bg-card p-3 shadow-sm">
                <VersionSelect
                  onChange={(versionId) => {
                    setUrlState({ entityId: null, versionId });
                  }}
                  selectedVersionId={activeVersionId}
                  versions={timetable.versions}
                />
              </div>
              {timetable.error ? (
                <LoadError
                  message={timetable.error}
                  onRetry={timetable.retry}
                />
              ) : (
                <RoomFinder
                  isLoading={timetable.isLoading}
                  now={now}
                  onOpenRoom={(room) => {
                    selectEntity('classroom', room);
                  }}
                  timetable={timetable.timetable}
                />
              )}
            </>
          ) : null}

          {urlState.page === 'timetables' || urlState.page === 'my' ? (
            <SchedulePage
              mySchedule={mySchedule}
              now={now}
              onSelectEntity={selectEntity}
              setUrlState={setUrlState}
              timetable={timetable}
              urlState={urlState}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default App;
