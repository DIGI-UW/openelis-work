import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid,
  Column,
  Stack,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  ProgressIndicator,
  ProgressStep,
  Accordion,
  AccordionItem,
  Checkbox,
  DatePicker,
  DatePickerInput,
  MultiSelect,
  ComboBox,
  TextInput,
  Button,
  Tag,
  InlineNotification,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  OverflowMenu,
  OverflowMenuItem,
  Pagination,
  Breadcrumb,
  BreadcrumbItem,
  Modal,
  Tile,
  SkeletonText,
  DefinitionTooltip,
} from '@carbon/react';
import {
  Download,
  Renew,
  Close,
  Locked,
  Add,
  ChevronRight,
  ChevronLeft,
  DocumentExport,
} from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// i18n helper — replace with real translation function in production
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Grain families (FRS v1.1 §4.1) — an export draws from exactly one family.
// Color coding uses Carbon Tag kinds, applied consistently across the legend,
// group-header chips, selection summary, and review step.
// ---------------------------------------------------------------------------
const FAMILIES = {
  SAMPLE_TESTING: {
    label: t('label.dataExport.family.sampleTesting', 'Sample & Testing'),
    tagKind: 'blue',
    desc: t('label.dataExport.family.desc.sampleTesting', 'Orders, results, patients & turnaround times · one row per test result'),
    dateAnchor: 'sample collection date',
  },
  REFERRAL: {
    label: t('label.dataExport.family.referral', 'Referrals'),
    tagKind: 'teal',
    desc: t('label.dataExport.family.desc.referral', 'Tests referred to other labs · one row per referred analysis'),
    dateAnchor: 'referral sent date',
  },
  NON_CONFORMANCE: {
    label: t('label.dataExport.family.nonConformance', 'Non-Conformance'),
    tagKind: 'magenta',
    desc: t('label.dataExport.family.desc.nonConformance', 'Rejected samples & non-conforming events · one row per event'),
    dateAnchor: 'rejection / NCE date',
  },
};

const PII_TOOLTIP = t(
  'tooltip.dataExport.piiTag',
  'Contains patient-identifying data — requires additional permission; exports including these fields are audited',
);

// ---------------------------------------------------------------------------
// Variable catalog — seven domains across three grain families.
// (Quality Control domain removed in v1.1 — no structured QC data model.)
// UI shows display names only; derivation/sourcing notes live in the FRS.
// ---------------------------------------------------------------------------
const VARIABLE_DOMAINS = [
  {
    id: 'SAMPLE_ORDER',
    family: 'SAMPLE_TESTING',
    label: t('label.dataExport.domain.sampleOrder', 'Sample / Order'),
    piiTier: null,
    variables: [
      { key: 'accessionNumber', label: 'Accession Number' },
      { key: 'collectionDate', label: 'Collection Date' },
      { key: 'collectionTime', label: 'Collection Time' },
      { key: 'receivedDate', label: 'Received Date' },
      { key: 'receivedTime', label: 'Received Time' },
      { key: 'orderDate', label: 'Order Date' },
      { key: 'sampleType', label: 'Sample Type' },
      { key: 'sampleStatus', label: 'Sample Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'referringSite', label: 'Referring Site / Facility' },
      { key: 'requestingProvider', label: 'Requesting Provider' },
      { key: 'labSection', label: 'Lab Section' },
      { key: 'numberOfTests', label: 'Number of Tests Ordered' },
    ],
  },
  {
    id: 'TEST_RESULTS',
    family: 'SAMPLE_TESTING',
    label: t('label.dataExport.domain.testResults', 'Test Results'),
    piiTier: null,
    variables: [
      { key: 'testName', label: 'Test Name' },
      { key: 'loincCode', label: 'LOINC Code' },
      { key: 'resultValue', label: 'Result Value' },
      { key: 'resultUnit', label: 'Result Unit' },
      { key: 'referenceRange', label: 'Reference Range' },
      { key: 'resultStatus', label: 'Result Status' },
      { key: 'abnormalFlag', label: 'Abnormal Flag' },
      { key: 'dateResulted', label: 'Date Resulted' },
      { key: 'enteredBy', label: 'Entered By (Technician)' },
      { key: 'validatedBy', label: 'Validated By' },
      { key: 'validationDate', label: 'Validation Date' },
      { key: 'resultNotes', label: 'Result Notes / Comments' },
    ],
  },
  {
    id: 'PATIENT_DEMOGRAPHICS',
    family: 'SAMPLE_TESTING',
    label: t('label.dataExport.domain.patientDemographics', 'Patient Demographics'),
    piiTier: 'DEMOGRAPHICS',
    permissionKey: 'DATA_EXPORT_PII_DEMOGRAPHICS',
    variables: [
      { key: 'patientName', label: 'Patient Name' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'sex', label: 'Sex / Gender' },
    ],
  },
  {
    id: 'PATIENT_IDENTIFIERS',
    family: 'SAMPLE_TESTING',
    label: t('label.dataExport.domain.patientIdentifiers', 'Patient Identifiers'),
    piiTier: 'IDENTIFIERS',
    permissionKey: 'DATA_EXPORT_PII_IDENTIFIERS',
    variables: [
      { key: 'nationalId', label: 'National / External ID' },
      { key: 'programPatientCode', label: 'Program Patient Code' },
      { key: 'programEnrollment', label: 'Program Enrollment' },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'address', label: 'Address' },
    ],
  },
  {
    id: 'TURNAROUND_TIME',
    family: 'SAMPLE_TESTING',
    label: t('label.dataExport.domain.turnaroundTime', 'Turnaround Time'),
    piiTier: null,
    variables: [
      { key: 'orderToResultMinutes', label: 'Order to Result (min)' },
      { key: 'receivedToValidatedMinutes', label: 'Received to Validated (min)' },
      { key: 'orderToCollectionMinutes', label: 'Order to Collection (min)' },
      { key: 'collectionToReceivedMinutes', label: 'Collection to Received (min)' },
      { key: 'resultedToValidatedMinutes', label: 'Resulted to Validated (min)' },
    ],
  },
  {
    id: 'REFERRALS',
    family: 'REFERRAL',
    label: t('label.dataExport.domain.referrals', 'Referrals'),
    piiTier: null,
    variables: [
      { key: 'referralAccessionNumber', label: 'Accession Number' },
      { key: 'referringLab', label: 'Referring Lab' },
      { key: 'referredTestName', label: 'Referred Test Name' },
      { key: 'referralDate', label: 'Referral Date' },
      { key: 'referralResultValue', label: 'Referral Result Value' },
      { key: 'referralResultDate', label: 'Referral Result Date' },
      { key: 'referralStatus', label: 'Referral Status' },
    ],
  },
  {
    id: 'NON_CONFORMANCE',
    family: 'NON_CONFORMANCE',
    label: t('label.dataExport.domain.nonConformance', 'Non-Conformance / Rejections'),
    piiTier: null,
    variables: [
      { key: 'ncAccessionNumber', label: 'Accession Number' },
      { key: 'rejectionReason', label: 'Rejection Reason' },
      { key: 'rejectionDate', label: 'Rejection Date' },
      { key: 'rejectionStage', label: 'Rejection Stage' },
      { key: 'rejectedBy', label: 'Rejected By' },
    ],
  },
];

