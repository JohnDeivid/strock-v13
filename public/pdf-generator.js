(function () {
  'use strict';

  // =========================================================================
  // COMPANY INFO (Editar con datos reales)
  // =========================================================================
  const COMPANY = {
    nombre: 'Tu Marca Corporativo',
    rnc: 'RNC: 000-000000-0',
    direccion: 'Santo Domingo, República Dominicana',
    telefono: '+1 (809) 000-0000',
    email: 'cotizaciones@tumarca.com',
    web: 'www.tumarca.com'
  };

  // =========================================================================
  // COLORS
  // =========================================================================
  const C = {
    PRIMARY: [234, 88, 12],
    BLACK: [24, 24, 27],
    DARK: [63, 63, 70],
    MID: [113, 113, 122],
    LIGHT: [244, 244, 245],
    WHITE: [255, 255, 255],
    BORDER: [228, 228, 231],
    GREEN: [22, 163, 74],
    RED: [220, 38, 38]
  };

  // =========================================================================
  // HELPERS
  // =========================================================================
  function fmt(n) {
    if (typeof n !== 'number' || isNaN(n)) return '$0.00';
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function fmtDate(str) {
    if (!str) return '---';
    const d = new Date(str + 'T12:00:00');
    return d.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function vigencia(str) {
    if (!str) return '---';
    const d = new Date(str + 'T12:00:00');
    d.setDate(d.getDate() + 15);
    return d.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // =========================================================================
  // TERMS AND CONDITIONS
  // =========================================================================
  const TERMS = [
    {
      title: '1. VIGENCIA DE LA COTIZACION',
      body: 'La presente cotizacion tiene una vigencia de quince (15) dias calendario a partir de la fecha de emision. Los precios estan sujetos a confirmacion al momento de la firma del contrato y pueden variar por fluctuaciones en combustible o logistica.'
    },
    {
      title: '2. FORMA DE PAGO',
      body: 'Se requiere un anticipo del cincuenta por ciento (50%) del valor total antes de la movilizacion del equipo. El saldo restante se facturara de forma quincenal o mensual segun acuerdo. Metodos aceptados: transferencia bancaria o cheque certificado.'
    },
    {
      title: '3. GARANTIAS Y DEPOSITOS',
      body: 'El arrendatario debera firmar un contrato de arrendamiento, un pagare notarial por el valor de reposicion del equipo y un deposito de garantia equivalente al quince por ciento (15%) del valor total del contrato, reembolsable al cierre satisfactorio.'
    },
    {
      title: '4. CONDICIONES TECNICAS Y HOROMETRO',
      body: 'El horometro del equipo sera verificado al inicio y al final del periodo de renta. El cobro minimo es de cuatro (4) horas por dia de standby. Las horas que excedan el turno contratado se facturaran con un recargo del ciento cincuenta por ciento (150%).'
    },
    {
      title: '5. RESPONSABILIDADES DEL ARRENDATARIO',
      body: 'El arrendatario garantiza acceso adecuado al terreno (via minima de 4 metros de ancho), condiciones seguras de operacion, y asume responsabilidad por danos causados por mal uso, negligencia o incumplimiento de las instrucciones del operador.'
    },
    {
      title: '6. MANTENIMIENTO PREVENTIVO',
      body: 'El mantenimiento preventivo programado (PM) se realizara cada doscientas cincuenta (250) horas de uso, sin costo adicional. Los paros se coordinaran en obra. Las reparaciones derivadas de mal uso o negligencia seran cargo del arrendatario.'
    },
    {
      title: '7. COMBUSTIBLE Y CONSUMIBLES',
      body: 'En modalidad "maquina seca", el cliente suministra el diesel. En modalidad "maquina humeda", se aplica un cargo adicional del treinta y cinco por ciento (35%) sobre la renta pura. Los filtros y lubricantes de mantenimiento regular estan incluidos.'
    },
    {
      title: '8. LOGISTICA Y TRANSPORTE',
      body: 'Los costos de movilizacion y desmovilizacion corren por cuenta del arrendatario. El arrendador gestiona los permisos de transito necesarios. La entrega se realiza en un plazo de 24-72 horas despues de la firma del contrato, segun la zona.'
    },
    {
      title: '9. SEGUROS Y COBERTURA',
      body: 'La poliza de Responsabilidad Civil (RC) y danos, cuando se selecciona, cubre volcaduras y danos estructurales con un deducible del diez por ciento (10%) del monto del siniestro. No cubre negligencia, uso indebido ni actos de la naturaleza sin poliza adicional.'
    },
    {
      title: '10. FUERZA MAYOR',
      body: 'En caso de eventos climaticos extremos, disturbios civiles u otros eventos de fuerza mayor, los tiempos de standby se facturaran al cincuenta por ciento (50%) de la tarifa regular.'
    },
    {
      title: '11. JURISDICCION',
      body: 'Este acuerdo se rige por las leyes de la Republica Dominicana. Cualquier controversia sera sometida a los tribunales competentes de Santo Domingo.'
    }
  ];

  // =========================================================================
  // DRAWING FUNCTIONS
  // =========================================================================

  function drawHeader(doc, data, y) {
    const pw = doc.internal.pageSize.getWidth();
    const m = 15;

    // Orange accent bar at top
    doc.setFillColor(...C.PRIMARY);
    doc.rect(0, 0, pw, 4, 'F');

    y = 14;

    // Company name (left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...C.BLACK);
    doc.text(COMPANY.nombre, m, y);

    // Quote title (right)
    doc.setFontSize(10);
    doc.setTextColor(...C.PRIMARY);
    doc.text('COTIZACION FORMAL DE SERVICIOS', pw - m, y, { align: 'right' });

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.MID);
    doc.text(COMPANY.rnc + '  |  ' + COMPANY.telefono, m, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.BLACK);
    doc.text('No: ' + (data.quoteId || 'QT-000000'), pw - m, y, { align: 'right' });

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.MID);
    doc.text(COMPANY.email + '  |  ' + COMPANY.web, m, y);

    doc.setTextColor(...C.DARK);
    doc.text('Fecha: ' + fmtDate(data.fechaEmision) + '  |  Vigencia: ' + vigencia(data.fechaEmision), pw - m, y, { align: 'right' });

    y += 3;
    doc.setDrawColor(...C.BORDER);
    doc.setLineWidth(0.5);
    doc.line(m, y, pw - m, y);

    return y + 4;
  }

  function drawSectionTitle(doc, title, y, m) {
    doc.setFillColor(...C.BLACK);
    doc.roundedRect(m, y, 3, 5, 0.5, 0.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.BLACK);
    doc.text(title, m + 5, y + 4);
    return y + 9;
  }

  function drawClientInfo(doc, data, y) {
    const pw = doc.internal.pageSize.getWidth();
    const m = 15;
    const cw = (pw - m * 2);

    y = drawSectionTitle(doc, 'DATOS DEL CLIENTE', y, m);

    doc.setFillColor(...C.LIGHT);
    doc.roundedRect(m, y, cw, 22, 1, 1, 'F');

    const cl = data.cliente || {};
    const col1 = m + 4;
    const col2 = m + cw / 2 + 2;
    let iy = y + 5;

    doc.setFontSize(7);
    doc.setTextColor(...C.MID);
    doc.setFont('helvetica', 'normal');
    doc.text('Razon Social:', col1, iy);
    doc.text('RNC Cliente:', col2, iy);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.BLACK);
    doc.text(cl.razonSocial || '---', col1 + 28, iy);
    doc.text(cl.rnc || '---', col2 + 26, iy);

    iy += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.MID);
    doc.text('Responsable:', col1, iy);
    doc.text('Telefono:', col2, iy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.BLACK);
    doc.text(cl.responsable || '---', col1 + 28, iy);
    doc.text(cl.telefono || '---', col2 + 26, iy);

    iy += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.MID);
    doc.text('Email:', col1, iy);
    doc.text('Proyecto:', col2, iy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.BLACK);
    doc.text(cl.email || '---', col1 + 28, iy);
    doc.text(cl.ubicacion || '---', col2 + 26, iy);

    return y + 26;
  }

  function drawServiceConfig(doc, data, y) {
    const pw = doc.internal.pageSize.getWidth();
    const m = 15;
    const cw = pw - m * 2;

    y = drawSectionTitle(doc, 'CONFIGURACION DEL SERVICIO', y, m);

    const cfg = data.config || {};
    const items = [
      ['Regimen de Turnos', cfg.turnosLabel || '1 Turno (8 Hrs)'],
      ['Suministro Diesel', cfg.combustibleLabel || 'Maquina Seca'],
      ['Zona Logistica', cfg.zonaLabel || 'Urbana'],
      ['Modalidad Operador', cfg.operadorLabel || 'Solo Maquina'],
      ['Seguro RC', cfg.seguro ? 'Incluido (8%)' : 'No incluido'],
      ['Domingos Laborables', cfg.domingos ? 'Si' : 'No']
    ];

    const colW = cw / 3;
    let cx = m;
    let iy = y;

    items.forEach((item, i) => {
      if (i > 0 && i % 3 === 0) { iy += 9; cx = m; }

      doc.setFillColor(...C.LIGHT);
      doc.roundedRect(cx, iy, colW - 2, 7, 0.5, 0.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...C.MID);
      doc.text(item[0] + ':', cx + 2, iy + 3);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...C.BLACK);
      doc.text(item[1], cx + 2, iy + 6);

      cx += colW;
    });

    return iy + 12;
  }

  function drawEquipmentTable(doc, data, y) {
    const m = 15;
    y = drawSectionTitle(doc, 'EQUIPOS COTIZADOS', y, m);

    const rows = (data.equipos || []).map((eq, i) => [
      (i + 1).toString(),
      eq.nombre + (eq.modelo && eq.modelo !== 'N/A' ? '\n' + eq.modelo : ''),
      eq.cantidad.toString(),
      fmt(eq.tarifaHora),
      eq.diasLaborables.toString(),
      eq.horasTotales.toString(),
      fmt(eq.subtotal)
    ]);

    if (rows.length === 0) {
      rows.push(['', 'Sin equipos seleccionados', '', '', '', '', '']);
    }

    doc.autoTable({
      startY: y,
      margin: { left: m, right: m },
      head: [['#', 'Equipo / Modelo', 'Cant.', '$/Hora', 'Dias', 'Horas', 'Subtotal']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: C.BLACK,
        textColor: C.WHITE,
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 2.5,
        halign: 'center',
        font: 'helvetica'
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: C.BLACK,
        font: 'helvetica'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 14 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 14 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'right', cellWidth: 25, fontStyle: 'bold', textColor: C.PRIMARY }
      },
      didParseCell: function(hookData) {
        if (hookData.section === 'head') {
          hookData.cell.styles.fillColor = C.BLACK;
        }
      }
    });

    return doc.lastAutoTable.finalY + 6;
  }

  function drawFinancialBreakdown(doc, data, y) {
    const pw = doc.internal.pageSize.getWidth();
    const m = 15;
    const cw = pw - m * 2;
    const d = data.desglose || {};

    // Check if we need a new page
    if (y > 210) {
      doc.addPage();
      y = 15;
    }

    y = drawSectionTitle(doc, 'DESGLOSE FINANCIERO', y, m);

    const boxX = m + cw * 0.45;
    const boxW = cw * 0.55;
    const labelX = boxX + 3;
    const valX = boxX + boxW - 3;

    doc.setFillColor(...C.LIGHT);
    doc.roundedRect(boxX, y, boxW, 2, 0, 0, 'F');

    function drawRow(label, value, bold, color, indent) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...(color || C.DARK));
      doc.text(label, labelX + (indent || 0), y);
      doc.text(value, valX, y, { align: 'right' });
      y += 5.5;
    }

    y += 5;
    drawRow('Subtotal Renta Maquinas (Tarifa/Hora):', fmt(d.subtotalMaquinasPuro));

    if (d.descuentoValor > 0) {
      const tipo = d.descuentoPct >= 0.30 ? 'Mensual' : 'Semanal';
      drawRow('Bonificacion Tarifa ' + tipo + ' (' + (d.descuentoPct * 100) + '%):', '-' + fmt(d.descuentoValor), true, C.GREEN);
    }

    drawRow('Servicio de Operador Certificado:', fmt(d.costoOperador));
    if (d.viaticos > 0) drawRow('Viaticos Operador (Foranea):', fmt(d.viaticos));
    drawRow('Suministro Diesel:', fmt(d.combustible));
    drawRow('Flete Logistico (Ida y Vuelta):', fmt(d.flete));
    drawRow('Seguro Poliza RC (8% s/ renta):', fmt(d.seguro));

    // Separator line
    doc.setDrawColor(...C.BORDER);
    doc.setLineWidth(0.3);
    doc.line(labelX, y - 2, valX, y - 2);

    drawRow('Subtotal Operativo:', fmt(d.subtotalOperativo), true, C.BLACK);
    drawRow('ITBIS (18%):', fmt(d.itbis), false, C.DARK);

    // Total box
    y += 1;
    doc.setFillColor(...C.PRIMARY);
    doc.roundedRect(boxX, y - 4, boxW, 11, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.WHITE);
    doc.text('PRESUPUESTO FINAL:', labelX, y + 2);
    doc.setFontSize(13);
    doc.text(fmt(d.total), valX, y + 3, { align: 'right' });

    return y + 12;
  }

  function drawConditionsBox(doc, y) {
    const pw = doc.internal.pageSize.getWidth();
    const m = 15;
    const cw = pw - m * 2;

    if (y > 245) { doc.addPage(); y = 15; }

    y += 3;
    doc.setFillColor(254, 249, 195); // yellow-100
    doc.setDrawColor(250, 204, 21);  // yellow-400
    doc.setLineWidth(0.3);
    doc.roundedRect(m, y, cw, 16, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(161, 98, 7); // yellow-700
    const txt = 'CONDICIONES COMERCIALES: Toda renta de maquinaria pesada requiere un deposito en garantia, firma de contrato y pagare notarial antes del despacho. Tarifas sujetas a cambio sin previo aviso. Validez de cotizacion: 15 dias. Ver Terminos y Condiciones en la pagina siguiente.';
    const lines = doc.splitTextToSize(txt, cw - 8);
    doc.text(lines, m + 4, y + 5);

    return y + 20;
  }

  function drawTermsPage(doc) {
    const pw = doc.internal.pageSize.getWidth();
    const m = 15;
    const cw = pw - m * 2;

    // Orange accent bar
    doc.setFillColor(...C.PRIMARY);
    doc.rect(0, 0, pw, 4, 'F');

    let y = 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...C.BLACK);
    doc.text('TERMINOS Y CONDICIONES GENERALES', m, y);

    y += 3;
    doc.setDrawColor(...C.PRIMARY);
    doc.setLineWidth(0.8);
    doc.line(m, y, m + 60, y);

    y += 6;

    TERMS.forEach(term => {
      if (y > 248) { doc.addPage(); y = 15; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.BLACK);
      doc.text(term.title, m, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.DARK);
      const lines = doc.splitTextToSize(term.body, cw - 4);
      doc.text(lines, m + 2, y);
      y += lines.length * 3.2 + 3;
    });

    // Signature section
    if (y > 220) { doc.addPage(); y = 15; }
    y = Math.max(y + 10, 220);

    doc.setDrawColor(...C.BLACK);
    doc.setLineWidth(0.4);

    // Left signature
    const sigW = 65;
    const sig1X = m + 15;
    const sig2X = pw - m - sigW - 15;

    doc.line(sig1X, y, sig1X + sigW, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.BLACK);
    doc.text('Autorizado por', sig1X + sigW / 2, y + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.MID);
    doc.text(COMPANY.nombre, sig1X + sigW / 2, y + 8, { align: 'center' });

    // Right signature
    doc.setDrawColor(...C.BLACK);
    doc.line(sig2X, y, sig2X + sigW, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.BLACK);
    doc.text('Aceptacion del Cliente', sig2X + sigW / 2, y + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.MID);
    doc.text('Nombre / RNC / Fecha', sig2X + sigW / 2, y + 8, { align: 'center' });
  }

  function addFooters(doc) {
    const pages = doc.internal.getNumberOfPages();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);

      // Bottom bar
      doc.setFillColor(...C.LIGHT);
      doc.rect(0, ph - 10, pw, 10, 'F');
      doc.setDrawColor(...C.BORDER);
      doc.setLineWidth(0.3);
      doc.line(15, ph - 10, pw - 15, ph - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...C.MID);
      doc.text('Documento generado electronicamente  |  ' + COMPANY.nombre, 15, ph - 5);
      doc.text('Pagina ' + i + ' de ' + pages, pw - 15, ph - 5, { align: 'right' });
    }
  }

  function addWatermark(doc) {
    const pages = doc.internal.getNumberOfPages();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(50);
      doc.setTextColor(240, 240, 240); // Lighter gray to replace opacity
      doc.text('COTIZACION PREVIA', pw / 2, ph / 2, {
        align: 'center',
        angle: 35
      });
      // Reset color for safety
      doc.setTextColor(0, 0, 0);
    }
  }

  // =========================================================================
  // MAIN EXPORT
  // =========================================================================
  window.generarCotizacionPDF = function (datos, returnType) {
    let jsPDF;
    if (window.jspdf && window.jspdf.jsPDF) {
      jsPDF = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
      jsPDF = window.jsPDF;
    } else {
      throw new Error("Librería jsPDF no encontrada. Revisa la conexión a internet.");
    }

    const doc = new jsPDF({
      unit: 'mm',
      format: 'letter',
      orientation: 'portrait',
      compress: true
    });

    // Validación crítica de autoTable
    if (typeof doc.autoTable !== 'function') {
      throw new Error("El plugin jsPDF-AutoTable no se cargó correctamente. Contacte a soporte.");
    }

    // Page 1: Quotation
    let y = 0;
    y = drawHeader(doc, datos, y);
    y = drawClientInfo(doc, datos, y);
    y = drawServiceConfig(doc, datos, y);
    y = drawEquipmentTable(doc, datos, y);
    y = drawFinancialBreakdown(doc, datos, y);
    y = drawConditionsBox(doc, y);

    // Page 2: Terms and Conditions
    doc.addPage();
    drawTermsPage(doc);

    // Post-processing
    addFooters(doc);
    addWatermark(doc);

    // Output
    const filename = 'cotizacion-' + (datos.quoteId || 'borrador') + '.pdf';

    if (returnType === 'blob') {
      return doc.output('blob');
    }
    if (returnType === 'base64') {
      return doc.output('datauristring');
    }
    // Default: trigger download
    doc.save(filename);
    return true;
  };

})();
