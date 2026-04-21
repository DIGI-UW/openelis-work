/**
 * S-01: Compliance Standards Administration — React/Carbon Mockup  v2.0
 *
 * Two screens:
 *   1. Admin → Test Management → Compliance Standards (standards CRUD + CSV import)
 *   2. Test Catalog → [Test Editor] → Compliance tab (vertical tab sidebar, per-test thresholds)
 *
 * v2.0 enhancements:
 *   - Parameter group accordion items now show a linked tests table (test name, sample types,
 *     threshold type tag, allowed range, unit) with inline add/edit per test
 *   - Sample Types section replaced with a derived checkbox panel:
 *       – All sample types contributed by linked tests are shown, pre-checked
 *       – Admins can uncheck any sample type to exclude it from the standard's applicableSampleTypes
 *   - Aligns with S-03 Environmental Order Entry: tests for a standard are filtered by
 *     standard + selected sample types at order time
 *
 * The Test Editor uses a vertical tab sidebar (not horizontal Carbon Tabs) per test-catalog.jsx.
 * The "Compliance" tab is placed under a new Compliance section group after the Automation group.
 * Tab groups: Configuration | Organization | Resources | Automation | Compliance
 *
 * Dependencies: @carbon/react, @carbon/icons-react
 * Companion FRS: S01-compliance-standards-admin-frs-v1.0.md
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack, SideNav, SideNavItems, SideNavMenuItem, SideNavMenu,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TableBatchActions, TableBatchAction, TableSelectRow, TableSelectAll,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput, Toggle,
  Checkbox, RadioButton, RadioButtonGroup, DatePicker, DatePickerInput, MultiSelect,
  Button, IconButton, InlineNotification, Tag, Modal, Loading, Accordion, AccordionItem,
  Tile, Breadcrumb, BreadcrumbItem, OverflowMenu, OverflowMenuItem,
  FileUploader, FileUploaderDropContainer,
  FormGroup,
} from '@carbon/react';
import { Add, Edit, TrashCan, ChevronDown, ChevronUp, Download, Save, Renew, Copy, Upload, View, Link, Unlink } from '@carbon/icons-react';

// i18n helper — in production, this resolves to the active locale's message bundle
const t = (key, fallback) => fallback || key;

// ============================================================
// MOCK DATA
// ============================================================

const statusKindMap = {
  ACTIVE: 'green',
  DRAFT: 'blue',
  SUPERSEDED: 'warm-gray',
  ARCHIVED: 'gray',
};

const thresholdTypeKindMap = {
  HIGH: 'red',         // Absolute upper limit — fail if exceeded
  LOW: 'blue',         // Absolute lower limit — fail if below
  RANGE: 'teal',       // Acceptable normal range (low–high)
  BORDERLINE: 'warm-gray', // Advisory/warning zone — near the hard limit; triggers review not fail
  DESCRIPTIVE: 'purple',
};

const thresholdTypeLabels = {
  HIGH: 'High Limit ≤',
  LOW: 'Low Limit ≥',
  RANGE: 'Normal Range',
  BORDERLINE: 'Borderline',
  DESCRIPTIVE: 'Qualitative',
};

// Legacy aliases kept for backward compat with Threshold tab mock data
const thresholdTypeLabelsFull = {
  MAX: 'High Limit ≤',
  MIN: 'Low Limit ≥',
  ...thresholdTypeLabels,
};

const thresholdTypeKindMapFull = {
  MAX: 'red',
  MIN: 'blue',
  ...thresholdTypeKindMap,
};

// All tests known to the system (subset shown for demo)
const allSystemTests = [
  { id: 'T-001', name: 'Turbidity', code: 'TURB-01', sampleTypes: ['Water'] },
  { id: 'T-002', name: 'Color (TCU)', code: 'COLOR-01', sampleTypes: ['Water'] },
  { id: 'T-003', name: 'pH', code: 'PH-01', sampleTypes: ['Water', 'Soil'] },
  { id: 'T-004', name: 'Temperature', code: 'TEMP-01', sampleTypes: ['Water', 'Air'] },
  { id: 'T-005', name: 'Odor', code: 'ODOR-01', sampleTypes: ['Water'] },
  { id: 'T-006', name: 'Total Dissolved Solids', code: 'TDS-01', sampleTypes: ['Water'] },
  { id: 'T-007', name: 'Arsenic (As)', code: 'AS-01', sampleTypes: ['Water', 'Soil'] },
  { id: 'T-008', name: 'Lead (Pb)', code: 'PB-01', sampleTypes: ['Water', 'Soil'] },
  { id: 'T-009', name: 'Iron (Fe)', code: 'FE-01', sampleTypes: ['Water'] },
  { id: 'T-010', name: 'Nitrate (NO₃⁻)', code: 'NO3-01', sampleTypes: ['Water'] },
  { id: 'T-011', name: 'Mercury (Hg)', code: 'HG-01', sampleTypes: ['Water', 'Soil', 'Sediment'] },
  { id: 'T-012', name: 'Fluoride (F⁻)', code: 'FLR-01', sampleTypes: ['Water'] },
  { id: 'T-013', name: 'Chloroform', code: 'CHLF-01', sampleTypes: ['Water'] },
  { id: 'T-014', name: 'Pesticides (Total)', code: 'PEST-01', sampleTypes: ['Water', 'Soil', 'Sediment'] },
  { id: 'T-015', name: 'Total Coliform', code: 'TCOL-01', sampleTypes: ['Water'] },
  { id: 'T-016', name: 'E. coli', code: 'ECOL-01', sampleTypes: ['Water'] },
  { id: 'T-017', name: 'Fecal Coliform', code: 'FCOL-01', sampleTypes: ['Water'] },
  { id: 'T-018', name: 'SO₂ (Sulfur Dioxide)', code: 'SO2-01', sampleTypes: ['Air'] },
  { id: 'T-019', name: 'CO (Carbon Monoxide)', code: 'CO-01', sampleTypes: ['Air'] },
  { id: 'T-020', name: 'NO₂ (Nitrogen Dioxide)', code: 'NO2-01', sampleTypes: ['Air'] },
  { id: 'T-021', name: 'PM10 (Particulate Matter)', code: 'PM10-01', sampleTypes: ['Air'] },
  { id: 'T-022', name: 'PM2.5 (Fine Particles)', code: 'PM25-01', sampleTypes: ['Air'] },
];

/**
 * Linked tests per parameter group.
 *
 * Each entry represents one test linked to a compliance standard's parameter group.
 * A single test may have multiple entries with different threshold levels:
 *   HIGH        — absolute upper limit; result fails if exceeded
 *   LOW         — absolute lower limit; result fails if below
 *   RANGE       — acceptable normal range (valueLower–valueUpper); fail outside range
 *   BORDERLINE  — advisory warning zone just inside the hard limit; triggers review flag,
 *                 not outright fail (e.g., pH 6.5–7.0 is borderline low for a range of 6.5–8.5)
 *   DESCRIPTIVE — qualitative expected value; evaluated by text match
 */
