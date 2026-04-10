# Resumen de Migración a Cloudflare Pages Functions

Se ha completado la migración de las APIs de Vercel a Cloudflare Pages Functions (Edge Runtime).

## Cambios Realizados

### 1. Reorganización de Directorio
- Se creó la carpeta `/functions/api`.
- Se movieron todos los archivos de `/api` a `/functions/api` para mantener la compatibilidad con las rutas del frontend (`/api/...`).
- Se eliminó la carpeta `/api` original.

### 2. Adaptación del Código (Edge Safe)
En todos los archivos (`calculate-quote.js`, `get-inventory.js`, `save-lead.js`):
- **Exportaciones**: Se cambió `export default function handler` por `export async function onRequestPost` o `onRequestGet`.
- **APIs Web**: Se sustituyó el uso de `req/res` por el objeto `context.request` y la clase `Response` estándar de la Web Fetch API.
- **Entorno**: Se cambió `process.env` por `context.env`.
- **Fetch**: Se utiliza el `fetch` nativo de Cloudflare (sin necesidad de importar `node-fetch`).
- **Airtable**: Las llamadas se realizan directamente mediante `fetch` a la REST API de Airtable, evitando dependencias de Node.js incompatibles.

### 3. Documentación y Limpieza
- Se creó el archivo [MIGRACION_CLOUDFLARE_ENVS.md](file:///c:/Users/User%20Name/Desktop/COTIZADOR-V12/MIGRACION_CLOUDFLARE_ENVS.md) con las instrucciones para configurar las variables de entorno en el panel de Cloudflare.
- Se actualizó `package.json` para eliminar scripts de Vercel y reflejar el nuevo entorno.
- Se eliminó `vercel.json`.

## Validación
Los archivos han sido adaptados para cumplir con el estándar **Web Fetch API** requerido por el runtime de Cloudflare (V8 Edge). No se detectaron dependencias incompatibles con el entorno Edge (Zod y NanoID v5 son compatibles).

> [!IMPORTANT]
> Recuerda configurar las variables `AIRTABLE_PAT` y `AIRTABLE_BASE_ID` en el panel de Cloudflare Pages antes de desplegar.
