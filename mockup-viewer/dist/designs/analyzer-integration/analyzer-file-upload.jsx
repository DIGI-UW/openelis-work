// Analyzer File Upload + Review — Interactive Mockup v3.1
// Demonstrates slot-based plugin preview system in BOTH contexts:
//   1. Upload Mode: Results → Upload Analyzer File (manual upload, pre-submission)
//   2. Review Mode: Results → Analyzer Results (backend-imported, post-import review)
// The same custom preview component renders in both contexts with different actions.
// Toggle between modes via the header switcher.
// Jira: OGC-324
// All labels reference localization keys (documented in FRS v3.0)

import React, { useState } from "react";

// ─── Color System ────────────────────────────────────────────────────────────

const C = {
  pass: "#198038", warn: "#936a00", fail: "#da1e28",
  passBg: "#defbe6", warnBg: "#fcf4d6", failBg: "#fff1f1",
  blue: "#0f62fe", blueBg: "#edf5ff", blueDark: "#0043ce",
  teal: "#005d5d", tealBg: "#d9fbfb",
  purple: "#491d8b", purpleBg: "#e8daff",
  gray50: "#f4f4f4", gray70: "#525252", gray80: "#393939", gray90: "#262626", gray100: "#161616",
  border: "#e0e0e0", white: "#fff",
};

function statusColor(s) { return s === "pass" ? C.pass : s === "warn" ? C.warn : C.fail; }
function statusBg(s) { return s === "pass" ? C.passBg : s === "warn" ? C.warnBg : C.failBg; }

function getQcStatus(val, t) {
  if (val >= t.pass) return "pass";
  if (val >= t.warn) return "warn";
  return "fail";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const ANALYZERS = [
  { id: "tbprofiler", name: "MinION + TB-Profiler", protocol: "Pipeline Import", badge: "pipeline", ext: ".json,.csv,.txt", plugin: "TB-Profiler JSON Parser v1.0", serial: "MN42781", hasCustomPreview: true },
  { id: "quantstudio", name: "QuantStudio 7 Flex", protocol: "File Import", badge: "file", ext: ".csv,.tsv", plugin: "QuantStudio CSV Parser v1.0", serial: "QS7-2024-001", hasCustomPreview: false },
];

const QC = { num_reads: 312456, pct_mapped: 95.4, median_depth: 87, cov30x: 96.2, mean_len: 4523, n50: 6234 };

const TARGETS = [
  ["rpoB", 112, 100], ["katG", 95, 100], ["inhA promoter", 78, 100], ["embB", 103, 100],
  ["pncA", 45, 98.5], ["gyrA", 91, 100], ["gyrB", 88, 100], ["rrs", 156, 100],
  ["rrl", 143, 100], ["eis promoter", 67, 99.2], ["Rv0678", 54, 97.8], ["rplC", 82, 100], ["pepQ", 71, 100],
];

const DRUGS = [
  { drug: "Rifampicin", code: "RIF", s: "R", g: "First-Line", muts: [{ gene: "rpoB", ch: "S450L", fr: 98, dp: 112, who: "Assoc w R" }] },
  { drug: "Isoniazid", code: "INH", s: "R", g: "First-Line", muts: [{ gene: "katG", ch: "S315T", fr: 97, dp: 95, who: "Assoc w R" }] },
  { drug: "Ethambutol", code: "EMB", s: "R", g: "First-Line", muts: [{ gene: "embB", ch: "M306V", fr: 95, dp: 103, who: "Assoc w R" }] },
  { drug: "Pyrazinamide", code: "PZA", s: "S", g: "First-Line", muts: [] },
  { drug: "Streptomycin", code: "STR", s: "S", g: "First-Line", muts: [] },
  { drug: "Fluoroquinolones", code: "FQ", s: "S", g: "Second-Line", muts: [] },
  { drug: "Amikacin", code: "AMK", s: "S", g: "Second-Line", muts: [] },
  { drug: "Kanamycin", code: "KAN", s: "S", g: "Second-Line", muts: [] },
  { drug: "Capreomycin", code: "CAP", s: "S", g: "Second-Line", muts: [] },
  { drug: "Ethionamide", code: "ETH", s: "S", g: "Second-Line", muts: [] },
  { drug: "Linezolid", code: "LZD", s: "S", g: "Group C", muts: [] },
  { drug: "Bedaquiline", code: "BDQ", s: "S", g: "Group C", muts: [] },
  { drug: "Clofazimine", code: "CFZ", s: "S", g: "Group C", muts: [] },
  { drug: "Delamanid", code: "DLM", s: "S", g: "Group C", muts: [] },
];

const THRESHOLDS = [
  { key: "pct_mapped", label: "Reads Mapped", unit: "%", pass: 90, warn: 80, max: 100 },
  { key: "median_depth", label: "Median Depth", unit: "x", pass: 30, warn: 15, max: 150 },
  { key: "cov30x", label: "Coverage at 30x", unit: "%", pass: 90, warn: 80, max: 100 },
  { key: "num_reads", label: "Total Reads", unit: "", pass: 50000, warn: 25000, max: 500000 },
];

const DEFAULT_ROWS = [
  { row: 1, lab: "2502190001", test: "RIF Target", result: "Detected", status: "valid", msgs: [] },
  { row: 2, lab: "2502190001", test: "INH Target", result: "CT 22.4", status: "valid", msgs: [] },
  { row: 3, lab: "QC-POS-001", test: "Positive Control", result: "CT 18.1", status: "qc", msgs: [] },
  { row: 4, lab: "2502190002", test: "RIF Target", result: "Detected", status: "warning", msgs: ["ACCESSION_NOT_FOUND: Lab number not found in OpenELIS"] },
  { row: 5, lab: "", test: "INH Target", result: "CT 25.7", status: "error", msgs: ["MISSING_ACCESSION: Required lab number is empty"] },
  { row: 6, lab: "2502190003", test: "RIF Target", result: "Not Detected", status: "valid", msgs: [] },
];

const MOCK_RUNS = [
  { id: "run-001", analyzer: "MinION + TB-Profiler", sample: "2502190002", received: "2026-02-24 14:30 UTC", source: "File Watcher", status: "Pending Review", count: 14, hasCustom: true },
  { id: "run-002", analyzer: "QuantStudio 7 Flex", sample: "Multiple (6)", received: "2026-02-24 13:15 UTC", source: "File Watcher", status: "Pending Review", count: 6, hasCustom: false },
  { id: "run-003", analyzer: "MinION + TB-Profiler", sample: "2502180045", received: "2026-02-23 09:00 UTC", source: "Manual Upload", status: "Accepted", count: 14, hasCustom: true },
];

// ─── Shared Components ───────────────────────────────────────────────────────

function Badge({ text, color, bg }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600, color, background: bg }}>
      {text}
    </span>
  );
}

