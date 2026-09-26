/*
 * Excel export (ExcelJS, loaded from CDN in index.html).
 * Design workbook: DESIGN sheet in the reference layout (values).
 * Estimate workbook: Cover, Check slip, Gen Abst, Abstract, detailed, steel,
 * seigniorage, theoritical requirement - with live formulas like the reference.
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});
  const thin = { style: 'thin' };
  const box = { top: thin, left: thin, bottom: thin, right: thin };
  const bold = { bold: true };
  const wrap = { wrapText: true, vertical: 'top' };

  function signatures(ws, row, p) {
    ws.getCell(row, 2).value = 'Assistant Executive Engineer';
    ws.getCell(row, 5).value = 'Dy.Executive Engineer';
    ws.getCell(row, 9).value = 'Executive Engineer';
    ws.getCell(row + 1, 2).value = p.subDivision;
    ws.getCell(row + 1, 5).value = p.subDivision;
    ws.getCell(row + 1, 9).value = p.division;
    for (const c of [2, 5, 9]) ws.getCell(row, c).font = bold;
  }

  function designWorkbook(d) {
    const wb = new g.ExcelJS.Workbook();
    const ws = wb.addWorksheet('DESIGN', { pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ws.columns = [{ width: 70 }, { width: 16 }, { width: 10 }, { width: 55 }];
    ws.addRow([d.R.title]).font = { bold: true, size: 12 };
    ws.addRow([d.R.subtitle]);
    ws.addRow([d.R.codes + ' Yellow cells = inputs.']);
    ws.addRow([]);
    for (const s of d.sections) {
      const hr = ws.addRow([s.title]);
      hr.font = { bold: true, color: { argb: 'FF1F3A93' } };
      for (const r of s.rows) {
        const v = typeof r.value === 'number' ? Math.round(r.value * 1e6) / 1e6 : r.value;
        const row = ws.addRow([r.label, v, r.unit, r.remark]);
        row.getCell(1).alignment = { wrapText: true };
        row.getCell(4).alignment = { wrapText: true };
        if (r.sub) row.font = { italic: true, bold: true };
        if (typeof v === 'number') row.getCell(2).numFmt = Math.abs(v) >= 1000 ? '0.00' : '0.000';
        if (r.input) row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
        if (r.check) {
          row.getCell(2).font = { bold: true, color: { argb: r.ok ? 'FF0A7A2F' : 'FFC0142B' } };
        }
      }
      ws.addRow([]);
    }
    ws.addRow([d.R.assumptions]).getCell(1).alignment = { wrapText: true };
    for (const w of d.warnings) ws.addRow(['NOTE: ' + w]).font = { color: { argb: 'FFC0142B' } };
    return wb;
  }

  function estimateWorkbook(d, e) {
    const { p, R } = d;
    const wb = new g.ExcelJS.Workbook();
    const name = e.nameOfWork;

    // Cover
    const cv = wb.addWorksheet('Cover Page.');
    cv.columns = Array.from({ length: 10 }, () => ({ width: 11 }));
    cv.getCell('C4').value = p.state; cv.getCell('C4').font = { bold: true, size: 16 };
    cv.getCell('C11').value = p.department; cv.getCell('C11').font = { bold: true, size: 14 };
    cv.getCell('B15').value = name; cv.mergeCells('B15:J16'); cv.getCell('B15').alignment = wrap; cv.getCell('B15').font = { bold: true, size: 12 };
    cv.getCell('C17').value = 'AMOUNT OF ESTIMATE'; cv.getCell('C17').font = { bold: true, size: 12 };
    cv.getCell('F18').value = 'Rs '; cv.getCell('G18').value = { formula: "'Gen Abst'!C18", result: +e.lakhs.toFixed(2) };
    cv.getCell('I18').value = 'Lakhs ';

    // Check slip
    const ck = wb.addWorksheet('Check slip - TS');
    ck.columns = [{ width: 5 }, { width: 60 }, { width: 3 }, { width: 60 }];
    ck.addRow(['CHECK SLIP ACCOMPANYING THE PROJECT / SCHEME / WORK ESTIMATE']).font = bold;
    ck.addRow([]);
    const slip = [
      ['Name of the Project /Scheme/Work', R.nameOfWork],
      ['Estimate Amount Rs.', { formula: 'TEXT(\'Gen Abst\'!C18,"0.00")&" Lakhs"', result: e.lakhs.toFixed(2) + ' Lakhs' }],
      ['Category of Project /Scheme /Work', p.project],
      ['Location /District /Mandal /Village', `${p.location}, ${p.district} Dist.`],
      ['Scope of work in brief', R.scope || `Construction of single vent ${R.typ} of ${p.span.toFixed(2)} m clear span with ${p.carriageway.toFixed(2)} m carriageway across ${p.canalName} at Km ${p.chainage}`],
      ['Whether the approved Designs /Drawings /Hydraulic particulars /Cross sections are enclosed', 'ENCLOSED'],
      ['Whether the data enclosed is based on the current SSR with year', '2026-27'],
      ['Whether geological and foundation investigations carried out', 'Trial pit to be taken before execution'],
      ['Whether the provision for formation of road, NH crossing, railway crossing and other road crossings is based on their specification and standards.', 'YES (as per IRC codes)'],
      ['Construction programme of the Project/Scheme/work', '6 months'],
    ];
    slip.forEach(([a, b], i) => { const r = ck.addRow([i + 1, a, ':', b]); r.alignment = wrap; });

    // sheet order as in the reference workbook; filled below in dependency order
    const ga = wb.addWorksheet('Gen Abst');
    const ab = wb.addWorksheet('Abstract');
    const dt = wb.addWorksheet('detailed ');
    const st = wb.addWorksheet('steel');
    const sg = wb.addWorksheet('seignorage');
    const th = wb.addWorksheet('theoritical requirement');

    dt.columns = [{ width: 6 }, { width: 60 }, { width: 5 }, { width: 3 }, { width: 5 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 11 }, { width: 6 }];
    dt.getCell('A1').value = 'Detailed Estimate'; dt.getCell('A1').font = { bold: true, size: 13 };
    dt.getCell('A3').value = name; dt.mergeCells('A3:J3'); dt.getCell('A3').alignment = wrap; dt.getRow(3).height = 30;
    dt.getRow(4).values = ['S.No.', 'Description of Item', 'No', '', '', 'Length', 'Width', 'Depth', 'Qty', 'Unit'];
    dt.getRow(4).font = bold;
    let rr = 6;
    const totRef = {};
    for (const it of e.items) {
      dt.getCell(rr, 2).value = it.code; dt.getCell(rr, 2).font = bold; rr++;
      dt.getCell(rr, 1).value = it.sl; dt.getCell(rr, 2).value = it.long; dt.getCell(rr, 2).alignment = wrap;
      dt.getRow(rr).height = Math.min(160, 15 * Math.ceil(it.long.length / 70)); rr++;
      if (it.key === 'steel') {
        dt.getCell(rr, 2).value = 'Qty sheet enclosed (Bar Bending Schedule)';
        totRef[it.code] = { cell: 'I' + rr }; // formula set once the BBS total row is known
        dt.getCell(rr, 10).value = 'kgs'; rr++;
        continue;
      }
      dt.getCell(rr, 2).value = it.where; rr++;
      const first = rr;
      for (const x of it.rows) {
        dt.getRow(rr).values = ['', x.desc, x.n1, 'x', x.n2, x.l, x.w, x.d];
        dt.getCell(rr, 9).value = { formula: `ROUND(C${rr}*E${rr}*F${rr}*G${rr}*H${rr},3)`, result: x.qty };
        rr++;
      }
      dt.getCell(rr, 8).value = 'Total'; dt.getCell(rr, 8).font = bold;
      dt.getCell(rr, 9).value = { formula: `SUM(I${first}:I${rr - 1})`, result: it.qty }; dt.getCell(rr, 9).font = bold;
      dt.getCell(rr, 10).value = it.unit;
      totRef[it.code] = { cell: 'I' + rr };
      rr++;
    }
    signatures(dt, rr + 2, p);

    // steel / BBS
    st.columns = [{ width: 6 }, { width: 42 }, { width: 8 }, { width: 8 }, { width: 30 }, { width: 9 }, { width: 8 }, { width: 8 }, { width: 11 }, { width: 10 }, { width: 12 }];
    st.getCell('A1').value = 'REINFORCEMENT STEEL'; st.getCell('A2').value = 'BAR BENDING SCHEDULE'; st.getCell('A1').font = bold; st.getCell('A2').font = bold;
    st.getCell('A3').value = name;
    st.getRow(4).values = ['SLNO', 'Description Of Bars', 'Dia Of Bar (mm)', 'Spacing (m)', 'Shape / Length make-up', 'Length (m)', 'No of Bars', 'No of Mem.', 'Total Length (m)', 'Weight Of Bar Per RMT (kg)', 'Total Weight In Kgs'];
    st.getRow(4).font = bold; st.getRow(4).alignment = { wrapText: true };
    let sr = 5, sl = 0, lastMember = null;
    const firstSteel = sr;
    for (const x of e.bbs.rows) {
      if (x.member !== lastMember) { sl++; st.getRow(sr).values = [sl, x.member]; st.getRow(sr).font = bold; sr++; lastMember = x.member; }
      st.getRow(sr).values = ['', x.desc, x.dia, x.sp, x.shape, x.len, x.nb, x.nm];
      st.getCell(sr, 9).value = { formula: `F${sr}*G${sr}*H${sr}`, result: x.tl };
      st.getCell(sr, 10).value = { formula: `ROUND(C${sr}^2/162,3)`, result: x.w };
      st.getCell(sr, 11).value = { formula: `ROUND(I${sr}*J${sr},2)`, result: x.kg };
      sr++;
    }
    sr++;
    st.getCell(sr, 10).value = 'TOTAL'; st.getCell(sr, 11).value = { formula: `SUM(K${firstSteel}:K${sr - 2})`, result: e.bbs.total };
    st.getRow(sr).font = bold;
    const steelTot = sr;
    sr += 2;
    st.getCell(sr, 2).value = 'Dia-wise abstract'; st.getCell(sr, 2).font = bold; sr++;
    st.getRow(sr).values = ['', 'Dia (mm)', 'Wt (kg)']; sr++;
    const dws = sr;
    for (const [dia, kg] of Object.entries(e.bbs.byDia)) {
      st.getCell(sr, 2).value = +dia;
      st.getCell(sr, 3).value = { formula: `SUMIF(C${firstSteel}:C${steelTot - 2},B${sr},K${firstSteel}:K${steelTot - 2})`, result: kg };
      sr++;
    }
    st.getCell(sr, 2).value = 'Total'; st.getCell(sr, 3).value = { formula: `SUM(C${dws}:C${sr - 1})`, result: e.bbs.total };
    signatures(st, sr + 3, p);
    // patch detailed steel link
    const sref = totRef['IRR-CCDW-2-1'];
    dt.getCell(sref.cell).value = { formula: `steel!K${steelTot}`, result: e.bbs.total };

    // Abstract
    ab.columns = [{ width: 6 }, { width: 15 }, { width: 70 }, { width: 11 }, { width: 11 }, { width: 7 }, { width: 14 }, { width: 22 }];
    ab.getCell('A1').value = 'ABSTRACT'; ab.getCell('A1').font = { bold: true, size: 13 };
    ab.getCell('A3').value = name; ab.mergeCells('A3:G3'); ab.getCell('A3').alignment = wrap; ab.getRow(3).height = 30;
    ab.getRow(5).values = ['Sl.No.', 'Item Code', 'Description of Item', 'Qty', 'Rate', 'Unit', 'Amount in Rs.'];
    ab.getRow(6).values = [1, 2, 3, 4, 5, 6, 7];
    ab.getRow(5).font = bold;
    let ar = 7;
    for (const it of e.items) {
      ab.getRow(ar).values = [it.sl, it.code, it.short];
      ab.getCell(ar, 3).alignment = wrap; ab.getRow(ar).height = 45;
      ab.getCell(ar, 4).value = { formula: `'detailed '!${totRef[it.code].cell}`, result: it.qty };
      ab.getCell(ar, 5).value = it.rate; ab.getCell(ar, 5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
      ab.getCell(ar, 6).value = it.unit;
      ab.getCell(ar, 7).value = { formula: `ROUND(D${ar}*E${ar},0)`, result: it.amount };
      if (it.rateNote) ab.getCell(ar, 8).value = it.rateNote;
      for (let c = 1; c <= 7; c++) ab.getCell(ar, c).border = box;
      ar++;
    }
    ab.getCell(ar, 6).value = 'ECV'; ab.getCell(ar, 7).value = { formula: `SUM(G7:G${ar - 1})`, result: e.ecv }; ab.getRow(ar).font = bold;
    const ecvCell = 'G' + ar;
    signatures(ab, ar + 3, p);

    // seigniorage
    sg.columns = [{ width: 6 }, { width: 42 }, { width: 3 }, { width: 5 }, { width: 5 }, { width: 10 }, { width: 8 }, { width: 10 }, { width: 8 }, { width: 11 }, { width: 8 }, { width: 11 }, { width: 8 }, { width: 11 }];
    sg.getCell('A1').value = 'Seigniorage Calculation'; sg.getCell('A1').font = bold;
    sg.getCell('A2').value = name;
    sg.getRow(5).values = ['S.No', 'Specification in Brief', '', 'Unit', '', 'Quantity', 'Earth/ Gravel', '', 'Metal/ Stone', '', ' NSand', '', 'M Sand'];
    sg.getRow(7).values = ['', '', '', '', '', '', 'Factor', 'Quantity', 'Factor', 'Quantity', 'Factor', 'Quantity', 'Factor', 'Quantity'];
    sg.getRow(5).font = bold;
    let gr = 8;
    const gFirst = gr;
    e.seig.forEach((s, i) => {
      const it = e.items.find((x) => s.name.endsWith(x.code));
      sg.getRow(gr).values = [i + 1, s.name, '', 1, 'cum'];
      sg.getCell(gr, 6).value = { formula: `'detailed '!${totRef[it.code].cell}`, result: s.qty };
      sg.getCell(gr, 9).value = s.f[0]; sg.getCell(gr, 10).value = { formula: `F${gr}*I${gr}`, result: s.metal };
      sg.getCell(gr, 11).value = s.f[1]; sg.getCell(gr, 12).value = { formula: `F${gr}*K${gr}`, result: s.nsand };
      sg.getCell(gr, 13).value = s.f[2]; sg.getCell(gr, 14).value = { formula: `F${gr}*M${gr}`, result: s.msand };
      gr++;
    });
    const tq = gr;
    sg.getCell(tq, 1).value = 'Total Quantity';
    for (const [c, k] of [['J', 'metal'], ['L', 'nsand'], ['N', 'msand']]) sg.getCell(`${c}${tq}`).value = { formula: `SUM(${c}${gFirst}:${c}${tq - 1})`, result: e.seigTot[k] };
    sg.getCell(tq + 1, 1).value = 'Rate';
    sg.getCell(`J${tq + 1}`).value = e.seigRates.metal; sg.getCell(`L${tq + 1}`).value = e.seigRates.nsand; sg.getCell(`N${tq + 1}`).value = e.seigRates.msand;
    sg.getCell(tq + 2, 1).value = 'Amount Rs';
    for (const [c, k] of [['J', 'metal'], ['L', 'nsand'], ['N', 'msand']]) sg.getCell(`${c}${tq + 2}`).value = { formula: `ROUND(${c}${tq + 1}*${c}${tq},0)`, result: e.seigAmt[k] };
    sg.getCell(tq + 3, 1).value = 'Total Rs'; sg.getCell(`H${tq + 3}`).value = { formula: `SUM(J${tq + 2}:N${tq + 2})`, result: e.seigTotal };
    sg.getCell(tq + 4, 1).value = `DMF at ${e.ga.dmf * 100} % on Seigniorage`; sg.getCell(`H${tq + 4}`).value = { formula: `ROUND(H${tq + 3}*${e.ga.dmf},0)`, result: e.dmf };
    sg.getCell(tq + 5, 1).value = `SMFT at ${e.ga.smet * 100} % on Signiorage`; sg.getCell(`H${tq + 5}`).value = { formula: `ROUND(H${tq + 3}*${e.ga.smet},0)`, result: e.smet };
    sg.getCell(tq + 6, 2).value = `permit fee ${e.ga.permit * 100}% on metal`; sg.getCell(`H${tq + 6}`).value = { formula: `(J${tq + 2}+N${tq + 2})*${e.ga.permit}`, result: e.permit };
    const seigTotCell = `H${tq + 3}`, dmfCell = `H${tq + 4}`, permitCell = `H${tq + 6}`;
    signatures(sg, tq + 9, p);

    // theoretical requirement
    th.columns = [{ width: 42 }, { width: 3 }, { width: 11 }, { width: 3 }, { width: 8 }, { width: 3 }, { width: 12 }, { width: 6 }];
    th.getCell('A1').value = 'Theoritical Requirement'; th.getCell('A1').font = bold;
    th.getCell('A2').value = name;
    let tr = 4;
    th.getCell(tr, 1).value = '1.Theoritical requirement for Metal'; th.getCell(tr, 1).font = bold; tr++;
    const m0 = tr;
    for (const t of e.theo) { th.getRow(tr).values = [t.name, '', t.qty, 'x', t.fm, '']; th.getCell(tr, 7).value = { formula: `C${tr}*E${tr}`, result: t.metal }; tr++; }
    th.getCell(tr, 5).value = 'Total'; th.getCell(tr, 7).value = { formula: `SUM(G${m0}:G${tr - 1})`, result: e.theo.reduce((s, t) => s + t.metal, 0) }; th.getCell(tr, 8).value = 'Cum'; tr += 2;
    th.getCell(tr, 1).value = '2.Theoritical requirement for Sand'; th.getCell(tr, 1).font = bold; tr++;
    const s0 = tr;
    for (const t of e.theo) { th.getRow(tr).values = [t.name, '', t.qty, 'x', t.fs, '']; th.getCell(tr, 7).value = { formula: `C${tr}*E${tr}`, result: t.sand }; tr++; }
    th.getCell(tr, 5).value = 'Total'; th.getCell(tr, 7).value = { formula: `SUM(G${s0}:G${tr - 1})`, result: e.theo.reduce((s, t) => s + t.sand, 0) }; th.getCell(tr, 8).value = 'Cum';

    // General abstract
    ga.columns = [{ width: 6 }, { width: 70 }, { width: 16 }];
    ga.getCell('A1').value = 'GENERAL ABSTRACT'; ga.getCell('A1').font = { bold: true, size: 13 };
    ga.getCell('A2').value = name; ga.mergeCells('A2:C2'); ga.getCell('A2').alignment = wrap; ga.getRow(2).height = 30;
    ga.getRow(3).values = ['S.No', 'DESCRIPTION OF WORK', 'Amount in Rs.']; ga.getRow(3).font = bold;
    ga.getCell('B4').value = 'Part A   (Item Works)'; ga.getCell('B4').font = bold;
    ga.getRow(5).values = [1, 'Total ECV Amount']; ga.getCell('C5').value = { formula: `Abstract!${ecvCell}`, result: e.ecv };
    ga.getCell('B6').value = 'Total Rs.'; ga.getCell('C6').value = { formula: 'SUM(C5:C5)', result: e.ecv };
    ga.getCell('B7').value = 'Part B'; ga.getCell('B7').font = bold;
    const gab = e.genAbst;
    ga.getRow(8).values = [2, gab[1][0]]; ga.getCell('C8').value = { formula: `C6*${e.ga.labourCess}`, result: e.lc };
    ga.getRow(9).values = [3, gab[2][0]]; ga.getCell('C9').value = { formula: `ROUND(C6*${e.ga.nac},0)`, result: e.nac };
    ga.getRow(10).values = [4, gab[3][0]]; ga.getCell('C10').value = { formula: `seignorage!${seigTotCell}`, result: e.seigTotal };
    ga.getRow(11).values = [5, gab[4][0]]; ga.getCell('C11').value = { formula: `ROUND(${e.ga.smet}*C10,0)`, result: e.smet };
    ga.getRow(12).values = [6, gab[5][0]]; ga.getCell('C12').value = { formula: `seignorage!${dmfCell}`, result: e.dmf };
    ga.getRow(13).values = [7, gab[6][0]]; ga.getCell('C13').value = { formula: `seignorage!${permitCell}`, result: e.permit };
    ga.getCell('B14').value = 'Sub Total'; ga.getCell('C14').value = { formula: 'SUM(C8:C13)', result: e.partB };
    ga.getRow(15).values = [8, gab[7][0]]; ga.getCell('C15').value = { formula: `(C6+C14)*${e.ga.gst}`, result: e.gst };
    ga.getRow(16).values = [9, gab[8][0]]; ga.getCell('C16').value = { formula: `ROUNDUP((C6+C14+C15)/1000,0)*1000-(C6+C14+C15)+${e.ga.roundExtra}`, result: e.rounding };
    ga.getCell('B17').value = ' Total Rs.'; ga.getCell('C17').value = { formula: 'C16+C15+C14+C6', result: e.total };
    ga.getCell('B18').value = 'Or Say (LAKHS)'; ga.getCell('C18').value = { formula: 'C17/100000', result: +e.lakhs.toFixed(2) };
    ga.getRow(17).font = bold; ga.getRow(18).font = bold;
    for (let r = 3; r <= 18; r++) for (let c = 1; c <= 3; c++) ga.getCell(r, c).border = box;
    for (let r = 5; r <= 17; r++) ga.getCell(r, 3).numFmt = '#,##0.00';
    signatures(ga, 21, p);
    return wb;
  }

  async function download(wb, filename) {
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return BD.saveBlob(blob, filename);
  }

  Object.assign(BD, { designWorkbook, estimateWorkbook, downloadWorkbook: download });
})(typeof window !== 'undefined' ? window : globalThis);
