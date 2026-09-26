# SLRB / DLRB Design Generator

A browser app that takes the **Hydraulic Particulars (HPs)** of a canal and
produces the complete design of a **Single Lane (S.L.R.B.)** or **Double Lane
(D.L.R.B.) Road Bridge** across it, in the format of the I&CAD department
reference package (SLRB @ Km 0.450 / Km 1.580, L-1 Minor of Perur Major):

| Output | Contents | Formats |
|---|---|---|
| Design report | 8 sections: canal data, general arrangement, levels, ventway & scour, deck slab (IRC 21 WSM, effective width), abutment stability, wing walls, summary | Screen, PDF, Excel |
| Drawings (2 × A2) | Sheet 1: sectional elevation, half plan at top / foundation, notes, HP table, road particulars, trial pit, title block. Sheet 2: slab / approach slab / bed block / kerb reinforcement, abutment & wing wall sections, stress table, reinforcement schedule | Screen, vector PDF (A2), **DXF** for AutoCAD (zip) |
| Estimate | Detailed estimate, abstract (SSR 2026-27 rates, editable), bar bending schedule, seigniorage, theoretical requirement, general abstract (LC, NAC, DMF, SMET, permit, GST) | Screen, PDF, Excel **with live formulas** |

## How to use

**Online (public):** https://madhu5frnz.github.io/mad/ — deployed by
`.github/workflows/pages.yml` on every push to `main` that touches `bridge-design/`.

**Offline:** open `index.html` in any modern browser — no installation or
server needed; the Excel / PDF / zip libraries are bundled in `vendor/`.

`node tools/build-artifact.js` packs the app into the single file
`dist/bridge-design.html` (libraries from cdn.jsdelivr.net) for hosting.

1. Choose **S.L.R.B.** or **D.L.R.B.** at the top.
2. Enter the HPs (Q, bed width, FSD, side slope, free board, bed fall, CBL),
   the road level (FRL), ground level and foundation level.
   The clear span and foundation level are **suggested** from the HPs
   (span = canal top width at FSL rounded up to 0.5 m; foundation from the
   IRC 78 scour / IRC SP:13 apron criteria) — click **use** to accept.
3. Every check shows OK / REVISE live. **Auto design** sizes the deck
   (thickness, bar dia & spacing), abutment and wing walls to pass all checks.
4. Download PDF (report, estimate, 2 × A2 drawings), Excel, or DXF (zip).
   Inputs can be saved to / opened from a `.json` file.

## Design basis

* Codes: IRC 5-2015, IRC 6-2017, IRC 21-2000 (WSM), IRC 78-2014,
  IRC SP:13-2004, IS 456-2000, IS 1786, IS 2502.
* **SLRB**: 4.25 m carriageway, one lane of IRC Class A — reproduces the
  reference Excel design sheet (see *Verification*).
* **DLRB**: 7.50 m carriageway (IRC 5 cl.104.3.1). As per IRC 6 Table 6A the
  deck and abutments are checked for **two lanes of Class A** (1.2 m between
  trains; braking 20 % + 10 %), **one lane of Class 70R tracked**
  (70 t on 4.57 × 0.84 m tracks at 2.06 m c/c, impact 25 % → 10 % for 5–9 m
  spans) and **Class 70R wheeled bogie** (2 × 20 t axles at 1.22 m, wheel
  groups at 1.93 m c/c, 1.2 m clearance to kerb); the worst governs. Each
  loading is a separate abutment stability case.
* Effective width (IRC 21 cl.305.16): dispersions of adjacent wheels/tracks
  are combined only where they overlap, and are limited by the deck edges.
* Abutments / wing walls: plain CC M15 with plums, Rankine earth pressure +
  1.2 m LL surcharge, no-tension check on the stem, FOS 2.0 / 1.5,
  base pressure ≤ SBC.

## Verification

```
node tests/verify-design.js    # engine vs reference DESIGN sheets (Km 0.450 & 1.580)
node tests/verify-estimate.js  # quantities vs reference estimate (Km 0.450)
```

All levels, deck moment, steel, abutment and wing-wall results match the
reference sheets to within 0.1 %. Deliberate differences:

* **Support shear** – the reference adds the 1.8 m wheel spacing to the
  effective width even when the two wheels' dispersions do not overlap
  (axle at 0.40 m). Here the wheels are then treated separately (IRC 21), so
  V = 9.75 t/m against 9.15 t/m in the sheet (still OK).
* **Estimate** – one consistent rule is used for every site: excavation depth
  = GL − foundation level, wing wall CC = (top + base)/2 × height, wing PCC =
  design footing width, apron = clear width at CBL. Steel, deck, bed block,
  wearing coat and railing quantities match exactly; the total differs from
  the reference by < 1 % (Rs 18.81 L vs 18.65 L).

## Please confirm before use

* SBC, silt factor and backfill φ are assumptions (trial pit / soil test).
* The 70R wheel geometry and DLRB kerb width (225 mm) should be checked
  against your office standard. Spans above 8 m are flagged.
* SSR rates are prefilled from the 2026-27 data sheet; the hand-railing rate
  is marked "verify" as in the reference.

## Files

```
index.html            app
css/style.css
js/design.js          design engine (all calculations)
js/estimate.js        quantities, BBS, abstract, seigniorage, general abstract
js/cad.js             drafting model -> SVG and DXF (R12) writers
js/sheets.js          drawing sheets 1 & 2
js/export-xlsx.js     Excel export (ExcelJS)
js/pdf.js             PDF export (jsPDF) and file saving
js/app.js             user interface
vendor/               ExcelJS 4.4.0, jsPDF 2.5.2, jsPDF-AutoTable 3.8.4, JSZip 3.10.1 (MIT)
tools/build-artifact.js  single-file build for hosting
tests/                verification scripts (Node.js)
```