// key -> { family, label } lookup for fast family resolution
const VAR_INDEX = {};
VARIABLE_DOMAINS.forEach((d) =>
  d.variables.forEach((v) => { VAR_INDEX[v.key] = { family: d.family, label: v.label, domain: d.label }; }),
);

const familyOfSelection = (selectedVars) => {
  const first = selectedVars.values().next().value;
  return first ? VAR_INDEX[first].family : null;
};

// ---------------------------------------------------------------------------
// Mock saved configurations (each belongs to a single grain family)
// ---------------------------------------------------------------------------
const MOCK_SAVED_CONFIGS = [
  {
    id: '1',
    name: 'Hematology Monthly TAT',
    selectedVars: new Set(['accessionNumber', 'collectionDate', 'testName', 'resultValue', 'orderToResultMinutes', 'receivedToValidatedMinutes']),
  },
  {
    id: '2',
    name: 'HIV Program Monthly Extract',
    selectedVars: new Set(['accessionNumber', 'testName', 'resultValue', 'abnormalFlag', 'validationDate', 'patientName', 'programPatientCode']),
  },
  {
    id: '3',
    name: 'Rejections Monthly Review',
    selectedVars: new Set(['ncAccessionNumber', 'rejectionReason', 'rejectionDate', 'rejectionStage', 'rejectedBy']),
  },
];

// ---------------------------------------------------------------------------
// Mock data — user permissions (toggle to test locked state)
// ---------------------------------------------------------------------------
const USER_PERMISSIONS = {
  DATA_EXPORT: true,
  DATA_EXPORT_PII_DEMOGRAPHICS: true,  // set false to test locked state
  DATA_EXPORT_PII_IDENTIFIERS: false,  // false to show locked Identifiers group
};

const USER_LAB_SECTIONS = [
  { id: '1', label: 'Hematology' },
  { id: '2', label: 'Microbiology' },
  { id: '3', label: 'Clinical Chemistry' },
  { id: '4', label: 'Immunology' },
  { id: '5', label: 'Serology' },
];

// Status filter values mapped to OpenELIS StatusService (FRS v1.1 §4.2)
const SAMPLE_STATUSES = [
  { id: 'ENTERED', label: 'Received' },
  { id: 'STARTED', label: 'In Progress' },
  { id: 'FINISHED', label: 'Completed' },
  { id: 'CANCELED', label: 'Cancelled' },
];

const RESULT_STATUSES = [
  { id: 'TECHNICAL_ACCEPTANCE', label: 'Preliminary (technically accepted)' },
  { id: 'FINALIZED', label: 'Validated (finalized)' },
  { id: 'CORRECTED', label: 'Corrected' },
];

