import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

const embed = async (env: Env, text: string) => {
  const output = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] })
  if (!('data' in output) || !output.data) {
    throw new Error('embedding failed')
  }
  return output.data[0]
}

app.post('/notes', async (c) => {
  const { id, text } = await c.req.json<{ id: string; text: string }>()
  const values = await embed(c.env, text)
  await c.env.INDEX.upsert([{ id, values, metadata: { text } }])
  return c.json({ id }, 201)
})

app.get('/search', async (c) => {
  const values = await embed(c.env, c.req.query('q') ?? '')
  const { matches } = await c.env.INDEX.query(values, { topK: 3, returnMetadata: 'all' })
  return c.json(matches.map(({ id, score, metadata }) => ({ id, score, metadata })))
})

export default app
