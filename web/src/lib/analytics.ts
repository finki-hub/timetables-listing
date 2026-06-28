import { posthog } from 'posthog-js';

const DEFAULT_POSTHOG_KEY = 'phc_xXEqLMnYeDPuXA6HHwuasQMdSufDGryS8vZZuHmu9Qwd';
const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

const configuredKey = import.meta.env.VITE_POSTHOG_KEY?.trim();
const configuredHost = import.meta.env.VITE_POSTHOG_HOST?.trim();

const posthogKey =
  configuredKey && configuredKey.length > 0
    ? configuredKey
    : DEFAULT_POSTHOG_KEY;

const posthogHost =
  configuredHost && configuredHost.length > 0
    ? configuredHost
    : DEFAULT_POSTHOG_HOST;

export const initAnalytics = () => {
  if (!import.meta.env.PROD || posthogKey.length === 0) {
    return;
  }

  posthog.init(posthogKey, {
    // eslint-disable-next-line camelcase -- PostHog option keys are snake_case.
    api_host: posthogHost,
    autocapture: true,
    // eslint-disable-next-line camelcase -- PostHog option keys are snake_case.
    capture_exceptions: true,
    // eslint-disable-next-line camelcase -- PostHog option keys are snake_case.
    person_profiles: 'always',
  });
};

export const captureEvent = (
  event: string,
  properties?: Record<string, unknown>,
): void => {
  if (!import.meta.env.PROD) {
    return;
  }
  posthog.capture(event, properties);
};
