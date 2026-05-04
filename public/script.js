tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'], },
      colors: {
        app: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          surface2: 'rgb(var(--color-surface2) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          neon: '#ea580c',
          neonHover: '#c2410c',
          textMain: 'rgb(var(--color-textMain) / <alpha-value>)',
          textMuted: 'rgb(var(--color-textMuted) / <alpha-value>)',
          black: 'rgb(var(--color-black) / <alpha-value>)',
          white: 'rgb(var(--color-white) / <alpha-value>)'
        }
      }
    }
  }
}
// =========================================================================
// 1. ESTADO GLOBAL Y VARIABLES
// =========================================================================
lucide.createIcons();
const htmlEl = document.documentElement;
const btnTheme = document.getElementById('btn-theme');
const iconTheme = document.getElementById('icon-theme');
let isDark = false;

// Estructura base del inventario
let productosDB = {
  'Equipo Pesado': { icon: 'crane', alerta: 'Requiere logística en Lowboy. Las tarifas base mostradas son por hora trabajada (Horómetro).', items: [] },
  'Equipo Ligero': { icon: 'tractor', alerta: 'Transportables en plataforma estándar o grúa chica. Tarifas por hora de trabajo.', items: [] },
  'Accesorios': { icon: 'drill', alerta: 'Verifique compatibilidad con máquina portadora. Tarifas por hora de uso.', items: [] }
};

let carrito = [];
let desglose = { subtotalMaquinasPuro: 0, descuentoValor: 0, costoOperador: 0, flete: 0, seguro: 0, combustible: 0, viaticos: 0, subtotalOperativo: 0, itbis: 0, total: 0, maxDias: 1, maxHoras: 8 };

// =========================================================================
// 2. CONFIGURACIÓN AIRTABLE
// =========================================================================
// Las credenciales están securizadas en el backend a través de Vercel Serverless Functions.

// =========================================================================
// 3. FUNCIONES DE CONEXIÓN (API FETCH) con Reintentos
// =========================================================================
async function cargarInventarioAirtable(retries = 3) {
  try {
    const response = await fetch(`/api/get-inventory`);

    if (!response.ok) {
      if (retries > 0) {
        console.warn(`Fallo en carga, reintentando... (${retries} restantes)`);
        return setTimeout(() => cargarInventarioAirtable(retries - 1), 1000);
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // Verificar si el contenido es JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("La respuesta del servidor no es JSON (Check Vercel Rewrites)");
    }

    const data = await response.json();

    if (!data.records) throw new Error("Formato de datos de Airtable inválido");

    data.records.forEach(record => {
      const f = record.fields;
      const cat = f.Categoria;

      if (productosDB[cat]) {
        let linkFoto = 'https://via.placeholder.com/300x300?text=No+Image';
        if (f.Imagen && f.Imagen.length > 0) { linkFoto = f.Imagen[0].url; }
        else if (f.ImagenURL) { linkFoto = f.ImagenURL; }

        productosDB[cat].items.push({
          id: record.id,
          nombre: f.Nombre || 'Sin nombre',
          modelo: f.Modelo || 'N/A',
          descripcion: f.Descripción || 'Sin descripción',
          imagen: linkFoto,
          precioHora: f.PrecioHora || 0,
          pesado: f.Pesado || false,
          stock: f.Stock || 0,
          portadorValido: f.PortadorValido || false,
          requierePortador: f.RequierePortador || false,
           esMartillo: f.EsMartillo || false
        });
      }
    });

    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 500);
    }

  } catch (error) {
    console.error("Airtable Error:", error);
    if (retries > 0) {
        return setTimeout(() => cargarInventarioAirtable(retries - 1), 1500);
    }
    const spinner = document.querySelector('.spinner');
    if (spinner) spinner.style.display = 'none';
    const errorEl = document.getElementById('loading-error');
    if (errorEl) {
      errorEl.classList.remove('hidden');
      errorEl.innerText = `Error: ${error.message}. Intenta recargar la página.`;
    }
  }
}

