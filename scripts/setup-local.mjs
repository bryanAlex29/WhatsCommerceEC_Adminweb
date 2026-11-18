import { constants, copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Copia solo configuracion publica de desarrollo; no reemplaza un entorno existente. */
export function setupLocal(directory) {
  const target = path.join(directory, '.env')
  if (existsSync(target)) return { created: false }
  try {
    copyFileSync(path.join(directory, '.env.example'), target, constants.COPYFILE_EXCL)
    return { created: true }
  } catch (error) {
    // COPYFILE_EXCL protege tambien una creacion concurrente o un enlace existente.
    if (error?.code === 'EEXIST') return { created: false }
    throw new Error('No se pudo crear el entorno local. Revisa el ejemplo y los permisos.')
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { created } = setupLocal(fileURLToPath(new URL('../', import.meta.url)))
    console.log(created ? 'Entorno publico local creado en .env (ignorado por Git).' : '.env ya existe; se conserva sin cambios.')
  } catch {
    console.error('No se pudo preparar .env. Revisa .env.example y los permisos; no se modifico un entorno existente.')
    process.exitCode = 1
  }
}
