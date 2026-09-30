// Microbiology v2: Case view, Worklist Needs attention, order entry (generic culture tests in the ordinary test picker)
// Routes:
//   /Microbiology/cases/:caseId                 Case view (existing route, v2 sections)
//   /Microbiology/worklist?status=attention      Worklist, Needs attention filter (existing page)
//   Enter Order (Clinical Order Entry v4)        Samples and tests: no Microbiology section, no Program coupling (FR-B12a v0.13, D-146)
// SideNav: Microbiology -> Worklist -> (row); Orders & Patients -> Add Order
// Breadcrumbs: Home / Microbiology / Worklist / Case {labNumber}; Home / Microbiology / Worklist
// FRS: amr-micro-v2-amendments.md draft 9; patient-report-and-report-management-frs.md v2.2 §7.4
// Decisions: D-113 to D-119, D-121, D-124 to D-138, D-146, D-147 and D-162 to D-168 (D-131 retired; D-148 replaced by D-164; D-167 proposed)
// Regions marked <ExistingFence> are shipped UI (M-04 Case view on develop): reuse, do not
// re-implement. They are drawn abbreviated; only the listed v2 additions are new (D-063, A-16).

import React, { useState, useMemo, createContext, useContext } from 'react';
import {
  Breadcrumb, BreadcrumbItem, Grid, Column, Stack, Tile, Tag, Button, Select, SelectItem,
  TextInput, TextArea, NumberInput, Checkbox, ComboBox, DataTable, TableContainer, Table, TableHead,
  TableRow, TableHeader, TableBody, TableCell, InlineNotification, ContentSwitcher, Switch,
  ClickableTile, OverflowMenu, OverflowMenuItem, Accordion, AccordionItem, RadioButtonGroup, RadioButton,
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
  { id: 'cled', text: 'CLED agar plate', tracked: true, unit: 'plate', atm: 'aerobic', temp: 35, lots: [{ n: 'CLED-26-201', exp: '11/2026', left: 88 }] },
  { id: 'sel', text: 'Selenite F broth', tracked: true, unit: 'tube', atm: 'aerobic', temp: 35, lots: [{ n: 'SEL-26-014', exp: '12/2026', left: 30 }] },
  { id: 'bcae', text: 'BACTEC Plus Aerobic/F bottle', tracked: false, atm: 'aerobic', temp: 35, lots: [] },
  { id: 'bcan', text: 'BACTEC Lytic/10 Anaerobic/F bottle', tracked: false, atm: 'anaerobic', temp: 35, lots: [] },
  { id: 'm7h11', text: 'Middlebrook 7H11 agar (from QMRL)', tracked: false, atm: 'co2', temp: 37, lots: [] },
];
const MediaContext = createContext(null);
// Plating templates (FR-05.2a), from Admin › Microbiology Reference Data › Plating templates
const PLATING_TEMPLATES = [
  { id: 'pt1', sampleType: 'Urine', culture: 'Any', rows: [{ medium: 'cled', atm: 'aerobic', temp: 35, dur: 24, unit: 'Hours' }, { medium: 'ba', atm: 'aerobic', temp: 35, dur: 24, unit: 'Hours' }] },
  { id: 'pt2', sampleType: 'Sputum', culture: 'TB culture', rows: [{ medium: 'mgit', atm: 'aerobic', temp: 37, dur: 42, unit: 'Days' }, { medium: 'lj', atm: 'aerobic', temp: 37, dur: 56, unit: 'Days' }] },
  { id: 'pt3', sampleType: 'Stool', culture: 'Any', rows: [{ medium: 'sel', atm: 'aerobic', temp: 35, dur: 18, unit: 'Hours' }] },
  { id: 'pt4', sampleType: 'Blood, aerobic bottle', culture: 'Blood culture', rows: [{ medium: 'bcae', atm: 'aerobic', temp: 35, dur: 5, unit: 'Days' }] },
];
// Notes (A-13): same pattern as Results Entry v2.1 Notes section; type I = In Lab Only, E = Send with Result
const NotesContext = createContext(null);
const NOTE_SEED = {
  gram: [{ id: 'n1', d: '23 Sep 09:12', a: 'J. Kaupa', type: 'I', body: 'Thick smear; re-stained once before reading.' }],
  'MGIT-004812-A': [{ id: 'n2', d: '28 Sep 08:40', a: 'R. Opa', type: 'E', body: 'Positive signal on day 5; purity subculture set up.' }],
  'ISO-1': [{ id: 'n3', d: '28 Sep 10:05', a: 'R. Opa', type: 'I', body: 'MPT64 read at 15 minutes; clear band.' }],
};

const INITIAL_ROWS = [
  { id: 'smear', test: 'AFB smear (Ziehl-Neelsen)', type: 'coded', opts: ['Negative', 'Scanty (1 to 9 AFB per 100 fields)', '1+', '2+', '3+'], result: '2+', display: '2+ (10 to 99 AFB per 100 fields)', flag: 'Critical', by: 'J. Kaupa (this lab)', lot: 'ZN stain kit, lot 22071', state: 'Validated' },
  { id: 'xpert', test: 'Xpert MTB/RIF Ultra', type: 'components', components: [{ c: 'MTB', v: 'Detected, medium', opts: ['Not detected', 'Trace', 'Detected, low', 'Detected, medium', 'Detected, high'] }, { c: 'Rifampicin resistance', v: 'Detected', opts: ['Not detected', 'Detected', 'Indeterminate'] }], display: 'MTB detected, medium; rifampicin resistance detected', flag: 'Critical', by: 'Goroka Provincial Hospital Laboratory, 22 Sep 2026', external: true, state: 'Validated' },
  { id: 'gram', test: 'Gram stain (direct)', type: 'graded', graded: [{ what: 'Pus cells', grade: 'Many' }, { what: 'Gram-positive cocci in clusters', grade: 'Few' }], display: 'Pus cells: many; Gram-positive cocci in clusters: few', flag: '', by: 'J. Kaupa (this lab)', lot: 'Gram stain kit, lot 44120', state: 'Entered' },
  { id: 'wet', test: 'Wet preparation', type: 'graded', graded: [{ what: 'Pus cells', grade: 'Few' }], display: '', flag: '', by: '', state: 'Pending' },
];
const ADDITIONAL_ROWS = [
  { id: 'wgs', test: 'Whole genome sequencing (MTB)', on: 'isolate sample CPHL26-004812-1.1 (ISO-1)', type: 'components', components: [{ c: 'Lineage', v: 'Lineage 2 (Beijing)', opts: ['Lineage 1', 'Lineage 2 (Beijing)', 'Lineage 4'] }, { c: 'Rifampicin (rpoB)', v: 'Resistant (S450L)', opts: ['Susceptible', 'Resistant (S450L)'] }], display: '', flag: '', by: 'QMRL Brisbane (referred)', state: 'Pending' },
  { id: 'lpa', test: 'Line probe assay MTBDRsl', on: 'ISO-1', type: 'components', components: [{ c: 'Fluoroquinolones (gyrA, gyrB)', v: 'No mutation detected', opts: ['No mutation detected', 'Mutation detected'] }, { c: 'Second-line injectables (rrs, eis)', v: 'No mutation detected', opts: ['No mutation detected', 'Mutation detected'] }], display: 'No fluoroquinolone or injectable resistance mutations', flag: '', by: 'R. Opa (this lab)', lot: 'GenoType MTBDRsl kit, lot 8830', state: 'Validated' },
];
const GRADES = ['None', 'Rare', 'Few', 'Moderate', 'Many'];
const OBSERVATIONS = ['Gram-positive cocci in clusters', 'Gram-positive cocci in chains', 'Gram-negative bacilli', 'Gram-positive bacilli', 'Gram-negative diplococci', 'Yeasts', 'Pus cells', 'Epithelial cells'];

const CULTURE_ROWS = [
  { id: 'MGIT-004812-A', from: '', medium: 'BBL MGIT 7 mL tube', lot: '5327611', atm: 'aerobic', temp: 37, dur: 42, unit: 'Days', every: 7, eunit: 'Days', start: '23 Sep 08:30', ends: '04 Nov 08:30', next: '', day: 5, state: 'Positive', log: ['Day 5: positive signal, TTD 4.8 d (MGIT 960)'] },
  { id: 'LJ-004812-B', from: '', medium: 'Löwenstein-Jensen slope', lot: 'LJ-2609 (prepared in-house)', atm: 'aerobic', temp: 37, dur: 56, unit: 'Days', every: 7, eunit: 'Days', start: '23 Sep 08:30', ends: '18 Nov 08:30', next: '28 Sep 08:30', day: 5, state: 'Check due', log: ['Day 1: no growth'] },
  { id: 'LJ-SUB-004812-A1', from: 'MGIT-004812-A', medium: 'Middlebrook 7H11 agar (from QMRL)', notTracked: true, atm: 'aerobic', temp: 37, dur: 28, unit: 'Days', every: 7, eunit: 'Days', start: '28 Sep 11:00', ends: '26 Oct 11:00', next: '05 Oct 11:00', day: 1, state: 'Incubating', log: [] },
];

const INCOMING = [
  { id: 'n1', test: 'Species ID (MALDI-TOF Biotyper)', value: 'Mycobacterium tuberculosis complex', source: 'MALDI-TOF Biotyper (MB-01)', received: '28 Sep 10:40' },
  { id: 'n2', test: 'Xpert MTB/XDR', value: 'INH resistance detected; FQ not detected', source: 'GeneXpert GX-02', received: '28 Sep 11:05' },
  { id: 'n3', test: 'Moxifloxacin (MGIT, 0.25 µg/mL)', value: 'S', source: 'Referral return: QMRL Brisbane', received: '29 Sep 08:05' },
];

const DST_READINGS = [
  { id: 'd1', drug: 'Rifampicin', raw: '1.0 µg/mL', source: 'Analyzer', matchedBy: 'WHO critical concentrations 2024', interp: 'R', override: false },
  { id: 'd2', drug: 'Isoniazid', raw: '0.1 µg/mL', source: 'Analyzer', matchedBy: 'WHO critical concentrations 2024', interp: 'R', override: false },
  { id: 'd3', drug: 'Ethambutol', raw: '5.0 µg/mL', source: 'Override', matchedBy: 'WHO critical concentrations 2024', interp: 'S', override: true },
  { id: 'd4', drug: 'Pyrazinamide', raw: '', source: '', matchedBy: '', interp: 'Pending', override: false },
];

