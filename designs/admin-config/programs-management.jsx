// Route (list):   /MasterListsPage/program           (preserves the existing live URL — singular "program")
// Route (editor): /MasterListsPage/program/<uuid>    (use /new for create)
// SideNav:    Admin → Test Management → Programs    (moved from main admin menu — IA fix)
// Breadcrumb (list):   Home / Admin Management / Test Management / Programs
// Breadcrumb (editor): Home / Admin Management / Test Management / Programs / Add/Edit Program
// Note: breadcrumb says "Admin Management" while SideNav says "Admin" — live-app label
// drift; preserved here per reference_admin_breadcrumb_label_quirk memory.
// Pattern source: OGC-748 (Test Catalog Basic Info — Domain radio group)
// Spec: programs-management-frs.md
//
// Two top-level components:
//   <ProgramsListPage />    — list view with Domain column + filter + post-upgrade banner
//   <ProgramEditorPage />   — Add/Edit Program editor (preserves existing dual-path Questionnaire)

import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  Breadcrumb, BreadcrumbItem,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent,
  TextInput, TextArea, Select, SelectItem, RadioButtonGroup, RadioButton,
  Checkbox, NumberInput, DatePicker, DatePickerInput,
  MultiSelect, Toggle, Tile,
  ContentSwitcher, Switch,
  OverflowMenu, OverflowMenuItem,
  Button, IconButton,
  InlineNotification, Tag, Modal,
} from '@carbon/react';
import { Add, Save, TrashCan, Renew, ChevronRight } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ============================================================================
// Domain reference data — matches OGC-748 (Tests) and revised OGC-361 (Lab Units)
// ============================================================================
const DOMAINS = [
  { value: 'CLINICAL',      label: 'Clinical',      tagKind: 'blue'   },
  { value: 'ENVIRONMENTAL', label: 'Environmental', tagKind: 'green'  },
  { value: 'VECTOR',        label: 'Vector',        tagKind: 'purple' },
];

// FHIR Questionnaire item.type — matches existing live page; preserve order
const QUESTION_TYPES = [
  'Boolean', 'Choice', 'Checkbox', 'Integer', 'Decimal',
  'Date', 'Time', 'String', 'Text', 'Quantity',
];

// Per-type example sentences shown live in each Question card (FR-16.5)
const TYPE_EXAMPLE_KEYS = {
  Boolean:  'admin.programs.guidance.type.example.boolean',
  Choice:   'admin.programs.guidance.type.example.choice',
  Checkbox: 'admin.programs.guidance.type.example.checkbox',
  Integer:  'admin.programs.guidance.type.example.integer',
  Decimal:  'admin.programs.guidance.type.example.decimal',
  Date:     'admin.programs.guidance.type.example.date',
  Time:     'admin.programs.guidance.type.example.time',
  String:   'admin.programs.guidance.type.example.string',
  Text:     'admin.programs.guidance.type.example.text',
  Quantity: 'admin.programs.guidance.type.example.quantity',
};
const TYPE_EXAMPLE_FALLBACKS = {
  Boolean:  'Use when the question has a yes/no answer. Example: "First antenatal visit?"',
  Choice:   'One option picked from a fixed list. Example: "Specimen condition" — Acceptable / Compromised / Rejected.',
  Checkbox: 'Multiple options can be selected. Example: "Symptoms present" — Fever, Cough, Headache, Fatigue.',
  Integer:  'Whole numbers only. Example: "Gestational age (weeks)" — 24.',
  Decimal:  'Numbers with decimal places. Example: "Maternal weight (kg)" — 62.4.',
  Date:     'Calendar date picker. Example: "Date of last menstrual period".',
  Time:     'Time-of-day picker. Example: "Time of sample collection".',
  String:   'Short free-text, single line. Example: "Provider name".',
  Text:     'Long-form free-text, multi-line. Example: "Clinical notes".',
  Quantity: 'Numeric value with a unit. Example: "Volume collected — 5 mL".',
};

const domainTag = (value) => {
  const d = DOMAINS.find(x => x.value === value);
  if (!d) return null;
  return <Tag kind={d.tagKind}>{t(`admin.programs.basicInfo.domain.option.${d.value.toLowerCase()}`, d.label)}</Tag>;
};

// ============================================================================
// Guidance components (FR-16)
// ============================================================================

// FR-16.1 — disclosable explainer below the Domain radio
function DomainExplainer() {
  const rows = [
    { label: 'Clinical',      key: 'admin.programs.guidance.domain.clinical',      fb: 'Patient-centered orders. Forms capture patient identifiers, provider, prior history. Shows in Clinical reception flows.' },
    { label: 'Environmental', key: 'admin.programs.guidance.domain.environmental', fb: 'Compliance & surveillance sampling (water, food, air). Forms capture sampling site, compliance standard, hold-time. No patient fields.' },
    { label: 'Vector',        key: 'admin.programs.guidance.domain.vector',        fb: 'Vector / specimen surveillance (mosquito, tick). Forms capture collection lot, species/taxonomy, pool manifest.' },
  ];
  return (
    <Tile style={{ marginTop: '0.5rem', padding: '0.75rem 1rem' }}>
      {rows.map(r => (
        <div key={r.label} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.4rem', alignItems: 'baseline' }}>
          <strong style={{ minWidth: '110px' }}>{r.label}</strong>
          <span style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>{t(r.key, r.fb)}</span>
        </div>
      ))}
    </Tile>
  );
}

