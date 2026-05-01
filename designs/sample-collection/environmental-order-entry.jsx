/**
 * S-03 v2.0: Environmental Order Entry — Standalone (Domain-Assigned Lab)
 *
 * 3-step wizard at Reception:
 *   1. Branch & Order Setup (single page)
 *   2. Label & Store
 *   3. QA/QC + Intake Acceptance
 *
 * Core changes from v1.0:
 *   - 3 steps, not 4 (no Receipt Verification step — samples on desk during entry)
 *   - 2-tile branch selector at top of Step 1 (Regulation-driven / Ad-hoc)
 *   - Domain Badge always visible (purple Environmental, etc.)
 *   - Referral Tag conditional (cyan, when order originated from FHIR)
 *   - Sample Manifest = quantity table + CSV upload (replaces v1 sample-type checklist)
 *   - Regulatory Reference dropped on regulation-driven; only on ad-hoc as optional free-text
 *   - Per-sample NCE button on Step 3 (reuses existing OE NCE pattern — represented here with placeholder)
 *   - QC quick-add: 3 buttons (Blank / Duplicate / Control), inline-edit table
 *
 * Dependencies: @carbon/react, @carbon/icons-react
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Grid, Column, Stack,
  ClickableTile,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput,
  Checkbox, Button, IconButton, InlineNotification, Tag, Tile,
  Accordion, AccordionItem,
  ProgressIndicator, ProgressStep,
  FileUploader, Modal, MultiSelect,
  DatePicker, DatePickerInput, TimePicker,
} from '@carbon/react';
import {
  Add, Edit, Save, Renew, Search, View, Close, Locked, Copy,
  Warning, WarningAlt, Document, Information, ChevronDown,
  TrashCan, ArrowRight,
} from '@carbon/icons-react';

// i18n helper
const t = (key, fallback) => fallback || key;

// ─── Mock Data ───────────────────────────────────────────────────────

const ALL_SAMPLE_TYPES = [
  { id: 'st-001', name: 'Surface Water', code: 'WATER_SURFACE' },
  { id: 'st-002', name: 'Drinking Water', code: 'WATER_DRINKING' },
  { id: 'st-003', name: 'Groundwater', code: 'WATER_GROUND' },
  { id: 'st-004', name: 'Effluent / Wastewater', code: 'WATER_EFFLUENT' },
  { id: 'st-005', name: 'Ambient Air', code: 'AIR_AMBIENT' },
  { id: 'st-006', name: 'Emission / Stack', code: 'AIR_EMISSION' },
  { id: 'st-007', name: 'Topsoil', code: 'SOIL_TOP' },
  { id: 'st-008', name: 'Sediment', code: 'SOIL_SEDIMENT' },
  { id: 'st-009', name: 'Sludge', code: 'WASTE_SLUDGE' },
  { id: 'st-010', name: 'Biota / Tissue', code: 'BIO_TISSUE' },
  { id: 'st-011', name: 'Other', code: 'OTHER' },
];

const MOCK_STANDARDS = [
  { id: 'std-001', name: 'Baku Mutu Air Permukaan', issuingBody: 'Pemerintah RI', regulationNumber: 'PP No. 22/2021', version: '2021-01', effectiveDate: '2021-02-02', status: 'Active', linkedTests: 42, applicableSampleTypes: ['st-001', 'st-003', 'st-004'] },
  { id: 'std-002', name: 'Baku Mutu Udara Ambien', issuingBody: 'Pemerintah RI', regulationNumber: 'PP No. 41/1999', version: '1999-01', effectiveDate: '1999-05-26', status: 'Active', linkedTests: 18, applicableSampleTypes: ['st-005', 'st-006'] },
  { id: 'std-003', name: 'WHO Drinking Water Guidelines (4th Ed)', issuingBody: 'World Health Organization', regulationNumber: 'WHO-DWG-4', version: '2011-01', effectiveDate: '2011-01-01', status: 'Active', linkedTests: 56, applicableSampleTypes: ['st-002', 'st-003'] },
  { id: 'std-004', name: 'Pengelolaan Limbah B3', issuingBody: 'Pemerintah RI', regulationNumber: 'PP No. 101/2014', version: '2014-01', effectiveDate: '2014-10-17', status: 'Active', linkedTests: 31, applicableSampleTypes: ['st-007', 'st-008', 'st-009', 'st-001'] },
  { id: 'std-005', name: 'Baku Mutu Air Minum', issuingBody: 'Kemenkes RI', regulationNumber: 'PMK No. 32/2017', version: '2017-01', effectiveDate: '2017-05-12', status: 'Active', linkedTests: 38, applicableSampleTypes: ['st-002'] },
];

const MOCK_TESTS_BY_STANDARD = {
  'std-001': [
    { group: 'Physical Parameters', tests: [
      { id: 't-001', name: 'Temperature', loinc: '8310-5', unit: '°C', threshold: '± 3 from ambient' },
      { id: 't-002', name: 'Total Dissolved Solids (TDS)', loinc: '3745-7', unit: 'mg/L', threshold: '≤ 1000' },
      { id: 't-003', name: 'Total Suspended Solids (TSS)', loinc: '4808-2', unit: 'mg/L', threshold: '≤ 50' },
      { id: 't-004', name: 'Turbidity', loinc: '61020-8', unit: 'NTU', threshold: '≤ 25' },
    ]},
    { group: 'Chemical Parameters', tests: [
      { id: 't-005', name: 'pH', loinc: '11558-4', unit: '—', threshold: '6.0 – 9.0' },
      { id: 't-006', name: 'Dissolved Oxygen (DO)', loinc: '19218-7', unit: 'mg/L', threshold: '≥ 4' },
      { id: 't-007', name: 'BOD₅', loinc: '5839-3', unit: 'mg/L', threshold: '≤ 3' },
      { id: 't-008', name: 'COD', loinc: '5840-1', unit: 'mg/L', threshold: '≤ 25' },
    ]},
    { group: 'Microbiological', tests: [
      { id: 't-012', name: 'Total Coliform', loinc: '5794-0', unit: 'MPN/100mL', threshold: '≤ 5000' },
      { id: 't-013', name: 'Fecal Coliform', loinc: '5799-9', unit: 'MPN/100mL', threshold: '≤ 1000' },
    ]},
  ],
};

// 2026-04-28 (rewritten same day): flat test catalog for the existing-OE Order Tests pattern
// Each test carries: applicableSampleTypes[], complianceStandardIds[] (which standards have thresholds for it)
const MOCK_TEST_CATALOG = [
  { id: 't-001', name: 'Temperature', loinc: '8310-5', unit: '°C', applicableSampleTypes: ['st-001', 'st-002', 'st-003', 'st-004'], complianceStandardIds: ['std-001'] },
  { id: 't-002', name: 'Total Dissolved Solids (TDS)', loinc: '3745-7', unit: 'mg/L', applicableSampleTypes: ['st-001', 'st-002', 'st-003', 'st-004'], complianceStandardIds: ['std-001', 'std-003'] },
  { id: 't-003', name: 'Total Suspended Solids (TSS)', loinc: '4808-2', unit: 'mg/L', applicableSampleTypes: ['st-001', 'st-004'], complianceStandardIds: ['std-001'] },
  { id: 't-004', name: 'Turbidity', loinc: '61020-8', unit: 'NTU', applicableSampleTypes: ['st-001', 'st-002', 'st-003'], complianceStandardIds: ['std-001', 'std-003'] },
  { id: 't-005', name: 'pH', loinc: '11558-4', unit: '—', applicableSampleTypes: ['st-001', 'st-002', 'st-003', 'st-004'], complianceStandardIds: ['std-001', 'std-003'] },
  { id: 't-006', name: 'Dissolved Oxygen (DO)', loinc: '19218-7', unit: 'mg/L', applicableSampleTypes: ['st-001'], complianceStandardIds: ['std-001'] },
  { id: 't-007', name: 'BOD₅', loinc: '5839-3', unit: 'mg/L', applicableSampleTypes: ['st-001', 'st-004'], complianceStandardIds: ['std-001'] },
  { id: 't-008', name: 'COD', loinc: '5840-1', unit: 'mg/L', applicableSampleTypes: ['st-001', 'st-004'], complianceStandardIds: ['std-001'] },
  { id: 't-012', name: 'Total Coliform', loinc: '5794-0', unit: 'MPN/100mL', applicableSampleTypes: ['st-001', 'st-002', 'st-003'], complianceStandardIds: ['std-001', 'std-003'] },
  { id: 't-013', name: 'Fecal Coliform', loinc: '5799-9', unit: 'MPN/100mL', applicableSampleTypes: ['st-001', 'st-003'], complianceStandardIds: ['std-001'] },
  { id: 't-014', name: 'Lead (Pb)', loinc: '5671-0', unit: 'mg/L', applicableSampleTypes: ['st-001', 'st-002', 'st-003', 'st-004', 'st-007', 'st-008'], complianceStandardIds: ['std-001', 'std-003', 'std-004'] },
  { id: 't-015', name: 'Mercury (Hg)', loinc: '5688-4', unit: 'mg/L', applicableSampleTypes: ['st-001', 'st-002', 'st-004'], complianceStandardIds: ['std-001', 'std-003'] },
];

// Panels — bundles of tests. Selecting a panel adds its tests; tests can also be selected individually.
const MOCK_PANELS = [
  { id: 'p-001', name: 'Surface Water Physical+Chemical', applicableSampleTypes: ['st-001'],
    testIds: ['t-001', 't-002', 't-003', 't-004', 't-005', 't-006', 't-007', 't-008'], complianceStandardIds: ['std-001'] },
  { id: 'p-002', name: 'Drinking Water Quality', applicableSampleTypes: ['st-002'],
    testIds: ['t-002', 't-004', 't-005', 't-012', 't-014', 't-015'], complianceStandardIds: ['std-003'] },
  { id: 'p-003', name: 'Coliform Microbiological', applicableSampleTypes: ['st-001', 'st-002', 'st-003'],
    testIds: ['t-012', 't-013'], complianceStandardIds: ['std-001'] },
  { id: 'p-004', name: 'Heavy Metals (Pb, Hg)', applicableSampleTypes: ['st-001', 'st-002', 'st-007', 'st-008'],
    testIds: ['t-014', 't-015'], complianceStandardIds: ['std-001', 'std-003', 'std-004'] },
];

const MOCK_SITE = {
  code: 'WS-001', name: 'Sungai Ciliwung — Manggarai', type: 'Water Source', subtype: 'River',
  region: 'DKI Jakarta', district: 'Jakarta Selatan', gps: '-6.1885, 106.8114',
  zone: 'Urban', totalCollections: 47, lastCollection: '2026-03-28',
};

const COLLECTION_METHODS = [
  'Manual Grab', 'Composite (Time)', 'Composite (Flow)', 'Automated Sampler', 'Passive', 'Trap Collection', 'Other',
];
const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Rain', 'Storm', 'Wind', 'Other'];
const RECEIPT_CONDITIONS = ['Acceptable', 'Cold-chain Broken', 'Container Damaged', 'Insufficient Volume', 'Other'];
const BLANK_SUBTYPES = ['Field', 'Trip', 'Equipment', 'Method', 'Other'];

const MOCK_STORAGE_LOCATIONS = ['Fridge A — Shelf 1', 'Fridge A — Shelf 2', 'Freezer B — Rack 3', 'Ambient Shelf C-12'];

// 2026-05-01 amendment: Submitter (Organization) — mirrors clinical AMAP backend mapping.
const MOCK_ORGANIZATIONS = [
  { id: 'org-001', name: 'Plaza Senayan Cooling Tower Operations', address: 'Jl. Asia Afrika, Senayan, Jakarta', contact: 'Bapak Andi · andi@psn.co.id · +62 21 555 0042', recentOrderCount: 14 },
  { id: 'org-002', name: 'Dinas Pendidikan DKI Jakarta — Water Safety Program', address: 'Jl. Gatot Subroto, Jakarta Selatan', contact: 'Ibu Lestari · lestari@dinaspendidikan.dki.go.id · +62 21 555 0193', recentOrderCount: 48 },
  { id: 'org-003', name: 'PT Inkindo Jaya — Discharge Compliance', address: 'Bekasi Industrial Park', contact: 'Ibu Siti · siti@inkindo.co.id', recentOrderCount: 6 },
  { id: 'org-004', name: 'BAPPEDA Bogor — River Monitoring', address: 'Jl. Pajajaran, Bogor', contact: 'Pak Hadi · hadi@bappeda.bogor.go.id', recentOrderCount: 23 },
];

// 2026-05-01 amendment: Programs are FHIR Questionnaire-driven optional dynamic field sets.
// The Program admin (existing OE) gains a domain picker; this list filters to env-domain programs.
const MOCK_PROGRAMS = [
  { id: 'prog-001', name: 'School Water Safety Program', domain: 'ENVIRONMENTAL',
    questionnaire: [
      { code: 'school-name', label: 'School Name', type: 'text', required: true },
      { code: 'building-age', label: 'Building Age (years)', type: 'number', required: false },
      { code: 'last-plumbing-inspection', label: 'Last Plumbing Inspection', type: 'date', required: false },
      { code: 'student-count', label: 'Approx. student count', type: 'number', required: false },
    ]},
  { id: 'prog-002', name: 'Cooling Tower Compliance', domain: 'ENVIRONMENTAL',
    questionnaire: [
      { code: 'tower-id', label: 'Tower ID', type: 'text', required: true },
      { code: 'loop-name', label: 'Loop / Circuit', type: 'select', options: ['Open recirculating', 'Once-through', 'Closed loop', 'Make-up'], required: true },
      { code: 'last-cleaning-date', label: 'Last cleaning / disinfection date', type: 'date', required: false },
    ]},
  { id: 'prog-003', name: 'Industrial Discharge Monitoring', domain: 'ENVIRONMENTAL',
    questionnaire: [
      { code: 'discharge-point', label: 'Discharge Point ID', type: 'text', required: true },
      { code: 'flow-rate', label: 'Flow Rate (m³/h)', type: 'number', required: false },
      { code: 'permit-number', label: 'Discharge Permit Number', type: 'text', required: false },
    ]},
];

// 2026-05-01 amendment: Container Types live in OE Test Catalog → Env subsection.
// Seeded list; admin can edit via Test Catalog admin; custom values flagged for review.
const MOCK_CONTAINER_TYPES = [
  'Whirl-Pak bag',
  'Glass amber bottle (250 mL)',
  'Glass amber bottle (1 L)',
  'Sterile polypropylene bottle (250 mL)',
  'Sterile polypropylene bottle (1 L)',
  'Vacuum sample bag (Tedlar)',
  'Composite jerry can (5 L)',
  'Composite jerry can (10 L)',
  'Sediment trap jar',
  'Filter cassette (47 mm)',
  'Sterile cooler (insulated)',
];

// 2026-05-01: demo CSV preview payload (rendered when user clicks "Upload CSV File")
const DEMO_CSV_PREVIEW = {
  filename: 'plaza_senayan_2026-05-01.csv',
  template: 'Standard',
  rows: [
    { row: 1, sampleType: 'Cooling Water', container: 'Whirl-Pak bag', gps: '-6.2249, 106.7984', loc: 'Tower A — return loop', addr: 'Plaza Senayan, Jl. Asia Afrika', dt: '2026-05-01 07:42', collector: 'Bapak Andi', status: 'VALID', mismatchField: null },
    { row: 2, sampleType: 'Cooling Water', container: 'Whirl-Pak bag', gps: '-6.2251, 106.7986', loc: 'Tower B — return loop', addr: 'Plaza Senayan, Jl. Asia Afrika', dt: '2026-05-01 07:48', collector: 'Bapak Andi', status: 'VALID', mismatchField: null },
    { row: 3, sampleType: 'creek_water', container: 'Glass bottle 1L', gps: '-6.2255, 106.7990', loc: 'Make-up source', addr: 'Plaza Senayan', dt: '2026-05-01 07:53', collector: 'Bapak Andi', status: 'MISMATCH_TYPE', mismatchField: 'sampleType' },
    { row: 4, sampleType: 'Cooling Water', container: 'Mason jar', gps: '-6.2249, 106.7980', loc: 'Tower A — supply', addr: 'Plaza Senayan', dt: '2026-05-01 07:55', collector: 'Bapak Andi', status: 'MISMATCH_CONT', mismatchField: 'container' },
  ],
};

// Lab unit context (would come from session/lab config)
const LAB_UNIT = { name: 'Env Lab — Jakarta', domain: 'Environmental' };

const DOMAIN_BADGE_STYLES = {
  Environmental: { tagType: 'purple' },
  Vector: { tagType: 'teal' },
  Clinical: { tagType: 'blue' },
};

// ─── Main Component ──────────────────────────────────────────────────

export default function EnvironmentalOrderEntryV2({
  // Optional props for referral pre-fill demo
  referralSource = null,           // e.g., { name: 'Lab XYZ', fhirTaskId: 'task-987' }
  hasParentSpecimens = false,       // triggers Pool/Aliquot subsection
}) {
  // Wizard step (now 3 steps: 0=Branch+Order, 1=Label&Store, 2=QA-QC)
  const [currentStep, setCurrentStep] = useState(0);

  // Branch
  const [branch, setBranch] = useState(referralSource ? 'REGULATION_DRIVEN' : null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);

  // Step 1 state — 2026-04-28 amendment: selectedStandards is now an array (M:N, multi-regulation)
  const [selectedSite, setSelectedSite] = useState(MOCK_SITE);
  const [selectedStandards, setSelectedStandards] = useState([]);  // [{ id, name, regulationNumber, ... }]
  const [showThresholds, setShowThresholds] = useState(false);
  const [showAllStandards, setShowAllStandards] = useState(false);
  const [adhocTests, setAdhocTests] = useState([]);
  const [adhocRegRef, setAdhocRegRef] = useState('');
  // 2026-04-28 (rewritten same day): two-section OE pattern — Order Panels + Order Tests
  const [selectedPanelIds, setSelectedPanelIds] = useState([]);  // Set-like array
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [panelSearch, setPanelSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');

  // Regulation-driven smart pre-selection: pre-check panels/tests whose complianceStandardIds
  // intersect any selected standard. Re-runs when selectedStandards or branch changes.
  // Ad-hoc branch resets to empty.
  useEffect(() => {
    if (branch === 'AD_HOC') {
      setSelectedPanelIds([]);
      setSelectedTestIds([]);
      return;
    }
    if (branch === 'REGULATION_DRIVEN' && selectedStandards.length > 0) {
      const stdIdSet = new Set(selectedStandards.map(s => s.id));
      const matchingPanelIds = MOCK_PANELS
        .filter(p => p.complianceStandardIds.some(id => stdIdSet.has(id)))
        .map(p => p.id);
      const matchingTestIds = MOCK_TEST_CATALOG
        .filter(t => t.complianceStandardIds.some(id => stdIdSet.has(id)))
        .map(t => t.id);
      setSelectedPanelIds(matchingPanelIds);
      setSelectedTestIds(matchingTestIds);
    } else if (branch === 'REGULATION_DRIVEN' && selectedStandards.length === 0) {
      setSelectedPanelIds([]);
      setSelectedTestIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, selectedStandards]);
  const [manifest, setManifest] = useState([]);   // [{ sampleTypeId, quantity, coverageStandardIds: [], isOverride }]
  const [deselectedTestIds, setDeselectedTestIds] = useState(new Set());
  const [showAddSampleType, setShowAddSampleType] = useState(false);

  // 2026-05-01 amendment: Submitter (Organization)
  const [submitter, setSubmitter] = useState(null);

  // 2026-05-01 amendment: Program (FHIR Questionnaire) — optional
  const [program, setProgram] = useState(null);
  const [programResponses, setProgramResponses] = useState({});

  // 2026-05-01 amendment: per-sample manifest rows (replaces aggregate quantity table)
  // Each row = one physical sample with Container Type, GPS, Location Details, Address
  const [sampleRowsManifest, setSampleRowsManifest] = useState([]);
  // [{ id, sampleType, container, gps, loc, addr, dt, notes }]

  // 2026-05-01 amendment: CSV bulk upload preview state
  const [csvPreview, setCsvPreview] = useState(null);  // null | { filename, template, rows }

  // 2026-05-01 amendment: per-suggestion quick-add quantities (regulation-driven branch)
  const [suggestQty, setSuggestQty] = useState({});  // { sampleTypeId: number }

  // Default collection conditions
  const [collectionMethod, setCollectionMethod] = useState('');
  const [waterTemp, setWaterTemp] = useState('');
  const [ambientTemp, setAmbientTemp] = useState('');
  const [weather, setWeather] = useState('');
  const [preservation, setPreservation] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');

  // Step 2 state — per-sample rows generated from manifest
  const [sampleRows, setSampleRows] = useState([]);
  const [bulkStorage, setBulkStorage] = useState('');

  // Step 3 state — QC samples
  const [qcSamples, setQcSamples] = useState([]);
  const [sampleNces, setSampleNces] = useState({});  // { sampleId: { code, decision } }

  // ── Branch handlers ───────────────────────────────────────────────
  const handleBranchSelect = useCallback((newBranch) => {
    if (branch && branch !== newBranch && (selectedStandards.length > 0 || adhocTests.length > 0 || manifest.length > 0)) {
      setShowSwitchConfirm({ from: branch, to: newBranch });
      return;
    }
    setBranch(newBranch);
  }, [branch, selectedStandards, adhocTests, manifest]);

  const confirmSwitchBranch = useCallback(() => {
    setBranch(showSwitchConfirm.to);
    setSelectedStandards([]);
    setAdhocTests([]);
    setAdhocRegRef('');
    setManifest([]);
    setDeselectedTestIds(new Set());
    setShowSwitchConfirm(false);
  }, [showSwitchConfirm]);

  // ── Standard handlers — 2026-04-28 amendment: add/remove from selectedStandards array ──
  // Recompute manifest as UNION of applicableSampleTypes across all selected standards
  const recomputeManifestFromStandards = useCallback((standards) => {
    if (standards.length === 0) {
      setManifest([]);
      return;
    }
    // Build a map: sampleTypeId → list of standards that include it
    const coverageMap = new Map();
    standards.forEach(std => {
      std.applicableSampleTypes.forEach(stId => {
        if (!coverageMap.has(stId)) coverageMap.set(stId, []);
        coverageMap.get(stId).push(std.id);
      });
    });
    setManifest(prev => {
      // Preserve quantities for sample types already in manifest; reset coverage
      const unioned = Array.from(coverageMap.entries()).map(([stId, coverageIds]) => {
        const existing = prev.find(r => r.sampleTypeId === stId);
        return {
          sampleTypeId: stId,
          quantity: existing?.quantity || 0,
          coverageStandardIds: coverageIds,
          isOverride: false,
        };
      });
      // Keep override rows (sample types added that aren't in any selected standard's list)
      const overrideRows = prev.filter(r => r.isOverride && !coverageMap.has(r.sampleTypeId));
      return [...unioned, ...overrideRows];
    });
  }, []);

  const addStandard = useCallback((event) => {
    const item = event?.selectedItem;
    if (!item) return;
    setSelectedStandards(prev => {
      if (prev.find(s => s.id === item.id)) return prev;  // already added
      const next = [...prev, item];
      recomputeManifestFromStandards(next);
      return next;
    });
    setDeselectedTestIds(new Set());
  }, [recomputeManifestFromStandards]);

  const removeStandard = useCallback((standardId) => {
    setSelectedStandards(prev => {
      const next = prev.filter(s => s.id !== standardId);
      recomputeManifestFromStandards(next);
      return next;
    });
    setDeselectedTestIds(new Set());
  }, [recomputeManifestFromStandards]);

  // ── Manifest handlers ─────────────────────────────────────────────
  const updateManifestQuantity = useCallback((sampleTypeId, quantity) => {
    setManifest(prev => prev.map(row =>
      row.sampleTypeId === sampleTypeId ? { ...row, quantity: Math.max(0, Math.min(999, parseInt(quantity) || 0)) } : row,
    ));
  }, []);

  const addOverrideSampleType = useCallback((event) => {
    const item = event?.selectedItem;
    if (!item) return;
    setManifest(prev => {
      if (prev.find(r => r.sampleTypeId === item.id)) return prev;
      // Compute coverage across all selected standards
      const coverageStandardIds = selectedStandards
        .filter(std => std.applicableSampleTypes.includes(item.id))
        .map(std => std.id);
      const isOverride = coverageStandardIds.length === 0;
      return [...prev, { sampleTypeId: item.id, quantity: 1, coverageStandardIds, isOverride }];
    });
    setShowAddSampleType(false);
  }, [selectedStandards]);

  const removeManifestType = useCallback((sampleTypeId) => {
    setManifest(prev => prev.filter(r => r.sampleTypeId !== sampleTypeId));
  }, []);

  // 2026-05-01: derived from new per-sample manifest (sampleRowsManifest).
  // `totalSamples` = number of rows; `activeManifestSampleTypes` = unique sample type IDs found in the rows.
  const totalSamples = useMemo(
    () => sampleRowsManifest.length,
    [sampleRowsManifest],
  );

  const activeManifestSampleTypes = useMemo(() => {
    const seen = new Set();
    sampleRowsManifest.forEach(r => {
      const st = ALL_SAMPLE_TYPES.find(x => x.name.toLowerCase() === (r.sampleType || '').toLowerCase());
      if (st) seen.add(st.id);
    });
    return Array.from(seen);
  }, [sampleRowsManifest]);

  // 2026-04-28 amendment: union + dedup tests across selectedStandards.
  // Each test in the result carries `coverageStandardIds: [stdId, ...]` showing which standards govern it.
  const suggestedTestGroups = useMemo(() => {
    if (selectedStandards.length === 0 || activeManifestSampleTypes.length === 0) return [];
    // Collect all (group, test) pairs across selected standards, tracking coverage
    const testMap = new Map();  // testId → { groupName, test, coverageStandardIds }
    selectedStandards.forEach(std => {
      const groups = MOCK_TESTS_BY_STANDARD[std.id] || [];
      groups.forEach(g => {
        g.tests.forEach(t => {
          const key = t.id;
          if (!testMap.has(key)) {
            testMap.set(key, { groupName: g.group, test: t, coverageStandardIds: [std.id] });
          } else {
            testMap.get(key).coverageStandardIds.push(std.id);
          }
        });
      });
    });
    // Re-group by parameter group name (deterministic sort)
    const groupMap = new Map();
    testMap.forEach(entry => {
      const g = entry.groupName;
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g).push({ ...entry.test, coverageStandardIds: entry.coverageStandardIds });
    });
    return Array.from(groupMap.entries()).map(([group, tests]) => ({ group, tests }));
  }, [selectedStandards, activeManifestSampleTypes]);

  const suggestedTestCount = useMemo(
    () => suggestedTestGroups.reduce((sum, g) => sum + g.tests.length, 0),
    [suggestedTestGroups],
  );

  const selectedSuggestedTestCount = useMemo(() => {
    let n = 0;
    suggestedTestGroups.forEach(g => g.tests.forEach(t => { if (!deselectedTestIds.has(t.id)) n++; }));
    return n;
  }, [suggestedTestGroups, deselectedTestIds]);

  // ── Step 2: generate sample rows from per-sample manifest (2026-05-01) ───
  // One manifest row → one Step 2 sample row (no aggregate quantity expansion).
  // Per-sample fields (container, gps, loc, addr) carry forward.
  const generateSampleRows = useCallback(() => {
    const rows = sampleRowsManifest.map((r, i) => {
      const sampleType = ALL_SAMPLE_TYPES.find(st => st.name.toLowerCase() === (r.sampleType || '').toLowerCase())
        || { id: 'unk', code: '?', name: r.sampleType };
      return {
        id: `s-${i + 1}`,
        rowIndex: i + 1,
        sampleType,
        containerType: r.container,
        gpsRaw: r.gps,
        locationDetails: r.loc,
        address: r.addr,
        accession: `ENV-2026-0412.${String(i + 1).padStart(3, '0')}`,
        barcode: '',
        collectionDateTime: r.dt || '',
        receiptCondition: '',
        storageLocation: '',
        notes: r.notes || '',
      };
    });
    setSampleRows(rows);
  }, [sampleRowsManifest]);

  const advanceToStep2 = useCallback(() => {
    generateSampleRows();
    setCurrentStep(1);
  }, [generateSampleRows]);

  // ── 2026-05-01 amendment handlers ────────────────────────────────
  // Per-sample manifest add/update/remove
  const addManifestRow = useCallback(() => {
    setSampleRowsManifest(prev => [...prev, {
      id: `m-${Date.now()}`, sampleType: '', container: '', gps: '', loc: '', addr: '', dt: '', notes: '',
    }]);
  }, []);
  const updateManifestRow = useCallback((id, patch) => {
    setSampleRowsManifest(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);
  const removeManifestRow = useCallback((id) => {
    setSampleRowsManifest(prev => prev.filter(r => r.id !== id));
  }, []);

  // Quick-add: append N rows of a suggested sample type to the per-sample manifest
  const addSuggestedRows = useCallback((sampleType, qty) => {
    if (qty <= 0) return;
    setSampleRowsManifest(prev => {
      const next = [...prev];
      for (let k = 0; k < qty; k++) {
        next.push({
          id: `m-${Date.now()}-${k}`,
          sampleType: sampleType.name, container: '', gps: '', loc: '', addr: '', dt: '', notes: '',
        });
      }
      return next;
    });
    setSuggestQty(prev => ({ ...prev, [sampleType.id]: 0 }));
  }, []);

  // CSV import: promote ✓ Valid rows into per-sample manifest; mismatches stay in preview
  const importValidCsv = useCallback(() => {
    if (!csvPreview) return;
    const valid = csvPreview.rows.filter(r => r.status === 'VALID');
    setSampleRowsManifest(prev => [
      ...prev,
      ...valid.map((r, i) => ({
        id: `csv-${Date.now()}-${i}`,
        sampleType: r.sampleType, container: r.container,
        gps: r.gps, loc: r.loc, addr: r.addr,
        dt: r.dt, notes: '',
      })),
    ]);
    setCsvPreview(p => ({ ...p, rows: p.rows.filter(r => r.status !== 'VALID') }));
  }, [csvPreview]);
  const reconcileCsvRow = useCallback((rowId, field, value) => {
    setCsvPreview(p => ({ ...p, rows: p.rows.map(r => r.row === rowId
      ? { ...r, [field]: value, status: 'VALID', mismatchField: null }
      : r) }));
  }, []);

  // Suggestions = deduped union of selected regulations' applicable sample types
  const regulationSuggestions = useMemo(() => {
    if (branch !== 'REGULATION_DRIVEN' || selectedStandards.length === 0) return [];
    const seen = new Set();
    const out = [];
    selectedStandards.forEach(s => (s.applicableSampleTypes || s.sampleTypeIds || []).forEach(stId => {
      if (seen.has(stId)) return;
      seen.add(stId);
      const st = ALL_SAMPLE_TYPES.find(x => x.id === stId);
      if (!st) return;
      const coveringStds = selectedStandards.filter(x => (x.applicableSampleTypes || x.sampleTypeIds || []).includes(stId));
      out.push({ ...st, coveringStds });
    }));
    return out;
  }, [branch, selectedStandards]);

  // Report NCE click handler — opens existing OE NCE dialog (mocked here as alert)
  const openReportNceDialog = useCallback(() => {
    // Production: open the existing OE NCE dialog with scope = Sample (if a row is highlighted) or Order
    // eslint-disable-next-line no-alert
    alert('Opens existing OE NCE dialog (scope: Order, or Sample if a manifest row is highlighted). No new dialog component — wires existing infra onto Step 1.');
  }, []);

  const updateSampleRow = useCallback((id, patch) => {
    setSampleRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  const applyBulkStorage = useCallback(() => {
    if (!bulkStorage) return;
    setSampleRows(prev => prev.map(r => ({ ...r, storageLocation: bulkStorage })));
  }, [bulkStorage]);

  // ── Step 3: QC handlers ──────────────────────────────────────────
  const addQcSample = useCallback((qcType) => {
    setQcSamples(prev => {
      const idx = prev.filter(q => q.qcType === qcType).length + 1;
      const prefix = qcType === 'BLANK' ? 'BLNK' : qcType === 'DUPLICATE' ? 'DUP' : 'CTRL';
      const newQc = {
        id: `qc-${qcType}-${prev.length + 1}`,
        qcId: `QC-${prefix}-${String(idx).padStart(3, '0')}`,
        qcType,
        blankSubtype: qcType === 'BLANK' ? 'Field' : null,
        parentSampleId: qcType === 'DUPLICATE' ? '' : null,
        materialName: qcType === 'CONTROL' ? '' : null,
        materialSource: qcType === 'CONTROL' ? '' : null,
        expectedValues: qcType === 'CONTROL' ? [] : null,
        storageLocation: '',
        notes: '',
      };
      return [...prev, newQc];
    });
  }, []);

  const updateQcSample = useCallback((id, patch) => {
    setQcSamples(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
  }, []);

  const removeQcSample = useCallback((id) => {
    setQcSamples(prev => prev.filter(q => q.id !== id));
  }, []);

  const flagSampleNce = useCallback((sampleId) => {
    // In real app, this opens the existing OE NCE dialog (coded reason + reject decision).
    // Mock: cycles through {none → flagged → rejected → none}
    setSampleNces(prev => {
      const current = prev[sampleId];
      if (!current) return { ...prev, [sampleId]: { code: 'COND-BROKEN', decision: 'accepted-with-flag' } };
      if (current.decision === 'accepted-with-flag') return { ...prev, [sampleId]: { code: 'HOLD-EXCEEDED', decision: 'rejected' } };
      const { [sampleId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // ── Render ────────────────────────────────────────────────────────

  const domainStyle = DOMAIN_BADGE_STYLES[LAB_UNIT.domain] || DOMAIN_BADGE_STYLES.Environmental;

  return (
    <div>
      {/* ── Progress Indicator (3 steps) ───────────────────────────── */}
      <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <ProgressIndicator currentIndex={currentStep} spaceEqually>
          <ProgressStep
            label={t('nav.step.branchOrder', 'Branch & Order Setup')}
            description={t('nav.step.branchOrder.desc', 'Branch, site, manifest, conditions')}
            current={currentStep === 0}
            complete={currentStep > 0}
          />
          <ProgressStep
            label={t('nav.step.labelStore', 'Label & Store')}
            description={t('nav.step.labelStore.desc', 'Per-sample labeling, storage')}
            current={currentStep === 1}
            complete={currentStep > 1}
          />
          <ProgressStep
            label={t('nav.step.qaIntake', 'QA / QC + Intake')}
            description={t('nav.step.qaIntake.desc', 'NCE, QC samples, submit batch')}
            current={currentStep === 2}
            complete={false}
          />
        </ProgressIndicator>
      </Tile>

      {/* ── Action Bar — Lab Number + Domain Badge + Referral Tag + Report NCE button (sticky, 2026-05-01) ─ */}
      <Tile style={{ marginBottom: 'var(--cds-spacing-05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Grid>
          <Column lg={4} md={4} sm={4}>
            <TextInput
              id="lab-number"
              labelText={t('label.order.labNumber', 'Lab Number')}
              value="ENV-2026-0412"
              readOnly
              helperText={t('label.order.labNumber.helper', 'Auto-generated')}
            />
          </Column>
          <Column lg={8} md={4} sm={4} style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--cds-spacing-03)' }}>
            <Tag
              type={domainStyle.tagType}
              size="md"
              title={t('tooltip.order.domainBadge', `This order belongs to ${LAB_UNIT.name} (${LAB_UNIT.domain})`)}
            >
              {LAB_UNIT.domain}
            </Tag>
            {referralSource && (
              <Tag type="cyan" size="md" renderIcon={Document}>
                {t('tag.order.referral', `Referral: ${referralSource.name}`)}
              </Tag>
            )}
            <span style={{ flex: 1 }} />
            {/* 2026-05-01: Report NCE — opens existing OE NCE dialog scoped to order (or sample if row highlighted) */}
            <Button
              kind="danger--ghost"
              size="sm"
              renderIcon={Warning}
              onClick={openReportNceDialog}
            >
              {t('button.order.reportNce', 'Report NCE')}
            </Button>
          </Column>
        </Grid>
      </Tile>

      {/* ════════════════════════════════════════════════════════════════
          STEP 1 — Branch & Order Setup (single page)
          ════════════════════════════════════════════════════════════════ */}
      {currentStep === 0 && (
        <Stack gap={5}>
          {/* ── Branch Selector (2 tiles) ────────────────────────────── */}
          <Tile>
            <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
              {t('heading.order.orderType', 'Order Type')}
            </h4>
            <Grid>
              <Column lg={6} md={4} sm={4}>
                <ClickableTile
                  id="branch-regulation"
                  light={branch !== 'REGULATION_DRIVEN'}
                  onClick={() => handleBranchSelect('REGULATION_DRIVEN')}
                  style={{
                    border: branch === 'REGULATION_DRIVEN'
                      ? '2px solid var(--cds-link-primary)'
                      : '1px solid var(--cds-border-subtle)',
                    minHeight: '120px',
                  }}
                >
                  <h5>{t('label.order.branch.regulationDriven', 'Regulation-driven')}</h5>
                  <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginTop: 'var(--cds-spacing-03)' }}>
                    {t('label.order.branch.regulationDriven.helper', 'Order is governed by a compliance standard. Tests will be suggested based on the standard\'s linked thresholds.')}
                  </p>
                </ClickableTile>
              </Column>
              <Column lg={6} md={4} sm={4}>
                <ClickableTile
                  id="branch-adhoc"
                  light={branch !== 'AD_HOC'}
                  onClick={() => handleBranchSelect('AD_HOC')}
                  style={{
                    border: branch === 'AD_HOC'
                      ? '2px solid var(--cds-link-primary)'
                      : '1px solid var(--cds-border-subtle)',
                    minHeight: '120px',
                  }}
                >
                  <h5>{t('label.order.branch.adhoc', 'Ad-hoc')}</h5>
                  <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginTop: 'var(--cds-spacing-03)' }}>
                    {t('label.order.branch.adhoc.helper', 'Site-driven. Pick tests freely from the catalog. Optional regulatory reference for audit trail.')}
                  </p>
                </ClickableTile>
              </Column>
            </Grid>
            {referralSource && (
              <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)', marginTop: 'var(--cds-spacing-04)' }}>
                <Information size={12} style={{ verticalAlign: 'middle' }} />{' '}
                {t('label.order.branch.helper.referralAutoSet', 'Auto-set when order arrives from referral. You can override.')}
              </p>
            )}
          </Tile>

          {/* ── Submitter (Organization) — NEW 2026-05-01 ──────────────── */}
          {branch && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                {t('heading.order.submitter', 'Submitter')}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
                {t('label.order.submitter.helper', 'The customer or program requesting this order. Maps to the existing OE Organization entity (mirrors clinical AMAP backend).')}
              </p>
              {!submitter ? (
                <Stack gap={3}>
                  <ComboBox
                    id="submitter-org"
                    titleText={t('label.order.submitter.org', 'Organization *')}
                    placeholder={t('placeholder.submitter.org', 'Search organizations…')}
                    items={MOCK_ORGANIZATIONS}
                    itemToString={(o) => o ? o.name : ''}
                    onChange={({ selectedItem }) => setSubmitter(selectedItem)}
                  />
                  <Button kind="ghost" size="sm" renderIcon={Add}>
                    {t('button.submitter.create', '+ Create new Organization')}
                  </Button>
                </Stack>
              ) : (
                <Tile light style={{ padding: 'var(--cds-spacing-05)', display: 'flex', gap: 'var(--cds-spacing-04)' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600 }}>{submitter.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)', marginTop: 4 }}>{submitter.address}</p>
                    <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{submitter.contact}</p>
                    <Tag type="blue" size="sm" style={{ marginTop: 6 }}>
                      {submitter.recentOrderCount} orders in last 90 days
                    </Tag>
                  </div>
                  <Button kind="ghost" size="sm" onClick={() => setSubmitter(null)}>
                    {t('button.submitter.change', 'Change')}
                  </Button>
                </Tile>
              )}
            </Tile>
          )}

          {/* ── Sampling Site (always) ───────────────────────────────── */}
          {branch && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                {t('heading.order.samplingSite', 'Sampling Site')}
              </h4>
              {selectedSite ? (
                <Tile light style={{ borderLeft: '3px solid var(--cds-support-success)', padding: 'var(--cds-spacing-05)' }}>
                  <Grid>
                    <Column lg={6} md={4} sm={4}>
                      <p style={{ fontWeight: 600 }}>{selectedSite.code} — {selectedSite.name}</p>
                      <Stack orientation="horizontal" gap={2} style={{ marginTop: 'var(--cds-spacing-02)' }}>
                        <Tag type="teal" size="sm">{selectedSite.type}</Tag>
                        {selectedSite.subtype && <Tag type="gray" size="sm">{selectedSite.subtype}</Tag>}
                      </Stack>
                    </Column>
                    <Column lg={3} md={2} sm={2}>
                      <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.site.region', 'Region')}</p>
                      <p>{selectedSite.region} &gt; {selectedSite.district}</p>
                    </Column>
                    <Column lg={3} md={2} sm={2}>
                      <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.site.gps', 'GPS')}</p>
                      <p style={{ fontFamily: 'monospace' }}>{selectedSite.gps}</p>
                    </Column>
                    <Column lg={3} md={2} sm={2}>
                      <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.site.zone', 'Zone')}</p>
                      <p>{selectedSite.zone}</p>
                    </Column>
                    <Column lg={3} md={2} sm={2}>
                      <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.site.collections', 'Collections')}</p>
                      <p>{selectedSite.totalCollections} ({t('label.site.last', 'last')}: {selectedSite.lastCollection})</p>
                    </Column>
                  </Grid>
                  <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-04)' }}>
                    <Button kind="ghost" size="sm" renderIcon={Edit}>{t('button.site.change', 'Change Site')}</Button>
                    <Button kind="ghost" size="sm" renderIcon={Close}>{t('button.site.clear', 'Clear')}</Button>
                  </Stack>
                </Tile>
              ) : (
                <Button kind="tertiary" renderIcon={Search}>{t('button.site.search', 'Search for Site')}</Button>
              )}
            </Tile>
          )}

          {/* ── Program (FHIR Questionnaire — Optional) — NEW 2026-05-01 ──────── */}
          {branch && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                {t('heading.order.program', 'Program')}{' '}
                <span style={{ fontWeight: 400, color: 'var(--cds-text-secondary)', fontSize: 13 }}>
                  ({t('label.order.program.optional', 'optional')})
                </span>
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
                {t('label.order.program.helper', 'Select a program to capture program-specific metadata. Programs are configured in Admin → Programs and scoped to the env domain.')}
              </p>
              <Select
                id="program-picker"
                labelText={t('label.order.program.label', 'Program')}
                value={program?.id || ''}
                onChange={(e) => {
                  const p = MOCK_PROGRAMS.find(x => x.id === e.target.value);
                  setProgram(p || null);
                  setProgramResponses({});
                }}
              >
                <SelectItem value="" text={t('placeholder.program.none', '— No program —')} />
                {MOCK_PROGRAMS.map(p => <SelectItem key={p.id} value={p.id} text={p.name} />)}
              </Select>
              {program && (
                <Tile light style={{ marginTop: 'var(--cds-spacing-04)', padding: 'var(--cds-spacing-05)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--cds-text-secondary)', letterSpacing: 1, marginBottom: 'var(--cds-spacing-04)', textTransform: 'uppercase' }}>
                    <Information size={12} style={{ verticalAlign: 'middle' }} />{' '}
                    {t('label.program.fhirQuestionnaire', `Rendered from FHIR Questionnaire · ${program.name}`)}
                  </p>
                  <Grid>
                    {program.questionnaire.map(q => (
                      <Column key={q.code} lg={8} md={4} sm={4} style={{ marginBottom: 'var(--cds-spacing-03)' }}>
                        {q.type === 'select' ? (
                          <Select
                            id={`prog-q-${q.code}`}
                            labelText={`${q.label}${q.required ? ' *' : ''}`}
                            value={programResponses[q.code] || ''}
                            onChange={(e) => setProgramResponses(r => ({ ...r, [q.code]: e.target.value }))}
                          >
                            <SelectItem value="" text="Select…" />
                            {q.options.map(o => <SelectItem key={o} value={o} text={o} />)}
                          </Select>
                        ) : q.type === 'date' ? (
                          <DatePicker datePickerType="single" dateFormat="Y-m-d"
                            value={programResponses[q.code] || ''}
                            onChange={([d]) => setProgramResponses(r => ({ ...r, [q.code]: d ? d.toISOString().slice(0,10) : '' }))}>
                            <DatePickerInput
                              id={`prog-q-${q.code}`}
                              labelText={`${q.label}${q.required ? ' *' : ''}`}
                              placeholder="yyyy-mm-dd"
                            />
                          </DatePicker>
                        ) : q.type === 'number' ? (
                          <NumberInput
                            id={`prog-q-${q.code}`}
                            label={`${q.label}${q.required ? ' *' : ''}`}
                            min={0}
                            value={programResponses[q.code] || ''}
                            onChange={(_, { value }) => setProgramResponses(r => ({ ...r, [q.code]: value }))}
                          />
                        ) : (
                          <TextInput
                            id={`prog-q-${q.code}`}
                            labelText={`${q.label}${q.required ? ' *' : ''}`}
                            value={programResponses[q.code] || ''}
                            onChange={(e) => setProgramResponses(r => ({ ...r, [q.code]: e.target.value }))}
                          />
                        )}
                      </Column>
                    ))}
                  </Grid>
                </Tile>
              )}
            </Tile>
          )}

          {/* ── Compliance Standards (REGULATION-DRIVEN ONLY) — 2026-04-28 multi-regulation ─ */}
          {branch === 'REGULATION_DRIVEN' && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                {t('heading.order.complianceStandards', 'Compliance Standards')}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
                Select <strong>one or more</strong> standards. Tests, thresholds, and downstream evaluation will be union'd across all selected standards. All selected standards are equal weight (no "primary").
              </p>

              {/* Add-standard ComboBox: filters out already-selected standards */}
              <ComboBox
                id="compliance-standard-add"
                items={MOCK_STANDARDS.filter(s => !selectedStandards.find(ss => ss.id === s.id))}
                itemToString={(item) => item ? `${item.regulationNumber} — ${item.name}` : ''}
                titleText={`${t('label.order.standard.add', 'Add Compliance Standard')} (${selectedStandards.length} selected)`}
                placeholder={t('placeholder.order.standard.search', 'Search by regulation number, name, or issuing body…')}
                onChange={addStandard}
                helperText={t('label.order.standard.helper', 'Type the regulation number from your paperwork (e.g. PP No. 22/2021). Add more by repeating.')}
                selectedItem={null}
              />

              {/* Selected Standards Stack — one card per selection */}
              {selectedStandards.length > 0 && (
                <Stack gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
                  {selectedStandards.map((std, idx) => (
                    <Tile key={std.id} light style={{ borderLeft: '3px solid var(--cds-link-primary)', padding: 'var(--cds-spacing-05)' }}>
                      {/* Regulation number prominent + remove button */}
                      <Stack orientation="horizontal" gap={3} style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 11, color: 'var(--cds-text-secondary)', marginBottom: 4 }}>
                            #{idx + 1} · {t('label.order.standard.regulationNumber', 'Regulation Number')}
                          </p>
                          <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600 }}>
                              {std.regulationNumber}
                            </span>
                            <IconButton kind="ghost" size="sm"
                              label={t('label.order.standard.copyRegNumber', 'Copy regulation number')}
                              onClick={() => navigator.clipboard?.writeText(std.regulationNumber)}>
                              <Copy />
                            </IconButton>
                            <Tag type="green" size="sm">{std.status}</Tag>
                          </Stack>
                        </div>
                        <Button kind="ghost" size="sm" renderIcon={Close} onClick={() => removeStandard(std.id)}>
                          {t('button.order.standard.remove', 'Remove')}
                        </Button>
                      </Stack>

                      <Grid style={{ marginTop: 'var(--cds-spacing-04)' }}>
                        <Column lg={6} md={4} sm={4}>
                          <p style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>{t('label.order.standard.name', 'Standard Name')}</p>
                          <p style={{ fontWeight: 500 }}>{std.name}</p>
                        </Column>
                        <Column lg={3} md={2} sm={2}>
                          <p style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>{t('label.order.standard.issuingBody', 'Issuing Body')}</p>
                          <p>{std.issuingBody}</p>
                        </Column>
                        <Column lg={2} md={2} sm={2}>
                          <p style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>Version</p>
                          <p>{std.version}</p>
                        </Column>
                        <Column lg={2} md={2} sm={2}>
                          <p style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>Linked Tests</p>
                          <p>{std.linkedTests}</p>
                        </Column>
                      </Grid>
                    </Tile>
                  ))}
                </Stack>
              )}
            </Tile>
          )}

          {/* (Old Ad-hoc Test Catalog MultiSelect removed 2026-04-28 —
              replaced by unified Order Panels + Order Tests section below) */}

          {/* ── Regulatory Reference (AD-HOC ONLY) ────────────────────── */}
          {branch === 'AD_HOC' && (
            <Tile>
              <TextArea
                id="adhoc-reg-ref"
                labelText={t('label.order.regulatoryReference.adhoc', 'Regulatory Reference (optional)')}
                helperText={t('label.order.regulatoryReference.adhoc.helper', 'Note any regulation referenced on the requisition. Optional — for audit trail only.')}
                placeholder={t('placeholder.order.regulatoryReference.adhoc', 'e.g., requisition references PP No. 22/2021 but client is requesting partial test panel only')}
                maxLength={500}
                rows={2}
                value={adhocRegRef}
                onChange={(e) => setAdhocRegRef(e.target.value)}
              />
            </Tile>
          )}

          {/* ── Sample Intake — CSV Bulk Upload + Per-Sample Manifest (rewritten 2026-05-01) ── */}
          {branch && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-03)' }}>
                {t('heading.order.sampleIntake', 'Sample Intake')}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-05)' }}>
                {t('label.order.intake.helper', 'Upload a CSV of pre-collected samples (primary path), or add rows manually below. One row = one physical sample. Each row carries Container Type, GPS, Location Details, Address.')}
              </p>

              {/* ─ A. CSV Bulk Upload ─ */}
              <Tile light style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
                <p style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-03)' }}>
                  {t('heading.intake.csvUpload', 'A. CSV Bulk Upload')}
                </p>
                <Grid style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                  <Column lg={8} md={4} sm={4}>
                    <Tile light style={{ border: '2px dashed var(--cds-border-subtle)', textAlign: 'center', padding: 'var(--cds-spacing-05)' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: 'var(--cds-spacing-02)' }}>
                        ⬇ {t('label.intake.downloadTemplate', 'Download CSV Template')}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
                        {t('label.intake.downloadTemplate.helper', 'Pre-formatted env columns: sample type, container type, GPS, location, address, collection date/time, collector, notes.')}
                      </p>
                      <Stack orientation="horizontal" gap={2} style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button kind="tertiary" size="sm">{t('button.intake.template.standard', 'Standard')}</Button>
                        <Button kind="ghost" size="sm">{t('button.intake.template.box', '10×10 Box')}</Button>
                        <Button kind="ghost" size="sm">{t('button.intake.template.plate', '96-Well Plate')}</Button>
                      </Stack>
                    </Tile>
                  </Column>
                  <Column lg={8} md={4} sm={4}>
                    <Tile light
                      style={{ border: '2px dashed var(--cds-link-primary)', background: '#edf5ff', textAlign: 'center', padding: 'var(--cds-spacing-05)', cursor: 'pointer' }}
                      onClick={() => setCsvPreview(DEMO_CSV_PREVIEW)}
                    >
                      <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: 'var(--cds-spacing-02)', color: 'var(--cds-link-primary)' }}>
                        ⬆ {t('label.intake.uploadCsv', 'Upload CSV File')}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>
                        {t('label.intake.uploadCsv.helper', 'Drag & drop or click to browse. .csv up to 5 MB.')}
                      </p>
                      {!csvPreview && (
                        <p style={{ fontSize: '11px', color: 'var(--cds-text-secondary)', marginTop: 8, fontStyle: 'italic' }}>
                          (click to load demo preview)
                        </p>
                      )}
                    </Tile>
                  </Column>
                </Grid>

                {/* CSV Preview Table */}
                {csvPreview && (() => {
                  const valid = csvPreview.rows.filter(r => r.status === 'VALID').length;
                  const mismatch = csvPreview.rows.filter(r => r.status.startsWith('MISMATCH')).length;
                  return (
                    <Tile light style={{ padding: 0, border: '1px solid var(--cds-border-subtle)' }}>
                      <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--cds-border-subtle)', background: 'var(--cds-layer-accent)' }}>
                        <p style={{ fontWeight: 500, fontSize: 13 }}>{t('label.intake.preview', `Preview: ${csvPreview.filename}`)}</p>
                        <Tag type="blue" size="sm">{csvPreview.rows.length} parsed</Tag>
                        <Tag type="green" size="sm">{valid} valid</Tag>
                        {mismatch > 0 && <Tag type="warm-gray" size="sm">{mismatch} need attention</Tag>}
                        <span style={{ flex: 1 }} />
                        <Button kind="ghost" size="sm" onClick={() => setCsvPreview(null)}>Clear</Button>
                      </Stack>
                      {mismatch > 0 && (
                        <InlineNotification
                          kind="warning"
                          lowContrast
                          hideCloseButton
                          title={t('label.intake.bulkFix.title', 'Bulk fix:')}
                          subtitle={t('label.intake.bulkFix.subtitle', 'If multiple rows share the same unknown value, fix one and apply the same value to all matching rows.')}
                          style={{ width: '100%', maxWidth: '100%' }}
                        />
                      )}
                      <Table size="sm">
                        <TableHead>
                          <TableRow>
                            <TableHeader>#</TableHeader>
                            <TableHeader>Sample Type</TableHeader>
                            <TableHeader>Container</TableHeader>
                            <TableHeader>GPS</TableHeader>
                            <TableHeader>Location</TableHeader>
                            <TableHeader>Address</TableHeader>
                            <TableHeader>Status</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {csvPreview.rows.map(r => (
                            <TableRow key={r.row} style={r.status !== 'VALID' ? { background: '#fff8e1' } : {}}>
                              <TableCell>{r.row}</TableCell>
                              <TableCell>
                                {r.mismatchField === 'sampleType' ? (
                                  <Select
                                    id={`csv-type-${r.row}`}
                                    labelText=""
                                    hideLabel
                                    size="sm"
                                    invalid
                                    invalidText={`⚠ Unknown: ${r.sampleType}`}
                                    onChange={(e) => e.target.value && reconcileCsvRow(r.row, 'sampleType', e.target.value)}
                                  >
                                    <SelectItem value="" text={`⚠ ${r.sampleType} — pick…`} />
                                    {ALL_SAMPLE_TYPES.map(st => <SelectItem key={st.id} value={st.name} text={st.name} />)}
                                  </Select>
                                ) : r.sampleType}
                              </TableCell>
                              <TableCell>
                                {r.mismatchField === 'container' ? (
                                  <Select
                                    id={`csv-cont-${r.row}`}
                                    labelText=""
                                    hideLabel
                                    size="sm"
                                    invalid
                                    invalidText={`⚠ Unknown: ${r.container}`}
                                    onChange={(e) => e.target.value && reconcileCsvRow(r.row, 'container', e.target.value)}
                                  >
                                    <SelectItem value="" text={`⚠ ${r.container} — pick…`} />
                                    {MOCK_CONTAINER_TYPES.map(c => <SelectItem key={c} value={c} text={c} />)}
                                  </Select>
                                ) : r.container}
                              </TableCell>
                              <TableCell><code style={{ fontSize: 11 }}>{r.gps}</code></TableCell>
                              <TableCell>{r.loc}</TableCell>
                              <TableCell style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.addr}</TableCell>
                              <TableCell>
                                {r.status === 'VALID' && <Tag type="green" size="sm">✓ Valid</Tag>}
                                {r.status === 'MISMATCH_TYPE' && <Tag type="warm-gray" size="sm">⚠ Unknown type</Tag>}
                                {r.status === 'MISMATCH_CONT' && <Tag type="warm-gray" size="sm">⚠ Unknown container</Tag>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Stack orientation="horizontal" gap={2} style={{ padding: '10px 14px', borderTop: '1px solid var(--cds-border-subtle)', justifyContent: 'flex-end' }}>
                        <Button kind="ghost" size="sm">{t('button.intake.fixIssues', 'Fix Issues')}</Button>
                        <Button
                          kind="primary"
                          size="sm"
                          disabled={valid === 0}
                          onClick={importValidCsv}
                        >
                          {t('button.intake.importValid', `Import ${valid} Valid Sample${valid === 1 ? '' : 's'}`)}
                        </Button>
                      </Stack>
                    </Tile>
                  );
                })()}
              </Tile>

              {/* ─ B. Per-Sample Manifest Table ─ */}
              <p style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-03)' }}>
                {t('heading.intake.perSampleManifest', 'B. Per-Sample Manifest')}{' '}
                <span style={{ fontWeight: 400, color: 'var(--cds-text-secondary)', fontSize: 13 }}>
                  ({t('label.intake.perSample.subtitle', 'one row = one physical sample')})
                </span>
              </p>

              {/* Quick-add strip — regulation-suggested sample types with per-suggestion qty stepper (NEW 2026-05-01) */}
              {branch === 'REGULATION_DRIVEN' && regulationSuggestions.length > 0 && (
                <Tile light style={{ padding: 'var(--cds-spacing-04)', marginBottom: 'var(--cds-spacing-04)' }}>
                  <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-03)' }}>
                    ⚡ <strong>{t('label.intake.quickAdd.title', 'Quick-add from regulation suggestions')}</strong>
                    {' · '}{selectedStandards.map(s => s.regulationNumber).join(' + ')}
                    {' · '}{t('label.intake.quickAdd.helper', 'type a count, hit Add to create N rows')}
                  </p>
                  <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
                    {regulationSuggestions.map(st => {
                      const qty = suggestQty[st.id] || 0;
                      return (
                        <div key={st.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--cds-background)', border: '1px solid var(--cds-border-subtle)', borderRadius: 4, padding: '6px 10px', fontSize: 12 }}
                        >
                          <span style={{ fontWeight: 500 }}>{st.name}</span>
                          <Stack orientation="horizontal" gap={1}>
                            {st.coveringStds.map(s => (
                              <Tag key={s.id} type="purple" size="sm">{s.regulationNumber}</Tag>
                            ))}
                          </Stack>
                          <NumberInput
                            id={`qa-qty-${st.id}`}
                            hideLabel
                            label=""
                            min={0}
                            max={99}
                            value={qty}
                            size="sm"
                            onChange={(_, { value }) => setSuggestQty(p => ({ ...p, [st.id]: Math.max(0, parseInt(value) || 0) }))}
                            style={{ width: 70 }}
                          />
                          <Button
                            kind="ghost"
                            size="sm"
                            disabled={qty <= 0}
                            renderIcon={Add}
                            onClick={() => addSuggestedRows(st, qty)}
                          >
                            {t('button.intake.quickAdd.add', `Add${qty ? ' ' + qty : ''}`)}
                          </Button>
                        </div>
                      );
                    })}
                  </Stack>
                </Tile>
              )}

              {/* Per-sample manifest table */}
              {sampleRowsManifest.length === 0 ? (
                <Tile light style={{ padding: 'var(--cds-spacing-05)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)' }}>
                    {t('label.intake.empty', 'No samples yet. Upload a CSV above, or click + Add sample row below to start manually.')}
                  </p>
                </Tile>
              ) : (
                <Table size="sm">
                  <TableHead>
                    <TableRow>
                      <TableHeader style={{ width: 40 }}>#</TableHeader>
                      <TableHeader>Sample Type</TableHeader>
                      <TableHeader>Container</TableHeader>
                      <TableHeader>GPS</TableHeader>
                      <TableHeader>Location Details</TableHeader>
                      <TableHeader>Address</TableHeader>
                      <TableHeader>Collected</TableHeader>
                      <TableHeader style={{ width: 40 }}></TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sampleRowsManifest.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          <ComboBox
                            id={`mr-type-${r.id}`}
                            titleText=""
                            placeholder="Sample type"
                            items={ALL_SAMPLE_TYPES}
                            itemToString={(it) => it ? it.name : ''}
                            initialSelectedItem={ALL_SAMPLE_TYPES.find(s => s.name === r.sampleType) || null}
                            onChange={({ selectedItem }) => updateManifestRow(r.id, { sampleType: selectedItem?.name || '' })}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <ComboBox
                            id={`mr-cont-${r.id}`}
                            titleText=""
                            placeholder="Container"
                            items={MOCK_CONTAINER_TYPES.map(c => ({ id: c, label: c }))}
                            itemToString={(it) => it ? it.label : ''}
                            initialSelectedItem={MOCK_CONTAINER_TYPES.includes(r.container) ? { id: r.container, label: r.container } : null}
                            onChange={({ selectedItem }) => updateManifestRow(r.id, { container: selectedItem?.label || '' })}
                            allowCustomValue
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <TextInput
                            id={`mr-gps-${r.id}`}
                            labelText=""
                            hideLabel
                            placeholder="lat, lon"
                            value={r.gps}
                            onChange={(e) => updateManifestRow(r.id, { gps: e.target.value })}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <TextInput
                            id={`mr-loc-${r.id}`}
                            labelText=""
                            hideLabel
                            value={r.loc}
                            onChange={(e) => updateManifestRow(r.id, { loc: e.target.value })}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <TextInput
                            id={`mr-addr-${r.id}`}
                            labelText=""
                            hideLabel
                            value={r.addr}
                            onChange={(e) => updateManifestRow(r.id, { addr: e.target.value })}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <TextInput
                            id={`mr-dt-${r.id}`}
                            labelText=""
                            hideLabel
                            placeholder="YYYY-MM-DD HH:mm"
                            value={r.dt}
                            onChange={(e) => updateManifestRow(r.id, { dt: e.target.value })}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton kind="ghost" size="sm" label="Remove" onClick={() => removeManifestRow(r.id)}>
                            <TrashCan />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-04)' }}>
                <Button kind="ghost" size="sm" renderIcon={Add} onClick={addManifestRow}>
                  {t('button.intake.addRow', '+ Add sample row')}
                </Button>
                <span style={{ flex: 1 }} />
                <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)' }}>
                  <strong>{t('label.intake.totalSamples', `Total: ${sampleRowsManifest.length} sample${sampleRowsManifest.length === 1 ? '' : 's'} in this batch`)}</strong>
                </p>
              </Stack>
            </Tile>
          )}

          {/* ── Test Selection — existing OE Order Panels + Order Tests pattern (rewritten 2026-04-28) ── */}
          {/* Single component for both branches. Filtered to manifest sample types. */}
          {/* Regulation branch: pre-checks panels/tests linked to ≥1 selected standard. Ad-hoc: starts blank. */}
          {branch && activeManifestSampleTypes.length > 0 && (() => {
            // Filter panels/tests to manifest sample types
            const visiblePanels = MOCK_PANELS.filter(p =>
              p.applicableSampleTypes.some(st => activeManifestSampleTypes.includes(st)));
            const visibleTests = MOCK_TEST_CATALOG.filter(t =>
              t.applicableSampleTypes.some(st => activeManifestSampleTypes.includes(st)));

            // Apply typeahead filter
            const filteredPanels = panelSearch
              ? visiblePanels.filter(p => p.name.toLowerCase().includes(panelSearch.toLowerCase()))
              : visiblePanels;
            const filteredTests = testSearch
              ? visibleTests.filter(t => t.name.toLowerCase().includes(testSearch.toLowerCase()) || t.loinc.includes(testSearch))
              : visibleTests;

            // Tests effectively selected = explicitly selected ∪ tests pulled in by selected panels
            const panelIncludedTestIds = new Set(
              selectedPanelIds.flatMap(pid => MOCK_PANELS.find(p => p.id === pid)?.testIds || []));
            const allSelectedTestIds = new Set([...selectedTestIds, ...panelIncludedTestIds]);

            const togglePanel = (id) => setSelectedPanelIds(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
            const toggleTest = (id) => setSelectedTestIds(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

            return (
              <Tile>
                <h4 style={{ marginBottom: 4 }}>{t('heading.order.testSelection', 'Test Selection')}</h4>
                <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
                  Existing OE Order Panels + Order Tests pattern. Panels and tests are filtered to your selected sample types.
                  All checked tests apply to <strong>every sample row</strong> at Step 2 (per-sample override deferred — BR-007).
                  {branch === 'REGULATION_DRIVEN' && selectedStandards.length > 0 &&
                    ' Pre-checked = covered by ≥1 selected standard.'}
                </p>

                {/* ─── Order Panels section ─── */}
                <h5 style={{ marginTop: 'var(--cds-spacing-04)', marginBottom: 'var(--cds-spacing-02)' }}>
                  {t('heading.order.panels', 'Order Panels')}
                </h5>
                {selectedPanelIds.length > 0 && (
                  <Stack orientation="horizontal" gap={1} style={{ flexWrap: 'wrap', marginBottom: 'var(--cds-spacing-03)' }}>
                    {selectedPanelIds.map(pid => {
                      const p = MOCK_PANELS.find(x => x.id === pid);
                      return p ? (
                        <Tag key={pid} type="green" size="md" filter onClose={() => togglePanel(pid)}>
                          {p.name}
                        </Tag>
                      ) : null;
                    })}
                  </Stack>
                )}
                <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginBottom: 4 }}>
                  {t('label.order.panelSearch', 'Search through the available panels')}
                </p>
                <TextInput
                  id="panel-search"
                  labelText=""
                  hideLabel
                  placeholder={t('placeholder.order.panelSearch', '🔍  Choose Available panel')}
                  value={panelSearch}
                  onChange={(e) => setPanelSearch(e.target.value)}
                  size="sm"
                />
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--cds-border-subtle)', padding: 'var(--cds-spacing-03)', marginTop: 4 }}>
                  {filteredPanels.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', fontStyle: 'italic' }}>
                      No panels match.
                    </p>
                  ) : (
                    filteredPanels.map(p => (
                      <Checkbox
                        key={p.id}
                        id={`panel-${p.id}`}
                        labelText={p.name}
                        checked={selectedPanelIds.includes(p.id)}
                        onChange={() => togglePanel(p.id)}
                      />
                    ))
                  )}
                </div>

                {/* ─── Order Tests section ─── */}
                <h5 style={{ marginTop: 'var(--cds-spacing-05)', marginBottom: 'var(--cds-spacing-02)' }}>
                  {t('heading.order.tests', 'Order Tests')}
                </h5>
                {allSelectedTestIds.size > 0 && (
                  <Stack orientation="horizontal" gap={1} style={{ flexWrap: 'wrap', marginBottom: 'var(--cds-spacing-03)' }}>
                    {[...allSelectedTestIds].map(tid => {
                      const t = MOCK_TEST_CATALOG.find(x => x.id === tid);
                      const fromPanel = panelIncludedTestIds.has(tid) && !selectedTestIds.includes(tid);
                      return t ? (
                        <Tag key={tid} type={fromPanel ? 'cool-gray' : 'magenta'} size="md"
                             filter={!fromPanel}
                             onClose={!fromPanel ? () => toggleTest(tid) : undefined}>
                          {t.name}
                          {fromPanel && <span style={{ fontSize: 10, marginLeft: 4 }}>· via panel</span>}
                        </Tag>
                      ) : null;
                    })}
                  </Stack>
                )}
                <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginBottom: 4 }}>
                  {t('label.order.testSearch', 'Search through the available tests')}
                </p>
                <TextInput
                  id="test-search"
                  labelText=""
                  hideLabel
                  placeholder={t('placeholder.order.testSearch', '🔍  Choose Available Test')}
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  size="sm"
                />
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--cds-border-subtle)', padding: 'var(--cds-spacing-03)', marginTop: 4 }}>
                  {filteredTests.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', fontStyle: 'italic' }}>
                      No tests match.
                    </p>
                  ) : (
                    filteredTests.map(test => (
                      <Checkbox
                        key={test.id}
                        id={`test-${test.id}`}
                        labelText={test.name}
                        checked={selectedTestIds.includes(test.id) || panelIncludedTestIds.has(test.id)}
                        disabled={panelIncludedTestIds.has(test.id) && !selectedTestIds.includes(test.id)}
                        onChange={() => toggleTest(test.id)}
                      />
                    ))
                  )}
                </div>
              </Tile>
            );
          })()}

          {/* ── Default Collection Conditions (always when branch chosen) ── */}
          {branch && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-02)' }}>
                {t('heading.order.collectionConditions', 'Default Collection Conditions')}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
                {t('label.order.collectionConditions.helper', 'Defaults applied to all samples in this batch.')}
              </p>
              <Grid>
                <Column lg={6} md={4} sm={4}>
                  <Select
                    id="collection-method"
                    labelText={t('label.order.collection.method', 'Collection Method *')}
                    value={collectionMethod}
                    onChange={(e) => setCollectionMethod(e.target.value)}
                  >
                    <SelectItem value="" text={t('placeholder.order.collection.method', 'Select…')} />
                    {COLLECTION_METHODS.map(m => <SelectItem key={m} value={m} text={m} />)}
                  </Select>
                </Column>
                <Column lg={3} md={2} sm={2}>
                  <NumberInput
                    id="water-temp"
                    label={t('label.order.collection.waterTemperature', 'Water Temp (°C)')}
                    value={waterTemp}
                    onChange={(_, { value }) => setWaterTemp(value)}
                    min={-50} max={100} step={0.1}
                  />
                </Column>
                <Column lg={3} md={2} sm={2}>
                  <NumberInput
                    id="ambient-temp"
                    label={t('label.order.collection.ambientTemperature', 'Ambient Temp (°C)')}
                    value={ambientTemp}
                    onChange={(_, { value }) => setAmbientTemp(value)}
                    min={-50} max={100} step={0.1}
                  />
                </Column>
                <Column lg={6} md={4} sm={4}>
                  <Select
                    id="weather"
                    labelText={t('label.order.collection.weatherConditions', 'Weather')}
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                  >
                    <SelectItem value="" text={t('placeholder.order.collection.weather', 'Select…')} />
                    {WEATHER_OPTIONS.map(w => <SelectItem key={w} value={w} text={w} />)}
                  </Select>
                </Column>
                <Column lg={6} md={4} sm={4}>
                  <TextInput
                    id="preservation"
                    labelText={t('label.order.collection.preservationMethod', 'Preservation Method')}
                    placeholder={t('placeholder.order.preservation', 'e.g., HNO3 acidification, 4°C cooler')}
                    value={preservation}
                    onChange={(e) => setPreservation(e.target.value)}
                    maxLength={255}
                  />
                </Column>
                <Column lg={12} md={8} sm={4}>
                  <TextArea
                    id="field-notes"
                    labelText={t('label.order.collection.fieldNotes', 'Field Notes')}
                    placeholder={t('placeholder.order.fieldNotes', 'Enter field observations…')}
                    value={fieldNotes}
                    onChange={(e) => setFieldNotes(e.target.value)}
                    maxLength={1000}
                    rows={2}
                  />
                </Column>
              </Grid>
            </Tile>
          )}

          {/* ── Pool/Aliquot Sub-section (referral with parent specimens only) ── */}
          {hasParentSpecimens && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                {t('heading.order.poolAliquot', 'Pool / Aliquot')}
              </h4>
              <InlineNotification
                kind="info"
                title=""
                subtitle={t('message.order.poolPreFilled', 'Parent specimens detected in referral payload. Local aliquot LABNOs assigned automatically.')}
                hideCloseButton
                lowContrast
              />
              <Table size="sm" style={{ marginTop: 'var(--cds-spacing-04)' }}>
                <TableHead>
                  <TableRow>
                    <TableHeader>{t('label.pool.parentSpecimen', 'Parent Specimen (sender)')}</TableHeader>
                    <TableHeader>{t('label.pool.localAliquot', 'Local Aliquot LABNO')}</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell><code>POOL-XYZ-2026-09</code></TableCell>
                    <TableCell><code>ENV-2026-0412.1-3</code></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Tile>
          )}

          {/* ── Footer Actions ─────────────────────────────────────── */}
          {branch && (
            <Tile>
              <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
                <Button kind="ghost">{t('button.order.cancel', 'Cancel')}</Button>
                <Button kind="secondary" renderIcon={Save}>{t('button.order.saveDraft', 'Save Draft')}</Button>
                <Button
                  kind="primary"
                  renderIcon={ArrowRight}
                  onClick={advanceToStep2}
                  disabled={totalSamples === 0 || !collectionMethod || (branch === 'REGULATION_DRIVEN' && selectedStandards.length === 0)}
                >
                  {t('button.order.continueToLabel', 'Continue to Label & Store')}
                </Button>
              </Stack>
            </Tile>
          )}
        </Stack>
      )}

      {/* ════════════════════════════════════════════════════════════════
          STEP 2 — Label & Store
          ════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <Stack gap={5}>
          {/* 2026-04-29 simplification: Step 2 reuses the existing OpenELIS labeling and storage pattern.
              No custom UI is designed in this spec. Placeholder tile shown below; the only env-specific
              deltas are (a) Sample Type sourced read-only from Step 1 manifest, and (b) hold-time clock
              starts when Collection Date/Time is entered. */}
          <Tile style={{ background: '#f4f4f4', border: '1px dashed #8d8d8d' }}>
            <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
              {t('heading.order.labelStore', 'Label & Store')}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
              {t('label.order.labelStore.placeholder', 'This step reuses the existing OpenELIS labeling and storage UI for the {{count}} sample row(s) generated from Step 1. No custom Env UI is designed here.', { count: sampleRows.length })}
            </p>
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '12px 16px', fontSize: '12px', color: '#525252' }}>
              <strong>Env-specific behaviors layered on the existing pattern:</strong>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                <li>Sample Type for each row is sourced from the Step 1 manifest (read-only).</li>
                <li>Hold-time clock starts when Collection Date/Time is entered (per-test hold-time × strictest standard).</li>
                <li>Hold-time-exceeded rows show a red indicator; not blocked — flows to Step 3 for NCE decision.</li>
              </ul>
            </div>
            <p style={{ fontSize: '12px', color: '#525252', marginTop: 'var(--cds-spacing-04)', fontStyle: 'italic' }}>
              {sampleRows.length} sample row{sampleRows.length === 1 ? '' : 's'} ready for OE label/storage entry.
            </p>
          </Tile>

          <Tile>
            <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
              <Button kind="ghost" onClick={() => setCurrentStep(0)}>{t('button.back', 'Back')}</Button>
              <Button kind="secondary" renderIcon={Save}>{t('button.order.saveDraft', 'Save Draft')}</Button>
              <Button kind="primary" renderIcon={ArrowRight} onClick={() => setCurrentStep(2)}>
                {t('button.order.continueToQa', 'Continue to QA / QC')}
              </Button>
            </Stack>
          </Tile>
        </Stack>
      )}

      {/* ════════════════════════════════════════════════════════════════
          STEP 3 — QA / QC + Intake Acceptance
          ════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <Stack gap={5}>
          {/* Per-sample table with NCE column */}
          <Tile>
            <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
              {t('heading.order.intake', 'Sample Intake (NCE / Reject)')}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-05)' }}>
              {t('label.order.intake.helper', 'Click NCE on any sample to flag with a coded reason and accept-with-flag or reject. Reuses the existing OpenELIS NCE button.')}
            </p>

            <Table size="sm">
              <TableHead>
                <TableRow>
                  <TableHeader>#</TableHeader>
                  <TableHeader>{t('label.sample.type', 'Sample Type')}</TableHeader>
                  <TableHeader>{t('label.sample.accession', 'Accession')}</TableHeader>
                  <TableHeader>{t('label.sample.condition', 'Receipt')}</TableHeader>
                  <TableHeader>{t('label.sample.holdTime', 'Hold-time')}</TableHeader>
                  <TableHeader>{t('label.sample.nce', 'NCE')}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleRows.map(row => {
                  const nce = sampleNces[row.id];
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.rowIndex}</TableCell>
                      <TableCell>{row.sampleType?.name}</TableCell>
                      <TableCell><code style={{ fontSize: '12px' }}>{row.accession}</code></TableCell>
                      <TableCell>{row.receiptCondition || '—'}</TableCell>
                      <TableCell>
                        {/* Mock: every 3rd row "exceeded" */}
                        {row.rowIndex % 3 === 0
                          ? <Tag type="red" size="sm">{t('tag.order.holdTimeExceeded', 'Exceeded')}</Tag>
                          : <Tag type="green" size="sm">{t('tag.order.holdTimeOk', 'OK')}</Tag>}
                      </TableCell>
                      <TableCell>
                        {nce ? (
                          <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center' }}>
                            <Tag
                              type={nce.decision === 'rejected' ? 'red' : 'magenta'}
                              size="sm"
                            >
                              {nce.code}
                            </Tag>
                            {nce.decision === 'rejected'
                              ? <Close size={14} style={{ color: 'var(--cds-support-error)' }} />
                              : <WarningAlt size={14} style={{ color: 'var(--cds-support-warning)' }} />}
                            <Button kind="ghost" size="sm" onClick={() => flagSampleNce(row.id)}>
                              {t('button.nce.edit', 'Edit')}
                            </Button>
                          </Stack>
                        ) : (
                          <Button
                            kind="tertiary"
                            size="sm"
                            renderIcon={Warning}
                            onClick={() => flagSampleNce(row.id)}
                          >
                            {t('button.nce.flag', 'Flag NCE')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Tile>

          {/* QC Quick-Add */}
          <Tile>
            <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', marginBottom: 'var(--cds-spacing-04)' }}>
              <h4 style={{ flex: 1 }}>{t('heading.order.qcSamples', 'QC Samples')}</h4>
              <Button kind="primary" size="sm" renderIcon={Add} onClick={() => addQcSample('BLANK')}>
                {t('label.order.qc.addBlank', '+ Blank')}
              </Button>
              <Button kind="primary" size="sm" renderIcon={Add} onClick={() => addQcSample('DUPLICATE')}>
                {t('label.order.qc.addDuplicate', '+ Duplicate')}
              </Button>
              <Button kind="primary" size="sm" renderIcon={Add} onClick={() => addQcSample('CONTROL')}>
                {t('label.order.qc.addControl', '+ Control')}
              </Button>
            </Stack>

            {qcSamples.length > 0 ? (
              <Table size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader>{t('label.order.qc.qcId', 'QC ID')}</TableHeader>
                    <TableHeader>{t('label.order.qc.type', 'Type')}</TableHeader>
                    <TableHeader>{t('label.order.qc.detail', 'Detail')}</TableHeader>
                    <TableHeader>{t('label.order.qc.expectedValues', 'Expected Value(s)')}</TableHeader>
                    <TableHeader>{t('label.order.qc.storage', 'Storage')}</TableHeader>
                    <TableHeader></TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qcSamples.map(qc => (
                    <TableRow key={qc.id}>
                      <TableCell><code style={{ fontSize: '12px' }}>{qc.qcId}</code></TableCell>
                      <TableCell>
                        <Tag size="sm" type={qc.qcType === 'BLANK' ? 'gray' : qc.qcType === 'DUPLICATE' ? 'cyan' : 'green'}>
                          {qc.qcType}
                        </Tag>
                      </TableCell>
                      <TableCell>
                        {qc.qcType === 'BLANK' && (
                          <Select
                            id={`qc-bk-${qc.id}`}
                            labelText="" hideLabel size="sm"
                            value={qc.blankSubtype}
                            onChange={(e) => updateQcSample(qc.id, { blankSubtype: e.target.value })}
                          >
                            {BLANK_SUBTYPES.map(s => <SelectItem key={s} value={s} text={s} />)}
                          </Select>
                        )}
                        {qc.qcType === 'DUPLICATE' && (
                          <Select
                            id={`qc-dp-${qc.id}`}
                            labelText="" hideLabel size="sm"
                            value={qc.parentSampleId}
                            onChange={(e) => updateQcSample(qc.id, { parentSampleId: e.target.value })}
                          >
                            <SelectItem value="" text={t('placeholder.qc.parent', 'Pick parent…')} />
                            {sampleRows.map(s => <SelectItem key={s.id} value={s.id} text={s.accession} />)}
                          </Select>
                        )}
                        {qc.qcType === 'CONTROL' && (
                          <Stack gap={2}>
                            <TextInput
                              id={`qc-mn-${qc.id}`}
                              labelText="" hideLabel size="sm"
                              placeholder={t('placeholder.qc.materialName', 'Material name (e.g., NIST 1640a)')}
                              value={qc.materialName || ''}
                              onChange={(e) => updateQcSample(qc.id, { materialName: e.target.value })}
                            />
                            <TextInput
                              id={`qc-ms-${qc.id}`}
                              labelText="" hideLabel size="sm"
                              placeholder={t('placeholder.qc.materialSource', 'Source (vendor, lot)')}
                              value={qc.materialSource || ''}
                              onChange={(e) => updateQcSample(qc.id, { materialSource: e.target.value })}
                            />
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell>
                        {qc.qcType === 'CONTROL' && (
                          <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>
                            {t('label.qc.expectedValuesEditInline', 'Edit per parameter →')}
                          </p>
                        )}
                        {qc.qcType === 'DUPLICATE' && (
                          <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>
                            {t('label.qc.inheritsFromParent', 'inherits from parent')}
                          </p>
                        )}
                        {qc.qcType === 'BLANK' && (
                          <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>—</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          id={`qc-stor-${qc.id}`}
                          labelText="" hideLabel size="sm"
                          value={qc.storageLocation}
                          onChange={(e) => updateQcSample(qc.id, { storageLocation: e.target.value })}
                        >
                          <SelectItem value="" text="—" />
                          {MOCK_STORAGE_LOCATIONS.map(loc => <SelectItem key={loc} value={loc} text={loc} />)}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          kind="ghost"
                          size="sm"
                          label={t('button.qc.remove', 'Remove')}
                          onClick={() => removeQcSample(qc.id)}
                        >
                          <TrashCan />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)' }}>
                {t('label.order.qc.empty', 'No QC samples added. Click a button above to add one.')}
              </p>
            )}
          </Tile>

          {/* Footer */}
          <Tile>
            <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
              <Button kind="ghost" onClick={() => setCurrentStep(1)}>{t('button.back', 'Back')}</Button>
              <Button kind="secondary" renderIcon={Save}>{t('button.order.saveDraft', 'Save Draft')}</Button>
              <Button kind="primary" renderIcon={ArrowRight}>
                {t('button.order.submitBatch', 'Submit Batch')}
              </Button>
            </Stack>
          </Tile>
        </Stack>
      )}

      {/* ── Branch Switch Confirmation Modal ─────────────────────────── */}
      <Modal
        open={!!showSwitchConfirm}
        modalHeading={t('modal.switchBranch.heading', 'Switch order type?')}
        primaryButtonText={t('button.modal.continue', 'Continue and clear')}
        secondaryButtonText={t('button.modal.cancel', 'Keep current')}
        onRequestSubmit={confirmSwitchBranch}
        onRequestClose={() => setShowSwitchConfirm(false)}
      >
        <p>{t('message.order.switchBranchConfirm', 'Switching order type will clear the standard, tests, manifest, and regulatory reference. Continue?')}</p>
      </Modal>
    </div>
  );
}
