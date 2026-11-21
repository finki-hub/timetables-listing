import { CalendarXIcon } from 'lucide-react';
import { useState } from 'react';

import { CardBlock, type CardNavigate } from '@/components/CardBlock';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dayNames } from '@/lib/constants';
import { compareCards, toMinutes, trimPeriods } from '@/lib/schedule';
import { cn } from '@/lib/utils';

import type { Period, TimetableCard } from '../../../api/src/types';

type CardActions = {
  conflictIds?: Set<string>;
  onNavigate?: CardNavigate;
  onToggleSaved?: (cardId: string) => void;
  savedIds?: Set<string>;
};

type CoverageQuery = {
  cards: TimetableCard[];
  dayIndex: number;
  periodPosition: number;
  periodPositionByNumber: PeriodPositionByNumber;
};

type DayLaneLayout = {
  dayIndex: number;
  positionedCards: PositionedCard[];
};

type MobileScheduleProps = CardActions & {
  cards: TimetableCard[];
  todayIndex: null | number;
};

type PeriodPositionByNumber = Map<number, number>;

type PositionedCard = {
  card: TimetableCard;
  lane: number;
  laneCount: number;
};

type TimetableGridProps = CardActions & {
  cards: TimetableCard[];
  emptyDescription?: string;
  emptyTitle?: string;
  isLoading: boolean;
  nowMinutes?: null | number;
  periods: Period[];
  todayIndex?: null | number;
};

const CARD_GAP_REM = 0.5;

const GRID_CLASS =
  'grid min-w-[860px] grid-cols-[5.5rem_repeat(5,minmax(9rem,1fr))] gap-2 print:min-w-0';

const SUBJECT_COLLATOR = new Intl.Collator('mk');

const periodPositions = (periods: Period[]): PeriodPositionByNumber =>
  new Map(periods.map((period, index) => [period.period, index]));

const cardStartPosition = (
  card: TimetableCard,
  periodPositionByNumber: PeriodPositionByNumber,
) => periodPositionByNumber.get(card.periodIndex) ?? null;

const cardEndPosition = (
  card: TimetableCard,
  periodPositionByNumber: PeriodPositionByNumber,
) => {
  const startPosition = cardStartPosition(card, periodPositionByNumber);

  return startPosition === null ? null : startPosition + card.durationPeriods;
};

const cardsOverlap = (
  left: TimetableCard,
  right: TimetableCard,
  periodPositionByNumber: PeriodPositionByNumber,
) => {
  const leftStart = cardStartPosition(left, periodPositionByNumber);
  const leftEnd = cardEndPosition(left, periodPositionByNumber);
  const rightStart = cardStartPosition(right, periodPositionByNumber);
  const rightEnd = cardEndPosition(right, periodPositionByNumber);

  return (
    leftStart !== null &&
    leftEnd !== null &&
    rightStart !== null &&
    rightEnd !== null &&
    leftStart < rightEnd &&
    rightStart < leftEnd
  );
};

const firstAvailableLane = (
  lanes: TimetableCard[][],
  card: TimetableCard,
  periodPositionByNumber: PeriodPositionByNumber,
) => {
  for (const [index, laneCards] of lanes.entries()) {
    if (
      laneCards.every(
        (laneCard) => !cardsOverlap(laneCard, card, periodPositionByNumber),
      )
    ) {
      return index;
    }
  }

  return lanes.length;
};

