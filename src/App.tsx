import { CalendarDaysIcon, DatabaseIcon } from 'lucide-react';

import type { ViewMode } from '@/lib/types';

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

const viewTabs: Array<{ label: string; value: ViewMode }> = [
  { label: 'Групи', value: 'class' },
  { label: 'Професори', value: 'teacher' },
  { label: 'Простории', value: 'classroom' },
];

const App = () => {
  const [urlState, setUrlState] = useUrlState();
  const timetable = useTimetable({
    entityId: urlState.entityId,
    query: urlState.query,
    versionId: urlState.versionId,
    view: urlState.view,
  });

  const activeVersionId = timetable.selectedVersion?.id ?? null;
  const activeEntityId = timetable.selectedEntity
    ? timetable.selectedEntity.id
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center gap-3 sm:h-16">
          <img
            alt="ФИНКИ Хаб"
            className="h-12 w-12 object-contain"
            src="/logo.png"
          />
          <h1 className="min-w-0 flex-1 text-base font-bold leading-tight tracking-tight sm:text-xl">
            ФИНКИ Хаб / Распореди
          </h1>
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
        <nav className="-mx-3 mb-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b px-3 sm:mx-0 sm:mb-6 sm:px-0">
          {viewTabs.map((tab) => (
            <button
              className={`whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                urlState.view === tab.value
                  ? 'border-primary text-primary -mb-px border-b-2'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              key={tab.value}
              onClick={() => {
                setUrlState({ entityId: null, query: '', view: tab.value });
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DatabaseIcon aria-hidden="true" /> Верзии
            </div>
            <div className="mt-2 text-2xl font-bold">
              {timetable.versions.length}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDaysIcon aria-hidden="true" /> Денови
            </div>
            <div className="mt-2 text-2xl font-bold">Пон–Пет</div>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">
              Прикажани термини
            </div>
            <div className="mt-2 text-2xl font-bold">
              {timetable.visibleCards.length}
            </div>
          </div>
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Најди распоред</CardTitle>
            <CardDescription>
              Изборот се пресликува во URL-то за да може да се сподели
              конкретниот приказ.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-6 sm:px-6">
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
              query={urlState.query}
              selectedEntityId={activeEntityId}
              selectedVersionId={activeVersionId}
              versions={timetable.versions}
            />
          </CardContent>
        </Card>

        {timetable.error ? (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Не може да се вчитаат податоците</CardTitle>
              <CardDescription>{timetable.error}</CardDescription>
            </CardHeader>
          </Card>
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
