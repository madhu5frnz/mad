/*
 * U.T. drawing sheets (A2 landscape):
 *   Sheet 1 - longitudinal section along the drain, plan, hydraulic
 *             particulars of canal and drain, flow table, notes.
 *   Sheet 2 - cross-section of the RCC box with reinforcement, head wall,
 *             wing / return wall and drop wall sections, reinforcement
 *             schedule and design summary.
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});
  const W = 594, H = 420;
  const mm = (v) => String(Math.round(v * 1000));
  const lv = (v) => (v >= 0 ? '+' : '') + v.toFixed(3);

  // x stations along the drain (flow in +x), from the u/s end of the approach floor
  function stations(d) {
    const { p, R } = d;
    const La = 3.0;
    const xa = La, xt = xa + R.dropBase, xe = xt + R.usFloor, xx = xe + R.Lb, xd = xx + R.dsLen;
    return { La, xa, xt, xe, xx, xd };
  }

  function sheet1(d) {
    const { p, R } = d;
    const dw = new BD.Dwg(W, H);
    const st = stations(d);
    const { xa, xt, xe, xx, xd } = st;
    const Ltot = xd + 3;
    const top = Math.max(R.tbl, R.walls[0].top) + 0.6, bot = Math.min(R.cutDs, R.cutUs, R.boxBot - p.pcc) - 0.4;
    const sc = BD.pickScale(Ltot + 3, top - bot, 360, 105);
    const v = BD.view(dw, 20 + 1000 * 1.5 / sc, Math.max(282, 372 - ((top - bot) * 1000) / sc), sc);
    const y = (l) => l - bot;
    dw.title(200, 402, 'LONGITUDINAL SECTION ALONG THE DRAIN');
    // approach floor + u/s cut-off
    v.solid([[0, y(p.drainBed - p.dsFloorT)], [xa, y(p.drainBed - p.dsFloorT)], [xa, y(p.drainBed)], [0, y(p.drainBed)]], 'OUTLINE', { density: 0.12 });
    v.solid([[0, y(R.cutUs)], [0.3, y(R.cutUs)], [0.3, y(p.drainBed - p.dsFloorT)], [0, y(p.drainBed - p.dsFloorT)]], 'OUTLINE', { density: 0.12 });
    v.line(-2, y(p.drainBed), 0, y(p.drainBed), 'OUTLINE');
    // drop wall and cistern floor
    v.solid([[xa, y(R.sill)], [xt, y(R.sill)], [xa + R.dropTop, y(R.crest)], [xa, y(R.crest)]], 'OUTLINE', { density: 0.12 });
    v.solid([[xa, y(R.sill - R.apronT)], [xe, y(R.sill - R.apronT)], [xe, y(R.sill)], [xa, y(R.sill)]], 'OUTLINE', { density: 0.1 });
    // box
    const bx = [[xe, y(R.boxBot)], [xx, y(R.boxBot)], [xx, y(R.boxTop)], [xe, y(R.boxTop)]];
    v.poly(bx, true, 'OUTLINE', { w: 0.35 });
    v.rect(xe, y(R.floorTop), R.Lb, R.soffit - R.floorTop, 'THIN');
    v.line(xe, y(R.sill), xx, y(R.sill), 'THIN', { w: 0.15 });
    v.rect(xe - 0.15, y(R.boxBot - p.pcc), R.Lb + 0.3, p.pcc, 'THIN');
    v.stipple([[xe, y(R.soffit)], [xx, y(R.soffit)], [xx, y(R.boxTop)], [xe, y(R.boxTop)]], 0.1);
    v.stipple([[xe, y(R.boxBot)], [xx, y(R.boxBot)], [xx, y(R.floorTop)], [xe, y(R.floorTop)]], 0.1);
    // head walls (front face vertical at barrel ends, rear batter into the bank)
    for (const [x0, sg] of [[xe, 1], [xx, -1]]) {
      v.solid([[x0, y(R.boxTop)], [x0 + sg * R.hw.b, y(R.boxTop)], [x0 + sg * p.hwTopW, y(R.tbl)], [x0, y(R.tbl)]], 'OUTLINE', { density: 0.12 });
    }
    // canal & banks over the barrel
    const c0 = xe + p.hwTopW + p.bankWidthL, cw = p.sideSlope * (p.fsd + p.freeBoard);
    const prof = [[xe + p.hwTopW, y(R.tbl)], [c0, y(R.tbl)], [c0 + cw, y(p.cbl)], [c0 + cw + p.bedWidth, y(p.cbl)], [c0 + 2 * cw + p.bedWidth, y(R.tbl)], [xx - p.hwTopW, y(R.tbl)]];
    v.poly(prof, false, 'OUTLINE', { w: 0.3 });
    const wsl = p.sideSlope * p.fsd;
    v.poly([[c0 + cw - wsl, y(R.fsl)], [c0 + cw + p.bedWidth + wsl, y(R.fsl)], [c0 + cw + p.bedWidth, y(p.cbl)], [c0 + cw, y(p.cbl)]], true, 'WATER', { w: 0.2 });
    v.text(c0 + cw + p.bedWidth / 2, y(R.fsl) + 0.15, `CANAL  FSL ${lv(R.fsl)}`, 1.6, 'LABEL', { anchor: 'middle' });
    v.text(c0 + cw + p.bedWidth / 2, y(p.cbl) + 0.15, `CBL ${lv(p.cbl)}`, 1.5, 'TEXT', { anchor: 'middle' });
    v.level(xe + p.hwTopW + p.bankWidthL / 2, y(R.tbl), `TBL ${lv(R.tbl)}`);
    // d/s transition floor, cut-off, tail channel
    v.solid([[xx, y(R.sill - p.dsFloorT)], [xd, y(R.sill - p.dsFloorT)], [xd, y(R.sill)], [xx, y(R.sill)]], 'OUTLINE', { density: 0.12 });
    v.solid([[xd - 0.3, y(R.cutDs)], [xd, y(R.cutDs)], [xd, y(R.sill - p.dsFloorT)], [xd - 0.3, y(R.sill - p.dsFloorT)]], 'OUTLINE', { density: 0.12 });
    v.line(xd, y(R.sill), xd + 3, y(R.sill), 'OUTLINE');
    // water surface
    const s = R.secs;
    const wl = [[-2, y(s[6].mfl)], [xa, y(s[6].mfl)], [xt + 0.3, y(s[4].mfl)], [xe, y(s[3].mfl)], [xx, y(s[2].mfl)], [xd, y(s[1].mfl)], [xd + 3, y(s[0].mfl)]];
    v.poly(wl, false, 'WATER', { w: 0.3 });
    v.text(-1.8, y(s[6].mfl) + 0.12, `U/S MFL ${lv(s[6].mfl)}`, 1.5, 'LABEL');
    v.text(xd + 2.9, y(s[0].mfl) + 0.12, `TAIL MFL ${lv(s[0].mfl)}`, 1.5, 'LABEL', { anchor: 'end' });
    // levels & dimensions
    v.text(xa - 0.1, y(R.crest) + 0.1, `CREST ${lv(R.crest)}`, 1.5, 'TEXT', { anchor: 'end' });
    v.text(xe + 0.2, y(R.boxTop) + 0.1, lv(R.boxTop), 1.4, 'TEXT');
    v.text(xe + 1.0, y(R.sill) + 0.12, `SILL ${lv(R.sill)}`, 1.4, 'TEXT');
    v.text(xe + 1.0, y(R.boxBot) - 0.35, lv(R.boxBot), 1.4, 'TEXT');
    v.text(0.35, y(R.cutUs) + 0.05, lv(R.cutUs), 1.4, 'TEXT');
    v.text(xd - 0.35, y(R.cutDs) + 0.05, lv(R.cutDs), 1.4, 'TEXT', { anchor: 'end' });
    v.text(xe + R.Lb / 2, y(R.floorTop) + 0.45, `RCC BOX ${R.nV} x ${mm(p.ventW)} x ${mm(p.ventH)}`, 1.7, 'LABEL', { anchor: 'middle' });
    const dy = y(bot) - 0.1;
    const dims = [[0, xa, 'APPROACH'], [xa, xt, 'DROP'], [xt, xe, 'CISTERN'], [xe, xx, 'BARREL'], [xx, xd, 'D/S TRANSITION']];
    for (const [a, b] of dims) v.dimH(a, b, dy + 0.2, mm(b - a), -6, { h: 1.5 });
    for (const [a, b, t] of dims) v.text((a + b) / 2, dy + 0.2, t, 1.3, 'TEXT', { anchor: 'middle' });
    v.dimV(y(R.sill), y(R.crest), xa, mm(R.dropH), -4, { h: 1.5 });
    v.dimV(y(R.sill - R.apronT), y(R.sill), xe - 0.6, mm(R.apronT), 0, { h: 1.3 });

    // ---------------- plan
    const halfB = R.Bf / 2 + p.returnLen + 1.2;
    const scp = BD.pickScale(Ltot + 3, 2 * halfB, 360, 118);
    const vp = BD.view(dw, 20 + 1000 * 1.5 / scp, 196, scp);
    dw.title(200, 196 + (halfB * 1000) / scp + 6, 'PLAN');
    const Wo = R.Wout / 2, Wc = R.Wclear / 2, Bf = R.Bf / 2;
    vp.rect(xe, -Wo, R.Lb, R.Wout, 'OUTLINE', { w: 0.35 });
    // vents (hidden)
    let yy = -Wc;
    for (let i = 0; i < R.nV; i++) { vp.rect(xe, yy, R.Lb, p.ventW, 'HIDDEN'); yy += p.ventW + p.tMid; }
    // head walls
    for (const [x0, sg] of [[xe, 1], [xx, -1]]) {
      vp.rect(Math.min(x0, x0 + sg * p.hwTopW), -Wo, p.hwTopW, R.Wout, 'OUTLINE');
      vp.line(x0 + sg * R.hw.b, -Wo, x0 + sg * R.hw.b, Wo, 'HIDDEN');
    }
    for (const sg of [-1, 1]) {
      // u/s: straight cistern part then splay to the barrel
      const xs = xe - R.usLen;
      vp.poly([[xt, sg * Bf], [xs, sg * Bf], [xe, sg * Wo]], false, 'OUTLINE', { w: 0.35 });
      vp.poly([[xt, sg * (Bf + p.wTopW)], [xs, sg * (Bf + p.wTopW)], [xe, sg * (Wo + p.wTopW)]], false, 'OUTLINE');
      // u/s returns at the drop wall
      vp.poly([[xa, sg * Bf], [xa, sg * (Bf + p.returnLen)], [xt, sg * (Bf + p.returnLen)], [xt, sg * Bf]], false, 'OUTLINE');
      // d/s splay and return
      vp.poly([[xx, sg * Wo], [xd, sg * Bf]], false, 'OUTLINE', { w: 0.35 });
      vp.poly([[xx, sg * (Wo + p.wTopW)], [xd, sg * (Bf + p.wTopW)]], false, 'OUTLINE');
      vp.poly([[xd, sg * Bf], [xd, sg * (Bf + p.returnLen)], [xd + p.wTopW, sg * (Bf + p.returnLen)], [xd + p.wTopW, sg * Bf]], false, 'OUTLINE');
      // approach / tail channel edges
      vp.line(0, sg * Bf, xa, sg * Bf, 'THIN'); vp.line(xd + p.wTopW, sg * Bf, xd + 3, sg * Bf, 'THIN');
    }
    vp.rect(xa, -Bf, R.dropTop, R.Bf, 'OUTLINE');
    vp.line(xt, -Bf, xt, Bf, 'HIDDEN');
    vp.line(0, -Bf, 0, Bf, 'OUTLINE'); vp.line(0.3, -Bf, 0.3, Bf, 'HIDDEN');
    vp.line(xd - 0.3, -Bf, xd - 0.3, Bf, 'HIDDEN');
    // canal lines across
    const cl = [c0, c0 + cw, c0 + cw + p.bedWidth, c0 + 2 * cw + p.bedWidth];
    for (const x of cl) vp.line(x, -halfB, x, halfB, 'THIN', { w: 0.15 });
    for (const x of [c0 + cw - wsl, c0 + cw + p.bedWidth + wsl]) vp.line(x, -halfB, x, halfB, 'WATER', { w: 0.2 });
    vp.line(c0 + cw + p.bedWidth / 2, -halfB, c0 + cw + p.bedWidth / 2, halfB, 'CENTER');
    vp.text(c0 + cw + p.bedWidth / 2 + 0.3, halfB - 0.8, `${String(p.canalName).toUpperCase()}`, 1.6, 'LABEL', { rot: -90 });
    vp.line(-1.8, 0, xd + 3, 0, 'CENTER');
    dw.leader(vp.X(-1.2), vp.Y(0.35), vp.X(-1.2) + 0.1, vp.Y(0.35) + 4, 'DRAIN FLOW', { h: 1.5 });
    dw.poly([[vp.X(xd + 2.8), vp.Y(0)], [vp.X(xd + 1.8), vp.Y(0) + 1.2], [vp.X(xd + 1.8), vp.Y(0) - 1.2]], true, 'WATER', { fill: true });
    vp.dimH(xe, xx, -Wo, mm(R.Lb), -8, { h: 1.5 });
    vp.dimV(-Bf, Bf, xd + 3.2, mm(R.Bf), 0, { h: 1.5 });
    vp.dimV(-Wo, Wo, xe + R.Lb / 2, mm(R.Wout), 0, { h: 1.5 });
    vp.text(xt + 0.2, -Bf + 0.3, 'CISTERN', 1.4, 'TEXT');
    vp.text(xa + R.dropTop / 2, Bf + p.returnLen + 0.4, 'RETURN', 1.3, 'TEXT', { anchor: 'middle' });
    vp.text(xd, Bf + p.returnLen + 0.4, 'RETURN', 1.3, 'TEXT', { anchor: 'middle' });

    // ---------------- flow table
    const ft = [['SECTION', 'LOCATION', 'BED LEVEL', 'DEPTH', 'MFL', 'VELOCITY', 'TEL']];
    const names = ['TAIL CHANNEL', 'END OF D/S TRANSITION', 'BARREL EXIT', 'BARREL ENTRY', 'CISTERN (U/S TRANSITION)', 'DROP CREST', 'APPROACH CHANNEL'];
    R.secs.forEach((x, i) => ft.push([x.name, names[i], lv(x.bl), x.d.toFixed(3), lv(x.mfl), x.v.toFixed(3), lv(x.tel)]));
    dw.title(200, 84, 'FLOW CONDITIONS (TOTAL ENERGY LINES)', 2.4);
    dw.table(40, 80, [20, 60, 30, 22, 30, 24, 30], ft, { rh: 5, h: 1.45, center: [0, 2, 3, 4, 5, 6] });

    // ---------------- notes & tables (right)
    const notes = [
      'ALL DIMENSIONS ARE IN MILLIMETRES AND LEVELS IN METRES.',
      'WRITTEN DIMENSIONS ONLY SHALL BE FOLLOWED.',
      `MAXIMUM FLOOD DISCHARGE OF THE DRAIN ${R.Q.toFixed(3)} CUMECS ${p.floodMode === 'given' ? '(GIVEN)' : `BY DICKEN'S FORMULA, C = ${p.dickenC}`}.`,
      `THE BOX IS DESIGNED FOR THE CANAL FULL / EMPTY AND BOX FULL / EMPTY CONDITIONS AND FOR ${p.llBank === 'none' ? 'NO LIVE LOAD' : p.llBank === 'both' ? 'IRC CLASS A AND 70R' : p.llBank === '70R' ? 'IRC CLASS 70R' : 'IRC CLASS A'} LOADING ON THE BANKS (IRC 6-2017).`,
      `EARTH PRESSURE BY RANKINE THEORY, PHI = ${p.phi} DEG, WEIGHT OF EARTH ${Math.round(p.gammaSoil * 1000)} KG/CUM, CONCRETE ${Math.round(p.gammaConc * 1000)} KG/CUM.`,
      `CONCRETE: RCC M${p.fck} FOR THE BOX; CC M${p.subFck} WITH 15% PLUMS FOR HEAD, DROP, WING AND RETURN WALLS; PCC M15 (40 MM) FOR LEVELLING COURSE AND FOOTINGS; CC M15 (20 MM) FOR FLOORS AND CUT-OFFS.`,
      `STEEL: HYSD BARS Fe ${p.fy} (IS 1786). CLEAR COVER ${mm(p.cover)} MM.`,
      'EXPANSION / CONSTRUCTION JOINTS IN THE BARREL WITH PVC WATER STOPS AT NOT MORE THAN 10 M INTERVALS.',
      'THE BOX SHALL BE BACKFILLED IN LAYERS SIMULTANEOUSLY ON BOTH SIDES; THE CANAL SHALL BE RESTORED WITH SELECTED EARTH, WELL COMPACTED.',
      `SBC ASSUMED ${p.sbc} T/SQM AND SILT FACTOR ${p.siltFactor} - TO BE CONFIRMED BY SOIL INVESTIGATION.`,
      'CODES: IS 7784 (PT 1 & 2), IRC 6-2017, IRC 21-2000, IRC 78, IRC SP:13, IS 456; CDO GUIDELINES.',
    ];
    dw.text(392, 402, 'NOTES:', 2.4, 'TITLE');
    let ny = 396, k = 0;
    for (const n of notes) {
      BD.wrapText(n, 100).forEach((ln, i) => { dw.text(i ? 396 : 392, ny, (i ? '' : `${++k}) `) + ln, 1.25, 'TEXT'); ny -= 2.6; });
    }
    let hy = ny - 5;
    dw.title(486, hy, `HYDRAULIC PARTICULARS OF THE CANAL @ KM ${p.chainage}`, 2.2);
    hy = dw.table(416, hy - 4, [12, 76, 52], [
      ['S.No.', 'DESCRIPTION', 'PARTICULARS'],
      ['1.', 'DISCHARGE', `${p.Qc.toFixed(3)} Cumecs`], ['2.', 'BED WIDTH', `${p.bedWidth.toFixed(3)} m`], ['3.', 'FSD', `${p.fsd.toFixed(3)} m`],
      ['4.', 'VELOCITY', `${R.vCanal.toFixed(3)} m/sec`], ['5.', 'BED FALL', `1 IN ${p.bedFall}`], ['6.', 'SIDE SLOPES / FREE BOARD', `${p.sideSlope} : 1 / ${p.freeBoard.toFixed(2)} m`],
      ['7.', 'TOP WIDTH OF BANKS (L/R)', `${p.bankWidthL.toFixed(2)} / ${p.bankWidthR.toFixed(2)} m`], ['8.', 'CBL / FSL / TBL', `${lv(p.cbl)} / ${lv(R.fsl)} / ${lv(R.tbl)}`],
    ], { rh: 4.2, h: 1.35 });
    dw.title(486, hy - 6, 'PARTICULARS OF THE DRAIN', 2.2);
    dw.table(416, hy - 10, [12, 76, 52], [
      ['S.No.', 'DESCRIPTION', 'PARTICULARS'],
      ['1.', 'CATCHMENT AREA', p.floodMode === 'given' ? '-' : `${p.catchment} sq.km`], ['2.', 'MAXIMUM FLOOD DISCHARGE', `${R.Q.toFixed(3)} Cumecs`],
      ['3.', 'DEEP BED LEVEL OF DRAIN', lv(p.drainBed)], ['4.', 'LACEY WATERWAY / FLUMING', `${R.lacey.toFixed(2)} m / ${p.fluming} %`],
      ['5.', 'WATERWAY PROVIDED', `${R.Bf.toFixed(2)} m`], ['6.', 'VENTS', `${R.nV} x ${p.ventW.toFixed(2)} x ${p.ventH.toFixed(2)} m`],
      ['7.', 'VELOCITY IN BARREL', `${R.vBarrelAct.toFixed(3)} m/sec`], ['8.', 'U/S MFL / TAIL MFL', `${lv(R.secs[6].mfl)} / ${lv(R.secs[0].mfl)}`],
      ['9.', 'SCOUR LEVELS U/S / D/S', `${lv(R.scourUs)} / ${lv(R.scourDs)}`],
    ], { rh: 4.2, h: 1.35 });
    BD.sheetFrame(dw, d, 1, `PLAN AND L-SECTION OF U.T. @ km ${p.chainage}`, `1:${sc} / 1:${scp}`);
    return dw;
  }

  function sheet2(d) {
    const { p, R } = d;
    const dw = new BD.Dwg(W, H);
    const c = p.cover, M = R.members;
    const Hout = p.ventH + p.wcBox + p.tTop + p.tBot;
    // ---------------- box cross-section
    const sc = BD.pickScale(R.Wout + 1.4, Hout + 1.0, 170, 150);
    const v = BD.view(dw, 75, 240, sc);
    dw.title(75 + (R.Wout * 1000) / sc / 2, 240 + (Hout * 1000) / sc + 22, 'CROSS SECTION OF BARREL (UNDER THE BANK)');
    const Wt = R.Wout;
    v.poly([[0, 0], [Wt, 0], [Wt, Hout], [0, Hout]], true, 'OUTLINE', { w: 0.4 });
    const h = p.haunch;
    let x0 = p.tWall;
    const cells = [];
    for (let i = 0; i < R.nV; i++) {
      const a = x0, b = x0 + p.ventW, y0 = p.tBot, y1 = Hout - p.tTop;
      cells.push([a, b]);
      v.poly([[a + h, y0], [b - h, y0], [b, y0 + h], [b, y1 - h], [b - h, y1], [a + h, y1], [a, y1 - h], [a, y0 + h]], true, 'OUTLINE', { w: 0.35 });
      v.line(a, y0 + p.wcBox, b, y0 + p.wcBox, 'THIN', { w: 0.15 });
      x0 = b + p.tMid;
    }
    // concrete stipple in members
    v.stipple([[0, 0], [Wt, 0], [Wt, p.tBot], [0, p.tBot]], 0.12);
    v.stipple([[0, Hout - p.tTop], [Wt, Hout - p.tTop], [Wt, Hout], [0, Hout]], 0.12);
    // reinforcement: outer loop, inner per cell
    const oc = c + 0.006;
    v.poly([[oc, oc], [Wt - oc, oc], [Wt - oc, Hout - oc], [oc, Hout - oc]], true, 'REBAR', { w: 0.45 });
    for (const [a, b] of cells) {
      const y0 = p.tBot - oc, y1 = Hout - p.tTop + oc;
      v.poly([[a - oc, y0], [b + oc, y0], [b + oc, y1], [a - oc, y1]], true, 'REBAR', { w: 0.45 });
      // haunch bars
      v.line(a - oc + 0.05, y1 - h - 0.1, a + h + 0.1, y1 + 0.02 - 0.0, 'REBAR', { w: 0.35 });
      v.line(b + oc - 0.05, y1 - h - 0.1, b - h - 0.1, y1, 'REBAR', { w: 0.35 });
      v.line(a - oc + 0.05, y0 + h + 0.1, a + h + 0.1, y0, 'REBAR', { w: 0.35 });
      v.line(b + oc - 0.05, y0 + h + 0.1, b - h - 0.1, y0, 'REBAR', { w: 0.35 });
    }
    // distribution bars (dots)
    const ds = R.distSp / 1000, dot = (x, yv) => v.circle(x, yv, 0.45, 'REBAR', { fill: true });
    for (let x = oc + 0.05; x < Wt - oc; x += ds) { dot(x, oc + 0.016); dot(x, Hout - oc - 0.016); }
    for (let yv = oc + 0.1; yv < Hout - oc; yv += ds) { dot(oc + 0.016, yv); dot(Wt - oc - 0.016, yv); }
    // labels
    const lab = (x, yv, dx, dy, t) => v.leader(x, yv, dx, dy, t, { h: 1.6 });
    lab(Wt * 0.2, Hout - oc, -4, 18, `T1 - ${M.top.outer.dia}φ @ ${M.top.outer.sp} (TOP)`);
    lab(Wt * 0.55, Hout - p.tTop + oc, 10, -10, `T2 - ${M.top.inner.dia}φ @ ${M.top.inner.sp} (BOTTOM OF TOP SLAB)`);
    lab(Wt * 0.8, oc, 22, -26, `B1 - ${M.bottom.outer.dia}φ @ ${M.bottom.outer.sp} (BOTTOM)`);
    lab(Wt * 0.6, p.tBot - oc, 12, 8, `B2 - ${M.bottom.inner.dia}φ @ ${M.bottom.inner.sp} (TOP OF BOTTOM SLAB)`);
    lab(oc, Hout / 2, -6, 14, `W1 - ${M.wall.outer.dia}φ @ ${M.wall.outer.sp} (OUTER)`);
    lab(p.tWall - oc, Hout * 0.4, 14, -4, `W2 - ${M.wall.inner.dia}φ @ ${M.wall.inner.sp} (INNER)`);
    if (R.nV > 1) lab(p.tWall + p.ventW + p.tMid / 2, Hout * 0.6, 8, 5, `M1 - ${M.mid.inner.dia}φ @ ${M.mid.inner.sp} (BOTH FACES)`);
    dw.text(v.X(0), v.Y(-0.25) - 12, `DISTRIBUTION: 10φ @ ${R.distSp} ALL FACES.  HAUNCH BARS: ${Math.min(M.top.outer.dia, 12)}φ @ ${M.top.outer.sp}.  CLEAR COVER ${mm(c)} MM.`, 1.5, 'TEXT');
    // dimensions
    v.dimH(0, Wt, 0, mm(Wt), -18, { h: 1.6 });
    let xp = 0;
    const segs = [[p.tWall]];
    for (let i = 0; i < R.nV; i++) { segs.push([p.ventW]); if (i < R.nV - 1) segs.push([p.tMid]); }
    segs.push([p.tWall]);
    for (const [wv] of segs) { v.dimH(xp, xp + wv, 0, mm(wv), -9, { h: 1.3 }); xp += wv; }
    v.dimV(0, Hout, Wt, mm(Hout), 10, { h: 1.6 });
    v.dimV(0, p.tBot, Wt, mm(p.tBot), 4, { h: 1.3 });
    v.dimV(p.tBot, Hout - p.tTop, Wt, mm(Hout - p.tTop - p.tBot), 4, { h: 1.3 });
    v.dimV(Hout - p.tTop, Hout, Wt, mm(p.tTop), 4, { h: 1.3 });
    v.text(-0.05, Hout, lv(R.boxTop), 1.5, 'TEXT', { anchor: 'end' });
    v.text(-0.05, p.tBot + p.wcBox, lv(R.sill), 1.5, 'TEXT', { anchor: 'end' });
    v.text(-0.05, 0, lv(R.boxBot), 1.5, 'TEXT', { anchor: 'end' });
    v.text(Wt / 2, Hout + 0.12, `EARTH FILL ${mm(R.fill)} (TBL ${lv(R.tbl)})`, 1.5, 'TEXT', { anchor: 'middle' });
    v.rect(-0.15, -p.pcc, Wt + 0.3, p.pcc, 'THIN');
    v.text(Wt / 2, -p.pcc + 0.02, `PCC M15 ${mm(p.pcc)} THK`, 1.3, 'TEXT', { anchor: 'middle' });

    // ---------------- head wall
    const hw = R.hw;
    const sh = BD.pickScale(hw.b + 1, hw.H + 0.8, 60, 60);
    const vh = BD.view(dw, 255, 300, sh);
    vh.solid([[0, 0], [hw.b, 0], [p.hwTopW + p.hwFrontBatter, hw.H], [p.hwFrontBatter, hw.H]], 'OUTLINE', { density: 0.14 });
    vh.line(-0.4, 0, hw.b + 0.6, 0, 'THIN');
    vh.dimH(0, hw.b, 0, mm(hw.b), -5, { h: 1.4 });
    vh.dimH(p.hwFrontBatter, p.hwFrontBatter + p.hwTopW, hw.H, mm(p.hwTopW), 3, { h: 1.4 });
    vh.dimV(0, hw.H, 0, mm(hw.H), -4, { h: 1.4 });
    vh.text(hw.b + 0.1, hw.H, `TBL ${lv(R.tbl)}`, 1.4, 'TEXT');
    vh.text(hw.b + 0.1, 0.05, `TOP OF BOX ${lv(R.boxTop)}`, 1.4, 'TEXT');
    vh.text(hw.b * 0.35, hw.H * 0.35, `CC M${p.subFck}`, 1.3, 'TEXT', { anchor: 'middle' });
    dw.title(vh.X(hw.b / 2), 300 + (hw.H * 1000) / sh + 9, 'SECTION OF HEAD WALL', 2.4);

    // ---------------- wing / return wall (taller of u/s and d/s)
    const w = R.walls.reduce((a, b) => (b.Ht > a.Ht ? b : a));
    const sw = BD.pickScale(w.B + 1.2, w.Ht + 0.8, 80, 120);
    const vw = BD.view(dw, 250, 140, sw);
    vw.solid([[0, 0], [w.B, 0], [w.B, p.wFootT], [0, p.wFootT]], 'OUTLINE', { density: 0.12 });
    const t0 = w.toe;
    vw.solid([[t0, p.wFootT], [t0 + w.b, p.wFootT], [t0 + p.wFrontBatter + p.wTopW, p.wFootT + w.H], [t0 + p.wFrontBatter, p.wFootT + w.H]], 'OUTLINE', { density: 0.12 });
    vw.dimH(0, w.B, 0, mm(w.B), -5, { h: 1.4 });
    vw.dimH(t0, t0 + w.b, p.wFootT, mm(w.b), 2, { h: 1.3 });
    vw.dimH(t0 + p.wFrontBatter, t0 + p.wFrontBatter + p.wTopW, p.wFootT + w.H, mm(p.wTopW), 3, { h: 1.4 });
    vw.dimV(p.wFootT, p.wFootT + w.H, w.B, mm(w.H), 5, { h: 1.4 });
    vw.dimV(0, p.wFootT, w.B, mm(p.wFootT), 5, { h: 1.3 });
    vw.text(-0.1, p.wFootT + w.H, lv(w.top), 1.4, 'TEXT', { anchor: 'end' });
    vw.text(-0.1, 0, lv(w.fdn), 1.4, 'TEXT', { anchor: 'end' });
    vw.text(t0 + w.b * 0.3, p.wFootT + w.H * 0.3, `CC M${p.subFck} + 15% PLUMS`, 1.3, 'TEXT', { anchor: 'middle', rot: 90 });
    dw.title(vw.X(w.B / 2), 140 + (w.Ht * 1000) / sw + 8, `SECTION OF ${w.name.toUpperCase()}`, 2.2);
    dw.text(vw.X(w.B / 2), 134, `TOE ${mm(w.toe)}, HEEL ${mm(w.heel)}; HEIGHT REDUCES TOWARDS THE ENDS`, 1.3, 'TEXT', { anchor: 'middle' });

    // ---------------- drop wall & cistern
    const sd = BD.pickScale(R.dropBase + R.usFloor + 1, R.dropH + R.apronT + 1, 110, 60);
    const vd = BD.view(dw, 30, 40, sd);
    vd.solid([[0, R.apronT], [R.dropBase, R.apronT], [R.dropTop, R.apronT + R.dropH], [0, R.apronT + R.dropH]], 'OUTLINE', { density: 0.12 });
    vd.solid([[0, 0], [R.dropBase + R.usFloor, 0], [R.dropBase + R.usFloor, R.apronT], [0, R.apronT]], 'OUTLINE', { density: 0.1 });
    vd.line(-1, R.apronT + R.dropH, 0, R.apronT + R.dropH, 'OUTLINE');
    const s = R.secs;
    vd.line(-1, R.apronT + R.dropH + s[5].d, 0.3, R.apronT + R.dropH + s[5].d, 'WATER', { w: 0.3 });
    vd.line(R.dropBase * 0.8, R.apronT + s[4].d, R.dropBase + R.usFloor, R.apronT + s[4].d, 'WATER', { w: 0.3 });
    vd.dimH(0, R.dropTop, R.apronT + R.dropH, mm(R.dropTop), 3, { h: 1.3 });
    vd.dimH(0, R.dropBase, R.apronT, mm(R.dropBase), 2, { h: 1.3 });
    vd.dimH(R.dropBase, R.dropBase + R.usFloor, 0, mm(R.usFloor), -4, { h: 1.3 });
    vd.dimV(R.apronT, R.apronT + R.dropH, R.dropBase + R.usFloor, mm(R.dropH), 4, { h: 1.3 });
    vd.dimV(0, R.apronT, R.dropBase + R.usFloor, mm(R.apronT), 4, { h: 1.3 });
    vd.text(-1, R.apronT + R.dropH + 0.05, `CREST ${lv(R.crest)}`, 1.3, 'TEXT');
    vd.text(R.dropBase + 0.2, R.apronT + 0.05, `FLOOR ${lv(R.sill)}`, 1.3, 'TEXT');
    dw.title(vd.X((R.dropBase + R.usFloor) / 2), 40 + ((R.dropH + R.apronT) * 1000) / sd + 10, 'SECTION OF DROP WALL AND CISTERN', 2.2);

    // ---------------- reinforcement schedule & design summary
    const e = BD.utBbs(d);
    const rows = [['MEMBER / BAR', 'DIA', 'SPACING', 'LENGTH (m)', 'NOS', 'WEIGHT (kg)']];
    for (const r of e.rows) rows.push([`${r.member.split('  ')[0]}: ${r.desc.replace(/^\(\w+\)\s*/, '')}`.slice(0, 64), `${r.dia}`, `${typeof r.sp === 'number' ? Math.round(r.sp * 1000) : r.sp}`, r.len.toFixed(3), `${r.nb * r.nm}`, r.kg.toFixed(1)]);
    rows.push(['TOTAL', '', '', '', '', e.total.toFixed(1)]);
    dw.title(486, 402, 'REINFORCEMENT SCHEDULE (PER BARREL)', 2.2);
    let ty = dw.table(392, 398, [96, 12, 18, 20, 16, 26], rows, { rh: 4.2, h: 1.3, center: [1, 2, 3, 4, 5] });
    const ds2 = [['MEMBER', 'D (mm)', 'M (t-m)', 'Ast REQ', 'PROVIDED']];
    for (const f of Object.values(M)) for (const x of Object.values(f)) ds2.push([x.label.slice(0, 52), mm(x.D / 1000), x.Ms.toFixed(2), x.AstReq.toFixed(0), `${x.dia}φ @ ${x.sp}`]);
    dw.title(486, ty - 7, 'DESIGN SUMMARY - RCC BOX', 2.2);
    dw.table(392, ty - 11, [86, 18, 20, 22, 42], ds2, { rh: 4.2, h: 1.3, center: [1, 2, 3, 4] });
    BD.sheetFrame(dw, d, 2, `BARREL, WALL SECTIONS AND REINFORCEMENT OF U.T. @ km ${p.chainage}`, 'AS SHOWN');
    return dw;
  }

  async function dxfZip(d, base) {
    const zip = new g.JSZip();
    zip.file(`${base}_Sheet1.dxf`, BD.toDXF(sheet1(d)));
    zip.file(`${base}_Sheet2.dxf`, BD.toDXF(sheet2(d)));
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  }

  Object.assign(BD, { utSheet1: sheet1, utSheet2: sheet2, utDxfZip: dxfZip });
})(typeof window !== 'undefined' ? window : globalThis);
