/**
 * S-03c — Subcontract Management
 * Addendum to S-03 (ENV Order Entry) and V-02 (Vector Collection Workflow)
 *
 * SCOPE ANNOTATION CONVENTION (same as S-03b / X-01):
 *   Gold dashed border + "S-03c NEW" badge  → new in this addendum
 *   Dimmed (72% opacity) + "EXISTING" badge → existing OpenELIS content for context only
 *
 * Three scenes:
 *   1. Refer Out Screen — Subcontract Metadata panel (ENV/Vector orders only)
 *   2. Subcontract Register — Dedicated list view with status, overdue highlighting, filters
 *   3. Advance Status Modal — Confirmation flow for status transitions
 */

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  gold20: '#fdd13a', gold40: '#f1c21b', gold60: '#b28600',
  blue60: '#0f62fe', blue70: '#0043ce', blue10: '#edf5ff', blue20: '#d0e2ff',
  green50: '#defbe6', green60: '#198038',
  red10: '#fff1f1', red20: '#ffd7d9', red60: '#da1e28',
  teal10: '#d9fbfb', teal60: '#007d79',
  cyan10: '#e5f6ff', cyan60: '#00539a',
  yellow10: '#fdf4c4', yellow70: '#8e6a00',
  orange10: '#fff2e8', orange60: '#ba4e00',
  gray10: '#f4f4f4', gray20: '#e0e0e0', gray30: '#c6c6c6',
  gray50: '#8d8d8d', gray70: '#525252', gray90: '#262626', gray100: '#161616',
  white: '#ffffff', border: '#e0e0e0',
  topBarBg: '#161616',
};

const TAG_STYLES = {
  green:   { bg: C.green50,  color: C.green60,  border: '#a7f0ba' },
  red:     { bg: C.red10,    color: C.red60,    border: '#ffa4a9' },
  teal:    { bg: C.teal10,   color: C.teal60,   border: '#9ef0f0' },
  blue:    { bg: C.blue10,   color: C.blue70,   border: C.blue20 },
  cyan:    { bg: C.cyan10,   color: C.cyan60,   border: '#bae6ff' },
  gray:    { bg: C.gray10,   color: C.gray70,   border: C.gray30 },
  gold:    { bg: C.yellow10, color: C.gold60,   border: C.gold40 },
  orange:  { bg: C.orange10, color: C.orange60, border: '#ffc1a0' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE ANNOTATION PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function NewBadge({ label = 'S-03c NEW' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: C.gold40, color: C.gray100,
      fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
      padding: '2px 7px', borderRadius: 3,
      letterSpacing: '0.04em', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
    }}>{label}</span>
  );
}

function ExistingBadge({ label = 'EXISTING' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: C.gray20, color: C.gray70,
      fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
      padding: '2px 7px', borderRadius: 3, letterSpacing: '0.04em',
    }}>{label}</span>
  );
}

function NewRegion({ children, label = 'S-03c NEW', style = {} }) {
  return (
    <div style={{
      position: 'relative', border: `2px dashed ${C.gold40}`,
      borderRadius: 6, padding: '1.25rem 1rem 1rem',
      background: 'rgba(253,209,58,0.04)', ...style,
    }}>
      <span style={{ position: 'absolute', top: -10, left: 12, background: C.white, padding: '0 6px' }}>
        <NewBadge label={label} />
      </span>
      {children}
    </div>
  );
}

function ExistingRegion({ children, label = 'EXISTING', style = {} }) {
  return (
    <div style={{
      position: 'relative', border: `1.5px solid ${C.gray20}`,
      borderRadius: 4, padding: '1rem', opacity: 0.72,
      background: C.white, ...style,
    }}>
      <span style={{ position: 'absolute', top: -10, left: 12, background: C.white, padding: '0 6px' }}>
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
    danger:    { ...base, background: C.red60, color: C.white },
    tertiary:  { ...base, background: 'transparent', color: C.blue60, border: `1px solid ${C.blue60}` },
  };
  return <button style={{ ...(variants[kind] || base), ...style }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function FieldRow({ label, required, children, helper }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray70, marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: C.red60, marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {helper && <div style={{ fontSize: 11, color: C.gray50, marginTop: 4 }}>{helper}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength, style }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '8px 12px', fontSize: 13,
        border: `1px solid ${C.gray30}`, borderRadius: 2,
        color: C.gray100, ...style,
      }}
    />
  );
}

