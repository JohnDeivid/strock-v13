export async function onRequestGet(context) {
    const { params, env } = context;
    const id = params.id;

    if (!id) {
        return new Response("ID no proporcionado", { status: 400 });
    }

    // STRATEGY 1: Try R2 first (permanent storage)
    if (env.PDF_BUCKET) {
        try {
            const objectKey = `cotizaciones/${id}.pdf`;
            const object = await env.PDF_BUCKET.get(objectKey);

            if (object) {
                const headers = new Headers();
                headers.set('Content-Type', 'application/pdf');
                headers.set('Content-Disposition', `inline; filename="cotizacion-${id}.pdf"`);
                headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache (permanent file)

                // Forward any R2 httpMetadata
                object.writeHttpMetadata(headers);

                return new Response(object.body, { headers });
            }
        } catch (r2Err) {
            console.error("R2 Read Error:", r2Err);
        }
    }

    // STRATEGY 2: Fallback to KV (legacy)
    if (env.PDF_STORE) {
        const pdfData = await env.PDF_STORE.get(id, { type: 'arrayBuffer' });

        if (pdfData) {
            return new Response(pdfData, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="cotizacion-${id}.pdf"`
                }
            });
        }
    }

    return new Response(
        "Archivo no encontrado. Es posible que el ID sea incorrecto o que el documento aún no haya sido generado.", 
        { status: 404 }
    );
}
