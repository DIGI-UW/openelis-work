/**
 * OpenELIS Global: Clinical Order Entry v4 (developer handoff mockup)
 *
 * Spec:      clinical-order-entry-v4-frs.md, v0.7 (2026-09-25)
 * Reference: clinical-order-entry-v4-preview.html (approved HTML preview; visual and behavioural reference)
 * Stack:     @carbon/react v1.15+, @carbon/icons-react. Carbon tokens only; the only literal colours are the
 *            container cap swatches, which are catalog data (FR-G2: cap colour is display-only and editable).
 *
 * THIS DRAWING IS ABBREVIATED. It is a mockup a developer ports, not production code:
 *   - Mock data is inline (PNG CPHL, patient Kila Morea, order 26CPHL00471, samples -1, -2, aliquot -1.1).
 *   - Saves are simulated with a timer. The real save is ONE all-or-nothing request per step (FR-A5, D-072)
 *     carrying an idempotency key so a retry returns the original result (FR-A13, FR-K3, FR-K5).
 *   - Reused shipped UI is fenced (D-063): each fence draws a minimal stand-in inside a visible "Reused" marker
 *     naming the owning spec. Wire the real component there; do not rebuild it:
 *       Shared patient search panel ............ OGC-1197 (changes per FR-B5, FR-B6)
 *       New-patient form ....................... Patient entry (shared, unchanged layout)
 *       Storage location picker ................ OGC-657 (gains return-to-page mode, FR-E5)
 *       Inline non-conformity form ............. NCE module (gains return-to-page mode, FR-E5)
 *       Referral form .......................... Clinical referral (return-to-page mode, Dependency 10)
 *       Label presets .......................... OGC-285 (preset definitions and PDF rendering)
 *       Sample acceptance checklist ............ S-09 (items configured in Admin > Compliance)
 *       Order attachments ...................... Existing attachments component (FR-B31)
 *   - Every visible string goes through t(key, English) using the FRS Localization table keys. Keys marked
 *     "mockup.*" are reviewer-only chrome (screen switcher, fence markers) and are not shipped.
 *
 * i18n: keys used here that are NOT yet in the FRS Localization table (proposed NEW; run npm run i18n:find for each
 * before minting; several nav.*, patient.* and common.* keys likely exist on develop and should be reused):
 *   admin.{deactivated}
 *   admin.bodySite.{add, legacy, note, translated}
 *   admin.containerType.{add, additive.help, andMore, search, seeded, standardCode.help, usedByCount}
 *   admin.csv.{export, import}
 *   admin.orderEntry.{acceptance.env, acceptance.items, acceptance.mandatory, acceptance.off, acceptance.optional,
 *       acceptance.vector, preserved, preserved.help, requirement, setting, title, value}
 *   common.{actions, all, apply, choose, clearFilter, datePlaceholder, no, none, off, on, or, required, search,
 *       searching, select, selectAll, unit, yearsShort, yes}
 *   nav.{adminManagement, clinicalOrders, home, orders, sampleTypes, testCatalog, tests}
 *   order.{requestTime}
 *   order.attachments.{add, rule}
 *   order.dashboard.{awaitingCount, cancel.complete, cancel.effect, entered, filters, newOrder, progress, samples}
 *   order.entry.{facility.review, provider.use, received.at, received.time, received.tz, section.attachments}
 *   order.labNumber.{format, new}
 *   order.label.{all, custom, printing, rowTotal}
 *   order.nav.{discard.unusedNumber}
 *   order.nce.{continueFlag, outcome, prefilled, reason, reject, rejectResample, title}
 *   order.notify.{heading, whereSet}
 *   order.prepare.{addOn, addOnTests, bodySite.choose, consent.recorded, siteLockedBy}
 *   order.reconnecting.{sub}
 *   order.referral.{aliquotFirst.enter, title}
 *   order.requester.{contact, email.invalid, facility, fax.invalid, referringLabNumber, ward}
 *   order.sampleCheck.{answerFor, col.checklist, fail, noneReported, pass, released}
 *   order.samples.{collectionDate, collectionMethod, collectionTime, collector, conditions, containerType, details,
 *       editCollection, fillAll.title, fromParent, gps, gps.help, labSampling, noCollector, noTime, notRecorded,
 *       origin, removedOne, selected, temperature, toolbar}
 *   order.step.{current, progress, reason.rejected}
 *   order.storage.{locked, position}
 *   order.summary.{awaiting, elsewhere, eqaNoPatient, label, noFacility, noPatientOverride, noProvider,
 *       notCollected, referred, specimens, testCount, testsAndSamples, withSample}
 *   order.tests.{addByCode.added, addByCode.inactive, addByCode.placeholder, alsoOwn, cancel.other, cancelTest,
 *       compatibleFirst, done, empty, filter.anySampleType, filtered, labNotSet, lookupFailed, lookupFailed.sub,
 *       memberCount, orderPanels, orderTests, otherSamples, pageOf, performingLab, removePanel, removed,
 *       reportedValue}
 *   patient.{dob, firstName, identifier, lastName, lastOrder, nationalId, noPrevious, search.external, sex}
 *   testCatalog.bodySite.{mode, notUsed}
 *   testCatalog.containers.{add, makePreferred, min, ownContainer.help, role}
 *   testCatalog.sampleType.{defaultContainer.help}
 *
 * Routes and SideNav (FRS Navigation & URL)
 *   OrderDashboard ............ /order/clinical                                  Orders & Patients -> Add Clinical Order
 *   EnterOrderPage ............ /order/clinical/enter[?id=]                      (step within the order)
 *   PrepareSamplesPage ........ /order/clinical/collect?id=                      (step within the order)
 *   SampleCheckPage ........... /order/clinical/qa?id=                           (step within the order, optional)
 *   ContainerTypesAdmin ....... /admin/TestCatalogList?entity=containertypes     Admin -> Config -> Test Catalog -> Container Types
 *   BodySitesAdmin ............ /admin/TestCatalogList?entity=bodysites          Admin -> Config -> Test Catalog -> Body Sites
 *   TestEditor sections ....... /MasterListsPage/TestCatalogEditor/*             Admin -> Config -> Test Catalog -> Tests
 *   SampleTypeSettings ........ /admin/TestCatalogList?entity=sampletypes        Admin -> Config -> Test Catalog -> Sample Types
 *   OrderEntryConfiguration ... /MasterListsPage/SampleEntryConfigurationMenu    Admin -> Config -> Order Entry Configuration
 *   Removed: /order/clinical/label redirects to /order/clinical/collect keeping ?id= (D-066 Remove).
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Grid, Column, Stack, Breadcrumb, BreadcrumbItem,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent, TableToolbarSearch, TableBatchActions, TableBatchAction,
  TableSelectRow, TableSelectAll, TableExpandHeader, TableExpandRow, TableExpandedRow,
  TextInput, TextArea, Select, SelectItem, SelectItemGroup, ComboBox, FilterableMultiSelect, NumberInput,
  Toggle, Checkbox, RadioButtonGroup, RadioButton, DatePicker, DatePickerInput, TimePicker,
  Button, IconButton, InlineNotification, ActionableNotification, Tag, DismissibleTag, Modal, Tile,
  Tooltip, Pagination, Search, ContentSwitcher, Switch, Link, SkeletonText,
} from '@carbon/react';
import {
  Printer, SendAlt, WarningAlt, TrashCan, Misuse, Eyedropper, Box, Locked, Edit, Undo, Add, Barcode, Time,
  ChevronDown, CheckmarkFilled, WarningFilled, Incomplete, RadioButtonChecked, CircleDash, Upload, Download,
} from '@carbon/icons-react';

/* ============================== i18n ============================== */
// Stand-in for the app's intl hook. Every visible string is t('key', 'English'); fmt() fills {placeholders}.
const t = (key, fallback) => fallback || key;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));

/* ============================== Mock reference data ============================== */
// In the app these come from the reference-data cache: loaded once, refreshed at most every 15 min (FR-K7).
const LAB = '26CPHL00471';
const LAB_TZ = 'Pacific/Port_Moresby'; // FR-K8a: from the distribution configuration
const NOW = '2026-09-25T10:55';        // FR-K8: "now" always comes from the server clock, in laboratory time
const RECEIVED_AT = '2026-09-25T09:42';
const ME = 'Mary Kila';                // signed-in reception clerk
const TECH = 'John Wari';
const USERS = ['Mary Kila', 'John Wari', 'Sr Ruth Kewa', 'Grace Pokana', 'Peter Ila'];
const REF_LABS = [
  'PNG Institute of Medical Research (PNGIMR), Goroka',
  'Angau Memorial Hospital Laboratory, Lae',
  'Victorian Infectious Diseases Reference Laboratory (VIDRL), Melbourne',
];
const FACILITIES = [
  { id: 'pmgh', name: 'Port Moresby General Hospital', wards: ['Medical Ward 3', 'Medical Ward 1', 'Surgical Ward 2', 'Maternity', 'Emergency Department'] },
  { id: 'ggh', name: 'Gerehu General Hospital', wards: ['General Ward', 'Maternity', 'Outpatients'] },
  { id: 'thc', name: 'Tokarara Health Centre', wards: ['Outpatients', 'Antenatal Clinic'] },
  { id: 'kkc', name: 'Kila Kila Clinic', wards: ['Outpatients', 'TB Clinic'] },
];
const PROVIDERS = [
  { id: 'p1', title: 'Dr', first: 'Agnes', last: 'Tau', facility: 'Port Moresby General Hospital', phone: '+675 324 8200', fax: '+675 324 8201', email: 'a.tau@pomgh.gov.pg' },
  { id: 'p2', title: 'Dr', first: 'Joseph', last: 'Tauvasa', facility: 'Gerehu General Hospital', phone: '+675 326 1100', fax: '', email: 'j.tauvasa@gerehu.gov.pg' },
  { id: 'p3', title: 'Sr', first: 'Ruth', last: 'Kewa', facility: 'Port Moresby General Hospital', phone: '+675 324 8350', fax: '', email: 'r.kewa@pomgh.gov.pg' },
];
const PROVIDER_TITLES = ['Dr', 'Prof', 'Sr', 'Mr', 'Mrs', 'Ms']; // provider title list used by the Providers admin page (FR-B9)
const provName = p => (p ? `${p.title ? p.title + ' ' : ''}${p.first} ${p.last}` : '');
const PATIENTS = [
  { id: 'pt1', name: 'Kila Morea', sex: 'F', dob: '14/03/1988', age: 38, nid: 'PNG-8814-2209', last: '02/06/2026 (26CPHL00190)' },
  { id: 'pt2', name: 'Kila Morea', sex: 'F', dob: '30/07/2011', age: 15, nid: 'PNG-1107-5531', last: '18/11/2025 (25CPHL03321)' },
  { id: 'pt3', name: 'Kilala Moresi', sex: 'M', dob: '05/01/1979', age: 47, nid: 'PNG-7901-0412', last: '' },
];
const PROGRAMS = {
  'Routine clinical testing': [],
  'Antenatal care': [{ k: 'gest', l: 'Gestation (weeks)' }],
  'HIV care and treatment': [{ k: 'art', l: 'Current ART regimen', o: ['TLD', 'TEE', 'Not on ART'] }, { k: 'vlr', l: 'Reason for viral load', o: ['Routine monitoring', 'Suspected treatment failure'] }],
  'TB program': [{ k: 'tbn', l: 'TB register number' }],
};
const CANCEL_REASONS = ['Duplicate request', 'Ordered in error', 'Clinician cancelled', 'Patient left before collection']; // configurable list (FR-B21)
const REFERRAL_REASONS = ['Test not performed here', 'Confirmation testing', 'Analyzer down', 'Quality control'];
const NC_REASONS = ['Haemolysed', 'Clotted', 'Insufficient volume', 'Wrong container', 'Unlabelled or mislabelled', 'Leaking'];
const STORAGE_LOCATIONS = [
  'Specimen Reception > Fridge 2 > Shelf B > Rack R4',
  'Specimen Reception > Fridge 1 > Shelf A > Rack R1',
  'Biochemistry > Freezer -20 > Drawer 3 > Box 12',
];
const COLLECTION_METHODS = ['Venepuncture', 'Capillary (finger or heel prick)', 'Midstream urine', 'Swab collection', 'Expectorated sputum'];

// Container types (FR-G1, Appendix A subset). cap = display swatch (catalog data, the only literal colours in this file).
const CONTAINERS = {
  edta4:   { name: 'K2EDTA tube 4 mL', short: 'K2EDTA 4 mL', code: 'EDTA4', additive: 'K2EDTA', material: 'PET plastic', vol: '4 mL', cap: '#b57edc', capName: 'Lavender', yields: ['Whole blood', 'Plasma'], category: 'Blood', domain: ['Clinical'], usedBy: ['Full Blood Count', 'HbA1c', 'CD4 count', 'HIV-1 viral load', 'Malaria RDT'], usedN: 14, samples: 1204, active: true },
  edta2:   { name: 'K2EDTA tube 2 mL (paediatric)', short: 'K2EDTA 2 mL', code: 'EDTA2', additive: 'K2EDTA', material: 'PET plastic', vol: '2 mL', cap: '#b57edc', capName: 'Lavender', yields: ['Whole blood', 'Plasma'], category: 'Blood', domain: ['Clinical'], usedBy: ['Full Blood Count'], usedN: 6, samples: 311, active: true },
  citrate: { name: 'Sodium citrate 3.2% tube', short: 'Sodium citrate 2.7 mL', code: 'CIT32', additive: 'Sodium citrate', material: 'PET plastic', vol: '2.7 mL', cap: '#8ecae6', capName: 'Light blue', yields: ['Plasma (citrated)'], category: 'Blood', domain: ['Clinical'], usedBy: ['Coagulation Screen', 'Fibrinogen', 'D-dimer'], usedN: 22, samples: 402, active: true },
  plain:   { name: 'Plain serum tube', short: 'Plain serum 5 mL', code: 'PLAIN', additive: 'Clot activator', material: 'PET plastic', vol: '5 mL', cap: '#c0392b', capName: 'Red', yields: ['Serum'], category: 'Blood', domain: ['Clinical'], usedBy: ['Syphilis RPR'], usedN: 61, samples: 950, active: true },
  sst:     { name: 'Serum separator tube (SST)', short: 'SST 5 mL', code: 'SST', additive: 'Clot activator, gel', material: 'PET plastic', vol: '5 mL', cap: '#d4a017', capName: 'Gold', yields: ['Serum'], category: 'Blood', domain: ['Clinical'], usedBy: ['Liver Function Panel', 'Creatinine', 'TSH'], usedN: 214, samples: 3380, active: true },
  lihep:   { name: 'Lithium heparin tube', short: 'Li-heparin 4 mL', code: 'LIHEP', additive: 'Lithium heparin', material: 'PET plastic', vol: '4 mL', cap: '#2e8b57', capName: 'Green', yields: ['Plasma', 'Whole blood'], category: 'Blood', domain: ['Clinical'], usedBy: ['Ammonia'], usedN: 98, samples: 510, active: true },
  pst:     { name: 'Plasma separator tube (PST)', short: 'PST 4.5 mL', code: 'PST', additive: 'Lithium heparin, gel', material: 'PET plastic', vol: '4.5 mL', cap: '#90d18b', capName: 'Light green', yields: ['Plasma'], category: 'Blood', domain: ['Clinical'], usedBy: ['Creatinine (used as Serum)'], usedN: 11, samples: 288, active: true },
  amies:   { name: 'Amies gel transport swab', short: 'Amies gel swab', code: 'AMIES', additive: 'Amies gel', material: 'Plastic', vol: '', cap: '#3b7dd8', capName: 'Blue', yields: ['Swab, wound', 'Swab'], category: 'Swab', domain: ['Clinical'], usedBy: ['Wound Culture', 'Throat Culture'], usedN: 5, samples: 233, active: true },
  eswab:   { name: 'Liquid Amies flocked swab (ESwab)', short: 'ESwab 1 mL', code: 'ESWAB', additive: 'Liquid Amies', material: 'Plastic', vol: '1 mL', cap: '#ffffff', capName: 'White', yields: ['Swab, wound', 'Swab'], category: 'Swab', domain: ['Clinical'], usedBy: ['Throat Culture'], usedN: 5, samples: 120, active: true },
  urine:   { name: 'Sterile urine container', short: 'Urine container 60 mL', code: 'URINE', additive: 'None', material: 'Polypropylene', vol: '60 mL', cap: '#ffffff', capName: 'White', yields: ['Urine'], category: 'Urine', domain: ['Clinical'], usedBy: ['Urine Culture'], usedN: 31, samples: 820, active: true },
  water:   { name: 'Sterile water bottle 500 mL (sodium thiosulfate)', short: 'Water bottle 500 mL', code: 'ENV-W500', additive: 'Sodium thiosulfate', material: 'Polypropylene', vol: '500 mL', cap: '#ffffff', capName: 'White', yields: ['Drinking water'], category: 'Water', domain: ['Environmental'], usedBy: ['E. coli (drinking water)'], usedN: 8, samples: 96, active: true },
  vecEth:  { name: 'Vector specimen tube (70% ethanol)', short: 'Ethanol tube 2 mL', code: 'VEC-ETH', additive: 'Ethanol 70%', material: 'Polypropylene', vol: '2 mL', cap: '#f1c21b', capName: 'Yellow', yields: ['Mosquito pool', 'Tick'], category: 'Other', domain: ['Vector', 'Environmental'], usedBy: [], usedN: 4, samples: 58, active: true },
  legacy:  { name: 'Glass plain tube 10 mL (legacy)', short: 'Glass plain 10 mL', code: 'GLS10', additive: 'None', material: 'Glass', vol: '10 mL', cap: '#c0392b', capName: 'Red', yields: ['Serum'], category: 'Blood', domain: ['Clinical'], usedBy: [], usedN: 0, samples: 2210, active: false },
};
const CLINICAL_CONTAINERS = Object.keys(CONTAINERS).filter(k => CONTAINERS[k].active && CONTAINERS[k].domain.includes('Clinical'));

// Body sites (FR-N1, cleaned Source of Sample list) and sample type body-site settings (FR-N2)
const BODY_SITES = [
  { id: 'throat', name: 'Throat', code: '54066008', side: false, sort: 10, active: true, used: 2 },
  { id: 'naso', name: 'Nasopharynx', code: '71836000', side: false, sort: 20, active: true, used: 3 },
  { id: 'ear', name: 'Ear', code: '117590005', side: true, sort: 40, active: true, used: 1 },
  { id: 'lunglower', name: 'Lower lobe of lung', code: '90572001', side: true, sort: 60, active: true, used: 1, split: 'Split from Left Lower Lobe, Right Lower Lobe' },
  { id: 'hand', name: 'Hand', code: '85562004', side: true, sort: 90, active: true, used: 1 },
  { id: 'lowerleg', name: 'Lower leg', code: '30021000', side: true, sort: 130, active: true, used: 1 },
  { id: 'foot', name: 'Foot', code: '56459004', side: true, sort: 140, active: true, used: 1 },
  { id: 'skin', name: 'Skin', code: '39937001', side: false, sort: 150, active: true, used: 2 },
  { id: 'other', name: 'Other', code: '', side: false, sort: 999, active: true, used: 3 },
  { id: 'x-mid', name: 'Midstream', code: '', side: false, sort: 900, active: false, used: 0, legacy: 'Collection method' },
  { id: 'x-edta', name: 'EDTA', code: '', side: false, sort: 903, active: false, used: 0, legacy: 'Container additive' },
  { id: 'x-acute', name: 'Acute', code: '', side: false, sort: 904, active: false, used: 0, legacy: 'Collection timing' },
];
const siteById = id => BODY_SITES.find(s => s.id === id);
const SAMPLE_TYPE_SETTINGS = {
  'Whole blood': { defaultContainer: 'edta4', bodySite: 'Not used', allowed: [] },
  'Serum': { defaultContainer: 'sst', bodySite: 'Not used', allowed: [] },
  'Plasma': { defaultContainer: 'lihep', bodySite: 'Not used', allowed: [] },
  'Plasma (citrated)': { defaultContainer: 'citrate', bodySite: 'Not used', allowed: [] },
  'Swab, wound': { defaultContainer: 'amies', bodySite: 'Required', allowed: ['lowerleg', 'foot', 'hand', 'skin', 'other'] },
  'Swab': { defaultContainer: 'eswab', bodySite: 'Optional', allowed: ['throat', 'naso', 'ear', 'skin', 'other'] },
  'Urine': { defaultContainer: 'urine', bodySite: 'Not used', allowed: [] },
};
const bodySiteMode = st => (SAMPLE_TYPE_SETTINGS[st] || {}).bodySite || 'Not used';

// Test catalog (ct = expected containers, FR-G5; lbl = label preset links, FR-I4; hold = holding time in hours, FR-D3)
const TESTS = {};
const defTest = (id, o) => { TESTS[id] = { id, code: id, loinc: '', hold: 0, ct: [], lbl: [], ...o }; };
[['HGB', 'Haemoglobin', '718-7'], ['WBC', 'White cell count', '6690-2'], ['PLT', 'Platelet count', '777-3'], ['HCT', 'Haematocrit', '4544-3']]
  .forEach(([id, name, loinc]) => defTest(id, { name, loinc, unit: 'Hematology', st: 'Whole blood', hold: 24, ct: [{ c: 'edta4', n: 1, min: '2 mL' }] }));
defTest('HBA1C', { name: 'HbA1c', loinc: '4548-4', unit: 'Biochemistry', st: 'Whole blood', hold: 72, ct: [{ c: 'edta4', n: 1, min: '1 mL' }], lbl: [{ p: 'freezer', n: 1 }] });
[['ALT', 'Alanine aminotransferase (ALT)'], ['AST', 'Aspartate aminotransferase (AST)'], ['ALP', 'Alkaline phosphatase'], ['TBIL', 'Bilirubin, total'], ['ALB', 'Albumin']]
  .forEach(([id, name]) => defTest(id, { name, unit: 'Biochemistry', st: 'Serum', hold: 6, ct: [{ c: 'sst', n: 1, min: '1 mL' }, { c: 'plain', n: 1 }] }));
defTest('CREA', { name: 'Creatinine', loinc: '2160-0', unit: 'Biochemistry', st: 'Serum', hold: 24, ct: [{ c: 'sst', n: 1, min: '0.5 mL' }, { c: 'pst', n: 1, usedAs: true }], lbl: [{ p: 'freezer', n: 1 }] });
defTest('PTINR', { name: 'Prothrombin time and INR', short: 'PT/INR', unit: 'Hematology', st: 'Plasma (citrated)', hold: 4, own: true, ct: [{ c: 'citrate', n: 1, min: '2.7 mL' }] });
defTest('APTT', { name: 'Activated partial thromboplastin time', short: 'APTT', unit: 'Hematology', st: 'Plasma (citrated)', hold: 4, own: true, ct: [{ c: 'citrate', n: 1, min: '2.7 mL' }] });
defTest('WCUL', { name: 'Wound Culture', loinc: '6462-6', unit: 'Microbiology', st: 'Swab, wound', hold: 48, ct: [{ c: 'amies', n: 1 }, { c: 'eswab', n: 1 }], lbl: [{ p: 'plate', n: 3 }] });
defTest('TCUL', { name: 'Throat Culture', loinc: '626-2', unit: 'Microbiology', st: 'Swab', hold: 48, ct: [{ c: 'eswab', n: 1 }, { c: 'amies', n: 1 }], lbl: [{ p: 'plate', n: 2 }], site: 'throat', siteLock: true });
defTest('MRDT', { name: 'Malaria RDT', unit: 'Hematology', st: 'Whole blood', hold: 24, ct: [{ c: 'edta4', n: 1 }], lbl: [{ p: 'slide', n: 2 }] });
defTest('UCUL', { name: 'Urine Culture', loinc: '630-4', unit: 'Microbiology', st: 'Urine', hold: 24, ct: [{ c: 'urine', n: 1 }] });
defTest('SEMEN', { name: 'Semen analysis', unit: 'Microbiology', st: 'Semen', hold: 1, ct: [] }); // FR-J2: no container set
defTest('WIDAL', { name: 'Widal test', unit: 'Serology', st: 'Serum', ct: [{ c: 'plain', n: 1 }], inactive: true });
const UNITS = ['Hematology', 'Biochemistry', 'Microbiology', 'Serology', 'Immunology'];
// Generated filler so server paging (25 per page) is visible. The real list is a server-paged search (Dependency 13).
['Calcium', 'Magnesium', 'Phosphate', 'Amylase', 'Lipase', 'Ferritin', 'Folate', 'Vitamin B12', 'Cortisol', 'Insulin', 'Lactate', 'Troponin I', 'CK-MB', 'Uric acid', 'Iron', 'TIBC']
  .forEach((n, i) => ['Serum', 'Plasma'].forEach((st, j) => defTest(`BIO-${String(100 + i * 2 + j)}`, { name: `${n}${j ? ' (Plasma)' : ''}`, unit: 'Biochemistry', st, ct: [{ c: j ? 'lihep' : 'sst', n: 1 }] })));
['Dengue', 'Measles', 'Rubella', 'Toxoplasma', 'Hepatitis A', 'Leptospira', 'Scrub typhus', 'Chikungunya'].forEach((n, i) => ['IgG', 'IgM'].forEach((g, j) => defTest(`SER-${100 + i * 2 + j}`, { name: `${n} ${g}`, unit: 'Serology', st: 'Serum', ct: [{ c: 'sst', n: 1 }] })));
const CATALOG = Object.values(TESTS).filter(x => !x.inactive).sort((a, b) => a.name.localeCompare(b.name));
const tName = id => (TESTS[id] ? TESTS[id].name : id);
const tShort = id => (TESTS[id] ? TESTS[id].short || TESTS[id].name : id);

const PANELS = {
  FBC:   { name: 'Full Blood Count', code: 'FBC', loinc: '58410-2', unit: 'Hematology', members: ['HGB', 'WBC', 'PLT', 'HCT'], lbl: [{ p: 'specimen', n: 2 }, { p: 'order', n: 2 }] },
  LFT:   { name: 'Liver Function Panel', code: 'LFT', loinc: '24325-3', unit: 'Biochemistry', members: ['ALT', 'AST', 'ALP', 'TBIL', 'ALB'], lbl: [{ p: 'specimen', n: 1 }] },
  COAG:  { name: 'Coagulation Screen', code: 'COAG', loinc: '', unit: 'Hematology', members: ['PTINR', 'APTT'], lbl: [{ p: 'specimen', n: 2, lock: true }] },
  DIAB:  { name: 'Diabetes panel', code: 'DIAB', loinc: '', unit: 'Biochemistry', members: ['HBA1C'], lbl: [] },
};
const PANEL_LIST = Object.keys(PANELS).map(id => ({ id, ...PANELS[id] }));
const CODE_INDEX = {};
Object.values(TESTS).forEach(x => { CODE_INDEX[x.code.toUpperCase()] = { kind: 'test', id: x.id }; });
Object.keys(PANELS).forEach(id => { CODE_INDEX[PANELS[id].code] = { kind: 'panel', id }; });

// Label presets (Label Presets admin, OGC-285). Every ACTIVE preset is offered, system or custom (FR-I1).
const PRESETS = {
  order:       { name: 'Order label', size: '50 × 25 mm', level: 'order', def: 1, max: 4 },
  requisition: { name: 'Requisition label', size: '76 × 51 mm', level: 'order', def: 1, max: 2, custom: true },
  bench:       { name: 'Bench worksheet label', size: '76 × 25 mm', level: 'order', def: 0, max: 4, custom: true },
  specimen:    { name: 'Specimen label', size: '50 × 25 mm', level: 'sample', def: 1, max: 4, aliq: 0 },
  freezer:     { name: 'Freezer label', size: '38 × 12 mm', level: 'sample', def: 0, max: 3 },
  cryovial:    { name: 'Cryovial label', size: '25 × 10 mm', level: 'sample', def: 0, max: 4, custom: true },
  slide:       { name: 'Slide label', size: '25 × 22 mm', level: 'sample', def: 0, max: 10 },
  aliquot:     { name: 'Aliquot label', size: '38 × 12 mm', level: 'sample', def: 0, max: 4, aliq: 1 },
  plate:       { name: 'Culture plate label', size: '50 × 19 mm', level: 'sample', def: 0, max: 6, custom: true },
  tube2019:    { name: 'CPHL tube label 2019', size: '50 × 25 mm', level: 'sample', def: 1, max: 2, custom: true, inactive: true },
};
const ACTIVE_PRESETS = Object.keys(PRESETS).filter(k => !PRESETS[k].inactive);

// Sample acceptance checklist items (S-09), each mapped to the field it checks (Dependency 27)
const CHECK_ITEMS = [
  { k: 'identity', l: 'Label and identity match the request' },
  { k: 'container', l: 'Container correct and intact' },
  { k: 'volume', l: 'Volume adequate' },
  { k: 'timing', l: 'Received within holding time' },
  { k: 'site', l: 'Body site recorded', when: r => bodySiteMode(r.st) !== 'Not used' },
  { k: 'condition', l: 'Sample condition acceptable' },
];

