// Route: /Results  (worklist)  and  /Results?run=<runId>  (run-filtered view with run header)
// SideNav: Workplan → Results   |   Breadcrumb: Home / Workplan / Results
// FRS: designs/results-validation/runs.md  ("Runs: the shared unit of QC, reagent lot and result review")
// Preview: designs/results-validation/runs-preview.html
//
// Developer-handoff mockup. Version-agnostic: shows the full feature.
// Mock data only; every field traces to the FRS Information & Data section.

import React, { useMemo, useState } from 'react';
import {
  Breadcrumb, BreadcrumbItem, Button, Checkbox, ComboBox, ContainedList, ContainedListItem,
  DataTable, Table, TableBody, TableCell, TableContainer, TableExpandedRow, TableExpandHeader,
  TableExpandRow, TableHead, TableHeader, TableRow, TableToolbar, TableToolbarContent,
  TableToolbarSearch, Tag, Tile, InlineNotification, Select, SelectItem, TextInput,
  RadioButtonGroup, RadioButton, Stack, Grid, Column, Popover, PopoverContent, Link,
} from '@carbon/react';
import { ChevronDown, ChevronUp, Warning, Add } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

/* ------------------------------------------------------------------ mock data */
const RUNS = {
  'RUN-2409-0142': {
    id: 'RUN-2409-0142', source: 'ANALYZER', method: 'Cobas c311', analyzer: 'Donatello (c311 #2)',
    labUnit: 'Chemistry', operator: 'Analyzer bridge', opened: '09:14', lastActivity: '09:14', state: 'Held',
    lot: { name: 'Roche ISE Reagent 2419077', provenance: 'analyzer' },
    instrumentQc: { verdict: 'Pass', when: '07:02', by: 'A. Wanjiru' },
    controls: [
      { id: 'c1', level: 'Level 1', lot: 'PreciControl ClinChem Multi 1, lot 61342', source: 'Analyzer verdict', by: 'Analyzer', when: '09:14',
        results: { Glucose: { obs: '5.6', exp: '5.5 ± 0.4', v: 'Pass' }, Potassium: { obs: '5.9', exp: '4.2 ± 0.3', v: 'Fail' }, Sodium: { obs: '141', exp: '140 ± 4', v: 'Pass' }, Creatinine: { obs: '88', exp: '90 ± 8', v: 'Pass' } } },
      { id: 'c2', level: 'Level 2', lot: 'PreciControl ClinChem Multi 2, lot 61355', source: 'Analyzer verdict', by: 'Analyzer', when: '09:14',
        results: { Glucose: { obs: '13.9', exp: '14.0 ± 0.9', v: 'Pass' }, Potassium: { obs: '6.4', exp: '6.5 ± 0.4', v: 'Pass' }, Sodium: { obs: '156', exp: '155 ± 5', v: 'Pass' }, Creatinine: { obs: '365', exp: '360 ± 20', v: 'Pass' } } },
    ],
    exceptions: [
      { id: 'e1', kind: 'Unmatched sample', detail: 'Lab number "24-0O819" not found', scope: 'Glucose, Potassium, Sodium, Creatinine' },
      { id: 'e2', kind: 'Unmapped target', detail: 'Analyzer code "TBIL" has no mapping on the Cobas c311 profile', scope: 'Sample 24-00821' },
    ],
  },
  'RUN-2409-0141': {
    id: 'RUN-2409-0141', source: 'ANALYZER', method: 'Xpert MTB/RIF Ultra', analyzer: 'GeneXpert IV (TB bench)',
    labUnit: 'Chemistry', operator: 'Analyzer bridge', opened: '08:40', lastActivity: '08:40', state: 'Open',
    lot: { name: 'Xpert MTB/RIF Ultra cartridge, lot 15024', provenance: 'analyzer' }, instrumentQc: null,
    controls: [{ id: 'c0', level: 'Internal', lot: 'Cartridge SPC', source: 'Analyzer verdict', by: 'Analyzer', when: '08:40', results: { 'Xpert MTB/RIF Ultra': { obs: 'Valid', exp: 'Valid', v: 'Pass' } } }],
    exceptions: [],
  },
  'RUN-2409-0143': {
    id: 'RUN-2409-0143', source: 'WORKPLAN', method: 'HemoCue Hb 301', analyzer: 'HemoCue bench unit 1',
    labUnit: 'Hematology', operator: 'B. Okafor', opened: '10:05', lastActivity: '10:31', state: 'Open',
    lot: { name: 'HemoCue Hb 301 microcuvettes, lot 2306411', provenance: 'selected' }, instrumentQc: null,
    controls: [{ id: 'c3', level: 'Normal', lot: 'Eurotrol HemoTrol Normal, lot 4471', source: 'Computed from QC Targets', by: 'B. Okafor', when: '10:05',
      results: { Hemoglobin: { obs: '12.4', exp: '12.3 ± 0.5', v: 'Pass' } } }],
    exceptions: [],
  },
};

