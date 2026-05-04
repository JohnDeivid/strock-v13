import { z } from 'zod';
// v2.0.0 - R2 permanent storage migration (replaces KV with 10min TTL)


const LeadSchema = z.object({
    "Razón Social / Constructora": z.string().min(1),
    "Responsable de Obra": z.string().min(1),
    "Teléfono Móvil": z.string().min(1),
    "Ubicación / Proyecto": z.string().min(1),
    "RNC Cliente": z.string().optional(),
    "Email de Contacto": z.string().optional(),
    "Equipos Cotizados": z.string(),
    "Fecha de Inicio": z.string(),
    "Fecha de Fin": z.string(),
    "Régimen de Turnos": z.string(),
    "Suministro Diésel": z.string(),
    "Zona Logística": z.string(),
    "Modalidad Operador": z.string(),
    "Seguro Incluido": z.boolean(),
    "Subtotal Renta Máquinas": z.number(),
    "Bonificación Volumen": z.number(),
    "Costo Operador": z.number(),
    "Suministro Combustible": z.number(),
    "Flete Logístico": z.number(),
    "Seguro Póliza": z.number(),
    "Viáticos": z.number(),
    "Subtotal Operativo": z.number(),
    "ITBIS": z.number(),
    "Total Presupuesto": z.number(),
    "Estado de Cotización": z.string(),
    "quote_id": z.string().min(1),
    "monto_total": z.number(),
    "pdfBase64": z.string().optional()
});

export async function onRequestPost(context) {
    const AIRTABLE_PAT = context.env.AIRTABLE_PAT;
    const AIRTABLE_BASE_ID = context.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE = 'Leads_Cotizaciones';

    // R2 Bucket for permanent PDF storage (replaces KV with 10min TTL)
    const PDF_BUCKET = context.env.PDF_BUCKET;
    // Legacy KV fallback (kept for backward compatibility during migration)
    const PDF_STORE = context.env.PDF_STORE;

    // CallMeBot Config — credentials from environment variables
    const CALLMEBOT_API_KEY = context.env.CALLMEBOT_API_KEY || "";
    const CALLMEBOT_PHONE = context.env.CALLMEBOT_PHONE || "";

    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
        return new Response(JSON.stringify({ error: "Las credenciales de Airtable no están configuradas en el entorno." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const rawPayload = await context.request.json();
        const { pdfBase64, ...payload } = rawPayload;
        
        // Add mandatory company_id
        payload.company_id = "MAQ-RENT-001";

        // Validate payload
        const validation = LeadSchema.safeParse(rawPayload);
        if (!validation.success) {
            return new Response(JSON.stringify({ 
                error: "Invalid lead data", 
                details: validation.error.format() 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- PDF HANDLING ---
        // Priority: R2 (permanent) → KV (legacy fallback with TTL)
        let pdfLink = "";
        let storageUsed = "none";

        if (pdfBase64) {
            // Remove the data URI prefix if present
            const base64Data = pdfBase64.replace(/^data:application\/pdf;[^,]+,/, "");
            const pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            const url = new URL(context.request.url);
            const host = context.request.headers.get('host') || url.host;
            const protocol = context.request.headers.get('x-forwarded-proto') || (url.protocol.replace(':', ''));

            // STRATEGY 1: Cloudflare R2 (permanent, no TTL, free up to 10GB)
            if (PDF_BUCKET) {
                try {
                    const objectKey = `cotizaciones/${validation.data.quote_id}.pdf`;
                    await PDF_BUCKET.put(objectKey, pdfBuffer, {
                        httpMetadata: {
                            contentType: 'application/pdf',
                            contentDisposition: `inline; filename="cotizacion-${validation.data.quote_id}.pdf"`
                        },
                        customMetadata: {
                            quoteId: validation.data.quote_id,
                            empresa: validation.data["Razón Social / Constructora"],
                            createdAt: new Date().toISOString()
                        }
                    });
                    pdfLink = `${protocol}://${host}/pdf/${validation.data.quote_id}`;
                    storageUsed = "R2";
                } catch (r2Err) {
                    console.error("R2 Storage Error:", r2Err);
                }
            }

            // STRATEGY 2: KV fallback (legacy — only if R2 is not configured)
            if (!pdfLink && PDF_STORE) {
                try {
                    await PDF_STORE.put(validation.data.quote_id, pdfBuffer, {
                        expirationTtl: 86400 // 24 hours (upgraded from 10 min)
                    });
                    pdfLink = `${protocol}://${host}/pdf/${validation.data.quote_id}`;
                    storageUsed = "KV";
                } catch (kvErr) {
                    console.error("KV Storage Error:", kvErr);
                }
            }
        }

        const AirtableBody = {
            records: [
                {
                    fields: {
                        ...validation.data,
                        company_id: payload.company_id,
                        "pdfBase64": undefined // Don't send this to Airtable
                    }
                }
            ]
        };

        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${AIRTABLE_PAT}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(AirtableBody)
        });

        if (!response.ok) {
            const errBody = await response.text();
            return new Response(JSON.stringify({ error: "Error de Airtable", details: errBody }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        const recordId = data.records[0].id;

        // --- WHATSAPP NOTIFICATION (CALLMEBOT) ---
        try {
            // Robust currency formatting: RD$ 1,234.56
            const totalFmt = "RD$ " + validation.data.monto_total.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
            
            let msg = `🚀 *NUEVA COTIZACIÓN VERTEX*\n\n`;
            
            // PDF LINK — now permanent with R2
            if (pdfLink) {
                const storageLabel = storageUsed === "R2" ? "Permanente" : "Temporal 24h";
                msg += `📄 *DESCARGAR PDF (${storageLabel}):*\n${pdfLink}\n\n`;
            } else {
                let reason = "Error desconocido";
                if (!pdfBase64) reason = "El navegador no envió el archivo (Base64 vacío)";
                else if (!PDF_BUCKET && !PDF_STORE) reason = "PDF_BUCKET (R2) no vinculado en Cloudflare";
                else reason = "Fallo al escribir en almacenamiento (Check logs)";
                msg += `⚠️ *PDF NO DISPONIBLE:* \n_${reason}_\n\n`;
            }

            msg += 
                `💰 *TOTAL:* *${totalFmt}*\n` +
                `🆔 *ID:* \`${validation.data.quote_id}\`\n` +
                `👤 *CLIENTE:* ${validation.data["Responsable de Obra"]}\n` +
                `🏢 *EMPRESA:* ${validation.data["Razón Social / Constructora"]}\n\n` +
                `🛠️ *EQUIPOS:* \n${validation.data["Equipos Cotizados"]}\n` +
                `📅 *INICIO:* ${validation.data["Fecha de Inicio"]}\n` +
                `📍 *LUGAR:* ${validation.data["Ubicación / Proyecto"]}\n\n` +
                `🔗 *VER EN AIRTABLE:* \nhttps://airtable.com/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${recordId}`;

            const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${CALLMEBOT_API_KEY}`;
            
            // Background fetch to not slow down the UI response
            context.waitUntil ? context.waitUntil(fetch(waUrl)) : fetch(waUrl);
        } catch (waErr) {
            console.error("WhatsApp Notify Error:", waErr);
        }

        return new Response(JSON.stringify({ success: true, id: recordId, pdfUrl: pdfLink, storage: storageUsed }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error al guardar lead en Airtable:", error);
        return new Response(JSON.stringify({ error: "Fallo al guardar la cotización en Airtable.", details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
