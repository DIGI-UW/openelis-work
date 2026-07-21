// Route: /admin/TestCatalogList (flat) · editor /MasterListsPage/TestCatalogEditor/<id>/{basic-info,ranges,terminology}
// SideNav: Admin → Test Catalog → <Test>
// Test↔Sample-Type Many-to-Many — developer handoff mockup (feeds Claude Code alongside
//   test-catalog-mn-phase1-frs.md + test-catalog-mn-crosscheck.md).
// Grounded to the shipped OGC-1142 editor (Basic Info fields verified live 2026-07-20).
// Shows the FULL model: Phase 1 = Sample type single→multi (shared config);
//   Phase 2 = per-specimen OVERRIDE for Ranges and Terminology/LOINC.
//
// SUPERSEDES the variant paradigm in designs/admin-config/test-catalog-completion-v2.jsx:
//   • GroupedList (FR-46–51)          → FlatList below (one row per test, specimens listed; no link/unlink)
//   • NewTestEditor variant copy      → BasicInfoSection multi-select (no copy-from, no "Add specimen variant")
//   • GroupEditor "edit together"     → RangesSection / TerminologySection per-specimen OVERRIDE
//   • LabelsSection (FR-66/67)        → UNCHANGED by m:n; keep as-is from the prior mockup.
//   FR-62.c multi-link error → inverted (multi-association is normal).

