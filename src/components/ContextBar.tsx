import {
  CalendarIcon,
  ClockIcon,
  GraduationCapIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react';

import type { NamedEntity, TimetableVersion, ViewMode } from '@/lib/types';

import { cn } from '@/lib/utils';

type ContextBarProps = {
  selectedEntity: NamedEntity | null;
  selectedVersion: null | TimetableVersion;
  view: ViewMode;
  visibleCardCount: number;
};

const viewIcons: Record<ViewMode, typeof UsersIcon> = {
  class: UsersIcon,
  classroom: MapPinIcon,
  teacher: GraduationCapIcon,
};

const viewLabels: Record<ViewMode, string> = {
  class: 'Група',
  classroom: 'Просторија',
  teacher: 'Професор',
};

const ContextBar = ({
  selectedEntity,
  selectedVersion,
  view,
  visibleCardCount,
}: ContextBarProps) => {
  const EntityIcon = viewIcons[view];

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:gap-6',
        !selectedEntity && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <EntityIcon
            aria-hidden="true"
            className="h-5 w-5"
          />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            {viewLabels[view]}
          </div>
          <div className="text-sm font-semibold text-foreground">
            {selectedEntity?.name ?? 'Избери запис'}
          </div>
        </div>
      </div>

      {selectedEntity ? (
        <>
          <div className="hidden h-8 w-px bg-border sm:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <CalendarIcon
                aria-hidden="true"
                className="h-5 w-5"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Верзија
              </div>
              <div className="text-sm font-semibold text-foreground">
                {selectedVersion?.title ?? '—'}
              </div>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-border sm:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ClockIcon
                aria-hidden="true"
                className="h-5 w-5"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Термини оваа недела
              </div>
              <div className="text-sm font-semibold text-foreground">
                {visibleCardCount}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export { ContextBar };
