import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TimetableListItem } from '@/types.js';

import {
  archiveTimetable,
  mergeListings,
  readListing,
  readTimetable,
} from '@/archive.js';
import { loadTimetable, loadTimetableList, refreshArchive } from '@/sources.js';

type Stored = { customMetadata: Record<string, string>; text: string };

// The part of R2Bucket the archive uses, kept in memory.
class MemoryBucket {
  readonly objects = new Map<string, Stored>();

  get(key: string) {
    const stored = this.objects.get(key);

    return Promise.resolve(
      stored === undefined
        ? null
        : {
            json: () => Promise.resolve(JSON.parse(stored.text) as unknown),
            text: () => Promise.resolve(stored.text),
          },
    );
  }

  head(key: string) {
    const stored = this.objects.get(key);

    return Promise.resolve(
      stored === undefined ? null : { customMetadata: stored.customMetadata },
    );
  }

  keys(): string[] {
    return this.objects.keys().toArray();
  }

  put(
    key: string,
    text: string,
    options: { customMetadata?: Record<string, string> },
  ) {
    this.objects.set(key, {
      customMetadata: options.customMetadata ?? {},
      text,
    });

    return Promise.resolve(null);
  }
}

const asBucket = (bucket: MemoryBucket): R2Bucket =>
  bucket as unknown as R2Bucket;

const item = (id: string, hidden = true): TimetableListItem => ({
  dateFrom: '2026-10-10',
  hidden,
  id,
  title: `raspored-${id}`,
  year: 2_026,
});

const listing = (...entries: Array<[string, boolean]>) => ({
  r: {
    regular: {
      timetables: entries.map(([id, hidden]) => ({
        datefrom: '2026-10-10',
        hidden,
        text: `raspored-${id}`,
        // eslint-disable-next-line camelcase -- EduPage's field name.
        tt_num: id,
        year: 2_026,
      })),
    },
  },
});

// eslint-disable-next-line camelcase -- EduPage's field name.
const table = (id: string, rows: unknown[]) => ({ data_rows: rows, id });

// The smallest timetable the parser reads: one card of one lesson.
const timetablePayload = () => ({
  r: {
    dbiAccessorRes: {
      tables: [
        table('periods', [
          {
            endtime: '08:55',
            id: '0',
            name: '8',
            period: 0,
            short: '8',
            starttime: '08:10',
          },
        ]),
        table('classes', [{ id: '1', name: 'Class', short: 'Class' }]),
        table('teachers', [
          { firstname: 'Ana', id: '-1', lastname: 'T', short: 'Ana' },
        ]),
        table('subjects', [{ id: '2', name: 'Subject', short: 'Subject' }]),
        table('classrooms', [{ id: '3', name: '223', short: '223' }]),
        table('groups', [
          { classid: '1', entireclass: true, id: '4', name: 'Entire class' },
        ]),
        table('lessons', [
          {
            classids: ['1'],
            durationperiods: 2,
            groupids: ['4'],
            id: '5',
            subjectid: '2',
            teacherids: ['-1'],
          },
        ]),
        table('cards', [
          {
            classroomids: ['3'],
            days: '10000',
            id: '6',
            lessonid: '5',
            period: '0',
            weeks: '1',
          },
        ]),
      ],
    },
  },
});

const respond = (body: unknown): Promise<Response> =>
  Promise.resolve(Response.json(body));

const stubEduPage = (handler: (url: string) => Promise<Response>) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => handler(url)),
  );
};

const collect = () => {
  const tasks: Array<Promise<unknown>> = [];

  return {
    defer: (task: Promise<unknown>) => {
      tasks.push(task);
    },
    settle: () => Promise.all(tasks),
  };
};

