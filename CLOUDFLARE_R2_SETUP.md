# 🗄️ Cloudflare R2 Setup — Almacenamiento Permanente de PDFs

## ¿Por qué R2?

El sistema anterior usaba **Cloudflare KV con TTL de 10 minutos**, lo que causaba que los links
de PDF enviados por WhatsApp dejaran de funcionar antes de que el cliente pudiera abrirlos.

**R2** es almacenamiento de objetos permanente (sin TTL), gratis hasta 10GB/mes.

---

## Paso 1: Crear el R2 Bucket

```bash
# Desde la CLI de Cloudflare (wrangler)
npx wrangler r2 bucket create pdf-cotizaciones
```

O desde el Dashboard de Cloudflare:
1. Ve a **R2** en el menú lateral
2. Click **Create Bucket**
3. Nombre: `pdf-cotizaciones`
4. Región: Auto (o la más cercana a tus clientes)

## Paso 2: Vincular el Bucket a tu Pages Project

En tu `wrangler.toml` (o en el Dashboard de Cloudflare Pages):

### Opción A: Dashboard (recomendado)
1. Ve a **Pages** → Tu proyecto → **Settings** → **Functions**
2. En **R2 bucket bindings**, agrega:
   - Variable name: `PDF_BUCKET`
   - R2 bucket: `pdf-cotizaciones`
3. **Save and Deploy**

### Opción B: wrangler.toml
```toml
[[r2_buckets]]
binding = "PDF_BUCKET"
bucket_name = "pdf-cotizaciones"
```

## Paso 3: Verificar

Después del deploy, las cotizaciones aprobadas almacenarán PDFs permanentemente en R2.
El link de WhatsApp funcionará para siempre.

---

## Estructura de archivos en R2

```
pdf-cotizaciones/
├── cotizaciones/
│   ├── QT-ABC123.pdf
│   ├── QT-DEF456.pdf
│   └── ...
```

Cada PDF incluye metadata:
- `quoteId`: ID de la cotización
- `empresa`: Nombre de la constructora
- `createdAt`: Fecha de creación

## Compatibilidad

El código soporta **ambos** backends simultáneamente:
- **R2 configurado**: Usa R2 (permanente). ✅ Recomendado.
- **Solo KV**: Usa KV con TTL de 24 horas (fallback legacy).
- **Ninguno**: El PDF se genera localmente pero no se almacena en la nube.

> **Nota**: El binding `PDF_STORE` (KV) puede mantenerse como fallback durante la migración.
> Una vez que R2 esté configurado y verificado, puedes eliminar el KV binding.
