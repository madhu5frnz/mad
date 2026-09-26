// Checks the engine against the reference Excel sheets (SLRB Km 0.450 & 1.580).
// Run: node bridge-design/tests/verify-design.js
require('../js/design.js');
const BD = globalThis.BD;
let fails = 0;
function near(name, got, exp, tol = 1e-3) {
  const ok = Math.abs(got - exp) <= tol * Math.max(1, Math.abs(exp));
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${typeof got === 'number' ? got.toFixed(4) : got} (ref ${exp})`);
}
const km0450 = { tempFriction: 'no' };
const km1580 = { tempFriction: 'no', chainage: '1.580', cbl: 145.367, cblExisting: 145.235, frl: 147.09, gl: 146.526, foundationLevel: 144.1, wFrontBatter: 0.7, wBaseW: 2.2 };
const refs = [
  ['Km 0.450', km0450, { fsl: 146.368, soffit: 147.495, stemH: 2.145, clearCBL: 2.73020979, flScour: 144.5676905, M: 7.593245, AstReq: 1246.72875, V: 9.14621875, tv: 0.27438656,
    fosO1: 4.75550345, fosS1: 1.63553653, pmax1: 8.70609141, pmin1: 4.57069279, fosO2: 4.64110300, fosS2: 1.80243820, pmax2: 11.41021597, pmin2: 4.22070975,
    smax: 16.05958817, smin: 0.14770784, wfosO: 3.52411133, wfosS: 1.81222775, wpmax: 9.11443763, wpmin: 3.08817528, wsmax: 11.15337359, wsmin: 0.70666641 }],
  ['Km 1.580', km1580, { fosO: 5.59, fosS: 1.78, pmax: 9.74, pmin: 4.48, smax: 13.35, smin: 1.21, wfosO: 3.46, wfosS: 1.88, wpmax: 8.07, wpmin: 2.65, wsmax: 10.06, wsmin: 0.28 }],
];
for (const [n, inp, e] of refs) {
  console.log('==', n);
  const { R } = BD.design(inp);
  const c1 = R.abCases[0], c2 = R.abCases[1];
  if (e.fsl) {
    near('FSL', R.fsl, e.fsl); near('soffit', R.soffit, e.soffit); near('stem H', R.stemH, e.stemH);
    near('clear @CBL', R.clearCBL, e.clearCBL); near('FL scour', R.flScour, e.flScour);
    near('Design M', R.M, e.M); near('Ast req', R.AstReq, e.AstReq);
    near('Shear V (sheet adds 1.8 m even when wheel spreads do not overlap)', R.V, e.V, 0.08);
    near('case1 FOS O', c1.fosO, e.fosO1); near('case1 FOS S', c1.fosS, e.fosS1); near('case1 pmax', c1.pmax, e.pmax1); near('case1 pmin', c1.pmin, e.pmin1);
    near('case2 FOS O', c2.fosO, e.fosO2); near('case2 FOS S', c2.fosS, e.fosS2); near('case2 pmax', c2.pmax, e.pmax2); near('case2 pmin', c2.pmin, e.pmin2);
    near('stem max', R.stemGov.smax, e.smax); near('stem min', R.stemGov.smin, e.smin);
  } else {
    near('abut FOS O', R.abWorst.fosO, e.fosO, 0.003); near('abut FOS S', R.abWorst.fosS, e.fosS, 0.003);
    near('abut pmax', R.abWorst.pmax, e.pmax, 0.003); near('abut pmin', R.abWorst.pmin, e.pmin, 0.003);
    near('stem max', R.stemGov.smax, e.smax, 0.003); near('stem min', R.stemGov.smin, e.smin, 0.01);
  }
  near('wing FOS O', R.w.fosO, e.wfosO, 0.003); near('wing FOS S', R.w.fosS, e.wfosS, 0.003);
  near('wing pmax', R.w.pmax, e.wpmax, 0.003); near('wing pmin', R.w.pmin, e.wpmin, 0.003);
  near('wing stem max', R.ws.smax, e.wsmax, 0.003); near('wing stem min', R.ws.smin, e.wsmin, 0.02);
  console.log('all checks OK:', R.allOk);
}
console.log('== DLRB (same site, 7.5 m carriageway)');
const d = BD.design({ bridgeType: 'DLRB', carriageway: 7.5, tempFriction: 'no' });
for (const v of d.R.vehicles) console.log(`  ${v.veh.name}: M=${v.M.toFixed(3)} V=${v.V.toFixed(3)}`);
console.log('  M', d.R.M.toFixed(3), 'dReq', d.R.dReq.toFixed(1), 'd', d.R.d, 'Ast', d.R.AstReq.toFixed(0), '/', d.R.AstProv.toFixed(0), 'allOk', d.R.allOk);
for (const c of d.R.abCases) console.log('  ', c.name, c.fosO.toFixed(2), c.fosS.toFixed(2), c.pmax.toFixed(2), c.pmin.toFixed(2));
const a = BD.autoDesign({ bridgeType: 'DLRB', carriageway: 7.5 });
console.log('  auto:', a.log.join(' | '), 'allOk', a.result.R.allOk);
process.exit(fails ? 1 : 0);
