// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Vite env globals are extended through interface merging.
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Vite env globals are extended through interface merging.
interface ImportMetaEnv {
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_TIMETABLES_API_URL?: string;
}
