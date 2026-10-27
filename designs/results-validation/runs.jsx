// Route: /Results?run=<runId>
// SideNav: Workplan → Results  (no new menu item; the Runs chip is the entry point)
// Breadcrumb: Home / Workplan / Results
// FRS: runs.md v0.5 (2026-10-21)
//
// v0.5 adds (see the FRS): blanks and duplicates as QC items of a run (FR-C1a, FR-C10 to C14),
// instrument holds read from the Instruments FRS (FR-C8 out of service, FR-C9 test locked),
// planned QC positions on workplan batches (section I), and two configuration surfaces exported
// at the bottom of this file: TestCatalogQcPolicy (Test Catalog QC section, FR-H1 and FR-I1) and
// WorkplanQcLayouts (Workplan Configuration, FR-I5).
//
// Handoff mockup for OGC-1200. The analyzer run below is a full 96-position rack
// against an eight-analyte chemistry panel (768 rows), because the review surface has to
// be judged at the size the bench actually produces, not at six rows.
//
// ===========================================================================
// HOW TO READ THIS MOCKUP: two regions are NOT designs.
//
// The filter chip row and the expanded row panel are EXISTING OpenELIS UI. They are
// fenced below in <ReuseBoundary> and drawn only in abbreviated form so this file reads
// standalone. They are deliberately NOT a complete or accurate rendering of those
// controls, and nothing in them is a specification of their contents.
//
//   Build them by reusing the shipped components. Take their real filter set, fields,
//   ordering, states and behaviour from the live app and from their owning specs, not
//   from this file. If what you see fenced here differs from the live app, the live app
//   is right (design-addendum MUST C, D-008).
//
// What Runs actually adds, and the only part of those two regions this mockup specifies:
//   - chips: one Held chip, and counts computed over the whole run (FR-E1a)
//   - row panel: a provenance line above the fields, the analyzer value prefilled and
//     tagged, and the edited-value treatment (FR-E10, FR-E10a)
// ===========================================================================

import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableExpandRow, TableExpandedRow, TableExpandHeader,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  Select, SelectItem, Checkbox, Button, Tag, Tile, Pagination, TextInput,
  InlineNotification, Accordion, AccordionItem,
  Breadcrumb, BreadcrumbItem, NumberInput, RadioButtonGroup, RadioButton,
  FilterableMultiSelect, Toggle,
} from '@carbon/react';
import { Warning, ChevronDown, ChevronUp, Locked, Add } from '@carbon/icons-react';

/* i18n helper : every visible string goes through this (Constitution Principle 1) */
const t = (key, fallback) => fallback || key;

/* ------------------------------------------------------------------ mock data */

const ANALYTES = [
  { test: 'Glucose',         unit: 'mmol/L', lo: 3.9, hi: 6.1, critHi: 22 },
  { test: 'Urea',            unit: 'mmol/L', lo: 2.5, hi: 7.1, critHi: 30 },
  { test: 'Creatinine',      unit: 'µmol/L', lo: 62,  hi: 106, critHi: 600 },
  { test: 'Sodium',          unit: 'mmol/L', lo: 136, hi: 145, critHi: 160 },
  { test: 'Potassium',       unit: 'mmol/L', lo: 3.5, hi: 5.1, critHi: 6.5 },
  { test: 'Chloride',        unit: 'mmol/L', lo: 98,  hi: 107, critHi: null },
  { test: 'ALT',             unit: 'U/L',    lo: 7,   hi: 56,  critHi: 500 },
  { test: 'Total bilirubin', unit: 'µmol/L', lo: 5,   hi: 21,  critHi: 300 },
];

const SURNAMES = ['Mwangi', 'Achieng', 'Otieno', 'Njoroge', 'Kamau', 'Wafula', 'Nyambura',
  'Mutua', 'Chebet', 'Omondi', 'Wanjiru', 'Kiptoo', 'Adhiambo', 'Maina', 'Barasa', 'Cherono'];
const INITIALS = 'AJKMFTSDEN';

/* deterministic pseudo-random so the mockup renders identically every time */
let seed = 20260922;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

function buildRackRun() {
  seed = 20260922;
  const rows = [];
  for (let s = 0; s < 96; s++) {
    const sample = `24-0${1200 + s}`;
    const patient = `${INITIALS[s % INITIALS.length]}. ${SURNAMES[s % SURNAMES.length]}`;
    ANALYTES.forEach((a, i) => {
      const span = a.hi - a.lo;
      const r = rnd();
      let value, flag = null;
      if (r < 0.015) {                       // critical
        value = a.critHi ? a.critHi * (1 + rnd() * 0.15) : a.lo * 0.5;
        flag = 'critical';
      } else if (r < 0.085) {                // abnormal
        value = rnd() < 0.5 ? a.lo - span * (0.1 + rnd() * 0.3) : a.hi + span * (0.1 + rnd() * 0.4);
        flag = 'abnormal';
      } else {                               // in range
        value = a.lo + span * (0.15 + rnd() * 0.7);
      }
      rows.push({
        id: `R${s}-${i}`,
        sample, patient,
        test: a.test,
        unit: 'Chemistry',
        status: 'pending',
        run: 'RUN-2409-0142',
        value: `${value.toFixed(a.hi > 100 ? 0 : 1)} ${a.unit}`,
        flag,
        dup: false,
        exception: null,
      });
    });
  }
  // four rows the analyzer re-reported over a result that already exists
  ['R7-0', 'R23-2', 'R51-4', 'R80-6'].forEach(id => {
    const r = rows.find(x => x.id === id); if (r) r.dup = true;
  });
  // three records that did not resolve on ingestion (FR-E4)
  rows.find(x => x.id === 'R14-1').exception = 'unmatched';
  rows.find(x => x.id === 'R14-3').exception = 'unmatched';
  rows.find(x => x.id === 'R62-7').exception = 'unmapped';
  return rows;
}

const RACK_ROWS = buildRackRun();

/* the other two runs, and rows outside any run, keep the worklist honest */
const OTHER_ROWS = [
  { id: 'X1', sample: '24-00809', patient: 'E. Nyambura', test: 'Xpert MTB/RIF Ultra', unit: 'Chemistry',
    status: 'pending', run: 'RUN-2409-0141', value: 'MTB DETECTED, low · RIF NOT DETECTED', flag: 'critical',
    dup: false, exception: null,
    components: ['MTB: DETECTED (low)', 'RIF resistance: NOT DETECTED', 'SPC: PASS'] },
  { id: 'X2', sample: '24-00822', patient: 'S. Njoroge', test: 'Hemoglobin', unit: 'Hematology',
    status: 'entered', run: 'RUN-2409-0143', value: '11.8 g/dL', flag: null, dup: false, exception: null },
  { id: 'X3', sample: '24-00823', patient: 'M. Kamau', test: 'Hemoglobin', unit: 'Hematology',
    status: 'pending', run: 'RUN-2409-0143', value: null, flag: null, dup: false, exception: null },
  { id: 'X4', sample: '24-00824', patient: 'J. Wafula', test: 'Hemoglobin', unit: 'Hematology',
    status: 'pending', run: 'RUN-2409-0143', value: null, flag: null, dup: false, exception: null },
  { id: 'X5', sample: '24-00831', patient: 'P. Chebet', test: 'Malaria RDT', unit: 'Hematology',
    status: 'pending', run: null, value: null, flag: null, dup: false, exception: null },
  { id: 'X6', sample: '24-00832', patient: 'L. Omondi', test: 'Malaria RDT', unit: 'Hematology',
    status: 'pending', run: null, value: null, flag: null, dup: false, exception: null },
];

/* RUN-2409-0144: a later analyzer run on Donatello while potassium is locked (FR-C9) */
function buildLockedRun() {
  seed = 20261021;
  const rows = [];
  for (let s = 0; s < 6; s++) {
    ANALYTES.forEach((a, i) => {
      const value = a.lo + (a.hi - a.lo) * (0.15 + rnd() * 0.7);
      rows.push({ id: `K${s}-${i}`, sample: `24-0${1400 + s}`, patient: `${INITIALS[s]}. ${SURNAMES[s + 3]}`,
        test: a.test, unit: 'Chemistry', status: 'pending', run: 'RUN-2409-0144',
        value: `${value.toFixed(a.hi > 100 ? 0 : 1)} ${a.unit}`, flag: null, dup: false, exception: null });
    });
  }
  return rows;
}

/* RUN-2409-0145: lead by ICP-MS, 20 client samples with planned QC positions (FR-I2) */
const SITES = ['Kilimani borehole 3', 'Ruiru intake', 'Athi river WP-2', 'Kibera standpipe 11', 'Ngong Rd tap 4',
  'Thika WTP outlet', 'Karura spring', 'Githurai tank 2', 'Embakasi well 7', 'Dandora kiosk 5'];
const LEAD = ['3.1', '1.2', '0.8', '6.4', '2.2', '0.6', '11.9', '1.7', '4.3', '12.9',
  '0.9', '2.8', '1.5', '7.6', '0.7', '3.3', '2.0', '1.1', '9.8', '5.6'];
function buildLeadRun() {
  const rows = [];
  const sample = i => ({ id: `PB${i}`, kind: 'sample', sample: `24-0${1301 + i}`, patient: SITES[i % SITES.length],
    test: 'Lead (ICP-MS)', unit: 'Environmental', status: 'pending', run: 'RUN-2409-0145',
    value: `${LEAD[i]} µg/L`, flag: Number(LEAD[i]) > 10 ? 'abnormal' : null, dup: false, exception: null });
  const qc = (id, qcKind, label, extra) => ({ id, kind: 'qc', qcKind, qcLabel: label, sample: '', patient: '',
    test: 'Lead (ICP-MS)', unit: 'Environmental', status: 'qc', run: 'RUN-2409-0145',
    flag: null, dup: false, exception: null, ...extra });
  rows.push(qc('PBQ1', 'Blank', 'Blank', { sample: 'BLK-1', value: '0.08 µg/L', verdict: 'Pass' }));
  rows.push(qc('PBQ2', 'Control', 'Control L1', { sample: 'QC-PB-L1-77', value: '10.3 µg/L', verdict: 'Pass' }));
  rows.push(qc('PBQ3', 'Control', 'Control L2', { sample: 'QC-PB-L2-77', value: '49.1 µg/L', verdict: 'Pass' }));
  for (let i = 0; i < 10; i++) rows.push(sample(i));
  rows.push(qc('PBQ4', 'Duplicate', 'Duplicate of 24-01310', { sample: '24-01310.1', value: '12.4 µg/L', verdict: 'Pass' }));
  for (let i = 10; i < 20; i++) rows.push(sample(i));
  rows.push(qc('PBQ5', 'Duplicate', 'Duplicate of 24-01320', { sample: '24-01320.1', value: '4.1 µg/L', verdict: 'Fail' }));
  rows.push(qc('PBQ6', 'Control', 'Control L2', { sample: 'QC-PB-L2-77', value: null, verdict: 'Planned', planned: true }));
  return rows.map((r, i) => ({ ...r, pos: i + 1 }));
}