/* ============================== Formatting and model helpers ============================== */
const fmtDT = iso => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)} ${iso.slice(11, 16)}` : '');
const minutesBetween = (a, b) => (Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / 60000;
const fmtDuration = m => { const h = Math.floor(m / 60); const mm = Math.round(m % 60); return h ? `${h} h ${mm} min` : `${mm} min`; };
const suffixOf = num => { const m = /(-\d+(?:\.\d+)?)$/.exec(num || ''); return m ? m[1] : num; };

// Ordered test entry. panels = the panels it came from (FR-B16 provenance); own = also chosen on its own.
const mkEntry = (id, o = {}) => ({ id, panels: [], own: false, saved: false, cancelled: false, removed: null, cancelReason: '', elsewhere: { on: false, lab: '', value: '' }, paid: false, notify: { patient: false, provider: true }, ...o });
function buildOrderedTests(spec, saved = false) {
  const out = [];
  spec.forEach(s => {
    if (s.startsWith('P:')) {
      const pid = s.slice(2);
      PANELS[pid].members.forEach(m => { const ex = out.find(e => e.id === m); if (ex) ex.panels.push(pid); else out.push(mkEntry(m, { panels: [pid], saved })); });
    } else {
      const ex = out.find(e => e.id === s);
      if (ex) ex.own = true; else out.push(mkEntry(s, { own: true, saved }));
    }
  });
  return out;
}
const activeTests = ot => ot.filter(e => !e.cancelled);
const panelsOf = ot => { const seen = []; ot.forEach(e => e.panels.forEach(p => { if (!seen.includes(p)) seen.push(p); })); return seen; };
function panelInfo(ot, pid) {
  const total = PANELS[pid].members.length;
  const on = ot.filter(e => e.panels.includes(pid) && !e.cancelled).length;
  return { total, on, modified: on < total };
}

// Sample row. num follows FR-C4: {labNo}-{n}, aliquot {labNo}-{n}.{m}
const mkSample = o => {
  const num = o.parent ? `${o.parent}.${o.pos}` : `${o.labNo || LAB}-${o.pos}`;
  return { key: num, num, tests: [], status: [], storage: '', coll: { at: '', by: '', elsewhere: false, defaulted: false, afterReceiptOk: false }, qty: '', unit: 'mL', saved: false, proposed: false, edited: false, voided: false, voidReason: '', site: '', side: '', siteOther: '', pending: [], referred: [], referTo: '', proposedFor: [], ...o, num };
};
const liveSamples = rows => rows.filter(r => !r.voided && !r.removedUnsaved);
const usableSamples = rows => liveSamples(rows).filter(r => !r.status.includes('Rejected'));
const hostOf = (testId, rows) => usableSamples(rows).find(r => r.tests.includes(testId));

// FR-B24, FR-B25: one sample per container needed. Same container type shares unless "needs its own container";
// own-container tests share only with tests of the same panel. The proposed count is the largest single count, not the sum.
// (Alternate-container sharing is abbreviated here; see FR-B25 last sentence.)
function proposeSamples(ot, labNo = LAB) {
  const groups = [];
  activeTests(ot).filter(e => !e.elsewhere.on).forEach(e => {
    const test = TESTS[e.id];
    const pref = test && test.ct[0];
    if (!pref) return; // FR-G8: no containers and no sample type default: no proposal
    const key = test.own ? `own:${e.panels[0] || e.id}:${pref.c}` : pref.c;
    let g = groups.find(x => x.key === key);
    if (!g) { g = { key, c: pref.c, st: test.st, tests: [] }; groups.push(g); }
    g.tests.push(e.id);
  });
  return groups.map((g, i) => mkSample({
    labNo, pos: i + 1, c: g.c, st: CONTAINERS[g.c].yields.includes(g.st) ? g.st : CONTAINERS[g.c].yields[0],
    tests: g.tests, proposed: true, proposedFor: g.tests, qty: CONTAINERS[g.c].vol.split(' ')[0] || '',
  }));
}
// FR-D5 compatibility: the sample's container is one of the test's expected containers (or can-be-used-as) and the type matches
const isCompatible = (testId, row) => { const x = TESTS[testId]; return !!x && (x.ct.some(c => c.c === row.c) || !x.ct.length) && (row.st === x.st || x.ct.some(c => c.c === row.c && c.usedAs)); };

// Names grouped by panel for messages ("Full Blood Count, HbA1c")
function groupNames(ids, ot) {
  const out = []; const used = new Set();
  panelsOf(ot).forEach(pid => { if (PANELS[pid].members.some(m => ids.includes(m))) { out.push(PANELS[pid].name); PANELS[pid].members.forEach(m => used.add(m)); } });
  ids.filter(id => !used.has(id)).forEach(id => out.push(tShort(id)));
  return out.join(', ');
}

// FR-I4 label quantities. For each preset: highest default and highest maximum across contributing tests (and their panels).
function labelSources(testIds, ot, level, isAliquot) {
  const out = {};
  const links = [];
  testIds.forEach(id => {
    const e = ot.find(x => x.id === id);
    (TESTS[id] ? TESTS[id].lbl : []).forEach(l => links.push({ ...l, by: tName(id) }));
    (e ? e.panels : []).forEach(pid => PANELS[pid].lbl.forEach(l => links.push({ ...l, by: PANELS[pid].name })));
  });
  ACTIVE_PRESETS.filter(k => PRESETS[k].level === level).forEach(k => {
    const mine = links.filter(l => l.p === k);
    if (isAliquot) { out[k] = { qty: PRESETS[k].aliq != null ? PRESETS[k].aliq : 1, max: PRESETS[k].max, src: 'preset', linked: false }; return; }
    if (!mine.length) { out[k] = { qty: PRESETS[k].def, max: PRESETS[k].max, src: 'preset', linked: false }; return; }
    const top = mine.reduce((a, b) => (b.n > a.n ? b : a));
    const lock = mine.find(l => l.lock);
    out[k] = { qty: top.n, max: PRESETS[k].max, src: 'test', by: top.by, linked: true, lockedBy: lock ? lock.by : null };
  });
  return out;
}

// Order summary counts (FR-B2)
function summarize(ot, rows, received) {
  const act = activeTests(ot);
  const c = { tests: act.length, with: 0, awaiting: 0, notCollected: 0, referred: 0, elsewhere: 0, samples: liveSamples(rows).filter(r => !r.parent).length, stored: liveSamples(rows).filter(r => r.storage).length };
  act.forEach(e => {
    const h = hostOf(e.id, rows);
    if (e.elsewhere.on) c.elsewhere += 1;
    else if (h && h.referred.includes(e.id)) { c.referred += 1; c.with += 1; }
    else if (h) c.with += 1;
    else if (!received && !rows.length) c.notCollected += 1;
    else c.awaiting += 1;
  });
  return c;
}

/* ============================== Small shared UI ============================== */
const S = {
  section: { marginBottom: 'var(--cds-spacing-07)' },
  muted: { color: 'var(--cds-text-secondary)', fontSize: '0.75rem' },
  mono: { fontFamily: 'var(--cds-code-01-font-family, monospace)' },
  row: { display: 'flex', gap: 'var(--cds-spacing-05)', flexWrap: 'wrap', alignItems: 'flex-end' },
  strike: { textDecoration: 'line-through', color: 'var(--cds-text-secondary)' },
  panelBox: { background: 'var(--cds-layer-02)', padding: 'var(--cds-spacing-05)', borderLeft: '3px solid var(--cds-border-interactive)' },
};

// D-063 fence. Visible marker naming the owning spec; the child is a stand-in for the shipped component.
function Fence({ owner, name, children, note }) {
  return (
    <div data-fence={owner} style={{ border: '1px dashed var(--cds-border-strong-01)', padding: 'var(--cds-spacing-04)', position: 'relative' }}>
      <Tag type="outline" size="sm">{fmt(t('mockup.reused', 'Reused: {name} ({owner})'), { name, owner })}</Tag>
      {note && <span style={{ ...S.muted, marginLeft: 8 }}>{note}</span>}
      <div style={{ marginTop: 'var(--cds-spacing-03)' }}>{children}</div>
    </div>
  );
}

// Required marker on the label (FR-A8). Pair with the input's `required` prop so screen readers announce it.
const reqLabel = (label, on) => (on ? <>{label} <span aria-hidden="true" style={{ color: 'var(--cds-text-error)' }}>*</span></> : label);

// Cap swatch: the ONLY literal colours in the file (catalog data)
function CapSwatch({ c }) {
  const ct = CONTAINERS[c];
  if (!ct) return null;
  return <span aria-hidden="true" title={ct.capName} style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: ct.cap || 'transparent', border: '1px solid var(--cds-border-strong-01)', marginRight: 6, verticalAlign: 'middle' }} />;
}

// FR-C4a suffix badge. Proposed assignments are outlined with "Proposed" (FR-B19).
function SuffixBadge({ num, proposed, full }) {
  const sfx = suffixOf(num);
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.2 }}>
      <span style={{
        fontWeight: 600, padding: '0 6px', minWidth: 28, textAlign: 'center',
        border: proposed ? '1px dashed var(--cds-border-strong-01)' : '1px solid var(--cds-border-inverse)',
        background: proposed ? 'transparent' : 'var(--cds-layer-accent-01)',
      }}>
        {sfx}{proposed && <span style={{ fontWeight: 400, marginLeft: 4, fontSize: '0.75rem' }}>{t('order.tests.proposed', 'Proposed')}</span>}
      </span>
      {full && <span style={{ ...S.muted, ...S.mono, userSelect: 'all' }}>{num}</span>}
    </span>
  );
}

// FR-C2a Tag kinds, FR-C11: at most two status Tags plus "+n" with the rest in a tooltip
const TAG_KIND = {
  'Pending save': 'blue', 'Prints after save': 'blue', Proposed: 'blue', Stored: 'green', Referred: 'purple', 'Tested elsewhere': 'purple',
  'Awaiting sample': 'purple', 'Non-conformity': 'warm-gray', Rejected: 'red', 'Holding time exceeded': 'red', STAT: 'red',
  Voided: 'gray', Cancelled: 'gray', Modified: 'warm-gray', Aliquot: 'cool-gray', Edited: 'cool-gray',
};
const STATUS_KEY = {
  'Pending save': 'order.samples.status.pendingSave', Referred: 'order.samples.status.referred', 'Non-conformity': 'order.samples.status.nonconformity',
  Rejected: 'order.samples.status.rejected', Voided: 'order.samples.status.voided', Aliquot: 'order.samples.status.aliquot', Stored: 'order.samples.status.stored',
  Proposed: 'order.tests.proposed', Edited: 'order.samples.edited', 'Holding time exceeded': 'order.prepare.holdingTime.exceeded',
};
function StatusTags({ tags }) {
  const shown = tags.slice(0, 2);
  const rest = tags.slice(2);
  const label = s => (typeof s === 'string' ? t(STATUS_KEY[s] || `order.samples.status.${s}`, s) : s.text);
  const kind = s => (typeof s === 'string' ? TAG_KIND[s] || 'gray' : s.kind);
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      {shown.map((s, i) => (
        <Tag key={i} size="sm" type={kind(s)} renderIcon={typeof s !== 'string' && s.icon ? s.icon : (s === 'Non-conformity' ? WarningAlt : undefined)} title={typeof s !== 'string' ? s.tip : undefined}>{label(s)}</Tag>
      ))}
      {rest.length > 0 && (
        <Tooltip label={rest.map(label).join(', ')} align="bottom"><Tag size="sm" type="gray" tabIndex={0}>{`+${rest.length}`}</Tag></Tooltip>
      )}
    </span>
  );
}

// Page header: breadcrumb, title, optional actions
function PageHeader({ crumbs, title, subtitle, actions }) {
  return (
    <div style={{ marginBottom: 'var(--cds-spacing-05)' }}>
      <Breadcrumb noTrailingSlash>
        {crumbs.map((c, i) => <BreadcrumbItem key={c} href="#" isCurrentPage={i === crumbs.length - 1}>{c}</BreadcrumbItem>)}
      </Breadcrumb>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginTop: 'var(--cds-spacing-03)' }}>
        <div>
          <h1 className="cds--type-productive-heading-04" style={{ margin: 0 }}>{title}</h1>
          {subtitle && <p style={S.muted}>{subtitle}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}

// Numbered section (FR-B1) with folding (FR-B1a). A section with anything missing never folds.
function OrderSection({ id, n, title, required, folded, summary, onEdit, onLeave, children, extra }) {
  // onLeave: focus moved past the section; the page folds it only if its required fields are filled (FR-B1a)
  return (
    <section id={id} onBlur={e => { if (onLeave && !e.currentTarget.contains(e.relatedTarget)) onLeave(); }} style={{ ...S.section, borderTop: '1px solid var(--cds-border-subtle-01)', paddingTop: 'var(--cds-spacing-05)' }} aria-labelledby={`${id}-h`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: folded ? 0 : 'var(--cds-spacing-05)' }}>
        <h2 id={`${id}-h`} className="cds--type-productive-heading-03" style={{ margin: 0 }}>{`${n}. `}{reqLabel(title, required)}</h2>
        {folded && <span style={{ flex: 1 }}>{summary}</span>}
        {folded && <Button kind="ghost" size="sm" renderIcon={Edit} onClick={onEdit}>{t('common.edit', 'Edit')}</Button>}
        {!folded && extra}
      </div>
      {!folded && children}
    </section>
  );
}

// Scroll to and focus a field (FR-A9 checklist links, FR-A6 first problem)
function focusField(id) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const f = el.matches('input,select,textarea,button') ? el : el.querySelector('input,select,textarea,button');
  if (f) f.focus();
}

// Simulated whole-step save (FR-A5, FR-A6, FR-A11, FR-K3, FR-K6). One click, one write: re-entry is ignored while saving.
function useStepSave(sim) {
  const [state, setState] = useState({ status: 'idle', msg: '' });
  const save = (onOk, okMsg) => {
    if (state.status === 'saving') return;
    setState({ status: 'saving', msg: '' });
    setTimeout(() => {
      if (sim === 'unreachable') {
        setState({ status: 'failed', msg: fmt(t('order.save.nothingSaved', 'Nothing was saved. {problem}. Your entries are still here.'), { problem: t('order.save.unreachable', 'Could not reach the server.').replace(/\.$/, '') }) });
      } else if (sim === 'unknown') {
        setState({ status: 'unknown', msg: t('order.save.unknown', 'We could not confirm the save. Retry to check.') });
      } else if (sim === 'conflict') {
        setState({ status: 'failed', msg: fmt(t('order.save.conflict', 'This order was changed by {user} at {time}. Reload to see their changes.'), { user: TECH, time: '10:51' }) });
      } else {
        setState({ status: 'saved', msg: okMsg || fmt(t('order.save.done', 'Order {labNo} saved'), { labNo: LAB }) });
        if (onOk) onOk();
      }
    }, 700);
  };
  return { state, save, dismiss: () => setState({ status: 'idle', msg: '' }) };
}

/* ============================== OrderProgressIndicator (FR-A12) ============================== */
// Custom rather than Carbon ProgressIndicator: Carbon truncates step labels and has no "In progress" or
// "Needs attention with reason" state. Built from Carbon icons and tokens; equal-width segments; labels wrap.
const STEP_META = {
  done:       { Icon: CheckmarkFilled, color: 'var(--cds-support-success)', word: () => t('order.step.done', 'Done') },
  current:    { Icon: RadioButtonChecked, color: 'var(--cds-interactive)', word: () => t('order.step.current', 'Current step') },
  inprogress: { Icon: Incomplete, color: 'var(--cds-interactive)', word: () => t('common.inProgress', 'In progress') },
  attention:  { Icon: WarningFilled, color: 'var(--cds-support-error)', word: () => t('order.step.attention', 'Needs attention') },
  notstarted: { Icon: CircleDash, color: 'var(--cds-icon-secondary)', word: () => t('order.step.notStarted', 'Not started') },
};
const stepDone = time => ({ state: 'done', text: fmt(t('order.step.doneAt', 'Done {time}'), { time }) });
const stepCurrent = n => ({ state: 'current', text: n ? fmt(t('order.step.toDo', '{count} to do'), { count: n }) : t('order.step.ready', 'Ready') });
const stepInProgress = n => ({ state: 'inprogress', text: fmt(t('order.step.savedToDo', 'Saved, {count} to do'), { count: n }) });
const stepAttention = why => ({ state: 'attention', text: why });
const stepNotStarted = () => ({ state: 'notstarted', text: t('order.step.notStarted', 'Not started') });

// Steps enabled for the order: Sample check only when sampleAcceptCheck.clinical is not Off (FR-F1)
function orderSteps(acceptance, states) {
  const all = [
    { key: 'enter', label: t('order.step.enter', 'Enter Order'), route: '/order/clinical/enter' },
    { key: 'prepare', label: t('order.step.prepare', 'Prepare Samples'), route: '/order/clinical/collect' },
    { key: 'check', label: t('order.step.sampleCheck', 'Sample check'), route: '/order/clinical/qa' },
  ];
  return all.filter(s => s.key !== 'check' || acceptance !== 'Off').map((s, i) => ({ ...s, ...(states[i] || stepNotStarted()) }));
}

function OrderProgressIndicator({ steps, onOpen, compact }) {
  if (compact) {
    // Dashboard row variant: a row of step icons with accessible names (FR-A12 last sentences)
    return (
      <span style={{ display: 'inline-flex', gap: 4 }} aria-label={t('order.step.progress', 'Order progress')}>
        {steps.map(s => { const m = STEP_META[s.state]; return <m.Icon key={s.key} size={16} style={{ fill: m.color }} aria-label={`${s.label}: ${m.word()}, ${s.text}`} />; })}
      </span>
    );
  }
  return (
    <nav aria-label={t('order.step.progress', 'Order progress')} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
      <ol style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 'var(--cds-spacing-03)', listStyle: 'none', margin: 0, padding: 0 }}>
        {steps.map((s, i) => {
          const m = STEP_META[s.state];
          const current = s.state === 'current';
          return (
            <li key={s.key} style={{ borderTop: current ? '4px solid var(--cds-interactive)' : `2px solid ${s.state === 'done' ? 'var(--cds-support-success)' : 'var(--cds-border-subtle-01)'}` }}>
              <button
                type="button"
                disabled={!onOpen || current}
                onClick={() => onOpen && onOpen(s.key)}
                aria-current={current ? 'step' : undefined}
                style={{ all: 'unset', cursor: onOpen && !current ? 'pointer' : 'default', display: 'flex', gap: 8, padding: 'var(--cds-spacing-03) 0', width: '100%' }}
              >
                <m.Icon size={20} style={{ fill: m.color, flex: 'none' }} aria-hidden="true" />
                <span style={{ whiteSpace: 'normal' }}>
                  <span style={{ display: 'block', fontWeight: current ? 600 : 400 }}>{`${i + 1}. ${s.label}`}</span>
                  <span style={{ display: 'block', ...S.muted }}>
                    {s.state !== 'notstarted' && <span className="cds--visually-hidden">{`${m.word()}: `}</span>}{s.text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ============================== OrderSummaryStrip (FR-B2) ============================== */
// Pinned under the progress indicator on every step. Each count is a link that scrolls to and filters rows.
// Specimen line uses the one display string (FR-N5): sample type, site and side.
const specimenString = r => [r.st, r.site ? (r.site === 'other' ? r.siteOther : siteById(r.site).name.toLowerCase()) : '', r.side ? r.side.toLowerCase() : ''].filter(Boolean).join(', ');

function OrderSummaryStrip({ patient, noPatient, eqa, facility, ward, provider, stat, ot, rows, received, activeFilter, onFilter }) {
  const c = summarize(ot, rows, received);
  const CountLink = ({ k, children }) => (
    <Link href="#" onClick={e => { e.preventDefault(); onFilter && onFilter(activeFilter === k ? null : k); }} aria-pressed={activeFilter === k} style={activeFilter === k ? { fontWeight: 600 } : undefined}>{children}</Link>
  );
  const parts = [];
  if (c.with) parts.push(<CountLink key="w" k="with">{fmt(t('order.summary.withSample', '{count} with sample'), { count: c.with })}</CountLink>);
  if (c.notCollected) parts.push(<CountLink key="n" k="notCollected">{fmt(t('order.summary.notCollected', '{count} not yet collected'), { count: c.notCollected })}</CountLink>);
  if (received || c.awaiting) parts.push(<CountLink key="a" k="awaiting">{fmt(t('order.summary.awaiting', '{count} awaiting'), { count: c.awaiting })}</CountLink>);
  if (c.referred) parts.push(<CountLink key="r" k="referred">{fmt(t('order.summary.referred', '{count} referred'), { count: c.referred })}</CountLink>);
  if (c.elsewhere) parts.push(<CountLink key="e" k="elsewhere">{fmt(t('order.summary.elsewhere', '{count} tested elsewhere'), { count: c.elsewhere })}</CountLink>);
  const specs = [...new Set(liveSamples(rows).filter(r => !r.parent).map(specimenString))];
  return (
    <Tile role="region" aria-label={t('order.summary.label', 'Order summary')} style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', gap: 'var(--cds-spacing-07)', flexWrap: 'wrap', marginBottom: 'var(--cds-spacing-06)', borderBottom: '1px solid var(--cds-border-subtle-01)' }}>
      <div>
        <div style={S.muted}>{t('common.patient', 'Patient')}</div>
        {patient ? (
          <>
            <strong>{patient.name}</strong>
            {/* Two identifiers (ISO 15189:2022 7.2): date of birth and national ID */}
            <div>{`${t('patient.dob', 'DOB')} ${patient.dob} | ${t('patient.nationalId', 'National ID')} `}<span style={S.mono}>{patient.nid}</span>{` | ${patient.sex}, ${patient.age} ${t('common.yearsShort', 'y')}`}</div>
          </>
        ) : (
          <strong style={noPatient ? undefined : { color: 'var(--cds-text-error)' }}>
            {noPatient ? (eqa ? t('order.summary.eqaNoPatient', 'EQA sample, no patient') : t('order.summary.noPatientOverride', 'No patient (override recorded)')) : t('order.summary.noPatient', 'No patient selected')}
          </strong>
        )}
      </div>
      <div>
        <div style={S.muted}>{t('common.requester', 'Requester')}</div>
        <div>{facility ? `${facility.name}${ward ? ', ' + ward : ''}` : <span style={S.muted}>{t('order.summary.noFacility', 'No facility yet')}</span>}</div>
        <div>{provider ? provName(provider) : <span style={S.muted}>{t('order.summary.noProvider', 'No provider yet')}</span>}</div>
      </div>
      {stat && <div><div style={S.muted}>{t('common.priority', 'Priority')}</div><Tag type="red">{t('common.stat', 'STAT')}</Tag></div>}
      <div style={{ flex: 1, minWidth: 280 }}>
        <div style={S.muted}>{t('order.summary.testsAndSamples', 'Tests and samples')}</div>
        <div>
          <CountLink k="tests">{fmt(t('order.summary.testCount', '{count} tests'), { count: c.tests })}</CountLink>
          {parts.length > 0 && ':'} {parts.map((p, i) => <React.Fragment key={i}>{i ? ', ' : ''}{p}</React.Fragment>)}
          {' · '}
          <CountLink k="samples">{fmt(t('order.summary.samples', '{count} samples, {stored} stored'), { count: c.samples, stored: c.stored })}</CountLink>
        </div>
        {/* FR-B16a: panels always show membership in the strip */}
        {panelsOf(ot).length > 0 && (
          <div style={{ fontSize: '0.75rem' }}>
            {`${t('common.panels', 'Panels')}: `}
            {panelsOf(ot).map((pid, i) => { const pi = panelInfo(ot, pid); return <span key={pid}>{i ? ' · ' : ''}{`${PANELS[pid].name} ${pi.on}/${pi.total}`}{pi.modified && <Tag size="sm" type="warm-gray">{t('order.tests.panelModified', 'Modified')}</Tag>}</span>; })}
          </div>
        )}
        {specs.length > 0 && <div style={S.muted}>{`${t('order.summary.specimens', 'Specimens')}: ${specs.join('; ')}`}</div>}
      </div>
    </Tile>
  );
}

/* ============================== ToContinueChecklist (FR-A9) and OrderFooter (FR-A1 to FR-A11) ============================== */
// items: [{ key, label, target }] in page order. Choosing one scrolls to and focuses its field.
function ToContinueChecklist({ nextStep, items }) {
  if (!items.length) return null;
  return (
    <div role="region" aria-live="polite" aria-label={fmt(t('order.continue.heading', 'To continue to {step}'), { step: nextStep })}
      style={{ background: 'var(--cds-layer-02)', borderLeft: '3px solid var(--cds-support-warning)', padding: 'var(--cds-spacing-04) var(--cds-spacing-05)', marginBottom: 'var(--cds-spacing-03)' }}>
      <strong>{fmt(t('order.continue.heading', 'To continue to {step}'), { step: nextStep })}</strong>
      <ul style={{ margin: 'var(--cds-spacing-02) 0 0', paddingLeft: 'var(--cds-spacing-05)', listStyle: 'disc' }}>
        {items.map(it => <li key={it.key}><Link href={`#${it.target}`} onClick={e => { e.preventDefault(); focusField(it.target); }}>{it.label}</Link></li>)}
      </ul>
    </div>
  );
}

// Footer for every step. primary: 'next' | 'finish' | custom node (Sample check passes Release for testing).
// Save and exit needs the save level (saveProblems empty); Save and next needs the complete level (items empty).
function OrderFooter({ nextStep, isLast, items, saveProblems, onSaveExit, onSaveNext, saveHook, discard, primaryOverride, secondaryExtra, loading }) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const [problemsShown, setProblemsShown] = useState(false);
  const { state, dismiss } = saveHook;
  const saving = state.status === 'saving' || !!loading; // FR-J1: footer actions disabled until the order has loaded
  const blockedNext = items.length > 0;
  const trySaveExit = () => { if (saveProblems.length) { setProblemsShown(true); return; } setProblemsShown(false); onSaveExit(); };
  const nextLabel = isLast ? t('order.nav.saveFinish', 'Save and finish') : t('order.nav.saveNext', 'Save and next');
  const countText = fmt(t('order.continue.count', '{count} items needed to continue'), { count: items.length });
  return (
    <div style={{ position: 'sticky', bottom: 0, zIndex: 3, background: 'var(--cds-background)', borderTop: '1px solid var(--cds-border-subtle-01)', paddingTop: 'var(--cds-spacing-04)', marginTop: 'var(--cds-spacing-07)' }}>
      <ToContinueChecklist nextStep={nextStep} items={items} />
      {/* FR-A11: one pinned notification per event, beside the footer, until dismissed */}
      {problemsShown && saveProblems.length > 0 && (
        <InlineNotification kind="error" lowContrast onClose={() => setProblemsShown(false)}
          title={fmt(t('order.save.problems', 'Fix these before saving: {problems}'), { problems: saveProblems.join('; ') })} />
      )}
      {state.status === 'failed' && <ActionableNotification inline kind="error" lowContrast title={state.msg} actionButtonLabel={t('common.retry', 'Retry')} onActionButtonClick={onSaveExit} onClose={dismiss} />}
      {state.status === 'unknown' && <ActionableNotification inline kind="warning" lowContrast title={state.msg} actionButtonLabel={t('common.retry', 'Retry')} onActionButtonClick={onSaveExit} onClose={dismiss} />}
      {state.status === 'saved' && <InlineNotification kind="success" lowContrast title={state.msg} onClose={dismiss} />}
      <div style={{ display: 'flex', gap: 'var(--cds-spacing-03)', justifyContent: 'flex-end', alignItems: 'center', padding: 'var(--cds-spacing-03) 0 var(--cds-spacing-05)' }}>
        {secondaryExtra}
        <span style={{ flex: 1 }} />
        <Button kind="danger--ghost" disabled={saving} onClick={() => setDiscardOpen(true)}>{t('common.discard', 'Discard')}</Button>
        <Button kind="secondary" disabled={saving} onClick={trySaveExit}>{saving ? t('common.saving', 'Saving...') : t('order.nav.saveExit', 'Save and exit')}</Button>
        {primaryOverride || (
          <>
            {blockedNext && <span style={S.muted} id="footer-count">{countText}</span>}
            {/* FR-A10: disabled, never hidden; says what enables it on hover and keyboard focus */}
            <Tooltip label={blockedNext ? countText : nextLabel} align="top">
              <Button kind="primary" disabled={blockedNext || saving} aria-describedby={blockedNext ? 'footer-count' : undefined} onClick={onSaveNext}>
                {saving ? t('common.saving', 'Saving...') : nextLabel}
              </Button>
            </Tooltip>
          </>
        )}
      </div>
      {/* FR-A3: the only Modal in order entry (destructive confirmation, D-005) */}
      <Modal
        open={discardOpen}
        danger
        modalHeading={t('order.nav.discard.title', 'Discard unsaved changes?')}
        primaryButtonText={discard.everSaved ? t('order.nav.discard.changes', 'Discard changes') : t('order.nav.discard.order', 'Discard order')}
        secondaryButtonText={t('common.cancel', 'Cancel')}
        onRequestClose={() => setDiscardOpen(false)}
        onRequestSubmit={() => { setDiscardOpen(false); discard.onConfirm(); }}
      >
        <p>{fmt(t('order.nav.discard.body', '{tests} tests and {samples} samples entered on this page will be lost.'), { tests: discard.tests, samples: discard.samples })}</p>
        {!discard.everSaved && <p style={S.muted}>{fmt(t('order.nav.discard.unusedNumber', 'Lab number {labNo} will be recorded as unused.'), { labNo: LAB })}</p>}
      </Modal>
    </div>
  );
}

/* ============================== Ordered tests model (FR-B16, FR-B16a, FR-B21) ============================== */
function addPanel(ot, pid) {
  const next = ot.map(e => ({ ...e, panels: [...e.panels] }));
  PANELS[pid].members.forEach(m => {
    const ex = next.find(e => e.id === m);
    if (ex) { if (!ex.panels.includes(pid)) ex.panels.push(pid); if (ex.removed && !ex.saved) { ex.cancelled = false; ex.removed = null; } }
    else next.push(mkEntry(m, { panels: [pid] }));
  });
  return next;
}
function addTest(ot, id) {
  const ex = ot.find(e => e.id === id);
  if (ex) return ot.map(e => (e.id === id ? { ...e, own: true, cancelled: false, removed: null } : e)); // never attaches the panel (FR-B16)
  return [...ot, mkEntry(id, { own: true })];
}
// Removing a panel removes the member tests that came only from it; tests also chosen on their own stay (FR-B16)
function removePanel(ot, pid) {
  return ot.map(e => {
    if (!e.panels.includes(pid)) return e;
    const panels = e.panels.filter(p => p !== pid);
    return panels.length || e.own ? { ...e, panels } : { ...e, panels, gone: true };
  }).filter(e => !e.gone);
}
// Removing one member keeps the panel, now Modified; the member stays listed, struck through, with who and when (FR-B16a)
function removeMember(ot, id) {
  return ot.map(e => (e.id === id ? (e.panels.length ? { ...e, own: false, cancelled: true, removed: { by: ME, at: NOW.slice(11, 16) } } : { ...e, gone: true }) : e)).filter(e => !e.gone);
}

