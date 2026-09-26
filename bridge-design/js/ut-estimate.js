/*
 * U.T. estimate: detailed measurements, bar bending schedule of the RCC
 * box, abstract, seigniorage and general abstract (shared pricing).
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;

  const WORK = 'excavation for the barrel, transitions, cistern, drop wall, cut-off walls and wing / return walls of the U.T.';
  const ITEMS = [
    { code: 'IRR-CCDW-1-2', unit: 'Cum', key: 'exc',
      short: 'Earth work in excavation in all kinds of soils for foundations of structures as per drawing and technical specification, including setting out, shoring and bracing, dewatering, dressing of sides and bottom and backfilling with approved material.',
      long: 'Earth work in excavation in all kinds of soils for ' + WORK + ' as per drawing and technical specification, including setting out, construction of shoring and bracing, dewatering, removal of stumps and other deleterious matter, dressing of sides and bottom and backfilling with approved material.' },
    { code: 'IRR-CCDW-2-3', unit: 'Cum', key: 'pcc', seig: [0.9, 0.2, 0.2], theo: [0.9, 0.4], theoName: 'M-15 Grade (levelling course & footings)', seigName: 'M-15 (40 mm) foundation',
      short: 'Providing and laying insitu vibrated M-15 grade cement concrete using 40 mm down size graded aggregates for levelling course under the box and footings of walls, complete with initial lead upto 50 m and all lifts.',
      long: 'Providing and laying insitu vibrated M-15 (28 days cube compressive strength not less than 15 N / sq mm) grade cement concrete using 40 mm down size approved, clean, hard, graded aggregates for levelling course under the RCC box and footings of wing / return walls including cost of all materials, machinery, labour, formwork, cleaning, batching, mixing, placing in position, levelling, vibrating, finishing, curing etc. complete with initial lead upto 50 m and all lifts.' },
    { code: 'IRR-CCDW-2-9', unit: 'Cum', key: 'lining', seig: [0.9, 0.2, 0.2], theo: [0.9, 0.4], theoName: 'M-15 Grade (floors, cut-offs)', seigName: 'M-15 (20 mm) floors & cut-offs',
      short: 'Providing and laying insitu vibrated M-15 grade cement concrete using 20 mm down size graded aggregates for cistern, approach and transition floors, cut-off walls and sealing coat, complete with initial lead upto 50 m and all lifts.',
      long: 'Providing and laying insitu vibrated M-15 (28 days cube compressive strength not less than 15 N / sq mm) grade cement concrete using 20 mm down size approved, clean, hard, graded aggregates for cistern floor, approach and transition floors, cut-off walls and sealing coat over the box including cost of all materials, machinery, labour, formwork, cleaning, batching, mixing, placing in position, levelling, vibrating, finishing, curing etc., complete with initial lead upto 50 m and all lifts.' },
    { code: 'IRR-CCDW-2-22', unit: 'Cum', key: 'plum', seig: [0.765, 0.17, 0.17], theo: [1.015, 0.34], theoName: 'M-15 Grade (with plums)', seigName: 'M-15 (40 mm) with plums',
      short: 'Providing and laying insitu vibrated M-15 grade cement concrete using 40 mm down size graded aggregates with placing and sinking plums upto 15 percent for head walls, drop wall, wing & return walls, complete.',
      long: 'Providing and laying insitu vibrated M-15 (28 days cube compressive strength not less than 15 N / sq mm) grade cement concrete using 40 mm down size approved, clean, hard, graded aggregates with placing and sinking plums of size 150 to 80 mm upto 15 percent for gravity head walls, drop wall, wing and return walls, including cost of all materials, machinery, labour, formwork, scaffolding, cleaning, batching, mixing, placing in position, levelling, vibrating, finishing, curing etc., complete with initial lead upto 50 m and all lifts.' },
    { code: 'IRR-CCDW-2-1', unit: 'kg', key: 'steel',
      short: 'Providing, fabricating and placing in position reinforcement steel bars for RCC works including cleaning, straightening, cutting, bending, lapping, tying etc., complete (as per BBS).',
      long: 'Providing, fabricating and placing in position reinforcement steel bars for RCC works including cleaning, straightening, cutting, bending, hooking, lapping, welding wherever required, tying with 1.25 mm dia soft annealed steel wire, including cost of all materials, machinery, labour etc., complete with initial lead upto 50 and all lifts.' },
    { code: 'RCC-M30', unit: 'Cum', key: 'rcc', seig: [0.8, 0.225, 0.225], theo: [0.8, 0.45], theoName: 'M-30 Grade (RCC box)', seigName: 'M-30 (20 mm) RCC box', rateNote: 'Enter SSR rate for RCC M30 (excluding steel)',
      short: 'Providing and laying insitu vibrated RCC M-30 grade concrete using 20 mm down size graded aggregates for the RCC box (top & bottom slabs, walls and haunches) excluding steel, complete.',
      long: 'Providing and laying insitu vibrated M-30 (28 days cube compressive strength not less than 30 N / sq mm) grade design-mix cement concrete using 20 mm down size approved, clean, hard, graded aggregates for the RCC box of the U.T. (top and bottom slabs, end and middle walls, haunches) including cost of all materials, machinery, labour, formwork, staging, cleaning, batching, mixing, placing in position, vibrating, finishing, curing etc., complete, excluding the cost of reinforcement, with initial lead upto 50 m and all lifts.' },
    { code: 'IRR-CCDW-2-29', unit: 'Cum', key: 'wc', seig: [0.8, 0.225, 0.225], theo: [0.8, 0.45], theoName: 'M-20 Grade (wearing coat)', seigName: 'M-20 (20 mm) wearing coat',
      short: 'Providing and laying VCC M-20 grade wearing coat 75 mm thick over the bottom slab of the barrel, complete.',
      long: 'Providing and laying insitu M-20 (28 days cube compressive strength not less than 20 N/sq mm) grade cement concrete using 20 mm down size approved, clean, hard, graded aggregates for wearing coat over the bottom slab of the barrel of the {TYP} including cost of all materials, machinery, labour, formwork, cleaning, batching, mixing, placing in position in alternate panels, levelling, compacting, finishing, curing etc., complete with initial lead up to 50 m and all lifts.' },
  ];

  function geom(d) {
    const { p, R } = d;
    const Hout = p.ventH + p.wcBox + p.tTop + p.tBot;
    const splayUs = Math.max(R.Bf - R.Wclear, 0) / 2;
    const wingUs = Math.hypot(R.usLen, splayUs) + Math.max(R.usFloor - R.usLen, 0);
    const wingDs = Math.hypot(R.dsLen, splayUs);
    return { Hout, wingUs, wingDs, approachLen: 3.0 };
  }

  function bbs(d) {
    const { p, R } = d;
    const { unitWt, nBars } = BD;
    const c = p.cover, Lb = R.Lb, W = R.Wout, gm = geom(d), Hout = gm.Hout;
    const rows = [];
    const add = (member, desc, dia, sp, shape, len, nb, nm) => {
      const tl = len * nb * nm, w = unitWt(dia);
      rows.push({ member, desc, dia, sp, shape, len: r3(len), nb, nm, tl: r2(tl), w, kg: r2(tl * w) });
    };
    const lap = (len, dia) => len + Math.floor(len / 12) * 0.05 * dia; // 50 dia lap per 12 m bar
    const anc = (dia) => (45 * dia) / 1000;
    const M = R.members;
    const top = `Top slab  ${W.toFixed(2)} x ${Lb.toFixed(2)} x ${p.tTop.toFixed(3)} m`;
    add(top, '(i) Outer face (top) main bars, bent into walls', M.top.outer.dia, M.top.outer.sp / 1000, `${W.toFixed(2)} - 2x${c} + 2 x 45 dia`, W - 2 * c + 2 * anc(M.top.outer.dia), nBars(Lb, M.top.outer.sp / 1000), 1);
    add(top, '(ii) Inner face (bottom) main bars', M.top.inner.dia, M.top.inner.sp / 1000, `${W.toFixed(2)} - 2x${c}`, W - 2 * c, nBars(Lb, M.top.inner.sp / 1000), 1);
    const bot = `Bottom slab  ${W.toFixed(2)} x ${Lb.toFixed(2)} x ${p.tBot.toFixed(3)} m`;
    add(bot, '(i) Outer face (bottom) main bars, bent into walls', M.bottom.outer.dia, M.bottom.outer.sp / 1000, `${W.toFixed(2)} - 2x${c} + 2 x 45 dia`, W - 2 * c + 2 * anc(M.bottom.outer.dia), nBars(Lb, M.bottom.outer.sp / 1000), 1);
    add(bot, '(ii) Inner face (top) main bars', M.bottom.inner.dia, M.bottom.inner.sp / 1000, `${W.toFixed(2)} - 2x${c}`, W - 2 * c, nBars(Lb, M.bottom.inner.sp / 1000), 1);
    const wl = `End walls (2 Nos.)  ${Hout.toFixed(3)} high x ${p.tWall.toFixed(3)} m`;
    add(wl, '(i) Outer face vertical bars', M.wall.outer.dia, M.wall.outer.sp / 1000, `${Hout.toFixed(3)} - 2x${c} + 2 x 45 dia`, Hout - 2 * c + 2 * anc(M.wall.outer.dia), nBars(Lb, M.wall.outer.sp / 1000), 2);
    add(wl, '(ii) Inner face vertical bars', M.wall.inner.dia, M.wall.inner.sp / 1000, `${Hout.toFixed(3)} - 2x${c}`, Hout - 2 * c, nBars(Lb, M.wall.inner.sp / 1000), 2);
    if (R.nV > 1) {
      const mw = `Middle walls (${R.nV - 1} Nos.)  ${Hout.toFixed(3)} high x ${p.tMid.toFixed(3)} m`;
      add(mw, '(i) Vertical bars, both faces', M.mid.inner.dia, M.mid.inner.sp / 1000, `${Hout.toFixed(3)} - 2x${c}`, Hout - 2 * c, 2 * nBars(Lb, M.mid.inner.sp / 1000), R.nV - 1);
    }
    const hd = Math.min(M.top.outer.dia, 12), hs = M.top.outer.sp;
    add(`Haunches (${4 * R.nV} Nos.)  ${Math.round(p.haunch * 1000)} x ${Math.round(p.haunch * 1000)}`, '(i) Haunch bars', hd, hs / 1000, `${(p.haunch * Math.SQRT2).toFixed(3)} + 2 x 45 dia`, p.haunch * Math.SQRT2 * 2 + 2 * anc(hd), nBars(Lb, hs / 1000), 4 * R.nV);
    const ds = R.distSp / 1000, dl = lap(Lb - 2 * c, 10);
    const dist = `Distribution bars along the barrel (10 dia @ ${R.distSp})`;
    add(dist, '(i) Top slab, both faces', 10, ds, `${Lb.toFixed(2)} - 2x${c} + laps`, dl, 2 * nBars(W, ds), 1);
    add(dist, '(ii) Bottom slab, both faces', 10, ds, `${Lb.toFixed(2)} - 2x${c} + laps`, dl, 2 * nBars(W, ds), 1);
    add(dist, '(iii) End walls, both faces', 10, ds, `${Lb.toFixed(2)} - 2x${c} + laps`, dl, 2 * nBars(Hout, ds), 2);
    if (R.nV > 1) add(dist, '(iv) Middle walls, both faces', 10, ds, `${Lb.toFixed(2)} - 2x${c} + laps`, dl, 2 * nBars(Hout, ds), R.nV - 1);
    const total = r2(rows.reduce((s, x) => s + x.kg, 0));
    const byDia = {};
    for (const x of rows) byDia[x.dia] = r2((byDia[x.dia] || 0) + x.kg);
    return { rows, total, byDia };
  }

  function utEstimate(d, opts) {
    const { p, R } = d;
    const gm = geom(d), Lb = R.Lb, W = R.Wout, Bf = R.Bf, s = p.sideSlope;
    // excavation under the barrel: bank / canal profile down to the bottom of the levelling course
    const z = R.boxBot - p.pcc;
    const cw = s * (p.fsd + p.freeBoard);
    const aLong = (p.bankWidthL + p.bankWidthR + 2 * p.hwTopW) * (R.tbl - z) + p.bedWidth * (p.cbl - z) + 2 * cw * ((R.tbl + p.cbl) / 2 - z);
    const usBot = R.sill - R.apronT, dsBot = R.sill - p.dsFloorT;
    const [wu, wd] = R.walls;
    const wallRows = (w, name, len) => [`${name} (${fmt2(w.b)} base, ${fmt2(w.H)} high)`, 1, 2, len, r3(((p.wTopW + w.b) / 2)), r3(w.H)];
    const hwA = ((p.hwTopW + R.hw.b) / 2) * R.hw.H;
    const M = {
      exc: [
        [`for barrel (longitudinal section ${aLong.toFixed(3)} sqm over ${Lb.toFixed(2)} m)`, 1, 1, Lb, W + 1.0, r3(aLong / Lb)],
        ['for cistern & drop wall (u/s)', 1, 1, R.usFloor + R.dropBase, Bf + 1.0, r3(p.drainBed - usBot)],
        ['for approach floor', 1, 1, gm.approachLen, Bf + 1.0, p.dsFloorT],
        ['for d/s transition floor', 1, 1, R.dsLen, Bf + 1.0, r3(Math.max(p.drainBed - dsBot, p.dsFloorT))],
        ['for u/s cut-off wall', 1, 1, Bf + 1.0, 0.6, r3(p.drainBed - p.dsFloorT - R.cutUs)],
        ['for d/s cut-off wall', 1, 1, Bf + 1.0, 0.6, r3(dsBot - R.cutDs)],
        ['for u/s wing walls', 1, 2, gm.wingUs, wu.B + 0.6, r3(Math.max(p.drainBed - wu.fdn, 0.3))],
        ['for d/s wing walls', 1, 2, gm.wingDs, wd.B + 0.6, r3(Math.max(p.drainBed - wd.fdn, 0.3))],
        ['for u/s return walls', 1, 2, p.returnLen, wu.B + 0.6, r3(Math.max(p.drainBed - wu.fdn, 0.3))],
        ['for d/s return walls', 1, 2, p.returnLen, wd.B + 0.6, r3(Math.max(p.drainBed - wd.fdn, 0.3))],
      ],
      pcc: [
        ['levelling course under the box', 1, 1, Lb, W + 0.3, p.pcc],
        ['footings of u/s wing walls', 1, 2, gm.wingUs, wu.B, p.wFootT],
        ['footings of d/s wing walls', 1, 2, gm.wingDs, wd.B, p.wFootT],
        ['footings of u/s return walls', 1, 2, p.returnLen, wu.B, p.wFootT],
        ['footings of d/s return walls', 1, 2, p.returnLen, wd.B, p.wFootT],
      ],
      lining: [
        [`cistern floor (${Math.round(R.apronT * 1000)} thk)`, 1, 1, R.usFloor, Bf, R.apronT],
        [`approach floor (${Math.round(p.dsFloorT * 1000)} thk)`, 1, 1, gm.approachLen, Bf, p.dsFloorT],
        [`d/s transition floor (${Math.round(p.dsFloorT * 1000)} thk)`, 1, 1, R.dsLen, Bf, p.dsFloorT],
        ['u/s cut-off wall (300 thk)', 1, 1, Bf, 0.3, r3(p.drainBed - p.dsFloorT - R.cutUs)],
        ['d/s cut-off wall (300 thk)', 1, 1, Bf, 0.3, r3(dsBot - R.cutDs)],
        [`sealing coat over the box in the canal (${Math.round(p.sealing * 1000)} thk)`, 1, 1, R.canalTopW, W, p.sealing],
      ],
      plum: [
        [`head walls (${fmt2(p.hwTopW)} top / ${fmt2(R.hw.b)} base, ${fmt2(R.hw.H)} high)`, 1, 2, W, r3(hwA / R.hw.H), r3(R.hw.H)],
        [`drop wall (${fmt2(R.dropTop)} top / ${fmt2(R.dropBase)} base)`, 1, 1, Bf, r3((R.dropTop + R.dropBase) / 2), r3(R.dropH)],
        wallRows(wu, 'u/s wing walls', gm.wingUs), wallRows(wd, 'd/s wing walls', gm.wingDs),
        wallRows(wu, 'u/s return walls', p.returnLen), wallRows(wd, 'd/s return walls', p.returnLen),
      ],
      rcc: [
        ['top slab', 1, 1, Lb, W, p.tTop],
        ['bottom slab', 1, 1, Lb, W, p.tBot],
        ['end walls', 1, 2, Lb, p.tWall, r3(p.ventH + p.wcBox)],
        ...(R.nV > 1 ? [['middle walls', 1, R.nV - 1, Lb, p.tMid, r3(p.ventH + p.wcBox)]] : []),
        [`haunches ${Math.round(p.haunch * 1000)} x ${Math.round(p.haunch * 1000)}`, 1, 4 * R.nV, Lb, p.haunch, p.haunch / 2],
      ],
      wc: [['over the bottom slab of the barrel', 1, R.nV, Lb, p.ventW, p.wcBox]],
    };
    const b = bbs(d);
    return BD.priceEstimate(ITEMS, M, b, { typ: R.typ, where: `${R.typ} @ Km ${p.chainage}`, nameOfWork: R.nameOfWork }, opts);
  }
  const fmt2 = (v) => v.toFixed(2);

  Object.assign(BD, { utEstimate, utBbs: bbs, UT_ITEMS: ITEMS, utGeom: geom });
})(typeof window !== 'undefined' ? window : globalThis);
