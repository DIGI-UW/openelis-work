import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Save, X, AlertTriangle, MoreVertical, Search, Check, Menu, User, Bell, Settings, Home, FileText, FlaskConical, ClipboardList, BarChart3, ShieldCheck, Microscope, TestTubes, Beaker, RefreshCw, Activity, Wifi, WifiOff, Clock, ExternalLink } from 'lucide-react';

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
const ANALYZERS = [
  {
    id: 'a1', name: 'Sysmex XN-L', type: 'Hematology', status: 'online',
    qcRequired: true, qcFrequencyType: 'DAILY',
    lastQc: { date: '2026-03-16 06:15', by: 'Rabe, Tiana', result: 'Pass', value: 'L1: 12.5 g/dL, L2: 8.2 g/dL' },
    qcStatus: 'pass', nextQcDue: '2026-03-17 00:00',
  },
  {
    id: 'a2', name: 'Mindray BS-240', type: 'Chemistry', status: 'online',
    qcRequired: true, qcFrequencyType: 'DAILY',
    lastQc: { date: '2026-03-15 06:30', by: 'Rabe, Tiana', result: 'Pass', value: 'Control Normal: 95 mg/dL' },
    qcStatus: 'overdue', nextQcDue: '2026-03-16 00:00',
  },
  {
    id: 'a3', name: 'GeneXpert IV', type: 'Molecular', status: 'offline',
    qcRequired: true, qcFrequencyType: 'CUSTOM_HOURS',
    lastQc: null,
    qcStatus: 'not-run', nextQcDue: null,
  },
  {
    id: 'a4', name: 'Beckman AU480', type: 'Chemistry', status: 'online',
    qcRequired: false, qcFrequencyType: 'DAILY',
    lastQc: { date: '2026-03-14 07:00', by: 'Andria, Marc', result: 'Pass', value: '' },
    qcStatus: 'pass', nextQcDue: null,
  },
];

const IMPORT_RESULTS = [
  { id: 'r1', sampleId: 'LAB-2026-0460', patientName: 'Ranaivo, Jean', testName: 'WBC', result: '7.2', units: '10^3/µL', flag: '', status: 'pending' },
  { id: 'r2', sampleId: 'LAB-2026-0461', patientName: 'Razafindrakoto, Marie', testName: 'RBC', result: '4.8', units: '10^6/µL', flag: '', status: 'pending' },
  { id: 'r3', sampleId: 'LAB-2026-0462', patientName: 'Andrianarisoa, Paul', testName: 'Hemoglobin', result: '14.1', units: 'g/dL', flag: '', status: 'pending' },
  { id: 'r4', sampleId: 'LAB-2026-0463', patientName: 'Rakoto, Fara', testName: 'Platelet', result: '142', units: '10^3/µL', flag: 'L', status: 'pending' },
  { id: 'r5', sampleId: 'LAB-2026-0464', patientName: 'Rasoamanana, Hery', testName: 'WBC', result: '18.5', units: '10^3/µL', flag: 'H', status: 'pending' },
];

// ─── Primitives ────────────────────────────────────────────────────────────
const Tag = ({ color, bg, children, onClick, style = {} }) => (
  <span onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '24px', fontSize: '0.7rem', fontWeight: 500, color, backgroundColor: bg, whiteSpace: 'nowrap', cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</span>
);

const QcTag = ({ s }) => {
  const m = { pass: [C.green50, C.green10, t('label.analyzerQc.qcPass', 'QC Pass')], overdue: [C.red60, C.red10, t('label.analyzerQc.qcOverdue', 'QC Overdue')], failed: [C.red60, C.red10, t('label.analyzerQc.qcFailed', 'QC Failed')], 'not-run': [C.gray60, C.gray10, t('label.analyzerQc.qcNotRun', 'Not Run')] };
  const [c, b, l] = m[s] || m['not-run'];
  return <Tag color={c} bg={b}>{l}</Tag>;
};

