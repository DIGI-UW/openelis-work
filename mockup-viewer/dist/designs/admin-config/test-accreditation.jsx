// Test Accreditation — OpenELIS Global mockup v4
//
// v4 changes:
//   - Dropped the Manage Tests scene / accreditation column entirely (deferred from V1).
//   - Added per-body logo_visibility_mode: 'ANY_ACCREDITED_TEST' (default) | 'PERCENTAGE'.
//     Body form shows a RadioButtonGroup; the Threshold (%) NumberInput only mounts
//     when PERCENTAGE is selected.
//   - Report preview branches on the mode per body.
//
// SideNav layout:
//   Test Catalog Management
//     ├─ Accrediting bodies      (CRUD + logo + visibility mode)
//     └─ Test accreditations     (filterable, bulk-extend, ?testId deep link)
//   Patient Reports
//     └─ Report preview          (mode-aware logo evaluation + notes line)
//
// Patterns referenced: P-01 Admin Table, P-02 Inline row-expand, P-03 Create modal,
// P-04 Confirm-delete, P-05 Form validation, P-06 Empty state, P-11 Bulk actions,
// P-13 Permission gate.

import React, { useState, useMemo, Fragment } from 'react';
import {
  Theme,
  HeaderContainer, Header, HeaderName, HeaderMenuButton,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem, SideNavLink,
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TableSelectAll, TableSelectRow, TableBatchActions, TableBatchAction,
  TextInput, Select, SelectItem, ComboBox, NumberInput, Toggle, DatePicker, DatePickerInput,
  RadioButtonGroup, RadioButton,
  Button, Tag, Modal, FileUploader, InlineNotification, Tile,
  Breadcrumb, BreadcrumbItem,
} from '@carbon/react';
import { Add, ChevronDown, ChevronUp, Save, TrashCan } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ---------- Mock data ----------
const TODAY = new Date('2026-04-22');
const daysUntil = (iso) => iso ? Math.round((new Date(iso) - TODAY) / 86400000) : null;

// Logo visibility modes
const MODE_ANY = 'ANY_ACCREDITED_TEST';
const MODE_PCT = 'PERCENTAGE';

const initialBodies = [
  { id: 'b1', code: 'ISO15189', name: 'ISO 15189 (SANAS)', logo: 'https://placehold.co/120x80/0f62fe/ffffff?text=ISO%2015189',
    logoVisibilityMode: MODE_ANY, thresholdPct: 80, displayOrder: 10, active: true },
  { id: 'b2', code: 'SANAS',    name: 'SANAS General',      logo: 'https://placehold.co/120x80/198038/ffffff?text=SANAS',
    logoVisibilityMode: MODE_PCT, thresholdPct: 50, displayOrder: 20, active: true },
  { id: 'b3', code: 'RETIRED',  name: 'Regional (legacy)',  logo: null,
    logoVisibilityMode: MODE_PCT, thresholdPct: 60, displayOrder: 30, active: false },
];

const initialTests = [
  { id: 't1', code: 'CBC',     name: 'Complete Blood Count',        section: 'Hematology' },
  { id: 't2', code: 'HGB',     name: 'Hemoglobin',                  section: 'Hematology' },
  { id: 't3', code: 'GLUC',    name: 'Glucose, serum',              section: 'Chemistry' },
  { id: 't4', code: 'CREAT',   name: 'Creatinine, serum',           section: 'Chemistry' },
  { id: 't5', code: 'AST',     name: 'Aspartate aminotransferase',  section: 'Chemistry' },
  { id: 't6', code: 'HIV-RAP', name: 'HIV rapid antibody',          section: 'Serology' },
  { id: 't7', code: 'MALARIA', name: 'Malaria smear',               section: 'Microbiology' },
  { id: 't8', code: 'UA',      name: 'Urinalysis, macro + micro',   section: 'Chemistry' },
];

const initialAccreditations = [
  { id: 'a1', testId: 't1', bodyId: 'b1', expires: '2027-03-15' },
  { id: 'a2', testId: 't2', bodyId: 'b1', expires: '2027-03-15' },
  { id: 'a3', testId: 't3', bodyId: 'b1', expires: '2026-06-02' }, // expiring
  { id: 'a4', testId: 't4', bodyId: 'b1', expires: '2026-05-05' }, // expiring
  { id: 'a5', testId: 't6', bodyId: 'b1', expires: '2025-11-30' }, // expired
  { id: 'a6', testId: 't8', bodyId: 'b1', expires: '2026-12-01' },
  { id: 'a7', testId: 't1', bodyId: 'b2', expires: '2027-01-15' }, // CBC also has SANAS
  { id: 'a8', testId: 't3', bodyId: 'b2', expires: '2027-01-15' },
];

