import assert from 'node:assert/strict'
import { createRequire, registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'
import { checkHealth } from '../src/lib/api.ts'

// Verificacion opcional del workspace. No es dependencia de ejecucion de AdminWeb.
const backendDir = process.env.BACKEND_DIR || fileURLToPath(new URL('../../WhatsCommerceEC_Backend/', import.meta.url))
const backendRequire = createRequire(path.join(backendDir, 'package.json'))
const webOrigin = 'http://localhost:5173'
process.env.NODE_ENV = 'test'
process.env.CORS_ORIGINS = webOrigin

await import(pathToFileURL(backendRequire.resolve('reflect-metadata')).href)
const { NestFactory } = await import(pathToFileURL(backendRequire.resolve('@nestjs/core')).href)
const { AppModule } = await import(pathToFileURL(path.join(backendDir, 'dist/app.module.js')).href)
const { configureApp } = await import(pathToFileURL(path.join(backendDir, 'dist/configure-app.js')).href)

let app
let server
let browser
try {
  app = await NestFactory.create(AppModule, { abortOnError: false, logger: false })
  configureApp(app)
  await app.listen(0, '127.0.0.1')
  const apiOrigin = await app.getUrl()
  await checkHealth(apiOrigin)
  if (process.argv.includes('--mobile')) {
    const mobileDir = process.env.MOBILE_DIR || fileURLToPath(new URL('../../WhatsCommerceEC_Frontend/', import.meta.url))
    const mobileHealthUrl = pathToFileURL(path.join(mobileDir, 'src/api/health.ts')).href
    // Solo resuelve esta importacion sin extension del cliente puro TypeScript.
    // No transforma React Native ni pretende ejecutar la app nativa bajo Node.
    const hooks = registerHooks({
      resolve(specifier, context, nextResolve) {
        if (context.parentURL === mobileHealthUrl && specifier === '../config/env') {
          return nextResolve(new URL('../config/env.ts', context.parentURL).href, context)
        }
        return nextResolve(specifier, context)
      },
    })
    try {
      process.env.EXPO_PUBLIC_API_URL = apiOrigin
      const { checkHealth: checkMobileHealth } = await import(mobileHealthUrl)
      assert.deepEqual(await checkMobileHealth(), { status: 'ok', service: 'whatscommerceec-backend' })
      console.log('OK: cliente TypeScript del movil consulta NestJS real bajo Node, sin mocks; no ejecuta UI nativa.')
    } finally {
      hooks.deregister()
    }
  }
  const allowed = await fetch(`${apiOrigin}/api/health`, { headers: { Origin: webOrigin } })
  assert.equal(allowed.headers.get('access-control-allow-origin'), webOrigin)
  const denied = await fetch(`${apiOrigin}/api/health`, { headers: { Origin: 'https://not-authorized.invalid' } })
  assert.equal(denied.headers.get('access-control-allow-origin'), null)
  console.log('OK: cliente AdminWeb y CORS permitido/no permitido contra NestJS real.')

  server = await createServer({
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify(apiOrigin) },
    server: { host: 'localhost', port: 5173, strictPort: true },
  })
  await server.listen()
  const executablePath = process.env.BROWSER_EXECUTABLE_PATH || (
    process.platform === 'win32'
      ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
      : undefined
  )
  if (!executablePath) throw new Error('Configurar BROWSER_EXECUTABLE_PATH para la prueba integrada.')
  browser = await chromium.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  await page.goto(webOrigin)
  await page.getByRole('button', { name: 'Comprobar conexión' }).click()
  await page.getByRole('status').filter({ hasText: 'El servidor responde correctamente' }).waitFor()
  console.log('OK: React/shadcn en Edge consulta NestJS por HTTP real, sin interceptar la API.')
} finally {
  if (browser) await browser.close()
  if (server) await server.close()
  if (app) await app.close()
}