/* RUN-2409-0146: total suspended solids weighed on a balance that is out of service (FR-C8) */
const TSS_ROWS = ['14', '38', '6', '122', '27', '9', '51', '18'].map((v, i) => ({
  id: `TS${i}`, sample: `24-0${1340 + i}`, patient: SITES[(i + 3) % SITES.length], test: 'Total suspended solids',
  unit: 'Environmental', status: 'pending', run: 'RUN-2409-0146', value: `${v} mg/L`, flag: null, dup: false, exception: null }));

const ALL_ROWS = [...RACK_ROWS, ...buildLockedRun(), ...buildLeadRun(), ...TSS_ROWS, ...OTHER_ROWS];

const RUNS = {
  'RUN-2409-0142': {
    id: 'RUN-2409-0142', source: 'ANALYZER', method: 'Cobas c311', analyzer: 'Donatello (c311 #2)',
    labUnit: 'Chemistry', operator: 'A. Wanjiru', opened: '08:14', lastActivity: '08:41', state: 'Held',
    lot: { name: 'CHEM-PANEL L24-118', provenance: 'analyzerReported', expires: '2026-11-30' },
    service: { status: 'Restricted', reason: 'Potassium locked since 08:12, set by this run' },
    controls: [
      { level: 'Level 1', lot: 'QC-CHEM-L1-2291',
        covers: ['Glucose', 'Urea', 'Creatinine', 'Sodium', 'Chloride', 'ALT', 'Total bilirubin'],
        observed: 'all analytes within target', expected: 'per QC Targets', verdict: 'Pass',
        verdictSource: 'analyzerReported', operator: 'A. Wanjiru', time: '08:12' },
      { level: 'Level 2', lot: 'QC-CHEM-L2-2291', covers: ['Potassium'],
        observed: '6.9 mmol/L', expected: '5.8 ± 0.4 mmol/L', verdict: 'Fail',
        verdictSource: 'computed', operator: 'A. Wanjiru', time: '08:12' },
    ],
    exceptions: [
      { kind: 'unmatched', detail: 'Lab number 24-01214 not found (2 records)' },
      { kind: 'unmapped', detail: 'Analyzer code TBIL-2 has no mapped test (1 record)' },
    ],
  },
  'RUN-2409-0141': {
    id: 'RUN-2409-0141', source: 'ANALYZER', method: 'Xpert MTB/RIF Ultra', analyzer: 'GeneXpert IV (TB bench)',
    labUnit: 'Chemistry', operator: 'System', opened: '07:58', lastActivity: '07:58', state: 'Open',
    lot: { name: 'Ultra cartridge 24F-7741', provenance: 'analyzerReported', expires: '2027-02-28' },
    service: { status: 'In service' },
    controls: [{ level: 'Internal (SPC)', lot: 'none', covers: ['Xpert MTB/RIF Ultra'], observed: 'PASS',
      expected: 'PASS', verdict: 'Pass', verdictSource: 'analyzerReported', operator: 'System', time: '07:58' }],
    exceptions: [],
  },
  'RUN-2409-0143': {
    id: 'RUN-2409-0143', source: 'WORKPLAN', method: 'HemoCue Hb 301', analyzer: 'HemoCue bench unit 1',
    labUnit: 'Hematology', operator: 'B. Otieno', opened: '08:30', lastActivity: '08:47', state: 'Open',
    lot: { name: 'HemoCue microcuvette 24-08B', provenance: 'selected', expires: '2026-10-15' },
    service: { status: 'In service' },
    controls: [{ level: 'Normal', lot: 'QC-HB-N-118', covers: ['Hemoglobin'], observed: '12.4 g/dL',
      expected: '12.2 ± 0.6 g/dL', verdict: 'Pass', verdictSource: 'computed', operator: 'B. Otieno', time: '08:30' }],
    exceptions: [],
  },
  'RUN-2409-0144': {
    id: 'RUN-2409-0144', source: 'ANALYZER', method: 'Cobas c311', analyzer: 'Donatello (c311 #2)',
    labUnit: 'Chemistry', operator: 'J. Kiptoo', opened: '09:05', lastActivity: '09:07', state: 'Held',
    lot: { name: 'CHEM-PANEL L24-118', provenance: 'analyzerReported', expires: '2026-11-30' },
    service: { status: 'Restricted', reason: 'Potassium locked since 08:12' },
    lock: { test: 'Potassium', reason: 'control Level 2 failed in RUN-2409-0142 at 08:12' },
    controls: [{ level: 'Level 1', lot: 'QC-CHEM-L1-2291',
      covers: ['Glucose', 'Urea', 'Creatinine', 'Sodium', 'Chloride', 'ALT', 'Total bilirubin'],
      observed: 'all analytes within target', expected: 'per QC Targets', verdict: 'Pass',
      verdictSource: 'analyzerReported', operator: 'J. Kiptoo', time: '09:03' }],
    exceptions: [],
  },
  'RUN-2409-0145': {
    id: 'RUN-2409-0145', source: 'WORKPLAN', method: 'ICP-MS (EPA 200.8)', analyzer: 'ICP-MS Agilent 7900',
    labUnit: 'Environmental', operator: 'R. Maina', opened: '09:20', lastActivity: '11:02', state: 'Held',
    lot: { name: 'HNO3 trace grade 26-0412', provenance: 'selected', expires: '2027-04-30' },
    service: { status: 'In service' },
    placement: 'Placement rules: 1 blank at start; L1, L2 at start; L2 at end; 1 duplicate per 10 samples (26 positions)',
    policy: { blankFails: 'Hold', duplicateFails: 'Hold' },
    controls: [
      { level: 'L1', lot: 'QC-PB-L1-77', covers: ['Lead (ICP-MS)'], observed: '10.3 µg/L', expected: '10.0 ± 1.0 µg/L',
        verdict: 'Pass', verdictSource: 'computed', operator: 'R. Maina', time: '09:31' },
      { level: 'L2', lot: 'QC-PB-L2-77', covers: ['Lead (ICP-MS)'], observed: '49.1 µg/L', expected: '50.0 ± 5.0 µg/L',
        verdict: 'Pass', verdictSource: 'computed', operator: 'R. Maina', time: '09:33' }],
    /* FR-C10, FR-C11, FR-C13: blanks and duplicates, lab and field */
    items: [
      { kind: 'Blank', scope: 'lab', test: 'Lead (ICP-MS)', label: 'Blank (position 1)', detail: '0.08 µg/L against ceiling 0.5 µg/L', verdict: 'Pass', time: '09:29' },
      { kind: 'Blank', scope: 'field', test: 'Lead (ICP-MS)', label: 'Field blank, order ENV-24-0310', detail: '0.11 µg/L against ceiling 0.5 µg/L', verdict: 'Pass', time: '10:12' },
      { kind: 'Duplicate', scope: 'lab', test: 'Lead (ICP-MS)', label: 'Duplicate of 24-01310 (24-01310.1)', detail: '12.9 and 12.4 µg/L, RPD 3.9% against limit 20%', verdict: 'Pass', time: '10:05' },
      { kind: 'Duplicate', scope: 'lab', test: 'Lead (ICP-MS)', label: 'Duplicate of 24-01320 (24-01320.1)', detail: '5.6 and 4.1 µg/L, RPD 30.9% against limit 20%', verdict: 'Fail', time: '10:58' },
      { kind: 'Control', scope: 'lab', test: 'Lead (ICP-MS)', label: 'Control L2 (position 26, end of batch)', detail: 'not yet entered', verdict: 'Planned', time: '' }],
    exceptions: [],
  },
  'RUN-2409-0146': {
    id: 'RUN-2409-0146', source: 'WORKPLAN', method: 'Gravimetric (SM 2540 D)', analyzer: 'Balance B-02 (Mettler XS205)',
    labUnit: 'Environmental', operator: 'R. Maina', opened: '10:40', lastActivity: '10:52', state: 'Held',
    lot: { name: 'Glass fibre filters GF/C 25-1188', provenance: 'selected', expires: '2028-01-31' },
    service: { status: 'Out of service', reason: 'Calibration certificate C-4471 expired 14 Oct 2026' },
    tests: ['Total suspended solids'],
    controls: [{ level: 'Check standard', lot: 'QC-TSS-CS-12', covers: ['Total suspended solids'], observed: '98 mg/L',
      expected: '100 ± 10 mg/L', verdict: 'Pass', verdictSource: 'computed', operator: 'R. Maina', time: '10:44' }],
    exceptions: [],
  },
};

/* ------------------------------------------------------------------ derivations */

/* FR-C12: controls, then lab blanks and duplicates under the test's failure policy.
   Field items (FR-C13) never change the run's verdict. */
const perTestVerdicts = run => {
  const out = {};
  run.controls.forEach(c => c.covers.forEach(test => {
    out[test] = (out[test] === 'Fail' || c.verdict === 'Fail') ? 'Fail' : c.verdict;
  }));
  (run.items || []).filter(i => i.scope === 'lab' && i.kind !== 'Control' && i.verdict === 'Fail').forEach(i => {
    const policy = i.kind === 'Blank' ? run.policy.blankFails : run.policy.duplicateFails;
    if (policy === 'Hold') out[i.test] = 'Fail';
    else if (out[i.test] !== 'Fail') out[i.test] = 'Pass with warning';
  });
  return out;
};

