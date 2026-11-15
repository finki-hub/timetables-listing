import type { ParsedTimetable, TimetableListItem } from '@/types.js';

import {
  archiveListing,
  archiveTimetable,
  isTimetableArchived,
  mergeListings,
  readListing,
  readTimetable,
} from '@/archive.js';
import { fetchTimetable, fetchTimetableList } from '@/fetch.js';
import {
  parseTimetable,
  parseTimetableList,
  parseUpstreamError,
} from '@/parser.js';

// Runs an archive write without failing the response; on a request it is
// handed to waitUntil, in the scheduled refresh it is awaited.
export type Defer = (task: Promise<unknown>) => void;

// Where a response came from: EduPage, or the archive when EduPage failed
// or no longer has the timetable.
export type Source = 'archive' | 'edupage';

const logged = async (task: Promise<unknown>): Promise<void> => {
  try {
    await task;
  } catch (error) {
    console.error('Archive write failed', error);
  }
};

// The archive is a fallback: a failed read counts as nothing archived.
const archivedListing = async (
  bucket: R2Bucket,
): Promise<TimetableListItem[]> => {
  try {
    return await readListing(bucket);
  } catch (error) {
    console.error('Archive read failed', error);

    return [];
  }
};

export type ListResult = {
  source: Source;
  timetables: TimetableListItem[];
};

export const loadTimetableList = async (
  bucket: R2Bucket,
  defer: Defer,
): Promise<ListResult> => {
  let listed: TimetableListItem[];
  let text: string;

  try {
    const response = await fetchTimetableList();

    listed = parseTimetableList(response.payload);
    text = response.text;
  } catch (error) {
    const fallback = await archivedListing(bucket);

    if (fallback.length === 0) throw error;

    console.error('EduPage listing failed, serving the archive', error);

    return { source: 'archive', timetables: fallback };
  }

  if (listed.length === 0) return { source: 'edupage', timetables: listed };

  const archived = await archivedListing(bucket);

  defer(logged(archiveListing(bucket, text, listed)));

  return {
    source: 'edupage',
    timetables: mergeListings(archived, listed),
  };
};

export type TimetableResult =
  | { error: string; status: 404 | 502 }
  | { source: Source; timetable: ParsedTimetable };

const fromArchive = async (
  bucket: R2Bucket,
  id: string,
): Promise<null | ParsedTimetable> => {
  let payload: unknown;

  try {
    payload = await readTimetable(bucket, id);
  } catch (error) {
    console.error('Archive read failed', error);

    return null;
  }

  return payload === null ? null : parseTimetable(payload, id);
};

export const loadTimetable = async (
  bucket: R2Bucket,
  id: string,
  defer: Defer,
): Promise<TimetableResult> => {
  let payload: unknown;
  let text: string;

  try {
    ({ payload, text } = await fetchTimetable(id));
  } catch (error) {
    const archived = await fromArchive(bucket, id);

    if (archived === null) throw error;

    console.error(`EduPage timetable ${id} failed, serving the archive`, error);

    return { source: 'archive', timetable: archived };
  }

  const upstreamError = parseUpstreamError(payload);

  if (upstreamError !== null) {
    const archived = await fromArchive(bucket, id);

    if (archived !== null) return { source: 'archive', timetable: archived };

    const status = upstreamError.toLowerCase().includes('does not exist')
      ? 404
      : 502;

    return { error: upstreamError, status };
  }

  const timetable = parseTimetable(payload, id);

  // An empty timetable is served but never replaces an archived one.
  if (timetable.cards.length > 0) {
    defer(logged(archiveTimetable(bucket, id, text)));
  }

  return { source: 'edupage', timetable };
};

// How many timetables not yet archived one scheduled run fetches; the
// visible (current) ones are refreshed on every run besides.
export const BACKFILL_PER_RUN = 4;

// The scheduled refresh: archive the listing, every visible timetable and
// a few of the timetables not archived yet.
export const refreshArchive = async (bucket: R2Bucket): Promise<string[]> => {
  const tasks: Array<Promise<unknown>> = [];
  const defer: Defer = (task) => {
    tasks.push(task);
  };
  const { source, timetables } = await loadTimetableList(bucket, defer);

  await Promise.all(tasks);

  if (source === 'archive') return [];

  const visible = timetables.filter((item) => !item.hidden);
  const missing: string[] = [];

  for (const item of timetables) {
    if (missing.length === BACKFILL_PER_RUN) break;
    if (!item.hidden) continue;
    if (!(await isTimetableArchived(bucket, item.id))) missing.push(item.id);
  }

  const refreshed: string[] = [];

  for (const id of [...visible.map((item) => item.id), ...missing]) {
    tasks.length = 0;

    const result = await loadTimetable(bucket, id, defer);

    await Promise.all(tasks);

    if ('timetable' in result && result.source === 'edupage') {
      refreshed.push(id);
    }
  }

  return refreshed;
};
