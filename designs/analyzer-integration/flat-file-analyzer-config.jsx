import React, { useState, useEffect, useRef } from "react";

// ═══════════════ ICONS ═══════════════
const I = {
  chevronR: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevronD: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  x: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
  search: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>,
  plus: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>,
  dots: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  check: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  xCircle: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>,
  alert: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
  folder: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>,
  file: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>,
  upload: (s=40) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>,
  arrowR: (s=14) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  loader: (s=14) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></path></svg>,
  home: (s=15) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  clipboard: (s=15) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>,
  user: (s=15) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bar: (s=15) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>,
  checkSq: (s=15) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  settings: (s=15) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  bell: (s=18) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  activity: (s=15) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  storage: (s=15) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  info: (s=16) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>,
};

// ═══════════════ DATA ═══════════════
const BASE_PATH = '/opt/openelis/analyzer-imports';
const TEST_UNITS = [
  { id: 1, name: 'Hematology' }, { id: 2, name: 'Chemistry' }, { id: 3, name: 'Microbiology' },
  { id: 4, name: 'Immunoassay' }, { id: 5, name: 'Molecular Biology' }, { id: 6, name: 'Electrophoresis' }, { id: 7, name: 'Coagulation' },
];
const ANALYZERS = [
  { id: 1, name: 'SysmexXNLAnalyzer', testUnit: '-', connection: '-', status: 'Setup', lastModified: '-', protocol: 'ASTM' },
  { id: 2, name: 'SysmexAnalyzer', testUnit: '-', connection: '-', status: 'Setup', lastModified: '-', protocol: 'ASTM' },
  { id: 3, name: 'Sysmex XN Series', testUnit: 'Hematology', connection: '-', status: 'Setup', lastModified: '-', protocol: 'ASTM' },
  { id: 4, name: 'Mock Hematology Analyzer', testUnit: 'Hematology', connection: '-', status: 'Setup', lastModified: '-', protocol: 'ASTM', pluginMissing: true },
  { id: 5, name: 'Chemistry Analyzer 1', testUnit: 'Chemistry', connection: '-', status: 'Setup', lastModified: '-', protocol: 'ASTM', pluginMissing: true },
  { id: 10, name: 'QuantStudio 7 Flex', testUnit: 'Molecular Biology', connection: 'File Import', status: 'Active', lastModified: '2025-02-19', protocol: 'FILE_IMPORT', pluginName: 'QuantStudio CSV Parser', subdirectory: 'quantstudio-7-flex' },
  { id: 11, name: 'Sebia HYDRASYS', testUnit: 'Electrophoresis', connection: 'File Import', status: 'Setup', lastModified: '-', protocol: 'FILE_IMPORT', pluginName: 'HYDRASYS CSV Parser', subdirectory: 'sebia-hydrasys' },
  { id: 20, name: 'Mindray BC-5380', testUnit: 'Hematology', connection: '192.168.1.50:9100', status: 'Active', lastModified: '2025-02-20', protocol: 'HL7' },
  { id: 21, name: 'Mindray BS-480', testUnit: 'Chemistry', connection: '192.168.1.51:9101', status: 'Active', lastModified: '2025-02-20', protocol: 'HL7' },
];
const PLUGINS = [
  { id: 'quantstudio-csv', name: 'QuantStudio CSV Parser', ext: ['.csv'], ver: '1.0.0' },
  { id: 'generic-csv', name: 'Generic CSV Parser', ext: ['.csv', '.tsv', '.txt'], ver: '1.0.0' },
  { id: 'genexpert-csv', name: 'GeneXpert CSV Parser', ext: ['.csv'], ver: '1.0.0' },
  { id: 'hydrasys-csv', name: 'HYDRASYS CSV Parser', ext: ['.csv'], ver: '1.0.0' },
  { id: 'vitek2-csv', name: 'VITEK 2 CSV Parser', ext: ['.csv'], ver: '1.0.0' },
];
const UPLOAD_ANALYZERS = [
  { id: 'qs7', name: 'QuantStudio 7 Flex', protocol: 'CSV', fileType: true, ext: ['.csv'], serial: 'QS7-2841' },
  { id: 'gen', name: 'Generic CSV Analyzer', protocol: 'CSV', fileType: true, ext: ['.csv', '.tsv'], serial: '—' },
  { id: 'gx', name: 'Cepheid GeneXpert', protocol: 'CSV', fileType: true, ext: ['.csv'], serial: 'GX-4820' },
  { id: 'vt', name: 'bioMérieux VITEK 2', protocol: 'CSV', fileType: true, ext: ['.csv'], serial: 'VT2-1192' },
  { id: 'mbt', name: 'Bruker MALDI Biotyper', protocol: 'ASTM', fileType: false, ext: ['.csv', '.xml'], serial: 'MBT-8294' },
];
const UPLOAD_RESULTS = [
  { row: 1, status: 'valid', lab: 'LAB-2025-0100', patient: 'Ahmed, F.', type: 'Patient', target: 'SARS-CoV-2 N', ct: '22.5', well: 'A1', msgs: [] },
  { row: 2, status: 'valid', lab: 'LAB-2025-0100', patient: 'Ahmed, F.', type: 'Patient', target: 'ORF1ab', ct: '23.1', well: 'A1', msgs: [] },
  { row: 3, status: 'valid', lab: 'LAB-2025-0101', patient: 'Bello, M.', type: 'Patient', target: 'SARS-CoV-2 N', ct: 'Undet.', well: 'A2', msgs: [] },
  { row: 4, status: 'valid', lab: 'LAB-2025-0102', patient: 'Chowdhury, R.', type: 'Patient', target: 'SARS-CoV-2 N', ct: '31.8', well: 'A3', msgs: [] },
  { row: 5, status: 'warning', lab: 'LAB-2025-0199', patient: '—', type: 'Patient', target: 'SARS-CoV-2 N', ct: '18.3', well: 'B1', msgs: [{ code: 'LAB_NUMBER_NOT_FOUND', text: 'Lab number not found in system' }] },
  { row: 6, status: 'error', lab: '', patient: '', type: 'Patient', target: 'SARS-CoV-2 N', ct: '', well: 'C1', msgs: [{ code: 'MISSING_LAB_NUMBER', text: 'Lab number is missing' }, { code: 'MISSING_RESULT', text: 'Result value is missing' }] },
  { row: 7, status: 'qc', lab: 'NTC-001', patient: '—', type: 'QC', target: 'SARS-CoV-2 N', ct: 'Undet.', well: 'G1', msgs: [] },
  { row: 8, status: 'qc', lab: 'POS-CTRL-001', patient: '—', type: 'QC', target: 'SARS-CoV-2 N', ct: '22.8', well: 'H1', msgs: [] },
];

