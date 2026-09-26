/*
 * SLRB / DLRB design engine.
 *
 * Reproduces the department's Excel design sheet (DESIGN OF S.L.R.B. ... WSM,
 * IRC 5 / 6 / 21 / 78, IRC SP:13, IS 456) section by section. Units follow the
 * sheet: metres, tonnes, t/sqm, except where noted (mm, N/sqmm, kN-m).
 *
 * SLRB : single lane, carriageway 4.25 m, one lane of IRC Class A.
 * DLRB : two lane, carriageway 7.50 m (IRC 5 cl.104.3.1), governing of
 *        two lanes of IRC Class A or one lane of IRC Class 70R
 *        (tracked / wheeled bogie) as per IRC 6 Table 6A.
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});

  // ---------------------------------------------------------------- inputs
  // Defaults reproduce SLRB @ Km 0.450 of L-1 Minor, Perur Major (NSLBC).
  const DEFAULTS = {
    // project
    bridgeType: 'SLRB',
    chainage: '0.450',
    canalName: 'L-1 Minor of Perur Major (NSLBC)',
    location: 'Haliya',
    district: 'Nalgonda',
    state: 'GOVERNMENT OF TELANGANA',
    department: 'IRRIGATION & CAD DEPARTMENT',
    subDivision: 'Irr.Sub-Division No.3,Miryalaguda',
    division: 'Irr.Division No.3,Miryalaguda',
    project: 'Nagarjuna Sagar Project',
    roadType: 'C.T ROAD',
    frlNote: 'FRL adopted = avg top of existing Culvert-1 (Ch 400).',
    // 1. canal data (hydraulic particulars)
    Q: 0.44, bedWidth: 1.676, fsd: 0.549, sideSlope: 1.5, freeBoard: 0.61,
    bedFall: 2500, cbl: 145.819, cblExisting: 145.968, manningN: 0.025,
    bankWidthL: 1.5, bankWidthR: 1.5,
    // 2. general arrangement
    span: 3.5, carriageway: 4.25, kerbW: 0.225, kerbH: 0.3, railingLoad: 0.1,
    bearingW: 0.48, frl: 147.945, gl: 147.545, approachLen: 3.5, approachThk: 0.3,
    // 3. levels
    foundationLevel: 144.55, wc: 0.075, D: 0.375, bedBlockT: 0.3, footingT: 0.5,
    frontBatter: 0.6,
    // 4. scour
    siltFactor: 1.0, apronThk: 0.15, liningLen: 15, liningThk: 0.1,
    // 5. deck slab
    scbc: 7, sst: 200, modRatio: 10, cover: 0.04, mainDia: 16, mainSpacing: 125,
    distDia: 10, distSpacing: 150, topDia: 10, topSpacing: 200,
    // 6. abutment
    abTopW: 1.0, abBackBatter: 0.9, abToe: 0.5, abHeel: 0.5, gammaSoil: 2.0,
    phi: 28, surcharge: 1.2, mu: 0.5, sbc: 15,
    // 7. wing walls
    wFootT: 0.3, keyW: 0.5, keyD: 0.75, wTopW: 0.45, wFrontBatter: 0.8, wBaseW: 2.5,
    wToe: 0.3, wHeel: 0.3, wingLen: 2.5,
  };

  const CARRIAGEWAY = { SLRB: 4.25, DLRB: 7.5 };

  // IRC 21 cl.305.16.2 table - alpha for simply supported slabs vs B/L
  const ALPHA_TABLE = [
    [0.1, 0.4], [0.2, 0.8], [0.3, 1.16], [0.4, 1.48], [0.5, 1.72], [0.6, 1.96],
    [0.7, 2.12], [0.8, 2.24], [0.9, 2.36], [1.0, 2.48], [1.1, 2.6], [1.2, 2.64],
    [1.3, 2.72], [1.4, 2.8], [1.5, 2.84], [1.6, 2.88], [1.7, 2.92], [1.8, 2.96],
    [1.9, 3.0], [2.0, 3.0], [9.9, 3.0],
  ];

  // Same as the sheet: MATCH(...,1) then linear step to the next row (/0.1).
  function alphaFor(bl) {
    let i = 0;
    for (let k = 0; k < ALPHA_TABLE.length; k++) if (ALPHA_TABLE[k][0] <= bl + 1e-12) i = k;
    if (bl < ALPHA_TABLE[0][0]) return ALPHA_TABLE[0][1];
    if (i >= ALPHA_TABLE.length - 1) return ALPHA_TABLE[i][1];
    const [x0, y0] = ALPHA_TABLE[i];
    const y1 = ALPHA_TABLE[i + 1][1];
    return y0 + ((bl - x0) / 0.1) * (y1 - y0);
  }

  const rad = (d) => (d * Math.PI) / 180;
  const fmt = (v, n = 3) => (typeof v === 'number' && isFinite(v) ? v.toFixed(n) : String(v));

  // Effective width of a row of loads across the deck (IRC 21 cl.305.16).
  // Each load patch disperses over bef centred on it, limited by deck edges.
  // Where dispersions overlap they act together (union); where they do not,
  // the most heavily loaded group governs. Returns load intensity per m width
  // for a total row load P shared equally by the patches.
  function rowIntensity(P, xs, bef, B) {
    const iv = xs.map((x) => [Math.max(0, x - bef / 2), Math.min(B, x + bef / 2)]).sort((a, b) => a[0] - b[0]);
    const groups = [];
    for (const [a, b] of iv) {
      const last = groups[groups.length - 1];
      if (last && a <= last.b + 1e-9) { last.b = Math.max(last.b, b); last.n++; }
      else groups.push({ a, b, n: 1 });
    }
    const per = P / xs.length;
    let best = { q: 0, width: 0 };
    for (const gr of groups) {
      const q = (per * gr.n) / (gr.b - gr.a);
      if (q > best.q) best = { q, width: ((gr.b - gr.a) * xs.length) / gr.n };
    }
    best.groups = groups.length;
    return best; // width = equivalent width for the whole row
  }

  // ------------------------------------------------------------ live loads
  // Returns the list of vehicles to check for the given carriageway.
  function vehiclesFor(p, B, L) {
    const WC = p.wc;
    const v = [];
    // IRC Class A train: governing 11.4 t axles, 1.2 m apart; wheels 1.8 m c/c,
    // tyre 0.25 x 0.50; clearance f = 0.15 m from kerb face (IRC 6 Fig.1).
    const edge = p.kerbW + 0.15 + 0.25; // wheel centre from deck edge
    const impA = L <= 3 ? 0.5 : 4.5 / (6 + L); // IRC 6 cl.208.2
    const trainsA = p.carriageway >= 5.3 ? [1, 2] : [1];
    for (const n of trainsA) {
      const xs = [];
      for (let t = 0; t < n; t++) {
        const x0 = edge + t * (1.8 + 0.25 + 1.2 + 0.25); // min gap between trains 1.2 m
        xs.push(x0, x0 + 1.8);
      }
      v.push({
        id: n === 1 ? 'A1' : 'A2',
        name: n === 1 ? 'IRC Class A (one lane)' : 'IRC Class A (two lanes)',
        axle: 11.4 * n, axleGap: 1.2, nAxles: 2, xs, impact: impA,
        cAlong: 0.25 + 2 * WC, b1: 0.5 + 2 * WC, shift: 0.3, tracked: false,
        brakingFrac: n === 1 ? 0.2 : 0.15, // 20 % first train + 10 % second
      });
    }
    if (p.carriageway >= 5.3) {
      // IRC Class 70R (IRC 6 Fig.1A), 1.2 m clearance to kerb face for 2-lane.
      const impTr = L <= 5 ? 0.25 : L <= 9 ? 0.25 - ((L - 5) * 0.15) / 4 : 0.1;
      const x70 = p.kerbW + 1.2 + 0.42;
      v.push({
        id: 'R70T', name: 'IRC Class 70R tracked', P: 70, length: 4.57,
        xs: [x70, x70 + 2.06], impact: impTr, cAlong: 4.57 + 2 * WC, b1: 0.84 + 2 * WC,
        tracked: true, brakingFrac: 0.2,
      });
      const xb = p.kerbW + 1.2 + 0.43;
      v.push({
        id: 'R70W', name: 'IRC Class 70R wheeled (bogie 2 x 20 t)',
        axle: 20, axleGap: 1.22, nAxles: 2, xs: [xb, xb + 1.93], impact: L < 9 ? 0.25 : 0.25,
        cAlong: 0.36 + 2 * WC, b1: 0.86 + 2 * WC, shift: 0.305, tracked: false, brakingFrac: 0.2,
      });
    }
    return v;
  }

  // Live-load BM and support shear per m width for one vehicle.
  function vehicleEffects(veh, alpha, L, B) {
    const befAt = (a) => alpha * a * (1 - a / L) + veh.b1;
    const out = { veh };
    if (veh.tracked) {
      const P = veh.P * (1 + veh.impact);
      const c = veh.cAlong;
      const bef = befAt(L / 2);
      const r = rowIntensity(P, veh.xs, bef, B);
      out.bef = bef; out.width = r.width;
      const q = P / r.width; // t per m width over contact length c
      out.M = c >= L ? ((q / c) * L * L) / 8 : q * (L / 4 - c / 8);
      // shear: track starting at support
      const cOn = Math.min(c, L);
      const Pon = P * (cOn / c);
      const befV = befAt(Math.min(cOn / 2, L / 2));
      const rV = rowIntensity(Pon, veh.xs, befV, B);
      out.V = (Pon / rV.width) * (L - cOn / 2) / L;
      out.detail = { P, c, cOn, Pon, befV, widthV: rV.width };
      return out;
    }
    const P = veh.axle * (1 + veh.impact);
    const a1 = L / 2 - veh.shift;
    const a2 = L - a1 - veh.axleGap; // from nearer support
    const bef1 = befAt(a1);
    const r1 = rowIntensity(P, veh.xs, bef1, B);
    const p1 = P / r1.width;
    let bef2 = 0, w2 = 0, p2 = 0;
    const second = a2 > 0;
    if (second) {
      bef2 = befAt(a2);
      const r2 = rowIntensity(P, veh.xs, bef2, B);
      w2 = r2.width; p2 = P / w2;
    }
    const RA = (p1 * (L - a1) + (second ? p2 * a2 : 0)) / L;
    out.M = RA * a1 - (p1 * veh.cAlong) / 8;
    Object.assign(out, { P, a1, a2, bef1, bef2, w1: r1.width, w2, p1, p2, RA, second });
    // shear: first axle at 0.40 m, second at 0.40 + gap
    const s1 = 0.4, s2 = 0.4 + veh.axleGap;
    const bs1 = befAt(s1);
    const ws1 = rowIntensity(P, veh.xs, bs1, B).width;
    let V = (P / ws1) * (L - s1) / L;
    let bs2 = 0, ws2 = 0;
    if (s2 < L) {
      bs2 = befAt(s2);
      ws2 = rowIntensity(P, veh.xs, bs2, B).width;
      V += (P / ws2) * (L - s2) / L;
    }
    out.V = V;
    out.shear = { s1, s2, bs1, bs2, ws1, ws2 };
    return out;
  }

  // Reaction (t, whole deck, no impact - IRC 6 cl.208.4) and braking (t, whole
  // deck, shared by the 2 abutments) on one abutment, per vehicle.
  function abutmentLL(veh, Lcb) {
    if (veh.tracked) {
      const cOn = Math.min(veh.length, Lcb);
      const Pon = veh.P * (cOn / veh.length);
      return { R: Pon * (1 - cOn / 2 / Lcb), Hb: (veh.brakingFrac * Pon) / 2 };
    }
    const R = veh.axle + (veh.axleGap < Lcb ? (veh.axle * (Lcb - veh.axleGap)) / Lcb : 0);
    const onSpan = veh.axle * (veh.axleGap < Lcb ? 2 : 1);
    let Hb;
    if (veh.id === 'A2') Hb = ((0.2 * onSpan) / 2 + (0.1 * onSpan) / 2) / 2; // 20 % 1st + 10 % 2nd train
    else Hb = (veh.brakingFrac * onSpan) / 2;
    return { R, Hb };
  }

  // ------------------------------------------------------------ main design
  function design(input) {
    const p = Object.assign({}, DEFAULTS, input || {});
    for (const k of Object.keys(DEFAULTS)) if (typeof DEFAULTS[k] === 'number') p[k] = Number(p[k]);
    const isD = p.bridgeType === 'DLRB';
    const R = {}; // results
    const secs = [];
    let cur;
    const sec = (title) => { cur = { title, rows: [] }; secs.push(cur); };
    const row = (label, value, unit = '', remark = '', opt = {}) => {
      cur.rows.push(Object.assign({ label, value, unit, remark }, opt));
      return value;
    };
    const inp = (label, key, unit, remark) => row(label, p[key], unit, remark, { input: key });
    const chk = (label, ok, text, remark) => row(label, text, '', remark || '', { check: true, ok: !!ok });
    const warnings = [];

    // 1. canal data
    sec(`1. CANAL DATA AT SITE (Km ${p.chainage})`);
    inp('Design discharge Q', 'Q', 'cumecs', 'Approved HP statement');
    inp('Bed width', 'bedWidth', 'm');
    inp('Full supply depth FSD', 'fsd', 'm');
    inp('Side slopes (H:V)', 'sideSlope', '');
    inp('Free board', 'freeBoard', 'm');
    inp('Bed fall 1 in', 'bedFall', '');
    inp(`Design CBL at Km ${p.chainage}`, 'cbl', 'm');
    inp(`Existing CBL at Km ${p.chainage}`, 'cblExisting', 'm');
    R.fsl = row('FSL = CBL + FSD', p.cbl + p.fsd, 'm');
    R.tbl = row('TBL = FSL + FB', R.fsl + p.freeBoard, 'm');
    R.topFSL = row('Top width at FSL', p.bedWidth + 2 * p.sideSlope * p.fsd, 'm');
    R.topTBL = row('Top width at TBL', p.bedWidth + 2 * p.sideSlope * (p.fsd + p.freeBoard), 'm');
    R.area = row('Canal waterway area at FSL', (p.bedWidth + p.sideSlope * p.fsd) * p.fsd, 'sqm');
    R.vel = row('Velocity', p.Q / R.area, 'm/s');
    R.spanSuggested = Math.max(2, Math.ceil((R.topFSL - 1e-9) / 0.5) * 0.5);

    // 2. general arrangement
    sec('2. GENERAL ARRANGEMENT');
    row('Clear span (single vent)', p.span, 'm', `> top width at FSL; no pier in canal (suggested ${fmt(R.spanSuggested, 2)} m)`, { input: 'span' });
    inp(`Carriageway width (IRC 5 ${isD ? 'two lane' : 'single lane'})`, 'carriageway', 'm', 'IRC 5 cl.104.3.1');
    inp('Kerb width (each side)', 'kerbW', 'm', 'IRC 5 min 225 mm');
    inp('Kerb height above deck', 'kerbH', 'm', 'Projects 225 mm above road');
    inp('Hand railing (MOST SD/202) load per side', 'railingLoad', 't/m', 'RCC posts + GI pipes');
    R.B = row('Overall deck width B', p.carriageway + 2 * p.kerbW, 'm');
    inp('Bearing width on each abutment (bed block 500 - 20 joint)', 'bearingW', 'm');
    R.deckL = row('Overall deck length', p.span + 2 * p.bearingW, 'm');
    inp('Proposed road level (FRL)', 'frl', 'm', p.frlNote);
    inp('Ground level at site', 'gl', 'm');
    inp(`Approach slab ${fmt(p.approachThk * 1000, 0)} thk x ${fmt(p.approachLen, 2)} m each side (M20)`, 'approachLen', 'm', '20 mm expansion joint at deck ends');
    if (p.span < R.topFSL) warnings.push(`Clear span ${fmt(p.span, 2)} m is less than canal top width at FSL ${fmt(R.topFSL, 3)} m.`);
    if (p.span > 8) warnings.push('Clear span above 8 m: the solid slab / effective width loading used here is intended for short spans; get the design checked.');

    // 3. levels
    sec('3. LEVELS');
    inp('Foundation (base) level adopted', 'foundationLevel', 'm', 'Checked against scour in section 4');
    inp('Wearing coat thickness (M20)', 'wc', 'm');
    inp('Deck slab overall thickness D', 'D', 'm');
    R.deckTop = row('Deck top level', p.frl - p.wc, 'm');
    R.soffit = row('Soffit / bed block top level', R.deckTop - p.D, 'm');
    R.okSoffit = R.soffit >= R.tbl;
    R.frlMin = R.tbl + p.D + p.wc;
    chk('Check soffit >= TBL', R.okSoffit, R.okSoffit ? `OK - clearance ${fmt(R.soffit - R.tbl)} m above TBL` : `REVISE - raise FRL to at least +${fmt(R.frlMin)}`);
    R.clearFSL = row('Vertical clearance soffit above FSL', R.soffit - R.fsl, 'm', 'IRC 5 cl.106: > FB for canal');
    inp('Bed block thickness (RCC M20)', 'bedBlockT', 'm');
    R.stemTop = row('Bed block bottom / stem top level', R.soffit - p.bedBlockT, 'm');
    inp('Footing thickness (PCC M15)', 'footingT', 'm');
    R.ftgTop = row('Footing top / stem bottom level', p.foundationLevel + p.footingT, 'm');
    R.stemH = row('Height of abutment stem', R.stemTop - R.ftgTop, 'm');
    R.abTop = row('Abutment top (dirt wall part) = deck top level', R.deckTop, 'm', 'Approach slab butts against it');
    R.approachBot = row('Approach slab bottom level', R.deckTop - p.approachThk, 'm');
    R.H = row('Overall height (FRL to foundation base)', p.frl - p.foundationLevel, 'm');
    inp('Front (water face) batter of abutment', 'frontBatter', 'm');
    const clearAt = (lvl) => p.span - 2 * p.frontBatter * (1 - (lvl - R.ftgTop) / R.stemH);
    R.clearCBL = row('Clear width between abutments at CBL', clearAt(p.cbl), 'm');
    R.clearFSLw = row('Clear width between abutments at FSL', clearAt(R.fsl), 'm', '>= canal top width at FSL');

    // 4. vent way / scour
    sec('4. VENTWAY, SCOUR AND FOUNDATION LEVEL (IRC 5 / IRC 78)');
    R.ventArea = row('Vent area at FSL = avg clear width x FSD', ((R.clearCBL + R.clearFSLw) / 2) * p.fsd, 'sqm');
    R.ratio = row('Ratio canal area / vent area', R.area / R.ventArea, '', R.area / R.ventArea < 1 ? '< 1 : vent wider than canal, no contraction' : 'Contraction - afflux computed');
    R.afflux = row('Afflux (Molesworth)', Math.max(0, (R.vel ** 2 / 17.88 + 0.01524) * ((R.area / R.ventArea) ** 2 - 1)), 'm');
    R.Qs = row('Design discharge for scour = 1.3 Q (IRC 78 cl.703.1.1)', 1.3 * p.Q, 'cumecs');
    inp('Silt factor f', 'siltFactor', '', 'Assumed; confirm by soil test');
    R.q = row('Discharge per m width q (on width at bed)', R.Qs / R.clearCBL, 'cumec/m');
    R.dsm = row('Normal scour depth dsm = 1.34 (q^2/f)^(1/3)', 1.34 * Math.cbrt(R.q ** 2 / p.siltFactor), 'm', 'Lacey');
    R.maxScourD = row('Max scour depth at abutment = 1.27 dsm', 1.27 * R.dsm, 'm', 'IRC 78 cl.703.3.1');
    R.msl = row('Max scour level = FSL - 1.27 dsm', R.fsl - R.maxScourD, 'm');
    R.flScour = row('Foundation level required <= MSL - 1.20 m', R.msl - 1.2, 'm', 'IRC 78 cl.705.2.1.1');
    R.flApron = row(`With rigid CC apron between abutments + ${fmt(p.liningLen, 0)} m lining u/s & d/s: foundation <= apron bottom - 1.0 m (IRC SP:13)`, p.cbl - p.apronThk - 1, 'm', 'Floor-protected culvert criterion');
    const okS = p.foundationLevel <= R.flScour + 0.01, okA = p.foundationLevel <= R.flApron + 0.001;
    R.okFound = okS || okA;
    chk('Check foundation level', R.okFound, R.okFound ? 'OK' + (okS ? '' : ' (apron-protected criterion governs)') : 'REVISE');
    R.flSuggested = Math.floor((Math.max(R.flScour + 0.01, R.flApron) + 1e-9) / 0.05) * 0.05;
    R.foundDepth = row('Depth of foundation below design CBL', p.cbl - p.foundationLevel, 'm', 'BC soil: kept > 1.0 m');
    row(`Curtain walls at u/s & d/s ends of apron/lining: CC M15 300 thk x 1000 deep`, 'provided', '', 'IRC SP:13 / IRC 89 floor protection');
    const totLen = R.deckL;
    row('Seismic check (IRC 6-2017 cl.219.1)', p.span < 15 && totLen < 60 ? 'Not required' : 'Required', '', 'Seismic Zone II, span < 15 m, total length < 60 m');

    // 5. deck slab
    sec('5. DESIGN OF DECK SLAB (IRC 21 WSM, effective width method IRC 21 cl.305.16)');
    inp('Concrete M20: sigma cbc', 'scbc', 'N/sqmm', 'IRC 21 Table 9');
    inp('Steel Fe415: sigma st', 'sst', 'N/sqmm', 'IRC 21 cl.303.2');
    inp('Modular ratio m', 'modRatio', '', 'IRC 21');
    R.k = row('k = m.scbc/(m.scbc+sst)', (p.modRatio * p.scbc) / (p.modRatio * p.scbc + p.sst));
    R.j = row('j = 1 - k/3', 1 - R.k / 3);
    R.Qc = row('Q = 0.5 scbc k j', 0.5 * p.scbc * R.k * R.j, 'N/sqmm');
    inp('Clear cover', 'cover', 'm', 'IRC 21 cl.304.3');
    inp('Main bar dia', 'mainDia', 'mm');
    R.d = row('Effective depth d', p.D * 1000 - p.cover * 1000 - p.mainDia / 2, 'mm');
    const L = (R.Leff = row('Effective span = least of (clear span + d) and c/c bearings', Math.min(p.span + R.d / 1000, p.span + p.bearingW), 'm', 'IRC 21 cl.305.10.1'));
    const B = R.B;
    R.BL = row('B / L', B / L);
    R.alpha = row('alpha (IRC 21 cl.305.16.2 table)', alphaFor(B / L));
    const vehicles = vehiclesFor(p, B, L);
    R.vehicles = vehicles.map((v) => vehicleEffects(v, R.alpha, L, B));
    R.DLw = (p.D * 2.5 + p.wc * 2.2);
    R.MDL = (R.DLw * L * L) / 8;

    // show the sheet's Class A (one lane) working in full, other vehicles summarised
    const ea = R.vehicles[0];
    const va = ea.veh;
    row('Impact factor Class A = 4.5/(6+L)', va.impact, '', 'IRC 6 cl.208.2');
    row('Class A heaviest axle', 11.4, 't', 'IRC 6 Fig.1');
    row('Axle with impact P', ea.P, 't');
    row('Tyre contact along span', 0.25, 'm');
    row('Tyre contact across span', 0.5, 'm');
    row('Loaded length along span = 0.25 + 2 WC', va.cAlong, 'm');
    row('b1 = 0.50 + 2 WC', va.b1, 'm');
    row('Clearance wheel to kerb face', 0.15, 'm', 'IRC 6 Fig.1');
    row('Wheel c/c across', 1.8, 'm');
    row('Wheel centre to deck edge', va.xs[0], 'm');
    row('Wheel centre to far edge beyond inner wheel', B - va.xs[1], 'm');
    row('(a) Maximum bending moment: two 11.4 t axles, 1.2 m apart, placed for max BM', '', '', '', { sub: true });
    row('Axle 1 distance from support a1 = L/2 - 0.30', ea.a1, 'm');
    row('Axle 2 distance from nearer support a2', ea.a2, 'm');
    row('bef1 = alpha.a1(1-a1/L)+b1', ea.bef1, 'm');
    row('bef2 = alpha.a2(1-a2/L)+b1', ea.bef2, 'm');
    row('Width for axle 1 (both wheels, overlapping, edge limited)', ea.w1, 'm');
    row('Width for axle 2', ea.w2, 'm');
    row('Load per m width, axle 1', ea.p1, 't/m');
    row('Load per m width, axle 2', ea.p2, 't/m');
    row('Reaction RA', ea.RA, 't');
    row('LL moment under axle 1 = RA.a1 - P1.c/8', ea.M, 't-m/m');
    let gov = ea;
    if (R.vehicles.length > 1) {
      row('Other live loads for this carriageway (IRC 6 Table 6A)', '', '', '', { sub: true });
      for (const e of R.vehicles.slice(1)) {
        const v = e.veh;
        if (v.tracked) {
          row(`${v.name}: impact ${fmt(v.impact * 100, 1)} %, P = ${fmt(e.detail.P, 2)} t over ${fmt(v.cAlong, 2)} m, bef at L/2 = ${fmt(e.bef, 3)} m, width = ${fmt(e.width, 3)} m`, e.M, 't-m/m', 'LL moment');
        } else {
          row(`${v.name}: impact ${fmt(v.impact * 100, 1)} %, P = ${fmt(e.P, 2)} t/axle, widths ${fmt(e.w1, 3)} / ${fmt(e.w2, 3)} m`, e.M, 't-m/m', 'LL moment');
        }
        if (e.M > gov.M) gov = e;
      }
      row('Governing live load for bending', gov.veh.name, '', '');
    }
    R.govM = gov;
    R.MLL = gov.M;
    row('Dead load: slab + wearing coat', R.DLw, 't/sqm');
    row('DL moment = w L^2/8', R.MDL, 't-m/m');
    R.M = row('Total design moment M', R.MLL + R.MDL, 't-m/m');
    R.MkN = row('M in kN-m', R.M * 9.81, 'kN-m/m');
    R.dReq = row('d required = sqrt(M/Q.b)', Math.sqrt((R.MkN * 1e6) / (R.Qc * 1000)), 'mm');
    R.okDepth = R.dReq <= R.d;
    chk('Check depth', R.okDepth, R.okDepth ? `OK  (${fmt(R.dReq, 0)} < ${fmt(R.d, 0)} mm)` : `REVISE (${fmt(R.dReq, 0)} > ${fmt(R.d, 0)} mm)`);
    R.AstReq = row('Ast required = M/(sst.j.d)', (R.MkN * 1e6) / (p.sst * R.j * R.d), 'sqmm/m');
    row('Main bar spacing adopted', p.mainSpacing, 'mm', `${p.mainDia} dia straight, bottom`, { input: 'mainSpacing' });
    R.AstProv = row('Ast provided', ((Math.PI / 4) * p.mainDia ** 2 * 1000) / p.mainSpacing, 'sqmm/m');
    R.okAst = R.AstProv >= R.AstReq;
    chk('Check main steel', R.okAst, R.okAst ? 'OK' : 'REVISE');
    row('(b) Shear: first axle at 0.40 m from support, second at 1.60 m', '', '', '', { sub: true });
    if (ea.shear) {
      row('bef at 0.40 m', ea.shear.bs1, 'm');
      row(`bef at ${fmt(ea.shear.s2, 2)} m`, ea.shear.bs2, 'm');
      row('Width axle 1', ea.shear.ws1, 'm', 'wheel dispersions combined only where they overlap');
      row('Width axle 2', ea.shear.ws2, 'm');
    }
    let govV = ea;
    for (const e of R.vehicles) if (e.V > govV.V) govV = e;
    if (R.vehicles.length > 1) row('Governing live load for shear', govV.veh.name, '', `LL shear ${fmt(govV.V, 3)} t/m`);
    R.V = row('Shear at support V = LL + DL', govV.V + (R.DLw * L) / 2, 't/m');
    R.tv = row('Nominal shear stress tv', (R.V * 9.81 * 1000) / (1000 * R.d), 'N/sqmm');
    R.pt = row('p = 100 Ast/bd', (100 * R.AstProv) / (1000 * R.d), '%');
    const pt = R.pt;
    R.tc = row('Permissible tc (M20, IS 456 Table 23 / IRC 21 Table 12B)', pt <= 0.25 ? 0.18 + (pt - 0.15) * 0.4 : pt <= 0.5 ? 0.22 + (pt - 0.25) * 0.32 : 0.3 + (pt - 0.5) * 0.2, 'N/sqmm');
    R.okShear = R.tv <= R.tc;
    chk('Check shear (no shear reinforcement needed)', R.okShear, R.okShear ? 'OK' : 'PROVIDE SHEAR STEEL / INCREASE D');
    row('(c) Distribution steel', '', '', '', { sub: true });
    R.Md = row('Md = 0.3 M(LL) + 0.2 M(DL)', 0.3 * R.MLL + 0.2 * R.MDL, 't-m/m', 'IRC 21 cl.305.18');
    R.AstD = row(`Ast required (d - ${fmt((p.mainDia + p.distDia) / 2, 0)} mm)`, (R.Md * 9.81 * 1e6) / (p.sst * R.j * (R.d - (p.mainDia + p.distDia) / 2)), 'sqmm/m');
    R.AstMin = row('Minimum 0.12% bD', 0.0012 * 1000 * p.D * 1000, 'sqmm/m');
    R.AstDProv = row(`Provided ${p.distDia} dia @ ${p.distSpacing} c/c (bottom)`, ((Math.PI / 4) * p.distDia ** 2 * 1000) / p.distSpacing, 'sqmm/m');
    R.okDist = R.AstDProv >= Math.max(R.AstD, R.AstMin);
    chk('Check distribution', R.okDist, R.okDist ? 'OK' : 'REVISE');
    R.AstTop = row(`Top steel both ways ${p.topDia} dia @ ${p.topSpacing} c/c (temperature)`, ((Math.PI / 4) * p.topDia ** 2 * 1000) / p.topSpacing, 'sqmm/m');

    // 6. abutment
    sec('6. ABUTMENT (CC M15 with 15% plums) - STABILITY (IRC 78, per m length)');
    inp('Stem top width at bed block level (bed block 0.50 + dirt wall part 0.50)', 'abTopW', 'm');
    inp('Back batter projection', 'abBackBatter', 'm');
    R.stemBase = row('Stem base width', p.frontBatter + p.abTopW + p.abBackBatter, 'm');
    inp('Footing toe projection', 'abToe', 'm');
    inp('Footing heel projection', 'abHeel', 'm');
    R.ftgW = row('Footing width', p.abToe + R.stemBase + p.abHeel, 'm');
    inp('Unit wt of soil', 'gammaSoil', 't/cum', 'PCC 2.4 / RCC 2.5');
    inp('Angle of internal friction', 'phi', 'deg', 'Assumed for back fill');
    R.Ka = row('Ka (Rankine)', (1 - Math.sin(rad(p.phi))) / (1 + Math.sin(rad(p.phi))));
    R.Kp = row('Kp = 1/Ka', 1 / R.Ka);
    inp('LL surcharge equivalent height', 'surcharge', 'm', 'IRC 6 cl.214.1.1.3');
    inp('Coefficient of friction (concrete on soil)', 'mu', '');
    inp('Safe bearing capacity (assumed)', 'sbc', 't/sqm', 'To be confirmed by trial pit');
    row('Vertical loads (t) and lever arms from toe (m)', 'W (t)', '', 'arm x (m) from toe', { sub: true });
    const toe = p.abToe, fb = p.frontBatter;
    const W = [];
    const wrow = (label, w, x) => { W.push({ label, w, x }); row(label, w, 't', `x = ${fmt(x, 3)} m`); return { w, x }; };
    wrow('Footing', R.ftgW * p.footingT * 2.4, R.ftgW / 2);
    wrow('Stem - front triangle', 0.5 * fb * R.stemH * 2.4, toe + (2 * fb) / 3);
    wrow('Stem - rectangle below bed block level', p.abTopW * R.stemH * 2.4, toe + fb + p.abTopW / 2);
    wrow('Stem - top part behind bed block (0.50 wide) up to deck top', 0.5 * (R.abTop - R.stemTop) * 2.4, toe + fb + 0.75);
    wrow('Stem - back triangle', 0.5 * p.abBackBatter * (R.abTop - R.ftgTop) * 2.4, toe + fb + p.abTopW + p.abBackBatter / 3);
    wrow('Bed block 0.50 x 0.30 (RCC)', 0.5 * p.bedBlockT * 2.5, toe + fb + 0.25);
    wrow('Soil over back batter', 0.5 * p.abBackBatter * (R.abTop - R.ftgTop) * p.gammaSoil, toe + fb + p.abTopW + (2 * p.abBackBatter) / 3);
    wrow('Soil over heel', p.abHeel * (p.frl - R.ftgTop) * p.gammaSoil, toe + R.stemBase + p.abHeel / 2);
    const deckDL = ((p.D * 2.5 * B + p.wc * 2.2 * p.carriageway + 2 * (p.kerbW * p.kerbH * 2.5 + p.railingLoad)) * R.deckL / 2) / B;
    const xBrg = toe + fb + p.bearingW / 2;
    wrow('Deck DL reaction (slab + WC + kerbs + railing)', deckDL, xBrg);
    const Lcb = p.span + p.bearingW;
    R.LLcases = vehicles.map((v) => {
      const a = abutmentLL(v, Lcb);
      return { name: v.name, id: v.id, R: a.R / B, Hb: a.Hb / B };
    });
    for (const c of R.LLcases) row(`LL reaction ${c.name}, no impact at fdn (IRC 6 cl.208.4)`, c.R, 't', `x = ${fmt(xBrg, 3)} m`);
    row('Horizontal forces (t) and lever arms above base (m)', '', '', '', { sub: true });
    const Pa = 0.5 * R.Ka * p.gammaSoil * R.H ** 2, yPa = R.H / 3;
    const Ps = R.Ka * p.gammaSoil * p.surcharge * R.H, yPs = R.H / 2;
    const yBr = R.soffit - p.foundationLevel;
    row('Active earth pressure 0.5 Ka g H^2 (H = FRL - base)', Pa, 't', `y = ${fmt(yPa, 3)} m`);
    row('LL surcharge Ka g h H', Ps, 't', `y = ${fmt(yPs, 3)} m`);
    for (const c of R.LLcases) row(`Braking - ${c.name}, shared by 2 abutments, at bearing level`, c.Hb, 't', `y = ${fmt(yBr, 3)} m`);
    const sumV1 = W.reduce((s, o) => s + o.w, 0);
    const sumMR1 = W.reduce((s, o) => s + o.w * o.x, 0);
    const sumH1 = Pa + Ps, sumMO1 = Pa * yPa + Ps * yPs;
    const stab = (V, MR, H, MO) => {
      const e = R.ftgW / 2 - (MR - MO) / V;
      return { V, MR, H, MO, fosO: MR / MO, fosS: (p.mu * V) / H, e, pmax: (V / R.ftgW) * (1 + (6 * e) / R.ftgW), pmin: (V / R.ftgW) * (1 - (6 * e) / R.ftgW) };
    };
    const cases = [Object.assign({ name: 'Case 1: span unloaded' }, stab(sumV1, sumMR1, sumH1, sumMO1))];
    for (const c of R.LLcases) {
      cases.push(Object.assign({ name: `Case 2: ${c.name} on span` }, stab(sumV1 + c.R, sumMR1 + c.R * xBrg, sumH1 + c.Hb, sumMO1 + c.Hb * yBr)));
    }
    R.abCases = cases;
    for (const c of cases) {
      row(c.name, '', '', '', { sub: true });
      row('Sum V', c.V, 't'); row('Sum MR', c.MR, 't-m'); row('Sum H', c.H, 't'); row('Sum MO', c.MO, 't-m');
      chk('FOS overturning (>= 2.0)', c.fosO >= 2, fmt(c.fosO, 2), 'IRC 78 cl.706.3.4');
      chk('FOS sliding (>= 1.5)', c.fosS >= 1.5, fmt(c.fosS, 2), 'IRC 78 cl.706.3.4 (no shear key)');
      row('Eccentricity e', c.e, 'm', `< B/6 = ${fmt(R.ftgW / 6, 3)}`);
      chk(`Max base pressure (<= SBC ${fmt(p.sbc, 1)})`, c.pmax <= p.sbc, fmt(c.pmax, 2) + ' t/sqm');
      chk('Min base pressure (>= 0, no tension)', c.pmin >= 0, fmt(c.pmin, 2) + ' t/sqm');
    }
    R.okAb = cases.every((c) => c.fosO >= 2 && c.fosS >= 1.5 && c.pmax <= p.sbc && c.pmin >= 0);
    chk('ABUTMENT RESULT', R.okAb, R.okAb ? 'ALL CHECKS OK' : 'REVISE');
    // stem check at footing top (plain concrete, no tension), each loaded case
    row('Stem base check at footing top (free cantilever, plain concrete - no tension)', '', '', '', { sub: true });
    const stemW = W.slice(1); // excl footing & soil over heel (removed below)
    const Wst = stemW.filter((o) => o.label !== 'Soil over heel');
    const hSt = (R.hStem = p.frl - R.ftgTop);
    const MoSt0 = (0.5 * R.Ka * p.gammaSoil * hSt ** 3) / 3 + (R.Ka * p.gammaSoil * p.surcharge * hSt ** 2) / 2;
    R.stemCases = R.LLcases.map((c) => {
      const V = Wst.reduce((s, o) => s + o.w, 0) + c.R;
      const M = Wst.reduce((s, o) => s + o.w * (o.x - toe), 0) + c.R * (xBrg - toe);
      const Mo = MoSt0 + c.Hb * (R.soffit - R.ftgTop);
      const e = R.stemBase / 2 - (M - Mo) / V;
      return { name: c.name, V, M, Mo, e, smax: (V / R.stemBase) * (1 + (6 * e) / R.stemBase), smin: (V / R.stemBase) * (1 - (6 * e) / R.stemBase) };
    });
    let gs = R.stemCases[0];
    for (const s of R.stemCases) if (s.smin < gs.smin) gs = s;
    R.stemGov = gs;
    row('Governing load', gs.name, '');
    row('V at stem base', gs.V, 't');
    row('M of V about stem front edge', gs.M, 't-m');
    row('Height of earth on stem h = FRL - footing top', hSt, 'm');
    row('Overturning M at stem base', gs.Mo, 't-m');
    row('e at stem base', gs.e, 'm', `< B/6 = ${fmt(R.stemBase / 6, 3)}`);
    row('Max compressive stress', gs.smax, 't/sqm', 'Permissible M15 = 400 t/sqm');
    row('Min stress (>= 0, no tension)', gs.smin, 't/sqm');
    R.okStem = R.stemCases.every((s) => s.smin >= 0 && s.smax <= 400);
    chk('STEM RESULT', R.okStem, R.okStem ? 'OK' : 'REVISE');

    // 7. wing walls
    sec('7. SPLAYED WING WALLS (CC M15 with plums) - max section at abutment end; returns 1000 x 1100');
    inp('Wing footing thickness', 'wFootT', 'm');
    R.wFtgTop = row('Wing footing top level', p.foundationLevel + p.wFootT, 'm');
    inp('Shear key below wing footing: width', 'keyW', 'm');
    inp('Shear key depth', 'keyD', 'm');
    const dk = p.cbl - p.foundationLevel;
    R.Pkey = row('Passive resistance of shear key (FOS 2 applied)', (0.5 * R.Kp * p.gammaSoil * ((dk + p.keyD) ** 2 - dk ** 2)) / 2, 't');
    inp('Top width', 'wTopW', 'm');
    inp('Front batter projection', 'wFrontBatter', 'm');
    inp('Bottom width of stem', 'wBaseW', 'm');
    R.wBack = row('Back batter projection', p.wBaseW - p.wTopW - p.wFrontBatter, 'm');
    inp('Toe projection', 'wToe', 'm');
    inp('Heel projection', 'wHeel', 'm');
    R.wH = row('Stem height (FRL - wing footing top)', p.frl - R.wFtgTop, 'm');
    R.wFtgW = row('Footing width', p.wToe + p.wBaseW + p.wHeel, 'm');
    if (R.wBack < 0) warnings.push('Wing wall: back batter is negative - increase bottom width.');
    const wt = p.wToe, wh = R.wH;
    const WW = [
      ['Footing', R.wFtgW * p.wFootT * 2.4, R.wFtgW / 2],
      ['Stem front triangular', 0.5 * p.wFrontBatter * wh * 2.4, wt + (2 * p.wFrontBatter) / 3],
      ['Stem rectangular', p.wTopW * wh * 2.4, wt + p.wFrontBatter + p.wTopW / 2],
      ['Stem back triangular', 0.5 * R.wBack * wh * 2.4, wt + p.wFrontBatter + p.wTopW + R.wBack / 3],
      ['Soil over back batter', 0.5 * R.wBack * wh * p.gammaSoil, wt + p.wBaseW - R.wBack / 3],
      ['Soil over heel', p.wHeel * wh * p.gammaSoil, wt + p.wBaseW + p.wHeel / 2],
    ];
    for (const [l, w, x] of WW) row(l, w, 't', `x = ${fmt(x, 3)} m`);
    const wV = WW.reduce((s, o) => s + o[1], 0), wMR = WW.reduce((s, o) => s + o[1] * o[2], 0);
    R.w = { V: wV, MR: wMR, H: sumH1, MO: sumMO1 };
    row('Sum V', wV, 't'); row('Sum MR', wMR, 't-m');
    row('Sum H (earth + surcharge)', sumH1, 't'); row('Sum MO', sumMO1, 't-m');
    R.w.fosO = wMR / sumMO1;
    R.w.fosS = (p.mu * wV + R.Pkey) / sumH1;
    R.w.e = R.wFtgW / 2 - (wMR - sumMO1) / wV;
    R.w.pmax = (wV / R.wFtgW) * (1 + (6 * R.w.e) / R.wFtgW);
    R.w.pmin = (wV / R.wFtgW) * (1 - (6 * R.w.e) / R.wFtgW);
    chk('FOS overturning (>= 2.0)', R.w.fosO >= 2, fmt(R.w.fosO, 2));
    chk('FOS sliding incl. shear key (>= 1.5)', R.w.fosS >= 1.5, fmt(R.w.fosS, 2));
    row('e', R.w.e, 'm');
    chk(`Max base pressure (<= SBC ${fmt(p.sbc, 1)})`, R.w.pmax <= p.sbc, fmt(R.w.pmax, 2) + ' t/sqm');
    chk('Min base pressure (>= 0)', R.w.pmin >= 0, fmt(R.w.pmin, 2) + ' t/sqm');
    row('Wing stem base check (free cantilever, plain concrete - no tension)', '', '', '', { sub: true });
    const WS = WW.slice(1, 5);
    const sV = WS.reduce((s, o) => s + o[1], 0), sM = WS.reduce((s, o) => s + o[1] * (o[2] - wt), 0);
    const sMo = (0.5 * R.Ka * p.gammaSoil * wh ** 3) / 3 + (R.Ka * p.gammaSoil * p.surcharge * wh ** 2) / 2;
    const se = p.wBaseW / 2 - (sM - sMo) / sV;
    R.ws = { V: sV, M: sM, Mo: sMo, e: se, smax: (sV / p.wBaseW) * (1 + (6 * se) / p.wBaseW), smin: (sV / p.wBaseW) * (1 - (6 * se) / p.wBaseW) };
    row('V at stem base', sV, 't'); row('M of V about stem front edge', sM, 't-m');
    row('Overturning M at stem base', sMo, 't-m'); row('e at stem base', se, 'm');
    row('Max compressive stress', R.ws.smax, 't/sqm');
    row('Min stress (>= 0)', R.ws.smin, 't/sqm');
    R.okWing = R.w.fosO >= 2 && R.w.fosS >= 1.5 && R.w.pmax <= p.sbc && R.w.pmin >= 0 && R.ws.smin >= 0;
    chk('WING WALL RESULT', R.okWing, R.okWing ? 'ALL CHECKS OK' : 'REVISE');
    R.wFreeH = row('Wing wall at free end: stem height (tapers to ground level)', (p.frl + p.gl) / 2 - R.wFtgTop, 'm', 'Section reduced in proportion');

    // 8. summary
    sec('8. SUMMARY OF ADOPTED DESIGN');
    const abWorst = {
      fosO: Math.min(...cases.map((c) => c.fosO)), fosS: Math.min(...cases.map((c) => c.fosS)),
      pmax: Math.max(...cases.map((c) => c.pmax)), pmin: Math.min(...cases.map((c) => c.pmin)),
    };
    R.abWorst = abWorst;
    R.summary = [
      ['Vent', `1 No. x ${fmt(p.span, 2)} m clear span, RCC solid slab, simply supported`],
      ['Deck', `${fmt(p.D * 1000, 0)} mm RCC M20, ${fmt(R.deckL, 2)} m long x ${fmt(B, 2)} m wide; ${p.mainDia} dia @ ${p.mainSpacing} c/c main, ${p.distDia} dia @ ${p.distSpacing} distribution, ${p.topDia} dia @ ${p.topSpacing} top`],
      ['Live load', isD ? `2-lane Class A / 1-lane Class 70R (governing: ${gov.veh.name})` : 'IRC Class A (single lane)'],
      ['Wearing coat / kerb / railing', `${fmt(p.wc * 1000, 0)} mm M20; RCC kerb ${fmt(p.kerbW * 1000, 0)} x ${fmt(p.kerbH * 1000, 0)}; hand railing as per MOST SD/202`],
      ['Approach slabs', `${fmt(p.approachThk * 1000, 0)} mm RCC M20, ${fmt(p.approachLen, 2)} m long each side, 12 dia @ 150 T&B both ways; 20 mm expansion joints`],
      ['Abutments', `${fmt(p.abTopW, 2)} top / ${fmt(R.stemBase, 2)} base (front batter ${fmt(fb, 2)}, back ${fmt(p.abBackBatter, 2)}), CC M15 plums, stem ${fmt(R.stemH)} m, on ${fmt(R.ftgW, 2)} x ${fmt(p.footingT, 2)} PCC M15 footing`],
      ['Bed blocks', 'RCC M20 500 x 300, 10 dia @ 150 T&B both ways'],
      ['Wing walls', `${fmt(p.wTopW, 2)} top / ${fmt(p.wBaseW, 2)} base (front batter ${fmt(p.wFrontBatter, 2)}), footing ${fmt(R.wFtgW, 2)} x ${fmt(p.wFootT, 2)} + shear key ${fmt(p.keyW, 2)} x ${fmt(p.keyD, 2)}; returns 1000 x 1100`],
      ['Levels', `FRL +${fmt(p.frl)},  soffit +${fmt(R.soffit)},  TBL +${fmt(R.tbl)},  FSL +${fmt(R.fsl)},  CBL +${fmt(p.cbl)},  foundation +${fmt(p.foundationLevel)}`],
      ['Abutment checks', `FOS overturning ${fmt(abWorst.fosO, 2)}, sliding ${fmt(abWorst.fosS, 2)}, base pressure ${fmt(abWorst.pmax, 2)} / ${fmt(abWorst.pmin, 2)} t/sqm, stem ${fmt(gs.smax, 2)} / ${fmt(gs.smin, 2)}`],
      ['Wing checks', `FOS overturning ${fmt(R.w.fosO, 2)}, sliding ${fmt(R.w.fosS, 2)}, base ${fmt(R.w.pmax, 2)} / ${fmt(R.w.pmin, 2)}, stem ${fmt(R.ws.smax, 2)} / ${fmt(R.ws.smin, 2)} t/sqm`],
      ['Canal', `${fmt(p.apronThk * 1000, 0)} mm CC M15 apron between abutments; ${fmt(p.liningThk * 1000, 0)} mm CC M15 lining ${fmt(p.liningLen, 0)} m u/s & d/s with 300 x 1000 CC M15 curtain walls at both ends`],
    ];
    for (const [a, b] of R.summary) row(a, b, '');
    R.assumptions = `Assumptions to confirm at site: SBC ${fmt(p.sbc, 0)} t/sqm (trial pit), silt factor ${fmt(p.siltFactor, 1)}, back-fill phi ${fmt(p.phi, 0)} deg. ${p.frlNote}`;

    R.allOk = R.okSoffit && R.okFound && R.okDepth && R.okAst && R.okShear && R.okDist && R.okAb && R.okStem && R.okWing;
    const typ = isD ? 'D.L.R.B.' : 'S.L.R.B.';
    R.typ = typ;
    R.title = `DESIGN OF ${typ} AT Km ${p.chainage} OF ${p.canalName.toUpperCase()}, ${p.location.toUpperCase()}`;
    R.subtitle = `single vent ${fmt(p.span, 2)} m clear span RCC solid slab | Carriageway ${fmt(p.carriageway, 2)} m | approach slabs | hand railing | ${isD ? 'IRC Class A (2 lanes) / Class 70R' : 'IRC Class A'} | WSM`;
    R.codes = 'Codes: IRC 5-2015, IRC 6-2017, IRC 21-2000 (WSM), IRC 78-2014, IRC SP:13-2004, IS 456-2000, IS 1786-2008, IS 2502-1963.';
    R.nameOfWork = `Construction of ${typ} across ${p.canalName.replace(/\s*\(.*\)\s*/, '')} at Km ${p.chainage} in ${p.location}, ${p.district} District.`;
    return { p, R, sections: secs, warnings };
  }

  // Auto-size helpers used by the "Auto design" button.
  function autoDesign(input) {
    const p = Object.assign({}, DEFAULTS, input);
    const log = [];
    let r = design(p);
    if (Math.abs(p.span - r.R.spanSuggested) > 1e-9 && p.span < r.R.topFSL) { p.span = r.R.spanSuggested; log.push(`Span set to ${p.span} m`); r = design(p); }
    if (!r.R.okFound) { p.foundationLevel = r.R.flSuggested; log.push(`Foundation level set to ${fmt(p.foundationLevel)}`); r = design(p); }
    // deck: least thickness (25 mm steps) for which some bar dia / spacing
    // satisfies depth, main steel and shear together; widest spacing preferred.
    const spacings = [200, 175, 150, 125, 110, 100, 90, 80, 75];
    const dias = [...new Set([p.mainDia, 16, 20, 25])];
    deck: for (let i = 0; i < 40; i++) {
      let fallback = null;
      for (const dia of dias) {
        for (const sp of spacings) {
          const t = design(Object.assign({}, p, { mainDia: dia, mainSpacing: sp })).R;
          if (t.okDepth && t.okAst && t.okShear) {
            if (sp >= 100) { p.mainDia = dia; p.mainSpacing = sp; break deck; }
            if (!fallback) fallback = [dia, sp];
            break;
          }
        }
      }
      if (fallback) { [p.mainDia, p.mainSpacing] = fallback; break; }
      p.D = +(p.D + 0.025).toFixed(3);
    }
    for (const sp of [200, 175, 150, 125, 100]) { p.distSpacing = sp; if (design(p).R.okDist) break; }
    log.push(`Deck ${fmt(p.D * 1000, 0)} mm, ${p.mainDia} dia @ ${p.mainSpacing}, dist ${p.distDia} @ ${p.distSpacing}`);
    // abutment: widen back batter then footing projections
    r = design(p);
    for (let i = 0; i < 60 && !(r.R.okAb && r.R.okStem); i++) {
      const c = r.R.abCases, st = r.R.stemGov;
      if (st.smin < 0 || c.some((k) => k.fosO < 2)) p.abBackBatter = +(p.abBackBatter + 0.1).toFixed(2);
      else if (c.some((k) => k.pmin < 0 || k.fosS < 1.5)) p.abHeel = +(p.abHeel + 0.1).toFixed(2);
      else p.abToe = +(p.abToe + 0.1).toFixed(2);
      r = design(p);
    }
    for (let i = 0; i < 60 && !r.R.okWing; i++) { p.wBaseW = +(p.wBaseW + 0.1).toFixed(2); r = design(p); }
    log.push(`Abutment back batter ${p.abBackBatter}, toe ${p.abToe}, heel ${p.abHeel}; wing base ${p.wBaseW}`);
    return { input: p, log, result: r };
  }

  Object.assign(BD, { DEFAULTS, CARRIAGEWAY, design, autoDesign, alphaFor, fmt });
})(typeof window !== 'undefined' ? window : globalThis);
