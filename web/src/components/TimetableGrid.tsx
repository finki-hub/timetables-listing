import { CalendarXIcon } from 'lucide-react';
import { useState } from 'react';

import type { Period, TimetableCard } from '@/lib/types';

import { CardBlock } from '@/components/CardBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dayNames } from '@/lib/constants';
import { cn } from '@/lib/utils';

type DayLaneLayout = {
  dayIndex: number;
  positionedCards: PositionedCard[];
};

type PositionedCard = {
  card: TimetableCard;
  lane: number;
  laneCount: number;
};

type TimetableGridProps = {
  cards: TimetableCard[];
  isLoading: boolean;
  periods: Period[];
};

const CARD_GAP_REM = 0.5;

const cardEndPeriod = (card: TimetableCard) =>
  card.periodIndex + card.durationPeriods;

const cardsOverlap = (left: TimetableCard, right: TimetableCard) =>
  left.periodIndex < cardEndPeriod(right) &&
  right.periodIndex < cardEndPeriod(left);

const firstAvailableLane = (lanes: TimetableCard[][], card: TimetableCard) => {
  for (const [index, laneCards] of lanes.entries()) {
    if (laneCards.every((laneCard) => !cardsOverlap(laneCard, card))) {
      return index;
    }
  }

  return lanes.length;
};

