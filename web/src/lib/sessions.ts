import { DIRECTUS_URL } from '@/lib/constants';

export type ExamSession = {
  fileType: 'pdf' | 'xlsx';
  label: string;
  name: string;
  url: string;
};

export type ExamSessionYear = {
  sessions: ExamSession[];
  year: string;
};

export const OTHER_SESSIONS_GROUP = 'Останато';

const yearCollator = new Intl.Collator('en');

const yearPattern = /^\d{4}\/\d{4}$/u;

const sessionOrder = [
  'Зимски - Прв Колоквиум',
  'Зимски - Втор Колоквиум',
  'Јануари',
  'Летен - Прв Колоквиум',
  'Летен - Втор Колоквиум',
  'Јуни',
  'Септември',
];

const sessionRank = (label: string) => {
  const index = sessionOrder.indexOf(label);
  return index === -1 ? sessionOrder.length : index;
};

type SessionRow = {
  file: { filename_download: string; id: string };
  name: string;
};

const SESSIONS_QUERY =
  'fields=name,file.id,file.filename_download&limit=-1&sort=id';

const isSessionRow = (row: unknown): row is SessionRow => {
  if (typeof row !== 'object' || row === null) {
    return false;
  }
  const { file, name } = row as Partial<SessionRow>;
  return (
    typeof name === 'string' &&
    typeof file === 'object' &&
    typeof file.id === 'string' &&
    typeof file.filename_download === 'string'
  );
};

const rowsOf = (payload: unknown): SessionRow[] => {
  const rows = (payload as null | { data?: unknown })?.data;
  if (!Array.isArray(rows) || !rows.every(isSessionRow)) {
    throw new Error('Unexpected sessions payload');
  }
  return rows;
};

export const fetchExamSessions = async (
  signal?: AbortSignal,
): Promise<Record<string, string>> => {
  const response = await fetch(
    `${DIRECTUS_URL}/items/exam_sessions?${SESSIONS_QUERY}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  // Each session's name and the path of its schedule under /assets.
  return Object.fromEntries(
    rowsOf(await response.json()).map(({ file, name }) => [
      name,
      `${file.id}/${encodeURIComponent(file.filename_download)}`,
    ]),
  );
};

export const groupSessionsByYear = (
  payload: Record<string, string>,
): ExamSessionYear[] => {
  const years = new Map<string, ExamSessionYear>();

  for (const [name, filePath] of Object.entries(payload)) {
    const separatorIndex = name.indexOf(' ');
    const year = separatorIndex === -1 ? name : name.slice(0, separatorIndex);
    const isYearly = yearPattern.test(year);
    const groupKey = isYearly ? year : OTHER_SESSIONS_GROUP;

    const yearGroup = years.getOrInsert(groupKey, {
      sessions: [],
      year: groupKey,
    });
    yearGroup.sessions.push({
      fileType: filePath.toLowerCase().endsWith('.pdf') ? 'pdf' : 'xlsx',
      label: isYearly ? name.slice(separatorIndex + 1) : name,
      name,
      url: `${DIRECTUS_URL}/assets/${filePath}`,
    });
  }

  const grouped = years
    .values()
    .toArray()
    .toSorted((first, second) => yearCollator.compare(second.year, first.year));
  for (const yearGroup of grouped) {
    yearGroup.sessions.sort(
      (first, second) => sessionRank(first.label) - sessionRank(second.label),
    );
  }

  const otherIndex = grouped.findIndex(
    (yearGroup) => yearGroup.year === OTHER_SESSIONS_GROUP,
  );
  if (otherIndex !== -1) {
    grouped.push(...grouped.splice(otherIndex, 1));
  }

  return grouped;
};
