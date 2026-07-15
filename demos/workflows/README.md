# workflows

Workflows basics: durable execution. Each `step.do` result is persisted —
if the Worker restarts mid-run, completed steps are not re-executed. Steps
retry automatically on failure, and `step.sleep` can pause for up to a year.

## Routes

| Method | Path             | Description                      |
| ------ | ---------------- | -------------------------------- |
| POST   | `/workflows`     | `{ "name" }` → start an instance |
| GET    | `/workflows/:id` | Instance status and output       |

## Run

```sh
pnpm -F workflows dev
```

```sh
curl -X POST localhost:8787/workflows -H 'content-type: application/json' -d '{"name":"Yusuke"}'
curl localhost:8787/workflows/<id>   # running → complete after ~3s
```

## Deploy

```sh
pnpm -F workflows deploy
```
