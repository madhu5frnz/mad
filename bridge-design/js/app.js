/* UI: input form, live design, report / drawings / estimate views, exports. */
(function () {
  'use strict';
  const BD = window.BD;
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = BD.fmt;
  const STORE = 'bd-inputs-v1', RSTORE = 'bd-rates-v1';

  // [key, label, unit, step]; step = 'text' for text, or an array of
  // [value, label] pairs for a drop-down.
  const YN = [['yes', 'Yes'], ['no', 'No']];
  const GROUPS = [
    ['Hydraulic particulars (HPs)', true, { step: 1, note: 'Copy from the approved HP statement / L-section at the bridge chainage.' }, [
      ['Q', 'Discharge Q', 'cumecs', 0.001], ['bedWidth', 'Bed width', 'm', 0.001], ['fsd', 'Full supply depth', 'm', 0.001],
      ['sideSlope', 'Side slope (H:1)', '', 0.25], ['freeBoard', 'Free board', 'm', 0.01], ['bedFall', 'Bed fall 1 in', '', 100],
      ['manningN', "Manning's n", '', 0.001], ['cbl', 'Design CBL', 'm', 0.001], ['cblExisting', 'Existing CBL', 'm', 0.001],
      ['bankWidthL', 'Bank top width L', 'm', 0.1], ['bankWidthR', 'Bank top width R', 'm', 0.1],
    ]],
    ['Road, levels & soil', true, { step: 2, note: 'From the site survey and soil investigation. Levels in metres, without the + sign.' }, [
      ['nVents', 'Number of vents', 'Nos', 1], ['span', 'Clear span of each vent', 'm', 0.25],
      ['spanBasis', 'Span to cover canal width at', '', [['fsl', 'FSL (abutments at canal banks)'], ['tbl', 'TBL'], ['soffit', 'Soffit level (deep cut, abutments buried)']]], ['bermW', 'Berm width each side (0 = none)', 'm', 0.5],
      ['carriageway', 'Carriageway', 'm', 0.05], ['skew', 'Skew angle', 'deg', 1],
      ['frl', 'Road level (FRL)', 'm', 0.001], ['gl', 'Ground level', 'm', 0.001], ['foundationLevel', 'Foundation level', 'm', 0.05],
      ['sbc', 'Safe bearing capacity', 't/sqm', 0.5],
      ['soilType', 'Bed material (sets silt factor)', '', [['', 'Choose…'], ['0.5', 'Very fine silt (0.08 mm) f = 0.5'], ['0.7', 'Silt (0.15 mm) f = 0.7'], ['1.0', 'Fine sand / clayey (0.3 mm) f = 1.0'], ['1.25', 'Medium sand (0.5 mm) f = 1.25'], ['1.75', 'Coarse sand (1 mm) f = 1.75'], ['2.5', 'Gravelly sand (2 mm) f = 2.5'], ['4.75', 'Boulders / hard strata f = 4.75']]],
      ['siltFactor', 'Silt factor f', '', 0.05], ['phi', 'Backfill φ', 'deg', 1], ['gammaSoil', 'Soil unit weight', 't/cum', 0.1],
      ['mu', 'Friction (concrete/soil)', '', 0.05], ['apron', 'Floor protection (apron + lining)', '', YN],
      ['floorDepth', 'Foundation depth below floor protection', 'm', 0.05], ['affluxLimit', 'Permissible afflux', 'm', 0.01],
      ['frlNote', 'FRL note', '', 'text'],
    ]],
    ['Design standard & loading', true, { step: 3, note: 'Defaults follow IRC 6 / IRC 21 as in department type designs. Change them for your authority and site.' }, [
      ['method', 'Deck design method', '', [['WSM', 'IRC 21 WSM (type designs)'], ['LSM', 'IRC 112 LSM (current code)']]],
      ['fck', 'Deck concrete', '', [[20, 'M20'], [25, 'M25'], [30, 'M30'], [35, 'M35'], [40, 'M40']]],
      ['fy', 'Reinforcement', '', [[415, 'Fe415'], [500, 'Fe500'], [550, 'Fe550']]],
      ['exposure', 'Exposure (sets cover)', '', [['moderate', 'Moderate - 40 mm'], ['severe', 'Severe - 45 mm'], ['very severe', 'Very severe - 50 mm'], ['extreme', 'Extreme - 75 mm']]],
      ['subFck', 'Substructure concrete', '', [[15, 'CC M15'], [20, 'CC M20'], [25, 'CC M25']]],
      ['liveMode', 'Live load', '', [['auto', 'As per IRC 6 Table 6A'], ['manual', 'Choose classes']]],
      ['llA1', 'Class A, 1 lane', '', YN], ['llA2', 'Class A, 2 lanes', '', YN], ['llB', 'Class B', '', YN],
      ['ll70T', '70R tracked', '', YN], ['ll70W', '70R wheeled bogie', '', YN],
      ['edgeType', 'Deck edge', '', [['railing', 'Kerb + hand railing (SD/202)'], ['crash', 'RCC crash barrier (MORTH)']]],
      ['fpW', 'Footpath width each side (0 = none)', 'm', 0.25],
      ['seismicZone', 'Seismic zone', '', [['II', 'Zone II (Z 0.10)'], ['III', 'Zone III (Z 0.16)'], ['IV', 'Zone IV (Z 0.24)'], ['V', 'Zone V (Z 0.36)']]],
      ['seismicMode', 'Seismic check', '', [['auto', 'As per IRC 6 cl.219.1'], ['include', 'Always check'], ['exclude', 'Do not check']]],
      ['impFactor', 'Importance factor I', '', [[1.0, '1.0 normal'], [1.2, '1.2 important'], [1.5, '1.5 large / critical']]],
    ]],
    ['Project details', false, { step: 4, note: 'Printed on the drawings, report and estimate.' }, [
      ['chainage', 'Chainage (Km)', '', 'text'], ['canalName', 'Canal', '', 'text'],
      ['location', 'Place / village', '', 'text'], ['district', 'District', '', 'text'],
      ['project', 'Project', '', 'text'], ['state', 'Government', '', 'text'], ['department', 'Department', '', 'text'],
      ['subDivision', 'Sub-division', '', 'text'], ['division', 'Division', '', 'text'], ['roadType', 'Type of road', '', 'text'],
    ]],
    ['Deck slab & edge', false, { adv: true }, [
      ['deckAuto', 'Deck thickness & bars', '', [['yes', 'Auto - most economical (recommended)'], ['no', 'Enter my own']]],
      ['minD', 'Minimum slab thickness', 'm', 0.025], ['D', 'Slab thickness D', 'm', 0.025], ['wc', 'Wearing coat', 'm', 0.005], ['mainDia', 'Main bar dia', 'mm', 1],
      ['mainSpacing', 'Main bar spacing', 'mm', 5], ['distDia', 'Distribution dia', 'mm', 1], ['distSpacing', 'Distribution spacing', 'mm', 5],
      ['topDia', 'Top bar dia', 'mm', 1], ['topSpacing', 'Top bar spacing', 'mm', 5], ['cover', 'Clear cover', 'm', 0.005],
      ['bearingW', 'Bearing width', 'm', 0.01], ['maxSlabSpan', 'Max solid-slab span', 'm', 0.5],
      ['kerbW', 'Kerb width', 'm', 0.025], ['kerbH', 'Kerb height', 'm', 0.025], ['railingLoad', 'Railing load', 't/m', 0.01],
      ['barrierW', 'Crash barrier width', 'm', 0.025], ['barrierLoad', 'Crash barrier weight', 't/m', 0.05],
      ['fpThk', 'Footpath fill thickness', 'm', 0.025], ['fpLoad', 'Footpath live load', 't/sqm', 0.05],
      ['approachLen', 'Approach slab length', 'm', 0.5], ['approachThk', 'Approach slab thk', 'm', 0.025],
      ['scbc', 'σcbc (WSM)', 'N/mm²', 0.01], ['sst', 'σst (WSM)', 'N/mm²', 10], ['modRatio', 'Modular ratio', '', 1],
    ]],
    ['Abutment & piers', false, { adv: true }, [
      ['frontBatter', 'Front batter', 'm', 0.05], ['abTopW', 'Top width', 'm', 0.05], ['abBackBatter', 'Back batter', 'm', 0.05],
      ['abToe', 'Footing toe', 'm', 0.05], ['abHeel', 'Footing heel', 'm', 0.05], ['footingT', 'Footing thickness', 'm', 0.05],
      ['bedBlockT', 'Bed block thickness', 'm', 0.05], ['surcharge', 'LL surcharge height', 'm', 0.1],
      ['tempFriction', 'Bearing friction (temperature)', '', YN], ['bearingMu', 'Friction coefficient at bearing', '', 0.05], ['abKey', 'Shear key under abutment', '', YN], ['subAllow', 'Allowable compression', 't/sqm', 10], ['gammaConc', 'Unit wt of plain concrete', 't/cum', 0.05],
      ['pierTopW', 'Pier top width', 'm', 0.05], ['pierBatter', 'Pier batter each face', 'm', 0.05], ['pierToe', 'Pier footing projection', 'm', 0.05],
      ['saG', 'Seismic Sa/g', '', 0.1], ['respR', 'Response reduction R', '', 0.5],
    ]],
    ['Wing walls & canal protection', false, { adv: true }, [
      ['wTopW', 'Wing top width', 'm', 0.05], ['wFrontBatter', 'Wing front batter', 'm', 0.05], ['wBaseW', 'Wing base width', 'm', 0.1],
      ['wToe', 'Wing toe', 'm', 0.05], ['wHeel', 'Wing heel', 'm', 0.05], ['wFootT', 'Wing footing thk', 'm', 0.05],
      ['wingLen', 'Wing length', 'm', 0.1], ['keyW', 'Shear key width', 'm', 0.05], ['keyD', 'Shear key depth', 'm', 0.05],
      ['apronThk', 'Apron thickness', 'm', 0.025], ['liningLen', 'Lining length u/s & d/s', 'm', 1], ['liningThk', 'Lining thickness', 'm', 0.025],
    ]],
  ];
  // Fields shown only when relevant.
  const SHOW_IF = {
    llA1: (s) => s.liveMode === 'manual', llA2: (s) => s.liveMode === 'manual', llB: (s) => s.liveMode === 'manual',
    ll70T: (s) => s.liveMode === 'manual', ll70W: (s) => s.liveMode === 'manual',
    impFactor: (s) => s.seismicMode !== 'exclude',
    kerbW: (s) => s.edgeType !== 'crash', kerbH: (s) => s.edgeType !== 'crash', railingLoad: (s) => s.edgeType !== 'crash',
    barrierW: (s) => s.edgeType === 'crash', barrierLoad: (s) => s.edgeType === 'crash',
    minD: (s) => s.deckAuto !== 'no', fpThk: (s) => s.fpW > 0, fpLoad: (s) => s.fpW > 0,
    scbc: (s) => s.method !== 'LSM', sst: (s) => s.method !== 'LSM',
    pierTopW: (s) => s.nVents > 1, pierBatter: (s) => s.nVents > 1, pierToe: (s) => s.nVents > 1,
    bearingMu: (s) => s.tempFriction !== 'no', floorDepth: (s) => s.apron !== 'no', apronThk: (s) => s.apron !== 'no', liningLen: (s) => s.apron !== 'no', liningThk: (s) => s.apron !== 'no',
  };
  // Fields the tool fills in itself (read-only unless the designer overrides).
  const AUTO_FIELDS = {
    minD: () => false, D: (s) => s.deckAuto !== 'no', mainDia: (s) => s.deckAuto !== 'no', mainSpacing: (s) => s.deckAuto !== 'no',
    distDia: (s) => s.deckAuto !== 'no', distSpacing: (s) => s.deckAuto !== 'no',
  };
  // Where each standard (not calculated) value comes from.
  const STD_NOTE = {
    wc: 'Standard 75 mm (IRC SP:13 / MORTH; 65 mm min)', kerbW: 'IRC 5: min 225 mm', kerbH: 'Standard 300 mm (225 above road)',
    railingLoad: 'MORTH SD/202 RCC posts + pipes', bearingW: 'Bed block 500 mm - 20 mm joint', approachLen: 'Standard 3.5 m (MORTH type approach slab)',
    approachThk: 'Standard 300 mm', topDia: 'Nominal top mesh 10 @ 200', topSpacing: 'Nominal top mesh', 
    maxSlabSpan: 'MORTH standard solid slabs up to about 10 m', barrierW: 'MORTH crash barrier base 450 mm', barrierLoad: 'About 0.3 sqm x 2.5 t/cum',
    scbc: 'Follows concrete grade (IRC 21 Table 9)', sst: 'Follows steel grade (IRC 21 Table 10)', modRatio: 'IRC 21 cl.303.1: m = 10',
    cover: 'Follows exposure (IRC 112 Table 14.2)', surcharge: 'IRC 6 cl.214.1.1.3: 1.2 m', gammaConc: 'Plain concrete 2.4 t/cum',
    subAllow: 'Follows substructure grade (IS 456 Table 21)', saG: 'Rigid substructure: 2.5', respR: 'IRC 6 Table 20: 1.0',
    fpLoad: 'IRC 6 cl.206: 4-5 kN/sqm', bearingMu: 'Slab on bed block with kraft paper: 0.5', bermW: 'Berm at TBL level, as in deep cuttings', floorDepth: '1.0 m conservative; pitched & lined canals often 0.2-0.5 m', affluxLimit: 'Keep small so the canal is not constricted', apronThk: 'Total thickness of apron / lining + pitching', minD: 'Practical minimum for road bridge slabs (designer choice)',
  };

  // Code-derived values that follow a choice (IRC 21 Tables 9/10, IRC 112 Table 14.2, IS 456 Table 21).
  function onChoice(key) {
    if (key === 'fck') state.scbc = BD.scbcFor(Number(state.fck));
    if (key === 'fy') state.sst = BD.sstFor(Number(state.fy));
    if (key === 'exposure') state.cover = BD.COVER[state.exposure] || state.cover;
    if (key === 'subFck') state.subAllow = BD.subAllowFor(Number(state.subFck));
    if (key === 'soilType' && state.soilType) state.siltFactor = Number(state.soilType);
    if (key === 'method' && state.method === 'LSM' && Number(state.fck) < 25) { state.fck = 25; state.scbc = BD.scbcFor(25); }
    if (key === 'edgeType' || key === 'fpW' || key === 'nVents') return true;
    return ['fck', 'fy', 'exposure', 'subFck', 'soilType', 'method'].includes(key);
  }

  const KM1580 = { chainage: '1.580', cbl: 145.367, cblExisting: 145.235, frl: 147.09, gl: 146.526, foundationLevel: 144.1, wFrontBatter: 0.7, wBaseW: 2.2, frlNote: 'FRL adopted = avg top of existing Culvert-6 (Ch 1415).' };
  const EXAMPLES = {
    km0450: () => Object.assign({}, BD.DEFAULTS, { deckAuto: 'no', tempFriction: 'no' }),
    km1580: () => Object.assign({}, BD.DEFAULTS, KM1580, { deckAuto: 'no', tempFriction: 'no' }),
    dlrb: () => BD.autoDesign(Object.assign({}, BD.DEFAULTS, { bridgeType: 'DLRB', carriageway: 7.5 })).input,
    general: () => BD.autoDesign(Object.assign({}, BD.DEFAULTS, { bridgeType: 'DLRB', carriageway: 7.5, method: 'LSM', fck: 30, fy: 500, scbc: 10, sst: 240, exposure: 'severe', cover: 0.045, edgeType: 'crash', subFck: 20, subAllow: 500, seismicZone: 'III', frlNote: '' })).input,
    wide: () => BD.autoDesign(Object.assign({}, BD.DEFAULTS, { bridgeType: 'DLRB', carriageway: 7.5, edgeType: 'crash', Q: 30, bedWidth: 10, fsd: 1.8, freeBoard: 0.75, cbl: 145, cblExisting: 145, frl: 148.8, gl: 148, foundationLevel: 142.5, sbc: 40, phi: 30, chainage: '12.300', canalName: 'Main Canal', frlNote: '' })).input,
  };

  let state = Object.assign({}, BD.DEFAULTS, load(STORE) || {});
  let rates = load(RSTORE) || {};
  let cur = null, est = null;

  function load(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }

  // ---------------------------------------------------------------- form
  function buildForm() {
    const form = $('#form');
    form.innerHTML = '';
    let advBox = null;
    for (const [title, open, meta, fields] of GROUPS) {
      const det = document.createElement('details');
      det.open = open;
      det.className = meta.adv ? 'group adv' : 'group step';
      det.innerHTML = `<summary>${meta.step ? `<span class="stepno">${meta.step}</span>` : ''}<span class="gtitle">${title}</span></summary>` +
        (meta.note ? `<p class="gnote">${meta.note}</p>` : '') + '<div class="grid"></div>';
      const grid = det.querySelector('.grid');
      for (const [key, label, unit, step] of fields) {
        const isText = step === 'text', isSel = Array.isArray(step);
        const wrap = document.createElement('label');
        wrap.className = 'field' + (isText || (isSel && step.length > 4) ? ' wide' : '');
        wrap.dataset.field = key;
        const ctl = isSel
          ? `<select id="in-${key}" name="${key}" data-num="${typeof step[step.length - 1][0] === 'number' ? 1 : ''}">${step.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>`
          : `<input id="in-${key}" name="${key}" ${isText ? 'type="text"' : `type="number" step="${step}" inputmode="decimal"`}>`;
        wrap.innerHTML = `<span class="flabel">${label}${unit ? ` <em>${unit}</em>` : ''}</span>${ctl}<small class="hint-inline" data-hint="${key}"></small>`;
        grid.appendChild(wrap);
      }
      if (meta.adv) {
        if (!advBox) {
          advBox = document.createElement('div');
          advBox.className = 'advbox';
          advBox.innerHTML = '<div class="advhead"><span class="stepno ghost">5</span><div><b>Dimensions & detailed parameters</b><p class="gnote">Pre-filled with a standard section. Leave as is; <b>Auto design</b> sizes these to pass every check.</p></div></div>';
          form.appendChild(advBox);
        }
        advBox.appendChild(det);
      } else form.appendChild(det);
    }
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (!t.name) return;
      if (t.tagName === 'SELECT') return;
      state[t.name] = t.type === 'number' ? (t.value === '' ? state[t.name] : Number(t.value)) : t.value;
      if (t.name === 'fpW' || t.name === 'nVents') applyVisibility();
      schedule();
    });
    form.addEventListener('change', (e) => {
      const t = e.target;
      if (t.tagName !== 'SELECT' || !t.name) return;
      state[t.name] = t.dataset.num ? Number(t.value) : t.value;
      if (onChoice(t.name)) fillForm(); else applyVisibility();
      run();
    });
    form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-use]');
      if (!b) return;
      e.preventDefault();
      state[b.dataset.use] = Number(b.dataset.val);
      fillForm(); run();
    });
  }

  function applyVisibility() {
    for (const [k, f] of Object.entries(SHOW_IF)) {
      const el = document.querySelector(`[data-field="${k}"]`);
      if (el) el.hidden = !f(state);
    }
    for (const [k, f] of Object.entries(AUTO_FIELDS)) {
      const el = document.getElementById('in-' + k);
      if (!el) continue;
      const on = f(state);
      el.readOnly = on;
      el.closest('.field').classList.toggle('is-auto', on);
    }
  }

  function fillForm() {
    for (const el of $('#form').elements) if (el.name && state[el.name] != null) el.value = state[el.name];
    applyVisibility();
    document.querySelectorAll('.type-switch button').forEach((b) => b.classList.toggle('active', b.dataset.type === state.bridgeType));
  }

  let timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 150); }

  // ---------------------------------------------------------------- render
  let lastDeckKey = '';
  function run() {
    try {
      if (state.deckAuto === 'no') lastDeckKey = '';
      else {
        const key = JSON.stringify(Object.assign({}, state, { D: 0, mainDia: 0, mainSpacing: 0, distDia: 0, distSpacing: 0 }));
        if (key !== lastDeckKey) {
          lastDeckKey = key;
          const dk = BD.sizeDeck(state);
          if (dk) { Object.assign(state, dk); for (const k of ['D', 'mainDia', 'mainSpacing', 'distDia', 'distSpacing']) { const el = document.getElementById('in-' + k); if (el) el.value = state[k]; } }
        }
      }
      cur = BD.design(state);
      est = BD.estimate(cur, { rates });
    } catch (err) {
      $('#status').innerHTML = `<div class="fixbox">Could not compute: ${esc(err.message)}</div>`;
      return;
    }
    save(STORE, state);
    renderStatus(); renderHints(); renderReport(); renderEstimate();
    if (!$('#tab-drawings').hidden) renderDrawings(); else drawingsStale = true;
  }
  let drawingsStale = true;

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const val = (v) => (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : Math.abs(v) >= 1000 ? v.toFixed(2) : v.toFixed(3)) : esc(v));

  function renderStatus() {
    const fails = [];
    for (const s of cur.sections) for (const r of s.rows) if (r.check && !r.ok) fails.push(`${s.title.replace(/^\d+\.\s*/, '').split(' (')[0]}: ${r.label}`);
    const R = cur.R;
    const nChecks = cur.sections.reduce((n, s) => n + s.rows.filter((r) => r.check).length, 0);
    $('#xsec').innerHTML = sectionSVG();
    $('#xsec-title').textContent = `${R.typ} · Km ${state.chainage}`;
    $('#badge').className = 'badge ' + (fails.length ? 'bad' : 'ok');
    $('#badge').textContent = fails.length ? `${fails.length} of ${nChecks} checks need revision` : `All ${nChecks} design checks OK`;
    $('#kpis').innerHTML = `
        <div><span>Clear span</span><b>${fmt(state.span, 2)}<i>m</i></b><small>${fmt(R.B, 2)} m wide deck</small></div>
        <div><span>Deck slab</span><b>${fmt(state.D * 1000, 0)}<i>mm</i></b><small>${state.mainDia} dia @ ${state.mainSpacing} c/c</small></div>
        <div><span>Base pressure</span><b>${fmt(R.abWorst.pmax, 2)}<i>t/m²</i></b><small>SBC ${state.sbc} · FOS ${fmt(R.abWorst.fosO, 2)}</small></div>
        <div><span>Estimate</span><b>${est.lakhs.toFixed(2)}<i>lakhs</i></b><small>SSR 2026-27 + GST</small></div>`;
    $('#status').innerHTML =
      `<div class="gov"><span>Governing live load</span><b>${esc(R.govM.veh.name)}</b></div>` +
      (fails.length ? `<div class="fixbox"><b>What to fix</b><ul class="fails">${fails.map((f) => `<li>${esc(f)}</li>`).join('')}</ul><p>Press <b>Auto design</b> to size the deck, abutment and wing walls so every check passes.</p></div>` : '') +
      (cur.warnings.length ? `<ul class="warns">${cur.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : '');
  }

  // Blueprint cross-section across the canal (along the road), to scale.
  function sectionSVG() {
    const p = cur.p, R = cur.R;
    const s2 = p.span / 2, fb = p.frontBatter;
    const xf1 = s2 - fb + R.stemBase + p.abHeel;
    const ext = Math.max(xf1, s2 + p.abTopW + p.approachLen * 0.6) + 0.3;
    const top = p.frl + 1.35, bot = p.foundationLevel - 0.25;
    const W = 720, padL = 14, padR = 150;
    const k = Math.min((W - padL - padR) / (2 * ext), 360 / (top - bot));
    const Hh = Math.ceil((top - bot) * k + 16);
    const cx = padL + (W - padL - padR) / 2;
    const X = (x) => cx + x * k, Y = (l) => 8 + (top - l) * k;
    const pts = (a) => a.map(([x, l]) => `${X(x).toFixed(1)},${Y(l).toFixed(1)}`).join(' ');
    let g = `<defs>
      <linearGradient id="bpWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8" stop-opacity=".75"/><stop offset="1" stop-color="#0e7490" stop-opacity=".35"/></linearGradient>
      <pattern id="bpHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#7dd3fc" stroke-opacity=".28" stroke-width="1.2"/></pattern>
      <pattern id="bpSoil" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".9" fill="#94a3b8" fill-opacity=".35"/><circle cx="7" cy="8" r=".7" fill="#94a3b8" fill-opacity=".3"/></pattern>
      <filter id="bpGlow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;
    g += `<polygon class="bp-soil" points="${pts([[-ext, p.gl], [-R.topTBL / 2 - 0.4, p.gl], [-R.topTBL / 2, R.tbl], [-p.bedWidth / 2, p.cbl], [p.bedWidth / 2, p.cbl], [R.topTBL / 2, R.tbl], [R.topTBL / 2 + 0.4, p.gl], [ext, p.gl], [ext, bot], [-ext, bot]])}"/>`;
    const wf = R.topFSL / 2;
    g += `<polygon class="bp-water" points="${pts([[-wf, R.fsl], [wf, R.fsl], [p.bedWidth / 2, p.cbl], [-p.bedWidth / 2, p.cbl]])}"/>`;
    // animated ripple on the water surface
    const x0 = X(-wf), x1 = X(wf), yw = Y(R.fsl);
    let d = `M${x0.toFixed(1)},${yw.toFixed(1)}`;
    for (let x = x0; x < x1; x += 12) d += ` q3,-2.4 6,0 t6,0`;
    g += `<path class="bp-ripple" d="${d}"/>`;
    for (const sg of [-1, 1]) {
      const P = (a) => pts(a.map(([x, l]) => [sg * x, l]));
      g += `<polygon class="bp-conc" points="${P([[s2 - fb - p.abToe, p.foundationLevel], [xf1, p.foundationLevel], [xf1, R.ftgTop], [s2 - fb - p.abToe, R.ftgTop]])}"/>`;
      g += `<polygon class="bp-conc" points="${P([[s2 - fb, R.ftgTop], [s2, R.stemTop], [s2 + 0.5, R.stemTop], [s2 + 0.5, R.deckTop], [s2 + p.abTopW, R.deckTop], [s2 + p.abTopW + p.abBackBatter, R.ftgTop]])}"/>`;
      g += `<polygon class="bp-rcc" points="${P([[s2 + p.abTopW, R.approachBot], [ext, R.approachBot], [ext, R.deckTop], [s2 + p.abTopW, R.deckTop]])}"/>`;
      // railing posts
      for (const xp of [s2 + p.bearingW - 0.12, s2 * 0.35]) g += `<line class="bp-rail" x1="${X(sg * xp)}" y1="${Y(p.frl)}" x2="${X(sg * xp)}" y2="${Y(p.frl + 0.75)}"/>`;
    }
    g += `<line class="bp-rail" x1="${X(-s2 - p.bearingW)}" y1="${Y(p.frl + 0.55)}" x2="${X(s2 + p.bearingW)}" y2="${Y(p.frl + 0.55)}"/>`;
    g += `<line class="bp-rail" x1="${X(-s2 - p.bearingW)}" y1="${Y(p.frl + 0.3)}" x2="${X(s2 + p.bearingW)}" y2="${Y(p.frl + 0.3)}"/>`;
    g += `<polygon class="bp-deck" filter="url(#bpGlow)" points="${pts([[-s2 - p.bearingW, R.soffit], [s2 + p.bearingW, R.soffit], [s2 + p.bearingW, R.deckTop], [-s2 - p.bearingW, R.deckTop]])}"/>`;
    g += `<line class="bp-road" x1="${X(-ext)}" y1="${Y(p.frl)}" x2="${X(ext)}" y2="${Y(p.frl)}"/>`;
    g += `<line class="bp-cl" x1="${X(0)}" y1="${Y(top) + 4}" x2="${X(0)}" y2="${Y(bot) - 2}"/>`;
    // level ladder
    const lv = [['FRL', p.frl], ['SOFFIT', R.soffit], ['TBL', R.tbl], ['FSL', R.fsl], ['CBL', p.cbl], ['FDN', p.foundationLevel]];
    let lastY = -99;
    const xl = X(ext) + 8;
    for (const [n, l] of lv) {
      const y = Y(l);
      const yt = Math.max(y, lastY + 15);
      lastY = yt;
      const cls = n === 'FSL' || n === 'CBL' ? 'bp-lv w' : n === 'SOFFIT' && !R.okSoffit ? 'bp-lv bad' : 'bp-lv';
      g += `<line class="bp-tick" x1="${X(-ext)}" y1="${y}" x2="${xl}" y2="${y}"/>`;
      g += `<path class="bp-tri" d="M${xl + 2},${yt - 3} l6,0 l-3,4 z"/>`;
      g += `<text class="${cls}" x="${xl + 12}" y="${yt + 4}"><tspan class="n">${n}</tspan> +${l.toFixed(3)}</text>`;
    }
    const yd = Y(p.frl + 0.75) - 10;
    g += `<g class="bp-dim"><line x1="${X(-s2)}" y1="${yd}" x2="${X(s2)}" y2="${yd}"/><line x1="${X(-s2)}" y1="${yd - 5}" x2="${X(-s2)}" y2="${yd + 5}"/><line x1="${X(s2)}" y1="${yd - 5}" x2="${X(s2)}" y2="${yd + 5}"/></g>`;
    g += `<text class="bp-dimt" x="${X(0)}" y="${yd - 6}" text-anchor="middle">${mmTxt(p.span)} CLEAR SPAN</text>`;
    g += `<text class="bp-cap" x="${X(0)}" y="${Y(p.cbl) + 16}" text-anchor="middle">CANAL · Q ${fmt(p.Q, 3)} cumecs</text>`;
    return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Cross-section of the bridge and canal with levels">${g}</svg>`;
  }
  const mmTxt = (m) => `${Math.round(m * 1000)}`;

  function renderHints() {
    const R = cur.R;
    const set = (k, html) => { const el = document.querySelector(`[data-hint="${k}"]`); if (el) el.innerHTML = html; };
    document.querySelectorAll('[data-hint]').forEach((el) => (el.innerHTML = ''));
    if (Math.abs(state.span - R.spanSuggested) > 1e-6) set('span', `Suggested ${fmt(R.spanSuggested, 2)} m (canal top width at FSL ${fmt(R.topFSL, 3)}) <button data-use="span" data-val="${R.spanSuggested}">use</button>`);
    else set('span', `= suggested from top width at FSL ${fmt(R.topFSL, 3)} m`);
    set('foundationLevel', `Must be at or below +${fmt(R.flSuggested)} (IRC 78 scour${state.apron !== 'no' ? ' / IRC SP:13 apron' : ''})${R.okFound ? '' : ` <button data-use="foundationLevel" data-val="${R.flSuggested.toFixed(3)}">use</button>`}`);
    if (R.ventsSuggested > state.nVents) set('nVents', `Canal ${fmt(R.topFSL, 2)} m wide at FSL > ${fmt(state.maxSlabSpan, 1)} m slab span: ${R.ventsSuggested} vents suggested <button data-use="nVents" data-val="${R.ventsSuggested}">use</button>`);
    set('seismicZone', R.seismic ? `Seismic check applied, Ah = ${fmt(R.Ah, 3)}` : 'Not required for this span / zone (IRC 6 cl.219.1)');
    set('liveMode', `Checking: ${R.vehicles.map((e) => e.veh.name.replace('IRC ', '')).join(', ')}`);
    set('method', state.method === 'LSM' ? 'IRC 112:2020; minimum M25 for RCC' : 'IRC 21:2000 as in department type designs');
    set('skew', state.skew > 20 ? 'Above 20°: needs skew slab analysis' : '');
    for (const [k, t] of Object.entries(STD_NOTE)) if (!document.querySelector(`[data-hint="${k}"]`)?.innerHTML) set(k, t);
    if (state.deckAuto !== 'no') {
      set('D', `Auto: least thickness passing all deck checks (d req ${fmt(R.dReq, 0)} mm)`);
      set('mainSpacing', `Auto: Ast req ${fmt(R.AstReq, 0)} / prov ${fmt(R.AstProv, 0)} sqmm/m`);
      set('distSpacing', 'Auto: widest spacing passing distribution check');
    }
    if (!R.okSoffit) set('frl', `Soffit below TBL – FRL ≥ +${fmt(R.frlMin)} <button data-use="frl" data-val="${R.frlMin.toFixed(3)}">use</button>`);
    set('carriageway', state.bridgeType === 'DLRB' ? 'IRC 5: 7.50 m two-lane' : 'IRC 5: 4.25 m single lane');
  }

  function renderReport() {
    const R = cur.R;
    let h = `<div class="doc"><h2>${esc(R.title)}</h2><p class="meta">${esc(R.subtitle)}</p><p class="meta">${esc(R.codes)} <span class="inp-key">Yellow = input</span></p>`;
    for (const s of cur.sections) {
      h += `<h3>${esc(s.title)}</h3><table class="calc"><tbody>`;
      for (const r of s.rows) {
        if (r.sub) { h += `<tr class="sub"><td colspan="4">${esc(r.label)}</td></tr>`; continue; }
        const cls = r.check ? (r.ok ? 'ok' : 'bad') : r.input ? 'inp' : '';
        h += `<tr><td>${esc(r.label)}</td><td class="v ${cls}">${val(r.value)}</td><td class="u">${esc(r.unit || '')}</td><td class="r">${esc(r.remark || '')}</td></tr>`;
      }
      h += '</tbody></table>';
    }
    h += `<p class="meta">${esc(R.assumptions)}</p>`;
    h += signBlock();
    h += '</div>';
    $('#report').innerHTML = h;
  }

  function signBlock() {
    return `<div class="signs"><div>Assistant Executive Engineer<br><small>${esc(state.subDivision)}</small></div><div>Dy. Executive Engineer<br><small>${esc(state.subDivision)}</small></div><div>Executive Engineer<br><small>${esc(state.division)}</small></div></div>`;
  }

  const inr = (n) => Math.round(n).toLocaleString('en-IN');
  function renderEstimate() {
    const e = est;
    let h = `<div class="doc"><h2>ESTIMATE</h2><p class="meta">${esc(e.nameOfWork)}</p>`;
    h += '<h3>GENERAL ABSTRACT</h3><table class="est"><thead><tr><th>S.No</th><th>Description</th><th class="n">Amount (Rs)</th></tr></thead><tbody>';
    h += `<tr class="sub"><td></td><td>Part A (Item works)</td><td></td></tr>`;
    h += `<tr><td>1</td><td>${e.genAbst[0][0]}</td><td class="n">${inr(e.genAbst[0][1])}</td></tr><tr class="sub"><td></td><td>Part B</td><td></td></tr>`;
    e.genAbst.slice(1).forEach(([a, b], i) => { h += `<tr><td>${i + 2}</td><td>${esc(a)}</td><td class="n">${inr(b)}</td></tr>`; });
    h += `<tr class="tot"><td></td><td>Total Rs.</td><td class="n">${inr(e.total)}</td></tr><tr class="tot"><td></td><td>Or say (Lakhs)</td><td class="n">${e.lakhs.toFixed(2)}</td></tr></tbody></table>`;
    h += '<h3>ABSTRACT <small>(rates editable – SSR 2026-27 prefilled)</small></h3><table class="est"><thead><tr><th>Sl</th><th>Item code</th><th>Description</th><th class="n">Qty</th><th class="n">Rate</th><th>Unit</th><th class="n">Amount</th></tr></thead><tbody>';
    for (const it of e.items) {
      h += `<tr><td>${it.sl}</td><td class="code">${it.code}</td><td>${esc(it.short)}</td><td class="n">${it.qty.toFixed(3)}</td>` +
        `<td class="n"><input class="rate" type="number" step="0.1" data-code="${it.code}" value="${it.rate}"></td><td>${it.unit}</td><td class="n">${inr(it.amount)}</td></tr>`;
    }
    h += `<tr class="tot"><td colspan="6">ECV</td><td class="n">${inr(e.ecv)}</td></tr></tbody></table>`;
    h += '<h3>DETAILED ESTIMATE</h3><table class="est"><thead><tr><th>Item / description</th><th class="n">No</th><th class="n">L</th><th class="n">B</th><th class="n">D</th><th class="n">Qty</th></tr></thead><tbody>';
    for (const it of e.items) {
      h += `<tr class="sub"><td colspan="6">${it.sl}. ${it.code} – ${esc(it.short)}</td></tr>`;
      if (it.key === 'steel') { h += `<tr><td>Qty as per Bar Bending Schedule</td><td></td><td></td><td></td><td></td><td class="n">${it.qty.toFixed(2)} kg</td></tr>`; continue; }
      for (const r of it.rows) h += `<tr><td>${esc(r.desc)}</td><td class="n">${r.n1} x ${r.n2}</td><td class="n">${r.l}</td><td class="n">${r.w}</td><td class="n">${r.d}</td><td class="n">${r.qty.toFixed(3)}</td></tr>`;
      h += `<tr class="tot"><td colspan="5">Total</td><td class="n">${it.qty.toFixed(3)} ${it.unit}</td></tr>`;
    }
    h += '</tbody></table>';
    h += '<h3>BAR BENDING SCHEDULE</h3><table class="est"><thead><tr><th>Description</th><th class="n">Dia</th><th class="n">Spacing</th><th>Shape</th><th class="n">Length</th><th class="n">Nos</th><th class="n">Mem</th><th class="n">Total L</th><th class="n">kg/m</th><th class="n">kg</th></tr></thead><tbody>';
    let last = '';
    for (const r of e.bbs.rows) {
      if (r.member !== last) { h += `<tr class="sub"><td colspan="10">${esc(r.member)}</td></tr>`; last = r.member; }
      h += `<tr><td>${esc(r.desc)}</td><td class="n">${r.dia}</td><td class="n">${r.sp}</td><td>${esc(r.shape)}</td><td class="n">${r.len}</td><td class="n">${r.nb}</td><td class="n">${r.nm}</td><td class="n">${r.tl}</td><td class="n">${r.w}</td><td class="n">${r.kg.toFixed(2)}</td></tr>`;
    }
    h += `<tr class="tot"><td colspan="9">Total steel (${Object.entries(e.bbs.byDia).map(([d, k]) => `${d}φ ${k} kg`).join(', ')})</td><td class="n">${e.bbs.total.toFixed(2)}</td></tr></tbody></table>`;
    h += `<h3>SEIGNIORAGE</h3><table class="est"><tbody>
      <tr><td>Metal ${e.seigTot.metal.toFixed(3)} cum @ ${e.seigRates.metal}</td><td class="n">${inr(e.seigAmt.metal)}</td></tr>
      <tr><td>N-Sand ${e.seigTot.nsand.toFixed(3)} cum @ ${e.seigRates.nsand}</td><td class="n">${inr(e.seigAmt.nsand)}</td></tr>
      <tr><td>M-Sand ${e.seigTot.msand.toFixed(3)} cum @ ${e.seigRates.msand}</td><td class="n">${inr(e.seigAmt.msand)}</td></tr>
      <tr class="tot"><td>Total seigniorage / DMF 30 % / SMET 2 % / permit 80 %</td><td class="n">${inr(e.seigTotal)} / ${inr(e.dmf)} / ${inr(e.smet)} / ${inr(e.permit)}</td></tr></tbody></table>`;
    h += signBlock() + '</div>';
    $('#estimate').innerHTML = h;
  }

  let zoom = load('bd-zoom') || 1;
  function renderDrawings() {
    const s1 = BD.toSVG(BD.sheet1(cur), { fluid: true });
    const s2 = BD.toSVG(BD.sheet2(cur), { fluid: true });
    $('#drawings').innerHTML =
      `<div class="zoom"><button type="button" data-z="-1">−</button><span>${Math.round(zoom * 100)} %</span><button type="button" data-z="1">+</button></div>` +
      `<div class="sheets" style="--z:${zoom}"><figure class="sheet">${s1}<figcaption>Sheet 1 of 2</figcaption></figure><figure class="sheet">${s2}<figcaption>Sheet 2 of 2</figcaption></figure></div>`;
    drawingsStale = false;
  }

  // ---------------------------------------------------------------- downloads
  const fileBase = () => `${cur.R.typ.replace(/\./g, '')}_Km${String(state.chainage).replace('.', '')}`;
  // Runs an export; libraries load deferred, so wait for them briefly.
  function exporter(libs, fn, label) {
    return async (ev) => {
      const btn = ev.currentTarget;
      for (let i = 0; i < 50 && !libs.every((l) => l()); i++) await new Promise((r) => setTimeout(r, 100));
      if (!libs.every((l) => l())) { flash('The export library has not loaded yet. Check the internet connection and try again.'); return; }
      const txt = btn.textContent;
      btn.disabled = true; btn.textContent = 'Preparing…';
      try { const ok = await fn(); if (ok !== false) flash(`${label} ready.`); }
      catch (err) { flash(`${label} could not be created: ${err.message}`); }
      finally { btn.disabled = false; btn.textContent = txt; }
    };
  }
  const hasXL = () => !!window.ExcelJS, hasPDF = () => !!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable), hasZip = () => !!window.JSZip;
  function dl(text, name, type) { return BD.saveBlob(new Blob([text], { type }), name); }

  // ---------------------------------------------------------------- wiring
  function init() {
    buildForm(); fillForm();
    document.querySelectorAll('.type-switch button').forEach((b) => b.addEventListener('click', () => {
      if (state.bridgeType === b.dataset.type) return;
      state.bridgeType = b.dataset.type;
      state.carriageway = BD.CARRIAGEWAY[state.bridgeType];
      fillForm(); run();
    }));
    document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
      document.querySelectorAll('.tab').forEach((t) => (t.hidden = t.id !== 'tab-' + b.dataset.tab));
      if (b.dataset.tab === 'drawings' && drawingsStale) renderDrawings();
    }));
    $('#drawings').addEventListener('click', (e) => {
      const z = e.target.closest('[data-z]');
      if (!z) return;
      zoom = Math.min(4, Math.max(1, zoom + Number(z.dataset.z) * 0.5));
      save('bd-zoom', zoom);
      renderDrawings();
    });
    $('#btn-auto').addEventListener('click', () => {
      const a = BD.autoDesign(state);
      state = a.input; fillForm(); run();
      const msg = a.result.R.allOk ? 'All checks pass.' : 'Some checks still fail – see the list above (e.g. raise FRL or improve SBC).';
      flash(`Auto design: ${a.log.join('; ')}. ${msg}`);
    });
    $('#sel-example').addEventListener('change', (e) => {
      const f = EXAMPLES[e.target.value];
      if (f) { state = f(); fillForm(); run(); }
      e.target.value = '';
    });
    $('#btn-reset').addEventListener('click', () => { state = Object.assign({}, BD.DEFAULTS); fillForm(); run(); });
    $('#btn-save').addEventListener('click', async () => { try { if (await dl(JSON.stringify(state, null, 2), `${fileBase()}_inputs.json`, 'application/json')) flash('Inputs saved.'); } catch (err) { flash(err.message); } });
    $('#file-open').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try { state = Object.assign({}, BD.DEFAULTS, JSON.parse(await f.text())); fillForm(); run(); }
      catch (err) { flash('That file is not a saved inputs file (' + err.message + ').'); }
      e.target.value = '';
    });
    $('#estimate').addEventListener('change', (e) => {
      if (!e.target.classList.contains('rate')) return;
      rates[e.target.dataset.code] = Number(e.target.value);
      save(RSTORE, rates); setTimeout(run, 0);
    });
    $('#btn-rates-reset').addEventListener('click', () => { rates = {}; save(RSTORE, rates); run(); });
    $('#btn-pdf-report').addEventListener('click', exporter([hasPDF], () => BD.saveBlob(BD.reportPDF(cur), `${fileBase()}_Design.pdf`), 'Design report PDF'));
    $('#btn-pdf-est').addEventListener('click', exporter([hasPDF], () => BD.saveBlob(BD.estimatePDF(cur, est), `${fileBase()}_Estimate.pdf`), 'Estimate PDF'));
    $('#btn-pdf-dwg').addEventListener('click', exporter([hasPDF], () => BD.saveBlob(BD.drawingsPDF([BD.sheet1(cur), BD.sheet2(cur)]), `${fileBase()}_Drawings.pdf`), 'Drawings PDF'));
    $('#btn-dxf').addEventListener('click', exporter([hasZip], async () => BD.saveBlob(await BD.dxfZip(cur, fileBase()), `${fileBase()}_Drawings_DXF.zip`), 'DXF drawings'));
    $('#btn-xlsx-design').addEventListener('click', exporter([hasXL], () => BD.downloadWorkbook(BD.designWorkbook(cur), `${fileBase()}_Design.xlsx`), 'Design Excel'));
    $('#btn-xlsx-est').addEventListener('click', exporter([hasXL], () => BD.downloadWorkbook(BD.estimateWorkbook(cur, est), `${fileBase()}_Estimate.xlsx`), 'Estimate Excel'));
    run();
  }

  function flash(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 7000);
  }

  init();
})();
