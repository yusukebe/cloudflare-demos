import { WorkerEntrypoint } from 'cloudflare:workers'

export default class Backend extends WorkerEntrypoint {
  add(a: number, b: number): number {
    return a + b
  }

  greet(name: string): string {
    return `Hello, ${name}!`
  }
}
