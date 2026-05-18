# finki-hub-timetables-listing

React SPA for browsing current and historical FINKI EduPage timetables by class group, teacher, or classroom.

## Data

The MVP uses static EduPage JSON files in `public/timetables/` to avoid EduPage CORS restrictions. `public/timetables/index.json` is the manifest used by the app to discover available versions.

Historical versions are intentionally shown even when the source EduPage listing marks them as `hidden`; for this app, hidden means “archived by EduPage,” not “hide from users.”

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run typecheck
npm test
npm run build
```

## Deployment

The app builds to `dist/` and can be deployed as a static Cloudflare Pages site. It currently assumes root deployment because timetable assets are fetched from `/timetables/...`.
