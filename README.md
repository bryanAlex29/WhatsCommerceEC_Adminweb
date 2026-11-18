# WhatsCommerce EC — AdminWeb

Base técnica del panel React. **No contiene todavía administración de empresas, autenticación ni datos reales.** La existencia de esta base no resuelve los permisos pendientes del administrador de plataforma.

## Tecnologías

- React + TypeScript estricto y Vite (versiones resueltas en `package-lock.json`).
- Tailwind CSS v4 y componentes oficiales shadcn/ui, preset Nova sobre Base UI.
- Vitest, Testing Library y jsdom para pruebas automatizadas.
- Node 22.18.0 y npm 10.9.3 usados en la preparación.

## Ejecutar

```powershell
npm ci
npm run setup:local
npm run dev
```

Abrir `http://localhost:5173`. El puerto es estricto para coincidir con el origen de desarrollo autorizado por el backend. Iniciar backend por separado en `http://localhost:3000`.

`VITE_API_URL` es un **origen público** HTTP(S), sin `/api`, credenciales, query o fragmento. Su valor se incluye en el bundle; nunca introducir secretos. Cambiarlo requiere reiniciar Vite o reconstruir el bundle. `.env` no se versiona. HTTPS corresponde al entorno productivo que se apruebe; HTTP local solo es para desarrollo.

`setup:local` copia el ejemplo solo si `.env` no existe y conserva sin cambios cualquier archivo existente. No agrega credenciales ni configura servicios externos. Su comportamiento se comprueba con `npm run test:setup` (archivos temporales ficticios).

El botón «Comprobar conexión» consulta `GET /api/health` y acepta exclusivamente `{ "status": "ok", "service": "whatscommerceec-backend" }`. Tiene timeout de cinco segundos. Es **liveness del servidor**, no comprobación de PostgreSQL/Redis ni prueba de autenticación. No hay solicitudes automáticas al abrir la página.

## Comprobaciones

```powershell
npm run typecheck
npm run lint
npm test
npm run test:setup
npm run smoke
npm run build
npm run preview
```

Las pruebas unitarias usan fetch/API simulados y no sustituyen una comprobación real contra el backend. `smoke` inicia Vite en un puerto libre, comprueba por HTTP HTML, módulo React, CSS y logo, y lo cierra; no sustituye una prueba visual en navegador. `preview` sirve el build local, no es un despliegue productivo.

Con el backend iniciado se puede comprobar el cliente real sin navegador mediante `npm run check:api`. Este script usa Node >=22.18 y no carga `.env`; utiliza `http://localhost:3000` o la variable de proceso `VITE_API_URL`. Verifica el contrato por HTTP, no aplica políticas CORS de un navegador ni prueba autorización empresarial.

`npm run smoke:browser` usa `playwright-core` con un navegador Chromium **ya instalado**, sin descargar otro navegador. En Windows usa Microsoft Edge de `Program Files (x86)` por defecto; en otras ubicaciones/sistemas indicar `BROWSER_EXECUTABLE_PATH`. Comprueba a 1280px y 390px que carguen marca y componentes, no haya desbordamiento horizontal, funcione Tab/Enter y se muestren éxito/error con API interceptada. No equivale a integración real ni a una auditoría completa de accesibilidad. Cierra navegador y servidor al terminar.

`npm run integration:api` es una prueba opcional del workspace: requiere backend instalado y compilado en `../WhatsCommerceEC_Backend` (o ruta absoluta `BACKEND_DIR`), Edge/Chromium instalado y puerto 5173 libre. Inicia NestJS real en puerto local libre y Vite en 5173, verifica el cliente y CORS, pulsa el botón desde el navegador **sin interceptar la API** y cierra los recursos. Solo usa health, no conecta PostgreSQL/Redis ni crea datos. No convierte al backend hermano en dependencia de ejecución o build de AdminWeb; esta prueba no funciona en un clon aislado sin preparar su checkout backend.

`npm run integration:workspace` añade la comprobación del cliente TypeScript puro del móvil contra el mismo NestJS. Requiere `../WhatsCommerceEC_Frontend` (o ruta absoluta `MOBILE_DIR`). Node resuelve únicamente su importación local sin extensión mediante un hook temporal; no instala loaders ni modifica Metro. Esta comprobación **no ejecuta React Native ni verifica Android/iOS**, y no reemplaza las pruebas en dispositivos.

## Estructura

```text
src/
  assets/whatscommerce-logo.png
  components/ui/              # Código incorporado desde shadcn/ui
  lib/api.ts                  # Contrato técnico y timeout
  lib/utils.ts
  test/setup.ts
  App.tsx                     # Pantalla técnica inicial
  index.css                   # Tokens corporativos
```

La paleta se centraliza en `index.css`: `#059669`, `#064E3B`, `#0F172A`, `#F8FAFC`, `#F59E0B`. El logo es copia intacta del original entregado; no se ha convertido en favicon ni recortado. El tema inicial es claro; no se ha aprobado tema oscuro ni nuevos colores semánticos. Los componentes Button/Card fueron añadidos con la CLI oficial y el hover del botón se adaptó a la marca y legibilidad. Button solo exporta el componente para mantener Fast Refresh sin advertencias. Antes de actualizar componentes, revisar el diff para conservar personalizaciones. `components.json` conserva la configuración del generador.

La CLI se ejecuta de forma puntual con `npx shadcn@4.23.0`, no se mantiene como dependencia de la aplicación. Button/Card no requieren las utilidades CSS adicionales de `shadcn/tailwind.css`, por lo que ese import no se incluye; al añadir otros componentes hay que revisar sus requisitos. Así se evita retener dependencias de tooling innecesarias y sus avisos de seguridad. No ejecutar `npm audit fix --force` sin evaluar cambios incompatibles.

## Límites y siguiente paso

El propietario aprobó posteriormente gestionar el registro y las invitaciones de empresas desde AdminWeb, con aceptación en el móvil, como siguiente incremento de la Subfase 1.5. Esta base todavía no implementa esas pantallas. La política de sesión web y el diseño detallado requieren confirmación; se conservan los permisos y contratos del DERCAS vigente. No crear pantallas con acceso comercial global ni representar datos ficticios como producción. Las instrucciones completas están en la raíz de contexto coordinada, no son dependencias de ejecución.

Publicación inicial autorizada en `feature/estructura-inicial`. El remoto estaba vacío: se prepara un commit base vacío desde esa rama de trabajo y se referencia como `develop`; el bootstrap se añade después en la rama de trabajo para su revisión por PR. No se hacen commits directamente sobre main/develop ni merges automáticos. La publicación no es un despliegue.
