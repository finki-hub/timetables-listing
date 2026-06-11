import type { AppPage } from '@/hooks/use-url-state';

import { cn } from '@/lib/utils';

type PageTab = {
  label: string;
  value: AppPage;
};

type PageTabsProps = {
  activePage: AppPage;
  onChange: (page: AppPage) => void;
};

const pageTabs: PageTab[] = [
  { label: 'Распореди', value: 'timetables' },
  { label: 'Испитни сесии', value: 'sessions' },
];

const PageTabs = ({ activePage, onChange }: PageTabsProps) => (
  <div
    className="inline-flex rounded-xl bg-muted p-1"
    role="tablist"
  >
    {pageTabs.map((tab) => {
      const isActive = activePage === tab.value;

      return (
        <button
          aria-selected={isActive}
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

export { PageTabs };
