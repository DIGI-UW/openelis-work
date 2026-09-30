// M-18 Environmental Microbiology, on the Microbiology v2 Case layout
// Routes:
//   /order/environmental/enter            Environmental Enter Order: culture test in the samples table; no micro section (FR-C1, FR-C4)
//   /Microbiology/cases/:caseId           Microbiology Case with a site subject (section D, v2 layout)
//   /Microbiology/worklist                Worklist, Patient or site column and Lab unit filter (section E)
// SideNav: Orders & Patients -> Add Order (Environmental); Microbiology -> Worklist
// FRS: m-18-environmental-microbiology-frs.md v0.8; amr-micro-v2-amendments.md draft 8
// Decisions: D-115, D-117, D-119, D-120 to D-125, D-129, D-137, D-138, D-146

import React, { useState } from 'react';
import {
  Breadcrumb, BreadcrumbItem, Grid, Column, Stack, Tile, Tag, Button, Select, SelectItem,
  NumberInput, Checkbox, InlineNotification, ContentSwitcher, Switch,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
} from '@carbon/react';
import { Add } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

const PURPOSES = [
  { id: 'ROUTINE_MONITORING', label: t('microbiology.culturePurpose.routineMonitoring', 'Routine monitoring') },
  { id: 'POST_CLEANING', label: t('microbiology.culturePurpose.postCleaning', 'Post-cleaning check') },
  { id: 'OUTBREAK_INVESTIGATION', label: t('microbiology.culturePurpose.outbreak', 'Outbreak investigation') },
  { id: 'COMPLAINT', label: t('microbiology.culturePurpose.complaint', 'Complaint') },
];
const SAMPLES = [
  { num: '26CPHL00512-1', fid: 'IPC-0417', type: 'Surface swab', test: 'Surface swab culture', point: 'Sink tap, bay 2' },
  { num: '26CPHL00512-2', fid: 'IPC-0418', type: 'Surface swab', test: 'Surface swab culture', point: 'Nurse station keyboard' },
  { num: '26CPHL00512-3', fid: 'IPC-0419', type: 'Surface swab', test: 'Surface swab culture', point: 'Bed 12 rail' },
];