const interpKind = (v) => (v === 'R' ? 'red' : v === 'S' ? 'green' : v === 'I' ? 'warm-gray' : 'purple');
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

/* ---------- Case header (A-04, FR-02.6, FR-02.7) ---------- */
const HISTORY = [
  { id: 'h1', date: '12 Jun 2026', lab: 'CPHL26-002981', spec: 'Sputum, lower respiratory tract', type: 'Mycobacteriology', finding: 'MTB detected (Xpert), rifampicin resistance not detected', state: 'Final' },
  { id: 'h2', date: '03 Mar 2026', lab: 'CPHL26-000884', spec: 'Urine, midstream', type: 'Bacteriology', finding: 'E. coli ≥10⁵ CFU/mL (ESBL)', state: 'Final' },
];
function PatientHistory() {
  return (
    <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
      <h6>{t('microbiology.case.patientHistory', 'Patient history')} <Tag type="blue" size="sm">v2</Tag></h6>
      <SimpleTable
        headers={[{ key: 'date', header: t('label.date', 'Date') }, { key: 'lab', header: t('label.case', 'Case') }, { key: 'spec', header: t('label.specimen', 'Specimen') }, { key: 'type', header: t('microbiology.case.cultureType', 'Culture type') }, { key: 'finding', header: t('microbiology.case.patientHistory.findings', 'Organisms and key resistance') }, { key: 'state', header: t('label.state', 'State') }]}
        rows={HISTORY}
        render={(c) => (c.info.header === 'state' ? <Tag type="green" size="sm">{c.value}</Tag> : c.value)}
      />
      <p><small>{t('microbiology.case.patientHistory.help', 'Earlier micro cases for this patient, any order, lab units you hold rights in. A Treatment follow-up case also shows its baseline TB case and the results by treatment month.')}</small></p>
    </Tile>
  );
}