/* FR-C8, FR-C9, FR-D4: one hold per test, named by its first cause in this order:
   instrument out of service, test locked on the instrument, QC failed. Service status and locks
   are read from the Instruments FRS; Runs never computes them (FR-G7). */
const instrumentShort = run => run.analyzer.split(' (')[0];
const holdOf = (row, runs) => {
  if (!row.run || row.kind === 'qc') return null;
  const run = runs[row.run];
  if (!run) return null;
  if (run.service && run.service.status === 'Out of service') {
    return { cause: 'instrument', label: t('run.tag.heldInstrument', `Held: ${instrumentShort(run)} out of service`), reason: run.service.reason };
  }
  if (run.lock && run.lock.test === row.test) {
    return { cause: 'locked', label: t('run.tag.heldLocked', `Held: ${row.test} locked on ${instrumentShort(run)}`), reason: run.lock.reason };
  }
  if (perTestVerdicts(run)[row.test] === 'Fail') {
    return { cause: 'qc', label: t('run.tag.held', `Held: QC failed in ${row.run}`), reason: `a QC item for ${row.test} failed in this run` };
  }
  return null;
};
const isHeld = (row, runs) => !!holdOf(row, runs);
const heldTestsIn = (runRows, runs) => [...new Set(runRows.filter(r => isHeld(r, runs)).map(r => r.test))];

/* FR-E1a : the worklist's existing filter chips are the run view's only row control.
   Counts are always over the whole run, never over the visible page. */
const CHIPS = [
  { key: 'all',        label: t('filter.all', 'All'),                    match: () => true },
  { key: 'needsReview', label: t('filter.needsReview', 'Needs review'),
    match: (r, held) => r.kind !== 'qc' && (held.includes(r.test) || !!r.exception || r.dup || !!r.flag) },
  { key: 'critical',   label: t('label.flag.critical', 'Critical'),      match: r => r.flag === 'critical' },
  { key: 'abnormal',   label: t('label.flag.abnormal', 'Abnormal'),      match: r => r.flag === 'abnormal' },
  { key: 'exceptions', label: t('run.filter.exceptions', 'Exceptions'),  match: r => !!r.exception },
  { key: 'held',       label: t('run.filter.held', 'Held'),              match: (r, held) => r.kind !== 'qc' && held.includes(r.test) },
  { key: 'normal',     label: t('label.flag.normal', 'Normal'),
    match: (r, held) => r.kind !== 'qc' && !r.flag && !r.dup && !r.exception && !held.includes(r.test) },
];
const chipMatch = (key, row, held) => CHIPS.find(c => c.key === key).match(row, held);
const sortRank = (row, held) =>
  (held.includes(row.test) || row.exception) ? 0 : row.dup ? 1
    : row.flag === 'critical' ? 2 : row.flag === 'abnormal' ? 3 : 4;

/* ------------------------------------------------------------------ small parts */

/* A fenced region the developer must not build from this mockup. Everything inside is an
   abbreviated stand-in for a shipped component; only the "Runs adds" line is specified here. */
function ReuseBoundary({ title, owner, adds, children }) {
  return (
    <div style={{ border: '2px dashed var(--cds-border-strong)', padding: '0.5rem', margin: '0.25rem 0' }}>
      <Stack gap={2} style={{ marginBottom: 6 }}>
        <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag size="sm" type="purple">
            <strong>{t('mockup.reuse.tag', 'Existing component: reuse, do not re-implement')}</strong>
          </Tag>
          <span style={{ fontSize: 12 }}><strong>{title}</strong></span>
          <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{owner}</span>
        </Stack>
        <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
          {t('mockup.reuse.abbreviated',
            'Drawn abbreviated so this mockup reads standalone. Not a complete or accurate rendering; take the real contents from the live app and the owning spec.')}
          {' '}<strong>{t('mockup.reuse.adds', 'Runs adds only:')}</strong> {adds}
        </span>
      </Stack>
      {children}
    </div>
  );
}

const VerdictTag = ({ v }) => (
  <Tag size="sm" type={v === 'Pass' ? 'green' : v === 'Fail' || v === 'Held' ? 'red' : v === 'Pass with warning' ? 'warm-gray'
    : v === 'No control' ? 'purple' : 'gray'}
    renderIcon={v === 'Fail' || v === 'Held' ? Warning : undefined}>
    <strong>{t(`run.verdict.${v}`, v)}</strong>
  </Tag>
);

/* Service status words and kinds are the Instruments FRS's (analyzer.service.*) */
const ServiceTag = ({ s }) => (
  <Tag size="sm" type={s === 'In service' ? 'green' : s === 'Restricted' ? 'warm-gray' : 'red'}
    renderIcon={s === 'In service' ? undefined : s === 'Restricted' ? Locked : Warning}>
    <strong>{t(`analyzer.service.${s}`, s)}</strong>
  </Tag>
);

function RunRowTag({ row, runs, onOpenRun }) {
  if (!row.run) return null;
  const run = runs[row.run];
  const hold = holdOf(row, runs);
  const held = !!hold;
  const label = held
    ? hold.label
    : run.source === 'WORKPLAN'
      ? t('run.tag.batched', `Batched in ${row.run}`)
      : t('run.tag.waiting', `Waiting in ${row.run}`);
  return (
    <Tag size="sm" type={held ? 'red' : 'blue'} renderIcon={held ? Warning : undefined}
      onClick={() => onOpenRun(row.run)} style={{ cursor: 'pointer' }}>
      <strong>{label}</strong>
    </Tag>
  );
}

function RunsChip({ runs, rows, onPick }) {
  const [open, setOpen] = useState(false);
  const openCount = runs.filter(r => r.state === 'Open').length;
  const heldCount = runs.filter(r => r.state === 'Held').length;
  return (
    <div style={{ position: 'relative' }}>
      <Button kind="tertiary" size="sm" onClick={() => setOpen(v => !v)} renderIcon={open ? ChevronUp : ChevronDown}>
        {t('run.chip.label', 'Runs')} · {t('run.chip.counts', `${openCount} open, ${heldCount} held`)}
      </Button>
      {open && (
        <Tile style={{ position: 'absolute', zIndex: 20, marginTop: 4, minWidth: 520 }}>
          <Stack gap={3}>
            {runs.map(r => {
              const rr = rows.filter(x => x.run === r.id);
              const done = rr.filter(x => x.status !== 'pending').length;
              return (
                <Button key={r.id} kind="ghost" size="sm" style={{ justifyContent: 'flex-start', width: '100%' }}
                  onClick={() => { onPick(r.id); setOpen(false); }}>
                  <span style={{ textAlign: 'left', fontSize: 13 }}>
                    <strong>{r.id}</strong> · {r.source === 'ANALYZER' ? `${r.method}, ${r.analyzer}` : `${r.method}, ${r.operator}`}
                    {' · '}{r.opened} · {t('run.progress', `${done} of ${rr.length} rows dispositioned`)}{' '}
                    <Tag size="sm" type={r.state === 'Held' ? 'red' : 'blue'}>{t(`run.state.${r.state}`, r.state)}</Tag>
                  </span>
                </Button>
              );
            })}
          </Stack>
        </Tile>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- run header blocks */

function QcBlock({ run, runRows, runs, onAction }) {
  const verdicts = perTestVerdicts(run);
  const held = heldTestsIn(runRows, runs);
  const holds = {};
  runRows.forEach(r => { const h = holdOf(r, runs); if (h) holds[r.test] = h; });
  const tests = [...new Set([...Object.keys(verdicts), ...held])];
  const [openTest, setOpenTest] = useState(held[0] || null);
  const overall = held.length ? 'Held' : 'Pass';
  return (
    <Tile style={{ borderBottom: '1px solid var(--cds-border-subtle)' }}>
      <Stack gap={3}>
        <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>{t('run.header.qc', 'QC')}</strong>
          <Tag size="sm" type={overall === 'Held' ? 'red' : 'green'} renderIcon={overall === 'Held' ? Warning : undefined}>
            <strong>{t(`run.state.${overall}`, overall)}</strong>
          </Tag>
          {held.length > 0 && (
            <span style={{ fontSize: 13 }}>
              {t('run.qc.heldSummary',
                `${held.join(', ')} held: ${runRows.filter(r => r.kind !== 'qc' && held.includes(r.test)).length} rows blocked. Every other test in this run is unaffected.`)}
            </span>
          )}
          <span style={{ flex: 1 }} />
          <Button kind="ghost" size="sm">{t('run.action.recordControl', 'Record control')}</Button>
          {run.source === 'WORKPLAN' && (
            <>
              <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => onAction('addBlank')}>{t('run.action.addBlank', 'Add blank')}</Button>
              <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => onAction('addDuplicate')}>{t('run.action.addDuplicate', 'Add duplicate of')}</Button>
            </>
          )}
        </Stack>

        {/* FR-E2: the instrument line opens the block when an instrument hold applies */}
        {run.service && run.service.status !== 'In service' && (
          <InlineNotification kind={run.service.status === 'Out of service' ? 'error' : 'warning'} lowContrast hideCloseButton
            style={{ maxWidth: 'none' }}
            title={t('run.qc.instrumentLine', `${run.analyzer} is ${run.service.status}`)}
            subtitle={`${run.service.reason}. ${t('run.qc.instrumentLink', 'Open the instrument status panel (Instruments FR-D4).')}`} />
        )}

        {tests.map(test => {
          const hold = holds[test];
          const v = hold && hold.cause !== 'qc' ? 'Held' : (verdicts[test] || 'No control');
          return (
          <div key={test} style={{ borderTop: '1px solid var(--cds-border-subtle-01)', paddingTop: 6 }}>
            <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Button kind="ghost" size="sm" onClick={() => setOpenTest(p => (p === test ? null : test))}
                renderIcon={openTest === test ? ChevronUp : ChevronDown}>{test}</Button>
              <VerdictTag v={v} />
              {hold && <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{hold.label}</span>}
              {hold && (
                <>
                  <Button size="sm" kind="secondary" onClick={() => onAction('retest', test)}>{t('button.retest', 'Retest')}</Button>
                  <Button size="sm" kind="ghost" onClick={() => onAction('reject', test)}>{t('common.reject', 'Reject')}</Button>
                  <Button size="sm" kind="danger--tertiary" onClick={() => onAction(hold.cause === 'qc' ? 'acceptDespite' : 'acceptDespiteInstrument', test)}>
                    {hold.cause === 'qc'
                      ? t('button.acceptDespiteQc', 'Accept despite QC failure')
                      : t('run.action.acceptDespiteInstrument', 'Accept despite instrument hold')}
                  </Button>
                </>
              )}
            </Stack>
            {openTest === test && (
              <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)', padding: '4px 0 4px 2rem' }}>
                {run.controls.filter(c => c.covers.includes(test)).map((c, i) => (
                  <div key={`c${i}`} style={{ padding: '2px 0' }}>
                    <Tag size="sm" type="cool-gray">{t('run.qc.kind.control', 'Control')}</Tag>{' '}
                    {c.level} · {t('common.lot', 'Lot')} {c.lot} ·{' '}
                    {t('run.control.observedExpected', `observed ${c.observed}, expected ${c.expected}`)} ·{' '}
                    <VerdictTag v={c.verdict} /> · {t(`run.verdictSource.${c.verdictSource}`, c.verdictSource)} · {c.operator} {c.time}
                  </div>
                ))}
                {(run.items || []).filter(i => i.test === test).map((i, n) => (
                  <div key={`i${n}`} style={{ padding: '2px 0' }}>
                    <Tag size="sm" type={i.scope === 'field' ? 'teal' : 'cool-gray'}>
                      {i.scope === 'field' ? t(`run.qc.kind.field${i.kind}`, `Field ${i.kind.toLowerCase()}`) : t(`run.qc.kind.${i.kind.toLowerCase()}`, i.kind)}
                    </Tag>{' '}
                    {i.label} · {i.detail} ·{' '}
                    {i.verdict === 'Planned' ? <Tag size="sm" type="gray">{t('run.qc.planned', 'Planned')}</Tag> : <VerdictTag v={i.verdict} />}
                    {i.time && ` · ${run.operator} ${i.time}`}
                    {i.scope === 'field' && ` · ${t('run.qc.fieldScope', 'a field failure flags its order at validation and does not hold this run')}`}
                  </div>
                ))}
                {hold && hold.cause === 'locked' && (
                  <div>{t('run.qc.lockHint', 'No control for this test has been recorded on this run since the lock was set. Record one; if it passes it lifts the lock (Instruments FR-E3).')}</div>
                )}
              </div>
            )}
          </div>
          );
        })}
      </Stack>
    </Tile>
  );
}

function SettingsBlock({ run, runRows }) {
  const done = runRows.filter(r => r.kind !== 'qc' && r.status !== 'pending').length;
  const total = runRows.filter(r => r.kind !== 'qc').length;
  const kv = (k, v) => (
    <div style={{ minWidth: 190 }}>
      <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{k}</div>
      <div style={{ fontSize: 13 }}>{v}</div>
    </div>
  );
  return (
    <Tile style={{ borderBottom: '1px solid var(--cds-border-subtle)' }}>
      <Stack gap={3}>
        <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>{t('run.header.settings', 'Run settings')}</strong>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 13 }}>{t('run.progress', `${done} of ${total} rows dispositioned`)}</span>
          {run.source === 'WORKPLAN' && (
            <Button kind="tertiary" size="sm">{t('run.action.markComplete', 'Mark complete')}</Button>
          )}
        </Stack>
        <Stack orientation="horizontal" gap={6} style={{ flexWrap: 'wrap' }}>
          {kv(t('run.label.source', 'Source'), run.source)}
          {kv(t('common.method', 'Method'), run.method)}
          {kv(t('run.label.instrument', 'Instrument'), <span>{run.analyzer} <ServiceTag s={run.service.status} /></span>)}
          {kv(t('common.labUnit', 'Lab unit'), run.labUnit)}
          {kv(t('common.operator', 'Operator'), run.operator)}
          {kv(t('run.label.opened', 'Opened'), `${run.opened} (last activity ${run.lastActivity})`)}
          {kv(t('common.status', 'Status'), <Tag size="sm" type={run.state === 'Held' ? 'red' : 'blue'}>{run.state}</Tag>)}
          {kv(t('common.reagentLot', 'Reagent lot'), (
            <span>{run.lot.name}{' '}
              {run.lot.provenance === 'analyzerReported'
                ? <Tag size="sm" type="gray">{t('run.lot.analyzerReported', 'Analyzer-reported')}</Tag>
                : <Button kind="ghost" size="sm">{t('run.lot.useLast', 'Use last-used lot')}</Button>}
            </span>
          ))}
        </Stack>
        {run.placement && (
          <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
            {run.placement}. {t('run.placement.hint', 'Positions can be moved, added or removed in the table; removing a required item makes it missing under the test\u2019s policy.')}
          </div>
        )}
      </Stack>
    </Tile>
  );
}

