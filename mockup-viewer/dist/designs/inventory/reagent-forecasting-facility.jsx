import { useState } from "react";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  blue60: '#0f62fe', blue70: '#0043ce', blue10: '#edf5ff', blue20: '#d0e2ff',
  green50: '#defbe6', green60: '#198038', green10: '#f2faf4',
  red50: '#fff1f1', red60: '#da1e28', red10: '#fff0f0',
  yellow10: '#fdf4c4', yellow70: '#8e6a00',
  gray10: '#f4f4f4', gray20: '#e0e0e0', gray30: '#c6c6c6',
  gray50: '#8d8d8d', gray70: '#525252', gray80: '#393939', gray90: '#262626', gray100: '#161616',
  warmGray20: '#e5e0df', warmGray60: '#8f8b8b',
  white: '#ffffff',
  sidebarBg: '#262626', sidebarHover: '#353535', sidebarActive: '#0f62fe',
  sidebarText: '#f4f4f4', sidebarSub: '#c6c6c6',
  topBarBg: '#161616',
  border: '#e0e0e0',
};

const TAG = {
  CRITICAL:         { bg: C.red50,      color: C.red60,    border: '#ffa4a9', label: 'Critical' },
  LOW:              { bg: C.warmGray20, color: '#5c4033',  border: C.warmGray60, label: 'Low Stock' },
  ADEQUATE:         { bg: C.green50,    color: C.green60,  border: '#a7f0ba', label: 'Adequate' },
  OVERSTOCKED:      { bg: C.blue10,     color: C.blue70,   border: C.blue20, label: 'Overstocked' },
  INSUFFICIENT_DATA:{ bg: C.gray10,     color: C.gray70,   border: C.gray30, label: 'Insufficient Data' },
};

// ─── Sample data ──────────────────────────────────────────────────────────────
const FACILITY_NAME = 'Port Moresby General Hospital';

const CARTRIDGES = [
  {
    id: 'c1', name: 'GeneXpert MTB/RIF', stockOnHand: 12, adc: 3.2,
    status: 'CRITICAL', lastCorrected: '2026-03-20',
    history: [
      { date: '2026-03-22', tests: 4, used: 4 }, { date: '2026-03-21', tests: 3, used: 3 },
      { date: '2026-03-20', tests: 5, used: 5 }, { date: '2026-03-19', tests: 2, used: 2 },
      { date: '2026-03-18', tests: 3, used: 3 }, { date: '2026-03-17', tests: 4, used: 4 },
      { date: '2026-03-16', tests: 3, used: 3 }, { date: '2026-03-15', tests: 2, used: 2 },
    ],
  },
  {
    id: 'c2', name: 'GeneXpert MTB/RIF Ultra', stockOnHand: 45, adc: 1.8,
    status: 'LOW', lastCorrected: '2026-03-22',
    history: [
      { date: '2026-03-22', tests: 2, used: 2 }, { date: '2026-03-21', tests: 1, used: 1 },
      { date: '2026-03-20', tests: 2, used: 2 }, { date: '2026-03-19', tests: 3, used: 3 },
      { date: '2026-03-18', tests: 2, used: 2 }, { date: '2026-03-17', tests: 1, used: 1 },
    ],
  },
  {
    id: 'c3', name: 'GeneXpert HIV Viral Load', stockOnHand: 180, adc: 2.1,
    status: 'ADEQUATE', lastCorrected: '2026-03-19',
    history: [
      { date: '2026-03-22', tests: 2, used: 2 }, { date: '2026-03-21', tests: 3, used: 3 },
      { date: '2026-03-20', tests: 1, used: 1 }, { date: '2026-03-19', tests: 2, used: 2 },
    ],
  },
  {
    id: 'c4', name: 'GeneXpert CT/NG', stockOnHand: 320, adc: 0.9,
    status: 'OVERSTOCKED', lastCorrected: '2026-03-15',
    history: [
      { date: '2026-03-22', tests: 1, used: 1 }, { date: '2026-03-21', tests: 0, used: 0 },
      { date: '2026-03-20', tests: 1, used: 1 }, { date: '2026-03-19', tests: 1, used: 1 },
    ],
  },
];