const ROWS = [
  { id: '1', sample: '24-00817', patient: 'K. Mwangi', test: 'Glucose', unit: 'Chemistry', status: 'pending', run: 'RUN-2409-0142', value: '6.1 mmol/L', flag: null },
  { id: '2', sample: '24-00817', patient: 'K. Mwangi', test: 'Potassium', unit: 'Chemistry', status: 'pending', run: 'RUN-2409-0142', value: '5.7 mmol/L', flag: 'abnormal' },
  { id: '3', sample: '24-00818', patient: 'F. Achieng', test: 'Glucose', unit: 'Chemistry', status: 'pending', run: 'RUN-2409-0142', value: '3.1 mmol/L', flag: 'critical', presence: 'A. Wanjiru' },
  { id: '4', sample: '24-00818', patient: 'F. Achieng', test: 'Potassium', unit: 'Chemistry', status: 'pending', run: 'RUN-2409-0142', value: '4.0 mmol/L', flag: null },
  { id: '5', sample: '24-00820', patient: 'D. Otieno', test: 'Sodium', unit: 'Chemistry', status: 'pending', run: 'RUN-2409-0142', value: '138 mmol/L', flag: null, dup: true },
  { id: '6', sample: '24-00820', patient: 'D. Otieno', test: 'Creatinine', unit: 'Chemistry', status: 'pending', run: 'RUN-2409-0142', value: '104 µmol/L', flag: 'abnormal' },
  { id: '7', sample: '24-00822', patient: 'S. Njoroge', test: 'Hemoglobin', unit: 'Hematology', status: 'entered', run: 'RUN-2409-0143', value: '11.8 g/dL', flag: null },
  { id: '8', sample: '24-00823', patient: 'M. Kamau', test: 'Hemoglobin', unit: 'Hematology', status: 'pending', run: 'RUN-2409-0143', value: null, flag: null },
  { id: '9', sample: '24-00824', patient: 'J. Wafula', test: 'Hemoglobin', unit: 'Hematology', status: 'pending', run: 'RUN-2409-0143', value: null, flag: null },
  { id: '10', sample: '24-00825', patient: 'A. Chebet', test: 'Malaria RDT (Pf/Pan)', unit: 'Hematology', status: 'pending', run: null, value: null, flag: null },
  { id: '11', sample: '24-00826', patient: 'P. Ndungu', test: 'Malaria RDT (Pf/Pan)', unit: 'Hematology', status: 'pending', run: null, value: null, flag: null },
  { id: '12', sample: '24-00827', patient: 'R. Auma', test: 'Malaria RDT (Pf/Pan)', unit: 'Hematology', status: 'pending', run: null, value: null, flag: null },
  // Multi-component analyzer row (FR-E10): the call plus per-target Cts, in display_order; blank = no amplification
  { id: '14', sample: '24-00809', patient: 'E. Nyambura', test: 'Xpert MTB/RIF Ultra', unit: 'Chemistry', status: 'pending', run: 'RUN-2409-0141', value: 'MTB DETECTED, low · RIF NOT DETECTED', flag: 'critical',
    components: [
      { label: 'MTB result (call)', value: 'MTB DETECTED, low', maps: 'Xpert MTB/RIF Ultra · primary' },
      { label: 'RIF resistance', value: 'NOT DETECTED', maps: 'component RIF' },
      { label: 'rpoB probe A Ct', value: '22.4', maps: 'component PROBE_A' }, { label: 'rpoB probe B Ct', value: '23.1', maps: 'component PROBE_B' },
      { label: 'rpoB probe C Ct', value: '', maps: 'component PROBE_C' }, { label: 'rpoB probe D Ct', value: '22.9', maps: 'component PROBE_D' },
      { label: 'rpoB probe E Ct', value: '23.6', maps: 'component PROBE_E' }, { label: 'SPC Ct', value: '27.8', maps: 'component SPC (internal control, not on report)' },
    ] },
  { id: '13', sample: '24-00811', patient: 'T. Mutua', test: 'Creatinine', unit: 'Chemistry', status: 'accepted', run: 'RUN-2409-0139', value: '71 µmol/L', flag: null },
];

/* ------------------------------------------------------------------ run helpers (FR-C3, FR-A4) */
function perTestVerdicts(run) {
  const out = {};
  run.controls.forEach(c => Object.entries(c.results).forEach(([test, r]) => {
    out[test] = out[test] || { verdict: 'Pass', controls: [] };
    out[test].controls.push({ ...c, r });
    if (r.v === 'Fail') out[test].verdict = 'Fail';
  }));
  return out;
}
const heldTests = run => Object.entries(perTestVerdicts(run)).filter(([, v]) => v.verdict === 'Fail').map(([k]) => k);
const isHeld = (row, runs) => !!(row.run && runs[row.run] && heldTests(runs[row.run]).includes(row.test));

