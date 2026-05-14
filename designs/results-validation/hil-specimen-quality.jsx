import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput,
  Button, IconButton, InlineNotification, Tag, Modal, Tile,
  Breadcrumb, BreadcrumbItem,
} from '@carbon/react';
import { Add, Edit, TrashCan, ChevronDown, ChevronUp, Save, Information, Warning, WarningAlt } from '@carbon/icons-react';

// i18n helper — wraps every visible string per Constitution Principle 1.
const t = (key, fallback) => fallback || key;

// ---- Mock data ----------------------------------------------------------------
const MOCK_GLOBAL = {
  id: 'global',
  scope: 'GLOBAL',
  testCode: null,
  testName: null,
  hChip: 1, hWarn: 2,
  iChip: 1, iWarn: 2,
  lChip: 1, lWarn: 2,
};
const MOCK_OVERRIDES = [
  { id: 't1', scope: 'TEST', testCode: 'POT', testName: 'Potassium', sectionName: 'Chemistry',
    hChip: 1, hWarn: 1, iChip: 1, iWarn: 2, lChip: 1, lWarn: 2 },
  { id: 't2', scope: 'TEST', testCode: 'LDH', testName: 'Lactate dehydrogenase', sectionName: 'Chemistry',
    hChip: 1, hWarn: 1, iChip: 1, iWarn: 2, lChip: 1, lWarn: 2 },
  { id: 't3', scope: 'TEST', testCode: 'AST', testName: 'Aspartate aminotransferase', sectionName: 'Chemistry',
    hChip: 1, hWarn: 1, iChip: 1, iWarn: 2, lChip: 1, lWarn: 2 },
  { id: 't4', scope: 'TEST', testCode: 'FHB', testName: 'Free hemoglobin', sectionName: 'Chemistry',
    hChip: 1, hWarn: 1, iChip: 1, iWarn: 3, lChip: 1, lWarn: 3 },
  { id: 't5', scope: 'TEST', testCode: 'TBI', testName: 'Total bilirubin', sectionName: 'Chemistry',
    hChip: 1, hWarn: 2, iChip: 1, iWarn: 1, lChip: 1, lWarn: 2 },
];

const TEST_OPTIONS = [
  { id: 'CRE', label: 'Creatinine (CRE)' },
  { id: 'GLU', label: 'Glucose (GLU)' },
  { id: 'ALT', label: 'Alanine aminotransferase (ALT)' },
  { id: 'NA',  label: 'Sodium (NA)' },
  { id: 'CA',  label: 'Calcium (CA)' },
  { id: 'TRG', label: 'Triglycerides (TRG)' },
];

// Validator-screen mock results
const MOCK_VALIDATOR_ROWS = [
  { id: 'r1', testCode: 'POT', testName: 'Potassium', value: '6.8', unit: 'mmol/L', refRange: '3.5 – 5.0',
    alerts: 'HH', method: 'Indirect ISE · Roche cobas c311',
    hil: { h: 2, i: 0, l: 0, source: 'ANALYZER', enteredBy: null, enteredAt: null, note: null } },
  { id: 'r2', testCode: 'GLU', testName: 'Glucose', value: '5.1', unit: 'mmol/L', refRange: '3.9 – 6.1',
    alerts: '', method: 'Hexokinase · Roche cobas c311',
    hil: { h: 1, i: 0, l: 0, source: 'ANALYZER', enteredBy: null, enteredAt: null, note: null } },
  { id: 'r3', testCode: 'TBI', testName: 'Total bilirubin', value: '54', unit: 'µmol/L', refRange: '< 21',
    alerts: 'H', method: 'Diazo · Roche cobas c311',
    hil: { h: 0, i: 2, l: 0, source: 'ANALYZER', enteredBy: null, enteredAt: null, note: null } },
  { id: 'r4', testCode: 'WBC', testName: 'White cell count', value: '11.2', unit: '10⁹/L', refRange: '4.0 – 10.0',
    alerts: 'H', method: 'Flow cytometry · Sysmex XN-1000',
    // No analyzer-emitted HIL — typical for hematology results without HIL parsing
    hil: { h: null, i: null, l: null, source: null, enteredBy: null, enteredAt: null, note: null } },
];

// ---- Helper functions ----------------------------------------------------------
function severityGlyph(s) {
  if (s === null || s === undefined) return '−';
  if (s === 0) return '−';
  if (s === 1) return '+';
  if (s === 2) return '++';
  if (s === 3) return '+++';
  return '?';
}

