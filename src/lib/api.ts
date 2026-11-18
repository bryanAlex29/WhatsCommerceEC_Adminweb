export type HealthResponse = {
  status: 'ok'
  service: 'whatscommerceec-backend'
}

/** URL pública del servidor, sin secretos ni rutas de negocio. */
export function getApiBaseUrl(value: string | undefined): string {
  const url = new URL(value?.trim() || 'http://localhost:3000')
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username || url.password || url.search || url.hash || url.pathname !== '/'
  ) {
    throw new Error('VITE_API_URL debe ser un origen HTTP(S) sin credenciales ni ruta.')
  }
  return url.origin
}

export async function checkHealth(
  baseUrl = getApiBaseUrl(import.meta.env.VITE_API_URL),
  fetcher: typeof fetch = fetch,
): Promise<HealthResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  try {
    const response = await fetcher(`${getApiBaseUrl(baseUrl)}/api/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'omit',
    })
    if (!response.ok) throw new Error('El servidor no respondió correctamente.')
    const data: unknown = await response.json()
    if (
      typeof data !== 'object' || data === null ||
      !('status' in data) || data.status !== 'ok' ||
      !('service' in data) || data.service !== 'whatscommerceec-backend'
    ) {
      throw new Error('La respuesta del servidor no corresponde al contrato de salud.')
    }
    return { status: data.status, service: data.service }
  } finally {
    clearTimeout(timeout)
  }
}