/* ------------------------------------------------------------------ small pieces */
const StateTag = ({ state }) => (
  <Tag type={state === 'Held' ? 'red' : state === 'Open' ? 'blue' : state === 'Complete' ? 'green' : 'gray'} size="sm">
    {t(`run.state.${state.toLowerCase()}`, state)}
  </Tag>
);
const VerdictTag = ({ v }) => (
  v === 'Fail' ? <Tag type="red" size="sm">{t('label.analyzerQc.fail', 'Fail')}</Tag>
  : v === 'Pass' ? <Tag type="green" size="sm">{t('label.analyzerQc.pass', 'Pass')}</Tag>
  : <Tag type="gray" size="sm">{t('run.verdict.noControl', 'No control')}</Tag>
);

/* Row tag on the unfiltered worklist (FR-D3, D4, D5) */
function RunRowTag({ row, runs, onOpenRun }) {
  if (!row.run) return null;
  const run = runs[row.run];
  if (!run) return null; // Complete / Superseded runs: reference lives in the row's History (FR-D6)
  if (heldTests(run).includes(row.test)) {
    return <Tag type="red" renderIcon={Warning} onClick={() => onOpenRun(run.id)} style={{ cursor: 'pointer' }}>{t('run.tag.held', `Held: QC failed in ${run.id}`)}</Tag>;
  }
  if (run.source === 'ANALYZER') return <Tag type="blue" onClick={() => onOpenRun(run.id)} style={{ cursor: 'pointer' }}>{t('run.tag.waiting', `Waiting in ${run.id}`)} · {run.opened}</Tag>;
  return <Tag type="purple" onClick={() => onOpenRun(run.id)} style={{ cursor: 'pointer' }}>{t('run.tag.batched', `Batched in ${run.id}`)}</Tag>;
}

/* Runs chip + popover list (FR-D1) */
function RunsChip({ runs, rows, onPick }) {
  const [open, setOpen] = useState(false);
  const openRuns = runs.filter(r => r.state === 'Open').length;
  const heldRuns = runs.filter(r => r.state === 'Held').length;
  return (
    <Popover open={open} align="bottom-left" onRequestClose={() => setOpen(false)}>
      <Button kind="tertiary" size="sm" onClick={() => setOpen(v => !v)} renderIcon={open ? ChevronUp : ChevronDown}>
        {t('run.chip.label', 'Runs')} · {t('run.chip.counts', `${openRuns} open, ${heldRuns} held`)}
      </Button>
      <PopoverContent style={{ padding: '0.5rem', minWidth: 640 }}>
        <ContainedList label={t('run.chip.label', 'Runs')} kind="on-page" size="sm">
          {runs.map(r => {
            const rr = rows.filter(x => x.run === r.id);
            const done = rr.filter(x => x.status !== 'pending').length;
            return (
              <ContainedListItem key={r.id} onClick={() => { setOpen(false); onPick(r.id); }} action={<StateTag state={r.state} />}>
                <strong>{r.id}</strong> · {r.source === 'ANALYZER' ? `${r.method}, ${r.analyzer}` : `${r.method}, ${r.operator}`} · {r.opened} · {t('run.progress', `${done} of ${rr.length} rows dispositioned`)}
              </ContainedListItem>
            );
          })}
        </ContainedList>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ run header blocks (FR-E1..E5) */
function QcBlock({ run, rows, onAction }) {
  const verdicts = perTestVerdicts(run);
  const held = heldTests(run);
  const [openTest, setOpenTest] = useState(null);
  const [recording, setRecording] = useState(false);
  const heldRowCount = rows.filter(r => held.includes(r.test)).length;
  return (
    <Tile>
      <Stack gap={4}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0 }}>{t('run.header.qc', 'QC')} &nbsp;
            {held.length ? <Tag type="red">{t('run.state.held', 'Held')}: {held.join(', ')}</Tag>
              : run.controls.length === 0 ? <VerdictTag v="none" /> : <Tag type="green">All covered tests pass</Tag>}
          </h4>
          <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setRecording(v => !v)}>{t('run.action.recordControl', 'Record control')}</Button>
        </div>
        {held.length > 0 && (
          <InlineNotification kind="error" lowContrast hideCloseButton title={`${held.join(', ')} control failed on this run`}
            subtitle={`${heldRowCount} ${held.join(', ').toLowerCase()} result(s) in this run are held; other tests are not affected.`} />
        )}
        {run.controls.length === 0 && (
          <InlineNotification kind="warning" lowContrast hideCloseButton title="No control recorded yet on this run"
            subtitle="This test requires a control per run (Hold when missing). Record it before results in this run can be saved." />
        )}
        {recording && (
          <Tile style={{ background: 'var(--cds-layer-02)' }}>
            <Grid narrow>
              <Column lg={3}><Select id="ctl-test" labelText="Test covered" size="sm">{Object.keys(verdicts).map(x => <SelectItem key={x} value={x} text={x} />)}</Select></Column>
              <Column lg={4}><ComboBox id="ctl-lot" titleText="Control lot" placeholder="Search control lots…" items={[]} size="sm" /></Column>
              <Column lg={2}><Select id="ctl-level" labelText="Level" size="sm"><SelectItem value="L1" text="Level 1" /><SelectItem value="L2" text="Level 2" /></Select></Column>
              <Column lg={2}><TextInput id="ctl-obs" labelText="Observed" size="sm" /></Column>
              <Column lg={3}><TextInput id="ctl-exp" labelText="Expected (from QC Targets)" value="4.2 ± 0.3" readOnly size="sm" /></Column>
            </Grid>
            <Stack orientation="horizontal" gap={3} style={{ marginTop: '0.75rem' }}>
              <Button kind="primary" size="sm" onClick={() => setRecording(false)}>{t('common.save', 'Save')}</Button>
              <Button kind="ghost" size="sm" onClick={() => setRecording(false)}>{t('common.cancel', 'Cancel')}</Button>
              <span style={{ fontSize: 12, alignSelf: 'center', color: 'var(--cds-text-secondary)' }}>A new passing control does not clear an existing hold (FR-C6); use Retest.</span>
            </Stack>
          </Tile>
        )}
        <ContainedList label="Per-test verdicts" kind="on-page" size="sm">
          {Object.entries(verdicts).map(([test, v]) => (
            <React.Fragment key={test}>
              <ContainedListItem
                action={v.verdict === 'Fail' ? (
                  <Stack orientation="horizontal" gap={2}>
                    <Button size="sm" kind="primary" onClick={() => onAction('retest', test)}>Retest</Button>
                    <Button size="sm" kind="secondary" onClick={() => onAction('reject', test)}>{t('common.reject', 'Reject')}</Button>
                    <Button size="sm" kind="danger--ghost" onClick={() => onAction('acceptDespite', test)}>Accept despite QC failure</Button>
                  </Stack>) : null}
              >
                <Button kind="ghost" size="sm" hasIconOnly renderIcon={openTest === test ? ChevronUp : ChevronDown} iconDescription="Show controls" onClick={() => setOpenTest(openTest === test ? null : test)} />
                <strong style={{ marginRight: 12 }}>{test}</strong> <VerdictTag v={v.verdict} />
                <span style={{ color: 'var(--cds-text-secondary)', marginLeft: 12 }}>{v.controls.length} control(s) · {v.controls[0].source}</span>
              </ContainedListItem>
              {openTest === test && v.controls.map(c => (
                <ContainedListItem key={c.id}>
                  <span style={{ marginLeft: '2.5rem' }}>{c.level} · {c.lot} · observed <strong>{c.r.obs}</strong>, expected {c.r.exp} · <VerdictTag v={c.r.v} /> {c.source} · {c.by}, {c.when}</span>
                </ContainedListItem>
              ))}
            </React.Fragment>
          ))}
        </ContainedList>
      </Stack>
    </Tile>
  );
}