// FR-16.2 — dismissible info banner at top of Questionnaire section
function QuestionnaireGuidanceBanner({ onDismiss }) {
  return (
    <InlineNotification
      kind="info"
      lowContrast
      title={t('admin.programs.guidance.questionnaire.banner.title',
        "How to add questions to this Program's order form")}
      subtitle={
        <span>
          <div style={{ marginTop: '0.25rem' }}>
            <strong>GUI builder</strong> (Edit JSON off) — {t('admin.programs.guidance.questionnaire.banner.body.gui.short', 'add questions one at a time. Best when starting from scratch or making small edits.')}
          </div>
          <div style={{ marginTop: '0.25rem' }}>
            <strong>JSON paste</strong> (Edit JSON on) — {t('admin.programs.guidance.questionnaire.banner.body.json.short', 'paste a complete FHIR Questionnaire from a partner deployment. Best when reusing an existing form.')}
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>
            {t('admin.programs.guidance.questionnaire.banner.body.roundTrip', 'Switch between modes at any time — your work round-trips through the same JSON.')}
          </div>
        </span>
      }
      onCloseButtonClick={onDismiss}
      style={{ marginBottom: '1rem' }}
    />
  );
}

// FR-16.3 — minimal reference card shown in JSON mode (LLM-friendly)
function JsonReferenceCard() {
  const types = ['boolean', 'choice', 'checkbox', 'integer', 'decimal', 'date', 'time', 'string', 'text', 'quantity'];
  return (
    <Tile style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--cds-layer-02)' }}>
      <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        <strong>{t('admin.programs.guidance.json.referenceCard.format', 'Format: FHIR R4 Questionnaire')}</strong>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.35rem' }}>
        {t('admin.programs.guidance.json.referenceCard.allowedTypes', 'Allowed item.type values:')}
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        {types.map(v => <Tag key={v} kind="cool-gray" size="sm">{v}</Tag>)}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
        {t('admin.programs.guidance.json.referenceCard.tip',
          'Paste a partner export, hand-write it, or ask an LLM to produce a FHIR R4 Questionnaire JSON using only the item.type values above.')}
      </div>
    </Tile>
  );
}

// FR-13.5 — live "Example" preview pane (right column of the Questionnaire section)
// Renders the Questionnaire as it will appear at order entry, in real time.
// In GUI mode: updates immediately on every change (text edits debounced upstream).
// In JSON mode: updates only after a successful Validate; shows "last validated" caption when JSON is dirty.
function QuestionnairePreviewPane({ questions, editJson, jsonDirty, title }) {
  const isStale = editJson && jsonDirty;
  return (
    <Tile style={{
      padding: '1rem',
      background: 'var(--cds-layer-02)',
      maxHeight: '600px',
      overflowY: 'auto',
      position: 'sticky',
      top: '1rem',
    }}>
      <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cds-text-secondary)' }}>
        {t('admin.programs.questionnaire.preview.label', 'Example')}
      </h5>
      <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-primary)', marginBottom: '0.75rem' }}>
        {title}
      </div>
      {isStale && (
        <InlineNotification kind="warning" lowContrast hideCloseButton
                            title={t('admin.programs.questionnaire.preview.stale.title', 'Stale preview')}
                            subtitle={t('admin.programs.questionnaire.preview.stale',
                              'Preview reflects last validated JSON. Validate to refresh.')}
                            style={{ marginBottom: '0.75rem' }} />
      )}
      {questions.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--cds-text-secondary)', fontSize: '0.8125rem' }}>
          {t('admin.programs.questionnaire.preview.empty',
            'No questions yet — start adding questions to see the preview.')}
        </div>
      ) : (
        <Stack gap={4}>
          {questions.map(q => (
            <PreviewQuestion key={q.uiId} q={q} />
          ))}
        </Stack>
      )}
    </Tile>
  );
}

