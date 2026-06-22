import { useState } from "react";
import {
  Menu, Search, Bell, HelpCircle, User, ChevronRight, ChevronDown,
  Home, ClipboardList, FileBarChart, Users, Package, Shield, BarChart3,
  Settings, AlertTriangle, Plus, Clock, CheckCircle, XCircle,
  Calendar, Paperclip, MessageSquare, FileText, History, Link2,
  FlaskConical, TrendingUp, AlertCircle, X, Check, RefreshCw,
  Building, ChevronUp
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

// ─── Severity/Status configs ───
const SEV = {
  critical: { bg: "#fdecea", text: "#b71c1c", dot: "#d32f2f", border: "#ef9a9a" },
  major:    { bg: "#fff3e0", text: "#e65100", dot: "#e65100", border: "#ffcc80" },
  minor:    { bg: "#fffde7", text: "#f57f17", dot: "#f57f17", border: "#fff176" },
};
const STAT = {
  open:                 { label: "Open",                      bg: C.blueBg,   text: C.blue },
  acknowledged:         { label: "Acknowledged",              bg: C.purpleBg, text: C.purple },
  under_investigation:  { label: "Under Investigation",       bg: "#e8eaf6",  text: "#283593" },
  corrective_action:    { label: "Corrective Action",         bg: C.orangeBg, text: C.orange },
  closed_pending:       { label: "Closed – Pending Verification", bg: C.tealLight, text: C.teal },
  closed_verified:      { label: "Closed – Verified",         bg: C.greenBg,  text: C.green },
};

// ─── Sample NCE data ───
const NCES = [
  {
    id: "NCE-20260105-0023", title: "Critical potassium – verify sample integrity",
    category: "Pre-Analytical", subcategory: "Specimen Integrity", severity: "critical",
    status: "open", assignedTo: "J. Smith", reportedBy: "A. Johnson",
    occurrenceDate: "2026-01-05 08:30", age: "2 days", overdue: true,
    description: "Blood specimen received for BMP showed gross hemolysis (4+ on visual scale). Potassium and LDH results would be affected.",
    immediateAction: "Contacted ordering provider to request recollection. Notified phlebotomy supervisor.",
    triggerSource: "Sample rejection at reception (Mandatory)",
    linkedSamples: [{ labNumber: "DEV01260000000456", tests: "BMP, CBC, Lipid Panel" }],
    linkedResults: [{ test: "Potassium", value: "6.8 mmol/L", flag: "Critical High" }, { test: "LDH", value: "(cancelled)", flag: null }],
    notes: 3, attachments: 1, capas: [],
  },
  {
    id: "NCE-20260104-0019", title: "Delta check exceeded for Hemoglobin",
    category: "Analytical", subcategory: "Result Discrepancy", severity: "major",
    status: "under_investigation", assignedTo: "M. Johnson", reportedBy: "K. Williams",
    occurrenceDate: "2026-01-04 14:15", age: "3 days", overdue: false,
    description: "Hemoglobin result 7.2 g/dL flagged by delta check. Previous result 14.1 g/dL (12/28). Change of -48.9% exceeds threshold of 20%.",
    immediateAction: "Result held. Recollection requested to verify.",
    triggerSource: "Results Entry (Prompted – delta check)",
    linkedSamples: [{ labNumber: "DEV01260000000389", tests: "CBC" }],
    linkedResults: [{ test: "Hemoglobin", value: "7.2 g/dL", flag: "Delta Check" }],
    notes: 5, attachments: 0,
    rootCause: "Specimen Issue", rootCauseDetails: "Sample was drawn from IV arm. Dilutional effect confirmed.",
    capas: [
      { id: 1, type: "Corrective", cat: "Training", desc: "Remedial phlebotomy training on IV arm avoidance", to: "M. Garcia", due: "2026-01-15", status: "in_progress" },
      { id: 2, type: "Preventive", cat: "Process Change", desc: "Add IV arm check to specimen collection checklist", to: "S. Lee", due: "2026-01-20", status: "pending" },
    ],
  },
  {
    id: "NCE-20260103-0015", title: "Missing patient label on morning batch",
    category: "Pre-Analytical", subcategory: "Specimen Labeling", severity: "minor",
    status: "corrective_action", assignedTo: "K. Williams", reportedBy: "J. Smith",
    occurrenceDate: "2026-01-03 07:00", age: "4 days", overdue: false,
    description: "One tube in morning batch was missing patient DOB on label. All other identifiers present.",
    immediateAction: "Patient identity verified by second identifier (MRN). Label corrected.",
    triggerSource: "Sample reception (Mandatory)",
    linkedSamples: [{ labNumber: "DEV01260000000301", tests: "TSH" }],
    linkedResults: [], notes: 2, attachments: 1,
    rootCause: "Human Error", rootCauseDetails: "Phlebotomist in training did not follow labeling SOP.",
    capas: [
      { id: 3, type: "Both", cat: "Training", desc: "Competency reassessment for labeling procedure", to: "M. Garcia", due: "2026-01-10", status: "completed", resolution: "Completed 1:1 training." },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// REUSABLE BITS
// ═══════════════════════════════════════════════════════════════
const Badge = ({ children, bg, color }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: bg, color }}>{children}</span>
);
const SevBadge = ({ s }) => {
  const c = SEV[s]; return <Badge bg={c.bg} color={c.text}><span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: c.dot }} />{s[0].toUpperCase() + s.slice(1)}</Badge>;
};
const StatBadge = ({ s }) => { const c = STAT[s] || { label: s, bg: "#eee", text: "#333" }; return <Badge bg={c.bg} color={c.text}>{c.label}</Badge>; };

