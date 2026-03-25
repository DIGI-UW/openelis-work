import { useState } from "react";
import { AlertTriangle, CheckCircle, RefreshCw, Save, ChevronDown, ChevronUp, Filter } from "lucide-react";

const t = (key, fallback) => fallback;

const FORECAST_DATA = [
  { id: "1", facility: "Kigali Central Lab",    cartridge: "MTB/RIF Ultra", dos: 4,    stock: 12,  adc: 3.1,  status: "CRITICAL",           threshold: 30 },
  { id: "2", facility: "Butare District Lab",   cartridge: "MTB/RIF Ultra", dos: 18,   stock: 54,  adc: 3.0,  status: "LOW",                threshold: 30 },
  { id: "3", facility: "Gisenyi Health Centre", cartridge: "MTB/RIF Ultra", dos: 52,   stock: 104, adc: 2.0,  status: "ADEQUATE",           threshold: 30 },
  { id: "4", facility: "Musanze Lab",           cartridge: "MTB/XDR",      dos: null,  stock: 8,   adc: null, status: "INSUFFICIENT_DATA",  threshold: 30 },
  { id: "5", facility: "Rwamagana District",    cartridge: "MTB/RIF Ultra", dos: 7,    stock: 21,  adc: 3.0,  status: "CRITICAL",           threshold: 30 },
  { id: "6", facility: "Nyamata Lab",           cartridge: "MTB/RIF Ultra", dos: 41,   stock: 82,  adc: 2.0,  status: "ADEQUATE",           threshold: 30 },
  { id: "7", facility: "Huye Hospital Lab",     cartridge: "MTB/XDR",      dos: 9,    stock: 18,  adc: 2.0,  status: "LOW",                threshold: 14 },
];

const STATUS = {
  CRITICAL:          { label: "Critical",             bg: "#fff1f1", text: "#a2191f", border: "#ffb3b8", dot: "#da1e28" },
  LOW:               { label: "Low Stock",            bg: "#fff3e0", text: "#b45309", border: "#fde68a", dot: "#f59e0b" },
  ADEQUATE:          { label: "Adequate",             bg: "#defbe6", text: "#0e6027", border: "#a7f0ba", dot: "#24a148" },
  OVERSTOCKED:       { label: "Overstocked",          bg: "#f3e8ff", text: "#6b21a8", border: "#d8b4fe", dot: "#9333ea" },
  INSUFFICIENT_DATA: { label: "Insufficient History", bg: "#f4f4f4", text: "#525252", border: "#e0e0e0", dot: "#8d8d8d" },
};

