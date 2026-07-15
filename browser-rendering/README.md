# browser-rendering

Browser Rendering basics: drive a headless Chromium on Cloudflare with
Puppeteer and return a screenshot.

The binding is `"remote": true`, so `wrangler dev` uses the real browser
pool on your account.

## Routes

| Method | Path          | Description                         |
| ------ | ------------- | ----------------------------------- |
| GET    | `/screenshot` | `?url=https://...` → PNG screenshot |

## Run

```sh
pnpm -F browser-rendering dev
```

```sh
curl 'localhost:8787/screenshot?url=https://hono.dev' -o shot.png
```

## Deploy

```sh
pnpm -F browser-rendering deploy
```
