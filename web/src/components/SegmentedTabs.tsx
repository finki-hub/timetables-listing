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

const targetIndex = (key: string, index: number, count: number) => {
  if (key === 'ArrowLeft') {
    return (index - 1 + count) % count;
  }
  if (key === 'ArrowRight') {
    return (index + 1) % count;
  }
  if (key === 'Home') {
    return 0;
  }

  return key === 'End' ? count - 1 : null;
};

// Arrow keys only move focus. Enter or Space activates the focused tab, since
// activating a tab changes the URL and can reset the current selection.
const moveTabFocus = (
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
) => {
  const tabs =
    event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(
      '[role="tab"]',
    );
  const nextIndex = targetIndex(event.key, index, tabs?.length ?? 0);

  if (nextIndex === null) {
    return;
  }

  event.preventDefault();
  tabs?.item(nextIndex).focus();
};

const SegmentedTabs = <Value extends string>({
  activeValue,
  ariaLabel,
  onChange,
  panelId,
  tabs,
}: SegmentedTabsProps<Value>) => (
  <div
    aria-label={ariaLabel}
    className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-muted p-1 sm:inline-flex"
    role="tablist"
  >
    {tabs.map((tab, index) => {
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
          id={`${panelId}-tab-${tab.value}`}
          key={tab.value}
          onClick={() => {
            onChange(tab.value);
          }}
          onKeyDown={(event) => {
            moveTabFocus(event, index);
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

export { SegmentedTabs };
