// Route: /admin/TestCatalogList?entity=sampletypes (list) · /MasterListsPage/TestCatalogEditor/sampleType/<id>/<section> (editor)
// SideNav: Admin → Test Catalog Management → Sample Types (peer of Tests / Panels) → per-record sections:
//          Basic Info / Associated Tests / Display Order / Disposal / Terminology
// Breadcrumb: Home / Admin Management / Test Catalog Management / Sample Types / <name>
// FRS: sample-type-management (v2.1) — OGC-296. Data model authority: test-catalog-data-model.md.
// Key decisions encoded here:
//  - Associated Tests is READ-ONLY (specimen is test identity; "adding" = create a specimen variant in the Test Catalog)
//  - Domain: single required Clinical/Environmental/Vector (legacy varchar(1) migration = Dependency 4); Clinical enabled at launch
//  - Disposal: one free-text field, reference-only (authoritative structured handling is per-test TestSampleHandling)
//  - Terminology: full mapper incl. WHONET (Dependency 3)
import React, { useState } from 'react';
import {
  Stack, Breadcrumb, BreadcrumbItem,
  Table, TableContainer, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, TextArea, Select, SelectItem, RadioButtonGroup, RadioButton,
  Toggle, Button, InlineNotification, Tag, Tile, NumberInput, Link, IconButton,
} from '@carbon/react';
import { Add, TrashCan, ArrowUp, ArrowDown, Draggable } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ---- Mock data (realistic; shapes match TYPE_OF_SAMPLE + SAMPLETYPE_TEST) ----
const SAMPLE_TYPES = [
  { id: 1, name: 'Serum', abbr: 'SER', domain: 'CLINICAL', tests: 87, active: true },
  { id: 2, name: 'Plasma (EDTA)', abbr: 'PL-EDTA', domain: 'CLINICAL', tests: 45, active: true },
  { id: 3, name: 'Whole Blood (EDTA)', abbr: 'WB-EDTA', domain: 'CLINICAL', tests: 34, active: true },
  { id: 4, name: 'Urine', abbr: 'UR', domain: 'CLINICAL', tests: 52, active: true },
  { id: 5, name: 'Cerebrospinal Fluid', abbr: 'CSF', domain: 'CLINICAL', tests: 12, active: true },
  { id: 6, name: 'Stool', abbr: 'ST', domain: 'CLINICAL', tests: 18, active: false },
];
const ASSOCIATED_TESTS = [
  { name: 'Glucose (Serum)', code: 'GLU-S' },
  { name: 'Creatinine (Serum)', code: 'CREA-S' },
  { name: 'HIV 1/2 Ab (Serum)', code: 'HIV-AB' },
  { name: 'ALT (Serum)', code: 'ALT-S' },
  { name: 'Hemoglobin (Serum)', code: 'HGB-S' },
];
const TERMINOLOGY_SEED = [
  { source: 'SNOMED CT', code: '119364003', rel: 'Same as' },
  { source: 'WHONET', code: 'sr', rel: 'Same as' },
];

const domainTag = (d) => {
  const map = { CLINICAL: 'blue', ENVIRONMENTAL: 'teal', VECTOR: 'purple' };
  const label = d.charAt(0) + d.slice(1).toLowerCase();
  return <Tag type={map[d]} size="sm">{t('label.domain.' + d.toLowerCase(), label)}</Tag>;
};

