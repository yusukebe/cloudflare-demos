import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/posts', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM posts ORDER BY id DESC').all()
  return c.json(results)
})

app.get('/posts/:id', async (c) => {
  const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?')
    .bind(c.req.param('id'))
    .first()
  if (!post) {
    return c.notFound()
  }
  return c.json(post)
})

app.post('/posts', async (c) => {
  const { title, body } = await c.req.json<{ title: string; body: string }>()
  const post = await c.env.DB.prepare('INSERT INTO posts (title, body) VALUES (?, ?) RETURNING *')
    .bind(title, body)
    .first()
  return c.json(post, 201)
})

app.delete('/posts/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})

export default app