function PageShell({ title, subtitle, breadcrumb, children }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", background: C.gray10, minHeight: '100%' }}>
      <div style={{ background: C.topBarBg, height: 48, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <span style={{ color: C.gray10, fontWeight: 700, fontSize: 15 }}>OpenELIS Global</span>
        {breadcrumb && <span style={{ color: C.gray50, fontSize: 13, marginLeft: 24 }}>{breadcrumb}</span>}
      </div>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '20px 32px 16px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.gray100 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: C.gray70, marginTop: 4 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 32 }}>{children}</div>
    </div>
  );
}

function Divider() { return <div style={{ borderTop: `1px solid ${C.border}`, margin: '20px 0' }} />; }

// ─────────────────────────────────────────────────────────────────────────────
// STATUS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const STATUS = {
  DISPATCHED:       { kind: 'blue',   label: 'Dispatched' },
  RECEIVED:         { kind: 'teal',   label: 'Received by External Lab' },
  RESULTS_RETURNED: { kind: 'green',  label: 'Results Returned' },
  CLOSED:           { kind: 'gray',   label: 'Closed' },
};

const STATUS_FLOW = {
  DISPATCHED: 'RECEIVED',
  RECEIVED: 'RESULTS_RETURNED',
  RESULTS_RETURNED: 'CLOSED',
  CLOSED: null,
};

