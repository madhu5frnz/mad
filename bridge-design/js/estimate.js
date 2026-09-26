/*
 * Estimate: detailed measurements, bar bending schedule, abstract,
 * seigniorage, theoretical requirement and general abstract, in the format
 * of the department's SLRB estimate workbook (SSR 2026-27 rates, editable).
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const r2 = (x) => Math.round(x * 100) / 100;

  // SSR 2026-27 rates from the reference DATA sheet (Rs / unit). Editable.
  const RATES = {
    'IRR-CCDW-1-2': 136.9,
    'IRR-CCDW-2-3': 6698,
    'IRR-CCDW-2-9': 7042,
    'IRR-CCDW-2-22': 7826,
    'IRR-CCDW-2-1': 82.4,
    'IRR-CCDW-2-10': 7876,
    'IRR-CCDW-2-25': 11609,
    'IRR-CCDW-2-29': 6729.7,
    'IRR-CCDW-5-5': 1740.9,
    'MORTH-2700': 9500,
  };
  const SEIG_RATES = { metal: 117, nsand: 40, msand: 117 };
  const GA = { labourCess: 0.01, nac: 0.001, smet: 0.02, dmf: 0.3, permit: 0.8, gst: 0.18, roundExtra: 2000 };

  const ITEMS = [
    { code: 'IRR-CCDW-1-2', unit: 'Cum', key: 'exc',
      short: 'Earth work in excavation in all kinds of soils of foundation of structures as per drawing and technical specification, including setting out, shoring and bracing, dressing of sides and bottom and backfilling with approved material.',
      long: 'Earth work in excavation in all kinds of soils of foundation of structures as per drawing and technical specification, including setting out, construction of shoring and bracing, removal of stumps and other deleterious matter, dressing of sides and bottom and backfilling with approved material.' },
    { code: 'IRR-CCDW-2-3', unit: 'Cum', key: 'pcc', seig: [0.9, 0.2, 0.2], theo: [0.9, 0.4], theoName: 'M-15 Grade (foundation)', seigName: 'M-15 (40 mm) foundation',
      short: 'Providing and laying insitu vibrated M-15 grade cement concrete using 40 mm down size graded aggregates for foundation filling, complete with initial lead upto 50 m and all lifts.',
      long: 'Providing and laying insitu vibrated M-15 ( 28 days cube compressive strength not less than 15 N / sq mm ) grade cement concrete using 40 mm down size approved, clean, hard, graded aggregates for foundation filling including cost of all materials, machinery, labour, formwork, cleaning, batching, mixing, placing in position, levelling, vibrating, finishing, curing etc. complete with initial lead upto 50 m and all lifts. (Cement content: 260 kg / cum with use of super plasticiser (0.4% by wt. of cement), CA : 0.90 cum, Blending Ratio of CA--50:30:20, FA : 0.40 cum)' },
    { code: 'IRR-CCDW-2-9', unit: 'Cum', key: 'lining', seig: [0.9, 0.2, 0.2], theo: [0.9, 0.4], theoName: 'M-15 Grade (apron & lining)', seigName: 'M-15 (20 mm) apron & lining',
      short: 'Providing and laying insitu vibrated M-15 grade cement concrete using 20 mm down size graded aggregates for bed apron & canal lining, complete with initial lead upto 50 m and all lifts.',
      long: 'Providing and laying insitu vibrated M-15 ( 28 days cube compressive strength not less than 15 N / sq mm ) grade cement concrete using 40 mm down size approved, clean, hard, graded aggregates for sub-structure / super-structure works including cost of all materials, machinery, labour, formwork, scaffolding, cleaning, batching, mixing, placing in position, levelling, vibrating, finishing, curing etc., complete with initial lead upto 50 m and all lifts. (Cement content: 280 kg / cum with use of super plasticiser (0.4% by wt. of cement), CA : 0.90 cum, Blending Ratio of CA--50:30:20, FA : 0.40 cum)' },
    { code: 'IRR-CCDW-2-22', unit: 'Cum', key: 'plum', seig: [0.765, 0.17, 0.17], theo: [1.015, 0.34], theoName: 'M-15 Grade (with plums)', seigName: 'M-15 (40 mm) with plums',
      short: 'Providing and laying insitu vibrated M-15 grade cement concrete using 40 mm down size graded aggregates with placing and sinking plums upto 15 percent for abutments, wing & return walls, complete.',
      long: 'Providing and laying insitu vibrated M-15 ( 28 days cube compressive strength not less than 15 N / sq mm ) grade cement concrete using 40 mm down size approved, clean, hard, graded aggregates with placing and sinking plums of size 150 to 80 mm upto 15 percent for gravity type retaining walls / piers / abutments etc., including cost of all materials, machinery, labour, formwork, scaffolding, cleaning, batching, mixing, placing in position, levelling, vibrating, finishing, curing etc., complete with initial lead upto 50 m and all lifts.' },
    { code: 'IRR-CCDW-2-1', unit: 'kg', key: 'steel',
      short: 'Providing, fabricating and placing in position reinforcement steel bars for RCC works including cleaning, straightening, cutting, bending, lapping, tying etc., complete (as per BBS).',
      long: 'Providing, fabricating and placing in position reinforcement steel bars for RCC works including cleaning, straightening, cutting, bending, hooking, lapping, welding wherever required, tying with 1.25 mm dia soft annealed steel wire, including cost of all materials, machinery, labour etc., complete with initial lead upto 50 and all lifts.' },
    { code: 'IRR-CCDW-2-10', unit: 'Cum', key: 'bedblock', seig: [0.8, 0.225, 0.225], theo: [0.8, 0.45], theoName: 'M-20 Grade (bed blocks)', seigName: 'M-20 (20 mm)',
      short: 'Providing and laying insitu vibrated M-20 grade cement concrete using 20 mm down size graded aggregates for bed blocks, complete with initial lead upto 50 m and all lifts.',
      long: 'Providing and laying insitu vibrated M-20 ( 28 days cube compressive strength not less than 20 N / sq mm ) grade cement concrete using 20 mm down size approved, clean, hard, graded aggregates for sub-structure / super-structure works including cost of all materials, machinery, labour, formwork, scaffolding, cleaning, batching, mixing, placing in position, levelling, vibrating, finishing, curing etc., complete with initial lead upto 50 m and all lifts.' },
    { code: 'IRR-CCDW-2-25', unit: 'Cum', key: 'deck', seig: [0.8, 0.225, 0.225], theo: [0.8, 0.45], theoName: 'M-20 Grade (deck, kerb, approach slabs)', seigName: 'M-20 (20 mm) Deck slab',
      short: 'Providing and laying insitu vibrated M-20 grade cement concrete using 20 mm down size graded aggregates for deck slab, kerb & approach slabs, complete with initial lead upto 50 m and all lifts.',
      long: 'Providing and laying insitu vibrated M-20 ( 28 days cube compressive strength not less than 20 N / sq mm ) grade cement concrete using 20 mm down size approved, clean, hard, graded aggregates for deck slab & kerb including cost of all materials, machinery, labour, formwork, scaffolding, cleaning, batching, mixing, placing in position, levelling, vibrating, finishing, curing etc., complete with initial lead upto 50 m and all lifts. If water is to be brought from other place add only lead charges @ 500 ltr / cum. (Cement content: 330 kg / cum with use of super plasticiser (0.4% by wt. of cement), CA : 0.80 cum, Blending Ratio of CA--65:35, FA : 0.45 cum)' },
    { code: 'IRR-CCDW-2-29', unit: 'Cum', key: 'wc', seig: [0.8, 0.225, 0.225], theo: [0.8, 0.45], theoName: 'M-20 Grade (wearing coat)', seigName: 'M-20 (20 mm) wearing coat',
      short: 'Providing and laying VCC M-20 grade wearing coat 75 mm thick over deck slab and approach slabs, complete.',
      long: 'Providing and laying insitu M-20 (28 days cube compressive strength not less than 20 N/sq mm) grade cement concrete using 20 mm down size approved, clean, hard, graded aggregates for 75 mm thick wearing coat over the deck slab of {TYP} including cost of all materials, machinery, labour, formwork, cleaning, batching, mixing, placing in position in alternate panels, levelling, compacting, finishing, curing, packing joints with asphalt mortar etc., complete with initial lead up to 50 m and all lifts.' },
    { code: 'IRR-CCDW-5-5', unit: 'Rm', key: 'rail', rateNote: 'SoR 2026-27 rate - verify',
      short: 'Providing hand railing with RCC posts and GI pipe rails as per MOST Drg. No. SD/202, complete.',
      long: 'Providing hand railing with RCC posts and GI pipe rails as per MOST Drg. No. SD/202 including painting etc., complete.' },
    { code: 'MORTH-2700', unit: 'Rm', key: 'crash', rateNote: 'Enter SSR rate for RCC crash barrier',
      short: 'Providing and laying RCC crash barrier (M40, including reinforcement) on the edges of deck and approaches as per MORTH standard drawing, complete.',
      long: 'Providing and laying cast in situ RCC crash barrier of M40 grade concrete including reinforcement, formwork, finishing, painting and all leads and lifts, on the edges of deck slab and approach slabs as per MORTH Specifications Section 2700 and standard drawing, complete.' },
  ];

  const unitWt = (dia) => Math.round((dia * dia / 162) * 1000) / 1000;
  const nBars = (len, sp) => Math.ceil((len - 2 * 0.04) / sp - 1e-9) + 1;

  function bbs(d) {
    const { p, R } = d;
    const L = R.deckL, B = R.B, c = 0.04, nV = R.nV || 1;
    const rows = [];
    const add = (member, desc, dia, sp, shape, len, nb, nm) => {
      const tl = len * nb * nm, w = unitWt(dia);
      rows.push({ member, desc, dia, sp, shape, len: r3(len), nb, nm, tl: r2(tl), w, kg: r2(tl * w) });
    };
    const m1 = `Deck slab  (${nV} No${nV > 1 ? 's' : ''}.)  ${L.toFixed(2)} x ${B.toFixed(2)} x ${p.D.toFixed(3)} m - M20`;
    add(m1, '(i) Main bars - bottom (200 end bends)', p.mainDia, p.mainSpacing / 1000, `${L.toFixed(2)} - 2x0.04 + 2x0.20`, L - 2 * c + 0.4, nBars(B, p.mainSpacing / 1000), 1);
    add(m1, '(ii) Top bars (span direction)', p.topDia, p.topSpacing / 1000, `${L.toFixed(2)} - 2x0.04 + 2x0.20`, L - 2 * c + 0.4, nBars(B, p.topSpacing / 1000), 1);
    add(m1, '(iii) Distributaries - bottom', p.distDia, p.distSpacing / 1000, 'Straight across width', B - 2 * c, nBars(L, p.distSpacing / 1000), 1);
    add(m1, '(iv) Distributaries - top', p.topDia, p.topSpacing / 1000, 'Straight across width', B - 2 * c, nBars(L, p.topSpacing / 1000), 1);
    add(m1, '(v) Supporting chairs @ 1 No./sqm', 10, '-', '2 legs 0.30 + 2 feet 0.15', 0.9, Math.ceil(L * B - 1e-9), 1);
    if (nV > 1) for (const x of rows) if (x.member === m1) { x.nm = nV; x.tl = r2(x.len * x.nb * nV); x.kg = r2(x.tl * x.w); }
    if (p.edgeType !== 'crash') {
      const m2 = `Kerbs  (${2 * nV} Nos.)  ${p.kerbW.toFixed(3)} x ${p.kerbH.toFixed(2)} m`;
      add(m2, '(i) Main bars', 10, '-', 'Straight', L - 2 * c, 4, 2 * nV);
      add(m2, '(ii) Stirrups', 8, 0.2, '2x(0.145+0.22) + 2x0.32 anch. + 0.10', 2 * (0.145 + 0.22) + 2 * 0.32 + 0.1, nBars(L, 0.2), 2 * nV);
    }
    const m3 = `Bed block over abutment  (2 Nos.)  ${B.toFixed(2)} x 0.50 x ${p.bedBlockT.toFixed(2)} m`;
    add(m3, '(i) Longitudinal bars (T&B)', 10, 0.15, 'Straight', B - 2 * c, 2 * nBars(0.5, 0.15), 2);
    add(m3, '(ii) Transverse bars (T&B)', 10, 0.15, 'Straight', 0.5 - 2 * c, 2 * nBars(B, 0.15), 2);
    if (nV > 1) {
      const m5 = `Bed block over piers  (${nV - 1} Nos.)  ${B.toFixed(2)} x ${p.pierTopW.toFixed(2)} x ${p.bedBlockT.toFixed(2)} m`;
      add(m5, '(i) Longitudinal bars (T&B)', 10, 0.15, 'Straight', B - 2 * c, 2 * nBars(p.pierTopW, 0.15), nV - 1);
      add(m5, '(ii) Transverse bars (T&B)', 10, 0.15, 'Straight', p.pierTopW - 2 * c, 2 * nBars(B, 0.15), nV - 1);
    }
    const m4 = `Approach slab  (2 Nos.)  ${p.approachLen.toFixed(2)} x ${B.toFixed(2)} x ${p.approachThk.toFixed(2)} m`;
    add(m4, '(i) Main bars (T&B)', 12, 0.15, 'Straight', p.approachLen - 2 * c, 2 * nBars(B, 0.15), 2);
    add(m4, '(ii) Distributaries (T&B)', 12, 0.15, 'Straight', B - 2 * c, 2 * nBars(p.approachLen, 0.15), 2);
    const total = r2(rows.reduce((s, x) => s + x.kg, 0));
    const byDia = {};
    for (const x of rows) byDia[x.dia] = r2((byDia[x.dia] || 0) + x.kg);
    return { rows, total, byDia };
  }

  function estimate(d, opts) {
    const o = Object.assign({ rates: {}, seigRates: {}, ga: {} }, opts || {});
    const rates = Object.assign({}, RATES, o.rates);
    const sr = Object.assign({}, SEIG_RATES, o.seigRates);
    const ga = Object.assign({}, GA, o.ga);
    const { p, R } = d;
    const B = R.B, L = R.deckL, typ = R.typ;
    const where = `${typ} @ Km ${p.chainage}`;
    const excDepthAb = r3(p.gl - p.foundationLevel);
    const excDepthW = excDepthAb;
    const lining = r3(p.bedWidth + 2 * Math.sqrt(1 + p.sideSlope ** 2) * (p.fsd + p.freeBoard));
    const abArea = 0.5 * p.frontBatter * R.stemH + p.abTopW * R.stemH + 0.5 * (R.deckTop - R.stemTop) + 0.5 * p.abBackBatter * (R.deckTop - R.ftgTop);
    const abH = R.deckTop - R.ftgTop;
    const wAvg = (p.wTopW + p.wBaseW) / 2;
    const b = bbs(d);
    const nV = R.nV || 1, cosS = Math.cos(((p.skew || 0) * Math.PI) / 180);
    const abL = B / cosS; // abutment / pier length along the skew
    const railing = p.edgeType !== 'crash', apron = p.apron !== 'no';
    const pierArea = ((p.pierTopW + (R.pierBase || p.pierTopW)) / 2) * R.stemH;
    // [desc, no, x, L, W, D]
    const M = {
      exc: [
        ['For abutments', 1, 2, abL + 0.6, R.ftgW + 0.6, excDepthAb],
        ...(nV > 1 ? [[`for piers (${nV - 1} Nos)`, 1, nV - 1, abL + 0.6, R.pierFtgW + 0.6, r3(p.cbl - p.foundationLevel)]] : []),
        ['for splayed wing walls', 1, 4, p.wingLen + 0.6, R.wFtgW + 0.6, excDepthW],
        ['for return walls', 1, 4, 2.6, 2.7, 1.236],
        ...(apron ? [['bed & slope trimming for apron / lining', 1, 1, 2 * p.liningLen + abL, lining, 0.15]] : []),
        ['for shear keys below wing wall footings', 1, 4, p.wingLen, p.keyW, p.keyD],
        ...(p.abKey === 'yes' ? [['for shear keys below abutment footings', 1, 2, abL, p.keyW, p.keyD]] : []),
        ...(apron ? [['for curtain walls at u/s & d/s ends of lining', 1, 2, lining, 0.5, 1]] : []),
      ],
      pcc: [
        ['For abutment foundation', 1, 2, abL, R.ftgW, p.footingT],
        ...(nV > 1 ? [['for pier foundations', 1, nV - 1, abL, R.pierFtgW, p.footingT]] : []),
        ['for splayed wing walls', 1, 4, p.wingLen, R.wFtgW, p.wFootT],
        ['for return walls', 1, 4, 2, 2.1, 0.3],
        ['for shear keys under wing walls', 1, 4, p.wingLen, p.keyW, p.keyD],
        ...(p.abKey === 'yes' ? [['for shear keys under abutment footings', 1, 2, abL, p.keyW, p.keyD]] : []),
        ...(apron ? [['for curtain walls 300 x 1000 at u/s & d/s ends of lining', 1, 2, lining, 0.3, 1]] : []),
      ],
      lining: apron ? [
        [`Bed apron in between abutments (${(p.apronThk * 1000).toFixed(0)} thk)`, 1, 1, abL, r3(R.clearCBL), p.apronThk],
        [`CC lining bed & slopes u/s & d/s ${p.liningLen} m each (${(p.liningThk * 1000).toFixed(0)} thk)`, 1, 2, p.liningLen, lining, p.liningThk],
      ] : [],
      plum: [
        [`For abutments (section ${abArea.toFixed(3)} sqm = ${(abArea / abH).toFixed(4)} avg x ${abH.toFixed(3)} ht)`, 1, 2, abL, r3(abArea / abH), r3(abH)],
        ...(nV > 1 ? [[`for piers (section ${pierArea.toFixed(3)} sqm)`, 1, nV - 1, abL, r3(pierArea / R.stemH), r3(R.stemH)]] : []),
        [`for splayed wing walls (${p.wTopW.toFixed(2)}+${p.wBaseW.toFixed(2)})/2 tapering, avg ${wAvg.toFixed(3)}`, 1, 4, p.wingLen, r3(wAvg), r3(R.wFreeH)],
        ['for return walls (1000 x 1100)', 1, 4, 1, 1.1, 1.5],
      ],
      bedblock: [['for bed blocks on abutments', 1, 2, abL, 0.5, p.bedBlockT], ...(nV > 1 ? [['for bed blocks on piers', 1, nV - 1, abL, p.pierTopW, p.bedBlockT]] : [])],
      deck: [
        ['for deck slab', 1, nV, L, B, p.D],
        ...(railing ? [['for kerb walls', 1, 2 * nV, L, p.kerbW, p.kerbH]] : []),
        ...(p.fpW > 0 ? [['for raised footpaths', 1, 2 * nV, L, p.fpW, p.fpThk]] : []),
        ['for approach slab', 1, 2, p.approachLen, B, p.approachThk],
      ],
      wc: [
        ['wearing coat over carriageway (deck)', 1, nV, L, p.carriageway, p.wc],
        ['wearing coat over approach slabs', 1, 2, p.approachLen, p.carriageway, p.wc],
      ],
      rail: railing ? [['on both sides of deck', 1, 2, R.totalLength, 1, 1]] : [],
      crash: railing ? [] : [['on both sides of deck and approach slabs', 1, 2, R.totalLength + 2 * p.approachLen, 1, 1]],
    };
    const items = ITEMS.filter((it) => it.key === 'steel' || (M[it.key] || []).length).map((it, i) => {
      const rows = (M[it.key] || []).map(([desc, n1, n2, l, w, dd]) => {
        const l3 = r3(l), w3 = r3(w), d3 = r3(dd);
        return { desc, n1, n2, l: l3, w: w3, d: d3, qty: r3(n1 * n2 * l3 * w3 * d3) };
      });
      const qty = it.key === 'steel' ? b.total : r3(rows.reduce((s, x) => s + x.qty, 0));
      const rate = rates[it.code];
      return Object.assign({}, it, { sl: i + 1, long: it.long.replace('{TYP}', typ), where, rows, qty, rate, amount: Math.round(qty * rate) });
    });
    const ecv = items.reduce((s, x) => s + x.amount, 0);
    // seigniorage
    const seig = items.filter((x) => x.seig).map((x) => ({
      name: `${x.seigName}  ${x.code}`, qty: x.qty, f: x.seig,
      metal: x.qty * x.seig[0], nsand: x.qty * x.seig[1], msand: x.qty * x.seig[2],
    }));
    const tot = { metal: 0, nsand: 0, msand: 0 };
    for (const s of seig) { tot.metal += s.metal; tot.nsand += s.nsand; tot.msand += s.msand; }
    const amt = { metal: Math.round(tot.metal * sr.metal), nsand: Math.round(tot.nsand * sr.nsand), msand: Math.round(tot.msand * sr.msand) };
    const seigTotal = amt.metal + amt.nsand + amt.msand;
    const dmf = Math.round(seigTotal * ga.dmf);
    const smet = Math.round(seigTotal * ga.smet);
    const permit = (amt.metal + amt.msand) * ga.permit;
    const theo = items.filter((x) => x.theo).map((x) => ({ name: x.theoName, qty: x.qty, fm: x.theo[0], fs: x.theo[1], metal: x.qty * x.theo[0], sand: x.qty * x.theo[1] }));
    // general abstract
    const lc = ecv * ga.labourCess;
    const nac = Math.round(ecv * ga.nac);
    const partB = lc + nac + seigTotal + smet + dmf + permit;
    const gst = (ecv + partB) * ga.gst;
    const sub = ecv + partB + gst;
    const rounding = Math.ceil(sub / 1000 - 1e-9) * 1000 - sub + ga.roundExtra;
    const total = sub + rounding;
    const genAbst = [
      ['Total ECV Amount', ecv],
      [` LS Provision for Labour Cess @ ${ga.labourCess * 100} %`, lc],
      [` LS Provision for NAC @ ${ga.nac * 100} %`, nac],
      [' LS Provision for Seigniorage Charges', seigTotal],
      [` SMET Provision @ ${ga.smet * 100} % for Seigniorage Charges`, smet],
      [` DMF Provision @ ${ga.dmf * 100} % for Seigniorage Charges`, dmf],
      [`Provision towards Permit Charges @ ${ga.permit * 100} % for Seigniorage Charges`, permit],
      [`Add ${(ga.gst * 100).toFixed(2)}% GST on (Part A+Part B)`, gst],
      ['Rounding off and unforseen expenditure', rounding],
    ];
    return {
      nameOfWork: `Name of work:- ${R.nameOfWork}`, items, ecv, bbs: b, seig, seigTot: tot, seigAmt: amt, seigRates: sr, seigTotal, dmf, smet, permit,
      theo, genAbst, lc, nac, partB, gst, rounding, total, lakhs: total / 100000, rates, ga,
    };
  }

  Object.assign(BD, { estimate, bbs, RATES, SEIG_RATES, GA, EST_ITEMS: ITEMS });
})(typeof window !== 'undefined' ? window : globalThis);
