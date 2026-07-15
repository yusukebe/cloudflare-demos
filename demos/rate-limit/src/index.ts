import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const key = c.req.header('cf-connecting-ip') ?? 'anonymous'
  const { success } = await c.env.RATE_LIMITER.limit({ key })
  if (!success) {
    return c.text('Too Many Requests', 429)
  }
  return c.text('OK')
})

export default app
