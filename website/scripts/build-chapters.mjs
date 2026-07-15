import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import { codeToHtml } from 'shiki'

const root = path.resolve(import.meta.dirname, '../..')
const demosDir = path.join(root, 'demos')
const outDir = path.resolve(import.meta.dirname, '../src/generated')

const META = [
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

const RUNNABLE = {
  'hello-hono': 'index.ts',
  kv: 'index.ts',
  d1: 'index.ts',
  r2: 'index.ts',
  'workers-ai': 'index.ts',
  vectorize: 'index.ts',
  'service-bindings': 'gateway.ts',
}
const EXTRA_BUNDLE = { 'service-bindings': 'backend.ts' }

const EXAMPLES = {
  'hello-hono': [
    { label: 'GET /', method: 'GET', path: '/' },
    { label: 'GET /json', method: 'GET', path: '/json' },
    { label: 'GET /where', method: 'GET', path: '/where' },
  ],
  kv: [
    { label: 'put greeting', method: 'PUT', path: '/keys/greeting', body: 'hello' },
    { label: 'get greeting', method: 'GET', path: '/keys/greeting' },
    {
      label: 'put with TTL',
      method: 'PUT',
      path: '/keys/temp?ttl=60',
      body: 'expires in a minute',
    },
    { label: 'list keys', method: 'GET', path: '/keys' },
    { label: 'delete greeting', method: 'DELETE', path: '/keys/greeting' },
  ],
  d1: [
    {
      label: 'create post',
      method: 'POST',
      path: '/posts',
      body: '{"title":"Hello","body":"First post"}',
    },
    { label: 'list posts', method: 'GET', path: '/posts' },
    { label: 'get post 1', method: 'GET', path: '/posts/1' },
    { label: 'delete post 1', method: 'DELETE', path: '/posts/1' },
  ],
  r2: [
    { label: 'upload hello.txt', method: 'PUT', path: '/files/hello.txt', body: 'hello r2' },
    { label: 'download hello.txt', method: 'GET', path: '/files/hello.txt' },
    { label: 'list files', method: 'GET', path: '/files' },
    { label: 'delete hello.txt', method: 'DELETE', path: '/files/hello.txt' },
  ],
  'workers-ai': [
    {
      label: 'say hi',
      method: 'POST',
      path: '/chat',
      body: '{"prompt":"Say hi in exactly five words."}',
    },
    {
      label: 'haiku',
      method: 'POST',
      path: '/chat',
      body: '{"prompt":"Write a haiku about computing on the edge."}',
    },
  ],
  vectorize: [
    {
      label: 'add note: ramen',
      method: 'POST',
      path: '/notes',
      body: '{"id":"1","text":"I love ramen"}',
    },
    {
      label: 'add note: workers',
      method: 'POST',
      path: '/notes',
      body: '{"id":"2","text":"Cloudflare Workers is a serverless platform"}',
    },
    { label: 'search: noodle soup', method: 'GET', path: '/search?q=noodle+soup' },
    { label: 'search: edge computing', method: 'GET', path: '/search?q=edge+computing' },
  ],
  'service-bindings': [
    { label: 'add 2 + 3', method: 'GET', path: '/add/2/3' },
    { label: 'greet', method: 'GET', path: '/greet/Yusuke' },
  ],
}

const chapters = []
for (const [name, product, description] of META) {
  const srcDir = path.join(demosDir, name, 'src')
  const files = []
  for (const file of (await readdir(srcDir)).sort()) {
    const source = await readFile(path.join(srcDir, file), 'utf8')
    const sourceHtml = await codeToHtml(source, {
      lang: 'typescript',
      theme: 'github-dark-default',
    })
    files.push({ name: `src/${file}`, sourceHtml })
  }

  let bundle
  let backendBundle
  let hash
  if (RUNNABLE[name]) {
    bundle = await bundleFile(path.join(srcDir, RUNNABLE[name]))
    if (EXTRA_BUNDLE[name]) {
      backendBundle = await bundleFile(path.join(srcDir, EXTRA_BUNDLE[name]))
    }
    hash = createHash('sha256')
      .update(bundle)
      .update(backendBundle ?? '')
      .digest('hex')
      .slice(0, 8)
  }

  chapters.push({
    name,
    product,
    description,
    files,
    bundle,
    backendBundle,
    hash,
    examples: EXAMPLES[name],
  })
}

async function bundleFile(file) {
  const result = await build({
    entryPoints: [file],
    bundle: true,
    format: 'esm',
    write: false,
    external: ['cloudflare:*'],
  })
  return result.outputFiles[0].text
}

await mkdir(outDir, { recursive: true })
await writeFile(
  path.join(outDir, 'chapters.ts'),
  `// Generated by scripts/build-chapters.mjs — do not edit
export type ChapterFile = { name: string; sourceHtml: string }
export type Example = { label: string; method: string; path: string; body?: string }
export type Chapter = {
  name: string
  product: string
  description: string
  files: ChapterFile[]
  bundle?: string
  backendBundle?: string
  hash?: string
  examples?: Example[]
}
export const chapters: Chapter[] = ${JSON.stringify(chapters, null, 2)}
`
)
console.log(`generated ${chapters.length} chapters (${Object.keys(RUNNABLE).length} runnable)`)
