# cloudflare-demos

A living collection of minimal Cloudflare product demos (Hono-based): one small
runnable Worker per product, and a Dynamic Workers-powered demo site that
runs each demo live. Useful for workshops, blog
posts, customer conversations, and personal reference. Each demo shows the
ordinary, minimal usage of its product — no scenario theming, minimal comments.

**Read `PLAN.md` first** — it carries all research notes, agreed decisions, and
next steps from the planning session.

Conventions:

- Code comments and READMEs in English; chat with Yusuke in Japanese.
- Hono for all Workers. No external auth services or auth libraries.
- Format with oxfmt (hono rules). Verify Workers with the `workers-fetch`
  skill (single-shot local request) instead of keeping `wrangler dev` running.
