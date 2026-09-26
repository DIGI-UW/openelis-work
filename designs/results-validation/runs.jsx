// Route: /Results?run=<runId>&view=triage|rows
// SideNav: Workplan → Results  (no new menu item; the Runs chip is the entry point)
// Breadcrumb: Home / Workplan / Results
// FRS: runs-frs.md v0.3 (2026-09-22)
//
// Handoff mockup for OGC-1200. The analyzer run below is a full 96-position rack
// against an eight-analyte chemistry panel (768 rows), because the review surface has to
// be judged at the size the bench actually produces, not at six rows.
//
// ===========================================================================
// HOW TO READ THIS MOCKUP — two regions are NOT designs.
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
  Breadcrumb, BreadcrumbItem,
} from '@carbon/react';
import { Warning, ChevronDown, ChevronUp } from '@carbon/icons-react';

/* i18n helper — every visible string goes through this (Constitution Principle 1) */
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

const ALL_ROWS = [...RACK_ROWS, ...OTHER_ROWS];

const RUNS = {
  'RUN-2409-0142': {
    id: 'RUN-2409-0142', source: 'ANALYZER', method: 'Cobas c311', analyzer: 'Donatello (c311 #2)',
    labUnit: 'Chemistry', operator: 'A. Wanjiru', opened: '08:14', lastActivity: '08:41', state: 'Held',
    lot: { name: 'CHEM-PANEL L24-118', provenance: 'analyzerReported', expires: '2026-11-30' },
    periodicQc: 'Instrument QC recorded 07:52 today — Pass (OGC-428)',
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
    periodicQc: 'Instrument QC recorded 07:30 today — Pass (OGC-428)',
    controls: [{ level: 'Internal (SPC)', lot: '—', covers: ['Xpert MTB/RIF Ultra'], observed: 'PASS',
      expected: 'PASS', verdict: 'Pass', verdictSource: 'analyzerReported', operator: 'System', time: '07:58' }],
    exceptions: [],
  },
  'RUN-2409-0143': {
    id: 'RUN-2409-0143', source: 'WORKPLAN', method: 'HemoCue Hb 301', analyzer: 'HemoCue bench unit 1',
    labUnit: 'Hematology', operator: 'B. Otieno', opened: '08:30', lastActivity: '08:47', state: 'Open',
    lot: { name: 'HemoCue microcuvette 24-08B', provenance: 'selected', expires: '2026-10-15' },
    periodicQc: null,
    controls: [{ level: 'Normal', lot: 'QC-HB-N-118', covers: ['Hemoglobin'], observed: '12.4 g/dL',
      expected: '12.2 ± 0.6 g/dL', verdict: 'Pass', verdictSource: 'computed', operator: 'B. Otieno', time: '08:30' }],
    exceptions: [],
  },
};

/* ------------------------------------------------------------------ derivations */

const perTestVerdicts = run => {
  const out = {};
  run.controls.forEach(c => c.covers.forEach(test => {
    out[test] = (out[test] === 'Fail' || c.verdict === 'Fail') ? 'Fail' : c.verdict;
  }));
  return out;
};
const heldTests = run => Object.entries(perTestVerdicts(run)).filter(([, v]) => v === 'Fail').map(([k]) => k);
const isHeld = (row, runs) => !!(row.run && runs[row.run] && heldTests(runs[row.run]).includes(row.test));

/* FR-E1a — the worklist's existing filter chips are the run view's only row control.
   Counts are always over the whole run, never over the visible page. */
