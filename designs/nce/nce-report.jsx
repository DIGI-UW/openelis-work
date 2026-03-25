import { useState, useEffect } from "react";
import {
  Menu, Search, Bell, HelpCircle, User, ChevronRight, ChevronDown,
  Home, ClipboardList, FileBarChart, Users, Package, Shield, BarChart3,
  Settings, AlertTriangle, Plus, Clock, CheckCircle, XCircle,
  Calendar, Paperclip, MessageSquare, FileText, History, Link2,
  FlaskConical, TrendingUp, AlertCircle, X, Check, RefreshCw,
  Building, ChevronUp, Upload, Printer, Download, Eye, Filter,
  FileSpreadsheet, File, UserCircle, MapPin, Stethoscope
} from "lucide-react";

// ─── OpenELIS Colors ───
const C = {
  teal: "#00695c", tealLight: "#e0f2f1", tealLighter: "#f0faf9",
  gray50: "#f8f9fa", gray100: "#f4f4f4", gray200: "#e0e0e0", gray300: "#c6c6c6",
  gray400: "#a8a8a8", gray500: "#6f6f6f", gray600: "#525252", gray700: "#393939",
  gray800: "#262626", gray900: "#161616", white: "#ffffff",
  red: "#d32f2f", redBg: "#fdecea", orange: "#e65100", orangeBg: "#fff3e0",
  amber: "#f57f17", amberBg: "#fffde7", green: "#2e7d32", greenBg: "#e8f5e9",
  blue: "#1565c0", blueBg: "#e3f2fd", purple: "#6a1b9a", purpleBg: "#f3e5f5",
};

const SEV = {
  critical: { bg: "#fdecea", text: "#b71c1c", dot: "#d32f2f", border: "#ef9a9a" },
  major:    { bg: "#fff3e0", text: "#e65100", dot: "#e65100", border: "#ffcc80" },
  minor:    { bg: "#fffde7", text: "#f57f17", dot: "#f57f17", border: "#fff176" },
};
const STAT = {
  open:                { label: "Open",                           bg: C.blueBg,   text: C.blue },
  acknowledged:        { label: "Acknowledged",                   bg: C.purpleBg, text: C.purple },
  under_investigation: { label: "Under Investigation",            bg: "#e8eaf6",  text: "#283593" },
  corrective_action:   { label: "Corrective Action",              bg: C.orangeBg, text: C.orange },
  closed_pending:      { label: "Closed – Pending Verification",  bg: C.tealLight, text: C.teal },
  closed_verified:     { label: "Closed – Verified",              bg: C.greenBg,  text: C.green },
};

// ═══════════════════════════════════════════════════════════════
// Sample data for linking tree
// ═══════════════════════════════════════════════════════════════
const sampleOrders = [
  {
    labNumber: "DEV01260000000123", patientId: "3456789", patientName: "Smith, John",
    testSummary: "BMP, CBC", receivedDate: "01/05/2026 09:15",
    sampleItems: [
      { id: "s1", type: "Serum", description: "Chemistry Panel", collectionDate: "01/05/2026 08:30",
        results: [
          { id: "r1", testName: "Potassium", value: "6.8", unit: "mmol/L", flag: "critical_high", status: "final" },
          { id: "r2", testName: "Sodium", value: "142", unit: "mEq/L", flag: null, status: "final" },
          { id: "r3", testName: "Chloride", value: "101", unit: "mEq/L", flag: null, status: "final" },
          { id: "r4", testName: "CO2", value: "24", unit: "mEq/L", flag: null, status: "final" },
        ]
      },
      { id: "s2", type: "Whole Blood", description: "CBC", collectionDate: "01/05/2026 08:30",
        results: [
          { id: "r5", testName: "Hemoglobin", value: "14.2", unit: "g/dL", flag: null, status: "final" },
          { id: "r6", testName: "WBC", value: "8.5", unit: "x10³/µL", flag: null, status: "final" },
          { id: "r7", testName: "Platelets", value: "250", unit: "x10³/µL", flag: null, status: "final" },
        ]
      }
    ]
  },
];

