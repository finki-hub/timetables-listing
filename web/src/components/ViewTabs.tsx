import type { ViewMode } from '@/lib/types';

import { cn } from '@/lib/utils';

type ViewTab = {
  label: string;
  value: ViewMode;
};

type ViewTabsProps = {
  activeView: ViewMode;
  onChange: (view: ViewMode) => void;
};

const viewTabs: ViewTab[] = [
  { label: 'Групи', value: 'class' },
  { label: 'Професори', value: 'teacher' },
  { label: 'Простории', value: 'classroom' },
  { label: 'Предмети', value: 'subject' },
];

const ViewTabs = ({ activeView, onChange }: ViewTabsProps) => (
  <div
    className="inline-flex flex-wrap rounded-xl bg-muted p-1"
    role="tablist"
  >
    {viewTabs.map((tab) => {
      const isActive = activeView === tab.value;

      return (
        <button
          className={cn(
            'relative inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all',
            isActive
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          key={tab.value}
          onClick={() => {
            onChange(tab.value);
          }}
          role="tab"
          type="button"
        >
          {tab.label}
          {isActive ? (
            <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary" />
          ) : null}
        </button>
      );
    })}
  </div>
);

export { ViewTabs };