// ═══════════════ SHARED UI ═══════════════
const Badge = ({ color = 'gray', children }) => {
  const c = { gray: ['#f3f4f6','#6b7280','#e5e7eb'], red: ['#fef2f2','#dc2626','#fecaca'], green: ['#f0fdf4','#16a34a','#bbf7d0'], teal: ['#f0fdfa','#0d9488','#99f6e4'], purple: ['#faf5ff','#7c3aed','#ddd6fe'], amber: ['#fffbeb','#d97706','#fde68a'] }[color] || c.gray;
  return <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: c[0], color: c[1], border: `1px solid ${c[2]}` }}>{children}</span>;
};

// ═══════════════ SIDEBAR ═══════════════
const MENU = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'order', label: 'Order', icon: 'clipboard' },
  { id: 'patient', label: 'Patient', icon: 'user' },
  { id: 'storage', label: 'Storage', icon: 'storage' },
  { id: 'analyzers', label: 'Analyzers', icon: 'activity', children: [
    { id: 'analyzers-list', label: 'Analyzers List' },
    { id: 'analyzers-upload', label: 'Upload Analyzer File' },
    { id: 'error-dashboard', label: 'Error Dashboard' },
  ]},
  { id: 'results', label: 'Results', icon: 'bar' },
  { id: 'validation', label: 'Validation', icon: 'checkSq' },
  { id: 'reports', label: 'Reports', icon: 'file' },
  { id: 'admin', label: 'Admin', icon: 'settings' },
];
const iconMap = { home: I.home, clipboard: I.clipboard, user: I.user, storage: I.storage, activity: I.activity, bar: I.bar, checkSq: I.checkSq, file: I.file, settings: I.settings };

