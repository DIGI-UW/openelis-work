import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — matches preview-notifications.jsx palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  blue60: '#0f62fe', blue70: '#0043ce', blue10: '#edf5ff', blue20: '#d0e2ff',
  green50: '#defbe6', green60: '#198038',
  red10: '#fff1f1', red40: '#fa4d56', red60: '#da1e28',
  yellow10: '#fdf4c4', yellow70: '#8e6a00',
  purple10: '#f6f2ff', purple60: '#8a3ffc',
  teal10: '#d9fbfb', teal60: '#007d79',
  gray10: '#f4f4f4', gray20: '#e0e0e0', gray30: '#c6c6c6',
  gray50: '#8d8d8d', gray70: '#525252', gray90: '#262626', gray100: '#161616',
  white: '#ffffff',
  sidebarBg: '#262626', sidebarHover: '#353535', sidebarActive: '#0f62fe',
  sidebarText: '#f4f4f4', sidebarSub: '#c6c6c6',
  topBarBg: '#161616', border: '#e0e0e0',
  layerAccent01: '#fff0f0',
};

const TAG_STYLES = {
  green:  { bg: C.green50,  color: C.green60,  border: '#a7f0ba' },
  red:    { bg: C.red10,    color: C.red60,    border: '#ffa4a9' },
  purple: { bg: C.purple10, color: C.purple60, border: '#d4bbff' },
  teal:   { bg: C.teal10,   color: C.teal60,   border: '#9ef0f0' },
  gray:   { bg: C.gray10,   color: C.gray70,   border: C.gray30 },
  blue:   { bg: C.blue10,   color: C.blue70,   border: C.blue20 },
  cyan:   { bg: '#e5f6ff',  color: '#00539a',  border: '#bae6ff' },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
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

function Btn({ children, kind = 'primary', onClick, disabled, small, icon }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '6px 12px' : '10px 20px',
    borderRadius: 2, fontSize: small ? 12 : 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
  };
  const s = {
    primary:   { ...base, background: disabled ? C.gray30 : C.blue60, color: C.white },
    secondary: { ...base, background: C.gray10, color: C.gray90, border: `1px solid ${C.gray30}` },
    ghost:     { ...base, background: 'transparent', color: C.blue60 },
    danger:    { ...base, background: disabled ? C.gray30 : C.red60, color: C.white },
    tertiary:  { ...base, background: 'transparent', color: C.blue60, border: `1px solid ${C.blue60}` },
  }[kind] || base;
  return <button style={s} onClick={onClick} disabled={disabled}>{icon && <span>{icon}</span>}{children}</button>;
}

