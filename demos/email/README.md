# email

Email Sending basics: send a transactional email with the `send_email`
binding — no API keys, no SMTP.

The `from` domain must be onboarded first:

```sh
wrangler email sending enable yourdomain.com
```

Then change `hello@yourdomain.com` in `src/index.ts` to an address on that
domain.

## Routes

| Method | Path    | Description                          |
| ------ | ------- | ------------------------------------ |
| POST   | `/send` | `{ "to", "subject", "text" }` → send |

## Run

```sh
pnpm -F email dev
```

Local dev simulates the send and logs it. Add `"remote": true` to the binding
in `wrangler.jsonc` to send through the real service during `wrangler dev`.

```sh
curl -X POST localhost:8787/send -H 'content-type: application/json' \
  -d '{"to":"you@example.com","subject":"Hi","text":"Hello from Workers"}'
```

## Deploy

```sh
pnpm -F email deploy
```