const Sidebar = ({ active, expanded, onToggle, onNav }) => (
  <div style={{ width: 220, background: '#1e293b', color: '#94a3b8', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
    {MENU.map(item => {
      const ico = iconMap[item.icon];
      const isExp = expanded === item.id;
      const has = !!item.children;
      const isAct = item.id === active || (item.children || []).some(c => c.id === active);
      return (
        <div key={item.id}>
          <button onClick={() => has ? onToggle(item.id) : null} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, border: 'none', cursor: 'pointer', textAlign: 'left', background: isAct ? '#334155' : 'transparent', color: isAct ? '#fff' : '#94a3b8' }}>
            {ico && ico()}
            <span style={{ flex: 1 }}>{item.label}</span>
            {has && <span style={{ transform: isExp ? 'rotate(90deg)' : 'none', transition: '.15s' }}>{I.chevronR(12)}</span>}
          </button>
          {has && isExp && (
            <div style={{ background: '#0f172a' }}>
              {item.children.map(c => (
                <button key={c.id} onClick={() => onNav(c.id)} style={{ width: '100%', textAlign: 'left', paddingLeft: 44, paddingRight: 16, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: c.id === active ? 'rgba(20,184,166,0.12)' : 'transparent', color: c.id === active ? '#2dd4bf' : '#94a3b8', borderLeft: c.id === active ? '2px solid #2dd4bf' : '2px solid transparent' }}>{c.label}</button>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

const Header = () => (
  <div style={{ background: '#1e293b', color: '#fff', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #334155' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 30, height: 30, background: '#0d9488', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>OE</div>
      <span style={{ fontWeight: 600, fontSize: 14 }}>OpenELIS Global</span>
      <Badge color="teal">v3.2.1.2</Badge>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ color: '#94a3b8' }}>{I.bell()}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>AD</div>
        Admin
      </div>
    </div>
  </div>
);

// ═══════════════ OVERFLOW MENU ═══════════════
const OverflowMenu = ({ analyzer, onAction }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const isFI = analyzer.protocol === 'FILE_IMPORT';
  const items = [
    { label: 'Field Mappings', action: 'fieldMappings' },
    ...(isFI ? [{ label: 'Test Configuration', action: 'testConfig' }, { label: 'Scan Now', action: 'scanNow' }] : [{ label: 'Test Connection', action: 'testConnection' }]),
    { label: 'Copy Mappings', action: 'copyMappings' },
    { label: 'Edit', action: 'edit' },
    ...(isFI ? [{ label: 'Pause Watcher', action: 'pauseWatcher' }] : []),
    { label: 'Delete', action: 'delete' },
  ];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{I.dots(18)}</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,.15)', zIndex: 50, minWidth: 170 }}>
          {items.map(it => (
            <button key={it.action} onClick={() => { onAction(it.action, analyzer); setOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', color: '#1f2937' }}>{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════ ADD ANALYZER MODAL ═══════════════
const AddAnalyzerModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [testUnitId, setTestUnitId] = useState('');
  const [plugin, setPlugin] = useState('');
  const [protocol, setProtocol] = useState('ASTM_LIS2_A2');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [subdir, setSubdir] = useState('');
  const [watcher, setWatcher] = useState(true);
  const [polling, setPolling] = useState(30);
  const [moveProcessed, setMoveProcessed] = useState(true);
  const isFI = protocol === 'FILE_IMPORT';
  const selectedPlugin = PLUGINS.find(p => p.id === plugin);

  useEffect(() => { setSubdir(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')); }, [name]);

  const field = (label, children, helper) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: '#374151' }}>{label}</label>
      {children}
      {helper && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{helper}</div>}
    </div>
  );
  const input = (val, set, ph) => <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />;
  const sel = (val, set, opts, ph) => (
    <select value={val} onChange={e => set(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, background: '#fff' }}>
      <option value="">{ph}</option>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  const toggle = (val, set) => (
    <button onClick={() => set(!val)} style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative', background: val ? '#0d9488' : '#d1d5db', transition: '.2s' }}>
      <span style={{ position: 'absolute', top: 2, left: val ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: '.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Add New Analyzer</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>{I.x(18)}</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {field('Analyzer Name', input(name, setName, 'e.g. QuantStudio 7 Flex'))}
          {field('Test Unit', sel(testUnitId, setTestUnitId, TEST_UNITS.map(u => ({ value: u.id, label: u.name })), 'Select test unit'), 'The laboratory section this analyzer belongs to')}
          {field('Plugin Type', sel(plugin, setPlugin, PLUGINS.map(p => ({ value: p.id, label: p.name })), 'Select plugin type...'))}
          {field('Protocol Version', sel(protocol, setProtocol, [
            { value: 'ASTM_LIS2_A2', label: 'ASTM LIS2-A2' },
            { value: 'HL7_MLLP', label: 'HL7 v2.3.1 MLLP' },
            { value: 'FILE_IMPORT', label: 'File Import (CSV/Flat File)' },
          ], 'Select protocol'))}

          {!isFI && (
            <>
              {field('IP Address', input(ip, setIp, '192.168.1.10'))}
              {field('Port Number', <input type="number" value={port} onChange={e => setPort(e.target.value)} placeholder="5000" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />)}
            </>
          )}

          {isFI && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>{I.folder(14)} File Import Configuration</div>
              {field('Subdirectory Name', input(subdir, setSubdir, 'auto-generated'), 'Folder name under the global import path')}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#374151' }}>Shared Folder Paths</label>
                <div style={{ fontFamily: 'monospace', fontSize: 12, background: '#1e293b', color: '#a5f3fc', padding: 12, borderRadius: 4 }}>
                  <div>{BASE_PATH}/{subdir || '...'}/incoming/</div>
                  <div style={{ color: '#6ee7b7' }}>{BASE_PATH}/{subdir || '...'}/processed/</div>
                  <div style={{ color: '#fca5a5' }}>{BASE_PATH}/{subdir || '...'}/errors/</div>
                </div>
              </div>
              {selectedPlugin && field('File Extensions', <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#0f766e' }}>{selectedPlugin.ext.join(', ')}</div>, 'Auto-populated from plugin')}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                {toggle(watcher, setWatcher)}
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>File Watcher</span>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Automatically scan for new files</div>
                </div>
              </div>
              {watcher && field('Polling Interval (seconds)', <input type="number" value={polling} onChange={e => setPolling(e.target.value)} min={5} style={{ width: 120, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }} />)}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {toggle(moveProcessed, setMoveProcessed)}
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Move Processed Files</span>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Move parsed files to processed/ directory</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button style={{ padding: '8px 20px', fontSize: 13, border: 'none', borderRadius: 4, background: '#2563eb', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Save Analyzer</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════ TEST CONFIG MODAL ═══════════════
const TestConfigModal = ({ analyzer, onClose }) => {
  const [testing, setTesting] = useState(true);
  const [done, setDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setTesting(false); setDone(true); }, 1500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 540, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Test Configuration</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{I.x(18)}</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: 13, marginBottom: 12, color: '#6b7280' }}>
            <div><strong>Name:</strong> {analyzer.name}</div>
            <div><strong>Test Unit:</strong> {analyzer.testUnit}</div>
            <div><strong>Path:</strong> <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{BASE_PATH}/{analyzer.subdirectory}/incoming/</span></div>
          </div>
          {testing && <div style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>{I.loader(20)} Validating configuration...</div>}
          {done && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Badge color="green">Configuration OK</Badge>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: 12, fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Validation Log</div>
                {['Folder access verified', 'Parser plugin loaded', 'Subdirectory structure OK', '3 files found (2 matching .csv)'].map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: '#166534' }}>
                    <span style={{ color: '#16a34a' }}>{I.check(12)}</span> {m}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════ UPLOAD ANALYZER FILE VIEW ═══════════════
const UploadView = () => {
  const [selAnalyzer, setSelAnalyzer] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [flow, setFlow] = useState('select');
  const [expanded, setExpanded] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [editedLabs, setEditedLabs] = useState({});
  const ddRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const visible = showAll ? UPLOAD_ANALYZERS : UPLOAD_ANALYZERS.filter(a => a.fileType);
  const s = { total: UPLOAD_RESULTS.length, valid: UPLOAD_RESULTS.filter(r => r.status === 'valid').length, qc: UPLOAD_RESULTS.filter(r => r.status === 'qc').length, warn: UPLOAD_RESULTS.filter(r => r.status === 'warning').length, err: UPLOAD_RESULTS.filter(r => r.status === 'error').length };
  const locked = flow === 'preview' || flow === 'submitting';
  const canEdit = (r) => r.msgs.some(m => m.code === 'MISSING_LAB_NUMBER' || m.code === 'LAB_NUMBER_NOT_FOUND');

  const doSubmit = () => { setConfirm(false); setFlow('submitting'); setTimeout(() => setFlow('success'), 1200); };
  const handleSubmit = () => { if (s.err > 0) setConfirm(true); else doSubmit(); };
  const reset = () => { setSelAnalyzer(null); setFile(null); setFlow('select'); setExpanded({}); setConfirm(false); setEditedLabs({}); };

  const statusColor = { valid: '#16a34a', qc: '#0d9488', warning: '#d97706', error: '#dc2626' };
  const statusBg = { valid: '#fff', qc: '#f0fdfa', warning: '#fffbeb', error: '#fef2f2' };
  const statusIcon = (st) => st === 'valid' || st === 'qc' ? <span style={{ color: statusColor[st] }}>{I.check(14)}</span> : st === 'warning' ? <span style={{ color: statusColor[st] }}>{I.alert(14)}</span> : <span style={{ color: statusColor[st] }}>{I.xCircle(14)}</span>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 960 }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#111827' }}>Analyzers <span style={{ color: '#9ca3af', fontWeight: 400 }}>›</span> Upload Analyzer File</h1>
      <p style={{ margin: '4px 0 24px', fontSize: 13, color: '#6b7280' }}>Select an analyzer, upload an export file, and review results before importing.</p>

      {flow === 'success' && (
        <div style={{ marginBottom: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#16a34a' }}>{I.check(20)}</span>
          <div><div style={{ fontSize: 14, fontWeight: 500, color: '#166534' }}>File uploaded successfully.</div><div style={{ fontSize: 12, color: '#16a34a' }}>{s.valid + s.qc} results submitted. Redirecting to Analyzer Results…</div></div>
        </div>
      )}

      {/* Step 1: Analyzer Selector */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16, opacity: locked ? .6 : 1, pointerEvents: locked ? 'none' : 'auto' }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Select Analyzer</label>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 10px' }}>Choose the instrument that generated this file</p>
            <div ref={ddRef} style={{ position: 'relative', maxWidth: 400 }}>
              <button onClick={() => setDdOpen(!ddOpen)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                {selAnalyzer ? <span>{selAnalyzer.name} <Badge color={selAnalyzer.fileType ? 'teal' : 'purple'}>{selAnalyzer.protocol}</Badge></span> : <span style={{ color: '#9ca3af' }}>— Select an analyzer —</span>}
                {I.chevronD(14)}
              </button>
              {ddOpen && (
                <div style={{ position: 'absolute', zIndex: 20, marginTop: 4, width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,.12)', maxHeight: 240, overflowY: 'auto' }}>
                  {visible.map(a => (
                    <button key={a.id} onClick={() => { setSelAnalyzer(a); setDdOpen(false); if (file) setFlow('fileSelected'); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, border: 'none', background: selAnalyzer?.id === a.id ? '#f0fdfa' : '#fff', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                      <span><span style={{ fontWeight: 500 }}>{a.name}</span> <span style={{ fontSize: 11, color: '#9ca3af' }}>{a.serial}</span></span>
                      <Badge color={a.fileType ? 'teal' : 'purple'}>{a.protocol}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <button onClick={() => setShowAll(!showAll)} style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative', background: showAll ? '#0d9488' : '#d1d5db' }}>
                <span style={{ position: 'absolute', top: 2, left: showAll ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: '.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </button>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Show all analyzers</span>
            </div>
          </div>
          {selAnalyzer && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '12px 16px', minWidth: 200, fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{selAnalyzer.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#6b7280' }}>Serial:</span><span style={{ fontFamily: 'monospace' }}>{selAnalyzer.serial}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#6b7280' }}>Protocol:</span><Badge color={selAnalyzer.fileType ? 'teal' : 'purple'}>{selAnalyzer.protocol}</Badge></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>Accepts:</span><span style={{ fontFamily: 'monospace' }}>{selAnalyzer.ext.join(', ')}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Upload Zone */}
      {flow !== 'success' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16, opacity: !selAnalyzer ? .5 : 1 }}>
          {!file ? (
            <button onClick={() => selAnalyzer && (setFile({ name: 'QuantStudio_Export_20250219.csv', size: '24.3 KB' }), setFlow('fileSelected'))} disabled={!selAnalyzer} style={{ width: '100%', border: '2px dashed #d1d5db', borderRadius: 8, padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'transparent', cursor: selAnalyzer ? 'pointer' : 'not-allowed' }}>
              <span style={{ color: selAnalyzer ? '#9ca3af' : '#d1d5db' }}>{I.upload(40)}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: selAnalyzer ? '#4b5563' : '#9ca3af' }}>Drag and drop file here or click to browse</span>
              {selAnalyzer ? <span style={{ fontSize: 12, color: '#9ca3af' }}>Accepted: <span style={{ fontFamily: 'monospace' }}>{selAnalyzer.ext.join(', ')}</span> — Max 50 MB</span> : <span style={{ fontSize: 12, color: '#9ca3af' }}>Select an analyzer first</span>}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#0d9488' }}>{I.file(20)}</span>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>{file.size}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {flow === 'fileSelected' && <button onClick={() => { setFlow('parsing'); setTimeout(() => setFlow('preview'), 1500); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Parse & Preview {I.arrowR()}</button>}
                {flow === 'parsing' && <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0d9488', color: '#fff', borderRadius: 4, fontSize: 13, opacity: .8 }}>{I.loader()} Parsing…</span>}
                {(flow === 'fileSelected' || flow === 'parsing') && <button onClick={() => { setFile(null); setFlow('select'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>{I.x(16)}</button>}
                {flow === 'preview' && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#16a34a', fontWeight: 500 }}>{I.check(14)} Parsed</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Validation Summary */}
      {locked && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>{I.info(15)} <span style={{ fontSize: 14, fontWeight: 600 }}>Validation Summary</span></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[['results parsed', s.total, '#f9fafb', '#e5e7eb', '#1f2937'], ['patient', s.valid + s.warn, '#f9fafb', '#e5e7eb', '#374151'], ['QC', s.qc, '#f0fdfa', '#99f6e4', '#0d9488'], ['warnings', s.warn, s.warn ? '#fffbeb' : '#f9fafb', s.warn ? '#fde68a' : '#e5e7eb', s.warn ? '#d97706' : '#9ca3af'], ['errors', s.err, s.err ? '#fef2f2' : '#f9fafb', s.err ? '#fecaca' : '#e5e7eb', s.err ? '#dc2626' : '#9ca3af']].map(([l, v, bg, bd, fg]) => (
              <div key={l} style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 6, padding: '10px 16px', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: fg }}>{v}</div>
                <div style={{ fontSize: 11, color: fg }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Preview Table */}
      {locked && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Preview Results <span style={{ fontWeight: 400, color: '#9ca3af' }}>({UPLOAD_RESULTS.length} rows)</span></span>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#6b7280' }}>
              {[['#16a34a','Valid'],['#0d9488','QC'],['#d97706','Warning'],['#dc2626','Error']].map(([c, l]) => <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} /> {l}</span>)}
            </div>
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ width: 32, padding: '8px 6px' }}></th>
              {['Row','Lab Number','Patient','Type','Target','CT','Well'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {UPLOAD_RESULTS.map(r => (
                <React.Fragment key={r.row}>
                  <tr style={{ borderBottom: '1px solid #f3f4f6', background: statusBg[r.status], cursor: r.msgs.length ? 'pointer' : 'default' }} onClick={() => r.msgs.length && setExpanded(p => ({ ...p, [r.row]: !p[r.row] }))}>
                    <td style={{ padding: '7px 6px', textAlign: 'center', color: '#9ca3af' }}>{r.msgs.length > 0 && (expanded[r.row] ? I.chevronD(12) : I.chevronR(12))}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{r.row}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {statusIcon(r.status)}
                        {canEdit(r) ? (
                          <input value={editedLabs[r.row] !== undefined ? editedLabs[r.row] : r.lab} onChange={e => { e.stopPropagation(); setEditedLabs(p => ({ ...p, [r.row]: e.target.value })); }} onClick={e => e.stopPropagation()} placeholder="Enter lab number" style={{ fontFamily: 'monospace', fontSize: 11, padding: '3px 6px', border: `1px solid ${(editedLabs[r.row] || r.lab) ? '#99f6e4' : '#fecaca'}`, borderRadius: 3, width: 140, background: (editedLabs[r.row] || r.lab) ? '#f0fdfa' : '#fef2f2' }} />
                        ) : (
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: r.lab ? '#0f766e' : '#dc2626', fontStyle: r.lab ? 'normal' : 'italic' }}>{r.lab || '(empty)'}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '7px 10px', color: r.patient === '—' ? '#9ca3af' : '#374151' }}>{r.patient}</td>
                    <td style={{ padding: '7px 10px' }}><Badge color={r.type === 'QC' ? 'teal' : 'gray'}>{r.type}</Badge></td>
                    <td style={{ padding: '7px 10px' }}>{r.target}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: r.ct === 'Undet.' ? '#9ca3af' : r.ct ? '#1f2937' : '#dc2626', fontStyle: !r.ct || r.ct === 'Undet.' ? 'italic' : 'normal' }}>{r.ct || '(empty)'}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{r.well}</td>
                  </tr>
                  {expanded[r.row] && r.msgs.length > 0 && (
                    <tr><td colSpan={8} style={{ padding: '10px 20px 10px 50px', background: r.status === 'error' ? '#fef2f2' : '#fffbeb' }}>
                      {r.msgs.map((m, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 12 }}><Badge color={r.status === 'error' ? 'red' : 'amber'}>{m.code}</Badge><span style={{ color: r.status === 'error' ? '#991b1b' : '#92400e' }}>{m.text}</span></div>)}
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm */}
      {confirm && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12 }}>
          <span style={{ color: '#d97706', marginTop: 2 }}>{I.alert(20)}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#92400e' }}>{s.err} error(s) will be skipped. {s.valid + s.qc + s.warn} valid records will be submitted.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setConfirm(false)} style={{ padding: '8px 16px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>Go back</button>
              <button onClick={doSubmit} style={{ padding: '8px 16px', fontSize: 13, border: 'none', borderRadius: 4, background: '#0d9488', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Submit valid records</button>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      {locked && !confirm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12 }}>
            {s.err > 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706' }}>{I.alert(14)} {s.err} record(s) have errors</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a' }}>{I.check(14)} All records valid</span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={reset} disabled={flow === 'submitting'} style={{ padding: '8px 16px', fontSize: 13, border: 'none', borderRadius: 4, background: '#f3f4f6', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={flow === 'submitting' || s.valid + s.qc === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 4, background: '#0d9488', color: '#fff', cursor: 'pointer', opacity: flow === 'submitting' ? .5 : 1 }}>
              {flow === 'submitting' ? <>{I.loader()} Submitting…</> : <>Submit to Import Queue {I.arrowR()}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════ MAIN APP ═══════════════
const SummaryCard = ({ label, value, color }) => (
  <div style={{ flex: 1, padding: '16px 20px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: color || '#111827' }}>{value}</div>
  </div>
);

export default function App() {
  const [page, setPage] = useState('analyzers-list');
  const [expMenu, setExpMenu] = useState('analyzers');
  const [showAdd, setShowAdd] = useState(false);
  const [testCfg, setTestCfg] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = ANALYZERS.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = ANALYZERS.filter(a => a.status === 'Active').length;
  const pluginWarn = ANALYZERS.filter(a => a.pluginMissing).length;

  const handleAction = (action, analyzer) => {
    if (action === 'testConfig') setTestCfg(analyzer);
    else if (action === 'testConnection') alert(`Test connection for ${analyzer.name}`);
    else if (action === 'scanNow') alert(`Scan triggered for ${analyzer.name}`);
    else if (action === 'pauseWatcher') alert(`Watcher paused for ${analyzer.name}`);
  };

  const protoBadge = (p) => p === 'FILE_IMPORT' ? <Badge color="teal">File Import</Badge> : p === 'HL7' ? <Badge color="purple">HL7</Badge> : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f9fafb' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar active={page} expanded={expMenu} onToggle={id => setExpMenu(expMenu === id ? null : id)} onNav={setPage} />
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ═══ ANALYZERS LIST ═══ */}
          {page === 'analyzers-list' && (
            <div style={{ padding: '24px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#111827' }}>Analyzers <span style={{ color: '#9ca3af', fontWeight: 400 }}>›</span> Analyzer List</h1>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Manage laboratory analyzers and field mappings</p>
                </div>
                <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Add Analyzer {I.plus(16)}</button>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <SummaryCard label="Total Analyzers" value={ANALYZERS.length} />
                <SummaryCard label="Active" value={activeCount} />
                <SummaryCard label="Inactive" value="0" />
                <SummaryCard label="Plugin Warnings" value={pluginWarn} color={pluginWarn > 0 ? '#dc2626' : undefined} />
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search analyzers..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4 }}>Test Unit</label>
                  <select style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: '#fff', minWidth: 160 }}>
                    <option>All Test Units</option>
                    {TEST_UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4 }}>Status</label>
                  <select style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: '#fff', minWidth: 140 }}>
                    <option>All Statuses</option><option>Active</option><option>Setup</option><option>Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    {['Name','Test Unit','Connection','Status','Last Modified','Actions'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {a.name}
                            {a.pluginMissing && <Badge color="red">Plugin Missing</Badge>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px', color: a.testUnit === '-' ? '#9ca3af' : '#374151' }}>{a.testUnit}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {protoBadge(a.protocol)}
                            <span style={{ color: a.connection === '-' ? '#9ca3af' : '#374151', fontSize: 12, fontFamily: (a.protocol === 'HL7' || a.protocol === 'ASTM') && a.connection !== '-' ? 'monospace' : 'inherit' }}>
                              {a.protocol === 'FILE_IMPORT' ? '' : a.connection}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: a.status === 'Active' ? '#f0fdf4' : '#f3f4f6', color: a.status === 'Active' ? '#16a34a' : '#6b7280', border: `1px solid ${a.status === 'Active' ? '#bbf7d0' : '#e5e7eb'}` }}>{a.status}</span>
                        </td>
                        <td style={{ padding: '10px 16px', color: a.lastModified === '-' ? '#9ca3af' : '#374151' }}>{a.lastModified}</td>
                        <td style={{ padding: '10px 16px' }}><OverflowMenu analyzer={a} onAction={handleAction} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ UPLOAD VIEW ═══ */}
          {page === 'analyzers-upload' && <UploadView />}

          {/* ═══ ERROR DASHBOARD PLACEHOLDER ═══ */}
          {page === 'error-dashboard' && (
            <div style={{ padding: '24px 32px' }}>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0 }}>Analyzers <span style={{ color: '#9ca3af', fontWeight: 400 }}>›</span> Error Dashboard</h1>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>View and manage analyzer import errors</p>
              <div style={{ marginTop: 40, textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>Coming Soon</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Error Dashboard is planned for a future release</div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showAdd && <AddAnalyzerModal onClose={() => setShowAdd(false)} />}
      {testCfg && <TestConfigModal analyzer={testCfg} onClose={() => setTestCfg(null)} />}
    </div>
  );
}
