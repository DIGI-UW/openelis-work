import React, { useState } from 'react';
import {
  Grid, Column, Stack, Tabs, Tab, TabList, TabPanels, TabPanel,
  TextInput, TextArea, Select, SelectItem, NumberInput, Toggle,
  ComboBox, DatePicker, DatePickerInput, Button, Tag, InlineNotification,
  Accordion, AccordionItem, Tile, Breadcrumb, BreadcrumbItem,
  ProgressIndicator, ProgressStep,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
} from '@carbon/react';
import {
  Add, ArrowRight, Checkmark, Warning, InformationFilled,
  Location, Bee, TreeView, Time, Printer, Edit, TrashCan,
} from '@carbon/icons-react';

// ─── i18n stub ───────────────────────────────────────────────────────────────
const t = (key, fallback) => fallback || key;

// ─── Mock data ────────────────────────────────────────────────────────────────
const TRAP_TYPES = [
  { id: 'tt1', label: 'BG-Sentinel' },
  { id: 'tt2', label: 'BG-Pro' },
  { id: 'tt3', label: 'CDC Light Trap' },
  { id: 'tt4', label: 'Ovitrap' },
  { id: 'tt5', label: 'Gravid Trap' },
  { id: 'tt6', label: 'Human Landing Catch (HLC)' },
  { id: 'tt7', label: 'Tick Drag' },
  { id: 'tt8', label: 'Sherman Trap' },
];

const SAMPLING_SITES = [
  { id: 'ss1', name: 'Ciliwung River — Upstream S1', district: 'Jakarta Selatan', type: 'Vector Trap', lat: -6.2341, lng: 106.8312 },
  { id: 'ss2', name: 'Manggarai Station — East Drainage', district: 'Jakarta Selatan', type: 'Vector Trap', lat: -6.2105, lng: 106.8502 },
  { id: 'ss3', name: 'Ragunan Park — Zone B Perimeter', district: 'Jakarta Selatan', type: 'Vector Trap', lat: -6.3128, lng: 106.8212 },
];

const VECTOR_SAMPLE_TYPES = [
  { id: 'vst1', label: 'Mosquito Pool (Fixed — 25)', poolStrategy: 'POOL_FIXED', minPool: 25 },
  { id: 'vst2', label: 'Mosquito Pool (Variable)', poolStrategy: 'POOL_VARIABLE', minPool: 10 },
  { id: 'vst3', label: 'Tick — Individual', poolStrategy: 'INDIVIDUAL', minPool: 1 },
  { id: 'vst4', label: 'Rodent Tissue — Individual', poolStrategy: 'INDIVIDUAL', minPool: 1 },
];

const LOT_STATUS_TAG = {
  DRAFT:      { kind: 'gray',    label: 'Draft' },
  RECEIVED:   { kind: 'blue',    label: 'Received' },
  PROCESSING: { kind: 'purple',  label: 'Processing' },
  TESTED:     { kind: 'teal',    label: 'Tested' },
  ELIGIBLE:   { kind: 'green',   label: 'Eligible' },
  REJECTED:   { kind: 'red',     label: 'Rejected' },
};

const MOCK_LOTS = [
  { id: 'vl1', labNo: '0012/BPP-01/VCT/04/2026', site: 'Ciliwung River — Upstream S1', trap: 'BG-Sentinel', collectionDate: '2026-04-15', status: 'RECEIVED', pool: true, count: 25, sampleType: 'Mosquito Pool (Fixed — 25)' },
  { id: 'vl2', labNo: '0011/BPP-01/VCT/04/2026', site: 'Manggarai Station — East Drainage', trap: 'CDC Light Trap', collectionDate: '2026-04-14', status: 'PROCESSING', pool: true, count: 18, sampleType: 'Mosquito Pool (Variable)' },
  { id: 'vl3', labNo: '0010/BPP-01/VCT/04/2026', site: 'Ragunan Park — Zone B Perimeter', trap: 'Tick Drag', collectionDate: '2026-04-13', status: 'ELIGIBLE', pool: false, count: 1, sampleType: 'Tick — Individual' },
  { id: 'vl4', labNo: '0009/BPP-01/VCT/04/2026', site: 'Ciliwung River — Upstream S1', trap: 'BG-Sentinel', collectionDate: '2026-04-12', status: 'DRAFT', pool: true, count: 22, sampleType: 'Mosquito Pool (Fixed — 25)' },
];

// ─── Shared: Step progress indicator ─────────────────────────────────────────
function StepBar({ current }) {
  const steps = [
    { label: t('label.step.enterOrder', 'Enter Order') },
    { label: t('label.step.collectSample', 'Collect Sample') },
    { label: t('label.step.labelStore', 'Label & Store') },
    { label: t('label.step.qaReview', 'QA Review') },
  ];
  return (
    <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-04) var(--cds-spacing-06)' }}>
      <ProgressIndicator currentIndex={current} spaceEqually>
        {steps.map((s, i) => (
          <ProgressStep key={i} label={s.label}
            complete={i < current}
            current={i === current}
          />
        ))}
      </ProgressIndicator>
    </Tile>
  );
}

