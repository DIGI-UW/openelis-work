/**
 * V-02 Vector Collection Workflow — React Mockup (v2.4)
 * Spec: vector-collection-workflow.md (v2.4)
 * Jira: OGC-581 (Epic: OGC-527)
 *
 * v2.4 changes (vector expert validation pass, April 2026):
 *  - Reactivated Trap Type / Collection Method ComboBox in Step 1 (Aedes co-primary
 *    surveillance need; previously deferred per V-04 §17.2). Dictionary covers both
 *    passive traps and active collection methods.
 *  - Added Lifecycle Stage Select in Step 1 (egg / larva / pupa / adult / unknown).
 *  - Added Collection Context optional accordion (collapsed by default) with time of day,
 *    resting context, human-biting catch toggle, and free-text notes.
 *  - 5 new optional fields on the Sample entity (lifecycle_stage, trap_type_id,
 *    collection_time_of_day, resting_context, human_biting_catch, collection_context_notes).
 */

import React, { useState, useCallback } from 'react';
import {
  Grid, Column, Stack,
  TextInput, Select, SelectItem, NumberInput, ComboBox, Toggle, TextArea,
  Button, Tag, InlineNotification, DataTable, TableContainer,
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableSelectRow, TableSelectAll, TableBatchActions, TableBatchAction,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  Tile, ProgressIndicator, ProgressStep, Accordion, AccordionItem,
  FormGroup, FormLabel,
} from '@carbon/react';
import { Add, TrashCan, Checkmark, ArrowRight } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ── Sample data ──────────────────────────────────────────────────────────────
const ORGANISM_GROUPS = [
  { id: 'anopheles', label: 'Mosquito (Anopheles)' },
  { id: 'aedes',     label: 'Mosquito (Aedes)' },
  { id: 'culex',     label: 'Mosquito (Culex)' },
  { id: 'tick',      label: 'Tick' },
  { id: 'rodent',    label: 'Rodent' },
];

const SAMPLING_SITES = [
  { id: 'bpp01', label: 'BPP-01 — Cilincing North' },
  { id: 'bpp02', label: 'BPP-02 — Penjaringan East' },
  { id: 'bpp03', label: 'BPP-03 — Tanjung Priok' },
];

// v2.4 — VECTOR_TRAP_TYPE Dictionary seed (V-03 Appendix A.7.10)
// Includes both passive traps and active collection methods per the vector expert's confirmation.
const TRAP_TYPES = [
  { id: 'BG_SENTINEL',    label: 'BG-Sentinel trap',           category: 'Passive trap' },
  { id: 'CDC_LIGHT_TRAP', label: 'CDC light trap',             category: 'Passive trap' },
  { id: 'GRAVID_TRAP',    label: 'Gravid trap',                category: 'Passive trap' },
  { id: 'OVITRAP',        label: 'Ovitrap',                    category: 'Passive trap' },
  { id: 'HUMAN_LANDING',  label: 'Human-landing collection',   category: 'Active collection' },
  { id: 'ASPIRATOR',      label: 'Aspirator',                  category: 'Active collection' },
  { id: 'SWEEP_NET',      label: 'Sweep net',                  category: 'Active collection' },
  { id: 'OTHER',          label: 'Other (specify in notes)',   category: 'Other' },
];

const AVAILABLE_TESTS = [
  { id: 'dengue-panel', name: 'Dengue Surveillance Panel', type: 'Panel', method: 'ELISA / PCR', defaultSelected: true },
  { id: 'pf-pcr',      name: 'Plasmodium falciparum PCR', type: 'Test',  method: 'RT-PCR',     defaultSelected: true },
  { id: 'chik-pcr',    name: 'Chikungunya RT-PCR',       type: 'Test',  method: 'RT-PCR',     defaultSelected: false },
  { id: 'zika-pcr',    name: 'Zika Virus RT-PCR',        type: 'Test',  method: 'RT-PCR',     defaultSelected: false },
];

const QA_TYPES = ['Positive Control', 'Negative Control', 'Blank', 'Duplicate', 'Spike'];

