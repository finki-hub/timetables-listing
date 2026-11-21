import type {
  CSSProperties,
  FocusEventHandler,
  MouseEventHandler,
  ReactNode,
} from 'react';

import {
  BookmarkIcon,
  ClockIcon,
  MapPinIcon,
  TriangleAlertIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';

import type { ViewMode } from '@/lib/types';

import { cardTimeLabel, lessonType, type LessonType } from '@/lib/schedule';
import { cn } from '@/lib/utils';

import type { NamedEntity, TimetableCard } from '../../../api/src/types';

export type CardNavigate = (view: ViewMode, entity: NamedEntity) => void;

type CardBlockProps = {
  card: TimetableCard;
  className?: string;
  hasConflict?: boolean;
  isSaved?: boolean;
  onBlur?: FocusEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>;
  onNavigate?: CardNavigate;
  onToggleSaved?: (cardId: string) => void;
  style?: CSSProperties;
};

const lessonStyles: Record<
  LessonType,
  { badge: string; bar: string; label: string; short: string }
> = {
  combined: {
    badge: 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
    bar: 'bg-violet-500',
    label: 'Предавање + аудиториски',
    short: 'П+АВ',
  },
  exercise: {
    badge: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
    bar: 'bg-sky-500',
    label: 'Аудиториски',
    short: 'АВ',
  },
  lab: {
    badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    bar: 'bg-amber-500',
    label: 'Лабораториски',
    short: 'ЛАБ',
  },
  lecture: {
    badge: 'bg-primary/10 text-green-900 dark:text-green-300',
    bar: 'bg-primary',
    label: 'Предавање',
    short: 'П',
  },
};

const EntityLinks = ({
  entities,
  icon,
  onNavigate,
  view,
}: {
  entities: NamedEntity[];
  icon: ReactNode;
  onNavigate?: CardNavigate;
  view: ViewMode;
}) =>
  entities.length > 0 ? (
    <span className="flex min-w-0 items-start gap-1.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="flex min-w-0 flex-wrap gap-x-1.5">
        {entities.map((entity) =>
          onNavigate ? (
            <button
              className="max-w-full truncate rounded-sm text-left pointer-coarse:py-1 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              key={entity.id}
              onClick={() => {
                onNavigate(view, entity);
              }}
              type="button"
            >
              {entity.short}
            </button>
          ) : (
            <span
              className="truncate"
              key={entity.id}
            >
              {entity.short}
            </span>
          ),
        )}
      </span>
    </span>
  ) : null;

const iconClass = 'size-3.5';

const CardBlock = ({
  card,
  className,
  hasConflict = false,
  isSaved = false,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  onNavigate,
  onToggleSaved,
  style,
}: CardBlockProps) => {
  const type = lessonType(card.subject.name);
  const typeStyle = type ? lessonStyles[type] : null;
  const classroomNames = card.classrooms.map((room) => room.name).join(', ');
  const tooltipLines = [
    card.subject.name,
    cardTimeLabel(card),
    ...(card.teachers.length > 0
      ? ['', ...card.teachers.map((teacher) => teacher.name)]
      : []),
    '',
    classroomNames.length > 0 ? classroomNames : 'Без просторија',
    ...(card.classes.length > 0
      ? ['', card.classes.map((entity) => entity.name).join(', ')]
      : []),
  ];

  return (
    <article
      className={cn(
        'group/card relative flex h-full min-h-24 flex-col gap-1 overflow-hidden rounded-lg border bg-card p-2 pl-3 shadow-sm transition-all hover:border-primary/40 hover:shadow-md print:break-inside-avoid print:shadow-none',
        hasConflict && 'border-destructive ring-1 ring-destructive',
        className,
      )}
      onBlur={onBlur}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      title={tooltipLines.join('\n')}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          typeStyle?.bar ?? 'bg-muted-foreground/50',
        )}
      />
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <ClockIcon
          aria-hidden="true"
          className="size-3 shrink-0"
        />
        <span className="whitespace-nowrap tabular-nums">
          {cardTimeLabel(card)}
        </span>
        {typeStyle ? (
          <span
            className={cn(
              'rounded px-1 py-px text-[10px] font-semibold',
              typeStyle.badge,
            )}
            title={typeStyle.label}
          >
            {typeStyle.short}
          </span>
        ) : null}
        {hasConflict ? (
          <TriangleAlertIcon
            aria-label="Преклопување"
            className="size-3.5 shrink-0 text-destructive"
            role="img"
          />
        ) : null}
        {onToggleSaved ? (
          <button
            aria-label={
              isSaved ? 'Отстрани од мој распоред' : 'Додај во мој распоред'
            }
            aria-pressed={isSaved}
            className="ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-sm hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
            onClick={() => {
              onToggleSaved(card.id);
            }}
            type="button"
          >
            <BookmarkIcon
              aria-hidden="true"
              className={cn('size-3.5', isSaved && 'fill-primary text-primary')}
            />
          </button>
        ) : null}
      </div>
      <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-foreground">
        {onNavigate ? (
          <button
            className="rounded-sm text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              onNavigate('subject', card.subject);
            }}
            type="button"
          >
            {card.subject.name}
          </button>
        ) : (
          card.subject.name
        )}
      </h3>
      <div className="mt-auto flex flex-col gap-0.5 text-xs text-muted-foreground">
        <EntityLinks
          entities={card.teachers}
          icon={
            <UserIcon
              aria-hidden="true"
              className={iconClass}
            />
          }
          onNavigate={onNavigate}
          view="teacher"
        />
        {card.classrooms.length > 0 ? (
          <EntityLinks
            entities={card.classrooms}
            icon={
              <MapPinIcon
                aria-hidden="true"
                className={iconClass}
              />
            }
            onNavigate={onNavigate}
            view="classroom"
          />
        ) : (
          <span className="flex items-center gap-1.5">
            <MapPinIcon
              aria-hidden="true"
              className={iconClass}
            />
            Без просторија
          </span>
        )}
        <EntityLinks
          entities={card.classes}
          icon={
            <UsersIcon
              aria-hidden="true"
              className={iconClass}
            />
          }
          onNavigate={onNavigate}
          view="class"
        />
      </div>
    </article>
  );
};

export { CardBlock };