// ─── Shared: Order context card (shown on Steps 2–4) ─────────────────────────
function OrderContextCard({ lot }) {
  return (
    <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-04) var(--cds-spacing-06)', display: 'flex', gap: 'var(--cds-spacing-08)', alignItems: 'center', borderLeft: '4px solid var(--cds-interactive-01)' }}>
      {[
        ['Lab Number', lot.labNo],
        ['Site', lot.site],
        ['Trap Type', lot.trap],
        ['Collection Date', lot.collectionDate],
        ['Domain', null],
      ].map(([label, val]) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.32px' }}>{label}</span>
          {val
            ? <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{val}</span>
            : <Tag kind="teal" size="sm">{t('label.domain.vector', 'Vector')}</Tag>}
        </div>
      ))}
    </Tile>
  );
}

// ─── Screen 0: Collection Lot Worklist ───────────────────────────────────────
const LOT_HEADERS = [
  { key: 'labNo', header: t('label.lot.labNumber', 'Lab Number') },
  { key: 'site', header: t('label.lot.site', 'Sampling Site') },
  { key: 'trap', header: t('label.lot.trapType', 'Trap Type') },
  { key: 'collectionDate', header: t('label.lot.collectionDate', 'Collection Date') },
  { key: 'sampleType', header: t('label.lot.sampleType', 'Sample Type') },
  { key: 'status', header: t('label.lot.status', 'Status') },
  { key: 'action', header: '' },
];

