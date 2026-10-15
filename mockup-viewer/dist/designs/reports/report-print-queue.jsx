// Route: /ReportPrintQueue   (?type=patient|environmental|vector, ?labNo=)
// SideNav: Reports › Report Print Queue (after Patient Status Report)
// Breadcrumb: Home / Reports / Report Print Queue
// Redirect: /LaporanHasil → /ReportPrintQueue?type=environmental (tier Merge, D-066)
//
// Report Print Queue mockup, FRS v2.2 (r4): report-print-queue-frs.md
// Built on the shipped Compliance Report page (LaporanHasilReport.jsx). The certificate
// detail (CertificateDetail below) is the shipped OrderDetail/SignatureCard content, kept.
// Mock data is inline; the real page reads a server-side paged list (FRS FR-3.9) and loads
// row detail on expand (FR-5.1).

import React, { useMemo, useState } from 'react';
import {
  Breadcrumb, BreadcrumbItem, Button, Column, DataTable, FilterableMultiSelect, Grid, MultiSelect,
  InlineNotification, Pagination, Select, SelectItem, Stack, StructuredListBody,
  StructuredListCell, StructuredListRow, StructuredListWrapper, Table, TableBatchAction,
  TableBatchActions, TableBody, TableCell, TableContainer, TableExpandHeader, TableExpandRow,
  TableExpandedRow, TableHead, TableHeader, TableRow, TableSelectAll, TableSelectRow,
  TableToolbar, TableToolbarContent, Tag, TextArea, TextInput, Tile, DatePicker,
  DatePickerInput, DismissibleTag, Link,
} from '@carbon/react';
import { Printer, Download, Search, Renew } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------- constants

const REPORT_TYPES = ['patient', 'environmental', 'vector'];
const ROW_TYPES = [...REPORT_TYPES, 'export'];
const TYPE_LABEL = {
  patient: t('reportQueue.type.patient', 'Patient report'),
  environmental: t('reportQueue.type.environmental', 'Environmental'),
  vector: t('reportQueue.type.vector', 'Vector'),
  export: t('reportQueue.type.export', 'Data export'),
};
// FR-4.1: exactly one report state; Amended (magenta) wins and stays once reached
const STATE_TAG = {
  partial: { kind: 'warm-gray', label: t('reportQueue.state.partial', 'Partial {released}/{total}') },
  final: { kind: 'teal', label: t('reportQueue.state.final', 'Final') },
  amended: { kind: 'magenta', label: t('reportQueue.state.amended', 'Amended') },
};
// FR-4.2
const PRINT_TAG = {
  unprinted: { kind: 'purple', label: t('reportQueue.printStatus.unprinted', 'Unprinted') },
  printed: { kind: 'green', label: t('reportQueue.printStatus.printed', 'Printed') },
};
// FR-11.2: shipped Custom Data Export mapping (shared job-row component, reporting.* keys)
const JOB_TAG = {
  QUEUED: { kind: 'blue', label: t('reporting.state.QUEUED', 'Queued') },
  GENERATING: { kind: 'cyan', label: t('reporting.state.GENERATING', 'Generating') },
  READY: { kind: 'green', label: t('reporting.state.READY', 'Ready to download') },
  FAILED: { kind: 'red', label: t('reporting.state.FAILED', 'Failed') },
  EXPIRED: { kind: 'gray', label: t('reporting.state.EXPIRED', 'Expired') },
  CANCELLED: { kind: 'gray', label: t('reporting.state.CANCELLED', 'Cancelled') },
};
const isExport = (r) => r.type === 'export';
// r.status in the mock is the print status plus a pending amendment flag ('amended' = unprinted, amended next)
const printOf = (r) => (r.status === 'printed' ? 'printed' : 'unprinted');
const stateOf = (r) => ((r.status === 'amended' || r.versions.some((v) => v.amended)) ? 'amended' : (r.releasedCount < r.total ? 'partial' : 'final'));
// FR-1.7: shipped LaporanHasil mapping + glyphs, plus Not evaluated (FR-6.11)
const COMPLIANCE_TAG = {
  COMPLIANT: { kind: 'green', label: `✓ ${t('laporanHasil.status.compliant', 'Compliant')}` },
  BORDERLINE: { kind: 'warm-gray', label: `⚑ ${t('laporanHasil.status.borderline', 'Borderline')}` },
  NON_COMPLIANT: { kind: 'red', label: `✗ ${t('laporanHasil.status.nonCompliant', 'Non-Compliant')}` },
  NOT_EVALUATED: { kind: 'gray', label: `– ${t('reportQueue.compliance.notEvaluated', 'Not evaluated')}` },
};
const WINDOWS = [
  { id: '1', text: t('reportQueue.filter.window.24h', 'Last 24 hours') },
  { id: '7', text: t('reportQueue.filter.window.7d', 'Last 7 days') },
  { id: '30', text: t('reportQueue.filter.window.30d', 'Last 30 days') },
  { id: 'all', text: t('reportQueue.filter.window.all', 'All time') },
  { id: 'custom', text: t('reportQueue.filter.window.custom', 'Custom range') },
];
const BATCH_LIMIT = 100; // FR-6.7
const CAN_REISSUE_ROLES = ['Results', 'Validation', 'Admin']; // §8

// ---------------------------------------------------------------- mock data (one lab)