const SummaryCard = ({ label, count, bg, color, Icon, pulse }) => (
  <div style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid " + color + "33", backgroundColor: bg, animation: pulse ? "pulse 2s infinite" : undefined }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
      <Icon size={14} style={{ color }} /><span style={{ fontSize: 11, fontWeight: 600, color, opacity: 0.8 }}>{label}</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{count}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// OPENELIS HEADER
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
// SIDEBAR  (NCE is a top-level menu with submenus)
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
      { id: "nce-my",       label: "My Assignments" },
      { id: "nce-all",      label: "All NCEs" },
      { id: "nce-pending",  label: "Pending Verification" },
      { id: "nce-report",   label: "Report NCE" },
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
// CAPA ROW
// ═══════════════════════════════════════════════════════════════
const CAPARow = ({ c }) => (
  <div style={{ display: "flex", gap: 10, padding: 10, border: `1px solid ${C.gray200}`, borderRadius: 6, backgroundColor: C.white }}>
    <div style={{ marginTop: 3 }}>
      {c.status === "completed" ? <CheckCircle size={16} color={C.green} /> : c.status === "in_progress" ? <Clock size={16} color={C.blue} /> : <AlertCircle size={16} color={C.gray400} />}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
        <Badge bg={c.type === "Corrective" ? C.blueBg : c.type === "Preventive" ? C.purpleBg : "#e8eaf6"} color={c.type === "Corrective" ? C.blue : c.type === "Preventive" ? C.purple : "#283593"}>{c.type}</Badge>
        <span style={{ color: C.gray500 }}>{c.cat}</span>
      </div>
      <div style={{ fontSize: 13, marginTop: 4 }}>{c.desc}</div>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.gray500, marginTop: 4 }}>
        <span>Assigned: {c.to}</span><span>Due: {c.due}</span>
        <span style={{ fontWeight: 600, color: c.status === "completed" ? C.green : c.status === "in_progress" ? C.blue : C.gray500 }}>{c.status.replace("_", " ")}</span>
      </div>
      {c.resolution && <div style={{ marginTop: 4, fontSize: 11, backgroundColor: C.greenBg, color: C.green, padding: "4px 8px", borderRadius: 4 }}>Resolution: {c.resolution}</div>}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// NCE ROW (Expandable)