/* ============================== TestPanelChooser (FR-B14, FR-B15, FR-B16, FR-B16a) ============================== */
// Two stacked lists (Order Panels, Order Tests), server-paged 25 per page, shared Lab unit and Sample type filters,
// selections as chips across pages and filters, Add by code fast path. Folds once the order has tests (FR-B1a).
const PER_PAGE = 25;
function TestPanelChooser({ ot, setOt, folded, onExpand, onFold, lookupFailed, onRetry, onNotify }) {
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState(null);
  const [unit, setUnit] = useState('');
  const [stFilter, setStFilter] = useState(null);
  const [pq, setPq] = useState('');
  const [tq, setTq] = useState('');
  const [pPage, setPPage] = useState(1);
  const [tPage, setTPage] = useState(1);
  const codeRef = useRef(null);
  const lc = s => s.toLowerCase();
  const selPanels = panelsOf(ot).filter(pid => ot.some(e => e.panels.includes(pid) && !e.cancelled));
  const ownTests = ot.filter(e => e.own && !e.cancelled);
  const sampleTypes = [...new Set(CATALOG.map(x => x.st))].sort();
  // Server query stand-in (Dependency 13). Inactive tests and tests of a deactivated lab unit are never offered.
  const pMatch = PANEL_LIST.filter(p => (!unit || p.unit === unit) && (!stFilter || p.members.some(m => TESTS[m].st === stFilter)) && (!pq || lc(`${p.name} ${p.code} ${p.loinc}`).includes(lc(pq))));
  const tMatch = CATALOG.filter(x => (!unit || x.unit === unit) && (!stFilter || x.st === stFilter) && (!tq || lc(`${x.name} ${x.code} ${x.loinc}`).includes(lc(tq))));
  const pShown = pMatch.slice((pPage - 1) * PER_PAGE, pPage * PER_PAGE);
  const tShown = tMatch.slice((tPage - 1) * PER_PAGE, tPage * PER_PAGE);

  const addByCode = ev => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    const v = code.trim().toUpperCase();
    if (!v) return;
    const hit = CODE_INDEX[v];
    if (!hit) setCodeMsg({ kind: 'error', text: fmt(t('order.tests.addByCode.none', 'No active test or panel has code {code}.'), { code: v }) });
    else if (hit.kind === 'test' && TESTS[hit.id].inactive) setCodeMsg({ kind: 'error', text: fmt(t('order.tests.addByCode.inactive', '{code} is {test}, which is inactive and cannot be ordered.'), { code: v, test: TESTS[hit.id].name }) });
    else if (hit.kind === 'panel') { setOt(addPanel(ot, hit.id)); setCodeMsg({ kind: 'success', text: fmt(t('order.tests.addByCode.added', 'Added {item}. Next code?'), { item: PANELS[hit.id].name }) }); }
    else { setOt(addTest(ot, hit.id)); setCodeMsg({ kind: 'success', text: fmt(t('order.tests.addByCode.added', 'Added {item}. Next code?'), { item: TESTS[hit.id].name }) }); }
    setCode('');
    if (codeRef.current) codeRef.current.focus(); // keeps focus for the next code
  };
  const onRemovePanel = pid => {
    const before = ot;
    const count = ot.filter(e => e.panels.includes(pid) && e.panels.length === 1 && !e.own).length;
    setOt(removePanel(ot, pid));
    onNotify({ text: fmt(t('order.tests.panelRemoved', 'Removed {panel} and {count} of its tests.'), { panel: PANELS[pid].name, count }), undo: () => setOt(before) });
  };
  const onRemoveTest = id => { const before = ot; setOt(removeMember(ot, id)); onNotify({ text: fmt(t('order.tests.removed', 'Removed {test}.'), { test: tName(id) }), undo: () => setOt(before) }); };

  const addByCodeField = (
    <TextInput id="add-by-code" ref={codeRef} labelText={t('order.tests.addByCode', 'Add by code')} placeholder={t('order.tests.addByCode.placeholder', 'Type or scan a test or panel code, then Enter')}
      value={code} onChange={e => setCode(e.target.value)} onKeyDown={addByCode}
      invalid={codeMsg && codeMsg.kind === 'error'} invalidText={codeMsg && codeMsg.text}
      helperText={codeMsg && codeMsg.kind !== 'error' ? codeMsg.text : undefined} />
  );
  if (folded) {
    return (
      <div style={S.row}>
        <div style={{ width: 360 }}>{addByCodeField}</div>
        <Button kind="tertiary" size="md" renderIcon={ChevronDown} onClick={onExpand}>{t('common.addTests', 'Add tests')}</Button>
      </div>
    );
  }
  if (lookupFailed) {
    // FR-K2: a failed lookup says so and offers Retry; empty is shown only after a request succeeded
    return <ActionableNotification inline kind="error" lowContrast title={t('order.tests.lookupFailed', 'Tests could not be loaded.')} subtitle={t('order.tests.lookupFailed.sub', 'Check the connection and try again.')} actionButtonLabel={t('common.retry', 'Retry')} onActionButtonClick={onRetry} hideCloseButton />;
  }
  const listBox = (kind, q, setQ, items, total, page, setPage, chips) => (
    <div style={{ marginBottom: 'var(--cds-spacing-06)' }}>
      <h3 className="cds--type-productive-heading-02" style={{ marginBottom: 'var(--cds-spacing-03)' }}>{kind === 'panels' ? t('order.tests.orderPanels', 'Order Panels') : t('order.tests.orderTests', 'Order Tests')}</h3>
      <Search size="md" labelText={kind === 'panels' ? t('order.tests.search.panels', 'Search panels by name or LOINC') : t('order.tests.search.tests', 'Search tests by name, code or LOINC')}
        placeholder={kind === 'panels' ? t('order.tests.search.panels', 'Search panels by name or LOINC') : t('order.tests.search.tests', 'Search tests by name, code or LOINC')}
        value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: 'var(--cds-spacing-03) 0' }}>{chips}</div>
      <div role="group" aria-label={kind} style={{ columns: 2, maxHeight: 280, overflowY: 'auto', border: '1px solid var(--cds-border-subtle-01)', padding: 'var(--cds-spacing-03)' }}>
        {items.map(it => {
          const checked = kind === 'panels' ? selPanels.includes(it.id) : ownTests.some(e => e.id === it.id);
          return (
            <Checkbox key={it.id} id={`${kind}-${it.id}`} checked={checked}
              labelText={<span>{it.name} <span style={S.muted}>{it.code}{kind === 'panels' ? ` · ${fmt(t('order.tests.memberCount', '{count} tests'), { count: it.members.length })}` : ` · ${it.st}`}</span></span>}
              onChange={(_, { checked: on }) => (kind === 'panels' ? (on ? setOt(addPanel(ot, it.id)) : onRemovePanel(it.id)) : (on ? setOt(addTest(ot, it.id)) : onRemoveTest(it.id)))} />
          );
        })}
      </div>
      <Pagination page={page} pageSize={PER_PAGE} pageSizes={[PER_PAGE]} totalItems={total} size="sm"
        pageRangeText={(_, n) => fmt(t('order.tests.pageOf', 'of {n} pages'), { n })}
        itemRangeText={(from, to, tot) => fmt(t('order.tests.paging', 'Showing {from} to {to} of {total}'), { from, to, total: tot })}
        onChange={({ page: p }) => setPage(p)} />
    </div>
  );
  return (
    <div>
      <Grid condensed style={{ paddingInline: 0 }}>
        <Column sm={4} md={4} lg={6}>{addByCodeField}</Column>
        <Column sm={4} md={2} lg={4}>
          <Select id="f-unit" labelText={t('order.tests.filter.labUnit', 'Lab unit')} value={unit} onChange={e => { setUnit(e.target.value); setPPage(1); setTPage(1); }}>
            <SelectItem value="" text={t('order.tests.filter.allLabUnits', 'All lab units')} />
            {UNITS.map(u => <SelectItem key={u} value={u} text={u} />)}
          </Select>
        </Column>
        <Column sm={4} md={2} lg={4}>
          <ComboBox id="f-st" titleText={t('common.sampleType', 'Sample type')} placeholder={t('order.tests.filter.anySampleType', 'Any sample type')} items={sampleTypes}
            selectedItem={stFilter} onChange={({ selectedItem }) => { setStFilter(selectedItem || null); setPPage(1); setTPage(1); }} />
        </Column>
        <Column sm={4} md={8} lg={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
          {ot.length > 0 && <Button kind="ghost" size="md" onClick={onFold}>{t('order.tests.done', 'Done adding')}</Button>}
        </Column>
      </Grid>
      <div style={{ marginTop: 'var(--cds-spacing-05)' }}>
        {listBox('panels', pq, setPq, pShown, pMatch.length, pPage, setPPage,
          selPanels.map(pid => { const pi = panelInfo(ot, pid); return <DismissibleTag key={pid} type="blue" text={pi.modified ? fmt(t('order.tests.panelChip', '{panel} {included}/{total}'), { panel: PANELS[pid].name, included: pi.on, total: pi.total }) : PANELS[pid].name} onClose={() => onRemovePanel(pid)} />; }))}
        {listBox('tests', tq, setTq, tShown, tMatch.length, tPage, setTPage,
          ownTests.map(e => <DismissibleTag key={e.id} type="gray" text={tName(e.id)} onClose={() => onRemoveTest(e.id)} />))}
      </div>
    </div>
  );
}

/* ============================== OrderedTestsTable (FR-B18 to FR-B21, FR-D5, FR-D6, FR-D8, FR-B28, FR-B29) ============================== */
// Shared on Enter Order and Prepare Samples. Grouped by panel, standalone tests after. Sample cell shows ACTUAL
// assignment as a solid badge and a PROPOSED one as an outlined badge (FR-B19). On Prepare Samples it is the picker.
const expectedText = x => `${x.n} × ${CONTAINERS[x.c].short}${x.min ? `, ${t('testCatalog.containers.min', 'min')} ${x.min}` : ''}`;
function testMatchesFilter(e, k, rows, received) {
  if (!k || k === 'tests' || k === 'samples' || k === 'stored') return true;
  const h = hostOf(e.id, rows);
  if (k === 'with') return !!h && !e.elsewhere.on;
  if (k === 'awaiting') return !h && !e.elsewhere.on && (received || rows.length > 0);
  if (k === 'notCollected') return !h && !received && !rows.length;
  if (k === 'referred') return !!h && h.referred.includes(e.id);
  if (k === 'elsewhere') return e.elsewhere.on;
  return true;
}

