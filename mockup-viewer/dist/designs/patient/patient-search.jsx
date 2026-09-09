// Route: /PatientManagement  (also /PatientManagement/new, /PatientManagement/:patientPK)
// SideNav: Patient → Add or Modify Patient
// Breadcrumb: Home / Add Or Modify Patient
//
// Patient Search (Shared Panel) — developer-handoff mockup, version-agnostic.
// FRS: patient-search-frs-v1.md (v1.3). Preview: patient-search-preview.html.
//
// One component, <PatientSearchPanel>, embedded by every host that asks "which patient?".
// Hosts pass `allowNewPatient` (only /PatientManagement and the clinical Add Order step set it)
// and receive the selection through `onSelectPatient`, the same contract as today's
// SearchPatientForm `getSelectedPatient`.
//
// Mock data and timers stand in for: the local search (D-1 single-term `q` over the Lucene
// index), the source-scoped registry request (D-3), the enabled identifier types (D-2), and
// "can this user open Patient Merge" (D-8). Replace the three `mock*` functions when wiring.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Grid, Column, Stack, Breadcrumb, BreadcrumbItem, Heading, Section,
  ContentSwitcher, Switch, Search, Button, Accordion, AccordionItem,
  DatePicker, DatePickerInput, RadioButtonGroup, RadioButton, TextInput,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  RadioButton as RowRadio, Pagination, Tag, DismissibleTag, SkeletonPlaceholder, SkeletonText,
  InlineLoading, InlineNotification, Tooltip, Link, Toggle,
} from '@carbon/react';
import { Person } from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// i18n helper (react-intl `intl.formatMessage` in the real component)
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Mock backend (replace when wiring)
// ---------------------------------------------------------------------------

// D-2: identifier types enabled by Patient Entry configuration, in configuration order.
const ENABLED_IDENTIFIERS = [
  { key: 'nationalId', column: t('patient.natioanalid', 'National ID'), helper: t('patient.search.identifier.nationalId', 'national ID') },
  { key: 'subjectNumber', column: t('patient.subject.number', 'Health ID'), helper: t('patient.search.identifier.subjectNumber', 'health ID') },
  { key: 'externalId', column: t('patient.search.column.externalId', 'External ID'), helper: t('patient.search.identifier.externalId', 'external ID') },
  // { key: 'referringSitePatientId', ... }, { key: 'stNumber', ... }  — hidden when disabled
];

// Realistic fixture: five records share national ID 0123456 (the QA finding).
const LOCAL_PATIENTS = [
  { patientID: '503', lastName: 'Sebby', firstName: 'Abby', gender: 'F', dob: '12/03/1988', subjectNumber: 'UHID-000731', nationalId: '0123456', externalId: 'EMR-44821', mothersName: 'Grace Sebby', contactPhone: '+675 7212 0011', guid: 'f1a2-0503', hasPhoto: true, dataSourceName: 'OpenElis' },
  { patientID: '504', lastName: 'Sebby', firstName: 'Abby', gender: 'F', dob: '12/03/1988', subjectNumber: 'UHID-000902', nationalId: '0123456', externalId: '', mothersName: 'Grace Sebby', contactPhone: '', guid: 'f1a2-0504', hasPhoto: false, dataSourceName: 'OpenElis' },
  { patientID: '505', lastName: 'Sebby', firstName: 'Abby', gender: 'F', dob: '03/12/1988', subjectNumber: '', nationalId: '0123456', externalId: 'EMR-51077', mothersName: 'Ruth Kila', contactPhone: '+675 7440 8823', guid: 'f1a2-0505', hasPhoto: true, dataSourceName: 'OpenElis' },
  { patientID: '611', lastName: 'Sebby', firstName: 'Abby', gender: 'F', dob: '12/03/1988', subjectNumber: 'UHID-001188', nationalId: '0123456', externalId: '', mothersName: '', contactPhone: '+675 7212 0011', guid: 'f1a2-0611', hasPhoto: false, dataSourceName: 'OpenElis', isMerged: true, mergedIntoNationalId: '0123456' },
  { patientID: '742', lastName: 'Sebby', firstName: 'Abigail', gender: 'F', dob: '12/03/1998', subjectNumber: 'UHID-002204', nationalId: '0123456', externalId: 'EMR-60214', mothersName: 'Mary Sebby', contactPhone: '+675 7009 1132', guid: 'f1a2-0742', hasPhoto: true, dataSourceName: 'OpenElis' },
];
const REGISTRY_PATIENTS = [
  { patientID: 'CR-88120', lastName: 'Sebby', firstName: 'Abby', gender: 'F', dob: '12/03/1988', subjectNumber: 'UHID-000731', nationalId: '0123456', externalId: '', mothersName: 'Grace Sebby', contactPhone: '+675 7212 0011', guid: 'f1a2-0503', dataSourceName: 'Open Client Registry' },
  { patientID: 'CR-91377', lastName: 'Sebby', firstName: 'Abby', gender: 'F', dob: '12/03/1988', subjectNumber: 'UHID-004410', nationalId: '0123456', externalId: '', mothersName: 'Grace Sebby', contactPhone: '+675 7811 2290', guid: 'c9d0-91377', dataSourceName: 'Open Client Registry' },
];

