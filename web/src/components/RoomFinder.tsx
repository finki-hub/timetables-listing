import { DoorOpenIcon } from 'lucide-react';
import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { dayNames } from '@/lib/constants';
import { findFreeRooms, type SkopjeNow, toMinutes } from '@/lib/schedule';

import type { NamedEntity, ParsedTimetable } from '../../../api/src/types';

type FieldProps = {
  label: string;
  onChange: (value: number) => void;
  options: Array<{ label: string; value: number }>;
  value: number;
};

type RoomFinderProps = {
  isLoading: boolean;
  now: SkopjeNow;
  onOpenRoom: (room: NamedEntity) => void;
  timetable: null | ParsedTimetable;
};

const Field = ({ label, onChange, options, value }: FieldProps) => (
  <div className="flex min-w-0 flex-col gap-1.5">
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    <Select
      onValueChange={(next) => {
        onChange(Number(next));
      }}
      value={String(value)}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const RoomFinder = ({
  isLoading,
  now,
  onOpenRoom,
  timetable,
}: RoomFinderProps) => {
  const periods = timetable?.periods ?? [];
  const currentPeriod = periods.findIndex(
    (period) => toMinutes(period.endTime) > now.minutes,
  );
  const defaultPeriod = Math.max(currentPeriod, 0);
  const [selection, setSelection] = useState<null | {
    day: number;
    from: number;
    to: number;
  }>(null);
  const day =
    selection?.day ?? (now.dayIndex < dayNames.length ? now.dayIndex : 0);
  const from = Math.min(
    selection?.from ?? defaultPeriod,
    Math.max(periods.length - 1, 0),
  );
  const to = Math.max(
    Math.min(selection?.to ?? defaultPeriod, periods.length - 1),
    from,
  );
  const startPeriod = periods[from];
  const endPeriod = periods[to];

  if (isLoading || !timetable || !startPeriod || !endPeriod) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const freeRooms = findFreeRooms({
    cards: timetable.cards,
    classrooms: timetable.classrooms,
    dayIndex: day,
    endMinutes: toMinutes(endPeriod.endTime),
    startMinutes: toMinutes(startPeriod.startTime),
  });

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-xl border bg-card p-3 shadow-sm sm:grid-cols-3">
        <Field
          label="Ден"
          onChange={(value) => {
            setSelection({ day: value, from, to });
          }}
          options={dayNames.map((name, value) => ({ label: name, value }))}
          value={day}
        />
        <Field
          label="Од"
          onChange={(value) => {
            setSelection({ day, from: value, to: Math.max(to, value) });
          }}
          options={periods.map((period, value) => ({
            label: period.startTime,
            value,
          }))}
          value={from}
        />
        <Field
          label="До"
          onChange={(value) => {
            setSelection({ day, from: Math.min(from, value), to: value });
          }}
          options={periods.map((period, value) => ({
            label: period.endTime,
            value,
          }))}
          value={to}
        />
      </div>
      <div>
        <h2 className="text-xl font-bold">
          {freeRooms.length} слободни простории
        </h2>
        <p className="text-sm text-muted-foreground">
          {dayNames[day]}, {startPeriod.startTime} – {endPeriod.endTime}. Според
          распоредот на часови, без испити и други настани.
        </p>
      </div>
      {freeRooms.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {freeRooms.map((room) => (
            <li key={room.id}>
              <button
                className="flex min-h-12 w-full items-center gap-2 rounded-lg border bg-card p-3 text-left text-sm font-medium transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  onOpenRoom(room);
                }}
                type="button"
              >
                <DoorOpenIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
                <span className="min-w-0 truncate">{room.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          Нема слободни простории за избраниот термин.
        </p>
      )}
    </div>
  );
};

export { RoomFinder };
