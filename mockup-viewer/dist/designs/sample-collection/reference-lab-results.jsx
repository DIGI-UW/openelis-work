// Route: /SampleShipment/reference-lab-results
// SideNav: Sample Shipment → Reference Lab Results
// Breadcrumb: Home / Sample Shipment / Reference Lab Results
//
// Reference Lab Results — Carbon mockup
// Companion FRS: referral-redesign-frs.md
//
// IA convention: single-scroll page, ChipSet primary filter, NO Carbon Tabs.
// Visual conventions lifted from deployed /SampleShipment/* on testing.openelis-global.org

import React, { useState, useMemo, useCallback } from 'react';
import {
  Breadcrumb, BreadcrumbItem,
  Grid, Column, Stack,
  Tile,
  Tag,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableExpandHeader, TableExpandRow, TableExpandedRow,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  Button, OverflowMenu, OverflowMenuItem,
  InlineNotification,
  Modal,
  TextArea, Select, SelectItem,
  Dropdown, DatePicker, DatePickerInput, MultiSelect,
  StructuredListWrapper, StructuredListHead, StructuredListRow, StructuredListCell, StructuredListBody,
  Link as CarbonLink,
} from '@carbon/react';
import {
  ArrowRight, Warning, WarningAlt, CheckmarkFilled, ErrorFilled,
  Information, Time, Box, NotificationFilled,
} from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — realistic enough to evaluate the design
// ─────────────────────────────────────────────────────────────────────────────

const REFERENCE_LABS = [
  { id: 'org-cedres', name: 'CEDRES Reference Laboratory' },
  { id: 'org-ihrip', name: 'IHRIP Microbiology Centre' },
  { id: 'org-cphl', name: 'Central Public Health Laboratory' },
  { id: 'org-pasteur', name: 'Institut Pasteur Antananarivo' },
];