function matches(p, { q, dob, gender, firstName }) {
  const term = (q || '').trim().toLowerCase();
  let ok = !term || [p.nationalId, p.subjectNumber, p.externalId, p.lastName].some(v => (v || '').toLowerCase().startsWith(term));
  if (dob) ok = ok && p.dob === dob;
  if (gender) ok = ok && p.gender === gender;
  if (firstName) ok = ok && p.firstName.toLowerCase().startsWith(firstName.toLowerCase());
  return ok;
}
// D-1: GET /rest/patient-search-results?q=<term>&source=local&dateOfBirth=&gender=&firstName=
const mockLocalSearch = (criteria) => new Promise(res => setTimeout(() => res(LOCAL_PATIENTS.filter(p => matches(p, criteria))), 500));
// D-3: GET /rest/patient-search-results?q=<term>&source=registry  (rejects on timeout)
const mockRegistrySearch = (criteria, behaviour) => new Promise((res, rej) => setTimeout(() => behaviour === 'fail' ? rej(new Error('timeout')) : res(REGISTRY_PATIENTS.filter(p => matches(p, criteria))), behaviour === 'fail' ? 2500 : 1800));
// FR-15: GET /rest/patient-photos/<id>/true, a few at a time, after rows have rendered
const mockPhoto = (p) => new Promise(res => setTimeout(() => res(p.hasPhoto ? `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect width='32' height='32' fill='%236f6f6f'/></svg>` : null), 400));

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
const initials = (p) => `${(p.firstName || '?')[0]}${(p.lastName || '?')[0]}`.toUpperCase();

