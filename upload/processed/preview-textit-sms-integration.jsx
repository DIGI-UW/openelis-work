import { useState } from "react";

// ─── Design tokens (approximating Carbon / OpenELIS palette) ─────────────────
const C = {
  blue60: '#0f62fe', blue70: '#0043ce', blue10: '#edf5ff', blue20: '#d0e2ff',
  green50: '#defbe6', green60: '#198038',
  red50: '#fff1f1', red60: '#da1e28',
  yellow10: '#fdf4c4', yellow70: '#8e6a00',
  gray10: '#f4f4f4', gray20: '#e0e0e0', gray30: '#c6c6c6',
  gray50: '#8d8d8d', gray70: '#525252', gray80: '#393939', gray90: '#262626', gray100: '#161616',
  warmGray20: '#e5e0df', warmGray60: '#8f8b8b',
  white: '#ffffff',
  sidebarBg: '#262626',    // Carbon UI Shell left nav
  sidebarActive: '#0f62fe',
  sidebarHover: '#353535',
  sidebarText: '#f4f4f4',
  sidebarSubText: '#c6c6c6',
  topBarBg: '#161616',
  border: '#e0e0e0',
};

const TAG_KINDS = {
  green:      { bg: C.green50,    color: C.green60,   border: '#a7f0ba' },
  red:        { bg: C.red50,      color: C.red60,     border: '#ffa4a9' },
  blue:       { bg: C.blue10,     color: C.blue70,    border: C.blue20 },
  'warm-gray':{ bg: C.warmGray20, color: C.gray70,    border: C.warmGray60 },
  gray:       { bg: C.gray10,     color: C.gray70,    border: C.gray30 },
};

// ─── Primitive components ─────────────────────────────────────────────────────

function Tag({ kind = 'gray', children }) {
  const s = TAG_KINDS[kind] || TAG_KINDS.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: '12px', fontSize: '11px', fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{children}</span>
  );
}

function Btn({ children, kind = 'primary', onClick, disabled, small, style: sx }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '6px 14px' : '10px 20px', borderRadius: 2,
    fontSize: small ? 12 : 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'background 0.15s', ...sx,
  };
  const map = {
    primary:   { ...base, background: disabled ? C.gray30 : C.blue60, color: C.white },
    secondary: { ...base, background: C.gray10, color: C.gray90, border: `1px solid ${C.gray50}` },
    ghost:     { ...base, background: 'transparent', color: C.blue60 },
    tertiary:  { ...base, background: 'transparent', color: C.blue60, border: `1px solid ${C.blue60}` },
    danger:    { ...base, background: C.red60, color: C.white },
  };
  return <button style={map[kind] || map.primary} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Notif({ kind = 'info', title, subtitle, onClose }) {
  const p = {
    info:    { bg: C.blue10,     border: C.blue60,  color: C.blue70,  icon: 'ℹ' },
    success: { bg: C.green50,    border: C.green60, color: C.green60, icon: '✓' },
    warning: { bg: C.yellow10,   border: C.yellow70,color: C.yellow70,icon: '⚠' },
    error:   { bg: C.red50,      border: C.red60,   color: C.red60,   icon: '✕' },
  }[kind] || {};
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 16px', borderRadius: 2, borderLeft: `4px solid ${p.border}`, background: p.bg,
    }}>
      <span style={{ color: p.color, fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{p.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: C.gray100 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.gray70, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.gray50, lineHeight: 1 }}>×</button>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', helper, masked }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70 }}>{label}</label>
      <input
        type={masked ? 'password' : type} value={value}
        onChange={onChange} placeholder={placeholder}
        style={{
          padding: '10px 12px', border: `1px solid ${C.gray30}`, borderRadius: 2,
          fontSize: 14, background: C.white, outline: 'none', width: '100%', boxSizing: 'border-box',
        }}
      />
      {helper && <span style={{ fontSize: 11, color: C.gray50 }}>{helper}</span>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70 }}>{label}</label>}
      <select value={value} onChange={onChange} style={{
        padding: '10px 12px', border: `1px solid ${C.gray30}`, borderRadius: 2,
        fontSize: 14, background: C.white, cursor: 'pointer',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ on, onToggle, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={() => onToggle(!on)} style={{
        width: 48, height: 24, borderRadius: 12, border: 'none',
        background: on ? C.blue60 : C.gray30, position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
      }}>
        <span style={{
          display: 'block', width: 18, height: 18, borderRadius: '50%', background: C.white,
          position: 'absolute', top: 3, left: on ? 27 : 3, transition: 'left 0.2s',
        }} />
      </button>
      <span style={{ fontSize: 14, color: C.gray100 }}>{label}</span>
      <Tag kind={on ? 'green' : 'gray'}>{on ? 'Enabled' : 'Disabled'}</Tag>
    </div>
  );
}

