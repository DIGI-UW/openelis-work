/**
 * S-06 Laporan Hasil — Compliance Report Mockup
 * OpenELIS Global
 *
 * Two screens:
 *   1. Reports → Laporan Hasil — Report generation page with filterable
 *      DataTable, batch selection, inline row expansion, and PDF generation.
 *   2. Admin → Report Configuration — Shared print configuration admin page
 *      with Accordion-grouped settings (Lab Identity, Accreditation,
 *      Page Layout, Numbering).
 *
 * Carbon Design System components from @carbon/react. All visible strings
 * externalized via t(key, fallback).
 */
import { useState } from "react";
import {
  FileText, Download, ChevronDown, ChevronRight, Eye,
  CheckCircle2, AlertTriangle, XCircle, Settings, Upload,
  Trash2, Image, Hash, Calendar, MapPin, FlaskConical,
  Shield, Pen, Clock, Package, Info, X
} from "lucide-react";

// ---------------------------------------------------------------------------
// i18n stub
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const COLORS = {
  carbon: {
    blue60: "#0f62fe",
    blue70: "#0043ce",
    gray10: "#f4f4f4",
    gray20: "#e0e0e0",
    gray30: "#c6c6c6",
    gray50: "#8d8d8d",
    gray60: "#6f6f6f",
    gray70: "#525252",
    gray80: "#393939",
    gray90: "#262626",
    gray100: "#161616",
    white: "#ffffff",
    green50: "#24a148",
    green10: "#defbe6",
    yellow30: "#f1c21b",
    yellow10: "#fcf4d6",
    red50: "#da1e28",
    red60: "#da1e28",
    red10: "#fff1f1",
    purple60: "#8a3ffc",
    teal50: "#009d9a",
  },
};

const TAG_CONFIG = {
  compliant:     { bg: COLORS.carbon.green10, color: "#0e6027", label: "All Compliant",  icon: "✓" },
  marginal:      { bg: COLORS.carbon.yellow10, color: "#6e4b00", label: "Marginal",       icon: "⚠" },
  non_compliant: { bg: COLORS.carbon.red10, color: COLORS.carbon.red50, label: "Non-Compliant", icon: "✗" },
};

const GEN_TAG = {
  generated:     { bg: COLORS.carbon.green10, color: "#0e6027", label: "Generated" },
  not_generated: { bg: COLORS.carbon.gray10, color: COLORS.carbon.gray60, label: "Not Yet Generated" },
};

