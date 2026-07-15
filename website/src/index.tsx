import { Hono } from 'hono'
import type { Context } from 'hono'
import type { FC, PropsWithChildren } from 'hono/jsx'
import { chapters } from './generated/chapters'

export { D1Facade, KVFacade, R2Facade } from './facades'

const app = new Hono<{ Bindings: Env }>()

const Layout: FC<PropsWithChildren<{ title?: string }>> = ({ title, children }) => (
  <html>
    <head>
      <meta charset='utf-8' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <title>{title ? `${title} · cloudflare-demos` : 'cloudflare-demos'}</title>
      <style>{`
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #0d1117; color: #e6edf3;
               font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.6; }
        a { color: #79c0ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        main { max-width: 900px; margin: 0 auto; padding: 2rem 1rem 4rem; }
        main:has(.tryit) { max-width: 1500px; }
        header { border-bottom: 1px solid #30363d; padding: 1rem; }
        header a { color: #e6edf3; font-weight: 600; }
        h1 { font-size: 1.5rem; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: .5rem .75rem; border-bottom: 1px solid #21262d; text-align: left; }
        .product { color: #f0883e; white-space: nowrap; }
        .badge { font-size: .75rem; background: #1f6feb33; color: #79c0ff;
                 border: 1px solid #1f6feb66; border-radius: 999px; padding: .05rem .6rem; }
        pre.shiki { padding: 1rem; border-radius: 8px; border: 1px solid #30363d;
                    overflow-x: auto; font-size: .85rem; }
        .file { color: #8b949e; font-size: .8rem; margin: 1.5rem 0 .25rem; }
        @media (min-width: 1100px) {
          .cols { display: grid; grid-template-columns: minmax(0, 1fr) 420px;
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
        pre#out { background: #161b22; border: 1px solid #30363d; border-radius: 6px;
                  padding: .75rem; white-space: pre-wrap; word-break: break-all;
                  font-size: .8rem; max-height: 24rem; overflow-y: auto; }
        #status { font-family: ui-monospace, monospace; font-size: .8rem; margin-top: .75rem; }
        #status.ok { color: #3fb950; }
        #status.err { color: #f85149; }
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
        <a href='https://developers.cloudflare.com/dynamic-workers/'>Dynamic Worker</a>.
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
    </Layout>
  )
)

app.get('/demos/:name', (c) => {
  const chapter = chapters.find((ch) => ch.name === c.req.param('name'))
  if (!chapter) {
    return c.notFound()
  }
  return c.html(
    <Layout title={chapter.name}>
      <h1>
        {chapter.name} <span class='product'>{chapter.product}</span>
      </h1>
      <p>
        {chapter.description} —{' '}
        <a href={`https://github.com/yusukebe/cloudflare-demos/tree/main/demos/${chapter.name}`}>
          source on GitHub
        </a>
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
            <strong>Try it</strong> — requests go to a Dynamic Worker running this code
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
            </form>
            <div id='status'></div>
            <pre id='out'>response will appear here</pre>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                const examples = ${JSON.stringify(chapter.examples ?? [])}
                const form = document.getElementById('f')
                const send = async () => {
                  const f = new FormData(form)
                  const status = document.getElementById('status')
                  const out = document.getElementById('out')
                  status.textContent = '...'
                  status.className = ''
                  try {
                    const method = f.get('method')
                    const body = method === 'GET' ? undefined : f.get('body') || undefined
                    const headers = {}
                    if (body) {
                      try { JSON.parse(body); headers['content-type'] = 'application/json' }
                      catch { headers['content-type'] = 'text/plain' }
                    }
                    const res = await fetch('/run/${chapter.name}' + f.get('path'), {
                      method, headers, body,
                    })
                    let text = await res.text()
                    try { text = JSON.stringify(JSON.parse(text), null, 2) } catch {}
                    status.textContent = method + ' ' + f.get('path') + ' → ' +
                      res.status + ' ' + res.statusText
                    status.className = res.ok ? 'ok' : 'err'
                    out.textContent = text || '(empty body)'
                  } catch (err) {
                    status.textContent = String(err)
                    status.className = 'err'
                  }
                }
                form.addEventListener('submit', (e) => { e.preventDefault(); send() })
                const presets = document.getElementById('presets')
                for (const ex of examples) {
                  const b = document.createElement('button')
                  b.type = 'button'
                  b.textContent = ex.label
                  b.addEventListener('click', () => {
                    form.method.value = ex.method
                    form.path.value = ex.path
                    form.body.value = ex.body ?? ''
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

const chapterEnv = (name: string, exports: Cloudflare.Exports) => {
  switch (name) {
    case 'kv':
      return { KV: exports.KVFacade({ props: { prefix: 'demo:kv' } }) }
    case 'd1':
      return { DB: exports.D1Facade({}) }
    case 'r2':
      return { BUCKET: exports.R2Facade({ props: { prefix: 'demo-r2' } }) }
    default:
      return {}
  }
}

app.all('/run/:name/*', run)
app.all('/run/:name', run)

async function run(c: Context<{ Bindings: Env }>) {
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
  const worker = c.env.LOADER.get(`${name}@${chapter.hash}`, async () => ({
    compatibilityDate: '2026-07-01',
    mainModule: 'index.js',
    modules: { 'index.js': chapter.bundle! },
    env: chapterEnv(name, c.executionCtx.exports),
    globalOutbound: null,
  }))
  const url = new URL(c.req.url)
  url.pathname = url.pathname.slice(`/run/${name}`.length) || '/'
  return worker.getEntrypoint().fetch(new Request(url, c.req.raw))
}

export default app
