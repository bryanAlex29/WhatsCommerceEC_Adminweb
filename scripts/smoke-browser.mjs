import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'

// Usa un navegador ya instalado. No descarga navegadores ni contacta clientes reales.
const executablePath = process.env.BROWSER_EXECUTABLE_PATH || (
  process.platform === 'win32'
    ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    : undefined
)
if (!executablePath) throw new Error('Configurar BROWSER_EXECUTABLE_PATH con un navegador Chromium instalado.')

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
let browser
try {
  await server.listen()
  const address = server.httpServer.address()
  assert(address && typeof address === 'object')
  const origin = `http://127.0.0.1:${address.port}`
  browser = await chromium.launch({ executablePath, headless: true })

  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    let requests = 0
    let healthy = true
    await page.route('**/api/health', async (route) => {
      requests += 1
      await route.fulfill({
        status: healthy ? 200 : 503,
        contentType: 'application/json',
        body: JSON.stringify(healthy ? { status: 'ok', service: 'whatscommerceec-backend' } : { error: 'test' }),
      })
    })

    await page.goto(origin)
    await page.getByRole('heading', { level: 1 }).waitFor()
    assert.equal(requests, 0, 'No debe comprobar la API automaticamente')
    const logo = page.getByRole('img', { name: /WhatsCommerce EC/ })
    await logo.waitFor()
    assert(await logo.evaluate((image) => image.complete && image.naturalWidth > 0), 'Logo no cargado')
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Desbordamiento horizontal')

    await page.keyboard.press('Tab')
    const button = page.getByRole('button', { name: 'Comprobar conexión' })
    assert(await button.evaluate((element) => element === document.activeElement), 'Boton no accesible con Tab')
    await page.keyboard.press('Enter')
    await page.getByRole('status').filter({ hasText: 'El servidor responde correctamente' }).waitFor()
    assert.equal(requests, 1)

    healthy = false
    await button.click()
    await page.getByRole('status').filter({ hasText: 'No se pudo verificar el servidor' }).waitFor()
    assert.equal(requests, 2)
    assert.deepEqual(pageErrors, [], 'Errores JavaScript en navegador')
    await page.close()
    console.log(`OK: Chromium ${width}px, marca, teclado, sin desbordamiento y estados API simulados.`)
  }
} finally {
  if (browser) await browser.close()
  await server.close()
}
