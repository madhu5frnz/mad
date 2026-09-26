// Compares the U.T. engine with the department workbook UT @ Km 25.615
// (box 300 mm as in the workbook, depth over crest 0.821 m from Malikpur curves).
for (const f of ['design', 'estimate', 'cad', 'sheets', 'ut', 'ut-estimate', 'ut-sheets']) require(`../js/${f}.js`);
const BD = globalThis.BD;
let bad = 0;
const near = (name, got, ref, tol) => {
  const ok = Math.abs(got - ref) <= tol;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(46)} ${got.toFixed(3).padStart(10)}  ref ${String(ref).padStart(9)}`);
};
const d = BD.utDesign({ boxAuto: 'no', crestDepth: 0.821 });
const R = d.R, s = R.secs;
near("Q, Dicken's formula (cumecs)", R.Q, 6.221, 0.001);
near('Lacey waterway P (m)', R.lacey, 11.972, 0.001);
near('Waterway width with 60 % fluming (m)', R.Bf, 7.2, 1e-9);
near('D/S transition length (m)', R.dsLen, 7.05, 1e-9);
near('U/S transition length (m)', R.usLen, 4.7, 1e-9);
near('Barrel length (m)', R.Lb, 20.8, 1e-9);
near('Sill level', R.sill, 404.395, 1e-6);
near('Top of box', R.boxTop, 406.195, 1e-6);
near('Velocity in barrel (m/s)', R.vBarrelAct, 1.659, 0.001);
near('Tail channel MFL 1-1', s[0].mfl, 405.545, 0.001);
near('TEL 1-1', s[0].tel, 405.564, 0.001);
near('MFL 2-2', s[1].mfl, 405.540, 0.001);
near('MFL 3-3 (barrel exit)', s[2].mfl, 405.325, 0.002);
near('TEL 3-3', s[2].tel, 405.689, 0.002);
near('Loss in barrel, Unwin (m)', R.hBarrel, 0.232, 0.001);
near('TEL 4-4 (barrel entry)', s[3].tel, 405.921, 0.002);
near('MFL 4-4', s[3].mfl, 405.749, 0.002);
near('MFL 5-5 (cistern)', s[4].mfl, 405.941, 0.002);
near('MFL 6-6 (over crest)', s[5].mfl, 407.846, 0.001);
near('U/S MFL 7-7', s[6].mfl, 407.873, 0.002);
near('Drop wall top width provided (m)', R.dropTop, 0.6, 1e-9);
near('Drop wall base width provided (m)', R.dropBase, 2.4, 1e-9);
near('Cistern length L1 (m)', R.cisternReq, 4.581, 0.001);
near('Floor thickness t (m)', R.apronReq, 1.022, 0.001);
near('Scour depth d (m) (workbook uses ^0.33)', R.dScour, 0.975, 0.004);
near('Class A intensity on box under 2.2 m fill', R.ll, 0.582, 0.001);
near('Ka, phi 28', R.K, 0.361, 0.001);
const c1 = R.cases[0];
near('Case 1 load on top slab A (t/sqm)', c1.qTop, 0.846, 0.001);
near('Case 1 soil reaction B (t/sqm)', c1.B, 1.608, 0.002);
// frame solver: square closed frame, equal UDL top and bottom -> corner qL^2/24, mid qL^2/12
const ms = [{ i: 2, j: 3, w1: -1, w2: -1 }, { i: 0, j: 1, w1: 1, w2: 1 }, { i: 0, j: 2 }, { i: 1, j: 3 }];
BD.solveFrame([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 2 }], ms, [], [0, 1, 4]);
near('Frame: corner moment qL^2/24', -ms[0].M(0), 4 / 24, 1e-9);
near('Frame: mid-span moment qL^2/12', ms[0].M(1), 4 / 12, 1e-9);
// auto design passes every check on the reference site, drawings and estimate build
const a = BD.utAutoDesign({});
if (!a.result.R.allOk) { bad++; console.log('FAIL auto design does not pass all checks'); } else console.log('OK   auto design:', a.log.join('; '));
const e = BD.utEstimate(a.result, {});
BD.toDXF(BD.utSheet1(a.result)); BD.toDXF(BD.utSheet2(a.result));
console.log(`OK   estimate Rs ${e.lakhs.toFixed(2)} lakhs, steel ${e.bbs.total} kg; drawings built`);
// multi-vent site
const m = BD.utAutoDesign({ catchment: 3, drainBed: 407.2 });
console.log(`${m.result.R.allOk ? 'OK  ' : 'FAIL'} multi-vent site: ${m.log.join('; ')}`);
if (!m.result.R.allOk) bad++;
BD.toDXF(BD.utSheet2(m.result)); BD.utEstimate(m.result, {});
if (bad) { console.log(`${bad} check(s) failed`); process.exit(1); }
