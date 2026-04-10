import { z } from 'zod';
import { nanoid } from 'nanoid';

const ItemSchema = z.object({
    id: z.string(),
    nombre: z.string(),
    categoria: z.string(),
    qty: z.number().min(1),
    fInicio: z.string(),
    fFin: z.string(),
    precioHora: z.number(),
    pesado: z.boolean().optional()
});

const RequestSchema = z.object({
    items: z.array(ItemSchema),
    config: z.object({
        zona: z.string(),
        operador: z.string(),
        turnos: z.number(),
        combustible: z.string(),
        seguro: z.boolean(),
        domingos: z.boolean()
    })
});

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const validation = RequestSchema.safeParse(body);

        if (!validation.success) {
            return new Response(JSON.stringify({ error: "Invalid request data", details: validation.error.format() }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { items, config } = validation.data;
        const AIRTABLE_PAT = context.env.AIRTABLE_PAT;
        const AIRTABLE_BASE_ID = context.env.AIRTABLE_BASE_ID;
        const AIRTABLE_TABLE = 'Maquinaria';

        // Fetch each item from Airtable to verify prices (Centralized Pricing)
        // Optimization: In a real scenario, we would use a single query with filters, 
        // but for simplicity and to follow instructions of "consultar precios base desde Airtable",
        // we will fetch the relevant records.

        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` }
        });

        if (!response.ok) throw new Error("Airtable fetch failed");
        const airtableData = await response.json();
        const dbItems = airtableData.records.reduce((acc, rec) => {
            acc[rec.id] = rec.fields;
            return acc;
        }, {});

        const VIATICO_DIARIO = 45;
        const PRECIO_OPERADOR_8H = 60;
        const FLETE_PRICES = { urbana: 150, periferia: 300, foranea: 500 };

        let subtotalMaquinasPuro = 0;
        let costoOperadorTotal = 0;
        let viaticosTotal = 0;
        let totalHorasProyecto = 0;
        let maxDiasItem = 0;
        let heavyCount = 0;

        const results = items.map(item => {
            const dbItem = dbItems[item.id] || { PrecioHora: item.precioHora, Pesado: item.pesado };
            const precioHora = dbItem.PrecioHora || 0;
            const isPesado = dbItem.Pesado || false;

            const dias = getDiasLaborables(item.fInicio, item.fFin, config.domingos);
            if (dias > maxDiasItem) maxDiasItem = dias;

            const horasTotales = dias * config.turnos;
            totalHorasProyecto += (horasTotales * item.qty);
            subtotalMaquinasPuro += (precioHora * item.qty * horasTotales);

            if (item.categoria !== 'Accesorios' && config.operador === 'si') {
                const turnosOperador = config.turnos / 8;
                costoOperadorTotal += (PRECIO_OPERADOR_8H * turnosOperador) * item.qty * dias;
                if (config.zona === 'foranea') viaticosTotal += (VIATICO_DIARIO * dias * item.qty);
            }

            if (isPesado) heavyCount += item.qty;

            return {
                id: item.id,
                nombre: item.nombre,
                dias,
                horasTotales,
                subtotal: precioHora * item.qty * horasTotales
            };
        });

        // Discounts
        let descuentoPct = 0;
        if (maxDiasItem >= 30) descuentoPct = 0.30;
        else if (maxDiasItem >= 7) descuentoPct = 0.15;

        const descuentoValor = subtotalMaquinasPuro * descuentoPct;
        const subtotalConDescuento = subtotalMaquinasPuro - descuentoValor;

        // Fuel
        const combustibleCost = config.combustible === 'wet' ? subtotalConDescuento * 0.35 : 0;

        // Freight
        const fleteBase = FLETE_PRICES[config.zona] || 0;
        const fleteTotal = heavyCount > 0 ? fleteBase * heavyCount : fleteBase;

        // Insurance
        const seguroCost = config.seguro ? subtotalConDescuento * 0.08 : 0;

        // ITBIS and Totals
        const subtotalOperativo = subtotalConDescuento + costoOperadorTotal + combustibleCost + fleteTotal + seguroCost + viaticosTotal;
        const itbis = subtotalOperativo * 0.18;
        const total = subtotalOperativo + itbis;

        const quote_id = `QT-${nanoid(6).toUpperCase()}`;

        return new Response(JSON.stringify({
            quote_id,
            breakdown: {
                subtotalMaquinasPuro,
                descuentoValor,
                descuentoPct,
                costoOperador: costoOperadorTotal,
                viaticos: viaticosTotal,
                combustible: combustibleCost,
                flete: fleteTotal,
                seguro: seguroCost,
                subtotalOperativo,
                itbis,
                total
            },
            summary: {
                totalHorasProyecto,
                maxDiasItem,
                heavyCount
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Calculation Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function getDiasLaborables(startStr, endStr, laboraDomingos) {
    const startDate = new Date(startStr + 'T12:00:00');
    const endDate = new Date(endStr + 'T12:00:00');
    if (endDate < startDate) return 0;

    let count = 0;
    let curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
        if (laboraDomingos || curDate.getDay() !== 0) count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}
