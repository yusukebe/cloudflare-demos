import puppeteer from '@cloudflare/puppeteer'
import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/screenshot', async (c) => {
  const url = c.req.query('url') ?? 'https://example.com'
  const browser = await puppeteer.launch(c.env.BROWSER)
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0' })
    const screenshot = await page.screenshot()
    return c.body(new Uint8Array(screenshot), 200, { 'content-type': 'image/png' })
  } finally {
    await browser.close()
  }
})

export default app
