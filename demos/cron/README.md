# cron

Cron Triggers basics: a `scheduled()` handler that runs every 5 minutes.
No HTTP routes — this Worker only reacts to the schedule.

## Run

```sh
pnpm -F cron dev
```

`wrangler dev` exposes a test endpoint for scheduled events:

```sh
curl 'localhost:8787/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*'
```

Watch the terminal for the `cron fired: ...` log.

## Deploy

```sh
pnpm -F cron deploy
```
