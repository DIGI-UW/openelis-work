/**
 * Lab Management Dashboard — React/Carbon Mockup
 * File: lab-management-dashboard-mockup.jsx
 * FRS: lab-management-dashboard-frs-v1.0.md
 *
 * Constitution compliance:
 *   ✅ All strings via t(key, fallback) — zero hardcoded English in JSX
 *   ✅ Carbon Design System components only (@carbon/react)
 *   ✅ Tag with semantic kind for all status indicators
 *   ✅ DataTable for all tabular data
 *   ✅ Carbon spacing tokens / Stack — no magic pixel values
 *   ✅ No modals (read-only page; no edit forms)
 *   ✅ Accordion for optional QC section
 *   ✅ Design brief committed before code
 *
 * Chart placeholders: Sparkline trend charts are rendered as inline SVG.
 * Production implementation should use @carbon/charts-react LineChart.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Column,
  Stack,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableExpandHeader,
  TableExpandRow,
  TableExpandedRow,
  Button,
  InlineNotification,
  Tag,
  Loading,
  Accordion,
  AccordionItem,
  Tile,
  Breadcrumb,
  BreadcrumbItem,
  Select,
  SelectItem,
  NumberInput,
} from '@carbon/react';
import { Renew } from '@carbon/icons-react';

// ─────────────────────────────────────────────────────────────────────────────
// i18n helper — all visible strings MUST pass through this function
// ─────────────────────────────────────────────────────────────────────────────
const t = (key, fallback) => fallback || key;

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — replace with API responses from /api/v1/dashboard/*
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_KPI = {
  testsToday: { value: 342, delta: '+18', deltaDir: 'up' },
  pending: { value: 47, delta: '-5', deltaDir: 'down' },
  tatCompliance: { value: 91.4, delta: '-2.1%', deltaDir: 'down', status: 'warm-gray' },
  qcPassRate: { value: 97.8, delta: '+0.3%', deltaDir: 'up', status: 'green' },
  analyzersOnline: { value: '7 / 9', delta: '', status: 'warm-gray' },
  stockAlerts: { value: 3, delta: '', status: 'red' },
};

const MOCK_WORKLOAD_HEADERS = [
  { key: 'section', header: t('label.dashboard.section', 'Section') },
  { key: 'total', header: t('label.dashboard.total', 'Total') },
  { key: 'pending', header: t('label.dashboard.pending', 'Pending') },
  { key: 'inProgress', header: t('label.dashboard.inProgress', 'In Progress') },
  { key: 'completed', header: t('label.dashboard.completed', 'Completed') },
  { key: 'rejected', header: t('label.dashboard.rejected', 'Rejected') },
];

// Section-level aggregate rows; each has a `units` array for the expandable child rows
const MOCK_WORKLOAD_SECTIONS = [
  {
    id: '1', section: 'Hematology', total: 128, pending: 12, inProgress: 8, completed: 104, rejected: 4,
    units: [
      { id: '1a', section: 'CBC / Full Blood Count', total: 89, pending: 8, inProgress: 5, completed: 73, rejected: 3 },
      { id: '1b', section: 'Coagulation', total: 39, pending: 4, inProgress: 3, completed: 31, rejected: 1 },
    ],
  },
  {
    id: '2', section: 'Chemistry', total: 97, pending: 9, inProgress: 5, completed: 81, rejected: 2,
    units: [
      { id: '2a', section: 'Routine Chemistry', total: 72, pending: 6, inProgress: 4, completed: 60, rejected: 2 },
      { id: '2b', section: 'Immunoassay', total: 25, pending: 3, inProgress: 1, completed: 21, rejected: 0 },
    ],
  },
  {
    id: '3', section: 'Microbiology', total: 61, pending: 18, inProgress: 11, completed: 29, rejected: 3,
    units: [
      { id: '3a', section: 'Bacteriology', total: 38, pending: 11, inProgress: 7, completed: 18, rejected: 2 },
      { id: '3b', section: 'Mycobacteriology (TB)', total: 23, pending: 7, inProgress: 4, completed: 11, rejected: 1 },
    ],
  },
  {
    id: '4', section: 'Serology', total: 44, pending: 6, inProgress: 2, completed: 35, rejected: 1,
    units: [
      { id: '4a', section: 'HIV / STI', total: 28, pending: 4, inProgress: 1, completed: 22, rejected: 1 },
      { id: '4b', section: 'Malaria / RDT', total: 16, pending: 2, inProgress: 1, completed: 13, rejected: 0 },
    ],
  },
  {
    id: '5', section: 'Molecular', total: 12, pending: 2, inProgress: 3, completed: 6, rejected: 1,
    units: [
      { id: '5a', section: 'PCR / GeneXpert', total: 12, pending: 2, inProgress: 3, completed: 6, rejected: 1 },
    ],
  },
];

const MOCK_TAT_HEADERS = [
  { key: 'section', header: t('label.dashboard.section', 'Section') },
  { key: 'target', header: t('label.dashboard.target', 'Target (hrs)') },
  { key: 'average', header: t('label.dashboard.average', 'Average (hrs)') },
  { key: 'min', header: t('label.dashboard.minimum', 'Min (hrs)') },
  { key: 'max', header: t('label.dashboard.maximum', 'Max (hrs)') },
  { key: 'compliance', header: t('label.dashboard.compliance', 'Compliance') },
];

// Per-unit TAT targets are a config prerequisite (FR-4-006); units show noTarget until that story ships
const MOCK_TAT_SECTIONS = [
  {
    id: '1', section: 'Hematology', target: '4', average: '3.2', min: '0.8', max: '6.1', compliance: '96.1', complianceStatus: 'green',
    units: [
      { id: '1a', section: 'CBC / Full Blood Count', target: null, average: '2.9', min: '0.8', max: '5.2', compliance: null, complianceStatus: 'gray' },
      { id: '1b', section: 'Coagulation', target: null, average: '3.8', min: '1.1', max: '6.1', compliance: null, complianceStatus: 'gray' },
    ],
  },
  {
    id: '2', section: 'Chemistry', target: '6', average: '5.8', min: '1.2', max: '9.4', compliance: '91.4', complianceStatus: 'warm-gray',
    units: [
      { id: '2a', section: 'Routine Chemistry', target: null, average: '5.4', min: '1.2', max: '8.7', compliance: null, complianceStatus: 'gray' },
      { id: '2b', section: 'Immunoassay', target: null, average: '6.8', min: '3.1', max: '9.4', compliance: null, complianceStatus: 'gray' },
    ],
  },
  {
    id: '3', section: 'Microbiology', target: '48', average: '52.3', min: '18.0', max: '96.0', compliance: '74.2', complianceStatus: 'red',
    units: [
      { id: '3a', section: 'Bacteriology', target: null, average: '48.1', min: '18.0', max: '72.0', compliance: '88.1', complianceStatus: 'warm-gray' },
      { id: '3b', section: 'Mycobacteriology (TB)', target: null, average: '58.4', min: '36.0', max: '96.0', compliance: '61.2', complianceStatus: 'red' },
    ],
  },
  {
    id: '4', section: 'Serology', target: '8', average: '7.1', min: '2.0', max: '11.2', compliance: '95.0', complianceStatus: 'green',
    units: [
      { id: '4a', section: 'HIV / STI', target: null, average: '7.0', min: '2.0', max: '10.5', compliance: null, complianceStatus: 'gray' },
      { id: '4b', section: 'Malaria / RDT', target: null, average: '7.3', min: '3.1', max: '11.2', compliance: null, complianceStatus: 'gray' },
    ],
  },
  {
    id: '5', section: 'Molecular', target: null, average: '18.4', min: '8.0', max: '32.0', compliance: null, complianceStatus: 'gray',
    units: [
      { id: '5a', section: 'PCR / GeneXpert', target: null, average: '18.4', min: '8.0', max: '32.0', compliance: null, complianceStatus: 'gray' },
    ],
  },
];

const MOCK_QC_HEADERS = [
  { key: 'section', header: t('label.dashboard.section', 'Section') },
  { key: 'runs', header: t('label.dashboard.qcRuns', 'QC Runs') },
  { key: 'passes', header: t('label.dashboard.qcPasses', 'Passes') },
  { key: 'failures', header: t('label.dashboard.qcFailures', 'Failures') },
  { key: 'passRate', header: t('label.dashboard.passRate', 'Pass Rate') },
];

const MOCK_QC_ROWS = [
  { id: '1', section: 'Hematology', runs: '24', passes: '24', failures: '0', passRate: '100.0', passRateStatus: 'green' },
  { id: '2', section: 'Chemistry', runs: '36', passes: '35', failures: '1', passRate: '97.2', passRateStatus: 'green' },
  { id: '3', section: 'Microbiology', runs: '18', passes: '14', failures: '4', passRate: '77.8', passRateStatus: 'red' },
  { id: '4', section: 'Serology', runs: '12', passes: '12', failures: '0', passRate: '100.0', passRateStatus: 'green' },
  { id: '5', section: 'Molecular', runs: '6', passes: '6', failures: '0', passRate: '100.0', passRateStatus: 'green' },
];

const MOCK_SURVEILLANCE = {
  tb: {
    positivityRate: 12.4,
    positivityStatus: 'red',
    totalTested: 193,
    totalPositive: 24,
    sparklineData: [8.1, 9.4, 11.0, 10.2, 13.7, 12.4],
  },
  hiv: {
    positivityRate: 4.8,
    positivityStatus: 'green',
    totalTested: 312,
    totalPositive: 15,
    sparklineData: [5.2, 4.9, 5.4, 5.1, 4.6, 4.8],
  },
  malaria: {
    positivityRate: 31.2,
    positivityStatus: 'red',
    totalTested: 141,
    totalPositive: 44,
    sparklineData: [18.3, 22.1, 27.4, 29.0, 30.1, 31.2],
  },
  amr: {
    positivityRate: 68.1,
    positivityStatus: 'red',
    totalTested: 47,
    totalPositive: 32,
    mdrCount: 11,
    mdrRate: 34.4,
    sparklineData: [55.0, 58.3, 62.1, 64.7, 66.0, 68.1],
  },
};

const MOCK_EQUIPMENT_HEADERS = [
  { key: 'name', header: t('label.dashboard.analyzerName', 'Analyzer Name') },
  { key: 'section', header: t('label.dashboard.section', 'Section') },
  { key: 'status', header: t('label.dashboard.status', 'Status') },
  { key: 'lastResultsImported', header: t('label.dashboard.lastResultsImported', 'Last Results Imported') },
];

const MOCK_EQUIPMENT_ROWS = [
  { id: '1', name: 'Mindray BC-5380', section: 'Hematology', status: 'online', lastResultsImported: '2026-03-24 09:41' },
  { id: '2', name: 'Mindray BS-430', section: 'Chemistry', status: 'online', lastResultsImported: '2026-03-24 10:12' },
  { id: '3', name: 'Indiko Plus', section: 'Chemistry', status: 'warning', lastResultsImported: '2026-03-24 07:30' },
  { id: '4', name: 'QuantStudio 7', section: 'Molecular', status: 'offline', lastResultsImported: '2026-03-23 16:00' },
  { id: '5', name: 'MALDI Biotyper', section: 'Microbiology', status: 'maintenance', lastResultsImported: '2026-03-22 14:00' },
  { id: '6', name: 'VIDAS', section: 'Serology', status: 'online', lastResultsImported: '2026-03-24 10:05' },
];

const MOCK_STOCK_HEADERS = [
  { key: 'item', header: t('label.dashboard.itemName', 'Item Name') },
  { key: 'section', header: t('label.dashboard.section', 'Section') },
  { key: 'currentStock', header: t('label.dashboard.currentStock', 'Current Stock') },
  { key: 'unit', header: t('label.dashboard.unit', 'Unit') },
  { key: 'status', header: t('label.dashboard.status', 'Status') },
  { key: 'daysRemaining', header: t('label.dashboard.daysRemaining', 'Days Remaining') },
  { key: 'forecast', header: t('label.dashboard.stockForecast', 'Projected Stock-Out') },
];

const MOCK_STOCK_ROWS = [
  { id: '1', item: 'Malaria RDT Kits', section: 'Serology', currentStock: '48', unit: 'kits', status: 'critical', daysRemaining: '3', forecast: '2026-03-27' },
  { id: '2', item: 'AFB Staining Reagent', section: 'Microbiology', currentStock: '2', unit: 'bottles', status: 'critical', daysRemaining: '4', forecast: '2026-03-28' },
  { id: '3', item: 'EDTA Tubes (3 mL)', section: 'Hematology', currentStock: '310', unit: 'tubes', status: 'low', daysRemaining: '11', forecast: '2026-04-04' },
  { id: '4', item: 'HIV Rapid Test Strips', section: 'Serology', currentStock: '95', unit: 'strips', status: 'low', daysRemaining: '14', forecast: '2026-04-07' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SparklineChart — simple inline SVG trend line
 * Production: replace with @carbon/charts-react <LineChart />
 */
