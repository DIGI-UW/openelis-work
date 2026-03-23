import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { AlertTriangle, TrendingUp, Clock, Activity, Filter, RefreshCw, ExternalLink, ChevronDown } from "lucide-react";

// ── Fake FHIR-sourced data ──────────────────────────────────────────────────

const POSITIVITY_TREND = [
  { week: "Jan W1", TB: 18.2, HIV: 6.1 }, { week: "Jan W2", TB: 21.4, HIV: 5.8 },
  { week: "Jan W3", TB: 19.7, HIV: 7.2 }, { week: "Jan W4", TB: 23.1, HIV: 6.4 },
  { week: "Feb W1", TB: 24.8, HIV: 5.9 }, { week: "Feb W2", TB: 22.3, HIV: 6.7 },
  { week: "Feb W3", TB: 26.1, HIV: 7.1 }, { week: "Feb W4", TB: 28.4, HIV: 6.3 },
  { week: "Mar W1", TB: 25.9, HIV: 8.2 }, { week: "Mar W2", TB: 27.2, HIV: 7.8 },
  { week: "Mar W3", TB: 29.1, HIV: 8.5 },
];

const VOLUME_BY_SITE = [
  { site: "Kigali Central", TB: 412, HIV: 188 },
  { site: "Butare District", TB: 287, HIV: 134 },
  { site: "Gisenyi HC",     TB: 198, HIV: 91  },
  { site: "Rwamagana",      TB: 176, HIV: 82  },
  { site: "Nyamata Lab",    TB: 154, HIV: 68  },
  { site: "Huye Hospital",  TB: 143, HIV: 71  },
  { site: "Musanze Lab",    TB: 98,  HIV: 44  },
];

const TAT_TREND = [
  { week: "Jan W1", medianHrs: 5.2 }, { week: "Jan W2", medianHrs: 6.1 },
  { week: "Jan W3", medianHrs: 4.8 }, { week: "Jan W4", medianHrs: 5.4 },
  { week: "Feb W1", medianHrs: 7.2 }, { week: "Feb W2", medianHrs: 5.9 },
  { week: "Feb W3", medianHrs: 5.1 }, { week: "Feb W4", medianHrs: 4.7 },
  { week: "Mar W1", medianHrs: 4.9 }, { week: "Mar W2", medianHrs: 6.3 },
  { week: "Mar W3", medianHrs: 5.5 },
];

const EQUIPMENT = [
  { site: "Kigali Central", device: "GeneXpert IV (S/N 12041)", tests: 412, errors: 3,  invalid: 7,  errorRate: 2.4, utilization: 84 },
  { site: "Butare District", device: "GeneXpert II (S/N 08812)", tests: 287, errors: 1,  invalid: 4,  errorRate: 1.7, utilization: 71 },
  { site: "Gisenyi HC",      device: "GeneXpert I (S/N 14220)",  tests: 198, errors: 12, invalid: 9,  errorRate: 10.6, utilization: 62 },
  { site: "Rwamagana",       device: "GeneXpert II (S/N 09341)", tests: 176, errors: 2,  invalid: 3,  errorRate: 2.8, utilization: 58 },
  { site: "Nyamata Lab",     device: "GeneXpert II (S/N 11094)", tests: 154, errors: 0,  invalid: 2,  errorRate: 1.3, utilization: 51 },
  { site: "Huye Hospital",   device: "GeneXpert IV (S/N 13771)", tests: 143, errors: 4,  invalid: 5,  errorRate: 6.3, utilization: 47 },
  { site: "Musanze Lab",     device: "GeneXpert I (S/N 07229)",  tests: 98,  errors: 1,  invalid: 1,  errorRate: 2.0, utilization: 32 },
];

