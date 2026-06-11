import { SESSIONS_ASSETS_URL } from '@/lib/constants';

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

const isSessionsPayload = (
  payload: unknown,
): payload is Record<string, string> =>
  typeof payload === 'object' &&
  payload !== null &&
  !Array.isArray(payload) &&
  Object.values(payload).every((value) => typeof value === 'string');

export const fetchExamSessions = async (
  signal?: AbortSignal,
): Promise<Record<string, string>> => {
  const response = await fetch(`${SESSIONS_ASSETS_URL}/sessions.json`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!isSessionsPayload(payload)) {
    throw new Error('Unexpected sessions payload');
  }

  return payload;
};

export const groupSessionsByYear = (
  payload: Record<string, string>,
): ExamSessionYear[] => {
  const years = new Map<string, ExamSessionYear>();

  for (const [name, fileName] of Object.entries(payload)) {
    const separatorIndex = name.indexOf(' ');
    const year = separatorIndex === -1 ? name : name.slice(0, separatorIndex);
    const isYearly = yearPattern.test(year);
    const groupKey = isYearly ? year : OTHER_SESSIONS_GROUP;

    const yearGroup = years.get(groupKey) ?? {
      sessions: [],
      year: groupKey,
    };
    yearGroup.sessions.push({
      fileType: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'xlsx',
      label: isYearly ? name.slice(separatorIndex + 1) : name,
      name,
      url: `${SESSIONS_ASSETS_URL}/sessions/${encodeURIComponent(fileName)}`,
    });
    years.set(groupKey, yearGroup);
  }

  const grouped = [...years.values()];
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
