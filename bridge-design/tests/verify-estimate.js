// Compares the estimate with the reference SLRB Km 0.450 estimate workbook.
require('../js/design.js'); require('../js/estimate.js');
const BD = globalThis.BD;
const e = BD.estimate(BD.design({}));
const ref = { 'IRR-CCDW-1-2': 342.367, 'IRR-CCDW-2-3': 37.604, 'IRR-CCDW-2-9': 19.549, 'IRR-CCDW-2-22': 89.312, 'IRR-CCDW-2-1': 1436.88,
  'IRR-CCDW-2-10': 1.41, 'IRR-CCDW-2-25': 18.333, 'IRR-CCDW-2-29': 3.653, 'IRR-CCDW-5-5': 8.92 };
for (const it of e.items) {
  const d = (it.qty - ref[it.code]) / ref[it.code] * 100;
  console.log(it.code.padEnd(14), String(it.qty).padStart(10), 'ref', String(ref[it.code]).padStart(9), (d >= 0 ? '+' : '') + d.toFixed(2) + ' %');
  for (const r of it.rows) console.log('     ', r.desc.slice(0, 50).padEnd(50), r.n2, r.l, r.w, r.d, '=', r.qty);
}
console.log('ECV', e.ecv, '(ref 1517807)  seigniorage', e.seigTotal, '(ref 21207)  total', e.total, 'lakhs', e.lakhs.toFixed(2), '(ref 18.65)');
console.log('BBS by dia', e.bbs.byDia);
