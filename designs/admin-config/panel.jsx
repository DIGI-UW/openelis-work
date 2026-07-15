// Route: /admin/TestCatalogList?entity=panels (list) · /MasterListsPage/TestCatalogEditor/panel/<id>/<section> (editor)
// SideNav: Admin → Test Catalog Management → Panels (peer of Tests / Sample Types / Lab Units)
// Breadcrumb: Home / Admin Management / Test Catalog Management / Panels / <name>
// FRS: panel-management (v2.2) — OGC-224. Data model authority: test-catalog-data-model.md.
// Key decisions encoded: single required domain (unbuilt on develop — Dependency 1, Clinical at launch);
// sample types DERIVED from member tests (SAMPLETYPE_PANEL stays backend-synced, never surfaced);
// LOINC = the panel's identifier, live FHIR routing key (no code field); domain-guarded membership;
// activation requires ≥1 test; terminology = full mapper incl. WHONET.
import React, { useState } from 'react';
import {
  Stack, Breadcrumb, BreadcrumbItem,
  Table, TableContainer, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, TextArea, Select, SelectItem, ComboBox, RadioButtonGroup, RadioButton,
  Toggle, Button, IconButton, InlineNotification, Tag, Tile, Link,
} from '@carbon/react';
import { Add, TrashCan, ArrowUp, ArrowDown } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

const PANELS = [
  { id: 1, name: 'Complete Blood Count', loinc: '58410-2', tests: 8, domain: 'CLINICAL', derived: ['Whole Blood (EDTA)'], active: true },
  { id: 2, name: 'Basic Metabolic Panel', loinc: '51990-0', tests: 8, domain: 'CLINICAL', derived: ['Serum', 'Plasma (EDTA)'], active: true },
  { id: 3, name: 'Comprehensive Metabolic Panel', loinc: '24323-8', tests: 14, domain: 'CLINICAL', derived: ['Serum'], active: true },
  { id: 4, name: 'Lipid Panel', loinc: '24331-1', tests: 4, domain: 'CLINICAL', derived: ['Serum'], active: true },
  { id: 5, name: 'Thyroid Function Panel', loinc: '55204-3', tests: 3, domain: 'CLINICAL', derived: ['Serum'], active: false },
];
const MEMBER_TESTS = [
  { name: 'White Blood Cell Count', code: 'WBC' }, { name: 'Red Blood Cell Count', code: 'RBC' },
  { name: 'Hemoglobin (Whole Blood)', code: 'HGB-WB' }, { name: 'Hematocrit', code: 'HCT' },
  { name: 'Platelet Count', code: 'PLT' }, { name: 'Neutrophils %', code: 'NEUT' },
];
const ADDABLE = ['Lymphocytes % — LYMPH', 'Monocytes % — MONO', 'Eosinophils % — EOS', 'Basophils % — BASO', 'Reticulocyte Count — RETIC'];
const TERMS_SEED = [
  { source: 'LOINC', code: '58410-2', rel: 'Same as', primary: true },
  { source: 'SNOMED CT', code: '26604007', rel: 'Same as', primary: false },
];
const domainTag = (d) => <Tag type={d === 'CLINICAL' ? 'blue' : 'teal'} size="sm">{d.charAt(0) + d.slice(1).toLowerCase()}</Tag>;

