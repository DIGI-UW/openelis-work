// M-18 Environmental Microbiology, on the Microbiology v2 Case layout
// Routes:
//   /order/environmental/enter            Environmental Enter Order, Microbiology section (FR-C3, FR-C4)
//   /microbiology/case/:caseId            Microbiology Case with a site subject (section D, v2 layout)
//   /microbiology/worklist                Worklist, Patient or site column and Lab unit filter (section E)
// SideNav: Orders & Patients -> Add Order (Environmental); Microbiology -> Worklist
// FRS: m-18-environmental-microbiology-frs.md v0.5; amr-micro-v2-amendments.md draft 3
// Decisions: D-114, D-115, D-117, D-119, D-120 to D-123

import React, { useState } from 'react';
import {
  Breadcrumb, BreadcrumbItem, Grid, Column, Stack, Tile, Tag, Button, Select, SelectItem,
  NumberInput, Checkbox, InlineNotification, ContentSwitcher, Switch,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
} from '@carbon/react';
import { Add } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

const LAB_UNITS = ['Environmental Microbiology', 'Water Quality'];
const PURPOSES = [
  { id: 'ROUTINE_MONITORING', label: t('micro.culturePurpose.routineMonitoring', 'Routine monitoring') },
  { id: 'POST_CLEANING', label: t('micro.culturePurpose.postCleaning', 'Post-cleaning check') },
  { id: 'OUTBREAK_INVESTIGATION', label: t('micro.culturePurpose.outbreak', 'Outbreak investigation') },
  { id: 'COMPLAINT', label: t('micro.culturePurpose.complaint', 'Complaint') },
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

/* ---------- Environmental Enter Order: Microbiology section ---------- */
export function EnvOrderMicrobiologySection() {
  const [units, setUnits] = useState(SAMPLES.map(() => LAB_UNITS[0]));
  const [extra, setExtra] = useState(null); // index of a sample with a second Case
  const count = SAMPLES.length + (extra === null ? 0 : 1);
  return (
    <Tile>
      <Stack gap={4}>
        <h4>{t('order.env.micro.title', 'Microbiology')}</h4>
        <p>{t('order.env.micro.summary', 'This order will create {count} Microbiology Cases.').replace('{count}', count)}</p>
        <TableContainer>
          <Table size="md">
            <TableHead><TableRow>
              <TableHeader>{t('label.sample', 'Sample')}</TableHeader>
              <TableHeader>{t('label.sampleTypeAndTest', 'Sample type and test')}</TableHeader>
              <TableHeader>{t('micro.order.labUnit', 'Lab unit')} *</TableHeader>
              <TableHeader />
            </TableRow></TableHead>
            <TableBody>
              {SAMPLES.map((s, i) => (
                <React.Fragment key={s.num}>
                  <TableRow>
                    <TableCell>{s.num}<br /><small>{t('order.env.fieldId', 'Field ID')} {s.fid}</small></TableCell>
                    <TableCell>{s.type}<br /><small>{s.test}</small></TableCell>
                    <TableCell>
                      <Select id={`lu-${i}`} labelText="" hideLabel size="sm" value={units[i]}
                        helperText={t('micro.order.labUnit.default', 'Default: lab unit of the first test')}
                        onChange={(e) => { const u = [...units]; u[i] = e.target.value; setUnits(u); }}>
                        {LAB_UNITS.map((u) => <SelectItem key={u} value={u} text={u} />)}
                      </Select>
                    </TableCell>
                    <TableCell>
                      {extra === null && (
                        <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setExtra(i)}>
                          {t('micro.order.anotherLabUnit', 'Another lab unit')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {extra === i && (
                    <TableRow>
                      <TableCell>{s.num}<br /><small>{t('micro.order.secondCase', 'Second Case, same sample')}</small></TableCell>
                      <TableCell>{s.type}</TableCell>
                      <TableCell>
                        <Select id={`lu-x-${i}`} labelText="" hideLabel size="sm" defaultValue={LAB_UNITS[1]}>
                          {LAB_UNITS.filter((u) => u !== units[i]).map((u) => <SelectItem key={u} value={u} text={u} />)}
                        </Select>
                      </TableCell>
                      <TableCell><Button kind="ghost" size="sm" onClick={() => setExtra(null)}>{t('button.remove', 'Remove')}</Button></TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <p><small>{t('order.env.micro.caseDetailsOnCase', 'Purpose and replicates are entered on the Case. The lab unit can be changed later in Edit order or on the Case.')}</small></p>
      </Stack>
    </Tile>
  );
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
        <h2>{t('micro.case.title', 'Surface swab culture')}</h2>
      </Column>

      {/* Context strip (FR-D2) */}
      <Column lg={16}>
        <Tile>
          <Stack orientation="horizontal" gap={7}>
            <div><small>{t('label.labNumber', 'Lab number')}</small><div>26CPHL00512-3 <Tag type="teal" size="sm">{t('label.domain.environmental', 'Environmental')}</Tag></div></div>
            <div><small>{t('micro.case.subject.site', 'Site')}</small><div>Medical Ward 3, Port Moresby General Hospital</div></div>
            <div><small>{t('micro.case.samplingPoint', 'Sampling point')}</small><div>Bed 12 rail</div></div>
            <div><small>{t('order.env.fieldId', 'Field ID')}</small><div>IPC-0419</div></div>
            <div><small>{t('micro.order.labUnit', 'Lab unit')}</small><div>Environmental Microbiology <Button kind="ghost" size="sm">{t('micro.case.changeLabUnit', 'Change lab unit')}</Button></div></div>
            <div><small>{t('label.requester', 'Requester')}</small><div>Ruth Kaupa, Infection Prevention</div></div>
          </Stack>
        </Tile>
      </Column>

      {/* 1 Case information (v2 A-03, M-18 FR-C5, FR-C5a) */}
      <Column lg={16}>
        <h4>{t('micro.case.section.caseInfo', 'Case information')}</h4>
        <Grid narrow>
          <Column lg={5}>
            <Select id="purpose" labelText={`${t('micro.case.purpose', 'Purpose')} *`} value={purpose} onChange={(e) => setPurpose(e.target.value)}
              helperText={t('micro.case.purpose.appliesToOrder', 'Applies to all {count} Cases on this order').replace('{count}', 3)}>
              {PURPOSES.map((p) => <SelectItem key={p.id} value={p.id} text={p.label} />)}
            </Select>
          </Column>
          <Column lg={3}>
            <NumberInput id="replicates" label={t('order.micro.sets.env', 'Replicates')} min={1} max={10} value={replicates}
              onChange={(e, { value }) => setReplicates(value)} />
          </Column>
        </Grid>
        {purpose === 'OUTBREAK_INVESTIGATION' && (
          <InlineNotification kind="info" lowContrast hideCloseButton
            title={t('micro.case.outbreak.title', 'Not counted by cluster detection')}
            subtitle={t('micro.case.outbreak.subtitle', 'Samples taken because of a signal never feed that signal.')} />
        )}
      </Column>

      {/* 2 Initial testing (v2 A-06) */}
      <Column lg={16}>
        <h4>{t('micro.case.section.initialTesting', 'Initial testing')}</h4>
        <p>{t('micro.case.initialTesting.empty', 'No direct tests on this specimen.')}</p>
        <Button kind="tertiary" size="sm" renderIcon={Add}>{t('micro.case.addTestOrPanel', 'Add test or panel')}</Button>
      </Column>

      {/* 3 Culture (v2 A-05) */}
      <Column lg={16}>
        <h4>{t('micro.case.section.culture', 'Culture')}</h4>
        <SimpleTable
          headers={[
            { key: 'medium', header: t('micro.case.inoc.medium', 'Medium') },
            { key: 'cond', header: t('micro.case.inoc.conditions', 'Atmosphere, °C') },
            { key: 'dur', header: t('micro.case.inoc.duration', 'Incubation duration') },
            { key: 'every', header: t('micro.case.inoc.checkEvery', 'Check every') },
            { key: 'ends', header: t('micro.case.inoc.ends', 'Incubation ends') },
            { key: 'state', header: t('label.state', 'State') },
            { key: 'log', header: t('micro.case.inoc.readLog', 'Read log') },
            { key: 'act', header: '' },
          ]}
          rows={[
            { id: 'chrom', medium: 'CHROMagar MRSA', cond: 'Aerobic, 35', dur: '48 Hours', every: '24 Hours', ends: '27/09 09:10',
              state: <Tag type="green" size="sm">{t('micro.case.inoc.growth', 'Growth')}</Tag>, log: 'Day 1: significant growth, ++ (J. Wari)', act: '' },
            { id: 'bap', medium: 'Blood agar', cond: 'Aerobic, 35', dur: '48 Hours', every: '24 Hours', ends: '27/09 09:10',
              state: bapChecked ? <Tag type="green" size="sm">{t('micro.case.inoc.growth', 'Growth')}</Tag> : <Tag type="warm-gray" size="sm">{t('micro.case.inoc.checkDue', 'Check due')}</Tag>,
              log: bapChecked ? 'Day 1 and Day 2: significant growth (J. Wari)' : 'Day 1: significant growth (J. Wari)',
              act: bapChecked ? '' : <Button kind="ghost" size="sm" onClick={() => setBapChecked(true)}>{t('micro.case.inoc.recordReading', 'Record reading')}</Button> },
          ]}
        />
      </Column>

      {/* 4 Growth work-up (v2 A-10) */}
      <Column lg={16}>
        <h4>{t('micro.case.section.growthWorkup', 'Growth work-up')}</h4>
        <p>Gram: Gram-positive cocci in clusters <Tag type="gray" size="sm">{t('micro.case.growth.internalOnly', 'Internal only, not reported')}</Tag></p>
      </Column>

      {/* 5 Isolates, 6 AST / DST (existing) */}
      <Column lg={16}>
        <h4>{t('micro.case.section.isolatesAst', 'Isolates and AST / DST')}</h4>
        <p><em>Staphylococcus aureus</em> (MALDI-TOF Biotyper, score 2.21). Cefoxitin screen positive: MRSA.</p>
        <p><small>{t('micro.rules.skipped.patientData', 'Not applied: needs patient data')}: Patient under 12 years: suppress tetracyclines</small></p>
      </Column>

      {/* 7 Additional testing (v2 A-15) */}
      <Column lg={16}>
        <h4>{t('micro.case.section.additionalTesting', 'Additional testing')}</h4>
        <SimpleTable
          headers={[
            { key: 'test', header: t('label.test', 'Test') },
            { key: 'on', header: t('label.on', 'On') },
            { key: 'result', header: t('label.result', 'Result') },
            { key: 'lab', header: t('micro.case.inLabOnly', 'In lab only') },
          ]}
          rows={[{ id: 'spa', test: 'spa typing', on: 'Isolate 1', result: 'Referred, sent 28/09',
            lab: <Checkbox id="lab-only-spa" labelText={labOnly ? t('micro.case.inLabOnly.helper', 'Not shown on the patient report') : t('label.reportable', 'Reportable')}
              checked={labOnly} onChange={(_, { checked }) => setLabOnly(checked)} /> }]}
        />
      </Column>

      {/* 8 Report (v2 A-11) */}
      <Column lg={16}>
        <h4>{t('micro.case.section.report', 'Report')}</h4>
        <Stack gap={3}>
          <Checkbox id="rep-org" labelText="Isolate 1: S. aureus, MRSA" checked={report.org} onChange={(_, { checked }) => setReport({ ...report, org: checked })} />
          <Checkbox id="rep-fox" labelText="Cefoxitin screen positive" checked={report.fox} onChange={(_, { checked }) => setReport({ ...report, fox: checked })} />
          <Checkbox id="rep-pen" labelText="Penicillin R (suppressed by expert rule)" checked={report.pen} onChange={(_, { checked }) => setReport({ ...report, pen: checked })} />
          {!labOnly && <Checkbox id="rep-spa" labelText="spa typing (pending)" defaultChecked={false} />}
        </Stack>
        <Stack orientation="horizontal" gap={3}>
          <Button kind="secondary" size="sm">{t('micro.case.report.releasePreliminary', 'Release preliminary')}</Button>
          <Button kind="primary" size="sm">{t('micro.case.report.releaseFinal', 'Release final')}</Button>
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
        <Switch name="ALL" text={t('micro.worklist.filter.all', 'All')} />
        <Switch name="Microbiology" text="Microbiology" />
        <Switch name="Environmental Microbiology" text="Environmental Microbiology" />
      </ContentSwitcher>
      <SimpleTable
        headers={[
          { key: 'lab', header: t('label.labNumber', 'Lab number') },
          { key: 'subject', header: t('micro.worklist.subject', 'Patient or site') },
          { key: 'unit', header: t('micro.order.labUnit', 'Lab unit') },
          { key: 'reason', header: t('micro.worklist.card.attention', 'Needs attention') },
        ]}
        rows={rows.map((r) => ({ ...r, lab: <span>{r.lab} {r.env && <Tag type="teal" size="sm">{t('label.domain.environmental', 'Environmental')}</Tag>}</span> }))}
      />
    </Stack>
  );
}

export default function M18EnvironmentalMicrobiologyMockup() {
  return (
    <Stack gap={8}>
      <EnvOrderMicrobiologySection />
      <EnvironmentalCase />
      <MicroWorklist />
    </Stack>
  );
}