function SettingsBlock({ run, rows }) {
  const done = rows.filter(r => r.status !== 'pending').length;
  const kv = (k, v) => <div><div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{k}</div><div>{v}</div></div>;
  return (
    <Tile>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>{t('run.header.settings', 'Run settings')}</h4>
        <span style={{ fontSize: 13 }}>{t('run.progress', `${done} of ${rows.length} rows dispositioned`)} {run.source === 'WORKPLAN' && <Button kind="tertiary" size="sm">{t('run.action.markComplete', 'Mark complete')}</Button>}</span>
      </div>
      <Grid narrow style={{ marginTop: '0.75rem' }}>
        <Column lg={2}>{kv('Source', run.source === 'ANALYZER' ? 'Analyzer message' : 'Workplan batch')}</Column>
        <Column lg={2}>{kv('Method', run.method)}</Column>
        <Column lg={3}>{kv(t('common.analyzer', 'Analyzer'), <span>{run.analyzer}{run.instrumentQc && <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>Instrument Manual QC: <VerdictTag v={run.instrumentQc.verdict} /> {run.instrumentQc.when}, {run.instrumentQc.by}</div>}</span>)}</Column>
        <Column lg={2}>{kv('Lab unit', run.labUnit)}</Column>
        <Column lg={2}>{kv('Operator', run.operator)}</Column>
        <Column lg={3}>{kv('Opened · last activity', `${run.opened} · ${run.lastActivity}`)}</Column>
        <Column lg={2}>{kv(t('common.status', 'Status'), <StateTag state={run.state} />)}</Column>
        <Column lg={16}>{kv('Reagent lot', run.lot.provenance === 'analyzer'
          ? <span>{run.lot.name} <Tag type="gray" size="sm">{t('run.lot.analyzerReported', 'Analyzer-reported')}</Tag></span>
          : <Stack orientation="horizontal" gap={2}>{run.lot.name} <Tag type="gray" size="sm">Selected by operator</Tag><Button kind="ghost" size="sm">Change lot</Button><Button kind="ghost" size="sm">Use last-used lot</Button></Stack>)}</Column>
      </Grid>
    </Tile>
  );
}

