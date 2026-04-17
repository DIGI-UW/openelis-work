/**
 * V-03 Vector Testing & Identification — React Mockup
 * Spec: vector-testing-identification.md
 * Jira: TBD (OGC-527 epic)
 *
 * Screens:
 *  1. Identification Worklist (tabbed: Pending ID | In Progress | Deconvolution | Complete)
 *  2. Lot Identification Detail (specimen DataTable + inline row expansion + bulk-apply)
 *  3. Deconvolution Workflow (positive pool alert + modal)
 *  4. Panel Admin (test panel config DataTable)
 */

import React, { useState, useCallback } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TableBatchActions, TableBatchAction, TableSelectRow, TableSelectAll,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput, Toggle, MultiSelect,
  Button, InlineNotification, Tag, Modal, Accordion, AccordionItem,
  Tile, Breadcrumb, BreadcrumbItem, ProgressBar,
} from '@carbon/react';
import {
  Identification, Add, ChevronDown, ChevronUp, CheckmarkFilled,
  WarningFilled, Bee, Save, TrashCan, Renew,
} from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// i18n stub
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const SPECIES_CATALOG = [
  { id: 'ae-aeg',  label: 'Aedes aegypti', group: 'MOSQUITO' },
  { id: 'ae-alb',  label: 'Aedes albopictus', group: 'MOSQUITO' },
  { id: 'cx-qui',  label: 'Culex quinquefasciatus', group: 'MOSQUITO' },
  { id: 'cx-tri',  label: 'Culex tritaeniorhynchus', group: 'MOSQUITO' },
  { id: 'an-bar',  label: 'Anopheles barbirostris', group: 'MOSQUITO' },
  { id: 'an-mac',  label: 'Anopheles maculatus', group: 'MOSQUITO' },
  { id: 'ix-ric',  label: 'Ixodes ricinus', group: 'TICK' },
  { id: 'rh-mic',  label: 'Rhipicephalus microplus', group: 'TICK' },
  { id: 'rat-nor', label: 'Rattus norvegicus', group: 'RODENT' },
  { id: 'rat-rat', label: 'Rattus rattus', group: 'RODENT' },
];

const LOTS_PENDING = [
  { id: 'BPP-01-LOT-042', site: 'Bojongsoang — BPP-01', trapType: 'BG-Sentinel', collectionDate: '2026-04-14', group: 'MOSQUITO', specimenCount: 25, identified: 0, status: 'NOT_STARTED', poolFlag: true, positiveTest: null },
  { id: 'BPP-01-LOT-043', site: 'Margahayu — BPP-02', trapType: 'CDC Light Trap', collectionDate: '2026-04-14', group: 'MOSQUITO', specimenCount: 12, identified: 7, status: 'IN_PROGRESS', poolFlag: true, positiveTest: null },
  { id: 'CIL-02-LOT-019', site: 'Cileunyi — CIL-02', trapType: 'Oviposition Trap', collectionDate: '2026-04-13', group: 'MOSQUITO', specimenCount: 8, identified: 0, status: 'NOT_STARTED', poolFlag: false, positiveTest: null },
];

const LOT_DETAIL_SPECIMENS = Array.from({ length: 10 }, (_, i) => ({
  id: `BPP-01-LOT-042-S${String(i + 1).padStart(2, '0')}`,
  label: `S${String(i + 1).padStart(2, '0')}`,
  status: i < 3 ? 'CONFIRMED' : i === 3 ? 'PRESUMPTIVE' : 'NOT_IDENTIFIED',
  species: i < 3 ? 'Aedes aegypti' : i === 3 ? 'Culex quinquefasciatus' : '',
  method: i < 3 ? 'MORPHOLOGICAL' : i === 3 ? 'MOLECULAR' : '',
  confidence: i < 3 ? 'CONFIRMED' : i === 3 ? 'PRESUMPTIVE' : '',
}));

