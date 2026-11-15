const TIMETABLES_LIST_URL =
  'https://finki.edupage.org/timetable/server/ttviewer.js?__func=getTTViewerData';
const TIMETABLE_URL =
  'https://finki.edupage.org/timetable/server/regulartt.js?__func=regularttGetData';

// EduPage's response as received (archived verbatim) and as parsed.
export type EduPageResponse = {
  payload: unknown;
  text: string;
};

const requestEduPage = async (
  url: string,
  args: unknown[],
): Promise<EduPageResponse> => {
  const response = await fetch(url, {
    body: JSON.stringify({ __args: args, __gsh: '00000000' }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed with ${String(response.status)}`);
  }

  const text = await response.text();

  return { payload: JSON.parse(text) as unknown, text };
};

export const fetchTimetableList = (): Promise<EduPageResponse> =>
  requestEduPage(TIMETABLES_LIST_URL, [null, 2_025]);

export const fetchTimetable = (id: string): Promise<EduPageResponse> =>
  requestEduPage(TIMETABLE_URL, [null, id]);