import React, { useState } from 'react';
import {
  Grid, Column, Stack, TextInput, TextArea, Select, SelectItem,
  FilterableMultiSelect, RadioButton, RadioButtonGroup, Toggle,
  Button, Tag, Tile, InlineNotification, Checkbox,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent,
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// --- mock reference data -----------------------------------------------------
const SAMPLE_TYPES_BY_DOMAIN = {
  ENVIRONMENTAL: ['Water', 'Drinking Water', 'Surface Water', 'Sea Water', 'Spa Water',
    'Swimming Pool Water', 'Hemodialysis Water', 'Sanitation Hygiene Water', 'Public Bath Water',
    'Liquid Waste', 'Soil', 'Air'],
  CLINICAL: ['Serum', 'Plasma', 'CSF', 'Whole Blood', 'Urine'],
  VECTOR: ['Mosquito', 'Adult Mosquito', 'Mosquito Larva', 'Fly', 'Flea', 'Rodent'],
};

// ============================================================================
// Flat catalog list — one row per test, specimens listed (replaces GroupedList)
// Multi-specimen is NORMAL, not an error (FR-9/10). No grouped/flat toggle, no link/unlink.
// ============================================================================
const CATALOG = [
  { name: 'Turbidity (Kekeruhan)', code: 'TURB', domain: 'ENVIRONMENTAL',
    specimens: ['Water', 'Drinking Water', 'Surface Water', 'Sea Water', 'Spa Water', 'Swimming Pool Water', 'Hemodialysis Water', 'Sanitation Hygiene Water', 'Public Bath Water'], issue: null },
  { name: 'Color (Warna)', code: 'COL', domain: 'ENVIRONMENTAL',
    specimens: ['Water', 'Drinking Water', 'Surface Water', 'Sea Water', 'Spa Water', 'Public Bath Water', 'Liquid Waste'], issue: null },
  { name: 'Glucose', code: 'GLU', domain: 'CLINICAL', specimens: ['Serum', 'Plasma', 'CSF'], issue: null, override: 'CSF range + LOINC overridden' },
  { name: 'Residual Chlorine', code: 'RCL', domain: 'ENVIRONMENTAL', specimens: [], issue: 'No sample-type link' },
];

function FlatList() {
  const [issuesOnly, setIssuesOnly] = useState(false);
  const rows = issuesOnly ? CATALOG.filter((r) => r.issue) : CATALOG;
  return (
    <Tile>
      <h3>{t('heading.testCatalog.list', 'Test Catalog')}</h3>
      <TableToolbar>
        <TableToolbarContent>
          <Checkbox id="issues-only" labelText={t('filter.testCatalog.list.issuesOnly', 'Only tests with issues')}
            checked={issuesOnly} onChange={(_, { checked }) => setIssuesOnly(checked)} />
        </TableToolbarContent>
      </TableToolbar>
      <TableContainer>
        <Table size="sm">
          <TableHead><TableRow>
            <TableHeader>{t('label.testCatalog.name', 'Name')}</TableHeader>
            <TableHeader>{t('label.testCatalog.basicInfo.sampleTypes', 'Sample types')}</TableHeader>
            <TableHeader>{t('label.testCatalog.code', 'Code')}</TableHeader>
            <TableHeader>{t('label.testCatalog.domain', 'Domain')}</TableHeader>
            <TableHeader>{t('label.testCatalog.list.health', 'Health')}</TableHeader>
          </TableRow></TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.code}>
                <TableCell><strong>{r.name}</strong></TableCell>
                <TableCell>
                  {r.specimens.length === 0 ? <span style={{ color: '#6f6f6f' }}>— none —</span>
                    : <span>{r.specimens[0]}{r.specimens.length > 1 && <Tag type="teal" size="sm">{t('label.testCatalog.list.sampleTypesSummary', `+${r.specimens.length - 1} more`)}</Tag>}
                      {r.override && <Tag type="purple" size="sm">{r.override}</Tag>}</span>}
                </TableCell>
                <TableCell style={{ color: '#6f6f6f' }}>{r.code}</TableCell>
                <TableCell><Tag type={r.domain === 'ENVIRONMENTAL' ? 'teal' : 'blue'} size="sm">{r.domain}</Tag></TableCell>
                <TableCell>{r.issue ? <Tag type="red" size="sm">{r.issue}</Tag> : <span style={{ color: '#6f6f6f' }}>OK</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Tile>
  );
}

// ============================================================================
// Basic Info — the ONLY Phase 1 UI change: Sample type single → multi
// ============================================================================
function BasicInfoSection() {
  const [domain, setDomain] = useState('ENVIRONMENTAL');
  const [specimens, setSpecimens] = useState(
    ['Water', 'Drinking Water', 'Surface Water', 'Sea Water', 'Spa Water',
     'Swimming Pool Water', 'Hemodialysis Water', 'Sanitation Hygiene Water', 'Public Bath Water']
      .map((n) => ({ id: n, text: n })));
  const domainItems = (SAMPLE_TYPES_BY_DOMAIN[domain] || []).map((n) => ({ id: n, text: n }));

  return (
    <Tile>
      <h3>{t('heading.testCatalog.basicInfo', 'Basic Info')}</h3>
      <Stack gap={5}>
        <TextInput id="basic-info-edit-name" labelText={t('label.testCatalog.name', 'Name')} defaultValue="Turbidity (Kekeruhan)" />
        <TextInput id="basic-info-edit-code" labelText={t('label.testCatalog.code', 'Code')} defaultValue="TURB" />
        <TextArea id="basic-info-edit-desc" labelText={t('label.testCatalog.description', 'Description')} rows={2} defaultValue="Turbidity, nephelometric" />
        <Select id="basic-info-edit-labunit" labelText={t('label.testCatalog.labUnit', 'Lab Unit')} defaultValue="envchem">
          <SelectItem value="envchem" text="Environmental Chemistry" />
          <SelectItem value="watermicro" text="Water Microbiology" />
        </Select>

        {/* PHASE 1 CHANGE: the shipped single-value #basic-info-edit-sample-type becomes a multi-select.
            Domain-guarded (D-030): only same-domain specimens are offered. Chips show labels (not a count). */}
        <FilterableMultiSelect
          id="basic-info-edit-sample-type"
          titleText={t('label.testCatalog.basicInfo.sampleTypes', 'Sample types')}
          helperText={t('helper.testCatalog.basicInfo.sampleTypesMulti', 'Select every specimen this test runs on. Configuration is shared across them.')}
          items={domainItems}
          initialSelectedItems={specimens}
          itemToString={(i) => (i ? i.text : '')}
          onChange={({ selectedItems }) => setSpecimens(selectedItems || [])}
          selectionFeedback="top-after-reopen"
          invalid={specimens.length === 0}
          invalidText={t('error.testCatalog.basicInfo.sampleTypeRequired', 'Select at least one sample type.')}
        />
        <div>
          {specimens.map((s) => (
            <Tag key={s.id} type="teal" filter onClose={() => setSpecimens(specimens.filter((x) => x.id !== s.id))}>
              {s.text}
            </Tag>
          ))}
        </div>

        <RadioButtonGroup legendText={t('label.testCatalog.domain', 'Domain')} name="domain" valueSelected={domain}
          onChange={(v) => { setDomain(v); setSpecimens([]); /* domain switch clears cross-domain specimens (D-030) */ }}>
          <RadioButton labelText="Clinical" value="CLINICAL" />
          <RadioButton labelText="Environmental" value="ENVIRONMENTAL" />
          <RadioButton labelText="Vector" value="VECTOR" />
        </RadioButtonGroup>

        <Stack orientation="horizontal" gap={6}>
          <Toggle id="tg-amr" labelText={t('label.testCatalog.amr', 'AMR surveillance test')} defaultToggled={false} />
          <Toggle id="tg-active" labelText={t('label.testCatalog.active', 'Active')} defaultToggled />
          <Toggle id="tg-orderable" labelText={t('label.testCatalog.orderable', 'Orderable')} defaultToggled />
        </Stack>

        <Stack orientation="horizontal" gap={3}>
          <Button kind="primary" size="sm">{t('button.save', 'Save')}</Button>
          <Button kind="ghost" size="sm">{t('button.cancel', 'Cancel')}</Button>
        </Stack>
      </Stack>
    </Tile>
  );
}

// ============================================================================
// Ranges — shared across specimens, with PHASE 2 per-specimen override
// ============================================================================
function RangesSection() {
  const [override, setOverride] = useState(true); // demo: CSF override present
  return (
    <Tile>
      <h3>{t('heading.testCatalog.ranges', 'Ranges')} — Glucose (Serum, Plasma, CSF)</h3>
      <InlineNotification kind="info" lowContrast hideCloseButton
        subtitle={t('note.testCatalog.ranges.sharedDefault', 'Ranges are shared across the test’s specimens. Override only the specimen that differs — no copy, no separate test.')}
        title="" />
      <DataTable rows={[]} headers={[]}>{() => (
        <TableContainer>
          <Table size="sm">
            <TableHead><TableRow>
              <TableHeader>{t('label.testCatalog.ranges.appliesTo', 'Applies to')}</TableHeader>
              <TableHeader>{t('label.testCatalog.ranges.low', 'Low')}</TableHeader>
              <TableHeader>{t('label.testCatalog.ranges.high', 'High')}</TableHeader>
              <TableHeader>{t('label.testCatalog.ranges.scope', 'Scope')}</TableHeader>
              <TableHeader />
            </TableRow></TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{override ? 'Serum, Plasma' : 'Serum, Plasma, CSF'}</TableCell>
                <TableCell>70</TableCell><TableCell>110 mg/dL</TableCell>
                <TableCell><Tag type="gray">{t('tag.testCatalog.shared', 'Shared')}</Tag></TableCell>
                <TableCell />
              </TableRow>
              {override && (
                <TableRow>
                  <TableCell>CSF</TableCell>
                  <TableCell>40</TableCell><TableCell>70 mg/dL</TableCell>
                  <TableCell><Tag type="purple">{t('tag.testCatalog.override', 'Override — CSF')}</Tag></TableCell>
                  <TableCell><Button kind="ghost" size="sm" hasIconOnly renderIcon={TrashCan}
                    iconDescription={t('button.remove', 'Remove')} onClick={() => setOverride(false)} /></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}</DataTable>
      {!override && (
        <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setOverride(true)}>
          {t('button.testCatalog.ranges.overrideSpecimen', 'Override for a specific specimen…')}
        </Button>
      )}
    </Tile>
  );
}

// ============================================================================
// Terminology / LOINC — shared, with PHASE 2 per-specimen override (FR-11..14)
// ============================================================================
function TerminologySection() {
  const [csfOverride, setCsfOverride] = useState(true);
  return (
    <Tile>
      <h3>{t('heading.testCatalog.terminology', 'Terminology')} — Glucose</h3>
      <InlineNotification kind="info" lowContrast hideCloseButton title=""
        subtitle={t('note.testCatalog.terminology.specimenSpecific', 'LOINC is specimen-specific by the standard. A shared code applies to all specimens; override where the specimen changes the code.')} />
      <DataTable rows={[]} headers={[]}>{() => (
        <TableContainer>
          <Table size="sm">
            <TableHead><TableRow>
              <TableHeader>{t('label.testCatalog.terminology.appliesTo', 'Applies to')}</TableHeader>
              <TableHeader>{t('label.testCatalog.terminology.source', 'Source')}</TableHeader>
              <TableHeader>{t('label.testCatalog.terminology.code', 'Code')}</TableHeader>
              <TableHeader>{t('label.testCatalog.terminology.displayName', 'Display name')}</TableHeader>
              <TableHeader>{t('label.testCatalog.ranges.scope', 'Scope')}</TableHeader>
            </TableRow></TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{csfOverride ? 'Serum, Plasma' : 'Serum, Plasma, CSF'}</TableCell>
                <TableCell>LOINC</TableCell><TableCell>2345-7</TableCell>
                <TableCell>Glucose [Mass/volume] in Serum or Plasma</TableCell>
                <TableCell><Tag type="gray">{t('tag.testCatalog.shared', 'Shared')}</Tag></TableCell>
              </TableRow>
              {csfOverride && (
                <TableRow>
                  <TableCell>CSF</TableCell>
                  <TableCell>LOINC</TableCell><TableCell>2342-4</TableCell>
                  <TableCell>Glucose [Mass/volume] in Cerebral spinal fluid</TableCell>
                  <TableCell><Tag type="purple">{t('tag.testCatalog.override', 'Override — CSF')}</Tag></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}</DataTable>
      {!csfOverride && (
        <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setCsfOverride(true)}>
          {t('button.testCatalog.terminology.overrideSpecimen', 'Override LOINC for a specific specimen…')}
        </Button>
      )}
    </Tile>
  );
}

export default function TestCatalogMnEditorMockup() {
  return (
    <Grid narrow>
      <Column lg={16} md={8} sm={4}>
        <Stack gap={6}>
          <h2>Test↔Sample-Type Many-to-Many — editor</h2>
          <InlineNotification kind="info" lowContrast hideCloseButton title=""
            subtitle="Phase 1: Sample type single→multi (shared config). Phase 2: per-specimen override on Ranges + Terminology. Retires variant grouping + copy." />
          <FlatList />
          <BasicInfoSection />
          <RangesSection />
          <TerminologySection />
        </Stack>
      </Column>
    </Grid>
  );
}
