# service-bindings

Service bindings + RPC basics: a gateway Worker calls typed methods on a
backend `WorkerEntrypoint` directly — no HTTP, no serialization boilerplate,
zero network overhead.

Two Workers live in this chapter: `cf-demos-gateway` (`wrangler.jsonc`) and
`cf-demos-backend` (`backend.wrangler.jsonc`).

## Routes (gateway)

| Method | Path           | Description                   |
| ------ | -------------- | ----------------------------- |
| GET    | `/add/:a/:b`   | `BACKEND.add(a, b)` via RPC   |
| GET    | `/greet/:name` | `BACKEND.greet(name)` via RPC |

## Run

Both Workers in one dev session:

```sh
pnpm -F service-bindings dev
```

```sh
curl localhost:8787/add/2/3
curl localhost:8787/greet/Yusuke
```

## Deploy

```sh
pnpm -F service-bindings exec wrangler deploy -c backend.wrangler.jsonc
pnpm -F service-bindings deploy
```
