# durable-objects

Durable Objects basics: one strongly consistent object per name, with
SQLite-backed storage and typed RPC methods.

Each `:name` maps to its own `Counter` object. Requests to the same name are
serialized by the runtime, so increments never race — no locks needed.

## Routes

| Method | Path                        | Description          |
| ------ | --------------------------- | -------------------- |
| GET    | `/counters/:name`           | Current value        |
| POST   | `/counters/:name/increment` | Increment and return |

## Run

```sh
pnpm -F durable-objects dev
```

```sh
curl -X POST localhost:8787/counters/demo/increment
curl localhost:8787/counters/demo
```

## Deploy

```sh
pnpm -F durable-objects deploy
```
