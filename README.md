# FINKI Hub / Timetables Listing

A timetable browser for current and historical FCSE class schedules.

## Structure

- `api/` - Cloudflare Worker API for fetching and parsing EduPage timetables
- `web/` - Vite frontend timetable browser

## API Archive

The API keeps every raw EduPage response it receives in an R2 bucket (the
`ARCHIVE` binding), so timetables survive EduPage dropping or failing to serve
them:

- `list.json` lists every timetable EduPage has listed, and `/timetables`
  returns EduPage's listing merged with it.
- `timetables/<id>/latest.json` is the newest raw response of a timetable
  (each distinct one is also kept as `timetables/<id>/<sha256>.json`). When
  EduPage fails or no longer has a timetable, `/timetables/:id` serves it
  from there with `X-Timetables-Source: archive`.
- An hourly cron refreshes the visible timetables and archives up to two
  timetables not archived yet, so the whole history is archived without
  anyone requesting it.

## API Development

```sh
cd api
npm install
npm run dev
```

## Web Development

```sh
cd web
npm install
npm run dev
```

## Build

```sh
cd web
npm run build
```

## License

This project is licensed under the terms of the MIT license.
