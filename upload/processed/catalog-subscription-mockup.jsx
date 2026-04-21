import React, { useState } from 'react';
import {
  Grid,
  Column,
  Stack,
  SideNav,
  SideNavItems,
  SideNavMenu,
  SideNavMenuItem,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableBatchActions,
  TableBatchAction,
  TableSelectRow,
  TableSelectAll,
  Button,
  Tag,
  Toggle,
  TextInput,
  NumberInput,
  Checkbox,
  InlineNotification,
  Modal,
  Accordion,
  AccordionItem,
  Breadcrumb,
  BreadcrumbItem,
  Loading,
  Select,
  SelectItem,
  Tile,
} from '@carbon/react';
import {
  Add,
  Edit,
  TrashCan,
  ChevronDown,
  ChevronUp,
  Renew,
  Pause,
  Play,
  Warning,
  Globe,
  Link,
  CheckmarkFilled,
  CloudOffline,
  Close,
} from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ─── Sample Data ────────────────────────────────────────────────────────────

const SUBSCRIPTIONS = [
  {
    id: 1,
    name: 'EUCAST 2026 Breakpoints',
    fhirBaseUrl: 'https://eucast.org/fhir',
    resourceTypes: ['PlanDefinition'],
    pollingIntervalHours: 168,
    lastPolled: '2026-03-22 06:00',
    status: 'active',
  },
  {
    id: 2,
    name: 'WHO Essential Diagnostics',
    fhirBaseUrl: 'https://catalog.who.int/fhir',
    resourceTypes: ['ActivityDefinition'],
    pollingIntervalHours: 24,
    lastPolled: '2026-03-23 06:00',
    status: 'active',
  },
  {
    id: 3,
    name: 'National Reference Lab – CI',
    fhirBaseUrl: 'https://lnsp.ci/fhir',
    resourceTypes: ['ActivityDefinition', 'PlanDefinition'],
    pollingIntervalHours: 48,
    lastPolled: '2026-03-21 06:00',
    status: 'error',
    errorMessage: 'HTTP 503 – Service Unavailable',
  },
];

const PENDING_UPDATES = [
  {
    id: 1,
    resourceName: 'EUCAST TB Breakpoints v6.0',
    resourceType: 'PlanDefinition',
    matchType: 'linked',
    subscription: 'EUCAST 2026 Breakpoints',
    detected: '2026-03-23',
    fields: [
      { id: 'f1', fieldName: t('label.catalogSubscription.fieldName', 'Version'), localValue: '5.0', upstreamValue: '6.0', decision: 'pending', isNested: false },
      { id: 'f2', fieldName: t('label.catalogSubscription.fieldName', 'Publisher'), localValue: 'EUCAST', upstreamValue: 'EUCAST', decision: 'pending', isNested: false },
    ],
    breakpoints: [
      { id: 'b1', organism: 'M. tuberculosis', antimicrobial: 'Isoniazid', category: 'R', localMic: '≥0.2', upstreamMic: '≥0.25', decision: 'pending', tag: 'changed' },
      { id: 'b2', organism: 'M. tuberculosis', antimicrobial: 'Rifampicin', category: 'R', localMic: '≥0.5', upstreamMic: '≥0.5', decision: 'pending', tag: 'unchanged' },
      { id: 'b3', organism: 'M. tuberculosis', antimicrobial: 'Bedaquiline', category: 'S', localMic: null, upstreamMic: '≤0.008', decision: 'pending', tag: 'new' },
    ],
  },
  {
    id: 2,
    resourceName: 'Malaria RDT (PfHRP2)',
    resourceType: 'ActivityDefinition',
    matchType: 'loinc',
    subscription: 'WHO Essential Diagnostics',
    detected: '2026-03-23',
    fields: [
      { id: 'f3', fieldName: 'Normal Range (Negative)', localValue: 'Negative', upstreamValue: 'Non-reactive', decision: 'pending', isNested: false },
      { id: 'f4', fieldName: 'Result Type', localValue: 'Text', upstreamValue: 'Coded', decision: 'pending', isNested: false },
      { id: 'f5', fieldName: 'Units', localValue: '', upstreamValue: 'ratio', decision: 'pending', isNested: false },
    ],
    breakpoints: [],
  },
  {
    id: 3,
    resourceName: 'Sickle Cell Screen',
    resourceType: 'ActivityDefinition',
    matchType: 'new',
    subscription: 'WHO Essential Diagnostics',
    detected: '2026-03-23',
    fields: [
      { id: 'f6', fieldName: 'Name', localValue: '', upstreamValue: 'Sickle Cell Hemoglobin Screen', decision: 'pending', isNested: false },
      { id: 'f7', fieldName: 'LOINC Code', localValue: '', upstreamValue: '4625-5', decision: 'pending', isNested: false },
      { id: 'f8', fieldName: 'Result Type', localValue: '', upstreamValue: 'Text', decision: 'pending', isNested: false },
      { id: 'f9', fieldName: 'Normal Range', localValue: '', upstreamValue: 'Negative', decision: 'pending', isNested: false },
    ],
    breakpoints: [],
  },
  {
    id: 4,
    resourceName: 'Hepatitis B Surface Antigen',
    resourceType: 'ActivityDefinition',
    matchType: 'ambiguous',
    subscription: 'WHO Essential Diagnostics',
    detected: '2026-03-22',
    fields: [],
    breakpoints: [],
    candidates: [
      { id: 101, name: 'HBsAg (Rapid)', loinc: '5195-3' },
      { id: 102, name: 'Hepatitis B sAg', loinc: '5195-3' },
    ],
  },
];