function dos(c) {
  if (c.adc === 0) return null;
  return Math.round(c.stockOnHand / c.adc);
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function StatusTag({ status }) {
  const s = TAG[status] || TAG.INSUFFICIENT_DATA;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
}

function Notif({ kind, title, subtitle, onClose }) {
  const p = {
    error:   { bg: C.red50,    border: C.red60,    color: C.red60,    icon: '⚠' },
    warning: { bg: C.yellow10, border: C.yellow70, color: C.yellow70, icon: '⚠' },
    success: { bg: C.green50,  border: C.green60,  color: C.green60,  icon: '✓' },
    info:    { bg: C.blue10,   border: C.blue60,   color: C.blue70,   icon: 'ℹ' },
  }[kind] || {};
  return (
    <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 2, borderLeft: `4px solid ${p.border}`, background: p.bg }}>
      <span style={{ color: p.color, fontWeight: 700, fontSize: 16 }}>{p.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: C.gray100 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.gray70, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.gray50 }}>×</button>}
    </div>
  );
}

function Btn({ children, kind = 'primary', onClick, disabled, small }) {
  const base = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: small ? '6px 12px' : '10px 20px', borderRadius: 2, fontSize: small ? 12 : 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none' };
  const styles = {
    primary:   { ...base, background: disabled ? C.gray30 : C.blue60, color: C.white },
    secondary: { ...base, background: C.gray10, color: C.gray90, border: `1px solid ${C.gray30}` },
    ghost:     { ...base, background: 'transparent', color: C.blue60 },
  };
  return <button style={styles[kind] || styles.primary} onClick={onClick} disabled={disabled}>{children}</button>;
}

// ─── Stat pill used on each card ──────────────────────────────────────────────
function StatPill({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.gray50 }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color: highlight || C.gray100 }}>{value}</span>
    </div>
  );
}