function Notif({ kind = 'info', title, subtitle, onClose }) {
  const p = {
    info:    { bg: C.blue10,    border: C.blue60,    color: C.blue70,    icon: 'ℹ' },
    success: { bg: C.green50,   border: C.green60,   color: C.green60,   icon: '✓' },
    warning: { bg: C.yellow10,  border: C.yellow70,  color: C.yellow70,  icon: '⚠' },
    error:   { bg: C.red10,     border: C.red60,     color: C.red60,     icon: '✕' },
  }[kind] || {};
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 16px', borderRadius: 2,
      borderLeft: `4px solid ${p.border}`, background: p.bg,
    }}>
      <span style={{ color: p.color, fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{p.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: C.gray100 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.gray70, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.gray50 }}>×</button>
      )}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: C.white, borderRadius: 2, width: wide ? 860 : 560,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.gray100 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: C.gray70, marginTop: 4 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: C.gray50, marginTop: -2 }}>×</button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const DELIVERY_LOG = {
  'm1': [
    { channel: 'EMAIL',    status: 'DELIVERED', at: '20 Apr 2026 09:14:02', actor: 'System',         error: '' },
    { channel: 'WHATSAPP', status: 'DELIVERED', at: '20 Apr 2026 09:14:05', actor: 'System',         error: '' },
  ],
  'm2': [
    { channel: 'EMAIL',    status: 'FAILED',    at: '19 Apr 2026 14:31:10', actor: 'System',         error: 'SMTP 550 — Mailbox does not exist' },
    { channel: 'EMAIL',    status: 'FAILED',    at: '19 Apr 2026 14:46:10', actor: 'System',         error: 'SMTP 550 — Mailbox does not exist (retry 1)' },
    { channel: 'EMAIL',    status: 'FAILED',    at: '19 Apr 2026 15:01:10', actor: 'System',         error: 'SMTP 550 — Mailbox does not exist (retry 2)' },
    { channel: 'WHATSAPP', status: 'DELIVERED', at: '19 Apr 2026 14:31:12', actor: 'System',         error: '' },
  ],
  'm3': [
    { channel: 'EMAIL',    status: 'FAILED',    at: '18 Apr 2026 11:02:44', actor: 'System',         error: 'SMTP connection timeout' },
    { channel: 'EMAIL',    status: 'FAILED',    at: '18 Apr 2026 11:17:44', actor: 'System',         error: 'SMTP connection timeout (retry 1)' },
    { channel: 'EMAIL',    status: 'FAILED',    at: '18 Apr 2026 11:32:44', actor: 'System',         error: 'SMTP connection timeout (retry 2)' },
    { channel: 'WHATSAPP', status: 'FAILED',    at: '18 Apr 2026 11:02:47', actor: 'System',         error: 'TextIt: Number not registered on WhatsApp' },
  ],
  'm4': [
    { channel: 'EMAIL',    status: 'DELIVERED', at: '18 Apr 2026 08:55:01', actor: 'System',         error: '' },
  ],
  'm5': [
    { channel: 'EMAIL',    status: 'DELIVERED', at: '17 Apr 2026 16:10:32', actor: 'Siti Nurhaliza', error: '' },
    { channel: 'WHATSAPP', status: 'DELIVERED', at: '17 Apr 2026 16:10:35', actor: 'Siti Nurhaliza', error: '' },
  ],
  'm6': [
    { channel: 'EMAIL',    status: 'DELIVERED', at: '17 Apr 2026 10:00:11', actor: 'System',         error: '' },
    { channel: 'WHATSAPP', status: 'DELIVERED', at: '17 Apr 2026 10:00:13', actor: 'System',         error: '' },
  ],
};

// channelResults: per-channel outcome derived from DELIVERY_LOG
// ok: true = at least one DELIVERED attempt for that channel
const MESSAGES = [
  {
    id: 'm1', dateTime: '20 Apr 2026 09:14', type: 'LH Completed',
    typeTag: 'teal', recipient: 'PT Tirta Kencana', contact: 'tirta@…',
    channelResults: [{ ch: 'Email', ok: true }, { ch: 'WhatsApp', ok: true }],
    status: 'SENT',
    ref: 'LH-2026-00841', refType: 'lh',
  },
  {
    id: 'm2', dateTime: '19 Apr 2026 14:31', type: 'LH Completed',
    typeTag: 'teal', recipient: 'CV Mitra Lingkungan', contact: 'badaddr@…',
    channelResults: [{ ch: 'Email', ok: false }, { ch: 'WhatsApp', ok: true }],
    status: 'SENT',
    ref: 'LH-2026-00838', refType: 'lh',
  },
  {
    id: 'm3', dateTime: '18 Apr 2026 11:02', type: 'LH Completed',
    typeTag: 'teal', recipient: 'Dinas Kesehatan Kota Bogor', contact: 'dinkes@…',
    channelResults: [{ ch: 'Email', ok: false }, { ch: 'WhatsApp', ok: false }],
    status: 'FAILED',
    ref: 'LH-2026-00829', refType: 'lh',
  },
  {
    id: 'm4', dateTime: '18 Apr 2026 08:55', type: 'Clinical Result',
    typeTag: 'blue', recipient: 'Dr. Andi Prasetyo', contact: 'andi.p@…',
    channelResults: [{ ch: 'Email', ok: true }],
    status: 'SENT',
    ref: 'ACC-2026-04-18-003', refType: 'result',
  },
  {
    id: 'm5', dateTime: '17 Apr 2026 16:10', type: 'LH Completed',
    typeTag: 'teal', recipient: 'PT Agro Makmur', contact: 'agro@…',
    channelResults: [{ ch: 'Email', ok: true }, { ch: 'WhatsApp', ok: true }],
    status: 'RESENT',
    ref: 'LH-2026-00821', refType: 'lh',
  },
  {
    id: 'm6', dateTime: '17 Apr 2026 10:00', type: 'Clinical Result',
    typeTag: 'blue', recipient: 'Dr. Rini Hartati', contact: 'rini.h@…',
    channelResults: [{ ch: 'Email', ok: true }, { ch: 'WhatsApp', ok: true }],
    status: 'SENT',
    ref: 'ACC-2026-04-17-011', refType: 'result',
  },
];