function ExceptionsBlock({ run, onAction }) {
  if (!run.exceptions.length) return null; // FR-E4: hidden when empty
  return (
    <Tile>
      <h4 style={{ margin: '0 0 0.5rem' }}>{t('run.header.exceptions', 'Exceptions')} <Tag type="magenta" size="sm">{run.exceptions.length}</Tag></h4>
      <ContainedList label="Unresolved records" kind="on-page" size="sm">
        {run.exceptions.map(e => (
          <ContainedListItem key={e.id} action={
            <Stack orientation="horizontal" gap={2}>
              {e.kind === 'Unmatched sample' && <><ComboBox id={`acc-${e.id}`} placeholder="Search accession…" items={[]} size="sm" /><Button size="sm" kind="primary" onClick={() => onAction('match', e.id)}>Match</Button></>}
              {e.kind === 'Unmapped target' && <Button size="sm" kind="primary" onClick={() => onAction('mapNow', e.id)}>Map now</Button>}
              <Button size="sm" kind="ghost" onClick={() => onAction('hold', e.id)}>Hold</Button>
              <Button size="sm" kind="ghost" onClick={() => onAction('ignore', e.id)}>Ignore</Button>
            </Stack>}>
            <strong>{e.kind}</strong> · {e.detail} <span style={{ color: 'var(--cds-text-secondary)' }}>· {e.scope}</span>
          </ContainedListItem>
        ))}
      </ContainedList>
    </Tile>
  );
}

/* ------------------------------------------------------------------ expanded row (FR-D7) */
function RowPanel({ row, runs }) {
  const run = row.run ? runs[row.run] : null;
  const held = isHeld(row, runs);
  const analyzerRow = run && run.source === 'ANALYZER';
  return (
    <Stack gap={4} style={{ padding: '1rem' }}>
      <Tile>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cds-text-secondary)', marginBottom: 8 }}>Work zone</div>
        <Grid narrow>
          <Column lg={4}><TextInput id={`val-${row.id}`} labelText={t('common.result', 'Result')} value={held ? '' : row.value || ''} placeholder={held ? 'Held by QC' : 'Enter value'} readOnly={analyzerRow || held} disabled={held} size="sm" /></Column>
          <Column lg={4}><TextInput id={`m-${row.id}`} labelText="Method" value={run ? run.method : 'Malaria RDT (manual)'} readOnly size="sm" /></Column>
          <Column lg={4}><TextInput id={`a-${row.id}`} labelText={t('common.analyzer', 'Analyzer')} value={run ? run.analyzer : '—'} readOnly size="sm" /></Column>
          <Column lg={4}><TextInput id={`n-${row.id}`} labelText={t('common.notes', 'Notes')} size="sm" /></Column>
        </Grid>
      </Tile>
      <Tile>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cds-text-secondary)', marginBottom: 8 }}>
          Reagents, QC and controls — {run ? <span>this row's run <strong>{run.id}</strong> (<StateTag state={run.state} />) · <Link href={`/Results?run=${run.id}`}>open run</Link></span> : 'a run of one is created when you save'}
        </div>
        {run ? (
          <Grid narrow>
            <Column lg={8}><div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>Reagent lot</div>{run.lot.name} <Tag type="gray" size="sm">{run.lot.provenance === 'analyzer' ? t('run.lot.analyzerReported', 'Analyzer-reported') : 'Selected'}</Tag></Column>
            <Column lg={8}><div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>Control for {row.test}</div><VerdictTag v={perTestVerdicts(run)[row.test]?.verdict || 'none'} /> <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>edited on the run</span></Column>
          </Grid>
        ) : (
          <Grid narrow>
            <Column lg={8}><ComboBox id={`lot-${row.id}`} titleText="Kit lot" items={['SD Bioline Malaria Ag Pf/Pan, lot 05DDG012A']} initialSelectedItem="SD Bioline Malaria Ag Pf/Pan, lot 05DDG012A" size="sm" helperText="Last-used lot applied" /></Column>
            <Column lg={8}>
              <RadioButtonGroup legendText="Control line" name={`ctl-${row.id}`} defaultSelected="valid" orientation="horizontal">
                <RadioButton labelText="Valid" value="valid" id={`v-${row.id}`} />
                <RadioButton labelText="Invalid (blocks reporting, prompts repeat)" value="invalid" id={`i-${row.id}`} />
              </RadioButtonGroup>
            </Column>
          </Grid>
        )}
      </Tile>
      {analyzerRow && !held && (
        <Tile>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cds-text-secondary)', marginBottom: 8 }}>{t('run.row.writes', 'What this accept writes')}</div>
          <ContainedList label="Components" kind="on-page" size="sm">
            {(row.components || [{ label: `${row.test} (primary)`, value: row.value, maps: `${row.test} · primary` }]).map((c, i) => (
              <ContainedListItem key={i} action={<Stack orientation="horizontal" gap={2}><Tag type="green" size="sm">Unit OK</Tag>{i === 0 && row.flag === 'critical' && <Tag type="red" size="sm" renderIcon={Warning}>Critical → ack task</Tag>}{i === 0 && row.flag === 'abnormal' && <Tag type="warm-gray" size="sm">Abnormal</Tag>}</Stack>}>
                <span style={{ display: 'inline-block', minWidth: 160 }}>{c.label}</span>
                <strong style={{ display: 'inline-block', minWidth: 180 }}>{c.value === '' ? <span style={{ color: 'var(--cds-text-secondary)', fontWeight: 400 }}>— (no amplification)</span> : c.value}</strong>
                <span style={{ color: 'var(--cds-text-secondary)' }}>{c.maps}</span>
              </ContainedListItem>
            ))}
          </ContainedList>
          <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginTop: 6 }}>Also written: reagent lot {run.lot.name} · run reference {run.id} · {row.dup ? 'replaces the existing result (audited; Keep/Replace below)' : 'no existing result to replace'}</div>
        </Tile>
      )}
      <Stack orientation="horizontal" gap={3}>
        {analyzerRow ? (<>
          <Button size="sm" kind="primary" disabled={held}>{t('common.accept', 'Accept')}</Button>
          <Button size="sm" kind="secondary" disabled={held}>Retest</Button>
          <Button size="sm" kind="ghost" disabled={held}>Ignore</Button>
          {row.dup && !held && <><Button size="sm" kind="ghost">Keep</Button><Button size="sm" kind="ghost">Replace</Button></>}
          <Button size="sm" kind="ghost">View raw</Button>
          {held && <span style={{ fontSize: 12, alignSelf: 'center', color: 'var(--cds-text-secondary)' }}>Disposition the hold on the run's QC block.</span>}
        </>) : (<>
          <Button size="sm" kind="primary" disabled={held}>{t('common.save', 'Save')}</Button>
          <Button size="sm" kind="ghost">{t('common.cancel', 'Cancel')}</Button>
        </>)}
      </Stack>
    </Stack>
  );
}

