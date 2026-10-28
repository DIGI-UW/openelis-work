// Analyzer Setup From a Real Result: handoff mockup (Carbon React)
// FRS: designs/analyzer-integration/analyzer-setup-from-traffic.md
// Routes (no new pages):
//   /analyzers                       inline setup: Instrument -> Connect -> Send a test result -> Verify
//   /analyzers/types                 Instrument not listed, Start from a similar instrument, catalog readiness
//   /analyzers/{id}/mappings         Map this code (evidence + scoped picker + also add to type)
//   /analyzers/errors                Undelivered results (Set up from this result, Retry with outcome)
//   /Alerts                          unknown-code entry
// SideNav: Analyzers -> Analyzers | Analyzer Types | Import Issues (D-069)
// All strings are i18n keys with English fallbacks (see the FRS Localization table).

import React, { useState, useMemo } from 'react';
import {
  Accordion, AccordionItem, Breadcrumb, BreadcrumbItem, Button, Checkbox, ComboBox,
  ContentSwitcher, Switch, InlineNotification, Modal, Select, SelectItem, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow, Tag, TextInput,
  Tile, Toggle, CopyButton, Grid, Column, Link,
} from '@carbon/react';

// In OpenELIS this is react-intl: intl.formatMessage({ id, defaultMessage }, values).
// The gallery has no IntlProvider, so the mockup renders the English fallback with {placeholders} filled.
const useT = () => (id, defaultMessage, values = {}) =>
  defaultMessage.replace(/\{(\w+)\}/g, (m, k) => (values[k] !== undefined ? String(values[k]) : m));

// ---------------- Mock data (QA-T2-0001 from analyzer 10 on testing) ----------------
const CAPTURE = [
  { code: 'GLU', value: '132', unit: 'mg/dL', range: '70-110', flag: 'H', readAs: 'number', status: 'verified', test: 'Glucose (Plasma)' },
  { code: 'CREA', value: '1.17', unit: 'mg/dL', range: '0.6-1.3', flag: '', readAs: 'number', status: 'verified', test: 'Creatinine' },
  { code: 'NA', value: '141', unit: 'mmol/L', range: '135-145', flag: '', readAs: 'number', status: 'notInType', test: null },
  { code: 'K', value: '4.2', unit: 'mmol/L', range: '3.5-5.0', flag: '', readAs: 'number', status: 'notInType', test: null },
  { code: 'UREA', value: '28', unit: 'mg/dL', range: '15-45', flag: '', readAs: 'number', status: 'notInType', test: null },
  { code: 'TRIG', value: '', unit: 'mg/dL', range: '', flag: '>', readAs: 'none', status: 'unreadable', test: 'Triglicerides' },
];
const NOT_SEEN = [['AMY', 'Amylase'], ['CHOL', 'Total cholesterol'], ['HDL', 'HDL cholesterol'], ['ALT', 'Transaminases ALTL'], ['AST', 'Transaminases ASTL']];
const CATALOG = [
  { id: '410', name: 'Sodium', code: 'Na-Serum', loinc: '2951-2', sampleType: 'Serum', labUnit: 'Biochemistry', uom: 'mmol/L', active: true },
  { id: '411', name: 'Potassium', code: 'K-Serum', loinc: '2823-3', sampleType: 'Serum', labUnit: 'Biochemistry', uom: 'mmol/L', active: true },
  { id: '412', name: 'Urea', code: 'Urea-Serum', loinc: '3091-6', sampleType: 'Serum', labUnit: 'Biochemistry', uom: 'mg/dL', active: true },
  { id: '3', name: 'Glucose (Plasma)', code: 'GLU-P', loinc: '2345-7', sampleType: 'Plasma', labUnit: 'Biochemistry', uom: 'mg/dL', active: true },
  { id: '159', name: 'Glycémie', code: 'GLY', loinc: '2345-7', sampleType: 'Serum', labUnit: 'Biochemistry', uom: '', active: true },
  { id: '201', name: 'Synaptophysin', code: 'IHC-SYN', loinc: '', sampleType: 'Tissue', labUnit: 'Pathology', uom: '', active: true },
];

