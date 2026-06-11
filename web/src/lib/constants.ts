const DEFAULT_TIMETABLES_API_URL = 'https://timetables-api.finki-hub.com';

const configuredTimetablesApiUrl =
  import.meta.env.VITE_TIMETABLES_API_URL?.trim();

export const TIMETABLES_API_URL =
  configuredTimetablesApiUrl && configuredTimetablesApiUrl.length > 0
    ? configuredTimetablesApiUrl
    : DEFAULT_TIMETABLES_API_URL;

export const SESSIONS_ASSETS_URL = 'https://assets.finki-hub.com';

export const dayNames = [
  'Понеделник',
  'Вторник',
  'Среда',
  'Четврток',
  'Петок',
] as const;
