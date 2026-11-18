import assert from 'node:assert/strict'
import { createServer } from 'vite'

// Prueba HTTP real del servidor de desarrollo, no sustituye pruebas en navegador.
const server = await createServer({
  server: { host: '127.0.0.1', port: 0 },
})

try {
  await server.listen()
  const address = server.httpServer.address()
  assert(address && typeof address === 'object')
  const origin = `http://127.0.0.1:${address.port}`
  const htmlResponse = await fetch(origin)
  assert.equal(htmlResponse.status, 200)
  const html = await htmlResponse.text()
  assert.match(html, /<html lang="es">/)
  assert.match(html, /\/src\/main.tsx/)

  for (const path of ['/src/App.tsx', '/src/index.css', '/src/assets/whatscommerce-logo.png']) {
    const response = await fetch(`${origin}${path}`)
    assert.equal(response.status, 200, `No se pudo servir ${path}`)
  }
  console.log('OK: Vite sirve HTML español, módulo React, CSS y logo por HTTP.')
} finally {
  await server.close()
}
