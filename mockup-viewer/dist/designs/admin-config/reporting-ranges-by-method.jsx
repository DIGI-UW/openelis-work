// Reporting Ranges by Method — OpenELIS Global mockup (v2)
//
// Covers the full epic scope:
//   - Methods admin page (master catalog) at /admin/test-catalog/methods
//     (Sub-2 of the parent epic)
//   - Test Management row-expand with two new sections:
//     - Methods section (Manual always present; ANALYZER_AUTO rows appear when
//       an analyzer is mapped; USER_ADDED rows added from the test row itself)
//     - Reporting ranges section with per-method rows and "Apply to all"
//     (Sub-3 of the parent epic)
//   - Result-entry preview showing the method-aware range lookup with no new
//     fallback (Sub-4) — fires against the test-level range when no method
//     range is configured.
//
// Patterns referenced:
//   P-01 Admin Table
//   P-02 Inline row-expand edit
//   P-03 Create modal
//   P-04 Confirm delete / confirm overwrite
//   P-05 Form validation
//   P-06 Empty state
//   P-13 Permission gate (TEST_CATALOG_MANAGE)
//
// Shell: Carbon @carbon/react SideNav with submenu entries under Test Catalog —
// Test Management (for the row-expand demo), Methods (the master catalog), plus
// a Result entry preview under Patient Tests.

import React, { useState, useMemo, Fragment } from 'react';
import {
  Theme,
  HeaderContainer, Header, HeaderName, HeaderMenuButton,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem, SideNavLink,
  Breadcrumb, BreadcrumbItem,
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput, Toggle,
  Button, Tag, Tile, InlineNotification, Modal,
  RadioButtonGroup, RadioButton,
} from '@carbon/react';
import {
  Add, ChevronDown, ChevronUp, Save, TrashCan, WarningAlt, ArrowRight,
} from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ---------- Mock data ----------

// Master method catalog — three sources: MANUAL (seeded), USER (admin-created),
// PLUGIN (registered by an analyzer's init hook).
//
// `code` is persisted in the data model but NEVER displayed in the admin UI.
// USER methods get a server-assigned 'METH-NNN' code (zero-padded, monotonic).
// PLUGIN methods carry the plugin-supplied code as part of the integration contract.
// MANUAL is the literal 'MANUAL'. The code is used only for stable identifiers in
// CSV import/export, audit trails, and plugin namespacing.
const initialMethods = [
  { id: 'm1', code: 'MANUAL',       name: 'Manual / microscopy', description: 'System default — always available on every test.', source: 'MANUAL', pluginId: null, analyzerId: null, analyzerName: null, active: true },
  { id: 'm2', code: 'HUMASTAR-300', name: 'HumaStar 300SR',      description: 'Random-access clinical chemistry analyzer.', source: 'PLUGIN', pluginId: 'humastar-plugin', analyzerId: 'a-humastar', analyzerName: 'HumaStar 300SR', active: true },
  { id: 'm3', code: 'SYSMEX-XN350', name: 'Sysmex XN-350',       description: 'Compact 5-part diff hematology analyzer.', source: 'PLUGIN', pluginId: 'sysmex-plugin',   analyzerId: 'a-sysmex',   analyzerName: 'Sysmex XN-350', active: true },
  { id: 'm4', code: 'GXPT-MTB',     name: 'GeneXpert MTB/RIF',   description: 'Cartridge-based NAAT for TB and rifampicin resistance.', source: 'PLUGIN', pluginId: 'genexpert-plugin',analyzerId: 'a-genexpert',analyzerName: 'GeneXpert',     active: true },
  { id: 'm5', code: 'METH-001',     name: 'HPLC',                description: 'High-performance liquid chromatography. Used for HbA1c when the Sysmex is offline.', source: 'USER',   pluginId: null, analyzerId: null, analyzerName: null, active: true },
];

// Server-assigned next code for new USER methods. In production this comes from
// the API response — the UI never previews or reserves a value.
const nextUserMethodCode = (methods) => {
  const used = methods
    .map(m => /^METH-(\d+)$/.exec(m.code))
    .filter(Boolean)
    .map(match => parseInt(match[1], 10));
  const next = (used.length === 0 ? 0 : Math.max(...used)) + 1;
  return `METH-${String(next).padStart(3, '0')}`;
};

