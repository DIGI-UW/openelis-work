import React, { useState, useCallback } from 'react';
import {
  Grid, Column, Stack,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, PasswordInput, NumberInput, TextArea, Select, SelectItem, Toggle,
  Button, InlineNotification, Tag, Accordion, AccordionItem, Tile,
  Breadcrumb, BreadcrumbItem, Header, HeaderName, Content,
} from '@carbon/react';
import {
  Add, Save, Renew, TrashCan, ChevronDown, ChevronUp, Warning, Checkmark,
  Close, Email,
} from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ─── Sample data ─────────────────────────────────────────────────────────────

const TRIGGER_CONDITIONS = [
  { id: 'DISABLED', label: t('label.smsTrigger.disabled', 'Disabled') },
  { id: 'POSITIVE_ONLY', label: t('label.smsTrigger.positiveOnly', 'Positive results only') },
  { id: 'ALL_RESULTS', label: t('label.smsTrigger.allResults', 'All results') },
  { id: 'NEGATIVE_ONLY', label: t('label.smsTrigger.negativeOnly', 'Negative results only') },
  { id: 'CRITICAL_ONLY', label: t('label.smsTrigger.criticalOnly', 'Critical results only') },
];

const TRIGGER_TAG_MAP = {
  DISABLED: 'gray',
  POSITIVE_ONLY: 'green',
  ALL_RESULTS: 'blue',
  NEGATIVE_ONLY: 'warm-gray',
  CRITICAL_ONLY: 'red',
};

const INITIAL_TRIGGERS = [
  { id: '1', testType: 'GeneXpert MTB/RIF', triggerCondition: 'POSITIVE_ONLY' },
  { id: '2', testType: 'GeneXpert MTB/RIF Ultra', triggerCondition: 'POSITIVE_ONLY' },
  { id: '3', testType: 'HIV-1/2 Rapid Test', triggerCondition: 'ALL_RESULTS' },
  { id: '4', testType: 'CD4 Count', triggerCondition: 'DISABLED' },
  { id: '5', testType: 'Viral Load (HIV)', triggerCondition: 'CRITICAL_ONLY' },
  { id: '6', testType: 'Sputum AFB Smear', triggerCondition: 'DISABLED' },
];

const DELIVERY_LOG = [
  { id: 'L001', accession: 'PNG-2026-004521', testType: 'GeneXpert MTB/RIF', provider: 'Dr. James Ovia', phone: '+675 •••• ••47', result: 'MTB DETECTED', status: 'DELIVERED', attempts: 1, lastAttempt: '2026-03-23 08:14' },
  { id: 'L002', accession: 'PNG-2026-004488', testType: 'HIV-1/2 Rapid Test', provider: 'Dr. Sarah Maino', phone: '+675 •••• ••91', result: 'REACTIVE', status: 'DELIVERED', attempts: 1, lastAttempt: '2026-03-23 07:52' },
  { id: 'L003', accession: 'PNG-2026-004412', testType: 'GeneXpert MTB/RIF Ultra', provider: 'Dr. Peter Kila', phone: '+675 •••• ••33', result: 'MTB DETECTED', status: 'FAILED_PERMANENT', attempts: 3, lastAttempt: '2026-03-23 06:30' },
  { id: 'L004', accession: 'PNG-2026-004399', testType: 'HIV-1/2 Rapid Test', provider: 'Nurse Agnes Toa', phone: '—', result: 'NON-REACTIVE', status: 'SKIPPED_NO_PHONE', attempts: 0, lastAttempt: '—' },
  { id: 'L005', accession: 'PNG-2026-004380', testType: 'GeneXpert MTB/RIF', provider: 'Dr. Maria Undo', phone: '+675 •••• ••62', result: 'MTB DETECTED', status: 'RETRYING', attempts: 2, lastAttempt: '2026-03-23 05:00' },
  { id: 'L006', accession: 'PNG-2026-004355', testType: 'Viral Load (HIV)', provider: 'Dr. Ben Kopi', phone: '+675 •••• ••18', result: 'CRITICAL (>1,000,000)', status: 'DELIVERED', attempts: 1, lastAttempt: '2026-03-22 21:40' },
];

const STATUS_TAG_MAP = {
  DELIVERED: 'green',
  FAILED_PERMANENT: 'red',
  PENDING: 'blue',
  RETRYING: 'warm-gray',
  SKIPPED_NO_PHONE: 'gray',
};