// ---------------------------------------------------------------------------
// Mock data — eligible orders
// ---------------------------------------------------------------------------
const MOCK_ORDERS = [
  {
    orderId: 6789,
    labNumber: "ENV-2026-001",
    siteName: "Intake Point A — Citarum River",
    siteCode: "SITE-042",
    siteGps: { latitude: -6.7254, longitude: 107.6048 },
    standardName: "PP No. 22/2021 — Baku Mutu Air Permukaan",
    standardVersion: "2021-01",
    collectionDate: "2026-04-04T07:30:00+07:00",
    collectionMethod: "Manual Grab",
    testCount: 5,
    complianceStatus: "NON_COMPLIANT",
    passCount: 3,
    marginalCount: 1,
    failCount: 1,
    lastGeneratedAt: null,
    certificateNumber: null,
    conditions: {
      waterTemperature: 28.5,
      ambientTemperature: 31.2,
      weatherConditions: "Clear",
      preservationMethod: "HNO3 acidification",
    },
    evaluations: [
      { parameter: "pH",        group: "Physical",       result: "7.2",  unit: "pH",     threshold: "6.5–8.5", status: "PASS" },
      { parameter: "Turbidity", group: "Physical",       result: "3.8",  unit: "NTU",    threshold: "≤5.0",    status: "PASS" },
      { parameter: "Lead (Pb)", group: "Chemical — Inorganic", result: "0.032", unit: "mg/L", threshold: "≤0.03",  status: "FAIL" },
      { parameter: "E. coli",   group: "Microbiological", result: "45",   unit: "CFU/100mL", threshold: "≤50",  status: "MARGINAL" },
      { parameter: "Odor",      group: "Physical",       result: "Tidak berbau", unit: "—",  threshold: "Tidak berbau", status: "PASS", descriptive: true },
    ],
    signatures: {
      analyst:   { name: "Dwi Rahmawati, S.Si", title: "Lab Analyst", timestamp: "2026-04-04 14:22 WIB", meaning: "Authored" },
      validator: { name: "Dr. Bambang Sutrisno", title: "Lab Manager", timestamp: "2026-04-04 16:45 WIB", meaning: "Validated and Released" },
    },
  },
  {
    orderId: 6790,
    labNumber: "ENV-2026-002",
    siteName: "Treatment Plant Outlet — Cisangkuy",
    siteCode: "SITE-017",
    siteGps: { latitude: -6.9175, longitude: 107.6191 },
    standardName: "PP No. 22/2021 — Baku Mutu Air Permukaan",
    standardVersion: "2021-01",
    collectionDate: "2026-04-03T09:15:00+07:00",
    collectionMethod: "Composite (24h)",
    testCount: 4,
    complianceStatus: "COMPLIANT",
    passCount: 4,
    marginalCount: 0,
    failCount: 0,
    lastGeneratedAt: "2026-04-04T18:00:00+07:00",
    certificateNumber: "LHU-2026-0041",
    conditions: {
      waterTemperature: 26.1,
      ambientTemperature: 29.0,
      weatherConditions: "Overcast",
      preservationMethod: "Cold storage 4°C",
    },
    evaluations: [
      { parameter: "pH",        group: "Physical",        result: "7.0",  unit: "pH",     threshold: "6.5–8.5", status: "PASS" },
      { parameter: "Turbidity", group: "Physical",        result: "1.2",  unit: "NTU",    threshold: "≤5.0",    status: "PASS" },
      { parameter: "Lead (Pb)", group: "Chemical — Inorganic", result: "0.008", unit: "mg/L", threshold: "≤0.03", status: "PASS" },
      { parameter: "E. coli",   group: "Microbiological", result: "2",    unit: "CFU/100mL", threshold: "≤50",  status: "PASS" },
    ],
    signatures: {
      analyst:   { name: "Siti Aminah, S.T.", title: "Lab Analyst", timestamp: "2026-04-03 15:10 WIB", meaning: "Authored" },
      validator: { name: "Dr. Bambang Sutrisno", title: "Lab Manager", timestamp: "2026-04-03 17:30 WIB", meaning: "Validated and Released" },
    },
  },
  {
    orderId: 6791,
    labNumber: "ENV-2026-003",
    siteName: "Reservoir Jatiluhur — Dam Outlet",
    siteCode: "SITE-088",
    siteGps: { latitude: -6.5288, longitude: 107.3847 },
    standardName: "PP No. 22/2021 — Baku Mutu Air Permukaan",
    standardVersion: "2021-01",
    collectionDate: "2026-04-02T06:00:00+07:00",
    collectionMethod: "Manual Grab",
    testCount: 5,
    complianceStatus: "MARGINAL",
    passCount: 4,
    marginalCount: 1,
    failCount: 0,
    lastGeneratedAt: null,
    certificateNumber: null,
    conditions: {
      waterTemperature: 25.8,
      ambientTemperature: 27.4,
      weatherConditions: "Rain",
      preservationMethod: "None — analyzed within 6h",
    },
    evaluations: [
      { parameter: "pH",           group: "Physical",        result: "6.6",   unit: "pH",      threshold: "6.5–8.5", status: "PASS" },
      { parameter: "Turbidity",    group: "Physical",        result: "4.7",   unit: "NTU",     threshold: "≤5.0",    status: "MARGINAL" },
      { parameter: "Lead (Pb)",    group: "Chemical — Inorganic", result: "0.011", unit: "mg/L",  threshold: "≤0.03",  status: "PASS" },
      { parameter: "E. coli",      group: "Microbiological", result: "8",     unit: "CFU/100mL", threshold: "≤50",   status: "PASS" },
      { parameter: "Odor",         group: "Physical",        result: "Tidak berbau", unit: "—", threshold: "Tidak berbau", status: "PASS", descriptive: true },
    ],
    signatures: {
      analyst:   { name: "Dwi Rahmawati, S.Si", title: "Lab Analyst", timestamp: "2026-04-02 12:45 WIB", meaning: "Authored" },
      validator: { name: "Dr. Bambang Sutrisno", title: "Lab Manager", timestamp: "2026-04-02 15:20 WIB", meaning: "Validated and Released" },
    },
  },
];

// ---------------------------------------------------------------------------
// Mock data — report print configuration
// ---------------------------------------------------------------------------
const MOCK_CONFIG = {
  labName: "Laboratorium Lingkungan Hidup Daerah Jawa Barat",
  labSubtitle: "Dinas Lingkungan Hidup Provinsi Jawa Barat",
  addressLine1: "Jl. Naripan No. 25",
  addressLine2: "Bandung 40112, Jawa Barat, Indonesia",
  phone: "+62 22 420 3423",
  email: "lab@dlh.jabarprov.go.id",
  website: "https://dlh.jabarprov.go.id",
  accreditationNumber: "KAN LP-042-IDN",
  accreditationBody: "KAN",
  labLogo: null,
  accreditationLogo: null,
  footerText: "Sertifikat ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah. / This certificate is issued electronically and valid without wet signature.",
  showPageNumbers: true,
  pageNumberFormat: "PAGE_X_OF_Y",
  dateFormat: "DD/MM/YYYY",
  certificatePrefix: "LHU",
};

// ---------------------------------------------------------------------------
// Helper: format date
// ---------------------------------------------------------------------------
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Helper: compliance status key
// ---------------------------------------------------------------------------
function statusKey(order) {
  if (order.failCount > 0) return "non_compliant";
  if (order.marginalCount > 0) return "marginal";
  return "compliant";
}

