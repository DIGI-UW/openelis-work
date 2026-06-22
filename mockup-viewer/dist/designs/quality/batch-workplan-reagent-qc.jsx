import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Plus, Printer, RefreshCw, Save, X, AlertTriangle, MoreVertical, Search, Archive, Edit3, Check, Menu, User, Bell, Settings, Home, FileText, FlaskConical, ClipboardList, BarChart3, ShieldCheck, Microscope, TestTubes, Beaker } from 'lucide-react';

const t = (key, fb) => fb || key;

// ─── Carbon Tokens ─────────────────────────────────────────────────────────
const C = {
  gray10: '#f4f4f4', gray20: '#e0e0e0', gray30: '#c6c6c6', gray50: '#8d8d8d',
  gray60: '#6f6f6f', gray70: '#525252', gray80: '#393939', gray90: '#262626', gray100: '#161616',
  blue60: '#0f62fe', blue10: '#edf5ff', blue80: '#002d9c',
  red60: '#da1e28', red10: '#fff1f1',
  green50: '#24a148', green10: '#defbe6',
  teal50: '#009d9a', teal10: '#d9fbfb',
  purple60: '#8a3ffc', purple10: '#f6f2ff',
  yellow30: '#f1c21b', yellow10: '#fdf6dd',
  warmGray50: '#736f6f', warmGray10: '#f7f3f2',
  white: '#ffffff',
};

// ─── Mock Data ─────────────────────────────────────────────────────────────
const TESTS = [
  { id: '1', labNumber: 'LAB-2026-0451', patientName: 'Ranaivo, Jean', testName: 'Glucose', panel: 'Chemistry', labUnit: 'Biochemistry', priority: 'Routine', orderDate: '2026-03-16', sampleType: 'Serum' },
  { id: '2', labNumber: 'LAB-2026-0452', patientName: 'Razafindrakoto, Marie', testName: 'Creatinine', panel: 'Chemistry', labUnit: 'Biochemistry', priority: 'Urgent', orderDate: '2026-03-16', sampleType: 'Serum' },
  { id: '3', labNumber: 'LAB-2026-0453', patientName: 'Andrianarisoa, Paul', testName: 'Glucose', panel: 'Chemistry', labUnit: 'Biochemistry', priority: 'Routine', orderDate: '2026-03-16', sampleType: 'Plasma' },
  { id: '4', labNumber: 'LAB-2026-0454', patientName: 'Rakoto, Fara', testName: 'ALT', panel: 'Liver Panel', labUnit: 'Biochemistry', priority: 'STAT', orderDate: '2026-03-16', sampleType: 'Serum' },
  { id: '5', labNumber: 'LAB-2026-0455', patientName: 'Rasoamanana, Hery', testName: 'CBC', panel: 'Hematology', labUnit: 'Hematology', priority: 'Routine', orderDate: '2026-03-15', sampleType: 'Whole Blood' },
  { id: '6', labNumber: 'LAB-2026-0456', patientName: 'Rabearivelo, Soa', testName: 'Hemoglobin', panel: 'Hematology', labUnit: 'Hematology', priority: 'Routine', orderDate: '2026-03-15', sampleType: 'Whole Blood' },
  { id: '7', labNumber: 'LAB-2026-0457', patientName: 'Randriamampionona, Aina', testName: 'Urea', panel: 'Chemistry', labUnit: 'Biochemistry', priority: 'Routine', orderDate: '2026-03-16', sampleType: 'Serum' },
];
const REAGENTS = [{ id: 'r1', name: 'Glucose Reagent Kit' }, { id: 'r2', name: 'Creatinine Enzymatic Reagent' }, { id: 'r3', name: 'ALT Reagent' }, { id: 'r4', name: 'Cellpack DCL' }];
const LOTS = {
  r1: [{ id: 'l1', lotNumber: 'LOT-2026-0234', expires: '2026-06-15', remaining: '65%', fifoRank: 1, status: 'ok' }, { id: 'l2', lotNumber: 'LOT-2026-0567', expires: '2026-09-01', remaining: '95%', fifoRank: 2, status: 'ok' }],
  r2: [{ id: 'l3', lotNumber: 'LOT-2026-0112', expires: '2026-03-20', remaining: '12%', fifoRank: 1, status: 'expiring-soon' }, { id: 'l4', lotNumber: 'LOT-2026-0445', expires: '2026-08-20', remaining: '100%', fifoRank: 2, status: 'ok' }],
  r3: [{ id: 'l5', lotNumber: 'LOT-2026-0789', expires: '2026-12-01', remaining: '98%', fifoRank: 1, status: 'ok' }],
};
const INIT_BATCHES = [
  { id: 'b1', batchName: 'Chemistry AM Run', tests: ['1', '3'], reagentId: 'r1', reagentName: 'Glucose Reagent Kit', lotId: 'l1', lotNumber: 'LOT-2026-0234', status: 'DRAFT', createdDate: '2026-03-16 07:30', qcStatus: 'pass', lastQcDate: '2026-03-16 06:15', lastQcBy: 'Rabe, Tiana', lastQcResult: 'Pass', lastQcValue: 'Control L1: 95 mg/dL', nceId: null },
  { id: 'b2', batchName: 'Creatinine Batch', tests: ['2'], reagentId: 'r2', reagentName: 'Creatinine Enzymatic Reagent', lotId: 'l3', lotNumber: 'LOT-2026-0112', status: 'DRAFT', createdDate: '2026-03-16 07:45', qcStatus: 'overdue', lastQcDate: '2026-03-15 06:00', lastQcBy: 'Rabe, Tiana', lastQcResult: 'Pass', lastQcValue: '', nceId: null },
  { id: 'b3', batchName: 'Hematology Batch', tests: ['5', '6'], reagentId: null, reagentName: null, lotId: null, lotNumber: null, status: 'DRAFT', createdDate: '2026-03-16 08:00', qcStatus: null, lastQcDate: null, lastQcBy: null, lastQcResult: null, lastQcValue: null, nceId: null },
];

