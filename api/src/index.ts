import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routePath } from 'hono/route';

import type { Env } from '@/types.js';

import {
  captureCatalogQuery,
  captureException,
  captureQueryZeroResults,
  captureRequestCompleted,
} from '@/analytics.js';
import { fetchTimetable, fetchTimetableList } from '@/fetch.js';
import {
  parseTimetable,
  parseTimetableList,
  parseUpstreamError,
} from '@/parser.js';
import { timetableIdParamSchema } from '@/schemas.js';
import { validate } from '@/utils.js';

const CACHE_BASE = 'https://timetables-api.finki-hub.com';
const SERVICE_NAME = 'timetables-api';

const toOutcome = (status: number): 'client_error' | 'ok' | 'server_error' => {
  if (status < 400) return 'ok';
  if (status < 500) return 'client_error';
  return 'server_error';
};
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
    const status = caughtError === undefined ? c.res.status : 500;

    c.executionCtx.waitUntil(
      captureRequestCompleted(c.env, {
        // eslint-disable-next-line camelcase -- PostHog property names are snake_case.
        duration_ms: ms,
        method: c.req.method,
        outcome: toOutcome(status),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- routePath helper uses loose Context<any> signature.
        route: routePath(c),
        service: SERVICE_NAME,
        status,
      }),
    );

    if (caughtError !== undefined) {
      c.executionCtx.waitUntil(
        captureException(c.env, {
          message:
            caughtError instanceof Error
              ? caughtError.message
              : JSON.stringify(caughtError),
          path,
          service: SERVICE_NAME,
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
      c.executionCtx.waitUntil(
        captureCatalogQuery(c.env, {
          cacheHit: true,
          route: '/timetables',
          service: SERVICE_NAME,
        }),
      );

      return new Response(cachedResponse.body, cachedResponse);
    }

    const payload = await fetchTimetableList();
    const timetables = parseTimetableList(payload);

    c.executionCtx.waitUntil(
      captureCatalogQuery(c.env, {
        cacheHit: false,
        resultCount: timetables.length,
        route: '/timetables',
        service: SERVICE_NAME,
      }),
    );

    if (timetables.length === 0) {
      c.executionCtx.waitUntil(
        captureQueryZeroResults(c.env, {
          route: '/timetables',
          service: SERVICE_NAME,
        }),
      );
    }

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
        c.executionCtx.waitUntil(
          captureCatalogQuery(c.env, {
            cacheHit: true,
            route: '/timetables/:id',
            service: SERVICE_NAME,
          }),
        );

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

      c.executionCtx.waitUntil(
        captureCatalogQuery(c.env, {
          cacheHit: false,
          resultCount: timetable.cards.length,
          route: '/timetables/:id',
          service: SERVICE_NAME,
        }),
      );

      if (timetable.cards.length === 0) {
        c.executionCtx.waitUntil(
          captureQueryZeroResults(c.env, {
            route: '/timetables/:id',
            service: SERVICE_NAME,
          }),
        );
      }

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