const PRIORITIES = [
  { id: 'ROUTINE', label: 'Routine' },
  { id: 'URGENT', label: 'Urgent' },
  { id: 'STAT', label: 'STAT' },
];

const REFERRING_SITES = [
  'CHU Antananarivo', 'Clinique Privée Nord', 'Hôpital de District Avaradrano',
  'CSB Ambohimangakely', 'Centre Médical SALFA',
];

// ---------------------------------------------------------------------------
// Mock queue data
// ---------------------------------------------------------------------------
const MOCK_QUEUE = [
  {
    id: '1',
    jobName: 'Hematology TAT Q1 2026',
    domains: 'Sample/Order, Test Results, Turnaround Time',
    dateRange: '2026-01-01 – 2026-03-31',
    submittedAt: '2026-07-14 09:14',
    jobStatus: 'READY',
    rowsFileSummary: '4,312 rows · 847 KB',
  },
  {
    id: '2',
    jobName: 'HIV Program Data Extract',
    domains: 'Test Results, Patient Demographics',
    dateRange: '2026-06-01 – 2026-06-30',
    submittedAt: '2026-07-14 08:52',
    jobStatus: 'GENERATING',
    rowsFileSummary: '~2 min wait',
  },
  {
    id: '3',
    jobName: 'Microbiology Rejections Feb',
    domains: 'Non-Conformance',
    dateRange: '2026-02-01 – 2026-02-28',
    submittedAt: '2026-07-14 16:30',
    jobStatus: 'QUEUED',
    rowsFileSummary: '~5 min wait',
  },
  {
    id: '4',
    jobName: 'Referrals Extract — May 2026',
    domains: 'Referrals',
    dateRange: '2026-05-01 – 2026-05-31',
    submittedAt: '2026-07-13 14:05',
    jobStatus: 'FAILED',
    rowsFileSummary: '—',
  },
  {
    id: '5',
    jobName: 'Serology Workload Dec 2025',
    domains: 'Sample/Order, Turnaround Time',
    dateRange: '2025-12-01 – 2025-12-31',
    submittedAt: '2026-06-30 11:22',
    jobStatus: 'EXPIRED',
    rowsFileSummary: '11,204 rows · 2.1 MB',
  },
];

const QUEUE_HEADERS = [
  { key: 'jobName', header: t('label.dataExport.jobName', 'Job Name') },
  { key: 'domains', header: t('label.dataExport.domains', 'Domains') },
  { key: 'dateRange', header: t('label.dataExport.dateRange', 'Date Range') },
  { key: 'submittedAt', header: t('label.dataExport.submittedAt', 'Submitted At') },
  { key: 'status', header: t('label.dataExport.status', 'Status') },
  { key: 'rowsFileSummary', header: t('label.dataExport.rowsFileSize', 'Rows / File Size') },
  { key: 'actions', header: '' },
];

// ---------------------------------------------------------------------------
// Status Tag helper
// ---------------------------------------------------------------------------
function StatusTag({ status }) {
  const map = {
    READY: { kind: 'green', label: t('label.dataExport.status.ready', 'Ready') },
    GENERATING: { kind: 'blue', label: t('label.dataExport.status.generating', 'Generating') },
    QUEUED: { kind: 'purple', label: t('label.dataExport.status.queued', 'Queued') },
    FAILED: { kind: 'red', label: t('label.dataExport.status.failed', 'Failed') },
    EXPIRED: { kind: 'gray', label: t('label.dataExport.status.expired', 'Expired') },
    CANCELLED: { kind: 'warm-gray', label: t('label.dataExport.status.cancelled', 'Cancelled') },
  };
  const { kind, label } = map[status] || { kind: 'gray', label: status };
  return <Tag kind={kind}>{label}</Tag>;
}