function OrderedTestsTable({ mode, ot, setOt, rows, setRows, cfg, received, filter, onClearFilter, onNotify, facility, loading }) {
  const [showCancelled, setShowCancelled] = useState(false);
  const [cancelFor, setCancelFor] = useState(null);   // { id } or { panel } awaiting a reason (saved items, FR-B21)
  const [cancelReason, setCancelReason] = useState('');
  const [deviation, setDeviation] = useState(null);   // { testId, num } incompatible assignment awaiting a choice (FR-D8)
  const upd = (id, patch) => setOt(ot.map(e => (e.id === id ? { ...e, ...patch } : e)));
  const prepare = mode === 'prepare';
  const cols = 6 + (cfg.billingRefNumber ? 1 : 0) + (cfg.notifications ? 1 : 0);

  const assign = (testId, num, force) => {
    const target = rows.find(r => r.num === num);
    if (!force && target && !isCompatible(testId, target)) { setDeviation({ testId, num }); return; }
    setRows(rows.map(r => ({ ...r, tests: r.num === num ? [...new Set([...r.tests, testId])] : r.tests.filter(x => x !== testId), pending: r.num === num && force ? [...r.pending, 'Non-conformity'] : r.pending })));
    upd(testId, { assignedByYou: true }); // FR-D6: marked until saved, never changed by automatic assignment
    setDeviation(null);
  };
  const removeRow = e => {
    if (e.saved) { setCancelFor({ id: e.id }); return; }
    const before = ot;
    setOt(removeMember(ot, e.id));
    onNotify({ text: fmt(t('order.tests.removed', 'Removed {test}.'), { test: tName(e.id) }), undo: () => setOt(before) });
  };
  const removePanelRow = pid => {
    if (ot.some(e => e.panels.includes(pid) && e.saved)) { setCancelFor({ panel: pid }); return; }
    const before = ot;
    const count = ot.filter(e => e.panels.includes(pid) && e.panels.length === 1 && !e.own).length;
    setOt(removePanel(ot, pid));
    onNotify({ text: fmt(t('order.tests.panelRemoved', 'Removed {panel} and {count} of its tests.'), { panel: PANELS[pid].name, count }), undo: () => setOt(before) });
  };
  const confirmCancel = () => {
    if (cancelFor.panel) setOt(ot.map(e => (e.panels.includes(cancelFor.panel) && e.panels.length === 1 && !e.own ? { ...e, cancelled: true, cancelReason } : e)));
    else upd(cancelFor.id, { cancelled: true, cancelReason, removed: { by: ME, at: NOW.slice(11, 16), reason: cancelReason } });
    setCancelFor(null); setCancelReason('');
  };

  const sampleCell = e => {
    if (e.cancelled) return <Tag size="sm" type="gray">{t('order.status.cancelled', 'Cancelled')}</Tag>;
    if (e.elsewhere.on) return <Tag size="sm" type="purple">{fmt(t('order.tests.testedElsewhereAt', 'Tested elsewhere: {lab}'), { lab: e.elsewhere.lab || t('order.tests.labNotSet', 'laboratory not set') })}</Tag>;
    const h = hostOf(e.id, rows);
    if (h && h.referred.includes(e.id)) return <span style={S.row}><SuffixBadge num={h.num} /><Tag size="sm" type="purple">{fmt(t('order.tests.referredTo', 'Referred to {lab}'), { lab: h.referTo.split(',')[0] })}</Tag></span>;
    if (prepare) {
      const live = usableSamples(rows);
      const comp = live.filter(r => isCompatible(e.id, r));
      if (!h && comp.length > 1) {
        return (
          <span id={`choose-${e.id}`}>
            <span style={{ ...S.muted, marginRight: 6 }}>{t('order.tests.chooseSample', 'Choose a sample')}</span>
            {comp.map(r => <Button key={r.num} kind="ghost" size="sm" onClick={() => assign(e.id, r.num)}>{suffixOf(r.num)}</Button>)}
          </span>
        );
      }
      return (
        <span style={S.row}>
          <Select id={`assign-${e.id}`} size="sm" hideLabel labelText={t('order.tests.col.sample', 'Sample')} value={h ? h.num : ''} onChange={ev => ev.target.value && assign(e.id, ev.target.value)}>
            <SelectItem value="" text={t('order.tests.awaiting', 'Awaiting sample')} />
            <SelectItemGroup label={t('order.tests.compatibleFirst', 'Compatible')}>{comp.map(r => <SelectItem key={r.num} value={r.num} text={`${suffixOf(r.num)} ${CONTAINERS[r.c].short}`} />)}</SelectItemGroup>
            <SelectItemGroup label={t('order.tests.otherSamples', 'Other samples')}>{live.filter(r => !comp.includes(r)).map(r => <SelectItem key={r.num} value={r.num} text={`${suffixOf(r.num)} ${CONTAINERS[r.c].short}`} />)}</SelectItemGroup>
          </Select>
          {h && h.proposed && !h.saved && <SuffixBadge num={h.num} proposed />}
          {e.assignedByYou && <Tag size="sm" type="cool-gray">{t('order.tests.assignedByYou', 'Assigned by you')}</Tag>}
        </span>
      );
    }
    if (h) return <SuffixBadge num={h.num} proposed={h.proposed && !h.saved} />;
    if (!received && !rows.length) return <span style={S.muted}>{t('order.tests.notCollected', 'Not yet collected')}</span>;
    return <Tag size="sm" type="purple">{t('order.tests.awaiting', 'Awaiting sample')}</Tag>;
  };

  const testRow = (e, inPanel) => {
    const x = TESTS[e.id];
    const struck = e.cancelled;
    if (struck && !e.removed && !showCancelled) return null;
    return (
      <React.Fragment key={`${inPanel || 'solo'}-${e.id}`}>
        <TableRow>
          <TableCell style={{ paddingLeft: inPanel ? 'var(--cds-spacing-07)' : undefined }}>
            {e.removed ? (
              <span style={S.strike}>{fmt(t('order.tests.memberRemoved', '{test}, removed by {user} {time}'), { test: tShort(e.id), user: e.removed.by, time: e.removed.at })}</span>
            ) : (
              <span style={struck ? S.strike : undefined}>{x.name} <span style={S.muted}>{x.code}</span>{e.own && e.panels.length > 0 && <Tag size="sm" type="gray">{t('order.tests.alsoOwn', 'Also ordered on its own')}</Tag>}</span>
            )}
          </TableCell>
          <TableCell>{x.st}</TableCell>
          <TableCell>
            {x.ct.length ? (
              <span>{expectedText(x.ct[0])}{x.ct.length > 1 && <span style={S.muted}>{` ${t('common.or', 'or')} ${x.ct.slice(1).map(c => CONTAINERS[c.c].short).join(', ')}`}</span>}</span>
            ) : <span style={S.muted}>{t('order.tests.noContainer', 'No container set in the test catalog')}</span>}
          </TableCell>
          <TableCell>{sampleCell(e)}</TableCell>
          <TableCell>
            <Checkbox id={`else-${e.id}`} labelText={t('order.tests.col.testedElsewhere', 'Tested elsewhere')} hideLabel disabled={struck} checked={e.elsewhere.on}
              title={t('order.tests.testedElsewhere.help', 'Result reported by another laboratory')}
              onChange={(_, { checked }) => upd(e.id, { elsewhere: { ...e.elsewhere, on: checked, lab: e.elsewhere.lab || (facility ? `${facility.name} laboratory` : '') } })} />
          </TableCell>
          {cfg.billingRefNumber && (
            <TableCell>
              {/* FR-B28: manual for now; read-only once a billing system sets it */}
              <Toggle id={`paid-${e.id}`} size="sm" labelText={t('order.billing.paid', 'Paid')} hideLabel labelA="" labelB="" toggled={e.paid} onToggle={v => upd(e.id, { paid: v })} />
            </TableCell>
          )}
          {cfg.notifications && (
            <TableCell>
              <Checkbox id={`np-${e.id}`} labelText={`${t('order.notify.patient', 'Notify patient')} (${t('order.notify.sms', 'SMS')})`} checked={e.notify.patient} onChange={(_, { checked }) => upd(e.id, { notify: { ...e.notify, patient: checked } })} />
              <Checkbox id={`nv-${e.id}`} labelText={`${t('order.notify.provider', 'Notify provider')} (${t('order.notify.email', 'Email')})`} checked={e.notify.provider} onChange={(_, { checked }) => upd(e.id, { notify: { ...e.notify, provider: checked } })} />
            </TableCell>
          )}
          <TableCell>
            {!struck && <IconButton kind="ghost" size="sm" label={e.saved ? t('order.tests.cancelTest', 'Cancel test') : t('common.remove', 'Remove')} onClick={() => removeRow(e)}><TrashCan /></IconButton>}
          </TableCell>
        </TableRow>
        {e.elsewhere.on && !struck && (
          <TableRow>
            <TableCell colSpan={cols}>
              <div style={{ ...S.row, ...S.panelBox }}>
                <ComboBox id={`else-lab-${e.id}`} titleText={t('order.tests.performingLab', 'Performing laboratory')} items={[...FACILITIES.map(f => `${f.name} laboratory`), ...REF_LABS]} selectedItem={e.elsewhere.lab || null}
                  onChange={({ selectedItem }) => upd(e.id, { elsewhere: { ...e.elsewhere, lab: selectedItem || '' } })} style={{ minWidth: 320 }} />
                <TextInput id={`else-val-${e.id}`} labelText={t('order.tests.reportedValue', 'Reported value')} value={e.elsewhere.value} onChange={ev => upd(e.id, { elsewhere: { ...e.elsewhere, value: ev.target.value } })} />
                <span style={S.muted}>{t('order.tests.testedElsewhere.help', 'Result reported by another laboratory')}</span>
              </div>
            </TableCell>
          </TableRow>
        )}
        {deviation && deviation.testId === e.id && (
          <TableRow>
            <TableCell colSpan={cols}>
              <InlineNotification kind="warning" lowContrast hideCloseButton
                title={fmt(t('order.prepare.incompatible', '{test} expects {expected}. This is {actual}.'), { test: tShort(e.id), expected: CONTAINERS[x.ct[0].c].short, actual: CONTAINERS[rows.find(r => r.num === deviation.num).c].short })} />
              <Button kind="secondary" size="sm" onClick={() => setDeviation(null)}>{t('common.cancel', 'Cancel')}</Button>
              <Button kind="primary" size="sm" onClick={() => assign(e.id, deviation.num, true)}>{t('order.prepare.recordDeviation', 'Assign and record deviation')}</Button>
            </TableCell>
          </TableRow>
        )}
        {cancelFor && cancelFor.id === e.id && cancelRow}
      </React.Fragment>
    );
  };
  const cancelRow = (
    <TableRow>
      <TableCell colSpan={cols}>
        <div style={{ ...S.row, ...S.panelBox }}>
          <Select id="cancel-reason" labelText={reqLabel(t('order.tests.cancel.reason', 'Reason for cancelling this test'), true)} required value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
            <SelectItem value="" text={t('common.choose', 'Choose')} />
            {CANCEL_REASONS.map(r => <SelectItem key={r} value={r} text={r} />)}
          </Select>
          <TextInput id="cancel-other" labelText={t('order.tests.cancel.other', 'Other reason')} onChange={e => setCancelReason(e.target.value)} />
          <Button size="md" kind="danger" disabled={!cancelReason} onClick={confirmCancel}>{t('common.confirm', 'Confirm')}</Button>
          <Button size="md" kind="ghost" onClick={() => setCancelFor(null)}>{t('common.cancel', 'Cancel')}</Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const visible = ot.filter(e => testMatchesFilter(e, filter, rows, received));
  const standalone = visible.filter(e => !e.panels.length);
  const panelIds = panelsOf(ot).filter(pid => visible.some(e => e.panels.includes(pid)));
  const headers = [
    t('common.tests', 'Tests'), t('common.sampleType', 'Sample type'), t('order.tests.col.expected', 'Expected container'), t('order.tests.col.sample', 'Sample'),
    t('order.tests.col.testedElsewhere', 'Tested elsewhere'), ...(cfg.billingRefNumber ? [t('order.tests.col.paid', 'Paid')] : []), ...(cfg.notifications ? [t('order.notify.heading', 'Notify')] : []), '',
  ];
  // FR-J1: skeleton rows while the order loads
  if (loading) return <TableContainer title={t('order.tests.table.heading', 'Ordered tests')}><SkeletonText paragraph lineCount={5} /></TableContainer>;
  if (!ot.length) return <p style={S.muted}>{t('order.tests.empty', 'No tests yet. Add tests or type a code above.')}</p>;
  return (
    <TableContainer id="ordered-tests" title={t('order.tests.table.heading', 'Ordered tests')}
      description={filter ? <span>{fmt(t('order.tests.filtered', 'Showing {shown} of {total}'), { shown: visible.length, total: ot.length })} <Link href="#" onClick={ev => { ev.preventDefault(); onClearFilter(); }}>{t('common.clearFilter', 'Clear filter')}</Link></span> : undefined}>
      <TableToolbar>
        <TableToolbarContent>
          <Toggle id="ot-show-cancelled" size="sm" labelText={t('common.showCancelled', 'Show cancelled')} labelA="" labelB="" toggled={showCancelled} onToggle={setShowCancelled} />
        </TableToolbarContent>
      </TableToolbar>
      <Table size="xs" useZebraStyles={false}>
        <TableHead><TableRow>{headers.map((h, i) => <TableHeader key={i}>{h}</TableHeader>)}</TableRow></TableHead>
        <TableBody>
          {panelIds.map(pid => {
            const pi = panelInfo(ot, pid);
            return (
              <React.Fragment key={pid}>
                <TableRow style={pi.modified ? { background: 'var(--cds-layer-accent-01)' } : undefined}>
                  <TableCell colSpan={cols - 1}>
                    <strong>{fmt(t('order.tests.panelCount', '{panel}, {included} of {total} tests'), { panel: PANELS[pid].name, included: pi.on, total: pi.total })}</strong>
                    {' '}<Tag size="sm" type="blue">{PANELS[pid].code}</Tag>
                    {pi.modified && <Tag size="sm" type="warm-gray">{t('order.tests.panelModified', 'Modified')}</Tag>}
                  </TableCell>
                  <TableCell><IconButton kind="ghost" size="sm" label={t('order.tests.removePanel', 'Remove panel')} onClick={() => removePanelRow(pid)}><TrashCan /></IconButton></TableCell>
                </TableRow>
                {cancelFor && cancelFor.panel === pid && cancelRow}
                {visible.filter(e => e.panels.includes(pid)).map(e => testRow(e, pid))}
              </React.Fragment>
            );
          })}
          {standalone.map(e => testRow(e, null))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/* ============================== Per-sample inline panels (FR-E1 to FR-E5, FR-C3, FR-C7, FR-D10) ============================== */
// All panels open inline under the row (or under the toolbar for several samples). Data returns to the page and is
// saved with the step's Save, shown as "Pending save" until then (FR-E5). No panel saves on its own.
const numsText = nums => nums.map(suffixOf).join(', ');
function PanelShell({ title, nums, children, onApply, applyLabel, applyDisabled, onCancel }) {
  return (
    <div style={S.panelBox}>
      <Stack gap={4}>
        <div>
          <strong>{title}</strong>
          {nums && <div style={S.muted}>{fmt(t('order.samples.applyTo', 'Apply to these samples: {samples}'), { samples: numsText(nums) })}</div>}
        </div>
        {children}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" kind="primary" disabled={applyDisabled} onClick={onApply}>{applyLabel || t('common.apply', 'Apply')}</Button>
          <Button size="sm" kind="ghost" onClick={onCancel}>{t('common.cancel', 'Cancel')}</Button>
        </div>
      </Stack>
    </div>
  );
}

// Collector picker (FR-C3): a user picker, free text, or "Collected elsewhere, collector unknown". Never defaults to the signed-in user; "Me" fills it deliberately.
function CollectionFields({ value, onChange, idPrefix }) {
  const elsewhereText = t('order.samples.collectedElsewhere', 'Collected elsewhere, collector unknown');
  return (
    <div style={S.row}>
      <DatePicker datePickerType="single" dateFormat="d/m/Y" value={value.at ? value.at.slice(0, 10) : undefined} onChange={([d]) => d && onChange({ ...value, at: `${d.toISOString().slice(0, 10)}T${(value.at || NOW).slice(11, 16)}`, defaulted: false })}>
        <DatePickerInput id={`${idPrefix}-date`} labelText={reqLabel(t('order.samples.collectionDate', 'Collection date'), true)} placeholder={t('common.datePlaceholder', 'dd/mm/yyyy')} />
      </DatePicker>
      <TimePicker id={`${idPrefix}-time`} labelText={reqLabel(t('order.samples.collectionTime', 'Collection time'), true)} value={value.at ? value.at.slice(11, 16) : ''}
        onChange={e => onChange({ ...value, at: `${(value.at || NOW).slice(0, 10)}T${e.target.value}`, defaulted: false })} />
      <ComboBox id={`${idPrefix}-by`} titleText={reqLabel(t('order.samples.collector', 'Collector'), true)} items={[...USERS, elsewhereText]} allowCustomValue
        selectedItem={value.elsewhere ? elsewhereText : value.by || null} style={{ minWidth: 260 }}
        onChange={({ selectedItem }) => onChange({ ...value, by: selectedItem === elsewhereText ? '' : selectedItem || '', elsewhere: selectedItem === elsewhereText })} />
      <Button kind="ghost" size="md" onClick={() => onChange({ ...value, by: ME, elsewhere: false })}>{t('order.samples.me', 'Me')}</Button>
    </div>
  );
}

function ReferPanel({ nums, rows, onApply, onCancel, onAliquotFirst, mode }) {
  const [lab, setLab] = useState(REF_LABS[0]);
  const [reason, setReason] = useState('');
  const [picked, setPicked] = useState(() => Object.fromEntries(nums.map(n => [n, [...(rows.find(r => r.num === n) || { tests: [] }).tests]])));
  const partial = nums.filter(n => { const r = rows.find(x => x.num === n); return r && picked[n].length && picked[n].length < r.tests.length; });
  return (
    <Fence owner="Clinical referral form" name={t('mockup.fence.referral', 'Referral form, return-to-page mode')} note={t('mockup.fence.referralNote', 'This FRS adds only the multi-sample list, per-sample tests, Aliquot first and the existing-referral notice.')}>
      <PanelShell title={t('order.referral.title', 'Refer out')} nums={nums} onCancel={onCancel} applyDisabled={!lab || !reason}
        onApply={() => onApply({ lab, reason, picked })}>
        <div style={S.row}>
          <ComboBox id="ref-lab" titleText={reqLabel(t('common.referenceLab', 'Reference lab'), true)} items={REF_LABS} selectedItem={lab} onChange={({ selectedItem }) => setLab(selectedItem)} style={{ minWidth: 420 }} />
          <Select id="ref-reason" labelText={reqLabel(t('order.referral.reason', 'Reason for referral'), true)} value={reason} onChange={e => setReason(e.target.value)}>
            <SelectItem value="" text={t('common.choose', 'Choose')} />
            {REFERRAL_REASONS.map(r => <SelectItem key={r} value={r} text={r} />)}
          </Select>
        </div>
        <fieldset>
          <legend className="cds--label">{t('order.referral.testsToRefer', 'Tests to refer')}</legend>
          {nums.map(n => {
            const r = rows.find(x => x.num === n);
            return (
              <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <SuffixBadge num={n} />
                {r.tests.map(id => (
                  <Checkbox key={id} id={`ref-${n}-${id}`} labelText={tShort(id)} checked={picked[n].includes(id)}
                    onChange={(_, { checked }) => setPicked({ ...picked, [n]: checked ? [...picked[n], id] : picked[n].filter(x => x !== id) })} />
                ))}
                {/* FR-E3a: a test with an open referral shows the notice; saving another changes nothing */}
                {r.referred.length > 0 && <Tag size="sm" type="purple">{fmt(t('order.referral.existing', 'Already referred to {lab} on {date}'), { lab: r.referTo.split(',')[0], date: '25/09/2026' })}</Tag>}
              </div>
            );
          })}
        </fieldset>
        {partial.length > 0 && (
          <ActionableNotification inline kind="warning" lowContrast hideCloseButton title={t('order.referral.partial', 'Tests not referred stay here, but this tube leaves the laboratory.')}
            actionButtonLabel={t('order.referral.aliquotFirst', 'Aliquot first')} onActionButtonClick={() => onAliquotFirst(partial[0])}
            subtitle={mode === 'enter' ? t('order.referral.aliquotFirst.enter', 'Aliquot first saves this step and opens Prepare Samples with Aliquot open on the sample.') : undefined} />
        )}
        <p style={S.muted}>{t('order.referral.dispatchLater', 'Dispatch the shipment after saving, from Sample Shipment.')}</p>
      </PanelShell>
    </Fence>
  );
}

function NcePanel({ nums, rows, prefill, onApply, onCancel }) {
  const [reason, setReason] = useState(prefill || '');
  const [outcome, setOutcome] = useState('flag');
  const [notes, setNotes] = useState('');
  return (
    <Fence owner="NCE module" name={t('mockup.fence.nce', 'Inline non-conformity form, return-to-page mode')}>
      <PanelShell title={t('order.nce.title', 'Report non-conformity')} nums={nums} onCancel={onCancel} applyDisabled={!reason} onApply={() => onApply({ reason, outcome, notes })}>
        <p style={S.muted}>{fmt(t('order.nce.prefilled', 'Prefilled with order {labNo} and tests: {tests}'), { labNo: LAB, tests: groupNames([...new Set(nums.flatMap(n => (rows.find(r => r.num === n) || { tests: [] }).tests))], []) })}</p>
        <Select id="nce-reason" labelText={reqLabel(t('order.nce.reason', 'Non-conformity'), true)} value={reason} onChange={e => setReason(e.target.value)}>
          <SelectItem value="" text={t('common.choose', 'Choose')} />
          {[...NC_REASONS, t('order.prepare.holdingTime.exceeded', 'Holding time exceeded')].map(r => <SelectItem key={r} value={r} text={r} />)}
        </Select>
        <RadioButtonGroup legendText={t('order.nce.outcome', 'Outcome')} name="nce-outcome" valueSelected={outcome} onChange={setOutcome}>
          <RadioButton id="nce-o1" value="flag" labelText={t('order.nce.continueFlag', 'Continue with a flag')} />
          <RadioButton id="nce-o2" value="reject" labelText={t('order.nce.reject', 'Reject the sample')} />
          <RadioButton id="nce-o3" value="resample" labelText={t('order.nce.rejectResample', 'Reject and request a new sample')} />
        </RadioButtonGroup>
        <TextArea id="nce-notes" labelText={t('common.notes', 'Notes')} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      </PanelShell>
    </Fence>
  );
}

function StoragePanel({ nums, rows, onApply, onCancel }) {
  const [loc, setLoc] = useState(STORAGE_LOCATIONS[0]);
  const positions = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2'];
  const locked = nums.some(n => (rows.find(r => r.num === n) || { tests: [] }).tests.includes('HBA1C')); // mock: HbA1c has storage locked (Override Restricted)
  return (
    <Fence owner="OGC-657" name={t('mockup.fence.storage', 'Storage location picker, return-to-page mode')}>
      <PanelShell title={t('order.samples.store', 'Store')} nums={nums} onCancel={onCancel} onApply={() => onApply(Object.fromEntries(nums.map((n, i) => [n, `${loc} > ${positions[i]}`])))}>
        <ComboBox id="store-loc" titleText={reqLabel(t('common.storageLocation', 'Storage location'), true)} items={STORAGE_LOCATIONS} selectedItem={loc} onChange={({ selectedItem }) => setLoc(selectedItem)} style={{ maxWidth: 520 }} />
        {locked && <InlineNotification kind="info" lowContrast hideCloseButton title={t('order.storage.locked', 'Storage condition is set by HbA1c in the test catalog: 2 to 8 °C. Only matching locations are offered.')} />}
        {/* FR-E1: consecutive free positions in the chosen box or rack, shown for confirmation */}
        <div>{nums.map((n, i) => <div key={n}><SuffixBadge num={n} />{` ${t('order.storage.position', 'Position')} ${positions[i]}`}</div>)}</div>
      </PanelShell>
    </Fence>
  );
}

function AliquotPanel({ row, onApply, onCancel }) {
  const [count, setCount] = useState(1);
  const [items, setItems] = useState([{ qty: '1.0', unit: 'mL', st: row.st === 'Whole blood' ? 'Plasma' : row.st }]);
  const total = items.reduce((s, x) => s + (parseFloat(x.qty) || 0), 0);
  const remaining = parseFloat(row.qty) || 0;
  const over = total > remaining;
  const setN = n => { setCount(n); setItems(Array.from({ length: n }, (_, i) => items[i] || { qty: '1.0', unit: 'mL', st: items[0].st })); };
  return (
    <PanelShell title={t('common.createAliquot', 'Create aliquot')} onCancel={onCancel} applyDisabled={over} onApply={() => onApply(items)}>
      <NumberInput id="aliq-n" label={t('order.prepare.aliquot.count', 'Number of aliquots')} min={1} max={6} value={count} onChange={(_, { value }) => setN(Number(value) || 1)} style={{ maxWidth: 160 }} />
      {items.map((x, i) => (
        <div key={i} style={S.row}>
          <SuffixBadge num={`${row.num}.${i + 1}`} />
          <TextInput id={`aliq-q-${i}`} labelText={t('common.quantity', 'Quantity')} value={x.qty} onChange={e => setItems(items.map((y, j) => (j === i ? { ...y, qty: e.target.value } : y)))} />
          <Select id={`aliq-u-${i}`} labelText={t('common.unit', 'Unit')} value={x.unit} onChange={e => setItems(items.map((y, j) => (j === i ? { ...y, unit: e.target.value } : y)))}>
            {['mL', 'µL'].map(u => <SelectItem key={u} value={u} text={u} />)}
          </Select>
          <Select id={`aliq-st-${i}`} labelText={t('common.sampleType', 'Sample type')} value={x.st} onChange={e => setItems(items.map((y, j) => (j === i ? { ...y, st: e.target.value } : y)))}>
            {CONTAINERS[row.c].yields.map(s => <SelectItem key={s} value={s} text={s} />)}
          </Select>
        </div>
      ))}
      {over && <InlineNotification kind="error" lowContrast hideCloseButton title={fmt(t('order.prepare.aliquot.overdrawn', 'Aliquots total {total}, more than the {remaining} left in {sample}.'), { total: `${total} mL`, remaining: `${remaining} mL`, sample: suffixOf(row.num) })} />}
    </PanelShell>
  );
}

function CollectionEditPanel({ row, onApply, onCancel }) {
  const [v, setV] = useState(row.coll);
  return <PanelShell title={t('common.collected', 'Collected')} onCancel={onCancel} onApply={() => onApply(v)}><CollectionFields value={v} onChange={setV} idPrefix={`ce-${row.num}`} /></PanelShell>;
}
// FR-C7: a saved sample is voided with a reason, never deleted; it stays visible, struck through, under Show voided
function VoidPanel({ row, onApply, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <PanelShell title={t('order.samples.void', 'Void')} applyLabel={t('common.confirm', 'Confirm')} applyDisabled={!reason} onCancel={onCancel} onApply={() => onApply(reason)}>
      <TextInput id={`void-${row.num}`} labelText={reqLabel(t('order.samples.void.reason', 'Reason for voiding'), true)} required value={reason} onChange={e => setReason(e.target.value)} />
    </PanelShell>
  );
}

// FR-C9: optional detail only. Required data never lives here (principle 2).
function SampleDetails({ row, upd, cfg }) {
  if (row.parent) {
    return (
      <div style={S.row}>
        <TextInput id={`d-q-${row.num}`} labelText={t('common.quantity', 'Quantity')} value={row.qty} onChange={e => upd({ qty: e.target.value })} />
        <TextInput id={`d-u-${row.num}`} labelText={t('common.unit', 'Unit')} value={row.unit} onChange={e => upd({ unit: e.target.value })} />
        <TextInput id={`d-st-${row.num}`} labelText={t('common.sampleType', 'Sample type')} value={row.st} readOnly />
      </div>
    );
  }
  return (
    <Grid condensed style={{ paddingInline: 0 }}>
      <Column sm={2} md={2} lg={3}><TextInput id={`d-q-${row.num}`} labelText={t('common.quantity', 'Quantity')} value={row.qty} onChange={e => upd({ qty: e.target.value })} /></Column>
      <Column sm={2} md={2} lg={2}><TextInput id={`d-u-${row.num}`} labelText={t('common.unit', 'Unit')} value={row.unit} onChange={e => upd({ unit: e.target.value })} /></Column>
      <Column sm={4} md={4} lg={4}>
        <Select id={`d-m-${row.num}`} labelText={t('order.samples.collectionMethod', 'Collection method')} value={row.method || ''} onChange={e => upd({ method: e.target.value })}>
          <SelectItem value="" text={t('common.choose', 'Choose')} />
          {COLLECTION_METHODS.map(m => <SelectItem key={m} value={m} text={m} />)}
        </Select>
      </Column>
      <Column sm={4} md={4} lg={3}><TextInput id={`d-o-${row.num}`} labelText={t('order.samples.origin', 'Specimen origin')} value={row.origin || ''} onChange={e => upd({ origin: e.target.value })} /></Column>
      <Column sm={2} md={2} lg={2}><TextInput id={`d-t-${row.num}`} labelText={t('order.samples.temperature', 'Sample temperature')} value={row.temp || ''} onChange={e => upd({ temp: e.target.value })} /></Column>
      <Column sm={4} md={4} lg={4}><TextInput id={`d-c-${row.num}`} labelText={t('order.samples.conditions', 'Collection conditions')} value={row.cond || ''} onChange={e => upd({ cond: e.target.value })} /></Column>
      {cfg.gpsCoordinatesEnabled && <Column sm={4} md={4} lg={4}><TextInput id={`d-g-${row.num}`} labelText={t('order.samples.gps', 'GPS coordinates')} helperText={t('order.samples.gps.help', 'Accuracy 20 m or better, timeout 30 s')} value={row.gps || ''} onChange={e => upd({ gps: e.target.value })} /></Column>}
      <Column sm={4} md={4} lg={4}><Checkbox id={`d-l-${row.num}`} labelText={t('order.samples.labSampling', 'Lab performed sampling')} checked={!row.coll.elsewhere} disabled /></Column>
      <Column sm={4} md={8} lg={12}><TextArea id={`d-n-${row.num}`} labelText={t('common.notes', 'Notes')} rows={2} value={row.notes || ''} onChange={e => upd({ notes: e.target.value })} /></Column>
    </Grid>
  );
}

/* ============================== SamplesTable (FR-C1 to FR-C11, FR-D3, FR-D4, FR-D10, FR-E1 to FR-E5) ============================== */
// One component for Enter Order and Prepare Samples; Prepare adds only Aliquot and the assignment behaviour (FR-C1).
// Every column shown is on the row (FR-C2). Compact rows, no zebra, colour only for exceptions (FR-C11).
function holdingTag(row, receivedAt) {
  const holds = row.tests.map(id => (TESTS[id] || {}).hold).filter(Boolean);
  if (!holds.length || row.parent) return null;
  const from = row.coll.at || receivedAt;
  const limit = Math.min(...holds) * 60;
  const left = limit - minutesBetween(from, NOW);
  const tip = row.coll.at ? undefined : t('order.prepare.holdingTime.fromReceipt', 'Counted from receipt (collection time unknown)');
  if (left < 0) return { text: t('order.prepare.holdingTime.exceeded', 'Holding time exceeded'), kind: 'red', icon: Time, tip, exceeded: true };
  if (left <= limit * 0.2) return { text: fmt(t('order.prepare.holdingTime.left', '{time} left'), { time: fmtDuration(left) }), kind: 'warm-gray', icon: WarningAlt, tip };
  return { text: fmt(t('order.prepare.holdingTime.left', '{time} left'), { time: fmtDuration(left) }), kind: 'gray', icon: Time, tip };
}
const storageShort = p => { const parts = p.split(' > '); return parts.length > 3 ? `... > ${parts.slice(-3).join(' > ')}` : p; };

function SamplesTable({ mode, rows, setRows, ot, cfg, labNo = LAB, receivedAt = RECEIVED_AT, filter, onNotify, onAliquotFirst, canRefer = true, requireCollection, initialPanel, loading }) {
  const [sel, setSel] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [panel, setPanel] = useState(initialPanel || null); // { type, nums, at } at = row num the panel sits under, or 'toolbar'
  const [showVoided, setShowVoided] = useState(false);
  const [addC, setAddC] = useState(null);
  const [addN, setAddN] = useState(1);
  const [scan, setScan] = useState('');
  const [fillAll, setFillAll] = useState(null);
  const prepare = mode === 'prepare';
  const upd = (num, patch) => setRows(rows.map(r => (r.num === num ? { ...r, ...patch, edited: r.proposed && !r.saved && ('c' in patch || 'st' in patch) ? true : r.edited } : r)));
  const live = liveSamples(rows);
  const siteCol = live.some(r => bodySiteMode(r.st) !== 'Not used');
  const ordered = [...rows.filter(r => !r.parent).sort((a, b) => a.pos - b.pos)].flatMap(p => [p, ...rows.filter(a => a.parent === p.num)]);
  const shownRows = ordered.filter(r => (showVoided || !r.voided) && (!filter || filter !== 'stored' || r.storage));
  const cols = 9 + (siteCol ? 1 : 0);

  const openPanel = (type, nums, at) => setPanel({ type, nums, at });
  const toolbarAction = type => openPanel(type, sel.length ? sel : live.map(r => r.num), 'toolbar'); // FR-C8: nothing selected = all preselected, listed to confirm
  const print = nums => {
    const unsaved = nums.filter(n => !(rows.find(r => r.num === n) || {}).saved);
    if (unsaved.length) { setRows(rows.map(r => (unsaved.includes(r.num) ? { ...r, pending: [...new Set([...r.pending, 'Prints after save'])] } : r))); onNotify({ text: t('order.label.afterSave', 'Prints after save') }); }
    else onNotify({ text: fmt(t('order.label.printing', 'Label file opened for {samples}.'), { samples: numsText(nums) }) });
  };
  const remove = r => {
    if (r.saved) { openPanel('void', [r.num], r.num); return; }
    const before = rows;
    setRows(rows.filter(x => x.num !== r.num && x.parent !== r.num)); // tests on it return to Awaiting sample (FR-C7)
    onNotify({ text: fmt(t('order.samples.removedOne', 'Removed {sample}.'), { sample: suffixOf(r.num) }), undo: () => setRows(before) });
  };
  const applyRefer = ({ lab, picked }) => { setRows(rows.map(r => (picked[r.num] && picked[r.num].length ? { ...r, referred: picked[r.num], referTo: lab, status: [...new Set([...r.status, 'Referred'])], pending: [...new Set([...r.pending, 'Pending save'])] } : r))); setPanel(null); };
  const applyNce = ({ outcome }) => { setRows(rows.map(r => (panel.nums.includes(r.num) ? { ...r, status: [...new Set([...r.status, outcome === 'flag' ? 'Non-conformity' : 'Rejected'])] } : r))); setPanel(null); };
  const applyStore = map => { setRows(rows.map(r => (map[r.num] ? { ...r, storage: map[r.num], pending: [...new Set([...r.pending, 'Pending save'])] } : r))); setPanel(null); };
  const applyAliquots = (parent, items) => {
    const used = items.reduce((s, x) => s + (parseFloat(x.qty) || 0), 0);
    const existing = rows.filter(r => r.parent === parent.num).length;
    const kids = items.map((x, i) => mkSample({ labNo, parent: parent.num, pos: existing + i + 1, c: parent.c, st: x.st, qty: x.qty, unit: x.unit, status: ['Aliquot'] }));
    setRows([...rows.map(r => (r.num === parent.num ? { ...r, qty: String((parseFloat(r.qty) || 0) - used) } : r)), ...kids]);
    setPanel(null);
  };
  const addSamples = () => {
    if (!addC) return;
    const start = rows.filter(r => !r.parent).reduce((m, r) => Math.max(m, r.pos), 0); // suffixes never reused, including voided (FR-C4)
    const add = Array.from({ length: addN }, (_, i) => mkSample({ labNo, pos: start + i + 1, c: addC, st: CONTAINERS[addC].yields[0], edited: true }));
    setRows([...rows, ...add]); setAddC(null); setAddN(1);
  };
  const onScan = e => { if (e.key !== 'Enter') return; const v = scan.trim().toUpperCase().replace(/\.(\d+)$/, '-$1'); const hit = rows.find(r => r.num === v); if (hit) setSel([hit.num]); setScan(''); };

  const collectedCell = r => {
    if (r.parent) return <span style={S.muted}>{t('order.samples.fromParent', 'From parent')}</span>;
    const c = r.coll;
    const missing = !c.at || (!c.by && !c.elsewhere);
    const after = c.at && minutesBetween(receivedAt, c.at) > 0;
    return (
      <span id={`coll-${r.num}`}>
        {c.at || c.by || c.elsewhere ? (
          <span>
            {c.at ? fmtDT(c.at) : <span style={{ color: 'var(--cds-text-error)' }}>{t('order.samples.noTime', 'No time')}</span>}
            {', '}
            {c.elsewhere ? t('order.samples.collectedElsewhere', 'Collected elsewhere, collector unknown') : c.by || <span style={{ color: 'var(--cds-text-error)' }}>{t('order.samples.noCollector', 'No collector')}</span>}
          </span>
        ) : (
          <span style={requireCollection ? { color: 'var(--cds-text-error)' } : S.muted}>{t('order.samples.notRecorded', 'Not recorded')}</span>
        )}
        <IconButton kind="ghost" size="sm" label={t('order.samples.editCollection', 'Edit collection')} onClick={() => openPanel('coll', [r.num], r.num)}><Edit /></IconButton>
        {c.defaulted && (
          <span style={{ display: 'inline-flex', gap: 4 }}>
            <Tag size="sm" type="blue">{t('order.samples.defaulted', 'Defaulted, confirm')}</Tag>
            <Button kind="ghost" size="sm" onClick={() => upd(r.num, { coll: { ...c, defaulted: false } })}>{t('common.confirm', 'Confirm')}</Button>
          </span>
        )}
        {after && (
          <span style={{ display: 'block' }}>
            <WarningAlt size={16} style={{ fill: 'var(--cds-support-warning)', verticalAlign: 'middle' }} aria-hidden="true" />{' '}{t('order.prepare.afterReceipt', 'Collection time is after receipt.')}
            <Checkbox id={`after-${r.num}`} labelText={t('order.prepare.afterReceipt.confirm', 'Confirm: collection time is after receipt')} checked={c.afterReceiptOk} onChange={(_, { checked }) => upd(r.num, { coll: { ...c, afterReceiptOk: checked } })} />
          </span>
        )}
        {missing && requireCollection && <span className="cds--visually-hidden">{t('common.required', 'Required')}</span>}
      </span>
    );
  };
  const siteCell = r => {
    const mode2 = bodySiteMode(r.st);
    if (mode2 === 'Not used' || r.parent) return null;
    const lock = r.tests.map(id => TESTS[id]).find(x => x && x.site && x.siteLock);
    if (lock) return <span><Locked size={16} aria-hidden="true" /> {siteById(lock.site).name} <span style={S.muted}>{fmt(t('order.prepare.siteLockedBy', 'Set by {test}'), { test: lock.name })}</span></span>;
    const site = siteById(r.site);
    return (
      <span id={`site-${r.num}`} style={{ display: 'inline-flex', gap: 4, alignItems: 'flex-end' }}>
        <Select id={`site-sel-${r.num}`} size="sm" hideLabel labelText={t('order.samples.col.bodySite', 'Body site')} required={mode2 === 'Required'} invalid={mode2 === 'Required' && !r.site && requireCollection}
          value={r.site} onChange={e => upd(r.num, { site: e.target.value, side: '' })}>
          <SelectItem value="" text={mode2 === 'Required' ? t('order.prepare.bodySite.choose', 'Choose a site') : t('common.none', 'None')} />
          {SAMPLE_TYPE_SETTINGS[r.st].allowed.map(id => <SelectItem key={id} value={id} text={siteById(id).name} />)}
        </Select>
        {site && site.side && (
          <Select id={`side-${r.num}`} size="sm" hideLabel labelText={t('order.prepare.side', 'Side')} value={r.side} onChange={e => upd(r.num, { side: e.target.value })}>
            <SelectItem value="" text={t('order.prepare.side', 'Side')} />
            <SelectItem value="Left" text={t('order.prepare.side.left', 'Left')} />
            <SelectItem value="Right" text={t('order.prepare.side.right', 'Right')} />
            <SelectItem value="Bilateral" text={t('order.prepare.side.bilateral', 'Bilateral')} />
          </Select>
        )}
        {r.site === 'other' && <TextInput id={`site-o-${r.num}`} size="sm" hideLabel labelText={t('order.prepare.bodySite.other', 'Other site')} placeholder={t('order.prepare.bodySite.other', 'Other site')} maxLength={40} value={r.siteOther} onChange={e => upd(r.num, { siteOther: e.target.value })} />}
      </span>
    );
  };
  const statusFor = r => {
    const tags = [];
    if (!r.saved && r.proposed && !r.edited) tags.push({ text: t('order.tests.proposed', 'Proposed'), kind: 'blue', tip: fmt(t('order.samples.proposedFor', 'Proposed for {tests}'), { tests: groupNames(r.proposedFor, ot) }) });
    else if (!r.saved) tags.push('Pending save');
    if (r.edited && !r.saved) tags.push('Edited');
    r.status.forEach(s => tags.push(s));
    if (r.pending.includes('Prints after save')) tags.push('Prints after save');
    if (r.voided) tags.push('Voided');
    const h = holdingTag(r, receivedAt);
    if (h) tags.push(h);
    return tags;
  };
  const inlinePanel = r => {
    if (!panel || panel.at !== r.num) return null;
    let body = null;
    if (panel.type === 'refer') body = <ReferPanel nums={panel.nums} rows={rows} mode={mode} onApply={applyRefer} onCancel={() => setPanel(null)} onAliquotFirst={n => { setPanel(null); onAliquotFirst(n); }} />;
    if (panel.type === 'nce') body = <NcePanel nums={panel.nums} rows={rows} prefill={panel.prefill} onApply={applyNce} onCancel={() => setPanel(null)} />;
    if (panel.type === 'store') body = <StoragePanel nums={panel.nums} rows={rows} onApply={applyStore} onCancel={() => setPanel(null)} />;
    if (panel.type === 'aliquot') body = <AliquotPanel row={r} onApply={items => applyAliquots(r, items)} onCancel={() => setPanel(null)} />;
    if (panel.type === 'coll') body = <CollectionEditPanel row={r} onCancel={() => setPanel(null)} onApply={coll => { upd(r.num, { coll }); setPanel(null); }} />;
    if (panel.type === 'void') body = <VoidPanel row={r} onCancel={() => setPanel(null)} onApply={reason => { setRows(rows.map(x => (x.num === r.num ? { ...x, voided: true, voidReason: reason, tests: [] } : x))); setPanel(null); }} />;
    return <TableRow><TableCell colSpan={cols}>{body}</TableCell></TableRow>;
  };
  const referDisabledTip = t('order.samples.referralAccess', 'You need referral access');

  return (
    <TableContainer id="samples-table" title={fmt(t('order.samples.heading', 'Samples for {labNo}'), { labNo })}>
      <TableToolbar aria-label={t('order.samples.toolbar', 'Sample actions')}>
        <TableBatchActions shouldShowBatchActions={sel.length > 0} totalSelected={sel.length} onCancel={() => setSel([])}
          translateWithId={id => (id === 'carbon.table.batch.cancel' ? t('common.cancel', 'Cancel') : fmt(t('order.samples.selected', '{count} selected'), { count: sel.length }))}>
          <TableBatchAction renderIcon={Printer} onClick={() => print(sel)}>{t('order.samples.printLabels', 'Print labels')}</TableBatchAction>
          <TableBatchAction renderIcon={Box} onClick={() => toolbarAction('store')}>{t('order.samples.store', 'Store')}</TableBatchAction>
          <TableBatchAction renderIcon={SendAlt} disabled={!canRefer} onClick={() => toolbarAction('refer')}>{t('order.referral.title', 'Refer out')}</TableBatchAction>
          <TableBatchAction renderIcon={WarningAlt} onClick={() => toolbarAction('nce')}>{t('order.nce.title', 'Report non-conformity')}</TableBatchAction>
        </TableBatchActions>
        <TableToolbarContent>
          <TextInput id="scan-sample" size="md" labelText={t('order.samples.scan', 'Scan a sample label')} hideLabel placeholder={t('order.samples.scan', 'Scan a sample label')} value={scan} onChange={e => setScan(e.target.value)} onKeyDown={onScan} style={{ width: 220 }} />
          <Barcode size={20} aria-hidden="true" style={{ alignSelf: 'center', margin: '0 8px' }} />
          <ComboBox id="add-sample-c" size="md" titleText="" aria-label={t('order.samples.add', 'Add sample')} placeholder={t('order.samples.containerType', 'Container type')} items={CLINICAL_CONTAINERS}
            itemToString={k => (k ? CONTAINERS[k].name : '')} selectedItem={addC} onChange={({ selectedItem }) => setAddC(selectedItem)} style={{ width: 240 }} />
          <NumberInput id="add-sample-n" size="md" hideLabel label={t('order.samples.addCount', 'Number of samples')} min={1} max={10} value={addN} onChange={(_, { value }) => setAddN(Number(value) || 1)} style={{ width: 110 }} />
          <Button size="md" kind="tertiary" renderIcon={Add} disabled={!addC} onClick={addSamples}>{t('order.samples.add', 'Add sample')}</Button>
          <Button size="md" kind="ghost" renderIcon={Printer} onClick={() => print(sel.length ? sel : live.map(r => r.num))}>{t('order.samples.printLabels', 'Print labels')}</Button>
          <Button size="md" kind="ghost" renderIcon={Box} onClick={() => toolbarAction('store')}>{t('order.samples.store', 'Store')}</Button>
          <Button size="md" kind="ghost" renderIcon={SendAlt} disabled={!canRefer} title={canRefer ? undefined : referDisabledTip} onClick={() => toolbarAction('refer')}>{t('order.referral.title', 'Refer out')}</Button>
          <Button size="md" kind="ghost" renderIcon={WarningAlt} onClick={() => toolbarAction('nce')}>{t('order.nce.title', 'Report non-conformity')}</Button>
        </TableToolbarContent>
      </TableToolbar>
      {panel && panel.at === 'toolbar' && (
        <div style={{ margin: 'var(--cds-spacing-03) 0' }}>
          {panel.type === 'refer' && <ReferPanel nums={panel.nums} rows={rows} mode={mode} onApply={applyRefer} onCancel={() => setPanel(null)} onAliquotFirst={n => { setPanel(null); onAliquotFirst(n); }} />}
          {panel.type === 'nce' && <NcePanel nums={panel.nums} rows={rows} onApply={applyNce} onCancel={() => setPanel(null)} />}
          {panel.type === 'store' && <StoragePanel nums={panel.nums} rows={rows} onApply={applyStore} onCancel={() => setPanel(null)} />}
        </div>
      )}
      {fillAll && (
        <PanelShell title={t('order.samples.fillAll.title', 'Collected for all empty rows')} onCancel={() => setFillAll(null)}
          onApply={() => { setRows(rows.map(r => (!r.parent && !r.coll.at && !r.coll.by ? { ...r, coll: { ...r.coll, ...fillAll } } : r))); setFillAll(null); }}>
          <CollectionFields value={fillAll} onChange={setFillAll} idPrefix="fill-all" />
        </PanelShell>
      )}
      {loading ? <SkeletonText paragraph lineCount={6} /> : !shownRows.length ? (
        <Tile style={{ textAlign: 'center' }}>
          <p>{t('order.samples.empty', 'No samples yet. Add a sample or scan a label.')}</p>
          <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => document.getElementById('add-sample-c') && document.getElementById('add-sample-c').focus()}>{t('order.samples.add', 'Add sample')}</Button>
        </Tile>
      ) : (
        <Table size="xs" useZebraStyles={false}>
          <TableHead>
            <TableRow>
              <TableExpandHeader aria-label={t('order.samples.details', 'Details')} />
              <TableSelectAll id="sel-all" name="sel-all" ariaLabel={t('common.selectAll', 'Select all')} checked={sel.length > 0 && sel.length === live.length} indeterminate={sel.length > 0 && sel.length < live.length}
                onSelect={() => setSel(sel.length === live.length ? [] : live.map(r => r.num))} />
              <TableHeader>{t('order.samples.col.number', 'Sample number')}</TableHeader>
              <TableHeader>{t('order.samples.col.container', 'Container')}</TableHeader>
              <TableHeader>{t('common.sampleType', 'Sample type')}</TableHeader>
              <TableHeader>{t('common.tests', 'Tests')}</TableHeader>
              <TableHeader>
                {t('common.collected', 'Collected')}{' '}
                <Button kind="ghost" size="sm" onClick={() => setFillAll({ at: receivedAt, by: '', elsewhere: false })}>{t('order.samples.fillAll', 'Fill all')}</Button>
              </TableHeader>
              {siteCol && <TableHeader>{t('order.samples.col.bodySite', 'Body site')}</TableHeader>}
              <TableHeader>{t('common.storageLocation', 'Storage location')}</TableHeader>
              <TableHeader>{t('common.status', 'Status')}</TableHeader>
              <TableHeader><span className="cds--visually-hidden">{t('common.actions', 'Actions')}</span></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {shownRows.map(r => (
              <React.Fragment key={r.num}>
                <TableExpandRow isExpanded={!!expanded[r.num]} onExpand={() => setExpanded({ ...expanded, [r.num]: !expanded[r.num] })} expandIconDescription={t('order.samples.details', 'Details')}
                  isSelected={sel.includes(r.num)} style={r.voided ? S.strike : undefined}>
                  <TableSelectRow id={`sel-${r.num}`} name={`sel-${r.num}`} ariaLabel={r.num} checked={sel.includes(r.num)} disabled={r.voided}
                    onSelect={() => setSel(sel.includes(r.num) ? sel.filter(x => x !== r.num) : [...sel, r.num])} />
                  <TableCell style={{ paddingLeft: r.parent ? 'var(--cds-spacing-07)' : undefined }}><SuffixBadge num={r.num} full /></TableCell>
                  <TableCell>
                    {r.parent ? <span style={S.muted}>{CONTAINERS[r.c].short}</span> : (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <CapSwatch c={r.c} />
                        {r.saved ? CONTAINERS[r.c].short : (
                          <Select id={`c-${r.num}`} size="sm" hideLabel labelText={t('order.samples.col.container', 'Container')} value={r.c} onChange={e => upd(r.num, { c: e.target.value, st: CONTAINERS[e.target.value].yields[0] })}>
                            {CLINICAL_CONTAINERS.map(k => <SelectItem key={k} value={k} text={CONTAINERS[k].short} />)}
                          </Select>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.saved || r.parent ? r.st : (
                      <Select id={`st-${r.num}`} size="sm" hideLabel labelText={t('common.sampleType', 'Sample type')} value={r.st} onChange={e => upd(r.num, { st: e.target.value })}>
                        {CONTAINERS[r.c].yields.map(s => <SelectItem key={s} value={s} text={s} />)}
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                      {groupNames(r.tests, ot).split(', ').filter(Boolean).map(n => <Tag key={n} size="sm" type={r.referred.some(id => tShort(id) === n || tName(id) === n) ? 'purple' : 'gray'}>{n}</Tag>)}
                    </span>
                  </TableCell>
                  <TableCell>{collectedCell(r)}</TableCell>
                  {siteCol && <TableCell>{siteCell(r)}</TableCell>}
                  <TableCell>
                    {r.storage ? (
                      <Tooltip label={r.storage} align="bottom"><span tabIndex={0}>{storageShort(r.storage)}</span></Tooltip>
                    ) : (
                      <span>
                        <span style={S.muted}>{t('order.samples.notStored', 'Not stored')}</span>
                        <IconButton kind="ghost" size="sm" label={t('order.samples.store', 'Store')} onClick={() => openPanel('store', [r.num], r.num)}><Box /></IconButton>
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusTags tags={statusFor(r)} />
                    {(() => { const h = holdingTag(r, receivedAt); return h && h.exceeded ? <Button kind="ghost" size="sm" onClick={() => setPanel({ type: 'nce', nums: [r.num], at: r.num, prefill: t('order.prepare.holdingTime.exceeded', 'Holding time exceeded') })}>{t('order.nce.title', 'Report non-conformity')}</Button> : null; })()}
                  </TableCell>
                  <TableCell>
                    {!r.voided && (
                      <span style={{ display: 'inline-flex' }}>
                        <IconButton kind="ghost" size="sm" label={t('common.printLabel', 'Print label')} onClick={() => print([r.num])}><Printer /></IconButton>
                        <IconButton kind="ghost" size="sm" label={canRefer ? t('order.referral.title', 'Refer out') : referDisabledTip} disabled={!canRefer} onClick={() => openPanel('refer', [r.num], r.num)}><SendAlt /></IconButton>
                        <IconButton kind="ghost" size="sm" label={t('order.nce.title', 'Report non-conformity')} onClick={() => openPanel('nce', [r.num], r.num)}><WarningAlt /></IconButton>
                        {prepare && !r.parent && <IconButton kind="ghost" size="sm" label={t('common.createAliquot', 'Create aliquot')} onClick={() => openPanel('aliquot', [r.num], r.num)}><Eyedropper /></IconButton>}
                        <IconButton kind="ghost" size="sm" label={r.saved ? t('order.samples.void', 'Void') : t('common.remove', 'Remove')} onClick={() => remove(r)}>{r.saved ? <Misuse /> : <TrashCan />}</IconButton>
                      </span>
                    )}
                  </TableCell>
                </TableExpandRow>
                {expanded[r.num] && <TableExpandedRow colSpan={cols + 1}><SampleDetails row={r} upd={p => upd(r.num, p)} cfg={cfg} /></TableExpandedRow>}
                {inlinePanel(r)}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      )}
      <div style={{ marginTop: 'var(--cds-spacing-03)' }}>
        <Toggle id="show-voided" size="sm" labelText={t('common.showVoided', 'Show voided')} labelA="" labelB="" toggled={showVoided} onToggle={setShowVoided} />
      </div>
    </TableContainer>
  );
}

/* ============================== LabelsSection (FR-I1 to FR-I9) ============================== */
// Always open, directly below the samples table (order labels only before any sample exists). Two parts:
// Order labels (one row) and Sample labels (sample-by-preset grid). No label status anywhere (FR-I6).
// Quantities: highest default and highest maximum across contributing tests (FR-I4); override up to max (FR-I5).
function LabelsSection({ rows, ot, cfg, orderOnly, onNotify }) {
  const [orderQty, setOrderQty] = useState({});
  const [sampleQty, setSampleQty] = useState({});   // { num: { preset: qty } } user overrides, recorded with the print request
  const [extraCols, setExtraCols] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const labelRows = liveSamples(rows);
  const orderSrc = labelSources(activeTests(ot).map(e => e.id), ot, 'order', false);
  const orderPresets = ACTIVE_PRESETS.filter(k => PRESETS[k].level === 'order' && (showAll || orderSrc[k].linked || PRESETS[k].def > 0 || extraCols.includes(k)));
  const rowSrc = Object.fromEntries(labelRows.map(r => [r.num, labelSources(r.tests, ot, 'sample', !!r.parent)]));
  const sampleLevel = ACTIVE_PRESETS.filter(k => PRESETS[k].level === 'sample');
  const sampleCols = sampleLevel.filter(k => showAll || extraCols.includes(k) || PRESETS[k].def > 0 || labelRows.some(r => rowSrc[r.num][k].linked));
  const addable = ACTIVE_PRESETS.filter(k => !sampleCols.includes(k) && !orderPresets.includes(k));
  const presetLabel = k => `${PRESETS[k].name}${PRESETS[k].custom ? ` (${t('order.label.custom', 'custom')})` : ''}, ${PRESETS[k].size}`;
  const srcText = (src, qty, changed) => {
    if (changed) return fmt(t('order.label.changedBy', '{qty}, changed by {user}'), { qty, user: ME });
    if (src.src === 'test') return fmt(t('order.label.fromTest', '{qty}, from {test}'), { qty, test: src.by });
    return fmt(t('order.label.fromPreset', '{qty}, preset default'), { qty });
  };
  const qtyCell = (id, src, value, setValue) => {
    const changed = value !== undefined && value !== src.qty;
    const qty = value !== undefined ? value : src.qty;
    const lockedReason = !cfg.labelOverride ? t('order.label.overrideOff', 'Label quantities cannot be changed at order entry (Order Entry Configuration).')
      : src.lockedBy ? fmt(t('order.label.locked', 'Set by {test} in the test catalog'), { test: src.lockedBy }) : null;
    return (
      <Tooltip label={lockedReason || srcText(src, qty, changed)} align="top">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {lockedReason ? (<><Locked size={16} aria-label={lockedReason} /><span>{qty}</span></>) : (
            <NumberInput id={id} size="sm" hideLabel label={t('common.quantity', 'Quantity')} min={0} max={src.max} value={qty} onChange={(_, { value: v }) => setValue(Number(v))} style={{ width: 96 }} />
          )}
          {changed && <Tag size="sm" type="cool-gray">{t('order.label.changed', 'Changed')}</Tag>}
        </span>
      </Tooltip>
    );
  };
  const rowTotal = r => sampleCols.reduce((s, k) => s + ((sampleQty[r.num] || {})[k] !== undefined ? sampleQty[r.num][k] : rowSrc[r.num][k].qty), 0);
  const orderTotal = orderPresets.reduce((s, k) => s + (orderQty[k] !== undefined ? orderQty[k] : orderSrc[k].qty), 0);
  const total = orderTotal + (orderOnly ? 0 : labelRows.reduce((s, r) => s + rowTotal(r), 0));
  const printMsg = what => onNotify({ text: labelRows.some(r => !r.saved) ? t('order.label.afterSave', 'Prints after save') : fmt(t('order.label.printing', 'Label file opened for {samples}.'), { samples: what }) });
  return (
    <section id="labels-section" aria-labelledby="labels-h" style={S.section}>
      <Fence owner="OGC-285" name={t('mockup.fence.presets', 'Label presets (definitions, sizes, PDF rendering)')} note={t('mockup.fence.presetsNote', 'The Labels grid itself is new in this FRS (FR-I2).')}>
        <h3 id="labels-h" className="cds--type-productive-heading-03">{t('order.label.section', 'Labels')}</h3>
        <div id="order-labels" style={{ ...S.row, margin: 'var(--cds-spacing-04) 0' }}>
          <strong style={{ minWidth: 120 }}>{t('order.label.orderLabels', 'Order labels')}</strong>
          {orderPresets.map(k => (
            <span key={k} style={{ display: 'inline-flex', flexDirection: 'column' }}>
              <span style={S.muted}>{presetLabel(k)}</span>
              {qtyCell(`ol-${k}`, orderSrc[k], orderQty[k], v => setOrderQty({ ...orderQty, [k]: v }))}
            </span>
          ))}
          <IconButton kind="ghost" size="sm" label={t('order.label.printOrder', 'Print order labels')} onClick={() => printMsg(LAB)}><Printer /></IconButton>
        </div>
        {!orderOnly && labelRows.length > 0 && (
          <>
            <h4 className="cds--type-productive-heading-01">{t('order.label.sampleLabels', 'Sample labels')}</h4>
            <Table size="xs" useZebraStyles={false} aria-label={t('order.label.sampleLabels', 'Sample labels')}>
              <TableHead>
                <TableRow>
                  <TableHeader>{t('order.tests.col.sample', 'Sample')}</TableHeader>
                  {sampleCols.map(k => (
                    <TableHeader key={k}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>{PRESETS[k].name}<br /><span style={S.muted}>{PRESETS[k].size}</span></span>
                        <IconButton kind="ghost" size="sm" label={fmt(t('order.label.printColumn', 'Print column'), {})} onClick={() => printMsg(PRESETS[k].name)}><Printer /></IconButton>
                      </span>
                    </TableHeader>
                  ))}
                  <TableHeader>{t('order.label.rowTotal', 'Row total')}</TableHeader>
                  <TableHeader><span className="cds--visually-hidden">{t('order.label.printRow', 'Print row')}</span></TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {labelRows.map(r => (
                  <TableRow key={r.num}>
                    <TableCell style={{ paddingLeft: r.parent ? 'var(--cds-spacing-07)' : undefined }}><SuffixBadge num={r.num} />{!r.saved && <Tag size="sm" type="blue">{t('order.label.afterSave', 'Prints after save')}</Tag>}</TableCell>
                    {sampleCols.map(k => (
                      <TableCell key={k}>{qtyCell(`sl-${r.num}-${k}`, rowSrc[r.num][k], (sampleQty[r.num] || {})[k], v => setSampleQty({ ...sampleQty, [r.num]: { ...(sampleQty[r.num] || {}), [k]: v } }))}</TableCell>
                    ))}
                    <TableCell>{fmt(t('order.label.count', '{count} labels'), { count: rowTotal(r) })}</TableCell>
                    <TableCell><IconButton kind="ghost" size="sm" label={t('order.label.printRow', 'Print row')} onClick={() => printMsg(suffixOf(r.num))}><Printer /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        <div style={{ ...S.row, marginTop: 'var(--cds-spacing-04)' }}>
          {/* FR-I3: Add label type lists every other active preset; Show all reveals every active preset at zero */}
          <ComboBox id="add-label-type" titleText={t('order.label.addType', 'Add label type')} items={addable} itemToString={k => (k ? presetLabel(k) : '')} selectedItem={null}
            onChange={({ selectedItem }) => selectedItem && setExtraCols([...extraCols, selectedItem])} style={{ minWidth: 300 }} />
          <Toggle id="labels-show-all" size="sm" labelText={t('order.label.showAll', 'Show all label types')} labelA="" labelB="" toggled={showAll} onToggle={setShowAll} />
          <span style={{ flex: 1 }} />
          <span>{fmt(t('order.label.total', '{count} labels in total'), { count: total })}</span>
          <Button kind="tertiary" size="md" renderIcon={Printer} onClick={() => printMsg(t('order.label.all', 'all labels'))}>{t('order.label.printAll', 'Print all labels')}</Button>
        </div>
      </Fence>
    </section>
  );
}

/* ============================== Shared page hooks ============================== */
// Undo and info notifications for remove actions (FR-B16, FR-B21, FR-C7). One notification per event (FR-A11).
function useNotice() {
  const [notice, setNotice] = useState(null);
  const node = notice ? (
    notice.undo
      ? <ActionableNotification inline kind="info" lowContrast title={notice.text} actionButtonLabel={t('common.undo', 'Undo')} onActionButtonClick={() => { notice.undo(); setNotice(null); }} onClose={() => setNotice(null)} />
      : <InlineNotification kind="info" lowContrast title={notice.text} onClose={() => setNotice(null)} />
  ) : null;
  return [node, setNotice];
}

/* ============================== EnterOrderPage (section B) ============================== */
// Route: /order/clinical/enter (new) or /order/clinical/enter?id=<orderId> (saved)
// SideNav: Orders & Patients -> Add Clinical Order (step 1 within the order)
// Breadcrumb: Home / Orders / Clinical Orders / Enter Order
const DEFAULT_SPEC = ['P:FBC', 'HBA1C', 'P:LFT', 'CREA', 'P:COAG', 'WCUL'];
const LAB_NO_RE = /^\d{2}CPHL\d{5}$/; // validateAccessionNumber stand-in (FR-A14); real formats follow the site-wide setting

function EnterOrderPage({ cfg, acceptance, go, received0, sim }) {
  const pre = received0; // screen variant: tubes arrived with the request, patient and requester already found
  const [labNo, setLabNo] = useState(LAB); // reserved when the page opens (FR-A14)
  const [everSaved, setEverSaved] = useState(false);
  const [priority, setPriority] = useState('Routine');
  const [eqa, setEqa] = useState(false);
  const [eqaF, setEqaF] = useState({ program: '', providerId: '', deadline: '', priority: 'Standard' });
  const [noPatient, setNoPatient] = useState(false);
  const [patient, setPatient] = useState(pre ? PATIENTS[0] : null);
  const [pSearch, setPSearch] = useState({ status: 'idle', q: { id: '', last: 'Morea', first: 'Kila', dob: '' } });
  const [newPatient, setNewPatient] = useState(null);
  const [facility, setFacility] = useState(pre ? FACILITIES[0] : null);
  const [facInput, setFacInput] = useState('');
  const [ward, setWard] = useState(pre ? 'Medical Ward 3' : null);
  const [provider, setProvider] = useState(pre ? PROVIDERS[0] : null);
  const [provInput, setProvInput] = useState('');
  const [newProv, setNewProv] = useState(null);
  const [contact, setContact] = useState('');
  const [refLabNo, setRefLabNo] = useState(pre ? 'PMGH-MW3-1187' : '');
  const [remember, setRemember] = useState(false);
  const [orderAt, setOrderAt] = useState(NOW);
  const [requiredBy, setRequiredBy] = useState('');
  const [program, setProgram] = useState('Routine clinical testing');
  const [answers, setAnswers] = useState({});
  const [diagnosis, setDiagnosis] = useState('');
  const [ot, setOtRaw] = useState(() => (pre ? buildOrderedTests(DEFAULT_SPEC) : []));
  const [chooserFolded, setChooserFolded] = useState(pre);
  const [received, setReceived] = useState(pre);
  const [confirmOff, setConfirmOff] = useState(false);
  const [receivedAt, setReceivedAt] = useState(RECEIVED_AT);
  const [receivedBy, setReceivedBy] = useState(ME);
  // FR-C3: with auto-fill on, empty collection times default to the received time, marked "Defaulted, confirm"
  const autoFill = rs => (cfg.autoFill ? rs.map(r => (r.parent || r.coll.at ? r : { ...r, coll: { ...r.coll, at: RECEIVED_AT, defaulted: true } })) : rs);
  const [rows, setRows] = useState(() => (pre ? autoFill(proposeSamples(buildOrderedTests(DEFAULT_SPEC))) : []));
  const [billing, setBilling] = useState({ ref: '', payment: '', indexName: '', indexNumber: '' });
  const [folded, setFolded] = useState({ patient: pre, requester: pre, details: false });
  const [filter, setFilter] = useState(null);
  const [changeLab, setChangeLab] = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [notice, setNotice] = useNotice();
  const saveHook = useStepSave(sim);

  // FR-B26: adding or removing a test changes only untouched proposed rows, and says so
  const setOt = next => {
    setOtRaw(next);
    if (!received) return;
    const kept = rows.filter(r => r.saved || r.edited || !r.proposed);
    const keptTests = new Set(kept.flatMap(r => r.tests));
    const start = kept.filter(r => !r.parent).reduce((m, r) => Math.max(m, r.pos), 0);
    // tests already on a kept row are excluded from the new proposal (treated like tested elsewhere for proposing only)
    const fresh = proposeSamples(next.map(e => (keptTests.has(e.id) ? { ...e, elsewhere: { on: true } } : e))).map((r, i) => mkSample({ ...r, pos: start + i + 1, labNo }));
    const before = rows.filter(r => r.proposed && !r.edited && !r.saved).length;
    setRows([...kept, ...fresh]);
    if (fresh.length > before) setNotice({ text: fmt(t('order.samples.proposalChanged', 'Added {count} {container} for {test}'), { count: fresh.length - before, container: CONTAINERS[fresh[fresh.length - 1].c].short, test: groupNames(fresh[fresh.length - 1].tests, next) }) });
  };

  // Required levels (FR-A7, FR-B13)
  const hasPatient = !!patient || noPatient || eqa;
  const saveProblems = [
    ...(!hasPatient ? [t('order.continue.item.patient', 'Select or create the patient')] : []),
    ...(!activeTests(ot).length ? [t('order.continue.item.test', 'Add at least one test')] : []),
  ];
  const items = [
    ...(!hasPatient ? [{ key: 'patient', label: t('order.continue.item.patient', 'Select or create the patient'), target: 'patient-search' }] : []),
    ...(cfg.requesterRequired && !facility ? [{ key: 'facility', label: t('order.continue.item.facility', 'Add the requesting facility'), target: 'req-facility' }] : []),
    ...(cfg.requesterRequired && !provider ? [{ key: 'provider', label: t('order.continue.item.provider', 'Add the requesting provider'), target: 'req-provider' }] : []),
    ...(!activeTests(ot).length ? [{ key: 'test', label: t('order.continue.item.test', 'Add at least one test'), target: 'add-by-code' }] : []),
    ...(received && (!receivedAt || !receivedBy) ? [{ key: 'receipt', label: t('order.continue.item.receipt', 'Received date and time'), target: 'received-date' }] : []),
  ];
  const requesterDone = (!cfg.requesterRequired || (facility && provider));
  const doSave = then => saveHook.save(() => { setEverSaved(true); setRows(rs => rs.map(r => ({ ...r, saved: true, proposed: false, pending: [] }))); then && then(); });
  const stepStates = [stepCurrent(items.length), stepNotStarted(), stepNotStarted()];
  const facMatches = FACILITIES.filter(f => f.name.toLowerCase().includes(facInput.toLowerCase()));
  const provMatches = PROVIDERS.filter(p => provName(p).toLowerCase().includes(provInput.toLowerCase()));
  // FR-B6: a failed search never shows "no results" and never unlocks Create new patient
  const runPatientSearch = () => {
    setPSearch({ ...pSearch, status: 'loading' });
    setTimeout(() => setPSearch(s => ({ ...s, status: sim === 'lookupFail' ? 'failed' : 'ok' })), 400);
  };
  const searchResults = PATIENTS.filter(p => p.name.toLowerCase().includes((pSearch.q.last || '').toLowerCase()));
  const sectionOn = { billing: cfg.billingRefNumber || cfg.trackPayment || cfg.contactTracingEnabled || cfg.notifications };

  return (
    <div>
      <PageHeader crumbs={[t('nav.home', 'Home'), t('nav.orders', 'Orders'), t('nav.clinicalOrders', 'Clinical Orders'), t('order.step.enter', 'Enter Order')]}
        title={t('order.step.enter', 'Enter Order')}
        actions={everSaved && <Button kind="danger--tertiary" size="md" onClick={() => setCancelOrder('')}>{t('order.dashboard.cancelOrder', 'Cancel order')}</Button>} />
      {cancelOrder !== null && (
        <div style={{ ...S.panelBox, marginBottom: 16 }}>
          <TextInput id="cancel-order-reason" labelText={reqLabel(t('order.dashboard.cancel.reason', 'Reason for cancelling'), true)} value={cancelOrder} onChange={e => setCancelOrder(e.target.value)} />
          <Button kind="danger" size="sm" disabled={!cancelOrder} onClick={() => go('dashboard')}>{t('common.confirm', 'Confirm')}</Button>
          <Button kind="ghost" size="sm" onClick={() => setCancelOrder(null)}>{t('common.cancel', 'Cancel')}</Button>
        </div>
      )}
      {cfg.clockDrift && <InlineNotification kind="info" lowContrast title={fmt(t('order.clock.drift', "This computer's clock is {minutes} minutes off. Times are taken from the laboratory server."), { minutes: 17 })} />}
      <OrderProgressIndicator steps={orderSteps(acceptance, stepStates)} onOpen={everSaved ? k => go(k) : null} />
      <OrderSummaryStrip patient={patient} noPatient={noPatient || eqa} eqa={eqa} facility={facility} ward={ward} provider={provider} stat={priority === 'STAT'} ot={ot} rows={rows} received={received} activeFilter={filter} onFilter={k => { setFilter(k); focusField(k === 'samples' || k === 'stored' ? 'samples-table' : 'ordered-tests'); }} />

      {/* 1. Order (FR-B3, FR-B4, FR-A14) */}
      <OrderSection id="sec-order" n={1} title={t('order.entry.section.order', 'Order')}>
        <Grid condensed style={{ paddingInline: 0 }}>
          <Column sm={4} md={3} lg={4}>
            <TextInput id="lab-no" labelText={reqLabel(t('common.labNumber', 'Lab number'), true)} required value={labNo} readOnly={everSaved} onChange={e => setLabNo(e.target.value.toUpperCase())}
              helperText={t('order.labNumber.scan', 'Or scan a pre-printed label')} invalid={cfg.validateAccessionNumber && !LAB_NO_RE.test(labNo)}
              invalidText={t('order.labNumber.format', 'Use the format 26CPHL00471.')} />
            {everSaved && <Button kind="ghost" size="sm" onClick={() => setChangeLab({ next: '', reason: '' })}>{t('order.labNumber.change', 'Change lab number')}</Button>}
          </Column>
          <Column sm={4} md={3} lg={4}>
            <RadioButtonGroup legendText={t('order.priority', 'Priority')} name="priority" valueSelected={priority} onChange={setPriority}>
              <RadioButton id="pr-routine" value="Routine" labelText={t('common.routine', 'Routine')} />
              <RadioButton id="pr-stat" value="STAT" labelText={t('common.stat', 'STAT')} />
            </RadioButtonGroup>
          </Column>
          <Column sm={4} md={2} lg={5}>
            {cfg.eqaEnabled && <Checkbox id="eqa" labelText={t('order.entry.eqa', 'EQA sample')} checked={eqa} onChange={(_, { checked }) => { setEqa(checked); if (checked) setNoPatient(true); }} />}
            <Tooltip label={cfg.patientRequired ? t('order.entry.noPatient.disabled', 'A patient is required by Order Entry Configuration.') : t('order.noPatient', 'This order has no patient')} align="bottom">
              <span><Checkbox id="no-patient" labelText={t('order.noPatient', 'This order has no patient')} disabled={cfg.patientRequired && !eqa} checked={noPatient} onChange={(_, { checked }) => setNoPatient(checked)} /></span>
            </Tooltip>
          </Column>
          <Column sm={4} md={8} lg={3} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button kind="ghost" size="md" renderIcon={Printer} onClick={() => focusField('order-labels')}>{t('order.label.printOrder', 'Print order labels')}</Button>
          </Column>
        </Grid>
        {noPatient && !eqa && <InlineNotification kind="warning" lowContrast hideCloseButton title={t('order.noPatient.warning.title', 'Results will not be evaluated against a reference range')} subtitle={t('order.noPatient.warning.subtitle', 'Without a patient there is no age or sex to select reference ranges.')} />}
        {eqa && (
          <div style={{ ...S.row, marginTop: 'var(--cds-spacing-04)' }}>
            <TextInput id="eqa-prog" labelText={t('eqa.order.programme', 'EQA program')} value={eqaF.program} onChange={e => setEqaF({ ...eqaF, program: e.target.value })} />
            <TextInput id="eqa-psid" labelText={t('eqa.order.providerSampleId', 'Provider sample ID')} value={eqaF.providerId} onChange={e => setEqaF({ ...eqaF, providerId: e.target.value })} />
            <DatePicker datePickerType="single" dateFormat="d/m/Y"><DatePickerInput id="eqa-deadline" labelText={t('eqa.order.deadline', 'Deadline')} placeholder={t('common.datePlaceholder', 'dd/mm/yyyy')} /></DatePicker>
            <Select id="eqa-pri" labelText={t('eqa.order.priority', 'EQA priority')} value={eqaF.priority} onChange={e => setEqaF({ ...eqaF, priority: e.target.value })}>
              {['Standard', 'Urgent'].map(v => <SelectItem key={v} value={v} text={v} />)}
            </Select>
          </div>
        )}
        {changeLab && (
          <div style={{ ...S.panelBox, marginTop: 16 }}>
            <div style={S.row}>
              <TextInput id="lab-new" labelText={reqLabel(t('order.labNumber.new', 'New lab number'), true)} value={changeLab.next} onChange={e => setChangeLab({ ...changeLab, next: e.target.value.toUpperCase() })} />
              <TextInput id="lab-reason" labelText={reqLabel(t('order.labNumber.change.reason', 'Reason for changing the lab number'), true)} value={changeLab.reason} onChange={e => setChangeLab({ ...changeLab, reason: e.target.value })} />
            </div>
            {changeLab.next && <p>{fmt(t('order.labNumber.change.confirm', '{old} becomes {new}. Print new labels for every tube.'), { old: labNo, new: changeLab.next })}</p>}
            <Button kind="primary" size="sm" disabled={!changeLab.next || !changeLab.reason} onClick={() => { setLabNo(changeLab.next); setRows(rows.map(r => ({ ...r, num: r.num.replace(labNo, changeLab.next), parent: r.parent ? r.parent.replace(labNo, changeLab.next) : r.parent }))); setChangeLab(null); }}>{t('common.confirm', 'Confirm')}</Button>
            <Button kind="ghost" size="sm" onClick={() => setChangeLab(null)}>{t('common.cancel', 'Cancel')}</Button>
          </div>
        )}
      </OrderSection>

      {/* 2. Patient (FR-B5, FR-B6): search first; Create new patient only after a search that SUCCEEDED */}
      {!(noPatient || eqa) && (
        <OrderSection id="sec-patient" n={2} title={t('common.patient', 'Patient')} required folded={folded.patient && !!patient}
          summary={patient && `${patient.name}, ${patient.sex}, ${patient.age} ${t('common.yearsShort', 'y')}, ${patient.nid}`}
          onEdit={() => setFolded({ ...folded, patient: false })} onLeave={() => patient && setFolded(f => ({ ...f, patient: true }))}>
          <Fence owner="OGC-1197" name={t('mockup.fence.patientSearch', 'Shared patient search panel')} note={t('mockup.fence.patientSearchNote', 'FR-B5 and FR-B6 change this shared panel everywhere it is used.')}>
            <div id="patient-search" style={S.row}>
              <TextInput id="ps-id" labelText={t('patient.identifier', 'Identifier')} value={pSearch.q.id} onChange={e => setPSearch({ ...pSearch, q: { ...pSearch.q, id: e.target.value } })} />
              <TextInput id="ps-last" labelText={t('patient.lastName', 'Last name')} value={pSearch.q.last} onChange={e => setPSearch({ ...pSearch, q: { ...pSearch.q, last: e.target.value } })} />
              <TextInput id="ps-first" labelText={t('patient.firstName', 'First name')} value={pSearch.q.first} onChange={e => setPSearch({ ...pSearch, q: { ...pSearch.q, first: e.target.value } })} />
              <DatePicker datePickerType="single" dateFormat="d/m/Y"><DatePickerInput id="ps-dob" labelText={t('patient.dob', 'Date of birth')} placeholder={t('common.datePlaceholder', 'dd/mm/yyyy')} /></DatePicker>
              <Button size="md" onClick={runPatientSearch} disabled={pSearch.status === 'loading'}>{pSearch.status === 'loading' ? t('common.searching', 'Searching...') : t('common.search', 'Search')}</Button>
            </div>
            {(cfg.useExternalPatientSource || cfg.enableClientRegistry) && <p style={S.muted}>{t('patient.search.external', 'Also searching the external patient source.')}</p>}
            {pSearch.status === 'failed' && (
              <ActionableNotification inline kind="error" lowContrast hideCloseButton title={t('order.entry.patient.searchFailed', 'Search failed. Check the connection and try again.')} actionButtonLabel={t('common.retry', 'Retry')} onActionButtonClick={runPatientSearch} />
            )}
            {pSearch.status === 'ok' && (
              <>
                <Table size="xs" useZebraStyles={false}>
                  <TableHead><TableRow>{[t('common.name', 'Name'), t('patient.sex', 'Sex'), t('patient.dob', 'Date of birth'), t('patient.nationalId', 'National ID'), t('patient.lastOrder', 'Last order'), ''].map((h, i) => <TableHeader key={i}>{h}</TableHeader>)}</TableRow></TableHead>
                  <TableBody>
                    {searchResults.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{p.name}</TableCell><TableCell>{p.sex}</TableCell><TableCell>{p.dob}</TableCell><TableCell style={S.mono}>{p.nid}</TableCell><TableCell>{p.last || t('patient.noPrevious', 'No previous orders')}</TableCell>
                        <TableCell><Button kind="ghost" size="sm" onClick={() => { setPatient(p); setFolded({ ...folded, patient: true }); }}>{t('common.select', 'Select')}</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setNewPatient({ ...pSearch.q })}>{t('order.entry.patient.createNew', 'Create new patient')}</Button>
              </>
            )}
            {patient && <InlineNotification kind="success" lowContrast hideCloseButton title={`${patient.name}, ${patient.dob}, ${patient.nid}`} />}
          </Fence>
          {newPatient && (
            <div style={{ marginTop: 16 }}>
              <Fence owner="Patient entry" name={t('mockup.fence.newPatient', 'New-patient form (shared, layout unchanged)')} note={t('mockup.fence.newPatientNote', 'Search fields carried across one to one.')}>
                <div style={S.row}>
                  <TextInput id="np-id" labelText={t('patient.identifier', 'Identifier')} defaultValue={newPatient.id} />
                  <TextInput id="np-last" labelText={reqLabel(t('patient.lastName', 'Last name'), true)} defaultValue={newPatient.last} />
                  <TextInput id="np-first" labelText={t('patient.firstName', 'First name')} defaultValue={newPatient.first} />
                  <TextInput id="np-nid" labelText={reqLabel(t('patient.nationalId', 'National ID'), cfg.nationalIdRequired)} />
                </div>
              </Fence>
            </div>
          )}
        </OrderSection>
      )}

      {/* 3. Requester (FR-B7 to FR-B10): search-first facility and provider; inline new provider with Title */}
      <OrderSection id="sec-requester" n={3} title={t('common.requester', 'Requester')} required={cfg.requesterRequired} folded={folded.requester && requesterDone}
        summary={`${facility ? facility.name : ''}${ward ? ', ' + ward : ''}${provider ? ' · ' + provName(provider) : ''}`}
        onEdit={() => setFolded({ ...folded, requester: false })} onLeave={() => requesterDone && setFolded(f => ({ ...f, requester: true }))}>
        <Grid condensed style={{ paddingInline: 0 }}>
          <Column sm={4} md={4} lg={6}>
            <ComboBox id="req-facility" titleText={reqLabel(t('order.requester.facility', 'Requesting facility'), cfg.requesterRequired)} items={FACILITIES} itemToString={f => (f ? f.name : '')}
              selectedItem={facility} onInputChange={v => setFacInput(v || '')} onChange={({ selectedItem }) => { setFacility(selectedItem); setWard(null); }} />
            {facInput.length >= 2 && !facMatches.length && (
              <Tooltip label={cfg.restrictFreeTextRefSiteEntry ? t('order.entry.addNew.restricted', 'Adding new entries here is turned off in Order Entry Configuration.') : t('order.entry.facility.review', 'Created with name only and flagged for review in Locations & Organizations.')} align="bottom">
                <Button kind="ghost" size="sm" renderIcon={Add} disabled={cfg.restrictFreeTextRefSiteEntry} onClick={() => setFacility({ id: 'new', name: facInput, wards: [] })}>{t('order.entry.facility.addNew', 'Add new facility')}</Button>
              </Tooltip>
            )}
          </Column>
          <Column sm={4} md={4} lg={5}>
            <ComboBox id="req-ward" titleText={t('order.requester.ward', 'Ward or department')} items={facility ? facility.wards : []} disabled={!facility} selectedItem={ward} onChange={({ selectedItem }) => setWard(selectedItem)} />
          </Column>
          <Column sm={4} md={8} lg={5}>
            <TextInput id="ref-lab-no" labelText={t('order.requester.referringLabNumber', 'Referring laboratory number')} value={refLabNo} onChange={e => setRefLabNo(e.target.value)} />
          </Column>
          <Column sm={4} md={4} lg={6} style={{ marginTop: 16 }}>
            {/* Results show title, name and facility; contact fields hidden until a provider is picked or added (FR-B8) */}
            <ComboBox id="req-provider" titleText={reqLabel(t('common.provider', 'Provider'), cfg.requesterRequired)} items={PROVIDERS} itemToString={p => (p ? `${provName(p)} (${p.facility})` : '')}
              selectedItem={provider} onInputChange={v => setProvInput(v || '')} onChange={({ selectedItem }) => { setProvider(selectedItem); setNewProv(null); }} />
            {provInput.length >= 2 && !provMatches.length && !newProv && (
              <Tooltip label={cfg.restrictFreeTextProviderEntry ? t('order.entry.addNew.restricted', 'Adding new entries here is turned off in Order Entry Configuration.') : t('order.entry.provider.addNew', 'Add new provider')} align="bottom">
                <Button kind="ghost" size="sm" renderIcon={Add} disabled={cfg.restrictFreeTextProviderEntry} onClick={() => setNewProv({ title: '', first: '', last: provInput, phone: '', fax: '', email: '' })}>{t('order.entry.provider.addNew', 'Add new provider')}</Button>
              </Tooltip>
            )}
          </Column>
          <Column sm={4} md={4} lg={5} style={{ marginTop: 16 }}>
            <TextInput id="req-contact" labelText={t('order.requester.contact', 'Requester contact')} value={contact} onChange={e => setContact(e.target.value)} />
          </Column>
          <Column sm={4} md={8} lg={5} style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end' }}>
            <Checkbox id="remember" labelText={t('order.remember.site.and.requester.label', 'Remember site and requester')} checked={remember} onChange={(_, { checked }) => setRemember(checked)} />
          </Column>
        </Grid>
        {provider && (
          <div style={{ ...S.row, marginTop: 16 }}>
            <TextInput id="prov-phone" readOnly labelText={t('order.requester.phone.label', 'Phone')} value={provider.phone} />
            <TextInput id="prov-fax" readOnly labelText={t('order.requester.fax.label', 'Fax')} value={provider.fax} />
            <TextInput id="prov-email" readOnly labelText={t('order.requester.email.label', 'Email')} value={provider.email} />
          </div>
        )}
        {newProv && (
          <div style={{ ...S.panelBox, marginTop: 16 }}>
            {/* FR-B9 field order: Title, First name, Last name (required), Phone, Fax, Email. Blocked on OGC-1223 landing. */}
            <div style={S.row}>
              <Select id="np-title" labelText={t('order.entry.provider.title', 'Title')} value={newProv.title} onChange={e => setNewProv({ ...newProv, title: e.target.value })}>
                <SelectItem value="" text={t('common.none', 'None')} />
                {PROVIDER_TITLES.map(v => <SelectItem key={v} value={v} text={v} />)}
              </Select>
              <TextInput id="np-first-p" labelText={t('order.requester.firstName.label', 'First name')} value={newProv.first} onChange={e => setNewProv({ ...newProv, first: e.target.value })} />
              <TextInput id="np-last-p" required labelText={reqLabel(t('order.requester.lastName.label', 'Last name'), true)} value={newProv.last} onChange={e => setNewProv({ ...newProv, last: e.target.value })} />
              <TextInput id="np-phone" labelText={t('order.requester.phone.label', 'Phone')} value={newProv.phone} onChange={e => setNewProv({ ...newProv, phone: e.target.value })} />
              <TextInput id="np-fax" labelText={t('order.requester.fax.label', 'Fax')} value={newProv.fax} invalid={!!newProv.fax && !/^[+\d\s()-]{6,}$/.test(newProv.fax)} invalidText={t('order.requester.fax.invalid', 'Enter a fax number.')} onChange={e => setNewProv({ ...newProv, fax: e.target.value })} />
              <TextInput id="np-email" labelText={t('order.requester.email.label', 'Email')} value={newProv.email} invalid={!!newProv.email && !/^\S+@\S+\.\S+$/.test(newProv.email)} invalidText={t('order.requester.email.invalid', 'Enter an email address.')} onChange={e => setNewProv({ ...newProv, email: e.target.value })} />
            </div>
            <Button size="sm" disabled={!newProv.last} onClick={() => { setProvider({ id: 'new', ...newProv, facility: facility ? facility.name : '' }); setNewProv(null); }}>{t('order.entry.provider.use', 'Use this provider')}</Button>
          </div>
        )}
      </OrderSection>

      {/* 4. Request details (FR-B11, FR-B12) */}
      <OrderSection id="sec-details" n={4} title={t('order.entry.section.requestDetails', 'Request details')} folded={folded.details}
        summary={`${fmtDT(orderAt)} · ${program}`} onEdit={() => setFolded({ ...folded, details: false })} onLeave={() => setFolded(f => ({ ...f, details: true }))}>
        <div style={S.row}>
          <DatePicker datePickerType="single" dateFormat="d/m/Y" maxDate="25/09/2026" value={orderAt.slice(0, 10)}>
            <DatePickerInput id="order-date" labelText={reqLabel(t('order.requestDate', 'Order date and time'), true)} placeholder={t('common.datePlaceholder', 'dd/mm/yyyy')} />
          </DatePicker>
          <TimePicker id="order-time" labelText={t('order.requestTime', 'Time')} value={orderAt.slice(11, 16)} onChange={e => setOrderAt(`${orderAt.slice(0, 10)}T${e.target.value}`)} />
          <DatePicker datePickerType="single" dateFormat="d/m/Y" minDate="25/09/2026" onChange={([d]) => setRequiredBy(d ? d.toISOString() : '')}>
            <DatePickerInput id="required-by" labelText={t('sample.requiredBy', 'Required by')} placeholder={t('common.datePlaceholder', 'dd/mm/yyyy')} helperText={t('order.entry.requiredBy.beforeOrder', 'Required by cannot be before the order date.')} />
          </DatePicker>
        </div>
        <div style={{ ...S.row, marginTop: 16 }}>
          <Select id="program" labelText={t('common.program', 'Program')} value={program} onChange={e => { setProgram(e.target.value); setAnswers({}); }}>
            {Object.keys(PROGRAMS).map(p => <SelectItem key={p} value={p} text={p} />)}
          </Select>
          {/* Program questions directly under Program (FR-B12; OGC-1144 owns the questions themselves) */}
          {PROGRAMS[program].map(q => (q.o ? (
            <Select key={q.k} id={`pq-${q.k}`} labelText={q.l} value={answers[q.k] || ''} onChange={e => setAnswers({ ...answers, [q.k]: e.target.value })}>
              <SelectItem value="" text={t('common.choose', 'Choose')} />{q.o.map(o => <SelectItem key={o} value={o} text={o} />)}
            </Select>
          ) : <TextInput key={q.k} id={`pq-${q.k}`} labelText={q.l} value={answers[q.k] || ''} onChange={e => setAnswers({ ...answers, [q.k]: e.target.value })} />))}
          <TextInput id="diagnosis" labelText={t('order.provisionalDiagnosis', 'Provisional diagnosis')} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} style={{ minWidth: 280 }} />
          {cfg.nextVisit && <DatePicker datePickerType="single" dateFormat="d/m/Y"><DatePickerInput id="next-visit" labelText={t('order.nextVisitDate', 'Next visit date')} placeholder={t('common.datePlaceholder', 'dd/mm/yyyy')} /></DatePicker>}
          {cfg.testLocationCode && <TextInput id="test-loc" labelText={t('order.testLocationCode', 'Sampling performed at')} />}
        </div>
      </OrderSection>

      {/* 5. Tests (FR-B13 to FR-B21) */}
      <OrderSection id="sec-tests" n={5} title={t('common.tests', 'Tests')} required>
        <TestPanelChooser ot={ot} setOt={setOt} folded={chooserFolded} onExpand={() => setChooserFolded(false)} onFold={() => setChooserFolded(true)}
          lookupFailed={sim === 'lookupFail'} onRetry={() => {}} onNotify={setNotice} />
        <div style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <OrderedTestsTable mode="enter" ot={ot} setOt={setOt} rows={rows} setRows={setRows} cfg={cfg} received={received} filter={filter} onClearFilter={() => setFilter(null)} onNotify={setNotice} facility={facility} />
        </div>
      </OrderSection>

      {/* 6. Samples received with this order (FR-B22 to FR-B27) */}
      <OrderSection id="sec-received" n={6} title={t('order.entry.section.received', 'Samples received with this order')}
        extra={(
          <Tooltip label={rows.some(r => r.saved) ? t('order.entry.received.locked', 'Saved samples are voided one at a time from the table.') : t('order.entry.received.toggle', 'Samples received with this order')} align="right">
            <span>
              <Toggle id="received-toggle" size="sm" hideLabel labelText={t('order.entry.received.toggle', 'Samples received with this order')} labelA="" labelB="" toggled={received} disabled={rows.some(r => r.saved)}
                onToggle={v => { if (!v && rows.length) { setConfirmOff(true); return; } setReceived(v); if (v && !rows.length) setRows(autoFill(proposeSamples(ot, labNo))); }} />
            </span>
          </Tooltip>
        )}>
        {confirmOff && (
          <ActionableNotification inline kind="warning" lowContrast title={fmt(t('order.entry.received.offConfirm', 'Remove the {count} samples entered?'), { count: rows.length })}
            actionButtonLabel={t('common.remove', 'Remove')} onActionButtonClick={() => { setRows([]); setReceived(false); setConfirmOff(false); }} onClose={() => setConfirmOff(false)} />
        )}
        {received && (
          <>
            <div style={{ ...S.row, marginBottom: 16 }}>
              <DatePicker datePickerType="single" dateFormat="d/m/Y" maxDate="25/09/2026" value={receivedAt.slice(0, 10)}>
                <DatePickerInput id="received-date" labelText={reqLabel(t('order.entry.received.at', 'Received date'), true)} placeholder={t('common.datePlaceholder', 'dd/mm/yyyy')} />
              </DatePicker>
              <TimePicker id="received-time" labelText={reqLabel(t('order.entry.received.time', 'Received time'), true)} value={receivedAt.slice(11, 16)} onChange={e => setReceivedAt(`${receivedAt.slice(0, 10)}T${e.target.value}`)} />
              <ComboBox id="received-by" titleText={reqLabel(t('order.entry.received.by', 'Received by'), true)} items={USERS} selectedItem={receivedBy} onChange={({ selectedItem }) => setReceivedBy(selectedItem)} />
              <span style={S.muted}>{fmt(t('order.entry.received.tz', 'Laboratory time ({tz})'), { tz: LAB_TZ })}</span>
            </div>
            <SamplesTable mode="enter" rows={rows} setRows={setRows} ot={ot} cfg={cfg} labNo={labNo} receivedAt={receivedAt} filter={filter} onNotify={setNotice}
              onAliquotFirst={() => doSave(() => go('prepare'))} canRefer={cfg.canRefer} />
          </>
        )}
        <LabelsSection rows={received ? rows : []} ot={ot} cfg={cfg} orderOnly={!received || !rows.length} onNotify={setNotice} />
      </OrderSection>

      {/* 7. Billing and notifications (FR-B28 to FR-B30). Hidden when configuration turns every part off. */}
      {sectionOn.billing && (
        <OrderSection id="sec-billing" n={7} title={t('order.entry.section.billing', 'Billing and notifications')}>
          <div style={S.row}>
            {cfg.billingRefNumber && <TextInput id="billing-ref" labelText={cfg.billingRefNumberLocalization || t('order.billing.reference', 'Billing reference')} value={billing.ref} onChange={e => setBilling({ ...billing, ref: e.target.value })} />}
            {cfg.trackPayment && (
              <Select id="payment" labelText={t('order.paymentStatus', 'Payment status')} value={billing.payment} onChange={e => setBilling({ ...billing, payment: e.target.value })}>
                <SelectItem value="" text={t('common.choose', 'Choose')} />
                {['Not paid', 'Paid', 'Exempt'].map(v => <SelectItem key={v} value={v} text={v} />)}
              </Select>
            )}
            {cfg.contactTracingEnabled && (
              <>
                <TextInput id="index-name" labelText={t('order.contactTracing.indexName', 'Index case name')} value={billing.indexName} onChange={e => setBilling({ ...billing, indexName: e.target.value })} />
                <TextInput id="index-no" labelText={t('order.contactTracing.indexNumber', 'Index case record number')} value={billing.indexNumber} onChange={e => setBilling({ ...billing, indexNumber: e.target.value })} />
              </>
            )}
          </div>
          {cfg.notifications && <p style={S.muted}>{t('order.notify.whereSet', 'Notify patient and Notify provider are set on each test in the ordered tests table. Defaults come from Test Notification Configuration.')}</p>}
        </OrderSection>
      )}

      {/* 8. Attachments (FR-B31) */}
      <OrderSection id="sec-attach" n={8} title={t('order.entry.section.attachments', 'Attachments')}>
        <Fence owner="Order attachments" name={t('mockup.fence.attachments', 'Existing order attachments component, unchanged')}>
          <Button kind="tertiary" size="sm" renderIcon={Upload}>{t('order.attachments.add', 'Add attachment')}</Button>
          <p style={S.muted}>{t('order.attachments.rule', 'On a saved order an attachment is deactivated with a reason, never deleted, and shown under Show removed.')}</p>
        </Fence>
      </OrderSection>

      <OrderFooter nextStep={t('order.step.prepare', 'Prepare Samples')} isLast={false} items={items} saveProblems={saveProblems} saveHook={saveHook}
        onSaveExit={() => { if (!saveProblems.length) doSave(() => go('dashboard')); }} onSaveNext={() => doSave(() => go('prepare'))}
        discard={{ everSaved, tests: activeTests(ot).length, samples: rows.length, onConfirm: () => go('dashboard') }}
        secondaryExtra={notice} />
    </div>
  );
}

/* ============================== PrepareSamplesPage (section D) ============================== */
// Route: /order/clinical/collect?id=<orderId>   (label changes from "Collect" to "Prepare Samples"; URL unchanged)
// SideNav: Orders & Patients -> Add Clinical Order (step 2 within the order)
// Breadcrumb: Home / Orders / Clinical Orders / Prepare Samples
// Top to bottom: ordered tests (with assignment), samples table, labels (FR-D1). Receipt fields appear only when
// no receipt is recorded on the order (it is recorded here). Consent appears only when consentRequiredForCollection is on.
const PREP_SPEC = [...DEFAULT_SPEC, 'TCUL'];
function prepareInit(variant) {
  const inc = variant === 'incomplete';
  const ruth = 'Sr Ruth Kewa';
  const L = n => `${LAB}-${n}`;
  const ot = buildOrderedTests(inc ? [...PREP_SPEC, 'MRDT'] : PREP_SPEC, true);
  const rows = [
    mkSample({ pos: 1, c: 'edta4', st: 'Whole blood', tests: [...PANELS.FBC.members, 'HBA1C'], qty: '4.0', saved: true, proposedFor: [...PANELS.FBC.members, 'HBA1C'], storage: `${STORAGE_LOCATIONS[0]} > A1`, coll: { at: '2026-09-25T08:05', by: ruth }, referred: ['HBA1C'], referTo: REF_LABS[0], status: ['Referred'] }),
    mkSample({ parent: L(1), pos: 1, c: 'edta4', st: 'Plasma', qty: '1.0', status: ['Aliquot'] }),
    mkSample({ pos: 2, c: 'sst', st: 'Serum', tests: [...PANELS.LFT.members, 'CREA'], qty: '5.0', saved: true, storage: `${STORAGE_LOCATIONS[0]} > A2`, coll: { at: '2026-09-25T06:00', by: ruth } }),
    mkSample({ pos: 3, c: 'citrate', st: 'Plasma (citrated)', tests: [...PANELS.COAG.members], qty: '2.7', saved: true, coll: { at: '2026-09-25T05:40', by: inc ? '' : ruth } }),
    mkSample({ pos: 4, c: 'amies', st: 'Swab, wound', tests: ['WCUL'], qty: '1', unit: 'swab', method: 'Swab collection', saved: true, site: inc ? '' : 'lowerleg', side: inc ? '' : 'Left', coll: { at: '2026-09-24T09:30', by: `${ruth} (Tokarara Health Centre)` } }),
    mkSample({ pos: 5, c: 'eswab', st: 'Swab', tests: ['TCUL'], qty: '1', saved: true, coll: { at: '2026-09-25T09:58', by: TECH } }),
    ...(inc ? [mkSample({ pos: 6, c: 'edta4', st: 'Whole blood', tests: [], qty: '4.0', edited: true, coll: { at: '2026-09-25T08:05', by: ruth } })] : []),
  ].map(r => ({ ...r, coll: { elsewhere: false, defaulted: false, afterReceiptOk: false, ...r.coll } }));
  return { ot, rows };
}

function PrepareSamplesPage({ cfg, acceptance, go, sim, variant }) {
  const init = useMemo(() => prepareInit(variant), [variant]);
  const [ot, setOt] = useState(init.ot);
  const [rows, setRows] = useState(init.rows);
  const [consent, setConsent] = useState(false);
  const [filter, setFilter] = useState(null);
  const [notice, setNotice] = useNotice();
  const [finished, setFinished] = useState(false);
  const saveHook = useStepSave(sim);
  const isLast = acceptance === 'Off';
  const primary = liveSamples(rows).filter(r => !r.parent);
  const awaiting = activeTests(ot).filter(e => !e.elsewhere.on && !hostOf(e.id, rows));
  const choose = awaiting.filter(e => usableSamples(rows).filter(r => isCompatible(e.id, r)).length > 1);
  const parents = new Set(rows.filter(r => r.parent).map(r => r.parent));

  // FR-D7 save level: container and type on every sample; every sample carries a test or is an aliquot parent (R-DATA-4)
  const saveProblems = liveSamples(rows).filter(r => !r.parent && !r.tests.length && !parents.has(r.num))
    .map(r => fmt(t('order.save.noTests', '{sample} has no test. Assign a test or remove the sample.'), { sample: suffixOf(r.num) }));
  // FR-D7 complete level, in page order (FR-A9)
  const items = [
    ...(cfg.consentRequiredForCollection && !consent ? [{ key: 'consent', label: t('order.continue.item.consent', 'Record consent'), target: 'consent' }] : []),
    ...choose.map(e => ({ key: `ch-${e.id}`, label: fmt(t('order.continue.item.choice', 'Choose a sample for {test}'), { test: tShort(e.id) }), target: `choose-${e.id}` })),
    ...primary.flatMap(r => [
      ...(!r.coll.by && !r.coll.elsewhere ? [{ key: `by-${r.num}`, label: fmt(t('order.continue.item.collector', 'Collector for {sample}'), { sample: r.num }), target: `coll-${r.num}` }] : []),
      ...(!r.coll.at ? [{ key: `at-${r.num}`, label: fmt(t('order.continue.item.collectionTime', 'Collection date and time for {sample}'), { sample: r.num }), target: `coll-${r.num}` }] : []),
      ...(r.coll.defaulted || (r.coll.at && minutesBetween(RECEIVED_AT, r.coll.at) > 0 && !r.coll.afterReceiptOk) ? [{ key: `ct-${r.num}`, label: fmt(t('order.continue.item.confirmTime', 'Confirm the time for {sample}'), { sample: r.num }), target: `coll-${r.num}` }] : []),
      ...(bodySiteMode(r.st) === 'Required' && !r.site ? [{ key: `bs-${r.num}`, label: fmt(t('order.continue.item.bodySite', 'Body site for {sample}'), { sample: r.num }), target: `site-${r.num}` }] : []),
    ]),
  ];
  const finish = () => saveHook.save(() => { setRows(rs => rs.map(r => ({ ...r, saved: true, pending: [] }))); if (isLast) setFinished(true); else go('check'); },
    awaiting.length ? fmt(t('order.save.doneAwaiting', 'Order {labNo} saved. Still awaiting a sample: {tests}'), { labNo: LAB, tests: groupNames(awaiting.map(e => e.id), ot) }) : undefined);

  return (
    <div>
      <PageHeader crumbs={[t('nav.home', 'Home'), t('nav.orders', 'Orders'), t('nav.clinicalOrders', 'Clinical Orders'), t('order.step.prepare', 'Prepare Samples')]} title={t('order.step.prepare', 'Prepare Samples')}
        actions={<Button kind="danger--tertiary" size="md">{t('order.dashboard.cancelOrder', 'Cancel order')}</Button>} />
      <OrderProgressIndicator steps={orderSteps(acceptance, [stepDone('10:42'), stepCurrent(items.length), stepNotStarted()])} onOpen={k => go(k)} />
      <OrderSummaryStrip patient={PATIENTS[0]} facility={FACILITIES[0]} ward="Medical Ward 3" provider={PROVIDERS[0]} ot={ot} rows={rows} received activeFilter={filter} onFilter={setFilter} />
      {finished && <InlineNotification kind="success" lowContrast title={saveHook.state.msg || fmt(t('order.save.done', 'Order {labNo} saved'), { labNo: LAB })} subtitle={t('order.status.samplesPrepared', 'Samples prepared')} />}

      <section style={S.section}>
        <OrderedTestsTable loading={sim === 'loading'} mode="prepare" ot={ot} setOt={setOt} rows={rows} setRows={setRows} cfg={cfg} received filter={filter} onClearFilter={() => setFilter(null)} onNotify={setNotice} facility={FACILITIES[0]} />
        <div style={{ marginTop: 8 }}>
          <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setNotice({ text: t('order.prepare.addOn', 'The test chooser opens here for add-on tests (FR-D11); they go through automatic assignment.') })}>{t('order.prepare.addOnTests', 'Add add-on tests')}</Button>
        </div>
        {/* FR-D9: Awaiting sample never blocks the save; the banner names the tests */}
        {awaiting.length > choose.length && (
          <ActionableNotification inline kind="warning" lowContrast hideCloseButton
            title={fmt(t('order.prepare.awaitingBanner', 'These tests have no sample yet and stay on the order as Awaiting sample: {tests}'), { tests: groupNames(awaiting.filter(e => !choose.includes(e)).map(e => e.id), ot) })}
            actionButtonLabel={t('order.samples.add', 'Add sample')} onActionButtonClick={() => focusField('add-sample-c')} />
        )}
      </section>

      {cfg.consentRequiredForCollection && (
        <section id="consent" style={S.section}>
          <h3 className="cds--type-productive-heading-03">{reqLabel(t('order.prepare.consent.heading', 'Consent'), true)}</h3>
          <Checkbox id="consent-cb" labelText={t('order.prepare.consent.recorded', 'Consent for collection recorded')} checked={consent} onChange={(_, { checked }) => setConsent(checked)} />
        </section>
      )}

      <section style={S.section}>
        {rows.some(r => r.proposed && !r.saved) && <InlineNotification kind="info" lowContrast hideCloseButton title={t('order.samples.proposedUnconfirmed', 'Proposed, not yet confirmed')} />}
        <SamplesTable loading={sim === 'loading'} mode="prepare" rows={rows} setRows={setRows} ot={ot} cfg={cfg} filter={filter} onNotify={setNotice} onAliquotFirst={n => setNotice({ text: suffixOf(n) })} canRefer={cfg.canRefer} requireCollection />
      </section>
      <LabelsSection rows={rows} ot={ot} cfg={cfg} onNotify={setNotice} />

      <OrderFooter loading={sim === 'loading'} nextStep={t('order.step.sampleCheck', 'Sample check')} isLast={isLast} items={items} saveProblems={saveProblems} saveHook={saveHook}
        onSaveExit={() => saveHook.save(() => go('dashboard'))} onSaveNext={finish}
        discard={{ everSaved: true, tests: 0, samples: rows.filter(r => !r.saved).length, onConfirm: () => setRows(init.rows) }}
        secondaryExtra={notice} />
    </div>
  );
}

/* ============================== SampleCheckPage (section F) ============================== */
// Route: /order/clinical/qa?id=<orderId>   Shown only when sampleAcceptCheck.clinical is Mandatory or Optional (FR-F1)
// SideNav: Orders & Patients -> Add Clinical Order (step 3 within the order, optional)
// Breadcrumb: Home / Orders / Clinical Orders / Sample check
// Panels always expanded (FR-B16b). One expandable row per sample; the checklist item sits BESIDE the recorded
// data it asks about (FR-F3b). The checklist items come from S-09 (Admin > Compliance > Sample Acceptance Checklist).
function PanelsReview({ ot, rows }) {
  const statusOf = e => {
    if (e.removed) return <span style={S.strike}>{fmt(t('order.tests.memberRemoved', '{test}, removed by {user} {time}'), { test: tShort(e.id), user: e.removed.by, time: e.removed.at })}</span>;
    if (e.cancelled) return <Tag size="sm" type="gray">{t('order.status.cancelled', 'Cancelled')}</Tag>;
    if (e.elsewhere.on) return <Tag size="sm" type="purple">{fmt(t('order.tests.testedElsewhereAt', 'Tested elsewhere: {lab}'), { lab: e.elsewhere.lab })}</Tag>;
    const h = hostOf(e.id, rows);
    if (h && h.referred.includes(e.id)) return <span><SuffixBadge num={h.num} /> <Tag size="sm" type="purple">{fmt(t('order.tests.referredTo', 'Referred to {lab}'), { lab: 'PNGIMR' })}</Tag></span>;
    if (h) return <SuffixBadge num={h.num} />;
    return <Tag size="sm" type="purple">{t('order.tests.awaiting', 'Awaiting sample')}</Tag>;
  };
  return (
    <section style={S.section} aria-labelledby="panels-h">
      <h3 id="panels-h" className="cds--type-productive-heading-03">{t('order.sampleCheck.panels.heading', 'Ordered panels and tests')}</h3>
      <Table size="xs" useZebraStyles={false}>
        <TableHead><TableRow><TableHeader>{t('common.tests', 'Tests')}</TableHeader><TableHeader>{t('common.status', 'Status')}</TableHeader></TableRow></TableHead>
        <TableBody>
          {panelsOf(ot).map(pid => {
            const pi = panelInfo(ot, pid);
            return (
              <React.Fragment key={pid}>
                <TableRow style={pi.modified ? { background: 'var(--cds-layer-accent-01)', borderLeft: '3px solid var(--cds-support-warning)' } : undefined}>
                  <TableCell colSpan={2}><strong>{fmt(t('order.tests.panelCount', '{panel}, {included} of {total} tests'), { panel: PANELS[pid].name, included: pi.on, total: pi.total })}</strong>{pi.modified && <Tag size="sm" type="warm-gray">{t('order.tests.panelModified', 'Modified')}</Tag>}</TableCell>
                </TableRow>
                {ot.filter(e => e.panels.includes(pid)).map(e => (
                  <TableRow key={`${pid}-${e.id}`}><TableCell style={{ paddingLeft: 'var(--cds-spacing-07)' }}>{e.removed ? '' : tName(e.id)}</TableCell><TableCell>{statusOf(e)}</TableCell></TableRow>
                ))}
              </React.Fragment>
            );
          })}
          {ot.filter(e => !e.panels.length).map(e => <TableRow key={e.id}><TableCell>{tName(e.id)}</TableCell><TableCell>{statusOf(e)}</TableCell></TableRow>)}
        </TableBody>
      </Table>
    </section>
  );
}

function SampleCheckPage({ cfg, acceptance, go, sim }) {
  const init = useMemo(() => {
    const p = prepareInit('complete');
    const ot = buildOrderedTests([...PREP_SPEC, 'MRDT'], true).map(e => (e.id === 'ALP' ? { ...e, cancelled: true, removed: { by: ME, at: '10:14' } }
      : e.id === 'MRDT' ? { ...e, elsewhere: { on: true, value: 'Negative', lab: 'Port Moresby General Hospital laboratory' } } : e));
    return { ot, rows: p.rows.filter(r => !r.parent).map(r => ({ ...r, tests: r.tests.filter(x => x !== 'ALP') })) };
  }, []);
  const [answers, setAnswers] = useState({ [`${LAB}-1`]: { identity: 'pass', container: 'pass', volume: 'pass' } });
  const [expanded, setExpanded] = useState({ [`${LAB}-1`]: true });
  const [proceedReason, setProceedReason] = useState('');
  const [returning, setReturning] = useState(null);
  const [nce, setNce] = useState(null);
  const saveHook = useStepSave(sim);
  const { ot, rows } = init;
  const itemsFor = r => CHECK_ITEMS.filter(i => !i.when || i.when(r));
  const answeredOf = r => itemsFor(r).filter(i => (answers[r.num] || {})[i.k]).length;
  const failedOf = r => itemsFor(r).filter(i => (answers[r.num] || {})[i.k] === 'fail');
  const unanswered = rows.some(r => answeredOf(r) < itemsFor(r).length);
  const failed = rows.flatMap(r => failedOf(r).map(i => ({ r, i })));
  const mandatory = acceptance === 'Mandatory';
  const prepareComplete = true; // mock: Prepare Samples is complete; otherwise Release names the missing items (FR-F3)
  const items = [
    ...(!prepareComplete ? [{ key: 'prep', label: fmt(t('order.sampleCheck.disabled.incomplete', 'Prepare Samples is not complete: {items}'), { items: '' }), target: 'samples-check' }] : []),
    ...failed.map(({ r, i }) => ({ key: `f-${r.num}-${i.k}`, label: fmt(t('order.sampleCheck.disabled.failed', '{item} failed on {sample}. Report a non-conformity or request a new sample.'), { item: i.l, sample: suffixOf(r.num) }), target: `chk-${r.num}` })),
    ...(mandatory && unanswered ? rows.filter(r => answeredOf(r) < itemsFor(r).length).map(r => ({ key: `u-${r.num}`, label: fmt(t('order.sampleCheck.answerFor', 'Answer the checklist for {sample}'), { sample: r.num }), target: `chk-${r.num}` })) : []),
    ...(!mandatory && unanswered && !proceedReason ? [{ key: 'reason', label: t('order.sampleCheck.proceedReason', 'Reason for accepting with unanswered items'), target: 'proceed-reason' }] : []),
  ];
  const minOf = (id, c) => { const x = TESTS[id]; const sp = x && x.ct.find(y => y.c === c); return sp && sp.min ? parseFloat(sp.min) : 0; };
  const evidence = (r, k) => {
    const p = PATIENTS[0];
    if (k === 'identity') return <span>{`${p.name} · ${p.dob} · `}<span style={S.mono}>{p.nid}</span>{' · '}<span style={S.mono}>{r.num}</span></span>;
    if (k === 'container') {
      const exp = [...new Set(r.tests.map(id => TESTS[id].ct[0] && CONTAINERS[TESTS[id].ct[0].c].short).filter(Boolean))];
      return <span><CapSwatch c={r.c} />{`${CONTAINERS[r.c].short} · ${t('order.tests.col.expected', 'Expected container')}: ${exp.join(', ')}`}</span>;
    }
    if (k === 'volume') {
      const mins = r.tests.map(id => ({ id, v: minOf(id, r.c) })).filter(x => x.v);
      if (!r.qty) return <Link href="#" onClick={e => { e.preventDefault(); go('prepare'); }}>{t('order.sampleCheck.notRecorded', 'Not recorded. Add it in Prepare Samples.')}</Link>;
      const groupMax = {}; mins.forEach(x => { const g = (ot.find(e => e.id === x.id) || { panels: [] }).panels[0] || x.id; groupMax[g] = Math.max(groupMax[g] || 0, x.v); });
      const total = Object.values(groupMax).reduce((a, b) => a + b, 0);
      return (
        <span>
          {Object.keys(groupMax).map(g => <span key={g} style={{ display: 'block' }}>{fmt(t('order.sampleCheck.minVolume', '{test} needs at least {volume}'), { test: PANELS[g] ? PANELS[g].name : tName(g), volume: `${groupMax[g]} mL` })}</span>)}
          <strong>{fmt(t('order.sampleCheck.totalVolume', 'Tests on this sample need {total} in all; recorded {recorded}'), { total: `${total} mL`, recorded: `${r.qty} ${r.unit}` })}</strong>
        </span>
      );
    }
    if (k === 'timing') { const h = holdingTag(r, RECEIVED_AT); return <span>{`${t('common.collected', 'Collected')} ${fmtDT(r.coll.at)} · ${t('common.received', 'Received')} ${fmtDT(RECEIVED_AT)}`} {h && <Tag size="sm" type={h.kind}>{h.text}</Tag>}</span>; }
    if (k === 'site') return r.site ? <span>{specimenString(r)}</span> : <Link href="#" onClick={e => { e.preventDefault(); go('prepare'); }}>{t('order.sampleCheck.notRecorded', 'Not recorded. Add it in Prepare Samples.')}</Link>;
    if (k === 'condition') return r.status.includes('Non-conformity') ? <Tag size="sm" type="warm-gray" renderIcon={WarningAlt}>{t('order.samples.status.nonconformity', 'Non-conformity')}</Tag> : <span style={S.muted}>{t('order.sampleCheck.noneReported', 'No non-conformity reported')}</span>;
    return null;
  };
  const releaseDisabled = items.length > 0;
  const releaseTip = releaseDisabled ? items.map(i => i.label).join('; ') : t('order.sampleCheck.release', 'Release for testing');

  return (
    <div>
      <PageHeader crumbs={[t('nav.home', 'Home'), t('nav.orders', 'Orders'), t('nav.clinicalOrders', 'Clinical Orders'), t('order.step.sampleCheck', 'Sample check')]} title={t('order.step.sampleCheck', 'Sample check')} />
      <OrderProgressIndicator steps={orderSteps(acceptance, [stepDone('10:42'), stepDone('10:58'), stepCurrent(items.length)])} onOpen={k => go(k)} />
      <OrderSummaryStrip patient={PATIENTS[0]} facility={FACILITIES[0]} ward="Medical Ward 3" provider={PROVIDERS[0]} ot={ot} rows={rows} received />
      <PanelsReview ot={ot} rows={rows} />

      <section id="samples-check" style={S.section}>
        <Fence owner="S-09" name={t('mockup.fence.checklist', 'Sample acceptance checklist (items and answers)')} note={t('mockup.fence.checklistNote', 'New here: evidence beside each item and the item-to-field mapping (Dependency 27).')}>
          <Table size="xs" useZebraStyles={false}>
            <TableHead>
              <TableRow>
                <TableExpandHeader aria-label={t('order.samples.details', 'Details')} />
                <TableHeader>{t('order.samples.col.number', 'Sample number')}</TableHeader>
                <TableHeader>{t('order.samples.col.container', 'Container')}</TableHeader>
                <TableHeader>{t('common.sampleType', 'Sample type')}</TableHeader>
                <TableHeader>{t('common.tests', 'Tests')}</TableHeader>
                <TableHeader>{t('order.sampleCheck.col.checklist', 'Checklist')}</TableHeader>
                <TableHeader><span className="cds--visually-hidden">{t('common.actions', 'Actions')}</span></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(r => {
                const f = failedOf(r);
                return (
                  <React.Fragment key={r.num}>
                    <TableExpandRow id={`chk-${r.num}`} isExpanded={!!expanded[r.num]} onExpand={() => setExpanded({ ...expanded, [r.num]: !expanded[r.num] })} expandIconDescription={t('order.samples.details', 'Details')}>
                      <TableCell><SuffixBadge num={r.num} full /></TableCell>
                      <TableCell><CapSwatch c={r.c} />{CONTAINERS[r.c].short}</TableCell>
                      <TableCell>{r.st}</TableCell>
                      <TableCell>{groupNames(r.tests, ot)}</TableCell>
                      <TableCell>
                        {f.length ? <Tag size="sm" type="red">{fmt(t('order.sampleCheck.failedCount', '{count} failed'), { count: f.length })}</Tag>
                          : fmt(t('order.sampleCheck.answered', '{answered} of {total} answered'), { answered: answeredOf(r), total: itemsFor(r).length })}
                      </TableCell>
                      <TableCell><IconButton kind="ghost" size="sm" label={t('order.nce.title', 'Report non-conformity')} onClick={() => setNce(r.num)}><WarningAlt /></IconButton></TableCell>
                    </TableExpandRow>
                    {expanded[r.num] && (
                      <TableExpandedRow colSpan={7}>
                        <Table size="xs" useZebraStyles={false}>
                          <TableBody>
                            {itemsFor(r).map(i => (
                              <TableRow key={i.k}>
                                <TableCell style={{ width: '28%' }}>{i.l}</TableCell>
                                <TableCell>{evidence(r, i.k)}</TableCell>
                                <TableCell style={{ width: 200 }}>
                                  <RadioButtonGroup legendText={i.l} hideLegend name={`a-${r.num}-${i.k}`} valueSelected={(answers[r.num] || {})[i.k]} onChange={v => setAnswers({ ...answers, [r.num]: { ...(answers[r.num] || {}), [i.k]: v } })}>
                                    <RadioButton id={`a-${r.num}-${i.k}-p`} value="pass" labelText={t('order.sampleCheck.pass', 'Pass')} />
                                    <RadioButton id={`a-${r.num}-${i.k}-f`} value="fail" labelText={t('order.sampleCheck.fail', 'Fail')} />
                                  </RadioButtonGroup>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableExpandedRow>
                    )}
                    {nce === r.num && <TableRow><TableCell colSpan={7}><NcePanel nums={[r.num]} rows={rows} onApply={() => setNce(null)} onCancel={() => setNce(null)} /></TableCell></TableRow>}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Fence>
      </section>

      {/* FR-F4: under Optional, releasing with unanswered items asks for a reason and records who, when and why */}
      {!mandatory && unanswered && (
        <TextArea id="proceed-reason" labelText={reqLabel(t('order.sampleCheck.proceedReason', 'Reason for accepting with unanswered items'), true)} rows={2} value={proceedReason} onChange={e => setProceedReason(e.target.value)} />
      )}
      {returning !== null && (
        <div style={{ ...S.panelBox, marginTop: 16 }}>
          <TextInput id="return-reason" labelText={reqLabel(t('order.sampleCheck.return.reason', 'Reason for returning'), true)} value={returning} onChange={e => setReturning(e.target.value)} />
          <Button size="sm" kind="primary" disabled={!returning} onClick={() => go('prepare')}>{t('order.sampleCheck.return', 'Return to Prepare Samples')}</Button>
          <Button size="sm" kind="ghost" onClick={() => setReturning(null)}>{t('common.cancel', 'Cancel')}</Button>
        </div>
      )}

      <OrderFooter nextStep={t('order.sampleCheck.release', 'Release for testing')} isLast items={items} saveProblems={[]} saveHook={saveHook}
        onSaveExit={() => saveHook.save(() => go('dashboard'))} onSaveNext={() => {}}
        discard={{ everSaved: true, tests: 0, samples: 0, onConfirm: () => setAnswers({}) }}
        secondaryExtra={<Button kind="tertiary" size="md" renderIcon={Undo} onClick={() => setReturning('')}>{t('order.sampleCheck.return', 'Return to Prepare Samples')}</Button>}
        primaryOverride={(
          <Tooltip label={releaseTip} align="top">
            <Button kind="primary" disabled={releaseDisabled || saveHook.state.status === 'saving'}
              onClick={() => saveHook.save(() => go('dashboard'), fmt(t('order.sampleCheck.released', 'Order {labNo} is ready for testing.'), { labNo: LAB }))}>
              {t('order.sampleCheck.release', 'Release for testing')}
            </Button>
          </Tooltip>
        )} />
    </div>
  );
}

/* ============================== OrderDashboard (FR-H1 to FR-H4, FR-A4, FR-A12) ============================== */
// Route: /order/clinical
// SideNav: Orders & Patients -> Add Clinical Order
// Breadcrumb: Home / Orders / Clinical Orders
// Replaces the removed labelling and storage step as a queue. Modify Order is merged (FR-H3).
const ORDERS = [
  { lab: '26CPHL00471', ref: 'PMGH-MW3-1187', pat: 'Kila Morea', nid: 'PNG-8814-2209', fac: 'Port Moresby General Hospital', status: 'Entered', tests: 14, awaiting: 0, samples: 4, ago: '12 min', flags: ['inProgress', 'notStored', 'unpaid'], prog: [stepDone('10:42'), stepInProgress(1), stepNotStarted()] },
  { lab: '26CPHL00470', ref: 'GGH-GW-0442', pat: 'Tom Kaupa', nid: 'PNG-7702-1183', fac: 'Gerehu General Hospital', status: 'Samples prepared', tests: 5, awaiting: 0, samples: 2, ago: '25 min', flags: ['inProgress', 'awaitingCheck', 'notStored'], prog: [stepDone('10:20'), stepDone('10:31'), stepNotStarted()] },
  { lab: '26CPHL00469', ref: '9MC-0311', pat: 'Grace Siaguru', nid: 'PNG-9305-4410', fac: '9-Mile Clinic', status: 'Entered', tests: 3, awaiting: 1, samples: 1, ago: '41 min', flags: ['inProgress', 'awaiting', 'unpaid'], prog: [stepDone('10:13'), stepInProgress(1), stepNotStarted()] },
  { lab: '26CPHL00468', ref: 'PMGH-ED-2290', pat: 'Peter Aihi', nid: 'PNG-6511-0937', fac: 'Port Moresby General Hospital', status: 'Samples prepared', tests: 8, awaiting: 0, samples: 3, ago: '1 h 05 min', flags: ['inProgress', 'awaitingCheck'], prog: [stepDone('09:49'), stepDone('10:02'), stepNotStarted()], refer: { n: 2, to: 'PNGIMR', st: 'in transit' } },
  { lab: '26CPHL00465', ref: 'KKC-TB-0154', pat: 'Martha Poka', nid: 'PNG-0004-1845', fac: 'Kila Kila Clinic', status: 'Entered', tests: 9, awaiting: 1, samples: 4, ago: '2 h 20 min', flags: ['inProgress', 'awaiting'], prog: [stepDone('08:31'), stepAttention(fmt(t('order.step.reason.rejected', 'Sample {sample} rejected'), { sample: '-2' })), stepNotStarted()] },
  { lab: '26CPHL00464', ref: 'GGH-OPD-1020', pat: 'Samuel Maip', nid: 'PNG-7207-6620', fac: 'Gerehu General Hospital', status: 'Ready for testing', tests: 4, awaiting: 0, samples: 2, ago: '3 h', flags: [], prog: [stepDone('07:52'), stepDone('08:05'), stepDone('08:20')], refer: { n: 1, to: 'PNGIMR', st: 'received by PNGIMR, results pending' } },
  { lab: '26CPHL00463', ref: 'PMGH-MW1-0876', pat: 'Lucy Wama', nid: 'PNG-9910-0051', fac: 'Port Moresby General Hospital', status: 'Ready for testing', tests: 5, awaiting: 0, samples: 2, ago: '3 h 35 min', flags: [], prog: [stepDone('07:16'), stepDone('07:30'), stepDone('07:41')], refer: { n: 3, to: 'PNGIMR', st: 'results received', done: true } },
  { lab: '26CPHL00462', ref: 'PMGH-MW1-0877', pat: 'Lucy Wama', nid: 'PNG-9910-0051', fac: 'Port Moresby General Hospital', status: 'Cancelled', tests: 2, awaiting: 0, samples: 0, ago: '3 h 40 min', flags: [], prog: [stepAttention('Cancelled'), stepNotStarted(), stepNotStarted()] },
];
const STATUS_TAG = { Entered: 'blue', 'Samples prepared': 'teal', 'Ready for testing': 'green', Cancelled: 'gray' };
const STATUS_TKEY = { Entered: 'order.status.entered', 'Samples prepared': 'order.status.samplesPrepared', 'Ready for testing': 'order.status.readyForTesting', Cancelled: 'order.status.cancelled' };
const hasFlag = (o, k) => (k === 'hasReferred' ? !!o.refer : k === 'referPending' ? !!(o.refer && !o.refer.done) : k === 'cancelled' ? o.status === 'Cancelled' : o.flags.includes(k));

function OrderDashboard({ cfg, acceptance, go }) {
  const [orders, setOrders] = useState(ORDERS);
  const [filter, setFilter] = useState(null);
  const [q, setQ] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [reason, setReason] = useState('');
  const FILTERS = [
    ['inProgress', t('common.inProgress', 'In progress')],
    ['awaiting', t('order.tests.awaiting', 'Awaiting sample')],
    ['notStored', t('order.dashboard.filter.notStored', 'Not stored')],
    ['hasReferred', t('order.dashboard.filter.hasReferred', 'Has referred tests')],
    ['referPending', t('order.dashboard.filter.referralPending', 'Referral results pending')],
    ...(acceptance !== 'Off' ? [['awaitingCheck', t('order.dashboard.filter.awaitingSampleCheck', 'Awaiting sample check')]] : []),
    ...(cfg.billingRefNumber || cfg.trackPayment ? [['unpaid', t('order.dashboard.filter.unpaid', 'Unpaid')]] : []),
    ['cancelled', t('order.status.cancelled', 'Cancelled')],
  ];
  const lc = s => s.toLowerCase();
  const shown = orders.filter(o => (filter ? hasFlag(o, filter) : (showCancelled || o.status !== 'Cancelled')) && (!q || lc(`${o.lab} ${o.pat} ${o.nid} ${o.ref}`).includes(lc(q))));
  const headers = [
    { key: 'lab', header: t('common.labNumber', 'Lab number') }, { key: 'pat', header: t('common.patient', 'Patient') }, { key: 'fac', header: t('order.requester.facility', 'Requesting facility') },
    { key: 'progress', header: t('order.dashboard.progress', 'Progress') }, { key: 'status', header: t('common.status', 'Status') }, { key: 'tests', header: t('common.tests', 'Tests') },
    { key: 'samples', header: t('order.dashboard.samples', 'Samples') }, { key: 'ago', header: t('order.dashboard.entered', 'Entered') }, { key: 'actions', header: '' },
  ];
  const tableRows = shown.map(o => ({ id: o.lab, lab: o.lab, pat: o.pat, fac: o.fac, ago: o.ago }));
  const cell = (o, key) => {
    if (key === 'lab') return <span><strong style={S.mono}>{o.lab}</strong><div style={S.muted}>{o.ref}</div></span>;
    if (key === 'pat') return <span>{o.pat}<div style={{ ...S.muted, ...S.mono }}>{o.nid}</div></span>;
    if (key === 'progress') {
      return (
        <span>
          <OrderProgressIndicator compact steps={orderSteps(acceptance, o.prog)} />
          {/* FR-H4: split orders show the referral stream on its own line */}
          {o.refer && <div style={S.muted}><SendAlt size={12} aria-hidden="true" />{' '}{fmt(t('order.dashboard.referralLine', '{count} tests referred to {lab}, {status}'), { count: o.refer.n, lab: o.refer.to, status: o.refer.st })}</div>}
        </span>
      );
    }
    if (key === 'status') return <Tag size="sm" type={STATUS_TAG[o.status]}>{t(STATUS_TKEY[o.status], o.status)}</Tag>;
    if (key === 'tests') return <span>{o.tests}{o.awaiting > 0 && <Tag size="sm" type="purple">{fmt(t('order.dashboard.awaitingCount', '{count} awaiting'), { count: o.awaiting })}</Tag>}</span>;
    if (key === 'samples') return o.samples;
    if (key === 'actions') {
      const complete = o.status === 'Ready for testing' || (acceptance === 'Off' && o.status === 'Samples prepared');
      return (
        <span style={{ display: 'inline-flex', gap: 4 }}>
          {o.status !== 'Cancelled' && <Button kind="ghost" size="sm" onClick={() => go(o.status === 'Entered' ? 'prepare' : o.status === 'Samples prepared' && acceptance !== 'Off' ? 'check' : 'enter')}>{t('common.open', 'Open')}</Button>}
          {o.status !== 'Cancelled' && (
            <Tooltip label={complete ? t('order.dashboard.cancel.complete', 'A complete order cannot be cancelled.') : t('order.dashboard.cancelOrder', 'Cancel order')} align="left">
              <span><Button kind="danger--ghost" size="sm" disabled={complete} onClick={() => { setCancelling(o.lab); setReason(''); }}>{t('order.dashboard.cancelOrder', 'Cancel order')}</Button></span>
            </Tooltip>
          )}
        </span>
      );
    }
    return o[key];
  };
  return (
    <div>
      <PageHeader crumbs={[t('nav.home', 'Home'), t('nav.orders', 'Orders'), t('nav.clinicalOrders', 'Clinical Orders')]} title={t('nav.clinicalOrders', 'Clinical Orders')}
        actions={<Button renderIcon={Add} onClick={() => go('enter')}>{t('order.dashboard.newOrder', 'New order')}</Button>} />
      <InlineNotification kind="info" lowContrast title={t('order.dashboard.modifyMoved', 'Modify Order has moved here. Open an order to change it.')} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: 'var(--cds-spacing-05) 0' }} role="group" aria-label={t('order.dashboard.filters', 'Quick filters')}>
        {FILTERS.map(([k, label]) => (
          <Button key={k} size="sm" kind={filter === k ? 'primary' : 'tertiary'} aria-pressed={filter === k} onClick={() => setFilter(filter === k ? null : k)}>
            {`${label} (${orders.filter(o => hasFlag(o, k)).length})`}
          </Button>
        ))}
      </div>
      <DataTable rows={tableRows} headers={headers} size="sm" useZebraStyles={false}>
        {({ rows, headers: hs, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer>
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch persistent placeholder={t('order.dashboard.search', 'Search by lab number, patient or referring lab number')} onChange={e => setQ(e && e.target ? e.target.value : '')} />
                <Toggle id="dash-cancelled" size="sm" labelText={t('common.showCancelled', 'Show cancelled')} labelA="" labelB="" toggled={showCancelled} onToggle={setShowCancelled} />
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead><TableRow>{hs.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}</TableRow></TableHead>
              <TableBody>
                {rows.map(r => {
                  const o = orders.find(x => x.lab === r.id);
                  return (
                    <React.Fragment key={r.id}>
                      <TableRow {...getRowProps({ row: r })}>{headers.map(h => <TableCell key={h.key}>{cell(o, h.key)}</TableCell>)}</TableRow>
                      {cancelling === r.id && (
                        <TableRow>
                          <TableCell colSpan={headers.length}>
                            <div style={{ ...S.row, ...S.panelBox }}>
                              <TextInput id="dash-cancel-reason" labelText={reqLabel(t('order.dashboard.cancel.reason', 'Reason for cancelling'), true)} required value={reason} onChange={e => setReason(e.target.value)} style={{ minWidth: 320 }} />
                              <Button kind="danger" size="md" disabled={!reason} onClick={() => { setOrders(orders.map(x => (x.lab === r.id ? { ...x, status: 'Cancelled', prog: [stepAttention(t('order.status.cancelled', 'Cancelled')), stepNotStarted(), stepNotStarted()] } : x))); setCancelling(null); }}>{t('common.confirm', 'Confirm')}</Button>
                              <Button kind="ghost" size="md" onClick={() => setCancelling(null)}>{t('common.cancel', 'Cancel')}</Button>
                              <span style={S.muted}>{t('order.dashboard.cancel.effect', 'Tests are marked Cancelled and samples are voided with this reason. Nothing is deleted.')}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
}

/* ============================== ContainerTypesAdmin (FR-G1 to FR-G4) ============================== */
// Route: /admin/TestCatalogList?entity=containertypes
// SideNav: Admin -> Config -> Test Catalog -> Container Types (after Sample Types)
// Breadcrumb: Home / Admin Management / Test Catalog / Container Types
// Inline row expansion for add and edit. Deactivated, never deleted (MUST D).
const DOMAINS = ['Clinical', 'Environmental', 'Vector'];
const ALL_SAMPLE_TYPES = [...new Set(Object.values(CONTAINERS).flatMap(c => c.yields))].sort();
function ContainerTypeForm({ ct, onSave, onCancel, onDeactivate }) {
  const [v, setV] = useState(ct);
  const [confirmDeact, setConfirmDeact] = useState(false);
  return (
    <Stack gap={5}>
      <Grid condensed style={{ paddingInline: 0 }}>
        <Column sm={4} md={4} lg={6}><TextInput id="ct-name" labelText={reqLabel(t('common.name', 'Name'), true)} required value={v.name} onChange={e => setV({ ...v, name: e.target.value })} /></Column>
        <Column sm={2} md={2} lg={3}><TextInput id="ct-code" labelText={reqLabel(t('common.code', 'Code'), true)} required value={v.code} onChange={e => setV({ ...v, code: e.target.value })} /></Column>
        <Column sm={4} md={4} lg={7}>
          {/* D-004: one or more domains, never a combined value */}
          <FilterableMultiSelect id="ct-domain" titleText={reqLabel(t('admin.containerType.domain', 'Domain'), true)} items={DOMAINS} itemToString={x => x || ''} initialSelectedItems={v.domain} onChange={({ selectedItems }) => setV({ ...v, domain: selectedItems })} />
        </Column>
        <Column sm={4} md={4} lg={5}><TextInput id="ct-add" labelText={t('admin.containerType.additive', 'Additive')} helperText={t('admin.containerType.additive.help', 'The preservative, for environmental containers')} value={v.additive} onChange={e => setV({ ...v, additive: e.target.value })} /></Column>
        <Column sm={4} md={4} lg={4}><TextInput id="ct-mat" labelText={t('admin.containerType.material', 'Material')} value={v.material} onChange={e => setV({ ...v, material: e.target.value })} /></Column>
        <Column sm={4} md={4} lg={3}><TextInput id="ct-vol" labelText={t('admin.containerType.volume', 'Nominal volume')} value={v.vol} onChange={e => setV({ ...v, vol: e.target.value })} /></Column>
        <Column sm={4} md={4} lg={4}>
          <span className="cds--label">{t('admin.containerType.cap', 'Cap colour')}</span>
          {/* Colour picker value is catalog data (display-only, editable per deployment, ISO 6710 default) */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" aria-label={t('admin.containerType.cap', 'Cap colour')} value={v.cap || '#ffffff'} onChange={e => setV({ ...v, cap: e.target.value })} />
            <TextInput id="ct-capname" size="sm" labelText={t('admin.containerType.capName', 'Colour name')} hideLabel placeholder={t('admin.containerType.capName', 'Colour name')} value={v.capName} onChange={e => setV({ ...v, capName: e.target.value })} />
          </div>
        </Column>
        <Column sm={4} md={4} lg={4}>
          <Select id="ct-cat" labelText={t('common.category', 'Category')} value={v.category} onChange={e => setV({ ...v, category: e.target.value })}>
            {['Blood', 'Blood culture', 'Swab', 'Urine', 'Stool', 'Respiratory', 'Water', 'Other'].map(c => <SelectItem key={c} value={c} text={c} />)}
          </Select>
        </Column>
        <Column sm={4} md={8} lg={8}>
          <FilterableMultiSelect id="ct-yields" titleText={reqLabel(t('admin.containerType.yields', 'Sample types it yields'), true)} items={ALL_SAMPLE_TYPES} itemToString={x => x || ''} initialSelectedItems={v.yields} onChange={({ selectedItems }) => setV({ ...v, yields: selectedItems })} />
        </Column>
        <Column sm={4} md={4} lg={4}><TextInput id="ct-std" labelText={t('admin.containerType.standardCode', 'Standard code')} helperText={t('admin.containerType.standardCode.help', 'Optional, for FHIR')} value={v.std || ''} onChange={e => setV({ ...v, std: e.target.value })} /></Column>
        <Column sm={4} md={4} lg={4}><Toggle id="ct-active" labelText={t('common.active', 'Active')} labelA="" labelB="" toggled={v.active} onToggle={a => { if (!a && v.samples) setConfirmDeact(true); else setV({ ...v, active: a }); }} /></Column>
      </Grid>
      {confirmDeact && (
        <ActionableNotification inline kind="warning" lowContrast
          title={fmt(t('admin.containerType.deactivate.warn', 'Used by {count} tests ({names}) and {samples} samples. Existing samples keep it; it can no longer be proposed or chosen.'), { count: v.usedN, names: `${v.usedBy.slice(0, 2).join(', ')}${v.usedN > 2 ? `, ... ${fmt(t('admin.containerType.andMore', 'and {n} more'), { n: v.usedN - 2 })}` : ''}`, samples: v.samples.toLocaleString('en-US') })}
          actionButtonLabel={t('common.deactivate', 'Deactivate')} onActionButtonClick={() => { setV({ ...v, active: false }); setConfirmDeact(false); onDeactivate && onDeactivate(); }} onClose={() => setConfirmDeact(false)} />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button size="sm" onClick={() => onSave(v)} disabled={!v.name || !v.code || !v.domain.length}>{t('common.save', 'Save')}</Button>
        <Button size="sm" kind="ghost" onClick={onCancel}>{t('common.cancel', 'Cancel')}</Button>
      </div>
    </Stack>
  );
}
function ContainerTypesAdmin() {
  const [list, setList] = useState(() => Object.keys(CONTAINERS).map(k => ({ id: k, ...CONTAINERS[k] })));
  const [domain, setDomain] = useState('');
  const [category, setCategory] = useState('');
  const [showDeact, setShowDeact] = useState(false);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const shown = list.filter(c => (showDeact || c.active) && (!domain || c.domain.includes(domain)) && (!category || c.category === category) && (!q || `${c.name} ${c.code} ${c.additive}`.toLowerCase().includes(q.toLowerCase())));
  const headers = ['name', 'domain', 'additive', 'material', 'vol', 'cap', 'yields', 'category', 'usedBy', 'status'].map(key => ({
    key, header: { name: t('common.name', 'Name'), domain: t('admin.containerType.domain', 'Domain'), additive: t('admin.containerType.additive', 'Additive'), material: t('admin.containerType.material', 'Material'), vol: t('admin.containerType.volume', 'Nominal volume'), cap: t('admin.containerType.cap', 'Cap colour'), yields: t('admin.containerType.yields', 'Sample types it yields'), category: t('common.category', 'Category'), usedBy: t('admin.containerType.usedBy', 'Used by'), status: t('common.status', 'Status') }[key],
  }));
  const blank = { id: `new-${list.length}`, name: '', code: '', domain: ['Clinical'], additive: '', material: '', vol: '', cap: '#ffffff', capName: '', yields: [], category: 'Blood', usedBy: [], usedN: 0, samples: 0, active: true };
  const cell = (c, key) => {
    if (key === 'domain') return c.domain.map(d => <Tag key={d} size="sm" type="gray">{d}</Tag>);
    if (key === 'cap') return <span><CapSwatch c={c.id} />{c.capName}</span>;
    if (key === 'yields') return c.yields.map(y => <Tag key={y} size="sm" type="cool-gray">{y}</Tag>);
    if (key === 'usedBy') return fmt(t('admin.containerType.usedByCount', '{count} tests'), { count: c.usedN });
    if (key === 'status') return c.active ? <Tag size="sm" type="green">{t('common.active', 'Active')}</Tag> : <Tag size="sm" type="gray">{t('admin.deactivated', 'Deactivated')}</Tag>;
    return c[key];
  };
  return (
    <div>
      <PageHeader crumbs={[t('nav.home', 'Home'), t('nav.adminManagement', 'Admin Management'), t('nav.testCatalog', 'Test Catalog'), t('admin.containerType.title', 'Container Types')]} title={t('admin.containerType.title', 'Container Types')}
        subtitle={t('admin.containerType.seeded', 'Pre-seeded with ISO 6710 cap colours. Upgrades never overwrite an edited container type.')}
        actions={<Button renderIcon={Add} onClick={() => { setList([blank, ...list]); setEditing(blank.id); }}>{t('admin.containerType.add', 'Add container type')}</Button>} />
      <DataTable rows={shown.map(c => ({ id: c.id, name: c.name }))} headers={headers} size="sm" useZebraStyles={false}>
        {({ rows, headers: hs, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer>
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch persistent placeholder={t('admin.containerType.search', 'Search container types')} onChange={e => setQ(e && e.target ? e.target.value : '')} />
                <Select id="ct-f-domain" size="md" inline labelText={t('admin.containerType.domain', 'Domain')} value={domain} onChange={e => setDomain(e.target.value)}>
                  <SelectItem value="" text={t('common.all', 'All')} />{DOMAINS.map(d => <SelectItem key={d} value={d} text={d} />)}
                </Select>
                <Select id="ct-f-cat" size="md" inline labelText={t('common.category', 'Category')} value={category} onChange={e => setCategory(e.target.value)}>
                  <SelectItem value="" text={t('common.all', 'All')} />{[...new Set(list.map(c => c.category))].map(c => <SelectItem key={c} value={c} text={c} />)}
                </Select>
                <Toggle id="ct-deact" size="sm" labelText={t('common.showDeactivated', 'Show deactivated')} labelA="" labelB="" toggled={showDeact} onToggle={setShowDeact} />
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead><TableRow><TableExpandHeader aria-label={t('common.edit', 'Edit')} />{hs.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}</TableRow></TableHead>
              <TableBody>
                {rows.map(r => {
                  const c = list.find(x => x.id === r.id);
                  return (
                    <React.Fragment key={r.id}>
                      <TableExpandRow {...getRowProps({ row: r })} isExpanded={editing === r.id} onExpand={() => setEditing(editing === r.id ? null : r.id)} expandIconDescription={t('common.edit', 'Edit')}>
                        {headers.map(h => <TableCell key={h.key}>{cell(c, h.key)}</TableCell>)}
                      </TableExpandRow>
                      {editing === r.id && (
                        <TableExpandedRow colSpan={headers.length + 1}>
                          <ContainerTypeForm ct={c} onCancel={() => setEditing(null)} onSave={v => { setList(list.map(x => (x.id === v.id ? v : x))); setEditing(null); }} />
                        </TableExpandedRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
}

/* ============================== Test editor: TestEditorContainers and TestEditorBodySite (FR-G5, FR-G6, FR-G6b, FR-N3) ============================== */
// Route: /MasterListsPage/TestCatalogEditor/* (existing editor; these are two new sections, hosted by OGC-949)
// SideNav: Admin -> Config -> Test Catalog -> Tests
// Breadcrumb: Home / Admin Management / Test Catalog / Tests / <test>
const CAN_BE_USED_AS = { Serum: ['lihep', 'pst'] }; // containers yielding another type that may be marked "Can be used as"
const EDITOR_SEED = {
  CREA: { own: false, list: [{ c: 'sst', n: 1, min: '0.5', unit: 'mL' }, { c: 'pst', n: 1, min: '', unit: 'mL', usedAs: true }], site: '', lock: false },
  WCUL: { own: false, list: [{ c: 'amies', n: 1, min: '', unit: 'mL' }, { c: 'eswab', n: 1, min: '', unit: 'mL' }], site: '', lock: false },
  TCUL: { own: false, list: [{ c: 'eswab', n: 1, min: '', unit: 'mL' }, { c: 'amies', n: 1, min: '', unit: 'mL' }], site: 'throat', lock: true },
};
function TestEditorContainers({ test, value, onChange }) {
  const st = test.st;
  const inList = k => value.list.some(x => x.c === k);
  const yieldsSt = CLINICAL_CONTAINERS.filter(k => CONTAINERS[k].yields.includes(st) && !inList(k));
  const usedAsOpts = (CAN_BE_USED_AS[st] || []).filter(k => !CONTAINERS[k].yields.includes(st) && !inList(k));
  const setRow = (i, patch) => onChange({ ...value, list: value.list.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const secondary = value.list.filter(x => x.usedAs);
  return (
    <section style={S.section} aria-labelledby="tc-containers-h">
      <h3 id="tc-containers-h" className="cds--type-productive-heading-03">{t('testCatalog.containers.heading', 'Containers')}</h3>
      {/* FR-G6b: primary and secondary sample types are visible */}
      <p>
        <Tag size="sm" type="blue">{t('testCatalog.sampleType.primary', 'Primary')}</Tag>{st}{' '}
        {secondary.map(x => <Tag key={x.c} size="sm" type="gray">{`${t('testCatalog.sampleType.secondary', 'Secondary')}: ${fmt(t('testCatalog.sampleType.secondaryVia', '{sampleType}, via {container}, used as {primary}'), { sampleType: CONTAINERS[x.c].yields[0], container: CONTAINERS[x.c].short, primary: st })}`}</Tag>)}
      </p>
      <Table size="xs" useZebraStyles={false}>
        <TableHead><TableRow>{[t('order.samples.col.container', 'Container'), t('testCatalog.containers.role', 'Role'), t('testCatalog.containers.count', 'Count'), t('testCatalog.containers.minVolume', 'Minimum volume'), t('common.unit', 'Unit'), ''].map((h, i) => <TableHeader key={i}>{h}</TableHeader>)}</TableRow></TableHead>
        <TableBody>
          {value.list.map((x, i) => (
            <TableRow key={x.c}>
              <TableCell><CapSwatch c={x.c} />{CONTAINERS[x.c].name}{x.usedAs && <Tag size="sm" type="gray">{fmt(t('testCatalog.containers.usedAs', 'Used as {sampleType}'), { sampleType: st })}</Tag>}</TableCell>
              <TableCell>{i === 0 ? <Tag size="sm" type="blue">{t('testCatalog.containers.preferred', 'Preferred')}</Tag> : <Tag size="sm" type="gray">{t('testCatalog.containers.alternate', 'Alternate')}</Tag>}</TableCell>
              <TableCell><NumberInput id={`tc-n-${x.c}`} size="sm" hideLabel label={t('testCatalog.containers.count', 'Count')} min={1} max={6} value={x.n} onChange={(_, { value: v }) => setRow(i, { n: Number(v) || 1 })} style={{ width: 96 }} /></TableCell>
              <TableCell><TextInput id={`tc-min-${x.c}`} size="sm" hideLabel labelText={t('testCatalog.containers.minVolume', 'Minimum volume')} value={x.min} onChange={e => setRow(i, { min: e.target.value })} /></TableCell>
              <TableCell>
                <Select id={`tc-u-${x.c}`} size="sm" hideLabel labelText={t('common.unit', 'Unit')} value={x.unit} onChange={e => setRow(i, { unit: e.target.value })}>{['mL', 'µL'].map(u => <SelectItem key={u} value={u} text={u} />)}</Select>
              </TableCell>
              <TableCell>
                {/* A can-be-used-as container can never be Preferred (FR-G6): Make preferred is disabled for it */}
                {i > 0 && <Button kind="ghost" size="sm" disabled={x.usedAs} onClick={() => onChange({ ...value, list: [x, ...value.list.filter((_, j) => j !== i)] })}>{t('testCatalog.containers.makePreferred', 'Make preferred')}</Button>}
                <IconButton kind="ghost" size="sm" label={t('common.remove', 'Remove')} onClick={() => onChange({ ...value, list: value.list.filter((_, j) => j !== i) })}><TrashCan /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div style={{ ...S.row, marginTop: 'var(--cds-spacing-04)' }}>
        <Select id="tc-add" labelText={t('testCatalog.containers.add', 'Add container')} value="" onChange={e => { const [k, used] = e.target.value.split('|'); if (k) onChange({ ...value, list: [...value.list, { c: k, n: 1, min: '', unit: 'mL', usedAs: !!used }] }); }}>
          <SelectItem value="" text={t('common.choose', 'Choose')} />
          <SelectItemGroup label={fmt(t('testCatalog.containers.yieldsGroup', 'Yield {sampleType}'), { sampleType: st })}>{yieldsSt.map(k => <SelectItem key={k} value={k} text={CONTAINERS[k].name} />)}</SelectItemGroup>
          {usedAsOpts.length > 0 && <SelectItemGroup label={fmt(t('testCatalog.containers.usedAsGroup', 'Can be used as {sampleType} for this test'), { sampleType: st })}>{usedAsOpts.map(k => <SelectItem key={k} value={`${k}|used`} text={CONTAINERS[k].name} />)}</SelectItemGroup>}
        </Select>
        <Checkbox id="tc-own" labelText={t('testCatalog.containers.ownContainer', 'Needs its own container')} helperText={t('testCatalog.containers.ownContainer.help', 'Shares a container only with tests of its own panel.')} checked={value.own} onChange={(_, { checked }) => onChange({ ...value, own: checked })} />
      </div>
    </section>
  );
}
function TestEditorBodySite({ test, value, onChange }) {
  const mode = bodySiteMode(test.st);
  if (mode === 'Not used') return <p style={S.muted}>{fmt(t('testCatalog.bodySite.notUsed', '{sampleType} does not use body site. Set it on the Sample Type screen.'), { sampleType: test.st })}</p>;
  return (
    <section style={S.section} aria-labelledby="tc-site-h">
      <h3 id="tc-site-h" className="cds--type-productive-heading-03">{t('testCatalog.bodySite.heading', 'Body site')}</h3>
      <div style={S.row}>
        <Select id="tc-site" labelText={t('testCatalog.bodySite.default', 'Default body site')} value={value.site} onChange={e => onChange({ ...value, site: e.target.value })}>
          <SelectItem value="" text={t('common.none', 'None')} />
          {SAMPLE_TYPE_SETTINGS[test.st].allowed.map(id => <SelectItem key={id} value={id} text={siteById(id).name} />)}
        </Select>
        <Checkbox id="tc-lock" labelText={t('testCatalog.bodySite.lock', 'Lock at order entry')} disabled={!value.site} checked={value.lock} onChange={(_, { checked }) => onChange({ ...value, lock: checked })} />
        <span style={S.muted}>{fmt(t('testCatalog.bodySite.mode', 'Body site is {mode} for {sampleType}.'), { mode: t(`testCatalog.sampleType.bodySite.${mode.toLowerCase()}`, mode), sampleType: test.st })}</span>
      </div>
    </section>
  );
}
function TestEditorPage() {
  const ids = ['CREA', 'WCUL', 'TCUL'];
  const [idx, setIdx] = useState(0);
  const [data, setData] = useState(EDITOR_SEED);
  const test = TESTS[ids[idx]];
  return (
    <div>
      <PageHeader crumbs={[t('nav.home', 'Home'), t('nav.adminManagement', 'Admin Management'), t('nav.testCatalog', 'Test Catalog'), t('nav.tests', 'Tests'), test.name]} title={test.name} subtitle={`${test.code} · ${test.unit} · ${test.st}`} />
      <ContentSwitcher selectedIndex={idx} onChange={({ index }) => setIdx(index)} size="sm" style={{ maxWidth: 480, marginBottom: 'var(--cds-spacing-06)' }}>
        {ids.map(id => <Switch key={id} name={id} text={TESTS[id].name} />)}
      </ContentSwitcher>
      <p style={S.muted}>{t('mockup.abbreviated.editor', 'Other test editor sections (general, results, ranges, labels) are unchanged and not drawn.')}</p>
      <TestEditorContainers test={test} value={data[test.id]} onChange={v => setData({ ...data, [test.id]: v })} />
      <TestEditorBodySite test={test} value={data[test.id]} onChange={v => setData({ ...data, [test.id]: v })} />
      <Button>{t('common.save', 'Save')}</Button>
    </div>
  );
}

/* ============================== SampleTypeSettings (FR-G7, FR-N2, FR-G6b) ============================== */
// Route: /admin/TestCatalogList?entity=sampletypes (existing; hosted by Sample Type Management v2.1)
// SideNav: Admin -> Config -> Test Catalog -> Sample Types
// Breadcrumb: Home / Admin Management / Test Catalog / Sample Types / <type>
const SECONDARY_OF = { Plasma: ['Creatinine'] }; // tests that accept this type through a can-be-used-as container
function SampleTypeSettings() {
  const [st, setSt] = useState('Swab, wound');
  const [settings, setSettings] = useState(SAMPLE_TYPE_SETTINGS);
  const s = settings[st];
  const set = patch => setSettings({ ...settings, [st]: { ...s, ...patch } });
  const primary = CATALOG.filter(x => x.st === st).map(x => x.name);
  const secondary = SECONDARY_OF[st] || [];
  return (
    <div>
      <PageHeader crumbs={[t('nav.home', 'Home'), t('nav.adminManagement', 'Admin Management'), t('nav.testCatalog', 'Test Catalog'), t('nav.sampleTypes', 'Sample Types'), st]} title={st}
        subtitle={t('mockup.abbreviated.sampleType', 'Only the new fields are drawn; the rest of the Sample Type screen is owned by Sample Type Management v2.1.')} />
      <Stack gap={6}>
        <Select id="sts-type" labelText={t('common.sampleType', 'Sample type')} value={st} onChange={e => setSt(e.target.value)} style={{ maxWidth: 320 }}>
          {Object.keys(settings).map(k => <SelectItem key={k} value={k} text={k} />)}
        </Select>
        <p>{fmt(t('testCatalog.sampleType.usage', 'Primary for {primary} tests, secondary for {secondary} tests'), { primary: primary.length, secondary: secondary.length })}<br /><span style={S.muted}>{[...primary.slice(0, 6), ...secondary.map(n => `${n} (${t('testCatalog.sampleType.secondary', 'Secondary')})`)].join(', ')}</span></p>
        <Select id="sts-default" labelText={t('testCatalog.sampleType.defaultContainer', 'Default container type')} helperText={t('testCatalog.sampleType.defaultContainer.help', 'Used for a test with no expected containers.')} value={s.defaultContainer} onChange={e => set({ defaultContainer: e.target.value })} style={{ maxWidth: 420 }}>
          <SelectItem value="" text={t('common.none', 'None')} />
          {CLINICAL_CONTAINERS.filter(k => CONTAINERS[k].yields.includes(st)).map(k => <SelectItem key={k} value={k} text={CONTAINERS[k].name} />)}
        </Select>
        <RadioButtonGroup legendText={t('testCatalog.sampleType.bodySite', 'Body site')} name="sts-site" valueSelected={s.bodySite} onChange={v => set({ bodySite: v })}>
          <RadioButton id="sts-nu" value="Not used" labelText={t('testCatalog.sampleType.bodySite.notUsed', 'Not used')} />
          <RadioButton id="sts-op" value="Optional" labelText={t('testCatalog.sampleType.bodySite.optional', 'Optional')} />
          <RadioButton id="sts-rq" value="Required" labelText={t('testCatalog.sampleType.bodySite.required', 'Required')} />
        </RadioButtonGroup>
        {s.bodySite !== 'Not used' && (
          <FilterableMultiSelect key={st} id="sts-allowed" titleText={t('testCatalog.sampleType.allowedSites', 'Allowed body sites')} items={BODY_SITES.filter(b => b.active)} itemToString={b => (b ? b.name : '')}
            initialSelectedItems={BODY_SITES.filter(b => s.allowed.includes(b.id))} onChange={({ selectedItems }) => set({ allowed: selectedItems.map(b => b.id) })} />
        )}
        <div><Button>{t('common.save', 'Save')}</Button></div>
      </Stack>
    </div>
  );
}

/* ============================== BodySitesAdmin (FR-N1) ============================== */
// Route: /admin/TestCatalogList?entity=bodysites
// SideNav: Admin -> Config -> Test Catalog -> Body Sites (after Container Types)
// Breadcrumb: Home / Admin Management / Test Catalog / Body Sites
// The cleaned-up Source of Sample list: collection methods, timings and test rows are deactivated; sides split out.
function BodySitesAdmin() {
  const [list, setList] = useState(BODY_SITES);
  const [showDeact, setShowDeact] = useState(false);
  const [editing, setEditing] = useState(null);
  const shown = list.filter(b => showDeact || b.active).sort((a, b) => a.sort - b.sort);
  const upd = (id, patch) => setList(list.map(b => (b.id === id ? { ...b, ...patch } : b)));
  const hs = [t('common.name', 'Name'), t('common.code', 'Code'), t('admin.bodySite.codeSystem', 'Code system'), t('admin.bodySite.hasSide', 'Has a side'), t('admin.bodySite.sortOrder', 'Sort order'), t('common.active', 'Active'), t('admin.containerType.usedBy', 'Used by'), t('admin.bodySite.note', 'Migration note')];
  return (
    <div>
      <PageHeader crumbs={[t('nav.home', 'Home'), t('nav.adminManagement', 'Admin Management'), t('nav.testCatalog', 'Test Catalog'), t('admin.bodySite.title', 'Body Sites')]} title={t('admin.bodySite.title', 'Body Sites')}
        actions={(
          <span style={{ display: 'flex', gap: 8 }}>
            <Button kind="tertiary" renderIcon={Upload}>{t('admin.csv.import', 'Import CSV')}</Button>
            <Button kind="tertiary" renderIcon={Download}>{t('admin.csv.export', 'Export CSV')}</Button>
            <Button renderIcon={Add} onClick={() => { const id = `new-${list.length}`; setList([...list, { id, name: '', code: '', side: false, sort: 1000, active: true, used: 0 }]); setEditing(id); }}>{t('admin.bodySite.add', 'Add body site')}</Button>
          </span>
        )} />
      <TableContainer>
        <TableToolbar><TableToolbarContent><Toggle id="bs-deact" size="sm" labelText={t('common.showDeactivated', 'Show deactivated')} labelA="" labelB="" toggled={showDeact} onToggle={setShowDeact} /></TableToolbarContent></TableToolbar>
        <Table size="xs" useZebraStyles={false}>
          <TableHead><TableRow><TableExpandHeader aria-label={t('common.edit', 'Edit')} />{hs.map(h => <TableHeader key={h}>{h}</TableHeader>)}</TableRow></TableHead>
          <TableBody>
            {shown.map(b => (
              <React.Fragment key={b.id}>
                <TableExpandRow isExpanded={editing === b.id} onExpand={() => setEditing(editing === b.id ? null : b.id)} expandIconDescription={t('common.edit', 'Edit')}>
                  <TableCell>{b.name}</TableCell><TableCell style={S.mono}>{b.code}</TableCell><TableCell>{b.code ? 'SNOMED CT' : ''}</TableCell>
                  <TableCell>{b.side ? t('common.yes', 'Yes') : t('common.no', 'No')}</TableCell><TableCell>{b.sort}</TableCell>
                  <TableCell>{b.active ? <Tag size="sm" type="green">{t('common.active', 'Active')}</Tag> : <Tag size="sm" type="gray">{t('admin.deactivated', 'Deactivated')}</Tag>}</TableCell>
                  <TableCell>{fmt(t('admin.containerType.usedByCount', '{count} tests'), { count: b.used })}</TableCell>
                  <TableCell style={S.muted}>{b.legacy ? fmt(t('admin.bodySite.legacy', 'Deactivated on import: {kind}'), { kind: b.legacy }) : b.split || ''}</TableCell>
                </TableExpandRow>
                {editing === b.id && (
                  <TableExpandedRow colSpan={hs.length + 1}>
                    <div style={S.row}>
                      <TextInput id={`bs-n-${b.id}`} labelText={reqLabel(t('common.name', 'Name'), true)} helperText={t('admin.bodySite.translated', 'Translated through the localization mechanism')} maxLength={40} value={b.name} onChange={e => upd(b.id, { name: e.target.value })} />
                      <TextInput id={`bs-c-${b.id}`} labelText={t('common.code', 'Code')} value={b.code} onChange={e => upd(b.id, { code: e.target.value })} />
                      <Select id={`bs-cs-${b.id}`} labelText={t('admin.bodySite.codeSystem', 'Code system')} value={b.code ? 'SNOMED CT' : ''} onChange={() => {}}>
                        <SelectItem value="" text={t('common.none', 'None')} /><SelectItem value="SNOMED CT" text="SNOMED CT" />
                      </Select>
                      <Toggle id={`bs-s-${b.id}`} labelText={t('admin.bodySite.hasSide', 'Has a side')} labelA="" labelB="" toggled={b.side} onToggle={v => upd(b.id, { side: v })} />
                      <NumberInput id={`bs-o-${b.id}`} label={t('admin.bodySite.sortOrder', 'Sort order')} min={0} max={9999} value={b.sort} onChange={(_, { value }) => upd(b.id, { sort: Number(value) })} style={{ width: 140 }} />
                      <Toggle id={`bs-a-${b.id}`} labelText={t('common.active', 'Active')} labelA="" labelB="" toggled={b.active} onToggle={v => upd(b.id, { active: v })} />
                      <Button size="md" onClick={() => setEditing(null)}>{t('common.save', 'Save')}</Button>
                    </div>
                  </TableExpandedRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

/* ============================== OrderEntryConfiguration (section M, FR-F1, FR-F2) ============================== */
// Route: /MasterListsPage/SampleEntryConfigurationMenu
// SideNav: Admin -> Config -> Order Entry Configuration
// Breadcrumb: Home / Admin Management / Order Entry Configuration
// Only the acceptance setting's label changes here (D-068); the other rows show section M settings the new flow must honour.
const CFG_ROWS = [
  ['requesterRequired', 'requesterRequired', 'FR-B13'], ['eqaEnabled', 'eqaEnabled', 'FR-B4'], ['patientRequired', 'PatientRequired', 'FR-B4'],
  ['restrictFreeTextProviderEntry', 'restrictFreeTextProviderEntry', 'FR-B8'], ['restrictFreeTextRefSiteEntry', 'restrictFreeTextRefSiteEntry', 'FR-B7'],
  ['validateAccessionNumber', 'validateAccessionNumber', 'FR-A14'], ['autoFill', 'auto-fill collection date/time', 'FR-C3'], ['gpsCoordinatesEnabled', 'gpsCoordinatesEnabled', 'FR-C9'],
  ['trackPayment', 'trackPayment', 'FR-B28'], ['billingRefNumber', 'billingRefNumber', 'FR-B28'], ['contactTracingEnabled', 'contactTracingEnabled', 'FR-B30'],
  ['notifications', 'Result notifications (Test Notification Configuration)', 'FR-B29'], ['nextVisit', 'Next visit date (form field)', 'FR-B12'], ['testLocationCode', 'Test location code (form field)', 'FR-B12'],
  ['labelOverride', 'Allow label override at order entry', 'FR-I5'], ['consentRequiredForCollection', 'consentRequiredForCollection (Site Information)', 'FR-D2'],
  ['useExternalPatientSource', 'useExternalPatientSource (Site Information)', 'FR-B5'], ['canRefer', 'Signed-in user holds Sample Shipment Management (referral access)', 'Access'],
];
function OrderEntryConfiguration({ cfg, setCfg, acceptance, setAcceptance }) {
  const [env, setEnv] = useState('Mandatory');
  const [vec, setVec] = useState('Off');
  const accRow = (label, value, onChange, name) => (
    <RadioButtonGroup legendText={label} name={name} valueSelected={value} onChange={onChange} helperText={t('admin.orderEntry.acceptance.help', 'Off also hides the Sample check step.')}>
      <RadioButton id={`${name}-m`} value="Mandatory" labelText={t('admin.orderEntry.acceptance.mandatory', 'Mandatory')} />
      <RadioButton id={`${name}-o`} value="Optional" labelText={t('admin.orderEntry.acceptance.optional', 'Optional')} />
      <RadioButton id={`${name}-x`} value="Off" labelText={t('admin.orderEntry.acceptance.off', 'Off')} />
    </RadioButtonGroup>
  );
  return (
    <div>
      <PageHeader crumbs={[t('nav.home', 'Home'), t('nav.adminManagement', 'Admin Management'), t('admin.orderEntry.title', 'Order Entry Configuration')]} title={t('admin.orderEntry.title', 'Order Entry Configuration')} />
      <Stack gap={6}>
        <Tile>
          <Stack gap={5}>
            {accRow(t('admin.orderEntry.acceptance.label', 'Sample acceptance checklist (clinical)'), acceptance, setAcceptance, 'acc-clin')}
            <OrderProgressIndicator steps={orderSteps(acceptance, [stepCurrent(4), stepNotStarted(), stepNotStarted()])} />
            {accRow(t('admin.orderEntry.acceptance.env', 'Sample acceptance checklist (environmental)'), env, setEnv, 'acc-env')}
            {accRow(t('admin.orderEntry.acceptance.vector', 'Sample acceptance checklist (vector)'), vec, setVec, 'acc-vec')}
            <InlineNotification kind="info" lowContrast hideCloseButton title={t('admin.orderEntry.acceptance.items', 'Checklist items live in Admin > Compliance > Sample Acceptance Checklist.')} />
          </Stack>
        </Tile>
        <TableContainer title={t('admin.orderEntry.preserved', 'Settings that affect order entry')} description={t('admin.orderEntry.preserved.help', 'Every existing setting keeps its effect (section M). In this mockup the switches drive the order entry screens.')}>
          <Table size="xs" useZebraStyles={false}>
            <TableHead><TableRow><TableHeader>{t('admin.orderEntry.setting', 'Setting')}</TableHeader><TableHeader>{t('admin.orderEntry.value', 'Value')}</TableHeader><TableHeader>{t('admin.orderEntry.requirement', 'Requirement')}</TableHeader></TableRow></TableHead>
            <TableBody>
              {CFG_ROWS.map(([k, label, fr]) => (
                <TableRow key={k}>
                  <TableCell style={S.mono}>{label}</TableCell>
                  <TableCell><Toggle id={`cfg-${k}`} size="sm" labelText={label} hideLabel labelA={t('common.off', 'Off')} labelB={t('common.on', 'On')} toggled={!!cfg[k]} onToggle={v => setCfg({ ...cfg, [k]: v })} /></TableCell>
                  <TableCell>{fr}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {/* FR-K8a: shown read-only on Site Information; drawn here for completeness */}
        <TextInput id="lab-tz" readOnly labelText={t('admin.site.timeZone', 'Laboratory time zone')} helperText={t('admin.site.timeZone.help', 'Set by the distribution configuration')} value={LAB_TZ} style={{ maxWidth: 320 }} />
      </Stack>
    </div>
  );
}

/* ============================== App: reviewer screen switcher (not shipped) ============================== */
const CFG_DEFAULT = {
  requesterRequired: true, eqaEnabled: true, patientRequired: false, restrictFreeTextProviderEntry: true, restrictFreeTextRefSiteEntry: false,
  validateAccessionNumber: true, autoFill: false, gpsCoordinatesEnabled: false, trackPayment: true, billingRefNumber: false, contactTracingEnabled: false,
  notifications: false, nextVisit: false, testLocationCode: false, labelOverride: true, consentRequiredForCollection: false, useExternalPatientSource: false,
  enableClientRegistry: false, nationalIdRequired: false, canRefer: true, clockDrift: false,
};
const SCREENS = [
  ['dashboard', 'Order dashboard'], ['enter', 'Enter Order (new order)'], ['enterReceived', 'Enter Order (samples received with order)'],
  ['prepare', 'Prepare Samples'], ['prepareIncomplete', 'Prepare Samples (incomplete, To continue checklist)'], ['check', 'Sample check'],
  ['containers', 'Container Types'], ['testEditor', 'Test editor: Containers and Body site'], ['sampleTypes', 'Sample Type settings'],
  ['bodySites', 'Body Sites'], ['config', 'Order Entry Configuration'],
];
export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [nonce, setNonce] = useState(0);
  const [cfg, setCfg] = useState(CFG_DEFAULT);
  const [acceptance, setAcceptance] = useState('Optional');
  const [sim, setSim] = useState('ok');
  const go = key => { setScreen(key === 'check' && acceptance === 'Off' ? 'dashboard' : key); setNonce(n => n + 1); };
  const common = { cfg, acceptance, go, sim };
  let body = null;
  if (screen === 'dashboard') body = <OrderDashboard {...common} />;
  if (screen === 'enter') body = <EnterOrderPage {...common} received0={false} />;
  if (screen === 'enterReceived') body = <EnterOrderPage {...common} received0 />;
  if (screen === 'prepare') body = <PrepareSamplesPage {...common} variant="complete" />;
  if (screen === 'prepareIncomplete') body = <PrepareSamplesPage {...common} variant="incomplete" />;
  if (screen === 'check') body = <SampleCheckPage {...common} />;
  if (screen === 'containers') body = <ContainerTypesAdmin />;
  if (screen === 'testEditor') body = <TestEditorPage />;
  if (screen === 'sampleTypes') body = <SampleTypeSettings />;
  if (screen === 'bodySites') body = <BodySitesAdmin />;
  if (screen === 'config') body = <OrderEntryConfiguration cfg={cfg} setCfg={setCfg} acceptance={acceptance} setAcceptance={setAcceptance} />;
  return (
    <div style={{ background: 'var(--cds-background)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: 'var(--cds-spacing-05)', flexWrap: 'wrap', alignItems: 'flex-end', padding: 'var(--cds-spacing-04) var(--cds-spacing-06)', background: 'var(--cds-layer-01)', borderBottom: '1px solid var(--cds-border-subtle-01)' }}>
        <Select id="mock-screen" labelText={t('mockup.screen', 'Screen (reviewer only)')} value={screen} onChange={e => { setScreen(e.target.value); setNonce(n => n + 1); }} style={{ minWidth: 340 }}>
          {SCREENS.map(([k, l]) => <SelectItem key={k} value={k} text={t(`mockup.screen.${k}`, l)} />)}
        </Select>
        <Select id="mock-sim" labelText={t('mockup.simulate', 'Simulate server response')} value={sim} onChange={e => setSim(e.target.value)}>
          <SelectItem value="ok" text={t('mockup.sim.ok', 'Save succeeds')} />
          <SelectItem value="unreachable" text={t('mockup.sim.unreachable', 'Server unreachable (FR-J3)')} />
          <SelectItem value="unknown" text={t('mockup.sim.unknown', 'Reply lost (FR-K3)')} />
          <SelectItem value="conflict" text={t('mockup.sim.conflict', 'Changed by another user (FR-J4)')} />
          <SelectItem value="lookupFail" text={t('mockup.sim.lookupFail', 'Lookups fail (FR-B6, FR-K2)')} />
          <SelectItem value="loading" text={t('mockup.sim.loading', 'Order still loading (FR-J1)')} />
          <SelectItem value="reconnecting" text={t('mockup.sim.reconnecting', 'Server outage on open (FR-K1)')} />
        </Select>
        <Checkbox id="mock-drift" labelText={t('mockup.sim.clockDrift', 'Computer clock 17 min off (FR-K8b)')} checked={cfg.clockDrift} onChange={(_, { checked }) => setCfg({ ...cfg, clockDrift: checked })} />
        <span style={S.muted}>{fmt(t('mockup.acceptance', 'Sample acceptance (clinical): {value}'), { value: acceptance })}</span>
      </div>
      <Grid fullWidth>
        <Column sm={4} md={8} lg={16} style={{ paddingTop: 'var(--cds-spacing-06)' }}>
          {/* FR-K1: non-blocking status; retries with growing gaps and recovers on its own. Never a modal. */}
          {sim === 'reconnecting' && <InlineNotification kind="info" lowContrast hideCloseButton title={t('common.reconnecting', 'Reconnecting...')} subtitle={t('order.reconnecting.sub', 'Your entries are kept. The page recovers on its own.')} />}
          <React.Fragment key={`${screen}-${nonce}`}>{body}</React.Fragment>
        </Column>
      </Grid>
    </div>
  );
}
