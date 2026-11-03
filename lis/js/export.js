/**
 * LIS Monitoring System v2 — Export Engine (Excel, PDF, Print)
 */
(function (g) {
  'use strict';
  const LIS = (g.LIS = g.LIS || {});

  function inr(n) {
    if (typeof n !== 'number') return String(n || '0');
    return '₹ ' + Math.round(n).toLocaleString('en-IN');
  }

  function inrCr(n) {
    if (typeof n !== 'number') return String(n || '0');
    return '₹ ' + n.toFixed(2) + ' Cr';
  }

  // ------------------------------------------------------------- Excel Export
  async function exportExcel() {
    if (!g.ExcelJS) {
      alert('Excel export engine is loading. Please try again in a moment.');
      return;
    }

    const wb = new g.ExcelJS.Workbook();
    wb.creator = 'Telangana I&CAD Department';
    wb.created = new Date();

    const store = LIS.store;

    // Sheet 1: Executive Overview
    const ws1 = wb.addWorksheet('Package Overview');
    ws1.columns = [
      { header: 'Scheme Code', key: 'id', width: 12 },
      { header: 'Scheme Name', key: 'name', width: 36 },
      { header: 'Discharge', key: 'discharge', width: 22 },
      { header: 'Static Head', key: 'head', width: 18 },
      { header: 'Pumps & Motors', key: 'pumps', width: 30 },
      { header: 'Ayacut', key: 'ayacut', width: 16 },
      { header: 'Sanction (₹ Cr)', key: 'sanction', width: 16 },
      { header: 'Supplemental (₹ Cr)', key: 'suppCr', width: 20 },
      { header: 'Bill Value (₹ Cr)', key: 'billCr', width: 18 },
      { header: 'Physical Progress (%)', key: 'progress', width: 20 },
      { header: 'Key Status & Bottlenecks', key: 'status', width: 45 }
    ];

    store.schemes.forEach((s) => {
      ws1.addRow({
        id: s.id,
        name: s.name,
        discharge: s.discharge,
        head: s.head,
        pumps: s.pumps,
        ayacut: s.ayacut,
        sanction: s.sanction,
        suppCr: (s.supp / 10000000).toFixed(2),
        billCr: (s.bill / 10000000).toFixed(2),
        progress: s.progress + ' %',
        status: s.status
      });
    });

    // Style Header
    ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };

    // Sheet 2: Components Stage Register
    const ws2 = wb.addWorksheet('Component Progress');
    ws2.columns = [
      { header: 'Scheme', key: 'scheme', width: 12 },
      { header: 'Component ID', key: 'id', width: 14 },
      { header: 'Component Name', key: 'name', width: 42 },
      { header: 'Total Scope', key: 'total', width: 14 },
      { header: 'Executed', key: 'completed', width: 14 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Progress Stage', key: 'stage', width: 25 },
      { header: 'Detailed Status', key: 'status', width: 28 }
    ];

    store.schemes.forEach((s) => {
      s.components.forEach((c) => {
        ws2.addRow({
          scheme: s.id,
          id: c.id,
          name: c.name,
          total: c.total,
          completed: c.completed,
          unit: c.unit,
          stage: c.stage,
          status: c.status
        });
      });
    });
    ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } };

    // Sheet 3: Measurement Log (MB Records)
    const ws3 = wb.addWorksheet('Field Measurement Register');
    ws3.columns = [
      { header: 'Log ID', key: 'id', width: 14 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Scheme', key: 'schemeId', width: 10 },
      { header: 'Component', key: 'componentName', width: 38 },
      { header: 'Cumulative Qty', key: 'quantity', width: 16 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Measurement / MB Ref', key: 'ref', width: 26 },
      { header: 'Reporting Officer', key: 'officer', width: 22 },
      { header: 'Site Remarks', key: 'remarks', width: 45 }
    ];

    store.logs.forEach((l) => {
      ws3.addRow(l);
    });
    ws3.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

    // Sheet 4: Issues & Actions
    const ws4 = wb.addWorksheet('Issues & Bottlenecks');
    ws4.columns = [
      { header: 'Issue ID', key: 'id', width: 14 },
      { header: 'Scheme', key: 'scheme', width: 10 },
      { header: 'Category', key: 'category', width: 14 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Fund Impact (₹ Cr)', key: 'costCr', width: 18 },
      { header: 'Issue Description', key: 'detail', width: 45 },
      { header: 'Required Action', key: 'actionNeeded', width: 45 }
    ];

    store.issues.forEach((i) => {
      ws4.addRow({
        id: i.id,
        scheme: i.scheme,
        category: i.category,
        priority: i.priority,
        status: i.status,
        costCr: i.costCr || 0,
        detail: i.detail,
        actionNeeded: i.actionNeeded
      });
    });
    ws4.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws4.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `LIS_Package_Monitoring_Report_${getDateStamp()}.xlsx`);
  }

  // ------------------------------------------------------------- PDF Export
  function exportPDF() {
    const jsPDF = (g.jspdf && g.jspdf.jsPDF) || g.jsPDF;
    if (!jsPDF) {
      alert('PDF generation engine is loading. Please try again in a moment.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const store = LIS.store;

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('GOVERNMENT OF TELANGANA — IRRIGATION & CAD DEPARTMENT', 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(148, 163, 184);
    doc.text('4 Nos. Lift Irrigation Schemes Package (BW · DBC · VP-II · THOP) — Executive Monitoring Review', 14, 17);
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-GB')}`, 250, 17);

    // Schemes Overview Table
    const bodySchemes = store.schemes.map((s) => [
      s.id,
      s.name,
      s.discharge,
      s.head,
      s.pumps,
      s.ayacut,
      inrCr(s.sanction),
      inrCr(s.supp / 10000000),
      s.progress + ' %',
      s.status
    ]);

    doc.autoTable({
      startY: 28,
      head: [['ID', 'Scheme Name', 'Discharge', 'Head', 'Pumps & Motors', 'Ayacut', 'Sanction', 'Supp. Agmt', 'Progress', 'Current Status']],
      body: bodySchemes,
      theme: 'grid',
      styles: { fontSize: 7.2, cellPadding: 1.5, lineColor: [215, 220, 228], lineWidth: 0.1 },
      headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold', fontSize: 7.8 },
      columnStyles: {
        0: { cellWidth: 12, fontStyle: 'bold' },
        1: { cellWidth: 42 },
        8: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [8, 145, 178] },
        9: { cellWidth: 55 }
      },
      margin: { left: 14, right: 14 }
    });

    // Page 2: Urgent Issues & Liabilities
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PRIORITY BOTTLENECKS, LAND ACQUISITION & POWER DEPOSIT STATUS', 14, 11);

    const bodyIssues = store.issues.map((i) => [
      i.id,
      i.scheme,
      i.category,
      i.priority,
      i.costCr ? inrCr(i.costCr) : '—',
      i.detail,
      i.actionNeeded,
      i.status
    ]);

    doc.autoTable({
      startY: 22,
      head: [['Issue ID', 'Scheme', 'Category', 'Priority', 'Amount', 'Issue Description', 'Required Executive Action', 'Status']],
      body: bodyIssues,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: [215, 220, 228], lineWidth: 0.1 },
      headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold', fontSize: 8.0 },
      columnStyles: {
        0: { cellWidth: 16, fontStyle: 'bold' },
        1: { cellWidth: 14 },
        3: { cellWidth: 16, fontStyle: 'bold' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 95 },
        6: { cellWidth: 85 },
        7: { cellWidth: 20, fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    // Signature Block at bottom
    const finalY = doc.lastAutoTable.finalY + 18;
    const sigY = finalY > 185 ? 185 : finalY;
    doc.setFontSize(8.5);
    doc.setTextColor(30);
    const sigs = ['Assistant Executive Engineer', 'Dy. Executive Engineer', 'Executive Engineer'];
    sigs.forEach((title, idx) => {
      const x = 30 + idx * 95;
      doc.text('_________________________________', x, sigY);
      doc.setFont('helvetica', 'bold');
      doc.text(title, x, sigY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('Irrigation Division No.3, Miryalaguda', x, sigY + 9);
    });

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setTextColor(130);
      doc.text('4 Nos. LIS Package Monitoring — I&CAD Department Telangana', 14, 204);
      doc.text(`Page ${p} of ${totalPages}`, 280, 204, { align: 'right' });
    }

    doc.save(`LIS_Executive_Summary_${getDateStamp()}.pdf`);
  }

  // ------------------------------------------------------------- Helpers
  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }

  function getDateStamp() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  Object.assign(LIS, { exportExcel, exportPDF, printReport: () => window.print() });
})(typeof window !== 'undefined' ? window : globalThis);