const overlapGroups = (
  cards: TimetableCard[],
  periodPositionByNumber: PeriodPositionByNumber,
) => {
  const groups: TimetableCard[][] = [];
  let currentGroup: TimetableCard[] = [];
  let currentGroupEnd = -Infinity;

  for (const card of cards) {
    const startPosition = cardStartPosition(card, periodPositionByNumber);
    const endPosition = cardEndPosition(card, periodPositionByNumber);

    if (startPosition === null || endPosition === null) {
      continue;
    }

    if (currentGroup.length > 0 && startPosition >= currentGroupEnd) {
      groups.push(currentGroup);
      currentGroup = [];
    }

    currentGroup.push(card);
    currentGroupEnd = Math.max(currentGroupEnd, endPosition);
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

const positionOverlapGroup = (
  cards: TimetableCard[],
  periodPositionByNumber: PeriodPositionByNumber,
): PositionedCard[] => {
  const lanes: TimetableCard[][] = [];
  const positionedCards = cards.map((card) => {
    const lane = firstAvailableLane(lanes, card, periodPositionByNumber);

    lanes[lane] = [...(lanes[lane] ?? []), card];

    return { card, lane };
  });
  const laneCount = Math.max(lanes.length, 1);

  return positionedCards.map((positionedCard) => ({
    ...positionedCard,
    laneCount,
  }));
};

const isCoveredByCard = ({
  cards,
  dayIndex,
  periodPosition,
  periodPositionByNumber,
}: CoverageQuery) =>
  cards.some((card) => {
    const startPosition = cardStartPosition(card, periodPositionByNumber);
    const endPosition = cardEndPosition(card, periodPositionByNumber);

    return (
      card.dayIndex === dayIndex &&
      startPosition !== null &&
      endPosition !== null &&
      startPosition <= periodPosition &&
      endPosition > periodPosition
    );
  });

const buildDayLaneLayouts = (
  cards: TimetableCard[],
  periods: Period[],
): DayLaneLayout[] => {
  const periodPositionByNumber = periodPositions(periods);

  return dayNames.map((_, dayIndex) => {
    const dayCards = cards
      .filter(
        (card) =>
          card.dayIndex === dayIndex &&
          periodPositionByNumber.has(card.periodIndex),
      )
      .toSorted((left, right) => {
        const leftPosition = cardStartPosition(left, periodPositionByNumber);
        const rightPosition = cardStartPosition(right, periodPositionByNumber);
        const leftEnd = cardEndPosition(left, periodPositionByNumber);
        const rightEnd = cardEndPosition(right, periodPositionByNumber);

        return (
          (leftPosition ?? 0) - (rightPosition ?? 0) ||
          (rightEnd ?? 0) - (leftEnd ?? 0) ||
          SUBJECT_COLLATOR.compare(left.subject.name, right.subject.name)
        );
      });
    const positionedCards = overlapGroups(
      dayCards,
      periodPositionByNumber,
    ).flatMap((group) => positionOverlapGroup(group, periodPositionByNumber));

    return {
      dayIndex,
      positionedCards,
    };
  });
};

const GridSkeleton = () => (
  <div className="grid gap-4">
    <div className="hidden rounded-xl border bg-card p-3 shadow-sm lg:block">
      <div className={GRID_CLASS}>
        <Skeleton className="h-10" />
        {dayNames.map((day) => (
          <Skeleton
            className="h-10"
            key={day}
          />
        ))}
        {Array.from({ length: 8 }, (_, index) => `cell-${String(index)}`).map(
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
      <Skeleton className="h-11" />
      <Card>
        <CardHeader className="p-4">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-4 pt-0">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    </div>
  </div>
);

const initialMobileDay = (cards: TimetableCard[], todayIndex: null | number) =>
  todayIndex !== null && todayIndex < dayNames.length
    ? todayIndex
    : Math.max(
        dayNames.findIndex((_, dayIndex) =>
          cards.some((card) => card.dayIndex === dayIndex),
        ),
        0,
      );

const MobileSchedule = ({
  cards,
  conflictIds,
  onNavigate,
  onToggleSaved,
  savedIds,
  todayIndex,
}: MobileScheduleProps) => {
  const [selectedDay, setSelectedDay] = useState<null | number>(null);
  const activeDay = selectedDay ?? initialMobileDay(cards, todayIndex);
  const dayCards = cards
    .filter((card) => card.dayIndex === activeDay)
    .toSorted(compareCards);

  return (
    <div className="grid gap-3 lg:hidden print:hidden">
      <fieldset
        aria-label="Ден"
        className="grid min-w-0 grid-cols-5 gap-1 rounded-lg bg-muted p-1"
      >
        {dayNames.map((day, dayIndex) => {
          const count = cards.filter(
            (card) => card.dayIndex === dayIndex,
          ).length;

          return (
            <button
              aria-pressed={activeDay === dayIndex}
              className={cn(
                'flex min-h-11 flex-col items-center justify-center rounded-md text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activeDay === dayIndex
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground',
              )}
              key={day}
              onClick={() => {
                setSelectedDay(dayIndex);
              }}
              title={day}
              type="button"
            >
              <span>{day.slice(0, 3)}</span>
              <span className="text-[10px] font-medium opacity-80">
                {count}
              </span>
            </button>
          );
        })}
      </fieldset>
      <h2 className="text-base font-semibold">
        {dayNames[activeDay]}
        {activeDay === todayIndex ? (
          <span className="ml-2 text-xs font-medium text-primary">денес</span>
        ) : null}
      </h2>
      {dayCards.length > 0 ? (
        dayCards.map((card) => (
          <CardBlock
            card={card}
            hasConflict={conflictIds?.has(card.id)}
            isSaved={savedIds?.has(card.id)}
            key={card.id}
            onNavigate={onNavigate}
            onToggleSaved={onToggleSaved}
          />
        ))
      ) : (
        <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          Нема термини.
        </p>
      )}
    </div>
  );
};

const PeriodLabel = ({
  nowMinutes,
  period,
  row,
}: {
  nowMinutes: null | number;
  period: Period;
  row: number;
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-lg border bg-muted/30 px-1 py-2 text-xs tabular-nums',
      nowMinutes !== null &&
        toMinutes(period.startTime) <= nowMinutes &&
        toMinutes(period.endTime) > nowMinutes &&
        'border-primary text-primary',
    )}
    style={{ gridColumn: 1, gridRow: row }}
  >
    <span className="font-semibold">{period.startTime}</span>
    <span className="text-muted-foreground">{period.endTime}</span>
  </div>
);

const EmptySchedule = ({
  description,
  title,
}: {
  description: string;
  title: string;
}) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 text-center shadow-sm">
    <CalendarXIcon
      aria-hidden="true"
      className="mb-4 h-10 w-10 text-muted-foreground/40"
    />
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="mt-1 max-w-sm px-4 text-sm text-muted-foreground">
      {description}
    </p>
  </div>
);

const TimetableGrid = ({
  cards,
  conflictIds,
  emptyDescription = 'Избраниот запис нема закажани термини во оваа верзија.',
  emptyTitle = 'Нема термини',
  isLoading,
  nowMinutes = null,
  onNavigate,
  onToggleSaved,
  periods,
  savedIds,
  todayIndex = null,
}: TimetableGridProps) => {
  const [activeDesktopCardId, setActiveDesktopCardId] = useState<null | string>(
    null,
  );
  const [lastActiveDesktopCardId, setLastActiveDesktopCardId] = useState<
    null | string
  >(null);

  if (isLoading) {
    return <GridSkeleton />;
  }

  if (cards.length === 0) {
    return (
      <EmptySchedule
        description={emptyDescription}
        title={emptyTitle}
      />
    );
  }

  const visiblePeriods = trimPeriods(periods, cards);
  const dayLaneLayouts = buildDayLaneLayouts(cards, visiblePeriods);
  const periodPositionByNumber = periodPositions(visiblePeriods);
  const gridTemplateRows = `auto repeat(${String(visiblePeriods.length)}, minmax(8rem, auto))`;
  const activeDesktopCard = activeDesktopCardId
    ? (cards.find((card) => card.id === activeDesktopCardId) ?? null)
    : null;

  return (
    <>
      <MobileSchedule
        cards={cards}
        conflictIds={conflictIds}
        onNavigate={onNavigate}
        onToggleSaved={onToggleSaved}
        savedIds={savedIds}
        todayIndex={todayIndex}
      />
      <div className="hidden overflow-x-auto rounded-xl border bg-card p-3 shadow-sm lg:block print:block print:overflow-visible print:border-0 print:p-0">
        <div
          className={GRID_CLASS}
          style={{ gridTemplateRows }}
        >
          <div
            className="flex items-center justify-center rounded-lg bg-muted/65 px-2 py-2 text-xs font-semibold text-muted-foreground"
            style={{ gridColumn: 1, gridRow: 1 }}
          >
            Час
          </div>
          {dayNames.map((day, dayIndex) => (
            <div
              aria-current={dayIndex === todayIndex ? 'date' : undefined}
              className={cn(
                'flex items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-semibold',
                dayIndex === todayIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/65 text-foreground',
              )}
              key={day}
              style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
            >
              {day}
            </div>
          ))}
          {visiblePeriods.map((period, periodPosition) => (
            <PeriodLabel
              key={period.id}
              nowMinutes={nowMinutes}
              period={period}
              row={periodPosition + 2}
            />
          ))}
          {visiblePeriods.flatMap((period, periodPosition) =>
            dayNames.map((day, dayIndex) =>
              isCoveredByCard({
                cards,
                dayIndex,
                periodPosition,
                periodPositionByNumber,
              }) ? null : (
                <div
                  className={cn(
                    'rounded-lg border bg-card/50',
                    dayIndex === todayIndex && 'bg-primary/5',
                  )}
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
              className="group/day relative isolate"
              key={layout.dayIndex}
              style={{
                gridColumn: layout.dayIndex + 2,
                gridRow: `2 / span ${String(visiblePeriods.length)}`,
              }}
            >
              {layout.positionedCards.map(({ card, lane, laneCount }) => {
                const isActive = activeDesktopCardId === card.id;
                const isDimmed =
                  activeDesktopCard !== null &&
                  activeDesktopCard.id !== card.id &&
                  activeDesktopCard.dayIndex === card.dayIndex &&
                  cardsOverlap(activeDesktopCard, card, periodPositionByNumber);
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
                const startPosition = cardStartPosition(
                  card,
                  periodPositionByNumber,
                );

                if (startPosition === null) {
                  return null;
                }

                return (
                  <CardBlock
                    card={card}
                    className={cn(
                      'absolute min-h-0 transition-[left,width,opacity,filter,box-shadow] duration-200 ease-out',
                      isActive && 'z-20 opacity-100 shadow-xl brightness-100',
                      !isActive &&
                        lastActiveDesktopCardId === card.id &&
                        'z-10',
                      isDimmed && 'opacity-45 brightness-75',
                    )}
                    hasConflict={conflictIds?.has(card.id)}
                    isSaved={savedIds?.has(card.id)}
                    key={card.id}
                    onBlur={() => {
                      setActiveDesktopCardId(null);
                    }}
                    onFocus={() => {
                      setActiveDesktopCardId(card.id);
                      setLastActiveDesktopCardId(card.id);
                    }}
                    onMouseEnter={() => {
                      setActiveDesktopCardId(card.id);
                      setLastActiveDesktopCardId(card.id);
                    }}
                    onMouseLeave={() => {
                      setActiveDesktopCardId(null);
                    }}
                    onNavigate={onNavigate}
                    onToggleSaved={onToggleSaved}
                    style={{
                      height: `calc(((100% - ${String(visiblePeriods.length - 1)} * ${String(CARD_GAP_REM)}rem) / ${String(visiblePeriods.length)}) * ${String(card.durationPeriods)} + ${String(card.durationPeriods - 1)} * ${String(CARD_GAP_REM)}rem)`,
                      left: cardLeft,
                      // Reveal rows a short card would otherwise clip.
                      minHeight: isActive ? 'fit-content' : undefined,
                      top: `calc(((100% - ${String(visiblePeriods.length - 1)} * ${String(CARD_GAP_REM)}rem) / ${String(visiblePeriods.length)} + ${String(CARD_GAP_REM)}rem) * ${String(startPosition)})`,
                      width: cardWidth,
                    }}
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
