/**
 * X-01 — Referral-Out Notification
 * Addendum to Existing Referral Out Module
 *
 * SCOPE ANNOTATION CONVENTION (same as S-03b / S-07b):
 *   Gold dashed border + "X-01 NEW" badge  → new in this addendum
 *   Dimmed (72% opacity) + "EXISTING" badge → existing OpenELIS content shown for context only
 *
 * Three scenes:
 *   1. Combined Triggers Page   — new REFERRAL_OUT row added
 *   2. Combined Templates Page  — new Referral Out template editor
 *   3. Sent Messages Tab        — new "Referral Out" type row
 */

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  gold20:  '#fdd13a', gold40: '#f1c21b', gold60: '#b28600',
  blue60:  '#0f62fe', blue70: '#0043ce', blue10: '#edf5ff', blue20: '#d0e2ff',
  green50: '#defbe6', green60: '#198038',
  red10:   '#fff1f1', red60: '#da1e28',
  teal10:  '#d9fbfb', teal60: '#007d79',
  yellow10: '#fdf4c4', yellow70: '#8e6a00',
  gray10:  '#f4f4f4', gray20: '#e0e0e0', gray30: '#c6c6c6',
  gray50:  '#8d8d8d', gray70: '#525252', gray90: '#262626', gray100: '#161616',
  white:   '#ffffff', border: '#e0e0e0',
  sidebarBg: '#262626', sidebarText: '#f4f4f4',
  topBarBg: '#161616',
};

const TAG_STYLES = {
  green:  { bg: C.green50,  color: C.green60,  border: '#a7f0ba' },
  red:    { bg: C.red10,    color: C.red60,    border: '#ffa4a9' },
  teal:   { bg: C.teal10,   color: C.teal60,   border: '#9ef0f0' },
  blue:   { bg: C.blue10,   color: C.blue70,   border: C.blue20 },
  gray:   { bg: C.gray10,   color: C.gray70,   border: C.gray30 },
  gold:   { bg: '#fdf4c4',  color: C.gold60,   border: C.gold40 },
  yellow: { bg: C.yellow10, color: C.yellow70, border: '#f1c21b' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE ANNOTATION PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function NewBadge({ label = 'X-01 NEW' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: C.gold40, color: C.gray100,
      fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
      padding: '2px 7px', borderRadius: 3,
      letterSpacing: '0.04em',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
    }}>
      {label}
    </span>
  );
}

function ExistingBadge({ label = 'EXISTING' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: C.gray20, color: C.gray70,
      fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
      padding: '2px 7px', borderRadius: 3,
      letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  );
}

function NewRegion({ children, label = 'X-01 NEW', style = {} }) {
  return (
    <div style={{
      position: 'relative',
      border: `2px dashed ${C.gold40}`,
      borderRadius: 6,
      padding: '1.25rem 1rem 1rem',
      background: 'rgba(253,209,58,0.04)',
      ...style,
    }}>
      <span style={{
        position: 'absolute', top: -10, left: 12,
        background: C.white, padding: '0 6px',
      }}>
        <NewBadge label={label} />
      </span>
      {children}
    </div>
  );
}

