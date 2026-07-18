// Route: /MasterListsPage/program   (edit + add happen INLINE on this list — no separate editor page)
// SideNav: Admin → Test Management → Programs
// FRS: programs-management-frs-consolidated.md  (this is the v2 consolidated ref set)
// Reference set (one coherent handoff for Claude Code):
//   - programs-management-frs-consolidated.md   (spec)
//   - programs-management-v2-mockup.jsx          (this file)
//   - programs-management-v2-preview.html        (interactive preview)
//
// Version-agnostic (dev slices from the Epic, D-028). Four pillars:
//   Domain classification · Test Management IA · inline editor (ContentSwitcher + live preview) ·
//   Deactivate/Reactivate lifecycle (no hard delete, D-002).
//
// BAKED-IN (OGC-781 unified with the Additional Information work — FRS FR-21..FR-27):
//   The Questionnaire editor here is ONE builder used in THREE attachment modes — Program (selected
//   per order), Order-baseline (always on every order), Patient-baseline (always on the patient).
//   This mockup shows the Program mode; the baseline modes reuse the SAME editor component (do not
//   build a second one). Admin-authored fields → QuestionnaireResponse (FHIR free). Pre-existing
//   structured fields (address→Patient.address; Education/Marital Status/Nationality/Occupation/Notes)
//   are configured (show/hide/label), not re-authored. JSON mode = paste/edit (no upload).
//   Placement (verified live, indonesiademo v3.2.1.10): the Additional Order Details region + Program
//   render on Order-Entry Step 1 for all three domains, extending the existing Step-1 details section —
//   Clinical → "Clinical Information" (Provisional Diagnosis, Payment Status); Env → env details;
//   Vector → Sample. Patient region = the /PatientManagement Additional Information block.
//   See programs-management-v2-preview.html "Baked-in" section for the visual.
// UI decisions folded in from review (2026-07-01):
//   - Edit + Add are INLINE (row expansion / top panel), not a separate page/tab (D-005).
//   - Code and UUID are system-managed and NOT surfaced in the UI.
//   - "Lab unit(s)" is a multi-select with Select-all (a program can serve several units).
//   - Heavy on-screen guidance for an IT admin (intro, per-field helpers, domain explainer).
//   - Quantity: unit comes from a FHIR unit/unitOption extension (JSON-only, not the Visual Builder).

import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableExpandHeader, TableExpandRow, TableExpandedRow,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  RadioButtonGroup, RadioButton, Select, SelectItem, TextInput, TextArea, MultiSelect,
  FilterableMultiSelect, Toggle, ContentSwitcher, Switch, Button, IconButton, Tag, Modal,
  InlineNotification, Tile, Breadcrumb, BreadcrumbItem, OverflowMenu, OverflowMenuItem,
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;
const DOMAIN_TAG = { CLINICAL: 'blue', ENVIRONMENTAL: 'green', VECTOR: 'purple' };
const domainLabel = (d) => ({ CLINICAL: 'Clinical', ENVIRONMENTAL: 'Environmental', VECTOR: 'Vector' }[d]);
const LAB_UNITS = ['Serology', 'Microbiology', 'Hematology', 'Chemistry', 'Entomology', 'Environmental Lab'];
const QUESTION_TYPES = ['boolean','choice','checkbox','integer','decimal','date','time','string','text','quantity'];
const TYPE_EXAMPLE = {
  boolean: 'Yes/no answer. Example: "First antenatal visit?"',
  choice: 'One option from a fixed list. Example: "Specimen condition".',
  checkbox: 'Multiple options can be selected. Example: "Symptoms present".',
  integer: 'Whole numbers only. Example: "Gestational age (weeks)".',
  decimal: 'Numbers with decimals. Example: "Maternal weight (kg)".',
  date: 'Calendar date. Example: "Date of last menstrual period".',
  time: 'Time of day. Example: "Time of sample collection".',
  string: 'Short free-text. Example: "Provider name".',
  text: 'Long free-text. Example: "Clinical notes".',
  // Quantity's unit is defined by a FHIR unit/unitOption extension, editable only in JSON mode:
  quantity: 'A number plus a unit (e.g. "Volume collected — 5 mL"). The allowed unit(s) come from a FHIR extension set in JSON mode; a GUI-only Quantity accepts any unit.',
};