/* Bulk accept summary bar (FR-E11): what the batch action will do, live with the selection; no modal */
function BulkBar({ run, rows, selected, onSelect, onClear, onAccept }) {
  const held = heldTests(run);
  const sel = rows.filter(r => selected.includes(r.id));
  const skipped = sel.filter(r => r.dup || held.includes(r.test));
  const accept = sel.filter(r => !skipped.includes(r));
  const crit = accept.filter(r => r.flag === 'critical').length, abn = accept.filter(r => r.flag === 'abnormal').length;
  const normalIds = rows.filter(r => r.status === 'pending' && !r.flag && !r.dup && !held.includes(r.test)).map(r => r.id);
  return (
    <Tile style={{ marginBottom: '0.5rem' }}>
      <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Button kind="tertiary" size="sm" onClick={() => onSelect(normalIds)}>Select all normal</Button>
        {sel.length === 0 ? <span style={{ fontSize: 13, color: 'var(--cds-text-secondary)' }}>Select rows to see exactly what Accept will write. Held rows are dispositioned on the QC block.</span> : (<>
          <span style={{ fontSize: 13 }}>
            <strong>{t('run.bulk.accept', `Accept ${accept.length} selected`)}</strong>: {accept.length - crit - abn} normal, {abn} abnormal, {crit} critical{crit ? ` (creates ${crit} acknowledgment task${crit > 1 ? 's' : ''})` : ''}.
            {skipped.length > 0 && <span> {t('run.bulk.skipped', `${skipped.length} will be skipped`)}: {skipped.map(r => `${r.sample} ${r.test} ${r.dup ? 'already resulted' : 'held'}`).join('; ')}.</span>}
            <span style={{ color: 'var(--cds-text-secondary)' }}> {t('run.bulk.lotAttached', 'Lot attached to all accepted results')}: {run.lot.name}.</span>
          </span>
          <span style={{ flex: 1 }} />
          <Button size="sm" kind="primary" disabled={!accept.length} onClick={() => onAccept(accept.length)}>{t('common.accept', 'Accept')} {accept.length}</Button>
          <Button size="sm" kind="secondary">Retest {accept.length}</Button>
          <Button size="sm" kind="ghost">Ignore {accept.length}</Button>
          <Button size="sm" kind="ghost" onClick={onClear}>Clear</Button>
        </>)}
      </Stack>
    </Tile>
  );
}

