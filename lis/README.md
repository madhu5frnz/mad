# 4 Nos. LIS Monitoring System (v2.0 Upgrade)
**Government of Telangana — Irrigation & CAD Department**  
**Irrigation Division No.3, Miryalaguda**

---

## 1. Overview & Purpose
This upgraded, zero-setup, high-performance monitoring web application provides an intuitive and simple interface for executive engineers (EE, SE, CE) and field officers (DEE, AEE) to track:
1. **Bothalapalem–Wadapally LIS (BW)**: 8,610 Ac ayacut, 5.10 cumecs discharge, 103 m head, 2 × 4 MW VT pumps.
2. **Dunnapothulagandi LIS (DBC)**: 5,939 Ac ayacut, 7.30 cumecs discharge, 102 m head, 2 × 5.6 MW VT pumps.
3. **Veerlapalem–II LIS (VP-II)**: 2,500 Ac ayacut, 0.85 cumecs discharge, 94 m head, 3 × 400 kW VT pumps.
4. **Thopucherla LIS (THOP)**: 315.98 Ac ayacut across 6 cascading minor irrigation tanks, 2 × 135 kW submersible pumps.

---

## 2. Key Architecture & Features

### ⚡ Clean, Zero-Setup, Pure Client-Side Architecture
- **No heavy database or Docker needed:** Runs directly in any web browser or can be hosted on GitHub Pages / Static S3.
- **Persistent Local Store:** Uses `localStorage` with offline backup, JSON import/export, and change tracking.
- **Responsive Engineering UI:**
  - Executive KPI Cards (Total Ayacut, Sanction Package, Supplemental Agreement, Progress %, Urgent Bottlenecks).
  - Component Stage Tracking (Approach channel $\rightarrow$ Forebay $\rightarrow$ Pump house civil $\rightarrow$ Electro-mechanical $\rightarrow$ Pressure main $\rightarrow$ Delivery cistern $\rightarrow$ Tanks).
  - Quick Measurement Recording Dialog (for AEE/DEE officers entering cumulative quantities & MB references).
  - Command Palette (`Ctrl + K` or search click) for instantaneous navigation.
  - Export to **Excel** (`.xlsx` formatted multi-sheet workbook via ExcelJS).
  - Export to **PDF** (`.pdf` landscape executive summary with tables and signature blocks via jsPDF).
  - Direct **Print** formatting with `@media print` rules.
  - Light & Dark mode support.

---

## 3. Directory Layout
```text
scratch/lis-monitoring-v2/
├── index.html          # Semantic HTML5 shell with responsive navigation and modals
├── css/
│   └── app.css         # Modern, clean engineering CSS design system + print rules
├── js/
│   ├── data.js         # Official baseline dataset (schemes, components, tanks, issues)
│   ├── store.js        # State manager, measurement logging, and persistence
│   ├── export.js       # ExcelJS and jsPDF multi-format exporters + Print
│   └── ui.js           # Interactive controller, tab router, and command palette
├── vendor/             # Self-contained libraries (exceljs, jspdf, autotable)
└── README.md           # Documentation
```

---

## 4. How to Run & Deploy
1. **Direct Local Use:** Double click `index.html` or open in any browser.
2. **Deploy to Web / GitHub Pages:**
   Copy the `lis-monitoring-v2` folder into your repository and publish to GitHub Pages or static host.