function SectionCard({ children }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '28px 32px' }}>
      {children}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRIGGER_OPTIONS = [
  { value: 'DISABLED',      label: 'Disabled' },
  { value: 'POSITIVE_ONLY', label: 'Positive results only' },
  { value: 'ALL_RESULTS',   label: 'All results' },
  { value: 'NEGATIVE_ONLY', label: 'Negative results only' },
  { value: 'CRITICAL_ONLY', label: 'Critical results only' },
];
const TRIGGER_TAG = { DISABLED: 'gray', POSITIVE_ONLY: 'green', ALL_RESULTS: 'blue', NEGATIVE_ONLY: 'warm-gray', CRITICAL_ONLY: 'red' };

const INITIAL_TRIGGERS = [
  { id: '1', testType: 'GeneXpert MTB/RIF',        condition: 'POSITIVE_ONLY' },
  { id: '2', testType: 'GeneXpert MTB/RIF Ultra',  condition: 'POSITIVE_ONLY' },
  { id: '3', testType: 'HIV-1/2 Rapid Test',       condition: 'ALL_RESULTS'   },
  { id: '4', testType: 'CD4 Count',                condition: 'DISABLED'      },
  { id: '5', testType: 'Viral Load (HIV)',          condition: 'CRITICAL_ONLY' },
  { id: '6', testType: 'Sputum AFB Smear',         condition: 'DISABLED'      },
];

const MERGE_FIELDS = [
  { token: '{{patient_id}}',      label: 'Patient ID' },
  { token: '{{test_name}}',       label: 'Test Name' },
  { token: '{{result}}',          label: 'Result' },
  { token: '{{facility}}',        label: 'Facility' },
  { token: '{{validated_at}}',    label: 'Validated At' },
  { token: '{{accession_number}}',label: 'Accession #' },
];
const EXAMPLE_VALS = {
  '{{patient_id}}':       'PNG-PAT-00192',
  '{{test_name}}':        'GeneXpert MTB/RIF',
  '{{result}}':           'MTB DETECTED. RIF: Susceptible.',
  '{{facility}}':         'Port Moresby General Hospital',
  '{{validated_at}}':     '2026-03-23 08:14',
  '{{accession_number}}': 'PNG-2026-004521',
};

