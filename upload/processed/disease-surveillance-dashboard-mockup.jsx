import React, { useState } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell,
  TextInput, Select, SelectItem, NumberInput, Toggle,
  Button, InlineNotification, Tag, Tile,
  Breadcrumb, BreadcrumbItem,
  Accordion, AccordionItem,
} from '@carbon/react';
import { Checkmark, Warning, Launch, Renew, Save, Connect } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ── Sample Data ──────────────────────────────────────────────────────────────
const RESOURCE_STATUS = [
  { type: 'DiagnosticReport', enabled: true, lastPublished: '2026-03-23 08:14', count24h: 1842, errors24h: 3 },
  { type: 'Observation',       enabled: true, lastPublished: '2026-03-23 08:14', count24h: 3688, errors24h: 3 },
  { type: 'ServiceRequest',    enabled: true, lastPublished: '2026-03-23 08:14', count24h: 1842, errors24h: 0 },
  { type: 'Device',            enabled: true, lastPublished: '2026-03-22 17:00', count24h: 0,    errors24h: 0 },
  { type: 'Organization',      enabled: true, lastPublished: '2026-03-20 09:30', count24h: 0,    errors24h: 0 },
];

const resourceHeaders = [
  { key: 'type',          header: t('label.fhirPublication.resourceType', 'Resource Type') },
  { key: 'enabled',       header: t('label.fhirPublication.enabled', 'Publish') },
  { key: 'lastPublished', header: t('label.fhirPublication.lastPublished', 'Last Published') },
  { key: 'count24h',      header: t('label.fhirPublication.last24hCount', 'Records (24h)') },
  { key: 'errors24h',     header: t('label.fhirPublication.last24hErrors', 'Errors (24h)') },
];

