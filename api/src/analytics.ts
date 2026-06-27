import type { Env } from '@/types.js';

type EventProperties = {
  ms: number;
  path: string;
  service: string;
  status: number;
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
