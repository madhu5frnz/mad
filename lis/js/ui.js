/**
 * LIS Monitoring System v2 — UI Controller & Interaction Handlers
 */
(function (g) {
  'use strict';
  const LIS = (g.LIS = g.LIS || {});
  const store = LIS.store;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Current active tab state
  let currentTab = 'overview';
  let activeSchemeId = null;

  function inr(n) {
    if (typeof n !== 'number') return String(n || '0');
    return '₹ ' + Math.round(n).toLocaleString('en-IN');
  }

  function inrCr(n) {
    if (typeof n !== 'number') return String(n || '0');
    return '₹ ' + n.toFixed(2) + ' Cr';
  }

  // ------------------------------------------------------------- Render KPIs
  function renderKPIs() {
    const schemes = store.schemes;
    const totalAyacut = schemes.reduce((sum, s) => sum + (s.ayacutAcres || 0), 0);
    const totalSanction = schemes.reduce((sum, s) => sum + s.sanction, 0);
    const totalSupp = schemes.reduce((sum, s) => sum + (s.supp / 10000000), 0);
    const avgProgress = Math.round((schemes.reduce((sum, s) => sum + s.progress, 0) / schemes.length) * 10) / 10;
    const highIssues = store.issues.filter((i) => i.priority === 'High' && i.status !== 'Resolved').length;

    $('#kpi-ayacut').textContent = totalAyacut.toLocaleString('en-IN') + ' Ac';
    $('#kpi-sanction').textContent = inrCr(totalSanction);
    $('#kpi-supp').textContent = inrCr(totalSupp);
    $('#kpi-progress').textContent = avgProgress + ' %';
    $('#kpi-issues').textContent = highIssues + ' Urgent';
  }

  // ------------------------------------------------------------- Render Overview Tab
  function renderOverview() {
    const container = $('#view-overview');
    if (!container) return;

    const schemesHtml = store.schemes.map((s) => `
      <div class="scheme-card" data-scheme-id="${s.id}">
        <div class="scheme-header">
          <span class="scheme-tag">${s.badge}</span>
          <span class="scheme-code">${s.code}</span>
        </div>
        <h3>${s.name}</h3>
        <p class="scheme-desc">${s.summary}</p>

        <div class="progress-container">
          <div class="progress-header">
            <span>Physical Progress</span>
            <span style="color: var(--brand-accent);">${s.progress}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${Math.min(100, Math.max(5, s.progress))}%;"></div>
          </div>
        </div>

        <div class="spec-grid">
          <div class="spec-item">
            <span>Discharge</span>
            <span>${s.discharge.split(' ')[0]} cumecs</span>
          </div>
          <div class="spec-item">
            <span>Static Head</span>
            <span>${s.head.split(' ')[0]} m</span>
          </div>
          <div class="spec-item">
            <span>Pumps & Motors</span>
            <span>${s.pumps}</span>
          </div>
          <div class="spec-item">
            <span>Ayacut</span>
            <span>${s.ayacut}</span>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="schemes-grid">
        ${schemesHtml}
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3>Recent Field Measurement Records (MB Entries)</h3>
          <button class="btn btn-primary btn-sm" id="btn-open-log-modal-overview">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
            Record Field Update
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Scheme</th>
              <th>Component</th>
              <th>Cumulative Measured</th>
              <th>Measurement Ref</th>
              <th>Reporting Officer</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${store.logs.slice(0, 6).map((l) => `
              <tr>
                <td><b>${l.date}</b></td>
                <td><span class="scheme-tag">${l.schemeId}</span></td>
                <td><b>${l.componentName}</b></td>
                <td><b style="color:var(--brand-accent);">${l.quantity} ${l.unit}</b></td>
                <td><code>${l.ref}</code></td>
                <td>${l.officer}</td>
                <td><small>${l.remarks}</small></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Click handler on scheme cards
    $$('.scheme-card', container).forEach((card) => {
      card.addEventListener('click', () => {
        openSchemeDetail(card.dataset.schemeId);
      });
    });

    $('#btn-open-log-modal-overview')?.addEventListener('click', () => {
      openFieldUpdateModal();
    });
  }

  // ------------------------------------------------------------- Scheme Detail View
  function openSchemeDetail(schemeId) {
    activeSchemeId = schemeId;
    const s = store.schemes.find((item) => item.id === schemeId);
    if (!s) return;

    setTab('scheme-detail');

    const container = $('#view-scheme-detail');
    container.innerHTML = `
      <div class="detail-header-card">
        <div class="detail-title-row">
          <div>
            <button class="btn btn-white btn-sm" id="btn-back-overview" style="margin-bottom:8px;">
              ← Back to All Schemes
            </button>
            <h2>${s.name} (${s.id})</h2>
            <p style="color:var(--text-muted);font-size:13.5px;">${s.summary}</p>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-log-for-scheme">
              + Record Measurement for ${s.id}
            </button>
          </div>
        </div>

        <div class="detail-specs-bar">
          <div class="spec-pill"><small>Ayacut</small><b>${s.ayacut}</b></div>
          <div class="spec-pill"><small>Discharge</small><b>${s.discharge}</b></div>
          <div class="spec-pill"><small>Total Head</small><b>${s.head}</b></div>
          <div class="spec-pill"><small>Pumps & Motors</small><b>${s.pumps}</b></div>
          <div class="spec-pill"><small>Pressure Main</small><b>${s.main}</b></div>
          <div class="spec-pill"><small>Delivery Cistern</small><b>${s.delivery}</b></div>
          <div class="spec-pill"><small>Sanction Amount</small><b>${inrCr(s.sanction)}</b></div>
          <div class="spec-pill"><small>Supp. Agreement</small><b>${inrCr(s.supp / 10000000)}</b></div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:16px;">
          <div style="background:var(--bg-subtle);padding:14px;border-radius:var(--radius-md);">
            <b style="font-size:13px;color:var(--brand-accent);">Civil Construction Status</b>
            <p style="font-size:12.5px;margin-top:4px;color:var(--text-muted);">${s.civilStatus}</p>
          </div>
          <div style="background:var(--bg-subtle);padding:14px;border-radius:var(--radius-md);">
            <b style="font-size:13px;color:var(--ok);">Equipment & Electrical</b>
            <p style="font-size:12.5px;margin-top:4px;color:var(--text-muted);">${s.motorDetails || s.equipment || 'Specifications approved'}</p>
          </div>
          <div style="background:var(--bg-subtle);padding:14px;border-radius:var(--radius-md);">
            <b style="font-size:13px;color:var(--warn);">Land & Power Clearances</b>
            <p style="font-size:12.5px;margin-top:4px;color:var(--text-muted);">${s.powerStatus} ${s.landStatus}</p>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3>Component Stages & Execution Tracking (${s.components.length} Components)</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Component Description</th>
              <th>Total Scope</th>
              <th>Cumulative Executed</th>
              <th>Unit</th>
              <th>Stage</th>
              <th>Current Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${s.components.map((c) => `
              <tr>
                <td><code>${c.id}</code></td>
                <td><b>${c.name}</b></td>
                <td>${c.total}</td>
                <td><b style="color:var(--brand-accent);font-size:15px;">${c.completed}</b></td>
                <td>${c.unit}</td>
                <td><span class="status-pill ${c.completed >= c.total ? 'ok' : c.completed > 0 ? 'warn' : 'neutral'}">${c.stage}</span></td>
                <td><small>${c.status}</small></td>
                <td>
                  <button class="btn btn-white btn-sm btn-quick-update" data-comp-id="${c.id}" data-comp-name="${c.name}" data-comp-unit="${c.unit}" data-comp-curr="${c.completed}">
                    Update
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${s.villages && s.villages.length ? `
        <div class="table-card">
          <div class="table-header">
            <h3>Ayacut Distribution by Village (${s.villages.length} Villages)</h3>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Village Name</th>
                <th>Beneficiary Ayacut (Acres)</th>
                <th>Share (%)</th>
              </tr>
            </thead>
            <tbody>
              ${s.villages.map((v) => `
                <tr>
                  <td><b>${v.name}</b></td>
                  <td><b>${v.ayacut.toLocaleString('en-IN')} Acres</b></td>
                  <td>${Math.round((v.ayacut / s.ayacutAcres) * 1000) / 10} %</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;

    $('#btn-back-overview')?.addEventListener('click', () => {
      setTab('overview');
    });

    $('#btn-log-for-scheme')?.addEventListener('click', () => {
      openFieldUpdateModal(s.id);
    });

    $$('.btn-quick-update', container).forEach((btn) => {
      btn.addEventListener('click', () => {
        openFieldUpdateModal(s.id, btn.dataset.compId);
      });
    });
  }

  // ------------------------------------------------------------- Render Issues Tab
  function renderIssues() {
    const container = $('#view-issues');
    if (!container) return;

    container.innerHTML = `
      <div class="table-card">
        <div class="table-header">
          <div>
            <h3>Bottlenecks & Priority Action Items (${store.issues.length} Items)</h3>
            <p style="color:var(--text-muted);font-size:12.5px;">Key approvals, land acquisition corridors, TGSPDCL power deposits, and technical compliance.</p>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" id="btn-add-issue">
              + Log New Issue
            </button>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Scheme</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Issue Title & Details</th>
              <th>Required Action</th>
              <th>Financial Impact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${store.issues.map((i) => `
              <tr>
                <td><code>${i.id}</code></td>
                <td><span class="scheme-tag">${i.scheme}</span></td>
                <td><span class="status-pill neutral">${i.category}</span></td>
                <td><span class="status-pill ${i.priority === 'High' ? 'danger' : 'warn'}">${i.priority}</span></td>
                <td>
                  <b>${i.title}</b>
                  <p style="font-size:12px;color:var(--text-muted);margin-top:2px;">${i.detail}</p>
                </td>
                <td><small style="color:var(--text-main);font-weight:500;">${i.actionNeeded}</small></td>
                <td><b>${i.costCr ? inrCr(i.costCr) : '—'}</b></td>
                <td>
                  <select class="form-control select-issue-status" data-issue-id="${i.id}" style="padding:4px 8px;font-size:12px;width:120px;">
                    <option value="Open" ${i.status === 'Open' ? 'selected' : ''}>Open</option>
                    <option value="In Progress" ${i.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Under Review" ${i.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                    <option value="Resolved" ${i.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    $$('.select-issue-status', container).forEach((sel) => {
      sel.addEventListener('change', (e) => {
        store.updateIssueStatus(e.target.dataset.issueId, e.target.value);
        renderKPIs();
      });
    });

    $('#btn-add-issue')?.addEventListener('click', () => {
      openAddIssueModal();
    });
  }

  // ------------------------------------------------------------- Render Tanks Tab
  function renderTanks() {
    const container = $('#view-tanks');
    if (!container) return;

    container.innerHTML = `
      <div class="table-card" style="margin-bottom:24px;">
        <div class="table-header">
          <div>
            <h3>Thopucherla Cascading Tank Filling Network</h3>
            <p style="color:var(--text-muted);font-size:12.5px;">6 Nos. minor irrigation tanks fed from L-14 Canal lifting system across Madgulapally mandal.</p>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Tank Name</th>
              <th>Village</th>
              <th>Storage Capacity (Mcft)</th>
              <th>Ayacut Fed (Acres)</th>
              <th>Estimated Water Level / Filling Status</th>
              <th>Civil Readiness</th>
            </tr>
          </thead>
          <tbody>
            ${LIS.TANKS.map((t) => `
              <tr>
                <td><b>${t.name}</b></td>
                <td>${t.village}</td>
                <td><b style="font-family:var(--font-mono);">${t.capacityMcft} Mcft</b></td>
                <td><b>${t.ayacutAc} Acres</b></td>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div class="progress-track" style="width:100px;height:7px;">
                      <div class="progress-fill" style="width:${t.fillPct}%;"></div>
                    </div>
                    <small><b>${t.fillPct}%</b></small>
                  </div>
                </td>
                <td><span class="status-pill ok">${t.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ------------------------------------------------------------- Render Financials Tab
  function renderFinance() {
    const container = $('#view-finance');
    if (!container) return;

    const totalFundingNeeded = LIS.FUNDING_SUMMARY.reduce((acc, f) => acc + f.total, 0);

    container.innerHTML = `
      <div class="table-card" style="margin-bottom:24px;">
        <div class="table-header">
          <div>
            <h3>Agreement & Sanction Financial Comparison (Package: ₹548.23 Cr)</h3>
            <p style="color:var(--text-muted);font-size:12.5px;">Original agreement vs Supplemental agreement vs Measured Work Done.</p>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Scheme</th>
              <th>Sanction (₹ Cr)</th>
              <th>Tech. Sanction (₹ Cr)</th>
              <th>Orig. Agreement (₹ Cr)</th>
              <th>Supp. Agreement (₹ Cr)</th>
              <th>Cumulative Bill (₹ Cr)</th>
              <th>Work Done (₹ Cr)</th>
            </tr>
          </thead>
          <tbody>
            ${store.schemes.map((s) => `
              <tr>
                <td><b>${s.name} (${s.id})</b></td>
                <td>${inrCr(s.sanction)}</td>
                <td>${inrCr(s.ts)}</td>
                <td>${inrCr(s.ecv)}</td>
                <td><b style="color:var(--brand-accent);">${inrCr(s.supp / 10000000)}</b></td>
                <td>${inrCr(s.bill / 10000000)}</td>
                <td><b>${inrCr(s.work)}</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="table-card">
        <div class="table-header">
          <div>
            <h3>Pending Funding Requisitions & Liabilities (Total: ${inrCr(totalFundingNeeded)})</h3>
            <p style="color:var(--text-muted);font-size:12.5px;">Breakdown of urgent land compensation, power deposit, and pending bills.</p>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Requisition Head</th>
              <th>BW (₹ Cr)</th>
              <th>VP-II (₹ Cr)</th>
              <th>THOP (₹ Cr)</th>
              <th>Total Requisition (₹ Cr)</th>
            </tr>
          </thead>
          <tbody>
            ${LIS.FUNDING_SUMMARY.map((f) => `
              <tr>
                <td><b>${f.item}</b></td>
                <td>${f.bw ? inrCr(f.bw) : '—'}</td>
                <td>${f.vp ? inrCr(f.vp) : '—'}</td>
                <td>${f.thop ? inrCr(f.thop) : '—'}</td>
                <td><b style="color:var(--danger);">${inrCr(f.total)}</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ------------------------------------------------------------- Field Update Modal
  function openFieldUpdateModal(preSelectedScheme = 'BW', preSelectedComponent = null) {
    const modal = $('#modal-field-update');
    if (!modal) return;

    const selScheme = $('#field-scheme');
    const selComp = $('#field-component');
    const inpQty = $('#field-qty');
    const inpUnit = $('#field-unit');
    const inpDate = $('#field-date');
    const inpOfficer = $('#field-officer');
    const inpRef = $('#field-ref');
    const inpRemarks = $('#field-remarks');

    // Populate schemes
    selScheme.innerHTML = store.schemes.map((s) => `
      <option value="${s.id}" ${s.id === preSelectedScheme ? 'selected' : ''}>${s.id} — ${s.name}</option>
    `).join('');

    function updateComponentDropdown() {
      const scheme = store.schemes.find((s) => s.id === selScheme.value);
      if (!scheme) return;
      selComp.innerHTML = scheme.components.map((c) => `
        <option value="${c.id}" ${c.id === preSelectedComponent ? 'selected' : ''}>${c.id} — ${c.name} (Current: ${c.completed} ${c.unit})</option>
      `).join('');
      syncComponentDetails();
    }

    function syncComponentDetails() {
      const scheme = store.schemes.find((s) => s.id === selScheme.value);
      if (!scheme) return;
      const comp = scheme.components.find((c) => c.id === selComp.value);
      if (comp) {
        inpUnit.textContent = comp.unit;
        inpQty.value = comp.completed;
      }
    }

    selScheme.onchange = updateComponentDropdown;
    selComp.onchange = syncComponentDetails;

    updateComponentDropdown();

    inpDate.value = new Date().toISOString().split('T')[0];
    modal.classList.add('open');
  }

  function closeFieldUpdateModal() {
    $('#modal-field-update')?.classList.remove('open');
  }

  function handleSaveFieldUpdate() {
    const schemeId = $('#field-scheme').value;
    const componentId = $('#field-component').value;
    const quantity = parseFloat($('#field-qty').value);
    const date = $('#field-date').value;
    const officer = $('#field-officer').value;
    const ref = $('#field-ref').value;
    const remarks = $('#field-remarks').value;

    if (isNaN(quantity) || quantity < 0) {
      alert('Please enter a valid non-negative cumulative quantity.');
      return;
    }

    try {
      store.addMeasurement({ schemeId, componentId, quantity, date, officer, ref, remarks });
      closeFieldUpdateModal();
      renderKPIs();
      if (currentTab === 'overview') renderOverview();
      if (currentTab === 'scheme-detail' && activeSchemeId === schemeId) openSchemeDetail(schemeId);
    } catch (err) {
      alert('Error saving update: ' + err.message);
    }
  }

  // ------------------------------------------------------------- Add Issue Modal
  function openAddIssueModal() {
    const title = prompt('Enter Issue Title:');
    if (!title) return;
    const scheme = prompt('Enter Scheme Code (BW, DBC, VP-II, THOP):', 'BW') || 'BW';
    const category = prompt('Enter Category (Land, Power, Technical, Funding, Quality):', 'Technical') || 'Technical';
    const detail = prompt('Enter Issue Description:') || '';
    const actionNeeded = prompt('Enter Required Action:') || '';
    const cost = parseFloat(prompt('Estimated Financial Impact in ₹ Cr (0 if none):', '0')) || 0;

    store.addIssue({
      scheme,
      title,
      category,
      priority: 'High',
      detail,
      actionNeeded,
      costCr: cost
    });
    renderKPIs();
    renderIssues();
  }

  // ------------------------------------------------------------- Command Palette (Ctrl+K)
  function setupCommandPalette() {
    const modal = $('#modal-command-palette');
    const input = $('#palette-search-input');
    const results = $('#palette-results');
    if (!modal || !input) return;

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
      if (e.key === 'Escape') {
        closePalette();
        closeFieldUpdateModal();
      }
    });

    $('#btn-search-trigger')?.addEventListener('click', openPalette);
    $('#btn-close-palette')?.addEventListener('click', closePalette);

    function openPalette() {
      modal.classList.add('open');
      input.value = '';
      input.focus();
      filterPalette('');
    }

    function closePalette() {
      modal.classList.remove('open');
    }

    input.addEventListener('input', (e) => {
      filterPalette(e.target.value.toLowerCase().trim());
    });

    function filterPalette(q) {
      const items = [];

      // Add Schemes
      store.schemes.forEach((s) => {
        if (!q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.status.toLowerCase().includes(q)) {
          items.push({
            type: 'Scheme',
            title: `${s.id} — ${s.name}`,
            sub: `${s.ayacut} · ${s.discharge}`,
            action: () => { openSchemeDetail(s.id); closePalette(); }
          });
        }

        // Add Components
        s.components.forEach((c) => {
          if (!q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) {
            items.push({
              type: 'Component',
              title: `${c.id} (${s.id}) — ${c.name}`,
              sub: `Status: ${c.completed} / ${c.total} ${c.unit} (${c.stage})`,
              action: () => { openSchemeDetail(s.id); closePalette(); }
            });
          }
        });
      });

      // Add Issues
      store.issues.forEach((i) => {
        if (!q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q)) {
          items.push({
            type: 'Issue',
            title: `[${i.priority}] ${i.id}: ${i.title}`,
            sub: `${i.scheme} · ${i.category} · ${i.status}`,
            action: () => { setTab('issues'); closePalette(); }
          });
        }
      });

      results.innerHTML = items.slice(0, 10).map((it, idx) => `
        <div class="palette-item" data-idx="${idx}">
          <div>
            <b>${it.title}</b>
            <p style="font-size:12px;color:var(--text-muted);">${it.sub}</p>
          </div>
          <span class="status-pill neutral">${it.type}</span>
        </div>
      `).join('');

      $$('.palette-item', results).forEach((el, idx) => {
        el.addEventListener('click', () => {
          items[idx].action();
        });
      });
    }
  }

  // ------------------------------------------------------------- Tab Router
  function setTab(tabName) {
    currentTab = tabName;

    // Update Tab Buttons
    $$('.tab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tabName);
    });

    // Update Bottom Nav
    $$('.mobile-nav-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tabName);
    });

    // Hide all tab views
    $$('.tab-view').forEach((v) => {
      v.style.display = 'none';
    });

    // Show target view
    const target = $(`#view-${tabName}`);
    if (target) target.style.display = 'block';

    // Render content
    if (tabName === 'overview') renderOverview();
    else if (tabName === 'issues') renderIssues();
    else if (tabName === 'tanks') renderTanks();
    else if (tabName === 'finance') renderFinance();
  }

  // ------------------------------------------------------------- App Initializer
  function init() {
    renderKPIs();
    renderOverview();

    // Tab buttons event listeners
    $$('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setTab(btn.dataset.tab);
      });
    });

    // Mobile nav buttons event listeners
    $$('.mobile-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setTab(btn.dataset.tab);
      });
    });

    // Modal close & save triggers
    $('#btn-close-modal-field')?.addEventListener('click', closeFieldUpdateModal);
    $('#btn-cancel-modal-field')?.addEventListener('click', closeFieldUpdateModal);
    $('#btn-save-modal-field')?.addEventListener('click', handleSaveFieldUpdate);

    // Hero buttons
    $('#btn-hero-log')?.addEventListener('click', () => openFieldUpdateModal());
    $('#btn-export-excel')?.addEventListener('click', () => LIS.exportExcel());
    $('#btn-export-pdf')?.addEventListener('click', () => LIS.exportPDF());
    $('#btn-print')?.addEventListener('click', () => LIS.printReport());

    // Theme toggle
    $('#btn-theme-toggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('lis_v2_theme', next);
    });

    // Restore saved theme
    const savedTheme = localStorage.getItem('lis_v2_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    setupCommandPalette();
  }

  // Subscribe to store updates
  store.subscribe(() => {
    renderKPIs();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