const STATUS_LABELS = {
  DELIVERED: t('label.smsStatus.delivered', 'Delivered'),
  FAILED_PERMANENT: t('label.smsStatus.failed', 'Failed'),
  PENDING: t('label.smsStatus.pending', 'Pending'),
  RETRYING: t('label.smsStatus.retrying', 'Retrying'),
  SKIPPED_NO_PHONE: t('label.smsStatus.skipped', 'Skipped'),
};

const MERGE_FIELDS = [
  { token: '{{patient_id}}', description: 'Patient ID' },
  { token: '{{test_name}}', description: 'Test name' },
  { token: '{{result}}', description: 'Result interpretation' },
  { token: '{{facility}}', description: 'Facility name' },
  { token: '{{validated_at}}', description: 'Validation date/time' },
  { token: '{{accession_number}}', description: 'Accession number' },
];

const EXAMPLE_VALUES = {
  '{{patient_id}}': 'PNG-PAT-00192',
  '{{test_name}}': 'GeneXpert MTB/RIF',
  '{{result}}': 'MTB DETECTED. RIF: Susceptible.',
  '{{facility}}': 'Port Moresby General Hospital',
  '{{validated_at}}': '2026-03-23 08:14',
  '{{accession_number}}': 'PNG-2026-004521',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConnectionTab() {
  const [enabled, setEnabled] = useState(true);
  const [baseUrl, setBaseUrl] = useState('https://textit.com/api/v2');
  const [channelUuid, setChannelUuid] = useState('a3f9e21c-bc44-4d78-a012-9f3c00000001');
  const [testStatus, setTestStatus] = useState(null); // null | 'success' | 'error'
  const [saved, setSaved] = useState(false);

  const handleTestConnection = () => {
    // Simulate test
    setTimeout(() => setTestStatus('success'), 800);
  };

  return (
    <Stack gap={6}>
      <Tile>
        <Stack gap={5}>
          <Toggle
            id="sms-enabled"
            labelText={t('label.smsConfig.enabled', 'Enable SMS Notifications')}
            toggled={enabled}
            onToggle={setEnabled}
            labelA={t('label.off', 'Off')}
            labelB={t('label.on', 'On')}
          />

          {!enabled && (
            <InlineNotification
              kind="warning"
              title={t('message.smsConfig.disabled', 'SMS notifications are disabled.')}
              subtitle={t('message.smsConfig.disabledSubtitle', 'No SMS will be sent on result validation.')}
              lowContrast
              hideCloseButton
            />
          )}

          <Grid>
            <Column lg={8} md={6} sm={4}>
              <TextInput
                id="textit-base-url"
                labelText={t('label.smsConfig.baseUrl', 'TextIt API Base URL')}
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder={t('placeholder.smsConfig.baseUrl', 'https://textit.com/api/v2')}
              />
            </Column>
          </Grid>

          <Grid>
            <Column lg={8} md={6} sm={4}>
              <PasswordInput
                id="textit-api-token"
                labelText={t('label.smsConfig.apiToken', 'API Token')}
                placeholder={t('placeholder.smsConfig.apiToken', '••••••••••••••••••••••••••••••••••')}
                helperText={t('message.smsConfig.tokenMasked', 'API token is saved. Enter a new value to replace it.')}
              />
            </Column>
          </Grid>

          <Grid>
            <Column lg={8} md={6} sm={4}>
              <TextInput
                id="textit-channel-uuid"
                labelText={t('label.smsConfig.channelUuid', 'Channel UUID')}
                value={channelUuid}
                onChange={e => setChannelUuid(e.target.value)}
                placeholder={t('placeholder.smsConfig.channelUuid', 'e.g. 12345678-abcd-efgh-ijkl-000000000000')}
              />
            </Column>
          </Grid>

          {testStatus === 'success' && (
            <InlineNotification
              kind="success"
              title={t('message.smsConfig.connectionSuccess', 'Connection to TextIt API successful.')}
              lowContrast
              onCloseButtonClick={() => setTestStatus(null)}
            />
          )}
          {testStatus === 'error' && (
            <InlineNotification
              kind="error"
              title={t('error.smsConfig.connectionFailed', 'Could not connect to TextIt API. Check the URL and token.')}
              lowContrast
              onCloseButtonClick={() => setTestStatus(null)}
            />
          )}

          <Stack orientation="horizontal" gap={3}>
            <Button kind="secondary" renderIcon={Renew} onClick={handleTestConnection}>
              {t('button.smsConfig.testConnection', 'Test Connection')}
            </Button>
            <Button kind="primary" renderIcon={Save} onClick={() => setSaved(true)}>
              {t('button.smsConfig.save', 'Save Configuration')}
            </Button>
          </Stack>

          {saved && (
            <InlineNotification
              kind="success"
              title={t('message.smsConfig.saveSuccess', 'SMS configuration saved successfully.')}
              lowContrast
              onCloseButtonClick={() => setSaved(false)}
            />
          )}
        </Stack>
      </Tile>
    </Stack>
  );
}

function TestTriggersTab() {
  const [triggers, setTriggers] = useState(INITIAL_TRIGGERS);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editCondition, setEditCondition] = useState('');

  const toggleRow = (id, currentCondition) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
      setEditCondition(currentCondition);
    }
  };

  const saveRow = (id) => {
    setTriggers(prev =>
      prev.map(t => t.id === id ? { ...t, triggerCondition: editCondition } : t)
    );
    setExpandedRow(null);
  };

  const bulkDisable = () => {
    setTriggers(prev => prev.map(t => ({ ...t, triggerCondition: 'DISABLED' })));
  };

  const headers = [
    { key: 'testType', header: t('label.smsLog.testType', 'Test Type') },
    { key: 'triggerCondition', header: t('label.smsConfig.triggerCondition', 'SMS Trigger') },
    { key: 'actions', header: '' },
  ];

  return (
    <Stack gap={4}>
      <InlineNotification
        kind="info"
        title={t('message.smsConfig.triggersInfo', 'Configure which result interpretations trigger an SMS per test type.')}
        subtitle={t('message.smsConfig.triggersDefault', 'New test types default to Disabled.')}
        lowContrast
        hideCloseButton
      />

      <TableContainer>
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch placeholder={t('placeholder.search', 'Search test types…')} />
            <Button kind="ghost" renderIcon={TrashCan} onClick={bulkDisable} size="sm">
              {t('button.smsConfig.bulkDisable', 'Disable All')}
            </Button>
          </TableToolbarContent>
        </TableToolbar>
        <Table>
          <TableHead>
            <TableRow>
              {headers.map(h => <TableHeader key={h.key}>{h.header}</TableHeader>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {triggers.map(row => (
              <React.Fragment key={row.id}>
                <TableRow>
                  <TableCell>{row.testType}</TableCell>
                  <TableCell>
                    <Tag kind={TRIGGER_TAG_MAP[row.triggerCondition]} size="sm">
                      {TRIGGER_CONDITIONS.find(c => c.id === row.triggerCondition)?.label}
                    </Tag>
                  </TableCell>
                  <TableCell>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={expandedRow === row.id ? ChevronUp : ChevronDown}
                      onClick={() => toggleRow(row.id, row.triggerCondition)}
                    >
                      {t('button.edit', 'Edit')}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRow === row.id && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Tile style={{ padding: '1rem' }}>
                        <Grid>
                          <Column lg={6} md={4} sm={4}>
                            <Select
                              id={`trigger-condition-${row.id}`}
                              labelText={t('label.smsConfig.triggerCondition', 'SMS Trigger')}
                              value={editCondition}
                              onChange={e => setEditCondition(e.target.value)}
                            >
                              {TRIGGER_CONDITIONS.map(c => (
                                <SelectItem key={c.id} value={c.id} text={c.label} />
                              ))}
                            </Select>
                          </Column>
                        </Grid>
                        <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                          <Button kind="primary" size="sm" onClick={() => saveRow(row.id)}>
                            {t('button.save', 'Save')}
                          </Button>
                          <Button kind="ghost" size="sm" onClick={() => setExpandedRow(null)}>
                            {t('button.cancel', 'Cancel')}
                          </Button>
                        </Stack>
                      </Tile>
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

function MessageTemplateTab() {
  const DEFAULT_TEMPLATE =
    'OpenELIS Result: {{test_name}} for patient {{patient_id}} — {{result}}. ' +
    'Facility: {{facility}}. Validated: {{validated_at}}. Ref: {{accession_number}}';
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [saved, setSaved] = useState(false);

  const charCount = template.length;
  const segments = Math.ceil(charCount / 160) || 1;
  const isOverLimit = charCount > 480;
  const isWarn = charCount > 160 && !isOverLimit;

  const preview = Object.entries(EXAMPLE_VALUES).reduce(
    (msg, [token, val]) => msg.split(token).join(val),
    template
  );

  const insertField = (token) => {
    setTemplate(prev => prev + token);
  };

  return (
    <Stack gap={5}>
      <Grid>
        <Column lg={10} md={8} sm={4}>
          <TextArea
            id="sms-message-template"
            labelText={t('label.smsConfig.messageTemplate', 'Message Template')}
            value={template}
            onChange={e => setTemplate(e.target.value)}
            rows={4}
            invalid={isOverLimit}
            invalidText={t('error.smsConfig.templateTooLong', 'Message template cannot exceed 480 characters.')}
            warn={isWarn}
            warnText={t('message.smsConfig.multiSegment', 'Template exceeds 160 characters — will send as multiple SMS segments.')}
            helperText={t('label.smsConfig.characterCount', `${charCount} / 480 characters (${segments} SMS segment${segments > 1 ? 's' : ''})`)}
          />
        </Column>
      </Grid>

      <Stack gap={2}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
          {t('label.smsConfig.insertField', 'Insert Merge Field')}
        </p>
        <Stack orientation="horizontal" gap={2} style={{ flexWrap: 'wrap' }}>
          {MERGE_FIELDS.map(f => (
            <Button
              key={f.token}
              kind="tertiary"
              size="sm"
              onClick={() => insertField(f.token)}
            >
              {f.description}
            </Button>
          ))}
        </Stack>
      </Stack>

      <Tile>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('heading.smsConfig.preview', 'Preview (example values)')}
        </p>
        <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {preview || t('message.smsConfig.emptyTemplate', '(template is empty)')}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#6f6f6f', marginTop: '0.5rem' }}>
          {preview.length} {t('label.characters', 'characters')}
        </p>
      </Tile>

      <Stack orientation="horizontal" gap={3}>
        <Button
          kind="primary"
          renderIcon={Save}
          disabled={isOverLimit}
          onClick={() => setSaved(true)}
        >
          {t('button.smsConfig.save', 'Save Configuration')}
        </Button>
      </Stack>

      {saved && (
        <InlineNotification
          kind="success"
          title={t('message.smsConfig.saveSuccess', 'SMS configuration saved successfully.')}
          lowContrast
          onCloseButtonClick={() => setSaved(false)}
        />
      )}
    </Stack>
  );
}

function RetryPolicyTab() {
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryInterval, setRetryInterval] = useState(15);
  const [logRetention, setLogRetention] = useState(90);
  const [saved, setSaved] = useState(false);

  return (
    <Stack gap={5}>
      <Accordion>
        <AccordionItem title={t('heading.smsConfig.retryPolicy', 'Retry Policy')} open>
          <Stack gap={5} style={{ padding: '1rem 0' }}>
            <Grid>
              <Column lg={4} md={4} sm={4}>
                <NumberInput
                  id="max-retries"
                  label={t('label.smsConfig.maxRetries', 'Maximum Retry Attempts')}
                  value={maxRetries}
                  onChange={(e, { value }) => setMaxRetries(value)}
                  min={1}
                  max={10}
                  helperText={t('message.smsConfig.maxRetriesHelp', 'Automatic retries before marking as Failed Permanent.')}
                />
              </Column>
              <Column lg={4} md={4} sm={4}>
                <NumberInput
                  id="retry-interval"
                  label={t('label.smsConfig.retryInterval', 'Retry Interval (minutes)')}
                  value={retryInterval}
                  onChange={(e, { value }) => setRetryInterval(value)}
                  min={5}
                  max={120}
                  helperText={t('message.smsConfig.retryIntervalHelp', 'Wait time between automatic retry attempts.')}
                />
              </Column>
            </Grid>
          </Stack>
        </AccordionItem>

        <AccordionItem title={t('heading.smsConfig.logRetention', 'Log Retention')}>
          <Stack gap={5} style={{ padding: '1rem 0' }}>
            <Grid>
              <Column lg={4} md={4} sm={4}>
                <NumberInput
                  id="log-retention"
                  label={t('label.smsConfig.logRetention', 'Log Retention (days)')}
                  value={logRetention}
                  onChange={(e, { value }) => setLogRetention(value)}
                  min={30}
                  max={365}
                  helperText={t('message.smsConfig.logRetentionHelp', 'Delivered and skipped entries older than this are purged nightly. Failed entries are kept for an additional 30 days.')}
                />
              </Column>
            </Grid>
          </Stack>
        </AccordionItem>
      </Accordion>

      <Stack orientation="horizontal" gap={3}>
        <Button kind="primary" renderIcon={Save} onClick={() => setSaved(true)}>
          {t('button.smsConfig.save', 'Save Configuration')}
        </Button>
      </Stack>

      {saved && (
        <InlineNotification
          kind="success"
          title={t('message.smsConfig.saveSuccess', 'SMS configuration saved successfully.')}
          lowContrast
          onCloseButtonClick={() => setSaved(false)}
        />
      )}
    </Stack>
  );
}

function DeliveryLog() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [retried, setRetried] = useState([]);

  const filtered = statusFilter === 'ALL'
    ? DELIVERY_LOG
    : DELIVERY_LOG.filter(r => r.status === statusFilter);

  const handleRetry = (id) => {
    setRetried(prev => [...prev, id]);
  };

  const headers = [
    { key: 'accession', header: t('label.smsLog.accessionNumber', 'Accession #') },
    { key: 'testType', header: t('label.smsLog.testType', 'Test Type') },
    { key: 'provider', header: t('label.smsLog.provider', 'Provider') },
    { key: 'phone', header: t('label.smsLog.phone', 'Phone') },
    { key: 'result', header: t('label.smsLog.result', 'Result') },
    { key: 'status', header: t('label.smsLog.status', 'Status') },
    { key: 'attempts', header: t('label.smsLog.attempts', 'Attempts') },
    { key: 'lastAttempt', header: t('label.smsLog.lastAttempt', 'Last Attempt') },
    { key: 'actions', header: '' },
  ];

  return (
    <Stack gap={4}>
      <Stack orientation="horizontal" gap={3} style={{ alignItems: 'flex-end' }}>
        <Select
          id="status-filter"
          labelText={t('label.smsLog.status', 'Status')}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: '220px' }}
        >
          <SelectItem value="ALL" text={t('label.filter.all', 'All statuses')} />
          <SelectItem value="DELIVERED" text={t('label.smsStatus.delivered', 'Delivered')} />
          <SelectItem value="FAILED_PERMANENT" text={t('label.smsStatus.failed', 'Failed')} />
          <SelectItem value="RETRYING" text={t('label.smsStatus.retrying', 'Retrying')} />
          <SelectItem value="PENDING" text={t('label.smsStatus.pending', 'Pending')} />
          <SelectItem value="SKIPPED_NO_PHONE" text={t('label.smsStatus.skipped', 'Skipped (No Phone)')} />
        </Select>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {headers.map(h => <TableHeader key={h.key}>{h.header}</TableHeader>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(row => (
              <TableRow key={row.id}>
                <TableCell>{row.accession}</TableCell>
                <TableCell>{row.testType}</TableCell>
                <TableCell>{row.provider}</TableCell>
                <TableCell style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.phone}</TableCell>
                <TableCell>{row.result}</TableCell>
                <TableCell>
                  <Tag kind={STATUS_TAG_MAP[row.status]} size="sm">
                    {STATUS_LABELS[row.status]}
                  </Tag>
                </TableCell>
                <TableCell>{row.attempts}</TableCell>
                <TableCell style={{ fontSize: '0.8rem', color: '#525252' }}>{row.lastAttempt}</TableCell>
                <TableCell>
                  {row.status === 'FAILED_PERMANENT' && !retried.includes(row.id) && (
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={Renew}
                      onClick={() => handleRetry(row.id)}
                    >
                      {t('button.smsLog.retry', 'Retry')}
                    </Button>
                  )}
                  {retried.includes(row.id) && (
                    <Tag kind="blue" size="sm">{t('label.smsStatus.pending', 'Pending')}</Tag>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
// Navigation is via the OpenELIS global sidebar submenu — NOT tabs.
// Each section below is a separate route/page in the application; the SideNav
// here simulates the Administration → Notifications submenu for mockup purposes.

const SMS_NAV_ITEMS = [
  { key: 'connection', label: t('heading.smsConfig.connection', 'Connection') },
  { key: 'triggers',   label: t('heading.smsConfig.triggers',   'Test Triggers') },
  { key: 'template',   label: t('heading.smsConfig.template',   'Message Template') },
  { key: 'retry',      label: t('heading.smsConfig.retryPolicy','Retry Policy') },
  { key: 'log',        label: t('heading.smsLog.title',         'Delivery Log') },
];

const BREADCRUMB_MAP = {
  connection: ['Administration', 'Notifications', 'Connection'],
  triggers:   ['Administration', 'Notifications', 'Test Triggers'],
  template:   ['Administration', 'Notifications', 'Message Template'],
  retry:      ['Administration', 'Notifications', 'Retry Policy'],
  log:        ['Administration', 'Notifications', 'Delivery Log'],
};

export default function TextItSmsIntegration() {
  const [activePage, setActivePage] = useState('connection');
  const crumbs = BREADCRUMB_MAP[activePage] || [];

  return (
    <>
      <Header aria-label={t('nav.appName', 'OpenELIS Global')}>
        <HeaderName href="#" prefix="OpenELIS">
          {t('nav.appName', 'Global')}
        </HeaderName>
      </Header>

      <div style={{ display: 'flex', marginTop: '3rem', minHeight: 'calc(100vh - 3rem)' }}>
        {/* Left sidebar — simulates the OpenELIS global SideNav */}
        <SideNav
          isFixedNav
          expanded
          aria-label={t('nav.sideNav', 'Side navigation')}
          style={{ top: '3rem' }}
        >
          <SideNavItems>
            {/* Other top-level nav items shown collapsed for context */}
            <SideNavMenuItem href="#">{t('nav.home', 'Home')}</SideNavMenuItem>
            <SideNavMenuItem href="#">{t('nav.patient', 'Patient')}</SideNavMenuItem>
            <SideNavMenuItem href="#">{t('nav.order', 'Order')}</SideNavMenuItem>
            <SideNavMenuItem href="#">{t('nav.results', 'Results')}</SideNavMenuItem>

            {/* Administration → Notifications submenu (expanded) */}
            <SideNavMenu title={t('nav.admin', 'Administration')} defaultExpanded>
              <SideNavMenuItem href="#">{t('nav.adminGeneral', 'General Config')}</SideNavMenuItem>
              <SideNavMenuItem href="#">{t('nav.adminUsers', 'Users & Roles')}</SideNavMenuItem>
              <SideNavMenuItem href="#">{t('nav.adminCatalog', 'Test Catalog')}</SideNavMenuItem>
              <SideNavMenuItem href="#">{t('nav.adminSites', 'Sites & Labs')}</SideNavMenuItem>

              {/* Notifications sub-group */}
              <SideNavMenu title={t('nav.notifications', 'Notifications')} defaultExpanded>
                {SMS_NAV_ITEMS.map(item => (
                  <SideNavMenuItem
                    key={item.key}
                    href="#"
                    isActive={activePage === item.key}
                    onClick={e => { e.preventDefault(); setActivePage(item.key); }}
                  >
                    {item.label}
                  </SideNavMenuItem>
                ))}
              </SideNavMenu>
            </SideNavMenu>

            <SideNavMenuItem href="#">{t('nav.reports', 'Reports')}</SideNavMenuItem>
          </SideNavItems>
        </SideNav>

        {/* Main content area */}
        <Content style={{ marginLeft: '16rem', padding: '2rem', flex: 1, background: '#f4f4f4' }}>
          {/* Breadcrumb */}
          <Breadcrumb style={{ marginBottom: '1.5rem' }}>
            {crumbs.map((c, i) => (
              <BreadcrumbItem key={i} isCurrentPage={i === crumbs.length - 1} href="#">
                {c}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>

          {/* Page content — each submenu item renders its own page */}
          {activePage === 'connection' && <ConnectionTab />}
          {activePage === 'triggers'   && <TestTriggersTab />}
          {activePage === 'template'   && <MessageTemplateTab />}
          {activePage === 'retry'      && <RetryPolicyTab />}
          {activePage === 'log'        && <DeliveryLog />}
        </Content>
      </div>
    </>
  );
}