function ExceptionsBlock({ run, onAction }) {
  if (!run.exceptions.length) return null;              // FR-E4 : hidden when empty
  return (
    <Tile>
      <Stack gap={3}>
        <strong>{t('run.header.exceptions', 'Exceptions')} ({run.exceptions.length})</strong>
        {run.exceptions.map((e, i) => (
          <Stack key={i} orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Tag size="sm" type="purple">{t(`run.exception.${e.kind}`, e.kind)}</Tag>
            <span style={{ fontSize: 13 }}>{e.detail}</span>
            <span style={{ flex: 1 }} />
            {e.kind === 'unmapped'
              ? <Button size="sm" kind="tertiary" onClick={() => onAction('mapNow')}>{t('run.action.mapNow', 'Map now')}</Button>
              : <Button size="sm" kind="tertiary" onClick={() => onAction('match')}>{t('run.action.match', 'Find lab number')}</Button>}
            <Button size="sm" kind="ghost" onClick={() => onAction('ignore')}>{t('common.ignore', 'Ignore')}</Button>
          </Stack>
        ))}
      </Stack>
    </Tile>
  );
}

/* ------------------------------------------------------------------- row panel */

/* FR-E10 / FR-E10a : the row expands into the Results Entry panel, prefilled and editable.
   Everything below the run-specific strip is the Results Entry panel's own rendering; it is
   reproduced here only so the mockup is readable standalone. Do not re-implement it. */
function RowPanel({ row, runs }) {
  const run = row.run ? runs[row.run] : null;
  const hold = holdOf(row, runs);
  const held = !!hold;
  const analyzerRow = run && run.source === 'ANALYZER';
  if (row.kind === 'qc') {
    return (
      <div style={{ padding: '0.75rem 1rem', background: 'var(--cds-layer-01)', fontSize: 13 }}>
        {row.planned ? (
          <Stack gap={3}>
            <span>{t('run.qc.plannedBody', `Planned position ${row.pos}: ${row.qcLabel}. Enter the value when it has been run; until then the item is missing under the test\u2019s policy.`)}</span>
            <Stack orientation="horizontal" gap={3}>
              <Button size="sm" kind="ghost">{t('run.action.movePosition', 'Move')}</Button>
              <Button size="sm" kind="ghost">{t('run.action.removePosition', 'Remove')}</Button>
            </Stack>
          </Stack>
        ) : (
          <span>{t('run.qc.itemBody', 'QC item recorded on the run. It is a QC result and never appears on a client report, certificate, export or site statistic (FR-G8, D-099).')}</span>
        )}
      </div>
    );
  }
  const [value, setValue] = useState(row.value || '');
  const edited = analyzerRow && value !== (row.value || '');
  return (
    <div style={{ padding: '0.75rem 1rem', background: 'var(--cds-layer-01)' }}>
      <Stack gap={3}>
        {held && (
          <InlineNotification kind="error" lowContrast hideCloseButton
            title={hold.label}
            subtitle={`${hold.reason[0].toUpperCase()}${hold.reason.slice(1)}. ${t('run.row.heldBody',
              'This row cannot be accepted, entered, edited or released until the hold is dispositioned on the QC block above.')}`} />
        )}

        {analyzerRow && !held && (
          <ReuseBoundary
            title={t('mockup.reuse.panel.title', 'Results Entry row panel')}
            owner={t('mockup.reuse.panel.owner', 'Owned by results-entry-multicomponent.md (OGC-811) section D. Real fields, ranges, component rendering, critical handling, reference sections and states come from the shipped panel.')}
            adds={t('mockup.reuse.panel.adds', 'the provenance line, the prefilled and tagged analyzer value, and the edited-value treatment (FR-E10, FR-E10a).')}>
            {/* run-specific strip: the only thing Runs adds above the Results Entry panel */}
            <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
              {t('run.row.mapsTo', 'Maps to')} {row.test} ({run.method}) ·{' '}
              {t('run.row.unitCheck', 'Unit check')}: {t('run.row.unitOk', 'analyzer unit matches the configured unit')} ·{' '}
              {t('common.reagentLot', 'Reagent lot')} {run.lot.name} · {t('run.label.run', 'Run')} {run.id}
              {row.dup && <> · <strong>{t('run.row.duplicate', 'an accepted result already exists; choose Keep or Replace')}</strong></>}
            </div>

            {/* Results Entry panel, prefilled */}
            <Stack orientation="horizontal" gap={4} style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <TextInput id={`val-${row.id}`} size="sm" labelText={t('common.result', 'Result')}
                value={value} onChange={e => setValue(e.target.value)} style={{ maxWidth: 260 }} />
              <Tag size="sm" type="gray">{t('run.lot.analyzerReported', 'Analyzer-reported')}</Tag>
              {edited && (
                <span style={{ fontSize: 12 }}>
                  <Tag size="sm" type="magenta">{t('run.row.edited', 'Edited')}</Tag>{' '}
                  {t('run.row.editedNote', `Analyzer reported ${row.value}; the accepted value will be recorded as yours and both are kept on the run.`)}
                </span>
              )}
              {row.flag === 'critical' && (
                <Tag size="sm" type="red" renderIcon={Warning}><strong>{t('label.flag.critical', 'Critical')}</strong></Tag>)}
              {row.flag === 'abnormal' && (
                <Tag size="sm" type="warm-gray"><strong>{t('label.flag.abnormal', 'Abnormal')}</strong></Tag>)}
            </Stack>
            {row.components && (
              <div style={{ fontSize: 13 }}>
                {row.components.map((c, i) => <div key={i} style={{ paddingLeft: '1rem' }}>{c}</div>)}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
              {t('run.row.lands',
                'Saving here records the result as entered, not yet validated, and puts it in the Validation queue like any other result entry.')}
            </div>
            <Stack orientation="horizontal" gap={3}>
              {row.dup
                ? <>
                    <Button size="sm" kind="primary">{t('button.keep', 'Keep existing')}</Button>
                    <Button size="sm" kind="secondary">{t('button.replace', 'Replace')}</Button>
                  </>
                : <Button size="sm" kind="primary">{t('common.accept', 'Accept')}</Button>}
              <Button size="sm" kind="secondary">{t('button.retest', 'Retest')}</Button>
              <Button size="sm" kind="ghost">{t('common.ignore', 'Ignore')}</Button>
              <Button size="sm" kind="ghost">{t('button.viewRaw', 'View raw')}</Button>
            </Stack>
            <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginTop: 6 }}>
              {t('mockup.reuse.panel.missing',
                'The shipped panel also carries notes, order info, history, attachments, storage, method and the rest of its reference sections. They are omitted here on purpose; their absence from this mockup is not a scope decision.')}
            </div>
          </ReuseBoundary>
        )}

        <Accordion>
          <AccordionItem title={t('run.row.reagentsQc', 'Reagents, QC and Controls')}>
            <div style={{ fontSize: 13 }}>
              {run ? (
                <>
                  <div>{t('common.reagentLot', 'Reagent lot')}: {run.lot.name} ({t(`run.lot.${run.lot.provenance}`, run.lot.provenance)})</div>
                  {run.controls.filter(c => c.covers.includes(row.test)).map((c, i) => (
                    <div key={i}>{c.level} · {c.lot} · {c.observed} vs {c.expected} · {c.verdict} · {c.operator} {c.time}</div>
                  ))}
                  <div style={{ color: 'var(--cds-text-secondary)' }}>
                    {t('run.row.readOnlyOnRun', 'Read-only here; lot and controls are edited once, on the run header. The same record is what the validator sees on the Validation page.')}
                  </div>
                </>
              ) : (
                <div>{t('run.row.willCreateRun', 'Entering a result here records the lot and control you enter as a run of one.')}</div>
              )}
            </div>
          </AccordionItem>
        </Accordion>
      </Stack>
    </div>
  );
}

