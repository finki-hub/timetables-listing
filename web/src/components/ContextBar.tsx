import {
  BookmarkPlusIcon,
  CalendarPlusIcon,
  CheckIcon,
  LinkIcon,
  PrinterIcon,
  Trash2Icon,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { captureEvent } from '@/lib/analytics';
import { buildCalendar, type DateRange } from '@/lib/schedule';

import type { TimetableCard } from '../../../api/src/types';

type ContextBarProps = {
  cards: TimetableCard[];
  onAddAll?: () => void;
  onClear?: () => void;
  range: DateRange | null;
  shareUrl: string;
  subtitle: string;
  title: string;
  versionId: null | string;
};

const COPIED_MS = 2_000;

const copyLabels = {
  copied: 'Копирано',
  failed: 'Не успеа',
  idle: 'Сподели',
} as const;

const ActionButton = ({
  children,
  disabled,
  onClick,
  title,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) => (
  <Button
    disabled={disabled}
    onClick={onClick}
    size="sm"
    title={title}
    type="button"
    variant="outline"
  >
    {children}
  </Button>
);

const downloadCalendar = (content: string, name: string) => {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/calendar;charset=utf-8' }),
  );
  const link = document.createElement('a');

  link.href = url;
  link.download = `${name.replaceAll(/[\\/:*?"<>|]/gu, '-')}.ics`;
  link.click();
  URL.revokeObjectURL(url);
};

const ContextBar = ({
  cards,
  onAddAll,
  onClear,
  range,
  shareUrl,
  subtitle,
  title,
  versionId,
}: ContextBarProps) => {
  const [copyState, setCopyState] = useState<'copied' | 'failed' | 'idle'>(
    'idle',
  );
  const canExport = range !== null && versionId !== null && cards.length > 0;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    setTimeout(() => {
      setCopyState('idle');
    }, COPIED_MS);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="truncate text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2 print:hidden">
        {onAddAll ? (
          <ActionButton
            disabled={cards.length === 0}
            onClick={onAddAll}
          >
            <BookmarkPlusIcon
              aria-hidden="true"
              className="size-3.5"
            />
            Додај во мој
          </ActionButton>
        ) : null}
        <ActionButton
          disabled={!canExport}
          onClick={() => {
            if (range === null || versionId === null) {
              return;
            }

            downloadCalendar(
              buildCalendar({
                cards,
                name: title,
                // eslint-disable-next-line unicorn/prefer-temporal -- Temporal is not available in every supported browser.
                now: new Date(),
                range,
                versionId,
              }),
              title,
            );
            captureEvent('calendar_exported', { count: cards.length });
          }}
          title={
            range === null ? 'Оваа верзија нема датумски опсег' : undefined
          }
        >
          <CalendarPlusIcon
            aria-hidden="true"
            className="size-3.5"
          />
          Календар
        </ActionButton>
        <ActionButton
          disabled={cards.length === 0}
          onClick={() => {
            print();
          }}
        >
          <PrinterIcon
            aria-hidden="true"
            className="size-3.5"
          />
          Печати
        </ActionButton>
        <ActionButton
          onClick={() => {
            void copyLink();
          }}
        >
          {copyState === 'copied' ? (
            <CheckIcon
              aria-hidden="true"
              className="size-3.5"
            />
          ) : (
            <LinkIcon
              aria-hidden="true"
              className="size-3.5"
            />
          )}
          <span aria-live="polite">{copyLabels[copyState]}</span>
        </ActionButton>
        {onClear ? (
          <ActionButton
            disabled={cards.length === 0}
            onClick={onClear}
          >
            <Trash2Icon
              aria-hidden="true"
              className="size-3.5"
            />
            Исчисти
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
};

export { ContextBar };
