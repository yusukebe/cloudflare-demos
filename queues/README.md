# queues

Queues basics: a producer and a consumer in the same Worker. The producer
enqueues a message, the runtime delivers it to the `queue()` handler in
batches, off the request's critical path.

## Routes

| Method | Path        | Description                 |
| ------ | ----------- | --------------------------- |
| POST   | `/messages` | Enqueue the JSON body (202) |

The consumer logs each delivered message and acks it.

## Run

```sh
pnpm -F queues dev
```

```sh
curl -X POST localhost:8787/messages -H 'content-type: application/json' -d '{"hello":"queue"}'
```

Watch the `wrangler dev` terminal for the `consumed ...` log.

## Deploy

```sh
wrangler queues create cf-demos-queue
pnpm -F queues deploy
```