// =========================================================================
// 4. LÓGICA DE UI Y EVENTOS (Modales, Fechas, Temas)
// =========================================================================
btnTheme.addEventListener('click', () => {
  isDark = !isDark;
  if (isDark) {
    htmlEl.classList.add('dark');
    iconTheme.setAttribute('data-lucide', 'sun');
  } else {
    htmlEl.classList.remove('dark');
    iconTheme.setAttribute('data-lucide', 'moon');
  }
  lucide.createIcons();
});

function abrirModal(categoria) {
  document.body.style.overflow = 'hidden';
  const data = productosDB[categoria];
  document.getElementById('modal-titulo').innerHTML = `<i data-lucide="${data.icon}" class="w-4 h-4 text-app-neon"></i> ${categoria}`;
  document.getElementById('modal-alerta').innerText = data.alerta;
  document.getElementById('modal-search').value = '';

  const grid = document.getElementById('modal-grid');
  grid.innerHTML = '<div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="modal-items-container"></div>';
  const container = grid.querySelector('div');

  data.items.forEach(prod => {
    container.innerHTML += `
      <div class="modal-item bg-app-surface2 border border-app-border rounded-sm p-3 flex gap-3 hover:border-app-neon transition-colors group" data-name="${prod.nombre.toLowerCase()} ${prod.modelo.toLowerCase()}">
        <div class="w-20 h-20 bg-app-black rounded-sm flex-shrink-0 overflow-hidden border border-app-border">
           <img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-100 group-hover:opacity-100" onload="this.classList.add('img-loaded')" />
        </div>
        <div class="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h4 class="font-black text-app-white text-xs md:text-sm leading-tight uppercase">${prod.nombre}</h4>
            <p class="text-[10px] font-bold text-app-textMuted mt-0.5">MOD: ${prod.modelo}</p>
            <details class="mt-2 text-[10px] group">
              <summary class="font-bold text-app-textMuted hover:text-app-neon cursor-pointer outline-none flex items-center gap-1.5 list-none">
                <i data-lucide="info" class="w-3.5 h-3.5"></i> Descripción
                <i data-lucide="chevron-down" class="w-3 h-3 transition-transform group-open:rotate-180 ml-auto"></i>
              </summary>
              <div class="mt-2 text-app-textMuted border-l-2 border-app-border pl-2 leading-relaxed whitespace-pre-line text-[10px]">
                ${prod.descripcion}
              </div>
            </details>
          </div>
          <div class="flex items-center justify-between mt-2">
            <p class="text-app-neon font-black text-xs">$${prod.precioHora}/Hr</p>
            <button onclick="agregarAlCarrito('${categoria}', '${prod.id}')" class="bg-app-black border border-app-border text-app-white hover:bg-app-neon hover:border-app-neon hover:text-white font-black px-3 py-1.5 text-[10px] uppercase rounded-sm transition-colors">Añadir</button>
          </div>
        </div>
      </div>`;
  });
  document.getElementById('modal-productos').classList.remove('hidden');
  lucide.createIcons();
}

function cerrarModal() { 
  document.body.style.overflow = '';
  document.getElementById('modal-productos').classList.add('hidden'); 
}

document.getElementById('modal-productos').addEventListener('click', function (e) {
  if (e.target === this) cerrarModal();
});

