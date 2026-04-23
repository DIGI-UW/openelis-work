/**
 * S-07 Environmental Dashboard & Trend Analysis — Mockup v1.0
 * OpenELIS Global
 *
 * Single-page dashboard: KPI cards, compliance rate trend chart (site-level),
 * site drill-down (per-parameter), exceedance summary table, site comparison
 * bar chart. Filters: date range, site, standard. CSV export via OverflowMenu.
 *
 * Uses recharts for charting (same pattern as disease-surveillance-dashboard).
 * Carbon Design System components from @carbon/react.
 */
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Package, CheckCircle2,
  AlertTriangle, MapPin, RefreshCw, Download, ChevronLeft,
  Search, MoreVertical, FileText, X
} from "lucide-react";

// ---------------------------------------------------------------------------
// i18n stub
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  blue60: "#0f62fe", blue70: "#0043ce",
  gray10: "#f4f4f4", gray20: "#e0e0e0", gray30: "#c6c6c6",
  gray50: "#8d8d8d", gray60: "#6f6f6f", gray70: "#525252",
  gray80: "#393939", gray90: "#262626", gray100: "#161616",
  white: "#ffffff",
  green50: "#24a148", green10: "#defbe6", greenText: "#0e6027",
  yellow30: "#f1c21b", yellow10: "#fcf4d6", yellowText: "#6e4b00",
  red50: "#da1e28", red10: "#fff1f1",
  teal50: "#009d9a", purple60: "#8a3ffc",
};

const SITE_COLORS = ["#0f62fe", "#8a3ffc", "#009d9a", "#da1e28", "#f1c21b", "#6f6f6f"];

// ---------------------------------------------------------------------------
// Mock data — monthly compliance trends per site (12 months)
// ---------------------------------------------------------------------------
const MONTHS = [
  "May 2025", "Jun 2025", "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025",
  "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"
];

const SITES = [
  { id: 42, name: "Intake Point A — Citarum River", code: "SITE-042", gps: "-6.7254, 107.6048" },
  { id: 17, name: "Treatment Plant Outlet — Cisangkuy", code: "SITE-017", gps: "-6.9175, 107.6191" },
  { id: 88, name: "Reservoir Jatiluhur — Dam Outlet", code: "SITE-088", gps: "-6.5288, 107.3847" },
  { id: 23, name: "Upstream Intake — Cimahi", code: "SITE-023", gps: "-6.8723, 107.5419" },
];

const TREND_DATA = MONTHS.map((month, i) => ({
  month,
  "SITE-042": [82, 80, 78, 75, 76, 74, 72, 70, 68, 65, 63, 60][i],
  "SITE-017": [95, 96, 94, 95, 97, 96, 98, 97, 96, 95, 97, 98][i],
  "SITE-088": [88, 87, 85, 86, 84, 82, 83, 80, 81, 79, 78, 80][i],
  "SITE-023": [90, 91, 92, 90, 89, 91, 92, 93, 94, 93, 95, 94][i],
}));

// Mock drill-down data for SITE-042
const DRILLDOWN_DATA = MONTHS.map((month, i) => ({
  month,
  pH:        [7.1, 7.0, 7.2, 7.3, 7.1, 7.4, 7.2, 7.5, 7.3, 7.6, 7.4, 7.2][i],
  Turbidity: [3.2, 3.5, 3.8, 4.0, 4.2, 4.1, 4.5, 4.3, 4.6, 4.8, 4.7, 3.8][i],
  Lead:      [0.018, 0.020, 0.022, 0.025, 0.024, 0.027, 0.028, 0.030, 0.029, 0.031, 0.033, 0.032][i],
  EColi:     [12, 15, 18, 22, 25, 28, 30, 35, 38, 40, 42, 45][i],
}));

const DRILLDOWN_THRESHOLDS = {
  pH:        { type: "RANGE", min: 6.5, max: 8.5 },
  Turbidity: { type: "MAX", max: 5.0 },
  Lead:      { type: "MAX", max: 0.03 },
  EColi:     { type: "MAX", max: 50 },
};

const PARAM_COLORS = { pH: "#0f62fe", Turbidity: "#8a3ffc", Lead: "#da1e28", EColi: "#009d9a" };
const PARAM_UNITS  = { pH: "pH", Turbidity: "NTU", Lead: "mg/L", EColi: "CFU/100mL" };

