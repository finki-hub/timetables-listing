import { MapPinIcon, UsersIcon } from 'lucide-react';

import type { ResolvedCard } from '@/lib/types';

type CardBlockProps = {
  card: ResolvedCard;
};

const CardBlock = ({ card }: CardBlockProps) => {
  const people =
    card.teachers.map((teacher) => teacher.short).join(', ') ||
    card.classes.map((entity) => entity.short).join(', ');
  const rooms = card.classrooms.map((room) => room.short).join(', ');

  return (
    <article
      className="group/card relative flex h-full min-h-24 flex-col gap-2 overflow-hidden rounded-lg border bg-card p-3 pl-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
      title={`${card.subject.name}\n${card.period.starttime} – ${card.period.endtime}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-primary/60 transition-colors group-hover/card:bg-primary"
      />
      <h3 className="line-clamp-3 text-sm font-bold leading-tight text-foreground">
        {card.subject.name}
      </h3>
      <div className="mt-auto flex flex-col gap-1.5 text-xs text-muted-foreground">
        {people ? (
          <span className="flex items-center gap-1.5">
            <UsersIcon
              aria-hidden="true"
              className="size-3.5 shrink-0"
            />
            <span className="truncate">{people}</span>
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