/* -------------------------------------------------------------------- bulk bar */

function BulkBar({ run, runRows, selected, chipLabel, eligibleInFilter, onSelectAllInFilter, onClear, onAccept }) {
  const sel = runRows.filter(r => selected.includes(r.id));
  const held = [...new Set(sel.filter(r => r.held).map(r => r.test))];
  const skipped = sel.filter(r => r.dup || r.exception || held.includes(r.test));
  const accept = sel.filter(r => !skipped.includes(r));
  const crit = accept.filter(r => r.flag === 'critical').length;
  const abn = accept.filter(r => r.flag === 'abnormal').length;

  return (
    <Tile style={{ marginBottom: '0.5rem' }}>
      <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Button kind="tertiary" size="sm" disabled={!eligibleInFilter} onClick={onSelectAllInFilter}>
          {t('run.bulk.selectAllInFilter', `Select all ${eligibleInFilter} in ${chipLabel}`)}
        </Button>
        {sel.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--cds-text-secondary)' }}>
            {t('run.bulk.empty',
              'Select rows to see exactly what Accept will write. Selection spans the whole run, not just this page or this chip. Held rows are dispositioned on the QC block.')}
          </span>
        ) : (
          <>
            <span style={{ fontSize: 13 }}>
              <strong>{t('run.bulk.selectionScope', `${sel.length} selected across this run`)}</strong>
              {'. '}
              {t('run.bulk.accept', `Accept ${accept.length}: ${accept.length - crit - abn} normal, ${abn} abnormal, ${crit} critical`)}
              {crit > 0 && ` (${t('run.bulk.ackTasks', `creates ${crit} acknowledgment tasks`)})`}.
              {skipped.length > 0 && (
                <span> {t('run.bulk.skipped', `${skipped.length} will be skipped`)}: {
                  skipped.slice(0, 4).map(r => `${r.sample} ${r.test} (${
                    r.dup ? t('run.skip.dup', 'already resulted')
                      : r.exception ? t('run.skip.exception', 'unresolved exception')
                        : t('run.skip.held', 'held')})`).join('; ')
                }{skipped.length > 4 && t('run.bulk.andMore', ` and ${skipped.length - 4} more`)}.</span>
              )}
              <span style={{ color: 'var(--cds-text-secondary)' }}>
                {' '}{t('run.bulk.lotAttached', `Lot attached to all accepted results: ${run.lot.name}.`)}
                {' '}{t('run.bulk.lands', 'All of them land entered, not validated, and enter the Validation queue.')}
              </span>
            </span>
            <span style={{ flex: 1 }} />
            <Button size="sm" kind="primary" disabled={!accept.length} onClick={() => onAccept(accept.length)}>
              {t('common.accept', 'Accept')} {accept.length}
            </Button>
            <Button size="sm" kind="secondary">{t('button.retest', 'Retest')} {accept.length}</Button>
            <Button size="sm" kind="ghost">{t('common.ignore', 'Ignore')} {accept.length}</Button>
            <Button size="sm" kind="ghost" onClick={onClear}>{t('run.bulk.clearSelection', 'Clear selection')}</Button>
          </>
        )}
      </Stack>
    </Tile>
  );
}

/* ------------------------------------------------------------------------ page */

