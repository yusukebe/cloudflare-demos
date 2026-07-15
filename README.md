# cloudflare-demos

Minimal Cloudflare product demos — one small [Hono](https://hono.dev)-based
Worker per product.

| Chapter                              | Product         | What it shows                           |
| ------------------------------------ | --------------- | --------------------------------------- |
| [hello-hono](./hello-hono)           | Workers         | Smallest Worker + `request.cf` metadata |
| [kv](./kv)                           | Workers KV      | get / put / delete / list + TTL         |
| [d1](./d1)                           | D1              | Migrations + SQL CRUD                   |
| [durable-objects](./durable-objects) | Durable Objects | Per-name object, SQLite storage, RPC    |
| [r2](./r2)                           | R2              | Streaming upload / download             |
| [email](./email)                     | Email Service   | Transactional send via `send_email`     |
| [flagship](./flagship)               | Flagship        | Feature flag evaluation with context    |

## Setup

```sh
pnpm install
```

Each chapter is an independent Worker:

```sh
pnpm -F <chapter> dev
```

See each chapter's README for routes and deploy steps.
