const TIMETABLES_LIST_URL =
  'https://finki.edupage.org/timetable/server/ttviewer.js?__func=getTTViewerData';
const TIMETABLE_URL =
  'https://finki.edupage.org/timetable/server/regulartt.js?__func=regularttGetData';

const requestEduPage = async (
  url: string,
  args: unknown[],
): Promise<unknown> => {
  const response = await fetch(url, {
    body: JSON.stringify({ __args: args, __gsh: '00000000' }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed with ${String(response.status)}`);
  }

  return response.json();
};

export const fetchTimetableList = (): Promise<unknown> =>
  requestEduPage(TIMETABLES_LIST_URL, [null, 2_025]);

export const fetchTimetable = (id: string): Promise<unknown> =>
  requestEduPage(TIMETABLE_URL, [null, id]);