// Renders a single question in the preview, using the correct Carbon control per Type — read-only.
function PreviewQuestion({ q }) {
  const label = q.text || '(untitled question)';
  const options = (q.answerOption || []).map(o => ({
    label: o.valueString || (o.valueCoding && (o.valueCoding.display || o.valueCoding.code)) || '',
    isCoded: !!o.valueCoding,
  })).filter(o => o.label);

  switch (q.type) {
    case 'Boolean':
      return (
        <RadioButtonGroup name={`preview-${q.uiId}`} legendText={label} disabled>
          <RadioButton id={`preview-${q.uiId}-y`} labelText="Yes" value="y" />
          <RadioButton id={`preview-${q.uiId}-n`} labelText="No" value="n" />
        </RadioButtonGroup>
      );
    case 'Choice':
      return (
        <Select id={`preview-${q.uiId}`} labelText={label} disabled defaultValue="">
          <SelectItem value="" text={options.length === 0 ? '(no options configured)' : 'Select an option'} />
          {options.map((o, i) => <SelectItem key={i} value={`opt-${i}`} text={o.label} />)}
        </Select>
      );
    case 'Checkbox':
      return (
        <fieldset className="cds--fieldset" disabled>
          <legend className="cds--label">{label}</legend>
          {options.length === 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>(no options configured)</p>
          )}
          {options.map((o, i) => (
            <Checkbox key={i} id={`preview-${q.uiId}-${i}`} labelText={o.label} disabled />
          ))}
        </fieldset>
      );
    case 'Integer':
      return <NumberInput id={`preview-${q.uiId}`} label={label} value={0} disabled allowEmpty />;
    case 'Decimal':
      return <NumberInput id={`preview-${q.uiId}`} label={label} step={0.1} value={0} disabled allowEmpty />;
    case 'Date':
      return (
        <DatePicker datePickerType="single" disabled>
          <DatePickerInput id={`preview-${q.uiId}`} labelText={label} placeholder="mm/dd/yyyy" disabled />
        </DatePicker>
      );
    case 'Time':
      return <TextInput id={`preview-${q.uiId}`} labelText={label} placeholder="hh:mm" disabled />;
    case 'String':
      return <TextInput id={`preview-${q.uiId}`} labelText={label} disabled />;
    case 'Text':
      return <TextArea id={`preview-${q.uiId}`} labelText={label} rows={3} disabled />;
    case 'Quantity':
      return (
        <Stack orientation="horizontal" gap={2}>
          <TextInput id={`preview-${q.uiId}-v`} labelText={label} placeholder="value" disabled />
          <TextInput id={`preview-${q.uiId}-u`} labelText="Unit" placeholder="unit" disabled />
        </Stack>
      );
    default:
      return <TextInput id={`preview-${q.uiId}`} labelText={label} disabled />;
  }
}

// FR-16.4 — empty state shown in GUI mode when no questions
function EmptyQuestionsState({ onAdd }) {
  return (
    <Tile style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '0.75rem', border: '1px dashed var(--cds-border-subtle)' }}>
      <h5 style={{ margin: '0 0 0.5rem 0' }}>
        {t('admin.programs.guidance.gui.emptyState.title', 'No questions yet')}
      </h5>
      <p style={{ margin: '0 0 1rem 0', color: 'var(--cds-text-secondary)' }}>
        {t('admin.programs.guidance.gui.emptyState.body',
          'Add questions one at a time below, or flip Edit JSON on to paste a complete Questionnaire from another deployment.')}
      </p>
      <Button kind="primary" size="sm" renderIcon={Add} onClick={onAdd}>
        {t('admin.programs.guidance.gui.emptyState.action', '+ Add First Question')}
      </Button>
    </Tile>
  );
}