const CHIPS = [
  { key: 'all',        label: t('filter.all', 'All'),                    match: () => true },
  { key: 'needsReview', label: t('filter.needsReview', 'Needs review'),
    match: (r, held) => held.includes(r.test) || !!r.exception || r.dup || !!r.flag },
  { key: 'critical',   label: t('label.flag.critical', 'Critical'),      match: r => r.flag === 'critical' },
  { key: 'abnormal',   label: t('label.flag.abnormal', 'Abnormal'),      match: r => r.flag === 'abnormal' },
  { key: 'exceptions', label: t('run.filter.exceptions', 'Exceptions'),  match: r => !!r.exception },
  { key: 'held',       label: t('run.filter.held', 'Held'),              match: (r, held) => held.includes(r.test) },
  { key: 'normal',     label: t('label.flag.normal', 'Normal'),
    match: (r, held) => !r.flag && !r.dup && !r.exception && !held.includes(r.test) },
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
            <strong>{t('mockup.reuse.tag', 'Existing component — reuse, do not re-implement')}</strong>
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
  <Tag size="sm" type={v === 'Pass' ? 'green' : v === 'Fail' ? 'red' : v === 'No control' ? 'purple' : 'gray'}
    renderIcon={v === 'Fail' ? Warning : undefined}>
    <strong>{t(`run.verdict.${v}`, v)}</strong>
  </Tag>
);

function RunRowTag({ row, runs, onOpenRun }) {
  if (!row.run) return null;
  const run = runs[row.run];
  const held = isHeld(row, runs);
  const label = held
    ? t('run.tag.held', `Held: QC failed in ${row.run}`)
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

function QcBlock({ run, runRows, onAction }) {
  const verdicts = perTestVerdicts(run);
  const held = heldTests(run);
  const [openTest, setOpenTest] = useState(null);
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
                `${held.join(', ')} held — ${runRows.filter(r => held.includes(r.test)).length} rows blocked. Every other test in this run is unaffected.`)}
            </span>
          )}
          <span style={{ flex: 1 }} />
          <Button kind="ghost" size="sm">{t('run.action.recordControl', 'Record control')}</Button>
        </Stack>

        {Object.entries(verdicts).map(([test, v]) => (
          <div key={test} style={{ borderTop: '1px solid var(--cds-border-subtle-01)', paddingTop: 6 }}>
            <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Button kind="ghost" size="sm" onClick={() => setOpenTest(p => (p === test ? null : test))}
                renderIcon={openTest === test ? ChevronUp : ChevronDown}>{test}</Button>
              <VerdictTag v={v} />
              {v === 'Fail' && (
                <>
                  <Button size="sm" kind="secondary" onClick={() => onAction('retest', test)}>{t('button.retest', 'Retest')}</Button>
                  <Button size="sm" kind="ghost" onClick={() => onAction('reject', test)}>{t('common.reject', 'Reject')}</Button>
                  <Button size="sm" kind="danger--tertiary" onClick={() => onAction('acceptDespite', test)}>
                    {t('button.acceptDespiteQc', 'Accept despite QC failure')}
                  </Button>
                </>
              )}
            </Stack>
            {openTest === test && run.controls.filter(c => c.covers.includes(test)).map((c, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--cds-text-secondary)', padding: '4px 0 4px 2rem' }}>
                {c.level} · {t('common.lot', 'Lot')} {c.lot} ·{' '}
                {t('run.control.observedExpected', `observed ${c.observed}, expected ${c.expected}`)} ·{' '}
                <VerdictTag v={c.verdict} /> · {t(`run.verdictSource.${c.verdictSource}`, c.verdictSource)} · {c.operator} {c.time}
              </div>
            ))}
          </div>
        ))}
      </Stack>
    </Tile>
  );
}

function SettingsBlock({ run, runRows }) {
  const done = runRows.filter(r => r.status !== 'pending').length;
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
          <span style={{ fontSize: 13 }}>{t('run.progress', `${done} of ${runRows.length} rows dispositioned`)}</span>
          {run.source === 'WORKPLAN' && (
            <Button kind="tertiary" size="sm">{t('run.action.markComplete', 'Mark complete')}</Button>
          )}
        </Stack>
        <Stack orientation="horizontal" gap={6} style={{ flexWrap: 'wrap' }}>
          {kv(t('run.label.source', 'Source'), run.source)}
          {kv(t('common.method', 'Method'), run.method)}
          {kv(t('common.analyzer', 'Analyzer'), run.analyzer)}
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
        {run.periodicQc && <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{run.periodicQc}</div>}
      </Stack>
    </Tile>
  );
}