// ─── Primitives ────────────────────────────────────────────────────────────
const Tag = ({ color, bg, children, onClick, style = {} }) => (
  <span onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '24px', fontSize: '0.7rem', fontWeight: 500, color, backgroundColor: bg, whiteSpace: 'nowrap', cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</span>
);
const PriorityTag = ({ p }) => { const m = { Routine: [C.gray70, C.gray20], Urgent: [C.purple60, C.purple10], STAT: [C.red60, C.red10] }; const [c, b] = m[p] || m.Routine; return <Tag color={c} bg={b}>{p}</Tag>; };
const QcTag = ({ s }) => { const m = { pass: [C.green50, C.green10, 'QC Pass'], overdue: [C.red60, C.red10, 'QC Overdue'], failed: [C.red60, C.red10, 'QC Failed'], 'not-run': [C.gray60, C.gray10, 'Not Run'] }; const [c, b, l] = m[s] || m['not-run']; return <Tag color={c} bg={b}>{l}</Tag>; };
const STag = ({ s }) => { const m = { DRAFT: [C.blue60, C.blue10, 'Draft'], ACTIVE: [C.teal50, C.teal10, 'Active'] }; const [c, b, l] = m[s] || m.DRAFT; return <Tag color={c} bg={b}>{l}</Tag>; };

const Btn = ({ children, kind = 'primary', icon: I, disabled, onClick, style = {} }) => {
  const k = { primary: { bg: disabled ? C.gray30 : C.blue60, c: C.white }, secondary: { bg: C.gray80, c: C.white }, tertiary: { bg: 'transparent', c: C.blue60, border: `1px solid ${C.blue60}` }, ghost: { bg: 'transparent', c: C.blue60 }, danger: { bg: C.red60, c: C.white }, 'danger-ghost': { bg: 'transparent', c: C.red60 } };
  const s = k[kind] || k.primary;
  return <button onClick={disabled ? undefined : onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: s.border || 'none', borderRadius: 0, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500, fontSize: '0.8rem', padding: '4px 14px', height: 32, background: s.bg, color: s.c, opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', ...style }}>{I && <I size={14} />}{children}</button>;
};

const Notif = ({ kind = 'warning', title, subtitle }) => {
  const c = kind === 'warning' ? { bg: '#fdf6dd', b: '#f1c21b' } : { bg: '#fff1f1', b: '#da1e28' };
  return <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: c.bg, borderLeft: `3px solid ${c.b}`, fontSize: '0.8rem' }}><AlertTriangle size={14} color={c.b} style={{ flexShrink: 0, marginTop: 2 }} /><div><strong>{title}</strong>{subtitle && <div style={{ color: C.gray70, marginTop: 2 }}>{subtitle}</div>}</div></div>;
};

