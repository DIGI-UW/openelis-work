import { useState, useCallback, useMemo } from "react";

// ---------------------------------------------------------------------------
// Preview-only: Carbon visual style approximated with inline styles.
// The real deliverable (patient-report-print-queue-mockup.jsx) uses
// @carbon/react and @carbon/icons-react for production.
// ---------------------------------------------------------------------------

const t = (key, fallback) => fallback || key;

// --- Palette (Carbon tokens) -----------------------------------------------
const C = {
  blue60: "#0f62fe",
  blue10: "#edf5ff",
  green50: "#198038",
  green10: "#defbe6",
  purple50: "#8a3ffc",
  purple10: "#f6f2ff",
  red60: "#da1e28",
  red10: "#fff1f1",
  teal50: "#009d9a",
  teal10: "#d9fbfb",
  blue50: "#4589ff",
  gray10: "#f4f4f4",
  gray20: "#e0e0e0",
  gray30: "#c6c6c6",
  gray70: "#525252",
  gray100: "#161616",
  white: "#ffffff",
  focusBlue: "#0f62fe",
};

// --- Mini design-system components -----------------------------------------

const Tag = ({ kind = "gray", children }) => {
  const styles = {
    purple: { bg: C.purple10, color: C.purple50, border: C.purple50 },
    green:  { bg: C.green10,  color: C.green50,  border: C.green50  },
    red:    { bg: C.red10,    color: C.red60,    border: C.red60    },
    blue:   { bg: C.blue10,   color: C.blue60,   border: C.blue60   },
    teal:   { bg: C.teal10,   color: C.teal50,   border: C.teal50   },
    gray:   { bg: C.gray10,   color: C.gray70,   border: C.gray30   },
  };
  const s = styles[kind] || styles.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 12,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
};

const Btn = ({ kind = "primary", size = "md", onClick, disabled, children }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "none", borderRadius: 0, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontWeight: 400, fontSize: size === "sm" ? 13 : 14,
    padding: size === "sm" ? "6px 14px" : "10px 16px",
    opacity: disabled ? 0.5 : 1, transition: "background 120ms",
  };
  const kinds = {
    primary: { background: C.blue60, color: C.white },
    secondary: { background: C.gray20, color: C.gray100 },
    ghost: { background: "transparent", color: C.blue60 },
    danger: { background: C.red60, color: C.white },
  };
  return (
    <button style={{ ...base, ...kinds[kind] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

const Notification = ({ kind, title, onClose }) => {
  const colors = {
    success: { bg: C.green10, border: C.green50, color: C.green50 },
    error:   { bg: C.red10,   border: C.red60,   color: C.red60   },
  };
  const c = colors[kind] || colors.success;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", marginBottom: 16,
      background: c.bg, borderLeft: `4px solid ${c.border}`,
    }}>
      <span style={{ color: c.color, fontWeight: 600, fontSize: 14 }}>{title}</span>
      <button onClick={onClose} style={{
        border: "none", background: "transparent", cursor: "pointer",
        fontSize: 18, color: c.color, lineHeight: 1,
      }}>×</button>
    </div>
  );
};