function ExceptionsBlock({ run, onAction }) {
  if (!run.exceptions.length) return null;              // FR-E4 — hidden when empty
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

/* FR-E10 / FR-E10a — the row expands into the Results Entry panel, prefilled and editable.
   Everything below the run-specific strip is the Results Entry panel's own rendering; it is
   reproduced here only so the mockup is readable standalone. Do not re-implement it. */
function RowPanel({ row, runs }) {
  const run = row.run ? runs[row.run] : null;
  const held = isHeld(row, runs);
  const analyzerRow = run && run.source === 'ANALYZER';
  const [value, setValue] = useState(row.value || '');
  const edited = analyzerRow && value !== (row.value || '');
  return (
    <div style={{ padding: '0.75rem 1rem', background: 'var(--cds-layer-01)' }}>
      <Stack gap={3}>
        {held && (
          <InlineNotification kind="error" lowContrast hideCloseButton
            title={t('run.row.heldTitle', `Held: the ${row.test} control failed in ${row.run}`)}
            subtitle={t('run.row.heldBody',
              'This row cannot be accepted, entered, edited or released until the hold is dispositioned on the QC block above.')} />
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
  const held = heldTests(run);
  const sel = runRows.filter(r => selected.includes(r.id));
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
              {' — '}
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
  const held = run ? heldTests(run) : [];
  const runRows = useMemo(() => rows.filter(r => r.run === runFilter), [rows, runFilter]);

  /* whole-run chip counts — FR-E1a; in the real page these arrive with the run header request */
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
      if (!r.run) return true;
      if (runs[r.run].source !== 'ANALYZER') return true;
      if (seen.has(r.run)) return false;
      seen.add(r.run);
      return true;
    }).filter(r => showHeld || !isHeld(r, runs));
  }, [unitRows, runs, showHeld]);

  /* the active chip's rows, sorted exceptions and held first (FR-E6) */
  const filteredRunRows = useMemo(() => (
    runRows.filter(r => chipMatch(chip, r, held))
      .sort((a, b) => sortRank(a, held) - sortRank(b, held))
  ), [runRows, chip, held]);

  const pagedRows = filteredRunRows.slice((page - 1) * pageSize, page * pageSize);

  /* FR-E11a — acts on every eligible row the active chip matches, across every page */
  const eligibleInFilter = filteredRunRows.filter(r => r.status === 'pending'
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
    setRows(rows.map(r => (selected.includes(r.id) ? { ...r, run: 'RUN-2409-0144' } : r)));
    setSelected([]);
    say(t('run.toast.batched', `${sel.length} rows batched into RUN-2409-0144. Record the kit control once on the run.`));
  };

  const qcAction = (action, test) => say({
    retest: t('run.toast.retest',
      `Retest requested for ${test}. A later run covering these samples will offer a "retest of ${runFilter}" link.`),
    reject: t('run.toast.reject',
      `${test} rows marked Rejected: QC. Filing a non-conformance event is offered, not required.`),
    acceptDespite: t('run.toast.acceptDespite',
      `Accept despite QC failure: a non-conformance event was opened, pre-populated from ${runFilter}. The rows land entered, not validated, and carry the QC fail chip on Validation.`),
    match: t('run.toast.match', 'Record matched to a lab number; the run proceeds.'),
    mapNow: t('run.toast.mapNow', 'Opens Analyzer Types & Mapping with the unmapped code preselected.'),
    ignore: t('run.toast.ignore', 'Ignored with a reason; only this record is affected.'),
  }[action]);

  const headers = [
    { key: 'sample', header: t('common.sampleId', 'Sample ID') },
    { key: 'test',   header: t('common.test', 'Test') },
    { key: 'value',  header: t('common.result', 'Result') },
    { key: 'method', header: `${t('common.method', 'Method')} / ${t('common.analyzer', 'Analyzer')}` },
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
              {dtHeaders.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}
            </TableRow></TableHead>
            <TableBody>
              {dtRows.map(dr => {
                const row = rows.find(r => r.id === dr.id);
                const rr = row.run ? runs[row.run] : null;
                const rowHeld = isHeld(row, runs);
                const showValue = row.status !== 'pending' || (runFilter && rr && rr.source === 'ANALYZER' && !rowHeld);
                return (
                  <React.Fragment key={dr.id}>
                    <TableExpandRow {...getRowProps({ row: dr })}>
                      <TableCell>
                        <Checkbox id={`sel-${row.id}`} labelText="" hideLabel
                          disabled={row.status === 'accepted' || (!runFilter && !!row.run)
                            || (!!runFilter && (rowHeld || !!row.exception))}
                          checked={selected.includes(row.id)}
                          onChange={() => setSelected(s => (s.includes(row.id) ? s.filter(x => x !== row.id) : [...s, row.id]))} />
                      </TableCell>
                      <TableCell>
                        <strong>{row.sample}</strong>{' '}
                        <span style={{ color: 'var(--cds-text-secondary)', fontSize: 12 }}>{row.patient}</span>
                      </TableCell>
                      <TableCell>{row.test}</TableCell>
                      <TableCell>
                        {showValue
                          ? <span>{row.value}{row.components && runFilter && (
                              <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
                                {t('label.validation.components', `${row.components.length} components`)}
                              </div>)}</span>
                          : <span style={{ color: 'var(--cds-text-secondary)' }}>—</span>}
                      </TableCell>
                      <TableCell>
                        {rr
                          ? <span>{rr.method}{' '}
                              <span style={{ color: 'var(--cds-text-secondary)', fontSize: 12 }}>
                                {rr.source === 'ANALYZER' ? rr.analyzer : rr.operator}</span>{' '}
                              {runFilter && rr.source === 'ANALYZER' && (
                                <Tag size="sm" type="gray">{t('run.lot.analyzerReported', 'Analyzer-reported')}</Tag>)}
                            </span>
                          : <span style={{ color: 'var(--cds-text-secondary)' }}>{t('common.manual', 'Manual')}</span>}
                      </TableCell>
                      <TableCell>
                        <Tag size="sm" type={row.status === 'entered' ? 'teal' : 'gray'}>
                          {t(`common.${row.status}`, row.status)}
                        </Tag>
                        {!runFilter && <RunRowTag row={row} runs={runs} onOpenRun={setRunFilter} />}
                        {runFilter && rowHeld && (
                          <Tag size="sm" type="red" renderIcon={Warning}><strong>{t('run.state.Held', 'Held')}</strong></Tag>)}
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
            <Stack gap={0} style={{ marginBottom: '1rem', border: '1px solid var(--cds-border-subtle)' }}>
              <QcBlock run={run} runRows={runRows} onAction={qcAction} />
              <SettingsBlock run={run} runRows={runRows} />
              <ExceptionsBlock run={run} onAction={qcAction} />
            </Stack>

            {/* FR-E1b — opening a run replaces the worklist's other filters */}
            <InlineNotification kind="info" lowContrast hideCloseButton style={{ maxWidth: 'none', marginBottom: '0.5rem' }}
              title={t('run.filters.replacedTitle', 'The run is the filter')}
              subtitle={t('run.filters.replacedBody',
                'Opening a run replaced the lab unit, search and signal filters you had on the worklist; the run opens whole, on All. The analyzer and its tests already carry the lab unit, so nothing is lost. Leaving the run restores what you had.')} />

            {/* FR-E1a — the worklist's own filter chips, counted over the whole run */}
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
                </span>
              </Stack>
            </ReuseBoundary>

            {run.source === 'ANALYZER' && (
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