const FilterSel = ({ label, options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 120 }}>
      <label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3, fontWeight: 600 }}>{label}</label>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', height: 28, border: `1px solid ${C.gray30}`, background: C.white, cursor: 'pointer', fontSize: '0.75rem' }}>
        {selected.length ? `${selected.length} selected` : 'All'} <ChevronDown size={12} />
      </div>
      {open && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: C.white, border: `1px solid ${C.gray20}`, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', maxHeight: 180, overflow: 'auto' }}>
        {options.map(o => <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', fontSize: '0.75rem', cursor: 'pointer', background: selected.includes(o) ? C.blue10 : 'transparent' }}><input type="checkbox" checked={selected.includes(o)} onChange={() => onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o])} style={{ accentColor: C.blue60 }} />{o}</label>)}
      </div>}
    </div>
  );
};

// ─── OpenELIS Header ───────────────────────────────────────────────────────
const AppHeader = () => (
  <header style={{ height: 48, background: C.gray100, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Menu size={20} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Microscope size={20} color="#0f62fe" />
        <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.5px' }}>OpenELIS Global</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Bell size={18} style={{ opacity: 0.7 }} />
      <Settings size={18} style={{ opacity: 0.7 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
        <User size={16} /> Rabe, Tiana
      </div>
    </div>
  </header>
);

// ─── OpenELIS Sidebar ──────────────────────────────────────────────────────
const Sidebar = ({ activePage, onNavigate }) => {
  const [wpOpen, setWpOpen] = useState(true);

  const menuItem = (label, page, icon, indent = false) => {
    const active = activePage === page;
    return (
      <div key={page} onClick={() => page && onNavigate(page)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: indent ? '8px 16px 8px 36px' : '8px 16px', cursor: page ? 'pointer' : 'default', background: active ? C.blue10 : 'transparent', color: active ? C.blue60 : C.gray80, fontSize: '0.8rem', fontWeight: active ? 600 : 400, borderLeft: active ? `3px solid ${C.blue60}` : '3px solid transparent' }}>
        {icon} {label}
      </div>
    );
  };

  return (
    <nav style={{ width: 220, background: C.white, borderRight: `1px solid ${C.gray20}`, position: 'fixed', top: 48, left: 0, bottom: 0, overflowY: 'auto', zIndex: 40 }}>
      <div style={{ padding: '12px 0' }}>
        {menuItem('Home', 'home', <Home size={15} />)}
        {menuItem('Order Entry', null, <FileText size={15} />)}
        {menuItem('Sample Entry', null, <TestTubes size={15} />)}
        {menuItem('Results Entry', null, <ClipboardList size={15} />)}
        {menuItem('Validation', null, <ShieldCheck size={15} />)}

        {/* Workplan menu group */}
        <div onClick={() => setWpOpen(!wpOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', cursor: 'pointer', fontSize: '0.8rem', color: C.gray80, fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Beaker size={15} /> {t('nav.workplan', 'Workplan')}
          </span>
          {wpOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {wpOpen && (
          <>
            {menuItem(t('nav.workplan.pendingTests', 'Pending Tests'), 'pending-tests', null, true)}
            {menuItem(t('nav.workplan.batches', 'Batches'), 'batches', null, true)}
          </>
        )}

        {menuItem('Reports', null, <BarChart3 size={15} />)}
        {menuItem('Admin', null, <Settings size={15} />)}
      </div>
    </nav>
  );
};

// ─── Lot Card ──────────────────────────────────────────────────────────────
const LotCard = ({ lot, selected, onSelect }) => {
  const isFifo = lot.fifoRank === 1; const isExp = lot.status === 'expiring-soon';
  let bc = C.gray20, bg = C.white;
  if (selected) { bc = C.blue60; bg = C.blue10; } else if (isFifo) { bc = C.teal50; bg = C.teal10; } else if (isExp) { bc = C.yellow30; bg = C.yellow10; }
  return (
    <div onClick={() => onSelect(lot.id)} style={{ border: `2px ${isFifo && !selected ? 'dashed' : 'solid'} ${bc}`, borderRadius: 2, padding: '6px 10px', marginBottom: 4, background: bg, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="radio" checked={selected} readOnly style={{ accentColor: C.blue60 }} />
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{lot.lotNumber}</span>
        {isFifo && <Tag color={C.teal50} bg={C.teal10}>FIFO</Tag>}
        {isExp && <Tag color={C.warmGray50} bg={C.warmGray10}>Expiring</Tag>}
      </div>
      <span style={{ fontSize: '0.7rem', color: C.gray60 }}>Exp: {lot.expires} · {lot.remaining}</span>
    </div>
  );
};

// ─── Step Indicator ────────────────────────────────────────────────────────
const Step = ({ n, label, done, active }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: active || done ? 1 : 0.4 }}>
    <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? C.green50 : active ? C.blue60 : C.gray30, color: C.white, fontSize: '0.65rem', fontWeight: 700 }}>{done ? <Check size={11} /> : n}</div>
    <span style={{ fontSize: '0.75rem', fontWeight: active ? 600 : 400, color: active ? C.gray100 : C.gray60 }}>{label}</span>
  </div>
);

// ─── Batch Tile ────────────────────────────────────────────────────────────
const BatchTile = ({ batch, onArchive, expanded, onExpand, onUpdate }) => {
  const [showQc, setShowQc] = useState(false);
  const [qcR, setQcR] = useState('');
  const [qcV, setQcV] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [locReag, setLocReag] = useState(batch.reagentId || '');
  const [locLot, setLocLot] = useState(batch.lotId || null);
  const hasR = !!batch.reagentId; const hasL = !!batch.lotId;
  const qcBad = batch.qcStatus === 'overdue' || batch.qcStatus === 'failed';
  const bTests = TESTS.filter(tt => batch.tests.includes(tt.id));
  const lots = locReag ? (LOTS[locReag] || []) : [];
  const phase = hasR && hasL ? 2 : 1;

  return (
    <div style={{ marginBottom: 8, border: `${qcBad ? '2px' : '1px'} solid ${qcBad ? C.red60 : C.gray20}`, background: C.white }}>
      <div onClick={() => onExpand(batch.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', cursor: 'pointer', background: expanded ? C.gray10 : C.white }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {expanded ? <ChevronUp size={14} color={C.gray70} /> : <ChevronDown size={14} color={C.gray70} />}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{batch.batchName}</div>
            <div style={{ fontSize: '0.75rem', color: C.gray60, marginTop: 1 }}>
              {hasR ? batch.reagentName : <em style={{ color: C.gray50 }}>Reagent not assigned</em>}{hasL && <> · {batch.lotNumber}</>} · {batch.tests.length} tests
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
          <STag s={batch.status} />
          {hasL && batch.qcStatus && <QcTag s={batch.qcStatus} />}
          {!hasR && <Tag color={C.gray60} bg={C.gray10}>Needs setup</Tag>}
          {batch.nceId && <Tag color={C.red60} bg={C.red10}>NCE: {batch.nceId}</Tag>}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3 }}><MoreVertical size={14} color={C.gray60} /></button>
            {menuOpen && <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, background: C.white, border: `1px solid ${C.gray20}`, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', minWidth: 130 }}>
              <div style={{ padding: '7px 14px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setMenuOpen(false)}><Edit3 size={12} /> Edit</div>
              <div style={{ padding: '7px 14px', fontSize: '0.75rem', cursor: 'pointer', color: C.red60, display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => { onArchive(batch.id); setMenuOpen(false); }}><Archive size={12} /> Archive</div>
            </div>}
          </div>
        </div>
      </div>
      {qcBad && <div style={{ padding: '0 12px 6px' }}><Notif kind="warning" title="QC Overdue" subtitle={`QC not performed for ${batch.reagentName} lot ${batch.lotNumber}. Last: ${batch.lastQcDate || 'Never'}.`} /></div>}

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.gray20}`, padding: 12 }}>
          {/* Steps */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${C.gray20}` }}>
            <Step n={1} label="Tests" done active={false} />
            <div style={{ width: 30, borderTop: `2px solid ${phase >= 2 ? C.green50 : C.gray30}`, alignSelf: 'center' }} />
            <Step n={2} label="Reagent & QC" done={phase >= 2 && batch.qcStatus === 'pass'} active />
            <div style={{ width: 30, borderTop: `2px solid ${batch.status === 'ACTIVE' ? C.green50 : C.gray30}`, alignSelf: 'center' }} />
            <Step n={3} label="Generate" done={batch.status === 'ACTIVE'} active={phase >= 2 && batch.qcStatus === 'pass'} />
          </div>

          {/* Tests */}
          <details open>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', padding: '4px 0' }}>Tests ({bTests.length})</summary>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginTop: 4 }}>
              <thead><tr style={{ background: C.gray10 }}>{['Lab #', 'Patient', 'Test', 'Sample', 'Priority'].map(h => <th key={h} style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 600, color: C.gray70, borderBottom: `2px solid ${C.gray20}` }}>{h}</th>)}</tr></thead>
              <tbody>{bTests.map(tt => <tr key={tt.id} style={{ borderBottom: `1px solid ${C.gray20}` }}><td style={{ padding: '5px 8px' }}>{tt.labNumber}</td><td style={{ padding: '5px 8px' }}>{tt.patientName}</td><td style={{ padding: '5px 8px' }}>{tt.testName}</td><td style={{ padding: '5px 8px' }}>{tt.sampleType}</td><td style={{ padding: '5px 8px' }}><PriorityTag p={tt.priority} /></td></tr>)}</tbody>
            </table>
          </details>

          {/* Reagent Assignment */}
          <div style={{ marginTop: 10, padding: 10, background: C.gray10, border: `1px solid ${C.gray20}` }}>
            <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 8 }}>Step 2: Reagent & QC</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3, fontWeight: 600 }}>Reagent</label>
                <select value={locReag} onChange={e => { setLocReag(e.target.value); setLocLot(null); }} style={{ width: '100%', height: 28, padding: '0 6px', border: `1px solid ${C.gray30}`, fontSize: '0.75rem', fontFamily: 'inherit', background: C.white, boxSizing: 'border-box' }}>
                  <option value="">Select reagent...</option>
                  {REAGENTS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              {hasR && hasL && <div><label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3, fontWeight: 600 }}>Current Lot</label><div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', paddingTop: 4 }}>{batch.lotNumber}</div></div>}
            </div>
            {locReag && lots.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3, fontWeight: 600 }}>Select Lot</label>
                {lots.map(l => <LotCard key={l.id} lot={l} selected={(locLot || batch.lotId) === l.id} onSelect={setLocLot} />)}
              </div>
            )}
            {locReag && locLot && (locReag !== batch.reagentId || locLot !== batch.lotId) && (
              <Btn kind="primary" icon={Save} onClick={() => { const rg = REAGENTS.find(r => r.id === locReag); const lt = lots.find(l => l.id === locLot); onUpdate(batch.id, { reagentId: locReag, reagentName: rg?.name, lotId: locLot, lotNumber: lt?.lotNumber, qcStatus: 'not-run' }); }} style={{ marginTop: 8 }}>Save Reagent & Lot</Btn>
            )}
          </div>

          {/* QC Section */}
          {hasL && (
            <div style={{ marginTop: 8 }}>
              {/* Last QC Run — always visible when a lot is assigned */}
              <div style={{ padding: '8px 10px', background: qcBad ? C.red10 : batch.qcStatus === 'pass' ? C.green10 : C.gray10, border: `1px solid ${qcBad ? C.red60 : batch.qcStatus === 'pass' ? C.green50 : C.gray20}`, marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{t('heading.workplan.lastQcRun', 'Last QC Run')}</span>
                  <QcTag s={batch.qcStatus || 'not-run'} />
                </div>
                {batch.lastQcDate ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: '0.8rem' }}>
                    <div><div style={{ fontSize: '0.7rem', color: C.gray60 }}>{t('label.workplan.lastQcDate', 'Last QC')}</div><div style={{ fontWeight: 600 }}>{batch.lastQcDate}</div></div>
                    <div><div style={{ fontSize: '0.7rem', color: C.gray60 }}>{t('label.workplan.performedBy', 'By')}</div><div style={{ fontWeight: 600 }}>{batch.lastQcBy}</div></div>
                    <div><div style={{ fontSize: '0.7rem', color: C.gray60 }}>{t('label.workplan.qcResult', 'Result')}</div><Tag color={batch.lastQcResult === 'Pass' ? C.green50 : C.red60} bg={batch.lastQcResult === 'Pass' ? C.green10 : C.red10}>{batch.lastQcResult}</Tag></div>
                    {batch.lastQcValue && <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: '0.7rem', color: C.gray60 }}>{t('label.workplan.qcValue', 'Value')}</div><div>{batch.lastQcValue}</div></div>}
                  </div>
                ) : <div style={{ color: C.gray50, fontStyle: 'italic', fontSize: '0.8rem' }}>{t('message.workplan.noQcHistory', 'No QC runs recorded for this lot.')}</div>}
              </div>
              <details><summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', padding: '4px 0' }}>{t('heading.workplan.qcHistory', 'Full QC History')}</summary>
                <div style={{ padding: '6px 0 6px 12px', fontSize: '0.8rem', color: C.gray60, fontStyle: 'italic' }}>Previous QC runs would be listed here.</div>
              </details>
              {(qcBad || !batch.qcStatus || batch.qcStatus === 'not-run') && !showQc && <Btn kind="tertiary" icon={RefreshCw} onClick={() => setShowQc(true)} style={{ marginTop: 4 }}>Run QC</Btn>}
              {showQc && (
                <div style={{ background: C.yellow10, padding: 10, marginTop: 4, border: `1px solid ${C.yellow30}` }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 8 }}>Record QC Result</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8, alignItems: 'end' }}>
                    <div><label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3 }}>Date</label><input type="date" defaultValue="2026-03-16" style={{ width: '100%', height: 28, padding: '0 6px', border: `1px solid ${C.gray30}`, fontSize: '0.75rem', fontFamily: 'inherit', boxSizing: 'border-box' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3 }}>Result</label><div style={{ display: 'flex', gap: 10 }}><label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', cursor: 'pointer' }}><input type="radio" name={`qc-${batch.id}`} value="pass" checked={qcR === 'pass'} onChange={() => setQcR('pass')} style={{ accentColor: C.blue60 }} />Pass</label><label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', cursor: 'pointer' }}><input type="radio" name={`qc-${batch.id}`} value="fail" checked={qcR === 'fail'} onChange={() => setQcR('fail')} style={{ accentColor: C.blue60 }} />Fail</label></div></div>
                    <div><label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3 }}>Value (optional)</label><input type="text" placeholder="Enter value or notes..." value={qcV} onChange={e => setQcV(e.target.value)} style={{ width: '100%', height: 28, padding: '0 6px', border: `1px solid ${C.gray30}`, fontSize: '0.75rem', fontFamily: 'inherit', boxSizing: 'border-box' }} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <Btn kind="primary" icon={Save} onClick={() => { onUpdate(batch.id, { qcStatus: qcR === 'pass' ? 'pass' : 'failed', lastQcDate: '2026-03-16 ' + new Date().toTimeString().slice(0, 5), lastQcResult: qcR === 'pass' ? 'Pass' : 'Fail', lastQcValue: qcV, lastQcBy: 'Rabe, Tiana' }); setShowQc(false); setQcR(''); setQcV(''); }}>Save QC</Btn>
                    <Btn kind="ghost" onClick={() => setShowQc(false)}>Cancel</Btn>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.gray20}` }}>
            {(!hasR || !hasL) && <span style={{ fontSize: '0.7rem', color: C.gray50 }}>Assign a reagent and lot to generate</span>}
            <Btn kind="primary" icon={Printer} disabled={!hasR || !hasL} onClick={() => onUpdate(batch.id, { status: 'ACTIVE' })} style={{ marginLeft: 'auto' }}>Generate Workplan</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PENDING TESTS PAGE ────────────────────────────────────────────────────
const PendingTestsPage = ({ batches, onCreateBatch, onNavigate }) => {
  const [sel, setSel] = useState([]);
  const [search, setSearch] = useState('');
  const [fT, setFT] = useState([]);
  const [fP, setFP] = useState([]);
  const [fU, setFU] = useState([]);
  const [fPr, setFPr] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const filtered = useMemo(() => TESTS.filter(t => {
    if (fT.length && !fT.includes(t.testName)) return false;
    if (fP.length && !fP.includes(t.panel)) return false;
    if (fU.length && !fU.includes(t.labUnit)) return false;
    if (fPr.length && !fPr.includes(t.priority)) return false;
    if (search) { const s = search.toLowerCase(); return [t.labNumber, t.patientName, t.testName].some(v => v.toLowerCase().includes(s)); }
    return true;
  }), [fT, fP, fU, fPr, search]);

  const selectable = filtered.filter(t => !batches.some(b => b.tests.includes(t.id)));
  const allSel = sel.length === selectable.length && selectable.length > 0;

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.3rem', fontWeight: 400 }}>Pending Tests</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <FilterSel label="Test" options={[...new Set(TESTS.map(t => t.testName))]} selected={fT} onChange={setFT} />
        <FilterSel label="Panel" options={[...new Set(TESTS.map(t => t.panel))]} selected={fP} onChange={setFP} />
        <FilterSel label="Lab Unit" options={[...new Set(TESTS.map(t => t.labUnit))]} selected={fU} onChange={setFU} />
        <FilterSel label="Priority" options={['Routine', 'Urgent', 'STAT']} selected={fPr} onChange={setFPr} />
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3, fontWeight: 600 }}>Date Range</label>
          <input type="date" style={{ width: '100%', height: 28, padding: '0 6px', border: `1px solid ${C.gray30}`, fontSize: '0.75rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Create Batch Panel */}
      {showCreate && (
        <div style={{ padding: 12, marginBottom: 10, border: `2px solid ${C.blue60}`, background: C.white }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: '0.9rem' }}>Create Batch</strong>
            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3, fontWeight: 600 }}>Batch Name</label>
            <input type="text" placeholder="e.g., Chemistry AM Run" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', maxWidth: 350, height: 28, padding: '0 6px', border: `1px solid ${C.gray30}`, fontSize: '0.75rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: C.gray70, marginBottom: 6 }}><strong>{sel.length}</strong> tests selected:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {TESTS.filter(t => sel.includes(t.id)).map(t => <Tag key={t.id} color={C.gray70} bg={C.gray10}>{t.labNumber} — {t.testName}</Tag>)}
          </div>
          <div style={{ fontSize: '0.7rem', color: C.gray50, marginBottom: 8 }}>You'll assign the reagent and lot on the Batches page after creating.</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn kind="primary" icon={Plus} onClick={() => { onCreateBatch({ batchName: newName || `Batch — ${new Date().toLocaleDateString()}`, tests: sel }); setShowCreate(false); setSel([]); setNewName(''); onNavigate('batches'); }}>Create Batch</Btn>
            <Btn kind="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ border: `1px solid ${C.gray20}` }}>
        {sel.length > 0 && !showCreate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: C.blue60, color: C.white, fontSize: '0.8rem' }}>
            <strong>{sel.length} selected</strong>
            <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: `1px solid ${C.white}`, color: C.white, padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}><Plus size={12} /> Create Batch</button>
            <button onClick={() => setSel([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.white, cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', borderBottom: `1px solid ${C.gray20}`, background: C.gray10 }}>
          <Search size={14} color={C.gray60} />
          <input type="text" placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', padding: '3px 6px', fontSize: '0.75rem', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead><tr style={{ background: C.gray10 }}>
              <th style={{ width: 32, padding: '6px 8px', borderBottom: `2px solid ${C.gray20}` }}><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? [] : selectable.map(t => t.id))} style={{ accentColor: C.blue60 }} /></th>
              {['Lab Number', 'Patient', 'Test', 'Panel', 'Lab Unit', 'Priority', 'Date', 'Sample'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: C.gray70, borderBottom: `2px solid ${C.gray20}` }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(test => {
                const inB = batches.find(b => b.tests.includes(test.id));
                const s = sel.includes(test.id);
                return (
                  <tr key={test.id} style={{ borderBottom: `1px solid ${C.gray20}`, background: s ? C.blue10 : C.white }}>
                    <td style={{ padding: '6px 8px' }}><input type="checkbox" checked={s} disabled={!!inB} onChange={() => setSel(p => p.includes(test.id) ? p.filter(i => i !== test.id) : [...p, test.id])} style={{ accentColor: C.blue60 }} /></td>
                    <td style={{ padding: '6px 8px' }}>
                      {test.labNumber}
                      {inB && <Tag color={C.blue60} bg={C.blue10} onClick={() => onNavigate('batches')} style={{ marginLeft: 4, cursor: 'pointer', textDecoration: 'underline' }}>{inB.batchName}</Tag>}
                    </td>
                    <td style={{ padding: '6px 8px' }}>{test.patientName}</td>
                    <td style={{ padding: '6px 8px' }}>{test.testName}</td>
                    <td style={{ padding: '6px 8px' }}>{test.panel}</td>
                    <td style={{ padding: '6px 8px' }}>{test.labUnit}</td>
                    <td style={{ padding: '6px 8px' }}><PriorityTag p={test.priority} /></td>
                    <td style={{ padding: '6px 8px' }}>{test.orderDate}</td>
                    <td style={{ padding: '6px 8px' }}>{test.sampleType}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── BATCHES PAGE ──────────────────────────────────────────────────────────
const BatchesPage = ({ batches, setBatches, autoExpandId }) => {
  // Auto-expand QC-overdue batches by default, plus any batch navigated to from Pending Tests
  const overdueIds = useMemo(() => batches.filter(b => b.qcStatus === 'overdue' || b.qcStatus === 'failed').map(b => b.id), [batches]);
  const initialExpanded = useMemo(() => {
    const set = new Set(overdueIds);
    if (autoExpandId) set.add(autoExpandId);
    return set;
  }, []); // only on mount
  const [expandedSet, setExpandedSet] = useState(initialExpanded);
  const toggleExpand = (id) => setExpandedSet(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const update = (id, ch) => setBatches(p => p.map(b => b.id === id ? { ...b, ...ch } : b));
  const archive = (id) => setBatches(p => p.filter(b => b.id !== id));

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.3rem', fontWeight: 400 }}>Batches</h2>
      {batches.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: C.gray50, background: C.gray10, fontSize: '0.85rem' }}>No batches. Go to Pending Tests to create one.</div>
      ) : (
        batches.map(b => <BatchTile key={b.id} batch={b} expanded={expandedSet.has(b.id)} onExpand={toggleExpand} onArchive={archive} onUpdate={update} />)
      )}
    </div>
  );
};

// ─── APP ───────────────────────────────────────────────────────────────────
const App = () => {
  const [page, setPage] = useState('pending-tests');
  const [batches, setBatches] = useState(INIT_BATCHES);

  const createBatch = ({ batchName, tests }) => {
    setBatches(p => [...p, { id: `b${Date.now()}`, batchName, tests, reagentId: null, reagentName: null, lotId: null, lotNumber: null, status: 'DRAFT', createdDate: new Date().toLocaleString(), qcStatus: null, lastQcDate: null, lastQcBy: null, lastQcResult: null, lastQcValue: null, nceId: null }]);
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", color: C.gray100, fontSize: '0.85rem', background: C.gray10, minHeight: '100vh' }}>
      <AppHeader />
      <Sidebar activePage={page} onNavigate={setPage} />
      <main style={{ marginLeft: 220, marginTop: 48, padding: '20px 24px', minHeight: 'calc(100vh - 48px)' }}>
        <nav style={{ fontSize: '0.75rem', color: C.blue60, marginBottom: 8 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setPage('home')}>Home</span>
          <span style={{ color: C.gray50 }}> / </span>
          <span>Workplan</span>
          <span style={{ color: C.gray50 }}> / </span>
          <span style={{ color: C.gray100 }}>{page === 'pending-tests' ? 'Pending Tests' : 'Batches'}</span>
        </nav>
        {page === 'pending-tests' && <PendingTestsPage batches={batches} onCreateBatch={createBatch} onNavigate={setPage} />}
        {page === 'batches' && <BatchesPage batches={batches} setBatches={setBatches} autoExpandId={null} />}
        {page !== 'pending-tests' && page !== 'batches' && (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.gray50 }}>
            <h2 style={{ fontWeight: 400, marginBottom: 8 }}>{page === 'home' ? 'OpenELIS Global Dashboard' : page}</h2>
            <p>Navigate to <strong>Workplan → Pending Tests</strong> or <strong>Workplan → Batches</strong> to use the new batch workplan feature.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