const TEST_PANELS = [
  { id: 'p1', name: 'Dengue Surveillance Panel', group: 'MOSQUITO', tests: 'NS1 ELISA, NS1 RT-PCR (multiplex)', testCount: 2, active: true },
  { id: 'p2', name: 'Malaria Vector Panel', group: 'MOSQUITO', tests: 'Plasmodium PCR, P. falciparum Ag RDT', testCount: 2, active: true },
  { id: 'p3', name: 'Tick-Borne Panel (Basic)', group: 'TICK', tests: 'Rickettsia PCR, Borrelia PCR', testCount: 2, active: true },
  { id: 'p4', name: 'Arbovirus Expanded Panel', group: 'MOSQUITO', tests: 'NS1 RT-PCR, Chikungunya RT-PCR, Zika RT-PCR', testCount: 3, active: false },
];

const DECON_LOTS = [
  { id: 'BPP-03-LOT-011', site: 'Antapani — BPP-03', positiveTest: 'NS1 RT-PCR', childCount: 25, resultsIn: 18, status: 'IN_PROGRESS' },
  { id: 'JAT-01-LOT-007', site: 'Jatisari — JAT-01', positiveTest: 'NS1 RT-PCR', childCount: 20, resultsIn: 20, status: 'COMPLETE', positive: 3 },
];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
const StatusTag = ({ status }) => {
  const map = {
    NOT_IDENTIFIED: { kind: 'gray',      label: t('label.vectorId.status.notIdentified', 'Not Identified') },
    PRESUMPTIVE:    { kind: 'warm-gray', label: t('label.vectorId.status.presumptive',   'Presumptive') },
    CONFIRMED:      { kind: 'green',     label: t('label.vectorId.status.confirmed',      'Confirmed') },
    NOT_STARTED:    { kind: 'gray',      label: 'Not Started' },
    IN_PROGRESS:    { kind: 'blue',      label: 'In Progress' },
    COMPLETE:       { kind: 'green',     label: 'Complete' },
    PENDING:        { kind: 'red',       label: t('label.vectorDec.status.pending',       'Decon Needed') },
    DECON_COMPLETE: { kind: 'teal',      label: 'Decon Complete' },
  };
  const { kind, label } = map[status] || { kind: 'gray', label: status };
  return <Tag kind={kind} size="sm">{label}</Tag>;
};

const GroupTag = ({ group }) => {
  const map = { MOSQUITO: 'blue', TICK: 'purple', RODENT: 'warm-gray', OTHER: 'gray' };
  return <Tag kind={map[group] || 'gray'} size="sm">{group}</Tag>;
};

