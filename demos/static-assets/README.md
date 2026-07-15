# static-assets

Workers Static Assets basics: files in `public/` are served directly from
Cloudflare's cache — the Worker only runs for paths that don't match an
asset (here, `/api/*`).

## Routes

| Method | Path         | Description                 |
| ------ | ------------ | --------------------------- |
| GET    | `/`          | `public/index.html` (asset) |
| GET    | `/api/hello` | JSON from the Worker        |

## Run

```sh
pnpm -F static-assets dev
```

Open http://localhost:8787 — the page is an asset, and it fetches
`/api/hello` from the Worker.

## Deploy

```sh
pnpm -F static-assets deploy
```