const StatusTag = ({ s }) => {
  const m = { online: [C.green50, C.green10, 'Online'], offline: [C.gray60, C.gray10, 'Offline'] };
  const [c, b, l] = m[s] || m.offline;
  return <Tag color={c} bg={b}>{s === 'online' ? <><Wifi size={10} style={{ marginRight: 3 }} />{l}</> : <><WifiOff size={10} style={{ marginRight: 3 }} />{l}</>}</Tag>;
};

const Btn = ({ children, kind = 'primary', icon: I, disabled, onClick, style = {} }) => {
  const k = { primary: { bg: disabled ? C.gray30 : C.blue60, c: C.white }, secondary: { bg: C.gray80, c: C.white }, tertiary: { bg: 'transparent', c: C.blue60, border: `1px solid ${C.blue60}` }, ghost: { bg: 'transparent', c: C.blue60 }, danger: { bg: C.red60, c: C.white }, 'danger-ghost': { bg: 'transparent', c: C.red60 } };
  const s = k[kind] || k.primary;
  return <button onClick={disabled ? undefined : onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: s.border || 'none', borderRadius: 0, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500, fontSize: '0.8rem', padding: '4px 14px', height: 32, background: s.bg, color: s.c, opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', ...style }}>{I && <I size={14} />}{children}</button>;
};

const Notif = ({ kind = 'warning', title, subtitle }) => {
  const c = kind === 'warning' ? { bg: '#fdf6dd', b: '#f1c21b', ic: '#f1c21b' } : kind === 'error' ? { bg: '#fff1f1', b: '#da1e28', ic: '#da1e28' } : { bg: '#defbe6', b: '#24a148', ic: '#24a148' };
  return <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: c.bg, borderLeft: `3px solid ${c.b}`, fontSize: '0.8rem' }}><AlertTriangle size={14} color={c.ic} style={{ flexShrink: 0, marginTop: 2 }} /><div><strong>{title}</strong>{subtitle && <div style={{ color: C.gray70, marginTop: 2 }}>{subtitle}</div>}</div></div>;
};