const DELIVERY_LOG = [
  { id: 'L001', accession: 'PNG-2026-004521', testType: 'GeneXpert MTB/RIF',       provider: 'Dr. James Ovia',  phone: '+675 •••• ••47', result: 'MTB DETECTED',         status: 'DELIVERED',        attempts: 1, lastAttempt: '2026-03-23 08:14' },
  { id: 'L002', accession: 'PNG-2026-004488', testType: 'HIV-1/2 Rapid Test',      provider: 'Dr. Sarah Maino', phone: '+675 •••• ••91', result: 'REACTIVE',             status: 'DELIVERED',        attempts: 1, lastAttempt: '2026-03-23 07:52' },
  { id: 'L003', accession: 'PNG-2026-004412', testType: 'GeneXpert MTB/RIF Ultra', provider: 'Dr. Peter Kila',  phone: '+675 •••• ••33', result: 'MTB DETECTED',         status: 'FAILED_PERMANENT', attempts: 3, lastAttempt: '2026-03-23 06:30' },
  { id: 'L004', accession: 'PNG-2026-004399', testType: 'HIV-1/2 Rapid Test',      provider: 'Nurse Agnes Toa', phone: '—',              result: 'NON-REACTIVE',         status: 'SKIPPED_NO_PHONE', attempts: 0, lastAttempt: '—' },
  { id: 'L005', accession: 'PNG-2026-004380', testType: 'GeneXpert MTB/RIF',       provider: 'Dr. Maria Undo',  phone: '+675 •••• ••62', result: 'MTB DETECTED',         status: 'RETRYING',         attempts: 2, lastAttempt: '2026-03-23 05:00' },
  { id: 'L006', accession: 'PNG-2026-004355', testType: 'Viral Load (HIV)',         provider: 'Dr. Ben Kopi',    phone: '+675 •••• ••18', result: 'CRITICAL (>1M cp/mL)', status: 'DELIVERED',        attempts: 1, lastAttempt: '2026-03-22 21:40' },
];
const STATUS_TAG   = { DELIVERED: 'green', FAILED_PERMANENT: 'red', PENDING: 'blue', RETRYING: 'warm-gray', SKIPPED_NO_PHONE: 'gray' };
const STATUS_LABEL = { DELIVERED: 'Delivered', FAILED_PERMANENT: 'Failed', PENDING: 'Pending', RETRYING: 'Retrying', SKIPPED_NO_PHONE: 'Skipped (No Phone)' };

// ─── Page: Connection ─────────────────────────────────────────────────────────
function PageConnection() {
  const [enabled, setEnabled] = useState(true);
  const [baseUrl, setBaseUrl] = useState('https://textit.com/api/v2');
  const [token, setToken] = useState('');
  const [channelUuid, setChannelUuid] = useState('a3f9e21c-bc44-4d78-a012-9f3c00000001');
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);

  return (
    <SectionCard>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 24 }}>TextIt Connection</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Toggle on={enabled} onToggle={setEnabled} label="Enable SMS Notifications" />
        {!enabled && <Notif kind="warning" title="SMS notifications are globally disabled." subtitle="No messages will be sent on result validation until re-enabled." />}
        <div style={{ maxWidth: 520 }}>
          <Field label="TextIt API Base URL" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://textit.com/api/v2" />
        </div>
        <div style={{ maxWidth: 520 }}>
          <Field label="API Token" masked value={token} onChange={e => setToken(e.target.value)} placeholder="Enter new token to replace saved value" helper="Token is stored encrypted. Enter a new value to replace the existing one." />
        </div>
        <div style={{ maxWidth: 520 }}>
          <Field label="Channel UUID" value={channelUuid} onChange={e => setChannelUuid(e.target.value)} placeholder="e.g. 12345678-abcd-efgh-ijkl-000000000000" />
        </div>
        {testResult === 'success' && <Notif kind="success" title="Connection to TextIt API successful." onClose={() => setTestResult(null)} />}
        {testResult === 'error'   && <Notif kind="error"   title="Could not connect. Check the URL and token." onClose={() => setTestResult(null)} />}
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="secondary" disabled={testing} onClick={() => { setTesting(true); setTimeout(() => { setTesting(false); setTestResult('success'); }, 900); }}>
            ⟳ {testing ? 'Testing…' : 'Test Connection'}
          </Btn>
          <Btn kind="primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>
            Save
          </Btn>
        </div>
        {saved && <Notif kind="success" title="Connection settings saved." onClose={() => setSaved(false)} />}
      </div>
    </SectionCard>
  );
}