// Sample NCE records for the reports view
const reportNCEs = [
  { id: "NCE-20260105-0023", date: "2026-01-05", category: "Pre-Analytical", subcategory: "Specimen Integrity", severity: "critical", status: "open", assignedTo: "J. Smith", title: "Critical potassium – verify sample integrity", labNumber: "DEV01260000000456", patient: "Smith, John" },
  { id: "NCE-20260104-0019", date: "2026-01-04", category: "Analytical", subcategory: "Result Discrepancy", severity: "major", status: "under_investigation", assignedTo: "M. Johnson", title: "Delta check exceeded for Hemoglobin", labNumber: "DEV01260000000389", patient: "Williams, R." },
  { id: "NCE-20260103-0015", date: "2026-01-03", category: "Pre-Analytical", subcategory: "Specimen Labeling", severity: "minor", status: "corrective_action", assignedTo: "K. Williams", title: "Missing patient label on morning batch", labNumber: "DEV01260000000301", patient: "Mensah, A." },
  { id: "NCE-20260102-0012", date: "2026-01-02", category: "Administrative", subcategory: "Test Cancellation", severity: "minor", status: "closed_verified", assignedTo: "A. Johnson", title: "Clinician-cancelled CBC after results entered", labNumber: "DEV01260000000280", patient: "Kofi, E." },
  { id: "NCE-20260101-0008", date: "2026-01-01", category: "Analytical", subcategory: "QC Failure", severity: "major", status: "closed_verified", assignedTo: "M. Garcia", title: "Westgard 2-2s violation on Chemistry analyzer", labNumber: "DEV01260000000250", patient: "(Multiple)" },
  { id: "NCE-20251230-0005", date: "2025-12-30", category: "Post-Analytical", subcategory: "Referral Result Rejection", severity: "major", status: "closed_pending", assignedTo: "S. Lee", title: "Reference lab results rejected – incomplete panel", labNumber: "DEV01250000000980", patient: "Bamba, M." },
  { id: "NCE-20251228-0003", date: "2025-12-28", category: "Pre-Analytical", subcategory: "Specimen Transport", severity: "minor", status: "closed_verified", assignedTo: "J. Smith", title: "Temperature excursion during courier transport", labNumber: "DEV01250000000942", patient: "(Batch – 4 specimens)" },
  { id: "NCE-20251227-0001", date: "2025-12-27", category: "Administrative", subcategory: "Order Cancellation", severity: "minor", status: "closed_verified", assignedTo: "K. Williams", title: "Duplicate order cancelled after partial processing", labNumber: "DEV01250000000930", patient: "Diallo, F." },
];

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════
const Header = ({ onMenuClick }) => (
  <header style={{ height: 48, backgroundColor: C.gray900, color: C.white, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", position: "sticky", top: 0, zIndex: 100 }}>
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
  const [expanded, setExpanded] = useState(["nce"]);
  const toggle = (id) => setExpanded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const menus = [
    { id: "home", label: "Home", icon: Home },
    { id: "order", label: "Order", icon: ClipboardList, children: [
      { id: "order-entry", label: "Order Entry" }, { id: "order-search", label: "Order Search" },
      { id: "batch-order", label: "Batch Order Entry" }, { id: "electronic-orders", label: "Electronic Orders" },
    ]},
    { id: "results", label: "Results", icon: FileBarChart, children: [
      { id: "results-entry", label: "Results Entry" }, { id: "results-validation", label: "Validation" },
      { id: "results-search", label: "Result Search" },
    ]},
    { id: "patient", label: "Patient", icon: Users },
    { id: "sample", label: "Sample", icon: FlaskConical },
    { id: "nce", label: "NCE", icon: AlertTriangle, children: [
      { id: "nce-my",        label: "My Assignments" },
      { id: "nce-all",       label: "All NCEs" },
      { id: "nce-pending",   label: "Pending Verification" },
      { id: "nce-report",    label: "Report NCE" },
      { id: "nce-reports",   label: "NCE Reports" },
      { id: "nce-analytics", label: "Analytics" },
    ]},
    { id: "quality-control", label: "Quality Control", icon: Shield },
    { id: "reports", label: "Reports", icon: BarChart3, children: [
      { id: "routine-reports", label: "Routine Reports" }, { id: "study-reports", label: "Study Reports" },
    ]},
    { id: "admin", label: "Administration", icon: Settings, children: [
      { id: "test-management", label: "Test Management" }, { id: "amr-config", label: "AMR Configuration" },
      { id: "site-info", label: "Site Information" }, { id: "user-management", label: "User Management" },
    ]},
  ];

  if (!isOpen) return null;
  const isActive = (id) => currentView === id || (menus.find(m => m.id === id)?.children?.some(c => c.id === currentView));

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
              <item.icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
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
                    }}>
                    {child.label}
                  </div>
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
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════
const Badge = ({ children, bg, color, border }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: bg, color, border: border ? `1px solid ${border}` : "none", whiteSpace: "nowrap" }}>{children}</span>
);

const SeverityDot = ({ severity }) => (
  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: SEV[severity]?.dot || C.gray400, display: "inline-block", flexShrink: 0 }} />
);

const FlagBadge = ({ flag }) => {
  if (!flag) return null;
  const map = { critical_high: { bg: "#fdecea", c: "#b71c1c", l: "⚠ Critical High" }, above_normal: { bg: "#fff3e0", c: "#e65100", l: "↑ High" } };
  const s = map[flag] || { bg: C.gray100, c: C.gray600, l: flag };
  return <Badge bg={s.bg} color={s.c}>{s.l}</Badge>;
};

// ═══════════════════════════════════════════════════════════════
// REPORT NCE — Creation Form
// ═══════════════════════════════════════════════════════════════
// Generate provisional NCE number on form load
const genNceNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `NCE-${y}${m}${d}-${seq}`;
};