/* ---------------- List ---------------- */
function PanelsList({ openRecord, openNew }) {
  return (
    <Stack gap={4}>
      <InlineNotification kind="info" lowContrast hideCloseButton
        title={t('note.panel.domainUpgrade', 'Panels now have a Domain; existing panels were set to Clinical.')}
        subtitle={t('note.panel.domainLaterPhase', 'Environmental and Vector domains are enabled in a later phase.')} />
      <TableContainer title={t('title.panel.list', 'Panels')}
        description={t('desc.panel.list', 'Ordered bundles of tests; sample types derive from the member tests')}>
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch placeholder={t('label.panel.search', 'Search by name or LOINC')} persistent />
            <Select id="pf-domain" inline labelText={t('label.filter.domain', 'Domain')} defaultValue="">
              <SelectItem value="" text={t('label.filter.allDomains', 'All domains')} />
              <SelectItem value="CLINICAL" text="Clinical" /><SelectItem value="ENVIRONMENTAL" text="Environmental" /><SelectItem value="VECTOR" text="Vector" />
            </Select>
            <Select id="pf-status" inline labelText={t('label.filter.status', 'Status')} defaultValue="">
              <SelectItem value="" text={t('label.filter.all', 'All')} />
              <SelectItem value="Y" text="Active" /><SelectItem value="N" text="Inactive" />
            </Select>
            <Button renderIcon={Add} size="sm" onClick={openNew}>{t('button.panel.add', 'Add Panel')}</Button>
          </TableToolbarContent>
        </TableToolbar>
        <Table size="lg">
          <TableHead><TableRow>
            <TableHeader>{t('label.panel.col.name', 'Panel Name')}</TableHeader>
            <TableHeader>LOINC</TableHeader>
            <TableHeader>{t('label.panel.col.tests', 'Tests')}</TableHeader>
            <TableHeader>{t('label.panel.col.domain', 'Domain')}</TableHeader>
            <TableHeader>{t('label.panel.col.sampleTypes', 'Sample Types (derived)')}</TableHeader>
            <TableHeader>{t('label.panel.col.status', 'Status')}</TableHeader>
            <TableHeader style={{ width: '6rem' }} />
          </TableRow></TableHead>
          <TableBody>
            {PANELS.map((p) => (
              <TableRow key={p.id}>
                <TableCell><Link onClick={() => openRecord(p)}>{p.name}</Link></TableCell>
                <TableCell><code>{p.loinc}</code></TableCell>
                <TableCell>{p.tests}</TableCell>
                <TableCell>{domainTag(p.domain)}</TableCell>
                <TableCell>{p.derived.map((s) => <Tag key={s} type="gray" size="sm">{s}</Tag>)}</TableCell>
                <TableCell><Tag type={p.active ? 'green' : 'gray'} size="sm">{p.active ? 'Active' : 'Inactive'}</Tag></TableCell>
                <TableCell><Button kind="ghost" size="sm" onClick={() => openRecord(p)}>{t('button.edit', 'Edit')}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

/* ---------------- Basic Info ---------------- */
function BasicInfoSection({ p, isNew, memberCount }) {
  const [active, setActive] = useState(isNew ? false : p.active);
  const canActivate = memberCount > 0; // activation rule: never active with zero tests
  return (
    <Stack gap={5} style={{ maxWidth: '40rem' }}>
      <TextInput id="p-name" labelText={t('label.panel.name', 'Panel name')}
        defaultValue={isNew ? '' : p.name} placeholder={isNew ? 'e.g. Anemia Workup' : ''} />
      <RadioButtonGroup legendText={t('label.panel.domain', 'Domain')} name="p-domain"
        defaultSelected={isNew ? 'CLINICAL' : p.domain} orientation="horizontal">
        <RadioButton labelText="Clinical" value="CLINICAL" id="pd-cl" />
        <RadioButton labelText="Environmental" value="ENVIRONMENTAL" id="pd-env" disabled />
        <RadioButton labelText="Vector" value="VECTOR" id="pd-vec" disabled />
      </RadioButtonGroup>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '-0.75rem' }}>
        {t('helper.panel.domainGuard', 'Only Clinical-domain tests can be added to this panel.')}{' '}
        {t('note.panel.domainLaterPhase', 'Environmental / Vector arrive in a later phase.')}</p>
      <div>
        <div className="cds--label">{t('label.panel.sampleTypes', 'Sample Types')}</div>
        <Tile style={{ padding: 'var(--cds-spacing-04)', border: '1px dashed var(--cds-border-subtle)' }}>
          {(isNew ? [] : p.derived).length ? p.derived.map((s) => <Tag key={s} type="gray" size="sm">{s}</Tag>) : '—'}
        </Tile>
        <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
          {t('note.panel.sampleTypesDerived', 'Derived from the tests in this panel — not edited here. (Order entry stays in sync automatically.)')}</p>
      </div>
      <TextArea id="p-desc" labelText={t('label.panel.description', 'Description')} rows={2} />
      <Toggle id="p-active" labelText={t('label.panel.active', 'Active')} labelA="Inactive" labelB="Active"
        toggled={active} onToggle={setActive} disabled={!canActivate} />
      {!canActivate && (
        <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '-0.75rem' }}>
          {t('helper.panel.needsTest', 'Add at least one test before this panel can be activated.')}</p>
      )}
      <div><Button kind="primary">{t('button.save', 'Save')}</Button></div>
    </Stack>
  );
}

/* ---------------- Tests (the centerpiece) — domain-guarded, ordered ---------------- */
function TestsSection({ members, setMembers }) {
  const move = (i, d) => setMembers((m) => {
    const j = i + d; if (j < 0 || j >= m.length) return m;
    const next = [...m]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });
  return (
    <Stack gap={5} style={{ maxWidth: '46rem' }}>
      <p style={{ fontSize: '0.875rem' }}><strong>{members.length}</strong> {t('label.panel.testsCount', 'tests')}</p>
      <ComboBox id="add-test" titleText={t('label.panel.addTest', 'Add a test')}
        items={ADDABLE} placeholder={t('placeholder.panel.addTest', 'Search by name or code…')}
        helperText={t('helper.panel.domainGuard', 'Only Clinical-domain tests are offered — a panel never mixes domains. Membership writes keep order entry’s panel list in sync.')}
        onChange={({ selectedItem }) => {
          if (!selectedItem) return;
          const [name, code] = selectedItem.split(' — ');
          setMembers((m) => (m.some((x) => x.code === code) ? m : [...m, { name, code }]));
        }} />
      <Table size="md">
        <TableHead><TableRow>
          <TableHeader style={{ width: '6rem' }}>{t('label.panel.col.order', 'Order')}</TableHeader>
          <TableHeader>{t('label.panel.col.testName', 'Test Name')}</TableHeader>
          <TableHeader>{t('label.panel.col.code', 'Code')}</TableHeader>
          <TableHeader style={{ width: '9rem' }} />
        </TableRow></TableHead>
        <TableBody>
          {members.length === 0 ? (
            <TableRow><TableCell colSpan={4} style={{ color: 'var(--cds-text-secondary)' }}>
              {t('empty.panel.tests', 'No tests yet — search above to add the first one.')}</TableCell></TableRow>
          ) : members.map((m, i) => (
            <TableRow key={m.code}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{m.name}</TableCell>
              <TableCell><code>{m.code}</code></TableCell>
              <TableCell>
                <IconButton kind="ghost" size="sm" label="Up" onClick={() => move(i, -1)}><ArrowUp /></IconButton>
                <IconButton kind="ghost" size="sm" label="Down" onClick={() => move(i, 1)}><ArrowDown /></IconButton>
                <IconButton kind="ghost" size="sm" label={t('button.remove', 'Remove')}
                  onClick={() => setMembers((x) => x.filter((_, j) => j !== i))}><TrashCan /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
        {t('note.panel.positionShared', 'Position writes panel_item.sort_order — the same field the test-side Panels section edits.')}</p>
      <div><Button kind="primary">{t('button.save', 'Save')}</Button></div>
    </Stack>
  );
}

/* ---------------- Terminology — full mapper; LOINC = primary identifier + live routing key ---------------- */
function TerminologySection() {
  const [maps, setMaps] = useState(TERMS_SEED);
  const [source, setSource] = useState('SNOMED CT');
  const [code, setCode] = useState('');
  const [rel, setRel] = useState('Same as');
  return (
    <Stack gap={5} style={{ maxWidth: '46rem' }}>
      <InlineNotification kind="info" lowContrast hideCloseButton
        title={t('helper.panel.loincIsIdentifier', "The panel's LOINC serves as its identifier")}
        subtitle={t('helper.panel.loincRouting', 'It is also a live routing key — FHIR e-orders match panels by this code at intake. The primary LOINC stays denormalized on the panel for list display and order entry.')} />
      <Table size="md">
        <TableHead><TableRow>
          <TableHeader>{t('label.terminology.source', 'Coding system')}</TableHeader>
          <TableHeader>{t('label.terminology.code', 'Code')}</TableHeader>
          <TableHeader>{t('label.terminology.relationship', 'How it relates')}</TableHeader>
          <TableHeader style={{ width: '5rem' }} />
        </TableRow></TableHead>
        <TableBody>
          {maps.map((m, i) => (
            <TableRow key={i}>
              <TableCell>{m.source} {m.primary && <Tag type="blue" size="sm">{t('tag.terminology.primary', 'Primary')}</Tag>}</TableCell>
              <TableCell><code>{m.code}</code></TableCell>
              <TableCell>{m.rel}</TableCell>
              <TableCell>{!m.primary && (
                <IconButton kind="ghost" size="sm" label={t('button.remove', 'Remove')}
                  onClick={() => setMaps((x) => x.filter((_, j) => j !== i))}><TrashCan /></IconButton>)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Stack orientation="horizontal" gap={4} style={{ alignItems: 'end', flexWrap: 'wrap' }}>
        <Select id="pt-source" labelText={t('label.terminology.source', 'Coding system')} value={source} onChange={(e) => setSource(e.target.value)}>
          <SelectItem value="LOINC" text="LOINC" /><SelectItem value="SNOMED CT" text="SNOMED CT" />
          <SelectItem value="CIEL" text="CIEL" /><SelectItem value="OCL" text="OCL" /><SelectItem value="WHONET" text="WHONET" />
        </Select>
        <TextInput id="pt-code" labelText={t('label.terminology.code', 'Code')} value={code} onChange={(e) => setCode(e.target.value)} style={{ maxWidth: '10rem' }} />
        <Select id="pt-rel" labelText={t('label.terminology.relationship', 'How it relates')} value={rel} onChange={(e) => setRel(e.target.value)}>
          <SelectItem value="Same as" text="Same as" /><SelectItem value="Broader than" text="Broader than" /><SelectItem value="Narrower than" text="Narrower than" />
        </Select>
        <Button kind="tertiary" renderIcon={Add} onClick={() => { if (code.trim()) { setMaps((m) => [...m, { source, code: code.trim(), rel, primary: false }]); setCode(''); } }}>
          {t('button.terminology.add', 'Add code')}</Button>
      </Stack>
      <div><Button kind="primary">{t('button.save', 'Save')}</Button></div>
    </Stack>
  );
}

/* ---------------- Editor shell + root ---------------- */
const SECTIONS = ['Basic Info', 'Tests', 'Terminology'];

export default function PanelManagement() {
  const [record, setRecord] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [section, setSection] = useState('Basic Info');
  const [members, setMembers] = useState(MEMBER_TESTS);
  const openRecord = (p) => { setRecord(p); setIsNew(false); setSection('Basic Info'); setMembers(MEMBER_TESTS.slice(0, Math.min(p.tests, MEMBER_TESTS.length))); };
  const openNew = () => { setRecord({ name: '', loinc: '', domain: 'CLINICAL', derived: [], active: false, tests: 0 }); setIsNew(true); setSection('Basic Info'); setMembers([]); };
  return (
    <div style={{ padding: 'var(--cds-spacing-05)' }}>
      <Breadcrumb noTrailingSlash style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <BreadcrumbItem>{t('label.breadcrumb.home', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem>{t('label.breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
        <BreadcrumbItem>{t('label.breadcrumb.testCatalogManagement', 'Test Catalog Management')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('label.testCatalog.entity.panels', 'Panels')}</BreadcrumbItem>
      </Breadcrumb>
      {record === null ? (
        <PanelsList openRecord={openRecord} openNew={openNew} />
      ) : (
        <Stack gap={4}>
          <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center' }}>
            <Button kind="ghost" size="sm" onClick={() => setRecord(null)}>← {t('button.backToList', 'Back to list')}</Button>
            <h3 style={{ margin: 0 }}>{isNew ? t('title.panel.new', 'New panel') : record.name}</h3>
            <Tag type="purple" size="sm">PANEL</Tag>{!isNew && domainTag(record.domain)}
          </Stack>
          <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
            {SECTIONS.map((s) => (
              <Button key={s} size="sm" kind={section === s ? 'primary' : 'ghost'} onClick={() => setSection(s)}>{s}</Button>
            ))}
          </Stack>
          {section === 'Basic Info' && <BasicInfoSection p={record} isNew={isNew} memberCount={members.length} />}
          {section === 'Tests' && <TestsSection members={members} setMembers={setMembers} />}
          {section === 'Terminology' && <TerminologySection />}
        </Stack>
      )}
    </div>
  );
}
