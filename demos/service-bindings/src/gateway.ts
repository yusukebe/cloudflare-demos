import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/add/:a/:b', async (c) => {
  const result = await c.env.BACKEND.add(Number(c.req.param('a')), Number(c.req.param('b')))
  return c.json({ result })
})

app.get('/greet/:name', async (c) => {
  return c.text(await c.env.BACKEND.greet(c.req.param('name')))
})

export default app
