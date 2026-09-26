/*
 * U.T. (under tunnel) design engine - a drain passing under an irrigation
 * canal through a single / multi-cell RCC box, with a vertical drop at the
 * upstream end, cistern, splayed transitions, gravity head walls and gravity
 * wing / return walls, in the format of the I&CAD UT design workbooks.
 *
 *   hydrology   maximum flood discharge by Dicken's formula (or given)
 *   ventway     vents from an assumed barrel velocity; Lacey waterway
 *               P = 4.8 Q^1/2 (IS 7784 Pt 1 cl.8.1.2) with fluming
 *   hydraulics  tail channel by Manning; water levels / TELs section by
 *               section upstream: expansion / contraction eddy losses,
 *               barrel loss by Unwin's formula, Sarda-type drop crest
 *               (free or drowned, Villemonte), approach channel
 *   drop        drop wall top / base width, cistern length and floor
 *               thickness (CDO guidelines, as in the department workbooks)
 *   scour       Lacey, 1.5 d upstream, 2.0 d downstream; cut-off levels
 *   box         closed RCC frame solved by the stiffness method for
 *               4 cases under the canal (box / canal empty or full) and
 *               2 cases under the banks (fill + live load); members
 *               designed by WSM (IRC 21) incl. axial force; shear;
 *               base pressure
 *   walls       head walls on the box, wing / return walls: no tension in
 *               concrete (e <= b/6), base pressure, FOS 2.0 / 1.5
 *
 * Defaults reproduce the UT @ Km 25.615 workbook (1 vent 2.5 x 1.5 m).
 * Units: metres, tonnes, t/sqm; mm and N/sqmm where noted.
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});
  const G = 9.81;
  const fmt = (v, n = 3) => (typeof v === 'number' && isFinite(v) ? v.toFixed(n) : String(v));
  const ceilTo = (x, s) => Math.ceil(x / s - 1e-9) * s;
  const floorTo = (x, s) => Math.floor(x / s + 1e-9) * s;
  const yes = (v) => v === 'yes' || v === true;

  const UT_DEFAULTS = {
    structure: 'UT',
    chainage: '25.615',
    canalName: 'Main Canal',
    location: '',
    district: '',
    state: 'GOVERNMENT OF TELANGANA',
    department: 'IRRIGATION & CAD DEPARTMENT',
    subDivision: 'Irr. Sub-Division',
    division: 'Irr. Division',
    project: '',
    // canal
    Qc: 10.848, bedWidth: 5.5, fsd: 1.5, sideSlope: 1.5, freeBoard: 0.6, bedFall: 2000, manningN: 0.025,
    cbl: 406.295, bankWidthL: 4, bankWidthR: 4, skew: 0,
    // drain
    floodMode: 'dicken', catchment: 0.218, dickenC: 19.5, mfdGiven: 6.221,
    drainBed: 407.025, drainSideSlope: 1.5, drainN: 0.025, tailFall: 3300, siltFactor: 2.0, fluming: 60,
    // box
    vBarrel: 3.0, nVents: 1, ventW: 2.5, ventH: 1.5, cushion: 0.1, sealing: 0.04, wcBox: 0.075,
    boxAuto: 'yes', minT: 0.3, tTop: 0.3, tBot: 0.3, tWall: 0.3, tMid: 0.3, haunch: 0.15, pcc: 0.15,
    // hydraulics
    nConc: 0.018, usSplay: 2, dsSplay: 3, kTail: 0.5, kExit: 0.3, kEntry: 0.2, kApproach: 0.5,
    barrelF1: 0.505, unwinA: 0.00316, unwinB: 0.03, crestDepth: 0, drainFB: 0.6,
    // drop / floors
    rhoConc: 2.4, floorWc: 0.15, cistern: 0, dsFloorT: 0.3,
    // materials & soil
    fck: 30, fy: 415, scbc: 10, sst: 200, modRatio: 10, cover: 0.04, exposure: 'moderate',
    subFck: 15, subAllow: 400, gammaRcc: 2.5, gammaConc: 2.4, gammaSoil: 2.1, gammaSub: 1.1,
    phi: 28, kMode: 'active', sbc: 15, mu: 0.5,
    // loads
    llBank: 'A', wallSurcharge: 'yes', llDisp: 1.0, llImpact: 0, surcharge: 1.2, surchargeHead: 0.5,
    // head wall
    hwTopW: 0.5, hwRearBatter: 1.3, hwFrontBatter: 0,
    // wing / return walls
    wallAuto: 'yes', wTopW: 0.5, wRearBatter: 1.2, wFrontBatter: 0, wToe: 0.3, wHeel: 0.3, wFootT: 0.45,
    wFdnUs: 0, wFdnDs: 0, returnLen: 2.0,
  };

  // ------------------------------------------------------------ hydraulics
  const area = (B, s, d) => (B + s * d) * d;
  const perim = (B, s, d) => B + 2 * d * Math.sqrt(1 + s * s);
  const topW = (B, s, d) => B + 2 * s * d;

  function critical(Q, B, s) {
    let lo = 1e-4, hi = 20;
    for (let i = 0; i < 100; i++) {
      const d = (lo + hi) / 2;
      const f = (Q * Q * topW(B, s, d)) / (G * area(B, s, d) ** 3);
      if (f > 1) lo = d; else hi = d;
    }
    return (lo + hi) / 2;
  }
  // Subcritical depth for specific energy E above bed (choked -> critical).
  function depthForE(Q, B, s, E) {
    const dc = critical(Q, B, s);
    const Ec = dc + (Q / area(B, s, dc)) ** 2 / (2 * G);
    if (E <= Ec) return { d: dc, choked: E < Ec - 1e-6 };
    let lo = dc, hi = E;
    for (let i = 0; i < 100; i++) {
      const d = (lo + hi) / 2;
      const e = d + (Q / area(B, s, d)) ** 2 / (2 * G);
      if (e > E) hi = d; else lo = d;
    }
    return { d: (lo + hi) / 2, choked: false };
  }
  function normalDepth(Q, B, s, n, S) {
    let lo = 1e-4, hi = 20;
    for (let i = 0; i < 100; i++) {
      const d = (lo + hi) / 2;
      const A = area(B, s, d), R = A / perim(B, s, d);
      if ((A * R ** (2 / 3) * Math.sqrt(S)) / n > Q) hi = d; else lo = d;
    }
    return (lo + hi) / 2;
  }
  function section(name, Q, B, s, n, bl, d) {
    const A = area(B, s, d), P = perim(B, s, d), Rh = A / P, v = Q / A, hv = (v * v) / (2 * G);
    return { name, B, s, n, bl, d, A, P, R: Rh, v, hv, S: (v * v * n * n) / Rh ** (4 / 3), mfl: bl + d, tel: bl + d + hv };
  }
  // Section upstream of `prev`, energy balance with eddy coefficient k and friction over L.
  function upstream(name, Q, B, s, n, bl, prev, k, L) {
    // residual: energy at this section minus (energy downstream + losses); rises with depth in subcritical flow
    const f = (d) => { const x = section(name, Q, B, s, n, bl, d); return x.tel - (prev.tel + k * Math.abs(x.hv - prev.hv) + (L * (x.S + prev.S)) / 2); };
    const dc = critical(Q, B, s);
    let choked = false, d;
    if (f(dc) >= 0) { d = dc; choked = f(dc) > 1e-6; }
    else {
      let lo = dc, hi = Math.max(dc * 2, prev.tel - bl + 1);
      for (let i = 0; i < 200 && f(hi) < 0; i++) hi *= 1.5;
      for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
      d = (lo + hi) / 2;
    }
    const sec = section(name, Q, B, s, n, bl, d);
    sec.eddy = k * Math.abs(sec.hv - prev.hv); sec.fric = (L * (sec.S + prev.S)) / 2; sec.L = L; sec.k = k; sec.choked = choked;
    return sec;
  }

  // ------------------------------------------------------------ frame solver
  // 2D frame, 3 dof / node. Members carry transverse trapezoidal loads
  // (local +y, intensity w1 at i -> w2 at j); nodal loads [Fx, Fy, M].
  function solveFrame(nodes, members, nodalLoads, fixed) {
    const nd = nodes.length * 3;
    const K = Array.from({ length: nd }, () => new Float64Array(nd));
    const F = new Float64Array(nd);
    for (const [ni, f] of nodalLoads) for (let k = 0; k < 3; k++) F[ni * 3 + k] += f[k] || 0;
    const EI = 1, EA = 1e6;
    for (const m of members) {
      const a = nodes[m.i], b = nodes[m.j];
      const L = Math.hypot(b.x - a.x, b.y - a.y), c = (b.x - a.x) / L, s = (b.y - a.y) / L;
      m.L = L; m.c = c; m.s = s;
      const I = m.I || 1;
      const k1 = EA / L, k2 = (12 * EI * I) / L ** 3, k3 = (6 * EI * I) / L ** 2, k4 = (4 * EI * I) / L, k5 = (2 * EI * I) / L;
      const kl = [
        [k1, 0, 0, -k1, 0, 0], [0, k2, k3, 0, -k2, k3], [0, k3, k4, 0, -k3, k5],
        [-k1, 0, 0, k1, 0, 0], [0, -k2, -k3, 0, k2, -k3], [0, k3, k5, 0, -k3, k4],
      ];
      const T = [[c, s, 0, 0, 0, 0], [-s, c, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 0, c, s, 0], [0, 0, 0, -s, c, 0], [0, 0, 0, 0, 0, 1]];
      m.kl = kl; m.T = T;
      // fixed-end reactions (local) for trapezoidal load: uniform w1 + triangle (0 -> w2-w1)
      const w = m.w1 || 0, t = (m.w2 || 0) - w;
      const fe = [0, -w * L / 2 - (3 * t * L) / 20, -w * L * L / 12 - (t * L * L) / 30, 0, -w * L / 2 - (7 * t * L) / 20, w * L * L / 12 + (t * L * L) / 20];
      m.fe = fe;
      const dofs = [m.i * 3, m.i * 3 + 1, m.i * 3 + 2, m.j * 3, m.j * 3 + 1, m.j * 3 + 2];
      m.dofs = dofs;
      // kg = T^t kl T
      const kg = Array.from({ length: 6 }, () => new Float64Array(6));
      for (let p = 0; p < 6; p++) for (let q = 0; q < 6; q++) {
        let sum = 0;
        for (let r = 0; r < 6; r++) { if (!T[r][p]) continue; for (let u = 0; u < 6; u++) if (T[u][q]) sum += T[r][p] * kl[r][u] * T[u][q]; }
        kg[p][q] = sum;
      }
      for (let p = 0; p < 6; p++) for (let q = 0; q < 6; q++) K[dofs[p]][dofs[q]] += kg[p][q];
      // equivalent nodal loads = -T^t fe
      for (let p = 0; p < 6; p++) { let sum = 0; for (let r = 0; r < 6; r++) sum += T[r][p] * fe[r]; F[dofs[p]] -= sum; }
    }
    for (const dof of fixed) { for (let k = 0; k < nd; k++) { K[dof][k] = 0; K[k][dof] = 0; } K[dof][dof] = 1; F[dof] = 0; }
    // Gauss elimination
    const A = K.map((r) => Array.from(r)), x = Array.from(F);
    for (let i = 0; i < nd; i++) {
      let piv = i;
      for (let r = i + 1; r < nd; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
      [A[i], A[piv]] = [A[piv], A[i]]; [x[i], x[piv]] = [x[piv], x[i]];
      for (let r = i + 1; r < nd; r++) {
        const f = A[r][i] / A[i][i];
        if (!f) continue;
        for (let k = i; k < nd; k++) A[r][k] -= f * A[i][k];
        x[r] -= f * x[i];
      }
    }
    const u = new Array(nd).fill(0);
    for (let i = nd - 1; i >= 0; i--) { let s = x[i]; for (let k = i + 1; k < nd; k++) s -= A[i][k] * u[k]; u[i] = s / A[i][i]; }
    for (const m of members) {
      const ug = m.dofs.map((d) => u[d]);
      const ul = m.T.map((row) => row.reduce((s, v, k) => s + v * ug[k], 0));
      m.f = m.kl.map((row, r) => row.reduce((s, v, k) => s + v * ul[k], 0) + m.fe[r]);
      // internal moment (sagging +, tension on local -y) and shear along member
      const Mi = m.f[2], Fy = m.f[1], w = m.w1 || 0, t = (m.w2 || 0) - w, L = m.L;
      m.M = (x) => -Mi + Fy * x + (w * x * x) / 2 + (t * x ** 3) / (6 * L);
      m.V = (x) => Fy + w * x + (t * x * x) / (2 * L);
      m.N = m.f[0]; // + compression
    }
    return members;
  }

  // ------------------------------------------------------------ gravity walls
  // Stem (top width a, front batter fb, rear batter rb, height H) on a footing
  // (offset o each side, thickness tf). Rankine pressure on the vertical plane
  // through the heel with level fill, soil on the rear batter / heel included.
  function gravityWall(o) {
    const { H, a, fb, rb, toe, heel, tf, K, gs, gc, hs, mu, sbc, allow } = o;
    const b = fb + a + rb, B = b + toe + heel;
    // stem alone, moments about the toe of the stem
    const st = [];
    st.push(['Front batter', 0.5 * fb * H * gc, (2 * fb) / 3]);
    st.push(['Rectangular part', a * H * gc, fb + a / 2]);
    st.push(['Rear batter', 0.5 * rb * H * gc, fb + a + rb / 3]);
    st.push(['Soil on rear batter', 0.5 * rb * H * gs, fb + a + (2 * rb) / 3]);
    const Ph = 0.5 * K * gs * H * H, Ps = K * gs * hs * H;
    const stemV = st.reduce((s, x) => s + x[1], 0), stemMR = st.reduce((s, x) => s + x[1] * x[2], 0);
    const stemMO = (Ph * H) / 3 + (Ps * H) / 2;
    const xs = (stemMR - stemMO) / stemV, es = b / 2 - xs;
    const stem = { V: stemV, H: Ph + Ps, MR: stemMR, MO: stemMO, x: xs, e: es, lim: b / 6, smax: (stemV / b) * (1 + (6 * es) / b), smin: (stemV / b) * (1 - (6 * es) / b), rows: st, Ph, Ps };
    // whole wall on footing, moments about the toe of the footing
    const Ht = H + tf;
    const ft = st.map(([n, w, x]) => [n, w, x + toe]);
    if (heel > 0) ft.push(['Soil over heel', heel * H * gs, toe + b + heel / 2]);
    ft.push(['Footing', B * tf * gc, B / 2]);
    const V = ft.reduce((s, x) => s + x[1], 0), MR = ft.reduce((s, x) => s + x[1] * x[2], 0);
    const Ph2 = 0.5 * K * gs * Ht * Ht, Ps2 = K * gs * hs * Ht;
    const MO = (Ph2 * Ht) / 3 + (Ps2 * Ht) / 2;
    const x = (MR - MO) / V, e = B / 2 - x;
    const base = { V, H: Ph2 + Ps2, MR, MO, x, e, lim: B / 6, smax: (V / B) * (1 + (6 * e) / B), smin: (V / B) * (1 - (6 * e) / B), rows: ft, fosO: MR / MO, fosS: (mu * V) / (Ph2 + Ps2), Ph: Ph2, Ps: Ps2 };
    stem.ok = stem.e <= stem.lim + 1e-9 && stem.smax <= allow;
    base.ok = base.smax <= sbc && base.smin >= -1e-9 && base.fosO >= 2 && base.fosS >= 1.5;
    return { b, B, stem, base, ok: stem.ok && (tf > 0 ? base.ok : true), H, Ht, rb, toe, heel };
  }
  // Least section passing every check: rear batter for the stem, then the
  // smallest footing (toe / heel in 0.1 m steps).
  function sizeWall(o) {
    for (let rb = 0.3; rb <= 10; rb = +(rb + 0.1).toFixed(2)) {
      const w0 = gravityWall(Object.assign({}, o, { rb, toe: 0.3, heel: 0.3 }));
      if (!w0.stem.ok) continue;
      if (!(o.tf > 0)) return w0;
      let best = null;
      for (let toe = 0.3; toe <= 2.0 + 1e-9; toe = +(toe + 0.1).toFixed(2)) {
        for (let heel = 0.3; heel <= 4.0 + 1e-9; heel = +(heel + 0.1).toFixed(2)) {
          const w = gravityWall(Object.assign({}, o, { rb, toe, heel }));
          if (w.base.ok) { if (!best || w.B < best.B - 1e-9) best = w; break; }
        }
      }
      if (best) return best;
    }
    return null;
  }

  // ------------------------------------------------------------ WSM member design
  function memberDesign(p, M, N, V, t, label) {
    const m = p.modRatio, sc = p.scbc, ss = p.sst;
    const k = m * sc / (m * sc + ss), j = 1 - k / 3, Q = 0.5 * sc * k * j; // N/mm2
    const c = p.cover * 1000, D = t * 1000;
    const out = { label, M, N, V, D };
    const trial = (dia) => {
      const d = D - c - dia / 2;
      const Ms = Math.abs(M) + Math.max(N, 0) * (d - D / 2) / 1000; // t-m
      const MsN = Ms * 9.81e6; // N-mm per m
      const dReq = Math.sqrt(MsN / (Q * 1000));
      const AstReq = Math.max(MsN / (ss * j * d) - (Math.max(N, 0) * 9810) / ss, 0.0012 * 1000 * D);
      return { d, Ms, dReq, AstReq };
    };
    // choose bars: least steel with spacing 100..300 mm (multiples of 10)
    let best = null;
    for (const dia of [10, 12, 16, 20, 25]) {
      const tr = trial(dia);
      const ab = (Math.PI * dia * dia) / 4;
      let sp = Math.min(300, Math.floor((1000 * ab) / tr.AstReq / 10) * 10);
      if (sp < 100) continue;
      const prov = (1000 * ab) / sp;
      if (!best || prov < best.prov - 1 || (Math.abs(prov - best.prov) <= 1 && dia < best.dia)) best = Object.assign({ dia, sp, prov }, tr);
    }
    if (!best) { const tr = trial(25); best = Object.assign({ dia: 25, sp: 100, prov: (1000 * Math.PI * 625) / 4 / 100 }, tr); }
    Object.assign(out, best);
    out.okD = out.dReq <= out.d;
    out.okAst = out.prov >= out.AstReq - 1e-6;
    // shear (IS 456 Table 23 values used by IRC 21 for WSM)
    out.tv = (Math.abs(V) * 9.81 * 1000) / (1000 * out.d);
    const pt = (100 * out.prov) / (1000 * out.d);
    const tc20 = pt <= 0.25 ? 0.18 + (pt - 0.15) * 0.4 : pt <= 0.5 ? 0.22 + (pt - 0.25) * 0.32 : 0.3 + (pt - 0.5) * 0.2;
    out.tc = tc20 * (p.fck >= 25 ? 1 + Math.min(p.fck - 20, 20) * 0.006 : 1);
    out.pt = pt;
    out.okShear = out.tv <= out.tc;
    out.ok = out.okD && out.okAst && out.okShear;
    return out;
  }

  // ------------------------------------------------------------ design
  function design(input) {
    const p0 = Object.assign({}, UT_DEFAULTS, input);
    if (!yes(p0.boxAuto)) return core(p0);
    // least member thicknesses (25 mm steps) passing depth, steel and shear
    const map = { top: 'tTop', bottom: 'tBot', wall: 'tWall', mid: 'tMid' };
    const q = Object.assign({}, p0);
    for (const k of Object.values(map)) q[k] = Math.max(p0.minT, 0.2);
    let r = core(q);
    for (let it = 0; it < 60; it++) {
      let changed = false;
      for (const [k, f] of Object.entries(r.R.members)) if (Object.values(f).some((d) => !d.ok)) { q[map[k]] = +(q[map[k]] + 0.025).toFixed(3); changed = true; }
      if (!changed) break;
      r = core(q);
    }
    return r;
  }

  function core(input) {
    const p = Object.assign({}, UT_DEFAULTS, input);
    const R = {};
    const sections = [], warnings = [];
    let cur = null;
    const sec = (title) => { cur = { title, rows: [] }; sections.push(cur); };
    const row = (label, value, unit = '', remark = '', o = {}) => { cur.rows.push(Object.assign({ label, value, unit, remark }, o)); return value; };
    const inp = (label, value, unit = '', remark = '') => row(label, value, unit, remark, { input: true });
    const chk = (label, ok, value, remark = '') => { cur.rows.push({ label, value, unit: '', remark, check: true, ok: !!ok }); return ok; };
    const sub = (label) => cur.rows.push({ label, sub: true });

    R.typ = 'U.T.';
    R.nameOfWork = `Construction of Under Tunnel (U.T.) at Km ${p.chainage} of ${p.canalName}${p.location ? ` near ${p.location}` : ''}${p.district ? `, ${p.district} District` : ''}.`;
    R.title = `DESIGN OF UNDER TUNNEL AT KM ${p.chainage} OF ${String(p.canalName).toUpperCase()}`;
    R.subtitle = R.nameOfWork;
    R.codes = 'IS 7784 (Pt 1 & 2), IRC 6:2017, IRC 21:2000 (WSM), IRC 78, IRC SP:13, IS 456; CDO guidelines.';
    R.assumptions = 'The box is analysed as a closed rigid frame per metre length (member centre lines) with a uniform soil reaction; haunches are ignored in the analysis and in the barrel area. Earth pressure: Rankine ' + (p.kMode === 'rest' ? 'at-rest (1 - sin phi)' : 'active') + ' on the walls. Axial compression N: design moment Ms = M + N (d - D/2) about the tension steel, Ast = Ms / (sst j d) - N / sst (not less than 0.12 %). Gravity walls: no tension allowed in the plain concrete (e <= b/6).';

    // ---- 1. hydraulic particulars
    sec('1. HYDRAULIC PARTICULARS');
    sub('Canal');
    inp('Discharge (design)', p.Qc, 'cumecs');
    inp('Bed width', p.bedWidth, 'm'); inp('Full supply depth', p.fsd, 'm');
    inp('Side slopes', p.sideSlope, ': 1'); inp('Free board', p.freeBoard, 'm');
    inp('Bank top width left / right', `${fmt(p.bankWidthL, 2)} / ${fmt(p.bankWidthR, 2)}`, 'm');
    inp('Canal bed level (CBL)', p.cbl, 'm');
    R.fsl = row('Full supply level = CBL + FSD', p.cbl + p.fsd, 'm');
    R.tbl = row('Top of bank level = FSL + free board', R.fsl + p.freeBoard, 'm');
    const cA = area(p.bedWidth, p.sideSlope, p.fsd), cP = perim(p.bedWidth, p.sideSlope, p.fsd);
    R.vCanal = row('Canal velocity (Manning)', ((cA / cP) ** (2 / 3) * Math.sqrt(1 / p.bedFall)) / p.manningN, 'm/s', `n ${p.manningN}, S 1 in ${p.bedFall}`);
    sub('Drain');
    inp('Deep bed level of drain at crossing', p.drainBed, 'm');
    chk('Drain bed below canal FSL -> U.T. is the right structure', p.drainBed < R.fsl, p.drainBed < R.fsl ? 'U.T.' : 'CONSIDER SUPER PASSAGE / AQUEDUCT', 'CBL < drain bed < FSL: U.T. with drop');

    // ---- 2. flood
    sec('2. MAXIMUM FLOOD DISCHARGE');
    if (p.floodMode === 'given') R.Q = inp('Maximum flood discharge (given)', p.mfdGiven, 'cumecs');
    else {
      inp('Catchment area', p.catchment, 'sq.km'); inp("Dicken's constant C", p.dickenC, '', 'CDO guidelines');
      R.Q = row("Q = C x A^0.75 (Dicken's formula)", p.dickenC * p.catchment ** 0.75, 'cumecs');
    }
    const Q = R.Q;

    // ---- 3. ventway & waterway
    sec('3. VENTWAY AND WATERWAY');
    inp('Assumed velocity in the barrel', p.vBarrel, 'm/s');
    R.Areq = row('Area required = Q / V', Q / p.vBarrel, 'sqm');
    inp('Vent size (width x height)', `${fmt(p.ventW, 2)} x ${fmt(p.ventH, 2)}`, 'm');
    R.ventsReq = row('Number of vents required', R.Areq / (p.ventW * p.ventH), 'Nos');
    R.nV = Math.max(1, Math.round(p.nVents));
    inp('Number of vents provided', R.nV, 'Nos');
    chk('Vents provided >= required', R.nV >= Math.ceil(R.ventsReq - 1e-9), `${R.nV} >= ${Math.ceil(R.ventsReq - 1e-9)}`);
    R.Abarrel = R.nV * p.ventW * p.ventH;
    R.vBarrelAct = row('Velocity in the barrel', Q / R.Abarrel, 'm/s');
    R.lacey = row('Lacey waterway P = 4.8 Q^1/2', 4.8 * Math.sqrt(Q), 'm', 'IS 7784 (Pt 1) cl.8.1.2');
    inp('Fluming', p.fluming, '%');
    R.Wclear = R.nV * p.ventW + (R.nV - 1) * p.tMid;
    R.Bf = row('Width of waterway (drain / tail channel bed)', Math.max(ceilTo((p.fluming / 100) * R.lacey, 0.1), R.Wclear), 'm', 'rounded up to 0.1 m; not less than the barrel');
    R.Wout = R.Wclear + 2 * p.tWall;
    R.usLen = row(`U/S transition length (splay ${p.usSplay} : 1)`, (Math.max(R.Bf - R.Wclear, 0) / 2) * p.usSplay, 'm');
    R.dsLen = row(`D/S transition length (splay ${p.dsSplay} : 1)`, (Math.max(R.Bf - R.Wclear, 0) / 2) * p.dsSplay, 'm');

    // ---- 4. levels
    sec('4. LEVELS OF THE BARREL');
    R.boxTop = row('Top of box = CBL - cushion', p.cbl - p.cushion, 'm', `cushion ${fmt(p.cushion, 2)} m below canal bed`);
    R.soffit = row('Soffit of top slab', R.boxTop - p.tTop, 'm');
    R.floorTop = row('Top of bottom slab', R.soffit - p.ventH - p.wcBox, 'm');
    R.sill = row('Sill level (top of wearing coat)', R.floorTop + p.wcBox, 'm');
    R.boxBot = row('Bottom of box', R.floorTop - p.tBot, 'm');
    R.dropH = row('Height of drop = drain bed - sill', p.drainBed - R.sill, 'm');
    chk('Drain bed above sill (drop possible)', R.dropH > 0, fmt(R.dropH, 3));
    R.canalTopW = p.bedWidth + 2 * p.sideSlope * (p.fsd + p.freeBoard);
    R.Lb = row('Length of barrel = canal top width at TBL + banks + 2 x head wall top', R.canalTopW + p.bankWidthL + p.bankWidthR + 2 * p.hwTopW, 'm');
    R.fill = row('Earth fill over box under the banks = TBL - top of box', R.tbl - R.boxTop, 'm');

    // ---- 5. hydraulic calculations
    sec('5. FLOW CONDITIONS AND TOTAL ENERGY LINES');
    const S1 = 1 / p.tailFall;
    const dn = normalDepth(Q, R.Bf, p.drainSideSlope, p.drainN, S1);
    sub('Section 1-1: tail channel (normal flow)');
    row('Normal depth (Manning)', dn, 'm', `B ${fmt(R.Bf, 2)}, side slope ${p.drainSideSlope}:1, n ${p.drainN}, S 1 in ${p.tailFall}`);
    R.dTail = ceilTo(dn, 0.05);
    const s1 = section('1-1', Q, R.Bf, p.drainSideSlope, p.drainN, R.sill, R.dTail);
    row('Depth adopted (rounded up)', s1.d, 'm'); row('Velocity', s1.v, 'm/s'); row('MFL / TEL', `${fmt(s1.mfl)} / ${fmt(s1.tel)}`, 'm');
    const s2 = upstream('2-2', Q, R.Bf, 0, p.nConc, R.sill, s1, p.kTail, 0);
    const s3 = upstream('3-3', Q, R.nV * p.ventW, 0, p.nConc, R.sill, s2, p.kExit, R.dsLen);
    // barrel (Unwin)
    const bP = R.nV * 2 * (p.ventW + p.ventH), bR = R.Abarrel / bP, bV = Q / R.Abarrel, bHv = (bV * bV) / (2 * G);
    const f2 = p.unwinA * (1 + p.unwinB / bR);
    R.hBarrel = (1 + p.barrelF1 + (f2 * R.Lb) / bR) * bHv;
    const tel4 = s3.tel + R.hBarrel;
    const r4 = depthForE(Q, R.nV * p.ventW, 0, tel4 - R.sill);
    const s4 = section('4-4', Q, R.nV * p.ventW, 0, p.nConc, R.sill, r4.d); s4.choked = r4.choked;
    const s5 = upstream('5-5', Q, R.Bf, 0, p.nConc, R.sill, s4, p.kEntry, R.usLen);
    for (const [s, lbl] of [[s2, 'Section 2-2: end of d/s transition (rectangular)'], [s3, 'Section 3-3: barrel exit'], [s4, 'Section 4-4: barrel entry'], [s5, 'Section 5-5: start of u/s transition (cistern)']]) {
      sub(lbl);
      if (s === s4) {
        row('Barrel: A / P / R', `${fmt(R.Abarrel)} / ${fmt(bP)} / ${fmt(bR)}`, '', 'full section');
        row('f1 (entry) / f2 = a (1 + b / R)', `${fmt(p.barrelF1)} / ${fmt(f2, 5)}`, '', `Unwin: a ${p.unwinA}, b ${p.unwinB} (plastered)`);
        row('Loss in barrel h = (1 + f1 + f2 L / R) V^2 / 2g', R.hBarrel, 'm', `L ${fmt(R.Lb, 2)} m, V ${fmt(bV)} m/s`);
      } else row(`Eddy loss (k ${s.k}) + friction (L ${fmt(s.L, 2)} m)`, `${fmt(s.eddy)} + ${fmt(s.fric)}`, 'm');
      row('Depth / velocity', `${fmt(s.d)} / ${fmt(s.v)}`, 'm, m/s');
      row('MFL / TEL', `${fmt(s.mfl)} / ${fmt(s.tel)}`, 'm');
    }
    chk('Flow in the barrel stays free (depth at entry <= vent height)', s4.d <= p.ventH, `${fmt(s4.d)} <= ${fmt(p.ventH, 2)}`);
    if ([s2, s3, s4, s5].some((s) => s.choked)) warnings.push('Critical flow reached in a transition / barrel section: increase vent width or number of vents.');
    // drop crest
    sub('Section 6-6: drop crest');
    R.crest = p.drainBed;
    const free = s5.mfl < R.crest;
    let d6, Bc = 0.6;
    const sarda = (H) => 1.835 * R.Bf * H ** 1.5 * (H / Bc) ** (1 / 6);
    const solveH = (fn) => { let lo = 1e-4, hi = 10; for (let i = 0; i < 100; i++) { const h = (lo + hi) / 2; if (fn(h) > Q) hi = h; else lo = h; } return (lo + hi) / 2; };
    for (let it = 0; it < 5; it++) {
      if (p.crestDepth > 0) d6 = p.crestDepth;
      else if (free) d6 = solveH(sarda);
      else { const H2 = s5.mfl - R.crest; d6 = solveH((h) => (h <= H2 ? 0 : sarda(h) * (1 - (H2 / h) ** 1.5) ** 0.385)); }
      Bc = Math.max(0.5, ceilTo(d6 / Math.sqrt(p.rhoConc), 0.1));
    }
    const s6 = section('6-6', Q, R.Bf, 0, p.drainN, R.crest, d6);
    row('Flow over the drop', free ? 'Free fall' : 'Drowned', '', free ? `d/s level ${fmt(s5.mfl)} below crest ${fmt(R.crest)}` : 'Villemonte submergence');
    row(p.crestDepth > 0 ? 'Depth over crest (given)' : 'Depth over crest: Q = 1.835 L H^1.5 (H / B)^1/6', d6, 'm', p.crestDepth > 0 ? 'e.g. from Malikpur curves' : `Sarda-type crest, L ${fmt(R.Bf, 2)}, B ${fmt(Bc, 2)} m`);
    row('MFL / TEL', `${fmt(s6.mfl)} / ${fmt(s6.tel)}`, 'm');
    const s7 = upstream('7-7', Q, R.Bf, p.drainSideSlope, p.drainN, R.crest, s6, p.kApproach, 0);
    sub('Section 7-7: approach channel');
    row('Depth / velocity', `${fmt(s7.d)} / ${fmt(s7.v)}`, 'm, m/s');
    R.mflUs = row('U/S MFL / TEL', s7.mfl, 'm', `TEL ${fmt(s7.tel)}`);
    chk('U/S MFL below canal top of bank', s7.mfl <= R.tbl, `${fmt(s7.mfl)} <= ${fmt(R.tbl)}`);
    R.secs = [s1, s2, s3, s4, s5, s6, s7];
    R.free = free;

    // ---- 6. drop wall & cistern
    sec('6. DROP WALL AND CISTERN');
    const rho = p.rhoConc, h = R.dropH, dc = d6;
    row('Max depth of flow over drop d', dc, 'm'); row('Height of drop H', h, 'm');
    R.dropTopReq = row('Top width = d / rho^0.5', dc / Math.sqrt(rho), 'm');
    R.dropTop = row('Top width provided', Math.max(0.5, ceilTo(R.dropTopReq, 0.1)), 'm');
    R.dropBaseReq = row('Base width = (H + d + x + w.c) / rho^0.5', (h + dc + p.floorWc) / Math.sqrt(rho), 'm', `cistern depth x = 0, w.c ${p.floorWc} m`);
    R.dropBase = row('Base width provided', Math.max(R.dropTop, ceilTo(R.dropBaseReq, 0.1)), 'm');
    R.cisternReq = row('Length of floor L1 = 2 d + 2 (d H)^1/2', 2 * dc + 2 * Math.sqrt(dc * h), 'm');
    R.cistern = row('Length of floor provided', ceilTo(Math.max(R.cisternReq, p.cistern || 0), 0.1), 'm');
    R.apronReq = row('Floor thickness t = 0.55 (d + H)^1/2', 0.55 * Math.sqrt(dc + h), 'm', 'including 0.15 m wearing coat');
    R.apronT = row('Floor thickness provided', ceilTo(R.apronReq, 0.1), 'm');
    R.usFloor = row('Length of u/s floor (cistern) = max(transition, L1)', Math.max(R.usLen, R.cistern), 'm', R.usLen >= R.cistern - 1e-6 ? 'cistern within the u/s transition' : 'straight cistern added ahead of the transition');

    // ---- 7. scour
    sec('7. SCOUR DEPTH AND CUT-OFFS');
    inp('Silt factor f', p.siltFactor);
    R.q = row('q = Q / waterway width', Q / R.Bf, 'cumecs/m');
    R.dScour = row('Normal scour depth d = 1.35 (q^2 / f)^1/3', 1.35 * ((R.q * R.q) / p.siltFactor) ** (1 / 3), 'm');
    R.scourUs = row('U/S max scour level = U/S MFL - 1.5 d', s7.mfl - 1.5 * R.dScour, 'm');
    R.scourDs = row('D/S max scour level = tail MFL - 2.0 d', s1.mfl - 2 * R.dScour, 'm');
    R.cutUs = row('U/S cut-off wall bottom (u/s end of approach floor)', Math.min(floorTo(R.scourUs, 0.05), p.drainBed - p.dsFloorT - 0.3), 'm', 'at or below the scour level');
    R.cutDs = row('D/S cut-off wall bottom (d/s end of transition floor)', Math.min(floorTo(R.scourDs, 0.05), R.sill - p.dsFloorT - 0.3), 'm', 'at or below the scour level');

    // ---- 8. live load
    sec('8. LIVE LOAD ON THE BOX UNDER THE BANKS');
    const hF = R.fill, kd = p.llDisp;
    R.ll = 0;
    if (p.llBank === 'none') row('Live load on the bank', 'None', '', 'no road on the bank');
    else {
      const cands = [];
      if (p.llBank === 'A' || p.llBank === 'both') {
        const a = 0.25 + 1.2 + 2 * kd * hF, b = 0.5 + 1.8 + 2 * kd * hF;
        cands.push(['IRC Class A (2 axles 11.4 t @ 1.2 m, wheels @ 1.8 m)', 22.8, a, b]);
      }
      if (p.llBank === '70R' || p.llBank === 'both') {
        const a = 4.57 + 2 * kd * hF, b = 2.06 + 0.84 + 2 * kd * hF;
        cands.push(['IRC Class 70R tracked (70 t, 4.57 x 0.84 m tracks @ 2.06 m)', 70, a, b]);
      }
      for (const [n, W, a, b] of cands) {
        sub(n);
        row('Dispersion length x width at top of box', `${fmt(a, 2)} x ${fmt(b, 2)}`, 'm', `through ${fmt(hF, 2)} m fill at ${kd} : 1`);
        const w = row('Intensity = W (1 + impact) / area', (W * (1 + p.llImpact)) / (a * b), 't/sqm', `impact ${p.llImpact}`);
        R.ll = Math.max(R.ll, w);
      }
      row('Live load intensity adopted', R.ll, 't/sqm');
      row('Live load surcharge on walls (equivalent fill)', p.surcharge, 'm', 'IRC 6 cl.214.1.1.3');
    }

    // ---- 9. box analysis
    sec('9. STRUCTURAL ANALYSIS OF THE BOX (per metre length)');
    const Ka = p.kMode === 'rest' ? 1 - Math.sin((p.phi * Math.PI) / 180) : (1 - Math.sin((p.phi * Math.PI) / 180)) / (1 + Math.sin((p.phi * Math.PI) / 180));
    R.K = row(p.kMode === 'rest' ? 'Earth pressure coefficient K0 = 1 - sin phi' : 'Earth pressure coefficient Ka (Rankine)', Ka, '', `phi ${p.phi} deg`);
    const hC = p.ventH + p.wcBox + (p.tTop + p.tBot) / 2; // centre-line height
    // wall centre lines
    const xs = [];
    { let x = 0; xs.push(0); for (let i = 1; i <= R.nV; i++) { const tl = i === 1 ? p.tWall : p.tMid, tr = i === R.nV ? p.tWall : p.tMid; x += tl / 2 + p.ventW + tr / 2; xs.push(x); } }
    R.hC = row('Centre-line height of frame', hC, 'm'); R.LcTot = row('Centre-line width of frame', xs[xs.length - 1], 'm');
    const yTopNode = R.boxTop - p.tTop / 2, yBotNode = R.boxBot + p.tBot / 2;
    const cases = [];
    const mk = (name, o) => cases.push(Object.assign({ name }, o));
    mk('Under canal: box empty, canal empty', { zone: 'canal', boxFull: false, canalFull: false });
    mk('Under canal: box full, canal empty', { zone: 'canal', boxFull: true, canalFull: false });
    mk('Under canal: box empty, canal full', { zone: 'canal', boxFull: false, canalFull: true });
    mk('Under canal: box full, canal full', { zone: 'canal', boxFull: true, canalFull: true });
    mk('Under bank: box empty', { zone: 'bank', boxFull: false });
    mk('Under bank: box full', { zone: 'bank', boxFull: true });
    const gw = 1.0;
    for (const c of cases) {
      const nodes = [], members = [], nl = [];
      const nn = xs.length;
      for (const x of xs) nodes.push({ x, y: 0 });
      for (const x of xs) nodes.push({ x, y: hC });
      const top = (i) => nn + i;
      const Itop = p.tTop ** 3, Ibot = p.tBot ** 3;
      // vertical loads (t/sqm, downward +)
      let qTop = p.gammaRcc * p.tTop, surf, gSoil;
      if (c.zone === 'canal') {
        qTop += p.gammaConc * p.sealing;
        if (c.canalFull) qTop += gw * (R.fsl - R.boxTop);
        surf = p.cbl; gSoil = c.canalFull ? p.gammaSub : p.gammaSoil;
      } else {
        qTop += p.gammaSoil * R.fill + R.ll;
        surf = R.tbl; gSoil = p.gammaSoil;
      }
      c.qTop = qTop;
      const G0 = c.boxFull ? gw * p.surchargeHead : 0; // pressure at soffit when surcharged
      c.G = G0;
      // top slab members (local +y = up for left->right members): load down => negative; internal upward pressure G
      for (let i = 0; i < nn - 1; i++) members.push({ i: top(i), j: top(i + 1), I: Itop, w1: -qTop + G0, w2: -qTop + G0, kind: 'top', inside: [0, -1] });
      // bottom slab members, soil reaction set later; internal water down
      const Dw = c.boxFull ? gw * (p.ventH + p.surchargeHead) : 0;
      c.D = Dw;
      for (let i = 0; i < nn - 1; i++) members.push({ i, j: i + 1, I: Ibot, w1: -Dw, w2: -Dw, kind: 'bottom', inside: [0, 1] });
      // walls: members bottom -> top; local +y = (-1, 0) (points left)
      const ext = (y) => { // outside lateral pressure at node height y (centre-line frame coord)
        const lvl = yBotNode + y;
        let pr = Ka * gSoil * Math.max(surf - lvl, 0);
        if (c.zone === 'canal' && c.canalFull) pr += gw * Math.max(R.fsl - lvl, 0);
        if (c.zone === 'bank' && R.ll > 0 && yes(p.wallSurcharge)) pr += Ka * p.gammaSoil * p.surcharge;
        return pr;
      };
      const inn = (y) => (c.boxFull ? gw * Math.max(p.surchargeHead + (hC - y), 0) : 0);
      c.E = [ext(hC), ext(0)]; c.C = [inn(hC), inn(0)];
      for (let i = 0; i < nn; i++) {
        const tw = i === 0 || i === nn - 1 ? p.tWall : p.tMid;
        const Iw = tw ** 3;
        let w1 = 0, w2 = 0;
        if (i === 0) { w1 = ext(0) - inn(0); w2 = ext(hC) - inn(hC); w1 = -w1; w2 = -w2; } // outside pushes +x = local -y
        else if (i === nn - 1) { w1 = ext(0) - inn(0); w2 = ext(hC) - inn(hC); } // outside pushes -x = local +y
        members.push({ i, j: top(i), I: Iw, w1, w2, kind: i === 0 || i === nn - 1 ? 'wall' : 'mid', inside: i === 0 ? [1, 0] : i === nn - 1 ? [-1, 0] : [1, 0] });
        // wall self weight as nodal loads
        const Ww = p.gammaRcc * tw * (p.ventH + p.wcBox);
        nl.push([i, [0, -Ww / 2, 0]]); nl.push([top(i), [0, -Ww / 2, 0]]);
      }
      // top load on half-wall overhangs
      nl.push([top(0), [0, -qTop * p.tWall / 2, 0]]); nl.push([top(nn - 1), [0, -qTop * p.tWall / 2, 0]]);
      // soil reaction balancing all vertical loads except bottom slab weight & w.c. (they bear directly)
      let down = qTop * R.Wout;
      for (let i = 0; i < nn; i++) down += p.gammaRcc * (i === 0 || i === nn - 1 ? p.tWall : p.tMid) * (p.ventH + p.wcBox);
      const water = c.boxFull ? gw * p.ventH * R.Wclear : 0;
      down += water;
      const qb = down / R.Wout;
      c.B = qb; c.water = water;
      // net on bottom members: +qb (up) - Dw ; uniform internal pressure G on top & bottom cancels in total
      for (const m of members) if (m.kind === 'bottom') { m.w1 += qb; m.w2 += qb; }
      // internal pressure G on the top slab is balanced by G on the bottom (in Dw);
      // make vertical equilibrium exact with the residual on the bottom members
      let sumFy = 0;
      for (const m of members) { const L = Math.hypot(nodes[m.j].x - nodes[m.i].x, nodes[m.j].y - nodes[m.i].y); const fy = ((m.w1 + m.w2) / 2) * L; if (m.kind === 'top' || m.kind === 'bottom') sumFy += fy; }
      for (const [, f] of nl) sumFy += f[1];
      sumFy += qb * p.tWall; // outer overhang reactions (applied as nodal below)
      nl.push([0, [0, qb * p.tWall / 2, 0]]); nl.push([nn - 1, [0, qb * p.tWall / 2, 0]]);
      if (Math.abs(sumFy) > 1e-9) { const corr = -sumFy / xs[nn - 1]; for (const m of members) if (m.kind === 'bottom') { m.w1 += corr; m.w2 += corr; } c.B += corr; }
      solveFrame(nodes, members, nl, [0, 1, (nn - 1) * 3 + 1]);
      c.members = members;
      c.basePressure = (down + p.gammaRcc * p.tBot * R.Wout + p.gammaConc * p.wcBox * R.Wclear) / R.Wout;
    }
    for (const c of cases) {
      sub(c.name);
      row('Load on top slab A', c.qTop, 't/sqm');
      row('Net upward soil reaction B', c.B, 't/sqm');
      if (c.D) row('Water load on bottom slab D / upward thrust on top slab G', `${fmt(c.D)} / ${fmt(c.G)}`, 't/sqm');
      row('Outside pressure on walls at top / bottom node', `${fmt(c.E[0])} / ${fmt(c.E[1])}`, 't/sqm');
      if (c.boxFull) row('Inside water pressure at top / bottom node', `${fmt(c.C[0])} / ${fmt(c.C[1])}`, 't/sqm');
    }
    R.cases = cases;

    // ---- envelopes per member group and face
    const groups = { top: 'Top slab', bottom: 'Bottom slab', wall: 'End walls', mid: 'Middle walls' };
    const thickOf = (k) => ({ top: p.tTop, bottom: p.tBot, wall: p.tWall, mid: p.tMid })[k];
    const env = {};
    for (const zone of ['canal', 'bank']) {
      for (const k of Object.keys(groups)) {
        const e = { inner: { M: 0, N: 0 }, outer: { M: 0, N: 0 }, V: 0, Nmax: 0 };
        for (const c of cases.filter((x) => x.zone === zone)) {
          for (const m of c.members.filter((x) => x.kind === k)) {
            for (let s = 0; s <= 20; s++) {
              const x = (m.L * s) / 20, M = m.M(x);
              // tension on local -y if M > 0; local y = (-s, c)
              const ly = [-m.s, m.c];
              const tens = M >= 0 ? [-ly[0], -ly[1]] : ly;
              const face = k === 'mid' ? 'inner' : tens[0] * m.inside[0] + tens[1] * m.inside[1] > 0 ? 'inner' : 'outer';
              if (Math.abs(M) > e[face].M) { e[face].M = Math.abs(M); e[face].N = Math.max(m.N, 0); }
            }
            // shear at the critical section: effective depth beyond the face of the support
            const tS = k === 'top' || k === 'bottom' ? p.tWall : Math.max(p.tTop, p.tBot);
            const xc = Math.min(m.L / 2, tS / 2 + thickOf(k) - p.cover - 0.008);
            e.V = Math.max(e.V, Math.abs(m.V(xc)), Math.abs(m.V(m.L - xc)));
            e.Nmax = Math.max(e.Nmax, m.N);
          }
        }
        env[zone + ':' + k] = e;
      }
    }
    R.env = env;
    sec('10. DESIGN OF BOX MEMBERS (WSM, IRC 21)');
    const kk = (p.modRatio * p.scbc) / (p.modRatio * p.scbc + p.sst), jj = 1 - kk / 3;
    row('Concrete / steel', `M${p.fck} / Fe${p.fy}`, '', `scbc ${p.scbc}, sst ${p.sst} N/sqmm, m ${p.modRatio}`);
    row('k / j / Q', `${fmt(kk)} / ${fmt(jj)} / ${fmt(0.5 * p.scbc * kk * jj, 4)}`, '', 'Q in N/sqmm');
    inp('Clear cover', p.cover * 1000, 'mm');
    const kinds = R.nV > 1 ? ['top', 'bottom', 'wall', 'mid'] : ['top', 'bottom', 'wall'];
    const thick = { top: p.tTop, bottom: p.tBot, wall: p.tWall, mid: p.tMid };
    R.members = {};
    let allMem = true;
    for (const k of kinds) {
      const faces = k === 'mid' ? ['inner'] : ['outer', 'inner'];
      const res = {};
      for (const f of faces) {
        const zc = env['canal:' + k][f], zb = env['bank:' + k][f];
        const gz = zb.M >= zc.M ? zb : zc;
        const V = Math.max(env['canal:' + k].V, env['bank:' + k].V);
        const faceName = k === 'mid' ? 'both faces' : f === 'outer' ? (k === 'top' ? 'top face (outer, at supports)' : k === 'bottom' ? 'bottom face (outer, at supports)' : 'outer face') : (k === 'top' ? 'bottom face (inner, mid-span)' : k === 'bottom' ? 'top face (inner, mid-span)' : 'inner face');
        const d = memberDesign(p, gz.M, gz.N, V, thick[k], `${groups[k]} - ${faceName}`);
        d.Mcanal = zc.M; d.Mbank = zb.M;
        res[f] = d;
        sub(`${groups[k]} (${fmt(thick[k] * 1000, 0)} thick) - ${faceName}`);
        row('Max moment under canal / under bank', `${fmt(zc.M)} / ${fmt(zb.M)}`, 't-m');
        row('Design moment incl. axial N (d - D/2)', d.Ms, 't-m', `N = ${fmt(gz.N)} t`);
        chk('Effective depth required <= provided', d.okD, `${fmt(d.dReq, 0)} <= ${fmt(d.d, 0)} mm`);
        row('Ast = Ms / (sst j d) - N / sst (min 0.12 %)', d.AstReq, 'sqmm/m');
        chk(`Provide ${d.dia} dia @ ${d.sp} c/c`, d.okAst, `${fmt(d.prov, 0)} sqmm/m`);
        chk('Shear tv <= tc', d.okShear, `${fmt(d.tv)} <= ${fmt(d.tc)} N/sqmm`, `V = ${fmt(V)} t at d from the face of support`);
        allMem = allMem && d.ok;
      }
      R.members[k] = res;
    }
    R.distAst = 0.0012 * 1000 * Math.max(p.tTop, p.tBot, p.tWall) * 1000;
    R.distSp = Math.min(300, Math.floor((1000 * Math.PI * 25) / R.distAst / 10) * 10);
    row('Distribution steel each face (0.12 %)', `10 dia @ ${R.distSp} c/c`, '', `${fmt(R.distAst, 0)} sqmm/m`);
    row('Haunch bars', `${R.members.top.outer.dia >= 12 ? 12 : 10} dia @ ${R.members.top.outer.sp} c/c`, '', `${fmt(p.haunch * 1000, 0)} x ${fmt(p.haunch * 1000, 0)} haunches`);
    R.okMembers = allMem;
    sub('Base pressure');
    R.basePress = Math.max(...cases.map((c) => c.basePressure));
    chk('Max base pressure <= SBC', R.basePress <= p.sbc, `${fmt(R.basePress, 2)} <= ${fmt(p.sbc, 1)} t/sqm`);

    // ---- 11. head wall
    sec('11. HEAD WALLS (on the box, retaining the bank)');
    const hwH = R.fill;
    const allow = p.subAllow;
    const hwO = { H: hwH, a: p.hwTopW, fb: p.hwFrontBatter, rb: p.hwRearBatter, toe: 0, heel: 0, tf: 0, K: Ka, gs: p.gammaSoil, gc: p.gammaConc, hs: p.llBank === 'none' || !yes(p.wallSurcharge) ? 0 : p.surcharge, mu: 0.6, sbc: allow, allow };
    let hw = gravityWall(hwO);
    if (yes(p.wallAuto)) {
      for (let rb = 0.3; rb <= 8; rb = +(rb + 0.1).toFixed(2)) {
        const w = gravityWall(Object.assign({}, hwO, { rb }));
        if (w.stem.ok && w.stem.MR / w.stem.MO >= 2 && (0.6 * w.stem.V) / w.stem.H >= 1.5) { hw = w; break; }
      }
    }
    R.hw = hw; R.hwRearBatter = hw.rb;
    row('Height (TBL - top of box)', hwH, 'm'); row('Top / base width', `${fmt(p.hwTopW, 2)} / ${fmt(hw.b, 2)}`, 'm', `front batter ${p.hwFrontBatter}, rear batter ${fmt(hw.rb, 2)}${yes(p.wallAuto) ? ' (auto)' : ''}`);
    row('Sum V / Sum H', `${fmt(hw.stem.V)} / ${fmt(hw.stem.H)}`, 't');
    chk('Eccentricity <= b/6 (no tension)', hw.stem.e <= hw.stem.lim + 1e-9, `${fmt(hw.stem.e)} <= ${fmt(hw.stem.lim)} m`);
    chk('Max stress on box top <= allowable', hw.stem.smax <= allow, `${fmt(hw.stem.smax, 2)} t/sqm`);
    R.okHw = hw.stem.e <= hw.stem.lim + 1e-9 && hw.stem.smax <= allow;
    const hwFosO = hw.stem.MR / hw.stem.MO, hwFosS = (0.6 * hw.stem.V) / hw.stem.H;
    chk('FOS overturning >= 2.0', hwFosO >= 2, fmt(hwFosO, 2));
    chk('FOS sliding (mu 0.6 on concrete) >= 1.5', hwFosS >= 1.5, fmt(hwFosS, 2));
    R.okHw = R.okHw && hwFosO >= 2 && hwFosS >= 1.5;

    // ---- 12. wing & return walls
    sec('12. WING AND RETURN WALLS');
    R.wallTopUs = Math.max(R.tbl, s7.mfl + p.drainFB);
    R.wallTopDs = Math.max(R.tbl, s1.mfl + p.drainFB);
    R.wFdnUs = p.wFdnUs > 0 ? p.wFdnUs : floorTo(Math.min(R.sill - R.apronT, R.scourUs), 0.05);
    R.wFdnDs = p.wFdnDs > 0 ? p.wFdnDs : floorTo(Math.min(R.sill - p.dsFloorT, R.scourDs), 0.05);
    const walls = [['U/S wing & return walls', R.wallTopUs, R.wFdnUs], ['D/S wing & return walls', R.wallTopDs, R.wFdnDs]];
    R.walls = [];
    let okW = true;
    for (const [name, topL, fdn] of walls) {
      sub(name);
      const Hs = topL - fdn - p.wFootT;
      const wo = { H: Hs, a: p.wTopW, fb: p.wFrontBatter, rb: p.wRearBatter, toe: p.wToe, heel: p.wHeel, tf: p.wFootT, K: Ka, gs: p.gammaSoil, gc: p.gammaConc, hs: p.llBank === 'none' || !yes(p.wallSurcharge) ? 0 : p.surcharge, mu: p.mu, sbc: p.sbc, allow };
      const w = (yes(p.wallAuto) && sizeWall(wo)) || gravityWall(wo);
      w.name = name; w.top = topL; w.fdn = fdn;
      R.walls.push(w);
      row('Top of wall / bottom of foundation', `${fmt(topL)} / ${fmt(fdn)}`, 'm', 'top: TBL or MFL + free board; foundation: floor / scour');
      row('Stem height / top / base width', `${fmt(Hs)} / ${fmt(p.wTopW, 2)} / ${fmt(w.b, 2)}`, 'm', `rear batter ${fmt(w.rb, 2)}${yes(p.wallAuto) ? ' (auto: least section)' : ''}`);
      row('Footing width x thickness', `${fmt(w.B, 2)} x ${fmt(p.wFootT, 2)}`, 'm', `toe ${fmt(w.toe, 2)}, heel ${fmt(w.heel, 2)}`);
      chk('Stem: eccentricity <= b/6 (no tension in concrete)', w.stem.e <= w.stem.lim + 1e-9, `${fmt(w.stem.e)} <= ${fmt(w.stem.lim)} m`, `stress ${fmt(w.stem.smax, 2)} / ${fmt(w.stem.smin, 2)} t/sqm`);
      chk('Stem: max compressive stress <= allowable', w.stem.smax <= allow, `${fmt(w.stem.smax, 2)} t/sqm`);
      chk('Base: max pressure <= SBC', w.base.smax <= p.sbc, `${fmt(w.base.smax, 2)} t/sqm`);
      chk('Base: min pressure >= 0', w.base.smin >= -1e-9, `${fmt(w.base.smin, 2)} t/sqm`);
      chk('FOS overturning >= 2.0', w.base.fosO >= 2, fmt(w.base.fosO, 2));
      chk('FOS sliding >= 1.5', w.base.fosS >= 1.5, fmt(w.base.fosS, 2));
      okW = okW && w.ok;
    }
    R.okWalls = okW;

    // ---- 13. summary
    sec('13. SUMMARY');
    row('Barrel', `${R.nV} vent${R.nV > 1 ? 's' : ''} ${fmt(p.ventW, 2)} x ${fmt(p.ventH, 2)} m, length ${fmt(R.Lb, 2)} m`);
    row('Box members', `top ${fmt(p.tTop * 1000, 0)}, bottom ${fmt(p.tBot * 1000, 0)}, walls ${fmt(p.tWall * 1000, 0)}${R.nV > 1 ? `, middle ${fmt(p.tMid * 1000, 0)}` : ''} mm, M${p.fck} / Fe${p.fy}`);
    for (const k of kinds) for (const f of Object.keys(R.members[k])) row(`  ${R.members[k][f].label}`, `${R.members[k][f].dia} dia @ ${R.members[k][f].sp}`);
    row('Levels', `top of box +${fmt(R.boxTop)}, sill +${fmt(R.sill)}, drop crest +${fmt(R.crest)}`);
    row('Drop wall', `top ${fmt(R.dropTop, 2)} / base ${fmt(R.dropBase, 2)} m; cistern ${fmt(R.cistern, 2)} m x ${fmt(R.apronT, 2)} m thick`);
    row('Cut-offs', `u/s +${fmt(R.cutUs)}, d/s +${fmt(R.cutDs)}`);
    row('Water levels', `u/s MFL +${fmt(s7.mfl)}, tail MFL +${fmt(s1.mfl)}`);

    R.allOk = sections.every((s) => s.rows.every((r) => !r.check || r.ok));
    if (!R.okMembers) warnings.push('Box members fail: increase member thickness (Auto design sizes them).');
    if (!R.okWalls || !R.okHw) warnings.push('Gravity walls fail: increase the rear batter / base width (Auto design sizes them).');
    if (R.mflUs > R.tbl) warnings.push('The drain flood heads up above the canal bank: widen the waterway (less fluming), add vents, or raise the banks near the crossing.');
    if (R.walls.some((w) => w.Ht > 6)) warnings.push('Wing / return walls exceed 6 m in height: plain concrete gravity walls become uneconomical - consider RCC cantilever / counterfort walls (design separately).');
    if (R.vBarrelAct > 3.0 + 1e-6) warnings.push('Barrel velocity exceeds 3 m/s: add vents or enlarge the vent.');
    if (R.vBarrelAct < 0.6) warnings.push('Barrel velocity below 0.6 m/s: silting likely, consider a smaller vent.');
    R.scope = `Construction of ${R.nV} vent U.T. of ${fmt(p.ventW, 2)} x ${fmt(p.ventH, 2)} m, barrel length ${fmt(R.Lb, 2)} m, across ${p.canalName} at Km ${p.chainage}`;
    return { p, R, sections, warnings };
  }

  // ------------------------------------------------------------ auto design
  function autoDesign(input) {
    const p = Object.assign({}, UT_DEFAULTS, input, { boxAuto: 'yes', wallAuto: 'yes' });
    const log = [];
    let r = design(p);
    let n = Math.max(1, Math.ceil(r.R.ventsReq - 1e-9));
    p.nVents = n; r = design(p);
    // barrel must flow free: raise the vent (to 3 m) and then add vents
    for (let it = 0; it < 40 && r.R.secs[3].d > p.ventH; it++) {
      if (p.ventH < 3 - 1e-9) p.ventH = +(p.ventH + 0.25).toFixed(2); else p.nVents = ++n;
      r = design(p);
      const need = Math.max(1, Math.ceil(r.R.ventsReq - 1e-9));
      if (need > n) { p.nVents = n = need; r = design(p); }
    }
    // flood must stay below the canal bank: widen the waterway (less fluming)
    for (let it = 0; it < 12 && r.R.mflUs > r.R.tbl && p.fluming < 100; it++) { p.fluming = Math.min(100, p.fluming + 10); r = design(p); }
    if (p.fluming !== (input.fluming ?? UT_DEFAULTS.fluming)) log.push(`fluming ${p.fluming} %`);
    log.push(`${n} vent${n > 1 ? 's' : ''} ${fmt(p.ventW, 2)} x ${fmt(p.ventH, 2)} m`);
    Object.assign(p, { tTop: r.p.tTop, tBot: r.p.tBot, tWall: r.p.tWall, tMid: r.p.tMid });
    log.push(`box top / bottom / walls ${Math.round(p.tTop * 1000)} / ${Math.round(p.tBot * 1000)} / ${Math.round(p.tWall * 1000)} mm`);
    p.hwRearBatter = r.R.hwRearBatter;
    const w = r.R.walls.reduce((a, b) => (b.B > a.B ? b : a));
    Object.assign(p, { wRearBatter: w.rb, wToe: w.toe, wHeel: w.heel });
    log.push(`head wall rear batter ${fmt(p.hwRearBatter, 2)} m`, `wing walls base ${fmt(w.b, 2)} m on ${fmt(w.B, 2)} m footing`);
    return { input: p, result: design(p), log };
  }

  Object.assign(BD, { UT_DEFAULTS, utDesign: design, utCore: core, utSizeWall: sizeWall, utAutoDesign: autoDesign, utGravityWall: gravityWall, solveFrame });
})(typeof window !== 'undefined' ? window : globalThis);