export default function FhirPublicationSettings() {
  const [authType, setAuthType]     = useState('BEARER_TOKEN');
  const [pubMode, setPubMode]       = useState('SYNCHRONOUS');
  const [connStatus, setConnStatus] = useState(null); // null | 'success' | 'error'
  const [saveStatus, setSaveStatus] = useState(null);
  const [resourceToggles, setResourceToggles] = useState(
    Object.fromEntries(RESOURCE_STATUS.map(r => [r.type, r.enabled]))
  );

  const toggleResource = (type) =>
    setResourceToggles(prev => ({ ...prev, [type]: !prev[type] }));

  const handleTestConnection = () => setConnStatus('success');
  const handleSave = () => { setSaveStatus('success'); setTimeout(() => setSaveStatus(null), 3000); };

  return (
    <Grid style={{ padding: '1.5rem' }}>
      {/* Breadcrumb */}
      <Column lg={16}>
        <Breadcrumb>
          <BreadcrumbItem href="#">{t('nav.admin', 'Admin')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('nav.integration', 'Integration')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('heading.fhirPublication.title', 'FHIR Publication Settings')}</BreadcrumbItem>
        </Breadcrumb>
      </Column>

      {/* Page Title */}
      <Column lg={16} style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#161616' }}>
          {t('heading.fhirPublication.title', 'FHIR Publication Settings')}
        </h2>
        <p style={{ color: '#525252', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          {t('label.fhirPublication.subtitle',
            'Configure how OpenELIS publishes lab results to the central FHIR repository for disease surveillance and Superset dashboards.')}
        </p>
      </Column>

      {/* Save notification */}
      {saveStatus === 'success' && (
        <Column lg={16} style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind="success"
            title={t('message.fhirPublication.saveSuccess', 'Settings saved.')}
            subtitle={t('message.fhirPublication.saveSuccessDetail', 'FHIR publication configuration updated successfully.')}
            hideCloseButton={false}
            onCloseButtonClick={() => setSaveStatus(null)}
          />
        </Column>
      )}

      {/* ── Section 1: FHIR Connection ──────────────────────────────────── */}
      <Column lg={16} style={{ marginTop: '1.5rem' }}>
        <Tile style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            {t('heading.fhirPublication.connection', 'FHIR Repository Connection')}
          </h4>
          <Grid narrow>
            <Column lg={10} md={6} sm={4}>
              <TextInput
                id="fhir-endpoint"
                labelText={t('label.fhirPublication.endpointUrl', 'FHIR Repository URL')}
                placeholder="https://fhir.your-program.org/fhir/R4"
                helperText={t('label.fhirPublication.endpointUrlHelp', 'The base URL of your central FHIR R4 server.')}
              />
            </Column>
            <Column lg={6} md={2} sm={4}>
              <Select
                id="auth-type"
                labelText={t('label.fhirPublication.authType', 'Authentication Type')}
                value={authType}
                onChange={e => setAuthType(e.target.value)}
              >
                <SelectItem value="NONE"         text={t('label.fhirPublication.authType.none', 'None')} />
                <SelectItem value="BEARER_TOKEN" text={t('label.fhirPublication.authType.bearer', 'Bearer Token')} />
                <SelectItem value="BASIC"        text={t('label.fhirPublication.authType.basic', 'Basic Auth')} />
              </Select>
            </Column>

            {authType !== 'NONE' && (
              <Column lg={10} md={6} sm={4} style={{ marginTop: '1rem' }}>
                <TextInput
                  id="fhir-credential"
                  labelText={t('label.fhirPublication.credential',
                    authType === 'BASIC' ? 'Username : Password' : 'Bearer Token')}
                  type="password"
                  placeholder="••••••••"
                  helperText={t('label.fhirPublication.credentialHelp', 'Stored encrypted at rest. Not shown after saving.')}
                />
              </Column>
            )}

            <Column lg={16} style={{ marginTop: '1.25rem' }}>
              <Stack orientation="horizontal" gap={3}>
                <Button
                  kind="secondary"
                  size="md"
                  renderIcon={Connect}
                  onClick={handleTestConnection}
                >
                  {t('button.fhirPublication.testConnection', 'Test Connection')}
                </Button>
              </Stack>
            </Column>

            {connStatus === 'success' && (
              <Column lg={16} style={{ marginTop: '0.75rem' }}>
                <InlineNotification
                  kind="success"
                  title={t('message.fhirPublication.connectionSuccess', 'Connection successful.')}
                  subtitle="FHIR R4 CapabilityStatement received. Endpoint is reachable."
                  hideCloseButton
                />
              </Column>
            )}
            {connStatus === 'error' && (
              <Column lg={16} style={{ marginTop: '0.75rem' }}>
                <InlineNotification
                  kind="error"
                  title={t('error.fhirPublication.connectionFailed', 'Connection failed: 401 — Unauthorized')}
                  subtitle="Check your authentication credentials and try again."
                  hideCloseButton
                />
              </Column>
            )}
          </Grid>
        </Tile>
      </Column>

      {/* ── Section 2: Publication Mode ────────────────────────────────── */}
      <Column lg={16} style={{ marginTop: '1.25rem' }}>
        <Tile style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            {t('heading.fhirPublication.mode', 'Publication Mode')}
          </h4>
          <Grid narrow>
            <Column lg={6} md={4} sm={4}>
              <Select
                id="pub-mode"
                labelText={t('label.fhirPublication.publicationMode', 'Publication Mode')}
                value={pubMode}
                onChange={e => setPubMode(e.target.value)}
              >
                <SelectItem value="SYNCHRONOUS"  text={t('label.fhirPublication.publicationMode.sync', 'Synchronous (on result validation)')} />
                <SelectItem value="ASYNC_BATCH"  text={t('label.fhirPublication.publicationMode.batch', 'Batch (scheduled interval)')} />
              </Select>
            </Column>
            {pubMode === 'ASYNC_BATCH' && (
              <Column lg={4} md={2} sm={4}>
                <NumberInput
                  id="batch-interval"
                  label={t('label.fhirPublication.batchInterval', 'Batch Interval (minutes)')}
                  min={1} max={1440} value={15}
                  helperText={t('label.fhirPublication.batchIntervalHelp', '1–1440 minutes')}
                />
              </Column>
            )}
          </Grid>
          {/* Advanced: Retry Policy */}
          <Accordion style={{ marginTop: '1rem' }}>
            <AccordionItem title={t('heading.fhirPublication.retryPolicy', 'Advanced: Retry Policy')}>
              <Grid narrow>
                <Column lg={4} md={2} sm={4}>
                  <NumberInput id="retry-count" label={t('label.fhirPublication.retryCount', 'Retry Attempts')} min={0} max={10} value={3} />
                </Column>
                <Column lg={4} md={2} sm={4}>
                  <NumberInput id="retry-interval" label={t('label.fhirPublication.retryInterval', 'Retry Interval (minutes)')} min={1} max={60} value={5} />
                </Column>
              </Grid>
            </AccordionItem>
          </Accordion>
        </Tile>
      </Column>

      {/* ── Section 3: Resource Toggles + Status ──────────────────────── */}
      <Column lg={16} style={{ marginTop: '1.25rem' }}>
        <Tile style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            {t('heading.fhirPublication.resources', 'Resource Publication Status')}
          </h4>
          <DataTable rows={RESOURCE_STATUS.map(r => ({ ...r, id: r.type }))} headers={resourceHeaders}>
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
              <TableContainer>
                <Table {...getTableProps()} size="md">
                  <TableHead>
                    <TableRow>
                      {headers.map(h => (
                        <TableHeader {...getHeaderProps({ header: h })} key={h.key}>
                          {h.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {RESOURCE_STATUS.map(row => (
                      <TableRow key={row.type}>
                        <TableCell>
                          <strong>{row.type}</strong>
                        </TableCell>
                        <TableCell>
                          <Toggle
                            id={`toggle-${row.type}`}
                            size="sm"
                            toggled={resourceToggles[row.type]}
                            onToggle={() => toggleResource(row.type)}
                            labelA={t('label.off', 'Off')}
                            labelB={t('label.on', 'On')}
                            hideLabel
                          />
                        </TableCell>
                        <TableCell>{row.lastPublished}</TableCell>
                        <TableCell>{row.count24h.toLocaleString()}</TableCell>
                        <TableCell>
                          {row.errors24h > 0
                            ? <Tag type="red" renderIcon={Warning}>{row.errors24h} {t('label.fhirPublication.errors', 'errors')}</Tag>
                            : <Tag type="green" renderIcon={Checkmark}>{t('label.fhirPublication.noErrors', 'OK')}</Tag>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>

          <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
            <Button kind="ghost" size="sm" renderIcon={Renew}>
              {t('button.fhirPublication.publishNow', 'Publish Now')}
            </Button>
          </Stack>
        </Tile>
      </Column>

      {/* ── Section 4: Dashboard Links ─────────────────────────────────── */}
      <Column lg={16} style={{ marginTop: '1.25rem' }}>
        <Tile style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {t('heading.fhirPublication.dashboardLinks', 'Dashboard Links')}
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1rem' }}>
            {t('label.fhirPublication.dashboardLinksHelp',
              'The Superset URL will appear as a "Dashboards" entry in the OpenELIS navigation for users with the dashboard.navigate permission.')}
          </p>
          <Grid narrow>
            <Column lg={10} md={6} sm={4}>
              <TextInput
                id="superset-url"
                labelText={t('label.fhirPublication.supersetUrl', 'Superset Dashboard URL')}
                placeholder="https://superset.your-program.org"
                helperText={t('label.fhirPublication.supersetUrlHelp', 'Opens in a new tab from the OpenELIS navigation menu.')}
              />
            </Column>
            <Column lg={10} md={6} sm={4} style={{ marginTop: '1rem' }}>
              <TextInput
                id="dhis2-url"
                labelText={t('label.fhirPublication.dhis2Url', 'DHIS2 FHIR Push URL')}
                placeholder="https://dhis2.ministry.gov/api/fhir/R4"
                helperText={t('label.fhirPublication.dhis2UrlHelp', 'External DHIS2 instance operated by the ministry. Receives FHIR bundle on each batch run.')}
              />
            </Column>
          </Grid>
        </Tile>
      </Column>

      {/* ── Save Bar ──────────────────────────────────────────────────── */}
      <Column lg={16} style={{ marginTop: '1.5rem', paddingBottom: '2rem' }}>
        <Stack orientation="horizontal" gap={3}>
          <Button kind="primary" size="md" renderIcon={Save} onClick={handleSave}>
            {t('button.fhirPublication.save', 'Save Settings')}
          </Button>
          <Button kind="ghost" size="md">
            {t('button.cancel', 'Cancel')}
          </Button>
        </Stack>
      </Column>

      {/* ── Navigation Preview Note ───────────────────────────────────── */}
      <Column lg={16} style={{ marginBottom: '2rem' }}>
        <InlineNotification
          kind="info"
          title={t('label.fhirPublication.navPreviewTitle', 'Dashboards nav entry')}
          subtitle={t('label.fhirPublication.navPreviewDetail',
            'Once a Superset URL is saved, a "Dashboards" item appears under Reports in the OpenELIS side navigation for users with the dashboard.navigate permission. It opens Superset in a new browser tab.')}
          hideCloseButton
        />
      </Column>
    </Grid>
  );
}
