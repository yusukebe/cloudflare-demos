// Renders per-chapter OG images with headless Chrome (macOS).
// Run manually when chapters change: node scripts/build-og.mjs
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const outDir = path.resolve(import.meta.dirname, '../public/og')

const CHAPTERS = [
  ['hello-hono', 'Workers', 'Smallest Worker + request.cf metadata'],
  ['kv', 'Workers KV', 'get / put / delete / list + TTL'],
  ['d1', 'D1', 'Migrations + SQL CRUD'],
  ['durable-objects', 'Durable Objects', 'Per-name object, SQLite storage, RPC'],
  ['r2', 'R2', 'Streaming upload / download'],
  ['queues', 'Queues', 'Producer + consumer in one Worker'],
  ['workflows', 'Workflows', 'Durable steps, sleep, auto-retry'],
  ['cron', 'Cron Triggers', 'scheduled() handler'],
  ['static-assets', 'Static Assets', 'Static files + Worker API routes'],
  ['service-bindings', 'Service Bindings', 'Worker-to-Worker RPC, zero overhead'],
  ['rate-limit', 'Rate Limiting', 'Per-key limits on the edge'],
  ['workers-ai', 'Workers AI', 'LLM inference with one binding call'],
  ['vectorize', 'Vectorize', 'Semantic search with embeddings'],
  ['browser-rendering', 'Browser Rendering', 'Headless Chromium screenshot'],
  ['images', 'Images', 'Inspect / resize / convert images'],
  ['email', 'Email Service', 'Transactional send via send_email'],
  ['flagship', 'Flagship', 'Feature flag evaluation with context'],
]

const html = (name, product, description) => `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #0d1117; color: #e6edf3;
    font-family: ui-sans-serif, system-ui, sans-serif; display: flex;
    flex-direction: column; justify-content: center; padding: 0 96px;
    position: relative; overflow: hidden; }
  .mark { width: 84px; height: 84px; border-radius: 20px; background: #161b22;
    border: 2px solid #30363d; display: flex; align-items: center; justify-content: center;
    font-family: ui-monospace, Menlo, monospace; font-size: 52px; font-weight: 700;
    color: #f0883e; margin-bottom: 36px; }
  .product { font-size: 30px; color: #f0883e; font-weight: 600; margin-bottom: 8px; }
  h1 { font-size: 88px; font-weight: 700; letter-spacing: -2px;
    font-family: ui-monospace, Menlo, monospace; }
  p { font-size: 34px; color: #8b949e; margin-top: 18px; }
  .badge { position: absolute; bottom: 48px; left: 96px; font-size: 26px; color: #79c0ff;
    font-family: ui-monospace, Menlo, monospace; }
  .site { position: absolute; top: 48px; right: 96px; font-size: 26px; color: #8b949e; }
  .glow { position: absolute; right: -180px; top: -180px; width: 560px; height: 560px;
    border-radius: 50%; background: radial-gradient(circle, #f0883e33, transparent 70%); }
</style></head><body>
  <div class="glow"></div>
  <div class="site">cloudflare-demos</div>
  <div class="mark">C</div>
  <div class="product">${product}</div>
  <h1>${name}</h1>
  <p>${description}</p>
  <div class="badge">cf-demos.yusuke.run/demos/${name}</div>
</body></html>`

await mkdir(outDir, { recursive: true })
for (const [name, product, description] of CHAPTERS) {
  const htmlPath = path.join(tmpdir(), `og-${name}.html`)
  await writeFile(htmlPath, html(name, product, description))
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--screenshot=${path.join(outDir, `${name}.png`)}`,
    '--window-size=1200,630',
    '--hide-scrollbars',
    `file://${htmlPath}`,
  ])
  console.log(`og/${name}.png`)
}
