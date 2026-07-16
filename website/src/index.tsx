import { Hono } from 'hono'
import type { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import type { FC, PropsWithChildren } from 'hono/jsx'
import { chapters } from './generated/chapters'

export {
  AIFacade,
  BackendFacade,
  CounterFacade,
  D1Facade,
  FacetHost,
  ImagesFacade,
  KVFacade,
  R2Facade,
  RateLimitFacade,
  SessionDB,
  VectorizeFacade,
} from './facades'

type AppEnv = { Bindings: Env; Variables: { sid: string } }

const app = new Hono<AppEnv>()

const ORIGIN = 'https://cf-demos.yusuke.run'
const DEFAULT_DESCRIPTION = 'Minimal Cloudflare product demos — run live in your browser'

const ShareOnX: FC<{ text: string; path: string }> = ({ text, path }) => (
  <a
    class='share'
    href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(ORIGIN + path)}`}
    target='_blank'
    rel='noreferrer'
  >
    𝕏 Share
  </a>
)

const Layout: FC<
  PropsWithChildren<{ title?: string; description?: string; path?: string; ogImage?: string }>
> = ({ title, description, path, ogImage, children }) => (
  <html>
    <head>
      <meta charset='utf-8' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <title>{title ? `${title} · cloudflare-demos` : 'cloudflare-demos'}</title>
      <meta name='description' content={description ?? DEFAULT_DESCRIPTION} />
      <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
      <meta property='og:title' content={title ?? 'cloudflare-demos'} />
      <meta property='og:description' content={description ?? DEFAULT_DESCRIPTION} />
      <meta property='og:url' content={`${ORIGIN}${path ?? '/'}`} />
      <meta property='og:site_name' content='cloudflare-demos' />
      <meta property='og:type' content='website' />
      <meta property='og:image' content={`${ORIGIN}${ogImage ?? '/og.png'}`} />
      <meta name='twitter:card' content='summary_large_image' />
      <style>{`
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #0d1117; color: #e6edf3;
               font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.6; }
        a { color: #79c0ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        main { max-width: 900px; margin: 0 auto; padding: 2rem 1rem 4rem; }
        main:has(.tryit) { max-width: none; padding-left: 2rem; padding-right: 2rem; }
        header { border-bottom: 1px solid #30363d; padding: 1rem; }
        header a { color: #e6edf3; font-weight: 600; }
        h1 { font-size: 1.5rem; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: .5rem .75rem; border-bottom: 1px solid #21262d; text-align: left; }
        .product { color: #f0883e; white-space: nowrap; }
        .badge { font-size: .75rem; background: #1f6feb33; color: #79c0ff;
                 border: 1px solid #1f6feb66; border-radius: 999px; padding: .05rem .6rem; }
        pre.shiki { padding: 1rem; border-radius: 8px; border: 1px solid #30363d;
                    overflow-x: auto; font-size: .85rem; background: #12181f !important; }
        .file { color: #8b949e; font-size: .8rem; margin: 1.5rem 0 .25rem; }
        @media (min-width: 1100px) {
          .cols:has(.tryit) { display: grid; grid-template-columns: minmax(0, 1fr) 420px;
                              gap: 1.5rem; align-items: start; }
          .tryit { position: sticky; top: 1rem; margin-top: 1.5rem; }
        }
        .tryit { border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin-top: 2rem;
                 background: #010409; }
        .tryit form { display: flex; gap: .5rem; flex-wrap: wrap; margin-top: .75rem; }
        .presets { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: .75rem; }
        input, select, textarea, button { background: #161b22; color: #e6edf3;
          border: 1px solid #30363d; border-radius: 6px; padding: .4rem .6rem; font: inherit; }
        input[name=path] { flex: 1; min-width: 10rem; font-family: ui-monospace, monospace; }
        textarea { width: 100%; font-family: ui-monospace, monospace; }
        button { cursor: pointer; }
        button[type=submit] { background: #238636; border-color: #2ea043; }
        .presets button { background: #21262d; border-color: #30363d; font-size: .8rem;
                          padding: .25rem .6rem; }
        a.share { display: inline-block; background: #21262d; border: 1px solid #30363d;
                  border-radius: 6px; padding: .15rem .6rem; font-size: .8rem;
                  color: #e6edf3; }
        a.share:hover { text-decoration: none; border-color: #8b949e; }
        pre#out { background: #161b22; border: 1px solid #30363d; border-radius: 6px;
                  padding: .75rem; white-space: pre-wrap; word-break: break-all;
                  font-size: .8rem; max-height: 24rem; overflow-y: auto; }
        #status { font-family: ui-monospace, monospace; font-size: .8rem; margin-top: .75rem; }
        #status.ok { color: #3fb950; }
        #status.err { color: #f85149; }
        #outimg { display: none; max-width: 100%; margin-top: .5rem; border-radius: 6px;
                  border: 1px solid #30363d; }
        input[type=file] { width: 100%; font-size: .8rem; color: #8b949e; }
        .how { margin-top: 3rem; color: #c9d1d9; }
        .how h2 { font-size: 1.1rem; }
        .how li { margin: .4rem 0; }
        footer { border-top: 1px solid #30363d; padding: 1.5rem 1rem; text-align: center;
                 color: #8b949e; font-size: .85rem; }
      `}</style>
    </head>
    <body>
      <header>
        <a href='/'>cloudflare-demos</a>
      </header>
      <main>{children}</main>
      <footer>
        Built by <a href='https://github.com/yusukebe'>Yusuke Wada</a> ·{' '}
        <a href='https://github.com/yusukebe/cloudflare-demos'>GitHub</a> ·{' '}
        <a href='https://x.com/yusukebe'>X</a>
      </footer>
    </body>
  </html>
)

app.get('/', (c) =>
  c.html(
    <Layout>
      <h1>Minimal Cloudflare product demos</h1>
      <p>
        One small <a href='https://hono.dev'>Hono</a>-based Worker per product. Chapters marked
        <span class='badge'>live</span> run in a sandboxed{' '}
        <a href='https://developers.cloudflare.com/dynamic-workers/'>Dynamic Worker</a>.{' '}
        <ShareOnX
          text='cloudflare-demos — minimal Cloudflare product demos, running live in sandboxed Dynamic Workers'
          path='/'
        />
      </p>
      <table>
        <tbody>
          {chapters.map((ch) => (
            <tr>
              <td>
                <a href={`/demos/${ch.name}`}>{ch.name}</a>{' '}
                {ch.bundle && <span class='badge'>live</span>}
              </td>
              <td class='product'>{ch.product}</td>
              <td>{ch.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class='how'>
        <h2>How it works</h2>
        <ul>
          <li>
            Each demo is a tiny <a href='https://hono.dev'>Hono</a> Worker showing the ordinary,
            minimal usage of one product — source in{' '}
            <a href='https://github.com/yusukebe/cloudflare-demos'>the repo</a>.
          </li>
          <li>
            Live chapters are bundled with esbuild at build time and loaded on demand into a{' '}
            <a href='https://developers.cloudflare.com/dynamic-workers/'>Dynamic Worker</a> with{' '}
            <code>globalOutbound: null</code>, so demo code has no network access.
          </li>
          <li>
            Bindings are capability-based facades passed via <code>ctx.exports</code>: the demo code
            is unchanged, but its KV / D1 / R2 / AI calls are forwarded to session-scoped resources.
            Each visitor gets their own isolate, KV/R2 prefix, Vectorize namespace — and a
            SQLite-backed Durable Object standing in for D1.
          </li>
          <li>
            Everything cleans itself up: KV TTLs, Durable Object alarms, and an R2 lifecycle rule
            expire each session's data.
          </li>
        </ul>
      </div>
    </Layout>
  )
)

app.get('/demos/:name', (c) => {
  const chapter = chapters.find((ch) => ch.name === c.req.param('name'))
  if (!chapter) {
    return c.notFound()
  }
  return c.html(
    <Layout
      title={chapter.name}
      description={`${chapter.product}: ${chapter.description}`}
      path={`/demos/${chapter.name}`}
      ogImage={`/og/${chapter.name}.png`}
    >
      <h1>
        {chapter.name} <span class='product'>{chapter.product}</span>
      </h1>
      <p>
        {chapter.description} —{' '}
        <a href={`https://github.com/yusukebe/cloudflare-demos/tree/main/demos/${chapter.name}`}>
          source on GitHub
        </a>{' '}
        <ShareOnX
          text={`${chapter.name} — a minimal Cloudflare ${chapter.product} demo, running live in a sandboxed Dynamic Worker`}
          path={`/demos/${chapter.name}`}
        />
      </p>
      <div class='cols'>
        <div>
          {chapter.files.map((file) => (
            <div>
              <div class='file'>{file.name}</div>
              <div dangerouslySetInnerHTML={{ __html: file.sourceHtml }} />
            </div>
          ))}
        </div>
        {chapter.bundle && (
          <div class='tryit'>
            <strong>Try it</strong> — requests go to a Dynamic Worker running this code. State is
            isolated per browser session and expires after a while.
            <div class='presets' id='presets'></div>
            <form id='f'>
              <select name='method'>
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
              <input name='path' value='/' />
              <button type='submit'>Send</button>
              <textarea name='body' rows={3} placeholder='request body (optional)'></textarea>
              <input type='file' name='file' />
            </form>
            <div id='status'></div>
            <pre id='out'>response will appear here</pre>
            <img id='outimg' alt='response' />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                const examples = ${JSON.stringify(chapter.examples ?? [])}
                const form = document.getElementById('f')
                let bodyUrl = null
                const send = async () => {
                  const f = new FormData(form)
                  const status = document.getElementById('status')
                  const out = document.getElementById('out')
                  const img = document.getElementById('outimg')
                  status.textContent = '...'
                  status.className = ''
                  img.style.display = 'none'
                  try {
                    const method = f.get('method')
                    const headers = {}
                    let body
                    if (method !== 'GET') {
                      const file = form.file.files[0]
                      if (file) {
                        body = file
                      } else if (bodyUrl) {
                        body = await (await fetch(bodyUrl)).blob()
                      } else if (f.get('body')) {
                        body = f.get('body')
                        try { JSON.parse(body); headers['content-type'] = 'application/json' }
                        catch { headers['content-type'] = 'text/plain' }
                      }
                    }
                    const res = await fetch('/run/${chapter.name}' + f.get('path'), {
                      method, headers, body,
                    })
                    status.textContent = method + ' ' + f.get('path') + ' → ' +
                      res.status + ' ' + res.statusText
                    status.className = res.ok ? 'ok' : 'err'
                    const ct = res.headers.get('content-type') || ''
                    if (ct.startsWith('image/')) {
                      const blob = await res.blob()
                      img.src = URL.createObjectURL(blob)
                      img.style.display = 'block'
                      out.textContent = '(' + ct + ', ' + blob.size + ' bytes)'
                    } else {
                      let text = await res.text()
                      try { text = JSON.stringify(JSON.parse(text), null, 2) } catch {}
                      out.textContent = text || '(empty body)'
                    }
                  } catch (err) {
                    status.textContent = String(err)
                    status.className = 'err'
                  }
                }
                form.addEventListener('submit', (e) => { e.preventDefault(); send() })
                form.body.addEventListener('input', () => { bodyUrl = null })
                form.file.addEventListener('change', () => { bodyUrl = null })
                const presets = document.getElementById('presets')
                for (const ex of examples) {
                  const b = document.createElement('button')
                  b.type = 'button'
                  b.textContent = ex.label
                  b.addEventListener('click', () => {
                    form.method.value = ex.method
                    form.path.value = ex.path
                    form.body.value = ex.body ?? (ex.bodyUrl ? '(binary body: ' + ex.bodyUrl + ')' : '')
                    bodyUrl = ex.bodyUrl ?? null
                    form.file.value = ''
                  })
                  presets.appendChild(b)
                }`,
              }}
            />
          </div>
        )}
      </div>
    </Layout>
  )
})

const chapterEnv = (c: Context<AppEnv>, name: string, sid: string) => {
  const exports = c.executionCtx.exports
  switch (name) {
    case 'kv':
      return { KV: exports.KVFacade({ props: { prefix: `sessions:${sid}:kv` } }) }
    case 'd1':
      return { DB: exports.D1Facade({ props: { sid } }) }
    case 'r2':
      return { BUCKET: exports.R2Facade({ props: { prefix: `sessions/${sid}/r2` } }) }
    case 'workers-ai':
      return { AI: exports.AIFacade({}) }
    case 'vectorize':
      return {
        AI: exports.AIFacade({}),
        INDEX: exports.VectorizeFacade({ props: { sid } }),
      }
    case 'service-bindings':
      return { BACKEND: exports.BackendFacade({ props: { sid } }) }
    case 'rate-limit':
      return { RATE_LIMITER: exports.RateLimitFacade({ props: { sid } }) }
    case 'images':
      return { IMAGES: exports.ImagesFacade({}) }
    case 'durable-objects':
      return { COUNTER: exports.CounterFacade({ props: { sid } }) }
    default:
      return {}
  }
}

const AI_CHAPTERS = new Set(['workers-ai', 'vectorize'])

app.use('/run/*', async (c, next) => {
  let sid = getCookie(c, 'sid')
  const isNew = !sid
  sid ??= crypto.randomUUID()
  c.set('sid', sid)
  await next()
  if (isNew) {
    // The dynamic worker's response has immutable headers — rewrap to set the cookie
    c.res = new Response(c.res.body, c.res)
    setCookie(c, 'sid', sid, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 7200 })
  }
})

app.all('/run/:name/*', run)
app.all('/run/:name', run)

async function run(c: Context<AppEnv>) {
  const ip = c.req.header('cf-connecting-ip') ?? 'local'
  const { success } = await c.env.RUN_LIMITER.limit({ key: ip })
  if (!success) {
    return c.text('Too Many Requests', 429)
  }
  const name = c.req.param('name') ?? ''
  const chapter = chapters.find((ch) => ch.name === name && ch.bundle)
  if (!chapter) {
    return c.notFound()
  }
  if (AI_CHAPTERS.has(name)) {
    const { success } = await c.env.AI_LIMITER.limit({ key: ip })
    if (!success) {
      return c.text('Too Many Requests (AI demos are limited to 5 req/min)', 429)
    }
  }
  const sid = c.get('sid')
  const worker = c.env.LOADER.get(`${name}@${chapter.hash}@${sid}`, async () => ({
    compatibilityDate: '2026-07-01',
    mainModule: 'index.js',
    modules: { 'index.js': chapter.bundle! },
    env: chapterEnv(c, name, sid),
    globalOutbound: null,
  }))
  const url = new URL(c.req.url)
  url.pathname = url.pathname.slice(`/run/${name}`.length) || '/'
  return worker.getEntrypoint().fetch(new Request(url, c.req.raw))
}

export default app
