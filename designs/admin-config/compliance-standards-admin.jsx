/**
 * S-01: Compliance Standards Administration — React/Carbon Mockup  v2.3
 *
 * Two screens:
 *   1. Admin → Test Management → Compliance Standards (standards CRUD)
 *   2. Test Catalog → [Test Editor] → Compliance tab (vertical tab sidebar, per-test thresholds)
 *
 * v2.3 enhancements (over v2.0):
 *   - CSV import removed — will not be supported in this sprint
 *   - Sample Types are now EXPLICITLY DECLARED on the standard (not derived from linked tests).
 *     A dedicated Applicable Sample Types panel with Add/Remove chip UI appears BEFORE the
 *     Parameter Groups accordion. Declared types drive filter chips in the Link Test form.
 *   - Multi-limit configuration: all 5 limit types (HIGH, LOW, RANGE, BORDERLINE, DESCRIPTIVE)
 *     are configured in a single edit form — not added one per action.
 *     The linked-tests table shows ONE row per test with limit-type badge pills summarizing
 *     all configured limits. Clicking ✏ expands a multi-row form below the test.
 *   - Select list test support: tests with resultType:'select' get a value-to-compliance
 *     mapping table (options pulled from test catalog) instead of numeric thresholds.
 *
 * Mock data structure for linked tests (GROUP_TEST_DATA):
 *   groupId → testCode → {
 *     testName, resultType('numeric'|'select'), sampleTypes,
 *     limits: [{ type, lower, upper, unit, note }]   // for numeric tests
 *     valueMap: { option: 'compliant'|'borderline'|'noncompliant' }  // for select tests
 *   }
 *
 * The Test Editor uses a vertical tab sidebar (not horizontal Carbon Tabs) per test-catalog.jsx.
 * The "Compliance" tab is placed under a new Compliance section group after the Automation group.
 * Tab groups: Configuration | Organization | Resources | Automation | Compliance
 *
 * Dependencies: @carbon/react, @carbon/icons-react
 * Companion FRS: S01-compliance-standards-admin-frs-v2.0.md
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
  FormGroup,
} from '@carbon/react';
import { Add, Edit, TrashCan, ChevronDown, ChevronUp, Download, Save, Renew, Copy, View, Link, Unlink, Close } from '@carbon/icons-react';

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
  HIGH: 'red',
  LOW: 'blue',
  RANGE: 'teal',
  BORDERLINE: 'warm-gray',
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

// All tests known to the system.
// resultType: 'numeric' (default) or 'select' (predefined options from test catalog).
// options: array of allowed result values for select-type tests.
const allSystemTests = [
  { id: 'T-001', name: 'Turbidity', code: 'TURB-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-002', name: 'Color (TCU)', code: 'COLOR-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-003', name: 'pH', code: 'PH-01', sampleTypes: ['Water', 'Soil'], resultType: 'numeric' },
  { id: 'T-004', name: 'Temperature', code: 'TEMP-01', sampleTypes: ['Water', 'Air'], resultType: 'numeric' },
  { id: 'T-005', name: 'Odor', code: 'ODOR-01', sampleTypes: ['Water'], resultType: 'select',
    options: ['No odor', 'Faint', 'Moderate', 'Strong'] },
  { id: 'T-006', name: 'Total Dissolved Solids', code: 'TDS-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-007', name: 'Arsenic (As)', code: 'AS-01', sampleTypes: ['Water', 'Soil'], resultType: 'numeric' },
  { id: 'T-008', name: 'Lead (Pb)', code: 'PB-01', sampleTypes: ['Water', 'Soil'], resultType: 'numeric' },
  { id: 'T-009', name: 'Iron (Fe)', code: 'FE-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-010', name: 'Nitrate (NO₃⁻)', code: 'NO3-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-011', name: 'Mercury (Hg)', code: 'HG-01', sampleTypes: ['Water', 'Soil', 'Sediment'], resultType: 'numeric' },
  { id: 'T-012', name: 'Fluoride (F⁻)', code: 'FLR-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-013', name: 'Chloroform', code: 'CHLF-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-014', name: 'Pesticides (Total)', code: 'PEST-01', sampleTypes: ['Water', 'Soil', 'Sediment'], resultType: 'numeric' },
  { id: 'T-015', name: 'Total Coliform', code: 'TCOL-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-016', name: 'E. coli', code: 'ECOL-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-017', name: 'Fecal Coliform', code: 'FCOL-01', sampleTypes: ['Water'], resultType: 'numeric' },
  { id: 'T-018', name: 'SO₂ (Sulfur Dioxide)', code: 'SO2-01', sampleTypes: ['Air'], resultType: 'numeric' },
  { id: 'T-019', name: 'CO (Carbon Monoxide)', code: 'CO-01', sampleTypes: ['Air'], resultType: 'numeric' },
  { id: 'T-020', name: 'NO₂ (Nitrogen Dioxide)', code: 'NO2-01', sampleTypes: ['Air'], resultType: 'numeric' },
  { id: 'T-021', name: 'PM10 (Particulate Matter)', code: 'PM10-01', sampleTypes: ['Air'], resultType: 'numeric' },
  { id: 'T-022', name: 'PM2.5 (Fine Particles)', code: 'PM25-01', sampleTypes: ['Air'], resultType: 'numeric' },
  { id: 'T-023', name: 'Presence/Absence (Coliform)', code: 'PA-COL-01', sampleTypes: ['Water'], resultType: 'select',
    options: ['Absent', 'Present'] },
  { id: 'T-024', name: 'Dissolved Oxygen Status', code: 'DO-STATUS-01', sampleTypes: ['Water'], resultType: 'select',
    options: ['Saturated', 'Adequate', 'Low', 'Depleted'] },
];

/**
 * Linked tests per parameter group — keyed groupId → testCode → test data.
 *
 * For numeric tests: { testName, resultType, sampleTypes, limits[] }
 *   limits: array of { type, lower, upper, unit, note }
 *   Limit types:
 *     HIGH        — absolute upper limit; result non-compliant if exceeded
 *     LOW         — absolute lower limit; result non-compliant if below
 *     RANGE       — acceptable normal range (lower–upper)
 *     BORDERLINE  — advisory warning zone; triggers review flag, not outright fail
 *     DESCRIPTIVE — qualitative expected text value; manual review
 *
 * For select tests: { testName, resultType:'select', sampleTypes, valueMap }
 *   valueMap: { option → 'compliant' | 'borderline' | 'noncompliant' }
 */
