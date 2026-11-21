import { ArrowRightIcon, RadioIcon } from 'lucide-react';

import {
  dayLabel,
  getNowNext,
  type SkopjeNow,
  toMinutes,
} from '@/lib/schedule';

import type { TimetableCard } from '../../../api/src/types';

type NowNextBannerProps = {
  cards: TimetableCard[];
  now: SkopjeNow;
};

const place = (card: TimetableCard) =>
  card.classrooms.map((room) => room.short).join(', ') || 'Без просторија';

const NowNextBanner = ({ cards, now }: NowNextBannerProps) => {
  const { current, next } = getNowNext(cards, now);

  if (!current && !next) {
    return null;
  }

  return (
    <div className="grid gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm sm:grid-cols-2 print:hidden">
      {current ? (
        <p className="flex min-w-0 items-start gap-2">
          <RadioIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <span className="min-w-0">
            <strong>Сега:</strong> {current.subject.name}, до {current.endTime}{' '}
            · {place(current)}
          </span>
        </p>
      ) : null}
      {next ? (
        <p className="flex min-w-0 items-start gap-2">
          <ArrowRightIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <span className="min-w-0">
            <strong>Следно:</strong>{' '}
            {toMinutes(next.startTime) > now.minutes &&
            next.dayIndex === now.dayIndex
              ? 'денес'
              : dayLabel(next.dayIndex)}{' '}
            {next.startTime} · {next.subject.name} · {place(next)}
          </span>
        </p>
      ) : null}
    </div>
  );
};

export { NowNextBanner };