// FR-E2: word-start match on name, code, LOINC; exact code first, then alphabetical. No scoring.
const wordStart = (s, q) => !!s && s.toLowerCase().split(/[\s\-()]+/).some((w) => w.startsWith(q));
function searchTests(catalog, q, { labUnits, all, sharedLoinc }) {
  if (sharedLoinc) return catalog.filter((t) => t.loinc === sharedLoinc); // FR-E4
  const ql = q.trim().toLowerCase();
  return catalog
    .filter((t) => (all ? true : t.active && labUnits.includes(t.labUnit)))
    .filter((t) => !ql || [t.name, t.code, t.loinc].some((s) => wordStart(s, ql)))
    .sort((a, b) => {
      const ex = (t) => t.code.toLowerCase() === ql || t.code.toLowerCase().startsWith(`${ql}-`);
      return ex(b) - ex(a) || a.name.localeCompare(b.name);
    });
}

// FR-F2 checks
const ASTM_DELIMS = /[|^&\\]/;
function loincCheckDigitOk(loinc) {
  const m = /^(\d{1,5})-(\d)$/.exec(loinc || '');
  if (!m) return false;
  // LOINC mod 10 check digit
  const digits = m[1].split('').reverse().map(Number);
  let sum = 0;
  digits.forEach((d, i) => {
    if (i % 2 === 0) { const x = d * 2; sum += x > 9 ? x - 9 : x; } else sum += d;
  });
  return (10 - (sum % 10)) % 10 === Number(m[2]);
}

