import { BookOpenIcon, SearchIcon, UsersIcon } from 'lucide-react';

import type { NamedEntity, TimetableVersion } from '@/lib/types';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TimetableControlsProps = {
  entities: NamedEntity[];
  onEntityChange: (entityId: string) => void;
  onQueryChange: (query: string) => void;
  onVersionChange: (versionId: string) => void;
  query: string;
  selectedEntityId: null | string;
  selectedVersionId: null | string;
  versions: TimetableVersion[];
};

const TimetableControls = ({
  entities,
  onEntityChange,
  onQueryChange,
  onVersionChange,
  query,
  selectedEntityId,
  selectedVersionId,
  versions,
}: TimetableControlsProps) => (
  <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <BookOpenIcon
          aria-hidden="true"
          className="h-3.5 w-3.5"
        />
        Верзија
      </span>
      <Select
        onValueChange={onVersionChange}
        value={selectedVersionId ?? undefined}
      >
        <SelectTrigger aria-label="Избери верзија на распоред">
          <SelectValue placeholder="Избери распоред" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {versions.map((version) => (
              <SelectItem
                key={version.id}
                value={version.id}
              >
                {version.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>

    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <SearchIcon
          aria-hidden="true"
          className="h-3.5 w-3.5"
        />
        Пребарај
      </span>
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          className="pl-9"
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          placeholder="Име, група, просторија..."
          value={query}
        />
      </div>
    </label>

    <label className="flex flex-col gap-1.5 lg:col-span-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <UsersIcon
          aria-hidden="true"
          className="h-3.5 w-3.5"
        />
        Избран запис
      </span>
      <Select
        onValueChange={onEntityChange}
        value={selectedEntityId ?? undefined}
      >
        <SelectTrigger aria-label="Избери запис од распоред">
          <SelectValue placeholder="Избери запис" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {entities.length > 0 ? (
              entities.map((entity) => (
                <SelectItem
                  key={entity.id}
                  value={entity.id}
                >
                  {entity.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem
                disabled
                value="__empty"
              >
                Нема совпаѓања
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  </div>
);

export { TimetableControls };