const ReportNCEView = () => {
  // Reporter & event context
  const [nceNumber] = useState(genNceNumber);
  const [reporterName, setReporterName] = useState("admin");
  const [dateOfEvent, setDateOfEvent] = useState(new Date().toISOString().split("T")[0]);
  const [reportingUnit, setReportingUnit] = useState("CDI IPCI – Abidjan");
  const [labUnits, setLabUnits] = useState([
    "CDI IPCI – Abidjan", "Hématologie", "Biochimie", "Microbiologie",
    "Anatomopathologie", "Immunologie", "Virologie", "Parasitologie",
  ]);
  const [unitQuery, setUnitQuery] = useState("CDI IPCI – Abidjan");
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  // Classification
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [severity, setSeverity] = useState("");

  // Details
  const [suspectedCauses, setSuspectedCauses] = useState("");
  const [proposedAction, setProposedAction] = useState("");

  // Linking
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [linkedOrders, setLinkedOrders] = useState([]);
  const [selectedSamples, setSelectedSamples] = useState(new Set(["s1"]));
  const [selectedResults, setSelectedResults] = useState(new Set(["r1"]));
  const [expandedSamples, setExpandedSamples] = useState(new Set(["s1"]));
  const [files, setFiles] = useState([]);

  const subcategories = {
    "Pre-Analytical": ["Specimen Collection", "Specimen Labeling", "Specimen Transport", "Specimen Integrity", "Container Issue", "Order Entry"],
    "Analytical": ["Equipment Malfunction", "QC Failure", "Reagent Issue", "Testing Error", "Result Discrepancy", "Result Nullification"],
    "Post-Analytical": ["Reporting Error", "Transcription Error", "Result Delay", "Interpretation Error", "Referral Result Rejection"],
    "Administrative": ["Documentation Gap", "Process Deviation", "Communication Failure", "Training Issue", "Test Cancellation", "Order Cancellation", "Specimen Disposal"],
  };

  const toggleSample = (sId, order) => {
    const ns = new Set(selectedSamples);
    const nr = new Set(selectedResults);
    const sample = order.sampleItems.find(s => s.id === sId);
    if (ns.has(sId)) {
      ns.delete(sId);
      sample.results.forEach(r => nr.delete(r.id));
    } else {
      ns.add(sId);
      sample.results.forEach(r => nr.add(r.id));
    }
    setSelectedSamples(ns);
    setSelectedResults(nr);
  };

  const toggleResult = (rId, sId) => {
    const nr = new Set(selectedResults);
    const ns = new Set(selectedSamples);
    if (nr.has(rId)) { nr.delete(rId); } else { nr.add(rId); ns.add(sId); }
    setSelectedResults(nr);
    setSelectedSamples(ns);
  };

  const addOrder = (order) => {
    if (!linkedOrders.find(o => o.labNumber === order.labNumber)) {
      setLinkedOrders([...linkedOrders, order]);
      // Auto-select first sample and all its results
      const ns = new Set(selectedSamples);
      const nr = new Set(selectedResults);
      const es = new Set(expandedSamples);
      ns.add(order.sampleItems[0].id);
      es.add(order.sampleItems[0].id);
      order.sampleItems[0].results.forEach(r => nr.add(r.id));
      setSelectedSamples(ns);
      setSelectedResults(nr);
      setExpandedSamples(es);
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  const selStyle = (active) => ({
    padding: "14px 18px", borderRadius: 8, cursor: "pointer", textAlign: "center",
    border: `2px solid ${active ? C.teal : C.gray200}`,
    backgroundColor: active ? C.tealLighter : C.white,
    transition: "all 0.15s",
  });

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: C.gray500, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
        <span>NCE</span><ChevronRight size={12} /><span style={{ color: C.gray700, fontWeight: 500 }}>Report NCE</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <AlertTriangle size={22} color={C.orange} />
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.gray900 }}>
            {/* label.nce.reportNce.title */}
            Report Non-Conformity Event
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: C.gray500 }}>
            {/* label.nce.reportNce.subtitle */}
            Document a quality event and link to affected samples and results
          </p>
        </div>
      </div>

      {/* ─── Reporter & Event Context ─── */}
      <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: C.gray800, display: "flex", alignItems: "center", gap: 6 }}>
          <UserCircle size={16} color={C.teal} />
          {/* label.nce.section.reporterContext */}
          Reporter & Event Context
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 16, alignItems: "start" }}>
          {/* NCE Number — read-only */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
              {/* label.nce.field.nceNumber */}
              NCE Number
            </label>
            <div style={{ padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, backgroundColor: C.gray100, fontFamily: "monospace", fontWeight: 600, color: C.teal, whiteSpace: "nowrap" }}>
              {nceNumber}
            </div>
            <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>Auto-generated</div>
          </div>
          {/* Reporter Name */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
              {/* label.nce.field.reporterName */}
              Reporter Name <span style={{ color: C.red }}>*</span>
            </label>
            <input type="text" value={reporterName} onChange={e => setReporterName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, boxSizing: "border-box" }} />
            <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>Defaults to logged-in user</div>
          </div>
          {/* Date of Event */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
              {/* label.nce.field.dateOfEvent */}
              Date of Event <span style={{ color: C.red }}>*</span>
            </label>
            <input type="date" value={dateOfEvent} onChange={e => setDateOfEvent(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, boxSizing: "border-box" }} />
            <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>Defaults to today</div>
          </div>
          {/* Reporting Unit — creatable typeahead */}
          <div style={{ position: "relative" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
              {/* label.nce.field.reportingUnit */}
              Reporting Unit <span style={{ color: C.red }}>*</span>
            </label>
            <input
              type="text"
              value={unitQuery}
              onChange={e => { setUnitQuery(e.target.value); setReportingUnit(e.target.value); setShowUnitDropdown(true); }}
              onFocus={() => setShowUnitDropdown(true)}
              onBlur={() => {
                setTimeout(() => {
                  setShowUnitDropdown(false);
                  // Save new entry to list if not already present
                  if (unitQuery.trim() && !labUnits.includes(unitQuery.trim())) {
                    setLabUnits(prev => [...prev, unitQuery.trim()]);
                  }
                }, 150);
              }}
              placeholder="Search or enter unit…"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${showUnitDropdown ? C.teal : C.gray200}`, borderRadius: showUnitDropdown ? "4px 4px 0 0" : 4, fontSize: 13, boxSizing: "border-box", outline: "none" }}
            />
            {showUnitDropdown && (() => {
              const q = unitQuery.trim().toLowerCase();
              const filtered = labUnits.filter(u => u.toLowerCase().includes(q));
              const showCreate = unitQuery.trim() && !labUnits.map(u => u.toLowerCase()).includes(q);
              if (!filtered.length && !showCreate) return null;
              return (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: C.white, border: `1px solid ${C.teal}`, borderTop: "none", borderRadius: "0 0 4px 4px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 20, maxHeight: 180, overflowY: "auto" }}>
                  {filtered.map(u => (
                    <div key={u}
                      onMouseDown={() => { setUnitQuery(u); setReportingUnit(u); setShowUnitDropdown(false); }}
                      style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer", backgroundColor: u === reportingUnit ? C.tealLighter : C.white, color: u === reportingUnit ? C.teal : C.gray800, fontWeight: u === reportingUnit ? 600 : 400 }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = C.gray50}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = u === reportingUnit ? C.tealLighter : C.white}>
                      {u}
                    </div>
                  ))}
                  {showCreate && (
                    <div
                      onMouseDown={() => {
                        const v = unitQuery.trim();
                        setLabUnits(prev => [...prev, v]);
                        setReportingUnit(v);
                        setUnitQuery(v);
                        setShowUnitDropdown(false);
                      }}
                      style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer", color: C.teal, fontWeight: 500, borderTop: filtered.length ? `1px solid ${C.gray100}` : "none", display: "flex", alignItems: "center", gap: 6 }}>
                      <Plus size={13} />
                      {/* label.nce.reportingUnit.addNew */}
                      Add "{unitQuery.trim()}"
                    </div>
                  )}
                </div>
              );
            })()}
            <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>Inherited from user context · type to search or add</div>
          </div>
        </div>
      </div>

      {/* ─── Classification Section ─── */}
      <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: C.gray800 }}>
          {/* label.nce.section.classification */}
          Classification
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {/* Category */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
              {/* label.nce.field.category */}
              Category <span style={{ color: C.red }}>*</span>
            </label>
            <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(""); }}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, backgroundColor: C.white }}>
              <option value="">Select category…</option>
              <option>Pre-Analytical</option><option>Analytical</option><option>Post-Analytical</option><option>Administrative</option>
            </select>
          </div>
          {/* Subcategory */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
              {/* label.nce.field.subcategory */}
              Subcategory <span style={{ color: C.red }}>*</span>
            </label>
            <select value={subcategory} onChange={e => setSubcategory(e.target.value)} disabled={!category}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, backgroundColor: !category ? C.gray100 : C.white }}>
              <option value="">Select subcategory…</option>
              {(subcategories[category] || []).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Severity */}
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 8 }}>
          {/* label.nce.field.severity */}
          Severity <span style={{ color: C.red }}>*</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 4 }}>
          {[
            { key: "critical", label: "Critical", desc: "Patient safety risk, regulatory violation", color: C.red },
            { key: "major", label: "Major", desc: "Significant quality or operational impact", color: C.orange },
            { key: "minor", label: "Minor", desc: "Limited impact, easily corrected", color: C.amber },
          ].map(s => (
            <div key={s.key} onClick={() => setSeverity(s.key)}
              style={{ ...selStyle(severity === s.key), borderColor: severity === s.key ? s.color : C.gray200, backgroundColor: severity === s.key ? SEV[s.key].bg : C.white }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                <SeverityDot severity={s.key} />
                <span style={{ fontWeight: 600, fontSize: 13, color: severity === s.key ? SEV[s.key].text : C.gray700 }}>
                  {/* label.nce.severity.{key} */}
                  {s.label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.gray500 }}>
                {/* label.nce.severity.{key}.desc */}
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Details Section ─── */}
      <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: C.gray800 }}>
          {/* label.nce.section.details */}
          Details
        </h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
            {/* label.nce.field.title */}
            Title <span style={{ fontSize: 11, fontWeight: 400, color: C.gray400 }}>(optional)</span>
          </label>
          <input type="text" placeholder="Brief description of the event…" maxLength={200}
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
            {/* label.nce.field.description */}
            Description <span style={{ fontSize: 11, fontWeight: 400, color: C.gray400 }}>(optional)</span>
          </label>
          <textarea rows={3} placeholder="Describe what happened, when it was detected, and any relevant context…"
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
            {/* label.nce.field.immediateAction */}
            Immediate Action Taken <span style={{ fontSize: 11, fontWeight: 400, color: C.gray400 }}>(optional)</span>
          </label>
          <textarea rows={2} placeholder="What corrective steps were taken immediately…"
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
              {/* label.nce.field.suspectedCauses */}
              Suspected Causes <span style={{ fontSize: 11, fontWeight: 400, color: C.gray400 }}>(optional)</span>
            </label>
            <textarea rows={3} value={suspectedCauses} onChange={e => setSuspectedCauses(e.target.value)}
              placeholder="Reporter's initial hypothesis on cause…"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>Initial assessment only — formal root cause determined during investigation</div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
              {/* label.nce.field.proposedAction */}
              Proposed Action <span style={{ fontSize: 11, fontWeight: 400, color: C.gray400 }}>(optional)</span>
            </label>
            <textarea rows={3} value={proposedAction} onChange={e => setProposedAction(e.target.value)}
              placeholder="Recommended next steps…"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>Separate from CAPA actions assigned during corrective action workflow</div>
          </div>
        </div>

        {/* Attachments */}
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>
          {/* label.nce.field.attachments */}
          Attachments <span style={{ fontSize: 11, fontWeight: 400, color: C.gray400 }}>(optional)</span>
        </label>
        <div style={{ border: `2px dashed ${C.gray300}`, borderRadius: 6, padding: 20, textAlign: "center", cursor: "pointer", color: C.gray500, fontSize: 13, backgroundColor: C.gray50 }}>
          <Upload size={20} style={{ marginBottom: 4 }} />
          <div>
            {/* label.nce.field.attachments.dropzone */}
            Drop files here or <span style={{ color: C.teal, fontWeight: 500 }}>browse</span>
          </div>
          <div style={{ fontSize: 11, marginTop: 4, color: C.gray400 }}>PDF, PNG, JPG, DOCX – Max 10 MB per file</div>
        </div>
      </div>

      {/* ─── Link to Samples / Results ─── */}
      <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.gray800 }}>
            <Link2 size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
            {/* label.nce.section.linkedItems */}
            Link to Samples / Results
            <span style={{ fontSize: 11, fontWeight: 400, color: C.gray400, marginLeft: 8 }}>(optional)</span>
          </h3>
        </div>

        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 11, color: C.gray400 }} />
          <input type="text" value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowSearch(e.target.value.length > 0); }}
            placeholder="Search by Lab #, Patient ID, or Patient Name…"
            style={{ width: "100%", padding: "10px 12px 10px 36px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 13, boxSizing: "border-box" }}
          />
          {/* Search results dropdown */}
          {showSearch && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: "0 0 6px 6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
              {sampleOrders.filter(o => o.labNumber.toLowerCase().includes(searchQuery.toLowerCase()) || o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || o.patientId.includes(searchQuery)).map(order => (
                <div key={order.labNumber} onClick={() => addOrder(order)}
                  style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${C.gray100}`, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = C.gray50}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = C.white}>
                  <div>
                    <span style={{ fontWeight: 600, fontFamily: "monospace", color: C.teal }}>{order.labNumber}</span>
                    <span style={{ margin: "0 8px", color: C.gray300 }}>—</span>
                    <span>{order.patientName} ({order.patientId})</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.gray400 }}>{order.testSummary}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked orders with hierarchical tree */}
        {linkedOrders.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: C.gray400, fontSize: 13, backgroundColor: C.gray50, borderRadius: 6 }}>
            {/* label.nce.linking.empty */}
            No samples or results linked yet. Use the search above to find and link orders.
          </div>
        )}
        {linkedOrders.map(order => (
          <div key={order.labNumber} style={{ border: `1px solid ${C.gray200}`, borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
            {/* Order header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardList size={16} color={C.teal} />
                <span style={{ fontWeight: 600, fontFamily: "monospace", fontSize: 13 }}>{order.labNumber}</span>
                <span style={{ color: C.gray300 }}>—</span>
                <span style={{ fontSize: 13, color: C.gray700 }}>{order.patientName} ({order.patientId})</span>
              </div>
              <button onClick={() => setLinkedOrders(linkedOrders.filter(o => o.labNumber !== order.labNumber))}
                style={{ padding: "4px 10px", fontSize: 12, border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", color: C.red, display: "flex", alignItems: "center", gap: 4 }}>
                <X size={12} />
                {/* label.nce.linking.remove */}
                Remove
              </button>
            </div>
            {/* Sample items */}
            <div style={{ padding: "8px 14px" }}>
              {order.sampleItems.map(sample => (
                <div key={sample.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer" }}
                    onClick={() => { const es = new Set(expandedSamples); es.has(sample.id) ? es.delete(sample.id) : es.add(sample.id); setExpandedSamples(es); }}>
                    {expandedSamples.has(sample.id) ? <ChevronDown size={14} color={C.gray400} /> : <ChevronRight size={14} color={C.gray400} />}
                    <input type="checkbox" checked={selectedSamples.has(sample.id)} onClick={e => e.stopPropagation()}
                      onChange={() => toggleSample(sample.id, order)}
                      style={{ accentColor: C.teal, width: 16, height: 16 }} />
                    <FlaskConical size={14} color={C.teal} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{sample.type}</span>
                    <span style={{ fontSize: 12, color: C.gray500 }}>— {sample.description}</span>
                    <span style={{ fontSize: 11, color: C.gray400, marginLeft: "auto" }}>collected {sample.collectionDate}</span>
                  </div>
                  {/* Results */}
                  {expandedSamples.has(sample.id) && (
                    <div style={{ paddingLeft: 50 }}>
                      {sample.results.map(result => (
                        <div key={result.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.gray100}` }}>
                          <input type="checkbox" checked={selectedResults.has(result.id)}
                            onChange={() => toggleResult(result.id, sample.id)}
                            style={{ accentColor: C.teal, width: 15, height: 15 }} />
                          <BarChart3 size={12} color={C.gray400} />
                          <span style={{ fontSize: 13, fontWeight: 500, minWidth: 110 }}>{result.testName}</span>
                          <span style={{ fontSize: 13, color: C.gray600 }}>{result.value} {result.unit}</span>
                          <FlagBadge flag={result.flag} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Patient Context (auto-populated from linked order) ─── */}
      {linkedOrders.length > 0 && (() => {
        const first = linkedOrders[0];
        const multiPatient = linkedOrders.length > 1;
        return (
          <div style={{ backgroundColor: C.tealLighter, border: `1px solid ${C.teal}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.teal, display: "flex", alignItems: "center", gap: 6 }}>
                <UserCircle size={16} />
                {/* label.nce.section.patientContext */}
                Patient Context
              </h3>
              <span style={{ fontSize: 11, color: C.teal, fontStyle: "italic" }}>
                {/* label.nce.linking.patientContextHelper */}
                Auto-populated from linked order
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.teal, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                  {/* label.nce.linking.patientName */}
                  Patient Name
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.gray800 }}>
                  {multiPatient ? "(Multiple patients)" : first.patientName}
                </div>
                {!multiPatient && <div style={{ fontSize: 11, color: C.gray500 }}>ID: {first.patientId}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.teal, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3, display: "flex", alignItems: "center", gap: 4 }}>
                  <Stethoscope size={11} />
                  {/* label.nce.linking.prescriber */}
                  Prescriber
                </div>
                <div style={{ fontSize: 13, color: C.gray700 }}>Dr. M. Konan</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.teal, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3, display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={11} />
                  {/* label.nce.linking.site */}
                  Site
                </div>
                <div style={{ fontSize: 13, color: C.gray700 }}>CDI IPCI – Abidjan</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Form Actions ─── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingBottom: 40 }}>
        <button style={{ padding: "10px 20px", fontSize: 13, border: "none", backgroundColor: "transparent", cursor: "pointer", color: C.gray600, fontWeight: 500 }}>
          {/* label.button.cancel */}
          Cancel
        </button>
        <button style={{ padding: "10px 24px", fontSize: 13, border: "none", borderRadius: 4, backgroundColor: C.teal, color: C.white, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={16} />
          {/* label.nce.action.submitNce */}
          Submit NCE
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// NCE REPORTS — Printable Report Generation
// ═══════════════════════════════════════════════════════════════
const NCEReportsView = () => {
  const [reportType, setReportType] = useState("summary");
  const [dateFrom, setDateFrom] = useState("2025-12-01");
  const [dateTo, setDateTo] = useState("2026-01-07");
  const [catFilter, setCatFilter] = useState("");
  const [sevFilter, setSevFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [previewNCE, setPreviewNCE] = useState(null);

  const filtered = reportNCEs.filter(n => {
    if (catFilter && n.category !== catFilter) return false;
    if (sevFilter && n.severity !== sevFilter) return false;
    if (statusFilter && n.status !== statusFilter) return false;
    if (dateFrom && n.date < dateFrom) return false;
    if (dateTo && n.date > dateTo) return false;
    return true;
  });

  const reportTypes = [
    { key: "summary", label: "NCE Summary Report", icon: FileText, desc: "Overview of all NCEs with counts by category, severity, and status" },
    { key: "capa", label: "CAPA Effectiveness Report", icon: CheckCircle, desc: "CAPA completion rates, effectiveness reviews, overdue actions" },
    { key: "rootCause", label: "Root Cause Analysis Report", icon: TrendingUp, desc: "Root cause distribution, Pareto analysis, trends" },
    { key: "rejection", label: "Rejection & Cancellation Report", icon: XCircle, desc: "Rejection volumes by reason, trends, prompt dismissal rates" },
    { key: "individual", label: "Individual NCE Report", icon: File, desc: "Detailed printable report for a single NCE" },
  ];

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1100 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: C.gray500, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
        <span>NCE</span><ChevronRight size={12} /><span style={{ color: C.gray700, fontWeight: 500 }}>NCE Reports</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Printer size={22} color={C.teal} />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.gray900 }}>
              {/* label.nce.reports.title */}
              NCE Reports
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: C.gray500 }}>
              {/* label.nce.reports.subtitle */}
              Generate printable reports for audits, accreditation, and quality review
            </p>
          </div>
        </div>
      </div>

      {/* ─── Report Type Selector ─── */}
      <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: C.gray800 }}>
          {/* label.nce.reports.selectType */}
          Select Report Type
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {reportTypes.map(rt => (
            <div key={rt.key} onClick={() => setReportType(rt.key)}
              style={{ padding: 14, borderRadius: 8, cursor: "pointer", textAlign: "center",
                border: `2px solid ${reportType === rt.key ? C.teal : C.gray200}`,
                backgroundColor: reportType === rt.key ? C.tealLighter : C.white,
                transition: "all 0.15s",
              }}>
              <rt.icon size={20} color={reportType === rt.key ? C.teal : C.gray400} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: reportType === rt.key ? C.teal : C.gray700, marginBottom: 4 }}>{rt.label}</div>
              <div style={{ fontSize: 10, color: C.gray400, lineHeight: 1.3 }}>{rt.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: C.gray800, display: "flex", alignItems: "center", gap: 6 }}>
          <Filter size={15} />
          {/* label.nce.reports.filters */}
          Report Filters
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>
              {/* label.nce.reports.dateFrom */}
              Date From
            </label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 12, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>
              {/* label.nce.reports.dateTo */}
              Date To
            </label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 12, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>
              {/* label.nce.reports.category */}
              Category
            </label>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 12, backgroundColor: C.white }}>
              <option value="">All Categories</option>
              <option>Pre-Analytical</option><option>Analytical</option><option>Post-Analytical</option><option>Administrative</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>
              {/* label.nce.reports.severity */}
              Severity
            </label>
            <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 12, backgroundColor: C.white }}>
              <option value="">All Severities</option>
              <option value="critical">Critical</option><option value="major">Major</option><option value="minor">Minor</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray600, marginBottom: 4 }}>
              {/* label.nce.reports.status */}
              Status
            </label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray200}`, borderRadius: 4, fontSize: 12, backgroundColor: C.white }}>
              <option value="">All Statuses</option>
              {Object.entries(STAT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
          <span style={{ fontSize: 12, color: C.gray500 }}>
            {/* label.nce.reports.matchCount */}
            {filtered.length} NCE{filtered.length !== 1 ? "s" : ""} match current filters
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setCatFilter(""); setSevFilter(""); setStatusFilter(""); }}
              style={{ padding: "6px 12px", fontSize: 12, border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", color: C.gray600 }}>
              {/* label.button.clearAll */}
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* ─── Preview Table ─── */}
      <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${C.gray200}` }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.gray800 }}>
            {/* label.nce.reports.preview */}
            Report Preview
          </h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "7px 14px", fontSize: 12, border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", color: C.gray700, display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
              <FileSpreadsheet size={14} />
              {/* label.nce.reports.exportCsv */}
              Export CSV
            </button>
            <button style={{ padding: "7px 14px", fontSize: 12, border: "none", borderRadius: 4, backgroundColor: C.teal, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
              <Download size={14} />
              {/* label.nce.reports.generatePdf */}
              Generate PDF
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: C.gray50, borderBottom: `2px solid ${C.gray200}` }}>
                {["NCE Number", "Date", "Category", "Severity", "Status", "Assigned To", "Title", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: C.gray600, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((nce, i) => (
                <tr key={nce.id} style={{ borderBottom: `1px solid ${C.gray100}`, backgroundColor: i % 2 === 0 ? C.white : C.gray50 }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600, color: C.teal, fontSize: 12 }}>{nce.id}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.gray600 }}>{nce.date}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 12 }}>{nce.category}</span>
                    <div style={{ fontSize: 11, color: C.gray400 }}>{nce.subcategory}</div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <SeverityDot severity={nce.severity} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: SEV[nce.severity].text, textTransform: "capitalize" }}>{nce.severity}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge bg={STAT[nce.status]?.bg} color={STAT[nce.status]?.text}>{STAT[nce.status]?.label}</Badge>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.gray600 }}>{nce.assignedTo}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.gray700, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nce.title}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <button onClick={() => setPreviewNCE(nce)}
                      style={{ padding: "4px 8px", fontSize: 11, border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", color: C.teal, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                      <Eye size={12} />
                      {/* label.nce.reports.viewDetail */}
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: C.gray400, fontSize: 13 }}>
            {/* label.nce.reports.noResults */}
            No NCEs match the current filter criteria.
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderTop: `1px solid ${C.gray200}`, backgroundColor: C.gray50 }}>
          <span style={{ fontSize: 12, color: C.gray500 }}>
            {/* label.nce.reports.showing */}
            Showing {filtered.length} of {reportNCEs.length} NCEs
          </span>
          <span style={{ fontSize: 12, color: C.gray500 }}>
            {/* label.nce.reports.dateRangeLabel */}
            Date range: {dateFrom} to {dateTo}
          </span>
        </div>
      </div>

      {/* ─── Individual NCE Print Preview ─── */}
      {previewNCE && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 40, overflowY: "auto" }}>
          <div style={{ backgroundColor: C.white, borderRadius: 8, width: 750, maxHeight: "calc(100vh - 80px)", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: `1px solid ${C.gray200}`, position: "sticky", top: 0, backgroundColor: C.white, zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.gray900 }}>
                {/* label.nce.reports.printPreview */}
                Non-Conformity Report — Print Preview
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "7px 14px", fontSize: 12, border: "none", borderRadius: 4, backgroundColor: C.teal, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                  <Printer size={14} />
                  {/* label.button.print */}
                  Print
                </button>
                <button style={{ padding: "7px 14px", fontSize: 12, border: "none", borderRadius: 4, backgroundColor: C.blue, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                  <Download size={14} />
                  {/* label.nce.reports.downloadPdf */}
                  Download PDF
                </button>
                <button onClick={() => setPreviewNCE(null)}
                  style={{ padding: "4px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: C.gray500 }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Print-style report body */}
            <div style={{ padding: "32px 40px" }}>
              {/* Report header */}
              <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${C.gray800}` }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.gray900, letterSpacing: 0.5 }}>
                  {/* label.nce.printReport.header */}
                  NON-CONFORMITY EVENT REPORT
                </h2>
                <div style={{ fontSize: 13, color: C.gray600, marginTop: 4 }}>CDI IPCI – Abidjan</div>
                <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>
                  {/* label.nce.printReport.generatedDate */}
                  Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* NCE identification */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, marginBottom: 20 }}>
                {[
                  ["NCE Number", previewNCE.id],
                  ["Date of Event", previewNCE.date],
                  ["Reporter Name", previewNCE.assignedTo],
                  ["Reporting Unit", "CDI IPCI – Abidjan"],
                  ["Category", `${previewNCE.category} › ${previewNCE.subcategory}`],
                  ["Status", STAT[previewNCE.status]?.label],
                  ["Severity", previewNCE.severity.charAt(0).toUpperCase() + previewNCE.severity.slice(1)],
                  ["Assigned To", previewNCE.assignedTo],
                  ["Patient", previewNCE.patient],
                  ["Prescriber", "Dr. M. Konan"],
                  ["Site", "CDI IPCI – Abidjan"],
                  ["Lab Number", previewNCE.labNumber],
                ].map(([label, value], i) => (
                  <div key={label} style={{ display: "flex", padding: "8px 12px", backgroundColor: i % 2 === 0 ? C.gray50 : C.white, borderBottom: `1px solid ${C.gray100}` }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: C.gray600, width: 130, flexShrink: 0 }}>{label}:</span>
                    <span style={{ fontSize: 12, color: C.gray800 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Title & Description */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.gray800, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.gray200}`, paddingBottom: 4 }}>
                  {/* label.nce.printReport.eventDescription */}
                  Event Description
                </h4>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.gray800, marginBottom: 4 }}>{previewNCE.title}</div>
                <div style={{ fontSize: 12, color: C.gray600, lineHeight: 1.6, padding: 12, backgroundColor: C.gray50, borderRadius: 4 }}>
                  Blood specimen received for BMP showed gross hemolysis (4+ on visual scale). Potassium and LDH results would be affected. The specimen was drawn from a difficult venipuncture on the left antecubital fossa. No additional specimens were collected at time of draw.
                </div>
              </div>

              {/* Immediate Action */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.gray800, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.gray200}`, paddingBottom: 4 }}>
                  {/* label.nce.printReport.immediateAction */}
                  Immediate Action Taken
                </h4>
                <div style={{ fontSize: 12, color: C.gray600, lineHeight: 1.6, padding: 12, backgroundColor: C.gray50, borderRadius: 4 }}>
                  Contacted ordering provider to request recollection. Notified phlebotomy supervisor. Sample flagged and held per SOP.
                </div>
              </div>

              {/* Suspected Causes */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.gray800, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.gray200}`, paddingBottom: 4 }}>
                  {/* label.nce.printReport.suspectedCauses */}
                  Suspected Causes
                </h4>
                <div style={{ fontSize: 12, color: C.gray600, lineHeight: 1.6, padding: 12, backgroundColor: C.gray50, borderRadius: 4, fontStyle: "italic" }}>
                  Hemolysis likely caused by difficult venipuncture on fragile vein. Possible inadequate gauge selection.
                </div>
              </div>

              {/* Proposed Action */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.gray800, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.gray200}`, paddingBottom: 4 }}>
                  {/* label.nce.printReport.proposedAction */}
                  Proposed Action
                </h4>
                <div style={{ fontSize: 12, color: C.gray600, lineHeight: 1.6, padding: 12, backgroundColor: C.gray50, borderRadius: 4 }}>
                  Recommend phlebotomy team review of difficult venipuncture protocol and recollection from alternative site.
                </div>
              </div>

              {/* Linked Items */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.gray800, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.gray200}`, paddingBottom: 4 }}>
                  {/* label.nce.printReport.linkedItems */}
                  Linked Samples & Results
                </h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
                  <thead>
                    <tr style={{ backgroundColor: C.gray100 }}>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.gray200}` }}>Lab Number</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.gray200}` }}>Patient</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.gray200}` }}>Test</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.gray200}` }}>Result</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.gray200}` }}>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${C.gray100}` }}>
                      <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>{previewNCE.labNumber}</td>
                      <td style={{ padding: "6px 10px" }}>{previewNCE.patient}</td>
                      <td style={{ padding: "6px 10px" }}>Potassium</td>
                      <td style={{ padding: "6px 10px" }}>6.8 mmol/L</td>
                      <td style={{ padding: "6px 10px", color: C.red, fontWeight: 500 }}>Critical High</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.gray100}` }}>
                      <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>{previewNCE.labNumber}</td>
                      <td style={{ padding: "6px 10px" }}>{previewNCE.patient}</td>
                      <td style={{ padding: "6px 10px" }}>LDH</td>
                      <td style={{ padding: "6px 10px", color: C.gray400, fontStyle: "italic" }}>(cancelled)</td>
                      <td style={{ padding: "6px 10px" }}>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Investigation & Root Cause */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.gray800, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.gray200}`, paddingBottom: 4 }}>
                  {/* label.nce.printReport.investigation */}
                  Investigation & Root Cause
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, marginTop: 8 }}>
                  <div style={{ display: "flex", padding: "8px 12px", backgroundColor: C.gray50 }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: C.gray600, width: 140, flexShrink: 0 }}>Root Cause Category:</span>
                    <span style={{ fontSize: 12, color: C.gray800 }}>Specimen Issue</span>
                  </div>
                  <div style={{ display: "flex", padding: "8px 12px", backgroundColor: C.gray50 }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: C.gray600, width: 140, flexShrink: 0 }}>Investigated By:</span>
                    <span style={{ fontSize: 12, color: C.gray800 }}>J. Smith</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.gray600, lineHeight: 1.6, padding: 12, backgroundColor: C.gray50, borderRadius: 4, marginTop: 4 }}>
                  Hemolysis caused by difficult venipuncture technique. Small gauge needle used on fragile vein resulted in mechanical destruction of RBCs during collection.
                </div>
              </div>

              {/* CAPA Actions */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.gray800, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.gray200}`, paddingBottom: 4 }}>
                  {/* label.nce.printReport.capaActions */}
                  Corrective & Preventive Actions
                </h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
                  <thead>
                    <tr style={{ backgroundColor: C.gray100 }}>
                      {["#", "Type", "Description", "Assigned To", "Due Date", "Status"].map(h => (
                        <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.gray200}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${C.gray100}` }}>
                      <td style={{ padding: "6px 10px" }}>1</td>
                      <td style={{ padding: "6px 10px" }}>Corrective</td>
                      <td style={{ padding: "6px 10px" }}>Remedial phlebotomy training on difficult venipuncture technique</td>
                      <td style={{ padding: "6px 10px" }}>M. Garcia</td>
                      <td style={{ padding: "6px 10px" }}>2026-01-15</td>
                      <td style={{ padding: "6px 10px", color: C.orange, fontWeight: 500 }}>In Progress</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.gray100}` }}>
                      <td style={{ padding: "6px 10px" }}>2</td>
                      <td style={{ padding: "6px 10px" }}>Preventive</td>
                      <td style={{ padding: "6px 10px" }}>Update venipuncture SOP to include hemolysis risk assessment for difficult draws</td>
                      <td style={{ padding: "6px 10px" }}>S. Lee</td>
                      <td style={{ padding: "6px 10px" }}>2026-01-20</td>
                      <td style={{ padding: "6px 10px", color: C.blue, fontWeight: 500 }}>Pending</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Audit Timeline */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.gray800, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.gray200}`, paddingBottom: 4 }}>
                  {/* label.nce.printReport.auditTimeline */}
                  Audit Timeline
                </h4>
                <div style={{ marginTop: 8 }}>
                  {[
                    { date: "2026-01-05 08:30", action: "NCE Created", user: "A. Johnson", detail: "Triggered by sample rejection at reception (Mandatory)" },
                    { date: "2026-01-05 08:35", action: "Assigned", user: "System", detail: "Auto-assigned to J. Smith (Pre-Analytical lead)" },
                    { date: "2026-01-05 09:00", action: "Acknowledged", user: "J. Smith", detail: "" },
                    { date: "2026-01-05 14:00", action: "Investigation Started", user: "J. Smith", detail: "Root cause: Specimen Issue" },
                    { date: "2026-01-06 10:00", action: "CAPA #1 Added", user: "J. Smith", detail: "Corrective: Phlebotomy training" },
                    { date: "2026-01-06 10:05", action: "CAPA #2 Added", user: "J. Smith", detail: "Preventive: SOP update" },
                  ].map((ev, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: `1px solid ${C.gray100}`, fontSize: 12 }}>
                      <span style={{ fontFamily: "monospace", color: C.gray400, flexShrink: 0, width: 130, fontSize: 11 }}>{ev.date}</span>
                      <span style={{ fontWeight: 600, color: C.gray700, width: 150, flexShrink: 0 }}>{ev.action}</span>
                      <span style={{ color: C.teal, width: 100, flexShrink: 0 }}>{ev.user}</span>
                      <span style={{ color: C.gray500 }}>{ev.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures area */}
              <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.gray200}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                  <div>
                    <div style={{ borderBottom: `1px solid ${C.gray700}`, marginBottom: 6, height: 30 }} />
                    <div style={{ fontSize: 11, color: C.gray500 }}>
                      {/* label.nce.printReport.signatureReviewer */}
                      Reviewed By (Signature / Date)
                    </div>
                  </div>
                  <div>
                    <div style={{ borderBottom: `1px solid ${C.gray700}`, marginBottom: 6, height: 30 }} />
                    <div style={{ fontSize: 11, color: C.gray500 }}>
                      {/* label.nce.printReport.signatureQualityManager */}
                      Quality Manager (Signature / Date)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function NCEReportMockup() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState("nce-report");

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", minHeight: "100vh", backgroundColor: C.gray50, color: C.gray800 }}>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: "flex", height: "calc(100vh - 48px)" }}>
        <Sidebar isOpen={sidebarOpen} currentView={currentView} onNavigate={setCurrentView} />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {currentView === "nce-report" && <ReportNCEView />}
          {currentView === "nce-reports" && <NCEReportsView />}
          {!["nce-report", "nce-reports"].includes(currentView) && (
            <div style={{ padding: 32, textAlign: "center", color: C.gray400, fontSize: 14, marginTop: 80 }}>
              Select <strong>Report NCE</strong> to create a new NCE or <strong>NCE Reports</strong> to generate printable reports.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
