// eslint-disable-next-line no-barrel-files/no-barrel-files -- type-only re-export, fully erased at build time
export type {
  ApiError,
  Group,
  NamedEntity,
  ParsedTimetable,
  Period,
  TimetableCard,
  TimetableListItem,
} from '../../../api/src/types';

export type ViewMode = 'class' | 'classroom' | 'subject' | 'teacher';