// ── Step 1: Enter Order ───────────────────────────────────────────────────────
function Step1EnterOrder({ onNext }) {
  const [organismGroup, setOrganismGroup] = useState(ORGANISM_GROUPS[0]);
  const [quantity, setQuantity]           = useState(25);
  const [samplingSite, setSamplingSite]   = useState(SAMPLING_SITES[0]);
  const [requester, setRequester]         = useState('SILNAS Indonesia — Malaria Programme');
  // v2.4 new state — lifecycle, trap type, collection context
  const [lifecycleStage, setLifecycleStage]                 = useState('ADULT');
  const [trapType, setTrapType]                             = useState(TRAP_TYPES[1]); // CDC light trap default
  const [collectionTimeOfDay, setCollectionTimeOfDay]       = useState('UNKNOWN');
  const [restingContext, setRestingContext]                 = useState('UNKNOWN');
  const [humanBitingCatch, setHumanBitingCatch]             = useState(false);
  const [collectionContextNotes, setCollectionContextNotes] = useState('');
  const [selectedTests, setSelectedTests] = useState(
    new Set(AVAILABLE_TESTS.filter(t => t.defaultSelected).map(t => t.id))
  );
  const [testSearch, setTestSearch] = useState('');
  const [error, setError] = useState('');

  const toggleTest = useCallback((id) => {
    setSelectedTests(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked) => {
    setSelectedTests(checked ? new Set(AVAILABLE_TESTS.map(t => t.id)) : new Set());
  }, []);

  const filteredTests = AVAILABLE_TESTS.filter(t =>
    t.name.toLowerCase().includes(testSearch.toLowerCase())
  );

  const handleNext = () => {
    if (!organismGroup) { setError(t('error.vectorOrder.organismGroupRequired', 'Organism group is required.')); return; }
    if (!quantity || quantity < 1) { setError(t('error.vectorOrder.quantityMin', 'Quantity must be at least 1.')); return; }
    if (selectedTests.size === 0) { setError(t('error.vectorOrder.testRequired', 'Select at least one test or panel.')); return; }
    setError('');
    onNext({ organismGroup, quantity, samplingSite, requester, selectedTests });
  };

  const testHeaders = [
    { key: 'select', header: '' },
    { key: 'name',   header: t('label.test.name', 'Test / Panel') },
    { key: 'type',   header: t('label.test.type', 'Type') },
    { key: 'method', header: t('label.test.method', 'Method') },
  ];

  return (
    <Stack gap={6}>
      {/* Domain toggle — Vector pre-selected */}
      <Tile>
        <div style={{ marginBottom: '0.5rem' }}>
          <FormLabel>{t('label.sampleCategory', 'Sample Category')}</FormLabel>
          <p style={{ fontSize: '0.8rem', color: '#525252', margin: '0.25rem 0 0.75rem' }}>
            {t('helperText.labUnit.preselected', 'Lab unit: Vector Surveillance Lab — Vector domain pre-selected.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 0, border: '1px solid #e0e0e0', overflow: 'hidden', width: 'fit-content' }}>
          {['Clinical', 'Environmental / Other', 'Vector'].map((label, i) => (
            <button key={label} style={{
              padding: '0.5rem 1.25rem', fontSize: '0.82rem', fontWeight: 500,
              background: i === 2 ? '#0f62fe' : '#f4f4f4',
              color: i === 2 ? '#fff' : '#525252',
              border: 'none', borderRight: i < 2 ? '1px solid #e0e0e0' : 'none',
              cursor: i === 2 ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>{label}</button>
          ))}
        </div>
      </Tile>

      {/* Specimen details */}
      <Tile>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tag kind="green">{t('label.domain.vector', 'Vector')}</Tag>
          {t('heading.vectorOrder.specimenDetails', 'Specimen Details')}
        </h4>
        <Grid>
          <Column lg={6} md={4}>
            <ComboBox
              id="organism-group"
              titleText={<>{t('label.vectorOrder.organismGroup', 'Organism Group')} <span style={{ color: '#da1e28' }}>*</span></>}
              helperText={t('helperText.vectorOrder.organismGroup', 'The vector "sample type" — e.g., Mosquito, Tick, Rodent.')}
              placeholder={t('placeholder.vectorOrder.organismGroup', 'Search organism groups…')}
              items={ORGANISM_GROUPS}
              itemToString={item => item?.label ?? ''}
              selectedItem={organismGroup}
              onChange={({ selectedItem }) => setOrganismGroup(selectedItem)}
            />
          </Column>
          {/* v2.4: Lifecycle Stage Select — pools are stage-pure at intake */}
          <Column lg={4} md={4}>
            <Select
              id="lifecycle-stage"
              labelText={t('label.vectorOrder.lifecycleStage', 'Lifecycle Stage')}
              helperText={t('helperText.vectorOrder.lifecycleStage', 'Egg / larva / pupa / adult; pools are typically stage-pure.')}
              defaultValue={lifecycleStage || 'UNKNOWN'}
              onChange={e => setLifecycleStage(e.target.value)}
            >
              <SelectItem value="UNKNOWN" text={t('label.vectorOrder.lifecycleStage.unknown', 'Unknown / not assessed')} />
              <SelectItem value="EGG"     text={t('label.vectorOrder.lifecycleStage.egg', 'Egg')} />
              <SelectItem value="LARVA"   text={t('label.vectorOrder.lifecycleStage.larva', 'Larva')} />
              <SelectItem value="PUPA"    text={t('label.vectorOrder.lifecycleStage.pupa', 'Pupa')} />
              <SelectItem value="ADULT"   text={t('label.vectorOrder.lifecycleStage.adult', 'Adult')} />
            </Select>
          </Column>
          <Column lg={2} md={4}>
            <NumberInput
              id="quantity"
              label={<>{t('label.vectorOrder.quantity', 'Quantity (organisms)')} <span style={{ color: '#da1e28' }}>*</span></>}
              helperText={t('helperText.vectorOrder.quantity', 'Total organisms received.')}
              min={1}
              value={quantity}
              onChange={(e, { value }) => setQuantity(value)}
            />
          </Column>
          {/* v2.4: Trap Type / Collection Method ComboBox — reactivated from V-04 §17.2 */}
          <Column lg={8} md={4}>
            <ComboBox
              id="trap-type"
              titleText={t('label.vectorOrder.trapType', 'Trap Type / Collection Method')}
              helperText={t('helperText.vectorOrder.trapType', 'Includes passive traps (BG-Sentinel, CDC light trap, gravid trap, ovitrap) and active collection methods (human-landing, aspirator, sweep net).')}
              placeholder={t('placeholder.vectorOrder.trapType', 'Search trap types…')}
              items={TRAP_TYPES}
              itemToString={item => item?.label ?? ''}
              selectedItem={trapType}
              onChange={({ selectedItem }) => setTrapType(selectedItem)}
            />
          </Column>
          <Column lg={8} md={4}>
            <ComboBox
              id="sampling-site"
              titleText={t('label.vectorOrder.samplingSite', 'Sampling Site')}
              helperText={t('helperText.vectorOrder.samplingSite', 'Optional — records the collection site for traceability.')}
              placeholder={t('placeholder.vectorOrder.samplingSite', 'Search sampling sites…')}
              items={SAMPLING_SITES}
              itemToString={item => item?.label ?? ''}
              selectedItem={samplingSite}
              onChange={({ selectedItem }) => setSamplingSite(selectedItem)}
            />
          </Column>
          <Column lg={16} md={8}>
            <TextInput
              id="requester"
              labelText={t('label.vectorOrder.requester', 'Requester / Organisation')}
              value={requester}
              onChange={e => setRequester(e.target.value)}
            />
          </Column>
        </Grid>

        {/* v2.4: Collection Context optional accordion (collapsed by default) */}
        <Accordion style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <AccordionItem
            title={t('heading.vectorOrder.collectionContext', 'Collection Context')}
            open={false}
          >
            <p style={{ fontSize: 12, color: '#525252', marginBottom: 'var(--cds-spacing-04)' }}>
              {t('helper.vectorOrder.collectionContext', 'Optional — field-team capture for bionomics analysis.')}
            </p>
            <Grid>
              <Column lg={5} md={4}>
                <Select
                  id="collection-time-of-day"
                  labelText={t('label.vectorOrder.collectionTimeOfDay', 'Time of Day')}
                  defaultValue={collectionTimeOfDay || 'UNKNOWN'}
                  onChange={e => setCollectionTimeOfDay(e.target.value)}
                >
                  <SelectItem value="UNKNOWN"  text="Unknown" />
                  <SelectItem value="DAWN"     text="Dawn" />
                  <SelectItem value="DAYLIGHT" text="Daylight" />
                  <SelectItem value="DUSK"     text="Dusk" />
                  <SelectItem value="NIGHT"    text="Night" />
                </Select>
              </Column>
              <Column lg={5} md={4}>
                <Select
                  id="resting-context"
                  labelText={t('label.vectorOrder.restingContext', 'Resting Context')}
                  defaultValue={restingContext || 'UNKNOWN'}
                  onChange={e => setRestingContext(e.target.value)}
                >
                  <SelectItem value="UNKNOWN" text="Unknown" />
                  <SelectItem value="INDOOR"  text="Indoor (endophilic)" />
                  <SelectItem value="OUTDOOR" text="Outdoor (exophilic)" />
                </Select>
              </Column>
              <Column lg={6} md={4}>
                <Toggle
                  id="human-biting-catch"
                  labelText={t('label.vectorOrder.humanBitingCatch', 'Human-Biting Catch')}
                  helperText={t('helper.vectorOrder.humanBitingCatch', 'Specimen came from a human-landing collection')}
                  toggled={humanBitingCatch}
                  onToggle={setHumanBitingCatch}
                />
              </Column>
              <Column lg={16} md={8}>
                <TextArea
                  id="collection-context-notes"
                  labelText={t('label.vectorOrder.collectionContextNotes', 'Collection Notes')}
                  placeholder={t('placeholder.vectorOrder.collectionContextNotes', 'Weather, trap conditions, anomalies…')}
                  rows={2}
                  maxCount={500}
                  enableCounter
                  value={collectionContextNotes}
                  onChange={e => setCollectionContextNotes(e.target.value)}
                />
              </Column>
            </Grid>
          </AccordionItem>
        </Accordion>
      </Tile>

      {/* Tests & Panels */}
      <Tile>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
          {t('heading.vectorOrder.tests', 'Tests & Panels')}
        </h4>
        <div style={{ marginBottom: '1rem', maxWidth: 400 }}>
          <TextInput
            id="test-search"
            labelText=""
            hideLabel
            placeholder={t('placeholder.testSearch', 'Search tests or panels…')}
            value={testSearch}
            onChange={e => setTestSearch(e.target.value)}
          />
        </div>
        <DataTable rows={filteredTests.map(t => ({ id: t.id, ...t }))} headers={testHeaders}>
          {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
            <TableContainer>
              <Table {...getTableProps()} size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader>
                      <input
                        type="checkbox"
                        checked={filteredTests.every(t => selectedTests.has(t.id))}
                        onChange={e => toggleAll(e.target.checked)}
                      />
                    </TableHeader>
                    {headers.slice(1).map(h => (
                      <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => {
                    const test = AVAILABLE_TESTS.find(t => t.id === row.id);
                    return (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTests.has(row.id)}
                            onChange={() => toggleTest(row.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <strong>{test?.name}</strong>
                          {test?.type === 'Panel' && <div style={{ fontSize: '0.75rem', color: '#525252' }}>NS1 ELISA + NS1 RT-PCR</div>}
                        </TableCell>
                        <TableCell>
                          <Tag kind={test?.type === 'Panel' ? 'blue' : 'gray'} size="sm">{test?.type}</Tag>
                        </TableCell>
                        <TableCell>{test?.method}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
        <div style={{ fontSize: '0.78rem', color: '#525252', marginTop: '0.5rem' }}>
          {selectedTests.size} of {AVAILABLE_TESTS.length} items selected
        </div>
      </Tile>

      {error && (
        <InlineNotification kind="error" title={t('error.vectorOrder.title', 'Validation error')} subtitle={error} lowContrast />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <Button kind="ghost">{t('button.cancel', 'Cancel')}</Button>
        <Button kind="secondary">{t('button.saveDraft', 'Save Draft')}</Button>
        <Button kind="primary" renderIcon={ArrowRight} onClick={handleNext}>
          {t('button.collectionLot.saveStep1', 'Continue to Label & Store')}
        </Button>
      </div>
    </Stack>
  );
}

// ── Step 2: Label & Store ─────────────────────────────────────────────────────
function Step2LabelStore({ order, labNumber, onNext, onBack }) {
  const [storageUnit, setStorageUnit] = useState('field-container');
  const [storageSlot, setStorageSlot] = useState('');

  return (
    <Stack gap={6}>
      <InlineNotification
        kind="success"
        title={t('message.collectionLot.saved', 'Order saved.')}
        subtitle={`${t('message.collectionLot.labNumber', 'Lab number')} ${labNumber} ${t('message.collectionLot.assigned', 'assigned.')}`}
        lowContrast
      />

      <Tile>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
          {t('heading.orderSummary', 'Order Summary')}
        </h4>
        <Grid>
          <Column lg={4} md={4}><div style={{ fontSize: '0.78rem', color: '#525252' }}>{t('label.labNumber', 'Lab Number')}</div><strong style={{ fontFamily: 'monospace' }}>{labNumber}</strong></Column>
          <Column lg={4} md={4}><div style={{ fontSize: '0.78rem', color: '#525252' }}>{t('label.vectorOrder.organismGroup', 'Organism Group')}</div><strong>{order.organismGroup?.label}</strong></Column>
          <Column lg={4} md={4}><div style={{ fontSize: '0.78rem', color: '#525252' }}>{t('label.vectorOrder.quantity', 'Quantity')}</div><strong>{order.quantity} organisms</strong></Column>
          <Column lg={4} md={4}><div style={{ fontSize: '0.78rem', color: '#525252' }}>{t('label.vectorOrder.samplingSite', 'Sampling Site')}</div><strong>{order.samplingSite?.label ?? '—'}</strong></Column>
          <Column lg={8} md={4}><div style={{ fontSize: '0.78rem', color: '#525252' }}>{t('label.tests', 'Tests')}</div><strong>{order.selectedTests?.size} selected</strong></Column>
        </Grid>
      </Tile>

      {/* Label preview */}
      <Tile>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
          {t('heading.barcodeLabel', 'Lot Barcode Label')}
        </h4>
        <div style={{ border: '2px dashed #0f62fe', padding: '1.25rem', background: '#edf5ff', fontFamily: 'monospace' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f62fe', letterSpacing: '0.05em' }}>{labNumber}</div>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#393939' }}>
            <span><strong>Group:</strong> {order.organismGroup?.label}</span>
            <span><strong>Qty:</strong> {order.quantity}</span>
            <span><strong>Site:</strong> {order.samplingSite?.id?.toUpperCase() ?? '—'}</span>
            <span><strong>Date:</strong> 2026-04-23</span>
          </div>
          <div style={{ height: 40, background: 'repeating-linear-gradient(90deg, #161616 0px, #161616 3px, #fff 3px, #fff 5px)', marginTop: '0.75rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
          <Button kind="secondary" size="sm">{t('button.printLabel', '🖨 Print Label')}</Button>
          <Button kind="ghost" size="sm">{t('button.printCopies', 'Print 3 copies')}</Button>
        </div>
      </Tile>

      {/* Storage (optional) */}
      <Tile>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
          {t('heading.storageLocation', 'Storage Location')}{' '}
          <span style={{ fontWeight: 400, color: '#525252', fontSize: '0.8rem' }}>{t('label.optional', '(optional)')}</span>
        </h4>
        <Grid>
          <Column lg={8} md={4}>
            <Select
              id="storage-unit"
              labelText={t('label.storageUnit', 'Storage Unit')}
              value={storageUnit}
              onChange={e => setStorageUnit(e.target.value)}
            >
              <SelectItem value="field-container" text={t('option.storageFieldContainer', 'Field container — pending transfer')} />
              <SelectItem value="freezer-a" text={t('option.storageFreezera', 'Freezer A — Vector Lab (-80°C)')} />
              <SelectItem value="fridge-2" text={t('option.storageFridge2', 'Fridge 2 — Vector Lab (4°C)')} />
            </Select>
          </Column>
          <Column lg={8} md={4}>
            <TextInput
              id="storage-slot"
              labelText={t('label.storageSlot', 'Position / Slot')}
              placeholder={t('placeholder.storageSlot', 'e.g. Box 3, Row B, Col 4')}
              value={storageSlot}
              onChange={e => setStorageSlot(e.target.value)}
            />
          </Column>
        </Grid>
      </Tile>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <Button kind="ghost" onClick={onBack}>{t('button.back', '← Back')}</Button>
        <Button kind="secondary">{t('button.referOut', 'Refer Out')}</Button>
        <Button kind="primary" renderIcon={ArrowRight} onClick={onNext}>
          {t('button.continueToQa', 'Continue to QA →')}
        </Button>
      </div>
    </Stack>
  );
}

// ── QA Screen ─────────────────────────────────────────────────────────────────
function QaScreen({ order, labNumber, onNext, onBack }) {
  const [qaType, setQaType]           = useState('Positive Control');
  const [qaQty, setQaQty]             = useState(1);
  const [qaTests, setQaTests]         = useState('All tests on this order');
  const [qaSamples, setQaSamples]     = useState([
    { id: 'qa1', type: 'Positive Control', qty: 1, tests: 'Dengue Surveillance Panel', labNo: `${labNumber.replace(/00042/, '00043')}` },
    { id: 'qa2', type: 'Negative Control', qty: 1, tests: 'All tests on this order',   labNo: `${labNumber.replace(/00042/, '00044')}` },
  ]);

  const addQaSample = () => {
    const nextNum = 42 + qaSamples.length + 1;
    setQaSamples(prev => [...prev, {
      id: `qa${prev.length + 1}`,
      type: qaType, qty: qaQty, tests: qaTests,
      labNo: labNumber.replace(/\d{5}$/, String(nextNum).padStart(5, '0')),
    }]);
  };

  const removeQaSample = (id) => setQaSamples(prev => prev.filter(s => s.id !== id));

  const headers = [
    { key: 'type',  header: t('label.qaType', 'QA Type') },
    { key: 'qty',   header: t('label.qaQty', 'Qty') },
    { key: 'tests', header: t('label.qaTests', 'Tests') },
    { key: 'labNo', header: t('label.labNumber', 'Lab Number') },
    { key: 'actions', header: '' },
  ];

  return (
    <Stack gap={6}>
      <InlineNotification
        kind="info"
        title={t('message.qa.optional', 'QA samples are optional.')}
        subtitle={t('message.qa.proceed', 'Add any controls or duplicates below, then proceed to Processing.')}
        lowContrast
      />

      <Tile>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
          {t('heading.addQaSample', 'Add QA Sample')}
        </h4>
        <Grid style={{ alignItems: 'flex-end' }}>
          <Column lg={5} md={3}>
            <Select
              id="qa-type"
              labelText={t('label.qaType', 'QA Type')}
              value={qaType}
              onChange={e => setQaType(e.target.value)}
            >
              {QA_TYPES.map(qt => <SelectItem key={qt} value={qt} text={qt} />)}
            </Select>
          </Column>
          <Column lg={2} md={1}>
            <NumberInput
              id="qa-qty"
              label={t('label.qaQty', 'Quantity')}
              min={1}
              value={qaQty}
              onChange={(e, { value }) => setQaQty(value)}
            />
          </Column>
          <Column lg={5} md={3}>
            <Select
              id="qa-tests"
              labelText={t('label.qaTests', 'Apply to Tests')}
              value={qaTests}
              onChange={e => setQaTests(e.target.value)}
            >
              <SelectItem value="Dengue Surveillance Panel" text="Dengue Surveillance Panel" />
              <SelectItem value="Plasmodium falciparum PCR" text="Plasmodium falciparum PCR" />
              <SelectItem value="All tests on this order" text="All tests on this order" />
            </Select>
          </Column>
          <Column lg={4} md={1}>
            <Button kind="secondary" renderIcon={Add} onClick={addQaSample}>
              {t('button.vectorQa.addQaSample', 'Add')}
            </Button>
          </Column>
        </Grid>
      </Tile>

      <Tile>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
          {t('heading.qaSamplesOnOrder', 'QA Samples on This Order')}{' '}
          <Tag kind="gray" size="sm">{qaSamples.length}</Tag>
        </h4>
        {qaSamples.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#525252', fontSize: '0.875rem' }}>
            {t('message.qa.noSamples', 'No QA samples added. You may proceed without QA samples.')}
          </div>
        ) : (
          <DataTable rows={qaSamples} headers={headers}>
            {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
              <TableContainer>
                <Table {...getTableProps()} size="sm">
                  <TableHead>
                    <TableRow>
                      {headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(row => {
                      const sample = qaSamples.find(s => s.id === row.id);
                      return (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          <TableCell><strong>{sample?.type}</strong></TableCell>
                          <TableCell>{sample?.qty}</TableCell>
                          <TableCell>{sample?.tests}</TableCell>
                          <TableCell><code style={{ fontSize: '0.78rem' }}>{sample?.labNo}</code></TableCell>
                          <TableCell>
                            <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remove" hasIconOnly
                              onClick={() => removeQaSample(row.id)} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        )}
      </Tile>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <Button kind="ghost" onClick={onBack}>{t('button.back', '← Back')}</Button>
        <Button kind="primary" renderIcon={Checkmark} onClick={onNext}>
          {t('button.vectorQa.proceed', 'Proceed to Processing →')}
        </Button>
      </div>
    </Stack>
  );
}

// ── Complete ──────────────────────────────────────────────────────────────────
function CompleteScreen({ order, labNumber, onNewOrder }) {
  return (
    <Tile style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        {t('heading.complete', 'Order Complete — Processing')}
      </h2>
      <p style={{ color: '#525252', fontSize: '0.9rem', maxWidth: 500, margin: '0 auto 1.5rem' }}>
        <strong>{labNumber}</strong> {t('message.complete.status', 'is now in Processing status and will appear in the V-03 Vector Identification worklist.')}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {[
          [t('label.labNumber', 'Lab Number'), labNumber],
          [t('label.vectorOrder.organismGroup', 'Organism Group'), order.organismGroup?.label],
          [t('label.vectorOrder.quantity', 'Quantity'), `${order.quantity} organisms`],
          [t('label.status', 'Status'), <Tag kind="teal">{t('status.processing', 'Processing')}</Tag>],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#f4f4f4', padding: '0.75rem 1.25rem', textAlign: 'left', minWidth: 180 }}>
            <div style={{ fontSize: '0.72rem', color: '#525252', marginBottom: '0.2rem' }}>{label}</div>
            <div style={{ fontWeight: 600, fontFamily: typeof value === 'string' && value.startsWith('VCT') ? 'monospace' : 'inherit' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <Button kind="secondary" onClick={onNewOrder}>{t('button.newVectorOrder', 'New Vector Order')}</Button>
        <Button kind="primary">{t('button.goToWorklist', 'Go to V-03 Worklist')}</Button>
      </div>
    </Tile>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function VectorCollectionWorkflow() {
  const [step, setStep]     = useState(0); // 0=Step1, 1=Step2, 2=QA, 3=Complete
  const [order, setOrder]   = useState(null);
  const LAB_NUMBER = 'VCT/2026/04/00042';

  const steps = [
    { label: t('step.enterOrder', 'Enter Order'),      secondaryLabel: t('step.enterOrder.sub', 'Organism group, quantity, tests') },
    { label: t('step.labelStore', 'Label & Store'),    secondaryLabel: t('step.labelStore.sub', 'Print label, assign storage') },
    { label: t('step.qaReview', 'QA Review'),          secondaryLabel: t('step.qaReview.sub', 'Add QA samples') },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      {/* Page header */}
      <div style={{ background: '#161616', color: '#fff', height: 48, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '0.5rem', fontSize: '0.875rem' }}>
        <span style={{ fontWeight: 600 }}>OpenELIS Global</span>
        <span style={{ opacity: 0.3 }}>/</span>
        <span style={{ opacity: 0.6, fontWeight: 400 }}>{t('nav.sampleCollection', 'Sample Collection')}</span>
        <span style={{ opacity: 0.3 }}>/</span>
        <span>{t('nav.newVectorOrder', 'New Vector Order')}</span>
        <div style={{ marginLeft: 'auto' }}>
          <Tag kind="green">{t('label.domain.vector', 'Vector')}</Tag>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1.5rem' }}>
        <ProgressIndicator currentIndex={step} style={{ marginBottom: '2rem' }}>
          {steps.map((s, i) => (
            <ProgressStep key={i} label={s.label} secondaryLabel={s.secondaryLabel}
              complete={i < step} current={i === step} />
          ))}
        </ProgressIndicator>

        {step === 0 && (
          <Step1EnterOrder
            onNext={data => { setOrder(data); setStep(1); }}
          />
        )}
        {step === 1 && (
          <Step2LabelStore
            order={order}
            labNumber={LAB_NUMBER}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <QaScreen
            order={order}
            labNumber={LAB_NUMBER}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <CompleteScreen
            order={order}
            labNumber={LAB_NUMBER}
            onNewOrder={() => { setOrder(null); setStep(0); }}
          />
        )}
      </div>
    </div>
  );
}