// ═══════════════════════════════════════════════════════════════
const NCERow = ({ nce, expanded, onToggle, selected, onSelect }) => {
  const [tab, setTab] = useState("details");
  const sc = SEV[nce.severity];
  return (
    <div style={{ border: `1px solid ${expanded ? sc.border : C.gray200}`, borderRadius: 8, backgroundColor: C.white, marginBottom: 8 }}>
      {/* Collapsed */}
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }}>
        <input type="checkbox" checked={selected} onChange={e => { e.stopPropagation(); onSelect(); }} />
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: sc.dot, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: C.gray500 }}>{nce.id}</span>
            <StatBadge s={nce.status} />
            {nce.overdue && <span style={{ fontSize: 11, color: C.red, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><Clock size={12} /> Overdue</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nce.title}</div>
          <div style={{ fontSize: 11, color: C.gray500, marginTop: 1 }}>{nce.category} › {nce.subcategory} · Assigned: {nce.assignedTo}</div>
        </div>
        <span style={{ fontSize: 11, color: C.gray400, flexShrink: 0 }}>{nce.age}</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.gray200}`, padding: 16 }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.gray200}`, marginBottom: 16 }}>
            {[["details","Event Details"],["investigation","Investigation"],["capa",`CAPA (${nce.capas?.length||0})`],["history","History"]].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", fontSize: 13, fontWeight: tab === k ? 600 : 400, border: "none", borderBottom: tab === k ? `2px solid ${C.teal}` : "2px solid transparent", backgroundColor: "transparent", color: tab === k ? C.teal : C.gray500, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          {tab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: C.gray500, marginBottom: 4 }}>Description</div><div style={{ fontSize: 13, backgroundColor: C.gray50, borderRadius: 6, padding: 10 }}>{nce.description}</div></div>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: C.gray500, marginBottom: 4 }}>Immediate Action</div><div style={{ fontSize: 13, backgroundColor: C.gray50, borderRadius: 6, padding: 10 }}>{nce.immediateAction}</div></div>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: C.gray500, marginBottom: 4 }}>Trigger</div><div style={{ fontSize: 13 }}>{nce.triggerSource}</div></div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.gray500, marginBottom: 4 }}>Linked Items</div>
                {nce.linkedSamples.map((s,i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 4 }}><FlaskConical size={14} color={C.teal} />Sample: {s.labNumber} ({s.tests})</div>)}
                {nce.linkedResults.map((r,i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 4 }}><BarChart3 size={14} color={C.blue} />Result: {r.test} — {r.value} {r.flag && <span style={{ color: C.red, fontSize: 11 }}>⚠️ {r.flag}</span>}</div>)}
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.gray500 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MessageSquare size={12} />{nce.notes} notes</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Paperclip size={12} />{nce.attachments} attachments</span>
              </div>
            </div>
          )}

          {tab === "investigation" && (
            <div>{nce.rootCause ? (
              <><div style={{ fontSize: 11, fontWeight: 600, color: C.gray500, marginBottom: 4 }}>Root Cause</div><div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{nce.rootCause}</div><div style={{ fontSize: 13, backgroundColor: C.gray50, borderRadius: 6, padding: 10 }}>{nce.rootCauseDetails}</div></>
            ) : <div style={{ fontSize: 13, color: C.gray500, fontStyle: "italic" }}>Investigation has not started yet.</div>}</div>
          )}

          {tab === "capa" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(nce.capas||[]).length > 0 ? nce.capas.map(c => <CAPARow key={c.id} c={c} />) : <div style={{ fontSize: 13, color: C.gray500, fontStyle: "italic" }}>No CAPA actions added yet.</div>}
              <button style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.teal, background: "none", border: "none", cursor: "pointer", padding: 0 }}><Plus size={14} /> Add CAPA</button>
            </div>
          )}

          {tab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              {[["A. Johnson","created this NCE","2 days ago",C.blue],["J. Smith","was assigned","2 days ago",C.purple],["J. Smith","added a note","1 day ago",C.gray400]].map(([who,what,when,dot],i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot, marginTop: 5, flexShrink: 0 }} />
                  <span><strong>{who}</strong> {what} <span style={{ color: C.gray400 }}>· {when}</span></span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, paddingTop: 12, marginTop: 12, borderTop: `1px solid ${C.gray200}` }}>
            {nce.status === "open" && <button style={{ padding: "6px 14px", fontSize: 13, backgroundColor: C.teal, color: C.white, border: "none", borderRadius: 4, cursor: "pointer" }}>Acknowledge</button>}
            {nce.status === "acknowledged" && <button style={{ padding: "6px 14px", fontSize: 13, backgroundColor: C.teal, color: C.white, border: "none", borderRadius: 4, cursor: "pointer" }}>Begin Investigation</button>}
            <button style={{ padding: "6px 14px", fontSize: 13, border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><User size={14} /> Assign To</button>
            <button style={{ padding: "6px 14px", fontSize: 13, border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><MessageSquare size={14} /> Add Note</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function NCEDashboardApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState("nce-my");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const toggleSelect = (id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // Filter NCEs based on active sidebar view
  const filteredNCEs = NCES.filter(nce => {
    if (currentView === "nce-my") return nce.assignedTo === "J. Smith"; // simulated current user
    if (currentView === "nce-pending") return nce.status === "closed_pending";
    return true; // nce-all shows everything
  });

  const viewTitles = {
    "nce-my": "My Assignments", "nce-all": "All NCEs",
    "nce-pending": "Pending Verification", "nce-report": "Report NCE",
    "nce-analytics": "Analytics",
  };

  const s = (k) => ({ display: "flex", alignItems: "center", gap: k });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", fontSize: 14, color: C.gray800 }}>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar isOpen={sidebarOpen} currentView={currentView} onNavigate={setCurrentView} />

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto", backgroundColor: C.gray100, padding: 24 }}>
          {/* Breadcrumb */}
          {currentView.startsWith("nce-") && (
            <div style={{ fontSize: 12, color: C.gray500, marginBottom: 4, ...s(4) }}>
              <span>NCE</span><ChevronRight size={12} /><span style={{ color: C.gray700 }}>{viewTitles[currentView]}</span>
            </div>
          )}

          {/* Page Header */}
          {currentView.startsWith("nce-") && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, ...s(8) }}>
                <AlertTriangle size={22} color={C.orange} /> {viewTitles[currentView]}
              </h1>
              <p style={{ fontSize: 13, color: C.gray500, margin: "4px 0 0" }}>
                {currentView === "nce-my" && "NCEs assigned to you"}
                {currentView === "nce-all" && "All open NCEs across the laboratory"}
                {currentView === "nce-pending" && "Closed NCEs awaiting effectiveness review"}
                {currentView === "nce-report" && "Create a new non-conformity event"}
                {currentView === "nce-analytics" && "Quality metrics and trend analysis"}
              </p>
            </div>
            {(currentView === "nce-my" || currentView === "nce-all" || currentView === "nce-pending") && (
              <button onClick={() => setCurrentView("nce-report")} style={{ padding: "8px 16px", backgroundColor: C.teal, color: C.white, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, ...s(6) }}>
                <Plus size={16} /> Report NCE
              </button>
            )}
          </div>
          )}

          {/* ── Report NCE placeholder ── */}
          {currentView === "nce-report" && (
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 32, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: C.orangeBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <AlertTriangle size={28} color={C.orange} />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>Report Non-Conformity Event</h2>
              <p style={{ fontSize: 13, color: C.gray500, maxWidth: 480, margin: "0 auto 20px" }}>
                The NCE creation form with hierarchical order/sample/result linking is demonstrated in the companion mockup.
              </p>
              <div style={{ display: "inline-block", backgroundColor: C.amberBg, border: `1px solid #fff176`, borderRadius: 6, padding: "10px 20px", fontSize: 13 }}>
                <strong>See mockup:</strong> <code style={{ backgroundColor: C.gray100, padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>nce-modal-linking.jsx</code>
              </div>
              <p style={{ fontSize: 12, color: C.gray400, marginTop: 12 }}>
                That mockup covers: typeahead search by Lab #/Patient ID/Name, hierarchical Order → Sample Item → Result tree with multi-select, multiple order support, and severity/category classification.
              </p>
            </div>
          )}

          {/* ── Analytics placeholder ── */}
          {currentView === "nce-analytics" && (
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 32, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: C.tealLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <BarChart3 size={28} color={C.teal} />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>NCE Analytics</h2>
              <p style={{ fontSize: 13, color: C.gray500, maxWidth: 480, margin: "0 auto 20px" }}>
                The full analytics dashboard with KPI cards, trend charts, root cause Pareto, and rejection reason breakdowns is demonstrated in the companion mockup.
              </p>
              <div style={{ display: "inline-block", backgroundColor: C.tealLight, border: `1px solid ${C.teal}33`, borderRadius: 6, padding: "10px 20px", fontSize: 13 }}>
                <strong>See mockup:</strong> <code style={{ backgroundColor: C.gray100, padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>nce-analytics.jsx</code>
              </div>
              <p style={{ fontSize: 12, color: C.gray400, marginTop: 12 }}>
                That mockup covers: Total NCEs, Avg Resolution, CAPA Effectiveness %, Recurrence Rate, trend line, category/severity/trigger charts, root cause Pareto, top rejection reasons, CAPA completion, and department breakdown.
              </p>
            </div>
          )}

          {/* ── NCE list views (My Assignments / All NCEs / Pending Verification) ── */}
          {(currentView === "nce-my" || currentView === "nce-all" || currentView === "nce-pending") && (<>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
              <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.gray400 }} />
              <input placeholder="Search NCEs…" style={{ width: "100%", padding: "8px 12px 8px 34px", border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 13, backgroundColor: C.white }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 13, backgroundColor: C.white }}>
              <option value="all">All Status</option><option value="open">Open</option><option value="acknowledged">Acknowledged</option>
              <option value="under_investigation">Under Investigation</option><option value="corrective_action">Corrective Action</option>
              {currentView === "nce-pending" && <option value="closed_pending">Closed – Pending Verification</option>}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: "8px 12px", border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 13, backgroundColor: C.white }}>
              <option value="all">All Categories</option><option value="pre">Pre-Analytical</option><option value="analytical">Analytical</option>
              <option value="post">Post-Analytical</option><option value="admin">Administrative</option>
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ padding: "8px 12px", border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 13, backgroundColor: C.white }}>
              <option value="all">All Severities</option><option value="critical">Critical</option><option value="major">Major</option><option value="minor">Minor</option>
            </select>
            <button style={{ fontSize: 12, color: C.teal, background: "none", border: "none", cursor: "pointer" }}>Clear All</button>
          </div>

          {/* View-specific info banner */}
          {currentView === "nce-my" && (
            <div style={{ backgroundColor: C.blueBg, border: `1px solid #90caf9`, borderRadius: 6, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: C.blue, display: "flex", alignItems: "center", gap: 6 }}>
              <User size={14} /> Showing NCEs assigned to <strong>admin</strong>
            </div>
          )}
          {currentView === "nce-pending" && (
            <div style={{ backgroundColor: C.tealLight, border: `1px solid ${C.teal}33`, borderRadius: 6, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: C.teal, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle size={14} /> Showing closed NCEs awaiting effectiveness review
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <SummaryCard label="Critical" count={currentView === "nce-pending" ? 0 : 2} bg={C.redBg} color={C.red} Icon={AlertTriangle} />
            <SummaryCard label="Major" count={currentView === "nce-pending" ? 3 : 8} bg={C.orangeBg} color={C.orange} Icon={AlertCircle} />
            <SummaryCard label="Minor" count={currentView === "nce-pending" ? 5 : 15} bg={C.amberBg} color={C.amber} Icon={FileText} />
            <SummaryCard label="Overdue" count={currentView === "nce-pending" ? 1 : 3} bg={C.redBg} color={C.red} Icon={Clock} pulse />
          </div>

          {/* Batch Actions */}
          {selectedIds.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, backgroundColor: C.tealLight, border: `1px solid ${C.teal}33`, borderRadius: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>{selectedIds.length} selected</span>
              <button style={{ padding: "4px 12px", fontSize: 12, backgroundColor: C.teal, color: C.white, border: "none", borderRadius: 4, cursor: "pointer" }}>Acknowledge</button>
              <button style={{ padding: "4px 12px", fontSize: 12, border: `1px solid ${C.teal}`, color: C.teal, borderRadius: 4, backgroundColor: C.white, cursor: "pointer" }}>Assign To</button>
            </div>
          )}

          {/* NCE List */}
          {filteredNCEs.map(nce => (
            <NCERow key={nce.id} nce={nce}
              expanded={expandedId === nce.id} onToggle={() => setExpandedId(expandedId === nce.id ? null : nce.id)}
              selected={selectedIds.includes(nce.id)} onSelect={() => toggleSelect(nce.id)} />
          ))}

          {filteredNCEs.length === 0 && (
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 32, textAlign: "center", color: C.gray500, fontSize: 13 }}>
              No NCEs found for this view. Adjust filters or switch views.
            </div>
          )}

          {/* Pagination */}
          {filteredNCEs.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 12, color: C.gray500 }}>
              <span>Showing 1–{filteredNCEs.length} of {filteredNCEs.length}</span>
              <div style={{ ...s(4) }}>
                <select style={{ border: `1px solid ${C.gray300}`, borderRadius: 4, padding: "4px 8px", fontSize: 12 }}><option>25 per page</option><option>50 per page</option></select>
                <button style={{ padding: "4px 10px", border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", fontSize: 12 }}>« Prev</button>
                <button style={{ padding: "4px 10px", border: "none", borderRadius: 4, backgroundColor: C.teal, color: C.white, cursor: "pointer", fontSize: 12 }}>1</button>
                <button style={{ padding: "4px 10px", border: `1px solid ${C.gray300}`, borderRadius: 4, backgroundColor: C.white, cursor: "pointer", fontSize: 12 }}>Next »</button>
              </div>
            </div>
          )}

          </>)}

          {/* ── Non-NCE menu items: placeholder ── */}
          {!currentView.startsWith("nce-") && (
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 32, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: C.gray100, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <FileBarChart size={28} color={C.gray400} />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: C.gray700 }}>{currentView.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</h2>
              <p style={{ fontSize: 13, color: C.gray500, maxWidth: 480, margin: "0 auto 16px" }}>
                This page is outside the scope of the NCE mockup. The sidebar is shown to demonstrate how NCE fits within the full OpenELIS navigation.
              </p>
              <div style={{ display: "inline-block", backgroundColor: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 6, padding: "8px 16px", fontSize: 12, color: C.gray500 }}>
                Use the <strong>NCE</strong> menu on the left to explore the NCE module views.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