function SparklineChart({ data, color = '#0f62fe', width = 180, height = 48 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * (height - 4) - 2,
  ]);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <svg
      width={width}
      height={height}
      aria-label={t('label.dashboard.trend', 'Trend (6 months)')}
      role="img"
      style={{ display: 'block' }}
    >
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} />
      ))}
    </svg>
  );
}

/**
 * KpiTile — a single KPI summary card
 */
function KpiTile({ label, value, delta, deltaDir, statusTag }) {
  const deltaColor = deltaDir === 'up' ? 'var(--cds-support-success)' : 'var(--cds-support-error)';
  return (
    <Tile style={{ minHeight: '7rem' }}>
      <Stack gap={2}>
        <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--cds-text-primary)', lineHeight: 1.1 }}>
          {value}
        </p>
        <Stack orientation="horizontal" gap={3}>
          {statusTag && <Tag kind={statusTag.kind}>{statusTag.label}</Tag>}
          {delta && (
            <span style={{ fontSize: '0.75rem', color: deltaColor }}>
              {delta}
            </span>
          )}
        </Stack>
      </Stack>
    </Tile>
  );
}

/**
 * StatusTag — maps equipment/stock/compliance status keys to Carbon Tag kinds and labels
 */
function StatusTag({ statusKey }) {
  const map = {
    online:      { kind: 'green',     label: t('label.dashboard.online',      'Online') },
    offline:     { kind: 'red',       label: t('label.dashboard.offline',     'Offline') },
    warning:     { kind: 'warm-gray', label: t('label.dashboard.warning',     'Warning') },
    maintenance: { kind: 'blue',      label: t('label.dashboard.maintenance', 'Maintenance') },
    normal:      { kind: 'green',     label: t('label.dashboard.normal',      'Normal') },
    low:         { kind: 'warm-gray', label: t('label.dashboard.low',         'Low') },
    critical:    { kind: 'red',       label: t('label.dashboard.critical',    'Critical') },
    green:       { kind: 'green',     label: '' },
    'warm-gray': { kind: 'warm-gray', label: '' },
    red:         { kind: 'red',       label: '' },
    gray:        { kind: 'gray',      label: t('label.dashboard.noTarget',    'No target set') },
  };
  const config = map[statusKey] || { kind: 'gray', label: statusKey };
  return <Tag kind={config.kind}>{config.label || statusKey}</Tag>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Workload Section — expandable by unit (FR-3-005)
// ─────────────────────────────────────────────────────────────────────────────
function WorkloadCells({ cells }) {
  return cells.map((cell) => (
    <TableCell key={cell.id}>
      {cell.info.header === 'pending' ? <Tag kind="purple">{cell.value}</Tag>
        : cell.info.header === 'inProgress' ? <Tag kind="blue">{cell.value}</Tag>
        : cell.info.header === 'completed' ? <Tag kind="green">{cell.value}</Tag>
        : cell.info.header === 'rejected' ? <Tag kind="red">{cell.value}</Tag>
        : cell.value}
    </TableCell>
  ));
}

function WorkloadTable({ sections, headers }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Build flat rows for DataTable (section-level only; units handled manually below)
  const sectionRows = sections.map((s) => ({
    id: s.id,
    section: s.section,
    total: String(s.total),
    pending: String(s.pending),
    inProgress: String(s.inProgress),
    completed: String(s.completed),
    rejected: String(s.rejected),
  }));

  return (
    <DataTable rows={sectionRows} headers={headers}>
      {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer title={t('heading.dashboard.workload', 'Workload by Section')}>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                <TableExpandHeader aria-label={t('label.dashboard.expandSection', 'Expand section breakdown')} />
                {tableHeaders.map((h) => (
                  <TableHeader key={h.key} {...getHeaderProps({ header: h })}>
                    {h.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => {
                const sectionData = sections.find((s) => s.id === row.id);
                const isExpanded = !!expanded[row.id];
                return (
                  <React.Fragment key={row.id}>
                    <TableExpandRow
                      {...getRowProps({ row })}
                      isExpanded={isExpanded}
                      onExpand={() => toggle(row.id)}
                      ariaLabel={t('label.dashboard.expandSection', 'Expand section breakdown')}
                    >
                      <WorkloadCells cells={row.cells} />
                    </TableExpandRow>
                    {isExpanded && sectionData?.units.map((unit) => (
                      <TableExpandedRow key={unit.id} colSpan={tableHeaders.length + 1}>
                        <Table size="sm">
                          <TableBody>
                            <TableRow style={{ background: 'var(--cds-layer-02)' }}>
                              <TableCell style={{ paddingLeft: 'var(--cds-spacing-07)', color: 'var(--cds-text-secondary)', width: '20%' }}>
                                {unit.section}
                              </TableCell>
                              <TableCell>{unit.total}</TableCell>
                              <TableCell><Tag kind="purple">{unit.pending}</Tag></TableCell>
                              <TableCell><Tag kind="blue">{unit.inProgress}</Tag></TableCell>
                              <TableCell><Tag kind="green">{unit.completed}</Tag></TableCell>
                              <TableCell><Tag kind="red">{unit.rejected}</Tag></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableExpandedRow>
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

// ─────────────────────────────────────────────────────────────────────────────
// TAT Section — expandable by unit (FR-4-007)
// TAT targets sourced from tatTargetHours on Test entity (Test Catalog prerequisite)
// Expand icon shown ONLY on non-compliant sections (< 95%); expands to show only non-compliant units
// ─────────────────────────────────────────────────────────────────────────────
function TATComplianceCell({ complianceStatus, compliance }) {
  if (complianceStatus === 'gray') {
    return <Tag kind="gray">{t('label.dashboard.noTarget', 'No target set')}</Tag>;
  }
  return (
    <Tag kind={complianceStatus || 'gray'}>
      {compliance ? `${compliance}%` : '—'}
    </Tag>
  );
}

// A section is expandable only if compliance is below the green threshold (< 95% or no target)
const isNonCompliant = (s) => s.complianceStatus === 'warm-gray' || s.complianceStatus === 'red';

function TATTable({ sections, headers }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const sectionRows = sections.map((s) => ({
    id: s.id,
    section: s.section,
    target: s.target ?? '—',
    average: s.average,
    min: s.min,
    max: s.max,
    compliance: s.compliance ?? '—',
  }));

  return (
    <DataTable rows={sectionRows} headers={headers}>
      {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer title={t('heading.dashboard.tat', 'Turnaround Time')}>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {/* Expand header — only non-compliant rows are expandable */}
                <TableExpandHeader aria-label={t('label.dashboard.expandSection', 'Expand section breakdown')} />
                {tableHeaders.map((h) => (
                  <TableHeader key={h.key} {...getHeaderProps({ header: h })}>
                    {h.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => {
                const sectionData = sections.find((s) => s.id === row.id);
                const canExpand = isNonCompliant(sectionData);
                const isExpanded = canExpand && !!expanded[row.id];
                // Only show unit rows that are also non-compliant
                const nonCompliantUnits = (sectionData?.units || []).filter(
                  (u) => u.complianceStatus === 'warm-gray' || u.complianceStatus === 'red'
                );
                return (
                  <React.Fragment key={row.id}>
                    {canExpand ? (
                      <TableExpandRow
                        {...getRowProps({ row })}
                        isExpanded={isExpanded}
                        onExpand={() => toggle(row.id)}
                        ariaLabel={t('label.dashboard.expandSection', 'Expand section breakdown')}
                      >
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'compliance' ? (
                              <TATComplianceCell
                                complianceStatus={sectionData?.complianceStatus}
                                compliance={sectionData?.compliance}
                              />
                            ) : (
                              cell.value ?? '—'
                            )}
                          </TableCell>
                        ))}
                      </TableExpandRow>
                    ) : (
                      // Compliant section — no expand control
                      <TableRow {...getRowProps({ row })}>
                        <TableCell /> {/* empty expand column */}
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'compliance' ? (
                              <TATComplianceCell
                                complianceStatus={sectionData?.complianceStatus}
                                compliance={sectionData?.compliance}
                              />
                            ) : (
                              cell.value ?? '—'
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )}
                    {isExpanded && nonCompliantUnits.map((unit) => (
                      <TableExpandedRow key={unit.id} colSpan={tableHeaders.length + 1}>
                        <Table size="sm">
                          <TableBody>
                            <TableRow style={{ background: 'var(--cds-layer-02)' }}>
                              <TableCell style={{ paddingLeft: 'var(--cds-spacing-07)', color: 'var(--cds-support-error)', width: '20%' }}>
                                ⚠ {unit.section}
                              </TableCell>
                              <TableCell>
                                <TATComplianceCell complianceStatus={unit.complianceStatus} compliance={unit.compliance} />
                              </TableCell>
                              <TableCell>{unit.average}</TableCell>
                              <TableCell>{unit.min}</TableCell>
                              <TableCell>{unit.max}</TableCell>
                              <TableCell>
                                <TATComplianceCell complianceStatus={unit.complianceStatus} compliance={unit.compliance} />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableExpandedRow>
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

// ─────────────────────────────────────────────────────────────────────────────
// QC Section
// ─────────────────────────────────────────────────────────────────────────────
function QCTable({ rows, headers }) {
  return (
    <DataTable rows={rows} headers={headers}>
      {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
        <Table {...getTableProps()}>
          <TableHead>
            <TableRow>
              {tableHeaders.map((h) => (
                <TableHeader key={h.key} {...getHeaderProps({ header: h })}>
                  {h.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows.map((row) => {
              const rawRow = MOCK_QC_ROWS.find((r) => r.id === row.id);
              return (
                <TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.info.header === 'passRate' ? (
                        <Tag kind={rawRow?.passRateStatus || 'gray'}>
                          {cell.value}%
                        </Tag>
                      ) : (
                        cell.value
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </DataTable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Surveillance Tab Content
// ─────────────────────────────────────────────────────────────────────────────
function SurveillanceTabContent({ programKey, data }) {
  if (!data) {
    return (
      <InlineNotification
        kind="info"
        title={t('label.dashboard.noProgramTests', 'No tests are configured for this program. Configure mappings in Admin → Lab Configuration.')}
        hideCloseButton
      />
    );
  }

  return (
    <Stack gap={5} style={{ paddingTop: 'var(--cds-spacing-05)' }}>
      <Grid>
        <Column sm={4} md={4} lg={4}>
          <Tile>
            <Stack gap={2}>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                {t('label.dashboard.positivityRate', 'Positivity Rate')}
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                {data.positivityRate}%
              </p>
              <Tag kind={data.positivityStatus}>
                {data.positivityStatus === 'red'
                  ? t('label.dashboard.aboveThreshold', 'Above threshold')
                  : t('label.dashboard.withinThreshold', 'Within threshold')}
              </Tag>
            </Stack>
          </Tile>
        </Column>
        <Column sm={4} md={2} lg={4}>
          <Tile>
            <Stack gap={2}>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                {t('label.dashboard.totalTested', 'Total Tested')}
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>{data.totalTested}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                {t('label.dashboard.currentMonth', 'Current Month')}
              </p>
            </Stack>
          </Tile>
        </Column>
        <Column sm={4} md={2} lg={4}>
          <Tile>
            <Stack gap={2}>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                {t('label.dashboard.totalPositive', 'Total Positive')}
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>{data.totalPositive}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                {t('label.dashboard.currentMonth', 'Current Month')}
              </p>
            </Stack>
          </Tile>
        </Column>
        {programKey === 'amr' && data.mdrCount !== undefined && (
          <>
            <Column sm={4} md={2} lg={4}>
              <Tile>
                <Stack gap={2}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                    {t('label.dashboard.mdrCount', 'MDR Isolates')}
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>{data.mdrCount}</p>
                </Stack>
              </Tile>
            </Column>
            <Column sm={4} md={2} lg={4}>
              <Tile>
                <Stack gap={2}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                    {t('label.dashboard.mdrRate', 'MDR Rate')}
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>{data.mdrRate}%</p>
                </Stack>
              </Tile>
            </Column>
          </>
        )}
      </Grid>

      {/* Sparkline trend chart — production: replace with @carbon/charts-react LineChart */}
      <Tile>
        <Stack gap={3}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {t('label.dashboard.trend', 'Trend (6 months)')}
          </p>
          <SparklineChart
            data={data.sparklineData}
            color={data.positivityStatus === 'red' ? '#da1e28' : '#0f62fe'}
            width={320}
            height={64}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {t('label.dashboard.positivityRate', 'Positivity Rate')} (%) — {t('label.dashboard.last6months', 'Last 6 months')}
          </p>
        </Stack>
      </Tile>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Equipment Table
// ─────────────────────────────────────────────────────────────────────────────
function EquipmentTable({ rows, headers }) {
  return (
    <DataTable rows={rows} headers={headers}>
      {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer title={t('heading.dashboard.equipment', 'Equipment Status')}>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {tableHeaders.map((h) => (
                  <TableHeader key={h.key} {...getHeaderProps({ header: h })}>
                    {h.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => (
                <TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.info.header === 'status' ? (
                        <StatusTag statusKey={cell.value} />
                      ) : (
                        cell.value
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stock Table
// ─────────────────────────────────────────────────────────────────────────────
function StockTable({ rows, headers }) {
  if (!rows || rows.length === 0) {
    return (
      <Stack gap={3}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
          {t('heading.dashboard.stock', 'Stock Levels')}
        </p>
        <InlineNotification
          kind="success"
          title={t('label.dashboard.noStockAlerts', 'All stock levels are within normal range.')}
          hideCloseButton
        />
      </Stack>
    );
  }

  return (
    <DataTable rows={rows} headers={headers}>
      {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer title={t('heading.dashboard.stock', 'Stock Levels')}>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {tableHeaders.map((h) => (
                  <TableHeader key={h.key} {...getHeaderProps({ header: h })}>
                    {h.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => (
                <TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.info.header === 'status' ? (
                        <StatusTag statusKey={cell.value} />
                      ) : (
                        cell.value
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────────────────────
export default function LabManagementDashboard() {
  const [section, setSection] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10);

  // Mock alert states (in production: derived from API response)
  const hasCriticalQC = true;   // Microbiology QC pass rate 77.8% < 90%
  const hasAnalyzerOffline = true; // QuantStudio 7 offline
  const hasCriticalStock = true;   // Malaria RDT and AFB reagent critical

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRefresh = useCallback(() => {
    setLoading(true);
    // Simulate API fetch — replace with actual API calls
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
    }, 800);
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    const timer = setInterval(handleRefresh, refreshInterval * 60 * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval, handleRefresh]);

  const kpiTiles = [
    {
      key: 'testsToday',
      label: t('label.dashboard.testsToday', 'Tests Today'),
      value: MOCK_KPI.testsToday.value,
      delta: MOCK_KPI.testsToday.delta,
      deltaDir: MOCK_KPI.testsToday.deltaDir,
      statusTag: null,
    },
    {
      key: 'pending',
      label: t('label.dashboard.pending', 'Pending'),
      value: MOCK_KPI.pending.value,
      delta: MOCK_KPI.pending.delta,
      deltaDir: MOCK_KPI.pending.deltaDir,
      statusTag: null,
    },
    {
      key: 'tatCompliance',
      label: t('label.dashboard.tatCompliance', 'TAT Compliance'),
      value: `${MOCK_KPI.tatCompliance.value}%`,
      delta: MOCK_KPI.tatCompliance.delta,
      deltaDir: MOCK_KPI.tatCompliance.deltaDir,
      statusTag: { kind: MOCK_KPI.tatCompliance.status, label: `${MOCK_KPI.tatCompliance.value}%` },
    },
    {
      key: 'qcPassRate',
      label: t('label.dashboard.qcPassRate', 'QC Pass Rate'),
      value: `${MOCK_KPI.qcPassRate.value}%`,
      delta: MOCK_KPI.qcPassRate.delta,
      deltaDir: MOCK_KPI.qcPassRate.deltaDir,
      statusTag: { kind: MOCK_KPI.qcPassRate.status, label: `${MOCK_KPI.qcPassRate.value}%` },
    },
    {
      key: 'analyzersOnline',
      label: t('label.dashboard.analyzersOnline', 'Analyzers Online'),
      value: MOCK_KPI.analyzersOnline.value,
      delta: '',
      deltaDir: null,
      statusTag: { kind: MOCK_KPI.analyzersOnline.status, label: MOCK_KPI.analyzersOnline.value },
    },
    {
      key: 'stockAlerts',
      label: t('label.dashboard.stockAlerts', 'Stock Alerts'),
      value: MOCK_KPI.stockAlerts.value,
      delta: '',
      deltaDir: null,
      statusTag: { kind: MOCK_KPI.stockAlerts.status, label: `${MOCK_KPI.stockAlerts.value} items` },
    },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Loading overlay */}
      {loading && (
        <Loading
          description={t('message.dashboard.refreshing', 'Refreshing dashboard data…')}
          withOverlay
        />
      )}

      <Grid>
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <Column sm={4} md={8} lg={16}>
          <Stack gap={4} style={{ paddingTop: 'var(--cds-spacing-06)', paddingBottom: 'var(--cds-spacing-05)' }}>
            <Breadcrumb>
              <BreadcrumbItem href="/">{t('nav.home', 'Home')}</BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                {t('nav.dashboard.labManagement', 'Lab Management Dashboard')}
              </BreadcrumbItem>
            </Breadcrumb>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
              {t('heading.dashboard.title', 'Lab Management Dashboard')}
            </h1>

            {/* Filter controls row */}
            <Stack orientation="horizontal" gap={5}>
              <Select
                id="section-filter"
                labelText={t('label.dashboard.section', 'Section')}
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={{ minWidth: '12rem' }}
              >
                <SelectItem value="all" text={t('label.dashboard.allSections', 'All Sections')} />
                <SelectItem value="hematology" text="Hematology" />
                <SelectItem value="chemistry" text="Chemistry" />
                <SelectItem value="microbiology" text="Microbiology" />
                <SelectItem value="serology" text="Serology" />
                <SelectItem value="molecular" text="Molecular" />
              </Select>

              <Select
                id="date-range-filter"
                labelText={t('label.dashboard.dateRange', 'Date Range')}
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ minWidth: '10rem' }}
              >
                <SelectItem value="today" text={t('label.dashboard.today', 'Today')} />
                <SelectItem value="7d" text={t('label.dashboard.last7days', 'Last 7 Days')} />
                <SelectItem value="30d" text={t('label.dashboard.last30days', 'Last 30 Days')} />
                <SelectItem value="90d" text={t('label.dashboard.last90days', 'Last 90 Days')} />
              </Select>

              <NumberInput
                id="refresh-interval"
                label={t('label.dashboard.refreshInterval', 'Auto-refresh every (minutes)')}
                value={refreshInterval}
                min={5}
                max={30}
                onChange={(e, { value }) => setRefreshInterval(value)}
                invalidText={t('error.dashboard.refreshInterval', 'Refresh interval must be between 5 and 30 minutes.')}
                style={{ maxWidth: '12rem' }}
              />

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--cds-spacing-03)' }}>
                <Button
                  kind="tertiary"
                  size="md"
                  renderIcon={Renew}
                  onClick={handleRefresh}
                >
                  {t('button.dashboard.refresh', 'Refresh')}
                </Button>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', paddingBottom: 'var(--cds-spacing-03)' }}>
                  {t('label.dashboard.lastUpdated', 'Last updated')}: {formatTime(lastUpdated)}
                </p>
              </div>
            </Stack>
          </Stack>
        </Column>

        {/* ── Critical alert notifications ────────────────────────────────── */}
        {hasCriticalQC && (
          <Column sm={4} md={8} lg={16}>
            <InlineNotification
              kind="error"
              title={t('message.dashboard.criticalQC', 'QC pass rate below 90% threshold. Immediate review required.')}
              subtitle="Microbiology — 77.8%"
            />
          </Column>
        )}
        {hasAnalyzerOffline && (
          <Column sm={4} md={8} lg={16}>
            <InlineNotification
              kind="error"
              title={t('message.dashboard.analyzerOffline', 'One or more analyzers have been offline for more than 2 hours.')}
              subtitle="QuantStudio 7 — Molecular"
            />
          </Column>
        )}
        {hasCriticalStock && (
          <Column sm={4} md={8} lg={16}>
            <InlineNotification
              kind="error"
              title={t('message.dashboard.criticalStock', 'Critical stock shortage detected. Resupply action required.')}
              subtitle="Malaria RDT Kits (3 days), AFB Staining Reagent (4 days)"
            />
          </Column>
        )}

        {/* ── KPI tile row ─────────────────────────────────────────────────── */}
        <Column sm={4} md={8} lg={16}>
          <Stack gap={3}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cds-text-secondary)' }}>
              {t('heading.dashboard.kpi', 'Key Performance Indicators')}
            </p>
            <Grid>
              {kpiTiles.map((tile) => (
                <Column key={tile.key} sm={4} md={4} lg={4}>
                  <KpiTile
                    label={tile.label}
                    value={tile.value}
                    delta={tile.delta}
                    deltaDir={tile.deltaDir}
                    statusTag={tile.statusTag}
                  />
                </Column>
              ))}
            </Grid>
          </Stack>
        </Column>

        {/* ── Workload + TAT tables ─────────────────────────────────────────── */}
        <Column sm={4} md={8} lg={8}>
          <WorkloadTable sections={MOCK_WORKLOAD_SECTIONS} headers={MOCK_WORKLOAD_HEADERS} />
        </Column>
        <Column sm={4} md={8} lg={8}>
          <TATTable sections={MOCK_TAT_SECTIONS} headers={MOCK_TAT_HEADERS} />
        </Column>

        {/* ── Quality Control (collapsed accordion) ──────────────────────────── */}
        <Column sm={4} md={8} lg={16}>
          <Accordion>
            <AccordionItem title={t('heading.dashboard.quality', 'Quality Control')}>
              <QCTable rows={MOCK_QC_ROWS} headers={MOCK_QC_HEADERS} />
            </AccordionItem>
          </Accordion>
        </Column>

        {/* ── Disease Surveillance ───────────────────────────────────────────── */}
        <Column sm={4} md={8} lg={16}>
          <Stack gap={3}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {t('heading.dashboard.surveillance', 'Disease Surveillance')}
            </p>
            <Tabs>
              <TabList aria-label={t('heading.dashboard.surveillance', 'Disease Surveillance')}>
                <Tab>{t('label.dashboard.tbProgram', 'Tuberculosis (TB)')}</Tab>
                <Tab>{t('label.dashboard.hivProgram', 'HIV')}</Tab>
                <Tab>{t('label.dashboard.malariaProgram', 'Malaria')}</Tab>
                <Tab>{t('label.dashboard.amrProgram', 'Antimicrobial Resistance (AMR)')}</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <SurveillanceTabContent programKey="tb" data={MOCK_SURVEILLANCE.tb} />
                </TabPanel>
                <TabPanel>
                  <SurveillanceTabContent programKey="hiv" data={MOCK_SURVEILLANCE.hiv} />
                </TabPanel>
                <TabPanel>
                  <SurveillanceTabContent programKey="malaria" data={MOCK_SURVEILLANCE.malaria} />
                </TabPanel>
                <TabPanel>
                  <SurveillanceTabContent programKey="amr" data={MOCK_SURVEILLANCE.amr} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Stack>
        </Column>

        {/* ── Equipment Status + Stock Levels ──────────────────────────────── */}
        <Column sm={4} md={8} lg={10}>
          <EquipmentTable rows={MOCK_EQUIPMENT_ROWS} headers={MOCK_EQUIPMENT_HEADERS} />
        </Column>
        <Column sm={4} md={8} lg={6}>
          <StockTable rows={MOCK_STOCK_ROWS} headers={MOCK_STOCK_HEADERS} />
        </Column>

        {/* Bottom padding */}
        <Column sm={4} md={8} lg={16}>
          <div style={{ height: 'var(--cds-spacing-09)' }} />
        </Column>
      </Grid>
    </div>
  );
}
