import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// i18n stub
// ─────────────────────────────────────────────────────────────────────────────
const t = (key, fallback) => fallback || key;

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  blue60: "#0f62fe", blue70: "#0043ce", blue10: "#edf5ff", blue20: "#d0e2ff",
  green50: "#defbe6", green60: "#198038",
  red10: "#fff1f1", red60: "#da1e28",
  yellow10: "#fdf4c4", yellow70: "#8e6a00",
  gray10: "#f4f4f4", gray20: "#e0e0e0", gray30: "#c6c6c6",
  gray50: "#8d8d8d", gray70: "#525252", gray90: "#262626", gray100: "#161616",
  white: "#ffffff",
  sidebarBg: "#262626", topBarBg: "#161616", border: "#e0e0e0",
  teal60: "#007d79",
};

const SITE_COLORS = ["#0f62fe", "#8a3ffc", "#009d9a", "#da1e28"];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA (mirrors S-07 mockup)
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = ["May '25","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan '26","Feb","Mar","Apr"];

const TREND_DATA = MONTHS.map((month, i) => ({
  month,
  "SITE-042": [82,80,78,75,76,74,72,70,68,65,63,60][i],
  "SITE-017": [95,96,94,95,97,96,98,97,96,95,97,98][i],
  "SITE-088": [88,87,85,86,84,82,83,80,81,79,78,80][i],
  "SITE-023": [90,91,92,90,89,91,92,93,94,93,95,94][i],
}));

const DRILLDOWN_DATA = MONTHS.map((month, i) => ({
  month,
  pH:        [7.1,7.0,7.2,7.3,7.1,7.4,7.2,7.5,7.3,7.6,7.4,7.2][i],
  Turbidity: [3.2,3.5,3.8,4.0,4.2,4.1,4.5,4.3,4.6,4.8,4.7,3.8][i],
  Lead:      [0.018,0.020,0.022,0.025,0.024,0.027,0.028,0.030,0.029,0.031,0.033,0.032][i],
}));

const COMPARISON_DATA = [
  { site: "SITE-042", compliance: 60, label: "Intake A — Citarum" },
  { site: "SITE-017", compliance: 98, label: "Treatment Outlet" },
  { site: "SITE-088", compliance: 80, label: "Reservoir Jatiluhur" },
  { site: "SITE-023", compliance: 94, label: "Upstream Cimahi" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function Btn({ children, kind = "primary", onClick, disabled, small, icon }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: small ? "6px 12px" : "10px 20px",
    borderRadius: 2, fontSize: small ? 12 : 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", border: "none",
    opacity: disabled ? 0.5 : 1,
  };
  const s = {
    primary:   { ...base, background: C.blue60, color: C.white },
    secondary: { ...base, background: C.white, color: C.gray90, border: `1px solid ${C.gray30}` },
    ghost:     { ...base, background: "transparent", color: C.blue60 },
    danger:    { ...base, background: C.red60, color: C.white },
  }[kind] || base;
  return <button style={s} onClick={onClick} disabled={disabled}>{icon && <span>{icon}</span>}{children}</button>;
}

function Toggle({ on, onToggle, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={() => onToggle(!on)} style={{
        width: 48, height: 24, borderRadius: 12, border: "none",
        background: on ? C.blue60 : C.gray30,
        position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
      }}>
        <span style={{
          display: "block", width: 18, height: 18, borderRadius: "50%",
          background: C.white, position: "absolute", top: 3,
          left: on ? 27 : 3, transition: "left 0.2s",
        }} />
      </button>
      <span style={{ fontSize: 13, color: C.gray100 }}>{label}</span>
    </div>
  );
}

function Field({ label, value, onChange, helper }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.gray70 }}>{label}</label>
      {onChange
        ? <input value={value} onChange={e => onChange(e.target.value)}
            style={{ padding: "10px 12px", border: `1px solid ${C.gray30}`, borderRadius: 2, fontSize: 14 }} />
        : <div style={{ padding: "10px 12px", background: C.gray10, border: `1px solid ${C.gray20}`, borderRadius: 2, fontSize: 14, color: C.gray70 }}>{value}</div>
      }
      {helper && <span style={{ fontSize: 11, color: C.gray50 }}>{helper}</span>}
    </div>
  );
}