// ---------------------------------------------------------------------------
// Family legend (FRS v1.1 FR-1-009) — teaches the one-family rule up front
// ---------------------------------------------------------------------------
function FamilyLegend({ activeFamily }) {
  return (
    <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-03)', color: '#161616' }}>
        {t('heading.dataExport.familyLegend', 'Export families')}{' '}
        <span style={{ fontWeight: 400, color: '#525252' }}>
          — {t('label.dataExport.familyLegend.subtitle', 'an export draws from one family; picking a variable locks the others')}
        </span>
      </p>
      <Stack gap={2}>
        {Object.entries(FAMILIES).map(([fid, fam]) => {
          const dimmed = activeFamily && activeFamily !== fid;
          const active = activeFamily === fid;
          return (
            <Stack key={fid} orientation="horizontal" gap={3} style={{ alignItems: 'center', opacity: dimmed ? 0.35 : 1 }}>
              <Tag kind={fam.tagKind} size="sm">{fam.label}</Tag>
              <span style={{ fontSize: '0.75rem', color: active ? '#161616' : '#525252', fontWeight: active ? 600 : 400 }}>
                {fam.desc}
              </span>
            </Stack>
          );
        })}
      </Stack>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Variable Selection
// ---------------------------------------------------------------------------
function VariableSelector({ selectedVars, onChange }) {
  const totalSelected = selectedVars.size;
  const activeFamily = familyOfSelection(selectedVars);

  const toggleVar = useCallback((key) => {
    const next = new Set(selectedVars);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  }, [selectedVars, onChange]);

  const toggleDomain = useCallback((domain, selectAll) => {
    const next = new Set(selectedVars);
    domain.variables.forEach(v => {
      if (selectAll) next.add(v.key);
      else next.delete(v.key);
    });
    onChange(next);
  }, [selectedVars, onChange]);

  const domainSelectedCount = (domain) =>
    domain.variables.filter(v => selectedVars.has(v.key)).length;

  const selectedList = useMemo(
    () => [...selectedVars].map(k => ({ key: k, ...VAR_INDEX[k] })),
    [selectedVars],
  );

  return (
    <div>
      {/* Family legend */}
      <FamilyLegend activeFamily={activeFamily} />

      {/* Helper banner: intro before lock, escape hatch after (FR-1-008) */}
      {activeFamily ? (
        <InlineNotification
          kind="info"
          lowContrast
          hideCloseButton
          title={t('label.dataExport.family.activeExport', `${FAMILIES[activeFamily].label} export`)}
          subtitle={t(
            'message.dataExport.familyLockedBanner',
            `You're building a ${FAMILIES[activeFamily].label} export. The other families are locked — clear your selections to switch.`,
          )}
          actions={
            <Button kind="ghost" size="sm" onClick={() => onChange(new Set())}>
              {t('button.dataExport.clearSelections', 'Clear all selections')}
            </Button>
          }
          style={{ marginBottom: 'var(--cds-spacing-05)', maxWidth: '100%' }}
        />
      ) : (
        <p style={{ color: '#525252', marginBottom: 'var(--cds-spacing-05)', fontSize: '0.875rem' }}>
          Select the variables you want in your export. PII fields require additional permissions.
        </p>
      )}

      {/* Selection summary — labels as dismissible tags + count (Constitution II) */}
      {totalSelected > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center', marginBottom: 'var(--cds-spacing-05)' }}>
          <Tag kind={FAMILIES[activeFamily].tagKind} size="sm" type="high-contrast">
            {FAMILIES[activeFamily].label} export
          </Tag>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#525252' }}>
            {t('label.dataExport.variablesSelected', `${totalSelected} variables selected`).replace('{count}', totalSelected)}:
          </span>
          {selectedList.map(v => (
            <Tag key={v.key} filter size="sm" onClose={() => toggleVar(v.key)} title={`Remove ${v.label}`}>
              {v.label}
            </Tag>
          ))}
        </div>
      )}

      <Accordion>
        {VARIABLE_DOMAINS.map((domain) => {
          const piiLocked = domain.piiTier !== null && !USER_PERMISSIONS[domain.permissionKey];
          const familyLocked = activeFamily !== null && domain.family !== activeFamily;
          const isLocked = piiLocked || familyLocked;
          const fam = FAMILIES[domain.family];
          const selectedCount = domainSelectedCount(domain);
          const allSelected = selectedCount === domain.variables.length;
          const someSelected = selectedCount > 0 && !allSelected;

          return (
            <AccordionItem
              key={domain.id}
              open={!isLocked}
              disabled={isLocked}
              title={
                <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
                  {isLocked && <Locked size={16} style={{ color: '#8d8d8d', flexShrink: 0 }} />}
                  <span style={{ fontWeight: 600 }}>{domain.label}</span>
                  <Tag kind={fam.tagKind} size="sm">{fam.label}</Tag>
                  {domain.piiTier && (
                    <DefinitionTooltip definition={PII_TOOLTIP} openOnHover>
                      <Tag kind="red" size="sm">{t('label.dataExport.piiTag', 'PII')}</Tag>
                    </DefinitionTooltip>
                  )}
                  {selectedCount > 0 && <Tag kind="gray" size="sm">{selectedCount}/{domain.variables.length}</Tag>}
                  {familyLocked && (
                    <span style={{ fontSize: '0.75rem', color: '#8d8d8d', fontStyle: 'italic' }}>
                      Not available with {FAMILIES[activeFamily].label} variables
                    </span>
                  )}
                  {piiLocked && !familyLocked && (
                    <span style={{ fontSize: '0.75rem', color: '#8d8d8d', fontStyle: 'italic' }}>
                      Requires {domain.permissionKey} — visible but locked
                    </span>
                  )}
                </Stack>
              }
            >
              <Stack gap={3} style={{ padding: '0 var(--cds-spacing-05) var(--cds-spacing-05)' }}>
                {/* Select All */}
                <Checkbox
                  id={`selectAll-${domain.id}`}
                  labelText={t('label.dataExport.selectAll', 'Select All')}
                  checked={allSelected}
                  indeterminate={someSelected}
                  disabled={isLocked}
                  onChange={(_, { checked }) => toggleDomain(domain, checked)}
                />
                <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 'var(--cds-spacing-03)' }} />
                <Grid condensed>
                  {domain.variables.map((v) => (
                    <Column key={v.key} lg={8} md={4} sm={4}>
                      <Checkbox
                        id={`var-${v.key}`}
                        labelText={v.label}
                        checked={selectedVars.has(v.key)}
                        disabled={isLocked}
                        onChange={() => toggleVar(v.key)}
                      />
                    </Column>
                  ))}
                </Grid>
              </Stack>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Filters
// ---------------------------------------------------------------------------
function FilterStep({ filters, onChange }) {
  const activeFamily = familyOfSelection(filters.selectedVars || new Set());
  const hasTestResults = filters.selectedVars &&
    [...filters.selectedVars].some(k => VAR_INDEX[k]?.domain === 'Test Results');

  const update = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <Stack gap={6}>
      {/* Date Range */}
      <div>
        <h4 style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-04)', fontSize: '0.875rem', color: '#161616' }}>
          Date Range *
        </h4>
        <p style={{ fontSize: '0.75rem', color: '#525252', marginBottom: 'var(--cds-spacing-04)' }}>
          Filters on the <strong>{activeFamily ? FAMILIES[activeFamily].dateAnchor : 'sample collection date'}</strong> for this export.
          Maximum range 90 days.
        </p>
        <Grid condensed>
          <Column lg={6} md={4} sm={4}>
            <DatePicker datePickerType="single" onChange={([date]) => update('dateFrom', date)}>
              <DatePickerInput
                id="date-from"
                placeholder="mm/dd/yyyy"
                labelText={t('label.dataExport.dateFrom', 'Date From')}
                required
              />
            </DatePicker>
          </Column>
          <Column lg={6} md={4} sm={4}>
            <DatePicker datePickerType="single" onChange={([date]) => update('dateTo', date)}>
              <DatePickerInput
                id="date-to"
                placeholder="mm/dd/yyyy"
                labelText={t('label.dataExport.dateTo', 'Date To')}
                required
                invalid={filters.dateRangeError}
                invalidText={t('error.dataExport.invalidDateRange', 'Date To must be on or after Date From.')}
              />
            </DatePicker>
          </Column>
        </Grid>
      </div>

      {/* Lab Sections */}
      <div>
        <MultiSelect
          id="lab-sections"
          titleText={t('label.dataExport.labSections', 'Lab Sections')}
          helperText={t('label.dataExport.allSections', 'Leave blank to include all accessible sections.')}
          label={t('placeholder.dataExport.labSections', 'Select lab sections...')}
          items={USER_LAB_SECTIONS}
          itemToString={(item) => item?.label || ''}
          onChange={({ selectedItems }) => update('labSections', selectedItems)}
        />
      </div>

      {/* Optional Filters */}
      <div>
        <h4 style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-04)', fontSize: '0.875rem', color: '#161616' }}>
          Optional Filters
        </h4>
        <Grid condensed>
          {activeFamily === 'SAMPLE_TESTING' && (
            <Column lg={8} md={4} sm={4}>
              <MultiSelect
                id="sample-status"
                titleText={t('label.dataExport.sampleStatus', 'Sample Status')}
                label="All statuses"
                items={SAMPLE_STATUSES}
                itemToString={(item) => item?.label || ''}
                onChange={({ selectedItems }) => update('sampleStatuses', selectedItems)}
              />
            </Column>
          )}
          <Column lg={8} md={4} sm={4}>
            <MultiSelect
              id="result-status"
              titleText={t('label.dataExport.resultStatus', 'Result Status')}
              label="All statuses"
              items={RESULT_STATUSES}
              itemToString={(item) => item?.label || ''}
              disabled={!hasTestResults}
              helperText={!hasTestResults ? 'Select Test Results variables to enable this filter.' : ''}
              onChange={({ selectedItems }) => update('resultStatuses', selectedItems)}
            />
          </Column>
          <Column lg={8} md={4} sm={4}>
            <MultiSelect
              id="priority"
              titleText={t('label.dataExport.priority', 'Priority')}
              label="All priorities"
              items={PRIORITIES}
              itemToString={(item) => item?.label || ''}
              onChange={({ selectedItems }) => update('priorities', selectedItems)}
            />
          </Column>
          <Column lg={8} md={4} sm={4}>
            <ComboBox
              id="referring-site"
              titleText={t('label.dataExport.referringSite', 'Referring Site')}
              placeholder={t('placeholder.dataExport.referringSite', 'Search referring sites...')}
              items={REFERRING_SITES}
              onChange={({ selectedItem }) => update('referringSite', selectedItem)}
            />
          </Column>
        </Grid>
      </div>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Review & Submit
// ---------------------------------------------------------------------------
function ReviewStep({ selectedVars, filters, estimating, estimate, onExportNameChange, exportName }) {
  const activeFamily = familyOfSelection(selectedVars);
  const selectedByDomain = VARIABLE_DOMAINS
    .map(d => ({
      ...d,
      selected: d.variables.filter(v => selectedVars.has(v.key)),
    }))
    .filter(d => d.selected.length > 0);

  return (
    <Stack gap={6}>
      {/* Export family */}
      {activeFamily && (
        <div>
          <Tag kind={FAMILIES[activeFamily].tagKind} type="high-contrast">
            {FAMILIES[activeFamily].label} export
          </Tag>
        </div>
      )}

      {/* Row estimate notification */}
      {estimating ? (
        <Tile>
          <SkeletonText heading={false} paragraph width="60%" />
          <p style={{ color: '#525252', fontSize: '0.875rem', marginTop: 'var(--cds-spacing-03)' }}>
            {t('label.dataExport.estimatingRows', 'Estimating row count...')}
          </p>
        </Tile>
      ) : estimate ? (
        <InlineNotification
          kind="info"
          title={estimate.routedAsync
            ? t('message.dataExport.routeAsync', `This report will be queued — ~${estimate.estimatedRows?.toLocaleString()} rows, ~${Math.ceil(estimate.estimatedWaitSeconds / 60)} min wait.`)
            : t('message.dataExport.routeSync', `This report will download immediately (~${estimate.estimatedRows?.toLocaleString()} rows).`)
          }
          hideCloseButton
          style={{ maxWidth: '100%' }}
        />
      ) : (
        <InlineNotification
          kind="warning"
          title={t('message.dataExport.estimateUnavailable', 'Row count estimate unavailable. The export will be queued for processing.')}
          hideCloseButton
          style={{ maxWidth: '100%' }}
        />
      )}

      {/* Export name */}
      <TextInput
        id="export-name"
        labelText={t('label.dataExport.exportName', 'Export Name')}
        placeholder={t('placeholder.dataExport.exportName', 'e.g. Hematology TAT Q1 2026')}
        helperText="Optional. Auto-generated from domains and date range if left blank."
        value={exportName}
        onChange={(e) => onExportNameChange(e.target.value)}
        maxLength={100}
      />

      {/* Summary */}
      <div>
        <h4 style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-04)', fontSize: '0.875rem', color: '#161616' }}>
          Selected Variables ({selectedVars.size} total)
        </h4>
        <Stack gap={4}>
          {selectedByDomain.map(d => (
            <Tile key={d.id} style={{ padding: 'var(--cds-spacing-04)' }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--cds-spacing-02)', color: '#161616' }}>{d.label}</p>
              <p style={{ fontSize: '0.8125rem', color: '#525252' }}>
                {d.selected.map(v => v.label).join(' · ')}
              </p>
            </Tile>
          ))}
        </Stack>
      </div>

      {/* Filter summary */}
      <div>
        <h4 style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-04)', fontSize: '0.875rem', color: '#161616' }}>
          Applied Filters
        </h4>
        <Tile style={{ padding: 'var(--cds-spacing-04)' }}>
          <Stack gap={3}>
            <p style={{ fontSize: '0.8125rem', color: '#525252' }}>
              <strong>Date Range:</strong> {filters.dateFromLabel || '—'} to {filters.dateToLabel || '—'}
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#525252' }}>
              <strong>Lab Sections:</strong>{' '}
              {filters.labSections?.length > 0
                ? filters.labSections.map(s => s.label).join(', ')
                : t('label.dataExport.allSections', 'All accessible sections')}
            </p>
            {filters.sampleStatuses?.length > 0 && (
              <p style={{ fontSize: '0.8125rem', color: '#525252' }}>
                <strong>Sample Status:</strong> {filters.sampleStatuses.map(s => s.label).join(', ')}
              </p>
            )}
          </Stack>
        </Tile>
      </div>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Report Builder Wizard
// ---------------------------------------------------------------------------
function ReportBuilder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVars, setSelectedVars] = useState(new Set());
  const [filters, setFilters] = useState({});
  const [exportName, setExportName] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [notification, setNotification] = useState(null);

  // Simulate estimate fetch when reaching step 2
  const goToStep = useCallback((step) => {
    setCurrentStep(step);
    if (step === 2) {
      setEstimating(true);
      setEstimate(null);
      setTimeout(() => {
        setEstimating(false);
        // Simulate large dataset → async routing
        setEstimate({ estimatedRows: 18750, routedAsync: true, estimatedWaitSeconds: 120 });
      }, 1800);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    setNotification({
      kind: 'success',
      title: t('message.dataExport.submitSuccess.async', 'Your export has been queued. You will be notified when it is ready.'),
    });
    // Reset
    setCurrentStep(0);
    setSelectedVars(new Set());
    setFilters({});
    setExportName('');
    setEstimate(null);
  }, []);

  const canGoNext = useMemo(() => {
    if (currentStep === 0) return selectedVars.size > 0;
    if (currentStep === 1) return true; // date validation handled inline
    return true;
  }, [currentStep, selectedVars]);

  return (
    <div style={{ padding: 'var(--cds-spacing-07)', maxWidth: '1200px' }}>
      <Breadcrumb style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <BreadcrumbItem href="#">{t('nav.reports', 'Reports')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('nav.dataExport.builderMenuItem', 'Custom Data Export')}</BreadcrumbItem>
      </Breadcrumb>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-07)', color: '#161616' }}>
        {t('heading.dataExport.builderTitle', 'Custom Data Export')}
      </h1>

      {notification && (
        <InlineNotification
          kind={notification.kind}
          title={notification.title}
          onCloseButtonClick={() => setNotification(null)}
          style={{ marginBottom: 'var(--cds-spacing-06)', maxWidth: '100%' }}
          actions={
            <button className="cds--btn cds--btn--ghost cds--notification__action-button" type="button">
              {t('button.dataExport.viewQueue', 'View My Report Queue')}
            </button>
          }
        />
      )}

      {/* Progress Indicator */}
      <ProgressIndicator currentIndex={currentStep} style={{ marginBottom: 'var(--cds-spacing-07)' }}>
        <ProgressStep
          label={t('heading.dataExport.step1', 'Select Variables')}
          description={selectedVars.size > 0 ? `${selectedVars.size} selected` : ''}
          complete={currentStep > 0}
          current={currentStep === 0}
        />
        <ProgressStep
          label={t('heading.dataExport.step2', 'Set Filters')}
          complete={currentStep > 1}
          current={currentStep === 1}
        />
        <ProgressStep
          label={t('heading.dataExport.step3', 'Review & Submit')}
          current={currentStep === 2}
        />
      </ProgressIndicator>

      {/* Step content */}
      <div style={{ marginBottom: 'var(--cds-spacing-08)' }}>
        {currentStep === 0 && (
          <VariableSelector
            selectedVars={selectedVars}
            onChange={setSelectedVars}
          />
        )}
        {currentStep === 1 && (
          <FilterStep
            filters={{ ...filters, selectedVars }}
            onChange={setFilters}
          />
        )}
        {currentStep === 2 && (
          <ReviewStep
            selectedVars={selectedVars}
            filters={filters}
            estimating={estimating}
            estimate={estimate}
            exportName={exportName}
            onExportNameChange={setExportName}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <Stack orientation="horizontal" gap={3}>
        {currentStep > 0 && (
          <Button
            kind="secondary"
            renderIcon={ChevronLeft}
            onClick={() => setCurrentStep(s => s - 1)}
          >
            {t('button.dataExport.back', 'Back')}
          </Button>
        )}
        {currentStep < 2 && (
          <Button
            kind="primary"
            renderIcon={ChevronRight}
            disabled={!canGoNext}
            onClick={() => goToStep(currentStep + 1)}
          >
            {t('button.dataExport.next', 'Next')}
          </Button>
        )}
        {currentStep === 2 && (
          <Button
            kind="primary"
            renderIcon={DocumentExport}
            disabled={estimating}
            onClick={handleSubmit}
          >
            {t('button.dataExport.submit', 'Generate Export')}
          </Button>
        )}
      </Stack>
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Report Queue
// ---------------------------------------------------------------------------
function ReportQueue() {
  const [queueData, setQueueData] = useState(MOCK_QUEUE);
  const [notification, setNotification] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const showNotification = useCallback((kind, title) => {
    setNotification({ kind, title });
    setTimeout(() => setNotification(null), 6000);
  }, []);

  const handleDownload = useCallback((job) => {
    showNotification('success', `Downloading "${job.jobName}"...`);
  }, [showNotification]);

  const handleRetry = useCallback((job) => {
    const newJob = {
      ...job,
      id: String(Date.now()),
      jobStatus: 'QUEUED',
      submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      rowsFileSummary: '~3 min wait',
    };
    setQueueData(prev => [newJob, ...prev]);
    showNotification('success', `Retry submitted for "${job.jobName}".`);
  }, [showNotification]);

  const handleCancel = useCallback((jobId) => {
    setQueueData(prev =>
      prev.map(j => j.id === jobId ? { ...j, jobStatus: 'CANCELLED' } : j)
    );
    setCancelModal(null);
    showNotification('success', t('message.dataExport.cancelSuccess', 'Export job cancelled.'));
  }, [showNotification]);

  const handleDelete = useCallback((job) => {
    if (job.jobStatus === 'GENERATING') {
      showNotification('error', t('error.dataExport.deletingGenerating', 'A generating job cannot be deleted.'));
      return;
    }
    setQueueData(prev => prev.filter(j => j.id !== job.id));
    showNotification('success', t('message.dataExport.deleteSuccess', 'Export job deleted.'));
  }, [showNotification]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return queueData.slice(start, start + pageSize);
  }, [queueData, currentPage, pageSize]);

  return (
    <div style={{ padding: 'var(--cds-spacing-07)', maxWidth: '1600px' }}>
      <Breadcrumb style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <BreadcrumbItem href="#">{t('nav.reports', 'Reports')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('nav.dataExport.queueMenuItem', 'My Report Queue')}</BreadcrumbItem>
      </Breadcrumb>

      <Stack orientation="horizontal" style={{ marginBottom: 'var(--cds-spacing-07)', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#161616', margin: 0 }}>
          {t('heading.dataExport.queueTitle', 'My Report Queue')}
        </h1>
        <Button kind="primary" renderIcon={Add}>
          {t('button.dataExport.newExport', 'New Export')}
        </Button>
      </Stack>

      {notification && (
        <InlineNotification
          kind={notification.kind}
          title={notification.title}
          onCloseButtonClick={() => setNotification(null)}
          style={{ marginBottom: 'var(--cds-spacing-05)', maxWidth: '100%' }}
        />
      )}

      <DataTable rows={paginatedRows} headers={QUEUE_HEADERS} isSortable>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer
            title={t('heading.dataExport.queueTable', 'Export Jobs')}
            description="Your personal export history. Ready exports expire 7 days after completion."
          >
            <Table {...getTableProps()} size="lg">
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    <TableHeader key={header.key} {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => {
                  const job = queueData.find(j => j.id === row.id);
                  if (!job) return null;
                  return (
                    <TableRow key={row.id} {...getRowProps({ row })}>
                      {row.cells.map(cell => {
                        if (cell.info.header === 'status') {
                          return (
                            <TableCell key={cell.id}>
                              <StatusTag status={job.jobStatus} />
                            </TableCell>
                          );
                        }
                        if (cell.info.header === 'actions') {
                          return (
                            <TableCell key={cell.id}>
                              <Stack orientation="horizontal" gap={2}>
                                {job.jobStatus === 'READY' && (
                                  <Button
                                    kind="primary"
                                    size="sm"
                                    renderIcon={Download}
                                    onClick={() => handleDownload(job)}
                                  >
                                    {t('button.dataExport.download', 'Download')}
                                  </Button>
                                )}
                                {job.jobStatus === 'QUEUED' && (
                                  <Button
                                    kind="ghost"
                                    size="sm"
                                    renderIcon={Close}
                                    onClick={() => setCancelModal(job)}
                                  >
                                    {t('button.dataExport.cancelJob', 'Cancel Job')}
                                  </Button>
                                )}
                                {job.jobStatus === 'FAILED' && (
                                  <Button
                                    kind="secondary"
                                    size="sm"
                                    renderIcon={Renew}
                                    onClick={() => handleRetry(job)}
                                  >
                                    {t('button.dataExport.retry', 'Retry')}
                                  </Button>
                                )}
                                {job.jobStatus === 'EXPIRED' && (
                                  <Button
                                    kind="ghost"
                                    size="sm"
                                    renderIcon={Renew}
                                    onClick={() => {}}
                                  >
                                    {t('button.dataExport.rerun', 'Re-run')}
                                  </Button>
                                )}
                                <OverflowMenu size="sm" flipped aria-label="More actions">
                                  <OverflowMenuItem
                                    itemText={t('button.dataExport.delete', 'Delete')}
                                    isDelete
                                    disabled={job.jobStatus === 'GENERATING'}
                                    onClick={() => handleDelete(job)}
                                  />
                                </OverflowMenu>
                              </Stack>
                            </TableCell>
                          );
                        }
                        return <TableCell key={cell.id}>{cell.value}</TableCell>;
                      })}
                    </TableRow>
                  );
                })}

                {queueData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={QUEUE_HEADERS.length}>
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#525252' }}>
                        <DocumentExport size={48} style={{ marginBottom: 'var(--cds-spacing-05)', color: '#8d8d8d' }} />
                        <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 'var(--cds-spacing-03)' }}>
                          {t('message.dataExport.empty', 'No export jobs found')}
                        </p>
                        <p style={{ fontSize: '0.875rem' }}>
                          {t('message.dataExport.emptySubtext', 'Use the Report Builder to create your first export.')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      <Pagination
        totalItems={queueData.length}
        pageSize={pageSize}
        pageSizes={[10, 20, 50, 100]}
        page={currentPage}
        onChange={({ page, pageSize: newSize }) => {
          setCurrentPage(page);
          setPageSize(newSize);
        }}
      />

      {/* Cancel confirmation modal */}
      {cancelModal && (
        <Modal
          open
          danger
          modalHeading={t('button.dataExport.cancelJob', 'Cancel Export Job')}
          primaryButtonText={t('button.dataExport.cancelJob', 'Cancel Job')}
          secondaryButtonText={t('button.cancel', 'Keep Job')}
          onRequestSubmit={() => handleCancel(cancelModal.id)}
          onRequestClose={() => setCancelModal(null)}
          onSecondarySubmit={() => setCancelModal(null)}
        >
          <p>{t('message.dataExport.cancelConfirm', 'Are you sure you want to cancel this export job? This action cannot be undone.')}</p>
          <p style={{ marginTop: 'var(--cds-spacing-04)', fontWeight: 600 }}>{cancelModal.jobName}</p>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
export default function CustomDataExport() {
  return (
    <Tabs>
      <TabList aria-label="Data export views">
        <Tab>{t('nav.dataExport.builderMenuItem', 'Custom Data Export')}</Tab>
        <Tab>{t('nav.dataExport.queueMenuItem', 'My Report Queue')}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel style={{ padding: 0 }}>
          <ReportBuilder />
        </TabPanel>
        <TabPanel style={{ padding: 0 }}>
          <ReportQueue />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
