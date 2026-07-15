// Route: /admin/TestCatalogList?entity=labunits (list) · /MasterListsPage/TestCatalogEditor/labUnit/<id>/<section> (editor)
// SideNav: Admin → Test Catalog Management → Lab Units (peer of Tests / Panels / Sample Types)
// Breadcrumb: Home / Admin Management / Test Catalog Management / Lab Units / <name>
// FRS: lab-units-management-v2.0.md — OGC-189. Data model: TEST_SECTION (test-catalog-data-model.md §2.7).
// Key decisions: terminology is "Lab Unit" (never "test section"); NO code field (no column exists);
// Description REQUIRED (NOT NULL); domain = Dependency 2 (unbuilt — OGC-361 not on develop);
// hierarchy (PARENT_TEST_SECTION) documented, not surfaced; Associated Tests read-only
// (assignment lives on the test); deactivate warns, never cascades.
import React, { useState } from 'react';
import {
  Stack, Breadcrumb, BreadcrumbItem,
  Table, TableContainer, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, Select, SelectItem, RadioButtonGroup, RadioButton,
  Toggle, Button, IconButton, InlineNotification, Tag, Link, NumberInput,
} from '@carbon/react';
import { Add, ArrowUp, ArrowDown } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

const LAB_UNITS = [
  { id: 1, name: 'Chemistry', description: 'Clinical chemistry bench', domain: 'CLINICAL', tests: 142, active: true, external: false },
  { id: 2, name: 'Hematology', description: 'Hematology and coagulation', domain: 'CLINICAL', tests: 58, active: true, external: false },
  { id: 3, name: 'Microbiology', description: 'Culture, ID and AST', domain: 'CLINICAL', tests: 96, active: true, external: false },
  { id: 4, name: 'Serology', description: 'Serology / immunology', domain: 'CLINICAL', tests: 44, active: true, external: false },
  { id: 5, name: 'Env. Water Lab', description: 'Environmental water testing', domain: 'ENVIRONMENTAL', tests: 12, active: true, external: false },
  { id: 6, name: 'Reference Lab', description: 'External referral unit', domain: 'CLINICAL', tests: 9, active: false, external: true },
];
const UNIT_TESTS = [
  { name: 'Glucose (Serum)', code: 'GLU-S', sample: 'Serum', active: true },
  { name: 'Creatinine (Serum)', code: 'CREA-S', sample: 'Serum', active: true },
  { name: 'ALT (Serum)', code: 'ALT-S', sample: 'Serum', active: true },
  { name: 'Glucose (CSF)', code: 'GLU-C', sample: 'Cerebrospinal Fluid', active: false },
];
const domainTag = (d) => <Tag type={d === 'CLINICAL' ? 'blue' : 'teal'} size="sm">{d.charAt(0) + d.slice(1).toLowerCase()}</Tag>;

