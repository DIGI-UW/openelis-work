/**
 * V-03 Vector Testing & Identification — React Mockup (v1.1)
 * Spec: vector-testing-identification.md
 * Jira: OGC-583 (OGC-527 epic)
 *
 * v1.1 changes:
 *  - Navigation: SideNav with submenus replaces top-level Tabs
 *  - Lot detail: inline row expansion instead of separate screen/page nav
 *  - Panel Admin: references unified Panel admin (Admin → Panel Setup, domain = VECTOR)
 *
 * Sections:
 *  A. Identification Worklist — SideNav-driven filter (Pending ID | In Progress | Deconvolution | Complete)
 *     └── Lot rows expand inline to show LotDetail (specimens + ID forms)
 *  B. Test Panels — redirect notice pointing to unified Admin → Panel Setup
 */

import React, { useState } from 'react';
import {
  Grid, Column, Stack,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem, SideNavLink,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TableBatchActions, TableBatchAction, TableSelectRow, TableSelectAll,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput, Toggle,
  Button, InlineNotification, Tag, Modal, Accordion, AccordionItem,
  Tile,
} from '@carbon/react';
import {
  Identification, Add, ChevronDown, ChevronUp, Save, TrashCan,
  Launch, ArrowRight,
} from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// i18n stub
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const SPECIES_CATALOG = [
  { id: 'ae-aeg',  label: 'Aedes aegypti',              group: 'MOSQUITO' },
  { id: 'ae-alb',  label: 'Aedes albopictus',            group: 'MOSQUITO' },
  { id: 'cx-qui',  label: 'Culex quinquefasciatus',      group: 'MOSQUITO' },
  { id: 'cx-tri',  label: 'Culex tritaeniorhynchus',     group: 'MOSQUITO' },
  { id: 'an-bar',  label: 'Anopheles barbirostris',      group: 'MOSQUITO' },
  { id: 'an-mac',  label: 'Anopheles maculatus',         group: 'MOSQUITO' },
  { id: 'ix-ric',  label: 'Ixodes ricinus',              group: 'TICK' },
  { id: 'rh-mic',  label: 'Rhipicephalus microplus',     group: 'TICK' },
  { id: 'rat-nor', label: 'Rattus norvegicus',           group: 'RODENT' },
  { id: 'rat-rat', label: 'Rattus rattus',               group: 'RODENT' },
];

