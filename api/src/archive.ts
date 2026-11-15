import type { TimetableListItem } from '@/types.js';

import { timetableListItemSchema } from '@/schemas.js';

// The R2 archive of EduPage's raw responses, so a timetable EduPage drops or
// fails to serve can still be read and parsed again. Layout:
//   list.json                      every timetable ever listed, newest first
//   list/<sha256>.json             each distinct raw listing response
//   timetables/<id>/<sha256>.json  each distinct raw timetable response
//   timetables/<id>/latest.json    the newest of those
// Objects are only added or replaced; nothing here deletes. R2 records
// when each was uploaded.

const LIST_KEY = 'list.json';
const JSON_METADATA = { contentType: 'application/json' };

const latestKey = (id: string): string => `timetables/${id}/latest.json`;

export const sha256 = async (text: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const putOnce = async (
  bucket: R2Bucket,
  key: string,
  text: string,
): Promise<void> => {
  if ((await bucket.head(key)) !== null) return;

  await bucket.put(key, text, { httpMetadata: JSON_METADATA });
};

// The listing EduPage gave, plus every timetable it listed before and no
// longer does; EduPage's entry wins for a timetable in both.
export const mergeListings = (
  archived: readonly TimetableListItem[],
  listed: readonly TimetableListItem[],
): TimetableListItem[] => {
  const byId = new Map(archived.map((item) => [item.id, item]));

  for (const item of listed) byId.set(item.id, item);

  return byId
    .values()
    .toArray()
    .toSorted((left, right) => Number(right.id) - Number(left.id));
};

export const readListing = async (
  bucket: R2Bucket,
): Promise<TimetableListItem[]> => {
  const object = await bucket.get(LIST_KEY);

  return object === null
    ? []
    : timetableListItemSchema.array().parse(await object.json());
};

// Archives a raw listing and returns the merged listing.
export const archiveListing = async (
  bucket: R2Bucket,
  text: string,
  listed: readonly TimetableListItem[],
): Promise<TimetableListItem[]> => {
  await putOnce(bucket, `list/${await sha256(text)}.json`, text);

  const archived = await readListing(bucket);
  const merged = mergeListings(archived, listed);

  if (JSON.stringify(merged) !== JSON.stringify(archived)) {
    await bucket.put(LIST_KEY, JSON.stringify(merged), {
      httpMetadata: JSON_METADATA,
    });
  }

  return merged;
};

const TIMETABLES_PREFIX = 'timetables/';

// The ids of every archived timetable, from one listing of the
// timetables/<id>/ prefixes (a page holds up to 1,000), so a refresh never
// probes each timetable on its own.
export const archivedTimetableIds = async (
  bucket: R2Bucket,
): Promise<Set<string>> => {
  const ids = new Set<string>();
  let cursor: string | undefined;

  do {
    const page = await bucket.list({
      delimiter: '/',
      prefix: TIMETABLES_PREFIX,
      ...(cursor !== undefined && { cursor }),
    });

    for (const prefix of page.delimitedPrefixes) {
      ids.add(prefix.slice(TIMETABLES_PREFIX.length, -1));
    }

    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor !== undefined);

  return ids;
};

// Archives a raw timetable response; false when it matches the latest.
export const archiveTimetable = async (
  bucket: R2Bucket,
  id: string,
  text: string,
): Promise<boolean> => {
  const hash = await sha256(text);
  const latest = await bucket.head(latestKey(id));

  if (latest?.customMetadata?.sha256 === hash) return false;

  await putOnce(bucket, `timetables/${id}/${hash}.json`, text);
  await bucket.put(latestKey(id), text, {
    customMetadata: { sha256: hash },
    httpMetadata: JSON_METADATA,
  });

  return true;
};

// The latest archived raw response of a timetable, or null.
export const readTimetable = async (
  bucket: R2Bucket,
  id: string,
): Promise<unknown> => {
  const object = await bucket.get(latestKey(id));

  return object === null ? null : object.json();
};
