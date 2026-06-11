import type { ApiError, ParsedTimetable, TimetableListItem } from '@/lib/types';

import { TIMETABLES_API_URL } from '@/lib/constants';

const trimTrailingSlashes = (url: string) => {
  let normalizedUrl = url;

  while (normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }

  return normalizedUrl;
};

const API_BASE_URL = trimTrailingSlashes(TIMETABLES_API_URL);

const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

const isApiError = (payload: unknown): payload is ApiError =>
  typeof payload === 'object' &&
  payload !== null &&
  'error' in payload &&
  typeof payload.error === 'string';

const parseResponse = async <Data>(response: Response): Promise<Data> => {
  const payload = (await response.json()) as unknown;

  if (isApiError(payload)) {
    throw new Error(payload.error);
  }

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return payload as Data;
};

export const fetchTimetables = async (
  signal?: AbortSignal,
): Promise<TimetableListItem[]> => {
  const response = await fetch(apiUrl('/timetables'), { signal });

  return parseResponse<TimetableListItem[]>(response);
};

export const fetchTimetable = async (
  id: string,
  signal?: AbortSignal,
): Promise<ParsedTimetable> => {
  const response = await fetch(apiUrl(`/timetables/${id}`), { signal });

  return parseResponse<ParsedTimetable>(response);
};
