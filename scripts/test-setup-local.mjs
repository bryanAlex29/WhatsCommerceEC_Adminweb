import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { setupLocal } from './setup-local.mjs'

function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'whatscommerce-web-env-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

test('crea el entorno desde el ejemplo publico', (t) => {
  const dir = fixture(t)
  writeFileSync(path.join(dir, '.env.example'), 'VITE_API_URL=http://localhost:3000\n')
  assert.deepEqual(setupLocal(dir), { created: true })
  assert.equal(readFileSync(path.join(dir, '.env'), 'utf8'), 'VITE_API_URL=http://localhost:3000\n')
})

test('no sobrescribe configuracion existente al repetir', (t) => {
  const dir = fixture(t)
  writeFileSync(path.join(dir, '.env'), 'VITE_API_URL=http://localhost:3099\n')
  writeFileSync(path.join(dir, '.env.example'), 'VITE_API_URL=http://localhost:3000\n')
  const original = readFileSync(path.join(dir, '.env'))
  assert.deepEqual(setupLocal(dir), { created: false })
  assert.deepEqual(readFileSync(path.join(dir, '.env')), original)
})

test('preserva .env existente aunque no haya ejemplo', (t) => {
  const dir = fixture(t)
  writeFileSync(path.join(dir, '.env'), 'VITE_API_URL=http://localhost:3099\n')
  assert.deepEqual(setupLocal(dir), { created: false })
})

test('falla de forma explicita si no hay ejemplo ni entorno', (t) => {
  assert.throws(() => setupLocal(fixture(t)), /No se pudo crear el entorno local/)
})
