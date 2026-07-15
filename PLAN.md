# cloudflare-demos — Plan & Research Notes

A general-purpose collection of minimal Cloudflare product demos (Hono
allowed), plus an integrated login app and a demo site that runs each example
live via Dynamic Workers. Not tied to any single event — it should stay useful
for workshops, blog posts, and customer conversations over time.

## Decisions (agreed with Yusuke)

- **Chapters are plain product demos.** No login/OTP theming in the basic
  chapters — each one shows the ordinary, minimal usage of its product.
  (Login-related notes below apply to `login-app` only.)
- **Minimal comments.** Code should be small and clear enough to need almost
  none.

- **Hono everywhere.** No external auth SaaS and no external auth libraries
  (better-auth, OpenAuth are out). Hono official middleware is acceptable, but:
- **Server-side sessions required** (customer explicitly does not want
  session-in-cookie). This rules out `@hono/oidc-auth` (its session is a JWT
  cookie). OIDC/OAuth flows are implemented by hand.
- **Session store: Durable Objects** — one DO per user (SQLite backend),
  sessions table, Alarms for expiry, instant revocation, "log out all devices"
  demo. Cookie carries only an opaque `userId:token` id (HttpOnly).
- **KV**: only short-lived one-shot data (OIDC state/nonce/PKCE verifier, email
  OTP codes) with TTL. Eventual consistency makes KV unsuitable for sessions.
- **D1**: `users` + `identities (provider, provider_user_id → user_id)` tables;
  account linking by verified email.
- **Secrets**: Workers Secrets (mention Secrets Store beta as the account-wide
  upgrade).
- Repo dir names have no number prefixes. Repo name `cloudflare-demos`
  (`cloudflare-workshop` was taken). Site may get its own name later.

## Provider protocol notes

| Provider     | Protocol        | Notes                                                                                                                                                                 |
| ------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google       | OIDC, discovery | plain RS256; `GOCSPX-` secrets need `client_secret_post`                                                                                                              |
| Apple        | OIDC variant    | `response_mode=form_post` (POST callback → SameSite), client secret is a self-generated ES256 JWT (WebCrypto demo material), relay emails, profile only on first auth |
| LINE         | OIDC compliant  | discovery at access.line.me; ID token may be ES256 (support EC keys in verifier)                                                                                      |
| Amazon (LwA) | plain OAuth 2.0 | no discovery, no ID token; code→token→profile API                                                                                                                     |
| Facebook     | OAuth 2.0 (web) | Graph API for profile; `@hono/oauth-providers` has it                                                                                                                 |
| Email        | OTP             | 6-digit code in KV (TTL 600), send via Email Service                                                                                                                  |

`@hono/oauth-providers`: Google/Facebook/GitHub/LinkedIn/X/Discord/Twitch/MSEntra,
no Apple, no generic OIDC, no session — position as comparison material only.
Plan: one thin self-made abstraction, `/auth/:provider/login` +
`/auth/:provider/callback`, provider differences as small config objects.
ID token verification hand-rolled with `crypto.subtle` (RS256 + ES256, JWKS by
kid, check iss/aud/exp/nonce).

## Repo layout

```
cloudflare-demos/
├── hello-hono/        minimal Workers + Hono
├── kv/                KV basics: get/put/delete/list + TTL
├── d1/                migrations + posts table CRUD
├── durable-objects/   per-name Counter (SQLite storage + RPC)
├── r2/                minimal file upload/download
├── email/             send a simple email via Email Service
├── flagship/          boolean feature flag evaluation
├── login-app/         integrated OIDC login (Google + email OTP + DO sessions)
└── site/              demo site: shows each chapter's code, runs it live via Dynamic Workers
```

pnpm workspaces at root (pnpm-workspace.yaml). Each chapter is an
independent minimal Worker (`wrangler dev` runnable). Conventions: code
comments/README in English; format with oxfmt (hono rules); verify Workers
locally with the `workers-fetch` skill (single-shot request, no dev server).

## Dynamic Workers findings (for site/)

- Open beta, all **paid** Workers plans. Binding `env.LOADER.load()/get()`;
  `get(id)` caches isolates by id, `load()` is always fresh.
