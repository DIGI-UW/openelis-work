// Routes: /analyzers (Instruments list), /analyzers/maintenance[?analyzerId=<id>] (Maintenance)
// SideNav: Instruments (relabelled from Analyzers, D-360) → Instruments, Analyzer Types, Import Issues, Maintenance
// Breadcrumb: Home / Instruments  and  Home / Instruments / Maintenance
// FRS: analyzer-maintenance.md v2.0 (2026-10-21), OGC-1015
//
// Handoff mockup for "Instruments: Maintenance, Certificates and Service Status".
// Three exports:
//   default InstrumentsList      the register, connected and not connected (FR-A)
//   MaintenancePage              log with certificates (FR-B), status panel (FR-D4), required checks (FR-C)
//   InstrumentFieldOnResult      what the Results Entry instrument field adds (FR-F2, FR-F3); fenced as existing UI
//
// Service status is computed on the server, once (FR-D5, D-361). The mock data below carries the
// computed status and reasons; nothing in this file derives status on the client, and the
// implementation must not either.
//
// Analyzer Types and Import Issues are unchanged pages (D-069) and are not drawn here.

import React, { useState } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  Button, Tag, Tile, Select, SelectItem, TextInput, TextArea, NumberInput, DatePicker, DatePickerInput,
  ComboBox, FilterableMultiSelect, Toggle, FileUploader, InlineNotification,
  Breadcrumb, BreadcrumbItem, RadioButtonGroup, RadioButton,
} from '@carbon/react';
import { Add, Warning, Locked, CheckmarkFilled, DocumentPdf } from '@carbon/icons-react';

/* i18n helper: every visible string goes through this (Constitution Principle VII) */
const t = (key, fallback) => fallback || key;

const TODAY = '2026-10-21';
const SOON = '2026-10-28';

/* ------------------------------------------------------------------ mock data */

const INSTRUMENTS = [
  { id: 'A1', name: 'Donatello (c311 #2)', kind: 'Analyzer', make: 'Roche Cobas c311', serial: 'C311-08821', asset: 'CPHL-0412',
    connection: 'Connected', connectionState: 'Active', location: 'Main lab, room 2', labUnits: ['Chemistry'],
    usedFor: ['Glucose', 'Urea', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'ALT', 'Total bilirubin'],
    status: 'Restricted', lockedTests: ['Potassium'],
    reasons: [{ kind: 'locked', text: 'Potassium locked: control Level 2 failed in RUN-2409-0142 at 08:12 (6.9 mmol/L, expected 5.8 ± 0.4)', run: 'RUN-2409-0142' }],
    nextDue: '2026-12-02', nextDueWhat: 'Calibration', active: true },
  { id: 'A3', name: 'Hem-1 (XN-550)', kind: 'Analyzer', make: 'Sysmex XN-550', serial: 'XN-22918', asset: 'CPHL-0430',
    connection: 'Connected', connectionState: 'Offline', location: 'Main lab, room 3', labUnits: ['Hematology'],
    usedFor: ['Full blood count'], status: 'In service', reasons: [], nextDue: '2026-11-30', nextDueWhat: 'Service', active: true },
  { id: 'A4', name: 'GeneXpert IV (TB bench)', kind: 'Analyzer', make: 'Cepheid GeneXpert IV', serial: 'GX4-110293', asset: 'CPHL-0455',
    connection: 'Connected', connectionState: 'Active', location: 'TB lab', labUnits: ['Microbiology'],
    usedFor: ['Xpert MTB/RIF Ultra'], status: 'In service', reasons: [], nextDue: '2026-10-26', nextDueWhat: 'Module calibration', active: true },
  { id: 'B2', name: 'Balance B-02', kind: 'Analytical balance', make: 'Mettler Toledo XS205', serial: 'B-1129384', asset: 'ENV-0077',
    connection: 'Not connected', location: 'Environmental lab, weighing room', labUnits: ['Environmental'],
    usedFor: ['Total suspended solids', 'Total dissolved solids'], status: 'Out of service',
    reasons: [{ kind: 'cert', text: 'Calibration certificate C-4471 expired 14 Oct 2026 (required check "Calibration", out of service when overdue)' }],
    nextDue: '2026-10-14', nextDueWhat: 'Calibration', active: true },
  { id: 'B1', name: 'Balance B-01', kind: 'Analytical balance', make: 'Sartorius Quintix 125D', serial: '0038812', asset: 'ENV-0076',
    connection: 'Not connected', location: 'Environmental lab, weighing room', labUnits: ['Environmental'],
    usedFor: ['Total suspended solids'], status: 'In service', reasons: [], nextDue: '2027-03-01', nextDueWhat: 'Calibration', active: true },
  { id: 'P17', name: 'Pipette P-17', kind: 'Pipette', make: 'Eppendorf Research plus 100-1000 µL', serial: 'K12884G', asset: 'CPHL-P17',
    connection: 'Not connected', location: 'Molecular lab', labUnits: ['Molecular'],
    usedFor: ['HIV-1 viral load', 'HBV viral load'], status: 'Out of service',
    reasons: [
      { kind: 'progress', text: 'Calibration in progress since 18 Oct 2026 (sent to Afrilab Calibration Services)' },
      { kind: 'manual', text: 'Taken out of service by K. Barasa on 18 Oct 2026: "Sent for calibration, use P-18"' }],
    nextDue: '2026-10-20', nextDueWhat: 'Calibration', active: true },
  { id: 'I3', name: 'Incubator INC-3 (35 °C)', kind: 'Incubator', make: 'Memmert IN110', serial: 'IN110-6631', asset: 'CPHL-0520',
    connection: 'Not connected', location: 'Bacteriology', labUnits: ['Microbiology'],
    usedFor: ['Blood culture', 'Urine culture'], status: 'In service', reasons: [], nextDue: '2026-10-22', nextDueWhat: 'Performance check', active: true },
  { id: 'Z1', name: 'AAS PerkinElmer', kind: 'Analyzer', make: 'PerkinElmer AAnalyst 400', serial: 'AA4-3310', asset: 'ENV-0050',
    connection: 'Not connected', location: 'Store', labUnits: ['Environmental'], usedFor: ['Lead (AAS)'],
    status: 'In service', reasons: [], nextDue: null, nextDueWhat: null, active: false },
];