// ---------------- Setup (FR-A, FR-B) ----------------
export function AnalyzerSetup() {
  const t = useT();
  const [received, setReceived] = useState(false);
  const [view, setView] = useState(0);
  const [alsoImport, setAlsoImport] = useState(false);
  const statusTag = {
    verified: <Tag type="green">{t('label.analyzer.verify.seenMapped', 'Verified against a real result')}</Tag>,
    notInType: <Tag type="purple">{t('label.analyzer.verify.notInType', 'Not in this type yet')}</Tag>,
    unreadable: <Tag type="red">{t('label.analyzer.preview.unreadable', 'Could not read a value')}</Tag>,
  };
  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash><BreadcrumbItem href="/">{t('label.home', 'Home')}</BreadcrumbItem><BreadcrumbItem isCurrentPage>{t('label.analyzers', 'Analyzers')}</BreadcrumbItem></Breadcrumb>

      <Tile>
        <h4>1. {t('label.analyzer.setup.identify', 'Instrument')}</h4>
        <p>QA BX-3010 02 · Sysmex BX-3010 (QA Sysmex BX-3010, revision 2) · Biochemistry</p>
        <Button kind="ghost" size="sm">{t('common.edit', 'Edit')}</Button>
      </Tile>

      <Tile>
        <h4>2. {t('label.analyzer.setup.connect', 'Connect')}</h4>
        {/* FR-A2: never disabled by unresolved matches. FR-A3: outside port from deployment settings. */}
        <h5>{t('label.analyzer.connect.typeIntoAnalyzer', 'Type these into the analyzer')}</h5>
        {[
          // FR-A3: address comes from the deployment setting (DEP-8); no sender name is asked for or shown.
          [t('label.analyzer.connect.serverAddress', 'OpenELIS server address'), '192.168.10.5 (lab network)'],
          ['', '10.8.0.2 (VPN)'],
          [t('label.analyzer.connect.port', 'Port for {protocol}', { protocol: 'ASTM (E1381)' }), '12011'],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ width: 200 }}>{label}</span><code>{value}</code>
            <CopyButton onClick={() => navigator.clipboard?.writeText(value)} />
          </div>
        ))}
        <InlineNotification kind="warning" lowContrast hideCloseButton
          title={t('label.analyzer.connect.portClosed', "Port {port} isn't open on this server. Ask your server administrator to open it.", { port: 12011 })} />
        <p>{t('label.analyzer.connect.vendorPc', 'If the analyzer sends results through its own software on a PC, enter these in that software')}</p>
        <p>{t('label.analyzer.connect.dataflow', 'Data flow')}: <strong>{t('label.analyzer.connect.resultsOnly', 'Results only')}</strong></p>
      </Tile>

      <Tile>
        <h4>3. {t('label.analyzer.setup.sendTest', 'Send a test result')}</h4>
        {!received ? (
          <>
            <p>{t('label.analyzer.setup.waiting', "Run a control or one patient sample on the analyzer and send it. We'll show what arrives here.")}</p>
                        {/* FR-A5, FR-A8: unclaimed messages; the admin picks theirs. Identity = sender as received (+ source address if not unique). */}
            <TableContainer title={t('label.analyzer.setup.unclaimed', "Messages from analyzers OpenELIS doesn't know yet")}>
              <Table size="sm">
                <TableHead><TableRow><TableHeader>Received</TableHeader><TableHeader>From address</TableHeader><TableHeader>Listener</TableHeader><TableHeader>Sender (as sent)</TableHeader><TableHeader>Specimen</TableHeader><TableHeader>First result</TableHeader><TableHeader /></TableRow></TableHead>
                <TableBody>
                  <TableRow><TableCell>10:42:07</TableCell><TableCell>192.168.10.41</TableCell><TableCell>ASTM E1381 · 12011</TableCell><TableCell>BX-3010^1.0</TableCell><TableCell>QA-T2-0001</TableCell><TableCell>GLU 132 mg/dL</TableCell>
                    <TableCell><Button kind="tertiary" size="sm" onClick={() => setReceived(true)}>{t('label.analyzer.setup.thisIsMine', 'This is my analyzer')}</Button></TableCell></TableRow>
                  <TableRow><TableCell>09:58:30</TableCell><TableCell>192.168.10.77</TableCell><TableCell>ASTM LIS01-A · 12000</TableCell><TableCell>GeneXpert PC^GeneXpert^6.4</TableCell><TableCell>TB-26-00412</TableCell><TableCell>MTB DETECTED LOW</TableCell>
                    <TableCell><Button kind="ghost" size="sm">{t('label.analyzer.setup.thisIsMine', 'This is my analyzer')}</Button></TableCell></TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Button kind="ghost" size="sm">{t('label.analyzer.setup.skip', 'Skip for now')}</Button>
          </>
        ) : (
          <>
          <p>{t('label.analyzer.identity.sender', 'Recognised by: sender "{sender}"', { sender: 'BX-3010^1.0' })}</p>
          <TableContainer>
            <Table size="sm">
              <TableHead><TableRow><TableHeader>Received</TableHeader><TableHeader>Accession</TableHeader><TableHeader>Results</TableHeader><TableHeader>Patient sent</TableHeader><TableHeader /></TableRow></TableHead>
              <TableBody><TableRow><TableCell>10:42:07</TableCell><TableCell>QA-T2-0001</TableCell><TableCell>6</TableCell><TableCell>PID-88213 · Wibowo, Adi · 1978-04-12 · M</TableCell><TableCell><Button kind="ghost" size="sm">Discard</Button></TableCell></TableRow></TableBody>
            </Table>
          </TableContainer>
          </>
        )}
      </Tile>

      {received && (
        <Tile>
          <h4>4. {t('label.analyzer.setup.verify', 'Verify')}</h4>
          <ContentSwitcher selectedIndex={view} onChange={({ index }) => setView(index)} size="sm">
            <Switch name="type" text={t('label.analyzer.verify.againstType', 'Against this type')} />
            <Switch name="read" text={t('label.analyzer.preview.title', 'How we read it')} />
          </ContentSwitcher>
          {view === 0 ? (
            <TableContainer>
              <Table>
                <TableHead><TableRow><TableHeader>Analyzer code</TableHeader><TableHeader>Received</TableHeader><TableHeader>Catalog test</TableHeader><TableHeader>Status</TableHeader><TableHeader /></TableRow></TableHead>
                <TableBody>
                  {CAPTURE.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell>{r.code}</TableCell>
                      <TableCell>{r.value ? `${r.value} ${r.unit}` : '-'}{r.flag && ` · flag ${r.flag}`}</TableCell>
                      <TableCell>{r.test || '-'}</TableCell>
                      <TableCell>{statusTag[r.status]}</TableCell>
                      <TableCell>{r.status === 'notInType' && <Button kind="ghost" size="sm">{t('label.analyzer.fix.mapCode', 'Map this code')}</Button>}</TableCell>
                    </TableRow>
                  ))}
                  {NOT_SEEN.map(([c, name]) => (
                    <TableRow key={c}><TableCell>{c}</TableCell><TableCell>-</TableCell><TableCell>{name}</TableCell>
                      <TableCell><Tag type="gray">{t('label.analyzer.verify.notSeen', 'Not seen yet')}</Tag></TableCell><TableCell /></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <>
              {/* FR-B2: per record, which field gave what, and number vs text. DEP-2 supplies this. */}
              <TableContainer>
                <Table size="sm">
                  <TableHead><TableRow><TableHeader>Code (field)</TableHeader><TableHeader>Value (field)</TableHeader><TableHeader>Read as</TableHeader><TableHeader>Unit</TableHeader><TableHeader>Flag</TableHeader><TableHeader>Specimen ID (field)</TableHeader></TableRow></TableHead>
                  <TableBody>
                    {CAPTURE.map((r) => (
                      <TableRow key={r.code}>
                        <TableCell>{r.code} (R.3)</TableCell><TableCell>{r.value || '-'} (R.4)</TableCell>
                        <TableCell>{r.readAs === 'number' ? <Tag type="green">{t('label.analyzer.preview.asNumber', 'read as a number')}</Tag> : <Tag type="red">{t('label.analyzer.preview.unreadable', 'Could not read a value')}</Tag>}</TableCell>
                        <TableCell>{r.unit}</TableCell><TableCell>{r.flag || '-'}</TableCell><TableCell>QA-T2-0001 (O.3)</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Accordion><AccordionItem title={t('label.analyzer.preview.raw', 'Show raw message')}><pre>{'R|6|^^^TRIG||mg/dL||>||F'}</pre></AccordionItem></Accordion>
            </>
          )}
          <Button kind="primary">{t('label.analyzer.verify.confirm', 'Confirm verified rows')}</Button>
          <Button kind="secondary">{t('label.analyzer.setup.activate', 'Activate analyzer')}</Button>
          <Checkbox id="alsoImport" labelText={t('label.analyzer.setup.alsoImport', 'Also import these results')} checked={alsoImport} onChange={(_, { checked }) => setAlsoImport(checked)} />
        </Tile>
      )}
    </Stack>
  );
}

// ---------------- Instrument not listed (FR-C, FR-F) ----------------
export function NewAnalyzerType() {
  const t = useT();
  const [name, setName] = useState('Sysmex BX-3010 (Biochemistry)');
  const [rows, setRows] = useState([{ code: 'NA', loinc: '2951-2' }, { code: 'GLU', loinc: '2345-7' }]);
  const [prefix, setPrefix] = useState('QC-');
  const errors = useMemo(() => rows.map((r, i) => {
    if (!r.code) return t('common.required', 'Required');
    if (ASTM_DELIMS.test(r.code)) return t('label.analyzer.validate.delimiter', "Codes can't contain {chars}; the analyzer uses them to separate fields", { chars: '| ^ & \\' });
    if (rows.findIndex((x) => x.code === r.code) !== i) return t('label.analyzer.validate.duplicateCode', 'Another test in this type already uses code {code}', { code: r.code });
    return null;
  }), [rows]);
  const loincErr = (l) => (l && !loincCheckDigitOk(l) ? t('label.analyzer.validate.loinc', 'Enter a LOINC like 2345-7; the last digit is a check digit') : null);
  const blocking = errors.some(Boolean) || rows.some((r) => loincErr(r.loinc)) || !prefix || !name;
  const update = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash><BreadcrumbItem href="/">Home</BreadcrumbItem><BreadcrumbItem href="/analyzers">Analyzers</BreadcrumbItem><BreadcrumbItem isCurrentPage>{t('label.analyzer.type.notListed', "My instrument isn't listed")}</BreadcrumbItem></Breadcrumb>
      <Grid>
        <Column lg={8} md={4} sm={4}>
          <TextInput id="name" labelText={`${t('label.analyzer.type.name', 'Name')} *`} value={name} maxCount={120} enableCounter onChange={(e) => setName(e.target.value)} invalid={!name} invalidText={t('common.required', 'Required')} />
          <TextInput id="model" labelText={`${t('label.analyzer.type.model', 'Manufacturer and model')} *`} defaultValue="Sysmex BX-3010" />
          <ContentSwitcher selectedIndex={0} size="sm"><Switch text="ASTM" /><Switch text="HL7" /><Switch text={t('label.analyzer.protocol.file', 'Flat file')} /></ContentSwitcher>
        </Column>
      </Grid>
      <Accordion>
        <AccordionItem title={t('label.analyzer.type.advanced', 'Advanced, for IT')}>
          <Select id="framing" labelText={t('label.analyzer.type.framing', 'How the analyzer frames messages')} defaultValue="E1381">
            <SelectItem value="LIS01A" text={t('label.analyzer.type.framing.lis01a', 'LIS01-A, used by most analyzers (port {port} on this server)', { port: 12000 })} />
            <SelectItem value="E1381" text={t('label.analyzer.type.framing.e1381', "E1381, only if the analyzer's manual says so (port {port})", { port: 12011 })} />
          </Select>
        </AccordionItem>
      </Accordion>
      <TableContainer title={t('label.analyzer.type.tests', 'Tests')}>
        <Table>
          <TableHead><TableRow><TableHeader>Analyzer code *</TableHeader><TableHeader>LOINC (optional)</TableHeader></TableRow></TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell><TextInput id={`code-${i}`} labelText="" hideLabel value={r.code} onChange={(e) => update(i, 'code', e.target.value)} invalid={!!errors[i]} invalidText={errors[i]} /></TableCell>
                <TableCell><TextInput id={`loinc-${i}`} labelText="" hideLabel value={r.loinc} onChange={(e) => update(i, 'loinc', e.target.value)} invalid={!!loincErr(r.loinc)} invalidText={loincErr(r.loinc)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Select id="ctlCond" labelText={t('label.analyzer.qc.condition', 'Control recognition')}>
        <SelectItem value="prefix" text={t('label.analyzer.qc.prefix', 'Specimen ID starts with')} />
        <SelectItem value="o12eq" text={t('label.analyzer.qc.o12equals', 'Order field 12 equals')} />
        <SelectItem value="o12has" text={t('label.analyzer.qc.o12contains', 'Order field 12 contains')} />
      </Select>
      <TextInput id="ctlVal" labelText="Value *" value={prefix} onChange={(e) => setPrefix(e.target.value)} invalid={!prefix} invalidText={t('label.analyzer.validate.prefixEmpty', 'Enter the prefix')} />
      <Button kind="secondary">{t('common.saveDraft', 'Save draft')}</Button>
      <Button kind="primary" disabled={blocking}>{t('label.analyzer.type.publish', 'Publish')}</Button>
    </Stack>
  );
}

// ---------------- Start from a similar instrument (FR-D) ----------------
export function StartFromSimilar() {
  const t = useT();
  const PARTS = [
    ['conn', 'Connection fields and help', 'Server, port, sender', 'keep'],
    ['layout', 'Record layout', 'Reads the call from R.4.1 and the number from R.4.2, as GeneXpert does', 'clear'],
    ['qc', 'Control rules', 'Order field 12 equals Q; specimen ID starts with QC-', 'keep'],
    ['tests', 'Tests and result values', '4 tests, 11 result values', 'clear'],
  ];
  const [sel, setSel] = useState(Object.fromEntries(PARTS.map(([k, , , d]) => [k, d])));
  return (
    <Stack gap={5}>
      <ComboBox id="source" titleText={t('label.analyzer.type.startSimilar', 'Start from a similar instrument')} items={['Cepheid GeneXpert (ASTM), revision 3']} selectedItem="Cepheid GeneXpert (ASTM), revision 3" />
      <TableContainer>
        <Table>
          <TableHead><TableRow><TableHeader>What is copied</TableHeader><TableHeader>Details</TableHeader><TableHeader /></TableRow></TableHead>
          <TableBody>
            {PARTS.map(([k, label, desc]) => (
              <TableRow key={k}><TableCell>{label}</TableCell><TableCell>{desc}</TableCell>
                <TableCell>
                  <ContentSwitcher size="sm" selectedIndex={sel[k] === 'keep' ? 0 : 1} onChange={({ index }) => setSel({ ...sel, [k]: index === 0 ? 'keep' : 'clear' })}>
                    <Switch text={t('label.analyzer.type.inherit.keep', 'Keep')} /><Switch text={t('label.analyzer.type.inherit.clear', 'Clear')} />
                  </ContentSwitcher>
                </TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {sel.layout === 'keep' && <InlineNotification kind="warning" lowContrast hideCloseButton title="Numbers sent in R.4 will be read as text. Send a test result and check How we read it." />}
      <Button>{t('label.analyzer.type.create', 'Create type')}</Button>
    </Stack>
  );
}

// ---------------- Map this code (FR-E, FR-G3, FR-G4) ----------------
export function MapThisCode({ analyzer = { id: 10, name: 'QA BX-3010 02', labUnits: ['Biochemistry'], type: 'QA Sysmex BX-3010', typeUsedBy: 2 } }) {
  const t = useT();
  const [all, setAll] = useState(false);
  const [query, setQuery] = useState('NA');
  const [picked, setPicked] = useState(null);
  const [alsoType, setAlsoType] = useState(true);
  const evidence = { code: 'NA', value: '141', unit: 'mmol/L', range: '135-145', sampleType: 'SERUM', seen: 3 };
  const items = searchTests(CATALOG, query, { labUnits: analyzer.labUnits, all });
  const facts = (x) => `LOINC ${x.loinc || '-'} · ${x.sampleType} · ${x.labUnit} · ${x.uom || 'no unit'}`;
  const unitWarn = picked && picked.uom !== evidence.unit
    ? t('label.analyzer.picker.unitMismatch', 'Analyzer sends {unit}; this test uses {testUnit}', { unit: evidence.unit, testUnit: picked.uom || 'no unit' }) : null;
  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash><BreadcrumbItem href="/">Home</BreadcrumbItem><BreadcrumbItem href="/analyzers">Analyzers</BreadcrumbItem><BreadcrumbItem isCurrentPage>Field Mappings / {analyzer.name}</BreadcrumbItem></Breadcrumb>
      <InlineNotification kind="info" lowContrast hideCloseButton
        title={t('label.analyzer.picker.received', 'Received: {value} {unit}, range {range}, sample {sampleType}', evidence)}
        subtitle={`${evidence.code} · seen ${evidence.seen} times`} />
      <Toggle id="all" size="sm" labelText={t('label.analyzer.picker.searchAll', 'Search all tests')} toggled={all} onToggle={setAll} />
      <ComboBox id="test" titleText={t('label.analyzer.mapping.catalogTest', 'Catalog test')} items={items}
        itemToString={(x) => (x ? `${x.name} (${x.code})` : '')}
        itemToElement={(x) => <div><strong>{x.name}</strong> {x.code}{!x.active && <Tag size="sm" type="gray">Inactive</Tag>}<div>{facts(x)}</div></div>}
        onInputChange={setQuery} onChange={({ selectedItem }) => setPicked(selectedItem)} warn={!!unitWarn} warnText={unitWarn} />
      <Checkbox id="alsoType" checked={alsoType} onChange={(_, { checked }) => setAlsoType(checked)}
        labelText={t('label.analyzer.fix.alsoAddToType', 'Also add to the analyzer type {name}', { name: analyzer.type })}
        helperText={alsoType ? t('label.analyzer.scope.updateProfile', 'Update this profile (affects {count} analyzers)', { count: analyzer.typeUsedBy }) : undefined} />
      <Button disabled={!picked}>{t('label.analyzer.fix.saveRetry', 'Save and retry {count} held results', { count: 3 })}</Button>
    </Stack>
  );
}

// ---------------- Fix where it shows (FR-G, FR-I) ----------------
export function UndeliveredResults() {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const [outcome, setOutcome] = useState(null);
  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash><BreadcrumbItem href="/">Home</BreadcrumbItem><BreadcrumbItem href="/analyzers">Analyzers</BreadcrumbItem><BreadcrumbItem isCurrentPage>{t('label.analyzer.importIssues', 'Import Issues')}</BreadcrumbItem></Breadcrumb>
      {outcome && <InlineNotification kind="success" lowContrast title={outcome} onClose={() => setOutcome(null)} />}
      <TableContainer title={t('label.analyzer.undelivered.title', 'Undelivered results')}>
        <Table>
          <TableHead><TableRow><TableHeader>Received</TableHeader><TableHeader>Sender</TableHeader><TableHeader>Accession</TableHeader><TableHeader>Why it wasn't delivered</TableHeader><TableHeader /></TableRow></TableHead>
          <TableBody>
            <TableRow><TableCell>10:51</TableCell><TableCell>BX-T3^1.0</TableCell><TableCell>QA-T3-0004</TableCell><TableCell>No analyzer is set up for this sender.</TableCell>
              <TableCell><Button kind="tertiary" size="sm">{t('label.analyzer.fix.setupFromResult', 'Set up an analyzer from this result')}</Button></TableCell></TableRow>
            <TableRow><TableCell>09:15</TableCell><TableCell>BX-3010^1.0</TableCell><TableCell>DEV01260000000001634</TableCell><TableCell>QA BX-3010 01 was inactive when this arrived. It is active now.</TableCell>
              <TableCell><Button kind="tertiary" size="sm" onClick={() => setOutcome('Delivered to QA BX-3010 01. 2 staged, 1 held for code NA.')}>{t('label.analyzer.retry', 'Retry')}</Button></TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Button kind="danger--ghost" onClick={() => setConfirm(true)}>{t('label.analyzer.review.remove', 'Remove from review')}</Button>
      <Modal open={confirm} danger modalHeading={t('label.analyzer.review.confirmRemove', "Remove {count} results from review? They won't be imported.", { count: 2 })}
        primaryButtonText={t('common.remove', 'Remove')} secondaryButtonText={t('common.cancel', 'Cancel')}
        onRequestClose={() => setConfirm(false)} onRequestSubmit={() => setConfirm(false)} />
    </Stack>
  );
}

// ---------------- Catalog readiness (FR-H) ----------------
export function CatalogReadiness() {
  const t = useT();
  return (
    <Stack gap={5}>
      <Tile>
        <h4>{t('label.analyzer.readiness.loincCoverage', '{count} of {total} active tests in {labUnits} have a LOINC', { count: 48, total: 52, labUnits: 'Biochemistry' })}</h4>
        <Link href="/MasterListsPage/testCatalog">Electrophoresis</Link>
      </Tile>
      <TableContainer title="Tests that share a LOINC">
        <Table size="sm">
          <TableHead><TableRow><TableHeader>LOINC</TableHeader><TableHeader>Tests</TableHeader></TableRow></TableHead>
          <TableBody>
            <TableRow><TableCell>2345-7</TableCell><TableCell>{t('label.analyzer.readiness.sharedLoinc', '{tests} share LOINC {code}; choose which one analyzers use', { tests: 'Glucose (Plasma) and Glycémie (Serum)', code: '2345-7' })}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default function AnalyzerSetupFromTrafficMockup() {
  return (<Stack gap={9}><AnalyzerSetup /><NewAnalyzerType /><StartFromSimilar /><MapThisCode /><UndeliveredResults /><CatalogReadiness /></Stack>);
}
