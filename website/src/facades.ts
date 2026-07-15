import { RpcTarget, WorkerEntrypoint } from 'cloudflare:workers'

type Props = { prefix: string }

export class KVFacade extends WorkerEntrypoint<Env, Props> {
  #key(key: string) {
    return `${this.ctx.props.prefix}:${key}`
  }

  get(key: string) {
    return this.env.SITE_KV.get(this.#key(key))
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }) {
    await this.env.SITE_KV.put(this.#key(key), value, options)
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

class StatementFacade extends RpcTarget {
  #stmt: D1PreparedStatement

  constructor(stmt: D1PreparedStatement) {
    super()
    this.#stmt = stmt
  }

  bind(...values: unknown[]) {
    return new StatementFacade(this.#stmt.bind(...values))
  }

  all() {
    return this.#stmt.all()
  }

  first() {
    return this.#stmt.first()
  }

  run() {
    return this.#stmt.run()
  }
}

export class D1Facade extends WorkerEntrypoint<Env> {
  prepare(sql: string) {
    return new StatementFacade(this.env.SITE_DB.prepare(sql))
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
