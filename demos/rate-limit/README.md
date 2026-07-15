# rate-limit

Rate Limiting binding basics: at most 5 requests per 60 seconds per client
IP, enforced in-memory on the Cloudflare edge — no external store.

The counter is per-colo and approximate, which is exactly what you want for
abuse protection (not for billing-grade quotas).

## Routes

| Method | Path | Description                        |
| ------ | ---- | ---------------------------------- |
| GET    | `/`  | `OK`, or `429` once over the limit |

## Run

```sh
pnpm -F rate-limit dev
```

```sh
for i in $(seq 1 7); do curl -s -o /dev/null -w '%{http_code}\n' localhost:8787/; done
# 200 ×5, then 429
```

## Deploy

```sh
pnpm -F rate-limit deploy
```