function CaseHeader({ labUnit, onChangeLabUnit }) {
  const [changing, setChanging] = useState(false);
  const [history, setHistory] = useState(false);
  return (
    <Tile>
      <Grid condensed>
        <Column lg={4}><small>{t('label.patient', 'Patient')}</small><div>Kila Nou, M, 34 y · UHID 88120034</div></Column>
        <Column lg={4}><small>{t('label.sample', 'Sample')}</small><div>CPHL26-004812-1 · Sputum</div></Column>
        <Column lg={4}><small>{t('label.bodySite', 'Body site')}</small><div>Lower respiratory tract</div></Column>
        <Column lg={4}><small>{t('microbiology.case.cultureType', 'Culture type')}</small><div>{t('microbiology.case.cultureType.mycobacteriology', 'Mycobacteriology (TB)')} · TB culture</div></Column>
        <Column lg={4}><small>{t('microbiology.case.labUnit', 'Lab unit')}</small>
          <div>{labUnit} <Button kind="ghost" size="sm" onClick={() => setChanging(!changing)}>{t('microbiology.case.changeLabUnit', 'Change lab unit')}</Button></div></Column>
        <Column lg={4}><small>{t('label.stage', 'Stage')}</small>
          <div><Tag type="blue">{t('microbiology.case.stage.astDst', 'AST / DST in progress')}</Tag><Tag type="purple">{t('microbiology.case.stage.referred', 'Referred')}</Tag></div></Column>
        <Column lg={6}><small>{t('microbiology.case.relatedOnSpecimen', 'Also on this specimen')}</small>
          <div><Button kind="ghost" size="sm">Bacterial culture · Microbiology</Button></div></Column>
        <Column lg={2}>
          <OverflowMenu aria-label={t('label.moreActions', 'More actions')} flipped>
            <OverflowMenuItem itemText={t('microbiology.case.logCritical', 'Log critical notification')} />
            <OverflowMenuItem itemText={t('microbiology.case.reportNce', 'Report NCE')} />
            <OverflowMenuItem itemText={t('microbiology.case.changeCultureType', 'Change culture type')} />
            <OverflowMenuItem itemText={t('microbiology.case.patientHistory', 'Patient history')} onClick={() => setHistory(!history)} />
          </OverflowMenu>
        </Column>
      </Grid>
      {history && <PatientHistory />}
      {changing && (
        <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <Grid condensed>
            <Column lg={6}>
              <Select id="new-lu" labelText={t('microbiology.case.newLabUnit', 'New lab unit')} value={labUnit} onChange={(e) => onChangeLabUnit(e.target.value)}
                helperText={t('microbiology.case.changeLabUnit.helper', 'Relabels the case: Worklist and edit rights follow the new lab unit. Culture type and tests do not change.')}>
                <SelectItem value="TB" text="TB" />
                <SelectItem value="Microbiology" text="Microbiology" />
              </Select>
            </Column>
          </Grid>
          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button size="sm" onClick={() => setChanging(false)}>{t('button.save', 'Save')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setChanging(false)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </Tile>
      )}
    </Tile>
  );
}

/* ---------- Incoming results (A-09): one-click place buttons, no suggestion logic ---------- */
function IncomingResults({ items, isolates, onPlace }) {
  if (!items.length) return null;
  const isoLabel = (key, fb) => (isolates.length === 1
    ? `${t(`microbiology.case.incoming.${key}Named`, `${fb}: {isolate}`).replace('{isolate}', isolates[0])}`
    : isolates.length === 0 ? t('microbiology.case.incoming.createIsolate', 'Create isolate and place') : t(`microbiology.case.incoming.${key}`, fb));
  const places = [
    t('microbiology.case.section.initialTesting', 'Initial testing'),
    isoLabel('isolate', 'Isolate'),
    isoLabel('ast', 'AST / DST'),
    t('microbiology.case.section.additionalTesting', 'Additional testing'),
  ];
  return (
    <Section n="!" title={`${t('microbiology.case.section.incoming', 'Incoming results')} · ${t('microbiology.case.incoming.waiting', '{n} waiting').replace('{n}', items.length)}`} isNew>
      <p><small>{t('microbiology.case.incoming.help', 'Results for tests not yet on this case. One click places a result where you choose; the system does not guess. Use Move result to correct a placement.')}</small></p>
      <SimpleTable
        headers={[
          { key: 'test', header: t('microbiology.case.incoming.col.test', 'Test') },
          { key: 'value', header: t('microbiology.case.incoming.col.value', 'Value') },
          { key: 'source', header: t('microbiology.case.incoming.col.source', 'Source') },
          { key: 'received', header: t('microbiology.case.incoming.col.received', 'Received') },
          { key: 'place', header: t('microbiology.case.incoming.col.placeIn', 'Place in') },
        ]}
        rows={items.map((i) => ({ ...i, place: '' }))}
        render={(c, row) => (c.info.header === 'place'
          ? (
            <Stack orientation="horizontal" gap={2}>
              {places.map((pl) => <Button key={pl} size="sm" kind="tertiary" onClick={() => onPlace(row.id, pl)}>{pl}</Button>)}
            </Stack>
          )
          : c.value)}
      />
    </Section>
  );
}

/* ---------- Case information (A-03) ---------- */
function CaseInformation() {
  const [purpose, setPurpose] = useState('CLINICAL_DIAGNOSTIC');
  return (
    <Section n="1" title={t('microbiology.case.section.caseInfo', 'Case information')} isNew>
      <Grid condensed>
        <Column lg={4}>
          <Select id="purpose" labelText={`${t('microbiology.culturePurpose.label', 'Culture purpose')} *`} value={purpose} onChange={(e) => setPurpose(e.target.value)}
            helperText={t('microbiology.case.purpose.helper', 'Default Diagnostic. Only Diagnostic counts in the antibiogram and GLASS.')}>
            {PURPOSES.map(([v, l]) => <SelectItem key={v} value={v} text={l} />)}
          </Select>
        </Column>
        <Column lg={4}>
          <Select id="origin" labelText={`${t('microbiology.orderDetail.patientOrigin', 'Patient origin')} ◆`} defaultValue="Outpatient"
            helperText={t('microbiology.case.requiredBeforeFinal', 'Needed before final report')}>
            {['Outpatient', 'Inpatient', 'ICU', 'Emergency'].map((o) => <SelectItem key={o} value={o} text={o} />)}
          </Select>
        </Column>
        <Column lg={4}><TextInput id="adm" labelText={t('microbiology.orderDetail.admissionDate', 'Date of admission')} disabled placeholder={t('microbiology.orderDetail.admissionDateOutpatient', 'Outpatients are not admitted')} /></Column>
        <Column lg={4}>
          <Select id="tbh" labelText={`${t('microbiology.case.tbHistory', 'TB history')} ◆`} defaultValue="" invalid invalidText={t('microbiology.case.requiredBeforeFinal', 'Needed before final report')}>
            <SelectItem value="" text={t('label.select', 'Select')} />
            <SelectItem value="new" text={t('microbiology.case.tbHistory.new', 'New')} />
            <SelectItem value="prev" text={t('microbiology.case.tbHistory.previouslyTreated', 'Previously treated')} />
            <SelectItem value="contact" text={t('microbiology.case.tbHistory.drtbContact', 'DR-TB contact')} />
          </Select>
        </Column>
        <Column lg={4}><NumberInput id="tm" label={t('microbiology.case.treatmentMonth', 'Treatment month')} min={0} max={36} value={0} /></Column>
        <Column lg={4}>
          <TextInput id="spn" labelText={t('microbiology.case.specimenNumber', 'Specimen number')} defaultValue="TB-2026-0417/2" />
        </Column>
        <Column lg={4}>
          <Select id="ctime" labelText={t('microbiology.case.collectionTiming', 'Collection timing')} defaultValue="em">
            <SelectItem value="spot" text={t('microbiology.case.collectionTiming.spot', 'Spot')} />
            <SelectItem value="em" text={t('microbiology.case.collectionTiming.earlyMorning', 'Early morning')} />
          </Select>
        </Column>
        <Column lg={4}>
          <Select id="cm" labelText={t('microbiology.case.collectionMethod', 'Collection method')} defaultValue="exp">
            <SelectItem value="exp" text="Expectorated" /><SelectItem value="ind" text="Induced" /><SelectItem value="asp" text="Aspirate" />
          </Select>
        </Column>
        <Column lg={4}><NumberInput id="sets" label={t('microbiology.orderDetail.numberOfSets', 'Number of sets')} min={1} max={10} value={1} /></Column>
        <Column lg={8}>
          <ComboBox id="bsite" titleText={`${t('label.bodySite', 'Body site')} *`} placeholder={t('microbiology.case.bodySite.search', 'Search body sites')}
            items={BODY_SITES} initialSelectedItem={BODY_SITES[0]} onChange={() => {}}
            helperText={t('microbiology.case.bodySite.helper', 'Type to search. A correction saves to the order sample (D-077).')} />
        </Column>
        <Column lg={16}>
          <TextArea id="hist" labelText={t('microbiology.orderDetail.clinicalHistory', 'Clinical history')} rows={6} enableCounter maxCount={4000}
            defaultValue="Cough 6 weeks, weight loss 6 kg, night sweats. Previously treated for drug-susceptible TB in 2025 (completed 6 months HRZE at Gerehu clinic). Household contact of a confirmed RR-TB case (brother, diagnosed August 2026). HIV negative, tested July 2026."
            helperText={t('microbiology.case.appliesToOrder', 'Applies to all {count} cases on this order').replace('{count}', 2)} />
        </Column>
      </Grid>
      <h6 style={{ marginTop: 'var(--cds-spacing-05)' }}>{t('microbiology.case.priorAntibiotics', 'Prior antibiotics')}</h6>
      <SimpleTable headers={[{ key: 'agent', header: t('label.agent', 'Agent') }, { key: 'date', header: t('label.dateStarted', 'Date started') }]}
        rows={[{ id: 'a1', agent: 'Amoxicillin', date: '10 Sep 2026' }, { id: 'a2', agent: 'HRZE', date: '02 Jun 2025' }]} />
      <Button kind="ghost" size="sm" renderIcon={Add}>{t('microbiology.case.addAntibiotic', 'Add antibiotic')}</Button>
    </Section>
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
      {row.type === 'graded' && (
        <>
          <TableContainer>
            <Table size="sm">
              <TableHead><TableRow><TableHeader>{t('microbiology.case.result.observed', 'Observed')}</TableHeader><TableHeader>{t('microbiology.case.result.grade', 'Grade')}</TableHeader><TableHeader /></TableRow></TableHead>
              <TableBody>{graded.map((g, i) => (
                <TableRow key={i}>
                  <TableCell><Select id={`obs-${row.id}-${i}`} labelText="" hideLabel size="sm" defaultValue={g.what}>{OBSERVATIONS.map((o) => <SelectItem key={o} value={o} text={o} />)}</Select></TableCell>
                  <TableCell>
                    <ContentSwitcher size="sm" selectedIndex={GRADES.indexOf(g.grade)} onChange={({ index }) => setGraded(graded.map((x, j) => (j === i ? { ...x, grade: GRADES[index] } : x)))}>
                      {GRADES.map((gr) => <Switch key={gr} name={gr} text={gr} />)}
                    </ContentSwitcher>
                  </TableCell>
                  <TableCell><Button kind="ghost" size="sm" onClick={() => setGraded(graded.filter((_, j) => j !== i))}>{t('button.remove', 'Remove')}</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TableContainer>
          <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setGraded([...graded, { what: OBSERVATIONS[2], grade: 'Few' }])}>{t('microbiology.case.result.addObservation', 'Add observation')}</Button>
        </>
      )}
      <Grid condensed style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Column lg={4}><Checkbox id={`prev-${row.id}`} labelText={t('microbiology.case.previousReport', 'Previous report')} checked={prev} onChange={(e, { checked }) => setPrev(checked)} /></Column>
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
        <Column lg={16}><NotesSection id={row.id} printable={printable} /></Column>
      </Grid>
      <p><small>{t('microbiology.case.flagsFromCatalog', 'Flags come from the test catalog, exactly as on Results Entry. Saving records the result as Entered.')}</small></p>
      <Stack orientation="horizontal" gap={3}>
        <Button size="sm" onClick={onClose}>{t('microbiology.case.result.save', 'Save result')}</Button>
        <Button size="sm" kind="ghost" onClick={onClose}>{t('button.cancel', 'Cancel')}</Button>
      </Stack>
    </Tile>
  );
}

function CaseTestTable({ rows }) {
  const [open, setOpen] = useState(null);
  const [labOnly, setLabOnly] = useState({ wgs: true });
  const stateKindFor = (st) => (st === 'Validated' ? 'green' : st === 'Entered' ? 'warm-gray' : 'gray');
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
                  <div>{r.external && <Tag type="gray" size="sm">{t('microbiology.case.external', 'External result')}</Tag>}{labOnly[r.id] && <Tag type="purple" size="sm">{t('microbiology.case.inLabOnly', 'In lab only')}</Tag>}</div></TableCell>
                <TableCell style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{r.display || <em>{t('microbiology.case.result.notEntered', 'Not entered')}</em>}</TableCell>
                <TableCell>{r.flag ? <Tag type="red" size="sm">{r.flag}</Tag> : <small>{t('label.none', 'none')}</small>}</TableCell>
                <TableCell>{r.by || t('label.na', 'n/a')}</TableCell>
                <TableCell><small>{r.lot || (r.external ? t('microbiology.case.lot.external', 'n/a (external)') : t('label.na', 'n/a'))}</small></TableCell>
                <TableCell><Tag type={stateKindFor(r.state)} size="sm">{r.state}</Tag></TableCell>
                <TableCell>
                  <Stack orientation="horizontal" gap={1}>
                    <Button kind="ghost" size="sm" onClick={() => setOpen(open === r.id ? null : r.id)}>{r.display ? t('button.edit', 'Edit') : t('microbiology.case.result.enter', 'Enter')}</Button>
                    <OverflowMenu size="sm" aria-label={t('label.rowActions', 'Row actions')} flipped>
                      <OverflowMenuItem itemText={labOnly[r.id] ? t('microbiology.case.inLabOnly.off', 'Turn off In lab only') : t('microbiology.case.inLabOnly.on', 'Mark In lab only')} onClick={() => setLabOnly({ ...labOnly, [r.id]: !labOnly[r.id] })} />
                      <OverflowMenuItem itemText={t('microbiology.case.moveResult', 'Move result')} />
                      <OverflowMenuItem itemText={t('microbiology.case.referTest', 'Refer this test')} />
                      <OverflowMenuItem itemText={t('microbiology.case.cancelTest', 'Cancel test')} isDelete />
                    </OverflowMenu>
                  </Stack>
                </TableCell>
              </TableRow>
              {open === r.id && (
                <TableRow><TableCell colSpan={7}><ResultEditor row={r} onClose={() => setOpen(null)} printable={!labOnly[r.id]} /></TableCell></TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/* ---------- Initial testing (A-06, A-07) ---------- */
function TestChooser({ onClose }) {
  return (
    <Tile>
      <p><small>{t('microbiology.case.chooser.help', 'The normal OpenELIS test and panel chooser (Clinical Order Entry v4 FR-B14), pre-filtered to Sputum and "used as" types. TB lab unit listed first. Added tests appear as rows; enter their results in the row.')}</small></p>
      <Checkbox id="all-lu" labelText={t('microbiology.case.chooser.allLabUnits', 'Show all lab units')} />
      <ExistingFence owner="Clinical Order Entry v4 FR-B14 (two-list chooser)" additions="pre-filter to the case specimen; lab unit first">
        <Grid condensed>
          <Column lg={8}><TextInput id="p-s" labelText={t('order.chooser.panels', 'Order Panels')} placeholder={t('order.chooser.search', 'Search name, code or LOINC')} /></Column>
          <Column lg={8}><TextInput id="t-s" labelText={t('order.chooser.tests', 'Order Tests')} defaultValue="stain" /></Column>
        </Grid>
        <Tag type="blue" filter>Gram stain (direct)</Tag>
      </ExistingFence>
      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button size="sm" onClick={onClose}>{t('button.add', 'Add')}</Button>
        <Button size="sm" kind="ghost" onClick={onClose}>{t('button.cancel', 'Cancel')}</Button>
      </Stack>
    </Tile>
  );
}

function InitialTesting({ rows }) {
  const [adding, setAdding] = useState(false);
  return (
    <Section n="2" title={t('microbiology.case.section.initialTesting', 'Initial testing')} isNew>
      <CaseTestTable rows={rows} />
      {adding
        ? <TestChooser onClose={() => setAdding(false)} />
        : <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setAdding(true)}>{t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Button>}
    </Section>
  );
}

/* ---------- Referral point (A-08): the order entry Refer out, reused ---------- */
function ReferralPoint() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const rows = [
    { id: 'rf1', sample: 'CPHL26-004812-1.1 (isolate sample, ISO-1)', type: 'Isolate', tests: 'TB second-line DST (phenotypic)', lab: 'QMRL Brisbane', status: 'RECEIVED' },
    ...(saved ? [{ id: 'rf2', sample: 'CPHL26-004812-1', type: 'Sputum', tests: 'Xpert MTB/XDR', lab: 'CPHL Port Moresby, TB reference laboratory', status: 'REQUESTED' }] : []),
  ];
  const statusTag = { RECEIVED: ['teal', t('label.referOut.status.received', 'Received')], REQUESTED: ['blue', t('label.referOut.status.requested', 'Requested')] };
  return (
    <Section n="3" title={t('microbiology.case.section.referral', 'Referral point')} isNew>
      <ExistingFence owner="Clinical Order Entry v4 Refer out (OrderReferOutSection, OrderReferOutForm, ReferralStatusTag; built)" additions="what to refer (remaining work, a test, an isolate sample); Referred marker">
        <SimpleTable
          headers={[
            { key: 'sample', header: t('label.referOut.column.sampleId', 'Sample') },
            { key: 'type', header: t('label.referOut.column.sampleType', 'Sample type') },
            { key: 'tests', header: t('label.referOut.column.tests', 'Tests') },
            { key: 'lab', header: t('label.referOut.column.referringLab', 'Reference laboratory') },
            { key: 'status', header: t('label.referOut.column.status', 'Status') },
          ]}
          rows={rows}
          render={(c) => (c.info.header === 'status' ? <Tag type={statusTag[c.value][0]} size="sm">{statusTag[c.value][1]}</Tag> : c.value)}
        />
        {open && (
          <Tile>
            <Grid condensed>
              <Column lg={6}><ComboBox id="rl" titleText={`${t('label.referOut.field.referringLab', 'Reference laboratory')} *`} items={['CPHL Port Moresby, TB reference laboratory', 'QMRL Brisbane', 'PNG Institute of Medical Research']} initialSelectedItem="CPHL Port Moresby, TB reference laboratory" onChange={() => {}} /></Column>
              <Column lg={5}><Select id="rr" labelText={`${t('order.referral.reason', 'Reason for referral')} *`} defaultValue="na"><SelectItem value="na" text="Test not available" /><SelectItem value="conf" text="Confirmation" /></Select></Column>
              <Column lg={5}><TextInput id="rfr" labelText={t('referrer.label', 'Referrer')} defaultValue="J. Kaupa" /></Column>
              <Column lg={4}><TextInput id="hd" labelText={t('label.referOut.field.handoffDate', 'Hand-off date')} defaultValue="29/09/2026" /></Column>
              <Column lg={4}><TextInput id="ht" labelText={t('label.referOut.field.handoffTime', 'Hand-off time')} defaultValue="10:30" /></Column>
              <Column lg={4}><TextInput id="er" labelText={t('label.referOut.field.expectedReturnDate', 'Expected return date')} defaultValue="06/10/2026" /></Column>
            </Grid>
            <fieldset style={{ marginTop: 'var(--cds-spacing-05)' }}>
              <legend><small>{t('order.referral.testsToRefer', 'Tests to refer')}</small></legend>
              <Checkbox id="t1" labelText="Xpert MTB/XDR" defaultChecked />
              <Checkbox id="t2" labelText="TB culture" />
              <Checkbox id="t3" labelText="TB first-line DST" />
            </fieldset>
            <InlineNotification kind="warning" lowContrast hideCloseButton title={t('order.referral.partial', 'Tests not referred stay here, but this tube leaves the laboratory.')} />
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

function Culture({ rows, setRows, labUnit }) {
  const [reading, setReading] = useState(null);
  const [notesFor, setNotesFor] = useState(null);
  const { notes } = useContext(NotesContext);
  const [exams, setExams] = useState([{ id: 'MIC-1', from: 'MGIT-004812-A', stain: 'Ziehl-Neelsen', obs: 'Acid-fast bacilli seen; serpentine cording', at: '28 Sep 08:50', by: 'R. Opa' }]);
  const [examFor, setExamFor] = useState(null);
  const [stain, setStain] = useState('Ziehl-Neelsen');
  const [atm, setAtm] = useState('aerobic');
  const [temp, setTemp] = useState(37);
  const ordered = useMemo(() => {
    const out = [];
    const walk = (parent, depth) => rows.forEach((r) => { if ((r.from || '') === parent) { out.push({ ...r, depth }); walk(r.id, depth + 1); } });
    walk('', 0);
    return out;
  }, [rows]);
  const setOutcome = (id, state) => setRows(rows.map((r) => (r.id === id ? { ...r, state, next: '', log: [...r.log, `Day ${r.day}: marked ${state.toLowerCase()}`] } : r)));
  const record = (id, v) => { setRows(rows.map((r) => (r.id === id ? { ...r, state: v === 'Significant growth' ? 'Positive' : 'Incubating', log: [...r.log, `Day ${r.day}: ${v.toLowerCase()}`] } : r))); setReading(null); };
  return (
    <Section n="4" title={t('microbiology.case.section.culture', 'Culture')} isNew>
      <p><small>{t('microbiology.case.culture.help', 'Each culture is marked positive or no growth on its own. Subcultures and microscopy exams are listed under the culture they came from.')}</small></p>
      <TableContainer>
        <Table size="sm">
          <TableHead><TableRow>
            <TableHeader>{t('microbiology.case.inoc.container', 'Container')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.medium', 'Medium')} · {t('microbiology.case.inoc.lot', 'Lot')} · {t('microbiology.case.inoc.atmosphere', 'Atmosphere')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.duration', 'Incubation duration')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.ends', 'Incubation ends')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.nextCheck', 'Next check')}</TableHeader>
            <TableHeader>{t('label.state', 'State')}</TableHeader>
            <TableHeader>{t('microbiology.case.inoc.readLog', 'Read log')}</TableHeader>
            <TableHeader />
          </TableRow></TableHead>
          <TableBody>
            {ordered.map((r) => (
              <React.Fragment key={r.id}>
              <TableRow>
                <TableCell>
                  <span style={{ display: 'inline-block', marginLeft: `calc(${r.depth} * var(--cds-spacing-07))` }}>
                    {r.depth > 0 && <small>↳ {t('microbiology.case.subculture', 'Subculture')} · </small>}{r.id}
                  </span>
                </TableCell>
                <TableCell>{r.medium}<div><small>{r.notTracked ? <Tag type="warm-gray" size="sm">{t('microbiology.case.inoc.notTrackedTag', 'Not tracked')}</Tag> : `${t('microbiology.case.inoc.lot', 'Lot')} ${r.lot}`} · {ATMOSPHERES.find(([k]) => k === r.atm)[1]} · {r.temp} °C</small></div></TableCell>
                <TableCell>{r.dur} {r.unit}<div><small>{t('microbiology.case.inoc.checkEvery', 'Check every')} {r.every} {r.eunit}</small></div></TableCell>
                <TableCell>{r.ends}<div><small>{t('microbiology.case.inoc.dayOf', 'Day {n} of {N}').replace('{n}', r.day).replace('{N}', r.dur)}</small></div></TableCell>
                <TableCell>{r.next || t('label.na', 'n/a')}</TableCell>
                <TableCell><Tag type={stateKind(r.state)} size="sm">{r.state}</Tag></TableCell>
                <TableCell><small>{r.log.join(' · ')}</small></TableCell>
                <TableCell>
                  {reading === r.id ? (
                    <Select id={`rd-${r.id}`} labelText="" hideLabel size="sm" defaultValue="" onChange={(e) => record(r.id, e.target.value)}>
                      <SelectItem value="" text={t('microbiology.case.inoc.recordReading', 'Record reading')} />
                      {['No growth', 'Normal flora', 'Mixed growth', 'Significant growth'].map((v) => <SelectItem key={v} value={v} text={v} />)}
                    </Select>
                  ) : (r.state === 'Check due' || r.state === 'Incubating') && (
                    <OverflowMenu size="sm" aria-label={t('label.rowActions', 'Row actions')} flipped>
                      <OverflowMenuItem itemText={t('microbiology.case.inoc.recordReading', 'Record reading')} onClick={() => setReading(r.id)} />
                      <OverflowMenuItem itemText={t('microbiology.case.inoc.markPositive', 'Mark positive')} onClick={() => setOutcome(r.id, 'Positive')} />
                      <OverflowMenuItem itemText={t('microbiology.case.inoc.markNoGrowth', 'Mark no growth')} onClick={() => setOutcome(r.id, 'No growth')} />
                      <OverflowMenuItem itemText={t('microbiology.case.printLabel', 'Print label')} />
                      <OverflowMenuItem itemText={t('microbiology.case.reading.contaminated', 'Contaminated')} onClick={() => setOutcome(r.id, 'Contaminated')} />
                    </OverflowMenu>
                  )}
                  <Button kind="ghost" size="sm" onClick={() => setNotesFor(notesFor === r.id ? null : r.id)}>{noteCountLabel(notes, r.id)}</Button>
                  <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setExamFor(r.id)}>{t('microbiology.case.microscopy.add', 'Microscopy exam')}</Button>
                  {!(r.state === 'Check due' || r.state === 'Incubating') && <Button kind="ghost" size="sm">{t('microbiology.case.printLabel', 'Print label')}</Button>}
                </TableCell>
              </TableRow>
              {exams.filter((m) => m.from === r.id).map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <span style={{ display: 'inline-block', marginLeft: `calc(${r.depth + 1} * var(--cds-spacing-07))` }}>
                      <small>↳ {t('microbiology.case.microscopy', 'Microscopy')} · </small>{m.id}
                    </span>
                  </TableCell>
                  <TableCell colSpan={3}>{m.stain}<div><small>{m.obs}</small></div></TableCell>
                  <TableCell><small>{m.at}</small></TableCell>
                  <TableCell><Tag type="gray" size="sm">{t('microbiology.case.growth.internalOnly', 'Internal only, not reported')}</Tag></TableCell>
                  <TableCell><small>{m.by}</small></TableCell>
                  <TableCell><Button kind="ghost" size="sm" onClick={() => setNotesFor(notesFor === m.id ? null : m.id)}>{noteCountLabel(notes, m.id)}</Button></TableCell>
                </TableRow>
              ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {notesFor && <NotesSection id={notesFor} underCulture />}
      {examFor && (
        <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <h6>{t('microbiology.case.microscopy.add', 'Microscopy exam')} · {examFor}</h6>
          <p><small>{t('microbiology.case.microscopy.help', 'Internal only. Listed under its culture like a subculture. A reportable result from a positive culture uses Test on this culture.')}</small></p>
          <Grid condensed>
            <Column lg={5}>
              <Select id="mic-stain" labelText={`${t('microbiology.case.microscopy.stain', 'Stain or preparation')} *`} value={stain} onChange={(e) => setStain(e.target.value)}>
                {['Gram', 'Ziehl-Neelsen', 'Auramine', 'Lactophenol cotton blue', 'India ink', 'Wet mount', 'Motility'].map((x) => <SelectItem key={x} value={x} text={x} />)}
              </Select>
            </Column>
            <Column lg={5}>
              <ExistingFence owner="M-12 reagent lot picker (built)" additions="none">
                <Select id="mic-lot" labelText={t('label.reagentLot', 'Reagent lot')}><SelectItem value="z" text="ZN stain kit, lot 22071, exp 03/2027" /><SelectItem value="g" text="Gram stain kit, lot 44120" /></Select>
              </ExistingFence>
            </Column>
            <Column lg={6}><TextInput id="mic-obs" labelText={t('microbiology.case.microscopy.observations', 'Observations (graded rows, as Gram stain)')} defaultValue={stain === 'Gram' ? 'Gram-positive cocci in clusters: many' : 'Acid-fast bacilli seen'} /></Column>
          </Grid>
          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button size="sm" onClick={() => { setExams([...exams, { id: `MIC-${exams.length + 1}`, from: examFor, stain, obs: stain === 'Gram' ? 'Gram-positive cocci in clusters: many' : 'Acid-fast bacilli seen', at: '30 Sep 09:40', by: 'J. Kaupa' }]); setExamFor(null); }}>{t('microbiology.case.microscopy.save', 'Save microscopy exam')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setExamFor(null)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </Tile>
      )}
      <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <h6>{t('microbiology.case.inoc.start', 'Start inoculation')}</h6>
        <TemplateProposal template={PLATING_TEMPLATES[1]} />
        <p><small>{t('microbiology.case.inoc.oneRow', 'Or add one row (pre-filled from the previous row):')}</small></p>
        <Grid condensed>
          <MediumPicker id="inoc" onPrefill={(m) => { setAtm(m.atm); setTemp(m.temp); }} />
          <Column lg={6}>
            <Select id="atm" labelText={`${t('microbiology.case.inoc.atmosphere', 'Atmosphere')} *`} value={atm} onChange={(e) => setAtm(e.target.value)}
              helperText={t('microbiology.case.inoc.atmosphere.prefill', "Pre-filled from the medium's usual atmosphere when Inventory records one")}>
              {ATMOSPHERES.map(([k, l]) => <SelectItem key={k} value={k} text={l} />)}
            </Select>
          </Column>
          <Column lg={4}><TextInput id="cid" labelText={`${t('microbiology.case.inoc.container', 'Container identifier')} *`} defaultValue="MGIT-004812-C" /></Column>
          <Column lg={4}><NumberInput id="temp" label={t('microbiology.case.inoc.temperature', 'Temperature (°C)')} value={temp} min={20} max={45} onChange={(e, { value }) => setTemp(value)} /></Column>
          <Column lg={2}><NumberInput id="dur" label={`${t('microbiology.case.inoc.duration', 'Incubation duration')} *`} value={42} min={1} /></Column>
          <Column lg={2}>
            <Select id="dunit" labelText={t('microbiology.case.inoc.unit', 'Unit')} defaultValue="days">
              <SelectItem value="hours" text={t('microbiology.case.inoc.unit.hours', 'Hours')} />
              <SelectItem value="days" text={t('microbiology.case.inoc.unit.days', 'Days')} />
            </Select>
          </Column>
          <Column lg={2}><NumberInput id="every" label={t('microbiology.case.inoc.checkEvery', 'Check every')} value={7} min={1} /></Column>
          <Column lg={2}>
            <Select id="eunit" labelText={t('microbiology.case.inoc.unit', 'Unit')} defaultValue="days">
              <SelectItem value="hours" text={t('microbiology.case.inoc.unit.hours', 'Hours')} />
              <SelectItem value="days" text={t('microbiology.case.inoc.unit.days', 'Days')} />
            </Select>
          </Column>
          <Column lg={8}>
            <ExistingFence owner="M-12 reagent lot picker (built), for other reagents linked to the test" additions="none">
              <Select id="lot" labelText={t('label.reagentLot', 'Reagent lot')}><SelectItem value="l1" text="MGIT PANTA supplement, lot 8210445, exp 03/2027 (FEFO)" /></Select>
            </ExistingFence>
          </Column>
        </Grid>
      </Tile>
    </Section>
  );
}

/* ---------- Growth work-up (A-10) ---------- */
function GrowthWorkup({ rows, setRows, labUnit }) {
  const [satm, setSatm] = useState('aerobic');
  const [adding, setAdding] = useState(false);
  const [from, setFrom] = useState('');
  const [purpose, setPurpose] = useState('');
  const [cultureTests, setCultureTests] = useState([]);
  const sorted = [...rows.filter((r) => r.state === 'Positive'), ...rows.filter((r) => r.state !== 'Positive')];
  const fromRow = rows.find((r) => r.id === from);
  const add = () => {
    if (!from) return;
    setRows([...rows, { id: 'BA-SUB-004812-A2', from, medium: 'Blood agar (sheep) plate', lot: 'BA-26-117', atm: 'co2', temp: 37, dur: 48, unit: 'Hours', every: 24, eunit: 'Hours', start: '29 Sep 09:00', ends: '01 Oct 09:00', next: '30 Sep 09:00', day: 1, state: 'Incubating', log: [] }]);
    setAdding(false); setFrom('');
  };
  return (
    <Section n="5" title={t('microbiology.case.section.growthWorkup', 'Growth work-up')} isNew>
      <SimpleTable
        headers={[{ key: 'from', header: t('label.from', 'From') }, { key: 'item', header: t('label.item', 'Item') }, { key: 'detail', header: t('label.detail', 'Detail') }, { key: 'vis', header: t('label.visibility', 'Visibility') }]}
        rows={[{ id: 'g1', from: 'MGIT-004812-A', item: t('microbiology.case.growth.microscopyExam', 'Microscopy exam'), detail: 'ZN on culture: AFB, cording seen. Purity check: no contaminants.', vis: t('microbiology.case.growth.internalOnly', 'Internal only, not reported') }]}
        render={(c) => (c.info.header === 'vis' ? <Tag type="gray" size="sm">{c.value}</Tag> : c.value)}
      />
      <h6 style={{ marginTop: 'var(--cds-spacing-05)' }}>{t('microbiology.case.growth.testsOnCulture', 'Tests on a positive culture')} <Tag type="blue" size="sm">v2</Tag></h6>
      <p><small>{t('microbiology.case.growth.testsOnCultureHelp', 'Reportable: preliminary report and critical rules apply (for example the Gram stain from a positive blood culture bottle).')}</small></p>
      {cultureTests.length ? <CaseTestTable rows={cultureTests} /> : <p><small>{t('microbiology.case.growth.noTestsOnCulture', 'No tests on a culture yet.')}</small></p>}
      {adding ? (
        <Tile>
          <Grid condensed>
            <Column lg={8}>
              <Select id="from" labelText={`${t('microbiology.case.subculture.fromCulture', 'From culture')} *`} value={from} onChange={(e) => setFrom(e.target.value)}
                helperText={t('microbiology.case.subculture.fromHelp', 'Positive cultures first; any culture can be subcultured')}>
                <SelectItem value="" text={t('microbiology.case.subculture.select', 'Select a culture')} />
                {sorted.map((r) => <SelectItem key={r.id} value={r.id} text={`${r.id}, ${r.medium}, ${r.state === 'Positive' ? `positive day ${r.day}` : r.state.toLowerCase()}`} />)}
              </Select>
            </Column>
            {fromRow && fromRow.state !== 'Positive' && (
              <Column lg={8}>
                <Select id="spurpose" labelText={`${t('microbiology.case.subculture.purpose', 'Purpose')} *`} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                  <SelectItem value="" text={t('label.select', 'Select')} />
                  <SelectItem value="enrichment" text={t('microbiology.case.subculture.purpose.enrichment', 'Enrichment')} />
                  <SelectItem value="blind" text={t('microbiology.case.subculture.purpose.blind', 'Blind or terminal subculture')} />
                  <SelectItem value="purity" text={t('microbiology.case.subculture.purpose.purity', 'Purity')} />
                  <SelectItem value="other" text={t('microbiology.case.subculture.purpose.other', 'Other')} />
                </Select>
              </Column>
            )}
            <MediumPicker id="sub" onPrefill={(m) => setSatm(m.atm)} />
            <Column lg={6}>
              <Select id="satm" labelText={`${t('microbiology.case.inoc.atmosphere', 'Atmosphere')} *`} value={satm} onChange={(e) => setSatm(e.target.value)}>
                {ATMOSPHERES.map(([k, l]) => <SelectItem key={k} value={k} text={l} />)}
              </Select>
            </Column>
          </Grid>
          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button size="sm" onClick={add}>{t('microbiology.case.subculture.add', 'Add subculture')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setAdding(false)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </Tile>
      ) : (
        <Stack orientation="horizontal" gap={3}>
          <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setCultureTests([{ id: 'xpert-mgit', test: 'Xpert MTB/RIF Ultra', on: 'MGIT-004812-A (from culture)', type: 'components', components: [{ c: 'MTB', v: 'Detected, high', opts: ['Not detected', 'Detected, low', 'Detected, medium', 'Detected, high'] }, { c: 'Rifampicin resistance', v: 'Not detected', opts: ['Not detected', 'Detected', 'Indeterminate'] }], display: 'MTB detected, high; rifampicin resistance not detected', flag: '', by: 'R. Opa (this lab)', lot: 'Xpert MTB/RIF Ultra cartridges, lot 1000-2231', state: 'Entered' }])}>{t('microbiology.case.growth.testOnCulture', 'Test on this culture')}</Button>
          <Button kind="tertiary" size="sm" renderIcon={Add}>{t('microbiology.case.growth.microscopyExam', 'Microscopy exam')}</Button>
          <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setAdding(true)}>{t('microbiology.case.subculture', 'Subculture')}</Button>
        </Stack>
      )}
    </Section>
  );
}

/* ---------- Isolates (existing, plus Picked from) ---------- */
function Isolates({ rows }) {
  const [adding, setAdding] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const { notes } = useContext(NotesContext);
  const growth = rows.filter((r) => r.state === 'Positive');
  return (
    <Section n="6" title={t('microbiology.case.section.isolates', 'Isolates')}>
      <ExistingFence owner="M-04 IsolatePanel (built)" additions="Picked from column and field; isolate sample item for its own tests (FR-10.1c); Notes on the isolate (FR-13.1a)">
        <SimpleTable
          headers={[{ key: 'iso', header: t('microbiology.case.isolate', 'Isolate') }, { key: 'from', header: t('microbiology.case.isolate.pickedFrom', 'Picked from') }, { key: 'org', header: t('microbiology.case.organism', 'Organism') }, { key: 'idm', header: t('microbiology.case.idMethod', 'ID method · confidence') }, { key: 'sig', header: t('microbiology.case.significance', 'Significance') }]}
          rows={[{ id: 'iso1', iso: 'ISO-1', from: 'MGIT-004812-A', org: 'Mycobacterium tuberculosis complex', idm: 'MPT64 antigen · 99%', sig: 'Clinically significant' }]}
          render={(c) => (c.info.header === 'sig' ? <Tag type="green" size="sm">{c.value}</Tag> : c.value)}
        />
        <Button kind="ghost" size="sm" onClick={() => setNotesOpen(!notesOpen)}>ISO-1 · {noteCountLabel(notes, 'ISO-1')}</Button>
        <Button kind="ghost" size="sm">ISO-1 · {t('microbiology.case.printLabel', 'Print label')}</Button>
        {notesOpen && <NotesSection id="ISO-1" />}
      </ExistingFence>
      <Tile style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <small>Example from a bacterial urine case: ISO-1 <em>E. coli</em></small>
        <div>
          <Tag type="warm-gray" size="sm">{t('microbiology.case.repeatIsolate', 'Same organism on {labNumber}, {days} days ago, AST done').replace('{labNumber}', 'CPHL26-004655').replace('{days}', '6')}</Tag>
          <Button kind="ghost" size="sm">{t('microbiology.case.referPreviousAst', 'Refer to previous susceptibility')}</Button>
        </div>
      </Tile>
      {adding ? (
        <Tile>
          <Grid condensed>
            <Column lg={6}>
              <Select id="pf" labelText={`${t('microbiology.case.isolate.pickedFrom', 'Picked from')} *`} defaultValue="" helperText={t('microbiology.case.isolate.pickedFromHelp', 'One positive culture can give several isolates')}>
                <SelectItem value="" text={t('microbiology.case.isolate.selectSource', 'Select a culture with growth')} />
                {growth.map((r) => <SelectItem key={r.id} value={r.id} text={`${r.id}, ${r.medium}`} />)}
              </Select>
            </Column>
            <Column lg={4}><TextInput id="lbl" labelText={`${t('microbiology.case.isolate.label', 'Label')} *`} defaultValue="ISO-2" /></Column>
          </Grid>
          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button size="sm" onClick={() => setAdding(false)}>{t('microbiology.case.isolate.create', 'Create isolate')}</Button>
            <Button size="sm" kind="ghost" onClick={() => setAdding(false)}>{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </Tile>
      ) : <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setAdding(true)}>{t('microbiology.case.isolate.add', 'Add isolate')}</Button>}
    </Section>
  );
}

/* ---------- AST / DST (existing, plus panels per isolate) ---------- */
function AstDst() {
  const [bp, setBp] = useState('who');
  return (
    <Section n="7" title={t('microbiology.case.section.astDst', 'AST / DST')}>
      <SimpleTable
        headers={[{ key: 'panel', header: t('microbiology.case.ast.panelsOn', 'Panels on ISO-1') }, { key: 'added', header: t('label.added', 'Added') }, { key: 'method', header: t('microbiology.case.ast.methodStandard', 'Method · standard') }, { key: 'val', header: t('label.validation', 'Validation') }]}
        rows={[
          { id: 'p1', panel: 'TB first-line DST v3', added: t('microbiology.case.ast.organismDefault', 'Organism default'), method: 'MGIT 960 · WHO critical concentrations 2024', val: 'Entered' },
          { id: 'p2', panel: 'TB second-line DST v2', added: t('microbiology.case.ast.addedChooser', 'Added with the chooser'), method: 'MGIT 960 · WHO critical concentrations 2024', val: 'Not started' },
        ]}
        render={(c) => (c.info.header === 'added' && c.value === 'Organism default' ? <Tag type="teal" size="sm">{c.value}</Tag> : c.info.header === 'val' ? <Tag type={c.value === 'Entered' ? 'warm-gray' : 'gray'} size="sm">{c.value}</Tag> : c.value)}
      />
      <ExistingFence owner="M-05 AstEntryPanel, AstAttemptTable (built)" additions="breakpoint default from the panel's interpretation model with a reason for another; Validate run wording">
        <Grid condensed>
          <Column lg={4}>
            <Select id="bp" labelText={`${t('microbiology.case.ast.breakpointStandard', 'Breakpoint standard')} *`} value={bp} onChange={(e) => setBp(e.target.value)}
              helperText={t('microbiology.case.ast.bpHelper', 'Default from the panel (TB critical concentrations)')}>
              <SelectItem value="who" text="WHO critical concentrations 2024" />
              <SelectItem value="clsi" text="CLSI M100 36th ed. (2026)" />
              <SelectItem value="eucast" text="EUCAST v15.0 (2025)" />
            </Select>
          </Column>
          {bp !== 'who' && <Column lg={6}><TextInput id="bpr" labelText={`${t('microbiology.case.bpStandard.reason', 'Reason for another breakpoint standard')} *`} /></Column>}
        </Grid>
        <SimpleTable
          headers={[{ key: 'drug', header: t('label.drug', 'Drug') }, { key: 'raw', header: t('label.raw', 'Raw') }, { key: 'source', header: t('label.source', 'Source') }, { key: 'matchedBy', header: t('microbiology.ast.matchedBy', 'Matched by') }, { key: 'interp', header: t('label.interpretation', 'Interpretation') }]}
          rows={DST_READINGS}
          render={(c) => (c.info.header === 'interp' ? <Tag type={interpKind(c.value)} size="sm">{c.value}</Tag> : c.value)}
        />
        <Stack orientation="horizontal" gap={3}>
          <Button size="sm" kind="secondary">{t('microbiology.ast.recordReading', 'Record reading')}</Button>
          <Button size="sm" disabled>{t('microbiology.case.ast.validateRun', 'Validate run: Accept results')}</Button>
          <Button size="sm" kind="ghost">{t('microbiology.ast.newAttempt', 'New attempt')}</Button>
        </Stack>
      </ExistingFence>
      <div style={{ marginTop: 'var(--cds-spacing-05)' }}>
        {t('microbiology.case.tbClassification', 'Resistance classification')}: <Tag type="red">{t('microbiology.case.tbClassification.mdr', 'MDR-TB')}</Tag>
      </div>
      <Button kind="tertiary" size="sm" renderIcon={Add}>{t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Button>
    </Section>
  );
}

/* ---------- Additional testing (A-15): same table and editor as Initial testing ---------- */
function AdditionalTesting() {
  return (
    <Section n="8" title={t('microbiology.case.section.additionalTesting', 'Additional testing')} isNew>
      <CaseTestTable rows={ADDITIONAL_ROWS} />
      <Button kind="tertiary" size="sm" renderIcon={Add}>{t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Button>
    </Section>
  );
}

/* ---------- Critical communication, NCE (existing) ---------- */
function CriticalCommunication() {
  return (
    <Section n="9" title={t('microbiology.case.section.critical', 'Critical communication')}>
      <ExistingFence owner="M-11 CriticalCommunicationPanel (built)" additions="required Outcome on each call; each call also writes a critical_callback row (A-18)">
        <SimpleTable
          headers={[{ key: 'target', header: t('label.target', 'Target') }, { key: 'to', header: t('label.recipient', 'Recipient') }, { key: 'method', header: t('label.method', 'Method') }, { key: 'outcome', header: t('microbiology.case.critical.outcome', 'Outcome') }, { key: 'status', header: t('label.status', 'Status') }]}
          rows={[
            { id: 'c1', target: 'Result: Xpert RIF', to: 'Dr. Wari, Chest Clinic', method: 'Phone', outcome: t('callback.outcome.confirmed', 'Read back confirmed'), status: 'Acknowledged' },
            { id: 'c2', target: 'Case: RR-TB', to: 'National TB Programme, DR-TB desk', method: 'Email', outcome: t('callback.outcome.noReadback', 'Reached, no read-back'), status: 'Open' },
          ]}
          render={(c) => (c.info.header === 'status' ? <Tag type={c.value === 'Open' ? 'warm-gray' : 'blue'} size="sm">{c.value}</Tag> : c.value)}
        />
      </ExistingFence>
    </Section>
  );
}

function Nonconformance() {
  return (
    <Section n="10" title={t('microbiology.case.section.nce', 'Nonconformance')}>
      <ExistingFence owner="M-04 CaseNonconformancePanel (built)" additions="none">
        <p><small>{t('microbiology.case.nce.none', 'No NCE on this case.')}</small></p>
      </ExistingFence>
    </Section>
  );
}

/* ---------- Report (A-11, A-17) ---------- */
function Report() {
  const [sel, setSel] = useState({ smear: true, xpert: true, iso: true, rif: true, inh: true, emb: false });
  const items = [
    ['smear', 'Initial testing', 'AFB smear: 2+', 'On'],
    ['xpert', 'Initial testing', 'Xpert: MTB detected, RIF resistance detected (Goroka)', 'On'],
    ['iso', 'Isolate 1', 'M. tuberculosis complex', 'On (significant)'],
    ['rif', 'DST, run 1', 'Rifampicin R', 'Always'],
    ['inh', 'DST, run 1', 'Isoniazid R', 'Always'],
    ['emb', 'DST, run 1', 'Ethambutol S', 'Cascade: off'],
  ];
  return (
    <Section n="11" title={t('microbiology.case.section.report', 'Report')}>
      <Grid condensed>
        <Column lg={8}>
          <TableContainer>
            <Table size="sm">
              <TableHead><TableRow>
                <TableHeader>{t('microbiology.case.report.include', 'Report')}</TableHeader>
                <TableHeader>{t('label.result', 'Result')}</TableHeader>
                <TableHeader>{t('label.default', 'Default')}</TableHeader>
              </TableRow></TableHead>
              <TableBody>{items.map(([k, sec, lbl, d]) => (
                <TableRow key={k}>
                  <TableCell><Checkbox id={`rep-${k}`} labelText="" hideLabel checked={sel[k]} onChange={(e, { checked }) => setSel({ ...sel, [k]: checked })} /></TableCell>
                  <TableCell><small>{sec}</small><div>{lbl}</div></TableCell>
                  <TableCell><small>{d}</small></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TableContainer>
        </Column>
        <Column lg={8}>
          <InlineNotification kind="warning" lowContrast hideCloseButton title={t('microbiology.case.report.finalChecklist', 'Final report checklist')}
            subtitle="LJ-004812-B and LJ-SUB-004812-A1 still incubating · DST run 1 not validated · TB history needed before final report" />
          <SimpleTable
            headers={[{ key: 'type', header: t('microbiology.case.report.release', 'Release') }, { key: 'when', header: t('label.releasedBy', 'Released') }]}
            rows={[{ id: 'r1', type: t('microbiology.case.report.preliminary', 'Preliminary'), when: '23 Sep 2026 · J. Kaupa' }, { id: 'r2', type: t('microbiology.case.report.interim', 'Interim'), when: '28 Sep 2026 · R. Opa' }]}
          />
          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button size="sm" kind="secondary">{t('microbiology.case.report.releaseInterim', 'Release interim')}</Button>
            <Button size="sm" disabled>{t('microbiology.case.report.releaseFinal', 'Release final')}</Button>
          </Stack>
          <p><small>{t('microbiology.case.report.printsIn', 'Prints inside the patient report (OGC-1111 §7.4): case rows under the TB section, one susceptibility block per reported isolate.')}</small></p>
        </Column>
      </Grid>
    </Section>
  );
}

function AmendmentAndTimeline() {
  return (
    <>
      <Section n="12" title={t('microbiology.case.section.amendment', 'Amendment')}>
        <ExistingFence owner="M-04 AmendmentHistoryPanel (built)" additions="every change after final routes through an open amendment (A-17)">
          <p><small>{t('microbiology.case.amendment.none', 'Available after final release.')}</small></p>
        </ExistingFence>
      </Section>
      <Section n="13" title={t('microbiology.case.section.timeline', 'Timeline')}>
        <ExistingFence owner="M-04 CaseTimelinePanel (built)" additions="new event types (lab unit change, readings, placements, moves, In lab only)">
          <SimpleTable
            headers={[{ key: 'when', header: t('label.when', 'When') }, { key: 'what', header: t('label.event', 'Event') }]}
            rows={[
              { id: 'e1', when: '28 Sep 11:00', what: 'Subculture LJ-SUB-004812-A1 from MGIT-004812-A · J. Kaupa' },
              { id: 'e2', when: '28 Sep 10:02', what: t('microbiology.case.labUnitChanged', 'Lab unit changed from {from} to {to}').replace('{from}', 'Microbiology').replace('{to}', 'TB') + ' · R. Opa' },
              { id: 'e3', when: '28 Sep 09:12', what: 'MGIT-004812-A marked positive by analyzer signal (TTD 4.8 d)' },
            ]}
          />
        </ExistingFence>
      </Section>
    </>
  );
}

/* ---------- Case view ---------- */
export function MicrobiologyCaseView() {
  const [labUnit, setLabUnit] = useState('TB');
  const [incoming, setIncoming] = useState(INCOMING);
  const [cultures, setCultures] = useState(CULTURE_ROWS);
  const [media, setMedia] = useState(MEDIA_SEED);
  const [notes, setNotes] = useState(NOTE_SEED);
  const addNote = (id, n) => setNotes((prev) => ({ ...prev, [id]: [...(prev[id] || []), n] }));
  return (
    <NotesContext.Provider value={{ notes, addNote }}>
    <MediaContext.Provider value={{ media, setMedia }}>
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t('home.label', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('microbiology.navigation.title', 'Microbiology')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('microbiology.navigation.worklist', 'Worklist')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('microbiology.case.title', 'Case {labNumber}').replace('{labNumber}', 'CPHL26-004812')}</BreadcrumbItem>
      </Breadcrumb>
      <CaseHeader labUnit={labUnit} onChangeLabUnit={setLabUnit} />
      <Accordion>
        <IncomingResults items={incoming} isolates={['ISO-1']} onPlace={(id) => setIncoming(incoming.filter((i) => i.id !== id))} />
        <CaseInformation />
        <InitialTesting rows={INITIAL_ROWS} />
        <ReferralPoint />
        <Culture rows={cultures} setRows={setCultures} labUnit={labUnit} />
        <GrowthWorkup rows={cultures} setRows={setCultures} labUnit={labUnit} />
        <Isolates rows={cultures} />
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
  );
}

/* ---------- Worklist: Needs attention (A-12) ---------- */
export function MicrobiologyWorklist() {
  const [grain, setGrain] = useState(0);
  const [rows, setRows] = useState([
    { id: 'w1', lab: 'CPHL26-004812', who: 'Kila Nou', unit: 'TB', type: 'Mycobacteriology (TB)', spec: 'Sputum', reasons: ['Check due', 'Incoming results'], day: 'Day 5 of 56' },
    { id: 'w2', lab: 'CPHL26-004790', who: 'Mary Siune', unit: 'Microbiology', type: 'Bacteriology', spec: 'Blood culture set (2 bottles)', reasons: ['Incubation complete'], day: 'Day 5 of 5' },
    { id: 'w3', lab: 'CPHL26-004702', who: 'Tau Morea', unit: 'TB', type: 'Mycobacteriology (TB)', spec: 'Sputum', reasons: ['Referral returned'], day: 'Referred' },
    { id: 'w4', lab: 'CPHL26-004795', who: 'Ruth Kaupa', unit: 'Microbiology', type: 'Bacteriology', spec: 'Blood culture, 2 sets', reasons: ['Instrument negative to confirm'], day: 'Day 5 of 5' },
  ]);
  const [confirmed, setConfirmed] = useState(false);
  const markChecked = (id) => setRows(rows.map((r) => (r.id === id ? { ...r, reasons: r.reasons.filter((x) => x !== 'Check due') } : r)).filter((r) => r.reasons.length));
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
      <ExistingFence owner="M-07 MicrobiologyWorklist (built): Cultures and AST views, tiles, filters, Due column, pagination" additions="Needs attention tile and filter, Culture type filter, reasons, Mark checked">
        <ContentSwitcher selectedIndex={grain} onChange={({ index }) => setGrain(index)} size="sm">
          <Switch name="cultures" text={t('microbiology.worklist.grain.cultures', 'Cultures')} />
          <Switch name="ast" text={t('microbiology.worklist.grain.ast', 'AST')} />
          <Switch name="bench" text={`${t('microbiology.worklist.bench', 'Bench')} (proposed)`} />
        </ContentSwitcher>
        <Grid condensed style={{ marginTop: 'var(--cds-spacing-05)' }}>
          {tiles.map(([l, n], i) => (
            <Column lg={3} key={l}><ClickableTile><small>{l}</small><h3>{n}</h3>{i === 0 && <Tag type="blue" size="sm">v2</Tag>}</ClickableTile></Column>
          ))}
        </Grid>
      </ExistingFence>
      {grain !== 2 && (<>
      <Grid condensed>
        <Column lg={4}>
          <Select id="ctype" labelText={t('microbiology.worklist.filter.cultureType', 'Culture type')} defaultValue="all">
            <SelectItem value="all" text={t('microbiology.worklist.filter.all', 'All')} />
            <SelectItem value="bac" text={t('microbiology.case.cultureType.bacteriology', 'Bacteriology')} />
            <SelectItem value="tb" text={t('microbiology.case.cultureType.mycobacteriology', 'Mycobacteriology (TB)')} />
            <SelectItem value="myc" text={t('microbiology.case.cultureType.mycology', 'Mycology')} />
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
      <SimpleTable
        headers={[
          { key: 'lab', header: t('label.labNumber', 'Lab number') },
          { key: 'who', header: t('microbiology.worklist.subject', 'Patient or site') },
          { key: 'type', header: t('microbiology.case.cultureType', 'Culture type') },
          { key: 'unit', header: t('microbiology.case.labUnit', 'Lab unit') },
          { key: 'spec', header: t('label.specimen', 'Specimen') },
          { key: 'reasons', header: t('microbiology.worklist.reason', 'Why it needs attention') },
          { key: 'day', header: t('microbiology.worklist.column.due', 'Due') },
          { key: 'act', header: '' },
        ]}
        rows={rows.map((r) => ({ ...r, reasons: r.reasons.join('|'), act: '' }))}
        render={(c, row) => {
          const r = rows.find((x) => x.id === row.id);
          if (c.info.header === 'reasons') return r.reasons.map((x) => <Tag key={x} type={x === 'Incubation complete' ? 'red' : x === 'Check due' ? 'warm-gray' : 'purple'} size="sm">{x}</Tag>);
          if (c.info.header === 'act') {
            if (r.reasons.includes('Check due')) return <Button kind="ghost" size="sm" onClick={() => markChecked(r.id)}>{t('microbiology.case.inoc.markChecked', 'Mark checked')}</Button>;
            if (r.reasons.includes('Instrument negative to confirm')) return confirmed
              ? <small>{t('microbiology.case.inoc.instrumentNegativeConfirmed', 'No growth, protocol complete: confirmed')}</small>
              : <Button kind="ghost" size="sm" onClick={() => setConfirmed(true)}>{t('microbiology.case.inoc.confirm', 'Confirm')} ({t('microbiology.case.inoc.instrumentNegative', 'No growth, protocol complete (instrument)')})</Button>;
            return null;
          }
          return c.value;
        }}
      />
      <p><small>{t('microbiology.worklist.markCheckedHelp', 'Mark checked records a "No change" reading with who and when, and sets the next check. Disabled offline.')}</small></p>
      </>)}
      {grain === 2 && <BenchBatches />}
    </Stack>
  );
}

/* ---------- Bench batches (FR-12.6, D-167 proposed) ---------- */
function BenchBatches() {
  const [mode, setMode] = useState(0);
  const [picked, setPicked] = useState({ a: true, b: true, c: true, d: false });
  const [reads, setReads] = useState({});
  const [saved, setSaved] = useState('');
  const cases = [{ id: 'a', lab: 'CPHL26-004820', spec: 'Urine, midstream' }, { id: 'b', lab: 'CPHL26-004821', spec: 'Urine, catheter' }, { id: 'c', lab: 'CPHL26-004823', spec: 'Urine, midstream' }, { id: 'd', lab: 'CPHL26-004826', spec: 'Urine, midstream' }];
  const due = [{ id: 'CPHL26-004790-CLED-1', lab: 'CPHL26-004790', medium: 'CLED agar plate' }, { id: 'CPHL26-004790-BA-1', lab: 'CPHL26-004790', medium: 'Blood agar (sheep) plate' }, { id: 'CPHL26-004801-CLED-1', lab: 'CPHL26-004801', medium: 'CLED agar plate' }];
  const n = Object.values(picked).filter(Boolean).length;
  return (
    <Tile>
      <InlineNotification kind="info" lowContrast hideCloseButton title={t('microbiology.worklist.bench.proposed', 'Proposed (D-167), for review')}
        subtitle={t('microbiology.worklist.bench.help', 'One plating template, one lot per medium and one set of labels for many cases; then one pass to read every due plate, changing only the exceptions.')} />
      <ContentSwitcher selectedIndex={mode} onChange={({ index }) => { setMode(index); setSaved(''); }} size="sm" style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Switch name="plate" text={t('microbiology.worklist.plateBatch', 'Plate a batch')} />
        <Switch name="read" text={t('microbiology.worklist.readPlates', 'Read plates')} />
      </ContentSwitcher>
      {mode === 0 ? (
        <Stack gap={4} style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <Grid condensed>
            <Column lg={4}><Select id="b-st" labelText={t('label.sampleType', 'Sample type')} defaultValue="urine"><SelectItem value="urine" text="Urine" /><SelectItem value="sputum" text="Sputum" /></Select></Column>
            <Column lg={6}><TextInput id="b-scan" labelText={t('microbiology.worklist.bench.scan', 'Scan labels')} placeholder={t('microbiology.worklist.bench.scanHelp', 'Scan a sample label to tick it')} /></Column>
            <Column lg={6}><Select id="b-tpl" labelText={t('microbiology.admin.platingTemplates', 'Plating templates')} defaultValue="pt1"><SelectItem value="pt1" text="Urine (CLED agar plate, blood agar plate)" /></Select></Column>
          </Grid>
          <SimpleTable
            headers={[{ key: 'pick', header: '' }, { key: 'lab', header: t('label.labNumber', 'Lab number') }, { key: 'spec', header: t('label.specimen', 'Specimen') }, { key: 'rows', header: t('microbiology.worklist.bench.rows', 'Rows to create') }]}
            rows={cases.map((c) => ({ ...c, pick: '', rows: `${c.lab}-CLED-1, ${c.lab}-BA-1` }))}
            render={(c, row) => (c.info.header === 'pick'
              ? <Checkbox id={`bp-${row.id}`} labelText="" hideLabel checked={picked[row.id]} onChange={(_, { checked }) => setPicked({ ...picked, [row.id]: checked })} />
              : c.value)}
          />
          <Grid condensed>
            <Column lg={8}><Select id="b-lot1" labelText="Lot for CLED agar plate *" defaultValue="c1"><SelectItem value="c1" text="Lot CLED-26-201, exp 11/2026" /></Select></Column>
            <Column lg={8}><Select id="b-lot2" labelText="Lot for Blood agar (sheep) plate *" defaultValue="b1"><SelectItem value="b1" text="Lot BA-26-117, exp 10/2026" /></Select></Column>
          </Grid>
          <Stack orientation="horizontal" gap={3}>
            <Button size="sm" onClick={() => setSaved(t('microbiology.worklist.batchSaved', '{count} cases saved in batch {batch}').replace('{count}', n).replace('{batch}', 'B-2610-07'))}>{`Save batch (${n} cases, ${n * 2} rows)`}</Button>
            <Button size="sm" kind="tertiary">{`${t('microbiology.case.printLabels', 'Print labels')} (${n * 2})`}</Button>
          </Stack>
        </Stack>
      ) : (
        <Stack gap={4} style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <p><small>{t('microbiology.worklist.bench.readHelp', 'Rows with Check due or Incubation complete, grouped by medium. Every row starts at No growth; change only the exceptions.')}</small></p>
          <SimpleTable
            headers={[{ key: 'id', header: t('microbiology.case.inoc.container', 'Container') }, { key: 'lab', header: t('label.case', 'Case') }, { key: 'medium', header: t('microbiology.case.inoc.medium', 'Medium') }, { key: 'read', header: t('microbiology.case.inoc.reading', 'Reading') }]}
            rows={due.map((d) => ({ ...d, read: '' }))}
            render={(c, row) => (c.info.header === 'read'
              ? (
                <Select id={`rd-${row.id}`} labelText="" hideLabel size="sm" value={reads[row.id] || 'No growth'} onChange={(e) => setReads({ ...reads, [row.id]: e.target.value })}>
                  {['No growth', 'Normal flora', 'Mixed growth', 'Significant growth', 'Contaminated'].map((v) => <SelectItem key={v} value={v} text={v} />)}
                </Select>
              )
              : c.value)}
          />
          <Button size="sm" onClick={() => setSaved(`${due.length} readings saved`)}>{`Save ${due.length} readings`}</Button>
        </Stack>
      )}
      {saved && <InlineNotification kind="success" lowContrast hideCloseButton title={saved} />}
    </Tile>
  );
}

/* ---------- Admin › Microbiology Reference Data › Plating templates (FR-05.2a) ---------- */
export function PlatingTemplatesAdmin() {
  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t('home.label', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('admin.label', 'Admin Management')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('microbiology.admin.platingTemplates', 'Plating templates')}</BreadcrumbItem>
      </Breadcrumb>
      <p><small>{t('microbiology.admin.platingTemplates.help', 'The laboratory\'s standard plating per sample type. Start inoculation and Plate a batch propose these rows; nothing on a case depends on them.')}</small></p>
      <div><Button size="sm" renderIcon={Add}>{t('microbiology.admin.platingTemplates.add', 'Add template')}</Button></div>
      <SimpleTable
        headers={[{ key: 'sampleType', header: t('label.sampleType', 'Sample type') }, { key: 'culture', header: t('microbiology.admin.platingTemplates.cultureTest', 'Culture test') }, { key: 'media', header: t('microbiology.admin.platingTemplates.media', 'Media (in order)') }, { key: 'status', header: t('label.status', 'Status') }]}
        rows={PLATING_TEMPLATES.map((p) => ({ ...p, media: p.rows.map((r) => MEDIA_SEED.find((m) => m.id === r.medium).text).join('; '), status: 'Active' }))}
        render={(c) => (c.info.header === 'status' ? <Tag type="green" size="sm">{c.value}</Tag> : c.value)}
      />
    </Stack>
  );
}

/* ---------- Enter Order: samples and tests (Clinical Order Entry v4 FR-B14, FR-B12a v0.13; D-146) ---------- */
// No Microbiology section and no Program coupling: generic culture tests are picked in the ordinary
// test picker. Only the "After save" tile is new, and it is drawn for review, not shown to reception.
const CATALOG = [
  { id: 'bac', text: 'Bacterial culture', note: 'Microbiology', generic: true },
  { id: 'tbc', text: 'TB culture', note: 'TB', generic: true },
  { id: 'smear', text: 'AFB smear (ZN)', note: 'TB, direct test', generic: true },
  { id: 'fun', text: 'Fungal culture', note: 'Microbiology', generic: true },
  { id: 'gram', text: 'Gram stain', note: 'Microbiology' },
];
const GENERIC = ['TB culture', 'Bacterial culture', 'Blood culture', 'Fungal culture', 'Xpert MTB/RIF Ultra', 'AFB smear (ZN)', 'Gram stain'];
export function OrderSamplesAndTests() {
  const [samples, setSamples] = useState([
    { id: '-1', type: 'Sputum', site: 'Lower respiratory tract', time: '28 Sep 07:10', tests: ['Xpert MTB/RIF Ultra'] },
    { id: '-2', type: 'Blood, aerobic bottle', site: 'Venous blood, left arm', time: '28 Sep 07:25', tests: ['Blood culture'] },
    { id: '-3', type: 'Blood, anaerobic bottle', site: 'Venous blood, left arm', time: '28 Sep 07:25', tests: ['Blood culture'] },
    { id: '-4', type: 'Blood, aerobic bottle', site: 'Venous blood, right arm', time: '28 Sep 07:31', tests: ['Blood culture'] },
    { id: '-5', type: 'Blood, anaerobic bottle', site: 'Venous blood, right arm', time: '28 Sep 07:31', tests: ['Blood culture'] },
    { id: '-6', type: 'Serum', site: '', time: '28 Sep 07:25', tests: ['RPR'] },
  ]);
  const [split, setSplit] = useState(false);
  const add = ({ selectedItem }) => {
    if (!selectedItem) return;
    const c = [...samples];
    if (!c[0].tests.includes(selectedItem.text)) c[0] = { ...c[0], tests: [...c[0].tests, selectedItem.text] };
    setSamples(c);
  };
  const s1 = samples[0].tests;
  const cases = [
    { id: 'tb', test: 'TB case (first micro test on -1)', samples: '-1 Sputum', unit: 'TB', note: s1.includes('TB culture') ? 'The culture joins the same case' : 'No culture ordered: releases on the Xpert result; a reflex TB culture on RR joins it' },
    s1.includes('Bacterial culture') && { id: 'bac', test: 'Bacterial culture', samples: '-1 Sputum', unit: 'Microbiology', note: 'Related case on the same specimen' },
    s1.includes('Fungal culture') && { id: 'fun', test: 'Fungal culture', samples: '-1 Sputum', unit: 'Microbiology', note: 'Mycology: its own related case' },
    { id: 'bc', test: 'Blood culture (collected in sets)', samples: split ? '-2, -3 (split: -4, -5 are a related case)' : '-2 to -5: 2 sets, 4 bottles', unit: 'Microbiology', note: 'One case for the order whatever the site; each bottle keeps its site and time; number of sets is counted' },
    { id: 'none', test: t('microbiology.order.noCase', 'No case'), samples: '-6 Serum (RPR)', unit: 'Microbiology (serology)', note: 'RPR has Microbiology case None in the catalog, so it stays on Results' },
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
            <Select id="prog" labelText={t('common.program', 'Program')} defaultValue="tb" helperText="Review note: not read by microbiology (D-146)">
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
              <TableHeader>{t('label.tests', 'Tests')}</TableHeader>
            </TableRow></TableHead>
            <TableBody>
              {samples.map((sm, si) => (
                <TableRow key={sm.id}>
                  <TableCell>{sm.id} · {sm.type}</TableCell>
                  <TableCell><small>{sm.site || 'No body site'} · {sm.time}</small></TableCell>
                  <TableCell>
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
        <h6>{t('microbiology.mockup.afterSave', 'After save (drawn for review; reception sees nothing extra)')}</h6>
        <SimpleTable
          headers={[{ key: 'test', header: 'Case opens for' }, { key: 'samples', header: 'Samples' }, { key: 'unit', header: 'Lab unit' }, { key: 'note', header: 'Note' }]}
          rows={cases}
          render={(c) => c.value}
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
        <Switch name="wl" text={t('microbiology.mockup.worklist', 'Worklist: Needs attention')} />
        <Switch name="oe" text={t('microbiology.mockup.orderEntry', 'Enter Order: samples and tests')} />
        <Switch name="adm" text={t('microbiology.admin.platingTemplates', 'Plating templates')} />
      </ContentSwitcher>
      {view === 0 && <MicrobiologyCaseView />}
      {view === 1 && <MicrobiologyWorklist />}
      {view === 2 && <OrderSamplesAndTests />}
      {view === 3 && <PlatingTemplatesAdmin />}
    </Stack>
  );
}
