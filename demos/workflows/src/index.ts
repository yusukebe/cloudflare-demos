import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers'
import { Hono } from 'hono'

type Params = { name: string }

export class GreetingWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const greeting = await step.do('make greeting', async () => `Hello, ${event.payload.name}!`)
    await step.sleep('wait a bit', '3 seconds')
    return await step.do('shout', async () => greeting.toUpperCase())
  }
}

const app = new Hono<{ Bindings: Env }>()

app.post('/workflows', async (c) => {
  const instance = await c.env.WORKFLOW.create({ params: await c.req.json<Params>() })
  return c.json({ id: instance.id }, 201)
})

app.get('/workflows/:id', async (c) => {
  const instance = await c.env.WORKFLOW.get(c.req.param('id'))
  return c.json(await instance.status())
})

export default app