/* ------------------------------------------------------------------ page */
export default function ResultsWithRuns() {
  const [runs, setRuns] = useState(RUNS);
  const [rows, setRows] = useState(ROWS);
  const [labUnit, setLabUnit] = useState('all');
  const [runFilter, setRunFilterRaw] = useState(null);       // /Results?run=<id>
  const setRunFilter = id => { setRunFilterRaw(id); setSelected([]); };
  const [showHeld, setShowHeld] = useState(true);            // FR-D2, default on
  const [selected, setSelected] = useState([]);
  const [toast, setToast] = useState(null);

  const run = runFilter ? runs[runFilter] : null;
  const unitRows = rows.filter(r => labUnit === 'all' || r.unit === labUnit);
  const unitRuns = Object.values(runs).filter(r => (labUnit === 'all' || r.labUnit === labUnit) && r.state !== 'Complete' && r.state !== 'Superseded');
  const heldCount = unitRows.filter(r => isHeld(r, runs)).length;

  const visibleRows = useMemo(() => {
    let v = unitRows.filter(r => (runFilter ? r.run === runFilter : true)).filter(r => showHeld || !isHeld(r, runs));
    if (runFilter) { // FR-E6 default sort: held/exceptions, critical, abnormal, normal
      const rank = r => isHeld(r, runs) ? 0 : r.dup ? 1 : r.flag === 'critical' ? 2 : r.flag === 'abnormal' ? 3 : 4;
      v = [...v].sort((a, b) => rank(a) - rank(b));
    }
    return v;
  }, [unitRows, runFilter, showHeld, runs]);

  const selectedRows = rows.filter(r => selected.includes(r.id));
  const canBatch = selectedRows.length >= 2 && new Set(selectedRows.map(r => r.test)).size === 1; // FR-B4
  const say = msg => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const batchThese = () => {
    const id = 'RUN-2409-0144';
    setRuns({ ...runs, [id]: { id, source: 'WORKPLAN', method: 'Malaria RDT (manual)', analyzer: '—', labUnit: 'Hematology', operator: 'You', opened: '11:02', lastActivity: '11:02', state: 'Open', lot: { name: 'SD Bioline Malaria Ag Pf/Pan, lot 05DDG012A', provenance: 'selected' }, instrumentQc: null, controls: [], exceptions: [] } });
    setRows(rows.map(r => selected.includes(r.id) ? { ...r, run: id } : r));
    setSelected([]); setRunFilter(id);
    say(`${selectedRows.length} rows batched into ${id}. Record the kit control once on the run.`);
  };
  const qcAction = (action, test) => say({ retest: `Retest requested for ${test}; a later run covering these samples will suggest a "retest of" link.`, reject: `${test} rows marked Rejected: QC. Filing an NCE is optional.`, acceptDespite: `Accept despite QC failure: an NCE was opened, pre-populated from ${runFilter}.`, match: 'Record matched; the run proceeds.', mapNow: 'Opens Analyzer Types & Mapping with the code preselected.', hold: 'Held with reason.', ignore: 'Ignored with reason.' }[action]);

  const headers = [
    { key: 'sample', header: t('common.sampleId', 'Sample ID') }, { key: 'test', header: t('common.test', 'Test') },
    { key: 'value', header: t('common.result', 'Result') }, { key: 'method', header: `Method / ${t('common.analyzer', 'Analyzer')}` },
    { key: 'status', header: t('common.status', 'Status') }, { key: 'flags', header: 'Flags' },
  ];
  const tableRows = visibleRows.map(r => ({ ...r, method: r.run && runs[r.run] ? runs[r.run].method : 'Manual' }));

  return (
    <Grid fullWidth>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash><BreadcrumbItem href="/">Home</BreadcrumbItem><BreadcrumbItem href="/WorkPlan">Workplan</BreadcrumbItem><BreadcrumbItem isCurrentPage>{t('common.results', 'Results')}</BreadcrumbItem></Breadcrumb>
        <h1 style={{ fontWeight: 400, margin: '0.5rem 0 0.25rem' }}>{t('common.results', 'Results')}</h1>
        <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
          {run ? <span>{t('run.label.run', 'Run')} <strong>{run.id}</strong> · {run.source === 'ANALYZER' ? 'Analyzer message' : 'Workplan batch'} · {run.labUnit} &nbsp;<Button kind="ghost" size="sm" onClick={() => setRunFilter(null)}>← All pending results</Button></span>
            : 'Pending results for your lab units. Rows waiting in or held by a run say so; open the run to review it.'}
        </p>

        {!run && (
          <Stack orientation="horizontal" gap={4} style={{ alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Select id="lab-unit" labelText="Lab unit" value={labUnit} onChange={e => setLabUnit(e.target.value)} size="sm" style={{ minWidth: 220 }}>
              <SelectItem value="all" text="All my lab units" /><SelectItem value="Chemistry" text="Chemistry" /><SelectItem value="Hematology" text="Hematology" />
            </Select>
            <Tag type="high-contrast">All {unitRows.filter(r => r.status !== 'accepted').length}</Tag>
            <Tag type="outline">Needs review</Tag><Tag type="outline">Critical 1</Tag><Tag type="outline">Abnormal</Tag>
            <Tag type={showHeld ? 'red' : 'outline'} onClick={() => setShowHeld(v => !v)} style={{ cursor: 'pointer' }}>{t('run.filter.held', 'Held')} {heldCount}</Tag>
            <RunsChip runs={unitRuns} rows={rows} onPick={setRunFilter} />
            <span style={{ flex: 1 }} />
            <Button kind="tertiary" size="sm" disabled={!canBatch} onClick={batchThese}>{t('run.action.batchThese', 'Batch these')}{selectedRows.length ? ` (${selectedRows.length})` : ''}</Button>
          </Stack>
        )}

        {run && (
          <Stack gap={0} style={{ marginBottom: '1rem', border: '1px solid var(--cds-border-subtle)' }}>
            <QcBlock run={run} rows={rows.filter(r => r.run === run.id)} onAction={qcAction} />
            <SettingsBlock run={run} rows={rows.filter(r => r.run === run.id)} />
            <ExceptionsBlock run={run} onAction={qcAction} />
          </Stack>
        )}

        {run && run.source === 'ANALYZER' && (
          <BulkBar run={run} rows={rows.filter(r => r.run === run.id)} selected={selected} onSelect={setSelected} onClear={() => setSelected([])}
            onAccept={n => { say(`${n} results accepted with lot ${run.lot.name}. Undo available for 30 seconds.`); setSelected([]); }} />
        )}

        <DataTable rows={tableRows} headers={headers} size="sm">
          {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps, getTableProps, getExpandedRowProps }) => (
            <TableContainer>
              {!run && <TableToolbar><TableToolbarContent><TableToolbarSearch placeholder="Sample ID, patient, test" persistent /></TableToolbarContent></TableToolbar>}
              <Table {...getTableProps()}>
                <TableHead><TableRow><TableHeader /><TableExpandHeader />{dtHeaders.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow></TableHead>
                <TableBody>
                  {dtRows.map(dr => {
                    const row = rows.find(r => r.id === dr.id);
                    const rr = row.run ? runs[row.run] : null;
                    const held = isHeld(row, runs);
                    const showValue = row.status !== 'pending' || (runFilter && rr && rr.source === 'ANALYZER' && !held);
                    return (
                      <React.Fragment key={dr.id}>
                        <TableExpandRow {...getRowProps({ row: dr })}>
                          <TableCell><Checkbox id={`sel-${row.id}`} labelText="" hideLabel disabled={row.status === 'accepted' || (!runFilter && !!row.run) || (runFilter && held)} checked={selected.includes(row.id)} onChange={() => setSelected(s => s.includes(row.id) ? s.filter(x => x !== row.id) : [...s, row.id])} /></TableCell>
                          <TableCell><strong>{row.sample}</strong> <span style={{ color: 'var(--cds-text-secondary)', fontSize: 12 }}>{row.patient}</span></TableCell>
                          <TableCell>{row.test}</TableCell>
                          <TableCell>{showValue ? <span>{row.value}{row.components && runFilter && <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{row.components.length} components</div>}</span> : <span style={{ color: 'var(--cds-text-secondary)' }}>—</span>}</TableCell>
                          <TableCell>{rr ? <span>{rr.method} <span style={{ color: 'var(--cds-text-secondary)', fontSize: 12 }}>{rr.source === 'ANALYZER' ? rr.analyzer : rr.operator}</span> {runFilter && rr.source === 'ANALYZER' && <Tag type="gray" size="sm">{t('run.lot.analyzerReported', 'Analyzer-reported')}</Tag>}</span> : <span style={{ color: 'var(--cds-text-secondary)' }}>Manual</span>}</TableCell>
                          <TableCell>
                            {row.status === 'accepted' ? <Tag type="green" size="sm">Accepted</Tag> : row.status === 'entered' ? <Tag type="teal" size="sm">Entered</Tag> : <Tag type="gray" size="sm">{t('common.pending', 'Pending')}</Tag>}
                            {!runFilter && <RunRowTag row={row} runs={runs} onOpenRun={setRunFilter} />}
                            {runFilter && held && <Tag type="red" size="sm">{t('run.state.held', 'Held')}</Tag>}
                            {runFilter && row.presence && <span style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--cds-text-secondary)' }}> in review by {row.presence}</span>}
                          </TableCell>
                          <TableCell>
                            {showValue && row.flag === 'critical' && <Tag type="red" size="sm" renderIcon={Warning}>Critical</Tag>}
                            {showValue && row.flag === 'abnormal' && <Tag type="warm-gray" size="sm">Abnormal</Tag>}
                            {runFilter && row.dup && <Tag type="magenta" size="sm">Already resulted</Tag>}
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

        {toast && <div style={{ position: 'fixed', right: '1.5rem', bottom: '1.5rem' }}><InlineNotification kind="success" lowContrast title="Done" subtitle={toast} onCloseButtonClick={() => setToast(null)} /></div>}
      </Column>
    </Grid>
  );
}
