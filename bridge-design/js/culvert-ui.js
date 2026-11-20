/*
 * Dedicated Slab Culvert UI, Live Cross-Section, Drawings and Estimates
 * (IRC:SP:13-2022, IRC 5, IRC 6, IRC 21 / IRC 112, IRC 78).
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});
  const YN = [['yes', 'Yes'], ['no', 'No']];
  const fmt = (v, n = 3) => (typeof v === 'number' && isFinite(v) ? v.toFixed(n) : String(v));
  const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  const yes = (v) => v === 'yes' || v === true;

  const SPANS = [
    [1.5, '1.50 m (IRC SP:13 Standard)'],
    [2.0, '2.00 m (IRC SP:13 Standard)'],
    [2.5, '2.50 m (IRC SP:13 Standard)'],
    [3.0, '3.00 m (IRC SP:13 Standard)'],
    [4.0, '4.00 m (IRC SP:13 Standard)'],
    [5.0, '5.00 m (IRC SP:13 Standard)'],
    [6.0, '6.00 m (IRC SP:13 Maximum Culvert Span)'],
  ];

  const ROAD_TYPES = [
    ['PR_VILLAGE', 'Panchayat Raj / Village Road (Single Lane 4.25 m)'],
    ['ODR', 'Other District Road - ODR (Single Lane 4.25 m)'],
    ['MDR_INT', 'Major District Road - MDR (Intermediate 5.50 m)'],
    ['MDR_TWO', 'Major District Road - MDR (Two Lane 7.50 m)'],
    ['SH', 'State Highway (Two Lane 7.50 m)'],
    ['NH', 'National Highway (Two Lane 7.50 m)'],
  ];

  const GROUPS = [
    ['Crossing type & hydrology', true, { step: 1, note: 'IRC:SP:13 hydrology for natural streams or hydraulic particulars for canals.' }, [
      ['crossingType', 'Crossing type', '', [['stream', 'Natural Stream / Drainage Nala'], ['canal', 'Irrigation Canal']]],
      // Stream Hydrology
      ['floodMode', 'Flood discharge estimation', '', [['catchment', "From catchment area (Empirical formula)"], ['given', 'Enter observed / approved MFD']]],
      ['catchmentFormula', 'Empirical formula', '', [['ryves', "Ryves' formula Q = C * A^(2/3) (South India)"], ['dicken', "Dicken's formula Q = C * A^(3/4)"], ['rational', "Rational formula Q = 0.278 * C * I * A"]]],
      ['catchment', 'Catchment area (A)', 'sq.km', 0.05],
      ['formulaC', "Formula coefficient C", '', 0.1],
      ['rainIntensity', 'Rainfall intensity (I)', 'mm/hr', 1],
      ['runoffCoeff', 'Runoff coefficient (C)', '', 0.05],
      ['mfdGiven', 'Maximum flood discharge (MFD)', 'cumecs', 0.1],
      ['streamBed', 'Deep bed level of stream at crossing', 'm', 0.01],
      ['streamBedWidth', 'Stream bed width', 'm', 0.1],
      ['streamSideSlope', 'Stream bank side slope (H:1)', '', 0.25],
      ['streamFall', 'Stream longitudinal slope 1 in', '', 50],
      ['streamN', "Stream Manning's roughness n", '', 0.005],
      ['hflGiven', 'High Flood Level HFL (0 = auto from Manning)', 'm', 0.01],
      // Canal HPs (when crossingType === 'canal')
      ['Qc', 'Canal discharge', 'cumecs', 0.05],
      ['canalBedW', 'Canal bed width', 'm', 0.05],
      ['canalFsd', 'Canal full supply depth (FSD)', 'm', 0.01],
      ['canalSideSlope', 'Canal side slope (H:1)', '', 0.25],
      ['canalFB', 'Canal free board', 'm', 0.05],
      ['canalCbl', 'Canal bed level (CBL)', 'm', 0.01],
      ['canalBedFall', 'Canal bed fall 1 in', '', 100],
    ]],

    ['Culvert ventway & roadway', true, { step: 2, note: 'Standard vent spans (IRC:SP:13) and roadway classification.' }, [
      ['span', 'Clear span of vent', 'm', SPANS],
      ['nVents', 'Number of vents', 'Nos', [[1, '1 Vent (Single Span)'], [2, '2 Vents (Twin Vent with Pier)'], [3, '3 Vents (Triple Vent)'], [4, '4 Vents']]],
      ['pierW', 'Pier width (if multi-vent)', 'm', 0.05],
      ['roadType', 'Road category', '', ROAD_TYPES],
      ['carriageway', 'Carriageway width', 'm', [[4.25, '4.25 m (Single lane + kerbs)'], [5.50, '5.50 m (Intermediate lane)'], [7.50, '7.50 m (Two lane IRC 5 standard)'], [8.50, '8.50 m (Two lane + footpaths)']]],
      ['edgeType', 'Edge protection', '', [['crash', 'RCC Crash Barrier (MORTH standard)'], ['railing', 'RCC Kerb + MS / Pipe Hand Railing (SD/202)']]],
      ['frl', 'Proposed road level (FRL)', 'm', 0.01],
      ['gl', 'Ground level at approaches', 'm', 0.01],
      ['freeBoardAdopted', 'Minimum vertical clearance / freeboard', 'm', 0.05],
      ['foundationLevel', 'Foundation level adopted', 'm', 0.05],
      ['sbc', 'Safe bearing capacity (SBC)', 't/sqm', 0.5],
      ['soilType', 'Bed strata (sets silt factor f)', '', [['', 'Choose bed material…'], ['0.5', 'Very fine silt (f = 0.50)'], ['0.7', 'Silt / clay (f = 0.70)'], ['1.0', 'Fine sand (f = 1.00)'], ['1.25', 'Medium sand (f = 1.25)'], ['1.75', 'Coarse sand (f = 1.75)'], ['2.5', 'Gravelly sand (f = 2.50)'], ['4.75', 'Hard boulders (f = 4.75)']]],
      ['siltFactor', 'Lacey silt factor f', '', 0.05],
      ['frlNote', 'FRL justification note', '', 'text'],
    ]],

    ['IRC:SP:13 Bed protection & materials', true, { step: 3, note: 'Drop / curtain walls and flooring per IRC:SP:13 Section 11.' }, [
      ['bedProtection', 'IRC:SP:13 Bed protection (curtain walls + floor)', '', YN],
      ['curtainDepthUs', 'U/S curtain wall depth below bed', 'm', 0.1],
      ['curtainDepthDs', 'D/S curtain wall depth below bed', 'm', 0.1],
      ['curtainThk', 'Curtain wall thickness (CC M15)', 'm', 0.05],
      ['floorThk', 'Bed flooring thickness (CC M15)', 'm', 0.025],
      ['packingThk', 'Dry stone packing under flooring', 'm', 0.025],
      ['apronLenUs', 'U/S flexible apron length (boulders)', 'm', 0.5],
      ['apronLenDs', 'D/S flexible apron length (boulders)', 'm', 0.5],
      ['apronThk', 'Boulder apron thickness', 'm', 0.05],
      ['fck', 'Deck concrete grade', '', [[25, 'M25'], [30, 'M30'], [35, 'M35']]],
      ['fy', 'Reinforcement steel grade', '', [[415, 'Fe415'], [500, 'Fe500 (TMT)'], [550, 'Fe550']]],
      ['subFck', 'Substructure concrete (plain concrete)', '', [[15, 'CC M15 with plums'], [20, 'CC M20 with plums']]],
      ['method', 'Deck design standard', '', [['WSM', 'IRC 21:2000 Working Stress Method'], ['LSM', 'IRC 112:2020 Limit State Method']]],
      ['exposure', 'Environmental exposure', '', [['moderate', 'Moderate (40 mm cover)'], ['severe', 'Severe (45 mm cover)']]],
    ]],

    ['Project details', false, { step: 4, note: 'Authority metadata for reports, drawings and estimate.' }, [
      ['chainage', 'Chainage (Km)', '', 'text'],
      ['waterwayName', 'Stream / Nala / Canal Name', '', 'text'],
      ['location', 'Village / Mandal', '', 'text'],
      ['district', 'District', '', 'text'],
      ['state', 'Government', '', 'text'],
      ['department', 'Department', '', 'text'],
      ['subDivision', 'Sub-division', '', 'text'],
      ['division', 'Division', '', 'text'],
    ]],

    ['Deck slab & rebar detailing', false, { adv: true }, [
      ['deckAuto', 'Deck slab & bar sizing', '', [['yes', 'Auto - code-optimized least steel (recommended)'], ['no', 'Manual input']]],
      ['minD', 'Minimum slab thickness', 'm', 0.025],
      ['D', 'Slab thickness D', 'm', 0.025],
      ['wc', 'Wearing coat thickness', 'm', 0.005],
      ['mainDia', 'Main bar diameter', 'mm', 1],
      ['mainSpacing', 'Main bar spacing', 'mm', 5],
      ['distDia', 'Distribution bar diameter', 'mm', 1],
      ['distSpacing', 'Distribution bar spacing', 'mm', 5],
      ['topDia', 'Top nominal mesh bar dia', 'mm', 1],
      ['topSpacing', 'Top mesh bar spacing', 'mm', 10],
      ['cover', 'Clear cover to steel', 'm', 0.005],
      ['bearingW', 'Bearing width on abutment', 'm', 0.025],
      ['skew', 'Skew angle (deg)', 'deg', 1],
    ]],

    ['Abutments, piers & wing walls', false, { adv: true }, [
      ['abAuto', 'Substructure sizing', '', [['yes', 'Auto - least passing gravity section (recommended)'], ['no', 'Manual input']]],
      ['abTopW', 'Abutment top width', 'm', 0.05],
      ['abFrontBatter', 'Abutment front batter', 'm', 0.05],
      ['abBackBatter', 'Abutment back batter', 'm', 0.05],
      ['abToe', 'Abutment footing toe', 'm', 0.05],
      ['abHeel', 'Abutment footing heel', 'm', 0.05],
      ['footingT', 'Footing thickness', 'm', 0.05],
      ['wingType', 'Wing wall layout', '', [['splayed', '45° Splayed Wing Walls (standard for streams)'], ['return', 'Straight Return Walls (standard for canals)']]],
      ['wingLen', 'Wing wall length', 'm', 0.1],
      ['wTopW', 'Wing wall top width', 'm', 0.05],
      ['wFrontBatter', 'Wing wall front batter', 'm', 0.05],
      ['wBaseW', 'Wing wall base width', 'm', 0.05],
      ['wToe', 'Wing wall footing toe', 'm', 0.05],
      ['wHeel', 'Wing wall footing heel', 'm', 0.05],
      ['wFootT', 'Wing footing thickness', 'm', 0.05],
      ['pierBatter', 'Pier batter each face', 'm', 0.02],
      ['pierToe', 'Pier footing projection', 'm', 0.05],
      ['phi', 'Backfill friction angle phi', 'deg', 1],
      ['gammaSoil', 'Soil unit weight', 't/cum', 0.05],
      ['mu', 'Base friction factor (concrete/soil)', '', 0.02],
      ['surcharge', 'Live load surcharge equivalent fill', 'm', 0.1],
    ]],
  ];

  const SHOW_IF = {
    // Stream vs Canal
    floodMode: (s) => s.crossingType === 'stream',
    catchmentFormula: (s) => s.crossingType === 'stream' && s.floodMode === 'catchment',
    catchment: (s) => s.crossingType === 'stream' && s.floodMode === 'catchment',
    formulaC: (s) => s.crossingType === 'stream' && s.floodMode === 'catchment' && s.catchmentFormula !== 'rational',
    rainIntensity: (s) => s.crossingType === 'stream' && s.floodMode === 'catchment' && s.catchmentFormula === 'rational',
    runoffCoeff: (s) => s.crossingType === 'stream' && s.floodMode === 'catchment' && s.catchmentFormula === 'rational',
    mfdGiven: (s) => s.crossingType === 'stream' && s.floodMode === 'given',
    streamBed: (s) => s.crossingType === 'stream',
    streamBedWidth: (s) => s.crossingType === 'stream',
    streamSideSlope: (s) => s.crossingType === 'stream',
    streamFall: (s) => s.crossingType === 'stream',
    streamN: (s) => s.crossingType === 'stream',
    hflGiven: (s) => s.crossingType === 'stream',

    Qc: (s) => s.crossingType === 'canal',
    canalBedW: (s) => s.crossingType === 'canal',
    canalFsd: (s) => s.crossingType === 'canal',
    canalSideSlope: (s) => s.crossingType === 'canal',
    canalFB: (s) => s.crossingType === 'canal',
    canalCbl: (s) => s.crossingType === 'canal',
    canalBedFall: (s) => s.crossingType === 'canal',

    // Multi-vent
    pierW: (s) => s.nVents > 1,
    pierBatter: (s) => s.nVents > 1,
    pierToe: (s) => s.nVents > 1,

    // Bed protection
    curtainDepthUs: (s) => s.bedProtection !== 'no',
    curtainDepthDs: (s) => s.bedProtection !== 'no',
    curtainThk: (s) => s.bedProtection !== 'no',
    floorThk: (s) => s.bedProtection !== 'no',
    packingThk: (s) => s.bedProtection !== 'no',
    apronLenUs: (s) => s.bedProtection !== 'no',
    apronLenDs: (s) => s.bedProtection !== 'no',
    apronThk: (s) => s.bedProtection !== 'no',

    // Auto
    D: (s) => s.deckAuto === 'no',
    mainSpacing: (s) => s.deckAuto === 'no',
    distSpacing: (s) => s.deckAuto === 'no',
    abBackBatter: (s) => s.abAuto === 'no',
    abToe: (s) => s.abAuto === 'no',
    abHeel: (s) => s.abAuto === 'no',
    wBaseW: (s) => s.abAuto === 'no',
  };

  const AUTO_FIELDS = {
    D: (s) => s.deckAuto !== 'no',
    mainDia: (s) => s.deckAuto !== 'no',
    mainSpacing: (s) => s.deckAuto !== 'no',
    distDia: (s) => s.deckAuto !== 'no',
    distSpacing: (s) => s.deckAuto !== 'no',
    abBackBatter: (s) => s.abAuto !== 'no',
    abToe: (s) => s.abAuto !== 'no',
    abHeel: (s) => s.abAuto !== 'no',
    wBaseW: (s) => s.abAuto !== 'no',
  };

  const STD_NOTE = {
    span: 'Standard IRC:SP:13 culvert spans (1.0 to 6.0 m)',
    curtainDepthUs: 'IRC:SP:13 Section 11: minimum 1.20 to 1.50 m below stream bed',
    curtainDepthDs: 'IRC:SP:13 Section 11: minimum 1.50 to 2.00 m below stream bed (scour prevention)',
    floorThk: '150 mm CC M15 bed flooring over 150 mm stone packing between abutments',
    apronLenDs: 'Flexible boulder apron downstream to dissipate exit turbulence',
    wc: 'Standard 75 mm concrete wearing coat (IRC SP:13 / MORTH)',
    sbc: 'Safe bearing capacity of soil at foundation level',
    formulaC: 'Ryves C: 6.8 to 8.5 (plains), 8.5 to 10.2 (plateau/hills)',
  };

  function onChoice(state, key) {
    if (key === 'crossingType') {
      if (state.crossingType === 'stream') {
        state.waterwayName = state.waterwayName || 'Natural Stream';
        state.wingType = 'splayed';
      } else {
        state.waterwayName = state.waterwayName || 'Canal Minor';
        state.wingType = 'return';
      }
      return true;
    }
    if (key === 'roadType') {
      if (state.roadType.includes('VILLAGE') || state.roadType.includes('ODR')) state.carriageway = 4.25;
      else if (state.roadType.includes('INT')) state.carriageway = 5.50;
      else state.carriageway = 7.50;
      return true;
    }
    if (key === 'catchmentFormula') {
      state.formulaC = state.catchmentFormula === 'ryves' ? 8.5 : 14.0;
      return true;
    }
    if (key === 'soilType' && state.soilType) {
      state.siltFactor = Number(state.soilType);
      return true;
    }
    return ['crossingType', 'roadType', 'catchmentFormula', 'floodMode', 'fck', 'fy', 'subFck', 'soilType', 'nVents', 'bedProtection'].includes(key);
  }

  // ------------------------------------------------------------ Live Cross-Section Drawer (SVG)
  function renderXSec(cur) {
    const { p, R } = cur;
    const isStream = p.crossingType === 'stream';
    const bedLevel = isStream ? p.streamBed : p.cblC;
    const waterLevel = R.hfl;
    const frl = p.frl;
    const fdn = p.foundationLevel;
    const nV = p.nVents;
    const span = p.span;
    const pierW = nV > 1 ? p.pierW : 0;
    const totalOpening = nV * span + (nV - 1) * pierW;

    const W_view = Math.max(16, totalOpening + 14);
    const H_view = Math.max(9, (frl - fdn) + 4.5);
    const originX = W_view / 2;
    const originY = 2.5;

    const scaleX = 38;
    const scaleY = 38;

    const toY = (lvl) => originY + (frl - lvl) * scaleY;
    const toX = (dist) => originX + dist * scaleX;

    const svgW = W_view * scaleX;
    const svgH = H_view * scaleY;

    let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%" style="font-family:var(--f-mono,monospace);">`;
    svg += `<defs>
      <pattern id="soil-pat" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 12 L12 0 M6 12 L12 6 M0 6 L6 0" stroke="rgba(125,211,252,0.12)" stroke-width="1"/></pattern>
      <pattern id="stone-pat" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="3" fill="none" stroke="rgba(251,191,36,0.3)"/><circle cx="12" cy="12" r="3" fill="none" stroke="rgba(251,191,36,0.3)"/></pattern>
    </defs>`;

    const groundY = toY(p.gl);
    const fdnY = toY(fdn);
    svg += `<rect x="0" y="${groundY}" width="${svgW}" height="${svgH - groundY}" fill="url(#soil-pat)"/>`;

    const halfRoad = (p.carriageway + 2 * R.edgeW) / 2;
    const roadY = toY(frl);

    const halfVentway = totalOpening / 2;
    const bedLeftX = toX(-halfVentway - 1.5);
    const bedRightX = toX(halfVentway + 1.5);
    const bedY = toY(bedLevel);

    svg += `<polygon points="${toX(-W_view / 2 + 1)},${toY(p.gl)} ${bedLeftX},${bedY} ${bedRightX},${bedY} ${toX(W_view / 2 - 1)},${toY(p.gl)} ${toX(W_view / 2 - 1)},${svgH} ${toX(-W_view / 2 + 1)},${svgH}" fill="rgba(13,32,68,0.7)"/>`;

    if (yes(p.bedProtection)) {
      const flrThkPx = p.floorThk * scaleY;
      const flrTopY = bedY;
      const flrL = toX(-halfVentway);
      const flrR = toX(halfVentway);

      svg += `<rect x="${flrL}" y="${flrTopY}" width="${flrR - flrL}" height="${flrThkPx}" fill="#38bdf8" fill-opacity="0.25" stroke="#38bdf8" stroke-width="1.2"/>`;
      svg += `<text x="${(flrL + flrR) / 2}" y="${flrTopY + flrThkPx - 2}" text-anchor="middle" fill="#7dd3fc" font-size="10">CC M15 BED FLOORING (150 mm)</text>`;

      const curtUsDepthPx = p.curtainDepthUs * scaleY;
      const curtThkPx = p.curtainThk * scaleX;
      svg += `<rect x="${flrL - curtThkPx}" y="${flrTopY}" width="${curtThkPx}" height="${curtUsDepthPx}" fill="#0284c7" fill-opacity="0.6" stroke="#38bdf8" stroke-width="1.2"/>`;
      svg += `<text x="${flrL - curtThkPx / 2}" y="${flrTopY + curtUsDepthPx + 12}" text-anchor="middle" fill="#38bdf8" font-size="9">U/S CURTAIN (${fmt(p.curtainDepthUs, 1)} m)</text>`;

      const curtDsDepthPx = p.curtainDepthDs * scaleY;
      svg += `<rect x="${flrR}" y="${flrTopY}" width="${curtThkPx}" height="${curtDsDepthPx}" fill="#0284c7" fill-opacity="0.6" stroke="#38bdf8" stroke-width="1.2"/>`;
      svg += `<text x="${flrR + curtThkPx / 2}" y="${flrTopY + curtDsDepthPx + 12}" text-anchor="middle" fill="#38bdf8" font-size="9">D/S CURTAIN (${fmt(p.curtainDepthDs, 1)} m)</text>`;

      const aprLenUsPx = p.apronLenUs * scaleX;
      const aprLenDsPx = p.apronLenDs * scaleX;
      svg += `<rect x="${flrL - curtThkPx - aprLenUsPx}" y="${flrTopY}" width="${aprLenUsPx}" height="${p.apronThk * scaleY}" fill="url(#stone-pat)" stroke="#f59e0b" stroke-width="1"/>`;
      svg += `<rect x="${flrR + curtThkPx}" y="${flrTopY}" width="${aprLenDsPx}" height="${p.apronThk * scaleY}" fill="url(#stone-pat)" stroke="#f59e0b" stroke-width="1"/>`;
    }

    const soffitY = toY(R.soffit);
    const abTopWPx = p.abTopW * scaleX;
    const abBackBatterPx = p.abBackBatter * scaleX;
    const abToePx = p.abToe * scaleX;
    const abHeelPx = p.abHeel * scaleX;
    const fdnThkPx = p.footingT * scaleY;

    // Left Abutment
    const leftAbInnerFaceX = toX(-halfVentway);
    const leftAbTopOuterX = leftAbInnerFaceX - abTopWPx;
    const leftAbBaseOuterX = leftAbTopOuterX - abBackBatterPx;
    const leftFootingInnerX = leftAbInnerFaceX + abToePx;
    const leftFootingOuterX = leftAbBaseOuterX - abHeelPx;

    svg += `<polygon points="${leftAbInnerFaceX},${soffitY} ${leftAbTopOuterX},${soffitY} ${leftAbBaseOuterX},${fdnY - fdnThkPx} ${leftAbInnerFaceX},${fdnY - fdnThkPx}" fill="#1e293b" stroke="#7dd3fc" stroke-width="1.5"/>`;
    svg += `<rect x="${leftFootingOuterX}" y="${fdnY - fdnThkPx}" width="${leftFootingInnerX - leftFootingOuterX}" height="${fdnThkPx}" fill="#0f172a" stroke="#7dd3fc" stroke-width="1.5"/>`;
    svg += `<rect x="${leftAbInnerFaceX - p.bearingW * scaleX}" y="${soffitY}" width="${p.bearingW * scaleX}" height="${p.bedBlockT * scaleY}" fill="#334155" stroke="#7dd3fc" stroke-width="1"/>`;

    // Right Abutment
    const rightAbInnerFaceX = toX(halfVentway);
    const rightAbTopOuterX = rightAbInnerFaceX + abTopWPx;
    const rightAbBaseOuterX = rightAbTopOuterX + abBackBatterPx;
    const rightFootingInnerX = rightAbInnerFaceX - abToePx;
    const rightFootingOuterX = rightAbBaseOuterX + abHeelPx;

    svg += `<polygon points="${rightAbInnerFaceX},${soffitY} ${rightAbTopOuterX},${soffitY} ${rightAbBaseOuterX},${fdnY - fdnThkPx} ${rightAbInnerFaceX},${fdnY - fdnThkPx}" fill="#1e293b" stroke="#7dd3fc" stroke-width="1.5"/>`;
    svg += `<rect x="${rightFootingInnerX}" y="${fdnY - fdnThkPx}" width="${rightFootingOuterX - rightFootingInnerX}" height="${fdnThkPx}" fill="#0f172a" stroke="#7dd3fc" stroke-width="1.5"/>`;
    svg += `<rect x="${rightAbInnerFaceX}" y="${soffitY}" width="${p.bearingW * scaleX}" height="${p.bedBlockT * scaleY}" fill="#334155" stroke="#7dd3fc" stroke-width="1"/>`;

    // Piers
    if (nV > 1) {
      for (let v = 1; v < nV; v++) {
        const pierCenterX = toX(-halfVentway + v * span + (v - 0.5) * pierW);
        const pWPx = pierW * scaleX;
        const pL = pierCenterX - pWPx / 2;
        const pToePx = p.pierToe * scaleX;
        svg += `<rect x="${pL}" y="${soffitY}" width="${pWPx}" height="${fdnY - fdnThkPx - soffitY}" fill="#1e293b" stroke="#7dd3fc" stroke-width="1.5"/>`;
        svg += `<rect x="${pL - pToePx}" y="${fdnY - fdnThkPx}" width="${pWPx + 2 * pToePx}" height="${fdnThkPx}" fill="#0f172a" stroke="#7dd3fc" stroke-width="1.5"/>`;
        svg += `<rect x="${pL}" y="${soffitY}" width="${pWPx}" height="${p.bedBlockT * scaleY}" fill="#334155" stroke="#7dd3fc" stroke-width="1"/>`;
      }
    }

    // Deck Slab & Road
    const deckLeftX = leftAbInnerFaceX - p.bearingW * scaleX;
    const deckRightX = rightAbInnerFaceX + p.bearingW * scaleX;
    const slabThkPx = p.D * scaleY;
    const wcThkPx = p.wc * scaleY;

    svg += `<rect x="${deckLeftX}" y="${soffitY - slabThkPx}" width="${deckRightX - deckLeftX}" height="${slabThkPx}" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="2"/>`;
    svg += `<rect x="${deckLeftX}" y="${roadY}" width="${deckRightX - deckLeftX}" height="${wcThkPx}" fill="#475569" stroke="#94a3b8" stroke-width="1"/>`;

    const edgeWPx = R.edgeW * scaleX;
    const edgeHPx = (p.edgeType === 'crash' ? 0.85 : p.kerbH) * scaleY;
    svg += `<rect x="${deckLeftX}" y="${roadY - edgeHPx}" width="${edgeWPx}" height="${edgeHPx}" fill="#0369a1" stroke="#38bdf8" stroke-width="1.2"/>`;
    svg += `<rect x="${deckRightX - edgeWPx}" y="${roadY - edgeHPx}" width="${edgeWPx}" height="${edgeHPx}" fill="#0369a1" stroke="#38bdf8" stroke-width="1.2"/>`;

    const waterY = toY(waterLevel);
    svg += `<line x1="${toX(-W_view / 2 + 1)}" y1="${waterY}" x2="${toX(W_view / 2 - 1)}" y2="${waterY}" stroke="#22d3ee" stroke-width="2" stroke-dasharray="6 3"/>`;
    svg += `<text x="${toX(halfVentway + 0.3)}" y="${waterY - 4}" fill="#22d3ee" font-size="11" font-weight="bold">${isStream ? 'HFL' : 'FSL'} +${fmt(waterLevel, 3)} m</text>`;

    svg += `<text x="${(deckLeftX + deckRightX) / 2}" y="${roadY - 6}" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="bold">FRL +${fmt(frl, 3)} m (${p.roadType})</text>`;
    svg += `<text x="${toX(0)}" y="${soffitY - slabThkPx / 2 + 4}" text-anchor="middle" fill="#e0f2fe" font-size="11" font-weight="bold">RCC SLAB D=${fmt(p.D * 1000, 0)} mm (${p.mainDia} mm @ ${p.mainSpacing})</text>`;
    svg += `<text x="${toX(0)}" y="${bedY + 20}" text-anchor="middle" fill="#94a3b8" font-size="10">${isStream ? 'STREAM BED' : 'CBL'} +${fmt(bedLevel, 3)} m</text>`;
    svg += `<text x="${toX(0)}" y="${fdnY + 14}" text-anchor="middle" fill="#64748b" font-size="10">FOUNDATION LEVEL +${fmt(fdn, 3)} m</text>`;

    svg += `<line x1="${leftAbInnerFaceX}" y1="${soffitY + 18}" x2="${rightAbInnerFaceX}" y2="${soffitY + 18}" stroke="#f59e0b" stroke-width="1.2"/>`;
    svg += `<text x="${toX(0)}" y="${soffitY + 15}" text-anchor="middle" fill="#f59e0b" font-size="10" font-weight="bold">${nV} VENT${nV > 1 ? 'S' : ''} x ${fmt(span, 2)} m CLEAR SPAN</text>`;

    svg += '</svg>';
    return svg;
  }

  // ------------------------------------------------------------ BBS for Slab Culvert
  function bbs(cur) {
    const { p, R } = cur;
    const { unitWt, nBars } = BD;
    const c = p.cover;
    const B = R.B;
    const L = R.deckL;
    const D = p.D;
    const rows = [];
    const add = (member, desc, dia, sp, shape, len, nb, nm) => {
      const tl = len * nb * nm, w = unitWt ? unitWt(dia) : (dia * dia) / 162;
      rows.push({ member, desc, dia, sp, shape, len: r3(len), nb, nm, tl: r2(tl), w: r3(w), kg: r2(tl * w) });
    };

    const anc = (dia) => (45 * dia) / 1000;
    const memName = `Deck Slab (${fmt(L, 2)} x ${fmt(B, 2)} x ${fmt(D, 3)} m)`;

    // 1. Main tensile steel (bottom)
    const lenMain = L - 2 * c + 2 * anc(p.mainDia);
    const nbMain = nBars ? nBars(B, p.mainSpacing / 1000) : Math.ceil(B / (p.mainSpacing / 1000)) + 1;
    add(memName, 'Bottom main tensile bars (straight + hooks)', p.mainDia, p.mainSpacing / 1000, `Straight with hooks L=${fmt(lenMain, 2)} m`, lenMain, nbMain, R.nV || 1);

    // 2. Distribution steel
    const lenDist = B - 2 * c;
    const nbDist = nBars ? nBars(L, p.distSpacing / 1000) : Math.ceil(L / (p.distSpacing / 1000)) + 1;
    add(memName, 'Distribution bars across carriageway', p.distDia, p.distSpacing / 1000, `Straight L=${fmt(lenDist, 2)} m`, lenDist, nbDist, R.nV || 1);

    // 3. Top nominal mesh
    const nbTopL = nBars ? nBars(B, p.topSpacing / 1000) : Math.ceil(B / (p.topSpacing / 1000)) + 1;
    const nbTopT = nBars ? nBars(L, p.topSpacing / 1000) : Math.ceil(L / (p.topSpacing / 1000)) + 1;
    add(memName, 'Top nominal mesh longitudinal bars', p.topDia, p.topSpacing / 1000, `Straight L=${fmt(lenMain, 2)} m`, lenMain, nbTopL, R.nV || 1);
    add(memName, 'Top nominal mesh transverse bars', p.topDia, p.topSpacing / 1000, `Straight L=${fmt(lenDist, 2)} m`, lenDist, nbTopT, R.nV || 1);

    // 4. Kerb / Crash barrier reinforcement
    const lenStirrup = 2 * (R.edgeW + p.kerbH);
    const nbKerbStirrups = Math.ceil(L / 0.20) * 2;
    add('Kerbs & Barriers', 'Kerb stirrups 10 mm @ 200 mm c/c', 10, 0.20, 'Closed stirrup', lenStirrup, nbKerbStirrups, 1);
    add('Kerbs & Barriers', 'Longitudinal bars in kerbs (4 Nos per side)', 12, 0, 'Straight', L, 8, 1);

    const total = r2(rows.reduce((s, r) => s + r.kg, 0));
    const byDia = {};
    for (const r of rows) byDia[r.dia] = r2((byDia[r.dia] || 0) + r.kg);
    return { rows, total, byDia };
  }

  // ------------------------------------------------------------ Estimates (Telangana / AP SSR 2026-27)
  function estimate(cur, opts = {}) {
    const { p, R } = cur;
    const nV = p.nVents;
    const B = R.B;
    const L = R.deckL;
    const Htotal = R.Htotal;
    const footingW = R.footingW;
    const fdnT = p.footingT;
    const abTopW = p.abTopW;
    const abBaseW = R.abBaseW;
    const wingLen = p.wingLen;
    const b = bbs(cur);
    const apron = yes(p.bedProtection);
    const isStream = p.crossingType === 'stream';
    const bedLevel = isStream ? p.streamBed : p.cblC;

    const excDepthAb = r3(p.gl - p.foundationLevel);
    const excDepthW = excDepthAb;
    const abArea = ((abTopW + abBaseW) / 2) * R.Hstem;
    const abH = R.Hstem;
    const wAvg = (p.wTopW + p.wBaseW) / 2;

    const M = {
      exc: [
        ['For abutment foundations', 1, 2, B + 1.0, footingW + 0.6, excDepthAb],
        ...(nV > 1 ? [[`For pier foundations (${nV - 1} Nos)`, 1, nV - 1, B + 1.0, p.pierW + 2 * p.pierToe + 0.6, r3(bedLevel - p.foundationLevel)]] : []),
        ['For splayed wing wall foundations', 1, 4, wingLen + 0.6, p.wBaseW + 0.6, excDepthW],
        ...(apron ? [
          ['For CC bed flooring in ventway', 1, 1, R.totalWaterway, B, p.floorThk + p.packingThk],
          ['For upstream curtain wall', 1, 1, B + 2.0, p.curtainThk + 0.4, p.curtainDepthUs],
          ['For downstream curtain wall', 1, 1, B + 2.0, p.curtainThk + 0.4, p.curtainDepthDs],
        ] : []),
      ],
      pcc: [
        ['For abutment footing concrete', 1, 2, B, footingW, fdnT],
        ...(nV > 1 ? [[`For pier footing concrete (${nV - 1} Nos)`, 1, nV - 1, B, p.pierW + 2 * p.pierToe, fdnT]] : []),
        ['For wing wall footing concrete', 1, 4, wingLen, p.wBaseW + p.wToe + p.wHeel, p.wFootT],
        ...(apron ? [
          ['For upstream curtain wall (CC M15)', 1, 1, B + 2.0, p.curtainThk, p.curtainDepthUs],
          ['For downstream curtain wall (CC M15)', 1, 1, B + 2.0, p.curtainThk, p.curtainDepthDs],
        ] : []),
      ],
      lining: apron ? [
        ['CC M15 bed flooring in between abutments', 1, 1, R.totalWaterway, B, p.floorThk],
        ['Dry stone / boulder packing under bed flooring', 1, 1, R.totalWaterway, B, p.packingThk],
      ] : [],
      plum: [
        [`For gravity abutments (CC M15 with plums)`, 1, 2, B, r3(abArea / abH), r3(abH)],
        ...(nV > 1 ? [[`For piers (CC M15 with plums)`, 1, nV - 1, B, p.pierW, r3(R.Hstem)]] : []),
        [`For splayed wing walls (CC M15 with plums)`, 1, 4, wingLen, r3(wAvg), r3(R.Hstem * 0.8)],
      ],
      bedblock: [
        ['For bed blocks on abutments (CC M20)', 1, 2, B, p.bearingW, p.bedBlockT],
        ...(nV > 1 ? [[`For bed blocks on piers (${nV - 1} Nos)`, 1, nV - 1, B, p.pierW, p.bedBlockT]] : []),
      ],
      deck: [
        ['For RCC solid deck slab (M25)', 1, nV, L, B, p.D],
        ['For kerb walls / crash barriers', 1, 2 * nV, L, R.edgeW, p.kerbH],
        ['For approach slabs (3.5 m each side)', 1, 2, 3.50, B, 0.30],
      ],
      wc: [
        ['Wearing coat 75 mm over deck slab carriageway', 1, nV, L, p.carriageway, p.wc],
        ['Wearing coat over approach slabs', 1, 2, 3.50, p.carriageway, p.wc],
      ],
      rail: p.edgeType === 'railing' ? [['Hand railing on both sides of deck', 1, 2, L, 1, 1]] : [],
      crash: [],
    };

    return BD.priceEstimate(BD.EST_ITEMS, M, b, {
      typ: 'SLAB CULVERT',
      where: `Slab Culvert @ Km ${p.chainage} across ${p.waterwayName}`,
      nameOfWork: R.scope,
    }, opts);
  }

  // ------------------------------------------------------------ A2 Engineering Drawings
  function sheets(cur) {
    return [BD.sheet1(cur), BD.sheet2(cur)];
  }

  BD.CULVERTUI = {
    GROUPS,
    SHOW_IF,
    AUTO_FIELDS,
    STD_NOTE,
    onChoice,
    renderXSec,
    estimate,
    sheets,
    dwgHint: 'Sheet 1: Plan, Sectional Elevation with Bed Protection & Cut-offs. Sheet 2: Slab Reinforcement Details & BBS.',
  };
})(typeof window !== 'undefined' ? window : globalThis);
