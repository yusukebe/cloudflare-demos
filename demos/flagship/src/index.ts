import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const userId = c.req.query('userId') ?? 'anonymous'
  const enabled = await c.env.FLAGS.getBooleanValue('new-banner', false, { userId })
  return c.text(enabled ? 'New banner!' : 'Classic banner')
})

app.get('/details', async (c) => {
  const userId = c.req.query('userId') ?? 'anonymous'
  const details = await c.env.FLAGS.getBooleanDetails('new-banner', false, { userId })
  return c.json(details)
})

export default app
