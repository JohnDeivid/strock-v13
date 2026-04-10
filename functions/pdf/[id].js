export async function onRequestGet(context) {
    const { params, env } = context;
    const id = params.id;

    if (!id) {
        return new Response("ID no proporcionado", { status: 400 });
    }

    const pdfData = await env.PDF_STORE.get(id, { type: 'arrayBuffer' });

    if (!pdfData) {
        return new Response("Archivo no encontrado o ha expirado (10 min límite)", { status: 404 });
    }

    return new Response(pdfData, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="cotizacion-${id}.pdf"`
        }
    });
}
