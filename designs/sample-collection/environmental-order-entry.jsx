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

import React, { useState, useCallback, useMemo } from 'react';
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
  const [manifest, setManifest] = useState([]);   // [{ sampleTypeId, quantity, coverageStandardIds: [], isOverride }]
  const [deselectedTestIds, setDeselectedTestIds] = useState(new Set());
  const [showAddSampleType, setShowAddSampleType] = useState(false);

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

  const removeManifestRow = useCallback((sampleTypeId) => {
    setManifest(prev => prev.filter(r => r.sampleTypeId !== sampleTypeId));
  }, []);

  const totalSamples = useMemo(
    () => manifest.reduce((sum, r) => sum + (r.quantity || 0), 0),
    [manifest],
  );

  // ── Suggested tests (regulation-driven) ──────────────────────────
  const activeManifestSampleTypes = useMemo(
    () => manifest.filter(r => r.quantity > 0).map(r => r.sampleTypeId),
    [manifest],
  );

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

  // ── Step 2: generate sample rows from manifest ────────────────────
  const generateSampleRows = useCallback(() => {
    const rows = [];
    let idx = 1;
    manifest.forEach(r => {
      const sampleType = ALL_SAMPLE_TYPES.find(st => st.id === r.sampleTypeId);
      for (let i = 0; i < r.quantity; i++) {
        rows.push({
          id: `s-${idx}`,
          rowIndex: idx,
          sampleType,
          accession: `ENV-2026-0412.${String(idx).padStart(3, '0')}`,
          barcode: '',
          collectionDateTime: '',
          receiptCondition: '',
          storageLocation: '',
          notes: '',
        });
        idx++;
      }
    });
    setSampleRows(rows);
  }, [manifest]);

  const advanceToStep2 = useCallback(() => {
    generateSampleRows();
    setCurrentStep(1);
  }, [generateSampleRows]);

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

      {/* ── Lab Number + Domain Badge + Referral Tag (always visible) ─ */}
      <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
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
          <Column lg={4} md={4} sm={4} style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--cds-spacing-03)' }}>
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

          {/* ── Test Catalog Picker (AD-HOC ONLY) ─────────────────────── */}
          {branch === 'AD_HOC' && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                {t('heading.order.testCatalog', 'Tests')}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
                {t('label.order.testCatalog.helper', 'Pick tests from the catalog. These will run for every sample in this batch.')}
              </p>
              <MultiSelect
                id="adhoc-tests"
                titleText={t('label.order.testCatalog', 'Test Catalog')}
                label={t('placeholder.order.tests.search', 'Search tests…')}
                items={[
                  { id: 't-005', label: 'pH (LOINC 11558-4)' },
                  { id: 't-002', label: 'TDS (LOINC 3745-7)' },
                  { id: 't-014', label: 'Lead (Pb) (LOINC 5671-0)' },
                  { id: 't-015', label: 'Mercury (Hg) (LOINC 5688-4)' },
                ]}
                itemToString={(item) => item ? item.label : ''}
                onChange={({ selectedItems }) => setAdhocTests(selectedItems)}
              />
            </Tile>
          )}

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

          {/* ── Sample Manifest (always when branch chosen) ──────────── */}
          {branch && (
            <Tile>
              <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', marginBottom: 'var(--cds-spacing-04)' }}>
                <h4 style={{ flex: 1 }}>{t('heading.order.sampleManifest', 'Sample Manifest')}</h4>
                <FileUploader
                  size="sm"
                  buttonLabel={t('label.order.manifest.csvUpload', 'Upload CSV manifest')}
                  accept={['.csv']}
                  filenameStatus="edit"
                />
              </Stack>

              {manifest.length > 0 ? (
                <Table size="md">
                  <TableHead>
                    <TableRow>
                      <TableHeader style={{ width: '40px' }}></TableHeader>
                      <TableHeader>{t('label.manifest.sampleType', 'Sample Type')}</TableHeader>
                      <TableHeader>{t('label.manifest.code', 'Code')}</TableHeader>
                      <TableHeader style={{ width: '120px' }}>{t('label.manifest.quantity', 'Quantity')}</TableHeader>
                      <TableHeader></TableHeader>
                      <TableHeader style={{ width: '40px' }}></TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manifest.map(row => {
                      const st = ALL_SAMPLE_TYPES.find(s => s.id === row.sampleTypeId);
                      return (
                        <TableRow key={row.sampleTypeId}>
                          <TableCell>
                            <Checkbox
                              id={`mn-chk-${row.sampleTypeId}`}
                              labelText=""
                              checked={row.quantity > 0}
                              onChange={(_, { checked }) => updateManifestQuantity(row.sampleTypeId, checked ? (row.quantity || 1) : 0)}
                            />
                          </TableCell>
                          <TableCell>{st?.name}</TableCell>
                          <TableCell><code style={{ fontSize: '12px' }}>{st?.code}</code></TableCell>
                          <TableCell>
                            <NumberInput
                              id={`mn-qty-${row.sampleTypeId}`}
                              hideLabel
                              label=""
                              min={0}
                              max={999}
                              value={row.quantity}
                              onChange={(_, { value }) => updateManifestQuantity(row.sampleTypeId, value)}
                              size="sm"
                            />
                          </TableCell>
                          <TableCell>
                            {/* 2026-04-28 amendment: per-row coverage tags showing which standards include this sample type */}
                            <Stack orientation="horizontal" gap={1} style={{ flexWrap: 'wrap' }}>
                              {row.coverageStandardIds && row.coverageStandardIds.map(stdId => {
                                const std = MOCK_STANDARDS.find(s => s.id === stdId);
                                return std ? <Tag key={stdId} type="purple" size="sm">{std.regulationNumber}</Tag> : null;
                              })}
                              {row.isOverride && <Tag type="warm-gray" size="sm">{t('tag.order.notInAnyStandard', 'Not in any selected standard')}</Tag>}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              kind="ghost"
                              size="sm"
                              label={t('button.manifest.remove', 'Remove')}
                              onClick={() => removeManifestRow(row.sampleTypeId)}
                            >
                              <TrashCan />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
                  {branch === 'REGULATION_DRIVEN'
                    ? t('label.order.manifest.empty.regulation', 'Select one or more compliance standards above to pre-populate sample types (union of each standard\'s applicable types, deduplicated).')
                    : t('label.order.manifest.empty.adhoc', 'Add sample types to begin.')}
                </p>
              )}

              <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-04)' }}>
                {showAddSampleType ? (
                  <ComboBox
                    id="add-sample-type"
                    items={ALL_SAMPLE_TYPES.filter(st => !manifest.find(m => m.sampleTypeId === st.id))}
                    itemToString={(item) => item ? `${item.name} (${item.code})` : ''}
                    titleText=""
                    placeholder={t('placeholder.order.manifest.addSampleType', 'Pick a sample type to add…')}
                    onChange={addOverrideSampleType}
                    style={{ minWidth: '320px' }}
                  />
                ) : (
                  <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setShowAddSampleType(true)}>
                    {t('label.order.manifest.addOtherSampleType', 'Add Other Sample Type')}
                  </Button>
                )}
                <span style={{ flex: 1 }} />
                <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)' }}>
                  <strong>{t('label.order.manifest.totalSamples', `Total: ${totalSamples} samples in this batch`)}</strong>
                </p>
              </Stack>
            </Tile>
          )}

          {/* ── Suggested Tests (REGULATION-DRIVEN, after manifest has sample types) ── */}
          {/* 2026-04-28 amendment: union+dedup across selectedStandards; per-test coverage tags */}
          {branch === 'REGULATION_DRIVEN' && selectedStandards.length > 0 && activeManifestSampleTypes.length > 0 && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                {t('heading.order.suggestedTests', 'Suggested Tests')}
              </h4>
              {(() => {
                const allTests = suggestedTestGroups.flatMap(g => g.tests);
                const sharedCount = allTests.filter(t => t.coverageStandardIds.length > 1).length;
                const stdRegs = selectedStandards.map(s => s.regulationNumber).join(' + ');
                return (
                  <InlineNotification
                    kind="info"
                    title=""
                    subtitle={`Based on ${selectedStandards.length} standards (${stdRegs}) and ${activeManifestSampleTypes.length} sample types, ${suggestedTestCount} unique tests suggested (${sharedCount} shared across multiple standards). ${selectedSuggestedTestCount} selected.`}
                    hideCloseButton
                    lowContrast
                    style={{ marginBottom: 'var(--cds-spacing-04)' }}
                  />
                );
              })()}

              {suggestedTestGroups.length > 0 ? (
                <Accordion>
                  {suggestedTestGroups.map(group => {
                    const selectedInGroup = group.tests.filter(test => !deselectedTestIds.has(test.id)).length;
                    return (
                      <AccordionItem
                        key={group.group}
                        title={`${group.group} (${selectedInGroup} of ${group.tests.length} selected)`}
                        open
                      >
                        <Table size="sm">
                          <TableHead>
                            <TableRow>
                              <TableHeader style={{ width: '40px' }}></TableHeader>
                              <TableHeader>{t('label.test.name', 'Test')}</TableHeader>
                              <TableHeader>{t('label.test.loinc', 'LOINC')}</TableHeader>
                              <TableHeader>{t('label.test.unit', 'Unit')}</TableHeader>
                              <TableHeader>{t('label.test.threshold', 'Threshold(s) — per standard')}</TableHeader>
                              <TableHeader>{t('label.test.coverage', 'Covered by')}</TableHeader>
                              <TableHeader></TableHeader>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {group.tests.map(test => {
                              const selected = !deselectedTestIds.has(test.id);
                              const isShared = test.coverageStandardIds.length > 1;
                              return (
                                <TableRow key={test.id}>
                                  <TableCell>
                                    <Checkbox
                                      id={`test-${test.id}`}
                                      labelText=""
                                      checked={selected}
                                      onChange={() => {
                                        setDeselectedTestIds(prev => {
                                          const next = new Set(prev);
                                          selected ? next.add(test.id) : next.delete(test.id);
                                          return next;
                                        });
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>{test.name}</TableCell>
                                  <TableCell><code style={{ fontSize: '12px' }}>{test.loinc}</code></TableCell>
                                  <TableCell>{test.unit}</TableCell>
                                  <TableCell>
                                    {/* Side-by-side per-standard threshold preview when shared */}
                                    {isShared ? (
                                      <Stack gap={1}>
                                        {test.coverageStandardIds.map(stdId => {
                                          const std = MOCK_STANDARDS.find(s => s.id === stdId);
                                          return (
                                            <span key={stdId} style={{ fontSize: 12 }}>
                                              <Tag type="purple" size="sm">{std?.regulationNumber}</Tag>{' '}
                                              <strong>{test.threshold}</strong>
                                            </span>
                                          );
                                        })}
                                      </Stack>
                                    ) : (
                                      <strong>{test.threshold}</strong>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Stack orientation="horizontal" gap={1} style={{ flexWrap: 'wrap' }}>
                                      {test.coverageStandardIds.map(stdId => {
                                        const std = MOCK_STANDARDS.find(s => s.id === stdId);
                                        return std ? <Tag key={stdId} type="purple" size="sm">{std.regulationNumber}</Tag> : null;
                                      })}
                                    </Stack>
                                  </TableCell>
                                  <TableCell>
                                    {selected && <Tag type="blue" size="sm">{t('tag.order.suggestedTest', 'Suggested')}</Tag>}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <InlineNotification
                  kind="warning"
                  title=""
                  subtitle={t('message.order.noLinkedTests', 'No tests are linked to any selected standard for the selected sample types. Add tests manually or remove a standard.')}
                  hideCloseButton
                  lowContrast
                />
              )}
            </Tile>
          )}

          {/* ── Default Collection Conditions (always when branch chosen) ── */}
          {branch && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-02)' }}>
                {t('heading.order.collectionConditions', 'Default Collection Conditions')}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-04)' }}>
                {t('label.order.collectionConditions.helper', 'Defaults applied to all samples. Per-sample overrides at Step 2.')}
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
          <Tile>
            <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
              {t('heading.order.labelStore', 'Label & Store')}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-05)' }}>
              {t('label.order.labelStore.helper', 'Per-sample accession + barcode + collection date/time + receipt condition + storage. Bulk-apply controls at the top.')}
            </p>

            {/* Bulk apply controls */}
            <Stack orientation="horizontal" gap={4} style={{ marginBottom: 'var(--cds-spacing-05)', alignItems: 'flex-end' }}>
              <Select
                id="bulk-storage"
                labelText={t('label.order.label.bulkApplyStorage', 'Apply storage location to all')}
                value={bulkStorage}
                onChange={(e) => setBulkStorage(e.target.value)}
              >
                <SelectItem value="" text={t('placeholder.bulk.storage', 'Pick a location to bulk-apply…')} />
                {MOCK_STORAGE_LOCATIONS.map(loc => <SelectItem key={loc} value={loc} text={loc} />)}
              </Select>
              <Button kind="tertiary" size="sm" onClick={applyBulkStorage} disabled={!bulkStorage}>
                {t('button.bulk.apply', 'Apply to all')}
              </Button>
            </Stack>

            {/* Per-sample table */}
            <Table size="md">
              <TableHead>
                <TableRow>
                  <TableHeader>#</TableHeader>
                  <TableHeader>{t('label.sample.type', 'Sample Type')}</TableHeader>
                  <TableHeader>{t('label.order.label.accession', 'Accession')}</TableHeader>
                  <TableHeader>{t('label.order.label.barcode', 'Barcode')}</TableHeader>
                  <TableHeader>{t('label.order.label.collectionDateTime', 'Collected')}</TableHeader>
                  <TableHeader>{t('label.order.label.receiptCondition', 'Receipt')}</TableHeader>
                  <TableHeader>{t('label.order.label.storageLocation', 'Storage')}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleRows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.rowIndex}</TableCell>
                    <TableCell>{row.sampleType?.name}</TableCell>
                    <TableCell><code style={{ fontSize: '12px' }}>{row.accession}</code></TableCell>
                    <TableCell>
                      <TextInput
                        id={`barcode-${row.id}`}
                        labelText=""
                        hideLabel
                        size="sm"
                        placeholder={t('placeholder.barcode', 'Scan or type…')}
                        value={row.barcode}
                        onChange={(e) => updateSampleRow(row.id, { barcode: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <TextInput
                        id={`dt-${row.id}`}
                        labelText=""
                        hideLabel
                        size="sm"
                        placeholder="YYYY-MM-DD HH:mm"
                        value={row.collectionDateTime}
                        onChange={(e) => updateSampleRow(row.id, { collectionDateTime: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        id={`recv-${row.id}`}
                        labelText=""
                        hideLabel
                        size="sm"
                        value={row.receiptCondition}
                        onChange={(e) => updateSampleRow(row.id, { receiptCondition: e.target.value })}
                      >
                        <SelectItem value="" text="—" />
                        {RECEIPT_CONDITIONS.map(rc => <SelectItem key={rc} value={rc} text={rc} />)}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        id={`stor-${row.id}`}
                        labelText=""
                        hideLabel
                        size="sm"
                        value={row.storageLocation}
                        onChange={(e) => updateSampleRow(row.id, { storageLocation: e.target.value })}
                      >
                        <SelectItem value="" text="—" />
                        {MOCK_STORAGE_LOCATIONS.map(loc => <SelectItem key={loc} value={loc} text={loc} />)}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
