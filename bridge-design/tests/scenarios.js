// Runs Auto design on a range of sites/options and reports whether every
// check passes and whether any number is not finite. Run: node tests/scenarios.js
require('../js/design.js');
const BD = globalThis.BD;
const S = {
  'reference SLRB':                {},
  'DLRB auto loads':               { bridgeType: 'DLRB', carriageway: 7.5, edgeType: 'crash' },
  'DLRB LSM M30 Fe500':            { bridgeType: 'DLRB', carriageway: 7.5, method: 'LSM', fck: 30, fy: 500, cover: 0.045 },
  'SLRB LSM M25':                  { method: 'LSM', fck: 25, fy: 500 },
  'Class B village road':          { liveMode: 'manual', llA1: 'no', llB: 'yes' },
  'Footpaths 1.5 m':               { bridgeType: 'DLRB', carriageway: 7.5, fpW: 1.5 },
  'Zone III seismic forced':       { seismicZone: 'III', seismicMode: 'include' },
  'Zone V seismic (expect RCC)':   { seismicZone: 'V', seismicMode: 'include', impFactor: 1.2, expectFail: true },
  'Zone IV, 12 m span (auto)':     { seismicZone: 'IV', Q: 25, bedWidth: 8, fsd: 1.8, freeBoard: 0.9, frl: 150.5, maxSlabSpan: 12 },
  'Wide canal, 9 m high, SBC 15': { bridgeType: 'DLRB', carriageway: 7.5, Q: 60, bedWidth: 14, fsd: 2.4, freeBoard: 0.9, frl: 150.8, gl: 149.5, foundationLevel: 142, expectFail: true },
  'Wide canal multi-vent SBC 40': { bridgeType: 'DLRB', carriageway: 7.5, edgeType: 'crash', Q: 30, bedWidth: 10, fsd: 1.8, freeBoard: 0.75, cbl: 145, frl: 148.8, gl: 148, foundationLevel: 142.5, sbc: 40, phi: 30 },
  'Skew 30 deg':                   { skew: 30 },
  'Poor soil SBC 8, phi 25':       { sbc: 8, phi: 25, gammaSoil: 1.9 },
  'No apron, sandy bed f=1.5':     { apron: 'no', siltFactor: 1.5 },
};
let bad = 0;
for (const [n, inp] of Object.entries(S)) {
  const a = BD.autoDesign(Object.assign({}, inp, { expectFail: undefined }));
  const r = a.result;
  const nan = [];
  for (const s of r.sections) for (const row of s.rows) if (typeof row.value === 'number' && !isFinite(row.value)) nan.push(row.label);
  const fails = [];
  for (const s of r.sections) for (const row of s.rows) if (row.check && !row.ok) fails.push(row.label);
  const ok = (r.R.allOk || inp.expectFail) && !nan.length && (!inp.expectFail || r.warnings.some((w) => /RCC/.test(w)));
  if (!ok) bad++;
  console.log(`${ok ? (inp.expectFail ? 'OK* ' : 'OK  ') : 'FAIL'} ${n.padEnd(28)} vents ${r.p.nVents} span ${r.p.span} D ${r.p.D} ${r.p.mainDia}@${r.p.mainSpacing} gov ${r.R.govM.veh.id} seis ${r.R.seismic ? r.R.Ah.toFixed(3) : '-'} | ${a.log.join('; ')}`);
  if (fails.length) console.log('      fails:', fails.join(' | '));
  if (nan.length) console.log('      non-finite:', nan.join(' | '));
  if (r.warnings.length) console.log('      warn:', r.warnings.map((w) => w.slice(0, 90)).join(' || '));
}
process.exit(bad ? 1 : 0);
