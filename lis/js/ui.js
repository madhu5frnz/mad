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
    const totalAyacut = 23665;
    const totalSanction = 548.23;
    const totalSupp = 296.21;
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

          ${(() => {
            const emhm = LIS.EM_HM_DATA?.abstract?.find(a => a.id === s.id);
            if (!emhm) return '';
            return `
              <div style="margin-top:8px;padding:6px 10px;background:var(--bg-alt);border-radius:6px;border:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;font-size:11.5px;">
                <span style="color:var(--text-muted);">
                  ⚙️ <b>EM &amp; HM:</b> ${emhm.totalItems} Items (₹ ${emhm.boqCr} Cr)
                </span>
                <span style="display:flex;gap:4px;align-items:center;">
                  <span class="tag tag-success" style="font-size:10px;padding:1px 5px;">${emhm.approved} Approved</span>
                  <a href="javascript:void(0)" class="btn-goto-emhm-scheme" data-scheme="${s.id}" style="color:var(--primary);font-weight:700;text-decoration:none;margin-left:4px;">Check List →</a>
                </span>
              </div>
            `;
          })()}

          ${s.id === 'DBC' ? `
            <div style="margin-top:10px;padding:8px 12px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span style="font-size:12px;font-weight:700;color:#166534;display:flex;align-items:center;gap:6px;">
                🗺️ 3 GIS Survey Files Available (8.2 km PM &amp; 30 Sy.Nos LA)
              </span>
              <button class="btn btn-outline btn-sm btn-goto-gis-tab" style="font-size:11px;padding:3px 8px;border-color:#16a34a;color:#166534;background:#fff;">
                View KML Files →
              </button>
            </div>
          ` : ''}

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

    $$('.btn-goto-gis-tab', container).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setTab('gis');
      });
    });

    $$('.btn-goto-emhm-scheme', container).forEach((link) => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        emhmFilterScheme = link.dataset.scheme;
        setTab('emhm');
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
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Supp. Agreement</small><b style="font-size:14px;color:var(--text-main);">${inrCr(s.supp / 10000000)}</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Price Escalation (Part-III LS)</small><b style="font-size:14px;color:var(--primary);">${s.priceEscalationCr ? inrCr(s.priceEscalationCr) : '—'}</b></div>
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

        <!-- Official Government Orders & Technical Revisions (EE Miryalaguda) -->
        <div style="margin-top:16px;background:var(--bg-card);border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:var(--radius-md);padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px;">
            <div>
              <b style="font-size:14.5px;color:var(--text-main);display:flex;align-items:center;gap:8px;">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
                Official Government Orders &amp; Engineering Directives (EE Division No. 3, Miryalaguda)
              </b>
              <p style="font-size:12px;color:var(--text-muted);margin-top:3px;">Baseline administrative sanction, technical revisions, pipeline designs, and immediate funding requirements.</p>
            </div>
            <span class="tag tag-primary">Official Note: 06.11.2026</span>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-bottom:14px;">
            ${s.adminSanctionGo ? `
              <div style="background:var(--bg-alt);padding:10px 12px;border-radius:6px;border:1px solid var(--border);">
                <small style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Admin Sanction (AS)</small>
                <b style="font-size:13px;color:var(--text-main);display:block;margin:2px 0;">${s.adminSanction ? inrCr(s.adminSanction) : '—'}</b>
                <span style="font-size:11.5px;color:var(--text-muted);">${s.adminSanctionGo}</span>
              </div>
            ` : ''}

            ${s.cerNo || s.tsNo ? `
              <div style="background:var(--bg-alt);padding:10px 12px;border-radius:6px;border:1px solid var(--border);">
                <small style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Technical Sanction / ECV</small>
                <b style="font-size:13px;color:var(--text-main);display:block;margin:2px 0;">ECV: ${s.ecv ? inrCr(s.ecv) : '—'} · TS: ${s.origTs ? inrCr(s.origTs) : (s.ts ? inrCr(s.ts) : '—')}</b>
                <span style="font-size:11.5px;color:var(--text-muted);">${s.cerNo || ('TS No: ' + s.tsNo)}</span>
              </div>
            ` : ''}

            ${s.veGo ? `
              <div style="background:var(--bg-alt);padding:10px 12px;border-radius:6px;border:1px solid var(--border);">
                <small style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Variation Estimate-I / Revised TS</small>
                <b style="font-size:13px;color:var(--accent);display:block;margin:2px 0;">Revised Est: ${inrCr(s.ve || s.sanction)} · Revised Agmt: ${inrCr(s.revisedAgreement || s.totalAgreementVal || s.sanction)}</b>
                <span style="font-size:11.5px;color:var(--text-muted);">${s.veGo}</span>
              </div>
            ` : ''}

            <div style="background:var(--bg-alt);padding:10px 12px;border-radius:6px;border:1px solid var(--border);">
              <small style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Contractor &amp; Target Timeline</small>
              <b style="font-size:13px;color:var(--text-main);display:block;margin:2px 0;">${s.agency || 'M/s. Kaveri-Shantha-MEIL (JV)'}</b>
              <span style="font-size:11.5px;color:var(--primary);font-weight:600;">Target: ${s.targetCompletion || 'March 2028'}</span> <small style="color:var(--text-muted);">(${s.eot || '2nd EOT granted'})</small>
            </div>
          </div>

          <!-- Specific Directives & Token Details -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
            ${s.surgeRecommendation ? `
              <div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.3);border-radius:6px;padding:10px 12px;">
                <b style="font-size:12.5px;color:var(--amber);display:flex;align-items:center;gap:6px;">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                  Surge Analysis &amp; Pipe Thickness
                </b>
                <p style="font-size:12px;color:var(--text-body);margin-top:4px;line-height:1.4;">${s.surgeRecommendation}. Km 2.0 to 8.150 approved; Km 0.00 to 2.00 Km submitted with 16mm thick pipe design.</p>
              </div>
            ` : ''}

            ${s.gravityMain ? `
              <div style="background:var(--bg-alt);border:1px solid var(--border);border-radius:6px;padding:10px 12px;">
                <b style="font-size:12.5px;color:var(--brand-blue);display:flex;align-items:center;gap:6px;">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
                  Gravity Distribution Mains Scope
                </b>
                <p style="font-size:12px;color:var(--text-body);margin-top:4px;line-height:1.4;">${s.gravityMain}. Approved in Variation Estimate-I to command ayacut.</p>
              </div>
            ` : ''}

            ${s.pendingBills ? `
              <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:10px 12px;">
                <b style="font-size:12.5px;color:var(--danger);display:flex;align-items:center;gap:6px;">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                  Treasury Tokens &amp; Immediate Requisitions
                </b>
                <p style="font-size:12px;color:var(--text-body);margin-top:4px;line-height:1.4;">
                  ${s.pendingBills.workBills ? `• <b>Works Bill Token:</b> <code>${s.pendingBills.workBills.token}</code> for <b>${inrCr(s.pendingBills.workBills.amountCr)}</b> (HOA: <code>${s.pendingBills.workBills.hoa}</code>)<br/>` : ''}
                  ${s.pendingBills.nonWork ? `• <b>TG TRANSCO Token:</b> <code>${s.pendingBills.nonWork.token}</code> Dt ${s.pendingBills.nonWork.date} for <b>${inrCr(s.pendingBills.nonWork.amountCr)}</b> (Total Power: ₹57.29 Cr)<br/>` : ''}
                  ${s.pendingBills.laToken ? `• <b>PAO Land Acquisition Token:</b> <code style="font-weight:700;">${s.pendingBills.laToken.token}</code> (Dt: ${s.pendingBills.laToken.date}) for <b style="color:var(--danger);font-size:13px;">${inrCr(s.pendingBills.laToken.amountCr)}</b> (HOA: <code>${s.pendingBills.laToken.hoa}</code>) — ${s.pendingBills.laToken.purpose}<br/>` : ''}
                  ${s.pendingBills.powerDepositCr ? `• <b>TGSPDCL Substation &amp; Power Deposit:</b> <b>${inrCr(s.pendingBills.powerDepositCr)}</b> (Dedicated line &amp; 33/11 kV substation)<br/>` : ''}
                  ${s.pendingBills.totalImmediateFundingCr ? `• <b>Immediate Total Funding Required:</b> <b style="color:var(--danger);">${inrCr(s.pendingBills.totalImmediateFundingCr)}</b>` : ''}
                </p>
              </div>
            ` : ''}

            ${s.forestStatus ? `
              <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:10px 12px;">
                <b style="font-size:12.5px;color:var(--success);display:flex;align-items:center;gap:6px;">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" clip-rule="evenodd"/></svg>
                  Statutory Forest Land Clearance
                </b>
                <p style="font-size:12px;color:var(--text-body);margin-top:4px;line-height:1.4;">
                  ${s.forestStatus}
                </p>
              </div>
            ` : ''}

            ${s.fundsBreakdown ? `
              <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.3);border-radius:6px;padding:10px 12px;">
                <b style="font-size:12.5px;color:var(--brand-blue);display:flex;align-items:center;gap:6px;">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" clip-rule="evenodd"/></svg>
                  Immediate Fund Requisition: ${inrCr(s.fundsBreakdown.totalCr)}
                </b>
                <p style="font-size:12px;color:var(--text-body);margin-top:4px;line-height:1.4;">
                  • Civil Works Execution: <b>${inrCr(s.fundsBreakdown.civilWorksCr)}</b><br/>
                  • Pumps &amp; Motors Procurement: <b>${inrCr(s.fundsBreakdown.pumpsMotorsCr)}</b><br/>
                  • Transformer Yard &amp; Line: <b>${inrCr(s.fundsBreakdown.powerTransformerCr)}</b><br/>
                  <small style="color:var(--text-muted);display:block;margin-top:2px;">(Pending Bills: NIL · Released to date: NIL · Work Done: ${inrCr(s.work)} / ${s.workPctRevised}%)</small>
                </p>
              </div>
            ` : ''}
          </div>
        </div>

        ${s.kmlFiles && s.kmlFiles.length > 0 ? `
          <div style="margin-top:16px;background:var(--bg-card);border:1px solid var(--border);border-left:4px solid var(--primary);border-radius:var(--radius-md);padding:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
              <div>
                <b style="font-size:14px;color:var(--text-main);display:flex;align-items:center;gap:8px;">
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
                  GIS Alignment &amp; Land Acquisition Survey Files (KML)
                </b>
                <p style="font-size:12px;color:var(--text-muted);margin-top:3px;">Field alignment coordinates, chainage marks (0 to 8.2 km), 3.5m offset corridor, and 30 Land Acquisition survey numbers.</p>
              </div>
              <span class="tag tag-primary">3 Survey KMLs Loaded</span>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;margin-bottom:14px;">
              ${s.kmlFiles.map(kf => `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:var(--bg-alt);border-radius:6px;border:1px solid var(--border);">
                  <div style="overflow:hidden;">
                    <b style="display:block;font-size:12.5px;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${kf.name}</b>
                    <small style="font-size:11px;color:var(--text-muted);display:block;">${kf.desc} · <b>${kf.size}</b></small>
                  </div>
                  <a href="${kf.path}" download="${kf.file}" class="btn btn-outline btn-sm" style="flex-shrink:0;padding:4px 9px;font-size:11.5px;">
                    ⬇ Download
                  </a>
                </div>
              `).join('')}
            </div>

            ${s.surveyNumbers && s.surveyNumbers.length > 0 ? `
              <div>
                <small style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">
                  Pipeline Corridor Survey Numbers (${s.surveyNumbers.length} Nos across Chityala, Molkacherla, Balnepally, Adavidevulapally):
                </small>
                <div style="display:flex;flex-wrap:wrap;gap:5px;">
                  ${s.surveyNumbers.map(sn => `<span class="tag tag-neutral" style="font-family:var(--font-mono);font-size:11px;padding:2px 6px;">Sy.No ${sn}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
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
                  ${s.villages.some(item => item.tanks) ? `<th>Tanks / Water Bodies Benefited</th>` : ''}
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
                    ${s.villages.some(item => item.tanks) ? `<td><small style="color:var(--text-main);font-weight:600;">${v.tanks || '—'}</small></td>` : ''}
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
            <h3>3. Dunnapothulagandi–Balnepally–Champla Thanda LIS — 12,239 Ac</h3>
            <p>Source: Haliya River near Chityala · Mudimanikyam Major Tail End: 6,300 Ac · New: 5,939 Ac</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="tag tag-warning">Target: July 2027</span>
            <span class="tag tag-primary">Total: 12,239 Ac</span>
          </div>
        </div>
        <div style="padding:12px 20px;background:var(--bg-alt);border-bottom:1px solid var(--border);color:var(--text-body);font-size:12.5px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span><b>Agency:</b> M/s. Kaveri-Shantha–MEIL (JV) · <b>Agreement:</b> ₹119.26 Cr + Supp ₹179.42 Cr (Total ₹374.90 Cr)</span>
          <span style="color:var(--danger);font-weight:700;">⚠️ TG TRANSCO Token No.2602014999 (₹31.42 Cr) pending release</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th style="width:70px;">Sl No</th>
                <th>Name of the Benefitted Village</th>
                <th>Mandal</th>
                <th>Total Beneficiary Ayacut (Acres)</th>
                <th>Ayacut Share (%)</th>
              </tr>
            </thead>
            <tbody>
              ${(dbc?.villages || []).map((v) => `
                <tr>
                  <td><b>${v.sl}</b></td>
                  <td><b>${v.name}</b></td>
                  <td>${v.mandal}</td>
                  <td><b style="color:var(--primary);">${v.ayacut.toLocaleString('en-IN')} Acres</b></td>
                  <td><span class="tag tag-primary">${Math.round((v.ayacut / 12239) * 1000) / 10} %</span></td>
                </tr>
              `).join('')}
              <tr style="background:var(--bg-alt);font-weight:800;">
                <td colspan="3"><b>TOTAL DBC AYACUT (7 VILLAGES)</b></td>
                <td><b style="color:var(--primary);font-size:15px;">12,239 Acres</b></td>
                <td><span class="tag tag-success">100.0 %</span></td>
              </tr>
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
      <!-- Supplemental Agreement No. 03 Official Breakdown -->
      <div class="card-section" style="margin-bottom:24px;">
        <div class="card-section-header">
          <div>
            <h3>Supplemental Agreement No. 03/SE/ICHC/2026-27 (dt 27.08.2026) — 4 LIS</h3>
            <p>Original Agreement: <b>21SE/ICHC/2021-22</b> for <b>Rs. 285,99,44,991</b> (≈ ₹285.99 Cr)</p>
          </div>
          <span class="tag tag-primary" style="font-size:14px;font-weight:800;">Net Agreement Value: ₹ 296.21 Cr</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;padding:18px 20px;background:var(--bg-alt);border-bottom:1px solid var(--border);">
          <div style="background:var(--bg-card);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border);">
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Value at Estimate Rates</small>
            <b style="font-size:18px;color:var(--text-main);font-family:var(--font-mono);">Rs. 2,84,95,45,051</b>
            <span style="display:block;font-size:12px;color:var(--text-muted);margin-top:2px;">≈ ₹ 284.95 Crores</span>
          </div>
          <div style="background:var(--bg-card);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border);">
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">T.P. @ 3.95% Excess</small>
            <b style="font-size:18px;color:var(--warning);font-family:var(--font-mono);">Rs. 11,25,57,030</b>
            <span style="display:block;font-size:12px;color:var(--text-muted);margin-top:2px;">≈ ₹ 11.26 Crores (+3.95%)</span>
          </div>
          <div style="background:var(--bg-card);padding:14px;border-radius:var(--radius-md);border:2px solid var(--primary);">
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Net Supplemental Value</small>
            <b style="font-size:18px;color:var(--primary);font-family:var(--font-mono);">Rs. 2,96,21,02,081</b>
            <span style="display:block;font-size:12px;color:var(--primary);font-weight:700;margin-top:2px;">≈ ₹ 296.21 Crores</span>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Scheme Code</th>
                <th>Amount at Estimate Rates (Rs)</th>
                <th>Share in ₹ Crores</th>
                <th>Percentage of Estimate Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Bothalapalem–Wadapally LIS</b></td>
                <td><span class="scheme-code-badge" style="font-size:11.5px;padding:2px 7px;">BW</span></td>
                <td><b style="font-family:var(--font-mono);">Rs. 1,07,45,75,978</b></td>
                <td><b style="color:var(--primary);">₹ 107.46 Cr</b></td>
                <td>37.71 %</td>
              </tr>
              <tr>
                <td><b>Veerlapalem–II LIS</b></td>
                <td><span class="scheme-code-badge" style="font-size:11.5px;padding:2px 7px;">VP-II</span></td>
                <td><b style="font-family:var(--font-mono);">Rs. 21,53,78,858</b></td>
                <td><b style="color:var(--primary);">₹ 21.54 Cr</b></td>
                <td>7.56 %</td>
              </tr>
              <tr>
                <td><b>Dunnapothulagandi (DBC) LIS</b></td>
                <td><span class="scheme-code-badge" style="font-size:11.5px;padding:2px 7px;">DBC</span></td>
                <td><b style="font-family:var(--font-mono);">Rs. 1,43,92,24,885</b></td>
                <td><b style="color:var(--primary);">₹ 143.92 Cr</b></td>
                <td>50.51 %</td>
              </tr>
              <tr>
                <td><b>Thopucherla LIS (6 Tanks)</b></td>
                <td><span class="scheme-code-badge" style="font-size:11.5px;padding:2px 7px;">THOP</span></td>
                <td><b style="font-family:var(--font-mono);">Rs. 12,03,65,330</b></td>
                <td><b style="color:var(--primary);">₹ 12.04 Cr</b></td>
                <td>4.22 %</td>
              </tr>
              <tr style="background:var(--bg-alt);font-weight:800;">
                <td colspan="2"><b>TOTAL AT ESTIMATE RATES</b></td>
                <td><b style="color:var(--primary);font-size:15px;font-family:var(--font-mono);">Rs. 2,84,95,45,051</b></td>
                <td><b style="color:var(--primary);font-size:15px;">₹ 284.95 Cr</b></td>
                <td><b>100.0 %</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Variation Estimate-I / Revised TS — Part-III Lumpsum Price Escalation -->
      <div class="card-section" style="margin-bottom:24px;">
        <div class="card-section-header">
          <div>
            <h3>Variation Estimate-I / Revised TS — Part-III Lumpsum Price Escalation (Total: Rs. 8.84 Cr)</h3>
            <p>Sanctioned exclusively under Part-III Lumpsum of Revised TS (₹548.23 Cr) · Excluded from Supplemental Agreement</p>
          </div>
          <span class="tag tag-warning" style="font-size:13.5px;font-weight:800;">Total Escalation: ₹ 8.84 Cr</span>
        </div>

        <div style="padding:14px 20px;background:#fefce8;border-left:4px solid var(--warning);border-bottom:1px solid var(--border);color:var(--text-main);font-size:13px;line-height:1.5;">
          <b>Official Accounting Principle:</b> Price escalation is <b>NOT</b> part of the Supplemental Agreement (<code>03/SE/ICHC/2026-27</code>, Rs 296.21 Cr) — the <b>242 Schedule-A items have zero escalation item</b>.<br>
          Price escalation is provided <b>only</b> in the Variation Estimate-I / Revised TS (Rs 548.23 Cr) under <b>Part-III Lumpsum</b>.
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;padding:18px 20px;background:var(--bg-alt);border-bottom:1px solid var(--border);">
          <div style="background:var(--bg-card);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border);">
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">BW LIS (40% Share)</small>
            <b style="font-size:17px;color:var(--text-main);font-family:var(--font-mono);">Rs. 3,53,68,359.18</b>
            <span style="display:block;font-size:12px;color:var(--primary);font-weight:700;margin-top:2px;">₹ 3.54 Crores</span>
          </div>
          <div style="background:var(--bg-card);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border);">
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">DBC LIS (40% Share)</small>
            <b style="font-size:17px;color:var(--text-main);font-family:var(--font-mono);">Rs. 3,53,68,359.18</b>
            <span style="display:block;font-size:12px;color:var(--primary);font-weight:700;margin-top:2px;">₹ 3.54 Crores</span>
          </div>
          <div style="background:var(--bg-card);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border);">
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Veerlapalem–II (10% Share)</small>
            <b style="font-size:17px;color:var(--text-main);font-family:var(--font-mono);">Rs. 88,42,089.79</b>
            <span style="display:block;font-size:12px;color:var(--primary);font-weight:700;margin-top:2px;">₹ 0.88 Crores</span>
          </div>
          <div style="background:var(--bg-card);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border);">
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Thopucherla (10% Share)</small>
            <b style="font-size:17px;color:var(--text-main);font-family:var(--font-mono);">Rs. 88,42,089.79</b>
            <span style="display:block;font-size:12px;color:var(--primary);font-weight:700;margin-top:2px;">₹ 0.88 Crores</span>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Scheme Code</th>
                <th>Part-III Lumpsum Escalation Amount (Rs)</th>
                <th>Share (₹ Cr)</th>
                <th>Allocation (%)</th>
                <th>Contractual Accounting Provision</th>
              </tr>
            </thead>
            <tbody>
              ${(LIS.PRICE_ESCALATION?.schemes || []).map((pe) => `
                <tr>
                  <td><b>${pe.name}</b></td>
                  <td><span class="scheme-code-badge" style="font-size:11.5px;padding:2px 7px;">${pe.id}</span></td>
                  <td><b style="font-family:var(--font-mono);">Rs. ${pe.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
                  <td><b style="color:var(--primary);">₹ ${pe.amountCr.toFixed(2)} Cr</b></td>
                  <td><span class="tag tag-primary">${pe.sharePct.toFixed(1)} %</span></td>
                  <td><small style="color:var(--text-muted);">Revised TS Part-III LS (0 in Supp Agmt 242 items)</small></td>
                </tr>
              `).join('')}
              <tr style="background:var(--bg-alt);font-weight:800;">
                <td colspan="2"><b>TOTAL PRICE ESCALATION (PART-III LUMPSUM)</b></td>
                <td><b style="color:var(--primary);font-size:15px;font-family:var(--font-mono);">Rs. ${LIS.PRICE_ESCALATION.totalExact.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
                <td><b style="color:var(--primary);font-size:15px;">₹ ${LIS.PRICE_ESCALATION.total.toFixed(2)} Cr</b></td>
                <td><span class="tag tag-success">100.0 %</span></td>
                <td><b>Sanctioned in Revised TS ₹548.23 Cr</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>Agreement &amp; Sanction Financial Comparison (Package Total: ₹548.23 Cr)</h3>
            <p>Original agreement vs Supplemental agreement vs Price Escalation vs Total Recorded Work Done.</p>
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
                <th>Price Escalation (Part-III LS)</th>
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
                  <td><b style="color:var(--warning);">${s.priceEscalationCr ? inrCr(s.priceEscalationCr) : '—'}</b></td>
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
                <th>DBC (₹ Cr)</th>
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
                  <td>${f.dbc ? inrCr(f.dbc) : '—'}</td>
                  <td>${f.thop ? inrCr(f.thop) : '—'}</td>
                  <td><b style="color:var(--danger);">${inrCr(f.total)}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Official Treasury Tokens & Immediate Funding Register -->
      <div class="card-section" style="margin-top:24px;">
        <div class="card-section-header">
          <div>
            <h3>Official Treasury Tokens &amp; Immediate Execution Funding Requisitions</h3>
            <p>Certified bills, token tracking, and urgent capital requirements submitted by EE, Irrigation Division No.3, Miryalaguda.</p>
          </div>
          <span class="tag tag-danger" style="font-size:13px;font-weight:800;">4 Schemes Requisition Statements · Official EE Notes (Oct/Nov 2026)</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;padding:20px;">
          <!-- 1. DBC LIS Funding Card -->
          <div style="background:var(--bg-alt);border:1px solid var(--border);border-left:4px solid var(--warning);border-radius:var(--radius-md);padding:18px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span class="scheme-code-badge" style="font-size:12px;padding:3px 8px;">DBC LIS</span>
              <span class="tag tag-danger">Immediate Req: ₹ 71.29 Cr</span>
            </div>
            <h4 style="font-size:16px;font-weight:800;color:var(--text-main);margin-bottom:8px;">Dunnapothulagandi Lift Irrigation Scheme</h4>
            <p style="font-size:12.5px;color:var(--text-body);line-height:1.45;margin-bottom:12px;">
              Required immediately to facilitate the execution of Pressure Mains, Substation and Civil Works.
            </p>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:10px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">1. Works Bill Pending in Treasury:</b>
              Token No: <b style="color:var(--primary);font-family:var(--font-mono);">2702277887</b><br>
              Head of Account: <code style="font-size:11px;">4700-01-129-25-27-530-531-PVN</code><br>
              Amount: <b style="color:var(--danger);font-size:13px;">Rs. 37.08 Crores</b>
            </div>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:10px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">2. TG TRANSCO Substation Deposit Pending:</b>
              Token No: <b style="color:var(--primary);font-family:var(--font-mono);">2602014999</b> Dt: 21.11.2025<br>
              Deposit Amount: <b style="color:var(--danger);font-size:13px;">Rs. 31.42 Crores</b><br>
              <small style="color:var(--text-muted);">Total power extension requirement is <b>Rs. 57.29 Cr</b> (revised estimate awaited from TGTRANSCO for relocated substation from Wadapally).</small>
            </div>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">3. Civil Works Requisition:</b>
              Approach Channel, Forebay and Pump House: <b style="color:var(--primary);">Rs. 14.00 Crores</b> (Total civil work executed to date: ~₹14.00 Cr).
            </div>
          </div>

          <!-- 2. Bothalapalem-Wadapally LIS Funding Card -->
          <div style="background:var(--bg-alt);border:1px solid var(--border);border-left:4px solid var(--brand-accent);border-radius:var(--radius-md);padding:18px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span class="scheme-code-badge" style="font-size:12px;padding:3px 8px;">BW LIS</span>
              <span class="tag tag-danger">PAO Token: ₹ 7.00 Cr</span>
            </div>
            <h4 style="font-size:16px;font-weight:800;color:var(--text-main);margin-bottom:8px;">Bothalapalem–Wadapally Lift Irrigation Scheme</h4>
            <p style="font-size:12.5px;color:var(--text-body);line-height:1.45;margin-bottom:12px;">
              Civil Works of <b>Rs. 14.13 Cr (9.64%)</b> completed. Sump walls to +65.00m. 11.045 km PM stalled awaiting LA corridor.
            </p>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:10px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">1. Land Acquisition Token at PAO:</b>
              Token No: <b style="color:var(--primary);font-family:var(--font-mono);">2702237346</b> Dt: 19.09.2026<br>
              Head of Account: <code style="font-size:11px;">4700-01-129-25-27-530-532-PVN</code><br>
              Compensation: <b style="color:var(--danger);font-size:13px;">Rs. 7.00 Crores</b> (Ac. 39-35.70 Gts across 7 villages)
            </div>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:10px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">2. TGSPDCL Power Supply Deposit:</b>
              Deposit Amount: <b style="color:var(--primary);font-size:13px;">Rs. 12.78 Crores</b><br>
              <small style="color:var(--text-muted);">Required to commence erection of 33/11 KV Substation, dedicated power lines, and transformers.</small>
            </div>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">3. Forest Land Clearance (PARIVESH Portal):</b>
              Area: <b style="color:var(--success);">0.1518 Hectares</b> in Damaracherla mandal. Application submission critically required.
            </div>
          </div>

          <!-- 3. Veerlapalem-II LIS Funding Card -->
          <div style="background:var(--bg-alt);border:1px solid var(--border);border-left:4px solid var(--brand-teal);border-radius:var(--radius-md);padding:18px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span class="scheme-code-badge" style="font-size:12px;padding:3px 8px;">VP-II LIS</span>
              <span class="tag tag-warning">PAO Token: ₹ 2.20 Cr</span>
            </div>
            <h4 style="font-size:16px;font-weight:800;color:var(--text-main);margin-bottom:8px;">Veerlapalem–II Lift Irrigation Scheme</h4>
            <p style="font-size:12.5px;color:var(--text-body);line-height:1.45;margin-bottom:12px;">
              Civil Works of <b>Rs. 3.43 Cr (12.46%)</b> completed. Sump walls to +45.50m. 6,050m pipeline awaiting LA handover.
            </p>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:10px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">1. Land Acquisition Token at PAO:</b>
              Token No: <b style="color:var(--primary);font-family:var(--font-mono);">2702151464</b> Dt: 10.09.2026<br>
              Head of Account: <code style="font-size:11px;">4700-01-129-25-27-530-532-PVN</code><br>
              Compensation: <b style="color:var(--danger);font-size:13px;">Rs. 2.20 Crores</b> (Ac. 16-31.00 Gts across 3 villages)
            </div>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:10px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">2. TGSPDCL Power Infrastructure Deposit:</b>
              Deposit Amount: <b style="color:var(--primary);font-size:13px;">Rs. 3.78 Crores</b><br>
              <small style="color:var(--text-muted);">Required for dedicated 33/11 KV electrical line extension and substation erection.</small>
            </div>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">3. Forest Land Clearance (PARIVESH Portal):</b>
              Area: <b style="color:var(--success);">0.6930 Hectares</b> in Veerlapalem village. Registration and submission expedited.
            </div>
          </div>

          <!-- 4. Thopucherla LIS Funding Card -->
          <div style="background:var(--bg-alt);border:1px solid var(--border);border-left:4px solid var(--primary);border-radius:var(--radius-md);padding:18px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span class="scheme-code-badge" style="font-size:12px;padding:3px 8px;">THOP LIS</span>
              <span class="tag tag-warning">Immediate Req: ₹ 7.35 Cr</span>
            </div>
            <h4 style="font-size:16px;font-weight:800;color:var(--text-main);margin-bottom:8px;">Thopucherla Lift Irrigation Scheme (6 Tanks)</h4>
            <p style="font-size:12.5px;color:var(--text-body);line-height:1.45;margin-bottom:12px;">
              Work completed: <b>Rs. 0.80 Cr</b> (4.34% of revised agmt ₹18.47 Cr). <b>Funds released so far: NIL</b>. Pending bills: NIL.
            </p>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:10px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">1. Balance Civil Works &amp; Pressure Main:</b>
              Amount: <b style="color:var(--primary);font-size:13px;">Rs. 5.00 Crores</b><br>
              <small style="color:var(--text-muted);">Pump House superstructure above GL (+156.40 m), Forebay, and 5.881 km Pressure Main.</small>
            </div>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:10px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">2. E&amp;M Pumps &amp; Motors Supply &amp; Erection:</b>
              Amount: <b style="color:var(--primary);font-size:13px;">Rs. 2.10 Crores</b><br>
              <small style="color:var(--text-muted);">2 Nos. × 135 kW Submersible VT Pump Sets with Induction Motors (Drawing approval from Advisor LIS awaited).</small>
            </div>

            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;font-size:12px;">
              <b style="color:var(--text-main);display:block;margin-bottom:4px;">3. Transmission Line &amp; Transformer Yard:</b>
              Amount: <b style="color:var(--primary);font-size:13px;">Rs. 0.25 Crores</b><br>
              <small style="color:var(--text-muted);">Dedicated 415 V transformer yard and power transmission included in Variation Estimate-1.</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------- Render GIS & KML Surveys Tab
  function renderGis() {
    const container = $('#view-gis');
    if (!container) return;

    const dbc = store.schemes.find((s) => s.id === 'DBC');
    const kmlList = dbc?.kmlFiles || [];
    const syNos = dbc?.surveyNumbers || [];

    container.innerHTML = `
      <div class="card-section" style="padding:22px;margin-bottom:20px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span class="scheme-code-badge" style="font-size:15px;padding:5px 12px;">DBC LIS</span>
              <h2 style="font-size:22px;font-weight:800;color:var(--text-main);">Dunnapothulagandi Lift Irrigation Scheme — GIS Alignment &amp; Land Acquisition (KML)</h2>
              <span class="tag tag-primary">3 Files Available</span>
            </div>
            <p style="color:var(--text-muted);font-size:13.5px;margin-top:6px;max-width:960px;">
              Comprehensive spatial survey data covering the 8.200 km Pressure Main corridor (1,900 mm MS Pipe), 270 chainage stations (0 to 8,200 M), 3.5m offset working corridor (7.0m ROW), and 30 Land Acquisition survey numbers across Chityala, Molkacherla, Balnepally, and Adavidevulapally (Adavidevulapally Mandal).
            </p>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-outline btn-sm" onclick="alert('Open these .kml files in Google Earth, Google Maps, AutoCAD Civil 3D, or QGIS.')">
              ℹ️ How to View Files
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:16px;background:var(--bg-alt);border-radius:var(--radius-md);border:1px solid var(--border);">
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Total Corridor Length</small><b style="font-size:15px;color:var(--text-main);">8.200 km (0 to 8,200 M)</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Chainage Frequency</small><b style="font-size:15px;color:var(--text-main);">Every 50 Meters (270 Marks)</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Working Corridor ROW</small><b style="font-size:15px;color:var(--text-main);">3.5 m Offset (7.0 m Total)</b></div>
          <div><small style="display:block;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">LA Sanction Award</small><b style="font-size:15px;color:var(--text-main);">36-11.50 Acres (₹3.60 Cr)</b></div>
        </div>
      </div>

      <!-- 3 Downloadable KML Cards -->
      <div class="card-section" style="margin-bottom:20px;">
        <div class="card-section-header">
          <div>
            <h3>DBC Spatial Alignment &amp; Cadastral Survey Files</h3>
            <p>Click below to download KML files for viewing in Google Earth, AutoCAD Civil 3D, or GPS devices.</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;padding:20px;">
          ${kmlList.map((kf) => `
            <div style="background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:14px;">
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <span class="tag tag-primary">KML Format</span>
                  <b style="font-size:12px;color:var(--text-muted);">${kf.size}</b>
                </div>
                <h4 style="font-size:16px;font-weight:800;color:var(--text-main);margin-bottom:6px;">${kf.name}</h4>
                <p style="font-size:12.5px;color:var(--text-body);line-height:1.45;">${kf.desc}</p>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border);">
                <code style="font-size:11px;">${kf.file}</code>
                <a href="${kf.path}" download="${kf.file}" class="btn btn-primary btn-sm" style="display:inline-flex;align-items:center;gap:6px;">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  Download KML
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Survey Numbers & Cadastral Corridor Reference -->
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>Land Acquisition Corridor Survey Numbers (${syNos.length} Nos)</h3>
            <p>Cadastral survey numbers intersecting the 36-11.50 Acres corridor across 4 villages.</p>
          </div>
          <span class="tag tag-warning">Award Passed: 36-11.50 Ac</span>
        </div>

        <div style="padding:16px 20px;">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
            ${syNos.map(sn => `
              <div style="padding:6px 12px;background:var(--bg-alt);border:1px solid var(--border);border-radius:6px;font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--primary);">
                Sy. No. ${sn}
              </div>
            `).join('')}
          </div>

          <div style="padding:14px;background:#f8fafc;border-radius:var(--radius-md);border:1px solid var(--border);font-size:12.5px;color:var(--text-body);line-height:1.5;">
            <b>Villages Covered:</b> 1. Chityala · 2. Molkacherla · 3. Balnepally (Bailapally) · 4. Adavidevulapally (all in Adavidevulapally Mandal).<br>
            <b>Compensation Status:</b> Award passed for 36-11.50 Acres; Rs. 3.60 Crores credited to LAO Account; distribution to patta-holders in active progress.
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------- Render EM & HM Components Check List Tab
  let emhmFilterScheme = 'ALL';
  let emhmFilterStatus = 'ALL';
  let emhmSearchQuery = '';

  function renderEmHm() {
    const container = $('#view-emhm');
    if (!container) return;

    const data = LIS.EM_HM_DATA;
    if (!data) {
      container.innerHTML = '<div class="card-section"><p>EM &amp; HM Data not loaded.</p></div>';
      return;
    }

    const { abstract, totalAbstract, schemes } = data;

    // Filter items based on current selection
    let filteredItems = [];
    const schemeKeys = emhmFilterScheme === 'ALL' ? Object.keys(schemes) : [emhmFilterScheme];
    schemeKeys.forEach((key) => {
      const sch = schemes[key];
      if (sch && sch.items) {
        sch.items.forEach((it) => {
          filteredItems.push({ ...it, schemeId: key, schemeName: sch.name });
        });
      }
    });

    if (emhmFilterStatus !== 'ALL') {
      filteredItems = filteredItems.filter((it) => it.statusType === emhmFilterStatus);
    }

    if (emhmSearchQuery) {
      const q = emhmSearchQuery.toLowerCase();
      filteredItems = filteredItems.filter((it) =>
        (it.description && it.description.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q)) ||
        (it.agmtRef && it.agmtRef.toLowerCase().includes(q)) ||
        (it.drawingStatus && it.drawingStatus.toLowerCase().includes(q)) ||
        (it.remarks && it.remarks.toLowerCase().includes(q))
      );
    }

    const filteredTotalAmount = filteredItems.reduce((acc, it) => acc + (it.amount || 0), 0);

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="card-section" style="padding:22px;margin-bottom:20px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span class="scheme-code-badge" style="font-size:15px;padding:5px 12px;">EM &amp; HM</span>
              <h2 style="font-size:22px;font-weight:800;color:var(--text-main);">4 Nos. LIS Package — EM &amp; HM Components Check List</h2>
              <span class="tag tag-success">Status: 04.11.2026</span>
            </div>
            <p style="color:var(--text-muted);font-size:13px;margin-top:6px;max-width:960px;">
              <b>Agt No. 21SE/ICHC/2021-22 dt 24.03.2022</b> &amp; <b>Suppl. Agt No. 03/SE/ICHC/2026-27 dt 27.08.2026</b> — M/s. Kaveri-Shantha-MEIL (JV).<br>
              Comprehensive tracking of drawings submission, advisor approvals, pump &amp; motor manufacturing, inspections, and client bill payments.
            </p>
          </div>
          <div style="display:flex;gap:10px;">
            <a href="data/em_hm_checklist.csv" download="4LIS_EM_HM_Checklist_04Nov2026.csv" class="btn btn-outline btn-sm">
              ⬇ Download Official CSV
            </a>
          </div>
        </div>

        <!-- 4 Summary KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:16px;background:var(--bg-alt);border-radius:var(--radius-md);border:1px solid var(--border);">
          <div>
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Total EM &amp; HM BOQ Scope</small>
            <b style="font-size:17px;color:var(--text-main);font-family:var(--font-mono);">Rs. 81,04,23,024</b>
            <span style="display:block;font-size:12px;color:var(--primary);font-weight:700;margin-top:2px;">≈ ₹ 81.04 Cr (111 Items)</span>
          </div>
          <div>
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Drawings Approved</small>
            <b style="font-size:17px;color:var(--success);font-family:var(--font-mono);">${totalAbstract.approved} Items</b>
            <span style="display:block;font-size:12px;color:var(--success);font-weight:700;margin-top:2px;">KBL, WEG &amp; WPIL units</span>
          </div>
          <div>
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Drawings Submitted</small>
            <b style="font-size:17px;color:var(--warning);font-family:var(--font-mono);">${totalAbstract.submitted} Items</b>
            <span style="display:block;font-size:12px;color:var(--warning);margin-top:2px;">FCMA Soft Starters under review</span>
          </div>
          <div>
            <small style="display:block;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">In Finalisation / Enquiry</small>
            <b style="font-size:17px;color:var(--text-muted);font-family:var(--font-mono);">${totalAbstract.notUpdated} Items</b>
            <span style="display:block;font-size:12px;color:var(--text-muted);margin-top:2px;">Panels, cables, valves &amp; surge</span>
          </div>
        </div>
      </div>

      <!-- Official Abstract Table -->
      <div class="card-section" style="margin-bottom:20px;">
        <div class="card-section-header">
          <div>
            <h3>EM &amp; HM Components Check List : Abstract (4 Schemes)</h3>
            <p>Official summary of drawings approvals and BOQ values across all 4 lift irrigation schemes.</p>
          </div>
          <span class="tag tag-primary">Total: ₹ 81.04 Cr</span>
        </div>

        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th style="width:60px;">S.No</th>
                <th>Name of LIS</th>
                <th>Total Items</th>
                <th>Drawings Approved</th>
                <th>Drawings Submitted</th>
                <th>Under Finalisation / Pending</th>
                <th>Supplied</th>
                <th>Bill Received</th>
                <th>Bill Claimed</th>
                <th>BOQ Amount (Rs)</th>
                <th>BOQ (₹ Cr)</th>
              </tr>
            </thead>
            <tbody>
              ${abstract.map((a) => `
                <tr>
                  <td><b>${a.sNo}</b></td>
                  <td>
                    <a href="javascript:void(0)" class="btn-filter-scheme-table" data-scheme="${a.id}" style="font-weight:700;color:var(--primary);text-decoration:none;">
                      ${a.name} (${a.id})
                    </a>
                  </td>
                  <td><b>${a.totalItems}</b></td>
                  <td><span class="tag tag-success" style="font-weight:700;">${a.approved}</span></td>
                  <td><span class="tag ${a.submitted > 0 ? 'tag-warning' : 'tag-neutral'}">${a.submitted}</span></td>
                  <td>${a.notUpdated}</td>
                  <td>${a.supplied}</td>
                  <td>${a.billReceived}</td>
                  <td>${a.billClaimed}</td>
                  <td><code style="font-weight:700;">Rs. ${a.boqAmount.toLocaleString('en-IN')}</code></td>
                  <td><b style="color:var(--primary);">₹ ${a.boqCr.toFixed(2)} Cr</b></td>
                </tr>
              `).join('')}
              <tr style="background:var(--bg-alt);font-weight:800;">
                <td colspan="2"><b>TOTAL (4 LIS PACKAGE)</b></td>
                <td><b>${totalAbstract.totalItems}</b></td>
                <td><span class="tag tag-success" style="font-weight:800;font-size:12px;">${totalAbstract.approved}</span></td>
                <td><span class="tag tag-warning" style="font-weight:800;font-size:12px;">${totalAbstract.submitted}</span></td>
                <td><b>${totalAbstract.notUpdated}</b></td>
                <td>${totalAbstract.supplied}</td>
                <td>${totalAbstract.billReceived}</td>
                <td>${totalAbstract.billClaimed}</td>
                <td><code style="font-size:14px;color:var(--primary);">Rs. ${totalAbstract.boqAmount.toLocaleString('en-IN')}</code></td>
                <td><b style="font-size:15px;color:var(--primary);">₹ ${totalAbstract.boqCr.toFixed(2)} Cr</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detailed Components Register with Interactive Filters -->
      <div class="card-section">
        <div class="card-section-header">
          <div>
            <h3>Detailed Components Register (${filteredItems.length} of 111 Items Showing)</h3>
            <p>Scope, BOQ reference, rate, drawing approval status, and advisor letter remarks.</p>
          </div>
          <div style="font-size:13px;font-weight:700;color:var(--primary);">
            Showing Value: ₹ ${(filteredTotalAmount / 10000000).toFixed(2)} Cr
          </div>
        </div>

        <!-- Filter Bar -->
        <div style="padding:14px 20px;background:var(--bg-alt);border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;">
          <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
            <small style="font-weight:700;color:var(--text-muted);margin-right:4px;">Scheme:</small>
            <button class="btn btn-sm btn-emhm-scheme ${emhmFilterScheme === 'ALL' ? 'btn-primary' : 'btn-outline'}" data-scheme="ALL">All (111)</button>
            <button class="btn btn-sm btn-emhm-scheme ${emhmFilterScheme === 'BW' ? 'btn-primary' : 'btn-outline'}" data-scheme="BW">BW (33)</button>
            <button class="btn btn-sm btn-emhm-scheme ${emhmFilterScheme === 'VP-II' ? 'btn-primary' : 'btn-outline'}" data-scheme="VP-II">VP-II (26)</button>
            <button class="btn btn-sm btn-emhm-scheme ${emhmFilterScheme === 'DBC' ? 'btn-primary' : 'btn-outline'}" data-scheme="DBC">DBC (33)</button>
            <button class="btn btn-sm btn-emhm-scheme ${emhmFilterScheme === 'THOP' ? 'btn-primary' : 'btn-outline'}" data-scheme="THOP">THOP (19)</button>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
            <small style="font-weight:700;color:var(--text-muted);margin-right:4px;">Status:</small>
            <button class="btn btn-sm btn-emhm-status ${emhmFilterStatus === 'ALL' ? 'btn-primary' : 'btn-outline'}" data-status="ALL">All</button>
            <button class="btn btn-sm btn-emhm-status ${emhmFilterStatus === 'approved' ? 'btn-primary' : 'btn-outline'}" data-status="approved">Approved (10)</button>
            <button class="btn btn-sm btn-emhm-status ${emhmFilterStatus === 'submitted' ? 'btn-primary' : 'btn-outline'}" data-status="submitted">Submitted (3)</button>
            <button class="btn btn-sm btn-emhm-status ${emhmFilterStatus === 'finalisation' ? 'btn-primary' : 'btn-outline'}" data-status="finalisation">Under Finalisation</button>
            <button class="btn btn-sm btn-emhm-status ${emhmFilterStatus === 'enquiry' ? 'btn-primary' : 'btn-outline'}" data-status="enquiry">Enquiries</button>
          </div>

          <div style="min-width:240px;flex:1;max-width:320px;">
            <input type="text" id="emhm-search-box" value="${emhmSearchQuery}" placeholder="Search equipment, make, drawing..." style="width:100%;padding:6px 12px;font-size:12.5px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-main);">
          </div>
        </div>

        <!-- Table -->
        <div style="overflow-x:auto;">
          <table class="clean-table">
            <thead>
              <tr>
                <th style="width:50px;">S.No</th>
                <th>Scheme</th>
                <th>Category</th>
                <th>Description of Equipment / Work</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Agmt Ref</th>
                <th>Rate (Rs)</th>
                <th>Amount (Rs)</th>
                <th>Amount (₹ Cr)</th>
                <th>Status of Drawings</th>
                <th>Manufactured &amp; Supplied</th>
                <th>Remarks / Technical Clarifications</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.length === 0 ? `
                <tr><td colspan="13" style="text-align:center;padding:24px;color:var(--text-muted);">No items match the selected filter or search query.</td></tr>
              ` : filteredItems.map((it) => {
                let badgeClass = 'tag-neutral';
                if (it.statusType === 'approved') badgeClass = 'tag-success';
                else if (it.statusType === 'submitted') badgeClass = 'tag-warning';
                else if (it.statusType === 'enquiry') badgeClass = 'tag-neutral';

                return `
                  <tr>
                    <td><b>${it.sl}</b></td>
                    <td><span class="scheme-code-badge" style="font-size:11px;padding:2px 6px;">${it.schemeId}</span></td>
                    <td style="font-size:11.5px;color:var(--text-muted);">${it.category}</td>
                    <td style="max-width:280px;">
                      <b>${it.description}</b>
                    </td>
                    <td><b>${it.qty}</b></td>
                    <td>${it.unit}</td>
                    <td><code style="font-size:11px;">${it.agmtRef}</code></td>
                    <td style="font-family:var(--font-mono);font-size:12px;">${it.rate.toLocaleString('en-IN')}</td>
                    <td style="font-family:var(--font-mono);font-size:12px;font-weight:700;">${it.amount.toLocaleString('en-IN')}</td>
                    <td><b style="color:var(--primary);font-size:12.5px;">₹ ${it.amountCr.toFixed(2)} Cr</b></td>
                    <td><span class="tag ${badgeClass}" style="font-size:11px;font-weight:700;">${it.drawingStatus}</span></td>
                    <td>${it.suppliedStatus || '—'}</td>
                    <td style="max-width:260px;font-size:11.5px;color:var(--text-body);line-height:1.4;">${it.remarks || '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event handlers
    $$('.btn-emhm-scheme', container).forEach((btn) => {
      btn.addEventListener('click', () => {
        emhmFilterScheme = btn.dataset.scheme;
        renderEmHm();
      });
    });

    $$('.btn-emhm-status', container).forEach((btn) => {
      btn.addEventListener('click', () => {
        emhmFilterStatus = btn.dataset.status;
        renderEmHm();
      });
    });

    $$('.btn-filter-scheme-table', container).forEach((link) => {
      link.addEventListener('click', () => {
        emhmFilterScheme = link.dataset.scheme;
        renderEmHm();
      });
    });

    const searchBox = $('#emhm-search-box', container);
    if (searchBox) {
      searchBox.addEventListener('input', (e) => {
        emhmSearchQuery = e.target.value;
        renderEmHm();
        const box = $('#emhm-search-box');
        if (box) {
          box.focus();
          box.selectionStart = box.selectionEnd = box.value.length;
        }
      });
    }
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

      // Add EM & HM components
      if (LIS.EM_HM_DATA && LIS.EM_HM_DATA.schemes) {
        Object.entries(LIS.EM_HM_DATA.schemes).forEach(([schId, sch]) => {
          sch.items.forEach((it) => {
            if (q && (it.description.toLowerCase().includes(q) || it.agmtRef.toLowerCase().includes(q) || it.drawingStatus.toLowerCase().includes(q))) {
              items.push({
                type: 'EM & HM',
                title: `[${schId}] ${it.description.substring(0, 48)}...`,
                sub: `${it.drawingStatus} · ₹ ${it.amountCr} Cr · ${it.agmtRef}`,
                action: () => {
                  emhmFilterScheme = schId;
                  emhmSearchQuery = it.description.split(' ')[0];
                  setTab('emhm');
                  closePalette();
                }
              });
            }
          });
        });
      }

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
    else if (tabName === 'emhm') renderEmHm();
    else if (tabName === 'gis') renderGis();
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
