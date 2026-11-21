import { TriangleAlertIcon } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import type { useMySchedule } from '@/hooks/use-my-schedule';
import type { useTimetable } from '@/hooks/use-timetable';
import type { UrlState, useUrlState } from '@/hooks/use-url-state';
import type { ViewMode } from '@/lib/types';

import { ContextBar } from '@/components/ContextBar';
import { LoadError } from '@/components/LoadError';
import { NowNextBanner } from '@/components/NowNextBanner';
import { TimetableControls } from '@/components/TimetableControls';
import { TimetableGrid } from '@/components/TimetableGrid';
import { VersionSelect } from '@/components/VersionSelect';
import { captureEvent } from '@/lib/analytics';
import {
  findConflicts,
  isWithinRange,
  parseVersion,
  type SkopjeNow,
} from '@/lib/schedule';

import type { NamedEntity } from '../../../api/src/types';

type SchedulePageProps = {
  mySchedule: ReturnType<typeof useMySchedule>;
  now: SkopjeNow;
  onSelectEntity: (view: ViewMode, entity: NamedEntity) => void;
  setUrlState: ReturnType<typeof useUrlState>[1];
  timetable: ReturnType<typeof useTimetable>;
  urlState: UrlState;
};

const WORK_DAYS = 5;

const countLabel = (count: number) =>
  count === 1 ? '1 термин' : `${String(count)} термини`;

const buildShareUrl = (
  view: ViewMode,
  versionId: null | string,
  entityId: null | string,
) => {
  const url = new URL(location.origin + location.pathname);

  if (versionId) {
    url.searchParams.set('version', versionId);
  }
  if (view !== 'class') {
    url.searchParams.set('view', view);
  }
  if (entityId) {
    url.searchParams.set('entity', entityId);
  }

  return url.href;
};

const ScheduleControls = ({
  onSelectEntity,
  setUrlState,
  timetable,
  urlState,
}: Pick<
  SchedulePageProps,
  'onSelectEntity' | 'setUrlState' | 'timetable' | 'urlState'
>) => {
  const activeEntityId = timetable.selectedEntity?.id ?? null;
  const activeVersionId = timetable.selectedVersion?.id ?? null;
  const changeVersion = (versionId: string) => {
    setUrlState({ entityId: null, versionId });
  };

  if (urlState.page === 'my') {
    return (
      <div className="rounded-xl border bg-card p-3 shadow-sm print:hidden">
        <VersionSelect
          onChange={changeVersion}
          selectedVersionId={activeVersionId}
          versions={timetable.versions}
        />
      </div>
    );
  }

  return (
    <TimetableControls
      entities={timetable.filteredEntities}
      onEntityChange={(entityId) => {
        const position = timetable.filteredEntities.findIndex(
          (candidate) => candidate.id === entityId,
        );
        const entity = timetable.filteredEntities[position];

        if (!entity) {
          return;
        }

        captureEvent(
          'result_clicked',
          // eslint-disable-next-line camelcase -- PostHog property names are snake_case.
          { position, result_id: entityId },
        );
        onSelectEntity(urlState.view, entity);
      }}
      onQueryChange={(query) => {
        setUrlState({ entityId: activeEntityId, query }, { replace: true });
      }}
      onSearchClose={() => {
        if (urlState.query.length > 0) {
          setUrlState({ query: '' }, { replace: true });
        }
      }}
      onVersionChange={changeVersion}
      onViewChange={(view) => {
        setUrlState({ entityId: null, query: '', view });
      }}
      query={urlState.query}
      selectedEntity={timetable.selectedEntity}
      selectedVersionId={activeVersionId}
      versions={timetable.versions}
      view={urlState.view}
    />
  );
};