const EVENTS = [
  { id: 1, instrument: 'B2', date: '2026-10-21', type: 'Performance check', performedBy: 'R. Maina', vendor: '', outcome: 'Completed',
    validUntil: '2026-10-22', certificate: null, verifiedBy: null, notes: 'Check weights 1 g, 10 g, 100 g within tolerance.' },
  { id: 2, instrument: 'P17', date: '2026-10-18', type: 'Calibration', performedBy: 'K. Barasa', vendor: 'Afrilab Calibration Services',
    outcome: 'In progress', validUntil: null, certificate: null, verifiedBy: null, notes: 'Sent to vendor; expected back 28 Oct.' },
  { id: 3, instrument: 'A1', date: '2026-10-21', type: 'Calibration', performedBy: 'A. Wanjiru', vendor: '', outcome: 'Completed',
    validUntil: '2026-12-02', certificate: null, verifiedBy: 'J. Kiptoo',
    notes: 'Potassium ISE recalibrated after the L2 failure at 08:12. The lock lifts only when a potassium control passes in a run.' },
  { id: 4, instrument: 'A4', date: '2026-04-26', type: 'Module calibration', performedBy: '', vendor: 'Cepheid', outcome: 'Completed',
    validUntil: '2026-10-26', certificate: { number: 'GX-CAL-55190', issuer: 'Cepheid', file: 'GX-CAL-55190.pdf' }, verifiedBy: 'M. Kamau', notes: '' },
  { id: 5, instrument: 'B1', date: '2026-03-01', type: 'Calibration', performedBy: '', vendor: 'Kenya Bureau of Standards', outcome: 'Completed',
    validUntil: '2027-03-01', certificate: { number: 'KEBS-MC-26-0412', issuer: 'Kenya Bureau of Standards', file: 'KEBS-MC-26-0412.pdf' },
    verifiedBy: 'R. Maina', notes: '' },
  { id: 6, instrument: 'B2', date: '2025-10-14', type: 'Calibration', performedBy: '', vendor: 'Kenya Bureau of Standards', outcome: 'Completed',
    validUntil: '2026-10-14', certificate: { number: 'C-4471', issuer: 'Kenya Bureau of Standards', file: 'C-4471.pdf' },
    verifiedBy: 'R. Maina', notes: 'Expired. Vendor visit booked for 24 Oct.' },
  { id: 7, instrument: 'A3', date: '2026-05-30', type: 'Service', performedBy: '', vendor: 'Sysmex East Africa', outcome: 'Completed',
    validUntil: '2026-11-30', certificate: null, verifiedBy: null, notes: 'Six-monthly preventive maintenance. Downtime 3 h.', archived: false },
  { id: 8, instrument: 'B1', date: '2025-03-01', type: 'Calibration', performedBy: '', vendor: 'Kenya Bureau of Standards', outcome: 'Completed',
    validUntil: '2026-03-01', certificate: { number: 'KEBS-MC-25-0390', issuer: 'Kenya Bureau of Standards', file: 'KEBS-MC-25-0390.pdf' },
    verifiedBy: 'R. Maina', notes: '', archived: true },
];

const CHECKS = {
  B2: [
    { id: 'c1', type: 'Calibration', dueBy: 'certificate', every: null, outOfService: true, verification: true, state: 'Overdue', next: '2026-10-14' },
    { id: 'c2', type: 'Performance check', dueBy: 'interval', every: '1 day', outOfService: false, verification: false, state: 'Due soon', next: '2026-10-22' }],
  A1: [
    { id: 'c3', type: 'Calibration', dueBy: 'interval', every: '6 weeks', outOfService: true, verification: true, state: 'Current', next: '2026-12-02' }],
  P17: [
    { id: 'c4', type: 'Calibration', dueBy: 'certificate', every: null, outOfService: true, verification: true, state: 'In progress', next: '2026-10-20' }],
};

const EVENT_TYPES = ['Calibration', 'Verification', 'Performance check', 'Service', 'Repair', 'Inspection', 'Cleaning'];
const KINDS = ['Analyzer', 'Analytical balance', 'Pipette', 'Spectrophotometer', 'Incubator', 'Centrifuge', 'Microscope',
  'Thermometer', 'Water bath', 'Biosafety cabinet', 'Refrigerator or freezer', 'Other'];
const TESTS = ['Total suspended solids', 'Total dissolved solids', 'Lead (ICP-MS)', 'Hemoglobin', 'HIV-1 viral load', 'Nitrate']
  .map(x => ({ id: x, text: x }));
const USERS = ['R. Maina', 'P. Omondi', 'J. Kiptoo', 'M. Kamau', 'K. Barasa'].map(x => ({ id: x, text: x }));

const byId = id => INSTRUMENTS.find(i => i.id === id);
const fmt = d => {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  return `${Number(dd)} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]} ${y}`;
};
const dueStyle = d => (!d ? {} : d < TODAY
  ? { color: 'var(--cds-text-error)', fontWeight: 600 }
  : d <= SOON ? { color: 'var(--cds-support-warning)', fontWeight: 600 } : {});

/* ------------------------------------------------------------------ small parts */

/* FR-D1: icon plus word, never colour alone */
const ServiceTag = ({ s }) => (
  <Tag size="sm" type={s === 'In service' ? 'green' : s === 'Restricted' ? 'warm-gray' : 'red'}
    renderIcon={s === 'In service' ? CheckmarkFilled : s === 'Restricted' ? Locked : Warning}>
    <strong>{t(`analyzer.service.${s === 'In service' ? 'inService' : s === 'Restricted' ? 'restricted' : 'outOfService'}`, s)}</strong>
  </Tag>
);
const CheckStateTag = ({ s }) => (
  <Tag size="sm" type={s === 'Current' ? 'green' : s === 'Overdue' || s === 'Never done' ? 'red' : 'warm-gray'}>
    {t(`analyzer.check.state.${s}`, s)}
  </Tag>
);
const OutcomeTag = ({ o }) => (
  <Tag size="sm" type={o === 'Completed' ? 'green' : o === 'Failed' ? 'red' : 'warm-gray'}>
    {t(`label.analyzer.maintenance.outcome.${o}`, o)}
  </Tag>
);
const Secondary = ({ children }) => (
  <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{children}</div>
);

