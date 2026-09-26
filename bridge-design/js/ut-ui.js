/* U.T. input form definition, hints, status tiles and live section for the app. */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});
  const YN = [['yes', 'Yes'], ['no', 'No']];
  const fmt = (v, n = 3) => (typeof v === 'number' && isFinite(v) ? v.toFixed(n) : String(v));

  const GROUPS = [
    ['Canal hydraulic particulars', true, { step: 1, note: 'HPs of the canal at the crossing (from the approved HP statement / L-section).' }, [
      ['Qc', 'Canal discharge', 'cumecs', 0.001], ['bedWidth', 'Bed width', 'm', 0.001], ['fsd', 'Full supply depth', 'm', 0.001],
      ['sideSlope', 'Side slope (H:1)', '', 0.25], ['freeBoard', 'Free board', 'm', 0.01], ['bedFall', 'Bed fall 1 in', '', 100],
      ['manningN', "Manning's n", '', 0.001], ['cbl', 'Canal bed level (CBL)', 'm', 0.001],
      ['bankWidthL', 'Bank top width L', 'm', 0.1], ['bankWidthR', 'Bank top width R', 'm', 0.1],
    ]],
    ['Drain & soil', true, { step: 2, note: 'Drain data from the catchment map and the drain L-section; soil from trial pits.' }, [
      ['floodMode', 'Maximum flood discharge', '', [['dicken', "Dicken's formula from catchment"], ['given', 'Enter the discharge']]],
      ['catchment', 'Catchment area', 'sq.km', 0.001], ['dickenC', "Dicken's constant C", '', 0.5], ['mfdGiven', 'Maximum flood discharge', 'cumecs', 0.001],
      ['drainBed', 'Deep bed level of drain at crossing', 'm', 0.001], ['drainSideSlope', 'Drain side slope (H:1)', '', 0.25],
      ['drainN', "Drain Manning's n", '', 0.001], ['tailFall', 'Tail channel bed fall 1 in', '', 100], ['fluming', 'Fluming of Lacey waterway', '%', 5],
      ['soilType', 'Bed material (sets silt factor)', '', [['', 'Choose…'], ['0.5', 'Very fine silt (0.08 mm) f = 0.5'], ['0.7', 'Silt (0.15 mm) f = 0.7'], ['1.0', 'Fine sand / clayey (0.3 mm) f = 1.0'], ['1.25', 'Medium sand (0.5 mm) f = 1.25'], ['1.75', 'Coarse sand (1 mm) f = 1.75'], ['2.0', 'Coarse sand / gravel f = 2.0'], ['2.5', 'Gravelly sand (2 mm) f = 2.5'], ['4.75', 'Boulders / hard strata f = 4.75']]],
      ['siltFactor', 'Silt factor f', '', 0.05], ['sbc', 'Safe bearing capacity', 't/sqm', 0.5],
      ['phi', 'Backfill φ', 'deg', 1], ['gammaSoil', 'Soil unit weight', 't/cum', 0.1], ['mu', 'Friction (concrete/soil)', '', 0.05],
    ]],
    ['Barrel, loading & materials', true, { step: 3, note: 'Vent size and design choices. Auto design sets the number of vents and all member sizes.' }, [
      ['vBarrel', 'Assumed velocity in barrel', 'm/s', 0.1], ['nVents', 'Number of vents', 'Nos', 1],
      ['ventW', 'Vent width', 'm', 0.25], ['ventH', 'Vent height', 'm', 0.25], ['cushion', 'Top of box below canal bed', 'm', 0.05],
      ['llBank', 'Live load on the banks', '', [['A', 'IRC Class A'], ['70R', 'IRC Class 70R tracked'], ['both', 'Class A and 70R'], ['none', 'None (no road on bank)']]],
      ['wallSurcharge', 'LL surcharge on walls (1.2 m fill)', '', YN],
      ['fck', 'Box concrete', '', [[25, 'M25'], [30, 'M30'], [35, 'M35'], [40, 'M40']]],
      ['fy', 'Reinforcement', '', [[415, 'Fe415'], [500, 'Fe500']]],
      ['exposure', 'Exposure (sets cover)', '', [['moderate', 'Moderate - 40 mm'], ['severe', 'Severe - 45 mm'], ['very severe', 'Very severe - 50 mm'], ['extreme', 'Extreme - 75 mm']]],
      ['subFck', 'Plain concrete walls', '', [[15, 'CC M15'], [20, 'CC M20'], [25, 'CC M25']]],
      ['kMode', 'Earth pressure on box walls', '', [['active', 'Active (Rankine), as in type designs'], ['rest', 'At rest (1 - sin φ), rigid box']]],
    ]],
    ['Project details', false, { step: 4, note: 'Printed on the drawings, report and estimate.' }, [
      ['chainage', 'Chainage (Km)', '', 'text'], ['canalName', 'Canal', '', 'text'],
      ['location', 'Place / village', '', 'text'], ['district', 'District', '', 'text'],
      ['project', 'Project', '', 'text'], ['state', 'Government', '', 'text'], ['department', 'Department', '', 'text'],
      ['subDivision', 'Sub-division', '', 'text'], ['division', 'Division', '', 'text'],
    ]],
    ['RCC box', false, { adv: true }, [
      ['boxAuto', 'Member thickness', '', [['yes', 'Auto - least passing (recommended)'], ['no', 'Enter my own']]],
      ['minT', 'Minimum member thickness', 'm', 0.025], ['tTop', 'Top slab', 'm', 0.025], ['tBot', 'Bottom slab', 'm', 0.025],
      ['tWall', 'End walls', 'm', 0.025], ['tMid', 'Middle walls', 'm', 0.025], ['haunch', 'Haunch', 'm', 0.025],
      ['wcBox', 'Wearing coat in barrel', 'm', 0.005], ['sealing', 'Sealing coat over box', 'm', 0.01], ['pcc', 'Levelling course', 'm', 0.025],
      ['cover', 'Clear cover', 'm', 0.005], ['scbc', 'σcbc (WSM)', 'N/mm²', 0.5], ['sst', 'σst (WSM)', 'N/mm²', 10], ['modRatio', 'Modular ratio', '', 1],
      ['surchargeHead', 'Surcharge head in barrel (box full)', 'm', 0.1], ['llDisp', 'LL dispersion through fill (H per V)', '', 0.1],
      ['llImpact', 'Impact on LL through fill', '', 0.05], ['surcharge', 'LL surcharge height', 'm', 0.1],
      ['gammaRcc', 'Unit wt of RCC', 't/cum', 0.05], ['gammaSub', 'Submerged soil unit wt', 't/cum', 0.1],
    ]],
    ['Hydraulics, drop & floors', false, { adv: true }, [
      ['usSplay', 'U/S splay (1 in)', '', 0.5], ['dsSplay', 'D/S splay (1 in)', '', 0.5], ['nConc', "n for concrete surfaces", '', 0.001],
      ['kTail', 'Loss coeff. transition to tail channel', '', 0.05], ['kExit', 'Loss coeff. barrel exit (expansion)', '', 0.05],
      ['kEntry', 'Loss coeff. barrel entry (contraction)', '', 0.05], ['kApproach', 'Loss coeff. approach to crest', '', 0.05],
      ['barrelF1', 'Entry loss coeff. f1 (Unwin)', '', 0.005], ['unwinA', 'Unwin a', '', 0.0001], ['unwinB', 'Unwin b', '', 0.005],
      ['crestDepth', 'Depth over crest (0 = formula)', 'm', 0.001], ['drainFB', 'Free board over drain MFL', 'm', 0.05],
      ['rhoConc', 'Specific gravity of drop wall', '', 0.1], ['floorWc', 'Wearing coat on cistern floor', 'm', 0.05],
      ['cistern', 'Min cistern length (0 = formula)', 'm', 0.1], ['dsFloorT', 'Approach / d/s floor thickness', 'm', 0.05],
    ]],
    ['Head, wing & return walls', false, { adv: true }, [
      ['wallAuto', 'Wall sections', '', [['yes', 'Auto - least passing section (recommended)'], ['no', 'Enter my own']]],
      ['hwTopW', 'Head wall top width', 'm', 0.05], ['hwFrontBatter', 'Head wall front batter', 'm', 0.05], ['hwRearBatter', 'Head wall rear batter', 'm', 0.05],
      ['wTopW', 'Wing wall top width', 'm', 0.05], ['wFrontBatter', 'Wing wall front batter', 'm', 0.05], ['wRearBatter', 'Wing wall rear batter', 'm', 0.05],
      ['wToe', 'Wing footing toe', 'm', 0.05], ['wHeel', 'Wing footing heel', 'm', 0.05], ['wFootT', 'Wing footing thickness', 'm', 0.05],
      ['wFdnUs', 'U/S wall foundation level (0 = auto)', 'm', 0.05], ['wFdnDs', 'D/S wall foundation level (0 = auto)', 'm', 0.05],
      ['returnLen', 'Return wall length', 'm', 0.5], ['subAllow', 'Allowable compression', 't/sqm', 10], ['gammaConc', 'Unit wt of plain concrete', 't/cum', 0.05],
    ]],
  ];
  const SHOW_IF = {
    catchment: (s) => s.floodMode !== 'given', dickenC: (s) => s.floodMode !== 'given', mfdGiven: (s) => s.floodMode === 'given',
    tMid: (s) => s.nVents > 1, minT: (s) => s.boxAuto !== 'no', wallSurcharge: (s) => s.llBank !== 'none',
  };
  const AUTO_FIELDS = {
    tTop: (s) => s.boxAuto !== 'no', tBot: (s) => s.boxAuto !== 'no', tWall: (s) => s.boxAuto !== 'no', tMid: (s) => s.boxAuto !== 'no',
    hwRearBatter: (s) => s.wallAuto !== 'no', wRearBatter: (s) => s.wallAuto !== 'no', wToe: (s) => s.wallAuto !== 'no', wHeel: (s) => s.wallAuto !== 'no',
  };
  const STD_NOTE = {
    dickenC: 'CDO guidelines: 11.4 - 22 by region; 19.5 used in the reference', vBarrel: 'Up to 3 m/s for a concrete barrel (sizing only)',
    fluming: 'Waterway as % of Lacey P = 4.8 Q^1/2 (IS 7784)', cushion: 'Box top kept below the canal bed; 0.1 m in the reference',
    tailFall: 'Bed fall of the tail channel from the barrel to the drain', wcBox: '75 mm wearing coat on the barrel floor',
    haunch: '150 x 150 standard', surchargeHead: 'Head over the soffit when the barrel runs full (0.5 m in the reference)',
    llDisp: '1 : 1 through fill as in the reference (IRC 6 / IRC 112 permit 45°)', llImpact: 'Reference takes no impact under 2 m of fill',
    usSplay: '2 : 1 (IS 7784 Pt 2)', dsSplay: '3 : 1 (IS 7784 Pt 2)', kExit: '0.3 for expansion', kEntry: '0.2 for contraction',
    barrelF1: 'Entry loss 0.505 (Unwin)', unwinA: '0.00316 for plastered surfaces', crestDepth: 'Enter a value from Malikpur curves to override',
    drainFB: 'Top of u/s walls = MFL + free board (or TBL)', rhoConc: 'Plain concrete 2.4', returnLen: 'Returns into the banks',
    sealing: '40 mm sealing coat on the box under the canal', pcc: 'PCC M15 levelling course', kMode: '',
    gammaSub: 'Submerged soil under the full canal', wallSurcharge: 'IRC 6 cl.214.1.1.3 where vehicles can come near the wall',
  };

  function onChoice(state, key) {
    if (key === 'fck') state.scbc = BD.scbcFor(Number(state.fck));
    if (key === 'fy') state.sst = BD.sstFor(Number(state.fy));
    if (key === 'exposure') state.cover = BD.COVER[state.exposure] || state.cover;
    if (key === 'subFck') state.subAllow = BD.subAllowFor(Number(state.subFck));
    if (key === 'soilType' && state.soilType) state.siltFactor = Number(state.soilType);
    return ['fck', 'fy', 'exposure', 'subFck', 'soilType'].includes(key);
  }

  // Keep the auto-sized values visible in the form.
  function syncAuto(state, cur) {
    const ch = [];
    if (state.boxAuto !== 'no') for (const k of ['tTop', 'tBot', 'tWall', 'tMid']) if (state[k] !== cur.p[k]) { state[k] = cur.p[k]; ch.push(k); }
    if (state.wallAuto !== 'no') {
      const w = cur.R.walls.reduce((a, b) => (b.B > a.B ? b : a));
      const vals = { hwRearBatter: cur.R.hw.rb, wRearBatter: w.rb, wToe: w.toe, wHeel: w.heel };
      for (const [k, v] of Object.entries(vals)) if (state[k] !== v) { state[k] = v; ch.push(k); }
    }
    return ch;
  }

  function hints(cur, state, set) {
    const R = cur.R;
    const need = Math.max(1, Math.ceil(R.ventsReq - 1e-9));
    set('nVents', need > state.nVents ? `${need} vents needed at ${state.vBarrel} m/s <button data-use="nVents" data-val="${need}">use</button>` : `Barrel velocity ${fmt(R.vBarrelAct, 2)} m/s`);
    set('floodMode', `Q = ${fmt(R.Q, 3)} cumecs`);
    set('ventH', R.secs[3].d > state.ventH ? `Entry depth ${fmt(R.secs[3].d)} m exceeds the vent: raise the vent or add vents` : `Depth at entry ${fmt(R.secs[3].d)} m (free flow)`);
    set('drainBed', `Drop ${fmt(R.dropH, 3)} m to sill +${fmt(R.sill)}; u/s MFL +${fmt(R.mflUs)}`);
    set('fluming', `Waterway ${fmt(R.Bf, 2)} m (Lacey ${fmt(R.lacey, 2)} m)`);
    set('siltFactor', `Scour: u/s +${fmt(R.scourUs)}, d/s +${fmt(R.scourDs)}`);
    set('llBank', R.ll ? `${fmt(R.ll, 3)} t/sqm on the box under ${fmt(R.fill, 2)} m fill` : '');
    if (state.boxAuto !== 'no') set('tTop', 'Auto: least thickness passing depth, steel and shear');
    if (state.wallAuto !== 'no') set('wRearBatter', 'Auto: least section with no tension, FOS 2 / 1.5 and SBC');
    set('exposure', 'Water-retaining box: moderate (40 mm) as in the reference; severe for aggressive water / soil');
  }

  function status(cur, est, state) {
    const R = cur.R, p = cur.p;
    const thick = `${Math.round(p.tTop * 1000)} / ${Math.round(p.tBot * 1000)} / ${Math.round(p.tWall * 1000)}`;
    return {
      title: `U.T. · Km ${state.chainage}`,
      kpis: `
        <div><span>Barrel</span><b>${R.nV}<i>× ${fmt(p.ventW, 2)} × ${fmt(p.ventH, 2)} m</i></b><small>V ${fmt(R.vBarrelAct, 2)} m/s · Q ${fmt(R.Q, 2)}</small></div>
        <div><span>Box members</span><b>${Math.round(p.tTop * 1000)}<i>mm top</i></b><small>top / bottom / walls ${thick}</small></div>
        <div><span>U/S MFL</span><b>${fmt(R.mflUs, 2)}<i>m</i></b><small>drop ${fmt(R.dropH, 2)} m · TBL ${fmt(R.tbl, 2)}</small></div>
        <div><span>Estimate</span><b>${est.lakhs.toFixed(2)}<i>lakhs</i></b><small>SSR 2026-27 + GST</small></div>`,
      gov: `<span>Flow</span><b>${R.free ? 'Free fall at drop' : 'Drowned drop'} · barrel ${R.secs[3].d <= p.ventH ? 'free flow' : 'SURCHARGED'}</b>`,
    };
  }

  // Blueprint longitudinal section along the drain (vertical scale exaggerated).
  function sectionSVG(cur) {
    const { p, R } = cur;
    const La = 3, xa = La, xt = xa + R.dropBase, xe = xt + R.usFloor, xx = xe + R.Lb, xd = xx + R.dsLen, x1 = xd + 3;
    const top = Math.max(R.tbl, R.mflUs) + 0.9, bot = Math.min(R.boxBot, R.sill - R.apronT) - 0.5;
    const W = 720, padL = 10, padR = 150;
    const kx = (W - padL - padR) / (x1 + 1.5), ky = Math.min(kx * 4, 330 / (top - bot));
    const Hh = Math.ceil((top - bot) * ky + 16);
    const X = (x) => padL + (x + 1.5) * kx, Y = (l) => 8 + (top - l) * ky;
    const pts = (a) => a.map(([x, l]) => `${X(x).toFixed(1)},${Y(l).toFixed(1)}`).join(' ');
    const cw = p.sideSlope * (p.fsd + p.freeBoard), c0 = xe + p.hwTopW + p.bankWidthL;
    let g2 = `<defs><linearGradient id="bpWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8" stop-opacity=".75"/><stop offset="1" stop-color="#0e7490" stop-opacity=".35"/></linearGradient>
      <filter id="bpGlow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    // ground / banks / canal
    g2 += `<polygon class="bp-soil" points="${pts([[-1.5, p.drainBed], [xa, p.drainBed], [xa, R.sill - R.apronT], [xe, R.sill - R.apronT], [xe, R.boxBot], [xx, R.boxBot], [xx, R.sill - p.dsFloorT], [xd, R.sill - p.dsFloorT], [xd, R.sill], [x1, R.sill], [x1, bot], [-1.5, bot]])}"/>`;
    g2 += `<polygon class="bp-soil" points="${pts([[xe, R.boxTop], [xe, R.tbl], [c0, R.tbl], [c0 + cw, p.cbl], [c0 + cw + p.bedWidth, p.cbl], [c0 + 2 * cw + p.bedWidth, R.tbl], [xx, R.tbl], [xx, R.boxTop]])}"/>`;
    const wsl = p.sideSlope * p.fsd;
    g2 += `<polygon class="bp-water" points="${pts([[c0 + cw - wsl, R.fsl], [c0 + cw + p.bedWidth + wsl, R.fsl], [c0 + cw + p.bedWidth, p.cbl], [c0 + cw, p.cbl]])}"/>`;
    // drain water
    const s = R.secs;
    g2 += `<polygon class="bp-water" points="${pts([[-1.5, s[6].mfl], [xa, s[6].mfl], [xt + 0.3, s[4].mfl], [xe, s[3].mfl], [xx, s[2].mfl], [xd, s[1].mfl], [x1, s[0].mfl], [x1, R.sill], [xd, R.sill], [xe, R.sill], [xt, R.sill], [xa, R.sill], [xa, R.crest], [-1.5, R.crest]])}" opacity=".85"/>`;
    // concrete: drop wall, floors, box, head walls
    g2 += `<polygon class="bp-conc" points="${pts([[xa, R.sill - R.apronT], [xe, R.sill - R.apronT], [xe, R.sill], [xt, R.sill], [xa + R.dropTop, R.crest], [xa, R.crest]])}"/>`;
    g2 += `<polygon class="bp-conc" points="${pts([[xx, R.sill - p.dsFloorT], [xd, R.sill - p.dsFloorT], [xd, R.sill], [xx, R.sill]])}"/>`;
    g2 += `<polygon class="bp-conc" points="${pts([[xe, R.boxTop], [xe + R.hw.b, R.boxTop], [xe + p.hwTopW, R.tbl], [xe, R.tbl]])}"/>`;
    g2 += `<polygon class="bp-conc" points="${pts([[xx, R.boxTop], [xx - R.hw.b, R.boxTop], [xx - p.hwTopW, R.tbl], [xx, R.tbl]])}"/>`;
    g2 += `<path class="bp-deck" filter="url(#bpGlow)" fill-rule="evenodd" d="M${pts([[xe, R.boxBot], [xx, R.boxBot], [xx, R.boxTop], [xe, R.boxTop]]).replace(/ /g, ' L')} Z M${pts([[xe, R.floorTop], [xx, R.floorTop], [xx, R.soffit], [xe, R.soffit]]).replace(/ /g, ' L')} Z"/>`;
    // ripple on the canal
    const x0 = X(c0 + cw - wsl), xr = X(c0 + cw + p.bedWidth + wsl), yw = Y(R.fsl);
    let d = `M${x0.toFixed(1)},${yw.toFixed(1)}`;
    for (let x = x0; x < xr; x += 12) d += ' q3,-2.4 6,0 t6,0';
    g2 += `<path class="bp-ripple" d="${d}"/>`;
    // level ladder
    const lv = [['TBL', R.tbl], ['FSL', R.fsl], ['U/S MFL', R.mflUs], ['CREST', R.crest], ['CBL', p.cbl], ['BOX TOP', R.boxTop], ['SILL', R.sill], ['TAIL MFL', s[0].mfl]].sort((a, b) => b[1] - a[1]);
    let lastY = -99;
    const xl = X(x1) + 8;
    for (const [n, l] of lv) {
      const y = Y(l), yt = Math.max(y, lastY + 15);
      lastY = yt;
      const cls = /FSL|MFL|CBL/.test(n) ? 'bp-lv w' : 'bp-lv';
      g2 += `<line class="bp-tick" x1="${X(-1.5)}" y1="${y}" x2="${xl}" y2="${y}"/><path class="bp-tri" d="M${xl + 2},${yt - 3} l6,0 l-3,4 z"/>`;
      g2 += `<text class="${cls}" x="${xl + 12}" y="${yt + 4}"><tspan class="n">${n}</tspan> +${l.toFixed(3)}</text>`;
    }
    g2 += `<text class="bp-cap" x="${X(c0 + cw + p.bedWidth / 2)}" y="${Y(R.fsl) - 6}" text-anchor="middle">CANAL · Q ${fmt(p.Qc, 2)} cumecs</text>`;
    g2 += `<text class="bp-dimt" x="${X(xe + R.Lb / 2)}" y="${Y(R.boxBot) + 14}" text-anchor="middle">${R.nV} × ${Math.round(p.ventW * 1000)} × ${Math.round(p.ventH * 1000)} BOX · ${R.Lb.toFixed(2)} m</text>`;
    g2 += `<text class="bp-cap" x="${X(-1.2)}" y="${Y(s[6].mfl) - 6}">DRAIN ${fmt(R.Q, 2)} cumecs →</text>`;
    return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Longitudinal section of the under tunnel along the drain with levels">${g2}</svg>`;
  }

  BD.UTUI = {
    GROUPS, SHOW_IF, AUTO_FIELDS, STD_NOTE, onChoice, syncAuto, hints, status, sectionSVG,
    sheets: (cur) => [BD.utSheet1(cur), BD.utSheet2(cur)],
    dwgHint: 'Sheet 1: longitudinal section along the drain, plan and flow table. Sheet 2: barrel cross-section with reinforcement, head / wing wall and drop wall sections, schedule. Use + and − to zoom.',
  };
})(typeof window !== 'undefined' ? window : globalThis);
