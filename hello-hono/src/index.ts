import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello from Hono on Cloudflare Workers!'))

app.get('/json', (c) =>
  c.json({
    framework: 'hono',
    runtime: 'cloudflare-workers',
  })
)

app.get('/where', (c) => {
  const cf = c.req.raw.cf
  return c.json({
    colo: cf?.colo,
    country: cf?.country,
    city: cf?.city,
  })
})

export default app
