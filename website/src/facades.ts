import { DurableObject, RpcTarget, WorkerEntrypoint } from 'cloudflare:workers'

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