function StatusBadge({ status, overdue }) {
  const s = STATUS[status] || STATUS.DISPATCHED;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Tag kind={s.kind}>{s.label}</Tag>
      {overdue && <Tag kind="red">Overdue</Tag>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — REFER OUT SCREEN WITH SUBCONTRACT PANEL
// ─────────────────────────────────────────────────────────────────────────────
function SceneReferOut() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [agreementRef, setAgreementRef] = useState('');
  const [handoffDate, setHandoffDate] = useState('2026-04-20');
  const [handoffTime, setHandoffTime] = useState('09:00');
  const [expectedReturn, setExpectedReturn] = useState('2026-04-27');
  const [cocContact, setCocContact] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  function validate() {
    const e = {};
    if (!handoffDate || !handoffTime) e.handoff = 'Handoff date and time are required.';
    if (!expectedReturn) e.expectedReturn = 'Expected return date is required.';
    else if (expectedReturn < handoffDate) e.expectedReturn = 'Expected return date must be on or after the handoff date.';
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setSaved(true);
  }

  const inputStyle = (hasError) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '8px 12px', fontSize: 13,
    border: `1px solid ${hasError ? C.red60 : C.gray30}`, borderRadius: 2,
    color: C.gray100,
  });

  return (
    <PageShell title="Refer Out — ENV-2026-00841" breadcrumb="Referrals → Refer Out" subtitle="Environmental order · Kota Bogor Water Quality Program · BLHD Kota Bogor">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div>
          {/* Existing Refer Out fields — dimmed */}
          <ExistingRegion label="EXISTING — Refer Out Fields" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.gray90, marginBottom: 12 }}>Referral Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>External Laboratory *</label>
                <div style={{ padding: '8px 12px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 13, background: C.gray10 }}>
                  Pusat Lab Lingkungan Hidup — Jakarta
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>Tests Referred *</label>
                <div style={{ padding: '8px 12px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 13, background: C.gray10 }}>
                  Mercury (Hg), Arsenic (As)
                </div>
              </div>
            </div>
          </ExistingRegion>

          {/* NEW: Subcontract Details Panel */}
          <NewRegion label="S-03c NEW — Subcontract Details Panel (ENV/Vector orders only)">
            {/* Accordion header */}
            <div
              onClick={() => setPanelOpen(!panelOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', marginBottom: panelOpen ? 16 : 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.gray100 }}>Subcontract Details</span>
                <NewBadge />
                <Tag kind="blue">ENV Order</Tag>
              </div>
              <span style={{ fontSize: 18, color: C.gray50, fontWeight: 300 }}>{panelOpen ? '▲' : '▼'}</span>
            </div>

            {panelOpen && (
              <div>
                <div style={{ fontSize: 12, color: C.gray70, marginBottom: 16, padding: '8px 12px', background: C.blue10, borderRadius: 3, borderLeft: `3px solid ${C.blue60}` }}>
                  Required for ISO 17025 §6.6/§7.7 chain-of-custody compliance. Handoff date/time and expected return are mandatory.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <FieldRow label="Agreement Reference" helper="Subcontract number, MOU reference, or agreement code">
                    <TextInput value={agreementRef} onChange={setAgreementRef} placeholder="e.g. SUB-2026-041" maxLength={60} />
                  </FieldRow>
                  <div />

                  <FieldRow label="Handoff Date & Time" required>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="date" value={handoffDate} onChange={e => setHandoffDate(e.target.value)}
                        style={{ ...inputStyle(!!errors.handoff), flex: 2 }} />
                      <input type="time" value={handoffTime} onChange={e => setHandoffTime(e.target.value)}
                        style={{ ...inputStyle(!!errors.handoff), flex: 1 }} />
                    </div>
                    {errors.handoff && <div style={{ color: C.red60, fontSize: 11, marginTop: 4 }}>{errors.handoff}</div>}
                  </FieldRow>

                  <FieldRow label="Expected Return Date" required helper="Must be on or after handoff date">
                    <input type="date" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)}
                      style={inputStyle(!!errors.expectedReturn)} />
                    {errors.expectedReturn && <div style={{ color: C.red60, fontSize: 11, marginTop: 4 }}>{errors.expectedReturn}</div>}
                  </FieldRow>

                  <FieldRow label="Chain-of-Custody Contact" helper="Name of person who accepted custody at the external lab">
                    <TextInput value={cocContact} onChange={setCocContact} placeholder="e.g. Budi Santoso" maxLength={80} />
                  </FieldRow>
                  <div />
                </div>

                <FieldRow label="Handoff Notes">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Free text notes about the handoff..."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '8px 12px', fontSize: 13, resize: 'vertical',
                      border: `1px solid ${C.gray30}`, borderRadius: 2,
                      color: C.gray100,
                    }}
                  />
                  <div style={{ fontSize: 11, color: C.gray50, marginTop: 2 }}>{notes.length}/500</div>
                </FieldRow>

                <div style={{ padding: '10px 14px', background: C.yellow10, borderRadius: 3, fontSize: 12, color: C.gray90, marginTop: 8 }}>
                  <strong>On save:</strong> Subcontract status will be set to <Tag kind="blue">Dispatched</Tag> automatically.
                  Visible in the Subcontract Register and on the order context card.
                </div>
              </div>
            )}
          </NewRegion>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Btn kind="secondary">Cancel</Btn>
            <Btn kind="primary" onClick={handleSave}>
              {saved ? '✓ Referral Saved' : 'Save Referral'}
            </Btn>
          </div>

          {saved && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: C.green50, borderRadius: 3, fontSize: 13, color: C.green60, borderLeft: `3px solid ${C.green60}` }}>
              ✓ Referral saved. Subcontract status set to <strong>Dispatched</strong>. Visible in Subcontract Register.
            </div>
          )}
        </div>

        {/* Right: Order context card */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray100, marginBottom: 16 }}>Order Context</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div><span style={{ color: C.gray50, fontSize: 11 }}>Order ID</span><br /><strong>ENV-2026-00841</strong></div>
            <div><span style={{ color: C.gray50, fontSize: 11 }}>Site</span><br />Sungai Ciliwung — KM 42</div>
            <div><span style={{ color: C.gray50, fontSize: 11 }}>Program</span><br />Kota Bogor Water Quality</div>
            <div><span style={{ color: C.gray50, fontSize: 11 }}>Standard</span><br />PP 82/2001 — Class II</div>
            <Divider />
            <NewRegion label="S-03c NEW" style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: C.gray50, marginBottom: 8 }}>Subcontracts</div>
              {saved ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag kind="blue">Dispatched</Tag>
                  <span style={{ fontSize: 11, color: C.gray50 }}>Pusat Lab LH</span>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: C.gray50, fontStyle: 'italic' }}>None yet — save referral first</span>
              )}
            </NewRegion>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — SUBCONTRACT REGISTER
