# hello-hono

The smallest possible Cloudflare Worker built with [Hono](https://hono.dev).

## Routes

| Method | Path     | Description                                     |
| ------ | -------- | ----------------------------------------------- |
| GET    | `/`      | Plain-text hello                                |
| GET    | `/json`  | JSON response                                   |
| GET    | `/where` | Edge metadata from `request.cf` (colo, country) |

## Run

```sh
pnpm -F hello-hono dev
```

## Deploy

```sh
pnpm -F hello-hono deploy
```