const mockLinkedTestsByGroup = {
  // PP No. 22/2021 — Water Quality
  'g1': [  // Physical Parameters
    { linkId: 'l01', testId: 'T-001', testName: 'Turbidity', testCode: 'TURB-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 25, unit: 'NTU' },
    { linkId: 'l01b', testId: 'T-001', testName: 'Turbidity', testCode: 'TURB-01', sampleTypes: ['Water'],
      thresholdType: 'BORDERLINE', valueLower: 20, valueUpper: 25, unit: 'NTU', note: 'Requires re-sampling' },
    { linkId: 'l02', testId: 'T-002', testName: 'Color (TCU)', testCode: 'COLOR-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 50, unit: 'TCU' },
    { linkId: 'l03', testId: 'T-003', testName: 'pH', testCode: 'PH-01', sampleTypes: ['Water', 'Soil'],
      thresholdType: 'RANGE', valueLower: 6.5, valueUpper: 8.5, unit: 'pH' },
    { linkId: 'l03b', testId: 'T-003', testName: 'pH', testCode: 'PH-01', sampleTypes: ['Water', 'Soil'],
      thresholdType: 'BORDERLINE', valueLower: 6.5, valueUpper: 7.0, unit: 'pH', note: 'Borderline low; flag for review' },
    { linkId: 'l04', testId: 'T-004', testName: 'Temperature', testCode: 'TEMP-01', sampleTypes: ['Water', 'Air'],
      thresholdType: 'HIGH', valueUpper: 30, unit: '°C' },
    { linkId: 'l05', testId: 'T-005', testName: 'Odor', testCode: 'ODOR-01', sampleTypes: ['Water'],
      thresholdType: 'DESCRIPTIVE', valueDescriptive: 'No odor', unit: '—' },
    { linkId: 'l06', testId: 'T-006', testName: 'Total Dissolved Solids', testCode: 'TDS-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 1000, unit: 'mg/L' },
  ],
  'g2': [  // Inorganic Chemical Parameters
    { linkId: 'l07', testId: 'T-007', testName: 'Arsenic (As)', testCode: 'AS-01', sampleTypes: ['Water', 'Soil'],
      thresholdType: 'HIGH', valueUpper: 0.05, unit: 'mg/L' },
    { linkId: 'l07b', testId: 'T-007', testName: 'Arsenic (As)', testCode: 'AS-01', sampleTypes: ['Water', 'Soil'],
      thresholdType: 'BORDERLINE', valueLower: 0.04, valueUpper: 0.05, unit: 'mg/L', note: 'Advisory threshold (WHO 0.01 mg/L)' },
    { linkId: 'l08', testId: 'T-008', testName: 'Lead (Pb)', testCode: 'PB-01', sampleTypes: ['Water', 'Soil'],
      thresholdType: 'HIGH', valueUpper: 0.01, unit: 'mg/L' },
    { linkId: 'l09', testId: 'T-009', testName: 'Iron (Fe)', testCode: 'FE-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 0.3, unit: 'mg/L' },
    { linkId: 'l09b', testId: 'T-009', testName: 'Iron (Fe)', testCode: 'FE-01', sampleTypes: ['Water'],
      thresholdType: 'LOW', valueLower: 0.0, unit: 'mg/L', note: 'Detect presence' },
    { linkId: 'l10', testId: 'T-010', testName: 'Nitrate (NO₃⁻)', testCode: 'NO3-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 50, unit: 'mg/L' },
    { linkId: 'l11', testId: 'T-011', testName: 'Mercury (Hg)', testCode: 'HG-01', sampleTypes: ['Water', 'Soil', 'Sediment'],
      thresholdType: 'HIGH', valueUpper: 0.001, unit: 'mg/L' },
    { linkId: 'l12', testId: 'T-012', testName: 'Fluoride (F⁻)', testCode: 'FLR-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 1.5, unit: 'mg/L' },
    { linkId: 'l12b', testId: 'T-012', testName: 'Fluoride (F⁻)', testCode: 'FLR-01', sampleTypes: ['Water'],
      thresholdType: 'LOW', valueLower: 0.5, unit: 'mg/L', note: 'Min fluoride for dental health' },
  ],
  'g3': [  // Organic Chemical Parameters
    { linkId: 'l13', testId: 'T-013', testName: 'Chloroform', testCode: 'CHLF-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 0.03, unit: 'mg/L' },
    { linkId: 'l14', testId: 'T-014', testName: 'Pesticides (Total)', testCode: 'PEST-01', sampleTypes: ['Water', 'Soil', 'Sediment'],
      thresholdType: 'HIGH', valueUpper: 0.0005, unit: 'mg/L' },
    { linkId: 'l14b', testId: 'T-014', testName: 'Pesticides (Total)', testCode: 'PEST-01', sampleTypes: ['Water', 'Soil', 'Sediment'],
      thresholdType: 'BORDERLINE', valueLower: 0.0004, valueUpper: 0.0005, unit: 'mg/L', note: 'Advisory: investigate source' },
  ],
  'g4': [  // Microbiological Parameters
    { linkId: 'l15', testId: 'T-015', testName: 'Total Coliform', testCode: 'TCOL-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 0, unit: 'CFU/100mL' },
    { linkId: 'l16', testId: 'T-016', testName: 'E. coli', testCode: 'ECOL-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 0, unit: 'CFU/100mL' },
    { linkId: 'l17', testId: 'T-017', testName: 'Fecal Coliform', testCode: 'FCOL-01', sampleTypes: ['Water'],
      thresholdType: 'HIGH', valueUpper: 5000, unit: 'CFU/100mL' },
    { linkId: 'l17b', testId: 'T-017', testName: 'Fecal Coliform', testCode: 'FCOL-01', sampleTypes: ['Water'],
      thresholdType: 'BORDERLINE', valueLower: 3000, valueUpper: 5000, unit: 'CFU/100mL', note: 'Advisory: repeat sample within 24h' },
  ],
  // PP No. 41/1999 — Ambient Air Quality
  'g5': [  // Primary Pollutants
    { linkId: 'l18', testId: 'T-018', testName: 'SO₂', testCode: 'SO2-01', sampleTypes: ['Air'],
      thresholdType: 'HIGH', valueUpper: 0.1, unit: 'ppm' },
    { linkId: 'l19', testId: 'T-019', testName: 'CO', testCode: 'CO-01', sampleTypes: ['Air'],
      thresholdType: 'HIGH', valueUpper: 35, unit: 'ppm' },
    { linkId: 'l19b', testId: 'T-019', testName: 'CO', testCode: 'CO-01', sampleTypes: ['Air'],
      thresholdType: 'BORDERLINE', valueLower: 25, valueUpper: 35, unit: 'ppm', note: 'Alert level — notify field team' },
    { linkId: 'l20', testId: 'T-020', testName: 'NO₂', testCode: 'NO2-01', sampleTypes: ['Air'],
      thresholdType: 'HIGH', valueUpper: 0.053, unit: 'ppm' },
    { linkId: 'l21', testId: 'T-021', testName: 'PM10', testCode: 'PM10-01', sampleTypes: ['Air'],
      thresholdType: 'HIGH', valueUpper: 150, unit: 'µg/m³' },
    { linkId: 'l21b', testId: 'T-021', testName: 'PM10', testCode: 'PM10-01', sampleTypes: ['Air'],
      thresholdType: 'BORDERLINE', valueLower: 100, valueUpper: 150, unit: 'µg/m³', note: 'Moderate air quality — flag' },
    { linkId: 'l22', testId: 'T-022', testName: 'PM2.5', testCode: 'PM25-01', sampleTypes: ['Air'],
      thresholdType: 'HIGH', valueUpper: 35, unit: 'µg/m³' },
  ],
  'g6': [],  // Secondary Pollutants — no linked tests in demo
};

// Derive unique sample types from all linked tests across groups
function deriveSampleTypes(groups) {
  const sampleTypeMap = {}; // sampleType → testCount
  groups.forEach(group => {
    const linkedTests = mockLinkedTestsByGroup[group.id] || [];
    linkedTests.forEach(lt => {
      lt.sampleTypes.forEach(st => {
        sampleTypeMap[st] = (sampleTypeMap[st] || 0) + 1;
      });
    });
  });
  return Object.entries(sampleTypeMap).map(([name, count]) => ({ name, count }));
}

const mockStandards = [
  {
    id: '1', name: 'PP No. 22/2021 — Water Quality', issuingBody: 'Government of Indonesia',
    regulationNumber: 'PP 22/2021', version: '2021', effectiveDate: '2021-02-02',
    countryRegion: 'Indonesia', status: 'ACTIVE', parameterGroupCount: 4, linkedTestCount: 17,
    isPreSeeded: true,
    groups: [
      { id: 'g1', name: 'Physical Parameters', description: 'Turbidity, color, odor, taste, temperature', sortOrder: 1 },
      { id: 'g2', name: 'Inorganic Chemical Parameters', description: 'Heavy metals, pH, hardness, dissolved solids', sortOrder: 2 },
      { id: 'g3', name: 'Organic Chemical Parameters', description: 'Pesticides, solvents, disinfection byproducts', sortOrder: 3 },
      { id: 'g4', name: 'Microbiological Parameters', description: 'Total coliform, E. coli, fecal coliform', sortOrder: 4 },
    ],
  },
  {
    id: '2', name: 'PP No. 41/1999 — Ambient Air Quality', issuingBody: 'Government of Indonesia',
    regulationNumber: 'PP 41/1999', version: '1999', effectiveDate: '1999-05-26',
    countryRegion: 'Indonesia', status: 'ACTIVE', parameterGroupCount: 2, linkedTestCount: 5,
    isPreSeeded: true,
    groups: [
      { id: 'g5', name: 'Primary Pollutants', description: 'SO2, CO, NO2, O3, Pb, PM10, PM2.5', sortOrder: 1 },
      { id: 'g6', name: 'Secondary Pollutants', description: 'Dust, H2S, NH3, HCl', sortOrder: 2 },
    ],
  },
  {
    id: '3', name: 'WHO Drinking Water Guidelines', issuingBody: 'World Health Organization',
    regulationNumber: 'WHO/SDE/WSH/2022', version: '4th Ed. 2022', effectiveDate: '2022-03-21',
    countryRegion: 'International', status: 'ACTIVE', parameterGroupCount: 3, linkedTestCount: 34,
    isPreSeeded: false,
    groups: [
      { id: 'g7', name: 'Chemical Contaminants', description: 'Arsenic, fluoride, lead, nitrate, etc.', sortOrder: 1 },
      { id: 'g8', name: 'Microbial Indicators', description: 'E. coli, total coliforms', sortOrder: 2 },
      { id: 'g9', name: 'Radiological Parameters', description: 'Gross alpha, gross beta activity', sortOrder: 3 },
    ],
  },
  {
    id: '4', name: 'PP No. 22/2021 — Water Quality (Draft v2)', issuingBody: 'Government of Indonesia',
    regulationNumber: 'PP 22/2021-rev', version: '2026 Draft', effectiveDate: '2026-01-01',
    countryRegion: 'Indonesia', status: 'DRAFT', parameterGroupCount: 0, linkedTestCount: 0,
    isPreSeeded: false,
    groups: [],
  },
];

// ============================================================
// HELPERS
// ============================================================

function formatRange(lt) {
  switch (lt.thresholdType) {
    case 'HIGH':
    case 'MAX': return `≤ ${lt.valueUpper} ${lt.unit}`;
    case 'LOW':
    case 'MIN': return `≥ ${lt.valueLower} ${lt.unit}`;
    case 'RANGE': return `${lt.valueLower} – ${lt.valueUpper} ${lt.unit}`;
    case 'BORDERLINE': return `${lt.valueLower} – ${lt.valueUpper} ${lt.unit}`;
    case 'DESCRIPTIVE': return lt.valueDescriptive;
    default: return '—';
  }
}


// ============================================================
// SCREEN 1: Compliance Standards List
// Admin → Test Management → Compliance Standards
// ============================================================

function ComplianceStandardsList() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [notification, setNotification] = useState(null);
  const [addingNew, setAddingNew] = useState(false);

  const toggleRow = (id) => setExpandedRow((prev) => (prev === id ? null : id));

  const filteredStandards = useMemo(() => {
    return mockStandards.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (regionFilter && s.countryRegion !== regionFilter) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.issuingBody.toLowerCase().includes(q) ||
          s.regulationNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchText, statusFilter, regionFilter]);

  const headers = [
    { key: 'name', header: t('label.complianceStandard.name', 'Standard Name') },
    { key: 'issuingBody', header: t('label.complianceStandard.issuingBody', 'Issuing Body') },
    { key: 'regulationNumber', header: t('label.complianceStandard.regulationNumber', 'Regulation No.') },
    { key: 'version', header: t('label.complianceStandard.version', 'Version') },
    { key: 'effectiveDate', header: t('label.complianceStandard.effectiveDate', 'Effective Date') },
    { key: 'status', header: t('label.complianceStandard.status', 'Status') },
    { key: 'parameterGroupCount', header: t('label.complianceStandard.parameterGroups', 'Groups') },
    { key: 'linkedTestCount', header: t('label.complianceStandard.linkedTests', 'Tests') },
    { key: 'actions', header: '' },
  ];

  return (
    <Grid>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb>
          <BreadcrumbItem href="#">{t('nav.admin', 'Admin')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('nav.testManagement', 'Test Management')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('nav.complianceStandard', 'Compliance Standards')}</BreadcrumbItem>
        </Breadcrumb>

        <Stack gap={5} style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <h1>{t('heading.complianceStandard.list', 'Compliance Standards')}</h1>

          {notification && (
            <InlineNotification
              kind={notification.kind}
              title={notification.title}
              subtitle={notification.subtitle}
              onClose={() => setNotification(null)}
            />
          )}

          <TableContainer>
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch
                  placeholder={t('placeholder.complianceStandard.search', 'Search by name, issuing body, or regulation number...')}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Select
                  id="status-filter"
                  labelText=""
                  inline
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <SelectItem value="" text={t('label.complianceStandard.allStatuses', 'All Statuses')} />
                  <SelectItem value="ACTIVE" text="Active" />
                  <SelectItem value="DRAFT" text="Draft" />
                  <SelectItem value="SUPERSEDED" text="Superseded" />
                  <SelectItem value="ARCHIVED" text="Archived" />
                </Select>
                <Select
                  id="region-filter"
                  labelText=""
                  inline
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                >
                  <SelectItem value="" text={t('label.complianceStandard.allRegions', 'All Regions')} />
                  <SelectItem value="Indonesia" text="Indonesia" />
                  <SelectItem value="International" text="International" />
                </Select>
                <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={Upload}
                  onClick={() => setShowImportModal(true)}
                >
                  {t('button.complianceStandard.import', 'Import from CSV')}
                </Button>
                <Button
                  kind="primary"
                  size="sm"
                  renderIcon={Add}
                  onClick={() => { setAddingNew(true); setExpandedRow(null); }}
                >
                  {t('button.complianceStandard.add', 'Add Standard')}
                </Button>
              </TableToolbarContent>
            </TableToolbar>

            <Table>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableHeader key={h.key}>{h.header}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {addingNew && (
                  <TableRow>
                    <TableCell colSpan={headers.length}>
                      <StandardInlineForm
                        isNew
                        onSave={() => {
                          setAddingNew(false);
                          setNotification({ kind: 'success', title: t('message.complianceStandard.saveSuccess', 'Compliance standard saved successfully.') });
                        }}
                        onCancel={() => setAddingNew(false)}
                      />
                    </TableCell>
                  </TableRow>
                )}

                {filteredStandards.map((std) => (
                  <React.Fragment key={std.id}>
                    <TableRow>
                      <TableCell>
                        <Stack orientation="horizontal" gap={3}>
                          {std.name}
                          {std.isPreSeeded && (
                            <Tag size="sm" type="teal">{t('label.complianceStandard.preSeeded', 'Default')}</Tag>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>{std.issuingBody}</TableCell>
                      <TableCell>{std.regulationNumber}</TableCell>
                      <TableCell>{std.version}</TableCell>
                      <TableCell>{std.effectiveDate}</TableCell>
                      <TableCell>
                        <Tag type={statusKindMap[std.status]} size="sm">{std.status}</Tag>
                      </TableCell>
                      <TableCell>{std.parameterGroupCount}</TableCell>
                      <TableCell>{std.linkedTestCount}</TableCell>
                      <TableCell>
                        <Stack orientation="horizontal" gap={2}>
                          <Button
                            kind="ghost"
                            size="sm"
                            renderIcon={expandedRow === std.id ? ChevronUp : ChevronDown}
                            onClick={() => toggleRow(std.id)}
                            hasIconOnly
                            iconDescription={t('button.complianceStandard.edit', 'Edit')}
                          />
                          <OverflowMenu size="sm" flipped>
                            <OverflowMenuItem
                              itemText={t('button.complianceStandard.edit', 'Edit')}
                              onClick={() => toggleRow(std.id)}
                            />
                            <OverflowMenuItem
                              itemText={t('button.complianceStandard.copy', 'Copy Standard')}
                            />
                            {!std.isPreSeeded && (
                              <OverflowMenuItem
                                itemText={t('button.complianceStandard.archive', 'Archive')}
                                isDelete
                                onClick={() => {
                                  setArchiveTarget(std);
                                  setShowArchiveModal(true);
                                }}
                              />
                            )}
                          </OverflowMenu>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {expandedRow === std.id && (
                      <TableRow>
                        <TableCell colSpan={headers.length}>
                          <StandardInlineForm
                            standard={std}
                            onSave={() => {
                              setExpandedRow(null);
                              setNotification({ kind: 'success', title: t('message.complianceStandard.saveSuccess', 'Compliance standard saved successfully.') });
                            }}
                            onCancel={() => setExpandedRow(null)}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>

        <Modal
          open={showArchiveModal}
          modalHeading={t('heading.complianceStandard.archive', 'Archive Compliance Standard')}
          primaryButtonText={t('button.complianceStandard.archive', 'Archive')}
          secondaryButtonText={t('button.complianceStandard.cancel', 'Cancel')}
          danger
          onRequestClose={() => setShowArchiveModal(false)}
          onRequestSubmit={() => {
            setShowArchiveModal(false);
            setNotification({ kind: 'success', title: t('message.complianceStandard.archiveSuccess', 'Compliance standard archived.') });
          }}
        >
          <p>{t('message.complianceStandard.archiveConfirm', 'Are you sure you want to archive this compliance standard? Existing evaluated results will not be affected.')}</p>
        </Modal>

        <CSVImportModal open={showImportModal} onClose={() => setShowImportModal(false)} />
      </Column>
    </Grid>
  );
}


// ============================================================
// PARAMETER GROUP with LINKED TESTS table
// ============================================================

function ParameterGroupAccordionItem({ group }) {
  const [linkedTests, setLinkedTests] = useState(mockLinkedTestsByGroup[group.id] || []);
  const [addingTest, setAddingTest] = useState(false);
  const [expandedTestLink, setExpandedTestLink] = useState(null);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState(null);

  const handleUnlink = (lt) => {
    setUnlinkTarget(lt);
    setShowUnlinkModal(true);
  };

  const confirmUnlink = () => {
    setLinkedTests(prev => prev.filter(lt => lt.linkId !== unlinkTarget.linkId));
    setShowUnlinkModal(false);
  };

  return (
    <>
      <AccordionItem
        title={
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>{group.name}</span>
            <Tag size="sm" type="gray">
              {linkedTests.length} {t('label.complianceStandard.tests', 'tests')}
            </Tag>
          </Stack>
        }
      >
        <p style={{ marginBottom: 'var(--cds-spacing-03)', color: 'var(--cds-text-02)', fontSize: '0.875rem' }}>
          {group.description}
        </p>

        {linkedTests.length > 0 ? (
          <Table size="sm" style={{ marginBottom: 'var(--cds-spacing-04)' }}>
            <TableHead>
              <TableRow>
                <TableHeader>{t('label.linkedTest.testName', 'Test')}</TableHeader>
                <TableHeader>{t('label.linkedTest.sampleTypes', 'Sample Types')}</TableHeader>
                <TableHeader>{t('label.linkedTest.thresholdType', 'Limit Type')}</TableHeader>
                <TableHeader>{t('label.linkedTest.allowedRange', 'Threshold / Range')}</TableHeader>
                <TableHeader>{t('label.linkedTest.note', 'Note')}</TableHeader>
                <TableHeader>{''}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {linkedTests.map((lt) => (
                <React.Fragment key={lt.linkId}>
                  <TableRow>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{lt.testName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)' }}>{lt.testCode}</div>
                    </TableCell>
                    <TableCell>
                      <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
                        {lt.sampleTypes.map(st => (
                          <Tag key={st} size="sm" type="blue">{st}</Tag>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Tag size="sm" type={thresholdTypeKindMap[lt.thresholdType] || 'gray'}>
                        {t(`label.thresholdType.${lt.thresholdType.toLowerCase()}`, thresholdTypeLabels[lt.thresholdType] || lt.thresholdType)}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontFamily: 'var(--cds-code-01-font-family, monospace)', fontSize: '0.875rem' }}>
                        {formatRange(lt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {lt.note ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)', fontStyle: 'italic' }}>{lt.note}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Stack orientation="horizontal" gap={1}>
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          iconDescription={t('button.linkedTest.edit', 'Edit threshold')}
                          renderIcon={expandedTestLink === lt.linkId ? ChevronUp : Edit}
                          onClick={() => setExpandedTestLink(prev => prev === lt.linkId ? null : lt.linkId)}
                        />
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          iconDescription={t('button.linkedTest.unlink', 'Remove from group')}
                          renderIcon={TrashCan}
                          onClick={() => handleUnlink(lt)}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                  {expandedTestLink === lt.linkId && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <LinkedTestInlineForm
                          link={lt}
                          onSave={() => setExpandedTestLink(null)}
                          onCancel={() => setExpandedTestLink(null)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p style={{ marginBottom: 'var(--cds-spacing-04)', color: 'var(--cds-text-placeholder)', fontSize: '0.875rem', fontStyle: 'italic' }}>
            {t('message.complianceGroup.noTests', 'No tests linked to this group yet. Link tests to define allowed ranges for evaluation.')}
          </p>
        )}

        {addingTest ? (
          <LinkedTestInlineForm
            isNew
            onSave={(newLink) => {
              if (newLink) {
                setLinkedTests(prev => [...prev, { ...newLink, linkId: `new-${Date.now()}` }]);
              }
              setAddingTest(false);
            }}
            onCancel={() => setAddingTest(false)}
          />
        ) : (
          <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setAddingTest(true)}>
            {t('button.complianceGroup.linkTest', 'Link Test to Group')}
          </Button>
        )}
      </AccordionItem>

      <Modal
        open={showUnlinkModal}
        size="sm"
        modalHeading={t('heading.linkedTest.unlink', 'Remove Test from Group')}
        primaryButtonText={t('button.linkedTest.unlinkConfirm', 'Remove')}
        secondaryButtonText={t('button.cancel', 'Cancel')}
        danger
        onRequestClose={() => setShowUnlinkModal(false)}
        onRequestSubmit={confirmUnlink}
      >
        <p>
          {t('message.linkedTest.unlinkConfirm', `Remove "${unlinkTarget?.testName}" from "${group.name}"? The threshold definition for this test in this standard will be deleted.`)}
        </p>
      </Modal>
    </>
  );
}


// ============================================================
// LINKED TEST INLINE FORM
// Add or edit a test's threshold within a parameter group
// ============================================================

function LinkedTestInlineForm({ link, isNew, onSave, onCancel }) {
  const [selectedTest, setSelectedTest] = useState(
    link ? { id: link.testId, label: `${link.testName} (${link.testCode})` } : null
  );
  const [thresholdType, setThresholdType] = useState(link?.thresholdType || 'HIGH');
  const [valueUpper, setValueUpper] = useState(link?.valueUpper ?? '');
  const [valueLower, setValueLower] = useState(link?.valueLower ?? '');
  const [valueDescriptive, setValueDescriptive] = useState(link?.valueDescriptive || '');
  const [unit, setUnit] = useState(link?.unit || '');

  const testOptions = allSystemTests.map(t => ({ id: t.id, label: `${t.name} (${t.code})` }));

  // When a test is selected, pre-fill unit if blank
  const handleTestSelect = (item) => {
    setSelectedTest(item);
  };

  const handleSave = () => {
    if (!selectedTest) return;
    const test = allSystemTests.find(t => t.id === selectedTest.id);
    onSave({
      testId: selectedTest.id,
      testName: test?.name || selectedTest.label,
      testCode: test?.code || '',
      sampleTypes: test?.sampleTypes || [],
      thresholdType,
      valueUpper: parseFloat(valueUpper) || undefined,
      valueLower: parseFloat(valueLower) || undefined,
      valueDescriptive,
      unit,
    });
  };

  return (
    <Tile style={{ padding: '1rem', background: 'var(--cds-layer-02)' }}>
      <h6 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        {isNew
          ? t('heading.linkedTest.add', 'Link Test to Group')
          : t('heading.linkedTest.edit', 'Edit Threshold')}
      </h6>
      <Grid>
        <Column lg={6} md={4} sm={4}>
          <ComboBox
            id="lt-test"
            titleText={t('label.linkedTest.test', 'Test')}
            items={testOptions}
            selectedItem={selectedTest}
            onChange={({ selectedItem }) => handleTestSelect(selectedItem)}
            placeholder={t('placeholder.linkedTest.selectTest', 'Search and select a test...')}
            disabled={!isNew}
          />
          {selectedTest && (() => {
            const test = allSystemTests.find(t => t.id === selectedTest.id);
            return test ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)', marginTop: '0.25rem' }}>
                {t('label.linkedTest.sampleTypes', 'Sample types')}: {test.sampleTypes.join(', ')}
              </p>
            ) : null;
          })()}
        </Column>
        <Column lg={3} md={2} sm={4}>
          <Select
            id="lt-threshold-type"
            labelText={t('label.linkedTest.thresholdType', 'Limit Type')}
            value={thresholdType}
            onChange={(e) => setThresholdType(e.target.value)}
          >
            <SelectItem value="HIGH" text={t('label.thresholdType.high', 'High Limit ≤ (fail if exceeded)')} />
            <SelectItem value="LOW" text={t('label.thresholdType.low', 'Low Limit ≥ (fail if below)')} />
            <SelectItem value="RANGE" text={t('label.thresholdType.range', 'Normal Range (low–high)')} />
            <SelectItem value="BORDERLINE" text={t('label.thresholdType.borderline', 'Borderline / Advisory (warn, not fail)')} />
            <SelectItem value="DESCRIPTIVE" text={t('label.thresholdType.descriptive', 'Qualitative (text match)')} />
          </Select>
        </Column>

        {/* Lower bound: LOW, RANGE, BORDERLINE */}
        {(thresholdType === 'LOW' || thresholdType === 'MIN' || thresholdType === 'RANGE' || thresholdType === 'BORDERLINE') && (
          <Column lg={2} md={2} sm={2}>
            <TextInput
              id="lt-value-lower"
              labelText={thresholdType === 'LOW' || thresholdType === 'MIN'
                ? t('label.linkedTest.valueLower', 'Lower Limit')
                : t('label.linkedTest.valueLower', 'Lower Bound')}
              value={valueLower}
              onChange={(e) => setValueLower(e.target.value)}
              placeholder="0"
            />
          </Column>
        )}
        {/* Upper bound: HIGH, MAX, RANGE, BORDERLINE */}
        {(thresholdType === 'HIGH' || thresholdType === 'MAX' || thresholdType === 'RANGE' || thresholdType === 'BORDERLINE') && (
          <Column lg={2} md={2} sm={2}>
            <TextInput
              id="lt-value-upper"
              labelText={thresholdType === 'HIGH' || thresholdType === 'MAX'
                ? t('label.linkedTest.valueUpper', 'Upper Limit')
                : t('label.linkedTest.valueUpper', 'Upper Bound')}
              value={valueUpper}
              onChange={(e) => setValueUpper(e.target.value)}
              placeholder="0"
            />
          </Column>
        )}
        {thresholdType === 'DESCRIPTIVE' && (
          <Column lg={4} md={4} sm={4}>
            <TextInput
              id="lt-value-descriptive"
              labelText={t('label.linkedTest.valueDescriptive', 'Allowed Value')}
              value={valueDescriptive}
              onChange={(e) => setValueDescriptive(e.target.value)}
              placeholder={t('placeholder.linkedTest.descriptive', 'e.g., No odor, Absent, Clear')}
            />
          </Column>
        )}

        <Column lg={2} md={2} sm={2}>
          <TextInput
            id="lt-unit"
            labelText={t('label.linkedTest.unit', 'Unit')}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="mg/L"
          />
        </Column>

        {/* Borderline advisory note */}
        {thresholdType === 'BORDERLINE' && (
          <Column lg={6} md={6} sm={4}>
            <TextInput
              id="lt-borderline-note"
              labelText={t('label.linkedTest.borderlineNote', 'Advisory Note (shown on review flag)')}
              placeholder={t('placeholder.linkedTest.borderlineNote', 'e.g., Requires re-sampling within 24h')}
            />
          </Column>
        )}
      </Grid>

      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-04)' }}>
        <Button kind="primary" size="sm" renderIcon={Save} onClick={handleSave}>
          {t('button.save', 'Save')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>
          {t('button.cancel', 'Cancel')}
        </Button>
      </Stack>
    </Tile>
  );
}


// ============================================================
// DERIVED SAMPLE TYPES PANEL
// Computes sample types from linked tests; allows deselection
// ============================================================

function DerivedSampleTypesPanel({ groups }) {
  const derivedTypes = useMemo(() => deriveSampleTypes(groups), [groups]);

  // All derived types are checked by default; admins can uncheck to exclude
  const [checkedTypes, setCheckedTypes] = useState(() =>
    new Set(derivedTypes.map(dt => dt.name))
  );

  const toggleType = (name) => {
    setCheckedTypes(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (derivedTypes.length === 0) {
    return (
      <div style={{ padding: 'var(--cds-spacing-05)', background: 'var(--cds-layer-01)', borderRadius: '4px', border: '1px dashed var(--cds-border-subtle)' }}>
        <p style={{ color: 'var(--cds-text-placeholder)', fontSize: '0.875rem', margin: 0 }}>
          {t('message.sampleTypes.empty', 'No sample types derived yet. Link tests to parameter groups to populate this list.')}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--cds-spacing-04)', background: 'var(--cds-layer-01)', borderRadius: '4px', border: '1px solid var(--cds-border-subtle)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)', marginBottom: 'var(--cds-spacing-04)', marginTop: 0 }}>
        {t('message.sampleTypes.derived', 'Sample types are automatically derived from linked tests. Uncheck any that should not apply to this standard.')}
      </p>
      <Stack gap={3}>
        {derivedTypes.map(({ name, count }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-04)' }}>
            <Checkbox
              id={`sampletype-${name}`}
              labelText=""
              checked={checkedTypes.has(name)}
              onChange={() => toggleType(name)}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: checkedTypes.has(name) ? 500 : 400, color: checkedTypes.has(name) ? 'var(--cds-text-primary)' : 'var(--cds-text-disabled)' }}>
              {name}
            </span>
            <Tag size="sm" type={checkedTypes.has(name) ? 'blue' : 'gray'}>
              {count} {count === 1 ? t('label.test', 'test') : t('label.tests', 'tests')}
            </Tag>
            {!checkedTypes.has(name) && (
              <Tag size="sm" type="warm-gray">{t('label.sampleType.excluded', 'excluded')}</Tag>
            )}
          </div>
        ))}
      </Stack>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)', marginTop: 'var(--cds-spacing-04)', marginBottom: 0 }}>
        {t('message.sampleTypes.activeCount', `${checkedTypes.size} of ${derivedTypes.length} sample types active for this standard`)}
      </p>
    </div>
  );
}


// ============================================================
// STANDARD INLINE FORM (Add / Edit)
// ============================================================

function StandardInlineForm({ standard, isNew, onSave, onCancel }) {
  const [name, setName] = useState(standard?.name || '');
  const [issuingBody, setIssuingBody] = useState(standard?.issuingBody || '');
  const [regulationNumber, setRegulationNumber] = useState(standard?.regulationNumber || '');
  const [version, setVersion] = useState(standard?.version || '');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(standard?.status || 'DRAFT');
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groups, setGroups] = useState(standard?.groups || []);

  return (
    <Tile>
      <h4 style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        {isNew
          ? t('heading.complianceStandard.addNew', 'Add New Compliance Standard')
          : t('heading.complianceStandard.edit', 'Edit Compliance Standard')}
      </h4>

      {/* ── Basic Metadata ── */}
      <Grid>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="std-name"
            labelText={t('label.complianceStandard.name', 'Standard Name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Column>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="std-issuing-body"
            labelText={t('label.complianceStandard.issuingBody', 'Issuing Body')}
            value={issuingBody}
            onChange={(e) => setIssuingBody(e.target.value)}
            required
          />
        </Column>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="std-reg-number"
            labelText={t('label.complianceStandard.regulationNumber', 'Regulation Number')}
            value={regulationNumber}
            onChange={(e) => setRegulationNumber(e.target.value)}
            required
          />
        </Column>
        <Column lg={2} md={2} sm={4}>
          <TextInput
            id="std-version"
            labelText={t('label.complianceStandard.version', 'Version')}
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            required
          />
        </Column>
        <Column lg={2} md={2} sm={4}>
          <Select
            id="std-status"
            labelText={t('label.complianceStandard.status', 'Status')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <SelectItem value="DRAFT" text="Draft" />
            <SelectItem value="ACTIVE" text="Active" />
            <SelectItem value="SUPERSEDED" text="Superseded" />
            <SelectItem value="ARCHIVED" text="Archived" />
          </Select>
        </Column>
        <Column lg={3} md={4} sm={4}>
          <DatePicker datePickerType="single">
            <DatePickerInput
              id="std-effective-date"
              labelText={t('label.complianceStandard.effectiveDate', 'Effective Date')}
              placeholder="yyyy-mm-dd"
            />
          </DatePicker>
        </Column>
        <Column lg={3} md={4} sm={4}>
          <DatePicker datePickerType="single">
            <DatePickerInput
              id="std-expiry-date"
              labelText={t('label.complianceStandard.expiryDate', 'Expiry Date')}
              placeholder="yyyy-mm-dd"
            />
          </DatePicker>
        </Column>
        <Column lg={4} md={4} sm={4}>
          <ComboBox
            id="std-region"
            titleText={t('label.complianceStandard.countryRegion', 'Country / Region')}
            items={['Indonesia', 'International', 'United States', 'European Union', 'Madagascar', "Côte d'Ivoire"]}
            selectedItem={standard?.countryRegion || ''}
            placeholder={t('placeholder.complianceStandard.selectRegion', 'Select or type...')}
          />
        </Column>
        <Column lg={16} md={8} sm={4}>
          <TextArea
            id="std-description"
            labelText={t('label.complianceStandard.description', 'Description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </Column>
      </Grid>

      {/* ── Parameter Groups with Linked Tests ── */}
      {!isNew && (
        <div style={{ marginTop: 'var(--cds-spacing-06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--cds-spacing-04)' }}>
            <h5 style={{ margin: 0 }}>{t('heading.complianceStandard.parameterGroups', 'Parameter Groups & Linked Tests')}</h5>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Add}
              onClick={() => setAddingGroup(true)}
            >
              {t('button.complianceStandard.addGroup', 'Add Group')}
            </Button>
          </div>

          {addingGroup && (
            <Tile style={{ marginBottom: 'var(--cds-spacing-04)', padding: '1rem', background: 'var(--cds-layer-02)' }}>
              <Grid>
                <Column lg={8} md={6} sm={4}>
                  <TextInput
                    id="new-group-name"
                    labelText={t('label.parameterGroup.name', 'Group Name')}
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder={t('placeholder.parameterGroup.name', 'e.g., Microbiological Parameters')}
                  />
                </Column>
                <Column lg={8} md={2} sm={4} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <Button kind="primary" size="sm" onClick={() => {
                    if (newGroupName.trim()) {
                      setGroups(prev => [...prev, { id: `new-${Date.now()}`, name: newGroupName.trim(), description: '', sortOrder: prev.length + 1 }]);
                    }
                    setNewGroupName('');
                    setAddingGroup(false);
                  }}>
                    {t('button.add', 'Add')}
                  </Button>
                  <Button kind="ghost" size="sm" onClick={() => { setAddingGroup(false); setNewGroupName(''); }}>
                    {t('button.cancel', 'Cancel')}
                  </Button>
                </Column>
              </Grid>
            </Tile>
          )}

          {groups.length > 0 ? (
            <Accordion>
              {groups.map((group) => (
                <ParameterGroupAccordionItem key={group.id} group={group} />
              ))}
            </Accordion>
          ) : (
            <p style={{ color: 'var(--cds-text-placeholder)', fontSize: '0.875rem', fontStyle: 'italic' }}>
              {t('message.complianceStandard.noGroups', 'No parameter groups defined. Add a group to start linking tests and defining thresholds.')}
            </p>
          )}
        </div>
      )}

      {/* ── Derived Sample Types ── */}
      {!isNew && groups.length > 0 && (
        <div style={{ marginTop: 'var(--cds-spacing-06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)', marginBottom: 'var(--cds-spacing-04)' }}>
            <h5 style={{ margin: 0 }}>{t('heading.complianceStandard.sampleTypes', 'Applicable Sample Types')}</h5>
            <Tag size="sm" type="blue">
              {t('label.sampleTypes.derived', 'Derived from linked tests')}
            </Tag>
          </div>
          <DerivedSampleTypesPanel groups={groups} />
        </div>
      )}

      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-06)' }}>
        <Button kind="primary" size="sm" renderIcon={Save} onClick={onSave}>
          {t('button.complianceStandard.save', 'Save')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>
          {t('button.complianceStandard.cancel', 'Cancel')}
        </Button>
      </Stack>
    </Tile>
  );
}


// ============================================================
// CSV Import Modal
// ============================================================

function CSVImportModal({ open, onClose }) {
  const [importScope, setImportScope] = useState('full');
  const [showPreview, setShowPreview] = useState(false);

  const mockPreviewRows = [
    { row: 1, standard: 'PP No. 22/2021', group: 'Physical Parameters', test: 'Turbidity', matchStatus: 'Matched', threshold: 'Max ≤ 25 NTU', validation: 'Valid' },
    { row: 2, standard: 'PP No. 22/2021', group: 'Physical Parameters', test: 'Color', matchStatus: 'Matched', threshold: 'Max ≤ 50 TCU', validation: 'Valid' },
    { row: 3, standard: 'PP No. 22/2021', group: 'Physical Parameters', test: 'DO', matchStatus: 'Matched', threshold: 'Min ≥ 4 mg/L', validation: 'Valid' },
    { row: 4, standard: 'PP No. 22/2021', group: 'Inorganic Chemical', test: 'Arsenic (As)', matchStatus: 'Matched', threshold: 'Max ≤ 0.05 mg/L', validation: 'Valid' },
    { row: 5, standard: 'PP No. 22/2021', group: 'Microbiological', test: 'Coliform sp.', matchStatus: 'Not Found', threshold: 'Max ≤ 5000 CFU/100mL', validation: 'Error: Test not found' },
  ];

  return (
    <Modal
      open={open}
      modalHeading={t('heading.complianceStandard.import', 'Import Compliance Standards from CSV')}
      primaryButtonText={showPreview ? t('button.complianceStandard.importConfirm', 'Import') : t('button.complianceStandard.uploadPreview', 'Upload & Preview')}
      secondaryButtonText={t('button.complianceStandard.cancel', 'Cancel')}
      onRequestClose={() => { onClose(); setShowPreview(false); }}
      onRequestSubmit={() => {
        if (!showPreview) setShowPreview(true);
        else { onClose(); setShowPreview(false); }
      }}
      size="lg"
    >
      {!showPreview ? (
        <Stack gap={5}>
          <RadioButtonGroup
            legendText={t('label.complianceStandard.importScope', 'Import Scope')}
            name="import-scope"
            defaultSelected="full"
            onChange={(val) => setImportScope(val)}
          >
            <RadioButton labelText={t('label.complianceStandard.importScopeStandards', 'Standards & Groups only')} value="standards" id="scope-standards" />
            <RadioButton labelText={t('label.complianceStandard.importScopeFull', 'Standards, Groups, Tests & Thresholds')} value="full" id="scope-full" />
          </RadioButtonGroup>

          <FileUploader
            accept={['.csv']}
            buttonLabel={t('button.complianceStandard.selectFile', 'Select CSV file')}
            filenameStatus="edit"
            labelDescription={t('label.complianceStandard.importFileHint', 'Max file size: 5MB. Only .csv files accepted.')}
            labelTitle={t('label.complianceStandard.importFile', 'Upload File')}
          />

          <Button kind="ghost" size="sm" renderIcon={Download}>
            {t('button.complianceStandard.downloadTemplate', 'Download Template')}
          </Button>
        </Stack>
      ) : (
        <Stack gap={5}>
          <h4>{t('heading.complianceStandard.importPreview', 'Import Preview')}</h4>
          <Stack orientation="horizontal" gap={5}>
            <Tag type="blue">Total: 5</Tag>
            <Tag type="green">Valid: 4</Tag>
            <Tag type="red">Errors: 1</Tag>
          </Stack>
          <Table size="sm">
            <TableHead>
              <TableRow>
                <TableHeader>{t('label.complianceStandard.importRow', 'Row')}</TableHeader>
                <TableHeader>{t('label.complianceStandard.name', 'Standard')}</TableHeader>
                <TableHeader>{t('label.complianceStandard.parameterGroups', 'Group')}</TableHeader>
                <TableHeader>{t('label.linkedTest.testName', 'Test')}</TableHeader>
                <TableHeader>{t('label.complianceStandard.importMatch', 'Match')}</TableHeader>
                <TableHeader>{t('label.linkedTest.allowedRange', 'Range')}</TableHeader>
                <TableHeader>{t('label.complianceStandard.importValidation', 'Status')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockPreviewRows.map((row) => (
                <TableRow key={row.row} style={row.validation.startsWith('Error') ? { borderLeft: '3px solid var(--cds-support-error)' } : {}}>
                  <TableCell>{row.row}</TableCell>
                  <TableCell>{row.standard}</TableCell>
                  <TableCell>{row.group}</TableCell>
                  <TableCell>{row.test}</TableCell>
                  <TableCell>
                    <Tag size="sm" type={row.matchStatus === 'Matched' ? 'green' : 'red'}>{row.matchStatus}</Tag>
                  </TableCell>
                  <TableCell>{row.threshold}</TableCell>
                  <TableCell>
                    {row.validation === 'Valid'
                      ? <Tag size="sm" type="green">{row.validation}</Tag>
                      : <Tag size="sm" type="red">{row.validation}</Tag>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Checkbox id="skip-errors" labelText={t('button.complianceStandard.skipErrors', 'Skip error rows and import valid rows only')} />
        </Stack>
      )}
    </Modal>
  );
}


// ============================================================
// SCREEN 2: Compliance Thresholds Tab in Test Editor
// Test Catalog → [Test Editor] → Compliance (vertical tab sidebar)
// ============================================================

const mockThresholds = [
  { id: 't1', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Physical Parameters', thresholdType: 'MAX', valueUpper: 25, unit: 'NTU', effectiveDate: '2021-02-02', isActive: true },
  { id: 't2', standardName: 'WHO Drinking Water Guidelines', parameterGroup: 'Chemical Contaminants', thresholdType: 'MAX', valueUpper: 5, unit: 'NTU', effectiveDate: '2022-03-21', isActive: true },
  { id: 't3', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Physical Parameters', thresholdType: 'RANGE', valueLower: 6.5, valueUpper: 8.5, unit: 'pH', effectiveDate: '2021-02-02', isActive: true },
  { id: 't4', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Microbiological Parameters', thresholdType: 'MAX', valueUpper: 5000, unit: 'CFU/100mL', effectiveDate: '2021-02-02', isActive: true },
  { id: 't5', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Physical Parameters', thresholdType: 'DESCRIPTIVE', valueDescriptive: 'No odor', unit: '—', effectiveDate: '2021-02-02', isActive: true },
];

function ComplianceThresholdsTab() {
  const [groupBy, setGroupBy] = useState('standard');
  const [expandedRow, setExpandedRow] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [notification, setNotification] = useState(null);

  const toggleRow = (id) => setExpandedRow((prev) => (prev === id ? null : id));

  return (
    <Stack gap={5}>
      {notification && (
        <InlineNotification kind={notification.kind} title={notification.title} onClose={() => setNotification(null)} />
      )}

      <Stack orientation="horizontal" gap={3}>
        <Select id="group-by" labelText={t('label.complianceThreshold.groupBy', 'Group by')} inline value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
          <SelectItem value="standard" text={t('label.complianceThreshold.groupBy.standard', 'Standard')} />
          <SelectItem value="parameterGroup" text={t('label.complianceThreshold.groupBy.parameterGroup', 'Parameter Group')} />
        </Select>
        <Button kind="primary" size="sm" renderIcon={Add} onClick={() => setAddingNew(true)}>
          {t('button.complianceThreshold.add', 'Add Threshold')}
        </Button>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('label.complianceThreshold.standard', 'Standard')}</TableHeader>
              <TableHeader>{t('label.complianceThreshold.parameterGroup', 'Parameter Group')}</TableHeader>
              <TableHeader>{t('label.complianceThreshold.thresholdType', 'Type')}</TableHeader>
              <TableHeader>{t('label.linkedTest.allowedRange', 'Allowed Range')}</TableHeader>
              <TableHeader>{t('label.linkedTest.unit', 'Unit')}</TableHeader>
              <TableHeader>{t('label.complianceStandard.effectiveDate', 'Effective Date')}</TableHeader>
              <TableHeader>{t('label.complianceStandard.status', 'Status')}</TableHeader>
              <TableHeader>{''}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {addingNew && (
              <TableRow>
                <TableCell colSpan={8}>
                  <LinkedTestInlineForm
                    isNew
                    onSave={() => { setAddingNew(false); setNotification({ kind: 'success', title: t('message.complianceThreshold.saveSuccess', 'Threshold saved.') }); }}
                    onCancel={() => setAddingNew(false)}
                  />
                </TableCell>
              </TableRow>
            )}
            {mockThresholds.map((th) => (
              <React.Fragment key={th.id}>
                <TableRow>
                  <TableCell>{th.standardName}</TableCell>
                  <TableCell>{th.parameterGroup}</TableCell>
                  <TableCell>
                    <Tag size="sm" type={thresholdTypeKindMapFull[th.thresholdType] || 'gray'}>
                      {t(`label.thresholdType.${th.thresholdType.toLowerCase()}`, thresholdTypeLabelsFull[th.thresholdType] || th.thresholdType)}
                    </Tag>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'monospace' }}>{formatRange(th)}</TableCell>
                  <TableCell>{th.unit}</TableCell>
                  <TableCell>{th.effectiveDate}</TableCell>
                  <TableCell>
                    <Tag size="sm" type={th.isActive ? 'green' : 'gray'}>{th.isActive ? 'Active' : 'Archived'}</Tag>
                  </TableCell>
                  <TableCell>
                    <Button kind="ghost" size="sm" hasIconOnly iconDescription={t('button.complianceThreshold.edit', 'Edit')}
                      renderIcon={expandedRow === th.id ? ChevronUp : ChevronDown} onClick={() => toggleRow(th.id)} />
                  </TableCell>
                </TableRow>
                {expandedRow === th.id && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <LinkedTestInlineForm
                        link={th}
                        onSave={() => { setExpandedRow(null); setNotification({ kind: 'success', title: t('message.complianceThreshold.saveSuccess', 'Threshold saved.') }); }}
                        onCancel={() => setExpandedRow(null)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}


// ============================================================
// TEST EDITOR — Vertical Tab Sidebar (matches test-catalog.jsx)
// ============================================================

const testEditorTabs = {
  Configuration: [
    { id: 'basic', label: 'Basic Info' },
    { id: 'sample', label: 'Sample & Results' },
    { id: 'ranges', label: 'Ranges' },
    { id: 'storage', label: 'Sample Storage' },
  ],
  Organization: [
    { id: 'ordering', label: 'Display Order' },
    { id: 'panels', label: 'Panels' },
    { id: 'labels', label: 'Labels' },
  ],
  Resources: [
    { id: 'terminology', label: 'Terminology' },
    { id: 'reagents', label: 'Reagents' },
  ],
  Automation: [
    { id: 'analyzers', label: 'Analyzers' },
    { id: 'methods', label: 'Methods' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'reflex', label: 'Reflex & Calc' },
  ],
  Compliance: [
    { id: 'compliance', label: 'Compliance' },
  ],
};

function TestEditorWithCompliance() {
  const [activeTab, setActiveTab] = useState('compliance');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f4f4f4' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1rem 1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button kind="ghost" size="sm" href="#">← Back</Button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Edit Test: Turbidity (NTU)</h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-02)', margin: 0 }}>
                LOINC: 13965-9 &nbsp;|&nbsp; Sample Type: Water &nbsp;|&nbsp; Result Type: Numeric
              </p>
            </div>
          </div>
          <Stack orientation="horizontal" gap={3}>
            <Button kind="secondary" size="sm">Cancel</Button>
            <Button kind="primary" size="sm" renderIcon={Save}>Save Test</Button>
          </Stack>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <nav style={{ width: '14rem', background: '#fff', borderRight: '1px solid #e0e0e0', flexShrink: 0, overflowY: 'auto', padding: '0.5rem' }}>
          {Object.entries(testEditorTabs).map(([group, tabs]) => (
            <div key={group} style={{ marginBottom: '0.75rem' }}>
              <p style={{ padding: '0.375rem 0.75rem', fontSize: '0.6875rem', fontWeight: 600, color: '#a8a8a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group}
              </p>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500,
                    border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
                    marginBottom: '2px', textAlign: 'left',
                    background: activeTab === tab.id ? '#defbe6' : 'transparent',
                    color: activeTab === tab.id ? '#0e6027' : '#525252',
                    borderLeft: activeTab === tab.id ? '3px solid #0e6027' : '3px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ maxWidth: '64rem' }}>
            {activeTab === 'compliance' && <ComplianceThresholdsTab />}
            {activeTab !== 'compliance' && (
              <p style={{ color: 'var(--cds-text-02)' }}>(Existing {activeTab} tab content — see test-catalog.jsx)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// COMBINED APP
// ============================================================

export default function ComplianceStandardsApp() {
  const [activeScreen, setActiveScreen] = useState(0);

  return (
    <div>
      <Tabs selectedIndex={activeScreen} onChange={({ selectedIndex }) => setActiveScreen(selectedIndex)}>
        <TabList aria-label="Compliance Standards Screens">
          <Tab>{t('label.complianceStandard.title', 'Compliance Standards List')}</Tab>
          <Tab>{t('label.complianceThreshold.title', 'Compliance Tab (Test Editor)')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel><ComplianceStandardsList /></TabPanel>
          <TabPanel><TestEditorWithCompliance /></TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