const overlapGroups = (cards: TimetableCard[]) => {
  const groups: TimetableCard[][] = [];
  let currentGroup: TimetableCard[] = [];
  let currentGroupEnd = -Infinity;

  for (const card of cards) {
    if (currentGroup.length > 0 && card.periodIndex >= currentGroupEnd) {
      groups.push(currentGroup);
      currentGroup = [];
    }

    currentGroup.push(card);
    currentGroupEnd = Math.max(currentGroupEnd, cardEndPeriod(card));
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

const positionOverlapGroup = (cards: TimetableCard[]): PositionedCard[] => {
  const lanes: TimetableCard[][] = [];
  const positionedCards = cards.map((card) => {
    const lane = firstAvailableLane(lanes, card);

    lanes[lane] = [...(lanes[lane] ?? []), card];

    return { card, lane };
  });
  const laneCount = Math.max(lanes.length, 1);

  return positionedCards.map((positionedCard) => ({
    ...positionedCard,
    laneCount,
  }));
};

const isCoveredByCard = (
  cards: TimetableCard[],
  dayIndex: number,
  periodIndex: number,
) =>
  cards.some(
    (card) =>
      card.dayIndex === dayIndex &&
      card.periodIndex <= periodIndex &&
      cardEndPeriod(card) > periodIndex,
  );

const buildDayLaneLayouts = (
  cards: TimetableCard[],
  periods: Period[],
): DayLaneLayout[] => {
  const validPeriodIndexes = new Set(periods.map((period) => period.period));

  return dayNames.map((_, dayIndex) => {
    const dayCards = cards
      .filter(
        (card) =>
          card.dayIndex === dayIndex &&
          validPeriodIndexes.has(card.periodIndex),
      )
      .toSorted(
        (left, right) =>
          left.periodIndex - right.periodIndex ||
          cardEndPeriod(right) - cardEndPeriod(left) ||
          left.subject.name.localeCompare(right.subject.name, 'mk'),
      );
    const positionedCards = overlapGroups(dayCards).flatMap((group) =>
      positionOverlapGroup(group),
    );

    return {
      dayIndex,
      positionedCards,
    };
  });
};

const GridSkeleton = () => (
  <div className="grid gap-4">
    <div className="hidden rounded-xl border bg-card p-3 shadow-sm lg:block">
      <div className="grid min-w-[980px] grid-cols-[8rem_repeat(5,minmax(10rem,1fr))] gap-2">
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

const TimetableGrid = ({ cards, isLoading, periods }: TimetableGridProps) => {
  const [activeDesktopCardId, setActiveDesktopCardId] = useState<null | string>(
    null,
  );

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

  const dayLaneLayouts = buildDayLaneLayouts(cards, periods);
  const gridTemplateRows = `auto repeat(${String(periods.length)}, minmax(7rem, auto))`;
  const activeDesktopCard = activeDesktopCardId
    ? (cards.find((card) => card.id === activeDesktopCardId) ?? null)
    : null;

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
              <CardContent className="flex flex-col gap-3 p-4 pt-3">
                {dayCards.length > 0 ? (
                  dayCards.map((card) => (
                    <div
                      className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3"
                      key={card.id}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="inline-flex items-center rounded-md bg-background px-2 py-0.5 text-xs font-medium shadow-sm">
                          {card.startTime} - {card.endTime}
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
        <div
          className="grid min-w-[980px] grid-cols-[8rem_repeat(5,minmax(10rem,1fr))] gap-2"
          style={{ gridTemplateRows }}
        >
          <div
            className="flex items-center justify-center rounded-lg border bg-muted/65 px-3 py-3 text-sm font-semibold text-foreground"
            style={{ gridColumn: 1, gridRow: 1 }}
          >
            <span>Час</span>
          </div>
          {dayNames.map((day, dayIndex) => (
            <div
              className="flex items-center justify-center rounded-lg bg-primary px-3 py-3 text-center text-sm font-semibold text-primary-foreground"
              key={day}
              style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
            >
              {day}
            </div>
          ))}
          {periods.map((period, periodPosition) => (
            <div
              className="flex min-h-28 items-center justify-center rounded-lg border bg-muted/30 px-3 py-2 text-sm"
              key={period.id}
              style={{ gridColumn: 1, gridRow: periodPosition + 2 }}
            >
              <span className="whitespace-nowrap font-semibold text-foreground">
                {period.startTime} - {period.endTime}
              </span>
            </div>
          ))}
          {periods.flatMap((period, periodPosition) =>
            dayNames.map((day, dayIndex) =>
              isCoveredByCard(cards, dayIndex, period.period) ? null : (
                <div
                  className="min-h-28 rounded-lg border bg-card/50 transition-colors hover:bg-card"
                  key={`${day}-${period.id}`}
                  style={{
                    gridColumn: dayIndex + 2,
                    gridRow: periodPosition + 2,
                  }}
                />
              ),
            ),
          )}
          {dayLaneLayouts.map((layout) => (
            <div
              className="group/day relative"
              key={layout.dayIndex}
              style={{
                gridColumn: layout.dayIndex + 2,
                gridRow: `2 / span ${String(periods.length)}`,
              }}
            >
              {layout.positionedCards.map(({ card, lane, laneCount }) => {
                const isActive = activeDesktopCardId === card.id;
                const isDimmed =
                  activeDesktopCard !== null &&
                  activeDesktopCard.id !== card.id &&
                  activeDesktopCard.dayIndex === card.dayIndex &&
                  cardsOverlap(activeDesktopCard, card);
                const laneGapCount = laneCount - 1;
                const laneWidthUnit =
                  laneCount === 1
                    ? '100%'
                    : `(100% - ${String(laneGapCount)} * ${String(CARD_GAP_REM)}rem) / ${String(laneCount)}`;
                const inactiveLeft =
                  lane === 0
                    ? 0
                    : `calc((${laneWidthUnit} + ${String(CARD_GAP_REM)}rem) * ${String(lane)})`;
                const inactiveWidth =
                  laneCount === 1 ? '100%' : `calc(${laneWidthUnit})`;
                const cardLeft = isActive ? 0 : inactiveLeft;
                const cardWidth = isActive ? '100%' : inactiveWidth;

                return (
                  <CardBlock
                    card={card}
                    className={cn(
                      'absolute min-h-0 transition-[left,width,opacity,filter,box-shadow] duration-200 ease-out',
                      'focus-visible:outline-none',
                      isActive && 'z-20 opacity-100 shadow-xl brightness-100',
                      isDimmed && 'opacity-45 brightness-75',
                    )}
                    key={card.id}
                    onBlur={() => {
                      setActiveDesktopCardId(null);
                    }}
                    onFocus={() => {
                      setActiveDesktopCardId(card.id);
                    }}
                    onMouseEnter={() => {
                      setActiveDesktopCardId(card.id);
                    }}
                    onMouseLeave={() => {
                      setActiveDesktopCardId(null);
                    }}
                    style={{
                      height: `calc(((100% - ${String(periods.length - 1)} * ${String(CARD_GAP_REM)}rem) / ${String(periods.length)}) * ${String(card.durationPeriods)} + ${String(card.durationPeriods - 1)} * ${String(CARD_GAP_REM)}rem)`,
                      left: cardLeft,
                      top: `calc(((100% - ${String(periods.length - 1)} * ${String(CARD_GAP_REM)}rem) / ${String(periods.length)} + ${String(CARD_GAP_REM)}rem) * ${String(card.periodIndex)})`,
                      width: cardWidth,
                    }}
                    tabIndex={0}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export { TimetableGrid };
