import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { versionLabel } from '@/lib/schedule';

import type { TimetableListItem } from '../../../api/src/types';

type VersionSelectProps = {
  onChange: (versionId: string) => void;
  selectedVersionId: null | string;
  versions: TimetableListItem[];
};

const VersionOptions = ({
  label,
  versions,
}: {
  label: string;
  versions: TimetableListItem[];
}) =>
  versions.length > 0 ? (
    <SelectGroup>
      <SelectLabel>{label}</SelectLabel>
      {versions.map((version) => (
        <SelectItem
          key={version.id}
          value={version.id}
        >
          <span
            className="block truncate"
            style={{ maxWidth: 'calc(100vw - 5rem)' }}
          >
            {versionLabel(version)}
          </span>
        </SelectItem>
      ))}
    </SelectGroup>
  ) : null;

const VersionSelect = ({
  onChange,
  selectedVersionId,
  versions,
}: VersionSelectProps) => (
  <Select
    onValueChange={onChange}
    value={selectedVersionId ?? ''}
  >
    <SelectTrigger aria-label="Избери верзија на распоред">
      <SelectValue placeholder="Избери распоред" />
    </SelectTrigger>
    <SelectContent>
      <VersionOptions
        label="Тековни"
        versions={versions.filter((version) => !version.hidden)}
      />
      <VersionOptions
        label="Архива"
        versions={versions.filter((version) => version.hidden)}
      />
    </SelectContent>
  </Select>
);

export { VersionSelect };
