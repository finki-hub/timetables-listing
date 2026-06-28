import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { Env } from '@/types.js';

import { captureException, captureRequest } from '@/analytics.js';
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

const app = new Hono<{ Bindings: Env }>()
  .onError((err, c) => {
    console.error(err);

    return c.json({ error: 'Internal Server Error' }, 500);
  })
  .use(
    '*',
    cors({
      allowMethods: ['GET'],
      origin: '*',
    }),
  )
  .use('*', async (c, next) => {
    const start = Date.now();

    let caughtError: unknown;

    try {
      // eslint-disable-next-line n/callback-return -- Post-response analytics must run after next() resolves.
      await next();
    } catch (error) {
      caughtError = error;
    }

    const ms = Date.now() - start;
    const path = new URL(c.req.url).pathname;

    c.executionCtx.waitUntil(
      captureRequest(c.env, {
        ms,
        path,
        service: 'timetables-api',
        status: caughtError === undefined ? c.res.status : 500,
      }),
    );

    if (caughtError !== undefined) {
      c.executionCtx.waitUntil(
        captureException(c.env, {
          path,
          service: 'timetables-api',
          type:
            caughtError instanceof Error
              ? caughtError.constructor.name
              : 'UnknownError',
        }),
      );

      // eslint-disable-next-line @typescript-eslint/only-throw-error -- re-throwing an unknown caught value.
      throw caughtError;
    }
  })
  .get('/timetables', async (c) => {
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
  })
  .get(
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
