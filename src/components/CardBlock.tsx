import { MapPinIcon, UsersIcon } from 'lucide-react';

import type { ResolvedCard } from '@/lib/types';

import { Badge } from '@/components/ui/badge';

type CardBlockProps = {
  card: ResolvedCard;
};

const CardBlock = ({ card }: CardBlockProps) => (
  <article
    className="flex h-full min-h-24 flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50"
    title={`${card.subject.name}\n${card.period.starttime} - ${card.period.endtime}`}
  >
    <div className="flex items-start justify-between gap-2">
      <h3 className="line-clamp-3 text-sm font-bold leading-tight text-foreground">
        {card.subject.name}
      </h3>
      {card.weeks ? <Badge variant="outline">Нед. {card.weeks}</Badge> : null}
    </div>
    <div className="mt-auto flex flex-col gap-1.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <UsersIcon aria-hidden="true" />
        <span className="truncate">
          {card.teachers.map((teacher) => teacher.short).join(', ') ||
            card.classes.map((entity) => entity.short).join(', ')}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <MapPinIcon aria-hidden="true" />
        <span className="truncate">
          {card.classrooms.map((room) => room.short).join(', ') ||
            'Без просторија'}
        </span>
      </span>
    </div>
  </article>
);

export { CardBlock };