const SEED = [
  { id: 1, name: 'HIV Treatment Cohort', code: 'HIV-TX-01', domain: 'CLINICAL', units: ['Serology'], active: true, orders: 1247 },
  { id: 2, name: 'TB DOTS Surveillance', code: 'TB-DOTS-02', domain: 'CLINICAL', units: ['Microbiology'], active: true, orders: 842 },
  { id: 3, name: 'Water Quality — Lake Toba', code: 'ENV-WQ-11', domain: 'ENVIRONMENTAL', units: ['Environmental Lab'], active: true, orders: 311 },
  { id: 4, name: 'Dengue Sentinel — Jakarta', code: 'VEC-DEN-04', domain: 'VECTOR', units: ['Entomology'], active: true, orders: 196 },
  { id: 5, name: 'HBV Antenatal Screening', code: 'HBV-ANC-01', domain: 'CLINICAL', units: ['Serology', 'Chemistry'], active: true, orders: 520 },
  { id: 6, name: 'Malaria Pilot (2024) — closed', code: 'VEC-MAL-99', domain: 'VECTOR', units: ['Entomology'], active: false, orders: 74 },
];

export default function ProgramsManagement() {
  const [rows, setRows] = useState(SEED);
  const [query, setQuery] = useState('');
  const [domains, setDomains] = useState([]);
  const [showDeactivated, setShowDeactivated] = useState(false);   // FR-19: hide deactivated by default
  const [expandedId, setExpandedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [notice, setNotice] = useState(null);

  const visible = useMemo(() => rows.filter((r) =>
    (showDeactivated || r.active) &&
    (domains.length === 0 || domains.includes(r.domain)) &&
    r.name.toLowerCase().includes(query.toLowerCase())
  ), [rows, showDeactivated, domains, query]);

  const deactivate = () => { setRows((rs) => rs.map((r) => (r.id === confirm.id ? { ...r, active: false } : r))); setNotice(`"${confirm.name}" deactivated — historical orders preserved`); setConfirm(null); setExpandedId(null); };
  const reactivate = (r) => { setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, active: true } : x))); setNotice(`${r.name} reactivated`); };

  return (
    <Grid fullWidth>
      <Column lg={16}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: '1rem' }}>
          <BreadcrumbItem href="#">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('breadcrumb.testManagement', 'Test Management')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('breadcrumb.admin.programs', 'Programs')}</BreadcrumbItem>
        </Breadcrumb>
        <h3>{t('admin.programs.title', 'Programs')}</h3>
        <p style={{ color: 'var(--cds-text-secondary)' }}>The initiatives that orders are filed under — each with a domain, one or more lab units, and an optional order-entry questionnaire.</p>

        {/* At-a-glance guidance for the admin (FR-16) */}
        <InlineNotification kind="info" lowContrast hideCloseButton title={t('admin.programs.guidance.page.title', 'How this page works')}
          subtitle="Each row is a Program. Click Edit to configure it inline (no separate page). The ⋮ menu deactivates a program (stops it appearing for new orders but keeps its history) or reactivates it. Deactivated programs are hidden by default — flip Show deactivated to see them. Add Program opens an inline editor at the top." />

        {notice && <InlineNotification kind="success" lowContrast title={notice} onCloseButtonClick={() => setNotice(null)} />}

        <TableContainer title="" description="">
          <TableToolbar>
            <TableToolbarContent>
              <TableToolbarSearch persistent placeholder={t('admin.programs.search', 'Search by name')} onChange={(e) => setQuery(e.target.value)} />
              <div style={{ minWidth: 220 }}>
                <MultiSelect id="domain-filter" label={t('admin.programs.list.filter.domain.label', 'Domain')} size="lg"
                  items={['CLINICAL', 'ENVIRONMENTAL', 'VECTOR']} itemToString={domainLabel}
                  onChange={({ selectedItems }) => setDomains(selectedItems)} />
              </div>
              <Toggle id="show-deactivated" size="sm" labelText="" labelA={t('admin.programs.list.toggle.showDeactivated', 'Show deactivated')}
                labelB={t('admin.programs.list.toggle.showDeactivated', 'Show deactivated')} toggled={showDeactivated} onToggle={setShowDeactivated} />
              <Button renderIcon={Add} onClick={() => { setAdding((a) => !a); setExpandedId(null); }}>{adding ? t('button.close', 'Close') : t('admin.programs.add', 'Add Program')}</Button>
            </TableToolbarContent>
          </TableToolbar>

          {/* Inline "Add new" editor at the top */}
          {adding && (
            <Tile style={{ borderLeft: '3px solid var(--cds-interactive)', margin: '0 0 4px' }}>
              <h4>{t('admin.programs.selector.new', 'New Program')}</h4>
              <ProgramEditor isNew onClose={() => setAdding(false)} />
            </Tile>
          )}

          <Table>
            <TableHead><TableRow>
              <TableExpandHeader />
              <TableHeader>{t('admin.programs.list.column.name', 'Name')}</TableHeader>
              <TableHeader>{t('admin.programs.list.column.domain', 'Domain')}</TableHeader>
              <TableHeader>{t('admin.programs.list.column.active', 'Status')}</TableHeader>
              <TableHeader>{t('admin.programs.list.column.units', 'Lab unit(s)')}</TableHeader>
              <TableHeader />
            </TableRow></TableHead>
            <TableBody>
              {visible.map((r) => (
                <React.Fragment key={r.id}>
                  <TableExpandRow isExpanded={expandedId === r.id} onExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    ariaLabel="Edit program" style={r.active ? undefined : { color: 'var(--cds-text-disabled)' }}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell><Tag type={DOMAIN_TAG[r.domain]}>{domainLabel(r.domain)}</Tag></TableCell>
                    <TableCell>{r.active ? <Tag type="green">{t('admin.programs.list.status.active', 'Active')}</Tag> : <Tag type="gray">{t('admin.programs.list.status.inactive', 'Inactive')}</Tag>}</TableCell>
                    <TableCell>{r.units.join(', ')}</TableCell>
                    <TableCell>
                      <OverflowMenu aria-label="Program actions" flipped>
                        {r.active
                          ? <OverflowMenuItem isDelete itemText={t('admin.programs.action.deactivate', 'Deactivate')} onClick={() => setConfirm(r)} />
                          : <OverflowMenuItem itemText={t('admin.programs.action.reactivate', 'Reactivate')} onClick={() => reactivate(r)} />}
                      </OverflowMenu>
                    </TableCell>
                  </TableExpandRow>
                  {expandedId === r.id && (
                    <TableExpandedRow colSpan={6}>
                      <ProgramEditor row={r} onClose={() => setExpandedId(null)} onDeactivate={() => setConfirm(r)} onReactivate={() => reactivate(r)} />
                    </TableExpandedRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {confirm && (
          <Modal open danger modalHeading={t('admin.programs.deactivate.modal.title', 'Deactivate this Program?')}
            primaryButtonText={t('admin.programs.deactivate.modal.confirm', 'Deactivate')} secondaryButtonText={t('admin.programs.deactivate.modal.cancel', 'Cancel')}
            onRequestClose={() => setConfirm(null)} onRequestSubmit={deactivate}>
            <p>"{confirm.name}" will stop appearing in the order-entry Program picker for new orders. Its {confirm.orders.toLocaleString()} historical order(s) keep their program coding and all indicator counts are preserved. You can reactivate it at any time from the Programs list.</p>
          </Modal>
        )}
      </Column>
    </Grid>
  );
}

// Inline editor — identical whether adding or editing. Code/UUID are system-managed (not shown).
function ProgramEditor({ row, isNew, onClose, onDeactivate, onReactivate }) {
  const [domain, setDomain] = useState(row ? row.domain : '');
  const [units, setUnits] = useState(row ? row.units : []);
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const [mode, setMode] = useState(0); // 0 Visual, 1 JSON
  const [questions, setQuestions] = useState(isNew ? [] : [
    { id: 1, text: 'First antenatal visit?', type: 'boolean', options: [] },
    { id: 2, text: 'Specimen condition', type: 'choice', options: ['Acceptable', 'Compromised', 'Rejected'] },
  ]);
  const setQ = (id, patch) => setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const active = row ? row.active : true;

  return (
    <Stack gap={5} style={{ padding: '0.5rem 0' }}>
      <InlineNotification kind="info" lowContrast hideCloseButton title={t('admin.programs.guidance.editor.title', "What you're setting up")}
        subtitle="A Program is an initiative orders are filed under. 1) name it, 2) pick its Domain (controls where reception sees it), 3) assign the Lab unit(s) that run its work, 4) optionally build the order-entry questionnaire reception fills in for this program." />

      {/* Basic Info — no Code/UUID */}
      <Tile>
        <Grid>
          <Column lg={8}>
            <TextInput id={`pname-${row ? row.id : 'new'}`} labelText={t('admin.programs.basicInfo.programName.label', 'Program Name')}
              defaultValue={row ? row.name : ''} placeholder={isNew ? 'e.g. HBV Antenatal Screening' : undefined}
              helperText={t('admin.programs.basicInfo.programName.helper', 'The name reception staff see when picking a program at order entry.')} />
          </Column>
          <Column lg={8}>
            {/* Lab unit(s): multi-select with Select-all (FR: a program may serve several units) */}
            <FilterableMultiSelect id={`units-${row ? row.id : 'new'}`} titleText={t('admin.programs.basicInfo.labUnits.label', 'Lab unit(s)')}
              helperText={t('admin.programs.basicInfo.labUnits.helper', 'One or more lab sections that run this program — pick all that apply, or Select all.')}
              items={LAB_UNITS} initialSelectedItems={units} selectionFeedback="top-after-reopen"
              onChange={({ selectedItems }) => setUnits(selectedItems)} />
            {/* Select-all affordance provided by the "Select all" item convention in the app build. */}
          </Column>
        </Grid>

        <div style={{ marginTop: '1rem' }}>
          <RadioButtonGroup legendText={t('admin.programs.basicInfo.domain.label', 'Domain')} name={`domain-${row ? row.id : 'new'}`} valueSelected={domain} onChange={setDomain} orientation="vertical">
            <RadioButton labelText="Clinical" value="CLINICAL" id={`dc-${row ? row.id : 'new'}`} />
            <RadioButton labelText="Environmental" value="ENVIRONMENTAL" id={`de-${row ? row.id : 'new'}`} />
            <RadioButton labelText="Vector" value="VECTOR" id={`dv-${row ? row.id : 'new'}`} />
          </RadioButtonGroup>
          <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>Controls where this program appears — reception only sees programs matching the order's domain.</p>
          {!domain && <p style={{ color: 'var(--cds-text-error)', fontSize: 12 }}>{t('admin.programs.basicInfo.domain.required', 'Domain is required')}</p>}
          <Button kind="ghost" size="sm" onClick={() => setShowDomainHelp((v) => !v)}>{showDomainHelp ? t('admin.programs.guidance.domain.toggle.hide', 'Hide') : t('admin.programs.guidance.domain.toggle.show', 'What does each Domain mean?')}</Button>
          {showDomainHelp && (
            <Tile style={{ background: 'var(--cds-layer-02)', marginTop: 6 }}>
              <p><Tag type="blue">Clinical</Tag> Patient testing — form captures patient identifiers, provider, prior history.</p>
              <p><Tag type="green">Environmental</Tag> Compliance/surveillance sampling (water, food, air) — sampling site, standard, hold-time. No patient fields.</p>
              <p><Tag type="purple">Vector</Tag> Specimen surveillance (mosquito, tick) — collection lot, species/taxonomy, pool manifest.</p>
            </Tile>
          )}
        </div>

        {!isNew && (
          <Stack orientation="horizontal" gap={4} style={{ marginTop: '1rem', alignItems: 'center' }}>
            <span>Status: {active ? <Tag type="green">Active</Tag> : <Tag type="gray">Inactive</Tag>}</span>
            {active
              ? <Button kind="danger--tertiary" size="sm" onClick={onDeactivate}>{t('admin.programs.action.deactivate', 'Deactivate')}</Button>
              : <Button kind="ghost" size="sm" onClick={onReactivate}>{t('admin.programs.action.reactivate', 'Reactivate')}</Button>}
            <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>No hard delete — deactivate preserves history (D-002).</span>
          </Stack>
        )}
      </Tile>

      {/* Questionnaire */}
      <InlineNotification kind="info" lowContrast hideCloseButton title={t('admin.programs.guidance.questionnaire.banner.title', "How to add questions to this Program's order form")}
        subtitle="Visual Builder — add questions one at a time. JSON — paste a complete FHIR Questionnaire. Your work round-trips through the same JSON." />
      <ContentSwitcher selectedIndex={mode} onChange={({ index }) => setMode(index)}>
        <Switch name="visual" text={t('admin.programs.questionnaire.mode.visualBuilder', 'Visual Builder')} />
        <Switch name="json" text={t('admin.programs.questionnaire.mode.json', 'JSON')} />
      </ContentSwitcher>

      <Grid>
        <Column lg={9}>
          {mode === 0 ? (
            <Stack gap={3}>
              {questions.map((q) => (
                <Tile key={q.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <TextInput id={`qt-${q.id}`} labelText={t('admin.programs.questionnaire.question.text.label', 'Question Text')} value={q.text} onChange={(e) => setQ(q.id, { text: e.target.value })} />
                    <OverflowMenu aria-label="Question actions"><OverflowMenuItem isDelete itemText={t('admin.programs.questionnaire.question.actions.delete', 'Delete question')} onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))} /></OverflowMenu>
                  </div>
                  <Select id={`qty-${q.id}`} labelText={t('admin.programs.questionnaire.question.type.label', 'Question Type')} value={q.type} onChange={(e) => setQ(q.id, { type: e.target.value })}>
                    {QUESTION_TYPES.map((ty) => <SelectItem key={ty} value={ty} text={ty[0].toUpperCase() + ty.slice(1)} />)}
                  </Select>
                  <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginTop: 4 }}>{TYPE_EXAMPLE[q.type]}</p>
                  {(q.type === 'choice' || q.type === 'checkbox') && (
                    <Stack gap={2} style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 12, textTransform: 'uppercase' }}>{t('admin.programs.questionnaire.answerOptions.section.title', 'Answer options')}</span>
                      {q.options.map((o, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8 }}>
                          <TextInput id={`opt-${q.id}-${i}`} size="sm" labelText="" value={o} onChange={(e) => { const n = [...q.options]; n[i] = e.target.value; setQ(q.id, { options: n }); }} />
                          <IconButton kind="ghost" size="sm" label="Delete option" onClick={() => setQ(q.id, { options: q.options.filter((_, j) => j !== i) })}><TrashCan /></IconButton>
                        </div>
                      ))}
                      {q.options.length === 0 && <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{t('admin.programs.questionnaire.answerOptions.empty', 'No options yet — add at least one so reception can pick a value.')}</p>}
                      <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setQ(q.id, { options: [...q.options, 'New option'] })}>{t('admin.programs.questionnaire.answerOptions.addOption', '+ Add option')}</Button>
                    </Stack>
                  )}
                </Tile>
              ))}
              {questions.length === 0 && <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{t('admin.programs.guidance.gui.emptyState.body', 'No questions yet — add questions one at a time, or paste a Questionnaire in JSON mode.')}</p>}
              <Button kind="ghost" renderIcon={Add} onClick={() => setQuestions((qs) => [...qs, { id: Date.now(), text: 'New Field', type: 'string', options: [] }])}>{questions.length === 0 ? t('admin.programs.guidance.gui.emptyState.action', '+ Add First Question') : t('admin.programs.questionnaire.question.addNew', 'Add New Question')}</Button>
            </Stack>
          ) : (
            <Stack gap={3}>
              <TextArea id={`json-${row ? row.id : 'new'}`} labelText={t('admin.programs.questionnaire.mode.json', 'JSON')} rows={8} defaultValue={'{ "resourceType": "Questionnaire", "item": [] }'} />
              <Button kind="tertiary" size="sm">{t('admin.programs.questionnaire.json.validate', 'Validate JSON')}</Button>
              <Tile><p style={{ fontSize: 12 }}>{t('admin.programs.guidance.json.referenceCard.format', 'Format: FHIR R4 Questionnaire')} — allowed item.type: {QUESTION_TYPES.join(', ')}. Advanced features (enableWhen, Quantity units via unit/unitOption, nested items) are edited here in JSON.</p></Tile>
            </Stack>
          )}
        </Column>

        {/* Live "Example" preview (FR-13.5) */}
        <Column lg={7}>
          <p style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--cds-text-secondary)' }}>{t('admin.programs.questionnaire.preview.label', 'Example')}</p>
          <Tile>
            {questions.length === 0 && <p style={{ color: 'var(--cds-text-secondary)' }}>{t('admin.programs.questionnaire.preview.empty', 'No questions yet — start adding questions to see the preview.')}</p>}
            {questions.map((q) => (
              <div key={q.id} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{q.text || '(untitled)'}</label>
                {q.type === 'choice' && <Select id={`pv-${q.id}`} labelText="" disabled><SelectItem text={q.options[0] || '—'} /></Select>}
                {q.type === 'boolean' && <span style={{ fontSize: 13 }}>◯ Yes ◯ No</span>}
                {q.type === 'text' && <TextArea id={`pv-${q.id}`} labelText="" disabled rows={2} />}
                {['integer','decimal','string','date','time'].includes(q.type) && <TextInput id={`pv-${q.id}`} labelText="" disabled placeholder={q.type} />}
                {q.type === 'quantity' && <div style={{ display: 'flex', gap: 6 }}><TextInput id={`pv-${q.id}`} labelText="" disabled placeholder="number" /><Select id={`pvu-${q.id}`} labelText="" disabled><SelectItem text="unit" /></Select></div>}
                {q.type === 'checkbox' && q.options.map((o, i) => <div key={i} style={{ fontSize: 13 }}>☐ {o}</div>)}
              </div>
            ))}
          </Tile>
        </Column>
      </Grid>

      <Stack orientation="horizontal" gap={3}>
        <Button kind="primary" disabled={!domain}>{t('button.save', 'Save')}</Button>
        <Button kind="secondary" onClick={onClose}>{t('button.cancel', 'Cancel')}</Button>
      </Stack>
    </Stack>
  );
}