const GEO_DATA = [
  { region: "Kigali City",    district: "Gasabo",      facility: "Kigali Central Lab",    tests: 412, positivity: 29.1, tat: 4.9, status: "reporting" },
  { region: "Southern",       district: "Huye",         facility: "Butare District Lab",   tests: 287, positivity: 27.2, tat: 5.5, status: "reporting" },
  { region: "Western",        district: "Rubavu",       facility: "Gisenyi Health Centre", tests: 198, positivity: 24.8, tat: 6.1, status: "reporting" },
  { region: "Eastern",        district: "Rwamagana",    facility: "Rwamagana District",    tests: 176, positivity: 31.4, tat: 5.2, status: "reporting" },
  { region: "Southern",       district: "Bugesera",     facility: "Nyamata Lab",           tests: 154, positivity: 22.1, tat: 4.7, status: "reporting" },
  { region: "Southern",       district: "Huye",         facility: "Huye Hospital Lab",     tests: 143, positivity: 18.9, tat: 6.8, status: "reporting" },
  { region: "Northern",       district: "Musanze",      facility: "Musanze Lab",           tests: 98,  positivity: 26.5, tat: 5.1, status: "late" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderTop: `3px solid ${color}`, borderRadius: 4, padding: "1rem 1.25rem", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "#525252", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
          <p style={{ margin: "6px 0 4px", fontSize: 28, fontWeight: 700, color: "#161616", lineHeight: 1 }}>{value}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6f6f6f" }}>{sub}</p>
        </div>
        <div style={{ background: color + "18", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: 8, fontSize: 11, color: trend > 0 ? "#da1e28" : "#198038", fontWeight: 600 }}>
          {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}% vs prev. period
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#161616" }}>{title}</h3>
      {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6f6f6f" }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 4, padding: "1.25rem", ...style }}>
      {children}
    </div>
  );
}

function FilterBar({ value, onChange, options, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#525252", fontWeight: 500 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        border: "1px solid #e0e0e0", borderRadius: 2, padding: "4px 8px", fontSize: 12, color: "#161616", background: "#fff",
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 4, padding: "8px 12px", fontSize: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#161616" }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ margin: "2px 0", color: p.color }}>
          {p.name}: <strong>{p.value}{unit || ""}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function DiseaseSurveillanceDashboard() {
  const [disease, setDisease]   = useState("ALL");
  const [period, setPeriod]     = useState("90d");
  const [region, setRegion]     = useState("ALL");
  const [geoExpanded, setGeoExpanded] = useState(null);

  const highErrorSites = EQUIPMENT.filter(e => e.errorRate > 5);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", background: "#f4f4f4", minHeight: "100vh" }}>

      {/* Top nav bar */}
      <div style={{ background: "#161616", color: "#fff", padding: "0 1.5rem", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>OpenELIS</span>
          <span style={{ color: "#525252" }}>|</span>
          <span style={{ fontSize: 13, color: "#c6c6c6" }}>Disease Surveillance Dashboard</span>
          <span style={{ background: "#0f62fe", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 2, fontWeight: 600 }}>TB + HIV</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#8d8d8d" }}>Data from OpenELIS FHIR Repo · Last sync 06:00</span>
          <button style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#a8c7fa", fontSize: 12 }}>
            <RefreshCw size={11} /> Refresh
          </button>
          <button style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#a8c7fa", fontSize: 12 }}>
            <ExternalLink size={11} /> Open in Superset
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "10px 1.5rem", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter size={13} color="#525252" />
          <span style={{ fontSize: 12, color: "#525252", fontWeight: 600 }}>FILTERS</span>
        </div>
        <FilterBar label="Disease" value={disease} onChange={setDisease} options={[
          { value: "ALL", label: "TB + HIV" }, { value: "TB", label: "TB only" }, { value: "HIV", label: "HIV only" },
        ]} />
        <FilterBar label="Period" value={period} onChange={setPeriod} options={[
          { value: "30d", label: "Last 30 days" }, { value: "90d", label: "Last 90 days" }, { value: "1y", label: "Last 12 months" },
        ]} />
        <FilterBar label="Region" value={region} onChange={setRegion} options={[
          { value: "ALL", label: "All regions" }, { value: "Kigali City", label: "Kigali City" },
          { value: "Southern", label: "Southern" }, { value: "Western", label: "Western" },
          { value: "Eastern", label: "Eastern" }, { value: "Northern", label: "Northern" },
        ]} />
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#525252" }}>
          <strong style={{ color: "#161616" }}>7</strong> facilities · <strong style={{ color: "#161616" }}>1,468</strong> tests this period
        </div>
      </div>

      <div style={{ padding: "1.25rem 1.5rem" }}>

        {/* High error rate alert */}
        {highErrorSites.length > 0 && (
          <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderLeft: "4px solid #f59e0b", borderRadius: 2, padding: "10px 16px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={15} color="#b45309" />
            <span style={{ fontSize: 13, color: "#78350f" }}>
              <strong>{highErrorSites.length} device{highErrorSites.length > 1 ? "s" : ""}</strong> with error rate &gt;5%:&nbsp;
              {highErrorSites.map(s => s.site).join(", ")}. Review equipment status.
            </span>
          </div>
        )}

        {/* KPI Row */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
          <KpiCard icon={Activity}   label="Test Positivity (TB)" value="27.2%"  sub="Week of Mar 16"           color="#0f62fe" trend={+2.1} />
          <KpiCard icon={Activity}   label="Test Positivity (HIV)" value="8.5%"  sub="Week of Mar 16"           color="#8a3ffc" trend={+0.7} />
          <KpiCard icon={TrendingUp} label="Total Tests (Period)"  value="1,468" sub="TB: 1,068 · HIV: 400"     color="#198038" trend={-3.2} />
          <KpiCard icon={Clock}      label="Median TAT"            value="5.5 h" sub="Order to validated result" color="#f59e0b" trend={+0.6} />
        </div>

        {/* Row 2: Positivity trend + Volume by site */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>

          <Card>
            <SectionHeader title="Test Positivity Rate — Weekly Trend" subtitle="% of tests returning positive · TB & HIV" />
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={POSITIVITY_TREND} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6f6f6f" }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "#6f6f6f" }} unit="%" domain={[0, 40]} />
                <Tooltip content={<CustomTooltip unit="%" />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {(disease === "ALL" || disease === "TB") && (
                  <Line type="monotone" dataKey="TB" stroke="#0f62fe" strokeWidth={2} dot={false} name="TB positivity" />
                )}
                {(disease === "ALL" || disease === "HIV") && (
                  <Line type="monotone" dataKey="HIV" stroke="#8a3ffc" strokeWidth={2} dot={false} name="HIV positivity" />
                )}
                <ReferenceLine y={25} stroke="#da1e28" strokeDasharray="4 4" label={{ value: "Target ≤25%", fill: "#da1e28", fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionHeader title="Test Volume by Facility" subtitle="Total tests per site this period · TB & HIV" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={VOLUME_BY_SITE} layout="vertical" margin={{ top: 4, right: 16, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#6f6f6f" }} />
                <YAxis type="category" dataKey="site" tick={{ fontSize: 10, fill: "#6f6f6f" }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {(disease === "ALL" || disease === "TB") && (
                  <Bar dataKey="TB" stackId="a" fill="#0f62fe" name="TB tests" />
                )}
                {(disease === "ALL" || disease === "HIV") && (
                  <Bar dataKey="HIV" stackId="a" fill="#8a3ffc" name="HIV tests" radius={[0, 3, 3, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Row 3: TAT trend + Equipment utilization */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>

          <Card>
            <SectionHeader title="Median Turnaround Time — Weekly" subtitle="Hours from order creation to validated result" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={TAT_TREND} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6f6f6f" }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "#6f6f6f" }} unit="h" domain={[0, 12]} />
                <Tooltip content={<CustomTooltip unit="h" />} />
                <ReferenceLine y={6} stroke="#198038" strokeDasharray="4 4" label={{ value: "Target ≤6h", fill: "#198038", fontSize: 10 }} />
                <Line type="monotone" dataKey="medianHrs" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} name="Median TAT" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionHeader title="Equipment Utilization & Error Rates" subtitle="GeneXpert devices · this period" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                    {["Facility", "Tests", "Utilization", "Error Rate"].map(h => (
                      <th key={h} style={{ padding: "4px 8px", textAlign: "left", color: "#525252", fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EQUIPMENT.map((e, i) => {
                    const isHighError = e.errorRate > 5;
                    return (
                      <tr key={e.site} style={{ background: isHighError ? "#fff8e1" : i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                        <td style={{ padding: "6px 8px", fontWeight: isHighError ? 600 : 400 }}>{e.site}</td>
                        <td style={{ padding: "6px 8px", color: "#525252" }}>{e.tests}</td>
                        <td style={{ padding: "6px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 60, height: 6, background: "#e0e0e0", borderRadius: 3 }}>
                              <div style={{ width: `${e.utilization}%`, height: "100%", background: e.utilization > 70 ? "#198038" : e.utilization > 40 ? "#f59e0b" : "#da1e28", borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, color: "#525252" }}>{e.utilization}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <span style={{
                            background: isHighError ? "#fff1f1" : "#defbe6",
                            color: isHighError ? "#a2191f" : "#0e6027",
                            border: `1px solid ${isHighError ? "#ffb3b8" : "#a7f0ba"}`,
                            borderRadius: 2, padding: "2px 6px", fontSize: 11, fontWeight: 600,
                          }}>
                            {isHighError && "⚠ "}{e.errorRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Row 4: Geographic breakdown */}
        <Card>
          <SectionHeader title="Geographic Breakdown — Facility Level" subtitle="Results filterable by region → district → facility · Click to expand" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f4f4f4" }}>
                {["Region", "District", "Facility", "Tests", "Positivity", "Median TAT", "Reporting Status"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#525252", fontSize: 12, borderBottom: "1px solid #e0e0e0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GEO_DATA
                .filter(r => region === "ALL" || r.region === region)
                .map((row, i) => (
                  <tr key={row.facility} style={{ background: i % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "9px 12px", color: "#525252", fontSize: 12 }}>{row.region}</td>
                    <td style={{ padding: "9px 12px", color: "#525252", fontSize: 12 }}>{row.district}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 500 }}>{row.facility}</td>
                    <td style={{ padding: "9px 12px" }}>{row.tests}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{
                        fontWeight: 700,
                        color: row.positivity > 30 ? "#da1e28" : row.positivity > 25 ? "#b45309" : "#198038",
                      }}>
                        {row.positivity}%
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", color: row.tat > 6 ? "#b45309" : "#198038", fontWeight: 600 }}>
                      {row.tat}h
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{
                        background: row.status === "reporting" ? "#defbe6" : "#fff8e1",
                        color: row.status === "reporting" ? "#0e6027" : "#78350f",
                        border: `1px solid ${row.status === "reporting" ? "#a7f0ba" : "#fde68a"}`,
                        borderRadius: 2, padding: "2px 8px", fontSize: 11, fontWeight: 600,
                      }}>
                        {row.status === "reporting" ? "✓ Reporting" : "⚠ Late"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>

        {/* Footer */}
        <div style={{ marginTop: "1.25rem", padding: "0.75rem 0", borderTop: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#8d8d8d" }}>Source: OpenELIS Global · Central FHIR R4 Repository · Data as of 2026-03-23 06:00 UTC</span>
          <span style={{ fontSize: 11, color: "#8d8d8d" }}>Apache Superset · Powered by OpenELIS FHIR publication</span>
        </div>
      </div>
    </div>
  );
}