// Mock exceedances
const EXCEEDANCES = [
  { date: "04/04/2026", labNumber: "ENV-2026-001", site: "Intake Point A — Citarum River", siteCode: "SITE-042", parameter: "Lead (Pb)", result: "0.032 mg/L", threshold: "≤0.03", status: "FAIL" },
  { date: "04/04/2026", labNumber: "ENV-2026-001", site: "Intake Point A — Citarum River", siteCode: "SITE-042", parameter: "E. coli", result: "45 CFU/100mL", threshold: "≤50", status: "MARGINAL" },
  { date: "03/03/2026", labNumber: "ENV-2026-018", site: "Intake Point A — Citarum River", siteCode: "SITE-042", parameter: "Lead (Pb)", result: "0.033 mg/L", threshold: "≤0.03", status: "FAIL" },
  { date: "03/03/2026", labNumber: "ENV-2026-018", site: "Intake Point A — Citarum River", siteCode: "SITE-042", parameter: "Turbidity", result: "4.7 NTU", threshold: "≤5.0", status: "MARGINAL" },
  { date: "02/02/2026", labNumber: "ENV-2026-035", site: "Reservoir Jatiluhur — Dam Outlet", siteCode: "SITE-088", parameter: "Turbidity", result: "5.2 NTU", threshold: "≤5.0", status: "FAIL" },
  { date: "01/01/2026", labNumber: "ENV-2026-048", site: "Intake Point A — Citarum River", siteCode: "SITE-042", parameter: "Lead (Pb)", result: "0.031 mg/L", threshold: "≤0.03", status: "FAIL" },
  { date: "12/12/2025", labNumber: "ENV-2025-112", site: "Reservoir Jatiluhur — Dam Outlet", siteCode: "SITE-088", parameter: "E. coli", result: "48 CFU/100mL", threshold: "≤50", status: "MARGINAL" },
];

// Mock site comparison
const SITE_COMPARISON = [
  { site: "Intake Point A — Citarum River", code: "SITE-042", rate: 60, orders: 24 },
  { site: "Reservoir Jatiluhur — Dam Outlet", code: "SITE-088", rate: 80, orders: 18 },
  { site: "Upstream Intake — Cimahi", code: "SITE-023", rate: 94, orders: 20 },
  { site: "Treatment Plant Outlet — Cisangkuy", code: "SITE-017", rate: 98, orders: 22 },
].sort((a, b) => a.rate - b.rate);

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KpiCard({ icon, label, value, unit, trend, trendLabel, color }) {
  const trendColor = trend === "UP" ? C.green50 : trend === "DOWN" ? C.red50 : C.gray50;
  const TrendIcon = trend === "UP" ? TrendingUp : trend === "DOWN" ? TrendingDown : Minus;
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 4,
      padding: "16px 20px", flex: "1 1 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, color: C.gray60 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: C.gray100 }}>
        {value}{unit && <span style={{ fontSize: 16, fontWeight: 400, color: C.gray60 }}>{unit}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, color: trendColor }}>
        <TrendIcon size={14} />
        <span>{trendLabel}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusTag
