export async function onRequestGet(context) {
    const AIRTABLE_PAT = context.env.AIRTABLE_PAT;
    const AIRTABLE_BASE_ID = context.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE = 'Maquinaria';

    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
        return new Response(JSON.stringify({ error: "Las credenciales de Airtable no están configuradas en el entorno." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`, {
            headers: { 
                'Authorization': `Bearer ${AIRTABLE_PAT}` 
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable devolvió un error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error al consultar Airtable:", error);
        return new Response(JSON.stringify({ error: "Fallo al obtener el inventario desde Airtable." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