function maxIndex(hil) {
  return Math.max(hil.h ?? -1, hil.i ?? -1, hil.l ?? -1);
}

function chipKindFor(hil) {
  const m = maxIndex(hil);
  if (m >= 3) return 'red';
  if (m >= 2) return 'purple';
  if (m >= 1) return 'warm-gray';
  return null; // no chip rendered
}

function shouldRenderChip(hil) {
  return maxIndex(hil) >= 1;
}

function formatHilString(hil) {
  // 'H+ I− L−' style
  return `H${severityGlyph(hil.h)} I${severityGlyph(hil.i)} L${severityGlyph(hil.l)}`;
}

function severityWord(s) {
  if (s === null || s === undefined) return t('validator.hil.severity.notMeasured', 'not measured');
  if (s === 0) return t('validator.hil.severity.absent', 'absent');
  if (s === 1) return t('validator.hil.severity.mild', 'mild');
  if (s === 2) return t('validator.hil.severity.moderate', 'moderate');
  if (s === 3) return t('validator.hil.severity.severe', 'severe');
  return '?';
}

function resolveThreshold(testCode, overrides, global) {
  const override = overrides.find(o => o.testCode === testCode);
  return override || global;
}

function shouldWarn(hil, threshold) {
  return (hil.h !== null && hil.h >= threshold.hWarn)
      || (hil.i !== null && hil.i >= threshold.iWarn)
      || (hil.l !== null && hil.l >= threshold.lWarn);
}

// ---- HIL Chip component --------------------------------------------------------
function HilChip({ hil, ariaLabel }) {
  if (!shouldRenderChip(hil)) return null;
  const kind = chipKindFor(hil);
  return (
    <Tag
      type={kind}
      size="sm"
      title={
        `${t('validator.hil.severity.' + (hil.h === null ? 'notMeasured' : ['absent','mild','moderate','severe'][hil.h]),
             severityWord(hil.h))} hemolysis · ` +
        `${severityWord(hil.i)} icterus · ${severityWord(hil.l)} lipemia`
      }
      style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, marginLeft: '0.5rem' }}
    >
      {formatHilString(hil)}
    </Tag>
  );
}