// ─────────────────────────────────────────────────────────────────────────────

const SUBCONTRACTS_DATA = [
  {
    id: 'sc1', orderId: 'ENV-2026-00841', lab: 'Pusat Lab Lingkungan Hidup',
    tests: 'Mercury (Hg), Arsenic (As)', agreementRef: 'SUB-2026-041',
    handoff: '20 Apr 2026', expectedReturn: '27 Apr 2026',
    status: 'DISPATCHED', overdue: false,
  },
  {
    id: 'sc2', orderId: 'ENV-2026-00838', lab: 'BBTKLPP Jakarta',
    tests: 'Total Coliform, E. coli', agreementRef: 'SUB-2026-039',
    handoff: '18 Apr 2026', expectedReturn: '19 Apr 2026',
    status: 'DISPATCHED', overdue: true,
  },
  {
    id: 'sc3', orderId: 'VEC-2026-00210', lab: 'Pusat Lab Lingkungan Hidup',
    tests: 'Plasmodium sp. PCR', agreementRef: '',
    handoff: '15 Apr 2026', expectedReturn: '22 Apr 2026',
    status: 'RECEIVED', overdue: false,
  },
  {
    id: 'sc4', orderId: 'ENV-2026-00821', lab: 'BBTKLPP Surabaya',
    tests: 'Cadmium (Cd), Lead (Pb)', agreementRef: 'SUB-2026-031',
    handoff: '10 Apr 2026', expectedReturn: '17 Apr 2026',
    status: 'RESULTS_RETURNED', overdue: false,
  },
  {
    id: 'sc5', orderId: 'ENV-2026-00815', lab: 'BBTKLPP Jakarta',
    tests: 'Biochemical Oxygen Demand', agreementRef: 'SUB-2026-028',
    handoff: '05 Apr 2026', expectedReturn: '12 Apr 2026',
    status: 'CLOSED', overdue: false,
  },
];