const NOW = new Date('2026-09-29T15:10:00');
const at = (days, h, m = 0) => { const d = new Date(NOW); d.setDate(d.getDate() - days); d.setHours(h, m); return d; };
const fmt = (d) => (d ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–');

const FACILITIES = [
  { id: 'f1', text: 'RSUD Dr. Pirngadi', wards: ['Penyakit Dalam', 'Anak', 'IGD'] },
  { id: 'f2', text: 'Puskesmas Medan Johor', wards: ['Poli Umum'] },
  { id: 'f3', text: 'RS Haji Medan', wards: ['ICU', 'Bedah'] },
];
const REQUESTERS = ['dr. Andi Lubis', 'dr. Fitri Nasution', 'dr. Rudi Tarigan'].map((text, i) => ({ id: `q${i}`, text }));
const SITES = ['Sungai Deli, Titik 4', 'PDAM Tirtanadi, Intake Hamparan Perak', 'Depot Air Isi Ulang Sejahtera'].map((text, i) => ({ id: `s${i}`, text }));
const STANDARDS = ['PP 22/2021', 'Permenkes 2/2023', 'Permenkes 1096/2011'].map((text, i) => ({ id: `std${i}`, text }));

const MOCK = [
  {
    id: 'r1', type: 'patient', labNo: '26-004812', subject: 'Siti Rahmawati', subjectCode: 'PID 1207-5541',
    requester: 'dr. Andi Lubis', facility: 'RSUD Dr. Pirngadi', ward: 'Penyakit Dalam',
    released: at(0, 14, 30), releasedCount: 9, total: 9, critical: false,
    status: 'unprinted', nextSummary: 'Added: Ureum, Kreatinin, Asam urat', nextAmended: false,
    versions: [{ v: 1, issuedAt: at(0, 9, 12), by: 'Rina', change: null, completeness: '6/9', amended: false, sha256: '5353f2cea3f9a4…', reprints: [] }],
    tests: [
      { name: 'Hemoglobin', value: '12.8 g/dL', flag: '', releasedAt: at(0, 8, 50), by: 'Budi S.' },
      { name: 'Glucose (fasting)', value: '142 mg/dL', flag: 'H', releasedAt: at(0, 9, 5), by: 'Budi S.' },
      { name: 'Ureum', value: '38 mg/dL', flag: '', releasedAt: at(0, 14, 30), by: 'dr. Maya H.' },
    ],
    collected: at(0, 7, 40), received: at(0, 8, 5),
  },
  {
    id: 'r2', type: 'patient', labNo: '26-004790', subject: 'Ahmad Siregar', subjectCode: 'PID 1207-5519',
    requester: 'dr. Fitri Nasution', facility: 'RS Haji Medan', ward: 'ICU',
    released: at(0, 13, 55), releasedCount: 6, total: 6, critical: true,
    status: 'amended', nextSummary: 'Kalium 6.8 → 4.2 mmol/L. Note: hemolysed sample, repeated on fresh draw', nextAmended: true,
    versions: [{ v: 1, issuedAt: at(0, 11, 20), by: 'Rina', change: null, completeness: '6/6', amended: false, sha256: '8c01d7ab22f0e1…', reprints: [] }],
    tests: [
      { name: 'Kalium', value: '4.2 mmol/L', flag: '', releasedAt: at(0, 13, 55), by: 'dr. Maya H.' },
      { name: 'Kreatinin', value: '2.9 mg/dL', flag: 'HH', releasedAt: at(0, 11, 0), by: 'dr. Maya H.' },
    ],
    collected: at(0, 9, 10), received: at(0, 9, 30),
  },
  {
    id: 'r3', type: 'patient', labNo: '26-004410', subject: 'Maria Sitompul', subjectCode: 'PID 1207-5102',
    requester: 'dr. Rudi Tarigan', facility: 'Puskesmas Medan Johor', ward: 'Poli Umum',
    released: at(48, 15), releasedCount: 2, total: 2, critical: false, status: 'unprinted', nextSummary: null, nextAmended: false,
    versions: [], tests: [{ name: 'HBsAg (rapid)', value: 'Non-reactive', flag: '', releasedAt: at(48, 15), by: 'Budi S.' }],
    collected: at(48, 9), received: at(48, 10),
  },
  {
    id: 'e1', type: 'environmental', labNo: 'ENV-26-0088', subject: 'Sungai Deli, Titik 4', subjectCode: 'SITE-042',
    standard: 'PP 22/2021', compliance: 'NON_COMPLIANT', released: at(0, 10, 45), releasedCount: 6, total: 6,
    status: 'unprinted', nextSummary: null, nextAmended: false, amendedCount: 0, versions: [],
    site: { gps: '3.5952, 98.6722', collected: at(2, 7, 30), method: 'Grab sample, surface', ppNo: 'PP 22/2021', waterTemp: '28.4 °C', ambientTemp: '31 °C', weather: 'Cloudy', preservation: 'Cooled 4 °C' },
    parameters: [
      { name: 'TSS', result: '84 mg/L', threshold: '≤ 50 mg/L', status: 'NON_COMPLIANT' },
      { name: 'BOD5', result: '6.8 mg/L', threshold: '≤ 3 mg/L', status: 'NON_COMPLIANT' },
      { name: 'pH', result: '7.2', threshold: '6 to 9', status: 'COMPLIANT' },
    ],
    signatures: { analyst: { name: 'Rizky Pratama, S.Si', at: at(0, 9, 30) }, manager: { name: 'Dr. Hendra Wijaya, M.Kes', at: at(0, 10, 45) } },
  },
  {
    id: 'e2', type: 'environmental', labNo: 'ENV-26-0091', subject: 'Depot Air Isi Ulang Sejahtera', subjectCode: 'SITE-117',
    standard: null, compliance: 'NOT_EVALUATED', released: at(0, 11, 20), releasedCount: 4, total: 4,
    status: 'unprinted', nextSummary: null, nextAmended: false, amendedCount: 0, versions: [],
    site: { gps: '3.5611, 98.6934', collected: at(1, 9), method: 'Tap sample, sterile bottle', ppNo: null, waterTemp: '26.1 °C', ambientTemp: '30 °C', weather: 'Sunny', preservation: 'Cooled 4 °C' },
    parameters: [{ name: 'pH', result: '6.9' }, { name: 'Turbidity', result: '0.8 NTU' }, { name: 'E. coli', result: '0 MPN/100 mL' }],
    signatures: { analyst: { name: 'Putri Anggraini, S.Si', at: at(0, 10, 10) }, manager: { name: 'Dr. Hendra Wijaya, M.Kes', at: at(0, 11, 20) } },
  },
  {
    id: 'e3', type: 'environmental', labNo: 'ENV-26-0095', subject: 'RM Padang Sederhana', subjectCode: 'SITE-133',
    standard: 'Permenkes 1096/2011', compliance: 'COMPLIANT', released: at(0, 9, 50), releasedCount: 2, total: 5,
    status: 'unprinted', nextSummary: null, nextAmended: false, amendedCount: 0, versions: [],
    site: { gps: '3.5898, 98.6780', collected: at(1, 11, 30), method: 'Surface swab', ppNo: 'Permenkes 1096/2011', waterTemp: '–', ambientTemp: '30 °C', weather: 'Indoor', preservation: 'Cooled 4 °C' },
    parameters: [
      { name: 'Angka kuman', result: '48 CFU/cm²', threshold: '≤ 100 CFU/cm²', status: 'COMPLIANT' },
      { name: 'Salmonella', result: t('common.pending', 'Pending'), threshold: 'Negative', status: null },
    ],
    signatures: { analyst: { name: 'Putri Anggraini, S.Si', at: at(0, 9, 10) }, manager: { name: 'Dr. Hendra Wijaya, M.Kes', at: at(0, 9, 50) } },
  },
  {
    id: 'e4', type: 'environmental', labNo: 'ENV-26-0071', subject: 'PDAM Tirtanadi, Intake Hamparan Perak', subjectCode: 'SITE-009',
    standard: 'Permenkes 2/2023', compliance: 'COMPLIANT', released: at(3, 14), releasedCount: 8, total: 8,
    status: 'printed', nextSummary: null, nextAmended: false, amendedCount: 1,
    versions: [
      { v: 1, issuedAt: at(3, 15, 10), by: 'Sari', change: null, completeness: '8/8', amended: false, sha256: 'a41c9e0b7d33f2…', reprints: [] },
      { v: 2, issuedAt: at(2, 9, 30), by: 'Dr. Hendra Wijaya', change: 'Collection date entered as 25/09, sample was collected 24/09', completeness: '8/8', amended: true, reissue: true, sha256: '0f9be2d45c18aa…', reprints: [{ at: at(1, 8, 15), by: 'Sari' }] },
    ],
    site: { gps: '3.7412, 98.6901', collected: at(5, 6, 45), method: 'Composite, 3 points', ppNo: 'Permenkes 2/2023', waterTemp: '27.0 °C', ambientTemp: '29 °C', weather: 'Light rain', preservation: 'Cooled 4 °C' },
    parameters: [{ name: 'pH', result: '7.4', threshold: '6.5 to 8.5', status: 'COMPLIANT' }, { name: 'E. coli', result: '0 CFU/100 mL', threshold: '0', status: 'COMPLIANT' }],
    signatures: { analyst: { name: 'Rizky Pratama, S.Si', at: at(3, 11) }, manager: { name: 'Dr. Hendra Wijaya, M.Kes', at: at(3, 14) } },
  },
];

// ---------------------------------------------------------------- data export jobs (the current user's own)

const EXPORTS = [
  { id: 'x1', type: 'export', labNo: 'TAT Q3, all sections', subject: 'Sample & Testing', layout: 'SPREADSHEET', dateRange: '2026-07-01 – 2026-09-28', released: at(0, 9, 2), job: 'GENERATING', rowsSize: '~38,000 rows', variables: ['Lab number', 'Lab unit', 'Test', 'Received', 'Released', 'Turnaround (h)'], expiresAt: null, failure: null },
  { id: 'x2', type: 'export', labNo: 'Malaria positives, September', subject: 'Sample & Testing', layout: 'SPREADSHEET', dateRange: '2026-09-01 – 2026-09-28', released: at(1, 16, 40), job: 'READY', rowsSize: '4,312 rows · 847 KB', variables: ['Lab number', 'Collected', 'Facility', 'Test', 'Result'], expiresAt: at(-13, 16, 40), failure: null },
  { id: 'x3', type: 'export', labNo: 'Referrals to BBLK, Q3', subject: 'Referrals', layout: 'SPREADSHEET', dateRange: '2026-07-01 – 2026-09-28', released: at(2, 11, 15), job: 'FAILED', rowsSize: '–', variables: ['Lab number', 'Referred to', 'Sent', 'Result returned'], expiresAt: null, failure: 'Interrupted by system restart' },
];

// Shared job-row pieces, moved out of ReportingView.jsx (Dependency D9) so Custom Data Export and
// this page render one implementation; the reporting.* keys travel with them.
function ExportJobAction({ job, onAction }) {
  const action = {
    READY: { kind: 'primary', icon: Download, label: t('reporting.download', 'Download CSV') },
    QUEUED: { kind: 'tertiary', label: t('common.cancel', 'Cancel') }, // shipped confirmation modal follows
    FAILED: { kind: 'primary', icon: Renew, label: t('common.retry', 'Retry') },
    EXPIRED: { kind: 'primary', label: t('reporting.design.jobAction.EXPIRED', 'Re-run') },
  }[job.job];
  if (!action) return null; // GENERATING, CANCELLED: no action (FR-11.3)
  return <Button kind={action.kind} size="sm" renderIcon={action.icon} onClick={() => onAction(job)}>{action.label}</Button>;
}

function ExportJobDetails({ job }) {
  return (
    <Stack gap={3}>
      <p>{job.layout === 'TABLE' ? t('reporting.layout.TABLE', 'Table') : t('reporting.layout.SPREADSHEET', 'Spreadsheet')} · {job.dateRange}</p>
      <ol>{job.variables.map((v) => <li key={v}>{v}</li>)}</ol>
      {job.expiresAt && <p>{t('reporting.design.expires', 'Expires {date}').replace('{date}', fmt(job.expiresAt))}</p>}
      {job.failure && <InlineNotification kind="error" lowContrast hideCloseButton title={job.failure} />}
    </Stack>
  );
}

// ---------------------------------------------------------------- small pieces

function StateTags({ row }) {
  const st = stateOf(row);
  const partialCount = row.releasedCount < row.total;
  const label = st === 'partial'
    ? STATE_TAG.partial.label.replace('{released}', row.releasedCount).replace('{total}', row.total)
    : st === 'amended' && partialCount
      ? t('reportQueue.state.amendedPartial', 'Amended {released}/{total}').replace('{released}', row.releasedCount).replace('{total}', row.total)
      : STATE_TAG[st].label;
  return (
    <>
      <Tag type={STATE_TAG[st].kind} size="sm">{label}</Tag>
      {row.critical && <Tag type="red" size="sm">{t('common.critical', 'Critical')}</Tag>}
    </>
  );
}

function PrintStatusTag({ row }) {
  const p = PRINT_TAG[printOf(row)];
  return <Tag type={p.kind} size="sm">{p.label}</Tag>;
}

function DetailsCell({ row }) {
  if (row.type === 'patient') {
    return <>{row.requester}<div className="cds--label">{row.facility} · {row.ward}</div></>;
  }
  const c = COMPLIANCE_TAG[row.compliance];
  const partial = row.releasedCount < row.total && row.compliance !== 'NOT_EVALUATED';
  return (
    <>
      {row.standard || <span className="cds--label">{t('reportQueue.compliance.notEvaluated.long', 'Not evaluated against a standard')}</span>}
      <div>
        <Tag type={c.kind} size="sm">
          {partial ? t('reportQueue.compliance.provisional', 'Provisional: {status}').replace('{status}', c.label) : c.label}
        </Tag>
      </div>
    </>
  );
}

function VersionCell({ row }) {
  if (!row.versions.length) return <span className="cds--label">{t('reportQueue.version.none', 'Not printed')}</span>;
  const last = row.versions[row.versions.length - 1];
  return (
    <>
      {t('reportQueue.version.value', 'v{n}').replace('{n}', last.v)}
      {row.type !== 'patient' && row.amendedCount > 0 && <div className="cds--label">{row.labNo}/Am.{row.amendedCount}</div>}
    </>
  );
}

// FR-5.4
function VersionHistory({ row }) {
  if (!row.versions.length) return <p>{t('reportQueue.history.none', 'Nothing printed yet')}</p>;
  const headers = [
    { key: 'v', header: t('reportQueue.col.version', 'Version') },
    { key: 'issuedAt', header: t('reportQueue.history.issued', 'Issued') },
    { key: 'by', header: t('reportQueue.history.by', 'By') },
    { key: 'change', header: t('reportQueue.history.change', 'Change') },
    { key: 'completeness', header: t('reportQueue.history.completeness', 'Completeness') },
    { key: 'sha256', header: t('reportQueue.history.fingerprint', 'Fingerprint') },
    { key: 'pdf', header: '' },
  ];
  return (
    <DataTable rows={row.versions.map((v) => ({ ...v, id: String(v.v) }))} headers={headers} size="sm">
      {({ rows, headers: hs, getTableProps, getHeaderProps }) => (
        <TableContainer>
          <Table {...getTableProps()}>
            <TableHead><TableRow>{hs.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}</TableRow></TableHead>
            <TableBody>
              {rows.map((r) => {
                const v = row.versions.find((x) => String(x.v) === r.id);
                return (
                  <React.Fragment key={r.id}>
                    <TableRow>
                      <TableCell>v{v.v} {v.amended && <Tag type="magenta" size="sm">{STATE_TAG.amended.label}</Tag>}</TableCell>
                      <TableCell>{fmt(v.issuedAt)}</TableCell>
                      <TableCell>{v.by}</TableCell>
                      <TableCell>{v.change || t('reportQueue.history.firstIssue', 'First issue')}</TableCell>
                      <TableCell>{v.completeness}</TableCell>
                      <TableCell title={v.sha256}><code>{v.notArchived ? '–' : v.sha256.slice(0, 12)}</code></TableCell>
                      <TableCell>
                        {v.notArchived
                          ? t('reportQueue.history.notArchived', 'Not archived (issued before {date})')
                          : <Link href="#" onClick={(e) => e.preventDefault()}>{t('reportQueue.history.openPdf', 'Open PDF')}</Link>}
                      </TableCell>
                    </TableRow>
                    {v.reprints.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell />
                        <TableCell colSpan={6}>
                          {t('reportQueue.history.reprinted', 'Reprinted {date} by {user}').replace('{date}', fmt(p.at)).replace('{user}', p.by)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

// FR-7: inline, no modal (D-005)
function ReissueWithCorrection({ row, userRole, onReissue }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const allowed = CAN_REISSUE_ROLES.includes(userRole);
  if (row.status !== 'printed') return null; // FR-7.5
  if (!open) {
    return (
      <Button kind="tertiary" size="sm" disabled={!allowed} onClick={() => setOpen(true)}
        title={allowed ? undefined : t('reportQueue.reissue.disabled', 'Only Results, Validation or Admin users can reissue a report.')}>
        {t('reportQueue.reissue.button', 'Reissue with correction')}
      </Button>
    );
  }
  const invalid = touched && !reason.trim();
  return (
    <Tile>
      <Stack gap={5}>
        <TextArea
          id={`reissue-${row.id}`}
          labelText={t('reportQueue.reissue.reason.label', 'What was corrected')}
          helperText={t('reportQueue.reissue.reason.helper', 'This prints on the report as the reason for the correction. Required for ISO 15189 7.4.1.6 and ISO/IEC 17025 7.8.8.')}
          placeholder={t('reportQueue.reissue.reason.placeholder', 'e.g. Collection date was entered as 12/09; the sample was collected 11/09')}
          invalid={invalid}
          invalidText={t('reportQueue.reissue.reason.required', 'Enter what was corrected')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <Stack orientation="horizontal" gap={3}>
          <Button kind="primary" size="sm" renderIcon={Printer}
            onClick={() => { setTouched(true); if (reason.trim()) { onReissue(row, reason.trim()); setOpen(false); setReason(''); setTouched(false); } }}>
            {t('reportQueue.reissue.submit', 'Reissue and print')}
          </Button>
          <Button kind="ghost" size="sm" onClick={() => { setOpen(false); setReason(''); setTouched(false); }}>{t('common.cancel', 'Cancel')}</Button>
        </Stack>
      </Stack>
    </Tile>
  );
}

// FR-5.2
function PatientDetail({ row }) {
  return (
    <Grid narrow>
      <Column lg={10} md={8} sm={4}>
        <h5>{t('reportQueue.detail.tests', 'Tests')} ({row.releasedCount}/{row.total})</h5>
        <StructuredListWrapper isCondensed>
          <StructuredListBody>
            {row.tests.map((test) => (
              <StructuredListRow key={test.name}>
                <StructuredListCell>{test.name}</StructuredListCell>
                <StructuredListCell>{test.value}</StructuredListCell>
                <StructuredListCell>{test.flag && <Tag type={test.flag.length === 2 ? 'red' : 'gray'} size="sm">{test.flag}</Tag>}</StructuredListCell>
                <StructuredListCell>{fmt(test.releasedAt)}</StructuredListCell>
                <StructuredListCell>{t('reportQueue.detail.validatedBy', 'Validated by')}: {test.by}</StructuredListCell>
              </StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      </Column>
      <Column lg={6} md={8} sm={4}>
        <h5>{t('reportQueue.detail.order', 'Order')}</h5>
        <StructuredListWrapper isCondensed>
          <StructuredListBody>
            {[
              [t('reportQueue.filter.facility', 'Facility'), row.facility],
              [t('reportQueue.filter.ward', 'Ward / Dept / Unit'), row.ward],
              [t('common.requester', 'Requester'), row.requester],
              [t('common.collected', 'Collected'), fmt(row.collected)],
              [t('common.received', 'Received'), fmt(row.received)],
            ].map(([k, v]) => (
              <StructuredListRow key={k}><StructuredListCell noWrap>{k}</StructuredListCell><StructuredListCell>{v}</StructuredListCell></StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      </Column>
    </Grid>
  );
}

// FR-5.3: shipped OrderDetail content, plus the no-standard results table (FR-6.11)
function CertificateDetail({ row }) {
  const noStandard = !row.standard;
  return (
    <Grid narrow>
      <Column lg={5} md={4} sm={4}>
        <h5>{t('laporanHasil.detail.siteInfo', 'Site Information')}</h5>
        <StructuredListWrapper isCondensed>
          <StructuredListBody>
            {[
              ['laporanHasil.detail.site', 'Site', `${row.subject} (${row.subjectCode})`],
              ['laporanHasil.detail.gps', 'GPS', row.site.gps],
              ['laporanHasil.detail.collectionDateTime', 'Collection Date/Time', fmt(row.site.collected)],
              ['laporanHasil.detail.collectionMethod', 'Collection Method', row.site.method],
              ['laporanHasil.detail.ppNo', 'PP No.', row.site.ppNo || t('reportQueue.compliance.notEvaluated.long', 'Not evaluated against a standard')],
            ].map(([k, f, v]) => (
              <StructuredListRow key={k}><StructuredListCell noWrap>{t(k, f)}</StructuredListCell><StructuredListCell>{v || '–'}</StructuredListCell></StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      </Column>
      <Column lg={4} md={4} sm={4}>
        <h5>{t('laporanHasil.detail.conditions', 'Collection Conditions')}</h5>
        <StructuredListWrapper isCondensed>
          <StructuredListBody>
            {[
              ['laporanHasil.detail.waterTemp', 'Water Temp', row.site.waterTemp],
              ['laporanHasil.detail.ambientTemp', 'Ambient Temp', row.site.ambientTemp],
              ['laporanHasil.detail.weather', 'Weather', row.site.weather],
              ['laporanHasil.detail.preservation', 'Preservation', row.site.preservation],
            ].map(([k, f, v]) => (
              <StructuredListRow key={k}><StructuredListCell noWrap>{t(k, f)}</StructuredListCell><StructuredListCell>{v || '–'}</StructuredListCell></StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      </Column>
      <Column lg={7} md={8} sm={4}>
        <h5>{t('laporanHasil.detail.complianceSummary', 'Compliance Summary')}</h5>
        <StructuredListWrapper isCondensed>
          <StructuredListBody>
            {row.parameters.map((p) => (
              <StructuredListRow key={p.name}>
                <StructuredListCell>{p.name}</StructuredListCell>
                <StructuredListCell>{p.result}</StructuredListCell>
                {!noStandard && <StructuredListCell>{p.threshold}</StructuredListCell>}
                {!noStandard && (
                  <StructuredListCell>
                    {p.status ? <Tag type={COMPLIANCE_TAG[p.status].kind} size="sm">{COMPLIANCE_TAG[p.status].label}</Tag> : t('common.pending', 'Pending')}
                  </StructuredListCell>
                )}
              </StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      </Column>
      <Column lg={8} md={4} sm={4}>
        <Tile>
          <strong>{t('laporanHasil.detail.labAnalyst', 'Lab Analyst')}</strong>
          <p>{row.signatures.analyst.name}</p><p className="cds--label">{fmt(row.signatures.analyst.at)}</p>
        </Tile>
      </Column>
      <Column lg={8} md={4} sm={4}>
        <Tile>
          <strong>{t('laporanHasil.detail.labManager', 'Lab Manager')}</strong>
          <p>{row.signatures.manager.name}</p><p className="cds--label">{fmt(row.signatures.manager.at)}</p>
        </Tile>
      </Column>
    </Grid>
  );
}

// ---------------------------------------------------------------- page

export default function ReportPrintQueue({ userDomains = REPORT_TYPES, userRole = 'Validation', canExport = true }) {
  const [rows, setRows] = useState([...MOCK, ...(canExport ? EXPORTS : [])]);
  const [type, setType] = useState('all');
  const [states, setStates] = useState([]); // FR-3.7: report states, or job states when Type = Data export
  const [printStatus, setPrintStatus] = useState('all'); // FR-3.7a
  const [windowId, setWindowId] = useState('7'); // persisted per user server-side (FR-10.5)
  const [labNo, setLabNo] = useState('');
  const [labTo, setLabTo] = useState('');
  const [range, setRange] = useState(false);
  const [lookup, setLookup] = useState(null); // targeted lookup (FR-3.3)
  const [facilities, setFacilities] = useState([]);
  const [wards, setWards] = useState([]);
  const [requesters, setRequesters] = useState([]);
  const [sites, setSites] = useState([]);
  const [standards, setStandards] = useState([]);
  const [compliance, setCompliance] = useState('all');
  const [notice, setNotice] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const inScope = [...REPORT_TYPES.filter((ty) => userDomains.includes(ty)), ...(canExport ? ['export'] : [])]; // §8, BR-9
  const effectiveType = inScope.length === 1 ? inScope[0] : type;
  const targeted = !!lookup;

  // Real page: GET list with these params, server-side filter/sort/page (FR-3.9)
  const visible = useMemo(() => rows.filter((r) => {
    if (!inScope.includes(r.type)) return false;
    if (lookup) return !isExport(r) && (lookup.to ? r.labNo >= lookup.from && r.labNo <= lookup.to : r.labNo === lookup.from);
    if (effectiveType !== 'all' && r.type !== effectiveType) return false;
    const outsideWindow = windowId !== 'all' && windowId !== 'custom' && (NOW - r.released) / 864e5 > Number(windowId);
    if (isExport(r)) {
      if (effectiveType === 'export') { if (states.length && !states.some((s) => s.id === r.job)) return false; }
      else if (states.length || printStatus !== 'all') return false; // FR-3.7 / FR-3.7a
      return ['QUEUED', 'GENERATING'].includes(r.job) || !outsideWindow; // FR-3.8
    }
    if (states.length && !states.some((s) => s.id === stateOf(r))) return false;
    if (printStatus !== 'all' && printOf(r) !== printStatus) return false;
    // FR-3.8: the window applies to printed rows only
    if (printOf(r) === 'printed' && outsideWindow) return false;
    if (effectiveType === 'patient') {
      if (facilities.length && !facilities.some((f) => f.text === r.facility)) return false;
      if (wards.length && !wards.some((w) => w.text === r.ward)) return false;
      if (requesters.length && !requesters.some((q) => q.text === r.requester)) return false;
    }
    if (effectiveType === 'environmental' || effectiveType === 'vector') {
      if (sites.length && !sites.some((s) => s.text === r.subject)) return false;
      if (standards.length && !standards.some((s) => s.text === r.standard)) return false;
      if (compliance !== 'all' && r.compliance !== compliance) return false;
    }
    return true;
  }).sort((a, b) => b.released - a.released), [rows, inScope, lookup, effectiveType, states, printStatus, windowId, facilities, wards, requesters, sites, standards, compliance]);

  const scoped = rows.filter((r) => inScope.includes(r.type) && !isExport(r) && (effectiveType === 'all' || r.type === effectiveType));
  const toPrint = scoped.filter((r) => printOf(r) === 'unprinted').length;
  const amendedToPrint = scoped.filter((r) => printOf(r) === 'unprinted' && stateOf(r) === 'amended').length;
  const exportsReady = rows.filter((r) => isExport(r) && r.job === 'READY').length;
  const stateOptions = effectiveType === 'export'
    ? Object.entries(JOB_TAG).map(([id, v]) => ({ id, text: v.label }))
    : [{ id: 'partial', text: t('reportQueue.state.partialName', 'Partial') }, { id: 'final', text: STATE_TAG.final.label }, { id: 'amended', text: STATE_TAG.amended.label }];
  // FR-11.3: the shipped actions, calling the shipped /rest/reports/data-export/jobs endpoints
  const exportAction = (job) => setNotice(`${job.labNo}: ${job.job}`);

  const wardOptions = facilities.flatMap((f) => (FACILITIES.find((x) => x.id === f.id)?.wards || []).map((w) => ({ id: `${f.id}-${w}`, text: w })));

  // FR-6.2 / FR-6.3: new version when content changed, else reprint of the archived bytes
  const print = (ids, mode = 'print') => {
    setRows((prev) => prev.map((r) => {
      if (!ids.includes(r.id)) return r;
      if (r.status === 'printed') {
        const versions = [...r.versions];
        const last = { ...versions[versions.length - 1] };
        last.reprints = [...last.reprints, { at: NOW, by: 'You' }];
        versions[versions.length - 1] = last;
        return { ...r, versions };
      }
      const v = r.versions.length + 1;
      return {
        ...r, status: 'printed', amendedCount: (r.amendedCount || 0) + (r.nextAmended ? 1 : 0),
        versions: [...r.versions, { v, issuedAt: NOW, by: 'You', change: v === 1 ? null : r.nextSummary, completeness: `${r.releasedCount}/${r.total}`, amended: r.nextAmended, sha256: 'new-hash-000000', reprints: [] }],
      };
    }));
    setNotice(mode === 'zip'
      ? t('reportQueue.print.success', '{count} reports ready').replace('{count}', ids.length) + ' (reports_2026-09-29.zip)'
      : t('reportQueue.print.success', '{count} reports ready').replace('{count}', ids.length));
  };

  const reissue = (row, reason) => {
    setRows((prev) => prev.map((r) => (r.id !== row.id ? r : {
      ...r, amendedCount: (r.amendedCount || 0) + 1,
      versions: [...r.versions, { v: r.versions.length + 1, issuedAt: NOW, by: 'You', change: reason, completeness: `${r.releasedCount}/${r.total}`, amended: true, reissue: true, sha256: 'new-hash-000000', reprints: [] }],
    })));
  };

  const applyLookup = () => {
    if (!labNo.trim()) return;
    setLookup({ from: labNo.trim(), to: range && labTo.trim() ? labTo.trim() : null });
    setType('all'); setStates([]); setPrintStatus('all'); setFacilities([]); setWards([]); setRequesters([]); setSites([]); setStandards([]); setCompliance('all');
  };
  const clearLookup = () => { setLookup(null); setLabNo(''); setLabTo(''); };
  const clearFilters = () => { clearLookup(); setType('all'); setStates([]); setPrintStatus('all'); setFacilities([]); setWards([]); setRequesters([]); setSites([]); setStandards([]); setCompliance('all'); };

  const headers = [
    ...(inScope.length > 1 ? [{ key: 'type', header: t('reportQueue.col.type', 'Type') }] : []), // FR-1.5
    { key: 'labNo', header: t('reportQueue.col.labNoName', 'Lab No / Name') },
    { key: 'subject', header: t('reportQueue.col.subject', 'Subject') },
    { key: 'details', header: t('reportQueue.col.details', 'Details') },
    { key: 'released', header: t('reportQueue.col.released', 'Released / Submitted') },
    { key: 'state', header: t('reportQueue.col.state', 'State') },
    { key: 'printStatus', header: t('reportQueue.col.printStatus', 'Print status') },
    { key: 'version', header: t('reportQueue.col.version', 'Version') },
    { key: 'action', header: t('common.action', 'Action') },
  ];
  const pageRows = visible.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="orderLegendBody">
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="/">{t('common.home', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('common.reports', 'Reports')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('reportQueue.title', 'Report Print Queue')}</BreadcrumbItem>
      </Breadcrumb>
      <h2>{t('reportQueue.title', 'Report Print Queue')}</h2>
      <p>{t('reportQueue.subtitle', 'Print, reprint and reissue released reports')}</p>

      {/* FR-10.1 */}
      <InlineNotification kind="info" lowContrast hideCloseButton
        title={t('reportQueue.guidance.lead', 'Reports land here when their first result is released.')}
        subtitle={
          <>
            {t('reportQueue.guidance.body', 'Printed reports come back when more results are released or a printed result changes.')}{' '}
            {canExport && t('reportQueue.guidance.exports', 'Your own data exports show here too.')}
            <div>
              <Tag type="warm-gray" size="sm">{t('reportQueue.state.partialName', 'Partial')}</Tag> {t('reportQueue.legend.partial', 'Some results are not released yet')}{' '}
              <Tag type="teal" size="sm">{STATE_TAG.final.label}</Tag> {t('reportQueue.legend.final', 'Every result is released')}{' '}
              <Tag type="magenta" size="sm">{STATE_TAG.amended.label}</Tag> {t('reportQueue.legend.amended', 'A printed result changed, or the report was reissued with a correction')}
            </div>
            <div>
              <Tag type="purple" size="sm">{PRINT_TAG.unprinted.label}</Tag> {t('reportQueue.legend.unprinted', 'The current content has not been printed yet')}{' '}
              <Tag type="green" size="sm">{PRINT_TAG.printed.label}</Tag> {t('reportQueue.legend.printed', 'The last print matches what is released')}
            </div>
          </>
        }
      />

      {/* FR-9.1 */}
      <Grid narrow>
        <Column lg={3} md={2} sm={2}>
          <Tile onClick={() => { clearLookup(); setType('all'); setStates([]); setPrintStatus('unprinted'); }}>
            <h3>{toPrint}</h3><p>{t('reportQueue.tile.toPrint', 'To print')}</p>
          </Tile>
        </Column>
        <Column lg={3} md={2} sm={2}>
          <Tile onClick={() => { clearLookup(); setType('all'); setStates([{ id: 'amended', text: STATE_TAG.amended.label }]); setPrintStatus('unprinted'); }}>
            <h3>{amendedToPrint}</h3><p>{t('reportQueue.tile.amendedToPrint', 'Amended to print')}</p>
          </Tile>
        </Column>
        {canExport && (
          <Column lg={3} md={2} sm={2}>
            <Tile onClick={() => { clearLookup(); setType('export'); setStates([{ id: 'READY', text: JOB_TAG.READY.label }]); setPrintStatus('all'); }}>
              <h3>{exportsReady}</h3><p>{t('reportQueue.tile.exportsReady', 'Exports ready')}</p>
            </Tile>
          </Column>
        )}
      </Grid>

      {/* FR-3.1: filter bar */}
      <Grid narrow>
        <Column lg={4} md={4} sm={4}>
          {/* Real page: CustomLabNumberInput */}
          <TextInput id="rq-labno" labelText={t('common.labNumber', 'Lab Number')}
            placeholder={t('reportQueue.filter.labNo.placeholder', 'Scan or type lab number')}
            helperText={t('reportQueue.filter.labNo.helper', 'Scanning a barcode applies the filter instantly')}
            value={labNo} onChange={(e) => setLabNo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyLookup()} />
          {range && (
            <TextInput id="rq-labto" labelText={t('reportQueue.filter.labNo.to', 'To lab number')} value={labTo}
              onChange={(e) => setLabTo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyLookup()} />
          )}
          <Button kind="ghost" size="sm" onClick={() => setRange(!range)}>{t('reportQueue.filter.labNo.range', 'Range')}</Button>
        </Column>
        {inScope.includes('patient') && (
          <Column lg={2} md={2} sm={4}>
            {/* FR-3.4: opens the existing SearchPatientForm inline, suppressExternalSearch */}
            <Button kind="ghost" size="sm" renderIcon={Search} disabled={targeted}>{t('reportQueue.filter.patient', 'Search by patient')}</Button>
          </Column>
        )}
        {inScope.length > 1 && (
          <Column lg={2} md={2} sm={4}>
            <Select id="rq-type" labelText={t('common.type', 'Type')} value={type} disabled={targeted}
              onChange={(e) => { setType(e.target.value); setStates([]); setPrintStatus('all'); setFacilities([]); setWards([]); setRequesters([]); setSites([]); setStandards([]); setCompliance('all'); }}>
              <SelectItem value="all" text={t('common.all', 'All')} />
              {inScope.map((ty) => <SelectItem key={ty} value={ty} text={TYPE_LABEL[ty]} />)}
            </Select>
          </Column>
        )}
        <Column lg={3} md={4} sm={4}>
          {/* FR-3.7: small fixed set, so MultiSelect (not typeahead); labels shown as chips */}
          <MultiSelect id="rq-state" titleText={t('reportQueue.filter.state', 'State')} label={t('common.all', 'All')}
            items={stateOptions} itemToString={(i) => (i ? i.text : '')} selectedItems={states} disabled={targeted}
            onChange={({ selectedItems }) => setStates(selectedItems)} />
          <SelectedChips items={states} onRemove={(i) => setStates(states.filter((s) => s.id !== i.id))} />
        </Column>
        {effectiveType !== 'export' && (
          <Column lg={2} md={2} sm={4}>
            <Select id="rq-print" labelText={t('reportQueue.filter.printStatus', 'Print status')} value={printStatus} disabled={targeted} onChange={(e) => setPrintStatus(e.target.value)}>
              <SelectItem value="all" text={t('common.all', 'All')} />
              <SelectItem value="unprinted" text={PRINT_TAG.unprinted.label} />
              <SelectItem value="printed" text={PRINT_TAG.printed.label} />
            </Select>
          </Column>
        )}
        <Column lg={3} md={4} sm={4}>
          <Select id="rq-window" labelText={t('reportQueue.filter.window', 'Time window')} value={windowId} disabled={targeted}
            helperText={targeted ? t('reportQueue.search.disabledHelper', 'Other filters are off while you look up a specific order') : t('reportQueue.filter.window.helper', 'Applies to printed reports; unprinted ones always show')}
            onChange={(e) => setWindowId(e.target.value)}>
            {WINDOWS.map((w) => <SelectItem key={w.id} value={w.id} text={w.text} />)}
          </Select>
          {windowId === 'custom' && (
            <DatePicker datePickerType="range">
              <DatePickerInput id="rq-from" labelText={t('common.from', 'From')} placeholder="yyyy-mm-dd" />
              <DatePickerInput id="rq-to" labelText={t('reportQueue.filter.window.to', 'To')} placeholder="yyyy-mm-dd" />
            </DatePicker>
          )}
        </Column>

        {/* FR-3.5: typeahead multi-selects, server-side options from 2 characters; labels shown as chips */}
        {effectiveType === 'patient' && !targeted && (
          <>
            <Column lg={4} md={4} sm={4}>
              <FilterableMultiSelect id="rq-facility" titleText={t('reportQueue.filter.facility', 'Facility')}
                helperText={t('reportQueue.filter.typeahead.helper', 'Type 2 or more characters to search')}
                items={FACILITIES} itemToString={(i) => (i ? i.text : '')} selectedItems={facilities}
                onChange={({ selectedItems }) => { setFacilities(selectedItems); setWards(wards.filter((w) => selectedItems.some((f) => w.id.startsWith(f.id)))); }} />
              <SelectedChips items={facilities} onRemove={(i) => setFacilities(facilities.filter((f) => f.id !== i.id))} />
            </Column>
            <Column lg={4} md={4} sm={4}>
              <FilterableMultiSelect id="rq-ward" titleText={t('reportQueue.filter.ward', 'Ward / Dept / Unit')}
                disabled={!facilities.length} helperText={!facilities.length ? t('reportQueue.filter.ward.disabled', 'Select a facility first') : undefined}
                items={wardOptions} itemToString={(i) => (i ? i.text : '')} selectedItems={wards} onChange={({ selectedItems }) => setWards(selectedItems)} />
              <SelectedChips items={wards} onRemove={(i) => setWards(wards.filter((w) => w.id !== i.id))} />
            </Column>
            <Column lg={4} md={4} sm={4}>
              <FilterableMultiSelect id="rq-requester" titleText={t('common.requester', 'Requester')}
                helperText={t('reportQueue.filter.typeahead.helper', 'Type 2 or more characters to search')}
                items={REQUESTERS} itemToString={(i) => (i ? i.text : '')} selectedItems={requesters} onChange={({ selectedItems }) => setRequesters(selectedItems)} />
              <SelectedChips items={requesters} onRemove={(i) => setRequesters(requesters.filter((q) => q.id !== i.id))} />
            </Column>
          </>
        )}
        {/* FR-3.6 */}
        {(effectiveType === 'environmental' || effectiveType === 'vector') && !targeted && (
          <>
            <Column lg={4} md={4} sm={4}>
              <FilterableMultiSelect id="rq-site" titleText={t('common.samplingSite', 'Sampling Site')}
                helperText={t('reportQueue.filter.typeahead.helper', 'Type 2 or more characters to search')}
                items={SITES} itemToString={(i) => (i ? i.text : '')} selectedItems={sites} onChange={({ selectedItems }) => setSites(selectedItems)} />
              <SelectedChips items={sites} onRemove={(i) => setSites(sites.filter((s) => s.id !== i.id))} />
            </Column>
            <Column lg={4} md={4} sm={4}>
              <FilterableMultiSelect id="rq-standard" titleText={t('common.standard', 'Standard')}
                items={STANDARDS} itemToString={(i) => (i ? i.text : '')} selectedItems={standards} onChange={({ selectedItems }) => setStandards(selectedItems)} />
              <SelectedChips items={standards} onRemove={(i) => setStandards(standards.filter((s) => s.id !== i.id))} />
            </Column>
            <Column lg={3} md={4} sm={4}>
              <Select id="rq-compliance" labelText={t('laporanHasil.filter.complianceStatus', 'Compliance Status')} value={compliance} onChange={(e) => setCompliance(e.target.value)}>
                <SelectItem value="all" text={t('common.all', 'All')} />
                {Object.entries(COMPLIANCE_TAG).map(([k, v]) => <SelectItem key={k} value={k} text={v.label} />)}
              </Select>
            </Column>
          </>
        )}
        <Column lg={2} md={2} sm={4}>
          <Button kind="ghost" size="sm" onClick={clearFilters}>{t('reportQueue.filter.clear', 'Clear filters')}</Button>
        </Column>
      </Grid>

      {/* FR-3.3 active-search strip */}
      {targeted && (
        <Stack orientation="horizontal" gap={4}>
          <DismissibleTag type="high-contrast" onClose={clearLookup}
            text={lookup.to
              ? t('reportQueue.search.active.labRange', 'Lab No: {from} to {to}').replace('{from}', lookup.from).replace('{to}', lookup.to)
              : t('reportQueue.search.active.labNo', 'Lab No: {labNo}').replace('{labNo}', lookup.from)} />
          <span>{t('reportQueue.search.disabledHelper', 'Other filters are off while you look up a specific order')}</span>
          <Button kind="ghost" size="sm" onClick={clearLookup}>{t('reportQueue.search.clear', 'Clear search')}</Button>
        </Stack>
      )}

      {notice && <InlineNotification kind="success" title={notice} onCloseButtonClick={() => setNotice(null)} />}

      <DataTable rows={pageRows.map((r) => ({ id: r.id, type: TYPE_LABEL[r.type], labNo: r.labNo, subject: r.subject, details: '', released: fmt(r.released), state: '', printStatus: '', version: '', action: '' }))} headers={headers}>
        {({ rows: dtRows, headers: hs, getHeaderProps, getRowProps, getTableProps, getSelectionProps, getBatchActionProps, getExpandHeaderProps, selectedRows }) => {
          const batch = getBatchActionProps();
          const selectedIds = selectedRows.map((r) => r.id);
          const tooMany = selectedIds.length > BATCH_LIMIT;
          return (
            <TableContainer>
              <TableToolbar>
                <TableBatchActions {...batch}>
                  <TableBatchAction renderIcon={Printer} disabled={tooMany} onClick={() => { print(selectedIds); batch.onCancel(); }}>
                    {t('reportQueue.action.printSelected', 'Print selected')}
                  </TableBatchAction>
                  <TableBatchAction renderIcon={Download} disabled={tooMany} onClick={() => { print(selectedIds, 'zip'); batch.onCancel(); }}>
                    {t('reportQueue.action.downloadSelected', 'Download selected')}
                  </TableBatchAction>
                </TableBatchActions>
                <TableToolbarContent>
                  {tooMany && <span>{t('reportQueue.batch.tooMany', 'Select 100 or fewer orders to print or download at once')}</span>}
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    <TableExpandHeader {...getExpandHeaderProps()} />
                    <TableSelectAll {...getSelectionProps()} />
                    {hs.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h, isSortable: ['type', 'labNo', 'subject', 'released', 'state', 'printStatus'].includes(h.key) })}>{h.header}</TableHeader>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dtRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={hs.length + 2}>
                        {t('reportQueue.empty', 'Nothing to print. Every released report in this view has been printed.')}{' '}
                        <Link href="#" onClick={(e) => { e.preventDefault(); clearFilters(); }}>{t('reportQueue.filter.clear', 'Clear filters')}</Link>
                      </TableCell>
                    </TableRow>
                  )}
                  {dtRows.map((dtRow) => {
                    const r = rows.find((x) => x.id === dtRow.id);
                    if (isExport(r)) {
                      // FR-11: the user's own export job, not selectable for batch print (FR-11.7)
                      return (
                        <React.Fragment key={r.id}>
                          <TableExpandRow {...getRowProps({ row: dtRow })}>
                            <TableCell />
                            {inScope.length > 1 && <TableCell>{TYPE_LABEL.export}</TableCell>}
                            <TableCell><strong>{r.labNo}</strong></TableCell>
                            <TableCell>{r.subject}</TableCell>
                            <TableCell>{r.dateRange}<div className="cds--label">{r.rowsSize}</div></TableCell>
                            <TableCell>{fmt(r.released)}</TableCell>
                            <TableCell><Tag type={JOB_TAG[r.job].kind} size="sm">{JOB_TAG[r.job].label}</Tag></TableCell>
                            <TableCell>–</TableCell>
                            <TableCell>–</TableCell>
                            <TableCell><ExportJobAction job={r} onAction={exportAction} /></TableCell>
                          </TableExpandRow>
                          <TableExpandedRow colSpan={hs.length + 2}><ExportJobDetails job={r} /></TableExpandedRow>
                        </React.Fragment>
                      );
                    }
                    const releasedNothing = r.releasedCount === 0;
                    return (
                      <React.Fragment key={r.id}>
                        <TableExpandRow {...getRowProps({ row: dtRow })}>
                          <TableSelectRow {...getSelectionProps({ row: dtRow })} />
                          {inScope.length > 1 && <TableCell>{TYPE_LABEL[r.type]}</TableCell>}
                          <TableCell><code>{r.labNo}</code></TableCell>
                          <TableCell>{r.subject}<div className="cds--label">{r.subjectCode}</div></TableCell>
                          <TableCell><DetailsCell row={r} /></TableCell>
                          <TableCell>{fmt(r.released)}</TableCell>
                          <TableCell><StateTags row={r} /></TableCell>
                          <TableCell><PrintStatusTag row={r} /></TableCell>
                          <TableCell><VersionCell row={r} /></TableCell>
                          <TableCell>
                            {/* D-078 / D-104: one-click row action */}
                            <Button kind="tertiary" size="sm" renderIcon={Printer} disabled={releasedNothing}
                              title={releasedNothing ? t('reportQueue.print.disabled.nothingReleased', 'Nothing released yet on this order') : undefined}
                              onClick={() => print([r.id])}>
                              {t('reportQueue.action.print', 'Print')}
                            </Button>
                          </TableCell>
                        </TableExpandRow>
                        <TableExpandedRow colSpan={hs.length + 2}>
                          <Stack gap={6}>
                            {r.type === 'patient' ? <PatientDetail row={r} /> : <CertificateDetail row={r} />}
                            <div>
                              <h5>{t('reportQueue.history.title', 'Version history')}</h5>
                              <VersionHistory row={r} />
                            </div>
                            <ReissueWithCorrection row={r} userRole={userRole} onReissue={reissue} />
                          </Stack>
                        </TableExpandedRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination page={page} pageSize={pageSize} pageSizes={[10, 20, 50, 100]} totalItems={visible.length}
                onChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }} />
            </TableContainer>
          );
        }}
      </DataTable>
    </div>
  );
}

// Selected items show their labels, never a bare count (design addendum convention)
function SelectedChips({ items, onRemove }) {
  if (!items.length) return null;
  return (
    <div>
      {items.map((i) => (
        <DismissibleTag key={i.id} type="high-contrast" size="sm" text={i.text} onClose={() => onRemove(i)} />
      ))}
    </div>
  );
}
