/**
 * Admin: Validation Configuration — Interactive Preview v3
 * ─────────────────────────────────────────────────────────────────────────
 *   Title:       Admin / Validation Configuration
 *   Route:       /admin/validation-configuration
 *   SideNav:     Admin → Validation Configuration
 *   Status:      Draft mockup (visual review)
 *   Jira:        OGC-343 (this page) · OGC-817 (sibling Validation Page v3) ·
 *                OGC-579 (impl story)
 *   Sibling FRS: designs/results-validation/admin-validation-configuration.md
 *   Last updated: 2026-06-10
 * ─────────────────────────────────────────────────────────────────────────
 *
 * What this mockup demonstrates (per FRS §Carbon Component Map):
 *   - Feature-flag awareness banner (useMultiLevelValidation = ON)
 *   - Summary banner across all 12 lab units (S-05)
 *   - Lab-Wide Default panel:
 *       Trigger radio (NO_RESULTS / ALL_RESULTS / ABNORMAL_ONLY)
 *       Validations Required NumberInput (0–5)
 *       Level N Role Select (filtered to roles with result.validate)
 *       Add/Remove Level (per BR-V3CFG-010 / BR-V3CFG-011)
 *   - Per-Lab-Unit override DataTable with 12 demo rows + 1 expanded row
 *   - Domain badges: Clinical blue / Environmental green / Vector purple
 *   - Domain-aware default suggestion banner (BR-V3CFG-007)
 *   - Effective-Config Preview pane (mini Validation page render)
 *   - Sticky save bar with Save / Reset
 *
 * Carbon-only conventions (no Tailwind utility classes anywhere):
 *   - @carbon/react components for layout, form, table, notification
 *   - @carbon/icons-react for glyphs
 *   - Inline style={{...}} only for one-off spacing / colors not covered by
 *     Carbon tokens (matches compliance-evaluation-engine.jsx convention)
 *   - All copy plain text (no t() wrapping in mockup — i18n keys live in FRS)
 */

import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  Breadcrumb, BreadcrumbItem,
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  RadioButtonGroup, RadioButton,
  NumberInput, Select, SelectItem, Search,
  Dropdown,
  Button, IconButton, InlineNotification, Tag, Tile,
} from '@carbon/react';
import {
  Add, TrashCan, Save, Reset, Edit, View, ChevronDown, ChevronUp,
  Information, Warning, CircleDash, Bot, Security,
} from '@carbon/icons-react';

const t = (k, f) => f || k;

// ─────────────────────────────────────────────────────────────────────────
// Roles holding the `result.validate` permission
// (sourced in production from GET /api/admin/roles?permission=result.validate)
// ─────────────────────────────────────────────────────────────────────────
const VALIDATE_ROLES = [
  { id: 'role-validation', label: 'Validation' },
  { id: 'role-tech-ii',    label: 'Senior Tech (Tech II)' },
  { id: 'role-supervisor', label: 'Supervisor' },
  { id: 'role-lab-mgr',    label: 'Lab Manager' },
  { id: 'role-path',       label: 'Pathologist Review' },
];

const DOMAIN_BADGE = {
  CLINICAL:      { label: 'Clinical',      type: 'blue'   },
  ENVIRONMENTAL: { label: 'Environmental', type: 'green'  },
  VECTOR:        { label: 'Vector',        type: 'purple' },
};

const TRIGGER_LABEL = {
  NO_RESULTS:    'No Results — auto-release everything',
  ALL_RESULTS:   'All Results — every result enters the pipeline',
  ABNORMAL_ONLY: 'Abnormal Only — only abnormal / critical / delta',
};
const TRIGGER_SHORT = {
  NO_RESULTS:    'No Results',
  ALL_RESULTS:   'All Results',
  ABNORMAL_ONLY: 'Abnormal Only',
};

// Domain-aware suggestion text — BR-V3CFG-007
const DOMAIN_SUGGESTION = {
  CLINICAL:      'Suggested for Clinical multi-level workflows: All Results, 2 levels.',
  ENVIRONMENTAL: 'Suggested for Environmental units: Abnormal Only, 1 level.',
  VECTOR:        'Suggested for Vector PCR pools: Abnormal Only, 1 level.',
};