// Tests. Each carries an explicit allowed-methods list (test_method rows) and a
// per-method ranges table (test_method_range rows). In addition every test
// retains its existing test-level reporting range which continues to apply
// when a method has no per-method range configured.
const initialTests = [
  {
    id: 't1', code: 'HGB', name: 'Hemoglobin', section: 'Hematology',
    units: 'g/dL',
    testLevelLow: 5.0, testLevelHigh: 22.0,  // existing test-level range (unchanged behavior)
    testMethods: [
      { id: 'tm1', methodId: 'm1', source: 'MANUAL_DEFAULT', addedOn: '2025-01-14' },
      { id: 'tm2', methodId: 'm3', source: 'ANALYZER_AUTO',  addedOn: '2025-03-02' }, // Sysmex XN-350
    ],
    methodRanges: [
      { id: 'r1', methodId: 'm1', low: 6.0, high: 18.0, units: 'g/dL' },  // Manual narrower
      { id: 'r2', methodId: 'm3', low: 4.5, high: 22.0, units: 'g/dL' },  // Sysmex wide
    ],
  },
  {
    id: 't2', code: 'GLUC', name: 'Glucose, serum', section: 'Chemistry',
    units: 'mg/dL',
    testLevelLow: 20, testLevelHigh: 600,
    testMethods: [
      { id: 'tm3', methodId: 'm1', source: 'MANUAL_DEFAULT', addedOn: '2025-01-14' },
      { id: 'tm4', methodId: 'm2', source: 'ANALYZER_AUTO',  addedOn: '2025-02-11' }, // HumaStar
      { id: 'tm5', methodId: 'm5', source: 'USER_ADDED',     addedOn: '2025-04-03' }, // HPLC
    ],
    methodRanges: [
      { id: 'r3', methodId: 'm2', low: 30, high: 500, units: 'mg/dL' },
      // m1 (Manual) and m5 (HPLC) have no range → test-level applies
    ],
  },
  {
    id: 't3', code: 'TB-NAAT', name: 'TB NAAT (Xpert)', section: 'Molecular',
    units: 'result',
    testLevelLow: null, testLevelHigh: null,
    testMethods: [
      { id: 'tm6', methodId: 'm1', source: 'MANUAL_DEFAULT', addedOn: '2025-01-14' },
      { id: 'tm7', methodId: 'm4', source: 'ANALYZER_AUTO',  addedOn: '2025-03-20' }, // GeneXpert
    ],
    methodRanges: [],
  },
];

// ==================== Methods admin page (Sub-2) ====================