function SceneRegister({ onAdvance }) {
  const [statusFilter, setStatusFilter] = useState(['DISPATCHED', 'RECEIVED', 'RESULTS_RETURNED']);
  const [labFilter, setLabFilter] = useState('');

  const STATUS_OPTIONS = ['DISPATCHED', 'RECEIVED', 'RESULTS_RETURNED', 'CLOSED'];

  const filtered = SUBCONTRACTS_DATA.filter(sc => {
    const statusOk = statusFilter.includes(sc.status);
    const labOk = !labFilter || sc.lab.toLowerCase().includes(labFilter.toLowerCase());
    return statusOk && labOk;
  });

  function toggleStatus(s) {
    setStatusFilter(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  const thStyle = {
    padding: '10px 14px', textAlign: 'left', fontSize: 12,
    fontWeight: 700, color: C.gray70, background: C.gray10,
    borderBottom: `2px solid ${C.border}`,
  };

  const selectStyle = {
    padding: '6px 10px', border: `1px solid ${C.gray30}`, borderRadius: 2,
    fontSize: 13, background: C.white, cursor: 'pointer',
  };

  return (
    <PageShell
      title="Subcontract Register"
      breadcrumb="Referrals → Subcontract Register"
      subtitle="Track all ENV and Vector samples dispatched to external contracted laboratories."
    >
      {/* Filters */}
      <div style={{
        background: C.white, border: `1px solid ${C.border}`, borderRadius: 4,
        padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gray70, marginBottom: 8 }}>Status</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(s => {
              const active = statusFilter.includes(s);
              const def = STATUS[s];
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  style={{
                    padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: `1.5px solid ${active ? C.blue60 : C.gray30}`,
                    background: active ? C.blue10 : C.white,
                    color: active ? C.blue60 : C.gray70,
                  }}
                >
                  {def.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gray70, marginBottom: 8 }}>External Lab</div>
          <input
            type="text" value={labFilter} onChange={e => setLabFilter(e.target.value)}
            placeholder="Search lab name…"
            style={{ ...selectStyle, minWidth: 220 }}
          />
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
          <span style={{ fontSize: 13, color: C.gray50 }}>{filtered.length} of {SUBCONTRACTS_DATA.length} subcontracts</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>External Lab</th>
              <th style={thStyle}>Tests</th>
              <th style={thStyle}>Agreement Ref</th>
              <th style={thStyle}>Handoff</th>
              <th style={thStyle}>Expected Return</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sc => {
              const tdBase = {
                padding: '12px 14px', fontSize: 13, verticalAlign: 'middle',
                borderBottom: `1px solid ${C.border}`,
                background: sc.overdue ? '#fff5f5' : C.white,
              };
              const nextStatus = STATUS_FLOW[sc.status];
              return (
                <tr key={sc.id}>
                  <td style={{ ...tdBase, fontWeight: 600, color: C.blue60 }}>{sc.orderId}</td>
                  <td style={tdBase}>{sc.lab}</td>
                  <td style={{ ...tdBase, fontSize: 12, color: C.gray70 }}>
                    <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sc.tests}>
                      {sc.tests}
                    </div>
                  </td>
                  <td style={{ ...tdBase, fontFamily: 'monospace', fontSize: 11 }}>
                    {sc.agreementRef || <span style={{ color: C.gray50, fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={{ ...tdBase, fontSize: 12, whiteSpace: 'nowrap' }}>{sc.handoff}</td>
                  <td style={{ ...tdBase, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: sc.overdue ? C.red60 : C.gray90, fontWeight: sc.overdue ? 700 : 400 }}>
                        {sc.expectedReturn}
                      </span>
                      {sc.overdue && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                          background: C.red10, color: C.red60, border: `1px solid #ffa4a9`,
                        }}>OVERDUE</span>
                      )}
                    </div>
                  </td>
                  <td style={tdBase}>
                    <StatusBadge status={sc.status} overdue={false} />
                  </td>
                  <td style={tdBase}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {nextStatus && (
                        <Btn kind="tertiary" small onClick={() => onAdvance(sc)}>
                          Advance →
                        </Btn>
                      )}
                      <Btn kind="ghost" small>View</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: C.gray50, fontSize: 13 }}>
                  No subcontracts match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination strip */}
        <div style={{
          padding: '0 16px', height: 48, background: C.gray10,
          borderTop: `1px solid ${C.border}`, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: C.gray70,
        }}>
          <span>1–{filtered.length} of {filtered.length} subcontracts</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['«', '‹', '1', '›', '»'].map((p, i) => (
              <button key={i} style={{
                minWidth: 32, height: 32, border: `1px solid ${p === '1' ? C.blue60 : C.gray30}`,
                borderRadius: 2, background: p === '1' ? C.blue60 : C.white,
                color: p === '1' ? C.white : C.gray70, fontSize: 13, cursor: 'pointer',
              }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 20, padding: '12px 16px', borderRadius: 4,
        borderLeft: `4px solid ${C.gold40}`, background: C.yellow10,
        fontSize: 12, color: C.gray90,
      }}>
        <strong>S-03c adds:</strong> This "Subcontract Register" page is new — accessible under Referrals in the main nav.
        Overdue rows are highlighted in red. "Advance →" opens the confirmation modal (Scene 3).
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — ADVANCE STATUS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SceneAdvanceModal() {
  const sc = SUBCONTRACTS_DATA[1]; // OVERDUE DISPATCHED → RECEIVED
  const [modalOpen, setModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(sc.status);

  const nextStatus = STATUS_FLOW[currentStatus];

  function confirm() {
    setCurrentStatus(nextStatus);
    setModalOpen(false);
    setDone(true);
    setNotes('');
  }

  return (
    <PageShell
      title="Subcontract Register — Status Advance"
      breadcrumb="Referrals → Subcontract Register"
      subtitle="Scene 3 of 3: Confirmation modal for advancing subcontract status"
    >
      <div style={{ maxWidth: 720 }}>
        {/* Row from register */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 24 }}>
          <div style={{
            padding: '10px 16px', background: C.gray10, borderBottom: `1px solid ${C.border}`,
            fontSize: 12, fontWeight: 700, color: C.gray70,
          }}>
            Selected subcontract row
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', background: '#fff5f5' }}>
            <div>
              <div style={{ fontSize: 11, color: C.gray50 }}>Order ID</div>
              <div style={{ fontWeight: 700, color: C.blue60 }}>{sc.orderId}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.gray50 }}>External Lab</div>
              <div style={{ fontWeight: 600 }}>{sc.lab}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.gray50 }}>Expected Return</div>
              <div style={{ color: C.red60, fontWeight: 700 }}>{sc.expectedReturn} <span style={{ fontSize: 10, padding: '1px 5px', background: C.red10, border: `1px solid #ffa4a9`, borderRadius: 3 }}>OVERDUE</span></div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.gray50 }}>Current Status</div>
              <StatusBadge status={currentStatus} />
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {!done && nextStatus && (
                <Btn kind="tertiary" onClick={() => setModalOpen(true)}>
                  Advance to {STATUS[nextStatus]?.label} →
                </Btn>
              )}
              {done && <Tag kind="green">✓ Status updated</Tag>}
            </div>
          </div>
        </div>

        {/* Modal overlay */}
        {modalOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}>
            <div style={{
              background: C.white, borderRadius: 2, width: 520,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              {/* Modal header */}
              <div style={{
                padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: C.gray100 }}>Confirm Status Transition</span>
                  <NewBadge label="S-03c NEW" />
                </div>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: C.gray50 }}>×</button>
              </div>

              {/* Modal body */}
              <div style={{ padding: 24 }}>
                {/* Transition diagram */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', background: C.gray10, borderRadius: 4, marginBottom: 20,
                }}>
                  <StatusBadge status={currentStatus} />
                  <span style={{ fontSize: 20, color: C.gray50 }}>→</span>
                  <StatusBadge status={nextStatus} />
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
                  <div><span style={{ color: C.gray50, fontSize: 11 }}>Order</span><br /><strong>{sc.orderId}</strong></div>
                  <div><span style={{ color: C.gray50, fontSize: 11 }}>External Lab</span><br />{sc.lab}</div>
                  <div><span style={{ color: C.gray50, fontSize: 11 }}>Tests</span><br /><span style={{ fontSize: 12 }}>{sc.tests}</span></div>
                  <div>
                    <span style={{ color: C.gray50, fontSize: 11 }}>Expected Return</span><br />
                    <span style={{ color: C.red60, fontWeight: 700 }}>{sc.expectedReturn} (Overdue)</span>
                  </div>
                </div>

                <FieldRow label="Notes" helper="Optional — record who confirmed receipt, reference number, etc.">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Confirmed received by Dr. Wati on 20 Apr 2026"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '8px 12px', fontSize: 13, resize: 'vertical',
                      border: `1px solid ${C.gray30}`, borderRadius: 2,
                    }}
                  />
                </FieldRow>

                <div style={{ padding: '10px 12px', background: C.yellow10, borderRadius: 3, fontSize: 12, color: C.gray90 }}>
                  This action will be recorded in the audit log with your name and the current timestamp.
                </div>
              </div>

              {/* Modal footer */}
              <div style={{
                padding: '16px 24px', borderTop: `1px solid ${C.border}`,
                display: 'flex', justifyContent: 'flex-end', gap: 12,
              }}>
                <Btn kind="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
                <Btn kind="primary" onClick={confirm}>
                  Confirm — Set to {STATUS[nextStatus]?.label}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {done && (
          <div style={{ padding: '14px 16px', background: C.green50, borderRadius: 4, fontSize: 13, color: C.green60, borderLeft: `3px solid ${C.green60}` }}>
            ✓ Status advanced to <strong>Received by External Lab</strong>. Audit log entry created.
          </div>
        )}

        {/* Audit log preview */}
        <div style={{ marginTop: 24, background: C.white, border: `1px solid ${C.border}`, borderRadius: 4 }}>
          <div style={{ padding: '12px 16px', background: C.gray10, borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.gray70 }}>
            Audit Log — {sc.orderId}
          </div>
          <div style={{ padding: 16 }}>
            {[
              { from: 'DRAFT', to: 'DISPATCHED', actor: 'System', at: '18 Apr 2026 14:22:01', notes: 'Auto on referral save' },
              ...(done ? [{ from: 'DISPATCHED', to: 'RECEIVED', actor: 'Siti Nurhaliza', at: 'just now', notes: notes || '—' }] : []),
            ].map((entry, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16, padding: '10px 0',
                borderBottom: i < (done ? 1 : 0) ? `1px solid ${C.border}` : 'none', fontSize: 13,
              }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag kind={STATUS[entry.from]?.kind || 'gray'}>{STATUS[entry.from]?.label.split(' ')[0]}</Tag>
                  <span style={{ color: C.gray50 }}>→</span>
                  <Tag kind={STATUS[entry.to]?.kind || 'gray'}>{STATUS[entry.to]?.label.split(' ')[0]}</Tag>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{entry.actor}</div>
                  <div style={{ fontSize: 11, color: C.gray50 }}>{entry.at}</div>
                  {entry.notes && <div style={{ fontSize: 12, color: C.gray70, marginTop: 2 }}>{entry.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────
const SCENES = [
  { id: 1, label: 'Refer Out Screen', sub: 'New Subcontract Metadata panel (ENV/Vector only)' },
  { id: 2, label: 'Subcontract Register', sub: 'New page under Referrals — status, overdue, filters' },
  { id: 3, label: 'Advance Status Modal', sub: 'Confirmation flow + audit log preview' },
];

export default function App() {
  const [scene, setScene] = useState(1);
  const [advanceSc, setAdvanceSc] = useState(null);

  function handleAdvance(sc) {
    setAdvanceSc(sc);
    setScene(3);
  }

  const navBtnStyle = (active) => ({
    padding: '10px 20px', fontSize: 13, fontWeight: active ? 700 : 400,
    cursor: 'pointer', border: 'none',
    borderBottom: active ? `3px solid ${C.gold40}` : `3px solid transparent`,
    background: active ? C.yellow10 : C.gray10,
    color: active ? C.gold60 : C.gray70,
    transition: 'all 0.15s', textAlign: 'left',
  });

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", minHeight: '100vh', background: C.gray10 }}>
      {/* Mockup header */}
      <div style={{
        background: C.gray100, padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `3px solid ${C.gold40}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: C.white, fontWeight: 700, fontSize: 16 }}>S-03c — Subcontract Management</span>
            <NewBadge />
          </div>
          <div style={{ color: C.gray50, fontSize: 12, marginTop: 4 }}>
            Addendum to S-03 (ENV Order Entry) + V-02 (Vector Collection) · OGC-527 Layer 4 · Must Have, Phase 1 (Bogor)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag kind="gold">Draft</Tag>
          <Tag kind="gray">v1.0</Tag>
        </div>
      </div>

      {/* Scene nav */}
      <div style={{ background: C.gray10, borderBottom: `1px solid ${C.border}`, display: 'flex', overflowX: 'auto' }}>
        {SCENES.map(s => (
          <button key={s.id} style={navBtnStyle(scene === s.id)} onClick={() => setScene(s.id)}>
            <div>Scene {s.id}: {s.label}</div>
            <div style={{ fontSize: 11, color: C.gray50, fontWeight: 400, marginTop: 2 }}>{s.sub}</div>
          </button>
        ))}
      </div>

      {/* Scene content */}
      <div>
        {scene === 1 && <SceneReferOut />}
        {scene === 2 && <SceneRegister onAdvance={handleAdvance} />}
        {scene === 3 && <SceneAdvanceModal sc={advanceSc} />}
      </div>
    </div>
  );
}
