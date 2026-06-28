import type { Env } from '@/types.js';

const DISTINCT_ID = 'timetables-api-worker';

type CatalogQueryProperties = {
  cacheHit: boolean;
  resultCount?: number;
  route: string;
  service: string;
};

type ExceptionProperties = {
  message: string;
  path: string;
  service: string;
  type: string;
};

type RequestCompletedProperties = {
  duration_ms: number;
  method: string;
  outcome: 'client_error' | 'ok' | 'server_error';
  route: string;
  service: string;
  status: number;
};

type ZeroResultsProperties = {
  route: string;
  service: string;
};

export const captureCatalogQuery = async (
  env: Env,
  { cacheHit, resultCount, route, service }: CatalogQueryProperties,
): Promise<void> => {
  if (!env.POSTHOG_KEY || !env.POSTHOG_HOST) {
    return;
  }

  const properties: Record<string, unknown> = {
    // eslint-disable-next-line camelcase -- PostHog property names are snake_case.
    cache_hit: cacheHit,
    route,
    service,
  };

  if (resultCount !== undefined) {
    // eslint-disable-next-line camelcase -- PostHog property names are snake_case.
    properties.result_count = resultCount;
  }

  try {
    await fetch(`${env.POSTHOG_HOST}/i/v0/e/`, {
      body: JSON.stringify({
        /* eslint-disable camelcase -- PostHog ingestion API requires snake_case keys. */
        api_key: env.POSTHOG_KEY,
        distinct_id: DISTINCT_ID,
        /* eslint-enable camelcase -- Re-enable after the PostHog payload keys. */
        event: 'catalog_query',
        properties,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
  } catch {
    //
  }
};

export const captureQueryZeroResults = async (
  env: Env,
  { route, service }: ZeroResultsProperties,
): Promise<void> => {
  if (!env.POSTHOG_KEY || !env.POSTHOG_HOST) {
    return;
  }

  try {
    await fetch(`${env.POSTHOG_HOST}/i/v0/e/`, {
      body: JSON.stringify({
        /* eslint-disable camelcase -- PostHog ingestion API requires snake_case keys. */
        api_key: env.POSTHOG_KEY,
        distinct_id: DISTINCT_ID,
        /* eslint-enable camelcase -- Re-enable after the PostHog payload keys. */
        event: 'query_zero_results',
        properties: { route, service },
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
  } catch {
    //
  }
};

export const captureException = async (
  env: Env,
  properties: ExceptionProperties,
): Promise<void> => {
  if (!env.POSTHOG_KEY || !env.POSTHOG_HOST) {
    return;
  }

  try {
    await fetch(`${env.POSTHOG_HOST}/i/v0/e/`, {
      body: JSON.stringify({
        /* eslint-disable camelcase -- PostHog ingestion API requires snake_case keys. */
        api_key: env.POSTHOG_KEY,
        distinct_id: DISTINCT_ID,
        /* eslint-enable camelcase -- Re-enable after the PostHog payload keys. */
        event: '$exception',
        properties: {
          // eslint-disable-next-line camelcase -- PostHog exception list property is snake_case.
          $exception_list: [
            {
              mechanism: { handled: false, synthetic: false },
              type: properties.type,
              value: properties.message,
            },
          ],
          path: properties.path,
          service: properties.service,
        },
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
  } catch {
    //
  }
};

export const captureRequestCompleted = async (
  env: Env,
  properties: RequestCompletedProperties,
): Promise<void> => {
  if (!env.POSTHOG_KEY || !env.POSTHOG_HOST) {
    return;
  }

  try {
    await fetch(`${env.POSTHOG_HOST}/i/v0/e/`, {
      body: JSON.stringify({
        /* eslint-disable camelcase -- PostHog ingestion API requires snake_case keys. */
        api_key: env.POSTHOG_KEY,
        distinct_id: DISTINCT_ID,
        /* eslint-enable camelcase -- Re-enable after the PostHog payload keys. */
        event: 'request_completed',
        properties,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
  } catch {
    //
  }
};