function MethodsAdminPage({ methods, setMethods, tests, canManage }) {
  const [expandedId, setExpandedId] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [pluginAnalyzerFilter, setPluginAnalyzerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [toast, setToast] = useState(null);

  const analyzerOptions = useMemo(() => {
    const seen = new Map();
    methods.filter(m => m.source === 'PLUGIN').forEach(m => {
      if (!seen.has(m.analyzerId)) seen.set(m.analyzerId, m.analyzerName);
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [methods]);

  const usedByCounts = useMemo(() => {
    const counts = {};
    tests.forEach(test => {
      test.testMethods.forEach(tm => {
        counts[tm.methodId] = (counts[tm.methodId] || 0) + 1;
      });
    });
    return counts;
  }, [tests]);

  const filteredMethods = methods.filter(m => {
    if (sourceFilter === 'manual' && m.source !== 'MANUAL') return false;
    if (sourceFilter === 'user' && m.source !== 'USER') return false;
    if (sourceFilter === 'plugin' && m.source !== 'PLUGIN') return false;
    if (sourceFilter === 'plugin' && pluginAnalyzerFilter !== 'all' && m.analyzerId !== pluginAnalyzerFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      // Search by Name only — `code` is internal and not displayed to admins.
      if (!m.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sourceTag = (m) => {
    if (m.source === 'MANUAL') return <Tag type="gray" size="sm">{t('admin.testCatalog.methods.source.manual', 'Manual')}</Tag>;
    if (m.source === 'USER')   return <Tag type="cyan" size="sm">{t('admin.testCatalog.methods.source.user', 'User')}</Tag>;
    return <Tag type="warm-gray" size="sm">{t('admin.testCatalog.methods.source.plugin', `Plugin: ${m.analyzerName}`)}</Tag>;
  };

  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">Admin</BreadcrumbItem>
        <BreadcrumbItem href="#">Test Catalog</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Methods</BreadcrumbItem>
      </Breadcrumb>

      <div>
        <h2 style={{ marginBottom: '0.25rem' }}>{t('admin.testCatalog.methods.heading', 'Methods')}</h2>
        <p style={{ maxWidth: '56rem', color: 'var(--cds-text-secondary)' }}>
          {t('admin.testCatalog.methods.desc', 'Master catalog of methods used by this lab. Plugin-registered methods are read-only; create and manage your own methods here.')}
        </p>
      </div>

      {toast && (
        <InlineNotification kind={toast.kind} title={toast.title} onCloseButtonClick={() => setToast(null)} />
      )}

      <TableContainer>
        <TableToolbar>
          <TableToolbarContent>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Select id="source-filter" labelText="Source" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} size="sm">
                <SelectItem value="all" text="All" />
                <SelectItem value="manual" text="Manual" />
                <SelectItem value="user" text="User" />
                <SelectItem value="plugin" text="Plugin" />
              </Select>
              {sourceFilter === 'plugin' && (
                <Select id="analyzer-filter" labelText="Analyzer" value={pluginAnalyzerFilter} onChange={e => setPluginAnalyzerFilter(e.target.value)} size="sm">
                  <SelectItem value="all" text="All analyzers" />
                  {analyzerOptions.map(a => <SelectItem key={a.id} value={a.id} text={a.name} />)}
                </Select>
              )}
              <TextInput id="search" labelText="Search" placeholder="Code or name" value={search} onChange={e => setSearch(e.target.value)} size="sm" />
            </div>
            {canManage && (
              <Button renderIcon={Add} onClick={() => setShowAddModal(true)}>
                {t('admin.testCatalog.methods.addCta', 'Add method')}
              </Button>
            )}
          </TableToolbarContent>
        </TableToolbar>

        {filteredMethods.length === 0 ? (
          <Tile style={{ textAlign: 'center', padding: '3rem' }}>
            <h4>{t('admin.testCatalog.methods.empty.title', 'No methods yet')}</h4>
            <p style={{ marginTop: '0.5rem', color: 'var(--cds-text-secondary)' }}>
              {t('admin.testCatalog.methods.empty.body', 'Manual is always available. Add your own or configure an analyzer to register more.')}
            </p>
          </Tile>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader style={{ width: '3rem' }} />
                <TableHeader>{t('admin.testCatalog.methods.col.name', 'Name')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.methods.col.source', 'Source')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.methods.col.usedBy', 'Used by')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.methods.col.status', 'Status')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMethods.map(m => {
                const expanded = expandedId === m.id;
                const usedBy = usedByCounts[m.id] || 0;
                return (
                  <Fragment key={m.id}>
                    <TableRow>
                      <TableCell>
                        <Button kind="ghost" size="sm" hasIconOnly renderIcon={expanded ? ChevronUp : ChevronDown}
                          iconDescription={expanded ? 'Collapse' : 'Expand'}
                          onClick={() => setExpandedId(expanded ? null : m.id)} />
                      </TableCell>
                      <TableCell><strong>{m.name}</strong></TableCell>
                      <TableCell>{sourceTag(m)}</TableCell>
                      <TableCell>{usedBy}</TableCell>
                      <TableCell>
                        <Tag type={m.active ? 'green' : 'gray'} size="sm">{m.active ? 'Active' : 'Inactive'}</Tag>
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={5} style={{ background: 'var(--cds-layer-01)' }}>
                          <MethodRowExpand method={m} usedBy={usedBy} tests={tests}
                            canManage={canManage}
                            onEdit={(next) => {
                              setMethods(methods.map(x => x.id === m.id ? { ...x, ...next } : x));
                              setToast({ kind: 'success', title: `Saved ${next.name || m.name}` });
                            }}
                            onRequestDelete={() => setDeleteCandidate(m)}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {showAddModal && (
        <AddMethodModal methods={methods}
          onClose={() => setShowAddModal(false)}
          onSave={(draft) => {
            // Server assigns the code; UI never previews it. We mimic the
            // server behavior here for the mockup so demo state stays valid.
            const assignedCode = nextUserMethodCode(methods);
            const newMethod = {
              id: `m${methods.length + 1}`,
              code: assignedCode,
              name: draft.name,
              description: draft.description || null,
              source: 'USER', pluginId: null, analyzerId: null, analyzerName: null,
              active: draft.active,
            };
            setMethods([...methods, newMethod]);
            setShowAddModal(false);
            setToast({ kind: 'success', title: `Added method "${newMethod.name}"` });
          }} />
      )}

      {deleteCandidate && (
        <Modal open modalHeading={`Delete method "${deleteCandidate.name}"?`}
          primaryButtonText="Delete" secondaryButtonText="Cancel"
          danger
          onRequestClose={() => setDeleteCandidate(null)}
          onRequestSubmit={() => {
            setMethods(methods.filter(x => x.id !== deleteCandidate.id));
            setToast({ kind: 'success', title: `Deleted method "${deleteCandidate.name}"` });
            setDeleteCandidate(null);
          }}>
          <p>This action cannot be undone.</p>
        </Modal>
      )}
    </Stack>
  );
}

function MethodRowExpand({ method, usedBy, tests, canManage, onEdit, onRequestDelete }) {
  const [draft, setDraft] = useState({
    name: method.name,
    description: method.description || '',
    active: method.active,
  });

  if (method.source === 'MANUAL') {
    return (
      <Stack gap={3}>
        <p><em>{t('admin.testCatalog.methods.readOnly.manual', 'System-provided default — always available on every test.')}</em></p>
        {method.description && (
          <div>
            <strong>{t('admin.testCatalog.methods.field.description', 'Description')}</strong>
            <p style={{ margin: '0.25rem 0 0', whiteSpace: 'pre-wrap' }}>{method.description}</p>
          </div>
        )}
      </Stack>
    );
  }

  if (method.source === 'PLUGIN') {
    const usingTests = tests.filter(tt => tt.testMethods.some(tm => tm.methodId === method.id)).slice(0, 10);
    return (
      <Stack gap={3}>
        <p><em>{t('admin.testCatalog.methods.readOnly.plugin', `Registered by the ${method.analyzerName} analyzer plugin.`)}</em></p>
        {method.description && (
          <div>
            <strong>{t('admin.testCatalog.methods.field.description', 'Description')}</strong>
            <p style={{ margin: '0.25rem 0 0', whiteSpace: 'pre-wrap' }}>{method.description}</p>
          </div>
        )}
        {usingTests.length > 0 && (
          <div>
            <strong>Tests currently using this method:</strong>
            <ul style={{ marginTop: '0.25rem' }}>
              {usingTests.map(tt => <li key={tt.id}>{tt.code} — {tt.name}</li>)}
            </ul>
          </div>
        )}
      </Stack>
    );
  }

  // USER method
  const blockDelete = usedBy > 0;
  const descLen = (draft.description || '').length;
  const descError = descLen > 500 ? 'Description must be 500 characters or fewer.' : null;
  const nameError = !draft.name ? 'Name is required.' : null;
  const canSave = !descError && !nameError;
  return (
    <Stack gap={4}>
      <Grid narrow>
        <Column sm={4} md={4} lg={6}>
          <TextInput id={`name-${method.id}`} labelText={t('admin.testCatalog.methods.field.name', 'Name')}
            value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
            disabled={!canManage}
            invalid={!!nameError} invalidText={nameError || ''} />
        </Column>
        <Column sm={4} md={4} lg={2}>
          <Toggle id={`active-${method.id}`} labelText={t('admin.testCatalog.methods.field.active', 'Active')}
            toggled={draft.active} onToggle={v => setDraft({ ...draft, active: v })}
            disabled={!canManage} />
        </Column>
        <Column sm={4} md={8} lg={8}>
          <TextArea id={`description-${method.id}`}
            labelText={t('admin.testCatalog.methods.field.description', 'Description')}
            helperText={t('admin.testCatalog.methods.field.descriptionHelp', 'What this method does, when to use it. Shown when picking a method on a test.')}
            value={draft.description}
            onChange={e => setDraft({ ...draft, description: e.target.value })}
            disabled={!canManage}
            rows={3}
            maxCount={500}
            enableCounter
            invalid={!!descError} invalidText={descError || ''} />
        </Column>
      </Grid>
      {canManage && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button kind="danger--tertiary" renderIcon={TrashCan}
            disabled={blockDelete}
            onClick={onRequestDelete}>
            Delete
          </Button>
          {blockDelete && (
            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', alignSelf: 'center' }}>
              {t('admin.testCatalog.methods.deleteBlockedUsage', `Used by ${usedBy} tests — remove from each test first.`)}
            </span>
          )}
          <Button kind="primary" renderIcon={Save} onClick={() => onEdit(draft)} disabled={!canSave}>Save</Button>
        </div>
      )}
    </Stack>
  );
}

function AddMethodModal({ methods, onClose, onSave }) {
  const [draft, setDraft] = useState({ name: '', description: '', active: true });
  const [touched, setTouched] = useState({ name: false });

  const nameError = !draft.name ? 'Name is required.' :
    methods.some(m => m.source === 'USER' && m.name.trim().toLowerCase() === draft.name.trim().toLowerCase())
      ? 'A method with this name already exists.' : null;
  const descError = (draft.description || '').length > 500 ? 'Description must be 500 characters or fewer.' : null;
  const canSave = !nameError && !descError && draft.name;

  return (
    <Modal open modalHeading={t('admin.testCatalog.methods.addCta', 'Add method')}
      primaryButtonText="Add" secondaryButtonText="Cancel"
      primaryButtonDisabled={!canSave}
      onRequestClose={onClose}
      onRequestSubmit={() => onSave(draft)}>
      <Stack gap={4}>
        <TextInput id="new-name" labelText={t('admin.testCatalog.methods.field.name', 'Name')}
          placeholder="e.g. HPLC"
          value={draft.name}
          onBlur={() => setTouched({ ...touched, name: true })}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          invalid={!!nameError && touched.name} invalidText={nameError || ''} />
        <TextArea id="new-description"
          labelText={t('admin.testCatalog.methods.field.description', 'Description')}
          helperText={t('admin.testCatalog.methods.field.descriptionHelp', 'What this method does, when to use it. Shown when picking a method on a test.')}
          value={draft.description}
          onChange={e => setDraft({ ...draft, description: e.target.value })}
          rows={3}
          maxCount={500}
          enableCounter
          invalid={!!descError} invalidText={descError || ''} />
        <Toggle id="new-active" labelText={t('admin.testCatalog.methods.field.active', 'Active')}
          toggled={draft.active} onToggle={v => setDraft({ ...draft, active: v })} />
        <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', margin: 0 }}>
          A code is assigned automatically when you save. Methods are identified by Name everywhere in the admin.
        </p>
      </Stack>
    </Modal>
  );
}

// ==================== Test Management — row-expand Methods + Ranges (Sub-3) ====================

function TestManagementPage({ tests, setTests, methods, canManage }) {
  const [expandedId, setExpandedId] = useState('t1');

  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">Admin</BreadcrumbItem>
        <BreadcrumbItem href="#">Test Catalog</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Test Management</BreadcrumbItem>
      </Breadcrumb>

      <div>
        <h2 style={{ marginBottom: '0.25rem' }}>Test Management</h2>
        <p style={{ maxWidth: '56rem', color: 'var(--cds-text-secondary)' }}>
          Expand a test to configure its allowed methods and per-method reporting ranges.
        </p>
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader style={{ width: '3rem' }} />
              <TableHeader>Code</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Section</TableHeader>
              <TableHeader>Units</TableHeader>
              <TableHeader>Test-level range</TableHeader>
              <TableHeader>Methods on test</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {tests.map(test => {
              const expanded = expandedId === test.id;
              const rangeText = test.testLevelLow == null && test.testLevelHigh == null
                ? '—'
                : `${test.testLevelLow ?? '—'} – ${test.testLevelHigh ?? '—'} ${test.units}`;
              return (
                <Fragment key={test.id}>
                  <TableRow>
                    <TableCell>
                      <Button kind="ghost" size="sm" hasIconOnly renderIcon={expanded ? ChevronUp : ChevronDown}
                        iconDescription={expanded ? 'Collapse' : 'Expand'}
                        onClick={() => setExpandedId(expanded ? null : test.id)} />
                    </TableCell>
                    <TableCell><strong>{test.code}</strong></TableCell>
                    <TableCell>{test.name}</TableCell>
                    <TableCell>{test.section}</TableCell>
                    <TableCell>{test.units}</TableCell>
                    <TableCell>{rangeText}</TableCell>
                    <TableCell>{test.testMethods.length}</TableCell>
                  </TableRow>
                  {expanded && (
                    <TableRow>
                      <TableCell colSpan={7} style={{ background: 'var(--cds-layer-01)', padding: '1rem' }}>
                        <TestRowExpand test={test} methods={methods} canManage={canManage}
                          onChange={(next) => setTests(tests.map(x => x.id === test.id ? next : x))} />
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
  );
}

function TestRowExpand({ test, methods, canManage, onChange }) {
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [applyAllCandidate, setApplyAllCandidate] = useState(null);
  const [deleteMethodCandidate, setDeleteMethodCandidate] = useState(null);
  const [inlineBanner, setInlineBanner] = useState(null);

  const methodById = useMemo(() => new Map(methods.map(m => [m.id, m])), [methods]);

  const rowForMethod = (methodId) =>
    test.methodRanges.find(r => r.methodId === methodId) ||
    { id: `new-${methodId}`, methodId, low: null, high: null, units: test.units };

  const saveRangeRow = (methodId, next) => {
    const existing = test.methodRanges.find(r => r.methodId === methodId);
    const updated = existing
      ? test.methodRanges.map(r => r.id === existing.id ? { ...r, ...next } : r)
      : [...test.methodRanges, { id: `r-${test.id}-${methodId}`, methodId, units: test.units, ...next }];
    onChange({ ...test, methodRanges: updated });
  };

  const validateRangeRow = (row) => {
    const lowFilled = row.low !== null && row.low !== undefined && row.low !== '';
    const highFilled = row.high !== null && row.high !== undefined && row.high !== '';
    if (lowFilled !== highFilled) return t('admin.testCatalog.test.ranges.validateMixedEmpty', 'Both Low and High must be filled, or both left empty.');
    if (lowFilled && Number(row.low) > Number(row.high)) return t('admin.testCatalog.test.ranges.validateRange', 'Low must be less than or equal to High.');
    return null;
  };

  const doApplyAll = (sourceMethodId) => {
    const source = test.methodRanges.find(r => r.methodId === sourceMethodId);
    if (!source) return;
    const nextRanges = test.testMethods.map(tm => {
      if (tm.methodId === sourceMethodId) return source;
      const existing = test.methodRanges.find(r => r.methodId === tm.methodId);
      return { id: existing ? existing.id : `r-${test.id}-${tm.methodId}`, methodId: tm.methodId, low: source.low, high: source.high, units: source.units };
    });
    onChange({ ...test, methodRanges: nextRanges });
    setApplyAllCandidate(null);
    setInlineBanner({ kind: 'success', title: t('admin.testCatalog.test.ranges.applySuccess', `Applied the range to ${test.testMethods.length - 1} method(s).`) });
  };

  const requestApplyAll = (sourceMethodId) => {
    const source = test.methodRanges.find(r => r.methodId === sourceMethodId);
    if (!source || source.low == null || source.high == null) return;
    const overwriteCount = test.testMethods.filter(tm => {
      if (tm.methodId === sourceMethodId) return false;
      const existing = test.methodRanges.find(r => r.methodId === tm.methodId);
      return existing && (existing.low != null || existing.high != null);
    }).length;
    if (overwriteCount === 0) { doApplyAll(sourceMethodId); return; }
    setApplyAllCandidate({ sourceMethodId, overwriteCount, source });
  };

  const attemptRemoveMethod = (tm) => {
    if (tm.source === 'MANUAL_DEFAULT') {
      setInlineBanner({ kind: 'warning', title: t('admin.testCatalog.test.methods.removeBlockedManual', 'Manual is always available and cannot be removed.') });
      return;
    }
    if (tm.source === 'ANALYZER_AUTO') {
      const method = methodById.get(tm.methodId);
      setInlineBanner({ kind: 'warning', title: t('admin.testCatalog.test.methods.removeBlockedAnalyzer', `This method is provided by the ${method?.analyzerName || 'analyzer'} mapping. To remove it, un-map the analyzer from this test.`) });
      return;
    }
    setDeleteMethodCandidate(tm);
  };

  const confirmRemoveMethod = () => {
    if (!deleteMethodCandidate) return;
    const nextMethods = test.testMethods.filter(tm => tm.id !== deleteMethodCandidate.id);
    const nextRanges = test.methodRanges.filter(r => r.methodId !== deleteMethodCandidate.methodId);
    onChange({ ...test, testMethods: nextMethods, methodRanges: nextRanges });
    setDeleteMethodCandidate(null);
    setInlineBanner({ kind: 'success', title: 'Method removed from this test.' });
  };

  const addMethodExisting = (methodId) => {
    if (!methodId) return;
    const tm = { id: `tm-${test.id}-${methodId}`, methodId, source: 'USER_ADDED', addedOn: new Date().toISOString().slice(0, 10) };
    onChange({ ...test, testMethods: [...test.testMethods, tm] });
    setShowAddMethodModal(false);
  };

  return (
    <Stack gap={5}>
      {inlineBanner && (
        <InlineNotification kind={inlineBanner.kind} title={inlineBanner.title} onCloseButtonClick={() => setInlineBanner(null)} />
      )}

      {/* Methods section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h4 style={{ margin: 0 }}>{t('admin.testCatalog.test.methods.heading', 'Methods')}</h4>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>
              {t('admin.testCatalog.test.methods.desc', 'Methods allowed on this test. Manual is always available; analyzer methods appear automatically when the analyzer is mapped.')}
            </p>
          </div>
          {canManage && (
            <Button renderIcon={Add} size="sm" onClick={() => setShowAddMethodModal(true)}>
              {t('admin.testCatalog.test.methods.addCta', 'Add method')}
            </Button>
          )}
        </div>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>{t('admin.testCatalog.test.methods.col.method', 'Method')}</TableHeader>
              <TableHeader>{t('admin.testCatalog.test.methods.col.source', 'Source')}</TableHeader>
              <TableHeader>{t('admin.testCatalog.test.methods.col.addedOn', 'Added on')}</TableHeader>
              <TableHeader style={{ width: '6rem' }}>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {test.testMethods.map(tm => {
              const m = methodById.get(tm.methodId);
              const sourceTag =
                tm.source === 'MANUAL_DEFAULT' ? <Tag type="gray"       size="sm">Manual</Tag> :
                tm.source === 'ANALYZER_AUTO'  ? <Tag type="warm-gray"  size="sm">{`Analyzer: ${m?.analyzerName || '—'}`}</Tag> :
                                                 <Tag type="cyan"       size="sm">User</Tag>;
              return (
                <TableRow key={tm.id}>
                  <TableCell>
                    <div><strong>{m?.name}</strong></div>
                    {m?.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.125rem', maxWidth: '36rem' }}>
                        {m.description.length > 120 ? `${m.description.slice(0, 120)}…` : m.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{sourceTag}</TableCell>
                  <TableCell>{tm.addedOn}</TableCell>
                  <TableCell>
                    {canManage && (
                      <Button kind="ghost" size="sm" hasIconOnly renderIcon={TrashCan}
                        iconDescription="Remove"
                        disabled={tm.source !== 'USER_ADDED'}
                        onClick={() => attemptRemoveMethod(tm)} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      {/* Reporting ranges section */}
      <section>
        <div style={{ marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0 }}>{t('admin.testCatalog.test.ranges.heading', 'Reporting ranges by method')}</h4>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>
            {t('admin.testCatalog.test.ranges.desc', "Set a reporting range per method. If a method has no range configured, this test's existing reporting range applies.")}
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            Test-level range (fallback): {test.testLevelLow == null && test.testLevelHigh == null ? 'none' : `${test.testLevelLow ?? '—'} – ${test.testLevelHigh ?? '—'} ${test.units}`}
          </p>
        </div>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>{t('admin.testCatalog.test.ranges.col.method', 'Method')}</TableHeader>
              <TableHeader>{t('admin.testCatalog.test.ranges.col.low', 'Low')}</TableHeader>
              <TableHeader>{t('admin.testCatalog.test.ranges.col.high', 'High')}</TableHeader>
              <TableHeader>{t('admin.testCatalog.test.ranges.col.units', 'Units')}</TableHeader>
              <TableHeader style={{ width: '12rem' }}>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {test.testMethods.map(tm => {
              const m = methodById.get(tm.methodId);
              const row = rowForMethod(tm.methodId);
              const error = validateRangeRow(row);
              const canApply = row.low != null && row.high != null && !error;
              return (
                <TableRow key={`r-${tm.methodId}`}>
                  <TableCell><strong>{m?.name}</strong></TableCell>
                  <TableCell>
                    <NumberInput id={`low-${tm.methodId}`} label="" hideLabel value={row.low ?? ''}
                      onChange={(_, { value }) => saveRangeRow(tm.methodId, { low: value === '' ? null : Number(value) })}
                      disabled={!canManage}
                      invalid={!!error} invalidText={error || ''} size="sm" />
                  </TableCell>
                  <TableCell>
                    <NumberInput id={`high-${tm.methodId}`} label="" hideLabel value={row.high ?? ''}
                      onChange={(_, { value }) => saveRangeRow(tm.methodId, { high: value === '' ? null : Number(value) })}
                      disabled={!canManage} size="sm" />
                  </TableCell>
                  <TableCell>
                    <TextInput id={`units-${tm.methodId}`} labelText="" hideLabel value={row.units ?? test.units}
                      onChange={e => saveRangeRow(tm.methodId, { units: e.target.value })}
                      disabled={!canManage} size="sm" />
                  </TableCell>
                  <TableCell>
                    {canManage && (
                      <Button kind="ghost" size="sm" renderIcon={ArrowRight}
                        disabled={!canApply}
                        onClick={() => requestApplyAll(tm.methodId)}>
                        {t('admin.testCatalog.test.ranges.applyToAll', 'Apply this range to all methods')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      {showAddMethodModal && (
        <AddMethodToTestModal test={test} methods={methods}
          onClose={() => setShowAddMethodModal(false)}
          onPickExisting={(methodId) => addMethodExisting(methodId)}
          onCreateNew={(draft) => {
            // In a real app this POSTs to /api/admin/tests/{id}/methods/create.
            // For the mockup we append to the test only.
            const newId = `m${methods.length + 100}`;
            const newMethodForTest = { id: `tm-${test.id}-${newId}`, methodId: newId, source: 'USER_ADDED', addedOn: new Date().toISOString().slice(0, 10) };
            onChange({ ...test, testMethods: [...test.testMethods, newMethodForTest] });
            setShowAddMethodModal(false);
          }} />
      )}

      {applyAllCandidate && (
        <Modal open modalHeading="Apply range to all methods?"
          primaryButtonText="Overwrite" secondaryButtonText="Cancel"
          danger
          onRequestClose={() => setApplyAllCandidate(null)}
          onRequestSubmit={() => doApplyAll(applyAllCandidate.sourceMethodId)}>
          <p>
            {t('admin.testCatalog.test.ranges.applyConfirmOverwrite', `Overwrite ${applyAllCandidate.overwriteCount} existing range(s) with ${applyAllCandidate.source.low}–${applyAllCandidate.source.high} ${applyAllCandidate.source.units}?`)}
          </p>
        </Modal>
      )}

      {deleteMethodCandidate && (
        <Modal open modalHeading="Remove method from this test?"
          primaryButtonText="Remove" secondaryButtonText="Cancel"
          danger
          onRequestClose={() => setDeleteMethodCandidate(null)}
          onRequestSubmit={confirmRemoveMethod}>
          <p>
            {t('admin.testCatalog.test.methods.removeConfirm',
              'Remove this method from this test? Any reporting range you set for this method will also be removed.')}
          </p>
        </Modal>
      )}
    </Stack>
  );
}

function AddMethodToTestModal({ test, methods, onClose, onPickExisting, onCreateNew }) {
  const [mode, setMode] = useState('pick');
  const [pickedId, setPickedId] = useState('');
  const [newDraft, setNewDraft] = useState({ name: '', description: '' });

  const existingOnTest = new Set(test.testMethods.map(tm => tm.methodId));
  const pickable = methods.filter(m => {
    if (existingOnTest.has(m.id)) return false;
    if (m.source === 'MANUAL') return false;        // Manual is already there
    if (m.source === 'PLUGIN') {
      // Only pickable if the analyzer is mapped to this test. For the mockup
      // we infer the analyzer is mapped iff a method with the same analyzerId
      // is already on the test via ANALYZER_AUTO.
      const mappedAnalyzerIds = new Set(
        test.testMethods
          .filter(tm => tm.source === 'ANALYZER_AUTO')
          .map(tm => methods.find(x => x.id === tm.methodId)?.analyzerId)
      );
      return mappedAnalyzerIds.has(m.analyzerId);
    }
    return true; // USER methods always pickable
  });

  const canSavePick = !!pickedId;
  const newDescError = (newDraft.description || '').length > 500 ? 'Description must be 500 characters or fewer.' : null;
  const newNameError = !newDraft.name ? null :
    methods.some(m => m.source === 'USER' && m.name.trim().toLowerCase() === newDraft.name.trim().toLowerCase())
      ? 'A method with this name already exists.' : null;
  const canSaveNew = !newDescError && !newNameError && newDraft.name;

  return (
    <Modal open modalHeading={t('admin.testCatalog.test.methods.addCta', 'Add method')}
      primaryButtonText={mode === 'pick' ? 'Add to test' : 'Create & add'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={mode === 'pick' ? !canSavePick : !canSaveNew}
      onRequestClose={onClose}
      onRequestSubmit={() => {
        if (mode === 'pick') onPickExisting(pickedId);
        else onCreateNew(newDraft);
      }}>
      <Stack gap={4}>
        <RadioButtonGroup name="add-method-mode" orientation="vertical" valueSelected={mode}
          onChange={(v) => setMode(v)} legendText="How do you want to add a method?">
          <RadioButton id="pick" value="pick" labelText={t('admin.testCatalog.test.methods.pickExisting', 'Pick existing method')} />
          <RadioButton id="create" value="create" labelText={t('admin.testCatalog.test.methods.createNew', 'Create new method')} />
        </RadioButtonGroup>

        {mode === 'pick' && (
          <ComboBox id="pick-method" titleText="Pick a method" placeholder="Search by name"
            items={pickable.map(m => m.id)}
            itemToString={(id) => {
              const m = methods.find(x => x.id === id);
              if (!m) return '';
              const suffix = m.source === 'PLUGIN' ? ` — ${m.analyzerName}` : m.source === 'USER' ? ' — user' : '';
              const descSnippet = m.description
                ? ` · ${m.description.length > 80 ? `${m.description.slice(0, 80)}…` : m.description}`
                : '';
              return `${m.name}${suffix}${descSnippet}`;
            }}
            onChange={({ selectedItem }) => setPickedId(selectedItem || '')} />
        )}

        {mode === 'create' && (
          <Stack gap={3}>
            <TextInput id="new-method-name" labelText="Name"
              value={newDraft.name} onChange={e => setNewDraft({ ...newDraft, name: e.target.value })}
              invalid={!!newNameError} invalidText={newNameError || ''} />
            <TextArea id="new-method-description"
              labelText="Description"
              helperText="Optional. What this method does, when to use it."
              value={newDraft.description}
              onChange={e => setNewDraft({ ...newDraft, description: e.target.value })}
              rows={3}
              maxCount={500}
              enableCounter
              invalid={!!newDescError} invalidText={newDescError || ''} />
            <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              The new method is created in the master catalog and added to this test in one step.
              A code is assigned automatically.
            </p>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}

// ==================== Result entry preview (Sub-4) ====================

function ResultEntryPreview({ tests, methods }) {
  const [selectedTestId, setSelectedTestId] = useState('t1');
  const [selectedMethodId, setSelectedMethodId] = useState('m1');
  const [value, setValue] = useState(17);

  const test = tests.find(tt => tt.id === selectedTestId);
  const allowedMethods = test.testMethods.map(tm => methods.find(m => m.id === tm.methodId)).filter(Boolean);
  // Ensure selected method is one of the allowed ones for this test
  const methodForLookup = allowedMethods.find(m => m.id === selectedMethodId) || allowedMethods[0];

  const methodRange = test.methodRanges.find(r => r.methodId === methodForLookup?.id);
  const resolved = methodRange && (methodRange.low != null || methodRange.high != null)
    ? { low: methodRange.low, high: methodRange.high, units: methodRange.units, source: 'method', label: `Method range (${methodForLookup.name})` }
    : { low: test.testLevelLow, high: test.testLevelHigh, units: test.units, source: 'test', label: 'Test-level range' };

  const numericValue = Number(value);
  const out = (resolved.low != null && numericValue < Number(resolved.low)) ||
              (resolved.high != null && numericValue > Number(resolved.high));

  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">Patient tests</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Result entry preview</BreadcrumbItem>
      </Breadcrumb>
      <div>
        <h2 style={{ marginBottom: '0.25rem' }}>Result entry — method-aware range lookup</h2>
        <p style={{ maxWidth: '56rem', color: 'var(--cds-text-secondary)' }}>
          The out-of-range warning uses the method the tech selected. If the method has no range configured,
          the test's existing test-level range applies — same behavior as today.
        </p>
      </div>

      <Tile>
        <Grid narrow>
          <Column sm={4} md={4} lg={4}>
            <Select id="re-test" labelText="Test" value={selectedTestId} onChange={e => { setSelectedTestId(e.target.value); setSelectedMethodId(''); }}>
              {tests.map(tt => <SelectItem key={tt.id} value={tt.id} text={`${tt.code} — ${tt.name}`} />)}
            </Select>
          </Column>
          <Column sm={4} md={4} lg={4}>
            <Select id="re-method" labelText="Method"
              value={methodForLookup?.id || ''}
              onChange={e => setSelectedMethodId(e.target.value)}>
              {allowedMethods.map(m => <SelectItem key={m.id} value={m.id} text={m.name} />)}
            </Select>
          </Column>
          <Column sm={4} md={4} lg={4}>
            <NumberInput id="re-value" label={`Value (${test.units})`} value={value}
              onChange={(_, { value }) => setValue(value)} />
          </Column>
        </Grid>
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--cds-layer-01)', fontSize: '0.8125rem' }}>
          <strong>Resolved range:</strong>{' '}
          {resolved.low == null && resolved.high == null
            ? `${resolved.label}: not configured — no warning can fire.`
            : `${resolved.label}: ${resolved.low ?? '—'} – ${resolved.high ?? '—'} ${resolved.units}`}
        </div>
        {out && (
          <InlineNotification style={{ marginTop: '0.75rem' }}
            kind="warning"
            title="Result is outside of reporting range"
            subtitle={`Please verify — evaluated against ${resolved.label}.`}
            lowContrast />
        )}
      </Tile>
    </Stack>
  );
}

// ==================== Shell ====================

const SCENES = {
  TESTS: 'tests',
  METHODS: 'methods',
  RESULT_ENTRY: 'result-entry',
};

export default function ReportingRangesMockup() {
  const [methods, setMethods] = useState(initialMethods);
  const [tests, setTests] = useState(initialTests);
  const [scene, setScene] = useState(SCENES.TESTS);
  const [canManage, setCanManage] = useState(true); // P-13 demo toggle

  return (
    <Theme theme="white">
      <HeaderContainer render={({ isSideNavExpanded, onClickSideNavExpand }) => (
        <>
          <Header aria-label="OpenELIS Global">
            <HeaderMenuButton aria-label="Open menu" isCollapsible onClick={onClickSideNavExpand} isActive={isSideNavExpanded} />
            <HeaderName prefix="OpenELIS">Global</HeaderName>
          </Header>
          <SideNav aria-label="Side navigation" isRail expanded={isSideNavExpanded}>
            <SideNavItems>
              <SideNavMenu title="Test Catalog" defaultExpanded>
                <SideNavMenuItem isActive={scene === SCENES.TESTS} onClick={() => setScene(SCENES.TESTS)}>Test Management</SideNavMenuItem>
                <SideNavMenuItem isActive={scene === SCENES.METHODS} onClick={() => setScene(SCENES.METHODS)}>Methods</SideNavMenuItem>
              </SideNavMenu>
              <SideNavMenu title="Patient Tests">
                <SideNavMenuItem isActive={scene === SCENES.RESULT_ENTRY} onClick={() => setScene(SCENES.RESULT_ENTRY)}>Result entry (preview)</SideNavMenuItem>
              </SideNavMenu>
              <SideNavLink onClick={() => setCanManage(!canManage)}>
                {canManage ? 'Demo: Drop TEST_CATALOG_MANAGE' : 'Demo: Grant TEST_CATALOG_MANAGE'}
              </SideNavLink>
            </SideNavItems>
          </SideNav>
          <main style={{ padding: '2rem', marginLeft: '3rem' }}>
            <Grid>
              <Column sm={4} md={8} lg={16}>
                {scene === SCENES.TESTS && (
                  <TestManagementPage tests={tests} setTests={setTests} methods={methods} canManage={canManage} />
                )}
                {scene === SCENES.METHODS && (
                  <MethodsAdminPage methods={methods} setMethods={setMethods} tests={tests} canManage={canManage} />
                )}
                {scene === SCENES.RESULT_ENTRY && (
                  <ResultEntryPreview tests={tests} methods={methods} />
                )}
              </Column>
            </Grid>
          </main>
        </>
      )} />
    </Theme>
  );
}
