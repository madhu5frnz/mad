/* UI: input form, live design, report / drawings / estimate views, exports. */
(function () {
  'use strict';
  const BD = window.BD;
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = BD.fmt;
  const STORE = 'bd-inputs-v1', RSTORE = 'bd-rates-v1';

  // [key, label, unit, step] ; text fields have step = 'text'
  const GROUPS = [
    ['Hydraulic particulars (HPs)', true, [
      ['Q', 'Discharge Q', 'cumecs', 0.001], ['bedWidth', 'Bed width', 'm', 0.001], ['fsd', 'Full supply depth', 'm', 0.001],
      ['sideSlope', 'Side slope (H:1)', '', 0.25], ['freeBoard', 'Free board', 'm', 0.01], ['bedFall', 'Bed fall 1 in', '', 100],
      ['manningN', "Manning's n", '', 0.001], ['cbl', 'Design CBL', 'm', 0.001], ['cblExisting', 'Existing CBL', 'm', 0.001],
      ['bankWidthL', 'Bank top width L', 'm', 0.1], ['bankWidthR', 'Bank top width R', 'm', 0.1],
    ]],
    ['Road & levels', true, [
      ['span', 'Clear span', 'm', 0.25], ['carriageway', 'Carriageway', 'm', 0.05], ['frl', 'Road level (FRL)', 'm', 0.001],
      ['gl', 'Ground level', 'm', 0.001], ['foundationLevel', 'Foundation level', 'm', 0.05], ['frlNote', 'FRL note', '', 'text'],
      ['sbc', 'Safe bearing capacity', 't/sqm', 0.5], ['siltFactor', 'Silt factor f', '', 0.1],
    ]],
    ['Project details (for title block & estimate)', false, [
      ['chainage', 'Chainage (Km)', '', 'text'], ['canalName', 'Canal', '', 'text'],
      ['location', 'Place / village', '', 'text'], ['district', 'District', '', 'text'],
      ['project', 'Project', '', 'text'], ['state', 'Government', '', 'text'], ['department', 'Department', '', 'text'],
      ['subDivision', 'Sub-division', '', 'text'], ['division', 'Division', '', 'text'], ['roadType', 'Type of road', '', 'text'],
    ]],
    ['Deck slab', false, [
      ['D', 'Slab thickness D', 'm', 0.025], ['wc', 'Wearing coat', 'm', 0.005], ['mainDia', 'Main bar dia', 'mm', 1],
      ['mainSpacing', 'Main bar spacing', 'mm', 5], ['distDia', 'Distribution dia', 'mm', 1], ['distSpacing', 'Distribution spacing', 'mm', 5],
      ['topDia', 'Top bar dia', 'mm', 1], ['topSpacing', 'Top bar spacing', 'mm', 5], ['cover', 'Clear cover', 'm', 0.005],
      ['kerbW', 'Kerb width', 'm', 0.025], ['kerbH', 'Kerb height', 'm', 0.025], ['bearingW', 'Bearing width', 'm', 0.01],
      ['approachLen', 'Approach slab length', 'm', 0.5], ['approachThk', 'Approach slab thk', 'm', 0.025],
      ['scbc', 'σcbc (M20)', 'N/mm²', 0.5], ['sst', 'σst (Fe415)', 'N/mm²', 10], ['modRatio', 'Modular ratio', '', 1],
    ]],
    ['Abutment', false, [
      ['frontBatter', 'Front batter', 'm', 0.05], ['abTopW', 'Top width', 'm', 0.05], ['abBackBatter', 'Back batter', 'm', 0.05],
      ['abToe', 'Footing toe', 'm', 0.05], ['abHeel', 'Footing heel', 'm', 0.05], ['footingT', 'Footing thickness', 'm', 0.05],
      ['bedBlockT', 'Bed block thickness', 'm', 0.05], ['gammaSoil', 'Soil unit weight', 't/cum', 0.1], ['phi', 'Backfill φ', 'deg', 1],
      ['surcharge', 'LL surcharge height', 'm', 0.1], ['mu', 'Friction coefficient', '', 0.05],
    ]],
    ['Wing walls & canal protection', false, [
      ['wTopW', 'Wing top width', 'm', 0.05], ['wFrontBatter', 'Wing front batter', 'm', 0.05], ['wBaseW', 'Wing base width', 'm', 0.1],
      ['wToe', 'Wing toe', 'm', 0.05], ['wHeel', 'Wing heel', 'm', 0.05], ['wFootT', 'Wing footing thk', 'm', 0.05],
      ['wingLen', 'Wing length', 'm', 0.1], ['keyW', 'Shear key width', 'm', 0.05], ['keyD', 'Shear key depth', 'm', 0.05],
      ['apronThk', 'Apron thickness', 'm', 0.025], ['liningLen', 'Lining length u/s & d/s', 'm', 1], ['liningThk', 'Lining thickness', 'm', 0.025],
    ]],
  ];

  const KM1580 = { chainage: '1.580', cbl: 145.367, cblExisting: 145.235, frl: 147.09, gl: 146.526, foundationLevel: 144.1, wFrontBatter: 0.7, wBaseW: 2.2, frlNote: 'FRL adopted = avg top of existing Culvert-6 (Ch 1415).' };
  const EXAMPLES = {
    km0450: () => Object.assign({}, BD.DEFAULTS),
    km1580: () => Object.assign({}, BD.DEFAULTS, KM1580),
    dlrb: () => BD.autoDesign(Object.assign({}, BD.DEFAULTS, { bridgeType: 'DLRB', carriageway: 7.5 })).input,
  };

  let state = load(STORE) || Object.assign({}, BD.DEFAULTS);
  let rates = load(RSTORE) || {};
  let cur = null, est = null;

  function load(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }

  // ---------------------------------------------------------------- form
  function buildForm() {
    const form = $('#form');
    form.innerHTML = '';
    for (const [title, open, fields] of GROUPS) {
      const det = document.createElement('details');
      det.open = open;
      det.innerHTML = `<summary>${title}</summary><div class="grid"></div>`;
      const grid = det.querySelector('.grid');
      for (const [key, label, unit, step] of fields) {
        const isText = step === 'text';
        const wrap = document.createElement('label');
        wrap.className = 'field' + (isText ? ' wide' : '');
        wrap.innerHTML = `<span>${label}${unit ? ` <em>${unit}</em>` : ''}</span>` +
          `<input name="${key}" ${isText ? 'type="text"' : `type="number" step="${step}" inputmode="decimal"`}>` +
          `<small class="hint-inline" data-hint="${key}"></small>`;
        grid.appendChild(wrap);
      }
      form.appendChild(det);
    }
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (!t.name) return;
      state[t.name] = t.type === 'number' ? (t.value === '' ? state[t.name] : Number(t.value)) : t.value;
      schedule();
    });
    form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-use]');
      if (!b) return;
      e.preventDefault();
      state[b.dataset.use] = Number(b.dataset.val);
      fillForm(); run();
    });
  }

  function fillForm() {
    for (const el of $('#form').elements) if (el.name && state[el.name] != null) el.value = state[el.name];
    document.querySelectorAll('.type-switch button').forEach((b) => b.classList.toggle('active', b.dataset.type === state.bridgeType));
  }

  let timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 150); }

  // ---------------------------------------------------------------- render
  function run() {
    try {
      cur = BD.design(state);
      est = BD.estimate(cur, { rates });
    } catch (err) {
      $('#status').innerHTML = `<div class="badge bad">Could not compute: ${esc(err.message)}</div>`;
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
    const gov = R.govM.veh.name;
    $('#status').innerHTML =
      `<div class="badge ${fails.length ? 'bad' : 'ok'}">${fails.length ? `${fails.length} check${fails.length > 1 ? 's' : ''} need revision` : 'All design checks OK'}</div>` +
      `<div class="kpis">
        <div><b>${R.typ}</b><span>${fmt(state.span, 2)} m span × ${fmt(R.B, 2)} m wide</span></div>
        <div><b>${fmt(state.D * 1000, 0)} mm</b><span>deck, ${state.mainDia}φ @ ${state.mainSpacing}</span></div>
        <div><b>${fmt(R.abWorst.pmax, 2)}</b><span>max base pressure t/m² (SBC ${state.sbc})</span></div>
        <div><b>₹ ${est.lakhs.toFixed(2)} L</b><span>estimate</span></div>
      </div>` +
      (fails.length ? `<ul class="fails">${fails.map((f) => `<li>${esc(f)}</li>`).join('')}</ul><p class="hint">Tip: <b>Auto design</b> sizes the deck, abutment and wing walls to pass all checks.</p>` : '') +
      (cur.warnings.length ? `<ul class="warns">${cur.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : '') +
      `<p class="hint">Governing live load: ${esc(gov)}.</p>`;
  }

  function renderHints() {
    const R = cur.R;
    const set = (k, html) => { const el = document.querySelector(`[data-hint="${k}"]`); if (el) el.innerHTML = html; };
    document.querySelectorAll('[data-hint]').forEach((el) => (el.innerHTML = ''));
    if (Math.abs(state.span - R.spanSuggested) > 1e-6) set('span', `Suggested ${fmt(R.spanSuggested, 2)} m (canal top width at FSL ${fmt(R.topFSL, 3)}) <button data-use="span" data-val="${R.spanSuggested}">use</button>`);
    else set('span', `= suggested from top width at FSL ${fmt(R.topFSL, 3)} m`);
    set('foundationLevel', `Deepest allowed by scour / apron check: +${fmt(Math.max(R.flScour + 0.01, R.flApron))}${R.okFound ? '' : ` <button data-use="foundationLevel" data-val="${R.flSuggested.toFixed(3)}">use ${fmt(R.flSuggested)}</button>`}`);
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

  // ---------------------------------------------------------------- printing
  function printWith(kind) {
    const area = $('#print-area');
    const ps = $('#page-style');
    if (kind === 'drawings') {
      ps.textContent = '@page { size: 594mm 420mm; margin: 0; }';
      area.innerHTML = [BD.sheet1(cur), BD.sheet2(cur)].map((d) => `<div class="print-sheet">${BD.toSVG(d)}</div>`).join('');
    } else {
      ps.textContent = '@page { size: A4 portrait; margin: 12mm; }';
      area.innerHTML = (kind === 'report' ? $('#report') : $('#estimate')).innerHTML;
      area.querySelectorAll('input.rate').forEach((i) => i.replaceWith(document.createTextNode(i.value)));
    }
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 50);
  }

  // ---------------------------------------------------------------- downloads
  const fileBase = () => `${cur.R.typ.replace(/\./g, '')}_Km${String(state.chainage).replace('.', '')}`;
  function need(fn) {
    return async () => {
      if (!window.ExcelJS) { alert('The Excel library is still loading. Please try again in a moment.'); return; }
      await fn();
    };
  }
  function dl(text, name, type) { BD.saveBlob(new Blob([text], { type }), name); }

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
    $('#btn-save').addEventListener('click', () => dl(JSON.stringify(state, null, 2), `${fileBase()}_inputs.json`, 'application/json'));
    $('#file-open').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try { state = Object.assign({}, BD.DEFAULTS, JSON.parse(await f.text())); fillForm(); run(); }
      catch (err) { alert('Not a valid inputs file: ' + err.message); }
      e.target.value = '';
    });
    $('#estimate').addEventListener('change', (e) => {
      if (!e.target.classList.contains('rate')) return;
      rates[e.target.dataset.code] = Number(e.target.value);
      save(RSTORE, rates); setTimeout(run, 0);
    });
    $('#btn-rates-reset').addEventListener('click', () => { rates = {}; save(RSTORE, rates); run(); });
    $('#btn-print-report').addEventListener('click', () => printWith('report'));
    $('#btn-print-est').addEventListener('click', () => printWith('estimate'));
    $('#btn-print-dwg').addEventListener('click', () => printWith('drawings'));
    $('#btn-dxf1').addEventListener('click', () => dl(BD.toDXF(BD.sheet1(cur)), `${fileBase()}_Sheet1.dxf`, 'application/dxf'));
    $('#btn-dxf2').addEventListener('click', () => dl(BD.toDXF(BD.sheet2(cur)), `${fileBase()}_Sheet2.dxf`, 'application/dxf'));
    $('#btn-svg').addEventListener('click', () => {
      dl(BD.toSVG(BD.sheet1(cur)), `${fileBase()}_Sheet1.svg`, 'image/svg+xml');
      setTimeout(() => dl(BD.toSVG(BD.sheet2(cur)), `${fileBase()}_Sheet2.svg`, 'image/svg+xml'), 400);
    });
    $('#btn-xlsx-design').addEventListener('click', need(() => BD.downloadWorkbook(BD.designWorkbook(cur), `${fileBase()}_Design.xlsx`)));
    $('#btn-xlsx-est').addEventListener('click', need(() => BD.downloadWorkbook(BD.estimateWorkbook(cur, est), `${fileBase()}_Estimate.xlsx`)));
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