function Notif({ kind = "info", title, subtitle, onClose }) {
  const p = {
    info:    { bg: C.blue10,   border: C.blue60,   color: C.blue70,   icon: "ℹ" },
    success: { bg: C.green50,  border: C.green60,  color: C.green60,  icon: "✓" },
    warning: { bg: C.yellow10, border: C.yellow70, color: C.yellow70, icon: "⚠" },
    error:   { bg: C.red10,    border: C.red60,    color: C.red60,    icon: "✕" },
  }[kind];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 16px", borderRadius: 2,
      borderLeft: `4px solid ${p.border}`, background: p.bg,
    }}>
      <span style={{ color: p.color, fontWeight: 700, fontSize: 16 }}>{p.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: C.gray100 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.gray70, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {onClose && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.gray50 }}>×</button>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART PANEL WRAPPER — adds hover PNG button
// ─────────────────────────────────────────────────────────────────────────────
function ChartPanel({ title, subtitle, onExportPng, children }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 2, padding: "20px 24px", position: "relative",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gray100 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.gray70, marginTop: 2 }}>{subtitle}</div>}
        </div>

        {/* PNG download button — S-07b NEW — shown on hover */}
        <div style={{
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s",
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
        }}>
          <NewRegion label="S-07b NEW">
            <button
              onClick={onExportPng}
              title={t("envDashboard.export.png.tooltip", "Download this chart as a PNG image")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 2, border: `1px solid ${C.gray30}`,
                background: C.white, color: C.blue60, fontSize: 12, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 14 }}>⬇</span>
              {t("envDashboard.export.png.button", "PNG")}
            </button>
          </NewRegion>
        </div>
      </div>

      {/* Chart body — existing S-07 content, shown as context */}
      <div style={{ opacity: 0.72, pointerEvents: "none", userSelect: "none" }}>
        <div style={{ position: "absolute", top: 48, right: 12, zIndex: 0 }}>
          <ExistingBadge />
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EXPORT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PdfExportModal({ onClose, onExport }) {
  const [step, setStep] = useState("config"); // config | generating | success | error
  const [title, setTitle] = useState("Environmental Compliance Dashboard");
  const [preparedBy, setPreparedBy] = useState("Siti Nurhaliza");
  const [coverPage, setCoverPage] = useState(true);
  const [exceedanceTable, setExceedanceTable] = useState(true);

  const handleExport = () => {
    setStep("generating");
    setTimeout(() => setStep("success"), 2200);
  };

  const filename = "ENV_Dashboard_SITE-042_2025-05-01_2026-04-20.pdf";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: C.white, borderRadius: 2, width: 560,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}>
        {/* Modal header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {t("envDashboard.export.pdf.modal.title", "Export Dashboard PDF")}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.gray50 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>

          {step === "config" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Field
                label={t("envDashboard.export.pdf.modal.reportTitle", "Report Title")}
                value={title} onChange={setTitle}
                helper="Max 120 characters"
              />
              <Field
                label={t("envDashboard.export.pdf.modal.preparedBy", "Prepared By")}
                value={preparedBy} onChange={setPreparedBy}
              />

              {/* Active filters — read-only */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.gray70, marginBottom: 8 }}>
                  {t("envDashboard.export.pdf.modal.activeFilters", "Active Filters")} <span style={{ fontWeight: 400, color: C.gray50 }}>(read-only — change filters on dashboard)</span>
                </div>
                <div style={{
                  background: C.gray10, border: `1px solid ${C.gray20}`, borderRadius: 2,
                  padding: "12px 14px", fontSize: 13, display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div><span style={{ color: C.gray70 }}>Site: </span><strong>Intake Point A — Citarum River (SITE-042)</strong></div>
                  <div><span style={{ color: C.gray70 }}>Date range: </span><strong>01 May 2025 → 20 Apr 2026</strong></div>
                  <div><span style={{ color: C.gray70 }}>Standard: </span><strong>Permenkes No. 492 / 2010 — Drinking Water</strong></div>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Toggle on={coverPage} onToggle={setCoverPage}
                  label={t("envDashboard.export.pdf.modal.coverPage", "Include Cover Page")} />
                <Toggle on={exceedanceTable} onToggle={setExceedanceTable}
                  label={t("envDashboard.export.pdf.modal.exceedanceTable", "Include Exceedance Table")} />
              </div>

              {/* Pages preview */}
              <div style={{ background: C.blue10, borderRadius: 2, padding: "10px 14px", fontSize: 12, color: C.blue70 }}>
                <strong>PDF will contain:</strong>{" "}
                {[
                  coverPage && "Cover page",
                  "Compliance Rate Trend (p.2)",
                  "Site Drill-Down (p.3)",
                  "Site Comparison (p.4)",
                  exceedanceTable && "Exceedance Table (final page)",
                ].filter(Boolean).join(" · ")}
              </div>
            </div>
          )}

          {step === "generating" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "20px 0" }}>
              <div style={{ fontSize: 32 }}>📄</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.gray100 }}>
                {t("envDashboard.export.pdf.generating", "Generating PDF…")}
              </div>
              {/* Indeterminate progress bar */}
              <div style={{ width: "100%", height: 8, background: C.gray20, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: "40%", background: C.blue60, borderRadius: 4,
                  animation: "slide 1.4s ease-in-out infinite",
                }} />
              </div>
              <style>{`@keyframes slide { 0%{margin-left:0;width:30%} 50%{margin-left:35%;width:50%} 100%{margin-left:100%;width:30%} }`}</style>
              <div style={{ fontSize: 12, color: C.gray50 }}>
                Rendering 4 pages · Timeout in 30 s
              </div>
            </div>
          )}

          {step === "success" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Notif
                kind="success"
                title={t("envDashboard.export.pdf.success", `Dashboard exported successfully — ${filename}`)}
                subtitle="The file has been downloaded to your browser's default download folder."
              />
              <div style={{
                background: C.gray10, borderRadius: 2, padding: "12px 14px",
                fontSize: 13, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{filename}</div>
                  <div style={{ fontSize: 12, color: C.gray50 }}>4 pages · PDF · Generated 20 Apr 2026 08:42 WIB</div>
                </div>
              </div>
            </div>
          )}

          {step === "error" && (
            <Notif
              kind="error"
              title="Export failed"
              subtitle="The server did not respond within 30 seconds. Please try again or reduce the date range."
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px", borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "flex-end", gap: 10,
        }}>
          {step === "config" && <>
            <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
            <Btn kind="primary" onClick={handleExport} icon="📄">
              {t("envDashboard.export.pdf.modal.confirm", "Export PDF")}
            </Btn>
          </>}
          {step === "generating" && <>
            <Btn kind="ghost" disabled>Cancel</Btn>
            <Btn kind="primary" disabled icon="📄">Generating…</Btn>
          </>}
          {(step === "success" || step === "error") && (
            <Btn kind="secondary" onClick={onClose}>Close</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PNG DOWNLOAD TOAST
// ─────────────────────────────────────────────────────────────────────────────
function PngToast({ chart, onClose }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 900, width: 380,
    }}>
      <Notif
        kind="success"
        title={`PNG downloaded — ${chart}`}
        subtitle="Saved to your downloads folder."
        onClose={onClose}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE ANNOTATION BADGE — marks elements as S-07b new vs S-07 existing
// ─────────────────────────────────────────────────────────────────────────────
function NewBadge({ label = "S-07b NEW" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700,
      background: "#fff3cd", color: "#7d5200",
      border: "1px solid #f1c21b", letterSpacing: 0.3, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function ExistingBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700,
      background: C.gray10, color: C.gray50, border: `1px solid ${C.gray30}`,
      letterSpacing: 0.3, whiteSpace: "nowrap",
    }}>S-07 existing</span>
  );
}

