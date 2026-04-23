/**
 * T-01: Concept Mapping & Multi-Coding — React/Carbon Mockup
 *
 * Primary surface: Test Editor → Terminology tab. The Test Editor chrome
 * (header + vertical tab sidebar with Configuration / Organization / Resources /
 * Automation / Compliance groups) matches the canonical shell defined by
 * test-catalog-mockup-v2.1.jsx and reused in S01-compliance-standards-mockup.jsx,
 * so all test-editor-embedded mockups remain visually harmonized.
 *
 * The Terminology tab embeds the reusable <MultiCodingPanel> component.
 *
 * Secondary surface: Browse Value Sets drawer (opened from the Multi-Coding Panel
 * toolbar) — shows cached ValueSets with nested member drill-down and "Use this
 * code" to prepopulate the add form.
 *
 * Tertiary surface: Terminology Admin page (Admin → Terminology → Concepts /
 * Value Sets / Bulk Mappings) — tabbed admin surface for the Concept cache and
 * CSV bulk import.
 *
 * The same <MultiCodingPanel> is reused (not re-rendered here) in:
 *   • Sample Type Editor → Basic Info → Codings section      (S-04 addendum)
 *   • Vector Species row expansion → Codings accordion       (V-01 v1.4 addendum)
 *   • Vector Group row expansion → Codings accordion         (V-01 v1.4 addendum)
 *   • Compliance Threshold inline editor → Concept accordion (S-01 v1.1 addendum)
 *
 * Dependencies: @carbon/react, @carbon/icons-react
 * Companion FRS: T01-concept-mapping-multi-coding-frs-v1.0.md
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, TextArea, Select, SelectItem, ComboBox, Toggle,
  Checkbox, Button, IconButton, InlineNotification, Tag, Modal,
  Tile, Breadcrumb, BreadcrumbItem, OverflowMenu, OverflowMenuItem,
  FileUploader,
} from '@carbon/react';
import {
  Add, Edit, TrashCan, ChevronUp, Download,
  CheckmarkFilled, WarningAlt, Search, Close, Save,
} from '@carbon/icons-react';

// i18n helper — in production, resolves to the active locale's message bundle
const t = (key, fallback) => fallback || key;

// =====================================================================
// Source-kind → Carbon Tag kind mapping (FR-T01-022; UI Design §8)
// =====================================================================
const sourceTagKind = {
  SUBSCRIPTION: 'blue',
  SEED_FILE: 'teal',
  MANUAL: 'warm-gray',
};

const sourceLabelKey = {
  SUBSCRIPTION: 'label.multiCoding.source.subscription',
  SEED_FILE: 'label.multiCoding.source.seedFile',
  MANUAL: 'label.multiCoding.source.manual',
};

const sourceLabel = {
  SUBSCRIPTION: 'From subscription',
  SEED_FILE: 'From seed file',
  MANUAL: 'Manual',
};

// Code system → Tag kind mapping (convention, not enforced at DB level)
const codeSystemTagKind = {
  'http://loinc.org': 'green',
  'http://snomed.info/sct': 'purple',
  'https://www.ncbi.nlm.nih.gov/taxonomy': 'cyan',
  'http://purl.obolibrary.org/obo/envo.owl': 'teal',
  'http://openelis-global.org/fhir/CodeSystem/baku-mutu-analytes': 'gray',
};

const codeSystemShortName = {
  'http://loinc.org': 'LOINC',
  'http://snomed.info/sct': 'SNOMED CT',
  'https://www.ncbi.nlm.nih.gov/taxonomy': 'NCBI Taxonomy',
  'http://purl.obolibrary.org/obo/envo.owl': 'ENVO',
  'http://openelis-global.org/fhir/CodeSystem/baku-mutu-analytes': 'Baku Mutu (local)',
};

// =====================================================================
// Mock data — realistic concepts and mappings for a Glucose blood test
// =====================================================================

const mockConceptCache = [
  { id: 101, systemUri: 'http://loinc.org', code: '2339-0', display: 'Glucose [Mass/volume] in Blood', source: 'SUBSCRIPTION', sourceSubscriptionName: 'LOINC Core (OCL)', version: '2.76', isActive: true, lastSyncedAt: '2026-04-18T08:00Z' },
  { id: 102, systemUri: 'http://loinc.org', code: '2345-7', display: 'Glucose [Mass/volume] in Serum or Plasma', source: 'SUBSCRIPTION', sourceSubscriptionName: 'LOINC Core (OCL)', version: '2.76', isActive: true, lastSyncedAt: '2026-04-18T08:00Z' },
  { id: 201, systemUri: 'http://snomed.info/sct', code: '33747003', display: 'Glucose measurement', source: 'SUBSCRIPTION', sourceSubscriptionName: 'SNOMED CT International (OCL)', version: '2025-10-01', isActive: true, lastSyncedAt: '2026-04-17T02:00Z' },
  { id: 301, systemUri: 'http://openelis-global.org/fhir/CodeSystem/baku-mutu-analytes', code: 'BM-GLUC', display: 'Glukosa (Baku Mutu local)', source: 'SEED_FILE', sourceSubscriptionName: null, version: '2024.01', isActive: true, lastSyncedAt: null },
  { id: 401, systemUri: 'https://www.ncbi.nlm.nih.gov/taxonomy', code: '7165', display: 'Anopheles gambiae', source: 'SUBSCRIPTION', sourceSubscriptionName: 'NCBI Taxonomy (OCL)', version: '2025-12', isActive: true, lastSyncedAt: '2026-04-12T06:00Z' },
];

const mockTestMappings = [
  { id: 1, conceptId: 101, isPrimary: true, notes: '', createdBy: 'casey', createdAt: '2026-04-10T09:12Z' },
  { id: 2, conceptId: 201, isPrimary: false, notes: 'Specimen-agnostic SNOMED concept for crosswalk.', createdBy: 'casey', createdAt: '2026-04-10T09:15Z' },
  { id: 3, conceptId: 301, isPrimary: false, notes: 'Required for Baku Mutu PP22/2021 reporting.', createdBy: 'casey', createdAt: '2026-04-10T09:17Z' },
];

const mockValueSets = [
  {
    id: 1,
    name: 'LOINC — Chemistry Core',
    canonicalUrl: 'https://api.openconceptlab.org/orgs/Regenstrief/collections/loinc-chemistry-core/',
    codeSystem: 'http://loinc.org', source: 'LOINC Core (OCL)', version: '2.76',
    memberCount: 412, lastSyncedAt: '2026-04-18T08:00Z',
    members: [
      { conceptId: 101, code: '2339-0', display: 'Glucose [Mass/volume] in Blood' },
      { conceptId: 102, code: '2345-7', display: 'Glucose [Mass/volume] in Serum or Plasma' },
      { conceptId: 103, code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma' },
      { conceptId: 104, code: '2093-3', display: 'Cholesterol [Mass/volume] in Serum or Plasma' },
    ],
  },
  {
    id: 2,
    name: 'Baku Mutu PP22/2021 — Water Parameters',
    canonicalUrl: 'https://api.openconceptlab.org/orgs/openelis-global/collections/BakuMutuWaterParameters/',
    codeSystem: 'http://openelis-global.org/fhir/CodeSystem/baku-mutu-analytes',
    source: 'Seed file', version: '2024.01',
    memberCount: 47, lastSyncedAt: null,
    members: [
      { conceptId: 301, code: 'BM-GLUC', display: 'Glukosa (Baku Mutu local)' },
      { conceptId: 302, code: 'BM-AS', display: 'Arsen (As)' },
      { conceptId: 303, code: 'BM-PB', display: 'Timbal (Pb)' },
    ],
  },
  {
    id: 3,
    name: 'NCBI Taxonomy — Anopheles',
    canonicalUrl: 'https://api.openconceptlab.org/orgs/openelis-global/collections/NCBI-Anopheles/',
    codeSystem: 'https://www.ncbi.nlm.nih.gov/taxonomy',
    source: 'NCBI Taxonomy (OCL)', version: '2025-12',
    memberCount: 32, lastSyncedAt: '2026-04-12T06:00Z',
    members: [
      { conceptId: 401, code: '7165', display: 'Anopheles gambiae' },
      { conceptId: 402, code: '34690', display: 'Anopheles arabiensis' },
    ],
  },
];

// =====================================================================
// <MultiCodingPanel> — FR-T01-030 through FR-T01-033
// Reusable: entityType, entityId, editable, primaryRequired, onChange.
// Here it's wired up standalone with the Glucose test mappings.
// =====================================================================

function MultiCodingPanel({
  entityType = 'TEST',
  entityDisplay = 'Glucose, Blood',
  editable = true,
  primaryRequired = true,
  onOpenValueSetDrawer,
}) {
  const [mappings, setMappings] = useState(mockTestMappings);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [filterSystem, setFilterSystem] = useState('');
  const [notification, setNotification] = useState(null);

  // Add-form local state
  const [addForm, setAddForm] = useState({
    systemUri: 'http://loinc.org',
    conceptId: null,
    isPrimary: false,
    notes: '',
  });

  const conceptById = useMemo(
    () => Object.fromEntries(mockConceptCache.map((c) => [c.id, c])),
    []
  );

  const visibleMappings = useMemo(() => {
    if (!filterSystem) return mappings;
    return mappings.filter((m) => conceptById[m.conceptId]?.systemUri === filterSystem);
  }, [mappings, filterSystem, conceptById]);

  const handleMakePrimary = useCallback((mappingId) => {
    setMappings((prev) =>
      prev.map((m) => ({ ...m, isPrimary: m.id === mappingId }))
    );
    setNotification({
      kind: 'info',
      title: t('message.multiCoding.primaryDemoted', 'Previous primary coding was demoted.'),
    });
  }, []);

  const handleAddMapping = useCallback(() => {
    if (!addForm.conceptId) return;
    const newId = Math.max(0, ...mappings.map((m) => m.id)) + 1;
    const newMapping = {
      id: newId,
      conceptId: addForm.conceptId,
      isPrimary: addForm.isPrimary,
      notes: addForm.notes,
      createdBy: 'casey',
      createdAt: new Date().toISOString(),
    };
    setMappings((prev) => {
      const demoted = addForm.isPrimary
        ? prev.map((m) => ({ ...m, isPrimary: false }))
        : prev;
      return [...demoted, newMapping];
    });
    setShowAddRow(false);
    setAddForm({ systemUri: 'http://loinc.org', conceptId: null, isPrimary: false, notes: '' });
    setNotification({
      kind: 'success',
      title: t('message.multiCoding.saveSuccess', 'Coding saved.'),
    });
  }, [addForm, mappings]);

  const handleRemove = useCallback(() => {
    if (!confirmRemove) return;
    const removing = mappings.find((m) => m.id === confirmRemove);
    const remaining = mappings.filter((m) => m.id !== confirmRemove);

    // BR-T01-06: auto-promote next-created mapping to primary
    let promotedNotice = null;
    if (removing?.isPrimary && remaining.length > 0) {
      const sorted = [...remaining].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      );
      sorted[0].isPrimary = true;
      promotedNotice = {
        kind: 'info',
        title: t('message.multiCoding.primaryAutoPromoted',
          'The next coding was automatically promoted to primary.'),
      };
    }
    setMappings(remaining);
    setConfirmRemove(null);
    setNotification(
      promotedNotice || {
        kind: 'success',
        title: t('message.multiCoding.removeSuccess', 'Coding removed.'),
      }
    );
  }, [confirmRemove, mappings]);

  const headers = [
    { key: 'code', header: t('label.multiCoding.code', 'Code') },
    { key: 'display', header: t('label.multiCoding.display', 'Display') },
    { key: 'codeSystem', header: t('label.multiCoding.codeSystem', 'Code System') },
    { key: 'primary', header: t('label.multiCoding.primary', 'Primary') },
    { key: 'source', header: t('label.multiCoding.source', 'Source') },
    { key: 'actions', header: '' },
  ];

  const rows = visibleMappings.map((m) => {
    const c = conceptById[m.conceptId];
    return {
      id: String(m.id),
      _mapping: m,
      _concept: c,
      code: c?.code,
      display: c?.display,
      codeSystem: c?.systemUri,
      primary: m.isPrimary,
      source: c?.source,
    };
  });

  const primaryRemoving =
    confirmRemove &&
    mappings.find((m) => m.id === confirmRemove)?.isPrimary &&
    mappings.filter((m) => m.id !== confirmRemove).length === 0;

  return (
    <Stack gap={5}>
      {notification && (
        <InlineNotification
          kind={notification.kind}
          title={notification.title}
          onCloseButtonClick={() => setNotification(null)}
          lowContrast
        />
      )}

      {primaryRequired && mappings.length === 0 && (
        <InlineNotification
          kind="error"
          title={t('error.multiCoding.primaryRequired',
            'At least one coding must be marked primary before saving.')}
          hideCloseButton
          lowContrast
        />
      )}

      <TableContainer
        title={t('heading.multiCoding.panelTitle', 'Codings')}
        description={
          entityType === 'TEST'
            ? 'Codings attached to this test. The primary coding appears first in outbound FHIR messages.'
            : 'Codings attached to this entity.'
        }
      >
        <TableToolbar>
          <TableToolbarContent>
            <Select
              id="filterCodeSystem"
              labelText=""
              hideLabel
              size="sm"
              value={filterSystem}
              onChange={(e) => setFilterSystem(e.target.value)}
              style={{ minWidth: '14rem' }}
            >
              <SelectItem value="" text={t('label.multiCoding.filterAll', 'All code systems')} />
              {Object.keys(codeSystemShortName).map((uri) => (
                <SelectItem key={uri} value={uri} text={codeSystemShortName[uri]} />
              ))}
            </Select>
            <Button
              kind="ghost"
              renderIcon={Search}
              onClick={onOpenValueSetDrawer}
              size="sm"
            >
              {t('button.multiCoding.browseValueSets', 'Browse subscribed value sets...')}
            </Button>
            {editable && (
              <Button
                kind="primary"
                renderIcon={Add}
                onClick={() => { setShowAddRow(true); setExpandedRow(null); }}
                size="sm"
              >
                {t('button.multiCoding.add', 'Add Coding')}
              </Button>
            )}
          </TableToolbarContent>
        </TableToolbar>

        <Table size="md" useZebraStyles={false}>
          <TableHead>
            <TableRow>
              {headers.map((h) => (
                <TableHeader key={h.key}>{h.header}</TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {showAddRow && (
              <TableRow>
                <TableCell colSpan={headers.length}>
                  <Tile style={{ padding: '1rem' }}>
                    <h5 style={{ marginBottom: '1rem' }}>
                      {t('heading.multiCoding.addNew', 'Add Coding')}
                    </h5>
                    <Grid>
                      <Column lg={4} md={4} sm={4}>
                        <Select
                          id="addSystemUri"
                          labelText={t('label.multiCoding.codeSystem', 'Code System')}
                          value={addForm.systemUri}
                          onChange={(e) => setAddForm((f) => ({
                            ...f, systemUri: e.target.value, conceptId: null,
                          }))}
                        >
                          {Object.keys(codeSystemShortName).map((uri) => (
                            <SelectItem key={uri} value={uri} text={codeSystemShortName[uri]} />
                          ))}
                        </Select>
                      </Column>
                      <Column lg={8} md={4} sm={4}>
                        <ComboBox
                          id="addConcept"
                          titleText={t('label.multiCoding.concept', 'Concept')}
                          placeholder={
                            t('placeholder.multiCoding.searchConcept',
                              `Type to search concepts in ${codeSystemShortName[addForm.systemUri]}...`)
                          }
                          items={mockConceptCache.filter(
                            (c) => c.systemUri === addForm.systemUri && c.isActive
                          )}
                          itemToString={(c) => (c ? `${c.code} — ${c.display}` : '')}
                          onChange={({ selectedItem }) => setAddForm((f) => ({
                            ...f, conceptId: selectedItem?.id ?? null,
                          }))}
                        />
                      </Column>
                      <Column lg={4} md={4} sm={4}>
                        <Checkbox
                          id="addPrimary"
                          labelText={t('label.multiCoding.markPrimary', 'Mark as primary coding')}
                          checked={addForm.isPrimary}
                          onChange={(_, { checked }) =>
                            setAddForm((f) => ({ ...f, isPrimary: checked }))}
                        />
                      </Column>
                      <Column lg={16} md={8} sm={4}>
                        <TextArea
                          id="addNotes"
                          labelText={t('label.multiCoding.notes', 'Notes')}
                          rows={2}
                          value={addForm.notes}
                          onChange={(e) =>
                            setAddForm((f) => ({ ...f, notes: e.target.value }))}
                        />
                      </Column>
                    </Grid>
                    <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                      <Button kind="primary" size="sm" onClick={handleAddMapping}
                        disabled={!addForm.conceptId}>
                        {t('button.save', 'Save')}
                      </Button>
                      <Button kind="ghost" size="sm"
                        onClick={() => { setShowAddRow(false); setAddForm({
                          systemUri: 'http://loinc.org', conceptId: null,
                          isPrimary: false, notes: '',
                        }); }}>
                        {t('button.cancel', 'Cancel')}
                      </Button>
                    </Stack>
                  </Tile>
                </TableCell>
              </TableRow>
            )}

            {rows.length === 0 && !showAddRow && (
              <TableRow>
                <TableCell colSpan={headers.length}>
                  <Tile style={{ padding: '1rem', textAlign: 'center', color: '#6f6f6f' }}>
                    {t('label.multiCoding.noMappings', 'No codings defined')}
                  </Tile>
                </TableCell>
              </TableRow>
            )}

            {rows.map((row) => (
              <React.Fragment key={row.id}>
                <TableRow>
                  <TableCell>
                    <code>{row.code}</code>
                  </TableCell>
                  <TableCell>{row.display}</TableCell>
                  <TableCell>
                    <Tag type={codeSystemTagKind[row.codeSystem] || 'gray'}>
                      {codeSystemShortName[row.codeSystem] || row.codeSystem}
                    </Tag>
                  </TableCell>
                  <TableCell>
                    {row.primary ? (
                      <Tag type="green" renderIcon={CheckmarkFilled}>
                        {t('label.multiCoding.primaryTag', 'Primary')}
                      </Tag>
                    ) : editable ? (
                      <Button kind="ghost" size="sm" onClick={() =>
                        handleMakePrimary(row._mapping.id)}>
                        {t('button.multiCoding.makePrimary', 'Make Primary')}
                      </Button>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Tag type={sourceTagKind[row.source]}>
                      {sourceLabel[row.source]}
                    </Tag>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Stack orientation="horizontal" gap={2}>
                      {editable && (
                        <IconButton
                          label={t('button.multiCoding.edit', 'Edit')}
                          size="sm"
                          kind="ghost"
                          onClick={() => setExpandedRow(
                            expandedRow === row.id ? null : row.id
                          )}
                        >
                          {expandedRow === row.id ? <ChevronUp /> : <Edit />}
                        </IconButton>
                      )}
                      {editable && (
                        <IconButton
                          label={t('button.multiCoding.remove', 'Remove')}
                          size="sm"
                          kind="danger--ghost"
                          onClick={() => setConfirmRemove(row._mapping.id)}
                        >
                          <TrashCan />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
                {expandedRow === row.id && (
                  <TableRow>
                    <TableCell colSpan={headers.length}>
                      <Tile style={{ padding: '1rem' }}>
                        <h5 style={{ marginBottom: '1rem' }}>
                          {t('heading.multiCoding.edit', 'Edit Coding')}
                        </h5>
                        <Grid>
                          <Column lg={4} md={4} sm={4}>
                            <TextInput
                              id={`edit-system-${row.id}`}
                              labelText={t('label.multiCoding.codeSystem', 'Code System')}
                              value={codeSystemShortName[row.codeSystem] || ''}
                              readOnly
                            />
                          </Column>
                          <Column lg={4} md={4} sm={4}>
                            <TextInput
                              id={`edit-code-${row.id}`}
                              labelText={t('label.multiCoding.code', 'Code')}
                              value={row.code}
                              readOnly
                            />
                          </Column>
                          <Column lg={4} md={4} sm={4}>
                            <Checkbox
                              id={`edit-primary-${row.id}`}
                              labelText={t('label.multiCoding.primary', 'Primary')}
                              checked={row.primary}
                              onChange={(_, { checked }) => {
                                if (checked) handleMakePrimary(row._mapping.id);
                              }}
                            />
                          </Column>
                          <Column lg={16} md={8} sm={4}>
                            <TextArea
                              id={`edit-notes-${row.id}`}
                              labelText={t('label.multiCoding.notes', 'Notes')}
                              rows={2}
                              defaultValue={row._mapping.notes}
                            />
                          </Column>
                        </Grid>
                        <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                          <Button kind="primary" size="sm"
                            onClick={() => setExpandedRow(null)}>
                            {t('button.save', 'Save')}
                          </Button>
                          <Button kind="ghost" size="sm"
                            onClick={() => setExpandedRow(null)}>
                            {t('button.cancel', 'Cancel')}
                          </Button>
                        </Stack>
                      </Tile>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Remove confirmation Modal — FR-T01-025 */}
      {confirmRemove !== null && (
        <Modal
          open
          danger
          modalHeading={t('heading.multiCoding.confirmRemove', 'Remove coding?')}
          primaryButtonText={t('button.multiCoding.remove', 'Remove')}
          secondaryButtonText={t('button.cancel', 'Cancel')}
          onRequestClose={() => setConfirmRemove(null)}
          onRequestSubmit={handleRemove}
        >
          {primaryRemoving ? (
            <p>{t('message.multiCoding.removeLastWarning',
              'Removing the only coding will leave this entity uncoded in FHIR outbound messages. Continue?')}</p>
          ) : (
            <p>This will detach the selected coding from this entity.
              Existing FHIR messages already emitted are unaffected.</p>
          )}
        </Modal>
      )}
    </Stack>
  );
}

