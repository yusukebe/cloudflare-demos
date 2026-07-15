import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.post('/info', async (c) => {
  if (!c.req.raw.body) {
    return c.text('image body required', 400)
  }
  return c.json(await c.env.IMAGES.info(c.req.raw.body))
})

app.post('/resize', async (c) => {
  if (!c.req.raw.body) {
    return c.text('image body required', 400)
  }
  const width = Number(c.req.query('width') ?? 200)
  const result = await c.env.IMAGES.input(c.req.raw.body)
    .transform({ width })
    .output({ format: 'image/png' })
  return result.response()
})

export default app
