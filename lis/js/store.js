/**
 * LIS Monitoring System v2 — State Management & LocalStorage Store
 */
(function (g) {
  'use strict';
  const LIS = (g.LIS = g.LIS || {});

  const KEY_SCHEMES = 'lis_v2_schemes';
  const KEY_LOGS = 'lis_v2_field_logs';
  const KEY_ISSUES = 'lis_v2_issues';
  const KEY_THEME = 'lis_v2_theme';

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  class Store {
    constructor() {
      this.listeners = [];
      this.init();
    }

    init() {
      // Load schemes or fallback to data.js baseline
      try {
        const savedSchemes = localStorage.getItem(KEY_SCHEMES);
        this.schemes = savedSchemes ? JSON.parse(savedSchemes) : clone(LIS.SCHEMES);
      } catch (e) {
        this.schemes = clone(LIS.SCHEMES);
      }

      // Load field measurement logs
      try {
        const savedLogs = localStorage.getItem(KEY_LOGS);
        this.logs = savedLogs ? JSON.parse(savedLogs) : [];
      } catch (e) {
        this.logs = [];
      }

      // Load issues
      try {
        const savedIssues = localStorage.getItem(KEY_ISSUES);
        this.issues = savedIssues ? JSON.parse(savedIssues) : clone(LIS.ISSUES);
      } catch (e) {
        this.issues = clone(LIS.ISSUES);
      }

      // Initial seeds for logs if empty
      if (this.logs.length === 0) {
        this.logs = [
          {
            id: 'LOG-001',
            schemeId: 'BW',
            componentId: 'BW-C-01',
            componentName: 'Approach Channel Excavation & Lining',
            quantity: 250,
            unit: 'm',
            date: '2026-10-28',
            officer: 'AEE Miryalaguda',
            ref: 'MB No. 412/A, Page 42',
            remarks: 'Channel excavation bottom bed completed up to 250m; slope trimming ready.'
          },
          {
            id: 'LOG-002',
            schemeId: 'VP-II',
            componentId: 'VP-C-04',
            componentName: '3 × 400 kW VT Pumps (WPIL)',
            quantity: 3,
            unit: 'Sets',
            date: '2026-10-30',
            officer: 'DEE / Executive Engineer',
            ref: 'WPIL Inspection Memo WPIL/2026/088',
            remarks: 'All 3 pump sets inspected at factory. Shut-off head tested to 151m.'
          },
          {
            id: 'LOG-003',
            schemeId: 'THOP',
            componentId: 'TH-C-02',
            componentName: 'Pump House Civil to GL (+156.40 m)',
            quantity: 75,
            unit: '%',
            date: '2026-10-25',
            officer: 'AEE L-14 Canal',
            ref: 'Site Measurement Record 12',
            remarks: 'Substructure raft and side walls cast up to ground level +156.40m.'
          }
        ];
        this.saveLogs();
      }
    }

    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter((l) => l !== fn);
      };
    }

    notify() {
      this.listeners.forEach((fn) => {
        try { fn(); } catch (e) { console.error(e); }
      });
    }

    saveSchemes() {
      try {
        localStorage.setItem(KEY_SCHEMES, JSON.stringify(this.schemes));
      } catch (e) { console.warn('Could not save schemes to localStorage', e); }
      this.notify();
    }

    saveLogs() {
      try {
        localStorage.setItem(KEY_LOGS, JSON.stringify(this.logs));
      } catch (e) { console.warn('Could not save logs to localStorage', e); }
      this.notify();
    }

    saveIssues() {
      try {
        localStorage.setItem(KEY_ISSUES, JSON.stringify(this.issues));
      } catch (e) { console.warn('Could not save issues to localStorage', e); }
      this.notify();
    }

    // Add a new measurement entry
    addMeasurement({ schemeId, componentId, quantity, date, officer, ref, remarks }) {
      const scheme = this.schemes.find((s) => s.id === schemeId);
      if (!scheme) throw new Error('Scheme not found');

      const comp = scheme.components.find((c) => c.id === componentId);
      if (!comp) throw new Error('Component not found');

      const oldQty = comp.completed;
      comp.completed = Number(quantity);

      // Recompute percentage
      const pct = Math.min(100, Math.round((comp.completed / comp.total) * 1000) / 10);
      comp.status = `${pct}% (${comp.completed} / ${comp.total} ${comp.unit})`;

      // Recalculate scheme average progress
      const sumPct = scheme.components.reduce((acc, c) => acc + Math.min(100, (c.completed / c.total) * 100), 0);
      scheme.progress = Math.round((sumPct / scheme.components.length) * 10) / 10;

      const logEntry = {
        id: 'LOG-' + Date.now().toString(36).toUpperCase(),
        schemeId,
        componentId,
        componentName: comp.name,
        quantity: comp.completed,
        previousQty: oldQty,
        unit: comp.unit,
        date: date || new Date().toISOString().split('T')[0],
        officer: officer || 'Field Officer (AEE)',
        ref: ref || 'MB Record',
        remarks: remarks || ''
      };

      this.logs.unshift(logEntry);
      this.saveSchemes();
      this.saveLogs();
      return logEntry;
    }

    // Toggle Issue Status
    updateIssueStatus(issueId, newStatus) {
      const issue = this.issues.find((i) => i.id === issueId);
      if (issue) {
        issue.status = newStatus;
        this.saveIssues();
      }
    }

    // Add new Issue
    addIssue(newIssue) {
      const entry = Object.assign({
        id: 'ISSUE-' + Date.now().toString(36).toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        status: 'Open'
      }, newIssue);
      this.issues.unshift(entry);
      this.saveIssues();
      return entry;
    }

    // Reset all data to baseline
    resetToBaseline() {
      this.schemes = clone(LIS.SCHEMES);
      this.issues = clone(LIS.ISSUES);
      this.logs = [];
      localStorage.removeItem(KEY_SCHEMES);
      localStorage.removeItem(KEY_ISSUES);
      localStorage.removeItem(KEY_LOGS);
      this.init();
      this.notify();
    }

    // Export current state as JSON
    exportData() {
      return JSON.stringify({
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        schemes: this.schemes,
        logs: this.logs,
        issues: this.issues
      }, null, 2);
    }

    // Import state from JSON
    importData(jsonString) {
      try {
        const data = JSON.parse(jsonString);
        if (data.schemes && Array.isArray(data.schemes)) {
          this.schemes = data.schemes;
          this.saveSchemes();
        }
        if (data.logs && Array.isArray(data.logs)) {
          this.logs = data.logs;
          this.saveLogs();
        }
        if (data.issues && Array.isArray(data.issues)) {
          this.issues = data.issues;
          this.saveIssues();
        }
        return true;
      } catch (err) {
        throw new Error('Invalid JSON file format: ' + err.message);
      }
    }
  }

  LIS.store = new Store();
})(typeof window !== 'undefined' ? window : globalThis);