// ─── Page: Test Triggers ──────────────────────────────────────────────────────
function PageTriggers() {
  const [triggers, setTriggers] = useState(INITIAL_TRIGGERS);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editCondition, setEditCondition] = useState('');

  const saveRow = (id) => {
    setTriggers(prev => prev.map(r => r.id === id ? { ...r, condition: editCondition } : r));
    setExpandedRow(null);
  };

  const th = { padding: '10px 16px', fontSize: 12, fontWeight: 700, color: C.gray70, textAlign: 'left', borderBottom: `2px solid ${C.gray20}`, background: C.gray10 };
  const td = { padding: '12px 16px', fontSize: 13, borderBottom: `1px solid ${C.gray20}`, verticalAlign: 'middle' };

  return (
    <SectionCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 4 }}>Test Type Triggers</h2>
          <p style={{ fontSize: 13, color: C.gray70 }}>Configure which result interpretations trigger an SMS per test type. New test types default to Disabled.</p>
        </div>
        <Btn kind="secondary" small onClick={() => setTriggers(prev => prev.map(r => ({ ...r, condition: 'DISABLED' })))}>
          ✕ Disable All
        </Btn>
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Test Type</th>
              <th style={th}>SMS Trigger</th>
              <th style={{ ...th, width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {triggers.map(row => (
              <>
                <tr key={row.id} style={{ background: expandedRow === row.id ? C.blue10 : C.white }}>
                  <td style={td}>{row.testType}</td>
                  <td style={td}><Tag kind={TRIGGER_TAG[row.condition]}>{TRIGGER_OPTIONS.find(o => o.value === row.condition)?.label}</Tag></td>
                  <td style={td}>
                    <Btn kind="ghost" small onClick={() => { if (expandedRow === row.id) { setExpandedRow(null); } else { setExpandedRow(row.id); setEditCondition(row.condition); } }}>
                      {expandedRow === row.id ? '▲ Close' : '▼ Edit'}
                    </Btn>
                  </td>
                </tr>
                {expandedRow === row.id && (
                  <tr key={`${row.id}-exp`}>
                    <td colSpan={3} style={{ padding: 0, borderBottom: `1px solid ${C.gray20}` }}>
                      <div style={{ padding: '16px 24px', background: '#f0f4ff', borderTop: `2px solid ${C.blue60}` }}>
                        <div style={{ maxWidth: 300, marginBottom: 14 }}>
                          <SelectField label="SMS Trigger" value={editCondition} onChange={e => setEditCondition(e.target.value)} options={TRIGGER_OPTIONS} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Btn kind="primary" small onClick={() => saveRow(row.id)}>Save</Btn>
                          <Btn kind="ghost" small onClick={() => setExpandedRow(null)}>Cancel</Btn>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ─── Page: Message Template ───────────────────────────────────────────────────
function PageTemplate() {
  const DEFAULT = 'OpenELIS Result: {{test_name}} for {{patient_id}} — {{result}}. Facility: {{facility}}. Validated: {{validated_at}}. Ref: {{accession_number}}';
  const [template, setTemplate] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);

  const len = template.length;
  const segs = Math.ceil(len / 160) || 1;
  const isOver = len > 480;
  const isWarn = len > 160 && !isOver;
  const preview = Object.entries(EXAMPLE_VALS).reduce((m, [k, v]) => m.split(k).join(v), template);

  return (
    <SectionCard>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 8 }}>Message Template</h2>
      <p style={{ fontSize: 13, color: C.gray70, marginBottom: 24 }}>One template is used for all outbound notifications. Use merge fields to personalise the message.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ maxWidth: 640 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>Template</label>
          <textarea
            value={template} onChange={e => setTemplate(e.target.value)} rows={4}
            style={{
              width: '100%', padding: '10px 12px', boxSizing: 'border-box', resize: 'vertical',
              border: `2px solid ${isOver ? C.red60 : isWarn ? C.yellow70 : C.gray30}`,
              borderRadius: 2, fontSize: 14, fontFamily: 'monospace', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: isOver ? C.red60 : isWarn ? C.yellow70 : 'transparent' }}>
              {isOver ? '⚠ Exceeds 480-character limit — cannot save' : isWarn ? `⚠ ${segs} SMS segments will be sent` : '.'}
            </span>
            <span style={{ fontSize: 11, color: isOver ? C.red60 : C.gray50 }}>{len} / 480 ({segs} segment{segs > 1 ? 's' : ''})</span>
          </div>
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.gray70, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Insert Merge Field</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MERGE_FIELDS.map(f => (
              <Btn key={f.token} kind="tertiary" small onClick={() => setTemplate(t => t + f.token)}>+ {f.label}</Btn>
            ))}
          </div>
        </div>

        <div style={{ background: C.gray10, border: `1px solid ${C.border}`, borderRadius: 4, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.gray50, marginBottom: 8 }}>
            Preview with example values
          </p>
          <p style={{ fontSize: 13, fontFamily: 'monospace', color: C.gray100, whiteSpace: 'pre-wrap', margin: 0 }}>
            {preview || '(template is empty)'}
          </p>
          <p style={{ fontSize: 11, color: C.gray50, marginTop: 8, marginBottom: 0 }}>{preview.length} characters</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="primary" disabled={isOver} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save</Btn>
        </div>
        {saved && <Notif kind="success" title="Message template saved." onClose={() => setSaved(false)} />}
      </div>
    </SectionCard>
  );
}

// ─── Page: Retry Policy ───────────────────────────────────────────────────────
function PageRetryPolicy() {
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryInterval, setRetryInterval] = useState(15);
  const [logRetention, setLogRetention] = useState(90);
  const [saved, setSaved] = useState(false);

  const NumInput = ({ label, value, onChange, min, max, helper }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} style={{ padding: '8px 12px', border: `1px solid ${C.gray30}`, background: C.gray10, cursor: 'pointer', borderRadius: 2, fontSize: 14 }}>−</button>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max}
          style={{ width: 70, padding: '8px 10px', textAlign: 'center', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 14 }} />
        <button onClick={() => onChange(Math.min(max, value + 1))} style={{ padding: '8px 12px', border: `1px solid ${C.gray30}`, background: C.gray10, cursor: 'pointer', borderRadius: 2, fontSize: 14 }}>+</button>
      </div>
      {helper && <span style={{ fontSize: 11, color: C.gray50 }}>{helper}</span>}
    </div>
  );

  return (
    <SectionCard>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 8 }}>Retry Policy</h2>
      <p style={{ fontSize: 13, color: C.gray70, marginBottom: 28 }}>Configure automatic retry behaviour for failed SMS deliveries.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', gap: 48 }}>
          <NumInput label="Maximum Retry Attempts" value={maxRetries} onChange={setMaxRetries} min={1} max={10}
            helper="Auto-retries before marking as Failed Permanent (default: 3)" />
          <NumInput label="Retry Interval (minutes)" value={retryInterval} onChange={setRetryInterval} min={5} max={120}
            helper="Wait between retry attempts (default: 15 min)" />
        </div>
        <div style={{ borderTop: `1px solid ${C.gray20}`, paddingTop: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.gray90, marginBottom: 16 }}>Log Retention</h3>
          <NumInput label="Log Retention (days)" value={logRetention} onChange={setLogRetention} min={30} max={365}
            helper="Delivered and skipped entries purged nightly after this period. Failed entries kept an additional 30 days." />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save</Btn>
        </div>
        {saved && <Notif kind="success" title="Retry policy saved." onClose={() => setSaved(false)} />}
      </div>
    </SectionCard>
  );
}

