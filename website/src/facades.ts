import { DurableObject, RpcTarget, WorkerEntrypoint } from 'cloudflare:workers'
import { chapters } from './generated/chapters'

type Props = { prefix: string }
type SessionProps = { sid: string }

const SESSION_TTL_SECONDS = 7200

export class KVFacade extends WorkerEntrypoint<Env, Props> {
  #key(key: string) {
    return `${this.ctx.props.prefix}:${key}`
  }

  get(key: string) {
    return this.env.SITE_KV.get(this.#key(key))
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }) {
    await this.env.SITE_KV.put(this.#key(key), value, {
      expirationTtl: options?.expirationTtl ?? SESSION_TTL_SECONDS,
    })
  }

  async delete(key: string) {
    await this.env.SITE_KV.delete(this.#key(key))
  }

  async list() {
    const prefix = `${this.ctx.props.prefix}:`
    const { keys } = await this.env.SITE_KV.list({ prefix })
    return { keys: keys.map((k) => ({ ...k, name: k.name.slice(prefix.length) })) }
  }
}

export class SessionDB extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`)
  }

  async #touch() {
    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.ctx.storage.setAlarm(Date.now() + SESSION_TTL_SECONDS * 1000)
    }
  }

  async all(sql: string, values: unknown[]) {
    await this.#touch()
    return { results: this.ctx.storage.sql.exec(sql, ...values).toArray() }
  }

  async first(sql: string, values: unknown[]) {
    await this.#touch()
    return this.ctx.storage.sql.exec(sql, ...values).toArray()[0] ?? null
  }

  async run(sql: string, values: unknown[]) {
    await this.#touch()
    this.ctx.storage.sql.exec(sql, ...values)
    return { success: true }
  }

  async alarm() {
    await this.ctx.storage.deleteAll()
  }
}

type SessionDBStub = ReturnType<Env['SESSION_DB']['getByName']>

class StatementFacade extends RpcTarget {
  #db: SessionDBStub
  #sql: string
  #values: unknown[]

  constructor(db: SessionDBStub, sql: string, values: unknown[] = []) {
    super()
    this.#db = db
    this.#sql = sql
    this.#values = values
  }

  bind(...values: unknown[]) {
    return new StatementFacade(this.#db, this.#sql, values)
  }

  all() {
    return this.#db.all(this.#sql, this.#values)
  }

  first() {
    return this.#db.first(this.#sql, this.#values)
  }

  run() {
    return this.#db.run(this.#sql, this.#values)
  }
}

export class D1Facade extends WorkerEntrypoint<Env, SessionProps> {
  prepare(sql: string) {
    return new StatementFacade(this.env.SESSION_DB.getByName(this.ctx.props.sid), sql)
  }
}

// Entrypoints of dynamically-loaded workers cannot be passed into another
// worker's env, so this facade constructs the backend and forwards to it
export class BackendFacade extends WorkerEntrypoint<Env, SessionProps> {
  #backend() {
    const chapter = chapters.find((ch) => ch.name === 'service-bindings')!
    const worker = this.env.LOADER.get(
      `service-bindings-backend@${chapter.hash}@${this.ctx.props.sid}`,
      async () => ({
        compatibilityDate: '2026-07-01',
        mainModule: 'index.js',
        modules: { 'index.js': chapter.backendBundle! },
        env: {},
        globalOutbound: null,
      })
    )
    return worker.getEntrypoint() as unknown as {
      add(a: number, b: number): Promise<number>
      greet(name: string): Promise<string>
    }
  }

  add(a: number, b: number) {
    return this.#backend().add(a, b)
  }

  greet(name: string) {
    return this.#backend().greet(name)
  }
}

const ALLOWED_MODELS = new Set([
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/baai/bge-base-en-v1.5',
])
const MAX_INPUT_CHARS = 500

export class AIFacade extends WorkerEntrypoint<Env> {
  async run(model: string, inputs: Record<string, unknown>) {
    if (!ALLOWED_MODELS.has(model)) {
      throw new Error(`model not allowed in this demo: ${model}`)
    }
    const texts = [inputs.prompt, ...(Array.isArray(inputs.text) ? inputs.text : [])]
    for (const t of texts) {
      if (typeof t === 'string' && t.length > MAX_INPUT_CHARS) {
        throw new Error(`input too long (demo limit: ${MAX_INPUT_CHARS} chars)`)
      }
    }
    // biome-ignore format: the model union is huge
    return this.env.AI.run(model as keyof AiModels, { max_tokens: 256, ...inputs } as never)
  }
}

export class VectorizeFacade extends WorkerEntrypoint<Env, SessionProps> {
  async upsert(vectors: VectorizeVector[]) {
    return this.env.INDEX.upsert(
      vectors.slice(0, 20).map((v) => ({ ...v, namespace: this.ctx.props.sid }))
    )
  }

  async query(values: number[], options?: VectorizeQueryOptions) {
    return this.env.INDEX.query(values, {
      ...options,
      topK: Math.min(options?.topK ?? 3, 10),
      namespace: this.ctx.props.sid,
    })
  }
}

export class R2Facade extends WorkerEntrypoint<Env, Props> {
  #key(key: string) {
    return `${this.ctx.props.prefix}/${key}`
  }

  async list() {
    const prefix = `${this.ctx.props.prefix}/`
    const list = await this.env.SITE_BUCKET.list({ prefix })
    return {
      objects: list.objects.map((o) => ({
        key: o.key.slice(prefix.length),
        size: o.size,
        uploaded: o.uploaded,
      })),
    }
  }

  async get(key: string) {
    const object = await this.env.SITE_BUCKET.get(this.#key(key))
    if (!object) {
      return null
    }
    return { body: object.body, httpEtag: object.httpEtag, httpMetadata: object.httpMetadata }
  }

  async put(key: string, body: ReadableStream | null, options?: R2PutOptions) {
    // Streams lose their known length over RPC, which R2 put requires
    const data = body === null ? null : await new Response(body).arrayBuffer()
    const object = await this.env.SITE_BUCKET.put(this.#key(key), data, options)
    return { key, size: object.size, etag: object.etag }
  }

  async delete(key: string) {
    await this.env.SITE_BUCKET.delete(this.#key(key))
  }
}
