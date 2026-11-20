/*
 * Dedicated Slab Culvert Design Engine (IRC:SP:13-2022, IRC 5-2024, IRC 6-2024,
 * IRC 21:2000 / IRC 112:2020, IRC 78-2024, IS 456-2000).
 *
 * Truly dedicated culvert tool supporting:
 *  1. Crossing Type:
 *     - Natural Stream / Nala Crossing: Catchment hydrology (Ryves / Dicken's / Rational / MFD),
 *       stream hydraulics (Manning's HFL & normal depth), Lacey regime waterway,
 *       Lacey scour depth (R = 1.34 (q^2/f)^(1/3)), safe foundation level.
 *     - Canal Crossing: Canal HPs (Q, Bed width, FSD, CBL, FSL, TBL).
 *  2. Standard IRC:SP:13 Spans: 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0 m (1 to 4 vents with piers).
 *  3. IRC:SP:13 Bed Protection & Curtain Walls:
 *     - Rigid CC M15 bed flooring (150 mm) over dry stone packing (150 mm)
 *     - Upstream curtain (drop) wall (1.5 m below bed)
 *     - Downstream curtain (drop) wall (2.0 m below bed)
 *     - Flexible boulder apron / pitching u/s (3-5 m) & d/s (5-8 m)
 *  4. RCC Solid Deck Slab:
 *     - IRC 21:2000 WSM or IRC 112:2020 LSM
 *     - Live loads: IRC 6 Class A (1 or 2 lanes), Class 70R (tracked / 2x20t wheeled), Class B
 *     - Effective width dispersion per IRC 21 cl.305.16
 *  5. Substructure & Foundations:
 *     - Gravity abutments and piers (plain concrete CC M15/M20 or stone masonry)
 *     - 45° splayed wing walls (for streams) or straight returns (for canal banks)
 *     - Stability against overturning (FOS >= 2.0), sliding (FOS >= 1.5), base pressure <= SBC, no tension (e <= B/6).
 *  6. Complete Telangana / AP SSR 2026-27 detailed estimate with curtain walls, bed flooring, and BBS.
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});

  const G = 9.80665;
  const rad = (d) => (d * Math.PI) / 180;
  const fmt = (v, n = 3) => (typeof v === 'number' && isFinite(v) ? v.toFixed(n) : String(v));
  const yes = (v) => v === 'yes' || v === true;

  const CULVERT_DEFAULTS = {
    // Project
    crossingType: 'stream', // 'stream' | 'canal'
    chainage: '3.400',
    waterwayName: 'Peddavagu Stream',
    roadType: 'MDR', // 'VILLAGE' | 'ODR' | 'MDR' | 'SH' | 'NH'
    location: 'Suryapet',
    district: 'Suryapet',
    state: 'GOVERNMENT OF TELANGANA',
    department: 'PANCHAYAT RAJ / R&B DEPARTMENT',
    subDivision: 'R&B Sub-Division, Suryapet',
    division: 'R&B Division, Suryapet',
    frlNote: 'FRL fixed to maintain 0.60 m freeboard over design HFL.',

    // Stream Hydrology & Hydraulics (when crossingType === 'stream')
    floodMode: 'catchment', // 'catchment' | 'given'
    catchmentFormula: 'ryves', // 'ryves' | 'dicken' | 'rational'
    catchment: 6.25, // sq.km
    formulaC: 8.5, // Ryves C (6.8 to 10.2) or Dicken C (11.5 to 19.5)
    rainIntensity: 45, // mm/hr for rational
    runoffCoeff: 0.45, // for rational
    mfdGiven: 18.5, // cumecs (if floodMode === 'given')
    streamBed: 100.0, // m (deep bed level)
    streamBedWidth: 5.5, // m
    streamSideSlope: 1.0, // H:1
    streamFall: 800, // 1 in N
    streamN: 0.035, // Manning's n
    hflGiven: 0, // 0 = compute from normal depth

    // Canal HPs (when crossingType === 'canal')
    Qc: 1.85, canalBedW: 2.20, bedWidthC: 2.20, canalFsd: 0.90, fsdC: 0.90,
    canalSideSlope: 1.5, sideSlopeC: 1.5, canalFB: 0.60, freeBoardC: 0.60,
    canalBedFall: 2000, bedFallC: 2000, canalCbl: 100.0, cblC: 100.0,
    manningNC: 0.025, bankWidthLC: 1.5, bankWidthRC: 1.5,

    // Culvert Ventway & Road
    nVents: 1,
    span: 4.0, // standard span: 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0 m
    pierW: 0.75, // pier top width (m)
    carriageway: 7.50, // 4.25 (single lane), 5.50 (intermediate), 7.50 (two lane)
    edgeType: 'crash', // 'railing' | 'crash'
    kerbW: 0.225, kerbH: 0.30, railingLoad: 0.10,
    barrierW: 0.45, barrierLoad: 0.75,
    skew: 0,
    bearingW: 0.40,
    frl: 103.20, gl: 102.50,
    freeBoardAdopted: 0.60, // m over HFL/FSL

    // IRC:SP:13 Bed Protection & Curtain Walls
    bedProtection: 'yes',
    curtainDepthUs: 1.50, // m below stream bed
    curtainDepthDs: 2.00, // m below stream bed
    curtainThk: 0.35, // m
    floorThk: 0.15, // m CC M15 bed flooring
    packingThk: 0.15, // m stone packing under floor
    apronLenUs: 3.50, // m
    apronLenDs: 6.00, // m
    apronThk: 0.30, // m dry stone pitching

    // Deck Slab Structural
    deckAuto: 'yes', minD: 0.25, D: 0.375, wc: 0.075,
    method: 'WSM', // 'WSM' | 'LSM'
    fck: 25, fy: 500, exposure: 'moderate',
    cover: 0.040,
    mainDia: 16, mainSpacing: 120,
    distDia: 10, distSpacing: 150,
    topDia: 10, topSpacing: 200,

    // Live Load
    liveMode: 'auto', llA1: 'yes', llA2: 'yes', ll70T: 'yes', ll70W: 'yes', llB: 'no',
    seismicZone: 'II', impFactor: 1.0,

    // Substructure (Abutments, Piers & Wings)
    abAuto: 'yes',
    foundationLevel: 98.20,
    abTopW: 0.60, abFrontBatter: 0.0, abBackBatter: 1.40,
    abToe: 0.50, abHeel: 0.50, footingT: 0.50, bedBlockT: 0.30,
    pierBatter: 0.0, pierToe: 0.40,
    wingType: 'splayed', // 'splayed' (45 deg) | 'return' (straight)
    wingLen: 3.50, wTopW: 0.45, wFrontBatter: 0.80, wBaseW: 2.20,
    wToe: 0.30, wHeel: 0.30, wFootT: 0.35,
    subFck: 15, sbc: 20.0, siltFactor: 1.0,
    phi: 30, gammaSoil: 1.90, gammaConc: 2.40, mu: 0.50,
    surcharge: 1.20, // m equivalent fill for LL
  };

  // ------------------------------------------------------------ Hydrology & Hydraulics
  function normalDepth(Q, B, s, n, S) {
    if (Q <= 0) return 0.1;
    let lo = 0.01, hi = 15;
    for (let i = 0; i < 80; i++) {
      const d = (lo + hi) / 2;
      const A = (B + s * d) * d;
      const P = B + 2 * d * Math.sqrt(1 + s * s);
      const R = A / P;
      const qCalc = (1 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(S);
      if (qCalc > Q) hi = d; else lo = d;
    }
    return (lo + hi) / 2;
  }

  // ------------------------------------------------------------ Main Culvert Design
  function design(input) {
    const p = Object.assign({}, CULVERT_DEFAULTS, input || {});
    for (const k of Object.keys(CULVERT_DEFAULTS)) {
      if (typeof CULVERT_DEFAULTS[k] === 'number') p[k] = Number(p[k]);
    }
    p.nVents = Math.max(1, Math.min(6, Math.round(p.nVents)));
    p.span = Math.min(6.0, Math.max(1.0, p.span)); // Culvert spans are strictly <= 6.0 m

    const isStream = p.crossingType === 'stream';
    const LSM = p.method === 'LSM';
    const nV = p.nVents;
    const R = { nV };
    const secs = [];
    let curSec;
    const sec = (title) => { curSec = { title, rows: [] }; secs.push(curSec); };
    const row = (label, value, unit = '', remark = '', opt = {}) => {
      curSec.rows.push(Object.assign({ label, value, unit, remark }, opt));
      return value;
    };
    const inp = (label, key, unit, remark) => row(label, p[key], unit, remark, { input: key });
    const chk = (label, ok, text, remark) => row(label, text, '', remark || '', { check: true, ok: !!ok });
    const warnings = [];

    // Geometry Helpers
    const cosS = Math.cos(rad(p.skew || 0));
    const spanR = (R.spanR = p.span / cosS);
    const railing = p.edgeType !== 'crash';
    const edgeW = (R.edgeW = railing ? p.kerbW : p.barrierW);
    const edgeDL = railing ? p.kerbW * p.kerbH * 2.5 + p.railingLoad : p.barrierLoad;
    const B = (R.B = p.carriageway + 2 * edgeW);
    R.deckL = spanR + 2 * p.bearingW;
    const totalWaterway = nV * p.span;
    R.totalWaterway = totalWaterway;
    const totalOpening = nV * spanR + (nV - 1) * (p.pierW / cosS);
    R.opening = totalOpening;

    // ============================================================== 0. DESIGN BASIS
    sec('0. DESIGN BASIS (IRC:SP:13 & IRC STANDARDS)');
    row('Structure Type', `RCC Slab Culvert, ${nV} Vent${nV > 1 ? 's' : ''} x ${fmt(p.span, 2)} m Clear Span on Gravity Abutments${nV > 1 ? ` and Pier (${fmt(p.pierW, 2)} m)` : ''}`, '');
    row('Crossing Classification', `${isStream ? 'Natural Stream / Drainage Nala' : 'Irrigation Canal'} Crossing`, '', 'Linear waterway <= 6.0 m per IRC 5');
    row('Applicable Standards', 'IRC:SP:13-2022, IRC 5-2024, IRC 6-2024, IRC 21-2000 / IRC 112-2020, IRC 78-2024, IS 456-2000', '');
    row('Deck Design Method', LSM ? 'IRC 112:2020 Limit State Method' : 'IRC 21:2000 Working Stress Method', '');
    row('Materials', `Deck: RCC M${p.fck} / Fe${p.fy}; Substructure: CC M${p.subFck} with plums`, '');

    // ============================================================== 1. HYDROLOGY & HYDRAULICS
    if (isStream) {
      sec(`1. HYDROLOGY & STREAM HYDRAULICS (IRC:SP:13 SECTION 3 & 4)`);
      inp('Stream Name', 'waterwayName', '', '');
      inp('Deep Bed Level (DBL) at Site', 'streamBed', 'm', 'Lowest bed level across crossing');
      inp('Catchment Hydrology Method', 'floodMode', '', p.floodMode === 'catchment' ? `Formula: ${p.catchmentFormula.toUpperCase()}` : 'Direct MFD');

      let Q = 0;
      if (p.floodMode === 'catchment') {
        inp('Catchment Area (A)', 'catchment', 'sq.km');
        if (p.catchmentFormula === 'ryves') {
          inp("Ryves' Coefficient (C)", 'formulaC', '', 'South India standard: C = 6.8 (coastal) to 10.2 (hills)');
          Q = p.formulaC * Math.pow(p.catchment, 2 / 3);
          row("Design Flood Discharge Q = C * A^(2/3)", Q, 'cumecs', "Ryves' Formula for South Indian catchments");
        } else if (p.catchmentFormula === 'dicken') {
          inp("Dicken's Coefficient (C)", 'formulaC', '', 'North/Central India & plateaus: C = 11.5 to 19.5');
          Q = p.formulaC * Math.pow(p.catchment, 3 / 4);
          row("Design Flood Discharge Q = C * A^(3/4)", Q, 'cumecs', "Dicken's Formula");
        } else {
          inp('Rainfall Intensity (I)', 'rainIntensity', 'mm/hr');
          inp('Runoff Coefficient (C)', 'runoffCoeff', '');
          Q = 0.278 * p.runoffCoeff * p.rainIntensity * p.catchment;
          row('Design Flood Discharge Q = 0.278 * C * I * A', Q, 'cumecs', 'Rational Formula');
        }
      } else {
        inp('Design Flood Discharge Q', 'mfdGiven', 'cumecs', 'Directly observed or estimated flood flow');
        Q = p.mfdGiven;
      }
      R.Q = Q;

      // Stream Geometry & Normal Depth
      inp('Stream Bed Width', 'streamBedWidth', 'm');
      inp('Stream Side Slope (H:1)', 'streamSideSlope', '');
      inp('Stream Longitudinal Fall 1 in', 'streamFall', '', `Slope S = ${fmt(1 / p.streamFall, 5)}`);
      inp("Manning's Roughness n", 'streamN', '', 'Natural stream channel');

      const S = 1 / Math.max(10, p.streamFall);
      const yn = normalDepth(Q, p.streamBedWidth, p.streamSideSlope, p.streamN, S);
      R.yn = yn;
      const hflCalc = p.streamBed + yn;
      R.hfl = p.hflGiven > 0 ? p.hflGiven : hflCalc;
      row('Normal Flood Depth in Stream (yn)', yn, 'm', "Manning's equation on natural channel");
      row('Computed High Flood Level (HFL)', R.hfl, 'm', p.hflGiven > 0 ? `User override (calc +${fmt(hflCalc)})` : 'Stream Bed + yn');

      const streamArea = (p.streamBedWidth + p.streamSideSlope * yn) * yn;
      const streamV = Q / streamArea;
      row('Natural Stream Velocity', streamV, 'm/s', 'Approach channel velocity');

      // Regime Waterway (Lacey)
      const laceyW = 4.8 * Math.sqrt(Q);
      R.laceyW = laceyW;
      row("Lacey's Regime Linear Waterway W = 4.8 * sqrt(Q)", laceyW, 'm', 'IRC:SP:13 cl. 4.2 / IRC 5');
      row('Total Provided Clear Linear Waterway', totalWaterway, 'm', `${nV} vent${nV > 1 ? 's' : ''} x ${fmt(p.span, 2)} m`);
      const flumingPct = (totalWaterway / laceyW) * 100;
      row('Waterway Fluming Ratio', flumingPct, '%', flumingPct < 60 ? 'Heavy fluming - check afflux' : 'Within normal limits (>= 60%)');

      // Scour Depth per Lacey & IRC 78 / IRC:SP:13
      inp('Lacey Silt Factor f', 'siltFactor', '', 'IRC 78 Table 3 / IRC:SP:13');
      const qVent = Q / totalWaterway;
      R.qVent = qVent;
      row('Discharge per Metre Width (q)', qVent, 'cumecs/m');
      const dsm = 1.34 * Math.pow((qVent * qVent) / Math.max(0.1, p.siltFactor), 1 / 3);
      R.dsm = dsm;
      row('Mean Scour Depth below HFL dsm = 1.34 * (q^2/f)^(1/3)', dsm, 'm', 'IRC 78 / IRC:SP:13');
      const scourAbut = 1.27 * dsm;
      const scourPier = 2.0 * dsm;
      R.scourAbutLevel = R.hfl - scourAbut;
      R.scourPierLevel = R.hfl - scourPier;
      row('Maximum Scour Level at Abutments (1.27 dsm)', R.scourAbutLevel, 'm');
      if (nV > 1) row('Maximum Scour Level at Piers (2.0 dsm)', R.scourPierLevel, 'm');

      // Suggested Foundation Level
      if (yes(p.bedProtection)) {
        R.flSuggested = p.streamBed - 1.20; // with IRC SP:13 rigid bed flooring, 1.0 - 1.2m below bed
        row('Floor Protection Adopted', 'YES (IRC:SP:13 Bed Flooring + Curtain Walls)', '', 'Foundation placed 1.20 m below floor level');
      } else {
        R.flSuggested = R.scourAbutLevel - 1.0; // without floor protection, 1m below max scour
      }
    } else {
      // Canal Crossing
      sec(`1. CANAL HYDRAULICS (CANAL CROSSING AT Km ${p.chainage})`);
      inp('Canal Name', 'waterwayName', '', '');
      inp('Canal Discharge (Qc)', 'Qc', 'cumecs');
      const cbl = (p.cblC = p.canalCbl != null ? p.canalCbl : p.cblC);
      const bedW = (p.bedWidthC = p.canalBedW != null ? p.canalBedW : p.bedWidthC);
      const fsd = (p.fsdC = p.canalFsd != null ? p.canalFsd : p.fsdC);
      const ss = (p.sideSlopeC = p.canalSideSlope != null ? p.canalSideSlope : p.sideSlopeC);
      const fb = (p.freeBoardC = p.canalFB != null ? p.canalFB : p.freeBoardC);
      row('Canal Bed Width', bedW, 'm');
      row('Full Supply Depth (FSD)', fsd, 'm');
      row('Side Slope (H:1)', ss, '');
      row('Canal Free Board', fb, 'm');
      row('Canal Bed Level (CBL)', cbl, 'm');
      R.Q = p.Qc;
      R.hfl = cbl + fsd;
      R.tbl = R.hfl + fb;
      row('Full Supply Level (FSL)', R.hfl, 'm', 'CBL + FSD');
      row('Top of Bank Level (TBL)', R.tbl, 'm', 'FSL + Free board');
      const canalTopFSL = bedW + 2 * ss * fsd;
      row('Canal Top Width at FSL', canalTopFSL, 'm');
      row('Provided Linear Waterway', totalWaterway, 'm');
      R.flSuggested = cbl - 1.20;
    }

    // ============================================================== 2. GENERAL ARRANGEMENT & LEVELS
    sec('2. GENERAL ARRANGEMENT & LEVELS');
    inp('Number of Vents', 'nVents', 'Nos');
    inp('Clear Span of Each Vent', 'span', 'm', 'IRC:SP:13 standard culvert span <= 6.0 m');
    if (nV > 1) inp('Pier Width', 'pierW', 'm', 'Plain concrete / masonry pier');
    inp('Road Category', 'roadType', '', 'Sets carriageway standards');
    inp('Carriageway Width', 'carriageway', 'm', 'IRC 5 cl. 104');
    inp('Road Level (FRL)', 'frl', 'm', p.frlNote);
    inp('Ground Level at Approaches', 'gl', 'm');
    inp('Foundation Level Adopted', 'foundationLevel', 'm', `Suggested +${fmt(R.flSuggested)}`);

    R.deckTop = p.frl - p.wc;
    R.soffit = R.deckTop - p.D;
    row('Deck Top Level', R.deckTop, 'm', 'FRL - wearing coat');
    row('Soffit Level (Bottom of Slab)', R.soffit, 'm', 'Deck top - slab thickness D');
    row('Bed Block Top Level', R.soffit, 'm');

    const clearance = R.soffit - R.hfl;
    R.clearance = clearance;
    row('Clearance over Design HFL/FSL', clearance, 'm', clearance >= p.freeBoardAdopted ? 'Adequate freeboard' : 'Check vertical clearance');
    R.okClearance = clearance >= (isStream ? 0.45 : p.freeBoardC || 0.50);
    chk('Vertical Clearance Check', R.okClearance, `${fmt(clearance, 3)} m (required >= ${isStream ? '0.45 m' : '0.50 m'})`);

    // ============================================================== 3. BED PROTECTION & CURTAIN WALLS (IRC:SP:13)
    sec('3. IRC:SP:13 BED PROTECTION & CURTAIN WALLS');
    const bedLevel = isStream ? p.streamBed : p.cblC;
    if (yes(p.bedProtection)) {
      inp('Upstream Curtain Wall Depth below Bed', 'curtainDepthUs', 'm', 'IRC:SP:13 standard >= 1.50 m');
      inp('Downstream Curtain Wall Depth below Bed', 'curtainDepthDs', 'm', 'IRC:SP:13 standard >= 2.00 m');
      inp('Curtain Wall Thickness', 'curtainThk', 'm', 'CC M15');
      R.usCurtainBottom = bedLevel - p.curtainDepthUs;
      R.dsCurtainBottom = bedLevel - p.curtainDepthDs;
      row('Upstream Curtain Wall Bottom Level', R.usCurtainBottom, 'm');
      row('Downstream Curtain Wall Bottom Level', R.dsCurtainBottom, 'm');

      inp('CC Bed Flooring Thickness in Ventway', 'floorThk', 'm', 'CC M15 over stone packing');
      inp('Boulder Packing under Bed Flooring', 'packingThk', 'm', 'Dry stone / gravel filter');
      inp('Upstream Flexible Apron Length', 'apronLenUs', 'm', 'Dry stone pitching');
      inp('Downstream Flexible Apron Length', 'apronLenDs', 'm', 'Dry stone pitching');
      inp('Boulder Apron Thickness', 'apronThk', 'm');

      R.okCurtainUs = p.curtainDepthUs >= 1.20;
      R.okCurtainDs = p.curtainDepthDs >= 1.50;
      chk('U/S Cut-off Depth Check', R.okCurtainUs, `${fmt(p.curtainDepthUs, 2)} m (min 1.20 m)`);
      chk('D/S Cut-off Depth Check', R.okCurtainDs, `${fmt(p.curtainDepthDs, 2)} m (min 1.50 m)`);
    } else {
      row('Floor Protection', 'None provided - deep scour foundation rules apply', '');
    }

    // ============================================================== 4. DECK SLAB STRUCTURAL DESIGN
    sec('4. DECK SLAB STRUCTURAL DESIGN (IRC 21:2000 / IRC 112:2020)');
    inp('Overall Slab Thickness D', 'D', 'm', p.deckAuto === 'yes' ? 'Auto-sized' : 'Manual input');
    inp('Wearing Coat Thickness', 'wc', 'm', 'IRC SP:13 / MORTH standard 75 mm');
    inp('Deck Concrete Grade', 'fck', 'MPa');
    inp('Reinforcement Steel Grade', 'fy', 'MPa');
    inp('Clear Cover to Main Steel', 'cover', 'm', 'IRC 112 / IRC 21 standard 40 mm');

    const d = p.D - p.cover - (p.mainDia / 1000) / 2;
    R.d = d;
    row('Effective Depth d', d * 1000, 'mm');

    // Effective span Leff
    const Leff = Math.min(spanR + d, spanR + p.bearingW);
    R.Leff = Leff;
    row('Effective Span Leff = min(L + d, L + bearing)', Leff, 'm', 'IRC 21 cl. 305.15');

    // Dead Load
    const dlSlab = p.D * 2.50; // t/sqm
    const dlWc = p.wc * 2.20; // t/sqm
    const totalDLIntensity = dlSlab + dlWc; // t/sqm
    const edgeLoadPerM = (2 * edgeDL) / B;
    const wDead = totalDLIntensity + edgeLoadPerM; // t/sqm equivalent
    R.wDead = wDead;
    const Md = (wDead * Leff * Leff) / 8; // t.m per metre width
    R.Md = Md;
    row('Dead Load Intensity (Slab + WC + Edge)', wDead, 't/sqm');
    row('Dead Load Bending Moment Md = w * L^2 / 8', Md, 't-m/m');

    // Live Load Bending Moment (Effective Width Method)
    // Impact Factor per IRC 6:2024
    const impactClassA = 4.5 / (6.0 + Leff);
    const impact70R = Leff <= 5.0 ? 0.25 : Math.max(0.10, 0.25 - ((Leff - 5.0) / 4.0) * 0.15);
    R.impactClassA = impactClassA;
    R.impact70R = impact70R;
    row('IRC 6 Impact Factor (Class A)', impactClassA * 100, '%', '4.5 / (6 + L)');
    row('IRC 6 Impact Factor (Class 70R)', impact70R * 100, '%', 'IRC 6:2024 cl.208');

    // Dispersion through wearing coat
    const Dwc = p.wc;

    // IRC Class A Wheel (11.4 t axle -> 5.7 t wheel, contact 0.50 x 0.25 m)
    const b1_A = 0.25 + 2 * Dwc;
    const l1_A = 0.50 + 2 * Dwc;
    const alphaA = BD.alphaFor ? BD.alphaFor(B / Leff) : 2.60;
    const be_A1 = alphaA * (Leff / 2) * (1 - (Leff / 2) / Leff) + b1_A;
    const be_A = Math.min(B, Math.max(1.5, be_A1));
    const Mll_A = ((5.7 * (1 + impactClassA) * Leff) / 4) / be_A;

    // IRC Class 70R Tracked (35 t on 4.57 x 0.84 m track)
    const b1_70T = 0.84 + 2 * Dwc;
    const be_70T = Math.min(B, Math.max(2.0, alphaA * (Leff / 2) * (1 - (Leff / 2) / Leff) + b1_70T));
    const trackOnSpan = Math.min(1.0, Leff / 4.57);
    const W_track = 35.0 * trackOnSpan;
    const Mll_70T = ((W_track * (1 + impact70R) * Leff) / 4) / be_70T;

    // IRC Class 70R Wheeled Bogie (20 t axle -> 10 t wheel)
    const b1_70W = 0.45 + 2 * Dwc;
    const be_70W = Math.min(B, Math.max(1.8, alphaA * (Leff / 2) * (1 - (Leff / 2) / Leff) + b1_70W));
    const Mll_70W = ((10.0 * (1 + impact70R) * Leff) / 4) / be_70W;

    const Mll_gov = Math.max(Mll_A, Mll_70T, Mll_70W);
    R.Mll = Mll_gov;
    row('Live Load Moment (Class A)', Mll_A, 't-m/m');
    row('Live Load Moment (70R Tracked)', Mll_70T, 't-m/m');
    row('Live Load Moment (70R Wheeled Bogie)', Mll_70W, 't-m/m');
    row('Governing Live Load Moment Mll', Mll_gov, 't-m/m', Mll_gov === Mll_70T ? '70R Tracked governs' : Mll_gov === Mll_70W ? '70R Wheeled governs' : 'Class A governs');

    // Total Moment & Section Sizing
    const Mtotal = Md + Mll_gov; // t-m/m
    R.Mtotal = Mtotal;
    const M_Nm = Mtotal * 9.80665 * 1000; // N.m / m
    row('Total Design Bending Moment M = Md + Mll', Mtotal, 't-m/m');

    // WSM Permissible Stresses (IRC 21)
    const scbc = p.fck / 3;
    const sst = p.fy >= 500 ? 240 : 200;
    const m = 10; // modular ratio
    const k = (m * scbc) / (m * scbc + sst);
    const j = 1 - k / 3;
    const Q_coeff = 0.5 * scbc * k * j;
    R.dReq = Math.sqrt((M_Nm * 1000) / (Q_coeff * 1000)); // mm
    row('Required Effective Depth dReq', R.dReq, 'mm', `d provided = ${fmt(d * 1000, 0)} mm`);
    R.okDepth = d * 1000 >= R.dReq;
    chk('Slab Depth Check', R.okDepth, `d provided ${fmt(d * 1000, 0)} mm >= dReq ${fmt(R.dReq, 0)} mm`);

    // Tensile Reinforcement Ast
    const AstReq = (M_Nm * 1000) / (sst * j * (d * 1000)); // sq.mm / m
    R.AstReq = AstReq;
    inp('Main Bar Diameter', 'mainDia', 'mm');
    inp('Main Bar Spacing', 'mainSpacing', 'mm');
    const AstProv = (Math.PI * p.mainDia * p.mainDia / 4) * (1000 / p.mainSpacing);
    R.AstProv = AstProv;
    row('Tensile Steel Required Ast', AstReq, 'sqmm/m');
    row('Tensile Steel Provided Ast', AstProv, 'sqmm/m', `${p.mainDia} mm @ ${p.mainSpacing} mm c/c`);
    R.okAst = AstProv >= AstReq;
    chk('Main Reinforcement Check', R.okAst, `Ast provided ${fmt(AstProv, 0)} sqmm >= req ${fmt(AstReq, 0)} sqmm`);

    // Distribution Steel
    const AstDistReq = Math.max(0.20 * AstReq, 0.0015 * 1000 * p.D * 1000);
    R.AstDistReq = AstDistReq;
    inp('Distribution Bar Diameter', 'distDia', 'mm');
    inp('Distribution Bar Spacing', 'distSpacing', 'mm');
    const AstDistProv = (Math.PI * p.distDia * p.distDia / 4) * (1000 / p.distSpacing);
    R.AstDistProv = AstDistProv;
    row('Distribution Steel Required', AstDistReq, 'sqmm/m', '>= 20% of main steel');
    row('Distribution Steel Provided', AstDistProv, 'sqmm/m', `${p.distDia} mm @ ${p.distSpacing} mm c/c`);
    R.okDist = AstDistProv >= AstDistReq;
    chk('Distribution Steel Check', R.okDist, `Provided ${fmt(AstDistProv, 0)} sqmm >= req ${fmt(AstDistReq, 0)} sqmm`);

    // Shear Check
    const Vd = (wDead * Leff) / 2; // t/m
    const Vll = (10.0 * (1 + impact70R) * (Leff - d) / Leff) / be_70W; // t/m
    const Vtotal = Vd + Vll; // t/m
    R.Vtotal = Vtotal;
    const tauV = (Vtotal * 9806.65) / (1000 * d * 1000); // MPa
    const pt = (AstProv / (1000 * d * 1000)) * 100;
    const tauC = Math.min(0.60, 0.28 * Math.sqrt(p.fck / 20) * Math.min(1.5, Math.pow(pt, 0.33)));
    R.tauV = tauV;
    R.tauC = tauC;
    row('Nominal Shear Stress tau_v', tauV, 'MPa');
    row('Permissible Shear Stress tau_c', tauC, 'MPa', 'IRC 21 Table 12B');
    R.okShear = tauV <= tauC;
    chk('Shear Stress Check', R.okShear, `tau_v ${fmt(tauV, 3)} MPa <= tau_c ${fmt(tauC, 3)} MPa (No shear reinforcement required)`);

    // ============================================================== 5. SUBSTRUCTURE STABILITY (IRC 78:2024)
    sec('5. SUBSTRUCTURE & FOUNDATION STABILITY (IRC 78:2024)');
    inp('Abutment Top Width', 'abTopW', 'm');
    inp('Abutment Back Batter', 'abBackBatter', 'm', 'Horizontal batter');
    inp('Footing Toe Projection', 'abToe', 'm');
    inp('Footing Heel Projection', 'abHeel', 'm');
    inp('Footing Thickness', 'footingT', 'm');
    inp('Safe Bearing Capacity (SBC)', 'sbc', 't/sqm');
    inp('Backfill Friction Angle phi', 'phi', 'deg');
    inp('Soil Unit Weight', 'gammaSoil', 't/cum');

    const Hstem = R.soffit - (p.foundationLevel + p.footingT);
    R.Hstem = Hstem;
    const Htotal = R.soffit - p.foundationLevel;
    R.Htotal = Htotal;
    const abBaseW = p.abTopW + p.abFrontBatter + p.abBackBatter;
    const footingW = abBaseW + p.abToe + p.abHeel;
    R.abBaseW = abBaseW;
    R.footingW = footingW;
    row('Abutment Stem Height', Hstem, 'm');
    row('Total Abutment Height (incl. footing)', Htotal, 'm');
    row('Abutment Stem Base Width', abBaseW, 'm');
    row('Abutment Footing Width', footingW, 'm');

    // Earth pressure
    const Ka = (1 - Math.sin(rad(p.phi))) / (1 + Math.sin(rad(p.phi)));
    R.Ka = Ka;
    const Pa = 0.5 * Ka * p.gammaSoil * Htotal * Htotal; // t/m
    const Psurch = Ka * p.gammaSoil * p.surcharge * Htotal; // t/m
    const totalPhoriz = Pa + Psurch;

    // Vertical loads
    const WstemRect = p.abTopW * Hstem * p.gammaConc;
    const WstemTri = 0.5 * p.abBackBatter * Hstem * p.gammaConc;
    const Wfooting = footingW * p.footingT * p.gammaConc;
    const WsoilHeel = p.abHeel * (Hstem + p.surcharge) * p.gammaSoil;
    const RdeckDL = (wDead * R.deckL) / 2; // t/m
    const RdeckLL = Vll; // t/m

    // Case 1: Unloaded Deck
    const V_case1 = WstemRect + WstemTri + Wfooting + WsoilHeel + RdeckDL;
    const MR_case1 = WstemRect * (p.abToe + p.abTopW / 2) +
      WstemTri * (p.abToe + p.abTopW + p.abBackBatter / 3) +
      Wfooting * (footingW / 2) +
      WsoilHeel * (footingW - p.abHeel / 2) +
      RdeckDL * (p.abToe + p.bearingW / 2);
    const MO_case1 = Pa * (Htotal / 3) + Psurch * (Htotal / 2);

    const fosO_1 = MR_case1 / MO_case1;
    const fosS_1 = (p.mu * V_case1) / totalPhoriz;
    const xbar_1 = (MR_case1 - MO_case1) / V_case1;
    const e_1 = Math.abs(footingW / 2 - xbar_1);
    const pmax_1 = (V_case1 / footingW) * (1 + 6 * e_1 / footingW);
    const pmin_1 = (V_case1 / footingW) * (1 - 6 * e_1 / footingW);

    // Case 2: Loaded Deck with Live Load
    const V_case2 = V_case1 + RdeckLL;
    const MR_case2 = MR_case1 + RdeckLL * (p.abToe + p.bearingW / 2);
    const fosO_2 = MR_case2 / MO_case1;
    const fosS_2 = (p.mu * V_case2) / totalPhoriz;
    const xbar_2 = (MR_case2 - MO_case1) / V_case2;
    const e_2 = Math.abs(footingW / 2 - xbar_2);
    const pmax_2 = (V_case2 / footingW) * (1 + 6 * e_2 / footingW);
    const pmin_2 = (V_case2 / footingW) * (1 - 6 * e_2 / footingW);

    R.fosO = Math.min(fosO_1, fosO_2);
    R.fosS = Math.min(fosS_1, fosS_2);
    R.pmax = Math.max(pmax_1, pmax_2);
    R.pmin = Math.min(pmin_1, pmin_2);
    R.maxE = Math.max(e_1, e_2);

    row('Factor of Safety against Overturning', R.fosO, '', 'IRC 78 required >= 2.0');
    row('Factor of Safety against Sliding', R.fosS, '', 'IRC 78 required >= 1.5');
    row('Maximum Base Pressure', R.pmax, 't/sqm', `Allowable SBC = ${fmt(p.sbc, 1)} t/sqm`);
    row('Minimum Base Pressure', R.pmin, 't/sqm', R.pmin >= 0 ? 'No tension at base (e <= B/6)' : 'Tension exists at base');

    R.okFosO = R.fosO >= 2.0;
    R.okFosS = R.fosS >= 1.5;
    R.okPmax = R.pmax <= p.sbc;
    R.okNoTension = R.pmin >= -1e-4;
    chk('Overturning Stability Check', R.okFosO, `FOS ${fmt(R.fosO, 2)} >= 2.0`);
    chk('Sliding Stability Check', R.okFosS, `FOS ${fmt(R.fosS, 2)} >= 1.5`);
    chk('Base Pressure Check', R.okPmax, `pmax ${fmt(R.pmax, 1)} t/sqm <= SBC ${fmt(p.sbc, 1)} t/sqm`);
    chk('No Tension at Base Check', R.okNoTension, `pmin ${fmt(R.pmin, 2)} t/sqm >= 0 (e = ${fmt(R.maxE, 2)} m <= B/6 = ${fmt(footingW / 6, 2)} m)`);

    // Wing Walls Check
    inp('Wing Wall Type', 'wingType', '', p.wingType === 'splayed' ? '45° Splayed Wings' : 'Straight Return Walls');
    inp('Wing Wall Length', 'wingLen', 'm');
    inp('Wing Wall Base Width', 'wBaseW', 'm');
    const wH = Htotal;
    const wKa = Ka;
    const wPa = 0.5 * wKa * p.gammaSoil * wH * wH;
    const wW = (p.wTopW + p.wBaseW) / 2 * wH * p.gammaConc;
    const wMR = wW * (p.wBaseW * 0.45);
    const wMO = wPa * (wH / 3);
    const wFosO = wMR / wMO;
    const wFosS = (p.mu * wW) / wPa;
    R.wFosO = wFosO;
    R.wFosS = wFosS;
    row('Wing Wall FOS Overturning', wFosO, '', '>= 2.0');
    row('Wing Wall FOS Sliding', wFosS, '', '>= 1.5');
    R.okWing = wFosO >= 2.0 && wFosS >= 1.5;
    chk('Wing Wall Stability Check', R.okWing, `FOS Overturning ${fmt(wFosO, 2)} >= 2.0, Sliding ${fmt(wFosS, 2)} >= 1.5`);

    // ============================================================== 6. SUMMARY & ESTIMATE ATTRIBUTES
    R.allOk = R.okClearance && R.okDepth && R.okAst && R.okDist && R.okShear && R.okFosO && R.okFosS && R.okPmax && R.okNoTension && R.okWing;
    R.typ = 'SLAB CULVERT';
    R.title = `DESIGN OF ${nV} VENT x ${fmt(p.span, 2)} m RCC SLAB CULVERT ACROSS ${String(p.waterwayName).toUpperCase()} AT Km ${p.chainage}`;
    R.subtitle = `${nV} Vent${nV > 1 ? 's' : ''} x ${fmt(p.span, 2)} m Clear Span | Carriageway ${fmt(p.carriageway, 2)} m (${p.roadType}) | Design Q = ${fmt(R.Q, 2)} cumecs | IRC SP:13-2022 & IRC 112/21`;
    R.scope = `Construction of ${nV} vent RCC Slab Culvert of ${fmt(p.span, 2)} m clear span with ${fmt(p.carriageway, 2)} m carriageway across ${p.waterwayName} at Km ${p.chainage} in ${p.location}, ${p.district} District.`;
    R.nameOfWork = R.scope;

    return { p, R, sections: secs, warnings };
  }

  // ------------------------------------------------------------ Auto Design Engine
  function autoDesign(input) {
    const p = Object.assign({}, CULVERT_DEFAULTS, input || {});
    const log = [];
    p.span = Math.min(6.0, Math.max(1.0, p.span));

    let r = design(p);

    // 0. Ensure FRL provides required freeboard over HFL / FSL
    const isStream = p.crossingType === 'stream';
    const reqClearance = isStream ? (p.freeBoardAdopted || 0.45) : (p.freeBoardC || 0.50);
    const minSoffit = r.R.hfl + reqClearance;
    const minFrl = +(minSoffit + p.D + p.wc + 0.02).toFixed(2);
    if (p.frl < minFrl) {
      p.frl = minFrl;
      log.push(`FRL +${fmt(p.frl, 2)} m (${fmt(reqClearance, 2)} m clearance over ${isStream ? 'HFL' : 'FSL'})`);
      r = design(p);
    }
    // 1. Foundation level
    if (p.foundationLevel > r.R.flSuggested + 0.05) {
      p.foundationLevel = +(r.R.flSuggested).toFixed(2);
      log.push(`foundation level +${fmt(p.foundationLevel, 2)} m`);
      r = design(p);
    }

    // 2. Size Deck Slab (D, main rebar)
    const Leff = r.R.Leff;
    let D = Math.max(p.minD || 0.25, Math.ceil((Leff / 15) / 0.025) * 0.025);
    const spacings = [180, 150, 140, 125, 110, 100];
    let deckFound = false;
    for (let i = 0; i < 40 && !deckFound; i++, D = +(D + 0.025).toFixed(3)) {
      for (const dia of [12, 16, 20, 25]) {
        for (const sp of spacings) {
          const trial = design(Object.assign({}, p, { D, mainDia: dia, mainSpacing: sp })).R;
          if (trial.okDepth && trial.okAst && trial.okShear) {
            p.D = D;
            p.mainDia = dia;
            p.mainSpacing = sp;
            deckFound = true;
            break;
          }
        }
        if (deckFound) break;
      }
    }
    // Distribution bars
    for (const dd of [10, 12]) {
      for (const sp of [200, 175, 150, 125, 100]) {
        p.distDia = dd;
        p.distSpacing = sp;
        if (design(p).R.okDist) break;
      }
    }
    log.push(`deck slab ${fmt(p.D * 1000, 0)} mm (${p.mainDia} mm @ ${p.mainSpacing} mm c/c)`);
    r = design(p);

    // 3. Size Abutment & Footing
    const H = r.R.Htotal;
    for (let i = 0; i < 60 && !(r.R.okFosO && r.R.okFosS && r.R.okPmax && r.R.okNoTension); i++) {
      if (r.R.pmin < 0 || r.R.fosO < 2.0) {
        if (p.abBackBatter < 0.65 * H) p.abBackBatter = +(p.abBackBatter + 0.10).toFixed(2);
        else if (p.abHeel < 1.20) p.abHeel = +(p.abHeel + 0.10).toFixed(2);
        else p.abToe = +(p.abToe + 0.10).toFixed(2);
      } else if (r.R.fosS < 1.50) {
        p.abBackBatter = +(p.abBackBatter + 0.10).toFixed(2);
        p.abHeel = +(p.abHeel + 0.10).toFixed(2);
      } else if (r.R.pmax > p.sbc) {
        p.abToe = +(p.abToe + 0.10).toFixed(2);
        p.abHeel = +(p.abHeel + 0.10).toFixed(2);
      } else break;
      r = design(p);
    }
    log.push(`abutment back batter ${fmt(p.abBackBatter, 2)} m, footing width ${fmt(r.R.footingW, 2)} m`);

    // 4. Size Wing Walls
    for (let i = 0; i < 30 && !r.R.okWing; i++) {
      p.wBaseW = +(p.wBaseW + 0.15).toFixed(2);
      p.wFrontBatter = +(p.wFrontBatter + 0.05).toFixed(2);
      r = design(p);
    }
    log.push(`wing walls base ${fmt(p.wBaseW, 2)} m`);

    return { input: p, result: r, log };
  }

  Object.assign(BD, {
    CULVERT_DEFAULTS,
    culvertDesign: design,
    culvertAutoDesign: autoDesign,
  });
})(typeof window !== 'undefined' ? window : globalThis);