export default function ResultsWithRuns() {
  const [runs] = useState(RUNS);
  const [rows, setRows] = useState(ALL_ROWS);
  const [labUnit, setLabUnit] = useState('all');
  const [runFilter, setRunFilterRaw] = useState(null);     // ?run=<id>
  const [chip, setChip] = useState('all');                 // the run's only row control  FR-E1a
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);            // FR-E1a
  const [showHeld, setShowHeld] = useState(true);          // FR-D2, default on
  const [selected, setSelected] = useState([]);            // run-scoped, not page        FR-E11a
  const [toast, setToast] = useState(null);

  const setRunFilter = id => { setRunFilterRaw(id); setSelected([]); setPage(1); setChip('all'); };
  const say = msg => { setToast(msg); setTimeout(() => setToast(null), 6000); };

  const run = runFilter ? runs[runFilter] : null;
  const runRows = useMemo(() => rows.filter(r => r.run === runFilter).map(r => ({ ...r, held: isHeld(r, runs) })), [rows, runFilter, runs]);
  const held = useMemo(() => heldTestsIn(runRows, runs), [runRows, runs]);
  const hasPositions = !!run && runRows.some(r => r.pos);

  /* whole-run chip counts : FR-E1a; in the real page these arrive with the run header request */
  const chipCounts = useMemo(() => {
    const c = {};
    CHIPS.forEach(ch => { c[ch.key] = runRows.filter(r => ch.match(r, held)).length; });
    return c;
  }, [runRows, held]);

  const unitRows = rows.filter(r => labUnit === 'all' || r.unit === labUnit);
  const unitRuns = Object.values(runs).filter(r => (labUnit === 'all' || r.labUnit === labUnit)
    && r.state !== 'Complete' && r.state !== 'Superseded');
  const heldCount = unitRows.filter(r => isHeld(r, runs)).length;

  /* the unfiltered worklist never renders a whole rack: one row per analyzer run stands in */
  const worklistRows = useMemo(() => {
    const seen = new Set();
    return unitRows.filter(r => {
      if (r.kind === 'qc') return false;
      if (!r.run) return true;
      if (runs[r.run].source !== 'ANALYZER') return true;
      const key = `${r.run}${isHeld(r, runs) ? ':held' : ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).filter(r => showHeld || !isHeld(r, runs));
  }, [unitRows, runs, showHeld]);

  /* the active chip's rows, sorted exceptions and held first (FR-E6); a batch with planned
     positions shows them in position order on All (FR-I2) */
  const filteredRunRows = useMemo(() => {
    const f = runRows.filter(r => chipMatch(chip, r, held));
    return hasPositions && chip === 'all' ? f : f.sort((a, b) => sortRank(a, held) - sortRank(b, held));
  }, [runRows, chip, held, hasPositions]);

  const pagedRows = filteredRunRows.slice((page - 1) * pageSize, page * pageSize);

  /* FR-E11a : acts on every eligible row the active chip matches, across every page */
  const eligibleInFilter = filteredRunRows.filter(r => r.kind !== 'qc' && r.status === 'pending'
    && !r.dup && !r.exception && !held.includes(r.test));

  const selectAllInFilter = () => {
    const ids = eligibleInFilter.map(r => r.id);
    setSelected(ids);
    say(t('run.toast.selectedAll',
      `${ids.length} rows selected across the whole run, not just this page.`));
  };

  const batchThese = () => {
    const sel = rows.filter(r => selected.includes(r.id));
    if (sel.length < 2 || new Set(sel.map(r => r.test)).size !== 1) return;
    setRows(rows.map(r => (selected.includes(r.id) ? { ...r, run: 'RUN-2409-0143' } : r)));
    setSelected([]);
    say(t('run.toast.batched', `${sel.length} rows batched into a new workplan run. Record the kit control once on the run; placement rules apply when the test has them.`));
  };

  const qcAction = (action, test) => say({
    retest: t('run.toast.retest',
      `Retest requested for ${test}. A later run covering these samples will offer a "retest of ${runFilter}" link.`),
    reject: t('run.toast.reject',
      `${test} rows marked Rejected: QC. Filing a non-conformance event is offered, not required.`),
    acceptDespite: t('run.toast.acceptDespite',
      `Accept despite QC failure: a non-conformance event was opened, pre-populated from ${runFilter}. The rows land entered, not validated, and carry the QC fail chip on Validation.`),
    acceptDespiteInstrument: t('run.toast.acceptDespiteInstrument',
      `Accept despite instrument hold: a non-conformance event was opened with the instrument and its reason. The rows land entered, not validated.`),
    addBlank: t('run.toast.addBlank', 'A blank opens as a new inline row in the run (FR-E2).'),
    addDuplicate: t('run.toast.addDuplicate', 'Pick the parent from the run\u2019s samples; its aliquot and label are created when the value is entered (FR-I3).'),
    match: t('run.toast.match', 'Record matched to a lab number; the run proceeds.'),
    mapNow: t('run.toast.mapNow', 'Opens Analyzer Types & Mapping with the unmapped code preselected.'),
    ignore: t('run.toast.ignore', 'Ignored with a reason; only this record is affected.'),
  }[action]);

  const headers = [
    { key: 'sample', header: t('common.sampleId', 'Sample ID') },
    { key: 'test',   header: t('common.test', 'Test') },
    { key: 'value',  header: t('common.result', 'Result') },
    { key: 'method', header: `${t('common.method', 'Method')} / ${t('run.label.instrument', 'Instrument')}` },
    { key: 'status', header: t('common.status', 'Status') },
    { key: 'flags',  header: t('common.flags', 'Flags') },
  ];

  const renderTable = list => (
    <DataTable size="sm" headers={headers}
      rows={list.map(r => ({ ...r, method: r.run ? runs[r.run].method : t('common.manual', 'Manual') }))}>
      {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps, getTableProps, getExpandedRowProps }) => (
        <TableContainer>
          {!run && (
            <TableToolbar><TableToolbarContent>
              <TableToolbarSearch persistent placeholder={t('run.search.placeholder', 'Sample ID, patient, test')} />
            </TableToolbarContent></TableToolbar>
          )}
          <Table {...getTableProps()}>
            <TableHead><TableRow>
              <TableHeader />
              <TableExpandHeader />
              {hasPositions && <TableHeader>{t('run.placement.position', 'Pos.')}</TableHeader>}
              {dtHeaders.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}
            </TableRow></TableHead>
            <TableBody>
              {dtRows.map(dr => {
                const row = rows.find(r => r.id === dr.id);
                const rr = row.run ? runs[row.run] : null;
                const hold = holdOf(row, runs);
                const rowHeld = !!hold;
                const isQc = row.kind === 'qc';
                const showValue = isQc ? !!row.value
                  : row.status !== 'pending' || (runFilter && rr && rr.source === 'ANALYZER' && !rowHeld);
                return (
                  <React.Fragment key={dr.id}>
                    <TableExpandRow {...getRowProps({ row: dr })}>
                      <TableCell>
                        <Checkbox id={`sel-${row.id}`} labelText="" hideLabel
                          disabled={isQc || row.status === 'accepted' || (!runFilter && !!row.run)
                            || (!!runFilter && (rowHeld || !!row.exception))}
                          checked={selected.includes(row.id)}
                          onChange={() => setSelected(s => (s.includes(row.id) ? s.filter(x => x !== row.id) : [...s, row.id]))} />
                      </TableCell>
                      {hasPositions && <TableCell>{row.pos}</TableCell>}
                      <TableCell>
                        {isQc && <><Tag size="sm" type="cool-gray">{t('run.qc.rowTag', 'QC')}</Tag>{' '}<strong>{row.qcLabel}</strong>{' '}</>}
                        {!isQc && <><strong>{row.sample}</strong>{' '}</>}
                        <span style={{ color: 'var(--cds-text-secondary)', fontSize: 12 }}>{isQc ? row.sample : row.patient}</span>
                      </TableCell>
                      <TableCell>{row.test}</TableCell>
                      <TableCell>
                        {showValue
                          ? <span>{row.value}{row.components && runFilter && (
                              <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
                                {t('label.validation.components', `${row.components.length} components`)}
                              </div>)}</span>
                          : <span style={{ color: 'var(--cds-text-secondary)' }}>
                              {row.planned ? t('run.qc.planned', 'Planned') : t('run.value.notEntered', 'Not entered')}</span>}
                      </TableCell>
                      <TableCell>
                        {rr
                          ? <span>{rr.method}{' '}
                              <span style={{ color: 'var(--cds-text-secondary)', fontSize: 12 }}>
                                {rr.analyzer}</span>{' '}
                              {runFilter && rr.source === 'ANALYZER' && (
                                <Tag size="sm" type="gray">{t('run.lot.analyzerReported', 'Analyzer-reported')}</Tag>)}
                            </span>
                          : <span style={{ color: 'var(--cds-text-secondary)' }}>{t('common.manual', 'Manual')}</span>}
                      </TableCell>
                      <TableCell>
                        {isQc
                          ? (row.planned ? <Tag size="sm" type="gray">{t('run.qc.planned', 'Planned')}</Tag> : <VerdictTag v={row.verdict} />)
                          : <Tag size="sm" type={row.status === 'entered' ? 'teal' : 'gray'}>{t(`common.${row.status}`, row.status)}</Tag>}
                        {!runFilter && <RunRowTag row={row} runs={runs} onOpenRun={setRunFilter} />}
                        {runFilter && rowHeld && (
                          <Tag size="sm" type="red" renderIcon={Warning}><strong>{hold.cause === 'qc' ? t('run.state.Held', 'Held') : hold.label}</strong></Tag>)}
                      </TableCell>
                      <TableCell>
                        {showValue && row.flag === 'critical' && (
                          <Tag size="sm" type="red" renderIcon={Warning}><strong>{t('label.flag.critical', 'Critical')}</strong></Tag>)}
                        {showValue && row.flag === 'abnormal' && (
                          <Tag size="sm" type="warm-gray"><strong>{t('label.flag.abnormal', 'Abnormal')}</strong></Tag>)}
                        {runFilter && row.dup && <Tag size="sm" type="magenta">{t('run.skip.dup', 'Already resulted')}</Tag>}
                        {runFilter && row.exception && (
                          <Tag size="sm" type="purple">{t(`run.exception.${row.exception}`, row.exception)}</Tag>)}
                      </TableCell>
                    </TableExpandRow>
                    <TableExpandedRow colSpan={dtHeaders.length + 2} {...getExpandedRowProps({ row: dr })}>
                      <RowPanel row={row} runs={runs} />
                    </TableExpandedRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );

  return (
    <Grid fullWidth>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('common.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/WorkPlan">{t('common.workplan', 'Workplan')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('common.results', 'Results')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 style={{ fontWeight: 400, margin: '0.5rem 0 0.25rem' }}>{t('common.results', 'Results')}</h1>

        <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
          {run ? (
            <span>
              {t('run.label.run', 'Run')} <strong>{run.id}</strong> ·{' '}
              {run.source === 'ANALYZER' ? t('run.source.analyzer', 'Analyzer message') : t('run.source.workplan', 'Workplan batch')} ·{' '}
              {run.labUnit} · {t('run.rowCount', `${runRows.length} rows`)}
              &nbsp;<Button kind="ghost" size="sm" onClick={() => setRunFilter(null)}>
                ← {t('run.action.backToAll', 'All pending results')}
              </Button>
            </span>
          ) : t('run.worklist.intro',
            'Pending results for your lab units. Rows waiting in or held by a run say so; open the run to review it.')}
        </p>

        {!run && (
          <Stack orientation="horizontal" gap={4} style={{ alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Select id="lab-unit" size="sm" labelText={t('common.labUnit', 'Lab unit')} value={labUnit}
              onChange={e => setLabUnit(e.target.value)} style={{ minWidth: 220 }}>
              <SelectItem value="all" text={t('run.filter.allUnits', 'All my lab units')} />
              <SelectItem value="Chemistry" text="Chemistry" />
              <SelectItem value="Hematology" text="Hematology" />
              <SelectItem value="Environmental" text="Environmental" />
            </Select>
            <Tag type="high-contrast">{t('filter.all', 'All')} {unitRows.filter(r => r.status !== 'accepted').length}</Tag>
            <Tag type="outline">{t('filter.needsReview', 'Needs review')}</Tag>
            <Tag type={showHeld ? 'red' : 'outline'} onClick={() => setShowHeld(v => !v)} style={{ cursor: 'pointer' }}>
              <strong>{t('run.filter.held', 'Held')} {heldCount}</strong>
            </Tag>
            <RunsChip runs={unitRuns} rows={rows} onPick={setRunFilter} />
            <span style={{ flex: 1 }} />
            <Button kind="tertiary" size="sm" onClick={batchThese}
              disabled={selected.length < 2
                || new Set(rows.filter(r => selected.includes(r.id)).map(r => r.test)).size !== 1}>
              {t('run.action.batchThese', 'Batch these')}{selected.length ? ` (${selected.length})` : ''}
            </Button>
          </Stack>
        )}

        {run && (
          <>
            <Stack style={{ marginBottom: '1rem', border: '1px solid var(--cds-border-subtle)' }}>
              <QcBlock key={run.id} run={run} runRows={runRows} runs={runs} onAction={qcAction} />
              <SettingsBlock run={run} runRows={runRows} />
              <ExceptionsBlock run={run} onAction={qcAction} />
            </Stack>

            {/* FR-E1b : opening a run replaces the worklist's other filters */}
            <InlineNotification kind="info" lowContrast hideCloseButton style={{ maxWidth: 'none', marginBottom: '0.5rem' }}
              title={t('run.filters.replacedTitle', 'The run is the filter')}
              subtitle={t('run.filters.replacedBody',
                'Opening a run replaced the lab unit, search and signal filters you had on the worklist; the run opens whole, on All. The analyzer and its tests already carry the lab unit, so nothing is lost. Leaving the run restores what you had.')} />

            {/* FR-E1a : the worklist's own filter chips, counted over the whole run */}
            <ReuseBoundary
              title={t('mockup.reuse.chips.title', 'Results worklist filter chip row')}
              owner={t('mockup.reuse.chips.owner', 'Owned by Results Entry v4 / the worklist. Real chip set, order and behaviour come from the live app.')}
              adds={t('mockup.reuse.chips.adds', 'the Held chip, and counts computed over the whole run rather than the page (FR-E1a).')}>
              <Stack orientation="horizontal" gap={3}
                style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                {CHIPS.filter(c => c.key === 'all' || chipCounts[c.key] > 0).map(c => (
                  <Tag key={c.key} type={chip === c.key ? 'high-contrast' : c.key === 'held' ? 'red' : 'outline'}
                    onClick={() => { setChip(c.key); setPage(1); }} style={{ cursor: 'pointer' }}>
                    <strong>{c.label} {chipCounts[c.key]}</strong>
                  </Tag>
                ))}
                <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
                  {t('run.counts.hint', 'Counts are for the whole run, not the visible page.')}
                  {hasPositions && ` ${t('run.placement.orderHint', 'On All, a batch with planned positions shows them in position order.')}`}
                </span>
              </Stack>
            </ReuseBoundary>

            {(run.source === 'ANALYZER' || hasPositions) && (
              <BulkBar run={run} runRows={runRows} selected={selected}
                chipLabel={CHIPS.find(c => c.key === chip).label}
                eligibleInFilter={eligibleInFilter.length}
                onSelectAllInFilter={selectAllInFilter} onClear={() => setSelected([])}
                onAccept={n => {
                  say(t('run.toast.accepted',
                    `${n} results accepted with lot ${run.lot.name}. They are entered, not validated, and are now in the Validation queue. Undo available for 30 seconds.`));
                  setSelected([]);
                }} />
            )}

            {renderTable(pagedRows)}
            <Pagination page={page} pageSize={pageSize} pageSizes={[25, 50, 100]}
              totalItems={filteredRunRows.length}
              onChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }} />
          </>
        )}

        {!run && renderTable(worklistRows)}

        {toast && (
          <div style={{ position: 'fixed', right: '1.5rem', bottom: '1.5rem', maxWidth: 560 }}>
            <InlineNotification kind="success" lowContrast title={t('common.done', 'Done')} subtitle={toast}
              onCloseButtonClick={() => setToast(null)} />
          </div>
        )}
      </Column>
    </Grid>
  );
}

/* ===========================================================================
   Configuration surfaces added in v0.5. Each is drawn as the section it adds to an existing
   page; the rest of that page is fenced as existing UI.
   =========================================================================== */

/* Test Catalog editor, QC section (D-058): policy per QC kind, ceiling and RPD limit,
   record-the-instrument setting (FR-H1) and placement rules (FR-I1).
   Route: the shipped editor's QC section leaf.
   Breadcrumb: Home / Admin Management / Test Catalog / [test] / QC */
export function TestCatalogQcPolicy() {
  const [policy, setPolicy] = useState({
    Control: { required: 'yes', missing: 'hold' },
    Blank: { required: 'yes', missing: 'hold', fails: 'hold' },
    Duplicate: { required: 'yes', missing: 'warn', fails: 'hold' },
  });
  const [recordInstrument, setRecordInstrument] = useState('required');
  const [blanksStart, setBlanksStart] = useState(1);
  const [blankEvery, setBlankEvery] = useState(0);
  const [ctlStart, setCtlStart] = useState(['L1', 'L2']);
  const [ctlEnd, setCtlEnd] = useState(['L2']);
  const [dupEvery, setDupEvery] = useState(10);
  const [dupMode, setDupMode] = useState('nth');
  const set = (kind, key, v) => setPolicy(p => ({ ...p, [kind]: { ...p[kind], [key]: v } }));
  const toggleLevel = (arr, setArr, l) => setArr(arr.includes(l) ? arr.filter(x => x !== l) : [...arr, l]);
  const n = 40;
  const dups = dupEvery ? Math.floor(n / dupEvery) : 0;
  const blanks = blanksStart + (blankEvery ? Math.floor(n / blankEvery) : 0);
  const total = n + blanks + ctlStart.length + ctlEnd.length + dups;

  const policySelect = (kind, key, options) => (
    <Select id={`${kind}-${key}`} size="sm" hideLabel labelText={`${kind} ${key}`} value={policy[kind][key]}
      onChange={e => set(kind, key, e.target.value)}>
      {options.map(([v, label]) => <SelectItem key={v} value={v} text={label} />)}
    </Select>
  );
  const yesNo = [['yes', t('common.yes', 'Yes')], ['no', t('common.no', 'No')]];
  const warnHold = [['warn', t('admin.testCatalog.qc.policy.warn', 'Warn')], ['hold', t('admin.testCatalog.qc.policy.hold', 'Hold')]];
  const holdWarn = [['hold', t('admin.testCatalog.qc.policy.hold', 'Hold')], ['warn', t('admin.testCatalog.qc.policy.warn', 'Warn')]];

  return (
    <Grid fullWidth>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('common.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/MasterListsPage">{t('breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('admin.testCatalog.title', 'Test Catalog')}</BreadcrumbItem>
          <BreadcrumbItem href="#">Lead (ICP-MS)</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('admin.testCatalog.qc.title', 'QC')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 style={{ fontWeight: 400, margin: '0.5rem 0 1rem' }}>Lead (ICP-MS)</h1>

        <ReuseBoundary
          title={t('mockup.reuse.qcTargets.title', 'QC section: control targets, LOD and LOQ')}
          owner={t('mockup.reuse.qcTargets.owner', 'Owned by test-catalog-qc-targets.md (OGC-1148) and D-058.')}
          adds={t('mockup.reuse.qcTargets.adds', 'the policy table, the instrument setting and the placement rules below (FR-H1, FR-I1).')}>
          <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
            L1 10.0 ± 1.0 µg/L · L2 50.0 ± 5.0 µg/L · LOD 0.05 µg/L · LOQ 0.2 µg/L
          </span>
        </ReuseBoundary>

        <Tile style={{ marginTop: '1rem' }}>
          <Stack gap={4}>
            <div>
              <strong>{t('admin.testCatalog.qc.policy.title', 'QC policy')}</strong>
              <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
                {t('admin.testCatalog.qc.policy.help', 'What each analyzer run and workplan batch of this test must carry, and what happens when an item is missing or fails. A run of one needs only its control.')}
              </div>
            </div>
            <DataTable size="sm" rows={['Control', 'Blank', 'Duplicate'].map(k => ({ id: k }))}
              headers={[
                { key: 'kind', header: t('admin.testCatalog.qc.policy.kind', 'Kind') },
                { key: 'required', header: t('admin.testCatalog.qc.policy.required', 'Required per run') },
                { key: 'missing', header: t('admin.testCatalog.qc.policy.whenMissing', 'When missing') },
                { key: 'fails', header: t('admin.testCatalog.qc.policy.whenFails', 'When it fails') },
                { key: 'limit', header: t('admin.testCatalog.qc.policy.evaluatedAgainst', 'Evaluated against') },
              ]}>
              {({ rows, headers, getHeaderProps, getTableProps }) => (
                <TableContainer>
                  <Table {...getTableProps()}>
                    <TableHead><TableRow>{headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow></TableHead>
                    <TableBody>
                      {rows.map(r => (
                        <TableRow key={r.id}>
                          <TableCell><strong>{t(`run.qc.kind.${r.id.toLowerCase()}`, r.id)}</strong></TableCell>
                          <TableCell>{policySelect(r.id, 'required', yesNo)}</TableCell>
                          <TableCell>{policySelect(r.id, 'missing', warnHold)}</TableCell>
                          <TableCell>{r.id === 'Control'
                            ? <span style={{ fontSize: 12 }}>{t('admin.testCatalog.qc.policy.controlAlwaysHolds', 'Always holds the test (FR-C4)')}</span>
                            : policySelect(r.id, 'fails', holdWarn)}</TableCell>
                          <TableCell>
                            {r.id === 'Control' && t('admin.testCatalog.qc.policy.targetsAbove', 'Targets above')}
                            {r.id === 'Blank' && <NumberInput id="ceiling" size="sm" label={t('admin.testCatalog.qc.blankCeiling', 'Blank ceiling (µg/L)')} min={0} step={0.1} value={0.5} />}
                            {r.id === 'Duplicate' && <NumberInput id="rpd" size="sm" label={t('admin.testCatalog.qc.rpdLimit', 'Duplicate RPD limit (%)')} min={0} step={1} value={20} />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
            <Select id="record-instrument" size="sm" labelText={t('admin.testCatalog.qc.recordInstrument', 'Record the instrument used')}
              value={recordInstrument} onChange={e => setRecordInstrument(e.target.value)} style={{ maxWidth: 240 }}
              helperText={recordInstrument === 'required'
                ? t('admin.testCatalog.qc.recordInstrument.requiredHelp', 'A result for this test cannot be saved without naming the instrument, so instrument status always reaches it.')
                : t('admin.testCatalog.qc.recordInstrument.optionalHelp', 'Results may be saved without an instrument; such results are not affected by instrument status.')}>
              <SelectItem value="optional" text={t('admin.testCatalog.qc.optional', 'Optional')} />
              <SelectItem value="required" text={t('admin.testCatalog.qc.required', 'Required')} />
            </Select>
          </Stack>
        </Tile>

        <Tile style={{ marginTop: '1rem' }}>
          <Stack gap={4}>
            <div>
              <strong>{t('admin.testCatalog.qc.placement.title', 'Placement rules')}</strong>
              <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
                {t('admin.testCatalog.qc.placement.help', 'Optional. When a workplan batch is created for this test, OpenELIS plans these positions. A QC layout chosen at batch creation overrides them.')}
              </div>
            </div>
            <Stack orientation="horizontal" gap={6} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <NumberInput id="blanks-start" size="sm" min={0} value={blanksStart} onChange={(e, { value }) => setBlanksStart(Number(value))}
                label={t('admin.testCatalog.qc.placement.blanksStart', 'Blanks at start')} />
              <NumberInput id="blank-every" size="sm" min={0} value={blankEvery} onChange={(e, { value }) => setBlankEvery(Number(value))}
                label={t('admin.testCatalog.qc.placement.blankEvery', 'Then one blank every N samples (0 = none)')} />
              <div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>{t('admin.testCatalog.qc.placement.controlsStart', 'Control levels at start')}</div>
                {['L1', 'L2'].map(l => <Checkbox key={l} id={`cs-${l}`} labelText={l} checked={ctlStart.includes(l)} onChange={() => toggleLevel(ctlStart, setCtlStart, l)} />)}
              </div>
              <div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>{t('admin.testCatalog.qc.placement.controlsEnd', 'Control levels at end')}</div>
                {['L1', 'L2'].map(l => <Checkbox key={l} id={`ce-${l}`} labelText={l} checked={ctlEnd.includes(l)} onChange={() => toggleLevel(ctlEnd, setCtlEnd, l)} />)}
              </div>
              <NumberInput id="dup-every" size="sm" min={0} value={dupEvery} onChange={(e, { value }) => setDupEvery(Number(value))}
                label={t('admin.testCatalog.qc.placement.dupEvery', 'One duplicate per N samples (0 = none)')} />
              <RadioButtonGroup legendText={t('admin.testCatalog.qc.placement.dupMode', 'Duplicate sample')} name="dup-mode"
                valueSelected={dupMode} onChange={v => setDupMode(v)} orientation="vertical">
                <RadioButton id="dup-nth" value="nth" labelText={t('admin.testCatalog.qc.placement.dupNth', 'Every Nth sample')} />
                <RadioButton id="dup-pick" value="pick" labelText={t('admin.testCatalog.qc.placement.dupPick', 'Technician picks')} />
              </RadioButtonGroup>
            </Stack>
            <InlineNotification kind="info" lowContrast hideCloseButton style={{ maxWidth: 'none' }}
              title={t('admin.testCatalog.qc.placement.previewTitle', 'For a 40-sample batch')}
              subtitle={t('admin.testCatalog.qc.placement.preview',
                `${blanks} blank(s), ${ctlStart.join(' and ') || 'no controls'} at start, ${ctlEnd.join(' and ') || 'no controls'} at end, ${dups} duplicate(s)${dupMode === 'pick' ? ' (technician picks)' : ''}: ${total} positions.`)} />
            <Stack orientation="horizontal" gap={3}>
              <Button size="sm" kind="primary">{t('common.save', 'Save')}</Button>
              <Button size="sm" kind="ghost">{t('common.cancel', 'Cancel')}</Button>
            </Stack>
          </Stack>
        </Tile>
      </Column>
    </Grid>
  );
}

/* Workplan Configuration: QC layouts list (FR-I5).
   Route: /MasterListsPage/WorkPlanConfigurationMenu
   Breadcrumb: Home / Admin Management / Workplan Configuration
   Admin list conventions: Active toggle and Edit button per row, Edit expands inline (D-111),
   deactivated rows hidden behind Show deactivated (D-002). */
const QC_LAYOUTS = [
  { id: 1, name: 'ICP-MS 40-position rack', labUnit: 'Environmental', capacity: 40, active: true,
    tests: ['Lead (ICP-MS)', 'Cadmium (ICP-MS)', 'Arsenic (ICP-MS)'], defaultFor: 'Lead (ICP-MS)' },
  { id: 2, name: 'PCR 96-well plate', labUnit: 'Molecular', capacity: 96, active: true,
    tests: ['HIV-1 viral load', 'HBV viral load'], defaultFor: 'HIV-1 viral load' },
  { id: 3, name: 'AAS 24-cup tray', labUnit: 'Environmental', capacity: 24, active: false,
    tests: ['Lead (AAS)'], defaultFor: null },
];
const TEST_OPTIONS = ['Lead (ICP-MS)', 'Cadmium (ICP-MS)', 'Arsenic (ICP-MS)', 'Mercury (CV-AAS)',
  'HIV-1 viral load', 'HBV viral load', 'HCV viral load', 'Lead (AAS)'].map(x => ({ id: x, text: x }));
const slotMap = capacity => Array.from({ length: Math.min(capacity, 40) }, (_, i) => {
  const s = i + 1;
  if (s === 1) return 'blank';
  if (s === 2) return 'L1';
  if (s === 3) return 'L2';
  if (s === capacity) return 'L2';
  if ((s - 3) % 11 === 0) return `dup:${s - 1}`;
  return 'sample';
});

export function WorkplanQcLayouts() {
  const [layouts, setLayouts] = useState(QC_LAYOUTS);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [open, setOpen] = useState(1);
  const [slots, setSlots] = useState(slotMap(40));
  const list = layouts.filter(l => showDeactivated || l.active);
  const slotOptions = i => [
    ['sample', t('admin.workplan.layout.sample', 'Sample')], ['blank', t('run.qc.kind.blank', 'Blank')],
    ['L1', 'L1'], ['L2', 'L2'],
    [`dup:${Math.max(1, i)}`, t('admin.workplan.layout.dupOfSlot', `Duplicate of slot ${Math.max(1, i)}`)],
  ];
  return (
    <Grid fullWidth>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('common.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/MasterListsPage">{t('breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('admin.workplan.title', 'Workplan Configuration')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 style={{ fontWeight: 400, margin: '0.5rem 0 1rem' }}>{t('admin.workplan.title', 'Workplan Configuration')}</h1>
        <ReuseBoundary
          title={t('mockup.reuse.workplanConfig.title', 'Workplan Configuration settings')}
          owner={t('mockup.reuse.workplanConfig.owner', 'Existing page; its three workplan settings render unchanged.')}
          adds={t('mockup.reuse.workplanConfig.adds', 'the QC layouts list below (FR-I5).')}>
          <span style={{ fontSize: 12 }}>{t('mockup.reuse.workplanConfig.body', 'Existing settings.')}</span>
        </ReuseBoundary>

        <Tile style={{ marginTop: '1rem' }}>
          <Stack gap={4}>
            <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{t('admin.workplan.layout.title', 'QC layouts')}</strong>
              <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
                {t('admin.workplan.layout.help', 'Fixed positions for racks and plates. A layout overrides a test’s placement rules when chosen at batch creation.')}
              </span>
              <span style={{ flex: 1 }} />
              <Toggle id="show-deact" size="sm" labelText={t('common.showDeactivated', 'Show deactivated')}
                toggled={showDeactivated} onToggle={v => setShowDeactivated(v)} />
              <Button size="sm" kind="primary" renderIcon={Add}>{t('admin.workplan.layout.add', 'Add layout')}</Button>
            </Stack>
            <DataTable size="sm" rows={list.map(l => ({ id: String(l.id) }))}
              headers={[
                { key: 'name', header: t('common.name', 'Name') },
                { key: 'labUnit', header: t('common.labUnit', 'Lab unit') },
                { key: 'capacity', header: t('admin.workplan.layout.capacity', 'Positions') },
                { key: 'tests', header: t('admin.workplan.layout.tests', 'Applies to tests') },
                { key: 'active', header: t('common.active', 'Active') },
                { key: 'edit', header: '' },
              ]}>
              {({ rows, headers, getHeaderProps, getTableProps }) => (
                <TableContainer>
                  <Table {...getTableProps()}>
                    <TableHead><TableRow>{headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow></TableHead>
                    <TableBody>
                      {rows.map(r => {
                        const l = layouts.find(x => String(x.id) === r.id);
                        return (
                          <React.Fragment key={r.id}>
                            <TableRow>
                              <TableCell><strong>{l.name}</strong></TableCell>
                              <TableCell>{l.labUnit}</TableCell>
                              <TableCell>{l.capacity}</TableCell>
                              <TableCell>
                                {l.tests.map(x => (
                                  <Tag key={x} size="sm" type="gray">{x}{x === l.defaultFor ? ` (${t('admin.workplan.layout.default', 'default')})` : ''}</Tag>
                                ))}
                              </TableCell>
                              <TableCell>
                                <Toggle id={`act-${l.id}`} size="sm" hideLabel labelText={t('common.active', 'Active')} toggled={l.active}
                                  onToggle={v => setLayouts(ls => ls.map(x => (x.id === l.id ? { ...x, active: v } : x)))} />
                              </TableCell>
                              <TableCell>
                                <Button size="sm" kind="ghost" onClick={() => { setOpen(open === l.id ? null : l.id); setSlots(slotMap(l.capacity)); }}>
                                  {t('common.edit', 'Edit')}
                                </Button>
                              </TableCell>
                            </TableRow>
                            {open === l.id && (
                              <TableRow>
                                <TableCell colSpan={6}>
                                  <Stack gap={4} style={{ padding: '0.75rem 0' }}>
                                    <Stack orientation="horizontal" gap={5} style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                      <TextInput id={`nm-${l.id}`} size="sm" labelText={t('common.name', 'Name')} defaultValue={l.name} style={{ width: 260 }} />
                                      <TextInput id={`lu-${l.id}`} size="sm" labelText={t('common.labUnit', 'Lab unit')} defaultValue={l.labUnit} style={{ width: 180 }} />
                                      <NumberInput id={`cap-${l.id}`} size="sm" min={1} label={t('admin.workplan.layout.capacity', 'Positions')} value={l.capacity} />
                                      <FilterableMultiSelect id={`tests-${l.id}`} titleText={t('admin.workplan.layout.tests', 'Applies to tests')}
                                        items={TEST_OPTIONS} itemToString={i => (i ? i.text : '')}
                                        initialSelectedItems={TEST_OPTIONS.filter(o => l.tests.includes(o.id))} style={{ minWidth: 320 }} />
                                      {/* labels, not a count (design-addendum convention) */}
                                      <div>{l.tests.map(x => <Tag key={x} size="sm" type="blue" filter onClose={() => {}}>{x}</Tag>)}</div>
                                    </Stack>
                                    <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
                                      {t('admin.workplan.layout.slotHelp', 'Slot map: each slot is a sample, a blank, a control level or a duplicate of another slot.')}
                                      {l.capacity > 40 && ` ${t('admin.workplan.layout.firstSlots', `First 40 of ${l.capacity} shown.`)}`}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                      {slots.map((s, i) => (
                                        <Select key={i} id={`slot-${l.id}-${i}`} size="sm" labelText={t('admin.workplan.layout.slot', `Slot ${i + 1}`)}
                                          value={s} onChange={e => { const v = e.target.value; setSlots(sl => sl.map((x, j) => (j === i ? v : x))); }}
                                          style={{ width: 150 }}>
                                          {slotOptions(i).concat(s.startsWith('dup:') && s !== `dup:${Math.max(1, i)}` ? [[s, s]] : [])
                                            .map(([v, label]) => <SelectItem key={v} value={v} text={label} />)}
                                        </Select>
                                      ))}
                                    </div>
                                    <Stack orientation="horizontal" gap={3}>
                                      <Button size="sm" kind="primary" onClick={() => setOpen(null)}>{t('common.save', 'Save')}</Button>
                                      <Button size="sm" kind="ghost" onClick={() => setOpen(null)}>{t('common.cancel', 'Cancel')}</Button>
                                    </Stack>
                                  </Stack>
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
          </Stack>
        </Tile>
      </Column>
    </Grid>
  );
}
