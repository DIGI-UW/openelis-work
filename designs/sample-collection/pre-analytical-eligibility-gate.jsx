import React, { useState, useRef } from 'react';
import {
  Grid,
  Column,
  Stack,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
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
  TextInput,
  TextArea,
  Select,
  SelectItem,
  NumberInput,
  Toggle,
  Checkbox,
  RadioButton,
  RadioButtonGroup,
  Button,
  IconButton,
  InlineNotification,
  Tag,
  Modal,
  Accordion,
  AccordionItem,
  Tile,
  Breadcrumb,
  BreadcrumbItem,
  OverflowMenu,
  OverflowMenuItem,
  Link,
} from '@carbon/react';
import {
  Checkmark,
  Close,
  Warning,
  Add,
  TrashCan,
  Lock,
  ArrowRight,
  Renew,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  DocumentAdd,
} from '@carbon/icons-react';

// ─── i18n helper ────────────────────────────────────────────────────────────
const t = (key, fallback) => fallback || key;

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ORDER = {
  labNumber: 'ENV-2026-00127',
  siteCode: 'SS-041',
  siteName: 'Ciliwung River — Upstream Station 3',
  complianceStandard: 'PP 22/2021 — Surface Water',
  domain: 'Environmental',
  sampleType: 'Water — Surface',
  arrivalAt: '2026-04-16 08:14',
  collectedAt: '2026-04-15 13:30',
  transitHours: 18.7,
  sopWindowHours: 12,
  receivedBy: 'Siti Rahayu',
  shipmentId: 'SHIP-2026-00088',
  coolerId: 'COOLER-042',
};

const MOCK_CRITERIA = [
  {
    id: 'c1',
    label: t('label.eligibility.criterion.containerIntegrity', 'Container integrity intact'),
    severity: 'MAJOR',
    recoverable: true,
    autoComputed: false,
    pass: null,
    note: '',
  },
  {
    id: 'c2',
    label: t('label.eligibility.criterion.labelLegibility', 'Label legibility'),
    severity: 'MINOR',
    recoverable: true,
    autoComputed: false,
    pass: null,
    note: '',
  },
  {
    id: 'c3',
    label: t('label.eligibility.criterion.volumeSufficient', 'Sample volume sufficient'),
    severity: 'MAJOR',
    recoverable: true,
    autoComputed: true,
    pass: true,
    note: '220 mL received (min 200 mL)',
    sourceData: {
      rule: 'volume_range',
      stepLabel: t('label.source.step2', 'Step 2 — Collect Sample'),
      stepHref: '#step-2-collect',
      fields: [
        { label: t('label.source.volumeReceived', 'Volume received'), value: '220 mL', enteredBy: 'Budi Santoso', enteredAt: '2026-04-15 13:30', role: t('label.role.collector', 'Collector') },
        { label: t('label.source.volumeMinimum', 'Minimum required (SampleType config)'), value: '200 mL', enteredBy: t('label.source.systemConfig', 'System — SampleType admin'), enteredAt: null, role: null },
      ],
      computed: t('message.source.volumeResult', 'Evaluated: 220 mL ≥ 200 mL → PASS'),
    },
  },
  {
    id: 'c4',
    label: t('label.eligibility.criterion.temperatureRange', 'Temperature within range (2–8 °C)'),
    severity: 'CRITICAL',
    recoverable: true,
    autoComputed: false,
    pass: null,
    note: '',
  },
  {
    id: 'c5',
    label: t('label.eligibility.criterion.sopTransit', 'SOP transit window met'),
    severity: 'MAJOR',
    recoverable: true,
    autoComputed: true,
    pass: false,
    note: '18.7 h elapsed; SOP max 12 h',
    sourceData: {
      rule: 'transit_window',
      stepLabel: t('label.source.step2', 'Step 2 — Collect Sample'),
      stepHref: '#step-2-collect',
      fields: [
        { label: t('label.source.collectionDateTime', 'Collection date/time'), value: '2026-04-15 13:30', enteredBy: 'Budi Santoso', enteredAt: '2026-04-15 13:30', role: t('label.role.collector', 'Collector') },
        { label: t('label.source.receivedAtLab', 'Received at lab'), value: '2026-04-16 08:14', enteredBy: 'Siti Rahayu', enteredAt: '2026-04-16 08:14', role: t('label.role.qaOfficer', 'QA Officer') },
        { label: t('label.source.sopTransitWindow', 'SOP transit window (SampleType config)'), value: '12 h', enteredBy: t('label.source.systemConfig', 'System — SampleType admin'), enteredAt: null, role: null },
      ],
      computed: t('message.source.transitResult', 'Evaluated: 18.7 h elapsed > 12 h SOP window → FAIL'),
    },
  },
  {
    id: 'c6',
    label: t('label.eligibility.criterion.cocPresent', 'Chain-of-custody form present'),
    severity: 'MAJOR',
    recoverable: false,
    autoComputed: false,
    pass: null,
    note: '',
  },
];

const MOCK_WORKLIST = [
  {
    id: 'w1',
    labNumber: 'ENV-2026-00127',
    sampleType: 'Water — Surface',
    domain: 'Environmental',
    receivedAt: '08:14 (3h 12m ago)',
    transitHours: 18.7,
    sopHours: 12,
    site: 'Ciliwung River — Upstream S3',
    standard: 'PP 22/2021',
    priority: 'High',
    breach: true,
  },
  {
    id: 'w2',
    labNumber: 'ENV-2026-00128',
    sampleType: 'Sediment',
    domain: 'Environmental',
    receivedAt: '09:02 (2h 24m ago)',
    transitHours: 6.2,
    sopHours: 24,
    site: 'Ciliwung River — Downstream S7',
    standard: 'PP 22/2021',
    priority: 'Normal',
    breach: false,
  },
  {
    id: 'w3',
    labNumber: 'VEC-2026-00031',
    sampleType: 'Mosquito Pool',
    domain: 'Vector',
    receivedAt: '07:45 (3h 41m ago)',
    transitHours: 4.2,
    sopHours: 8,
    site: 'Trap site BDG-019 — collection ended 03:30',
    standard: '—',
    priority: 'Urgent',
    breach: false,
  },
  {
    id: 'w4',
    labNumber: 'CLN-2026-04892',
    sampleType: 'Whole Blood',
    domain: 'Clinical',
    receivedAt: '10:22 (1h 04m ago)',
    transitHours: 1.1,
    sopHours: 4,
    site: 'Puskesmas Kebayoran',
    standard: '—',
    priority: 'Normal',
    breach: false,
  },
  {
    id: 'w5',
    labNumber: 'ENV-2026-00124',
    sampleType: 'Water — Surface',
    domain: 'Environmental',
    receivedAt: '06:55 (4h 31m ago)',
    transitHours: 22.4,
    sopHours: 12,
    site: 'Ciliwung River — Upstream S1',
    standard: 'PP 22/2021',
    priority: 'High',
    breach: true,
  },
];

