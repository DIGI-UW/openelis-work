// Microbiology v2: Case view, Worklist Needs attention, order entry (generic culture tests in the ordinary test picker)
// Routes:
//   /Microbiology/cases/:caseId                 Case view (existing route, v2 sections): TB example and blood culture (AMR) example
//   /Microbiology/worklist?status=attention      Worklist, Needs attention filter (existing page)
//   Worklist bench work (FR-12.6, D-172): Awaiting inoculation, Check due, Final read due; No growth and Inoculate, no run
//   Enter Order (Clinical Order Entry v4)        Samples and tests: no Microbiology section, no Program coupling (FR-B12a v0.13, D-146)
// SideNav: Microbiology -> Worklist -> (row); Orders & Patients -> Add Order
// Breadcrumbs: Home / Microbiology / Worklist / Case {labNumber}; Home / Microbiology / Worklist
// FRS: amr-micro-v2-amendments.md draft 10.5; patient-report-and-report-management-frs.md v2.4.3 §7.4 (FR-A42a groups)
// Decisions: D-113 to D-119, D-121, D-124 to D-138, D-146, D-147 and D-162 to D-210 (D-131 retired; D-175 superseded by D-177; culture type removed by D-178; D-148 replaced by D-164; D-167 amended by D-172; D-171 superseded)
// Regions marked <ExistingFence> are shipped UI (M-04 Case view on develop): reuse, do not
// re-implement. They are drawn abbreviated; only the listed v2 additions are new (D-063, A-16).

import React, { useState, useMemo, createContext, useContext } from 'react';
import {
  Breadcrumb, BreadcrumbItem, Grid, Column, Stack, Tile, Tag, Button, Select, SelectItem,
  TextInput, TextArea, NumberInput, Checkbox, ComboBox, DataTable, TableContainer, Table, TableHead,
  TableRow, TableHeader, TableBody, TableCell, InlineNotification, ContentSwitcher, Switch,
  ClickableTile, OverflowMenu, OverflowMenuItem, Accordion, AccordionItem, RadioButtonGroup, RadioButton,
  ActionableNotification, Toggle, DismissibleTag,
} from '@carbon/react';
import { Add, Renew } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

/* ---------- mock data (TB example from CPHL Port Moresby) ---------- */
const ATMOSPHERES = [
  ['aerobic', t('microbiology.case.inoc.atmosphere.aerobic', 'Aerobic (ambient air)')],
  ['co2', t('microbiology.case.inoc.atmosphere.co2', 'CO₂-enriched (5 to 10%)')],
  ['candleJar', t('microbiology.case.inoc.atmosphere.candleJar', 'Candle jar')],
  ['anaerobic', t('microbiology.case.inoc.atmosphere.anaerobic', 'Anaerobic')],
  ['microaerophilic', t('microbiology.case.inoc.atmosphere.microaerophilic', 'Microaerophilic')],
];
const PURPOSES = [
  ['CLINICAL_DIAGNOSTIC', t('microbiology.culturePurpose.clinical', 'Diagnostic')],
  ['ACTIVE_SCREENING', t('microbiology.culturePurpose.screening', 'Screening')],
  ['TREATMENT_FOLLOW_UP', t('microbiology.culturePurpose.followUp', 'Treatment follow-up')],
  ['SURVEY_STUDY', t('microbiology.culturePurpose.surveyStudy', 'Survey or study')],
  ['EQA', t('microbiology.culturePurpose.eqa', 'EQA / proficiency')],
];
const BODY_SITES = ['Lower respiratory tract', 'Upper respiratory tract', 'Bronchoalveolar lavage', 'Pleural fluid', 'Cerebrospinal fluid', 'Wound, lower leg', 'Wound, forearm', 'Urethra', 'Cervix', 'Nasopharynx', 'Throat', 'Ear, middle'];
// Microbiology medium items (FR-05.1b to FR-05.1d): tracked items have lots in Inventory; not tracked items are names only.
// A culture row records the lot but never changes stock (D-169).
const MEDIA_SEED = [
  { id: 'mgit', text: 'BBL MGIT 7 mL tube', tracked: true, unit: 'tube', atm: 'aerobic', temp: 37, lots: [{ n: '5327611', exp: '01/2027', left: 212 }, { n: '5311020', exp: '08/2026', why: 'Expired' }] },
  { id: 'lj', text: 'Löwenstein-Jensen slope', tracked: true, unit: 'slope', atm: 'aerobic', temp: 37, lots: [{ n: 'LJ-2609 (prepared in-house)', exp: '11/2026', left: 40 }, { n: 'LJ-2608', exp: '10/2026', why: 'QC failed' }] },
  { id: 'ba', text: 'Blood agar (sheep) plate', tracked: true, unit: 'plate', atm: 'co2', temp: 35, lots: [{ n: 'BA-26-117', exp: '10/2026', left: 64 }] },
  { id: 'mac', text: 'MacConkey agar plate', tracked: true, unit: 'plate', atm: 'aerobic', temp: 35, lots: [{ n: 'MAC-26-090', exp: '11/2026', left: 51 }] },
  { id: 'choc', text: 'Chocolate agar plate', tracked: true, unit: 'plate', atm: 'co2', temp: 35, lots: [{ n: 'CA-26-052', exp: '10/2026', left: 18 }] },
  { id: 'cled', text: 'CLED agar plate', tracked: true, unit: 'plate', atm: 'aerobic', temp: 35, lots: [{ n: 'CLED-26-201', exp: '11/2026', left: 88 }] },
  { id: 'sel', text: 'Selenite F broth', tracked: true, unit: 'tube', atm: 'aerobic', temp: 35, lots: [{ n: 'SEL-26-014', exp: '12/2026', left: 30 }] },
  { id: 'bcae', text: 'BACTEC Plus Aerobic/F bottle', tracked: false, atm: 'aerobic', temp: 35, lots: [] },
  { id: 'bcan', text: 'BACTEC Lytic/10 Anaerobic/F bottle', tracked: false, atm: 'anaerobic', temp: 35, lots: [] },
  { id: 'm7h11', text: 'Middlebrook 7H11 agar (from QMRL)', tracked: false, atm: 'co2', temp: 37, lots: [] },
];
const MediaContext = createContext(null);
// Linked media of the culture test (FR-05.2a, D-208), from the Test catalog Reagents and media section
const PLATING_TEMPLATES = [
  { id: 'pt1', sampleType: 'Urine', culture: 'Any', rows: [{ medium: 'cled', atm: 'aerobic', temp: 35, dur: 24, unit: 'Hours' }, { medium: 'ba', atm: 'aerobic', temp: 35, dur: 24, unit: 'Hours' }] },
  { id: 'pt2', sampleType: 'Sputum', culture: 'TB culture', rows: [{ medium: 'mgit', atm: 'aerobic', temp: 37, dur: 42, unit: 'Days' }, { medium: 'lj', atm: 'aerobic', temp: 37, dur: 56, unit: 'Days' }] },
  { id: 'pt3', sampleType: 'Stool', culture: 'Any', rows: [{ medium: 'sel', atm: 'aerobic', temp: 35, dur: 18, unit: 'Hours' }] },
  { id: 'pt4', sampleType: 'Blood, aerobic bottle', culture: 'Blood culture', rows: [{ medium: 'bcae', atm: 'aerobic', temp: 35, dur: 5, unit: 'Days' }] },
  { id: 'pt5', sampleType: 'Blood culture bottle', culture: 'positive bottle subculture', rows: [{ medium: 'ba', atm: 'co2', temp: 35, dur: 48, unit: 'Hours', every: 24 }, { medium: 'mac', atm: 'aerobic', temp: 35, dur: 48, unit: 'Hours', every: 24 }, { medium: 'choc', atm: 'co2', temp: 35, dur: 48, unit: 'Hours', every: 24 }] },
];
// Notes (A-13): same pattern as Results Entry v2.1 Notes section; type I = In Lab Only, E = Send with Result
const NotesContext = createContext(null);
const NOTE_SEED = {
  gram: [{ id: 'n1', d: '23 Sep 09:12', a: 'J. Kaupa', type: 'I', body: 'Thick smear; re-stained once before reading.' }],
  'MGIT-004812-A': [{ id: 'n2', d: '28 Sep 08:40', a: 'R. Opa', type: 'E', body: 'Positive signal on day 5; purity subculture set up.' }],
  'ISO-1': [{ id: 'n3', d: '28 Sep 10:05', a: 'R. Opa', type: 'I', body: 'MPT64 read at 15 minutes; clear band.' }],
};

const GRADES = ['None', 'Rare', 'Few', 'Moderate', 'Many'];
const INITIAL_ROWS = [
  { id: 'smear', test: 'AFB smear (Ziehl-Neelsen)', type: 'coded', opts: ['Negative', 'Scanty (1 to 9 AFB per 100 fields)', '1+', '2+', '3+'], result: '2+', display: '2+ (10 to 99 AFB per 100 fields)', flag: 'Critical', by: 'J. Kaupa (this lab)', lot: 'ZN stain kit, lot 22071', state: 'Validated' },
  { id: 'xpert', test: 'Xpert MTB/RIF Ultra', type: 'components', components: [{ c: 'MTB', v: 'Detected, medium', opts: ['Not detected', 'Trace', 'Detected, low', 'Detected, medium', 'Detected, high'] }, { c: 'Rifampicin resistance', v: 'Detected', opts: ['Not detected', 'Detected', 'Indeterminate'] }], display: 'MTB detected, medium; rifampicin resistance detected', flag: 'Critical', by: 'Goroka Provincial Hospital Laboratory, 22 Sep 2026', external: true, state: 'Validated' },
  { id: 'gram', test: 'Gram stain (direct)', type: 'components', components: ['Gram-positive cocci in clusters', 'Gram-negative bacilli', 'Yeasts', 'Pus cells', 'Epithelial cells'].map((c) => ({ c, v: c === 'Pus cells' ? 'Many' : c === 'Gram-positive cocci in clusters' ? 'Few' : '', opts: ['', ...GRADES] })), display: 'Pus cells: many; Gram-positive cocci in clusters: few', flag: '', by: 'J. Kaupa (this lab)', lot: 'Gram stain kit, lot 44120', state: 'Awaiting validation' },
  { id: 'wet', test: 'Wet preparation', type: 'components', components: ['Pus cells', 'Motile bacilli', 'Yeasts'].map((c) => ({ c, v: '', opts: ['', ...GRADES] })), display: '', flag: '', by: '', state: 'Not started' },
];
const ADDITIONAL_ROWS = [
  { id: 'wgs', test: 'Whole genome sequencing (MTB)', on: 'isolate sample CPHL26-004812-1.1 (ISO-1)', type: 'components', components: [{ c: 'Lineage', v: 'Lineage 2 (Beijing)', opts: ['Lineage 1', 'Lineage 2 (Beijing)', 'Lineage 4'] }, { c: 'Rifampicin (rpoB)', v: 'Resistant (S450L)', opts: ['Susceptible', 'Resistant (S450L)'] }], display: '', flag: '', by: 'QMRL Brisbane (referred)', state: 'Not started' },
  { id: 'lpa', test: 'Line probe assay MTBDRsl', on: 'ISO-1', type: 'components', components: [{ c: 'Fluoroquinolones (gyrA, gyrB)', v: 'No mutation detected', opts: ['No mutation detected', 'Mutation detected'] }, { c: 'Second-line injectables (rrs, eis)', v: 'No mutation detected', opts: ['No mutation detected', 'Mutation detected'] }], display: 'No fluoroquinolone or injectable resistance mutations', flag: '', by: 'R. Opa (this lab)', lot: 'GenoType MTBDRsl kit, lot 8830', state: 'Validated' },
];

const CULTURE_ROWS = [
  { id: 'MGIT-004812-A', from: '', medium: 'BBL MGIT 7 mL tube', lot: '5327611', atm: 'aerobic', temp: 37, dur: 42, unit: 'Days', every: 7, eunit: 'Days', start: '23 Sep 08:30', ends: '04 Nov 08:30', next: '', day: 5, state: 'Positive', posAt: '28 Sep 03:42', posBy: 'MGIT 960 signal', log: ['Day 5 (28 Sep 03:42): positive signal (MGIT 960)'] },
  { id: 'LJ-004812-B', from: '', medium: 'Löwenstein-Jensen slope', lot: 'LJ-2609 (prepared in-house)', atm: 'aerobic', temp: 37, dur: 56, unit: 'Days', every: 7, eunit: 'Days', start: '23 Sep 08:30', ends: '18 Nov 08:30', next: '28 Sep 08:30', day: 5, state: 'Check due', log: ['Day 1: no growth'] },
  { id: 'LJ-SUB-004812-A1', from: 'MGIT-004812-A', medium: 'Middlebrook 7H11 agar (from QMRL)', notTracked: true, atm: 'aerobic', temp: 37, dur: 28, unit: 'Days', every: 7, eunit: 'Days', start: '28 Sep 11:00', ends: '26 Oct 11:00', next: '05 Oct 11:00', day: 1, state: 'Incubating', log: [] },
  { id: 'BA-SUB-004812-A2', from: 'MGIT-004812-A', purpose: 'Purity', medium: 'Blood agar (sheep) plate', lot: 'BA-26-117', atm: 'aerobic', temp: 37, dur: 48, unit: 'Hours', every: 24, eunit: 'Hours', start: '28 Sep 11:05', ends: '30 Sep 11:05', next: '29 Sep 11:05', day: 1, state: 'Incubating', log: [] },
];

const INCOMING = [
  { id: 'n1', test: 'Species ID (MALDI-TOF Biotyper)', value: 'Mycobacterium tuberculosis complex', source: 'MALDI-TOF Biotyper (MB-01)', received: '28 Sep 10:40' },
  { id: 'n2', test: 'Xpert MTB/XDR', value: 'INH resistance detected; FQ not detected', source: 'GeneXpert GX-02', received: '28 Sep 11:05' },
  { id: 'n3', test: 'Identification (QMRL Brisbane)', value: 'Mycobacterium tuberculosis complex', source: 'Referral return: QMRL Brisbane', received: '29 Sep 08:05',
    // FR-09.6, D-213: results from one message linked to one organism stay together
    linked: [['Moxifloxacin (MGIT, 0.25 µg/mL)', 'S'], ['Bedaquiline (MGIT, 1 µg/mL)', 'S'], ['Linezolid (MGIT, 1 µg/mL)', 'S']] },
];

const DST_READINGS = [
  { id: 'd1', drug: 'Rifampicin', raw: '1.0 µg/mL', source: 'Analyzer', matchedBy: 'WHO critical concentrations 2024', interp: 'R', override: false },
  { id: 'd2', drug: 'Isoniazid', raw: '0.1 µg/mL', source: 'Analyzer', matchedBy: 'WHO critical concentrations 2024', interp: 'R', override: false },
  { id: 'd3', drug: 'Ethambutol', raw: '5.0 µg/mL', source: 'Override', matchedBy: 'WHO critical concentrations 2024', interp: 'S', override: true },
  { id: 'd4', drug: 'Pyrazinamide', raw: '', source: '', matchedBy: '', interp: 'Pending', override: false },
];

const stateKind = (s) => ({ Positive: 'green', 'Check due': 'warm-gray', Incubating: 'blue', 'No growth': 'gray', Contaminated: 'red' }[s] || 'gray');

/* ---------- shared bits ---------- */
function ExistingFence({ owner, additions, children }) {
  return (
    <div style={{ border: '1px dashed var(--cds-border-strong)', padding: 'var(--cds-spacing-05)' }}>
      <div style={{ marginBottom: 'var(--cds-spacing-03)' }}>
        <Tag type="gray" size="sm">{t('microbiology.mockup.existing', 'Existing component')}</Tag>{' '}
        <small>{t('microbiology.mockup.existingHelp', 'Reuse, do not re-implement')}: {owner}. {t('microbiology.mockup.abbreviated', 'Drawing abbreviated.')} {additions ? `${t('microbiology.mockup.additions', 'v2 additions')}: ${additions}` : ''}</small>
      </div>
      {children}
    </div>
  );
}

function Section({ n, title, isNew, children }) {
  return (
    <AccordionItem open title={<span>{n}. {title} {isNew && <Tag type="blue" size="sm">v2</Tag>}</span>}>
      {children}
    </AccordionItem>
  );
}

