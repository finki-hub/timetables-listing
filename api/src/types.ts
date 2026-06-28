export type ApiError = {
  error: string;
};

export type Env = {
  POSTHOG_HOST: string | undefined;
  POSTHOG_KEY: string | undefined;
};

export type Group = {
  classId: string;
  entireClass: boolean;
  id: string;
  name: string;
};

export type NamedEntity = {
  id: string;
  name: string;
  short: string;
};

export type ParsedTimetable = {
  cards: TimetableCard[];
  classes: NamedEntity[];
  classrooms: NamedEntity[];
  id: string;
  periods: Period[];
  subjects: NamedEntity[];
  teachers: NamedEntity[];
};

export type Period = {
  endTime: string;
  id: string;
  name: string;
  period: number;
  short: string;
  startTime: string;
};

export type TimetableCard = {
  classes: NamedEntity[];
  classrooms: NamedEntity[];
  dayIndex: number;
  dayName: string;
  durationPeriods: number;
  endTime: string;
  groupNames: string[];
  groups: Group[];
  id: string;
  lessonId: string;
  periodIndex: number;
  startTime: string;
  subject: NamedEntity;
  teachers: NamedEntity[];
  weeks: string;
};

export type TimetableListItem = {
  dateFrom: string;
  hidden: boolean;
  id: string;
  title: string;
  year: number;
};