const initialGroupTestData = {
  // PP No. 22/2021 — Water Quality
  'g1': {  // Physical Parameters
    'TURB-01': { testName: 'Turbidity', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [
        { type: 'HIGH', lower: '', upper: '25', unit: 'NTU', note: '' },
        { type: 'BORDERLINE', lower: '20', upper: '25', unit: 'NTU', note: 'Requires re-sampling' },
      ]
    },
    'COLOR-01': { testName: 'Color (TCU)', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [{ type: 'HIGH', lower: '', upper: '50', unit: 'TCU', note: '' }]
    },
    'PH-01': { testName: 'pH', resultType: 'numeric', sampleTypes: ['Water', 'Soil'],
      limits: [
        { type: 'RANGE', lower: '6.5', upper: '8.5', unit: 'pH', note: '' },
        { type: 'BORDERLINE', lower: '6.5', upper: '7.0', unit: 'pH', note: 'Borderline low; flag for review' },
      ]
    },
    'TEMP-01': { testName: 'Temperature', resultType: 'numeric', sampleTypes: ['Water', 'Air'],
      limits: [{ type: 'HIGH', lower: '', upper: '30', unit: '°C', note: '' }]
    },
    'ODOR-01': { testName: 'Odor', resultType: 'select', sampleTypes: ['Water'],
      valueMap: {
        'No odor': 'compliant',
        'Faint': 'borderline',
        'Moderate': 'noncompliant',
        'Strong': 'noncompliant',
      }
    },
    'TDS-01': { testName: 'Total Dissolved Solids', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [{ type: 'HIGH', lower: '', upper: '1000', unit: 'mg/L', note: '' }]
    },
  },
  'g2': {  // Inorganic Chemical Parameters
    'AS-01': { testName: 'Arsenic (As)', resultType: 'numeric', sampleTypes: ['Water', 'Soil'],
      limits: [
        { type: 'HIGH', lower: '', upper: '0.05', unit: 'mg/L', note: '' },
        { type: 'BORDERLINE', lower: '0.04', upper: '0.05', unit: 'mg/L', note: 'Advisory threshold (WHO 0.01 mg/L)' },
      ]
    },
    'PB-01': { testName: 'Lead (Pb)', resultType: 'numeric', sampleTypes: ['Water', 'Soil'],
      limits: [{ type: 'HIGH', lower: '', upper: '0.01', unit: 'mg/L', note: '' }]
    },
    'FE-01': { testName: 'Iron (Fe)', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [
        { type: 'HIGH', lower: '', upper: '0.3', unit: 'mg/L', note: '' },
        { type: 'LOW', lower: '0.0', upper: '', unit: 'mg/L', note: 'Detect presence' },
      ]
    },
    'NO3-01': { testName: 'Nitrate (NO₃⁻)', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [{ type: 'HIGH', lower: '', upper: '50', unit: 'mg/L', note: '' }]
    },
    'HG-01': { testName: 'Mercury (Hg)', resultType: 'numeric', sampleTypes: ['Water', 'Soil', 'Sediment'],
      limits: [{ type: 'HIGH', lower: '', upper: '0.001', unit: 'mg/L', note: '' }]
    },
    'FLR-01': { testName: 'Fluoride (F⁻)', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [
        { type: 'HIGH', lower: '', upper: '1.5', unit: 'mg/L', note: '' },
        { type: 'LOW', lower: '0.5', upper: '', unit: 'mg/L', note: 'Min fluoride for dental health' },
      ]
    },
  },
  'g3': {  // Organic Chemical Parameters
    'CHLF-01': { testName: 'Chloroform', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [{ type: 'HIGH', lower: '', upper: '0.03', unit: 'mg/L', note: '' }]
    },
    'PEST-01': { testName: 'Pesticides (Total)', resultType: 'numeric', sampleTypes: ['Water', 'Soil', 'Sediment'],
      limits: [
        { type: 'HIGH', lower: '', upper: '0.0005', unit: 'mg/L', note: '' },
        { type: 'BORDERLINE', lower: '0.0004', upper: '0.0005', unit: 'mg/L', note: 'Advisory: investigate source' },
      ]
    },
  },
  'g4': {  // Microbiological Parameters
    'TCOL-01': { testName: 'Total Coliform', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [{ type: 'HIGH', lower: '', upper: '0', unit: 'CFU/100mL', note: '' }]
    },
    'ECOL-01': { testName: 'E. coli', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [{ type: 'HIGH', lower: '', upper: '0', unit: 'CFU/100mL', note: '' }]
    },
    'FCOL-01': { testName: 'Fecal Coliform', resultType: 'numeric', sampleTypes: ['Water'],
      limits: [
        { type: 'HIGH', lower: '', upper: '5000', unit: 'CFU/100mL', note: '' },
        { type: 'BORDERLINE', lower: '3000', upper: '5000', unit: 'CFU/100mL', note: 'Advisory: repeat sample within 24h' },
      ]
    },
    'PA-COL-01': { testName: 'Presence/Absence (Coliform)', resultType: 'select', sampleTypes: ['Water'],
      valueMap: {
        'Absent': 'compliant',
        'Present': 'noncompliant',
      }
    },
  },
  // PP No. 41/1999 — Ambient Air Quality
  'g5': {  // Primary Pollutants
    'SO2-01': { testName: 'SO₂', resultType: 'numeric', sampleTypes: ['Air'],
      limits: [{ type: 'HIGH', lower: '', upper: '0.1', unit: 'ppm', note: '' }]
    },
    'CO-01': { testName: 'CO', resultType: 'numeric', sampleTypes: ['Air'],
      limits: [
        { type: 'HIGH', lower: '', upper: '35', unit: 'ppm', note: '' },
        { type: 'BORDERLINE', lower: '25', upper: '35', unit: 'ppm', note: 'Alert level — notify field team' },
      ]
    },
    'NO2-01': { testName: 'NO₂', resultType: 'numeric', sampleTypes: ['Air'],
      limits: [{ type: 'HIGH', lower: '', upper: '0.053', unit: 'ppm', note: '' }]
    },
    'PM10-01': { testName: 'PM10', resultType: 'numeric', sampleTypes: ['Air'],
      limits: [
        { type: 'HIGH', lower: '', upper: '150', unit: 'µg/m³', note: '' },
        { type: 'BORDERLINE', lower: '100', upper: '150', unit: 'µg/m³', note: 'Moderate air quality — flag' },
      ]
    },
    'PM25-01': { testName: 'PM2.5', resultType: 'numeric', sampleTypes: ['Air'],
      limits: [{ type: 'HIGH', lower: '', upper: '35', unit: 'µg/m³', note: '' }]
    },
  },
  'g6': {},  // Secondary Pollutants — no linked tests in demo
};