// ─── Page: Delivery Log ───────────────────────────────────────────────────────
function PageDeliveryLog() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [retried, setRetried] = useState([]);

  const filtered = statusFilter === 'ALL' ? DELIVERY_LOG : DELIVERY_LOG.filter(r => r.status === statusFilter);
  const failedCount = DELIVERY_LOG.filter(r => r.status === 'FAILED_PERMANENT').length;

  const th = { padding: '10px 12px', fontSize: 12, fontWeight: 700, color: C.gray70, textAlign: 'left', borderBottom: `2px solid ${C.gray20}`, background: C.gray10, whiteSpace: 'nowrap' };
  const td = { padding: '12px', fontSize: 12, borderBottom: `1px solid ${C.gray20}`, verticalAlign: 'middle' };

  return (
    <SectionCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 4 }}>SMS Delivery Log</h2>
          <p style={{ fontSize: 13, color: C.gray70 }}>All SMS dispatch attempts. Failed entries can be retried manually.</p>
        </div>
      </div>

      {failedCount > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Notif kind="error" title={`${failedCount} delivery failure${failedCount > 1 ? 's' : ''} require attention.`} subtitle="These entries have exhausted all automatic retry attempts." />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
        <div style={{ width: 220 }}>
          <SelectField label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[
            { value: 'ALL',              label: 'All statuses' },
            { value: 'DELIVERED',        label: 'Delivered' },
            { value: 'FAILED_PERMANENT', label: 'Failed' },
            { value: 'RETRYING',         label: 'Retrying' },
            { value: 'PENDING',          label: 'Pending' },
            { value: 'SKIPPED_NO_PHONE', label: 'Skipped (No Phone)' },
          ]} />
        </div>
      </div>

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              {['Accession #', 'Test Type', 'Provider', 'Phone', 'Result', 'Status', 'Attempts', 'Last Attempt', ''].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id} style={{ background: row.status === 'FAILED_PERMANENT' && !retried.includes(row.id) ? '#fff8f8' : C.white }}>
                <td style={td}><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.accession}</span></td>
                <td style={td}>{row.testType}</td>
                <td style={td}>{row.provider}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{row.phone}</td>
                <td style={{ ...td, fontWeight: 600, color: ['MTB DETECTED','REACTIVE','CRITICAL'].some(k => row.result.includes(k)) ? C.red60 : C.gray100 }}>
                  {row.result}
                </td>
                <td style={td}><Tag kind={STATUS_TAG[row.status]}>{STATUS_LABEL[row.status]}</Tag></td>
                <td style={{ ...td, textAlign: 'center' }}>{row.attempts}</td>
                <td style={{ ...td, color: C.gray50, whiteSpace: 'nowrap' }}>{row.lastAttempt}</td>
                <td style={td}>
                  {row.status === 'FAILED_PERMANENT' && !retried.includes(row.id)
                    ? <Btn kind="secondary" small onClick={() => setRetried(p => [...p, row.id])}>⟳ Retry</Btn>
                    : retried.includes(row.id) ? <Tag kind="blue">Pending</Tag> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ─── OpenELIS Shell + Left Sidebar ───────────────────────────────────────────

const NAV = [
  { key: 'home',          label: 'Home',           icon: '⌂' },
  { key: 'patient',       label: 'Patient',         icon: '👤' },
  { key: 'order',         label: 'Order',           icon: '📋' },
  { key: 'results',       label: 'Results',         icon: '🧪' },
  {
    key: 'admin', label: 'Administration', icon: '⚙',
    children: [
      { key: 'admin-general',  label: 'General Config' },
      { key: 'admin-users',    label: 'Users & Roles' },
      { key: 'admin-catalog',  label: 'Test Catalog' },
      { key: 'admin-sites',    label: 'Sites & Labs' },
      {
        key: 'admin-notifications', label: 'Notifications',
        children: [
          { key: 'sms-connection', label: 'SMS — Connection' },
          { key: 'sms-triggers',   label: 'SMS — Test Triggers' },
          { key: 'sms-template',   label: 'SMS — Message Template' },
          { key: 'sms-retry',      label: 'SMS — Retry Policy' },
          { key: 'sms-log',        label: 'SMS — Delivery Log' },
        ],
      },
    ],
  },
  { key: 'reports', label: 'Reports', icon: '📊' },
];

const PAGE_COMPONENTS = {
  'sms-connection': PageConnection,
  'sms-triggers':   PageTriggers,
  'sms-template':   PageTemplate,
  'sms-retry':      PageRetryPolicy,
  'sms-log':        PageDeliveryLog,
};

const BREADCRUMBS = {
  'sms-connection': ['Administration', 'Notifications', 'Connection'],
  'sms-triggers':   ['Administration', 'Notifications', 'Test Triggers'],
  'sms-template':   ['Administration', 'Notifications', 'Message Template'],
  'sms-retry':      ['Administration', 'Notifications', 'Retry Policy'],
  'sms-log':        ['Administration', 'Notifications', 'Delivery Log'],
};

export default function App() {
  const [activePage, setActivePage] = useState('sms-connection');
  const [expandedNav, setExpandedNav] = useState(['admin', 'admin-notifications']);

  const toggleNav = (key) => {
    setExpandedNav(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const isSmsPage = (key) => key.startsWith('sms-');
  const PageContent = PAGE_COMPONENTS[activePage] || PageConnection;
  const crumbs = BREADCRUMBS[activePage] || [];

  const renderNavItem = (item, depth = 0) => {
    const isActive = activePage === item.key;
    const isExpanded = expandedNav.includes(item.key);
    const hasChildren = item.children?.length > 0;
    const isSmsSubmenu = isSmsPage(item.key);

    return (
      <div key={item.key}>
        <button
          onClick={() => {
            if (hasChildren) { toggleNav(item.key); }
            else { setActivePage(item.key); }
          }}
          style={{
            width: '100%', textAlign: 'left', padding: `10px ${12 + depth * 16}px`,
            fontSize: depth === 0 ? 14 : depth === 1 ? 13 : 12,
            fontWeight: isActive ? 700 : 400,
            background: isActive ? C.sidebarActive : 'transparent',
            color: isActive ? C.white : isSmsSubmenu ? '#a8d0ff' : C.sidebarText,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: 10, borderLeft: isActive ? `3px solid ${C.white}` : '3px solid transparent',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.sidebarHover; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
          {item.icon && <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>}
          <span style={{ flex: 1 }}>{item.label}</span>
          {hasChildren && <span style={{ fontSize: 10, color: C.sidebarSubText }}>{isExpanded ? '▲' : '▼'}</span>}
        </button>
        {hasChildren && isExpanded && (
          <div style={{ borderLeft: depth === 0 ? `2px solid #444` : 'none', marginLeft: depth === 0 ? 20 : 0 }}>
            {item.children.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Top navigation bar ── */}
      <div style={{
        background: C.topBarBg, height: 48, display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 16, flexShrink: 0, zIndex: 100,
        borderBottom: `1px solid ${C.gray90}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, background: C.blue60, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: C.white, fontSize: 12, fontWeight: 800 }}>OE</span>
          </div>
          <span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>OpenELIS Global</span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ color: C.gray30, fontSize: 12 }}>Port Moresby National Lab</span>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.blue60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>CI</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left sidebar ── */}
        <div style={{
          width: 240, background: C.sidebarBg, flexShrink: 0,
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 0' }}>
            {NAV.map(item => renderNavItem(item, 0))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: C.gray10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 32px' }}>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20, fontSize: 12, color: C.gray50 }}>
              {crumbs.map((c, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {i > 0 && <span style={{ color: C.gray30 }}>/</span>}
                  <span style={{ color: i === crumbs.length - 1 ? C.gray90 : C.gray50 }}>{c}</span>
                </span>
              ))}
            </div>

            <PageContent />
          </div>
        </div>
      </div>
    </div>
  );
}