/* ---------------- List ---------------- */
function LabUnitsList({ openRecord, openNew }) {
  return (
    <TableContainer title={t('title.labUnit.list', 'Lab Units')}
      description={t('desc.labUnit.list', 'The benches and departments that perform tests — drives workplans and result-entry grouping')}>
      <TableToolbar>
        <TableToolbarContent>
          <TableToolbarSearch placeholder={t('label.labUnit.search', 'Search lab units')} persistent />
          <Select id="lf-domain" inline labelText={t('label.filter.domain', 'Domain')} defaultValue="">
            <SelectItem value="" text={t('label.filter.allDomains', 'All domains')} />
            <SelectItem value="CLINICAL" text="Clinical" /><SelectItem value="ENVIRONMENTAL" text="Environmental" /><SelectItem value="VECTOR" text="Vector" />
          </Select>
          <Select id="lf-status" inline labelText={t('label.filter.status', 'Status')} defaultValue="">
            <SelectItem value="" text={t('label.filter.all', 'All')} />
            <SelectItem value="Y" text="Active" /><SelectItem value="N" text="Inactive" />
          </Select>
          <Button renderIcon={Add} size="sm" onClick={openNew}>{t('button.labUnit.add', 'Add Lab Unit')}</Button>
        </TableToolbarContent>
      </TableToolbar>
      <Table size="lg">
        <TableHead><TableRow>
          <TableHeader>{t('label.labUnit.name', 'Name')}</TableHeader>
          <TableHeader>{t('label.labUnit.description', 'Description')}</TableHeader>
          <TableHeader>{t('label.labUnit.col.domain', 'Domain')}</TableHeader>
          <TableHeader>{t('label.labUnit.col.tests', 'Tests')}</TableHeader>
          <TableHeader>{t('label.labUnit.col.status', 'Status')}</TableHeader>
          <TableHeader style={{ width: '6rem' }} />
        </TableRow></TableHead>
        <TableBody>
          {LAB_UNITS.map((u) => (
            <TableRow key={u.id}>
              <TableCell><Link onClick={() => openRecord(u)}>{u.name}</Link>{' '}
                {u.external && <Tag type="gray" size="sm">{t('tag.labUnit.external', 'External')}</Tag>}</TableCell>
              <TableCell>{u.description}</TableCell>
              <TableCell>{domainTag(u.domain)}</TableCell>
              <TableCell>{u.tests}</TableCell>
              <TableCell><Tag type={u.active ? 'green' : 'gray'} size="sm">{u.active ? 'Active' : 'Inactive'}</Tag></TableCell>
              <TableCell><Button kind="ghost" size="sm" onClick={() => openRecord(u)}>{t('button.edit', 'Edit')}</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/* ---------------- Basic Info ---------------- */
function BasicInfoSection({ u, isNew }) {
  const [active, setActive] = useState(isNew ? false : u.active);
  const [warn, setWarn] = useState(false);
  const onToggle = (checked) => { if (!checked && u.tests > 0) setWarn(true); setActive(checked); };
  return (
    <Stack gap={5} style={{ maxWidth: '40rem' }}>
      <TextInput id="lu-name" labelText={t('label.labUnit.name', 'Name')} maxLength={20}
        defaultValue={isNew ? '' : u.name} helperText={t('helper.labUnit.name', 'Up to 20 characters — localized display name')} />
      <TextInput id="lu-desc" labelText={t('label.labUnit.description', 'Description')} maxLength={60}
        defaultValue={isNew ? '' : u.description} helperText={t('helper.labUnit.descRequired', 'Required — up to 60 characters')} />
      <RadioButtonGroup legendText={t('label.labUnit.domain', 'Domain')} name="lu-domain"
        defaultSelected={isNew ? 'CLINICAL' : u.domain} orientation="horizontal">
        <RadioButton labelText="Clinical" value="CLINICAL" id="lud-cl" />
        <RadioButton labelText="Environmental" value="ENVIRONMENTAL" id="lud-env" disabled />
        <RadioButton labelText="Vector" value="VECTOR" id="lud-vec" disabled />
      </RadioButtonGroup>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '-0.75rem' }}>
        {t('helper.labUnit.domainDep', 'Required once built — the domain column on TEST_SECTION is Dependency 2 (OGC-361 is not on develop; reconcile before build). Clinical primary at launch.')}</p>
      {!isNew && u.external && (
        <div><div className="cds--label">{t('label.labUnit.flags', 'Reference facts (read-only)')}</div>
          <Tag type="gray" size="sm">{t('tag.labUnit.external', 'External')}</Tag></div>
      )}
      <Toggle id="lu-active" labelText={t('label.labUnit.active', 'Active')} labelA="Inactive" labelB="Active"
        toggled={active} onToggle={onToggle} />
      {warn && !active && (
        <InlineNotification kind="warning" lowContrast
          title={t('warning.labUnit.deactivateInUse', `${u.tests} active tests are assigned to this lab unit; they keep working but won't appear under it in workplans until it's reactivated or they're reassigned.`)}
          subtitle={t('helper.labUnit.reassignPerTest', 'Reassignment happens per test (Basic Info → Lab Unit), not in bulk here.')}
          onCloseButtonClick={() => setWarn(false)} />
      )}
      <div><Button kind="primary">{t('button.save', 'Save')}</Button></div>
    </Stack>
  );
}

/* ---------------- Associated Tests — read-only (assignment lives on the test) ---------------- */
function AssociatedTestsSection({ u }) {
  return (
    <Stack gap={5} style={{ maxWidth: '46rem' }}>
      <p style={{ fontSize: '0.875rem' }}><strong>{u.tests}</strong> {t('label.labUnit.testsAssigned', 'tests are assigned to this lab unit')}</p>
      <InlineNotification kind="info" lowContrast hideCloseButton
        title={t('note.labUnit.associatedTests.viewOnlyTitle', 'View only')}
        subtitle={t('note.labUnit.associatedTests.viewOnly', "A test's lab unit is set on the test (Basic Info → Lab Unit).")} />
      <Table size="md">
        <TableHead><TableRow>
          <TableHeader>{t('label.col.testName', 'Test Name')}</TableHeader>
          <TableHeader>{t('label.col.code', 'Code')}</TableHeader>
          <TableHeader>{t('label.col.sampleType', 'Sample type')}</TableHeader>
          <TableHeader>{t('label.col.status', 'Status')}</TableHeader>
          <TableHeader style={{ width: '11rem' }} />
        </TableRow></TableHead>
        <TableBody>
          {UNIT_TESTS.map((x) => (
            <TableRow key={x.code}>
              <TableCell>{x.name}</TableCell>
              <TableCell><code>{x.code}</code></TableCell>
              <TableCell>{x.sample}</TableCell>
              <TableCell><Tag type={x.active ? 'green' : 'gray'} size="sm">{x.active ? 'Active' : 'Inactive'}</Tag></TableCell>
              <TableCell><Link>{t('link.labUnit.associatedTests.openTest', 'Open in Test Catalog')}</Link></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}

/* ---------------- Display Order ---------------- */
function DisplayOrderSection({ u }) {
  const [order, setOrder] = useState(LAB_UNITS.map((x) => x.id));
  const move = (id, d) => setOrder((o) => {
    const i = o.indexOf(id); const j = i + d;
    if (j < 0 || j >= o.length) return o;
    const next = [...o]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });
  return (
    <Stack gap={5} style={{ maxWidth: '34rem' }}>
      <NumberInput id="lu-pos" label={t('label.labUnit.displayOrder', 'Position in lab-unit ordering')}
        min={1} max={order.length} value={order.indexOf(u.id) + 1} readOnly />
      <Table size="md">
        <TableHead><TableRow>
          <TableHeader style={{ width: '5rem' }} /><TableHeader style={{ width: '3rem' }}>#</TableHeader>
          <TableHeader>{t('label.labUnit.name', 'Lab Unit')}</TableHeader>
        </TableRow></TableHead>
        <TableBody>
          {order.map((id, i) => {
            const x = LAB_UNITS.find((y) => y.id === id); const isThis = id === u.id;
            return (
              <TableRow key={id} style={isThis ? { background: 'var(--cds-layer-selected)' } : undefined}>
                <TableCell>{isThis && (<>
                  <IconButton kind="ghost" size="sm" label="Up" onClick={() => move(id, -1)}><ArrowUp /></IconButton>
                  <IconButton kind="ghost" size="sm" label="Down" onClick={() => move(id, 1)}><ArrowDown /></IconButton>
                </>)}</TableCell>
                <TableCell>{i + 1}</TableCell>
                <TableCell style={isThis ? { fontWeight: 600 } : undefined}>{x.name}{isThis ? '  ← ' + t('label.thisUnit', 'this unit') : ''}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div><Button kind="primary">{t('button.save', 'Save')}</Button></div>
    </Stack>
  );
}

/* ---------------- Root ---------------- */
const SECTIONS = ['Basic Info', 'Associated Tests', 'Display Order'];

export default function LabUnitsManagement() {
  const [record, setRecord] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [section, setSection] = useState('Basic Info');
  const openRecord = (u) => { setRecord(u); setIsNew(false); setSection('Basic Info'); };
  const openNew = () => { setRecord({ name: '', description: '', domain: 'CLINICAL', tests: 0, active: false, external: false }); setIsNew(true); setSection('Basic Info'); };
  return (
    <div style={{ padding: 'var(--cds-spacing-05)' }}>
      <Breadcrumb noTrailingSlash style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <BreadcrumbItem>{t('label.breadcrumb.home', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem>{t('label.breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
        <BreadcrumbItem>{t('label.breadcrumb.testCatalogManagement', 'Test Catalog Management')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('label.testCatalog.entity.labUnits', 'Lab Units')}</BreadcrumbItem>
      </Breadcrumb>
      {record === null ? (
        <LabUnitsList openRecord={openRecord} openNew={openNew} />
      ) : (
        <Stack gap={4}>
          <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center' }}>
            <Button kind="ghost" size="sm" onClick={() => setRecord(null)}>← {t('button.backToList', 'Back to list')}</Button>
            <h3 style={{ margin: 0 }}>{isNew ? t('title.labUnit.new', 'New lab unit') : record.name}</h3>
            <Tag type="cyan" size="sm">LAB UNIT</Tag>{!isNew && domainTag(record.domain)}
          </Stack>
          <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
            {SECTIONS.map((s) => (
              <Button key={s} size="sm" kind={section === s ? 'primary' : 'ghost'} onClick={() => setSection(s)}>{s}</Button>
            ))}
          </Stack>
          {section === 'Basic Info' && <BasicInfoSection u={record} isNew={isNew} />}
          {section === 'Associated Tests' && <AssociatedTestsSection u={record} />}
          {section === 'Display Order' && <DisplayOrderSection u={record} />}
        </Stack>
      )}
    </div>
  );
}
