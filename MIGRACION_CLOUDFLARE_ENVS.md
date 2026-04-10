# Configuración de Variables de Entorno en Cloudflare Pages

Para que las funciones migradas operen correctamente, debes configurar las siguientes variables de entorno en tu panel de Cloudflare.

## Variables Detectadas
1.  **AIRTABLE_PAT**: Tu Personal Access Token de Airtable.
2.  **AIRTABLE_BASE_ID**: El ID de la base de Airtable (ej. `app82B2FCW3qyq8MN`).

## Pasos para la Configuración

1.  Inicia sesión en el **Cloudflare Dashboard**.
2.  Ve a **Workers & Pages**.
3.  Selecciona tu proyecto de **Pages**.
4.  Haz clic en la pestaña **Settings** (Configuración).
5.  En el menú lateral izquierdo, selecciona **Functions** o **Variables**.
6.  Busca la sección **Environment variables** y haz clic en **Add variables** (o **Edit variables**).
7.  Añade cada de una de las variables mencionadas arriba:
    *   **Production**: Añade los valores reales para tu entorno de producción.
    *   **Preview**: (Opcional) Añade valores para tus entornos de prueba o usa los mismos.
8.  **IMPORTANTE**: Haz clic en **Save** al terminar.
9.  Deberás realizar un nuevo despliegue (Redeploy) para que los cambios surtan efecto.

---
*Nota: Estas variables ahora se acceden a través de `context.env` en lugar de `process.env`.*
