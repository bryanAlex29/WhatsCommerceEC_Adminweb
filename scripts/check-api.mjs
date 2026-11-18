import { checkHealth, getApiBaseUrl } from '../src/lib/api.ts'

// Node >=22.18 admite estos tipos borrables de TypeScript sin un compilador extra.
// No carga .env: indicar VITE_API_URL en el entorno o usar el origen local.
const origin = getApiBaseUrl(process.env.VITE_API_URL)
await checkHealth(origin)
console.log(`OK: contrato de salud verificado contra ${origin}/api/health`)
