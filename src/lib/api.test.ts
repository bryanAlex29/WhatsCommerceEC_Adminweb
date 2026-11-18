import { describe, expect, it, vi } from 'vitest'
import { checkHealth, getApiBaseUrl } from './api'

describe('configuración pública', () => {
  it('usa servidor local por defecto y normaliza barra final', () => {
    expect(getApiBaseUrl(undefined)).toBe('http://localhost:3000')
    expect(getApiBaseUrl(' https://example.test/ ')).toBe('https://example.test')
  })

  it.each(['file:///tmp/api', 'https://user:pass@example.test', 'https://example.test/api', 'https://example.test/?token=example', 'invalid'])('rechaza URL no válida: %s', (url) => {
    expect(() => getApiBaseUrl(url)).toThrow()
  })
})

describe('contrato técnico de salud (fetch simulado)', () => {
  it('valida identidad del backend y no envía credenciales', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: 'ok', service: 'whatscommerceec-backend' }))
    await expect(checkHealth('http://localhost:3000', fetcher)).resolves.toEqual({ status: 'ok', service: 'whatscommerceec-backend' })
    expect(fetcher).toHaveBeenCalledWith('http://localhost:3000/api/health', expect.objectContaining({ credentials: 'omit', cache: 'no-store' }))
  })

  it('rechaza errores HTTP', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }))
    await expect(checkHealth('http://localhost:3000', fetcher)).rejects.toThrow()
  })

  it.each([{ status: 'ok' }, { status: 'error', service: 'whatscommerceec-backend' }, null])('rechaza contrato inválido: %j', async (payload) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(payload))
    await expect(checkHealth('http://localhost:3000', fetcher)).rejects.toThrow()
  })

  it('aborta una solicitud que no responde en cinco segundos', async () => {
    vi.useFakeTimers()
    try {
      const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('timeout')), { once: true })
      }))
      const pending = expect(checkHealth('http://localhost:3000', fetcher)).rejects.toThrow('timeout')
      await vi.advanceTimersByTimeAsync(5_000)
      await pending
    } finally {
      vi.useRealTimers()
    }
  })
})