/* ---------------- List ---------------- */
function SampleTypesList({ openRecord, openNew }) {
  return (
    <TableContainer
      title={t('title.sampleType.list', 'Sample Types')}
      description={t('desc.sampleType.list', 'Specimen types available to the catalog and order entry')}>
      <TableToolbar>
        <TableToolbarContent>
          <TableToolbarSearch placeholder={t('label.sampleType.search', 'Search sample types')} persistent />
          <Select id="f-domain" inline labelText={t('label.filter.domain', 'Domain')} defaultValue="">
            <SelectItem value="" text={t('label.filter.allDomains', 'All domains')} />
            <SelectItem value="CLINICAL" text="Clinical" />
            <SelectItem value="ENVIRONMENTAL" text="Environmental" />
            <SelectItem value="VECTOR" text="Vector" />
          </Select>
          <Select id="f-status" inline labelText={t('label.filter.status', 'Status')} defaultValue="">
            <SelectItem value="" text={t('label.filter.all', 'All')} />
            <SelectItem value="Y" text={t('label.status.active', 'Active')} />
            <SelectItem value="N" text={t('label.status.inactive', 'Inactive')} />
          </Select>
          <Button renderIcon={Add} size="sm" onClick={openNew}>
            {t('button.sampleType.add', 'Add Sample Type')}
          </Button>
        </TableToolbarContent>
      </TableToolbar>
      <Table size="lg">
        <TableHead>
          <TableRow>
            <TableHeader>{t('label.sampleType.col.name', 'Name')}</TableHeader>
            <TableHeader>{t('label.sampleType.abbreviation', 'Abbreviation')}</TableHeader>
            <TableHeader>{t('label.sampleType.col.domain', 'Domain')}</TableHeader>
            <TableHeader>{t('label.sampleType.col.tests', 'Tests')}</TableHeader>
            <TableHeader>{t('label.sampleType.col.status', 'Status')}</TableHeader>
            <TableHeader>{t('label.sampleType.col.actions', 'Actions')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {SAMPLE_TYPES.map((s) => (
            <TableRow key={s.id}>
              <TableCell><Link onClick={() => openRecord(s)}>{s.name}</Link></TableCell>
              <TableCell style={{ fontFamily: 'monospace' }}>{s.abbr}</TableCell>
              <TableCell>{domainTag(s.domain)}</TableCell>
              <TableCell>{s.tests}</TableCell>
              <TableCell><Tag type={s.active ? 'green' : 'gray'} size="sm">{s.active ? 'Active' : 'Inactive'}</Tag></TableCell>
              <TableCell><Button kind="ghost" size="sm" onClick={() => openRecord(s)}>{t('button.edit', 'Edit')}</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/* ---------------- Basic Info ---------------- */
function BasicInfoSection({ st, isNew }) {
  const [active, setActive] = useState(isNew ? false : st.active);
  const [showDeactivateWarn, setShowDeactivateWarn] = useState(false);
  const onToggle = (checked) => {
    if (!checked && st.tests > 0) setShowDeactivateWarn(true);
    setActive(checked);
  };
  return (
    <Stack gap={5} style={{ maxWidth: '40rem' }}>
      <TextInput id="st-name" labelText={t('label.sampleType.name', 'Name')} defaultValue={isNew ? '' : st.name}
        helperText={t('helper.sampleType.name', 'Localized display name — must be unique')} />
      <TextInput id="st-abbr" labelText={t('label.sampleType.abbreviation', 'Local abbreviation')}
        defaultValue={isNew ? '' : st.abbr} style={{ maxWidth: '12rem' }} />
      <RadioButtonGroup legendText={t('label.sampleType.domain', 'Domain')} name="st-domain"
        defaultSelected={isNew ? 'CLINICAL' : st.domain} orientation="horizontal">
        <RadioButton labelText={t('label.domain.clinical', 'Clinical')} value="CLINICAL" id="d-cl" />
        <RadioButton labelText={t('label.domain.environmental', 'Environmental')} value="ENVIRONMENTAL" id="d-env" disabled />
        <RadioButton labelText={t('label.domain.vector', 'Vector')} value="VECTOR" id="d-vec" disabled />
      </RadioButtonGroup>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '-0.75rem' }}>
        {t('helper.sampleType.domainLaunch', 'Required — exactly one. Clinical only at launch; Environmental / Vector arrive in a later phase.')}
      </p>
      <Toggle id="st-active" labelText={t('label.sampleType.active', 'Active')}
        labelA={t('label.status.inactive', 'Inactive')} labelB={t('label.status.active', 'Active')}
        toggled={active} onToggle={onToggle} />
      {showDeactivateWarn && !active && (
        <InlineNotification kind="warning" lowContrast
          title={t('warning.sampleType.deactivateInUse', `${st.tests} active tests use this type; they won't be orderable while it's inactive.`)}
          subtitle={t('helper.sampleType.deactivateReversible', 'No cascade — reactivating restores orderability.')}
          onCloseButtonClick={() => setShowDeactivateWarn(false)} />
      )}
      <div><Button kind="primary">{t('button.save', 'Save')}</Button></div>
    </Stack>
  );
}

/* ---------------- Associated Tests (READ-ONLY — supersedes v2.0 additive model) ---------------- */
function AssociatedTestsSection({ st }) {
  return (
    <Stack gap={5} style={{ maxWidth: '46rem' }}>
      <p style={{ fontSize: '0.875rem' }}>
        <strong>{st.tests}</strong> {t('label.sampleType.testsUseType', 'tests use this sample type')}
      </p>
      <InlineNotification kind="info" lowContrast hideCloseButton
        title={t('note.sampleType.associatedTests.viewOnlyTitle', 'View only')}
        subtitle={t('note.sampleType.associatedTests.viewOnly',
          'A test’s specimen is part of its identity. To run a test on this sample type, create a specimen variant in the Test Catalog (＋ Variant on the test or its assay group).')} />
      <Table size="md">
        <TableHead>
          <TableRow>
            <TableHeader>{t('label.sampleType.col.testName', 'Test Name')}</TableHeader>
            <TableHeader>{t('label.sampleType.col.code', 'Code')}</TableHeader>
            <TableHeader />
          </TableRow>
        </TableHead>
        <TableBody>
          {ASSOCIATED_TESTS.map((x) => (
            <TableRow key={x.code}>
              <TableCell>{x.name}</TableCell>
              <TableCell style={{ fontFamily: 'monospace' }}>{x.code}</TableCell>
              <TableCell><Link>{t('link.sampleType.associatedTests.openTest', 'Open in Test Catalog')}</Link></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* No Save button — nothing is writable here */}
    </Stack>
  );
}

/* ---------------- Display Order (writes the real TYPE_OF_SAMPLE.sort_order) ---------------- */
function DisplayOrderSection({ st }) {
  const [order, setOrder] = useState(SAMPLE_TYPES.map((s) => s.id));
  const move = (id, delta) => setOrder((o) => {
    const i = o.indexOf(id); const j = i + delta;
    if (j < 0 || j >= o.length) return o;
    const next = [...o]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });
  return (
    <Stack gap={5} style={{ maxWidth: '34rem' }}>
      <NumberInput id="st-pos" label={t('label.sampleType.displayOrder', 'Position in the Sample Type menu')}
        min={1} max={order.length} value={order.indexOf(st.id) + 1} readOnly />
      <Table size="md">
        <TableHead>
          <TableRow>
            <TableHeader style={{ width: '4rem' }} />
            <TableHeader style={{ width: '3rem' }}>#</TableHeader>
            <TableHeader>{t('label.sampleType.col.name', 'Sample Type')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {order.map((id, i) => {
            const s = SAMPLE_TYPES.find((x) => x.id === id);
            const isThis = id === st.id;
            return (
              <TableRow key={id} style={isThis ? { background: 'var(--cds-layer-selected)' } : undefined}>
                <TableCell>
                  {isThis && (<>
                    <IconButton kind="ghost" size="sm" label={t('button.moveUp', 'Move up')} onClick={() => move(id, -1)}><ArrowUp /></IconButton>
                    <IconButton kind="ghost" size="sm" label={t('button.moveDown', 'Move down')} onClick={() => move(id, 1)}><ArrowDown /></IconButton>
                  </>)}
                </TableCell>
                <TableCell>{i + 1}</TableCell>
                <TableCell style={isThis ? { fontWeight: 600 } : undefined}>
                  {s.name}{isThis ? '  ← ' + t('label.sampleType.thisType', 'this type') : ''}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div><Button kind="primary">{t('button.save', 'Save')}</Button></div>
    </Stack>
  );
}

/* ---------------- Disposal (free-text reference — never overrides per-test TestSampleHandling) ---------------- */
function DisposalSection() {
  return (
    <Stack gap={5} style={{ maxWidth: '40rem' }}>
      <TextArea id="st-disposal" rows={3}
        labelText={t('label.sampleType.disposalInstructions', 'Disposal instructions')}
        placeholder={t('placeholder.sampleType.disposal', 'e.g. Autoclave before disposal via biohazard waste')}
        helperText={t('helper.sampleType.disposalReference',
          'Reference guidance only, shown read-only elsewhere. Authoritative structured handling and disposal stays per-test (Test Catalog → Storage) and per-specimen (Sample Storage).')} />
      <div><Button kind="primary">{t('button.save', 'Save')}</Button></div>
    </Stack>
  );
}

/* ---------------- Terminology (full mapper, parity with tests/panels; WHONET first-class) ---------------- */
function TerminologySection() {
  const [maps, setMaps] = useState(TERMINOLOGY_SEED);
  const [source, setSource] = useState('SNOMED CT');
  const [code, setCode] = useState('');
  const [rel, setRel] = useState('Same as');
  const addRow = () => {
    if (!code.trim()) return;
    setMaps((m) => [...m, { source, code: code.trim(), rel }]);
    setCode('');
  };
  return (
    <Stack gap={5} style={{ maxWidth: '46rem' }}>
      <Table size="md">
        <TableHead>
          <TableRow>
            <TableHeader>{t('label.terminology.source', 'Coding system')}</TableHeader>
            <TableHeader>{t('label.terminology.code', 'Code')}</TableHeader>
            <TableHeader>{t('label.terminology.relationship', 'How it relates')}</TableHeader>
            <TableHeader style={{ width: '5rem' }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {maps.map((m, i) => (
            <TableRow key={i}>
              <TableCell>{m.source}</TableCell>
              <TableCell style={{ fontFamily: 'monospace' }}>{m.code}</TableCell>
              <TableCell>{m.rel}</TableCell>
              <TableCell>
                <IconButton kind="ghost" size="sm" label={t('button.remove', 'Remove')}
                  onClick={() => setMaps((x) => x.filter((_, j) => j !== i))}><TrashCan /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Stack orientation="horizontal" gap={4} style={{ alignItems: 'end', flexWrap: 'wrap' }}>
        <Select id="tm-source" labelText={t('label.terminology.source', 'Coding system')}
          value={source} onChange={(e) => setSource(e.target.value)}>
          <SelectItem value="LOINC" text="LOINC" />
          <SelectItem value="SNOMED CT" text="SNOMED CT" />
          <SelectItem value="CIEL" text="CIEL" />
          <SelectItem value="OCL" text="OCL" />
          <SelectItem value="WHONET" text="WHONET" />
        </Select>
        <TextInput id="tm-code" labelText={t('label.terminology.code', 'Code')}
          value={code} onChange={(e) => setCode(e.target.value)} style={{ maxWidth: '10rem' }} />
        <Select id="tm-rel" labelText={t('label.terminology.relationship', 'How it relates')}
          value={rel} onChange={(e) => setRel(e.target.value)}>
          <SelectItem value="Same as" text={t('label.terminology.sameAs', 'Same as')} />
          <SelectItem value="Broader than" text={t('label.terminology.broaderThan', 'Broader than')} />
          <SelectItem value="Narrower than" text={t('label.terminology.narrowerThan', 'Narrower than')} />
        </Select>
        <Button kind="tertiary" renderIcon={Add} onClick={addRow}>{t('button.terminology.add', 'Add code')}</Button>
      </Stack>
      <div><Button kind="primary">{t('button.save', 'Save')}</Button></div>
    </Stack>
  );
}

/* ---------------- Editor shell (sections are SideNav submenus in the real app) ---------------- */
const SECTIONS = ['Basic Info', 'Associated Tests', 'Display Order', 'Disposal', 'Terminology'];

function SampleTypeEditor({ st, isNew, section, setSection, back }) {
  return (
    <Stack gap={4}>
      <Button kind="ghost" size="sm" onClick={back} style={{ alignSelf: 'flex-start' }}>
        ← {t('button.backToList', 'Back to list')}
      </Button>
      <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{isNew ? t('title.sampleType.new', 'New sample type') : st.name}</h3>
        <Tag type="teal" size="sm">{t('label.entity.sampleType', 'SAMPLE TYPE')}</Tag>
        {!isNew && domainTag(st.domain)}
      </Stack>
      {/* In the shipped app these are SideNav submenu items under the record (no tabs).
          Rendered here as a simple switcher so the mockup stays a single component. */}
      <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
        {SECTIONS.map((s) => (
          <Button key={s} size="sm" kind={section === s ? 'primary' : 'ghost'} onClick={() => setSection(s)}>
            {t('label.sampleType.section.' + s.replace(/\s/g, ''), s)}
          </Button>
        ))}
      </Stack>
      {section === 'Basic Info' && <BasicInfoSection st={st} isNew={isNew} />}
      {section === 'Associated Tests' && <AssociatedTestsSection st={st} />}
      {section === 'Display Order' && <DisplayOrderSection st={st} />}
      {section === 'Disposal' && <DisposalSection />}
      {section === 'Terminology' && <TerminologySection />}
    </Stack>
  );
}

/* ---------------- Root ---------------- */
export default function SampleTypeManagement() {
  const [record, setRecord] = useState(null);      // null = list view
  const [isNew, setIsNew] = useState(false);
  const [section, setSection] = useState('Basic Info');
  const openRecord = (s) => { setRecord(s); setIsNew(false); setSection('Basic Info'); };
  const openNew = () => { setRecord({ name: '', abbr: '', domain: 'CLINICAL', tests: 0, active: false }); setIsNew(true); setSection('Basic Info'); };
  return (
    <div style={{ padding: 'var(--cds-spacing-05)' }}>
      <Breadcrumb noTrailingSlash style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <BreadcrumbItem>{t('label.breadcrumb.home', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem>{t('label.breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
        <BreadcrumbItem>{t('label.breadcrumb.testCatalogManagement', 'Test Catalog Management')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('label.testCatalog.entity.sampleTypes', 'Sample Types')}</BreadcrumbItem>
      </Breadcrumb>
      {record === null
        ? <SampleTypesList openRecord={openRecord} openNew={openNew} />
        : <SampleTypeEditor st={record} isNew={isNew} section={section} setSection={setSection} back={() => setRecord(null)} />}
    </div>
  );
}