// ---------------------------------------------------------------------------
// Screen 1 — Identification Worklist
// ---------------------------------------------------------------------------
function IdentificationWorklist({ onSelectLot }) {
  const [search, setSearch] = useState('');

  const wlHeaders = [
    { key: 'id',            header: t('label.vectorId.lotId',          'Lot ID') },
    { key: 'site',          header: t('label.vectorId.samplingsite',   'Sampling Site') },
    { key: 'trapType',      header: t('label.vectorId.trapType',       'Trap Type') },
    { key: 'collectionDate',header: t('label.vectorId.collectionDate', 'Collection Date') },
    { key: 'group',         header: t('label.vectorId.organismGroup',  'Group') },
    { key: 'progress',      header: t('label.vectorId.identifiedCount','Progress') },
    { key: 'status',        header: t('label.vectorId.identificationStatus', 'ID Status') },
    { key: 'actions',       header: '' },
  ];

  const rows = LOTS_PENDING.map(lot => ({
    ...lot,
    group:    <GroupTag group={lot.group} />,
    progress: <span style={{ fontSize: 13 }}>{lot.identified}/{lot.specimenCount}</span>,
    status:   <StatusTag status={lot.status} />,
    actions:  <Button kind="ghost" size="sm" onClick={() => onSelectLot(lot)}>Open</Button>,
  }));

  return (
    <Stack gap={5}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
          {t('heading.vectorId.worklist', 'Vector Identification Worklist')}
        </h2>
        <p style={{ color: '#525252', fontSize: 14 }}>
          Received vector lots awaiting species identification. Select a lot to begin.
        </p>
      </div>

      <Tabs>
        <TabList aria-label="Worklist tabs">
          <Tab>{t('tab.vectorId.pending',       'Pending ID')} (3)</Tab>
          <Tab>{t('tab.vectorId.inProgress',    'In Progress')} (1)</Tab>
          <Tab>{t('tab.vectorId.deconvolution', 'Deconvolution')} (2)</Tab>
          <Tab>{t('tab.vectorId.complete',      'Complete')} (14)</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <DataTable rows={rows} headers={wlHeaders}>
              {({ rows: tRows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                <TableContainer>
                  <TableToolbar>
                    <TableToolbarContent>
                      <TableToolbarSearch
                        placeholder={t('placeholder.vectorId.search', 'Search lots…')}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </TableToolbarContent>
                  </TableToolbar>
                  <Table {...getTableProps()} size="md">
                    <TableHead>
                      <TableRow>
                        {headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tRows.map(row => (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          </TabPanel>
          <TabPanel>
            <p style={{ padding: '1rem', color: '#525252' }}>Lots with identification in progress…</p>
          </TabPanel>
          <TabPanel>
            <DeconvolutionWorklist />
          </TabPanel>
          <TabPanel>
            <p style={{ padding: '1rem', color: '#525252' }}>Completed identification lots…</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Screen 2 — Lot Identification Detail
// ---------------------------------------------------------------------------
function LotIdentificationDetail({ lot, onBack }) {
  const [specimens, setSpecimens] = useState(LOT_DETAIL_SPECIMENS);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [showDeconAlert] = useState(lot?.positiveTest != null);
  const [deconModalOpen, setDeconModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

  const headers = [
    { key: 'label',   header: 'Specimen' },
    { key: 'status',  header: t('label.vectorId.identificationStatus', 'ID Status') },
    { key: 'species', header: t('label.vectorId.species', 'Species') },
    { key: 'method',  header: t('label.vectorId.method',  'Method') },
    { key: 'actions', header: '' },
  ];

  const rows = specimens.map(s => ({
    id: s.id,
    label:   s.label,
    status:  <StatusTag status={s.status} />,
    species: s.species || <span style={{ color: '#8d8d8d' }}>—</span>,
    method:  s.method || <span style={{ color: '#8d8d8d' }}>—</span>,
    actions: (
      <Button
        kind="ghost" size="sm"
        renderIcon={expandedRow === s.id ? ChevronUp : ChevronDown}
        onClick={() => setExpandedRow(prev => prev === s.id ? null : s.id)}
      >
        {t('button.vectorId.identify', 'Identify')}
      </Button>
    ),
    _raw: s,
  }));

  const confirmed = specimens.filter(s => s.status === 'CONFIRMED').length;
  const presumptive = specimens.filter(s => s.status === 'PRESUMPTIVE').length;
  const total = specimens.length;

  return (
    <Stack gap={5}>
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbItem onClick={onBack} style={{ cursor: 'pointer' }}>
          {t('heading.vectorId.worklist', 'Identification Worklist')}
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{lot?.id || 'BPP-01-LOT-042'}</BreadcrumbItem>
      </Breadcrumb>

      {/* Positive pool alert */}
      {showDeconAlert && (
        <InlineNotification
          kind="warning"
          title={t('label.vectorDec.status.pending', 'Deconvolution Needed')}
          subtitle="NS1 RT-PCR returned POSITIVE for this pooled lot. Initiate deconvolution to trace individual infections."
          actions={
            <Button kind="ghost" size="sm" onClick={() => setDeconModalOpen(true)}>
              {t('button.vectorDec.initiate', 'Initiate Deconvolution')}
            </Button>
          }
        />
      )}

      {/* Lot summary */}
      <Tile>
        <Grid condensed>
          <Column lg={4} md={4}>
            <p style={{ fontSize: 12, color: '#6f6f6f' }}>Lot ID</p>
            <p style={{ fontWeight: 600 }}>{lot?.id || 'BPP-01-LOT-042'}</p>
          </Column>
          <Column lg={4} md={4}>
            <p style={{ fontSize: 12, color: '#6f6f6f' }}>Sampling Site</p>
            <p style={{ fontWeight: 600 }}>Bojongsoang — BPP-01</p>
          </Column>
          <Column lg={4} md={4}>
            <p style={{ fontSize: 12, color: '#6f6f6f' }}>Collection Date</p>
            <p>2026-04-14</p>
          </Column>
          <Column lg={4} md={4}>
            <p style={{ fontSize: 12, color: '#6f6f6f' }}>Trap Type</p>
            <p>BG-Sentinel</p>
          </Column>
        </Grid>
      </Tile>

      {/* Species distribution summary */}
      <Tile>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          {t('heading.vectorId.speciesSummary', 'Species Distribution')}
        </h4>
        <Grid condensed>
          <Column lg={8}>
            {[
              { species: 'Aedes aegypti', count: 3, total },
              { species: 'Culex quinquefasciatus', count: 1, total },
              { species: 'Not yet identified', count: total - 4, total },
            ].map(({ species, count }) => (
              <div key={species} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                  <span>{species}</span>
                  <span style={{ color: '#6f6f6f' }}>{count}/{total}</span>
                </div>
                <div style={{ background: '#e0e0e0', borderRadius: 2, height: 6 }}>
                  <div style={{ background: species.includes('Not') ? '#e0e0e0' : '#0f62fe', width: `${(count / total) * 100}%`, height: 6, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </Column>
          <Column lg={4}>
            <Stack gap={2}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag kind="green" size="sm">{confirmed} Confirmed</Tag>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag kind="warm-gray" size="sm">{presumptive} Presumptive</Tag>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag kind="gray" size="sm">{total - confirmed - presumptive} Not Identified</Tag>
              </div>
            </Stack>
          </Column>
        </Grid>
      </Tile>

      {/* Specimen DataTable */}
      <DataTable rows={rows} headers={headers}>
        {({ rows: tRows, headers, getTableProps, getHeaderProps, getRowProps, selectedRows: sr, getSelectionProps, getBatchActionProps }) => (
          <TableContainer title={t('heading.vectorId.specimenGrid', 'Specimens')}>
            <TableBatchActions {...getBatchActionProps()}>
              <TableBatchAction renderIcon={Identification} onClick={() => setBulkModalOpen(true)}>
                {t('button.vectorId.bulkApply', 'Bulk Apply ID')}
              </TableBatchAction>
            </TableBatchActions>
            <Table {...getTableProps()} size="md">
              <TableHead>
                <TableRow>
                  <TableSelectAll {...getSelectionProps()} />
                  {headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {tRows.map(row => {
                  const specimen = specimens.find(s => s.id === row.id);
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow {...getRowProps({ row })}>
                        <TableSelectRow {...getSelectionProps({ row })} />
                        {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                      </TableRow>
                      {expandedRow === row.id && (
                        <TableRow>
                          <TableCell colSpan={headers.length + 2}>
                            <SpecimenIdForm specimen={specimen} onSave={() => setExpandedRow(null)} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      {/* Bulk Apply Modal */}
      <BulkApplyModal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} />

      {/* Deconvolution Modal */}
      <DeconvolutionModal open={deconModalOpen} onClose={() => setDeconModalOpen(false)} lotId={lot?.id || 'BPP-01-LOT-042'} />
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Specimen Identification Form (inline expansion)
// ---------------------------------------------------------------------------
function SpecimenIdForm({ specimen, onSave }) {
  const [method, setMethod] = useState(specimen?.method || '');
  const [showMolecular, setShowMolecular] = useState(method === 'MOLECULAR' || method === 'BOTH');

  const handleMethodChange = (e) => {
    const val = e.target.value;
    setMethod(val);
    setShowMolecular(val === 'MOLECULAR' || val === 'BOTH');
  };

  return (
    <Tile style={{ padding: 'var(--cds-spacing-05)', margin: '0.5rem 0' }}>
      <Grid condensed>
        <Column lg={6} md={4}>
          <ComboBox
            id={`species-${specimen?.id}`}
            titleText={t('label.vectorId.species', 'Species')}
            items={SPECIES_CATALOG}
            itemToString={item => item?.label || ''}
            placeholder={t('placeholder.vectorId.species', 'Search by genus or species name…')}
            initialSelectedItem={SPECIES_CATALOG.find(s => s.label === specimen?.species)}
          />
        </Column>
        <Column lg={4} md={4}>
          <Select
            id={`method-${specimen?.id}`}
            labelText={t('label.vectorId.method', 'Identification Method')}
            defaultValue={specimen?.method || ''}
            onChange={handleMethodChange}
          >
            <SelectItem value="" text="Select method…" />
            <SelectItem value="MORPHOLOGICAL" text={t('label.vectorId.method.morphological', 'Morphological')} />
            <SelectItem value="MOLECULAR"     text={t('label.vectorId.method.molecular',     'Molecular')} />
            <SelectItem value="BOTH"          text={t('label.vectorId.method.both',          'Morphological + Molecular')} />
          </Select>
        </Column>
        <Column lg={4} md={4}>
          <Select
            id={`confidence-${specimen?.id}`}
            labelText={t('label.vectorId.confidence', 'Confidence')}
            defaultValue={specimen?.confidence || ''}
          >
            <SelectItem value="" text="Select confidence…" />
            <SelectItem value="CONFIRMED"   text={t('label.vectorId.confidence.confirmed',   'Confirmed')} />
            <SelectItem value="PRESUMPTIVE" text={t('label.vectorId.confidence.presumptive', 'Presumptive')} />
          </Select>
        </Column>
        <Column lg={16} md={8}>
          <TextArea
            id={`notes-${specimen?.id}`}
            labelText={t('label.vectorId.notes', 'Notes')}
            placeholder={t('placeholder.vectorId.notes', 'Optional notes about this identification…')}
            defaultValue=""
            rows={2}
          />
        </Column>
        <Column lg={16} md={8}>
          <Accordion>
            <AccordionItem
              title={t('label.vectorId.molecularDetails', 'Molecular Details')}
              open={showMolecular}
            >
              <Grid condensed>
                <Column lg={5} md={4}>
                  <TextInput
                    id={`gene-${specimen?.id}`}
                    labelText={t('label.vectorId.targetGene', 'Target Gene')}
                    placeholder="e.g. COI, ITS2, 28S rDNA"
                  />
                </Column>
                <Column lg={5} md={4}>
                  <TextInput
                    id={`assay-${specimen?.id}`}
                    labelText={t('label.vectorId.assayName', 'Assay Name')}
                    placeholder="e.g. Multiplex RT-PCR Dengue"
                  />
                </Column>
                <Column lg={6} md={4}>
                  <TextInput
                    id={`accession-${specimen?.id}`}
                    labelText={t('label.vectorId.genbankAccession', 'GenBank Accession')}
                    placeholder="e.g. MW123456"
                  />
                </Column>
              </Grid>
            </AccordionItem>
          </Accordion>
        </Column>
      </Grid>

      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button kind="primary" size="sm" renderIcon={Save} onClick={onSave}>
          {t('button.vectorId.save', 'Save Identification')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onSave}>
          {t('button.vectorId.cancel', 'Cancel')}
        </Button>
      </Stack>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Bulk Apply Modal
// ---------------------------------------------------------------------------
function BulkApplyModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      modalHeading={t('button.vectorId.bulkApply', 'Bulk Apply Species ID')}
      primaryButtonText={t('button.vectorId.applyToAll', 'Apply to All Selected')}
      secondaryButtonText={t('button.vectorId.cancel', 'Cancel')}
      onRequestClose={onClose}
      onRequestSubmit={onClose}
      size="sm"
    >
      <p style={{ marginBottom: 'var(--cds-spacing-05)', fontSize: 14, color: '#525252' }}>
        This will apply the same species identification to all selected specimens. Molecular detail fields are not copied.
      </p>
      <Stack gap={5}>
        <ComboBox
          id="bulk-species"
          titleText={t('label.vectorId.species', 'Species')}
          items={SPECIES_CATALOG}
          itemToString={item => item?.label || ''}
          placeholder="Search species…"
        />
        <Select id="bulk-method" labelText={t('label.vectorId.method', 'Identification Method')}>
          <SelectItem value="" text="Select method…" />
          <SelectItem value="MORPHOLOGICAL" text="Morphological" />
          <SelectItem value="MOLECULAR"     text="Molecular" />
          <SelectItem value="BOTH"          text="Morphological + Molecular" />
        </Select>
        <Select id="bulk-confidence" labelText={t('label.vectorId.confidence', 'Confidence')}>
          <SelectItem value="" text="Select confidence…" />
          <SelectItem value="CONFIRMED"   text="Confirmed" />
          <SelectItem value="PRESUMPTIVE" text="Presumptive" />
        </Select>
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Deconvolution Modal
// ---------------------------------------------------------------------------
function DeconvolutionModal({ open, onClose, lotId }) {
  const [strategy, setStrategy] = useState('INDIVIDUAL');

  return (
    <Modal
      open={open}
      modalHeading={t('heading.vectorDec.title', 'Initiate Pool Deconvolution')}
      primaryButtonText={t('button.vectorDec.confirm', 'Confirm & Generate Specimens')}
      secondaryButtonText={t('button.vectorDec.cancel', 'Cancel')}
      onRequestClose={onClose}
      onRequestSubmit={onClose}
      size="md"
    >
      <InlineNotification
        kind="warning"
        title="Positive result detected"
        subtitle="NS1 RT-PCR returned POSITIVE for lot BPP-01-LOT-042. Child specimens will be created and a re-test order generated."
        style={{ marginBottom: 'var(--cds-spacing-05)' }}
        lowContrast
      />
      <Stack gap={6}>
        <Grid condensed>
          <Column lg={8}>
            <p style={{ fontSize: 12, color: '#6f6f6f', marginBottom: 4 }}>Positive Test</p>
            <p style={{ fontWeight: 600 }}>NS1 RT-PCR (Dengue Surveillance Panel)</p>
          </Column>
          <Column lg={8}>
            <p style={{ fontSize: 12, color: '#6f6f6f', marginBottom: 4 }}>Lot</p>
            <p style={{ fontWeight: 600 }}>{lotId} · 25 specimens · BG-Sentinel</p>
          </Column>
        </Grid>

        <fieldset style={{ border: 'none', padding: 0 }}>
          <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {t('label.vectorDec.strategy', 'Deconvolution Strategy')}
          </legend>
          <Stack gap={3}>
            {[
              { value: 'INDIVIDUAL', label: t('label.vectorDec.strategy.individual', 'Individual specimens') },
              { value: 'SUB_POOL',   label: t('label.vectorDec.strategy.subpool',    'Sub-pools') },
            ].map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="radio" name="decon-strategy" value={opt.value}
                  checked={strategy === opt.value}
                  onChange={() => setStrategy(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </Stack>
        </fieldset>

        {strategy === 'INDIVIDUAL' ? (
          <NumberInput
            id="decon-count"
            label={t('label.vectorDec.specimenCount', 'Number of Specimens')}
            value={25}
            min={2} max={200}
          />
        ) : (
          <Grid condensed>
            <Column lg={8}>
              <NumberInput id="decon-subpool-count" label={t('label.vectorDec.subPoolCount', 'Number of Sub-pools')} value={5} min={2} />
            </Column>
            <Column lg={8}>
              <NumberInput id="decon-per-subpool" label={t('label.vectorDec.specimensPerSubPool', 'Specimens per Sub-pool')} value={5} min={1} />
            </Column>
          </Grid>
        )}

        <ComboBox
          id="decon-panel"
          titleText={t('label.vectorDec.panel', 'Test Panel')}
          items={TEST_PANELS.filter(p => p.active)}
          itemToString={item => item?.name || ''}
          placeholder="Select a test panel…"
          initialSelectedItem={TEST_PANELS[0]}
        />

        <TextArea
          id="decon-notes"
          labelText={t('label.vectorDec.notes', 'Notes')}
          placeholder="Optional notes…"
          rows={2}
        />
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Screen 3 — Deconvolution Worklist
// ---------------------------------------------------------------------------
function DeconvolutionWorklist() {
  const headers = [
    { key: 'id',         header: 'Lot ID' },
    { key: 'site',       header: 'Site' },
    { key: 'positiveTest', header: 'Positive Test' },
    { key: 'progress',   header: 'Results Received' },
    { key: 'status',     header: 'Status' },
    { key: 'actions',    header: '' },
  ];

  const rows = DECON_LOTS.map(lot => ({
    id: lot.id,
    site: lot.site,
    positiveTest: lot.positiveTest,
    progress: `${lot.resultsIn} / ${lot.childCount}`,
    status: <StatusTag status={lot.status === 'COMPLETE' ? 'DECON_COMPLETE' : 'IN_PROGRESS'} />,
    actions: <Button kind="ghost" size="sm">View</Button>,
  }));

  return (
    <DataTable rows={rows} headers={headers}>
      {({ rows: tRows, headers, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer>
          <Table {...getTableProps()} size="md">
            <TableHead>
              <TableRow>
                {headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {tRows.map(row => (
                <TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

// ---------------------------------------------------------------------------
// Screen 4 — Panel Admin
// ---------------------------------------------------------------------------
function PanelAdmin() {
  const [expandedPanel, setExpandedPanel] = useState(null);

  const headers = [
    { key: 'name',      header: t('label.vectorPanel.name', 'Panel Name') },
    { key: 'group',     header: t('label.vectorPanel.organismGroup', 'Organism Group') },
    { key: 'testCount', header: t('label.vectorPanel.testCount', 'Tests') },
    { key: 'status',    header: t('label.vectorPanel.active', 'Status') },
    { key: 'actions',   header: '' },
  ];

  const rows = TEST_PANELS.map(p => ({
    id: p.id,
    name: p.name,
    group: <GroupTag group={p.group} />,
    testCount: p.testCount,
    status: p.active ? <Tag kind="green" size="sm">Active</Tag> : <Tag kind="gray" size="sm">Inactive</Tag>,
    actions: (
      <Button
        kind="ghost" size="sm"
        renderIcon={expandedPanel === p.id ? ChevronUp : ChevronDown}
        onClick={() => setExpandedPanel(prev => prev === p.id ? null : p.id)}
      >
        Edit
      </Button>
    ),
    _raw: p,
  }));

  return (
    <Stack gap={5}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
            {t('heading.vectorPanel.title', 'Vector Test Panels')}
          </h2>
          <p style={{ color: '#525252', fontSize: 14 }}>
            Configure named pathogen screening panels for use at order entry.
          </p>
        </div>
        <Button renderIcon={Add} kind="primary">
          {t('button.vectorPanel.add', 'Add Panel')}
        </Button>
      </div>

      <DataTable rows={rows} headers={headers}>
        {({ rows: tRows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <TableContainer>
            <Table {...getTableProps()} size="md">
              <TableHead>
                <TableRow>
                  {headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {tRows.map(row => {
                  const panel = TEST_PANELS.find(p => p.id === row.id);
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow {...getRowProps({ row })}>
                        {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                      </TableRow>
                      {expandedPanel === row.id && (
                        <TableRow>
                          <TableCell colSpan={headers.length}>
                            <PanelEditForm panel={panel} onSave={() => setExpandedPanel(null)} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </Stack>
  );
}

function PanelEditForm({ panel, onSave }) {
  return (
    <Tile style={{ padding: 'var(--cds-spacing-05)', margin: '0.5rem 0' }}>
      <Grid condensed>
        <Column lg={6} md={4}>
          <TextInput
            id={`panel-name-${panel?.id}`}
            labelText={t('label.vectorPanel.name', 'Panel Name')}
            defaultValue={panel?.name}
          />
        </Column>
        <Column lg={4} md={4}>
          <Select
            id={`panel-group-${panel?.id}`}
            labelText={t('label.vectorPanel.organismGroup', 'Organism Group Filter')}
            defaultValue={panel?.group}
          >
            <SelectItem value="" text="Any group" />
            <SelectItem value="MOSQUITO" text="Mosquito" />
            <SelectItem value="TICK"     text="Tick" />
            <SelectItem value="RODENT"   text="Rodent" />
          </Select>
        </Column>
        <Column lg={6} md={4}>
          <Toggle
            id={`panel-active-${panel?.id}`}
            labelText={t('label.vectorPanel.active', 'Active')}
            labelA="Inactive" labelB="Active"
            defaultToggled={panel?.active}
          />
        </Column>
        <Column lg={16} md={8}>
          <TextArea
            id={`panel-desc-${panel?.id}`}
            labelText={t('label.vectorPanel.description', 'Description')}
            defaultValue=""
            rows={2}
          />
        </Column>
        <Column lg={16} md={8}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {t('label.vectorPanel.tests', 'Tests')}
          </p>
          <Tile style={{ background: '#f4f4f4', padding: 12 }}>
            <p style={{ fontSize: 13, color: '#525252' }}>{panel?.tests}</p>
            <Button kind="ghost" size="sm" renderIcon={Add} style={{ marginTop: 8 }}>
              Add Test
            </Button>
          </Tile>
        </Column>
      </Grid>
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button kind="primary" size="sm" renderIcon={Save} onClick={onSave}>
          {t('button.vectorPanel.save', 'Save Panel')}
        </Button>
        <Button kind="danger--ghost" size="sm" renderIcon={TrashCan}>
          {t('button.vectorPanel.deactivate', 'Deactivate')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onSave}>
          {t('button.vectorId.cancel', 'Cancel')}
        </Button>
      </Stack>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Root App — screen router
// ---------------------------------------------------------------------------
export default function VectorTestingIdentification() {
  const [screen, setScreen] = useState('worklist'); // worklist | lotDetail | panelAdmin
  const [selectedLot, setSelectedLot] = useState(null);

  const handleSelectLot = (lot) => {
    setSelectedLot(lot);
    setScreen('lotDetail');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4', padding: 'var(--cds-spacing-06)' }}>
      {/* Screen nav tabs */}
      <Tabs style={{ marginBottom: 'var(--cds-spacing-06)' }}>
        <TabList aria-label="V-03 screens">
          <Tab onClick={() => setScreen('worklist')}>ID Worklist</Tab>
          <Tab onClick={() => setScreen('lotDetail')}>Lot Detail</Tab>
          <Tab onClick={() => setScreen('panelAdmin')}>Panel Admin</Tab>
        </TabList>
      </Tabs>

      <div style={{ maxWidth: 1200 }}>
        {screen === 'worklist'   && <IdentificationWorklist onSelectLot={handleSelectLot} />}
        {screen === 'lotDetail'  && <LotIdentificationDetail lot={selectedLot} onBack={() => setScreen('worklist')} />}
        {screen === 'panelAdmin' && <PanelAdmin />}
      </div>
    </div>
  );
}