// ---- Surface 1: Admin Thresholds page ------------------------------------------
function AdminThresholdsPage() {
  const [overrides, setOverrides] = useState(MOCK_OVERRIDES);
  const [global, setGlobal] = useState(MOCK_GLOBAL);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const allRows = useMemo(() => [global, ...overrides], [global, overrides]);

  const toggleRow = (id) => setExpandedRow(prev => prev === id ? null : id);

  const handleSaveRow = (id, edits) => {
    if (id === 'global') setGlobal(prev => ({ ...prev, ...edits }));
    else setOverrides(prev => prev.map(o => o.id === id ? { ...o, ...edits } : o));
    setExpandedRow(null);
  };

  const handleDeleteOverride = (id) => {
    setOverrides(prev => prev.filter(o => o.id !== id));
    setConfirmDelete(null);
    setExpandedRow(null);
  };

  return (
    <div>
      <Breadcrumb noTrailingSlash style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        <BreadcrumbItem href="#">{t('breadcrumb.admin', 'Admin')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('breadcrumb.testCatalog', 'Test Catalog Management')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('admin.testCatalog.hil.nav.thresholds', 'HIL thresholds')}</BreadcrumbItem>
      </Breadcrumb>

      <h2 style={{ marginBottom: 'var(--cds-spacing-03)' }}>
        {t('admin.testCatalog.hil.thresholds.heading', 'HIL specimen-quality thresholds')}
      </h2>
      <p style={{ marginBottom: 'var(--cds-spacing-06)', color: 'var(--cds-text-secondary)', maxWidth: '640px' }}>
        {t('admin.testCatalog.hil.thresholds.desc',
           'Set lab-wide and per-test thresholds for hemolysis, icterus, and lipemia. ' +
           'Thresholds determine when a result row shows the HIL chip and when releasing the result requires a typed reason.')}
      </p>

      <InlineNotification
        kind="info"
        lowContrast
        hideCloseButton
        title={t('admin.testCatalog.hil.thresholds.severityScale.title', 'Severity scale')}
        subtitle={t('admin.testCatalog.hil.thresholds.severityScale.body',
                    '0 = absent · 1 = mild · 2 = moderate · 3 = severe. Warn-at must be ≥ chip-at for each interference type.')}
        style={{ marginBottom: 'var(--cds-spacing-05)' }}
      />

      <DataTable rows={allRows.map(r => ({ ...r, id: r.id }))} headers={[
        { key: 'testName', header: t('admin.testCatalog.hil.thresholds.col.test', 'Test') },
        { key: 'hChip',    header: t('admin.testCatalog.hil.thresholds.col.hChip', 'H chip ≥') },
        { key: 'hWarn',    header: t('admin.testCatalog.hil.thresholds.col.hWarn', 'H warn ≥') },
        { key: 'iChip',    header: t('admin.testCatalog.hil.thresholds.col.iChip', 'I chip ≥') },
        { key: 'iWarn',    header: t('admin.testCatalog.hil.thresholds.col.iWarn', 'I warn ≥') },
        { key: 'lChip',    header: t('admin.testCatalog.hil.thresholds.col.lChip', 'L chip ≥') },
        { key: 'lWarn',    header: t('admin.testCatalog.hil.thresholds.col.lWarn', 'L warn ≥') },
        { key: 'actions',  header: '' },
      ]}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
          <TableContainer {...getTableContainerProps()}>
            <TableToolbar>
              <TableToolbarContent>
                <Button kind="primary" size="md" renderIcon={Add} onClick={() => setShowCreateModal(true)}>
                  {t('admin.testCatalog.hil.thresholds.addOverride', 'Add per-test override')}
                </Button>
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()} size="md">
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => {
                  const data = allRows.find(r => r.id === row.id);
                  const isGlobal = data.scope === 'GLOBAL';
                  const isExpanded = expandedRow === row.id;
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        style={isGlobal ? { background: 'var(--cds-layer-accent-01)' } : {}}
                      >
                        <TableCell>
                          {isGlobal ? (
                            <strong>
                              {t('admin.testCatalog.hil.thresholds.globalRow',
                                 'GLOBAL — applies to all tests not overridden below')}
                            </strong>
                          ) : (
                            <>
                              <strong>{data.testName}</strong>
                              <span style={{ color: 'var(--cds-text-secondary)', marginLeft: '0.5rem' }}>
                                {data.testCode} · {data.sectionName}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>{data.hChip}</TableCell>
                        <TableCell>
                          <strong style={data.hWarn !== global.hWarn && !isGlobal ? { color: 'var(--cds-support-warning)' } : {}}>
                            {data.hWarn}
                          </strong>
                        </TableCell>
                        <TableCell>{data.iChip}</TableCell>
                        <TableCell>{data.iWarn}</TableCell>
                        <TableCell>{data.lChip}</TableCell>
                        <TableCell>{data.lWarn}</TableCell>
                        <TableCell>
                          <Button kind="ghost" size="sm" onClick={() => toggleRow(row.id)}
                            renderIcon={isExpanded ? ChevronUp : ChevronDown}>
                            {t('button.edit', 'Edit')}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={headers.length}>
                            <ThresholdEditPanel
                              row={data}
                              isGlobal={isGlobal}
                              onSave={(edits) => handleSaveRow(row.id, edits)}
                              onCancel={() => setExpandedRow(null)}
                              onDelete={isGlobal ? null : () => setConfirmDelete(row.id)}
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

      {overrides.length === 0 && (
        <Tile style={{ marginTop: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-06)' }}>
          <h4>{t('admin.testCatalog.hil.thresholds.empty.title', 'Most labs need overrides for sensitive tests')}</h4>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: 'var(--cds-spacing-03)' }}>
            {t('admin.testCatalog.hil.thresholds.empty.body',
               'Tests sensitive to interference (potassium, LDH, AST, free hemoglobin) typically use stricter thresholds. ' +
               'Add a per-test override above to fine-tune.')}
          </p>
        </Tile>
      )}

      {showCreateModal && (
        <CreateOverrideModal
          existingTestIds={overrides.map(o => o.testCode)}
          globalDefaults={global}
          onCreate={(newRow) => {
            setOverrides(prev => [...prev, { ...newRow, id: `t${Date.now()}` }]);
            setShowCreateModal(false);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {confirmDelete && (
        <Modal
          open
          modalHeading={t('admin.testCatalog.hil.thresholds.delete.title', 'Delete per-test override?')}
          primaryButtonText={t('button.delete', 'Delete')}
          secondaryButtonText={t('button.cancel', 'Cancel')}
          danger
          onRequestClose={() => setConfirmDelete(null)}
          onRequestSubmit={() => handleDeleteOverride(confirmDelete)}
        >
          <p>
            {t('admin.testCatalog.hil.thresholds.delete.body',
               'The test will revert to GLOBAL thresholds at the next validation or report render. Existing audit-log entries are preserved.')}
          </p>
        </Modal>
      )}
    </div>
  );
}

function ThresholdEditPanel({ row, isGlobal, onSave, onCancel, onDelete }) {
  const [edits, setEdits] = useState({
    hChip: row.hChip, hWarn: row.hWarn,
    iChip: row.iChip, iWarn: row.iWarn,
    lChip: row.lChip, lWarn: row.lWarn,
  });

  const validation = useMemo(() => ({
    h: edits.hWarn >= edits.hChip,
    i: edits.iWarn >= edits.iChip,
    l: edits.lWarn >= edits.lChip,
  }), [edits]);

  const allValid = validation.h && validation.i && validation.l;

  const setField = (k, v) => setEdits(prev => ({ ...prev, [k]: v }));

  return (
    <Tile style={{ padding: 'var(--cds-spacing-05)' }}>
      <Grid condensed>
        {[['h', 'Hemolysis'], ['i', 'Icterus'], ['l', 'Lipemia']].map(([k, label]) => (
          <Column lg={5} key={k} style={{ marginBottom: 'var(--cds-spacing-04)' }}>
            <h5 style={{ marginBottom: 'var(--cds-spacing-03)' }}>{label}</h5>
            <Stack gap={3}>
              <NumberInput
                id={`${row.id}-${k}-chip`}
                label={t(`admin.testCatalog.hil.thresholds.field.${k}Chip`, `Chip at severity ≥`)}
                helperText={t('admin.testCatalog.hil.thresholds.field.chipHelp',
                              'Below this, no chip on the result row.')}
                min={1} max={3} step={1} value={edits[`${k}Chip`]}
                onChange={(_, { value }) => setField(`${k}Chip`, Number(value))}
              />
              <NumberInput
                id={`${row.id}-${k}-warn`}
                label={t(`admin.testCatalog.hil.thresholds.field.${k}Warn`, `Warn-modal at severity ≥`)}
                helperText={t('admin.testCatalog.hil.thresholds.field.warnHelp',
                              'At this severity, releasing the result requires a typed reason.')}
                min={1} max={3} step={1} value={edits[`${k}Warn`]}
                onChange={(_, { value }) => setField(`${k}Warn`, Number(value))}
                invalid={!validation[k]}
                invalidText={t('admin.testCatalog.hil.thresholds.field.warnGteChip',
                               'Warn-at must be ≥ chip-at.')}
              />
            </Stack>
          </Column>
        ))}
      </Grid>
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button kind="primary" size="sm" disabled={!allValid} onClick={() => onSave(edits)} renderIcon={Save}>
          {t('button.save', 'Save')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>
          {t('button.cancel', 'Cancel')}
        </Button>
        {onDelete && (
          <Button kind="danger--ghost" size="sm" onClick={onDelete} renderIcon={TrashCan}>
            {t('button.delete', 'Delete override')}
          </Button>
        )}
      </Stack>
    </Tile>
  );
}

function CreateOverrideModal({ existingTestIds, globalDefaults, onCreate, onCancel }) {
  const [selectedTest, setSelectedTest] = useState(null);
  const [edits, setEdits] = useState({
    hChip: globalDefaults.hChip, hWarn: globalDefaults.hWarn,
    iChip: globalDefaults.iChip, iWarn: globalDefaults.iWarn,
    lChip: globalDefaults.lChip, lWarn: globalDefaults.lWarn,
  });

  const isDuplicate = selectedTest && existingTestIds.includes(selectedTest.id);
  const valid = selectedTest && !isDuplicate
    && edits.hWarn >= edits.hChip && edits.iWarn >= edits.iChip && edits.lWarn >= edits.lChip;

  return (
    <Modal
      open
      modalHeading={t('admin.testCatalog.hil.thresholds.create.title', 'Add per-test threshold override')}
      primaryButtonText={t('button.add', 'Add override')}
      secondaryButtonText={t('button.cancel', 'Cancel')}
      primaryButtonDisabled={!valid}
      onRequestClose={onCancel}
      onRequestSubmit={() => onCreate({
        scope: 'TEST',
        testCode: selectedTest.id,
        testName: selectedTest.label.replace(/\s*\([^)]+\)\s*$/, ''),
        sectionName: 'Chemistry',
        ...edits,
      })}
    >
      <Stack gap={5}>
        <ComboBox
          id="hil-add-test"
          titleText={t('admin.testCatalog.hil.thresholds.create.test', 'Test')}
          placeholder={t('admin.testCatalog.hil.thresholds.create.testPlaceholder', 'Search test code or name')}
          items={TEST_OPTIONS}
          itemToString={item => item ? item.label : ''}
          onChange={({ selectedItem }) => setSelectedTest(selectedItem)}
          invalid={isDuplicate}
          invalidText={t('admin.testCatalog.hil.thresholds.create.duplicate',
                         'A threshold override already exists for this test.')}
        />
        <Grid condensed>
          {[['h', 'Hemolysis'], ['i', 'Icterus'], ['l', 'Lipemia']].map(([k, label]) => (
            <Column lg={16} key={k} style={{ marginBottom: 'var(--cds-spacing-03)' }}>
              <h6>{label}</h6>
              <Grid condensed>
                <Column lg={8}>
                  <NumberInput id={`new-${k}-chip`} label="Chip at ≥" min={1} max={3} step={1}
                    value={edits[`${k}Chip`]} onChange={(_, { value }) => setEdits(p => ({ ...p, [`${k}Chip`]: Number(value) }))} />
                </Column>
                <Column lg={8}>
                  <NumberInput id={`new-${k}-warn`} label="Warn at ≥" min={1} max={3} step={1}
                    value={edits[`${k}Warn`]} onChange={(_, { value }) => setEdits(p => ({ ...p, [`${k}Warn`]: Number(value) }))}
                    invalid={edits[`${k}Warn`] < edits[`${k}Chip`]}
                    invalidText={t('admin.testCatalog.hil.thresholds.field.warnGteChip', 'Warn-at must be ≥ chip-at.')} />
                </Column>
              </Grid>
            </Column>
          ))}
        </Grid>
      </Stack>
    </Modal>
  );
}

// ---- Surface 2: Validator screen with chip + manual entry + warn modal ---------
function ValidatorPage() {
  const [rows, setRows] = useState(MOCK_VALIDATOR_ROWS);
  const [warnModal, setWarnModal] = useState(null); // { rowId, threshold, reason }
  const [manualEntryRow, setManualEntryRow] = useState(null); // rowId
  const [recentValidations, setRecentValidations] = useState([]);

  const handleValidate = (row) => {
    const threshold = resolveThreshold(row.testCode, MOCK_OVERRIDES, MOCK_GLOBAL);
    if (shouldWarn(row.hil, threshold)) {
      setWarnModal({ rowId: row.id, threshold, reason: '' });
      return;
    }
    setRecentValidations(prev => [...prev, row.id]);
  };

  const handleOverrideAndRelease = () => {
    setRecentValidations(prev => [...prev, warnModal.rowId]);
    setWarnModal(null);
  };

  const handleManualSave = (rowId, hil) => {
    setRows(prev => prev.map(r =>
      r.id === rowId
        ? { ...r, hil: { ...hil, source: 'MANUAL', enteredBy: 'AKM (current user)', enteredAt: new Date().toISOString() } }
        : r
    ));
    setManualEntryRow(null);
  };

  return (
    <div>
      <Breadcrumb noTrailingSlash style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        <BreadcrumbItem href="#">{t('breadcrumb.results', 'Results')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('breadcrumb.validator', 'Result validation')}</BreadcrumbItem>
      </Breadcrumb>

      <h2 style={{ marginBottom: 'var(--cds-spacing-03)' }}>
        {t('validator.heading', 'Result validation')}
      </h2>
      <p style={{ color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-06)', maxWidth: '640px' }}>
        {t('validator.desc',
           'Accession DJ25-000187 · Doe, John M. · Sample collected 14 Apr 2026 08:55. Review each result and click Validate to release.')}
      </p>

      <DataTable rows={rows.map(r => ({ ...r, id: r.id }))} headers={[
        { key: 'testName', header: 'Test' },
        { key: 'value',    header: 'Result' },
        { key: 'refRange', header: 'Reference range' },
        { key: 'unit',     header: 'Units' },
        { key: 'alerts',   header: 'Alerts' },
        { key: 'actions',  header: '' },
      ]}>
        {({ rows: dtRows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
          <TableContainer {...getTableContainerProps()}>
            <Table {...getTableProps()} size="md">
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dtRows.map(dtRow => {
                  const data = rows.find(r => r.id === dtRow.id);
                  const validated = recentValidations.includes(data.id);
                  const showAddHil = data.hil.source === null && !validated;
                  return (
                    <React.Fragment key={dtRow.id}>
                      <TableRow style={validated ? { background: 'var(--cds-layer-accent-01)', opacity: 0.6 } : {}}>
                        <TableCell>
                          <strong>{data.testName}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', fontStyle: 'italic' }}>
                            {data.method}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span style={{ fontWeight: data.alerts ? 600 : 400 }}>{data.value}</span>
                          {/* Critical chip from round-3 patient-report redesign — co-renders with HIL chip */}
                          {data.alerts === 'HH' && (
                            <Tag type="red" size="sm" style={{ marginLeft: '0.5rem' }}>⇈ Critical</Tag>
                          )}
                          <HilChip hil={data.hil} />
                        </TableCell>
                        <TableCell>{data.refRange}</TableCell>
                        <TableCell>{data.unit}</TableCell>
                        <TableCell>
                          {data.alerts && (
                            <Tag type={data.alerts === 'HH' ? 'red' : 'red'} size="sm">{data.alerts}</Tag>
                          )}
                        </TableCell>
                        <TableCell style={{ whiteSpace: 'nowrap' }}>
                          {showAddHil && (
                            <Button kind="ghost" size="sm" onClick={() => setManualEntryRow(data.id)} renderIcon={Add}>
                              {t('validator.hil.addHilCta', 'Add HIL')}
                            </Button>
                          )}
                          {!validated && (
                            <Button kind="primary" size="sm" onClick={() => handleValidate(data)}>
                              {t('button.validate', 'Validate')}
                            </Button>
                          )}
                          {validated && <Tag type="green" size="sm">Released</Tag>}
                        </TableCell>
                      </TableRow>
                      {manualEntryRow === data.id && (
                        <TableRow>
                          <TableCell colSpan={headers.length}>
                            <ManualEntryPanel
                              initial={data.hil}
                              onSave={(hil) => handleManualSave(data.id, hil)}
                              onCancel={() => setManualEntryRow(null)}
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

      {warnModal && (
        <WarnReleaseModal
          row={rows.find(r => r.id === warnModal.rowId)}
          threshold={warnModal.threshold}
          reason={warnModal.reason}
          onReasonChange={(v) => setWarnModal(prev => ({ ...prev, reason: v }))}
          onOverride={handleOverrideAndRelease}
          onCancel={() => setWarnModal(null)}
        />
      )}
    </div>
  );
}

function ManualEntryPanel({ initial, onSave, onCancel }) {
  const [hil, setHil] = useState({
    h: initial.h ?? '',
    i: initial.i ?? '',
    l: initial.l ?? '',
    note: initial.note ?? '',
  });

  const valid = (hil.h !== '' || hil.i !== '' || hil.l !== '');

  const numOrNull = (v) => v === '' ? null : Number(v);

  return (
    <Tile style={{ padding: 'var(--cds-spacing-05)' }}>
      <h5 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        {t('validator.hil.manual.heading', 'Add specimen-quality flags')}
      </h5>
      <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--cds-spacing-05)' }}>
        {t('validator.hil.manual.severityHelp',
           '0 = absent · 1 = mild · 2 = moderate · 3 = severe. Leave blank for "not measured".')}
      </p>
      <Grid condensed>
        <Column lg={4}>
          <NumberInput id="manual-h" label={t('validator.hil.manual.hLabel', 'Hemolysis')} min={0} max={3} step={1}
            value={hil.h} onChange={(_, { value }) => setHil(p => ({ ...p, h: value === '' ? '' : Number(value) }))} />
        </Column>
        <Column lg={4}>
          <NumberInput id="manual-i" label={t('validator.hil.manual.iLabel', 'Icterus')} min={0} max={3} step={1}
            value={hil.i} onChange={(_, { value }) => setHil(p => ({ ...p, i: value === '' ? '' : Number(value) }))} />
        </Column>
        <Column lg={4}>
          <NumberInput id="manual-l" label={t('validator.hil.manual.lLabel', 'Lipemia')} min={0} max={3} step={1}
            value={hil.l} onChange={(_, { value }) => setHil(p => ({ ...p, l: value === '' ? '' : Number(value) }))} />
        </Column>
        <Column lg={16} style={{ marginTop: 'var(--cds-spacing-04)' }}>
          <TextArea id="manual-note" labelText={t('validator.hil.manual.note', 'Note (optional)')}
            placeholder="e.g. Sample slightly cloudy on receipt; flagged at intake."
            value={hil.note} onChange={(e) => setHil(p => ({ ...p, note: e.target.value }))} rows={2} />
        </Column>
      </Grid>
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button kind="primary" size="sm" disabled={!valid}
          onClick={() => onSave({ h: numOrNull(hil.h), i: numOrNull(hil.i), l: numOrNull(hil.l), note: hil.note || null })}>
          {t('validator.hil.manual.apply', 'Apply')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>
          {t('validator.hil.manual.cancel', 'Cancel')}
        </Button>
      </Stack>
    </Tile>
  );
}

function WarnReleaseModal({ row, threshold, reason, onReasonChange, onOverride, onCancel }) {
  const breaches = [];
  if (row.hil.h !== null && row.hil.h >= threshold.hWarn) {
    breaches.push(`${severityWord(row.hil.h)} hemolysis (≥ ${threshold.hWarn} threshold for ${row.testName})`);
  }
  if (row.hil.i !== null && row.hil.i >= threshold.iWarn) {
    breaches.push(`${severityWord(row.hil.i)} icterus (≥ ${threshold.iWarn} threshold for ${row.testName})`);
  }
  if (row.hil.l !== null && row.hil.l >= threshold.lWarn) {
    breaches.push(`${severityWord(row.hil.l)} lipemia (≥ ${threshold.lWarn} threshold for ${row.testName})`);
  }

  const reasonValid = reason.trim().length >= 8;

  return (
    <Modal
      open
      modalHeading={t('validator.hil.warnModal.title', 'Specimen quality threshold exceeded')}
      primaryButtonText={t('validator.hil.warnModal.override', 'Override and release')}
      secondaryButtonText={t('validator.hil.warnModal.cancel', 'Cancel — return to validator')}
      primaryButtonDisabled={!reasonValid}
      danger
      preventCloseOnClickOutside
      onRequestClose={onCancel}
      onRequestSubmit={onOverride}
    >
      <Stack gap={5}>
        <InlineNotification
          kind="warning"
          lowContrast
          hideCloseButton
          title={`${row.testName}: ${row.value} ${row.unit}`}
          subtitle={`Reference: ${row.refRange}${row.alerts ? ` · ${row.alerts}` : ''}`}
        />
        <div>
          <p style={{ fontWeight: 600, marginBottom: 'var(--cds-spacing-03)' }}>
            {t('validator.hil.warnModal.breachLabel', 'Threshold breaches:')}
          </p>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--cds-text-primary)' }}>
            {breaches.map((b, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{b}</li>)}
          </ul>
        </div>
        <TextArea
          id="warn-reason"
          labelText={t('validator.hil.warnModal.reason', 'Release reason (required)')}
          placeholder={t('validator.hil.warnModal.reasonPlaceholder',
                         'e.g. Sample recollection refused by patient; result released with clinical note.')}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          invalid={reason.length > 0 && !reasonValid}
          invalidText={t('validator.hil.warnModal.reasonShort',
                         'Release reason must be at least 8 characters.')}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', fontStyle: 'italic' }}>
          {t('validator.hil.warnModal.audit',
             'Override and release will be audit-logged with your user, the timestamp, this reason, and a snapshot of the breached threshold(s).')}
        </p>
      </Stack>
    </Modal>
  );
}

// ---- Surface 3: Patient report illustration -----------------------------------
function ReportIllustration() {
  return (
    <div>
      <h2 style={{ marginBottom: 'var(--cds-spacing-03)' }}>
        {t('report.preview.heading', 'Patient report — HIL chip rendering')}
      </h2>
      <p style={{ color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-06)', maxWidth: '720px' }}>
        {t('report.preview.desc',
           'Illustrates how the HIL chip from this feature lights up the dormant slot designed in patient-report-redesign-spec.md §18. ' +
           'The JRXML wires the field today; once this feature ships, the chip renders on every deployment that emits HIL or has techs entering it manually.')}
      </p>
      <Tile style={{ background: '#fff', padding: 'var(--cds-spacing-06)', maxWidth: '720px',
                     fontFamily: 'IBM Plex Sans, sans-serif' }}>
        <div style={{ borderTop: '1.5px solid #161616', paddingTop: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                        color: '#295785' }}>
            Chemistry · Serum · SST
          </div>
        </div>
        {[
          { test: 'Potassium', method: 'Indirect ISE · Roche cobas c311', value: '6.8', ref: '3.5 – 5.0', uom: 'mmol/L', flag: 'HH', hil: { h: 2, i: 0, l: 0 }, critical: true },
          { test: 'Total bilirubin', method: 'Diazo · Roche cobas c311', value: '54', ref: '< 21', uom: 'µmol/L', flag: 'H', hil: { h: 0, i: 2, l: 0 }, critical: false },
          { test: 'Triglycerides', method: 'GPO-PAP · Roche cobas c311', value: '4.8', ref: '< 1.7', uom: 'mmol/L', flag: 'H', hil: { h: 0, i: 0, l: 3 }, critical: false },
          { test: 'Glucose', method: 'Hexokinase · Roche cobas c311', value: '5.1', ref: '3.9 – 6.1', uom: 'mmol/L', flag: '', hil: { h: 1, i: 0, l: 0 }, critical: false },
        ].map((r, i) => (
          <div key={i} style={{
            padding: '6px 0', borderBottom: '1px solid #e0e0e0', display: 'grid',
            gridTemplateColumns: '3fr 0.6fr 1.4fr 1.4fr 0.8fr 0.5fr',
            gap: '8px', alignItems: 'baseline',
            paddingLeft: r.critical ? '6px' : '8px',
            borderLeft: r.critical ? '6px solid #a00000' : '3px solid transparent',
            background: r.critical ? '#ffe0e0' : 'transparent',
          }}>
            <span>
              <strong>{r.test}</strong>
              <div style={{ fontSize: '8.5px', color: '#6f6f6f', fontStyle: 'normal', marginTop: '1px' }}>
                Method: {r.method}
                {shouldRenderChip(r.hil) && (
                  <span style={{
                    display: 'inline-block', background: '#fff8c5', border: '1px solid #e8d967',
                    fontFamily: 'IBM Plex Mono, monospace', fontSize: '8px', fontWeight: 700,
                    padding: '0 4px', marginLeft: '8px', borderRadius: '2px', color: '#525252',
                  }}>
                    {formatHilString(r.hil)}
                  </span>
                )}
              </div>
            </span>
            <span style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: '9.5px', color: '#6f6f6f' }}>SR</span>
            <span style={{ textAlign: 'right', fontWeight: r.critical ? 700 : 500,
                           color: r.critical ? '#a00000' : (r.flag ? '#da1e28' : '#161616') }}>
              {r.critical && '⇈ '}
              {r.value}
              {r.critical && (
                <span style={{ display: 'inline-block', background: '#a00000', color: '#fff', fontSize: '8px',
                               fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                               padding: '1px 5px', marginLeft: '6px', borderRadius: '2px' }}>
                  Critical
                </span>
              )}
            </span>
            <span style={{ color: '#525252' }}>{r.ref}</span>
            <span style={{ color: '#525252' }}>{r.uom}</span>
            <span style={{ textAlign: 'center', fontWeight: 700,
                           color: r.flag === 'HH' ? '#a00000' : (r.flag ? '#da1e28' : '#525252') }}>
              {r.flag}
            </span>
          </div>
        ))}
      </Tile>
      <p style={{ marginTop: 'var(--cds-spacing-05)', fontSize: '0.875rem', color: 'var(--cds-text-secondary)',
                  maxWidth: '720px', fontStyle: 'italic' }}>
        Note how Potassium shows both the round-3 critical visual (6pt rule + ⇈ glyph + CRITICAL chip) and the
        new HIL chip (yellow, mono `H++ I− L−`) on the method sub-line. The two chips co-render without
        collision per FRS §3.5 FR-25. Glucose shows mild hemolysis (`H+ I− L−`) but since glucose's threshold
        is the global default `chip_at = 1`, the chip renders without warning at validate time.
      </p>
    </div>
  );
}

// ---- App shell with tabs ------------------------------------------------------
export default function HilSpecimenQualityMockup() {
  const [tab, setTab] = useState(0);
  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
      <Tabs selectedIndex={tab} onChange={({ selectedIndex }) => setTab(selectedIndex)}>
        <TabList aria-label="HIL feature surfaces">
          <Tab>{t('tabs.admin', 'Admin: HIL Thresholds')}</Tab>
          <Tab>{t('tabs.validator', 'Validator: Chip + Manual + Warn')}</Tab>
          <Tab>{t('tabs.report', 'Patient report: Chip rendering')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel><AdminThresholdsPage /></TabPanel>
          <TabPanel><ValidatorPage /></TabPanel>
          <TabPanel><ReportIllustration /></TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