// --- Sample data -----------------------------------------------------------
const INITIAL_QUEUE = [
  {
    id: "1", accessionNumber: "LAB-2026-00891", patientName: "Rakoto, Jean",
    patientId: "P-10045", nationalId: "MG-123456", healthId: "UHI-78901",
    facility: "Hôpital Central Antananarivo", ward: "Médecine Interne",
    requestor: "Dr. Rabe", newResultCount: 3, validatedAt: "2026-03-18 08:42",
    printStatus: "UNPRINTED", isAmended: false, hasCriticalValue: true,
    lastPrintedAt: null, lastPrintedBy: null,
    results: [
      { test: "Hemoglobin", value: "6.2 g/dL (Critical Low)" },
      { test: "White Blood Cell Count", value: "11.4 × 10⁹/L" },
      { test: "Platelet Count", value: "145 × 10⁹/L" },
    ],
  },
  {
    id: "2", accessionNumber: "LAB-2026-00874", patientName: "Andriantsoa, Marie",
    patientId: "P-10032", nationalId: "MG-654321", healthId: "UHI-54321",
    facility: "Hôpital Central Antananarivo", ward: "Pédiatrie",
    requestor: "Dr. Rasoa", newResultCount: 1, validatedAt: "2026-03-18 07:15",
    printStatus: "UNPRINTED", isAmended: true, hasCriticalValue: false,
    lastPrintedAt: "2026-03-18 06:00", lastPrintedBy: "clerk.a",
    results: [{ test: "Malaria RDT", value: "Positive (P. falciparum)" }],
  },
  {
    id: "3", accessionNumber: "LAB-2026-00865", patientName: "Razafy, Pierre",
    patientId: "P-10021", nationalId: "MG-112233", healthId: "UHI-11223",
    facility: "Clinique Urbaine Nord", ward: "Urgences",
    requestor: "Dr. Randria", newResultCount: 5, validatedAt: "2026-03-17 14:30",
    printStatus: "PRINTED", isAmended: false, hasCriticalValue: false,
    lastPrintedAt: "2026-03-17 15:00", lastPrintedBy: "clerk.b",
    results: [
      { test: "ALT", value: "32 U/L" }, { test: "AST", value: "28 U/L" },
      { test: "Total Bilirubin", value: "0.9 mg/dL" },
      { test: "Creatinine", value: "0.8 mg/dL" }, { test: "Glucose", value: "95 mg/dL" },
    ],
  },
  {
    id: "4", accessionNumber: "LAB-2026-00901", patientName: "Rakotondrabe, Luc",
    patientId: "P-10056", nationalId: "MG-998877", healthId: "UHI-99887",
    facility: "Clinique Urbaine Nord", ward: "Chirurgie",
    requestor: "Dr. Rabe", newResultCount: 2, validatedAt: "2026-03-18 09:05",
    printStatus: "UNPRINTED", isAmended: false, hasCriticalValue: false,
    lastPrintedAt: null, lastPrintedBy: null,
    results: [
      { test: "Prothrombin Time", value: "14.2 s" }, { test: "INR", value: "1.1" },
    ],
  },
  {
    id: "5", accessionNumber: "LAB-2026-00855", patientName: "Raharinoro, Sylvie",
    patientId: "P-10011", nationalId: "MG-556677", healthId: "UHI-55667",
    facility: "Centre de Santé de Base Analamanga", ward: "Maternité",
    requestor: "Dr. Rakoto", newResultCount: 4, validatedAt: "2026-03-16 08:55",
    printStatus: "UNPRINTED", isAmended: false, hasCriticalValue: false,
    lastPrintedAt: null, lastPrintedBy: null,
    results: [
      { test: "Blood Group", value: "B+" },
      { test: "Hemoglobin (antenatal)", value: "10.8 g/dL" },
      { test: "VDRL", value: "Non-reactive" },
      { test: "HIV Rapid Test", value: "Non-reactive" },
    ],
  },
];

const FACILITIES = [
  "Hôpital Central Antananarivo",
  "Clinique Urbaine Nord",
  "Centre de Santé de Base Analamanga",
];
const WARDS_BY_FACILITY = {
  "Hôpital Central Antananarivo": ["Médecine Interne", "Pédiatrie", "Maternité", "Réanimation"],
  "Clinique Urbaine Nord": ["Urgences", "Chirurgie", "Consultation"],
  "Centre de Santé de Base Analamanga": ["Consultation Générale", "Maternité"],
};
const REQUESTORS = ["Dr. Rabe", "Dr. Rasoa", "Dr. Randria", "Dr. Rakoto"];

