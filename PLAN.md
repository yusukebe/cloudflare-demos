# cloudflare-demos — Plan & Research Notes

A general-purpose collection of minimal Cloudflare product demos (Hono-based),
plus a demo site that runs each example live via Dynamic Workers. Not tied to
any single event — it should stay useful for workshops, blog posts, and
customer conversations over time.

## Decisions (agreed with Yusuke)

- **Chapters are plain product demos.** Each one shows the ordinary, minimal
  usage of its product — no scenario theming.
- **Minimal comments.** Code should be small and clear enough to need almost
  none.
- **Hono everywhere.** One small Worker per chapter, README per chapter.
- Repo dir names have no number prefixes. Site may get its own name later.

## Repo layout

```
cloudflare-demos/
├── demos/
│   ├── hello-hono/        minimal Workers + Hono
│   ├── kv/                KV basics: get/put/delete/list + TTL
│   ├── d1/                migrations + posts table CRUD
│   ├── durable-objects/   per-name Counter (SQLite storage + RPC)
│   ├── r2/                minimal file upload/download
│   ├── queues/            producer + consumer in one Worker
│   ├── workflows/         durable steps + sleep (GreetingWorkflow)
│   ├── cron/              scheduled() handler, --test-scheduled
│   ├── static-assets/     public/ assets + Worker API route
│   ├── service-bindings/  gateway → backend WorkerEntrypoint RPC (2 configs)
│   ├── rate-limit/        per-key Rate Limiting binding
│   ├── workers-ai/        LLM inference (llama-3.2-3b-instruct, remote)
│   ├── vectorize/         semantic search (bge-base-en-v1.5 + cf-demos-notes index, remote)
│   ├── browser-run/       Puppeteer + Quick Actions (remote)
│   ├── images/            IMAGES binding info/resize
│   ├── email/             send a simple email via Email Service
│   └── flagship/          boolean feature flag evaluation
└── website/           demo site: shows each chapter's code, runs it live via Dynamic Workers
```

pnpm workspaces at root (pnpm-workspace.yaml). Each chapter is an
independent minimal Worker (`wrangler dev` runnable). Conventions: code
comments/README in English; format with oxfmt (hono rules); verify Workers
locally with the `workers-fetch` skill (single-shot request, no dev server).

## Dynamic Workers findings (for website/)

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
- Per-chapter live-run feasibility: hello-hono/kv/d1/r2 ○ (facade bindings,
  all verified locally); durable-objects needs DO facets (supervisor DO);
  workers-ai/vectorize/flagship could delegate to the website's real bindings
  (v2, needs abuse protection); workflows/queues/cron/email/etc. code-view only.
- Verified empirically (2026-07): worker_loaders works in local `wrangler dev`;
  ctx.exports facades + RpcTarget chaining (D1 prepare/bind) work over RPC;
  ReadableStream works over RPC for R2 get, but R2 put needs buffering in the
  facade (streams lose their known length over RPC).
- Docs: https://developers.cloudflare.com/dynamic-workers/ (api-reference,
  usage/bindings, durable-object-facets).

## Email Service (checked 2026-07)

- Email Sending is **beta**, Workers **Paid only**, 3,000 mails/month included
  then $0.35/1k. Sending domain must be onboarded:
  `wrangler email sending enable <domain>`. Binding:
  `{ "send_email": [{ "name": "EMAIL" }] }`, then `env.EMAIL.send({...})` —
  `from.email` (binding) vs `from.address` (REST). Sends to verified addresses
  are free on all plans (dev/test path). Local skill:
  `~/.claude/skills/cloudflare-email-service/`.

## Flagship (checked 2026-07, GA)

- Native feature flags. wrangler.jsonc: `{ "flagship": [{ "binding": "FLAGS",
"app_id": "<APP_ID>" }] }`; `env.FLAGS.getBooleanValue(key, default,
context)` etc.; context like `{ userId }` for percentage rollouts (sticky
  bucketing). No local flag store — local dev evaluates against live config,
  needs a real app_id. Reference:
  `~/.claude/skills/cloudflare/references/flagship/`.

