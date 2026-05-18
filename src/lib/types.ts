export type EduPageCard = EduPageEntity & {
  classroomids?: string[];
  days: string;
  lessonid: string;
  period: string;
  weeks?: string;
};

export type EduPageEntity = {
  color?: string;
  id: string;
  name?: string;
  short?: string;
};

export type EduPageLesson = EduPageEntity & {
  classids?: string[];
  durationperiods?: number | string;
  groupids?: string[];
  groupnames?: string[];
  subjectid: string;
  teacherids?: string[];
  weeks?: string;
};

export type EduPagePeriod = EduPageEntity & {
  endtime: string;
  period: string;
  starttime: string;
};

export type EduPageTable<Row> = {
  data_rows?: Row[];
  id: string;
};

export type EduPageTimetablePayload = {
  r: {
    dbiAccessorRes: {
      tables: Array<EduPageTable<unknown>>;
    };
  };
};

export type NamedEntity = {
  id: string;
  name: string;
  short: string;
};

export type ResolvedCard = {
  classes: NamedEntity[];
  classrooms: NamedEntity[];
  dayIndex: number;
  durationPeriods: number;
  groupNames: string[];
  id: string;
  lessonId: string;
  period: EduPagePeriod;
  periodIndex: number;
  subject: NamedEntity;
  teachers: NamedEntity[];
  weeks: string;
};

export type ResolvedTimetable = {
  cards: ResolvedCard[];
  classes: NamedEntity[];
  classrooms: NamedEntity[];
  periods: EduPagePeriod[];
  subjects: NamedEntity[];
  teachers: NamedEntity[];
};

export type TimetableManifest = {
  defaultVersionId: string;
  versions: TimetableVersion[];
};

export type TimetableVersion = {
  dateFrom: string;
  file: string;
  hidden: boolean;
  id: string;
  title: string;
  ttNum: string;
  year: number;
};

export type ViewMode = 'class' | 'classroom' | 'teacher';
