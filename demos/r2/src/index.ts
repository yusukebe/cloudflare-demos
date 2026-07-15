import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/files', async (c) => {
  const list = await c.env.BUCKET.list()
  return c.json(list.objects.map(({ key, size, uploaded }) => ({ key, size, uploaded })))
})

app.get('/files/:key', async (c) => {
  const object = await c.env.BUCKET.get(c.req.param('key'))
  if (!object) {
    return c.notFound()
  }
  c.header('etag', object.httpEtag)
  if (object.httpMetadata?.contentType) {
    c.header('content-type', object.httpMetadata.contentType)
  }
  return c.body(object.body)
})

app.put('/files/:key', async (c) => {
  const object = await c.env.BUCKET.put(c.req.param('key'), c.req.raw.body, {
    httpMetadata: { contentType: c.req.header('content-type') },
  })
  return c.json({ key: object.key, size: object.size, etag: object.etag }, 201)
})

app.delete('/files/:key', async (c) => {
  await c.env.BUCKET.delete(c.req.param('key'))
  return c.body(null, 204)
})

export default app