const mockStandards = [
  {
    id: '1', name: 'PP No. 22/2021 — Water Quality', issuingBody: 'Government of Indonesia',
    regulationNumber: 'PP 22/2021', version: '2021', effectiveDate: '2021-02-02',
    countryRegion: 'Indonesia', status: 'ACTIVE', parameterGroupCount: 4, linkedTestCount: 17,
    isPreSeeded: true,
    sampleTypes: ['Water', 'Soil', 'Sediment'],
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
    sampleTypes: ['Air'],
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
    sampleTypes: ['Water'],
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
    sampleTypes: [],
    groups: [],
  },
];

// All sample type categories available in the system
const ALL_SAMPLE_TYPE_CATEGORIES = ['Water', 'Air', 'Soil', 'Sediment', 'Food', 'Wastewater'];

// ============================================================
// HELPERS
// ============================================================

function formatLimitBadge(lim) {
  switch (lim.type) {
    case 'HIGH': return `≤ ${lim.upper}`;
    case 'LOW': return `≥ ${lim.lower}`;
    case 'RANGE': return `${lim.lower}–${lim.upper}`;
    case 'BORDERLINE': return `${lim.lower}–${lim.upper}`;
    case 'DESCRIPTIVE': return lim.note || '—';
    default: return '—';
  }
}

const complianceStatusColors = {
  compliant: { tag: 'green', label: 'Compliant ✓' },
  borderline: { tag: 'warm-gray', label: 'Borderline ⚑' },
  noncompliant: { tag: 'red', label: 'Non-Compliant ✗' },
};


// ============================================================
// EXPLICIT SAMPLE TYPES PANEL
// Admin declares applicable sample types before linking tests.
// Declared types drive filter chips in the Link Test form.
// ============================================================

function ExplicitSampleTypesPanel({ sampleTypes, onChange }) {
  const [addingType, setAddingType] = useState(false);
  const [newType, setNewType] = useState(null);

  const availableToAdd = ALL_SAMPLE_TYPE_CATEGORIES.filter(st => !sampleTypes.includes(st));

  const handleAdd = () => {
    if (newType && !sampleTypes.includes(newType)) {
      onChange([...sampleTypes, newType]);
      setNewType(null);
      setAddingType(false);
    }
  };

  const handleRemove = (st) => {
    onChange(sampleTypes.filter(s => s !== st));
  };

  return (
    <div style={{ padding: 'var(--cds-spacing-04)', background: 'var(--cds-layer-01)', borderRadius: '4px', border: '1px solid var(--cds-border-subtle)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)', marginBottom: 'var(--cds-spacing-04)', marginTop: 0 }}>
        {t('message.sampleTypes.explicit', 'Declare which sample type categories this standard applies to. These selections drive the test filter in the Link Test form.')}
      </p>

      {sampleTypes.length === 0 && !addingType && (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-placeholder)', fontStyle: 'italic', marginBottom: 'var(--cds-spacing-03)' }}>
          {t('message.sampleTypes.empty', 'No sample types declared yet.')}
        </p>
      )}

      <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap', marginBottom: 'var(--cds-spacing-03)' }}>
        {sampleTypes.map(st => (
          <Tag
            key={st}
            type="blue"
            size="sm"
            filter
            onClose={() => handleRemove(st)}
            title={t('button.sampleType.remove', 'Remove')}
          >
            {st}
          </Tag>
        ))}
      </Stack>

      {addingType ? (
        <Stack orientation="horizontal" gap={3} style={{ alignItems: 'flex-end' }}>
          <ComboBox
            id="add-sample-type"
            titleText=""
            items={availableToAdd}
            selectedItem={newType}
            onChange={({ selectedItem }) => setNewType(selectedItem)}
            placeholder={t('placeholder.sampleType.select', 'Select sample type...')}
            style={{ minWidth: '200px' }}
          />
          <Button kind="primary" size="sm" onClick={handleAdd} disabled={!newType}>
            {t('button.add', 'Add')}
          </Button>
          <Button kind="ghost" size="sm" onClick={() => { setAddingType(false); setNewType(null); }}>
            {t('button.cancel', 'Cancel')}
          </Button>
        </Stack>
      ) : (
        <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setAddingType(true)} disabled={availableToAdd.length === 0}>
          {t('button.sampleType.add', 'Add Sample Type')}
        </Button>
      )}
    </div>
  );
}