function Sect({ title, badge, startOpen = true, children }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, marginBottom: 1 }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer", gap: 8, userSelect: "none" }}>
        <span style={{ fontSize: 13, color: C.gray70, transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>{"\u25B6"}</span>
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{title}</span>
        {badge}
      </div>
      {open && <div style={{ padding: "0 16px 16px" }}>{children}</div>}
    </div>
  );
}

function GaugeCard({ t }) {
  const val = QC[t.key];
  const s = getQcStatus(val, t);
  const pct = Math.min((val / t.max) * 100, 100);
  const passPct = (t.pass / t.max) * 100;
  const warnPct = (t.warn / t.max) * 100;
  const displayVal = t.key === "num_reads" ? val.toLocaleString() : val.toFixed(1);
  return (
    <div style={{ padding: 12, background: C.gray50, borderRadius: 4, borderLeft: `3px solid ${statusColor(s)}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: C.gray70, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.label}</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          {displayVal}<span style={{ fontSize: 11, color: C.gray70, fontWeight: 400 }}>{t.unit}</span>
        </span>
      </div>
      <div style={{ position: "relative", height: 6, background: "#e0e0e0", borderRadius: 3 }}>
        <div style={{ position: "absolute", left: `${warnPct}%`, top: -1, bottom: -1, width: 1, background: C.warn, opacity: 0.4 }} />
        <div style={{ position: "absolute", left: `${passPct}%`, top: -1, bottom: -1, width: 1, background: C.pass, opacity: 0.4 }} />
        <div style={{ width: `${pct}%`, height: "100%", background: statusColor(s), borderRadius: 3 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#a8a8a8" }}>
        <span>{`Fail <${t.warn}${t.unit}`}</span>
        <span>{`\u2265${t.pass}${t.unit} Pass`}</span>
      </div>
    </div>
  );
}

function DrugRow({ d, isOpen, toggle }) {
  const hasMut = d.muts.length > 0;
  return (
    <div>
      <div onClick={hasMut ? toggle : undefined}
        style={{ display: "flex", alignItems: "center", padding: "8px 8px", borderBottom: `1px solid ${C.border}`, cursor: hasMut ? "pointer" : "default", gap: 8 }}>
        <span style={{ width: 16, fontSize: 12, color: "#a8a8a8" }}>{hasMut ? (isOpen ? "\u25BE" : "\u25B8") : ""}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{d.drug}</span>
        <span style={{ fontSize: 11, color: "#a8a8a8", fontFamily: "monospace", marginRight: 8 }}>{d.code}</span>
        <Badge text={d.s === "R" ? "Resistant" : "Susceptible"} color="#fff" bg={d.s === "R" ? C.fail : C.pass} />
      </div>
      {isOpen && hasMut && (
        <div style={{ padding: "8px 8px 8px 28px", background: C.gray50, marginBottom: 4, borderRadius: 4 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr>
              {["Gene", "Change", "Freq", "Depth", "WHO Grading"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600, color: C.gray70, borderBottom: `1px solid #c6c6c6`, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {d.muts.map((m, i) => (
                <tr key={i}>
                  <td style={{ padding: "4px 8px", fontFamily: "monospace", fontWeight: 600, color: C.teal }}>{m.gene}</td>
                  <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{m.ch}</td>
                  <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{m.fr}%</td>
                  <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{m.dp}x</td>
                  <td style={{ padding: "4px 8px" }}><Badge text={m.who} color={C.fail} bg={C.failBg} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DrugTable() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      {["First-Line", "Second-Line", "Group C"].map(g => (
        <div key={g} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.gray70, textTransform: "uppercase", letterSpacing: 0.5, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>{g}</div>
          {DRUGS.filter(d => d.g === g).map(d => (
            <DrugRow key={d.drug} d={d} isOpen={expanded === d.drug} toggle={() => setExpanded(expanded === d.drug ? null : d.drug)} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MetaPanel() {
  const pipe = [["Software", "TB-Profiler"], ["Version", "6.3.0"], ["DB Version", "WHO-UCN-GTB-PCI-2023.5"], ["Analysis Date", "2025-02-19"]];
  const seq = [["Platform", "MinION"], ["Instrument", "MN42781"], ["Flowcell", "FLO-MIN114"], ["Kit", "SQK-RBK114.96"], ["Basecaller", "Dorado 0.5.3"]];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {[["Pipeline", pipe], ["Sequencing", seq]].map(([title, rows]) => (
        <div key={title}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.gray70, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{title}</div>
          {rows.map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.gray50}`, fontSize: 12 }}>
              <span style={{ color: C.gray70 }}>{l}</span>
              <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ValidationSummary({ isTB }) {
  const counts = isTB
    ? { total: 14, patient: 14, qc: 0, valid: 14, warnings: 0, errors: 0 }
    : { total: 6, patient: 4, qc: 2, valid: 3, warnings: 1, errors: 1 };
  return (
    <div style={{ display: "flex", gap: 2, padding: "8px 0" }}>
      {[
        { label: "Total", val: counts.total, color: C.gray70, bg: C.gray50 },
        { label: "Patient", val: counts.patient, color: C.gray80, bg: "#e8e8e8" },
        { label: "QC", val: counts.qc, color: C.teal, bg: C.tealBg },
        { label: "Warnings", val: counts.warnings, color: C.warn, bg: C.warnBg },
        { label: "Errors", val: counts.errors, color: C.fail, bg: C.failBg },
      ].map(c => (
        <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 4, background: c.bg }}>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: c.color }}>{c.val}</span>
          <span style={{ fontSize: 11, color: c.color, fontWeight: 500 }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── TB-Profiler Custom Preview ──────────────────────────────────────────────
// Renders in both upload and review mode. `mode` controls action strip visibility.

function TBProfilerPreview({ mode }) {
  const [showTargets, setShowTargets] = useState(false);
  const [resultActions, setResultActions] = useState({});

  const overallQc = THRESHOLDS.every(t => getQcStatus(QC[t.key], t) === "pass") ? "pass"
    : THRESHOLDS.some(t => getQcStatus(QC[t.key], t) === "fail") ? "fail" : "warn";

  const rCount = DRUGS.filter(d => d.s === "R").length;
  const sCount = DRUGS.filter(d => d.s === "S").length;

  const handleAction = (drug, action) => {
    setResultActions(prev => ({ ...prev, [drug]: prev[drug] === action ? null : action }));
  };

  return (
    <div>
      {/* Review mode: run source banner (not shown in upload mode) */}
      {mode === "review" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#edf5ff", border: `1px solid ${C.blueDark}30`, borderRadius: 4, marginBottom: 8, fontSize: 12 }}>
          {/* label.review.source */}
          <Badge text="File Watcher" color={C.blueDark} bg={C.blueBg} />
          <span style={{ color: C.gray70 }}>Received: 2026-02-24 14:30 UTC</span>
          <span style={{ color: C.gray70 }}>{"\u2022"}</span>
          <span style={{ color: C.gray70 }}>File: <span style={{ fontFamily: "monospace", fontWeight: 500 }}>tbprofiler_2502190002.json</span></span>
          <span style={{ color: C.gray70 }}>{"\u2022"}</span>
          <Badge text="Pending Review" color={C.warn} bg={C.warnBg} />
        </div>
      )}

      {/* Classification Banner — same in both modes */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: C.white, border: `1px solid ${C.border}`, gap: 16, marginBottom: 1 }}>
        <div style={{ padding: "6px 16px", borderRadius: 4, background: C.fail, color: C.white, fontWeight: 700, fontSize: 16 }}>MDR-TB</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>2502190002</div>
          <div style={{ fontSize: 12, color: C.gray70 }}>M. tuberculosis — Beijing (lineage2.2.1)</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.fail, fontFamily: "monospace" }}>{rCount}</div>
            <div style={{ fontSize: 10, color: C.gray70, textTransform: "uppercase" }}>Resistant</div>
          </div>
          <div style={{ width: 1, height: 32, background: C.border }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.pass, fontFamily: "monospace" }}>{sCount}</div>
            <div style={{ fontSize: 10, color: C.gray70, textTransform: "uppercase" }}>Susceptible</div>
          </div>
        </div>
      </div>

      {/* QC Section — same in both modes */}
      <Sect title="Sequencing Quality Control"
        badge={<Badge text={`QC ${overallQc === "pass" ? "Pass" : overallQc === "warn" ? "Warning" : "Fail"}`} color={statusColor(overallQc)} bg={statusBg(overallQc)} />}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {THRESHOLDS.map(t => <GaugeCard key={t.key} t={t} />)}
        </div>
        <div onClick={() => setShowTargets(!showTargets)}
          style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, padding: "8px 12px", background: C.blueBg, border: `1px solid ${C.blueDark}30`, borderRadius: 4, cursor: "pointer", fontSize: 12, color: C.blueDark, fontWeight: 600 }}>
          <span>{showTargets ? "\u25BE" : "\u25B8"}</span>
          <span>Per-Target Gene Depth ({TARGETS.length} targets)</span>
        </div>
        {showTargets && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 4 }}>
            <thead><tr style={{ background: C.gray50, borderBottom: "2px solid #c6c6c6" }}>
              {["Gene Target", "Depth", "Coverage", "Status"].map(h => (
                <th key={h} style={{ textAlign: h === "Gene Target" ? "left" : "right", padding: "6px 10px", fontWeight: 600, color: C.gray70, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {TARGETS.map((row, i) => {
                const ok = row[1] >= 30 && row[2] >= 95;
                return (
                  <tr key={row[0]} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? "#f9f9f9" : "transparent" }}>
                    <td style={{ padding: "5px 10px", fontFamily: "monospace", fontWeight: 500 }}>{row[0]}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right", fontFamily: "monospace" }}>{row[1]}x</td>
                    <td style={{ padding: "5px 10px", textAlign: "right", fontFamily: "monospace" }}>{row[2]}%</td>
                    <td style={{ padding: "5px 10px", textAlign: "right", color: ok ? C.pass : C.fail, fontWeight: 600 }}>{ok ? "\u2713 Pass" : "\u2717 Fail"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Sect>

      {/* Drug Resistance — same in both modes */}
      <Sect title={`Drug Resistance Results (${DRUGS.length} drugs)`}>
        <div style={{ fontSize: 12, color: C.gray70, marginBottom: 8 }}>Click resistant drugs to expand mutation details</div>
        <DrugTable />
      </Sect>

      {/* ── Review mode only: Per-result action strip ─────────────────── */}
      {mode === "review" && (
        <Sect title="Result Actions" badge={<Badge text={`${Object.values(resultActions).filter(Boolean).length} / ${DRUGS.filter(d => d.s === "R").length} actioned`} color={C.gray70} bg={C.gray50} />}>
          <div style={{ fontSize: 12, color: C.gray70, marginBottom: 8 }}>
            {/* label.review.actionInstructions */}
            Choose an action for each resistant drug result before saving. Susceptible results will be accepted automatically.
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: C.gray50, borderBottom: "2px solid #c6c6c6" }}>
              {["Drug", "Result", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: C.gray70, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {DRUGS.filter(d => d.s === "R").map(d => {
                const action = resultActions[d.drug];
                return (
                  <tr key={d.drug} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "8px 12px", fontWeight: 500 }}>{d.drug} <span style={{ color: "#a8a8a8", fontFamily: "monospace" }}>({d.code})</span></td>
                    <td style={{ padding: "8px 12px" }}><Badge text="Resistant" color="#fff" bg={C.fail} /></td>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {/* label.button.accept / .retest / .ignore */}
                        {[
                          { key: "accept", label: "Accept", color: C.pass, bg: C.passBg },
                          { key: "retest", label: "Retest", color: C.warn, bg: C.warnBg },
                          { key: "ignore", label: "Ignore", color: C.gray70, bg: C.gray50 },
                        ].map(a => (
                          <button key={a.key} onClick={() => handleAction(d.drug, a.key)}
                            style={{
                              padding: "4px 12px", fontSize: 11, fontWeight: 600, borderRadius: 4, cursor: "pointer",
                              border: action === a.key ? `2px solid ${a.color}` : `1px solid ${C.border}`,
                              background: action === a.key ? a.bg : C.white,
                              color: action === a.key ? a.color : C.gray70,
                            }}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Sect>
      )}

      {/* Metadata — same in both modes */}
      <Sect title="Pipeline and Sequencing Metadata" startOpen={false}>
        <MetaPanel />
      </Sect>
    </div>
  );
}

// ─── Default Table Preview ───────────────────────────────────────────────────

function DefaultTablePreview({ mode }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [rowActions, setRowActions] = useState({});

  const handleRowAction = (row, action) => {
    setRowActions(prev => ({ ...prev, [row]: prev[row] === action ? null : action }));
  };

  const showAction = mode === "review";
  const cols = ["Row", "Lab Number", "Test", "Result", "Status", ...(showAction ? ["Action"] : [])];

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ background: C.gray50, borderBottom: "2px solid #c6c6c6" }}>
          {cols.map(h => (
            <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: C.gray70, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {DEFAULT_ROWS.map(r => {
            const bg = r.status === "warning" ? C.warnBg : r.status === "error" ? C.failBg : "transparent";
            const icon = r.status === "valid" ? <span style={{ color: C.pass, fontWeight: 700 }}>{"\u2713"}</span>
              : r.status === "warning" ? <span style={{ color: C.warn, fontWeight: 700 }}>{"\u26A0"}</span>
              : r.status === "error" ? <span style={{ color: C.fail, fontWeight: 700 }}>{"\u2717"}</span>
              : <Badge text="QC" color={C.teal} bg={C.tealBg} />;
            return (
              <React.Fragment key={r.row}>
                <tr onClick={() => r.msgs.length > 0 ? setExpandedRow(expandedRow === r.row ? null : r.row) : null}
                  style={{ background: bg, cursor: r.msgs.length > 0 ? "pointer" : "default", borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#a8a8a8" }}>{r.row}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 500 }}>{r.lab || <span style={{ color: "#a8a8a8", fontStyle: "italic" }}>{"\u2014"}</span>}</td>
                  <td style={{ padding: "8px 12px" }}>{r.test}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{r.result}</td>
                  <td style={{ padding: "8px 12px" }}>{icon}</td>
                  {showAction && r.status !== "error" && (
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[{ key: "accept", label: "\u2713", c: C.pass }, { key: "retest", label: "\u21BB", c: C.warn }, { key: "ignore", label: "\u2715", c: C.gray70 }].map(a => (
                          <button key={a.key} onClick={(e) => { e.stopPropagation(); handleRowAction(r.row, a.key); }}
                            style={{
                              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, borderRadius: 4, cursor: "pointer",
                              border: rowActions[r.row] === a.key ? `2px solid ${a.c}` : `1px solid ${C.border}`,
                              background: rowActions[r.row] === a.key ? (a.c === C.pass ? C.passBg : a.c === C.warn ? C.warnBg : C.gray50) : C.white,
                              color: a.c,
                            }}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                  {showAction && r.status === "error" && <td style={{ padding: "8px 12px", fontSize: 11, color: C.fail }}>Blocked</td>}
                </tr>
                {expandedRow === r.row && r.msgs.length > 0 && (
                  <tr><td colSpan={cols.length} style={{ padding: "8px 12px 8px 48px", background: r.status === "error" ? "#ffe5e5" : "#fef3cd", borderBottom: `1px solid ${C.border}` }}>
                    {r.msgs.map((m, i) => <div key={i} style={{ fontSize: 12, color: r.status === "error" ? C.fail : C.warn, fontFamily: "monospace" }}>{m}</div>)}
                  </td></tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Preview Slot ────────────────────────────────────────────────────────────

function PreviewSlot({ mode, analyzer }) {
  if (analyzer?.hasCustomPreview && analyzer.id === "tbprofiler") {
    return <TBProfilerPreview mode={mode} />;
  }
  return <DefaultTablePreview mode={mode} />;
}

// ─── Run List (review mode) ──────────────────────────────────────────────────

function RunList({ onSelect }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.gray70, marginBottom: 8 }}>Select a run to review results. Runs from pipeline analyzers with custom previews show the full domain-specific view.</div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: C.gray50, borderBottom: "2px solid #c6c6c6" }}>
            {["Analyzer", "Sample", "Received", "Source", "Results", "Status", ""].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: C.gray70, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {MOCK_RUNS.map(r => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: r.status === "Pending Review" ? "pointer" : "default" }}
                onClick={() => r.status === "Pending Review" && onSelect(r)}>
                <td style={{ padding: "8px 12px", fontWeight: 500 }}>
                  {r.analyzer}
                  {r.hasCustom && <span style={{ marginLeft: 6 }}><Badge text="Custom" color={C.purple} bg={C.purpleBg} /></span>}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{r.sample}</td>
                <td style={{ padding: "8px 12px", fontSize: 12, color: C.gray70 }}>{r.received}</td>
                <td style={{ padding: "8px 12px" }}>
                  <Badge text={r.source} color={r.source === "File Watcher" ? C.blueDark : C.teal} bg={r.source === "File Watcher" ? C.blueBg : C.tealBg} />
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{r.count}</td>
                <td style={{ padding: "8px 12px" }}>
                  <Badge text={r.status}
                    color={r.status === "Pending Review" ? C.warn : C.pass}
                    bg={r.status === "Pending Review" ? C.warnBg : C.passBg} />
                </td>
                <td style={{ padding: "8px 12px" }}>
                  {r.status === "Pending Review" && (
                    <span style={{ color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Review {"\u2192"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [appMode, setAppMode] = useState("upload"); // "upload" | "review"
  const [selectedAnalyzer, setSelectedAnalyzer] = useState(null);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);

  const analyzer = ANALYZERS.find(a => a.id === selectedAnalyzer);

  const sidebarItems = [
    { label: "By Order", key: "order" },
    { label: "By Patient", key: "patient" },
    { label: "Analyzer Results", key: "analyzer", active: appMode === "review" },
    { label: "Upload Analyzer File", key: "upload", active: appMode === "upload" },
  ];

  const switchMode = (m) => {
    setAppMode(m);
    setFileLoaded(false);
    setSelectedAnalyzer(null);
    setShowDropdown(false);
    setSelectedRun(null);
  };

  // In review mode, resolve the analyzer object for the selected run
  const reviewAnalyzer = selectedRun?.hasCustom ? ANALYZERS[0] : (selectedRun ? ANALYZERS[1] : null);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", background: C.gray50 }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ background: C.gray100, color: C.white, height: 48, display: "flex", alignItems: "center", padding: "0 16px", gap: 10, borderBottom: "3px solid #0f62fe" }}>
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /></svg>
        <span style={{ fontSize: 14, fontWeight: 600 }}>OpenELIS Global</span>
        <span style={{ fontSize: 12, color: "#a8a8a8" }}>v3.x</span>
        <div style={{ flex: 1 }} />
        {/* Mode toggle — mockup only */}
        <div style={{ display: "flex", gap: 2, background: "#393939", padding: 2, borderRadius: 4 }}>
          {[
            { key: "upload", label: "Upload Mode" },
            { key: "review", label: "Review Mode" },
          ].map(m => (
            <button key={m.key} onClick={() => switchMode(m.key)}
              style={{
                padding: "4px 12px", fontSize: 11, border: "none", borderRadius: 3, cursor: "pointer",
                fontWeight: appMode === m.key ? 600 : 400,
                background: appMode === m.key ? C.blue : "transparent",
                color: appMode === m.key ? C.white : "#a8a8a8",
              }}>
              {m.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 10, color: "#6f6f6f", fontStyle: "italic" }}>(mockup toggle)</span>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 48px)" }}>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <div style={{ width: 220, background: C.gray90, color: "#c6c6c6", fontSize: 13, flexShrink: 0 }}>
          <div style={{ padding: "16px 14px 8px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#6f6f6f" }}>Results</div>
          {sidebarItems.map(item => (
            <div key={item.key} style={{
              padding: "10px 16px", fontSize: 13,
              background: item.active ? C.blue : "transparent",
              color: item.active ? C.white : "#c6c6c6",
              fontWeight: item.active ? 600 : 400,
              borderLeft: item.active ? "3px solid #78a9ff" : "3px solid transparent",
              cursor: "pointer",
            }}>
              {item.label}
            </div>
          ))}
        </div>

        {/* ── Main Content ────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>

          <div style={{ padding: "12px 24px", fontSize: 12, color: C.gray70 }}>
            Results / {appMode === "upload" ? "Upload Analyzer File" : (selectedRun ? `Analyzer Results / Run ${selectedRun.id}` : "Analyzer Results")}
          </div>

          <div style={{ padding: "0 24px 16px" }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: C.gray100 }}>
              {appMode === "upload" ? "Upload Analyzer File" : "Analyzer Results"}
            </h1>
          </div>

          <div style={{ flex: 1, padding: "0 24px 24px" }}>

            {/* Architecture banner (mockup-only) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.purpleBg, border: `1px solid ${C.purple}30`, borderRadius: 4, marginBottom: 16, fontSize: 12 }}>
              <span style={{ fontSize: 14 }}>{"\uD83D\uDD0C"}</span>
              <span style={{ color: C.purple, fontWeight: 600 }}>
                {appMode === "upload" ? 'PreviewSlot mode="upload"' : 'PreviewSlot mode="review"'}
              </span>
              <span style={{ color: C.gray70 }}>{"\u2014"}</span>
              <span style={{ color: C.gray70 }}>
                {appMode === "upload"
                  ? "Manual upload path. Select an analyzer, upload a file, preview, submit."
                  : "Backend import path. Same custom preview, no file upload. Accept/retest/ignore actions."
                }
              </span>
              <span style={{ fontStyle: "italic", color: "#a8a8a8" }}>(mockup annotation)</span>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* UPLOAD MODE                                                */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {appMode === "upload" && (
              <>
                {/* Analyzer Selector */}
                <div style={{ marginBottom: 16, position: "relative" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.gray70, marginBottom: 4 }}>Select Analyzer</label>
                  <div onClick={() => setShowDropdown(!showDropdown)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.white, border: `1px solid ${showDropdown ? C.blue : C.border}`, borderRadius: 4, cursor: "pointer", fontSize: 14, minHeight: 40 }}>
                    <span style={{ color: analyzer ? C.gray100 : "#a8a8a8" }}>
                      {analyzer ? analyzer.name : "Choose an analyzer..."}
                    </span>
                    <span style={{ fontSize: 12, color: C.gray70 }}>{showDropdown ? "\u25B2" : "\u25BC"}</span>
                  </div>
                  {showDropdown && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: C.white, border: `1px solid ${C.border}`, borderRadius: "0 0 4px 4px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                      {ANALYZERS.map(a => (
                        <div key={a.id} onClick={() => { setSelectedAnalyzer(a.id); setShowDropdown(false); setFileLoaded(false); }}
                          style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: selectedAnalyzer === a.id ? C.blueBg : "transparent", borderBottom: `1px solid ${C.gray50}` }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                            <div style={{ fontSize: 11, color: C.gray70 }}>{a.plugin}</div>
                          </div>
                          <Badge text={a.protocol} color={a.badge === "pipeline" ? C.purple : C.teal} bg={a.badge === "pipeline" ? C.purpleBg : C.tealBg} />
                          {a.hasCustomPreview && <Badge text="Custom Preview" color={C.purple} bg={C.purpleBg} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Analyzer Info */}
                {analyzer && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: C.gray50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {analyzer.id === "tbprofiler" ? "\uD83E\uDDEC" : "\uD83D\uDD2C"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{analyzer.name}</div>
                      <div style={{ fontSize: 12, color: C.gray70 }}>{analyzer.protocol} {"\u2014"} {analyzer.serial}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, color: C.gray70 }}>
                      <div>Plugin: {analyzer.plugin}</div>
                      <div>Accepts: {analyzer.ext}</div>
                    </div>
                  </div>
                )}

                {/* Upload Zone */}
                {!fileLoaded && (
                  <div onClick={() => selectedAnalyzer && setFileLoaded(true)}
                    style={{ padding: "32px 24px", textAlign: "center", borderRadius: 4, marginBottom: 16, cursor: selectedAnalyzer ? "pointer" : "not-allowed",
                      border: `2px dashed ${selectedAnalyzer ? C.blue : "#c6c6c6"}`, background: selectedAnalyzer ? "#f7f9ff" : C.gray50, opacity: selectedAnalyzer ? 1 : 0.6 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{selectedAnalyzer ? "\uD83D\uDCC2" : "\uD83D\uDEAB"}</div>
                    <div style={{ fontSize: 14, color: selectedAnalyzer ? C.blue : C.gray70, fontWeight: 500 }}>
                      {selectedAnalyzer ? "Drag and drop a file here, or click to browse" : "Select an analyzer first"}
                    </div>
                  </div>
                )}

                {/* File Loaded Bar */}
                {fileLoaded && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.passBg, borderRadius: 4, fontSize: 12, marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, color: C.pass }}>{"\u2713"}</span>
                    <span style={{ fontWeight: 600, color: C.pass }}>{analyzer?.id === "tbprofiler" ? "tbprofiler_2502190002.json" : "quantstudio_run.csv"}</span>
                    <span style={{ color: C.gray70 }}>{analyzer?.id === "tbprofiler" ? "4.2 KB" : "128 KB"} {"\u2014"} Parsed successfully</span>
                    <div style={{ flex: 1 }} />
                    <span onClick={() => setFileLoaded(false)} style={{ color: C.fail, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>{"\u2715"}</span>
                  </div>
                )}

                {fileLoaded && <ValidationSummary isTB={analyzer?.id === "tbprofiler"} />}
                {fileLoaded && <PreviewSlot mode="upload" analyzer={analyzer} />}
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* REVIEW MODE                                                */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {appMode === "review" && !selectedRun && (
              <RunList onSelect={setSelectedRun} />
            )}

            {appMode === "review" && selectedRun && (
              <>
                {/* Back link */}
                <div onClick={() => setSelectedRun(null)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.blue, cursor: "pointer", marginBottom: 12, fontWeight: 500 }}>
                  {"\u2190"} Back to run list
                </div>

                <ValidationSummary isTB={reviewAnalyzer?.id === "tbprofiler"} />
                <PreviewSlot mode="review" analyzer={reviewAnalyzer} />
              </>
            )}
          </div>

          {/* ── Action Bar ────────────────────────────────────────────── */}
          {((appMode === "upload" && fileLoaded) || (appMode === "review" && selectedRun)) && (
            <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", justifyContent: "flex-end", gap: 12, position: "sticky", bottom: 0, zIndex: 5 }}>
              {appMode === "upload" ? (
                <>
                  {/* label.button.cancel */}
                  <button onClick={() => { setFileLoaded(false); setSelectedAnalyzer(null); }}
                    style={{ padding: "8px 24px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 14, cursor: "pointer", color: C.gray80 }}>
                    Cancel
                  </button>
                  {/* label.upload.submit */}
                  <button style={{ padding: "8px 24px", background: C.blue, border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer", color: C.white }}>
                    Submit to Import Queue
                  </button>
                </>
              ) : (
                <>
                  {/* label.button.backToRunList */}
                  <button onClick={() => setSelectedRun(null)}
                    style={{ padding: "8px 24px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 14, cursor: "pointer", color: C.gray80 }}>
                    Back to Run List
                  </button>
                  {/* label.button.retestSelected */}
                  <button style={{ padding: "8px 24px", background: "transparent", border: `1px solid ${C.warn}`, borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer", color: C.warn }}>
                    Retest Selected
                  </button>
                  {/* label.button.acceptAll */}
                  <button style={{ padding: "8px 24px", background: C.pass, border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer", color: C.white }}>
                    Accept All Results
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