// =====================================================================
// <BrowseValueSetsDrawer> — FR-T01-040 to FR-T01-043
// =====================================================================

function BrowseValueSetsDrawer({ open, onClose, onPickConcept, alreadyMappedIds }) {
  const [expandedVs, setExpandedVs] = useState(null);
  const [search, setSearch] = useState('');
  const [systemFilter, setSystemFilter] = useState('');

  const filtered = useMemo(() => {
    return mockValueSets.filter((vs) => {
      if (systemFilter && vs.codeSystem !== systemFilter) return false;
      if (search && !vs.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, systemFilter]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '48rem',
      background: '#fff', boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
      zIndex: 1000, overflowY: 'auto', padding: '1.5rem',
    }}>
      <Stack gap={5}>
        <Stack orientation="horizontal" gap={3}
          style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{t('heading.multiCoding.browseValueSets', 'Browse Value Sets')}</h3>
          <IconButton label={t('button.close', 'Close')} kind="ghost" onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>

        <Grid>
          <Column lg={10} md={6} sm={4}>
            <TextInput
              id="vsSearch"
              labelText={t('label.valueSet.search', 'Search value sets')}
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Column>
          <Column lg={6} md={2} sm={4}>
            <Select
              id="vsSystemFilter"
              labelText={t('label.multiCoding.codeSystem', 'Code System')}
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
            >
              <SelectItem value="" text={t('label.multiCoding.filterAll', 'All code systems')} />
              {Object.keys(codeSystemShortName).map((uri) => (
                <SelectItem key={uri} value={uri} text={codeSystemShortName[uri]} />
              ))}
            </Select>
          </Column>
        </Grid>

        <TableContainer>
          <Table size="md">
            <TableHead>
              <TableRow>
                <TableHeader>{t('label.valueSet.name', 'Name')}</TableHeader>
                <TableHeader>{t('label.multiCoding.codeSystem', 'Code System')}</TableHeader>
                <TableHeader>{t('label.multiCoding.source', 'Source')}</TableHeader>
                <TableHeader>{t('label.concept.version', 'Version')}</TableHeader>
                <TableHeader>{t('label.valueSet.memberCount', 'Members')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((vs) => (
                <React.Fragment key={vs.id}>
                  <TableRow onClick={() => setExpandedVs(
                    expandedVs === vs.id ? null : vs.id
                  )} style={{ cursor: 'pointer' }}>
                    <TableCell>
                      <strong>{vs.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#6f6f6f',
                        fontFamily: 'IBM Plex Mono, monospace' }}>
                        {vs.canonicalUrl}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tag type={codeSystemTagKind[vs.codeSystem] || 'gray'}>
                        {codeSystemShortName[vs.codeSystem]}
                      </Tag>
                    </TableCell>
                    <TableCell>{vs.source}</TableCell>
                    <TableCell>{vs.version}</TableCell>
                    <TableCell>{vs.memberCount}</TableCell>
                  </TableRow>
                  {expandedVs === vs.id && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Tile style={{ padding: '1rem', background: '#f4f4f4' }}>
                          <h5 style={{ marginBottom: '0.75rem' }}>
                            Members ({vs.members.length} of {vs.memberCount} shown)
                          </h5>
                          <Table size="sm">
                            <TableHead>
                              <TableRow>
                                <TableHeader>{t('label.multiCoding.code', 'Code')}</TableHeader>
                                <TableHeader>{t('label.multiCoding.display', 'Display')}</TableHeader>
                                <TableHeader></TableHeader>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {vs.members.map((m) => {
                                const mapped = alreadyMappedIds.includes(m.conceptId);
                                return (
                                  <TableRow key={m.conceptId}>
                                    <TableCell><code>{m.code}</code></TableCell>
                                    <TableCell>{m.display}</TableCell>
                                    <TableCell style={{ textAlign: 'right' }}>
                                      <Button
                                        kind="ghost"
                                        size="sm"
                                        disabled={mapped}
                                        onClick={() => onPickConcept(m)}
                                        title={mapped
                                          ? t('label.valueSet.alreadyMapped', 'Already mapped — edit via the Terminology tab.')
                                          : undefined}
                                      >
                                        {mapped
                                          ? t('label.valueSet.alreadyMapped', 'Already mapped')
                                          : t('label.valueSet.useThisCode', 'Use this code')}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Tile>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </div>
  );
}

// =====================================================================
// <TestEditorTerminologyTab> — primary surface
//
// Uses the canonical Test Editor shell (header + vertical tab sidebar) defined
// by test-catalog-mockup-v2.1.jsx and reused in S01-compliance-standards-mockup.jsx,
// so all test-editor-embedded mockups stay visually harmonized.
//
// Tab groups match the canonical layout:
//   Configuration: Basic Info, Sample & Results, Ranges, Sample Storage
//   Organization:  Display Order, Panels, Labels
//   Resources:     Terminology ← active, Reagents
//   Automation:    Analyzers, Methods, Alerts, Reflex & Calc
//   Compliance:    Compliance
// =====================================================================

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

function TestEditorTerminologyTab() {
  const [activeTab, setActiveTab] = useState('terminology');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const alreadyMappedIds = mockTestMappings.map((m) => m.conceptId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f4f4f4' }}>
      {/* Editor Header — matches test-catalog-mockup-v2.1.jsx */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1rem 1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button kind="ghost" size="sm" href="#">← Back</Button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                Edit Test: Glucose, Blood
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-02)', margin: 0 }}>
                Test ID: TST-000142 &nbsp;|&nbsp; LOINC: 2339-0 (primary) &nbsp;|&nbsp; Sample Type: Whole Blood &nbsp;|&nbsp; Result Type: Numeric
              </p>
            </div>
          </div>
          <Stack orientation="horizontal" gap={3}>
            <Button kind="secondary" size="sm">Cancel</Button>
            <Button kind="primary" size="sm" renderIcon={Save}>Save Test</Button>
          </Stack>
        </div>
      </div>

      {/* Main Content: Vertical Tab Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Vertical Tab Sidebar — 14rem wide, white bg, right border */}
        <nav style={{ width: '14rem', background: '#fff', borderRight: '1px solid #e0e0e0', flexShrink: 0, overflowY: 'auto', padding: '0.5rem' }}>
          {Object.entries(testEditorTabs).map(([group, tabs]) => (
            <div key={group} style={{ marginBottom: '0.75rem' }}>
              <p style={{ padding: '0.375rem 0.75rem', fontSize: '0.6875rem', fontWeight: 600, color: '#a8a8a8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
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

        {/* Tab Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ maxWidth: '64rem' }}>
            {activeTab === 'terminology' && (
              <MultiCodingPanel
                entityType="TEST"
                entityDisplay="Glucose, Blood"
                editable
                primaryRequired
                onOpenValueSetDrawer={() => setDrawerOpen(true)}
              />
            )}
            {activeTab !== 'terminology' && (
              <p style={{ color: 'var(--cds-text-02)' }}>
                (Existing {activeTab} tab content — see test-catalog-mockup-v2.1.jsx)
              </p>
            )}
          </div>
        </div>
      </div>

      <BrowseValueSetsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        alreadyMappedIds={alreadyMappedIds}
        onPickConcept={(m) => {
          // In production, this would prepopulate the MultiCodingPanel's add form
          // via a shared context or lifted state. For the mockup, we just close.
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}

// =====================================================================
// <TerminologyAdminPage> — tertiary admin surface
// Admin → Terminology → Concepts / Value Sets / Bulk Mappings
// =====================================================================

function TerminologyAdminPage() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">Admin</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Terminology</BreadcrumbItem>
      </Breadcrumb>

      <Tile>
        <h2>{t('nav.terminology', 'Terminology')}</h2>
        <p style={{ color: '#6f6f6f' }}>
          Local Concept cache, cached Value Sets, and bulk import for multi-coding mappings.
        </p>
      </Tile>

      <Tabs selectedIndex={tabIndex} onChange={({ selectedIndex }) => setTabIndex(selectedIndex)}>
        <TabList>
          <Tab>{t('heading.terminology.concepts', 'Concepts')}</Tab>
          <Tab>{t('heading.terminology.valueSets', 'Value Sets')}</Tab>
          <Tab>{t('heading.terminology.bulkMappings', 'Bulk Mappings')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <ConceptsTab />
          </TabPanel>
          <TabPanel>
            <ValueSetsTab />
          </TabPanel>
          <TabPanel>
            <BulkMappingsTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  );
}

function ConceptsTab() {
  const [sourceFilter, setSourceFilter] = useState('');
  const filtered = sourceFilter
    ? mockConceptCache.filter((c) => c.source === sourceFilter)
    : mockConceptCache;

  return (
    <TableContainer
      title="Concept Cache"
      description="Concepts stored locally, populated by subscription, seed-file, or manual entry."
    >
      <TableToolbar>
        <TableToolbarContent>
          <TableToolbarSearch placeholder={t('placeholder.concept.search',
            'Search concepts by code or display...')} />
          <Select
            id="conceptSourceFilter"
            labelText=""
            hideLabel
            size="sm"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{ minWidth: '12rem' }}
          >
            <SelectItem value="" text="All sources" />
            <SelectItem value="SUBSCRIPTION" text="From subscription" />
            <SelectItem value="SEED_FILE" text="From seed file" />
            <SelectItem value="MANUAL" text="Manual" />
          </Select>
          <Button kind="primary" renderIcon={Add} size="sm">
            {t('button.concept.addManual', 'Add Manual Concept')}
          </Button>
        </TableToolbarContent>
      </TableToolbar>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('label.multiCoding.code', 'Code')}</TableHeader>
            <TableHeader>{t('label.multiCoding.display', 'Display')}</TableHeader>
            <TableHeader>{t('label.multiCoding.codeSystem', 'Code System')}</TableHeader>
            <TableHeader>{t('label.multiCoding.source', 'Source')}</TableHeader>
            <TableHeader>{t('label.concept.version', 'Version')}</TableHeader>
            <TableHeader>{t('label.concept.isActive', 'Status')}</TableHeader>
            <TableHeader></TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((c) => (
            <TableRow key={c.id}>
              <TableCell><code>{c.code}</code></TableCell>
              <TableCell>{c.display}</TableCell>
              <TableCell>
                <Tag type={codeSystemTagKind[c.systemUri] || 'gray'}>
                  {codeSystemShortName[c.systemUri] || c.systemUri}
                </Tag>
              </TableCell>
              <TableCell>
                <Tag type={sourceTagKind[c.source]}>{sourceLabel[c.source]}</Tag>
                {c.sourceSubscriptionName && (
                  <div style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>
                    {c.sourceSubscriptionName}
                  </div>
                )}
              </TableCell>
              <TableCell>{c.version || '—'}</TableCell>
              <TableCell>
                {c.isActive
                  ? <Tag type="green">{t('label.concept.isActive', 'Active')}</Tag>
                  : <Tag type="gray">{t('label.concept.isRetired', 'Retired')}</Tag>}
              </TableCell>
              <TableCell style={{ textAlign: 'right' }}>
                <OverflowMenu size="sm" flipped>
                  <OverflowMenuItem itemText={t('button.edit', 'Edit')}
                    disabled={c.source !== 'MANUAL'} />
                  <OverflowMenuItem itemText={t('button.retire', 'Retire')} isDelete />
                </OverflowMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ValueSetsTab() {
  return (
    <TableContainer
      title="Value Sets"
      description="Value sets cached from catalog subscriptions or seed files."
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('label.valueSet.name', 'Name')}</TableHeader>
            <TableHeader>{t('label.multiCoding.codeSystem', 'Code System')}</TableHeader>
            <TableHeader>{t('label.multiCoding.source', 'Source')}</TableHeader>
            <TableHeader>{t('label.concept.version', 'Version')}</TableHeader>
            <TableHeader>{t('label.valueSet.memberCount', 'Members')}</TableHeader>
            <TableHeader>{t('label.concept.lastSynced', 'Last Synced')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockValueSets.map((vs) => (
            <TableRow key={vs.id}>
              <TableCell>
                <strong>{vs.name}</strong>
                <div style={{ fontSize: '0.75rem', color: '#6f6f6f',
                  fontFamily: 'IBM Plex Mono, monospace' }}>
                  {vs.canonicalUrl}
                </div>
              </TableCell>
              <TableCell>
                <Tag type={codeSystemTagKind[vs.codeSystem] || 'gray'}>
                  {codeSystemShortName[vs.codeSystem]}
                </Tag>
              </TableCell>
              <TableCell>{vs.source}</TableCell>
              <TableCell>{vs.version}</TableCell>
              <TableCell>{vs.memberCount}</TableCell>
              <TableCell>
                {vs.lastSyncedAt
                  ? new Date(vs.lastSyncedAt).toLocaleString()
                  : <span style={{ color: '#6f6f6f' }}>—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function BulkMappingsTab() {
  const [previewRows] = useState([
    { rowNum: 1, entityType: 'TEST', entityIdentifier: 'TST-000142', systemUri: 'http://loinc.org', code: '2339-0', isPrimary: true, matchStatus: 'matched' },
    { rowNum: 2, entityType: 'TEST', entityIdentifier: 'TST-000142', systemUri: 'http://snomed.info/sct', code: '33747003', isPrimary: false, matchStatus: 'matched' },
    { rowNum: 3, entityType: 'SAMPLE_TYPE', entityIdentifier: 'Whole Blood', systemUri: 'http://snomed.info/sct', code: '258651007', isPrimary: true, matchStatus: 'matched' },
    { rowNum: 4, entityType: 'TEST', entityIdentifier: 'TST-UNKNOWN', systemUri: 'http://loinc.org', code: '9999-9', isPrimary: false, matchStatus: 'notFound' },
    { rowNum: 5, entityType: 'VECTOR_SPECIES', entityIdentifier: 'Anopheles gambiae', systemUri: 'https://www.ncbi.nlm.nih.gov/taxonomy', code: '7165', isPrimary: true, matchStatus: 'matched' },
  ]);
  const [skipErrors, setSkipErrors] = useState(false);

  const matchStatusTag = {
    matched: <Tag type="green" renderIcon={CheckmarkFilled}>Matched</Tag>,
    notFound: <Tag type="red" renderIcon={WarningAlt}>Not Found</Tag>,
    ambiguous: <Tag type="purple" renderIcon={WarningAlt}>Ambiguous</Tag>,
  };

  const errorCount = previewRows.filter((r) => r.matchStatus !== 'matched').length;

  return (
    <Stack gap={5}>
      <Tile>
        <h4>Upload CSV</h4>
        <p style={{ color: '#6f6f6f', marginBottom: '1rem' }}>
          Columns: <code>entity_type</code>, <code>entity_identifier</code>,
          <code>system_uri</code>, <code>code</code>, <code>is_primary</code>
        </p>
        <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
          <Button kind="secondary" renderIcon={Download} size="sm">
            {t('button.bulkMappings.downloadTemplate', 'Download Template')}
          </Button>
          <FileUploader
            accept={['.csv']}
            buttonLabel={t('button.bulkMappings.uploadPreview', 'Upload & Preview')}
            filenameStatus="complete"
            labelDescription=""
            labelTitle=""
            size="sm"
          />
        </Stack>
      </Tile>

      <TableContainer
        title="Preview — bulk_import_2026-04-21.csv"
        description="5 rows parsed · 4 matched · 1 not found"
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>#</TableHeader>
              <TableHeader>{t('label.bulkMappings.entityType', 'Entity Type')}</TableHeader>
              <TableHeader>{t('label.bulkMappings.entityIdentifier', 'Entity Identifier')}</TableHeader>
              <TableHeader>{t('label.multiCoding.codeSystem', 'Code System')}</TableHeader>
              <TableHeader>{t('label.multiCoding.code', 'Code')}</TableHeader>
              <TableHeader>{t('label.multiCoding.primary', 'Primary')}</TableHeader>
              <TableHeader>{t('label.bulkMappings.matchStatus', 'Match Status')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {previewRows.map((r) => (
              <TableRow key={r.rowNum} style={
                r.matchStatus !== 'matched'
                  ? { background: 'rgba(218, 30, 40, 0.08)' }
                  : undefined
              }>
                <TableCell>{r.rowNum}</TableCell>
                <TableCell><code>{r.entityType}</code></TableCell>
                <TableCell>{r.entityIdentifier}</TableCell>
                <TableCell>
                  <Tag type={codeSystemTagKind[r.systemUri] || 'gray'}>
                    {codeSystemShortName[r.systemUri] || r.systemUri}
                  </Tag>
                </TableCell>
                <TableCell><code>{r.code}</code></TableCell>
                <TableCell>
                  {r.isPrimary
                    ? <Tag type="green" renderIcon={CheckmarkFilled}>Yes</Tag>
                    : <span style={{ color: '#6f6f6f' }}>—</span>}
                </TableCell>
                <TableCell>{matchStatusTag[r.matchStatus]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {errorCount > 0 && (
        <InlineNotification
          kind="warning"
          title={`${errorCount} row(s) could not be matched`}
          subtitle="Check 'Skip error rows' to proceed with the remaining rows, or fix the CSV and re-upload."
          lowContrast
          hideCloseButton
        />
      )}

      <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
        <Checkbox
          id="skipErrors"
          labelText="Skip error rows"
          checked={skipErrors}
          onChange={(_, { checked }) => setSkipErrors(checked)}
        />
        <Button kind="primary" disabled={errorCount > 0 && !skipErrors}>
          {t('button.bulkMappings.applyImport', 'Apply Import')}
        </Button>
      </Stack>
    </Stack>
  );
}

// =====================================================================
// App shell — toggles between the two primary screens for review
// =====================================================================

export default function T01ConceptMappingMockup() {
  const [screen, setScreen] = useState('terminology-tab');

  // Demo chrome toggle — a thin horizontal bar at the top lets reviewers switch
  // between the two primary surfaces without disrupting the Test Editor shell.
  const toggleBar = (
    <div style={{
      background: '#fff', borderBottom: '1px solid #e0e0e0',
      padding: '0.5rem 1rem', display: 'flex', alignItems: 'center',
      gap: '0.75rem', flexShrink: 0,
    }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6f6f6f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Mockup view
      </span>
      <Button
        kind={screen === 'terminology-tab' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setScreen('terminology-tab')}
      >
        Test Editor → Terminology Tab
      </Button>
      <Button
        kind={screen === 'admin-page' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setScreen('admin-page')}
      >
        Admin → Terminology
      </Button>
    </div>
  );

  if (screen === 'terminology-tab') {
    // TestEditorTerminologyTab owns its own full-viewport shell. Put the toggle
    // bar above it so the canonical Test Editor chrome (header + sidebar) is
    // preserved exactly as in test-catalog-mockup-v2.1.jsx.
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {toggleBar}
        <div style={{ flex: 1, minHeight: 0 }}>
          <TestEditorTerminologyTab />
        </div>
      </div>
    );
  }

  // Admin page gets the usual padded Stack layout.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f4f4f4' }}>
      {toggleBar}
      <div style={{ padding: '1.5rem' }}>
        <TerminologyAdminPage />
      </div>
    </div>
  );
}