## Recent-updates talking points (verified via changelogs, 2026-07)

- D1: read replication via Sessions API (2025-04), auto-retry for read-only
  queries (2025-09), jurisdiction/data localization (2025-11, good for JP
  compliance talk), account storage 250GB→1TB.
- KV: stable; legacy REST routes removed 2026-10-15; still eventually
  consistent (use DO for strongly consistent state).
- R2: Data Catalog (Iceberg) + R2 SQL — angle: logs via Pipelines → R2 →
  R2 SQL. Dashboard bucket ops (2026-04), CRC-64/NVME multipart checksums.
- DO: new namespaces are SQLite-only since 2026-07; DO available on free plan
  since 2025 (hands-on friendly). 10GB/object (paid).
- Workers: auto resource provisioning; Cloudflare Drop + Temporary Accounts API
  (2026-07 onboarding gimmicks).
- Agents Week 2026 GA: Flagship, Artifacts (git-compatible versioned storage),
  Agent Memory, Cloudflare Mesh, Managed OAuth for Access, Sandboxes.
  Betas worth mentioning: Workers VPC (free during beta), Registrar API,
  R2 SQL/Pipelines, Secrets Store.

## Status (2026-07-16)

Done: scaffold (pnpm workspaces + pnpm-workspace.yaml, tsconfig.base, oxfmt
config migrated from honojs/hono's .prettierrc) and seventeen chapters, all
tsc-clean and runtime-verified locally except flagship (types/tsc only —
live eval needs a real app_id; `wrangler flagship apps create` needs
re-`wrangler login` for the flagship:write scope). Notes: workers-ai uses
llama-3.2-3b-instruct (3.1-8b was deprecated 2026-05-30); the
Vectorize index cf-demos-notes (768 dims, cosine) exists on the account;
Vectorize upserts take ~30s to become queryable; service-bindings runs two
configs in one `wrangler dev` (-c -c). Pushed to
https://github.com/yusukebe/cloudflare-demos.

## Website v1 (2026-07-16)

website/ built, verified locally, and DEPLOYED as worker `cf-demos` to
https://cf-demos.yusuke.run (custom domain only; workers_dev/preview_urls
false). Build script (esbuild bundles runnable chapters to ESM strings +
shiki-highlighted sources → src/generated/, gitignored), hono/jsx SSR
(list + code viewer + sticky try-it panel with per-chapter preset requests),
/run/:chapter/* forwards into Dynamic Workers (globalOutbound: null,
RUN_LIMITER ratelimit 30 req/min per IP). Live: hello-hono, kv, d1, r2 via
facades against SITE_KV (94cd63ce...), SITE_DB cf-demos-site (bf2ad31b...),
SITE_BUCKET cf-demos-site. All verified in production. Note: first D1 query
right after deploy returned a transient 1104; fine afterwards.

## Next steps

1. (on hold, per Yusuke 2026-07-16) Flagship live verify: after
   `wrangler login`, create app `cf-demos` + boolean flag `new-banner`, put
   app_id into demos/flagship/wrangler.jsonc. Code/tsc already done.
2. (done 2026-07-16) website v2: workers-ai/vectorize live via delegating
   facades (model allowlist, 500-char input cap, AI_LIMITER 5/min;
   Vectorize namespaces = session isolation); service-bindings live via
   BackendFacade — dynamic worker entrypoints cannot be passed into another
   worker's env (DataCloneError), the parent must expose a forwarding
   entrypoint. DO facets: DONE (2026-07-16) — durable-objects runs live; FacetHost supervisor DO (named by sid) runs the chapter Counter class as facets via ctx.facets.get + worker.getDurableObjectClass, one facet per counter name, alarm deletes facets. Worked first try, local and prod.
3. (done 2026-07-16) rate-limit + images live (RateLimitFacade with
   session-scoped keys; ImagesFacade rebuilds the input/transform/output
   chain — buffer over RPC, rewrap as fixed-length stream). Try-it panel
   gained file upload, binary presets (bodyUrl), and inline image rendering.
   Home page has a How it works section; repo README links the site with a
   screenshot.
