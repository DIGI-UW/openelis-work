import { useState } from "react";
import {
  Menu, Search, Bell, HelpCircle, User, ChevronRight, ChevronDown,
  Home, ClipboardList, FileBarChart, Users, Package, Shield, BarChart3,
  Settings, AlertTriangle, Plus, Clock, CheckCircle, XCircle,
  Paperclip, MessageSquare, FileText, FlaskConical, TrendingUp,
  X, Check, Building, AlertCircle
} from "lucide-react";

// ─── Colors ───
const C = {
  teal: "#00695c", tealLight: "#e0f2f1", tealLighter: "#f0faf9",
  gray50: "#f8f9fa", gray100: "#f4f4f4", gray200: "#e0e0e0", gray300: "#c6c6c6",
  gray400: "#a8a8a8", gray500: "#6f6f6f", gray600: "#525252", gray700: "#393939",
  gray800: "#262626", white: "#ffffff",
  red: "#d32f2f", redBg: "#fdecea", orange: "#e65100", orangeBg: "#fff3e0",
  amber: "#f57f17", amberBg: "#fffde7", green: "#2e7d32", greenBg: "#e8f5e9",
  blue: "#1565c0", blueBg: "#e3f2fd", purple: "#6a1b9a", purpleBg: "#f3e5f5",
};

// ─── Sample results data ───
const RESULTS = [
  {
    id: 1, labNumber: "DEV01260000000123",
    patient: { name: "Smith, John", id: "3456789", dob: "01/15/1980", sex: "M", age: "45y" },
    test: "Potassium", sampleType: "Serum", analyzer: "Cobas c501",
    range: "3.5 – 5.0", unit: "mmol/L", result: "6.8", status: "entered",
    flags: ["critical_high"], hasNCE: false,
    previousResults: [{ date: "12/28/2025", value: "4.2" }, { date: "12/01/2025", value: "4.0" }],
  },
  {
    id: 2, labNumber: "DEV01260000000123",
    patient: { name: "Smith, John", id: "3456789", dob: "01/15/1980", sex: "M", age: "45y" },
    test: "Sodium", sampleType: "Serum", analyzer: "Cobas c501",
    range: "136 – 145", unit: "mEq/L", result: "142", status: "entered",
    flags: [], hasNCE: false, previousResults: [{ date: "12/28/2025", value: "140" }],
  },
  {
    id: 3, labNumber: "DEV01260000000124",
    patient: { name: "Doe, Jane", id: "7891234", dob: "05/22/1985", sex: "F", age: "40y" },
    test: "Glucose, Fasting", sampleType: "Serum", analyzer: "Cobas c501",
    range: "70 – 99", unit: "mg/dL", result: "142", status: "entered",
    flags: ["above_normal", "delta_check"], hasNCE: false,
    deltaCheck: { previous: "98", change: "+44.9%", threshold: "20%" },
    previousResults: [{ date: "12/01/2025", value: "98" }],
  },
  {
    id: 4, labNumber: "DEV01260000000125",
    patient: { name: "Brown, Alex", id: "5551234", dob: "03/10/1970", sex: "M", age: "55y" },
    test: "Hemoglobin", sampleType: "Whole Blood", analyzer: "Sysmex XN-L",
    range: "13.0 – 17.0", unit: "g/dL", result: "14.2", status: "entered",
    flags: [], hasNCE: true, nceNumber: "NCE-20260104-0019", nceSeverity: "major",
    previousResults: [{ date: "12/28/2025", value: "14.1" }],
  },
];