const STATUS_TAG = {
  SENT:       { kind: 'green',  label: 'Sent' },
  FAILED:     { kind: 'red',    label: 'Failed' },
  PENDING:    { kind: 'purple', label: 'Pending' },
  NO_CONTACT: { kind: 'gray',   label: 'No Contact' },
  RESENT:     { kind: 'teal',   label: 'Resent' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — SENT MESSAGES LIST
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZES = [5, 10, 20, 50];

function Pagination({ total, page, pageSize, onPage, onPageSize }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  const btnStyle = (active, disabled) => ({
    minWidth: 32, height: 32, padding: '0 8px',
    border: `1px solid ${active ? C.blue60 : C.gray30}`,
    borderRadius: 2, background: active ? C.blue60 : C.white,
    color: active ? C.white : disabled ? C.gray30 : C.gray90,
    fontSize: 13, fontWeight: active ? 600 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: 48, background: C.gray10,
      border: `1px solid ${C.border}`, borderTop: 'none', fontSize: 13,
    }}>
      {/* Items per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.gray70 }}>
        <span>Items per page:</span>
        <select
          value={pageSize}
          onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          style={{
            padding: '4px 8px', border: `1px solid ${C.gray30}`, borderRadius: 2,
            fontSize: 13, background: C.white, cursor: 'pointer',
          }}
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: C.gray50 }}>
          {total === 0 ? '0 items' : `${start}–${end} of ${total} items`}
        </span>
      </div>

      {/* Page controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          style={btnStyle(false, page === 1)}
          disabled={page === 1}
          onClick={() => onPage(1)}
          title="First page"
        >«</button>
        <button
          style={btnStyle(false, page === 1)}
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          title="Previous page"
        >‹</button>

        {/* Page number pills */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '…'
              ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: C.gray50 }}>…</span>
              : <button key={p} style={btnStyle(p === page, false)} onClick={() => onPage(p)}>{p}</button>
          )
        }

        <button
          style={btnStyle(false, page === totalPages)}
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          title="Next page"
        >›</button>
        <button
          style={btnStyle(false, page === totalPages)}
          disabled={page === totalPages}
          onClick={() => onPage(totalPages)}
          title="Last page"
        >»</button>
      </div>
    </div>
  );
}

