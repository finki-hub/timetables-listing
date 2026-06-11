import { siGithub } from 'simple-icons';

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
      <header className="border-b">
        <div className="container mx-auto flex min-h-16 items-center gap-3 py-3 sm:h-16 sm:py-0">
          <img
            alt="ФИНКИ Хаб"
            className="h-12 w-12 shrink-0 object-contain"
            src="/logo.png"
          />
          <h1 className="min-w-0 flex-1 text-base font-bold leading-tight tracking-tight sm:text-xl">
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
