import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/keys', async (c) => {
  const list = await c.env.KV.list()
  return c.json(list.keys)
})

app.get('/keys/:key', async (c) => {
  const value = await c.env.KV.get(c.req.param('key'))
  if (value === null) {
    return c.notFound()
  }
  return c.text(value)
})

app.put('/keys/:key', async (c) => {
  const ttl = c.req.query('ttl')
  await c.env.KV.put(c.req.param('key'), await c.req.text(), {
    expirationTtl: ttl ? Number(ttl) : undefined,
  })
  return c.body(null, 204)
})

app.delete('/keys/:key', async (c) => {
  await c.env.KV.delete(c.req.param('key'))
  return c.body(null, 204)
})

export default app
