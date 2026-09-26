# SLRB / DLRB / UT Design Generator

A browser app that takes the **Hydraulic Particulars (HPs)** of a canal and
produces the complete design of a **Single Lane (S.L.R.B.)** or **Double Lane
(D.L.R.B.) Road Bridge** across it, or of an **Under Tunnel (U.T.)** taking a
drain beneath it, in the format of the I&CAD department reference packages
(SLRB @ Km 0.450 / Km 1.580, L-1 Minor of Perur Major; UT @ Km 25.615):

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

## Under Tunnel (U.T.)

Choose **U.T.** at the top. Inputs: canal HPs, drain catchment (Dicken's
formula) or flood discharge, drain deep bed level, tail channel fall, silt
factor, SBC, vent size, live load on the banks, materials.

| Step | Method |
|---|---|
| Ventway | vents from an assumed barrel velocity; Lacey waterway P = 4.8 Q^1/2 (IS 7784 Pt 1) with fluming; splays 2:1 u/s, 3:1 d/s |
| Water levels | tail channel by Manning; section-by-section energy balance upstream with eddy losses, barrel loss by Unwin's formula, Sarda-type drop crest (free or drowned), approach channel; checks free flow in the barrel and u/s MFL below the canal bank |
| Drop & cistern | drop wall top d/rho^0.5, base (H + d + wc)/rho^0.5, cistern 2d + 2(dH)^0.5, floor 0.55(d + H)^0.5 (CDO rules as in the workbook) |
| Scour | Lacey, 1.5 d u/s, 2.0 d d/s; cut-off levels |
| RCC box | closed frame solved by the stiffness method, 4 cases under the canal and 2 under the banks (fill + Class A / 70R dispersed through fill); WSM design with axial force, shear at d from the face, base pressure; least thicknesses chosen automatically |
| Walls | gravity head walls on the box, wing / return walls: no tension (e <= b/6), base pressure, FOS 2.0 / 1.5; least section chosen automatically |

`node tests/verify-ut.js` reproduces the UT @ Km 25.615 workbook: discharge,
waterway, levels, all seven flow sections (MFL / TEL within 2 mm), barrel loss,
drop wall and cistern, scour, live load and box loads. Where the workbook is
not code-compliant the tool deliberately differs: wing / return walls are sized
for no tension in the concrete (the workbook's 1.7 m base on a 4.6 m wall is
in tension), and LL surcharge on the walls is included when there is a bank road.

## Design basis

Every site-dependent assumption is an input with a code-based default, so the
tool is not tied to one office's type design:

| Area | Options | Basis |
|---|---|---|
| Deck method | IRC 21:2000 WSM (department type designs) or IRC 112:2020 LSM (current code: ULS flexure & shear, SLS stresses, minimum steel) | IRC 21, IRC 112 |
| Materials | Deck M20–M40, Fe415/500/550 (permissible stresses follow the grade), exposure → cover 40/45/50/75 mm, substructure CC M15–M25 | IRC 21 Tables 9–10, IRC 112 Table 14.2, IS 456 Table 21 |
| Live load | Automatic per IRC 6:2017 Table 6A (< 5.3 m: 1-lane Class A; 5.3–9.6 m: 2-lane Class A or 1-lane 70R tracked / wheeled bogie) or chosen classes incl. Class B | IRC 6 cl.204–211 |
| Edge | Kerb + hand railing (MORTH SD/202) or RCC crash barrier; optional footpaths with pedestrian load | IRC 5, IRC 6 cl.206 |
| Vents | 1..n vents; gravity piers added with their own stability, scour at piers 2.0 dsm | IRC 78 cl.703 |
| Seismic | Zone II–V, importance factor; exemption of IRC 6 cl.219.1 applied automatically (span < 10 m, or Zone II/III with span < 15 m and length < 60 m) or forced; Ah = (Z/2)(I)(Sa/g)/R; Mononobe-Okabe dynamic increment; FOS 1.5 / 1.25, SBC +25 % | IRC 6 cl.219, 214.1.2; IRC 78 |
| Soil / scour | SBC, φ, γ, μ, silt factor (from bed material), floor protection yes/no, shear key under abutment | IRC 78, IRC SP:13 |
| Geometry | Skew (span along road = span / cos θ; > 20° flagged), all section dimensions | IRC 21 |

**Auto design** sets vents and span from the canal width, the foundation level
from scour, and sizes deck, abutments, piers and wing walls. It keeps gravity
proportions practical; when a site cannot be met by a plain gravity
substructure (tall walls on weak soil, Zone IV–V sliding) it says so and
recommends an RCC / counterfort substructure or deep foundation instead of
producing an unrealistic section.

Values verified against published summaries of IRC 6:2017 (Table 6A, Class 70R
700 kN on 4.57 × 0.84 m tracks at 2.06 m, bogie 2 × 20 t at 1.22 m, 70R impact,
cl.219.1 exemption, Z = 0.10/0.16/0.24/0.36) and IRC 21 / IRC 112 (σcbc = fck/3,
σst 200 MPa for Fe415, M25 minimum for RCC, cover by exposure). Items still to
confirm against your code copies: Class B wheel spacing (1.8 m assumed), the
vehicle clearances used for 70R (1.2 m) and IRC 112 bar-spacing limit.

## Verification

```
node tests/verify-design.js    # engine vs reference DESIGN sheets (Km 0.450 & 1.580)
node tests/verify-estimate.js  # quantities vs reference estimate (Km 0.450)
node tests/scenarios.js        # 14 site scenarios: LSM, Class B, footpaths, seismic,
                               # multi-vent, skew, poor soil, no apron
node tests/verify-ut.js        # U.T. engine vs UT @ Km 25.615 workbook
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
js/ut.js              U.T. engine (hydraulics, frame analysis, box & walls)
js/ut-estimate.js     U.T. quantities and bar bending schedule
js/ut-sheets.js       U.T. drawing sheets 1 & 2
js/ut-ui.js           U.T. inputs, hints and live section
js/app.js             user interface
vendor/               ExcelJS 4.4.0, jsPDF 2.5.2, jsPDF-AutoTable 3.8.4, JSZip 3.10.1 (MIT)
tools/build-artifact.js  single-file build for hosting
tests/                verification scripts (Node.js)
```