function SimpleTable({ headers, rows }) {
  return (
    <DataTable rows={rows} headers={headers} size="sm">
      {({ rows: r, headers: h, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer>
          <Table {...getTableProps()}>
            <TableHead><TableRow>{h.map((x) => <TableHeader key={x.key} {...getHeaderProps({ header: x })}>{x.header}</TableHeader>)}</TableRow></TableHead>
            <TableBody>{r.map((row) => (
              <TableRow key={row.id} {...getRowProps({ row })}>{row.cells.map((c) => <TableCell key={c.id}>{c.value}</TableCell>)}</TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

/* ---------- Environmental Enter Order: culture tests like any test (FR-C1, FR-C4; v2 D-146) ---------- */
// No Microbiology section and no Program coupling. The env v4 samples table is unchanged; the
// "After save" tile is drawn for review only and is not shown to reception.
export function EnvOrderCultureTests() {
  return (
    <Stack gap={4}>
      <ExistingFenceNote text="Env v4 samples table (site, sampling point, field ID, tests): unchanged. Surface swab culture is picked in Tests like any test." />
      <SimpleTable
        headers={[
          { key: 'num', header: t('label.sample', 'Sample') },
          { key: 'fid', header: t('order.env.fieldId', 'Field ID') },
          { key: 'point', header: t('order.env.samplingPoint', 'Sampling point') },
          { key: 'test', header: t('label.tests', 'Tests') },
        ]}
        rows={SAMPLES.map((s) => ({ id: s.num, ...s, test: <Tag type="teal" size="sm">{s.test}</Tag> }))}
      />
      <Tile>
        <h6>{t('microbiology.mockup.afterSave', 'After save (drawn for review; reception sees nothing extra)')}</h6>
        <SimpleTable
          headers={[
            { key: 'caseFor', header: 'Case opens for' },
            { key: 'num', header: t('label.sample', 'Sample') },
            { key: 'unit', header: t('microbiology.order.labUnit', 'Lab unit') },
            { key: 'purpose', header: t('microbiology.culturePurpose.label', 'Culture purpose') },
          ]}
          rows={SAMPLES.map((s) => ({ id: s.num, caseFor: s.test, num: `${s.num} (${s.point})`, unit: 'Environmental Microbiology', purpose: PURPOSES[0].label }))}
        />
        <p><small>One Case per sampling point; replicate swabs from one point would share a Case, split on the Case. Purpose (default Routine monitoring) and replicates are edited in Case information. Program is not set or read.</small></p>
      </Tile>
    </Stack>
  );
}

function ExistingFenceNote({ text }) {
  return <div style={{ border: '1px dashed var(--cds-border-strong-01)', padding: 'var(--cds-spacing-03)' }}><Tag type="gray" size="sm">Existing component</Tag> <small>{text}</small></div>;
}

/* ---------- Microbiology Case, environmental subject ---------- */
export function EnvironmentalCase() {
  const [purpose, setPurpose] = useState('POST_CLEANING');
  const [replicates, setReplicates] = useState(1);
  const [bapChecked, setBapChecked] = useState(false);
  const [labOnly, setLabOnly] = useState(true);
  const [report, setReport] = useState({ org: true, fox: true, pen: false });

  return (
    <Grid>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('breadcrumb.microbiology', 'Microbiology')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('breadcrumb.microbiology.worklist', 'Worklist')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>26CPHL00512-3</BreadcrumbItem>
        </Breadcrumb>
        <h2>{t('microbiology.case.title', 'Surface swab culture')}</h2>
      </Column>

      {/* Context strip (FR-D2) */}
      <Column lg={16}>
        <Tile>
          <Stack orientation="horizontal" gap={7}>
            <div><small>{t('label.labNumber', 'Lab number')}</small><div>26CPHL00512-3 <Tag type="teal" size="sm">{t('label.domain.environmental', 'Environmental')}</Tag></div></div>
            <div><small>{t('microbiology.case.subject.site', 'Site')}</small><div>Medical Ward 3, Port Moresby General Hospital</div></div>
            <div><small>{t('microbiology.case.samplingPoint', 'Sampling point')}</small><div>Bed 12 rail</div></div>
            <div><small>{t('order.env.fieldId', 'Field ID')}</small><div>IPC-0419</div></div>
            <div><small>{t('microbiology.order.labUnit', 'Lab unit')}</small><div>Environmental Microbiology <Button kind="ghost" size="sm">{t('microbiology.case.changeLabUnit', 'Change lab unit')}</Button></div></div>
            <div><small>{t('label.requester', 'Requester')}</small><div>Ruth Kaupa, Infection Prevention</div></div>
          </Stack>
        </Tile>
      </Column>

      {/* 1 Case information (v2 A-03, M-18 FR-C5, FR-C5a) */}
      <Column lg={16}>
        <h4>{t('microbiology.case.section.caseInfo', 'Case information')}</h4>
        <Grid narrow>
          <Column lg={5}>
            <Select id="purpose" labelText={`${t('microbiology.culturePurpose.label', 'Purpose')} *`} value={purpose} onChange={(e) => setPurpose(e.target.value)}
              helperText={t('microbiology.case.appliesToOrder', 'Replicates apply to all {count} cases on this order; purpose defaults from the order').replace('{count}', 3)}>
              {PURPOSES.map((p) => <SelectItem key={p.id} value={p.id} text={p.label} />)}
            </Select>
          </Column>
          <Column lg={3}>
            <NumberInput id="replicates" label={t('microbiology.orderDetail.replicates', 'Replicates')} min={1} max={10} value={replicates}
              onChange={(e, { value }) => setReplicates(value)} />
          </Column>
        </Grid>
        {purpose === 'OUTBREAK_INVESTIGATION' && (
          <InlineNotification kind="info" lowContrast hideCloseButton
            title={t('microbiology.case.outbreak.title', 'Not counted by cluster detection')}
            subtitle={t('microbiology.case.outbreak.subtitle', 'Samples taken because of a signal never feed that signal.')} />
        )}
      </Column>

      {/* 2 Initial testing (v2 A-06) */}
      <Column lg={16}>
        <h4>{t('microbiology.case.section.initialTesting', 'Initial testing')}</h4>
        <p>{t('microbiology.case.initialTesting.empty', 'No direct tests on this specimen.')}</p>
        <Button kind="tertiary" size="sm" renderIcon={Add}>{t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Button>
      </Column>

      {/* 3 Culture (v2 A-05) */}
      <Column lg={16}>
        <h4>{t('microbiology.case.section.culture', 'Culture')}</h4>
        <SimpleTable
          headers={[
            { key: 'medium', header: t('microbiology.case.inoc.medium', 'Medium') },
            { key: 'cond', header: t('microbiology.case.inoc.conditions', 'Atmosphere, °C') },
            { key: 'dur', header: t('microbiology.case.inoc.duration', 'Incubation duration') },
            { key: 'every', header: t('microbiology.case.inoc.checkEvery', 'Check every') },
            { key: 'ends', header: t('microbiology.case.inoc.ends', 'Incubation ends') },
            { key: 'state', header: t('label.state', 'State') },
            { key: 'log', header: t('microbiology.case.inoc.readLog', 'Read log') },
            { key: 'act', header: '' },
          ]}
          rows={[
            { id: 'chrom', medium: 'CHROMagar MRSA', cond: 'Aerobic, 35', dur: '48 Hours', every: '24 Hours', ends: '27/09 09:10',
              state: <Tag type="green" size="sm">{t('microbiology.case.inoc.growth', 'Growth')}</Tag>, log: 'Day 1: significant growth, ++ (J. Wari)', act: '' },
            { id: 'bap', medium: 'Blood agar', cond: 'Aerobic, 35', dur: '48 Hours', every: '24 Hours', ends: '27/09 09:10',
              state: bapChecked ? <Tag type="green" size="sm">{t('microbiology.case.inoc.growth', 'Growth')}</Tag> : <Tag type="warm-gray" size="sm">{t('microbiology.case.inoc.checkDue', 'Check due')}</Tag>,
              log: bapChecked ? 'Day 1 and Day 2: significant growth (J. Wari)' : 'Day 1: significant growth (J. Wari)',
              act: bapChecked ? '' : <Button kind="ghost" size="sm" onClick={() => setBapChecked(true)}>{t('microbiology.case.inoc.recordReading', 'Record reading')}</Button> },
          ]}
        />
      </Column>

      {/* 4 Growth work-up (v2 A-10) */}
      <Column lg={16}>
        <h4>{t('microbiology.case.section.growthWorkup', 'Growth work-up')}</h4>
        <div>Gram: Gram-positive cocci in clusters <Tag type="gray" size="sm">{t('microbiology.case.growth.internalOnly', 'Internal only, not reported')}</Tag></div>
      </Column>

      {/* 5 Isolates, 6 AST / DST (existing) */}
      <Column lg={16}>
        <h4>{t('microbiology.case.section.isolatesAst', 'Isolates and AST / DST')}</h4>
        <p><em>Staphylococcus aureus</em> (MALDI-TOF Biotyper, score 2.21). Cefoxitin screen positive: MRSA.</p>
        <Grid narrow>
          <Column lg={4}><Select id="ast-method" labelText={`${t('microbiology.ast.method', 'Method')} *`} defaultValue="VITEK_2">
            {['VITEK_2', 'PHOENIX', 'ETEST', 'BROTH_MICRODILUTION', 'DISK_DIFFUSION'].map((m) => <SelectItem key={m} value={m} text={m.replace('_', ' ')} />)}
          </Select></Column>
          <Column lg={4}><Select id="ast-bp" labelText={`${t('microbiology.ast.breakpointStandard', 'Breakpoint standard')} *`} defaultValue="CLSI_2026">
            <SelectItem value="CLSI_2026" text="CLSI M100 36th ed. (2026)" />
            <SelectItem value="EUCAST_15" text="EUCAST v15.0 (2025)" />
          </Select></Column>
          <Column lg={4}><Select id="ast-mode" labelText={t('microbiology.ast.entryMode', 'Entry mode')} defaultValue="ANALYZER">
            <SelectItem value="ANALYZER" text="Analyzer" /><SelectItem value="MANUAL" text="Manual" />
          </Select></Column>
        </Grid>
        <p><small>{t('microbiology.ast.keptAsBuilt', 'Panel adjustment, reagent lot, QC handling, expert flags, override and revert, review, repeat and retest attempts work as built (Microbiology v2 A-16).')}</small></p>
        <p><small>{t('microbiology.rules.skipped.patientData', 'Not applied: needs patient data')}: Patient under 12 years: suppress tetracyclines</small></p>
      </Column>

      {/* 7 Additional testing (v2 A-15) */}
      <Column lg={16}>
        <h4>{t('microbiology.case.section.additionalTesting', 'Additional testing')}</h4>
        <SimpleTable
          headers={[
            { key: 'test', header: t('label.test', 'Test') },
            { key: 'on', header: t('label.on', 'On') },
            { key: 'result', header: t('label.result', 'Result') },
            { key: 'lab', header: t('microbiology.case.inLabOnly', 'In lab only') },
          ]}
          rows={[{ id: 'spa', test: 'spa typing', on: 'Isolate 1', result: 'Referred, sent 28/09',
            lab: <Checkbox id="lab-only-spa" labelText={labOnly ? t('microbiology.case.inLabOnly.helper', 'Not shown on the patient report') : t('label.reportable', 'Reportable')}
              checked={labOnly} onChange={(_, { checked }) => setLabOnly(checked)} /> }]}
        />
      </Column>

      {/* 8 Report (v2 A-11) */}
      <Column lg={16}>
        <h4>{t('microbiology.case.section.report', 'Report')}</h4>
        <Stack gap={3}>
          <Checkbox id="rep-org" labelText="Isolate 1: S. aureus, MRSA" checked={report.org} onChange={(_, { checked }) => setReport({ ...report, org: checked })} />
          <Checkbox id="rep-fox" labelText="Cefoxitin screen positive" checked={report.fox} onChange={(_, { checked }) => setReport({ ...report, fox: checked })} />
          <Checkbox id="rep-pen" labelText="Penicillin R (suppressed by expert rule)" checked={report.pen} onChange={(_, { checked }) => setReport({ ...report, pen: checked })} />
          {!labOnly && <Checkbox id="rep-spa" labelText="spa typing (pending)" defaultChecked={false} />}
        </Stack>
        <Stack orientation="horizontal" gap={3}>
          <Button kind="secondary" size="sm">{t('microbiology.case.report.releasePreliminary', 'Release preliminary')}</Button>
          <Button kind="primary" size="sm">{t('microbiology.case.report.releaseFinal', 'Release final')}</Button>
        </Stack>
      </Column>
    </Grid>
  );
}

/* ---------- Worklist: Patient or site, Lab unit filter (FR-E1, FR-E1a) ---------- */
export function MicroWorklist() {
  const [unit, setUnit] = useState('ALL');
  const rows = [
    { id: '1', unit: 'Microbiology', lab: '26CPHL00471-3', subject: 'Kila Morea (F, 38 y)', env: false, reason: 'Incoming results' },
    { id: '2', unit: 'Environmental Microbiology', lab: '26CPHL00512-3', subject: 'Medical Ward 3 · Bed 12 rail · IPC-0419', env: true, reason: 'Check due' },
    { id: '3', unit: 'Environmental Microbiology', lab: '26CPHL00515-1', subject: 'Six Mile cooling tower · Basin outlet', env: true, reason: 'Incubation complete' },
  ].filter((r) => unit === 'ALL' || r.unit === unit);
  return (
    <Stack gap={4}>
      <ContentSwitcher selectedIndex={0} onChange={({ name }) => setUnit(name)}>
        <Switch name="ALL" text={t('microbiology.worklist.filter.all', 'All')} />
        <Switch name="Microbiology" text="Microbiology" />
        <Switch name="Environmental Microbiology" text="Environmental Microbiology" />
      </ContentSwitcher>
      <SimpleTable
        headers={[
          { key: 'lab', header: t('label.labNumber', 'Lab number') },
          { key: 'subject', header: t('microbiology.worklist.subject', 'Patient or site') },
          { key: 'unit', header: t('microbiology.order.labUnit', 'Lab unit') },
          { key: 'reason', header: t('microbiology.worklist.card.attention', 'Needs attention') },
        ]}
        rows={rows.map((r) => ({ ...r, lab: <span>{r.lab} {r.env && <Tag type="teal" size="sm">{t('label.domain.environmental', 'Environmental')}</Tag>}</span> }))}
      />
    </Stack>
  );
}

export default function M18EnvironmentalMicrobiologyMockup() {
  return (
    <Stack gap={8}>
      <EnvOrderCultureTests />
      <EnvironmentalCase />
      <MicroWorklist />
    </Stack>
  );
}