// =====================================================================
// SCREEN 1: Report Generation Page (Reports → Laporan Hasil)
// =====================================================================
function LaporanHasilPage() {
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRows, setSelectedRows] = useState({});
  const [generating, setGenerating] = useState(null); // orderId or "batch"

  const orders = MOCK_ORDERS;
  const totalEligible = orders.length;
  const generatedCount = orders.filter(o => o.lastGeneratedAt).length;
  const notGeneratedCount = totalEligible - generatedCount;
  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  const toggleExpand = (id) => setExpandedRows(p => ({ ...p, [id]: !p[id] }));
  const toggleSelect = (id) => setSelectedRows(p => ({ ...p, [id]: !p[id] }));
  const toggleSelectAll = () => {
    const allSelected = orders.every(o => selectedRows[o.orderId]);
    const next = {};
    orders.forEach(o => { next[o.orderId] = !allSelected; });
    setSelectedRows(next);
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: COLORS.carbon.gray10, minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ background: COLORS.carbon.white, borderBottom: `1px solid ${COLORS.carbon.gray20}`, padding: "24px 32px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <FileText size={20} color={COLORS.carbon.blue60} />
          <span style={{ fontSize: 14, color: COLORS.carbon.gray60 }}>{t("nav.reports.laporanHasil", "Reports")} /</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: COLORS.carbon.gray100, margin: "4px 0" }}>
          {t("heading.laporanHasil.title", "Laporan Hasil — Compliance Report")}
        </h1>
        <p style={{ fontSize: 14, color: COLORS.carbon.gray60, margin: 0 }}>
          {t("heading.laporanHasil.subtitle", "Generate Sertifikat Hasil Uji (Test Results Certificates) for validated environmental orders")}
        </p>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {/* Summary bar */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <SummaryCard icon={<Package size={16} />} label={t("label.laporanHasil.totalEligible", "Total Eligible")} value={totalEligible} color={COLORS.carbon.blue60} />
          <SummaryCard icon={<CheckCircle2 size={16} />} label={t("label.laporanHasil.generated", "Generated")} value={generatedCount} color={COLORS.carbon.green50} />
          <SummaryCard icon={<Clock size={16} />} label={t("label.laporanHasil.notGenerated", "Not Yet Generated")} value={notGeneratedCount} color={COLORS.carbon.gray60} />
        </div>

        {/* Filters toolbar */}
        <div style={{
          background: COLORS.carbon.white, border: `1px solid ${COLORS.carbon.gray20}`,
          borderBottom: "none", padding: "12px 16px",
          display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end"
        }}>
          <FilterField label={t("label.laporanHasil.filter.dateFrom", "Date From")}>
            <input type="date" defaultValue="2026-03-06" style={inputStyle} />
          </FilterField>
          <FilterField label={t("label.laporanHasil.filter.dateTo", "Date To")}>
            <input type="date" defaultValue="2026-04-05" style={inputStyle} />
          </FilterField>
          <FilterField label={t("label.laporanHasil.filter.site", "Sampling Site")}>
            <select style={inputStyle}>
              <option>{t("label.laporanHasil.filter.allSites", "All Sites")}</option>
              <option>SITE-042 — Intake Point A</option>
              <option>SITE-017 — Treatment Plant Outlet</option>
              <option>SITE-088 — Reservoir Jatiluhur</option>
            </select>
          </FilterField>
          <FilterField label={t("label.laporanHasil.filter.standard", "Compliance Standard")}>
            <select style={inputStyle}>
              <option>{t("label.laporanHasil.filter.allStandards", "All Standards")}</option>
              <option>PP No. 22/2021</option>
            </select>
          </FilterField>
          <FilterField label={t("label.laporanHasil.filter.complianceStatus", "Compliance Status")}>
            <select style={inputStyle}>
              <option>{t("label.laporanHasil.filter.statusAll", "All")}</option>
              <option>{t("label.laporanHasil.filter.statusCompliant", "All Compliant")}</option>
              <option>{t("label.laporanHasil.filter.statusIssues", "Has Issues")}</option>
              <option>{t("label.laporanHasil.filter.statusNonCompliant", "Non-Compliant (Fail)")}</option>
            </select>
          </FilterField>
          <FilterField label={t("label.laporanHasil.filter.generationStatus", "Generation Status")}>
            <select style={inputStyle}>
              <option>{t("label.laporanHasil.filter.genAll", "All")}</option>
              <option>{t("label.laporanHasil.filter.genNotYet", "Not Yet Generated")}</option>
              <option>{t("label.laporanHasil.filter.genPrevious", "Previously Generated")}</option>
            </select>
          </FilterField>
        </div>

        {/* Batch action bar (shows when rows selected) */}
        {selectedCount > 0 && (
          <div style={{
            background: COLORS.carbon.blue60, color: COLORS.carbon.white,
            padding: "8px 16px", display: "flex", alignItems: "center", gap: 12,
            fontSize: 14,
          }}>
            <span style={{ fontWeight: 500 }}>{selectedCount} {t("label.laporanHasil.itemsSelected", "items selected")}</span>
            <div style={{ flex: 1 }} />
            {selectedCount > 50 && (
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                {t("message.laporanHasil.batchLimit", "Batch generation is limited to 50 orders.")}
              </span>
            )}
            <button style={batchBtnStyle} title={t("button.laporanHasil.generateBatch", "Generate PDFs")}>
              <FileText size={14} /> {t("button.laporanHasil.generateBatch", "Generate PDFs")}
            </button>
            <button style={batchBtnStyle} title={t("button.laporanHasil.downloadZip", "Download ZIP")}>
              <Download size={14} /> {t("button.laporanHasil.downloadZip", "Download ZIP")}
            </button>
            <button
              style={{ ...batchBtnStyle, background: "transparent", border: "1px solid rgba(255,255,255,0.4)" }}
              onClick={() => setSelectedRows({})}
            >
              <X size={14} /> {t("button.cancel", "Cancel")}
            </button>
          </div>
        )}

        {/* DataTable */}
        <div style={{ background: COLORS.carbon.white, border: `1px solid ${COLORS.carbon.gray20}` }}>
          {/* Table header */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: COLORS.carbon.gray10, borderBottom: `1px solid ${COLORS.carbon.gray20}` }}>
                <th style={thStyle}>
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && orders.every(o => selectedRows[o.orderId])}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ ...thStyle, width: 32 }}></th>
                <th style={thStyle}>{t("label.laporanHasil.labNumber", "Lab Number")}</th>
                <th style={thStyle}>{t("label.laporanHasil.site", "Site")}</th>
                <th style={thStyle}>{t("label.laporanHasil.standard", "Standard")}</th>
                <th style={thStyle}>{t("label.laporanHasil.collectionDate", "Collection Date")}</th>
                <th style={{ ...thStyle, textAlign: "center" }}>{t("label.laporanHasil.tests", "Tests")}</th>
                <th style={thStyle}>{t("label.laporanHasil.compliance", "Compliance")}</th>
                <th style={thStyle}>{t("label.laporanHasil.lastGenerated", "Last Generated")}</th>
                <th style={thStyle}>{t("label.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <OrderRow
                  key={order.orderId}
                  order={order}
                  expanded={!!expandedRows[order.orderId]}
                  selected={!!selectedRows[order.orderId]}
                  onToggleExpand={() => toggleExpand(order.orderId)}
                  onToggleSelect={() => toggleSelect(order.orderId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OrderRow + expansion panel
// ---------------------------------------------------------------------------
function OrderRow({ order, expanded, selected, onToggleExpand, onToggleSelect }) {
  const sk = statusKey(order);
  const tag = TAG_CONFIG[sk];
  const genTag = order.lastGeneratedAt ? GEN_TAG.generated : GEN_TAG.not_generated;

  return (
    <>
      <tr
        style={{
          borderBottom: `1px solid ${COLORS.carbon.gray20}`,
          background: selected ? "#edf5ff" : COLORS.carbon.white,
          cursor: "pointer",
        }}
        onClick={onToggleExpand}
      >
        <td style={tdStyle} onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={onToggleSelect} />
        </td>
        <td style={tdStyle}>
          {expanded
            ? <ChevronDown size={16} color={COLORS.carbon.gray60} />
            : <ChevronRight size={16} color={COLORS.carbon.gray60} />
          }
        </td>
        <td style={{ ...tdStyle, fontWeight: 600 }}>{order.labNumber}</td>
        <td style={tdStyle}>
          <div>{order.siteName}</div>
          <div style={{ fontSize: 12, color: COLORS.carbon.gray50 }}>{order.siteCode}</div>
        </td>
        <td style={tdStyle}>
          <div style={{ fontSize: 13 }}>{order.standardName.split("—")[0].trim()}</div>
        </td>
        <td style={tdStyle}>{formatDate(order.collectionDate)}</td>
        <td style={{ ...tdStyle, textAlign: "center" }}>{order.testCount}</td>
        <td style={tdStyle}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 10px", borderRadius: 24, fontSize: 12, fontWeight: 500,
            background: tag.bg, color: tag.color,
          }}>
            {tag.icon} {tag.label}
          </span>
          {(order.passCount > 0 || order.marginalCount > 0 || order.failCount > 0) && (
            <div style={{ fontSize: 11, color: COLORS.carbon.gray50, marginTop: 2 }}>
              {order.passCount}P / {order.marginalCount}M / {order.failCount}F
            </div>
          )}
        </td>
        <td style={tdStyle}>
          {order.lastGeneratedAt ? (
            <div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 24, fontSize: 12,
                background: genTag.bg, color: genTag.color,
              }}>
                {genTag.label}
              </span>
              <div style={{ fontSize: 11, color: COLORS.carbon.gray50, marginTop: 2 }}>
                {formatDateTime(order.lastGeneratedAt)}
              </div>
              {order.certificateNumber && (
                <div style={{ fontSize: 11, color: COLORS.carbon.gray50 }}>
                  {order.certificateNumber}
                </div>
              )}
            </div>
          ) : (
            <span style={{
              display: "inline-flex", padding: "2px 8px", borderRadius: 24, fontSize: 12,
              background: genTag.bg, color: genTag.color,
            }}>
              {genTag.label}
            </span>
          )}
        </td>
        <td style={tdStyle} onClick={e => e.stopPropagation()}>
          <button style={generateBtnStyle} title={t("button.laporanHasil.generate", "Generate PDF")}>
            <FileText size={14} />
            <span>{t("button.laporanHasil.generate", "Generate PDF")}</span>
          </button>
        </td>
      </tr>

      {/* Expanded row — compliance preview */}
      {expanded && (
        <tr>
          <td colSpan={10} style={{ padding: 0, background: COLORS.carbon.gray10 }}>
            <CompliancePreview order={order} />
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// CompliancePreview — inline row expansion content
// ---------------------------------------------------------------------------
function CompliancePreview({ order }) {
  return (
    <div style={{ padding: "16px 24px 20px 48px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Left column: site info + conditions */}
        <div>
          <h4 style={sectionHeadStyle}>
            <MapPin size={14} /> {t("heading.laporanHasil.preview.siteInfo", "Site Information")}
          </h4>
          <div style={previewCardStyle}>
            <PreviewRow label={t("label.laporanHasil.site", "Site")} value={`${order.siteName} (${order.siteCode})`} />
            <PreviewRow label="GPS" value={order.siteGps ? `${order.siteGps.latitude}, ${order.siteGps.longitude}` : "—"} />
            <PreviewRow label={t("label.laporanHasil.collectionDate", "Collection Date")} value={formatDateTime(order.collectionDate)} />
            <PreviewRow label={t("label.collectionMethod", "Collection Method")} value={order.collectionMethod} />
            <PreviewRow label={t("label.laporanHasil.standard", "Standard")} value={`${order.standardName} (${order.standardVersion})`} />
          </div>

          {order.conditions && (
            <>
              <h4 style={{ ...sectionHeadStyle, marginTop: 12 }}>
                <FlaskConical size={14} /> {t("label.pdf.conditions", "Collection Conditions")}
              </h4>
              <div style={previewCardStyle}>
                {order.conditions.waterTemperature && <PreviewRow label="Water Temp" value={`${order.conditions.waterTemperature} °C`} />}
                {order.conditions.ambientTemperature && <PreviewRow label="Ambient Temp" value={`${order.conditions.ambientTemperature} °C`} />}
                {order.conditions.weatherConditions && <PreviewRow label="Weather" value={order.conditions.weatherConditions} />}
                {order.conditions.preservationMethod && <PreviewRow label="Preservation" value={order.conditions.preservationMethod} />}
              </div>
            </>
          )}
        </div>

        {/* Right column: compliance summary + signatures */}
        <div>
          <h4 style={sectionHeadStyle}>
            <Shield size={14} /> {t("heading.laporanHasil.preview.compliance", "Compliance Summary")}
          </h4>
          <div style={previewCardStyle}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.carbon.gray20}` }}>
                  <th style={miniThStyle}>{t("label.laporanHasil.preview.parameter", "Parameter")}</th>
                  <th style={miniThStyle}>{t("label.laporanHasil.preview.result", "Result")}</th>
                  <th style={miniThStyle}>{t("label.laporanHasil.preview.threshold", "Threshold")}</th>
                  <th style={miniThStyle}>{t("label.laporanHasil.preview.status", "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {order.evaluations.map((ev, i) => {
                  const evTag = ev.status === "PASS" ? TAG_CONFIG.compliant
                    : ev.status === "MARGINAL" ? TAG_CONFIG.marginal
                    : TAG_CONFIG.non_compliant;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.carbon.gray20}` }}>
                      <td style={miniTdStyle}>{ev.parameter}</td>
                      <td style={miniTdStyle}>{ev.result} {ev.unit !== "—" ? ev.unit : ""}</td>
                      <td style={miniTdStyle}>{ev.threshold}</td>
                      <td style={miniTdStyle}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "1px 8px", borderRadius: 24, fontSize: 11, fontWeight: 500,
                          background: evTag.bg, color: evTag.color,
                        }}>
                          {evTag.icon} {ev.status === "PASS" ? t("label.pdf.compliant", "Compliant")
                            : ev.status === "MARGINAL" ? t("label.pdf.marginal", "Marginal")
                            : t("label.pdf.nonCompliant", "Non-Compliant")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4 style={{ ...sectionHeadStyle, marginTop: 12 }}>
            <Pen size={14} /> {t("heading.laporanHasil.preview.signatures", "E-Signatures")}
          </h4>
          <div style={previewCardStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.carbon.gray50, marginBottom: 2 }}>
                  {t("label.laporanHasil.preview.testedBy", "Tested by")}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{order.signatures.analyst.name}</div>
                <div style={{ fontSize: 12, color: COLORS.carbon.gray60 }}>{order.signatures.analyst.title}</div>
                <div style={{ fontSize: 12, color: COLORS.carbon.gray50 }}>{order.signatures.analyst.timestamp}</div>
                <div style={{ fontSize: 11, color: COLORS.carbon.teal50, marginTop: 2 }}>
                  {t("label.meaning", "Meaning:")} {order.signatures.analyst.meaning}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.carbon.gray50, marginBottom: 2 }}>
                  {t("label.laporanHasil.preview.approvedBy", "Approved by")}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{order.signatures.validator.name}</div>
                <div style={{ fontSize: 12, color: COLORS.carbon.gray60 }}>{order.signatures.validator.title}</div>
                <div style={{ fontSize: 12, color: COLORS.carbon.gray50 }}>{order.signatures.validator.timestamp}</div>
                <div style={{ fontSize: 11, color: COLORS.carbon.teal50, marginTop: 2 }}>
                  {t("label.meaning", "Meaning:")} {order.signatures.validator.meaning}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SummaryCard
// ---------------------------------------------------------------------------
function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: COLORS.carbon.white, border: `1px solid ${COLORS.carbon.gray20}`,
      borderRadius: 4, padding: "12px 16px", flex: "1 1 0",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
        color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.carbon.gray100 }}>{value}</div>
        <div style={{ fontSize: 12, color: COLORS.carbon.gray60 }}>{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PreviewRow
// ---------------------------------------------------------------------------
function PreviewRow({ label, value }) {
  return (
    <div style={{ display: "flex", padding: "3px 0", fontSize: 13 }}>
      <span style={{ width: 140, color: COLORS.carbon.gray60, flexShrink: 0 }}>{label}</span>
      <span style={{ color: COLORS.carbon.gray90 }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterField
// ---------------------------------------------------------------------------
function FilterField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: COLORS.carbon.gray60 }}>{label}</label>
      {children}
    </div>
  );
}


