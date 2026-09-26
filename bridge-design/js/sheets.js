/*
 * Drawing sheets (A2 landscape, 594 x 420 mm), laid out like the reference
 * SLRB drawings:
 *   Sheet 1 - Sectional elevation, half plan at top / at foundation, notes,
 *             hydraulic particulars, particulars of road, trial pit.
 *   Sheet 2 - Deck slab / approach slab / bed block / kerb reinforcement,
 *             abutment and wing wall sections, stress table, reinforcement
 *             schedule.
 * All geometry comes from the design result, so the drawings follow any
 * change of HPs or dimensions.
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});
  const W = 594, H = 420;
  const SCALES = [10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300];
  const mm = (v) => String(Math.round(v * 1000));
  const lv = (v) => (v >= 0 ? '+' : '') + v.toFixed(3);
  const pick = (wm, hm, wmm, hmm) => SCALES.find((s) => (wm * 1000) / s <= wmm && (hm * 1000) / s <= hmm) || 300;

  function frame(dw, d, no, title, scaleTxt) {
    const { p, R } = d;
    dw.rect(8, 8, 578, 404, 'BORDER', { w: 0.6 });
    dw.rect(566, 400, 20, 12, 'THIN');
    dw.text(576, 404.5, `${no}/2`, 2.2, 'TITLE', { anchor: 'middle' });
    // title block
    const x0 = 388, x1 = 586;
    const Y = [120, 104, 92, 83, 77, 71, 67, 27, 19, 8];
    dw.rect(x0, 8, x1 - x0, 112, 'OUTLINE', { w: 0.4 });
    for (const y of Y.slice(1, -1)) dw.line(x0, y, x1, y, 'THIN', { w: 0.2 });
    dw.text((x0 + x1) / 2, 113.5, (p.state.replace(/^GOVERNMENT OF /i, 'GOVERNMENT OF ') + '.').toUpperCase(), 2.6, 'TITLE', { anchor: 'middle' });
    dw.text((x0 + x1) / 2, 107, p.department.replace('IRRIGATION & CAD', 'I & CAD') + '.', 2.6, 'TITLE', { anchor: 'middle' });
    const now = R.nameOfWork.replace(/\.$/, '');
    const cut = now.lastIndexOf(' in ');
    dw.text((x0 + x1) / 2, 99, cut > 0 ? now.slice(0, cut) + ',' : now, 1.8, 'TEXT', { anchor: 'middle' });
    if (cut > 0) dw.text((x0 + x1) / 2, 95, now.slice(cut + 4) + '.', 1.8, 'TEXT', { anchor: 'middle' });
    dw.text(x0 + 2, 84.5, 'TITLE :', 1.6, 'TITLE');
    dw.text(x0 + 18, 87, title, 1.9, 'TEXT');
    dw.text(x0 + 2, 79, 'CONTRACTOR :', 1.6, 'TITLE');
    dw.text(x0 + 2, 73, 'PREPARED BY :', 1.6, 'TITLE');
    const cw = (x1 - x0) / 5;
    ['CHECKED BY', 'CHECKED BY', 'SUBMITTED BY', 'RECOMMENDED BY', 'APPROVED BY'].forEach((t, i) => {
      dw.text(x0 + cw * i + cw / 2, 68.2, t, 1.4, 'TITLE', { anchor: 'middle' });
      if (i) dw.line(x0 + cw * i, 71, x0 + cw * i, 27, 'THIN', { w: 0.2 });
    });
    dw.text(x0 + 2, 22, 'PREPARED FOR :', 1.4, 'TITLE'); dw.text(x0 + 32, 22, 'APPROVAL', 1.5, 'TEXT');
    dw.line(x0 + 66, 27, x0 + 66, 19, 'THIN', { w: 0.2 });
    dw.text(x0 + 68, 22, 'DRG NO : ----------', 1.4, 'TITLE');
    dw.line(x0 + 132, 27, x0 + 132, 19, 'THIN', { w: 0.2 });
    dw.text(x0 + 134, 22, 'SCALE:', 1.4, 'TITLE'); dw.text(x0 + 150, 22, scaleTxt, 1.5, 'TEXT');
    dw.text(x0 + 2, 12, 'PREPARED BY :', 1.4, 'TITLE');
    dw.line(x0 + 102, 19, x0 + 102, 8, 'THIN', { w: 0.2 });
    dw.text(x0 + 104, 12, 'CHECKED BY :  -------', 1.4, 'TITLE');
    dw.line(x0 + 180, 19, x0 + 180, 8, 'THIN', { w: 0.2 });
    dw.text(x0 + 182, 12, 'REV :', 1.4, 'TITLE');
  }

  // ------------------------------------------------------------ sheet 1
  function sheet1(d) {
    const { p, R } = d;
    const dw = new BD.Dwg(W, H);
    const s2 = p.span / 2, fb = p.frontBatter, bbw = 0.5;
    const typ = R.typ;
    // ---------------- sectional elevation
    const halfL = s2 + p.abTopW + p.approachLen + 0.6;
    const halfF = s2 - fb + R.stemBase + p.abHeel + 0.2;
    const ext = Math.max(halfL, halfF);
    const hTot = p.frl - p.foundationLevel + 1.6;
    const se = pick(2 * ext + 1, hTot, 330, 100);
    const datum = p.foundationLevel;
    const v = BD.view(dw, 190, 286, se);
    const y = (lvl) => lvl - datum;
    dw.title(190, 262, 'SECTIONAL ELEVATION');
    for (const sg of [-1, 1]) {
      const X = (x) => sg * x;
      const P = (pts) => pts.map(([a, b]) => [X(a), b]);
      // footing
      const fx0 = s2 - fb - p.abToe, fx1 = s2 - fb + R.stemBase + p.abHeel;
      v.solid(P([[fx0, 0], [fx1, 0], [fx1, y(R.ftgTop)], [fx0, y(R.ftgTop)]]), 'OUTLINE', { density: 0.1 });
      // stem
      v.solid(P([[s2 - fb, y(R.ftgTop)], [s2, y(R.stemTop)], [s2 + bbw, y(R.stemTop)], [s2 + bbw, y(R.deckTop)], [s2 + p.abTopW, y(R.deckTop)], [s2 + p.abTopW + p.abBackBatter, y(R.ftgTop)]]), 'OUTLINE', { density: 0.1 });
      // bed block
      v.poly(P([[s2, y(R.stemTop)], [s2 + bbw, y(R.stemTop)], [s2 + bbw, y(R.soffit)], [s2, y(R.soffit)]]));
      // approach slab + wearing coat
      const ax0 = s2 + p.abTopW, ax1 = ax0 + p.approachLen;
      v.solid(P([[ax0, y(R.approachBot)], [ax1, y(R.approachBot)], [ax1, y(R.deckTop)], [ax0, y(R.deckTop)]]), 'OUTLINE', { density: 0.08 });
      v.poly(P([[ax0, y(R.deckTop)], [ax1, y(R.deckTop)], [ax1, y(p.frl)], [ax0, y(p.frl)]]), true, 'THIN');
      // road arrow
      v.line(X(ax1), y(p.frl), X(ax1 + 0.5), y(p.frl), 'OUTLINE');
      dw.poly([[v.X(X(ax1 + 0.55)), v.Y(y(p.frl))], [v.X(X(ax1 + 0.3)), v.Y(y(p.frl)) + 0.9], [v.X(X(ax1 + 0.3)), v.Y(y(p.frl)) - 0.9]], true, 'OUTLINE', { fill: true });
      v.text(X(ax1 + 0.2), y(p.frl) + 0.15, 'ROAD', 1.8, 'TEXT', { anchor: 'middle' });
      v.level(X(ax0 + 1.4), y(p.frl), `R.C.L${lv(p.frl)}`);
      v.text(X(ax1 + 0.15), y(R.approachBot) - 0.15, lv(R.approachBot), 1.6, 'TEXT', { anchor: sg > 0 ? 'start' : 'end' });
      // levels at abutment
      v.text(X(s2 + bbw + 0.35), y(R.soffit) - 0.12, lv(R.soffit), 1.6, 'TEXT', { anchor: sg > 0 ? 'start' : 'end' });
      v.text(X(s2 + bbw + 0.35), y(R.stemTop) - 0.12, lv(R.stemTop), 1.6, 'TEXT', { anchor: sg > 0 ? 'start' : 'end' });
      v.text(X(fx1 + 0.1), y(R.ftgTop) - 0.05, lv(R.ftgTop), 1.6, 'TEXT', { anchor: sg > 0 ? 'start' : 'end' });
      v.text(X(fx1 + 0.1), -0.05, lv(p.foundationLevel), 1.6, 'TEXT', { anchor: sg > 0 ? 'start' : 'end' });
      // kerb / railing (beyond)
      const kx0 = s2 + p.bearingW, kTop = y(R.deckTop) + p.kerbH;
      v.poly(P([[kx0 - 0.3, y(R.deckTop)], [kx0, y(R.deckTop)], [kx0, kTop + 0.95], [kx0 - 0.08, kTop + 1.05], [kx0 - 0.22, kTop + 1.05], [kx0 - 0.3, kTop + 0.95]]), true, 'OUTLINE', { w: 0.25 });
      v.poly(P([[0.9 * s2 - 0.1, kTop], [0.9 * s2 + 0.1, kTop], [0.9 * s2 + 0.1, kTop + 0.8], [0.9 * s2 - 0.1, kTop + 0.8]]), true, 'THIN');
      for (const hh of [0.25, 0.45, 0.65]) v.line(X(kx0 - 0.3), kTop + hh, X(0.25 * s2), kTop + hh, 'THIN', { w: 0.2 });
      // dims below footing
      const yd = -0.45;
      v.dimH(X(fx0), X(fx1), 0, mm(R.ftgW), -14);
      v.dimH(X(s2 - fb), X(s2 - fb + R.stemBase), 0, mm(R.stemBase), -8);
      const segs = [[fx0, s2 - fb, p.abToe], [s2 - fb, s2, fb], [s2, s2 + p.abTopW, p.abTopW], [s2 + p.abTopW, s2 + p.abTopW + p.abBackBatter, p.abBackBatter], [s2 + p.abTopW + p.abBackBatter, fx1, p.abHeel]];
      for (const [a, b, val] of segs) v.dimH(X(a), X(b), y(R.ftgTop), mm(val), 2.5, { h: 1.5 });
      void yd;
      // top dims
      v.dimH(X(ax0), X(ax1), y(R.deckTop), mm(p.approachLen), (hTot - y(R.deckTop)) * v.k - 5);
      v.dimH(X(s2), X(ax0), y(R.deckTop), mm(p.abTopW), (hTot - y(R.deckTop)) * v.k - 5);
      v.dimV(0, y(R.ftgTop), X(fx1), mm(p.footingT), sg * 6);
      v.dimV(y(R.stemTop), y(R.soffit), X(s2), mm(p.bedBlockT), -sg * 3, { h: 1.5 });
    }
    // deck + WC + joint
    const dx = s2 + p.bearingW;
    v.poly([[-dx, y(R.soffit)], [dx, y(R.soffit)], [dx, y(R.deckTop)], [-dx, y(R.deckTop)]], true, 'OUTLINE', { w: 0.4 });
    v.poly([[-dx, y(R.deckTop)], [dx, y(R.deckTop)], [dx, y(p.frl)], [-dx, y(p.frl)]], true, 'THIN');
    v.dimH(-s2, s2, y(R.deckTop), mm(p.span), (hTot - y(R.deckTop)) * v.k - 5);
    v.dimV(y(R.soffit), y(R.deckTop), 0.35 * s2, mm(p.D), 0, { h: 1.5 });
    // canal
    const cb = R.clearCBL / 2;
    v.poly([[-cb, y(p.cbl)], [cb, y(p.cbl)], [cb, y(p.cbl - p.apronThk)], [-cb, y(p.cbl - p.apronThk)]], true, 'OUTLINE', { w: 0.25 });
    for (const sg of [-1, 1]) {
      v.line(sg * p.bedWidth / 2, y(p.cbl), sg * R.topTBL / 2, y(R.tbl), 'HIDDEN');
      v.line(sg * R.topTBL / 2, y(R.tbl), sg * (R.topTBL / 2 + 1.2), y(R.tbl), 'HIDDEN');
    }
    const fw = R.clearFSLw / 2;
    v.line(-fw, y(R.fsl), fw, y(R.fsl), 'WATER', { w: 0.2 });
    for (const xx of [-0.45 * fw, 0.45 * fw]) for (const [dl, dd] of [[0.18, 0.08], [0.12, 0.16], [0.06, 0.24]]) v.line(xx - dl, y(R.fsl) - dd, xx + dl, y(R.fsl) - dd, 'WATER', { w: 0.15 });
    v.text(0.05, y(R.fsl) + 0.08, `F.S.L${lv(R.fsl)}`, 1.7, 'TEXT');
    v.text(0.05, y(p.cbl) + 0.08, `CBL${lv(p.cbl)}`, 1.7, 'TEXT');
    v.dimV(y(p.cbl), y(R.fsl), -0.12 * fw, mm(p.fsd), 0, { h: 1.5 });
    v.dimH(-p.bedWidth / 2, p.bedWidth / 2, y(p.cbl), mm(p.bedWidth), -6, { h: 1.6 });
    // centre line
    v.line(0, -0.3, 0, hTot - 0.2, 'CENTER', { w: 0.2 });
    // labels
    const topY = v.Y(hTot);
    dw.leader(v.X(-s2 - p.abTopW - 1.6), v.Y(y(p.frl) - 0.04), v.X(-s2 - p.abTopW - 1.6) - 6, topY + 5, `${mm(p.wc)} THICK WEARING COAT WITH M20`, { right: false });
    dw.leader(v.X(-s2 - p.abTopW - 0.7), v.Y(y(R.approachBot) + 0.15), v.X(-s2 - p.abTopW - 0.7) + 1, topY + 1, `${mm(p.approachThk)} THICK APPROACH SLAB WITH M20`, { right: false });
    dw.leader(v.X(-s2 - p.bearingW - 0.01), v.Y(y(R.deckTop) + 0.1), v.X(-s2 - p.bearingW) + 6, topY + 9, '20 THK. EXP. JOINT(TYP)');
    dw.leader(v.X(-0.2 * s2), v.Y(y(R.soffit) + p.D * 0.5), v.X(-0.2 * s2) + 3, topY + 5, `${mm(p.D)} THK. RCC SLAB WITH M20`);
    dw.leader(v.X(s2 + p.bearingW - 0.15), v.Y(y(R.deckTop) + p.kerbH * 0.6), v.X(s2 + p.bearingW) + 4, topY + 1, 'KERB');
    dw.leader(v.X(-s2 - p.bearingW + 0.15), v.Y(y(R.deckTop) + p.kerbH + 0.9), v.X(-s2 - p.bearingW) - 4, topY + 12, 'MOST STANDARD (HAND RAILING)', { right: false });

    // ---------------- half plans
    const B2 = R.B / 2;
    const sx = 0.25 * p.wingLen;
    const planHalfY = B2 + p.wingLen + 0.5;
    const planHalfX = s2 + p.abTopW + p.approachLen + 0.4;
    const sp = pick(2 * planHalfX, 2 * planHalfY, 320, 170);
    const pv = BD.view(dw, 190, 160, sp);
    dw.title(190, pv.Y(-planHalfY) - 9, 'HALF PLAN AT TOP AND HALF PLAN AT FOUNDATION');
    pv.rect(-planHalfX, -planHalfY, 2 * planHalfX, 2 * planHalfY, 'THIN');
    pv.line(-planHalfX - 0.3, 0, planHalfX + 0.3, 0, 'CENTER', { w: 0.2 });
    pv.line(0, -planHalfY - 0.3, 0, planHalfY + 0.3, 'CENTER', { w: 0.2 });
    // road / deck bands
    for (const sg of [-1, 1]) pv.line(-planHalfX, sg * B2, planHalfX, sg * B2, 'THIN');
    for (const sgx of [-1, 1]) {
      const X = (x) => sgx * x;
      // ---- top plan (y > 0)
      pv.rect(Math.min(X(s2 + p.bearingW), X(s2 + p.bearingW)), 0, 0, 0);
      pv.line(X(s2 + p.bearingW), 0, X(s2 + p.bearingW), B2, 'OUTLINE');
      pv.line(X(s2 + p.abTopW), 0, X(s2 + p.abTopW), B2, 'OUTLINE');
      pv.line(X(s2 + bbw), 0, X(s2 + bbw), B2, 'THIN');
      pv.line(X(s2 + p.abTopW + p.approachLen), 0, X(s2 + p.abTopW + p.approachLen), B2, 'OUTLINE');
      pv.line(X(s2 - fb), 0, X(s2 - fb), B2, 'HIDDEN');
      pv.line(X(s2), 0, X(s2), B2, 'HIDDEN');
      // railing posts
      pv.rect(Math.min(X(s2 + p.bearingW - 0.35), X(s2 + p.bearingW)), B2 - p.kerbW - 0.05, 0.35, p.kerbW + 0.05, 'OUTLINE');
      // wing (top)
      const wTop = [[X(s2), B2], [X(s2 + sx), B2 + p.wingLen], [X(s2 + sx + p.wTopW), B2 + p.wingLen], [X(s2 + p.wTopW), B2]];
      pv.poly(wTop, true, 'OUTLINE');
      const wBase = [[X(s2 - p.wFrontBatter), B2], [X(s2 - p.wFrontBatter + sx), B2 + p.wingLen], [X(s2 - p.wFrontBatter + sx + p.wBaseW), B2 + p.wingLen], [X(s2 - p.wFrontBatter + p.wBaseW), B2]];
      pv.poly(wBase, true, 'HIDDEN');
      const rx0 = s2 + sx + p.wTopW;
      pv.poly([[X(rx0), B2 + p.wingLen - 1.1], [X(rx0 + 1.0), B2 + p.wingLen - 1.1], [X(rx0 + 1.0), B2 + p.wingLen], [X(rx0), B2 + p.wingLen]], true, 'OUTLINE');
      // canal banks (top half beyond deck)
      pv.line(X(p.bedWidth / 2), B2, X(p.bedWidth / 2), planHalfY, 'THIN');
      pv.line(X(R.topTBL / 2), B2 + 0.2, X(R.topTBL / 2), planHalfY, 'THIN');
      for (let yy = B2 + 0.4; yy < planHalfY - 0.2; yy += 0.5) pv.line(X(R.topTBL / 2), yy, X(R.topTBL / 2 - 0.22), yy, 'THIN', { w: 0.15 });
      pv.text(X((p.bedWidth + R.topTBL) / 4), B2 + p.wingLen * 0.72, `SLOPE ${p.sideSlope}:1`, 1.6, 'TEXT', { anchor: 'middle' });
      pv.text(X(R.topTBL / 2 + 0.1), B2 + p.wingLen - 0.1, `TBL${lv(R.tbl)}`, 1.4, 'TEXT', { anchor: 'start', rot: 90 * sgx });
      pv.text(X(planHalfX - 0.6), B2 + p.wingLen * 0.55, `G.L ${lv(p.gl)}`, 1.6, 'TEXT', { anchor: 'middle', rot: sgx > 0 ? 90 : 0 });
      pv.dimH(X(s2 + sx + p.wTopW - 1.0 + 1.0), X(s2 + sx + p.wTopW + 1.0), B2 + p.wingLen, '1000', 3, { h: 1.4 });
      pv.dimV(B2, B2 + p.wingLen, X(s2 + sx + p.wTopW + 1.0), mm(p.wingLen), sgx * 4, { h: 1.5 });
      // ---- foundation plan (y < 0)
      const fx0 = s2 - fb - p.abToe, fx1 = s2 - fb + R.stemBase + p.abHeel;
      pv.solid([[X(fx0), -B2], [X(fx1), -B2], [X(fx1), 0], [X(fx0), 0]], 'OUTLINE', { density: 0.08 });
      pv.line(X(s2 - fb), -B2, X(s2 - fb), 0, 'HIDDEN');
      pv.line(X(s2 - fb + R.stemBase), -B2, X(s2 - fb + R.stemBase), 0, 'HIDDEN');
      const wf0 = s2 - p.wFrontBatter - p.wToe;
      const wf = [[X(wf0), -B2], [X(wf0 + R.wFtgW), -B2], [X(wf0 + R.wFtgW + sx), -B2 - p.wingLen], [X(wf0 + sx), -B2 - p.wingLen]];
      pv.solid(wf, 'OUTLINE', { density: 0.08 });
      pv.poly([[X(wf0), -B2 - 0.2], [X(wf0 + p.keyW), -B2 - 0.2], [X(wf0 + p.keyW + sx * 0.9), -B2 - p.wingLen + 0.05], [X(wf0 + sx * 0.9), -B2 - p.wingLen + 0.05]], true, 'HIDDEN');
      pv.poly([[X(rx0 - 0.5), -B2 - p.wingLen], [X(rx0 + 1.5), -B2 - p.wingLen], [X(rx0 + 1.5), -B2 - p.wingLen + 2.1 > -B2 ? -B2 : -B2 - p.wingLen + 2.1], [X(rx0 - 0.5), -B2 - p.wingLen + 2.1 > -B2 ? -B2 : -B2 - p.wingLen + 2.1]], true, 'HIDDEN');
      pv.line(X(p.bedWidth / 2), -planHalfY, X(p.bedWidth / 2), 0, 'THIN');
      pv.line(X(R.topTBL / 2), -planHalfY, X(R.topTBL / 2), -B2 - 0.2, 'THIN');
      pv.text(X(planHalfX - 0.6), -B2 - p.wingLen * 0.45, `G.L ${lv(p.gl)}`, 1.6, 'TEXT', { anchor: 'middle', rot: sgx > 0 ? 90 : 0 });
      pv.dimH(X(fx0), X(fx1), -B2 / 2, mm(R.ftgW), 0, { h: 1.5 });
      pv.dimH(X(s2 + p.abTopW), X(s2 + p.abTopW + p.approachLen), B2 * 0.35, mm(p.approachLen), 0, { h: 1.5 });
    }
    pv.dimH(-s2, s2, B2 * 0.6, mm(p.span), 0, { h: 1.6 });
    
    pv.dimV(-B2, B2, planHalfX - 1.4, mm(R.B), 0, { h: 1.5 });
    pv.dimH(-p.bedWidth / 2, p.bedWidth / 2, planHalfY - 0.3, mm(p.bedWidth), 0, { h: 1.5 });
    pv.text(-planHalfX + 0.4, B2 * 0.8, 'HALF PLAN AT TOP', 1.9, 'LABEL');
    pv.text(-planHalfX + 0.4, -B2 * 0.8, 'HALF PLAN AT FOUNDATION', 1.9, 'LABEL');
    pv.text(0.15, B2 * 0.1, `R.C.L${lv(p.frl)}`, 1.6, 'TEXT');
    for (const sg of [1, -1]) {
      const yc = sg * (B2 + p.wingLen * 0.5);
      pv.text(-0.25, yc - 0.6, 'CANAL FLOW', 2.2, 'TEXT', { rot: 90, bold: true });
      pv.line(0.35, yc - 0.6, 0.35, yc + 0.6, 'OUTLINE');
      dw.poly([[pv.X(0.35), pv.Y(yc + 0.7)], [pv.X(0.35) - 0.9, pv.Y(yc + 0.7) - 2.4], [pv.X(0.35) + 0.9, pv.Y(yc + 0.7) - 2.4]], true, 'OUTLINE', { fill: true });
    }
    pv.text(0.1, B2 + 0.35, `CBL${lv(p.cbl)}`, 1.5, 'TEXT');

    // ---------------- notes
    const notes = [
      'ALL THE DIMENSIONS ARE IN MILLIMETERS AND LEVELS ARE IN METERS',
      'WRITTEN DIMENSIONS ONLY SHALL BE FOLLOWED',
      `THE ${typ} IS DESIGNED FOR A CARRIAGE WAY WIDTH OF ${p.carriageway.toFixed(2)} m AND FOR ${p.bridgeType === 'DLRB' ? 'TWO LANES OF CLASS-A / ONE LANE OF CLASS 70R' : 'CLASS- A'} LOADING.`,
      `THE ABUTMENTS ARE DESIGNED FOR EARTH PRESSURE COMPUTED BY RANKINE THEORY TAKING THE WEIGHT OF CONCRETE AS 2400 KG/CUM AND ANGLE OF INTERNAL FRICTION AS ${p.phi} DEGREES AND THE WEIGHT OF EARTH AS ${Math.round(p.gammaSoil * 1000)} Kg/cum.`,
      `THE FILLING BEHIND THE ABUTMENT SHALL BE DONE SIMULTANEOUSLY WITH THE RAISING OF THE STRUCTURE WITH SOILS OF Ø VALUE NOT LESS THAN ${p.phi}° AND PERMEABILITY K NOT MORE THAN 3 M/YEAR.`,
      'DESIGN CODES: IRC 5-2015, IRC 6-2017, IRC 21-2000, IRC 78-2014, IRC SP:13-2004, IS 456, IS 1786.',
      'MINIMUM COVER TO ALL REINFORCEMENT INCLUDING STIRRUPS SHALL BE 40 MM.',
      'ALL REINFORCING STEEL SHALL BE OF HIGH YIELD STRENGTH DEFORMED BARS (Fe 415) CONFORMING TO IS 1786.',
      'JOINTS OR LAPPING OF BARS IN MAIN REINFORCEMENT SHALL BE AVOIDED AS FAR AS POSSIBLE. IF INEVITABLE, CLAUSE 304.6.6 OF IRC 21-2000 SHALL BE STRICTLY FOLLOWED.',
      'BENDING OF REINFORCEMENT BARS SHALL BE AS PER IS 2502. SUPPORTING CHAIRS OF 10 MM DIA SHALL BE PROVIDED AT SUITABLE INTERVALS AS PER IS 2502.',
      'CONCRETE SHALL BE PROVIDED IN MECHANICAL MIXERS OF CAPACITY NOT LESS THAN 200 LITRES. PROPER COMPACTION SHALL BE ENSURED BY USE OF FORM AND NEEDLE VIBRATORS.',
      'GRADES OF CONCRETE:',
      '   PCC M15 WITH 40MM M.S.A FOR FOUNDATION.',
      '   CC M15 WITH 15% PLUMS FOR ABUTMENT WALL, WING WALL AND RETURNS.',
      '   RCC M20 WITH 20MM M.S.A FOR DECK SLAB, BED BLOCKS, APPROACH SLAB, KERB, WEARING COAT.',
      '   CC M15 WITH 20MM M.S.A FOR CANAL FLOOR / LINING.',
      'THE EXPANSION JOINT MUST BE ROBUST, DURABLE, WATERTIGHT AND REPLACEABLE. IT MUST BE PROVIDED OVER FULL WIDTH OF SUPER STRUCTURE INCLUDING KERB.',
      'THE EXPANSION JOINT SHALL CATER FOR A TOTAL MOVEMENT OF 20 MM.',
      'THE DETAILS OF DRAINAGE SPOUT SHALL BE PROVIDED AS PER M.O.S.T DRAWING.',
      'THE HAND RAILING AND OTHER DETAILS SHALL BE AS PER MOST DRG NO. SD/202.',
      `THE PROPOSED ROAD LEVEL SHALL BE CONNECTED TO THE EXISTING ROAD LEVEL SUITABLY AS PER SITE CONDITIONS${p.frlNote ? ' (' + p.frlNote.replace(/^FRL adopted = /i, '').replace(/\.$/, '').toUpperCase() + ')' : ''}.`,
      `${mm(p.liningThk)} MM THICK CANAL LINING IN C.C. M15 GRADE SHALL BE PROVIDED UPTO ${p.liningLen}M LENGTH ON EITHER SIDE WITH 300 x 1000 CC M15 CURTAIN WALLS AT BOTH ENDS (IRC SP:13 / IRC 89).`,
      `SBC ASSUMED ${p.sbc} t/sqm - TO BE CONFIRMED BY TRIAL PIT BEFORE EXECUTION.`,
    ];
    dw.text(392, 402, 'NOTES:', 2.4, 'TITLE');
    dw.line(392, 400.5, 408, 400.5, 'TITLE', { w: 0.2 });
    let ny = 396, k = 0;
    for (const n of notes) {
      const indent = n.startsWith('   ');
      const lines = wrapText(indent ? n.trim() : n, 100);
      lines.forEach((ln, i) => {
        const pre = !indent && i === 0 ? `${++k}) ` : '';
        dw.text(indent ? 398 : i === 0 ? 392 : 396, ny, pre + ln, 1.25, 'TEXT');
        ny -= 2.6;
      });
    }
    // HP table
    const hy = Math.min(ny - 6, 282);
    dw.title(484, hy, `HYDRAULIC PARTICULARS OF THE CANAL @ ${p.chainage} KM`, 2.4);
    const hp = [
      ['S.No.', 'DESCRIPTION', 'PARTICULARS'],
      ['1.', 'DISCHARGE (Q)', `${p.Q.toFixed(3)} Cumecs.`],
      ['2.', 'BED WIDTH', `${p.bedWidth.toFixed(3)} m`],
      ['3.', 'FSD', `${p.fsd.toFixed(3)} m`],
      ['4.', 'VELOCITY', `${R.vel.toFixed(3)} m/sec`],
      ['5.', "VALUE OF ' n '", `${p.manningN}`],
      ['6.', 'BED FALL', `1 IN ${p.bedFall}`],
      ['7.', 'SIDE SLOPES', `${p.sideSlope} : 1`],
      ['8.', 'FREE BOARD', `${p.freeBoard.toFixed(3)} m`],
      ['9.', 'TOP WIDTH OF BANKS (L/R)', `${p.bankWidthL.toFixed(3)} M / ${p.bankWidthR.toFixed(3)} M`],
      ['10.', 'CBL', lv(p.cbl) + ' m'],
      ['11.', 'FSL', lv(R.fsl) + ' m'],
      ['12.', 'TBL', lv(R.tbl) + ' m'],
      ['13.', 'GROUND LEVEL', lv(p.gl) + ' m'],
    ];
    dw.table(414, hy - 5, [12, 76, 52], hp, { rh: 4.3, h: 1.4 });
    // road particulars
    dw.title(290, 50, 'PARTICULARS OF ROAD.', 2.4);
    dw.table(228, 46, [12, 58, 60], [
      ['S.No.', 'DESCRIPTION', 'PARTICULARS'],
      ['1.', 'TYPE OF ROAD', p.roadType],
      ['2.', 'CONNECTION FROM', ''],
      ['3.', 'CONNECTING TO', ''],
      ['4.', 'ROAD WIDTH', `${p.carriageway.toFixed(2)} m`],
      ['5.', 'GROUND LEVEL', lv(p.gl) + ' m'],
      ['6.', 'PROPOSED ROAD LEVEL', lv(p.frl) + ' m'],
    ], { rh: 5, h: 1.5 });
    // trial pit
    dw.title(62, 50, 'TRAIL PIT PARTICULARS', 2.4);
    dw.text(52, 44, lv(p.gl), 1.5, 'TEXT', { anchor: 'end' });
    dw.rect(54, 12, 6, 32, 'OUTLINE', { w: 0.3 });
    dw.text(64, 35, 'TO BE RECORDED AT SITE', 1.5, 'TEXT');
    dw.text(64, 24, '(SOIL STRATA & SBC)', 1.5, 'TEXT');
    frame(dw, d, 1, `PLAN AND SECTIONAL ELEVATION OF ${typ} @ km ${p.chainage}`, `1:${se} / 1:${sp}`);
    return dw;
  }

  function wrapText(s, n) {
    const words = s.split(' '), out = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  // ------------------------------------------------------------ sheet 2
  function sheet2(d) {
    const { p, R } = d;
    const dw = new BD.Dwg(W, H);
    const c = p.cover;
    const L = R.deckL, B = R.B;
    // A. slab in span direction
    const s1 = pick(L + 0.4, p.D + 0.3, 250, 60);
    const va = BD.view(dw, 150 - (L * 1000) / s1 / 2, 360, s1);
    va.rect(0, 0, L, p.D, 'OUTLINE', { w: 0.45 });
    va.text(L / 2, p.D / 2, 'M20', 1.8, 'TEXT', { anchor: 'middle' });
    const yb = c + p.mainDia / 2000, yt = p.D - c - p.topDia / 2000;
    va.poly([[c, yb + 0.2], [c, yb], [L - c, yb], [L - c, yb + 0.2]], false, 'REBAR', { w: 0.45 });
    va.line(c, yt, L - c, yt, 'REBAR', { w: 0.35 });
    for (let x = c + 0.05; x <= L - c; x += p.distSpacing / 1000) va.circle(x, yb + (p.mainDia + p.distDia) / 2000, 0.45, 'REBAR', { fill: true });
    for (let x = c + 0.05; x <= L - c; x += p.topSpacing / 1000) va.circle(x, yt - (p.topDia * 1.0) / 1000, 0.45, 'REBAR', { fill: true });
    va.dimH(0, p.bearingW, p.D, mm(p.bearingW), 6);
    va.dimH(p.bearingW, L - p.bearingW, p.D, mm(p.span), 6);
    va.dimH(L - p.bearingW, L, p.D, mm(p.bearingW), 6);
    va.dimV(0, p.D, L, mm(p.D), 6);
    for (const x of [p.bearingW, L - p.bearingW]) va.line(x, -0.1, x, p.D + 0.4, 'THIN', { w: 0.15 });
    dw.leader(va.X(L * 0.28), va.Y(yt), va.X(L * 0.28) - 4, va.Y(p.D) + 16, `${p.topDia} DIA AT ${p.topSpacing} C/C (TOP, ALONG SPAN)`, { right: false });
    dw.leader(va.X(L * 0.75), va.Y(yt - 0.01), va.X(L * 0.75) + 3, va.Y(p.D) + 16, `${p.topDia} DIA AT ${p.topSpacing} C/C (TOP, ACROSS)`);
    dw.leader(va.X(L * 0.3), va.Y(yb), va.X(L * 0.3) - 8, va.Y(0) - 7, `${p.mainDia} DIA AT ${p.mainSpacing} C/C (MAIN, BOTTOM)`, { right: false });
    dw.leader(va.X(L * 0.7), va.Y(yb + 0.02), va.X(L * 0.7) + 8, va.Y(0) - 7, `${p.distDia} DIA AT ${p.distSpacing} C/C (DISTRIBUTION)`);
    dw.text(va.X(L / 2), va.Y(0) - 14, `(MAIN BARS ${p.mainDia} DIA @ ${p.mainSpacing} C/C STRAIGHT WITH 200 MM END BENDS)`, 1.4, 'TEXT', { anchor: 'middle' });
    dw.title(va.X(L / 2), va.Y(0) - 21, 'REINF. DETAILS OF SLAB IN SPAN DIRECTION');

    // B. slab in cross section
    const s2 = pick(B + 0.5, p.D + p.kerbH + 1.2, 250, 70);
    const vb = BD.view(dw, 150 - (B * 1000) / s2 / 2, 255, s2);
    vb.rect(0, 0, B, p.D, 'OUTLINE', { w: 0.45 });
    vb.text(B / 2, p.D / 2, 'M20', 1.8, 'TEXT', { anchor: 'middle' });
    for (const x0 of [0, B - p.kerbW]) {
      vb.rect(x0, p.D, p.kerbW, p.kerbH, 'OUTLINE', { w: 0.4 });
      vb.rect(x0 + p.kerbW * 0.1, p.D + p.kerbH, p.kerbW * 0.8, 1.1 - p.kerbH, 'THIN');
      vb.line(x0 + p.kerbW * 0.1, p.D + 0.75, x0 + p.kerbW * 0.9, p.D + 0.75, 'THIN', { w: 0.15 });
      vb.line(x0 + p.kerbW * 0.1, p.D + 0.95, x0 + p.kerbW * 0.9, p.D + 0.95, 'THIN', { w: 0.15 });
    }
    vb.rect(p.kerbW, p.D, p.carriageway, p.wc, 'THIN');
    const ybm = c + p.mainDia / 2000;
    for (let x = c + 0.03; x <= B - c; x += p.mainSpacing / 1000) vb.circle(x, ybm, 0.5, 'REBAR', { fill: true });
    vb.line(c, ybm + (p.mainDia + p.distDia) / 2000, B - c, ybm + (p.mainDia + p.distDia) / 2000, 'REBAR', { w: 0.35 });
    for (let x = c + 0.03; x <= B - c; x += p.topSpacing / 1000) vb.circle(x, p.D - c - p.topDia / 1000, 0.4, 'REBAR', { fill: true });
    vb.line(c, p.D - c - p.topDia / 2000 + 0.012, B - c, p.D - c - p.topDia / 2000 + 0.012, 'REBAR', { w: 0.3 });
    vb.dimH(0, p.kerbW, p.D + p.kerbH, mm(p.kerbW), 2, { h: 1.5 });
    vb.dimH(p.kerbW, B - p.kerbW, p.D + p.kerbH, mm(p.carriageway), 2);
    vb.dimH(B - p.kerbW, B, p.D + p.kerbH, mm(p.kerbW), 2, { h: 1.5 });
    vb.dimH(0, B, 0, mm(B), -10);
    vb.dimV(0, p.D, 0, mm(p.D), -5);
    vb.dimV(p.D, p.D + p.kerbH, 0, mm(p.kerbH), -5, { h: 1.5 });
    vb.dimV(p.D, p.D + 1.1, 0, '1100', -11);
    dw.leader(vb.X(B * 0.5), vb.Y(p.D + p.wc * 0.6), vb.X(B * 0.62), vb.Y(p.D) + 11, `${mm(p.wc)} THK WEARING COAT M20`);
    dw.leader(vb.X(B - p.kerbW * 0.5), vb.Y(p.D + p.kerbH * 0.5), vb.X(B) + 12, vb.Y(p.D) + 2, `KERB ${mm(p.kerbW)}x${mm(p.kerbH)} (M20)`);
    dw.leader(vb.X(B - p.kerbW * 0.5), vb.Y(p.D + 1.0), vb.X(B) - 6, vb.Y(p.D + 1.1) + 6, 'HAND RAILING POST (MOST SD/202)', { right: false });
    dw.leader(vb.X(B * 0.3), vb.Y(ybm + 0.015), vb.X(B * 0.25), vb.Y(0) - 5, `${p.distDia} DIA AT ${p.distSpacing} C/C (DISTRIBUTION)`, { right: false });
    dw.leader(vb.X(B * 0.7), vb.Y(ybm), vb.X(B * 0.75), vb.Y(0) - 5, `${p.mainDia} DIA AT ${p.mainSpacing} C/C (MAIN)`);
    dw.title(vb.X(B / 2), vb.Y(0) - 17, 'REINF. DETAILS OF SLAB IN CROSS SECTION');

    // C. approach slab
    const s3 = pick(p.approachLen + 0.3, p.approachThk, 150, 30);
    const vc = BD.view(dw, 360, 360, s3);
    vc.rect(0, 0, p.approachLen, p.approachThk, 'OUTLINE', { w: 0.45 });
    vc.text(p.approachLen / 2, p.approachThk / 2, 'M20', 1.8, 'TEXT', { anchor: 'middle' });
    for (const yy of [c + 0.006, p.approachThk - c - 0.006]) {
      vc.line(c, yy, p.approachLen - c, yy, 'REBAR', { w: 0.3 });
      for (let x = c + 0.03; x <= p.approachLen - c; x += 0.15) vc.circle(x, yy + (yy < 0.1 ? 0.012 : -0.012), 0.4, 'REBAR', { fill: true });
    }
    vc.dimH(0, p.approachLen, 0, mm(p.approachLen), -5);
    vc.dimV(0, p.approachThk, p.approachLen, mm(p.approachThk), 5);
    dw.leader(vc.X(p.approachLen * 0.3), vc.Y(p.approachThk - c), vc.X(p.approachLen * 0.3) - 2, vc.Y(p.approachThk) + 8, '12 DIA AT 150 C/C (T&B)', { right: false });
    dw.leader(vc.X(p.approachLen * 0.75), vc.Y(p.approachThk - c), vc.X(p.approachLen * 0.75) + 2, vc.Y(p.approachThk) + 8, '12 DIA AT 150 C/C (T&B)');
    dw.title(vc.X(p.approachLen / 2), vc.Y(0) - 12, `REINF. DETAIL OF APPROACH SLAB (1:${s3})`);

    // D. bed block & kerb (1:15)
    const vd = BD.view(dw, 440, 312, 15);
    vd.rect(0, 0, 0.5, p.bedBlockT, 'OUTLINE', { w: 0.45 });
    vd.text(0.25, p.bedBlockT / 2, 'M20', 1.6, 'TEXT', { anchor: 'middle' });
    for (const yy of [0.05, p.bedBlockT - 0.05]) { vd.line(0.04, yy, 0.46, yy, 'REBAR'); for (const x of [0.07, 0.25, 0.43]) vd.circle(x, yy + (yy < 0.1 ? 0.012 : -0.012), 0.5, 'REBAR', { fill: true }); }
    vd.dimH(0, 0.5, 0, '500', -4, { h: 1.5 });
    vd.dimV(0, p.bedBlockT, 0.5, mm(p.bedBlockT), 4, { h: 1.5 });
    dw.leader(vd.X(0.25), vd.Y(p.bedBlockT - 0.04), vd.X(0.25) + 6, vd.Y(p.bedBlockT) + 10, '10 DIA @ 150 C/C (T&B) BOTH WAYS');
    dw.title(vd.X(0.25), vd.Y(0) - 10, 'BED BLOCK (1:15)', 2.4);
    const ve = BD.view(dw, 548, 312, 15);
    ve.rect(0, 0, p.kerbW, p.kerbH, 'OUTLINE', { w: 0.45 });
    ve.poly([[0.04, 0.04], [p.kerbW - 0.04, 0.04], [p.kerbW - 0.04, p.kerbH - 0.04], [0.04, p.kerbH - 0.04]], true, 'REBAR', { w: 0.3 });
    ve.line(0.04, 0.04, 0.04, -0.08, 'REBAR', { w: 0.3 }); ve.line(p.kerbW - 0.04, 0.04, p.kerbW - 0.04, -0.08, 'REBAR', { w: 0.3 });
    for (const [x, yy] of [[0.055, 0.055], [p.kerbW - 0.055, 0.055], [0.055, p.kerbH - 0.055], [p.kerbW - 0.055, p.kerbH - 0.055]]) ve.circle(x, yy, 0.55, 'REBAR', { fill: true });
    ve.line(-0.1, 0, p.kerbW + 0.3, 0, 'THIN');
    ve.dimH(0, p.kerbW, p.kerbH, mm(p.kerbW), 3, { h: 1.5 });
    ve.dimV(0, p.kerbH, 0, mm(p.kerbH), -4, { h: 1.5 });
    dw.leader(ve.X(p.kerbW - 0.04), ve.Y(p.kerbH * 0.6), ve.X(0) - 2, ve.Y(p.kerbH) + 10, '4-10 DIA + 8 DIA STIRRUPS @ 200', { right: false });
    dw.title(ve.X(p.kerbW / 2), ve.Y(0) - 10, 'KERB (1:15)', 2.4);

    // E. stress table
    dw.text(392, 282, 'STRESS TABLE :', 2.3, 'TITLE');
    dw.text(530, 276.5, 'STRESS IN t/Sq.m.', 1.4, 'LABEL', { anchor: 'middle' });
    const f3 = (x) => (x >= 0 ? '+' : '') + x.toFixed(3);
    dw.table(392, 274, [14, 50, 32, 32, 32, 32], [
      ['S.NO.', 'DESCRIPTION', 'CONC. MAX', 'CONC. MIN', 'SOIL MAX', 'SOIL MIN'],
      ['1', 'ABUTMENT', f3(R.stemGov.smax), f3(R.stemGov.smin), f3(R.abWorst.pmax), f3(R.abWorst.pmin)],
      ['2', 'WING WALL', f3(R.ws.smax), f3(R.ws.smin), f3(R.w.pmax), f3(R.w.pmin)],
    ], { rh: 5.5, h: 1.5 });
    dw.text(392, 254, `SBC ASSUMED ${p.sbc} t/sqm.  FOS: ABUTMENT OVERTURNING ${R.abWorst.fosO.toFixed(2)}, SLIDING ${R.abWorst.fosS.toFixed(2)};  WING WALL ${R.w.fosO.toFixed(2)} / ${R.w.fosS.toFixed(2)} (WITH SHEAR KEY).`, 1.3, 'TEXT');
    // F. reinforcement schedule
    dw.text(392, 245, 'REINFORCEMENT SCHEDULE :', 2.3, 'TITLE');
    dw.table(392, 240, [44, 88, 52], [
      ['MEMBER', 'BARS', 'REMARKS'],
      ['Deck - bottom main', `${p.mainDia} dia @ ${p.mainSpacing} c/c, 200 end bends`, 'no bent up bars'],
      ['Deck - distribution', `${p.distDia} dia @ ${p.distSpacing} c/c (bottom)`, 'over main bars'],
      ['Deck - top', `${p.topDia} dia @ ${p.topSpacing} c/c both ways`, 'nominal'],
      ['Chairs', '10 dia, 1 No./sqm', 'IS 2502'],
      ['Kerb (2 Nos)', '4-10 dia + 8 dia stirrups @ 200', 'anchored in deck'],
      ['Bed block (2 Nos)', '10 dia @ 150 c/c T&B both ways', ''],
      ['Approach slab (2 Nos)', '12 dia @ 150 c/c T&B both ways', `${mm(p.approachLen)} x ${mm(B)} x ${mm(p.approachThk)}`],
      ['Hand railing', 'As per MOST Drg. No. SD/202', ''],
    ], { rh: 5, h: 1.45 });

    // G. abutment section
    const fb = p.frontBatter;
    const aW = p.abToe + R.stemBase + p.abHeel + 1.6;
    const aH = p.frl - p.foundationLevel + 0.4;
    const s4 = pick(aW + 0.6, aH, 170, 135);
    const vg = BD.view(dw, 38, 40, s4);
    const yl = (lvl) => lvl - p.foundationLevel;
    const x0 = 0, xs = p.abToe; // stem front toe at x = toe
    vg.solid([[x0, 0], [R.ftgW, 0], [R.ftgW, p.footingT], [x0, p.footingT]], 'OUTLINE', { density: 0.12 });
    vg.text(R.ftgW / 2, p.footingT / 2 - 0.05, 'PCC M15', 1.5, 'TEXT', { anchor: 'middle' });
    // stem, canal face on the right (like the reference)
    const Xm = (x) => R.ftgW - x;
    const stem = [[xs, yl(R.ftgTop)], [xs + fb, yl(R.stemTop)], [xs + fb + 0.5, yl(R.stemTop)], [xs + fb + 0.5, yl(R.deckTop)], [xs + fb + p.abTopW, yl(R.deckTop)], [xs + R.stemBase, yl(R.ftgTop)]].map(([a, b]) => [Xm(a), b]);
    vg.solid(stem, 'OUTLINE', { density: 0.12 });
    vg.poly([[Xm(xs + fb), yl(R.stemTop)], [Xm(xs + fb + 0.5), yl(R.stemTop)], [Xm(xs + fb + 0.5), yl(R.soffit)], [Xm(xs + fb), yl(R.soffit)]]);
    vg.text(Xm(xs + fb + 0.25), yl(R.stemTop) + 0.1, 'M20', 1.3, 'TEXT', { anchor: 'middle' });
    // deck & approach stubs
    vg.poly([[Xm(xs + fb + 0.5 - 0.02), yl(R.soffit)], [Xm(xs + fb - 0.6), yl(R.soffit)], [Xm(xs + fb - 0.6), yl(R.deckTop)], [Xm(xs + fb + 0.5 - 0.02), yl(R.deckTop)]], false, 'OUTLINE');
    vg.text(Xm(xs + fb), yl(R.soffit) + p.D / 2 - 0.05, 'M20', 1.3, 'TEXT', { anchor: 'middle' });
    vg.poly([[Xm(xs + fb + p.abTopW), yl(R.approachBot)], [Xm(xs + fb + p.abTopW + 1.4), yl(R.approachBot)], [Xm(xs + fb + p.abTopW + 1.4), yl(R.deckTop)], [Xm(xs + fb + p.abTopW), yl(R.deckTop)]], false, 'OUTLINE');
    vg.text(Xm(xs + fb + p.abTopW + 0.7), yl(R.approachBot) + 0.1, 'M20', 1.3, 'TEXT', { anchor: 'middle' });
    vg.line(Xm(xs + fb + p.abTopW + 1.6), yl(p.frl), Xm(xs + fb - 0.6), yl(p.frl), 'THIN');
    vg.text(Xm(xs + fb + p.abTopW + 1.65), yl(p.frl) - 0.02, `R.C.L${lv(p.frl)}`, 1.5, 'TEXT', { anchor: 'end' });
    vg.text(Xm(xs + fb + p.abTopW + 1.65), yl(R.approachBot) - 0.02, lv(R.approachBot), 1.5, 'TEXT', { anchor: 'end' });
    vg.text(Xm(xs + fb + p.abTopW + 1.65), yl(R.soffit) - 0.1, lv(R.soffit), 1.5, 'TEXT', { anchor: 'end' });
    vg.text(Xm(xs + fb + p.abTopW + 1.65), yl(R.stemTop) - 0.02, lv(R.stemTop), 1.5, 'TEXT', { anchor: 'end' });
    vg.text(-0.1, p.footingT, lv(R.ftgTop), 1.5, 'TEXT', { anchor: 'end' });
    vg.text(-0.1, 0, lv(p.foundationLevel), 1.5, 'TEXT', { anchor: 'end' });
    vg.text(R.ftgW / 2, yl(R.ftgTop) + R.stemH * 0.35, 'ABUTMENT WITH', 1.4, 'TEXT', { anchor: 'middle' });
    vg.text(R.ftgW / 2, yl(R.ftgTop) + R.stemH * 0.35 - 0.18, 'CC M15 + 15% PLUMS', 1.4, 'TEXT', { anchor: 'middle' });
    // dims
    const segs = [[0, p.abToe, p.abToe], [p.abToe, p.abToe + p.abBackBatter, p.abBackBatter], [p.abToe + p.abBackBatter, p.abToe + p.abBackBatter + p.abTopW, p.abTopW], [p.abToe + p.abBackBatter + p.abTopW, p.abToe + R.stemBase, fb], [p.abToe + R.stemBase, R.ftgW, p.abHeel]];
    for (const [a, b, val] of segs) vg.dimH(a, b, p.footingT, mm(val), 2.5, { h: 1.5 });
    vg.dimH(p.abToe, p.abToe + R.stemBase, 0, mm(R.stemBase), -5);
    vg.dimH(0, R.ftgW, 0, mm(R.ftgW), -11);
    vg.dimV(0, p.footingT, R.ftgW, mm(p.footingT), 5);
    vg.dimV(yl(R.ftgTop), yl(R.stemTop), R.ftgW, mm(R.stemH), 5);
    vg.dimV(yl(R.stemTop), yl(R.soffit), R.ftgW, mm(p.bedBlockT), 5, { h: 1.5 });
    vg.dimV(yl(R.approachBot), yl(R.deckTop), 0, mm(p.approachThk), -3, { h: 1.5 });
    dw.leader(vg.X(Xm(xs + fb + 0.5)), vg.Y(yl(R.deckTop) - 0.05), vg.X(Xm(xs + fb + 0.5)) - 8, vg.Y(yl(p.frl)) + 12, '20 THK EXP. JOINT', { right: false });
    dw.leader(vg.X(Xm(xs + fb + 0.25)), vg.Y(yl(R.stemTop) + 0.15), vg.X(R.ftgW) + 14, vg.Y(yl(R.stemTop)) - 5, `BED BLOCK 500x${mm(p.bedBlockT)} M20`);
    dw.leader(vg.X(Xm(xs + fb * 0.5)), vg.Y(yl(R.ftgTop) + 0.3), vg.X(R.ftgW) + 14, vg.Y(yl(R.ftgTop) + 0.3) - 1, 'WEEP HOLES 75Ø @ 1 m');
    dw.title(vg.X(R.ftgW / 2), 22, 'SECTION OF ABUTMENT & FOUNDATION');

    // H. wing wall section
    const wWm = R.wFtgW + 0.4, wHm = R.wH + p.wFootT + p.keyD + 0.3;
    const s5 = pick(wWm + 0.6, wHm, 120, 140);
    const vh = BD.view(dw, 262, 32 + (p.keyD * 1000) / s5, s5);
    vh.solid([[0, 0], [R.wFtgW, 0], [R.wFtgW, p.wFootT], [0, p.wFootT]], 'OUTLINE', { density: 0.12 });
    vh.text(R.wFtgW / 2, p.wFootT / 2 - 0.05, 'PCC M15', 1.4, 'TEXT', { anchor: 'middle' });
    vh.solid([[0, 0], [p.keyW, 0], [p.keyW, -p.keyD], [0, -p.keyD]], 'OUTLINE', { density: 0.12 });
    const wx = p.wToe;
    vh.solid([[wx, p.wFootT], [wx + p.wFrontBatter, p.wFootT + R.wH], [wx + p.wFrontBatter + p.wTopW, p.wFootT + R.wH], [wx + p.wBaseW, p.wFootT]], 'OUTLINE', { density: 0.12 });
    vh.text(wx + p.wBaseW / 2, p.wFootT + R.wH * 0.3, 'WING WALL WITH', 1.4, 'TEXT', { anchor: 'middle' });
    vh.text(wx + p.wBaseW / 2, p.wFootT + R.wH * 0.3 - 0.2, 'CC M15 + 15% PLUMS', 1.4, 'TEXT', { anchor: 'middle' });
    vh.dimH(wx + p.wFrontBatter, wx + p.wFrontBatter + p.wTopW, p.wFootT + R.wH, mm(p.wTopW), 3, { h: 1.5 });
    vh.dimH(wx, wx + p.wBaseW, p.wFootT, mm(p.wBaseW), 1.5, { h: 1.5 });
    vh.dimH(0, R.wFtgW, -p.keyD, mm(R.wFtgW), -4);
    vh.dimV(p.wFootT, p.wFootT + R.wH, R.wFtgW, mm(R.wH), 5);
    vh.dimV(0, p.wFootT, R.wFtgW, mm(p.wFootT), 5, { h: 1.5 });
    vh.dimV(-p.keyD, 0, 0, mm(p.keyD), -3, { h: 1.5 });
    vh.text(-0.1, p.wFootT + R.wH, lv(p.frl), 1.5, 'TEXT', { anchor: 'end' });
    vh.text(-0.1, p.wFootT, lv(R.wFtgTop), 1.5, 'TEXT', { anchor: 'end' });
    vh.text(-0.1, 0, lv(p.foundationLevel), 1.5, 'TEXT', { anchor: 'end' });
    dw.leader(vh.X(p.keyW), vh.Y(-p.keyD / 2), vh.X(p.keyW) + 18, vh.Y(-p.keyD / 2) - 3, `SHEAR KEY ${mm(p.keyW)}x${mm(p.keyD)}`);
    dw.title(vh.X(R.wFtgW / 2), 22, 'SECTION OF WING WALL');
    dw.text(vh.X(R.wFtgW / 2), 17, '(AT ABUTMENT END; HEIGHT TAPERING TO BANK)', 1.3, 'TEXT', { anchor: 'middle' });

    frame(dw, d, 2, `SECTIONS AND REINFORCEMENT DETAILS OF ${R.typ} @ km ${p.chainage}`, 'AS SHOWN');
    return dw;
  }

  Object.assign(BD, { sheet1, sheet2 });
})(typeof window !== 'undefined' ? window : globalThis);
