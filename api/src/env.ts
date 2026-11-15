// The Worker's bindings and variables. Kept apart from types.ts, which the
// web app reads too and which must not name the Workers runtime types.
export type Env = {
  // The R2 archive of EduPage's raw responses (archive.ts).
  ARCHIVE: R2Bucket;
  POSTHOG_HOST: string | undefined;
  POSTHOG_KEY: string | undefined;
};
