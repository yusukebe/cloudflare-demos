# kv

Workers KV basics: get / put / delete / list, with optional TTL.

KV is eventually consistent — great for config, cache, and short-lived
one-shot data. Not for strongly consistent state (see durable-objects).

## Routes

| Method | Path         | Description                     |
| ------ | ------------ | ------------------------------- |
| GET    | `/keys`      | List keys                       |
| GET    | `/keys/:key` | Read a value                    |
| PUT    | `/keys/:key` | Write body as value (`?ttl=60`) |
| DELETE | `/keys/:key` | Delete a key                    |

## Run

```sh
pnpm -F kv dev
```

```sh
curl -X PUT localhost:8787/keys/greeting -d 'hello'
curl localhost:8787/keys/greeting
curl -X PUT 'localhost:8787/keys/temp?ttl=60' -d 'expires in a minute'
curl localhost:8787/keys
```

## Deploy

```sh
wrangler kv namespace create KV   # put the returned id into wrangler.jsonc
pnpm -F kv deploy
```