// ---------------------------------------------------------------------------
function StatusTag({ status }) {
  const cfg = status === "FAIL"
    ? { bg: C.red10, color: C.red50, label: t("label.envDashboard.nonCompliant", "Non-Compliant") }
    : { bg: C.yellow10, color: C.yellowText, label: t("label.envDashboard.marginal", "Marginal") };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 24, fontSize: 12, fontWeight: 500,
      background: cfg.bg, color: cfg.color,
    }}>
      {status === "FAIL" ? "✗" : "⚠"} {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ComplianceBar (for site comparison)
// ---------------------------------------------------------------------------
function ComplianceBar({ site, code, rate, orders }) {
  const barColor = rate >= 90 ? C.green50 : rate >= 70 ? C.yellow30 : C.red50;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <div style={{ width: 220, fontSize: 13, color: C.gray90, flexShrink: 0 }}>
        <div>{site}</div>
        <div style={{ fontSize: 11, color: C.gray50 }}>{code} · {orders} orders</div>
      </div>
      <div style={{ flex: 1, background: C.gray10, borderRadius: 4, height: 24, position: "relative" }}>
        <div style={{
          width: `${rate}%`, height: "100%", background: barColor,
          borderRadius: 4, transition: "width 0.3s",
        }} />
        <span style={{
          position: "absolute", right: 8, top: 3, fontSize: 12, fontWeight: 600,
          color: rate > 50 ? C.white : C.gray90,
        }}>
          {rate}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip for trend chart
// ---------------------------------------------------------------------------
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 4,
      padding: "8px 12px", fontSize: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => {
        const site = SITES.find(s => s.code === p.dataKey);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
            <span style={{ color: C.gray70 }}>{site ? site.name : p.dataKey}:</span>
            <span style={{ fontWeight: 600 }}>{p.value}%</span>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================================
// Main Dashboard Component
// =====================================================================
export default function EnvironmentalDashboard() {
  const [drilldownSite, setDrilldownSite] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const drillSiteInfo = drilldownSite ? SITES.find(s => s.code === drilldownSite) : null;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: C.gray10, minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.gray20}`, padding: "24px 32px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <TrendingUp size={20} color={C.blue60} />
          <span style={{ fontSize: 14, color: C.gray60 }}>{t("nav.reports", "Reports")} /</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: C.gray100, margin: "4px 0" }}>
          {t("heading.envDashboard.title", "Environmental Dashboard — Compliance Trends")}
        </h1>
        <p style={{ fontSize: 14, color: C.gray60, margin: 0 }}>
          {t("heading.envDashboard.subtitle", "Monitor compliance rates, exceedance trends, and site performance over time")}
        </p>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {/* Filters toolbar */}
        <div style={{
          background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 4,
          padding: "12px 16px", marginBottom: 16,
          display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end",
        }}>
          <FilterField label={t("label.envDashboard.filter.dateFrom", "Date From")}>
            <input type="date" defaultValue="2025-05-01" style={inputStyle} />
          </FilterField>
          <FilterField label={t("label.envDashboard.filter.dateTo", "Date To")}>
            <input type="date" defaultValue="2026-04-10" style={inputStyle} />
          </FilterField>
          <FilterField label={t("label.envDashboard.filter.site", "Sampling Site")}>
            <select style={inputStyle}>
              <option>{t("label.envDashboard.filter.allSites", "All Sites")}</option>
              {SITES.map(s => <option key={s.id}>{s.code} — {s.name}</option>)}
            </select>
          </FilterField>
          <FilterField label={t("label.envDashboard.filter.standard", "Compliance Standard")}>
            <select style={inputStyle}>
              <option>{t("label.envDashboard.filter.allStandards", "All Standards")}</option>
              <option>PP No. 22/2021</option>
            </select>
          </FilterField>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button style={toolbarBtnStyle} title={t("button.envDashboard.refresh", "Refresh")}>
              <RefreshCw size={14} /> {t("button.envDashboard.refresh", "Refresh")}
            </button>
            <div style={{ position: "relative" }}>
              <button style={toolbarBtnStyle} onClick={() => setShowExport(!showExport)}>
                <Download size={14} /> {t("button.envDashboard.export", "Export")}
              </button>
              {showExport && (
                <div style={{
                  position: "absolute", top: "100%", right: 0, marginTop: 4, zIndex: 10,
                  background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 4,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: 220,
                }}>
                  {[
                    t("button.envDashboard.exportTrends", "Export Compliance Trends (CSV)"),
                    t("button.envDashboard.exportExceedances", "Export Exceedance List (CSV)"),
                    t("button.envDashboard.exportSiteComparison", "Export Site Comparison (CSV)"),
                  ].map((label, i) => (
                    <button key={i} style={exportItemStyle}>{label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11, color: C.gray50 }}>
            {t("label.envDashboard.lastUpdated", "Last updated:")} 10/04/2026 08:15
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <KpiCard
            icon={<Package size={16} />}
            label={t("label.envDashboard.totalOrders", "Total Orders")}
            value={84} color={C.blue60}
            trend="UP" trendLabel={t("label.envDashboard.trendUp", "↑ 12% vs prior period")}
          />
          <KpiCard
            icon={<CheckCircle2 size={16} />}
            label={t("label.envDashboard.complianceRate", "Compliance Rate")}
            value="83.0" unit="%" color={C.green50}
            trend="DOWN" trendLabel={t("label.envDashboard.trendDown", "↓ 4.2% vs prior period")}
          />
          <KpiCard
            icon={<AlertTriangle size={16} />}
            label={t("label.envDashboard.totalExceedances", "Total Exceedances")}
            value={42} color={C.red50}
            trend="UP" trendLabel="↑ 8 more vs prior period"
          />
          <KpiCard
            icon={<MapPin size={16} />}
            label={t("label.envDashboard.sitesMonitored", "Sites Monitored")}
            value={4} color={C.teal50}
            trend="STABLE" trendLabel={t("label.envDashboard.trendStable", "— Stable")}
          />
        </div>

        {/* Primary trend chart + site comparison side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Compliance rate trend chart */}
          <div style={{ background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 4, padding: 20 }}>
            <h3 style={chartTitleStyle}>
              {t("heading.envDashboard.complianceTrend", "Compliance Rate by Site")}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={TREND_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gray20} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.gray60 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: C.gray60 }}
                  tickFormatter={v => `${v}%`} />
                <Tooltip content={<TrendTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={100} stroke={C.gray30} strokeDasharray="6 3"
                  label={{ value: "100%", position: "right", fontSize: 10, fill: C.gray50 }} />
                {SITES.map((site, i) => (
                  <Line key={site.code} type="monotone" dataKey={site.code} name={site.name}
                    stroke={SITE_COLORS[i]} strokeWidth={2} dot={{ r: 3 }}
                    activeDot={{ r: 5, cursor: "pointer", onClick: () => setDrilldownSite(site.code) }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 11, color: C.gray50, marginTop: 8, textAlign: "center" }}>
              {t("label.envDashboard.clickToDrill", "Click a data point to drill into per-parameter trends")}
            </p>
          </div>

          {/* Site comparison bar chart */}
          <div style={{ background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 4, padding: 20 }}>
            <h3 style={chartTitleStyle}>
              {t("heading.envDashboard.siteComparison", "Site Comparison")}
            </h3>
            <div style={{ marginTop: 16 }}>
              {SITE_COMPARISON.map((s, i) => (
                <ComplianceBar key={i} site={s.site} code={s.code} rate={s.rate} orders={s.orders} />
              ))}
            </div>
          </div>
        </div>

        {/* Drill-down panel (visible when a site is selected) */}
        {drillSiteInfo && (
          <div style={{
            background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 4,
            padding: 20, marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <button style={backBtnStyle} onClick={() => setDrilldownSite(null)}>
                <ChevronLeft size={14} /> {t("button.envDashboard.backToOverview", "Back to overview")}
              </button>
              <h3 style={{ ...chartTitleStyle, margin: 0, flex: 1 }}>
                {t("heading.envDashboard.drilldown", `Parameter Trends — ${drillSiteInfo.name}`)}
              </h3>
            </div>
            <div style={{
              display: "flex", gap: 24, fontSize: 13, color: C.gray60,
              padding: "8px 0 16px", borderBottom: `1px solid ${C.gray20}`, marginBottom: 16,
            }}>
              <span><strong>{t("label.envDashboard.site", "Site")}:</strong> {drillSiteInfo.name} ({drillSiteInfo.code})</span>
              <span><strong>GPS:</strong> {drillSiteInfo.gps}</span>
              <span><strong>{t("label.envDashboard.totalOrders", "Orders")}:</strong> 24</span>
              <span><strong>{t("label.envDashboard.complianceRate", "Current Rate")}:</strong> 60%</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {Object.entries(PARAM_COLORS).map(([param, color]) => {
                const th = DRILLDOWN_THRESHOLDS[param];
                return (
                  <div key={param}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.gray80, marginBottom: 4 }}>
                      {param === "EColi" ? "E. coli" : param} ({PARAM_UNITS[param]})
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={DRILLDOWN_DATA} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.gray20} />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: C.gray50 }} interval={2} />
                        <YAxis tick={{ fontSize: 10, fill: C.gray60 }} />
                        <Tooltip formatter={(v) => [`${v} ${PARAM_UNITS[param]}`, param === "EColi" ? "E. coli" : param]} />
                        {th.max && (
                          <ReferenceLine y={th.max} stroke={C.red50} strokeDasharray="4 2"
                            label={{ value: `Max: ${th.max}`, position: "right", fontSize: 9, fill: C.red50 }} />
                        )}
                        {th.min && (
                          <ReferenceLine y={th.min} stroke={C.blue60} strokeDasharray="4 2"
                            label={{ value: `Min: ${th.min}`, position: "right", fontSize: 9, fill: C.blue60 }} />
                        )}
                        <Line type="monotone" dataKey={param} stroke={color} strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: C.gray50, marginTop: 8 }}>
              {t("label.envDashboard.descriptiveNote", "Descriptive parameters not shown: Odor")}
            </p>
          </div>
        )}

        {/* Exceedance summary table */}
        <div style={{ background: C.white, border: `1px solid ${C.gray20}`, borderRadius: 4 }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.gray20}`, display: "flex", alignItems: "center", gap: 12 }}>
            <h3 style={{ ...chartTitleStyle, margin: 0 }}>
              {t("heading.envDashboard.exceedances", "Exceedance Summary")}
            </h3>
            <span style={{ fontSize: 13, color: C.gray60 }}>
              {t("label.envDashboard.exceedanceCount", "7 exceedances found (4 non-compliant, 3 marginal)")}
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.gray10, borderBottom: `1px solid ${C.gray20}` }}>
                <th style={thStyle}>{t("label.envDashboard.date", "Date")}</th>
                <th style={thStyle}>{t("label.envDashboard.labNumber", "Lab Number")}</th>
                <th style={thStyle}>{t("label.envDashboard.site", "Site")}</th>
                <th style={thStyle}>{t("label.envDashboard.parameter", "Parameter")}</th>
                <th style={thStyle}>{t("label.envDashboard.result", "Result")}</th>
                <th style={thStyle}>{t("label.envDashboard.threshold", "Threshold")}</th>
                <th style={thStyle}>{t("label.envDashboard.status", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {EXCEEDANCES.map((ex, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.gray20}` }}>
                  <td style={tdStyle}>{ex.date}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{ex.labNumber}</td>
                  <td style={tdStyle}>
                    <div>{ex.site}</div>
                    <div style={{ fontSize: 11, color: C.gray50 }}>{ex.siteCode}</div>
                  </td>
                  <td style={tdStyle}>{ex.parameter}</td>
                  <td style={tdStyle}>{ex.result}</td>
                  <td style={tdStyle}>{ex.threshold}</td>
                  <td style={tdStyle}><StatusTag status={ex.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "8px 20px", fontSize: 12, color: C.gray50, borderTop: `1px solid ${C.gray20}` }}>
            Showing 1–7 of 7
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterField
// ---------------------------------------------------------------------------
function FilterField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: C.gray60 }}>{label}</label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const inputStyle = {
  padding: "6px 12px", fontSize: 14, border: `1px solid ${C.gray30}`,
  background: C.white, color: C.gray90, fontFamily: "inherit", minWidth: 140,
};

const thStyle = {
  padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600,
  color: C.gray60, textTransform: "uppercase", letterSpacing: 0.5,
};

const tdStyle = {
  padding: "10px 12px", verticalAlign: "top", color: C.gray90,
};

const chartTitleStyle = {
  fontSize: 14, fontWeight: 600, color: C.gray80, marginBottom: 12,
};

const toolbarBtnStyle = {
  background: C.white, border: `1px solid ${C.gray30}`, padding: "6px 12px",
  fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center",
  gap: 6, fontFamily: "inherit", color: C.gray80,
};

const backBtnStyle = {
  background: "none", border: `1px solid ${C.gray30}`, padding: "4px 12px",
  fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center",
  gap: 4, fontFamily: "inherit", color: C.blue60, borderRadius: 4,
};

const exportItemStyle = {
  display: "block", width: "100%", textAlign: "left", border: "none",
  background: "none", padding: "10px 16px", fontSize: 13, cursor: "pointer",
  fontFamily: "inherit", color: C.gray90, borderBottom: `1px solid ${C.gray10}`,
};
