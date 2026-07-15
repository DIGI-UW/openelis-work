// Route: /admin/TestCatalogList (grouped default; ?view=flat) · editor /MasterListsPage/TestCatalogEditor/<id>/<section>
//        create/variant .../new/basic-info[?copyFrom=<id>] · group .../group/<ids>/<section>
// SideNav: Admin → Test Catalog Management → Tests · Breadcrumb: Home / Admin Management / Test Catalog
// FRS: test-catalog-completion-v2-frs.md (FR-46–86). Data model: test-catalog-data-model.md.
// Views in this mockup (switcher below): grouped List (link/unlink, issues toggle, banner),
// New test / Add specimen variant (pre-seeded primary, completeness rail, activation gate),
// Edit variants together (4 shared sections, per-field differs, ranges warning),
// Labels (FR-66/67 — full per-sample preset picker + Order Entry Preview; owning spec OGC-285).
import React, { useMemo, useState } from 'react';
import {
  Stack, Breadcrumb, BreadcrumbItem, ContentSwitcher, Switch,
  Table, TableContainer, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, Select, SelectItem, ComboBox, NumberInput, Toggle, Checkbox,
  Button, IconButton, InlineNotification, Tag, Tile, Link,
  StructuredListWrapper, StructuredListHead, StructuredListBody, StructuredListRow, StructuredListCell,
} from '@carbon/react';
import { Add, ChevronDown, ChevronUp, WarningAlt, CheckmarkFilled, CircleDash, TrashCan } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

/* ---- Mock data: assay groups exist ONLY via the explicit variant-link record (FR-46) ---- */
const GROUPS_SEED = [
  { key: 'glucose', assay: 'Glucose', linked: true, domain: 'CLINICAL', variants: [
    { id: 1042, name: 'Glucose (Serum)', code: 'GLU-S', sample: 'Serum', active: true, findings: [] },
    { id: 1043, name: 'Glucose (Plasma)', code: 'GLU-P', sample: 'Plasma (EDTA)', active: true, findings: ['rangesUnrev'] },
    { id: 1044, name: 'Glucose (CSF)', code: 'GLU-C', sample: 'Cerebrospinal Fluid', active: false, findings: [] },
  ]},
  { key: 'hgb', assay: 'Hemoglobin', linked: false, domain: 'CLINICAL', variants: [
    { id: 1051, name: 'Hemoglobin (Whole Blood)', code: 'HGB-WB', sample: 'Whole Blood (EDTA)', active: true, findings: [] },
    { id: 1052, name: 'Hemoglobin (Serum)', code: 'HGB-S', sample: 'Serum', active: true, findings: ['dupCross'] },
  ]},
  { key: 'hiv', assay: 'HIV 1/2 Ab', linked: true, domain: 'CLINICAL', variants: [
    { id: 1061, name: 'HIV 1/2 Ab (Serum)', code: 'HIV-AB', sample: 'Serum', active: true, findings: ['noComp'] },
  ]},
  { key: 'cult', assay: 'Culture, Water', linked: true, domain: 'ENVIRONMENTAL', variants: [
    { id: 1081, name: 'Culture, Water (Water)', code: 'CULT-W', sample: 'Water', active: true, findings: ['noLoinc', 'rangesInc'] },
  ]},
];
const FINDINGS = {
  dupSame: { label: 'Duplicate LOINC (same specimen)', type: 'red' },
  dupCross: { label: 'Duplicate LOINC (cross-specimen)', type: 'warm-gray' },
  noComp: { label: 'No result components', type: 'red' },
  emptyOptions: { label: 'Empty select list', type: 'red' },
  rangesInc: { label: 'Ranges incomplete', type: 'warm-gray' },
  rangesUnrev: { label: 'Copied ranges unreviewed', type: 'warm-gray' },
  noLoinc: { label: 'No LOINC', type: 'warm-gray' },
  legacyCascading: { label: 'Cascading (legacy) — convert to Multi-select', type: 'gray' },
};
const SPECIMENS = ['Serum', 'Plasma (EDTA)', 'Whole Blood (EDTA)', 'Urine', 'Cerebrospinal Fluid', 'Water'];
const SPEC_SHORT = { 'Serum': 'Serum', 'Plasma (EDTA)': 'Plasma', 'Whole Blood (EDTA)': 'WholeBlood', 'Urine': 'Urine', 'Cerebrospinal Fluid': 'CSF', 'Water': 'Water' };
const domainTag = (d) => <Tag type={d === 'CLINICAL' ? 'blue' : 'teal'} size="sm">{d.charAt(0) + d.slice(1).toLowerCase()}</Tag>;

