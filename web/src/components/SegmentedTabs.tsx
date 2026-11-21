import type { KeyboardEvent } from 'react';

import { cn } from '@/lib/utils';

type SegmentedTab<Value extends string> = {
  label: string;
  value: Value;
};

type SegmentedTabsProps<Value extends string> = {
  activeValue: Value;
  ariaLabel: string;
  onChange: (value: Value) => void;
  panelId: string;
  tabs: Array<SegmentedTab<Value>>;
};

const SegmentedTabs = <Value extends string>({
  activeValue,
  ariaLabel,
  onChange,
  panelId,
  tabs,
}: SegmentedTabsProps<Value>) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.value === activeValue);
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    const offset = offsets[event.key];
    let nextIndex: null | number = null;

    if (offset !== undefined) {
      nextIndex = (index + offset + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    const nextTab = nextIndex === null ? undefined : tabs[nextIndex];

    if (!nextTab) {
      return;
    }

    event.preventDefault();
    onChange(nextTab.value);
    event.currentTarget
      .querySelector<HTMLElement>(`[data-value="${CSS.escape(nextTab.value)}"]`)
      ?.focus();
  };

  return (
    <div
      aria-label={ariaLabel}
      className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-muted p-1 sm:inline-flex"
      onKeyDown={handleKeyDown}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeValue === tab.value;

        return (
          <button
            aria-controls={panelId}
            aria-selected={isActive}
            className={cn(
              'inline-flex min-h-9 flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
              isActive
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            data-value={tab.value}
            key={tab.value}
            onClick={() => {
              onChange(tab.value);
            }}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export { SegmentedTabs };