const missing = { r: { error: 'Timetable does not exist' } };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Archive', () => {
  it('keeps timetables EduPage no longer lists', () => {
    const merged = mergeListings(
      [item('20'), item('28')],
      [item('31', false), { ...item('28'), title: 'renamed' }],
    );

    expect(merged.map((entry) => entry.id)).toEqual(['31', '28', '20']);
    expect(merged[1]?.title).toBe('renamed');
  });

  it('stores each distinct timetable response once', async () => {
    const bucket = new MemoryBucket();

    await expect(
      archiveTimetable(asBucket(bucket), '31', '{"a":1}'),
    ).resolves.toBe(true);
    await expect(
      archiveTimetable(asBucket(bucket), '31', '{"a":1}'),
    ).resolves.toBe(false);
    await expect(
      archiveTimetable(asBucket(bucket), '31', '{"a":2}'),
    ).resolves.toBe(true);

    expect(
      bucket.keys().filter((key) => key.startsWith('timetables/31/')),
    ).toHaveLength(3);
    await expect(readTimetable(asBucket(bucket), '31')).resolves.toEqual({
      a: 2,
    });
  });
});

describe('Sources', () => {
  it('serves an archived timetable once EduPage drops it', async () => {
    const bucket = new MemoryBucket();
    const first = collect();

    stubEduPage(() => respond(timetablePayload()));

    await expect(
      loadTimetable(asBucket(bucket), '31', first.defer),
    ).resolves.toMatchObject({ source: 'edupage' });
    await first.settle();

    stubEduPage(() => respond(missing));

    const dropped = await loadTimetable(asBucket(bucket), '31', () => {});

    expect(dropped).toMatchObject({ source: 'archive' });
    expect('timetable' in dropped && dropped.timetable.teachers[0]?.name).toBe(
      'Ana T',
    );
  });

  it('serves the archive while EduPage is down', async () => {
    const bucket = new MemoryBucket();
    const first = collect();

    stubEduPage(() => respond(timetablePayload()));
    await loadTimetable(asBucket(bucket), '31', first.defer);
    await first.settle();

    stubEduPage(() => Promise.reject(new Error('offline')));

    await expect(
      loadTimetable(asBucket(bucket), '31', () => {}),
    ).resolves.toMatchObject({ source: 'archive' });
    await expect(
      loadTimetable(asBucket(bucket), '7', () => {}),
    ).rejects.toThrow('offline');
  });

  it('never archives an empty timetable', async () => {
    const bucket = new MemoryBucket();
    const empty = timetablePayload();
    const tasks = collect();

    empty.r.dbiAccessorRes.tables = empty.r.dbiAccessorRes.tables.filter(
      (entry) => entry.id !== 'cards',
    );
    stubEduPage(() => respond(empty));

    await loadTimetable(asBucket(bucket), '31', tasks.defer);
    await tasks.settle();

    expect(bucket.keys()).toEqual([]);
  });

  it('reports a timetable that was never archived', async () => {
    stubEduPage(() => respond(missing));

    await expect(
      loadTimetable(asBucket(new MemoryBucket()), '7', () => {}),
    ).resolves.toEqual({ error: 'Timetable does not exist', status: 404 });
  });

  it('merges the archived listing and falls back to it', async () => {
    const bucket = new MemoryBucket();
    const first = collect();

    stubEduPage(() => respond(listing(['31', false], ['28', true])));
    await loadTimetableList(asBucket(bucket), first.defer);
    await first.settle();

    stubEduPage(() => respond(listing(['32', false])));

    const merged = await loadTimetableList(asBucket(bucket), () => {});

    expect(merged.timetables.map((entry) => entry.id)).toEqual([
      '32',
      '31',
      '28',
    ]);

    stubEduPage(() => Promise.reject(new Error('offline')));

    const archived = await loadTimetableList(asBucket(bucket), () => {});

    expect(archived.source).toBe('archive');
    await expect(readListing(asBucket(bucket))).resolves.toHaveLength(2);
  });

  it('refreshes visible timetables and backfills a few hidden ones', async () => {
    const bucket = new MemoryBucket();
    const hidden = Array.from({ length: 7 }, (_, index): [string, boolean] => [
      String(30 - index),
      true,
    ]);

    stubEduPage((url) =>
      url.includes('ttviewer')
        ? respond(listing(['31', false], ...hidden))
        : respond(timetablePayload()),
    );

    await expect(refreshArchive(asBucket(bucket))).resolves.toEqual([
      '31',
      '30',
      '29',
      '28',
      '27',
    ]);
    await expect(refreshArchive(asBucket(bucket))).resolves.toEqual([
      '31',
      '26',
      '25',
      '24',
    ]);
  });
});
