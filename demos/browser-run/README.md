# browser-run

Browser Run basics: drive a headless Chromium on Cloudflare with
Puppeteer, or use Quick Actions — one binding call for common tasks like
screenshots, Markdown extraction, and PDFs.

The binding is `"remote": true`, so `wrangler dev` uses the real browser
pool on your account.

## Routes

| Method | Path          | Description                                          |
| ------ | ------------- | ---------------------------------------------------- |
| GET    | `/screenshot` | `?url=https://...` → PNG screenshot (Puppeteer)      |
| GET    | `/markdown`   | `?url=https://...` → page as Markdown (Quick Action) |
| GET    | `/pdf`        | `?url=https://...` → page as PDF (Quick Action)      |

## Run

```sh
pnpm -F browser-run dev
```

```sh
curl 'localhost:8787/screenshot?url=https://hono.dev' -o shot.png
curl 'localhost:8787/markdown?url=https://hono.dev'
curl 'localhost:8787/pdf?url=https://example.com' -o page.pdf
```

## Deploy

```sh
pnpm -F browser-run deploy
```
