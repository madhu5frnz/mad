/**
 * LIS Monitoring System v2 — Official Data Model & Initial Seeds
 * Government of Telangana — Irrigation & CAD Department
 * Irrigation Division No.3, Miryalaguda — 4 Nos. LIS Package
 */
(function (g) {
  'use strict';
  const LIS = (g.LIS = g.LIS || {});

  // ------------------------------------------------------------- 4 LIS Schemes
  const SCHEMES = [
    {
      id: 'BW',
      name: 'Bothalapalem–Wadapally Lift Irrigation Scheme',
      short: 'Bothalapalem–Wadapally',
      code: 'BW',
      badge: 'Active Construction',
      statusColor: 'var(--brand-accent)',
      progress: 8.6,
      sanction: 197.86,
      slsc: 198.16,
      ts: 229.25,
      ecv: 122.24,
      ls: 107.01,
      ve: 140.37,
      vels: 57.78,
      supp: 1074575978,
      bill: 133023844.10,
      work: 11.0,
      fund: 30.78,
      ayacut: '8,610 Acres (New 3,400 + Stab. 5,210)',
      ayacutAcres: 8610,
      newAyacut: 3400,
      stabAyacut: 5210,
      water: '0.95 TMC',
      discharge: '5.10 cumecs (180.1 cusecs)',
      head: '103.00 m Static Head',
      pumps: '2 × 4 MW Vertical Turbine',
      pumpCapacity: '9,180 m³/hr @ 104 m',
      motorDetails: 'WEG SEF 800, 4,000 kW, 11 kV, 600 rpm, FCMA starting',
      main: '11.045 km Pressure Main + 7.25 km Gravity',
      pipeDia: '1800 mm MS Pipe',
      delivery: '+129.00 m Delivery Cistern',
      lwl: '+47.20 m (Krishna river)',
      location: 'Bothalapalem · Wadapally',
      mandals: ['Damaracherla'],
      status: 'Civil work in progress; Land acquisition & TGSPDCL deposit pending',
      summary: 'Lifts water from Krishna River at Wadapally to irrigate 8,610 acres (3,400 Ac new + 5,210 Ac stabilisation) across 7 villages in Damaracherla mandal. Approach channel & pump house excavation completed; walls to +55.00 m against pump floor +71.20 m.',
      civilStatus: 'PH & forebay excavation complete. PH walls up to +55.00 m (floor +71.20 m). Forebay right wall up to +47.20 m; left wall in progress.',
      channelProgress: '250 / 330 m (75.8%)',
      pipelineProgress: '0 / 11,045 m (Corridor pending LA)',
      powerStatus: 'TGSPDCL power line deposit ₹12.78 Cr pending sanction/release.',
      landStatus: 'Required: 39-35.70 Ac-Gts for PH/Channel/PM; 22-00.70 Ac-Gts for gravity. PN completed; PD & compensation ₹7.00 Cr pending.',
      villages: [
        { sl: 1, name: 'Bothalapalem', ayacut: 1498, mandal: 'Damaracherla' },
        { sl: 2, name: 'Rajagattu', ayacut: 804, mandal: 'Damaracherla' },
        { sl: 3, name: 'Damaracherla', ayacut: 1511, mandal: 'Damaracherla' },
        { sl: 4, name: 'Narsapur', ayacut: 534, mandal: 'Damaracherla' },
        { sl: 5, name: 'Tallaveerappagudem', ayacut: 1006, mandal: 'Damaracherla' },
        { sl: 6, name: 'Kothapally', ayacut: 395, mandal: 'Damaracherla' },
        { sl: 7, name: 'Wadapally', ayacut: 2862, mandal: 'Damaracherla' }
      ],
      components: [
        { id: 'BW-C-01', name: 'Approach Channel Excavation & Lining', unit: 'm', total: 330, completed: 250, stage: 'In Progress', status: '75.8%' },
        { id: 'BW-C-02', name: 'Forebay Civil Works (Retaining Walls)', unit: '%', total: 100, completed: 50, stage: 'In Progress', status: 'Right wall +47.20m' },
        { id: 'BW-C-03', name: 'Pump House Civil Substructure (Raft & Walls)', unit: 'm level', total: 71.2, completed: 55.0, stage: 'In Progress', status: '+55.00m of +71.20m' },
        { id: 'BW-C-04', name: 'Vertical Turbine Pumps (2 Nos. 4 MW)', unit: 'Sets', total: 2, completed: 1, stage: 'Factory Inspection Done', status: 'KBL BHR140N(M) approved' },
        { id: 'BW-C-05', name: 'Synchronous Motors (2 Nos. 4000 kW)', unit: 'Sets', total: 2, completed: 1, stage: 'Approved', status: 'WEG SEF 800 approved' },
        { id: 'BW-C-06', name: 'Pressure Main 1800mm MS Pipeline', unit: 'km', total: 11.045, completed: 0, stage: 'Awaiting Land Corridor', status: 'Alignment surveyed' },
        { id: 'BW-C-07', name: 'Delivery Cistern (+129.00 m)', unit: 'Nos', total: 1, completed: 0, stage: 'Not Started', status: 'Site finalized' },
        { id: 'BW-C-08', name: 'TGSPDCL 132/11 kV Substation Link', unit: 'LS', total: 100, completed: 15, stage: 'Deposit Pending', status: '₹12.78 Cr deposit req.' }
      ]
    },
    {
      id: 'DBC',
      name: 'Dunnapothulagandi Lift Irrigation Scheme',
      short: 'Dunnapothulagandi',
      code: 'DBC',
      badge: 'Major Capacity',
      statusColor: 'var(--amber)',
      progress: 5.2,
      sanction: 284.43,
      slsc: 288.75,
      ts: 219.90,
      ecv: 118.295,
      ls: 101.60,
      ve: 169.79,
      vels: 118.96,
      supp: 1439224885,
      bill: 135113711.60,
      work: 13.51,
      fund: 18.50,
      ayacut: '12,239 Acres (New 5,939 + NSP Stab. 6,300)',
      ayacutAcres: 12239,
      newAyacut: 5939,
      stabAyacut: 6300,
      water: '1.20 TMC',
      discharge: '7.30 cumecs (257.8 cusecs)',
      head: '102.00 m Pump Duty',
      pumps: '2 × 5.6 MW Vertical Turbine (Massive)',
      pumpCapacity: '13,140 m³/hr @ 102 m',
      motorDetails: 'WEG SEF 900, 5,600 kW, 11 kV, 600 rpm, FCMA starting',
      main: '8.25 km Pressure Main (1,900 mm MS)',
      pipeDia: '1900 mm MS Pipe',
      delivery: '+148.00 m Delivery Chamber',
      lwl: '+55.00 m (Krishna foreshore)',
      location: 'Krishna Intake · Adavidevulapally',
      mandals: ['Adavidevulapally'],
      status: 'Engineering drawing reconciliation & sump level compliance in review',
      summary: 'Highest-discharge scheme in package (7.30 cumecs) covering 12,239 Acres (NSP Mudimanikyam Major tail end stabilisation 6,300 Ac + New 5,939 Ac; reconciled from VE-I report 5,393 Ac) across 8 villages in Adavidevulapally mandal.',
      civilStatus: 'Approach channel: bed width 6 m, slope 0.5:1, length levelled 0.340 km. Pump house excavation and sump bed +59.40 m under execution.',
      channelProgress: '290 / 340 m (85.3%)',
      pipelineProgress: '0 / 8,250 m (1,900 mm MS scheduled)',
      powerStatus: '11 kV switchyard: 2 × 1,500 A incomers from 20 MVA transformer. Field setup scheduled.',
      landStatus: 'VE-I provision ₹7.40 Cr. Corridors earmarked for acquisition.',
      villages: [
        { sl: 1, name: 'Ulsaipalem', mandal: 'Adavidevulapally', ayacut: null, status: 'Statement Pending' },
        { sl: 2, name: 'Molkacherla', mandal: 'Adavidevulapally', ayacut: null, status: 'Statement Pending' },
        { sl: 3, name: 'Balnepally', mandal: 'Adavidevulapally', ayacut: null, status: 'Statement Pending' },
        { sl: 4, name: 'Chityala', mandal: 'Adavidevulapally', ayacut: null, status: 'Statement Pending' },
        { sl: 5, name: 'Adavidevulapally', mandal: 'Adavidevulapally', ayacut: null, status: 'Statement Pending' },
        { sl: 6, name: 'Champlathanda', mandal: 'Adavidevulapally', ayacut: null, status: 'Statement Pending' },
        { sl: 7, name: 'Kotha Nandikonda', mandal: 'Adavidevulapally', ayacut: null, status: 'Statement Pending' },
        { sl: 8, name: 'Jilakarakunta Thanda', mandal: 'Adavidevulapally', ayacut: null, status: 'Statement Pending' }
      ],
      components: [
        { id: 'DBC-C-01', name: 'Approach Channel Levelled Section', unit: 'm', total: 340, completed: 290, stage: 'In Progress', status: '85.3% formed' },
        { id: 'DBC-C-02', name: 'Intake Forebay & Trash Rack Structure', unit: '%', total: 100, completed: 35, stage: 'In Progress', status: 'Raft under preparation' },
        { id: 'DBC-C-03', name: 'Pump House & Sump Bed (+59.40 m)', unit: 'm level', total: 80.0, completed: 62.0, stage: 'Deep Cut', status: 'Target +59.40m' },
        { id: 'DBC-C-04', name: '2 × 5.6 MW Heavy VT Pumps (13,140 m³/h)', unit: 'Sets', total: 2, completed: 1, stage: 'Manufacture Review', status: 'KBL BHR150N(M)' },
        { id: 'DBC-C-05', name: '2 × 5,600 kW 11kV Induction Motors', unit: 'Sets', total: 2, completed: 1, stage: 'Datasheet Reconciled', status: 'WEG SEF 900' },
        { id: 'DBC-C-06', name: 'Pressure Main 1900mm MS (8.25 km)', unit: 'km', total: 8.25, completed: 0, stage: 'Procurement Ready', status: 'Design finalized' },
        { id: 'DBC-C-07', name: 'Delivery Chamber (+148.00 m)', unit: 'Nos', total: 1, completed: 0, stage: 'Layout Done', status: 'Sill +148.00m' },
        { id: 'DBC-C-08', name: '20 MVA Dedicated Substation Bay', unit: 'LS', total: 100, completed: 20, stage: 'In Progress', status: '2 × 1500A Incomers' }
      ]
    },
    {
      id: 'VP-II',
      name: 'Veerlapalem–II Lift Irrigation Scheme',
      short: 'Veerlapalem–II',
      code: 'VP-II',
      badge: 'Pump Inspections Ready',
      statusColor: 'var(--brand-teal)',
      progress: 12.0,
      sanction: 46.43,
      slsc: 44.52,
      ts: 32.22,
      ecv: 26.47,
      ls: 5.75,
      ve: 30.68,
      vels: 13.85,
      supp: 215378858,
      bill: 34332807.70,
      work: 3.32,
      fund: 7.46,
      ayacut: '2,500 Acres (All New)',
      ayacutAcres: 2500,
      newAyacut: 2500,
      stabAyacut: 0,
      water: '0.207 TMC',
      discharge: '0.85 cumecs (30.0 cusecs)',
      head: '94.00 m Static Head',
      pumps: '3 × 400 kW Vertical Turbine',
      pumpCapacity: '3 × 1,008 m³/hr @ 94 m (all run together)',
      motorDetails: 'CG Power 400 kW, 11 kV, 1,484 rpm, soft starter',
      main: '6.050 km Pressure Main (700 mm MS)',
      pipeDia: '700 mm MS Pipe',
      delivery: '+125.20 m Delivery Cistern',
      lwl: '+47.20 m brief / +46.12 m GA',
      location: 'Veerlapalem · Adavidevulapally',
      mandals: ['Damaracherla', 'Adavidevulapally'],
      status: 'Pump house raft ready; Factory inspections completed (WPIL & CG Power)',
      summary: 'Irrigates 2,500 acres (all new) across Veerlapalem (Damaracherla M), Mudimanikyam, and Adavidevulapally. Pumps and motors successfully inspected at WPIL and CG Power Bhopal works with conditional factory releases.',
      civilStatus: 'PH excavation complete and raft finalised. Walls up to +45.50 m against required +68.00 m. Forebay design approved and foundation ready.',
      channelProgress: '120 / 150 m (80.0%)',
      pipelineProgress: '0 / 6,050 m (Corridor pending LA)',
      powerStatus: 'TGSPDCL deposit ₹3.78 Cr pending release.',
      landStatus: 'PH/channel/PM: 16-31.00 Ac-Gts; gravity: 08-00.00 Ac-Gts. PN complete; ₹0.36 Cr required for payment awards.',
      villages: [
        { sl: 1, name: 'Veerlapalem', mandal: 'Damaracherla', ayacut: 1063 },
        { sl: 2, name: 'Mudimanikyam', mandal: 'Adavidevulapally', ayacut: 1017 },
        { sl: 3, name: 'Adavidevulapally', mandal: 'Adavidevulapally', ayacut: 420 }
      ],
      components: [
        { id: 'VP-C-01', name: 'Approach Channel (150 m total)', unit: 'm', total: 150, completed: 120, stage: 'Near Complete', status: '30m cross bund left' },
        { id: 'VP-C-02', name: 'Forebay Structure & Gates', unit: '%', total: 100, completed: 60, stage: 'Foundation Ready', status: 'Layout approved' },
        { id: 'VP-C-03', name: 'Pump House Raft & Walls (+45.50 m)', unit: 'm level', total: 68.0, completed: 45.5, stage: 'In Progress', status: 'Raft complete' },
        { id: 'VP-C-04', name: '3 × 400 kW VT Pumps (WPIL WVT-30-20)', unit: 'Sets', total: 3, completed: 3, stage: 'Factory Inspected', status: 'WPIL inspection done' },
        { id: 'VP-C-05', name: '3 × 400 kW 11kV CG Power Motors', unit: 'Sets', total: 3, completed: 3, stage: 'Factory Inspected', status: 'CG Bhopal inspected' },
        { id: 'VP-C-06', name: 'Pressure Main 700mm MS (6.050 km)', unit: 'km', total: 6.05, completed: 0, stage: 'Awaiting Pipeline LA', status: 'Alignment fixed' },
        { id: 'VP-C-07', name: 'Delivery Cistern (+125.20 m)', unit: 'Nos', total: 1, completed: 0, stage: 'Not Started', status: 'Land ready' },
        { id: 'VP-C-08', name: 'TGSPDCL Power Infrastructure', unit: 'LS', total: 100, completed: 10, stage: 'Deposit Pending', status: '₹3.78 Cr deposit req.' }
      ]
    },
    {
      id: 'THOP',
      name: 'Thopucherla Lift Irrigation Scheme',
      short: 'Thopucherla',
      code: 'THOP',
      badge: 'Tank Filling Network',
      statusColor: 'var(--brand-blue)',
      progress: 9.5,
      sanction: 19.52,
      slsc: 18.47,
      ts: 9.30,
      ecv: 8.12,
      ls: 1.16,
      ve: 14.40,
      vels: 4.08,
      supp: 120365330,
      bill: 6355435.20,
      work: 0.80,
      fund: 3.05,
      ayacut: '315.98 Acres (6 Tanks Stabilisation)',
      ayacutAcres: 315.98,
      newAyacut: 0,
      stabAyacut: 315.98,
      water: '0.022 TMC',
      discharge: '0.37 cumecs (13.1 cusecs)',
      head: '31.82 m Static Head',
      pumps: '2 × 135 kW Submersible VT Pumps',
      pumpCapacity: '0.18 cumecs per pump @ 415 V',
      motorDetails: '2 × 135 kW Submersible, 415 V, Star-Delta/Soft Starter',
      main: '5.881 km Pressure Main',
      pipeDia: '400 mm / 350 mm MS & DI Pipe',
      delivery: '+180.650 m Delivery Tank Network',
      lwl: '+148.830 m (L-14 canal surplus)',
      location: 'L-14 Canal · Madgulapally',
      mandals: ['Madgulapally'],
      status: 'Pump house walls to GL (+156.40 m); 6 tanks feeding network ready',
      summary: 'Feeds water from L-14 Canal into 6 cascading minor irrigation tanks (total 315.98 Acres stabilisation, 39.50 Mcft capacity) in Madgulapally mandal. Zero private land acquisition needed (100% within departmental L-14 canal land).',
      civilStatus: 'PH and forebay excavation complete. Raft complete; PH walls reached GL (+156.40 m); forebay walls to +156.52 m. Above-GL civil drawings submitted.',
      channelProgress: 'Direct off-take from L-14 canal',
      pipelineProgress: '0 / 5,881 m (Surge analysis being finalized)',
      powerStatus: 'Substation & transformer yard ₹0.25 Cr + pump sets ₹2.00 Cr required.',
      landStatus: '0.00 Acres required — 100% inside departmental L-14 LIS boundary.',
      villages: [
        { sl: 1, name: 'Chinna Cheruvu', tank: 'Chinna Cheruvu', village: 'Thopucherla', ayacut: 134.68, capacityMcft: 16.84, mandal: 'Madgulapally' },
        { sl: 2, name: 'Pedda Cheruvu', tank: 'Pedda Cheruvu', village: 'Thopucherla', ayacut: 56.25, capacityMcft: 7.03, mandal: 'Madgulapally' },
        { sl: 3, name: 'Balapuvani Kunta', tank: 'Balapuvani Kunta', village: 'Thopucherla', ayacut: 20.00, capacityMcft: 2.50, mandal: 'Madgulapally' },
        { sl: 4, name: 'Oora Cheruvu', tank: 'Oora Cheruvu', village: 'Puchakayalagudem', ayacut: 30.35, capacityMcft: 3.79, mandal: 'Madgulapally' },
        { sl: 5, name: 'Voora Kunta', tank: 'Voora Kunta', village: 'Ganapathivarigudem', ayacut: 37.35, capacityMcft: 4.67, mandal: 'Madgulapally' },
        { sl: 6, name: 'Patha Bommakal Cheruvu', tank: 'Patha Bommakal Cheruvu', village: 'Bommakal', ayacut: 37.35, capacityMcft: 4.67, mandal: 'Madgulapally' }
      ],
      tanksList: ['Chinna Cheruvu', 'Pedda Cheruvu', 'Balapuvani Kunta', 'Oora Cheruvu', 'Voora Kunta', 'Patha Bommakal Cheruvu'],
      components: [
        { id: 'TH-C-01', name: 'L-14 Off-take & Forebay Civil Works', unit: '%', total: 100, completed: 85, stage: 'Walls to +156.52m', status: 'Ready to GL' },
        { id: 'TH-C-02', name: 'Pump House Civil to GL (+156.40 m)', unit: '%', total: 100, completed: 75, stage: 'Substructure Done', status: 'Above-GL dwgs submitted' },
        { id: 'TH-C-03', name: '2 × 135 kW Submersible VT Pumps', unit: 'Sets', total: 2, completed: 0, stage: 'Procurement Pending', status: '₹2.00 Cr funds req.' },
        { id: 'TH-C-04', name: 'Dedicated 415V Transformer Yard', unit: 'LS', total: 100, completed: 10, stage: 'Scope Finalized', status: '₹0.25 Cr required' },
        { id: 'TH-C-05', name: 'Pressure Main & Tank Feeder Lines (5.88 km)', unit: 'km', total: 5.881, completed: 0, stage: 'Surge Analysis Ready', status: 'Alignments fixed' },
        { id: 'TH-C-06', name: '6 Nos. Tank Inlets & Sluice Connections', unit: 'Tanks', total: 6, completed: 2, stage: 'Refurbishment Started', status: '2 inlets inspected' }
      ]
    }
  ];

  // ------------------------------------------------------------- 6 Minor Tanks (Thopucherla Network)
  const TANKS = [
    { sl: 1, name: 'Chinna Cheruvu', village: 'Thopucherla', ayacutAc: 134.68, capacityMcft: 16.84, status: 'Ready for inlet', fillPct: 40 },
    { sl: 2, name: 'Pedda Cheruvu', village: 'Thopucherla', ayacutAc: 56.25, capacityMcft: 7.03, status: 'Bund strengthening needed', fillPct: 25 },
    { sl: 3, name: 'Balapuvani Kunta', village: 'Thopucherla', ayacutAc: 20.00, capacityMcft: 2.50, status: 'Ready for inlet', fillPct: 60 },
    { sl: 4, name: 'Oora Cheruvu', village: 'Puchakayalagudem', ayacutAc: 30.35, capacityMcft: 3.79, status: 'Inlet trench marked', fillPct: 30 },
    { sl: 5, name: 'Voora Kunta', village: 'Ganapathivarigudem', ayacutAc: 37.35, capacityMcft: 4.67, status: 'Ready for inlet', fillPct: 50 },
    { sl: 6, name: 'Patha Bommakal Cheruvu', village: 'Bommakal', ayacutAc: 37.35, capacityMcft: 4.67, status: 'Weir check completed', fillPct: 35 }
  ];

  // ------------------------------------------------------------- Authoritative 4 LIS Ayacut Package Summary
  const AYACUT_SUMMARY = {
    grandTotal: 23665,
    totalNew: 11839,
    totalStab: 11826,
    schemes: [
      { id: 'BW', name: 'Bothalapalem-Wadapally LIS', mandal: 'Damaracherla M', newAc: 3400, stabAc: 5210, totalAc: 8610, villagesCount: 7, notes: '7 Villages in Damaracherla M' },
      { id: 'VP-II', name: 'Veerlapalem-II LIS', mandal: 'Damaracherla & Adavidevulapally M', newAc: 2500, stabAc: 0, totalAc: 2500, villagesCount: 3, notes: 'All New (3 Villages)' },
      { id: 'DBC', name: 'DBC LIS', mandal: 'Adavidevulapally M', newAc: 5939, stabAc: 6300, totalAc: 12239, villagesCount: 8, notes: 'NSP Mudimanikyam Major tail end (8 Villages)' },
      { id: 'THOP', name: 'Thopucherla LIS', mandal: 'Madgulapally M', newAc: 0, stabAc: 315.98, totalAc: 315.98, villagesCount: 6, notes: '6 Minor Irrigation Tanks (39.50 Mcft capacity)' }
    ]
  };

  // ------------------------------------------------------------- Priority Issues
  const ISSUES = [
    {
      id: 'BW-PWR',
      scheme: 'BW',
      schemeName: 'Bothalapalem–Wadapally',
      title: 'TGSPDCL Power Deposit Payment Pending',
      category: 'Power',
      priority: 'High',
      status: 'Open',
      costCr: 12.78,
      detail: 'TGSPDCL demand notice for ₹12.78 Cr deposit towards dedicated 132/11 kV transmission line and substation bay is awaiting fund sanction.',
      actionNeeded: 'Pursue Government / Finance Dept for budget release under capital head.',
      date: '01 Sep 2026'
    },
    {
      id: 'BW-LA',
      scheme: 'BW',
      schemeName: 'Bothalapalem–Wadapally',
      title: 'Land Acquisition Corridor for Pressure Main (11.045 km)',
      category: 'Land',
      priority: 'High',
      status: 'Open',
      costCr: 7.00,
      detail: 'Preliminary Notification (PN) published. Preliminary Declaration (PD) and award compensation ₹7.00 Cr pending with Revenue Division.',
      actionNeeded: 'Coordinate with Revenue Divisional Officer (RDO) Miryalaguda to expedite Section 19 declaration.',
      date: '01 Sep 2026'
    },
    {
      id: 'DB-SUMP',
      scheme: 'DBC',
      schemeName: 'Dunnapothulagandi',
      title: 'Sump Bed Level Compliance (+59.40 m vs GA +60.00 m)',
      category: 'Technical',
      priority: 'High',
      status: 'Under Review',
      costCr: 0,
      detail: 'Chief Engineer / Advisor technical review mandates sump bed level at +59.40 m to provide 3.60 m submergence at lowest reservoir pool.',
      actionNeeded: 'Issue revised structural drawings adjusting bottom elevation to +59.40 m prior to final raft pour.',
      date: '31 Oct 2026'
    },
    {
      id: 'VP-PWR',
      scheme: 'VP-II',
      schemeName: 'Veerlapalem–II',
      title: 'TGSPDCL 11 kV Power Line Deposit (₹3.78 Cr)',
      category: 'Power',
      priority: 'High',
      status: 'Open',
      costCr: 3.78,
      detail: 'Estimate for 11 kV line from 33/11 kV substation sanctioned by TGSPDCL; payment deposit ₹3.78 Cr pending with department.',
      actionNeeded: 'Release letter sent to Pay & Accounts Officer (PAO); follow up on letter of credit.',
      date: '01 Sep 2026'
    },
    {
      id: 'VP-LA',
      scheme: 'VP-II',
      schemeName: 'Veerlapalem–II',
      title: 'Pipeline Corridor Land Acquisition (16.31 Ac)',
      category: 'Land',
      priority: 'Medium',
      status: 'In Progress',
      costCr: 0.36,
      detail: 'PN completed for pump house, channel, and 6 km pressure main. ₹0.36 Cr required for payment awards.',
      actionNeeded: 'RDO joint survey complete; deposit funds with Land Acquisition Officer.',
      date: '01 Sep 2026'
    },
    {
      id: 'TH-DWG',
      scheme: 'THOP',
      schemeName: 'Thopucherla',
      title: 'Above-GL Civil Superstructure Approval & Surge Analysis',
      category: 'Technical',
      priority: 'Medium',
      status: 'Under Review',
      costCr: 0,
      detail: 'Substructure completed to Ground Level (+156.40 m). Gantry beam, roof slab and surge analysis submitted to CDO for formal approval.',
      actionNeeded: 'Attend technical clarification session at Central Designs Organisation (CDO).',
      date: '01 Sep 2026'
    },
    {
      id: 'TH-FUND',
      scheme: 'THOP',
      schemeName: 'Thopucherla',
      title: 'Pump Sets & Substation Funding (₹2.25 Cr)',
      category: 'Funding',
      priority: 'High',
      status: 'Open',
      costCr: 2.25,
      detail: '2 × 135 kW submersible pump sets (₹2.00 Cr) and 415 V transformer yard (₹0.25 Cr) require supplemental fund release.',
      actionNeeded: 'Submit supplemental funding requisition to Secretariat.',
      date: '01 Sep 2026'
    }
  ];

  // ------------------------------------------------------------- Funding Summary
  const FUNDING_SUMMARY = [
    { item: 'Land Acquisition Compensation Awards', bw: 7.00, vp: 0.36, thop: 0.00, dbc: 0.00, total: 7.36 },
    { item: 'TGSPDCL Power Transmission Line Deposits', bw: 12.78, vp: 3.78, thop: 0.00, dbc: 0.00, total: 16.56 },
    { item: 'Pending Work Done Bills (Civil Contractors)', bw: 11.00, vp: 3.32, thop: 0.80, dbc: 0.00, total: 15.12 },
    { item: 'Pumps & Motors Manufacturing Balance', bw: 0.00, vp: 0.00, thop: 2.00, dbc: 0.00, total: 2.00 },
    { item: 'Substation Yard & Transformer Works', bw: 0.00, vp: 0.00, thop: 0.25, dbc: 0.00, total: 0.25 }
  ];

  // ------------------------------------------------------------- Program Dates
  const PROGRAM_DATES = {
    agreementDate: '27 Aug 2022',
    originalCompletion: '26 Feb 2024',
    secondEot: '23 Sep 2026',
    targetCompletion: '23 Mar 2028',
    reportingDate: '03 Nov 2026',
    originalAgreementCr: 285.99,
    supplementalAgreementCr: 296.21,
    sanctionPackageCr: 548.23
  };

  Object.assign(LIS, { SCHEMES, TANKS, ISSUES, FUNDING_SUMMARY, PROGRAM_DATES, AYACUT_SUMMARY });
})(typeof window !== 'undefined' ? window : globalThis);
