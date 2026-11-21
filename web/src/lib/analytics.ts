import type { PostHog } from 'posthog-js';

const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

// posthog-js is most of the bundle, so it is loaded in its own chunk after the
// app starts. Events captured before it arrives are queued.
const MAX_PENDING_EVENTS = 50;

const posthogKey = import.meta.env.VITE_POSTHOG_KEY?.trim() ?? '';
const configuredHost = import.meta.env.VITE_POSTHOG_HOST?.trim();
const posthogHost =
  configuredHost && configuredHost.length > 0
    ? configuredHost
    : DEFAULT_POSTHOG_HOST;

type PendingEvent = {
  event: string;
  properties: Record<string, unknown> | undefined;
  // Sent explicitly, so queued events keep the time they happened.
  timestamp?: Date;
};

const pendingEvents: PendingEvent[] = [];
const sdk: { client: null | PostHog; loading: null | Promise<void> } = {
  client: null,
  loading: null,
};

const captureSafely = (
  client: PostHog,
  { event, properties, timestamp }: PendingEvent,
) => {
  try {
    client.capture(event, properties, timestamp ? { timestamp } : undefined);
  } catch {
    // Telemetry is best-effort and must never affect app behavior.
  }
};

const loadPostHog = async () => {
  try {
    const { posthog } = await import('posthog-js');

    posthog.init(posthogKey, {
      // eslint-disable-next-line camelcase -- PostHog option keys are snake_case.
      api_host: posthogHost,
      autocapture: true,
      // eslint-disable-next-line camelcase -- PostHog option keys are snake_case.
      capture_exceptions: true,
      // eslint-disable-next-line camelcase -- PostHog option keys are snake_case.
      capture_pageview: 'history_change',
      // eslint-disable-next-line camelcase -- PostHog option keys are snake_case.
      person_profiles: 'identified_only',
    });
    posthog.register({ service: 'timetables-listing' });
    sdk.client = posthog;

    for (const pending of pendingEvents.splice(0)) {
      captureSafely(posthog, pending);
    }
  } catch {
    // A blocked or failed chunk only disables telemetry.
    pendingEvents.length = 0;
  }
};

export const initAnalytics = (): void => {
  if (posthogKey.length === 0) {
    return;
  }

  sdk.loading ??= loadPostHog();
};

export const captureEvent = (
  event: string,
  properties?: Record<string, unknown>,
): void => {
  if (posthogKey.length === 0) {
    return;
  }

  if (sdk.client) {
    captureSafely(sdk.client, { event, properties });
  } else if (pendingEvents.length < MAX_PENDING_EVENTS) {
    // eslint-disable-next-line unicorn/prefer-temporal -- PostHog requires a Date timestamp.
    pendingEvents.push({ event, properties, timestamp: new Date() });
  }
};