// Wrapper that draws an orange dashed ring around new S-07b elements
function NewRegion({ children, label }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", inset: -4, borderRadius: 4,
        border: "2px dashed #f1c21b", pointerEvents: "none", zIndex: 1,
      }} />
      {label && (
        <div style={{
          position: "absolute", top: -12, left: 6, zIndex: 2,
        }}>
          <NewBadge label={label} />
        </div>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD SCENE
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard() {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pngToast, setPngToast] = useState(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const handlePng = (chartName) => {
    setPngToast(chartName);
    setTimeout(() => setPngToast(null), 3500);
  };

  return (
    <div style={{ padding: "24px 32px" }}>

      {/* ── SCOPE BANNER ───────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: 20, padding: "12px 16px", borderRadius: 2,
        background: "#fffbe6", border: "1px solid #f1c21b",
        display: "flex", gap: 12, alignItems: "flex-start", fontSize: 13,
      }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>📐</span>
        <div>
          <strong style={{ color: C.gray100 }}>S-07b scope annotation — read before reviewing</strong>
          <div style={{ color: C.gray70, marginTop: 4, lineHeight: 1.6 }}>
            The dashboard layout, charts, filters, and KPI tiles below are{" "}
            <strong>defined in S-07 / OGC-553</strong> and are shown here as context only — they are not re-specified by S-07b.
            <br />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              <span style={{ width: 24, height: 2, background: "#f1c21b", display: "inline-block", border: "1px dashed #7d5200", borderRadius: 1 }} />
              <strong style={{ color: "#7d5200" }}>Gold dashed border = S-07b addition.</strong>
            </span>{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <ExistingBadge />
              <span>= unchanged S-07 element.</span>
            </span>
          </div>
        </div>
      </div>

      {/* PDF success inline notification (toolbar area) */}
      {pdfSuccess && (
        <div style={{ marginBottom: 16 }}>
          <Notif
            kind="success"
            title="Dashboard exported — ENV_Dashboard_SITE-042_2025-05-01_2026-04-20.pdf"
            onClose={() => setPdfSuccess(false)}
          />
        </div>
      )}

      {/* Page header + toolbar */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.gray100, margin: 0 }}>
            Environmental Compliance Dashboard
          </h1>
          <p style={{ fontSize: 13, color: C.gray70, marginTop: 4 }}>
            Site: Intake Point A — Citarum River (SITE-042) · May 2025 – Apr 2026 · Permenkes 492/2010
          </p>
        </div>

        {/* Toolbar actions */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* Existing CSV export — S-07 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Btn kind="secondary" small icon="↓">CSV</Btn>
            <ExistingBadge />
          </div>

          {/* NEW S-07b: Export PDF button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <NewRegion label="S-07b NEW">
              <Btn kind="secondary" small icon="📄" onClick={() => setShowPdfModal(true)}>
                {t("envDashboard.export.pdf.button", "Export PDF")}
              </Btn>
            </NewRegion>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Chart 1 — Compliance Rate Trend */}
        <ChartPanel
          title={t("envDashboard.chart.complianceTrend", "Compliance Rate Trend — All Sites")}
          subtitle="Monthly compliance % · 12-month rolling"
          onExportPng={() => handlePng("ENV_ComplianceTrend_ALL_2026-04-20.png")}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={TREND_DATA} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.gray20} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[55, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={80} stroke={C.yellow70} strokeDasharray="4 4" label={{ value: "80% threshold", fontSize: 10, fill: C.yellow70 }} />
              {["SITE-042","SITE-017","SITE-088","SITE-023"].map((s, i) => (
                <Line key={s} type="monotone" dataKey={s} stroke={SITE_COLORS[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Chart 2 — Site Drill-Down */}
        <ChartPanel
          title={t("envDashboard.chart.drillDown", "Site Drill-Down — Intake Point A (SITE-042)")}
          subtitle="Per-parameter trend · pH, Turbidity, Lead"
          onExportPng={() => handlePng("ENV_DrillDown_SITE-042_2026-04-20.png")}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={DRILLDOWN_DATA} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.gray20} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="pH" stroke="#0f62fe" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Turbidity" stroke="#8a3ffc" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Lead" stroke="#da1e28" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Chart 3 — Site Comparison */}
        <ChartPanel
          title={t("envDashboard.chart.siteComparison", "Site Comparison — Current Period Compliance %")}
          subtitle="All sites · Apr 2026"
          onExportPng={() => handlePng("ENV_SiteComparison_ALL_2026-04-20.png")}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={COMPARISON_DATA} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.gray20} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={112} />
              <Tooltip formatter={v => `${v}%`} />
              <ReferenceLine x={80} stroke={C.yellow70} strokeDasharray="4 4" />
              <Bar dataKey="compliance" fill={C.blue60} radius={[0, 2, 2, 0]}>
                {COMPARISON_DATA.map((entry, i) => (
                  <rect key={i} fill={entry.compliance < 80 ? C.red60 : C.blue60} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

      </div>

      {/* Interaction guide */}
      <div style={{
        marginTop: 20, padding: "12px 16px", background: C.blue10,
        border: `1px solid ${C.blue20}`, borderRadius: 2, fontSize: 12, color: C.blue70,
        lineHeight: 1.7,
      }}>
        <strong>S-07b interactions to try:</strong>
        <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
          <li>Hover over a chart panel → <strong>⬇ PNG</strong> button appears (top-right, gold border)</li>
          <li>Click <strong>Export PDF</strong> in the toolbar → config modal → step through to success state</li>
          <li>Switch to <strong>Scene 2</strong> to see the generated PDF page layout</li>
        </ul>
        <div style={{ marginTop: 8, color: C.gray70 }}>
          Charts, filters, and KPI tiles are S-07 / OGC-553 — not re-specified here.
        </div>
      </div>

      {/* Modals & toasts */}
      {showPdfModal && (
        <PdfExportModal
          onClose={() => setShowPdfModal(false)}
          onExport={() => { setShowPdfModal(false); setPdfSuccess(true); }}
        />
      )}
      {pngToast && <PngToast chart={pngToast} onClose={() => setPngToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF LAYOUT PREVIEW SCENE — shows what the exported PDF pages look like
// ─────────────────────────────────────────────────────────────────────────────
function PdfPreview() {
  const [page, setPage] = useState(1);
  const totalPages = 5;

  const pages = [
    {
      label: "Cover Page",
      content: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
          <div style={{ fontSize: 12, color: C.gray50, letterSpacing: 2, textTransform: "uppercase" }}>UPTD Labkesda Kota Bogor</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.gray100, textAlign: "center" }}>Environmental Compliance Dashboard</div>
          <div style={{ width: 48, height: 3, background: C.blue60, borderRadius: 2 }} />
          <div style={{ fontSize: 13, color: C.gray70, textAlign: "center", lineHeight: 1.8 }}>
            <div><strong>Site:</strong> Intake Point A — Citarum River (SITE-042)</div>
            <div><strong>Period:</strong> 01 May 2025 – 20 April 2026</div>
            <div><strong>Standard:</strong> Permenkes No. 492 / 2010</div>
            <div><strong>Prepared by:</strong> Siti Nurhaliza</div>
            <div><strong>Generated:</strong> 20 Apr 2026 · 08:42 WIB (UTC+7)</div>
          </div>
          <div style={{ marginTop: 12, padding: "8px 16px", background: C.gray10, borderRadius: 2, fontSize: 11, color: C.gray50 }}>
            Generated by OpenELIS Global
          </div>
        </div>
      ),
    },
    {
      label: "Page 2 — Compliance Trend",
      content: (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Compliance Rate Trend — All Sites</div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gray20} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[55,100]} tickFormatter={v=>`${v}%`} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={80} stroke={C.yellow70} strokeDasharray="4 4" />
                {["SITE-042","SITE-017","SITE-088","SITE-023"].map((s,i)=>(
                  <Line key={s} type="monotone" dataKey={s} stroke={SITE_COLORS[i]} strokeWidth={1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      label: "Page 3 — Site Drill-Down",
      content: (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Site Drill-Down — SITE-042 · Per-Parameter Trend</div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={DRILLDOWN_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gray20} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="pH" stroke="#0f62fe" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Turbidity" stroke="#8a3ffc" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Lead" stroke="#da1e28" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      label: "Page 4 — Site Comparison",
      content: (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Site Comparison — April 2026 Compliance %</div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={COMPARISON_DATA} layout="vertical" margin={{ left: 120, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gray20} horizontal={false} />
                <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={112} />
                <Tooltip formatter={v=>`${v}%`} />
                <ReferenceLine x={80} stroke={C.yellow70} strokeDasharray="4 4" />
                <Bar dataKey="compliance" fill={C.blue60} radius={[0,2,2,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      label: "Page 5 — Exceedance Table",
      content: (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Exceedance Summary</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: C.gray10 }}>
                {["Date","Lab #","Parameter","Result","Threshold","Status"].map(h => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.gray70 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["04/04/2026","ENV-2026-001","Lead (Pb)","0.032 mg/L","≤0.03","FAIL"],
                ["04/04/2026","ENV-2026-001","E. coli","45 CFU/100mL","≤50","MARGINAL"],
                ["03/03/2026","ENV-2026-018","Lead (Pb)","0.033 mg/L","≤0.03","FAIL"],
                ["02/02/2026","ENV-2026-035","Turbidity","5.2 NTU","≤5.0","FAIL"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: "6px 8px",
                      color: j === 5 ? (cell === "FAIL" ? C.red60 : C.yellow70) : C.gray100,
                      fontWeight: j === 5 ? 600 : 400,
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px 32px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.gray100, marginBottom: 6 }}>PDF Layout Preview</h2>
      <p style={{ fontSize: 13, color: C.gray70, marginBottom: 20 }}>
        A4 portrait · {totalPages} pages · Cover page + 3 chart pages + exceedance table
      </p>

      {/* Page selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {pages.map((p, i) => (
          <button key={i} onClick={() => setPage(i + 1)} style={{
            padding: "6px 12px", borderRadius: 2, fontSize: 12,
            border: `1px solid ${page === i + 1 ? C.blue60 : C.gray30}`,
            background: page === i + 1 ? C.blue10 : C.white,
            color: page === i + 1 ? C.blue70 : C.gray90,
            fontWeight: page === i + 1 ? 600 : 400, cursor: "pointer",
          }}>{p.label}</button>
        ))}
      </div>

      {/* A4 page mockup */}
      <div style={{
        width: 520, minHeight: 735, background: C.white,
        border: `1px solid ${C.gray30}`,
        boxShadow: "2px 2px 12px rgba(0,0,0,0.12)",
        padding: "32px 36px",
        display: "flex", flexDirection: "column",
        position: "relative",
      }}>
        {/* Page content */}
        <div style={{ flex: 1 }}>
          {pages[page - 1]?.content}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${C.gray20}`, paddingTop: 10, marginTop: 20,
          display: "flex", justifyContent: "space-between",
          fontSize: 10, color: C.gray50,
        }}>
          <span>UPTD Labkesda Kota Bogor</span>
          <span>Page {page} of {totalPages}</span>
          <span>Generated by OpenELIS Global</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHELL
// ─────────────────────────────────────────────────────────────────────────────
function Shell({ activeScene, setScene }) {
  const SCENES = [
    { key: "dashboard", label: "1 — Dashboard + hover PNG" },
    { key: "pdf",       label: "2 — PDF layout preview" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.gray10, fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Top bar */}
      <div style={{
        background: C.topBarBg, height: 48, display: "flex", alignItems: "center",
        padding: "0 16px", position: "sticky", top: 0, zIndex: 200,
      }}>
        <span style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>OpenELIS Global</span>
        <span style={{ marginLeft: 16, fontSize: 11, color: "#a8a8a8", padding: "2px 8px", background: "#3d3d3d", borderRadius: 10 }}>
          S-07b — Chart PNG & Dashboard PDF Export
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {SCENES.map(s => (
            <button key={s.key} onClick={() => setScene(s.key)} style={{
              padding: "5px 12px", borderRadius: 2, border: "none",
              background: activeScene === s.key ? C.blue60 : "#3d3d3d",
              color: C.white, fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ display: "flex" }}>
        <div style={{ width: 224, background: C.sidebarBg, minHeight: "calc(100vh - 48px)", flexShrink: 0 }}>
          {[
            { label: "Dashboard", icon: "⊞", active: true },
            { label: "Orders", icon: "📋" },
            { label: "Results", icon: "🔬" },
            { label: "Laporan Hasil", icon: "📄" },
            { label: "Sent Messages", icon: "✉" },
            { label: "Admin", icon: "⚙" },
          ].map(item => (
            <div key={item.label} style={{
              padding: "11px 16px", display: "flex", alignItems: "center", gap: 12,
              background: item.active ? C.blue60 : "transparent",
              borderLeft: item.active ? "3px solid #fff" : "3px solid transparent",
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: item.active ? C.white : "#c6c6c6", fontWeight: item.active ? 600 : 400 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {activeScene === "dashboard" && <Dashboard />}
          {activeScene === "pdf" && <PdfPreview />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [scene, setScene] = useState("dashboard");
  return <Shell activeScene={scene} setScene={setScene} />;
}