function SceneSentMessages({ onOpenLog, onOpenResend }) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [overflowOpen, setOverflowOpen] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = MESSAGES.filter(m =>
    (filterType === 'ALL' || m.type === filterType) &&
    (filterStatus === 'ALL' || m.status === filterStatus)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const canResend = (m) => ['FAILED', 'SENT', 'RESENT'].includes(m.status);

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.gray100, margin: 0 }}>Sent Messages</h1>
        <p style={{ fontSize: 13, color: C.gray70, marginTop: 6 }}>
          Delivery history for all outbound notifications — LH certificates, clinical results, and future notification types.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{
        background: C.gray10, border: `1px solid ${C.border}`, borderBottom: 'none',
        padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11, color: C.gray70, fontWeight: 600 }}>Type</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 13, background: C.white, minWidth: 160 }}
          >
            <option value="ALL">All types</option>
            <option value="LH Completed">LH Completed</option>
            <option value="Clinical Result">Clinical Result</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11, color: C.gray70, fontWeight: 600 }}>Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 13, background: C.white, minWidth: 140 }}
          >
            <option value="ALL">All statuses</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="RESENT">Resent</option>
            <option value="PENDING">Pending</option>
            <option value="NO_CONTACT">No Contact</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11, color: C.gray70, fontWeight: 600 }}>Date range</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="date" defaultValue="2026-04-14" style={{ padding: '6px 10px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 13, background: C.white }} />
            <span style={{ fontSize: 12, color: C.gray50 }}>to</span>
            <input type="date" defaultValue="2026-04-20" style={{ padding: '6px 10px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 13, background: C.white }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: `1px solid ${C.border}`, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.gray10, borderBottom: `1px solid ${C.border}` }}>
              {['Date / Time', 'Type', 'Recipient', 'Delivery Status', 'Reference', ''].map((h, i) => (
                <th key={i} style={{
                  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                  color: C.gray70, fontSize: 12, whiteSpace: 'nowrap',
                  borderRight: i < 5 ? `1px solid ${C.border}` : 'none',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((m, idx) => {
              const isFailed = m.status === 'FAILED';
              const rowBg = isFailed ? C.layerAccent01 : (idx % 2 === 1 ? C.gray10 : C.white);
              return (
                <tr key={m.id} style={{ background: rowBg, borderBottom: `1px solid ${C.border}` }}>
                  {/* Date/Time */}
                  <td style={{ padding: '10px 14px', color: C.gray70, whiteSpace: 'nowrap', borderRight: `1px solid ${C.border}` }}>
                    {m.dateTime}
                  </td>
                  {/* Type */}
                  <td style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                    <Tag kind={m.typeTag}>{m.type}</Tag>
                  </td>
                  {/* Recipient */}
                  <td style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: 600, color: C.gray100 }}>{m.recipient}</div>
                    <div style={{ fontSize: 11, color: C.gray50, marginTop: 2 }}>{m.contact}</div>
                  </td>
                  {/* Delivery Status — per-channel colored tags */}
                  <td style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {m.channelResults.map(({ ch, ok }) => (
                        <span key={ch} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: ok ? C.green50 : C.red10,
                          color: ok ? C.green60 : C.red60,
                          border: `1px solid ${ok ? '#a7f0ba' : '#ffa4a9'}`,
                        }}>
                          <span style={{ fontSize: 10 }}>{ok ? '✓' : '✕'}</span>
                          {ch}
                        </span>
                      ))}
                      {m.status === 'RESENT' && (
                        <Tag kind="teal">Resent</Tag>
                      )}
                    </div>
                  </td>
                  {/* Reference */}
                  <td style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                    <a href="#" style={{ color: C.blue60, fontWeight: 600, textDecoration: 'none', fontSize: 13 }}
                       onClick={e => e.preventDefault()}>
                      {m.ref}
                    </a>
                    <div style={{ fontSize: 11, color: C.gray50, marginTop: 2 }}>
                      {m.refType === 'lh' ? 'Laporan Hasil' : 'Result Record'}
                    </div>
                  </td>
                  {/* Overflow */}
                  <td style={{ padding: '10px 8px', position: 'relative', width: 40 }}>
                    <button
                      onClick={() => setOverflowOpen(overflowOpen === m.id ? null : m.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 18, color: C.gray70, padding: '4px 8px', borderRadius: 2,
                        background: overflowOpen === m.id ? C.gray20 : 'transparent',
                      }}
                    >⋮</button>
                    {overflowOpen === m.id && (
                      <div style={{
                        position: 'absolute', right: 8, top: 36, background: C.white,
                        border: `1px solid ${C.border}`, borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 180,
                      }}>
                        {canResend(m) && (
                          <button
                            onClick={() => { setOverflowOpen(null); onOpenResend(m); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              width: '100%', padding: '10px 16px', border: 'none',
                              background: 'none', cursor: 'pointer', fontSize: 13,
                              color: m.status === 'FAILED' ? C.red60 : C.gray100,
                              fontWeight: m.status === 'FAILED' ? 600 : 400,
                              borderBottom: `1px solid ${C.border}`,
                            }}
                          >
                            <span>↺</span> Resend notification
                            {m.status === 'FAILED' && <Tag kind="red">Failed</Tag>}
                          </button>
                        )}
                        <button
                          onClick={() => { setOverflowOpen(null); onOpenLog(m); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '10px 16px', border: 'none',
                            background: 'none', cursor: 'pointer', fontSize: 13, color: C.gray100,
                          }}
                        >
                          <span>📋</span> View delivery log
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pageRows.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: C.gray50, fontSize: 14 }}>
            No messages match the current filters.
          </div>
        )}
      </div>
      <Pagination
        total={filtered.length}
        page={safePage}
        pageSize={pageSize}
        onPage={p => setPage(p)}
        onPageSize={s => { setPageSize(s); setPage(1); }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — RESEND FLOW
// ─────────────────────────────────────────────────────────────────────────────
function SceneResend() {
  const [step, setStep] = useState('idle'); // idle | confirm | success | failed | cooldown
  const target = MESSAGES.find(m => m.id === 'm3');

  return (
    <div style={{ padding: '24px 32px', maxWidth: 680 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 6 }}>Resend Flow</h2>
      <p style={{ fontSize: 13, color: C.gray70, marginBottom: 24 }}>
        Step through the resend states for a failed LH notification.
      </p>

      {/* State selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { key: 'idle',     label: '1 — Idle (failed row)' },
          { key: 'confirm',  label: '2 — Confirm modal' },
          { key: 'success',  label: '3 — Success' },
          { key: 'failed',   label: '4 — Resend also failed' },
          { key: 'cooldown', label: '5 — Cooldown active' },
        ].map(s => (
          <button key={s.key} onClick={() => setStep(s.key)} style={{
            padding: '6px 14px', borderRadius: 2, border: `1px solid ${step === s.key ? C.blue60 : C.gray30}`,
            background: step === s.key ? C.blue10 : C.white, color: step === s.key ? C.blue70 : C.gray90,
            fontWeight: step === s.key ? 600 : 400, fontSize: 12, cursor: 'pointer',
          }}>{s.label}</button>
        ))}
      </div>

      {/* State 1: Idle failed row with inline warning */}
      {step === 'idle' && (
        <div>
          <div style={{
            background: C.layerAccent01, border: `1px solid #ffd7d9`, borderRadius: 2, padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Tag kind="teal">LH Completed</Tag>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.gray100 }}>LH-2026-00829</span>
                <Tag kind="red">Failed</Tag>
              </div>
              <div style={{ fontSize: 13, color: C.gray70, marginBottom: 4 }}>
                <strong>Dinas Kesehatan Kota Bogor</strong> · dinkes@…
              </div>
              <div style={{ fontSize: 12, color: C.red60, fontWeight: 600 }}>
                ⚠ All channels failed — Email: timeout · WhatsApp: not registered
              </div>
              <div style={{ fontSize: 12, color: C.gray50, marginTop: 4 }}>18 Apr 2026 11:02 · 3 retries exhausted</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Btn kind="danger" small onClick={() => setStep('confirm')} icon="↺">Resend</Btn>
            </div>
          </div>
          <p style={{ fontSize: 12, color: C.gray50, marginTop: 12 }}>
            Failed rows appear with a red tint background. Resend is surfaced inline — no need to open a detail view.
          </p>
        </div>
      )}

      {/* State 2: Confirm modal */}
      {step === 'confirm' && (
        <div>
          <div style={{ background: C.gray10, border: `1px solid ${C.border}`, borderRadius: 2, padding: 24, opacity: 0.5 }}>
            <div style={{ fontSize: 14, color: C.gray50 }}>(Sent Messages list behind modal)</div>
          </div>
          <div style={{
            border: `1px solid ${C.border}`, borderRadius: 2, padding: 24, marginTop: 12,
            background: C.white, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.gray100, marginBottom: 8 }}>
              Resend notification?
            </div>
            <p style={{ fontSize: 13, color: C.gray70, marginBottom: 16 }}>
              A new download link will be generated and delivery will be re-attempted on all configured channels.
            </p>
            <div style={{
              background: C.gray10, borderRadius: 2, padding: '12px 16px', marginBottom: 20, fontSize: 13,
            }}>
              <div style={{ marginBottom: 4 }}><strong>LH reference:</strong> LH-2026-00829</div>
              <div style={{ marginBottom: 4 }}><strong>Recipient:</strong> Dinas Kesehatan Kota Bogor</div>
              <div style={{ marginBottom: 4 }}><strong>Channels:</strong> <Tag kind="gray">EMAIL</Tag> <Tag kind="gray">WHATSAPP</Tag></div>
              <div><strong>New link expiry:</strong> 18 May 2026 (30 days)</div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn kind="secondary" onClick={() => setStep('idle')}>Cancel</Btn>
              <Btn kind="primary" onClick={() => setStep('success')} icon="↺">Resend notification</Btn>
            </div>
          </div>
        </div>
      )}

      {/* State 3: Success */}
      {step === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Notif kind="success"
            title="Notification resent successfully"
            subtitle="Email and WhatsApp delivery attempted for LH-2026-00829. Dinas Kesehatan Kota Bogor will receive a new download link."
            onClose={() => setStep('idle')}
          />
          <div style={{
            border: `1px solid ${C.border}`, borderRadius: 2, padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag kind="teal">LH Completed</Tag>
              <span style={{ fontWeight: 700 }}>LH-2026-00829</span>
              <Tag kind="teal">Resent</Tag>
            </div>
            <div style={{ fontSize: 12, color: C.gray50 }}>Just now</div>
          </div>
        </div>
      )}

      {/* State 4: Resend also failed */}
      {step === 'failed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Notif kind="error"
            title="Resend failed"
            subtitle="Email: SMTP 550 — Mailbox does not exist · WhatsApp: Number not registered. Status remains Failed."
            onClose={() => setStep('idle')}
          />
          <div style={{
            background: C.layerAccent01, border: `1px solid #ffd7d9`, borderRadius: 2,
            padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag kind="teal">LH Completed</Tag>
              <span style={{ fontWeight: 700 }}>LH-2026-00829</span>
              <Tag kind="red">Failed</Tag>
            </div>
            <div style={{ fontSize: 12, color: C.gray50 }}>Resend attempted: just now</div>
          </div>
          <p style={{ fontSize: 12, color: C.gray70 }}>
            Verify the recipient's email and WhatsApp number on the order record before attempting another resend.
          </p>
        </div>
      )}

      {/* State 5: Cooldown */}
      {step === 'cooldown' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: C.yellow10, border: `1px solid #f1c21b`, borderRadius: 2, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
          }}>
            <span style={{ color: C.yellow70, fontWeight: 700 }}>⏱</span>
            <span style={{ color: C.gray100 }}>
              <strong>Resend available in 7 min</strong> — a resend was triggered at 11:03. Maximum once per 10 minutes per LH.
            </span>
          </div>
          <div style={{
            background: C.layerAccent01, border: `1px solid #ffd7d9`, borderRadius: 2,
            padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag kind="teal">LH Completed</Tag>
              <span style={{ fontWeight: 700 }}>LH-2026-00829</span>
              <Tag kind="red">Failed</Tag>
            </div>
            <Btn kind="secondary" small disabled>↺ Resend (available in 7 min)</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — DELIVERY LOG MODAL (inline demo)
// ─────────────────────────────────────────────────────────────────────────────
function SceneDeliveryLog() {
  const [selectedMsg, setSelectedMsg] = useState('m3');

  const msg = MESSAGES.find(m => m.id === selectedMsg);
  const log = DELIVERY_LOG[selectedMsg] || [];

  const statusColor = { DELIVERED: C.green60, FAILED: C.red60, BOUNCED: C.yellow70 };

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 6 }}>Delivery Log</h2>
      <p style={{ fontSize: 13, color: C.gray70, marginBottom: 20 }}>
        Accessible via overflow menu → "View delivery log". Read-only; shows all channel attempts in order.
      </p>

      {/* Message selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {MESSAGES.slice(0, 5).map(m => (
          <button key={m.id} onClick={() => setSelectedMsg(m.id)} style={{
            padding: '6px 14px', borderRadius: 2,
            border: `1px solid ${selectedMsg === m.id ? C.blue60 : C.gray30}`,
            background: selectedMsg === m.id ? C.blue10 : C.white,
            color: selectedMsg === m.id ? C.blue70 : C.gray90,
            fontWeight: selectedMsg === m.id ? 600 : 400, fontSize: 12, cursor: 'pointer',
          }}>
            {m.ref} <Tag kind={STATUS_TAG[m.status]?.kind}>{STATUS_TAG[m.status]?.label}</Tag>
          </button>
        ))}
      </div>

      {/* Modal-style container */}
      <div style={{
        border: `1px solid ${C.border}`, borderRadius: 2,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: C.white,
      }}>
        {/* Modal header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.gray100 }}>Delivery Log</div>
            <div style={{ fontSize: 12, color: C.gray70, marginTop: 2 }}>
              {msg?.ref} · {msg?.recipient} · <Tag kind={msg?.typeTag}>{msg?.type}</Tag>
            </div>
          </div>
          <span style={{ fontSize: 11, color: C.gray50 }}>Read-only</span>
        </div>

        {/* Log table */}
        <div style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.gray10, borderBottom: `1px solid ${C.border}` }}>
                {['Channel', 'Status', 'Attempted At', 'Sent By', 'Error Detail'].map((h, i) => (
                  <th key={i} style={{
                    padding: '9px 14px', textAlign: 'left', fontWeight: 600,
                    color: C.gray70, fontSize: 12,
                    borderRight: i < 4 ? `1px solid ${C.border}` : 'none',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map((entry, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: C.white }}>
                  <td style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                    <Tag kind="gray">{entry.channel}</Tag>
                  </td>
                  <td style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                    <span style={{ fontWeight: 600, color: statusColor[entry.status] || C.gray70 }}>
                      {entry.status === 'DELIVERED' ? '✓ ' : entry.status === 'FAILED' ? '✕ ' : '⚠ '}
                      {entry.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: C.gray70, whiteSpace: 'nowrap', borderRight: `1px solid ${C.border}` }}>
                    {entry.at}
                  </td>
                  <td style={{ padding: '10px 14px', color: C.gray70, borderRight: `1px solid ${C.border}` }}>
                    {entry.actor}
                  </td>
                  <td style={{ padding: '10px 14px', color: entry.error ? C.red60 : C.gray50, fontSize: 12 }}>
                    {entry.error || <span style={{ fontStyle: 'italic' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <Btn kind="secondary" small>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 — CUSTOMER DOWNLOAD PAGE (Part 1 — public token link)
// ─────────────────────────────────────────────────────────────────────────────
function SceneDownload() {
  const [tokenState, setTokenState] = useState('valid'); // valid | expired | ratelimit

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 6 }}>
        Customer Download Page
      </h2>
      <p style={{ fontSize: 13, color: C.gray70, marginBottom: 20 }}>
        Public endpoint — <code style={{ background: C.gray10, padding: '2px 6px', borderRadius: 2, fontSize: 12 }}>GET /lh/download?token=…</code> — no login required. Part 1: direct from OpenELIS (public IP).
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[
          { key: 'valid',     label: '✓ Valid token' },
          { key: 'expired',   label: '✕ Expired / invalid (410)' },
          { key: 'ratelimit', label: '⏱ Rate limited (429)' },
        ].map(s => (
          <button key={s.key} onClick={() => setTokenState(s.key)} style={{
            padding: '6px 14px', borderRadius: 2,
            border: `1px solid ${tokenState === s.key ? C.blue60 : C.gray30}`,
            background: tokenState === s.key ? C.blue10 : C.white,
            color: tokenState === s.key ? C.blue70 : C.gray90,
            fontWeight: tokenState === s.key ? 600 : 400, fontSize: 12, cursor: 'pointer',
          }}>{s.label}</button>
        ))}
      </div>

      {/* Simulated browser page */}
      <div style={{
        border: `1px solid ${C.border}`, borderRadius: 4,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden', maxWidth: 560,
      }}>
        {/* Fake browser bar */}
        <div style={{ background: '#3c3c3c', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'block' }} />
          </div>
          <div style={{
            flex: 1, background: '#5c5c5c', borderRadius: 3, padding: '4px 10px',
            fontSize: 11, color: '#d4d4d4', fontFamily: 'monospace',
          }}>
            https://lab.bogor.go.id/lh/download?token=aB3xK9mQ…
          </div>
        </div>

        {/* Page content */}
        <div style={{ background: C.white, padding: 0 }}>
          {tokenState === 'valid' && (
            <div>
              <div style={{ height: 4, background: C.green60 }} />
              <div style={{ padding: '32px 36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: C.green50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                  }}>📄</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.gray100 }}>Laporan Hasil Tersedia</div>
                    <div style={{ fontSize: 13, color: C.gray70 }}>Test Certificate Ready</div>
                  </div>
                </div>
                <div style={{
                  background: C.gray10, borderRadius: 2, padding: '14px 16px', marginBottom: 20, fontSize: 13,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: C.gray70 }}>Order number</span>
                    <span style={{ fontWeight: 600 }}>ENV-2026-00829</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: C.gray70 }}>Customer</span>
                    <span style={{ fontWeight: 600 }}>PT Tirta Kencana</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: C.gray70 }}>Issued by</span>
                    <span>UPTD Labkesda Kota Bogor</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C.gray70 }}>Link expires</span>
                    <span>20 May 2026</span>
                  </div>
                </div>
                <Btn kind="primary" icon="⬇">Download certificate (PDF)</Btn>
                <div style={{ fontSize: 12, color: C.gray50, marginTop: 12 }}>
                  This link can be used multiple times until it expires. No login required.
                </div>
              </div>
            </div>
          )}

          {tokenState === 'expired' && (
            <div>
              <div style={{ height: 4, background: C.red60 }} />
              <div style={{ padding: '32px 36px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 8 }}>
                  Link Expired / Tautan Kadaluarsa
                </div>
                <p style={{ fontSize: 13, color: C.gray70, marginBottom: 20, lineHeight: 1.6 }}>
                  This download link has expired or is no longer valid.<br />
                  <em>Tautan unduhan ini telah kadaluarsa atau tidak lagi berlaku.</em>
                </p>
                <div style={{
                  background: C.gray10, borderRadius: 2, padding: '14px 16px',
                  fontSize: 13, color: C.gray70, marginBottom: 20, textAlign: 'left',
                }}>
                  Please contact your laboratory to request a new download link.<br />
                  <em>Silakan hubungi laboratorium Anda untuk meminta tautan unduhan baru.</em><br /><br />
                  <strong>UPTD Labkesda Kota Bogor</strong><br />
                  📞 (0251) 123-4567 · ✉ labkesda@bogor.go.id
                </div>
                <div style={{ fontSize: 11, color: C.gray50 }}>HTTP 410 Gone</div>
              </div>
            </div>
          )}

          {tokenState === 'ratelimit' && (
            <div>
              <div style={{ height: 4, background: C.yellow70 }} />
              <div style={{ padding: '32px 36px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⏱</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 8 }}>
                  Too Many Requests
                </div>
                <p style={{ fontSize: 13, color: C.gray70, marginBottom: 20 }}>
                  This link has been accessed too many times recently. Please wait a moment and try again.
                </p>
                <div style={{ fontSize: 11, color: C.gray50 }}>HTTP 429 — Rate limit: 20 requests / token / hour</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        marginTop: 20, padding: '12px 16px', background: C.blue10,
        border: `1px solid ${C.blue20}`, borderRadius: 2, fontSize: 12, color: C.blue70,
      }}>
        <strong>Part 2 note:</strong> When <code>lh.download.fhir.server.url</code> is configured, the token URL points to the consolidated FHIR server instead of this OpenELIS host — same customer experience, different backend. Part 2 spec is deferred.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHELL — top bar + sidebar with "Sent Messages" nav item
// ─────────────────────────────────────────────────────────────────────────────
function Shell({ activeScene, setScene }) {
  const NAV = [
    { key: 'home',     icon: '⊞', label: 'Dashboard' },
    { key: 'orders',   icon: '📋', label: 'Orders' },
    { key: 'results',  icon: '🔬', label: 'Results' },
    { key: 'lh',       icon: '📄', label: 'Laporan Hasil' },
    { key: 'messages', icon: '✉', label: 'Sent Messages', highlight: true },
    { key: 'admin',    icon: '⚙', label: 'Admin' },
  ];

  const SCENES = [
    { key: 'list',     label: '1 — Sent Messages list' },
    { key: 'resend',   label: '2 — Resend flow' },
    { key: 'log',      label: '3 — Delivery log' },
    { key: 'download', label: '4 — Customer download page' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.gray10, fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Top bar */}
      <div style={{
        background: C.topBarBg, height: 48, display: 'flex', alignItems: 'center',
        padding: '0 16px', position: 'sticky', top: 0, zIndex: 200,
      }}>
        <span style={{ color: C.white, fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>
          OpenELIS Global
        </span>
        <span style={{ marginLeft: 20, fontSize: 11, color: '#a8a8a8', padding: '2px 8px', background: '#3d3d3d', borderRadius: 10 }}>
          S-06b — LH Delivery · Sent Messages Tab
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {SCENES.map(s => (
            <button key={s.key} onClick={() => setScene(s.key)} style={{
              padding: '5px 12px', borderRadius: 2, border: 'none',
              background: activeScene === s.key ? C.blue60 : '#3d3d3d',
              color: C.white, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <div style={{
          width: 224, background: C.sidebarBg, minHeight: 'calc(100vh - 48px)',
          position: 'sticky', top: 48, flexShrink: 0,
        }}>
          {NAV.map(item => {
            const isMessages = item.key === 'messages';
            const active = isMessages && activeScene !== 'download';
            return (
              <div key={item.key} style={{
                padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12,
                background: active ? C.sidebarActive : 'transparent',
                borderLeft: active ? `3px solid ${C.white}` : '3px solid transparent',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? C.white : (item.highlight ? '#c6e0ff' : C.sidebarSub),
                }}>{item.label}</span>
                {item.highlight && !active && (
                  <span style={{
                    marginLeft: 'auto', background: C.blue60, color: C.white,
                    borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 7px',
                  }}>NEW</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeScene === 'list' && (
            <SceneSentMessages
              onOpenLog={(m) => {}}
              onOpenResend={(m) => {}}
            />
          )}
          {activeScene === 'resend'   && <SceneResend />}
          {activeScene === 'log'      && <SceneDeliveryLog />}
          {activeScene === 'download' && <SceneDownload />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [scene, setScene] = useState('list');
  return <Shell activeScene={scene} setScene={setScene} />;
}