function ExistingRegion({ children, label = 'EXISTING', style = {} }) {
  return (
    <div style={{
      position: 'relative',
      border: `1.5px solid ${C.gray20}`,
      borderRadius: 4,
      padding: '1rem',
      opacity: 0.72,
      background: C.white,
      ...style,
    }}>
      <span style={{
        position: 'absolute', top: -10, left: 12,
        background: C.white, padding: '0 6px',
      }}>
        <ExistingBadge label={label} />
      </span>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Tag({ kind = 'gray', children }) {
  const s = TAG_STYLES[kind] || TAG_STYLES.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Btn({ children, kind = 'primary', onClick, disabled, small, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '6px 12px' : '10px 20px',
    borderRadius: 2, fontSize: small ? 12 : 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
  };
  const variants = {
    primary:   { ...base, background: disabled ? C.gray30 : C.blue60, color: C.white },
    secondary: { ...base, background: C.gray10, color: C.gray90, border: `1px solid ${C.gray30}` },
    ghost:     { ...base, background: 'transparent', color: C.blue60 },
    tertiary:  { ...base, background: 'transparent', color: C.blue60, border: `1px solid ${C.blue60}` },
  };
  return <button style={{ ...(variants[kind] || base), ...style }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Toggle({ checked, onChange, label, id }) {
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        style={{
          position: 'relative', width: 40, height: 22,
          background: checked ? C.blue60 : C.gray30,
          borderRadius: 11, transition: 'background 0.2s',
        }}
        onClick={() => onChange(!checked)}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16,
          borderRadius: '50%', background: C.white,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      {label && <span style={{ fontSize: 13, color: checked ? C.blue60 : C.gray70, fontWeight: checked ? 600 : 400 }}>{checked ? 'On' : 'Off'}</span>}
    </label>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 18, height: 18, borderRadius: 2,
          border: checked ? 'none' : `2px solid ${C.gray50}`,
          background: checked ? C.blue60 : C.white,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked && <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>✓</span>}
      </div>
      {label && <span style={{ color: C.gray90 }}>{label}</span>}
    </label>
  );
}

// Mini chrome: OpenELIS-style page shell
function PageShell({ title, subtitle, children }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", background: C.gray10, minHeight: '100%' }}>
      {/* Top bar */}
      <div style={{ background: C.topBarBg, height: 48, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <span style={{ color: C.gray10, fontWeight: 700, fontSize: 15, letterSpacing: '0.02em' }}>OpenELIS Global</span>
        <span style={{ color: C.gray50, fontSize: 13, marginLeft: 24 }}>Admin → Notification Configuration</span>
      </div>
      {/* Page header */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '20px 32px 16px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.gray100 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: C.gray70, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {/* Content */}
      <div style={{ padding: 32 }}>{children}</div>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.gray100 }}>{title}</div>
      {description && <div style={{ fontSize: 12, color: C.gray70, marginTop: 4 }}>{description}</div>}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: `1px solid ${C.border}`, margin: '24px 0' }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — COMBINED TRIGGERS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function SceneTriggers() {
  const [lhEnabled, setLhEnabled]        = useState(true);
  const [referralEnabled, setRefEnabled] = useState(false);

  const [lhChannels, setLhChannels]   = useState({ email: true, whatsapp: true });
  const [refChannels, setRefChannels] = useState({ email: false, whatsapp: false });

  const [lhRecip, setLhRecip]   = useState({ ordering: true, submitting: false });
  const [refRecip, setRefRecip] = useState({ ordering: true, submitting: false });

  function ChannelCells({ state, onChange, enabled }) {
    return (
      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: enabled ? 1 : 0.4 }}>
          <Checkbox checked={state.email}    onChange={v => onChange({ ...state, email: v })}    label="Email" />
          <Checkbox checked={state.whatsapp} onChange={v => onChange({ ...state, whatsapp: v })} label="WhatsApp" />
        </div>
      </td>
    );
  }

  function RecipCells({ state, onChange, enabled }) {
    return (
      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: enabled ? 1 : 0.4 }}>
          <Checkbox checked={state.ordering}   onChange={v => onChange({ ...state, ordering: v })}   label="Ordering Provider" />
          <Checkbox checked={state.submitting} onChange={v => onChange({ ...state, submitting: v })} label="Submitting User" />
        </div>
      </td>
    );
  }

  const thStyle = {
    padding: '10px 16px', textAlign: 'left', fontSize: 12,
    fontWeight: 700, color: C.gray70, background: C.gray10,
    borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap',
  };

  const tdBaseStyle = {
    padding: '14px 16px', verticalAlign: 'middle',
    borderBottom: `1px solid ${C.border}`, fontSize: 13,
  };

  return (
    <PageShell
      title="Notification Trigger Configuration"
      subtitle="Enable or disable notification triggers, select delivery channels, and configure recipient types per event."
    >
      <SectionHeader
        title="Active Triggers"
        description="Each row controls one notification event type. Toggle On to activate. Channel and recipient settings only apply when the trigger is enabled."
      />

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Trigger</th>
              <th style={thStyle}>Event Code</th>
              <th style={thStyle}>Enabled</th>
              <th style={thStyle}>Channels</th>
              <th style={thStyle}>Recipients</th>
              <th style={thStyle}>Per-Lab-Unit Override</th>
            </tr>
          </thead>
          <tbody>
            {/* ── EXISTING: LH_COMPLETED ── */}
            <tr style={{ background: C.white }}>
              <td style={{ ...tdBaseStyle, opacity: 0.72 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>LH Completed</span>
                  <ExistingBadge label="S-06b EXISTING" />
                </div>
                <div style={{ fontSize: 11, color: C.gray50, marginTop: 3 }}>
                  Sent when Laporan Hasil is finalized
                </div>
              </td>
              <td style={{ ...tdBaseStyle, fontFamily: 'monospace', fontSize: 12, opacity: 0.72 }}>LH_COMPLETED</td>
              <td style={{ ...tdBaseStyle, opacity: 0.72 }}>
                <Toggle checked={lhEnabled} onChange={setLhEnabled} id="lh-toggle" />
              </td>
              <ChannelCells state={lhChannels} onChange={setLhChannels} enabled={lhEnabled} />
              <RecipCells   state={lhRecip}    onChange={setLhRecip}    enabled={lhEnabled} />
              <td style={{ ...tdBaseStyle, opacity: 0.72 }}>
                <Btn kind="ghost" small>Configure</Btn>
              </td>
            </tr>

            {/* ── NEW: REFERRAL_OUT ── */}
            <tr style={{ background: 'rgba(253,209,58,0.06)' }}>
              <td style={{ ...tdBaseStyle, borderLeft: `3px solid ${C.gold40}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Referral Out</span>
                  <NewBadge />
                </div>
                <div style={{ fontSize: 11, color: C.gray50, marginTop: 3 }}>
                  Sent when a sample is referred to an external laboratory
                </div>
              </td>
              <td style={{ ...tdBaseStyle, fontFamily: 'monospace', fontSize: 12, color: C.gold60, borderLeft: 'none' }}>
                REFERRAL_OUT
              </td>
              <td style={tdBaseStyle}>
                <Toggle checked={referralEnabled} onChange={setRefEnabled} id="ref-toggle" />
                {!referralEnabled && (
                  <div style={{ fontSize: 11, color: C.gray50, marginTop: 4 }}>
                    Defaults OFF — must be enabled explicitly
                  </div>
                )}
                {referralEnabled && (
                  <div style={{ fontSize: 11, color: C.green60, marginTop: 4 }}>Active</div>
                )}
              </td>
              <ChannelCells state={refChannels} onChange={setRefChannels} enabled={referralEnabled} />
              <RecipCells   state={refRecip}    onChange={setRefRecip}    enabled={referralEnabled} />
              <td style={tdBaseStyle}>
                <Btn kind="ghost" small>Configure</Btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Callout */}
      <div style={{
        marginTop: 24, padding: '14px 16px', borderRadius: 4,
        borderLeft: `4px solid ${C.gold40}`, background: '#fdf4c4',
        fontSize: 13, color: C.gray90,
      }}>
        <strong>X-01 Note:</strong> The <code style={{ fontFamily: 'monospace', fontSize: 12 }}>REFERRAL_OUT</code> trigger is dispatched
        through the same async queue as <code style={{ fontFamily: 'monospace', fontSize: 12 }}>LH_COMPLETED</code> (OGC-437 §3.2),
        including 3× retry and delivery logging. It fires once per saved referral — if one order has referrals
        to two different labs, two notifications are sent.
      </div>

      <Divider />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Btn kind="secondary">Cancel</Btn>
        <Btn kind="primary">Save Configuration</Btn>
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — COMBINED TEMPLATES PAGE
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_REFERRAL_TEMPLATE = `Your sample {{sample_id}} has been referred to {{referred_lab}} for the following tests: {{referred_tests}}.

Referral date: {{referral_date}}.
Expected results by: {{expected_return}}.

For inquiries, contact {{lab_name}} at {{lab_phone}}.`;

const DEFAULT_LH_TEMPLATE = `Your Laporan Hasil (report) for order {{order_id}} is ready.

Tests: {{test_names}}
Validated by: {{validated_by}} on {{validation_date}}.

Please contact {{lab_name}} at {{lab_phone}} for questions.`;

const MERGE_FIELDS_REFERRAL = [
  { field: '{{order_id}}',       desc: 'Order accession number' },
  { field: '{{sample_id}}',      desc: 'Sample / specimen ID (lab number)' },
  { field: '{{referred_lab}}',   desc: 'Name of the external laboratory receiving the referral' },
  { field: '{{referred_tests}}', desc: 'Comma-separated list of test names in this referral' },
  { field: '{{referral_date}}',  desc: 'Date the referral was created (lab locale format)' },
  { field: '{{expected_return}}',desc: 'Expected result return date (blank if not set)' },
  { field: '{{lab_name}}',       desc: "Sending laboratory's name" },
  { field: '{{lab_phone}}',      desc: "Sending laboratory's contact phone" },
];

const MERGE_FIELDS_LH = [
  { field: '{{order_id}}',        desc: 'Order accession number' },
  { field: '{{test_names}}',      desc: 'Test names on the LH' },
  { field: '{{validated_by}}',    desc: 'Validating user' },
  { field: '{{validation_date}}', desc: 'Validation date' },
  { field: '{{lab_name}}',        desc: "Laboratory's name" },
  { field: '{{lab_phone}}',       desc: "Laboratory's contact phone" },
];

function SceneTemplates() {
  const [activeTemplate, setActiveTemplate] = useState('REFERRAL_OUT');
  const [referralBody, setReferralBody]     = useState(DEFAULT_REFERRAL_TEMPLATE);
  const [lhBody, setLhBody]                 = useState(DEFAULT_LH_TEMPLATE);
  const [referralChannel, setRefChannel]    = useState('EMAIL');
  const [lhChannel, setLhChannel]           = useState('EMAIL');
  const [saved, setSaved]                   = useState(false);

  const isReferral = activeTemplate === 'REFERRAL_OUT';
  const body       = isReferral ? referralBody : lhBody;
  const setBody    = isReferral ? setReferralBody : setLhBody;
  const channel    = isReferral ? referralChannel : lhChannel;
  const setChannel = isReferral ? setRefChannel : setLhChannel;
  const fields     = isReferral ? MERGE_FIELDS_REFERRAL : MERGE_FIELDS_LH;

  const CHANNELS = ['EMAIL', 'WHATSAPP'];

  const tabStyle = (active) => ({
    padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400,
    cursor: 'pointer', border: 'none', background: 'transparent',
    borderBottom: active ? `3px solid ${C.blue60}` : '3px solid transparent',
    color: active ? C.blue60 : C.gray70,
    transition: 'all 0.15s',
  });

  function insertField(f) {
    setBody(b => b + ' ' + f);
  }

  return (
    <PageShell
      title="Notification Template Configuration"
      subtitle="Compose message templates for each notification event type. Templates are free text with merge fields."
    >
      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${C.border}`,
        marginBottom: 24, background: C.white,
        borderRadius: '4px 4px 0 0',
        border: `1px solid ${C.border}`, borderBottomColor: 'transparent',
      }}>
        <button style={tabStyle(activeTemplate === 'LH_COMPLETED')} onClick={() => { setActiveTemplate('LH_COMPLETED'); setSaved(false); }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            LH Completed
            <ExistingBadge label="S-06b" />
          </span>
        </button>
        <button style={tabStyle(activeTemplate === 'REFERRAL_OUT')} onClick={() => { setActiveTemplate('REFERRAL_OUT'); setSaved(false); }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Referral Out
            <NewBadge />
          </span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Left: editor */}
        <div>
          {isReferral ? (
            <NewRegion label="X-01 NEW — Referral Out Template">
              <TemplateEditor
                label="Referral Out — Message Template"
                description="Sent to the customer contact (Ordering Provider) and/or internal staff (Submitting User) when a referral is saved."
                body={body}
                setBody={setBody}
                channel={channel}
                setChannel={setChannel}
                channels={CHANNELS}
                saved={saved}
                setSaved={setSaved}
              />
            </NewRegion>
          ) : (
            <ExistingRegion label="S-06b EXISTING">
              <TemplateEditor
                label="LH Completed — Message Template"
                description="Sent when a Laporan Hasil is finalized and validated."
                body={body}
                setBody={setBody}
                channel={channel}
                setChannel={setChannel}
                channels={CHANNELS}
                saved={saved}
                setSaved={setSaved}
              />
            </ExistingRegion>
          )}
        </div>

        {/* Right: merge field reference */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray100, marginBottom: 12 }}>Available Merge Fields</div>
          {isReferral && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fdf4c4', borderRadius: 3, fontSize: 11, color: C.gray70 }}>
              Fields below are specific to the <strong>REFERRAL_OUT</strong> event. Click a field to insert it at the end of the template.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {fields.map(({ field, desc }) => (
              <div
                key={field}
                onClick={() => insertField(field)}
                style={{
                  padding: '6px 10px', borderRadius: 3, cursor: 'pointer',
                  background: C.gray10, border: `1px solid ${C.gray20}`,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.blue10}
                onMouseLeave={e => e.currentTarget.style.background = C.gray10}
              >
                <code style={{ fontFamily: 'monospace', fontSize: 11, color: isReferral ? C.gold60 : C.blue70 }}>{field}</code>
                <div style={{ fontSize: 11, color: C.gray50, marginTop: 2 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: C.gray50 }}>
            If <code style={{ fontFamily: 'monospace' }}>{'{{expected_return}}'}</code> is not set on the referral, it renders blank — no error.
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function TemplateEditor({ label, description, body, setBody, channel, setChannel, channels, saved, setSaved }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: C.gray100 }}>{label}</label>
        {description && <div style={{ fontSize: 12, color: C.gray70, marginTop: 4 }}>{description}</div>}
      </div>

      {/* Channel selector */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>Channel</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {channels.map(ch => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              style={{
                padding: '6px 16px', borderRadius: 2, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: `1.5px solid ${channel === ch ? C.blue60 : C.gray30}`,
                background: channel === ch ? C.blue10 : C.white,
                color: channel === ch ? C.blue60 : C.gray70,
              }}
            >
              {ch === 'EMAIL' ? '✉ Email' : '💬 WhatsApp'}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.gray50, marginTop: 4 }}>
          Each channel has its own template. Switch channels to edit separately.
        </div>
      </div>

      {/* Text body */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>
          Message Body
        </label>
        <textarea
          value={body}
          onChange={e => { setBody(e.target.value); setSaved(false); }}
          rows={9}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px', fontSize: 13, fontFamily: 'monospace',
            border: `1px solid ${C.gray30}`, borderRadius: 2,
            resize: 'vertical', color: C.gray100, lineHeight: 1.6,
          }}
        />
        <div style={{ fontSize: 11, color: C.gray50, marginTop: 4 }}>
          Free text with merge fields. This template is not managed by i18n — edit it directly.
        </div>
      </div>

      {/* Preview */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.gray70, marginBottom: 6 }}>Rendered Preview</div>
        <div style={{
          padding: '12px 14px', background: C.gray10, borderRadius: 2,
          fontSize: 13, lineHeight: 1.7, color: C.gray90,
          border: `1px solid ${C.gray20}`, whiteSpace: 'pre-wrap',
          minHeight: 80,
        }}>
          {body
            .replace('{{sample_id}}', 'ENV-2026-00841')
            .replace('{{order_id}}', 'ENV-2026-00841')
            .replace('{{referred_lab}}', 'Pusat Lab Lingkungan Hidup')
            .replace('{{referred_tests}}', 'Mercury (Hg), Total Coliform')
            .replace('{{referral_date}}', '20 Apr 2026')
            .replace('{{expected_return}}', '27 Apr 2026')
            .replace('{{lab_name}}', 'BLHD Kota Bogor')
            .replace('{{lab_phone}}', '+62-251-8321-000')
            .replace('{{test_names}}', 'Mercury, Lead, Cadmium')
            .replace('{{validated_by}}', 'Dr. Siti Nurhayati')
            .replace('{{validation_date}}', '20 Apr 2026')
          }
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Btn kind="secondary" small>Reset to Default</Btn>
        <Btn kind="primary" small onClick={() => setSaved(true)}>
          {saved ? '✓ Saved' : 'Save Template'}
        </Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — SENT MESSAGES TAB (extended with Referral Out type)
// ─────────────────────────────────────────────────────────────────────────────

const MESSAGES = [
  {
    id: 'm1', dateTime: '20 Apr 2026 09:14', type: 'LH Completed',
    typeTag: 'teal', recipient: 'PT Tirta Kencana', contact: 'tirta@…',
    channels: [{ ch: 'Email', ok: true }, { ch: 'WhatsApp', ok: true }],
    status: 'SENT', ref: 'LH-2026-00841', isNew: false,
  },
  {
    id: 'm2', dateTime: '20 Apr 2026 08:55', type: 'Referral Out',
    typeTag: 'gold', recipient: 'CV Alam Kencana', contact: 'cv.alam@…',
    channels: [{ ch: 'Email', ok: true }, { ch: 'WhatsApp', ok: false }],
    status: 'SENT', ref: 'ENV-2026-00841', isNew: true,
  },
  {
    id: 'm3', dateTime: '19 Apr 2026 14:31', type: 'Referral Out',
    typeTag: 'gold', recipient: 'Dinas Lingkungan Kota Bogor', contact: 'dinkes@…',
    channels: [{ ch: 'Email', ok: false }, { ch: 'WhatsApp', ok: true }],
    status: 'SENT', ref: 'ENV-2026-00838', isNew: true,
  },
  {
    id: 'm4', dateTime: '19 Apr 2026 11:02', type: 'LH Completed',
    typeTag: 'teal', recipient: 'PT Agro Makmur', contact: 'agro@…',
    channels: [{ ch: 'Email', ok: false }, { ch: 'WhatsApp', ok: false }],
    status: 'FAILED', ref: 'LH-2026-00829', isNew: false,
  },
  {
    id: 'm5', dateTime: '18 Apr 2026 16:10', type: 'Referral Out',
    typeTag: 'gold', recipient: 'PT Tirta Kencana', contact: 'tirta@…',
    channels: [{ ch: 'Email', ok: false }, { ch: 'WhatsApp', ok: false }],
    status: 'FAILED', ref: 'ENV-2026-00829', isNew: true,
  },
];

const STATUS_TAG = {
  SENT:   { kind: 'green',  label: 'Sent' },
  FAILED: { kind: 'red',    label: 'Failed' },
  RESENT: { kind: 'teal',   label: 'Resent' },
};

function SceneSentMessages() {
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const TYPE_OPTS = ['ALL', 'LH Completed', 'Referral Out'];
  const STATUS_OPTS = ['ALL', 'SENT', 'FAILED', 'RESENT'];

  const filtered = MESSAGES.filter(m =>
    (filterType === 'ALL' || m.type === filterType) &&
    (filterStatus === 'ALL' || m.status === filterStatus)
  );

  const selectStyle = {
    padding: '6px 10px', border: `1px solid ${C.gray30}`, borderRadius: 2,
    fontSize: 13, background: C.white, cursor: 'pointer', color: C.gray90,
  };

  const thStyle = {
    padding: '10px 16px', textAlign: 'left', fontSize: 12,
    fontWeight: 700, color: C.gray70, background: C.gray10,
    borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap',
  };

  return (
    <PageShell
      title="Sent Messages"
      subtitle="All outbound notifications dispatched by OpenELIS, across all trigger types and channels."
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: C.gray70, whiteSpace: 'nowrap' }}>Type:</label>
          <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
            {TYPE_OPTS.map(o => <option key={o} value={o}>{o === 'ALL' ? 'All Types' : o}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: C.gray70, whiteSpace: 'nowrap' }}>Status:</label>
          <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {STATUS_OPTS.map(o => <option key={o} value={o}>{o === 'ALL' ? 'All Statuses' : o}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 13, color: C.gray50, marginLeft: 8 }}>
          {filtered.length} of {MESSAGES.length} messages
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <NewBadge label={`X-01 NEW — "Referral Out" type added to filter + table`} />
        </div>
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Date / Time</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Recipient</th>
              <th style={thStyle}>Channels</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Reference</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const tdStyle = {
                padding: '12px 16px', verticalAlign: 'middle',
                borderBottom: `1px solid ${C.border}`, fontSize: 13,
                background: m.isNew ? 'rgba(253,209,58,0.05)' : C.white,
              };
              const s = STATUS_TAG[m.status] || STATUS_TAG.SENT;
              return (
                <tr key={m.id}>
                  <td style={{ ...tdStyle, color: C.gray70, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {m.dateTime}
                  </td>
                  <td style={{ ...tdStyle, borderLeft: m.isNew ? `3px solid ${C.gold40}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag kind={m.typeTag}>{m.type}</Tag>
                      {m.isNew && <NewBadge />}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{m.recipient}</div>
                    <div style={{ fontSize: 11, color: C.gray50 }}>{m.contact}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {m.channels.map(({ ch, ok }) => (
                        <span key={ch} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, padding: '2px 7px', borderRadius: 10,
                          background: ok ? C.green50 : C.red10,
                          color: ok ? C.green60 : C.red60,
                          border: `1px solid ${ok ? '#a7f0ba' : '#ffa4a9'}`,
                          fontWeight: 600,
                        }}>
                          {ok ? '✓' : '✕'} {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={tdStyle}><Tag kind={s.kind}>{s.label}</Tag></td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: C.blue60 }}>
                    {m.ref}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn kind="ghost" small>View Log</Btn>
                      {m.status === 'FAILED' && <Btn kind="tertiary" small>Resend</Btn>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: C.gray50, fontSize: 13 }}>
                  No messages match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div style={{
        marginTop: 20, padding: '12px 16px', borderRadius: 4,
        borderLeft: `4px solid ${C.gold40}`, background: '#fdf4c4',
        fontSize: 12, color: C.gray90,
      }}>
        <strong>X-01 adds:</strong> "Referral Out" as a new Type in the filter dropdown and as a new row type in the table.
        The <Tag kind="gold">Referral Out</Tag> rows use the same delivery log, Resend action, and status tracking
        as existing LH Completed rows — no structural changes to the Sent Messages tab.
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────

const SCENES = [
  { id: 1, label: 'Combined Triggers Page', sub: 'New REFERRAL_OUT row (default OFF)' },
  { id: 2, label: 'Combined Templates Page', sub: 'New Referral Out template editor' },
  { id: 3, label: 'Sent Messages Tab', sub: 'New "Referral Out" type filter + rows' },
];

export default function App() {
  const [scene, setScene] = useState(1);

  const navBtnStyle = (active) => ({
    padding: '10px 20px', fontSize: 13, fontWeight: active ? 700 : 400,
    cursor: 'pointer', border: 'none',
    borderBottom: active ? `3px solid ${C.gold40}` : `3px solid transparent`,
    background: active ? '#fdf4c4' : C.gray10,
    color: active ? C.gold60 : C.gray70,
    transition: 'all 0.15s', textAlign: 'left',
  });

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", minHeight: '100vh', background: C.gray10 }}>
      {/* Mockup Header */}
      <div style={{
        background: C.gray100, padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `3px solid ${C.gold40}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: C.white, fontWeight: 700, fontSize: 16 }}>X-01 — Referral-Out Notification</span>
            <NewBadge label="X-01 NEW" />
          </div>
          <div style={{ color: C.gray50, fontSize: 12, marginTop: 4 }}>
            Addendum to Existing Referral Out Module · OGC-527 Layer 4 · Prerequisites: OGC-437 + OGC-439
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag kind="yellow">Draft</Tag>
          <Tag kind="gray">v1.0</Tag>
        </div>
      </div>

      {/* Scene nav */}
      <div style={{
        background: C.gray10, borderBottom: `1px solid ${C.border}`,
        display: 'flex', overflowX: 'auto',
      }}>
        {SCENES.map(s => (
          <button key={s.id} style={navBtnStyle(scene === s.id)} onClick={() => setScene(s.id)}>
            <div>Scene {s.id}: {s.label}</div>
            <div style={{ fontSize: 11, color: C.gray50, fontWeight: 400, marginTop: 2 }}>{s.sub}</div>
          </button>
        ))}
      </div>

      {/* Scene content */}
      <div style={{ background: C.gray10 }}>
        {scene === 1 && <SceneTriggers />}
        {scene === 2 && <SceneTemplates />}
        {scene === 3 && <SceneSentMessages />}
      </div>
    </div>
  );
}