function filtrarModal(texto) {
  const term = texto.toLowerCase();
  const items = document.querySelectorAll('.modal-item');
  items.forEach(item => {
    if (item.dataset.name.includes(term)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function cambiarPaso(paso) {
  if (paso === 1) {
    document.getElementById('step-1').classList.remove('hidden');
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('btn-continuar').classList.remove('hidden');
    document.getElementById('action-buttons-final').classList.add('hidden');
  } else {
    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('step-2').classList.remove('hidden');
    document.getElementById('btn-continuar').classList.add('hidden');
    document.getElementById('action-buttons-final').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// =========================================================================
// 5. LÓGICA DEL CARRITO Y MATEMÁTICAS
// =========================================================================
function agregarAlCarrito(categoria, idProducto) {
  const prod = productosDB[categoria].items.find(i => i.id === idProducto);
  const existe = carrito.find(i => i.id === idProducto);
  if (existe) {
    if (existe.qty >= prod.stock) return alert(`Stock máximo alcanzado en Airtable (${prod.stock} uds).`);
    existe.qty += 1;
  } else {
    carrito.push({ ...prod, categoria, qty: 1, fInicio: document.getElementById('input-fecha-inicio').value, fFin: document.getElementById('input-fecha-fin').value });
  }
  cerrarModal(); renderCarrito();
}

function cambiarCantidad(idProducto, delta) {
  const item = carrito.find(i => i.id === idProducto);
  if (item) {
    if (delta > 0 && item.qty >= item.stock) return alert(`Stock máximo alcanzado en Airtable (${item.stock} uds).`);
    item.qty += delta;
    if (item.qty <= 0) carrito = carrito.filter(i => i.id !== idProducto);
  }
  renderCarrito();
}

function actualizarFechaItem(idProducto, tipo, valor) {
  const item = carrito.find(i => i.id === idProducto);
  if (item) {
    if (tipo === 'inicio') item.fInicio = valor;
    if (tipo === 'fin') item.fFin = valor;
    if (item.fFin < item.fInicio) item.fFin = item.fInicio;
    renderCarrito();
  }
}

function getDiasLaborables(startStr, endStr) {
  const laboraDomingos = document.getElementById('toggle-domingos').checked;
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

function sincronizarFechas() {
  const glInicio = document.getElementById('input-fecha-inicio').value;
  const glFin = document.getElementById('input-fecha-fin').value;
  carrito.forEach(item => { item.fInicio = glInicio; item.fFin = glFin; });
  renderCarrito();
}

function verificarDependencias() {
  const alertaDep = document.getElementById('alerta-dependencias');
  const alertaDesgaste = document.getElementById('alerta-desgaste');
  let faltaPortador = false, tieneMartillo = false;
  const tienePortador = carrito.some(i => i.portadorValido);

  carrito.forEach(item => {
    if (item.requierePortador && !tienePortador) faltaPortador = true;
    if (item.esMartillo) tieneMartillo = true;
  });

  if (faltaPortador) {
    document.getElementById('texto-alerta-dependencias').innerText = "ATENCIÓN: Has añadido un aditamento que requiere una máquina portadora compatible (Ej. Excavadora).";
    alertaDep.classList.remove('hidden');
  } else { alertaDep.classList.add('hidden'); }

  tieneMartillo ? alertaDesgaste.classList.remove('hidden') : alertaDesgaste.classList.add('hidden');
}

function renderCarrito() {
  const list = document.getElementById('cart-list');
  const emptyMsg = document.getElementById('cart-empty');
  const badge = document.getElementById('cart-badge');
  const printList = document.getElementById('print-cart-list');
  const horasPorDia = parseInt(document.getElementById('select-turnos').value);

  list.innerHTML = ''; printList.innerHTML = '';
  const totalItems = carrito.reduce((sum, item) => sum + item.qty, 0);
  badge.innerText = `${totalItems} ITEM${totalItems !== 1 ? 'S' : ''}`;
  badge.className = totalItems > 0 ? "bg-app-neon text-white text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wider" : "bg-app-surface2 border border-app-border text-app-textMuted text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wider";

  if (carrito.length === 0) {
    emptyMsg.classList.remove('hidden');
    document.getElementById('btn-continuar').disabled = true;
  } else {
    emptyMsg.classList.add('hidden');
    document.getElementById('btn-continuar').disabled = false;

    carrito.forEach(item => {
      const diasItem = getDiasLaborables(item.fInicio, item.fFin);
      const horasTotalesItem = diasItem * horasPorDia;

      printList.innerHTML += `<div class="flex justify-between border-b border-gray-300 py-1"><span>${item.qty}x ${item.nombre}</span><span>${horasTotalesItem} Hrs (${diasItem} Días)</span></div>`;

      list.innerHTML += `
        <div class="p-2.5 bg-app-surface2 border border-app-border rounded-sm flex flex-col gap-2 relative">
          <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-8 h-8 rounded-sm overflow-hidden flex-shrink-0 border border-app-border bg-app-black">
                  <img src="${item.imagen}" class="w-full h-full object-cover opacity-100" onload="this.classList.add('img-loaded')" />
                </div>
                <div class="min-w-0">
                  <h4 class="font-black text-app-white text-xs leading-tight uppercase truncate">${item.nombre}</h4>
                  <span class="text-[10px] font-bold text-app-textMuted uppercase">$${item.precioHora}/Hr</span>
                </div>
              </div>
              <div class="flex items-center bg-app-black rounded-sm border border-app-border overflow-hidden h-7 flex-shrink-0">
                <button onclick="cambiarCantidad('${item.id}', -1)" class="w-7 h-full flex items-center justify-center text-app-white hover:bg-app-border font-black transition-colors">-</button>
                <span class="w-8 text-center font-black text-app-neon text-xs border-x border-app-border h-full flex items-center justify-center">${item.qty}</span>
                <button onclick="cambiarCantidad('${item.id}', 1)" class="w-7 h-full flex items-center justify-center text-app-white hover:bg-app-border font-black transition-colors">+</button>
              </div>
          </div>
          <div class="flex gap-2 w-full border-t border-app-border pt-2 items-end">
              <div class="flex-1">
                  <label class="block text-[8px] font-bold text-app-textMuted uppercase mb-0.5">Ingreso</label>
                  <input type="date" value="${item.fInicio}" onchange="actualizarFechaItem('${item.id}', 'inicio', this.value)" class="w-full bg-app-black text-[10px] font-bold text-app-textMain border border-app-border rounded-sm p-1.5 outline-none focus:border-app-neon cursor-pointer" />
              </div>
              <div class="flex-1">
                  <label class="block text-[8px] font-bold text-app-textMuted uppercase mb-0.5">Retiro</label>
                  <input type="date" value="${item.fFin}" onchange="actualizarFechaItem('${item.id}', 'fin', this.value)" class="w-full bg-app-black text-[10px] font-bold text-app-textMain border border-app-border rounded-sm p-1.5 outline-none focus:border-app-neon cursor-pointer" />
              </div>
              <div class="w-14 text-right shrink-0">
                  <span class="text-[10px] font-black text-app-neon bg-app-neon/10 px-1.5 py-0.5 rounded-sm">${horasTotalesItem} hrs</span>
              </div>
          </div>
        </div>`;
    });
  }
  verificarDependencias();
  calcularTotales();
}

async function calcularTotales() {
  if (carrito.length === 0) {
    document.getElementById('precio-total').innerText = "$0.00";
    document.getElementById('resumen-total').innerText = "$0.00";
    document.getElementById('label-quote-id').classList.add('hidden');
    document.getElementById('display-quote-id').classList.add('hidden');
    return;
  }

  const selectZona = document.getElementById('select-zona');
  const selectOperador = document.getElementById('select-operador');
  const selectTurnos = document.getElementById('select-turnos');
  const selectCombustible = document.getElementById('select-combustible');
  const tieneSeguro = document.getElementById('toggle-seguro').checked;
  const laboraDomingos = document.getElementById('toggle-domingos').checked;

  const payload = {
    items: carrito.map(item => ({
      id: item.id,
      nombre: item.nombre,
      categoria: item.categoria,
      qty: item.qty,
      fInicio: item.fInicio,
      fFin: item.fFin,
      precioHora: item.precioHora,
      pesado: item.pesado
    })),
    config: {
      zona: selectZona.value,
      operador: selectOperador.value,
      turnos: parseInt(selectTurnos.value),
      combustible: selectCombustible.value,
      seguro: tieneSeguro,
      domingos: laboraDomingos
    }
  };

  try {
    const resp = await fetch('/api/calculate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error("Error en el cálculo del servidor");

    const data = await resp.json();
    desglose = data.breakdown;
    const { quote_id } = data;
    window.current_quote_id = quote_id;

    // Update UI
    document.getElementById('precio-total').innerText = `$${desglose.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('resumen-maquinas-puro').innerText = `$${desglose.subtotalMaquinasPuro.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('resumen-operador').innerText = `$${desglose.costoOperador.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('resumen-combustible').innerText = `$${desglose.combustible.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('resumen-flete').innerText = `$${desglose.flete.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('resumen-seguro').innerText = `$${desglose.seguro.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const rowDesc = document.getElementById('row-descuento');
    if (desglose.descuentoValor > 0) {
      rowDesc.classList.remove('hidden');
      const tipoTarifa = desglose.descuentoPct === 0.30 ? "Mensual" : "Semanal";
      document.getElementById('label-descuento').innerText = `Bonificación Tarifa ${tipoTarifa} (${desglose.descuentoPct * 100}%):`;
      document.getElementById('resumen-descuento').innerText = `-$${desglose.descuentoValor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      
      const alertaDesc = document.getElementById('alerta-descuento');
      document.getElementById('texto-descuento').innerText = `TARIFA ${tipoTarifa.toUpperCase()} ACTIVADA: Se aplicó un ${(desglose.descuentoPct * 100)}% de bonificación.`;
      alertaDesc.classList.remove('hidden');
    } else {
      rowDesc.classList.add('hidden');
      document.getElementById('alerta-descuento').classList.add('hidden');
    }

    const rowViaticos = document.getElementById('row-viaticos');
    if (desglose.viaticos > 0) {
      rowViaticos.classList.remove('hidden');
      document.getElementById('resumen-viaticos').innerText = `$${desglose.viaticos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      rowViaticos.classList.add('hidden');
    }

    document.getElementById('resumen-subtotal-operativo').innerText = `$${desglose.subtotalOperativo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('resumen-itbis').innerText = `$${desglose.itbis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('resumen-total').innerText = `$${desglose.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Show Quote ID
    const qLabel = document.getElementById('label-quote-id');
    const qVal = document.getElementById('val-quote-id');
    const qDisplay = document.getElementById('display-quote-id');
    if (qLabel && qVal) {
      qVal.innerText = quote_id;
      qLabel.classList.remove('hidden');
    }
    if (qDisplay) {
      qDisplay.innerText = `Quote ID: ${quote_id}`;
      qDisplay.classList.remove('hidden');
    }

    // Alerts
    const alerta = document.getElementById('alerta-dias');
    document.getElementById('texto-dias').innerText = `Uso Estimado Total: ${data.summary.totalHorasProyecto} hrs de horómetro.`;
    alerta.classList.remove('hidden');

    const alertaPM = document.getElementById('alerta-mantenimiento');
    data.summary.totalHorasProyecto >= 250 ? alertaPM.classList.remove('hidden') : alertaPM.classList.add('hidden');

  } catch (err) {
    console.error("Fetch Calculation Error:", err);
  }
}

// =========================================================================
// 6. EXPORTACIONES (PDF, Excel) — Motor jsPDF Profesional
// =========================================================================

/**
 * Recopila todos los datos de la cotización actual en un objeto estructurado
 * que el pdf-generator.js consume para renderizar el documento.
 */
function recopilarDatosCotizacion() {
  const horasPorDia = parseInt(document.getElementById('select-turnos').value);
  const selectZona = document.getElementById('select-zona');
  const selectOperador = document.getElementById('select-operador');
  const selectTurnos = document.getElementById('select-turnos');
  const selectCombustible = document.getElementById('select-combustible');

  // Labels legibles para la configuración
  const turnosLabel = selectTurnos.value === '8' ? '1 Turno (8 Hrs/Dia)'
    : selectTurnos.value === '16' ? '2 Turnos (16 Hrs/Dia)' : 'Continuo (24 Hrs/Dia)';
  const combustibleLabel = selectCombustible.value === 'dry' ? 'Maquina Seca (Cliente suministra)' : 'Maquina Humeda (+35%)';
  const zonaMap = { urbana: 'Urbana (Lowboy Local)', periferia: 'Periferia (Cama Baja)', foranea: 'Foranea (+Viaticos)' };
  const zonaLabel = zonaMap[selectZona.value] || 'Urbana';
  const operadorLabel = selectOperador.value === 'no' ? 'Solo Maquina (A todo costo)' : 'Incluir Operador (+$60/Turno)';

  // Equipos con cálculos por ítem
  const equipos = carrito.map(item => {
    const dias = getDiasLaborables(item.fInicio, item.fFin);
    const horas = dias * horasPorDia;
    return {
      nombre: item.nombre,
      modelo: item.modelo || 'N/A',
      cantidad: item.qty,
      tarifaHora: item.precioHora,
      fechaIngreso: item.fInicio,
      fechaRetiro: item.fFin,
      diasLaborables: dias,
      horasTotales: horas,
      subtotal: item.precioHora * item.qty * horas
    };
  });

  return {
    quoteId: window.current_quote_id || 'BORRADOR',
    fechaEmision: new Date().toISOString().split('T')[0],
    cliente: {
      razonSocial: document.getElementById('form-empresa').value || '---',
      rnc: document.getElementById('form-rnc') ? document.getElementById('form-rnc').value || '---' : '---',
      responsable: document.getElementById('form-nombres').value || '---',
      telefono: document.getElementById('form-telefono').value || '---',
      email: document.getElementById('form-email') ? document.getElementById('form-email').value || '---' : '---',
      ubicacion: document.getElementById('form-direccion').value || '---'
    },
    config: {
      turnosLabel,
      combustibleLabel,
      zonaLabel,
      operadorLabel,
      seguro: document.getElementById('toggle-seguro').checked,
      domingos: document.getElementById('toggle-domingos').checked
    },
    equipos,
    desglose: { ...desglose }
  };
}

/**
 * Genera y descarga un PDF profesional con jsPDF.
 * Reemplaza el antiguo window.print() y la captura html2pdf.js
 */
function generarPDF() {
  if (carrito.length === 0) {
    alert('Añade al menos un equipo al manifiesto antes de generar el PDF.');
    return;
  }
  const datos = recopilarDatosCotizacion();
  window.generarCotizacionPDF(datos); // default: triggers download
}

/**
 * Aprueba la cotización: genera PDF, sube datos a Airtable, notifica por WhatsApp.
 */
async function aprobarCotizacion() {
  // 1. Deshabilitar botón temporalmente
  const btnObj = document.querySelector('#action-buttons-final button:last-child');
  const originalText = btnObj ? btnObj.innerHTML : '';
  if (btnObj) {
    btnObj.disabled = true;
    btnObj.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Guardando...`;
    lucide.createIcons();
  }

  // 2. Recopilar datos
  const datos = recopilarDatosCotizacion();
  const empresa = datos.cliente.razonSocial;
  const responsable = datos.cliente.responsable;
  const telefono = datos.cliente.telefono;
  const direccion = datos.cliente.ubicacion;
  const rncCliente = datos.cliente.rnc;
  const emailCliente = datos.cliente.email;
  const fInicio = document.getElementById('input-fecha-inicio').value;
  const fFin = document.getElementById('input-fecha-fin').value;

  const selectTurnos = document.getElementById('select-turnos');
  let valTurnos = selectTurnos.value === "8" ? "8 Hrs" : (selectTurnos.value === "16" ? "16 Hrs" : "24 Hrs");
  const valDiesel = document.getElementById('select-combustible').value === "dry" ? "Seca" : "Humeda";
  const valZonaRaw = document.getElementById('select-zona').value;
  let valZona = "Urbana";
  if (valZonaRaw === "periferia") valZona = "Periferia";
  else if (valZonaRaw === "foranea") valZona = "Foranea";
  const valOperador = document.getElementById('select-operador').value === "no" ? "Solo Maquina" : "Incluir Operador";
  const seguroIncluido = document.getElementById('toggle-seguro').checked;
  const horasPorDia = parseInt(selectTurnos.value);

  // 2.5 Texto de equipos para Airtable
  let listaEquiposTexto = '';
  carrito.forEach(item => {
    let dias = 1;
    try { dias = getDiasLaborables(item.fInicio, item.fFin); } catch(e){}
    let horasTotales = dias * horasPorDia;
    listaEquiposTexto += `▪ ${item.qty}x ${item.nombre} (${horasTotales} hrs)\n`;
  });

  // 3. Generar PDF real con jsPDF (texto seleccionable, ~50KB)
  let pdfBase64 = "";
  try {
    pdfBase64 = window.generarCotizacionPDF(datos, 'base64');
  } catch (pdfErr) {
    console.error("Error generando PDF con jsPDF:", pdfErr);
  }

  // 4. Preparar payload para API
  const payloadAirtable = {
    "Razón Social / Constructora": empresa,
    "Responsable de Obra": responsable,
    "Teléfono Móvil": telefono,
    "Ubicación / Proyecto": direccion,
    "RNC Cliente": rncCliente,
    "Email de Contacto": emailCliente,
    "Equipos Cotizados": listaEquiposTexto,
    "Fecha de Inicio": fInicio,
    "Fecha de Fin": fFin,
    "Régimen de Turnos": valTurnos,
    "Suministro Diésel": valDiesel,
    "Zona Logística": valZona,
    "Modalidad Operador": valOperador,
    "Seguro Incluido": seguroIncluido,
    "Subtotal Renta Máquinas": parseFloat(desglose.subtotalMaquinasPuro.toFixed(2)),
    "Bonificación Volumen": parseFloat(desglose.descuentoValor.toFixed(2)),
    "Costo Operador": parseFloat(desglose.costoOperador.toFixed(2)),
    "Suministro Combustible": parseFloat(desglose.combustible.toFixed(2)),
    "Flete Logístico": parseFloat(desglose.flete.toFixed(2)),
    "Seguro Póliza": parseFloat(desglose.seguro.toFixed(2)),
    "Viáticos": parseFloat(desglose.viaticos.toFixed(2)),
    "Subtotal Operativo": parseFloat(desglose.subtotalOperativo.toFixed(2)),
    "ITBIS": parseFloat(desglose.itbis.toFixed(2)),
    "Total Presupuesto": parseFloat(desglose.total.toFixed(2)),
    "Estado de Cotización": "Pendiente",
    "quote_id": window.current_quote_id || "N/A",
    "monto_total": parseFloat(desglose.total.toFixed(2)),
    "pdfBase64": pdfBase64
  };

  try {
    const resp = await fetch("/api/save-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadAirtable)
    });

    if (!resp.ok) {
      let errText = "Airtable rechazó los datos (422).";
      try {
        const errJson = await resp.json();
        errText = errJson.details || errJson.error || errText;
      } catch (e) {}
      alert("Error al guardar en Airtable. Detalle:\n\n" + errText);
    } else {
      alert("¡Cotización guardada exitosamente!\nID: " + window.current_quote_id + "\n\nEl PDF profesional ha sido generado y enviado.");
      cambiarPaso(1);
    }
  } catch (err) {
    alert("Error de red: Recuerda que esta aplicación requiere conexión a internet.");
    console.error("Excepción de red:", err);
  }

  // 5. Restaurar botón
  if (btnObj) {
    btnObj.disabled = false;
    btnObj.innerHTML = originalText;
    lucide.createIcons();
  }
}

function descargarExcel() {
  const empresa = document.getElementById('form-empresa').value || 'Cliente_Generico';
  const fecha = new Date().toISOString().split('T')[0];
  const horasPorDia = parseInt(document.getElementById('select-turnos').value);

  let csvContent = "\uFEFF"; // BOM
  csvContent += "COTIZACION tu marca\n";
  csvContent += `Cliente / Empresa:,${empresa}\n`;
  csvContent += `Fecha:,${fecha}\n\n`;

  csvContent += "Producto,Categoria,Cantidad,Fecha Ingreso,Fecha Retiro,Horas Totales,Tarifa por Hora,Subtotal Producto\n";

  carrito.forEach(item => {
    let dias = getDiasLaborables(item.fInicio, item.fFin);
    let horasTotales = dias * horasPorDia;
    let subtotal = item.precioHora * item.qty * horasTotales;
    csvContent += `"${item.nombre}",${item.categoria},${item.qty},${item.fInicio},${item.fFin},${horasTotales},${item.precioHora},${subtotal}\n`;
  });

  csvContent += "\nRESUMEN FINANCIERO\n";
  csvContent += `Renta Pura Maquinaria,$${desglose.subtotalMaquinasPuro.toFixed(2)}\n`;
  if (desglose.descuentoValor > 0) csvContent += `Descuento por Volumen,-$${desglose.descuentoValor.toFixed(2)}\n`;
  csvContent += `Servicio de Operador,$${desglose.costoOperador.toFixed(2)}\n`;
  if (desglose.viaticos > 0) csvContent += `Viaticos Operador,$${desglose.viaticos.toFixed(2)}\n`;
  csvContent += `Suministro Diesel,$${desglose.combustible.toFixed(2)}\n`;
  csvContent += `Flete Logistico,$${desglose.flete.toFixed(2)}\n`;
  csvContent += `Seguro Poliza,$${desglose.seguro.toFixed(2)}\n`;
  csvContent += `Subtotal Operativo,$${desglose.subtotalOperativo.toFixed(2)}\n`;
  csvContent += `ITBIS (18%),$${desglose.itbis.toFixed(2)}\n`;
  csvContent += `TOTAL A PAGAR,$${desglose.total.toFixed(2)}\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Cotizacion_${empresa.replace(/\s+/g, '_')}_${fecha}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =========================================================================
// 7. INICIALIZACIÓN (OnLoad)
// =========================================================================
window.onload = function () {
  // 1. Cargar Fechas base
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tdStr = today.toISOString().split('T')[0];
  const tmStr = tomorrow.toISOString().split('T')[0];
  document.getElementById('input-fecha-inicio').value = tdStr;
  document.getElementById('input-fecha-fin').value = tmStr;
  document.getElementById('print-date').innerText = `Fecha: ${today.toLocaleDateString()}`;

  // 2. Setear Event Listeners de los selects e inputs globales
  ['input-fecha-inicio', 'input-fecha-fin', 'select-zona', 'select-operador', 'toggle-seguro', 'toggle-domingos', 'select-turnos', 'select-combustible'].forEach(id => {
    document.getElementById(id).addEventListener('change', calcularTotales);
  });

  document.getElementById('input-fecha-fin').addEventListener('change', function () {
    if (this.value < document.getElementById('input-fecha-inicio').value) {
      this.value = document.getElementById('input-fecha-inicio').value;
      calcularTotales();
    }
  });

  // 3. Cargar datos de Airtable
  cargarInventarioAirtable();
};

// Zoom de imágenes (Lightbox)
window.zoomImage = function (e, url) {
  if (e) e.stopPropagation();
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  img.src = url;
  lb.classList.remove('hidden');
  setTimeout(() => img.classList.replace('scale-95', 'scale-100'), 10);
};

const observer = new MutationObserver(() => {
  document.querySelectorAll('img:not([data-zoom])').forEach(img => {
    img.classList.add('cursor-zoom');
    img.setAttribute('data-zoom', 'true');
    img.onclick = (e) => window.zoomImage(e, img.src);
  });
});
observer.observe(document.body, { childList: true, subtree: true });