function Avatar({ patient, src, loaded }) {
  // Fixed 32px box so the row never changes height (FR-15).
  const box = { width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
  if (!loaded) return <SkeletonPlaceholder style={box} aria-label={t('patient.search.photo.placeholder', `Photo of ${patient.firstName} ${patient.lastName} not loaded`)} />;
  if (src) return <img src={src} alt={`${patient.firstName} ${patient.lastName}`} style={{ ...box, objectFit: 'cover' }} />;
  return <span style={{ ...box, background: 'var(--cds-layer-accent-01)', color: 'var(--cds-text-primary)', fontSize: 'var(--cds-label-01-font-size)', fontWeight: 600 }}>{initials(patient)}</span>;
}

const SOURCE_KIND = { OpenElis: 'blue', 'Open Client Registry': 'teal' };
const SOURCE_LABEL = {
  OpenElis: t('patient.search.source.local', 'This laboratory'),
  'Open Client Registry': t('patient.search.source.registry', 'Client registry'),
};

// ---------------------------------------------------------------------------
// Results table (one group; the panel renders it once for local, once per external source)
// ---------------------------------------------------------------------------
function ResultsGroup({ rows, source, sharedKeys, inRegistryGuids, photos, canOpenMerge, selectedId, onSelect, onImport, importedIds }) {
  const headers = useMemo(() => [
    { key: 'photo', header: t('patient.search.column.photo', 'Photo') },
    { key: 'lastName', header: t('patient.last.name', 'Last name') },
    { key: 'firstName', header: t('patient.first.name', 'First name') },
    { key: 'gender', header: t('patient.gender', 'Sex') },
    { key: 'dob', header: t('patient.dob', 'Date of birth') },
    ...ENABLED_IDENTIFIERS.map(i => ({ key: i.key, header: i.column })),
    { key: 'mothersName', header: t('patient.search.column.mothersName', "Mother's name") },
    { key: 'contactPhone', header: t('patient.search.column.contactPhone', 'Contact phone') },
    { key: 'source', header: t('patient.search.column.source', 'Source') },
  ], []);

  const tableRows = rows.map(p => ({ id: p.patientID, ...p }));

  return (
    <DataTable rows={tableRows} headers={headers} isSortable size="md">
      {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getTableProps, getRowProps }) => (
        <TableContainer title={source === 'OpenElis' ? t('patient.search.results.title', 'Patient results') : t('patient.search.results.external.title', `${SOURCE_LABEL[source]} results`)}>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                <TableHeader aria-label={t('patient.search.column.select', 'Select')} />
                {dtHeaders.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {dtRows.map(row => {
                const p = rows.find(r => r.patientID === row.id);
                const shared = ENABLED_IDENTIFIERS.some(i => p[i.key] && sharedKeys.has(`${i.key}:${p[i.key]}`));
                const sharedInfo = ENABLED_IDENTIFIERS.find(i => p[i.key] && sharedKeys.has(`${i.key}:${p[i.key]}`));
                const inRegistry = inRegistryGuids.has(p.guid);
                return (
                  <TableRow key={row.id} {...getRowProps({ row })} style={{ height: 48 }}>
                    <TableCell>
                      <RowRadio id={`select-${p.patientID}`} name="patient-select" labelText="" hideLabel
                        disabled={!!p.isMerged} checked={selectedId === p.patientID} onClick={() => onSelect(p)} />
                    </TableCell>
                    <TableCell><Avatar patient={p} src={photos[p.patientID]} loaded={source !== 'OpenElis' || p.patientID in photos} /></TableCell>
                    <TableCell>{p.lastName}</TableCell>
                    <TableCell>{p.firstName}</TableCell>
                    <TableCell>{p.gender}</TableCell>
                    <TableCell>{p.dob}</TableCell>
                    {ENABLED_IDENTIFIERS.map(i => <TableCell key={i.key}>{p[i.key] || '—'}</TableCell>)}
                    <TableCell>{p.mothersName || '—'}</TableCell>
                    <TableCell>{p.contactPhone || '—'}</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>
                      <Tag type={SOURCE_KIND[source]} size="sm">{SOURCE_LABEL[source]}</Tag>
                      {p.isMerged && (
                        <Tag type="magenta" size="sm" title={p.mergedIntoNationalId ? `Merged into ${p.mergedIntoNationalId}` : 'Merged'}>
                          {t('patient.search.merged.tag', 'Merged')}
                        </Tag>
                      )}
                      {inRegistry && <Tag type="green" size="sm">{t('patient.search.tag.inRegistry', 'In registry')}</Tag>}
                      {shared && (
                        <Tooltip label={t('patient.search.tag.sharedId.tooltip', `${sharedInfo.column} ${p[sharedInfo.key]} appears on ${rows.filter(r => r[sharedInfo.key] === p[sharedInfo.key]).length} records`)}>
                          {canOpenMerge ? (
                            <Link href={`/PatientMerge?identifier=${sharedInfo.key}&value=${encodeURIComponent(p[sharedInfo.key])}`} title={t('patient.search.tag.sharedId.merge', 'Open in Patient Merge')}>
                              <Tag type="red" size="sm">{t('patient.search.tag.sharedId', 'Shared ID')}</Tag>
                            </Link>
                          ) : (
                            <Tag type="red" size="sm">{t('patient.search.tag.sharedId', 'Shared ID')}</Tag>
                          )}
                        </Tooltip>
                      )}
                      {source !== 'OpenElis' && (
                        <Button kind="tertiary" size="sm" renderIcon={Person} style={{ marginLeft: 'var(--cds-spacing-03)' }}
                          disabled={importedIds.has(p.patientID)} onClick={() => onImport(p)}>
                          {importedIds.has(p.patientID) ? t('patient.search.import.done', 'Patient imported') : t('patient.search.import', 'Import patient')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination page={1} pageSize={10} pageSizes={[10, 20, 30, 50, 100]} totalItems={rows.length} onChange={() => {}} />
        </TableContainer>
      )}
    </DataTable>
  );
}

function SkeletonRows() {
  return (
    <TableContainer title={t('patient.search.results.title', 'Patient results')}>
      <Table size="md"><TableBody>
        {[1, 2, 3, 4, 5].map(i => (
          <TableRow key={i} style={{ height: 48 }}>
            <TableCell><SkeletonPlaceholder style={{ width: 32, height: 32, borderRadius: '50%' }} /></TableCell>
            {[1, 2, 3, 4, 5].map(j => <TableCell key={j}><SkeletonText width="80%" /></TableCell>)}
          </TableRow>
        ))}
      </TableBody></Table>
    </TableContainer>
  );
}

// ---------------------------------------------------------------------------
// The shared panel
// ---------------------------------------------------------------------------
export function PatientSearchPanel({
  allowNewPatient = false,          // FR-4 / FR-33: only /PatientManagement and clinical Add Order set true
  mode = 'search',                  // 'search' | 'new' | 'edit' — synced to the route by the host (FR-2)
  onModeChange = () => {},
  onSelectPatient = () => {},       // FR-32: same contract as today's getSelectedPatient
  externalSources = ['Open Client Registry'], // FR-19: from admin configuration only, never a user control
  canOpenMerge = false,             // D-8: "can this user open Patient Merge"
  registryBehaviour = 'ok',         // mock only: 'ok' | 'fail'
  localBehaviour = 'ok',            // mock only: 'ok' | 'fail'
}) {
  const [q, setQ] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [firstName, setFirstName] = useState('');
  const [state, setState] = useState('initial'); // initial | loading | done | error
  const [local, setLocal] = useState([]);
  const [registry, setRegistry] = useState({ status: 'idle', rows: [] }); // idle | pending | done | failed
  const [photos, setPhotos] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [importedIds, setImportedIds] = useState(new Set());
  const [lastTerm, setLastTerm] = useState('');
  const [showMerged, setShowMerged] = useState(false); // FR-18: off on every new search, never remembered
  const criteriaRef = useRef({});

  const MIN_TERM = 2; // FR-8
  const canSubmit = q.trim().length >= MIN_TERM || (!q.trim() && !!dob); // FR-11
  const registryEnabled = externalSources.length > 0;
  const sourceLabel = SOURCE_LABEL['Open Client Registry'];

  const runRegistry = useCallback(() => {
    if (!registryEnabled) return;
    setRegistry({ status: 'pending', rows: [] });
    mockRegistrySearch(criteriaRef.current, registryBehaviour)
      .then(rows => setRegistry({ status: 'done', rows }))
      .catch(() => setRegistry({ status: 'failed', rows: [] }));
  }, [registryEnabled, registryBehaviour]);

  const submit = (e) => {
    e && e.preventDefault();
    if (!canSubmit) return;
    criteriaRef.current = { q: q.trim(), dob, gender, firstName };
    setLastTerm(q.trim()); setSelectedId(null); setPhotos({}); setShowMerged(false); setState('loading');
    if (localBehaviour === 'fail') { setTimeout(() => setState('error'), 500); return; }
    mockLocalSearch(criteriaRef.current).then(rows => {
      setLocal(rows); setState('done');
      // FR-15: photos load after rows settle, a few at a time, without re-rendering the table structure
      rows.slice(0, 20).forEach((p, i) => setTimeout(() => mockPhoto(p).then(src => setPhotos(prev => ({ ...prev, [p.patientID]: src }))), 300 + i * 120));
    });
    runRegistry(); // FR-20: issued at the same moment as the local query
  };

  // FR-18: merged patients hidden by default; excluded from the Shared ID count
  const activeLocal = useMemo(() => local.filter(p => !p.isMerged), [local]);
  const mergedCount = local.length - activeLocal.length;
  const visibleLocal = showMerged ? local : activeLocal;

  // FR-16: shared identifier values within the active local result set
  const sharedKeys = useMemo(() => {
    const s = new Set();
    ENABLED_IDENTIFIERS.forEach(i => {
      const counts = {};
      activeLocal.forEach(p => { if (p[i.key]) counts[p[i.key]] = (counts[p[i.key]] || 0) + 1; });
      Object.entries(counts).forEach(([v, c]) => { if (c > 1) s.add(`${i.key}:${v}`); });
    });
    return s;
  }, [activeLocal]);

  // FR-21: fold registry hits that match a local patient by FHIR identifier
  const localGuids = useMemo(() => new Set(local.map(p => p.guid)), [local]);
  const registryOnly = registry.rows.filter(r => !localGuids.has(r.guid));
  const inRegistryGuids = new Set(registry.rows.filter(r => localGuids.has(r.guid)).map(r => r.guid));

  const refinements = [
    dob && { key: 'dob', label: t('patient.search.refine.tag.dob', `Date of birth: ${dob}`), clear: () => setDob('') },
    gender && { key: 'gender', label: t('patient.search.refine.tag.sex', `Sex: ${gender === 'F' ? t('patient.female', 'Female') : t('patient.male', 'Male')}`), clear: () => setGender('') },
    firstName && { key: 'firstName', label: t('patient.search.refine.tag.firstName', `First name: ${firstName}`), clear: () => setFirstName('') },
  ].filter(Boolean);

  const selectPatient = (p) => { setSelectedId(p.patientID); onSelectPatient({ ...p, photo: photos[p.patientID] || '' }); };
  const importPatient = (p) => { setImportedIds(prev => new Set([...prev, p.patientID])); /* POST /rest/PatientManagement as today, then select */ };

  const showCreate = allowNewPatient && registry.status !== 'pending'; // FR-27: never while the registry is still answering

  return (
    <Stack gap={5}>
      {allowNewPatient && (
        <ContentSwitcher selectedIndex={mode === 'search' ? 0 : 1} onChange={({ index }) => onModeChange(index === 0 ? 'search' : 'new')} size="md" style={{ maxWidth: 420 }}>
          <Switch name="search" text={t('search.patient.label', 'Search for Patient')} />
          <Switch name="new" text={t('new.patient.label', 'New Patient')} disabled={mode === 'edit'} />
        </ContentSwitcher>
      )}

      {mode !== 'search' && allowNewPatient ? (
        // The existing CreatePatientForm renders here for 'new' and 'edit'. Out of scope; not redrawn.
        <InlineNotification kind="info" lowContrast hideCloseButton title={t('new.patient.label', 'New Patient')}
          subtitle="CreatePatientForm (existing) renders here at /PatientManagement/new and /PatientManagement/:patientPK." />
      ) : (
        <>
          <form onSubmit={submit}>
            <Grid narrow>
              <Column lg={10} md={6} sm={4}>
                <Search id="patient-search-q" size="lg" labelText={t('patient.search.input.label', 'Search for a patient')}
                  placeholder={t('patient.search.input.placeholder', 'ID, lab number, or last name')}
                  value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ('')} />
                <p style={{ font: 'var(--cds-helper-text-01)', color: 'var(--cds-text-helper)', marginTop: 'var(--cds-spacing-02)' }}>
                  {t('patient.search.input.helper', `Accepts ${ENABLED_IDENTIFIERS.map(i => i.helper).join(', ')}, lab number, or last name`)}
                </p>
              </Column>
              <Column lg={2} md={2} sm={4}>
                <Button type="submit" kind="primary" disabled={!canSubmit} style={{ marginTop: 'var(--cds-spacing-06)' }}>
                  {t('label.button.search', 'Search')}
                </Button>
              </Column>
            </Grid>

            {refinements.length > 0 && (
              <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-03)', alignItems: 'center' }}>
                {refinements.map(r => <DismissibleTag key={r.key} type="gray" text={r.label} onClose={r.clear} />)}
                <Button kind="ghost" size="sm" onClick={() => { setDob(''); setGender(''); setFirstName(''); }}>{t('patient.search.refine.clear', 'Clear refinements')}</Button>
              </Stack>
            )}

            <Accordion style={{ maxWidth: 720, marginTop: 'var(--cds-spacing-03)' }}>
              <AccordionItem title={t('patient.search.refine.title', 'Refine by demographics')}>
                <Grid narrow>
                  <Column lg={4} md={3} sm={4}>
                    <DatePicker datePickerType="single" dateFormat="d/m/Y" maxDate={new Date()} onChange={([d]) => setDob(d ? d.toLocaleDateString('en-GB') : '')}>
                      <DatePickerInput id="refine-dob" labelText={t('patient.dob', 'Date of birth')} placeholder="dd/mm/yyyy" />
                    </DatePicker>
                  </Column>
                  <Column lg={4} md={3} sm={4}>
                    <RadioButtonGroup legendText={t('patient.gender', 'Sex')} name="refine-sex" valueSelected={gender} onChange={setGender}>
                      <RadioButton id="refine-sex-m" labelText={t('patient.male', 'Male')} value="M" />
                      <RadioButton id="refine-sex-f" labelText={t('patient.female', 'Female')} value="F" />
                    </RadioButtonGroup>
                  </Column>
                  <Column lg={4} md={2} sm={4}>
                    <TextInput id="refine-first-name" labelText={t('patient.first.name', 'First name')} value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </Column>
                </Grid>
              </AccordionItem>
            </Accordion>
          </form>

          {/* Results */}
          {state === 'initial' && (
            <p style={{ textAlign: 'center', padding: 'var(--cds-spacing-09)', color: 'var(--cds-text-secondary)' }}>
              {t('patient.search.empty.initial', 'Search for a patient by ID, lab number, or name.')}
            </p>
          )}
          {state === 'loading' && <SkeletonRows />}
          {state === 'error' && (
            <InlineNotification kind="error" lowContrast title={t('notification.title', 'Notification')}
              subtitle={t('patient.search.error.local', 'Search could not be completed. Try again.')}
              actionButtonLabel={t('patient.search.external.retry', 'Retry')} onActionButtonClick={submit} />
          )}
          {state === 'done' && (
            <Stack gap={6}>
              {visibleLocal.length > 0 ? (
                <div>
                  {mergedCount > 0 && (
                    <Stack orientation="horizontal" gap={4} style={{ justifyContent: 'flex-end', alignItems: 'center', marginBottom: 'var(--cds-spacing-03)' }}>
                      <span style={{ color: 'var(--cds-text-secondary)', font: 'var(--cds-helper-text-01)' }}>
                        {t('patient.search.filter.mergedHidden', `${mergedCount} merged patient(s) hidden`)}
                      </span>
                      <Toggle id="show-merged" size="sm" labelText="" hideLabel labelA={t('patient.search.filter.showMerged', 'Show merged patients')} labelB={t('patient.search.filter.showMerged', 'Show merged patients')}
                        toggled={showMerged} onToggle={setShowMerged} />
                    </Stack>
                  )}
                  <ResultsGroup rows={visibleLocal} source="OpenElis" sharedKeys={sharedKeys} inRegistryGuids={inRegistryGuids} photos={photos}
                    canOpenMerge={canOpenMerge} selectedId={selectedId} onSelect={selectPatient} onImport={() => {}} importedIds={importedIds} />
                </div>
              ) : (
                <Stack gap={4} style={{ textAlign: 'center', padding: 'var(--cds-spacing-09)', color: 'var(--cds-text-secondary)' }}>
                  {registry.status === 'pending' && <InlineLoading description={t('patient.search.empty.localPending', `No local patient matched "${lastTerm}". Searching ${sourceLabel}…`)} />}
                  {registry.status === 'failed' && <span>{t('patient.search.empty.externalFailed', `No local patient matched "${lastTerm}". ${sourceLabel} did not respond.`)}</span>}
                  {registry.status === 'done' && registryOnly.length === 0 && <span>{t('patient.search.empty.none', `No patient matched "${lastTerm}" locally or in ${sourceLabel}.`)}</span>}
                  {registry.status === 'done' && registryOnly.length > 0 && <span>{t('patient.search.empty.local.seeExternal', `No local patient matched "${lastTerm}". See ${sourceLabel} results below.`)}</span>}
                  {registry.status === 'idle' && <span>{t('patient.search.empty.local', `No patient matched "${lastTerm}".`)}</span>}
                  {showCreate && <div><Button kind="tertiary" onClick={() => onModeChange('new')}>{t('patient.search.empty.create', 'Create new patient')}</Button></div>}
                </Stack>
              )}

              {registry.status !== 'idle' && (
                <div>
                  {registry.status === 'pending' && <InlineLoading description={t('patient.search.external.loading', `Searching ${sourceLabel}…`)} />}
                  {registry.status === 'failed' && (
                    <InlineNotification kind="warning" lowContrast hideCloseButton title={sourceLabel}
                      subtitle={t('patient.search.external.failed', `${sourceLabel} did not respond. Local results are shown.`)}
                      actionButtonLabel={t('patient.search.external.retry', 'Retry')} onActionButtonClick={runRegistry} />
                  )}
                  {registry.status === 'done' && registryOnly.length > 0 && (
                    <ResultsGroup rows={registryOnly} source="Open Client Registry" sharedKeys={new Set()} inRegistryGuids={new Set()} photos={{}}
                      canOpenMerge={false} selectedId={selectedId} onSelect={selectPatient} onImport={importPatient} importedIds={importedIds} />
                  )}
                  {registry.status === 'done' && registryOnly.length === 0 && (
                    <p style={{ color: 'var(--cds-text-secondary)' }}>
                      {inRegistryGuids.size > 0
                        ? t('patient.search.external.folded', `${inRegistryGuids.size} ${sourceLabel} match(es) already shown above as a local patient.`)
                        : t('patient.search.external.none', `No additional patients in ${sourceLabel}.`)}
                    </p>
                  )}
                </div>
              )}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Host page: /PatientManagement (the canonical page). Other hosts embed <PatientSearchPanel>
// with allowNewPatient={false} and their own breadcrumb/heading.
// ---------------------------------------------------------------------------
export default function PatientManagementPage() {
  const [mode, setMode] = useState('search'); // in the app: derived from useParams()/history (FR-2)
  return (
    <Grid fullWidth>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('home.label', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('patient.label.modify', 'Add Or Modify Patient')}</BreadcrumbItem>
        </Breadcrumb>
        <Section level={1}><Heading style={{ margin: 'var(--cds-spacing-05) 0' }}>{t('patient.label.modify', 'Add Or Modify Patient')}</Heading></Section>
        <PatientSearchPanel
          allowNewPatient
          mode={mode}
          onModeChange={setMode}
          onSelectPatient={(p) => console.log('selected', p)} // host navigates to /PatientManagement/:patientPK
          externalSources={['Open Client Registry']}
          canOpenMerge={false}
        />
      </Column>
    </Grid>
  );
}