// =====================================================================
// SCREEN 2: Report Print Configuration (Admin → Report Configuration)
// =====================================================================
function ReportPrintConfigPage() {
  const [config, setConfig] = useState(MOCK_CONFIG);
  const [openSections, setOpenSections] = useState({ identity: true, accreditation: false, layout: false, numbering: false });
  const [saved, setSaved] = useState(false);

  const toggleSection = (key) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const handleChange = (key, value) => {
    setConfig(p => ({ ...p, [key]: value }));
    setSaved(false);
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: COLORS.carbon.gray10, minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ background: COLORS.carbon.white, borderBottom: `1px solid ${COLORS.carbon.gray20}`, padding: "24px 32px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Settings size={20} color={COLORS.carbon.blue60} />
          <span style={{ fontSize: 14, color: COLORS.carbon.gray60 }}>{t("nav.admin", "Admin")} /</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: COLORS.carbon.gray100, margin: "4px 0" }}>
          {t("heading.reportConfig.title", "Report Print Configuration")}
        </h1>
        <p style={{ fontSize: 14, color: COLORS.carbon.gray60, margin: 0 }}>
          {t("heading.reportConfig.subtitle", "Configure shared header, footer, and layout settings for all printed reports")}
        </p>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 800 }}>
        {/* Success notification */}
        {saved && (
          <div style={{
            background: COLORS.carbon.green10, border: `1px solid #0e6027`,
            padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            fontSize: 14, color: "#0e6027",
          }}>
            <CheckCircle2 size={16} />
            {t("message.reportConfig.saved", "Report configuration saved.")}
            <button onClick={() => setSaved(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#0e6027" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Accordion: Lab Identity */}
        <AccordionSection
          title={t("heading.reportConfig.labIdentity", "Lab Identity")}
          icon={<FileText size={16} />}
          open={openSections.identity}
          onToggle={() => toggleSection("identity")}
        >
          <ConfigField label={t("label.reportConfig.labName", "Lab Name")} required>
            <input style={cfgInputStyle} value={config.labName} onChange={e => handleChange("labName", e.target.value)} />
          </ConfigField>
          <ConfigField label={t("label.reportConfig.labSubtitle", "Lab Subtitle")}>
            <input style={cfgInputStyle} value={config.labSubtitle || ""} onChange={e => handleChange("labSubtitle", e.target.value)}
              placeholder={t("placeholder.reportConfig.labSubtitle", "e.g., Environmental Testing Division")} />
          </ConfigField>
          <ConfigField label={t("label.reportConfig.addressLine1", "Address Line 1")} required>
            <input style={cfgInputStyle} value={config.addressLine1} onChange={e => handleChange("addressLine1", e.target.value)} />
          </ConfigField>
          <ConfigField label={t("label.reportConfig.addressLine2", "Address Line 2")}>
            <input style={cfgInputStyle} value={config.addressLine2 || ""} onChange={e => handleChange("addressLine2", e.target.value)}
              placeholder={t("placeholder.reportConfig.addressLine2", "City, Province, Postal Code")} />
          </ConfigField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <ConfigField label={t("label.reportConfig.phone", "Phone")}>
              <input style={cfgInputStyle} value={config.phone || ""} onChange={e => handleChange("phone", e.target.value)} />
            </ConfigField>
            <ConfigField label={t("label.reportConfig.email", "Email")}>
              <input style={cfgInputStyle} value={config.email || ""} onChange={e => handleChange("email", e.target.value)} />
            </ConfigField>
            <ConfigField label={t("label.reportConfig.website", "Website")}>
              <input style={cfgInputStyle} value={config.website || ""} onChange={e => handleChange("website", e.target.value)} />
            </ConfigField>
          </div>
          <ConfigField label={t("label.reportConfig.labLogo", "Lab Logo")}>
            <LogoUploader
              value={config.labLogo}
              helpText={t("label.reportConfig.logoHelp", "PNG or JPG, max 500KB. Recommended: 200×80px")}
              onUpload={() => handleChange("labLogo", "data:image/png;base64,placeholder")}
              onRemove={() => handleChange("labLogo", null)}
            />
          </ConfigField>
        </AccordionSection>

        {/* Accordion: Accreditation */}
        <AccordionSection
          title={t("heading.reportConfig.accreditation", "Accreditation")}
          icon={<Shield size={16} />}
          open={openSections.accreditation}
          onToggle={() => toggleSection("accreditation")}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ConfigField label={t("label.reportConfig.accreditationNumber", "Accreditation Number")}>
              <input style={cfgInputStyle} value={config.accreditationNumber || ""}
                onChange={e => handleChange("accreditationNumber", e.target.value)}
                placeholder="e.g., KAN LP-042-IDN" />
            </ConfigField>
            <ConfigField label={t("label.reportConfig.accreditationBody", "Accreditation Body")}>
              <input style={cfgInputStyle} value={config.accreditationBody || ""}
                onChange={e => handleChange("accreditationBody", e.target.value)} />
            </ConfigField>
          </div>
          <ConfigField label={t("label.reportConfig.accreditationLogo", "Accreditation Logo")}>
            <LogoUploader
              value={config.accreditationLogo}
              helpText={t("label.reportConfig.logoHelp", "PNG or JPG, max 500KB. Recommended: 200×80px")}
              onUpload={() => handleChange("accreditationLogo", "data:image/png;base64,placeholder")}
              onRemove={() => handleChange("accreditationLogo", null)}
            />
          </ConfigField>
        </AccordionSection>

        {/* Accordion: Page Layout */}
        <AccordionSection
          title={t("heading.reportConfig.pageLayout", "Page Layout")}
          icon={<FileText size={16} />}
          open={openSections.layout}
          onToggle={() => toggleSection("layout")}
        >
          <ConfigField label={t("label.reportConfig.footerText", "Report Footer Text")}>
            <textarea style={{ ...cfgInputStyle, minHeight: 64, resize: "vertical" }}
              value={config.footerText || ""}
              onChange={e => handleChange("footerText", e.target.value)}
              placeholder={t("placeholder.reportConfig.footerText", "Disclaimer or notice printed at the bottom of all reports")} />
          </ConfigField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ConfigField label={t("label.reportConfig.showPageNumbers", "Show Page Numbers")}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                <input type="checkbox" checked={config.showPageNumbers}
                  onChange={e => handleChange("showPageNumbers", e.target.checked)}
                  style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 14, color: COLORS.carbon.gray80 }}>
                  {config.showPageNumbers ? t("label.enabled", "Enabled") : t("label.disabled", "Disabled")}
                </span>
              </div>
            </ConfigField>
            <ConfigField label={t("label.reportConfig.pageNumberFormat", "Page Number Format")}>
              <select style={cfgInputStyle} value={config.pageNumberFormat}
                onChange={e => handleChange("pageNumberFormat", e.target.value)}>
                <option value="PAGE_X_OF_Y">Page X of Y</option>
                <option value="PAGE_X">Page X</option>
                <option value="NONE">None</option>
              </select>
            </ConfigField>
          </div>
        </AccordionSection>

        {/* Accordion: Numbering */}
        <AccordionSection
          title={t("heading.reportConfig.numbering", "Numbering")}
          icon={<Hash size={16} />}
          open={openSections.numbering}
          onToggle={() => toggleSection("numbering")}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ConfigField label={t("label.reportConfig.certificatePrefix", "Certificate Number Prefix")}>
              <input style={cfgInputStyle} value={config.certificatePrefix}
                onChange={e => handleChange("certificatePrefix", e.target.value)}
                maxLength={20} />
              <div style={{ fontSize: 12, color: COLORS.carbon.gray50, marginTop: 4 }}>
                {t("label.reportConfig.prefixPreview", "Preview:")} {config.certificatePrefix}-2026-0001
              </div>
            </ConfigField>
            <ConfigField label={t("label.reportConfig.dateFormat", "Date Format")}>
              <select style={cfgInputStyle} value={config.dateFormat}
                onChange={e => handleChange("dateFormat", e.target.value)}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </ConfigField>
          </div>
        </AccordionSection>

        {/* Save button */}
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <button
            style={{
              background: COLORS.carbon.blue60, color: COLORS.carbon.white,
              border: "none", padding: "11px 24px", fontSize: 14, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}
            onClick={() => setSaved(true)}
          >
            {t("button.reportConfig.save", "Save Configuration")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AccordionSection
// ---------------------------------------------------------------------------
function AccordionSection({ title, icon, open, onToggle, children }) {
  return (
    <div style={{
      background: COLORS.carbon.white,
      border: `1px solid ${COLORS.carbon.gray20}`,
      marginBottom: -1,
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "12px 16px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 14, fontWeight: 600, color: COLORS.carbon.gray90,
          textAlign: "left",
        }}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {icon}
        {title}
      </button>
      {open && (
        <div style={{ padding: "0 16px 20px", borderTop: `1px solid ${COLORS.carbon.gray20}` }}>
          <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfigField
// ---------------------------------------------------------------------------
function ConfigField({ label, required, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: COLORS.carbon.gray70, marginBottom: 4 }}>
        {label} {required && <span style={{ color: COLORS.carbon.red50 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LogoUploader
// ---------------------------------------------------------------------------
function LogoUploader({ value, helpText, onUpload, onRemove }) {
  return (
    <div>
      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 120, height: 48, background: COLORS.carbon.gray10,
            border: `1px solid ${COLORS.carbon.gray20}`, borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: COLORS.carbon.gray50,
          }}>
            <Image size={20} color={COLORS.carbon.gray30} />
          </div>
          <button onClick={onRemove} style={{
            background: "none", border: `1px solid ${COLORS.carbon.gray30}`,
            padding: "6px 12px", fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4, color: COLORS.carbon.red50,
          }}>
            <Trash2 size={12} /> {t("button.reportConfig.removeLogo", "Remove")}
          </button>
        </div>
      ) : (
        <button onClick={onUpload} style={{
          background: "none", border: `1px dashed ${COLORS.carbon.gray30}`,
          padding: "12px 16px", width: "100%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          color: COLORS.carbon.blue60, fontSize: 13,
        }}>
          <Upload size={14} /> {t("button.reportConfig.uploadLogo", "Upload Logo")}
        </button>
      )}
      <div style={{ fontSize: 12, color: COLORS.carbon.gray50, marginTop: 4 }}>{helpText}</div>
    </div>
  );
}


// =====================================================================
// App — tab switcher for both screens
// =====================================================================
const TABS = [
  { key: "report", label: "Reports → Laporan Hasil" },
  { key: "config", label: "Admin → Report Configuration" },
];

export default function S06LaporanHasilMockup() {
  const [activeTab, setActiveTab] = useState("report");

  return (
    <div>
      {/* Screen switcher */}
      <div style={{
        background: COLORS.carbon.gray90, padding: "8px 16px",
        display: "flex", gap: 4, fontFamily: "'IBM Plex Sans', sans-serif",
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? COLORS.carbon.blue60 : "transparent",
              color: COLORS.carbon.white, border: "none", padding: "6px 16px",
              fontSize: 13, cursor: "pointer", borderRadius: 4,
              opacity: activeTab === tab.key ? 1 : 0.7,
            }}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ color: COLORS.carbon.gray30, fontSize: 11, alignSelf: "center" }}>
          S-06 Laporan Hasil — Mockup v1.0
        </span>
      </div>

      {activeTab === "report" ? <LaporanHasilPage /> : <ReportPrintConfigPage />}
    </div>
  );
}


// =====================================================================
// Shared styles
// =====================================================================
const inputStyle = {
  padding: "6px 12px", fontSize: 14, border: `1px solid ${COLORS.carbon.gray30}`,
  background: COLORS.carbon.white, color: COLORS.carbon.gray90,
  minWidth: 140,
};

const cfgInputStyle = {
  padding: "8px 12px", fontSize: 14, border: `1px solid ${COLORS.carbon.gray30}`,
  background: COLORS.carbon.white, color: COLORS.carbon.gray90, width: "100%",
  boxSizing: "border-box",
};

const thStyle = {
  padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600,
  color: COLORS.carbon.gray60, textTransform: "uppercase", letterSpacing: 0.5,
};

const tdStyle = {
  padding: "10px 12px", verticalAlign: "top", fontSize: 14,
  color: COLORS.carbon.gray90,
};

const miniThStyle = {
  padding: "6px 8px", textAlign: "left", fontSize: 11, fontWeight: 600,
  color: COLORS.carbon.gray60, textTransform: "uppercase",
};

const miniTdStyle = {
  padding: "6px 8px", fontSize: 13, color: COLORS.carbon.gray90,
};

const generateBtnStyle = {
  background: COLORS.carbon.blue60, color: COLORS.carbon.white,
  border: "none", padding: "6px 12px", fontSize: 13, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
};

const batchBtnStyle = {
  background: "rgba(255,255,255,0.15)", color: COLORS.carbon.white,
  border: "none", padding: "6px 14px", fontSize: 13, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
};

const sectionHeadStyle = {
  fontSize: 13, fontWeight: 600, color: COLORS.carbon.gray70,
  margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: 6,
};

const previewCardStyle = {
  background: COLORS.carbon.white, border: `1px solid ${COLORS.carbon.gray20}`,
  borderRadius: 4, padding: "10px 14px",
};