// ─── Individual cartridge card ────────────────────────────────────────────────
function CartridgeCard({ cartridge, onStockUpdated }) {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [newStock, setNewStock] = useState('');
  const [saved, setSaved] = useState(false);
  const [localData, setLocalData] = useState(cartridge);
  const [error, setError] = useState('');

  const d = dos(localData);
  const isCritical = localData.status === 'CRITICAL';
  const isInsufficient = localData.status === 'INSUFFICIENT_DATA';

  const handleSave = () => {
    const val = parseInt(newStock, 10);
    if (isNaN(val) || newStock === '') { setError('Stock count is required.'); return; }
    if (val < 0) { setError('Stock count cannot be negative.'); return; }
    setError('');
    const newAdc = localData.adc;
    const newDos = newAdc > 0 ? Math.round(val / newAdc) : null;
    let newStatus = 'ADEQUATE';
    if (newDos === null) newStatus = 'INSUFFICIENT_DATA';
    else if (newDos < 7) newStatus = 'CRITICAL';
    else if (newDos < 30) newStatus = 'LOW';
    else if (newDos > 90) newStatus = 'OVERSTOCKED';
    setLocalData(prev => ({ ...prev, stockOnHand: val, status: newStatus, lastCorrected: '2026-03-23' }));
    setUpdateOpen(false);
    setSaved(true);
    setNewStock('');
    setTimeout(() => setSaved(false), 3000);
    if (onStockUpdated) onStockUpdated(cartridge.id, val, newStatus);
  };

  const cardBorder = isCritical ? `2px solid ${C.red60}` : `1px solid ${C.border}`;

  const thS = { padding: '8px 12px', fontSize: 11, fontWeight: 700, color: C.gray70, textAlign: 'left', borderBottom: `1px solid ${C.gray20}`, background: C.gray10 };
  const tdS = { padding: '8px 12px', fontSize: 12, borderBottom: `1px solid ${C.gray20}` };

  return (
    <div style={{ background: C.white, border: cardBorder, borderRadius: 4, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Card header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.gray20}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gray100, marginBottom: 6 }}>{localData.name}</div>
          <StatusTag status={localData.status} />
        </div>
        {isCritical && (
          <div style={{ fontSize: 11, fontWeight: 700, color: C.red60, background: C.red50, padding: '4px 8px', borderRadius: 12 }}>
            ⚠ REORDER NOW
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: 32, borderBottom: `1px solid ${C.gray20}` }}>
        <StatPill
          label="Days of Stock"
          value={isInsufficient ? '—' : (d !== null ? d : '—')}
          highlight={isCritical ? C.red60 : localData.status === 'LOW' ? C.yellow70 : C.gray100}
        />
        <StatPill label="Stock on Hand" value={localData.stockOnHand} />
        <StatPill label="Avg Daily Use" value={localData.adc.toFixed(1)} />
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'right' }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.gray50 }}>Last count</span>
          <span style={{ fontSize: 12, color: C.gray70 }}>{localData.lastCorrected}</span>
        </div>
      </div>

      {/* Action row */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 10, background: C.gray10 }}>
        <Btn kind="secondary" small onClick={() => { setUpdateOpen(!updateOpen); setHistoryOpen(false); setError(''); }}>
          {updateOpen ? '▲ Close' : '✎ Update Stock'}
        </Btn>
        <Btn kind="ghost" small onClick={() => { setHistoryOpen(!historyOpen); setUpdateOpen(false); }}>
          {historyOpen ? '▲ Hide History' : '▼ Consumption History'}
        </Btn>
      </div>

      {/* Inline stock update */}
      {updateOpen && (
        <div style={{ padding: '16px 20px', borderTop: `2px solid ${C.blue60}`, background: '#f0f4ff' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.gray90, marginBottom: 12 }}>Enter Current Stock Count</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 4 }}>
                New Stock on Hand (cartridges)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => setNewStock(v => String(Math.max(0, (parseInt(v,10)||0) - 1)))}
                  style={{ padding: '8px 12px', border: `1px solid ${C.gray30}`, background: C.white, cursor: 'pointer', borderRadius: 2 }}>−</button>
                <input
                  type="number" value={newStock} onChange={e => { setNewStock(e.target.value); setError(''); }}
                  placeholder={String(localData.stockOnHand)}
                  min={0}
                  style={{
                    width: 90, padding: '8px 10px', textAlign: 'center',
                    border: `2px solid ${error ? C.red60 : C.gray30}`, borderRadius: 2, fontSize: 14,
                  }}
                />
                <button onClick={() => setNewStock(v => String((parseInt(v,10)||0) + 1))}
                  style={{ padding: '8px 12px', border: `1px solid ${C.gray30}`, background: C.white, cursor: 'pointer', borderRadius: 2 }}>+</button>
              </div>
              {error && <p style={{ fontSize: 11, color: C.red60, marginTop: 4 }}>{error}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Btn kind="primary" small onClick={handleSave}>Save</Btn>
            <Btn kind="ghost" small onClick={() => { setUpdateOpen(false); setError(''); setNewStock(''); }}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Save success */}
      {saved && (
        <div style={{ padding: '8px 20px', background: C.green10, borderTop: `1px solid #a7f0ba` }}>
          <span style={{ fontSize: 12, color: C.green60, fontWeight: 600 }}>✓ Stock count updated. Forecast recalculated.</span>
        </div>
      )}

      {/* Consumption history accordion */}
      {historyOpen && (
        <div style={{ borderTop: `1px solid ${C.gray20}` }}>
          <div style={{ padding: '12px 20px', background: C.gray10, borderBottom: `1px solid ${C.gray20}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gray70, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Consumption History — Last 30 Days
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thS}>Date</th>
                  <th style={thS}>Tests Run</th>
                  <th style={thS}>Cartridges Used</th>
                </tr>
              </thead>
              <tbody>
                {localData.history.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.gray10 }}>
                    <td style={tdS}>{row.date}</td>
                    <td style={tdS}>{row.tests}</td>
                    <td style={tdS}>{row.used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main facility stock page ─────────────────────────────────────────────────
function PageFacilityStock() {
  const [cartridges, setCartridges] = useState(CARTRIDGES);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const criticals = cartridges.filter(c => c.status === 'CRITICAL');
  const lows      = cartridges.filter(c => c.status === 'LOW');
  const summary = [
    criticals.length > 0 ? `${criticals.length} Critical` : null,
    lows.length > 0      ? `${lows.length} Low` : null,
    cartridges.filter(c => c.status === 'ADEQUATE').length > 0 ? `${cartridges.filter(c => c.status === 'ADEQUATE').length} Adequate` : null,
    cartridges.filter(c => c.status === 'OVERSTOCKED').length > 0 ? `${cartridges.filter(c => c.status === 'OVERSTOCKED').length} Overstocked` : null,
  ].filter(Boolean).join(' · ');

  const handleStockUpdated = (id, newVal, newStatus) => {
    setCartridges(prev => prev.map(c => c.id === id ? { ...c, stockOnHand: newVal, status: newStatus } : c));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.gray100, marginBottom: 4 }}>Reagent Stock</h1>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13, color: C.gray70 }}>
          <span>📍 {FACILITY_NAME}</span>
          <span>·</span>
          <span>{summary}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11 }}>Forecast last computed: 2026-03-23 06:00</span>
        </div>
      </div>

      {/* Alert banners */}
      {criticals.length > 0 && !dismissedAlerts.includes('critical') && (
        <Notif
          kind="error"
          title={`Critical stock: ${criticals.map(c => c.name).join(', ')}`}
          subtitle={criticals.map(c => `${c.name}: ${dos(c)} days remaining`).join(' · ')}
          onClose={() => setDismissedAlerts(p => [...p, 'critical'])}
        />
      )}
      {lows.length > 0 && !dismissedAlerts.includes('low') && (
        <Notif
          kind="warning"
          title={`Low stock: ${lows.map(c => c.name).join(', ')}`}
          subtitle={lows.map(c => `${c.name}: ${dos(c)} days remaining`).join(' · ')}
          onClose={() => setDismissedAlerts(p => [...p, 'low'])}
        />
      )}

      {/* Cartridge cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 16 }}>
        {cartridges.map(c => (
          <CartridgeCard key={c.id} cartridge={c} onStockUpdated={handleStockUpdated} />
        ))}
      </div>
    </div>
  );
}

// ─── OpenELIS Shell ───────────────────────────────────────────────────────────
const NAV = [
  { key: 'home',    label: 'Home',    icon: '⌂' },
  { key: 'patient', label: 'Patient', icon: '👤' },
  { key: 'order',   label: 'Order',   icon: '📋' },
  { key: 'results', label: 'Results', icon: '🧪' },
  {
    key: 'inventory', label: 'Inventory', icon: '📦',
    children: [
      { key: 'reagent-stock',    label: 'Reagent Stock' },
      { key: 'reagent-requests', label: 'Reagent Requests' },
    ],
  },
  {
    key: 'admin', label: 'Administration', icon: '⚙',
    children: [
      { key: 'admin-forecasting', label: 'Reagent Forecasting' },
      { key: 'admin-sms',         label: 'SMS Notifications' },
    ],
  },
  { key: 'reports', label: 'Reports', icon: '📊' },
];

export default function App() {
  const [activePage, setActivePage] = useState('reagent-stock');
  const [expandedNav, setExpandedNav] = useState(['inventory']);

  const toggleNav = (key) => setExpandedNav(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const renderNav = (item, depth = 0) => {
    const isActive   = activePage === item.key;
    const isExpanded = expandedNav.includes(item.key);
    const hasKids    = !!item.children?.length;
    return (
      <div key={item.key}>
        <button
          onClick={() => { if (hasKids) toggleNav(item.key); else setActivePage(item.key); }}
          style={{
            width: '100%', textAlign: 'left', padding: `10px ${12 + depth * 14}px`,
            fontSize: depth === 0 ? 14 : 13, fontWeight: isActive ? 700 : 400,
            background: isActive ? C.sidebarActive : 'transparent',
            color: isActive ? C.white : C.sidebarText,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            borderLeft: isActive ? `3px solid ${C.white}` : '3px solid transparent',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.sidebarHover; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
          {item.icon && <span style={{ width: 20, textAlign: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</span>}
          <span style={{ flex: 1 }}>{item.label}</span>
          {hasKids && <span style={{ fontSize: 10, color: C.sidebarSub }}>{isExpanded ? '▲' : '▼'}</span>}
        </button>
        {hasKids && isExpanded && (
          <div style={{ borderLeft: depth === 0 ? `2px solid #444` : 'none', marginLeft: depth === 0 ? 20 : 0 }}>
            {item.children.map(c => renderNav(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ background: C.topBarBg, height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, flexShrink: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, background: C.blue60, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: C.white, fontSize: 12, fontWeight: 800 }}>OE</span>
          </div>
          <span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>OpenELIS Global</span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ color: C.gray30, fontSize: 12 }}>Port Moresby General Hospital</span>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.blue60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>CI</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 240, background: C.sidebarBg, flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: '8px 0' }}>
            {NAV.map(item => renderNav(item, 0))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: C.gray10 }}>
          <div style={{ maxWidth: 1050, margin: '0 auto', padding: '24px 32px' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20, fontSize: 12, color: C.gray50 }}>
              <span>Inventory</span>
              <span style={{ color: C.gray30 }}>/</span>
              <span style={{ color: C.gray90, fontWeight: 600 }}>Reagent Stock</span>
            </div>
            {activePage === 'reagent-stock' && <PageFacilityStock />}
            {activePage !== 'reagent-stock' && (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: 40, textAlign: 'center', color: C.gray50 }}>
                <p style={{ fontSize: 14 }}>Select a page from the sidebar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