const LOT_SECTIONS = {
  pendingId: [
    { id: 'BPP-01-LOT-042', site: 'Bojongsoang — BPP-01', trapType: 'BG-Sentinel',      collectionDate: '2026-04-14', group: 'MOSQUITO', specimenCount: 25, identified: 0,  status: 'NOT_STARTED', poolFlag: true,  positiveTest: null },
    { id: 'BPP-01-LOT-043', site: 'Margahayu — BPP-02',   trapType: 'CDC Light Trap',   collectionDate: '2026-04-14', group: 'MOSQUITO', specimenCount: 12, identified: 0,  status: 'NOT_STARTED', poolFlag: true,  positiveTest: null },
    { id: 'CIL-02-LOT-019', site: 'Cileunyi — CIL-02',    trapType: 'Oviposition Trap', collectionDate: '2026-04-13', group: 'MOSQUITO', specimenCount: 8,  identified: 0,  status: 'NOT_STARTED', poolFlag: false, positiveTest: null },
    { id: 'JAT-03-LOT-005', site: 'Jatisari — JAT-03',    trapType: 'Gravid Trap',      collectionDate: '2026-04-13', group: 'MOSQUITO', specimenCount: 18, identified: 0,  status: 'NOT_STARTED', poolFlag: true,  positiveTest: null },
  ],
  inProgress: [
    { id: 'BPP-02-LOT-031', site: 'Margahayu — BPP-02',   trapType: 'CDC Light Trap',   collectionDate: '2026-04-12', group: 'MOSQUITO', specimenCount: 20, identified: 11, status: 'IN_PROGRESS', poolFlag: true,  positiveTest: null },
  ],
  deconvolution: [
    { id: 'BPP-03-LOT-011', site: 'Antapani — BPP-03',    trapType: 'BG-Sentinel',      collectionDate: '2026-04-10', group: 'MOSQUITO', specimenCount: 25, identified: 25, status: 'COMPLETE',    poolFlag: true,  positiveTest: 'NS1 RT-PCR', deconStatus: 'IN_PROGRESS', childCount: 25, resultsIn: 18 },
    { id: 'JAT-01-LOT-007', site: 'Jatisari — JAT-01',    trapType: 'Gravid Trap',      collectionDate: '2026-04-08', group: 'MOSQUITO', specimenCount: 20, identified: 20, status: 'COMPLETE',    poolFlag: true,  positiveTest: 'NS1 RT-PCR', deconStatus: 'COMPLETE',    childCount: 20, resultsIn: 20, positiveChildCount: 3 },
  ],
  complete: Array.from({ length: 14 }, (_, i) => ({
    id: `BPP-0${(i % 4) + 1}-LOT-0${String(i + 1).padStart(2, '0')}`,
    site: ['Bojongsoang — BPP-01', 'Margahayu — BPP-02', 'Cileunyi — CIL-02', 'Antapani — BPP-03'][i % 4],
    trapType: ['BG-Sentinel', 'CDC Light Trap', 'Oviposition Trap', 'Gravid Trap'][i % 4],
    collectionDate: `2026-04-${String(i + 1).padStart(2, '0')}`,
    group: 'MOSQUITO', specimenCount: 10 + i, identified: 10 + i, status: 'COMPLETE', poolFlag: i % 3 === 0, positiveTest: null,
  })),
};

const LOT_DETAIL_SPECIMENS = Array.from({ length: 10 }, (_, i) => ({
  id: `BPP-01-LOT-042-S${String(i + 1).padStart(2, '0')}`,
  label: `S${String(i + 1).padStart(2, '0')}`,
  status:     i < 3 ? 'CONFIRMED'      : i === 3 ? 'PRESUMPTIVE' : 'NOT_IDENTIFIED',
  species:    i < 3 ? 'Aedes aegypti'  : i === 3 ? 'Culex quinquefasciatus' : '',
  method:     i < 3 ? 'MORPHOLOGICAL'  : i === 3 ? 'MOLECULAR'   : '',
  confidence: i < 3 ? 'CONFIRMED'      : i === 3 ? 'PRESUMPTIVE' : '',
}));

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
const StatusTag = ({ status }) => {
  const map = {
    NOT_IDENTIFIED: { kind: 'gray',      label: 'Not Identified' },
    PRESUMPTIVE:    { kind: 'warm-gray', label: 'Presumptive' },
    CONFIRMED:      { kind: 'green',     label: 'Confirmed' },
    NOT_STARTED:    { kind: 'gray',      label: 'Not Started' },
    IN_PROGRESS:    { kind: 'blue',      label: 'In Progress' },
    COMPLETE:       { kind: 'green',     label: 'Complete' },
    DECON_NEEDED:   { kind: 'red',       label: 'Decon Needed' },
    DECON_PROGRESS: { kind: 'blue',      label: 'Decon In Progress' },
    DECON_COMPLETE: { kind: 'teal',      label: 'Decon Complete' },
  };
  const { kind, label } = map[status] || { kind: 'gray', label: status };
  return <Tag kind={kind} size="sm">{label}</Tag>;
};

const GroupTag = ({ group }) => {
  const map = { MOSQUITO: 'blue', TICK: 'purple', RODENT: 'warm-gray', OTHER: 'gray' };
  return <Tag kind={map[group] || 'gray'} size="sm">{group}</Tag>;
};

