import { CalendarXIcon } from 'lucide-react';

import type { EduPagePeriod, ResolvedCard } from '@/lib/types';

import { CardBlock } from '@/components/CardBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dayNames } from '@/lib/resolve-cards';

type PeriodRowProps = {
  cards: ResolvedCard[];
  period: EduPagePeriod;
};

type TimetableGridProps = {
  cards: ResolvedCard[];
  isLoading: boolean;
  periods: EduPagePeriod[];
};

const GridSkeleton = () => (
  <div className="grid gap-4">
    <div className="hidden rounded-xl border bg-card p-3 shadow-sm lg:block">
      <div className="grid min-w-[980px] grid-cols-[7rem_repeat(5,minmax(10rem,1fr))] gap-2">
        <Skeleton className="h-10" />
        {dayNames.map((day) => (
          <Skeleton
            className="h-10"
            key={day}
          />
        ))}
        {Array.from({ length: 12 }, (_, index) => `cell-${String(index)}`).map(
          (cellKey) => (
            <Skeleton
              className="col-span-6 h-24"
              key={cellKey}
            />
          ),
        )}
      </div>
    </div>
    <div className="grid gap-3 lg:hidden">
      {dayNames.slice(0, 3).map((day) => (
        <Card key={day}>
          <CardHeader className="p-4">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2 p-4 pt-0">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const PeriodRow = ({ cards, period }: PeriodRowProps) => {
  const periodIndex = Number(period.period);

  return (
    <>
      <div className="flex min-h-28 flex-col justify-center gap-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        <span className="font-semibold text-foreground">{period.name}</span>
        <span className="text-xs text-muted-foreground">
          {period.starttime}–{period.endtime}
        </span>
      </div>
      {dayNames.map((day, dayIndex) => {
        const cellCards = cards.filter(
          (card) =>
            card.dayIndex === dayIndex && card.periodIndex === periodIndex,
        );
        const occupiedByPrevious = cards.some(
          (card) =>
            card.dayIndex === dayIndex &&
            card.periodIndex < periodIndex &&
            card.periodIndex + card.durationPeriods > periodIndex,
        );

        const cellContent = (() => {
          if (cellCards.length > 0) {
            return (
              <div className="flex flex-col gap-2">
                {cellCards.map((card) => (
                  <CardBlock
                    card={card}
                    key={card.id}
                  />
                ))}
              </div>
            );
          }

          return occupiedByPrevious ? (
            <div className="flex h-full min-h-28 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-xs italic text-muted-foreground/60">
              продолжува
            </div>
          ) : null;
        })();

        return (
          <div
            className="min-h-28 rounded-lg border bg-card/50 p-1.5 transition-colors hover:bg-card"
            key={`${day}-${period.id}`}
          >
            {cellContent}
          </div>
        );
      })}
    </>
  );
};

const TimetableGrid = ({ cards, isLoading, periods }: TimetableGridProps) => {
  if (isLoading) {
    return <GridSkeleton />;
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 text-center shadow-sm">
        <CalendarXIcon
          aria-hidden="true"
          className="mb-4 h-10 w-10 text-muted-foreground/40"
        />
        <h3 className="text-lg font-semibold text-foreground">
          Нема записи во распоредот
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Избраниот запис нема закажани термини во оваа верзија.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {dayNames.map((day, dayIndex) => {
          const dayCards = cards.filter((card) => card.dayIndex === dayIndex);

          return (
            <Card
              className="overflow-hidden"
              key={day}
            >
              <CardHeader className="flex flex-row items-center justify-between bg-muted/30 p-4">
                <CardTitle className="text-base">{day}</CardTitle>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {dayCards.length}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-4 pt-0">
                {dayCards.length > 0 ? (
                  dayCards.map((card) => (
                    <div
                      className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3"
                      key={card.id}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="inline-flex items-center rounded-md bg-background px-2 py-0.5 text-xs font-medium shadow-sm">
                          {card.period.starttime}–{card.period.endtime}
                        </span>
                      </div>
                      <CardBlock card={card} />
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Нема термини.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border bg-card p-3 shadow-sm lg:block">
        <div className="grid min-w-[980px] grid-cols-[7rem_repeat(5,minmax(10rem,1fr))] gap-2">
          <div className="flex items-center rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground">
            <span>Час</span>
          </div>
          {dayNames.map((day) => (
            <div
              className="flex items-center justify-center rounded-lg bg-primary px-3 py-3 text-center text-sm font-semibold text-primary-foreground"
              key={day}
            >
              {day}
            </div>
          ))}
          {periods.map((period) => (
            <PeriodRow
              cards={cards}
              key={period.id}
              period={period}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export { TimetableGrid };
