/*
 * SLRB / DLRB design engine - road bridge (RCC solid slab, simply supported,
 * one or more vents) across an irrigation canal, with gravity abutments,
 * piers and splayed wing walls on open foundations.
 *
 * Every site-dependent assumption is an input with a code-based default:
 *   - design method: IRC 21:2000 WSM (department type designs) or
 *     IRC 112:2020 LSM (current code) for the deck slab
 *   - concrete / steel grades, exposure & cover, substructure grade
 *   - live load: automatic per IRC 6:2017 Table 6A or chosen classes
 *     (Class A 1/2 lanes, Class B, Class 70R tracked / wheeled bogie)
 *   - edge: kerb + hand railing (MORTH SD/202) or RCC crash barrier,
 *     optional footpaths with pedestrian live load (IRC 6 cl.206)
 *   - seismic zone, importance factor, check per IRC 6 cl.219 (exemption
 *     rule applied automatically, can be forced on)
 *   - soil: SBC, phi, unit weight, friction, silt factor; floor protection
 *   - skew, number of vents with gravity piers (IRC 78 scour at piers 2.0 dsm)
 *
 * Defaults reproduce the I&CAD reference design SLRB @ Km 0.450, L-1 Minor,
 * Perur Major (IRC 21 WSM, M20 / Fe415, Class A, Zone II, single vent).
 * Units follow that sheet: metres, tonnes, t/sqm; mm and N/sqmm where noted.
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});

  // ---------------------------------------------------------------- inputs
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
    // canal data (hydraulic particulars)
    Q: 0.44, bedWidth: 1.676, fsd: 0.549, sideSlope: 1.5, freeBoard: 0.61,
    bedFall: 2500, cbl: 145.819, cblExisting: 145.968, manningN: 0.025,
    bankWidthL: 1.5, bankWidthR: 1.5,
    // general arrangement
    span: 3.5, nVents: 1, skew: 0, maxSlabSpan: 10, affluxLimit: 0.05,
    carriageway: 4.25, edgeType: 'railing', kerbW: 0.225, kerbH: 0.3, railingLoad: 0.1,
    barrierW: 0.45, barrierLoad: 0.75, fpW: 0, fpThk: 0.225, fpLoad: 0.4,
    bearingW: 0.48, frl: 147.945, gl: 147.545, approachLen: 3.5, approachThk: 0.3,
    // levels
    foundationLevel: 144.55, wc: 0.075, D: 0.375, bedBlockT: 0.3, footingT: 0.5,
    frontBatter: 0.6,
    // scour / floor protection
    siltFactor: 1.0, apron: 'yes', floorDepth: 1.0, apronThk: 0.15, liningLen: 15, liningThk: 0.1,
    // design method & materials
    deckAuto: 'yes', minD: 0.3, method: 'WSM', fck: 20, fy: 415, exposure: 'moderate',
    scbc: 7, sst: 200, modRatio: 10, cover: 0.04, mainDia: 16, mainSpacing: 125,
    distDia: 10, distSpacing: 150, topDia: 10, topSpacing: 200,
    subFck: 15, subAllow: 400, gammaConc: 2.4,
    // live load
    liveMode: 'auto', llA1: 'yes', llA2: 'no', llB: 'no', ll70T: 'no', ll70W: 'no',
    // seismic
    seismicZone: 'II', seismicMode: 'auto', impFactor: 1.0, saG: 2.5, respR: 1.0,
    // abutment
    abKey: 'no', abTopW: 1.0, abBackBatter: 0.9, abToe: 0.5, abHeel: 0.5, gammaSoil: 2.0,
    phi: 28, surcharge: 1.2, mu: 0.5, sbc: 15,
    // piers (multi-vent)
    pierTopW: 1.0, pierBatter: 0.0, pierToe: 0.5,
    // wing walls
    wFootT: 0.3, keyW: 0.5, keyD: 0.75, wTopW: 0.45, wFrontBatter: 0.8, wBaseW: 2.5,
    wToe: 0.3, wHeel: 0.3, wingLen: 2.5,
  };

  const CARRIAGEWAY = { SLRB: 4.25, DLRB: 7.5 };
  const ZONE_Z = { II: 0.10, III: 0.16, IV: 0.24, V: 0.36 }; // IRC 6 / IS 1893
  const COVER = { moderate: 0.04, severe: 0.045, 'very severe': 0.05, extreme: 0.075 }; // IRC 112 Table 14.2
  // IRC 21 Table 9 (flexural compression = fck/3) / Table 10 steel in tension
  const scbcFor = (fck) => Math.round((fck / 3) * 100) / 100;
  const sstFor = (fy) => (fy >= 500 ? 240 : fy >= 415 ? 200 : 140);
  // Plain concrete direct compression, IS 456 Table 21 (t/sqm)
  const subAllowFor = (fck) => ({ 15: 400, 20: 500, 25: 600, 30: 800 }[fck] || Math.round(fck * 25));

  // IRC 21 cl.305.16.2 table - alpha for simply supported slabs vs B/L
  const ALPHA_TABLE = [
    [0.1, 0.4], [0.2, 0.8], [0.3, 1.16], [0.4, 1.48], [0.5, 1.72], [0.6, 1.96],
    [0.7, 2.12], [0.8, 2.24], [0.9, 2.36], [1.0, 2.48], [1.1, 2.6], [1.2, 2.64],
    [1.3, 2.72], [1.4, 2.8], [1.5, 2.84], [1.6, 2.88], [1.7, 2.92], [1.8, 2.96],
    [1.9, 3.0], [2.0, 3.0], [9.9, 3.0],
  ];
  function alphaFor(bl) {
    let i = 0;
    for (let k = 0; k < ALPHA_TABLE.length; k++) if (ALPHA_TABLE[k][0] <= bl + 1e-12) i = k;
    if (bl < ALPHA_TABLE[0][0]) return ALPHA_TABLE[0][1];
    if (i >= ALPHA_TABLE.length - 1) return ALPHA_TABLE[i][1];
    const [x0, y0] = ALPHA_TABLE[i];
    return y0 + ((bl - x0) / 0.1) * (ALPHA_TABLE[i + 1][1] - y0);
  }

  const rad = (d) => (d * Math.PI) / 180;
  const fmt = (v, n = 3) => (typeof v === 'number' && isFinite(v) ? v.toFixed(n) : String(v));
  const yes = (v) => v === true || v === 'yes' || v === 'on';

  // Effective width of a row of loads across the deck (IRC 21 cl.305.16):
  // dispersions combine where they overlap, are limited by the deck edges,
  // and the most heavily loaded group governs where they do not overlap.
  function rowIntensity(P, xs, bef, B) {
    const iv = xs.map((x) => [Math.max(0, x - bef / 2), Math.min(B, x + bef / 2)]).sort((a, b) => a[0] - b[0]);
    const groups = [];
    for (const [a, b] of iv) {
      const last = groups[groups.length - 1];
      if (last && a <= last.b + 1e-9) { last.b = Math.max(last.b, b); last.n++; } else groups.push({ a, b, n: 1 });
    }
    const per = P / xs.length;
    let best = { q: 0, width: 0 };
    for (const gr of groups) {
      const q = (per * gr.n) / (gr.b - gr.a);
      if (q > best.q) best = { q, width: ((gr.b - gr.a) * xs.length) / gr.n };
    }
    return best;
  }

  // ------------------------------------------------------------ live loads
  // Which IRC 6 vehicles apply. Automatic = IRC 6:2017 Table 6A.
  function liveLoadSet(p) {
    if (p.liveMode === 'manual') {
      const s = [];
      if (yes(p.llA1)) s.push('A1');
      if (yes(p.llA2)) s.push('A2');
      if (yes(p.llB)) s.push('B');
      if (yes(p.ll70T)) s.push('R70T');
      if (yes(p.ll70W)) s.push('R70W');
      if (s.length) return s;
    }
    if (p.carriageway < 5.3) return ['A1'];
    return ['A1', 'A2', 'R70T', 'R70W'];
  }

  function vehiclesFor(p, L, edgeOff) {
    const WC = p.wc;
    const imp = L <= 3 ? 0.5 : 4.5 / (6 + L); // IRC 6 cl.208.2 (Class A / B, RCC)
    const v = [];
    for (const id of liveLoadSet(p)) {
      if (id === 'A1' || id === 'A2') {
        const n = id === 'A1' ? 1 : 2;
        const x0 = edgeOff + 0.15 + 0.25; // f = 150 mm to carriageway edge, tyre 500 wide
        const xs = [];
        for (let t = 0; t < n; t++) { const a = x0 + t * (1.8 + 0.25 + 1.2 + 0.25); xs.push(a, a + 1.8); } // g = 1.2 m
        v.push({ id, name: n === 1 ? 'IRC Class A (one lane)' : 'IRC Class A (two lanes)', axleT: 11.4, axle: 11.4 * n, axleGap: 1.2, xs, impact: imp,
          cAlong: 0.25 + 2 * WC, b1: 0.5 + 2 * WC, shift: 0.3, tracked: false, tyre: [0.25, 0.5], wheelGap: 1.8 });
      } else if (id === 'B') {
        const x0 = edgeOff + 0.15 + 0.19;
        v.push({ id, name: 'IRC Class B (one lane)', axleT: 6.8, axle: 6.8, axleGap: 1.2, xs: [x0, x0 + 1.8], impact: imp,
          cAlong: 0.2 + 2 * WC, b1: 0.38 + 2 * WC, shift: 0.3, tracked: false, tyre: [0.2, 0.38], wheelGap: 1.8 });
      } else if (id === 'R70T') {
        const impTr = L <= 5 ? 0.25 : L <= 9 ? 0.25 - ((L - 5) * 0.15) / 4 : 0.1; // IRC 6 cl.208.3
        const x70 = edgeOff + 1.2 + 0.42;
        v.push({ id, name: 'IRC Class 70R tracked', P: 70, length: 4.57, xs: [x70, x70 + 2.06], impact: impTr,
          cAlong: 4.57 + 2 * WC, b1: 0.84 + 2 * WC, tracked: true });
      } else if (id === 'R70W') {
        const xb = edgeOff + 1.2 + 0.43;
        v.push({ id, name: 'IRC Class 70R wheeled (bogie 2 x 20 t)', axleT: 20, axle: 20, axleGap: 1.22, xs: [xb, xb + 1.93], impact: 0.25,
          cAlong: 0.36 + 2 * WC, b1: 0.86 + 2 * WC, shift: 0.305, tracked: false, tyre: [0.36, 0.86], wheelGap: 1.93 });
      }
    }
    return v;
  }

  function vehicleEffects(veh, alpha, L, B) {
    const befAt = (a) => alpha * a * (1 - a / L) + veh.b1;
    const out = { veh };
    if (veh.tracked) {
      const P = veh.P * (1 + veh.impact), c = veh.cAlong;
      const bef = befAt(L / 2);
      const r = rowIntensity(P, veh.xs, bef, B);
      out.bef = bef; out.width = r.width; out.P = P;
      const q = P / r.width;
      out.M = c >= L ? ((q / c) * L * L) / 8 : q * (L / 4 - c / 8);
      const cOn = Math.min(c, L), Pon = P * (cOn / c);
      const rV = rowIntensity(Pon, veh.xs, befAt(Math.min(cOn / 2, L / 2)), B);
      out.V = (Pon / rV.width) * (L - cOn / 2) / L;
      out.detail = { P, c, cOn, Pon, widthV: rV.width };
      return out;
    }
    const P = veh.axle * (1 + veh.impact);
    const a1 = L / 2 - veh.shift, a2 = L - a1 - veh.axleGap;
    const bef1 = befAt(a1);
    const w1 = rowIntensity(P, veh.xs, bef1, B).width, p1 = P / w1;
    let bef2 = 0, w2 = 0, p2 = 0;
    const second = a2 > 0;
    if (second) { bef2 = befAt(a2); w2 = rowIntensity(P, veh.xs, bef2, B).width; p2 = P / w2; }
    const RA = (p1 * (L - a1) + (second ? p2 * a2 : 0)) / L;
    out.M = RA * a1 - (p1 * veh.cAlong) / 8;
    Object.assign(out, { P, a1, a2, bef1, bef2, w1, w2, p1, p2, RA, second });
    const s1 = 0.4, s2 = 0.4 + veh.axleGap;
    const bs1 = befAt(s1), ws1 = rowIntensity(P, veh.xs, bs1, B).width;
    let V = (P / ws1) * (L - s1) / L, bs2 = 0, ws2 = 0;
    if (s2 < L) { bs2 = befAt(s2); ws2 = rowIntensity(P, veh.xs, bs2, B).width; V += (P / ws2) * (L - s2) / L; }
    out.V = V;
    out.shear = { s1, s2, bs1, bs2, ws1, ws2 };
    return out;
  }

  // Support reaction (whole deck, no impact at foundations - IRC 6 cl.208.4)
  // and braking per support (IRC 6 cl.211: 20 % of 1st train + 10 % of 2nd).
  function supportLL(veh, Lcb) {
    if (veh.tracked) {
      const cOn = Math.min(veh.length, Lcb), Pon = veh.P * (cOn / veh.length);
      return { R: Pon * (1 - cOn / 2 / Lcb), Hb: (0.2 * Pon) / 2 };
    }
    const both = veh.axleGap < Lcb;
    const R = veh.axle + (both ? (veh.axle * (Lcb - veh.axleGap)) / Lcb : 0);
    const onSpan = veh.axle * (both ? 2 : 1);
    const Hb = veh.id === 'A2' ? ((0.2 * onSpan) / 2 + (0.1 * onSpan) / 2) / 2 : (0.2 * onSpan) / 2;
    return { R, Hb };
  }

  // Mononobe-Okabe active coefficient, vertical back, level fill, delta = 0.
  function kaeMO(phiDeg, ah) {
    const phi = rad(phiDeg), th = Math.atan(ah);
    if (phi - th <= 0) return 1;
    const c = Math.cos(phi - th) ** 2;
    const r = 1 + Math.sqrt((Math.sin(phi) * Math.sin(phi - th)) / Math.cos(th));
    return c / (Math.cos(th) * r * r);
  }

  // ------------------------------------------------------------ main design
  function design(input) {
    const p = Object.assign({}, DEFAULTS, input || {});
    for (const k of Object.keys(DEFAULTS)) if (typeof DEFAULTS[k] === 'number') p[k] = Number(p[k]);
    p.nVents = Math.max(1, Math.round(p.nVents));
    const isD = p.bridgeType === 'DLRB';
    const LSM = p.method === 'LSM';
    const nV = p.nVents;
    const R = { nV };
    const secs = [];
    let cur;
    const sec = (title) => { cur = { title, rows: [] }; secs.push(cur); };
    const row = (label, value, unit = '', remark = '', opt = {}) => { cur.rows.push(Object.assign({ label, value, unit, remark }, opt)); return value; };
    const inp = (label, key, unit, remark) => row(label, p[key], unit, remark, { input: key });
    const chk = (label, ok, text, remark) => row(label, text, '', remark || '', { check: true, ok: !!ok });
    const warnings = [];
    const gc = p.gammaConc;

    // geometry helpers
    const cosS = Math.cos(rad(p.skew || 0));
    const spanR = (R.spanR = p.span / cosS); // clear span along the road
    const railing = p.edgeType !== 'crash';
    const edgeW = (R.edgeW = railing ? p.kerbW : p.barrierW);
    const edgeDL = railing ? p.kerbW * p.kerbH * 2.5 + p.railingLoad : p.barrierLoad;
    const edgeOff = edgeW + p.fpW; // deck edge to carriageway edge
    const Z = ZONE_Z[p.seismicZone] || 0.1;

    // 0. design basis
    sec('0. DESIGN BASIS');
    row('Structure', `${isD ? 'Double' : 'Single'} lane road bridge, ${nV} vent${nV > 1 ? 's' : ''} RCC solid slab (simply supported) on gravity abutments${nV > 1 ? ' and piers' : ''}, open foundations`, '');
    row('Deck design method', LSM ? 'IRC 112:2020 Limit State Method' : 'IRC 21:2000 Working Stress Method', '', LSM ? 'Current code for concrete road bridges' : 'As in department type designs; IRC 112 is the current code');
    row('Concrete / steel (deck)', `M${p.fck} / Fe${p.fy}`, '', `Exposure: ${p.exposure}; clear cover ${fmt(p.cover * 1000, 0)} mm`);
    row('Substructure', `Plain CC M${p.subFck} with plums; permissible direct compression ${fmt(p.subAllow, 0)} t/sqm`, '', 'IS 456 Table 21');
    const lls = liveLoadSet(p);
    row('Live load', lls.map((x) => ({ A1: 'Class A 1-lane', A2: 'Class A 2-lane', B: 'Class B', R70T: '70R tracked', R70W: '70R wheeled bogie' }[x])).join(', '), '',
      p.liveMode === 'manual' ? 'Selected by designer' : 'IRC 6:2017 Table 6A for the carriageway width');
    row('Edge / footpath', `${railing ? `RCC kerb ${fmt(p.kerbW * 1000, 0)} + hand railing (MORTH SD/202)` : `RCC crash barrier ${fmt(p.barrierW * 1000, 0)} wide`}${p.fpW > 0 ? `; footpath ${fmt(p.fpW, 2)} m each side, ${fmt(p.fpLoad * 9.81, 1)} kN/sqm` : '; no footpath'}`, '');
    row('Seismic', `Zone ${p.seismicZone} (Z = ${Z})`, '', 'IRC 6:2017 cl.219');
    row('Codes', 'IRC 5-2015, IRC 6-2017, IRC 21-2000 / IRC 112-2020, IRC 78-2014, IRC SP:13-2004, IS 456-2000, IS 1786, IS 2502; MORTH standard drawings', '');
    if (LSM && p.fck < 25) warnings.push('IRC 112 requires at least M25 for reinforced concrete bridge members. Raise the deck concrete grade.');

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
    R.ventsSuggested = R.topFSL > p.maxSlabSpan ? Math.ceil(R.topFSL / p.maxSlabSpan) : 1;
    const spanFor = (n) => Math.max(2, Math.ceil(((R.topFSL - (n - 1) * p.pierTopW) / n - 1e-9) / 0.5) * 0.5);
    R.spanSuggested = spanFor(nV);

    // 2. general arrangement
    sec('2. GENERAL ARRANGEMENT');
    inp('Number of vents', 'nVents', 'Nos', nV > 1 ? `RCC gravity piers ${fmt(p.pierTopW, 2)} m wide between vents` : 'Single vent, no pier in canal');
    row('Clear span of each vent (normal to canal)', p.span, 'm', `suggested ${fmt(R.spanSuggested, 2)} m`, { input: 'span' });
    if (p.skew) { inp('Skew angle', 'skew', 'deg'); row('Clear span along road = span / cos(skew)', spanR, 'm'); }
    R.opening = row('Total opening between abutment faces (along road)', nV * spanR + (nV - 1) * p.pierTopW / cosS, 'm');
    inp(`Carriageway width (IRC 5 ${isD ? 'two lane' : 'single lane'})`, 'carriageway', 'm', 'IRC 5 cl.104.3.1');
    if (railing) {
      inp('Kerb width (each side)', 'kerbW', 'm', 'IRC 5 min 225 mm');
      inp('Kerb height above deck', 'kerbH', 'm');
      inp('Hand railing (MORTH SD/202) load per side', 'railingLoad', 't/m');
    } else {
      inp('Crash barrier base width (each side)', 'barrierW', 'm', 'IRC 5 cl.109.6 / MORTH');
      inp('Crash barrier self weight', 'barrierLoad', 't/m');
    }
    if (p.fpW > 0) { inp('Footpath width (each side)', 'fpW', 'm'); inp('Footpath live load', 'fpLoad', 't/sqm', 'IRC 6 cl.206'); }
    const B = (R.B = row('Overall deck width B', p.carriageway + 2 * (p.fpW + edgeW), 'm'));
    inp('Bearing width on each support (bed block 500 - 20 joint)', 'bearingW', 'm');
    R.deckL = row('Deck length of each vent', spanR + 2 * p.bearingW, 'm');
    R.totalLength = row('Total length of bridge', R.opening + 2 * p.bearingW, 'm');
    inp('Proposed road level (FRL)', 'frl', 'm', p.frlNote);
    inp('Ground level at site', 'gl', 'm');
    inp(`Approach slab ${fmt(p.approachThk * 1000, 0)} thk x ${fmt(p.approachLen, 2)} m each side`, 'approachLen', 'm', '20 mm expansion joints');
    if (nV * p.span + (nV - 1) * p.pierTopW < R.topFSL - 1e-6) warnings.push(`Total waterway ${fmt(nV * p.span + (nV - 1) * p.pierTopW, 2)} m is less than canal top width at FSL ${fmt(R.topFSL, 3)} m - the bridge will constrict the canal.`);
    if (p.span > p.maxSlabSpan) warnings.push(`Clear span ${fmt(p.span, 2)} m is more than ${fmt(p.maxSlabSpan, 1)} m - a solid slab becomes uneconomic; use ${R.ventsSuggested} vents or a T-beam deck.`);
    if (p.skew > 20) warnings.push(`Skew ${p.skew} deg exceeds 20 deg: skew slab analysis and skew reinforcement detailing are required (IRC 21 / IRC 112); drawings here are square.`);
    if (p.carriageway >= 9.6) warnings.push('Carriageway 9.6 m or more needs three-lane loading (IRC 6 Table 6A); this tool checks up to two lanes.');
    if (isD && p.edgeType !== 'crash') warnings.push('For two-lane bridges on highways IRC 5 / MORTH require crash barriers; choose the crash barrier edge if applicable.');

    // 3. levels
    sec('3. LEVELS');
    inp('Foundation (base) level adopted', 'foundationLevel', 'm', 'Checked against scour in section 4');
    inp('Wearing coat thickness', 'wc', 'm');
    inp('Deck slab overall thickness D', 'D', 'm');
    R.deckTop = row('Deck top level', p.frl - p.wc, 'm');
    R.soffit = row('Soffit / bed block top level', R.deckTop - p.D, 'm');
    R.okSoffit = R.soffit >= R.tbl;
    R.frlMin = R.tbl + p.D + p.wc;
    chk('Check soffit >= TBL', R.okSoffit, R.okSoffit ? `OK - clearance ${fmt(R.soffit - R.tbl)} m above TBL` : `REVISE - raise FRL to at least +${fmt(R.frlMin)}`);
    R.clearFSL = row('Vertical clearance soffit above FSL', R.soffit - R.fsl, 'm', 'IRC 5 cl.106: > FB for canal');
    inp('Bed block thickness (RCC)', 'bedBlockT', 'm');
    R.stemTop = row('Bed block bottom / stem top level', R.soffit - p.bedBlockT, 'm');
    inp('Footing thickness (PCC)', 'footingT', 'm');
    R.ftgTop = row('Footing top / stem bottom level', p.foundationLevel + p.footingT, 'm');
    R.stemH = row('Height of abutment stem', R.stemTop - R.ftgTop, 'm');
    R.abTop = row('Abutment top (dirt wall part) = deck top level', R.deckTop, 'm');
    R.approachBot = row('Approach slab bottom level', R.deckTop - p.approachThk, 'm');
    R.H = row('Overall height (FRL to foundation base)', p.frl - p.foundationLevel, 'm');
    inp('Front (water face) batter of abutment', 'frontBatter', 'm');
    if (R.stemH <= 0.3) warnings.push('Abutment stem height is very small or negative - check FRL, deck thickness and foundation level.');
    const fr = (lvl) => 1 - (lvl - R.ftgTop) / R.stemH;
    const clearAt = (lvl) => nV * p.span - 2 * p.frontBatter * fr(lvl) - (nV - 1) * 2 * p.pierBatter * fr(lvl);
    R.clearCBL = row('Clear waterway width at CBL', clearAt(p.cbl), 'm', nV > 1 ? 'all vents, net of piers' : '');
    R.clearFSLw = row('Clear waterway width at FSL', clearAt(R.fsl), 'm');

    // 4. vent way / scour
    sec('4. VENTWAY, SCOUR AND FOUNDATION LEVEL (IRC 5 / IRC 78)');
    R.ventArea = row('Vent area at FSL = avg clear width x FSD', ((R.clearCBL + R.clearFSLw) / 2) * p.fsd, 'sqm');
    R.ratio = row('Ratio canal area / vent area', R.area / R.ventArea, '', R.area / R.ventArea < 1 ? '< 1 : no contraction' : 'Contraction - afflux computed');
    R.afflux = row('Afflux (Molesworth)', Math.max(0, (R.vel ** 2 / 17.88 + 0.01524) * ((R.area / R.ventArea) ** 2 - 1)), 'm');
    R.okVent = R.afflux <= p.affluxLimit + 1e-9;
    chk(`Check waterway: afflux <= ${fmt(p.affluxLimit, 3)} m`, R.okVent, R.okVent ? 'OK' : `REVISE - vent too narrow; use span ${fmt(R.spanSuggested, 2)} m or more vents`, 'Vent should not constrict the canal (IRC 5 / IRC SP:13)');
    R.Qs = row('Design discharge for scour = 1.3 Q (IRC 78 cl.703.1.1)', 1.3 * p.Q, 'cumecs');
    inp('Silt factor f = 1.76 sqrt(dm, mm)', 'siltFactor', '', 'From bed material; confirm by soil test');
    R.q = row('Discharge per m width q (on width at bed)', R.Qs / R.clearCBL, 'cumec/m');
    R.dsm = row('Normal scour depth dsm = 1.34 (q^2/f)^(1/3)', 1.34 * Math.cbrt(R.q ** 2 / p.siltFactor), 'm', 'Lacey');
    R.maxScourD = row('Max scour depth at abutment = 1.27 dsm', 1.27 * R.dsm, 'm', 'IRC 78 cl.703.3.1');
    R.msl = row('Max scour level at abutments = FSL - 1.27 dsm', R.fsl - R.maxScourD, 'm');
    R.flScour = row('Foundation level required <= MSL - 1.20 m', R.msl - 1.2, 'm', 'IRC 78 cl.705.2.1.1');
    const apron = yes(p.apron);
    R.flApron = apron ? row(`With rigid floor protection + ${fmt(p.liningLen, 0)} m lining u/s & d/s: foundation <= floor bottom - ${fmt(p.floorDepth, 2)} m`, p.cbl - p.apronThk - p.floorDepth, 'm', 'Floor-protected criterion (IRC SP:13); depth below floor set by designer') : -Infinity;
    if (!apron) row('Floor protection (apron / lining)', 'not provided', '', 'Scour criterion alone governs');
    let flReq = Math.max(R.flScour + 0.01, R.flApron);
    if (nV > 1) {
      R.mslPier = row('Max scour level at piers = FSL - 2.0 dsm', R.fsl - 2 * R.dsm, 'm', 'IRC 78 cl.703.3.1');
      R.flScourPier = row('Pier foundation level required <= MSL - 1.20 m', R.mslPier - 1.2, 'm');
      flReq = Math.max(Math.min(R.flScour, R.flScourPier) + 0.01, R.flApron);
    }
    R.okFound = p.foundationLevel <= flReq + 1e-9;
    const scourOnly = nV > 1 ? Math.min(R.flScour, R.flScourPier) : R.flScour;
    chk('Check foundation level', R.okFound, R.okFound ? 'OK' + (p.foundationLevel <= scourOnly + 0.01 ? '' : ' (apron-protected criterion governs)') : 'REVISE');
    R.flSuggested = Math.floor((flReq + 1e-9) / 0.05) * 0.05;
    R.foundDepth = row('Depth of foundation below design CBL', p.cbl - p.foundationLevel, 'm', 'Kept >= 1.0 m below bed');
    if (p.cbl - p.foundationLevel < 1) warnings.push('Foundation is less than 1.0 m below canal bed.');
    if (apron) row('Curtain walls at u/s & d/s ends of apron/lining: CC 300 thk x 1000 deep', 'provided', '', 'IRC SP:13 / IRC 89');
    const exemptSeis = spanR < 10 || ((p.seismicZone === 'II' || p.seismicZone === 'III') && spanR < 15 && R.totalLength < 60);
    R.seismic = p.seismicMode === 'include' || (p.seismicMode === 'auto' && !exemptSeis);
    R.Ah = (Z / 2) * p.impFactor * p.saG / p.respR;
    row('Seismic check (IRC 6-2017 cl.219.1)', R.seismic ? `Required - Ah = (Z/2)(I)(Sa/g)/R = ${fmt(R.Ah, 3)}` : 'Not required', '',
      exemptSeis ? `Zone ${p.seismicZone}: span < 10 m, or Zone II/III with span < 15 m and length < 60 m` : `Zone ${p.seismicZone}`);

    // 5. deck slab
    const B_ = B;
    sec(`5. DESIGN OF DECK SLAB (${LSM ? 'IRC 112:2020 LSM' : 'IRC 21 WSM'}, effective width method IRC 21 cl.305.16 / IRC 112 Annex B)`);
    inp('Clear cover', 'cover', 'm', LSM ? 'IRC 112 Table 14.2' : 'IRC 21 cl.304.3');
    inp('Main bar dia', 'mainDia', 'mm');
    R.d = row('Effective depth d', p.D * 1000 - p.cover * 1000 - p.mainDia / 2, 'mm');
    const L = (R.Leff = row('Effective span = least of (clear span + d) and c/c bearings', Math.min(spanR + R.d / 1000, spanR + p.bearingW), 'm', 'IRC 21 cl.305.10.1'));
    R.BL = row('B / L', B_ / L);
    R.alpha = row('alpha (IRC 21 cl.305.16.2 table)', alphaFor(B_ / L));
    const vehicles = vehiclesFor(p, L, edgeOff);
    R.vehicles = vehicles.map((v) => vehicleEffects(v, R.alpha, L, B_));
    R.DLslab = p.D * 2.5; R.DLwc = p.wc * 2.2;
    R.DLw = R.DLslab + R.DLwc;
    R.MDL = (R.DLw * L * L) / 8;
    const ea = R.vehicles[0], va = ea.veh;
    if (!va.tracked) {
      row(`Impact factor ${va.name} = ${L <= 3 ? '0.5 (span <= 3 m)' : '4.5/(6+L)'}`, va.impact, '', 'IRC 6 cl.208.2');
      row('Heaviest axle', va.axleT, 't', 'IRC 6 Fig.1');
      row('Axle with impact P', ea.P, 't');
      row('Tyre contact along / across span', `${fmt(va.tyre[0], 2)} / ${fmt(va.tyre[1], 2)}`, 'm');
      row('Loaded length along span = c + 2 WC', va.cAlong, 'm');
      row('b1 = tyre width + 2 WC', va.b1, 'm');
      row('Wheel centre to deck edge', va.xs[0], 'm', `f = 0.15 m from carriageway edge`);
      row('Wheel c/c across', va.wheelGap, 'm');
      row('(a) Maximum bending moment: two axles placed for max BM', '', '', '', { sub: true });
      row('Axle 1 distance from support a1 = L/2 - 0.30', ea.a1, 'm');
      row('Axle 2 distance from nearer support a2', ea.a2, 'm');
      row('bef1 = alpha.a1(1-a1/L)+b1', ea.bef1, 'm');
      row('bef2 = alpha.a2(1-a2/L)+b1', ea.bef2, 'm');
      row('Width for axle 1 (overlapping, edge limited)', ea.w1, 'm');
      row('Width for axle 2', ea.w2, 'm');
      row('Load per m width, axle 1', ea.p1, 't/m');
      row('Load per m width, axle 2', ea.p2, 't/m');
      row('Reaction RA', ea.RA, 't');
      row('LL moment under axle 1 = RA.a1 - P1.c/8', ea.M, 't-m/m');
    }
    let gov = ea;
    const others = R.vehicles.filter((e) => e !== ea || va.tracked);
    if (others.length) {
      row('Live loads checked (IRC 6)', '', '', '', { sub: true });
      for (const e of others) {
        const v = e.veh;
        if (v.tracked) row(`${v.name}: impact ${fmt(v.impact * 100, 1)} %, ${fmt(e.P, 2)} t over ${fmt(v.cAlong, 2)} m, width ${fmt(e.width, 3)} m`, e.M, 't-m/m', 'LL moment');
        else row(`${v.name}: impact ${fmt(v.impact * 100, 1)} %, P = ${fmt(e.P, 2)} t/axle, widths ${fmt(e.w1, 3)} / ${fmt(e.w2, 3)} m`, e.M, 't-m/m', 'LL moment');
      }
    }
    for (const e of R.vehicles) if (e.M > gov.M) gov = e;
    if (R.vehicles.length > 1) row('Governing live load for bending', gov.veh.name, '');
    R.govM = gov;
    R.MLL = gov.M;
    let govV = ea;
    for (const e of R.vehicles) if (e.V > govV.V) govV = e;
    R.govV = govV;
    R.VLL = govV.V;
    row('Dead load: slab + wearing coat', R.DLw, 't/sqm');
    row('DL moment = w L^2/8', R.MDL, 't-m/m');
    if (p.fpW > 0) row('Footpath live load acts on the footpath strips, not in the carriageway strip designed here', '', '', 'Footpath slab strip checked by the same section');
    const Ab = (dia, sp) => ((Math.PI / 4) * dia ** 2 * 1000) / sp;
    R.AstProv = Ab(p.mainDia, p.mainSpacing);
    if (!LSM) {
      row('Working stress design', '', '', '', { sub: true });
      inp(`Concrete M${p.fck}: sigma cbc`, 'scbc', 'N/sqmm', 'IRC 21 Table 9');
      inp(`Steel Fe${p.fy}: sigma st`, 'sst', 'N/sqmm', 'IRC 21 Table 10');
      inp('Modular ratio m', 'modRatio', '', 'IRC 21 cl.303.1');
      R.k = row('k = m.scbc/(m.scbc+sst)', (p.modRatio * p.scbc) / (p.modRatio * p.scbc + p.sst));
      R.j = row('j = 1 - k/3', 1 - R.k / 3);
      R.Qc = row('Q = 0.5 scbc k j', 0.5 * p.scbc * R.k * R.j, 'N/sqmm');
      R.M = row('Total design moment M = M(LL) + M(DL)', R.MLL + R.MDL, 't-m/m');
      R.MkN = row('M in kN-m', R.M * 9.81, 'kN-m/m');
      R.dReq = row('d required = sqrt(M/Q.b)', Math.sqrt((R.MkN * 1e6) / (R.Qc * 1000)), 'mm');
      R.okDepth = R.dReq <= R.d;
      chk('Check depth', R.okDepth, R.okDepth ? `OK  (${fmt(R.dReq, 0)} < ${fmt(R.d, 0)} mm)` : `REVISE (${fmt(R.dReq, 0)} > ${fmt(R.d, 0)} mm)`);
      R.AstReq = row('Ast required = M/(sst.j.d)', (R.MkN * 1e6) / (p.sst * R.j * R.d), 'sqmm/m');
      row('Main bar spacing adopted', p.mainSpacing, 'mm', `${p.mainDia} dia straight, bottom`, { input: 'mainSpacing' });
      row('Ast provided', R.AstProv, 'sqmm/m');
      R.okAst = R.AstProv >= R.AstReq;
      chk('Check main steel', R.okAst, R.okAst ? 'OK' : 'REVISE');
      row('(b) Shear at support', '', '', '', { sub: true });
      if (ea.shear) {
        row('bef at 0.40 m / at 0.40 m + axle gap', `${fmt(ea.shear.bs1)} / ${fmt(ea.shear.bs2)}`, 'm');
        row('Width axle 1 / axle 2', `${fmt(ea.shear.ws1)} / ${fmt(ea.shear.ws2)}`, 'm', 'dispersions combined only where they overlap');
      }
      if (R.vehicles.length > 1) row('Governing live load for shear', govV.veh.name, '', `LL shear ${fmt(govV.V, 3)} t/m`);
      R.V = row('Shear at support V = LL + DL', R.VLL + (R.DLw * L) / 2, 't/m');
      R.tv = row('Nominal shear stress tv', (R.V * 9.81 * 1000) / (1000 * R.d), 'N/sqmm');
      R.pt = row('p = 100 Ast/bd', (100 * R.AstProv) / (1000 * R.d), '%');
      const pt = R.pt;
      const tc20 = pt <= 0.25 ? 0.18 + (pt - 0.15) * 0.4 : pt <= 0.5 ? 0.22 + (pt - 0.25) * 0.32 : 0.3 + (pt - 0.5) * 0.2;
      const gradeF = p.fck >= 25 ? 1 + Math.min(p.fck - 20, 20) * 0.006 : 1; // small increase for higher grades (IS 456 Table 23 trend)
      R.tc = row(`Permissible tc (M${p.fck}, IS 456 Table 23 / IRC 21 Table 12B)`, tc20 * gradeF, 'N/sqmm');
      R.okShear = R.tv <= R.tc;
      chk('Check shear (no shear reinforcement needed)', R.okShear, R.okShear ? 'OK' : 'PROVIDE SHEAR STEEL / INCREASE D');
      row('(c) Distribution steel', '', '', '', { sub: true });
      R.Md = row('Md = 0.3 M(LL) + 0.2 M(DL)', 0.3 * R.MLL + 0.2 * R.MDL, 't-m/m', 'IRC 21 cl.305.18');
      R.AstD = row(`Ast required (d - ${fmt((p.mainDia + p.distDia) / 2, 0)} mm)`, (R.Md * 9.81 * 1e6) / (p.sst * R.j * (R.d - (p.mainDia + p.distDia) / 2)), 'sqmm/m');
      R.AstMin = row('Minimum 0.12% bD', 0.0012 * 1000 * p.D * 1000, 'sqmm/m');
    } else {
      row('Limit state design (IRC 112:2020)', '', '', '', { sub: true });
      const fck = p.fck, fy = p.fy, d = R.d;
      const MDLs = (R.DLslab * L * L) / 8, MWC = (R.DLwc * L * L) / 8;
      R.M = row('Mu = 1.35 M(slab) + 1.75 M(WC) + 1.5 M(LL)', 1.35 * MDLs + 1.75 * MWC + 1.5 * R.MLL, 't-m/m', 'IRC 6 Annex B, ULS basic combination');
      R.MkN = row('Mu in kN-m', R.M * 9.81, 'kN-m/m');
      const xr = 0.0035 / (0.0055 + (0.87 * fy) / 200000);
      R.xuMax = row('xu,max / d', xr, '', 'epsilon cu = 0.0035');
      R.MuLim = row('Mu,lim = 0.36 fck b xu,max (d - 0.416 xu,max)', (0.36 * fck * 1000 * xr * d * (d - 0.416 * xr * d)) / 1e6, 'kN-m/m');
      R.okDepth = R.MkN <= R.MuLim;
      R.dReq = Math.sqrt((R.MkN * 1e6) / (0.36 * fck * 1000 * xr * (1 - 0.416 * xr)));
      chk('Check depth (singly reinforced)', R.okDepth, R.okDepth ? `OK  (d req ${fmt(R.dReq, 0)} < ${fmt(d, 0)} mm)` : `REVISE (d req ${fmt(R.dReq, 0)} mm)`);
      const t = (4.6 * R.MkN * 1e6) / (fck * 1000 * d * d);
      const AstU = t < 1 ? ((0.5 * fck) / fy) * (1 - Math.sqrt(1 - t)) * 1000 * d : Infinity;
      const fctm = 0.259 * fck ** (2 / 3);
      const AsMin = Math.max((0.26 * fctm) / fy, 0.0013) * 1000 * d;
      row('Ast for Mu (fyd = 0.87 fy)', AstU, 'sqmm/m');
      row('As,min = 0.26 fctm/fyk bd >= 0.0013 bd', AsMin, 'sqmm/m', 'IRC 112 cl.16.5.1.1');
      R.AstReq = row('Ast required', Math.max(AstU, AsMin), 'sqmm/m');
      row('Main bar spacing adopted', p.mainSpacing, 'mm', `${p.mainDia} dia, bottom`, { input: 'mainSpacing' });
      row('Ast provided', R.AstProv, 'sqmm/m');
      const smax = Math.min(2 * p.D * 1000, 250);
      R.okAst = R.AstProv >= R.AstReq && p.mainSpacing <= smax;
      chk(`Check main steel (spacing <= ${fmt(smax, 0)} mm)`, R.okAst, R.okAst ? 'OK' : 'REVISE');
      // shear
      const VEd = 1.35 * (R.DLslab * L) / 2 + 1.75 * (R.DLwc * L) / 2 + 1.5 * R.VLL;
      R.V = row('VEd = 1.35 V(slab) + 1.75 V(WC) + 1.5 V(LL)', VEd, 't/m', `governing ${govV.veh.name}`);
      const kk = Math.min(2, 1 + Math.sqrt(200 / d));
      const rho = Math.min(0.02, R.AstProv / (1000 * d));
      const vmin = 0.031 * kk ** 1.5 * Math.sqrt(fck);
      const vrd = Math.max(0.12 * kk * (80 * rho * fck) ** (1 / 3), vmin);
      R.tv = row('vEd = VEd / bd', (VEd * 9.81 * 1000) / (1000 * d), 'N/sqmm');
      R.tc = row('vRd,c = max(0.12 k (80 rho fck)^1/3, 0.031 k^1.5 fck^0.5)', vrd, 'N/sqmm', `IRC 112 cl.10.3.2; k = ${fmt(kk, 2)}, rho = ${fmt(rho, 4)}`);
      R.pt = rho * 100;
      R.okShear = R.tv <= R.tc;
      chk('Check shear (no shear reinforcement needed)', R.okShear, R.okShear ? 'OK' : 'PROVIDE SHEAR STEEL / INCREASE D');
      // SLS stresses, rare combination
      const Ms = (R.MDL + R.MLL) * 9.81 * 1e6;
      const m = p.modRatio, As = R.AstProv;
      const x = (-m * As + Math.sqrt((m * As) ** 2 + 2 * 1000 * m * As * d)) / 1000;
      const Icr = (1000 * x ** 3) / 3 + m * As * (d - x) ** 2;
      R.sc = (Ms * x) / Icr; R.ss = (m * Ms * (d - x)) / Icr;
      row('SLS rare combination: M = M(DL) + M(LL)', (R.MDL + R.MLL) * 9.81, 'kN-m/m', `cracked section, m = ${m}`);
      R.okSLS = R.sc <= 0.48 * fck && R.ss <= 0.8 * fy;
      chk(`Concrete stress <= 0.48 fck (${fmt(0.48 * fck, 1)})`, R.sc <= 0.48 * fck, fmt(R.sc, 2) + ' N/sqmm', 'IRC 112 cl.12.2.1');
      chk(`Steel stress <= 0.8 fyk (${fmt(0.8 * fy, 0)})`, R.ss <= 0.8 * fy, fmt(R.ss, 1) + ' N/sqmm', 'IRC 112 cl.12.2.2');
      row('Crack width: deemed to satisfy by bar spacing / stress limits', '', '', 'IRC 112 cl.12.3.6 - verify for severe exposure');
      R.okShear = R.okShear && R.okSLS;
      row('(c) Distribution steel', '', '', '', { sub: true });
      R.Md = 0;
      R.AstD = row('Secondary reinforcement >= 20 % of main', 0.2 * R.AstProv, 'sqmm/m', 'IRC 112 cl.16.6.1.1');
      R.AstMin = row('Minimum 0.0013 bd', 0.0013 * 1000 * d, 'sqmm/m');
    }
    R.AstDProv = row(`Provided ${p.distDia} dia @ ${p.distSpacing} c/c (bottom)`, Ab(p.distDia, p.distSpacing), 'sqmm/m');
    R.okDist = R.AstDProv >= Math.max(R.AstD, R.AstMin);
    chk('Check distribution', R.okDist, R.okDist ? 'OK' : 'REVISE');
    row('(d) Deflection - span / effective depth', '', '', '', { sub: true });
    {
      const rho = R.AstProv / (1000 * R.d), r0 = Math.sqrt(p.fck) * 1e-3, sf = Math.sqrt(p.fck);
      const basic = rho <= r0 ? 11 + 1.5 * sf * (r0 / rho) + 3.2 * sf * Math.pow(r0 / rho - 1, 1.5) : 11 + 1.5 * sf * r0 / rho;
      const mod = Math.min(1.5, 500 / (p.fy * Math.max(R.AstReq, 1) / R.AstProv));
      R.ldAllow = row('Allowable L/d = K [11 + 1.5 sqrt(fck) rho0/rho ...] x 500/(fy As,req/As,prov), K = 1', basic * mod, '', 'IRC 112 cl.12.4.1 (simply supported)');
      R.ldAct = row('Actual L/d', (L * 1000) / R.d, '');
      R.okDefl = R.ldAct <= R.ldAllow;
      chk('Check deflection', R.okDefl, R.okDefl ? 'OK' : 'REVISE - increase D');
    }
    R.AstTop = row(`Top steel both ways ${p.topDia} dia @ ${p.topSpacing} c/c`, Ab(p.topDia, p.topSpacing), 'sqmm/m');

    // 6. abutment
    sec(`6. ABUTMENT (CC M${p.subFck} with plums) - STABILITY (IRC 78, per m length)`);
    inp('Stem top width at bed block level (bed block 0.50 + dirt wall part)', 'abTopW', 'm');
    inp('Back batter projection', 'abBackBatter', 'm');
    R.stemBase = row('Stem base width', p.frontBatter + p.abTopW + p.abBackBatter, 'm');
    inp('Footing toe projection', 'abToe', 'm');
    inp('Footing heel projection', 'abHeel', 'm');
    R.ftgW = row('Footing width', p.abToe + R.stemBase + p.abHeel, 'm');
    inp('Unit wt of soil', 'gammaSoil', 't/cum');
    inp('Angle of internal friction of backfill', 'phi', 'deg');
    R.Ka = row('Ka (Rankine)', (1 - Math.sin(rad(p.phi))) / (1 + Math.sin(rad(p.phi))));
    R.Kp = row('Kp = 1/Ka', 1 / R.Ka);
    inp('LL surcharge equivalent height', 'surcharge', 'm', 'IRC 6 cl.214.1.1.3');
    inp('Coefficient of friction (concrete on soil)', 'mu', '');
    inp('Safe bearing capacity', 'sbc', 't/sqm', 'From soil investigation / trial pit');
    row('Vertical loads (t) and lever arms from toe (m)', 'W (t)', '', 'arm x from toe, y above base', { sub: true });
    const toe = p.abToe, fb = p.frontBatter, ft = p.footingT;
    const W = [];
    const wrow = (label, w, x, y) => { W.push({ label, w, x, y }); row(label, w, 't', `x = ${fmt(x, 3)} m`); };
    wrow('Footing', R.ftgW * ft * gc, R.ftgW / 2, ft / 2);
    wrow('Stem - front triangle', 0.5 * fb * R.stemH * gc, toe + (2 * fb) / 3, ft + R.stemH / 3);
    wrow('Stem - rectangle below bed block level', p.abTopW * R.stemH * gc, toe + fb + p.abTopW / 2, ft + R.stemH / 2);
    wrow('Stem - top part behind bed block (0.50 wide) up to deck top', 0.5 * (R.abTop - R.stemTop) * gc, toe + fb + 0.75, (R.stemTop + R.abTop) / 2 - p.foundationLevel);
    wrow('Stem - back triangle', 0.5 * p.abBackBatter * (R.abTop - R.ftgTop) * gc, toe + fb + p.abTopW + p.abBackBatter / 3, ft + (R.abTop - R.ftgTop) / 3);
    wrow(`Bed block 0.50 x ${fmt(p.bedBlockT, 2)} (RCC)`, 0.5 * p.bedBlockT * 2.5, toe + fb + 0.25, (R.stemTop + R.soffit) / 2 - p.foundationLevel);
    wrow('Soil over back batter', 0.5 * p.abBackBatter * (R.abTop - R.ftgTop) * p.gammaSoil, toe + fb + p.abTopW + (2 * p.abBackBatter) / 3, ft + (2 * (R.abTop - R.ftgTop)) / 3);
    wrow('Soil over heel', p.abHeel * (p.frl - R.ftgTop) * p.gammaSoil, toe + R.stemBase + p.abHeel / 2, ft + (p.frl - R.ftgTop) / 2);
    const deckDL = (R.deckDL = ((p.D * 2.5 * B + p.wc * 2.2 * p.carriageway + 2 * (edgeDL + p.fpW * p.fpThk * gc)) * R.deckL / 2) / B);
    const xBrg = toe + fb + p.bearingW / 2, yBr = R.soffit - p.foundationLevel;
    wrow(`Deck DL reaction (slab + WC + ${railing ? 'kerbs + railing' : 'crash barriers'}${p.fpW > 0 ? ' + footpaths' : ''})`, deckDL, xBrg, yBr);
    const Lcb = spanR + p.bearingW;
    const fpLL = (2 * p.fpW * p.fpLoad * R.deckL) / 2 / B;
    R.LLcases = vehicles.map((v) => { const a = supportLL(v, Lcb); return { name: v.name, id: v.id, R: a.R / B + fpLL, Hb: a.Hb / B }; });
    for (const c of R.LLcases) row(`LL reaction ${c.name}${fpLL ? ' + footpath' : ''}, no impact (IRC 6 cl.208.4)`, c.R, 't', `x = ${fmt(xBrg, 3)} m`);
    row('Horizontal forces (t) and lever arms above base (m)', '', '', '', { sub: true });
    const Pa = 0.5 * R.Ka * p.gammaSoil * R.H ** 2, yPa = R.H / 3;
    const Ps = R.Ka * p.gammaSoil * p.surcharge * R.H, yPs = R.H / 2;
    row('Active earth pressure 0.5 Ka g H^2 (H = FRL - base)', Pa, 't', `y = ${fmt(yPa, 3)} m`);
    row('LL surcharge Ka g h H', Ps, 't', `y = ${fmt(yPs, 3)} m`);
    for (const c of R.LLcases) row(`Braking - ${c.name}, shared by 2 supports, at bearing level`, c.Hb, 't', `y = ${fmt(yBr, 3)} m`);
    const sumV1 = W.reduce((s, o) => s + o.w, 0), sumMR1 = W.reduce((s, o) => s + o.w * o.x, 0);
    const sumH1 = Pa + Ps, sumMO1 = Pa * yPa + Ps * yPs;
    const dkA = p.cbl - p.foundationLevel;
    R.PkeyAb = yes(p.abKey) ? (0.5 * R.Kp * p.gammaSoil * ((dkA + p.keyD) ** 2 - dkA ** 2)) / 2 : 0;
    if (R.PkeyAb) row(`Shear key under abutment footing ${fmt(p.keyW, 2)} x ${fmt(p.keyD, 2)}: passive resistance (FOS 2 applied)`, R.PkeyAb, 't');
    const stab = (V, MR, H, MO, bw, key = 0) => {
      const e = bw / 2 - (MR - MO) / V;
      return { V, MR, H, MO, fosO: MR / MO, fosS: (p.mu * V + key) / H, e, pmax: (V / bw) * (1 + (6 * e) / bw), pmin: (V / bw) * (1 - (6 * e) / bw) };
    };
    const cases = [Object.assign({ name: 'Case 1: span unloaded', lim: [2, 1.5, 1] }, stab(sumV1, sumMR1, sumH1, sumMO1, R.ftgW, R.PkeyAb))];
    for (const c of R.LLcases) cases.push(Object.assign({ name: `Case 2: ${c.name} on span`, lim: [2, 1.5, 1] }, stab(sumV1 + c.R, sumMR1 + c.R * xBrg, sumH1 + c.Hb, sumMO1 + c.Hb * yBr, R.ftgW, R.PkeyAb)));
    // seismic case (IRC 6 cl.219 / 214.1.2), no live load, no braking
    let dPae = 0, Kae = 0;
    if (R.seismic) {
      Kae = R.Kae = kaeMO(p.phi, R.Ah);
      dPae = 0.5 * p.gammaSoil * R.H ** 2 * (Kae - R.Ka);
      const inert = W.reduce((s, o) => s + R.Ah * o.w, 0), inertM = W.reduce((s, o) => s + R.Ah * o.w * o.y, 0);
      row('Seismic: Kae (Mononobe-Okabe, delta = 0)', Kae, '', `Ah = ${fmt(R.Ah, 3)}`);
      row('Dynamic increment of earth pressure 0.5 g H^2 (Kae - Ka) at H/2', dPae, 't', 'IRC 6 cl.214.1.2');
      row('Inertia of abutment, soil over it and deck DL (Ah x W)', inert, 't');
      cases.push(Object.assign({ name: 'Case 3: seismic (span unloaded)', lim: [1.5, 1.25, 1.25] }, stab(sumV1, sumMR1, Pa + dPae + inert, Pa * yPa + dPae * R.H / 2 + inertM, R.ftgW, R.PkeyAb)));
    }
    R.abCases = cases;
    if (R.seismic && p.mu < 1.25 * R.Ah && !R.PkeyAb) warnings.push(`Seismic: Ah = ${fmt(R.Ah, 3)} exceeds friction mu / 1.25 - a plain gravity abutment cannot satisfy sliding; provide shear keys / RCC abutment or reduce Ah where IRC 6 cl.219 permits (e.g. free sliding bearings).`);
    for (const c of cases) {
      row(c.name, '', '', '', { sub: true });
      row('Sum V', c.V, 't'); row('Sum MR', c.MR, 't-m'); row('Sum H', c.H, 't'); row('Sum MO', c.MO, 't-m');
      chk(`FOS overturning (>= ${c.lim[0]})`, c.fosO >= c.lim[0], fmt(c.fosO, 2), 'IRC 78 cl.706.3.4');
      chk(`FOS sliding (>= ${c.lim[1]})`, c.fosS >= c.lim[1], fmt(c.fosS, 2), R.PkeyAb ? 'IRC 78 cl.706.3.4 (with shear key)' : 'IRC 78 cl.706.3.4 (no shear key)');
      row('Eccentricity e', c.e, 'm', `< B/6 = ${fmt(R.ftgW / 6, 3)}`);
      chk(`Max base pressure (<= ${c.lim[2] > 1 ? '1.25 x ' : ''}SBC ${fmt(p.sbc * c.lim[2], 1)})`, c.pmax <= p.sbc * c.lim[2], fmt(c.pmax, 2) + ' t/sqm');
      chk('Min base pressure (>= 0, no tension)', c.pmin >= 0, fmt(c.pmin, 2) + ' t/sqm');
    }
    const caseOk = (c) => c.fosO >= c.lim[0] && c.fosS >= c.lim[1] && c.pmax <= p.sbc * c.lim[2] && c.pmin >= 0;
    R.okAb = cases.every(caseOk);
    chk('ABUTMENT RESULT', R.okAb, R.okAb ? 'ALL CHECKS OK' : 'REVISE');
    row('Stem base check at footing top (free cantilever, plain concrete - no tension)', '', '', '', { sub: true });
    const Wst = W.slice(1).filter((o) => o.label !== 'Soil over heel');
    const hSt = (R.hStem = p.frl - R.ftgTop);
    const MoSt0 = (0.5 * R.Ka * p.gammaSoil * hSt ** 3) / 3 + (R.Ka * p.gammaSoil * p.surcharge * hSt ** 2) / 2;
    const stemCase = (name, addV, addM, addMo) => {
      const V = Wst.reduce((s, o) => s + o.w, 0) + addV;
      const M = Wst.reduce((s, o) => s + o.w * (o.x - toe), 0) + addM;
      const Mo = MoSt0 + addMo;
      const e = R.stemBase / 2 - (M - Mo) / V;
      return { name, V, M, Mo, e, smax: (V / R.stemBase) * (1 + (6 * e) / R.stemBase), smin: (V / R.stemBase) * (1 - (6 * e) / R.stemBase) };
    };
    R.stemCases = R.LLcases.map((c) => stemCase(c.name, c.R, c.R * (xBrg - toe), c.Hb * (R.soffit - R.ftgTop)));
    if (R.seismic) {
      const Mi = Wst.reduce((s, o) => s + R.Ah * o.w * (o.y - ft), 0);
      const MoSeis = -(R.Ka * p.gammaSoil * p.surcharge * hSt ** 2) / 2 + 0.5 * p.gammaSoil * hSt ** 2 * (Kae - R.Ka) * hSt / 2 + Mi;
      R.stemCases.push(Object.assign(stemCase('Seismic', 0, 0, MoSeis), { seis: true }));
    }
    let gs = R.stemCases[0];
    for (const s of R.stemCases) if (s.smin < gs.smin) gs = s;
    R.stemGov = gs;
    row('Governing load', gs.name, '');
    row('V at stem base', gs.V, 't');
    row('M of V about stem front edge', gs.M, 't-m');
    row('Height of earth on stem h = FRL - footing top', hSt, 'm');
    row('Overturning M at stem base', gs.Mo, 't-m');
    row('e at stem base', gs.e, 'm', `< B/6 = ${fmt(R.stemBase / 6, 3)}`);
    row('Max compressive stress', gs.smax, 't/sqm', `Permissible M${p.subFck} = ${fmt(p.subAllow, 0)} t/sqm`);
    row('Min stress (>= 0, no tension)', gs.smin, 't/sqm');
    R.okStem = R.stemCases.every((s) => s.smin >= 0 && s.smax <= p.subAllow * (s.seis ? 1.5 : 1));
    chk('STEM RESULT', R.okStem, R.okStem ? 'OK' : 'REVISE');

    // 7. piers (multi-vent)
    R.okPier = true;
    if (nV > 1) {
      sec(`7. INTERMEDIATE PIERS (${nV - 1} Nos, CC M${p.subFck} with plums) - STABILITY (IRC 78, per m length)`);
      inp('Pier top width (two bearings + joint)', 'pierTopW', 'm');
      inp('Batter on each face', 'pierBatter', 'm');
      R.pierBase = row('Pier base width', p.pierTopW + 2 * p.pierBatter, 'm');
      inp('Footing projection each side', 'pierToe', 'm');
      R.pierFtgW = row('Pier footing width', R.pierBase + 2 * p.pierToe, 'm');
      if (p.pierTopW < 2 * p.bearingW + 0.02) warnings.push(`Pier top width ${fmt(p.pierTopW, 2)} m is less than two bearings + joint (${fmt(2 * p.bearingW + 0.02, 2)} m).`);
      const pb = R.pierBase, fw = R.pierFtgW;
      const Wp = [
        ['Pier footing', fw * ft * gc, ft / 2],
        ['Pier stem', ((p.pierTopW + pb) / 2) * R.stemH * gc, ft + R.stemH / 2],
        ['Bed block (full top width)', p.pierTopW * p.bedBlockT * 2.5, (R.stemTop + R.soffit) / 2 - p.foundationLevel],
        ['Deck DL from both spans', 2 * deckDL, yBr],
      ];
      for (const [l, w] of Wp) row(l, w, 't', 'symmetric about pier axis');
      const Vp = Wp.reduce((s, o) => s + o[1], 0);
      const ecc = p.pierTopW / 2 - p.bearingW / 2;
      const vw = Math.SQRT2 * R.vel;
      R.waterForce = 52 * 1.5 * vw ** 2 / 1000 * p.fsd; // t per m of pier length, square nose (IRC 6 cl.210)
      row('Water current force along the pier (IRC 6 cl.210, K = 1.5)', R.waterForce, 't/m', 'acts along the pier length - resisted by the full pier length; not critical');
      const pcases = [];
      for (const c of R.LLcases) {
        const V = Vp + c.R;
        const MR = Vp * fw / 2 + c.R * (fw / 2 - ecc);
        const MO = c.Hb * yBr;
        pcases.push(Object.assign({ name: `${c.name} on one span + braking`, lim: [2, 1.5, 1] }, stab(V, MR, c.Hb, MO, fw)));
      }
      if (R.seismic) {
        const Hs = Wp.reduce((s, o) => s + R.Ah * o[1], 0), Ms = Wp.reduce((s, o) => s + R.Ah * o[1] * o[2], 0);
        pcases.push(Object.assign({ name: 'Seismic (spans unloaded)', lim: [1.5, 1.25, 1.25] }, stab(Vp, Vp * fw / 2, Hs, Ms, fw)));
      }
      R.pierCases = pcases;
      for (const c of pcases) {
        row(c.name, '', '', '', { sub: true });
        row('Sum V', c.V, 't'); row('Sum H', c.H, 't');
        chk(`FOS overturning (>= ${c.lim[0]})`, c.fosO >= c.lim[0], fmt(c.fosO, 2));
        chk(`FOS sliding (>= ${c.lim[1]})`, c.fosS >= c.lim[1], fmt(c.fosS, 2));
        chk(`Max base pressure (<= ${fmt(p.sbc * c.lim[2], 1)})`, c.pmax <= p.sbc * c.lim[2], fmt(c.pmax, 2) + ' t/sqm');
        chk('Min base pressure (>= 0)', c.pmin >= 0, fmt(c.pmin, 2) + ' t/sqm');
      }
      // stem at footing top, worst LL case
      const Vs = Wp[1][1] + Wp[2][1] + Wp[3][1];
      let sworst = null;
      for (const c of R.LLcases) {
        const V = Vs + c.R, M = c.R * ecc + c.Hb * (R.soffit - R.ftgTop);
        const e = M / V;
        const s = { smax: (V / pb) * (1 + (6 * e) / pb), smin: (V / pb) * (1 - (6 * e) / pb) };
        if (!sworst || s.smin < sworst.smin) sworst = s;
      }
      R.pierStem = sworst;
      row('Pier stem at footing top: max / min stress', `${fmt(sworst.smax, 2)} / ${fmt(sworst.smin, 2)}`, 't/sqm');
      R.okPier = pcases.every(caseOk) && sworst.smin >= 0 && sworst.smax <= p.subAllow;
      chk('PIER RESULT', R.okPier, R.okPier ? 'ALL CHECKS OK' : 'REVISE');
    }

    // 8. wing walls
    sec(`${nV > 1 ? 8 : 7}. SPLAYED WING WALLS (CC M${p.subFck} with plums) - max section at abutment end; returns 1000 x 1100`);
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
    const wt = p.wToe, wh = R.wH, wf = p.wFootT;
    const WW = [
      ['Footing', R.wFtgW * wf * gc, R.wFtgW / 2, wf / 2],
      ['Stem front triangular', 0.5 * p.wFrontBatter * wh * gc, wt + (2 * p.wFrontBatter) / 3, wf + wh / 3],
      ['Stem rectangular', p.wTopW * wh * gc, wt + p.wFrontBatter + p.wTopW / 2, wf + wh / 2],
      ['Stem back triangular', 0.5 * R.wBack * wh * gc, wt + p.wFrontBatter + p.wTopW + R.wBack / 3, wf + wh / 3],
      ['Soil over back batter', 0.5 * R.wBack * wh * p.gammaSoil, wt + p.wBaseW - R.wBack / 3, wf + (2 * wh) / 3],
      ['Soil over heel', p.wHeel * wh * p.gammaSoil, wt + p.wBaseW + p.wHeel / 2, wf + wh / 2],
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
    let okWs = true;
    if (R.seismic) {
      const iH = WW.reduce((s, o) => s + R.Ah * o[1], 0), iM = WW.reduce((s, o) => s + R.Ah * o[1] * o[3], 0);
      const H = Pa + dPae + iH, MO = Pa * yPa + dPae * R.H / 2 + iM;
      const e = R.wFtgW / 2 - (wMR - MO) / wV;
      R.wSeis = { fosO: wMR / MO, fosS: (p.mu * wV + R.Pkey) / H, pmax: (wV / R.wFtgW) * (1 + (6 * e) / R.wFtgW), pmin: (wV / R.wFtgW) * (1 - (6 * e) / R.wFtgW) };
      row('Seismic case', '', '', '', { sub: true });
      chk('FOS overturning (>= 1.5)', R.wSeis.fosO >= 1.5, fmt(R.wSeis.fosO, 2));
      chk('FOS sliding (>= 1.25)', R.wSeis.fosS >= 1.25, fmt(R.wSeis.fosS, 2));
      chk(`Max base pressure (<= 1.25 SBC)`, R.wSeis.pmax <= 1.25 * p.sbc, fmt(R.wSeis.pmax, 2) + ' t/sqm');
      chk('Min base pressure (>= 0)', R.wSeis.pmin >= 0, fmt(R.wSeis.pmin, 2) + ' t/sqm');
      okWs = R.wSeis.fosO >= 1.5 && R.wSeis.fosS >= 1.25 && R.wSeis.pmax <= 1.25 * p.sbc && R.wSeis.pmin >= 0;
    }
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
    R.okWing = R.w.fosO >= 2 && R.w.fosS >= 1.5 && R.w.pmax <= p.sbc && R.w.pmin >= 0 && R.ws.smin >= 0 && R.ws.smax <= p.subAllow && okWs;
    chk('WING WALL RESULT', R.okWing, R.okWing ? 'ALL CHECKS OK' : 'REVISE');
    R.wFreeH = row('Wing wall at free end: stem height (tapers to ground level)', (p.frl + p.gl) / 2 - R.wFtgTop, 'm', 'Section reduced in proportion');

    // summary
    sec(`${nV > 1 ? 9 : 8}. SUMMARY OF ADOPTED DESIGN`);
    const abWorst = {
      fosO: Math.min(...cases.map((c) => c.fosO)), fosS: Math.min(...cases.map((c) => c.fosS)),
      pmax: Math.max(...cases.map((c) => c.pmax)), pmin: Math.min(...cases.map((c) => c.pmin)),
    };
    R.abWorst = abWorst;
    R.summary = [
      ['Vents', `${nV} No${nV > 1 ? 's' : ''}. x ${fmt(p.span, 2)} m clear span${p.skew ? ` (skew ${p.skew} deg, ${fmt(spanR, 2)} m along road)` : ''}, RCC solid slab, simply supported${nV > 1 ? `; ${nV - 1} pier${nV > 2 ? 's' : ''} ${fmt(p.pierTopW, 2)} m wide` : ''}`],
      ['Deck', `${fmt(p.D * 1000, 0)} mm RCC M${p.fck} (${LSM ? 'IRC 112 LSM' : 'IRC 21 WSM'}), ${fmt(R.deckL, 2)} m long x ${fmt(B, 2)} m wide each; ${p.mainDia} dia @ ${p.mainSpacing} c/c main, ${p.distDia} dia @ ${p.distSpacing} distribution, ${p.topDia} dia @ ${p.topSpacing} top; Fe${p.fy}`],
      ['Live load', `${R.vehicles.map((e) => e.veh.name).join(', ')} (governing: ${gov.veh.name})`],
      ['Edge / wearing coat', `${railing ? `RCC kerb ${fmt(p.kerbW * 1000, 0)} x ${fmt(p.kerbH * 1000, 0)} with hand railing (MORTH SD/202)` : `RCC crash barrier ${fmt(p.barrierW * 1000, 0)} wide (MORTH)`}${p.fpW > 0 ? `, footpaths ${fmt(p.fpW, 2)} m` : ''}; ${fmt(p.wc * 1000, 0)} mm wearing coat`],
      ['Approach slabs', `${fmt(p.approachThk * 1000, 0)} mm RCC, ${fmt(p.approachLen, 2)} m long each side, 12 dia @ 150 T&B both ways; 20 mm expansion joints`],
      ['Abutments', `${yes(p.abKey) ? 'with shear key; ' : ''}${fmt(p.abTopW, 2)} top / ${fmt(R.stemBase, 2)} base (front batter ${fmt(fb, 2)}, back ${fmt(p.abBackBatter, 2)}), CC M${p.subFck} plums, stem ${fmt(R.stemH)} m, on ${fmt(R.ftgW, 2)} x ${fmt(p.footingT, 2)} PCC footing`],
      ...(nV > 1 ? [['Piers', `${fmt(p.pierTopW, 2)} top / ${fmt(R.pierBase, 2)} base, CC M${p.subFck} plums, on ${fmt(R.pierFtgW, 2)} x ${fmt(p.footingT, 2)} PCC footing`]] : []),
      ['Bed blocks', `RCC 500 x ${fmt(p.bedBlockT * 1000, 0)}, 10 dia @ 150 T&B both ways`],
      ['Wing walls', `${fmt(p.wTopW, 2)} top / ${fmt(p.wBaseW, 2)} base (front batter ${fmt(p.wFrontBatter, 2)}), footing ${fmt(R.wFtgW, 2)} x ${fmt(p.wFootT, 2)} + shear key ${fmt(p.keyW, 2)} x ${fmt(p.keyD, 2)}; returns 1000 x 1100`],
      ['Levels', `FRL +${fmt(p.frl)},  soffit +${fmt(R.soffit)},  TBL +${fmt(R.tbl)},  FSL +${fmt(R.fsl)},  CBL +${fmt(p.cbl)},  foundation +${fmt(p.foundationLevel)}`],
      ['Abutment checks', `FOS overturning ${fmt(abWorst.fosO, 2)}, sliding ${fmt(abWorst.fosS, 2)}, base pressure ${fmt(abWorst.pmax, 2)} / ${fmt(abWorst.pmin, 2)} t/sqm, stem ${fmt(gs.smax, 2)} / ${fmt(gs.smin, 2)}`],
      ['Wing checks', `FOS overturning ${fmt(R.w.fosO, 2)}, sliding ${fmt(R.w.fosS, 2)}, base ${fmt(R.w.pmax, 2)} / ${fmt(R.w.pmin, 2)}, stem ${fmt(R.ws.smax, 2)} / ${fmt(R.ws.smin, 2)} t/sqm`],
      ['Canal', apron ? `${fmt(p.apronThk * 1000, 0)} mm CC apron between abutments; ${fmt(p.liningThk * 1000, 0)} mm CC lining ${fmt(p.liningLen, 0)} m u/s & d/s with 300 x 1000 CC curtain walls at both ends` : 'No floor protection (foundation taken below scour level)'],
      ['Seismic', R.seismic ? `Zone ${p.seismicZone}, Ah = ${fmt(R.Ah, 3)} - checked` : `Zone ${p.seismicZone} - not required (IRC 6 cl.219.1)`],
    ];
    for (const [a, b] of R.summary) row(a, b, '');
    R.assumptions = `Assumptions to confirm at site: SBC ${fmt(p.sbc, 1)} t/sqm, silt factor ${fmt(p.siltFactor, 2)}, backfill phi ${fmt(p.phi, 0)} deg, soil unit weight ${fmt(p.gammaSoil, 2)} t/cum. ${p.frlNote || ''}`;

    R.allOk = R.okSoffit && R.okVent && R.okFound && R.okDefl && R.okDepth && R.okAst && R.okShear && R.okDist && R.okAb && R.okStem && R.okPier && R.okWing;
    const typ = isD ? 'D.L.R.B.' : 'S.L.R.B.';
    R.typ = typ;
    R.title = `DESIGN OF ${typ} AT Km ${p.chainage} OF ${String(p.canalName).toUpperCase()}, ${String(p.location).toUpperCase()}`;
    R.subtitle = `${nV} vent${nV > 1 ? 's' : ''} x ${fmt(p.span, 2)} m clear span RCC solid slab | Carriageway ${fmt(p.carriageway, 2)} m | ${R.vehicles.map((e) => e.veh.name.replace('IRC ', '')).join(' / ')} | ${LSM ? 'IRC 112 LSM' : 'IRC 21 WSM'}`;
    R.codes = `Codes: IRC 5-2015, IRC 6-2017, ${LSM ? 'IRC 112-2020 (LSM)' : 'IRC 21-2000 (WSM)'}, IRC 78-2014, IRC SP:13-2004, IS 456-2000, IS 1786-2008, IS 2502-1963, MORTH standard drawings.`;
    R.nameOfWork = `Construction of ${typ} across ${String(p.canalName).replace(/\s*\(.*\)\s*/, '')} at Km ${p.chainage} in ${p.location}, ${p.district} District.`;
    return { p, R, sections: secs, warnings };
  }

  // Most economical deck: least thickness (25 mm steps, from max(250 mm,
  // L/20)) for which a bar dia / spacing passes depth, steel, shear (and SLS
  // for LSM); widest main spacing >= 100 mm preferred, then least steel.
  function sizeDeck(input) {
    const p = Object.assign({}, DEFAULTS, input);
    const L0 = design(p).R.Leff;
    let D = Math.max(p.minD || 0.25, Math.ceil((L0 / 20) / 0.025 - 1e-9) * 0.025);
    const spacings = [200, 175, 150, 140, 125, 110, 100, 90, 80, 75];
    for (let i = 0; i < 60; i++, D = +(D + 0.025).toFixed(3)) {
      let best = null;
      for (const dia of [12, 16, 20, 25]) {
        for (const sp of spacings) {
          const t = design(Object.assign({}, p, { D, mainDia: dia, mainSpacing: sp })).R;
          if (t.okDepth && t.okAst && t.okShear && t.okDefl) {
            const ast = t.AstProv;
            if (sp >= 100 && (!best || ast < best.ast)) best = { dia, sp, ast };
            break;
          }
        }
      }
      if (best) {
        Object.assign(p, { D, mainDia: best.dia, mainSpacing: best.sp });
        dist: for (const dd of [10, 12, 16]) {
          for (const sp of [250, 200, 175, 150, 125, 100]) { p.distDia = dd; p.distSpacing = sp; if (design(p).R.okDist) break dist; }
        }
        return { D, mainDia: best.dia, mainSpacing: best.sp, distDia: p.distDia, distSpacing: p.distSpacing };
      }
    }
    return null;
  }

  // Auto design: vents, span, foundation level, deck, abutment, piers, wings.
  function autoDesign(input) {
    const p = Object.assign({}, DEFAULTS, input);
    const log = [];
    let r = design(p);
    if (r.R.ventsSuggested > p.nVents) { p.nVents = r.R.ventsSuggested; log.push(`${p.nVents} vents`); r = design(p); }
    if (p.span * p.nVents + (p.nVents - 1) * p.pierTopW < r.R.topFSL - 1e-6 || p.span > p.maxSlabSpan) { p.span = r.R.spanSuggested; log.push(`span ${p.span} m`); r = design(p); }
    if (!r.R.okFound) { p.foundationLevel = r.R.flSuggested; log.push(`foundation level ${fmt(p.foundationLevel)}`); r = design(p); }
    const dk = sizeDeck(p);
    if (dk) Object.assign(p, dk);
    log.push(`deck ${fmt(p.D * 1000, 0)} mm, ${p.mainDia} dia @ ${p.mainSpacing}, dist ${p.distDia} @ ${p.distSpacing}`);
    r = design(p);
    // gravity proportions kept practical: back batter <= 0.8 x wall height,
    // footing projections <= 1.5 m each; beyond that a gravity section is
    // not the right structure and the designer is told so.
    const H0 = () => design(p).R.H;
    if (!r.R.okAb && r.R.abCases.some((k) => k.fosS < k.lim[1]) && !yes(p.abKey)) { p.abKey = 'yes'; log.push('shear key under abutment'); r = design(p); }
    for (let i = 0; i < 80 && !(r.R.okAb && r.R.okStem); i++) {
      const c = r.R.abCases, st = r.R.stemGov;
      const canBatter = p.abBackBatter + 0.1 <= 0.8 * H0();
      if ((st.smin < 0 || c.some((k) => k.fosO < k.lim[0])) && canBatter) p.abBackBatter = +(p.abBackBatter + 0.1).toFixed(2);
      else if (c.some((k) => k.pmin < 0 || k.fosS < k.lim[1]) && p.abHeel < 1.5) p.abHeel = +(p.abHeel + 0.1).toFixed(2);
      else if (p.abToe < 1.5 || p.abHeel < 1.5) { p.abToe = +Math.min(1.5, p.abToe + 0.1).toFixed(2); p.abHeel = +Math.min(1.5, p.abHeel + 0.1).toFixed(2); }
      else if (canBatter) p.abBackBatter = +(p.abBackBatter + 0.1).toFixed(2);
      else break;
      r = design(p);
    }
    for (let i = 0; i < 40 && !r.R.okPier; i++) {
      const pc = r.R.pierCases || [];
      if (r.R.pierStem && r.R.pierStem.smin < 0 && p.pierBatter < 0.6) p.pierBatter = +(p.pierBatter + 0.1).toFixed(2);
      else if (p.pierToe < 1.5) p.pierToe = +(p.pierToe + (pc.some((k) => k.fosS < k.lim[1]) ? 0.2 : 0.1)).toFixed(2);
      else break;
      r = design(p);
    }
    for (let i = 0; i < 80 && !r.R.okWing; i++) {
      const w = r.R.w, ws = r.R.ws, wsz = r.R.wSeis;
      const stab = w.fosO < 2 || w.fosS < 1.5 || ws.smin < 0 || w.pmin < 0 || (wsz && (wsz.fosO < 1.5 || wsz.fosS < 1.25 || wsz.pmin < 0));
      const canBase = p.wBaseW + 0.1 <= 0.8 * r.R.wH + p.wTopW;
      if (stab && canBase) p.wBaseW = +(p.wBaseW + 0.1).toFixed(2);
      else if (p.wToe < 1.5 || p.wHeel < 1.5) { p.wToe = +Math.min(1.5, p.wToe + 0.1).toFixed(2); p.wHeel = +Math.min(1.5, p.wHeel + 0.1).toFixed(2); }
      else if (canBase) p.wBaseW = +(p.wBaseW + 0.1).toFixed(2);
      else break;
      r = design(p);
    }
    if (!r.R.okAb || !r.R.okStem || !r.R.okWing || !r.R.okPier) {
      r.warnings.push('Auto design reached practical limits of a gravity (plain concrete) substructure without satisfying every check. For this site adopt an RCC cantilever / counterfort abutment and wing walls, a shear key, or a deeper / pile foundation - get the substructure designed separately.');
    }
    log.push(`abutment back batter ${p.abBackBatter}, toe ${p.abToe}, heel ${p.abHeel}; wing base ${p.wBaseW}${p.nVents > 1 ? `; pier batter ${p.pierBatter}, toe ${p.pierToe}` : ''}`);
    return { input: p, log, result: r };
  }

  Object.assign(BD, { sizeDeck, DEFAULTS, CARRIAGEWAY, ZONE_Z, COVER, scbcFor, sstFor, subAllowFor, design, autoDesign, alphaFor, fmt, liveLoadSet });
})(typeof window !== 'undefined' ? window : globalThis);
