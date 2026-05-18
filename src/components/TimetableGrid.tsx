import type { EduPagePeriod, ResolvedCard } from '@/lib/types';

import { CardBlock } from '@/components/CardBlock';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  <Card>
    <CardContent className="grid grid-cols-1 gap-3 pt-5 md:grid-cols-3">
      {Array.from({ length: 12 }).map((_, index) => (
        <Skeleton
          className="h-24"
          key={index}
        />
      ))}
    </CardContent>
  </Card>
);

const PeriodRow = ({ cards, period }: PeriodRowProps) => {
  const periodIndex = Number(period.period);

  return (
    <>
      <div className="flex min-h-24 flex-col justify-center rounded-lg border bg-background px-3 text-sm">
        <span className="font-bold">{period.name}</span>
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
            <div className="flex h-full items-center justify-center rounded-md bg-muted/50 text-xs font-medium text-muted-foreground">
              продолжува
            </div>
          ) : null;
        })();

        return (
          <div
            className="min-h-24 rounded-lg border border-dashed bg-background p-1.5"
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
      <Card>
        <CardHeader>
          <CardTitle>Нема записи во распоредот</CardTitle>
          <CardDescription>
            Избраниот запис нема закажани термини во оваа верзија.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {dayNames.map((day, dayIndex) => {
          const dayCards = cards.filter((card) => card.dayIndex === dayIndex);

          return (
            <Card key={day}>
              <CardHeader className="p-4">
                <CardTitle className="text-base">{day}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 p-4 pt-0">
                {dayCards.length > 0 ? (
                  dayCards.map((card) => (
                    <div
                      className="flex flex-col gap-1 rounded-lg border p-3"
                      key={card.id}
                    >
                      <div className="text-xs font-medium text-muted-foreground">
                        {card.period.starttime}–{card.period.endtime}
                      </div>
                      <CardBlock card={card} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Нема термини.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border bg-card p-2 shadow-sm lg:block">
        <div className="grid min-w-[980px] grid-cols-[7rem_repeat(5,minmax(10rem,1fr))] gap-2">
          <div className="rounded-md bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground">
            Час
          </div>
          {dayNames.map((day) => (
            <div
              className="rounded-md bg-primary px-3 py-3 text-center text-sm font-semibold text-primary-foreground"
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
