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
      priceEscalation: 35368359.18,
      priceEscalationCr: 3.54,
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
      name: 'Dunnapothulagandi–Balnepally–Champla Thanda Lift Irrigation Scheme',
      short: 'DBC (Dunnapothulagandi–Balnepally)',
      code: 'DBC',
      badge: 'Major 258 Cusecs',
      statusColor: 'var(--amber)',
      progress: 7.8,
      sanction: 287.32,
      adminSanction: 219.90,
      adminSanctionGo: 'G.O.Rt.No. 299/Irrigation & CAD (Project-1) Dept Dt: 05.12.2020',
      slsc: 288.75,
      ts: 284.43,
      origTs: 219.90,
      ecv: 118.29,
      cerNo: 'CER No. 04/IRR/NLG Dt. 17.05.2021 for Rs. 219.90 Cr',
      origAgreement: 122.96,
      suppAgreement: 143.92,
      totalAgreementVal: 374.90,
      supp: 1439224885,
      ve: 287.32,
      veGo: 'G.O.Rt.No. 300 Dt. 22.06.2026 for Rs. 548.23 Cr (cluster of 4 LIS)',
      priceEscalation: 35368359.18,
      priceEscalationCr: 3.54,
      bill: 140000000.00,
      work: 14.00,
      fund: 35.02,
      immediateFundsReq: 71.29,
      agency: 'M/s. Kaveri-Shantha–MEIL (JV), Hyderabad',
      eot: '2nd E.O.T. granted up to 23.09.2026',
      targetCompletion: 'July 2027',
      ayacut: '12,239 Acres (NSP Stab. 6,300 + New 5,939)',
      ayacutAcres: 12239,
      newAyacut: 5939,
      stabAyacut: 6300,
      water: '1.374 TMC',
      discharge: '7.30 cumecs (258 cusecs)',
      head: '102.00 m Pumping Head',
      source: 'Haliya River near Chityala (V), Adavidevulapally (M)',
      pumps: '2 Nos. VT Pumps × 5.60 MW Synchronous Motors',
      pumpCapacity: '13,140 m³/hr @ 102 m (258 cusecs)',
      motorDetails: '2 Nos. × 5.60 MW Synchronous Motors (Amended from 8.325 MW Rajiv Dummugudem pumps)',
      pumpAmendment: 'Originally proposed 8.325 MW metallic volute pumps (from Rajiv Dummugudem LIS); amended by present Government to 2 Nos. × 5.60 MW VT pumps to suit actual field requirements.',
      main: '8.150 km Pressure Main (1,900 mm MS Pipe)',
      pipeDia: '1900 mm MS Pipe (8.150 km)',
      gravityMain: '7.600 km (3 Branches: 1.8m Dia 2,950m + 0.5m Dia 2,650m + 0.5m Dia 2,000m)',
      surgeRecommendation: 'PEACH Eng Pvt Ltd and IISc Bangalore recommended 16 mm thick instead of 10 mm for Km 0.00 to 2.00 Km',
      delivery: '+147.00 m Delivery Level',
      lwl: '+65.00 m (Haliya River)',
      location: 'Haliya River near Chityala (V) · Adavidevulapally (M)',
      mandals: ['Adavidevulapally'],
      status: 'PH walls to +80.00 m of +82.00 m; LA award passed (36-11.5 Ac); TG TRANSCO Token No.2602014999 (₹31.42 Cr) pending',
      summary: 'Draws 258 cusecs (7.30 cumecs) from Haliya River near Chityala (V) to irrigate 12,239 Acres (Mudimanikyam major tail-end stabilisation 6,300 Ac + new 5,939 Ac) across 7 villages. Agency: Kaveri-Shantha-MEIL (JV). Target: July 2027.',
      civilStatus: 'Earthwork excavation of Pump House and Forebay completed. Approach Channel 290.0 m completed out of 340.0 m (85.3%, 50m cross bund). Pump House PCC & raft completed; walls completed to +80.00 m (approved to +82.00 m; +82 to +99 m submitted to CE Office). Forebay walls completed.',
      channelProgress: '290 / 340 m (85.3% · 50m cross bund kept)',
      phWallProgress: '+80.00 m completed (approved to +82.00 m; +82 to +99 m submitted to CE Office)',
      pipelineProgress: '0 / 8,150 m (Approved Km 2.0-8.15; Km 0-2.0 surge review by IISc Bangalore recommends 16mm thick)',
      powerStatus: 'Substation amount towards TG TRANSCO Deposit: bill pending vide Token No. 2602014999 Dt. 21.11.2025 for Rs. 31.42 Crores. Total power extension requires Rs. 57.29 Cr (relocation estimate awaited from Wadapally).',
      landStatus: 'Total Land Required: 74-00 Acres. Head Works/PM/DC: 36-11.50 Ac (Award passed 30.04.2025; Rs. 3.60 Cr released & distributed to land losers). Gravity Mains & open canals: 37-28.50 Ac (LP Schedules under preparation; not in orig TS). Forest Land: NIL.',
      pendingBills: {
        nonWork: { item: 'TG TRANSCO Deposit', token: '2602014999', date: '21.11.2025', amountCr: 31.42 },
        workBills: { hoa: '4700-01-129-25-27-530-531-PVN', token: '2702277887', amountCr: 37.08 },
        totalImmediateFundingCr: 71.29 // Works 14.00 Cr + TGTRANSCO 57.29 Cr
      },
      kmlFiles: [
        { name: 'DBC LIS Pressure Main Alignment (0 to 8.2 km)', file: 'DBC_LIS_Pressure_Main.kml', path: 'kml/DBC_LIS_Pressure_Main.kml', size: '917 KB', desc: 'Full 8.200 km centerline, 3.5m offset corridor, 270 chainage marks, and traverse stations (ST1–ST9)' },
        { name: '4 Villages Land Acquisition Survey (36-11.5 Ac)', file: '4_Villages_LA.kml', path: 'kml/4_Villages_LA.kml', size: '805 KB', desc: '30 Survey numbers, corridor boundaries across Chityala, Molkacherla, Balnepally & Adavidevulapally' },
        { name: 'Chityala Village Intake & Head Reach Survey', file: 'Chityala.kml', path: 'kml/Chityala.kml', size: '130 KB', desc: 'Detailed micro-survey (Ch. 700 to 1450 M) at Haliya river off-take from chityala.dwg' }
      ],
      surveyNumbers: [
        '462', '462/27', '488', '489', '490', '491', '492', '499', '500', '501', '502', '505', '506', '507',
        '03', '04', '157', '159', '160', '161', '162', '163', '164', '165', '166', '167', '168', '169', '658', '19'
      ],
      villages: [
        { sl: 1, name: 'Ulsaipalem', mandal: 'Adavidevulapally', ayacut: 2444 },
        { sl: 2, name: 'Molkacherla', mandal: 'Adavidevulapally', ayacut: 1441 },
        { sl: 3, name: 'Balnepally', mandal: 'Adavidevulapally', ayacut: 2757 },
        { sl: 4, name: 'Champlathanda', mandal: 'Adavidevulapally', ayacut: 2439 },
        { sl: 5, name: 'Kothanandikonda', mandal: 'Adavidevulapally', ayacut: 1412 },
        { sl: 6, name: 'Adavidevulapally', mandal: 'Adavidevulapally', ayacut: 1359 },
        { sl: 7, name: 'Chityala', mandal: 'Adavidevulapally', ayacut: 387 }
      ],
      components: [
        { id: 'DBC-C-01', name: 'Approach Channel Levelled Section', unit: 'm', total: 340, completed: 290, stage: 'In Progress (85.3%)', status: '290 m completed (50m kept as cross bund)' },
        { id: 'DBC-C-02', name: 'Intake Forebay & Trash Rack Structure', unit: '%', total: 100, completed: 100, stage: 'Forebay Walls Done', status: 'Forebay walls & silt trap completed; stoplogs approved' },
        { id: 'DBC-C-03', name: 'Pump House Civil Substructure & Walls', unit: 'm level', total: 99.0, completed: 80.0, stage: 'Walls to +80.00m', status: 'Approved to +82.00m; +82 to +99m under scrutiny at CE Office' },
        { id: 'DBC-C-04', name: '2 Nos. VT Pumps (7.30 cumecs / 258 cusecs)', unit: 'Sets', total: 2, completed: 0, stage: 'Advisor Approved', status: 'Approved by Advisor LIS Hyd (KBL BHR150N(M))' },
        { id: 'DBC-C-05', name: '2 Nos. × 5.60 MW Synchronous Motors', unit: 'Sets', total: 2, completed: 0, stage: 'Advisor Approved', status: 'Approved by Advisor LIS Hyd (WEG, CCW rotation)' },
        { id: 'DBC-C-06', name: 'Pressure Main 1900mm MS Pipe (8.150 km)', unit: 'km', total: 8.150, completed: 0, stage: 'Surge Review', status: 'Approved Km 2.0-8.15; Km 0-2.0 IISc & Peach recommend 16mm (vs 10mm)' },
        { id: 'DBC-C-07', name: 'Delivery Level Cistern (+147.00 m)', unit: 'Nos', total: 1, completed: 0, stage: 'Layout Survey Done', status: 'Sill +147.00m' },
        { id: 'DBC-C-08', name: 'TG TRANSCO Substation & Transmission Bay', unit: 'LS', total: 100, completed: 0, stage: 'Token Pending', status: 'Token 2602014999 (₹31.42 Cr) pending; total ₹57.29 Cr req.' },
        { id: 'DBC-C-09', name: 'Gravity Mains 7.600 km (3 Branches: 1.8m, 0.5m, 0.5m dia)', unit: 'km', total: 7.600, completed: 0, stage: 'Approved in VE', status: 'Approved in VE; 37-28.5 Ac LA schedules under prep' }
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
      priceEscalation: 8842089.79,
      priceEscalationCr: 0.88,
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
      progress: 4.34,
      sanction: 18.48,
      adminSanction: 9.30,
      adminSanctionGo: 'G.O.Rt.No. 290 Dt. 02.08.2021',
      ts: 9.30,
      tsNo: '21/IRR/NLG/2021-22 Dt. 20.10.2021',
      ecv: 8.12,
      origAgreement: 8.44,
      agreementRef: 'Agmt. No. 21SE/ICHC/2022-23 Dt. 24.03.2022 (cluster of 4 LIS Rs. 285.99 Cr)',
      eot: '2nd E.O.T. granted up to 23.09.2026',
      ve: 18.48,
      veGo: 'G.O.Rt.No. 300 Dt. 22.06.2026 for Rs. 548.23 Cr (cluster of 4 LIS)',
      revisedAgreement: 18.47,
      supp: 120365330,
      priceEscalation: 8842089.79,
      priceEscalationCr: 0.88,
      bill: 6355435.20,
      work: 0.80,
      workPctRevised: 4.34,
      workPctOrig: 9.5,
      balanceRevised: 17.67,
      fundsReleased: 0.00,
      immediateFundsReq: 7.35,
      fund: 7.35,
      ayacut: '315.98 Acres (say 316 Ac · 6 Tanks Stabilisation · New: Nil)',
      ayacutAcres: 315.98,
      newAyacut: 0,
      stabAyacut: 315.98,
      water: '0.022 TMC',
      discharge: '0.368 cumecs (13.0 cusecs · 2 × 6.5 cusecs)',
      head: '31.82 m Static Head',
      pumps: '2 × 135 kW Submersible VT Pumps & Induction Motors (Total 270 kW)',
      pumpCapacity: '2 × 6.5 cusecs (0.18 cumecs per pump @ 415 V)',
      motorDetails: '2 × 135 kW Submersible, 415 V, Induction Motors',
      main: '5.881 km Pressure Main (0.6 m dia)',
      pipeDia: '0.6 m dia (5.881 km)',
      gravityMain: '0.363 km (alignment under preparation)',
      delivery: '+180.650 m Delivery Level',
      lwl: '+148.830 m (Lowest Water Level at L-14 canal)',
      location: 'Vemulapally (V&M), Nalgonda District (L-14 Stage-II Pump House at Km 57.240 of NSLBC)',
      source: 'Surplus water of L-14 L.I. Scheme (existing Stage-II Pump House at Km 57.240 of NSLBC)',
      mandals: ['Vemulapally', 'Madgulapally'],
      targetCompletion: 'March 2028',
      status: 'Pump house walls to GL (+156.40 m); above-GL dwgs submitted; surge analysis under prep; ₹7.35 Cr funds req.',
      summary: 'Draws 13 cusecs surplus water from existing Stage-II Pump House of L-14 L.I. Scheme at Km 57.240 on NSLBC to stabilize 6 minor irrigation tanks (315.98 say 316 Acres; New: Nil) across 4 villages in Madgulapally mandal. Target: March 2028.',
      civilStatus: 'PH & Forebay excavation completed. PH raft completed; walls completed to Ground Level (+156.40 m); drawings above GL submitted for approval. Forebay walls 0.42 km completed to GL (+156.520 m).',
      channelProgress: 'Direct off-take from existing Stage-II Pump House at Km 57.240 of NSLBC',
      pipelineProgress: '0 / 5,881 m (0.6m dia; Surge analysis under preparation — fabrication & laying cannot commence until finalized)',
      powerStatus: '270 kW power requirement (2 × 135 kW). Transmission line & transformer yard included in Variation Estimate-1 (₹0.25 Cr required).',
      landStatus: 'Land Acquisition: NIL (100% within departmental boundary). Forest Clearance: NIL.',
      pendingBillsStatus: 'Pending bills (works / TG TRANSCO / Land Acquisition): NIL. Funds released so far: NIL.',
      fundsBreakdown: {
        civilWorksCr: 5.00,
        pumpsMotorsCr: 2.10,
        powerTransformerCr: 0.25,
        totalCr: 7.35
      },
      villages: [
        { sl: 1, name: 'Thopucherla', ayacut: 210.93, mandal: 'Madgulapally', tanks: 'Chinna Cheruvu (134.68 Ac), Pedda Cheruvu (56.25 Ac), Balapuvani Kunta (20.00 Ac)' },
        { sl: 2, name: 'Puchakayala Gudem', ayacut: 30.35, mandal: 'Madgulapally', tanks: 'Oora Cheruvu (30.35 Ac)' },
        { sl: 3, name: 'Ganapathivari Gudem', ayacut: 37.35, mandal: 'Madgulapally', tanks: 'Voora Kunta (37.35 Ac)' },
        { sl: 4, name: 'Bommakal', ayacut: 37.35, mandal: 'Madgulapally', tanks: 'Patha Bommakal Cheruvu (37.35 Ac)' }
      ],
      tanksList: ['Chinna Cheruvu', 'Pedda Cheruvu', 'Balapuvani Kunta', 'Oora Cheruvu', 'Voora Kunta', 'Patha Bommakal Cheruvu'],
      components: [
        { id: 'TH-C-01', name: 'L-14 Off-take & Forebay Civil Works (0.42 km)', unit: '%', total: 100, completed: 100, stage: 'Forebay Done', status: 'Completed to GL +156.520m' },
        { id: 'TH-C-02', name: 'Pump House Civil Substructure & Raft to GL (+156.40 m)', unit: '%', total: 100, completed: 80, stage: 'GL Reached', status: 'Raft complete; walls to +156.40m; above-GL dwgs submitted' },
        { id: 'TH-C-03', name: '2 × 135 kW Submersible VT Pumps & Motors (270 kW)', unit: 'Sets', total: 2, completed: 0, stage: 'Advisor Review', status: 'Drawing approval awaited from Advisor LIS; ₹2.10 Cr req.' },
        { id: 'TH-C-04', name: 'Transmission Line & Dedicated Transformer Yard', unit: 'LS', total: 100, completed: 0, stage: 'In VE-1', status: 'Included in VE-1; ₹0.25 Cr required' },
        { id: 'TH-C-05', name: 'Pressure Main 0.6m dia (5.881 km)', unit: 'km', total: 5.881, completed: 0, stage: 'Surge Prep', status: 'Surge analysis under prep (laying paused till approved)' },
        { id: 'TH-C-06', name: 'Gravity Mains (0.363 km)', unit: 'km', total: 0.363, completed: 0, stage: 'Alignment Under Prep', status: 'Survey being finalized' },
        { id: 'TH-C-07', name: '6 Nos. Tank Inlets & Sluice Connections (39.5 Mcft)', unit: 'Tanks', total: 6, completed: 2, stage: 'In Progress', status: 'Stabilizes 6 tanks in Madgulapally mandal' }
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
      id: 'DBC-WORK-BILL',
      scheme: 'DBC',
      schemeName: 'Dunnapothulagandi–Balnepally',
      title: 'Pending Work Bill Token No. 2702277887 (₹37.08 Cr)',
      category: 'Funding',
      priority: 'High',
      status: 'Token Pending',
      costCr: 37.08,
      detail: 'Pending contractor works bill submitted under Head of Account 4700-01-129-25-27-530-531-PVN vide Token No. 2702277887 for an amount of Rs. 37.08 Crores.',
      actionNeeded: 'Follow up with Finance Department / Pay & Accounts Officer (PAO) for bill clearance.',
      date: '06 Nov 2026'
    },
    {
      id: 'DBC-TRANSCO',
      scheme: 'DBC',
      schemeName: 'Dunnapothulagandi–Balnepally',
      title: 'TG TRANSCO Substation Bill Pending (Token No. 2602014999 · ₹31.42 Cr)',
      category: 'Power',
      priority: 'High',
      status: 'Token Pending',
      costCr: 31.42,
      detail: 'Substation amount towards TG TRANSCO Deposit bill pending vide Token No. 2602014999 Dt. 21.11.2025 for Rs. 31.42 Crores. Total power extension requires Rs. 57.29 Cr; revised estimate awaited from TGTRANSCO for relocated substation from Wadapally.',
      actionNeeded: 'Pursue Treasury clearance for Token No. 2602014999 and obtain TGTRANSCO revised estimate.',
      date: '21 Nov 2025'
    },
    {
      id: 'DBC-SURGE-16MM',
      scheme: 'DBC',
      schemeName: 'Dunnapothulagandi',
      title: 'IISc Bangalore & Peach Engg 16mm Pipe Recommendation (Km 0 to 2.0)',
      category: 'Technical',
      priority: 'High',
      status: 'Under Review',
      costCr: 0,
      detail: 'Pressure Main 1.9m dia approved from Km 2.0 to 8.150. Km 0.00 to 2.00 submitted for surge analysis: PEACH Eng Pvt Ltd and IISc Bangalore recommend 16 mm wall thickness instead of 10 mm.',
      actionNeeded: 'Obtain formal CDO / CE technical approval for 16 mm pipe thickness before manufacturing commences.',
      date: '04 Nov 2026'
    },
    {
      id: 'DBC-LA-GRAVITY',
      scheme: 'DBC',
      schemeName: 'Dunnapothulagandi',
      title: 'Land Acquisition for Gravity Mains & Canals (37-28.50 Ac)',
      category: 'Land',
      priority: 'Medium',
      status: 'In Progress',
      costCr: 0,
      detail: 'Total Land Required: 74-00 Acres. Head Works/PM (36-11.50 Ac) award passed on 30.04.2025 and Rs. 3.60 Cr distributed. Additional 37-28.50 Ac required for 7.60 km Gravity Mains (not in orig TS); LP schedules under preparation.',
      actionNeeded: 'Complete LP Schedules and submit requisition to RDO Miryalaguda for Section 11/19 notification.',
      date: '06 Nov 2026'
    },
    {
      id: 'BW-PWR',
      scheme: 'BW',
      schemeName: 'Bothalapalem–Wadapally',
      title: 'TGSPDCL Power Deposit Payment Pending (₹12.78 Cr)',
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
      id: 'TH-FUND-IMM',
      scheme: 'THOP',
      schemeName: 'Thopucherla',
      title: 'Immediate Execution Funds Requisition (₹7.35 Cr · Released: NIL)',
      category: 'Funding',
      priority: 'High',
      status: 'Open',
      costCr: 7.35,
      detail: 'Work done approx ₹0.80 Cr (4.34% of revised agreement ₹18.47 Cr); funds released so far: NIL. Immediate execution requirement: Civil works ₹5.00 Cr + Pumps/Motors ₹2.10 Cr + Substation yard ₹0.25 Cr.',
      actionNeeded: 'Submit supplemental LOC / budget release requisition to Finance Department.',
      date: '06 Nov 2026'
    },
    {
      id: 'TH-SURGE-DWG',
      scheme: 'THOP',
      schemeName: 'Thopucherla',
      title: 'Surge Analysis & Above-GL Pump House Drawing Approvals',
      category: 'Technical',
      priority: 'High',
      status: 'Under Review',
      costCr: 0,
      detail: 'Surge analysis for 5.881 km pressure main is under preparation (pipe laying cannot commence until finalized). Substructure completed to GL (+156.40 m); drawings above GL and 2x135 kW E&M pump drawings approval awaited from Advisor LIS.',
      actionNeeded: 'Finalize surge analysis and follow up with Advisor LIS Hyderabad for drawing clearance.',
      date: '06 Nov 2026'
    }
  ];

  // ------------------------------------------------------------- Funding Summary
  const FUNDING_SUMMARY = [
    { item: 'Pending Work Bills (Token 2702277887 · HOA: 4700-01-129-PVN)', bw: 0.00, vp: 0.00, dbc: 37.08, thop: 0.00, total: 37.08 },
    { item: 'TG TRANSCO Substation Deposit (Token 2602014999)', bw: 0.00, vp: 0.00, dbc: 31.42, thop: 0.00, total: 31.42 },
    { item: 'TG TRANSCO Balance Power Extension (Relocated Substation)', bw: 0.00, vp: 0.00, dbc: 25.87, thop: 0.00, total: 25.87 },
    { item: 'TGSPDCL Power Transmission Line Deposits', bw: 12.78, vp: 3.78, dbc: 0.00, thop: 0.00, total: 16.56 },
    { item: 'Land Acquisition Compensation (Awards & LAO)', bw: 7.00, vp: 0.36, dbc: 0.00, thop: 0.00, total: 7.36 },
    { item: 'Immediate Civil Works Execution Funding', bw: 11.00, vp: 3.32, dbc: 14.00, thop: 5.00, total: 33.32 },
    { item: 'Pumps & Motors Supply / Advance (2×135 kW VT Sets)', bw: 0.00, vp: 0.00, dbc: 0.00, thop: 2.10, total: 2.10 },
    { item: 'Substation Yard & Dedicated Transformer (VE-1)', bw: 0.00, vp: 0.00, dbc: 0.00, thop: 0.25, total: 0.25 }
  ];

  // ------------------------------------------------------------- Supplemental Agreement No. 03 Breakdown
  const SUPPLEMENTAL_AGREEMENT_DETAILS = {
    agreementNo: '03/SE/ICHC/2026-27',
    agreementDate: '27.08.2026',
    originalAgreementNo: '21SE/ICHC/2021-22',
    originalAgreementVal: 2859944991, // Rs. 285,99,44,991 (≈ Rs. 285.99 Cr)
    estimateRatesVal: 2849545051,     // Rs. 2,84,95,45,051 (≈ Rs. 284.95 Cr)
    tenderPremiumPct: 3.95,
    tenderPremiumVal: 112557030,      // Rs. 11,25,57,030 (≈ Rs. 11.26 Cr)
    netAgreementVal: 2962102081,      // Rs. 2,96,21,02,081 (≈ Rs. 296.21 Cr)
    schemes: [
      { id: 'BW', name: 'Bothalapalem-Wadapally', amount: 1074575978, amountCr: 107.46 },
      { id: 'VP-II', name: 'Veerlapalem-II', amount: 215378858, amountCr: 21.54 },
      { id: 'DBC', name: 'Dunnapothulagandi (DBC)', amount: 1439224885, amountCr: 143.92 },
      { id: 'THOP', name: 'Thopucherla', amount: 120365330, amountCr: 12.04 }
    ]
  };

  // ------------------------------------------------------------- Price Escalation (VE-I / Revised TS Part-III Lumpsum)
  const PRICE_ESCALATION = {
    total: 8.84, // Rs 8.84 Cr
    totalExact: 88420897.94,
    source: 'Variation Estimate-I / Revised TS (Rs 548.23 Cr) under Part-III Lumpsum',
    note: 'Price escalation is NOT part of Supplemental Agreement (03/SE/ICHC/2026-27, Rs 296.21 Cr) — the 242 Schedule-A items have no escalation item. Provided only in Variation Estimate-I / Revised TS (Rs 548.23 Cr) under Part-III Lumpsum.',
    schemes: [
      { id: 'BW', name: 'Bothalapalem–Wadapally LIS', amount: 35368359.18, amountCr: 3.54, sharePct: 40.0 },
      { id: 'DBC', name: 'Dunnapothulagandi (DBC) LIS', amount: 35368359.18, amountCr: 3.54, sharePct: 40.0 },
      { id: 'VP-II', name: 'Veerlapalem–II LIS', amount: 8842089.79, amountCr: 0.88, sharePct: 10.0 },
      { id: 'THOP', name: 'Thopucherla LIS', amount: 8842089.79, amountCr: 0.88, sharePct: 10.0 }
    ]
  };

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

  Object.assign(LIS, { SCHEMES, TANKS, ISSUES, FUNDING_SUMMARY, PROGRAM_DATES, AYACUT_SUMMARY, SUPPLEMENTAL_AGREEMENT_DETAILS, PRICE_ESCALATION });
})(typeof window !== 'undefined' ? window : globalThis);
