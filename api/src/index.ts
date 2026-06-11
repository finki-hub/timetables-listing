import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { fetchTimetable, fetchTimetableList } from '@/fetch.js';
import {
  parseTimetable,
  parseTimetableList,
  parseUpstreamError,
} from '@/parser.js';
import { timetableIdParamSchema } from '@/schemas.js';
import { validate } from '@/utils.js';

const CACHE_BASE = 'https://timetables-api.finki-hub.com';
const TIMETABLE_CACHE_TTL = 3_600; // 1 hour

const app = new Hono();

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.use(
  '*',
  cors({
    allowMethods: ['GET'],
    origin: '*',
  }),
);

app.get('/timetables', async (c) => {
  const cache = caches.default;
  const cacheKey = `${CACHE_BASE}/timetables`;
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    return new Response(cachedResponse.body, cachedResponse);
  }

  const payload = await fetchTimetableList();
  const timetables = parseTimetableList(payload);

  const response = Response.json(timetables, {
    headers: {
      'Cache-Control': `public, max-age=${String(TIMETABLE_CACHE_TTL)}`,
    },
  });

  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
});

app.get(
  '/timetables/:id',
  validate('param', timetableIdParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const cache = caches.default;
    const cacheKey = `${CACHE_BASE}/timetables/${id}`;
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      return new Response(cachedResponse.body, cachedResponse);
    }

    const payload = await fetchTimetable(id);
    const upstreamError = parseUpstreamError(payload);

    if (upstreamError !== null) {
      const status = upstreamError.toLowerCase().includes('does not exist')
        ? 404
        : 502;

      return c.json({ error: upstreamError }, status);
    }

    const timetable = parseTimetable(payload, id);

    const response = Response.json(timetable, {
      headers: {
        'Cache-Control': `public, max-age=${String(TIMETABLE_CACHE_TTL)}`,
      },
    });

    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
);

export default app;