const FLAG_STYLES = {
  critical_high: { bg: "#fdecea", text: "#b71c1c", border: "#ef9a9a", label: "⚠️ Critical High" },
  critical_low:  { bg: "#fdecea", text: "#b71c1c", border: "#ef9a9a", label: "⚠️ Critical Low" },
  above_normal:  { bg: "#fff3e0", text: "#e65100", border: "#ffcc80", label: "↑ High" },
  below_normal:  { bg: "#e3f2fd", text: "#1565c0", border: "#90caf9", label: "↓ Low" },
  delta_check:   { bg: "#f3e5f5", text: "#6a1b9a", border: "#ce93d8", label: "Δ Delta Check" },
};

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════
const Header = ({ onMenuClick }) => (
  <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 48, backgroundColor: C.teal, color: "white" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <button onClick={onMenuClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}><Menu size={22} color="white" /></button>
      <span style={{ fontWeight: 700, fontSize: 15 }}>OpenELIS Global</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}><Building size={14} />CDI IPCI – Abidjan</span>
      <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4, position: "relative" }}>
        <Bell size={18} color="white" /><span style={{ position: "absolute", top: 2, right: 2, width: 7, height: 7, backgroundColor: C.orange, borderRadius: "50%" }} />
      </button>
      <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}><HelpCircle size={18} color="white" /></button>
      <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={16} /></div>
        <span style={{ fontSize: 12 }}>admin</span><ChevronDown size={14} />
      </div>
    </div>
  </header>
);

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
const Sidebar = ({ isOpen, currentView, onNavigate }) => {
  const [expanded, setExpanded] = useState(["results"]);
  const toggle = (id) => setExpanded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const menus = [
    { id: "home", label: "Home", icon: Home },
    { id: "order", label: "Order", icon: ClipboardList, children: [
      { id: "order-entry", label: "Order Entry" }, { id: "order-search", label: "Order Search" },
    ]},
    { id: "results", label: "Results", icon: FileBarChart, children: [
      { id: "results-entry", label: "Results Entry" }, { id: "results-validation", label: "Validation" },
      { id: "results-search", label: "Result Search" },
    ]},
    { id: "patient", label: "Patient", icon: Users },
    { id: "sample", label: "Sample", icon: FlaskConical },
    { id: "nce", label: "NCE", icon: AlertTriangle, children: [
      { id: "nce-my", label: "My Assignments" }, { id: "nce-all", label: "All NCEs" },
      { id: "nce-pending", label: "Pending Verification" }, { id: "nce-report", label: "Report NCE" },
      { id: "nce-analytics", label: "Analytics" },
    ]},
    { id: "quality-control", label: "Quality Control", icon: Shield },
    { id: "reports", label: "Reports", icon: BarChart3, children: [
      { id: "routine-reports", label: "Routine Reports" }, { id: "study-reports", label: "Study Reports" },
    ]},
    { id: "admin", label: "Administration", icon: Settings, children: [
      { id: "test-management", label: "Test Management" }, { id: "user-management", label: "User Management" },
    ]},
  ];

  if (!isOpen) return null;
  const isActive = (id) => currentView === id || menus.find(m => m.id === id)?.children?.some(c => c.id === currentView);

  return (
    <aside style={{ width: 250, backgroundColor: C.white, borderRight: `1px solid ${C.gray200}`, height: "calc(100vh - 48px)", overflowY: "auto", flexShrink: 0 }}>
      <nav style={{ padding: "8px 0" }}>
        {menus.map(item => (
          <div key={item.id}>
            <div onClick={() => item.children ? toggle(item.id) : onNavigate(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer",
                backgroundColor: isActive(item.id) ? C.tealLight : "transparent",
                color: isActive(item.id) ? C.teal : C.gray700,
                fontWeight: isActive(item.id) ? 600 : 400, fontSize: 13,
                borderLeft: isActive(item.id) ? `3px solid ${C.teal}` : "3px solid transparent",
              }}>
              <item.icon size={18} /><span style={{ flex: 1 }}>{item.label}</span>
              {item.children && (expanded.includes(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </div>
            {item.children && expanded.includes(item.id) && (
              <div style={{ paddingLeft: 44 }}>
                {item.children.map(child => (
                  <div key={child.id} onClick={() => onNavigate(child.id)}
                    style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderRadius: 4, marginBottom: 1,
                      backgroundColor: currentView === child.id ? C.tealLighter : "transparent",
                      color: currentView === child.id ? C.teal : C.gray600,
                      fontWeight: currentView === child.id ? 600 : 400,
                    }}>{child.label}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

// ═══════════════════════════════════════════════════════════════
// FLAG BADGE
// ═══════════════════════════════════════════════════════════════
const FlagBadge = ({ flag }) => {
  const s = FLAG_STYLES[flag]; if (!s) return null;
  return <span style={{ display: "inline-flex", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{s.label}</span>;
};

// ═══════════════════════════════════════════════════════════════
// INLINE NCE FORM (replaces modal)
// ═══════════════════════════════════════════════════════════════
const InlineNCEForm = ({ result, onClose }) => {
  const [category, setCategory] = useState("analytical");
  const [subcategory, setSubcategory] = useState("");
  const [severity, setSeverity] = useState(result.flags.includes("critical_high") ? "critical" : "major");
  const [sampleAction, setSampleAction] = useState("continue");

  const subs = {
    pre_analytical: ["Specimen Collection", "Specimen Labeling", "Specimen Transport", "Specimen Integrity", "Container Issue"],
    analytical: ["Equipment Malfunction", "QC Failure", "Reagent Issue", "Testing Error", "Result Discrepancy", "Result Nullification"],
    post_analytical: ["Reporting Error", "Transcription Error", "Result Delay", "Interpretation Error"],
    administrative: ["Documentation Gap", "Process Deviation", "Communication Failure", "Training Issue"],
  };

  const sevs = [
    { k: "critical", label: "Critical", desc: "Patient safety risk", bg: C.redBg, border: "#ef9a9a" },
    { k: "major", label: "Major", desc: "Significant quality impact", bg: C.orangeBg, border: "#ffcc80" },
    { k: "minor", label: "Minor", desc: "Limited impact", bg: C.amberBg, border: "#fff176" },
  ];

  return (
    <div style={{ backgroundColor: "#fffbf0", border: `1px solid #ffe0b2`, borderTop: `3px solid ${C.orange}`, borderRadius: "0 0 8px 8px", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: C.gray800 }}>
          <AlertTriangle size={18} color={C.orange} /> Report Non-Conformity Event
        </h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color={C.gray500} /></button>
      </div>

      {/* Context banner */}
      <div style={{ backgroundColor: C.blueBg, border: `1px solid #90caf9`, borderRadius: 6, padding: 10, marginBottom: 16, fontSize: 12 }}>
        <div style={{ fontWeight: 600, color: C.blue, marginBottom: 4 }}>📌 CONTEXT (Auto-populated)</div>
        <div style={{ color: C.gray700 }}>
          Lab #: {result.labNumber} · Test: {result.test} · Result: <strong>{result.result} {result.unit}</strong> · Patient: {result.patient.name} ({result.patient.id}) · {result.patient.sex}/{result.patient.age}
        </div>
        {result.flags.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 6 }}>{result.flags.map(f => <FlagBadge key={f} flag={f} />)}</div>}
      </div>

      {/* Form grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>Category *</label>
          <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(""); }}
            style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray300}`, borderRadius: 4, fontSize: 13, backgroundColor: C.white }}>
            <option value="pre_analytical">Pre-Analytical</option><option value="analytical">Analytical</option>
            <option value="post_analytical">Post-Analytical</option><option value="administrative">Administrative</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>Subcategory *</label>
          <select value={subcategory} onChange={e => setSubcategory(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray300}`, borderRadius: 4, fontSize: 13, backgroundColor: C.white }}>
            <option value="">Select…</option>
            {(subs[category] || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Severity */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray600, marginBottom: 6 }}>Severity *</label>
        <div style={{ display: "flex", gap: 8 }}>
          {sevs.map(s => (
            <label key={s.k} style={{ flex: 1, padding: "8px 10px", border: `1px solid ${severity === s.k ? s.border : C.gray200}`, borderRadius: 6, cursor: "pointer",
              backgroundColor: severity === s.k ? s.bg : C.white, textAlign: "center" }}>
              <input type="radio" name="sev" value={s.k} checked={severity === s.k} onChange={() => setSeverity(s.k)} style={{ display: "none" }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: C.gray500 }}>{s.desc}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Title, Description, Action */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>Title</label>
          <input type="text" placeholder="Brief title (optional)…" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray300}`, borderRadius: 4, fontSize: 13, backgroundColor: C.white, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>Description</label>
          <textarea rows={2} placeholder="Describe the non-conformity (optional)…" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray300}`, borderRadius: 4, fontSize: 13, backgroundColor: C.white, resize: "vertical", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>Immediate Action Taken</label>
          <textarea rows={2} placeholder="What action was taken?" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray300}`, borderRadius: 4, fontSize: 13, backgroundColor: C.white, resize: "vertical", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Sample Action */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray600, marginBottom: 6 }}>Sample Action</label>
        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ flex: 1, display: "flex", gap: 8, padding: 10, border: `1px solid ${sampleAction === "continue" ? C.teal : C.gray200}`, borderRadius: 6, cursor: "pointer", backgroundColor: sampleAction === "continue" ? C.tealLighter : C.white }}>
            <input type="radio" name="action" checked={sampleAction === "continue"} onChange={() => setSampleAction("continue")} style={{ marginTop: 2 }} />
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>Continue with NCE flag</div><div style={{ fontSize: 11, color: C.gray500 }}>Processing continues. NCE indicator displayed.</div></div>
          </label>
          <label style={{ flex: 1, display: "flex", gap: 8, padding: 10, border: `1px solid ${sampleAction === "reject" ? C.red : C.gray200}`, borderRadius: 6, cursor: "pointer", backgroundColor: sampleAction === "reject" ? C.redBg : C.white }}>
            <input type="radio" name="action" checked={sampleAction === "reject"} onChange={() => setSampleAction("reject")} style={{ marginTop: 2 }} />
            <div><div style={{ fontSize: 13, fontWeight: 600, color: sampleAction === "reject" ? C.red : C.gray800 }}>Reject sample</div><div style={{ fontSize: 11, color: C.gray500 }}>Pending tests cancelled. Results nullified.</div></div>
          </label>
        </div>
      </div>

      {/* Linked Items (read-only) */}
      <div style={{ backgroundColor: C.gray50, borderRadius: 6, padding: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.gray500, marginBottom: 6 }}>LINKED ITEMS (auto-linked)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FlaskConical size={14} color={C.teal} /> Sample: {result.labNumber} — {result.sampleType}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><BarChart3 size={14} color={C.blue} /> Result: {result.test} — {result.result} {result.unit}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onClose} style={{ padding: "8px 16px", fontSize: 13, border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer" }}>Cancel</button>
        <button style={{ padding: "8px 16px", fontSize: 13, backgroundColor: C.teal, color: C.white, border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>Submit NCE</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// INLINE DELTA CHECK ALERT
// ═══════════════════════════════════════════════════════════════
const InlineDeltaAlert = ({ result, onReport, onDismiss }) => (
  <div style={{ backgroundColor: C.purpleBg, border: `1px solid #ce93d8`, borderTop: `3px solid ${C.purple}`, borderRadius: "0 0 8px 8px", padding: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <TrendingUp size={18} color={C.purple} />
      <span style={{ fontWeight: 700, fontSize: 14, color: C.purple }}>Delta Check Alert</span>
    </div>
    <div style={{ fontSize: 13, marginBottom: 10 }}>
      <strong>{result.test}</strong> result of <strong>{result.result} {result.unit}</strong> exceeds the delta check threshold.
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 6, padding: 10, marginBottom: 12, fontSize: 12 }}>
      <div>Previous: <strong>{result.deltaCheck.previous} {result.unit}</strong></div>
      <div>Change: <strong style={{ color: C.purple }}>{result.deltaCheck.change}</strong></div>
      <div>Threshold: {result.deltaCheck.threshold}</div>
    </div>
    <div style={{ fontSize: 13, color: C.gray600, marginBottom: 12 }}>Would you like to report a Non-Conformity Event?</div>
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onDismiss} style={{ padding: "6px 14px", fontSize: 13, border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer" }}>Dismiss</button>
      <button onClick={onReport} style={{ padding: "6px 14px", fontSize: 13, backgroundColor: C.orange, color: C.white, border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
        <AlertTriangle size={14} /> Report NCE
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// RESULT ROW
// ═══════════════════════════════════════════════════════════════
const ResultRow = ({ result, expandedId, nceFormId, deltaAlertId, onToggle, onOpenNCE, onShowDelta, onCloseDelta }) => {
  const isExpanded = expandedId === result.id;
  const showNCEForm = nceFormId === result.id;
  const showDelta = deltaAlertId === result.id;
  const resultColor = result.flags.includes("critical_high") || result.flags.includes("critical_low") ? C.red :
    result.flags.includes("above_normal") ? C.orange : result.flags.includes("below_normal") ? C.blue : C.gray800;

  return (
    <div style={{ border: `1px solid ${isExpanded || showNCEForm || showDelta ? "#90caf9" : C.gray200}`, borderRadius: 8, backgroundColor: C.white, marginBottom: 6 }}>
      {/* Row */}
      <div onClick={() => onToggle(result.id)} style={{ display: "grid", gridTemplateColumns: "28px 28px 140px 120px 160px 120px 80px 1fr", alignItems: "center", padding: "10px 12px", cursor: "pointer", gap: 8 }}>
        <div>{isExpanded ? <ChevronDown size={16} color={C.gray400} /> : <ChevronRight size={16} color={C.gray400} />}</div>
        <div><input type="checkbox" onClick={e => e.stopPropagation()} /></div>
        <div style={{ fontSize: 12, fontFamily: "monospace", color: C.gray500, display: "flex", alignItems: "center", gap: 4 }}>
          {result.hasNCE && <AlertTriangle size={14} color={C.orange} />}
          {result.labNumber.slice(-6)}
        </div>
        <div style={{ fontSize: 13 }}>{result.patient.name}</div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{result.test}</div>
        <div style={{ fontSize: 12, color: C.gray500 }}>{result.range}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: resultColor }}>{result.result}</div>
        <div style={{ display: "flex", gap: 4 }}>{result.flags.map(f => <FlagBadge key={f} flag={f} />)}</div>
      </div>

      {/* Expanded detail */}
      {isExpanded && !showNCEForm && !showDelta && (
        <div style={{ borderTop: `1px solid ${C.gray200}`, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.gray600 }}>
              <strong>{result.patient.name}</strong> · {result.patient.id} · {result.patient.sex}/{result.patient.age} · DOB: {result.patient.dob} · Analyzer: {result.analyzer}
            </div>
            {result.hasNCE && <span style={{ fontSize: 11, backgroundColor: C.orangeBg, color: C.orange, padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>⚠️ {result.nceNumber}</span>}
          </div>

          {result.previousResults.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.gray500, marginBottom: 4 }}>Previous Results</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.gray600 }}>
                {result.previousResults.map((pr, i) => <span key={i}>{pr.date}: <strong>{pr.value}</strong></span>)}
              </div>
            </div>
          )}

          {result.deltaCheck && (
            <div style={{ backgroundColor: C.purpleBg, border: `1px solid #ce93d8`, borderRadius: 6, padding: 8, marginBottom: 10, fontSize: 12, color: C.purple, display: "flex", alignItems: "center", gap: 6 }}>
              <TrendingUp size={14} /> Delta: Previous {result.deltaCheck.previous}, Change {result.deltaCheck.change} (threshold: {result.deltaCheck.threshold})
            </div>
          )}

          <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: `1px solid ${C.gray200}` }}>
            <button style={{ padding: "6px 14px", fontSize: 13, backgroundColor: C.green, color: C.white, border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Check size={14} /> Accept Result</button>
            <button style={{ padding: "6px 14px", fontSize: 13, border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><MessageSquare size={14} /> Add Note</button>
            <button onClick={(e) => { e.stopPropagation(); onOpenNCE(result.id); }}
              style={{ padding: "6px 14px", fontSize: 13, backgroundColor: C.orange, color: C.white, border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              <AlertTriangle size={14} /> Report NCE
            </button>
            {result.deltaCheck && (
              <button onClick={(e) => { e.stopPropagation(); onShowDelta(result.id); }}
                style={{ padding: "6px 14px", fontSize: 13, border: `1px solid #ce93d8`, color: C.purple, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <TrendingUp size={14} /> Review Delta
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inline NCE Form */}
      {showNCEForm && <InlineNCEForm result={result} onClose={() => onOpenNCE(null)} />}

      {/* Inline Delta Alert */}
      {showDelta && <InlineDeltaAlert result={result} onReport={() => { onCloseDelta(); onOpenNCE(result.id); }} onDismiss={onCloseDelta} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function ResultsEntryApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState("results-entry");
  const [expandedId, setExpandedId] = useState(null);
  const [nceFormId, setNceFormId] = useState(null);
  const [deltaAlertId, setDeltaAlertId] = useState(null);

  const handleToggle = (id) => {
    if (nceFormId === id) return; // don't collapse while NCE form is open
    if (deltaAlertId === id) return;
    setExpandedId(expandedId === id ? null : id);
    setNceFormId(null);
    setDeltaAlertId(null);
  };

  const handleOpenNCE = (id) => {
    setNceFormId(nceFormId === id ? null : id);
    setExpandedId(null);
    setDeltaAlertId(null);
  };

  const handleShowDelta = (id) => {
    setDeltaAlertId(id);
    setExpandedId(null);
    setNceFormId(null);
  };

  const nceCount = RESULTS.filter(r => r.hasNCE).length;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", fontSize: 14, color: C.gray800 }}>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar isOpen={sidebarOpen} currentView={currentView} onNavigate={setCurrentView} />

        <main style={{ flex: 1, overflow: "auto", backgroundColor: C.gray100, padding: 24 }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: C.gray500, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <span>Results</span><ChevronRight size={12} /><span style={{ color: C.gray700 }}>Results Entry</span>
          </div>

          {/* Page Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Results Entry</h1>
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: C.gray500, marginTop: 4 }}>
                <span>Entered: <strong>3</strong></span>
                <span>Pending: <strong>1</strong></span>
                {nceCount > 0 && <span style={{ color: C.orange }}>⚠️ NCEs: <strong>{nceCount}</strong></span>}
              </div>
            </div>
            <button style={{ padding: "8px 16px", fontSize: 13, backgroundColor: C.teal, color: C.white, border: "none", borderRadius: 6, cursor: "pointer" }}>Save All</button>
          </div>

          {/* Column Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "28px 28px 140px 120px 160px 120px 80px 1fr", gap: 8, padding: "8px 12px", backgroundColor: C.gray200, borderRadius: "8px 8px 0 0", fontSize: 11, fontWeight: 600, color: C.gray600, textTransform: "uppercase" }}>
            <div></div><div></div><div>Lab Number</div><div>Patient</div><div>Test</div><div>Normal Range</div><div>Result</div><div>Flags</div>
          </div>

          {/* Result Rows */}
          {RESULTS.map(r => (
            <ResultRow key={r.id} result={r}
              expandedId={expandedId} nceFormId={nceFormId} deltaAlertId={deltaAlertId}
              onToggle={handleToggle} onOpenNCE={handleOpenNCE}
              onShowDelta={handleShowDelta} onCloseDelta={() => setDeltaAlertId(null)} />
          ))}

          {/* Legend */}
          <div style={{ marginTop: 20, backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.gray700, marginBottom: 8 }}>NCE Integration Points:</div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12, color: C.gray600 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} color={C.orange} /> "Report NCE" opens inline form below row</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={14} color={C.purple} /> Delta check alert with inline NCE link</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} color={C.red} /> Critical value prompt (configurable)</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