// ============================================================
// SELECT LIST COMPLIANCE MAPPING FORM
// For tests with resultType:'select' — maps each option to
// compliant / borderline / noncompliant.
// ============================================================

function SelectMapForm({ testCode, testName, options, existingMap, onSave, onCancel }) {
  const [valueMap, setValueMap] = useState(() => {
    const init = {};
    options.forEach(opt => { init[opt] = existingMap?.[opt] || 'noncompliant'; });
    return init;
  });

  const handleStatusChange = (option, status) => {
    setValueMap(prev => ({ ...prev, [option]: status }));
  };

  const statusOptions = [
    { value: 'compliant', label: 'Compliant ✓', tagType: 'green' },
    { value: 'borderline', label: 'Borderline ⚑', tagType: 'warm-gray' },
    { value: 'noncompliant', label: 'Non-Compliant ✗', tagType: 'red' },
  ];

  return (
    <Tile style={{ padding: '1rem', background: 'var(--cds-layer-02)' }}>
      <h6 style={{ marginBottom: 'var(--cds-spacing-02)' }}>
        {t('heading.selectMap.edit', 'Compliance Mapping')} — {testName}
      </h6>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)', marginBottom: 'var(--cds-spacing-04)' }}>
        {t('message.selectMap.hint', 'Map each result option to its compliance status. Options are pulled from the test catalog.')}
      </p>

      <Table size="sm" style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <TableHead>
          <TableRow>
            <TableHeader style={{ width: '40%' }}>{t('label.selectMap.option', 'Result Option')}</TableHeader>
            <TableHeader>{t('label.selectMap.status', 'Compliance Status')}</TableHeader>
            <TableHeader style={{ width: '30%' }}>{t('label.selectMap.preview', 'Preview')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {options.map(opt => {
            const currentStatus = valueMap[opt];
            const statusInfo = complianceStatusColors[currentStatus];
            return (
              <TableRow key={opt} style={{
                background: currentStatus === 'compliant' ? 'rgba(36,161,72,0.05)'
                  : currentStatus === 'borderline' ? 'rgba(168,168,168,0.07)'
                  : 'rgba(218,30,40,0.05)',
              }}>
                <TableCell style={{ fontWeight: 500 }}>{opt}</TableCell>
                <TableCell>
                  <Select
                    id={`smc-${testCode}-${opt.replace(/\s/g, '-')}`}
                    labelText=""
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(opt, e.target.value)}
                    size="sm"
                  >
                    {statusOptions.map(so => (
                      <SelectItem key={so.value} value={so.value} text={so.label} />
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Tag size="sm" type={statusInfo.tagType}>{statusInfo.label}</Tag>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Stack orientation="horizontal" gap={3}>
        <Button kind="primary" size="sm" renderIcon={Save} onClick={() => onSave(valueMap)}>
          {t('button.save', 'Save Mapping')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>
          {t('button.cancel', 'Cancel')}
        </Button>
      </Stack>
    </Tile>
  );
}


// ============================================================
// MULTI-LIMIT FORM
// For numeric tests — configure all 5 limit types in one form.
// Each type is a toggleable row; save all at once.
// ============================================================

const LIMIT_TYPES = [
  { type: 'HIGH', label: 'High Limit ≤', tagType: 'red', hasUpper: true, hasLower: false, hint: 'Non-compliant if result exceeds upper limit' },
  { type: 'LOW', label: 'Low Limit ≥', tagType: 'blue', hasUpper: false, hasLower: true, hint: 'Non-compliant if result is below lower limit' },
  { type: 'RANGE', label: 'Normal Range', tagType: 'teal', hasUpper: true, hasLower: true, hint: 'Compliant within lower–upper range' },
  { type: 'BORDERLINE', label: 'Borderline (Advisory)', tagType: 'warm-gray', hasUpper: true, hasLower: true, hint: 'Advisory zone — triggers review flag, not fail' },
  { type: 'DESCRIPTIVE', label: 'Qualitative / Descriptive', tagType: 'purple', hasUpper: false, hasLower: false, hasText: true, hint: 'Text value evaluated by analyst' },
];

function MultiLimitForm({ testCode, testName, unit: defaultUnit, existingLimits, onSave, onCancel }) {
  // Initialize enabled/values from existing limits
  const initEnabled = () => {
    const en = {};
    LIMIT_TYPES.forEach(lt => { en[lt.type] = existingLimits?.some(l => l.type === lt.type) || false; });
    return en;
  };
  const initValues = () => {
    const vals = {};
    LIMIT_TYPES.forEach(lt => {
      const existing = existingLimits?.find(l => l.type === lt.type);
      vals[lt.type] = {
        lower: existing?.lower || '',
        upper: existing?.upper || '',
        unit: existing?.unit || defaultUnit || '',
        note: existing?.note || '',
      };
    });
    return vals;
  };

  const [enabled, setEnabled] = useState(initEnabled);
  const [values, setValues] = useState(initValues);

  const toggleType = (type) => {
    setEnabled(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const updateValue = (type, field, val) => {
    setValues(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: val },
    }));
  };

  const handleSave = () => {
    const limits = LIMIT_TYPES
      .filter(lt => enabled[lt.type])
      .map(lt => ({
        type: lt.type,
        lower: values[lt.type].lower,
        upper: values[lt.type].upper,
        unit: values[lt.type].unit,
        note: values[lt.type].note,
      }));
    onSave(limits);
  };

  return (
    <Tile style={{ padding: '1rem', background: 'var(--cds-layer-02)' }}>
      <h6 style={{ marginBottom: 'var(--cds-spacing-02)' }}>
        {t('heading.multiLimit.edit', 'Configure Limits')} — {testName}
      </h6>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)', marginBottom: 'var(--cds-spacing-04)' }}>
        {t('message.multiLimit.hint', 'Enable one or more limit types for this test. At least one limit type must be enabled.')}
      </p>

      <Table size="sm" style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <TableHead>
          <TableRow>
            <TableHeader style={{ width: '3rem' }}></TableHeader>
            <TableHeader style={{ width: '10rem' }}>{t('label.multiLimit.type', 'Limit Type')}</TableHeader>
            <TableHeader>{t('label.multiLimit.lower', 'Lower')}</TableHeader>
            <TableHeader>{t('label.multiLimit.upper', 'Upper')}</TableHeader>
            <TableHeader style={{ width: '6rem' }}>{t('label.multiLimit.unit', 'Unit')}</TableHeader>
            <TableHeader>{t('label.multiLimit.note', 'Note / Advisory')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {LIMIT_TYPES.map(lt => {
            const isEnabled = enabled[lt.type];
            const vals = values[lt.type];
            return (
              <TableRow key={lt.type} style={{ opacity: isEnabled ? 1 : 0.45 }}>
                <TableCell>
                  <Checkbox
                    id={`mlt-${testCode}-${lt.type}`}
                    labelText=""
                    checked={isEnabled}
                    onChange={() => toggleType(lt.type)}
                  />
                </TableCell>
                <TableCell>
                  <Tag size="sm" type={lt.tagType}>{lt.label}</Tag>
                  {isEnabled && (
                    <p style={{ fontSize: '0.65rem', color: 'var(--cds-text-02)', margin: '2px 0 0' }}>{lt.hint}</p>
                  )}
                </TableCell>
                <TableCell>
                  {lt.hasLower ? (
                    <TextInput
                      id={`mlt-${testCode}-${lt.type}-lower`}
                      labelText="" hideLabel
                      value={vals.lower}
                      onChange={(e) => updateValue(lt.type, 'lower', e.target.value)}
                      disabled={!isEnabled}
                      size="sm"
                      placeholder="0"
                    />
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {lt.hasUpper ? (
                    <TextInput
                      id={`mlt-${testCode}-${lt.type}-upper`}
                      labelText="" hideLabel
                      value={vals.upper}
                      onChange={(e) => updateValue(lt.type, 'upper', e.target.value)}
                      disabled={!isEnabled}
                      size="sm"
                      placeholder="0"
                    />
                  ) : lt.hasText ? (
                    <TextInput
                      id={`mlt-${testCode}-${lt.type}-text`}
                      labelText="" hideLabel
                      value={vals.note}
                      onChange={(e) => updateValue(lt.type, 'note', e.target.value)}
                      disabled={!isEnabled}
                      size="sm"
                      placeholder={t('placeholder.descriptive', 'e.g., No odor, Absent, Clear')}
                    />
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {(lt.hasLower || lt.hasUpper) ? (
                    <TextInput
                      id={`mlt-${testCode}-${lt.type}-unit`}
                      labelText="" hideLabel
                      value={vals.unit}
                      onChange={(e) => updateValue(lt.type, 'unit', e.target.value)}
                      disabled={!isEnabled}
                      size="sm"
                      placeholder="mg/L"
                    />
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {(lt.type === 'BORDERLINE' || lt.type === 'HIGH' || lt.type === 'LOW' || lt.type === 'RANGE') ? (
                    <TextInput
                      id={`mlt-${testCode}-${lt.type}-note`}
                      labelText="" hideLabel
                      value={vals.note}
                      onChange={(e) => updateValue(lt.type, 'note', e.target.value)}
                      disabled={!isEnabled}
                      size="sm"
                      placeholder={t('placeholder.note', 'Optional note')}
                    />
                  ) : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Stack orientation="horizontal" gap={3}>
        <Button kind="primary" size="sm" renderIcon={Save} onClick={handleSave}
          disabled={!Object.values(enabled).some(Boolean)}>
          {t('button.save', 'Save Limits')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>
          {t('button.cancel', 'Cancel')}
        </Button>
      </Stack>
    </Tile>
  );
}


// ============================================================
// LINK TEST FORM
// Step 1: Filter by sample type chips (from declared ST on standard)
// Step 2: Typeahead test search (filtered by selected ST)
// Step 3: Multi-limit form or select mapping form based on resultType
// ============================================================

function LinkTestForm({ standardSampleTypes, groupId, groupTestData, setGroupTestData, onCancel }) {
  const [selectedST, setSelectedST] = useState(new Set(standardSampleTypes));
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchText, setSearchText] = useState('');

  const toggleST = (st) => {
    setSelectedST(prev => {
      const next = new Set(prev);
      if (next.has(st)) next.delete(st); else next.add(st);
      return next;
    });
  };

  const filteredTests = useMemo(() => {
    const alreadyLinked = new Set(Object.keys(groupTestData[groupId] || {}));
    return allSystemTests.filter(t => {
      if (alreadyLinked.has(t.code)) return false;
      if (selectedST.size > 0 && !t.sampleTypes.some(st => selectedST.has(st))) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
      }
      return true;
    }).slice(0, 12);
  }, [selectedST, searchText, groupId, groupTestData]);

  const handleSaveNumeric = (limits) => {
    const test = allSystemTests.find(t => t.code === selectedTest.code);
    setGroupTestData(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [selectedTest.code]: {
          testName: test.name,
          resultType: 'numeric',
          sampleTypes: test.sampleTypes,
          limits,
        },
      },
    }));
    onCancel();
  };

  const handleSaveSelect = (valueMap) => {
    const test = allSystemTests.find(t => t.code === selectedTest.code);
    setGroupTestData(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [selectedTest.code]: {
          testName: test.name,
          resultType: 'select',
          sampleTypes: test.sampleTypes,
          valueMap,
        },
      },
    }));
    onCancel();
  };

  return (
    <Tile style={{ padding: '1rem', background: 'var(--cds-layer-02)' }}>
      <h6 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        {t('heading.linkTest.add', 'Link Test to Group')}
      </h6>

      {/* Step 1: Sample type filter chips */}
      {standardSampleTypes.length > 0 && (
        <div style={{ marginBottom: 'var(--cds-spacing-04)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)', marginBottom: 'var(--cds-spacing-02)' }}>
            {t('label.linkTest.filterByST', 'Filter by sample type:')}
          </p>
          <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
            {standardSampleTypes.map(st => (
              <button
                key={st}
                onClick={() => toggleST(st)}
                style={{
                  padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8125rem',
                  border: selectedST.has(st) ? '2px solid #0f62fe' : '1px solid #c6c6c6',
                  background: selectedST.has(st) ? '#d0e2ff' : '#fff',
                  color: selectedST.has(st) ? '#0043ce' : '#525252',
                  cursor: 'pointer', fontWeight: selectedST.has(st) ? 600 : 400,
                }}
              >
                {st}
              </button>
            ))}
          </Stack>
        </div>
      )}

      {/* Step 2: Typeahead test search */}
      {!selectedTest && (
        <>
          <TextInput
            id="link-test-search"
            labelText={t('label.linkTest.searchTest', 'Search test catalog')}
            placeholder={t('placeholder.linkTest.search', 'Type to search by name or code...')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <div style={{ marginTop: 'var(--cds-spacing-02)', border: '1px solid var(--cds-border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
              {filteredTests.length === 0 ? (
                <p style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--cds-text-placeholder)' }}>
                  {t('message.linkTest.noResults', 'No matching tests found.')}
                </p>
              ) : (
                filteredTests.map(test => (
                  <button
                    key={test.code}
                    onClick={() => { setSelectedTest(test); setSearchText(''); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.625rem 1rem', fontSize: '0.875rem', border: 'none', borderBottom: '1px solid var(--cds-border-subtle)',
                      background: 'transparent', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cds-layer-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>
                      <span style={{ fontWeight: 500 }}>{test.name}</span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--cds-text-02)' }}>{test.code}</span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--cds-text-02)' }}>
                        {test.sampleTypes.join(', ')}
                      </span>
                    </span>
                    {test.resultType === 'select' && (
                      <Tag size="sm" type="purple" style={{ marginLeft: '0.5rem', flexShrink: 0 }}>Select List</Tag>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
          <Button kind="ghost" size="sm" style={{ marginTop: 'var(--cds-spacing-04)' }} onClick={onCancel}>
            {t('button.cancel', 'Cancel')}
          </Button>
        </>
      )}

      {/* Step 3: Configure limits / select mapping */}
      {selectedTest && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)', marginBottom: 'var(--cds-spacing-04)', padding: '0.5rem 0.75rem', background: 'var(--cds-layer-01)', borderRadius: '4px', border: '1px solid var(--cds-border-subtle)' }}>
            <span style={{ fontWeight: 500 }}>{selectedTest.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)' }}>{selectedTest.code}</span>
            {selectedTest.resultType === 'select' && <Tag size="sm" type="purple">Select List</Tag>}
            <Button kind="ghost" size="sm" renderIcon={Close} hasIconOnly iconDescription="Clear selection"
              onClick={() => setSelectedTest(null)} style={{ marginLeft: 'auto' }} />
          </div>

          {selectedTest.resultType === 'select' ? (
            <SelectMapForm
              testCode={selectedTest.code}
              testName={selectedTest.name}
              options={selectedTest.options || []}
              existingMap={null}
              onSave={handleSaveSelect}
              onCancel={() => setSelectedTest(null)}
            />
          ) : (
            <MultiLimitForm
              testCode={selectedTest.code}
              testName={selectedTest.name}
              unit=""
              existingLimits={null}
              onSave={handleSaveNumeric}
              onCancel={() => setSelectedTest(null)}
            />
          )}
        </>
      )}
    </Tile>
  );
}


// ============================================================
// PARAMETER GROUP with LINKED TESTS table (one row per test)
// ============================================================

function ParameterGroupAccordionItem({ group, standardSampleTypes }) {
  const [groupTestData, setGroupTestData] = useState(initialGroupTestData);
  const [expandedTest, setExpandedTest] = useState(null);
  const [addingTest, setAddingTest] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState(null);

  const testsInGroup = Object.entries(groupTestData[group.id] || {});

  const handleUnlink = (testCode, testName) => {
    setUnlinkTarget({ testCode, testName });
    setShowUnlinkModal(true);
  };

  const confirmUnlink = () => {
    const groupData = { ...(groupTestData[group.id] || {}) };
    delete groupData[unlinkTarget.testCode];
    setGroupTestData(prev => ({ ...prev, [group.id]: groupData }));
    setShowUnlinkModal(false);
    if (expandedTest === unlinkTarget.testCode) setExpandedTest(null);
  };

  const handleSaveNumeric = (testCode, limits) => {
    setGroupTestData(prev => ({
      ...prev,
      [group.id]: {
        ...prev[group.id],
        [testCode]: { ...prev[group.id][testCode], limits },
      },
    }));
    setExpandedTest(null);
  };

  const handleSaveSelect = (testCode, valueMap) => {
    setGroupTestData(prev => ({
      ...prev,
      [group.id]: {
        ...prev[group.id],
        [testCode]: { ...prev[group.id][testCode], valueMap },
      },
    }));
    setExpandedTest(null);
  };

  return (
    <>
      <AccordionItem
        title={
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>{group.name}</span>
            <Tag size="sm" type="gray">
              {testsInGroup.length} {t('label.complianceStandard.tests', 'tests')}
            </Tag>
          </Stack>
        }
      >
        <p style={{ marginBottom: 'var(--cds-spacing-03)', color: 'var(--cds-text-02)', fontSize: '0.875rem' }}>
          {group.description}
        </p>

        {testsInGroup.length > 0 ? (
          <Table size="sm" style={{ marginBottom: 'var(--cds-spacing-04)' }}>
            <TableHead>
              <TableRow>
                <TableHeader>{t('label.linkedTest.testName', 'Test')}</TableHeader>
                <TableHeader>{t('label.linkedTest.sampleTypes', 'Sample Types')}</TableHeader>
                <TableHeader>{t('label.linkedTest.limitsConfigured', 'Limits Configured')}</TableHeader>
                <TableHeader>{''}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {testsInGroup.map(([testCode, testData]) => (
                <React.Fragment key={testCode}>
                  <TableRow>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{testData.testName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)' }}>{testCode}</div>
                    </TableCell>
                    <TableCell>
                      <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
                        {testData.sampleTypes.map(st => (
                          <Tag key={st} size="sm" type="blue">{st}</Tag>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {testData.resultType === 'select' ? (
                        <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
                          <Tag size="sm" type="purple">{t('label.selectMap.badge', 'Value Mapping')}</Tag>
                          <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-02)' }}>
                            {Object.values(testData.valueMap || {}).filter(v => v === 'compliant').length} compliant,{' '}
                            {Object.values(testData.valueMap || {}).filter(v => v === 'borderline').length} borderline,{' '}
                            {Object.values(testData.valueMap || {}).filter(v => v === 'noncompliant').length} non-compliant
                          </span>
                        </Stack>
                      ) : (
                        <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
                          {(testData.limits || []).map(lim => (
                            <Tag key={lim.type} size="sm" type={thresholdTypeKindMap[lim.type]}>
                              {thresholdTypeLabels[lim.type]}: {formatLimitBadge(lim)}
                            </Tag>
                          ))}
                          {(!testData.limits || testData.limits.length === 0) && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-placeholder)', fontStyle: 'italic' }}>
                              {t('message.multiLimit.noLimits', 'No limits configured')}
                            </span>
                          )}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack orientation="horizontal" gap={1}>
                        <Button
                          kind="ghost" size="sm" hasIconOnly
                          iconDescription={t('button.linkedTest.edit', 'Edit limits')}
                          renderIcon={expandedTest === testCode ? ChevronUp : Edit}
                          onClick={() => setExpandedTest(prev => prev === testCode ? null : testCode)}
                        />
                        <Button
                          kind="ghost" size="sm" hasIconOnly
                          iconDescription={t('button.linkedTest.unlink', 'Remove from group')}
                          renderIcon={TrashCan}
                          onClick={() => handleUnlink(testCode, testData.testName)}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>

                  {expandedTest === testCode && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        {testData.resultType === 'select' ? (
                          <SelectMapForm
                            testCode={testCode}
                            testName={testData.testName}
                            options={allSystemTests.find(t => t.code === testCode)?.options || Object.keys(testData.valueMap || {})}
                            existingMap={testData.valueMap}
                            onSave={(valueMap) => handleSaveSelect(testCode, valueMap)}
                            onCancel={() => setExpandedTest(null)}
                          />
                        ) : (
                          <MultiLimitForm
                            testCode={testCode}
                            testName={testData.testName}
                            unit={(testData.limits?.[0]?.unit) || ''}
                            existingLimits={testData.limits}
                            onSave={(limits) => handleSaveNumeric(testCode, limits)}
                            onCancel={() => setExpandedTest(null)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p style={{ marginBottom: 'var(--cds-spacing-04)', color: 'var(--cds-text-placeholder)', fontSize: '0.875rem', fontStyle: 'italic' }}>
            {t('message.complianceGroup.noTests', 'No tests linked to this group yet. Link tests to define compliance thresholds for evaluation.')}
          </p>
        )}

        {addingTest ? (
          <LinkTestForm
            standardSampleTypes={standardSampleTypes}
            groupId={group.id}
            groupTestData={groupTestData}
            setGroupTestData={setGroupTestData}
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
          {t('message.linkedTest.unlinkConfirm', `Remove "${unlinkTarget?.testName}" from "${group.name}"? All threshold definitions for this test in this group will be deleted.`)}
        </p>
      </Modal>
    </>
  );
}


// ============================================================
// STANDARD INLINE FORM (Add / Edit)
// Sample Types panel appears BEFORE Parameter Groups accordion.
// ============================================================

function StandardInlineForm({ standard, isNew, onSave, onCancel }) {
  const [name, setName] = useState(standard?.name || '');
  const [issuingBody, setIssuingBody] = useState(standard?.issuingBody || '');
  const [regulationNumber, setRegulationNumber] = useState(standard?.regulationNumber || '');
  const [version, setVersion] = useState(standard?.version || '');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(standard?.status || 'DRAFT');
  const [sampleTypes, setSampleTypes] = useState(standard?.sampleTypes || []);
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

      {/* ── Applicable Sample Types — BEFORE Parameter Groups ── */}
      <div style={{ marginTop: 'var(--cds-spacing-06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)', marginBottom: 'var(--cds-spacing-04)' }}>
          <h5 style={{ margin: 0 }}>{t('heading.complianceStandard.sampleTypes', 'Applicable Sample Types')}</h5>
        </div>
        <ExplicitSampleTypesPanel sampleTypes={sampleTypes} onChange={setSampleTypes} />
      </div>

      {/* ── Parameter Groups with Linked Tests ── */}
      {!isNew && (
        <div style={{ marginTop: 'var(--cds-spacing-06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--cds-spacing-04)' }}>
            <h5 style={{ margin: 0 }}>{t('heading.complianceStandard.parameterGroups', 'Parameter Groups & Linked Tests')}</h5>
            <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setAddingGroup(true)}>
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
                <ParameterGroupAccordionItem
                  key={group.id}
                  group={group}
                  standardSampleTypes={sampleTypes}
                />
              ))}
            </Accordion>
          ) : (
            <p style={{ color: 'var(--cds-text-placeholder)', fontSize: '0.875rem', fontStyle: 'italic' }}>
              {t('message.complianceStandard.noGroups', 'No parameter groups defined. Add a group to start linking tests and defining thresholds.')}
            </p>
          )}
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
// SCREEN 1: Compliance Standards List
// Admin → Test Management → Compliance Standards
// ============================================================

function ComplianceStandardsList() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
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
      </Column>
    </Grid>
  );
}


// ============================================================
// SCREEN 2: Compliance Thresholds Tab in Test Editor
// Test Catalog → [Test Editor] → Compliance (vertical tab sidebar)
// ============================================================

const mockThresholds = [
  { id: 't1', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Physical Parameters',
    thresholdType: 'HIGH', valueUpper: 25, unit: 'NTU', effectiveDate: '2021-02-02', isActive: true },
  { id: 't2', standardName: 'WHO Drinking Water Guidelines', parameterGroup: 'Chemical Contaminants',
    thresholdType: 'HIGH', valueUpper: 5, unit: 'NTU', effectiveDate: '2022-03-21', isActive: true },
  { id: 't3', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Physical Parameters',
    thresholdType: 'BORDERLINE', valueLower: 20, valueUpper: 25, unit: 'NTU', note: 'Requires re-sampling', effectiveDate: '2021-02-02', isActive: true },
];

function formatRange(th) {
  switch (th.thresholdType) {
    case 'HIGH': case 'MAX': return `≤ ${th.valueUpper} ${th.unit}`;
    case 'LOW': case 'MIN': return `≥ ${th.valueLower} ${th.unit}`;
    case 'RANGE': return `${th.valueLower} – ${th.valueUpper} ${th.unit}`;
    case 'BORDERLINE': return `${th.valueLower} – ${th.valueUpper} ${th.unit}`;
    case 'DESCRIPTIVE': return th.valueDescriptive || '—';
    default: return '—';
  }
}

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
              <TableHeader>{t('label.complianceStandard.effectiveDate', 'Effective Date')}</TableHeader>
              <TableHeader>{t('label.complianceStandard.status', 'Status')}</TableHeader>
              <TableHeader>{''}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {addingNew && (
              <TableRow>
                <TableCell colSpan={7}>
                  <MultiLimitForm
                    testCode="NEW"
                    testName="New Threshold"
                    unit=""
                    existingLimits={null}
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
                    <TableCell colSpan={7}>
                      <MultiLimitForm
                        testCode={th.id}
                        testName={th.standardName}
                        unit={th.unit}
                        existingLimits={[{
                          type: th.thresholdType === 'MAX' ? 'HIGH' : th.thresholdType === 'MIN' ? 'LOW' : th.thresholdType,
                          lower: th.valueLower?.toString() || '',
                          upper: th.valueUpper?.toString() || '',
                          unit: th.unit,
                          note: th.note || '',
                        }]}
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