// Badge shown in SideNav items
const NavBadge = ({ count, alert }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 20, height: 20, padding: '0 5px',
    background: alert ? '#da1e28' : '#e0e0e0',
    color: alert ? '#fff' : '#161616',
    borderRadius: 10, fontSize: 11, fontWeight: 600, marginLeft: 6,
  }}>
    {count}
  </span>
);

// ---------------------------------------------------------------------------
// Specimen Identification Form (inline expansion within lot detail)
// ---------------------------------------------------------------------------
function SpecimenIdForm({ specimen, onSave }) {
  const [method, setMethod] = useState(specimen?.method || '');
  const showMolecular = method === 'MOLECULAR' || method === 'BOTH';

  return (
    <Tile style={{ padding: 'var(--cds-spacing-05)', margin: '0.5rem 0', background: '#f4f4f4' }}>
      <Grid condensed>
        <Column lg={6} md={4}>
          <ComboBox
            id={`species-${specimen?.id}`}
            titleText={t('label.vectorId.species', 'Species')}
            items={SPECIES_CATALOG}
            itemToString={item => item?.label || ''}
            placeholder="Search by genus or species name…"
            initialSelectedItem={SPECIES_CATALOG.find(s => s.label === specimen?.species)}
          />
        </Column>
        <Column lg={4} md={4}>
          <Select
            id={`method-${specimen?.id}`}
            labelText={t('label.vectorId.method', 'Identification Method')}
            defaultValue={specimen?.method || ''}
            onChange={e => setMethod(e.target.value)}
          >
            <SelectItem value=""             text="Select method…" />
            <SelectItem value="MORPHOLOGICAL" text="Morphological" />
            <SelectItem value="MOLECULAR"     text="Molecular" />
            <SelectItem value="BOTH"          text="Morphological + Molecular" />
          </Select>
        </Column>
        <Column lg={4} md={4}>
          <Select
            id={`confidence-${specimen?.id}`}
            labelText={t('label.vectorId.confidence', 'Confidence')}
            defaultValue={specimen?.confidence || ''}
          >
            <SelectItem value=""           text="Select confidence…" />
            <SelectItem value="CONFIRMED"   text="Confirmed" />
            <SelectItem value="PRESUMPTIVE" text="Presumptive" />
          </Select>
        </Column>
        <Column lg={16} md={8}>
          <TextArea
            id={`notes-${specimen?.id}`}
            labelText="Notes"
            placeholder="Optional notes about this identification…"
            rows={2}
          />
        </Column>
        <Column lg={16} md={8}>
          <Accordion>
            <AccordionItem title="Molecular Details" open={showMolecular}>
              <Grid condensed>
                <Column lg={5} md={4}>
                  <TextInput id={`gene-${specimen?.id}`}     labelText="Target Gene"       placeholder="e.g. COI, ITS2, 28S rDNA" />
                </Column>
                <Column lg={5} md={4}>
                  <TextInput id={`assay-${specimen?.id}`}    labelText="Assay Name"        placeholder="e.g. Multiplex RT-PCR Dengue" />
                </Column>
                <Column lg={6} md={4}>
                  <TextInput id={`accession-${specimen?.id}`} labelText="GenBank Accession" placeholder="e.g. MW123456" />
                </Column>
              </Grid>
            </AccordionItem>
          </Accordion>
        </Column>
      </Grid>
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button kind="primary" size="sm" renderIcon={Save} onClick={onSave}>Save Identification</Button>
        <Button kind="ghost"   size="sm"                   onClick={onSave}>Cancel</Button>
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
      modalHeading="Bulk Apply Species ID"
      primaryButtonText="Apply to All Selected"
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={onClose}
      size="sm"
    >
      <p style={{ marginBottom: 'var(--cds-spacing-05)', fontSize: 14, color: '#525252' }}>
        Applies the same species identification to all selected specimens. Molecular detail fields are not copied.
      </p>
      <Stack gap={5}>
        <ComboBox
          id="bulk-species"
          titleText="Species"
          items={SPECIES_CATALOG}
          itemToString={item => item?.label || ''}
          placeholder="Search species…"
        />
        <Select id="bulk-method" labelText="Identification Method">
          <SelectItem value=""             text="Select method…" />
          <SelectItem value="MORPHOLOGICAL" text="Morphological" />
          <SelectItem value="MOLECULAR"     text="Molecular" />
          <SelectItem value="BOTH"          text="Morphological + Molecular" />
        </Select>
        <Select id="bulk-confidence" labelText="Confidence">
          <SelectItem value=""           text="Select confidence…" />
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
  const [aliquotCount, setAliquotCount]           = useState(5);
  const [organismsPerAliquot, setOrganismsPerAliquot] = useState(5);
  const parentQty = 25;
  const totalOrganisms = aliquotCount * organismsPerAliquot;
  const exceedsParent = totalOrganisms > parentQty;

  return (
    <Modal
      open={open}
      modalHeading={t('heading.vectorDec.title', 'Initiate Pool Deconvolution')}
      primaryButtonText={t('button.vectorDec.confirm', 'Confirm & Generate Aliquots')}
      secondaryButtonText={t('button.vectorDec.cancel', 'Cancel')}
      onRequestClose={onClose}
      onRequestSubmit={onClose}
      size="md"
    >
      <InlineNotification
        kind="warning"
        title={t('label.vectorDec.positiveTest', 'Positive result:')}
        subtitle={t('message.vectorDec.parentNote',
          'NS1 RT-PCR returned POSITIVE. Parent test orders and results will remain unchanged.')}
        lowContrast
        style={{ marginBottom: 'var(--cds-spacing-05)' }}
      />
      <Stack gap={6}>
        {/* Parent summary */}
        <Tile style={{ background: '#f4f4f4', padding: '0.75rem 1rem' }}>
          <Grid condensed>
            <Column lg={8}>
              <p style={{ fontSize: 12, color: '#6f6f6f', marginBottom: 4 }}>{t('label.positiveTest', 'Positive Test')}</p>
              <p style={{ fontWeight: 600 }}>NS1 RT-PCR (Dengue Surveillance Panel)</p>
            </Column>
            <Column lg={8}>
              <p style={{ fontSize: 12, color: '#6f6f6f', marginBottom: 4 }}>{t('label.parentSample', 'Parent Sample')}</p>
              <p style={{ fontWeight: 600, fontFamily: 'monospace' }}>{lotId} · {parentQty} organisms</p>
            </Column>
          </Grid>
        </Tile>

        {/* Simplified two-field form — no strategy selector */}
        <Grid condensed>
          <Column lg={8}>
            <NumberInput
              id="decon-aliquot-count"
              label={<>{t('label.vectorDec.aliquotCount', 'Number of Aliquots')} <span style={{ color: '#da1e28' }}>*</span></>}
              helperText={t('helper.vectorDec.aliquotCount', 'Minimum 2')}
              min={2}
              value={aliquotCount}
              onChange={(e, { value }) => setAliquotCount(Math.max(2, value || 2))}
            />
          </Column>
          <Column lg={8}>
            <NumberInput
              id="decon-organisms-per"
              label={<>{t('label.vectorDec.organismsPerAliquot', 'Organisms per Aliquot')} <span style={{ color: '#da1e28' }}>*</span></>}
              helperText={
                organismsPerAliquot === 1
                  ? t('helper.vectorDec.individual', '→ Individual organisms (terminal)')
                  : t('helper.vectorDec.subpool', '→ Sub-pools — can be deconvoluted further if positive')
              }
              min={1}
              value={organismsPerAliquot}
              onChange={(e, { value }) => setOrganismsPerAliquot(Math.max(1, value || 1))}
            />
          </Column>
        </Grid>

        {/* Running total */}
        <p style={{ fontSize: 13, color: '#393939', background: '#f4f4f4', padding: '0.5rem 0.75rem' }}>
          {t('label.vectorDec.totalOrganisms', 'Total organisms across aliquots:')} <strong>{totalOrganisms}</strong>
          {' '}{t('label.vectorDec.ofParent', 'of')} <strong>{parentQty}</strong> parent organisms
        </p>

        {/* Soft warning — non-blocking */}
        {exceedsParent && (
          <InlineNotification
            kind="warning"
            title=""
            subtitle={`${t('warning.vectorDec.exceedsParentQuantity',
              `Total organisms (${totalOrganisms}) exceeds parent quantity (${parentQty}). Adjust if needed — this is non-blocking.`)}`}
            lowContrast
          />
        )}

        <TextArea
          id="decon-notes"
          labelText={t('label.vectorDec.notes', 'Notes')}
          placeholder={t('placeholder.vectorDec.notes', 'Optional…')}
          rows={2}
        />
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Inline Lot Detail — rendered inside a TableRow expansion
// ---------------------------------------------------------------------------
function LotDetail({ lot, onDeconOpen }) {
  const [specimens, setSpecimens] = useState(LOT_DETAIL_SPECIMENS);
  const [expandedSpecimen, setExpandedSpecimen] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const specimenHeaders = [
    { key: 'label',   header: 'Specimen' },
    { key: 'status',  header: 'ID Status' },
    { key: 'species', header: 'Species' },
    { key: 'method',  header: 'Method' },
    { key: 'actions', header: '' },
  ];

  const specimenRows = specimens.map(s => ({
    id: s.id,
    label:   s.label,
    status:  <StatusTag status={s.status} />,
    species: s.species || <span style={{ color: '#8d8d8d' }}>—</span>,
    method:  s.method  || <span style={{ color: '#8d8d8d' }}>—</span>,
    actions: (
      <Button
        kind="ghost" size="sm"
        renderIcon={expandedSpecimen === s.id ? ChevronUp : ChevronDown}
        onClick={e => { e.stopPropagation(); setExpandedSpecimen(prev => prev === s.id ? null : s.id); }}
      >
        Identify
      </Button>
    ),
  }));

  const confirmed   = specimens.filter(s => s.status === 'CONFIRMED').length;
  const presumptive = specimens.filter(s => s.status === 'PRESUMPTIVE').length;
  const total       = specimens.length;

  return (
    <div style={{ padding: '1rem 1.5rem', borderLeft: '3px solid #0f62fe', background: '#f4f4f4' }}>
      {/* Positive pool alert */}
      {lot.positiveTest && (
        <InlineNotification
          kind="warning"
          title="Deconvolution Needed"
          subtitle={`${lot.positiveTest} returned POSITIVE for this pooled lot.`}
          actions={
            <Button kind="ghost" size="sm" onClick={() => onDeconOpen(lot)}>
              Initiate Deconvolution
            </Button>
          }
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* Lot summary */}
      <Grid condensed style={{ marginBottom: '1rem' }}>
        <Column lg={4} md={2}>
          <p style={{ fontSize: 12, color: '#6f6f6f' }}>Sampling Site</p>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{lot.site}</p>
        </Column>
        <Column lg={3} md={2}>
          <p style={{ fontSize: 12, color: '#6f6f6f' }}>Collection Date</p>
          <p style={{ fontSize: 14 }}>{lot.collectionDate}</p>
        </Column>
        <Column lg={3} md={2}>
          <p style={{ fontSize: 12, color: '#6f6f6f' }}>Trap Type</p>
          <p style={{ fontSize: 14 }}>{lot.trapType}</p>
        </Column>
        <Column lg={3} md={2}>
          <p style={{ fontSize: 12, color: '#6f6f6f' }}>Progress</p>
          <p style={{ fontSize: 14 }}>{lot.identified}/{lot.specimenCount} identified</p>
        </Column>
        <Column lg={3} md={2}>
          <Tag kind="green"     size="sm">{confirmed}   Confirmed</Tag>{' '}
          <Tag kind="warm-gray" size="sm">{presumptive} Presumptive</Tag>{' '}
          <Tag kind="gray"      size="sm">{total - confirmed - presumptive} Not ID'd</Tag>
        </Column>
      </Grid>

      {/* Specimen table */}
      <DataTable rows={specimenRows} headers={specimenHeaders}>
        {({ rows: tRows, headers, getTableProps, getHeaderProps, getRowProps, getSelectionProps, getBatchActionProps }) => (
          <TableContainer>
            <TableBatchActions {...getBatchActionProps()}>
              <TableBatchAction renderIcon={Identification} onClick={() => setBulkModalOpen(true)}>
                Bulk Apply ID
              </TableBatchAction>
            </TableBatchActions>
            <Table {...getTableProps()} size="sm">
              <TableHead>
                <TableRow>
                  <TableSelectAll {...getSelectionProps()} />
                  {headers.map(h => (
                    <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>
                  ))}
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
                      {expandedSpecimen === row.id && (
                        <TableRow>
                          <TableCell colSpan={headers.length + 2} style={{ padding: 0 }}>
                            <SpecimenIdForm
                              specimen={specimen}
                              onSave={() => setExpandedSpecimen(null)}
                            />
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

      <BulkApplyModal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Identification Worklist — section-filtered lot table with inline lot detail
// ---------------------------------------------------------------------------
function IdentificationWorklist({ section }) {
  const lots = LOT_SECTIONS[section] || [];
  const [search, setSearch] = useState('');
  const [expandedLot, setExpandedLot] = useState(null);
  const [deconLot, setDeconLot] = useState(null);
  const [deconModalOpen, setDeconModalOpen] = useState(false);

  const handleDeconOpen = (lot) => { setDeconLot(lot); setDeconModalOpen(true); };

  const filtered = lots.filter(lot =>
    !search || lot.id.toLowerCase().includes(search.toLowerCase()) || lot.site.toLowerCase().includes(search.toLowerCase())
  );

  const isDeconSection = section === 'deconvolution';

  const wlHeaders = [
    { key: 'expand',        header: '' },
    { key: 'id',            header: 'Lot ID' },
    { key: 'site',          header: 'Sampling Site' },
    { key: 'trapType',      header: 'Trap Type' },
    { key: 'collectionDate',header: 'Collection Date' },
    { key: 'group',         header: 'Group' },
    { key: 'progress',      header: 'Progress' },
    ...(isDeconSection ? [{ key: 'deconStatus', header: 'Decon Status' }] : [{ key: 'idStatus', header: 'ID Status' }]),
  ];

  const rows = filtered.map(lot => ({
    id: lot.id,
    expand:         <span style={{ cursor: 'pointer', userSelect: 'none', color: '#0f62fe' }}>{expandedLot === lot.id ? '▼' : '▶'}</span>,
    site:           lot.site,
    trapType:       lot.trapType,
    collectionDate: lot.collectionDate,
    group:          <GroupTag group={lot.group} />,
    progress:       <span style={{ fontSize: 13 }}>{lot.identified}/{lot.specimenCount}</span>,
    ...(isDeconSection
      ? { deconStatus: <StatusTag status={lot.deconStatus === 'COMPLETE' ? 'DECON_COMPLETE' : 'DECON_PROGRESS'} /> }
      : { idStatus: <StatusTag status={lot.status} /> }),
  }));

  const sectionLabel = {
    pendingId:     'Pending Identification',
    inProgress:    'In Progress',
    deconvolution: 'Deconvolution',
    complete:      'Complete',
  }[section] || '';

  return (
    <Stack gap={5}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
          Vector Identification — {sectionLabel}
        </h2>
        <p style={{ color: '#525252', fontSize: 14 }}>
          {section === 'pendingId'    && 'Lots received and awaiting species identification. Click a row to begin.'}
          {section === 'inProgress'   && 'Lots with identification work currently in progress.'}
          {section === 'deconvolution'&& 'Pooled lots with a positive pathogen result requiring deconvolution.'}
          {section === 'complete'     && 'Lots with all specimens fully identified.'}
        </p>
      </div>

      <DataTable rows={rows} headers={wlHeaders}>
        {({ rows: tRows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <TableContainer>
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch
                  placeholder="Search lots…"
                  onChange={e => setSearch(e.target.value)}
                />
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()} size="md">
              <TableHead>
                <TableRow>
                  {headers.map(h => (
                    <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tRows.map(row => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      {...getRowProps({ row })}
                      onClick={() => setExpandedLot(prev => prev === row.id ? null : row.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                    </TableRow>
                    {expandedLot === row.id && (
                      <TableRow>
                        <TableCell colSpan={headers.length} style={{ padding: 0 }}>
                          <LotDetail
                            lot={filtered.find(l => l.id === row.id)}
                            onDeconOpen={handleDeconOpen}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      <DeconvolutionModal
        open={deconModalOpen}
        onClose={() => setDeconModalOpen(false)}
        lotId={deconLot?.id || ''}
      />
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Test Panels — redirect notice to unified Panel admin
// ---------------------------------------------------------------------------
function TestPanelsSection() {
  return (
    <Stack gap={5}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
          Vector Test Panels
        </h2>
        <p style={{ color: '#525252', fontSize: 14 }}>
          Vector test panels are configured in the unified Panel Setup admin page.
        </p>
      </div>

      <Tile>
        <Stack gap={4}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Admin → Panel Setup</p>
              <p style={{ fontSize: 14, color: '#525252', lineHeight: 1.5 }}>
                Panel configuration is centralised in <strong>Admin → Panel Setup</strong>.
                To view or create vector panels, filter the panel list by <strong>Domain = VECTOR</strong>.
                The panel editor includes a <strong>Vector Config</strong> tab — visible when Domain is VECTOR or ALL —
                where you can set an organism group filter hint used at order entry to suggest matching panels.
              </p>
            </div>
            <Button kind="tertiary" renderIcon={ArrowRight} size="sm">
              Go to Panel Setup
            </Button>
          </div>

          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#525252' }}>
              Quick reference — active VECTOR panels
            </p>
            <DataTable
              rows={[
                { id: 'p1', name: 'Dengue Surveillance Panel',   domain: 'VECTOR', group: 'MOSQUITO', testCount: 2, active: true },
                { id: 'p2', name: 'Malaria Vector Panel',        domain: 'VECTOR', group: 'MOSQUITO', testCount: 2, active: true },
                { id: 'p3', name: 'Tick-Borne Panel (Basic)',    domain: 'VECTOR', group: 'TICK',     testCount: 2, active: true },
                { id: 'p4', name: 'Arbovirus Expanded Panel',    domain: 'ALL',    group: 'MOSQUITO', testCount: 3, active: false },
              ]}
              headers={[
                { key: 'name',      header: 'Panel Name' },
                { key: 'domain',    header: 'Domain' },
                { key: 'group',     header: 'Organism Group' },
                { key: 'testCount', header: 'Tests' },
                { key: 'status',    header: 'Status' },
              ].map(h => h)}
            >
              {({ rows: tRows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                <TableContainer>
                  <Table {...getTableProps()} size="sm">
                    <TableHead>
                      <TableRow>
                        {headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tRows.map(row => {
                        const panel = [
                          { id: 'p1', name: 'Dengue Surveillance Panel',   domain: 'VECTOR', group: 'MOSQUITO', testCount: 2, active: true },
                          { id: 'p2', name: 'Malaria Vector Panel',        domain: 'VECTOR', group: 'MOSQUITO', testCount: 2, active: true },
                          { id: 'p3', name: 'Tick-Borne Panel (Basic)',    domain: 'VECTOR', group: 'TICK',     testCount: 2, active: true },
                          { id: 'p4', name: 'Arbovirus Expanded Panel',    domain: 'ALL',    group: 'MOSQUITO', testCount: 3, active: false },
                        ].find(p => p.id === row.id);
                        return (
                          <TableRow key={row.id} {...getRowProps({ row })}>
                            {row.cells.map(cell => {
                              let val = cell.value;
                              if (cell.info.header === 'domain') {
                                const domainColor = { VECTOR: 'purple', ALL: 'gray', CLINICAL: 'blue', ENVIRONMENTAL: 'teal' };
                                val = <Tag kind={domainColor[cell.value] || 'gray'} size="sm">{cell.value}</Tag>;
                              } else if (cell.info.header === 'group') {
                                val = <GroupTag group={cell.value} />;
                              } else if (cell.info.header === 'status') {
                                val = panel?.active
                                  ? <Tag kind="green" size="sm">Active</Tag>
                                  : <Tag kind="gray"  size="sm">Inactive</Tag>;
                              }
                              return <TableCell key={cell.id}>{val}</TableCell>;
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          </div>
        </Stack>
      </Tile>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Root — SideNav + content layout
// ---------------------------------------------------------------------------
export default function VectorTestingIdentification() {
  // section keys: 'pendingId' | 'inProgress' | 'deconvolution' | 'complete' | 'testPanels'
  const [activeSection, setActiveSection] = useState('pendingId');

  const counts = {
    pendingId:     LOT_SECTIONS.pendingId.length,
    inProgress:    LOT_SECTIONS.inProgress.length,
    deconvolution: LOT_SECTIONS.deconvolution.length,
    complete:      LOT_SECTIONS.complete.length,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f4f4' }}>
      {/* ---- SideNav ---- */}
      <SideNav
        isFixedNav
        expanded
        isChildOfHeader={false}
        aria-label="Vector Surveillance navigation"
        style={{ position: 'sticky', top: 0, height: '100vh', background: '#161616', width: 256, flexShrink: 0 }}
      >
        <SideNavItems>
          {/* Section header */}
          <div style={{ padding: '1rem 1rem 0.5rem', fontSize: 11, fontWeight: 600, color: '#8d8d8d', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Vector Surveillance
          </div>

          {/* Vector Identification submenu */}
          <SideNavMenu title="Vector Identification" defaultExpanded>
            <SideNavMenuItem
              isActive={activeSection === 'pendingId'}
              onClick={() => setActiveSection('pendingId')}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                Pending ID <NavBadge count={counts.pendingId} />
              </span>
            </SideNavMenuItem>
            <SideNavMenuItem
              isActive={activeSection === 'inProgress'}
              onClick={() => setActiveSection('inProgress')}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                In Progress <NavBadge count={counts.inProgress} />
              </span>
            </SideNavMenuItem>
            <SideNavMenuItem
              isActive={activeSection === 'deconvolution'}
              onClick={() => setActiveSection('deconvolution')}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                Deconvolution <NavBadge count={counts.deconvolution} alert />
              </span>
            </SideNavMenuItem>
            <SideNavMenuItem
              isActive={activeSection === 'complete'}
              onClick={() => setActiveSection('complete')}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                Complete <NavBadge count={counts.complete} />
              </span>
            </SideNavMenuItem>
          </SideNavMenu>

          {/* Test Panels link */}
          <SideNavLink
            isActive={activeSection === 'testPanels'}
            onClick={() => setActiveSection('testPanels')}
          >
            Test Panels
          </SideNavLink>
        </SideNavItems>
      </SideNav>

      {/* ---- Main content ---- */}
      <main style={{ flex: 1, padding: 'var(--cds-spacing-07)', overflowY: 'auto' }}>
        {activeSection === 'testPanels' ? (
          <TestPanelsSection />
        ) : (
          <IdentificationWorklist section={activeSection} />
        )}
      </main>
    </div>
  );
}
