# workers-ai

Workers AI basics: run an LLM on Cloudflare's GPUs with one binding call —
no API keys.

The binding is `"remote": true`, so `wrangler dev` proxies inference to the
real service (free tier available).

## Routes

| Method | Path    | Description                     |
| ------ | ------- | ------------------------------- |
| POST   | `/chat` | `{ "prompt" }` → model response |

## Run

```sh
pnpm -F workers-ai dev
```

```sh
curl -X POST localhost:8787/chat -H 'content-type: application/json' \
  -d '{"prompt":"Say hi in exactly five words."}'
```

## Deploy

```sh
pnpm -F workers-ai deploy
```
