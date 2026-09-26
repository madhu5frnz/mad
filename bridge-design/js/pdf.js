/*
 * PDF output (jsPDF + AutoTable) and file saving.
 * Drawings are drawn from the same drafting model as the SVG / DXF, so the
 * PDF is vector and exact at A2. Report and estimate go to A4 tables.
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});

  // Save a generated file: the claude.ai "downloads" capability when the page
  // runs as a hosted artifact, otherwise a normal browser download.
  let dlNs;
  async function downloadsNs() {
    if (dlNs !== undefined) return dlNs;
    try { dlNs = g.claude && g.claude.use ? await g.claude.use('downloads') : null; } catch (e) { dlNs = null; }
    return dlNs;
  }
  BD.saveBlob = async function (blob, filename) {
    const ns = await downloadsNs();
    if (ns) {
      try { await ns.save({ filename, data: blob }); return true; }
      catch (e) { if (e && e.code === 'declined') return false; throw new Error((e && e.message) || 'The file could not be saved.'); }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return true;
  };

  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const hex6 = (c) => (c.length === 4 ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c);
  const latin = (s) => String(s).replace(/[φ]/g, 'dia').replace(/[≥]/g, '>=').replace(/[≤]/g, '<=').replace(/[–—]/g, '-').replace(/[₹]/g, 'Rs').replace(/[^\x00-\xff]/g, '?');

  function drawDwg(doc, dw) {
    const H = dw.h;
    for (const e of dw.ents) {
      const [, col, lt] = BD.LAYERS[e.layer] || BD.LAYERS.OUTLINE;
      const c = rgb(hex6(col));
      doc.setDrawColor(...c); doc.setFillColor(...c); doc.setTextColor(...c);
      const sw = e.w != null ? e.w : e.layer === 'OUTLINE' || e.layer === 'BORDER' ? 0.3 : e.layer === 'REBAR' ? 0.35 : 0.18;
      doc.setLineWidth(sw);
      doc.setLineDashPattern(lt === 'DASHED' ? [2, 1] : lt === 'CENTER' ? [6, 1.2, 1.2, 1.2] : [], 0);
      if (e.t === 'line') doc.line(e.x1, H - e.y1, e.x2, H - e.y2);
      else if (e.t === 'poly') {
        const pts = e.pts;
        const d = [];
        for (let i = 1; i < pts.length; i++) d.push([pts[i][0] - pts[i - 1][0], -(pts[i][1] - pts[i - 1][1])]);
        doc.lines(d, pts[0][0], H - pts[0][1], [1, 1], e.fill ? 'FD' : 'S', !!e.closed);
      } else if (e.t === 'circle') doc.circle(e.x, H - e.y, e.r, e.fill ? 'F' : 'S');
      else if (e.t === 'text') {
        const s = latin(e.s);
        doc.setFont('helvetica', e.bold ? 'bold' : 'normal');
        doc.setFontSize(e.h * 1.4 * 2.8346);
        const w = doc.getTextWidth(s);
        const off = e.anchor === 'middle' ? -w / 2 : e.anchor === 'end' ? -w : 0;
        const a = ((e.rot || 0) * Math.PI) / 180;
        doc.text(s, e.x + off * Math.cos(a), H - e.y - off * Math.sin(a), { angle: e.rot || 0 });
      }
    }
    doc.setLineDashPattern([], 0);
  }

  function drawingsPDF(dws) {
    const { jsPDF } = g.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [dws[0].w, dws[0].h], compress: true });
    dws.forEach((dw, i) => { if (i) doc.addPage([dw.w, dw.h], 'landscape'); drawDwg(doc, dw); });
    return doc.output('blob');
  }

  const BLUE = [29, 78, 216], OK = [10, 122, 47], BAD = [192, 20, 43], INP = [255, 248, 197], HEAD = [238, 242, 248];

  function a4(title, lines) {
    const { jsPDF } = g.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5);
    const t = doc.splitTextToSize(latin(title), 182);
    doc.text(t, 14, 16);
    let y = 16 + t.length * 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(90);
    for (const l of lines) { const s = doc.splitTextToSize(latin(l), 182); doc.text(s, 14, y); y += s.length * 3.8; }
    doc.setTextColor(0);
    return { doc, y: y + 2 };
  }

  function footer(doc, d) {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(120);
      doc.text(latin(d.R.nameOfWork), 14, 290);
      doc.text(`Page ${i} of ${n}`, 196, 290, { align: 'right' });
    }
  }

  function signatures(doc, p) {
    let y = doc.lastAutoTable.finalY + 28;
    if (y > 270) { doc.addPage(); y = 40; }
    doc.setFontSize(9); doc.setTextColor(0); doc.setFont('helvetica', 'bold');
    [['Assistant Executive Engineer', p.subDivision], ['Dy. Executive Engineer', p.subDivision], ['Executive Engineer', p.division]].forEach(([a, b], i) => {
      const x = 14 + 30 + i * 61;
      doc.setFont('helvetica', 'bold'); doc.text(a, x, y, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.text(latin(b), x, y + 4.5, { align: 'center' });
    });
  }

  function reportPDF(d) {
    const { doc, y } = a4(d.R.title, [d.R.subtitle, d.R.codes + ' Shaded values are inputs.']);
    let startY = y;
    for (const s of d.sections) {
      const body = s.rows.map((r) => {
        const v = typeof r.value === 'number' ? (Number.isInteger(r.value) ? String(r.value) : Math.abs(r.value) >= 1000 ? r.value.toFixed(2) : r.value.toFixed(3)) : String(r.value);
        return r.sub ? [{ content: latin(r.label), colSpan: 4, styles: { fontStyle: 'bolditalic', fillColor: HEAD } }] : [latin(r.label), latin(v), latin(r.unit || ''), latin(r.remark || '')];
      });
      doc.autoTable({
        startY, head: [[{ content: latin(s.title), colSpan: 4 }]], body, theme: 'grid',
        styles: { fontSize: 7.6, cellPadding: 1.1, lineColor: [215, 220, 228], lineWidth: 0.1, textColor: 20 },
        headStyles: { fillColor: [255, 255, 255], textColor: BLUE, fontStyle: 'bold', fontSize: 8.6, lineWidth: 0 },
        columnStyles: { 0: { cellWidth: 88 }, 1: { cellWidth: 34, halign: 'right', fontStyle: 'bold' }, 2: { cellWidth: 14 }, 3: { textColor: 90, fontSize: 6.8 } },
        margin: { left: 14, right: 14, bottom: 14 },
        didParseCell: (h) => {
          if (h.section !== 'body' || h.column.index !== 1) return;
          const r = s.rows[h.row.index];
          if (!r) return;
          if (r.check) h.cell.styles.textColor = r.ok ? OK : BAD;
          else if (r.input) h.cell.styles.fillColor = INP;
        },
      });
      startY = doc.lastAutoTable.finalY + 4;
    }
    doc.setFontSize(8); doc.setTextColor(90);
    doc.text(doc.splitTextToSize(latin(d.R.assumptions), 182), 14, doc.lastAutoTable.finalY + 6);
    signatures(doc, d.p);
    footer(doc, d);
    return doc.output('blob');
  }

  function estimatePDF(d, e) {
    const inr = (n) => Math.round(n).toLocaleString('en-IN');
    const { doc, y } = a4('ESTIMATE', [e.nameOfWork]);
    const base = { theme: 'grid', styles: { fontSize: 7.6, cellPadding: 1.2, lineColor: [200, 206, 216], lineWidth: 0.1, textColor: 20 }, headStyles: { fillColor: HEAD, textColor: 20, fontStyle: 'bold' }, margin: { left: 14, right: 14, bottom: 14 } };
    const sec = (t, at) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...BLUE); doc.text(t, 14, at); doc.setTextColor(0); doc.setFont('helvetica', 'normal'); return at + 2; };
    let at = sec('GENERAL ABSTRACT', y + 2);
    const ga = [['', { content: 'Part A (Item works)', styles: { fontStyle: 'bold' } }, ''], ['1', e.genAbst[0][0], inr(e.genAbst[0][1])], ['', { content: 'Part B', styles: { fontStyle: 'bold' } }, '']];
    e.genAbst.slice(1).forEach(([a, b], i) => ga.push([String(i + 2), latin(a.trim()), inr(b)]));
    ga.push(['', { content: 'Total Rs.', styles: { fontStyle: 'bold' } }, { content: inr(e.total), styles: { fontStyle: 'bold' } }]);
    ga.push(['', { content: 'Or say (Lakhs)', styles: { fontStyle: 'bold' } }, { content: e.lakhs.toFixed(2), styles: { fontStyle: 'bold' } }]);
    doc.autoTable(Object.assign({}, base, { startY: at, head: [['S.No', 'Description of work', 'Amount in Rs.']], body: ga, columnStyles: { 0: { cellWidth: 12 }, 2: { cellWidth: 34, halign: 'right' } } }));
    at = sec('ABSTRACT', doc.lastAutoTable.finalY + 8);
    const ab = e.items.map((it) => [it.sl, it.code, latin(it.short), it.qty.toFixed(3), String(it.rate), it.unit, inr(it.amount)]);
    ab.push([{ content: 'ECV', colSpan: 6, styles: { fontStyle: 'bold', halign: 'right' } }, { content: inr(e.ecv), styles: { fontStyle: 'bold' } }]);
    doc.autoTable(Object.assign({}, base, { startY: at, head: [['Sl', 'Item code', 'Description of item', 'Qty', 'Rate', 'Unit', 'Amount']], body: ab, columnStyles: { 0: { cellWidth: 7 }, 1: { cellWidth: 22 }, 3: { halign: 'right', cellWidth: 16 }, 4: { halign: 'right', cellWidth: 15 }, 5: { cellWidth: 10 }, 6: { halign: 'right', cellWidth: 20 } } }));
    doc.addPage();
    at = sec('DETAILED ESTIMATE', 16);
    const dt = [];
    for (const it of e.items) {
      dt.push([{ content: `${it.sl}. ${it.code} - ${latin(it.long)}`, colSpan: 6, styles: { fontStyle: 'bold', fillColor: HEAD } }]);
      if (it.key === 'steel') { dt.push(['Qty as per Bar Bending Schedule', '', '', '', '', it.qty.toFixed(2) + ' kg']); continue; }
      dt.push([{ content: it.where, colSpan: 6, styles: { fontStyle: 'italic' } }]);
      for (const r of it.rows) dt.push([latin(r.desc), `${r.n1} x ${r.n2}`, String(r.l), String(r.w), String(r.d), r.qty.toFixed(3)]);
      dt.push([{ content: 'Total', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `${it.qty.toFixed(3)} ${it.unit}`, styles: { fontStyle: 'bold' } }]);
    }
    doc.autoTable(Object.assign({}, base, { startY: at, head: [['Description', 'No', 'Length', 'Width', 'Depth', 'Qty']], body: dt, columnStyles: { 1: { cellWidth: 14, halign: 'center' }, 2: { cellWidth: 16, halign: 'right' }, 3: { cellWidth: 16, halign: 'right' }, 4: { cellWidth: 16, halign: 'right' }, 5: { cellWidth: 24, halign: 'right' } } }));
    at = sec('BAR BENDING SCHEDULE', doc.lastAutoTable.finalY + 8);
    const bb = [];
    let last = '';
    for (const r of e.bbs.rows) {
      if (r.member !== last) { bb.push([{ content: latin(r.member), colSpan: 10, styles: { fontStyle: 'bold', fillColor: HEAD } }]); last = r.member; }
      bb.push([latin(r.desc), r.dia, String(r.sp), latin(r.shape), r.len, r.nb, r.nm, r.tl, r.w, r.kg.toFixed(2)]);
    }
    bb.push([{ content: 'TOTAL WEIGHT OF STEEL (kg)', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold' } }, { content: e.bbs.total.toFixed(2), styles: { fontStyle: 'bold' } }]);
    doc.autoTable(Object.assign({}, base, { startY: at, head: [['Description', 'Dia', 'Spacing', 'Shape', 'Length', 'Nos', 'Mem', 'Total L', 'kg/m', 'kg']], body: bb, styles: Object.assign({}, base.styles, { fontSize: 6.8 }) }));
    at = sec('SEIGNIORAGE', doc.lastAutoTable.finalY + 8);
    doc.autoTable(Object.assign({}, base, {
      startY: at, head: [['Material', 'Quantity (cum)', 'Rate', 'Amount (Rs)']], columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      body: [
        ['Metal', e.seigTot.metal.toFixed(3), e.seigRates.metal, inr(e.seigAmt.metal)],
        ['N-Sand', e.seigTot.nsand.toFixed(3), e.seigRates.nsand, inr(e.seigAmt.nsand)],
        ['M-Sand', e.seigTot.msand.toFixed(3), e.seigRates.msand, inr(e.seigAmt.msand)],
        [{ content: 'Total seigniorage', colSpan: 3, styles: { fontStyle: 'bold' } }, inr(e.seigTotal)],
        [{ content: `DMF ${e.ga.dmf * 100} % / SMET ${e.ga.smet * 100} % / permit fee ${e.ga.permit * 100} %`, colSpan: 3 }, `${inr(e.dmf)} / ${inr(e.smet)} / ${inr(e.permit)}`],
      ],
    }));
    signatures(doc, d.p);
    footer(doc, d);
    return doc.output('blob');
  }

  async function dxfZip(d, base) {
    const zip = new g.JSZip();
    zip.file(`${base}_Sheet1.dxf`, BD.toDXF(BD.sheet1(d)));
    zip.file(`${base}_Sheet2.dxf`, BD.toDXF(BD.sheet2(d)));
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  }

  Object.assign(BD, { drawingsPDF, reportPDF, estimatePDF, dxfZip });
})(typeof window !== 'undefined' ? window : globalThis);
