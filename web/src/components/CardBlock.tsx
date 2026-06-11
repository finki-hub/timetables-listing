import type {
  CSSProperties,
  FocusEventHandler,
  MouseEventHandler,
} from 'react';

import { MapPinIcon, UserIcon } from 'lucide-react';

import type { TimetableCard } from '@/lib/types';

import { cn } from '@/lib/utils';

type CardBlockProps = {
  card: TimetableCard;
  className?: string;
  onBlur?: FocusEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>;
  style?: CSSProperties;
  tabIndex?: number;
};

const CardBlock = ({
  card,
  className,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  style,
  tabIndex,
}: CardBlockProps) => {
  const people = card.teachers.map((teacher) => teacher.short);
  const rooms = card.classrooms.map((room) => room.short).join(', ');
  const classroomNames = card.classrooms.map((room) => room.name).join(', ');
  const tooltipLines = [
    card.subject.name,
    `${card.startTime} - ${card.endTime}`,
    ...(card.teachers.length > 0
      ? ['', ...card.teachers.map((teacher) => teacher.name)]
      : []),
    '',
    classroomNames.length > 0 ? classroomNames : 'Без просторија',
  ];

  return (
    <article
      className={cn(
        'group/card relative flex h-full min-h-24 flex-col gap-2 overflow-hidden rounded-lg border bg-card p-3 pl-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md',
        className,
      )}
      onBlur={onBlur}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      tabIndex={tabIndex}
      title={tooltipLines.join('\n')}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-primary/60 transition-colors group-hover/card:bg-primary"
      />
      <h3 className="line-clamp-3 text-sm font-bold leading-tight text-foreground">
        {card.subject.name}
      </h3>
      <div className="mt-auto flex flex-col gap-1.5 text-xs text-muted-foreground">
        {people.length > 0 ? (
          <span className="flex min-w-0 flex-col gap-0.5">
            {people.map((person) => (
              <span
                className="flex min-w-0 items-center gap-1.5"
                key={person}
              >
                <UserIcon
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />
                <span className="truncate">{person}</span>
              </span>
            ))}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <MapPinIcon
            aria-hidden="true"
            className="size-3.5 shrink-0"
          />
          <span className="truncate">{rooms || 'Без просторија'}</span>
        </span>
      </div>
    </article>
  );
};

export { CardBlock };
