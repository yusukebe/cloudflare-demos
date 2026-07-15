import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.post('/messages', async (c) => {
  await c.env.QUEUE.send(await c.req.json())
  return c.json({ queued: true }, 202)
})

export default {
  fetch: app.fetch,
  async queue(batch) {
    for (const message of batch.messages) {
      console.log('consumed', message.id, JSON.stringify(message.body))
      message.ack()
    }
  },
} satisfies ExportedHandler<Env>
