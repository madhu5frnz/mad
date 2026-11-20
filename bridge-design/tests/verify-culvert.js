// Tests the dedicated Slab Culvert engine (culvert.js & culvert-ui.js)
require('../js/design.js');
require('../js/estimate.js');
require('../js/culvert.js');
require('../js/culvert-ui.js');

const BD = globalThis.BD;

console.log('== Dedicated Slab Culvert Engine Verification ==');

// 1. Stream Crossing (Single Vent 4.0 m)
const streamCulvert = BD.culvertDesign({
  crossingType: 'stream',
  waterwayName: 'Peddavagu Stream',
  chainage: '3.400',
  span: 4.0,
  nVents: 1,
  carriageway: 7.50,
  catchment: 6.25,
  catchmentFormula: 'ryves',
  formulaC: 8.5,
  streamBed: 100.0,
  streamBedWidth: 5.5,
  streamFall: 800,
  streamN: 0.035,
  frl: 103.20,
  gl: 102.50,
  sbc: 22.0,
  bedProtection: 'yes',
});

const r1 = streamCulvert.R;
console.log('Stream crossing:');
console.log('  Design Q (Ryves):', r1.Q.toFixed(3), 'cumecs (expected ~28.84)');
console.log('  HFL:', r1.hfl.toFixed(3), 'm');
console.log('  Lacey regime waterway:', r1.laceyW.toFixed(2), 'm');
console.log('  Lacey scour depth dsm:', r1.dsm.toFixed(2), 'm');
console.log('  Soffit level:', r1.soffit.toFixed(3), 'm (HFL + clearance)');
console.log('  Effective span Leff:', r1.Leff.toFixed(2), 'm');
console.log('  Design moment M:', r1.Mtotal.toFixed(2), 't-m/m');
console.log('  Ast req:', r1.AstReq.toFixed(0), 'sqmm/m');
console.log('  FOS Overturning:', r1.fosO.toFixed(2), '(>= 2.0)');
console.log('  FOS Sliding:', r1.fosS.toFixed(2), '(>= 1.5)');
console.log('  Max base pressure:', r1.pmax.toFixed(2), 't/sqm (<= 22)');

if (r1.Q > 0 && r1.hfl > 100.0 && r1.Mtotal > 0 && r1.Leff > 4.0) {
  console.log('OK   Stream culvert hydraulics and moments verified');
} else {
  console.error('FAIL Stream culvert values not valid');
  process.exit(1);
}

// 2. Auto Design Verification
const autoRes = BD.culvertAutoDesign({
  crossingType: 'stream',
  span: 4.0,
  carriageway: 7.50,
  catchment: 6.25,
  streamBed: 100.0,
  streamBedWidth: 5.5,
  streamFall: 800,
  frl: 103.20,
  gl: 102.50,
  sbc: 22.0,
});

console.log('Auto design log:', autoRes.log.join('; '));
console.log('Auto design allOk:', autoRes.result.R.allOk);

if (autoRes.result.R.allOk) {
  console.log('OK   Auto design passes all checks');
} else {
  console.error('FAIL Auto design has failing checks');
  process.exit(1);
}

// 3. Estimate Verification
const est = BD.CULVERTUI.estimate(autoRes.result);
console.log('Estimate items count:', est.items.length);
console.log('ECV:', est.ecv, 'Rs');
console.log('Grand Total:', est.total, 'Rs');
console.log('BBS total steel:', est.bbs.total, 'kg');

if (est.ecv > 0 && est.total > 0 && est.bbs.total > 0) {
  console.log('OK   Detailed estimate and BBS verified');
} else {
  console.error('FAIL Estimate computation failed');
  process.exit(1);
}

// 4. Canal Crossing (Twin Vent 3.0 m)
const canalCulvert = BD.culvertDesign({
  crossingType: 'canal',
  waterwayName: 'L-1 Minor Canal',
  chainage: '0.850',
  span: 3.0,
  nVents: 2,
  carriageway: 4.25,
  Qc: 1.5,
  canalBedW: 2.0,
  canalFsd: 0.8,
  canalCbl: 145.0,
  frl: 147.50,
  gl: 147.0,
});

console.log('Canal culvert:');
console.log('  Canal FSL:', canalCulvert.R.hfl.toFixed(3), 'm');
console.log('  Total linear waterway:', canalCulvert.R.totalWaterway.toFixed(2), 'm');

if (canalCulvert.R.hfl === 145.8 && canalCulvert.R.totalWaterway === 6.0) {
  console.log('OK   Canal culvert verified');
} else {
  console.error('FAIL Canal culvert values incorrect');
  process.exit(1);
}

console.log('All dedicated Slab Culvert tests PASSED!');