function Screen0Worklist({ onNewLot, onContinue }) {
  return (
    <div>
      <Breadcrumb style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        <BreadcrumbItem href="#"><span>{t('nav.sampleCollection', 'Sample Collection')}</span></BreadcrumbItem>
        <BreadcrumbItem isCurrentPage><span>{t('nav.collectionLots', 'Collection Lots — Vector')}</span></BreadcrumbItem>
      </Breadcrumb>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--cds-spacing-05)' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          {t('heading.collectionLots', 'Collection Lots')}
          <Tag kind="teal" size="sm" style={{ marginLeft: 'var(--cds-spacing-03)' }}>
            {t('label.domain.vector', 'Vector')}
          </Tag>
        </h2>
        <Button renderIcon={Add} onClick={onNewLot}>
          {t('button.newCollectionLot', 'New Collection Lot')}
        </Button>
      </div>

      <DataTable rows={MOCK_LOTS.map(lot => ({ ...lot, id: lot.id }))} headers={LOT_HEADERS}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <TableContainer>
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch placeholder={t('placeholder.searchLots', 'Search by lab number or site…')} />
                <Select id="filter-status" labelText="" hideLabel defaultValue="all" style={{ width: 160 }}>
                  <SelectItem value="all" text={t('label.filter.allStatuses', 'All statuses')} />
                  <SelectItem value="DRAFT" text={t('label.collectionLot.status.draft', 'Draft')} />
                  <SelectItem value="RECEIVED" text={t('label.collectionLot.status.received', 'Received')} />
                  <SelectItem value="PROCESSING" text={t('label.collectionLot.status.processing', 'Processing')} />
                </Select>
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => {
                  const lot = MOCK_LOTS.find(l => l.id === row.id);
                  const st = LOT_STATUS_TAG[lot.status] || { kind: 'gray', label: lot.status };
                  return (
                    <TableRow {...getRowProps({ row })} key={row.id}>
                      <TableCell style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{lot.labNo}</TableCell>
                      <TableCell>{lot.site}</TableCell>
                      <TableCell>{lot.trap}</TableCell>
                      <TableCell>{lot.collectionDate}</TableCell>
                      <TableCell>{lot.sampleType}</TableCell>
                      <TableCell><Tag kind={st.kind} size="sm">{st.label}</Tag></TableCell>
                      <TableCell>
                        <Button kind="ghost" size="sm" renderIcon={ArrowRight}
                          onClick={() => onContinue(lot)}>
                          {lot.status === 'DRAFT' ? t('button.continue', 'Continue') : t('button.view', 'View')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
}

// ─── Screen 1: Step 1 — Enter Order (Vector domain active) ───────────────────
function Screen1EnterOrder({ onNext }) {
  const [domain, setDomain]           = useState('vector');
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteSearch, setSiteSearch]   = useState('');
  const [showSiteResults, setShowSiteResults] = useState(false);
  const [trapType, setTrapType]       = useState(null);
  const [isPool, setIsPool]           = useState(true);
  const [count, setCount]             = useState(25);
  const [lat, setLat]                 = useState('');
  const [lng, setLng]                 = useState('');
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [sampleTypeId, setSampleTypeId] = useState('vst1');

  const handleSiteSelect = (site) => {
    setSelectedSite(site);
    setLat(String(site.lat));
    setLng(String(site.lng));
    setShowSiteResults(false);
    setSiteSearch(site.name);
  };

  const filteredSites = SAMPLING_SITES.filter(s =>
    s.name.toLowerCase().includes(siteSearch.toLowerCase()) ||
    s.district.toLowerCase().includes(siteSearch.toLowerCase())
  );

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        <BreadcrumbItem href="#"><span>{t('nav.sampleCollection', 'Sample Collection')}</span></BreadcrumbItem>
        <BreadcrumbItem isCurrentPage><span>{t('nav.newEntry', 'New Entry')}</span></BreadcrumbItem>
      </Breadcrumb>

      <StepBar current={0} />

      {/* Lab Number (assigned at top) */}
      <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
        <Grid condensed>
          <Column lg={6}>
            <TextInput
              id="lab-number"
              labelText={t('label.labNumber', 'Lab Number')}
              value="0013/BPP-01/VCT/04/2026"
              readOnly
              helperText={t('helperText.labNumber', 'Auto-generated with module code VCT. Assigned here to enable tracking across all steps.')}
            />
          </Column>
          <Column lg={3} style={{ paddingTop: 'var(--cds-spacing-06)' }}>
            <Button kind="ghost" renderIcon={Printer} size="sm">
              {t('button.printLabels', 'Print Labels')}
            </Button>
          </Column>
        </Grid>
      </Tile>

      {/* Domain Toggle */}
      <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-03)' }}>
          {t('label.sampleCategory', 'Sample Category')}
        </p>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { key: 'clinical', label: t('label.domain.clinical', 'Clinical') },
            { key: 'environmental', label: t('label.domain.environmental', 'Environmental / Other') },
            { key: 'vector', label: t('label.workflow.vector', 'Vector') },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setDomain(key)} style={{
              padding: '8px 20px', border: '1px solid var(--cds-border-strong-01)',
              background: domain === key ? 'var(--cds-interactive-01)' : 'var(--cds-layer-01)',
              color: domain === key ? '#fff' : 'var(--cds-text-primary)',
              fontFamily: 'inherit', fontSize: '0.875rem', cursor: 'pointer',
              borderRadius: key === 'clinical' ? '4px 0 0 4px' : key === 'vector' ? '0 4px 4px 0' : '0',
              fontWeight: domain === key ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>
        <p style={{ fontSize: '0.6875rem', color: 'var(--cds-text-secondary)', marginTop: 'var(--cds-spacing-02)' }}>
          {t('helperText.domainToggle', 'This toggle is shown when the lab unit is configured for multiple workflow types. It is hidden when only one domain is configured.')}
        </p>
      </Tile>

      {domain === 'vector' && (<>
        {/* Sampling Site */}
        <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-04)' }}>
            {t('heading.samplingSite', 'Sampling Site')}
          </h3>

          <div style={{ position: 'relative', maxWidth: 480, marginBottom: 'var(--cds-spacing-04)' }}>
            <TextInput
              id="site-search"
              labelText={t('label.samplingSite.search', 'Search sampling sites')}
              placeholder={t('placeholder.samplingSite', 'Search by site name or district…')}
              value={siteSearch}
              onChange={e => { setSiteSearch(e.target.value); setShowSiteResults(true); setSelectedSite(null); }}
            />
            {showSiteResults && siteSearch && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--cds-border-subtle-01)', zIndex: 10, boxShadow: '0 4px 8px rgba(0,0,0,.1)' }}>
                {filteredSites.length === 0
                  ? <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>{t('message.noSitesFound', 'No sites found.')}</div>
                  : filteredSites.map(s => (
                    <div key={s.id} onClick={() => handleSiteSelect(s)} style={{ padding: '0.625rem 1rem', cursor: 'pointer', fontSize: '0.875rem', borderBottom: '1px solid var(--cds-layer-02)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--cds-layer-hover-01)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <strong>{s.name}</strong>
                      <span style={{ color: 'var(--cds-text-secondary)', marginLeft: 8, fontSize: '0.8125rem' }}>{s.district} · {s.type}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {selectedSite && (
            <div style={{ padding: 'var(--cds-spacing-04)', background: 'var(--cds-layer-accent-01)', border: '1px solid var(--cds-border-subtle-01)', borderRadius: 4, marginBottom: 'var(--cds-spacing-04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--cds-spacing-02)' }}>
                <strong style={{ fontSize: '0.875rem' }}>{selectedSite.name}</strong>
                <Tag kind="green" size="sm">{t('label.selected', 'Selected')}</Tag>
              </div>
              <Grid condensed>
                <Column lg={4}><span style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>{t('label.site.district', 'District:')} </span><span style={{ fontSize: '0.8125rem' }}>{selectedSite.district}</span></Column>
                <Column lg={4}><span style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>{t('label.site.type', 'Type:')} </span><span style={{ fontSize: '0.8125rem' }}>{selectedSite.type}</span></Column>
                <Column lg={4}><span style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>{selectedSite.lat}, {selectedSite.lng}</span></Column>
              </Grid>
            </div>
          )}
        </Tile>

        {/* Collection Event */}
        <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-04)' }}>
            {t('heading.step1.collectionEvent', 'Collection Event')}
          </h3>

          <Grid condensed>
            <Column lg={6}>
              <ComboBox
                id="trap-type"
                titleText={t('label.collectionEvent.trapType', 'Trap Type')}
                placeholder={t('placeholder.collectionEvent.trapType', 'Search trap types…')}
                items={TRAP_TYPES}
                itemToString={i => i?.label || ''}
                onChange={({ selectedItem }) => setTrapType(selectedItem)}
              />
            </Column>
            <Column lg={6}>
              <TextInput
                id="collector-name"
                labelText={t('label.collectionEvent.collectorName', 'Field team / Collector name')}
                placeholder="e.g., Tim Vektor Jaksel — Budi Santoso"
                defaultValue="Tim Vektor Jaksel — Budi Santoso"
              />
            </Column>
            <Column lg={8} style={{ marginTop: 'var(--cds-spacing-04)' }}>
              <DatePicker datePickerType="range" dateFormat="d/m/Y">
                <DatePickerInput
                  id="coll-start"
                  labelText={t('label.collectionEvent.collectionStart', 'Collection start date/time')}
                  placeholder="dd/mm/yyyy"
                  defaultValue="15/04/2026"
                />
                <DatePickerInput
                  id="coll-end"
                  labelText={t('label.collectionEvent.collectionEnd', 'Collection end date/time (optional)')}
                  placeholder="dd/mm/yyyy"
                />
              </DatePicker>
            </Column>
          </Grid>

          {/* GPS — pre-filled from site */}
          <Grid condensed style={{ marginTop: 'var(--cds-spacing-04)' }}>
            <Column lg={4}>
              <NumberInput
                id="gps-lat"
                label={t('label.collectionEvent.gpsLat', 'GPS Latitude')}
                value={lat || -6.2341}
                step={0.0001}
                min={-90} max={90}
                onChange={(e, { value }) => setLat(String(value))}
                helperText={t('helperText.collectionEvent.gps', 'Pre-filled from site. Update if trap GPS differs from site centre.')}
              />
            </Column>
            <Column lg={4}>
              <NumberInput
                id="gps-lng"
                label={t('label.collectionEvent.gpsLng', 'GPS Longitude')}
                value={lng || 106.8312}
                step={0.0001}
                min={-180} max={180}
                onChange={(e, { value }) => setLng(String(value))}
              />
            </Column>
            <Column lg={4} style={{ paddingTop: 'var(--cds-spacing-06)' }}>
              <InlineNotification
                kind="info"
                title=""
                subtitle={t('message.collectionLot.gpsPreFilled', 'Pre-filled from site. Update if trap GPS differs from site centre.')}
                lowContrast
                hideCloseButton
              />
            </Column>
          </Grid>

          {/* Pool flag + count */}
          <Grid condensed style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Column lg={4}>
              <Toggle
                id="pool-flag"
                labelText={t('label.collectionEvent.poolFlag', 'Pooled specimen')}
                labelA={t('label.no', 'No — Individual')}
                labelB={t('label.yes', 'Yes — Pool')}
                toggled={isPool}
                onToggle={val => setIsPool(val)}
              />
            </Column>
            {isPool && (
              <Column lg={4}>
                <NumberInput
                  id="organism-count"
                  label={t('label.collectionEvent.organismCount', 'Organism count')}
                  value={count}
                  min={1}
                  onChange={(e, { value }) => setCount(value)}
                  helperText={t('helperText.organismCount', 'Total organisms in this pool')}
                />
              </Column>
            )}
            <Column lg={4}>
              <Select
                id="vector-sample-type"
                labelText={t('label.collectionEvent.sampleType', 'Vector Sample Type')}
                value={sampleTypeId}
                onChange={e => setSampleTypeId(e.target.value)}
              >
                {VECTOR_SAMPLE_TYPES.map(vst => (
                  <SelectItem key={vst.id} value={vst.id} text={vst.label} />
                ))}
              </Select>
            </Column>
          </Grid>

          {/* Weather accordion */}
          <div style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Accordion>
              <AccordionItem title={t('label.collectionEvent.weather', 'Weather & Conditions (optional)')}>
                <Grid condensed>
                  <Column lg={4}>
                    <NumberInput
                      id="weather-temp"
                      label={t('label.collectionEvent.weatherTemp', 'Air temperature (°C)')}
                      defaultValue={28}
                      step={0.1}
                    />
                  </Column>
                  <Column lg={4}>
                    <NumberInput
                      id="weather-humidity"
                      label={t('label.collectionEvent.weatherHumidity', 'Humidity (%)')}
                      defaultValue={82}
                      min={0} max={100}
                    />
                  </Column>
                  <Column lg={4}>
                    <Select id="weather-cond" labelText={t('label.collectionEvent.weatherCondition', 'Weather condition')} defaultValue="Clear">
                      {['Clear', 'Cloudy', 'Rainy', 'Post-rain', 'Overcast'].map(w => (
                        <SelectItem key={w} value={w} text={t(`label.collectionEvent.weatherCondition.${w.toLowerCase().replace('-', '')}`, w)} />
                      ))}
                    </Select>
                  </Column>
                  <Column lg={16} style={{ marginTop: 'var(--cds-spacing-04)' }}>
                    <TextArea
                      id="coll-notes"
                      labelText={t('label.collectionEvent.notes', 'Collection notes')}
                      placeholder={t('placeholder.collectionNotes', 'e.g., High mosquito activity observed near drainage canal; trap placed 1.5m above ground on wooden post')}
                      rows={2}
                    />
                  </Column>
                </Grid>
              </AccordionItem>
            </Accordion>
          </div>
        </Tile>

        {/* Requester */}
        <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-04)' }}>
            {t('heading.requester', 'Requester / Ordering Organization')}
          </h3>
          <Grid condensed>
            <Column lg={6}>
              <TextInput id="requester" labelText={t('label.requester', 'Organization name')} defaultValue="Dinas Kesehatan Jakarta Selatan" />
            </Column>
            <Column lg={4}>
              <Select id="payment-type" labelText={t('label.paymentType', 'Payment Type')} defaultValue="Program">
                <SelectItem value="Program" text={t('label.payment.program', 'Program (Paid)')} />
                <SelectItem value="General" text={t('label.payment.general', 'General (Unpaid)')} />
              </Select>
            </Column>
            <Column lg={3}>
              <Toggle id="subcontract" labelText={t('label.subcontract', 'Subcontract')} labelA={t('label.no', 'No')} labelB={t('label.yes', 'Yes')} />
            </Column>
          </Grid>
        </Tile>

        <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end', marginTop: 'var(--cds-spacing-05)' }}>
          <Button kind="ghost">{t('button.cancel', 'Cancel')}</Button>
          <Button renderIcon={ArrowRight} onClick={onNext}>
            {t('button.collectionLot.saveStep1', 'Continue to Collect')}
          </Button>
        </Stack>
      </>)}

      {domain !== 'vector' && (
        <InlineNotification
          kind="info"
          title={t('label.domainNotShown', 'Clinical and Environmental workflows')}
          subtitle={t('helperText.domainNotShown', 'Clinical and Environmental / Other domain screens are unchanged from the Sample Collection Redesign. This mockup focuses on the Vector extension. Switch to Vector above to see the new fields.')}
          lowContrast
          hideCloseButton
        />
      )}
    </div>
  );
}

// ─── Screen 2: Step 2 — Collect Sample (Vector) ───────────────────────────────
function Screen2CollectSample({ lot, onNext, onBack }) {
  const [receivedAt, setReceivedAt] = useState('2026-04-16 08:30');
  const [coolerId, setCoolerId]     = useState('CLR-2026-0042');
  const [shipmentId, setShipmentId] = useState('SHP-2026-0019');

  return (
    <div>
      <StepBar current={1} />
      <OrderContextCard lot={lot} />

      {/* Collection Event Summary */}
      <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--cds-spacing-04)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            {t('heading.collectionEventSummary', 'Collection Event Summary')}
          </h3>
          <Button kind="ghost" size="sm" renderIcon={Edit}>
            {t('button.editStep1', 'Edit (Step 1)')}
          </Button>
        </div>
        <Grid condensed>
          {[
            [t('label.collectionEvent.trapType', 'Trap Type'), 'BG-Sentinel'],
            [t('label.collectionEvent.collectorName', 'Collector'), 'Tim Vektor Jaksel — Budi Santoso'],
            [t('label.collectionEvent.collectionStart', 'Collection start'), '15/04/2026 07:00'],
            [t('label.lot.site', 'Sampling site'), 'Ciliwung River — Upstream S1'],
            [t('label.collectionEvent.gpsLat', 'GPS'), '-6.2341, 106.8312'],
            [t('label.collectionEvent.poolFlag', 'Pool'), '25 organisms (Mosquito Pool Fixed)'],
          ].map(([label, value]) => (
            <Column key={label} lg={4} style={{ marginBottom: 'var(--cds-spacing-03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block' }}>{label}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</span>
            </Column>
          ))}
        </Grid>
      </Tile>

      {/* Receipt Confirmation */}
      <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-04)' }}>
          {t('heading.step2.receiptConfirmation', 'Receipt Confirmation')}
        </h3>
        <Grid condensed>
          <Column lg={5}>
            <TextInput
              id="received-at"
              labelText={t('label.receipt.receivedAt', 'Lab receipt date/time')}
              value={receivedAt}
              onChange={e => setReceivedAt(e.target.value)}
              helperText={t('helperText.receivedAt', 'Used by the S-09 transit window auto-compute rule')}
            />
          </Column>
          <Column lg={5}>
            <TextInput
              id="received-by"
              labelText={t('label.receipt.receivedBy', 'Received by')}
              defaultValue="Siti Rahayu (QA Officer)"
              helperText={t('helperText.receivedBy', 'Auto-filled with logged-in user; editable')}
            />
          </Column>
          <Column lg={6} style={{ marginTop: 'var(--cds-spacing-04)' }}>
            <TextInput
              id="cooler-id"
              labelText={t('label.receipt.coolerId', 'Cooler / Container ID')}
              value={coolerId}
              onChange={e => setCoolerId(e.target.value)}
              helperText={t('helperText.coolerId', 'Optional. From field container or sample shipment.')}
            />
          </Column>
          <Column lg={6} style={{ marginTop: 'var(--cds-spacing-04)' }}>
            <TextInput
              id="shipment-id"
              labelText={t('label.receipt.shipmentId', 'Shipment ID')}
              value={shipmentId}
              onChange={e => setShipmentId(e.target.value)}
              helperText={t('helperText.receipt.shipmentId', 'Optional. Links to an existing sample shipment record.')}
            />
          </Column>
        </Grid>
      </Tile>

      {/* Updatable collection details */}
      <Accordion style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <AccordionItem title={t('heading.collectionDetailsUpdate', 'Update Collection Details (optional)')}>
          <Grid condensed>
            <Column lg={4}>
              <NumberInput id="upd-lat" label={t('label.collectionEvent.gpsLat', 'GPS Latitude')} defaultValue={-6.2341} step={0.0001} />
            </Column>
            <Column lg={4}>
              <NumberInput id="upd-lng" label={t('label.collectionEvent.gpsLng', 'GPS Longitude')} defaultValue={106.8312} step={0.0001} />
            </Column>
            <Column lg={4}>
              <NumberInput id="upd-count" label={t('label.collectionEvent.organismCount', 'Organism count')} defaultValue={25} min={1} />
            </Column>
            <Column lg={16} style={{ marginTop: 'var(--cds-spacing-04)' }}>
              <TextArea id="upd-notes" labelText={t('label.collectionEvent.notes', 'Collection notes')} rows={2}
                defaultValue="High mosquito activity observed near drainage canal; trap placed 1.5m above ground on wooden post" />
            </Column>
          </Grid>
        </AccordionItem>
      </Accordion>

      <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
        <Button kind="ghost" onClick={onBack}>{t('button.back', 'Back')}</Button>
        <Button renderIcon={ArrowRight} onClick={onNext}>
          {t('button.collectionLot.saveStep2', 'Continue to Label')}
        </Button>
      </Stack>
    </div>
  );
}

// ─── Screen 3: Step 3 — Label & Store (Vector) ───────────────────────────────
function Screen3LabelStore({ lot, onNext, onBack }) {
  return (
    <div>
      <StepBar current={2} />
      <OrderContextCard lot={lot} />

      <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-04)' }}>
          {t('heading.collectionLotLabel', 'Collection Lot Label')}
        </h3>

        {/* Label preview */}
        <div style={{ border: '2px solid var(--cds-border-strong-01)', borderRadius: 4, padding: 'var(--cds-spacing-05)', maxWidth: 360, marginBottom: 'var(--cds-spacing-05)', background: '#fff' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: 4, color: 'var(--cds-text-secondary)' }}>OpenELIS Global — Vector Collection Lot</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '0.02em', marginBottom: 6, fontFamily: 'monospace' }}>0013/BPP-01/VCT/04/2026</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '0.75rem' }}>
            <div><span style={{ color: 'var(--cds-text-secondary)' }}>Site: </span>Ciliwung R. — S1</div>
            <div><span style={{ color: 'var(--cds-text-secondary)' }}>Trap: </span>BG-Sentinel</div>
            <div><span style={{ color: 'var(--cds-text-secondary)' }}>Collected: </span>15/04/2026</div>
            <div><span style={{ color: 'var(--cds-text-secondary)' }}>Pool: </span>25 organisms</div>
          </div>
          {/* Barcode placeholder */}
          <div style={{ marginTop: 12, height: 40, background: 'repeating-linear-gradient(90deg, #000 0, #000 2px, #fff 2px, #fff 6px)', opacity: 0.8 }} />
        </div>

        <Stack orientation="horizontal" gap={3}>
          <Button renderIcon={Printer}>{t('button.printLabel', 'Print Label')}</Button>
          <Button kind="secondary" renderIcon={Printer}>{t('button.printRegistration', 'Print Registration Form')}</Button>
        </Stack>
      </Tile>

      <Tile style={{ marginBottom: 'var(--cds-spacing-05)', padding: 'var(--cds-spacing-05)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-04)' }}>
          {t('heading.storageLocation', 'Storage Location (optional)')}
        </h3>
        <Grid condensed>
          <Column lg={5}>
            <TextInput id="storage-loc" labelText={t('label.storageLocation', 'Storage location')} placeholder="e.g., Fridge 2, Rack A, Shelf 3" />
          </Column>
          <Column lg={5}>
            <Select id="storage-type" labelText={t('label.storageType', 'Storage type')} defaultValue="temporary">
              <SelectItem value="temporary" text={t('label.storage.temporary', 'Temporary Storage')} />
              <SelectItem value="biorepository" text={t('label.storage.biorepository', 'Biorepository')} />
            </Select>
          </Column>
        </Grid>
      </Tile>

      <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
        <Button kind="ghost" onClick={onBack}>{t('button.back', 'Back')}</Button>
        <Button renderIcon={ArrowRight} onClick={onNext}>
          {t('button.continueToQA', 'Continue to QA Review')}
        </Button>
      </Stack>
    </div>
  );
}