// ============================================================================
// ProgramsListPage
// ============================================================================
export function ProgramsListPage({ programs, onOpenEditor, onNew }) {
  const [search, setSearch]               = useState('');
  const [domainFilter, setDomainFilter]   = useState([]);
  const [activeOnly, setActiveOnly]       = useState(true);
  const [showUpgradeBanner, setShowBanner] = useState(true);

  const filtered = useMemo(() => programs.filter(p => {
    if (activeOnly && !p.active) return false;
    if (domainFilter.length > 0 && !domainFilter.includes(p.domain)) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!p.name.toLowerCase().includes(s) && !p.code.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [programs, search, domainFilter, activeOnly]);

  return (
    <Grid fullWidth>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: '0.5rem' }}>
          <BreadcrumbItem href="#home">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="#admin">{t('breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem href="#test-mgmt">{t('breadcrumb.testManagement', 'Test Management')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('breadcrumb.admin.programs', 'Programs')}</BreadcrumbItem>
        </Breadcrumb>

        <h2 style={{ marginBottom: '0.25rem' }}>{t('admin.programs.title', 'Programs')}</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--cds-text-secondary)' }}>
          {t('admin.programs.subtitle', 'Manage clinical, environmental, and vector programs used at order entry, reporting, and indicator aggregation.')}
        </p>

        {showUpgradeBanner && (
          <InlineNotification
            kind="info"
            title={t('admin.programs.upgrade.banner.title', 'Programs upgraded')}
            subtitle={t('admin.programs.upgrade.banner.subtitle', 'All existing Programs defaulted to Clinical Domain. Review the list and re-classify Environmental or Vector programs as needed.')}
            onCloseButtonClick={() => setShowBanner(false)}
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Tile style={{ padding: '1rem', marginBottom: '1rem' }}>
          <Grid>
            <Column lg={6} md={4} sm={2}>
              <TextInput
                id="programs-search"
                labelText={t('admin.programs.list.search.label', 'Search Programs')}
                placeholder={t('admin.programs.list.search.placeholder', 'Search by name or code')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Column>
            <Column lg={6} md={4} sm={2}>
              <MultiSelect
                id="programs-domain-filter"
                titleText={t('admin.programs.list.filter.domain.label', 'Domain')}
                label={t('admin.programs.list.filter.domain.placeholder', 'Filter by Domain')}
                items={DOMAINS}
                itemToString={d => d ? d.label : ''}
                onChange={({ selectedItems }) => setDomainFilter(selectedItems.map(i => i.value))}
              />
            </Column>
            <Column lg={4} md={4} sm={2}>
              <Toggle
                id="programs-active-toggle"
                labelText={t('admin.programs.list.filter.active.label', 'Status')}
                labelA={t('admin.programs.list.filter.active.showAll', 'Show all')}
                labelB={t('admin.programs.list.filter.active.activeOnly', 'Active only')}
                toggled={activeOnly}
                onToggle={setActiveOnly}
              />
            </Column>
          </Grid>
        </Tile>

        <TableContainer title={t('admin.programs.list.title', 'Programs')}
          description={`${filtered.length} ${filtered.length === 1 ? 'program' : 'programs'} ${(domainFilter.length || search || !activeOnly) ? '(filtered)' : ''}`}
        >
          <TableToolbar>
            <TableToolbarContent>
              <Button renderIcon={Add} kind="primary" onClick={onNew}>
                {t('admin.programs.list.action.new', 'New Program')}
              </Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{t('admin.programs.list.column.code', 'Code')}</TableHeader>
                <TableHeader>{t('admin.programs.list.column.name', 'Name')}</TableHeader>
                <TableHeader>{t('admin.programs.list.column.domain', 'Domain')}</TableHeader>
                <TableHeader>{t('admin.programs.list.column.testSection', 'Test Section')}</TableHeader>
                <TableHeader>{t('admin.programs.list.column.status', 'Status')}</TableHeader>
                <TableHeader>{t('admin.programs.list.column.actions', '')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell><code>{p.code}</code></TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{domainTag(p.domain)}</TableCell>
                  <TableCell>{p.labUnit}</TableCell>
                  <TableCell>
                    {p.active
                      ? <Tag kind="teal">{t('admin.programs.list.status.active', 'Active')}</Tag>
                      : <Tag kind="gray">{t('admin.programs.list.status.inactive', 'Inactive')}</Tag>}
                  </TableCell>
                  <TableCell>
                    <Button kind="ghost" size="sm" renderIcon={ChevronRight}
                            onClick={() => onOpenEditor(p.id)}>
                      {t('button.edit', 'Edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Column>
    </Grid>
  );
}

// ============================================================================
// ProgramEditorPage — Add/Edit Program (matches live page layout)
// ============================================================================
export function ProgramEditorPage({ program, allPrograms, allLabUnits, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name:        program?.name        || '',
    code:        program?.code        || '',
    uuid:        program?.id          || '',
    labUnit:     program?.labUnit     || '',
    domain:      program?.domain      || '',
    active:      program?.active ?? true,
  });
  const [pendingDomainChange, setPendingDomainChange]   = useState(null);
  const [domainExplainerOpen, setDomainExplainerOpen]   = useState(false);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const requestDomainChange = (newDomain) => {
    if (!program || program.domain === newDomain) {
      update('domain', newDomain);
      return;
    }
    setPendingDomainChange({ from: program.domain, to: newDomain });
  };

  const confirmDomainChange = () => {
    update('domain', pendingDomainChange.to);
    setPendingDomainChange(null);
  };

  const canSubmit = form.name && form.code && form.domain && form.labUnit;

  return (
    <Grid fullWidth>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: '0.5rem' }}>
          <BreadcrumbItem href="#home">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="#admin">{t('breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem href="#test-mgmt">{t('breadcrumb.testManagement', 'Test Management')}</BreadcrumbItem>
          <BreadcrumbItem href="#programs">{t('breadcrumb.admin.programs', 'Programs')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('breadcrumb.admin.programs.editor', 'Add/Edit Program')}</BreadcrumbItem>
        </Breadcrumb>

        <h2 style={{ marginBottom: '1rem' }}>{t('admin.programs.editor.title', 'Add / Edit Program')}</h2>

        {/* Program selector — matches live page */}
        <Grid style={{ marginBottom: '1.5rem' }}>
          <Column lg={5} md={4} sm={2}>
            <Select id="program-picker"
                    labelText={t('admin.programs.editor.programPicker.label', 'Program')}
                    defaultValue={program?.id || 'new'}>
              <SelectItem value="new" text={t('admin.programs.editor.programPicker.new', 'New Program')} />
              {allPrograms.map(p => <SelectItem key={p.id} value={p.id} text={p.name} />)}
            </Select>
          </Column>
        </Grid>

        {/* Basic Info */}
        <h5 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.75rem' }}>
          {t('admin.programs.editor.basicInfo.title', 'Basic Info')}
        </h5>

        <Grid>
          <Column lg={8} md={4} sm={4}>
            <TextInput id="prog-name"
                       labelText={t('admin.programs.basicInfo.programName.label', 'Program Name')}
                       value={form.name} onChange={e => update('name', e.target.value)} />
          </Column>
          <Column lg={8} md={4} sm={4}>
            <TextInput id="prog-uuid"
                       labelText={t('admin.programs.basicInfo.uuid.label', 'UUID')}
                       value={form.uuid} readOnly />
          </Column>
          <Column lg={8} md={4} sm={4}>
            <TextInput id="prog-code"
                       labelText={t('admin.programs.basicInfo.code.label', 'Code')}
                       value={form.code} onChange={e => update('code', e.target.value)} />
          </Column>
          <Column lg={8} md={4} sm={4}>
            <Select id="prog-lab-unit"
                    labelText={t('admin.programs.basicInfo.testSection.label', 'Test Section (Lab Unit)')}
                    value={form.labUnit}
                    onChange={e => update('labUnit', e.target.value)}>
              <SelectItem value="" text={t('admin.programs.basicInfo.testSection.placeholder', 'Select a Lab Unit')} />
              {allLabUnits.map(lu => <SelectItem key={lu} value={lu} text={lu} />)}
            </Select>
          </Column>
        </Grid>

        {/* Domain (new) */}
        <div style={{ marginTop: '1.5rem' }}>
          <RadioButtonGroup
            name="program-domain"
            legendText={
              <span>
                {t('admin.programs.basicInfo.domain.label', 'Domain')}
                <span style={{ color: 'var(--cds-support-error)', marginLeft: '0.25rem' }}>*</span>
              </span>
            }
            valueSelected={form.domain}
            onChange={requestDomainChange}
            orientation="horizontal"
          >
            {DOMAINS.map(d => (
              <RadioButton key={d.value} id={`domain-${d.value}`} value={d.value}
                           labelText={t(`admin.programs.basicInfo.domain.option.${d.value.toLowerCase()}`, d.label)} />
            ))}
          </RadioButtonGroup>
          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {t('admin.programs.basicInfo.domain.helper',
              'Sets which orders this Program appears in at Reception. Catalog entries pick exactly one Domain.')}
            {' '}
            <Button kind="ghost" size="sm" onClick={() => setDomainExplainerOpen(v => !v)}
                    style={{ minHeight: 'auto', padding: '0 0.25rem' }}>
              {domainExplainerOpen
                ? t('admin.programs.guidance.domain.toggle.hide', 'Hide what each Domain means')
                : t('admin.programs.guidance.domain.toggle.show', 'What does each Domain mean?')}
            </Button>
          </p>
          {domainExplainerOpen && <DomainExplainer />}
        </div>

        {/* Status */}
        <div style={{ marginTop: '1.5rem' }}>
          <Toggle id="prog-active"
                  labelText={t('admin.programs.basicInfo.active.label', 'Status')}
                  labelA={t('admin.programs.basicInfo.active.inactive', 'Inactive')}
                  labelB={t('admin.programs.basicInfo.active.active', 'Active')}
                  toggled={form.active} onToggle={(v) => update('active', v)} />
        </div>

        {/* Questionnaire section — preserves existing dual-path */}
        <QuestionnaireSection programCode={form.code} />

        {/* Action bar */}
        <Stack orientation="horizontal" gap={3} style={{ marginTop: '2rem' }}>
          <Button kind="primary" renderIcon={Save} disabled={!canSubmit}
                  onClick={() => onSubmit(form)}>
            {t('button.submit', 'Submit')}
          </Button>
          <Button kind="ghost" onClick={onCancel}>
            {t('button.cancel', 'Cancel')}
          </Button>
        </Stack>

        {pendingDomainChange && (
          <Modal open
                 modalHeading={t('admin.programs.basicInfo.domain.change.modal.title', 'Change Program Domain?')}
                 primaryButtonText={t('admin.programs.basicInfo.domain.change.modal.confirm', 'Confirm change')}
                 secondaryButtonText={t('admin.programs.basicInfo.domain.change.modal.cancel', 'Cancel')}
                 onRequestSubmit={confirmDomainChange}
                 onRequestClose={() => setPendingDomainChange(null)}>
            <p>{t('admin.programs.basicInfo.domain.change.modal.body',
              "Historical orders associated with this Program were evaluated against the prior domain's rules. New orders will use the new domain's rules. This change is forward-looking and does not re-code past orders.")}</p>
            <p style={{ marginTop: '1rem' }}>
              <strong>{t('admin.programs.basicInfo.domain.change.modal.from', 'From:')}</strong>{' '}
              {domainTag(pendingDomainChange.from)}
              <strong style={{ marginLeft: '1rem' }}>{t('admin.programs.basicInfo.domain.change.modal.to', 'To:')}</strong>{' '}
              {domainTag(pendingDomainChange.to)}
            </p>
          </Modal>
        )}
      </Column>
    </Grid>
  );
}

// ============================================================================
// QuestionnaireSection — Edit JSON toggle ↔ Question card builder
// ============================================================================
function QuestionnaireSection({ programCode, guidanceDismissed = false }) {
  const [editJson, setEditJson] = useState(false);
  const [showGuidance, setShowGuidance] = useState(!guidanceDismissed);
  const [questionnaireId, setQuestionnaireId] = useState(programCode ? `${programCode}-questionnaire` : '');
  const [questions, setQuestions] = useState([
    { uiId: 'q-1', linkId: 'q1', text: 'New Field', type: 'String' },
  ]);
  const [jsonText, setJsonText] = useState('{"resourceType":"Questionnaire"}');
  const [jsonDirty, setJsonDirty] = useState(false);     // F-11: tracks unvalidated JSON edits
  const [lastValidJson, setLastValidJson] = useState('{"resourceType":"Questionnaire"}'); // F-11: revert target
  const [validation, setValidation] = useState(null);
  const [pendingModeSwitch, setPendingModeSwitch] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const dismissGuidance = () => {
    setShowGuidance(false);
    // Persist to user_preference table; key `admin.programs.questionnaire.guidance.dismissed`
    // (implementation: POST /api/me/preferences in real wiring)
  };

  const hasDraftQuestions = questions.some(q => q.draft);

  const requestToggle = () => {
    // Visual Builder no longer has a draft state (FR-14 auto-save).
    // Only JSON → Visual Builder needs the unsaved-JSON prompt (FR-12.1).
    if (editJson && jsonDirty) {
      setPendingModeSwitch('toGui-discardJson');
      return;
    }
    setEditJson(!editJson);
  };

  // ContentSwitcher gives us index 0 (Visual Builder) or 1 (JSON); translate to boolean.
  const requestToggleByIndex = (index) => {
    const wantJson = index === 1;
    if (wantJson === editJson) return; // no-op
    requestToggle();
  };

  const validateJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.resourceType !== 'Questionnaire') {
        setValidation({ ok: false, msg: t('admin.programs.questionnaire.json.invalid.resourceType',
          'resourceType must be "Questionnaire"') });
        return;
      }
      const n = (parsed.item || []).length;
      setValidation({ ok: true,
        msg: t('admin.programs.questionnaire.json.validated.count',
          `Validated — ${n} question${n === 1 ? '' : 's'} detected.`) });
      // F-11: validated successfully → snapshot for revert + clear dirty flag
      setLastValidJson(jsonText);
      setJsonDirty(false);
      // FR-12.1: hydrate GUI cards from parsed Questionnaire so ON→OFF round-trips.
      // STUB — real implementation maps parsed.item[] → questions[] preserving advanced
      // features (enableWhen, repeats, nested item[]) by attaching them to a card's
      // hidden `__fhir_passthrough__` slot that GUI mode renders as read-only "advanced".
    } catch (err) {
      setValidation({ ok: false, msg: `${t('admin.programs.questionnaire.json.invalid', 'Invalid JSON')}: ${err.message}` });
    }
  };

  // FR-14: cards auto-commit to in-memory state on every change. No draft flag.
  const updateQuestion = (i, next) =>
    setQuestions(prev => prev.map((q, idx) => idx === i ? next : q));
  const requestDeleteQuestion = (i) => setPendingDelete(i);
  const confirmDelete = () => {
    setQuestions(prev => prev.filter((_, idx) => idx !== pendingDelete));
    setPendingDelete(null);
  };
  // FR-14: use timestamp-based linkId so delete + add never produces duplicates (fixes F-19 from critique).
  const addQuestion = () => setQuestions(prev => [
    ...prev,
    { uiId: `q-${Date.now()}`, linkId: `q-${Date.now()}`, text: 'New Field', type: 'String' },
  ]);

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--cds-border-subtle)' }}>
      <Stack orientation="horizontal" gap={5} style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0 }}>{t('admin.programs.questionnaire.section.title', 'Questionnaire')}</h4>
        <ContentSwitcher
          aria-label={t('admin.programs.questionnaire.mode.switcher.aria', 'Questionnaire authoring mode')}
          selectedIndex={editJson ? 1 : 0}
          onChange={({ index }) => requestToggleByIndex(index)}
          size="md"
        >
          <Switch name="visual" text={t('admin.programs.questionnaire.mode.visualBuilder', 'Visual Builder')} />
          <Switch name="json"   text={t('admin.programs.questionnaire.mode.json', 'JSON')} />
        </ContentSwitcher>
      </Stack>

      {showGuidance && <QuestionnaireGuidanceBanner onDismiss={dismissGuidance} />}

      <Grid>
        {/* Left column — editor (JSON or GUI) */}
        <Column lg={10} md={4} sm={4}>
          {editJson ? (
            <Stack gap={4}>
              <TextArea id="json-text"
                        labelText={t('admin.programs.questionnaire.json.label', 'FHIR Questionnaire JSON')}
                        placeholder={t('admin.programs.questionnaire.json.placeholder', 'Paste FHIR Questionnaire JSON here')}
                        value={jsonText}
                        onChange={e => { setJsonText(e.target.value); setValidation(null); setJsonDirty(true); }}
                        rows={12}
                        style={{ fontFamily: 'monospace' }} />
              <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
                <Button kind="tertiary" size="sm" renderIcon={Renew} onClick={validateJson}>
                  {t('admin.programs.questionnaire.json.validate', 'Validate JSON')}
                </Button>
                {validation && (
                  <InlineNotification
                    kind={validation.ok ? 'success' : 'error'}
                    title={validation.ok
                      ? t('admin.programs.questionnaire.json.validated', 'Valid')
                      : t('admin.programs.questionnaire.json.invalid', 'Invalid')}
                    subtitle={validation.msg}
                    hideCloseButton
                    lowContrast
                  />
                )}
              </Stack>
              <JsonReferenceCard />
            </Stack>
          ) : (
            <Stack gap={5}>
              <TextInput id="questionnaire-id"
                         labelText={t('admin.programs.questionnaire.id.label', 'Questionnaire id')}
                         helperText={t('admin.programs.questionnaire.id.helper', 'Identifier referenced by FHIR exports and downstream order resources.')}
                         value={questionnaireId}
                         onChange={e => setQuestionnaireId(e.target.value)} />

              <div>
                <h5 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.5rem' }}>
                  {t('admin.programs.questionnaire.questions.section.title', 'Questions')} ({questions.length})
                </h5>

                {questions.length === 0 ? (
                  <EmptyQuestionsState onAdd={addQuestion} />
                ) : (
                  <>
                    {questions.map((q, i) => (
                      <QuestionCard key={q.uiId} q={q}
                                    onChange={(next) => updateQuestion(i, next)}
                                    onDelete={() => requestDeleteQuestion(i)} />
                    ))}

                    <Button kind="primary" size="sm" renderIcon={Add} onClick={addQuestion}>
                      {t('admin.programs.questionnaire.question.addNew', 'Add New Question')}
                    </Button>
                  </>
                )}
              </div>
            </Stack>
          )}
        </Column>

        {/* Right column — live "Example" preview pane (FR-13.5) */}
        <Column lg={6} md={4} sm={4}>
          <QuestionnairePreviewPane
            questions={questions}
            editJson={editJson}
            jsonDirty={jsonDirty}
            title={questionnaireId || t('admin.programs.questionnaire.preview.untitledQuestionnaire', 'Untitled Questionnaire')}
          />
        </Column>
      </Grid>

      {/* F-11: JSON → Visual Builder unsaved-JSON prompt.
          (The reverse direction no longer needs a prompt — Visual Builder auto-saves on blur, FR-14.) */}
      {pendingModeSwitch === 'toGui-discardJson' && (
        <Modal open
               modalHeading={t('admin.programs.questionnaire.modeSwitch.unsavedJson.title', 'Unvalidated JSON changes')}
               primaryButtonText={t('admin.programs.questionnaire.modeSwitch.discard', 'Discard and switch')}
               secondaryButtonText={t('button.cancel', 'Cancel')}
               danger
               onRequestSubmit={() => {
                 setJsonText(lastValidJson);
                 setJsonDirty(false);
                 setValidation(null);
                 setEditJson(false);
                 setPendingModeSwitch(null);
               }}
               onRequestClose={() => setPendingModeSwitch(null)}>
          <p>{t('admin.programs.questionnaire.modeSwitch.unsavedJson.body',
            'The JSON has been edited since the last successful validation. Validate first (and the GUI will hydrate from the validated state), or discard your edits and switch back to the previously-saved Questionnaire.')}</p>
        </Modal>
      )}

      {pendingDelete !== null && (
        <Modal open
               modalHeading={t('admin.programs.questionnaire.question.delete.title', 'Delete this question?')}
               primaryButtonText={t('admin.programs.questionnaire.question.delete.confirm', 'Delete')}
               secondaryButtonText={t('button.cancel', 'Cancel')}
               danger
               onRequestSubmit={confirmDelete}
               onRequestClose={() => setPendingDelete(null)}>
          <p>{t('admin.programs.questionnaire.question.delete.body',
            `Remove "${questions[pendingDelete].text}" from the Questionnaire?`)}</p>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// QuestionCard — single repeating question element
// No per-card Save (auto-commits to in-memory state on blur per FR-14).
// Destructive actions live in the OverflowMenu (⋮) top-right.
// Choice/Checkbox types reveal an Answer options sub-section (FR-14.1).
// ============================================================================
const HAS_OPTIONS = (type) => type === 'Choice' || type === 'Checkbox';

function QuestionCard({ q, onChange, onDelete }) {
  const updateOption = (idx, value) => {
    const next = [...(q.answerOption || [])];
    next[idx] = { ...next[idx], valueString: value };
    onChange({ ...q, answerOption: next });
  };
  const addOption = () => {
    const next = [...(q.answerOption || []), { valueString: '' }];
    onChange({ ...q, answerOption: next });
  };
  const removeOption = (idx) => {
    const next = (q.answerOption || []).filter((_, i) => i !== idx);
    onChange({ ...q, answerOption: next });
  };

  return (
    <Tile style={{
      borderLeft: '4px solid var(--cds-link-primary)',
      background: 'var(--cds-layer)',
      padding: '1rem',
      marginBottom: '0.75rem',
      position: 'relative',
    }}>
      {/* Overflow menu in top-right corner */}
      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
        <OverflowMenu aria-label={t('admin.programs.questionnaire.question.actions.menu.aria', 'Question actions')}
                      size="sm" flipped>
          <OverflowMenuItem
            isDelete
            itemText={t('admin.programs.questionnaire.question.actions.delete', 'Delete question')}
            onClick={onDelete}
          />
        </OverflowMenu>
      </div>

      <Grid>
        <Column lg={10} md={4} sm={4}>
          <TextInput id={`q-text-${q.uiId}`}
                     labelText={t('admin.programs.questionnaire.question.text.label', 'Question Text')}
                     value={q.text}
                     onChange={e => onChange({ ...q, text: e.target.value })} />
        </Column>
        <Column lg={5} md={4} sm={4}>
          <Select id={`q-type-${q.uiId}`}
                  labelText={t('admin.programs.questionnaire.question.type.label', 'Question Type')}
                  value={q.type}
                  onChange={e => onChange({ ...q, type: e.target.value })}>
            {QUESTION_TYPES.map(qt => (
              <SelectItem key={qt} value={qt}
                          text={t(`admin.programs.questionnaire.question.type.${qt.toLowerCase()}`, qt)} />
            ))}
          </Select>
        </Column>
      </Grid>

      {/* FR-16.5 — live per-type example sentence (per-question hint while editing).
          Whole-form rendered preview is shown to the right via QuestionnairePreviewPane (FR-13.5). */}
      <div style={{
        marginTop: '0.5rem',
        padding: '0.4rem 0.65rem',
        borderLeft: '3px solid var(--cds-link-primary)',
        background: 'var(--cds-layer-02)',
        fontSize: '0.8125rem',
      }}>
        <strong style={{ marginRight: '0.5rem' }}>{q.type}:</strong>
        <span>{t(TYPE_EXAMPLE_KEYS[q.type], TYPE_EXAMPLE_FALLBACKS[q.type])}</span>
      </div>

      {/* FR-14.1 — Answer options sub-section for Choice / Checkbox */}
      {HAS_OPTIONS(q.type) && (
        <AnswerOptionsEditor
          options={q.answerOption || []}
          onUpdate={updateOption}
          onAdd={addOption}
          onRemove={removeOption}
        />
      )}
    </Tile>
  );
}

// FR-14.1 — Answer options editor for Choice / Checkbox types
function AnswerOptionsEditor({ options, onUpdate, onAdd, onRemove }) {
  return (
    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--cds-border-subtle)' }}>
      <h6 style={{
        margin: '0 0 0.5rem 0',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--cds-text-secondary)',
      }}>
        {t('admin.programs.questionnaire.answerOptions.section.title', 'Answer options')}
      </h6>

      {options.length === 0 && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', margin: '0 0 0.5rem 0' }}>
          {t('admin.programs.questionnaire.answerOptions.empty',
            'No options yet — add at least one so reception can pick a value.')}
        </p>
      )}

      {options.map((opt, idx) => {
        const isCoded = !!opt.valueCoding;
        return (
          <Stack key={idx} orientation="horizontal" gap={2} style={{ alignItems: 'center', marginBottom: '0.4rem' }}>
            {isCoded ? (
              <>
                <span style={{ flex: 1, fontSize: '0.875rem', padding: '0.4rem 0.75rem', background: 'var(--cds-layer-02)', borderBottom: '1px solid var(--cds-border-subtle)' }}>
                  {opt.valueCoding.display || opt.valueCoding.code}
                </span>
                <Tag kind="cool-gray" size="sm">{t('admin.programs.questionnaire.answerOptions.codedBadge', '(coded)')}</Tag>
              </>
            ) : (
              <TextInput id={`opt-${idx}`}
                         labelText=""
                         hideLabel
                         size="sm"
                         value={opt.valueString || ''}
                         placeholder={t('admin.programs.questionnaire.answerOptions.option.label', 'Option')}
                         onChange={(e) => onUpdate(idx, e.target.value)}
                         style={{ flex: 1 }} />
            )}
            <IconButton kind="ghost" size="sm"
                        label={t('admin.programs.questionnaire.answerOptions.option.delete.aria', 'Delete this option')}
                        onClick={() => onRemove(idx)}>
              <TrashCan />
            </IconButton>
          </Stack>
        );
      })}

      <Button kind="ghost" size="sm" renderIcon={Add} onClick={onAdd}>
        {t('admin.programs.questionnaire.answerOptions.addOption', '+ Add option')}
      </Button>
    </div>
  );
}

// ============================================================================
// Default export — page router (simplified)
// ============================================================================
export default function ProgramsManagement({ initialView = 'list', initialProgramId = null, programs = [], labUnits = [] }) {
  const [view, setView]             = useState(initialView);
  const [editingId, setEditingId]   = useState(initialProgramId);
  const editingProgram              = programs.find(p => p.id === editingId);

  if (view === 'editor') {
    return (
      <ProgramEditorPage
        program={editingProgram}
        allPrograms={programs}
        allLabUnits={labUnits}
        onSubmit={(form) => { /* persist via REST */ setView('list'); }}
        onCancel={() => setView('list')}
      />
    );
  }
  return (
    <ProgramsListPage
      programs={programs}
      onOpenEditor={(id) => { setEditingId(id); setView('editor'); }}
      onNew={() => { setEditingId(null); setView('editor'); }}
    />
  );
}
