/**
 * LIS Monitoring System v2 — Ultra-Clean Modern UI Controller
 * Government of Telangana — Irrigation & CAD Department
 * Irrigation Division No.3, Miryalaguda
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

  // ------------------------------------------------------------- Render KPIs Strip
  function renderKPIs() {
    const schemes = store.schemes;
    const totalAyacut = schemes.reduce((sum, s) => sum + (s.ayacutAcres || 0), 0);
    const totalSanction = schemes.reduce((sum, s) => sum + s.sanction, 0);
    const totalSupp = schemes.reduce((sum, s) => sum + (s.supp / 10000000), 0);
    const avgProgress = Math.round((schemes.reduce((sum, s) => sum + s.progress, 0) / schemes.length) * 10) / 10;
    const urgentIssues = store.issues.filter((i) => i.priority === 'High' && i.status !== 'Resolved').length;

    const elAyacut = $('#kpi-ayacut');
    const elSanction = $('#kpi-sanction');
    const elSupp = $('#kpi-supp');
    const elProgress = $('#kpi-progress');
    const elIssues = $('#kpi-issues');

    if (elAyacut) elAyacut.textContent = totalAyacut.toLocaleString('en-IN') + ' Ac';
    if (elSanction) elSanction.textContent = inrCr(totalSanction);
    if (elSupp) elSupp.textContent = inrCr(totalSupp);
    if (elProgress) elProgress.textContent = avgProgress + ' %';
    if (elIssues) elIssues.textContent = urgentIssues + ' Urgent';
  }

  // ------------------------------------------------------------- Helper: Get Blocker for Scheme
  function getTopBlocker(schemeId) {
    const issue = store.issues.find((i) => i.scheme === schemeId && i.priority === 'High' && i.status !== 'Resolved');
    if (issue) {
      return {
        hasBlocker: true,
        text: `${issue.title}${issue.costCr ? ` (₹${issue.costCr.toFixed(2)} Cr)` : ''}`
      };
    }
    return {
      hasBlocker: false,
      text: 'No critical blockers reported. Work proceeding as scheduled.'
    };
  }

  // ------------------------------------------------------------- Render Overview Tab (4 Schemes Showcase)
  function renderOverview() {
    const container = $('#view-overview');
    if (!container) return;

    const schemesHtml = store.schemes.map((s) => {
      const blocker = getTopBlocker(s.id);
      const isComplete = s.progress >= 100;
      const progressWidth = Math.min(100, Math.max(4, s.progress));

      return `
        <div class="scheme-box" data-scheme-id="${s.id}">
          <div class="scheme-box-header">
            <span class="scheme-code-badge">${s.id}</span>
            <span class="scheme-duty-badge">${s.ayacut}</span>
          </div>

          <h2>${s.name}</h2>
          <p class="scheme-sub">${s.summary}</p>

          <div class="progress-block">
            <div class="progress-labels">
              <span>Overall Physical Progress</span>
              <span style="color:var(--primary);font-size:14px;font-weight:800;">${s.progress}%</span>
            </div>
            <div class="progress-bar-rail">
              <div class="progress-bar-fill" style="width: ${progressWidth}%;"></div>
            </div>
          </div>

          <div class="features-grid">
            <div class="feature-col">
              <small>Discharge</small>
              <b>${s.discharge.split(' ')[0]} cumecs</b>
            </div>
            <div class="feature-col">
              <small>Static Head</small>
              <b>${s.head.split(' ')[0]} m</b>
            </div>
            <div class="feature-col">
              <small>Pumps & Motors</small>
              <b>${s.pumps.split('(')[0].trim()}</b>
            </div>
            <div class="feature-col">
              <small>Pressure Main</small>
              <b>${s.main.split('+')[0].trim()}</b>
            </div>
          </div>

          <div class="blocker-alert" style="${blocker.hasBlocker ? '' : 'background:var(--success-soft);border-color:var(--success);color:var(--success);'}">
            <svg viewBox="0 0 20 20" fill="currentColor">
              ${blocker.hasBlocker 
                ? '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>'
                : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>'
              }
            </svg>
            <div>
              <b>${blocker.hasBlocker ? 'Key Bottleneck:' : 'Status Clear:'}</b> ${blocker.text}
            </div>
          </div>

          <div class="scheme-card-buttons">
            <button class="btn btn-outline btn-sm btn-open-scheme" data-scheme-id="${s.id}">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
              View Components (${s.components.length})
            </button>
            <button class="btn btn-primary btn-sm btn-quick-record" data-scheme-id="${s.id}">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
              Record Entry
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Recent measurements table (first 6 items)
    const logsHtml = store.logs.slice(0, 6).map((l) => `
      <tr>
        <td><b>${l.date}</b></td>
        <td><span class="tag tag-primary">${l.schemeId}</span></td>
        <td><b>${l.componentName}</b></td>
        <td><b style="color:var(--primary);font-size:14px;">${l.quantity} ${l.unit}</b></td>
        <td><code>${l.ref}</code></td>
        <td>${l.officer}</td>
        <td><small style="color:var(--text-muted);">${l.remarks}</small></td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="schemes-showcase">
        ${schemesHtml}
      </div>

      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>Recent Field Measurement Records (MB Entries)</h3>
            <p>Verified physical execution entries logged by field engineers and sub-division officers.</p>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-outline btn-sm" id="btn-goto-logs">
              View All ${store.logs.length} Log Entries →
            </button>
            <button class="btn btn-primary btn-sm" id="btn-open-log-modal-overview">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
              + Quick Record Entry
            </button>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Scheme</th>
                <th>Component Description</th>
                <th>Cumulative Executed</th>
                <th>Measurement Ref (MB)</th>
                <th>Recording Officer</th>
                <th>Site Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${logsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event handlers on overview elements
    $$('.btn-open-scheme', container).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSchemeDetail(btn.dataset.schemeId);
      });
    });

    $$('.btn-quick-record', container).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openFieldUpdateModal(btn.dataset.schemeId);
      });
    });

    $$('.scheme-box', container).forEach((box) => {
      box.addEventListener('click', () => {
        openSchemeDetail(box.dataset.schemeId);
      });
    });

    $('#btn-goto-logs', container)?.addEventListener('click', () => {
      setTab('logs');
    });

    $('#btn-open-log-modal-overview', container)?.addEventListener('click', () => {
      openFieldUpdateModal();
    });
  }

  // ------------------------------------------------------------- Scheme Drilldown Detail
  function openSchemeDetail(schemeId) {
    activeSchemeId = schemeId;
    const s = store.schemes.find((item) => item.id === schemeId);
    if (!s) return;

    setTab('scheme-detail');

    const container = $('#view-scheme-detail');
    if (!container) return;

    container.innerHTML = `
      <div class="card-section" style="padding:22px;margin-bottom:20px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
          <div>
            <button class="btn btn-outline btn-sm" id="btn-back-overview" style="margin-bottom:10px;">
              ← Back to All 4 Schemes
            </button>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span class="scheme-code-badge" style="font-size:15px;padding:5px 12px;">${s.id}</span>
              <h2 style="font-size:22px;font-weight:800;color:var(--text-main);">${s.name}</h2>
              <span class="tag tag-primary">${s.badge}</span>
            </div>
            <p style="color:var(--text-muted);font-size:13.5px;margin-top:6px;max-width:900px;">${s.summary}</p>
          </div>

          <div style="display:flex;gap:10px;">
            <button class="btn btn-primary" id="btn-log-for-scheme">
              <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
              + Record Measurement for ${s.id}
            </button>
          </div>
        </div>

        <!-- 8 Spec Metric Pills -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:16px;background:var(--bg-alt);border-radius:var(--radius-md);border:1px solid var(--border);">
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Ayacut</small><b style="font-size:14px;color:var(--text-main);">${s.ayacut}</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Discharge</small><b style="font-size:14px;color:var(--text-main);">${s.discharge}</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Static Head</small><b style="font-size:14px;color:var(--text-main);">${s.head}</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Pumps & Motors</small><b style="font-size:14px;color:var(--text-main);">${s.pumps}</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Pressure Main</small><b style="font-size:14px;color:var(--text-main);">${s.main}</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Delivery Cistern</small><b style="font-size:14px;color:var(--text-main);">${s.delivery}</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Sanction Package</small><b style="font-size:14px;color:var(--text-main);">${inrCr(s.sanction)}</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Supp. Agreement</small><b style="font-size:14px;color:var(--text-main);">${inrCr(s.supp / 10000000)}</b></div>
        </div>

        <!-- 3 Narrative Status Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:16px;">
          <div style="background:var(--bg-card);border:1px solid var(--border);padding:14px;border-radius:var(--radius-md);">
            <b style="font-size:13px;color:var(--primary);display:flex;align-items:center;gap:6px;">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg>
              Civil Construction Status
            </b>
            <p style="font-size:12.5px;margin-top:6px;color:var(--text-body);line-height:1.45;">${s.civilStatus}</p>
          </div>

          <div style="background:var(--bg-card);border:1px solid var(--border);padding:14px;border-radius:var(--radius-md);">
            <b style="font-size:13px;color:var(--success);display:flex;align-items:center;gap:6px;">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
              Equipment & Electrical
            </b>
            <p style="font-size:12.5px;margin-top:6px;color:var(--text-body);line-height:1.45;">${s.motorDetails || s.equipment || 'Electro-mechanical datasheets approved; factory testing scheduled.'}</p>
          </div>

          <div style="background:var(--bg-card);border:1px solid var(--border);padding:14px;border-radius:var(--radius-md);">
            <b style="font-size:13px;color:var(--warning);display:flex;align-items:center;gap:6px;">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              Land & Power Clearances
            </b>
            <p style="font-size:12.5px;margin-top:6px;color:var(--text-body);line-height:1.45;">${s.powerStatus} ${s.landStatus}</p>
          </div>
        </div>
      </div>

      <!-- Component Execution Table -->
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>Component Stages & Detailed Scope Tracking (${s.components.length} Components)</h3>
            <p>Cumulative physical execution against sanctioned design scopes.</p>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Component Description</th>
                <th>Sanctioned Scope</th>
                <th>Executed to Date</th>
                <th>Unit</th>
                <th>Stage Pill</th>
                <th>Status Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${s.components.map((c) => {
                const pct = c.total > 0 ? Math.min(100, Math.round((c.completed / c.total) * 100)) : 0;
                const isDone = c.completed >= c.total;
                const isWip = c.completed > 0;
                return `
                  <tr>
                    <td><code>${c.id}</code></td>
                    <td><b>${c.name}</b></td>
                    <td>${c.total}</td>
                    <td><b style="color:var(--primary);font-size:14.5px;">${c.completed}</b></td>
                    <td>${c.unit}</td>
                    <td>
                      <span class="tag ${isDone ? 'tag-success' : isWip ? 'tag-warning' : 'tag-neutral'}">
                        ${c.stage} (${pct}%)
                      </span>
                    </td>
                    <td><small style="color:var(--text-muted);">${c.status}</small></td>
                    <td>
                      <button class="btn btn-outline btn-sm btn-quick-update" data-comp-id="${c.id}" data-comp-name="${c.name}" data-comp-unit="${c.unit}" data-comp-curr="${c.completed}">
                        Update
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Village Ayacut Distribution Table (if available) -->
      ${s.villages && s.villages.length ? `
        <div class="card-section">
          <div class="card-section-header">
            <div>
              <h3>Beneficiary Ayacut Distribution by Village (${s.villages.length} Villages)</h3>
              <p>Reconciled irrigation coverage under command network.</p>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="clean-table">
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Village Name</th>
                  <th>Mandal</th>
                  <th>Beneficiary Ayacut (Acres)</th>
                  <th>Ayacut Share (%)</th>
                </tr>
              </thead>
              <tbody>
                ${s.villages.map((v, idx) => `
                  <tr>
                    <td><b>${v.sl || (idx + 1)}</b></td>
                    <td><b>${v.name}</b></td>
                    <td>${v.mandal || s.mandals.join(', ')}</td>
                    <td><b>${v.ayacut !== null && v.ayacut !== undefined ? v.ayacut.toLocaleString('en-IN') + ' Acres' : '<span class="tag tag-neutral">Statement Pending</span>'}</b></td>
                    <td>${v.ayacut !== null && v.ayacut !== undefined ? `<span class="tag tag-primary">${Math.round((v.ayacut / s.ayacutAcres) * 1000) / 10} %</span>` : '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    // Event handlers for detail view
    $('#btn-back-overview', container)?.addEventListener('click', () => {
      setTab('overview');
    });

    $('#btn-log-for-scheme', container)?.addEventListener('click', () => {
      openFieldUpdateModal(s.id);
    });

    $$('.btn-quick-update', container).forEach((btn) => {
      btn.addEventListener('click', () => {
        openFieldUpdateModal(s.id, btn.dataset.compId);
      });
    });
  }

  // ------------------------------------------------------------- Render Ayacut & Village Network Tab
  function renderAyacut() {
    const container = $('#view-ayacut');
    if (!container) return;

    const bw = store.schemes.find((s) => s.id === 'BW');
    const vp = store.schemes.find((s) => s.id === 'VP-II');
    const dbc = store.schemes.find((s) => s.id === 'DBC');
    const thop = store.schemes.find((s) => s.id === 'THOP');

    container.innerHTML = `
      <!-- Executive Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:24px;">
        <div style="background:var(--bg-card);border:2px solid var(--primary);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow-sm);">
          <small style="font-size:11.5px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Package Grand Total</small>
          <div style="font-size:28px;font-weight:800;color:var(--primary);font-family:var(--font-mono);margin:4px 0;">23,665 Acres</div>
          <p style="font-size:13px;color:var(--text-body);">Full Command Coverage across 4 Nos. LIS Package</p>
        </div>

        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow-sm);">
          <small style="font-size:11.5px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">New Created Ayacut</small>
          <div style="font-size:28px;font-weight:800;color:var(--success);font-family:var(--font-mono);margin:4px 0;">11,839 Acres</div>
          <p style="font-size:13px;color:var(--text-body);">BW (3,400) + VP-II (2,500) + DBC (5,939)</p>
        </div>

        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow-sm);">
          <small style="font-size:11.5px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Stabilisation Ayacut</small>
          <div style="font-size:28px;font-weight:800;color:var(--water);font-family:var(--font-mono);margin:4px 0;">11,826 Acres</div>
          <p style="font-size:13px;color:var(--text-body);">BW (5,210) + DBC Tail End (6,300) + 6 Tanks (316)</p>
        </div>
      </div>

      <!-- Master Package Table -->
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>4 LIS Package — Scheme Ayacut Reconciliation</h3>
            <p>Official sanctioned breakdown between newly created ayacut and existing system stabilisation.</p>
          </div>
          <span class="tag tag-primary" style="font-size:13px;font-weight:700;">Grand Total: 23,665 Ac</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Mandal Jurisdiction</th>
                <th>New Ayacut (Ac)</th>
                <th>Stabilisation Ayacut (Ac)</th>
                <th>Total Ayacut (Ac)</th>
                <th>Villages / Outlets</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Bothalapalem–Wadapally LIS (BW)</b></td>
                <td>Damaracherla M</td>
                <td><b style="color:var(--success);">3,400 Ac</b></td>
                <td><b style="color:var(--water);">5,210 Ac</b></td>
                <td><b style="color:var(--primary);font-size:15px;">8,610 Ac</b></td>
                <td>7 Villages</td>
              </tr>
              <tr>
                <td><b>Veerlapalem–II LIS (VP-II)</b></td>
                <td>Damaracherla &amp; Adavidevulapally M</td>
                <td><b style="color:var(--success);">2,500 Ac</b></td>
                <td>—</td>
                <td><b style="color:var(--primary);font-size:15px;">2,500 Ac</b></td>
                <td>3 Villages (All New)</td>
              </tr>
              <tr>
                <td><b>DBC LIS (Dunnapothulagandi)</b></td>
                <td>Adavidevulapally M</td>
                <td><b style="color:var(--success);">5,939 Ac</b> <small style="color:var(--text-muted);">(VE-I report 5,393 corrected)</small></td>
                <td><b style="color:var(--water);">6,300 Ac</b> <small style="color:var(--text-muted);">(Mudimanikyam Major tail end)</small></td>
                <td><b style="color:var(--primary);font-size:15px;">12,239 Ac</b></td>
                <td>8 Villages</td>
              </tr>
              <tr>
                <td><b>Thopucherla LIS (THOP)</b></td>
                <td>Madgulapally M</td>
                <td>—</td>
                <td><b style="color:var(--water);">315.98 Ac</b></td>
                <td><b style="color:var(--primary);font-size:15px;">315.98 Ac</b></td>
                <td>6 Minor Tanks (39.50 Mcft)</td>
              </tr>
              <tr style="background:var(--bg-alt);font-weight:800;">
                <td colspan="2"><b>PACKAGE TOTAL (4 Nos. LIS)</b></td>
                <td><b style="color:var(--success);font-size:16px;">11,839 Ac</b></td>
                <td><b style="color:var(--water);font-size:16px;">11,826 Ac</b></td>
                <td><b style="color:var(--primary);font-size:17px;">23,665 Ac</b></td>
                <td><b>14 Villages &amp; 6 Tanks</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 1. Bothalapalem-Wadapally Village Breakdown -->
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>1. Bothalapalem–Wadapally LIS (Damaracherla M) — 8,610 Ac</h3>
            <p>Stabilisation: 5,210 Ac · New: 3,400 Ac</p>
          </div>
          <span class="tag tag-primary">Total: 8,610 Ac</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th style="width:70px;">Sl No</th>
                <th>Village Name</th>
                <th>Mandal</th>
                <th>Beneficiary Ayacut (Acres)</th>
                <th>Ayacut Share (%)</th>
              </tr>
            </thead>
            <tbody>
              ${(bw?.villages || []).map((v) => `
                <tr>
                  <td><b>${v.sl}</b></td>
                  <td><b>${v.name}</b></td>
                  <td>Damaracherla</td>
                  <td><b style="color:var(--primary);">${v.ayacut.toLocaleString('en-IN')} Acres</b></td>
                  <td><span class="tag tag-primary">${Math.round((v.ayacut / 8610) * 1000) / 10} %</span></td>
                </tr>
              `).join('')}
              <tr style="background:var(--bg-alt);font-weight:800;">
                <td colspan="3"><b>TOTAL BW AYACUT</b></td>
                <td><b style="color:var(--primary);font-size:15px;">8,610 Acres</b></td>
                <td><span class="tag tag-success">100.0 %</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. Veerlapalem-II Village Breakdown -->
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>2. Veerlapalem–II LIS — 2,500 Ac (All New)</h3>
            <p>3 Beneficiary Villages in Damaracherla &amp; Adavidevulapally Mandals.</p>
          </div>
          <span class="tag tag-primary">Total: 2,500 Ac</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th style="width:70px;">Sl No</th>
                <th>Village Name</th>
                <th>Mandal</th>
                <th>Beneficiary Ayacut (Acres)</th>
                <th>Ayacut Share (%)</th>
              </tr>
            </thead>
            <tbody>
              ${(vp?.villages || []).map((v) => `
                <tr>
                  <td><b>${v.sl}</b></td>
                  <td><b>${v.name}</b></td>
                  <td>${v.mandal}</td>
                  <td><b style="color:var(--primary);">${v.ayacut.toLocaleString('en-IN')} Acres</b></td>
                  <td><span class="tag tag-primary">${Math.round((v.ayacut / 2500) * 1000) / 10} %</span></td>
                </tr>
              `).join('')}
              <tr style="background:var(--bg-alt);font-weight:800;">
                <td colspan="3"><b>TOTAL VP-II AYACUT</b></td>
                <td><b style="color:var(--primary);font-size:15px;">2,500 Acres</b></td>
                <td><span class="tag tag-success">100.0 %</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3. DBC LIS Village Statement -->
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>3. DBC LIS (Adavidevulapally M) — 12,239 Ac</h3>
            <p>NSP Mudimanikyam Major Tail End Stabilisation: 6,300 Ac · New: 5,939 Ac</p>
          </div>
          <span class="tag tag-primary">Total: 12,239 Ac</span>
        </div>
        <div style="padding:12px 20px;background:var(--warning-soft);border-bottom:1px solid var(--border);color:#92400e;font-size:12.5px;">
          <b>Note:</b> The VE-I report recorded DBC new ayacut as 5,393 Ac; it is reconciled to <b>5,939 Ac</b> (+ 6,300 Ac stabilisation = 12,239 Ac). Individual village acre breakdown table will be finalized upon release of the sub-division statement.
        </div>
        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th style="width:70px;">Sl No</th>
                <th>Village Covered</th>
                <th>Mandal</th>
                <th>Ayacut Status</th>
              </tr>
            </thead>
            <tbody>
              ${(dbc?.villages || []).map((v) => `
                <tr>
                  <td><b>${v.sl}</b></td>
                  <td><b>${v.name}</b></td>
                  <td>${v.mandal}</td>
                  <td><span class="tag tag-neutral">Village Statement Pending</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4. Thopucherla Minor Tanks Breakdown -->
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>4. Thopucherla LIS (Madgulapally M) — 315.98 Ac (Tank Stabilisation)</h3>
            <p>Cascading network of 6 Nos. Minor Irrigation Tanks with total storage capacity 39.50 Mcft.</p>
          </div>
          <span class="tag tag-primary">Total: 315.98 Ac</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th style="width:70px;">Sl No</th>
                <th>Tank Name</th>
                <th>Village</th>
                <th>Beneficiary Ayacut (Acres)</th>
                <th>Storage Capacity (Mcft)</th>
                <th>Inlet Status</th>
              </tr>
            </thead>
            <tbody>
              ${LIS.TANKS.map((t) => `
                <tr>
                  <td><b>${t.sl}</b></td>
                  <td><b>${t.name}</b></td>
                  <td>${t.village}</td>
                  <td><b style="color:var(--primary);font-size:14.5px;">${t.ayacutAc} Acres</b></td>
                  <td><b style="font-family:var(--font-mono);">${t.capacityMcft} Mcft</b></td>
                  <td><span class="tag tag-success">${t.status}</span></td>
                </tr>
              `).join('')}
              <tr style="background:var(--bg-alt);font-weight:800;">
                <td colspan="3"><b>TOTAL THOPUCHERLA 6 TANKS</b></td>
                <td><b style="color:var(--primary);font-size:15px;">315.98 Acres</b></td>
                <td><b style="color:var(--water);font-size:15px;">39.50 Mcft</b></td>
                <td><span class="tag tag-success">100% Ready</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------- Render Bottlenecks Tab
  function renderIssues() {
    const container = $('#view-issues');
    if (!container) return;

    const urgentCount = store.issues.filter((i) => i.priority === 'High' && i.status !== 'Resolved').length;
    const totalCost = store.issues.reduce((acc, i) => acc + (i.costCr || 0), 0);

    container.innerHTML = `
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>Critical Bottlenecks & Approvals (${store.issues.length} Items · ${urgentCount} Urgent)</h3>
            <p>Financial liabilities, TGSPDCL power lines, land acquisition Section 19 awards, and technical compliances.</p>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="tag tag-danger" style="font-size:12px;">Total Financial Liability: ${inrCr(totalCost)}</span>
            <button class="btn btn-primary btn-sm" id="btn-add-issue">
              + Log New Issue
            </button>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Scheme</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Issue Title & Field Details</th>
                <th>Required Government / Department Action</th>
                <th>Liability (₹ Cr)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${store.issues.map((i) => {
                const isHigh = i.priority === 'High';
                const isResolved = i.status === 'Resolved';
                return `
                  <tr>
                    <td><code>${i.id}</code></td>
                    <td><span class="scheme-code-badge" style="font-size:11.5px;padding:2px 7px;">${i.scheme}</span></td>
                    <td><span class="tag tag-neutral">${i.category}</span></td>
                    <td><span class="tag ${isResolved ? 'tag-success' : isHigh ? 'tag-danger' : 'tag-warning'}">${i.priority}</span></td>
                    <td style="max-width:320px;">
                      <b>${i.title}</b>
                      <p style="font-size:12px;color:var(--text-muted);margin-top:2px;">${i.detail}</p>
                    </td>
                    <td style="max-width:280px;"><small style="color:var(--text-main);font-weight:500;">${i.actionNeeded}</small></td>
                    <td><b style="color:${i.costCr > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${i.costCr ? inrCr(i.costCr) : '—'}</b></td>
                    <td>
                      <select class="select-issue-status" data-issue-id="${i.id}" style="padding:4px 8px;font-size:12px;border-radius:6px;border:1px solid var(--border);">
                        <option value="Open" ${i.status === 'Open' ? 'selected' : ''}>Open</option>
                        <option value="In Progress" ${i.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Under Review" ${i.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                        <option value="Resolved" ${i.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                      </select>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    $$('.select-issue-status', container).forEach((sel) => {
      sel.addEventListener('change', (e) => {
        store.updateIssueStatus(e.target.dataset.issueId, e.target.value);
        renderKPIs();
      });
    });

    $('#btn-add-issue', container)?.addEventListener('click', () => {
      openAddIssueModal();
    });
  }

  // ------------------------------------------------------------- Render Tanks Network Tab
  function renderTanks() {
    const container = $('#view-tanks');
    if (!container) return;

    const tanksHtml = LIS.TANKS.map((t) => `
      <div class="scheme-box" style="padding:18px;">
        <div class="scheme-box-header">
          <span class="tag tag-primary">${t.village}</span>
          <span style="font-size:12px;font-weight:700;color:var(--text-muted);">${t.capacityMcft} Mcft</span>
        </div>
        <h3 style="font-size:17px;font-weight:800;color:var(--text-main);margin-bottom:4px;">${t.name}</h3>
        <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">Beneficiary Ayacut: <b>${t.ayacutAc} Acres</b></p>

        <div class="progress-block" style="margin-bottom:12px;">
          <div class="progress-labels">
            <span>Water Level / Filling Pct</span>
            <span style="color:var(--water);">${t.fillPct}%</span>
          </div>
          <div class="progress-bar-rail">
            <div class="progress-bar-fill" style="width:${t.fillPct}%;background:linear-gradient(90deg, #38bdf8, #0284c7);"></div>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
          <span class="tag tag-success">${t.status}</span>
          <button class="btn btn-outline btn-sm" onclick="alert('Viewing inlet sluice drawings for ${t.name}')">Inlet Info</button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="card-section" style="padding:16px 20px;margin-bottom:20px;">
        <h3 style="font-size:17px;font-weight:800;color:var(--text-main);">Thopucherla Cascading Tank Filling Network</h3>
        <p style="font-size:12.5px;color:var(--text-muted);margin-top:4px;">6 Nos. minor irrigation tanks fed from L-14 Canal lifting system across Madgulapally mandal. 100% on departmental land (Zero private land acquisition).</p>
      </div>

      <div class="schemes-showcase" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
        ${tanksHtml}
      </div>
    `;
  }

  // ------------------------------------------------------------- Render Financials Tab
  function renderFinance() {
    const container = $('#view-finance');
    if (!container) return;

    const totalFundingNeeded = LIS.FUNDING_SUMMARY.reduce((acc, f) => acc + f.total, 0);

    container.innerHTML = `
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>Agreement &amp; Sanction Financial Comparison (Package Total: ₹548.23 Cr)</h3>
            <p>Original agreement vs Supplemental agreement vs Total Recorded Work Done.</p>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Scheme</th>
                <th>Sanction (₹ Cr)</th>
                <th>Tech. Sanction (₹ Cr)</th>
                <th>Orig. Agreement (₹ Cr)</th>
                <th>Supp. Agreement (₹ Cr)</th>
                <th>Cumulative Bill (₹ Cr)</th>
                <th>Measured Work Done (₹ Cr)</th>
              </tr>
            </thead>
            <tbody>
              ${store.schemes.map((s) => `
                <tr>
                  <td><b>${s.name} (${s.id})</b></td>
                  <td>${inrCr(s.sanction)}</td>
                  <td>${inrCr(s.ts)}</td>
                  <td>${inrCr(s.ecv)}</td>
                  <td><b style="color:var(--primary);">${inrCr(s.supp / 10000000)}</b></td>
                  <td>${inrCr(s.bill / 10000000)}</td>
                  <td><b>${inrCr(s.work)}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>Pending Funding Requisitions &amp; Liabilities (Total: ${inrCr(totalFundingNeeded)})</h3>
            <p>Clearance breakdown of urgent land compensation, power deposit, and pending bills.</p>
          </div>
          <span class="tag tag-danger">Urgent Requisitions: ${inrCr(totalFundingNeeded)}</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="clean-table">
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
      </div>
    `;
  }

  // ------------------------------------------------------------- Render Measurement Log (MB) Tab
  function renderLogs() {
    const container = $('#view-logs');
    if (!container) return;

    container.innerHTML = `
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>Field Measurement Register &amp; MB Audit Trail (${store.logs.length} Entries)</h3>
            <p>Chronological record of cumulative physical quantities verified by field engineering officers.</p>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-primary btn-sm" id="btn-open-log-modal-tab">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
              + Record New Entry
            </button>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Scheme</th>
                <th>Component Description</th>
                <th>Cumulative Measured</th>
                <th>Measurement Ref (MB)</th>
                <th>Reporting Officer</th>
                <th>Site Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${store.logs.map((l) => `
                <tr>
                  <td><b>${l.date}</b></td>
                  <td><span class="scheme-code-badge" style="font-size:11.5px;padding:2px 7px;">${l.schemeId}</span></td>
                  <td><b>${l.componentName}</b></td>
                  <td><b style="color:var(--primary);font-size:14.5px;">${l.quantity} ${l.unit}</b></td>
                  <td><code>${l.ref}</code></td>
                  <td>${l.officer}</td>
                  <td><small style="color:var(--text-muted);">${l.remarks}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    $('#btn-open-log-modal-tab', container)?.addEventListener('click', () => {
      openFieldUpdateModal();
    });
  }

  // ------------------------------------------------------------- Field Update Modal Dialog
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

    // Populate schemes dropdown
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
    inpQty.focus();
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
      else if (currentTab === 'scheme-detail' && activeSchemeId === schemeId) openSchemeDetail(schemeId);
      else if (currentTab === 'logs') renderLogs();
    } catch (err) {
      alert('Error saving update: ' + err.message);
    }
  }

  // ------------------------------------------------------------- Log New Issue
  function openAddIssueModal() {
    const title = prompt('Enter Issue Title:');
    if (!title) return;
    const scheme = prompt('Enter Scheme Code (BW, DBC, VP-II, THOP):', 'BW') || 'BW';
    const category = prompt('Enter Category (Power, Land, Technical, Funding):', 'Power') || 'Power';
    const detail = prompt('Enter Issue Description:') || '';
    const actionNeeded = prompt('Enter Required Department Action:') || '';
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

  // ------------------------------------------------------------- Command Palette (Ctrl + K)
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
        if (!q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)) {
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
              sub: `Executed: ${c.completed} / ${c.total} ${c.unit} (${c.stage})`,
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
        <div class="palette-item" data-idx="${idx}" style="padding:10px 14px;border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);">
          <div>
            <b>${it.title}</b>
            <p style="font-size:12px;color:var(--text-muted);">${it.sub}</p>
          </div>
          <span class="tag tag-neutral">${it.type}</span>
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
    $$('.view-tab-btn').forEach((b) => {
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
    else if (tabName === 'ayacut') renderAyacut();
    else if (tabName === 'issues') renderIssues();
    else if (tabName === 'tanks') renderTanks();
    else if (tabName === 'finance') renderFinance();
    else if (tabName === 'logs') renderLogs();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ------------------------------------------------------------- App Initializer
  function init() {
    renderKPIs();
    renderOverview();

    // Tab buttons event listeners
    $$('.view-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setTab(btn.dataset.tab);
      });
    });

    // Modal close & save triggers
    $('#btn-close-modal-field')?.addEventListener('click', closeFieldUpdateModal);
    $('#btn-cancel-modal-field')?.addEventListener('click', closeFieldUpdateModal);
    $('#btn-save-modal-field')?.addEventListener('click', handleSaveFieldUpdate);

    // Top action buttons
    $('#btn-top-log')?.addEventListener('click', () => openFieldUpdateModal());
    $('#btn-export-excel')?.addEventListener('click', () => LIS.exportExcel());
    $('#btn-export-pdf')?.addEventListener('click', () => LIS.exportPDF());
    $('#btn-print')?.addEventListener('click', () => window.print());

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
