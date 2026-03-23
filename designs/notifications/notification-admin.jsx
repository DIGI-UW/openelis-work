import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  blue60: '#0f62fe', blue70: '#0043ce', blue10: '#edf5ff', blue20: '#d0e2ff',
  green50: '#defbe6', green60: '#198038',
  red50: '#fff1f1', red60: '#da1e28',
  yellow10: '#fdf4c4', yellow70: '#8e6a00',
  gray10: '#f4f4f4', gray20: '#e0e0e0', gray30: '#c6c6c6',
  gray50: '#8d8d8d', gray70: '#525252', gray90: '#262626', gray100: '#161616',
  warmGray20: '#e5e0df', warmGray60: '#8f8b8b',
  white: '#ffffff',
  sidebarBg: '#262626', sidebarHover: '#353535', sidebarActive: '#0f62fe',
  sidebarText: '#f4f4f4', sidebarSub: '#c6c6c6',
  topBarBg: '#161616', border: '#e0e0e0',
};

const TAG_KINDS = {
  green:      { bg: C.green50,    color: C.green60,   border: '#a7f0ba' },
  red:        { bg: C.red50,      color: C.red60,     border: '#ffa4a9' },
  blue:       { bg: C.blue10,     color: C.blue70,    border: C.blue20 },
  'warm-gray':{ bg: C.warmGray20, color: '#5c4033',   border: C.warmGray60 },
  gray:       { bg: C.gray10,     color: C.gray70,    border: C.gray30 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVE COMPONENTS
// (In the real app these live in a shared component library)
// ─────────────────────────────────────────────────────────────────────────────

function Tag({ kind = 'gray', children }) {
  const s = TAG_KINDS[kind] || TAG_KINDS.gray;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {children}
    </span>
  );
}

function Notif({ kind = 'info', title, subtitle, onClose }) {
  const p = { info: { bg: C.blue10, border: C.blue60, color: C.blue70, icon: 'ℹ' }, success: { bg: C.green50, border: C.green60, color: C.green60, icon: '✓' }, warning: { bg: C.yellow10, border: C.yellow70, color: C.yellow70, icon: '⚠' }, error: { bg: C.red50, border: C.red60, color: C.red60, icon: '✕' } }[kind] || {};
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 2, borderLeft: `4px solid ${p.border}`, background: p.bg }}>
      <span style={{ color: p.color, fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{p.icon}</span>
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
  const s = { primary: { ...base, background: disabled ? C.gray30 : C.blue60, color: C.white }, secondary: { ...base, background: C.gray10, color: C.gray90, border: `1px solid ${C.gray30}` }, ghost: { ...base, background: 'transparent', color: C.blue60 }, tertiary: { ...base, background: 'transparent', color: C.blue60, border: `1px solid ${C.blue60}` } };
  return <button style={s[kind] || s.primary} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Field({ label, value, onChange, placeholder, type = 'text', helper, masked, width }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: width || '100%' }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70 }}>{label}</label>
      <input type={masked ? 'password' : type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding: '10px 12px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 14, background: C.white, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
      {helper && <span style={{ fontSize: 11, color: C.gray50 }}>{helper}</span>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, width }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: width || '100%' }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70 }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ padding: '10px 12px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 14, background: C.white, cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ on, onToggle, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={() => onToggle(!on)} style={{ width: 48, height: 24, borderRadius: 12, border: 'none', background: on ? C.blue60 : C.gray30, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <span style={{ display: 'block', width: 18, height: 18, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: on ? 27 : 3, transition: 'left 0.2s' }} />
      </button>
      <span style={{ fontSize: 14, color: C.gray100 }}>{label}</span>
      <Tag kind={on ? 'green' : 'gray'}>{on ? 'Enabled' : 'Disabled'}</Tag>
    </div>
  );
}

function PageCard({ title, description, children }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '28px 32px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: description ? 6 : 20 }}>{title}</h2>
      {description && <p style={{ fontSize: 13, color: C.gray70, marginBottom: 24 }}>{description}</p>}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER MODEL — rich per-test-type, per-channel config
// Replaces the coarse TriggerCondition enum.
// resultType: 'CODED' | 'NUMERIC'
// TriggerConfig: { enabled, selectedValues[], critical, nonNormal,
//                  numericMode, numericLow, numericHigh }
// ─────────────────────────────────────────────────────────────────────────────

const LAB_UNITS = [
  'TB / Mycobacteriology',
  'HIV / Virology',
  'Malaria / Parasitology',
  'Serology',
  'Haematology',
  'Chemistry',
  'Microbiology',
];

const FULL_TEST_CATALOG = [
  // TB / Mycobacteriology
  { id: '1',  labUnit: 'TB / Mycobacteriology', testType: 'GeneXpert MTB/RIF',         resultType: 'CODED',   resultValues: ['MTB DETECTED', 'MTB NOT DETECTED', 'RIF RESISTANT', 'RIF SUSCEPTIBLE', 'INDETERMINATE', 'ERROR'] },
  { id: '2',  labUnit: 'TB / Mycobacteriology', testType: 'GeneXpert MTB/RIF Ultra',   resultType: 'CODED',   resultValues: ['MTB DETECTED', 'TRACE DETECTED', 'MTB NOT DETECTED', 'RIF RESISTANT', 'RIF SUSCEPTIBLE', 'INDETERMINATE', 'ERROR'] },
  { id: '3',  labUnit: 'TB / Mycobacteriology', testType: 'Sputum AFB Smear',          resultType: 'CODED',   resultValues: ['POSITIVE 3+', 'POSITIVE 2+', 'POSITIVE 1+', 'POSITIVE SCANTY', 'NEGATIVE', 'UNSATISFACTORY'] },
  { id: '4',  labUnit: 'TB / Mycobacteriology', testType: 'MTB Culture (LJ)',           resultType: 'CODED',   resultValues: ['POSITIVE', 'NEGATIVE', 'CONTAMINATED', 'NO GROWTH 8 WEEKS'] },
  { id: '5',  labUnit: 'TB / Mycobacteriology', testType: 'TB Drug Susceptibility',    resultType: 'CODED',   resultValues: ['SENSITIVE', 'RESISTANT', 'INTERMEDIATE', 'INDETERMINATE'] },
  // HIV / Virology
  { id: '6',  labUnit: 'HIV / Virology',         testType: 'HIV-1/2 Rapid Test',        resultType: 'CODED',   resultValues: ['REACTIVE', 'NON-REACTIVE', 'INVALID'] },
  { id: '7',  labUnit: 'HIV / Virology',         testType: 'HIV-1/2 ELISA',             resultType: 'CODED',   resultValues: ['REACTIVE', 'NON-REACTIVE', 'EQUIVOCAL'] },
  { id: '8',  labUnit: 'HIV / Virology',         testType: 'HIV Western Blot',           resultType: 'CODED',   resultValues: ['POSITIVE', 'NEGATIVE', 'INDETERMINATE'] },
  { id: '9',  labUnit: 'HIV / Virology',         testType: 'Viral Load (HIV)',           resultType: 'NUMERIC', unit: 'copies/mL', refLow: null, refHigh: 1000 },
  { id: '10', labUnit: 'HIV / Virology',         testType: 'CD4 Count',                 resultType: 'NUMERIC', unit: 'cells/µL',  refLow: 500,  refHigh: null },
  { id: '11', labUnit: 'HIV / Virology',         testType: 'CD4 %',                     resultType: 'NUMERIC', unit: '%',         refLow: 25,   refHigh: null },
  // Malaria / Parasitology
  { id: '12', labUnit: 'Malaria / Parasitology', testType: 'Malaria RDT',               resultType: 'CODED',   resultValues: ['PF POSITIVE', 'PV POSITIVE', 'MIXED', 'NEGATIVE', 'INVALID'] },
  { id: '13', labUnit: 'Malaria / Parasitology', testType: 'Malaria Microscopy',        resultType: 'CODED',   resultValues: ['P. FALCIPARUM +', 'P. VIVAX +', 'MIXED +', 'NEGATIVE'] },
  // Serology
  { id: '14', labUnit: 'Serology',               testType: 'HBsAg (Hepatitis B)',       resultType: 'CODED',   resultValues: ['REACTIVE', 'NON-REACTIVE', 'EQUIVOCAL'] },
  { id: '15', labUnit: 'Serology',               testType: 'HCV Antibody',              resultType: 'CODED',   resultValues: ['REACTIVE', 'NON-REACTIVE', 'EQUIVOCAL'] },
  { id: '22', labUnit: 'Serology',               testType: 'Treponema pallidum (TPHA)', resultType: 'CODED',   resultValues: ['REACTIVE', 'NON-REACTIVE', 'EQUIVOCAL'] },
  { id: '23', labUnit: 'Serology',               testType: 'RPR (Syphilis)',            resultType: 'CODED',   resultValues: ['REACTIVE', 'NON-REACTIVE'] },
  // Haematology
  { id: '16', labUnit: 'Haematology',            testType: 'Haemoglobin',               resultType: 'NUMERIC', unit: 'g/dL',     refLow: 12.0, refHigh: 17.5 },
  { id: '17', labUnit: 'Haematology',            testType: 'WBC Count',                 resultType: 'NUMERIC', unit: '×10⁹/L',   refLow: 4.0,  refHigh: 11.0 },
  { id: '18', labUnit: 'Haematology',            testType: 'Platelet Count',            resultType: 'NUMERIC', unit: '×10⁹/L',   refLow: 150,  refHigh: 400 },
  // Chemistry
  { id: '19', labUnit: 'Chemistry',              testType: 'Blood Glucose (FBS)',       resultType: 'NUMERIC', unit: 'mmol/L',   refLow: 3.9,  refHigh: 5.6 },
  { id: '20', labUnit: 'Chemistry',              testType: 'Creatinine',                resultType: 'NUMERIC', unit: 'µmol/L',   refLow: 62,   refHigh: 115 },
  { id: '21', labUnit: 'Chemistry',              testType: 'ALT (SGPT)',                resultType: 'NUMERIC', unit: 'U/L',      refLow: 7,    refHigh: 56 },
  // Microbiology
  { id: '24', labUnit: 'Microbiology',           testType: 'Urine Culture',             resultType: 'CODED',   resultValues: ['SIGNIFICANT GROWTH', 'MIXED GROWTH', 'NO GROWTH', 'CONTAMINATED'] },
  { id: '25', labUnit: 'Microbiology',           testType: 'Blood Culture',             resultType: 'CODED',   resultValues: ['POSITIVE', 'NEGATIVE', 'CONTAMINATED'] },
];

const TRIGGERS_PAGE_SIZE = 10;

// Each TriggerConfig = { enabled, rules: RecipientRule[] }
// RecipientRule = { id, recipientType, manualAddress, selectedValues[],
//                   critical, nonNormal, numericMode, numericLow, numericHigh,
//                   useCustomTemplate, customTemplate }
// One rule per intended recipient — each with independent trigger conditions
// and an optional custom message template override.

let _ruleCounter = 0;
const nextRuleId = () => `r${++_ruleCounter}`;

const makeDefaultRule = (recipientType = 'ORDERING_PROVIDER', overrides = {}) => ({
  id: nextRuleId(),
  recipientType,
  manualAddress: '',
  selectedValues: [],
  critical: false,
  nonNormal: false,
  numericMode: 'OUTSIDE_RANGE',
  numericLow: '',
  numericHigh: '',
  useCustomTemplate: false,
  customTemplate: '',
  ...overrides,
});

const makeDefaultConfig = () => ({
  enabled: false,
  rules: [makeDefaultRule('ORDERING_PROVIDER')],
});

const INITIAL_TRIGGER_STATE = (() => {
  const s = {};
  FULL_TEST_CATALOG.forEach(t => { s[t.id] = { sms: makeDefaultConfig(), email: makeDefaultConfig() }; });

  // GeneXpert MTB/RIF — provider + patient, different rules
  s['1'].sms = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { selectedValues: ['MTB DETECTED', 'RIF RESISTANT'], critical: true }),
    makeDefaultRule('PATIENT', { selectedValues: ['MTB DETECTED'], useCustomTemplate: true, customTemplate: 'Your TB test result is available. Result: {{result}}. Please see your doctor immediately. Ref: {{lab_number}}' }),
  ]};
  s['1'].email = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { selectedValues: ['MTB DETECTED', 'RIF RESISTANT'], critical: true }),
  ]};

  // GeneXpert MTB/RIF Ultra
  s['2'].sms = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { selectedValues: ['MTB DETECTED', 'TRACE DETECTED', 'RIF RESISTANT'], critical: true }),
  ]};
  s['2'].email = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { selectedValues: ['MTB DETECTED', 'TRACE DETECTED', 'RIF RESISTANT'], critical: true }),
  ]};

  // AFB Smear
  s['3'].sms = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { selectedValues: ['POSITIVE 3+', 'POSITIVE 2+', 'POSITIVE 1+', 'POSITIVE SCANTY'] }),
  ]};

  // HIV Rapid — provider + fixed district coordinator number
  s['6'].sms = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { selectedValues: ['REACTIVE'], critical: true }),
    makeDefaultRule('MANUAL', { manualAddress: '+675 7000 1234', selectedValues: ['REACTIVE'], useCustomTemplate: true, customTemplate: 'ALERT: Reactive HIV result at {{facility}}. Patient: {{patient_id}}. Ref: {{lab_number}}' }),
  ]};
  s['6'].email = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { selectedValues: ['REACTIVE'], critical: true }),
  ]};

  // Viral Load
  s['9'].sms = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { critical: true, nonNormal: true, numericMode: 'OUTSIDE_RANGE', numericHigh: '1000' }),
  ]};
  s['9'].email = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { critical: true, nonNormal: true, numericMode: 'OUTSIDE_RANGE', numericHigh: '1000' }),
  ]};

  // CD4 Count
  s['10'].sms = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { critical: true, numericMode: 'OUTSIDE_RANGE', numericLow: '200' }),
  ]};

  // Malaria RDT
  s['12'].sms = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { selectedValues: ['PF POSITIVE', 'PV POSITIVE', 'MIXED'] }),
  ]};
  s['12'].email = { enabled: true, rules: [
    makeDefaultRule('ORDERING_PROVIDER', { selectedValues: ['PF POSITIVE', 'PV POSITIVE', 'MIXED'] }),
  ]};

  return s;
})();