// ─── Screen 4: Step 4 — QA Review / Eligibility Gate (Vector) ────────────────
function Screen4QAReview({ lot, onBack }) {
  const [checkedCriteria, setCheckedCriteria] = useState({
    c1: true, c2: true, c3: true, c4: false, c5: true,
  });
  const [overrideNote, setOverrideNote] = useState('');
  const [showOverride, setShowOverride]   = useState(false);
  const [submitted, setSubmitted]         = useState(false);

  const criteria = [
    { id: 'c1', label: t('label.eligibility.containerIntegrity', 'Container integrity intact'), severity: 'MAJOR', autoComputed: false, pass: checkedCriteria.c1 },
    { id: 'c2', label: t('label.eligibility.labelLegibility', 'Label legibility'), severity: 'MINOR', autoComputed: false, pass: checkedCriteria.c2 },
    { id: 'c3', label: t('label.eligibility.transitWindow', 'SOP transit window met'), severity: 'MAJOR', autoComputed: true, pass: checkedCriteria.c3, note: '32.5 h elapsed; SOP max 48 h → PASS' },
    { id: 'c4', label: t('label.eligibility.poolSize', 'Pool size sufficient'), severity: 'MAJOR', autoComputed: true, pass: checkedCriteria.c4, note: '25 organisms collected; minimum 25 (from Mosquito Pool Fixed profile) → PASS' },
    { id: 'c5', label: t('label.eligibility.containerCondition', 'Container condition acceptable'), severity: 'MINOR', autoComputed: false, pass: checkedCriteria.c5 },
  ];

  const allPass = criteria.every(c => c.pass);
  const hasFail = criteria.some(c => !c.pass);

  if (submitted) {
    return (
      <div>
        <StepBar current={3} />
        <InlineNotification
          kind={allPass || overrideNote ? 'success' : 'error'}
          title={allPass ? t('message.eligibility.passed', 'Eligibility assessment passed.') : t('message.eligibility.overridden', 'Assessment overridden with documented reason.')}
          subtitle={allPass
            ? t('message.eligibility.passedDetail', 'Collection lot 0013/BPP-01/VCT/04/2026 is ELIGIBLE. Status advanced to PROCESSING — ready for V-03 identification.')
            : t('message.eligibility.overriddenDetail', 'Lot accepted with override. Reason recorded in EligibilityAssessment audit trail.')
          }
          lowContrast
          hideCloseButton
        />
      </div>
    );
  }

  return (
    <div>
      <StepBar current={3} />
      <OrderContextCard lot={lot} />

      <Tile style={{ padding: 'var(--cds-spacing-05)', marginBottom: 'var(--cds-spacing-05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--cds-spacing-04)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            {t('heading.eligibilityAssessment', 'Pre-Analytical Eligibility Assessment')}
          </h3>
          <Tag kind="teal" size="sm">{t('label.domain.vector', 'Vector')}</Tag>
        </div>

        <Stack gap={3}>
          {criteria.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--cds-spacing-04)',
              padding: 'var(--cds-spacing-03) var(--cds-spacing-04)',
              background: c.pass ? 'var(--cds-layer-01)' : '#fff1f1',
              border: `1px solid ${c.pass ? 'var(--cds-border-subtle-01)' : 'var(--cds-support-error)'}`,
              borderRadius: 4,
            }}>
              {c.autoComputed
                ? <span style={{ color: c.pass ? 'var(--cds-support-success)' : 'var(--cds-support-error)', marginTop: 2 }}>
                    {c.pass ? <Checkmark size={16} /> : <Warning size={16} />}
                  </span>
                : <input type="checkbox" checked={c.pass}
                    onChange={e => setCheckedCriteria(p => ({ ...p, [c.id]: e.target.checked }))}
                    style={{ marginTop: 4, width: 16, height: 16, cursor: 'pointer' }}
                  />
              }
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 'var(--cds-spacing-03)', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.label}</span>
                  {c.severity === 'MAJOR' && <Tag kind="orange" size="sm">{t('label.severity.major', 'Major')}</Tag>}
                  {c.severity === 'MINOR' && <Tag kind="warm-gray" size="sm">{t('label.severity.minor', 'Minor')}</Tag>}
                  {c.autoComputed && <Tag kind="cyan" size="sm">{t('label.autoComputed', 'Auto-computed')}</Tag>}
                </div>
                {c.note && <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--cds-text-secondary)', marginTop: 4 }}>{c.note}</div>}
              </div>
            </div>
          ))}
        </Stack>

        {hasFail && !showOverride && (
          <div style={{ marginTop: 'var(--cds-spacing-05)', display: 'flex', gap: 'var(--cds-spacing-03)' }}>
            <Button kind="danger--ghost" onClick={() => setShowOverride(true)}>
              {t('button.overrideWithNote', 'Accept with note (override)')}
            </Button>
          </div>
        )}

        {showOverride && (
          <Tile style={{ marginTop: 'var(--cds-spacing-04)', background: '#fff8e1', border: '1px solid #f1c21b' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-03)' }}>
              {t('heading.overrideReason', 'Override reason (required)')}
            </h4>
            <TextArea
              id="override-note"
              labelText=""
              placeholder={t('placeholder.overrideReason', 'Describe the reason for accepting despite failed criteria…')}
              value={overrideNote}
              onChange={e => setOverrideNote(e.target.value)}
              rows={3}
            />
            <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-04)' }}>
              <Button kind="primary" disabled={!overrideNote.trim()} onClick={() => setSubmitted(true)}>
                {t('button.acceptWithOverride', 'Accept with override')}
              </Button>
              <Button kind="ghost" onClick={() => setShowOverride(false)}>{t('button.cancel', 'Cancel')}</Button>
            </Stack>
          </Tile>
        )}
      </Tile>

      <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
        <Button kind="ghost" onClick={onBack}>{t('button.back', 'Back')}</Button>
        <Button
          renderIcon={allPass ? Checkmark : Warning}
          kind={allPass ? 'primary' : 'secondary'}
          disabled={hasFail && !overrideNote}
          onClick={() => setSubmitted(true)}
        >
          {allPass
            ? t('button.submitEligible', 'Mark Eligible — Complete')
            : t('button.submitFailed', 'Submit Assessment')
          }
        </Button>
      </Stack>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function VectorCollectionWorkflow() {
  const [screen, setScreen] = useState(0);
  const [activeLot, setActiveLot] = useState(MOCK_LOTS[0]);

  const SCREENS = [
    { label: t('label.screen.worklist', 'Collection Lot Worklist'), key: 'worklist' },
    { label: t('label.screen.step1', 'Step 1 — Enter Order'), key: 'step1' },
    { label: t('label.screen.step2', 'Step 2 — Collect Sample'), key: 'step2' },
    { label: t('label.screen.step3', 'Step 3 — Label & Store'), key: 'step3' },
    { label: t('label.screen.step4', 'Step 4 — QA Review'), key: 'step4' },
  ];

  return (
    <div>
      {/* Screen switcher for mockup navigation */}
      <div style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <Tabs selectedIndex={screen} onChange={({ selectedIndex }) => setScreen(selectedIndex)}>
          <TabList aria-label="Screens">
            {SCREENS.map(s => <Tab key={s.key}>{s.label}</Tab>)}
          </TabList>
          <TabPanels>
            <TabPanel>
              <Screen0Worklist
                onNewLot={() => setScreen(1)}
                onContinue={lot => { setActiveLot(lot); setScreen(2); }}
              />
            </TabPanel>
            <TabPanel>
              <Screen1EnterOrder onNext={() => setScreen(2)} />
            </TabPanel>
            <TabPanel>
              <Screen2CollectSample lot={activeLot} onNext={() => setScreen(3)} onBack={() => setScreen(1)} />
            </TabPanel>
            <TabPanel>
              <Screen3LabelStore lot={activeLot} onNext={() => setScreen(4)} onBack={() => setScreen(2)} />
            </TabPanel>
            <TabPanel>
              <Screen4QAReview lot={activeLot} onBack={() => setScreen(3)} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}
