/**
 * S-03: Environmental Order Entry Integration — React/Carbon Mockup
 *
 * Shows the Enter Order (Step 1) environmental section with:
 * - Sampling Site search/selection (from S-02)
 * - Compliance Standard ComboBox with Selected Standard Card
 * - Sample Type Selection (checklist from standard + override for non-standard types)
 * - Test Panel Auto-Suggestion filtered by standard AND selected sample types
 * - Collection Conditions (configurable per program)
 * - Regulatory Reference (auto-populated from standard)
 * - Order Context Card with standard persistence (Steps 2-4 preview)
 *
 * Dependencies: @carbon/react, @carbon/icons-react
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput, Toggle,
  Checkbox, RadioButton, RadioButtonGroup,
  Button, IconButton, InlineNotification, Tag, Tile, Accordion, AccordionItem,
  ProgressIndicator, ProgressStep,
} from '@carbon/react';
import { Plus, Pencil, ChevronDown, ChevronUp, Save, RefreshCw, Search, Eye, X, Lock } from 'lucide-react';

// i18n helper — all visible strings externalized
const t = (key, fallback) => fallback || key;

// ─── Mock Data ───────────────────────────────────────────────────────

// All sample types in the system (for override ComboBox)
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
  { id: 'std-001', name: 'PP No. 22/2021 — Baku Mutu Air Permukaan', issuingBody: 'Pemerintah RI', regulationNumber: 'PP 22/2021', version: '2021-01', effectiveDate: '2021-02-02', status: 'Active', linkedTests: 42, applicableSampleTypes: ['st-001', 'st-003', 'st-004'] },
  { id: 'std-002', name: 'PP No. 41/1999 — Baku Mutu Udara Ambien', issuingBody: 'Pemerintah RI', regulationNumber: 'PP 41/1999', version: '1999-01', effectiveDate: '1999-05-26', status: 'Active', linkedTests: 18, applicableSampleTypes: ['st-005', 'st-006'] },
  { id: 'std-003', name: 'WHO Drinking Water Guidelines (4th Ed)', issuingBody: 'World Health Organization', regulationNumber: 'WHO-DWG-4', version: '2011-01', effectiveDate: '2011-01-01', status: 'Active', linkedTests: 56, applicableSampleTypes: ['st-002', 'st-003'] },
  { id: 'std-004', name: 'PP No. 101/2014 — Pengelolaan Limbah B3', issuingBody: 'Pemerintah RI', regulationNumber: 'PP 101/2014', version: '2014-01', effectiveDate: '2014-10-17', status: 'Active', linkedTests: 31, applicableSampleTypes: ['st-007', 'st-008', 'st-009', 'st-001'] },
  { id: 'std-005', name: 'PermenKES No. 32/2017 — Baku Mutu Air Minum', issuingBody: 'Kemenkes RI', regulationNumber: 'PMK 32/2017', version: '2017-01', effectiveDate: '2017-05-12', status: 'Active', linkedTests: 38, applicableSampleTypes: ['st-002'] },
];

const MOCK_SUGGESTED_TESTS = {
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
      { id: 't-009', name: 'Ammonia (NH₃-N)', loinc: '1971-1', unit: 'mg/L', threshold: '≤ 0.5' },
      { id: 't-010', name: 'Nitrate (NO₃-N)', loinc: '3030-4', unit: 'mg/L', threshold: '≤ 10' },
      { id: 't-011', name: 'Phosphate (PO₄-P)', loinc: '14879-1', unit: 'mg/L', threshold: '≤ 0.2' },
    ]},
    { group: 'Microbiological Parameters', tests: [
      { id: 't-012', name: 'Total Coliform', loinc: '5794-0', unit: 'MPN/100mL', threshold: '≤ 5000' },
      { id: 't-013', name: 'Fecal Coliform (E. coli)', loinc: '5799-9', unit: 'MPN/100mL', threshold: '≤ 1000' },
    ]},
    { group: 'Heavy Metals', tests: [
      { id: 't-014', name: 'Lead (Pb)', loinc: '5671-0', unit: 'mg/L', threshold: '≤ 0.03' },
      { id: 't-015', name: 'Mercury (Hg)', loinc: '5688-4', unit: 'mg/L', threshold: '≤ 0.001' },
      { id: 't-016', name: 'Cadmium (Cd)', loinc: '5614-0', unit: 'mg/L', threshold: '≤ 0.01' },
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

// ─── Main Component ──────────────────────────────────────────────────

export default function EnvironmentalOrderEntry() {
  // Step navigation
  const [currentStep, setCurrentStep] = useState(0);

  // Site selection state
  const [selectedSite, setSelectedSite] = useState(MOCK_SITE);

  // Compliance standard state
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [showThresholds, setShowThresholds] = useState(false);

  // Sample type selection state (ENV-2-001 — sample type checklist)
  const [selectedSampleTypes, setSelectedSampleTypes] = useState(new Set());
  const [overrideSampleTypes, setOverrideSampleTypes] = useState(new Set()); // IDs added via override
  const [showSampleTypeOverride, setShowSampleTypeOverride] = useState(false);

  // Suggested tests state
  const [suggestedTests, setSuggestedTests] = useState([]);
  const [deselectedTests, setDeselectedTests] = useState(new Set());

  // Collection conditions
  const [collectionMethod, setCollectionMethod] = useState('');
  const [waterTemp, setWaterTemp] = useState('');
  const [ambientTemp, setAmbientTemp] = useState('');
  const [weather, setWeather] = useState('');
  const [preservation, setPreservation] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');

  // Regulatory reference
  const [regulatoryRef, setRegulatoryRef] = useState('');
  const [regRefOverride, setRegRefOverride] = useState(false);

  // Handle standard selection — resets sample types, tests wait for sample selection
  const handleStandardSelect = useCallback((item) => {
    if (!item || !item.selectedItem) {
      setSelectedStandard(null);
      setSelectedSampleTypes(new Set());
      setOverrideSampleTypes(new Set());
      setSuggestedTests([]);
      setRegulatoryRef('');
      setRegRefOverride(false);
      return;
    }
    const std = item.selectedItem;
    setSelectedStandard(std);
    setSelectedSampleTypes(new Set()); // reset — user must pick samples they have
    setOverrideSampleTypes(new Set());
    setSuggestedTests([]); // tests wait for sample type selection
    setDeselectedTests(new Set());
    if (!regRefOverride) {
      setRegulatoryRef(`${std.regulationNumber} — ${std.name}`);
    }
  }, [regRefOverride]);

  // Toggle sample type checkbox
  const toggleSampleType = useCallback((sampleTypeId) => {
    setSelectedSampleTypes(prev => {
      const next = new Set(prev);
      if (next.has(sampleTypeId)) next.delete(sampleTypeId);
      else next.add(sampleTypeId);
      return next;
    });
  }, []);

  // Add override sample type (from "Add Other Sample Type" ComboBox)
  const addOverrideSampleType = useCallback((item) => {
    if (!item || !item.selectedItem) return;
    const st = item.selectedItem;
    setSelectedSampleTypes(prev => new Set([...prev, st.id]));
    setOverrideSampleTypes(prev => new Set([...prev, st.id]));
    setShowSampleTypeOverride(false);
  }, []);

  // Trigger test suggestion when sample types change
  const handleSuggestTests = useCallback(() => {
    if (selectedStandard && selectedSampleTypes.size > 0) {
      // In real impl, API filters by standard + sample types
      // Mock: show all tests for the standard (filtered would happen server-side)
      setSuggestedTests(MOCK_SUGGESTED_TESTS[selectedStandard.id] || []);
      setDeselectedTests(new Set());
    } else {
      setSuggestedTests([]);
    }
  }, [selectedStandard, selectedSampleTypes]);

  // Derived: sample types from the standard's applicableSampleTypes
  const standardSampleTypes = useMemo(() => {
    if (!selectedStandard) return [];
    return ALL_SAMPLE_TYPES.filter(st => selectedStandard.applicableSampleTypes.includes(st.id));
  }, [selectedStandard]);

  // Derived: override sample types not already in standard
  const overrideSampleTypeObjects = useMemo(() => {
    return ALL_SAMPLE_TYPES.filter(st => overrideSampleTypes.has(st.id) && !selectedStandard?.applicableSampleTypes.includes(st.id));
  }, [overrideSampleTypes, selectedStandard]);

  // Available sample types for override ComboBox (exclude already selected)
  const availableOverrideTypes = useMemo(() => {
    const allShown = new Set([...(selectedStandard?.applicableSampleTypes || []), ...overrideSampleTypes]);
    return ALL_SAMPLE_TYPES.filter(st => !allShown.has(st.id));
  }, [selectedStandard, overrideSampleTypes]);

  // Toggle test selection
  const toggleTest = useCallback((testId) => {
    setDeselectedTests(prev => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  }, []);

  // Count selected tests
  const selectedTestCount = useMemo(() => {
    let total = 0;
    suggestedTests.forEach(g => {
      g.tests.forEach(t => {
        if (!deselectedTests.has(t.id)) total++;
      });
    });
    return total;
  }, [suggestedTests, deselectedTests]);

  const totalTestCount = useMemo(() => {
    return suggestedTests.reduce((sum, g) => sum + g.tests.length, 0);
  }, [suggestedTests]);

  return (
    <div>
      {/* ── Progress Indicator ─────────────────────────────────── */}
      <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <ProgressIndicator currentIndex={currentStep} spaceEqually>
          <ProgressStep
            label={t('nav.step.enterOrder', 'Enter Order')}
            description={t('nav.step.enterOrder.desc', 'Patient/site, tests, standard')}
            current={currentStep === 0}
            complete={currentStep > 0}
          />
          <ProgressStep
            label={t('nav.step.collectSample', 'Collect Sample')}
            description={t('nav.step.collectSample.desc', 'Sample type, conditions')}
            current={currentStep === 1}
            complete={currentStep > 1}
          />
          <ProgressStep
            label={t('nav.step.labelStore', 'Label & Store')}
            description={t('nav.step.labelStore.desc', 'Lab number, barcodes')}
            current={currentStep === 2}
            complete={currentStep > 2}
          />
          <ProgressStep
            label={t('nav.step.qaReview', 'QA Review')}
            description={t('nav.step.qaReview.desc', 'Completeness, approval')}
            current={currentStep === 3}
            complete={false}
          />
        </ProgressIndicator>
      </Tile>

      {/* ── Step 1: Enter Order (Environmental) ────────────────── */}
      {currentStep === 0 && (
        <Stack gap={5}>
          {/* Lab Number */}
          <Tile>
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
              <Column lg={4} md={4} sm={4}>
                <Tag type="purple" size="md">{t('label.order.workflow', 'Environmental')}</Tag>
              </Column>
            </Grid>
          </Tile>

          {/* ── Section: Selected Sampling Site (from S-02) ──── */}
          <Tile>
            <h4 style={{ marginBottom: 'var(--cds-spacing-05)' }}>
              {t('heading.envOrder.samplingSite', 'Sampling Site')}
            </h4>
            {selectedSite ? (
              <Tile style={{ borderLeft: '3px solid var(--cds-support-success)', padding: 'var(--cds-spacing-05)' }}>
                <Grid>
                  <Column lg={6} md={4} sm={4}>
                    <p style={{ fontWeight: 600 }}>{selectedSite.code} — {selectedSite.name}</p>
                    <Tag type="teal" size="sm">{selectedSite.type}</Tag>
                    {selectedSite.subtype && <Tag type="gray" size="sm" style={{ marginLeft: 'var(--cds-spacing-02)' }}>{selectedSite.subtype}</Tag>}
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
                  <Button kind="ghost" size="sm" renderIcon={Pencil}>{t('button.site.change', 'Change Site')}</Button>
                  <Button kind="ghost" size="sm" renderIcon={X}>{t('button.site.clear', 'Clear')}</Button>
                </Stack>
              </Tile>
            ) : (
              <Button kind="tertiary" renderIcon={Search}>{t('button.site.search', 'Search for Site')}</Button>
            )}
          </Tile>

          {/* ── Section: Compliance Standard (ENV-1-001) ──────── */}
          <Tile>
            <h4 style={{ marginBottom: 'var(--cds-spacing-05)' }}>
              {t('heading.envOrder.complianceStandard', 'Compliance Standard')}
            </h4>

            <ComboBox
              id="compliance-standard"
              items={MOCK_STANDARDS}
              itemToString={(item) => item ? `${item.name} (${item.regulationNumber})` : ''}
              titleText={t('label.envOrder.standard', 'Compliance Standard')}
              placeholder={t('placeholder.envOrder.standard.search', 'Search standards by name or regulation number...')}
              onChange={handleStandardSelect}
              helperText={t('label.envOrder.standard.helper', 'Select the regulatory standard for this order')}
            />

            {selectedStandard && (
              <Tile style={{ borderLeft: '3px solid var(--cds-link-primary)', padding: 'var(--cds-spacing-05)', marginTop: 'var(--cds-spacing-05)' }}>
                <Grid>
                  <Column lg={6} md={4} sm={4}>
                    <p style={{ fontWeight: 600 }}>{selectedStandard.name}</p>
                    <Tag type="green" size="sm">{selectedStandard.status}</Tag>
                  </Column>
                  <Column lg={3} md={2} sm={2}>
                    <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.envOrder.standard.issuingBody', 'Issuing Body')}</p>
                    <p>{selectedStandard.issuingBody}</p>
                  </Column>
                  <Column lg={3} md={2} sm={2}>
                    <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.envOrder.standard.regulationNumber', 'Regulation Number')}</p>
                    <p>{selectedStandard.regulationNumber}</p>
                  </Column>
                  <Column lg={3} md={2} sm={2}>
                    <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.envOrder.standard.version', 'Version')}</p>
                    <p>{selectedStandard.version}</p>
                  </Column>
                  <Column lg={3} md={2} sm={2}>
                    <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.envOrder.standard.effectiveDate', 'Effective Date')}</p>
                    <p>{selectedStandard.effectiveDate}</p>
                  </Column>
                  <Column lg={3} md={2} sm={2}>
                    <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.envOrder.standard.linkedTests', 'Linked Tests')}</p>
                    <p>{selectedStandard.linkedTests}</p>
                  </Column>
                </Grid>
                <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-04)' }}>
                  <Button kind="ghost" size="sm" renderIcon={Eye}
                    onClick={() => setShowThresholds(!showThresholds)}>
                    {showThresholds
                      ? t('button.envOrder.hideThresholds', 'Hide Thresholds')
                      : t('button.envOrder.viewThresholds', 'View Thresholds')}
                  </Button>
                </Stack>

                {/* Thresholds Accordion */}
                {showThresholds && suggestedTests.length > 0 && (
                  <Accordion style={{ marginTop: 'var(--cds-spacing-05)' }}>
                    {suggestedTests.map((group) => (
                      <AccordionItem key={group.group} title={`${group.group} (${group.tests.length} ${t('label.tests', 'tests')})`}>
                        <Table size="sm">
                          <TableHead>
                            <TableRow>
                              <TableHeader>{t('label.test.name', 'Test')}</TableHeader>
                              <TableHeader>{t('label.test.loinc', 'LOINC')}</TableHeader>
                              <TableHeader>{t('label.test.unit', 'Unit')}</TableHeader>
                              <TableHeader>{t('label.test.threshold', 'Threshold')}</TableHeader>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {group.tests.map((test) => (
                              <TableRow key={test.id}>
                                <TableCell>{test.name}</TableCell>
                                <TableCell><code>{test.loinc}</code></TableCell>
                                <TableCell>{test.unit}</TableCell>
                                <TableCell><strong>{test.threshold}</strong></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </Tile>
            )}
          </Tile>

          {/* ── Section: Sample Type Selection (ENV-2-001) ─────── */}
          {selectedStandard && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-03)' }}>
                {t('heading.envOrder.selectSamples', 'Select Available Samples')}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-05)' }}>
                {t('label.envOrder.selectSamples.helper', 'Check the sample types you have collected for this order. Tests will be suggested based on your selections.')}
              </p>

              {/* Checkboxes from standard's applicableSampleTypes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--cds-spacing-03)', marginBottom: 'var(--cds-spacing-04)' }}>
                {standardSampleTypes.map(st => (
                  <Checkbox
                    key={st.id}
                    id={`sample-type-${st.id}`}
                    labelText={<span>{st.name} <span style={{ fontSize: '11px', color: 'var(--cds-text-secondary)' }}>({st.code})</span></span>}
                    checked={selectedSampleTypes.has(st.id)}
                    onChange={() => toggleSampleType(st.id)}
                  />
                ))}

                {/* Override sample types (not in standard) */}
                {overrideSampleTypeObjects.map(st => (
                  <Checkbox
                    key={st.id}
                    id={`sample-type-override-${st.id}`}
                    labelText={
                      <span>
                        {st.name} <span style={{ fontSize: '11px', color: 'var(--cds-text-secondary)' }}>({st.code})</span>
                        <Tag type="purple" size="sm" style={{ marginLeft: 'var(--cds-spacing-02)' }}>
                          {t('tag.envOrder.notInStandard', 'Not in Standard')}
                        </Tag>
                      </span>
                    }
                    checked={selectedSampleTypes.has(st.id)}
                    onChange={() => toggleSampleType(st.id)}
                  />
                ))}
              </div>

              {/* Add Other Sample Type button + ComboBox */}
              {showSampleTypeOverride ? (
                <div style={{ maxWidth: '400px', marginBottom: 'var(--cds-spacing-04)' }}>
                  <ComboBox
                    id="override-sample-type"
                    items={availableOverrideTypes}
                    itemToString={(item) => item ? `${item.name} (${item.code})` : ''}
                    titleText={t('label.envOrder.addOtherSampleType', 'Add Other Sample Type')}
                    placeholder="Search all sample types..."
                    onChange={addOverrideSampleType}
                  />
                  <Button kind="ghost" size="sm" onClick={() => setShowSampleTypeOverride(false)} style={{ marginTop: 'var(--cds-spacing-02)' }}>
                    {t('button.cancel', 'Cancel')}
                  </Button>
                </div>
              ) : (
                <Button kind="ghost" size="sm" renderIcon={Plus} onClick={() => setShowSampleTypeOverride(true)}>
                  {t('button.envOrder.addOtherSampleType', 'Add Other Sample Type')}
                </Button>
              )}

              <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)', marginTop: 'var(--cds-spacing-03)' }}>
                {selectedSampleTypes.size} {t('label.envOrder.sampleTypesSelected', 'sample types selected')}
              </p>

              {/* Suggest Tests button — triggers when sample types are selected */}
              {selectedSampleTypes.size > 0 && suggestedTests.length === 0 && (
                <Button kind="primary" size="sm" renderIcon={Search}
                  onClick={handleSuggestTests}
                  style={{ marginTop: 'var(--cds-spacing-04)' }}>
                  {t('button.envOrder.suggestTests', 'Suggest Tests for Selected Samples')}
                </Button>
              )}
            </Tile>
          )}

          {/* ── Section: Suggested Test Panel (ENV-2-001) ─────── */}
          {selectedStandard && suggestedTests.length > 0 && (
            <Tile>
              <h4 style={{ marginBottom: 'var(--cds-spacing-05)' }}>
                {t('heading.envOrder.suggestedTests', 'Suggested Tests')}
              </h4>

              <InlineNotification
                kind="info"
                title={t('message.envOrder.testsSuggested', `Based on ${selectedStandard.name} and ${selectedSampleTypes.size} selected sample types, ${totalTestCount} tests have been suggested.`)}
                subtitle={t('message.envOrder.testsSuggested.sub', 'You can add or remove tests below.')}
                lowContrast
                hideCloseButton
              />

              <div style={{ marginTop: 'var(--cds-spacing-05)' }}>
                <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-03)' }}>
                  {selectedTestCount} {t('label.of', 'of')} {totalTestCount} {t('label.testsSelected', 'tests selected')}
                </p>

                <Accordion>
                  {suggestedTests.map((group) => {
                    const groupSelected = group.tests.filter(t => !deselectedTests.has(t.id)).length;
                    return (
                      <AccordionItem
                        key={group.group}
                        title={`${group.group} — ${groupSelected}/${group.tests.length} ${t('label.selected', 'selected')}`}
                        open
                      >
                        {group.tests.map((test) => (
                          <div key={test.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: 'var(--cds-spacing-03) 0', borderBottom: '1px solid var(--cds-border-subtle)',
                          }}>
                            <Checkbox
                              id={`test-${test.id}`}
                              labelText={
                                <span>
                                  {test.name}
                                  <Tag type="blue" size="sm" style={{ marginLeft: 'var(--cds-spacing-03)' }}>
                                    {t('label.suggested', 'Suggested')}
                                  </Tag>
                                </span>
                              }
                              checked={!deselectedTests.has(test.id)}
                              onChange={() => toggleTest(test.id)}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>
                              {test.threshold} {test.unit}
                            </span>
                          </div>
                        ))}
                      </AccordionItem>
                    );
                  })}
                </Accordion>

                <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
                  <Button kind="tertiary" size="sm" renderIcon={Plus}>
                    {t('button.envOrder.addTest', 'Add Test Manually')}
                  </Button>
                </Stack>
              </div>
            </Tile>
          )}

          {/* ── Section: Collection Conditions (ENV-3-001) ────── */}
          <Tile>
            <h4 style={{ marginBottom: 'var(--cds-spacing-05)' }}>
              {t('heading.envOrder.collectionConditions', 'Collection Conditions')}
            </h4>

            <Grid>
              <Column lg={4} md={4} sm={4}>
                <Select
                  id="collection-method"
                  labelText={t('label.envOrder.collectionMethod', 'Collection Method') + ' *'}
                  value={collectionMethod}
                  onChange={(e) => setCollectionMethod(e.target.value)}
                >
                  <SelectItem value="" text={t('placeholder.envOrder.collectionMethod', 'Select collection method...')} />
                  {COLLECTION_METHODS.map(m => (
                    <SelectItem key={m} value={m} text={m} />
                  ))}
                </Select>
              </Column>
              <Column lg={4} md={4} sm={4}>
                <NumberInput
                  id="water-temp"
                  label={t('label.envOrder.waterTemperature', 'Water Temperature (°C)')}
                  value={waterTemp}
                  onChange={(e, { value }) => setWaterTemp(value)}
                  min={-50} max={100} step={0.1}
                  helperText={t('label.envOrder.waterTemp.helper', 'Measured at collection point')}
                />
              </Column>
              <Column lg={4} md={4} sm={4}>
                <NumberInput
                  id="ambient-temp"
                  label={t('label.envOrder.ambientTemperature', 'Ambient Temperature (°C)')}
                  value={ambientTemp}
                  onChange={(e, { value }) => setAmbientTemp(value)}
                  min={-50} max={100} step={0.1}
                />
              </Column>
              <Column lg={4} md={4} sm={4}>
                <Select
                  id="weather"
                  labelText={t('label.envOrder.weatherConditions', 'Weather Conditions')}
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                >
                  <SelectItem value="" text={t('placeholder.envOrder.weatherConditions', 'Select weather conditions...')} />
                  {WEATHER_OPTIONS.map(w => (
                    <SelectItem key={w} value={w} text={w} />
                  ))}
                </Select>
              </Column>
              <Column lg={4} md={4} sm={4}>
                <TextInput
                  id="preservation"
                  labelText={t('label.envOrder.preservationMethod', 'Preservation Method')}
                  value={preservation}
                  onChange={(e) => setPreservation(e.target.value)}
                  placeholder={t('placeholder.envOrder.preservationMethod', 'e.g., HNO3 acidification, 4°C cooler')}
                />
              </Column>
              <Column lg={4} md={4} sm={4}>
                {/* Regulatory Reference (ENV-4-001) */}
                <div style={{ position: 'relative' }}>
                  <TextInput
                    id="regulatory-ref"
                    labelText={
                      <span>
                        {t('label.envOrder.regulatoryReference', 'Regulatory Reference')}
                        {!regRefOverride && selectedStandard && (
                          <span style={{ marginLeft: 'var(--cds-spacing-03)', fontSize: '11px', color: 'var(--cds-text-secondary)', fontStyle: 'italic' }}>
                            🔒 {t('label.envOrder.regulatoryReference.autoPopulated', 'Auto-populated from standard')}
                          </span>
                        )}
                      </span>
                    }
                    value={regulatoryRef}
                    onChange={(e) => setRegulatoryRef(e.target.value)}
                    readOnly={!regRefOverride && !!selectedStandard}
                    placeholder={t('placeholder.envOrder.regulatoryReference', 'Enter regulatory reference...')}
                  />
                  {!regRefOverride && selectedStandard && (
                    <Button kind="ghost" size="sm"
                      onClick={() => { setRegRefOverride(true); setRegulatoryRef(''); }}
                      style={{ position: 'absolute', right: 0, top: 0 }}>
                      {t('button.envOrder.overrideReference', 'Override')}
                    </Button>
                  )}
                </div>
              </Column>
              <Column lg={8} md={8} sm={4}>
                <TextArea
                  id="field-notes"
                  labelText={t('label.envOrder.fieldNotes', 'Field Notes')}
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  placeholder={t('placeholder.envOrder.fieldNotes', 'Enter field observations...')}
                  maxCount={1000}
                  rows={3}
                />
              </Column>
            </Grid>
          </Tile>

          {/* ── Action Bar ─────────────────────────────────────── */}
          <Stack orientation="horizontal" gap={4} style={{ justifyContent: 'flex-end' }}>
            <Button kind="secondary" size="lg">{t('button.order.saveDraft', 'Save Draft')}</Button>
            <Button kind="primary" size="lg" renderIcon={Save}
              onClick={() => setCurrentStep(1)}>
              {t('button.order.saveAndNext', 'Save & Next')}
            </Button>
          </Stack>
        </Stack>
      )}

      {/* ── Steps 2–4: Order Context Card with Standard ────────── */}
      {currentStep > 0 && (
        <Stack gap={5}>
          {/* Order Context Card (ENV-6-001) */}
          <Tile>
            <Grid>
              <Column lg={3} md={2} sm={2}>
                <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.order.labNumber', 'Lab Number')}</p>
                <p style={{ fontWeight: 600, fontSize: '16px' }}>ENV-2026-0412</p>
              </Column>
              <Column lg={3} md={2} sm={2}>
                <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.order.site', 'Site')}</p>
                <p>{selectedSite?.code} — {selectedSite?.name}</p>
              </Column>
              <Column lg={4} md={3} sm={2}>
                <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.envOrder.standard', 'Compliance Standard')}</p>
                {selectedStandard ? (
                  <Stack orientation="horizontal" gap={2}>
                    <p>{selectedStandard.regulationNumber}</p>
                    <Tag type="green" size="sm">{selectedStandard.status}</Tag>
                  </Stack>
                ) : (
                  <p style={{ color: 'var(--cds-text-secondary)' }}>—</p>
                )}
              </Column>
              <Column lg={2} md={1} sm={2}>
                <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.order.tests', 'Tests')}</p>
                <p>{selectedTestCount}</p>
              </Column>
              <Column lg={4} md={2} sm={2}>
                <p style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{t('label.order.status', 'Status')}</p>
                <Tag type="blue">{currentStep === 1 ? t('label.status.collecting', 'Collecting')
                  : currentStep === 2 ? t('label.status.labeling', 'Labeling')
                  : t('label.status.qaReview', 'QA Review')}</Tag>
              </Column>
            </Grid>
            {selectedStandard && (
              <Button kind="ghost" size="sm" renderIcon={Eye}
                style={{ marginTop: 'var(--cds-spacing-03)' }}>
                {t('button.envOrder.viewThresholds', 'View Thresholds')}
              </Button>
            )}
          </Tile>

          {/* Step content placeholder */}
          <Tile>
            <h4>
              {currentStep === 1 && t('heading.step.collectSample', 'Step 2 — Collect Sample')}
              {currentStep === 2 && t('heading.step.labelStore', 'Step 3 — Label & Store')}
              {currentStep === 3 && t('heading.step.qaReview', 'Step 4 — QA Review')}
            </h4>
            <p style={{ color: 'var(--cds-text-secondary)', marginTop: 'var(--cds-spacing-03)' }}>
              {t('label.step.placeholder', 'Step content — see Sample Collection Redesign FRS for full step specification. The Order Context Card above persists the compliance standard on all steps.')}
            </p>

            {/* QA Environmental Completeness (ENV-8-001) — shown on Step 4 */}
            {currentStep === 3 && (
              <div style={{ marginTop: 'var(--cds-spacing-06)' }}>
                <h5 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                  {t('heading.envOrder.environmentalChecks', 'Environmental Completeness')}
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--cds-spacing-04)' }}>
                  {/* Complete checks */}
                  <Tile style={{ borderLeft: '3px solid var(--cds-support-success)' }}>
                    <Tag type="green" size="sm">{t('label.complete', 'Complete')}</Tag>
                    <p style={{ fontWeight: 500, marginTop: 'var(--cds-spacing-02)' }}>{t('label.envOrder.qaCheck.siteLinked', 'Sampling Site')}</p>
                    <p style={{ fontSize: '13px' }}>{selectedSite?.code} — {selectedSite?.name}</p>
                  </Tile>
                  <Tile style={{ borderLeft: '3px solid var(--cds-support-success)' }}>
                    <Tag type="green" size="sm">{t('label.complete', 'Complete')}</Tag>
                    <p style={{ fontWeight: 500, marginTop: 'var(--cds-spacing-02)' }}>{t('label.envOrder.qaCheck.standardSelected', 'Compliance Standard')}</p>
                    <p style={{ fontSize: '13px' }}>{selectedStandard?.regulationNumber}</p>
                  </Tile>
                  <Tile style={{ borderLeft: '3px solid var(--cds-support-success)' }}>
                    <Tag type="green" size="sm">{t('label.complete', 'Complete')}</Tag>
                    <p style={{ fontWeight: 500, marginTop: 'var(--cds-spacing-02)' }}>{t('label.envOrder.qaCheck.methodSpecified', 'Collection Method')}</p>
                    <p style={{ fontSize: '13px' }}>{collectionMethod || 'Manual Grab'}</p>
                  </Tile>
                  {/* Incomplete check example */}
                  <Tile style={{ borderLeft: '3px solid var(--cds-support-warning)' }}>
                    <Tag type="warm-gray" size="sm">{t('label.incomplete', 'Incomplete')}</Tag>
                    <p style={{ fontWeight: 500, marginTop: 'var(--cds-spacing-02)' }}>{t('label.envOrder.qaCheck.gpsRecorded', 'GPS Coordinates')}</p>
                    <p style={{ fontSize: '13px', color: 'var(--cds-support-warning)' }}>{t('message.envOrder.gpsNotRecorded', 'GPS not recorded')}</p>
                    <Button kind="ghost" size="sm" style={{ marginTop: 'var(--cds-spacing-02)' }}>
                      {t('button.qa.goToStep', 'Go to Step 2')}
                    </Button>
                  </Tile>
                </div>
              </div>
            )}
          </Tile>

          {/* Step navigation */}
          <Stack orientation="horizontal" gap={4} style={{ justifyContent: 'space-between' }}>
            <Button kind="secondary" size="lg"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>
              {t('button.order.previous', '← Previous')}
            </Button>
            {currentStep < 3 ? (
              <Button kind="primary" size="lg"
                onClick={() => setCurrentStep(currentStep + 1)}>
                {t('button.order.saveAndNext', 'Save & Next →')}
              </Button>
            ) : (
              <Stack orientation="horizontal" gap={3}>
                <Button kind="danger" size="lg">{t('button.qa.reject', 'Return to Step')}</Button>
                <Button kind="primary" size="lg">{t('button.qa.approve', 'Approve for Testing')}</Button>
              </Stack>
            )}
          </Stack>
        </Stack>
      )}
    </div>
  );
}