const scheduleMeta = (
  version: ReturnType<typeof useTimetable>['selectedVersion'],
  now: SkopjeNow,
) => {
  const info = version ? parseVersion(version.title) : null;
  const range = info?.range ?? null;
  const isCurrentVersion = isWithinRange(now.date, range);
  const isWorkDay = now.dayIndex < WORK_DAYS;

  return {
    isCurrentVersion,
    nowMinutes: isCurrentVersion && isWorkDay ? now.minutes : null,
    range,
    todayIndex: isCurrentVersion && isWorkDay ? now.dayIndex : null,
    versionId: version?.id ?? null,
    versionText: info?.rangeLabel
      ? `${info.label}, ${info.rangeLabel}`
      : (info?.label ?? ''),
  };
};

const ConflictNotice = ({ count }: { count: number }) => (
  <output className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm print:hidden">
    <TriangleAlertIcon
      aria-hidden="true"
      className="size-4 shrink-0 text-destructive"
    />
    {count} термини се преклопуваат.
  </output>
);

const SchedulePage = ({
  mySchedule,
  now,
  onSelectEntity,
  setUrlState,
  timetable,
  urlState,
}: SchedulePageProps) => {
  const isMyPage = urlState.page === 'my';
  const meta = scheduleMeta(timetable.selectedVersion, now);
  const myCards = useMemo(
    () =>
      (timetable.timetable?.cards ?? []).filter((card) =>
        mySchedule.savedIds.has(card.id),
      ),
    [mySchedule.savedIds, timetable.timetable],
  );
  const conflictIds = useMemo(() => findConflicts(myCards), [myCards]);
  const cards = isMyPage ? myCards : timetable.visibleCards;
  const title = isMyPage
    ? 'Мој распоред'
    : (timetable.selectedEntity?.name ?? 'Распоред');
  const barActions = isMyPage
    ? { onClear: mySchedule.clear }
    : {
        onAddAll: () => {
          mySchedule.addMany(cards.map((card) => card.id));
        },
        // Saved classes live in this browser, so only entity views are shareable.
        shareUrl: buildShareUrl(
          urlState.view,
          meta.versionId,
          timetable.selectedEntity?.id ?? null,
        ),
      };
  const gridMode = isMyPage
    ? {
        conflictIds,
        emptyDescription:
          'Отвори распоред и означи термини со иконата за обележување, или додај цела група со „Додај во мој“.',
        emptyTitle: 'Твојот распоред е празен',
      }
    : {};
  const isReady = !timetable.isLoading && !timetable.error;

  useEffect(() => {
    document.title = `${title} · ФИНКИ Хаб / Распореди`;

    return () => {
      document.title = 'ФИНКИ Хаб / Распореди';
    };
  }, [title]);

  return (
    <>
      <ScheduleControls
        onSelectEntity={onSelectEntity}
        setUrlState={setUrlState}
        timetable={timetable}
        urlState={urlState}
      />

      {timetable.error ? (
        <LoadError
          message={timetable.error}
          onRetry={timetable.retry}
        />
      ) : null}

      {isReady ? (
        <ContextBar
          cards={cards}
          {...barActions}
          range={meta.range}
          subtitle={`${countLabel(cards.length)} неделно · ${meta.versionText}`}
          title={title}
          versionId={meta.versionId}
        />
      ) : null}

      {isReady && meta.isCurrentVersion ? (
        <NowNextBanner
          cards={cards}
          now={now}
        />
      ) : null}

      {isMyPage && conflictIds.size > 0 ? (
        <ConflictNotice count={conflictIds.size} />
      ) : null}

      <section
        className="min-w-0"
        id="schedule-panel"
        {...(isMyPage
          ? {}
          : {
              'aria-labelledby': `schedule-panel-tab-${urlState.view}`,
              role: 'tabpanel',
            })}
      >
        {timetable.error ? null : (
          <TimetableGrid
            cards={cards}
            {...gridMode}
            isLoading={timetable.isLoading}
            nowMinutes={meta.nowMinutes}
            onNavigate={onSelectEntity}
            onToggleSaved={mySchedule.toggle}
            periods={timetable.timetable?.periods ?? []}
            savedIds={mySchedule.savedIds}
            todayIndex={meta.todayIndex}
          />
        )}
      </section>
    </>
  );
};

export { SchedulePage };