// --- Main component --------------------------------------------------------
export default function PatientReportPrintQueue() {
  const [facility, setFacility]     = useState("");
  const [ward, setWard]             = useState("");
  const [requestor, setRequestor]   = useState("");
  const [status, setStatus]         = useState("ALL");
  const [timeWindow, setTimeWindow] = useState("7");
  const [selected, setSelected]     = useState(new Set());
  const [notification, setNotif]    = useState(null);
  const [printing, setPrinting]     = useState(new Set());
  const [queue, setQueue]           = useState(INITIAL_QUEUE);
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(20);

  const wards = facility ? (WARDS_BY_FACILITY[facility] || []) : [];

  const filtered = useMemo(() => queue.filter(r => {
    if (facility && r.facility !== facility) return false;
    if (ward && r.ward !== ward) return false;
    if (requestor && r.requestor !== requestor) return false;
    if (status === "UNPRINTED" && r.printStatus !== "UNPRINTED") return false;
    if (status === "PRINTED"   && r.printStatus !== "PRINTED")   return false;
    return true;
  }), [queue, facility, ward, requestor, status]);

  const paginated = useMemo(() => {
    const s = (page - 1) * pageSize;
    return filtered.slice(s, s + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const allSelected = paginated.length > 0 && paginated.every(r => selected.has(r.id));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) paginated.forEach(r => next.delete(r.id));
    else paginated.forEach(r => next.add(r.id));
    setSelected(next);
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const clearFilters = () => {
    setFacility(""); setWard(""); setRequestor(""); setStatus("ALL");
    setSelected(new Set());
  };

  const doPrint = useCallback(async (ids) => {
    setPrinting(new Set(ids));
    await new Promise(r => setTimeout(r, 1200));
    setPrinting(new Set());
    setQueue(prev => prev.map(r => ids.includes(r.id) ? {
      ...r, printStatus: "PRINTED", isAmended: false,
      lastPrintedAt: "2026-03-18 10:04", lastPrintedBy: "current.user",
    } : r));
    setSelected(new Set());
    setNotif({ kind: "success", title: t("message.printQueue.printSuccess", `${ids.length} report(s) generated and marked as printed.`) });
    setTimeout(() => setNotif(null), 5000);
  }, []);

  const selectedInView = paginated.filter(r => selected.has(r.id)).map(r => r.id);
  const batchActive = selected.size > 0;

  // Table header style
  const th = {
    background: C.gray10, padding: "10px 12px", fontWeight: 600,
    fontSize: 12, color: C.gray100, textAlign: "left",
    borderBottom: `2px solid ${C.gray20}`, whiteSpace: "nowrap",
  };
  const td = {
    padding: "10px 12px", fontSize: 13, color: C.gray100,
    borderBottom: `1px solid ${C.gray20}`, verticalAlign: "middle",
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", color: C.gray100, fontSize: 14, background: C.white, minHeight: "100vh" }}>

      {/* Shell header */}
      <div style={{ background: C.gray100, color: C.white, padding: "0 24px", height: 48, display: "flex", alignItems: "center", gap: 24 }}>
        <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: 0.5 }}>OpenELIS Global</span>
        <span style={{ opacity: 0.4, fontSize: 20 }}>|</span>
        {["Home","Orders","Results","Reports","Admin"].map(item => (
          <span key={item} style={{
            fontSize: 13, cursor: "pointer", padding: "4px 0",
            color: item === "Reports" ? C.white : "rgba(255,255,255,0.7)",
            borderBottom: item === "Reports" ? `2px solid ${C.blue60}` : "none",
          }}>{item}</span>
        ))}
      </div>

      {/* Left nav + content */}
      <div style={{ display: "flex" }}>

        {/* Side nav */}
        <div style={{ width: 200, background: C.gray10, borderRight: `1px solid ${C.gray20}`, padding: "16px 0", flexShrink: 0, minHeight: "calc(100vh - 48px)" }}>
          {[
            { label: "Patient Status Report", active: false },
            { label: "Print Queue", active: true },
            { label: "Report by Lab Number", active: false },
            { label: "Report by Site", active: false },
          ].map(item => (
            <div key={item.label} style={{
              padding: "10px 16px", fontSize: 13, cursor: "pointer",
              background: item.active ? C.blue60 : "transparent",
              color: item.active ? C.white : C.gray100,
              borderLeft: item.active ? `4px solid #0043ce` : "4px solid transparent",
              fontWeight: item.active ? 600 : 400,
            }}>{item.label}</div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: C.blue60, marginBottom: 8 }}>
            <span style={{ cursor: "pointer" }}>Reports</span>
            <span style={{ color: C.gray70, margin: "0 6px" }}>/</span>
            <span style={{ color: C.gray70 }}>Patient Report Print Queue</span>
          </div>

          {/* Page title */}
          <h1 style={{ fontSize: 28, fontWeight: 300, color: C.gray100, margin: "0 0 24px 0" }}>
            {t("heading.printQueue.title", "Patient Report Print Queue")}
          </h1>

          {/* Notification */}
          {notification && (
            <Notification kind={notification.kind} title={notification.title}
              onClose={() => setNotif(null)} />
          )}

          {/* Filter bar */}
          <div style={{ background: C.gray10, border: `1px solid ${C.gray20}`, padding: "16px", marginBottom: 0, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>

            {/* Facility */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.gray70 }}>
                {t("label.printQueue.facility", "Facility")}
              </label>
              <select value={facility} onChange={e => { setFacility(e.target.value); setWard(""); }}
                style={{ padding: "7px 10px", border: `1px solid ${C.gray30}`, background: C.white, fontSize: 13, color: C.gray100 }}>
                <option value="">All Facilities</option>
                {FACILITIES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>

            {/* Ward */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: facility ? C.gray70 : C.gray30 }}>
                {t("label.printQueue.ward", "Ward / Dept / Unit")}
              </label>
              <select value={ward} onChange={e => setWard(e.target.value)} disabled={!facility}
                style={{ padding: "7px 10px", border: `1px solid ${C.gray30}`, background: facility ? C.white : C.gray10, fontSize: 13, color: C.gray100, opacity: facility ? 1 : 0.5 }}>
                <option value="">All Wards</option>
                {wards.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>

            {/* Requestor */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 150 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.gray70 }}>
                {t("label.printQueue.requestor", "Requestor")}
              </label>
              <select value={requestor} onChange={e => setRequestor(e.target.value)}
                style={{ padding: "7px 10px", border: `1px solid ${C.gray30}`, background: C.white, fontSize: 13, color: C.gray100 }}>
                <option value="">All Requestors</option>
                {REQUESTORS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Print Status */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.gray70 }}>
                {t("label.printQueue.statusFilter", "Print Status")}
              </label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{ padding: "7px 10px", border: `1px solid ${C.gray30}`, background: C.white, fontSize: 13, color: C.gray100 }}>
                <option value="ALL">All</option>
                <option value="UNPRINTED">Unprinted</option>
                <option value="PRINTED">Printed</option>
              </select>
            </div>

            {/* Time Window */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.gray70 }}>
                {t("label.printQueue.timeWindow", "Time Window")}
              </label>
              <select value={timeWindow} onChange={e => setTimeWindow(e.target.value)}
                style={{ padding: "7px 10px", border: `1px solid ${C.gray30}`, background: C.white, fontSize: 13, color: C.gray100 }}>
                <option value="1">Last 24 Hours</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="-1">All Time</option>
              </select>
            </div>

            <Btn kind="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Btn>
          </div>

          {/* Table container */}
          <div style={{ border: `1px solid ${C.gray20}`, borderTop: "none" }}>

            {/* Toolbar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", background: batchActive ? C.blue60 : C.white,
              borderBottom: `1px solid ${C.gray20}`, minHeight: 48,
              transition: "background 200ms",
            }}>
              {batchActive ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ color: C.white, fontSize: 13 }}>
                    {selected.size} item{selected.size > 1 ? "s" : ""} selected
                  </span>
                  <button
                    onClick={() => doPrint([...selected])}
                    style={{
                      background: C.white, color: C.blue60, border: "none",
                      padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                    🖨 {t("button.printQueue.printSelected", `Print Selected (${selected.size})`)}
                  </button>
                  <button onClick={() => setSelected(new Set())}
                    style={{ background: "transparent", color: C.white, border: "none", cursor: "pointer", fontSize: 13 }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {t("heading.printQueue.queueTable", "Print Queue")}
                  </span>
                  <span style={{ color: C.gray70, fontSize: 12 }}>
                    ({filtered.length} {filtered.length === 1 ? "result" : "results"})
                  </span>
                </div>
              )}
              {!batchActive && (
                <Btn kind="ghost" size="sm">
                  🔍 {t("button.printQueue.search", "Search Patient / Accession")}
                </Btn>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: 40 }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        style={{ cursor: "pointer" }} />
                    </th>
                    <th style={th}>Accession Number</th>
                    <th style={th}>Patient Name</th>
                    <th style={th}>Facility</th>
                    <th style={th}>Ward / Dept / Unit</th>
                    <th style={th}>Requestor</th>
                    <th style={th}>Validated At</th>
                    <th style={th}>Status</th>
                    <th style={{ ...th, width: 160 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ ...td, textAlign: "center", padding: "48px 16px", color: C.gray70 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {t("message.printQueue.empty", "No reports in queue")}
                        </div>
                        <div style={{ fontSize: 12 }}>
                          {t("message.printQueue.emptySubtext", "All reports have been printed, or no results have been validated in the selected time window.")}
                        </div>
                      </td>
                    </tr>
                  )}

                  {paginated.map(row => {
                    const isPrinting = printing.has(row.id);
                    const rowBg = selected.has(row.id) ? C.blue10 : C.white;

                    return (
                      <tr key={row.id} style={{ background: rowBg }}>
                        <td style={{ ...td, width: 40 }}>
                          <input type="checkbox" checked={selected.has(row.id)}
                            onChange={() => toggleOne(row.id)} style={{ cursor: "pointer" }} />
                        </td>
                        <td style={{ ...td, fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: C.blue60, whiteSpace: "nowrap" }}>
                          {row.accessionNumber}
                        </td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>{row.patientName}</td>
                        <td style={{ ...td, fontSize: 12, color: C.gray70 }}>{row.facility}</td>
                        <td style={{ ...td, fontSize: 12 }}>{row.ward}</td>
                        <td style={{ ...td, fontSize: 12 }}>{row.requestor}</td>
                        <td style={{ ...td, fontSize: 12, whiteSpace: "nowrap" }}>{row.validatedAt}</td>
                        <td style={{ ...td }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <Tag kind={row.printStatus === "UNPRINTED" ? "purple" : "green"}>
                              {row.printStatus === "UNPRINTED" ? "Unprinted" : "Printed"}
                            </Tag>
                            {row.isAmended && <Tag kind="blue">Amended</Tag>}
                            {row.hasCriticalValue && <Tag kind="red">⚠ Critical</Tag>}
                          </div>
                        </td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>
                          <Btn kind="primary" size="sm" disabled={isPrinting}
                            onClick={() => doPrint([row.id])}>
                            {isPrinting ? "Printing…" : "🖨 Print"}
                          </Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderTop: `1px solid ${C.gray20}`, background: C.white,
              fontSize: 13,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: C.gray70 }}>Items per page:</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ padding: "4px 8px", border: `1px solid ${C.gray30}`, fontSize: 13 }}>
                  {[10, 20, 50, 100].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: C.gray70, marginRight: 12 }}>
                  {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </span>
                <Btn kind="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</Btn>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{
                    padding: "5px 10px", border: "none", cursor: "pointer", fontSize: 13,
                    background: p === page ? C.blue60 : "transparent",
                    color: p === page ? C.white : C.gray100,
                    fontWeight: p === page ? 600 : 400,
                  }}>{p}</button>
                ))}
                <Btn kind="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next ›</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
