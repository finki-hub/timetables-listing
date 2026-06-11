import { CalendarXIcon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';

import type { Period, TimetableCard } from '@/lib/types';

import { CardBlock } from '@/components/CardBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dayNames } from '@/lib/constants';
import { cn } from '@/lib/utils';

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

type PeriodPositionByNumber = Map<number, number>;

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

type PeriodTimeDisplay = {
  hasMismatch: boolean;
  nameLabel: string;
  timeLabel: string;
  warning: null | string;
};

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

const normalizeTime = (time: string): null | string => {
  const [hours, minutes, ...rest] = time.trim().split(':');

  if (!hours || !minutes || rest.length > 0) {
    return null;
  }

  const numericHours = Number(hours);
  const numericMinutes = Number(minutes);

  if (
    !Number.isInteger(numericHours) ||
    !Number.isInteger(numericMinutes) ||
    numericHours < 0 ||
    numericHours > 23 ||
    numericMinutes < 0 ||
    numericMinutes > 59
  ) {
    return null;
  }

  return `${String(numericHours).padStart(2, '0')}:${String(numericMinutes).padStart(2, '0')}`;
};

const periodNameRange = (period: Period): [string, string] | null => {
  const parts = period.name.split('-').map((part) => part.trim());
  const start = parts.at(0);
  const end = parts.at(1);

  if (parts.length !== 2 || !start || !end) {
    return null;
  }

  return [start, end];
};

const periodTimeDisplay = (period: Period): PeriodTimeDisplay => {
  const nameRange = periodNameRange(period);
  const nameStartTime = nameRange ? normalizeTime(nameRange[0]) : null;
  const nameEndTime = nameRange ? normalizeTime(nameRange[1]) : null;
  const startTime = normalizeTime(period.startTime);
  const endTime = normalizeTime(period.endTime);
  const hasMismatch =
    nameStartTime !== null &&
    nameEndTime !== null &&
    startTime !== null &&
    endTime !== null &&
    (nameStartTime !== startTime || nameEndTime !== endTime);
  const timeLabel = `${period.startTime} - ${period.endTime}`;

  return {
    hasMismatch,
    nameLabel: period.name,
    timeLabel,
    warning: hasMismatch
      ? `Името на периодот (${period.name}) не се совпаѓа со почетното и крајното време (${timeLabel}).`
      : null,
  };
};

const PeriodTimeContent = ({ display }: { display: PeriodTimeDisplay }) => {
  if (!display.hasMismatch) {
    return (
      <span className="whitespace-nowrap font-semibold text-foreground">
        {display.timeLabel}
      </span>
    );
  }

  return (
    <span className="flex flex-col items-center gap-1 text-center">
      <span className="whitespace-nowrap font-semibold text-foreground">
        {display.nameLabel}
      </span>
      <span
        aria-hidden="true"
        className="flex w-full items-center gap-1.5 text-amber-400"
      >
        <span className="h-px flex-1 bg-amber-400/40" />
        <TriangleAlertIcon className="size-3.5 shrink-0" />
        <span className="h-px flex-1 bg-amber-400/40" />
      </span>
      <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
        {display.timeLabel}
      </span>
    </span>
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
          left.subject.name.localeCompare(right.subject.name, 'mk')
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
  const [lastActiveDesktopCardId, setLastActiveDesktopCardId] = useState<
    null | string
  >(null);

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
  const periodTimeDisplayByNumber = new Map(
    periods.map((period) => [period.period, periodTimeDisplay(period)]),
  );
  const periodPositionByNumber = periodPositions(periods);
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
                  dayCards.map((card) => {
                    const display = periodTimeDisplayByNumber.get(
                      card.periodIndex,
                    );

                    return (
                      <div
                        className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3"
                        key={card.id}
                      >
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          {display?.hasMismatch ? (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-md bg-background px-2 py-0.5 text-xs font-medium shadow-sm"
                              title={display.warning ?? undefined}
                            >
                              <TriangleAlertIcon
                                aria-hidden="true"
                                className="size-3.5 shrink-0 text-amber-400"
                              />
                              <span>{display.timeLabel}</span>
                              <span className="text-muted-foreground/60">
                                |
                              </span>
                              <span>{display.nameLabel}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-background px-2 py-0.5 text-xs font-medium shadow-sm">
                              {card.startTime} - {card.endTime}
                            </span>
                          )}
                        </div>
                        <CardBlock card={card} />
                      </div>
                    );
                  })
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
          {periods.map((period, periodPosition) => {
            const display = periodTimeDisplay(period);

            return (
              <div
                aria-label={display.warning ?? undefined}
                className={cn(
                  'flex min-h-28 items-center justify-center rounded-lg border bg-muted/30 px-3 py-2 text-sm',
                  display.hasMismatch && 'border-amber-400/35 bg-amber-400/5',
                )}
                key={period.id}
                style={{ gridColumn: 1, gridRow: periodPosition + 2 }}
                title={display.warning ?? undefined}
              >
                <PeriodTimeContent display={display} />
              </div>
            );
          })}
          {periods.flatMap((period, periodPosition) =>
            dayNames.map((day, dayIndex) =>
              isCoveredByCard({
                cards,
                dayIndex,
                periodPosition,
                periodPositionByNumber,
              }) ? null : (
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
                      'focus-visible:outline-none',
                      isActive && 'z-20 opacity-100 shadow-xl brightness-100',
                      !isActive &&
                        lastActiveDesktopCardId === card.id &&
                        'z-10',
                      isDimmed && 'opacity-45 brightness-75',
                    )}
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
                    style={{
                      height: `calc(((100% - ${String(periods.length - 1)} * ${String(CARD_GAP_REM)}rem) / ${String(periods.length)}) * ${String(card.durationPeriods)} + ${String(card.durationPeriods - 1)} * ${String(CARD_GAP_REM)}rem)`,
                      left: cardLeft,
                      top: `calc(((100% - ${String(periods.length - 1)} * ${String(CARD_GAP_REM)}rem) / ${String(periods.length)} + ${String(CARD_GAP_REM)}rem) * ${String(startPosition)})`,
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
