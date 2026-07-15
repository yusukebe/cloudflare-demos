import { DurableObject } from 'cloudflare:workers'
import { Hono } from 'hono'

export class Counter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS counter (value INTEGER NOT NULL)')
    if (ctx.storage.sql.exec('SELECT 1 FROM counter').toArray().length === 0) {
      ctx.storage.sql.exec('INSERT INTO counter (value) VALUES (0)')
    }
  }

  get(): number {
    return this.ctx.storage.sql.exec<{ value: number }>('SELECT value FROM counter').one().value
  }

  increment(by: number): number {
    return this.ctx.storage.sql
      .exec<{ value: number }>('UPDATE counter SET value = value + ? RETURNING value', by)
      .one().value
  }
}

const app = new Hono<{ Bindings: Env }>()

app.get('/counters/:name', async (c) => {
  const name = c.req.param('name')
  const value = await c.env.COUNTER.getByName(name).get()
  return c.json({ name, value })
})

app.post('/counters/:name/increment', async (c) => {
  const name = c.req.param('name')
  const value = await c.env.COUNTER.getByName(name).increment(1)
  return c.json({ name, value })
})

export default app