// ─────────────────────────────────────────────────────────────────────────
// Demo data — 12 lab units · matches FRS Cross-Domain table
// ─────────────────────────────────────────────────────────────────────────
const LAB_UNITS = [
  {
    id: 'lu-hem', name: 'Hematology', domain: 'CLINICAL', source: 'OVERRIDE',
    trigger: 'ALL_RESULTS',
    levels: [
      { n: 1, roleId: 'role-tech-ii' },
      { n: 2, roleId: 'role-supervisor' },
    ],
  },
  {
    id: 'lu-chem', name: 'Chemistry', domain: 'CLINICAL', source: 'OVERRIDE',
    trigger: 'ALL_RESULTS',
    levels: [
      { n: 1, roleId: 'role-tech-ii' },
      { n: 2, roleId: 'role-supervisor' },
    ],
  },
  {
    id: 'lu-micro', name: 'Microbiology', domain: 'CLINICAL', source: 'DEFAULT',
    trigger: 'ALL_RESULTS',
    levels: [{ n: 1, roleId: 'role-validation' }],
  },
  {
    id: 'lu-sero', name: 'Serology', domain: 'CLINICAL', source: 'OVERRIDE',
    trigger: 'ABNORMAL_ONLY',
    levels: [{ n: 1, roleId: 'role-validation' }],
  },
  {
    id: 'lu-uri-rou', name: 'Urinalysis-Routine', domain: 'CLINICAL', source: 'OVERRIDE',
    trigger: 'NO_RESULTS', levels: [],
  },
  {
    id: 'lu-uri-tox', name: 'Urinalysis-Toxicology', domain: 'CLINICAL', source: 'DEFAULT',
    trigger: 'ALL_RESULTS',
    levels: [{ n: 1, roleId: 'role-validation' }],
  },
  {
    id: 'lu-mol', name: 'Molecular', domain: 'CLINICAL', source: 'DEFAULT',
    trigger: 'ALL_RESULTS',
    levels: [
      { n: 1, roleId: 'role-tech-ii' },
      { n: 2, roleId: 'role-supervisor' },
    ],
  },
  {
    id: 'lu-cyto', name: 'Cytology', domain: 'CLINICAL', source: 'OVERRIDE',
    trigger: 'ALL_RESULTS',
    levels: [{ n: 1, roleId: 'role-path' }],
  },
  {
    id: 'lu-wq', name: 'Water Quality', domain: 'ENVIRONMENTAL', source: 'OVERRIDE',
    trigger: 'NO_RESULTS', levels: [],
  },
  {
    id: 'lu-air', name: 'Air Quality', domain: 'ENVIRONMENTAL', source: 'DEFAULT',
    trigger: 'ABNORMAL_ONLY',
    levels: [{ n: 1, roleId: 'role-validation' }],
  },
  {
    id: 'lu-vec-mos', name: 'Vector Surveillance — Mosquito Pool', domain: 'VECTOR', source: 'OVERRIDE',
    trigger: 'ABNORMAL_ONLY',
    levels: [{ n: 1, roleId: 'role-validation' }],
  },
  {
    id: 'lu-vec-tick', name: 'Vector Surveillance — Tick Pool', domain: 'VECTOR', source: 'DEFAULT',
    trigger: 'ABNORMAL_ONLY',
    levels: [{ n: 1, roleId: 'role-validation' }],
  },
];

// Lab-wide default — used as the baseline for any `DEFAULT` unit
const LAB_WIDE_DEFAULT = {
  trigger: 'ALL_RESULTS',
  levels: [{ n: 1, roleId: 'role-validation' }],
};

