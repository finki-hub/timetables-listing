import type { ViewMode } from '@/lib/types';

import { ContextBar } from '@/components/ContextBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TimetableControls } from '@/components/TimetableControls';
import { TimetableGrid } from '@/components/TimetableGrid';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IconLink } from '@/components/ui/icon-controls';
import { useTimetable } from '@/hooks/use-timetable';
import { useUrlState } from '@/hooks/use-url-state';

const githubPath =
  'M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18.92-.26 1.9-.38 2.88-.39.98.01 1.96.13 2.88.39 2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.42-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z';

const App = () => {
  const [urlState, setUrlState] = useUrlState();
  const timetable = useTimetable({
    entityId: urlState.entityId,
    onVersionFallback: (versionId) => {
      setUrlState({ entityId: null, versionId }, { replace: true });
    },
    query: urlState.query,
    versionId: urlState.versionId,
    view: urlState.view,
  });

  const activeEntityId = timetable.selectedEntity
    ? timetable.selectedEntity.id
    : null;
  const activeVersionId = timetable.selectedVersion?.id ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto flex h-14 items-center gap-3 sm:h-16">
          <img
            alt="ФИНКИ Хаб"
            className="h-10 w-10 object-contain sm:h-11 sm:w-11"
            src="/logo.png"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold leading-tight tracking-tight sm:text-xl">
              ФИНКИ Хаб
            </h1>
            <p className="hidden text-xs font-medium text-muted-foreground sm:block">
              Распореди
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <IconLink
              href="https://github.com/finki-hub/finki-hub-timetables-listing"
              rel="noopener noreferrer"
              target="_blank"
              title="GitHub репозиториум"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d={githubPath} />
              </svg>
            </IconLink>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-4 sm:py-8">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 px-4 sm:px-6">
            <CardTitle className="text-lg">Најди распоред</CardTitle>
            <CardDescription>
              Прво избери распоред, а потоа запис од него. Изборот се пресликува
              во URL-то за да може да се сподели конкретниот приказ.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-6 pt-4 sm:px-6">
            <TimetableControls
              entities={timetable.filteredEntities}
              onEntityChange={(entityId) => {
                setUrlState({ entityId });
              }}
              onQueryChange={(query) => {
                setUrlState({ entityId: null, query }, { replace: true });
              }}
              onVersionChange={(versionId) => {
                setUrlState({ entityId: null, versionId });
              }}
              onViewChange={(view: ViewMode) => {
                setUrlState({ entityId: null, query: '', view });
              }}
              query={urlState.query}
              selectedEntityId={activeEntityId}
              selectedVersionId={activeVersionId}
              versions={timetable.versions}
              view={urlState.view}
            />
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6">
          <ContextBar
            selectedEntity={timetable.selectedEntity}
            selectedVersion={timetable.selectedVersion}
            view={urlState.view}
            visibleCardCount={timetable.visibleCards.length}
          />
        </div>

        {timetable.error ? (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:mt-6">
            <h3 className="text-lg font-semibold text-destructive">
              Не може да се вчитаат податоците
            </h3>
            <p className="mt-1 text-sm text-destructive/80">
              {timetable.error}
            </p>
          </div>
        ) : null}

        <section className="mt-4 sm:mt-6">
          <TimetableGrid
            cards={timetable.visibleCards}
            isLoading={timetable.isLoading}
            periods={timetable.timetable?.periods ?? []}
          />
        </section>
      </main>
    </div>
  );
};

export default App;
