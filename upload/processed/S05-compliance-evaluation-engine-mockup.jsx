/**
 * S-05 Compliance Evaluation Engine — Results Entry Extension Mockup v2
 * OpenELIS Global
 *
 * This mockup extends the Results Entry page (results-page.jsx v3) with
 * compliance evaluation features for environmental samples. It uses the
 * SAME patterns: table layout, expand/collapse rows, tabbed detail panels,
 * lucide-react icons, Tailwind utility classes, and design tokens.
 *
 * Additions to the base results page:
 *  1. ComplianceSummaryBanner — above the results table
 *  2. Compliance column — in table row (Pass/Marginal/Fail tag)
 *  3. Compliance tab — in expanded panel (detail tile + override)
 *  4. DescriptiveTagSelector — replaces numeric input for DESCRIPTIVE thresholds
 *  5. Unit mismatch warning — inline alert in expanded panel
 */
import { useState } from "react";
import {
  Search, ChevronRight, ChevronDown, ChevronUp, Check, AlertTriangle,
  FileText, Microscope, Paperclip, History, FlaskConical, Send,
  Plus, Trash2, Download, X, Info, Shield, ClipboardList,
  MessageSquare, AlertCircle, ExternalLink, Pencil, Scale
} from "lucide-react";

// ---------------------------------------------------------------------------
// i18n stub
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Result range evaluation (from results-page.jsx)
// ---------------------------------------------------------------------------
function evaluateResult(value, rangeBounds) {
  const num = parseFloat(value);
  if (value === "" || value == null || isNaN(num) || !rangeBounds) return "empty";
  const { normal, critical, valid } = rangeBounds;
  if (valid    && (num < valid.low    || num > valid.high))    return "invalid";
  if (critical && (num < critical.low || num > critical.high)) return "critical";
  if (normal   && (num < normal.low   || num > normal.high))   return "abnormal";
  return "normal";
}

// ---------------------------------------------------------------------------
// Compliance evaluation (S-05)
// ---------------------------------------------------------------------------
function evaluateCompliance(resultValue, threshold) {
  if (!resultValue || resultValue === "") return "pending";
  if (!threshold) return "pending";

  const num = parseFloat(resultValue);
  if (isNaN(num)) return "pending";

  const { thresholdType, valueLower, valueUpper, marginPercent = 0 } = threshold;

  if (thresholdType === "MAX") {
    if (num > valueUpper) return "fail";
    const marginBound = valueUpper * (1 - marginPercent / 100);
    if (marginPercent > 0 && num > marginBound) return "marginal";
    return "pass";
  }

  if (thresholdType === "MIN") {
    if (num < valueLower) return "fail";
    const marginBound = valueLower * (1 + marginPercent / 100);
    if (marginPercent > 0 && num < marginBound) return "marginal";
    return "pass";
  }

  if (thresholdType === "RANGE") {
    if (num < valueLower || num > valueUpper) return "fail";
    const range = valueUpper - valueLower;
    const lowerMargin = valueLower + range * (marginPercent / 100);
    const upperMargin = valueUpper - range * (marginPercent / 100);
    if (marginPercent > 0 && (num < lowerMargin || num > upperMargin)) return "marginal";
    return "pass";
  }

  return "pending";
}

function evaluateDescriptive(selectedTags, expectedTags) {
  if (!selectedTags || selectedTags.length === 0) return "pending";
  const hasAll = expectedTags.every(et => selectedTags.includes(et));
  return hasAll ? "pass" : "fail";
}

// ---------------------------------------------------------------------------
// Design tokens (from results-page.jsx)
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  pending:               { label: "Pending",              bg: "bg-gray-200",  text: "text-gray-700" },
  entered:               { label: "Entered",              bg: "bg-blue-100",  text: "text-blue-800" },
  "awaiting-validation": { label: "Awaiting Validation",  bg: "bg-amber-100", text: "text-amber-800" },
  released:              { label: "Released",             bg: "bg-green-100", text: "text-green-800" },
};

const RANGE_INPUT_BORDER = {
  empty: "border-gray-300", normal: "border-gray-400",
  abnormal: "border-yellow-500", critical: "border-orange-500", invalid: "border-red-800",
};
const RANGE_CELL_BG = {
  empty: "", normal: "", abnormal: "bg-yellow-50", critical: "bg-orange-50", invalid: "bg-red-950",
};
const RANGE_CELL_TEXT = {
  empty: "text-gray-700", normal: "text-gray-700", abnormal: "text-yellow-900",
  critical: "text-orange-900", invalid: "text-red-100",
};
const RANGE_FLAG_BADGE = {
  abnormal: "bg-yellow-100 text-yellow-800",
  critical: "bg-orange-100 text-orange-900",
  invalid:  "bg-red-900 text-red-100",
};

