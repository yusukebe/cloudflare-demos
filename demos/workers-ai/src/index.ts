import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.post('/chat', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()
  const result = await c.env.AI.run('@cf/meta/llama-3.2-3b-instruct', { prompt })
  return c.json(result)
})

export default app