function StatusBadge({ status }) {
  const s = STATUS[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 12, padding: "3px 10px", fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function DoSCell({ dos, status }) {
  const color = status === "CRITICAL" ? "#da1e28" : status === "LOW" ? "#b45309" : "#0e6027";
  if (dos === null) return <span style={{ color: "#8d8d8d", fontStyle: "italic", fontSize: 13 }}>—</span>;
  return (
    <span style={{ color, fontWeight: 700, fontSize: 15 }}>
      {dos} <span style={{ fontWeight: 400, fontSize: 12, color: "#525252" }}>days</span>
    </span>
  );
}

function StatTile({ value, label, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 4, padding: "1rem", textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#525252", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function ReagentForecasting() {
  const [atRiskOnly, setAtRiskOnly]  = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [thresholds, setThresholds]  = useState(Object.fromEntries(FORECAST_DATA.map(r => [r.id, r.threshold])));
  const [savedRow, setSavedRow]      = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [recalcMsg, setRecalcMsg]    = useState(false);
  const [globalOpen, setGlobalOpen]  = useState(false);

  const criticalCount = FORECAST_DATA.filter(r => r.status === "CRITICAL").length;
  const visible = atRiskOnly ? FORECAST_DATA.filter(r => r.status === "CRITICAL" || r.status === "LOW") : FORECAST_DATA;

  const handleSave = (id, facility) => {
    setSavedRow(facility);
    setExpandedRow(null);
    setTimeout(() => setSavedRow(null), 2500);
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", background: "#f4f4f4", minHeight: "100vh", padding: "1.5rem" }}>
      {/* Header bar */}
      <div style={{ background: "#161616", color: "#fff", padding: "8px 1.5rem", margin: "-1.5rem -1.5rem 1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#8d8d8d" }}>Inventory</span>
        <span style={{ color: "#525252" }}>/</span>
        <span style={{ fontSize: 13 }}>Reagent Forecasting</span>
      </div>

      <div style={{ maxWidth: 1100 }}>

        {/* Title + Recalculate */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: "#161616", margin: 0 }}>Reagent Forecasting</h1>
            <p style={{ fontSize: 14, color: "#525252", marginTop: 4 }}>GeneXpert cartridge stock-out prediction by facility · As of 2026-03-23 06:00</p>
          </div>
          <button onClick={() => { setRecalcMsg(true); setTimeout(() => setRecalcMsg(false), 3000); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #0f62fe", color: "#0f62fe", borderRadius: 2, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
            <RefreshCw size={13} /> Recalculate
          </button>
        </div>

        {/* Notifications */}
        {recalcMsg && (
          <div style={{ background: "#edf5ff", border: "1px solid #a6c8ff", borderLeft: "4px solid #0f62fe", padding: "10px 16px", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 8, borderRadius: 2 }}>
            <RefreshCw size={14} color="#0043ce" />
            <span style={{ fontSize: 13, color: "#0043ce" }}>Forecast recalculation started. Results will update shortly.</span>
          </div>
        )}
        {savedRow && (
          <div style={{ background: "#defbe6", border: "1px solid #a7f0ba", borderLeft: "4px solid #24a148", padding: "10px 16px", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 8, borderRadius: 2 }}>
            <CheckCircle size={14} color="#0e6027" />
            <span style={{ fontSize: 13, color: "#0e6027" }}>Reorder threshold updated for <strong>{savedRow}</strong>.</span>
          </div>
        )}
        {criticalCount > 0 && !alertDismissed && (
          <div style={{ background: "#fff1f1", border: "1px solid #ffb3b8", borderLeft: "4px solid #da1e28", padding: "12px 16px", marginBottom: "1rem", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertTriangle size={16} color="#da1e28" style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#a2191f" }}>
                  {criticalCount} site{criticalCount > 1 ? "s" : ""} have CRITICAL cartridge stock
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6f6f6f" }}>Immediate reorder action required. Expand rows below for details.</p>
              </div>
            </div>
            <button onClick={() => setAlertDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#525252", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}

        {/* Global Config Accordion */}
        <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 4, marginBottom: "1rem" }}>
          <button onClick={() => setGlobalOpen(p => !p)} style={{
            width: "100%", background: "#f4f4f4", border: "none", padding: "12px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#525252",
            borderRadius: globalOpen ? "4px 4px 0 0" : 4,
          }}>
            Global Forecasting Configuration
            {globalOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {globalOpen && (
            <div style={{ padding: "1rem 1.25rem", display: "grid", gridTemplateColumns: "200px 200px", gap: "1rem", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#525252", display: "block", marginBottom: 4 }}>ADC Lookback Window (days)</label>
                <input type="number" defaultValue={90} min={30} max={180} style={{ border: "1px solid #8d8d8d", borderRadius: 2, padding: "7px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
                <span style={{ fontSize: 11, color: "#6f6f6f" }}>30–180 days</span>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#525252", display: "block", marginBottom: 4 }}>Default Reorder Threshold (days)</label>
                <input type="number" defaultValue={30} min={1} max={365} style={{ border: "1px solid #8d8d8d", borderRadius: 2, padding: "7px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
                <span style={{ fontSize: 11, color: "#6f6f6f" }}>Applied when no site-specific threshold is set</span>
              </div>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0f62fe", color: "#fff", border: "none", borderRadius: 2, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
                <Save size={13} /> Save Global Config
              </button>
            </div>
          )}
        </div>

        {/* Main Table */}
        <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 4 }}>
          {/* Toolbar */}
          <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e0e0e0" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#161616" }}>Cartridge Stock Forecast</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#525252" }}>All GeneXpert cartridge types — all facilities</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input placeholder="Search facility or cartridge…" style={{
                border: "1px solid #e0e0e0", borderRadius: 2, padding: "6px 12px", fontSize: 13, width: 220,
              }} />
              <button onClick={() => setAtRiskOnly(p => !p)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: atRiskOnly ? "#da1e28" : "transparent",
                color: atRiskOnly ? "#fff" : "#525252",
                border: "1px solid " + (atRiskOnly ? "#da1e28" : "#8d8d8d"),
                borderRadius: 2, padding: "6px 12px", fontSize: 13, cursor: "pointer",
              }}>
                <Filter size={12} />
                {atRiskOnly ? "Show All Sites" : "At-Risk Only"}
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f4f4f4" }}>
                  {["Facility", "Cartridge Type", "Status", "Days of Stock", "Stock on Hand", "Avg Daily Use", "Reorder (days)", ""].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#525252", fontSize: 12, borderBottom: "1px solid #e0e0e0", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => {
                  const isCrit = row.status === "CRITICAL";
                  const isExp  = expandedRow === row.id;
                  return (
                    <>
                      <tr key={row.id} style={{ background: isCrit ? "#fff8f8" : i % 2 === 0 ? "#fff" : "#f9f9f9", borderLeft: isCrit ? "3px solid #da1e28" : "3px solid transparent" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 500 }}>{row.facility}</td>
                        <td style={{ padding: "10px 12px", color: "#525252" }}>{row.cartridge}</td>
                        <td style={{ padding: "10px 12px" }}><StatusBadge status={row.status} /></td>
                        <td style={{ padding: "10px 12px" }}><DoSCell dos={row.dos} status={row.status} /></td>
                        <td style={{ padding: "10px 12px" }}>{row.stock} <span style={{ fontSize: 11, color: "#6f6f6f" }}>cartridges</span></td>
                        <td style={{ padding: "10px 12px", color: row.adc === null ? "#8d8d8d" : "#161616", fontStyle: row.adc === null ? "italic" : "normal" }}>
                          {row.adc !== null ? `${row.adc.toFixed(1)}/day` : "< 14 days data"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>{row.threshold} days</td>
                        <td style={{ padding: "10px 12px" }}>
                          <button onClick={() => setExpandedRow(isExp ? null : row.id)} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: "transparent", border: "1px solid #e0e0e0", borderRadius: 2,
                            padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#0f62fe",
                          }}>
                            {isExp ? <ChevronUp size={11} /> : <ChevronDown size={11} />} Edit
                          </button>
                        </td>
                      </tr>
                      {isExp && (
                        <tr key={`${row.id}-expand`} style={{ background: "#f0f4ff" }}>
                          <td colSpan={8} style={{ padding: "1rem 1.25rem" }}>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5rem" }}>
                              <div>
                                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#161616" }}>
                                  Edit reorder threshold — {row.facility} · {row.cartridge}
                                </p>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#525252", display: "block", marginBottom: 4 }}>
                                  Reorder Threshold (days)
                                </label>
                                <input
                                  type="number" min={1} max={365}
                                  value={thresholds[row.id]}
                                  onChange={e => setThresholds(p => ({ ...p, [row.id]: +e.target.value }))}
                                  style={{ border: "1px solid #8d8d8d", borderRadius: 2, padding: "7px 10px", fontSize: 14, width: 120 }}
                                />
                                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6f6f6f" }}>Alert when days of stock falls below this value.</p>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => handleSave(row.id, row.facility)} style={{
                                  display: "inline-flex", alignItems: "center", gap: 6, background: "#0f62fe", color: "#fff", border: "none", borderRadius: 2, padding: "8px 14px", fontSize: 13, cursor: "pointer",
                                }}>
                                  <Save size={12} /> Save Threshold
                                </button>
                                <button onClick={() => setExpandedRow(null)} style={{
                                  background: "transparent", border: "1px solid #8d8d8d", borderRadius: 2, padding: "8px 14px", fontSize: 13, cursor: "pointer", color: "#525252",
                                }}>Cancel</button>
                              </div>
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

        {/* Summary Stat Tiles */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem", paddingBottom: "2rem" }}>
          <StatTile value={FORECAST_DATA.filter(r => r.status === "CRITICAL").length}          label="Critical Sites"       color="#da1e28" />
          <StatTile value={FORECAST_DATA.filter(r => r.status === "LOW").length}               label="Low Stock Sites"      color="#b45309" />
          <StatTile value={FORECAST_DATA.filter(r => r.status === "ADEQUATE").length}          label="Adequate Sites"       color="#198038" />
          <StatTile value={FORECAST_DATA.filter(r => r.status === "INSUFFICIENT_DATA").length} label="Insufficient History" color="#6f6f6f" />
        </div>
      </div>
    </div>
  );
}