const COMPLIANCE_TAG_CONFIG = {
  pass:     { label: t("label.compliance.pass", "Compliant"),     bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500" },
  marginal: { label: t("label.compliance.marginal", "Marginal"),  bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  fail:     { label: t("label.compliance.fail", "Non-Compliant"), bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-500" },
  "unit-mismatch": { label: t("label.compliance.unitMismatch", "Unit Mismatch"), bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
  pending:  { label: null, bg: null, text: null, dot: "bg-gray-300" },
};

const QC_DOT = { pass: "bg-green-500", warning: "bg-yellow-400", fail: "bg-red-500", none: "bg-gray-300" };

// ---------------------------------------------------------------------------
// Mock data — Environmental water quality samples
// ---------------------------------------------------------------------------
const COMPLIANCE_STANDARD = {
  name: "PP No. 22/2021 — Drinking Water Quality",
  version: "2021",
  id: 101,
};

const DESCRIPTIVE_TAGS = [
  { code: "ODOR_NONE",      category: "Odor",  displayText: t("label.compliance.tag.odorNone", "No odor") },
  { code: "ODOR_EARTHY",    category: "Odor",  displayText: t("label.compliance.tag.odorEarthy", "Earthy") },
  { code: "ODOR_CHEMICAL",  category: "Odor",  displayText: t("label.compliance.tag.odorChemical", "Chemical") },
  { code: "COLOR_CLEAR",    category: "Color", displayText: t("label.compliance.tag.colorClear", "Clear") },
  { code: "COLOR_CLOUDY",   category: "Color", displayText: t("label.compliance.tag.colorCloudy", "Cloudy") },
  { code: "COLOR_YELLOW",   category: "Color", displayText: t("label.compliance.tag.colorYellow", "Yellow tint") },
  { code: "TASTE_NONE",     category: "Taste", displayText: t("label.compliance.tag.tasteNone", "No taste") },
  { code: "TASTE_METALLIC", category: "Taste", displayText: t("label.compliance.tag.tasteMetallic", "Metallic") },
];

const INITIAL_RESULTS = [
  {
    id: "1",
    labNumber: "ENV-2026-001",
    sampleSite: { name: "Intake Point A — Citarum River", siteId: "SITE-042" },
    testDate: "04/04/2026",
    testName: "pH",
    sampleType: "Surface Water",
    normalRange: "6.5–8.5",
    unit: "pH units",
    rangeBounds: { normal: { low: 6.5, high: 8.5 }, valid: { low: 0, high: 14 } },
    result: "7.2",
    status: "entered",
    flags: [],
    qcStatus: "pass",
    compliance: {
      thresholdType: "RANGE", parameterGroup: "Physical Parameters",
      valueLower: 6.5, valueUpper: 8.5, marginPercent: 10, status: "pass",
    },
    previousResults: [
      { date: "03/28/2026", value: "7.4", unit: "pH units" },
      { date: "03/21/2026", value: "7.1", unit: "pH units" },
    ],
    notes: [],
    orderInfo: {
      clinician: "Dr. Sari Wijaya", department: "Environmental Health",
      priority: "Routine", collectionDate: "04/04/2026 07:30", receivedDate: "04/04/2026 08:15",
    },
    qcData: {
      overall: "pass",
      controls: [
        { level: "pH 4.01 Buffer", value: "4.02", expected: "4.01 ± 0.03", status: "pass" },
        { level: "pH 7.00 Buffer", value: "7.01", expected: "7.00 ± 0.03", status: "pass" },
      ],
      analyzerStatus: "Hanna HI98190", lastCalibrated: "04/04/2026 06:00",
    },
  },
  {
    id: "2",
    labNumber: "ENV-2026-001",
    sampleSite: { name: "Intake Point A — Citarum River", siteId: "SITE-042" },
    testDate: "04/04/2026",
    testName: "Turbidity",
    sampleType: "Surface Water",
    normalRange: "≤ 5",
    unit: "NTU",
    rangeBounds: { normal: { low: 0, high: 5 }, valid: { low: 0, high: 4000 } },
    result: "4.3",
    status: "entered",
    flags: [],
    qcStatus: "pass",
    compliance: {
      thresholdType: "MAX", parameterGroup: "Physical Parameters",
      valueUpper: 5.0, marginPercent: 15, status: "marginal",
    },
    previousResults: [{ date: "03/28/2026", value: "3.8", unit: "NTU" }],
    notes: [
      { id: 1, date: "04/04/2026 08:30", author: "A. Sutanto", type: "internal", body: "Slightly elevated after recent rainfall. Within seasonal norms." },
    ],
    orderInfo: {
      clinician: "Dr. Sari Wijaya", department: "Environmental Health",
      priority: "Routine", collectionDate: "04/04/2026 07:30", receivedDate: "04/04/2026 08:15",
    },
    qcData: {
      overall: "pass",
      controls: [{ level: "Formazin 10 NTU", value: "10.1", expected: "10.0 ± 0.5", status: "pass" }],
      analyzerStatus: "Hach 2100Q", lastCalibrated: "04/04/2026 06:15",
    },
  },
  {
    id: "3",
    labNumber: "ENV-2026-001",
    sampleSite: { name: "Intake Point A — Citarum River", siteId: "SITE-042" },
    testDate: "04/04/2026",
    testName: "Lead (Pb)",
    sampleType: "Surface Water",
    normalRange: "≤ 0.01",
    unit: "mg/L",
    rangeBounds: { normal: { low: 0, high: 0.01 }, valid: { low: 0, high: 100 } },
    result: "0.015",
    status: "entered",
    flags: ["above-normal"],
    qcStatus: "pass",
    compliance: {
      thresholdType: "MAX", parameterGroup: "Chemical Parameters — Inorganic",
      valueUpper: 0.01, marginPercent: 10, status: "fail",
    },
    previousResults: [
      { date: "03/28/2026", value: "0.008", unit: "mg/L" },
      { date: "03/21/2026", value: "0.009", unit: "mg/L" },
    ],
    notes: [],
    orderInfo: {
      clinician: "Dr. Sari Wijaya", department: "Environmental Health",
      priority: "Routine", collectionDate: "04/04/2026 07:30", receivedDate: "04/04/2026 08:15",
    },
    qcData: {
      overall: "pass",
      controls: [{ level: "ICP-MS Check Std", value: "0.0098", expected: "0.010 ± 0.001", status: "pass" }],
      analyzerStatus: "Agilent 7800 ICP-MS", lastCalibrated: "04/04/2026 05:30",
    },
  },
  {
    id: "4",
    labNumber: "ENV-2026-001",
    sampleSite: { name: "Intake Point A — Citarum River", siteId: "SITE-042" },
    testDate: "04/04/2026",
    testName: "E. coli",
    sampleType: "Surface Water",
    normalRange: "≤ 0",
    unit: "CFU/100mL",
    rangeBounds: { normal: { low: 0, high: 0 }, valid: { low: 0, high: 100000 } },
    result: "0",
    status: "entered",
    flags: [],
    qcStatus: "pass",
    compliance: {
      thresholdType: "MAX", parameterGroup: "Microbiological Parameters",
      valueUpper: 0, marginPercent: 0, status: "pass",
    },
    previousResults: [{ date: "03/28/2026", value: "0", unit: "CFU/100mL" }],
    notes: [],
    orderInfo: {
      clinician: "Dr. Sari Wijaya", department: "Environmental Health",
      priority: "Routine", collectionDate: "04/04/2026 07:30", receivedDate: "04/04/2026 08:15",
    },
    qcData: {
      overall: "pass",
      controls: [
        { level: "E. coli ATCC 25922", value: "Positive", expected: "Positive", status: "pass" },
        { level: "Negative Control", value: "Negative", expected: "Negative", status: "pass" },
      ],
      analyzerStatus: "Manual — Membrane Filtration", lastCalibrated: "—",
    },
  },
  {
    id: "5",
    labNumber: "ENV-2026-001",
    sampleSite: { name: "Intake Point A — Citarum River", siteId: "SITE-042" },
    testDate: "04/04/2026",
    testName: "Odor",
    sampleType: "Surface Water",
    normalRange: "Odorless",
    unit: "—",
    rangeBounds: null,
    result: "",
    resultTags: ["ODOR_NONE"],
    status: "entered",
    flags: [],
    qcStatus: "none",
    compliance: {
      thresholdType: "DESCRIPTIVE", parameterGroup: "Physical Parameters",
      expectedTags: ["ODOR_NONE"], tagCategoryHint: "Odor",
      marginPercent: 0, status: "pass",
    },
    previousResults: [],
    notes: [],
    orderInfo: {
      clinician: "Dr. Sari Wijaya", department: "Environmental Health",
      priority: "Routine", collectionDate: "04/04/2026 07:30", receivedDate: "04/04/2026 08:15",
    },
    qcData: { overall: "none", controls: [], analyzerStatus: "—", lastCalibrated: "—" },
  },
];

// ---------------------------------------------------------------------------
// Tiny reusable components (same patterns as results-page.jsx)
// ---------------------------------------------------------------------------
function Tag({ color = "gray", children }) {
  const COLOR_CONFIG = {
    green: { bg: "bg-green-100", text: "text-green-800" },
    red: { bg: "bg-red-100", text: "text-red-800" },
    stone: { bg: "bg-stone-100", text: "text-stone-700" },
    blue: { bg: "bg-blue-100", text: "text-blue-800" },
    purple: { bg: "bg-purple-100", text: "text-purple-800" },
    teal: { bg: "bg-teal-100", text: "text-teal-800" },
    gray: { bg: "bg-gray-200", text: "text-gray-700" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-800" },
    amber: { bg: "bg-amber-100", text: "text-amber-800" },
  };
  const c = COLOR_CONFIG[color] || COLOR_CONFIG.gray;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{children}</span>;
}

function StatusTag({ status }) {
  const colorMap = { pending: "gray", entered: "blue", "awaiting-validation": "stone", released: "green" };
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <Tag color={colorMap[status] || "gray"}>{c.label}</Tag>;
}

function ComplianceTag({ status }) {
  const cfg = COMPLIANCE_TAG_CONFIG[status];
  if (!cfg || !cfg.label) return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" title={t("label.compliance.pending", "Pending")} />;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function SectionHeader({ label, open, onToggle, badge }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100" onClick={onToggle}>
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {label}
        {badge && <span className="text-xs font-normal text-gray-400">{badge}</span>}
      </div>
      {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// S-05: Compliance Summary Banner
// ---------------------------------------------------------------------------
function ComplianceSummaryBanner({ results, standard }) {
  const evaluated = results.filter(r => r.compliance);
  const pass = evaluated.filter(r => r.compliance.status === "pass").length;
  const marginal = evaluated.filter(r => r.compliance.status === "marginal").length;
  const fail = evaluated.filter(r => r.compliance.status === "fail").length;
  const pending = evaluated.filter(r => r.compliance.status === "pending").length;

  let overallStatus = "pending";
  if (fail > 0) overallStatus = "fail";
  else if (marginal > 0) overallStatus = "marginal";
  else if (pending === 0 && pass > 0) overallStatus = "pass";

  const styles = {
    pass:     { bg: "bg-green-50",  border: "border-green-500",  text: "text-green-800",  label: t("label.compliance.summary.allCompliant", "All Compliant") },
    marginal: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-800", label: t("label.compliance.summary.issuesFound", "Issues Found") },
    fail:     { bg: "bg-red-50",    border: "border-red-500",    text: "text-red-800",    label: t("label.compliance.summary.issuesFound", "Issues Found") },
    pending:  { bg: "bg-blue-50",   border: "border-blue-500",   text: "text-blue-800",   label: t("label.compliance.summary.pending", "Evaluation Pending") },
  };
  const s = styles[overallStatus];

  return (
    <div className={`${s.bg} border-l-4 ${s.border} px-4 py-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className={`w-4 h-4 ${s.text}`} />
          <div>
            <div className={`text-sm font-semibold ${s.text}`}>{standard.name}</div>
            <div className={`text-xs ${s.text} mt-0.5`}>
              {t("label.compliance.summary.version", "Version")} {standard.version}
              <span className="mx-2">·</span>
              <span className="font-medium">{t("label.compliance.summary.pass", "Pass")} {pass}</span>
              <span className="mx-1.5">·</span>
              <span className="font-medium">{t("label.compliance.summary.marginal", "Marginal")} {marginal}</span>
              <span className="mx-1.5">·</span>
              <span className="font-medium">{t("label.compliance.summary.fail", "Fail")} {fail}</span>
              {pending > 0 && <><span className="mx-1.5">·</span><span className="font-medium">{t("label.compliance.summary.pending", "Pending")} {pending}</span></>}
            </div>
          </div>
        </div>
        <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// S-05: Descriptive Tag Selector (multi-select with type-ahead)
// ---------------------------------------------------------------------------
function DescriptiveTagSelector({ selectedTags, onTagToggle, categoryHint }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTags = DESCRIPTIVE_TAGS.filter(tag => {
    const matchesSearch = !search || tag.displayText.toLowerCase().includes(search.toLowerCase()) || tag.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryHint || tag.category === categoryHint;
    return matchesSearch && matchesCategory;
  });

  const grouped = filteredTags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {});

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 mb-1.5">
        {selectedTags.map(code => {
          const tag = DESCRIPTIVE_TAGS.find(dt => dt.code === code);
          return tag ? (
            <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              {tag.displayText}
              <button onClick={() => onTagToggle(code)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
            </span>
          ) : null;
        })}
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input type="text"
          className="w-full pl-8 pr-3 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          placeholder={t("placeholder.compliance.tags.search", "Type to search descriptive tags…")}
          value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {Object.entries(grouped).map(([category, tags]) => (
            <div key={category}>
              <div className="px-3 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">{category}</div>
              {tags.map(tag => (
                <label key={tag.code} className="flex items-center px-3 py-1.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0">
                  <input type="checkbox" checked={selectedTags.includes(tag.code)} onChange={() => onTagToggle(tag.code)} className="rounded" />
                  <span className="ml-2 text-xs text-gray-800">{tag.displayText}</span>
                  <span className="ml-auto text-xs text-gray-400">{tag.code}</span>
                </label>
              ))}
            </div>
          ))}
          {filteredTags.length === 0 && (
            <div className="px-3 py-3 text-xs text-gray-400 text-center">{t("label.compliance.tags.noResults", "No matching tags found")}</div>
          )}
          <div className="px-3 py-1.5 bg-gray-50 border-t text-right">
            <button onClick={() => setOpen(false)} className="text-xs text-blue-700 hover:underline">{t("button.done", "Done")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// S-05: Compliance Tab (in expanded panel — same position as other tabs)
// ---------------------------------------------------------------------------
function ComplianceTab({ result, onOverrideSave }) {
  const comp = result.compliance;
  const [showOverride, setShowOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState("pass");
  const [justification, setJustification] = useState("");

  if (!comp) return <div className="p-4 text-sm text-gray-400">{t("label.compliance.noCompliance", "No compliance evaluation linked to this test.")}</div>;

  const thresholdLabel = {
    MAX: `≤ ${comp.valueUpper}`,
    MIN: `≥ ${comp.valueLower}`,
    RANGE: `${comp.valueLower}–${comp.valueUpper}`,
    DESCRIPTIVE: comp.expectedTags?.map(tc => DESCRIPTIVE_TAGS.find(dt => dt.code === tc)?.displayText || tc).join(", ") || "—",
  };

  const handleOverrideSave = () => {
    if (justification.length < 10) return;
    onOverrideSave(result.id, overrideValue, justification);
    setShowOverride(false);
    setJustification("");
  };

  return (
    <div className="p-4 space-y-4">
      {/* Standard info — same grid layout as OrderInfoTab in results-page.jsx */}
      <div className="flex items-start gap-3 p-3 border border-gray-200 bg-white rounded">
        <Scale className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{t("label.compliance.evaluation.standard", "Standard")}</div>
              <div className="text-sm text-gray-800">{COMPLIANCE_STANDARD.name}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{t("label.compliance.evaluation.version", "Version")}</div>
              <div className="text-sm text-gray-800">{COMPLIANCE_STANDARD.version} <span className="text-xs text-gray-400">{t("label.compliance.evaluation.lockedAtOrder", "(locked at order time)")}</span></div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{t("label.compliance.evaluation.parameterGroup", "Parameter Group")}</div>
              <div className="text-sm text-gray-800">{comp.parameterGroup}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{t("label.compliance.evaluation.thresholdType", "Threshold Type")}</div>
              <div className="text-sm text-gray-800">{comp.thresholdType}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold evaluation table — same table style as QA/QC controls in results-page.jsx */}
      <div className="bg-white border border-gray-200">
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t("heading.compliance.evaluation.thresholdDetail", "Threshold Evaluation")}
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[t("label.compliance.evaluation.type", "Type"), t("label.compliance.evaluation.limit", "Limit"),
                t("label.compliance.evaluation.margin", "Margin %"), t("label.compliance.evaluation.result", "Result"),
                t("label.compliance.evaluation.status", "Status")].map(h => (
                <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2">{comp.thresholdType}</td>
              <td className="px-3 py-2 font-mono">{thresholdLabel[comp.thresholdType]} {result.unit !== "—" ? result.unit : ""}</td>
              <td className="px-3 py-2">{comp.marginPercent || 0}%</td>
              <td className="px-3 py-2 font-mono font-medium">
                {comp.thresholdType === "DESCRIPTIVE"
                  ? (result.resultTags || []).map(code => DESCRIPTIVE_TAGS.find(dt => dt.code === code)?.displayText || code).join(", ") || "—"
                  : `${result.result} ${result.unit !== "—" ? result.unit : ""}`}
              </td>
              <td className="px-3 py-2"><ComplianceTag status={comp.status} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Unit mismatch warning */}
      {comp.unitMismatch && (
        <div className="flex gap-2 p-3 bg-purple-50 border-l-4 border-purple-500 text-sm">
          <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-purple-800">
            <span className="font-semibold">{t("label.compliance.evaluation.unitMismatch", "Unit Mismatch:")}</span>{" "}
            {t("message.compliance.evaluation.unitMismatchDetail", "Result unit does not match threshold unit. Auto-conversion not available. Manual review required.")}
          </div>
        </div>
      )}

      {/* Override — same button pattern as ReportNCE in results-page.jsx */}
      {!showOverride ? (
        <button onClick={() => setShowOverride(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-400 text-blue-700 text-xs font-medium hover:bg-blue-50">
          <Pencil className="w-3.5 h-3.5" />
          {t("button.compliance.override", "Override Evaluation")}
        </button>
      ) : (
        <div className="border border-blue-300 bg-blue-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
              <Pencil className="w-4 h-4" />
              {t("heading.compliance.override", "Override Compliance Evaluation")}
            </div>
            <button onClick={() => setShowOverride(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-blue-700">
            {t("message.compliance.override.info", "Overriding will replace the auto-evaluated status. A justification is required and will be recorded in the audit trail.")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.compliance.override.currentStatus", "Current Status")}</label>
              <div className="px-2 py-1.5 bg-white border border-gray-200 text-xs"><ComplianceTag status={comp.status} /></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.compliance.override.overrideTo", "Override To")} <span className="text-red-500">*</span></label>
              <select value={overrideValue} onChange={e => setOverrideValue(e.target.value)}
                className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600">
                <option value="pass">{t("label.compliance.pass", "Compliant")}</option>
                <option value="fail">{t("label.compliance.fail", "Non-Compliant")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t("label.compliance.override.justification", "Justification")} <span className="text-red-500">*</span>
              <span className="font-normal text-gray-400 ml-1">{t("label.compliance.override.justificationHint", "(min 10 characters — recorded in audit trail)")}</span>
            </label>
            <textarea value={justification} onChange={e => setJustification(e.target.value)}
              placeholder={t("placeholder.compliance.override.justification", "Explain why this evaluation is being overridden…")}
              className="w-full border border-gray-300 text-xs p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600" rows={2} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleOverrideSave} disabled={justification.length < 10}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${justification.length >= 10 ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
              <Check className="w-3.5 h-3.5" /> {t("button.compliance.override.save", "Save Override")}
            </button>
            <button onClick={() => setShowOverride(false)} className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">{t("button.cancel", "Cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes Section (from results-page.jsx — simplified for demo)
// ---------------------------------------------------------------------------
function NotesSection({ result }) {
  const [notes] = useState(result.notes);
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><MessageSquare className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.notes", "Notes")}</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={notes.length ? `(${notes.length})` : null}
      />
      {open && (
        <div className="px-4 py-3 space-y-2 bg-white">
          {notes.length === 0 ? (
            <p className="text-xs text-gray-400">{t("label.notes.none", "No notes yet.")}</p>
          ) : notes.map(note => (
            <div key={note.id} className="flex gap-3 text-sm">
              <div className="flex-1 border-l-2 border-gray-200 pl-3">
                <div className="flex gap-2 text-xs text-gray-400 mb-0.5 flex-wrap">
                  <span>{note.date}</span>
                  <span className="text-gray-500 font-medium">{note.author}</span>
                  <Tag color={note.type === "internal" ? "purple" : "teal"}>
                    {note.type === "internal" ? t("label.notes.internal", "In Lab Only") : t("label.notes.external", "Send with Result")}
                  </Tag>
                </div>
                <div className="text-gray-800 text-sm">{note.body}</div>
              </div>
            </div>
          ))}
          <button className="flex items-center gap-1 text-xs text-blue-700 hover:underline"><Plus className="w-3 h-3" /> {t("button.notes.add", "New Note")}</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sample Site Banner (environmental equivalent of PatientBanner)
// ---------------------------------------------------------------------------
function SampleSiteBanner({ site, orderInfo }) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-gray-100 border-b border-gray-200 text-sm">
      <span className="font-semibold text-gray-900">{site.name}</span>
      <span className="text-gray-400 text-xs">{t("label.siteId", "Site ID:")} <strong className="text-gray-700">{site.siteId}</strong></span>
      {orderInfo?.department && <span className="text-gray-400 text-xs">{t("label.department", "Dept:")} <strong className="text-gray-700">{orderInfo.department}</strong></span>}
      {orderInfo?.priority && <Tag color={orderInfo.priority === "STAT" ? "red" : "gray"}>{orderInfo.priority}</Tag>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QA/QC Tab (from results-page.jsx)
// ---------------------------------------------------------------------------
function QAQCTab({ result }) {
  const qc = result.qcData;
  return (
    <div className="p-4 space-y-4">
      <div className={`flex items-center gap-3 p-3 border rounded ${qc.overall === "pass" ? "bg-green-50 border-green-200" : qc.overall === "fail" ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${QC_DOT[qc.overall] || QC_DOT.none}`} />
        <span className="text-sm font-semibold capitalize">{qc.overall === "none" ? t("label.qc.noData", "No QC Data") : `${t("label.qc.status", "QC")} ${qc.overall.charAt(0).toUpperCase() + qc.overall.slice(1)}`}</span>
        <span className="text-xs text-gray-500 ml-auto">{t("label.qc.analyzer", "Analyzer:")} {qc.analyzerStatus} · {t("label.qc.lastCal", "Last calibrated:")} {qc.lastCalibrated}</span>
      </div>
      {qc.controls.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("heading.qc.controlResults", "Control Results")}</div>
          {qc.controls.map((ctrl, i) => (
            <div key={i} className={`flex items-center gap-4 px-3 py-2 text-sm ${i < qc.controls.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className={`w-2 h-2 rounded-full ${ctrl.status === "pass" ? "bg-green-500" : "bg-red-500"}`} />
              <span className="font-medium w-32">{ctrl.level}</span>
              <span className="font-mono">{ctrl.value}</span>
              <span className="text-gray-400 text-xs">{t("label.qc.expected", "Expected:")} {ctrl.expected}</span>
              <span className={`ml-auto text-xs font-semibold ${ctrl.status === "pass" ? "text-green-700" : "text-red-700"}`}>{ctrl.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// History Tab
// ---------------------------------------------------------------------------
function HistoryTab({ result }) {
  return (
    <div className="p-4 space-y-3">
      {result.previousResults.length === 0 ? (
        <p className="text-sm text-gray-400">{t("label.history.none", "No previous results on record for this site and test.")}</p>
      ) : (
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("heading.history.previous", "Previous Results")} — {result.testName}</div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-6 px-4 py-2 bg-blue-50 text-sm font-semibold">
              <span className="w-28 text-gray-400 font-normal text-xs">{t("label.history.today", "Today")}</span>
              <span className="font-mono w-24">{result.result || "—"} {result.unit}</span>
              <Tag color="blue">{t("label.history.current", "Current")}</Tag>
            </div>
            {result.previousResults.map((prev, i) => (
              <div key={i} className="flex items-center gap-6 px-4 py-2 text-sm">
                <span className="w-28 text-gray-400 text-xs">{prev.date}</span>
                <span className="font-mono w-24">{prev.value} {prev.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Info Tab
// ---------------------------------------------------------------------------
function OrderInfoTab({ orderInfo }) {
  if (!orderInfo) return <div className="p-4 text-sm text-gray-400">{t("label.orderInfo.none", "No order information available.")}</div>;
  const fields = [
    { label: t("label.orderInfo.clinician", "Responsible Officer"), value: orderInfo.clinician },
    { label: t("label.orderInfo.department", "Department"), value: orderInfo.department },
    { label: t("label.orderInfo.priority", "Priority"), value: orderInfo.priority },
    { label: t("label.orderInfo.collectionDate", "Collection Date/Time"), value: orderInfo.collectionDate },
    { label: t("label.orderInfo.receivedDate", "Received Date/Time"), value: orderInfo.receivedDate },
  ].filter(f => f.value);
  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">
        {fields.map(f => (
          <div key={f.label}>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{f.label}</div>
            <div className="text-sm text-gray-800">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded Panel — same structure as results-page.jsx ExpandedPanel
// ---------------------------------------------------------------------------
const PANEL_TABS = [
  { key: "compliance", label: t("label.tab.compliance", "Compliance"),  Icon: Scale },
  { key: "qaqc",      label: t("label.tab.qaqc", "QA/QC"),            Icon: Shield },
  { key: "history",    label: t("label.tab.history", "History"),        Icon: History },
  { key: "order",      label: t("label.tab.orderInfo", "Order Info"),   Icon: ClipboardList },
];

function ExpandedPanel({ result, onOverrideSave, onResultChange, onTagToggle }) {
  const [activeTab, setActiveTab] = useState("compliance");
  const [resultValue, setResultValue] = useState(result.result);
  const isDescriptive = result.compliance?.thresholdType === "DESCRIPTIVE";
  const resultState = evaluateResult(resultValue, result.rangeBounds);
  const hasValue = isDescriptive ? (result.resultTags || []).length > 0 : resultValue.trim() !== "";

  const handleResultChange = (val) => {
    setResultValue(val);
    onResultChange(result.id, val);
  };

  return (
    <div className="border-t border-gray-200">
      {/* Site banner — environmental equivalent of PatientBanner */}
      <SampleSiteBanner site={result.sampleSite} orderInfo={result.orderInfo} />

      {/* Always-visible Notes section */}
      <NotesSection result={result} />

      {/* Result entry action bar — same layout as results-page.jsx */}
      <div className="flex flex-wrap items-end gap-4 px-4 py-3 bg-white border-b border-gray-200">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t("label.resultValue", "Result Value")}</div>
          <div className="flex items-baseline gap-2">
            {isDescriptive ? (
              <div className="w-64">
                <DescriptiveTagSelector
                  selectedTags={result.resultTags || []}
                  onTagToggle={code => onTagToggle(result.id, code)}
                  categoryHint={result.compliance?.tagCategoryHint}
                />
              </div>
            ) : (
              <>
                <input type="text" value={resultValue} onChange={e => handleResultChange(e.target.value)}
                  placeholder="—"
                  className={`w-28 border-b-2 focus:outline-none text-sm font-mono py-1 ${RANGE_INPUT_BORDER[resultState] || "border-gray-400"} ${resultState === "abnormal" ? "bg-yellow-50 text-yellow-900" : resultState === "critical" ? "bg-orange-50 text-orange-900" : "bg-transparent"}`}
                />
                <span className="text-xs text-gray-500">{result.unit}</span>
                {resultState === "abnormal" && <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">{t("label.result.abnormal", "Abnormal")}</span>}
              </>
            )}
          </div>
        </div>

        {!isDescriptive && (
          <div className="text-xs text-gray-500">
            {t("label.refRange", "Ref:")} <span className="font-mono text-gray-800">{result.normalRange} {result.unit}</span>
          </div>
        )}

        <div className="flex gap-2 ml-auto flex-wrap items-center">
          {result.compliance && <ComplianceTag status={result.compliance.status} />}
          <button disabled={!hasValue}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${hasValue ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            <Check className="w-3.5 h-3.5" /> {t("button.saveResult", "Save Result")}
          </button>
        </div>
      </div>

      {/* Tabs — same pattern as results-page.jsx */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {PANEL_TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors ${
                activeTab === key
                  ? "border-blue-700 text-blue-700 font-semibold bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50">
        {activeTab === "compliance" && <ComplianceTab result={result} onOverrideSave={onOverrideSave} />}
        {activeTab === "qaqc"       && <QAQCTab result={result} />}
        {activeTab === "history"    && <HistoryTab result={result} />}
        {activeTab === "order"      && <OrderInfoTab orderInfo={result.orderInfo} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page — same structure as results-page.jsx ResultsPageRedesign
// ---------------------------------------------------------------------------
const TABLE_HEADERS = [
  t("heading.table.labNumber", "Lab Number / Site"),
  t("heading.table.testName", "Test Name"),
  t("heading.table.sample", "Sample"),
  t("heading.table.refRange", "Ref. Range"),
  t("heading.table.result", "Result"),
  t("heading.table.flags", "Flags"),
  t("heading.table.qc", "QC"),
  t("heading.table.compliance", "Compliance"),
  t("heading.table.status", "Status"),
];

export default function S05ComplianceEvaluationMockup() {
  const [results, setResults] = useState(INITIAL_RESULTS);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleResultChange = (id, value) => {
    setResults(prev => prev.map(r => {
      if (r.id !== id) return r;
      const comp = r.compliance;
      if (!comp || comp.thresholdType === "DESCRIPTIVE") return { ...r, result: value };
      const newStatus = evaluateCompliance(value, comp);
      return { ...r, result: value, compliance: { ...comp, status: newStatus } };
    }));
  };

  const handleTagToggle = (id, tagCode) => {
    setResults(prev => prev.map(r => {
      if (r.id !== id) return r;
      const current = r.resultTags || [];
      const updated = current.includes(tagCode) ? current.filter(tc => tc !== tagCode) : [...current, tagCode];
      const comp = r.compliance;
      if (!comp) return { ...r, resultTags: updated };
      const newStatus = evaluateDescriptive(updated, comp.expectedTags || []);
      return { ...r, resultTags: updated, compliance: { ...comp, status: newStatus } };
    }));
  };

  const handleOverrideSave = (id, overrideStatus, justification) => {
    setResults(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { ...r, compliance: { ...r.compliance, status: overrideStatus, overridden: true, overrideJustification: justification } };
    }));
  };

  const filtered = results.filter(r => {
    const q = searchQuery.toLowerCase();
    return !q || r.testName.toLowerCase().includes(q) || r.labNumber.toLowerCase().includes(q) || r.sampleSite.name.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-sm">
      {/* Preview banner */}
      <div className="bg-blue-50 border-b-2 border-blue-600 px-4 py-2 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-blue-700 font-semibold">{t("label.preview.title", "Preview — S-05 Compliance Evaluation Engine v2")}</span>
        <span className="text-gray-500">— {t("label.preview.subtitle", "Results Entry Extension · Environmental Samples · OpenELIS Global")}</span>
        <span className="ml-auto text-gray-400">{t("label.preview.interactive", "Interactive mockup — extends results-page.jsx v3")}</span>
      </div>

      {/* Shell header — same as results-page.jsx */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-2 text-sm">
        <span className="text-blue-400 font-bold">OpenELIS Global</span>
        <span className="text-gray-500">›</span>
        <span>{t("nav.results", "Results")}</span>
        <span className="text-gray-500">›</span>
        <span>{t("nav.resultsEntry", "Results Entry")}</span>
      </div>

      {/* Page heading — same as results-page.jsx */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-2xl font-light text-gray-900">{t("heading.resultsEntry", "Results Entry")}</h1>
        <p className="text-gray-500 text-xs mt-0.5">{t("heading.resultsEntry.subtitle", "Enter and manage test results for pending laboratory orders")}</p>
      </div>

      {/* Toolbar — same as results-page.jsx */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-52 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text"
              className="w-full pl-8 pr-3 py-2 border border-gray-400 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder={t("placeholder.search", "Search — lab number, site name, test name…")}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="min-w-44">
            <div className="text-xs text-gray-500 mb-1">{t("label.labUnit", "Lab Unit")} <span className="text-red-500">*</span></div>
            <select className="w-full border border-gray-400 bg-gray-50 text-sm py-2 px-2 focus:outline-none focus:ring-1 focus:ring-blue-600">
              <option>{t("label.labUnit.environmental", "Environmental Testing")}</option>
              <option>{t("label.labUnit.all", "All Lab Units")}</option>
            </select>
          </div>
          {[t("label.dateFrom", "Date From"), t("label.dateTo", "Date To")].map(lbl => (
            <div key={lbl} className="min-w-36">
              <div className="text-xs text-gray-500 mb-1">{lbl}</div>
              <input type="date" defaultValue="2026-04-04"
                className="w-full border border-gray-400 bg-gray-50 text-sm py-2 px-2 focus:outline-none focus:ring-1 focus:ring-blue-600" />
            </div>
          ))}
          <button className="px-4 py-2 bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 whitespace-nowrap">
            {t("button.loadResults", "Load Results")}
          </button>
        </div>
      </div>

      {/* ====== S-05 ADDITION: Compliance Summary Banner ====== */}
      <div className="mx-4 mt-4">
        <ComplianceSummaryBanner results={results} standard={COMPLIANCE_STANDARD} />
      </div>

      {/* Results table — same structure as results-page.jsx */}
      <div className="mx-4 mt-0 bg-white border border-gray-200 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="w-10" />
              {TABLE_HEADERS.map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(result => {
              const isExpanded = expandedId === result.id;
              const rs = evaluateResult(result.result, result.rangeBounds);
              const isDescriptive = result.compliance?.thresholdType === "DESCRIPTIVE";

              return (
                <React.Fragment key={result.id}>
                  <tr className={`border-b border-gray-100 transition-colors ${isExpanded ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    {/* Expand chevron */}
                    <td className="w-10 text-center">
                      <button onClick={() => setExpandedId(isExpanded ? null : result.id)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        aria-label={isExpanded ? t("button.collapse", "Collapse") : t("button.expand", "Expand")}>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-700" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </button>
                    </td>

                    {/* Lab Number / Site */}
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs text-gray-700">{result.labNumber}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate max-w-32" title={result.sampleSite.name}>{result.sampleSite.siteId}</div>
                    </td>

                    {/* Test Name */}
                    <td className="px-3 py-3 max-w-48"><div className="font-medium text-gray-900">{result.testName}</div></td>

                    {/* Sample */}
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">{result.sampleType}</td>

                    {/* Ref Range */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-700">{result.normalRange}</span>
                      {result.unit !== "—" && <span className="text-xs text-gray-400 ml-1">{result.unit}</span>}
                    </td>

                    {/* Result — inline input colored by range tier */}
                    <td className={`px-3 py-3 ${RANGE_CELL_BG[rs] || ""}`}>
                      {isDescriptive ? (
                        <div className="flex flex-wrap gap-1">
                          {(result.resultTags || []).slice(0, 2).map(code => {
                            const tag = DESCRIPTIVE_TAGS.find(dt => dt.code === code);
                            return <span key={code} className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{tag?.displayText || code}</span>;
                          })}
                          {(result.resultTags || []).length > 2 && <span className="text-xs text-gray-500">+{result.resultTags.length - 2}</span>}
                          {(result.resultTags || []).length === 0 && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      ) : (
                        <input type="text" value={result.result} placeholder="—"
                          onChange={e => handleResultChange(result.id, e.target.value)}
                          className={`w-20 border-b-2 focus:outline-none text-xs font-mono py-0.5 bg-transparent ${RANGE_INPUT_BORDER[rs] || "border-gray-300"} ${RANGE_CELL_TEXT[rs] || "text-gray-700"}`}
                        />
                      )}
                    </td>

                    {/* Flags */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex gap-1 items-center">
                        {result.flags.includes("above-normal") && <span className="text-red-600 font-bold text-xs" title={t("label.flag.high", "Above normal range")}>H</span>}
                        {result.flags.includes("below-normal") && <span className="text-blue-600 font-bold text-xs" title={t("label.flag.low", "Below normal range")}>L</span>}
                        {rs === "critical" && <span className={`px-1 py-0.5 rounded text-xs font-bold ${RANGE_FLAG_BADGE.critical}`}>C</span>}
                        {result.flags.length === 0 && rs !== "critical" && <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </td>

                    {/* QC dot */}
                    <td className="px-3 py-3">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${QC_DOT[result.qcStatus] || QC_DOT.none}`} title={`${t("label.qc.status", "QC")} ${result.qcStatus}`} />
                    </td>

                    {/* ====== S-05 ADDITION: Compliance column ====== */}
                    <td className="px-3 py-3"><ComplianceTag status={result.compliance?.status} /></td>

                    {/* Status */}
                    <td className="px-3 py-3"><StatusTag status={result.status} /></td>
                  </tr>

                  {/* Expanded panel — same colSpan pattern as results-page.jsx */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={TABLE_HEADERS.length + 1} className="p-0">
                        <ExpandedPanel
                          result={result}
                          onOverrideSave={handleOverrideSave}
                          onResultChange={handleResultChange}
                          onTagToggle={handleTagToggle}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mx-4 mt-4 mb-8 p-4 bg-white border border-gray-200 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">{t("heading.legend.compliance", "Compliance Indicators (S-05)")}</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2"><ComplianceTag status="pass" /><span className="text-gray-600">{t("label.legend.pass", "Result meets regulatory threshold")}</span></div>
          <div className="flex items-center gap-2"><ComplianceTag status="marginal" /><span className="text-gray-600">{t("label.legend.marginal", "Within marginal zone — approaching limit")}</span></div>
          <div className="flex items-center gap-2"><ComplianceTag status="fail" /><span className="text-gray-600">{t("label.legend.fail", "Exceeds regulatory threshold — non-compliant")}</span></div>
          <div className="flex items-center gap-2"><ComplianceTag status="unit-mismatch" /><span className="text-gray-600">{t("label.legend.unitMismatch", "Unit conversion not possible — manual review required")}</span></div>
        </div>
      </div>
    </div>
  );
}