const REFERRALS = [
  // Outstanding — recent
  {
    id: 'R-7001', labNumber: 'L-2026-04123', patient: 'Rakoto, Jean (M, 42)',
    tests: ['HIV-1 RNA Viral Load'], referenceLab: 'org-cedres',
    boxId: 'BOX-2026-0312', sentDate: '2026-05-26T08:14:00Z', daysOut: 2,
    status: 'requested', priority: 'Routine', requestor: 'Dr. Andrianasolo, M.',
    fhirTaskUuid: 'urn:uuid:a2c4-7b9d-...-3f12', boxReceivedDate: null,
    activity: [
      { ts: '2026-05-26T08:14:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: 'Box dispatched' },
      { ts: '2026-05-26T07:55:00Z', actor: 'A. Razafy (Tech)', from: 'created', to: 'draft', notes: 'Refer Out flagged at Result Entry' },
    ],
  },
  {
    id: 'R-7002', labNumber: 'L-2026-04124', patient: 'Voahangy, Lalao (F, 28)',
    tests: ['HBV DNA Quantitative', 'HCV RNA Quantitative'],
    referenceLab: 'org-cedres', boxId: 'BOX-2026-0312',
    sentDate: '2026-05-26T08:14:00Z', daysOut: 2,
    status: 'received', priority: 'Routine', requestor: 'Dr. Andrianasolo, M.',
    fhirTaskUuid: 'urn:uuid:b8d1-3e72-...-91f4', boxReceivedDate: '2026-05-27T14:02:00Z',
    activity: [
      { ts: '2026-05-27T14:02:00Z', actor: 'CEDRES (peer)', from: 'requested', to: 'received', notes: 'Box scanned in at CEDRES receiving' },
      { ts: '2026-05-26T08:14:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: 'Box dispatched' },
    ],
  },
  {
    id: 'R-7003', labNumber: 'L-2026-04098', patient: 'Andriamasy, Pierre (M, 67)',
    tests: ['M. tuberculosis culture + AST'], referenceLab: 'org-ihrip',
    boxId: 'BOX-2026-0309', sentDate: '2026-05-22T09:30:00Z', daysOut: 6,
    status: 'in-progress', priority: 'Urgent', requestor: 'Dr. Rakotonirina, S.',
    fhirTaskUuid: 'urn:uuid:c1f9-2a4e-...-7b08', boxReceivedDate: '2026-05-23T11:45:00Z',
    activity: [
      { ts: '2026-05-24T08:30:00Z', actor: 'IHRIP (peer)', from: 'received', to: 'in-progress', notes: 'Culture set up' },
      { ts: '2026-05-23T11:45:00Z', actor: 'IHRIP (peer)', from: 'requested', to: 'received', notes: '' },
      { ts: '2026-05-22T09:30:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: 'Box dispatched' },
    ],
  },
  // Outstanding — STUCK >7 days
  {
    id: 'R-7004', labNumber: 'L-2026-03891', patient: 'Razanamparany, Marie (F, 35)',
    tests: ['Karyotyping — peripheral blood'], referenceLab: 'org-pasteur',
    boxId: 'BOX-2026-0297', sentDate: '2026-05-09T10:00:00Z', daysOut: 19,
    status: 'in-progress', priority: 'Routine', requestor: 'Dr. Ratsimbazafy, H.',
    fhirTaskUuid: 'urn:uuid:d4e2-9f81-...-4c93', boxReceivedDate: '2026-05-11T15:20:00Z',
    stuck: true,
    activity: [
      { ts: '2026-05-12T09:00:00Z', actor: 'Pasteur (peer)', from: 'received', to: 'in-progress', notes: 'Culture initiated' },
      { ts: '2026-05-11T15:20:00Z', actor: 'Pasteur (peer)', from: 'requested', to: 'received', notes: '' },
      { ts: '2026-05-09T10:00:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: 'Box dispatched' },
    ],
  },
  // Outstanding — STUCK >30 days
  {
    id: 'R-7005', labNumber: 'L-2026-02156', patient: 'Ramaroson, Henri (M, 58)',
    tests: ['Whole Exome Sequencing'], referenceLab: 'org-pasteur',
    boxId: 'BOX-2026-0214', sentDate: '2026-04-15T11:20:00Z', daysOut: 43,
    status: 'in-progress', priority: 'Urgent', requestor: 'Dr. Rajaonarivelo, T.',
    fhirTaskUuid: 'urn:uuid:e7a3-1b5c-...-2d68', boxReceivedDate: '2026-04-18T09:15:00Z',
    stuck: true, criticallyStuck: true,
    activity: [
      { ts: '2026-04-20T14:00:00Z', actor: 'Pasteur (peer)', from: 'received', to: 'in-progress', notes: 'Library prep started' },
      { ts: '2026-04-18T09:15:00Z', actor: 'Pasteur (peer)', from: 'requested', to: 'received', notes: '' },
      { ts: '2026-04-15T11:20:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: 'Box dispatched' },
    ],
  },

  // Returned — needs action
  {
    id: 'R-7006', labNumber: 'L-2026-04201', patient: 'Razafindrakoto, Aina (F, 31)',
    tests: ['HIV-1 RNA Viral Load'], referenceLab: 'org-cedres',
    boxId: 'BOX-2026-0314', sentDate: '2026-05-23T08:00:00Z', daysOut: 5,
    status: 'completed', priority: 'Routine', requestor: 'Dr. Andrianasolo, M.',
    returnedDate: '2026-05-28T07:42:00Z',
    fhirTaskUuid: 'urn:uuid:f9c2-4d8a-...-5e17', boxReceivedDate: '2026-05-24T10:30:00Z',
    diagnosticReportUuid: 'urn:uuid:g1h2-...-DR',
    resultSummary: '< 20 copies/mL (undetectable)',
    results: [
      { test: 'HIV-1 RNA Viral Load', value: '< 20', units: 'copies/mL', range: 'Undetectable: < 20', flag: 'Normal', notes: 'Below limit of quantification.' },
    ],
    activity: [
      { ts: '2026-05-28T07:42:00Z', actor: 'CEDRES (peer)', from: 'in-progress', to: 'completed', notes: 'DiagnosticReport received' },
      { ts: '2026-05-24T11:00:00Z', actor: 'CEDRES (peer)', from: 'received', to: 'in-progress', notes: '' },
      { ts: '2026-05-24T10:30:00Z', actor: 'CEDRES (peer)', from: 'requested', to: 'received', notes: '' },
      { ts: '2026-05-23T08:00:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: 'Box dispatched' },
    ],
  },
  {
    id: 'R-7007', labNumber: 'L-2026-04156', patient: 'Andriamampianina, Bako (M, 24)',
    tests: ['HBV DNA Quantitative', 'HCV RNA Quantitative'], referenceLab: 'org-cedres',
    boxId: 'BOX-2026-0314', sentDate: '2026-05-23T08:00:00Z', daysOut: 5,
    status: 'completed', priority: 'Routine', requestor: 'Dr. Rakotonirina, S.',
    returnedDate: '2026-05-28T07:55:00Z',
    fhirTaskUuid: 'urn:uuid:h2k4-...-7d12', boxReceivedDate: '2026-05-24T10:30:00Z',
    diagnosticReportUuid: 'urn:uuid:i3j4-...-DR',
    resultSummary: 'HBV: 2.1 × 10⁴ IU/mL  ·  HCV: not detected',
    results: [
      { test: 'HBV DNA Quantitative', value: '2.1 × 10⁴', units: 'IU/mL', range: '< 20 IU/mL undetectable', flag: 'Abnormal', notes: 'Active replication.' },
      { test: 'HCV RNA Quantitative', value: 'Not detected', units: 'IU/mL', range: '< 15 IU/mL', flag: 'Normal', notes: '' },
    ],
    activity: [
      { ts: '2026-05-28T07:55:00Z', actor: 'CEDRES (peer)', from: 'in-progress', to: 'completed', notes: 'DiagnosticReport received' },
      { ts: '2026-05-23T08:00:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: 'Box dispatched' },
    ],
  },
  {
    id: 'R-7008', labNumber: 'L-2026-04188', patient: 'Rabearisoa, Olivier (M, 51)',
    tests: ['Cryptococcal antigen (CrAg)'], referenceLab: 'org-cphl',
    boxId: 'BOX-2026-0311', sentDate: '2026-05-25T09:15:00Z', daysOut: 3,
    status: 'completed', priority: 'STAT', requestor: 'Dr. Ratsimbazafy, H.',
    returnedDate: '2026-05-27T18:20:00Z',
    fhirTaskUuid: 'urn:uuid:l5m6-...-9c87', boxReceivedDate: '2026-05-26T08:00:00Z',
    diagnosticReportUuid: 'urn:uuid:n7o8-...-DR',
    resultSummary: 'POSITIVE — titer 1:80',
    results: [
      { test: 'Cryptococcal antigen (CrAg)', value: 'POSITIVE', units: '— (titer 1:80)', range: 'Negative', flag: 'Critical', notes: 'Consistent with disseminated cryptococcosis. Recommend LP.' },
    ],
    activity: [
      { ts: '2026-05-27T18:20:00Z', actor: 'CPHL (peer)', from: 'in-progress', to: 'completed', notes: 'DiagnosticReport received — CRITICAL' },
      { ts: '2026-05-25T09:15:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: 'Box dispatched' },
    ],
  },

  // History — reconciled
  {
    id: 'R-7009', labNumber: 'L-2026-03997', patient: 'Razanadrakoto, Felana (F, 39)',
    tests: ['HIV-1 RNA Viral Load'], referenceLab: 'org-cedres',
    boxId: 'BOX-2026-0301', sentDate: '2026-05-18T08:30:00Z',
    status: 'reconciled', outcome: 'Reconciled', priority: 'Routine',
    closedDate: '2026-05-25T11:14:00Z', daysTotal: 7,
    requestor: 'Dr. Andrianasolo, M.',
    activity: [
      { ts: '2026-05-25T11:14:00Z', actor: 'P. Rasoanirina (Validator)', from: 'completed', to: 'reconciled', notes: 'Result accepted into local Analysis' },
      { ts: '2026-05-24T15:30:00Z', actor: 'CEDRES (peer)', from: 'in-progress', to: 'completed', notes: '' },
      { ts: '2026-05-18T08:30:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: '' },
    ],
  },
  // History — rejected
  {
    id: 'R-7010', labNumber: 'L-2026-03812', patient: 'Andriantsoa, Tahina (M, 19)',
    tests: ['Mycobacterium spp. molecular ID'], referenceLab: 'org-ihrip',
    boxId: 'BOX-2026-0286', sentDate: '2026-05-04T07:45:00Z',
    status: 'rejected', outcome: 'Rejected', priority: 'Routine',
    closedDate: '2026-05-09T13:00:00Z', daysTotal: 5,
    rejectReason: 'Insufficient volume (received 0.4 mL, need ≥ 2 mL). Resubmit with larger draw.',
    requestor: 'Dr. Rakotonirina, S.',
    activity: [
      { ts: '2026-05-09T13:00:00Z', actor: 'IHRIP (peer)', from: 'received', to: 'rejected', notes: 'Insufficient volume — 0.4 mL' },
      { ts: '2026-05-05T10:00:00Z', actor: 'IHRIP (peer)', from: 'requested', to: 'received', notes: '' },
      { ts: '2026-05-04T07:45:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: '' },
    ],
  },
  // History — cancelled
  {
    id: 'R-7011', labNumber: 'L-2026-03734', patient: 'Rakotomalala, Hery (M, 47)',
    tests: ['Karyotyping — peripheral blood'], referenceLab: 'org-pasteur',
    boxId: 'BOX-2026-0273', sentDate: '2026-04-27T09:00:00Z',
    status: 'cancelled', outcome: 'Cancelled', priority: 'Routine',
    closedDate: '2026-04-27T16:30:00Z', daysTotal: 0,
    cancelReason: 'Clinician withdrew request (treatment changed).',
    requestor: 'Dr. Rajaonarivelo, T.',
    activity: [
      { ts: '2026-04-27T16:30:00Z', actor: 'P. Rasoanirina (Validator)', from: 'draft', to: 'cancelled', notes: 'Clinician withdrew request' },
    ],
  },
  // History — manually entered (reference lab not on OpenELIS, called result by phone)
  {
    id: 'R-7013', labNumber: 'L-2026-03654', patient: 'Rafanomezantsoa, Lova (F, 44)',
    tests: ['CD4 absolute count'], referenceLab: 'org-cphl',
    boxId: 'BOX-2026-0265', sentDate: '2026-04-23T09:00:00Z',
    status: 'reconciled', outcome: 'Reconciled', priority: 'Routine',
    closedDate: '2026-05-01T14:22:00Z', daysTotal: 8, manuallyEntered: true,
    requestor: 'Dr. Andrianasolo, M.',
    activity: [
      { ts: '2026-05-01T14:22:00Z', actor: 'P. Rasoanirina (Validator)', from: 'requested', to: 'reconciled', notes: 'Result phoned in by CPHL — manually entered via Result Entry' },
      { ts: '2026-04-23T09:00:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: 'Box dispatched' },
    ],
  },
  // History — lost
  {
    id: 'R-7012', labNumber: 'L-2026-03551', patient: 'Razafindramanana, Soa (F, 62)',
    tests: ['HBsAg confirmatory'], referenceLab: 'org-cphl',
    boxId: 'BOX-2026-0258', sentDate: '2026-04-19T08:00:00Z',
    status: 'requested', outcome: 'Lost', priority: 'Routine',
    closedDate: '2026-05-02T10:00:00Z', daysTotal: 13, lostStatus: true,
    lostReason: 'Box never arrived at CPHL — courier confirmed loss. Sample re-collected and re-referred under L-2026-04201.',
    requestor: 'Dr. Andrianasolo, M.',
    activity: [
      { ts: '2026-05-02T10:00:00Z', actor: 'P. Rasoanirina (Validator)', from: 'requested', to: '(lost flag set)', notes: 'Marked lost — courier confirmed' },
      { ts: '2026-04-19T08:00:00Z', actor: 'A. Razafy (Tech)', from: 'draft', to: 'requested', notes: '' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const refLabName = (id) => REFERENCE_LABS.find((r) => r.id === id)?.name || id;

const statusTagKind = {
  draft: 'gray',
  requested: 'blue',
  received: 'purple',
  'in-progress': 'warm-gray',
  completed: 'teal',
  rejected: 'red',
  cancelled: 'gray',
  reconciled: 'teal',
};

const statusLabel = (s) => ({
  draft: 'Draft',
  requested: 'Sent — awaiting acceptance',
  received: 'At reference lab',
  'in-progress': 'In progress at reference lab',
  completed: 'Result returned',
  rejected: 'Rejected by reference lab',
  cancelled: 'Cancelled',
  reconciled: 'Reconciled',
}[s] || s);

const priorityTagKind = (p) => ({ Routine: 'gray', Urgent: 'warm-gray', STAT: 'red' }[p] || 'gray');

const outcomeTagKind = (o) => ({
  Reconciled: 'teal', Rejected: 'red', Cancelled: 'gray', Lost: 'red',
}[o] || 'gray');

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ReferenceLabResultsPage() {
  const [activeView, setActiveView] = useState('outstanding'); // outstanding | returned | history
  const [filterRefLab, setFilterRefLab] = useState(null);
  const [filterPriority, setFilterPriority] = useState([]);
  const [filterDaysBucket, setFilterDaysBucket] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [rejectModalRow, setRejectModalRow] = useState(null);
  const [markLostModalRow, setMarkLostModalRow] = useState(null);

  // Filter data
  const filtered = useMemo(() => {
    let rows = REFERRALS;
    if (activeView === 'outstanding') {
      rows = rows.filter((r) => ['requested', 'received', 'in-progress'].includes(r.status));
    } else if (activeView === 'returned') {
      rows = rows.filter((r) => r.status === 'completed');
    } else {
      rows = rows.filter((r) => ['reconciled', 'rejected', 'cancelled'].includes(r.status) || r.lostStatus);
    }
    if (filterRefLab) rows = rows.filter((r) => r.referenceLab === filterRefLab);
    if (filterPriority.length) rows = rows.filter((r) => filterPriority.includes(r.priority));
    if (activeView === 'outstanding' && filterDaysBucket !== 'all') {
      rows = rows.filter((r) => {
        if (filterDaysBucket === '0-7') return r.daysOut <= 7;
        if (filterDaysBucket === '7-30') return r.daysOut > 7 && r.daysOut <= 30;
        if (filterDaysBucket === '>30') return r.daysOut > 30;
        return true;
      });
    }
    return rows;
  }, [activeView, filterRefLab, filterPriority, filterDaysBucket]);

  const stuckCount = REFERRALS.filter((r) => r.stuck).length;

  // Metric counts (always reflect ALL data, not filtered)
  const counts = {
    outstanding: REFERRALS.filter((r) => ['requested', 'received', 'in-progress'].includes(r.status)).length,
    returned: REFERRALS.filter((r) => r.status === 'completed').length,
    reconciledToday: 1, // mocked
    rejectedThisWeek: REFERRALS.filter((r) => r.status === 'rejected').length,
  };

  const toggleExpand = useCallback((id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  }, []);

  const clearFilters = () => {
    setFilterRefLab(null);
    setFilterPriority([]);
    setFilterDaysBucket('all');
  };

  return (
    <div style={{ padding: '1rem 2rem', maxWidth: 1440, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="/">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem href="/SampleShipment/dashboard">{t('breadcrumb.sampleShipment', 'Sample Shipment')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('referral.breadcrumb.referenceLabResults', 'Reference Lab Results')}</BreadcrumbItem>
      </Breadcrumb>

      <h1 style={{ margin: '0.5rem 0 1.5rem 0' }}>{t('referral.page.title', 'Reference Lab Results')}</h1>

      {/* Aging banner */}
      {stuckCount > 0 && activeView === 'outstanding' && (
        <InlineNotification
          kind="warning"
          lowContrast
          hideCloseButton
          title={t('referral.banner.stuckReferralsTitle', 'Stuck referrals require attention')}
          subtitle={`${stuckCount} referrals have been at a reference lab for more than 7 days. Consider contacting the reference lab or reassigning.`}
          actions={
            <Button kind="ghost" size="sm" onClick={() => setFilterDaysBucket('>30')}>
              {t('referral.banner.filterToStuck', 'Filter to stuck only')}
            </Button>
          }
          style={{ marginBottom: '1rem', maxWidth: 'none' }}
        />
      )}

      {/* Metric tiles */}
      <Grid narrow style={{ marginBottom: '1.5rem' }}>
        <Column lg={4} md={4} sm={2}>
          <MetricTile
            color="#24a148"
            label="OUTSTANDING"
            count={counts.outstanding}
            onClick={() => { setActiveView('outstanding'); clearFilters(); }}
            active={activeView === 'outstanding'}
          />
        </Column>
        <Column lg={4} md={4} sm={2}>
          <MetricTile
            color="#da1e28"
            label="RETURNED — NEEDS ACTION"
            count={counts.returned}
            onClick={() => { setActiveView('returned'); clearFilters(); }}
            active={activeView === 'returned'}
          />
        </Column>
        <Column lg={4} md={4} sm={2}>
          <MetricTile
            color="#005d5d"
            label="RECONCILED TODAY"
            count={counts.reconciledToday}
            onClick={() => { setActiveView('history'); clearFilters(); }}
          />
        </Column>
        <Column lg={4} md={4} sm={2}>
          <MetricTile
            color="#8a3ffc"
            label="REJECTED THIS WEEK"
            count={counts.rejectedThisWeek}
            onClick={() => { setActiveView('history'); clearFilters(); }}
          />
        </Column>
      </Grid>

      {/* Primary filter — ChipSet (Carbon ChipSet not yet generally available; render as button group with cds--btn-set semantics) */}
      <div style={{ marginBottom: '1rem' }}>
        <Stack orientation="horizontal" gap={3}>
          <FilterChip active={activeView === 'outstanding'} onClick={() => setActiveView('outstanding')}>
            {t('referral.chip.outstanding', 'Outstanding')} ({counts.outstanding})
          </FilterChip>
          <FilterChip active={activeView === 'returned'} onClick={() => setActiveView('returned')}>
            {t('referral.chip.returned', 'Returned — needs action')} ({counts.returned})
          </FilterChip>
          <FilterChip active={activeView === 'history'} onClick={() => setActiveView('history')}>
            {t('referral.chip.history', 'History')}
          </FilterChip>
        </Stack>
      </div>

      {/* Secondary filters */}
      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f4f4f4' }}>
        <Grid narrow>
          <Column lg={4} md={4}>
            <Dropdown
              id="filter-ref-lab"
              titleText={t('referral.filter.referenceLab', 'Reference Lab')}
              label={t('referral.filter.allRefLabs', 'All reference labs')}
              items={[{ id: null, name: 'All reference labs' }, ...REFERENCE_LABS]}
              itemToString={(item) => (item ? item.name : '')}
              selectedItem={REFERENCE_LABS.find((r) => r.id === filterRefLab) || { id: null, name: 'All reference labs' }}
              onChange={({ selectedItem }) => setFilterRefLab(selectedItem?.id || null)}
            />
          </Column>
          <Column lg={4} md={4}>
            <DatePicker datePickerType="range">
              <DatePickerInput
                id="filter-date-from"
                labelText={t('referral.filter.dateRange', 'Date range')}
                placeholder="mm/dd/yyyy"
              />
              <DatePickerInput id="filter-date-to" labelText="" placeholder="mm/dd/yyyy" />
            </DatePicker>
          </Column>
          <Column lg={4} md={4}>
            <MultiSelect
              id="filter-priority"
              titleText={t('referral.filter.priority', 'Priority')}
              label={t('referral.filter.allPriorities', 'All priorities')}
              items={['Routine', 'Urgent', 'STAT']}
              itemToString={(i) => i}
              selectedItems={filterPriority}
              onChange={({ selectedItems }) => setFilterPriority(selectedItems)}
            />
          </Column>
          {activeView === 'outstanding' && (
            <Column lg={3} md={3}>
              <Select
                id="filter-days-bucket"
                labelText={t('referral.filter.daysOutstandingBucket', 'Days outstanding')}
                value={filterDaysBucket}
                onChange={(e) => setFilterDaysBucket(e.target.value)}
              >
                <SelectItem value="all" text="All" />
                <SelectItem value="0-7" text="0-7" />
                <SelectItem value="7-30" text="7-30" />
                <SelectItem value=">30" text=">30" />
              </Select>
            </Column>
          )}
          <Column lg={1} md={1}>
            <div style={{ paddingTop: '1.5rem' }}>
              <Button kind="ghost" size="sm" onClick={clearFilters}>
                {t('referral.action.clearFilters', 'Clear filters')}
              </Button>
            </div>
          </Column>
        </Grid>
      </div>

      {/* DataTable per active view */}
      {activeView === 'outstanding' && (
        <OutstandingTable
          rows={filtered}
          expandedRow={expandedRow}
          toggleExpand={toggleExpand}
          onMarkLost={(row) => setMarkLostModalRow(row)}
        />
      )}
      {activeView === 'returned' && (
        <ReturnedTable
          rows={filtered}
          expandedRow={expandedRow}
          toggleExpand={toggleExpand}
          onReject={(row) => setRejectModalRow(row)}
        />
      )}
      {activeView === 'history' && (
        <HistoryTable
          rows={filtered}
          expandedRow={expandedRow}
          toggleExpand={toggleExpand}
        />
      )}

      {/* Reject modal */}
      {rejectModalRow && (
        <RejectModal row={rejectModalRow} onClose={() => setRejectModalRow(null)} />
      )}
      {markLostModalRow && (
        <MarkLostModal row={markLostModalRow} onClose={() => setMarkLostModalRow(null)} />
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MetricTile — thick-left-border pattern lifted from deployed /SampleShipment/dashboard
// ─────────────────────────────────────────────────────────────────────────────
function MetricTile({ color, label, count, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'white',
        borderLeft: `6px solid ${color}`,
        padding: '1.25rem 1rem',
        textAlign: 'left',
        width: '100%',
        border: active ? `1px solid ${color}` : '1px solid #e0e0e0',
        borderLeft: `6px solid ${color}`,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <div style={{ fontSize: '2.5rem', fontWeight: 300, lineHeight: 1, color: '#161616' }}>{count}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#525252', marginTop: '0.5rem' }}>{label}</div>
    </button>
  );
}

// FilterChip — chip pattern (no Carbon Tabs)
function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? '#0f62fe' : 'white',
        color: active ? 'white' : '#161616',
        border: `1px solid ${active ? '#0f62fe' : '#8d8d8d'}`,
        borderRadius: '999px',
        padding: '0.375rem 1rem',
        fontSize: '0.875rem',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OutstandingTable
// ─────────────────────────────────────────────────────────────────────────────
function OutstandingTable({ rows, expandedRow, toggleExpand, onMarkLost }) {
  const headers = [
    { key: 'labNumber', header: 'Lab Number' },
    { key: 'patient', header: 'Patient' },
    { key: 'tests', header: 'Test(s)' },
    { key: 'referenceLab', header: 'Reference Lab' },
    { key: 'boxId', header: 'Box ID' },
    { key: 'sentDate', header: 'Sent Date' },
    { key: 'status', header: 'Status' },
    { key: 'daysOut', header: 'Days outstanding' },
    { key: 'priority', header: 'Priority' },
    { key: 'actions', header: '' },
  ];
  return (
    <TableContainer
      title={t('referral.table.outstanding.title', 'Outstanding referrals')}
      description={t('referral.table.outstanding.desc', `${rows.length} referrals at reference labs awaiting results`, { N: rows.length })}
    >
      <Table size="md">
        <TableHead>
          <TableRow>
            <TableExpandHeader />
            {headers.map((h) => <TableHeader key={h.key}>{h.header}</TableHeader>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={headers.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#525252' }}>
              {t('referral.emptyState', 'No referrals found for the selected filters.')}
            </TableCell></TableRow>
          )}
          {rows.map((row) => (
            <React.Fragment key={row.id}>
              <TableExpandRow isExpanded={expandedRow === row.id} onExpand={() => toggleExpand(row.id)}>
                <TableCell>{row.labNumber}</TableCell>
                <TableCell>{row.patient}</TableCell>
                <TableCell>
                  {row.tests.slice(0, 2).join(', ')}{row.tests.length > 2 && ` +${row.tests.length - 2} ${t('referral.testsOverflow', 'more')}`}
                </TableCell>
                <TableCell>{refLabName(row.referenceLab)}</TableCell>
                <TableCell><CarbonLink href={`/SampleShipment/box/${row.boxId}`}>{row.boxId}</CarbonLink></TableCell>
                <TableCell>{formatDate(row.sentDate)}</TableCell>
                <TableCell><Tag type={statusTagKind[row.status]} size="sm">{statusLabel(row.status)}</Tag></TableCell>
                <TableCell>
                  <span style={{
                    color: row.daysOut > 30 ? '#da1e28' : row.daysOut > 7 ? '#f1c21b' : '#161616',
                    fontWeight: row.stuck ? 600 : 400,
                  }}>
                    {row.stuck && <Warning size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
                    {t('referral.daysUnit', `${row.daysOut} ${row.daysOut === 1 ? 'day' : 'days'}`, { N: row.daysOut })}
                  </span>
                </TableCell>
                <TableCell><Tag type={priorityTagKind(row.priority)} size="sm">{row.priority}</Tag></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    kind="tertiary"
                    size="sm"
                    href={`/result?sampleId=${row.labNumber}`}
                    style={{
                      width: '88px',
                      whiteSpace: 'normal',
                      lineHeight: '1.15',
                      textAlign: 'center',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                    }}
                  >
                    {t('referral.action.enterResult', 'Enter result')}
                  </Button>
                </TableCell>
              </TableExpandRow>
              {expandedRow === row.id && (
                <TableExpandedRow colSpan={headers.length + 1}>
                  <ExpandPanel row={row} mode="outstanding" onMarkLost={onMarkLost} />
                </TableExpandedRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReturnedTable
// ─────────────────────────────────────────────────────────────────────────────
function ReturnedTable({ rows, expandedRow, toggleExpand, onReject }) {
  const headers = [
    { key: 'labNumber', header: 'Lab Number' },
    { key: 'patient', header: 'Patient' },
    { key: 'tests', header: 'Test(s)' },
    { key: 'referenceLab', header: 'Reference Lab' },
    { key: 'resultSummary', header: 'Result summary' },
    { key: 'returnedDate', header: 'Returned Date' },
    { key: 'requestor', header: 'Original requestor' },
    { key: 'actions', header: 'Actions' },
  ];
  return (
    <TableContainer
      title={t('referral.table.returned.title', 'Returned — needs action')}
      description={t('referral.table.returned.desc', `${rows.length} results awaiting reconciliation to local Analysis`, { N: rows.length })}
    >
      <Table size="md">
        <TableHead>
          <TableRow>
            <TableExpandHeader />
            {headers.map((h) => <TableHeader key={h.key}>{h.header}</TableHeader>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={headers.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#525252' }}>
              No returned results awaiting action.
            </TableCell></TableRow>
          )}
          {rows.map((row) => {
            const hasCritical = row.results?.some((r) => r.flag === 'Critical');
            return (
              <React.Fragment key={row.id}>
                <TableExpandRow isExpanded={expandedRow === row.id} onExpand={() => toggleExpand(row.id)}>
                  <TableCell>{row.labNumber}</TableCell>
                  <TableCell>{row.patient}</TableCell>
                  <TableCell>{row.tests.slice(0, 2).join(', ')}{row.tests.length > 2 && ` +${row.tests.length - 2} more`}</TableCell>
                  <TableCell>{refLabName(row.referenceLab)}</TableCell>
                  <TableCell>
                    {hasCritical && <Tag type="red" size="sm" style={{ marginRight: 6 }}>CRITICAL</Tag>}
                    {row.resultSummary}
                  </TableCell>
                  <TableCell>{formatDate(row.returnedDate)}</TableCell>
                  <TableCell>{row.requestor}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Stack orientation="horizontal" gap={2}>
                      <Button kind="primary" size="sm" onClick={() => { /* accept */ }}>{t('referral.action.accept', 'Accept')}</Button>
                      <Button kind="danger--ghost" size="sm" onClick={() => onReject(row)}>{t('referral.action.reject', 'Reject…')}</Button>
                    </Stack>
                  </TableCell>
                </TableExpandRow>
                {expandedRow === row.id && (
                  <TableExpandedRow colSpan={headers.length + 1}>
                    <ExpandPanel row={row} mode="returned" onReject={onReject} />
                  </TableExpandedRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HistoryTable
// ─────────────────────────────────────────────────────────────────────────────
function HistoryTable({ rows, expandedRow, toggleExpand }) {
  const headers = [
    { key: 'labNumber', header: 'Lab Number' },
    { key: 'patient', header: 'Patient' },
    { key: 'tests', header: 'Test(s)' },
    { key: 'referenceLab', header: 'Reference Lab' },
    { key: 'outcome', header: 'Outcome' },
    { key: 'closedDate', header: 'Closed date' },
    { key: 'boxId', header: 'Box ID' },
    { key: 'daysTotal', header: 'Days total' },
  ];
  return (
    <TableContainer
      title={t('referral.table.history.title', 'History')}
      description={t('referral.table.history.desc', `${rows.length} closed referrals`, { N: rows.length })}
    >
      <Table size="md">
        <TableHead>
          <TableRow>
            <TableExpandHeader />
            {headers.map((h) => <TableHeader key={h.key}>{h.header}</TableHeader>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={headers.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#525252' }}>
              No closed referrals match the selected filters.
            </TableCell></TableRow>
          )}
          {rows.map((row) => (
            <React.Fragment key={row.id}>
              <TableExpandRow isExpanded={expandedRow === row.id} onExpand={() => toggleExpand(row.id)}>
                <TableCell>{row.labNumber}</TableCell>
                <TableCell>{row.patient}</TableCell>
                <TableCell>{row.tests.slice(0, 2).join(', ')}{row.tests.length > 2 && ` +${row.tests.length - 2} more`}</TableCell>
                <TableCell>{refLabName(row.referenceLab)}</TableCell>
                <TableCell>
                  <Tag type={outcomeTagKind(row.outcome)} size="sm">{row.outcome}</Tag>
                  {row.manuallyEntered && <Tag type="warm-gray" size="sm" style={{ marginLeft: 4 }}>{t('referral.tag.manuallyEntered', 'Manually entered')}</Tag>}
                </TableCell>
                <TableCell>{formatDate(row.closedDate)}</TableCell>
                <TableCell><CarbonLink href={`/SampleShipment/box/${row.boxId}`}>{row.boxId}</CarbonLink></TableCell>
                <TableCell>{row.daysTotal} {row.daysTotal === 1 ? 'day' : 'days'}</TableCell>
              </TableExpandRow>
              {expandedRow === row.id && (
                <TableExpandedRow colSpan={headers.length + 1}>
                  <ExpandPanel row={row} mode="history" />
                </TableExpandedRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExpandPanel — shared inline-expand detail
// ─────────────────────────────────────────────────────────────────────────────
function ExpandPanel({ row, mode, onMarkLost, onReject }) {
  return (
    <div style={{ padding: '1.5rem', background: '#f4f4f4' }}>
      <Grid narrow>
        {/* Left: Original order context */}
        <Column lg={4} md={4} sm={4}>
          <h5 style={{ marginTop: 0 }}>{t('referral.expand.originalOrderContext', 'Original order context')}</h5>
          <DetailRow label="Lab Number" value={<CarbonLink href={`/Patient/${row.labNumber}`}>{row.labNumber}</CarbonLink>} />
          <DetailRow label="Patient" value={row.patient} />
          <DetailRow label="Tests" value={row.tests.join(', ')} />
          <DetailRow label="Original requestor" value={row.requestor} />
          <DetailRow label="Priority" value={<Tag type={priorityTagKind(row.priority)} size="sm">{row.priority}</Tag>} />
        </Column>

        {/* Middle: Reference lab transit */}
        <Column lg={4} md={4} sm={4}>
          <h5 style={{ marginTop: 0 }}>{t('referral.expand.referenceLabTransit', 'Reference lab transit')}</h5>
          <DetailRow label="Reference Lab" value={refLabName(row.referenceLab)} />
          <DetailRow label="Box ID" value={<CarbonLink href={`/SampleShipment/box/${row.boxId}`}>{row.boxId}</CarbonLink>} />
          <DetailRow label="Dispatched" value={formatDate(row.sentDate)} />
          <DetailRow label="Received at lab" value={formatDate(row.boxReceivedDate)} />
          <DetailRow label="FHIR Task" value={<code style={{ fontSize: '0.75rem' }}>{row.fhirTaskUuid}</code>} />
        </Column>

        {/* Right: Result (returned/history) or actions (outstanding) */}
        <Column lg={4} md={4} sm={4}>
          {mode === 'outstanding' && (
            <>
              <h5 style={{ marginTop: 0 }}>{t('referral.expand.statusDetail', 'Status detail')}</h5>
              <DetailRow label="Current status" value={<Tag type={statusTagKind[row.status]} size="sm">{statusLabel(row.status)}</Tag>} />
              <DetailRow label="Days outstanding" value={`${row.daysOut} days`} />
              {row.stuck && (
                <InlineNotification
                  kind="warning"
                  lowContrast
                  hideCloseButton
                  title="Stuck"
                  subtitle="Consider contacting the reference lab."
                  style={{ marginTop: '0.75rem', maxWidth: 'none' }}
                />
              )}
              <Stack orientation="horizontal" gap={2} style={{ marginTop: '1rem' }}>
                <Button
                  kind="primary"
                  size="sm"
                  href={`/result?sampleId=${row.labNumber}`}
                >
                  {t('referral.action.enterResult', 'Enter result')}
                </Button>
                <Button kind="ghost" size="sm" renderIcon={WarningAlt} onClick={() => onMarkLost(row)}>
                  {t('referral.action.markLost', 'Mark Lost')}
                </Button>
              </Stack>
            </>
          )}
          {mode === 'returned' && (
            <>
              <h5 style={{ marginTop: 0 }}>{t('referral.expand.result', 'Result')}</h5>
              {row.results?.map((res, i) => (
                <div key={i} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'white', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontWeight: 600 }}>{res.test}</div>
                  <div style={{ fontSize: '1.25rem', margin: '0.25rem 0' }}>{res.value} <span style={{ color: '#525252' }}>{res.units}</span></div>
                  <div style={{ fontSize: '0.75rem', color: '#525252' }}>{t('referral.result.referenceRange', 'Reference range:')} {res.range}</div>
                  {res.flag && <Tag type={res.flag === 'Critical' ? 'red' : res.flag === 'Abnormal' ? 'warm-gray' : 'green'} size="sm" style={{ marginTop: 4 }}>{res.flag}</Tag>}
                  {res.notes && <div style={{ fontSize: '0.75rem', marginTop: 4, fontStyle: 'italic' }}>{res.notes}</div>}
                </div>
              ))}
              <Stack orientation="horizontal" gap={2}>
                <Button kind="primary" size="sm" renderIcon={CheckmarkFilled}>{t('referral.action.acceptToAnalysis', 'Accept to Analysis')}</Button>
                <Button kind="danger--ghost" size="sm" onClick={() => onReject(row)}>{t('referral.action.reject', 'Reject…')}</Button>
                <Button kind="ghost" size="sm" href={`/result?sampleId=${row.labNumber}`}>{t('referral.action.openInResultEntry', 'Open in Result Entry')}</Button>
              </Stack>
            </>
          )}
          {mode === 'history' && (
            <>
              <h5 style={{ marginTop: 0 }}>{t('referral.expand.outcomeDetail', 'Outcome detail')}</h5>
              <DetailRow label="Outcome" value={<Tag type={outcomeTagKind(row.outcome)} size="sm">{row.outcome}</Tag>} />
              <DetailRow label="Closed" value={formatDate(row.closedDate)} />
              <DetailRow label="Total days" value={`${row.daysTotal} days`} />
              {row.rejectReason && <DetailRow label="Rejection reason" value={row.rejectReason} />}
              {row.cancelReason && <DetailRow label="Cancellation reason" value={row.cancelReason} />}
              {row.lostReason && <DetailRow label="Lost reason" value={row.lostReason} />}
            </>
          )}
        </Column>
      </Grid>

      {/* Activity log */}
      <div style={{ marginTop: '1.5rem' }}>
        <h5>{t('referral.expand.activityLog', 'Activity log')}</h5>
        <StructuredListWrapper isCondensed>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>Timestamp</StructuredListCell>
              <StructuredListCell head>Actor</StructuredListCell>
              <StructuredListCell head>From</StructuredListCell>
              <StructuredListCell head>To</StructuredListCell>
              <StructuredListCell head>Notes</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            {row.activity?.map((a, i) => (
              <StructuredListRow key={i}>
                <StructuredListCell>{formatDate(a.ts)}</StructuredListCell>
                <StructuredListCell>{a.actor}</StructuredListCell>
                <StructuredListCell>{a.from}</StructuredListCell>
                <StructuredListCell>{a.to}</StructuredListCell>
                <StructuredListCell>{a.notes || '—'}</StructuredListCell>
              </StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid #e0e0e0', fontSize: '0.875rem' }}>
      <span style={{ color: '#525252' }}>{label}</span>
      <span style={{ textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reject modal
// ─────────────────────────────────────────────────────────────────────────────
function RejectModal({ row, onClose }) {
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');
  return (
    <Modal
      open
      modalHeading={t('referral.reject.modalTitle', 'Reject referral')}
      primaryButtonText={t('referral.reject.confirmButton', 'Reject and notify clinician')}
      secondaryButtonText="Cancel"
      danger
      onRequestClose={onClose}
      onRequestSubmit={onClose}
    >
      <div style={{ marginBottom: '1rem' }}>
        <strong>{row.labNumber}</strong> — {row.patient}<br />
        <span style={{ color: '#525252' }}>{row.tests.join(', ')} → {refLabName(row.referenceLab)}</span>
      </div>
      <Select id="reject-reason-code" labelText={t('referral.reject.preFilledReasonLabel', 'Common reason (optional)')} value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
        <SelectItem value="" text="— Select reason —" />
        <SelectItem value="insufficientVolume" text="Insufficient volume" />
        <SelectItem value="wrongSampleType" text="Wrong sample type" />
        <SelectItem value="damagedContainer" text="Damaged container" />
        <SelectItem value="temperatureDeviation" text="Temperature deviation" />
        <SelectItem value="hemolyzed" text="Hemolyzed" />
        <SelectItem value="clotted" text="Clotted" />
        <SelectItem value="mislabeled" text="Mislabeled" />
        <SelectItem value="other" text="Other" />
      </Select>
      <TextArea
        id="reject-reason-text"
        labelText={t('referral.reject.reasonLabel', 'Reason for rejection')}
        placeholder={t('referral.reject.reasonPlaceholder', 'Describe why this referral is being rejected')}
        value={reasonText}
        onChange={(e) => setReasonText(e.target.value)}
        rows={3}
        maxCount={500}
        enableCounter
        style={{ marginTop: '1rem' }}
      />
      <InlineNotification
        kind="warning"
        lowContrast
        hideCloseButton
        title={t('referral.reject.warningTitle', 'This closes the Analysis as rejected')}
        subtitle={t('referral.reject.warning', 'Rejecting closes the Analysis as terminal-rejected. The requesting clinician will be notified to arrange re-collection. A new order will be needed when a fresh sample is collected.')}
        style={{ marginTop: '1rem', maxWidth: 'none' }}
      />
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mark Lost modal
// ─────────────────────────────────────────────────────────────────────────────
function MarkLostModal({ row, onClose }) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open
      modalHeading={t('referral.markLost.modalTitle', 'Mark referral lost in transit')}
      primaryButtonText="Mark Lost"
      secondaryButtonText="Cancel"
      danger
      onRequestClose={onClose}
      onRequestSubmit={onClose}
    >
      <div style={{ marginBottom: '1rem' }}>
        <strong>{row.labNumber}</strong> — {row.patient}<br />
        <span style={{ color: '#525252' }}>Box {row.boxId} → {refLabName(row.referenceLab)}</span>
      </div>
      <TextArea
        id="lost-reason"
        labelText={t('referral.markLost.reasonLabel', 'Reason')}
        placeholder="What happened to the sample?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
      />
      <InlineNotification
        kind="warning"
        lowContrast
        hideCloseButton
        title="Reversible only by an administrator"
        subtitle={t('referral.markLost.warning', 'Marking this referral as lost is reversible only by an administrator.')}
        style={{ marginTop: '1rem', maxWidth: 'none' }}
      />
    </Modal>
  );
}