// ─── QC Recording Form (shared between import page and analyzer list) ─────
const QcRecordForm = ({ analyzerId, analyzerName, onSave, onCancel }) => {
  const [qcR, setQcR] = useState('');
  const [qcV, setQcV] = useState('');

  return (
    <div style={{ background: C.yellow10, padding: 12, border: `1px solid ${C.yellow30}`, marginTop: 8 }}>
      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10 }}>{t('heading.analyzerQc.recordQc', 'Record QC Result')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3, fontWeight: 600 }}>{t('label.analyzerQc.qcDate', 'QC Date/Time')}</label>
          <input type="datetime-local" defaultValue="2026-03-16T08:00" style={{ width: '100%', height: 32, padding: '0 8px', border: `1px solid ${C.gray30}`, fontSize: '0.75rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3, fontWeight: 600 }}>{t('label.analyzerQc.qcResult', 'Result')}</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="radio" name={`qc-${analyzerId}`} value="pass" checked={qcR === 'pass'} onChange={() => setQcR('pass')} style={{ accentColor: C.blue60 }} />
              {t('label.analyzerQc.pass', 'Pass')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="radio" name={`qc-${analyzerId}`} value="fail" checked={qcR === 'fail'} onChange={() => setQcR('fail')} style={{ accentColor: C.blue60 }} />
              {t('label.analyzerQc.fail', 'Fail')}
            </label>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: C.gray60, marginBottom: 3, fontWeight: 600 }}>{t('label.analyzerQc.qcValue', 'Value (optional)')}</label>
          <input type="text" placeholder={t('placeholder.analyzerQc.qcValue', 'Enter control value or notes...')} value={qcV} onChange={e => setQcV(e.target.value)} style={{ width: '100%', height: 32, padding: '0 8px', border: `1px solid ${C.gray30}`, fontSize: '0.75rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Btn kind="primary" icon={Save} onClick={() => { if (qcR) onSave({ result: qcR, value: qcV, date: '2026-03-16 08:00', by: 'Rabe, Tiana' }); }}>{t('button.analyzerQc.saveQc', 'Save QC Result')}</Btn>
        <Btn kind="ghost" onClick={onCancel}>{t('button.analyzerQc.cancel', 'Cancel')}</Btn>
      </div>
    </div>
  );
};

// ─── QC Status Panel (for analyzer import page) ──────────────────────────
const ManualQcPanel = ({ analyzer, onUpdateQc }) => {
  const [showForm, setShowForm] = useState(false);
  const qcBad = analyzer.qcStatus === 'overdue' || analyzer.qcStatus === 'failed';
  const qcNotRun = analyzer.qcStatus === 'not-run';

  const handleSave = (data) => {
    onUpdateQc(analyzer.id, {
      qcStatus: data.result === 'pass' ? 'pass' : 'failed',
      lastQc: { date: data.date, by: data.by, result: data.result === 'pass' ? 'Pass' : 'Fail', value: data.value },
    });
    setShowForm(false);
  };

  const borderColor = qcBad ? C.red60 : analyzer.qcStatus === 'pass' ? C.green50 : C.gray30;
  const bgColor = qcBad ? C.red10 : analyzer.qcStatus === 'pass' ? C.green10 : C.gray10;

  return (
    <div style={{ border: `2px solid ${borderColor}`, background: bgColor, padding: 12, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color={borderColor} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t('heading.analyzerQc.manualQcStatus', 'Manual QC Status')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <QcTag s={analyzer.qcStatus} />
          {!showForm && (qcBad || qcNotRun) && (
            <Btn kind="tertiary" icon={RefreshCw} onClick={() => setShowForm(true)}>{t('button.analyzerQc.recordQc', 'Record QC')}</Btn>
          )}
          {!showForm && analyzer.qcStatus === 'pass' && (
            <Btn kind="ghost" icon={RefreshCw} onClick={() => setShowForm(true)}>{t('button.analyzerQc.recordQc', 'Record QC')}</Btn>
          )}
        </div>
      </div>

      {/* Overdue/Failed Warning */}
      {qcBad && (
        <div style={{ marginBottom: 8 }}>
          <Notif kind={analyzer.qcStatus === 'failed' ? 'error' : 'warning'} title={analyzer.qcStatus === 'failed' ? t('message.analyzerQc.qcFailedWarning', `QC failed for ${analyzer.name}.`) : t('message.analyzerQc.qcOverdueWarning', 'Manual QC overdue')} subtitle={`Last QC: ${analyzer.lastQc?.date || 'Never'}. ${analyzer.qcStatus === 'failed' ? 'Review and re-run QC before accepting patient results.' : 'Record QC before proceeding with patient results.'}`} />
        </div>
      )}

      {/* Last QC Run Summary — always visible */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: C.gray70, marginBottom: 4 }}>{t('heading.analyzerQc.lastQcRun', 'Last QC Run')}</div>
        {analyzer.lastQc ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: '0.8rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: C.gray60 }}>{t('label.analyzerQc.lastQcDate', 'Date/Time')}</div>
              <div style={{ fontWeight: 600 }}>{analyzer.lastQc.date}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: C.gray60 }}>{t('label.analyzerQc.performedBy', 'Performed By')}</div>
              <div style={{ fontWeight: 600 }}>{analyzer.lastQc.by}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: C.gray60 }}>{t('label.analyzerQc.qcResult', 'Result')}</div>
              <Tag color={analyzer.lastQc.result === 'Pass' ? C.green50 : C.red60} bg={analyzer.lastQc.result === 'Pass' ? C.green10 : C.red10}>{analyzer.lastQc.result}</Tag>
            </div>
            {analyzer.lastQc.value && (
              <div>
                <div style={{ fontSize: '0.7rem', color: C.gray60 }}>{t('label.analyzerQc.qcValue', 'Value')}</div>
                <div>{analyzer.lastQc.value}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: C.gray50, fontStyle: 'italic', fontSize: '0.8rem' }}>{t('message.analyzerQc.noQcHistory', 'No manual QC runs recorded for this analyzer.')}</div>
        )}
      </div>

      {analyzer.nextQcDue && (
        <div style={{ fontSize: '0.75rem', color: C.gray60, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} /> {t('label.analyzerQc.nextQcDue', 'Next QC Due')}: <strong>{analyzer.nextQcDue}</strong>
        </div>
      )}

      {/* Inline QC Recording Form */}
      {showForm && <QcRecordForm analyzerId={analyzer.id} analyzerName={analyzer.name} onSave={handleSave} onCancel={() => setShowForm(false)} />}
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

// ─── Sidebar ──────────────────────────────────────────────────────────────
const Sidebar = ({ activePage, onNavigate }) => {
  const [analyzerOpen, setAnalyzerOpen] = useState(true);

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
        {menuItem('Workplan', null, <Beaker size={15} />)}

        {/* Analyzer menu group */}
        <div onClick={() => setAnalyzerOpen(!analyzerOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', cursor: 'pointer', fontSize: '0.8rem', color: C.gray80, fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={15} /> Analyzers
          </span>
          {analyzerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {analyzerOpen && (
          <>
            {menuItem('Analyzer List', 'analyzer-list', null, true)}
            {ANALYZERS.map(a => menuItem(a.name, `import-${a.id}`, null, true))}
          </>
        )}

        {menuItem('Reports', null, <BarChart3 size={15} />)}
        {menuItem('Admin', null, <Settings size={15} />)}
      </div>
    </nav>
  );
};

// ─── ANALYZER IMPORT PAGE ────────────────────────────────────────────────
const AnalyzerImportPage = ({ analyzer, onUpdateQc }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 400 }}>{analyzer.name}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <StatusTag s={analyzer.status} />
          <span style={{ fontSize: '0.75rem', color: C.gray60 }}>{analyzer.type} Analyzer</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn kind="ghost" icon={RefreshCw}>Refresh</Btn>
        <Btn kind="ghost" icon={Settings}>Settings</Btn>
      </div>
    </div>

    {/* ── Manual QC Status Panel ── */}
    <ManualQcPanel analyzer={analyzer} onUpdateQc={onUpdateQc} />

    {/* ── Automated QC Results (placeholder for existing feature) ── */}
    <div style={{ border: `1px solid ${C.gray20}`, padding: 12, marginBottom: 16, background: C.white }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>
        <ShieldCheck size={16} color={C.teal50} />
        QC Results from This Run
        <Tag color={C.green50} bg={C.green10}>3/3 Controls Passed</Tag>
      </div>
      <div style={{ fontSize: '0.75rem', color: C.gray60, fontStyle: 'italic' }}>
        (Automated QC extraction section — shows control samples from the analyzer data stream. See analyzer-import-requirements.md)
      </div>
    </div>

    {/* ── Patient Results Table ── */}
    <div style={{ border: `1px solid ${C.gray20}`, background: C.white }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${C.gray20}`, background: C.gray10 }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Patient Results ({IMPORT_RESULTS.length})</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn kind="primary" icon={Save}>{t('button.analyzer.saveAll', 'Save All Results')}</Btn>
          <Btn kind="secondary" icon={Save}>{t('button.analyzer.saveNormal', 'Save Normal Results')}</Btn>
          <Btn kind="danger">{t('button.analyzer.rejectAll', 'Reject All')}</Btn>
          <Btn kind="ghost">{t('button.analyzer.ignore', 'Ignore')}</Btn>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
        <thead>
          <tr style={{ background: C.gray10 }}>
            <th style={{ width: 32, padding: '6px 8px', borderBottom: `2px solid ${C.gray20}` }}><input type="checkbox" style={{ accentColor: C.blue60 }} /></th>
            {['Sample ID', 'Patient', 'Test', 'Result', 'Units', 'Flag', 'Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: C.gray70, borderBottom: `2px solid ${C.gray20}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {IMPORT_RESULTS.map(r => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${C.gray20}` }}>
              <td style={{ padding: '6px 8px' }}><input type="checkbox" style={{ accentColor: C.blue60 }} /></td>
              <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{r.sampleId}</td>
              <td style={{ padding: '6px 8px' }}>{r.patientName}</td>
              <td style={{ padding: '6px 8px' }}>{r.testName}</td>
              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.result}</td>
              <td style={{ padding: '6px 8px' }}>{r.units}</td>
              <td style={{ padding: '6px 8px' }}>
                {r.flag === 'H' && <Tag color={C.red60} bg={C.red10}>H</Tag>}
                {r.flag === 'L' && <Tag color={C.blue60} bg={C.blue10}>L</Tag>}
              </td>
              <td style={{ padding: '6px 8px' }}><Tag color={C.purple60} bg={C.purple10}>Pending</Tag></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── ANALYZERS LIST PAGE ──────────────────────────────────────────────────
const AnalyzerListPage = ({ analyzers, onNavigate, onUpdateQc }) => {
  const [expandedQc, setExpandedQc] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const handleSave = (analyzerId, data) => {
    onUpdateQc(analyzerId, {
      qcStatus: data.result === 'pass' ? 'pass' : 'failed',
      lastQc: { date: data.date, by: data.by, result: data.result === 'pass' ? 'Pass' : 'Fail', value: data.value },
    });
    setExpandedQc(null);
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.3rem', fontWeight: 400 }}>Analyzers</h2>
      <div style={{ border: `1px solid ${C.gray20}`, background: C.white }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: C.gray10 }}>
              {['Analyzer', 'Type', 'Status', 'Manual QC', 'Last QC', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: C.gray70, borderBottom: `2px solid ${C.gray20}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analyzers.map(a => {
              const qcBad = a.qcRequired && (a.qcStatus === 'overdue' || a.qcStatus === 'failed');
              return (
                <>
                  <tr key={a.id} style={{ borderBottom: expandedQc === a.id ? 'none' : `1px solid ${C.gray20}`, background: qcBad ? C.red10 : C.white }}>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontWeight: 600, cursor: 'pointer', color: C.blue60, textDecoration: 'underline' }} onClick={() => onNavigate(`import-${a.id}`)}>
                        {a.name}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>{a.type}</td>
                    <td style={{ padding: '8px 12px' }}><StatusTag s={a.status} /></td>
                    <td style={{ padding: '8px 12px' }}><QcTag s={a.qcRequired ? a.qcStatus : 'not-required'} /></td>
                    <td style={{ padding: '8px 12px', fontSize: '0.75rem', color: C.gray60 }}>{a.lastQc?.date || 'Never'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ position: 'relative' }}>
                        <button onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><MoreVertical size={16} color={C.gray60} /></button>
                        {menuOpen === a.id && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, background: C.white, border: `1px solid ${C.gray20}`, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', minWidth: 180 }}>
                            <div style={{ padding: '8px 14px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => { onNavigate(`import-${a.id}`); setMenuOpen(null); }}>
                              <ExternalLink size={13} /> {t('nav.analyzer.openImport', 'Open Import Page')}
                            </div>
                            <div style={{ padding: '8px 14px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderTop: `1px solid ${C.gray20}` }} onClick={() => { setExpandedQc(expandedQc === a.id ? null : a.id); setMenuOpen(null); }}>
                              <RefreshCw size={13} /> {t('nav.analyzer.recordManualQc', 'Record Manual QC')}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedQc === a.id && (
                    <tr key={`${a.id}-qc`}>
                      <td colSpan={6} style={{ padding: '0 12px 12px', background: C.gray10, borderBottom: `1px solid ${C.gray20}` }}>
                        <div style={{ padding: 12, background: C.white, border: `1px solid ${C.gray20}` }}>
                          {/* Last QC Run */}
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('heading.analyzerQc.lastQcRun', 'Last QC Run')}</span>
                              <QcTag s={a.qcStatus} />
                            </div>
                            {a.lastQc ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: '0.8rem' }}>
                                <div><div style={{ fontSize: '0.7rem', color: C.gray60 }}>Date/Time</div><div style={{ fontWeight: 600 }}>{a.lastQc.date}</div></div>
                                <div><div style={{ fontSize: '0.7rem', color: C.gray60 }}>Performed By</div><div style={{ fontWeight: 600 }}>{a.lastQc.by}</div></div>
                                <div><div style={{ fontSize: '0.7rem', color: C.gray60 }}>Result</div><Tag color={a.lastQc.result === 'Pass' ? C.green50 : C.red60} bg={a.lastQc.result === 'Pass' ? C.green10 : C.red10}>{a.lastQc.result}</Tag></div>
                                {a.lastQc.value && <div><div style={{ fontSize: '0.7rem', color: C.gray60 }}>Value</div><div style={{ fontSize: '0.75rem' }}>{a.lastQc.value}</div></div>}
                              </div>
                            ) : (
                              <div style={{ color: C.gray50, fontStyle: 'italic', fontSize: '0.8rem' }}>{t('message.analyzerQc.noQcHistory', 'No manual QC runs recorded.')}</div>
                            )}
                          </div>
                          {/* View Full History Link */}
                          <div style={{ marginBottom: 8, textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', color: C.blue60, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <ExternalLink size={12} /> {t('button.analyzerQc.viewHistory', 'View Full History')}
                            </span>
                          </div>
                          {/* QC Recording Form */}
                          <QcRecordForm analyzerId={a.id} analyzerName={a.name} onSave={(data) => handleSave(a.id, data)} onCancel={() => setExpandedQc(null)} />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── APP ───────────────────────────────────────────────────────────────────
const App = () => {
  const [page, setPage] = useState('import-a2'); // Start on the overdue analyzer import page
  const [analyzers, setAnalyzers] = useState(ANALYZERS);

  const updateQc = (analyzerId, changes) => {
    setAnalyzers(prev => prev.map(a => a.id === analyzerId ? { ...a, ...changes } : a));
  };

  const currentAnalyzer = analyzers.find(a => page === `import-${a.id}`);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", color: C.gray100, fontSize: '0.85rem', background: C.gray10, minHeight: '100vh' }}>
      <AppHeader />
      <Sidebar activePage={page} onNavigate={setPage} />
      <main style={{ marginLeft: 220, marginTop: 48, padding: '20px 24px', minHeight: 'calc(100vh - 48px)' }}>
        <nav style={{ fontSize: '0.75rem', color: C.blue60, marginBottom: 8 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setPage('home')}>Home</span>
          <span style={{ color: C.gray50 }}> / </span>
          <span style={{ cursor: 'pointer' }} onClick={() => setPage('analyzer-list')}>Analyzers</span>
          {currentAnalyzer && (
            <>
              <span style={{ color: C.gray50 }}> / </span>
              <span style={{ color: C.gray100 }}>{currentAnalyzer.name}</span>
            </>
          )}
          {page === 'analyzer-list' && <><span style={{ color: C.gray50 }}> / </span><span style={{ color: C.gray100 }}>All Analyzers</span></>}
        </nav>

        {page === 'analyzer-list' && <AnalyzerListPage analyzers={analyzers} onNavigate={setPage} onUpdateQc={updateQc} />}
        {currentAnalyzer && <AnalyzerImportPage analyzer={currentAnalyzer} onUpdateQc={updateQc} />}
        {!currentAnalyzer && page !== 'analyzer-list' && (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.gray50 }}>
            <h2 style={{ fontWeight: 400, marginBottom: 8 }}>OpenELIS Global</h2>
            <p>Navigate to <strong>Analyzers</strong> to view analyzer import pages and record manual QC.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