const RECIPIENT_LABELS = { ORDERING_PROVIDER: 'Provider', PATIENT: 'Patient', MANUAL: 'Fixed address' };
const RECIPIENT_ICONS  = { ORDERING_PROVIDER: '👤', PATIENT: '🧑', MANUAL: '📌' };

function triggerSummary(cfg) {
  if (!cfg.enabled) return { kind: 'gray', text: 'Disabled' };
  if (!cfg.rules || cfg.rules.length === 0) return { kind: 'warm-gray', text: 'Not Configured' };
  const names = [...new Set(cfg.rules.map(r => RECIPIENT_LABELS[r.recipientType] || r.recipientType))];
  const n = cfg.rules.length;
  return { kind: 'green', text: `${n} rule${n > 1 ? 's' : ''} — ${names.join(' + ')}` };
}

function TriggersPage({ channel, triggerState, setTriggerState }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [editCfg, setEditCfg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [labUnitFilter, setLabUnitFilter] = useState('ALL');
  const [page, setPage] = useState(0);

  const filtered = FULL_TEST_CATALOG.filter(t =>
    t.testType.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (labUnitFilter === 'ALL' || t.labUnit === labUnitFilter)
  );
  const totalPages = Math.ceil(filtered.length / TRIGGERS_PAGE_SIZE);
  const pageRows = filtered.slice(page * TRIGGERS_PAGE_SIZE, (page + 1) * TRIGGERS_PAGE_SIZE);

  const openEdit = (test) => {
    setExpandedRow(test.id);
    const cfg = triggerState[test.id][channel];
    setEditCfg({ enabled: cfg.enabled, rules: cfg.rules.map(r => ({ ...r, selectedValues: [...r.selectedValues] })) });
  };
  const closeEdit = () => { setExpandedRow(null); setEditCfg(null); };
  const saveEdit = (testId) => {
    setTriggerState(prev => ({ ...prev, [testId]: { ...prev[testId], [channel]: { ...editCfg } } }));
    closeEdit();
  };

  const updateRule = (ruleId, patch) =>
    setEditCfg(c => ({ ...c, rules: c.rules.map(r => r.id === ruleId ? { ...r, ...patch } : r) }));
  const toggleRuleValue = (ruleId, val) =>
    setEditCfg(c => ({ ...c, rules: c.rules.map(r => r.id === ruleId
      ? { ...r, selectedValues: r.selectedValues.includes(val) ? r.selectedValues.filter(v => v !== val) : [...r.selectedValues, val] }
      : r) }));
  const removeRule = (ruleId) =>
    setEditCfg(c => ({ ...c, rules: c.rules.filter(r => r.id !== ruleId) }));
  const addRule = () =>
    setEditCfg(c => ({ ...c, rules: [...c.rules, makeDefaultRule()] }));

  const configuredCount = FULL_TEST_CATALOG.filter(t => triggerState[t.id]?.[channel]?.enabled).length;

  const th = { padding: '10px 12px', fontSize: 12, fontWeight: 700, color: C.gray70, textAlign: 'left', borderBottom: `2px solid ${C.gray20}`, background: C.gray10 };
  const td = { padding: '10px 12px', fontSize: 13, borderBottom: `1px solid ${C.gray20}`, verticalAlign: 'middle' };

  return (
    <PageCard
      title="Test Type Triggers"
      description={`Per-test-type notification rules for the ${channel.toUpperCase()} channel. ${configuredCount} of ${FULL_TEST_CATALOG.length} tests have active triggers. Rules are independent from the ${channel === 'sms' ? 'Email' : 'SMS'} channel.`}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 4 }}>Search test types</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.gray50, pointerEvents: 'none' }}>🔍</span>
            <input
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
              placeholder={`Filter ${FULL_TEST_CATALOG.length} test types…`}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 13 }}
            />
          </div>
        </div>
        <div style={{ minWidth: 200 }}>
          <SelectField
            label="Lab unit"
            value={labUnitFilter}
            onChange={e => { setLabUnitFilter(e.target.value); setPage(0); }}
            options={[
              { value: 'ALL', label: 'All lab units' },
              ...LAB_UNITS.map(u => ({ value: u, label: u })),
            ]}
          />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <Btn kind="secondary" small onClick={() => {
            setTriggerState(prev => {
              const next = { ...prev };
              FULL_TEST_CATALOG.forEach(t => { next[t.id] = { ...next[t.id], [channel]: { ...next[t.id][channel], enabled: false } }; });
              return next;
            });
          }}>✕ Disable All</Btn>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Test Type</th>
              <th style={{ ...th, width: 88 }}>Type</th>
              <th style={{ ...th, minWidth: 220 }}>Trigger Rule</th>
              <th style={{ ...th, width: 76 }}></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(test => {
              const cfg = triggerState[test.id]?.[channel] || makeDefaultConfig();
              const { kind, text } = triggerSummary(cfg);
              const isExpanded = expandedRow === test.id;

              return (
                <React.Fragment key={test.id}>
                  <tr style={{ background: isExpanded ? C.blue10 : C.white }}>
                    <td style={td}>
                      <span style={{ fontWeight: 500, display: 'block' }}>{test.testType}</span>
                      <span style={{ fontSize: 11, color: C.gray50 }}>{test.labUnit}</span>
                    </td>
                    <td style={td}>
                      <Tag kind={test.resultType === 'CODED' ? 'blue' : 'warm-gray'}>
                        {test.resultType === 'CODED' ? 'Coded' : 'Numeric'}
                      </Tag>
                    </td>
                    <td style={td}>
                      <Tag kind={kind}>{text}</Tag>
                    </td>
                    <td style={td}>
                      <Btn kind="ghost" small onClick={() => isExpanded ? closeEdit() : openEdit(test)}>
                        {isExpanded ? '▲ Close' : '▼ Edit'}
                      </Btn>
                    </td>
                  </tr>

                  {isExpanded && editCfg && (
                    <tr>
                      <td colSpan={4} style={{ padding: 0, borderBottom: `1px solid ${C.gray20}` }}>
                        <div style={{ padding: '20px 24px', background: '#f0f4ff', borderTop: `2px solid ${C.blue60}` }}>

                          {/* Enable toggle */}
                          <div style={{ marginBottom: 20 }}>
                            <Toggle on={editCfg.enabled} onToggle={v => setEditCfg(c => ({ ...c, enabled: v }))} label={`Enable ${channel.toUpperCase()} notifications for "${test.testType}"`} />
                          </div>

                          {editCfg.enabled && (
                            <>
                              {/* Per-recipient rule cards */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                                {editCfg.rules.map((rule, idx) => (
                                  <div key={rule.id} style={{ background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 4, overflow: 'hidden' }}>

                                    {/* Card header — recipient type selector */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.gray10, borderBottom: `1px solid ${C.gray20}`, flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: C.gray70, minWidth: 60 }}>Recipient {idx + 1}</span>
                                      {[
                                        { v: 'ORDERING_PROVIDER', l: '👤 Provider' },
                                        { v: 'PATIENT',           l: '🧑 Patient' },
                                        { v: 'MANUAL',            l: '📌 Fixed address' },
                                      ].map(opt => (
                                        <button key={opt.v}
                                          onClick={() => updateRule(rule.id, { recipientType: opt.v, manualAddress: '' })}
                                          style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            border: `1px solid ${rule.recipientType === opt.v ? C.blue60 : C.gray30}`,
                                            background: rule.recipientType === opt.v ? C.blue10 : C.white,
                                            color: rule.recipientType === opt.v ? C.blue70 : C.gray70 }}>
                                          {opt.l}
                                        </button>
                                      ))}
                                      {editCfg.rules.length > 1 && (
                                        <button onClick={() => removeRule(rule.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.red60, fontWeight: 600 }}>✕ Remove</button>
                                      )}
                                    </div>

                                    {/* Card body */}
                                    <div style={{ padding: '14px 16px' }}>

                                      {/* Manual address */}
                                      {rule.recipientType === 'MANUAL' && (
                                        <div style={{ marginBottom: 14, maxWidth: 380 }}>
                                          <Field
                                            label={channel === 'sms' ? 'Phone number' : 'Email address'}
                                            value={rule.manualAddress}
                                            onChange={e => updateRule(rule.id, { manualAddress: e.target.value })}
                                            placeholder={channel === 'sms' ? '+675 7000 0000' : 'coordinator@moh.gov.pg'}
                                            helper="This fixed address receives a notification whenever this rule fires."
                                          />
                                        </div>
                                      )}

                                      {/* Trigger conditions */}
                                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
                                        <div style={{ flex: '1 1 240px' }}>
                                          <p style={{ fontSize: 11, fontWeight: 700, color: C.gray70, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                            {test.resultType === 'CODED' ? 'Fire when result is:' : `Numeric trigger (${test.unit})`}
                                          </p>

                                          {test.resultType === 'CODED' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                              {test.resultValues.map(val => (
                                                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                                                  <input type="checkbox" checked={rule.selectedValues.includes(val)} onChange={() => toggleRuleValue(rule.id, val)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: C.blue60, flexShrink: 0 }} />
                                                  <span style={{ fontFamily: 'monospace', fontSize: 12, background: C.gray10, padding: '2px 7px', borderRadius: 2, border: `1px solid ${C.gray20}` }}>{val}</span>
                                                </label>
                                              ))}
                                            </div>
                                          )}

                                          {test.resultType === 'NUMERIC' && (
                                            <div>
                                              <div style={{ maxWidth: 240, marginBottom: 10 }}>
                                                <SelectField label="Mode" value={rule.numericMode} onChange={e => updateRule(rule.id, { numericMode: e.target.value })} options={[
                                                  { value: 'OUTSIDE_RANGE', label: 'Fire when outside range' },
                                                  { value: 'INSIDE_RANGE',  label: 'Fire when inside range' },
                                                  { value: 'ALL',           label: 'Fire for all results' },
                                                ]} />
                                              </div>
                                              {rule.numericMode !== 'ALL' && (
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                  <div style={{ flex: 1 }}><Field label={`Low`} value={rule.numericLow} onChange={e => updateRule(rule.id, { numericLow: e.target.value })} placeholder={test.refLow?.toString() ?? ''} helper="Leave blank to omit" /></div>
                                                  <div style={{ flex: 1 }}><Field label={`High`} value={rule.numericHigh} onChange={e => updateRule(rule.id, { numericHigh: e.target.value })} placeholder={test.refHigh?.toString() ?? ''} helper="Leave blank to omit" /></div>
                                                </div>
                                              )}
                                              {(test.refLow != null || test.refHigh != null) && (
                                                <p style={{ fontSize: 11, color: C.gray50, marginTop: 6 }}>Ref range: {test.refLow ?? '—'}–{test.refHigh ?? '—'} {test.unit}</p>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Flags */}
                                        <div style={{ flex: '0 1 190px' }}>
                                          <p style={{ fontSize: 11, fontWeight: 700, color: C.gray70, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Also fire on:</p>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                                              <input type="checkbox" checked={rule.critical} onChange={e => updateRule(rule.id, { critical: e.target.checked })} style={{ width: 14, height: 14, accentColor: C.red60, flexShrink: 0 }} />
                                              <span style={{ fontSize: 13, flex: 1 }}>Critical flag</span><Tag kind="red">Critical</Tag>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                                              <input type="checkbox" checked={rule.nonNormal} onChange={e => updateRule(rule.id, { nonNormal: e.target.checked })} style={{ width: 14, height: 14, accentColor: C.yellow70, flexShrink: 0 }} />
                                              <span style={{ fontSize: 13, flex: 1 }}>Non-Normal</span><Tag kind="warm-gray">Non-Normal</Tag>
                                            </label>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Custom template toggle */}
                                      <div style={{ borderTop: `1px solid ${C.gray20}`, paddingTop: 12 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: rule.useCustomTemplate ? 10 : 0 }}>
                                          <input type="checkbox" checked={rule.useCustomTemplate} onChange={e => updateRule(rule.id, { useCustomTemplate: e.target.checked })} style={{ width: 14, height: 14, accentColor: C.blue60 }} />
                                          <span style={{ fontSize: 13, fontWeight: 600 }}>Custom {channel === 'sms' ? 'message' : 'email body'} for this recipient</span>
                                          {!rule.useCustomTemplate && <span style={{ fontSize: 11, color: C.gray50, fontWeight: 400 }}>— using global template</span>}
                                        </label>
                                        {rule.useCustomTemplate && (
                                          <div>
                                            <textarea value={rule.customTemplate} onChange={e => updateRule(rule.id, { customTemplate: e.target.value })} rows={channel === 'sms' ? 3 : 5}
                                              placeholder={channel === 'sms' ? 'e.g. Your result: {{result}}. Contact your doctor. Ref: {{lab_number}}' : 'Dear {{provider_name}},\n\nResult: {{result}} for {{patient_id}}.'}
                                              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }}
                                            />
                                            <span style={{ fontSize: 11, color: C.gray50 }}>Same merge fields as the global template. Overrides global template for this recipient only.</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Add rule */}
                              <Btn kind="tertiary" small onClick={addRule}>+ Add recipient rule</Btn>
                            </>
                          )}

                          {/* Save / Cancel */}
                          <div style={{ display: 'flex', gap: 8, marginTop: 20, borderTop: `1px solid ${C.blue20}`, paddingTop: 16 }}>
                            <Btn kind="primary" small onClick={() => saveEdit(test.id)}>Save</Btn>
                            <Btn kind="ghost" small onClick={closeEdit}>Cancel</Btn>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: C.gray50 }}>
            Showing {page * TRIGGERS_PAGE_SIZE + 1}–{Math.min((page + 1) * TRIGGERS_PAGE_SIZE, filtered.length)} of {filtered.length} test types
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Btn kind="secondary" small disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{
                padding: '6px 10px', borderRadius: 2, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${i === page ? C.blue60 : C.gray30}`,
                background: i === page ? C.blue60 : C.white,
                color: i === page ? C.white : C.gray90,
                fontWeight: i === page ? 700 : 400,
              }}>{i + 1}</button>
            ))}
            <Btn kind="secondary" small disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</Btn>
          </div>
        </div>
      )}
    </PageCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED RETRY POLICY PAGE — reused by both channels
// ─────────────────────────────────────────────────────────────────────────────

function RetryPolicyPage() {
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryInterval, setRetryInterval] = useState(15);
  const [logRetention, setLogRetention] = useState(90);
  const [saved, setSaved] = useState(false);

  const NumInput = ({ label, value, onChange, min, max, helper }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} style={{ padding: '8px 12px', border: `1px solid ${C.gray30}`, background: C.gray10, cursor: 'pointer', borderRadius: 2 }}>−</button>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max} style={{ width: 70, padding: '8px 10px', textAlign: 'center', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 14 }} />
        <button onClick={() => onChange(Math.min(max, value + 1))} style={{ padding: '8px 12px', border: `1px solid ${C.gray30}`, background: C.gray10, cursor: 'pointer', borderRadius: 2 }}>+</button>
      </div>
      {helper && <span style={{ fontSize: 11, color: C.gray50 }}>{helper}</span>}
    </div>
  );

  return (
    <PageCard title="Retry Policy" description="Automatic retry behaviour for failed deliveries. These settings apply to this notification channel.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', gap: 48 }}>
          <NumInput label="Maximum Retry Attempts" value={maxRetries} onChange={setMaxRetries} min={1} max={10} helper="Auto-retries before marking Failed Permanent (default: 3)" />
          <NumInput label="Retry Interval (minutes)" value={retryInterval} onChange={setRetryInterval} min={5} max={120} helper="Wait between retry attempts (default: 15)" />
        </div>
        <div style={{ borderTop: `1px solid ${C.gray20}`, paddingTop: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.gray90, marginBottom: 16 }}>Log Retention</p>
          <NumInput label="Retention (days)" value={logRetention} onChange={setLogRetention} min={30} max={365} helper="Delivered/skipped entries purged nightly. Failed entries kept 30 days extra." />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save</Btn>
        </div>
        {saved && <Notif kind="success" title="Retry policy saved." onClose={() => setSaved(false)} />}
      </div>
    </PageCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED DELIVERY LOG — reused by both channels
// Props: channel ('sms'|'email'), rows, onRetry
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_TAG   = { DELIVERED: 'green', FAILED_PERMANENT: 'red', PENDING: 'blue', RETRYING: 'warm-gray', SKIPPED_NO_PHONE: 'gray', SKIPPED_NO_EMAIL: 'gray' };
const STATUS_LABEL = { DELIVERED: 'Delivered', FAILED_PERMANENT: 'Failed', PENDING: 'Pending', RETRYING: 'Retrying', SKIPPED_NO_PHONE: 'Skipped (No Phone)', SKIPPED_NO_EMAIL: 'Skipped (No Email)' };

const SMS_LOG = [
  { id: 'S1', labNumber: 'PNG-2026-004521', testType: 'GeneXpert MTB/RIF',       provider: 'Dr. James Ovia',  contact: '+675 •••• ••47',       result: 'MTB DETECTED', status: 'DELIVERED',        attempts: 1, lastAttempt: '2026-03-23 08:14' },
  { id: 'S2', labNumber: 'PNG-2026-004488', testType: 'HIV-1/2 Rapid Test',      provider: 'Dr. Sarah Maino', contact: '+675 •••• ••91',       result: 'REACTIVE',      status: 'DELIVERED',        attempts: 1, lastAttempt: '2026-03-23 07:52' },
  { id: 'S3', labNumber: 'PNG-2026-004412', testType: 'GeneXpert MTB/RIF Ultra', provider: 'Dr. Peter Kila',  contact: '+675 •••• ••33',       result: 'MTB DETECTED', status: 'FAILED_PERMANENT', attempts: 3, lastAttempt: '2026-03-23 06:30' },
  { id: 'S4', labNumber: 'PNG-2026-004399', testType: 'HIV-1/2 Rapid Test',      provider: 'Nurse Agnes Toa', contact: '—',                    result: 'NON-REACTIVE',  status: 'SKIPPED_NO_PHONE', attempts: 0, lastAttempt: '—' },
];
const EMAIL_LOG = [
  { id: 'E1', labNumber: 'PNG-2026-004521', testType: 'GeneXpert MTB/RIF',       provider: 'Dr. James Ovia',  contact: 'ja••••@moh.gov.pg',    result: 'MTB DETECTED', status: 'DELIVERED',        attempts: 1, lastAttempt: '2026-03-23 08:14' },
  { id: 'E2', labNumber: 'PNG-2026-004488', testType: 'HIV-1/2 Rapid Test',      provider: 'Dr. Sarah Maino', contact: 'sa••••@pmgh.gov.pg',   result: 'REACTIVE',      status: 'DELIVERED',        attempts: 1, lastAttempt: '2026-03-23 07:52' },
  { id: 'E3', labNumber: 'PNG-2026-004380', testType: 'GeneXpert MTB/RIF',       provider: 'Dr. Maria Undo',  contact: 'ma••••@district.pg',   result: 'MTB DETECTED', status: 'RETRYING',         attempts: 2, lastAttempt: '2026-03-23 05:00' },
  { id: 'E4', labNumber: 'PNG-2026-004355', testType: 'Viral Load (HIV)',         provider: 'Dr. Ben Kopi',    contact: '—',                    result: 'CRITICAL',      status: 'SKIPPED_NO_EMAIL', attempts: 0, lastAttempt: '—' },
];

function DeliveryLogPage({ channel, rows }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [retried, setRetried] = useState([]);
  const contactLabel = channel === 'sms' ? 'Phone' : 'Email';
  const skipStatus = channel === 'sms' ? 'SKIPPED_NO_PHONE' : 'SKIPPED_NO_EMAIL';

  const filtered = statusFilter === 'ALL' ? rows : rows.filter(r => r.status === statusFilter);
  const failedCount = rows.filter(r => r.status === 'FAILED_PERMANENT').length;

  const th = { padding: '10px 12px', fontSize: 12, fontWeight: 700, color: C.gray70, textAlign: 'left', borderBottom: `2px solid ${C.gray20}`, background: C.gray10, whiteSpace: 'nowrap' };
  const td = { padding: '12px', fontSize: 12, borderBottom: `1px solid ${C.gray20}`, verticalAlign: 'middle' };

  return (
    <PageCard title="Delivery Log" description="All dispatch attempts. FAILED entries can be retried manually.">
      {failedCount > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Notif kind="error" title={`${failedCount} delivery failure${failedCount > 1 ? 's' : ''} require attention.`} subtitle="These entries have exhausted all automatic retry attempts." />
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <SelectField label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} width="220px" options={[
          { value: 'ALL',              label: 'All statuses' },
          { value: 'DELIVERED',        label: 'Delivered' },
          { value: 'FAILED_PERMANENT', label: 'Failed' },
          { value: 'RETRYING',         label: 'Retrying' },
          { value: 'PENDING',          label: 'Pending' },
          { value: skipStatus,         label: `Skipped (No ${channel === 'sms' ? 'Phone' : 'Email'})` },
        ]} />
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr>{['Lab Number', 'Test Type', 'Provider', contactLabel, 'Result', 'Status', 'Attempts', 'Last Attempt', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id} style={{ background: row.status === 'FAILED_PERMANENT' && !retried.includes(row.id) ? '#fff8f8' : C.white }}>
                <td style={td}><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.labNumber}</span></td>
                <td style={td}>{row.testType}</td>
                <td style={td}>{row.provider}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{row.contact}</td>
                <td style={{ ...td, fontWeight: 600, color: ['MTB DETECTED','REACTIVE','CRITICAL'].some(k => row.result.includes(k)) ? C.red60 : C.gray100 }}>{row.result}</td>
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
    </PageCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMS-SPECIFIC PAGES
// ─────────────────────────────────────────────────────────────────────────────

const SMS_MERGE_FIELDS = [
  { token: '{{patient_id}}', label: 'Patient ID' }, { token: '{{test_name}}', label: 'Test Name' },
  { token: '{{result}}', label: 'Result' }, { token: '{{facility}}', label: 'Facility' },
  { token: '{{validated_at}}', label: 'Validated At' }, { token: '{{lab_number}}', label: 'Lab Number' },
];
const EXAMPLE_VALS = { '{{patient_id}}': 'PNG-PAT-00192', '{{test_name}}': 'GeneXpert MTB/RIF', '{{result}}': 'MTB DETECTED. RIF: Susceptible.', '{{facility}}': 'Port Moresby General', '{{validated_at}}': '2026-03-23 08:14', '{{lab_number}}': 'PNG-2026-004521', '{{provider_name}}': 'Dr. James Ovia' };

function SmsConnectionPage() {
  const [enabled, setEnabled] = useState(true);
  const [baseUrl, setBaseUrl] = useState('https://textit.com/api/v2');
  const [channelUuid, setChannelUuid] = useState('a3f9e21c-bc44-4d78-a012-9f3c00000001');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <PageCard title="TextIt Connection" description="Configure the TextIt (hosted RapidPro) API credentials for SMS dispatch.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Toggle on={enabled} onToggle={setEnabled} label="Enable SMS Notifications" />
        {!enabled && <Notif kind="warning" title="SMS notifications are globally disabled." subtitle="No messages will be sent on result validation." />}
        <div style={{ maxWidth: 520 }}><Field label="TextIt API Base URL" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://textit.com/api/v2" /></div>
        <div style={{ maxWidth: 520 }}><Field label="API Token" masked value="" onChange={() => {}} placeholder="Enter new token to replace saved value" helper="Token stored encrypted. Enter new value to replace." /></div>
        <div style={{ maxWidth: 520 }}><Field label="Channel UUID" value={channelUuid} onChange={e => setChannelUuid(e.target.value)} /></div>
        {testResult === 'success' && <Notif kind="success" title="Connection to TextIt API successful." onClose={() => setTestResult(null)} />}
        {testResult === 'error' && <Notif kind="error" title="Could not connect. Check URL and token." onClose={() => setTestResult(null)} />}
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="secondary" disabled={testing} onClick={() => { setTesting(true); setTimeout(() => { setTesting(false); setTestResult('success'); }, 900); }}>⟳ {testing ? 'Testing…' : 'Test Connection'}</Btn>
          <Btn kind="primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save</Btn>
        </div>
        {saved && <Notif kind="success" title="SMS connection settings saved." onClose={() => setSaved(false)} />}
      </div>
    </PageCard>
  );
}

function SmsTemplatePage() {
  const DEFAULT = 'OpenELIS: {{test_name}} for {{patient_id}} — {{result}}. Facility: {{facility}}. Ref: {{lab_number}}';
  const [template, setTemplate] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);
  const len = template.length, segs = Math.ceil(len / 160) || 1, isOver = len > 480, isWarn = len > 160 && !isOver;
  const preview = Object.entries(EXAMPLE_VALS).reduce((m, [k, v]) => m.split(k).join(v), template);

  return (
    <PageCard title="Message Template" description="One template used for all outbound SMS notifications. Max 480 characters (3 segments).">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ maxWidth: 640 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>Template</label>
          <textarea value={template} onChange={e => setTemplate(e.target.value)} rows={4}
            style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', resize: 'vertical', border: `2px solid ${isOver ? C.red60 : isWarn ? C.yellow70 : C.gray30}`, borderRadius: 2, fontSize: 14, fontFamily: 'monospace', outline: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: isOver ? C.red60 : isWarn ? C.yellow70 : 'transparent' }}>{isOver ? '⚠ Exceeds 480-char limit' : isWarn ? `⚠ ${segs} SMS segments` : '.'}</span>
            <span style={{ fontSize: 11, color: isOver ? C.red60 : C.gray50 }}>{len} / 480 ({segs} seg{segs > 1 ? 's' : ''})</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.gray70, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Insert Merge Field</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SMS_MERGE_FIELDS.map(f => <Btn key={f.token} kind="tertiary" small onClick={() => setTemplate(t => t + f.token)}>+ {f.label}</Btn>)}
          </div>
        </div>
        <div style={{ background: C.gray10, border: `1px solid ${C.border}`, borderRadius: 4, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.gray50, marginBottom: 8 }}>Preview</p>
          <p style={{ fontSize: 13, fontFamily: 'monospace', color: C.gray100, whiteSpace: 'pre-wrap', margin: 0 }}>{preview || '(empty)'}</p>
          <p style={{ fontSize: 11, color: C.gray50, marginTop: 8, marginBottom: 0 }}>{preview.length} characters</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="primary" disabled={isOver} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save</Btn>
        </div>
        {saved && <Notif kind="success" title="SMS template saved." onClose={() => setSaved(false)} />}
      </div>
    </PageCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL-SPECIFIC PAGES
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_MERGE_FIELDS = [
  ...SMS_MERGE_FIELDS,
  { token: '{{provider_name}}', label: 'Provider Name' },
];

function EmailConnectionPage() {
  const [enabled, setEnabled] = useState(true);
  const [host, setHost] = useState('smtp.moh.gov.pg');
  const [port, setPort] = useState('587');
  const [username, setUsername] = useState('openelis@moh.gov.pg');
  const [fromAddr, setFromAddr] = useState('openelis-results@moh.gov.pg');
  const [fromName, setFromName] = useState('OpenELIS Results');
  const [tls, setTls] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <PageCard title="SMTP Connection" description="Configure the SMTP server for email dispatch.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Toggle on={enabled} onToggle={setEnabled} label="Enable Email Notifications" />
        {!enabled && <Notif kind="warning" title="Email notifications are globally disabled." />}

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 3 }}><Field label="SMTP Host" value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.example.com" /></div>
          <div style={{ flex: 1 }}><Field label="Port" value={port} onChange={e => setPort(e.target.value)} placeholder="587" /></div>
        </div>
        <div style={{ maxWidth: 520 }}><Field label="Username" value={username} onChange={e => setUsername(e.target.value)} /></div>
        <div style={{ maxWidth: 520 }}><Field label="Password" masked value="" onChange={() => {}} placeholder="Enter new password to replace saved value" helper="Stored encrypted. Enter new value to replace." /></div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 2 }}><Field label="From Address" value={fromAddr} onChange={e => setFromAddr(e.target.value)} /></div>
          <div style={{ flex: 2 }}><Field label="From Display Name" value={fromName} onChange={e => setFromName(e.target.value)} /></div>
        </div>
        <Toggle on={tls} onToggle={setTls} label="Use TLS / STARTTLS" />

        <div style={{ borderTop: `1px solid ${C.gray20}`, paddingTop: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.gray90, marginBottom: 12 }}>Send Test Email</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ width: 360 }}><Field label="Test Recipient" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com" /></div>
            <Btn kind="secondary" disabled={testing || !testEmail} onClick={() => { setTesting(true); setTimeout(() => { setTesting(false); setTestResult('success'); }, 900); }}>
              ✉ {testing ? 'Sending…' : 'Send Test Email'}
            </Btn>
          </div>
          {testResult === 'success' && <div style={{ marginTop: 12 }}><Notif kind="success" title="Test email sent successfully." onClose={() => setTestResult(null)} /></div>}
          {testResult === 'error'   && <div style={{ marginTop: 12 }}><Notif kind="error" title="Could not connect to SMTP server." onClose={() => setTestResult(null)} /></div>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save</Btn>
        </div>
        {saved && <Notif kind="success" title="SMTP connection settings saved." onClose={() => setSaved(false)} />}
      </div>
    </PageCard>
  );
}

function EmailTemplatePage() {
  const [subject, setSubject] = useState('OpenELIS Result: {{test_name}} for {{patient_id}}');
  const [body, setBody] = useState(
`Dear {{provider_name}},

A result has been validated for your patient {{patient_id}}.

Test:      {{test_name}}
Result:    {{result}}
Facility:  {{facility}}
Validated: {{validated_at}}
Reference: {{lab_number}}

Please log in to OpenELIS to review the full result.

This is an automated notification. Do not reply to this message.`
  );
  const [saved, setSaved] = useState(false);
  const subjectOver = subject.length > 255;
  const subjectPreview = Object.entries(EXAMPLE_VALS).reduce((m, [k, v]) => m.split(k).join(v), subject);
  const bodyPreview = Object.entries(EXAMPLE_VALS).reduce((m, [k, v]) => m.split(k).join(v), body);

  return (
    <PageCard title="Message Template" description="Configure the email subject and body. Both support merge fields.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ maxWidth: 640 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: `2px solid ${subjectOver ? C.red60 : C.gray30}`, borderRadius: 2, fontSize: 14, outline: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: subjectOver ? C.red60 : 'transparent' }}>⚠ Subject exceeds 255 characters</span>
            <span style={{ fontSize: 11, color: C.gray50 }}>{subject.length} / 255</span>
          </div>
        </div>
        <div style={{ maxWidth: 640 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
            style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', resize: 'vertical', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 13, fontFamily: 'monospace', outline: 'none' }} />
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.gray70, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Insert Merge Field</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EMAIL_MERGE_FIELDS.map(f => <Btn key={f.token} kind="tertiary" small onClick={() => setBody(b => b + f.token)}>+ {f.label}</Btn>)}
          </div>
        </div>

        {/* Preview panel */}
        <div style={{ background: C.gray10, border: `1px solid ${C.border}`, borderRadius: 4, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.gray50, marginBottom: 12 }}>Preview with example values</p>
          <div style={{ background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: C.gray10, borderBottom: `1px solid ${C.gray20}`, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: C.gray70 }}>Subject: </span>
              <span style={{ color: C.gray100 }}>{subjectPreview}</span>
            </div>
            <div style={{ padding: 14 }}>
              <pre style={{ fontSize: 13, fontFamily: 'monospace', color: C.gray100, whiteSpace: 'pre-wrap', margin: 0 }}>{bodyPreview}</pre>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="primary" disabled={subjectOver} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save</Btn>
        </div>
        {saved && <Notif kind="success" title="Email template saved." onClose={() => setSaved(false)} />}
      </div>
    </PageCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE CARDS — extracted from TriggersPage, reused by CombinedTriggersPage
// Props: channel, editCfg, setEditCfg, test
// ─────────────────────────────────────────────────────────────────────────────

function RuleCards({ channel, editCfg, setEditCfg, test }) {
  const updRule = (id, patch) =>
    setEditCfg(c => ({ ...c, rules: c.rules.map(r => r.id === id ? { ...r, ...patch } : r) }));
  const togVal = (id, val) =>
    setEditCfg(c => ({ ...c, rules: c.rules.map(r => r.id === id
      ? { ...r, selectedValues: r.selectedValues.includes(val) ? r.selectedValues.filter(v => v !== val) : [...r.selectedValues, val] }
      : r) }));
  const delRule = (id) => setEditCfg(c => ({ ...c, rules: c.rules.filter(r => r.id !== id) }));
  const addRuleLocal = () => setEditCfg(c => ({ ...c, rules: [...c.rules, makeDefaultRule()] }));

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {editCfg.rules.map((rule, idx) => (
          <div key={rule.id} style={{ background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 3, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', background: C.gray10, borderBottom: `1px solid ${C.gray20}`, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.gray70, flexShrink: 0 }}>Recipient {idx + 1}</span>
              {[{ v: 'ORDERING_PROVIDER', l: '👤 Provider' }, { v: 'PATIENT', l: '🧑 Patient' }, { v: 'MANUAL', l: '📌 Fixed' }].map(opt => (
                <button key={opt.v} onClick={() => updRule(rule.id, { recipientType: opt.v, manualAddress: '' })} style={{
                  padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${rule.recipientType === opt.v ? C.blue60 : C.gray30}`,
                  background: rule.recipientType === opt.v ? C.blue10 : C.white,
                  color: rule.recipientType === opt.v ? C.blue70 : C.gray70,
                }}>{opt.l}</button>
              ))}
              {editCfg.rules.length > 1 && (
                <button onClick={() => delRule(rule.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.red60, fontWeight: 600 }}>✕ Remove</button>
              )}
            </div>
            {/* Body */}
            <div style={{ padding: '12px 14px' }}>
              {rule.recipientType === 'MANUAL' && (
                <div style={{ marginBottom: 12, maxWidth: 300 }}>
                  <Field label={channel === 'sms' ? 'Phone number' : 'Email address'} value={rule.manualAddress}
                    onChange={e => updRule(rule.id, { manualAddress: e.target.value })}
                    placeholder={channel === 'sms' ? '+675 7000 0000' : 'coordinator@moh.gov.pg'} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                {/* Trigger conditions */}
                <div style={{ flex: '1 1 180px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.gray70, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>
                    {test.resultType === 'CODED' ? 'Fire when result is:' : `Numeric (${test.unit})`}
                  </p>
                  {test.resultType === 'CODED' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {test.resultValues.map(val => (
                        <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="checkbox" checked={rule.selectedValues.includes(val)} onChange={() => togVal(rule.id, val)}
                            style={{ width: 13, height: 13, cursor: 'pointer', accentColor: C.blue60, flexShrink: 0 }} />
                          <span style={{ fontFamily: 'monospace', fontSize: 11, background: C.gray10, padding: '1px 6px', borderRadius: 2, border: `1px solid ${C.gray20}` }}>{val}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {test.resultType === 'NUMERIC' && (
                    <div>
                      <div style={{ maxWidth: 200, marginBottom: 8 }}>
                        <SelectField label="Mode" value={rule.numericMode} onChange={e => updRule(rule.id, { numericMode: e.target.value })} options={[
                          { value: 'OUTSIDE_RANGE', label: 'Outside range' },
                          { value: 'INSIDE_RANGE',  label: 'Inside range' },
                          { value: 'ALL',           label: 'All results' },
                        ]} />
                      </div>
                      {rule.numericMode !== 'ALL' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1 }}><Field label="Low" value={rule.numericLow} onChange={e => updRule(rule.id, { numericLow: e.target.value })} placeholder={test.refLow?.toString() ?? ''} helper="Omit = no bound" /></div>
                          <div style={{ flex: 1 }}><Field label="High" value={rule.numericHigh} onChange={e => updRule(rule.id, { numericHigh: e.target.value })} placeholder={test.refHigh?.toString() ?? ''} helper="Omit = no bound" /></div>
                        </div>
                      )}
                      {(test.refLow != null || test.refHigh != null) && (
                        <p style={{ fontSize: 10, color: C.gray50, marginTop: 5 }}>Ref: {test.refLow ?? '—'}–{test.refHigh ?? '—'} {test.unit}</p>
                      )}
                    </div>
                  )}
                </div>
                {/* Flags */}
                <div style={{ flex: '0 1 150px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.gray70, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Also fire on:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={rule.critical} onChange={e => updRule(rule.id, { critical: e.target.checked })} style={{ width: 13, height: 13, accentColor: C.red60, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, flex: 1 }}>Critical</span><Tag kind="red">!</Tag>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={rule.nonNormal} onChange={e => updRule(rule.id, { nonNormal: e.target.checked })} style={{ width: 13, height: 13, accentColor: C.yellow70, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, flex: 1 }}>Non-Normal</span><Tag kind="warm-gray">↕</Tag>
                    </label>
                  </div>
                </div>
              </div>
              {/* Per-recipient template override */}
              <div style={{ borderTop: `1px solid ${C.gray20}`, paddingTop: 9 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', marginBottom: rule.useCustomTemplate ? 7 : 0 }}>
                  <input type="checkbox" checked={rule.useCustomTemplate} onChange={e => updRule(rule.id, { useCustomTemplate: e.target.checked })} style={{ width: 13, height: 13, accentColor: C.blue60 }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Custom {channel === 'sms' ? 'message' : 'email body'} for this recipient</span>
                  {!rule.useCustomTemplate && <span style={{ fontSize: 11, color: C.gray50, fontWeight: 400 }}>— global template</span>}
                </label>
                {rule.useCustomTemplate && (
                  <div>
                    <textarea value={rule.customTemplate} onChange={e => updRule(rule.id, { customTemplate: e.target.value })} rows={channel === 'sms' ? 3 : 4}
                      placeholder={channel === 'sms' ? 'e.g. Your result: {{result}}. Ref: {{lab_number}}' : 'Dear {{provider_name}},\n\nResult: {{result}}.'}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '7px 9px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }} />
                    <span style={{ fontSize: 10, color: C.gray50 }}>Same merge fields as global template. Overrides global for this recipient only.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <Btn kind="tertiary" small onClick={addRuleLocal}>+ Add recipient</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED TRIGGERS PAGE — SMS + Email in one table
// ─────────────────────────────────────────────────────────────────────────────

function CombinedTriggersPage({ triggerState, setTriggerState }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [editSms, setEditSms] = useState(null);
  const [editEmail, setEditEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [labUnitFilter, setLabUnitFilter] = useState('ALL');
  const [page, setPage] = useState(0);

  const filtered = FULL_TEST_CATALOG.filter(t =>
    t.testType.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (labUnitFilter === 'ALL' || t.labUnit === labUnitFilter)
  );
  const totalPages = Math.ceil(filtered.length / TRIGGERS_PAGE_SIZE);
  const pageRows = filtered.slice(page * TRIGGERS_PAGE_SIZE, (page + 1) * TRIGGERS_PAGE_SIZE);

  const openEdit = (test) => {
    setExpandedRow(test.id);
    const sc = triggerState[test.id].sms;
    const ec = triggerState[test.id].email;
    setEditSms({ enabled: sc.enabled, rules: sc.rules.map(r => ({ ...r, selectedValues: [...r.selectedValues] })) });
    setEditEmail({ enabled: ec.enabled, rules: ec.rules.map(r => ({ ...r, selectedValues: [...r.selectedValues] })) });
  };
  const closeEdit = () => { setExpandedRow(null); setEditSms(null); setEditEmail(null); };
  const saveEdit = (testId) => {
    setTriggerState(prev => ({ ...prev, [testId]: { sms: { ...editSms }, email: { ...editEmail } } }));
    closeEdit();
  };

  const smsCount   = FULL_TEST_CATALOG.filter(t => triggerState[t.id]?.sms?.enabled).length;
  const emailCount = FULL_TEST_CATALOG.filter(t => triggerState[t.id]?.email?.enabled).length;

  const th = { padding: '10px 12px', fontSize: 12, fontWeight: 700, color: C.gray70, textAlign: 'left', borderBottom: `2px solid ${C.gray20}`, background: C.gray10 };
  const td = { padding: '10px 12px', fontSize: 13, borderBottom: `1px solid ${C.gray20}`, verticalAlign: 'top' };

  return (
    <PageCard
      title="Test Type Triggers"
      description={`Configure SMS and Email notification rules per test. ${smsCount} tests with active SMS rules · ${emailCount} with active Email rules.`}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 320 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 4 }}>Search</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.gray50, pointerEvents: 'none' }}>🔍</span>
            <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
              placeholder={`Filter ${FULL_TEST_CATALOG.length} test types…`}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ minWidth: 190 }}>
          <SelectField label="Lab unit" value={labUnitFilter} onChange={e => { setLabUnitFilter(e.target.value); setPage(0); }}
            options={[{ value: 'ALL', label: 'All lab units' }, ...LAB_UNITS.map(u => ({ value: u, label: u }))]} />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <Btn kind="secondary" small onClick={() => {
            setTriggerState(prev => {
              const next = { ...prev };
              FULL_TEST_CATALOG.forEach(t => { next[t.id] = { sms: { ...next[t.id].sms, enabled: false }, email: { ...next[t.id].email, enabled: false } }; });
              return next;
            });
          }}>✕ Disable All</Btn>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={th}>Test Type</th>
              <th style={{ ...th, width: 78 }}>Type</th>
              <th style={{ ...th, minWidth: 170 }}>📱 SMS</th>
              <th style={{ ...th, minWidth: 170 }}>✉ Email</th>
              <th style={{ ...th, width: 68 }}></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(test => {
              const smsCfg   = triggerState[test.id]?.sms   || makeDefaultConfig();
              const emailCfg = triggerState[test.id]?.email || makeDefaultConfig();
              const { kind: sk, text: st } = triggerSummary(smsCfg);
              const { kind: ek, text: et } = triggerSummary(emailCfg);
              const isExpanded = expandedRow === test.id;

              return (
                <React.Fragment key={test.id}>
                  <tr style={{ background: isExpanded ? C.blue10 : C.white }}>
                    <td style={td}>
                      <span style={{ fontWeight: 500, display: 'block' }}>{test.testType}</span>
                      <span style={{ fontSize: 11, color: C.gray50 }}>{test.labUnit}</span>
                    </td>
                    <td style={{ ...td, verticalAlign: 'middle' }}>
                      <Tag kind={test.resultType === 'CODED' ? 'blue' : 'warm-gray'}>{test.resultType === 'CODED' ? 'Coded' : 'Numeric'}</Tag>
                    </td>
                    <td style={{ ...td, verticalAlign: 'middle' }}><Tag kind={sk}>{st}</Tag></td>
                    <td style={{ ...td, verticalAlign: 'middle' }}><Tag kind={ek}>{et}</Tag></td>
                    <td style={{ ...td, verticalAlign: 'middle' }}>
                      <Btn kind="ghost" small onClick={() => isExpanded ? closeEdit() : openEdit(test)}>
                        {isExpanded ? '▲ Close' : '▼ Edit'}
                      </Btn>
                    </td>
                  </tr>

                  {isExpanded && editSms && editEmail && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, borderBottom: `1px solid ${C.gray20}` }}>
                        <div style={{ padding: '20px 24px', background: '#f0f4ff', borderTop: `2px solid ${C.blue60}` }}>
                          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>

                            {/* SMS panel */}
                            <div style={{ flex: '1 1 360px', paddingRight: 24, borderRight: `1px solid ${C.blue20}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.gray90 }}>📱 SMS</span>
                                <button onClick={() => setEditSms(c => ({ ...c, enabled: !c.enabled }))} style={{ width: 40, height: 20, borderRadius: 10, border: 'none', background: editSms.enabled ? C.blue60 : C.gray30, position: 'relative', cursor: 'pointer' }}>
                                  <span style={{ display: 'block', width: 14, height: 14, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: editSms.enabled ? 23 : 3, transition: 'left 0.15s' }} />
                                </button>
                                <Tag kind={editSms.enabled ? 'green' : 'gray'}>{editSms.enabled ? 'Enabled' : 'Disabled'}</Tag>
                              </div>
                              {editSms.enabled
                                ? <RuleCards channel="sms" editCfg={editSms} setEditCfg={setEditSms} test={test} />
                                : <p style={{ fontSize: 12, color: C.gray50, fontStyle: 'italic' }}>SMS notifications are disabled for this test type.</p>
                              }
                            </div>

                            {/* Email panel */}
                            <div style={{ flex: '1 1 360px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.gray90 }}>✉ Email</span>
                                <button onClick={() => setEditEmail(c => ({ ...c, enabled: !c.enabled }))} style={{ width: 40, height: 20, borderRadius: 10, border: 'none', background: editEmail.enabled ? C.blue60 : C.gray30, position: 'relative', cursor: 'pointer' }}>
                                  <span style={{ display: 'block', width: 14, height: 14, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: editEmail.enabled ? 23 : 3, transition: 'left 0.15s' }} />
                                </button>
                                <Tag kind={editEmail.enabled ? 'green' : 'gray'}>{editEmail.enabled ? 'Enabled' : 'Disabled'}</Tag>
                              </div>
                              {editEmail.enabled
                                ? <RuleCards channel="email" editCfg={editEmail} setEditCfg={setEditEmail} test={test} />
                                : <p style={{ fontSize: 12, color: C.gray50, fontStyle: 'italic' }}>Email notifications are disabled for this test type.</p>
                              }
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8, marginTop: 18, borderTop: `1px solid ${C.blue20}`, paddingTop: 14 }}>
                            <Btn kind="primary" small onClick={() => saveEdit(test.id)}>Save</Btn>
                            <Btn kind="ghost" small onClick={closeEdit}>Cancel</Btn>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: C.gray50 }}>
            Showing {page * TRIGGERS_PAGE_SIZE + 1}–{Math.min((page + 1) * TRIGGERS_PAGE_SIZE, filtered.length)} of {filtered.length} test types
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn kind="secondary" small disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{ padding: '6px 10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', border: `1px solid ${i === page ? C.blue60 : C.gray30}`, background: i === page ? C.blue60 : C.white, color: i === page ? C.white : C.gray90, fontWeight: i === page ? 700 : 400 }}>{i + 1}</button>
            ))}
            <Btn kind="secondary" small disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</Btn>
          </div>
        </div>
      )}
    </PageCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED TEMPLATES PAGE — SMS + Email templates on one page
// ─────────────────────────────────────────────────────────────────────────────

function CombinedTemplatesPage() {
  const RECIP_TYPES = [
    { key: 'ORDERING_PROVIDER', label: '👨‍⚕️ Ordering Provider' },
    { key: 'PATIENT',           label: '🧑 Patient' },
    { key: 'MANUAL',            label: '📍 Fixed Address' },
  ];

  // ── SMS defaults ──────────────────────────────────────────────────────────
  const SMS_DEFAULTS = {
    ALL:
      'OpenELIS: {{test_name}} for {{patient_id}} — {{result}}. Facility: {{facility}}. Lab #: {{lab_number}}',
    ORDERING_PROVIDER:
      'OpenELIS: {{test_name}} for {{patient_id}} — Result: {{result}}. Validated: {{validated_at}}. Lab #: {{lab_number}}.',
    PATIENT:
      'Your {{test_name}} result is ready: {{result}}. Please contact your healthcare provider. Lab #: {{lab_number}}.',
    MANUAL:
      'ALERT [{{facility}}] {{test_name}} | Patient: {{patient_id}} | Result: {{result}} | Validated: {{validated_at}} | Lab #: {{lab_number}}',
  };

  // ── Email defaults ────────────────────────────────────────────────────────
  const EMAIL_DEFAULTS = {
    ALL: {
      subject: 'OpenELIS Result: {{test_name}} for {{patient_id}}',
      body:
`Dear {{provider_name}},

A result has been validated for your patient {{patient_id}}.

Test:      {{test_name}}
Result:    {{result}}
Facility:  {{facility}}
Validated: {{validated_at}}
Lab #:     {{lab_number}}

Please log in to OpenELIS to review the full result.

This is an automated notification. Do not reply to this message.`,
    },
    ORDERING_PROVIDER: {
      subject: 'OpenELIS Result: {{test_name}} for {{patient_id}}',
      body:
`Dear {{provider_name}},

A result has been validated for your patient {{patient_id}}.

Test:      {{test_name}}
Result:    {{result}}
Facility:  {{facility}}
Validated: {{validated_at}}
Lab #:     {{lab_number}}

Please log in to OpenELIS to review the full result.

This is an automated notification. Do not reply to this message.`,
    },
    PATIENT: {
      subject: 'Your Test Result — {{test_name}}',
      body:
`Dear {{patient_id}},

Your test result for {{test_name}} is now available.

Result:    {{result}}
Facility:  {{facility}}
Date:      {{validated_at}}
Lab #:     {{lab_number}}

Please contact your healthcare provider to discuss your result.

This is an automated notification. Do not reply to this message.`,
    },
    MANUAL: {
      subject: 'Lab Alert: {{test_name}} — {{facility}}',
      body:
`LABORATORY NOTIFICATION

Facility:  {{facility}}
Test:      {{test_name}}
Patient:   {{patient_id}}
Result:    {{result}}
Validated: {{validated_at}}
Lab #:     {{lab_number}}

This is an automated alert from OpenELIS Global.`,
    },
  };

  // ── State ─────────────────────────────────────────────────────────────────
  const [smsSameForAll, setSmsSameForAll]   = useState(false);
  const [smsTemplates,  setSmsTemplates]    = useState({ ...SMS_DEFAULTS });
  const [smsSaved,      setSmsSaved]        = useState(false);

  const [emailSameForAll, setEmailSameForAll] = useState(false);
  const [emailTemplates,  setEmailTemplates]  = useState({
    ALL:               { ...EMAIL_DEFAULTS.ALL },
    ORDERING_PROVIDER: { ...EMAIL_DEFAULTS.ORDERING_PROVIDER },
    PATIENT:           { ...EMAIL_DEFAULTS.PATIENT },
    MANUAL:            { ...EMAIL_DEFAULTS.MANUAL },
  });
  const [emailSaved, setEmailSaved] = useState(false);

  const resolve = (str) => Object.entries(EXAMPLE_VALS).reduce((m, [k, v]) => m.split(k).join(v), str);

  const smsKeys   = smsSameForAll   ? ['ALL'] : RECIP_TYPES.map(r => r.key);
  const emailKeys = emailSameForAll ? ['ALL'] : RECIP_TYPES.map(r => r.key);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── SMS Templates ── */}
      <PageCard
        title="📱 SMS Message Templates"
        description="Default SMS template per recipient type. Used when no per-rule override is set in Test Triggers. Max 480 characters (3 segments).">
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Same-for-all toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
            <button onClick={() => setSmsSameForAll(v => !v)}
              style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 0,
                background: smsSameForAll ? C.blue60 : C.gray30, position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 2, left: smsSameForAll ? 18 : 2, width: 16, height: 16,
                borderRadius: '50%', background: C.white, transition: 'left 0.15s' }} />
            </button>
            <span style={{ fontSize: 13, color: C.gray90 }}>Use same template for all recipient types</span>
          </div>

          {/* Per-type editors */}
          {smsKeys.map(tKey => {
            const typeLabel = tKey === 'ALL' ? null : RECIP_TYPES.find(r => r.key === tKey)?.label;
            const val = smsTemplates[tKey];
            const len = val.length;
            const segs = Math.ceil(len / 160) || 1;
            const over = len > 480, warn = len > 160 && !over;
            const preview = resolve(val);
            return (
              <div key={tKey} style={{ borderTop: `1px solid ${C.gray20}`, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {typeLabel && <div style={{ fontSize: 13, fontWeight: 600, color: C.gray90 }}>{typeLabel}</div>}
                <div>
                  <textarea value={val}
                    onChange={e => setSmsTemplates(t => ({ ...t, [tKey]: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', resize: 'vertical',
                      border: `2px solid ${over ? C.red60 : warn ? C.yellow70 : C.gray30}`,
                      borderRadius: 2, fontSize: 13, fontFamily: 'monospace', outline: 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: over ? C.red60 : warn ? C.yellow70 : 'transparent' }}>
                      {over ? '⚠ Exceeds 480 chars' : warn ? `⚠ ${segs} SMS segments` : '.'}
                    </span>
                    <span style={{ fontSize: 11, color: over ? C.red60 : C.gray50 }}>{len} / 480 ({segs} seg{segs !== 1 ? 's' : ''})</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SMS_MERGE_FIELDS.map(f => (
                    <Btn key={f.token} kind="tertiary" small
                      onClick={() => setSmsTemplates(t => ({ ...t, [tKey]: t[tKey] + f.token }))}>
                      + {f.label}
                    </Btn>
                  ))}
                </div>
                <div style={{ background: C.gray10, border: `1px solid ${C.border}`, borderRadius: 4, padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.gray50, marginBottom: 6 }}>Preview</p>
                  <p style={{ fontSize: 12, fontFamily: 'monospace', color: C.gray100, whiteSpace: 'pre-wrap', margin: 0 }}>{preview || '(empty)'}</p>
                  <p style={{ fontSize: 11, color: C.gray50, marginTop: 4, marginBottom: 0 }}>{preview.length} chars</p>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${C.gray20}`, paddingTop: 16 }}>
            <Btn kind="primary" onClick={() => { setSmsSaved(true); setTimeout(() => setSmsSaved(false), 3000); }}>Save SMS Templates</Btn>
          </div>
          {smsSaved && <Notif kind="success" title="SMS templates saved." onClose={() => setSmsSaved(false)} />}
        </div>
      </PageCard>

      {/* ── Email Templates ── */}
      <PageCard
        title="✉ Email Message Templates"
        description="Default email template per recipient type. Used when no per-rule override is set in Test Triggers.">
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Same-for-all toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
            <button onClick={() => setEmailSameForAll(v => !v)}
              style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 0,
                background: emailSameForAll ? C.blue60 : C.gray30, position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 2, left: emailSameForAll ? 18 : 2, width: 16, height: 16,
                borderRadius: '50%', background: C.white, transition: 'left 0.15s' }} />
            </button>
            <span style={{ fontSize: 13, color: C.gray90 }}>Use same template for all recipient types</span>
          </div>

          {/* Per-type editors */}
          {emailKeys.map(tKey => {
            const typeLabel = tKey === 'ALL' ? null : RECIP_TYPES.find(r => r.key === tKey)?.label;
            const tmpl = emailTemplates[tKey];
            const subjectOver = tmpl.subject.length > 255;
            const subjectPreview = resolve(tmpl.subject);
            const bodyPreview    = resolve(tmpl.body);
            return (
              <div key={tKey} style={{ borderTop: `1px solid ${C.gray20}`, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {typeLabel && <div style={{ fontSize: 13, fontWeight: 600, color: C.gray90 }}>{typeLabel}</div>}

                {/* Subject */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>Subject</label>
                  <input value={tmpl.subject}
                    onChange={e => setEmailTemplates(t => ({ ...t, [tKey]: { ...t[tKey], subject: e.target.value } }))}
                    style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                      border: `2px solid ${subjectOver ? C.red60 : C.gray30}`, borderRadius: 2, fontSize: 13, outline: 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: subjectOver ? C.red60 : 'transparent' }}>⚠ Exceeds 255 chars</span>
                    <span style={{ fontSize: 11, color: C.gray50 }}>{tmpl.subject.length} / 255</span>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70, display: 'block', marginBottom: 6 }}>Body</label>
                  <textarea value={tmpl.body}
                    onChange={e => setEmailTemplates(t => ({ ...t, [tKey]: { ...t[tKey], body: e.target.value } }))}
                    rows={8}
                    style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', resize: 'vertical',
                      border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 12, fontFamily: 'monospace', outline: 'none' }} />
                </div>

                {/* Merge fields — insert into body */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EMAIL_MERGE_FIELDS.map(f => (
                    <Btn key={f.token} kind="tertiary" small
                      onClick={() => setEmailTemplates(t => ({ ...t, [tKey]: { ...t[tKey], body: t[tKey].body + f.token } }))}>
                      + {f.label}
                    </Btn>
                  ))}
                </div>

                {/* Preview */}
                <div style={{ background: C.gray10, border: `1px solid ${C.border}`, borderRadius: 4, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.gray50, marginBottom: 10 }}>Preview</p>
                  <div style={{ background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', background: C.gray10, borderBottom: `1px solid ${C.gray20}`, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: C.gray70 }}>Subject: </span>
                      <span style={{ color: C.gray100 }}>{subjectPreview}</span>
                    </div>
                    <div style={{ padding: 12 }}>
                      <pre style={{ fontSize: 12, fontFamily: 'monospace', color: C.gray100, whiteSpace: 'pre-wrap', margin: 0 }}>{bodyPreview}</pre>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${C.gray20}`, paddingTop: 16 }}>
            <Btn kind="primary" onClick={() => { setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000); }}>Save Email Templates</Btn>
          </div>
          {emailSaved && <Notif kind="success" title="Email templates saved." onClose={() => setEmailSaved(false)} />}
        </div>
      </PageCard>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { key: 'home',    label: 'Home',    icon: '⌂' },
  { key: 'patient', label: 'Patient', icon: '👤' },
  { key: 'order',   label: 'Order',   icon: '📋' },
  { key: 'results', label: 'Results', icon: '🧪' },
  { key: 'inventory', label: 'Inventory', icon: '📦', children: [{ key: 'reagent-stock', label: 'Reagent Stock' }] },
  {
    key: 'admin', label: 'Administration', icon: '⚙',
    children: [
      { key: 'admin-general', label: 'General Config' },
      { key: 'admin-users',   label: 'Users & Roles' },
      {
        key: 'admin-notifications', label: 'Notifications',
        children: [
          { key: 'sms-connection',     label: 'SMS Connection' },
          { key: 'email-connection',   label: 'Email Connection' },
          { key: 'combined-triggers',  label: 'Test Triggers' },
          { key: 'combined-templates', label: 'Message Templates' },
          { key: 'sms-retry',          label: 'SMS Retry Policy' },
          { key: 'email-retry',        label: 'Email Retry Policy' },
          { key: 'sms-log',            label: 'SMS Delivery Log' },
          { key: 'email-log',          label: 'Email Delivery Log' },
        ],
      },
    ],
  },
  { key: 'reports', label: 'Reports', icon: '📊' },
];

const BREADCRUMBS = {
  'sms-connection':      ['Administration', 'Notifications', 'SMS Connection'],
  'email-connection':    ['Administration', 'Notifications', 'Email Connection'],
  'combined-triggers':   ['Administration', 'Notifications', 'Test Triggers'],
  'combined-templates':  ['Administration', 'Notifications', 'Message Templates'],
  'sms-retry':           ['Administration', 'Notifications', 'SMS Retry Policy'],
  'email-retry':         ['Administration', 'Notifications', 'Email Retry Policy'],
  'sms-log':             ['Administration', 'Notifications', 'SMS Delivery Log'],
  'email-log':           ['Administration', 'Notifications', 'Email Delivery Log'],
  // legacy — kept so old deep-links still resolve gracefully
  'sms-triggers':        ['Administration', 'Notifications', 'Test Triggers'],
  'email-triggers':      ['Administration', 'Notifications', 'Test Triggers'],
  'sms-template':        ['Administration', 'Notifications', 'Message Templates'],
  'email-template':      ['Administration', 'Notifications', 'Message Templates'],
};

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [activePage, setActivePage] = useState('combined-triggers');
  const [expandedNav, setExpandedNav] = useState(['admin', 'admin-notifications']);
  const [triggerState, setTriggerState] = useState(INITIAL_TRIGGER_STATE);

  const toggleNav = (key) => setExpandedNav(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const renderNav = (item, depth = 0) => {
    const isActive = activePage === item.key;
    const isExpanded = expandedNav.includes(item.key);
    const hasKids = !!item.children?.length;
    const isNotifChild = item.key && (
      item.key.startsWith('sms-') || item.key.startsWith('email-') ||
      item.key === 'combined-triggers' || item.key === 'combined-templates'
    );

    return (
      <div key={item.key}>
        <button
          onClick={() => { if (hasKids) toggleNav(item.key); else setActivePage(item.key); }}
          style={{
            width: '100%', textAlign: 'left', padding: `9px ${10 + depth * 12}px`,
            fontSize: depth <= 1 ? 14 : depth === 2 ? 13 : 12,
            fontWeight: isActive ? 700 : 400,
            background: isActive ? C.sidebarActive : 'transparent',
            color: isActive ? C.white : isNotifChild ? '#a8d0ff' : C.sidebarText,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            borderLeft: isActive ? `3px solid ${C.white}` : '3px solid transparent',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.sidebarHover; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
          {item.icon && <span style={{ width: 18, textAlign: 'center', fontSize: 15, flexShrink: 0 }}>{item.icon}</span>}
          <span style={{ flex: 1 }}>{item.label}</span>
          {hasKids && <span style={{ fontSize: 9, color: C.sidebarSub }}>{isExpanded ? '▲' : '▼'}</span>}
        </button>
        {hasKids && isExpanded && (
          <div style={{ borderLeft: depth === 0 ? `2px solid #3d3d3d` : 'none', marginLeft: depth === 0 ? 18 : 0 }}>
            {item.children.map(c => renderNav(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const crumbs = BREADCRUMBS[activePage] || [];

  const renderPage = () => {
    switch (activePage) {
      case 'sms-connection':     return <SmsConnectionPage />;
      case 'email-connection':   return <EmailConnectionPage />;
      case 'combined-triggers':  return <CombinedTriggersPage triggerState={triggerState} setTriggerState={setTriggerState} />;
      case 'combined-templates': return <CombinedTemplatesPage />;
      case 'sms-retry':          return <RetryPolicyPage />;
      case 'email-retry':        return <RetryPolicyPage />;
      case 'sms-log':            return <DeliveryLogPage channel="sms" rows={SMS_LOG} />;
      case 'email-log':          return <DeliveryLogPage channel="email" rows={EMAIL_LOG} />;
      // legacy redirects — send old bookmarked keys to combined pages
      case 'sms-triggers':
      case 'email-triggers':     return <CombinedTriggersPage triggerState={triggerState} setTriggerState={setTriggerState} />;
      case 'sms-template':
      case 'email-template':     return <CombinedTemplatesPage />;
      default:                   return <div style={{ padding: 40, color: C.gray50, textAlign: 'center' }}>Select a page from the sidebar.</div>;
    }
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
        <span style={{ color: C.gray30, fontSize: 12 }}>Port Moresby National Lab</span>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.blue60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>CI</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 240, background: C.sidebarBg, flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: '8px 0' }}>{NAV.map(item => renderNav(item, 0))}</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: C.gray10 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 32px' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20, fontSize: 12, color: C.gray50 }}>
              {crumbs.map((c, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {i > 0 && <span style={{ color: C.gray30 }}>/</span>}
                  <span style={{ color: i === crumbs.length - 1 ? C.gray90 : C.gray50, fontWeight: i === crumbs.length - 1 ? 600 : 400 }}>{c}</span>
                </span>
              ))}
            </div>
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}