function SimpleTable({ headers, rows, render }) {
  return (
    <DataTable rows={rows} headers={headers} size="sm">
      {({ rows: r, headers: h, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer>
          <Table {...getTableProps()}>
            <TableHead><TableRow>{h.map((x) => <TableHeader key={x.key} {...getHeaderProps({ header: x })}>{x.header}</TableHeader>)}</TableRow></TableHead>
            <TableBody>{r.map((row) => (
              <TableRow key={row.id} {...getRowProps({ row })}>
                {row.cells.map((c) => <TableCell key={c.id}>{render ? render(c, row) : c.value}</TableCell>)}
              </TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

/* ---------- One result entry pattern for every case test row (FR-06.5) ---------- */
// Reuses the Results Entry result input controls (coded, numeric, multi-component OGC-1126/1127).
/* ---------- Notes section (A-13, FR-13.1a): reuse the Results Entry Notes component ---------- */
function NotesSection({ id, printable = true, underCulture = false }) {
  const { notes, addNote } = useContext(NotesContext);
  const list = notes[id] || [];
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState('I');
  const [body, setBody] = useState('');
  const save = () => {
    if (!body.trim()) return;
    addNote(id, { id: `${id}-${list.length + 1}`, d: '30 Sep 09:30', a: 'J. Kaupa', type, body: body.trim() });
    setBody(''); setType('I'); setAdding(false);
  };
  return (
    <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
      <h6>{t('microbiology.case.notes.title', 'Notes')}</h6>
      {list.length ? (
        <SimpleTable
          headers={[{ key: 'd', header: t('label.dateTime', 'Date/time') }, { key: 'a', header: t('label.author', 'Author') }, { key: 'type', header: t('label.type', 'Type') }, { key: 'body', header: t('label.note', 'Note') }]}
          rows={list}
          render={(c) => (c.info.header === 'type'
            ? (c.value === 'E'
              ? <Tag type="blue" size="sm">{t('label.results.notes.sendWithResult', 'Send with Result')}</Tag>
              : <Tag type="gray" size="sm">{t('label.results.notes.inLabOnly', 'In Lab Only')}</Tag>)
            : c.value)}
        />
      ) : <p><small>{t('microbiology.case.notes.none', 'No notes yet.')}</small></p>}
      {adding ? (
        <Stack gap={4} style={{ marginTop: 'var(--cds-spacing-04)' }}>
          <RadioButtonGroup legendText={t('label.type', 'Type')} name={`note-type-${id}`} valueSelected={type} onChange={(v) => setType(v)}>
            <RadioButton id={`note-i-${id}`} value="I" labelText={t('label.results.notes.inLabOnly', 'In Lab Only')} />
            <RadioButton id={`note-e-${id}`} value="E" labelText={t('label.results.notes.sendWithResult', 'Send with Result')} />
          </RadioButtonGroup>
          {underCulture && type === 'E' && <small>{t('microbiology.case.notes.printsUnderCulture', 'Prints under the culture result on the report.')}</small>}
          <TextArea id={`note-body-${id}`} labelText={t('label.results.notes.newNote', 'New Note')} rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          {type === 'E' && !printable && (
            <InlineNotification kind="warning" lowContrast hideCloseButton title={t('microbiology.case.notes.notPrinted', 'This result is not on the report, so this note will not print')} />
          )}
          <Stack orientation="horizontal" gap={3}>
            <Button size="sm" onClick={save}>{t('microbiology.case.notes.save', 'Save note')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setAdding(false)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </Stack>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button kind="tertiary" size="sm" onClick={() => setAdding(true)}>{t('button.results.notes.newNote', 'New Note')}</Button>
        </div>
      )}
    </Tile>
  );
}
function NoteCountTag({ id }) {
  const { notes } = useContext(NotesContext);
  const n = (notes[id] || []).length;
  return n ? <div><Tag type="cool-gray" size="sm">{noteCountLabel(notes, id)}</Tag></div> : null;
}
function noteCountLabel(notes, id) {
  return t('microbiology.case.notes.count', 'Notes ({count})').replace('{count}', (notes[id] || []).length);
}

function ResultEditor({ row, onClose, printable }) {
  const [prev, setPrev] = useState(!!row.external);
  const [graded, setGraded] = useState(row.graded || []);
  return (
    <Tile>
      <h6>{row.test}</h6>
      {row.type === 'coded' && (
        <Select id={`res-${row.id}`} labelText={`${t('label.result', 'Result')} *`} defaultValue={row.result}>
          {row.opts.map((o) => <SelectItem key={o} value={o} text={o} />)}
        </Select>
      )}
      {row.type === 'components' && (
        <TableContainer>
          <Table size="sm">
            <TableHead><TableRow><TableHeader>{t('label.component', 'Component')}</TableHeader><TableHeader>{t('label.result', 'Result')}</TableHeader></TableRow></TableHead>
            <TableBody>{row.components.map((c) => (
              <TableRow key={c.c}><TableCell>{c.c}</TableCell>
                <TableCell><Select id={`cmp-${row.id}-${c.c}`} labelText="" hideLabel size="sm" defaultValue={c.v}>{c.opts.map((o) => <SelectItem key={o} value={o} text={o} />)}</Select></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      )}
      <Grid condensed style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Column lg={4}><Checkbox id={`prev-${row.id}`} labelText={t('microbiology.case.testedElsewhere', 'Tested elsewhere')} checked={prev} onChange={(e, { checked }) => setPrev(checked)} /></Column>
        {prev ? (
          <>
            <Column lg={6}><ComboBox id={`perf-${row.id}`} titleText={`${t('microbiology.case.performedBy', 'Performed by')} *`} items={['Goroka Provincial Hospital Laboratory', 'Mount Hagen Provincial Hospital Laboratory', 'J. Kaupa (user)']} initialSelectedItem={row.external ? 'Goroka Provincial Hospital Laboratory' : null} placeholder={t('microbiology.case.performedBy.search', 'Search the Organizations list or a user')} onChange={() => {}} /></Column>
            <Column lg={3}><TextInput id={`dp-${row.id}`} labelText={`${t('microbiology.case.datePerformed', 'Date performed')} *`} defaultValue="22/09/2026" /></Column>
          </>
        ) : (
          <Column lg={6}>
            <ExistingFence owner="M-12 reagent lot picker (built)" additions="none">
              <Select id={`lot-${row.id}`} labelText={t('label.reagentLot', 'Reagent lot')} defaultValue={row.lot || ''}><SelectItem value="" text={t('microbiology.case.selectLot', 'Select lot')} />{row.lot && <SelectItem value={row.lot} text={row.lot} />}</Select>
            </ExistingFence>
          </Column>
        )}
        {row.state && row.state !== 'Not started' && <Column lg={16}><small>{t('microbiology.case.history.enteredBy', 'Entered by {0}, {1}').replace('{0}', row.by || 'J. Kaupa').replace('{1}', '02 Oct 08:40')}{row.state === 'Validated' ? ` · ${t('microbiology.case.history.validatedBy', 'Validated by {0}, {1}').replace('{0}', 'R. Opa').replace('{1}', '02 Oct 09:15')}` : ''}</small></Column>}
        <Column lg={16}><NotesSection id={row.id} printable={printable} /></Column>
      </Grid>
      <p><small>{t('microbiology.case.flagsFromCatalog', 'Flags come from the test catalog, exactly as on Results Entry. Saving records the result as Awaiting validation; a validator validates or returns it (D-191).')}</small></p>
      <Stack orientation="horizontal" gap={3}>
        <Button size="sm" onClick={onClose}>{t('microbiology.case.result.save', 'Save result')}</Button>
        <Button size="sm" kind="ghost" onClick={onClose}>{t('button.cancel', 'Cancel')}</Button>
      </Stack>
    </Tile>
  );
}

/* ---------- Culture (A-05) ---------- */
/* ---------- Medium and lot (A-05, FR-05.1b to FR-05.1d) ---------- */
function MediumPicker({ id, onPrefill }) {
  const { media, setMedia } = useContext(MediaContext);
  const [medium, setMedium] = useState(null);
  const [lot, setLot] = useState('');
  const [typed, setTyped] = useState('');
  const pick = ({ selectedItem }) => {
    setMedium(selectedItem || null);
    const usable = selectedItem?.lots.find((l) => !l.why);
    setLot(usable ? usable.n : '');
    if (selectedItem && onPrefill) onPrefill(selectedItem);
  };
  const exists = media.some((m) => m.text.toLowerCase() === typed.trim().toLowerCase());
  const addNew = () => {
    const n = typed.trim();
    if (!n) return;
    const m = { id: `new-${media.length}`, text: n, tracked: false, atm: 'aerobic', temp: 35, lots: [] };
    setMedia([...media, m]);
    pick({ selectedItem: m });
  };
  const hasUsable = medium?.lots.some((l) => !l.why);
  return (
    <>
      <Column lg={5}>
        <Stack gap={2}>
          <ComboBox id={`${id}-med`} titleText={`${t('microbiology.case.inoc.medium', 'Medium')} *`} placeholder={t('microbiology.case.inoc.searchMedium', 'Search media')}
            items={media} itemToString={(m) => (m ? m.text : '')} selectedItem={medium} onChange={pick} onInputChange={(v) => setTyped(v || '')}
            shouldFilterItem={({ item, inputValue }) => !inputValue || item.text.toLowerCase().includes(inputValue.toLowerCase())}
            itemToElement={(m) => (m ? <span>{m.text} <Tag type={m.tracked ? 'teal' : 'warm-gray'} size="sm">{m.tracked ? t('microbiology.case.inoc.tracked', 'Tracked') : t('microbiology.case.inoc.notTrackedTag', 'Not tracked')}</Tag></span> : null)}
            helperText={t('microbiology.case.inoc.mediumHelp', 'Microbiology medium items. Tracked media need a lot; not tracked media have none.')} />
          {typed.trim() && !exists && (
            <Button kind="ghost" size="sm" renderIcon={Add} onMouseDown={(e) => e.preventDefault()} onClick={addNew}>
              {t('microbiology.case.inoc.addMedium', 'Add new: {name}').replace('{name}', typed.trim())}
            </Button>
          )}
        </Stack>
      </Column>
      <Column lg={5}>
        {!medium || medium.tracked ? (
          <Select id={`${id}-lot`} labelText={`${t('microbiology.case.inoc.lot', 'Lot')} *`} value={lot} onChange={(e) => setLot(e.target.value)} disabled={!medium}
            invalid={!!medium && !hasUsable} invalidText={t('microbiology.case.inoc.noUsableLot', 'No usable lot in Inventory. Receive a lot, or choose another medium.')}
            helperText={medium ? t('microbiology.case.inoc.lotHelp', 'Recorded on the row for traceability; stock is not changed here. Usable lots first, earliest expiry first.') : t('microbiology.case.inoc.scanHelp', 'Scan a lot barcode to fill Medium and Lot.')}>
            <SelectItem value="" text={medium ? t('microbiology.case.inoc.selectLot', 'Select a lot') : t('microbiology.case.inoc.pickMediumFirst', 'Pick a medium first')} />
            {medium?.lots.map((l) => (
              <SelectItem key={l.n} value={l.n} disabled={!!l.why}
                text={l.why ? `Lot ${l.n}, exp ${l.exp} (${l.why})` : `Lot ${l.n}, exp ${l.exp}, ${l.left} ${medium.unit}s left`} />
            ))}
          </Select>
        ) : (
          <div>
            <div className="cds--label">{t('microbiology.case.inoc.lot', 'Lot')}</div>
            <div><Tag type="warm-gray" size="sm">{t('microbiology.case.inoc.notTrackedTag', 'Not tracked')}</Tag></div>
            <div className="cds--form__helper-text">{t('microbiology.case.inoc.notTrackedTimeline', 'Recorded on the Timeline as not tracked in inventory.')}</div>
          </div>
        )}
      </Column>
    </>
  );
}

/* ---------- Plating template proposal (FR-05.2a) ---------- */
function TemplateProposal({ template }) {
  const { media } = useContext(MediaContext);
  const [on, setOn] = useState(template.rows.map(() => true));
  return (
    <Tile style={{ marginBottom: 'var(--cds-spacing-05)' }}>
      <h6>{t('microbiology.case.inoc.applyTemplate', 'Apply template: {name}').replace('{name}', `${template.sampleType}, ${template.culture}`)}</h6>
      <p><small>{t('microbiology.case.inoc.templateHelp', 'A suggestion from the plating templates; untick or change rows. Nothing on the case depends on it.')}</small></p>
      <SimpleTable
        headers={[{ key: 'pick', header: '' }, { key: 'medium', header: t('microbiology.case.inoc.medium', 'Medium') }, { key: 'lot', header: t('microbiology.case.inoc.lot', 'Lot') }, { key: 'inc', header: t('microbiology.case.inoc.duration', 'Incubation duration') }]}
        rows={template.rows.map((r, i) => ({ id: `tr${i}`, idx: i, pick: '', medium: r.medium, lot: '', inc: `${r.dur} ${r.unit}` }))}
        render={(c, row) => {
          const i = Number(row.id.slice(2));
          const m = media.find((x) => x.id === template.rows[i].medium);
          if (c.info.header === 'pick') return <Checkbox id={`tp-${i}`} labelText="" hideLabel checked={on[i]} onChange={(_, { checked }) => { const n = [...on]; n[i] = checked; setOn(n); }} />;
          if (c.info.header === 'medium') return <span>{m.text} <Tag type={m.tracked ? 'teal' : 'warm-gray'} size="sm">{m.tracked ? 'Tracked' : 'Not tracked'}</Tag></span>;
          if (c.info.header === 'lot') return m.tracked ? (
            <Select id={`tp-lot-${i}`} labelText="" hideLabel size="sm" defaultValue={(m.lots.find((l) => !l.why) || {}).n}>
              {m.lots.map((l) => <SelectItem key={l.n} value={l.n} disabled={!!l.why} text={`Lot ${l.n}${l.why ? ` (${l.why})` : ''}`} />)}
            </Select>
          ) : <small>{t('label.na', 'n/a')}</small>;
          return c.value;
        }}
      />
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-04)' }}>
        <Button size="sm">{t('microbiology.case.inoc.addRows', 'Add {count} rows').replace('{count}', on.filter(Boolean).length)}</Button>
        <Button size="sm" kind="ghost">{t('microbiology.case.printLabels', 'Print labels')}</Button>
      </Stack>
    </Tile>
  );
}

/* ---------- Extend incubation (FR-05.3a, D-179): any open culture row, with a reason; history kept ---------- */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// mock only: the server computes Incubation ends from the laboratory clock (FR-05.3, D-075)
const addTime = (str, n, unit) => {
  const [d, m, hm] = String(str).split(' ');
  if (!hm) return str;
  const [h, mi] = hm.split(':');
  const dt = new Date(2026, MON.indexOf(m), +d, +h, +mi);
  dt.setTime(dt.getTime() + n * (unit === 'Hours' ? 3600e3 : 86400e3));
  const p2 = (x) => String(x).padStart(2, '0');
  return `${p2(dt.getDate())} ${MON[dt.getMonth()]} ${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
};
const EXT_REASONS = [
  ['immature', t('microbiology.case.inoc.extendReason.immature', 'Colonies too small to identify or pick')],
  ['slow', t('microbiology.case.inoc.extendReason.slow', 'Slow-growing organism suspected')],
  ['fastidious', t('microbiology.case.inoc.extendReason.fastidious', 'Fastidious organism suspected (for example endocarditis)')],
  ['clinician', t('microbiology.case.inoc.extendReason.clinician', 'Clinician request')],
  ['other', t('microbiology.case.inoc.extendReason.other', 'Other')],
];
function ExtendIncubation({ row, onSave, onCancel }) {
  const [n, setN] = useState(row.unit === 'Days' ? (row.dur >= 28 ? 14 : 2) : 24);
  const [unit, setUnit] = useState(row.unit || 'Hours');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const label = (EXT_REASONS.find(([k]) => k === reason) || ['', ''])[1];
  const ends = addTime(row.ends, n, unit);
  return (
    <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
      <h6>{t('microbiology.case.inoc.extend', 'Extend incubation')} · {row.id}</h6>
      <p><small>{row.medium} · {t('microbiology.case.inoc.ends', 'Incubation ends')} {row.ends}</small></p>
      <Grid condensed>
        <Column lg={2}><NumberInput id="ext-n" label={`${t('microbiology.case.inoc.extendBy', 'Extend by')} *`} value={n} min={1} onChange={(e, { value }) => setN(Number(value) || 0)} /></Column>
        <Column lg={2}>
          <Select id="ext-unit" labelText={t('microbiology.case.inoc.unit', 'Unit')} value={unit} onChange={(e) => setUnit(e.target.value)}>
            <SelectItem value="Hours" text={t('microbiology.case.inoc.unit.hours', 'Hours')} />
            <SelectItem value="Days" text={t('microbiology.case.inoc.unit.days', 'Days')} />
          </Select>
        </Column>
        <Column lg={5}>
          <Select id="ext-reason" labelText={`${t('microbiology.case.inoc.extendReason', 'Reason')} *`} value={reason} onChange={(e) => setReason(e.target.value)} helperText="Dictionary: Extend incubation reason">
            <SelectItem value="" text={t('label.select', 'Select')} />
            {EXT_REASONS.map(([k, l]) => <SelectItem key={k} value={k} text={l} />)}
          </Select>
        </Column>
        {reason === 'other' && <Column lg={4}><TextInput id="ext-note" labelText={`${t('label.note', 'Note')} *`} value={note} onChange={(e) => setNote(e.target.value)} /></Column>}
        <Column lg={3}><TextInput id="ext-end" labelText={t('microbiology.case.inoc.newEnd', 'New incubation end')} value={ends} readOnly helperText={t('microbiology.case.inoc.extendHelp', 'The row stays open; Next check keeps its interval')} /></Column>
      </Grid>
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button size="sm" disabled={!reason || !n || (reason === 'other' && !note)} onClick={() => onSave({ n, unit, reason: reason === 'other' ? note : label, ends })}>{t('microbiology.case.inoc.extend', 'Extend incubation')}</Button>
        <Button size="sm" kind="ghost" onClick={onCancel}>{t('button.cancel', 'Cancel')}</Button>
      </Stack>
    </Tile>
  );
}
const extendRow = (r, x, who) => ({ ...r, ends: x.ends, ext: [...(r.ext || []), x], log: [...r.log, `${t('microbiology.case.inoc.extendedLog', 'Incubation extended')} ${x.n} ${x.unit} (${x.reason}); now ends ${x.ends} · ${who}`] });
const ExtTags = ({ r }) => (r.ext || []).map((x, j) => <div key={j}><Tag type="cyan" size="sm">+ {x.n} {x.unit} {t('microbiology.case.inoc.extended', 'extended')}</Tag></div>);

/* ---------- Positive at (FR-05.4b, D-180): exact date and time, defaults to the server time, editable ---------- */
const SERVER_NOW = '02 Oct 10:15'; // mock: the server clock in the laboratory time zone (D-075)
const parseT = (str) => {
  const [d, m, hm] = String(str || '').trim().split(/\s+/);
  if (!hm || MON.indexOf(m) < 0) return null;
  const [h, mi] = hm.split(':');
  if (mi === undefined) return null;
  const dt = new Date(2026, MON.indexOf(m), +d, +h, +mi);
  return Number.isNaN(dt.getTime()) ? null : dt;
};
// "1 day 3 hours 4 minutes": days only when there is at least one, hours and minutes always
const elapsed = (from, to) => {
  const s = parseT(from); const e = parseT(to);
  if (!s || !e || e < s) return '';
  const mins = Math.round((e - s) / 60000); const d = Math.floor(mins / 1440); const h = Math.floor((mins % 1440) / 60); const m = mins % 60;
  const u = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  return [d ? u(d, t('time.day', 'day'), t('time.days', 'days')) : null, u(h, t('time.hour', 'hour'), t('time.hours', 'hours')), u(m, t('time.minute', 'minute'), t('time.minutes', 'minutes'))].filter(Boolean).join(' ');
};
function PositiveState({ r, onEdit }) {
  return (
    <div>
      <Tag type="green" size="sm">{t('microbiology.case.inoc.positive', 'Positive')}</Tag>
      <div><strong>{r.posAt}</strong>{r.posBy && <small> · {r.posBy}</small>}</div>
      <div><small>{t('microbiology.case.inoc.ttp', 'Time to positivity')}: {elapsed(r.start, r.posAt)}</small></div>
      {onEdit && <Button kind="ghost" size="sm" onClick={onEdit}>{t('microbiology.case.inoc.editPositiveAt', 'Edit positive time')}</Button>}
    </div>
  );
}
function PositiveAt({ row, onSave, onCancel }) {
  const editing = row.state === 'Positive';
  const [v, setV] = useState(row.posAt || SERVER_NOW);
  const dt = parseT(v);
  const ok = !!dt && dt >= parseT(row.start) && dt <= parseT(SERVER_NOW);
  return (
    <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
      <h6>{editing ? t('microbiology.case.inoc.editPositiveAt', 'Edit positive time') : t('microbiology.case.inoc.markPositive', 'Mark positive')} · {row.id}</h6>
      <p><small>{t('microbiology.case.inoc.inoculatedAt', 'Inoculated at')} {row.start}</small></p>
      <Grid condensed>
        <Column lg={4}>
          <TextInput id="pos-at" labelText={`${t('microbiology.case.inoc.positiveAt', 'Positive at')} *`} value={v} onChange={(e) => setV(e.target.value)}
            invalid={!ok} invalidText={t('microbiology.case.inoc.positiveAt.invalid', 'Not before Inoculated at and not in the future')}
            helperText={editing ? t('microbiology.case.inoc.positiveAt.editHelp', 'The Timeline keeps the old and new times') : t('microbiology.case.inoc.positiveAt.help', 'Defaults to now (server time); change it to when growth was seen')} />
        </Column>
        <Column lg={5}><TextInput id="pos-ttp" labelText={t('microbiology.case.inoc.ttp', 'Time to positivity')} value={ok ? elapsed(row.start, v) : ''} readOnly /></Column>
      </Grid>
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button size="sm" disabled={!ok} onClick={() => onSave(v)}>{editing ? t('common.save', 'Save') : t('microbiology.case.inoc.markPositive', 'Mark positive')}</Button>
        <Button size="sm" kind="ghost" onClick={onCancel}>{t('button.cancel', 'Cancel')}</Button>
      </Stack>
    </Tile>
  );
}
const positiveRow = (r, v, who) => ({
  ...r,
  log: [...r.log, r.state === 'Positive' ? `Positive at changed from ${r.posAt} to ${v} · ${who}` : `Marked positive at ${v} (${elapsed(r.start, v)}) · ${who}`],
  state: 'Positive', next: '', posAt: v,
  posBy: r.state === 'Positive' && r.posBy && r.posBy.includes('signal') ? `${r.posBy}, time edited by ${who}` : who,
});

/* ---------- Tests on a culture are catalog tests (D-183); graded observations are multi-component results (D-185) ---------- */
const GRAM_C = ['Gram-positive cocci in clusters', 'Gram-positive cocci in chains', 'Gram-negative bacilli', 'Gram-positive bacilli', 'Gram-negative diplococci', 'Yeasts', 'Pus cells', 'Epithelial cells'];
const comps = (list, opts) => list.map((c) => ({ c, v: '', opts }));
// mock of the test catalog: result components and the Reportable setting (off starts the test In lab only, D-204) of tests set up for a culture
const CULTURE_TEST_DEFS = {
  'Gram stain, culture': { inLabOnly: false, components: comps(GRAM_C, GRADES) },
  'ZN stain, culture': { inLabOnly: true, components: [{ c: 'Acid-fast bacilli', v: '', opts: ['Not seen', 'Seen'] }, { c: 'Serpentine cording', v: '', opts: ['Absent', 'Present'] }] },
  'Auramine stain, culture': { inLabOnly: true, components: [{ c: 'Fluorescent bacilli', v: '', opts: ['Not seen', 'Seen'] }] },
  'Wet mount, culture': { inLabOnly: true, components: comps(['Motile bacilli', 'Yeasts', 'Pus cells'], GRADES) },
  'India ink stain, culture': { inLabOnly: true, components: [{ c: 'Encapsulated yeasts', v: '', opts: ['Not seen', 'Seen'] }] },
  Catalase: { inLabOnly: true, components: [{ c: 'Catalase', v: '', opts: ['Negative', 'Positive'] }] },
  'Coagulase (tube)': { inLabOnly: true, components: [{ c: 'Coagulase', v: '', opts: ['Negative', 'Positive'] }] },
  Oxidase: { inLabOnly: true, components: [{ c: 'Oxidase', v: '', opts: ['Negative', 'Positive'] }] },
  'BioFire BCID2 panel': { inLabOnly: false, components: [{ c: 'Klebsiella pneumoniae group', v: '', opts: ['Not detected', 'Detected'] }, { c: 'Escherichia coli', v: '', opts: ['Not detected', 'Detected'] }, { c: 'CTX-M', v: '', opts: ['Not detected', 'Detected'] }, { c: 'KPC', v: '', opts: ['Not detected', 'Detected'] }] },
  'Xpert MTB/RIF Ultra (culture)': { inLabOnly: false, components: [{ c: 'MTB', v: '', opts: ['Not detected', 'Detected, low', 'Detected, medium', 'Detected, high'] }, { c: 'Rifampicin resistance', v: '', opts: ['Not detected', 'Detected', 'Indeterminate'] }] },
  'MPT64 antigen (culture)': { inLabOnly: false, components: [{ c: 'MPT64', v: '', opts: ['Negative', 'Positive'] }] },
};
const compDisplay = (cs) => cs.filter((c) => c.v).map((c) => `${c.c}: ${GRADES.includes(c.v) ? c.v.toLowerCase() : c.v}`).join('; ');
const newChild = (test, from, n, extra = {}) => ({ id: `${test.startsWith('Gram') ? 'GS' : 'T'}-${n}`, kind: 'test', test, from, components: CULTURE_TEST_DEFS[test].components.map((c) => ({ ...c })), display: '', state: 'Not started', inLabOnly: CULTURE_TEST_DEFS[test].inLabOnly, at: '', by: '', ...extra });
/* ---------- Example data: the same Case view draws both examples ---------- */
const TB_ISO = 'Isolate 1: Mycobacterium tuberculosis complex';
const TB_EX = {
  lab: 'CPHL26-004812', labShort: '004812', tech: 'J. Kaupa', patient: 'Kila Nou, M, 34 y · UHID 88120034', sampleSummary: 'CPHL26-004812-1 · Sputum', sampleType: 'Sputum', site: 'Lower respiratory tract',
  labUnit: 'TB', program: 'TB Program', stage: [['blue', t('microbiology.case.stage.astDst', 'AST / DST in progress')], ['purple', t('microbiology.case.stage.referred', 'Referred')]], related: 'Bacterial culture · Microbiology', priority: '',
  history: [
    { id: 'h1', date: '12 Jun 2026', lab: 'CPHL26-002981', spec: 'Sputum, lower respiratory tract', type: 'TB Program', finding: 'MTB detected (Xpert), rifampicin resistance not detected', state: 'Final' },
    { id: 'h2', date: '03 Mar 2026', lab: 'CPHL26-000884', spec: 'Urine, midstream', type: 'Bacteriology (routine)', finding: 'E. coli ≥10⁵ CFU/mL (ESBL)', state: 'Final' }],
  notes: NOTE_SEED, incoming: INCOMING,
  info: { origin: 'Outpatient', admission: '', ward: '', diagnosis: 'Presumptive DR-TB, cough 6 weeks', specimenNumber: 'TB-2026-0417/2', sets: '1',
    history: 'Cough 6 weeks, weight loss 6 kg, night sweats. Previously treated for drug-susceptible TB in 2025 (completed 6 months HRZE at Gerehu clinic). Household contact of a confirmed RR-TB case (brother, diagnosed August 2026). HIV negative, tested July 2026.',
    priorAb: [{ id: 'a1', agent: 'Amoxicillin', date: '10 Sep 2026' }, { id: 'a2', agent: 'HRZE', date: '02 Jun 2025' }] },
  samples: [{ id: 's1', no: 'CPHL26-004812-1', type: 'Sputum · sterile container', set: '', site: 'Lower respiratory tract', at: '28 Sep 07:10', by: 'Ward nurse' }],
  initial: INITIAL_ROWS, noInitial: '', additional: ADDITIONAL_ROWS, labOnly: { wgs: true },
  choosers: {
    culture: { filter: 'pre-filtered to tests set up for Sputum or Isolate (tests on a culture), TB lab unit listed first', q: '', panels: [], tests: ['ZN stain, culture', 'Auramine stain, culture', 'Xpert MTB/RIF Ultra (culture)', 'MPT64 antigen (culture)', 'Gram stain, culture'], after: 'Each pick is listed under the culture row with its catalog result type and In lab only default.' },
    initial: { filter: 'pre-filtered to Sputum, TB lab unit listed first', q: 'stain', panels: ['TB direct microscopy panel (ZN + auramine)', 'TB molecular panel (Xpert MTB/RIF Ultra + MTB/XDR)'], tests: ['Gram stain (direct)', 'Auramine (LED fluorescence) smear', 'India ink stain'], after: 'Added tests appear as rows; enter their results in the row.' },
    ast: { filter: 'pre-filtered to DST panels and drugs for the isolate\'s organism (M. tuberculosis complex)', on: ['ISO-1 M. tuberculosis complex'], onHelp: 'The isolate the panel or test runs on', panels: ['TB second-line DST v2', 'TB new and repurposed drugs DST (BDQ, LZD, CFZ, DLM)', 'TB first-line DST v3 (already on ISO-1)'], tests: ['Bedaquiline (MGIT, 1.0 µg/mL)', 'Linezolid (MGIT, 1.0 µg/mL)', 'Moxifloxacin (MGIT, 1.0 µg/mL)', 'Pretomanid (MGIT)'], after: 'Each panel becomes its own run on the isolate; its breakpoints follow the panel (WHO critical concentrations).' },
    additional: { filter: 'any catalog test, on the specimen or an isolate', on: ['ISO-1', 'Specimen CPHL26-004812-1'], onHelp: 'Run on an isolate or on the specimen', panels: ['TB molecular panel (Xpert MTB/RIF Ultra + MTB/XDR)'], tests: ['Line probe assay MTBDRplus', 'Whole genome sequencing (MTB)', 'Niacin test'], after: 'Added tests appear as rows in Additional testing.' } },
  referrals: [{ id: 'rf1', sample: 'CPHL26-004812-1.1 (isolate sample, ISO-1)', type: 'Isolate', tests: 'TB second-line DST (phenotypic)', lab: 'QMRL Brisbane', status: 'RECEIVED' }],
  referTests: ['Xpert MTB/XDR', 'TB culture', 'TB first-line DST'], refLabs: ['CPHL Port Moresby, TB reference laboratory', 'QMRL Brisbane', 'PNG Institute of Medical Research'],
  cultureNote: 'MGIT is read by the analyzer; LJ slopes are read by hand every 7 days.',
  cultures: CULTURE_ROWS,
  children: [{ id: 'T-1', kind: 'test', test: 'ZN stain, culture', from: 'MGIT-004812-A', components: [{ c: 'Acid-fast bacilli', v: 'Seen', opts: ['Not seen', 'Seen'] }, { c: 'Serpentine cording', v: 'Present', opts: ['Absent', 'Present'] }], display: 'Acid-fast bacilli: Seen; Serpentine cording: Present', state: 'Validated', inLabOnly: true, at: '28 Sep 08:50', by: 'R. Opa' }],
  template: PLATING_TEMPLATES[1], nextContainer: 'MGIT-004812-C', otherReagent: 'MGIT PANTA supplement, lot 8210445, exp 03/2027 (FEFO)',
  isolates: [{ id: 'ISO-1', iso: 'ISO-1', from: 'MGIT-004812-A', gram: 'AFB, cording', org: 'Mycobacterium tuberculosis complex', idm: 'MPT64 antigen · 99%', sig: 'Clinically significant' }],
  isoGrams: ['AFB', 'Gram-positive cocci', 'Gram-negative bacilli'],
  isoNote: <><small>Example from a bacterial urine case: ISO-1 <em>E. coli</em></small> <Tag type="warm-gray" size="sm">{t('microbiology.case.repeatIsolate', 'Same organism on {labNumber}, {days} days ago, AST done').replace('{labNumber}', 'CPHL26-004655').replace('{days}', '6')}</Tag> <Button kind="ghost" size="sm">{t('microbiology.case.referPreviousAst', 'Refer to previous susceptibility')}</Button></>,
  astPanels: [
    { id: 'p1', panel: 'TB first-line DST v3', on: 'ISO-1', added: 'Organism default', method: 'MGIT 960 · WHO critical concentrations 2024', val: 'Awaiting validation' },
    { id: 'p2', panel: 'TB second-line DST v2', on: 'ISO-1', added: t('microbiology.case.ast.addedChooser', 'Added with the chooser'), method: 'MGIT 960 · WHO critical concentrations 2024', val: 'Not started' }],
  ast: { bp: 'WHO critical concentrations 2024', bpHelp: 'Default from the organism (MTB: WHO critical concentrations); another standard needs a reason', method: 'MGIT 960', agentLabel: t('label.drug', 'Drug'),
    runNote: 'Run 1 (Original), results in from BD MGIT 960 TB-01, tube set MGIT-2609-0441. QC passed. 1 expert flag unacknowledged.',
    readings: DST_READINGS.map((d) => ({ ...d, note: d.override ? 'Override (instrument: I)' : '' })), blocked: t('microbiology.case.ast.validateRunBlocked', 'Validate run: Accept results (1 reading and 1 flag outstanding)'),
    rule: ['RR detected on Xpert', 'Xpert MTB/XDR added automatically on 23 Sep; cancel like any added test.'],
    classLabel: t('microbiology.case.tbClassification', 'Resistance classification'), classTags: [t('microbiology.case.tbClassification.mdr', 'MDR-TB')], classNote: 'rifampicin R + isoniazid R; second-line pending.' },
  critical: [
    { id: 'c1', target: 'Result: Xpert RIF', to: 'Dr. Wari, Chest Clinic', method: 'Phone', msg: 'Rifampicin resistance detected', outcome: t('callback.outcome.confirmed', 'Read back confirmed'), status: 'Acknowledged' },
    { id: 'c2', target: 'Case: RR-TB', to: 'National TB Programme, DR-TB desk', method: 'Email', msg: 'New RR-TB, CPHL26-004812', outcome: t('callback.outcome.noReadback', 'Reached, no read-back'), status: 'Open' }],
  report: {
    items: [
      { k: 'smear', group: 'initial', order: 1, sec: 'Initial testing', label: 'AFB smear: 2+', d: 'On', on: true, print: [{ t: 'AFB smear (Sputum)', r: '2+' }] },
      { k: 'xpert', group: 'initial', order: 2, sec: 'Initial testing', label: 'Xpert MTB/RIF Ultra: MTB detected, RIF resistance detected (Goroka)', d: 'On', on: true, print: [{ t: 'Xpert MTB/RIF Ultra † (Performed by Goroka Provincial Hospital Laboratory)', r: 'MTB detected, RIF resistance detected' }] },
      { k: 'cult', group: 'culture', order: 10, sec: 'Culture', label: 'TB culture: in progress (day 5 of 56)', d: 'On', on: true, print: [{ t: 'TB culture (MGIT, LJ)', r: 'Positive (MGIT); LJ in progress, day 5 of 56', ri: true }] },
      { k: 'iso', group: 'culture', order: 30, sec: 'Isolates', label: 'Isolate 1: M. tuberculosis complex', d: 'On (significant)', on: true, print: [{ t: TB_ISO, r: 'significant', rb: false, ind: 1 }] },
      { k: 'rif', group: 'ast', iso: 'ISO-1', isoLabel: TB_ISO, order: 40, sec: 'DST, run 1', label: 'Rifampicin R', d: 'Always', on: true, print: [{ t: 'Rifampicin', r: 'R · WHO critical concentration 1.0 µg/mL', ind: 1, bar: true }] },
      { k: 'inh', group: 'ast', iso: 'ISO-1', isoLabel: TB_ISO, order: 41, sec: 'DST, run 1', label: 'Isoniazid R', d: 'Always', on: true, print: [{ t: 'Isoniazid', r: 'R · 0.1 µg/mL', ind: 1, bar: true }] },
      { k: 'emb', group: 'ast', iso: 'ISO-1', isoLabel: TB_ISO, order: 42, sec: 'DST, run 1', label: 'Ethambutol S', d: 'Cascade: off', on: false, print: [{ t: 'Ethambutol', r: 'S · 5.0 µg/mL', ind: 1 }] },
      { k: 'cls', group: 'ast', derived: true, order: 49, sec: 'DST', label: 'Resistance classification: MDR-TB', d: 'On', on: true, print: [{ t: t('report.patient.micro.classification', 'Resistance classification'), r: 'MDR-TB' }] },
      { k: 'lpa', group: 'additional', hideIf: 'lpa', order: 50, sec: 'Additional testing', label: 'MTBDRsl: no FQ or injectable resistance', d: 'On', on: true, print: [{ t: 'Line probe assay MTBDRsl (on Isolate 1)', r: 'No fluoroquinolone or injectable resistance mutations' }] },
      { k: 'wgs', group: 'additional', hideIf: 'wgs', order: 51, sec: 'Additional testing', label: 'Whole genome sequencing (pending)', d: 'Off', on: false, print: [{ t: 'Whole genome sequencing (MTB)', r: 'To follow', ri: true }] }],
    checklist: ['LJ-004812-B and LJ-SUB-004812-A1 still incubating', 'ast', 'TB history needed before final report'],
    releases: [{ id: 'r1', type: t('report.state.partial', 'Partial'), when: '23 Sep 2026 · J. Kaupa' }, { id: 'r2', type: t('report.state.partial', 'Partial'), when: '28 Sep 2026 · R. Opa' }],
    callback: 'Callback: Dr. Wari, 23/09/2026 10:40, by J. Kaupa. Read back confirmed.' },
  timeline: [
    { id: 'e1', when: '28 Sep 11:00', what: 'Subculture LJ-SUB-004812-A1 from MGIT-004812-A · J. Kaupa' },
    { id: 'e2', when: '28 Sep 10:02', what: t('microbiology.case.labUnitChanged', 'Lab unit changed from {from} to {to}').replace('{from}', 'Microbiology').replace('{to}', 'TB') + ' · R. Opa' },
    { id: 'e3', when: '28 Sep 03:42', what: 'MGIT-004812-A positive at 28 Sep 03:42 by analyzer signal (4 days 19 hours 12 minutes)' }],
};

const BC_AGENTS = [
  ['Ampicillin', '≥32', 'R', 'Expert rule: intrinsic resistance (K. pneumoniae)', 'Always'], ['Amoxicillin-clavulanate', '16/8', 'I', '', 'Always'], ['Piperacillin-tazobactam', '8/4', 'S', '', 'Always'],
  ['Ceftriaxone', '≥64', 'R', '', 'Always'], ['Ceftazidime', '16', 'R', '', 'Always'], ['Cefepime', '8', 'SDD', 'Susceptible-dose dependent', 'Always'],
  ['Ertapenem', '≤0.12', 'S', '', 'Cascade: shown because ceftriaxone is R'], ['Meropenem', '≤0.25', 'S', '', 'Cascade: shown because ceftriaxone is R'], ['Gentamicin', '≥16', 'R', '', 'Always'],
  ['Amikacin', '≤2', 'S', '', 'Cascade: shown because gentamicin is R'], ['Ciprofloxacin', '≥4', 'R', '', 'Always'], ['Trimethoprim-sulfamethoxazole', '≥320', 'R', '', 'Always']];
const BC_ISO = 'Isolate 1: Klebsiella pneumoniae';
const bcBottle = (id, sample, set, medium, lot, atm, start, extra) => ({ id, from: '', sample, set: `${set} · ${sample}`, bottle: true, analyzer: 'BacT/ALERT VIRTUO BC-01', medium, lot, atm, temp: 35, dur: 5, unit: 'Days', every: 1, eunit: 'Days', start, ends: addTime(start, 5, 'Days'), next: '', day: 4, state: 'Incubating', log: [], ...extra });
const bcPlate = (n, medium, lot, atm, extra) => ({ id: `BA-SUB-004831-1A${n}`, from: 'BC-004831-1A', medium, lot, atm, temp: 35, dur: 48, unit: 'Hours', every: 24, eunit: 'Hours', start: '30 Sep 07:30', ends: '02 Oct 07:30', next: '', day: 2, state: 'Positive', posAt: '01 Oct 07:40', posBy: 'P. Hiri', ...extra });
const BC_EX = {
  lab: 'CPHL26-004831', labShort: '004831', tech: 'P. Hiri', patient: 'Mere Toua, F, 61 y · UHID 88120771', sampleSummary: '4 samples, 2 sites · Blood culture bottle', sampleType: 'Blood culture bottle', site: 'Peripheral vein, left arm; right arm',
  labUnit: 'Microbiology', program: 'AMR surveillance', stage: [['blue', 'AST in progress']], related: '', priority: 'STAT',
  why: 'Four bottles on one order, all Blood culture bottle, all for the Microbiology lab unit, and Blood culture is marked Collected in sets (FR-02.4, FR-02.4a). Same Case view as the TB example; the Program brings the AMR surveillance questions and the Bacterial-track exports.',
  history: [], notes: { 'BC-004831-1N': [{ id: 'n1', d: '01 Oct 09:40', a: 'P. Hiri', type: 'I', body: 'Same organism as 1A (Gram and BCID2 agree); no separate isolate worked up.' }] },
  incoming: [{ id: 'i1', test: 'Carbapenemase (NG-Test CARBA 5)', value: 'Not detected', source: 'Bench reader (CR-01)', received: '02 Oct 09:55' }],
  info: { origin: 'Inpatient', admission: '24/09/2026', ward: 'Medical ward 3, Port Moresby General Hospital', diagnosis: 'Fever 39.4 °C, rigors, suspected sepsis; urinary catheter in place', sets: '2',
    history: 'Admitted 24 Sep with pyelonephritis; urinary catheter since admission. Started ceftriaxone 27 Sep. Fever and rigors overnight 28 to 29 Sep.',
    priorAb: [{ id: 'a1', agent: 'Ceftriaxone', date: '27 Sep 2026' }] },
  samples: [
    { id: 's1', no: 'CPHL26-004831-1', type: 'Blood culture bottle · BacT/ALERT FA Plus (aerobic), 9 mL', set: '1', site: 'Peripheral vein · left arm', at: '29 Sep 06:40', by: 'Ward nurse' },
    { id: 's2', no: 'CPHL26-004831-2', type: 'Blood culture bottle · BacT/ALERT FN Plus (anaerobic), 8 mL', set: '1', site: 'Peripheral vein · left arm', at: '29 Sep 06:40', by: 'Ward nurse' },
    { id: 's3', no: 'CPHL26-004831-3', type: 'Blood culture bottle · BacT/ALERT FA Plus (aerobic), 10 mL', set: '2', site: 'Peripheral vein · right arm', at: '29 Sep 06:55', by: 'Ward nurse' },
    { id: 's4', no: 'CPHL26-004831-4', type: 'Blood culture bottle · BacT/ALERT FN Plus (anaerobic), 6 mL', set: '2', site: 'Peripheral vein · right arm', at: '29 Sep 06:55', by: 'Ward nurse' }],
  initial: [], noInitial: 'No direct tests on blood culture bottles. The Gram stain and the rapid panel are done on a positive bottle, so they sit under that bottle in Culture.',
  additional: [{ id: 'wgsb', test: 'Whole genome sequencing (K. pneumoniae, AMR surveillance)', on: 'isolate sample CPHL26-004831-1.1 (ISO-1)', type: 'coded', opts: ['Pending'], display: '', flag: '', by: 'PNG Institute of Medical Research (referred)', state: 'Not started' }],
  labOnly: { wgsb: true },
  choosers: {
    culture: { filter: 'pre-filtered to tests set up for Blood culture bottle or Isolate (tests on a culture), Microbiology lab unit listed first', q: '', panels: [], tests: ['Gram stain, culture', 'BioFire BCID2 panel', 'Catalase', 'Coagulase (tube)', 'Oxidase', 'Wet mount, culture', 'India ink stain, culture'], after: 'Each pick is listed under the culture row with its catalog result type and In lab only default.' },
    initial: { filter: 'pre-filtered to Blood culture bottle, Microbiology lab unit listed first', q: '', panels: ['Blood culture identification panel (BCID2)'], tests: ['Gram stain (direct)', 'Malaria RDT (from bottle)'], after: 'Added tests appear as rows; enter their results in the row.' },
    ast: { filter: 'pre-filtered to AST panels and antibiotics for the isolate\'s organism (Enterobacterales)', on: ['ISO-1 K. pneumoniae'], onHelp: 'The isolate the panel or test runs on', panels: ['Enterobacterales disk diffusion supplement', 'Carbapenemase confirmation panel (mCIM, eCIM)', 'VITEK 2 AST-N405 (already on ISO-1)'], tests: ['Ceftazidime-avibactam (disk)', 'Colistin (broth microdilution)', 'Fosfomycin (agar dilution)', 'Tigecycline (MIC)'], after: 'Each panel becomes its own run on the isolate; its breakpoints follow the panel (the lab\'s CLSI M100 edition for Enterobacterales).' },
    additional: { filter: 'any catalog test, on the specimen or an isolate', on: ['ISO-1', 'Specimen CPHL26-004831-1'], onHelp: 'Run on an isolate or on the specimen', panels: [], tests: ['Whole genome sequencing (bacterial)', 'String test (hypermucoviscosity)', 'Carbapenemase (NG-Test CARBA 5)'], after: 'Added tests appear as rows in Additional testing.' } },
  referrals: [], referTests: ['Whole genome sequencing (bacterial)', 'Carbapenemase confirmation panel (mCIM, eCIM)'], refLabs: ['PNG Institute of Medical Research', 'QMRL Brisbane'],
  cultureNote: 'Bottles are read by the blood culture analyzer: no Check every and no manual readings until a bottle flags. Set 1 flagged positive; set 2 keeps incubating to day 5.',
  cultures: [
    bcBottle('BC-004831-1A', 'CPHL26-004831-1', 'Set 1 · left arm', 'BacT/ALERT FA Plus (aerobic)', '4127893', 'aerobic', '29 Sep 08:30', { state: 'Positive', posAt: '29 Sep 22:18', posBy: 'BacT/ALERT signal', day: 1, log: ['29 Sep 22:18: positive signal (BacT/ALERT VIRTUO BC-01)'] }),
    bcBottle('BC-004831-1N', 'CPHL26-004831-2', 'Set 1 · left arm', 'BacT/ALERT FN Plus (anaerobic)', '4127550', 'anaerobic', '29 Sep 08:30', { state: 'Positive', posAt: '30 Sep 03:42', posBy: 'BacT/ALERT signal', day: 1, log: ['30 Sep 03:42: positive signal'] }),
    bcBottle('BC-004831-2A', 'CPHL26-004831-3', 'Set 2 · right arm', 'BacT/ALERT FA Plus (aerobic)', '4127893', 'aerobic', '29 Sep 08:32'),
    bcBottle('BC-004831-2N', 'CPHL26-004831-4', 'Set 2 · right arm', 'BacT/ALERT FN Plus (anaerobic)', '4127550', 'anaerobic', '29 Sep 08:32'),
    bcPlate(1, 'Blood agar (sheep) plate', 'BA-26-117', 'co2', { log: ['01 Oct 07:40: significant growth, grey mucoid colonies'] }),
    bcPlate(2, 'MacConkey agar plate', 'MAC-26-090', 'aerobic', { log: ['01 Oct 07:40: lactose-fermenting mucoid colonies'] }),
    bcPlate(3, 'Chocolate agar plate', 'CA-26-052', 'co2', { ends: '03 Oct 07:30', next: '03 Oct 07:30', ext: [{ n: 24, unit: 'Hours', reason: 'Colonies too small to identify or pick' }], log: ['01 Oct 07:40: pinpoint colonies, too small to pick', 'Incubation extended 24 Hours (Colonies too small to identify or pick); now ends 03 Oct 07:30 · P. Hiri'] })],
  children: [
    { id: 'GS-1', kind: 'test', test: 'Gram stain, culture', from: 'BC-004831-1A', components: GRAM_C.map((c) => ({ c, v: c === 'Gram-negative bacilli' ? 'Many' : '', opts: GRADES })), display: 'Gram-negative bacilli: many', state: 'Validated', inLabOnly: false, at: '30 Sep 07:20', by: 'P. Hiri' },
    { id: 'T-1', kind: 'test', test: 'BioFire BCID2 panel', from: 'BC-004831-1A', components: [{ c: 'Klebsiella pneumoniae group', v: 'Detected', opts: ['Not detected', 'Detected'] }, { c: 'Escherichia coli', v: 'Not detected', opts: ['Not detected', 'Detected'] }, { c: 'CTX-M', v: 'Detected', opts: ['Not detected', 'Detected'] }, { c: 'KPC', v: 'Not detected', opts: ['Not detected', 'Detected'] }], display: 'Klebsiella pneumoniae group: Detected; CTX-M: Detected; KPC: Not detected', state: 'Validated', inLabOnly: false, at: '30 Sep 08:45', by: 'BioFire FilmArray (FA-01)' },
    // FR-10.1g, D-189: added by the reflex rule on the culture result when the anaerobic bottle turned positive; no result yet
    { id: 'GS-2', kind: 'test', test: 'Gram stain, culture', from: 'BC-004831-1N', components: GRAM_C.map((c) => ({ c, v: '', opts: GRADES })), display: '', state: 'Not started', inLabOnly: false, rule: 'Blood culture result = Positive: Gram stain, culture', at: '30 Sep 03:42', by: '' }],
  template: PLATING_TEMPLATES[4], nextContainer: 'BA-SUB-004831-1N1', otherReagent: 'None linked to Blood culture',
  isolates: [{ id: 'ISO-1', iso: 'ISO-1', from: 'BA-SUB-004831-1A1', gram: 'Gram-negative bacilli · grey mucoid, lactose fermenter', org: 'Klebsiella pneumoniae', idm: 'MALDI-TOF Biotyper (MB-01) · score 2.31', sig: 'Clinically significant' }],
  isoGrams: ['Gram-negative bacilli', 'Gram-positive cocci in clusters', 'Gram-positive cocci in chains', 'Yeasts'],
  isoNote: <small>The anaerobic bottle grew the same organism (BCID2 and Gram agree), so no second isolate is worked up; a note on BC-004831-1N records it. Use Add isolate when a second colony type grows.</small>,
  astPanels: [{ id: 'p1', panel: 'VITEK 2 AST-N405 (Enterobacterales)', on: 'ISO-1', added: 'Organism default', method: 'VITEK 2 MIC · CLSI M100 36th ed. (2026)', val: 'Awaiting validation' }],
  ast: { bp: 'CLSI M100 36th ed. (2026)', bpHelp: 'Default from the organism (Enterobacterales: the lab\'s CLSI M100 edition); another standard needs a reason', method: 'VITEK 2', agentLabel: t('label.antibiotic', 'Antibiotic'),
    runNote: 'Run 1 (Original), results in from VITEK 2 Compact VK-01, card 2741 0093 5521, 02 Oct 03:15. QC passed. Expert rules applied: 2 (intrinsic ampicillin resistance; ESBL phenotype).',
    readings: [...BC_AGENTS.map((a, k) => ({ id: `r${k}`, drug: a[0], raw: `${a[1]} µg/mL`, source: 'Analyzer', matchedBy: 'CLSI M100 36th ed. (2026)', interp: a[2], note: a[3] })), { id: 'resbl', drug: 'ESBL test', raw: 'n/a', source: 'Analyzer', matchedBy: 'VITEK 2 AES', interp: 'Positive', note: 'Agrees with CTX-M on BCID2' }],
    blocked: '', rule: null, classLabel: t('microbiology.case.resistanceProfile', 'Resistance profile'), classTags: ['ESBL', 'MDR'], classNote: 'non-susceptible in 6 antibiotic classes; carbapenems susceptible (D-178).' },
  critical: [
    { id: 'c1', target: 'Gram stain GS-1', to: 'Dr. Kaia, Medical ward 3', method: 'Phone', msg: 'Positive blood culture, Gram-negative bacilli, set 1', outcome: t('callback.outcome.confirmed', 'Read back confirmed'), status: 'Closed' },
    { id: 'c2', target: 'Test T-1 (BCID2)', to: 'Dr. Kaia, Medical ward 3', method: 'Phone', msg: 'K. pneumoniae with CTX-M (likely ESBL): ceftriaxone not effective', outcome: t('callback.outcome.confirmed', 'Read back confirmed'), status: 'Closed' }],
  report: {
    items: [
      { k: 'set1', group: 'culture', order: 10, sec: 'Culture · set 1', label: 'Blood culture, set 1 (left arm): positive, both bottles', d: 'On', on: true, print: [{ t: 'Blood culture, set 1 (left arm)', r: 'Positive, aerobic and anaerobic bottles' }] },
      { k: 'set2', group: 'culture', order: 20, sec: 'Culture · set 2', label: 'Blood culture, set 2 (right arm): no growth to date', d: 'On', on: true, print: [{ t: 'Blood culture, set 2 (right arm)', r: 'In progress (day 4 of 5)', ri: true, rb: false }] },
      { k: 'iso', group: 'culture', order: 30, sec: 'Isolates', label: BC_ISO, d: 'On (significant)', on: true, print: [{ t: BC_ISO, r: 'significant', rb: false, ind: 1 }] },
      ...BC_AGENTS.map((a, k) => ({ k: `ag${k}`, group: 'ast', iso: 'ISO-1', isoLabel: BC_ISO, order: 40 + k, sec: 'AST, run 1', label: `${a[0]} ${a[2]}`, d: a[4], on: true, print: [{ t: a[0], r: `${a[2]} · ${a[1]} µg/mL · CLSI M100 36th ed.`, ind: 1, bar: a[2] === 'R' }] })),
      { k: 'prof', group: 'ast', derived: true, order: 60, sec: 'AST', label: 'Resistance profile: ESBL, MDR', d: 'On', on: true, print: [{ t: t('report.patient.micro.profile', 'Resistance profile'), r: 'ESBL, MDR' }] },
      { k: 'wgsb', group: 'additional', hideIf: 'wgsb', order: 70, sec: 'Additional testing', label: 'Whole genome sequencing (pending)', d: 'Off (In lab only)', on: false, print: [{ t: 'Whole genome sequencing (on Isolate 1)', r: 'To follow', ri: true }] }],
    checklist: ['BC-004831-2A and BC-004831-2N incubating to 04 Oct', 'ast', 'Gram stain GS-2 has no result', 'program'],
    releases: [{ id: 'r1', type: t('report.state.partial', 'Partial'), when: '30 Sep 2026 07:35 · P. Hiri' }, { id: 'r2', type: t('report.state.partial', 'Partial'), when: '30 Sep 2026 09:00 · P. Hiri' }],
    callback: 'Callback: Dr. Kaia, 30/09/2026 07:30, by P. Hiri. Read back confirmed.' },
  timeline: [
    { id: 'e1', when: '02 Oct 03:15', what: 'AST run 1 results in, VITEK 2 VK-01 · 12 antibiotics, ESBL positive' },
    { id: 'e2', when: '01 Oct 07:42', what: 'BA-SUB-004831-1A3 incubation extended 24 Hours, colonies too small to identify or pick · P. Hiri' },
    { id: 'e3', when: '30 Sep 03:42', what: 'BC-004831-1N positive (19 hours 12 minutes); Gram stain GS-2 added by rule (positive blood culture bottle)' },
    { id: 'e4', when: '29 Sep 22:18', what: 'BC-004831-1A positive by analyzer signal (13 hours 48 minutes)' }],
};

/* ---------- One Case view, two example data sets (TB and blood culture): every section is the same component ---------- */
const CaseExample = createContext(null);
const useEx = () => useContext(CaseExample);
const PROGRAM_TRACKS = { 'TB Program': 'TB', 'AMR surveillance': 'Bacterial', 'Bacteriology (routine)': 'Bacterial', Mycology: 'Mycology' };
function ChildEditor({ m, onSave, onCancel }) {
  const [vals, setVals] = useState(m.components.map((c) => c.v || ''));
  const shown = m.components.map((c, k) => ({ ...c, v: vals[k] }));
  return (
    <Tile style={{ marginTop: 'var(--cds-spacing-03)' }}>
      <h6>{m.test} · {m.id} · {m.from}</h6>
      <p><small>{t('microbiology.case.result.componentsHelp', 'Several components, from the test catalog (the Results Entry multi-component control, OGC-1126). Components left blank are not reported.')}</small></p>
      <Grid condensed>
        {m.components.map((c, k) => (
          <Column lg={4} key={c.c}>
            <Select id={`cmp-${m.id}-${k}`} labelText={c.c} value={vals[k]} onChange={(e) => setVals(vals.map((x, j) => (j === k ? e.target.value : x)))}>
              <SelectItem value="" text={t('microbiology.case.result.notRead', 'Not read')} />
              {c.opts.map((o) => <SelectItem key={o} value={o} text={o} />)}
            </Select>
          </Column>
        ))}
        <Column lg={6}>
          <ExistingFence owner="M-12 reagent lot picker (built)" additions="none">
            <Select id={`lot-${m.id}`} labelText={t('label.reagentLot', 'Reagent lot')}><SelectItem value="l" text={m.test.startsWith('Gram') ? 'Gram stain kit, lot 44120, exp 06/2027' : 'Linked kit lot (M-12)'} /></Select>
          </ExistingFence>
        </Column>
      </Grid>
      <p><small>{t('microbiology.case.gram.preview', 'Prints as')}: {compDisplay(shown) || '-'}{m.inLabOnly ? ` (${t('microbiology.case.inLabOnly', 'In lab only')})` : ''}</small></p>
      <NotesSection id={m.id} printable={!m.inLabOnly} underCulture />
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button size="sm" disabled={!vals.some(Boolean)} onClick={() => onSave(shown)}>{t('microbiology.case.result.save', 'Save result')}</Button>
        <Button size="sm" kind="ghost" onClick={onCancel}>{t('button.cancel', 'Cancel')}</Button>
      </Stack>
    </Tile>
  );
}

/* ---------- Program questions: the Program's questionnaire from the existing Programs admin (D-186) ---------- */
const QUESTIONNAIRES = {
  'TB Program': [{ q: 'TB history', type: 'select', opts: ['New', 'Previously treated', 'DR-TB contact'], req: true }, { q: 'Treatment month', type: 'number' }, { q: 'Specimen number', type: 'text', value: 'TB-2026-0417/2' }, { q: 'Collection timing', type: 'select', opts: ['Spot', 'Early morning'] }, { q: 'Collection method', type: 'select', opts: ['Expectorated', 'Induced', 'Aspirate'] }],
  'AMR surveillance': [{ q: 'Device in place at collection', type: 'select', opts: ['None', 'Urinary catheter', 'Central line', 'Ventilator'] }, { q: 'Antibiotics in the last 48 hours', type: 'select', opts: ['No', 'Yes', 'Unknown'] }],
  'Bacteriology (routine)': [],
  Mycology: [{ q: 'Immunocompromised', type: 'select', opts: ['No', 'Yes', 'Unknown'] }],
};
function ProgramQuestionnaire({ program }) {
  const qs = QUESTIONNAIRES[program] || [];
  return (
    <ExistingFence owner="Program questionnaire (Admin › Programs) and the order entry questionnaire component (built)" additions="shown in Case information; required questions are needed before final report">
      <h6>{t('microbiology.case.programQuestions', 'Program questions')}: {program || '-'}</h6>
      {qs.length ? (
        <Grid condensed>
          {qs.map((x) => (
            <Column lg={4} key={x.q}>
              {x.type === 'select'
                ? <Select id={`pq-${x.q}`} labelText={`${x.q}${x.req ? ' ◆' : ''}`} defaultValue="" invalid={!!x.req} invalidText={t('microbiology.case.requiredBeforeFinal', 'Needed before final report')}><SelectItem value="" text={t('label.select', 'Select')} />{x.opts.map((o) => <SelectItem key={o} value={o} text={o} />)}</Select>
                : <TextInput id={`pq-${x.q}`} labelText={x.q} defaultValue={x.value || ''} />}
            </Column>
          ))}
        </Grid>
      ) : <p><small>{t('microbiology.case.programQuestions.none', 'This Program has no questionnaire.')}</small></p>}
    </ExistingFence>
  );
}
const interpTag = (v) => (v === 'R' || v === 'Positive' ? 'red' : v === 'S' ? 'green' : v === 'Pending' ? 'purple' : 'warm-gray');

/* ---------- Case header (A-04, FR-02.6) and Patient history ---------- */
function PatientHistory() {
  const { ex } = useEx();
  return (
    <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
      <h6>{t('microbiology.case.patientHistory', 'Patient history')} <Tag type="blue" size="sm">v2</Tag></h6>
      {ex.history.length ? (
        <SimpleTable
          headers={[{ key: 'date', header: t('label.date', 'Date') }, { key: 'lab', header: t('label.case', 'Case') }, { key: 'spec', header: t('label.specimen', 'Specimen') }, { key: 'type', header: t('microbiology.case.program', 'Program') }, { key: 'finding', header: t('microbiology.case.patientHistory.findings', 'Organisms and key resistance') }, { key: 'state', header: t('label.state', 'State') }]}
          rows={ex.history}
          render={(c) => (c.info.header === 'state' ? <Tag type="green" size="sm">{c.value}</Tag> : c.value)}
        />
      ) : <p><small>{t('microbiology.case.patientHistory.none', 'No earlier micro cases for this patient.')}</small></p>}
      <p><small>{t('microbiology.case.patientHistory.help', 'Earlier micro cases for this patient, any order, lab units you hold rights in. A Treatment follow-up case also shows its baseline TB case and the results by treatment month.')}</small></p>
    </Tile>
  );
}

function CaseHeader() {
  const { ex, labUnit, setLabUnit, program } = useEx();
  const [changing, setChanging] = useState(false);
  const [history, setHistory] = useState(false);
  const track = PROGRAM_TRACKS[program];
  return (
    <Tile>
      <Grid condensed>
        <Column lg={4}><small>{t('label.patient', 'Patient')}</small><div>{ex.patient}</div></Column>
        <Column lg={4}><small>{ex.samples.length > 1 ? t('microbiology.case.samples', 'Samples') : t('label.sample', 'Sample')}</small><div>{ex.sampleSummary}</div></Column>
        <Column lg={4}><small>{t('label.bodySite', 'Body site')}</small><div>{ex.site}</div></Column>
        {ex.samples.some((x) => x.set) && ex.samples.length > 1 && (
          <Column lg={8}><small>{t('microbiology.case.cultureSet.summary', '{test}: {sets} sets, {bottles} bottles').replace('{test}', 'Blood culture').replace('{sets}', String(new Set(ex.samples.map((x) => x.set)).size)).replace('{bottles}', String(ex.samples.length))}</small>
            {[...new Set(ex.samples.map((x) => x.set))].map((n) => { const b = ex.samples.filter((x) => x.set === n); return <div key={n}><small>{t('microbiology.case.header.setLine', 'Set {0}: {1}, {2}, {3}').replace('{0}', n).replace('{1}', b[0].site.split('·').pop().trim()).replace('{2}', b[0].at.split(' ').pop()).replace('{3}', 'aerobic and anaerobic')}</small></div>; })}</Column>
        )}
        <Column lg={4}><small>{t('microbiology.case.program', 'Program')}</small>
          <div>{program || t('microbiology.case.programNotSet', 'Program not set')} {track && <Tag type={track === 'TB' ? 'purple' : 'teal'} size="sm">{track} track</Tag>}</div>
          <small>Set in Case information; brings its questions and decides the exports (D-178)</small></Column>
        <Column lg={4}><small>{t('microbiology.case.labUnit', 'Lab unit')}</small>
          <div>{labUnit} <Button kind="ghost" size="sm" onClick={() => setChanging(!changing)}>{t('microbiology.case.changeLabUnit', 'Change lab unit')}</Button></div></Column>
        <Column lg={4}><small>{t('label.stage', 'Stage')}</small><div>{ex.stage.map(([k, l]) => <Tag key={l} type={k}>{l}</Tag>)}{ex.priority && <Tag type="red">{ex.priority}</Tag>}</div></Column>
        <Column lg={6}>{ex.related && <><small>{t('microbiology.case.relatedOnSpecimen', 'Also on this specimen')}</small><div><Button kind="ghost" size="sm">{ex.related}</Button></div></>}</Column>
        <Column lg={2}>
          <OverflowMenu aria-label={t('label.moreActions', 'More actions')} iconDescription={t('label.moreActions', 'More actions')} flipped>
            <OverflowMenuItem itemText={t('microbiology.case.logCritical', 'Log critical notification')} />
            <OverflowMenuItem itemText={t('microbiology.case.reportNce', 'Report NCE')} />
            <OverflowMenuItem itemText={`${t('microbiology.case.patientHistory', 'Patient history')} (${ex.history.length})`} onClick={() => setHistory(!history)} />
          </OverflowMenu>
        </Column>
      </Grid>
      {history && <PatientHistory />}
      {changing && (
        <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <Select id="new-lu" labelText={t('microbiology.case.newLabUnit', 'New lab unit')} value={labUnit} onChange={(e) => setLabUnit(e.target.value)}
            helperText={t('microbiology.case.changeLabUnit.helper', 'Moves the case: Worklist and edit rights follow the new lab unit. Program and tests do not change; if that lab unit already has a case for this order and sample type, you can join it.')}>
            <SelectItem value="TB" text="TB" />
            <SelectItem value="Microbiology" text="Microbiology" />
          </Select>
          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button size="sm" onClick={() => setChanging(false)}>{t('button.save', 'Save')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setChanging(false)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </Tile>
      )}
      {ex.why && <InlineNotification kind="info" lowContrast hideCloseButton title={t('microbiology.case.whyOneCase', 'Why this is one case')} subtitle={ex.why} />}
    </Tile>
  );
}

/* ---------- Incoming results (A-09): one-click place buttons, no suggestion logic ---------- */
function IncomingResults({ items, isolates, onPlace }) {
  if (!items.length) return null;
  const places = [
    t('microbiology.case.section.initialTesting', 'Initial testing'),
    ...(isolates.length ? isolates.map((i) => `${t('microbiology.case.incoming.isolate', 'Isolate')}: ${i}`) : [t('microbiology.case.incoming.createIsolate', 'Create isolate and place')]),
    ...isolates.map((i) => `${t('microbiology.case.section.astDst', 'AST / DST')}: ${i}`),
    t('microbiology.case.section.additionalTesting', 'Additional testing'),
  ];
  return (
    <Section n="!" title={`${t('microbiology.case.section.incoming', 'Incoming results')} · ${t('microbiology.case.incoming.waiting', '{n} waiting').replace('{n}', items.length)}`} isNew>
      <p><small>{t('microbiology.case.incoming.help', 'Results for tests not yet on this case. One click places a result where you choose; the system does not guess. Use Move result to correct a placement.')}</small></p>
      <SimpleTable
        headers={[{ key: 'test', header: t('microbiology.case.incoming.col.test', 'Test') }, { key: 'value', header: t('microbiology.case.incoming.col.value', 'Value') }, { key: 'source', header: t('microbiology.case.incoming.col.source', 'Source') }, { key: 'received', header: t('microbiology.case.incoming.col.received', 'Received') }, { key: 'place', header: t('microbiology.case.incoming.col.placeIn', 'Place in') }]}
        rows={items.map((i) => ({ ...i, place: '' }))}
        render={(c, row) => {
          const item = items.find((i) => i.id === row.id) || {};
          const plus = (pl) => (item.linked && (pl.includes('ISO-') || pl.startsWith(t('microbiology.case.incoming.createIsolate', 'Create isolate and place'))) ? ` + ${item.linked.length} linked` : '');
          if (c.info.header === 'place') return <Stack orientation="horizontal" gap={2}>{places.map((pl) => <Button key={pl} size="sm" kind="tertiary" onClick={() => onPlace(row.id, pl, item)}>{pl}{plus(pl)}</Button>)}</Stack>;
          if (c.info.header === 'value' && item.linked) return <>{c.value}<div><small>{t('microbiology.case.incoming.linkedResults', '{count} linked results from the same message').replace('{count}', item.linked.length)}: {item.linked.map((l) => `${l[0]} ${l[1]}`).join('; ')}</small></div></>;
          return c.value;
        }}
      />
      <p><small>{t('microbiology.case.incoming.placementHelp', 'A placed or moved result shows Placed by or Moved from, and the validator confirms the placement (FR-09.7).')}</small></p>
    </Section>
  );
}

/* ---------- Case information (A-03): the Program's questionnaire decides the extra questions (FR-03.6, FR-03.7) ---------- */
function CaseInformation() {
  const { ex, program, setProgram, origin, setOrigin, admission, setAdmission, admMissing } = useEx();
  const [purpose, setPurpose] = useState('CLINICAL_DIAGNOSTIC');
  const track = PROGRAM_TRACKS[program];
  return (
    <Section n="1" title={t('microbiology.case.section.caseInfo', 'Case information')} isNew>
      <Grid condensed>
        <Column lg={4}>
          <Select id="program" labelText={`${t('microbiology.case.program', 'Program')} ◆`} value={program} onChange={(e) => setProgram(e.target.value)}
            helperText={t('microbiology.case.program.help', 'Its questionnaire shows below; its track decides the exports')}>
            <SelectItem value="" text={t('label.select', 'Select')} />
            {Object.keys(PROGRAM_TRACKS).map((p) => <SelectItem key={p} value={p} text={`${p} (${PROGRAM_TRACKS[p]})`} />)}
          </Select>
        </Column>
        <Column lg={4}>
          <Select id="purpose" labelText={`${t('microbiology.culturePurpose.label', 'Culture purpose')} *`} value={purpose} onChange={(e) => setPurpose(e.target.value)}
            helperText={t('microbiology.case.purpose.helper', 'Default Diagnostic. Only Diagnostic counts in the antibiogram and GLASS.')}>
            {PURPOSES.map(([v, l]) => <SelectItem key={v} value={v} text={l} />)}
          </Select>
        </Column>
        <Column lg={4}>
          <Select id="origin" labelText={`${t('microbiology.orderDetail.patientOrigin', 'Patient origin')} ◆`} value={origin} onChange={(e) => setOrigin(e.target.value)} helperText={t('microbiology.case.requiredBeforeFinal', 'Needed before final report')}>
            {['Outpatient', 'Inpatient', 'ICU', 'Emergency'].map((o) => <SelectItem key={o} value={o} text={o} />)}
          </Select>
        </Column>
        <Column lg={4}>{origin !== 'Outpatient'
          ? <TextInput id="adm" labelText={t('microbiology.orderDetail.admissionDate', 'Date of admission')} value={admission} onChange={(e) => setAdmission(e.target.value)} placeholder="DD/MM/YYYY"
              helperText={t('microbiology.case.neededForSurveillance', 'Needed for surveillance')} warn={admMissing}
              warnText={t('microbiology.case.neededForSurveillance.missing', 'Needed for surveillance; missing. Never blocks release.')} />
          : <TextInput id="adm" labelText={t('microbiology.orderDetail.admissionDate', 'Date of admission')} disabled placeholder={t('microbiology.orderDetail.admissionDateOutpatient', 'Outpatients are not admitted')} />}</Column>
        {ex.info.ward && <Column lg={4}><TextInput id="ward" labelText={t('microbiology.case.ward', 'Ward')} defaultValue={ex.info.ward} /></Column>}
        {track === 'Bacterial' && <Column lg={4}><TextInput id="io" labelText={t('microbiology.case.infectionOrigin', 'Infection origin (derived)')} value={origin === 'Outpatient' ? 'Community origin' : admission ? 'Hospital origin' : t('microbiology.case.infectionOrigin.unknown', 'Unknown (no admission date)')} readOnly helperText="More than 2 days after admission is hospital origin (GLASS)" /></Column>}
        <Column lg={8}><TextInput id="dx" labelText={t('microbiology.case.diagnosis', 'Clinical diagnosis / reason for test')} defaultValue={ex.info.diagnosis} /></Column>
        <Column lg={16}><ProgramQuestionnaire key={program} program={program} /></Column>
        <Column lg={4}><TextInput id="sets" labelText={t('microbiology.orderDetail.numberOfSets', 'Number of sets')} value={ex.info.sets} readOnly helperText="Counted from the samples" /></Column>
        <Column lg={16}>
          {/* FR-04.3: one row per sample, each with its own body site and collection time (a blood culture case lists every bottle) */}
          <h6>{t('microbiology.case.samples', 'Samples')}</h6>
          <SimpleTable
            headers={[{ key: 'no', header: t('label.sample', 'Sample') }, { key: 'type', header: 'Type · container' }, { key: 'set', header: t('microbiology.case.set', 'Set') }, { key: 'site', header: `${t('label.bodySite', 'Body site')} · side` }, { key: 'at', header: t('label.collected', 'Collected') }, { key: 'by', header: 'Collector' }, { key: 'act', header: '' }]}
            rows={ex.samples.map((s) => ({ ...s, act: '' }))}
            render={(c) => (c.info.header === 'act' ? <Button kind="ghost" size="sm">{t('microbiology.case.correctSite', 'Correct site')}</Button> : c.value)}
          />
        </Column>
        <Column lg={16}>
          <TextArea id="hist" labelText={t('microbiology.orderDetail.clinicalHistory', 'Clinical history')} rows={4} enableCounter maxCount={4000} defaultValue={ex.info.history}
            helperText={t('microbiology.case.appliesToOrder', 'Applies to all cases on this order')} />
        </Column>
      </Grid>
      <h6 style={{ marginTop: 'var(--cds-spacing-05)' }}>{t('microbiology.case.priorAntibiotics', 'Prior antibiotics')}</h6>
      <SimpleTable headers={[{ key: 'agent', header: t('label.agent', 'Agent') }, { key: 'date', header: t('label.dateStarted', 'Date started') }]} rows={ex.info.priorAb} />
      <Button kind="ghost" size="sm" renderIcon={Add}>{t('microbiology.case.addAntibiotic', 'Add antibiotic')}</Button>
    </Section>
  );
}

function CaseTestTable({ rows }) {
  const { labOnly, setLabOnly } = useEx();
  const [open, setOpen] = useState(null);
  const stateKindFor = (st) => (st === 'Validated' ? 'green' : st === 'Awaiting validation' ? 'warm-gray' : 'gray');
  return (
    <TableContainer>
      <Table size="sm" style={{ tableLayout: 'fixed' }}>
        <TableHead><TableRow>
          <TableHeader style={{ width: '19%' }}>{t('label.test', 'Test')}</TableHeader>
          <TableHeader style={{ width: '29%' }}>{t('label.result', 'Result')}</TableHeader>
          <TableHeader style={{ width: '8%' }}>{t('label.flag', 'Flag')}</TableHeader>
          <TableHeader style={{ width: '15%' }}>{t('microbiology.case.performedBy', 'Performed by')}</TableHeader>
          <TableHeader style={{ width: '11%' }}>{t('label.reagentLot', 'Reagent lot')}</TableHeader>
          <TableHeader style={{ width: '8%' }}>{t('label.status', 'Status')}</TableHeader>
          <TableHeader style={{ width: '10%' }} />
        </TableRow></TableHead>
        <TableBody>
          {rows.map((r) => (
            <React.Fragment key={r.id}>
              <TableRow>
                <TableCell>{r.test}<NoteCountTag id={r.id} />{r.on && <div><small>{t('label.on', 'On')} {r.on}</small></div>}
                  <div>{r.external && <Tag type="gray" size="sm">{t('microbiology.case.external', 'External result')}</Tag>}{labOnly[r.id] && <Tag type="purple" size="sm">{t('microbiology.case.inLabOnly', 'In lab only')}</Tag>}{r.addedBy && <Tag type="cool-gray" size="sm">{t('microbiology.case.addedBy', 'Added by {user}').replace('{user}', r.addedBy)}</Tag>}{r.placedBy && <Tag type="blue" size="sm">{r.placedBy}</Tag>}</div></TableCell>
                <TableCell style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{r.display || <em>{t('microbiology.case.result.notEntered', 'Not entered')}</em>}</TableCell>
                <TableCell>{r.flag ? <Tag type="red" size="sm">{r.flag}</Tag> : <small>{t('label.none', 'none')}</small>}</TableCell>
                <TableCell>{r.by || t('label.na', 'n/a')}</TableCell>
                <TableCell><small>{r.lot || (r.external ? t('microbiology.case.lot.external', 'n/a (external)') : t('label.na', 'n/a'))}</small></TableCell>
                <TableCell><Tag type={stateKindFor(r.state)} size="sm">{r.state}</Tag></TableCell>
                <TableCell>
                  <Stack orientation="horizontal" gap={1}>
                    <Button kind="ghost" size="sm" onClick={() => setOpen(open === r.id ? null : r.id)}>{r.display ? t('button.edit', 'Edit') : t('microbiology.case.result.enter', 'Enter')}</Button>
                    <OverflowMenu size="sm" aria-label={t('label.rowActions', 'Row actions')} iconDescription={t('label.rowActions', 'Row actions')} flipped>
                      <OverflowMenuItem itemText={labOnly[r.id] ? t('microbiology.case.inLabOnly.off', 'Turn off In lab only') : t('microbiology.case.inLabOnly.on', 'Mark In lab only')} onClick={() => setLabOnly({ ...labOnly, [r.id]: !labOnly[r.id] })} />
                      <OverflowMenuItem itemText={t('microbiology.case.moveResult', 'Move result')} />
                      <OverflowMenuItem itemText={t('microbiology.case.referTest', 'Refer this test')} />
                      <OverflowMenuItem itemText={t('microbiology.case.cancelTest', 'Cancel test')} isDelete />
                    </OverflowMenu>
                  </Stack>
                </TableCell>
              </TableRow>
              {open === r.id && <TableRow><TableCell colSpan={7}><ResultEditor row={r} onClose={() => setOpen(null)} printable={!labOnly[r.id]} /></TableCell></TableRow>}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/* ---------- The standard test and panel chooser (Clinical Order Entry v4 FR-B14), used in Initial testing, AST / DST and Additional testing (FR-06.2, FR-07.1a) ---------- */
function TestChooser({ id, ch, onAdd, onCancel }) {
  const [picked, setPicked] = useState([]);
  const [q, setQ] = useState(ch.q || '');
  const [on, setOn] = useState(ch.on ? ch.on[0] : '');
  const toggle = (x) => setPicked((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x]));
  const tests = ch.tests.filter((x) => !q || x.toLowerCase().includes(q.toLowerCase()));
  return (
    <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
      <p><small>{t('microbiology.case.chooser.help', 'The normal OpenELIS test and panel chooser (same component as order entry)')}, {ch.filter}.</small></p>
      <Checkbox id={`${id}-all-lu`} labelText={t('microbiology.case.chooser.allLabUnits', 'Show all lab units')} />
      {ch.on && (
        <Select id={`${id}-on`} labelText={`${t('microbiology.case.chooser.on', 'On')} *`} value={on} onChange={(e) => setOn(e.target.value)} helperText={ch.onHelp}>
          {ch.on.map((o) => <SelectItem key={o} value={o} text={o} />)}
        </Select>
      )}
      <ExistingFence owner="Clinical Order Entry v4 FR-B14 (two-list chooser)" additions="pre-filter to the case specimen, or to the isolate's organism in AST / DST; lab unit first">
        <Grid condensed>
          <Column lg={8}>
            <TextInput id={`${id}-ps`} labelText={t('order.chooser.panels', 'Order Panels')} placeholder={t('order.chooser.search', 'Search name, code or LOINC')} />
            {ch.panels.map((x) => <Checkbox key={x} id={`${id}-p-${x}`} labelText={x} checked={picked.includes(x)} onChange={() => toggle(x)} />)}
          </Column>
          <Column lg={8}>
            <TextInput id={`${id}-ts`} labelText={t('order.chooser.tests', 'Order Tests')} placeholder={t('order.chooser.search', 'Search name, code or LOINC')} value={q} onChange={(e) => setQ(e.target.value)} />
            {tests.map((x) => <Checkbox key={x} id={`${id}-t-${x}`} labelText={x} checked={picked.includes(x)} onChange={() => toggle(x)} />)}
          </Column>
        </Grid>
        <div>{picked.map((x) => <DismissibleTag key={x} type="blue" text={x} onClose={() => toggle(x)} />)}</div>
      </ExistingFence>
      <p><small>{ch.after}</small></p>
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button size="sm" disabled={!picked.length} onClick={() => onAdd(picked, on)}>{t('button.add', 'Add')}</Button>
        <Button size="sm" kind="ghost" onClick={onCancel}>{t('button.cancel', 'Cancel')}</Button>
      </Stack>
    </Tile>
  );
}

function InitialTesting() {
  const { ex, log } = useEx();
  const [rows, setRows] = useState(ex.initial);
  const [adding, setAdding] = useState(false);
  return (
    <Section n="2" title={t('microbiology.case.section.initialTesting', 'Initial testing')} isNew>
      {rows.length ? <CaseTestTable rows={rows} /> : <p><small>{ex.noInitial}</small></p>}
      {adding
        ? <TestChooser id="ch-init" ch={ex.choosers.initial} onCancel={() => setAdding(false)} onAdd={(p) => { setRows([...rows, ...p.map((x, k) => ({ id: `add${rows.length + k}`, test: x, type: 'graded', graded: [{ what: 'Pus cells', grade: 'Few' }], display: '', flag: '', by: '', state: 'Not started', addedBy: ex.tech }))]); p.forEach((x) => log(`Added ${x} to Initial testing, on the specimen`)); setAdding(false); }} />
        : <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setAdding(true)}>{t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Button>}
    </Section>
  );
}

/* ---------- Referral point (A-08): the order entry Refer out, reused ---------- */
function ReferralPoint() {
  const { ex } = useEx();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const rows = [...ex.referrals, ...(saved ? [{ id: 'rf-new', sample: ex.samples[0].no, type: ex.sampleType, tests: ex.referTests[0], lab: ex.refLabs[0], status: 'REQUESTED' }] : [])];
  const statusTag = { RECEIVED: ['teal', t('label.referOut.status.received', 'Received')], REQUESTED: ['blue', t('label.referOut.status.requested', 'Requested')] };
  return (
    <Section n="3" title={t('microbiology.case.section.referral', 'Referral point')} isNew>
      <ExistingFence owner="Clinical Order Entry v4 Refer out (OrderReferOutSection, OrderReferOutForm, ReferralStatusTag; built)" additions="what to refer (remaining work, a test, an isolate sample); Referred marker">
        {rows.length ? (
          <SimpleTable
            headers={[{ key: 'sample', header: t('label.referOut.column.sampleId', 'Sample') }, { key: 'type', header: t('label.referOut.column.sampleType', 'Sample type') }, { key: 'tests', header: t('label.referOut.column.tests', 'Tests') }, { key: 'lab', header: t('label.referOut.column.referringLab', 'Reference laboratory') }, { key: 'status', header: t('label.referOut.column.status', 'Status') }]}
            rows={rows}
            render={(c) => (c.info.header === 'status' ? <Tag type={statusTag[c.value][0]} size="sm">{statusTag[c.value][1]}</Tag> : c.value)}
          />
        ) : <p><small>{t('microbiology.case.referral.none', 'Nothing referred.')}</small></p>}
        {open && (
          <Tile>
            <Grid condensed>
              <Column lg={6}><ComboBox id="rl" titleText={`${t('label.referOut.field.referringLab', 'Reference laboratory')} *`} items={ex.refLabs} initialSelectedItem={ex.refLabs[0]} onChange={() => {}} /></Column>
              <Column lg={5}><Select id="rr" labelText={`${t('order.referral.reason', 'Reason for referral')} *`} defaultValue="na"><SelectItem value="na" text="Test not available" /><SelectItem value="conf" text="Confirmation" /></Select></Column>
              <Column lg={5}><TextInput id="rfr" labelText={t('referrer.label', 'Referrer')} defaultValue={ex.tech} /></Column>
              <Column lg={4}><TextInput id="hd" labelText={t('label.referOut.field.handoffDate', 'Hand-off date')} defaultValue="02/10/2026" /></Column>
              <Column lg={4}><TextInput id="ht" labelText={t('label.referOut.field.handoffTime', 'Hand-off time')} defaultValue="10:30" /></Column>
              <Column lg={4}><TextInput id="er" labelText={t('label.referOut.field.expectedReturnDate', 'Expected return date')} defaultValue="09/10/2026" /></Column>
            </Grid>
            <fieldset style={{ marginTop: 'var(--cds-spacing-05)' }}>
              <legend><small>{t('order.referral.testsToRefer', 'Tests to refer')}</small></legend>
              {ex.referTests.map((x, k) => <Checkbox key={x} id={`rt-${k}`} labelText={x} defaultChecked={k === 0} />)}
            </fieldset>
            <InlineNotification kind="warning" lowContrast hideCloseButton title={t('order.referral.partial', 'Tests not referred stay here, but this sample leaves the laboratory.')} />
            <Button kind="ghost" size="sm">{t('order.referral.aliquotFirst', 'Aliquot first')}</Button>
            <TextInput id="rn" labelText={t('label.referOut.field.notes', 'Notes')} />
            <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
              <Button size="sm" onClick={() => { setSaved(true); setOpen(false); }}>{t('label.referOut.action.save', 'Save referral')}</Button>
              <Button size="sm" kind="ghost" onClick={() => setOpen(false)}>{t('label.button.cancel', 'Cancel')}</Button>
            </Stack>
          </Tile>
        )}
      </ExistingFence>
      {!open && <Button kind="secondary" size="sm" onClick={() => setOpen(true)}>{t('microbiology.case.referRemaining', 'Refer remaining work')}</Button>}
      <p><small>{t('order.referral.dispatchLater', 'Dispatch the shipment after saving, from Sample Shipment.')}</small></p>
    </Section>
  );
}

/* ---------- Culture with the work-up under each row (A-05, A-10, D-173): no separate Growth work-up section ---------- */
// A culture can have several subcultures; each gets the next number for its parent (FR-10.1a)
const subSuffix = (parent) => { const last = parent.split('-').pop(); return parent.includes('-SUB-') ? `${last}.` : last; };
const nextSubIds = (rows, parent, count, lab) => {
  if (!parent) return [];
  const n0 = rows.filter((r) => r.from === parent).length;
  return Array.from({ length: count }, (_, k) => `BA-SUB-${lab}-${subSuffix(parent)}${n0 + k + 1}`);
};

function Culture() {
  const { ex, cultures: rows, setCultures: setRows, children, setChildren } = useEx();
  const [reading, setReading] = useState(null);
  const [notesFor, setNotesFor] = useState(null);
  const { notes } = useContext(NotesContext);
  const [form, setForm] = useState(null); // { kind: 'chooser' | 'sub' | 'pos' | 'ext', from }
  const [editChild, setEditChild] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [subCount, setSubCount] = useState(1);
  const [satm, setSatm] = useState('aerobic');
  const [timeFor, setTimeFor] = useState(null);
  const [timeVal, setTimeVal] = useState('');
  const [atm, setAtm] = useState(ex.template.rows[0].atm);
  const [temp, setTemp] = useState(ex.template.rows[0].temp);
  const ordered = useMemo(() => {
    const out = [];
    const walk = (parent, depth) => rows.forEach((r) => { if ((r.from || '') === parent) { out.push({ ...r, depth }); walk(r.id, depth + 1); } });
    walk('', 0);
    return out;
  }, [rows]);
  const setOutcome = (id, state) => setRows(rows.map((r) => (r.id === id ? { ...r, state, next: '', log: [...r.log, `Day ${r.day}: marked ${state.toLowerCase()}`] } : r)));
  const record = (id, v) => { setRows(rows.map((r) => (r.id === id ? { ...r, state: v === 'Significant growth' ? 'Positive' : 'Incubating', ...(v === 'Significant growth' ? { posAt: SERVER_NOW, posBy: ex.tech } : {}), log: [...r.log, `Day ${r.day}: ${v.toLowerCase()}`] } : r))); setReading(null); };
  // FR-05.4b and FR-10.1g: Positive at, and a reflex Gram stain (no result yet) under a blood culture bottle that turns positive
  const markPositive = (id, v) => {
    const r = rows.find((x) => x.id === id);
    setRows(rows.map((x) => (x.id === id ? positiveRow(x, v, ex.tech) : x)));
    if (r && r.state !== 'Positive' && r.bottle && !children.some((c) => c.from === id && c.test === 'Gram stain, culture')) {
      // FR-10.1g, D-189: an ordinary reflex rule on the culture result adds it
      setChildren([...children, newChild('Gram stain, culture', id, children.filter((c) => c.test.startsWith('Gram')).length + 1, { rule: 'Blood culture result = Positive: Gram stain, culture', inLabOnly: false, at: v })]);
    }
  };
  const open = (kind, r) => {
    setForm({ kind, from: r.id });
    if (kind === 'sub') { setSubCount(1); setPurpose(''); }
  };
  const addChild = (test, from) => {
    const c = newChild(test, from, children.filter((x) => (test.startsWith('Gram') ? x.test.startsWith('Gram') : !x.test.startsWith('Gram'))).length + 1, { at: SERVER_NOW });
    setChildren((prev) => [...prev, c]);
    return c.id;
  };
  const saveChild = (id, components) => setChildren(children.map((c) => (c.id === id ? { ...c, components, display: compDisplay(components), state: 'Awaiting validation', at: SERVER_NOW, by: ex.tech } : c)));
  const parent = form ? rows.find((r) => r.id === form.from) : null;
  const subParent = form && form.kind === 'sub' ? parent : null;
  const subIds = subParent ? nextSubIds(rows, subParent.id, subCount, ex.labShort) : [];
  const addSubs = () => {
    setRows([...rows, ...subIds.map((id) => ({ id, from: subParent.id, purpose, medium: 'Blood agar (sheep) plate', lot: 'BA-26-117', atm: satm, temp: 35, dur: 48, unit: 'Hours', every: 24, eunit: 'Hours', start: SERVER_NOW, ends: addTime(SERVER_NOW, 48, 'Hours'), next: addTime(SERVER_NOW, 24, 'Hours'), day: 1, state: 'Incubating', log: [] }))]);
    setForm(null);
  };
  const indent = (depth) => ({ display: 'inline-block', marginLeft: `calc(${depth} * var(--cds-spacing-07))` });
  return (
    <Section n="4" title={t('microbiology.case.section.culture', 'Culture')} isNew>
      <p><small>{ex.cultureNote} {t('microbiology.case.culture.help', 'Each culture is marked positive or no growth on its own; every positive row shows when it turned positive and the time to positivity to the minute. Every culture and subculture row has an Add menu: Gram stain (the chooser with Gram stain, culture picked), Test on this culture (the standard chooser: microscopy, rapid ID, tests on a culture from the catalog) and Subculture. In lab only decides whether a test reports, defaulted from the catalog.')}</small></p>
      <TableContainer>
        <Table size="sm">
          <TableHead><TableRow>
            <TableHeader>{t('microbiology.case.inoc.container', 'Container')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.medium', 'Medium')} · {t('microbiology.case.inoc.lot', 'Lot')} · {t('microbiology.case.inoc.atmosphere', 'Atmosphere')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.duration', 'Incubation duration')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.ends', 'Incubation ends')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.nextCheck', 'Next check')}</TableHeader>
            <TableHeader>{t('label.state', 'State')} · {t('label.result', 'Result')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.readLog', 'Read log')}</TableHeader>
            <TableHeader />
          </TableRow></TableHead>
          <TableBody>
            {ordered.map((r) => (
              <React.Fragment key={r.id}>
                <TableRow>
                  <TableCell>
                    <span style={indent(r.depth)}>
                      {r.depth > 0 && <small>↳ {t('microbiology.case.subculture', 'Subculture')} · </small>}{r.id}
                      {r.set && <div><small>{r.set}</small></div>}
                      {r.purpose && <div><small>{r.purpose}</small></div>}
                    </span>
                  </TableCell>
                  <TableCell>{r.medium}<div><small>{r.notTracked ? <Tag type="warm-gray" size="sm">{t('microbiology.case.inoc.notTrackedTag', 'Not tracked')}</Tag> : `${t('microbiology.case.inoc.lot', 'Lot')} ${r.lot}`} · {(ATMOSPHERES.find(([k]) => k === r.atm) || ['', r.atm])[1]} · {r.temp} °C</small></div></TableCell>
                  <TableCell>{r.dur} {r.unit}<ExtTags r={r} /><div><small>{r.bottle ? `Continuous (${r.analyzer})` : `${t('microbiology.case.inoc.checkEvery', 'Check every')} ${r.every} ${r.eunit}`}</small></div></TableCell>
                  <TableCell>
                    {/* FR-05.1e: Inoculated at is editable until the first reading; the Timeline keeps the old and new times */}
                    {timeFor === r.id ? (
                      <Stack orientation="horizontal" gap={2}>
                        <TextInput id={`at-${r.id}`} labelText="" hideLabel size="sm" value={timeVal} onChange={(e) => setTimeVal(e.target.value)} aria-label={t('microbiology.case.inoc.inoculatedAt', 'Inoculated at')} />
                        <Button kind="ghost" size="sm" onClick={() => { setRows(rows.map((x) => (x.id === r.id ? { ...x, start: timeVal } : x))); setTimeFor(null); }}>{t('common.save', 'Save')}</Button>
                      </Stack>
                    ) : (
                      <div><small>{t('microbiology.case.inoc.inoculatedAt', 'Inoculated at')} {r.start}</small>{r.log.length === 0 && r.state !== 'Positive' && <Button kind="ghost" size="sm" onClick={() => { setTimeFor(r.id); setTimeVal(r.start); }}>{t('microbiology.case.inoc.editTime', 'Edit time')}</Button>}</div>
                    )}
                    {r.ends}<div><small>{t('microbiology.case.inoc.dayOf', 'Day {n} of {N}').replace('{n}', r.day).replace('{N}', r.dur)}</small></div>
                  </TableCell>
                  <TableCell>{r.next || t('label.na', 'n/a')}</TableCell>
                  <TableCell>{r.state === 'Positive' ? <PositiveState r={r} onEdit={() => open('pos', r)} /> : <Tag type={stateKind(r.state)} size="sm">{r.state}</Tag>}</TableCell>
                  <TableCell><small>{r.log.join(' · ')}</small></TableCell>
                  <TableCell>
                    {reading === r.id ? (
                      <Select id={`rd-${r.id}`} labelText="" hideLabel size="sm" defaultValue="" onChange={(e) => record(r.id, e.target.value)}>
                        <SelectItem value="" text={`${t('microbiology.case.inoc.recordReading', 'Record reading')} (Dictionary: Culture reading)`} />
                        {['No growth', 'Normal flora', 'Mixed growth', 'Significant growth'].map((v) => <SelectItem key={v} value={v} text={v} />)}
                      </Select>
                    ) : (
                      <Stack orientation="horizontal" gap={1}>
                        {/* FR-10.1: the same Add menu on every culture and subculture row */}
                        <OverflowMenu size="sm" aria-label={t('microbiology.case.culture.add', 'Add')} iconDescription={t('microbiology.case.culture.add', 'Add')} renderIcon={Add} flipped>
                          {/* D-183: Gram stain is the chooser with Gram stain, culture already picked; Test on this culture is the standard chooser */}
                          <OverflowMenuItem itemText={t('microbiology.case.gram.add', 'Gram stain')} onClick={() => setEditChild(addChild('Gram stain, culture', r.id))} />
                          <OverflowMenuItem itemText={t('microbiology.case.growth.testOnCulture', 'Test on this culture')} onClick={() => open('chooser', r)} />
                          <OverflowMenuItem itemText={t('microbiology.case.subculture', 'Subculture')} onClick={() => open('sub', r)} />
                        </OverflowMenu>
                        <OverflowMenu size="sm" aria-label={t('label.rowActions', 'Row actions')} iconDescription={t('label.rowActions', 'Row actions')} flipped>
                          {(r.state === 'Check due' || r.state === 'Incubating') && !r.bottle && <OverflowMenuItem itemText={t('microbiology.case.inoc.recordReading', 'Record reading')} onClick={() => setReading(r.id)} />}
                          {(r.state === 'Check due' || r.state === 'Incubating') && <OverflowMenuItem itemText={t('microbiology.case.inoc.markPositive', 'Mark positive')} onClick={() => open('pos', r)} />}
                          {(r.state === 'Check due' || r.state === 'Incubating') && <OverflowMenuItem itemText={t('microbiology.case.inoc.markNoGrowth', 'Mark no growth')} onClick={() => setOutcome(r.id, 'No growth')} />}
                          {(r.state === 'Check due' || r.state === 'Incubating') && <OverflowMenuItem itemText={t('microbiology.case.reading.contaminated', 'Contaminated')} onClick={() => setOutcome(r.id, 'Contaminated')} />}
                          {/* FR-05.3a: Extend incubation on any open row, including a plate with growth too young to read or pick; not on a flagged bottle */}
                          {r.state !== 'No growth' && r.state !== 'Contaminated' && !(r.bottle && r.state === 'Positive') && <OverflowMenuItem itemText={t('microbiology.case.inoc.extend', 'Extend incubation')} onClick={() => open('ext', r)} />}
                          <OverflowMenuItem itemText={t('microbiology.case.printLabel', 'Print label')} />
                        </OverflowMenu>
                        <Button kind="ghost" size="sm" onClick={() => setNotesFor(notesFor === r.id ? null : r.id)}>{noteCountLabel(notes, r.id)}</Button>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
                {children.filter((m) => m.from === r.id).map((m) => (
                  <React.Fragment key={m.id}>
                    <TableRow>
                      <TableCell>
                        <span style={indent(r.depth + 1)}>
                          <small>↳ {t('label.test', 'Test')} · </small>{m.id}
                          {m.rule && <div><Tag type="teal" size="sm">{t('microbiology.case.addedByRule', 'Added by rule')}: {m.rule}</Tag></div>}
                        </span>
                      </TableCell>
                      <TableCell colSpan={3}>{m.test} {m.inLabOnly && <Tag type="purple" size="sm">{t('microbiology.case.inLabOnly', 'In lab only')}</Tag>}
                        <div>{m.display ? <strong>{m.display}</strong> : <em>{t('microbiology.case.gram.noResult', 'No result yet')}</em>}</div></TableCell>
                      <TableCell><small>{m.at || ''}</small></TableCell>
                      <TableCell><Tag type={m.state === 'Validated' ? 'green' : m.state === 'Awaiting validation' ? 'warm-gray' : 'purple'} size="sm">{m.state}</Tag></TableCell>
                      <TableCell><small>{m.by}</small></TableCell>
                      <TableCell>
                        <Stack orientation="horizontal" gap={1}>
                          {!m.display && <Button kind="tertiary" size="sm" onClick={() => setEditChild(m.id)}>{t('microbiology.case.gram.enterResult', 'Enter result')}</Button>}
                          {m.display && m.state !== 'Validated' && <Button kind="ghost" size="sm" onClick={() => setEditChild(m.id)}>{t('label.edit', 'Edit')}</Button>}
                          {m.display && m.state !== 'Validated' && <Button kind="ghost" size="sm" onClick={() => setChildren(children.map((c) => (c.id === m.id ? { ...c, state: 'Validated' } : c)))}>{t('label.validate', 'Validate')}</Button>}
                          <OverflowMenu size="sm" aria-label={t('label.rowActions', 'Row actions')} iconDescription={t('label.rowActions', 'Row actions')} flipped>
                            <OverflowMenuItem itemText={m.inLabOnly ? t('microbiology.case.inLabOnly.off', 'Turn off In lab only') : t('microbiology.case.inLabOnly.on', 'Mark In lab only')} onClick={() => setChildren(children.map((c) => (c.id === m.id ? { ...c, inLabOnly: !c.inLabOnly } : c)))} />
                            <OverflowMenuItem itemText={t('microbiology.case.cancelTest', 'Cancel test')} isDelete />
                          </OverflowMenu>
                          <Button kind="ghost" size="sm" onClick={() => setNotesFor(notesFor === m.id ? null : m.id)}>{noteCountLabel(notes, m.id)}</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    {editChild === m.id && <TableRow><TableCell colSpan={8}><ChildEditor m={m} onCancel={() => setEditChild(null)} onSave={(cs) => { saveChild(m.id, cs); setEditChild(null); }} /></TableCell></TableRow>}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {notesFor && <NotesSection id={notesFor} underCulture />}
      {form && form.kind === 'pos' && <PositiveAt row={parent} onCancel={() => setForm(null)} onSave={(v) => { markPositive(parent.id, v); setForm(null); }} />}
      {form && form.kind === 'ext' && <ExtendIncubation row={parent} onCancel={() => setForm(null)} onSave={(x) => { setRows(rows.map((r) => (r.id === parent.id ? extendRow(r, x, ex.tech) : r))); setForm(null); }} />}
      {form && form.kind === 'chooser' && <TestChooser id="ch-cul" ch={ex.choosers.culture} onCancel={() => setForm(null)} onAdd={(p) => { p.forEach((x) => addChild(x, form.from)); setForm(null); }} />}
      {subParent && (
        <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <h6>{t('microbiology.case.subculture', 'Subculture')} · {t('microbiology.case.subculture.fromCulture', 'From culture')}: {subParent.id}</h6>
          <Grid condensed>
            {subParent.state !== 'Positive' && (
              <Column lg={6}>
                <Select id="spurpose" labelText={`${t('microbiology.case.subculture.purpose', 'Purpose')} *`} value={purpose} onChange={(e) => setPurpose(e.target.value)} helperText="Dictionary: Subculture purpose">
                  <SelectItem value="" text={t('label.select', 'Select')} />
                  <SelectItem value="Enrichment" text={t('microbiology.case.subculture.purpose.enrichment', 'Enrichment')} />
                  <SelectItem value="Blind or terminal subculture" text={t('microbiology.case.subculture.purpose.blind', 'Blind or terminal subculture')} />
                  <SelectItem value="Purity" text={t('microbiology.case.subculture.purpose.purity', 'Purity')} />
                  <SelectItem value="Other" text={t('microbiology.case.subculture.purpose.other', 'Other')} />
                </Select>
              </Column>
            )}
            <MediumPicker id="sub" onPrefill={(m) => setSatm(m.atm)} />
            <Column lg={5}>
              <Select id="satm" labelText={`${t('microbiology.case.inoc.atmosphere', 'Atmosphere')} *`} value={satm} onChange={(e) => setSatm(e.target.value)}>
                {ATMOSPHERES.map(([k, l]) => <SelectItem key={k} value={k} text={l} />)}
              </Select>
            </Column>
            {subIds.map((id, k) => <Column lg={4} key={id}><TextInput id={`scid-${k}`} labelText={`${t('microbiology.case.inoc.container', 'Container identifier')} *`} defaultValue={id} /></Column>)}
          </Grid>
          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button size="sm" kind="ghost" renderIcon={Add} onClick={() => setSubCount(subCount + 1)}>{t('microbiology.case.subculture.addMedium', '+ Add another medium')}</Button>
            <Button size="sm" disabled={subParent.state !== 'Positive' && !purpose} onClick={addSubs}>{subCount > 1 ? `Add ${subCount} subcultures` : t('microbiology.case.subculture.add', 'Add subculture')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setForm(null)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </Tile>
      )}
      <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <h6>{t('microbiology.case.inoc.start', 'Start inoculation')}</h6>
        <TemplateProposal template={ex.template} />
        <p><small>{t('microbiology.case.inoc.oneRow', 'Or add one row (pre-filled from the previous row):')}</small></p>
        <Grid condensed>
          <MediumPicker id="inoc" onPrefill={(m) => { setAtm(m.atm); setTemp(m.temp); }} />
          <Column lg={6}>
            <Select id="atm" labelText={`${t('microbiology.case.inoc.atmosphere', 'Atmosphere')} *`} value={atm} onChange={(e) => setAtm(e.target.value)}
              helperText={t('microbiology.case.inoc.atmosphere.prefill', "Pre-filled from the medium's usual atmosphere when Inventory records one (Dictionary: Culture atmosphere)")}>
              {ATMOSPHERES.map(([k, l]) => <SelectItem key={k} value={k} text={l} />)}
            </Select>
          </Column>
          <Column lg={4}><TextInput id="cid" labelText={`${t('microbiology.case.inoc.container', 'Container identifier')} *`} defaultValue={ex.nextContainer} /></Column>
          <Column lg={4}><NumberInput id="temp" label={t('microbiology.case.inoc.temperature', 'Temperature (°C)')} value={temp} min={20} max={45} onChange={(e, { value }) => setTemp(value)} /></Column>
          <Column lg={2}><NumberInput id="dur" label={`${t('microbiology.case.inoc.duration', 'Incubation duration')} *`} value={ex.template.rows[0].dur} min={1} /></Column>
          <Column lg={2}>
            <Select id="dunit" labelText={t('microbiology.case.inoc.unit', 'Unit')} defaultValue={ex.template.rows[0].unit}>
              <SelectItem value="Hours" text={t('microbiology.case.inoc.unit.hours', 'Hours')} />
              <SelectItem value="Days" text={t('microbiology.case.inoc.unit.days', 'Days')} />
            </Select>
          </Column>
          <Column lg={2}><NumberInput id="every" label={t('microbiology.case.inoc.checkEvery', 'Check every')} value={ex.template.rows[0].every || 1} min={1} /></Column>
          <Column lg={8}>
            <ExistingFence owner="M-12 reagent lot picker (built), for other reagents linked to the test" additions="none">
              <Select id="lot" labelText={t('label.reagentLot', 'Reagent lot')}><SelectItem value="l1" text={ex.otherReagent} /></Select>
            </ExistingFence>
          </Column>
        </Grid>
      </Tile>
    </Section>
  );
}

/* ---------- Isolates (existing, plus Picked from) ---------- */
function Isolates() {
  const { ex, cultures, isolates, setIsolates } = useEx();
  const [adding, setAdding] = useState(false);
  const [notesOpen, setNotesOpen] = useState(null);
  const [draft, setDraft] = useState({ from: '', gram: '', sig: 'Unknown' });
  const { notes } = useContext(NotesContext);
  const growth = cultures.filter((r) => r.state === 'Positive');
  return (
    <Section n="5" title={t('microbiology.case.section.isolates', 'Isolates')}>
      <ExistingFence owner="M-04 IsolatePanel (built)" additions="Picked from column and field; isolate sample item for its own tests (FR-10.1c); Notes on the isolate (FR-13.1a)">
        <SimpleTable
          headers={[{ key: 'iso', header: t('microbiology.case.isolate', 'Isolate') }, { key: 'from', header: t('microbiology.case.isolate.pickedFrom', 'Picked from') }, { key: 'gram', header: t('microbiology.case.isolate.gram', 'Gram / morphology') }, { key: 'org', header: t('microbiology.case.organism', 'Organism') }, { key: 'idm', header: t('microbiology.case.idMethod', 'ID method · confidence') }, { key: 'sig', header: t('microbiology.case.significance', 'Significance') }, { key: 'act', header: '' }]}
          rows={isolates.map((i) => ({ ...i, act: '' }))}
          render={(c, row) => {
            if (c.info.header === 'sig') return <Tag type={c.value === 'Clinically significant' ? 'green' : 'gray'} size="sm">{c.value}</Tag>;
            if (c.info.header === 'org') return c.value || <Button kind="ghost" size="sm">{t('microbiology.case.isolate.identify', 'Identify')}</Button>;
            if (c.info.header === 'act') return (
              <Stack orientation="horizontal" gap={1}>
                <Button kind="ghost" size="sm" onClick={() => setNotesOpen(notesOpen === row.id ? null : row.id)}>{noteCountLabel(notes, row.id)}</Button>
                <Button kind="ghost" size="sm">{t('microbiology.case.printLabel', 'Print label')}</Button>
              </Stack>
            );
            return c.value;
          }}
        />
        {notesOpen && <NotesSection id={notesOpen} />}
      </ExistingFence>
      {ex.isoNote && <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>{ex.isoNote}</Tile>}
      {adding ? (
        <Tile>
          <Grid condensed>
            <Column lg={5}>
              <Select id="pf" labelText={`${t('microbiology.case.isolate.pickedFrom', 'Picked from')} *`} value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} helperText={t('microbiology.case.isolate.pickedFromHelp', 'One positive culture can give several isolates')}>
                <SelectItem value="" text={t('microbiology.case.isolate.selectSource', 'Select a culture with growth')} />
                {growth.map((r) => <SelectItem key={r.id} value={r.id} text={`${r.id}, ${r.medium}`} />)}
              </Select>
            </Column>
            <Column lg={3}><TextInput id="lbl" labelText={`${t('microbiology.case.isolate.label', 'Label')} *`} value={`ISO-${isolates.length + 1}`} readOnly /></Column>
            <Column lg={4}>
              <Select id="igram" labelText={`${t('microbiology.case.isolate.gram', 'Gram stain')} *`} value={draft.gram} onChange={(e) => setDraft({ ...draft, gram: e.target.value })}>
                <SelectItem value="" text={t('label.select', 'Select')} />
                {ex.isoGrams.map((g) => <SelectItem key={g} value={g} text={g} />)}
              </Select>
            </Column>
            <Column lg={4}>
              <Select id="isig" labelText={`${t('microbiology.case.significance', 'Significance')} *`} value={draft.sig} onChange={(e) => setDraft({ ...draft, sig: e.target.value })}>
                {['Unknown', 'Clinically significant', 'Contaminant', 'Normal flora'].map((s) => <SelectItem key={s} value={s} text={s} />)}
              </Select>
            </Column>
          </Grid>
          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button size="sm" disabled={!draft.from || !draft.gram} onClick={() => { setIsolates([...isolates, { id: `ISO-${isolates.length + 1}`, iso: `ISO-${isolates.length + 1}`, from: draft.from, gram: draft.gram, org: '', idm: '', sig: draft.sig }]); setAdding(false); setDraft({ from: '', gram: '', sig: 'Unknown' }); }}>{t('microbiology.case.isolate.create', 'Create isolate')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setAdding(false)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </Tile>
      ) : <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setAdding(true)}>{t('microbiology.case.isolate.add', 'Add isolate')}</Button>}
    </Section>
  );
}

/* ---------- AST / DST (existing, plus panels per isolate and the standard chooser) ---------- */
function AstDst() {
  const { ex, isolates, validated, setValidated, log } = useEx();
  const [bp, setBp] = useState(ex.ast.bp);
  const [panels, setPanels] = useState(ex.astPanels);
  const [adding, setAdding] = useState(false);
  return (
    <Section n="6" title={t('microbiology.case.section.astDst', 'AST / DST')}>
      <SimpleTable
        key={panels.length}
        headers={[{ key: 'panel', header: t('microbiology.case.ast.panels', 'Panels') }, { key: 'on', header: t('label.on', 'On') }, { key: 'added', header: t('label.added', 'Added') }, { key: 'method', header: t('microbiology.case.ast.methodStandard', 'Method · standard') }, { key: 'val', header: t('label.validation', 'Validation') }]}
        rows={panels}
        render={(c) => (c.info.header === 'added' && c.value === 'Organism default' ? <Tag type="teal" size="sm">{c.value}</Tag> : c.info.header === 'val' ? <Tag type={c.value === 'Awaiting validation' ? (validated ? 'green' : 'warm-gray') : 'gray'} size="sm">{c.value === 'Awaiting validation' && validated ? 'Validated' : c.value}</Tag> : c.value)}
      />
      <ExistingFence owner="M-05 AstEntryPanel, AstAttemptTable (built)" additions="breakpoint default from the organism, with a reason for another; Validate run wording">
        <Grid condensed>
          <Column lg={4}>
            <Select id="ast-iso" labelText={`${t('microbiology.case.isolate', 'Isolate')} *`}>{isolates.map((i) => <SelectItem key={i.id} value={i.id} text={`${i.id} ${i.org || '(not identified)'}`} />)}</Select>
          </Column>
          <Column lg={6}>
            <Select id="bp" labelText={`${t('microbiology.case.ast.breakpointStandard', 'Breakpoint standard')} *`} value={bp} onChange={(e) => setBp(e.target.value)} helperText={ex.ast.bpHelp}>
              <SelectItem value="WHO critical concentrations 2024" text="WHO critical concentrations 2024" />
              <SelectItem value="CLSI M100 36th ed. (2026)" text="CLSI M100 36th ed. (2026)" />
              <SelectItem value="EUCAST v15.0 (2025)" text="EUCAST v15.0 (2025)" />
            </Select>
          </Column>
          {bp !== ex.ast.bp && <Column lg={6}><TextInput id="bpr" labelText={`${t('microbiology.case.bpStandard.reason', 'Reason for another breakpoint standard')} *`} /></Column>}
        </Grid>
        <p><small>{ex.ast.runNote}</small></p>
        <SimpleTable
          headers={[{ key: 'drug', header: ex.ast.agentLabel }, { key: 'raw', header: t('label.raw', 'Raw') }, { key: 'source', header: t('label.source', 'Source') }, { key: 'matchedBy', header: t('microbiology.ast.matchedBy', 'Matched by') }, { key: 'interp', header: t('label.interpretation', 'Interpretation') }, { key: 'note', header: t('label.note', 'Note') }]}
          rows={ex.ast.readings}
          render={(c) => (c.info.header === 'interp' ? <Tag type={interpTag(c.value)} size="sm">{c.value}</Tag> : c.value)}
        />
        <Stack orientation="horizontal" gap={3}>
          <Button size="sm" kind="secondary">{t('microbiology.ast.recordReading', 'Record reading')}</Button>
          {ex.ast.blocked
            ? <Button size="sm" disabled>{ex.ast.blocked}</Button>
            : <Button size="sm" kind={validated ? 'secondary' : 'primary'} onClick={() => setValidated(!validated)}>{validated ? t('microbiology.case.ast.undoValidate', 'Undo validation') : t('microbiology.case.ast.validateRun', 'Validate run: Accept results')}</Button>}
          <Button size="sm" kind="ghost">{t('microbiology.ast.newAttempt', 'New attempt')}</Button>
        </Stack>
      </ExistingFence>
      {ex.ast.rule && <p><Tag type="teal" size="sm">{t('microbiology.case.addedByRule', 'Added by rule')}: {ex.ast.rule[0]}</Tag> <small>{ex.ast.rule[1]}</small></p>}
      <div style={{ marginTop: 'var(--cds-spacing-05)' }}>
        {ex.ast.classLabel} ({t('microbiology.case.derived', 'derived from organism and results')}): {ex.ast.classTags.map((c) => <Tag key={c} type="red">{c}</Tag>)} <small>{ex.ast.classNote}</small>
      </div>
      {adding
        ? <TestChooser id="ch-ast" ch={ex.choosers.ast} onCancel={() => setAdding(false)} onAdd={(p, on) => { setPanels([...panels, ...p.map((x, k) => ({ id: `pa${panels.length + k}`, panel: x, on: on.split(' ')[0], added: t('microbiology.case.addedBy', 'Added by {user}').replace('{user}', ex.tech), method: `${ex.ast.method} · ${bp}`, val: 'Not started' }))]); p.forEach((x) => log(`Added ${x} to AST / DST, on ${on.split(' ')[0]}`)); setAdding(false); }} />
        : <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setAdding(true)}>{t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Button>}
    </Section>
  );
}

/* ---------- Additional testing (A-15): same table, editor and chooser as Initial testing ---------- */
function AdditionalTesting() {
  const { ex, log } = useEx();
  const [rows, setRows] = useState(ex.additional);
  const [adding, setAdding] = useState(false);
  return (
    <Section n="7" title={t('microbiology.case.section.additionalTesting', 'Additional testing')} isNew>
      {rows.length ? <CaseTestTable rows={rows} /> : <p><small>{t('microbiology.case.additional.none', 'No additional tests.')}</small></p>}
      {adding
        ? <TestChooser id="ch-add" ch={ex.choosers.additional} onCancel={() => setAdding(false)} onAdd={(p, on) => { setRows([...rows, ...p.map((x, k) => ({ id: `addl${rows.length + k}`, test: x, on, type: 'coded', opts: ['Detected', 'Not detected'], display: '', flag: '', by: '', state: 'Not started', addedBy: ex.tech }))]); p.forEach((x) => log(`Added ${x} to Additional testing, on ${on}`)); setAdding(false); }} />
        : <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setAdding(true)}>{t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Button>}
    </Section>
  );
}

/* ---------- Critical communication, NCE (existing) ---------- */
function CriticalCommunication() {
  const { ex } = useEx();
  return (
    <Section n="8" title={t('microbiology.case.section.critical', 'Critical communication')}>
      <ExistingFence owner="M-11 CriticalCommunicationPanel (built)" additions="required Outcome on each call; each call also writes a critical_callback row (A-18)">
        <SimpleTable
          headers={[{ key: 'target', header: t('label.target', 'Target') }, { key: 'to', header: t('label.recipient', 'Recipient') }, { key: 'method', header: t('label.method', 'Method') }, { key: 'msg', header: t('label.message', 'Message') }, { key: 'outcome', header: t('microbiology.case.critical.outcome', 'Outcome') }, { key: 'status', header: t('label.status', 'Status') }]}
          rows={ex.critical}
          render={(c) => (c.info.header === 'status' ? <Tag type={c.value === 'Open' ? 'warm-gray' : c.value === 'Closed' ? 'green' : 'blue'} size="sm">{c.value}</Tag> : c.value)}
        />
      </ExistingFence>
    </Section>
  );
}

function Nonconformance() {
  return (
    <Section n="9" title={t('microbiology.case.section.nce', 'Nonconformance')}>
      <ExistingFence owner="M-04 CaseNonconformancePanel (built)" additions="none">
        <p><small>{t('microbiology.case.nce.none', 'No NCE on this case.')}</small></p>
      </ExistingFence>
    </Section>
  );
}

/* ---------- Report (A-11, A-17): choices and the printed block grouped under four sub-headers (OGC-1111 FR-A42a, D-181) ---------- */
const PRINT_GROUPS = [['initial', t('report.patient.micro.group.initial', 'Initial testing')], ['culture', t('report.patient.micro.group.culture', 'Culture')], ['ast', t('report.patient.micro.group.ast', 'AST / DST')], ['additional', t('report.patient.micro.group.additional', 'Additional testing')]];
function ReportPrint({ items }) {
  const { ex, labUnit } = useEx();
  const line = (r, k) => (
    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--cds-spacing-05)', paddingLeft: r.ind ? 'var(--cds-spacing-05)' : 0, borderLeft: r.bar ? '2px solid var(--cds-text-primary)' : 0, fontWeight: r.b ? 600 : 400 }}>
      <span>{r.t}</span>{r.r && <span style={{ fontWeight: r.rb === false ? 400 : 600, fontStyle: r.ri ? 'italic' : 'normal' }}>{r.r}</span>}
    </div>
  );
  return (
    <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
      <strong style={{ textTransform: 'uppercase' }}>{labUnit}</strong>
      {PRINT_GROUPS.map(([g, label]) => {
        let lastIso = null;
        const rows = [];
        items.filter((i) => i.group === g && !i.derived).forEach((i) => { if (i.iso && i.iso !== lastIso) { rows.push({ t: i.isoLabel, b: true }); lastIso = i.iso; } rows.push(...i.print); });
        const derived = items.filter((i) => i.group === g && i.derived).flatMap((i) => i.print);
        if (!rows.length && !derived.length) return null;
        return (
          <div key={g} className="print-group" data-group={g} style={{ marginTop: 'var(--cds-spacing-03)' }}>
            <strong>{label}</strong>
            {rows.map(line)}{derived.map((r, k) => line(r, `d${k}`))}
          </div>
        );
      })}
      {ex.report.callback && <p><small><em>{ex.report.callback}</em></small></p>}
      <p><small>{t('microbiology.case.report.printsIn', 'How it prints inside the patient report (OGC-1111 §7.4, FR-A42a): sub-headers in this order; a group with nothing ticked is left out.')}</small></p>
    </Tile>
  );
}

function Report() {
  const { ex, children, labOnly, validated, program, admMissing } = useEx();
  const [sel, setSel] = useState(Object.fromEntries(ex.report.items.map((i) => [i.k, i.on])));
  // tests on a culture that are not In lab only are culture results (FR-11.2), printed once validated
  const gramItems = children.filter((m) => m.kind === 'test' && !m.inLabOnly && m.display).map((m) => ({ k: m.id, group: 'culture', order: 11, sec: `Culture · ${m.id}`, label: `${m.test} on ${m.from}: ${m.display}`, d: m.state === 'Validated' ? 'On' : 'On, prints once validated', on: true, print: m.state === 'Validated' ? [{ t: `${m.test} (${m.from})`, r: m.display, ind: 1 }] : [] }));
  const items = [...ex.report.items, ...gramItems].filter((i) => !i.hideIf || !labOnly[i.hideIf]).sort((a, b) => (a.order || 0) - (b.order || 0));
  const isOn = (i) => (sel[i.k] !== undefined ? sel[i.k] : i.on);
  const checklist = ex.report.checklist.map((c) => (c === 'ast' ? (validated ? 'AST run 1 validated' : 'AST run 1 not validated') : c === 'program' ? (program ? 'Program set' : 'Program not set') : c));
  return (
    <Section n="10" title={t('microbiology.case.section.report', 'Report')}>
      <Grid condensed>
        <Column lg={8}>
          <TableContainer>
            <Table size="sm">
              <TableHead><TableRow>
                <TableHeader>{t('microbiology.case.report.include', 'Report')}</TableHeader>
                <TableHeader>{t('label.result', 'Result')}</TableHeader>
                <TableHeader>{t('label.default', 'Default')}</TableHeader>
              </TableRow></TableHead>
              <TableBody>{PRINT_GROUPS.map(([g, label]) => {
                const its = items.filter((i) => i.group === g);
                if (!its.length) return null;
                return (
                  <React.Fragment key={g}>
                    <TableRow><TableCell colSpan={3}><strong>{label}</strong></TableCell></TableRow>
                    {its.map((i) => (
                      <TableRow key={i.k}>
                        <TableCell><Checkbox id={`rep-${i.k}`} labelText="" hideLabel checked={isOn(i)} onChange={(e, { checked }) => setSel({ ...sel, [i.k]: checked })} /></TableCell>
                        <TableCell><small>{i.sec}</small><div>{i.label}</div></TableCell>
                        <TableCell><small>{i.d}</small></TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}</TableBody>
            </Table>
          </TableContainer>
          <p><small>{t('microbiology.case.report.choicesHelp', 'Grouped the way the report prints. Microscopy exams, Gram stains with Report this result off and In lab only tests are never listed. Changing a default is recorded on the Timeline.')}</small></p>
        </Column>
        <Column lg={8}>
          <InlineNotification kind="warning" lowContrast hideCloseButton title={t('microbiology.case.report.finalChecklist', 'Final report checklist')} subtitle={checklist.join(' · ')} />
          {admMissing && <InlineNotification kind="info" lowContrast hideCloseButton title={t('microbiology.case.report.surveillanceNote', 'Does not block release')} subtitle={t('microbiology.case.report.admissionMissing', 'Admission date missing: exports with infection origin Unknown')} />}
          <SimpleTable
            headers={[{ key: 'type', header: t('microbiology.case.report.release', 'Release') }, { key: 'when', header: t('label.releasedBy', 'Released') }]}
            rows={ex.report.releases}
          />
          <ReportPrint items={items.filter(isOn)} />
          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button size="sm" kind="secondary">{t('microbiology.case.report.releasePartial', 'Release partial report')}</Button>
            <Button size="sm" disabled>{t('microbiology.case.report.releaseFinal', 'Release final')}</Button>
          </Stack>
          <p><small>{PROGRAM_TRACKS[program] === 'Bacterial' ? 'Bacterial track: after final release the isolate goes to the WHONET and GLASS-AMR exports.' : PROGRAM_TRACKS[program] === 'TB' ? 'TB track: the case goes to the NTP and GLASS-TB exports.' : 'No track until a Program is set.'}</small></p>
        </Column>
      </Grid>
    </Section>
  );
}

function AmendmentAndTimeline() {
  const { timeline } = useEx();
  return (
    <>
      <Section n="11" title={t('microbiology.case.section.amendment', 'Amendment')}>
        <ExistingFence owner="M-04 AmendmentHistoryPanel (built)" additions="every change after final routes through an open amendment (A-17)">
          <p><small>{t('microbiology.case.amendment.none', 'Available after final release.')}</small></p>
        </ExistingFence>
      </Section>
      <Section n="12" title={t('microbiology.case.section.timeline', 'Timeline')}>
        <ExistingFence owner="M-04 CaseTimelinePanel (built)" additions="new event types (lab unit change, readings, placements, moves, In lab only, extensions, Positive at edits, rule-added Gram stains, tests added by hand)">
          <SimpleTable headers={[{ key: 'when', header: t('label.when', 'When') }, { key: 'what', header: t('label.event', 'Event') }]} rows={timeline} />
        </ExistingFence>
      </Section>
    </>
  );
}

/* ---------- Case view: one component, any example (TB_EX, BC_EX) ---------- */
export function MicrobiologyCaseView({ example = TB_EX }) {
  const ex = example;
  const [labUnit, setLabUnit] = useState(ex.labUnit);
  const [program, setProgram] = useState(ex.program);
  const [incoming, setIncoming] = useState(ex.incoming);
  const [cultures, setCultures] = useState(ex.cultures);
  const [children, setChildren] = useState(ex.children);
  const [isolates, setIsolates] = useState(ex.isolates);
  const [labOnly, setLabOnly] = useState(ex.labOnly);
  const [validated, setValidated] = useState(false);
  const [media, setMedia] = useState(MEDIA_SEED);
  const [notes, setNotes] = useState(ex.notes);
  const addNote = (id, n) => setNotes((prev) => ({ ...prev, [id]: [...(prev[id] || []), n] }));
  // FR-03.5, D-211: admission date is Needed for surveillance for anyone not an outpatient; it never blocks
  const [origin, setOrigin] = useState(ex.info.origin);
  const [admission, setAdmission] = useState(ex.info.admission);
  const admMissing = origin !== 'Outpatient' && !admission;
  // FR-07.2c, FR-09.7: added tests and placements go to the Timeline
  const [timeline, setTimeline] = useState(ex.timeline);
  const log = (what) => setTimeline((x) => [{ id: `l${x.length}`, when: SERVER_NOW, what: `${what} · ${ex.tech}` }, ...x]);
  const ctx = { ex, labUnit, setLabUnit, program, setProgram, cultures, setCultures, children, setChildren, isolates, setIsolates, labOnly, setLabOnly, validated, setValidated, origin, setOrigin, admission, setAdmission, admMissing, timeline, log };
  return (
    <CaseExample.Provider value={ctx}>
    <NotesContext.Provider value={{ notes, addNote }}>
    <MediaContext.Provider value={{ media, setMedia }}>
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t('home.label', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('microbiology.navigation.title', 'Microbiology')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('microbiology.navigation.worklist', 'Worklist')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('microbiology.case.title', 'Case {labNumber}').replace('{labNumber}', ex.lab)}</BreadcrumbItem>
      </Breadcrumb>
      <CaseHeader />
      <Accordion>
        <IncomingResults items={incoming} isolates={isolates.map((i) => i.id)} onPlace={(id, pl, item) => { log(`Placed ${item.test} from Incoming results in ${pl}${item.linked && pl.includes('ISO-') ? ` with ${item.linked.length} linked results from the same message` : ''}`); setIncoming(incoming.filter((i) => i.id !== id)); }} />
        <CaseInformation />
        <InitialTesting />
        <ReferralPoint />
        <Culture />
        <Isolates />
        <AstDst />
        <AdditionalTesting />
        <CriticalCommunication />
        <Nonconformance />
        <Report />
        <AmendmentAndTimeline />
      </Accordion>
    </Stack>
    </MediaContext.Provider>
    </NotesContext.Provider>
    </CaseExample.Provider>
  );
}

/* ---------- Worklist: Needs attention (A-12) ---------- */
/* ---------- Worklist bench work (FR-12.6, D-172): no run, no batch record ---------- */
const AWAITING = [
  { id: 'a1', lab: 'CPHL26-004820', who: 'Grace Wari', spec: 'Urine, midstream', st: 'Urine', rec: '01 Oct 08:10' },
  { id: 'a2', lab: 'CPHL26-004821', who: 'Peter Gima', spec: 'Urine, catheter', st: 'Urine', rec: '01 Oct 08:22' },
  { id: 'a3', lab: 'CPHL26-004823', who: 'Lucy Bona', spec: 'Urine, midstream', st: 'Urine', rec: '01 Oct 08:40' },
  { id: 'a4', lab: 'CPHL26-004827', who: 'Ruth Kaupa', spec: 'Wound swab, left foot', st: 'Wound swab', rec: '01 Oct 09:12' },
];
const DUE_ROWS = [
  { id: 'd1', kind: 'check', cid: 'CPHL26-004790-CLED-1', lab: 'CPHL26-004790', who: 'Mary Siune', med: 'CLED agar plate', day: 'Day 1 of 2', over: 6 },
  { id: 'd1b', kind: 'check', cid: 'CPHL26-004790-BA-1', lab: 'CPHL26-004790', who: 'Mary Siune', med: 'Blood agar (sheep) plate', day: 'Day 1 of 2', over: 6 },
  { id: 'd2', kind: 'check', cid: 'LJ-004812-B', lab: 'CPHL26-004812', who: 'Kila Nou', med: 'Löwenstein-Jensen slope', day: 'Day 35 of 56', stat: true },
  { id: 'd3', kind: 'final', cid: 'CPHL26-004801-CLED-1', lab: 'CPHL26-004801', who: 'Tom Ila', med: 'CLED agar plate', day: 'Day 2 of 2' },
  { id: 'd3b', kind: 'final', cid: 'CPHL26-004801-BA-1', lab: 'CPHL26-004801', who: 'Tom Ila', med: 'Blood agar (sheep) plate', day: 'Day 2 of 2' },
  { id: 'd4', kind: 'final', cid: 'CPHL26-004802-CLED-1', lab: 'CPHL26-004802', who: 'Anna Raka', med: 'CLED agar plate', day: 'Day 2 of 2', growth: 'Significant growth on Day 1' },
  { id: 'd4b', kind: 'final', cid: 'CPHL26-004802-BA-1', lab: 'CPHL26-004802', who: 'Anna Raka', med: 'Blood agar (sheep) plate', day: 'Day 2 of 2' },
  { id: 'd5', kind: 'final', cid: 'BC-004795-A', lab: 'CPHL26-004795', who: 'Ruth Kaupa', med: 'BACTEC Plus Aerobic/F bottle', day: 'Day 5 of 5', instr: true },
  { id: 'd5b', kind: 'final', cid: 'BC-004795-B', lab: 'CPHL26-004795', who: 'Ruth Kaupa', med: 'BACTEC Lytic/10 Anaerobic/F bottle', day: 'Day 5 of 5', instr: true },
];
const INOC_TEMPLATE = { sampleType: 'Urine', name: 'Bacterial culture, Urine (CLED agar plate, Blood agar (sheep) plate)', media: [{ code: 'CLED', name: 'CLED agar plate', lots: ['CLED-26-201, exp 11/2026', 'CLED-26-188, exp 10/2026 (expiring)'] }, { code: 'BA', name: 'Blood agar (sheep) plate', lots: ['BA-26-117, exp 10/2026', 'BA-26-121, exp 12/2026'] }] };
const skipReason = (r) => (r.instr ? t('microbiology.worklist.skip.instrumentNegative', 'needs Confirm (instrument negative)') : r.growth ? t('microbiology.worklist.skip.growthRecorded', 'growth already recorded, open the case') : null);

// FR-12.6c: one template and one lot per tracked medium for many cases; an inline Tile, not a modal (D-005)
function InoculatePanel({ cases, onSave, onCancel }) {
  const [lots, setLots] = useState({});
  const missing = INOC_TEMPLATE.media.filter((m) => !lots[m.code]).map((m) => m.name);
  return (
    <Tile style={{ borderLeft: '4px solid var(--cds-border-interactive)' }}>
      <Stack gap={4}>
        <strong>{t('microbiology.worklist.inoculate', `Inoculate (${cases.length})`)}</strong>
        <Grid narrow>
          <Column lg={4}><TextInput id="inoc-at" size="sm" labelText={t('microbiology.case.inoc.inoculatedAt', 'Inoculated at')} defaultValue="02 Oct 09:30" helperText="Defaults to the save time (FR-05.1e)" /></Column>
          <Column lg={4}><Select id="inoc-tpl" labelText={`${t('microbiology.worklist.template', 'Plating template')} (${INOC_TEMPLATE.sampleType})`} size="sm"><SelectItem value="u" text={INOC_TEMPLATE.name} /></Select></Column>
          {INOC_TEMPLATE.media.map((m) => (
            <Column lg={5} key={m.code}>
              <Select id={`inoc-lot-${m.code}`} labelText={`Lot for ${m.name} (tracked) *`} size="sm" value={lots[m.code] || ''} onChange={(e) => setLots({ ...lots, [m.code]: e.target.value })}>
                <SelectItem value="" text={t('microbiology.worklist.chooseLot', 'Choose a lot')} />
                {m.lots.map((l) => <SelectItem key={l} value={l} text={l} />)}
              </Select>
            </Column>
          ))}
        </Grid>
        <small>{t('microbiology.worklist.inoculateSummary', `Creates ${cases.length * INOC_TEMPLATE.media.length} plates on ${cases.length} cases: ${INOC_TEMPLATE.media.map((m) => `${m.code} ${cases.length}`).join(', ')}`)}. Container IDs {cases[0].lab}-CLED-1 and so on; lots recorded, stock not changed (D-169).</small>
        <Stack orientation="horizontal" gap={3}>
          <Button size="sm" disabled={missing.length > 0} onClick={() => onSave(lots)}>{t('common.save', 'Save')}</Button>
          <Button size="sm" kind="ghost" onClick={onCancel}>{t('common.cancel', 'Cancel')}</Button>
        </Stack>
      </Stack>
    </Tile>
  );
}

/* ---------- Bench sheet (FR-12.7, D-174): print-ready page from a Worklist filter; Open sheet reopens it by number ---------- */
const SHEET_TITLES = { attention: 'Needs attention', awaiting: 'Awaiting inoculation', check: 'Check due', final: 'Final read due' };
const SHEET_TEMPLATES = { Urine: ['CLED agar plate', 'Blood agar (sheep) plate'] };
// reading sheets group by medium, inoculation sheets by sample type, then lab number (FR-12.7b)
const sheetGroups = (sheet) => {
  if (sheet.chip === 'attention') return [['', sheet.rows]];
  const key = sheet.chip === 'awaiting' ? (r) => r.st : (r) => r.med;
  const out = [];
  [...sheet.rows].sort((a, b) => `${key(a)}${a.lab}`.localeCompare(`${key(b)}${b.lab}`)).forEach((r) => {
    let g = out.find((x) => x[0] === key(r));
    if (!g) { g = [key(r), []]; out.push(g); }
    g[1].push(r);
  });
  return out;
};

// The printed page is a print stylesheet view (not Carbon components): black on white, A4 or Letter portrait
function BenchSheetPrint({ sheet, onClose }) {
  const reading = sheet.chip === 'check' || sheet.chip === 'final';
  const box = <span style={{ display: 'inline-block', width: 14, height: 14, border: '1.5px solid #000', verticalAlign: 'middle' }} />;
  const line = (w) => <span style={{ display: 'inline-block', width: w, borderBottom: '1px solid #000', height: 16 }} />;
  const cell = { borderBottom: '1px solid #c6c6c6', padding: '6px 4px', verticalAlign: 'top' };
  return (
    <Stack gap={4}>
      <Stack orientation="horizontal" gap={3} className="no-print">
        <Button size="sm" onClick={() => window.print()}>{t('label.print', 'Print')}</Button>
        <Button size="sm" kind="ghost" onClick={onClose}>{t('button.close', 'Close')}</Button>
      </Stack>
      <div className="bench-sheet" style={{ background: '#fff', color: '#000', padding: '24px 28px', maxWidth: 794 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 12 }}>{sheet.labName} · {sheet.labUnit}</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{t('workplan.type.microBench', 'Workplan · Microbiology bench')}: {sheet.title}{sheet.reprint ? ` (${t('microbiology.sheet.reprintMark', 'Reprint')})` : ''}</div>
            <div style={{ fontSize: 12 }}>{t('microbiology.sheet.printedBy', `Printed by ${sheet.by}, ${sheet.at}`)} · {sheet.rows.length} rows · {sheet.scope}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>{sheet.no}</div>
            {/* barcode of the sheet number (Code 128), scanned by Open sheet */}
            <div aria-label={`barcode ${sheet.no}`} style={{ height: 32, width: 170, background: 'repeating-linear-gradient(90deg,#000 0 2px,#fff 2px 3px,#000 3px 4px,#fff 4px 7px)' }} />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '1.5px solid #000' }}>
            <th>{t('microbiology.sheet.col.tick', 'Done')}</th><th>{t('label.labNumber', 'Lab number')}</th><th>{t('microbiology.worklist.subject', 'Patient or site')}</th>
            {reading ? <><th>{t('microbiology.case.inoc.container', 'Container')} · day</th><th>{t('microbiology.sheet.col.reading', 'Reading')}</th><th>{t('microbiology.sheet.col.quantity', 'Quantity')}</th></>
              : sheet.chip === 'awaiting' ? <><th>{t('label.specimen', 'Specimen')}</th><th>Media to plate</th></> : <><th>Why</th><th>{t('microbiology.sheet.col.notes', 'Notes')}</th></>}
            <th>{t('microbiology.sheet.col.initials', 'Initials')}</th>
          </tr></thead>
          <tbody>
            {sheetGroups(sheet).map(([g, rows]) => (
              <React.Fragment key={g || 'all'}>
                {g && <tr><td colSpan={7} style={{ ...cell, background: '#e0e0e0', fontWeight: 600 }}>{g} ({rows.length})</td></tr>}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={cell}>{box}</td>
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}><strong>{r.lab}</strong></td>
                    <td style={cell}>{r.who}</td>
                    {reading ? <>
                      <td style={{ ...cell, fontSize: 11 }}>{r.cid} · {r.day} · {r.kind === 'final' ? 'Final' : 'Check'}</td>
                      <td style={cell}>{r.instr ? <small>{t('microbiology.sheet.confirmOnScreen', 'Confirm on screen')}</small> : line(56)}</td>
                      <td style={cell}>{r.instr ? null : line(80)}</td>
                    </> : sheet.chip === 'awaiting' ? <>
                      <td style={{ ...cell, fontSize: 12 }}>{r.spec}</td>
                      <td style={{ ...cell, fontSize: 12 }}>{SHEET_TEMPLATES[r.st] ? SHEET_TEMPLATES[r.st].map((m) => <div key={m}>{box} {m}</div>) : <div>{t('microbiology.sheet.noTemplate', 'No template: write the media')}<div>{line(150)}</div></div>}</td>
                    </> : <>
                      <td style={{ ...cell, fontSize: 12 }}>{(r.reasons || []).join(', ')}</td>
                      <td style={cell}>{line(150)}</td>
                    </>}
                    <td style={cell}>{line(48)}</td>
                  </tr>
                ))}
                {sheet.chip === 'awaiting' && SHEET_TEMPLATES[g] && (
                  <tr><td colSpan={7} style={{ ...cell, fontSize: 12 }}>{SHEET_TEMPLATES[g].map((m) => <span key={m} style={{ marginRight: 24 }}>{t('microbiology.sheet.lotUsed', 'Lot used')}, {m}: {line(110)}</span>)}</td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div style={{ borderTop: '1px solid #000', marginTop: 10, paddingTop: 6, fontSize: 11, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{reading ? t('microbiology.sheet.codes', 'Reading codes: NG No growth, NF Normal flora, MG Mixed growth, SG Significant growth (write the quantity), C Contaminated') : ''}</span>
          <span>{t('microbiology.sheet.confidential', 'Contains patient information. Shred after use.')} · {sheet.no} · {t('microbiology.sheet.page', 'Page 1 of 1')}</span>
        </div>
      </div>
    </Stack>
  );
}

export function MicrobiologyWorklist() {
  const [grain, setGrain] = useState(0);
  const [filter, setFilter] = useState('attention');
  const [selected, setSelected] = useState([]);
  const [due, setDue] = useState(DUE_ROWS);
  const [awaiting, setAwaiting] = useState(AWAITING);
  const [inoculating, setInoculating] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [sheets, setSheets] = useState([{ no: 'BS-261001-07', chip: 'final', title: SHEET_TITLES.final, labName: 'Central Public Health Laboratory, Port Moresby', labUnit: 'Microbiology', by: 'J. Kaupa', at: '01 Oct 2026 16:10', scope: 'all rows in the filter', rows: DUE_ROWS.filter((r) => r.kind === 'final') }]);
  const [sheetView, setSheetView] = useState(null);
  const [openSheet, setOpenSheet] = useState(null);
  const [sheetPick, setSheetPick] = useState(false);
  const [sheetNo, setSheetNo] = useState('');
  const [done, setDone] = useState({});
  const [rows, setRows] = useState([
    { id: 'w0', lab: 'CPHL26-004828', who: 'Joseph Aisi', unit: 'Microbiology', type: '', spec: 'Wound swab (Microbiology case test, no tests yet)', reasons: ['Program not set'], day: 'Received 08:12' },
    { id: 'w1', lab: 'CPHL26-004812', who: 'Kila Nou', unit: 'TB', type: 'TB Program', spec: 'Sputum', reasons: ['Check due', 'Incoming results'], day: 'Day 35 of 42' },
    { id: 'w2', lab: 'CPHL26-004801', who: 'Tom Ila', unit: 'Microbiology', type: 'Bacteriology (routine)', spec: 'Urine', reasons: ['Incubation complete'], day: 'Day 2 of 2' },
    { id: 'w3', lab: 'CPHL26-004702', who: 'Tau Morea', unit: 'TB', type: 'TB Program', spec: 'Sputum', reasons: ['Referral returned'], day: 'Referred' },
    { id: 'w4', lab: 'CPHL26-004795', who: 'Ruth Kaupa', unit: 'Microbiology', type: 'Bacteriology (routine)', spec: 'Blood culture, 2 sets', reasons: ['Instrument negative to confirm'], day: 'Day 5 of 5' },
  ]);
  const say = (msg, undo) => setToast({ msg, undo });
  const [wlExt, setWlExt] = useState(null); // FR-12.6e: Extend 24 h on a Final read due row
  const [wlExtReason, setWlExtReason] = useState('');
  const byUrgency = (a, b) => (b.stat ? 1 : 0) - (a.stat ? 1 : 0) || (b.over || 0) - (a.over || 0); // D-199: STAT first, then most overdue
  const checks = due.filter((r) => r.kind === 'check').sort(byUrgency);
  const finals = due.filter((r) => r.kind === 'final').sort(byUrgency);
  const filterList = filter === 'check' ? checks : filter === 'final' ? finals : filter === 'awaiting' ? awaiting : [];
  // FR-12.7c: an open sheet shows its rows in the printed order; rows recorded since printing show what was recorded
  const list = openSheet && openSheet.chip !== 'attention'
    ? sheetGroups(openSheet).flatMap(([, rs]) => rs.map((r) => ({ ...r, gone: !(due.some((d) => d.id === r.id) || awaiting.some((a) => a.id === r.id)) })))
    : filterList;
  const picked = list.filter((r) => selected.includes(r.id));
  const go = picked.filter((r) => !skipReason(r));
  const skipped = picked.filter((r) => skipReason(r));
  const otherType = filter === 'awaiting' && picked.length ? picked.filter((p) => p.st !== picked[0].st) : [];
  const refusal = otherType.length ? t('microbiology.worklist.oneSampleType', `Inoculate needs one sample type: ${otherType.length} selected case is ${otherType[0].st}`) : '';

  // FR-12.6a / FR-12.6b: a check records the reading and sets the next check; a final read also records the row outcome
  const recordNoGrowth = (targets) => {
    const ok = targets.filter((r) => !skipReason(r));
    const before = due;
    setDue(due.filter((r) => !ok.some((g) => g.id === r.id)));
    setDone((d) => ({ ...d, ...Object.fromEntries(ok.map((r) => [r.id, 'No growth recorded by you'])) }));
    setSelected([]);
    const finalsDone = ok.filter((r) => r.kind === 'final').length;
    say(`${t('microbiology.worklist.recorded', `No growth recorded on ${ok.length} rows`)}${finalsDone ? `; ${finalsDone} final reads also record the row outcome` : '; next checks set'}.`, () => setDue(before));
  };

  const printSheet = () => {
    const chosen = picked.length ? picked : filter === 'attention' ? rows : filterList;
    const sheet = { no: `BS-261002-0${sheets.length + 2}`, chip: filter, title: SHEET_TITLES[filter], labName: 'Central Public Health Laboratory, Port Moresby', labUnit: 'Microbiology', by: 'J. Kaupa', at: '02 Oct 2026 08:05', scope: picked.length ? 'selected rows' : 'all rows in the filter', rows: chosen };
    setSheets([sheet, ...sheets]); setSheetView(sheet);
  };
  const openByNo = (no) => {
    const sheet = sheets.find((x) => x.no === no.trim());
    if (!sheet) { say(`No sheet ${no} in the last 7 days.`); return; }
    setOpenSheet(sheet); setFilter(sheet.chip); setSheetPick(false); setSelected([]);
  };
  if (sheetView) return <BenchSheetPrint sheet={sheetView} onClose={() => setSheetView(null)} />;

  const tiles = [
    [t('microbiology.worklist.card.attention', 'Needs attention'), rows.length],
    [t('microbiology.worklist.summary.incubating', 'Incubating'), 31],
    [t('microbiology.worklist.summary.positive', 'Positive'), 9],
    [t('microbiology.worklist.summary.growthDetected', 'Growth detected'), 7],
    [t('microbiology.worklist.summary.caseReview', 'Case review'), 6],
  ];
  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t('home.label', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('microbiology.navigation.title', 'Microbiology')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('microbiology.navigation.worklist', 'Worklist')}</BreadcrumbItem>
      </Breadcrumb>
      <ExistingFence owner="M-07 MicrobiologyWorklist (built): Cultures and AST views, tiles, filters, Due column, pagination" additions="Needs attention tile and filter, Program filter, reasons; Awaiting inoculation, Check due and Final read due filters with selection, No growth and Inoculate (FR-12.6)">
        <ContentSwitcher selectedIndex={grain} onChange={({ index }) => setGrain(index)} size="sm">
          <Switch name="cultures" text={t('microbiology.worklist.grain.cultures', 'Cultures')} />
          <Switch name="ast" text={t('microbiology.worklist.grain.ast', 'AST')} />
        </ContentSwitcher>
        <Grid condensed style={{ marginTop: 'var(--cds-spacing-05)' }}>
          {tiles.map(([l, n], i) => (
            <Column lg={3} key={l}><ClickableTile><small>{l}</small><h3>{n}</h3>{i === 0 && <Tag type="blue" size="sm">v2</Tag>}</ClickableTile></Column>
          ))}
        </Grid>
      </ExistingFence>
      <Grid condensed>
        <Column lg={4}>
          <Select id="ctype" labelText={t('microbiology.worklist.filter.program', 'Program')} defaultValue="all">
            <SelectItem value="all" text={t('microbiology.worklist.filter.all', 'All')} />
            <SelectItem value="tb" text="TB Program" />
            <SelectItem value="amr" text="AMR surveillance" />
            <SelectItem value="bac" text="Bacteriology (routine)" />
            <SelectItem value="myc" text="Mycology" />
          </Select>
        </Column>
        <Column lg={4}>
          <Select id="lu" labelText={t('microbiology.worklist.filter.labUnit', 'Lab unit')} defaultValue="all">
            <SelectItem value="all" text="All (TB, Microbiology)" />
            <SelectItem value="tb" text="TB" />
            <SelectItem value="micro" text="Microbiology" />
          </Select>
        </Column>
        <Column lg={8}><Button kind="ghost" renderIcon={Renew}>{t('microbiology.worklist.refresh', 'Refresh')}</Button></Column>
      </Grid>
      <div style={{ display: 'flex', gap: 'var(--cds-spacing-04)', alignItems: 'center', flexWrap: 'wrap' }}>
        {[['attention', t('microbiology.worklist.card.attention', 'Needs attention'), rows.length], ['awaiting', t('microbiology.worklist.awaitingInoculation', 'Awaiting inoculation'), awaiting.length], ['check', t('microbiology.worklist.checkDue', 'Check due'), checks.length], ['final', t('microbiology.worklist.finalReadDue', 'Final read due'), finals.length]].map(([k, l, n]) => (
          <Tag key={k} type={filter === k ? 'high-contrast' : 'outline'} onClick={() => { setFilter(k); setSelected([]); setInoculating(false); setOpenSheet(null); }} style={{ cursor: 'pointer' }}>{l} {n}</Tag>
        ))}
        <span style={{ flex: 1 }} />
        {(filter === 'check' || filter === 'final') && <Button size="sm" disabled={!go.length} onClick={() => recordNoGrowth(picked)}>{t('microbiology.worklist.noGrowthBulk', `No growth (${go.length})`)}</Button>}
        {filter === 'awaiting' && <Button size="sm" disabled={!picked.length || !!refusal} onClick={() => setInoculating(true)}>{t('microbiology.worklist.inoculate', `Inoculate (${picked.length})`)}</Button>}
        {!openSheet && <Button size="sm" kind="tertiary" onClick={printSheet}>{t('microbiology.worklist.printSheet', 'Print workplan')}{picked.length ? ` (${picked.length})` : ''}</Button>}
        <Button size="sm" kind="ghost" onClick={() => setSheetPick(!sheetPick)}>{t('microbiology.worklist.openSheet', 'Open sheet')}</Button>
      </div>
      {sheetPick && (
        <Tile>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'flex-end' }}>
            <TextInput id="sheet-no" size="sm" labelText="Sheet number (type or scan the barcode)" placeholder="BS-261001-07" value={sheetNo} onChange={(e) => setSheetNo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') openByNo(sheetNo); }} />
            <Button size="sm" onClick={() => openByNo(sheetNo)}>Open</Button>
          </Stack>
          <p style={{ marginTop: 'var(--cds-spacing-03)' }}><small>Your sheets, last 7 days</small></p>
          {sheets.map((x) => <div key={x.no}><Button kind="ghost" size="sm" onClick={() => openByNo(x.no)}>{x.no}</Button> <small>{x.title} · {x.rows.length} rows · {x.at}</small></div>)}
        </Tile>
      )}
      {openSheet && (
        <Tile>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>{t('microbiology.sheet.banner', `Sheet ${openSheet.no}: ${openSheet.title}, printed by ${openSheet.by}, ${openSheet.at}`)}</strong>
            <small>Same rows, same order as the paper.</small>
            <span style={{ flex: 1 }} />
            <Button size="sm" kind="tertiary" onClick={() => setSheetView({ ...openSheet, reprint: true })}>{t('microbiology.worklist.reprint', 'Reprint')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setOpenSheet(null)}>{t('microbiology.worklist.closeSheet', 'Close sheet')}</Button>
          </Stack>
        </Tile>
      )}
      {(filter === 'check' || filter === 'final') && picked.length > 0 && (
        <small>
          {t('microbiology.worklist.noGrowthSummary', `Records No growth on ${go.length} rows: ${go.filter((r) => r.kind === 'check').length} checks, ${go.filter((r) => r.kind === 'final').length} final reads`)}.
          {skipped.length > 0 && ` ${t('microbiology.worklist.skipped', `${skipped.length} will be skipped`)}: ${skipped.map((r) => `${r.cid} ${skipReason(r)}`).join('; ')}.`}
        </small>
      )}
      {refusal && <small style={{ color: 'var(--cds-text-error)' }}>{refusal}</small>}
      {inoculating && (
        <InoculatePanel cases={picked} onCancel={() => setInoculating(false)}
          onSave={() => { const before = awaiting; const n = picked.length; setAwaiting(awaiting.filter((a) => !picked.some((p) => p.id === a.id))); setSelected([]); setInoculating(false); say(`${n} cases inoculated: ${n * INOC_TEMPLATE.media.length} culture rows created. Print plate labels (${n * INOC_TEMPLATE.media.length})?`, () => setAwaiting(before)); }} />
      )}
      {filter === 'attention' ? (
        <SimpleTable
          key="attention"
          headers={[
            { key: 'lab', header: t('label.labNumber', 'Lab number') },
            { key: 'who', header: t('microbiology.worklist.subject', 'Patient or site') },
            { key: 'type', header: t('microbiology.case.program', 'Program') },
            { key: 'unit', header: t('microbiology.case.labUnit', 'Lab unit') },
            { key: 'spec', header: t('label.specimen', 'Specimen') },
            { key: 'reasons', header: t('microbiology.worklist.reason', 'Why it needs attention') },
            { key: 'day', header: t('microbiology.worklist.column.due', 'Due') },
            { key: 'act', header: '' },
          ]}
          rows={rows.map((r) => ({ ...r, reasons: r.reasons.join('|'), act: '' }))}
          render={(c, row) => {
            const r = rows.find((x) => x.id === row.id);
            if (!r) return null;
            if (c.info.header === 'reasons') return r.reasons.map((x) => <Tag key={x} type={x === 'Incubation complete' ? 'red' : x === 'Check due' ? 'warm-gray' : x === 'Program not set' ? 'blue' : 'purple'} size="sm">{x}</Tag>);
            if (c.info.header === 'type') return r.type || t('microbiology.case.programNotSet', 'Program not set');
            if (c.info.header === 'act') {
              // FR-03.7: a case opened by a case test has no Program until the technician sets it
              if (r.reasons.includes('Program not set')) return (
                <Select id={`prog-${r.id}`} labelText="" hideLabel size="sm" defaultValue="" aria-label={t('microbiology.case.program', 'Program')}
                  onChange={(e) => { setRows(rows.map((x) => (x.id === r.id ? { ...x, type: e.target.value, reasons: x.reasons.filter((y) => y !== 'Program not set') } : x))); say(`${r.lab}: Program ${e.target.value} set.`); }}>
                  <SelectItem value="" text={t('microbiology.case.program', 'Program')} disabled />
                  {['Bacteriology (routine)', 'AMR surveillance', 'TB Program'].map((v) => <SelectItem key={v} value={v} text={v} />)}
                </Select>
              );
              if (r.reasons.includes('Instrument negative to confirm')) return confirmed
                ? <small>{t('microbiology.case.inoc.instrumentNegativeConfirmed', 'No growth, protocol complete: confirmed')}</small>
                : <Button kind="ghost" size="sm" onClick={() => setConfirmed(true)}>{t('microbiology.case.inoc.confirm', 'Confirm')} ({t('microbiology.case.inoc.instrumentNegative', 'No growth, protocol complete (instrument)')})</Button>;
              return null;
            }
            return c.value;
          }}
        />
      ) : (
        <SimpleTable
          key={`${filter}-${openSheet ? openSheet.no : ''}`}
          headers={[{ key: 'pick', header: '' }, ...(filter === 'awaiting'
            ? [{ key: 'lab', header: t('label.labNumber', 'Lab number') }, { key: 'who', header: t('microbiology.worklist.subject', 'Patient or site') }, { key: 'spec', header: t('label.specimen', 'Specimen') }, { key: 'rec', header: t('label.received', 'Received') }]
            : [{ key: 'cid', header: t('microbiology.case.inoc.container', 'Container') }, { key: 'lab', header: t('label.labNumber', 'Lab number') }, { key: 'who', header: t('microbiology.worklist.subject', 'Patient or site') }, { key: 'med', header: t('microbiology.case.inoc.medium', 'Medium') }, { key: 'day', header: t('microbiology.worklist.column.due', 'Due') }, { key: 'act', header: '' }])]}
          rows={list.map((x) => ({ ...x, pick: '', act: '' }))}
          render={(c, row) => {
            const x = list.find((y) => y.id === row.id);
            if (!x) return null;
            if (c.info.header === 'pick') return <Checkbox id={`pk-${x.id}`} labelText="" hideLabel disabled={!!x.gone} checked={selected.includes(x.id)} onChange={() => setSelected((s) => (s.includes(x.id) ? s.filter((y) => y !== x.id) : [...s, x.id]))} />;
            if (c.info.header === 'day') return <span>{x.day}{x.stat && <> <Tag type="red" size="sm">STAT</Tag></>}{x.over && <> <Tag type="red" size="sm">{t('microbiology.worklist.overdue', 'Overdue {0}').replace('{0}', `${x.over} h`)}</Tag></>}{x.growth && <> <Tag type="red" size="sm">{x.growth}</Tag></>}{x.instr && <> <Tag type="purple" size="sm">BACTEC FX: negative, protocol complete</Tag></>}</span>;
            if (c.info.header === 'act' && x.gone) return <Tag type="green" size="sm">{done[x.id] || 'Recorded since printing'}</Tag>;
            if (c.info.header === 'act') return (
              <Stack orientation="horizontal" gap={2}>
                {x.instr
                  ? <Button kind="ghost" size="sm" onClick={() => { setDue(due.filter((d) => d.id !== x.id)); say(`${x.cid}: instrument negative confirmed.`); }}>{t('microbiology.case.inoc.confirm', 'Confirm')}</Button>
                  : !x.growth && <Button kind="tertiary" size="sm" onClick={() => recordNoGrowth([x])}>{t('microbiology.worklist.noGrowth', 'No growth')}</Button>}
                {x.kind === 'final' && !x.instr && <Button kind="ghost" size="sm" onClick={() => { setWlExt(x.id); setWlExtReason(''); }}>{t('microbiology.worklist.extend', 'Extend 24 h')}</Button>}
                <Button kind="ghost" size="sm" href={`/Microbiology/cases/${x.lab}#${x.cid}`}>{t('microbiology.worklist.openCase', 'Open case')}</Button>
              </Stack>
            );
            return c.value;
          }}
        />
      )}
      {wlExt && (() => { const x = due.find((d) => d.id === wlExt); if (!x) return null; return (
        <Tile>
          <h6>{t('microbiology.case.inoc.extend', 'Extend incubation')} · {x.cid} · 24 {t('microbiology.case.inoc.unit.hours', 'Hours')}</h6>
          <Stack orientation="horizontal" gap={3}>
            <Select id="wl-ext-reason" labelText={`${t('microbiology.case.inoc.extendReason', 'Reason')} *`} value={wlExtReason} onChange={(e) => setWlExtReason(e.target.value)}>
              <SelectItem value="" text={t('label.select', 'Select')} />
              {EXT_REASONS.filter(([k]) => k !== 'other').map(([k, l]) => <SelectItem key={k} value={l} text={l} />)}
            </Select>
            <Button size="sm" disabled={!wlExtReason} onClick={() => { const keep = due; setDue(due.filter((d) => d.id !== x.id)); setWlExt(null); say(`${x.cid}: incubation extended 24 Hours (${wlExtReason}); back on Final read due tomorrow.`, () => setDue(keep)); }}>{t('microbiology.worklist.extendSave', 'Extend')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setWlExt(null)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
          <p><small>{t('microbiology.worklist.extendHelp', 'Other lengths and the Other reason: Extend incubation on the case.')}</small></p>
        </Tile>
      ); })()}
      <p><small>{t('microbiology.worklist.noGrowthHelp', 'No growth on a check records the reading and sets the next check; on a final read it also records the row outcome. Anything else is read on the case. Every write is on the case Timeline, with Undo. Disabled offline.')}</small></p>
      {toast && (
        <ActionableNotification inline kind="success" lowContrast title={t('common.done', 'Done')} subtitle={toast.msg} onClose={() => setToast(null)}
          actionButtonLabel={toast.undo ? t('common.undo', 'Undo') : undefined} onActionButtonClick={() => { if (toast.undo) toast.undo(); setToast(null); }} />
      )}
    </Stack>
  );
}

/* ---------- Admin: Test catalog fields (case tests, Reportable), Programs, Dictionary, media links (FR-05.2a, D-208) ---------- */
/* ---------- Test catalog: Opens a Microbiology case switch, Case role, case tests (FR-01.1, FR-01.1b, D-177, D-178) ---------- */
function CaseTestsCatalog() {
  const [opens, setOpens] = useState('yes');
  const [role, setRole] = useState('direct');
  const [tests, setTests] = useState([
    { id: 'c1', name: 'Microbiology case', unit: 'Microbiology', types: 'Urine, Wound swab, Pus, CSF, Sputum, Blood bottles', status: 'Active' },
    { id: 'c1b', name: 'Wound swab for culture', unit: 'Microbiology', types: 'Wound swab, Pus', status: 'Active' },
    { id: 'c2', name: 'TB case', unit: 'TB', types: 'Sputum, Gastric aspirate, CSF, Tissue', status: 'Active' },
    { id: 'c3', name: 'Environmental microbiology case', unit: 'Environmental Microbiology', types: 'Surface swab, Water, Air plate', status: 'Active' },
  ]);
  const roleHelp = { culture: 'Holds a culture result', direct: 'A test on the specimen (Gram, smear, Xpert)', case: 'A case test: sends the sample to its lab unit as a case; holds no result, prints nothing' };
  return (
    <Tile>
      <h6>{t('catalog.test.title', 'Test catalog')}: Xpert MTB/RIF Ultra <Tag type="blue" size="sm">v2</Tag></h6>
      <Grid condensed>
        <Column lg={5}>
          <Select id="opens" labelText={t('catalog.test.opensMicroCase', 'Opens a Microbiology case')} value={opens} onChange={(e) => setOpens(e.target.value)}
            helperText="Yes: the test opens or joins the case for its order, sample type and lab unit. There is no culture type (D-178).">
            <SelectItem value="no" text={t('catalog.test.opensMicroCase.no', 'No')} />
            <SelectItem value="yes" text={t('catalog.test.opensMicroCase.yes', 'Yes')} />
          </Select>
        </Column>
        <Column lg={5}>
          <Select id="inlab-default" labelText={t('catalog.test.reportable', 'Reportable')} defaultValue="yes" helperText={t('catalog.test.reportable.microHelp', 'When off, this test starts In lab only on a Microbiology case.')}>
            <SelectItem value="yes" text={t('label.yes', 'Yes')} />
            <SelectItem value="no" text={t('label.no', 'No')} />
          </Select>
        </Column>
        {opens === 'yes' && (
          <Column lg={5}>
            <Select id="crole" labelText={t('catalog.test.caseRole', 'Case role')} value={role} onChange={(e) => setRole(e.target.value)} helperText={roleHelp[role]}>
              <SelectItem value="direct" text={t('catalog.test.caseRole.direct', 'Direct')} />
              <SelectItem value="culture" text={t('catalog.test.caseRole.culture', 'Culture')} />
              <SelectItem value="case" text={t('catalog.test.caseRole.case', 'Case')} />
            </Select>
          </Column>
        )}
      </Grid>
      <h6 style={{ marginTop: 'var(--cds-spacing-05)' }}>Case tests (Case role Case; any number per lab unit)</h6>
      <SimpleTable
        headers={[{ key: 'name', header: 'Case test' }, { key: 'unit', header: 'Lab unit' }, { key: 'types', header: t('label.sampleTypes', 'Sample types') }, { key: 'status', header: t('label.status', 'Status') }, { key: 'act', header: '' }]}
        rows={tests.map((x) => ({ ...x, act: '' }))}
        render={(c, row) => {
          if (c.info.header === 'status') return <Tag type={c.value === 'Active' ? 'green' : 'gray'} size="sm">{c.value}</Tag>;
          if (c.info.header === 'act') {
            const x = tests.find((y) => y.id === row.id);
            if (!x) return null;
            return <Button kind="ghost" size="sm" onClick={() => setTests([...tests, { ...x, id: `c${tests.length + 1}`, name: `${x.name} (copy)`, status: 'Draft' }])}>{t('catalog.test.duplicate', 'Duplicate')}</Button>;
          }
          return c.value;
        }}
      />
    </Tile>
  );
}

/* ---------- Programs admin (existing): Show on Microbiology case and Reporting track (FR-03.7, D-178) ---------- */
function ProgramsMicroColumns() {
  const [progs, setProgs] = useState([
    { id: 'p1', name: 'TB Program', show: true, track: 'tb', questions: 'TB history, treatment month' },
    { id: 'p2', name: 'AMR surveillance', show: true, track: 'bacterial', questions: 'Admission date, prior antibiotics' },
    { id: 'p3', name: 'Bacteriology (routine)', show: true, track: 'bacterial', questions: 'none' },
    { id: 'p4', name: 'Mycology', show: true, track: 'mycology', questions: 'none' },
    { id: 'p5', name: 'HIV Program', show: false, track: '', questions: 'none' },
  ]);
  const set = (id, patch) => setProgs(progs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  return (
    <ExistingFence owner="Programs admin (built)" additions="Show on Microbiology case and Reporting track columns">
      <SimpleTable
        headers={[{ key: 'name', header: t('label.program', 'Program') }, { key: 'show', header: t('admin.program.showOnMicroCase', 'Show on Microbiology case') }, { key: 'track', header: t('admin.program.reportingTrack', 'Reporting track') }, { key: 'questions', header: 'Questionnaire' }]}
        rows={progs.map((p) => ({ ...p, show: '', track: '' }))}
        render={(c, row) => {
          const p = progs.find((x) => x.id === row.id);
          if (!p) return null;
          if (c.info.header === 'show') return <Checkbox id={`show-${p.id}`} labelText="" hideLabel checked={p.show} onChange={(_, { checked }) => set(p.id, { show: checked, track: checked ? (p.track || 'bacterial') : '' })} />;
          if (c.info.header === 'track') return p.show ? (
            <Select id={`track-${p.id}`} labelText="" hideLabel size="sm" value={p.track} onChange={(e) => set(p.id, { track: e.target.value })}>
              <SelectItem value="bacterial" text={t('microbiology.track.bacterial', 'Bacterial')} />
              <SelectItem value="tb" text={t('microbiology.track.tb', 'TB')} />
              <SelectItem value="mycology" text={t('microbiology.track.mycology', 'Mycology')} />
            </Select>
          ) : <small>n/a</small>;
          return c.value;
        }}
      />
      <p><small>Ticked programs are the Program choices in Case information; the questionnaire shows there, and the track decides the exports (WHONET and GLASS-AMR: Bacterial; NTP and GLASS-TB: TB).</small></p>
    </ExistingFence>
  );
}

/* ---------- Dictionary categories and the reflex rule micro uses (existing admin pages; D-187, D-189) ---------- */
function DictionaryAndReflex() {
  return (
    <Stack gap={4}>
      <ExistingFence owner="Admin › Dictionary (built)" additions="seeded micro categories; no micro-only lists (D-187)">
        <SimpleTable
          headers={[{ key: 'cat', header: t('admin.dictionary.category', 'Category') }, { key: 'entries', header: t('admin.dictionary.entries', 'Seeded entries') }, { key: 'used', header: t('label.usedIn', 'Used in') }]}
          rows={[
            { id: 'd1', cat: 'Culture atmosphere', entries: 'Aerobic (ambient air); CO₂-enriched (5 to 10%); Candle jar; Anaerobic; Microaerophilic', used: 'Culture and subculture rows' },
            { id: 'd2', cat: 'Culture reading', entries: 'NG No growth; NF Normal flora; MG Mixed growth; SG Significant growth', used: 'Record reading; bench sheet codes' },
            { id: 'd3', cat: 'Culture quantity', entries: '<10³ CFU/mL; 10³ to 10⁴; 10⁴ to 10⁵; ≥10⁵ CFU/mL; scanty; +; ++; +++', used: 'Record reading' },
            { id: 'd4', cat: 'Subculture purpose', entries: 'Enrichment; Blind or terminal subculture; Purity; Other', used: 'Subculture from a row with no growth' },
            { id: 'd7', cat: 'Reporting track', entries: 'Bacterial; TB; Mycology', used: 'Programs admin; surveillance exports (D-207)' },
            { id: 'd5', cat: 'Extend incubation reason', entries: 'Colonies too small to identify or pick; Slow-growing organism suspected; Fastidious organism suspected; Clinician request; Other', used: 'Extend incubation' },
            { id: 'd6', cat: 'Microscopy grade', entries: 'None; Rare; Few; Moderate; Many', used: 'Gram stain and other graded components' },
          ]}
        />
      </ExistingFence>
      <ExistingFence owner="Admin › Reflex Tests (built)" additions="seeded rule on the culture result (D-189)">
        <SimpleTable
          headers={[{ key: 'when', header: t('admin.reflex.when', 'When') }, { key: 'then', header: t('admin.reflex.then', 'Then add') }, { key: 'on', header: t('label.on', 'On') }, { key: 'status', header: t('label.status', 'Status') }]}
          rows={[{ id: 'rx1', when: 'Blood culture result = Positive', then: 'Gram stain, culture (In lab only off)', on: 'the bottle that turned positive', status: 'Active' }]}
          render={(c) => (c.info.header === 'status' ? <Tag type="green" size="sm">{c.value}</Tag> : c.value)}
        />
      </ExistingFence>
    </Stack>
  );
}

/* ---------- Workplan (existing page): Microbiology bench type and print layout (FR-12.7, D-188) ---------- */
// Route: the existing Workplan page (Workplan menu; confirm the route on testing.openelis-global.org); the Microbiology bench type is new
export function WorkplanMicroBench() {
  const [type, setType] = useState('micro');
  const [chip, setChip] = useState('final');
  const [sheet, setSheet] = useState(null);
  if (sheet) return <BenchSheetPrint sheet={sheet} onClose={() => setSheet(null)} />;
  const rows = chip === 'awaiting' ? AWAITING : DUE_ROWS.filter((r) => r.kind === chip);
  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t('home.label', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('workplan.title', 'Workplan')}</BreadcrumbItem>
      </Breadcrumb>
      <ExistingFence owner="Workplan page and print (built: by test section, test, panel, priority)" additions="Microbiology bench type, its filters and the bench layout; the Worklist's Print workplan opens the same print">
        <Grid condensed>
          <Column lg={5}>
            <Select id="wp-type" labelText={t('workplan.type', 'Workplan type')} value={type} onChange={(e) => setType(e.target.value)}>
              <SelectItem value="section" text={t('workplan.type.testSection', 'Test section')} />
              <SelectItem value="test" text={t('workplan.type.test', 'Test')} />
              <SelectItem value="panel" text={t('workplan.type.panel', 'Panel')} />
              <SelectItem value="priority" text={t('workplan.type.priority', 'Priority')} />
              <SelectItem value="micro" text={t('workplan.type.microBench', 'Microbiology bench')} />
            </Select>
          </Column>
          {type === 'micro' && (
            <Column lg={5}>
              <Select id="wp-filter" labelText={t('workplan.micro.filter', 'Filter')} value={chip} onChange={(e) => setChip(e.target.value)}>
                <SelectItem value="awaiting" text={SHEET_TITLES.awaiting} />
                <SelectItem value="check" text={SHEET_TITLES.check} />
                <SelectItem value="final" text={SHEET_TITLES.final} />
              </Select>
            </Column>
          )}
        </Grid>
        {type === 'micro' && (
          <>
            <SimpleTable
              key={chip}
              headers={[{ key: 'lab', header: t('label.labNumber', 'Lab number') }, { key: 'who', header: t('microbiology.worklist.subject', 'Patient or site') }, { key: 'what', header: chip === 'awaiting' ? t('label.specimen', 'Specimen') : t('microbiology.case.inoc.container', 'Container') }]}
              rows={rows.map((r) => ({ id: r.id, lab: r.lab, who: r.who, what: chip === 'awaiting' ? r.spec : `${r.cid} · ${r.med}` }))}
            />
            <Button size="sm" onClick={() => setSheet({ no: 'BS-261002-09', chip, title: SHEET_TITLES[chip], labName: 'Central Public Health Laboratory, Port Moresby', labUnit: 'Microbiology', by: 'J. Kaupa', at: '02 Oct 2026 08:20', scope: 'all rows in the filter', rows })}>{t('microbiology.worklist.printSheet', 'Print workplan')}</Button>
          </>
        )}
      </ExistingFence>
    </Stack>
  );
}

const MEDIA_LINKS = [
  { id: 'l0', item: 'Gram stain kit', type: 'Reagent', sampleType: 'Any', order: '', duration: '', check: '', atm: 'from the item', loop: '' },
  { id: 'l1', item: 'CLED agar plate', type: 'Medium', sampleType: 'Urine', order: '1', duration: '24 Hours', check: '24 Hours', atm: 'Aerobic (ambient air), 35 °C', loop: '1 µL' },
  { id: 'l2', item: 'Blood agar (sheep) plate', type: 'Medium', sampleType: 'Urine', order: '2', duration: '24 Hours', check: '24 Hours', atm: 'CO₂-enriched (5 to 10%), 35 °C', loop: '1 µL' },
  { id: 'l3', item: 'Blood agar (sheep) plate', type: 'Medium', sampleType: 'Sputum', order: '1', duration: '48 Hours', check: '24 Hours', atm: 'CO₂-enriched (5 to 10%), 35 °C', loop: '' },
  { id: 'l4', item: 'Chocolate agar plate', type: 'Medium', sampleType: 'Sputum', order: '2', duration: '48 Hours', check: '24 Hours', atm: 'CO₂-enriched (5 to 10%), 35 °C', loop: '' },
  { id: 'l5', item: 'MacConkey agar plate', type: 'Medium', sampleType: 'Sputum', order: '3', duration: '48 Hours', check: '24 Hours', atm: 'Aerobic (ambient air), 35 °C', loop: '' },
];
// D-208: plating is the culture test's media links in the built Test catalog Reagents section (test_reagent_link); no Plating templates admin
export function MediaLinksAdmin() {
  const [reqTracked, setReqTracked] = useState(false);
  const [blockSelf, setBlockSelf] = useState(false);
  return (
    <Stack gap={5}>
      <CaseTestsCatalog />
      <ProgramsMicroColumns />
      <DictionaryAndReflex />
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t('home.label', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('admin.label', 'Admin Management')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('catalog.test.reagentsAndMedia', 'Reagents and media')}: Bacterial culture</BreadcrumbItem>
      </Breadcrumb>
      <ExistingFence owner="Test catalog Reagents section (built test_reagent_link)" additions="Microbiology medium items; sample type, order, duration, check every, loop volume; no quantity, no stock change (D-169, D-208)">
        <div><Button size="sm" renderIcon={Add}>{t('catalog.test.addReagentOrMedium', 'Add reagent or medium')}</Button></div>
        <SimpleTable
          headers={[{ key: 'item', header: t('label.item', 'Item') }, { key: 'type', header: t('label.type', 'Type') }, { key: 'sampleType', header: t('catalog.test.mediaLink.sampleType', 'Sample type') }, { key: 'order', header: t('catalog.test.mediaLink.order', 'Order') }, { key: 'duration', header: t('catalog.test.mediaLink.duration', 'Duration') }, { key: 'check', header: t('catalog.test.mediaLink.checkEvery', 'Check every') }, { key: 'atm', header: t('microbiology.case.inoc.atmTemp', 'Atmosphere, temperature') }, { key: 'loop', header: t('catalog.test.mediaLink.loopVolume', 'Loop volume') }]}
          rows={MEDIA_LINKS}
          render={(c) => (c.info.header === 'type' ? <Tag type={c.value === 'Medium' ? 'teal' : 'gray'} size="sm">{c.value}</Tag> : c.info.header === 'sampleType' && c.value === 'Any' ? t('catalog.test.mediaLink.anySampleType', 'Any sample type') : c.value)}
        />
      </ExistingFence>
      <Grid condensed>
        <Column lg={8}><Toggle id="req-tracked" labelText={t('microbiology.labUnit.requireTrackedMedia', 'Require tracked media')} labelA={t('label.off', 'Off')} labelB={t('label.on', 'On')} toggled={reqTracked} onToggle={setReqTracked} /><small>Lab unit setting (D-196): only tracked media with a usable lot; Add new hidden</small></Column>
        <Column lg={8}><Toggle id="block-self" labelText={t('siteInfo.blockSelfValidation', 'Block self-validation')} labelA={t('label.off', 'Off')} labelB={t('label.on', 'On')} toggled={blockSelf} onToggle={setBlockSelf} /><small>Site setting (D-191): applies on Validation and on case validation</small></Column>
      </Grid>
    </Stack>
  );
}

/* ---------- Enter Order: samples and tests (Clinical Order Entry v4 FR-B14, FR-B12a v0.18; D-146, D-177) ---------- */
// No Microbiology section and no Program coupling: micro tests and lab unit case tests are picked in the ordinary
// test picker. Only the "After save" tile is new, and it is drawn for review, not shown to reception.
const CATALOG = [
  // D-177: case tests (any number per lab unit) assign the case; the technician chooses the path on the case
  { id: 'mcase', text: 'Microbiology case', note: 'Microbiology case test', generic: true },
  { id: 'tbcase', text: 'TB case', note: 'TB case test', generic: true },
  { id: 'bac', text: 'Bacterial culture', note: 'Microbiology', generic: true },
  { id: 'tbc', text: 'TB culture', note: 'TB', generic: true },
  { id: 'smear', text: 'AFB smear (ZN)', note: 'TB, direct test', generic: true },
  { id: 'fun', text: 'Fungal culture', note: 'Microbiology', generic: true },
  { id: 'gram', text: 'Gram stain', note: 'Microbiology' },
];
const GENERIC = ['Microbiology case', 'TB case', 'TB culture', 'Bacterial culture', 'Blood culture', 'Fungal culture', 'Xpert MTB/RIF Ultra', 'AFB smear (ZN)', 'Gram stain'];
export function OrderSamplesAndTests() {
  const [samples, setSamples] = useState([
    { id: '-1', type: 'Sputum', site: 'Lower respiratory tract', time: '28 Sep 07:10', tests: ['Xpert MTB/RIF Ultra'] },
    { id: '-2', type: 'Blood, aerobic bottle', site: 'Venous blood, left arm', time: '28 Sep 07:25', tests: ['Blood culture'] },
    { id: '-3', type: 'Blood, anaerobic bottle', site: 'Venous blood, left arm', time: '28 Sep 07:25', tests: ['Blood culture'] },
    { id: '-4', type: 'Blood, aerobic bottle', site: 'Venous blood, right arm', time: '28 Sep 07:31', tests: ['Blood culture'] },
    { id: '-5', type: 'Blood, anaerobic bottle', site: 'Venous blood, right arm', time: '28 Sep 07:31', tests: ['Blood culture'] },
    { id: '-6', type: 'Serum', site: '', time: '28 Sep 07:25', tests: ['RPR'] },
    { id: '-7', type: 'Wound swab', site: 'Wound, lower leg', time: '28 Sep 07:40', tests: ['Microbiology case'] },
    { id: '-8', type: 'Isolate', site: '', time: '27 Sep 15:00', tests: ['Bacterial culture', 'VITEK 2 AST-N405'], elsewhere: { test: 'Bacterial culture', lab: 'Port Moresby General Hospital Laboratory', value: 'Escherichia coli' } },
  ]);
  const [split, setSplit] = useState(false);
  const [sets, setSets] = useState({ '-2': '1', '-3': '1', '-4': '2', '-5': '2' }); // D-192: reception gives each bottle its set
  const setWarn = [];
  ['1', '2', '3'].forEach((n) => { const b = samples.filter((sm) => sets[sm.id] === n); if (b.length === 1) setWarn.push(t('order.sample.set.warn.single', 'Set {0} has one bottle').replace('{0}', n)); const ty = b.map((x) => x.type); ty.forEach((x, k) => { if (ty.indexOf(x) !== k) setWarn.push(t('order.sample.set.warn.sameType', 'Set {0} has two {1} bottles').replace('{0}', n).replace('{1}', x.includes('anaerobic') ? 'anaerobic' : 'aerobic')); }); });
  const nSets = new Set(Object.values(sets)).size;
  const iso = samples.find((sm) => sm.elsewhere);
  const SAMPLE_SITES = [...BODY_SITES, 'Venous blood, left arm', 'Venous blood, right arm', 'Central line'];
  const setSample = (si, patch) => setSamples(samples.map((x, k) => (k === si ? { ...x, ...patch } : x)));
  const add = ({ selectedItem }) => {
    if (!selectedItem) return;
    const c = [...samples];
    if (!c[0].tests.includes(selectedItem.text)) c[0] = { ...c[0], tests: [...c[0].tests, selectedItem.text] };
    setSamples(c);
  };
  const s1 = samples[0].tests;
  const cases = [
    { id: 'tb', test: 'TB case (first micro test on -1)', samples: '-1 Sputum', unit: 'TB', note: s1.includes('TB culture') ? 'The culture joins the same case' : 'No culture ordered: releases on the Xpert result; a reflex TB culture on RR joins it' },
    s1.includes('Bacterial culture') && { id: 'bac', test: 'Bacterial culture', samples: '-1 Sputum', unit: 'Microbiology', note: 'Another lab unit than the TB case: a related case on the same sample' },
    s1.includes('Fungal culture') && { id: 'fun', test: 'Fungal culture', samples: '-1 Sputum', unit: 'Microbiology', note: 'Same lab unit as a bacterial culture, so it joins that case' },
    { id: 'bc', test: 'Blood culture case in Microbiology', samples: split ? '-2, -3 (split: -4, -5 are a related case)' : `-2 to -5: ${nSets} sets, 4 bottles`, unit: 'Microbiology', note: 'One case for the order; reception set the set numbers; site and time only warn (D-192)' },
    iso && { id: 'iso', test: 'Bacterial culture case in Microbiology (received isolate)', samples: `${iso.id} Isolate`, unit: 'Microbiology', note: `Tested elsewhere: ${iso.elsewhere.lab}, reported ${iso.elsewhere.value}; opens with ISO-1 Received from that laboratory (D-194)` },
    { id: 'none', test: t('order.micro.tag.staysInResults', 'Stays in Results'), samples: '-6 Serum (RPR)', unit: 'Microbiology (serology)', note: 'RPR has Opens a Microbiology case: No, so it stays on Results' },
    { id: 'reflex', test: t('order.micro.summary.reflex', 'If {0}: adds {1}').replace('{0}', 'Blood culture result = Positive').replace('{1}', 'Gram stain, culture'), samples: 'the bottle that turns positive', unit: 'Microbiology', note: 'Reflex rule (Admin › Reflex Tests)' },
    // D-177: a lab unit case test opens a case in that lab unit with Path: not chosen
    ...samples.filter((sm) => sm.tests.includes('Microbiology case') || sm.tests.includes('TB case')).map((sm) => ({ id: `case${sm.id}`, test: `${sm.tests.includes('TB case') ? 'TB case' : 'Microbiology case'} (lab unit case test)`, samples: `${sm.id} ${sm.type}`, unit: sm.tests.includes('TB case') ? 'TB' : 'Microbiology', note: 'No tests yet; the technician sets the Program and adds the tests on the case' })),
  ].filter(Boolean);
  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t('home.label', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('banner.menu.patientEdit', 'Orders & Patients')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('sample.entry.title', 'Enter Order')}</BreadcrumbItem>
      </Breadcrumb>
      <ExistingFence owner="Clinical Order Entry v4 samples and tests step (FR-B14 chooser)" additions="none; generic culture tests are ordinary catalog entries">
        <Grid condensed>
          <Column lg={6}>
            <Select id="prog" labelText={t('common.program', 'Program')} defaultValue="tb" helperText="Never routes micro work (D-146); its questionnaire answers are the same record on the case (D-198)">
              <SelectItem value="" text="None" />
              <SelectItem value="tb" text="TB Program" />
              <SelectItem value="hiv" text="HIV Program" />
            </Select>
          </Column>
        </Grid>
        <TableContainer>
          <Table size="md">
            <TableHead><TableRow>
              <TableHeader>{t('label.sample', 'Sample')}</TableHeader>
              <TableHeader>{t('label.bodySite', 'Body site')} · {t('label.collected', 'Collected')}</TableHeader>
              <TableHeader>{t('order.sample.setNumber', 'Set')}</TableHeader>
              <TableHeader>{t('label.tests', 'Tests')}</TableHeader>
            </TableRow></TableHead>
            <TableBody>
              {samples.map((sm, si) => (
                <TableRow key={sm.id}>
                  <TableCell>{sm.id} · {sm.type}</TableCell>
                  <TableCell>
                    {/* Clinical Order Entry v4 section N: every sample its own body site and collection time */}
                    <ComboBox id={`site${sm.id}`} titleText="" aria-label={`Body site for ${sm.id}`} size="sm" items={SAMPLE_SITES} selectedItem={sm.site || null} placeholder={t('microbiology.case.bodySite.search', 'Search body sites')} onChange={({ selectedItem }) => setSample(si, { site: selectedItem || '' })} />
                    <TextInput id={`time${sm.id}`} labelText="" hideLabel size="sm" value={sm.time} onChange={(e) => setSample(si, { time: e.target.value })} style={{ marginTop: 'var(--cds-spacing-02)' }} />
                  </TableCell>
                  <TableCell>{sets[sm.id] ? (
                    <Select id={`set${sm.id}`} labelText="" hideLabel aria-label={`Set for ${sm.id}`} size="sm" value={sets[sm.id]} onChange={(e) => setSets({ ...sets, [sm.id]: e.target.value })}>{['1', '2', '3'].map((n) => <SelectItem key={n} value={n} text={t('order.sample.set.option', 'Set {0}').replace('{0}', n)} />)}</Select>
                  ) : <small>{t('label.notApplicable', 'n/a')}</small>}</TableCell>
                  <TableCell>
                    {sm.elsewhere && <div><Tag type="purple" size="sm">{t('order.tests.col.testedElsewhere', 'Tested elsewhere')}</Tag> <small>{sm.elsewhere.test}: {sm.elsewhere.lab} (Organizations list), reported {sm.elsewhere.value}</small></div>}
                    {sm.tests.map((x) => <Tag key={x} type={GENERIC.includes(x) ? 'teal' : 'gray'} size="sm">{x}</Tag>)}
                    {si === 0 && (
                      <div style={{ maxWidth: '22rem', marginTop: 'var(--cds-spacing-03)' }}>
                        <ComboBox id="test-search" titleText="" aria-label={t('order.searchTests', 'Search tests or panels')} placeholder={t('order.searchTests', 'Search tests or panels')}
                          items={CATALOG} itemToString={(c) => (c ? `${c.text} (${c.note})` : '')} selectedItem={null} onChange={add} />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ExistingFence>
      <Tile>
        <h6>{t('order.micro.summary.title', 'What this order will open')}</h6>
        <p><small>Live: updates as tests and samples change; saves nothing (D-190)</small></p>
        {setWarn.length > 0 && <InlineNotification kind="warning" lowContrast hideCloseButton title="Check the sets" subtitle={`${setWarn.join('; ')}. You can still save.`} />}
        <SimpleTable
          headers={[{ key: 'test', header: 'Case opens for' }, { key: 'samples', header: 'Samples' }, { key: 'unit', header: 'Lab unit' }, { key: 'note', header: 'Note' }]}
          rows={cases}
          render={(c) => (c.info.header === 'test' && !['none', 'reflex'].includes(c.id.split(':')[0]) ? <span><Tag type="teal" size="sm">{t('order.micro.tag.opensCase', 'Opens a case')}</Tag> {c.value}</span> : c.value)}
        />
        <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <div><small>{t('microbiology.mockup.bloodCaseHeader', 'Blood culture case header')}</small></div>
          <Stack orientation="horizontal" gap={5}>
            <div><strong>{t('microbiology.case.cultureSet.summary', '{test}: {sets} sets, {bottles} bottles').replace('{test}', 'Blood culture').replace('{sets}', split ? '1' : '2').replace('{bottles}', split ? '2' : '4')}</strong></div>
            {!split && <Button kind="ghost" size="sm" onClick={() => setSplit(true)}>{t('microbiology.case.splitCases', 'Split into separate cases')}</Button>}
            <small>{t('microbiology.case.splitCases.help', 'Reason required. Only a sample with no results on the case can be split off.')}</small>
          </Stack>
        </Tile>
      </Tile>
    </Stack>
  );
}

export default function MicrobiologyV2Mockup() {
  const [view, setView] = useState(0);
  return (
    <Stack gap={5}>
      <ContentSwitcher selectedIndex={view} onChange={({ index }) => setView(index)} size="sm">
        <Switch name="case" text={t('microbiology.mockup.caseView', 'Case view (TB example)')} />
        <Switch name="bc" text={t('microbiology.mockup.caseViewBc', 'Case view (blood culture, AMR example)')} />
        <Switch name="wl" text={t('microbiology.mockup.worklist', 'Worklist: Needs attention, bench work')} />
        <Switch name="oe" text={t('microbiology.mockup.orderEntry', 'Enter Order: samples and tests')} />
        <Switch name="adm" text={t('microbiology.mockup.adminMedia', 'Test catalog, media links, settings')} />
        <Switch name="wp" text={t('workplan.type.microBench', 'Workplan: Microbiology bench')} />
      </ContentSwitcher>
      {view === 0 && <MicrobiologyCaseView key="tb" example={TB_EX} />}
      {view === 1 && <MicrobiologyCaseView key="bc" example={BC_EX} />}
      {view === 2 && <MicrobiologyWorklist />}
      {view === 3 && <OrderSamplesAndTests />}
      {view === 4 && <MediaLinksAdmin />}
      {view === 5 && <WorkplanMicroBench />}
    </Stack>
  );
}
