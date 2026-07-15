import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.post('/send', async (c) => {
  const { to, subject, text } = await c.req.json<{ to: string; subject: string; text: string }>()
  const response = await c.env.EMAIL.send({
    to,
    from: { email: 'hello@yourdomain.com', name: 'cloudflare-demos' },
    subject,
    text,
  })
  return c.json({ messageId: response.messageId })
})

export default app
