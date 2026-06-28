import type { Env } from '@/types.js';

type EventProperties = {
  ms: number;
  path: string;
  service: string;
  status: number;
};

type ExceptionProperties = {
  path: string;
  service: string;
  type: string;
};

export const captureRequest = async (
  env: Env,
  properties: EventProperties,
): Promise<void> => {
  if (!env.POSTHOG_KEY || !env.POSTHOG_HOST) {
    return;
  }

  try {
    await fetch(`${env.POSTHOG_HOST}/i/v0/e/`, {
      body: JSON.stringify({
        /* eslint-disable camelcase -- PostHog ingestion API requires snake_case keys. */
        api_key: env.POSTHOG_KEY,
        distinct_id: 'timetables-api-worker',
        /* eslint-enable camelcase -- Re-enable after the PostHog payload keys. */
        event: 'timetables-api_query',
        properties,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
  } catch {
    // Analytics is best-effort and must never affect the response.
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
        distinct_id: 'timetables-api-worker',
        /* eslint-enable camelcase -- Re-enable after the PostHog payload keys. */
        event: '$exception',
        properties: {
          // eslint-disable-next-line camelcase -- PostHog exception list property is snake_case.
          $exception_list: [
            {
              mechanism: { handled: false, type: 'generic' },
              type: properties.type,
              value: '(metadata only)',
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
    // Analytics is best-effort and must never affect the response.
  }
};
