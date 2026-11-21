import type { ViewMode } from '@/lib/types';

import { EntityCombobox } from '@/components/EntityCombobox';
import { VersionSelect } from '@/components/VersionSelect';
import { ViewTabs } from '@/components/ViewTabs';

import type { NamedEntity, TimetableListItem } from '../../../api/src/types';

type TimetableControlsProps = {
  entities: NamedEntity[];
  onEntityChange: (entityId: string) => void;
  onQueryChange: (query: string) => void;
  onSearchClose: () => void;
  onVersionChange: (versionId: string) => void;
  onViewChange: (view: ViewMode) => void;
  query: string;
  selectedEntity: NamedEntity | null;
  selectedVersionId: null | string;
  versions: TimetableListItem[];
  view: ViewMode;
};

const searchPlaceholders: Record<ViewMode, string> = {
  class: 'Пребарај група...',
  classroom: 'Пребарај просторија...',
  subject: 'Пребарај предмет...',
  teacher: 'Пребарај професор...',
};

const TimetableControls = ({
  entities,
  onEntityChange,
  onQueryChange,
  onSearchClose,
  onVersionChange,
  onViewChange,
  query,
  selectedEntity,
  selectedVersionId,
  versions,
  view,
}: TimetableControlsProps) => (
  <div className="z-30 grid grid-cols-[minmax(0,1fr)] gap-3 rounded-xl border bg-card p-3 shadow-sm lg:sticky lg:top-2 lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] lg:items-center print:hidden">
    <VersionSelect
      onChange={onVersionChange}
      selectedVersionId={selectedVersionId}
      versions={versions}
    />
    <ViewTabs
      activeView={view}
      onChange={onViewChange}
    />
    <EntityCombobox
      entities={entities}
      label={searchPlaceholders[view]}
      onClose={onSearchClose}
      onQueryChange={onQueryChange}
      onSelect={onEntityChange}
      placeholder={searchPlaceholders[view]}
      query={query}
      selectedEntity={selectedEntity}
    />
  </div>
);

export { TimetableControls };