// Helper to render a roles summary string for the override table
function rolesSummary(levels) {
  if (!levels || levels.length === 0) return '—';
  return levels.map(l => {
    const r = VALIDATE_ROLES.find(v => v.id === l.roleId);
    return r ? r.label : '—';
  }).join(' → ');
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-component: Role row inside a level table
// ─────────────────────────────────────────────────────────────────────────
function LevelRow({ levelN, roleId, onChangeRole, onRemove, canRemove, idPrefix }) {
  return (
    <TableRow>
      <TableCell style={{ width: 80, verticalAlign: 'middle' }}>
        <strong>Level {levelN}</strong>
      </TableCell>
      <TableCell>
        <Select
          id={`${idPrefix}-role-${levelN}`}
          labelText=""
          hideLabel
          value={roleId || ''}
          onChange={(e) => onChangeRole(levelN, e.target.value)}
        >
          <SelectItem value="" text="— Select a role with Validate Results permission —" />
          {VALIDATE_ROLES.map(r => (
            <SelectItem key={r.id} value={r.id} text={r.label} />
          ))}
        </Select>
      </TableCell>
      <TableCell style={{ width: 160, verticalAlign: 'middle' }}>
        <Tag type="cool-gray" size="sm" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          result.validate
        </Tag>
      </TableCell>
      <TableCell style={{ width: 80, verticalAlign: 'middle', textAlign: 'right' }}>
        {canRemove && (
          <IconButton
            label={`Remove Level ${levelN}`}
            kind="ghost"
            size="sm"
            onClick={() => onRemove(levelN)}
          >
            <TrashCan />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-component: form body (Lab-Wide Default and inline override editor).
// BR-V3CFG-010: Validations Required = 0 forces Trigger to NO_RESULTS.
// BR-V3CFG-011: empty role on any level disables Save (visual only).
// ─────────────────────────────────────────────────────────────────────────
function ValidationForm({
  idPrefix, trigger, setTrigger, levels, setLevels, suggestionText, onDismissSuggestion,
}) {
  const triggerDisabled = levels.length === 0;

  const setLevelRole = (n, roleId) => {
    setLevels(prev => prev.map(l => l.n === n ? { ...l, roleId } : l));
  };
  const addLevel = () => {
    if (levels.length >= 5) return;
    const next = (levels[levels.length - 1]?.n || 0) + 1;
    setLevels([...levels, { n: next, roleId: '' }]);
  };
  const removeLevel = (n) => {
    const filtered = levels.filter(l => l.n !== n);
    const renumbered = filtered.map((l, i) => ({ ...l, n: i + 1 }));
    setLevels(renumbered);
  };

  return (
    <Stack gap={6}>
      {suggestionText && (
        <InlineNotification
          kind="info"
          lowContrast
          title="Domain-aware suggestion"
          subtitle={suggestionText}
          onCloseButtonClick={onDismissSuggestion}
        />
      )}

      {/* Validation Trigger */}
      <div>
        <RadioButtonGroup
          legendText="Validation Trigger"
          name={`${idPrefix}-trigger`}
          valueSelected={triggerDisabled ? 'NO_RESULTS' : trigger}
          onChange={(value) => !triggerDisabled && setTrigger(value)}
          orientation="vertical"
          disabled={triggerDisabled}
        >
          <RadioButton
            value="NO_RESULTS"
            id={`${idPrefix}-trigger-no`}
            labelText={TRIGGER_LABEL.NO_RESULTS}
          />
          <RadioButton
            value="ALL_RESULTS"
            id={`${idPrefix}-trigger-all`}
            labelText={TRIGGER_LABEL.ALL_RESULTS}
          />
          <RadioButton
            value="ABNORMAL_ONLY"
            id={`${idPrefix}-trigger-abn`}
            labelText={TRIGGER_LABEL.ABNORMAL_ONLY}
          />
        </RadioButtonGroup>
        {triggerDisabled && (
          <p style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', marginTop: 6 }}>
            <Information size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Validations Required is 0 — Trigger is forced to <strong>No Results</strong>
            &nbsp;(BR-V3CFG-010).
          </p>
        )}
      </div>

      {/* Validations Required + level table */}
      <div>
        <Grid condensed style={{ marginBottom: 8 }}>
          <Column lg={4} md={4} sm={4}>
            <NumberInput
              id={`${idPrefix}-levels-count`}
              label="Validations Required"
              helperText="Sequential review levels (0 to 5)."
              min={0}
              max={5}
              step={1}
              value={levels.length}
              onChange={(_e, { value }) => {
                const v = Math.max(0, Math.min(5, Number(value) || 0));
                if (v === levels.length) return;
                if (v > levels.length) {
                  const additions = [];
                  for (let i = levels.length + 1; i <= v; i++) {
                    additions.push({ n: i, roleId: '' });
                  }
                  setLevels([...levels, ...additions]);
                } else {
                  setLevels(levels.slice(0, v));
                }
              }}
            />
          </Column>
          <Column lg={12} md={4} sm={4}>
            <div style={{ paddingTop: 24, fontSize: 12, color: 'var(--cds-text-secondary, #525252)' }}>
              Each level requires a role holding the <code>result.validate</code> permission.
              Roles are sourced from Role Builder.
            </div>
          </Column>
        </Grid>

        {levels.length > 0 ? (
          <Table size="sm">
            <TableHead>
              <TableRow>
                <TableHeader style={{ width: 80 }}>Level</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader style={{ width: 160 }}>Permission</TableHeader>
                <TableHeader style={{ width: 80 }}></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {levels.map(l => (
                <LevelRow
                  key={l.n}
                  levelN={l.n}
                  roleId={l.roleId}
                  onChangeRole={setLevelRole}
                  onRemove={removeLevel}
                  canRemove={levels.length > 0}
                  idPrefix={idPrefix}
                />
              ))}
            </TableBody>
          </Table>
        ) : (
          <Tile light style={{
            background: 'var(--cds-layer-accent-01, #f4f4f4)',
            padding: 16, textAlign: 'center',
            fontSize: 13, color: 'var(--cds-text-secondary, #525252)',
          }}>
            No review levels — results auto-release on save. Add a level to require human review.
          </Tile>
        )}

        <Stack orientation="horizontal" gap={3} style={{ marginTop: 12 }}>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Add}
            disabled={levels.length >= 5}
            onClick={addLevel}
          >
            Add Level
          </Button>
          {levels.length >= 5 && (
            <span style={{ fontSize: 11, color: 'var(--cds-text-secondary, #525252)', paddingTop: 8 }}>
              Maximum 5 levels.
            </span>
          )}
        </Stack>

        {/* WARNING STATE (BR-V3CFG-011): when VALIDATE_ROLES is empty,
            render an `InlineNotification kind="warning"` and disable Save.
            Not rendered here because demo data has 5 roles — leaving this
            block as a code comment per spec. */}
      </div>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-component: Effective Config Preview pane
// Compressed Validation-Page-like mini-queue using the SAME pending config.
// Illustrative — non-interactive (BR-V3CFG-013).
// ─────────────────────────────────────────────────────────────────────────
function EffectivePreviewPane({ selectedUnit, onChangeUnit }) {
  const unit = LAB_UNITS.find(u => u.id === selectedUnit) || LAB_UNITS[0];
  const config = unit.source === 'OVERRIDE'
    ? { trigger: unit.trigger, levels: unit.levels }
    : LAB_WIDE_DEFAULT;

  const mockRows = [
    {
      id: 'p1', accession: 'DEV01260000001234-017', patient: 'Test, A',
      test: 'WBC', value: '7.5', unit: 'x10⁹/L', range: '4.0–10.0',
      isNormal: true, levelStage: 1,
    },
    {
      id: 'p2', accession: 'DEV01260000001235-022', patient: 'Smith, J',
      test: 'Glucose, Fasting', value: '142', unit: 'mg/dL', range: '70–99',
      isNormal: false, levelStage: 2,
    },
    {
      id: 'p3', accession: 'DEV01260000001236-031', patient: 'Test, B',
      test: 'HIV 1/2 Rapid', value: 'Non-Reactive', unit: '', range: '—',
      isNormal: true, levelStage: 0,
    },
  ];

  const renderRow = (row) => {
    if (config.trigger === 'NO_RESULTS' || config.levels.length === 0) {
      return { tag: { type: 'cool-gray', label: 'Auto-released' }, dim: true };
    }
    if (config.trigger === 'ABNORMAL_ONLY' && row.isNormal) {
      return { tag: { type: 'cool-gray', label: 'Auto-released (normal)' }, dim: true };
    }
    const totalLevels = config.levels.length;
    const stage = Math.min(row.levelStage || 1, totalLevels);
    if (stage === 1) {
      return { tag: { type: 'teal', label: `Awaiting Level 1 / ${totalLevels}` }, dim: false };
    }
    return { tag: { type: 'blue', label: `Awaiting Level ${stage} / ${totalLevels} (other reviewer)` }, dim: true };
  };

  const previewActingAs = config.levels.length > 0
    ? VALIDATE_ROLES.find(r => r.id === config.levels[0].roleId)?.label || 'Validation'
    : '—';

  return (
    <Tile>
      <Stack gap={4}>
        <div>
          <h4 style={{ margin: 0 }}>
            <View size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Effective Config Preview
          </h4>
          <p style={{
            fontSize: 12, color: 'var(--cds-text-secondary, #525252)',
            margin: '4px 0 0',
          }}>
            What an analyst sees on the Validation page for this lab unit, given the
            <strong>&nbsp;pending&nbsp;</strong>(unsaved) config. Read-only.
          </p>
        </div>

        <Dropdown
          id="preview-unit"
          titleText="Preview as lab unit"
          label="Select a lab unit"
          items={LAB_UNITS}
          itemToString={u => u ? `${u.name} (${DOMAIN_BADGE[u.domain].label})` : ''}
          selectedItem={unit}
          onChange={({ selectedItem }) => selectedItem && onChangeUnit(selectedItem.id)}
        />

        <div style={{
          background: 'var(--cds-layer-accent-01, #f4f4f4)',
          borderLeft: '3px solid #007d79',
          padding: '8px 12px',
          fontSize: 13,
        }}>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Security size={16} style={{ color: '#007d79' }} />
            <strong>{unit.name}</strong>
            <Tag type={DOMAIN_BADGE[unit.domain].type} size="sm">
              {DOMAIN_BADGE[unit.domain].label}
            </Tag>
            <span style={{ color: 'var(--cds-text-secondary, #525252)' }}>·</span>
            <span>{TRIGGER_SHORT[config.trigger]}</span>
            <span style={{ color: 'var(--cds-text-secondary, #525252)' }}>·</span>
            <span>
              {config.levels.length === 0
                ? 'Auto-release'
                : `${config.levels.length} level${config.levels.length === 1 ? '' : 's'}`}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)' }}>
              Acting as: <strong>{previewActingAs}</strong> (you)
            </span>
          </Stack>
        </div>

        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>Accession / Patient</TableHeader>
              <TableHeader>Test</TableHeader>
              <TableHeader>Result</TableHeader>
              <TableHeader>Status (effective)</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockRows.map(row => {
              const r = renderRow(row);
              return (
                <TableRow key={row.id} style={r.dim ? { opacity: 0.55 } : {}}>
                  <TableCell>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
                      {row.accession}
                    </div>
                    <div style={{ fontSize: 12 }}>{row.patient}</div>
                  </TableCell>
                  <TableCell>
                    <div>{row.test}</div>
                    <div style={{ fontSize: 11, color: 'var(--cds-text-secondary, #525252)' }}>
                      Range {row.range}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>
                      {row.value}
                    </span>
                    {row.unit && (
                      <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--cds-text-secondary, #525252)' }}>
                        {row.unit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tag type={r.tag.type} size="sm">{r.tag.label}</Tag>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div style={{
          fontSize: 11, color: 'var(--cds-text-secondary, #525252)', fontStyle: 'italic',
        }}>
          <Bot size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Auto-released rows write an <code>AUTO_VALIDATE</code> audit event with the
          full config snapshot per BR-V3CFG-005.
        </div>
      </Stack>
    </Tile>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────
export default function AdminValidationConfiguration() {
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [labWideTrigger, setLabWideTrigger] = useState(LAB_WIDE_DEFAULT.trigger);
  const [labWideLevels, setLabWideLevels] = useState(LAB_WIDE_DEFAULT.levels.map(l => ({ ...l })));

  const [expandedUnitId, setExpandedUnitId] = useState('lu-hem');

  const expandedUnit = LAB_UNITS.find(u => u.id === expandedUnitId);
  const seedTrigger = expandedUnit?.trigger || 'ALL_RESULTS';
  const seedLevels  = expandedUnit?.levels?.map(l => ({ ...l })) || [];
  const [overrideTrigger, setOverrideTrigger] = useState(seedTrigger);
  const [overrideLevels, setOverrideLevels]   = useState(seedLevels);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  const [previewUnitId, setPreviewUnitId] = useState('lu-hem');

  // For the mockup, force dirty=true so Save/Reset show active and the
  // sticky bar renders.
  const dirty = true;

  const filteredUnits = useMemo(() => {
    return LAB_UNITS.filter(u => {
      if (domainFilter !== 'ALL' && u.domain !== domainFilter) return false;
      if (search.trim() && !u.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [domainFilter, search]);

  const stats = useMemo(() => {
    const overrides = LAB_UNITS.filter(u => u.source === 'OVERRIDE');
    const autoRelease = LAB_UNITS.filter(u =>
      u.source === 'OVERRIDE' && (u.trigger === 'NO_RESULTS' || u.levels.length === 0)
    );
    return {
      total: LAB_UNITS.length,
      overrides: overrides.length,
      autoRelease,
    };
  }, []);

  return (
    <Grid fullWidth style={{ padding: '0 1rem', maxWidth: 1600, margin: '0 auto' }}>
      {/* ── Breadcrumb + Title ───────────────────────────────────────── */}
      <Column lg={16} md={8} sm={4} style={{ paddingTop: 16 }}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#">Home</BreadcrumbItem>
          <BreadcrumbItem href="#">Admin Management</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Validation Configuration</BreadcrumbItem>
        </Breadcrumb>
      </Column>

      <Column lg={16} md={8} sm={4} style={{ paddingTop: 8 }}>
        <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 300 }}>
            Validation Configuration
          </h1>
          <Tag type="teal" size="md">
            <Security size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            useMultiLevelValidation: ON
          </Tag>
        </Stack>
        <p style={{ margin: '4px 0 16px', fontSize: 13, color: 'var(--cds-text-secondary, #525252)' }}>
          Configure how results move from entry to release.
        </p>
      </Column>

      {/* ── Feature-flag awareness banner ─────────────────────────────── */}
      <Column lg={16} md={8} sm={4} style={{ paddingBottom: 16 }}>
        <InlineNotification
          kind="info"
          lowContrast
          hideCloseButton
          title="Multi-level Validation enabled"
          subtitle={
            'useMultiLevelValidation is ON for this site. Existing single-level labs continue ' +
            'to function unchanged until you edit their override. The legacy "Validate all results" ' +
            'toggle has been migrated to the lab-wide default row below.'
          }
          style={{ maxWidth: '100%' }}
        />
      </Column>

      {/* ── Top toolbar: domain filter + search + Save/Reset ──────────── */}
      <Column lg={16} md={8} sm={4} style={{ paddingBottom: 8 }}>
        <Tile style={{ padding: 12 }}>
          <Stack orientation="horizontal" gap={4} style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 220 }}>
              <Dropdown
                id="domain-filter"
                titleText="Filter by domain"
                label="All domains"
                items={[
                  { id: 'ALL',           label: 'All domains' },
                  { id: 'CLINICAL',      label: 'Clinical' },
                  { id: 'ENVIRONMENTAL', label: 'Environmental' },
                  { id: 'VECTOR',        label: 'Vector' },
                ]}
                itemToString={i => i ? i.label : ''}
                selectedItem={{
                  id: domainFilter,
                  label: domainFilter === 'ALL' ? 'All domains'
                    : DOMAIN_BADGE[domainFilter]?.label || domainFilter,
                }}
                onChange={({ selectedItem }) => selectedItem && setDomainFilter(selectedItem.id)}
                size="md"
              />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label htmlFor="unit-search" style={{
                fontSize: 12, color: 'var(--cds-text-secondary, #525252)', display: 'block', marginBottom: 6,
              }}>
                Search lab units
              </label>
              <Search
                id="unit-search"
                size="md"
                labelText=""
                placeholder="Search by lab unit name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Stack orientation="horizontal" gap={3}>
                <Button kind="ghost" size="md" renderIcon={Reset} disabled={!dirty}>
                  Reset Changes
                </Button>
                <Button kind="primary" size="md" renderIcon={Save} disabled={!dirty}>
                  Save Configuration
                </Button>
              </Stack>
            </div>
          </Stack>
        </Tile>
      </Column>

      {/* ── Summary banner (3 stats) ──────────────────────────────────── */}
      <Column lg={16} md={8} sm={4} style={{ paddingBottom: 16, paddingTop: 8 }}>
        <Grid condensed>
          <Column lg={5} md={4} sm={4}>
            <Tile style={{ background: '#edf5ff', borderLeft: '3px solid #0f62fe', height: '100%' }}>
              <div style={{
                fontSize: 11, color: 'var(--cds-text-secondary, #525252)',
                textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
              }}>
                Lab-Wide Default
              </div>
              <div style={{ fontSize: 16, marginTop: 4, fontWeight: 500 }}>
                {TRIGGER_SHORT[labWideTrigger]}, {labWideLevels.length} level{labWideLevels.length === 1 ? '' : 's'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', marginTop: 2 }}>
                Roles: {rolesSummary(labWideLevels)}
              </div>
            </Tile>
          </Column>
          <Column lg={5} md={4} sm={4}>
            <Tile style={{ background: '#d9fbfb', borderLeft: '3px solid #007d79', height: '100%' }}>
              <div style={{
                fontSize: 11, color: 'var(--cds-text-secondary, #525252)',
                textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
              }}>
                Lab Units with Overrides
              </div>
              <div style={{ fontSize: 16, marginTop: 4, fontWeight: 500 }}>
                {stats.overrides} of {stats.total}
              </div>
              <div style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', marginTop: 2 }}>
                Inheritance from default: {stats.total - stats.overrides} units
              </div>
            </Tile>
          </Column>
          <Column lg={6} md={8} sm={4}>
            <Tile style={{ background: '#f6f2ff', borderLeft: '3px solid #8a3ffc', height: '100%' }}>
              <div style={{
                fontSize: 11, color: 'var(--cds-text-secondary, #525252)',
                textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
              }}>
                Auto-Releasing Units
              </div>
              <div style={{ fontSize: 16, marginTop: 4, fontWeight: 500 }}>
                {stats.autoRelease.length} {stats.autoRelease.length === 1 ? 'unit' : 'units'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)', marginTop: 2 }}>
                {stats.autoRelease.map(u => u.name).join(', ') || '—'}
              </div>
            </Tile>
          </Column>
        </Grid>
      </Column>

      {/* ── Lab-Wide Default panel ────────────────────────────────────── */}
      <Column lg={16} md={8} sm={4} style={{ paddingBottom: 16 }}>
        <Tile>
          <Stack gap={3} style={{ marginBottom: 12 }}>
            <Stack orientation="horizontal" gap={3} style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>Lab-Wide Default</h3>
              <Tag type="cool-gray" size="sm">Applies to lab units without a specific override</Tag>
            </Stack>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--cds-text-secondary, #525252)' }}>
              When a new lab unit is created, or when an override is removed,
              the unit falls back to this configuration.
            </p>
          </Stack>

          <ValidationForm
            idPrefix="labwide"
            trigger={labWideTrigger}
            setTrigger={setLabWideTrigger}
            levels={labWideLevels}
            setLevels={setLabWideLevels}
            suggestionText={null}
          />
        </Tile>
      </Column>

      {/* ── Per-Lab-Unit Overrides table ──────────────────────────────── */}
      <Column lg={16} md={8} sm={4} style={{ paddingBottom: 16 }}>
        <Tile>
          <Stack gap={3} style={{ marginBottom: 16 }}>
            <Stack orientation="horizontal" gap={3} style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>Per-Lab-Unit Overrides</h3>
              <Tag type="cool-gray" size="sm">
                {filteredUnits.length} of {LAB_UNITS.length} lab units shown
              </Tag>
            </Stack>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--cds-text-secondary, #525252)' }}>
              Each row shows the lab unit's effective configuration. Rows tagged{' '}
              <Tag type="teal" size="sm">Override</Tag> have a specific config; rows tagged{' '}
              <Tag type="cool-gray" size="sm">Default</Tag> inherit from the lab-wide default above.
            </p>
          </Stack>

          <Table size="md">
            <TableHead>
              <TableRow>
                <TableHeader style={{ width: 32 }}></TableHeader>
                <TableHeader>Lab Unit</TableHeader>
                <TableHeader style={{ width: 140 }}>Domain</TableHeader>
                <TableHeader style={{ width: 130 }}>Trigger</TableHeader>
                <TableHeader style={{ width: 80 }}>Levels</TableHeader>
                <TableHeader>Roles</TableHeader>
                <TableHeader style={{ width: 110 }}>Source</TableHeader>
                <TableHeader style={{ width: 220 }}>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUnits.map(unit => {
                const isExpanded = expandedUnitId === unit.id;
                const dBadge = DOMAIN_BADGE[unit.domain];
                return (
                  <React.Fragment key={unit.id}>
                    <TableRow style={isExpanded ? { background: 'var(--cds-layer-accent-01, #edf5ff)' } : {}}>
                      <TableCell style={{ verticalAlign: 'middle' }}>
                        <IconButton
                          label={isExpanded ? 'Collapse row' : 'Expand row'}
                          kind="ghost"
                          size="sm"
                          onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                        >
                          {isExpanded ? <ChevronUp /> : <ChevronDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'middle' }}>
                        <strong>{unit.name}</strong>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'middle' }}>
                        <Tag type={dBadge.type} size="sm">{dBadge.label}</Tag>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'middle' }}>
                        {TRIGGER_SHORT[unit.trigger]}
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'middle' }}>
                        {unit.levels.length === 0 ? (
                          <span style={{ color: 'var(--cds-text-secondary, #525252)' }}>
                            <CircleDash size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                            0
                          </span>
                        ) : (
                          <strong>{unit.levels.length}</strong>
                        )}
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'middle' }}>
                        {unit.levels.length === 0 ? (
                          <span style={{ color: 'var(--cds-text-secondary, #525252)' }}>—</span>
                        ) : (
                          <span style={{ fontSize: 13 }}>{rolesSummary(unit.levels)}</span>
                        )}
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'middle' }}>
                        {unit.source === 'OVERRIDE' ? (
                          <Tag type="teal" size="sm">Override</Tag>
                        ) : (
                          <Tag type="cool-gray" size="sm">Default</Tag>
                        )}
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'middle' }}>
                        <Stack orientation="horizontal" gap={2}>
                          <Button
                            kind="ghost"
                            size="sm"
                            renderIcon={Edit}
                            onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                          >
                            {unit.source === 'OVERRIDE' ? 'Edit' : 'Configure override'}
                          </Button>
                          {unit.source === 'OVERRIDE' && (
                            <Button kind="danger--ghost" size="sm" renderIcon={TrashCan}>
                              Reset
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow style={{ background: 'var(--cds-layer-accent-01, #edf5ff)' }}>
                        <TableCell colSpan={8} style={{ padding: 16 }}>
                          <Tile light style={{ background: '#fff', padding: 16 }}>
                            <Stack gap={5}>
                              <Stack orientation="horizontal" gap={3} style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                                <h4 style={{ margin: 0 }}>Override for {unit.name}</h4>
                                <Tag type={dBadge.type} size="sm">{dBadge.label}</Tag>
                                {unit.source === 'OVERRIDE' && (
                                  <Tag type="teal" size="sm">Currently overridden</Tag>
                                )}
                                <span style={{ flex: 1 }} />
                                <Button kind="ghost" size="sm">View audit trail</Button>
                              </Stack>

                              {!suggestionDismissed && (
                                <InlineNotification
                                  kind="info"
                                  lowContrast
                                  title="Domain-aware suggestion"
                                  subtitle={DOMAIN_SUGGESTION[unit.domain]}
                                  onCloseButtonClick={() => setSuggestionDismissed(true)}
                                />
                              )}

                              <ValidationForm
                                idPrefix={`override-${unit.id}`}
                                trigger={overrideTrigger}
                                setTrigger={setOverrideTrigger}
                                levels={overrideLevels}
                                setLevels={setOverrideLevels}
                                suggestionText={null}
                              />

                              <Stack orientation="horizontal" gap={3} style={{ marginTop: 8 }}>
                                <Button kind="primary" size="sm" renderIcon={Save}>
                                  Save Override
                                </Button>
                                <Button kind="ghost" size="sm">Cancel</Button>
                                {unit.source === 'OVERRIDE' && (
                                  <>
                                    <span style={{ flex: 1 }} />
                                    <Button kind="danger--ghost" size="sm" renderIcon={TrashCan}>
                                      Delete override (revert to lab-wide default)
                                    </Button>
                                  </>
                                )}
                              </Stack>
                            </Stack>
                          </Tile>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredUnits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} style={{
                    textAlign: 'center', padding: 24, fontStyle: 'italic',
                    color: 'var(--cds-text-secondary, #525252)',
                  }}>
                    No lab units match your filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Tile>
      </Column>

      {/* ── Effective-Config Preview pane ─────────────────────────────── */}
      <Column lg={16} md={8} sm={4} style={{ paddingBottom: 24 }}>
        <EffectivePreviewPane
          selectedUnit={previewUnitId}
          onChangeUnit={setPreviewUnitId}
        />
      </Column>

      {/* ── Sticky save bar (footer) ──────────────────────────────────── */}
      {dirty && (
        <Column lg={16} md={8} sm={4} style={{ paddingBottom: 24 }}>
          <Tile style={{
            background: 'var(--cds-layer-accent-01, #fff8e1)',
            borderLeft: '3px solid #f1c21b',
            padding: 12,
          }}>
            <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Warning size={16} style={{ color: '#c4920a' }} />
              <strong>You have unsaved changes</strong>
              <span style={{ fontSize: 12, color: 'var(--cds-text-secondary, #525252)' }}>
                Changes apply to new analyses only; in-flight analyses keep their snapshot (BR-V3CFG-001).
              </span>
              <span style={{ flex: 1 }} />
              <Button kind="ghost" size="md" renderIcon={Reset}>Reset</Button>
              <Button kind="primary" size="md" renderIcon={Save}>Save Configuration</Button>
            </Stack>
          </Tile>
        </Column>
      )}
    </Grid>
  );
}