- Capability-based env: pass **WorkerEntrypoint stubs / service bindings**;
  wrap KV/D1/R2 of the loader Worker in small facade classes
  (`ctx.exports.MyFacade(...)`) and hand stubs to the dynamic worker. Direct
  passthrough of native bindings is not documented — verify empirically.
- `globalOutbound: null` blocks all network from dynamic workers (good default
  for running sample code).
- npm deps (Hono) must be **pre-bundled** (esbuild each chapter to a single JS
  string at build time). `compatibilityDate` required in load().
- DO classes inside dynamic workers: unclear in docs; Agents Week 2026
  announced "Durable Objects in Dynamic Workers (GA)" — verify; fallback is a
  host-side DO behind a facade.
- Per-chapter live-run feasibility: hello-hono/kv/d1/r2 ○ (facade bindings);
  durable-objects to verify; email/flagship via mock stubs; login-app is
  link-only (needs real client IDs + stable callback URL, deploy separately).
- Docs: https://developers.cloudflare.com/dynamic-workers/ (api-reference,
  usage/bindings).

## Email Service (checked 2026-07)

- Email Sending is **beta**, Workers **Paid only**, 3,000 mails/month included
  then $0.35/1k. Sending domain must be onboarded:
  `wrangler email sending enable <domain>`. Binding:
  `{ "send_email": [{ "name": "EMAIL" }] }`, then `env.EMAIL.send({...})` —
  `from.email` (binding) vs `from.address` (REST). Sends to verified addresses
  are free on all plans (dev/test path). Local skill:
  `~/.claude/skills/cloudflare-email-service/`.

## Flagship (checked 2026-07, GA)

- Native feature flags. wrangler.jsonc: `{ "flagship": { "binding": "FLAGS",
"app_id": "<APP_ID>" } }`; `env.FLAGS.getBooleanValue(key, default, context)`
  etc.; context like `{ userId }` for percentage rollouts (sticky bucketing).
  No local flag store — local dev evaluates against live config, needs a real
  app_id. Reference: `~/.claude/skills/cloudflare/references/flagship/`.
- Workshop demo idea: show a new login button variant to 10% of users.

## Recent-updates talking points (verified via changelogs, 2026-07)

- D1: read replication via Sessions API (2025-04), auto-retry for read-only
  queries (2025-09), jurisdiction/data localization (2025-11, good for JP
  compliance talk), account storage 250GB→1TB.
- KV: stable; legacy REST routes removed 2026-10-15; still eventually
  consistent (the reason sessions live in DO, not KV).
- R2: Data Catalog (Iceberg) + R2 SQL — angle: login audit logs via Pipelines →
  R2 → R2 SQL. Dashboard bucket ops (2026-04), CRC-64/NVME multipart checksums.
- DO: new namespaces are SQLite-only since 2026-07; DO available on free plan
  since 2025 (hands-on friendly). 10GB/object (paid).
- Workers: auto resource provisioning; Cloudflare Drop + Temporary Accounts API
  (2026-07 onboarding gimmicks).
- Agents Week 2026 GA: Flagship, Artifacts (git-compatible versioned storage),
  Agent Memory, Cloudflare Mesh, Managed OAuth for Access, Sandboxes.
  Betas worth mentioning: Workers VPC (free during beta — connect private
  IdP/user DB!), Registrar API, R2 SQL/Pipelines, Secrets Store.

## Status (2026-07-16)

Done: scaffold (pnpm workspaces + pnpm-workspace.yaml, tsconfig.base, oxfmt
config migrated from honojs/hono's .prettierrc) and the seven basic chapters
(hello-hono, kv, d1, durable-objects, r2, email, flagship), each verified
locally (flagship: types/tsc only — live eval needs a real app_id, and
creating one via `wrangler flagship apps create` requires re-`wrangler login`
for the flagship:write scope).

## Next steps

1. Flagship: after `wrangler login`, create app `cf-demos` + boolean flag
   `new-banner`, put app_id into flagship/wrangler.jsonc, verify live.
2. login-app: OIDC login app (email OTP + provider buttons; Google + OTP fully
   working, others as provider-config stubs).
3. site/: esbuild bundling of chapters, LOADER binding, facade bindings,
   code viewer + live run. Verify DO-in-dynamic-worker en route.
