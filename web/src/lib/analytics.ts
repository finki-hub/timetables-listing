import { posthog } from 'posthog-js';

const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

const posthogKey = import.meta.env.VITE_POSTHOG_KEY?.trim() ?? '';
const configuredHost = import.meta.env.VITE_POSTHOG_HOST?.trim();
const posthogHost =
  configuredHost && configuredHost.length > 0
    ? configuredHost
    : DEFAULT_POSTHOG_HOST;

export const initAnalytics = () => {
  if (posthogKey.length === 0) {
    return;
  }

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
};

export const captureEvent = (
  event: string,
  properties?: Record<string, unknown>,
): void => {
  if (posthogKey.length === 0) {
    return;
  }
  posthog.capture(event, properties);
};
