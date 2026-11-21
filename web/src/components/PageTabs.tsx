import type { AppPage } from '@/hooks/use-url-state';

import { SegmentedTabs } from '@/components/SegmentedTabs';

type PageTabsProps = {
  activePage: AppPage;
  onChange: (page: AppPage) => void;
};

const pageTabs: Array<{ label: string; value: AppPage }> = [
  { label: 'Распореди', value: 'timetables' },
  { label: 'Мој распоред', value: 'my' },
  { label: 'Слободни простории', value: 'rooms' },
  { label: 'Сесии', value: 'sessions' },
];

const PageTabs = ({ activePage, onChange }: PageTabsProps) => (
  <SegmentedTabs
    activeValue={activePage}
    ariaLabel="Страници"
    onChange={onChange}
    panelId="page-panel"
    tabs={pageTabs}
  />
);

export { PageTabs };