const statusFor = (expires) => {
  const d = daysUntil(expires);
  if (d < 0)   return { kind: 'red',       label: `Expired ${expires}`, bucket: 'expired' };
  if (d <= 60) return { kind: 'warm-gray', label: `Expiring ${expires}`, bucket: 'expiring' };
  return { kind: 'green', label: `Active · ${expires}`, bucket: 'active' };
};

const visibilitySummary = (body) =>
  body.logoVisibilityMode === MODE_ANY
    ? t('admin.testCatalog.accred.bodies.col.visibilityAny', 'Any accredited test')
    : `≥ ${body.thresholdPct}%`;

// ==================== Accrediting Bodies page ====================

function AccreditingBodiesPage({ bodies, setBodies, accreditations }) {
  const [expandedId, setExpandedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newBody, setNewBody] = useState({
    code: '', name: '', logo: null,
    logoVisibilityMode: MODE_ANY, thresholdPct: 80, displayOrder: 10, active: true,
  });

  const counts = useMemo(() => {
    const m = {};
    for (const a of accreditations) {
      const s = statusFor(a.expires).bucket;
      if (s !== 'expired') m[a.bodyId] = (m[a.bodyId] || 0) + 1;
    }
    return m;
  }, [accreditations]);

  const openRow = (row) => {
    setExpandedId(row.id);
    setDraft({ ...row });
  };

  const saveRow = () => {
    setBodies(prev => prev.map(b => b.id === draft.id ? draft : b));
    setExpandedId(null);
  };

  const submitCreate = () => {
    const nextId = `b${bodies.length + 1}`;
    setBodies(prev => [...prev, { ...newBody, id: nextId }]);
    setCreateOpen(false);
    setNewBody({
      code: '', name: '', logo: null,
      logoVisibilityMode: MODE_ANY, thresholdPct: 80, displayOrder: 10, active: true,
    });
  };

  return (
    <div>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem>{t('nav.admin', 'Admin')}</BreadcrumbItem>
        <BreadcrumbItem>{t('nav.testCatalog', 'Test Catalog Management')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('nav.bodies', 'Accrediting bodies')}</BreadcrumbItem>
      </Breadcrumb>
      <h2 style={{ margin: '0.5rem 0 0' }}>
        {t('admin.testCatalog.accred.bodies.heading', 'Accrediting bodies')}
      </h2>
      <p style={{ color: 'var(--cds-text-secondary)', margin: '0.25rem 0 1.5rem' }}>
        {t('admin.testCatalog.accred.bodies.desc',
           'Create and manage accrediting bodies. Each body has its own logo and visibility rule applied to patient reports.')}
      </p>

      <Stack gap={4}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button renderIcon={Add} onClick={() => setCreateOpen(true)}>
            {t('admin.testCatalog.accred.bodies.addCta', 'Add accrediting body')}
          </Button>
        </div>

        <TableContainer>
          <Table size="md">
            <TableHead>
              <TableRow>
                <TableHeader>{t('admin.testCatalog.accred.bodies.col.code', 'Code')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.bodies.col.name', 'Name')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.bodies.col.logo', 'Logo')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.bodies.col.visibility', 'Logo visibility')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.bodies.col.count', 'Tests accredited')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.bodies.col.status', 'Status')}</TableHeader>
                <TableHeader></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {bodies.map(b => {
                const isOpen = expandedId === b.id;
                return (
                  <Fragment key={b.id}>
                    <TableRow>
                      <TableCell><code>{b.code}</code></TableCell>
                      <TableCell>{b.name}</TableCell>
                      <TableCell>
                        {b.logo
                          ? <img src={b.logo} alt="" style={{ maxHeight: 28, maxWidth: 80 }} />
                          : <span style={{ color: 'var(--cds-text-placeholder)' }}>—</span>}
                      </TableCell>
                      <TableCell>{visibilitySummary(b)}</TableCell>
                      <TableCell>{counts[b.id] || 0}</TableCell>
                      <TableCell>
                        {b.active
                          ? <Tag type="green">Active</Tag>
                          : <Tag type="gray">Inactive</Tag>}
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Button kind="ghost" size="sm"
                          onClick={() => (isOpen ? setExpandedId(null) : openRow(b))}
                          renderIcon={isOpen ? ChevronUp : ChevronDown}>
                          {t('button.edit', 'Edit')}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isOpen && draft && (
                      <TableRow>
                        <TableCell colSpan={7} style={{ background: 'var(--cds-layer)' }}>
                          <Tile style={{ padding: '1rem' }}>
                            <Grid narrow>
                              <Column lg={3} md={4} sm={4}>
                                <TextInput id={`code-${b.id}`} labelText="Code"
                                  value={draft.code} readOnly helperText="Immutable after creation" />
                              </Column>
                              <Column lg={5} md={4} sm={4}>
                                <TextInput id={`name-${b.id}`} labelText="Name"
                                  value={draft.name}
                                  onChange={e => setDraft({ ...draft, name: e.target.value })} />
                              </Column>
                              <Column lg={4} md={4} sm={4}>
                                <Toggle id={`active-${b.id}`} labelText="Active"
                                  toggled={draft.active}
                                  onToggle={v => setDraft({ ...draft, active: v })} />
                              </Column>
                              <Column lg={6} md={4} sm={4}>
                                <FileUploader
                                  labelTitle="Logo"
                                  labelDescription="PNG or SVG, up to 500 KB, at least 64×64 px."
                                  buttonLabel="Choose file"
                                  accept={['.png', '.svg']}
                                  filenameStatus="edit" />
                                {draft.logo && (
                                  <div style={{ marginTop: '0.5rem' }}>
                                    <img src={draft.logo} alt="" style={{ maxHeight: 60 }} />
                                  </div>
                                )}
                              </Column>

                              {/* Logo visibility — radio group + conditional % input */}
                              <Column lg={6} md={8} sm={4}>
                                <fieldset className="cds--fieldset" style={{ border: 'none', padding: 0, margin: 0 }}>
                                  <legend className="cds--label" style={{ marginBottom: '0.5rem' }}>
                                    {t('admin.testCatalog.accred.bodies.field.visibility', 'Logo visibility')}
                                  </legend>
                                  <RadioButtonGroup
                                    name={`visibility-${b.id}`}
                                    orientation="vertical"
                                    valueSelected={draft.logoVisibilityMode}
                                    onChange={val => setDraft({ ...draft, logoVisibilityMode: val })}
                                  >
                                    <RadioButton
                                      labelText={t(
                                        'admin.testCatalog.accred.bodies.field.visibilityAny',
                                        'Any test on the report is accredited by this body'
                                      )}
                                      value={MODE_ANY}
                                      id={`rb-any-${b.id}`}
                                    />
                                    <RadioButton
                                      labelText={t(
                                        'admin.testCatalog.accred.bodies.field.visibilityPct',
                                        'At least N% of tests on the report are accredited by this body'
                                      )}
                                      value={MODE_PCT}
                                      id={`rb-pct-${b.id}`}
                                    />
                                  </RadioButtonGroup>
                                  {/* Conditional mount — not just disabled */}
                                  {draft.logoVisibilityMode === MODE_PCT && (
                                    <div style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                                      <NumberInput
                                        id={`thresh-${b.id}`}
                                        label={t('admin.testCatalog.accred.bodies.field.threshold', 'Threshold (%)')}
                                        min={0} max={100} step={1}
                                        value={draft.thresholdPct}
                                        onChange={(_, { value }) =>
                                          setDraft({ ...draft, thresholdPct: Number(value) })
                                        }
                                        helperText={t(
                                          'admin.testCatalog.accred.bodies.field.visibilityPctHelp',
                                          'Logo only appears when the share of accredited tests on a report meets or exceeds this percentage.'
                                        )}
                                      />
                                    </div>
                                  )}
                                </fieldset>
                              </Column>

                              <Column lg={3} md={2} sm={4}>
                                <NumberInput id={`order-${b.id}`} label="Display order"
                                  helperText="Lower numbers appear first (leftmost) on the report. Ties break alphabetically on Code."
                                  min={0} step={1} value={draft.displayOrder}
                                  onChange={(_, { value }) => setDraft({ ...draft, displayOrder: Number(value) })} />
                              </Column>
                            </Grid>
                            <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                              <Button kind="primary" size="sm" renderIcon={Save} onClick={saveRow}>
                                {t('button.save', 'Save')}
                              </Button>
                              <Button kind="ghost" size="sm" onClick={() => setExpandedId(null)}>
                                {t('button.cancel', 'Cancel')}
                              </Button>
                              <span style={{ flex: 1 }} />
                              <Button kind="danger--ghost" size="sm" renderIcon={TrashCan}
                                disabled={(counts[b.id] || 0) > 0}
                                title={(counts[b.id] || 0) > 0
                                  ? `Cannot delete — ${counts[b.id]} test accreditations reference this body.`
                                  : ''}>
                                {t('button.delete', 'Delete body')}
                              </Button>
                            </Stack>
                          </Tile>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Modal
        open={createOpen}
        onRequestClose={() => setCreateOpen(false)}
        onRequestSubmit={submitCreate}
        modalHeading={t('admin.testCatalog.accred.bodies.addCta', 'Add accrediting body')}
        primaryButtonText={t('button.create', 'Create')}
        secondaryButtonText={t('button.cancel', 'Cancel')}
      >
        <Stack gap={4}>
          <TextInput id="newCode" labelText="Code" placeholder="e.g. ISO15189"
            helperText="Unique short code, immutable after creation."
            value={newBody.code}
            onChange={e => setNewBody({ ...newBody, code: e.target.value.toUpperCase() })} />
          <TextInput id="newName" labelText="Name"
            value={newBody.name}
            onChange={e => setNewBody({ ...newBody, name: e.target.value })} />
          <FileUploader labelTitle="Logo" labelDescription="PNG or SVG, up to 500 KB."
            buttonLabel="Choose file" accept={['.png', '.svg']} />

          <fieldset className="cds--fieldset" style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="cds--label" style={{ marginBottom: '0.5rem' }}>
              {t('admin.testCatalog.accred.bodies.field.visibility', 'Logo visibility')}
            </legend>
            <p style={{ color: 'var(--cds-text-secondary)', fontSize: 12, margin: '0 0 0.5rem' }}>
              {t(
                'admin.testCatalog.accred.bodies.field.visibilityHelp',
                "Choose when this body's logo appears on a patient report."
              )}
            </p>
            <RadioButtonGroup
              name="newVisibility"
              orientation="vertical"
              valueSelected={newBody.logoVisibilityMode}
              onChange={val => setNewBody({ ...newBody, logoVisibilityMode: val })}
            >
              <RadioButton
                labelText={t(
                  'admin.testCatalog.accred.bodies.field.visibilityAny',
                  'Any test on the report is accredited by this body'
                )}
                value={MODE_ANY}
                id="rb-any-new"
              />
              <RadioButton
                labelText={t(
                  'admin.testCatalog.accred.bodies.field.visibilityPct',
                  'At least N% of tests on the report are accredited by this body'
                )}
                value={MODE_PCT}
                id="rb-pct-new"
              />
            </RadioButtonGroup>
            {newBody.logoVisibilityMode === MODE_PCT && (
              <div style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                <NumberInput id="newThresh"
                  label={t('admin.testCatalog.accred.bodies.field.threshold', 'Threshold (%)')}
                  min={0} max={100} step={1}
                  value={newBody.thresholdPct}
                  onChange={(_, { value }) => setNewBody({ ...newBody, thresholdPct: Number(value) })}
                  helperText={t(
                    'admin.testCatalog.accred.bodies.field.visibilityPctHelp',
                    'Logo only appears when the share of accredited tests on a report meets or exceeds this percentage.'
                  )}
                />
              </div>
            )}
          </fieldset>

          <NumberInput id="newOrder" label="Display order" min={0}
            helperText="Lower numbers appear first (leftmost) on the report. Ties break alphabetically on Code."
            value={newBody.displayOrder}
            onChange={(_, { value }) => setNewBody({ ...newBody, displayOrder: Number(value) })} />
          <Toggle id="newActive" labelText="Active"
            toggled={newBody.active}
            onToggle={v => setNewBody({ ...newBody, active: v })} />
        </Stack>
      </Modal>
    </div>
  );
}

// ==================== Test Accreditations page ====================

function TestAccreditationsPage({ bodies, accreditations, setAccreditations, preselectedTestId, clearPreselection }) {
  const [query, setQuery]                 = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [bodyFilter, setBodyFilter]       = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [createOpen, setCreateOpen]       = useState(false);
  const [bulkOpen, setBulkOpen]           = useState(false);
  const [expandedId, setExpandedId]       = useState(null);
  const [draft, setDraft]                 = useState(null);

  // Add-modal form state
  const [newAcc, setNewAcc] = useState({ testId: '', bodyId: '', expires: '' });

  const bodyById = useMemo(() => Object.fromEntries(bodies.map(b => [b.id, b])), [bodies]);
  const testById = useMemo(() => Object.fromEntries(initialTests.map(tt => [tt.id, tt])), []);

  const enriched = accreditations.map(a => {
    const test = testById[a.testId];
    const body = bodyById[a.bodyId];
    return { ...a, test, body, status: statusFor(a.expires) };
  });

  const filtered = enriched.filter(r => {
    if (preselectedTestId && r.testId !== preselectedTestId) return false;
    if (statusFilter !== 'all' && r.status.bucket !== statusFilter) return false;
    if (bodyFilter !== 'all' && r.bodyId !== bodyFilter) return false;
    if (sectionFilter !== 'all' && r.test?.section !== sectionFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${r.test?.code} ${r.test?.name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    const order = { expired: 0, expiring: 1, active: 2 };
    if (order[a.status.bucket] !== order[b.status.bucket]) return order[a.status.bucket] - order[b.status.bucket];
    return a.expires.localeCompare(b.expires);
  });

  const expiredCount  = enriched.filter(r => r.status.bucket === 'expired').length;
  const expiringCount = enriched.filter(r => r.status.bucket === 'expiring').length;

  const sections = Array.from(new Set(initialTests.map(tt => tt.section))).sort();

  const openEdit = (row) => {
    setExpandedId(row.id);
    setDraft({ ...row });
  };

  const saveEdit = () => {
    setAccreditations(prev => prev.map(a => a.id === draft.id ? { id: a.id, testId: draft.testId, bodyId: draft.bodyId, expires: draft.expires } : a));
    setExpandedId(null);
  };

  const deleteRow = (id) => {
    setAccreditations(prev => prev.filter(a => a.id !== id));
    setExpandedId(null);
  };

  const submitAdd = () => {
    if (!newAcc.testId || !newAcc.bodyId || !newAcc.expires) return;
    const nextId = `a${accreditations.length + 1}`;
    setAccreditations(prev => [...prev, { id: nextId, ...newAcc }]);
    setCreateOpen(false);
    setNewAcc({ testId: '', bodyId: '', expires: '' });
  };

  const submitBulk = (newDate) => {
    if (!newDate) return;
    setAccreditations(prev => prev.map(a => selectedIds.has(a.id) ? { ...a, expires: newDate } : a));
    setSelectedIds(new Set());
    setBulkOpen(false);
  };

  return (
    <div>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem>{t('nav.admin', 'Admin')}</BreadcrumbItem>
        <BreadcrumbItem>{t('nav.testCatalog', 'Test Catalog Management')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('nav.accreditations', 'Test accreditations')}</BreadcrumbItem>
      </Breadcrumb>
      <h2 style={{ margin: '0.5rem 0 0' }}>
        {t('admin.testCatalog.accred.accreditations.heading', 'Test accreditations')}
      </h2>
      <p style={{ color: 'var(--cds-text-secondary)', margin: '0.25rem 0 1.5rem' }}>
        {t('admin.testCatalog.accred.accreditations.desc',
           'Track and maintain accreditation coverage across the test catalog. Filter by status, body, or section; bulk-extend expirations to match your renewal cycle.')}
      </p>

      <Stack gap={4}>
        {preselectedTestId && (
          <InlineNotification
            kind="info"
            lowContrast
            onCloseButtonClick={() => clearPreselection()}
            title={`Filtered to test: ${testById[preselectedTestId]?.name || preselectedTestId}`}
            subtitle="Close this notification or clear the filter to see all accreditations."
          />
        )}

        <InlineNotification
          kind={expiredCount > 0 ? 'warning' : 'info'}
          lowContrast
          hideCloseButton
          title={`${expiredCount} expired · ${expiringCount} expiring in the next 60 days`}
          subtitle="Default sort surfaces expired and expiring accreditations first."
        />

        <TableContainer>
          <TableToolbar>
            {selectedIds.size > 0 ? (
              <TableBatchActions
                totalSelected={selectedIds.size}
                onCancel={() => setSelectedIds(new Set())}
              >
                <TableBatchAction onClick={() => setBulkOpen(true)}>
                  {t('admin.testCatalog.accred.bulkExtend', 'Extend expiration')}
                </TableBatchAction>
              </TableBatchActions>
            ) : (
              <TableToolbarContent>
                <TableToolbarSearch persistent value={query}
                  onChange={e => setQuery(e.target.value || '')}
                  placeholder="Search tests" />
                <Select id="statusF" labelText="" hideLabel value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <SelectItem value="all" text="All statuses" />
                  <SelectItem value="active" text="Active" />
                  <SelectItem value="expiring" text="Expiring ≤ 60 days" />
                  <SelectItem value="expired" text="Expired" />
                </Select>
                <Select id="bodyF" labelText="" hideLabel value={bodyFilter} onChange={e => setBodyFilter(e.target.value)}>
                  <SelectItem value="all" text="All bodies" />
                  {bodies.map(b => <SelectItem key={b.id} value={b.id} text={b.name} />)}
                </Select>
                <Select id="secF" labelText="" hideLabel value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                  <SelectItem value="all" text="All sections" />
                  {sections.map(s => <SelectItem key={s} value={s} text={s} />)}
                </Select>
                <Button renderIcon={Add} onClick={() => setCreateOpen(true)}>
                  {t('admin.testCatalog.accred.accreditations.addCta', 'Add accreditation')}
                </Button>
              </TableToolbarContent>
            )}
          </TableToolbar>
          <Table size="md">
            <TableHead>
              <TableRow>
                <TableHeader><input type="checkbox"
                  checked={filtered.length > 0 && filtered.every(r => selectedIds.has(r.id))}
                  onChange={e => {
                    if (e.target.checked) setSelectedIds(new Set(filtered.map(r => r.id)));
                    else setSelectedIds(new Set());
                  }} /></TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.accreditations.col.testCode', 'Code')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.accreditations.col.testName', 'Test')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.accreditations.col.section', 'Section')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.accreditations.col.body', 'Body')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.accreditations.col.expires', 'Expires')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.accred.accreditations.col.status', 'Status')}</TableHeader>
                <TableHeader></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(r => {
                const isOpen = expandedId === r.id;
                return (
                  <Fragment key={r.id}>
                    <TableRow>
                      <TableCell>
                        <input type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={(e) => {
                            const next = new Set(selectedIds);
                            if (e.target.checked) next.add(r.id); else next.delete(r.id);
                            setSelectedIds(next);
                          }} />
                      </TableCell>
                      <TableCell><code>{r.test?.code}</code></TableCell>
                      <TableCell>{r.test?.name}</TableCell>
                      <TableCell>{r.test?.section}</TableCell>
                      <TableCell>{r.body?.name}</TableCell>
                      <TableCell>{r.expires}</TableCell>
                      <TableCell><Tag type={r.status.kind}>{r.status.label}</Tag></TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Button kind="ghost" size="sm"
                          onClick={() => (isOpen ? setExpandedId(null) : openEdit(r))}
                          renderIcon={isOpen ? ChevronUp : ChevronDown}>
                          {t('button.edit', 'Edit')}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isOpen && draft && (
                      <TableRow>
                        <TableCell colSpan={8} style={{ background: 'var(--cds-layer)' }}>
                          <Tile style={{ padding: '1rem' }}>
                            <Grid narrow>
                              <Column lg={4} md={4} sm={4}>
                                <TextInput id={`edit-test-${r.id}`} labelText="Test"
                                  value={`${r.test?.code} · ${r.test?.name}`}
                                  readOnly helperText="Immutable after creation — delete and recreate to change test." />
                              </Column>
                              <Column lg={4} md={4} sm={4}>
                                <TextInput id={`edit-body-${r.id}`} labelText="Accrediting body"
                                  value={r.body?.name}
                                  readOnly helperText="Immutable after creation." />
                              </Column>
                              <Column lg={4} md={4} sm={4}>
                                <DatePicker datePickerType="single" dateFormat="Y-m-d"
                                  value={draft.expires}
                                  onChange={(dates) => {
                                    if (dates[0]) {
                                      const iso = dates[0].toISOString().slice(0, 10);
                                      setDraft({ ...draft, expires: iso });
                                    }
                                  }}>
                                  <DatePickerInput id={`edit-exp-${r.id}`}
                                    placeholder="YYYY-MM-DD" labelText="Expires on"
                                    value={draft.expires}
                                    onChange={e => setDraft({ ...draft, expires: e.target.value })} />
                                </DatePicker>
                              </Column>
                            </Grid>
                            <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                              <Button kind="primary" size="sm" renderIcon={Save} onClick={saveEdit}>
                                {t('button.save', 'Save')}
                              </Button>
                              <Button kind="ghost" size="sm" onClick={() => setExpandedId(null)}>
                                {t('button.cancel', 'Cancel')}
                              </Button>
                              <span style={{ flex: 1 }} />
                              <Button kind="danger--ghost" size="sm" renderIcon={TrashCan}
                                onClick={() => deleteRow(r.id)}>
                                {t('button.delete', 'Delete')}
                              </Button>
                            </Stack>
                          </Tile>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Modal open={createOpen} onRequestClose={() => setCreateOpen(false)}
        onRequestSubmit={submitAdd}
        modalHeading="Add test accreditation"
        primaryButtonText="Create" secondaryButtonText="Cancel"
        primaryButtonDisabled={!newAcc.testId || !newAcc.bodyId || !newAcc.expires}>
        <Stack gap={4}>
          <ComboBox id="newAcc-test" titleText="Test"
            items={initialTests.map(tt => ({ id: tt.id, label: `${tt.code} · ${tt.name}` }))}
            itemToString={i => i ? i.label : ''}
            selectedItem={newAcc.testId ? { id: newAcc.testId, label: testById[newAcc.testId] ? `${testById[newAcc.testId].code} · ${testById[newAcc.testId].name}` : newAcc.testId } : null}
            onChange={({ selectedItem }) => setNewAcc({ ...newAcc, testId: selectedItem?.id || '' })} />
          <Select id="newAcc-body" labelText="Accrediting body"
            value={newAcc.bodyId}
            onChange={e => setNewAcc({ ...newAcc, bodyId: e.target.value })}>
            <SelectItem value="" text="Choose a body" />
            {bodies.filter(b => b.active).map(b => (
              <SelectItem key={b.id} value={b.id} text={b.name} />
            ))}
          </Select>
          <DatePicker datePickerType="single" dateFormat="Y-m-d"
            value={newAcc.expires}
            onChange={(dates) => {
              if (dates[0]) {
                const iso = dates[0].toISOString().slice(0, 10);
                setNewAcc({ ...newAcc, expires: iso });
              }
            }}>
            <DatePickerInput id="newAcc-exp" placeholder="YYYY-MM-DD" labelText="Expires on"
              value={newAcc.expires}
              onChange={e => setNewAcc({ ...newAcc, expires: e.target.value })} />
          </DatePicker>
        </Stack>
      </Modal>

      <BulkExtendModal
        open={bulkOpen}
        count={selectedIds.size}
        onCancel={() => setBulkOpen(false)}
        onSubmit={submitBulk} />
    </div>
  );
}

function BulkExtendModal({ open, count, onCancel, onSubmit }) {
  const [date, setDate] = useState('');
  return (
    <Modal open={open} onRequestClose={onCancel}
      onRequestSubmit={() => { onSubmit(date); setDate(''); }}
      modalHeading={`Extend expiration for ${count} accreditations`}
      primaryButtonText="Extend" secondaryButtonText="Cancel"
      primaryButtonDisabled={!date}>
      <Stack gap={4}>
        <p>All selected accreditations will have their expiration set to the date below.</p>
        <DatePicker datePickerType="single" dateFormat="Y-m-d"
          value={date}
          onChange={(dates) => {
            if (dates[0]) setDate(dates[0].toISOString().slice(0, 10));
          }}>
          <DatePickerInput id="bulkExpDate" placeholder="YYYY-MM-DD" labelText="New expiration date"
            value={date}
            onChange={e => setDate(e.target.value)} />
        </DatePicker>
      </Stack>
    </Modal>
  );
}

// ==================== Patient report preview ====================

function ReportPreviewPage({ bodies, accreditations }) {
  const bodyById = Object.fromEntries(bodies.map(b => [b.id, b]));
  const sampleTestIds = ['t1','t2','t3','t5','t7']; // 5 tests: CBC, HGB, GLUC, AST, MALARIA
  const tests = sampleTestIds.map(id => initialTests.find(tt => tt.id === id));
  const total = tests.length;

  // For each body, count tests on report with an active (non-expired) accreditation
  // and evaluate its logo_visibility_mode gate.
  const evalByBody = bodies.filter(b => b.active).map(b => {
    const accreditedTestIds = new Set(
      accreditations
        .filter(a => a.bodyId === b.id && statusFor(a.expires).bucket !== 'expired')
        .map(a => a.testId)
    );
    const n = sampleTestIds.filter(id => accreditedTestIds.has(id)).length;
    const ratio = total > 0 ? Math.round((n / total) * 100) : 0;
    const gate =
      b.logoVisibilityMode === MODE_ANY
        ? n >= 1
        : ratio >= b.thresholdPct;
    const showLogo = !!b.logo && n > 0 && gate;
    return { body: b, n, ratio, gate, showLogo, hasAny: n > 0 };
  });

  const logosToShow = evalByBody
    .filter(e => e.showLogo)
    .sort((a, b) => a.body.displayOrder - b.body.displayOrder);

  const bodiesWithAny = evalByBody
    .filter(e => e.hasAny)
    .sort((a, b) => a.body.displayOrder - b.body.displayOrder)
    .map(e => e.body.name);

  const notesLine = bodiesWithAny.length > 0
    ? `Tests on this report are accredited by: ${bodiesWithAny.join(', ')}.`
    : null;

  return (
    <div>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem>{t('nav.report', 'Patient reports')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('nav.previewAcc', 'Report preview')}</BreadcrumbItem>
      </Breadcrumb>
      <h2 style={{ margin: '0.5rem 0 0.25rem' }}>Patient Result Report (preview)</h2>
      <p style={{ color: 'var(--cds-text-secondary)', marginTop: 0 }}>
        Sample of a rendered patient report showing per-body logo-visibility-mode evaluation and the automatic
        accreditation notes line.
      </p>

      <InlineNotification
        kind="info"
        lowContrast
        hideCloseButton
        title="Evaluation summary"
        subtitle={
          evalByBody.map(e => {
            const modeText = e.body.logoVisibilityMode === MODE_ANY
              ? 'mode=Any accredited test'
              : `mode=≥ ${e.body.thresholdPct}%`;
            return `${e.body.name}: ${e.n}/${total} accredited (${e.ratio}%) — ${modeText} → ${e.showLogo ? 'LOGO SHOWN' : 'logo hidden'}`;
          }).join(' · ')
        }
      />

      <div style={{
        background: '#fff', border: '1px solid var(--cds-border-subtle)', borderRadius: 2,
        padding: '1.5rem', marginTop: '1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--cds-border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Centre Hospitalier Universitaire — Lab</div>
            <div style={{ color: 'var(--cds-text-secondary)', fontSize: 13 }}>Patient Result Report</div>
            <div style={{ color: 'var(--cds-text-secondary)', fontSize: 13 }}>Patient: Rakoto, Hery · M, 42</div>
            <div style={{ color: 'var(--cds-text-secondary)', fontSize: 13 }}>Accession: MG-2026-04-22-0147</div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {logosToShow.length === 0 ? (
              <span style={{ color: 'var(--cds-text-placeholder)', fontSize: 12 }}>No accreditation logos qualify for this report</span>
            ) : logosToShow.map(e => (
              <img key={e.body.id} src={e.body.logo} alt={e.body.name} style={{ maxHeight: 60, maxWidth: 120 }} />
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--cds-border-subtle)' }}>
              <th style={{ padding: '0.25rem 0' }}>Test</th>
              <th style={{ padding: '0.25rem 0' }}>Result</th>
              <th style={{ padding: '0.25rem 0' }}>Units</th>
              <th style={{ padding: '0.25rem 0' }}>Accreditation</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(ts => {
              const badges = accreditations
                .filter(a => a.testId === ts.id && statusFor(a.expires).bucket !== 'expired')
                .map(a => bodyById[a.bodyId])
                .filter(b => b && b.active);
              return (
                <tr key={ts.id}>
                  <td style={{ padding: '0.25rem 0' }}>{ts.name}</td>
                  <td style={{ padding: '0.25rem 0' }}>—</td>
                  <td style={{ padding: '0.25rem 0' }}>—</td>
                  <td style={{ padding: '0.25rem 0' }}>
                    {badges.length === 0 ? '—' : badges.map(b => (
                      <Tag key={b.id} type="green" size="sm" style={{ marginRight: 4 }}>{b.code}</Tag>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {notesLine && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--cds-border-subtle)', fontSize: 12, color: 'var(--cds-text-secondary)' }}>
            <strong>Notes:</strong> {notesLine}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Shell with Carbon SideNav ====================

const SCENES = {
  ACCRED_BODIES:         'admin.accred.bodies',
  ACCRED_ACCREDITATIONS: 'admin.accred.accreditations',
  REPORT_PREVIEW:        'report.preview',
};

export default function TestAccreditationMockup() {
  const [bodies, setBodies]                   = useState(initialBodies);
  const [accreditations, setAccreditations]   = useState(initialAccreditations);
  const [preselectedTestId, setPreselectedId] = useState(null);
  const [scene, setScene]                     = useState(SCENES.ACCRED_BODIES);

  const clearPreselection = () => setPreselectedId(null);

  let content;
  switch (scene) {
    case SCENES.ACCRED_BODIES:
      content = <AccreditingBodiesPage bodies={bodies} setBodies={setBodies}
                  accreditations={accreditations} />;
      break;
    case SCENES.ACCRED_ACCREDITATIONS:
      content = <TestAccreditationsPage bodies={bodies} accreditations={accreditations}
                  setAccreditations={setAccreditations}
                  preselectedTestId={preselectedTestId}
                  clearPreselection={clearPreselection} />;
      break;
    case SCENES.REPORT_PREVIEW:
      content = <ReportPreviewPage bodies={bodies} accreditations={accreditations} />;
      break;
    default:
      content = null;
  }

  return (
    <Theme theme="white">
      <HeaderContainer
        render={({ isSideNavExpanded: hdrOpen, onClickSideNavExpand }) => (
          <>
            <Header aria-label="OpenELIS Global">
              <HeaderMenuButton aria-label="Open menu" onClick={onClickSideNavExpand} isActive={hdrOpen} />
              <HeaderName prefix="OpenELIS">Global</HeaderName>
            </Header>
            <SideNav aria-label="Side navigation" expanded={true} isPersistent>
              <SideNavItems>
                <SideNavMenu title={t('nav.testCatalogMgmt', 'Test Catalog Management')} defaultExpanded>
                  <SideNavMenuItem
                    isActive={scene === SCENES.ACCRED_BODIES}
                    onClick={() => { clearPreselection(); setScene(SCENES.ACCRED_BODIES); }}
                    href="#accred-bodies"
                  >
                    {t('nav.bodies', 'Accrediting bodies')}
                  </SideNavMenuItem>
                  <SideNavMenuItem
                    isActive={scene === SCENES.ACCRED_ACCREDITATIONS}
                    onClick={() => setScene(SCENES.ACCRED_ACCREDITATIONS)}
                    href="#accred-accreditations"
                  >
                    {t('nav.accreditations', 'Test accreditations')}
                  </SideNavMenuItem>
                </SideNavMenu>
                <SideNavMenu title={t('nav.patientReports', 'Patient Reports')} defaultExpanded>
                  <SideNavMenuItem
                    isActive={scene === SCENES.REPORT_PREVIEW}
                    onClick={() => { clearPreselection(); setScene(SCENES.REPORT_PREVIEW); }}
                    href="#report-preview"
                  >
                    {t('nav.reportPreview', 'Report preview')}
                  </SideNavMenuItem>
                </SideNavMenu>
                <SideNavLink href="#home">Home</SideNavLink>
              </SideNavItems>
            </SideNav>
          </>
        )}
      />
      <main style={{ marginLeft: 256, padding: '5rem 2rem 2rem' }}>
        {content}
      </main>
    </Theme>
  );
}
