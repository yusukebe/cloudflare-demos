# flagship

Flagship (native feature flags) basics: evaluate a boolean flag with an
evaluation context. Passing a stable `userId` gives sticky bucketing for
percentage rollouts.

Setup: create an app and a boolean flag `new-banner` in the dashboard
(Workers & Pages → Flagship), then put the app id into `wrangler.jsonc`.
There is no local flag store — `wrangler dev` evaluates against the live
config. Evaluation never throws; it falls back to the default value.

## Routes

| Method | Path       | Description                                  |
| ------ | ---------- | -------------------------------------------- |
| GET    | `/`        | `?userId=alice` → banner variant by flag     |
| GET    | `/details` | Evaluation details (variant, reason, errors) |

## Run

```sh
pnpm -F flagship dev
```

```sh
curl 'localhost:8787/?userId=alice'
curl 'localhost:8787/details?userId=alice'
```

## Deploy

```sh
pnpm -F flagship deploy
```
