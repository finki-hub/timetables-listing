import type { ViewMode } from '@/lib/types';

import { SegmentedTabs } from '@/components/SegmentedTabs';

type ViewTabsProps = {
  activeView: ViewMode;
  onChange: (view: ViewMode) => void;
};

const viewTabs: Array<{ label: string; value: ViewMode }> = [
  { label: 'Групи', value: 'class' },
  { label: 'Професори', value: 'teacher' },
  { label: 'Простории', value: 'classroom' },
  { label: 'Предмети', value: 'subject' },
];

const ViewTabs = ({ activeView, onChange }: ViewTabsProps) => (
  <SegmentedTabs
    activeValue={activeView}
    ariaLabel="Приказ"
    onChange={onChange}
    panelId="schedule-panel"
    tabs={viewTabs}
  />
);

export { ViewTabs };