// Hub configuration — in production, sourced from site_information config keys
const HUB_CONNECTED = true;
const HUB_NAME = 'OpenELIS Community Hub';

const REGISTRY_CATALOGS = [
  {
    id: 'r1',
    name: 'EUCAST Clinical Breakpoints',
    description: 'Annual MIC/disk breakpoints for bacterial and fungal pathogens',
    publisher: 'EUCAST',
    resourceTypes: ['PlanDefinition'],
    region: 'Global',
    resourceCount: 312,
    lastUpdated: '2026-01-15',
    fhirBaseUrl: 'https://eucast.org/fhir',
  },
  {
    id: 'r2',
    name: 'WHO Essential Diagnostics Catalog',
    description: 'Reference test definitions aligned to WHO EDL',
    publisher: 'WHO',
    resourceTypes: ['ActivityDefinition'],
    region: 'Global',
    resourceCount: 184,
    lastUpdated: '2025-11-02',
    fhirBaseUrl: 'https://catalog.who.int/fhir',
  },
  {
    id: 'r3',
    name: 'NHLS Reference Lab Catalog',
    description: 'National Health Laboratory Service reference methods',
    publisher: 'NHLS',
    resourceTypes: ['ActivityDefinition', 'PlanDefinition'],
    region: 'Africa',
    resourceCount: 97,
    lastUpdated: '2025-12-10',
    fhirBaseUrl: 'https://catalog.nhls.ac.za/fhir',
  },
  {
    id: 'r4',
    name: 'INSPC Madagascar Test Catalog',
    description: 'Institut National de Santé Publique et Communautaire test definitions',
    publisher: 'INSPC',
    resourceTypes: ['ActivityDefinition'],
    region: 'Africa',
    resourceCount: 63,
    lastUpdated: '2025-09-20',
    fhirBaseUrl: 'https://inspc.mg/fhir',
  },
  {
    id: 'r5',
    name: 'LNSP Côte d\'Ivoire Reference Catalog',
    description: 'Laboratoire National de Santé Publique national reference catalog',
    publisher: 'LNSP CI',
    resourceTypes: ['ActivityDefinition'],
    region: 'Africa',
    resourceCount: 78,
    lastUpdated: '2025-10-14',
    fhirBaseUrl: 'https://lnsp.ci/fhir',
  },
  {
    id: 'r6',
    name: 'CBCL Community Biochemistry Panel',
    description: 'Community-contributed biochemistry test definitions',
    publisher: 'OpenELIS Community',
    resourceTypes: ['ActivityDefinition'],
    region: 'Global',
    resourceCount: 45,
    lastUpdated: '2026-02-28',
    fhirBaseUrl: 'https://hub.openelis-global.org/fhir/cbcl',
  },
  {
    id: 'r7',
    name: 'CLSI EP Evaluation Protocols',
    description: 'CLSI method evaluation reference standards',
    publisher: 'CLSI',
    resourceTypes: ['PlanDefinition'],
    region: 'Global',
    resourceCount: 22,
    lastUpdated: '2025-08-01',
    fhirBaseUrl: 'https://clsi.org/fhir',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusKind = { active: 'green', paused: 'warm-gray', syncing: 'blue', error: 'red' };
const statusLabel = {
  active: t('label.catalogSubscription.statusActive', 'Active'),
  paused: t('label.catalogSubscription.statusPaused', 'Paused'),
  syncing: t('label.catalogSubscription.statusSyncing', 'Syncing'),
  error: t('label.catalogSubscription.statusError', 'Error'),
};
const matchKind = { linked: 'teal', loinc: 'blue', new: 'green', ambiguous: 'red' };
const matchLabel = {
  linked: t('label.catalogSubscription.matchLinked', 'Linked'),
  loinc: t('label.catalogSubscription.matchLoinc', 'LOINC Match'),
  new: t('label.catalogSubscription.matchNew', 'New'),
  ambiguous: t('label.catalogSubscription.matchAmbiguous', 'Ambiguous'),
};
const conditionTagKind = { new: 'green', changed: 'warm-gray', removed: 'red', unchanged: 'gray' };

const pendingCount = PENDING_UPDATES.filter(u => u.matchType !== 'resolved').length;

// ─── Catalog Registry Drawer ────────────────────────────────────────────────
// Full-width slide-in panel listing all catalogs published by the hub.
// Opens when the user clicks "Browse Catalog Registry" in the hub status banner.

function CatalogRegistryDrawer({ subscribedUrls, onSubscribe, onClose, onManual }) {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const regions = [...new Set(REGISTRY_CATALOGS.map(c => c.region))].sort();
  const resourceTypes = ['ActivityDefinition', 'PlanDefinition'];

  const filtered = REGISTRY_CATALOGS.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || c.name.toLowerCase().includes(q)
      || c.publisher.toLowerCase().includes(q)
      || c.description.toLowerCase().includes(q);
    const matchesRegion = !regionFilter || c.region === regionFilter;
    const matchesType = !typeFilter || c.resourceTypes.includes(typeFilter);
    return matchesSearch && matchesRegion && matchesType;
  });

  const registryHeaders = [
    { key: 'name', header: t('label.catalogSubscription.name', 'Name') },
    { key: 'publisher', header: t('label.catalogRegistry.publisher', 'Publisher') },
    { key: 'resourceTypes', header: t('label.catalogSubscription.resourceTypes', 'Resource Types') },
    { key: 'region', header: t('label.catalogRegistry.region', 'Region') },
    { key: 'resourceCount', header: t('label.catalogRegistry.resourceCount', 'Resources') },
    { key: 'lastUpdated', header: t('label.catalogRegistry.lastUpdated', 'Last Updated') },
    { key: 'actions', header: '' },
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '75vw', maxWidth: '1024px',
      background: '#ffffff', boxShadow: '-4px 0 16px rgba(0,0,0,0.16)',
      zIndex: 9000, display: 'flex', flexDirection: 'column',
    }}>
      {/* Drawer header */}
      <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', marginBottom: '0.25rem' }}>
            <Globe size={20} style={{ color: '#0f62fe' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              {t('heading.catalogRegistry.title', 'Catalog Registry')}
            </h2>
            <Tag kind="blue" size="sm">{HUB_NAME}</Tag>
          </Stack>
          <p style={{ fontSize: '0.875rem', color: '#525252', margin: 0 }}>
            {filtered.length} {t('heading.catalogRegistry.availableCatalogs', 'Available Catalogs')}
          </p>
        </div>
        <Button
          kind="ghost"
          renderIcon={Close}
          iconDescription={t('button.catalogRegistry.close', 'Close')}
          hasIconOnly
          onClick={onClose}
        />
      </div>

      {/* Filters */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e0e0e0', background: '#f4f4f4' }}>
        <Grid narrow>
          <Column lg={6} md={4}>
            <TextInput
              id="registry-search"
              labelText=""
              placeholder={t('placeholder.catalogRegistry.search', 'Search catalogs...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Column>
          <Column lg={3} md={2}>
            <Select
              id="registry-region"
              labelText=""
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
            >
              <SelectItem value="" text={t('label.catalogRegistry.region', 'All Regions')} />
              {regions.map(r => <SelectItem key={r} value={r} text={r} />)}
            </Select>
          </Column>
          <Column lg={3} md={2}>
            <Select
              id="registry-type"
              labelText=""
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <SelectItem value="" text={t('label.catalogSubscription.resourceTypes', 'All Resource Types')} />
              {resourceTypes.map(rt => <SelectItem key={rt} value={rt} text={rt} />)}
            </Select>
          </Column>
        </Grid>
      </div>

      {/* Catalog table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#525252' }}>
            <p>{t('message.catalogRegistry.noResults', 'No catalogs match your search.')}</p>
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {registryHeaders.map(h => <TableHeader key={h.key}>{h.header}</TableHeader>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(catalog => {
                  const isSubscribed = subscribedUrls.includes(catalog.fhirBaseUrl);
                  return (
                    <TableRow key={catalog.id}>
                      <TableCell>
                        <strong style={{ display: 'block' }}>{catalog.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#525252' }}>{catalog.description}</span>
                      </TableCell>
                      <TableCell>{catalog.publisher}</TableCell>
                      <TableCell>
                        <Stack orientation="horizontal" gap={2}>
                          {catalog.resourceTypes.map(rt => (
                            <Tag key={rt} kind={rt === 'PlanDefinition' ? 'purple' : 'blue'} size="sm">{rt}</Tag>
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Tag kind="gray" size="sm">{catalog.region}</Tag>
                      </TableCell>
                      <TableCell>{catalog.resourceCount}</TableCell>
                      <TableCell>{catalog.lastUpdated}</TableCell>
                      <TableCell>
                        {isSubscribed ? (
                          <Tag kind="green" size="sm" renderIcon={CheckmarkFilled}>
                            {t('label.catalogRegistry.subscribed', '✓ Subscribed')}
                          </Tag>
                        ) : (
                          <Button
                            kind="primary"
                            size="sm"
                            renderIcon={Link}
                            onClick={() => onSubscribe(catalog)}
                          >
                            {t('button.catalogRegistry.subscribe', 'Subscribe')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      {/* Drawer footer */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e0e0e0', background: '#f4f4f4', textAlign: 'center' }}>
        <Button kind="ghost" size="sm" onClick={onManual}>
          {t('message.catalogRegistry.customEndpointHint', "Can't find what you need? Add a custom FHIR endpoint manually.")} →
        </Button>
      </div>
    </div>
  );
}

// ─── Hub Status Banner ───────────────────────────────────────────────────────
// Displayed above the Subscriptions DataTable when catalog.hub.url is configured.
// Shows connection status, hub metadata, and a "Browse Catalog Registry" button.

function HubBanner({ subscribedCount, onBrowse, onCustom }) {
  const totalCatalogs = REGISTRY_CATALOGS.length;

  if (!HUB_CONNECTED) {
    return (
      <Tile style={{ marginBottom: '1rem', background: '#fff1f1', borderLeft: '4px solid #da1e28' }}>
        <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <CloudOffline size={20} style={{ color: '#da1e28', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Tag kind="red" size="sm">{t('label.catalogRegistry.hubUnreachable', 'Unreachable')}</Tag>
            <p style={{ fontSize: '0.75rem', color: '#525252', marginTop: '0.25rem' }}>
              {t('error.catalogRegistry.hubUnreachable', 'Could not connect to the hub. Check the hub URL in System Configuration.')}
            </p>
          </div>
          <Button kind="secondary" size="sm" renderIcon={Renew}>
            {t('button.catalogRegistry.retry', 'Retry')}
          </Button>
          <Button kind="ghost" size="sm" onClick={onCustom}>
            {t('button.catalogRegistry.addCustom', 'Add Custom Endpoint')}
          </Button>
        </Stack>
      </Tile>
    );
  }

  return (
    <Tile style={{ marginBottom: '1rem', background: '#defbe6', borderLeft: '4px solid #24a148' }}>
      <Stack orientation="horizontal" gap={4} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Globe size={20} style={{ color: '#24a148', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Tag kind="green" size="sm">{t('label.catalogRegistry.hubConnected', 'Connected')}</Tag>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{HUB_NAME}</span>
            <span style={{ fontSize: '0.75rem', color: '#525252' }}>
              {totalCatalogs} {t('label.catalogRegistry.totalCatalogs', 'available catalogs')}
              {' · '}
              {subscribedCount} {t('label.catalogRegistry.subscribedCount', 'subscribed')}
            </span>
          </Stack>
        </div>
        <Button kind="primary" size="sm" renderIcon={Globe} onClick={onBrowse}>
          {t('button.catalogRegistry.browse', 'Browse Catalog Registry')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCustom}>
          {t('button.catalogRegistry.addCustom', 'Add Custom Endpoint')}
        </Button>
      </Stack>
    </Tile>
  );
}

// ─── Subscription Form (inline expansion) ──────────────────────────────────

function SubscriptionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: '', fhirBaseUrl: '', pollingIntervalHours: 24, resourceTypes: { ActivityDefinition: true, PlanDefinition: false } }
  );
  return (
    <div style={{ padding: '1rem', background: '#f4f4f4', borderTop: '2px solid #0f62fe' }}>
      <Grid>
        <Column lg={5} md={4}>
          <TextInput
            id="sub-name"
            labelText={t('label.catalogSubscription.name', 'Subscription Name')}
            placeholder={t('placeholder.catalogSubscription.name', 'e.g., EUCAST 2026')}
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </Column>
        <Column lg={7} md={4}>
          <TextInput
            id="sub-url"
            labelText={t('label.catalogSubscription.fhirBaseUrl', 'FHIR Base URL')}
            placeholder={t('placeholder.catalogSubscription.fhirBaseUrl', 'https://catalog.example.org/fhir')}
            value={form.fhirBaseUrl}
            onChange={e => setForm({ ...form, fhirBaseUrl: e.target.value })}
          />
        </Column>
        <Column lg={4} md={2} style={{ paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('label.catalogSubscription.resourceTypes', 'Resource Types')}
          </p>
          <Stack gap={2}>
            <Checkbox
              id="rt-activity"
              labelText={t('label.catalogSubscription.resourceTypeActivity', 'ActivityDefinition (Tests)')}
              checked={form.resourceTypes.ActivityDefinition}
              onChange={(_, { checked }) => setForm({ ...form, resourceTypes: { ...form.resourceTypes, ActivityDefinition: checked } })}
            />
            <Checkbox
              id="rt-plan"
              labelText={t('label.catalogSubscription.resourceTypePlan', 'PlanDefinition (Clinical Rules)')}
              checked={form.resourceTypes.PlanDefinition}
              onChange={(_, { checked }) => setForm({ ...form, resourceTypes: { ...form.resourceTypes, PlanDefinition: checked } })}
            />
          </Stack>
        </Column>
        <Column lg={3} md={2} style={{ paddingTop: '1rem' }}>
          <NumberInput
            id="sub-interval"
            label={t('label.catalogSubscription.pollingInterval', 'Polling Interval (hours)')}
            value={form.pollingIntervalHours}
            min={1}
            max={168}
            onChange={(_, { value }) => setForm({ ...form, pollingIntervalHours: value })}
          />
        </Column>
      </Grid>
      <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
        <Button kind="primary" size="sm" onClick={() => onSave(form)}>
          {t('button.catalogSubscription.save', 'Save Subscription')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>
          {t('button.catalogSubscription.cancel', 'Cancel')}
        </Button>
      </Stack>
    </div>
  );
}

// ─── Subscriptions Tab ──────────────────────────────────────────────────────

function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState(SUBSCRIPTIONS);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [showRegistryDrawer, setShowRegistryDrawer] = useState(false);

  const subscribedUrls = subscriptions.map(s => s.fhirBaseUrl);

  const handleRegistrySubscribe = catalog => {
    const newSub = {
      id: Date.now(),
      name: catalog.name,
      fhirBaseUrl: catalog.fhirBaseUrl,
      resourceTypes: catalog.resourceTypes,
      pollingIntervalHours: 24,
      lastPolled: '—',
      status: 'active',
      fromRegistry: true,
    };
    setSubscriptions(prev => [...prev, newSub]);
    setNotification({
      kind: 'success',
      message: t('message.catalogRegistry.subscribeSuccess', `Subscribed to ${catalog.name}. Sync will begin on the next polling cycle.`),
    });
  };

  const toggleRow = id => setExpandedRow(prev => (prev === id ? null : id));

  const handleSync = id => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncingId(null);
      setNotification({ kind: 'success', message: t('message.catalogSubscription.syncSuccess', 'Sync completed. 3 new updates detected.') });
    }, 2000);
  };

  const subHeaders = [
    { key: 'name', header: t('label.catalogSubscription.name', 'Name') },
    { key: 'fhirBaseUrl', header: t('label.catalogSubscription.fhirBaseUrl', 'FHIR Base URL') },
    { key: 'resourceTypes', header: t('label.catalogSubscription.resourceTypes', 'Resource Types') },
    { key: 'pollingIntervalHours', header: t('label.catalogSubscription.pollingInterval', 'Interval (h)') },
    { key: 'lastPolled', header: t('label.catalogSubscription.lastPolled', 'Last Polled') },
    { key: 'status', header: t('label.catalogSubscription.status', 'Status') },
    { key: 'actions', header: '' },
  ];

  return (
    <Stack gap={5}>
      {/* Hub connection status banner — only shown when hub is configured */}
      <HubBanner
        subscribedCount={subscriptions.filter(s => s.fromRegistry).length}
        onBrowse={() => setShowRegistryDrawer(true)}
        onCustom={() => setShowAddForm(true)}
      />

      {notification && (
        <InlineNotification
          kind={notification.kind}
          title={notification.message}
          onCloseButtonClick={() => setNotification(null)}
        />
      )}

      {/* Registry drawer — overlays the page when open */}
      {showRegistryDrawer && (
        <CatalogRegistryDrawer
          subscribedUrls={subscribedUrls}
          onSubscribe={catalog => {
            handleRegistrySubscribe(catalog);
          }}
          onClose={() => setShowRegistryDrawer(false)}
          onManual={() => {
            setShowRegistryDrawer(false);
            setShowAddForm(true);
          }}
        />
      )}

      <TableContainer>
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch
              placeholder={t('placeholder.catalogSubscription.searchSubscriptions', 'Search subscriptions...')}
            />
            <Button renderIcon={Add} onClick={() => setShowAddForm(v => !v)}>
              {t('button.catalogSubscription.save', 'Add Subscription')}
            </Button>
          </TableToolbarContent>
        </TableToolbar>

        {showAddForm && (
          <SubscriptionForm
            onSave={form => {
              setSubscriptions([...subscriptions, { ...form, id: Date.now(), lastPolled: '—', status: 'active' }]);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        <Table>
          <TableHead>
            <TableRow>
              {subHeaders.map(h => (
                <TableHeader key={h.key}>{h.header}</TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptions.map(sub => (
              <React.Fragment key={sub.id}>
                <TableRow>
                  <TableCell>
                    <Stack gap={1}>
                      <span>{sub.name}</span>
                      {sub.fromRegistry && (
                        <Tag kind="cyan" size="sm" renderIcon={Link}>
                          {t('label.catalogRegistry.fromRegistry', 'From registry')}
                        </Tag>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{sub.fhirBaseUrl}</span>
                  </TableCell>
                  <TableCell>
                    <Stack orientation="horizontal" gap={2}>
                      {sub.resourceTypes.map(rt => (
                        <Tag key={rt} kind="gray" size="sm">{rt}</Tag>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{sub.pollingIntervalHours}h</TableCell>
                  <TableCell>{sub.lastPolled}</TableCell>
                  <TableCell>
                    <Tag kind={statusKind[sub.status]}>{statusLabel[sub.status]}</Tag>
                    {sub.status === 'error' && (
                      <p style={{ fontSize: '0.6875rem', color: '#da1e28', marginTop: '0.25rem' }}>{sub.errorMessage}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack orientation="horizontal" gap={2}>
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={syncingId === sub.id ? Loading : Renew}
                        iconDescription={t('button.catalogSubscription.checkForUpdates', 'Check for Updates')}
                        hasIconOnly
                        tooltipPosition="left"
                        onClick={() => handleSync(sub.id)}
                        disabled={syncingId === sub.id}
                      />
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={sub.status === 'paused' ? Play : Pause}
                        iconDescription={sub.status === 'paused' ? t('button.catalogSubscription.resume', 'Resume') : t('button.catalogSubscription.pause', 'Pause')}
                        hasIconOnly
                        tooltipPosition="left"
                      />
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={Edit}
                        iconDescription={t('button.catalogSubscription.save', 'Edit')}
                        hasIconOnly
                        tooltipPosition="left"
                        onClick={() => toggleRow(sub.id)}
                      />
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={TrashCan}
                        iconDescription={t('button.catalogSubscription.remove', 'Remove')}
                        hasIconOnly
                        tooltipPosition="left"
                        onClick={() => setRemoveTarget(sub)}
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
                {expandedRow === sub.id && (
                  <TableRow>
                    <TableCell colSpan={subHeaders.length}>
                      <SubscriptionForm
                        initial={{
                          ...sub,
                          resourceTypes: {
                            ActivityDefinition: sub.resourceTypes.includes('ActivityDefinition'),
                            PlanDefinition: sub.resourceTypes.includes('PlanDefinition'),
                          },
                        }}
                        onSave={() => setExpandedRow(null)}
                        onCancel={() => setExpandedRow(null)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Remove Confirmation Modal */}
      <Modal
        open={!!removeTarget}
        danger
        modalHeading={t('button.catalogSubscription.remove', 'Remove Subscription')}
        primaryButtonText={t('button.catalogSubscription.remove', 'Remove')}
        secondaryButtonText={t('button.catalogSubscription.cancel', 'Cancel')}
        onRequestSubmit={() => {
          setSubscriptions(subscriptions.filter(s => s.id !== removeTarget?.id));
          setRemoveTarget(null);
        }}
        onRequestClose={() => setRemoveTarget(null)}
      >
        <p>{t('message.catalogSubscription.removeConfirm', 'Remove this subscription? Pending updates will be discarded. Previously accepted changes will not be affected.')}</p>
        {removeTarget && <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>{removeTarget.name}</p>}
      </Modal>
    </Stack>
  );
}

// ─── Field Diff Panel ───────────────────────────────────────────────────────

function FieldDiffPanel({ update, onApply, onRejectAll }) {
  const [fields, setFields] = useState(update.fields.map(f => ({ ...f })));
  const [breakpoints, setBreakpoints] = useState(update.breakpoints.map(b => ({ ...b })));
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [notification, setNotification] = useState(null);

  const setFieldDecision = (id, decision) => setFields(fields.map(f => f.id === id ? { ...f, decision } : f));
  const setBpDecision = (id, decision) => setBreakpoints(breakpoints.map(b => b.id === id ? { ...b, decision } : b));
  const acceptAll = () => {
    setFields(fields.map(f => ({ ...f, decision: 'accepted' })));
    setBreakpoints(breakpoints.map(b => b.tag === 'unchanged' ? b : { ...b, decision: 'accepted' }));
  };
  const rejectAll = () => {
    setFields(fields.map(f => ({ ...f, decision: 'rejected' })));
    setBreakpoints(breakpoints.map(b => ({ ...b, decision: 'rejected' })));
  };

  // Disambiguation required for ambiguous match
  if (update.matchType === 'ambiguous' && !selectedCandidate) {
    return (
      <div style={{ padding: '1rem', background: '#fff8f1', border: '1px solid #ff832b', borderRadius: '2px' }}>
        <Stack gap={4}>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
            <Warning size={20} style={{ color: '#ff832b' }} />
            <p style={{ fontWeight: 600 }}>
              {t('heading.catalogSubscription.disambiguate', 'Select Matching Local Record')}
            </p>
          </Stack>
          <p style={{ fontSize: '0.875rem' }}>
            This upstream resource matched multiple local tests by LOINC code. Select the correct local record to link before reviewing field changes.
          </p>
          <Stack gap={2}>
            {update.candidates.map(c => (
              <Button
                key={c.id}
                kind="tertiary"
                size="sm"
                onClick={() => setSelectedCandidate(c)}
              >
                {c.name} — LOINC: {c.loinc}
              </Button>
            ))}
          </Stack>
        </Stack>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', background: '#f4f4f4' }}>
      {notification && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind={notification.kind}
            title={notification.message}
            onCloseButtonClick={() => setNotification(null)}
          />
        </div>
      )}

      {update.matchType === 'new' && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind="info"
            title={t('message.catalogSubscription.newTestWarning', 'New tests are created as Inactive. Activate them in Test Catalog before use.')}
            hideCloseButton
          />
        </div>
      )}

      {/* Top-level field diff table */}
      {fields.length > 0 && (
        <Table size="sm" style={{ marginBottom: '1rem' }}>
          <TableHead>
            <TableRow>
              <TableHeader>{t('label.catalogSubscription.fieldName', 'Field')}</TableHeader>
              <TableHeader>{t('label.catalogSubscription.localValue', 'Local Value')}</TableHeader>
              <TableHeader>{t('label.catalogSubscription.upstreamValue', 'Upstream Value')}</TableHeader>
              <TableHeader>{t('label.catalogSubscription.decision', 'Decision')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map(f => (
              <TableRow key={f.id}>
                <TableCell>{f.fieldName}</TableCell>
                <TableCell>
                  <span style={{ color: f.localValue ? '#161616' : '#8d8d8d', fontStyle: f.localValue ? 'normal' : 'italic' }}>
                    {f.localValue || '(blank)'}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ color: '#0043ce', fontWeight: 500 }}>{f.upstreamValue}</span>
                </TableCell>
                <TableCell>
                  <Toggle
                    id={`toggle-${f.id}`}
                    size="sm"
                    labelA={t('button.catalogSubscription.rejectAll', 'Reject')}
                    labelB={t('button.catalogSubscription.acceptAll', 'Accept')}
                    toggled={f.decision === 'accepted'}
                    onToggle={checked => setFieldDecision(f.id, checked ? 'accepted' : 'rejected')}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Nested breakpoints for PlanDefinition */}
      {breakpoints.filter(b => b.tag !== 'unchanged').length > 0 && (
        <Accordion style={{ marginBottom: '1rem' }}>
          <AccordionItem
            title={`${t('heading.catalogSubscription.breakpoints', 'Conditions / Breakpoints')} (${breakpoints.filter(b => b.tag !== 'unchanged').length} ${t('label.catalogSubscription.fieldName', 'changed')})`}
          >
            <Table size="sm">
              <TableHead>
                <TableRow>
                  <TableHeader>Organism</TableHeader>
                  <TableHeader>Antimicrobial</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>{t('label.catalogSubscription.localValue', 'Local MIC')}</TableHeader>
                  <TableHeader>{t('label.catalogSubscription.upstreamValue', 'Upstream MIC')}</TableHeader>
                  <TableHeader></TableHeader>
                  <TableHeader>{t('label.catalogSubscription.decision', 'Decision')}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {breakpoints.filter(b => b.tag !== 'unchanged').map(bp => (
                  <TableRow key={bp.id}>
                    <TableCell>{bp.organism}</TableCell>
                    <TableCell>{bp.antimicrobial}</TableCell>
                    <TableCell>{bp.category}</TableCell>
                    <TableCell>
                      <span style={{ color: bp.localMic ? '#161616' : '#8d8d8d', fontStyle: bp.localMic ? 'normal' : 'italic' }}>
                        {bp.localMic || '(none)'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: '#0043ce', fontWeight: 500 }}>{bp.upstreamMic}</span>
                    </TableCell>
                    <TableCell>
                      <Tag kind={conditionTagKind[bp.tag]} size="sm">
                        {bp.tag === 'new' ? t('label.catalogSubscription.newCondition', 'New')
                          : bp.tag === 'removed' ? t('label.catalogSubscription.removedCondition', 'Removed')
                          : bp.tag}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <Toggle
                        id={`toggle-bp-${bp.id}`}
                        size="sm"
                        labelA={t('button.catalogSubscription.rejectAll', 'Reject')}
                        labelB={t('button.catalogSubscription.acceptAll', 'Accept')}
                        toggled={bp.decision === 'accepted'}
                        onToggle={checked => setBpDecision(bp.id, checked ? 'accepted' : 'rejected')}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionItem>
        </Accordion>
      )}

      {/* Action buttons */}
      <Stack orientation="horizontal" gap={3}>
        <Button kind="primary" size="sm" onClick={() => {
          setNotification({ kind: 'success', message: t('message.catalogSubscription.applySuccess', 'Changes applied to local catalog.') });
          if (onApply) onApply();
        }}>
          {t('button.catalogSubscription.applyDecisions', 'Apply Decisions')}
        </Button>
        <Button kind="secondary" size="sm" onClick={acceptAll}>
          {t('button.catalogSubscription.acceptAll', 'Accept All')}
        </Button>
        <Button kind="ghost" size="sm" onClick={rejectAll}>
          {t('button.catalogSubscription.rejectAll', 'Reject All')}
        </Button>
      </Stack>
    </div>
  );
}

// ─── Pending Updates Tab ────────────────────────────────────────────────────

function PendingUpdatesTab() {
  const [updates, setUpdates] = useState(PENDING_UPDATES);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const toggleRow = id => setExpandedRow(prev => (prev === id ? null : id));
  const handleApply = id => setUpdates(updates.filter(u => u.id !== id));

  const updateHeaders = [
    { key: 'resourceName', header: t('label.catalogSubscription.fieldName', 'Resource') },
    { key: 'resourceType', header: t('label.catalogSubscription.resourceType', 'Type') },
    { key: 'matchType', header: t('label.catalogSubscription.matchType', 'Match') },
    { key: 'subscription', header: t('label.catalogSubscription.name', 'Subscription') },
    { key: 'detected', header: t('label.catalogSubscription.detectedDate', 'Detected') },
    { key: 'actions', header: '' },
  ];

  return (
    <Stack gap={5}>
      {updates.length === 0 && (
        <InlineNotification
          kind="success"
          title={t('message.catalogSubscription.syncNoChanges', 'No pending updates. Your catalog is up to date.')}
          hideCloseButton
        />
      )}
      <TableContainer>
        <TableToolbar>
          <TableBatchActions
            shouldShowBatchActions={selectedRows.length > 0}
            totalCount={selectedRows.length}
            onCancel={() => setSelectedRows([])}
          >
            <TableBatchAction
              renderIcon={TrashCan}
              onClick={() => {
                setUpdates(updates.filter(u => !selectedRows.includes(u.id)));
                setSelectedRows([]);
              }}
            >
              {t('button.catalogSubscription.rejectAllSelected', 'Reject All Selected')}
            </TableBatchAction>
          </TableBatchActions>
          <TableToolbarContent>
            <TableToolbarSearch placeholder={t('placeholder.catalogSubscription.searchSubscriptions', 'Search updates...')} />
          </TableToolbarContent>
        </TableToolbar>
        <Table>
          <TableHead>
            <TableRow>
              <TableSelectAll
                checked={selectedRows.length === updates.length && updates.length > 0}
                indeterminate={selectedRows.length > 0 && selectedRows.length < updates.length}
                onSelect={e => setSelectedRows(e.target.checked ? updates.map(u => u.id) : [])}
                id="select-all"
                name="select-all"
              />
              {updateHeaders.map(h => (
                <TableHeader key={h.key}>{h.header}</TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {updates.map(update => (
              <React.Fragment key={update.id}>
                <TableRow>
                  <TableSelectRow
                    checked={selectedRows.includes(update.id)}
                    id={`select-${update.id}`}
                    name={`select-${update.id}`}
                    onSelect={() =>
                      setSelectedRows(prev =>
                        prev.includes(update.id) ? prev.filter(id => id !== update.id) : [...prev, update.id]
                      )
                    }
                  />
                  <TableCell>
                    <strong>{update.resourceName}</strong>
                  </TableCell>
                  <TableCell>
                    <Tag kind={update.resourceType === 'PlanDefinition' ? 'purple' : 'blue'} size="sm">
                      {update.resourceType}
                    </Tag>
                  </TableCell>
                  <TableCell>
                    <Tag kind={matchKind[update.matchType]} size="sm">
                      {matchLabel[update.matchType]}
                    </Tag>
                  </TableCell>
                  <TableCell>{update.subscription}</TableCell>
                  <TableCell>{update.detected}</TableCell>
                  <TableCell>
                    <Stack orientation="horizontal" gap={2}>
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={expandedRow === update.id ? ChevronUp : ChevronDown}
                        onClick={() => toggleRow(update.id)}
                      >
                        {t('button.catalogSubscription.review', 'Review')}
                      </Button>
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={TrashCan}
                        iconDescription={t('button.catalogSubscription.rejectAll', 'Reject All')}
                        hasIconOnly
                        tooltipPosition="left"
                        onClick={() => setUpdates(updates.filter(u => u.id !== update.id))}
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
                {expandedRow === update.id && (
                  <TableRow>
                    <TableCell colSpan={updateHeaders.length + 1}>
                      <FieldDiffPanel
                        update={update}
                        onApply={() => {
                          handleApply(update.id);
                          setExpandedRow(null);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

// ─── Page Root ───────────────────────────────────────────────────────────────
// Navigation: SideNavMenu under "Test Management" with two SideNavMenuItems:
//   - Subscriptions        → renders <SubscriptionsTab />
//   - Pending Updates (N)  → renders <PendingUpdatesTab />
// No tabs used — page switches via side nav sub-menu items per OpenELIS convention.

export default function CatalogSubscriptionPage() {
  const [page, setPage] = useState('subscriptions');

  const breadcrumbPages = {
    subscriptions: t('heading.catalogSubscription.subscriptionsTab', 'Subscriptions'),
    pending: t('heading.catalogSubscription.pendingUpdatesTab', 'Pending Updates'),
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Side Nav — rendered by the parent shell in production;
          shown here for mockup completeness */}
      <SideNav aria-label={t('nav.admin', 'Admin')} expanded isFixedNav style={{ width: '256px' }}>
        <SideNavItems>
          <SideNavMenu title={t('nav.testManagement', 'Test Management')} defaultExpanded>
            <SideNavMenuItem href="#">{t('nav.testCatalog', 'Test Catalog')}</SideNavMenuItem>
            <SideNavMenuItem href="#">{t('nav.panels', 'Panels')}</SideNavMenuItem>
            <SideNavMenuItem href="#">{t('nav.referenceRanges', 'Reference Ranges')}</SideNavMenuItem>

            {/* Catalog Subscriptions — nested sub-menu */}
            <SideNavMenu title={t('heading.catalogSubscription.pageTitle', 'Catalog Subscriptions')} defaultExpanded>
              <SideNavMenuItem
                isActive={page === 'subscriptions'}
                onClick={() => setPage('subscriptions')}
              >
                {t('heading.catalogSubscription.subscriptionsTab', 'Subscriptions')}
              </SideNavMenuItem>
              <SideNavMenuItem
                isActive={page === 'pending'}
                onClick={() => setPage('pending')}
              >
                {t('heading.catalogSubscription.pendingUpdatesTab', 'Pending Updates')}
                {pendingCount > 0 && (
                  <Tag kind="red" size="sm" style={{ marginLeft: '0.5rem' }}>
                    {pendingCount}
                  </Tag>
                )}
              </SideNavMenuItem>
            </SideNavMenu>
          </SideNavMenu>
        </SideNavItems>
      </SideNav>

      {/* Main content */}
      <div style={{ flex: 1, padding: '2rem', background: '#f4f4f4' }}>
        <Breadcrumb style={{ marginBottom: '1rem' }}>
          <BreadcrumbItem href="#">{t('nav.admin', 'Admin')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('nav.testManagement', 'Test Management')}</BreadcrumbItem>
          <BreadcrumbItem href="#" onClick={() => setPage('subscriptions')}>
            {t('heading.catalogSubscription.pageTitle', 'Catalog Subscriptions')}
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            {breadcrumbPages[page]}
          </BreadcrumbItem>
        </Breadcrumb>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 400, marginBottom: '1.5rem' }}>
          {breadcrumbPages[page]}
        </h1>

        {page === 'subscriptions' && <SubscriptionsTab />}
        {page === 'pending' && <PendingUpdatesTab />}
      </div>
    </div>
  );
}