const MOCK_CRITERIA_ADMIN = [
  { id: 'ca1', label: 'Container integrity intact', severity: 'MAJOR', recoverable: true, autoRule: 'none', subcategory: 'Specimen Integrity' },
  { id: 'ca2', label: 'Label legibility', severity: 'MINOR', recoverable: true, autoRule: 'none', subcategory: 'Labeling' },
  { id: 'ca3', label: 'Sample volume sufficient', severity: 'MAJOR', recoverable: true, autoRule: 'volume_range', subcategory: 'Volume' },
  { id: 'ca4', label: 'Temperature within range', severity: 'CRITICAL', recoverable: true, autoRule: 'temperature_range', subcategory: 'Cold Chain' },
  { id: 'ca5', label: 'SOP transit window met', severity: 'MAJOR', recoverable: true, autoRule: 'transit_window', subcategory: 'Transport' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const severityTag = (sev) => {
  const map = { CRITICAL: 'red', MAJOR: 'orange', MINOR: 'warm-gray' };
  const label = { CRITICAL: 'Critical', MAJOR: 'Major', MINOR: 'Minor' };
  return <Tag kind={map[sev] || 'gray'} size="sm">{label[sev] || sev}</Tag>;
};

const domainTag = (domain) => {
  const map = { Environmental: 'green', Vector: 'teal', Clinical: 'blue' };
  return <Tag kind={map[domain] || 'gray'} size="sm">{domain}</Tag>;
};

// ─── Source Provenance Block ─────────────────────────────────────────────────
// Shown when the officer clicks "View source" on an auto-evaluated criterion.
// Displays the contributing fields, who entered them, and links back to the
// originating step so the officer can verify the raw data without navigating away.
function SourceProvenanceBlock({ sourceData, pass }) {
  return (
    <div style={{
      marginTop: 'var(--cds-spacing-03)',
      padding: 'var(--cds-spacing-04)',
      background: pass === false ? '#fff8f7' : '#f4f4f4',
      border: `1px solid ${pass === false ? '#ffb3b8' : '#c6c6c6'}`,
      borderLeft: `3px solid ${pass === false ? 'var(--cds-support-error)' : 'var(--cds-interactive-01)'}`,
      borderRadius: 2,
    }}>
      <p style={{ margin: '0 0 var(--cds-spacing-03)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {t('heading.source.title', 'Source data — auto-evaluated')}
      </p>
      <Stack gap={3}>
        {sourceData.fields.map((field, i) => (
          <Grid key={i} condensed style={{ gap: 0 }}>
            <Column lg={4} style={{ marginBottom: 0 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{field.label}</p>
            </Column>
            <Column lg={6}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{field.value}</p>
              {field.enteredBy && (
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  {t('label.source.enteredBy', 'Entered by')} {field.enteredBy}
                  {field.role && ` (${field.role})`}
                  {field.enteredAt && ` · ${field.enteredAt}`}
                </p>
              )}
              {!field.enteredBy && (
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{field.enteredBy || t('label.source.systemConfig', 'System — SampleType admin')}</p>
              )}
            </Column>
          </Grid>
        ))}
      </Stack>
      <div style={{
        marginTop: 'var(--cds-spacing-03)',
        paddingTop: 'var(--cds-spacing-03)',
        borderTop: '1px solid #c6c6c6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--cds-spacing-03)',
      }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', fontFamily: 'IBM Plex Mono, monospace', color: pass === false ? 'var(--cds-support-error)' : 'var(--cds-support-success)' }}>
          {sourceData.computed}
        </p>
        <Link href={sourceData.stepHref} size="sm">
          {t('button.source.goToStep', 'Go to')} {sourceData.stepLabel} →
        </Link>
      </div>
    </div>
  );
}

// ─── SCREEN 1: Step 4 — Eligibility Assessment ───────────────────────────────
function Screen1EligibilityAssessment() {
  const [criteria, setCriteria] = useState(MOCK_CRITERIA);
  const [nceOpen, setNceOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [sampleAction, setSampleAction] = useState('resample');
  const [submitted, setSubmitted] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const toggleSource = (id) => setExpandedSources(prev => ({ ...prev, [id]: !prev[id] }));

  const allChecked = criteria.every(c => c.pass !== null);
  const anyFail = criteria.some(c => c.pass === false);
  const canAccept = allChecked && !anyFail;
  const transitBreach = MOCK_ORDER.transitHours > MOCK_ORDER.sopWindowHours;

  const failingCriteria = criteria.filter(c => c.pass === false);
  const allFailsRecoverable = failingCriteria.length > 0 && failingCriteria.every(c => c.recoverable);

  const toggleCriterion = (id, pass) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, pass } : c));
  };
  const updateNote = (id, note) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, note } : c));
  };

  const handleAccept = () => {
    if (anyFail) { setOverrideOpen(true); return; }
    if (!canAccept) return;
    setSuccessToast({ kind: 'success', text: `Sample ${MOCK_ORDER.labNumber} accepted. Status: Eligible.` });
  };

  const handleOverrideConfirm = () => {
    if (overrideJustification.trim().length < 10) return;
    setOverrideOpen(false);
    setSuccessToast({ kind: 'warning', text: `Sample ${MOCK_ORDER.labNumber} accepted with override. Status: Eligible. Override recorded.` });
  };

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        <BreadcrumbItem href="#"><span>{t('nav.sampleCollection', 'Sample Collection')}</span></BreadcrumbItem>
        <BreadcrumbItem href="#"><span>{t('nav.addOrder', 'Add Order')}</span></BreadcrumbItem>
        <BreadcrumbItem isCurrentPage><span>{t('nav.qaReview', 'QA Review — Step 4')}</span></BreadcrumbItem>
      </Breadcrumb>

      {/* Page header */}
      <Stack gap={3} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          {t('heading.step4', 'QA Review — Step 4')}
        </h2>
        <div style={{ display: 'flex', gap: 'var(--cds-spacing-04)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag kind="blue" size="md">{MOCK_ORDER.labNumber}</Tag>
          <Tag kind="green" size="sm">{MOCK_ORDER.domain}</Tag>
          <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            {MOCK_ORDER.siteCode} — {MOCK_ORDER.siteName}
          </span>
          <Tag kind="purple" size="sm">{t('status.pendingQA', 'Pending QA')}</Tag>
        </div>
      </Stack>

      {/* Success / error toast */}
      {successToast && (
        <InlineNotification
          kind={successToast.kind}
          title={successToast.text}
          style={{ marginBottom: 'var(--cds-spacing-05)' }}
          onClose={() => setSuccessToast(null)}
        />
      )}

      <Grid>
        {/* ── QA-1: Completeness Dashboard ── */}
        <Column lg={16} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
          <Tile style={{ padding: 'var(--cds-spacing-05)' }}>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--cds-spacing-04)' }}>
              {t('heading.completeness', 'Completeness Dashboard')}
            </h4>
            <div style={{ display: 'flex', gap: 'var(--cds-spacing-06)', flexWrap: 'wrap' }}>
              {[
                { step: t('label.step1', 'Step 1 — Order Entry'), status: 'complete', icon: <Checkmark size={16} /> },
                { step: t('label.step2', 'Step 2 — Collect Sample'), status: 'complete', icon: <Checkmark size={16} /> },
                { step: t('label.step3', 'Step 3 — Label & Store'), status: 'complete', icon: <Checkmark size={16} /> },
                { step: t('label.step4', 'Step 4 — QA Review'), status: 'current', icon: null },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-02)' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: s.status === 'complete' ? 'var(--cds-support-success)' : 'var(--cds-brand-01)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {s.status === 'complete' ? <Checkmark size={14} /> : '4'}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: s.status === 'current' ? 600 : 400 }}>{s.step}</span>
                </div>
              ))}
              {/* Eligibility indicator in dashboard */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  {t('label.eligibility.indicatorLabel', 'Eligibility:')}
                </span>
                {transitBreach
                  ? <Tag kind="red" size="sm"><Warning size={12} /> {t('label.eligibility.sopBreachShort', 'SOP Breach')}</Tag>
                  : <Tag kind="gray" size="sm">{t('label.eligibility.notAssessed', 'Not yet assessed')}</Tag>
                }
              </div>
            </div>
          </Tile>
        </Column>

        {/* ── Eligibility Assessment Section ── */}
        <Column lg={16} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
          <Tile style={{
            padding: 'var(--cds-spacing-05)',
            borderLeft: '4px solid var(--cds-interactive-01)',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--cds-spacing-05)', color: 'var(--cds-interactive-01)' }}>
              {t('heading.eligibility.assessment', 'Eligibility Assessment')}
            </h3>

            {/* ── 1. Arrival & Transit Context ── */}
            <div style={{ marginBottom: 'var(--cds-spacing-05)' }}>
              <h5 style={{ margin: '0 0 var(--cds-spacing-03)' }}>
                {t('heading.eligibility.arrivalContext', 'Arrival & Transit')}
              </h5>

              {transitBreach && (
                <InlineNotification
                  kind="warning"
                  title={t('label.eligibility.sopBreach', 'SOP transit window exceeded')}
                  subtitle={`${MOCK_ORDER.transitHours} h elapsed — SOP max: ${MOCK_ORDER.sopWindowHours} h`}
                  lowContrast
                  style={{ marginBottom: 'var(--cds-spacing-04)' }}
                />
              )}

              <Grid condensed style={{ gap: 0 }}>
                {[
                  { label: t('label.eligibility.arrivalAt', 'Received at lab'), value: MOCK_ORDER.arrivalAt },
                  { label: t('label.eligibility.transitDuration', 'Time in transit'), value: `${MOCK_ORDER.transitHours} h` },
                  { label: t('label.eligibility.receivedBy', 'Received by'), value: MOCK_ORDER.receivedBy },
                  { label: t('label.eligibility.sopWindow', 'SOP window'), value: `${MOCK_ORDER.sopWindowHours} h` },
                  { label: t('label.eligibility.shipmentId', 'Shipment ID'), value: MOCK_ORDER.shipmentId },
                  { label: t('label.eligibility.coolerId', 'Cooler / Container ID'), value: MOCK_ORDER.coolerId },
                ].map((f, i) => (
                  <Column key={i} lg={4} md={4} sm={4} style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{f.label}</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{f.value}</p>
                  </Column>
                ))}
              </Grid>
            </div>

            {/* ── 2. Criteria Checklist ── */}
            <div style={{ marginBottom: 'var(--cds-spacing-05)' }}>
              <h5 style={{ margin: '0 0 var(--cds-spacing-03)' }}>
                {t('heading.eligibility.criteria', 'Acceptance Criteria')}
              </h5>
              <Stack gap={4}>
                {criteria.map(c => (
                  <Tile key={c.id} style={{
                    padding: 'var(--cds-spacing-04)',
                    background: c.pass === false ? 'var(--cds-support-error-inverse)' : c.pass === true ? 'var(--cds-support-success-inverse)' : 'var(--cds-layer-01)',
                    border: c.pass === false ? '1px solid var(--cds-support-error)' : '1px solid var(--cds-layer-accent-01)',
                  }}>
                    <Grid condensed>
                      <Column lg={8} md={5} sm={4}>
                        <Stack gap={2}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.label}</span>
                            {severityTag(c.severity)}
                            {c.autoComputed && (
                              <>
                                <Tag kind="gray" size="sm" renderIcon={Lock}>
                                  {t('label.eligibility.criterionAutoComputed', 'Auto-evaluated')}
                                </Tag>
                                {c.sourceData && (
                                  <Button
                                    kind="ghost"
                                    size="sm"
                                    onClick={() => toggleSource(c.id)}
                                    renderIcon={expandedSources[c.id] ? ChevronUp : ChevronDown}
                                  >
                                    {expandedSources[c.id]
                                      ? t('button.source.hide', 'Hide source')
                                      : t('button.source.view', 'View source')}
                                  </Button>
                                )}
                              </>
                            )}
                            {!c.recoverable && (
                              <Tag kind="cool-gray" size="sm">
                                {t('label.eligibility.notRecoverable', 'No resample')}
                              </Tag>
                            )}
                          </div>
                          {c.note && <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{c.note}</span>}
                        </Stack>
                      </Column>
                      <Column lg={4} md={3} sm={4}>
                        {c.autoComputed ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-02)', paddingTop: 'var(--cds-spacing-02)' }}>
                            {c.pass
                              ? <Tag kind="green"><Checkmark size={12} /> {t('label.eligibility.criterionPass', 'Pass')}</Tag>
                              : <Tag kind="red"><Close size={12} /> {t('label.eligibility.criterionFail', 'Fail')}</Tag>
                            }
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 'var(--cds-spacing-03)', paddingTop: 'var(--cds-spacing-02)' }}>
                            <Button
                              kind={c.pass === true ? 'primary' : 'tertiary'}
                              size="sm"
                              onClick={() => toggleCriterion(c.id, true)}
                              renderIcon={Checkmark}
                            >
                              {t('label.eligibility.criterionPass', 'Pass')}
                            </Button>
                            <Button
                              kind={c.pass === false ? 'danger' : 'tertiary'}
                              size="sm"
                              onClick={() => toggleCriterion(c.id, false)}
                              renderIcon={Close}
                            >
                              {t('label.eligibility.criterionFail', 'Fail')}
                            </Button>
                          </div>
                        )}
                      </Column>
                      <Column lg={4} md={8} sm={4} style={{ marginTop: 'var(--cds-spacing-03)' }}>
                        <TextInput
                          id={`note-${c.id}`}
                          labelText=""
                          size="sm"
                          placeholder={t('label.eligibility.notesPlaceholder', 'Optional — note any observed condition')}
                          value={c.note || ''}
                          onChange={e => updateNote(c.id, e.target.value)}
                          disabled={c.autoComputed}
                        />
                      </Column>
                    </Grid>
                    {c.autoComputed && c.sourceData && expandedSources[c.id] && (
                      <SourceProvenanceBlock sourceData={c.sourceData} pass={c.pass} />
                    )}
                  </Tile>
                ))}
              </Stack>
            </div>

            {/* ── 3. Compliance Context ── */}
            <div style={{ marginBottom: 'var(--cds-spacing-05)' }}>
              <h5 style={{ margin: '0 0 var(--cds-spacing-03)' }}>
                {t('heading.eligibility.complianceContext', 'Compliance Context')}
              </h5>
              <div style={{ display: 'flex', gap: 'var(--cds-spacing-03)', flexWrap: 'wrap' }}>
                <Tag kind="green" size="md">{MOCK_ORDER.complianceStandard}</Tag>
                <Tag kind="cyan" size="md">{MOCK_ORDER.siteCode} — {MOCK_ORDER.siteName}</Tag>
                <Tag kind="teal" size="md">{MOCK_ORDER.sampleType}</Tag>
                {domainTag(MOCK_ORDER.domain)}
              </div>
            </div>

            {/* ── Action Bar ── */}
            <div style={{
              display: 'flex', gap: 'var(--cds-spacing-04)', flexWrap: 'wrap',
              paddingTop: 'var(--cds-spacing-05)',
              borderTop: '1px solid var(--cds-layer-accent-01)',
            }}>
              <Button
                kind="primary"
                disabled={!allChecked}
                onClick={handleAccept}
                renderIcon={Checkmark}
                title={!allChecked ? t('button.eligibility.accept.disabled', 'All criteria must be marked pass before accepting') : ''}
              >
                {t('button.eligibility.accept', 'Accept')}
              </Button>
              <Button
                kind="tertiary"
                onClick={() => setNceOpen(!nceOpen)}
                style={{ borderColor: '#e65100', color: '#e65100' }}
                renderIcon={DocumentAdd}
              >
                {t('button.eligibility.reportNce', 'Report NCE')}
              </Button>
              <Button kind="ghost">
                {t('button.eligibility.returnToStep', 'Return to Step…')}
              </Button>
            </div>

            {!allChecked && (
              <p style={{ margin: 'var(--cds-spacing-03) 0 0', fontSize: '0.75rem', color: 'var(--cds-text-error)' }}>
                {t('error.eligibility.criteriaIncomplete', 'All criteria must be marked pass or fail before accepting.')}
              </p>
            )}
          </Tile>
        </Column>

        {/* ── QA-2: Sample Review Table ── */}
        <Column lg={16} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
          <DataTable
            rows={[
              { id: 's1', labNumber: MOCK_ORDER.labNumber, sampleType: MOCK_ORDER.sampleType, volume: '220 mL', collectedAt: '2026-04-15 13:30', collector: 'Budi Santoso', eligibility: anyFail ? 'fail' : allChecked ? 'pass' : 'pending' },
            ]}
            headers={[
              { key: 'labNumber', header: t('header.labNumber', 'Lab Number') },
              { key: 'sampleType', header: t('header.sampleType', 'Sample Type') },
              { key: 'volume', header: t('header.volume', 'Volume') },
              { key: 'collectedAt', header: t('header.collectedAt', 'Collected At') },
              { key: 'collector', header: t('header.collector', 'Collector') },
              { key: 'eligibility', header: t('header.eligibility', 'Eligibility') },
            ]}
          >
            {({ rows, headers, getHeaderProps, getTableProps }) => (
              <TableContainer title={t('heading.sampleReview', 'Sample Review')}>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(row => (
                      <TableRow key={row.id}>
                        {row.cells.map(cell => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'eligibility' ? (
                              cell.value === 'fail'
                                ? <Tag kind="red" size="sm"><Close size={12} /> {t('label.eligibility.criterionFail', 'Fail')}</Tag>
                                : cell.value === 'pass'
                                ? <Tag kind="green" size="sm"><Checkmark size={12} /> {t('label.eligibility.criterionPass', 'Pass')}</Tag>
                                : <Tag kind="gray" size="sm">{t('label.eligibility.notAssessed', 'Not assessed')}</Tag>
                            ) : cell.value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        </Column>

        {/* ── Screen 2 embedded: NCE Inline Form ── */}
        {nceOpen && (
          <Column lg={16} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
            <NceInlineForm
              failingCriteria={failingCriteria}
              sampleAction={sampleAction}
              setSampleAction={setSampleAction}
              onClose={() => setNceOpen(false)}
              onSubmit={(action) => {
                setNceOpen(false);
                const labels = { resample: 'Resample Request queued.', reject: 'Sample rejected.', continue: 'NCE flag added.' };
                setSuccessToast({ kind: 'success', text: `${MOCK_ORDER.labNumber}: NCE created. ${labels[action] || ''}` });
              }}
            />
          </Column>
        )}
      </Grid>

      {/* Override Modal */}
      <Modal
        open={overrideOpen}
        modalHeading={t('message.eligibility.override.heading', 'Accept with failing criteria?')}
        primaryButtonText={t('button.eligibility.override.confirm', 'Accept with override')}
        secondaryButtonText={t('button.cancel', 'Cancel')}
        danger
        onRequestClose={() => setOverrideOpen(false)}
        onRequestSubmit={handleOverrideConfirm}
        primaryButtonDisabled={overrideJustification.trim().length < 10}
      >
        <p style={{ marginBottom: 'var(--cds-spacing-04)' }}>
          {t('message.eligibility.override.confirm', 'Some criteria are not marked pass. Committing will record this as an override in the audit trail.')}
        </p>
        <TextArea
          id="override-justification"
          labelText={t('label.eligibility.override.justification', 'Override justification (required)')}
          placeholder={t('placeholder.eligibility.override.justification', 'Describe why these criteria are being accepted despite failures (min. 10 characters)')}
          value={overrideJustification}
          onChange={e => setOverrideJustification(e.target.value)}
          invalid={overrideJustification.length > 0 && overrideJustification.trim().length < 10}
          invalidText={t('error.eligibility.overrideJustificationRequired', 'Justification must be at least 10 characters')}
          rows={4}
        />
      </Modal>
    </div>
  );
}

// ─── NCE Inline Form Component (Screen 2) ────────────────────────────────────
function NceInlineForm({ failingCriteria = [], sampleAction, setSampleAction, onClose, onSubmit }) {
  const [localAction, setLocalAction] = useState(sampleAction || 'resample');
  const allNonRecoverable = failingCriteria.length > 0 && failingCriteria.every(c => !c.recoverable);
  const defaultAction = allNonRecoverable ? 'reject' : 'resample';
  const [groupIncluded, setGroupIncluded] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const autoDesc = failingCriteria.length > 0
    ? `Eligibility gate failure: ${failingCriteria.length} criterion${failingCriteria.length > 1 ? 'a' : ''} failed\n` +
      failingCriteria.map(c => `• ${c.label}: FAIL${c.note ? ` — ${c.note}` : ''}`).join('\n')
    : t('placeholder.nce.description', 'Describe the non-conformance...');

  return (
    <div style={{
      borderTop: '4px solid #e65100',
      background: '#fffbf0',
      borderRadius: '0 0 4px 4px',
      padding: 'var(--cds-spacing-05)',
      animation: 'slideDown 200ms ease-out',
    }}>
      {/* Context Banner */}
      <div style={{
        background: '#fff8ec',
        border: '1px solid #e65100',
        borderRadius: 4,
        padding: 'var(--cds-spacing-04)',
        marginBottom: 'var(--cds-spacing-05)',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '0.75rem',
      }}>
        <strong>📌 {t('heading.nce.contextBanner', 'CONTEXT — ELIGIBILITY GATE')}</strong>
        <div style={{ marginTop: 'var(--cds-spacing-02)', lineHeight: 1.6 }}>
          <span><strong>{t('label.nce.labNumber', 'Lab #')}:</strong> {MOCK_ORDER.labNumber}</span> ·{' '}
          <span><strong>{t('label.nce.sampleType', 'Sample Type')}:</strong> {MOCK_ORDER.sampleType}</span> ·{' '}
          <span><strong>{t('label.nce.domain', 'Domain')}:</strong> {MOCK_ORDER.domain}</span><br />
          <span><strong>{t('label.eligibility.arrivalAt', 'Arrival')}:</strong> {MOCK_ORDER.arrivalAt}</span> ·{' '}
          <span><strong>{t('label.eligibility.transitDuration', 'Transit')}:</strong> {MOCK_ORDER.transitHours} h (SOP: {MOCK_ORDER.sopWindowHours} h)</span><br />
          <span><strong>{t('label.nce.site', 'Site')}:</strong> {MOCK_ORDER.siteCode} — {MOCK_ORDER.siteName}</span><br />
          <span><strong>{t('label.nce.standard', 'Standard')}:</strong> {MOCK_ORDER.complianceStandard}</span><br />
          {failingCriteria.length > 0 && (
            <span><strong>{t('label.nce.failingCriteria', 'Failing Criteria')}:</strong> {failingCriteria.map(c => c.label).join(', ')}</span>
          )}
        </div>
      </div>

      <Grid>
        <Column lg={8} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
          <Stack gap={4}>
            <Select id="nce-category" labelText={t('label.nce.category', 'Category')} defaultValue="Pre-Analytical">
              <SelectItem value="Pre-Analytical" text={t('label.nce.category.preAnalytical', 'Pre-Analytical')} />
            </Select>
            <Select id="nce-subcategory" labelText={t('label.nce.subcategory', 'Subcategory')} defaultValue="Cold Chain">
              <SelectItem value="Cold Chain" text={t('label.nce.subcategory.coldChain', 'Cold Chain')} />
              <SelectItem value="Specimen Integrity" text={t('label.nce.subcategory.specimenIntegrity', 'Specimen Integrity')} />
              <SelectItem value="Transport" text={t('label.nce.subcategory.transport', 'Transport')} />
              <SelectItem value="Volume" text={t('label.nce.subcategory.volume', 'Volume')} />
              <SelectItem value="Labeling" text={t('label.nce.subcategory.labeling', 'Labeling')} />
            </Select>
            <Select id="nce-severity" labelText={t('label.nce.severity', 'Severity')} defaultValue="MAJOR">
              <SelectItem value="CRITICAL" text={t('label.nce.severity.critical', 'Critical')} />
              <SelectItem value="MAJOR" text={t('label.nce.severity.major', 'Major')} />
              <SelectItem value="MINOR" text={t('label.nce.severity.minor', 'Minor')} />
            </Select>
          </Stack>
        </Column>
        <Column lg={8} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
          <TextArea
            id="nce-description"
            labelText={t('label.nce.description', 'Description')}
            value={autoDesc}
            rows={6}
            helperText={t('helperText.nce.description', 'Auto-generated from failing criteria. You may edit before submitting.')}
          />
        </Column>

        {/* Sample Action */}
        <Column lg={16} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--cds-spacing-03)' }}>
            {t('label.nce.sampleAction', 'Sample Action')}
          </p>
          <div style={{ display: 'flex', gap: 'var(--cds-spacing-04)', flexWrap: 'wrap' }}>
            {[
              {
                value: 'continue',
                label: t('label.nce.sampleAction.continue', 'Continue with NCE flag'),
                desc: t('label.nce.sampleAction.continue.desc', 'Record NCE but continue processing this sample. Status unchanged.'),
                color: '#0f62fe',
                disabled: false,
              },
              {
                value: 'reject',
                label: t('label.nce.sampleAction.reject', 'Reject sample'),
                desc: t('label.nce.sampleAction.reject.desc', 'Record NCE and mark sample pre-analytically rejected. No re-collection scheduled.'),
                color: '#da1e28',
                disabled: false,
              },
              {
                value: 'resample',
                label: t('label.nce.sampleAction.resample', 'Resample'),
                desc: t('label.nce.sampleAction.resample.desc', 'Reject this sample and automatically create a new collection order for re-collection. The customer will be notified.'),
                color: '#0e8a4e',
                disabled: allNonRecoverable,
                disabledTooltip: t('message.eligibility.resample.unavailable', 'Field re-collection not applicable for this failure type'),
              },
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => !opt.disabled && setLocalAction(opt.value)}
                style={{
                  flex: '1 1 200px',
                  border: `2px solid ${localAction === opt.value ? opt.color : 'var(--cds-layer-accent-01)'}`,
                  borderRadius: 4,
                  padding: 'var(--cds-spacing-04)',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  opacity: opt.disabled ? 0.5 : 1,
                  background: localAction === opt.value ? `${opt.color}10` : 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-02)', marginBottom: 'var(--cds-spacing-02)' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: `2px solid ${opt.color}`,
                    background: localAction === opt.value ? opt.color : 'transparent',
                  }} />
                  <strong style={{ fontSize: '0.875rem' }}>{opt.label}</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  {opt.disabled ? opt.disabledTooltip : opt.desc}
                </p>
              </div>
            ))}
          </div>
        </Column>

        {/* Shipment Grouping Offer */}
        <Column lg={16} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
          <div style={{
            border: '1px solid var(--cds-link-01)',
            borderRadius: 4,
            padding: 'var(--cds-spacing-04)',
            background: 'var(--cds-layer-01)',
          }}>
            <p style={{ margin: '0 0 var(--cds-spacing-03)', fontWeight: 600, fontSize: '0.875rem' }}>
              🔗 {t('heading.eligibility.grouping.title', 'Other samples match this root cause')}
            </p>
            <p style={{ margin: '0 0 var(--cds-spacing-03)', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
              {t('message.eligibility.grouping.body', '3 other samples arriving in the same shipment may share this failure:')}
            </p>
            <ul style={{ margin: '0 0 var(--cds-spacing-03)', paddingLeft: 'var(--cds-spacing-05)', fontSize: '0.875rem' }}>
              <li>Lab #ENV-2026-00124 ({t('label.sampleType.waterSurface', 'Water — Surface')})</li>
              <li>Lab #ENV-2026-00125 ({t('label.sampleType.waterGround', 'Water — Ground')})</li>
              <li>Lab #ENV-2026-00126 ({t('label.sampleType.waterSurface', 'Water — Surface')})</li>
            </ul>
            <Checkbox
              id="grouping-checkbox"
              labelText={t('label.eligibility.grouping.checkbox', 'Include these samples in the same NCE')}
              checked={groupIncluded}
              onChange={(_, { checked }) => setGroupIncluded(checked)}
            />
            {groupIncluded && (
              <InlineNotification
                kind="info"
                title={t('message.eligibility.grouping.note', 'Each grouped sample will receive an independent Resample Request.')}
                lowContrast
                style={{ marginTop: 'var(--cds-spacing-03)' }}
              />
            )}
          </div>
        </Column>

        {/* Form actions */}
        <Column lg={16}>
          <Stack orientation="horizontal" gap={4}>
            <Button
              kind="primary"
              onClick={() => { onSubmit && onSubmit(localAction); }}
            >
              {localAction === 'resample'
                ? t('button.nce.submitResample', 'Submit NCE & Create Resample Request')
                : localAction === 'reject'
                ? t('button.nce.submitReject', 'Submit NCE & Reject Sample')
                : t('button.nce.submitContinue', 'Submit NCE & Continue')
              }
            </Button>
            <Button kind="ghost" onClick={onClose}>
              {t('button.cancel', 'Cancel')}
            </Button>
          </Stack>
        </Column>
      </Grid>
    </div>
  );
}

// ─── SCREEN 3: Eligibility Worklist ──────────────────────────────────────────
function Screen3EligibilityWorklist({ onAssess }) {
  const [domainFilter, setDomainFilter] = useState('All');
  const [searchVal, setSearchVal] = useState('');

  const filtered = MOCK_WORKLIST.filter(r => {
    if (domainFilter !== 'All' && r.domain !== domainFilter) return false;
    if (searchVal && !r.labNumber.toLowerCase().includes(searchVal.toLowerCase())) return false;
    return true;
  });

  const sopBreaches = MOCK_WORKLIST.filter(r => r.breach).length;
  const oldest = '4h 31m';

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        <BreadcrumbItem href="#"><span>{t('nav.sampleCollection', 'Sample Collection')}</span></BreadcrumbItem>
        <BreadcrumbItem href="#"><span>{t('nav.addOrder', 'Add Order')}</span></BreadcrumbItem>
        <BreadcrumbItem isCurrentPage><span>{t('menu.order.eligibilityWorklist', 'Eligibility Worklist')}</span></BreadcrumbItem>
      </Breadcrumb>

      <h2 style={{ margin: '0 0 var(--cds-spacing-05)', fontSize: '1.5rem', fontWeight: 600 }}>
        {t('menu.order.eligibilityWorklist', 'Eligibility Worklist')}
      </h2>

      {/* Summary Tiles */}
      <Grid style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        {[
          { label: t('label.worklist.awaitingAssessment', 'Awaiting Assessment'), value: MOCK_WORKLIST.length, color: 'var(--cds-interactive-01)', icon: '⏳' },
          { label: t('label.worklist.sopBreaches', 'SOP Breaches'), value: sopBreaches, color: 'var(--cds-support-error)', icon: '⚠️' },
          { label: t('label.worklist.oldestWaiting', 'Oldest Waiting'), value: oldest, color: 'var(--cds-support-warning)', icon: '🕐' },
          { label: t('label.worklist.myReceipts', 'My Receipts'), value: 2, color: 'var(--cds-support-success)', icon: '👤', clickable: true },
        ].map((tile, i) => (
          <Column lg={4} md={4} sm={4} key={i} style={{ marginBottom: 'var(--cds-spacing-04)' }}>
            <Tile style={{
              padding: 'var(--cds-spacing-05)',
              borderTop: `4px solid ${tile.color}`,
              cursor: tile.clickable ? 'pointer' : 'default',
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: 'var(--cds-spacing-02)' }}>
                {tile.icon} {tile.label}
              </p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: tile.color }}>{tile.value}</p>
            </Tile>
          </Column>
        ))}
      </Grid>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 'var(--cds-spacing-04)', marginBottom: 'var(--cds-spacing-04)', flexWrap: 'wrap', alignItems: 'center' }}>
        <TextInput
          id="scan-bar"
          labelText=""
          placeholder={t('placeholder.worklist.scan', 'Scan QR or enter lab number…')}
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          style={{ width: 280 }}
        />
        <div style={{ display: 'flex', gap: 'var(--cds-spacing-02)' }}>
          {['All', 'Clinical', 'Environmental', 'Vector'].map(d => (
            <Button
              key={d}
              kind={domainFilter === d ? 'primary' : 'tertiary'}
              size="sm"
              onClick={() => setDomainFilter(d)}
            >
              {d}
            </Button>
          ))}
        </div>
        <Button kind="ghost" size="sm" renderIcon={Download}>
          {t('button.exportCsv', 'Export CSV')}
        </Button>
      </div>

      {/* Worklist Table */}
      <DataTable
        rows={filtered}
        headers={[
          { key: 'labNumber', header: t('header.labNumber', 'Lab Number') },
          { key: 'sampleType', header: t('header.sampleType', 'Sample Type') },
          { key: 'receivedAt', header: t('header.receivedAt', 'Received At') },
          { key: 'transitHours', header: t('header.transitDuration', 'Transit') },
          { key: 'site', header: t('header.site', 'Customer / Site') },
          { key: 'standard', header: t('header.standard', 'Standard') },
          { key: 'priority', header: t('header.priority', 'Priority') },
          { key: 'action', header: '' },
        ]}
        isSortable
      >
        {({ rows, headers, getHeaderProps, getTableProps }) => (
          <TableContainer title="">
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, ri) => {
                  const orig = filtered[ri];
                  return (
                    <TableRow key={row.id}>
                      {row.cells.map(cell => (
                        <TableCell key={cell.id}>
                          {cell.info.header === 'sampleType' ? (
                            <Stack gap={2}>
                              <span>{cell.value}</span>
                              {domainTag(orig.domain)}
                            </Stack>
                          ) : cell.info.header === 'transitHours' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {cell.value} h
                              {orig.breach && <Tag kind="red" size="sm"><Warning size={12} /> {t('label.breach', 'Breach')}</Tag>}
                            </span>
                          ) : cell.info.header === 'priority' ? (
                            <Tag kind={orig.priority === 'Urgent' ? 'red' : orig.priority === 'High' ? 'orange' : 'gray'} size="sm">
                              {cell.value}
                            </Tag>
                          ) : cell.info.header === 'action' ? (
                            <Button kind="primary" size="sm" renderIcon={ArrowRight} onClick={() => onAssess && onAssess()}>
                              {t('button.worklist.assess', 'Assess')}
                            </Button>
                          ) : cell.value}
                        </TableCell>
                      ))}
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

// ─── SCREEN 4: SampleType Admin — Acceptance Criteria Accordion ───────────────
function Screen4SampleTypeAdmin() {
  const [criteria, setCriteria] = useState(MOCK_CRITERIA_ADMIN);
  const [sopWindow, setSopWindow] = useState(12);
  const [expandedCrit, setExpandedCrit] = useState(null);
  const [newCritLabel, setNewCritLabel] = useState('');

  const addCriterion = () => {
    if (!newCritLabel.trim()) return;
    setCriteria(prev => [...prev, {
      id: `ca${Date.now()}`,
      label: newCritLabel,
      severity: 'MAJOR',
      recoverable: true,
      autoRule: 'none',
      subcategory: 'Specimen Integrity',
    }]);
    setNewCritLabel('');
  };

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        <BreadcrumbItem href="#"><span>{t('nav.admin', 'Admin')}</span></BreadcrumbItem>
        <BreadcrumbItem href="#"><span>{t('nav.sampleTypes', 'Sample Types')}</span></BreadcrumbItem>
        <BreadcrumbItem isCurrentPage><span>{t('nav.waterSurface', 'Water — Surface')}</span></BreadcrumbItem>
      </Breadcrumb>

      <h2 style={{ margin: '0 0 var(--cds-spacing-05)', fontSize: '1.5rem', fontWeight: 600 }}>
        {t('heading.sampleTypeEdit', 'Water — Surface')}{' '}
        <Tag kind="green" size="sm">{t('label.domain.environmental', 'Environmental')}</Tag>
      </h2>

      {/* Existing SampleType fields placeholder */}
      <Tile style={{ padding: 'var(--cds-spacing-05)', marginBottom: 'var(--cds-spacing-05)' }}>
        <Grid>
          <Column lg={8}>
            <TextInput id="st-name" labelText={t('label.sampleType.name', 'Sample Type Name')} defaultValue="Water — Surface" />
          </Column>
          <Column lg={4}>
            <Select id="st-domain" labelText={t('label.sampleType.domain', 'Domain')} defaultValue="Environmental">
              <SelectItem value="Environmental" text={t('label.domain.environmental', 'Environmental')} />
              <SelectItem value="Clinical" text={t('label.domain.clinical', 'Clinical')} />
              <SelectItem value="Vector" text={t('label.domain.vector', 'Vector')} />
            </Select>
          </Column>
          <Column lg={4}>
            <Select id="st-matrix" labelText={t('label.sampleType.matrix', 'Matrix')} defaultValue="Liquid">
              <SelectItem value="Liquid" text={t('label.matrix.liquid', 'Liquid')} />
              <SelectItem value="Solid" text={t('label.matrix.solid', 'Solid')} />
            </Select>
          </Column>
        </Grid>
      </Tile>

      {/* Acceptance Criteria Accordion */}
      <Accordion>
        <AccordionItem
          title={
            <span style={{ fontWeight: 600 }}>
              {t('label.admin.sampleType.acceptanceCriteria', 'Acceptance Criteria')}
              <Tag kind="blue" size="sm" style={{ marginLeft: 'var(--cds-spacing-03)' }}>{criteria.length} {t('label.criteria.count', 'criteria')}</Tag>
            </span>
          }
        >
          <Stack gap={4}>
            <NumberInput
              id="sop-window"
              label={t('label.admin.sopTransitWindow', 'SOP Transit Window (hours)')}
              value={sopWindow}
              min={1} max={168}
              onChange={(e, { value }) => setSopWindow(value)}
              helperText={t('helperText.sopWindow', 'Maximum allowed time from collection to receipt at lab')}
            />

            {/* Default criteria library */}
            <Accordion>
              <AccordionItem title={t('label.admin.defaultCriteriaLibrary', 'Inherit from default criteria library')}>
                <Stack gap={2}>
                  {[
                    { label: 'Container integrity intact', checked: true },
                    { label: 'Label legibility', checked: true },
                    { label: 'Sample volume sufficient', checked: true },
                    { label: 'Temperature within range', checked: true },
                    { label: 'SOP transit window met', checked: true },
                    { label: 'Chain-of-custody form present', checked: false },
                    { label: 'Biohazard disposal requirements met', checked: false },
                  ].map((def, i) => (
                    <Checkbox key={i} id={`default-${i}`} labelText={def.label} defaultChecked={def.checked} />
                  ))}
                </Stack>
              </AccordionItem>
            </Accordion>

            <h5 style={{ margin: 0 }}>{t('label.admin.criteriaList', 'Criteria List')}</h5>

            {criteria.map((c, i) => (
              <Tile key={c.id} style={{ padding: 'var(--cds-spacing-04)', borderLeft: '3px solid var(--cds-interactive-01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--cds-spacing-03)' }}>
                  <strong style={{ fontSize: '0.875rem' }}>{c.label}</strong>
                  <Button kind="ghost" size="sm" hasIconOnly renderIcon={TrashCan} iconDescription={t('button.deleteCriterion', 'Delete criterion')}
                    onClick={() => setCriteria(prev => prev.filter(x => x.id !== c.id))} />
                </div>
                <Grid condensed>
                  <Column lg={4}>
                    <Select id={`sev-${c.id}`} labelText={t('label.admin.severity', 'Severity')} defaultValue={c.severity} size="sm">
                      <SelectItem value="CRITICAL" text={t('label.nce.severity.critical', 'Critical')} />
                      <SelectItem value="MAJOR" text={t('label.nce.severity.major', 'Major')} />
                      <SelectItem value="MINOR" text={t('label.nce.severity.minor', 'Minor')} />
                    </Select>
                  </Column>
                  <Column lg={4}>
                    <Select id={`auto-${c.id}`} labelText={t('label.admin.autoComputeRule', 'Auto-Compute Rule')} defaultValue={c.autoRule} size="sm">
                      <SelectItem value="none" text={t('label.admin.autoRule.none', 'None (manual)')} />
                      <SelectItem value="transit_window" text={t('label.admin.autoRule.transitWindow', 'Transit window')} />
                      <SelectItem value="temperature_range" text={t('label.admin.autoRule.temperatureRange', 'Temperature range')} />
                      <SelectItem value="volume_range" text={t('label.admin.autoRule.volumeRange', 'Volume range')} />
                      <SelectItem value="pool_size" text={t('label.admin.autoRule.poolSize', 'Pool size (vector)')} />
                    </Select>
                  </Column>
                  <Column lg={4}>
                    <Select id={`sub-${c.id}`} labelText={t('label.admin.subcategory', 'NCE Subcategory')} defaultValue={c.subcategory} size="sm">
                      <SelectItem value="Specimen Integrity" text={t('label.nce.subcategory.specimenIntegrity', 'Specimen Integrity')} />
                      <SelectItem value="Cold Chain" text={t('label.nce.subcategory.coldChain', 'Cold Chain')} />
                      <SelectItem value="Transport" text={t('label.nce.subcategory.transport', 'Transport')} />
                      <SelectItem value="Volume" text={t('label.nce.subcategory.volume', 'Volume')} />
                      <SelectItem value="Labeling" text={t('label.nce.subcategory.labeling', 'Labeling')} />
                    </Select>
                  </Column>
                  <Column lg={4} style={{ paddingTop: 'var(--cds-spacing-05)' }}>
                    <Checkbox id={`rec-${c.id}`} labelText={t('label.admin.recoverable', 'Recoverable (allow Resample)')} defaultChecked={c.recoverable} />
                  </Column>
                </Grid>
              </Tile>
            ))}

            {/* Add criterion inline */}
            <Tile style={{ padding: 'var(--cds-spacing-04)', border: '2px dashed var(--cds-layer-accent-01)' }}>
              <Stack orientation="horizontal" gap={3}>
                <TextInput
                  id="new-crit-label"
                  labelText=""
                  placeholder={t('placeholder.admin.newCriterion', 'New criterion label…')}
                  value={newCritLabel}
                  onChange={e => setNewCritLabel(e.target.value)}
                />
                <Button kind="primary" size="md" renderIcon={Add} onClick={addCriterion}>
                  {t('button.admin.addCriterion', 'Add')}
                </Button>
              </Stack>
            </Tile>

            <Stack orientation="horizontal" gap={3}>
              <Button kind="primary">{t('button.save', 'Save criteria')}</Button>
              <Button kind="ghost">{t('button.cancel', 'Cancel')}</Button>
            </Stack>
          </Stack>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// ─── SCREEN 5: Lab Unit Admin — Gate Behavior Config ─────────────────────────
function Screen5LabUnitAdmin() {
  const [config, setConfig] = useState({
    clinical: 'Disabled',
    environmental: 'Mandatory',
    vector: 'Mandatory',
  });

  const setDomainConfig = (domain, val) => setConfig(prev => ({ ...prev, [domain]: val }));

  const helpText = {
    Mandatory: t('helperText.gateBehavior.mandatory', 'Eligibility Assessment is shown and enforced. The Accept button is disabled until all criteria pass. Required for ISO 15189/17025 compliance.'),
    Prompted: t('helperText.gateBehavior.prompted', 'Eligibility Assessment is shown but advisory. The Accept button remains enabled at all times. Criteria results are recorded but not enforced.'),
    Disabled: t('helperText.gateBehavior.disabled', 'Eligibility Assessment section is hidden. Step 4 behaves as in the original Sample Collection Redesign.'),
  };

  const domains = [
    { key: 'environmental', label: t('label.domain.environmental', 'Environmental'), defaultNote: t('note.defaultMandatory', 'Default: Mandatory') },
    { key: 'vector', label: t('label.domain.vector', 'Vector'), defaultNote: t('note.defaultMandatory', 'Default: Mandatory') },
    { key: 'clinical', label: t('label.domain.clinical', 'Clinical'), defaultNote: t('note.defaultDisabled', 'Default: Disabled') },
  ];

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        <BreadcrumbItem href="#"><span>{t('nav.admin', 'Admin')}</span></BreadcrumbItem>
        <BreadcrumbItem href="#"><span>{t('nav.labUnits', 'Lab Units')}</span></BreadcrumbItem>
        <BreadcrumbItem isCurrentPage><span>{t('nav.mainLab', 'Main Clinical Lab')}</span></BreadcrumbItem>
      </Breadcrumb>

      <h2 style={{ margin: '0 0 var(--cds-spacing-05)', fontSize: '1.5rem', fontWeight: 600 }}>
        {t('heading.labUnit.edit', 'Main Clinical Lab')}
      </h2>

      {/* Existing Lab Unit fields placeholder */}
      <Tile style={{ padding: 'var(--cds-spacing-05)', marginBottom: 'var(--cds-spacing-05)' }}>
        <Grid>
          <Column lg={8}>
            <TextInput id="lu-name" labelText={t('label.labUnit.name', 'Lab Unit Name')} defaultValue="Main Clinical Lab" />
          </Column>
          <Column lg={4}>
            <Select id="lu-type" labelText={t('label.labUnit.type', 'Workflow Type')} defaultValue="Both">
              <SelectItem value="Clinical" text={t('label.workflowType.clinical', 'Clinical')} />
              <SelectItem value="Environmental" text={t('label.workflowType.environmental', 'Environmental')} />
              <SelectItem value="Both" text={t('label.workflowType.both', 'Both')} />
            </Select>
          </Column>
        </Grid>
      </Tile>

      {/* Eligibility Gate Behavior */}
      <Accordion>
        <AccordionItem
          title={
            <span style={{ fontWeight: 600 }}>
              {t('label.admin.labUnit.eligibilityGate', 'Eligibility Gate Behavior')}
            </span>
          }
        >
          <InlineNotification
            kind="info"
            title={t('message.eligibilityGate.info', 'Configure the pre-analytical eligibility gate per sample domain. Changes apply to new orders only; in-flight orders retain the behavior active when they entered PENDING QA.')}
            lowContrast
            style={{ marginBottom: 'var(--cds-spacing-05)' }}
          />

          <Stack gap={6}>
            {domains.map(domain => (
              <div key={domain.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)', marginBottom: 'var(--cds-spacing-03)' }}>
                  <h5 style={{ margin: 0 }}>{domain.label}</h5>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>({domain.defaultNote})</span>
                </div>
                <RadioButtonGroup
                  name={`gate-${domain.key}`}
                  valueSelected={config[domain.key]}
                  onChange={val => setDomainConfig(domain.key, val)}
                  orientation="horizontal"
                >
                  <RadioButton value="Mandatory" labelText={t('label.admin.labUnit.eligibilityGate.mandatory', 'Mandatory')} id={`${domain.key}-mandatory`} />
                  <RadioButton value="Prompted" labelText={t('label.admin.labUnit.eligibilityGate.prompted', 'Prompted')} id={`${domain.key}-prompted`} />
                  <RadioButton value="Disabled" labelText={t('label.admin.labUnit.eligibilityGate.disabled', 'Disabled')} id={`${domain.key}-disabled`} />
                </RadioButtonGroup>
                <p style={{ margin: 'var(--cds-spacing-02) 0 0', fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  {helpText[config[domain.key]]}
                </p>
              </div>
            ))}
          </Stack>

          <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
            <Button kind="primary">{t('button.save', 'Save configuration')}</Button>
            <Button kind="ghost">{t('button.cancel', 'Cancel')}</Button>
          </Stack>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// ─── SCREEN 6: Vector CollectionLot Variant ───────────────────────────────────
function Screen6VectorVariant() {
  const vectorCriteria = [
    {
      id: 'v1',
      label: t('label.eligibility.criterion.poolSize', 'Pool size meets VectorSpecimenProfile minimum'),
      severity: 'MAJOR', recoverable: true, autoComputed: true, pass: true,
      note: '47 specimens (min 30 per Anopheles profile)',
      sourceData: {
        rule: 'pool_size',
        stepLabel: t('label.source.collectionLotEntry', 'V-01 CollectionLot Entry'),
        stepHref: '#collection-lot-entry',
        fields: [
          { label: t('label.source.poolSize', 'Pool size recorded'), value: '47 specimens', enteredBy: 'Ahmad Fauzan', enteredAt: '2026-04-16 06:10', role: t('label.role.collector', 'Field Collector') },
          { label: t('label.source.poolMinimum', 'Minimum required (VectorSpecimenProfile — Anopheles spp.)'), value: '30 specimens', enteredBy: t('label.source.systemConfig', 'System — VectorSpecimenProfile admin'), enteredAt: null, role: null },
        ],
        computed: t('message.source.poolSizeResult', 'Evaluated: 47 specimens ≥ 30 minimum → PASS'),
      },
    },
    { id: 'v2', label: t('label.eligibility.criterion.desiccation', 'Desiccation absent'), severity: 'CRITICAL', recoverable: true, autoComputed: false, pass: null, note: '' },
    { id: 'v3', label: t('label.eligibility.criterion.preservationMedium', 'Preservation medium appropriate'), severity: 'MAJOR', recoverable: false, autoComputed: false, pass: null, note: '' },
    { id: 'v4', label: t('label.eligibility.criterion.specimensNotDamaged', 'Specimens not damaged (pool integrity)'), severity: 'MAJOR', recoverable: true, autoComputed: false, pass: null, note: '' },
    { id: 'v5', label: t('label.eligibility.criterion.coldChain', 'Cold chain intact (field to lab)'), severity: 'CRITICAL', recoverable: true, autoComputed: false, pass: null, note: '' },
  ];
  const [vcriteria, setVCriteria] = useState(vectorCriteria);
  const [expandedVectorSources, setExpandedVectorSources] = useState({});
  const toggleVectorSource = (id) => setExpandedVectorSources(prev => ({ ...prev, [id]: !prev[id] }));
  const allChecked = vcriteria.every(c => c.pass !== null);
  const anyFail = vcriteria.some(c => c.pass === false);

  const toggleCriterion = (id, pass) => setVCriteria(prev => prev.map(c => c.id === id ? { ...c, pass } : c));

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        <BreadcrumbItem href="#"><span>{t('nav.sampleCollection', 'Sample Collection')}</span></BreadcrumbItem>
        <BreadcrumbItem href="#"><span>{t('nav.addOrder', 'Add Order')}</span></BreadcrumbItem>
        <BreadcrumbItem isCurrentPage><span>{t('nav.qaReview', 'QA Review — Step 4 (Vector)')}</span></BreadcrumbItem>
      </Breadcrumb>

      <Stack gap={3} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          {t('heading.step4.vector', 'QA Review — Step 4')}
        </h2>
        <div style={{ display: 'flex', gap: 'var(--cds-spacing-04)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag kind="teal" size="md">VEC-2026-00031</Tag>
          <Tag kind="teal" size="sm">{t('label.domain.vector', 'Vector')}</Tag>
          <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            Trap BDG-019 — Bandung Urban Catchment
          </span>
          <Tag kind="purple" size="sm">{t('status.pendingQA', 'Pending QA')}</Tag>
        </div>
      </Stack>

      <Grid>
        {/* CollectionLot Context Block — replaces clinical/env context */}
        <Column lg={16} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
          <Tile style={{ padding: 'var(--cds-spacing-05)', borderLeft: '4px solid var(--cds-interactive-01)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--cds-spacing-05)', color: 'var(--cds-interactive-01)' }}>
              {t('heading.eligibility.assessment', 'Eligibility Assessment')}
            </h3>

            {/* Vector CollectionLot context */}
            <div style={{ marginBottom: 'var(--cds-spacing-05)' }}>
              <h5 style={{ margin: '0 0 var(--cds-spacing-03)' }}>
                {t('heading.eligibility.collectionLotContext', 'Collection Lot Context')}
              </h5>
              <Grid condensed>
                {[
                  { label: t('label.vector.trapType', 'Trap Type'), value: 'CDC Light Trap' },
                  { label: t('label.vector.collectionStart', 'Collection Start'), value: '2026-04-15 18:00' },
                  { label: t('label.vector.collectionEnd', 'Collection End'), value: '2026-04-16 06:00' },
                  { label: t('label.vector.poolFlag', 'Pool'), value: 'Yes' },
                  { label: t('label.vector.poolSize', 'Pool Size'), value: '47 specimens' },
                  { label: t('label.vector.collector', 'Field Collector'), value: 'Ahmad Fauzan' },
                  { label: t('label.vector.weatherConditions', 'Weather Conditions'), value: 'Humid, 28°C, post-rain' },
                  { label: t('label.vector.targetOrganism', 'Target Organism Group'), value: <Tag kind="green" size="sm">🦟 Anopheles spp.</Tag> },
                  { label: t('label.eligibility.arrivalAt', 'Received at lab'), value: '2026-04-16 07:45' },
                  { label: t('label.eligibility.transitDuration', 'Time in transit'), value: '1h 45m (SOP: 8h ✓)' },
                  { label: t('label.eligibility.receivedBy', 'Received by'), value: 'Siti Rahayu' },
                  { label: t('label.eligibility.shipmentId', 'Shipment ID'), value: 'SHIP-2026-VEC-008' },
                ].map((f, i) => (
                  <Column key={i} lg={4} md={4} sm={4} style={{ marginBottom: 'var(--cds-spacing-04)' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{f.label}</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{f.value}</p>
                  </Column>
                ))}
              </Grid>
            </div>

            {/* Vector Criteria Checklist */}
            <div style={{ marginBottom: 'var(--cds-spacing-05)' }}>
              <h5 style={{ margin: '0 0 var(--cds-spacing-03)' }}>
                {t('heading.eligibility.criteria', 'Acceptance Criteria')}
                <Tag kind="teal" size="sm" style={{ marginLeft: 'var(--cds-spacing-03)' }}>
                  {t('label.vector.criteria', 'Vector — Anopheles spp. / Mosquito Pool')}
                </Tag>
              </h5>
              <Stack gap={4}>
                {vcriteria.map(c => (
                  <Tile key={c.id} style={{
                    padding: 'var(--cds-spacing-04)',
                    background: c.pass === false ? 'var(--cds-support-error-inverse)' : c.pass === true ? 'var(--cds-support-success-inverse)' : 'var(--cds-layer-01)',
                    border: '1px solid var(--cds-layer-accent-01)',
                  }}>
                    <Grid condensed>
                      <Column lg={8}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.label}</span>
                          {severityTag(c.severity)}
                          {c.autoComputed && (
                              <>
                                <Tag kind="gray" size="sm" renderIcon={Lock}>{t('label.eligibility.criterionAutoComputed', 'Auto-evaluated')}</Tag>
                                {c.sourceData && (
                                  <Button kind="ghost" size="sm"
                                    onClick={() => toggleVectorSource(c.id)}
                                    renderIcon={expandedVectorSources[c.id] ? ChevronUp : ChevronDown}>
                                    {expandedVectorSources[c.id] ? t('button.source.hide', 'Hide source') : t('button.source.view', 'View source')}
                                  </Button>
                                )}
                              </>
                            )}
                          {!c.recoverable && <Tag kind="cool-gray" size="sm">{t('label.eligibility.notRecoverable', 'No resample')}</Tag>}
                        </div>
                        {c.note && <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block', marginTop: 4 }}>{c.note}</span>}
                      </Column>
                      <Column lg={4}>
                        {c.autoComputed ? (
                          <div style={{ paddingTop: 'var(--cds-spacing-02)' }}>
                            {c.pass
                              ? <Tag kind="green"><Checkmark size={12} /> {t('label.eligibility.criterionPass', 'Pass')}</Tag>
                              : <Tag kind="red"><Close size={12} /> {t('label.eligibility.criterionFail', 'Fail')}</Tag>
                            }
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 'var(--cds-spacing-03)', paddingTop: 'var(--cds-spacing-02)' }}>
                            <Button kind={c.pass === true ? 'primary' : 'tertiary'} size="sm" onClick={() => toggleCriterion(c.id, true)} renderIcon={Checkmark}>
                              {t('label.eligibility.criterionPass', 'Pass')}
                            </Button>
                            <Button kind={c.pass === false ? 'danger' : 'tertiary'} size="sm" onClick={() => toggleCriterion(c.id, false)} renderIcon={Close}>
                              {t('label.eligibility.criterionFail', 'Fail')}
                            </Button>
                          </div>
                        )}
                      </Column>
                    </Grid>
                    {c.autoComputed && c.sourceData && expandedVectorSources[c.id] && (
                      <SourceProvenanceBlock sourceData={c.sourceData} pass={c.pass} />
                    )}
                  </Tile>
                ))}
              </Stack>
            </div>

            {/* Action bar */}
            <div style={{
              display: 'flex', gap: 'var(--cds-spacing-04)', flexWrap: 'wrap',
              paddingTop: 'var(--cds-spacing-05)',
              borderTop: '1px solid var(--cds-layer-accent-01)',
            }}>
              <Button kind="primary" disabled={!allChecked} renderIcon={Checkmark}>
                {t('button.eligibility.accept', 'Accept')}
              </Button>
              <Button kind="tertiary" style={{ borderColor: '#e65100', color: '#e65100' }} renderIcon={DocumentAdd}>
                {t('button.eligibility.reportNce', 'Report NCE')}
              </Button>
              <Button kind="ghost">
                {t('button.eligibility.returnToStep', 'Return to Step…')}
              </Button>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function PreAnalyticalEligibilityGate() {
  const [activeTab, setActiveTab] = useState(0);

  const screens = [
    { label: t('tab.screen1', 'Step 4 — Eligibility Assessment'), component: <Screen1EligibilityAssessment /> },
    { label: t('tab.screen3', 'Eligibility Worklist'), component: <Screen3EligibilityWorklist onAssess={() => setActiveTab(0)} /> },
    { label: t('tab.screen4', 'Admin — SampleType Criteria'), component: <Screen4SampleTypeAdmin /> },
    { label: t('tab.screen5', 'Admin — Gate Behavior'), component: <Screen5LabUnitAdmin /> },
    { label: t('tab.screen6', 'Vector Variant'), component: <Screen6VectorVariant /> },
  ];

  return (
    <div style={{ padding: 'var(--cds-spacing-05)', maxWidth: 1440 }}>
      <Tabs selectedIndex={activeTab} onChange={({ selectedIndex }) => setActiveTab(selectedIndex)}>
        <TabList aria-label={t('aria.screenSwitcher', 'Screen switcher')}>
          {screens.map((s, i) => <Tab key={i}>{s.label}</Tab>)}
        </TabList>
        <TabPanels>
          {screens.map((s, i) => (
            <TabPanel key={i} style={{ paddingTop: 'var(--cds-spacing-05)' }}>
              {s.component}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </div>
  );
}