function ReuseBoundary({ title, owner, adds, children }) {
  return (
    <div style={{ border: '2px dashed var(--cds-border-strong)', padding: '0.5rem', margin: '0.25rem 0' }}>
      <Stack gap={2} style={{ marginBottom: 6 }}>
        <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag size="sm" type="purple"><strong>{t('mockup.reuse.tag', 'Existing component: reuse, do not re-implement')}</strong></Tag>
          <span style={{ fontSize: 12 }}><strong>{title}</strong></span>
          <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{owner}</span>
        </Stack>
        <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>
          <strong>{t('mockup.reuse.addsOnly', 'This FRS adds only:')}</strong> {adds}
        </span>
      </Stack>
      {children}
    </div>
  );
}

/* ================================================================ Instruments list */

export default function InstrumentsList({ onOpen = () => {} }) {
  const [connection, setConnection] = useState('all');
  const [status, setStatus] = useState('all');
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [adding, setAdding] = useState(false);

  const list = INSTRUMENTS.filter(i => (showDeactivated || i.active)
    && (connection === 'all' || i.connection === connection)
    && (status === 'all' || i.status === status)
    && (kind === 'all' || i.kind === kind)
    && (!query || `${i.name} ${i.serial} ${i.asset}`.toLowerCase().includes(query.toLowerCase())));

  const headers = [
    { key: 'name', header: t('common.name', 'Name') },
    { key: 'connection', header: t('analyzer.connection.label', 'Connection') },
    { key: 'status', header: t('analyzer.service.label', 'Service status') },
    { key: 'nextDue', header: t('label.analyzer.maintenance.column.nextDue', 'Next due') },
    { key: 'location', header: t('analyzer.field.location', 'Location') },
    { key: 'labUnits', header: t('common.labUnits', 'Lab units') },
    { key: 'edit', header: '' },
  ];

  return (
    <Grid fullWidth>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('common.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('sidenav.analyzers', 'Instruments')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 style={{ fontWeight: 400, margin: '0.5rem 0 0.25rem' }}>{t('sidenav.analyzers.all', 'Instruments')}</h1>
        <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
          {t('analyzer.list.intro', 'Every instrument the lab uses, connected or not. Service status comes from required checks, failed controls and manual decisions; connection is shown separately.')}
        </p>

        <Stack orientation="horizontal" gap={4} style={{ alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <Select id="f-conn" size="sm" labelText={t('analyzer.connection.label', 'Connection')} value={connection} onChange={e => setConnection(e.target.value)}>
            <SelectItem value="all" text={t('common.all', 'All')} />
            <SelectItem value="Connected" text={t('analyzer.connection.connected', 'Connected')} />
            <SelectItem value="Not connected" text={t('analyzer.connection.notConnected', 'Not connected')} />
          </Select>
          <Select id="f-status" size="sm" labelText={t('analyzer.service.label', 'Service status')} value={status} onChange={e => setStatus(e.target.value)}>
            <SelectItem value="all" text={t('common.all', 'All')} />
            <SelectItem value="In service" text={t('analyzer.service.inService', 'In service')} />
            <SelectItem value="Restricted" text={t('analyzer.service.restricted', 'Restricted')} />
            <SelectItem value="Out of service" text={t('analyzer.service.outOfService', 'Out of service')} />
          </Select>
          <ComboBox id="f-kind" size="sm" titleText={t('analyzer.field.kind', 'Kind')} items={['all', ...KINDS]}
            itemToString={k => (k === 'all' ? t('common.all', 'All') : k || '')} selectedItem={kind}
            onChange={({ selectedItem }) => setKind(selectedItem || 'all')} style={{ minWidth: 200 }} />
          <Toggle id="f-deact" size="sm" labelText={t('common.showDeactivated', 'Show deactivated')} hideLabel={false}
            toggled={showDeactivated} onToggle={v => setShowDeactivated(v)} />
          <span style={{ flex: 1 }} />
          <Button size="sm" kind="primary" renderIcon={Add} onClick={() => setAdding(true)}>
            {t('analyzer.add.title', 'Add instrument')}
          </Button>
        </Stack>

        {/* FR-A2: inline row, not a modal. A connected analyzer keeps today's add flow. */}
        {adding && <AddNotConnected onDone={() => setAdding(false)} />}

        <DataTable size="sm" headers={headers} rows={list.map(i => ({ id: i.id }))}>
          {({ rows, headers: hs, getHeaderProps, getTableProps }) => (
            <TableContainer>
              <TableToolbar><TableToolbarContent>
                <TableToolbarSearch persistent placeholder={t('analyzer.list.search', 'Search name, serial number or asset tag')}
                  onChange={(e, v) => setQuery(typeof v === 'string' ? v : e.target.value)} />
              </TableToolbarContent></TableToolbar>
              <Table {...getTableProps()}>
                <TableHead><TableRow>{hs.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow></TableHead>
                <TableBody>
                  {rows.map(r => {
                    const i = byId(r.id);
                    return (
                      <TableRow key={i.id}>
                        <TableCell>
                          <Button kind="ghost" size="sm" onClick={() => onOpen(i.id)}><strong>{i.name}</strong></Button>
                          <Secondary>{i.kind} · {i.make}</Secondary>
                        </TableCell>
                        <TableCell>
                          {i.connection === 'Connected'
                            ? <span>{t('analyzer.connection.connected', 'Connected')} <Secondary>{i.connectionState}</Secondary></span>
                            : <Secondary>{t('analyzer.connection.notConnected', 'Not connected')}</Secondary>}
                        </TableCell>
                        <TableCell>
                          {i.active ? <ServiceTag s={i.status} /> : <Tag size="sm" type="gray">{t('common.deactivated', 'Deactivated')}</Tag>}
                          {i.status === 'Restricted' && <Secondary>{t('analyzer.service.restrictedTests', `Locked: ${i.lockedTests.join(', ')}`)}</Secondary>}
                          {i.status === 'Out of service' && <Secondary>{i.reasons[0].text.split(' (')[0]}</Secondary>}
                        </TableCell>
                        <TableCell>
                          {i.nextDue && <span style={dueStyle(i.nextDue)}>{fmt(i.nextDue)}</span>}
                          <Secondary>{i.nextDueWhat}</Secondary>
                        </TableCell>
                        <TableCell>{i.location}</TableCell>
                        <TableCell>{i.labUnits.join(', ')}</TableCell>
                        <TableCell><Button kind="ghost" size="sm" onClick={() => onOpen(i.id)}>{t('common.edit', 'Edit')}</Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </Column>
    </Grid>
  );
}

function AddNotConnected({ onDone }) {
  return (
    <Tile style={{ marginBottom: '0.75rem' }}>
      <Stack gap={4}>
        <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>{t('analyzer.add.notConnected', 'Add a not-connected instrument')}</strong>
          <Secondary>{t('analyzer.add.connectedHint', 'For an analyzer that sends results, use Add connected analyzer (today’s flow, unchanged).')}</Secondary>
        </Stack>
        <Stack orientation="horizontal" gap={5} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <TextInput id="n-name" size="sm" labelText={t('common.nameRequired', 'Name (required)')} defaultValue="Balance B-03" style={{ width: 200 }} />
          <ComboBox onChange={() => {}} id="n-kind" size="sm" titleText={t('analyzer.field.kindRequired', 'Kind (required)')} items={KINDS}
            initialSelectedItem="Analytical balance" style={{ width: 220 }} />
          <TextInput id="n-make" size="sm" labelText={t('analyzer.field.makeModel', 'Manufacturer and model')} defaultValue="Mettler Toledo XPR205" style={{ width: 220 }} />
          <TextInput id="n-serial" size="sm" labelText={t('analyzer.field.serialNumber', 'Serial number')} defaultValue="B-2290117" style={{ width: 150 }} />
          <TextInput id="n-asset" size="sm" labelText={t('analyzer.field.assetTag', 'Asset tag')} defaultValue="ENV-0091" style={{ width: 120 }} />
          <ComboBox onChange={() => {}} id="n-room" size="sm" titleText={t('analyzer.field.location', 'Location (room)')}
            items={['Environmental lab, weighing room', 'Main lab, room 2', 'Molecular lab']} initialSelectedItem="Environmental lab, weighing room" style={{ width: 260 }} />
          <FilterableMultiSelect id="n-units" titleText={t('common.labUnits', 'Lab units')} items={['Environmental', 'Chemistry', 'Molecular'].map(x => ({ id: x, text: x }))}
            itemToString={i => (i ? i.text : '')} initialSelectedItems={[{ id: 'Environmental', text: 'Environmental' }]} />
          <FilterableMultiSelect id="n-used" titleText={t('analyzer.field.usedFor', 'Used for (tests)')} items={TESTS}
            itemToString={i => (i ? i.text : '')} initialSelectedItems={[TESTS[0]]} style={{ minWidth: 280 }} />
        </Stack>
        <Secondary>{t('analyzer.add.usedForHelp', 'Used for is what lets an out-of-service status or a test lock reach the right results. Add required checks on the Maintenance page after saving.')}</Secondary>
        <Stack orientation="horizontal" gap={3}>
          <Button size="sm" kind="primary" onClick={onDone}>{t('common.save', 'Save')}</Button>
          <Button size="sm" kind="ghost" onClick={onDone}>{t('common.cancel', 'Cancel')}</Button>
        </Stack>
      </Stack>
    </Tile>
  );
}

/* ================================================================ Maintenance page */

export function MaintenancePage({ initialScope = ['B2'] }) {
  const [scope, setScope] = useState(initialScope);
  const [logOpen, setLogOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const one = scope.length === 1 ? byId(scope[0]) : null;
  const active = INSTRUMENTS.filter(i => i.active);
  const scoped = scope.length ? active.filter(i => scope.includes(i.id)) : active;
  const events = EVENTS
    .filter(e => (!scope.length || scope.includes(e.instrument)) && (showArchived || !e.archived) && (!hasCertificate || e.certificate))
    .sort((a, b) => b.date.localeCompare(a.date));

  const headers = [
    ...(one ? [] : [{ key: 'instrument', header: t('label.analyzer.maintenance.column.analyzer', 'Instrument') }]),
    { key: 'date', header: t('label.analyzer.maintenance.column.date', 'Date') },
    { key: 'type', header: t('label.analyzer.maintenance.column.type', 'Type') },
    { key: 'outcome', header: t('label.analyzer.maintenance.column.outcome', 'Outcome') },
    { key: 'certificate', header: t('analyzer.maintenance.certificate', 'Certificate') },
    { key: 'validUntil', header: t('analyzer.maintenance.validUntilOrNextDue', 'Valid until / Next due') },
    { key: 'edit', header: '' },
  ];

  return (
    <Grid fullWidth>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('common.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/analyzers">{t('sidenav.analyzers', 'Instruments')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('breadcrumb.analyzers.maintenance', 'Maintenance')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 style={{ fontWeight: 400, margin: '0.5rem 0 1rem' }}>{t('label.analyzer.maintenance.title', 'Maintenance')}</h1>

        <Stack orientation="horizontal" gap={4} style={{ alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {/* FR-B1: filterable multi-select, selected names shown as chips (labels, not a count) */}
          <FilterableMultiSelect id="scope" titleText={t('label.analyzers.maintenance.scope.label', 'Filter by instrument')}
            placeholder={t('label.analyzers.maintenance.scope.allAnalyzers', 'All instruments')}
            items={active.map(i => ({ id: i.id, text: i.name }))} itemToString={i => (i ? i.text : '')}
            initialSelectedItems={active.filter(i => scope.includes(i.id)).map(i => ({ id: i.id, text: i.name }))}
            onChange={({ selectedItems }) => setScope(selectedItems.map(s => s.id))} style={{ minWidth: 320 }} />
          {/* labels, not a count (design-addendum convention) */}
          {scope.map(id => (
            <Tag key={id} type="blue" filter onClose={() => setScope(scope.filter(x => x !== id))}>{byId(id).name}</Tag>
          ))}
          <span style={{ flex: 1 }} />
          <Button size="sm" kind="primary" renderIcon={Add} onClick={() => setLogOpen(true)}>
            {t('label.analyzer.maintenance.button.logNew', 'Log new event')}
          </Button>
        </Stack>

        {one ? <StatusPanel key={one.id} instrument={one} /> : (
          <Tile style={{ marginBottom: '1rem' }}>
            <span>
              {t('label.analyzers.maintenance.summary.allAnalyzers', `${events.length} events shown`)} ·{' '}
              <span style={dueStyle('2000-01-01')}>{scoped.filter(i => i.nextDue && i.nextDue < TODAY).length} {t('label.analyzer.maintenance.summary.overdueShort', 'overdue')}</span> ·{' '}
              {scoped.filter(i => i.nextDue && i.nextDue >= TODAY && i.nextDue <= '2026-11-20').length} {t('label.analyzer.maintenance.summary.due30', 'due in the next 30 days')} ·{' '}
              <span style={dueStyle('2000-01-01')}>{t('analyzer.maintenance.summary.outOfService', `${scoped.filter(i => i.status === 'Out of service').length} instruments out of service`)}</span>
            </span>
          </Tile>
        )}

        <Stack orientation="horizontal" gap={5} style={{ alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <Toggle id="has-cert" size="sm" labelText={t('analyzer.maintenance.filter.hasCertificate', 'Has certificate')}
            toggled={hasCertificate} onToggle={v => setHasCertificate(v)} />
          <Toggle id="show-arch" size="sm" labelText={t('label.analyzer.maintenance.toolbar.showArchived', 'Show archived')}
            toggled={showArchived} onToggle={v => setShowArchived(v)} />
          <Secondary>{t('analyzer.maintenance.filter.more', 'Date range, type, outcome and vendor filters carry over from v1.0.')}</Secondary>
        </Stack>

        <DataTable size="sm" headers={headers} rows={events.map(e => ({ id: String(e.id) }))}>
          {({ rows, headers: hs, getHeaderProps, getTableProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
                <TableHead><TableRow>{hs.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow></TableHead>
                <TableBody>
                  {logOpen && (
                    <TableRow><TableCell colSpan={hs.length}><LogEventForm instrument={one} onDone={() => setLogOpen(false)} /></TableCell></TableRow>
                  )}
                  {rows.map(r => {
                    const e = EVENTS.find(x => String(x.id) === r.id);
                    return (
                      <React.Fragment key={r.id}>
                        <TableRow style={e.archived ? { color: 'var(--cds-text-disabled)' } : undefined}>
                          {!one && <TableCell><strong>{byId(e.instrument).name}</strong><Secondary>{byId(e.instrument).kind}</Secondary></TableCell>}
                          <TableCell>{fmt(e.date)}</TableCell>
                          <TableCell>{e.type}</TableCell>
                          <TableCell>
                            <OutcomeTag o={e.outcome} />
                            {e.archived && <Tag size="sm" type="gray">{t('label.analyzer.maintenance.tag.archivedShort', 'Archived')}</Tag>}
                          </TableCell>
                          <TableCell>
                            {e.certificate && (
                              <span>{e.certificate.number}{' '}
                                <Button kind="ghost" size="sm" hasIconOnly renderIcon={DocumentPdf}
                                  iconDescription={t('analyzer.maintenance.viewCertificate', 'View certificate PDF')} />
                              </span>
                            )}
                          </TableCell>
                          <TableCell><span style={e.outcome === 'Completed' ? dueStyle(e.validUntil) : {}}>{fmt(e.validUntil)}</span></TableCell>
                          <TableCell>
                            <Button kind="ghost" size="sm" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>{t('common.edit', 'Edit')}</Button>
                          </TableCell>
                        </TableRow>
                        {expanded === e.id && (
                          <TableRow>
                            <TableCell colSpan={hs.length}><EventDetail event={e} /></TableCell>
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
      </Column>
    </Grid>
  );
}

/* FR-D2 to FR-D4 and FR-C1 to FR-C3 */
function StatusPanel({ instrument }) {
  const [manualOut, setManualOut] = useState(instrument.reasons.some(r => r.kind === 'manual'));
  const [askNote, setAskNote] = useState(false);
  const [checks, setChecks] = useState(CHECKS[instrument.id] || []);
  const [adding, setAdding] = useState(false);
  const reasons = instrument.reasons.filter(r => r.kind !== 'manual' || manualOut);
  const status = !reasons.length ? 'In service' : reasons.some(r => r.kind !== 'locked') ? 'Out of service' : 'Restricted';
  const automatic = instrument.reasons.filter(r => r.kind !== 'manual' && r.kind !== 'locked');

  const reasonTag = kind => ({
    locked: [t('analyzer.service.reasonTag.locked', 'Test locked'), 'warm-gray'],
    manual: [t('analyzer.service.reasonTag.manual', 'Manual'), 'red'],
    cert: [t('analyzer.service.reasonTag.certificate', 'Certificate'), 'red'],
    progress: [t('analyzer.service.reasonTag.inProgress', 'In progress'), 'red'],
  }[kind]);

  return (
    <Stack style={{ marginBottom: '1rem', border: '1px solid var(--cds-border-subtle)' }}>
      <Tile>
        <Stack gap={3}>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 16 }}>{instrument.name}</strong>
            <Secondary>{instrument.kind} · {instrument.make} · S/N {instrument.serial} · {instrument.location}</Secondary>
            <span style={{ flex: 1 }} />
            <ServiceTag s={status} />
            {instrument.connection === 'Connected' && (
              <Tag size="sm" type="outline">{t('analyzer.connection.label', 'Connection')}: {instrument.connectionState}</Tag>)}
          </Stack>
          {!reasons.length && <Secondary>{t('analyzer.service.noReason', 'No reason stands. Results produced on this instrument are not held for instrument reasons.')}</Secondary>}
          {reasons.map((r, n) => {
            const [label, type] = reasonTag(r.kind);
            return (
              <Stack key={n} orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--cds-border-subtle-01)', paddingTop: 6 }}>
                <Tag size="sm" type={type}>{label}</Tag>
                <span style={{ fontSize: 13 }}>{r.text}</span>
                {r.run && <Button kind="ghost" size="sm" href={`/Results?run=${r.run}`}>{t('analyzer.service.openRun', 'Open run')}</Button>}
              </Stack>
            );
          })}
          {instrument.status === 'Restricted' && (
            <Secondary>{t('analyzer.service.lockHelp', 'A lock cannot be released by hand. It lifts when a control for the locked test passes on this instrument in a later run. Held results are dispositioned per result on their run.')}</Secondary>
          )}
          <Stack orientation="horizontal" gap={3}>
            {!manualOut && !askNote && (
              <Button size="sm" kind="danger--tertiary" onClick={() => setAskNote(true)}>{t('analyzer.service.takeOut', 'Take out of service')}</Button>
            )}
            {manualOut && (
              <Button size="sm" kind="tertiary" onClick={() => setManualOut(false)}>{t('analyzer.service.return', 'Return to service')}</Button>
            )}
            <Button size="sm" kind="ghost">{t('analyzer.edit', 'Edit instrument')}</Button>
          </Stack>
          {/* FR-D3: inline, with a required note kept in the existing note table */}
          {askNote && (
            <Stack gap={3}>
              <TextArea id="oos-note" rows={2}
                labelText={t('analyzer.service.takeOutNote', 'Why is it out of service? (required, kept as a note)')}
                helperText={t('analyzer.service.takeOutBody', 'Results produced on it from now on are held until it is returned to service.')} />
              <Stack orientation="horizontal" gap={3}>
                <Button size="sm" kind="danger" onClick={() => { setManualOut(true); setAskNote(false); }}>
                  {t('analyzer.service.takeOut', 'Take out of service')}</Button>
                <Button size="sm" kind="ghost" onClick={() => setAskNote(false)}>{t('common.cancel', 'Cancel')}</Button>
              </Stack>
            </Stack>
          )}
          {!manualOut && automatic.length > 0 && instrument.reasons.some(r => r.kind === 'manual') && (
            <InlineNotification kind="warning" lowContrast hideCloseButton
              title={t('analyzer.service.stillOut', 'Still out of service')}
              subtitle={automatic[0].text.split(' (')[0]} />
          )}
        </Stack>
      </Tile>


      <Tile>
        <Stack gap={3}>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>{t('analyzer.check.title', 'Required checks')}</strong>
            <Secondary>{t('analyzer.check.help', 'What this instrument must have, and whether being overdue takes it out of service.')}</Secondary>
            <span style={{ flex: 1 }} />
            <Button size="sm" kind="ghost" renderIcon={Add} onClick={() => setAdding(true)}>{t('analyzer.check.add', 'Add check')}</Button>
          </Stack>
          <DataTable size="sm" rows={checks.map(c => ({ id: c.id }))} headers={[
            { key: 'type', header: t('analyzer.check.eventType', 'Event type') },
            { key: 'dueBy', header: t('analyzer.check.dueBy', 'Due by') },
            { key: 'oos', header: t('analyzer.check.outOfServiceWhenOverdue', 'Out of service when overdue') },
            { key: 'verify', header: t('analyzer.check.verificationRequired', 'Verification required') },
            { key: 'next', header: t('label.analyzer.maintenance.column.nextDue', 'Next due') },
            { key: 'state', header: t('common.state', 'State') },
            { key: 'edit', header: '' },
          ]}>
            {({ rows, headers, getHeaderProps, getTableProps }) => (
              <TableContainer>
                <Table {...getTableProps()}>
                  <TableHead><TableRow>{headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow></TableHead>
                  <TableBody>
                    {adding && (
                      <TableRow><TableCell colSpan={7}>
                        <AddCheckForm onDone={c => { if (c) setChecks(cs => [...cs, c]); setAdding(false); }} />
                      </TableCell></TableRow>
                    )}
                    {!checks.length && !adding && (
                      <TableRow><TableCell colSpan={7}>
                        <Secondary>{t('analyzer.check.empty', 'No required checks yet. Without checks this instrument is never taken out of service automatically; failed controls can still lock a test.')}</Secondary>
                      </TableCell></TableRow>
                    )}
                    {rows.map(r => {
                      const c = checks.find(x => x.id === r.id);
                      return (
                        <TableRow key={c.id}>
                          <TableCell>{c.type}</TableCell>
                          <TableCell>{c.dueBy === 'certificate'
                            ? t('analyzer.check.certificateValidity', 'Certificate validity')
                            : t('analyzer.check.every', `Every ${c.every}`)}</TableCell>
                          <TableCell>{c.outOfService ? t('common.yes', 'Yes') : t('common.no', 'No')}</TableCell>
                          <TableCell>{c.verification ? t('common.yes', 'Yes') : t('common.no', 'No')}</TableCell>
                          <TableCell><span style={dueStyle(c.next)}>{fmt(c.next)}</span></TableCell>
                          <TableCell><CheckStateTag s={c.state} /></TableCell>
                          <TableCell><Button size="sm" kind="ghost">{t('common.edit', 'Edit')}</Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        </Stack>
      </Tile>
    </Stack>
  );
}

function AddCheckForm({ onDone }) {
  const [dueBy, setDueBy] = useState('interval');
  return (
    <Stack orientation="horizontal" gap={4} style={{ flexWrap: 'wrap', alignItems: 'flex-end', padding: '0.5rem 0' }}>
      <ComboBox onChange={() => {}} id="ck-type" size="sm" titleText={t('analyzer.check.eventType', 'Event type')} items={EVENT_TYPES} initialSelectedItem="Verification" style={{ width: 200 }} />
      <RadioButtonGroup legendText={t('analyzer.check.dueBy', 'Due by')} name="ck-dueby" valueSelected={dueBy} onChange={v => setDueBy(v)}>
        <RadioButton id="ck-int" value="interval" labelText={t('analyzer.check.interval', 'Interval')} />
        <RadioButton id="ck-cert" value="certificate" labelText={t('analyzer.check.certificateValidity', 'Certificate validity')} />
      </RadioButtonGroup>
      {dueBy === 'interval' && (
        <>
          <NumberInput id="ck-n" size="sm" min={1} value={3} label={t('analyzer.check.everyN', 'Every')} style={{ width: 100 }} />
          <Select id="ck-unit" size="sm" labelText={t('analyzer.check.unit', 'Unit')}>
            <SelectItem value="months" text={t('analyzer.check.months', 'months')} />
            <SelectItem value="days" text={t('analyzer.check.days', 'days')} />
          </Select>
        </>
      )}
      <Toggle id="ck-oos" size="sm" labelText={t('analyzer.check.outOfServiceWhenOverdue', 'Out of service when overdue')} />
      <Toggle id="ck-ver" size="sm" labelText={t('analyzer.check.verificationRequired', 'Verification required')} />
      <DatePicker datePickerType="single" dateFormat="Y-m-d">
        <DatePickerInput id="ck-first" size="sm" labelText={t('analyzer.check.firstDue', 'First due date (optional)')} placeholder="yyyy-mm-dd" />
      </DatePicker>
      <Button size="sm" kind="primary" onClick={() => onDone({ id: `n${Date.now()}`, type: 'Verification', dueBy, every: '3 months',
        outOfService: false, verification: false, state: 'Current', next: '2026-11-01' })}>{t('common.save', 'Save')}</Button>
      <Button size="sm" kind="ghost" onClick={() => onDone(null)}>{t('common.cancel', 'Cancel')}</Button>
    </Stack>
  );
}

/* FR-B3, FR-B4, FR-B6, FR-B8 */
function LogEventForm({ instrument, onDone }) {
  const [type, setType] = useState('Calibration');
  const [outcome, setOutcome] = useState('Completed');
  const [certNo, setCertNo] = useState('');
  const certificateBased = type === 'Calibration' && instrument
    && (CHECKS[instrument.id] || []).some(c => c.type === 'Calibration' && c.dueBy === 'certificate');
  const missingCert = certificateBased && outcome === 'Completed' && !certNo;
  return (
    <Stack gap={4} style={{ padding: '0.75rem 0' }}>
      <Stack orientation="horizontal" gap={4} style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <ComboBox onChange={() => {}} id="ev-inst" size="sm" titleText={t('label.analyzer.maintenance.form.analyzer', 'Instrument')}
          items={INSTRUMENTS.filter(i => i.active).map(i => i.name)} initialSelectedItem={instrument ? instrument.name : null} style={{ width: 220 }} />
        <Select id="ev-type" size="sm" labelText={t('label.analyzer.maintenance.form.eventType', 'Event type')} value={type} onChange={e => setType(e.target.value)}>
          {EVENT_TYPES.map(x => <SelectItem key={x} value={x} text={x} />)}
        </Select>
        <DatePicker datePickerType="single" dateFormat="Y-m-d">
          <DatePickerInput id="ev-date" size="sm" labelText={t('label.analyzer.maintenance.form.performedDate', 'Date performed')} placeholder="yyyy-mm-dd" />
        </DatePicker>
        <ComboBox onChange={() => {}} id="ev-who" size="sm" titleText={t('label.analyzer.maintenance.form.performedBy', 'Performed by')} items={USERS}
          itemToString={u => (u ? u.text : '')} style={{ width: 180 }} />
        <TextInput id="ev-vendor" size="sm" labelText={t('label.analyzer.maintenance.form.vendor', 'Vendor (leave empty if in-house)')}
          defaultValue="Kenya Bureau of Standards" style={{ width: 240 }} />
        <Select id="ev-outcome" size="sm" labelText={t('label.analyzer.maintenance.form.outcome', 'Outcome')} value={outcome} onChange={e => setOutcome(e.target.value)}>
          {['Completed', 'In progress', 'Failed', 'Needs follow-up'].map(x => <SelectItem key={x} value={x} text={x} />)}
        </Select>
        <DatePicker datePickerType="single" dateFormat="Y-m-d">
          <DatePickerInput id="ev-valid" size="sm" placeholder="yyyy-mm-dd"
            labelText={certificateBased ? t('analyzer.maintenance.validUntilRequired', 'Valid until (required)') : t('label.analyzer.maintenance.form.nextDueDate', 'Next due date')} />
        </DatePicker>
      </Stack>

      {certificateBased && (
        <Tile style={{ border: '1px solid var(--cds-border-subtle)' }}>
          <Stack orientation="horizontal" gap={5} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <TextInput id="ev-cert" size="sm" labelText={t('analyzer.maintenance.certificateNumber', 'Certificate number (required)')}
              value={certNo} onChange={e => setCertNo(e.target.value)} style={{ width: 220 }}
              invalid={missingCert} invalidText={t('validation.analyzer.maintenance.certificateRequired', 'A certificate-based check needs a certificate number and a valid-until date.')} />
            <TextInput id="ev-issuer" size="sm" labelText={t('analyzer.maintenance.issuedBy', 'Issued by')} defaultValue="Kenya Bureau of Standards" style={{ width: 240 }} />
            <FileUploader labelTitle={t('analyzer.maintenance.certificateFile', 'Certificate file')}
              labelDescription={t('analyzer.maintenance.certificateFileHelp', 'PDF only, up to 10 MB. Locked once the event is verified.')}
              buttonLabel={t('analyzer.maintenance.addFile', 'Add file')} buttonKind="tertiary" size="sm" filenameStatus="edit" accept={['.pdf']} />
          </Stack>
          <Secondary>{t('analyzer.maintenance.verifyNote', 'This satisfies the required check "Calibration" once a second person verifies it. Until then the check shows Awaiting verification and the instrument stays out of service.')}</Secondary>
        </Tile>
      )}

      <Stack orientation="horizontal" gap={4} style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <NumberInput id="ev-down" size="sm" min={0} step={0.5} value={1.5} label={t('label.analyzer.maintenance.form.downtime', 'Downtime (hours)')} style={{ width: 140 }} />
        <NumberInput id="ev-cost" size="sm" min={0} step={0.01} value={4800} label={t('label.analyzer.maintenance.form.cost', 'Cost')} style={{ width: 140 }} />
        <TextInput id="ev-parts" size="sm" labelText={t('label.analyzer.maintenance.form.partsReplaced', 'Parts replaced')} style={{ width: 200 }} />
        <TextInput id="ev-notes" size="sm" labelText={t('label.analyzer.maintenance.form.notes', 'Notes')} style={{ width: 360 }}
          defaultValue="Annual calibration, 5 points, as found and as left within tolerance." />
        <ComboBox onChange={() => {}} id="ev-verify" size="sm" titleText={t('label.analyzer.maintenance.form.verifiedBy', 'Verified by')} items={USERS}
          itemToString={u => (u ? u.text : '')} helperText={t('analyzer.maintenance.verifyHelp', 'Not the performer or the person logging')} style={{ width: 220 }} />
      </Stack>
      <Stack orientation="horizontal" gap={3}>
        <Button size="sm" kind="primary" disabled={missingCert} onClick={onDone}>{t('label.analyzer.maintenance.form.save', 'Save event')}</Button>
        <Button size="sm" kind="ghost" onClick={onDone}>{t('label.analyzer.maintenance.form.cancel', 'Cancel')}</Button>
      </Stack>
    </Stack>
  );
}

function EventDetail({ event: e }) {
  const kv = (k, v) => <div style={{ minWidth: 200 }}><Secondary>{k}</Secondary><div style={{ fontSize: 13 }}>{v}</div></div>;
  return (
    <Stack gap={3} style={{ padding: '0.75rem 0' }}>
      <Stack orientation="horizontal" gap={6} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {kv(t('label.analyzer.maintenance.form.performedBy', 'Performed by'), e.performedBy || e.vendor || t('label.analyzer.maintenance.vendor.inHouse', 'In-house'))}
        {e.certificate && kv(t('analyzer.maintenance.certificate', 'Certificate'),
          `${e.certificate.number}, ${t('analyzer.maintenance.issuedByLower', 'issued by')} ${e.certificate.issuer} (${e.certificate.file})`)}
        {kv(t('label.analyzer.maintenance.form.verifiedBy', 'Verified by'), e.verifiedBy || (
          <span>{t('label.analyzer.maintenance.notVerified', 'Not verified')}{' '}
            <Button size="sm" kind="ghost">{t('analyzer.maintenance.verify', 'Verify')}</Button></span>))}
        {kv(t('label.analyzer.maintenance.form.notes', 'Notes'), e.notes)}
      </Stack>
      <Stack orientation="horizontal" gap={3}>
        <Button size="sm" kind="tertiary">{t('analyzer.maintenance.editFields', 'Edit fields')}</Button>
        <Button size="sm" kind="ghost">{e.archived
          ? t('label.analyzer.maintenance.form.unarchive', 'Unarchive event')
          : t('label.analyzer.maintenance.form.archive', 'Archive event')}</Button>
      </Stack>
    </Stack>
  );
}

/* ================================================================ consumer: the result's instrument field */

export function InstrumentFieldOnResult() {
  const [pick, setPick] = useState('B2');
  const options = ['B1', 'B2'].map(byId);
  const chosen = byId(pick);
  return (
    <Grid fullWidth>
      <Column lg={16}>
        <ReuseBoundary
          title={t('mockup.reuse.resultPanel.title', 'Results Entry row panel, Method and Analyzer fields')}
          owner={t('mockup.reuse.resultPanel.owner', 'Owned by results-entry-multicomponent.md (OGC-811) and Results Entry v4 D4.')}
          adds={t('mockup.reuse.resultPanel.adds', 'the service status Tag on each instrument in the search, the inline will-be-held warning, and the required-instrument rule when the test asks for it (FR-F2, FR-F3).')}>
          <Stack orientation="horizontal" gap={6} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div><Secondary>{t('common.sample', 'Sample')}</Secondary><strong>24-01340</strong> · Total suspended solids</div>
            <div><Secondary>{t('common.method', 'Method')}</Secondary>Gravimetric (SM 2540 D)</div>
            <RadioButtonGroup legendText={t('analyzer.picker.labelRequired', 'Instrument (required for this test)')} name="inst-pick"
              valueSelected={pick} onChange={v => setPick(v)} orientation="vertical">
              {options.map(i => (
                <RadioButton key={i.id} id={`ip-${i.id}`} value={i.id}
                  labelText={<span>{i.name} <Secondary>{i.make}</Secondary> <ServiceTag s={i.status} /></span>} />
              ))}
            </RadioButtonGroup>
            <TextInput id="tss-val" size="sm" labelText={t('common.result', 'Result')} defaultValue="14" style={{ width: 120 }} helperText="mg/L" />
          </Stack>
          {chosen.status !== 'In service' && (
            <InlineNotification kind="warning" lowContrast hideCloseButton style={{ maxWidth: 'none' }}
              title={t('analyzer.picker.willBeHeld', `${chosen.name} is ${chosen.status.toLowerCase()}: this result will be held`)}
              subtitle={`${chosen.reasons[0].text}. ${t('analyzer.picker.willBeHeldBody', 'You can still save it; it waits on the run until the reason is cleared, or a user accepts it despite the hold with an NCE.')}`} />
          )}
        </ReuseBoundary>
      </Column>
    </Grid>
  );
}