/* ============ Grouped list — FR-46..51, FR-61..64, FR-71 ============ */
function GroupedList({ data, setData, onNew, onVariant, onGroupEdit }) {
  const [view, setView] = useState('grouped');
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [banner, setBanner] = useState(true);
  const [open, setOpen] = useState({ glucose: true, hgb: true });
  const [sel, setSel] = useState({});
  const [confirmLink, setConfirmLink] = useState(false);
  const allVariants = data.flatMap((g) => g.variants);
  const errCount = allVariants.filter((v) => v.findings.some((f) => FINDINGS[f].type === 'red')).length;
  const warnCount = allVariants.filter((v) => v.findings.length && !v.findings.some((f) => FINDINGS[f].type === 'red')).length;
  const groups = data.map((g) => ({ ...g, variants: g.variants.filter((v) => !issuesOnly || v.findings.length) }))
    .filter((g) => g.variants.length);
  const selIds = Object.keys(sel).filter((k) => sel[k]).map(Number);
  const selTests = allVariants.filter((v) => selIds.includes(v.id));
  const doLink = () => { // writes the variant-link record; zero side effects on names/codes (FR-51)
    setData((d) => d.map((g) => (g.variants.some((v) => selIds.includes(v.id)) ? { ...g, linked: true } : g)));
    setSel({}); setConfirmLink(false);
  };
  const doUnlink = (key) => setData((d) => d.map((g) => (g.key === key ? { ...g, linked: false } : g)));
  return (
    <Stack gap={5}>
      {banner && errCount + warnCount > 0 && (
        <InlineNotification kind="warning" lowContrast
          title={t('banner.testCatalog.list.issuesSummary', `${errCount + warnCount} tests have configuration issues`)}
          subtitle={`${errCount} errors · ${warnCount} warnings`}
          actionButtonLabel={t('button.testCatalog.list.showIssues', 'Show')}
          onActionButtonClick={() => setIssuesOnly(true)}
          onCloseButtonClick={() => setBanner(false)} />
      )}
      {selIds.length >= 2 && !confirmLink && (
        <InlineNotification kind="info" lowContrast hideCloseButton
          title={`${selIds.length} tests selected`}
          actionButtonLabel={t('button.testCatalog.list.linkVariants', 'Link as variants')}
          onActionButtonClick={() => setConfirmLink(true)} />
      )}
      {confirmLink && (
        <Tile style={{ padding: 'var(--cds-spacing-05)' }}>
          <p><strong>{t('confirm.testCatalog.linkVariants', `Link these ${selIds.length} tests as specimen variants of one assay?`)}</strong>{' '}
            They will group together in the list. Names and codes are not changed.</p>
          <ul>{selTests.map((v) => <li key={v.id}>{v.name} <code>{v.code}</code></li>)}</ul>
          <Stack orientation="horizontal" gap={3}>
            <Button size="sm" onClick={doLink}>{t('button.testCatalog.list.linkVariants', 'Link as variants')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setConfirmLink(false)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </Tile>
      )}
      <TableContainer title={t('title.testCatalog.list', 'Test Catalog')}
        description={t('desc.testCatalog.list', 'Tests grouped by assay — each group holds the specimen variants of one procedure')}>
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch placeholder={t('label.testCatalog.list.search', 'Search tests')} persistent />
            {/* FR-61: single issues toggle with the warning icon — no severity dropdown */}
            <Checkbox id="issues-only" checked={issuesOnly}
              labelText={<span><WarningAlt style={{ verticalAlign: 'text-bottom', color: 'var(--cds-support-warning)' }} /> {t('filter.testCatalog.list.issuesOnly', 'Only tests with issues')}</span>}
              onChange={(_, { checked }) => setIssuesOnly(checked)} />
            <ContentSwitcher size="sm" selectedIndex={view === 'grouped' ? 0 : 1}
              onChange={({ index }) => setView(index === 0 ? 'grouped' : 'flat')}>
              <Switch name="grouped" text={t('button.testCatalog.list.viewGrouped', 'Grouped')} />
              <Switch name="flat" text={t('button.testCatalog.list.viewFlat', 'Flat')} />
            </ContentSwitcher>
            <Button renderIcon={Add} size="sm" onClick={onNew}>{t('button.testCatalog.newTest', 'New test')}</Button>
          </TableToolbarContent>
        </TableToolbar>
        <Table size="lg">
          <TableHead><TableRow>
            <TableHeader style={{ width: '2.5rem' }} />
            <TableHeader>{t('label.testCatalog.col.name', 'Name')}</TableHeader>
            <TableHeader>{t('label.testCatalog.col.code', 'Code')}</TableHeader>
            <TableHeader>{t('label.testCatalog.col.sampleType', 'Sample type')}</TableHeader>
            <TableHeader>{t('label.testCatalog.col.domain', 'Domain')}</TableHeader>
            <TableHeader>{t('label.testCatalog.col.status', 'Status')}</TableHeader>
            <TableHeader style={{ width: '15rem' }}>{t('label.testCatalog.col.actions', 'Actions')}</TableHeader>
          </TableRow></TableHead>
          <TableBody>
            {groups.map((g) => {
              const isGrouped = view === 'grouped' && g.linked && g.variants.length > 1;
              const isOpen = !isGrouped || !!open[g.key];
              const act = g.variants.filter((v) => v.active).length;
              return (
                <React.Fragment key={g.key}>
                  {isGrouped && (
                    <TableRow>
                      <TableCell>
                        <IconButton kind="ghost" size="sm" label={isOpen ? 'Collapse' : 'Expand'}
                          onClick={() => setOpen((o) => ({ ...o, [g.key]: !isOpen }))}>
                          {isOpen ? <ChevronUp /> : <ChevronDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell><strong>{g.assay}</strong> <span style={{ color: 'var(--cds-text-secondary)' }}>
                        · {t('label.testCatalog.group.variantCount', `${g.variants.length} specimen variants`)}</span></TableCell>
                      <TableCell />
                      <TableCell>{g.variants.map((v) => v.sample.split(' ')[0]).join(', ')}</TableCell>
                      <TableCell>{domainTag(g.domain)}</TableCell>
                      <TableCell>{t('label.testCatalog.group.statusSummary', `${act} Active · ${g.variants.length - act} Inactive`)}</TableCell>
                      <TableCell>
                        <Button kind="ghost" size="sm" onClick={() => onGroupEdit(g)}>{t('button.testCatalog.group.editTogether', 'Edit together')}</Button>
                        <Button kind="ghost" size="sm" onClick={() => onVariant(g, g.variants.filter((v) => v.active).slice(-1)[0]?.id)}>＋ {t('label.variant', 'Variant')}</Button>
                        <Button kind="ghost" size="sm" onClick={() => doUnlink(g.key)} title={t('confirm.testCatalog.unlinkVariants', 'Unlink this group? Tests remain unchanged; they just stop grouping together.')}>{t('button.testCatalog.group.unlink', 'Unlink')}</Button>
                      </TableCell>
                    </TableRow>
                  )}
                  {isOpen && g.variants.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{!(g.linked && g.variants.length > 1) && (
                        <Checkbox id={`sel-${v.id}`} labelText="" checked={!!sel[v.id]}
                          onChange={(_, { checked }) => setSel((x) => ({ ...x, [v.id]: checked }))} />)}
                      </TableCell>
                      <TableCell style={isGrouped ? { paddingLeft: '2.5rem' } : undefined}>
                        <Link>{v.name}</Link>{' '}
                        {v.findings.map((f) => <Tag key={f} type={FINDINGS[f].type} size="sm" title={FINDINGS[f].label}>{FINDINGS[f].label}</Tag>)}
                      </TableCell>
                      <TableCell><code>{v.code}</code></TableCell>
                      <TableCell>{v.sample}</TableCell>
                      <TableCell>{domainTag(g.domain)}</TableCell>
                      <TableCell><Tag type={v.active ? 'green' : 'gray'} size="sm">{v.active ? 'Active' : 'Inactive'}</Tag></TableCell>
                      <TableCell>
                        <Button kind="ghost" size="sm">{t('button.testCatalog.row.open', 'Open')}</Button>
                        <Button kind="ghost" size="sm" onClick={() => onVariant(g, v.id)} title="Copies from this variant; creating a variant links the group automatically">＋ {t('label.variant', 'Variant')}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

/* ============ New test / Add specimen variant — FR-52..59 ============ */
function NewTestEditor({ variantOf, sourceId, back }) {
  const g = variantOf;
  const isVariant = !!g;
  const [srcId, setSrcId] = useState(sourceId || (g ? g.variants[0].id : null));
  const src = isVariant ? g.variants.find((v) => v.id === srcId) : null;
  const used = isVariant ? g.variants.map((v) => v.sample) : [];
  const [name, setName] = useState(isVariant ? g.assay : '');
  const [specimen, setSpecimen] = useState(null);
  const [code, setCode] = useState('');
  const [codeEdited, setCodeEdited] = useState(false);
  const [compLabel, setCompLabel] = useState(isVariant ? g.assay : '');
  const [resultType, setResultType] = useState(isVariant ? 'N' : '');
  const [tried, setTried] = useState(false);
  const avail = SPECIMENS.filter((s) => !used.includes(s));
  const suggested = name.trim() && specimen ? name.trim().replace(/\s+/g, '') + '-' + SPEC_SHORT[specimen] : '';
  const codeValue = codeEdited ? code : suggested; // FR-54: shipped derive-from-name rule, stops on edit
  const structural = [ // FR-57
    { label: t('label.check.name', 'Test name'), met: name.trim().length > 0 },
    { label: t('label.check.primary', 'Primary component with a result type'), met: compLabel.trim().length > 0 && !!resultType },
    { label: t('label.check.specimen', 'Sample type selected'), met: !!specimen },
  ];
  const advisory = [ // FR-58 — warn, never block
    { label: t('label.check.loinc', 'LOINC assigned (Terminology)'), met: false },
    { label: isVariant ? t('label.check.rangesReviewed', 'Copied ranges reviewed') : t('label.check.ranges', 'Reference-range coverage'), met: false },
  ];
  const canActivate = structural.every((c) => c.met);
  return (
    <Stack gap={5}>
      <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center' }}>
        <Button kind="ghost" size="sm" onClick={back}>← {t('button.backToList', 'Back to list')}</Button>
        <h3 style={{ margin: 0 }}>{isVariant ? t('title.addVariant', `Add specimen variant — ${g.assay}`) : t('title.newTest', 'Editing: New test')}</h3>
        <div style={{ flex: 1 }} />
        <Button kind="secondary" size="sm">{t('button.saveInactive', 'Save as Inactive')}</Button>
        <Button kind="primary" size="sm" onClick={() => setTried(true)}>{t('button.saveActivate', 'Save & Activate')}</Button>
      </Stack>
      {isVariant && (
        <InlineNotification kind="info" lowContrast hideCloseButton
          title={t('note.variant.copied', `Copying from ${src ? src.name : ''}`)}
          subtitle={t('note.variant.copiedDetail', 'Components (incl. select-list options), methods, storage, domain, Lab Unit, and flags carry over. Ranges copy as drafts — save the Ranges section or Mark ranges reviewed to confirm. Panels, analyzers, reflex rules, alerts, and terminology (incl. LOINC — specimen-specific) are NOT copied.')} />
      )}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Stack gap={5} style={{ flex: 1, minWidth: '24rem', maxWidth: '42rem' }}>
          {isVariant && (
            <Select id="copy-from" labelText={t('label.variant.copyFrom', 'Copy from')} value={srcId}
              onChange={(e) => setSrcId(Number(e.target.value))}>
              {g.variants.map((v) => <SelectItem key={v.id} value={v.id} text={`${v.name} — ${v.sample}`} />)}
            </Select>
          )}
          {isVariant ? ( /* FR-54a: not writable here → static text, never a disabled input */
            <div>
              <div className="cds--label">{t('label.field.testName', 'Test name')}</div>
              <p style={{ fontSize: '1rem', margin: '0.25rem 0' }}>{name}{' '}
                <Tag type="gray" size="sm">{t('tag.sharedAcross', `Shared across ${g.variants.length} variants`)}</Tag></p>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                {t('helper.variant.sharedName', 'Renamed only via "Edit variants together" — changes apply to the whole assay group')}</p>
            </div>
          ) : (
            <TextInput id="nt-name" labelText={t('label.field.testName', 'Test name')} value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <TextInput id="nt-code" labelText={t('label.field.code', 'Code')} value={codeValue}
            onChange={(e) => { setCode(e.target.value); setCodeEdited(true); }}
            helperText={codeEdited ? t('helper.codeManual', 'Manual — no longer auto-derived') : t('helper.testCatalog.variant.codeSuggested', 'Suggested from the test name and specimen — edit to override')} />
          <ComboBox id="nt-specimen" titleText={t('label.field.sampleType', 'Sample type')} items={avail}
            selectedItem={specimen} onChange={({ selectedItem }) => setSpecimen(selectedItem)}
            helperText={isVariant ? t('helper.variant.specimenUsed', `Already in this group: ${used.join(', ')}`) : t('helper.oneSpecimen', "One specimen per test — part of the test's identity")} />
          {isVariant ? (
            <div>
              <div className="cds--label">{t('label.field.domain', 'Domain')}</div>
              <p style={{ margin: '0.25rem 0' }}>{domainTag(g.domain)}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                {t('label.testCatalog.variant.domainInherited', `Inherited from ${g.assay} — all variants share a domain`)}</p>
            </div>
          ) : (
            <Select id="nt-domain" labelText={t('label.field.domain', 'Domain')} defaultValue="CLINICAL">
              <SelectItem value="CLINICAL" text="Clinical" /><SelectItem value="ENVIRONMENTAL" text="Environmental" /><SelectItem value="VECTOR" text="Vector" />
            </Select>
          )}
          <Select id="nt-labunit" labelText={t('label.field.labUnit', 'Lab Unit')} defaultValue={isVariant ? 'Chemistry' : ''}
            helperText={isVariant ? t('helper.variant.labUnitCopied', 'Copied from source — change if this specimen runs in a different unit') : undefined}>
            <SelectItem value="" text="" /><SelectItem value="Chemistry" text="Chemistry" /><SelectItem value="Hematology" text="Hematology" /><SelectItem value="Microbiology" text="Microbiology" />
          </Select>
          {/* FR-56 — primary component: pre-seeded from scratch; copied whole for variants */}
          <Tile style={{ borderLeft: '3px solid var(--cds-interactive)', padding: 'var(--cds-spacing-05)' }}>
            <Stack gap={4}>
              <div><Tag type="blue" size="sm">{t('label.testCatalog.component.primary', 'Primary component')}</Tag>{' '}
                {isVariant && <Tag type="gray" size="sm" title="Copied whole from the source — result type, unit, and defaults intact">{t('tag.testCatalog.component.copied', 'Copied')}</Tag>}</div>
              <TextInput id="comp-label" labelText={t('label.component.label', 'Label')} value={compLabel} onChange={(e) => setCompLabel(e.target.value)} />
              <Select id="comp-type" labelText={t('label.component.resultType', 'Result type')} value={resultType}
                onChange={(e) => setResultType(e.target.value)} invalid={tried && !resultType}
                invalidText={t('error.resultTypeRequired', 'Required to activate')}>
                <SelectItem value="" text="" /><SelectItem value="N" text="Numeric" /><SelectItem value="A" text="Alphanumeric" /><SelectItem value="D" text="Dictionary (select list)" />
              </Select>
              {isVariant && <TextInput id="comp-unit" labelText={t('label.component.unit', 'Unit')} defaultValue="mg/dL" />}
            </Stack>
          </Tile>
          <div>
            <Button kind="tertiary" size="sm" renderIcon={Add}>{t('button.component.add', 'Add component')}</Button>
            <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.5rem' }}>
              {isVariant
                ? t('helper.component.copiedGate', 'Components copied from the source — the primary arrives complete, so the activation gate is already satisfied. (FR-56)')
                : t('helper.component.preseeded', 'The first component is created for you and marked Primary — no ＋ needed. (FR-56)')}</p>
          </div>
        </Stack>
        {/* FR-58 — completeness rail */}
        <Tile style={{ width: '18rem', padding: 'var(--cds-spacing-05)' }}>
          <h5 style={{ margin: 0 }}>{t('heading.testCatalog.editor.completeness', 'Completeness')}</h5>
          <h6 style={{ margin: '0.75rem 0 0.25rem', color: 'var(--cds-text-secondary)' }}>{t('heading.testCatalog.editor.requiredToActivate', 'Required to activate')}</h6>
          {structural.map((c) => (
            <div key={c.label} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.15rem 0' }}>
              {c.met ? <CheckmarkFilled style={{ color: 'var(--cds-support-success)' }} /> : <CircleDash style={{ color: 'var(--cds-text-secondary)' }} />}
              <Link>{c.label}</Link>
            </div>
          ))}
          <h6 style={{ margin: '0.75rem 0 0.25rem', color: 'var(--cds-text-secondary)' }}>{t('heading.testCatalog.editor.advisory', 'Advisory')}</h6>
          {advisory.map((c) => (
            <div key={c.label} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.15rem 0' }}>
              <WarningAlt style={{ color: 'var(--cds-support-warning)' }} /><Link>{c.label}</Link>
            </div>
          ))}
          {tried && !canActivate && (
            <InlineNotification kind="error" lowContrast style={{ marginTop: '0.75rem' }}
              title={t('error.testCatalog.activate.blocked', "This test can't be activated yet")}
              subtitle={structural.filter((c) => !c.met).map((c) => c.label).join(' · ')}
              onCloseButtonClick={() => setTried(false)} />
          )}
          {tried && canActivate && (
            <InlineNotification kind="success" lowContrast hideCloseButton style={{ marginTop: '0.75rem' }}
              title={t('note.activate.ok', 'Structural minimum met')}
              subtitle={t('note.activate.advisoryOpen', 'Advisory items remain open — they warn, never block. (FR-57 is also enforced by the REST API.)')} />
          )}
        </Tile>
      </div>
    </Stack>
  );
}

/* ============ Edit variants together — FR-51 contract + FR-73/74 depth ============ */
function GroupEditor({ g, back }) {
  const [guidance, setGuidance] = useState(null); // null = keep per-test values (FR-74: see before you overwrite)
  const perTest = { 1042: 'Fasting sample preferred', 1043: 'Fasting sample preferred', 1044: 'Note collection time on requisition' };
  return (
    <Stack gap={5}>
      <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center' }}>
        <Button kind="ghost" size="sm" onClick={back}>← {t('button.backToList', 'Back to list')}</Button>
        <h3 style={{ margin: 0 }}>{t('title.editTogether', `Edit variants together — ${g.assay}`)}</h3>
        <Tag type="blue" size="sm">{g.variants.length} TESTS</Tag>
        <div style={{ flex: 1 }} />
        <Button kind="primary" size="sm">{t('button.saveToAll', `Save to all ${g.variants.length}`)}</Button>
      </Stack>
      <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', margin: 0 }}>
        {t('desc.groupEditor', 'Shared settings are edited once and written to every variant. Identity is per test and read-only here.')}</p>
      <Table size="md">
        <TableHead><TableRow>
          <TableHeader>{t('label.col.test', 'Test')}</TableHeader><TableHeader>{t('label.col.code', 'Code')}</TableHeader>
          <TableHeader>{t('label.col.specimen', 'Specimen')}</TableHeader><TableHeader>LOINC</TableHeader>
          <TableHeader>{t('label.col.status', 'Status')}</TableHeader>
        </TableRow></TableHead>
        <TableBody>
          {g.variants.map((v, i) => (
            <TableRow key={v.id}>
              <TableCell>{v.name}</TableCell><TableCell><code>{v.code}</code></TableCell>
              <TableCell>{v.sample}</TableCell>
              <TableCell><code>{['2345-7', '2339-0', '2342-4'][i] || '—'}</code>
                {i === 0 && <Tag type="gray" size="sm" title="FR-72: duplicate-LOINC warnings re-surface here per test">✓</Tag>}</TableCell>
              <TableCell><Tag type={v.active ? 'green' : 'gray'} size="sm">{v.active ? 'Active' : 'Inactive'}</Tag></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* FR-73: all four shared sections */}
      <Stack gap={5} style={{ maxWidth: '42rem' }}>
        <Select id="ge-method" labelText={t('label.shared.method', 'Method — same value on all variants')} defaultValue="hex">
          <SelectItem value="hex" text="Hexokinase, enzymatic" /><SelectItem value="gox" text="Glucose oxidase" />
        </Select>
        <TextInput id="ge-storage" labelText={t('label.shared.storage', 'Storage & stability — same value on all variants')}
          defaultValue="Refrigerated 2–8°C, 7 days" />
        <div>
          <div className="cds--label">{t('label.shared.guidance', 'Sample & Results guidance')}{' '}
            <Tag type="warm-gray" size="sm">{t('state.testCatalog.differsAcrossTests', 'Differs across tests')}</Tag></div>
          {guidance === null ? (
            <div style={{ marginTop: '0.5rem' }}>
              {/* FR-74: per-test values visible BEFORE any overwrite */}
              <ul style={{ fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
                {g.variants.map((v) => <li key={v.id}><strong>{v.sample}:</strong> {perTest[v.id] || '—'}</li>)}
              </ul>
              <Button kind="tertiary" size="sm" onClick={() => setGuidance('')}>{t('button.setAllTo', 'Set all to…')}</Button>
            </div>
          ) : (
            <Stack gap={3} style={{ marginTop: '0.5rem' }}>
              <TextInput id="ge-guidance" labelText="" value={guidance} onChange={(e) => setGuidance(e.target.value)}
                placeholder={t('placeholder.newGuidance', 'New guidance for all variants')} />
              <Stack orientation="horizontal" gap={3}>
                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{t('helper.willOverwrite', `Will overwrite all ${g.variants.length} values on Save`)}</span>
                <Button kind="ghost" size="sm" onClick={() => setGuidance(null)}>{t('button.keepPerTest', 'Keep per-test values')}</Button>
              </Stack>
            </Stack>
          )}
        </div>
        <div>
          <div className="cds--label">{t('label.shared.ranges', 'Reference ranges')}</div>
          <InlineNotification kind="warning" lowContrast hideCloseButton style={{ marginTop: '0.5rem' }}
            title={t('warning.rangesSpecimen', 'Ranges are specimen-dependent')}
            subtitle={t('warning.rangesSpecimenDetail', `This selection spans ${g.variants.length} specimen types — "set all" edits here are usually wrong. Review and edit ranges per variant.`)} />
          <ul style={{ fontSize: '0.875rem' }}>
            {g.variants.map((v) => (
              <li key={v.id}><strong>{v.sample}:</strong> {v.id === 1044 ? '40–70 mg/dL (CSF)' : '74–106 mg/dL'}{' '}
                <Link style={{ fontSize: '0.75rem' }}>{t('link.openRanges', 'Open ranges')}</Link></li>
            ))}
          </ul>
        </div>
      </Stack>
    </Stack>
  );
}

/* ============ Labels — FR-66/67 (owning spec: barcode-labels v2.5 / OGC-285) ============ */
function LabelsSection({ back }) {
  const [links, setLinks] = useState([
    { preset: 'Specimen tube (system)', system: true, def: 2, max: 4, override: true },
    { preset: 'Aliquot small — custom', system: false, def: 1, max: 2, override: false },
  ]);
  const [masterOverride, setMasterOverride] = useState(true);
  const AVAILABLE = ['Block (system)', 'Slide (system)', 'Freezer (system)', 'Send-out pouch — custom'];
  return (
    <Stack gap={5} style={{ maxWidth: '46rem' }}>
      <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center' }}>
        <Button kind="ghost" size="sm" onClick={back}>← {t('button.backToList', 'Back to list')}</Button>
        <h3 style={{ margin: 0 }}>{t('title.labels', 'Glucose (Serum) — Labels')}</h3>
      </Stack>
      <div>
        <h5 style={{ margin: 0 }}>{t('heading.testCatalog.labels.defaultLabels', 'Default Labels for This Test')}</h5>
        <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
          {t('helper.labels.defaults', 'Per-sample label presets suggested automatically when this test is ordered.')}</p>
      </div>
      {/* FR-66: every ACTIVE PER-SAMPLE preset — system AND custom; order-only presets excluded (OGC-285 §3.2) */}
      <ComboBox id="add-preset" titleText={t('label.labels.addType', 'Add Label Type')} items={AVAILABLE}
        onChange={({ selectedItem }) => selectedItem && setLinks((l) => [...l, { preset: selectedItem, system: selectedItem.includes('system'), def: 1, max: 1, override: false }])}
        helperText={t('helper.labels.picker', 'All active per-sample presets — system and custom (from Label Preset Management)')} />
      <Table size="md">
        <TableHead><TableRow>
          <TableHeader>{t('label.labels.col.preset', 'Label type')}</TableHeader>
          <TableHeader>{t('label.labels.col.default', 'Default / sample')}</TableHeader>
          <TableHeader>{t('label.labels.col.max', 'Max / sample')}</TableHeader>
          <TableHeader>{t('label.labels.col.override', 'Allow override')}</TableHeader>
          <TableHeader style={{ width: '4rem' }} />
        </TableRow></TableHead>
        <TableBody>
          {links.map((l, i) => (
            <TableRow key={l.preset}>
              <TableCell>{l.preset} {l.system ? <Tag type="gray" size="sm">system</Tag> : <Tag type="teal" size="sm">custom</Tag>}</TableCell>
              <TableCell><NumberInput id={`d-${i}`} size="sm" min={0} value={l.def} hideLabel label="default"
                onChange={(_, { value }) => setLinks((x) => x.map((y, j) => (j === i ? { ...y, def: Number(value) } : y)))} /></TableCell>
              <TableCell><NumberInput id={`m-${i}`} size="sm" min={l.def} value={l.max} hideLabel label="max"
                invalid={l.max < l.def} invalidText={t('error.labels.maxGteDefault', 'Max Qty must be ≥ Default Qty')}
                onChange={(_, { value }) => setLinks((x) => x.map((y, j) => (j === i ? { ...y, max: Number(value) } : y)))} /></TableCell>
              <TableCell><Checkbox id={`o-${i}`} labelText="" checked={l.override}
                onChange={(_, { checked }) => setLinks((x) => x.map((y, j) => (j === i ? { ...y, override: checked } : y)))} /></TableCell>
              <TableCell><IconButton kind="ghost" size="sm" label={t('button.remove', 'Remove')}
                onClick={() => setLinks((x) => x.filter((_, j) => j !== i))}><TrashCan /></IconButton></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div>
        <h5 style={{ margin: 0 }}>{t('heading.testCatalog.labels.generationSettings', 'Label Generation Settings')}</h5>
        <Toggle id="master-override" labelText={t('label.labels.masterOverride', 'Allow label count override at order entry')}
          labelA="Off" labelB="On" toggled={masterOverride} onToggle={setMasterOverride} style={{ marginTop: '0.5rem' }} />
      </div>
      {/* FR-67 / OGC-285 §3.4 — the admin's only feedback on what order entry will do */}
      <Tile style={{ padding: 'var(--cds-spacing-05)', background: 'var(--cds-layer-02)' }}>
        <h5 style={{ margin: 0 }}>{t('heading.testCatalog.labels.orderEntryPreview', 'Order Entry Preview')}</h5>
        <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
          {t('helper.testCatalog.labels.orderEntryPreview', 'When this test is ordered, the Labels section will be pre-populated as follows')}</p>
        <StructuredListWrapper>
          <StructuredListHead><StructuredListRow head>
            <StructuredListCell head>{t('label.labels.col.preset', 'Label type')}</StructuredListCell>
            <StructuredListCell head>{t('label.labels.col.qty', 'Qty')}</StructuredListCell>
            <StructuredListCell head>{t('label.testCatalog.labels.col.source', 'Source')}</StructuredListCell>
          </StructuredListRow></StructuredListHead>
          <StructuredListBody>
            {links.map((l) => (
              <StructuredListRow key={l.preset}>
                <StructuredListCell>{l.preset}</StructuredListCell>
                <StructuredListCell>{l.def}{!masterOverride || !l.override ? ' 🔒' : ''}</StructuredListCell>
                <StructuredListCell>{t('label.labels.source.testConfig', 'This test’s configuration')}</StructuredListCell>
              </StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
        {(!masterOverride || links.some((l) => !l.override)) && (
          <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {t('helper.testCatalog.labels.lockedQty', 'Quantities are locked at order entry while override is off')}</p>
        )}
      </Tile>
    </Stack>
  );
}

/* ============ Root ============ */
export default function TestCatalogCompletionV2() {
  const [data, setData] = useState(GROUPS_SEED);
  const [view, setView] = useState({ name: 'list' });
  return (
    <div style={{ padding: 'var(--cds-spacing-05)' }}>
      <Breadcrumb noTrailingSlash style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <BreadcrumbItem>{t('label.breadcrumb.home', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem>{t('label.breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('label.breadcrumb.testCatalog', 'Test Catalog')}</BreadcrumbItem>
      </Breadcrumb>
      <ContentSwitcher size="sm" style={{ marginBottom: 'var(--cds-spacing-05)', maxWidth: '40rem' }}
        selectedIndex={['list', 'create', 'group', 'labels'].indexOf(view.name)}
        onChange={({ index }) => setView([{ name: 'list' }, { name: 'create' }, { name: 'group', g: data[0] }, { name: 'labels' }][index])}>
        <Switch name="list" text={t('label.view.list', 'List')} />
        <Switch name="create" text={t('label.view.create', 'New / Variant')} />
        <Switch name="group" text={t('label.view.group', 'Edit together')} />
        <Switch name="labels" text={t('label.view.labels', 'Labels (FR-66/67)')} />
      </ContentSwitcher>
      {view.name === 'list' && (
        <GroupedList data={data} setData={setData}
          onNew={() => setView({ name: 'create' })}
          onVariant={(g, id) => setView({ name: 'create', g, id })}
          onGroupEdit={(g) => setView({ name: 'group', g })} />
      )}
      {view.name === 'create' && <NewTestEditor variantOf={view.g} sourceId={view.id} back={() => setView({ name: 'list' })} />}
      {view.name === 'group' && <GroupEditor g={view.g || data[0]} back={() => setView({ name: 'list' })} />}
      {view.name === 'labels' && <LabelsSection back={() => setView({ name: 'list' })} />}
    </div>
  );
}
