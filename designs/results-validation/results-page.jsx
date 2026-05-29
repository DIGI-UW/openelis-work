/**
 * Results Entry — Interactive Preview v3
 * OpenELIS Global · Carbon-aligned redesign
 * Route: /Results  (replaces /LogbookResults, /PatientResults, /AccessionResults,
 *                   /StatusResults, /RangeResults, /result)
 * SideNav: Results → (default view; search-by filters surface as facets)
 *
 * ─────────────────────────────────────────────────────────────────────────
 *   IMPORTANT — IMPLEMENTATION NOTE
 *   This mockup uses Tailwind utility classes + raw HTML elements
 *   (<select>, <input>, <table>, <button>) for portable rendering
 *   in the gallery preview. Production implementation MUST use
 *   @carbon/react components per the §Carbon Component Map section
 *   of results-page-v3-frs.md. Patterns the Tailwind mockup does NOT
 *   demonstrate but MUST be used in production:
 *     - Carbon Tabs / Tab / TabList / TabPanels / TabPanel
 *     - Carbon Modal / ComposedModal (for E-Sig + Storage Picker)
 *     - Carbon FileUploader / CompactFileInput
 *     - Carbon ToastNotification / ActionableNotification
 *     - Carbon Accordion + AccordionItem (for collapsible sections)
 *     - Carbon DataTable + TableExpandRow + TableExpandedRow
 *     - Carbon NumberInput / Select / Dropdown / MultiSelect / TextArea
 * ─────────────────────────────────────────────────────────────────────────
 *
 * v3 changes vs v2.x:
 *   - Drop in-page tabs for Method, Order Info, Referral, Attachments → always-visible sections
 *   - Keep tabs for QA/QC + History only (low-frequency surfaces)
 *   - Add Storage location inline section (LocationPicker stub) — was missing entirely
 *   - Add Current Result column (read-only previous value)
 *   - Add Analyzer Result column (which analyzer fed the row)
 *   - Add inline editable Test Date + Time (date + hh + mm pickers per row)
 *   - Polymorphic Result cell by resultType: N (numeric), D (dictionary single), M (multi-checkbox)
 *     (C cascading documented in spec; out of scope for v1 mockup)
 *   - Methods dropdown (per-row method override, distinct from Manual/Analyzer toggle)
 *   - Refer-out inline checkbox-gated form (out of Referral tab)
 *   - NCE form gains "Result Disposition" field (Cancel / Reject / Retest / Refer)
 *     — replaces the standalone Reject column entirely
 *   - EQA priority badge (STANDARD/URGENT/CRITICAL) on EQA-sourced rows
 *   - Nonconforming legend strip above the table + row-level nonconforming icon
 *   - Patient avatar (initials, color-hashed)
 *   - Copy-accession-to-clipboard button per row
 *   - Past Notes legacy section (preserves linebreaks) alongside structured Notes
 *   - E-signature on Save (wrapper modal stub)
 *   - Server-side pagination indicator (top) distinct from client pagination (bottom)
 *   - Reflex / Calculated test toasts after save
 *   - STAT result fires validator notification stub
 *   - Role-based PII masking (PATIENT_DATA_ON_RESULTS_BY_ROLE) harmonized with
 *     site-wide showPatientName toggle: site-wide overrides role-based
 *   - Stale-page conflict guard (toast warning if another user saved same accession)
 *   - Workplan deep-link breadcrumb (when ?source=WorkPlan...)
 *
 * v3 drops:
 *   - Accept Unconditionally column (OGC-745 idle/armed/committed) — workflow rejected
 *   - Standalone Reject column — folded into NCE Result Disposition
 */
import { useState, useMemo } from "react";
import {
  Search, ChevronRight, ChevronDown, ChevronUp, Check, AlertTriangle,
  FileText, Microscope, Paperclip, History, FlaskConical, Send,
  Plus, Trash2, Download, X, Info, Shield, ClipboardList,
  MessageSquare, AlertCircle, ExternalLink, Pencil,
  Copy, MapPin, Calendar, Clock, KeyRound, Bell, RefreshCw, Lock, BookOpen
} from "lucide-react";

// ---------------------------------------------------------------------------
// i18n stub — every visible string is wrapped t(key, fallback)
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function calcAge(dob) {
  if (!dob) return "—";
  const [m, d, y] = dob.split("/").map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return `${age}y`;
}

// Color-hash a string to one of N color buckets (for avatar / EQA tiles)
function colorHash(str, palette) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

// Returns: 'empty' | 'normal' | 'abnormal' | 'critical' | 'invalid'
// Evaluation order: invalid (impossible) → critical (panic) → abnormal (out-of-normal) → normal
function evaluateResult(value, rangeBounds) {
  const num = parseFloat(value);
  if (value === "" || value == null || isNaN(num) || !rangeBounds) return "empty";
  const { normal, critical, valid } = rangeBounds;
  if (valid   && (num < valid.low    || num > valid.high))    return "invalid";
  if (critical && (num < critical.low || num > critical.high)) return "critical";
  if (normal   && (num < normal.low   || num > normal.high))   return "abnormal";
  return "normal";
}

function getCriticalMsg(value, rangeBounds) {
  if (!rangeBounds?.critical) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  if (num < rangeBounds.critical.low) return rangeBounds.critical.lowMsg;
  if (num > rangeBounds.critical.high) return rangeBounds.critical.highMsg;
  return null;
}

function genNceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `NCE-${y}${m}${d}-${seq}`;
}

// ---------------------------------------------------------------------------
// Mock data — mixed result types so the polymorphic cell is exercised
// ---------------------------------------------------------------------------
const LAB_UNITS = [
  { id: "",            nameKey: "labUnit.placeholder",   defaultName: "Select Test Unit…" },
  { id: "hematology",  nameKey: "labUnit.hematology",    defaultName: "Hematology" },
  { id: "chemistry",   nameKey: "labUnit.chemistry",     defaultName: "Chemistry" },
  { id: "microbiology",nameKey: "labUnit.microbiology",  defaultName: "Microbiology" },
  { id: "serology",    nameKey: "labUnit.serology",      defaultName: "Serology-Immunology" },
];

const METHODS_LOOKUP = [
  { id: "MAN",     label: "Manual" },
  { id: "AUTO",    label: "Automated" },
  { id: "SEMIAUTO",label: "Semi-Automated" },
  { id: "POC",     label: "Point of Care" },
];

const ANALYZERS_LOOKUP = [
  { id: "SXN-L",    label: "Sysmex XN-L",       status: "online",  qc: "pass"    },
  { id: "SXS-1k",   label: "Sysmex XS-1000i",   status: "online",  qc: "pass"    },
  { id: "CC501",    label: "Cobas c 501",       status: "online",  qc: "pass"    },
  { id: "CC311",    label: "Cobas c 311",       status: "offline", qc: "none"    },
];

const REJECTION_REASONS = [
  "Hemolyzed sample",
  "Insufficient quantity (QNS)",
  "Clotted sample",
  "Incorrect container",
  "Mislabeled / unlabeled",
  "Sample expired",
  "Other (specify in NCE description)",
];

const REFERRAL_REASONS = [
  "Capacity — send-out test",
  "Equipment malfunction",
  "Specialist confirmation required",
  "Patient request",
  "Regulatory requirement",
  "Other",
];

const REFERRAL_INSTITUTES = [
  "National Reference Laboratory",
  "University Hospital Lab",
  "Regional Reference Center",
  "WHO Collaborating Center",
];

const INITIAL_RESULTS = [
  {
    id: "1",
    labNumber: "DEV01260000000000000",
    sequenceNumber: "017-1",
    patient: { name: "Loy, Mbugaa", id: "3456789", dob: "01/11/2011", sex: "M", nationalId: "TZ-100029384" },
    testDate: "12/18/2025",
    testTime: "09:30",
    testName: "Hemoglobin",
    sampleType: "Whole Blood",
    normalRange: "16.00 - 20.00",
    unit: "g/dL",
    rangeBounds: {
      normal:   { low: 16.0, high: 20.0 },
      critical: { low: 7.0,  high: 25.0,
                  lowMsg: "Critical anemia — Hgb < 7.0 g/dL",
                  highMsg: "Critical polycythemia — Hgb > 25.0 g/dL" },
      valid:    { low: 1.0,  high: 30.0 },
    },
    resultType: "N",
    result: "",
    currentResult: "",                 // shadow / previous result
    status: "pending",
    method: { id: "MAN", source: "manual" },
    analyzer: null,
    analyzerResult: "MANUAL",          // free-text label of which analyzer (or MANUAL) fed this
    flags: [],
    nonconforming: false,
    program: null,                     // { name, dueDate, priority: 'STANDARD'|'URGENT'|'CRITICAL' }
    storage: { path: "Freezer A → Rack 2 → Shelf 3 → Box 7", coords: "Pos B-04", condition: "−20 °C" },
    previousResults: [
      { date: "12/01/2025", value: "17.2", unit: "g/dL", delta: null },
      { date: "11/15/2025", value: "16.9", unit: "g/dL", delta: "+1.8%" },
    ],
    notes: [
      { id: 1, date: "12/18/2025 09:45", author: "J. Smith", type: "internal", body: "Sample slightly hemolyzed — flag for review at validation." },
    ],
    pastNotesLegacy: "2025-11-15  Repeat draw after fasting.\n2025-08-22  Patient on iron therapy.",
    attachments: [
      { id: 1, name: "Requisition_Form.pdf", size: "245 KB", uploadedBy: "Order Entry", uploadedAt: "12/18/2025 08:00", source: "order" },
    ],
    orderInfo: {
      clinician: "Dr. Sarah Williams", clinicianPhone: "+1 555-0123",
      department: "Internal Medicine", priority: "Routine",
      collectionDate: "12/18/2025 08:30", receivedDate: "12/18/2025 09:00",
      clinicalHistory: "Annual checkup, patient reports fatigue",
      diagnosis: "R53.83 - Other fatigue", fastingStatus: "Non-fasting",
    },
    qcData: {
      overall: "pass",
      controls: [
        { level: "Level 1", value: "17.0", expected: "17.0 ± 0.5", status: "pass" },
        { level: "Level 2", value: "12.5", expected: "12.5 ± 0.5", status: "pass" },
      ],
      analyzerStatus: "Manual entry", lastCalibrated: "—",
    },
    interpretationOptions: [
      { code: "HGB-NL", label: "Normal",  color: "green", range: "16.0–20.0", text: "Hemoglobin within normal limits." },
      { code: "HGB-LO", label: "Anemia",  color: "stone", range: "<16.0",     text: "Decreased hemoglobin. Suggests anemia. Recommend correlation with RBC, MCV, reticulocyte count." },
      { code: "HGB-HI", label: "Polycythemia", color: "red", range: ">20.0",  text: "Elevated hemoglobin. May suggest polycythemia, dehydration, or chronic hypoxia." },
    ],
    suggestedInterpretation: null,
    deltaCheck: null,
    referral: null,
    nce: null,
    isEqaSample: false,
  },
  {
    id: "2",
    labNumber: "DEV01260000000000001",
    sequenceNumber: "022-1",
    patient: { name: "Smith, Jane", id: "7891234", dob: "05/22/1985", sex: "F", nationalId: "TZ-100487291" },
    testDate: "12/18/2025",
    testTime: "10:15",
    testName: "Glucose, Fasting",
    sampleType: "Serum",
    normalRange: "70 - 99",
    unit: "mg/dL",
    rangeBounds: {
      normal:   { low: 70,  high: 99 },
      critical: { low: 50,  high: 400, lowMsg: "Critical hypoglycemia — Glucose < 50 mg/dL", highMsg: "Critical hyperglycemia — Glucose > 400 mg/dL" },
      valid:    { low: 20,  high: 600 },
    },
    // BR-036: range selected by demographics (CLSI EP28-A3c). Other configured ranges
    // for this test (Pediatric, Pregnancy, Geriatric) would also exist in Test Catalog.
    selectedRangeLabel: "Adult Female (18–65y)",
    resultType: "N",
    result: "142",
    currentResult: "98",
    // BR-035: prior modification chain — visible in the Modification History banner.
    // ALCOA+ "Original" retrievability per CFR Part 11 §11.10(e) / ISO 15189 §7.5.2.
    modificationHistory: [
      { id: 1, fromValue: "145", toValue: "142", modifiedBy: "K. Davis", modifiedAt: "12/18/2025 11:50",
        reason: "Tech transcription correction — instrument printout shows 142 mg/dL, not 145." },
    ],
    // BR-037: aliquots derived from this sample
    aliquots: [
      { id: "DEV01260000000000001-022.1", purpose: "Test", linkedTest: "HbA1c", status: "Created", createdAt: "12/18/2025 11:30", createdBy: "K. Davis", storage: "—" },
      { id: "DEV01260000000000001-022.2", purpose: "Retention", linkedTest: null, status: "In-Storage", createdAt: "12/18/2025 11:32", createdBy: "K. Davis", storage: "Freezer A → Rack 3 → Shelf 1 → Box 4 (Pos C-02)" },
    ],
    status: "awaiting-validation",
    method: { id: "AUTO", source: "analyzer" },
    analyzer: "CC501",
    analyzerResult: "Cobas c 501",
    flags: ["above-normal", "delta-check"],
    nonconforming: false,
    program: {
      name: "EQA Round 4",
      dueDate: "12/20/2025",
      priority: "URGENT",
      // Up to 15 program-captured fields rendered by ProgramInfoSection.
      // Field set is config-driven per program type (EQA vs. RETROCI ARV/EID/VL vs. custom study).
      fields: [
        { label: "EQA Panel ID",         value: "EQA-CHEM-2025-Q4-PANEL-07", type: "text" },
        { label: "Round Number",         value: "4", type: "text" },
        { label: "Specimen Code",        value: "S-2025-Q4-022", type: "text" },
        { label: "Expected Analyte",     value: "Glucose", type: "text" },
        { label: "Submission Deadline",  value: "12/20/2025 23:59", type: "datetime" },
        { label: "Lab Code (Provider)",  value: "MG-LAB-018", type: "text" },
        { label: "Round Coordinator",    value: "Dr. F. Andriantefison", type: "text" },
        { label: "Provider Comments",    value: "Sample stable at 2–8 °C for 14 days from receipt.", type: "longtext" },
      ],
    },
    storage: { path: "Refrigerator B → Shelf 1 → Box 12", coords: "Pos A-09", condition: "2–8 °C" },
    previousResults: [
      { date: "12/01/2025", value: "98",  unit: "mg/dL", delta: null },
      { date: "11/01/2025", value: "102", unit: "mg/dL", delta: "+4.1%" },
    ],
    notes: [{ id: 1, date: "12/18/2025 11:30", author: "K. Davis", type: "external", body: "Patient confirmed 12-hour fast prior to collection." }],
    pastNotesLegacy: "",
    attachments: [
      { id: 1, name: "Insurance_Auth.pdf", size: "89 KB", uploadedBy: "Order Entry", uploadedAt: "12/18/2025 06:45", source: "order" },
    ],
    orderInfo: {
      clinician: "Dr. Michael Chen", clinicianPhone: "+1 555-0456",
      department: "Endocrinology", priority: "STAT",
      collectionDate: "12/18/2025 07:00", receivedDate: "12/18/2025 07:30",
      clinicalHistory: "Follow-up for prediabetes, weight loss program",
      fastingStatus: "Fasting (12 hours)",
    },
    qcData: {
      overall: "pass",
      controls: [
        { level: "Level 1", value: "85", expected: "82 ± 5", status: "pass" },
        { level: "Level 2", value: "210", expected: "208 ± 12", status: "pass" },
      ],
      analyzerStatus: "Online", lastCalibrated: "12/18/2025 06:15",
    },
    interpretationOptions: [
      { code: "GLU-NL",   label: "Normal",                   color: "green", range: "70–99",       text: "Fasting glucose within normal limits." },
      { code: "GLU-IFG",  label: "Impaired Fasting Glucose", color: "stone", range: "100–125",     text: "Fasting glucose in prediabetic range. Recommend lifestyle modifications." },
      { code: "GLU-DM",   label: "Diabetes Mellitus",        color: "red",   range: "≥126",        text: "Fasting glucose ≥126 mg/dL is consistent with diabetes mellitus. Recommend confirmation with repeat fasting glucose or HbA1c." },
    ],
    suggestedInterpretation: { code: "GLU-DM", label: "Diabetes Mellitus", color: "red", text: "Fasting glucose ≥126 mg/dL is consistent with diabetes mellitus. Recommend confirmation with repeat fasting glucose or HbA1c." },
    deltaCheck: { previous: "98", current: "142", change: "+44.9%", threshold: "20%" },
    referral: null,
    nce: null,
    isEqaSample: true,
  },
  {
    id: "3",
    labNumber: "DEV01260000000000002",
    sequenceNumber: "031-1",
    patient: { name: "Test, Patient", id: "3456790", dob: "06/05/2026", sex: "M", nationalId: "TZ-100029999" },
    testDate: "12/18/2025",
    testTime: "11:45",
    testName: "HIV 1/2 Rapid",
    sampleType: "Whole Blood",
    normalRange: "—",
    unit: "",
    rangeBounds: null,
    resultType: "D",            // dictionary single-select
    dictionaryOptions: [
      { id: "HIV_NR",   label: "Non-Reactive" },
      { id: "HIV_R",    label: "Reactive" },
      { id: "HIV_IND",  label: "Indeterminate" },
      { id: "HIV_INV",  label: "Invalid" },
    ],
    result: "",
    currentResult: "",
    status: "pending",
    method: { id: "MAN", source: "manual" },
    analyzer: null,
    analyzerResult: "MANUAL",
    flags: [],
    nonconforming: true,        // sample/order nonconforming → row icon + tooltip
    program: null,
    storage: { path: null, coords: null, condition: null },   // Unassigned
    previousResults: [],
    notes: [],
    pastNotesLegacy: "",
    attachments: [],
    orderInfo: {
      clinician: "Dr. Lisa Park", clinicianPhone: "+1 555-0789",
      department: "Primary Care", priority: "Routine",
      collectionDate: "12/18/2025 10:30", receivedDate: "12/18/2025 11:30",
    },
    qcData: { overall: "none", controls: [], analyzerStatus: "—", lastCalibrated: "—" },
    interpretationOptions: [],
    suggestedInterpretation: null,
    deltaCheck: null,
    referral: null,
    nce: null,
    isEqaSample: false,
  },
  {
    id: "4",
    labNumber: "DEV01260000000000003",
    sequenceNumber: "045-1",
    patient: { name: "Johnson, Robert", id: "5551234", dob: "03/14/1960", sex: "M", nationalId: "TZ-100876412" },
    testDate: "12/18/2025",
    testTime: "12:10",
    testName: "Stool — Microscopy (Ova & Parasites)",
    sampleType: "Stool",
    normalRange: "—",
    unit: "",
    rangeBounds: null,
    resultType: "M",            // multi-checkbox dictionary
    dictionaryOptions: [
      { id: "OVA_AL", label: "Ascaris lumbricoides" },
      { id: "OVA_TT", label: "Trichuris trichiura" },
      { id: "OVA_HW", label: "Hookworm" },
      { id: "OVA_GL", label: "Giardia lamblia" },
      { id: "OVA_EH", label: "Entamoeba histolytica" },
      { id: "OVA_SM", label: "Schistosoma mansoni" },
      { id: "OVA_NEG",label: "No parasites seen" },
    ],
    result: "OVA_GL,OVA_EH",        // CSV of selected IDs
    currentResult: "OVA_NEG",
    status: "awaiting-validation",
    method: { id: "MAN", source: "manual" },
    analyzer: null,
    analyzerResult: "MANUAL — Microscopy",
    flags: [],
    nonconforming: false,
    program: null,
    storage: { path: "Specimen Cabinet — Stool → Shelf 2", coords: "Pos 14", condition: "RT" },
    previousResults: [
      { date: "08/14/2025", value: "OVA_NEG", unit: "", delta: null },
    ],
    notes: [],
    pastNotesLegacy: "",
    attachments: [],
    orderInfo: {
      clinician: "Dr. Asha Iyer", clinicianPhone: "+1 555-0999",
      department: "Gastroenterology", priority: "Routine",
      collectionDate: "12/18/2025 09:00", receivedDate: "12/18/2025 11:00",
      clinicalHistory: "Recurrent abdominal pain, recent travel to East Africa",
    },
    qcData: { overall: "none", controls: [], analyzerStatus: "Manual entry", lastCalibrated: "—" },
    interpretationOptions: [],
    suggestedInterpretation: null,
    deltaCheck: null,
    referral: null,
    nce: null,
    isEqaSample: false,
  },
];

// ---------------------------------------------------------------------------
// Design tokens — Carbon-aligned (mapped 1:1 to <Tag kind="..."> in production)
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  pending:               { label: "Pending",              kind: "gray"      },
  entered:               { label: "Entered",              kind: "blue"      },
  "awaiting-validation": { label: "Awaiting Validation",  kind: "warm-gray" },
  released:              { label: "Released",             kind: "green"     },
  cancelled:             { label: "Cancelled",            kind: "red"       },
};

const COLOR_CONFIG = {
  green:  { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-400" },
  red:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-400" },
  stone:  { bg: "bg-stone-100",  text: "text-stone-700",  border: "border-stone-400" },
  blue:   { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-400" },
  purple: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-400" },
  teal:   { bg: "bg-teal-100",   text: "text-teal-800",   border: "border-teal-400" },
  gray:   { bg: "bg-gray-200",   text: "text-gray-700",   border: "border-gray-400" },
  amber:  { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-400" },
  magenta:{ bg: "bg-fuchsia-100",text: "text-fuchsia-800",border: "border-fuchsia-400" },
};

const QC_DOT = {
  pass: "bg-green-500", warning: "bg-yellow-400", fail: "bg-red-500", none: "bg-gray-300",
};

// Result range visual styles
const RANGE_INPUT_BORDER = {
  empty: "border-gray-300", normal: "border-gray-400",
  abnormal: "border-yellow-500", critical: "border-orange-500", invalid: "border-red-800",
};
const RANGE_CELL_BG = {
  empty: "", normal: "",
  abnormal: "bg-yellow-50", critical: "bg-orange-50", invalid: "bg-red-950",
};
const RANGE_CELL_TEXT = {
  empty: "text-gray-700", normal: "text-gray-700",
  abnormal: "text-yellow-900", critical: "text-orange-900", invalid: "text-red-100",
};
const RANGE_FLAG_BADGE = {
  abnormal: "bg-yellow-100 text-yellow-800",
  critical: "bg-orange-100 text-orange-900",
  invalid:  "bg-red-900 text-red-100",
};

const NCE_SUBCATEGORIES = {
  "Pre-Analytical":  ["Specimen Collection", "Specimen Labeling", "Specimen Transport", "Specimen Integrity", "Container Issue", "Order Entry"],
  "Analytical":      ["Equipment Malfunction", "QC Failure", "Reagent Issue", "Testing Error", "Result Discrepancy", "Result Nullification"],
  "Post-Analytical": ["Reporting Error", "Transcription Error", "Result Delay", "Interpretation Error", "Referral Result Rejection"],
  "Administrative":  ["Documentation Gap", "Process Deviation", "Communication Failure", "Training Issue", "Test Cancellation", "Order Cancellation"],
};

const EQA_PRIORITY = {
  STANDARD: { label: "EQA — Standard", kind: "purple" },
  URGENT:   { label: "EQA — Urgent",   kind: "amber"  },
  CRITICAL: { label: "EQA — Critical", kind: "red"    },
};

const AVATAR_PALETTE = ["#0f62fe", "#8a3ffc", "#198038", "#ff832b", "#d12771", "#005d5d"];

// ---------------------------------------------------------------------------
// Tiny reusable components (Carbon-equivalent in production)
// ---------------------------------------------------------------------------
function Tag({ kind = "gray", children, title }) {
  const c = COLOR_CONFIG[kind] || COLOR_CONFIG.gray;
  return (
    <span title={title}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {children}
    </span>
  );
}

function StatusTag({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <Tag kind={c.kind}>{c.label}</Tag>;
}

// PatientAvatar — initials in a color-hashed circle (stub for AsyncAvatar)
function PatientAvatar({ patient, size = 32 }) {
  const initials = (patient.name || "").split(",").map(p => p.trim()[0] || "").join("").slice(0,2).toUpperCase();
  const bg = colorHash(patient.id || patient.name, AVATAR_PALETTE);
  return (
    <span aria-hidden="true"
      style={{ width: size, height: size, background: bg }}
      className="inline-flex items-center justify-center rounded-full text-white text-xs font-semibold flex-shrink-0">
      {initials}
    </span>
  );
}

function EQABadge({ program }) {
  if (!program) return null;
  const cfg = EQA_PRIORITY[program.priority] || EQA_PRIORITY.STANDARD;
  return <Tag kind={cfg.kind} title={`${cfg.label} · Due ${program.dueDate}`}>{cfg.label}</Tag>;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    if (navigator?.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={onCopy} title={t("button.copy", "Copy")}
      className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800">
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function SectionHeader({ label, open, onToggle, badge, action }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {label}
        {badge && <span className="text-xs font-normal text-gray-400">{badge}</span>}
      </div>
      <div className="flex items-center gap-2">
        {action}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient Banner — full name visible in expanded panel only
// ---------------------------------------------------------------------------
function PatientBanner({ patient, orderInfo }) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-gray-100 border-b border-gray-200 text-sm">
      <PatientAvatar patient={patient} size={36} />
      <span className="font-semibold text-gray-900">{patient.name}</span>
      <span className="text-gray-400 text-xs">{t("label.patient.id","ID")}: <strong className="text-gray-700">{patient.id}</strong></span>
      <span className="text-gray-400 text-xs">{t("label.patient.nationalId","National ID")}: <strong className="text-gray-700">{patient.nationalId}</strong></span>
      <span className="text-gray-400 text-xs">{t("label.patient.dob","DOB")}: <strong className="text-gray-700">{patient.dob}</strong></span>
      <span className="text-gray-400 text-xs">{t("label.patient.sex","Sex")}: <strong className="text-gray-700">{patient.sex}</strong></span>
      <span className="text-gray-400 text-xs">{t("label.patient.age","Age")}: <strong className="text-gray-700">{calcAge(patient.dob)}</strong></span>
      {orderInfo?.clinician && <span className="text-gray-400 text-xs">{t("label.order.clinician","Clinician")}: <strong className="text-gray-700">{orderInfo.clinician}</strong></span>}
      {orderInfo?.department && <span className="text-gray-400 text-xs">{t("label.order.department","Dept")}: <strong className="text-gray-700">{orderInfo.department}</strong></span>}
      {orderInfo?.priority && <Tag kind={orderInfo.priority === "STAT" ? "red" : "gray"}>{orderInfo.priority}</Tag>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Always-visible Notes section — supports structured notes + legacy past notes
// ---------------------------------------------------------------------------
function NotesSection({ result }) {
  const [notes, setNotes] = useState(result.notes);
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("internal");

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [...prev, {
      id: Date.now(), date: new Date().toLocaleDateString(), author: "Current User",
      type: noteType, body: newNote.trim(),
    }]);
    setNewNote(""); setShowForm(false);
  };

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><MessageSquare className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.notes","Notes")}</>}
        open={open}
        onToggle={() => setOpen(o => !o)}
        badge={notes.length ? `(${notes.length})` : null}
      />
      {open && (
        <div className="px-4 py-3 space-y-2 bg-white">
          {notes.length === 0 && !showForm && !result.pastNotesLegacy && (
            <p className="text-xs text-gray-400">{t("message.notes.empty","No notes yet.")}</p>
          )}
          {notes.map(note => (
            <div key={note.id} className="flex gap-3 text-sm">
              <div className="flex-1 border-l-2 border-gray-200 pl-3">
                <div className="flex gap-2 text-xs text-gray-400 mb-0.5 flex-wrap">
                  <span>{note.date}</span>
                  <span className="text-gray-500 font-medium">{note.author}</span>
                  <Tag kind={note.type === "internal" ? "purple" : "teal"}>
                    {note.type === "internal" ? t("label.notes.inLab","In Lab Only") : t("label.notes.sendWithResult","Send with Result")}
                  </Tag>
                </div>
                <div className="text-gray-800 text-sm whitespace-pre-line">{note.body}</div>
              </div>
            </div>
          ))}

          {/* Legacy past-notes — preserves linebreaks from older versions of OpenELIS */}
          {result.pastNotesLegacy && (
            <div className="text-xs text-gray-500 border-l-2 border-gray-100 pl-3 italic">
              <div className="font-medium text-gray-400 mb-0.5">{t("label.notes.legacy","Past notes (legacy, plain text)")}:</div>
              <div className="whitespace-pre-line text-gray-600">{result.pastNotesLegacy}</div>
            </div>
          )}

          {showForm ? (
            <div className="bg-gray-50 border border-gray-200 p-3 space-y-2">
              <div className="flex gap-4 text-xs">
                {["internal", "external"].map(type => (
                  <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name={`note-type-${result.id}`} value={type}
                      checked={noteType === type} onChange={() => setNoteType(type)} />
                    {type === "internal" ? t("label.notes.inLab","In Lab Only") : t("label.notes.sendWithResult","Send with Result")}
                  </label>
                ))}
              </div>
              <textarea
                className="w-full border border-gray-300 text-sm p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                rows={2} value={newNote} onChange={e => setNewNote(e.target.value)}
                placeholder={t("placeholder.notes.text","Enter note…")} autoFocus
              />
              <div className="flex gap-2">
                <button onClick={addNote} className="px-3 py-1 bg-blue-700 text-white text-xs font-medium hover:bg-blue-800">{t("button.notes.save","Save Note")}</button>
                <button onClick={() => setShowForm(false)} className="px-3 py-1 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">{t("button.cancel","Cancel")}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs text-blue-700 hover:underline">
              <Plus className="w-3 h-3" /> {t("button.notes.new","New Note")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Always-visible Interpretation section
// ---------------------------------------------------------------------------
function InterpretationSection({ result }) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(result.suggestedInterpretation?.code || null);
  const [text, setText] = useState(result.suggestedInterpretation?.text || "");

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><Microscope className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.interpretation","Interpretation")}</>}
        open={open}
        onToggle={() => setOpen(o => !o)}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          {result.suggestedInterpretation && (
            <div className="flex gap-2 p-2.5 mb-3 bg-blue-50 border-l-4 border-blue-600 text-xs">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span><strong className="text-blue-700">{t("label.interpretation.suggestion","Suggestion")}: </strong>
                <span className="text-gray-700">{result.suggestedInterpretation.label} — {result.suggestedInterpretation.text}</span>
              </span>
            </div>
          )}

          {result.interpretationOptions.length === 0 ? (
            <p className="text-xs text-gray-400 mb-2">{t("message.interpretation.noTemplates","No interpretation templates configured for this test.")}</p>
          ) : (
            <div className="flex gap-3 mb-3 flex-wrap">
              <div className="flex flex-col gap-1.5 flex-shrink-0 max-w-xs">
                {result.interpretationOptions.map(opt => {
                  const c = COLOR_CONFIG[opt.color] || COLOR_CONFIG.gray;
                  const isSel = selected === opt.code;
                  return (
                    <div key={opt.code} role="button" tabIndex={0}
                      onClick={() => { setSelected(opt.code); setText(opt.text); }}
                      onKeyDown={e => e.key === "Enter" && (setSelected(opt.code), setText(opt.text))}
                      className={`flex items-start gap-2 px-2.5 py-2 border cursor-pointer text-xs transition-colors ${
                        isSel ? `border-2 ${c.border} ${c.bg}` : "border-gray-200 hover:border-blue-300 bg-white"
                      }`}>
                      <div className={`w-3 h-3 rounded-full border-2 mt-0.5 flex-shrink-0 ${isSel ? "border-blue-600 bg-blue-600" : "border-gray-400"}`} />
                      <div>
                        <div className="font-semibold text-gray-800">{opt.label}</div>
                        <div className={`text-xs px-1.5 rounded-full inline-block mt-0.5 ${c.bg} ${c.text}`}>{opt.range}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 min-w-64 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">{t("label.interpretation.text","Interpretation text")}</span>
                  {text && <button onClick={() => { setText(""); setSelected(null); }} className="text-xs text-gray-400 hover:text-gray-700">{t("button.clear","Clear")}</button>}
                </div>
                <textarea
                  className="flex-1 min-h-20 border border-gray-300 text-xs p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  value={text} onChange={e => setText(e.target.value)}
                  placeholder={t("placeholder.interpretation","Select a template or type a code (e.g. HGB-NL) and press space to expand…")}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Method & Reagents — always-visible inline section (was a tab)
// ---------------------------------------------------------------------------
function MethodSection({ result, requireReagentLots = false, onReagentSelectedChange = null }) {
  const [open, setOpen] = useState(true);
  const [methodId, setMethodId] = useState(result.method?.id || "MAN");
  const [analyzerId, setAnalyzerId] = useState(result.analyzer || "");
  const [methodDetails, setMethodDetails] = useState("");
  const [selectedLotId, setSelectedLotId] = useState(null);
  const isAuto = methodId === "AUTO" || methodId === "SEMIAUTO";

  const handleLotSelect = (lotId) => {
    setSelectedLotId(lotId);
    if (onReagentSelectedChange) onReagentSelectedChange(true);
  };

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><FlaskConical className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.method","Method & Reagents")}</>}
        open={open}
        onToggle={() => setOpen(o => !o)}
      />
      {open && (
        <div className="px-4 py-3 bg-white space-y-3">
          <div className="grid grid-cols-12 gap-3">
            {/* Method dropdown — per-row method override populated from /rest/displayList/METHODS */}
            <div className="col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t("label.method.select","Method")}</label>
              <select
                value={methodId}
                onChange={e => setMethodId(e.target.value)}
                className="w-full border border-gray-300 text-sm bg-gray-50 py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-600">
                {METHODS_LOOKUP.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>

            {/* Analyzer dropdown — shown only when method is automated/semi-auto */}
            {isAuto && (
              <div className="col-span-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t("label.analyzer.select","Analyzer")}</label>
                <select
                  value={analyzerId}
                  onChange={e => setAnalyzerId(e.target.value)}
                  className="w-full border border-gray-300 text-sm bg-gray-50 py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-600">
                  <option value="">{t("placeholder.analyzer.select","Select analyzer…")}</option>
                  {ANALYZERS_LOOKUP.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.label} {a.status === "online" ? "(Online ✓)" : "(Offline)"} {a.qc === "fail" ? "[QC FAIL]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Method details / macro field */}
            <div className={isAuto ? "col-span-5" : "col-span-9"}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                {t("label.method.details","Method Details")} <span className="text-gray-400 font-normal lowercase">({t("label.optional","optional")})</span>
              </label>
              <input type="text" value={methodDetails} onChange={e => setMethodDetails(e.target.value)}
                placeholder={t("placeholder.method.details","Type MAN-DIFF, MAN-HEM, QNS, CLOT, HEMOLYZED then space to expand…")}
                className="w-full border border-gray-300 text-sm py-1.5 px-2 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600" />
              <div className="text-xs text-gray-400 mt-1">{t("help.method.macros","Macros: MAN-DIFF · MAN-HEM · MAN-MICRO · QNS · CLOT · HEMOLYZED · LIPEMIC")}</div>
            </div>
          </div>

          {/* Reagent lots — FIFO suggestion. BR-034: lot required for Save when site config is ON. */}
          <div className="bg-white border border-gray-200">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500 flex justify-between items-center">
              <span>{t("heading.reagent.lots","Reagent Lots (FIFO suggested)")}</span>
              {requireReagentLots && !selectedLotId && (
                <Tag kind="red">Required for Save (ISO 15189 §6.4.4)</Tag>
              )}
              {requireReagentLots && selectedLotId && (
                <Tag kind="green">✓ Lot selected</Tag>
              )}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-8"></th>
                  {["Reagent", "Lot Number", "Expires", "Remaining", "FIFO"].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600">{t(`column.reagent.${h.toLowerCase().replace(/ /g,"")}`, h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b border-gray-100 ${selectedLotId === "LOT-2024-0892" ? "bg-blue-50" : "bg-amber-50"}`}>
                  <td className="px-2 py-2"><input type="radio" name={`lot-${result.id}`}
                    checked={selectedLotId === "LOT-2024-0892"} onChange={() => handleLotSelect("LOT-2024-0892")} /></td>
                  <td className="px-3 py-2">Cellpack DCL</td>
                  <td className="px-3 py-2 font-mono">LOT-2024-0892</td>
                  <td className="px-3 py-2 text-yellow-700 font-medium">12/20/2024 ⚠</td>
                  <td className="px-3 py-2">15%</td>
                  <td className="px-3 py-2"><Tag kind="blue">{t("label.reagent.useFirst","Use First")}</Tag></td>
                </tr>
                <tr className={selectedLotId === "LOT-2024-1234" ? "bg-blue-50" : ""}>
                  <td className="px-2 py-2"><input type="radio" name={`lot-${result.id}`}
                    checked={selectedLotId === "LOT-2024-1234"} onChange={() => handleLotSelect("LOT-2024-1234")} /></td>
                  <td className="px-3 py-2">Cellpack DCL</td>
                  <td className="px-3 py-2 font-mono">LOT-2024-1234</td>
                  <td className="px-3 py-2">01/15/2025</td>
                  <td className="px-3 py-2">85%</td>
                  <td className="px-3 py-2 text-gray-400">{t("label.reagent.next","Next")}</td>
                </tr>
              </tbody>
            </table>
            {requireReagentLots && !selectedLotId && (
              <div className="px-3 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                {t("warn.reagent.required","A reagent lot is required by site configuration (ISO 15189 §6.4.4 traceability). Select a lot to enable Save.")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Info — always-visible inline section (was a tab)
// ---------------------------------------------------------------------------
function OrderInfoSection({ orderInfo }) {
  const [open, setOpen] = useState(true);
  if (!orderInfo || Object.keys(orderInfo).length === 0) {
    return (
      <div className="border-b border-gray-200">
        <SectionHeader
          label={<><ClipboardList className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.orderInfo","Order Info")}</>}
          open={open} onToggle={() => setOpen(o => !o)} />
        {open && <div className="px-4 py-3 bg-white text-xs text-gray-400">{t("message.orderInfo.empty","No order information available.")}</div>}
      </div>
    );
  }
  const fields = [
    { label: t("label.order.clinician","Ordering Clinician"), value: orderInfo.clinician },
    { label: t("label.order.phone","Phone"), value: orderInfo.clinicianPhone },
    { label: t("label.order.department","Department"), value: orderInfo.department },
    { label: t("label.order.priority","Priority"), value: orderInfo.priority },
    { label: t("label.order.collection","Collection Date/Time"), value: orderInfo.collectionDate },
    { label: t("label.order.received","Received Date/Time"), value: orderInfo.receivedDate },
    { label: t("label.order.fasting","Fasting Status"), value: orderInfo.fastingStatus },
    { label: t("label.order.history","Clinical History"), value: orderInfo.clinicalHistory },
    { label: t("label.order.diagnosis","Diagnosis"), value: orderInfo.diagnosis },
  ].filter(f => f.value);

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><ClipboardList className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.orderInfo","Order Info")}</>}
        open={open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="px-4 py-3 bg-white">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            {fields.map(f => (
              <div key={f.label} className={f.label.includes("History") || f.label.includes("Diagnosis") ? "col-span-3 sm:col-span-1" : ""}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{f.label}</div>
                <div className="text-sm text-gray-800">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Program Info — always-visible inline section (NEW for v3)
// Renders fields captured at Order Entry by the linked program (EQA round,
// RETROCI ARV/EID/VL study, custom programs). Up to 15 fields. Read-only here
// — fields are edited in Order Entry. Hidden entirely when no program is linked.
// ---------------------------------------------------------------------------
function ProgramInfoSection({ program }) {
  const [open, setOpen] = useState(true);
  if (!program || !program.fields || program.fields.length === 0) return null;

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><BookOpen className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.programInfo","Program Info")}</>}
        open={open}
        onToggle={() => setOpen(o => !o)}
        badge={<span className="text-xs text-purple-700 font-medium">{program.name}</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            {program.fields.map(f => (
              <div key={f.label} className={f.type === "longtext" ? "col-span-3" : ""}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{f.label}</div>
                <div className="text-sm text-gray-800">{f.value || <span className="text-gray-300">—</span>}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-400 italic">
            {t("help.programInfo.readonly","Program-captured fields are read-only here. Edit them on the originating order.")}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modification History Banner — NEW for v3.1 (ISO HIGH A3 / CFR Part 11 §11.10(e))
// Renders when result.modificationHistory[] has entries. Surfaces the original
// value alongside the current value so validators don't have to dig through
// audit_trail to verify a result hasn't been silently altered.
// ---------------------------------------------------------------------------
function ModificationHistoryBanner({ history }) {
  const [expandAll, setExpandAll] = useState(false);
  if (!history || history.length === 0) return null;
  const mostRecent = history[history.length - 1];
  const original = history[0].fromValue;
  const current  = mostRecent.toValue;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
      <div className="flex items-start gap-3">
        <Pencil className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-amber-900">{t("heading.modification.history","Modification History")}</span>
            <span className="text-amber-700">
              <span className="font-semibold">{t("label.modification.original","Original")}:</span> <span className="font-mono">{original}</span>
              <span className="mx-1.5">→</span>
              <span className="font-semibold">{t("label.modification.current","Current")}:</span> <span className="font-mono">{current}</span>
            </span>
            <span className="text-amber-600">·</span>
            <span className="text-amber-800">{mostRecent.modifiedBy}</span>
            <span className="text-amber-600">·</span>
            <span className="text-amber-700">{mostRecent.modifiedAt}</span>
          </div>
          <div className="text-amber-700 mt-1">
            <span className="font-semibold">{t("label.modification.reason","Reason")}:</span> {mostRecent.reason}
          </div>
          {history.length > 1 && (
            <>
              <button onClick={() => setExpandAll(e => !e)}
                className="mt-1 text-xs text-amber-700 hover:underline">
                {expandAll ? "Hide history" : t("button.modification.viewAll","View all history ({count})").replace("{count}", history.length)}
              </button>
              {expandAll && (
                <ol className="mt-1.5 ml-4 space-y-1 list-decimal text-amber-700">
                  {history.map(h => (
                    <li key={h.id} className="text-xs">
                      <span className="font-mono">{h.fromValue} → {h.toValue}</span> · {h.modifiedBy} · {h.modifiedAt} — <em>{h.reason}</em>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aliquots Section — NEW for v3.1 (ISO HIGH I1 / BR-037)
// Surfaces sample splits (LABNO.X-Y) inline so techs can create retention,
// send-out, or test aliquots without leaving Results Entry.
// ---------------------------------------------------------------------------
const ALIQUOT_PURPOSES = ["Test", "Retention", "Send-out", "Pool", "Pour-off"];
const ALIQUOT_STATUS_KIND = {
  "Created": "blue", "In-Storage": "teal", "Sent": "magenta",
  "Used": "gray", "Destroyed": "red",
};

function AliquotsSection({ result, userHasAnalystPerm = true, userHasReceptionPerm = true }) {
  const [open, setOpen] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [aliquots, setAliquots] = useState(result.aliquots || []);
  const [count, setCount] = useState(1);
  const [purpose, setPurpose] = useState("Test");
  const [linkedTest, setLinkedTest] = useState("");
  const [destStorage, setDestStorage] = useState("");
  const [reason, setReason] = useState("");

  const canCreate = userHasAnalystPerm || userHasReceptionPerm;
  const canDestroy = userHasAnalystPerm;

  const handleCreate = () => {
    const baseSuffix = aliquots.length + 1;
    const newOnes = Array.from({ length: Number(count) || 1 }, (_, i) => ({
      id: `${result.labNumber}-${result.sequenceNumber}.${baseSuffix + i}`,
      purpose,
      linkedTest: purpose === "Test" ? linkedTest : null,
      status: destStorage ? "In-Storage" : "Created",
      createdAt: new Date().toLocaleString(),
      createdBy: "Current User",
      storage: destStorage || "—",
      reason: reason || null,
    }));
    setAliquots(prev => [...prev, ...newOnes]);
    setShowCreate(false);
    setCount(1); setPurpose("Test"); setLinkedTest(""); setDestStorage(""); setReason("");
  };

  const isPool = result.sample?.isPool || result.poolMembers;

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><Microscope className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.aliquots","Aliquots")}</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={aliquots.length ? `(${aliquots.length})` : null}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          {/* Pool composition (vector deployments) — read-only header above table */}
          {isPool && (
            <div className="mb-3 p-2 bg-purple-50 border-l-4 border-purple-400 text-xs">
              <div className="font-semibold text-purple-800 mb-1">{t("message.aliquot.poolHeading","Pool composition")}:</div>
              <div className="font-mono text-purple-700">
                {(result.poolMembers || []).join(", ") || "—"}
              </div>
            </div>
          )}

          {aliquots.length === 0 ? (
            <p className="text-xs text-gray-400">{t("message.aliquot.empty","No aliquots from this sample yet.")}</p>
          ) : (
            <div className="border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[
                      { key: "column.aliquot.id", label: "Aliquot ID" },
                      { key: "column.aliquot.purpose", label: "Purpose" },
                      { key: "column.aliquot.linkedTest", label: "Linked Test" },
                      { key: "column.aliquot.status", label: "Status" },
                      { key: "column.aliquot.created", label: "Created" },
                      { key: "column.aliquot.storage", label: "Storage" },
                      { key: "column.actions", label: "Actions" },
                    ].map(h => (
                      <th key={h.key} className="text-left px-2 py-2 font-semibold text-gray-600">{t(h.key, h.label)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aliquots.map(a => (
                    <tr key={a.id} className="border-b border-gray-100">
                      <td className="px-2 py-2 font-mono text-gray-800">{a.id}</td>
                      <td className="px-2 py-2"><Tag kind="blue">{a.purpose}</Tag></td>
                      <td className="px-2 py-2 text-gray-600">{a.linkedTest || "—"}</td>
                      <td className="px-2 py-2"><Tag kind={ALIQUOT_STATUS_KIND[a.status] || "gray"}>{a.status}</Tag></td>
                      <td className="px-2 py-2 text-gray-500"><div>{a.createdAt}</div><div className="text-gray-400">{a.createdBy}</div></td>
                      <td className="px-2 py-2 text-gray-600 font-mono text-xxs">{a.storage}</td>
                      <td className="px-2 py-2">
                        <button title={t("button.aliquot.printLabel","Print Label")} className="p-1 hover:bg-gray-100"><FileText className="w-3 h-3 text-gray-500" /></button>
                        {canDestroy && a.status !== "Destroyed" && (
                          <>
                            <button title={t("button.aliquot.markUsed","Mark Used")} className="p-1 hover:bg-gray-100"><Check className="w-3 h-3 text-gray-500" /></button>
                            <button title={t("button.aliquot.destroy","Destroy")} className="p-1 hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-500" /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showCreate ? (
            <div className="mt-3 border border-blue-200 bg-blue-50 p-3 space-y-2">
              <div className="text-sm font-semibold text-blue-800">{t("button.aliquot.create","Create aliquot")}</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block text-gray-600 mb-0.5">{t("label.aliquot.count","How many aliquots?")}</label>
                  <input type="number" min={1} max={20} value={count} onChange={e => setCount(e.target.value)}
                    className="w-full border border-gray-300 py-1 px-2" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-0.5">{t("label.aliquot.purpose","Purpose")}</label>
                  <select value={purpose} onChange={e => setPurpose(e.target.value)}
                    className="w-full border border-gray-300 py-1 px-2 bg-white">
                    {ALIQUOT_PURPOSES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                {purpose === "Test" && (
                  <div>
                    <label className="block text-gray-600 mb-0.5">{t("label.aliquot.linkedTest","Test to perform")}</label>
                    <input type="text" value={linkedTest} onChange={e => setLinkedTest(e.target.value)}
                      placeholder="HbA1c, Lipid panel…"
                      className="w-full border border-gray-300 py-1 px-2" />
                  </div>
                )}
                <div>
                  <label className="block text-gray-600 mb-0.5">{t("label.aliquot.destination","Destination storage")}</label>
                  <input type="text" value={destStorage} onChange={e => setDestStorage(e.target.value)}
                    placeholder="Optional — opens LocationPicker"
                    className="w-full border border-gray-300 py-1 px-2" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 mb-0.5 text-xs">{t("label.aliquot.reason","Reason / Notes")}</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full border border-gray-300 py-1 px-2 text-xs" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate}
                  className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium hover:bg-blue-800">
                  {t("button.aliquot.confirmCreate","Create")}
                </button>
                <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">{t("button.cancel","Cancel")}</button>
              </div>
              <div className="text-xs text-blue-700">
                {t("help.aliquot.suffix","New aliquots get suffix LABNO.X-N (next available number).")}
              </div>
            </div>
          ) : (
            canCreate && (
              <button onClick={() => setShowCreate(true)}
                className="mt-2 flex items-center gap-1 text-xs text-blue-700 hover:underline">
                <Plus className="w-3 h-3" /> {t("button.aliquot.create","Create aliquot")}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Critical Value Notification Form — NEW for v3.1 (ISO HIGH A1 / CLSI GP47)
// Structured replacement for the v3.0 single-click "I Acknowledge" button.
// Captures CLSI GP47-compliant notification record: recipient, role, method,
// read-back text, time, escalation log. Required to unblock Save.
// ---------------------------------------------------------------------------
function CriticalNotificationForm({ result, criticalMsg, onConfirm, onCancel, defaultClinician }) {
  const [recipient, setRecipient]     = useState(defaultClinician || "");
  const [recipientRole, setRole]      = useState("clinician");
  const [method, setMethod]           = useState("phone");
  const [readBack, setReadBack]       = useState("");
  const [time, setTime]               = useState(new Date().toLocaleString());
  const [firstOk, setFirstOk]         = useState(true);
  const [escalations, setEscalations] = useState([]);
  const [notes, setNotes]             = useState("");

  const canSubmit = recipient.trim() && readBack.trim() && time && (firstOk || escalations.length > 0);

  const addEscalation = () => {
    setEscalations(prev => [...prev, { id: Date.now(), attempt: prev.length + 2, method: "phone", recipient: "", time: new Date().toLocaleString(), outcome: "no-answer" }]);
  };

  const removeEscalation = (id) => setEscalations(prev => prev.filter(e => e.id !== id));
  const updateEscalation = (id, key, val) => setEscalations(prev => prev.map(e => e.id === id ? { ...e, [key]: val } : e));

  return (
    <div className="border border-orange-300 bg-orange-50 mx-4 mb-3 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-900">
          <AlertTriangle className="w-4 h-4" />
          {t("heading.criticalNotification","Critical Value — Notification Form")}
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
      </div>

      <p className="text-xs text-orange-800">
        <strong>{criticalMsg}.</strong> {t("help.criticalNotification.intro","Per CLSI GP47 and ISO 15189 §7.5.1.4, the responsible clinician must be notified and the notification documented with verbatim read-back before this result can be saved.")}
      </p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <label className="block text-gray-700 mb-0.5">{t("label.criticalNotification.recipient","Recipient")} <span className="text-red-500">*</span></label>
          <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
            placeholder="Dr. Williams"
            className="w-full border border-gray-300 py-1.5 px-2 bg-white" />
        </div>
        <div>
          <label className="block text-gray-700 mb-0.5">{t("label.criticalNotification.recipientRole","Role")} <span className="text-red-500">*</span></label>
          <select value={recipientRole} onChange={e => setRole(e.target.value)}
            className="w-full border border-gray-300 py-1.5 px-2 bg-white">
            <option value="clinician">{t("criticalNotification.role.clinician","Clinician")}</option>
            <option value="nurse">{t("criticalNotification.role.nurse","Nurse")}</option>
            <option value="oncall">{t("criticalNotification.role.oncall","On-call clinician")}</option>
            <option value="patient">{t("criticalNotification.role.patient","Patient (direct)")}</option>
            <option value="other">{t("criticalNotification.role.other","Other")}</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-0.5">{t("label.criticalNotification.method","Method of communication")} <span className="text-red-500">*</span></label>
          <select value={method} onChange={e => setMethod(e.target.value)}
            className="w-full border border-gray-300 py-1.5 px-2 bg-white">
            <option value="phone">{t("criticalNotification.method.phone","Phone")}</option>
            <option value="inperson">{t("criticalNotification.method.inperson","In-person")}</option>
            <option value="secureMsg">{t("criticalNotification.method.secureMsg","Secure message")}</option>
            <option value="pager">{t("criticalNotification.method.pager","Pager")}</option>
            <option value="other">{t("criticalNotification.method.other","Other")}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-700 mb-0.5">{t("label.criticalNotification.readBack","Read-back text")} <span className="text-red-500">*</span></label>
        <textarea rows={2} value={readBack} onChange={e => setReadBack(e.target.value)}
          placeholder={t("placeholder.criticalNotification.readBack","Verbatim what the recipient read back to confirm the value…")}
          className="w-full border border-gray-300 py-1.5 px-2 text-xs bg-white resize-none" />
        <div className="text-xs text-gray-500 mt-0.5">{t("help.criticalNotification.readBack","Example: \"Glucose 142 mg/dL on patient Smith DOB 5/22/1985 — confirmed critical hyperglycemia, will follow up.\"")}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-700 mb-0.5">{t("label.criticalNotification.time","Time of notification")} <span className="text-red-500">*</span></label>
          <input type="text" value={time} onChange={e => setTime(e.target.value)}
            className="w-full border border-gray-300 py-1.5 px-2 text-xs bg-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-700 mb-0.5">{t("label.criticalNotification.firstSuccessful","First attempt successful?")}</label>
          <div className="flex gap-3 mt-1.5 text-xs">
            <label className="flex items-center gap-1"><input type="radio" checked={firstOk} onChange={() => setFirstOk(true)} /> Yes</label>
            <label className="flex items-center gap-1"><input type="radio" checked={!firstOk} onChange={() => setFirstOk(false)} /> No</label>
          </div>
        </div>
      </div>

      {!firstOk && (
        <div className="border border-orange-200 bg-white p-2 space-y-2">
          <div className="text-xs font-semibold text-orange-900">{t("label.criticalNotification.escalationLog","Escalation log")}</div>
          {escalations.length === 0 && (
            <div className="text-xs text-gray-500">{t("help.escalation.empty","Add at least one escalation attempt.")}</div>
          )}
          {escalations.map(e => (
            <div key={e.id} className="grid grid-cols-5 gap-1.5 text-xs items-end">
              <div>
                <label className="block text-gray-600">Attempt</label>
                <input type="number" value={e.attempt} onChange={ev => updateEscalation(e.id, "attempt", ev.target.value)}
                  className="w-full border border-gray-300 py-1 px-2" />
              </div>
              <div>
                <label className="block text-gray-600">Method</label>
                <select value={e.method} onChange={ev => updateEscalation(e.id, "method", ev.target.value)}
                  className="w-full border border-gray-300 py-1 px-2 bg-white">
                  <option value="phone">Phone</option>
                  <option value="pager">Pager</option>
                  <option value="inperson">In-person</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600">Recipient</label>
                <input type="text" value={e.recipient} onChange={ev => updateEscalation(e.id, "recipient", ev.target.value)}
                  className="w-full border border-gray-300 py-1 px-2" />
              </div>
              <div>
                <label className="block text-gray-600">Outcome</label>
                <select value={e.outcome} onChange={ev => updateEscalation(e.id, "outcome", ev.target.value)}
                  className="w-full border border-gray-300 py-1 px-2 bg-white">
                  <option value="no-answer">No answer</option>
                  <option value="voicemail">Left voicemail</option>
                  <option value="busy">Busy</option>
                  <option value="wrong-number">Wrong number</option>
                  <option value="escalated">Escalated to supervisor</option>
                  <option value="reached">Reached</option>
                </select>
              </div>
              <button onClick={() => removeEscalation(e.id)} className="px-1.5 py-1.5 hover:bg-red-50 text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button onClick={addEscalation} className="text-xs text-blue-700 hover:underline">
            <Plus className="w-3 h-3 inline" /> Add attempt
          </button>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-700 mb-0.5">{t("label.criticalNotification.additionalNotes","Additional notes")} <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          className="w-full border border-gray-300 py-1.5 px-2 text-xs" />
      </div>

      <div className="flex gap-2 pt-1 items-center">
        <button onClick={() => canSubmit && onConfirm({ recipient, recipientRole, method, readBack, time, firstOk, escalations, notes })}
          disabled={!canSubmit}
          className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
            canSubmit ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}>
          <Check className="w-3.5 h-3.5" />
          {t("button.criticalNotification.submit","Confirm Notification")}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">{t("button.cancel","Cancel")}</button>
        {!canSubmit && (
          <span className="text-xs text-gray-500 italic">
            {!recipient.trim() ? "Recipient required" : !readBack.trim() ? "Read-back required" : (!firstOk && escalations.length === 0) ? "Escalation entry required" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storage Location — always-visible inline section (NEW)
// ---------------------------------------------------------------------------
function StorageSection({ result }) {
  const [open, setOpen] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [storage, setStorage] = useState(result.storage);
  const [moveReason, setMoveReason] = useState("");
  const hasLocation = !!storage.path;

  const handleAssignOrMove = () => {
    // Stub: real implementation opens LocationPickerModal with full freezer hierarchy
    const demo = { path: "Freezer C → Rack 5 → Shelf 2 → Box 11", coords: "Pos D-08", condition: "−80 °C" };
    setStorage(demo);
    setShowPicker(false);
    setMoveReason("");
  };

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><MapPin className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.storage","Storage Location")}</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={hasLocation ? null : t("label.storage.unassigned","Unassigned")}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          {hasLocation ? (
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-64">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{t("label.storage.path","Location")}</div>
                <div className="text-sm font-mono text-gray-800">{storage.path}</div>
              </div>
              {storage.coords && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{t("label.storage.position","Position")}</div>
                  <div className="text-sm font-mono text-gray-800">{storage.coords}</div>
                </div>
              )}
              {storage.condition && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{t("label.storage.condition","Condition")}</div>
                  <div className="text-sm text-gray-800">{storage.condition}</div>
                </div>
              )}
              <button onClick={() => setShowPicker(true)}
                className="px-3 py-1.5 border border-blue-600 text-blue-700 text-xs font-medium hover:bg-blue-50">
                {t("button.storage.move","Move storage location")}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                <strong className="text-gray-700">{t("label.storage.unassigned","Unassigned")}</strong> — {t("help.storage.unassigned","This sample item has no storage record. Assign a location to enable freezer tracking.")}
              </div>
              <button onClick={() => setShowPicker(true)}
                className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 whitespace-nowrap">
                {t("button.storage.assign","Assign storage location")}
              </button>
            </div>
          )}

          {/* LocationPicker stub */}
          {showPicker && (
            <div className="mt-3 border border-blue-200 bg-blue-50 p-3 space-y-3">
              <div className="text-sm font-semibold text-blue-800">{t("heading.storage.picker","Choose a location")}</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {["Freezer A", "Freezer B", "Freezer C", "Refrigerator A"].map(f => (
                  <button key={f} className="px-2 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-blue-100 hover:border-blue-400">{f}</button>
                ))}
              </div>
              <div className="text-xs text-blue-700">{t("help.storage.picker","Drill down through Freezer → Rack → Shelf → Box → Position. Real implementation uses hierarchical LocationPickerModal.")}</div>
              {hasLocation && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("label.storage.moveReason","Reason for move")} <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={moveReason} onChange={e => setMoveReason(e.target.value)}
                    placeholder={t("placeholder.storage.moveReason","Why is this sample being moved?")}
                    className="w-full border border-gray-300 text-sm py-1 px-2" />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleAssignOrMove}
                  disabled={hasLocation && !moveReason.trim()}
                  className={`px-3 py-1.5 text-xs font-medium ${
                    hasLocation && !moveReason.trim()
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-700 text-white hover:bg-blue-800"
                  }`}>
                  {hasLocation ? t("button.storage.confirmMove","Confirm move") : t("button.storage.confirmAssign","Confirm assign")}
                </button>
                <button onClick={() => setShowPicker(false)} className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">{t("button.cancel","Cancel")}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Referral — always-visible inline section (was a tab)
// ---------------------------------------------------------------------------
function ReferralSection({ result }) {
  const [open, setOpen] = useState(true);
  const [referred, setReferred] = useState(!!result.referral);
  const [reason, setReason] = useState("");
  const [institute, setInstitute] = useState("");
  const [testName, setTestName] = useState(result.testName);
  const [sentDate, setSentDate] = useState(new Date().toISOString().slice(0,10));

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><Send className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.referral","Referral")}</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={referred ? <Tag kind="amber">{t("label.referral.referred","Referred")}</Tag> : null}
      />
      {open && (
        <div className="px-4 py-3 bg-white space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={referred} onChange={e => setReferred(e.target.checked)} className="w-4 h-4" />
            {t("label.referral.refer","Refer this test to an external laboratory")}
          </label>

          {referred && (
            <div className="grid grid-cols-2 gap-3 border border-gray-200 p-3 bg-gray-50">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.referral.reason","Referral Reason")} <span className="text-red-500">*</span></label>
                <select value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full border border-gray-300 text-sm py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600">
                  <option value="">{t("placeholder.referral.reason","Select reason…")}</option>
                  {REFERRAL_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.referral.institute","Institute")} <span className="text-red-500">*</span></label>
                <select value={institute} onChange={e => setInstitute(e.target.value)}
                  className="w-full border border-gray-300 text-sm py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600">
                  <option value="">{t("placeholder.referral.institute","Select institution…")}</option>
                  {REFERRAL_INSTITUTES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.referral.test","Test to Perform")}</label>
                <input type="text" value={testName} onChange={e => setTestName(e.target.value)}
                  className="w-full border border-gray-300 text-sm py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.referral.sentDate","Sent Date")}</label>
                <input type="date" value={sentDate} onChange={e => setSentDate(e.target.value)}
                  className="w-full border border-gray-300 text-sm py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attachments — always-visible inline section (was a tab)
// ---------------------------------------------------------------------------
function AttachmentsSection({ result }) {
  const [open, setOpen] = useState(true);
  const attachments = result.attachments || [];
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><Paperclip className="w-4 h-4 inline mr-1.5 text-gray-500" />{t("heading.attachments","Attachments")}</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={attachments.length ? `(${attachments.length})` : null}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          {attachments.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded p-4 text-center text-xs text-gray-400">
              <Paperclip className="w-4 h-4 mx-auto mb-1" />
              {t("message.attachments.empty","No attachments.")} <button className="text-blue-700 underline">{t("button.attachments.upload","Upload file")}</button>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 text-sm">
                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-gray-800">{att.name}</div>
                    <div className="text-xs text-gray-400">{att.size} · {att.uploadedBy} · {att.uploadedAt}</div>
                  </div>
                  <Tag kind={att.source === "order" ? "purple" : "teal"}>
                    {att.source === "order" ? t("label.attachments.order","Order Entry") : t("label.attachments.result","Result Entry")}
                  </Tag>
                  <button className="p-1 hover:bg-gray-100 rounded" title={t("button.download","Download")}><Download className="w-3.5 h-3.5 text-gray-500" /></button>
                  {att.source !== "order" && (
                    <button className="p-1 hover:bg-red-50 rounded" title={t("button.delete","Delete")}><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  )}
                </div>
              ))}
              <button className="text-xs text-blue-700 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> {t("button.attachments.upload","Upload file")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QA/QC — TAB (kept tabbed: secondary surface, only relevant on failure)
// ---------------------------------------------------------------------------
function QAQCTab({ result }) {
  const qc = result.qcData;
  return (
    <div className="p-4 space-y-4">
      <div className={`flex items-center gap-3 p-3 border rounded ${
        qc.overall === "pass" ? "bg-green-50 border-green-200" :
        qc.overall === "fail" ? "bg-red-50 border-red-200" :
        qc.overall === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
      }`}>
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${QC_DOT[qc.overall] || QC_DOT.none}`} />
        <span className="text-sm font-semibold capitalize">{qc.overall === "none" ? t("label.qc.noData","No QC Data") : `QC ${qc.overall}`}</span>
        <span className="text-xs text-gray-500 ml-auto">{t("label.qc.analyzer","Analyzer")}: {qc.analyzerStatus} · {t("label.qc.lastCalibrated","Last calibrated")}: {qc.lastCalibrated}</span>
      </div>

      {qc.controls.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("heading.qc.controls","Control Results")}
          </div>
          {qc.controls.map((ctrl, i) => (
            <div key={i} className={`flex items-center gap-4 px-3 py-2 text-sm ${i < qc.controls.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className={`w-2 h-2 rounded-full ${ctrl.status === "pass" ? "bg-green-500" : ctrl.status === "warning" ? "bg-yellow-400" : "bg-red-500"}`} />
              <span className="font-medium w-20">{ctrl.level}</span>
              <span className="font-mono">{ctrl.value}</span>
              <span className="text-gray-400 text-xs">{t("label.qc.expected","Expected")}: {ctrl.expected}</span>
              <span className={`ml-auto text-xs font-semibold ${ctrl.status === "pass" ? "text-green-700" : "text-red-700"}`}>
                {ctrl.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {qc.overall === "none" && (
        <p className="text-sm text-gray-400">{t("message.qc.noData","No QC data available for this test and analyzer combination.")}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// History — TAB (kept tabbed: only relevant when investigating delta/trend)
// ---------------------------------------------------------------------------
function HistoryTab({ result }) {
  return (
    <div className="p-4 space-y-3">
      {result.deltaCheck && (
        <div className="flex gap-2 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-yellow-800">{t("label.delta.alert","Delta Check Alert")}: </span>
            <span className="text-gray-700">
              {t("message.delta.body","Changed")} <strong>{result.deltaCheck.change}</strong> {t("message.delta.from","from previous")}
              ({result.deltaCheck.previous} → {result.deltaCheck.current} {result.unit}).
              {t("label.delta.threshold","Threshold")}: {result.deltaCheck.threshold}
            </span>
          </div>
        </div>
      )}

      {result.previousResults.length === 0 ? (
        <p className="text-sm text-gray-400">{t("message.history.empty","No previous results on record for this patient and test.")}</p>
      ) : (
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("heading.history","Previous Results")} — {result.testName}
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-6 px-4 py-2 bg-blue-50 text-sm font-semibold">
              <span className="w-28 text-gray-400 font-normal text-xs">{t("label.history.today","Today")}</span>
              <span className="font-mono w-24">{result.result || "—"} {result.unit}</span>
              <Tag kind="blue">{t("label.history.current","Current")}</Tag>
            </div>
            {result.previousResults.map((prev, i) => (
              <div key={i} className="flex items-center gap-6 px-4 py-2 text-sm">
                <span className="w-28 text-gray-400 text-xs">{prev.date}</span>
                <span className="font-mono w-24">{prev.value} {prev.unit}</span>
                <span className={`text-xs font-medium ${
                  prev.delta?.startsWith("+") ? "text-green-700" :
                  prev.delta?.startsWith("-") ? "text-blue-700" : "text-gray-400"
                }`}>
                  {prev.delta || "—"}
                  {result.deltaCheck && i === 0 && <span className="ml-2"><Tag kind="red">⚠ Δ {t("label.history.exceeded","Exceeded")}</Tag></span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline NCE form — now with Result Disposition (Cancel/Reject/Retest/Refer)
// Reject column was removed and folded into this field per v3 design.
// ---------------------------------------------------------------------------
function ReportNceForm({ result, onSubmit, onCancel }) {
  const [category, setCategory] = useState("Pre-Analytical");
  const [subcategory, setSubcategory] = useState("Specimen Integrity");
  const [severity, setSeverity] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [suspectedCauses, setSuspectedCauses] = useState("");
  const [proposedAction, setProposedAction] = useState("");
  const [disposition, setDisposition] = useState("CANCEL");      // CANCEL | REJECT | RETEST | REFER
  const [rejectReason, setRejectReason] = useState("");

  const subcats = NCE_SUBCATEGORIES[category] || [];
  const canSubmit = severity && (disposition !== "REJECT" || rejectReason);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      nceNumber: genNceNumber(),
      category, subcategory, severity,
      title, description, immediateAction, suspectedCauses, proposedAction,
      disposition, rejectReason,
    });
  };

  return (
    <div className="border border-amber-300 bg-amber-50 mx-4 mb-3 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <AlertTriangle className="w-4 h-4" />
          {t("heading.nce.report","Report Non-Conformity Event")}
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
      </div>

      <p className="text-xs text-amber-700">
        {t("help.nce.intro","Filing an NCE creates a Non-Conformity record linked to this result. Use the Result Disposition field below to choose what happens to the result. You can complete investigation details in the NCE module.")}
      </p>

      <div className="bg-white border border-gray-200 px-3 py-2 text-xs text-gray-600">
        <span className="font-medium text-gray-700">{t("label.nce.autoLinked","Auto-linked")}: </span>
        {result.testName} · {result.labNumber} · Result: {result.result || t("label.notEntered","not entered")}
      </div>

      {/* Severity, Category, Subcategory */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.nce.category","Category")} <span className="text-red-500">*</span></label>
          <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(""); }}
            className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500">
            {Object.keys(NCE_SUBCATEGORIES).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.nce.subcategory","Subcategory")} <span className="text-red-500">*</span></label>
          <select value={subcategory} onChange={e => setSubcategory(e.target.value)}
            className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500">
            {subcats.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.nce.severity","Severity")} <span className="text-red-500">*</span></label>
          <div className="space-y-1">
            {[
              { id: "critical", label: t("label.nce.severity.critical","Critical"), help: t("help.nce.severity.critical","Patient safety risk") },
              { id: "major",    label: t("label.nce.severity.major","Major"),       help: t("help.nce.severity.major","Significant quality impact") },
              { id: "minor",    label: t("label.nce.severity.minor","Minor"),       help: t("help.nce.severity.minor","Limited impact") },
            ].map(s => (
              <label key={s.id} className="flex items-start gap-1.5 text-xs cursor-pointer">
                <input type="radio" name={`severity-${result.id}`} value={s.id}
                  checked={severity === s.id} onChange={() => setSeverity(s.id)} className="mt-0.5" />
                <span><strong>{s.label}</strong> <span className="text-gray-400">— {s.help}</span></span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Title + Description */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.nce.title","Title")}</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder={t("placeholder.nce.title","Short summary of what happened")}
            className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.nce.description","Description")}</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder={t("placeholder.nce.description","Describe what happened, when, and how it was discovered")}
            className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white resize-none" />
        </div>
      </div>

      {/* Immediate action / Suspected causes / Proposed action */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.nce.immediateAction","Immediate Action")}</label>
          <textarea value={immediateAction} onChange={e => setImmediateAction(e.target.value)} rows={2}
            placeholder={t("placeholder.nce.immediateAction","What was done right away to contain the issue?")}
            className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.nce.suspectedCauses","Suspected Causes")}</label>
          <textarea value={suspectedCauses} onChange={e => setSuspectedCauses(e.target.value)} rows={2}
            placeholder={t("placeholder.nce.suspectedCauses","Likely root causes")}
            className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.nce.proposedAction","Proposed Action")}</label>
          <textarea value={proposedAction} onChange={e => setProposedAction(e.target.value)} rows={2}
            placeholder={t("placeholder.nce.proposedAction","Recommended corrective action")}
            className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white resize-none" />
        </div>
      </div>

      {/* Result Disposition — REPLACES the standalone Reject column */}
      <div className="border-t border-amber-200 pt-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
          {t("label.nce.disposition","Result Disposition")} <span className="text-red-500">*</span>
          <span className="font-normal text-gray-500 normal-case ml-1">— {t("help.nce.disposition","What happens to this result?")}</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "CANCEL", label: t("label.nce.disp.cancel","Cancel result"),
              help: t("help.nce.disp.cancel","Result is voided. No value reported. Most common for pre-analytical NCEs.") },
            { id: "REJECT", label: t("label.nce.disp.reject","Reject result + reason"),
              help: t("help.nce.disp.reject","Result is permanently deleted. Requires a rejection reason. Use sparingly.") },
            { id: "RETEST", label: t("label.nce.disp.retest","Retest — request new sample / repeat"),
              help: t("help.nce.disp.retest","Result stays pending. A retest order is created. Track via Workplan.") },
            { id: "REFER",  label: t("label.nce.disp.refer","Refer out to external lab"),
              help: t("help.nce.disp.refer","Result is referred. Opens the Referral section above with reason pre-filled.") },
          ].map(d => (
            <label key={d.id}
              className={`flex items-start gap-2 p-2 border cursor-pointer ${disposition === d.id ? "border-amber-500 bg-amber-100" : "border-gray-200 bg-white"}`}>
              <input type="radio" name={`disposition-${result.id}`} value={d.id}
                checked={disposition === d.id} onChange={() => setDisposition(d.id)} className="mt-0.5" />
              <span className="text-xs">
                <span className="font-semibold text-gray-800 block">{d.label}</span>
                <span className="text-gray-500">{d.help}</span>
              </span>
            </label>
          ))}
        </div>

        {/* Rejection reason — conditionally shown when disposition === REJECT */}
        {disposition === "REJECT" && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("label.nce.rejectReason","Rejection reason")} <span className="text-red-500">*</span></label>
            <select value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500">
              <option value="">{t("placeholder.nce.rejectReason","Select a rejection reason…")}</option>
              {REJECTION_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
            <div className="text-xs text-red-700 mt-1">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {t("warn.nce.reject","Rejecting permanently deletes test results. This action cannot be undone.")}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSubmit} disabled={!canSubmit}
          className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
            canSubmit ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}>
          <AlertCircle className="w-3.5 h-3.5" />
          {t("button.nce.submit","Submit NCE & Apply Disposition")}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">
          {t("button.cancel","Cancel")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Program banner (conditional)
// ---------------------------------------------------------------------------
function ProgramBanner({ program }) {
  if (!program) return null;
  const cfg = EQA_PRIORITY[program.priority] || EQA_PRIORITY.STANDARD;
  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b text-xs ${
      program.priority === "CRITICAL" ? "bg-red-50 border-red-200" :
      program.priority === "URGENT"   ? "bg-amber-50 border-amber-200" :
                                        "bg-purple-50 border-purple-200"
    }`}>
      <div className="flex items-center gap-2">
        <Shield className={`w-3.5 h-3.5 ${
          program.priority === "CRITICAL" ? "text-red-600" :
          program.priority === "URGENT"   ? "text-amber-600" :
                                            "text-purple-600"
        }`} />
        <Tag kind={cfg.kind}>{cfg.label}</Tag>
        <span className="text-gray-700 font-semibold">{program.name}</span>
        {program.dueDate && <span className="text-gray-500">{t("label.program.due","Due")}: {program.dueDate}</span>}
      </div>
      <button className="flex items-center gap-1 text-gray-600 hover:underline">
        {t("button.program.details","View Program Details")} <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Polymorphic Result cell — renders different inputs by resultType
// N = numeric (live range tier styling)
// D = dictionary single-select
// M = dictionary multi-checkbox (CSV value)
// C = cascading multi-select — out of scope for v1 mockup, see spec
// ---------------------------------------------------------------------------
function ResultCell({ result, isCancelled, onChange }) {
  const rs = evaluateResult(result.result, result.rangeBounds);

  if (isCancelled) {
    return (
      <td className="px-3 py-3">
        <span className="text-xs text-gray-400 line-through">{result.result || "—"}</span>
      </td>
    );
  }

  // N — numeric
  if (result.resultType === "N") {
    return (
      <td className={`px-3 py-3 ${RANGE_CELL_BG[rs] || ""}`}>
        <input type="text" value={result.result} placeholder="—"
          onChange={e => onChange(e.target.value)}
          className={`w-20 border-b-2 focus:outline-none text-xs font-mono py-0.5 bg-transparent ${RANGE_INPUT_BORDER[rs] || "border-gray-300"} ${RANGE_CELL_TEXT[rs] || "text-gray-700"}`}
        />
      </td>
    );
  }

  // D — dictionary single-select
  if (result.resultType === "D") {
    return (
      <td className="px-3 py-3">
        <select value={result.result} onChange={e => onChange(e.target.value)}
          className="w-full border-b-2 border-gray-400 bg-transparent text-xs py-0.5 focus:outline-none focus:border-blue-600">
          <option value="">{t("placeholder.result.select","Select…")}</option>
          {result.dictionaryOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </td>
    );
  }

  // M — dictionary multi-checkbox (CSV value)
  if (result.resultType === "M") {
    const selected = new Set((result.result || "").split(",").filter(Boolean));
    const toggle = (id) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id); else next.add(id);
      onChange([...next].join(","));
    };
    const displayLabels = result.dictionaryOptions
      .filter(o => selected.has(o.id))
      .map(o => o.label);
    return (
      <td className="px-3 py-3">
        <details className="text-xs">
          <summary className="cursor-pointer font-mono text-gray-700 hover:text-blue-700">
            {displayLabels.length ? displayLabels.join(", ") : <span className="text-gray-400">{t("placeholder.result.multiselect","Click to select…")}</span>}
          </summary>
          <div className="mt-1 p-2 bg-white border border-gray-200 space-y-1 max-w-72">
            {result.dictionaryOptions.map(opt => (
              <label key={opt.id} className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5">
                <input type="checkbox" checked={selected.has(opt.id)} onChange={() => toggle(opt.id)} />
                {opt.label}
              </label>
            ))}
          </div>
        </details>
      </td>
    );
  }

  // R / A — text/remark fallback
  return (
    <td className="px-3 py-3">
      <input type="text" value={result.result} onChange={e => onChange(e.target.value)}
        placeholder="—" className="w-full border-b-2 border-gray-400 bg-transparent text-xs py-0.5 focus:outline-none focus:border-blue-600" />
    </td>
  );
}

// Render the read-only "Current Result" shadow value with dictionary resolution for D/M
function renderCurrentResult(result) {
  if (!result.currentResult) return <span className="text-xs text-gray-300">—</span>;
  if (result.resultType === "D") {
    const opt = result.dictionaryOptions.find(o => o.id === result.currentResult);
    return <span className="text-xs text-gray-500">{opt?.label || result.currentResult}</span>;
  }
  if (result.resultType === "M") {
    const ids = (result.currentResult || "").split(",").filter(Boolean);
    const labels = ids.map(id => result.dictionaryOptions.find(o => o.id === id)?.label || id);
    return <span className="text-xs text-gray-500">{labels.join(", ") || "—"}</span>;
  }
  return <span className="text-xs text-gray-500 font-mono">{result.currentResult} {result.unit}</span>;
}

// ---------------------------------------------------------------------------
// Expanded Panel — composes all inline sections + tabs
// ---------------------------------------------------------------------------
const PANEL_TABS = [
  { key: "qaqc",    label: "QA/QC",   Icon: Shield },
  { key: "history", label: "History", Icon: History },
];

function ExpandedPanel({ result, onSave, onNceSubmit, requireReagentLots = true }) {
  const [activeTab, setActiveTab]           = useState("qaqc");
  const [resultValue, setResultValue]       = useState(result.result);
  const [showNceForm, setShowNceForm]       = useState(false);
  const [criticalAcknowledged, setCriticalAcknowledged] = useState(false);
  // BR-033: structured GP47 notification record
  const [showCriticalForm, setShowCriticalForm]         = useState(false);
  const [criticalNotificationRecord, setCriticalNotificationRecord] = useState(null);
  // BR-034: reagent lot gate
  const [reagentLotSelected, setReagentLotSelected]     = useState(false);

  const isModification   = result.status === "awaiting-validation" || result.status === "released";
  const isReleasedResult = result.status === "released";
  const [modifyConfirmed,    setModifyConfirmed]    = useState(!isReleasedResult);
  const [modificationNote,   setModificationNote]   = useState("");

  const resultState  = evaluateResult(resultValue, result.rangeBounds);
  const isCritical   = resultState === "critical";
  const isInvalid    = resultState === "invalid";
  const criticalMsg  = getCriticalMsg(resultValue, result.rangeBounds);
  const hasValue     = (resultValue || "").toString().trim() !== "";
  const isDirty      = resultValue !== result.result;
  const noteRequired = isModification && modifyConfirmed;
  // BR-034: reagent lot required by site config (ISO 15189 §6.4.4)
  const reagentGateOk = !requireReagentLots || reagentLotSelected;
  const canSave      = hasValue
    && (!isCritical || criticalAcknowledged)
    && (!isReleasedResult || modifyConfirmed)
    && (!noteRequired || modificationNote.trim() !== "")
    && reagentGateOk;

  const handleResultChange = (val) => {
    setResultValue(val);
    setCriticalAcknowledged(false);
  };

  const handleNceSubmit = (nceData) => {
    setShowNceForm(false);
    onNceSubmit(result.id, nceData);
  };

  return (
    <div className="border-t border-gray-200">
      <PatientBanner patient={result.patient} orderInfo={result.orderInfo} />
      <ProgramBanner program={result.program} />

      {/* Released-result modification warning */}
      {isReleasedResult && !modifyConfirmed && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-b-2 border-amber-500">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-900 text-sm">{t("heading.modify.released","Result Has Been Validated and Released")}</div>
            <div className="text-xs text-amber-800 mt-0.5">
              {t("message.modify.released","This result has already been accepted by a validator and may have been reported to the clinician. Modifying it will create an audit event and return it to the Validation queue for re-approval. A reason for the modification will be required.")}
            </div>
          </div>
          <button onClick={() => setModifyConfirmed(true)}
            className="px-3 py-2 bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 flex-shrink-0 whitespace-nowrap rounded-sm">
            {t("button.modify.confirm","I understand — proceed")}
          </button>
        </div>
      )}
      {isReleasedResult && modifyConfirmed && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          <Pencil className="w-3 h-3" />
          {t("message.modify.notice.released","Modifying a validated result — changes will require re-validation.")}
        </div>
      )}
      {result.status === "awaiting-validation" && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 border-b border-blue-200 text-xs text-blue-700">
          <Pencil className="w-3 h-3" />
          {t("message.modify.notice.queued","This result is queued for validation. Modifying it requires a reason note — changes will remain in the Validation queue.")}
        </div>
      )}

      {/* Always-visible sections — in priority order */}
      {/* Modification History banner — at top per BR-035; only renders when history exists */}
      <ModificationHistoryBanner history={result.modificationHistory} />

      <NotesSection result={result} />
      <InterpretationSection result={result} />
      <MethodSection
        result={result}
        requireReagentLots={requireReagentLots}
        onReagentSelectedChange={setReagentLotSelected}
      />
      <OrderInfoSection orderInfo={result.orderInfo} />
      <ProgramInfoSection program={result.program} />
      <StorageSection result={result} />
      <AliquotsSection result={result} />
      <ReferralSection result={result} />
      <AttachmentsSection result={result} />

      {/* Result entry action bar */}
      <div className="flex flex-wrap items-end gap-4 px-4 py-3 bg-white border-b border-gray-200">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t("label.result.value","Result Value")}</div>
          <div className="flex items-baseline gap-2">
            {result.resultType === "N" ? (
              <input type="text" value={resultValue} onChange={e => handleResultChange(e.target.value)} placeholder="—"
                className={`w-28 border-b-2 focus:outline-none text-sm font-mono py-1 ${RANGE_INPUT_BORDER[resultState] || "border-gray-400"} ${resultState === "invalid" ? "bg-red-50 text-red-900" : resultState === "critical" ? "bg-orange-50 text-orange-900" : resultState === "abnormal" ? "bg-yellow-50 text-yellow-900" : "bg-transparent"}`} />
            ) : (
              <span className="text-sm font-mono text-gray-700">{resultValue || "—"}</span>
            )}
            <span className="text-xs text-gray-500">{result.unit}</span>
            {resultState === "abnormal" && <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">{t("label.range.abnormal","Abnormal")}</span>}
            {resultState === "critical" && <span className="text-xs font-semibold text-orange-900 bg-orange-100 px-1.5 py-0.5 rounded">{t("label.range.critical","Critical")}</span>}
            {resultState === "invalid"  && <span className="text-xs font-semibold text-red-100 bg-red-800 px-1.5 py-0.5 rounded">{t("label.range.invalid","Invalid")}</span>}
          </div>
        </div>

        <div className="text-xs text-gray-500 flex items-center flex-wrap gap-2">
          <span>{t("label.range.ref","Ref")}: <span className="font-mono text-gray-800">{result.normalRange} {result.unit}</span></span>
          {/* BR-036: selected demographic-aware range label */}
          {result.selectedRangeLabel && (
            <Tag kind="purple" title={t("help.range.demographicSelection","Reference range selected based on patient demographics at sample collection date (CLSI EP28-A3c).")}>
              {t("label.referenceRange.label","Range")}: {result.selectedRangeLabel}
            </Tag>
          )}
          {result.rangeBounds?.critical && (
            <span className="text-orange-600">{t("label.range.critical","Critical")}: &lt;{result.rangeBounds.critical.low} or &gt;{result.rangeBounds.critical.high}</span>
          )}
        </div>

        <div className="flex gap-2 ml-auto flex-wrap items-center">
          {!showNceForm && (
            <button onClick={() => setShowNceForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-400 text-amber-700 text-xs font-medium hover:bg-amber-50">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t("button.nce.report","Report Non-Conformity")}
            </button>
          )}

          {/* Save Result — wrapped in ESignatureButton stub */}
          <button
            onClick={() => canSave && onSave(result.id, resultValue, modificationNote)}
            disabled={!canSave}
            title={
              !hasValue                                  ? t("title.save.missingValue","Enter a result value to save")
              : isReleasedResult && !modifyConfirmed     ? t("title.save.confirmRelease","Confirm the modification warning above before saving")
              : noteRequired && !modificationNote.trim() ? t("title.save.missingReason","A reason for modification is required")
              : isCritical && !criticalAcknowledged      ? t("title.save.ackCritical","Complete the Critical Notification Form before saving")
              : !reagentGateOk                            ? t("warn.reagent.required","A reagent lot is required by site configuration (ISO 15189 §6.4.4 traceability). Select a lot to enable Save.")
              : t("title.save.esig","Save will prompt for e-signature")
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              canSave ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}>
            {isModification && !isDirty ? <Pencil className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
            {isModification && !isDirty ? t("button.modify","Modify Result") : t("button.save.esig","Save (E-Sign)")}
          </button>
        </div>
      </div>

      {/* Modification note */}
      {noteRequired && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t("label.modify.reason","Reason for modification")} <span className="text-red-500">*</span>
            <span className="font-normal text-gray-400 ml-1">({t("help.modify.reason","required — will be added to the audit trail")})</span>
          </label>
          <textarea rows={2} value={modificationNote} onChange={e => setModificationNote(e.target.value)}
            placeholder={t("placeholder.modify.reason","Describe why this result is being modified…")}
            className="w-full border border-gray-300 text-xs p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none" />
        </div>
      )}

      {/* Invalid range warning */}
      {isInvalid && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-900 border-b border-red-700">
          <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-red-100 text-xs">
            <span className="font-semibold text-red-50">{t("heading.invalid","Result outside valid range")} — </span>
            {resultValue} {result.unit} is outside the physiologically valid range of {result.rangeBounds.valid.low}–{result.rangeBounds.valid.high} {result.unit}.
            {" "}{t("message.invalid","Verify the result and repeat analysis if necessary. Do not report until confirmed.")}
          </div>
        </div>
      )}

      {/* Critical value notification — CLSI GP47 structured form */}
      {isCritical && !criticalAcknowledged && !showCriticalForm && (
        <div className="flex items-start gap-3 px-4 py-3 bg-orange-50 border-b-2 border-orange-500">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-orange-900 text-sm">{t("heading.critical","Critical Value — Physician Notification Required")}</div>
            <div className="text-xs text-orange-800 mt-0.5">
              {criticalMsg}. {t("message.critical.structured","Per CLSI GP47 and ISO 15189 §7.5.1.4, the responsible clinician must be notified and the notification documented with verbatim read-back before this result can be saved.")}
            </div>
          </div>
          <button onClick={() => setShowCriticalForm(true)}
            className="px-3 py-2 bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 flex-shrink-0 whitespace-nowrap rounded-sm">
            {t("button.criticalNotification.open","Open Notification Form")}
          </button>
        </div>
      )}
      {isCritical && showCriticalForm && !criticalAcknowledged && (
        <CriticalNotificationForm
          result={result}
          criticalMsg={criticalMsg}
          defaultClinician={result.orderInfo?.clinician}
          onConfirm={(payload) => {
            setCriticalNotificationRecord(payload);
            setCriticalAcknowledged(true);
            setShowCriticalForm(false);
          }}
          onCancel={() => setShowCriticalForm(false)}
        />
      )}
      {isCritical && criticalAcknowledged && criticalNotificationRecord && (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-b border-orange-200 text-xs text-orange-700">
          <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
          <span>
            {t("message.criticalNotification.summary","Notified {recipient} at {time} via {method} — read-back confirmed")
              .replace("{recipient}", criticalNotificationRecord.recipient)
              .replace("{time}", criticalNotificationRecord.time)
              .replace("{method}", criticalNotificationRecord.method)}
            {criticalNotificationRecord.escalations?.length > 0 && (
              <span className="ml-2 text-orange-600">· {criticalNotificationRecord.escalations.length} escalation attempt(s) logged</span>
            )}
          </span>
        </div>
      )}

      {showNceForm && (
        <ReportNceForm result={result} onSubmit={handleNceSubmit} onCancel={() => setShowNceForm(false)} />
      )}

      {/* Tabs — QA/QC + History only */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {PANEL_TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors ${
                activeTab === key
                  ? "border-blue-700 text-blue-700 font-semibold bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t(`label.tab.${key}`, label)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50">
        {activeTab === "qaqc"    && <QAQCTab result={result} />}
        {activeTab === "history" && <HistoryTab result={result} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast banner — supports nested reflex/calc lists
// ---------------------------------------------------------------------------
function ToastBanner({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-start gap-3 p-3 shadow-lg border-l-4 text-sm ${
          t.kind === "success" ? "bg-green-50 border-green-500" :
          t.kind === "error"   ? "bg-red-50 border-red-500"    :
          t.kind === "warning" ? "bg-amber-50 border-amber-500" : "bg-blue-50 border-blue-500"
        }`}>
          <div className="flex-1 text-gray-800">
            <div>{t.message}</div>
            {t.reflexes?.length > 0 && (
              <div className="mt-1.5 text-xs">
                <span className="font-semibold text-green-700">Reflex tests created: </span>
                <span className="font-mono text-gray-600">{t.reflexes.join(", ")}</span>
              </div>
            )}
            {t.calculations?.length > 0 && (
              <div className="mt-1.5 text-xs">
                <span className="font-semibold text-blue-700">Calculated tests: </span>
                <span className="font-mono text-gray-600">{t.calculations.join(", ")}</span>
              </div>
            )}
            {t.notifyValidators && (
              <div className="mt-1.5 text-xs flex items-center gap-1 text-purple-700">
                <Bell className="w-3 h-3" /> STAT result — validators have been notified.
              </div>
            )}
          </div>
          <button onClick={() => onClose(t.id)} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// E-signature modal stub
// ---------------------------------------------------------------------------
function ESignatureModal({ open, onSign, onCancel, batch }) {
  const [password, setPassword] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
      <div className="bg-white p-5 w-96 shadow-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-blue-700" />
          <h3 className="text-base font-semibold text-gray-900">{t("heading.esig","E-Signature Required")}</h3>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          {t("message.esig.intro","You are about to save")} <strong>{batch.count}</strong> {t("message.esig.results","result(s) for")} <span className="font-mono">{batch.context}</span>. {t("message.esig.policy","Per lab policy, results must be e-signed before they enter the validation queue.")}
        </p>
        <label className="block text-xs font-medium text-gray-700 mb-1">{t("label.esig.password","Password")}</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-300 text-sm py-1.5 px-2 mb-3"
          placeholder={t("placeholder.esig.password","Enter your password to sign")} />
        <p className="text-xs text-gray-400 mb-3">{t("help.esig.meaning","Meaning: AUTHORED · Record type: RESULT_BATCH")}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">{t("button.cancel","Cancel")}</button>
          <button onClick={() => { onSign(); setPassword(""); }} disabled={!password}
            className={`px-3 py-1.5 text-xs font-medium ${password ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            {t("button.esig.sign","Sign & Save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const STATUS_FILTERS = ["All", "pending", "entered", "awaiting-validation", "released", "cancelled"];

export default function ResultsPageRedesign() {
  const [results, setResults]               = useState(INITIAL_RESULTS);
  const [labUnit, setLabUnit]               = useState("");
  const [searchQuery, setSearchQuery]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("All");
  const [expandedId, setExpandedId]         = useState(null);
  const [toasts, setToasts]                 = useState([]);
  const [esigOpen, setEsigOpen]             = useState(false);
  const [esigPayload, setEsigPayload]       = useState(null);
  // Admin/site config flags
  const [showPatientNames, setShowPatientNames] = useState(false);    // site-wide override
  const [piiByRole, setPiiByRole]               = useState(true);     // PATIENT_DATA_ON_RESULTS_BY_ROLE
  const [userHasPatientPerm, setUserHasPatientPerm] = useState(true); // current user perm
  const [userHasValidatorPerm, setUserHasValidatorPerm] = useState(true); // current user has Validator bundle
  // BR-034: requireReagentLotsForResults site config (default ON for ISO-accredited labs)
  const [requireReagentLots, setRequireReagentLots] = useState(true);
  // Workplan deep-link source
  const [workplanSource, setWorkplanSource] = useState(null);
  // Server-side pagination indicator (stub)
  const [serverPage, setServerPage]         = useState({ current: 1, total: 1 });

  // Effective patient name visibility:
  //  - if site-wide showPatientNames is ON → always show name
  //  - else if piiByRole is ON and current user lacks PatientResults perm → MASK
  //  - else → show ID + sex + age (no name)
  const shouldShowName = showPatientNames;
  const shouldMaskPII  = !showPatientNames && piiByRole && !userHasPatientPerm;

  const addToast = (message, kind = "success", extra = {}) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, kind, ...extra }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  // Stale-page conflict guard — random demo simulation
  const simulateStaleConflict = () => Math.random() < 0.1;

  const handleSaveInitiate = (resultId, value, modificationNote) => {
    if (!value?.toString().trim()) {
      addToast(t("error.results.resultRequired","Result value is required before saving."), "error");
      return;
    }
    // Prompt e-sig
    const r = results.find(x => x.id === resultId);
    setEsigPayload({ resultId, value, modificationNote, count: 1, context: r?.labNumber });
    setEsigOpen(true);
  };

  const handleSaveSigned = () => {
    if (!esigPayload) return;
    const { resultId, value, modificationNote } = esigPayload;
    const prevResult = results.find(r => r.id === resultId);
    const isModification = prevResult?.status === "awaiting-validation" || prevResult?.status === "released";

    // Stale page conflict simulation
    if (simulateStaleConflict()) {
      addToast(t("warn.stalePage","Result has been saved by another user — refreshing the page."), "warning");
      setEsigOpen(false);
      setEsigPayload(null);
      return;
    }

    setResults(prev => prev.map(r => {
      if (r.id !== resultId) return r;
      const updatedNotes = modificationNote?.trim()
        ? [...(r.notes || []), {
            id: Date.now(), date: new Date().toLocaleString(), author: "Current User", type: "internal",
            body: `[Modification reason] ${modificationNote.trim()}`,
          }]
        : r.notes;
      return { ...r, result: value, currentResult: r.result || r.currentResult, status: "awaiting-validation", notes: updatedNotes };
    }));
    setExpandedId(null);
    setEsigOpen(false);

    // Simulate post-save reflex / calculated test toasts + STAT notify
    const isStat = prevResult?.orderInfo?.priority === "STAT";
    const reflexes = prevResult?.testName?.toLowerCase().includes("glucose") ? [`${prevResult.labNumber}-2`] : [];
    const calculations = prevResult?.testName?.toLowerCase().includes("hemoglobin") ? ["MCH", "MCHC"] : [];

    addToast(
      isModification
        ? t("toast.modified","Result modified and returned to Validation queue.")
        : t("toast.saved","Result saved and queued for validation."),
      "success",
      { reflexes, calculations, notifyValidators: isStat }
    );
    setEsigPayload(null);
  };

  const handleNceSubmit = (resultId, nceData) => {
    // Apply disposition: CANCEL voids, REJECT deletes (but in mockup just marks), RETEST keeps pending, REFER kicks Referral
    let nextStatus = "cancelled";
    if (nceData.disposition === "RETEST") nextStatus = "pending";
    if (nceData.disposition === "REFER")  nextStatus = "awaiting-validation"; // referral logged separately

    setResults(prev => prev.map(r =>
      r.id === resultId ? {
        ...r,
        status: nextStatus,
        nce: {
          number: nceData.nceNumber,
          status: "open",
          category: nceData.category,
          subcategory: nceData.subcategory,
          severity: nceData.severity,
        },
      } : r
    ));
    setExpandedId(null);
    addToast(
      `${t("toast.nce.created","NCE")} ${nceData.nceNumber} ${t("toast.nce.dispositionApplied","created. Disposition")}: ${nceData.disposition}. ${t("toast.nce.followup","Open NCE module to complete investigation.")}`,
      "warning"
    );
  };

  const filtered = useMemo(() => results.filter(r => {
    const q = (searchQuery || "").toLowerCase();
    const matchSearch = !q || r.testName.toLowerCase().includes(q) ||
      r.labNumber.toLowerCase().includes(q) || r.patient.id.includes(q) ||
      r.patient.name.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  }), [results, searchQuery, statusFilter]);

  // Explicit i18n key per column — translators don't need to guess the slug,
  // and renaming the visible label doesn't silently break translations.
  const TABLE_HEADERS = [
    { key: "column.samplePatient",  label: "Sample / Patient" },
    { key: "column.testDate",       label: "Test Date" },
    { key: "column.analyzerResult", label: "Analyzer Result" },
    { key: "column.testName",       label: "Test Name" },
    { key: "column.sample",         label: "Sample" },
    { key: "column.normalRange",    label: "Normal Range" },
    { key: "column.result",         label: "Result" },
    { key: "column.currentResult",  label: "Current Result" },
    { key: "column.status",         label: "Status" },
    { key: "column.flags",          label: "Flags" },
    { key: "column.actions",        label: "Actions" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-sm">
      <ToastBanner toasts={toasts} onClose={id => setToasts(prev => prev.filter(t => t.id !== id))} />
      <ESignatureModal open={esigOpen} onSign={handleSaveSigned} onCancel={() => { setEsigOpen(false); setEsigPayload(null); }} batch={esigPayload || { count: 0, context: "" }} />

      {/* Preview banner + admin config simulation */}
      <div className="bg-blue-50 border-b-2 border-blue-600 px-4 py-2 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-blue-700 font-semibold">🎨 Preview v3</span>
        <span className="text-gray-500">— Results Entry · Carbon Design System · OpenELIS Global</span>
        <span className="ml-auto flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Site:</span>
            <span className="text-gray-700">Show patient name</span>
            <button onClick={() => setShowPatientNames(v => !v)}
              className={`relative inline-flex h-4 w-8 cursor-pointer rounded-full border-2 border-transparent ${showPatientNames ? "bg-blue-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow ${showPatientNames ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </span>
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Role PII:</span>
            <span className="text-gray-700">User has PatientResults perm</span>
            <button onClick={() => setUserHasPatientPerm(v => !v)}
              className={`relative inline-flex h-4 w-8 cursor-pointer rounded-full border-2 border-transparent ${userHasPatientPerm ? "bg-green-600" : "bg-red-500"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow ${userHasPatientPerm ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </span>
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Require reagent lot?</span>
            <button onClick={() => setRequireReagentLots(v => !v)}
              className={`relative inline-flex h-4 w-8 cursor-pointer rounded-full border-2 border-transparent ${requireReagentLots ? "bg-amber-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow ${requireReagentLots ? "translate-x-4" : "translate-x-0"}`} />
            </button>
            <span className={requireReagentLots ? "text-amber-700 font-medium" : "text-gray-400"}>{requireReagentLots ? "ON" : "OFF"}</span>
          </span>
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Validator?</span>
            <button onClick={() => setUserHasValidatorPerm(v => !v)}
              className={`relative inline-flex h-4 w-8 cursor-pointer rounded-full border-2 border-transparent ${userHasValidatorPerm ? "bg-green-600" : "bg-red-500"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow ${userHasValidatorPerm ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </span>
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Workplan?</span>
            <button onClick={() => setWorkplanSource(v => v ? null : "WorkPlanByTest")}
              className={`relative inline-flex h-4 w-8 cursor-pointer rounded-full border-2 border-transparent ${workplanSource ? "bg-purple-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow ${workplanSource ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </span>
          <span className="text-gray-400">Interactive mockup</span>
        </span>
      </div>

      {/* Shell header w/ Workplan-aware breadcrumb */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-2 text-sm">
        <span className="text-blue-400 font-bold">OpenELIS Global</span>
        <span className="text-gray-500">›</span>
        <span>Home</span>
        {workplanSource && (
          <>
            <span className="text-gray-500">›</span>
            <span>Workplan</span>
          </>
        )}
        <span className="text-gray-500">›</span>
        <span>Results</span>
      </div>

      {/* Page heading */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-2xl font-light text-gray-900">{t("heading.results","Results")}</h1>
        <p className="text-gray-500 text-xs mt-0.5">{t("subheading.results","Enter and manage test results for pending laboratory orders")}</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-52 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text"
              className="w-full pl-8 pr-3 py-2 border border-gray-400 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder={t("placeholder.search","Search or scan barcode — lab number, patient ID, test name, accession…")}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="min-w-44">
            <div className="text-xs text-gray-500 mb-1">{t("label.labUnit","Lab Unit")} <span className="text-red-500">*</span></div>
            <select className="w-full border border-gray-400 bg-gray-50 text-sm py-2 px-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={labUnit} onChange={e => setLabUnit(e.target.value)}>
              {LAB_UNITS.map(u => <option key={u.id} value={u.id}>{t(u.nameKey, u.defaultName)}</option>)}
            </select>
          </div>

          {["Date From", "Date To"].map(lbl => (
            <div key={lbl} className="min-w-36">
              <div className="text-xs text-gray-500 mb-1">{t(`label.filter.${lbl.replace(/ /g,"")}`, lbl)}</div>
              <input type="date" defaultValue="2025-12-18"
                className="w-full border border-gray-400 bg-gray-50 text-sm py-2 px-2 focus:outline-none focus:ring-1 focus:ring-blue-600" />
            </div>
          ))}

          <button className="px-4 py-2 bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 whitespace-nowrap">
            {t("button.search","Load Results")}
          </button>

          {/* Server-side pagination indicator (top) */}
          <div className="flex items-center gap-2 text-xs text-gray-500 ml-auto">
            <button onClick={() => setServerPage(p => ({ ...p, current: Math.max(1, p.current-1) }))}
              className="p-1 border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
              disabled={serverPage.current === 1}>‹</button>
            <span>{t("label.serverPage","Server page")} <strong className="text-gray-700">{serverPage.current}</strong> / {serverPage.total}</span>
            <button onClick={() => setServerPage(p => ({ ...p, current: Math.min(p.total, p.current+1) }))}
              className="p-1 border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
              disabled={serverPage.current === serverPage.total}>›</button>
          </div>
        </div>
      </div>

      {/* Status filter bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 font-medium mr-1">{t("label.filter.show","Show")}:</span>
        {STATUS_FILTERS.map(s => {
          const count = s === "All" ? results.length : results.filter(r => r.status === s).length;
          if (count === 0 && s !== "All" && s !== "pending" && s !== statusFilter) return null;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                statusFilter === s
                  ? "bg-gray-800 border-gray-800 font-semibold text-white"
                  : "border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}>
              {s === "All" ? t("label.filter.all","All") : STATUS_CONFIG[s]?.label || s} ({count})
            </button>
          );
        })}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} {filtered.length === 1 ? t("label.result","result") : t("label.results","results")}
        </span>
      </div>

      {/* Nonconforming legend strip — matches live app */}
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2 text-xs text-orange-900">
        <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
        = {t("legend.nonconforming","Sample or Order is nonconforming or Test has been rejected")}
      </div>

      {/* Table */}
      <div className="mx-4 mt-4 bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-max">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="w-10" />
              {TABLE_HEADERS.map(h => (
                <th key={h.key} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap">{t(h.key, h.label)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={TABLE_HEADERS.length + 1} className="text-center py-12 text-gray-400 text-sm">
                  {searchQuery ? t("message.noMatch","No results match your search.") : t("message.emptyStart","Select a lab unit and date range, then click Load Results.")}
                </td>
              </tr>
            )}

            {filtered.map(result => {
              const isExpanded = expandedId === result.id;
              const isCancelled = result.status === "cancelled";
              const rs = evaluateResult(result.result, result.rangeBounds);
              const hasNce = !!result.nce;
              const nceColor = result.nce?.status === "closed" ? "gray" : "teal";

              return (
                <>
                  <tr key={result.id}
                    className={`border-b border-gray-100 transition-colors ${
                      isCancelled ? "opacity-60 bg-gray-50" :
                      isExpanded ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}>
                    {/* Expand */}
                    <td className="w-10 text-center">
                      {!isCancelled && (
                        <button onClick={() => setExpandedId(isExpanded ? null : result.id)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          aria-label={isExpanded ? t("button.collapse","Collapse") : t("button.expand","Expand")}>
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-blue-700" />
                            : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </button>
                      )}
                    </td>

                    {/* Sample / Patient */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <PatientAvatar patient={result.patient} size={28} />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-gray-700">{result.labNumber}-{result.sequenceNumber}</span>
                            <CopyButton text={`${result.labNumber}-${result.sequenceNumber}`} />
                            {result.nonconforming && (
                              <span title={t("tooltip.nonconforming","Sample or order is nonconforming")} className="ml-1 text-orange-600">
                                <AlertTriangle className="w-3 h-3 inline" />
                              </span>
                            )}
                          </div>
                          {shouldMaskPII ? (
                            <div className="text-xs text-gray-400 italic mt-0.5">— — —</div>
                          ) : shouldShowName ? (
                            <div className="text-xs font-medium text-gray-800 mt-0.5">{result.patient.name}</div>
                          ) : (
                            <div className="text-xs text-gray-500 mt-0.5">
                              ID {result.patient.id} · {result.patient.sex} · {calcAge(result.patient.dob)}
                            </div>
                          )}
                          {result.isEqaSample && result.program && (
                            <div className="mt-1"><EQABadge program={result.program} /></div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Test Date — inline editable date + time */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <input type="date" defaultValue={result.testDate.split("/").reverse().join("-")}
                          className="text-xs py-0.5 px-1 border border-gray-200 bg-transparent focus:outline-none focus:border-blue-600" />
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <input type="time" defaultValue={result.testTime}
                          className="text-xs py-0.5 px-1 border border-gray-200 bg-transparent focus:outline-none focus:border-blue-600" />
                      </div>
                    </td>

                    {/* Analyzer Result */}
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {result.analyzerResult}
                    </td>

                    {/* Test Name */}
                    <td className="px-3 py-3 max-w-48">
                      <div className={`font-medium ${isCancelled ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {result.testName}
                      </div>
                    </td>

                    {/* Sample */}
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">{result.sampleType}</td>

                    {/* Normal Range */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-700">{result.normalRange}</span>
                      <span className="text-xs text-gray-400 ml-1">{result.unit}</span>
                    </td>

                    {/* Result — polymorphic by resultType */}
                    <ResultCell result={result} isCancelled={isCancelled}
                      onChange={val => setResults(prev => prev.map(r =>
                        r.id === result.id ? { ...r, result: val } : r))} />

                    {/* Current Result — shadow value */}
                    <td className="px-3 py-3 whitespace-nowrap">{renderCurrentResult(result)}</td>

                    {/* Status — w/ optional Modified pill from BR-035 */}
                    <td className="px-3 py-3">
                      <StatusTag status={result.status} />
                      {result.modificationHistory?.length > 0 && (
                        <div className="mt-1">
                          <Tag kind="warm-gray" title={`${result.modificationHistory.length} prior modification(s) — see History banner in expanded panel`}>
                            <Pencil className="w-3 h-3 inline mr-0.5" />
                            {t("label.row.modifiedTag","Modified")}
                          </Tag>
                        </div>
                      )}
                    </td>

                    {/* Flags */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex gap-1 items-center flex-wrap">
                        {result.flags.includes("above-normal") && <span className="text-red-600 font-bold text-xs" title={t("tooltip.flag.high","Above normal range")}>H</span>}
                        {result.flags.includes("below-normal") && <span className="text-blue-600 font-bold text-xs" title={t("tooltip.flag.low","Below normal range")}>L</span>}
                        {result.flags.includes("delta-check") && <span className="text-amber-600 font-bold text-xs" title={t("tooltip.flag.delta","Delta check threshold exceeded")}>Δ</span>}
                        {rs === "critical" && (
                          <span className={`px-1 py-0.5 rounded text-xs font-bold ${RANGE_FLAG_BADGE.critical}`} title={t("tooltip.flag.critical","Critical/panic value — acknowledgment required")}>C</span>
                        )}
                        {rs === "invalid" && (
                          <span className={`px-1 py-0.5 rounded text-xs font-bold ${RANGE_FLAG_BADGE.invalid}`} title={t("tooltip.flag.invalid","Outside physiologically valid range")}>!</span>
                        )}
                        {hasNce && (
                          <Tag kind={nceColor}
                            title={`NCE ${result.nce.number} · ${result.nce.category} / ${result.nce.subcategory} · ${result.nce.severity} · ${result.nce.status}`}>
                            NCE
                          </Tag>
                        )}
                        {result.flags.length === 0 && rs !== "critical" && rs !== "invalid" && !hasNce && <span className="text-gray-300 text-xs">—</span>}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      {!isCancelled && (result.result || "").toString().trim() !== "" && (() => {
                        const isModification = result.status === "awaiting-validation" || result.status === "released";
                        const isReleased     = result.status === "released";
                        if (isModification) {
                          // BR + F-19: Modifying a Released result requires Validator bundle.
                          // Non-validators see a disabled button with explanatory tooltip.
                          const releasedBlocked = isReleased && !userHasValidatorPerm;
                          return (
                            <button
                              onClick={() => !releasedBlocked && setExpandedId(isExpanded ? null : result.id)}
                              disabled={releasedBlocked}
                              className={`flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap border font-medium ${
                                releasedBlocked
                                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                  : isReleased
                                  ? "border-amber-500 text-amber-700 hover:bg-amber-50"
                                  : "border-blue-600 text-blue-700 hover:bg-blue-50"
                              }`}
                              title={
                                releasedBlocked
                                  ? t("title.action.modifyReleasedBlocked","Released-result modification requires Validator permission")
                                  : isReleased
                                  ? t("title.action.modifyReleased","Result has been validated — click to modify")
                                  : t("title.action.modifyQueued","Modify this saved result")
                              }>
                              {releasedBlocked ? <Lock className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                              {t("button.modify","Modify Result")}
                            </button>
                          );
                        }
                        return (
                          <button onClick={() => handleSaveInitiate(result.id, result.result)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-700 text-white hover:bg-blue-800 whitespace-nowrap"
                            title={t("title.action.save","Save (e-sig prompted)")}>
                            <KeyRound className="w-3 h-3" />
                            {t("button.save","Save")}
                          </button>
                        );
                      })()}
                      {isCancelled && result.nce && (
                        <Tag kind="teal"
                          title={`${result.nce.number} · ${result.nce.category} / ${result.nce.subcategory} · ${result.nce.severity}`}>
                          NCE
                        </Tag>
                      )}
                    </td>
                  </tr>

                  {isExpanded && !isCancelled && (
                    <tr key={`${result.id}-exp`} className="bg-gray-50">
                      <td colSpan={TABLE_HEADERS.length + 1} className="p-0">
                        <ExpandedPanel
                          result={result}
                          onSave={handleSaveInitiate}
                          onNceSubmit={handleNceSubmit}
                          requireReagentLots={requireReagentLots}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {/* Pagination (bottom — client-side) */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {t("label.itemsPerPage","Items per page")}:
            <select className="border border-gray-300 bg-gray-50 py-1 px-1 text-xs">
              {[10, 20, 30, 50, 100].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <span>1–{filtered.length} {t("label.of","of")} {filtered.length} {t("label.items","items")}</span>
          <div className="flex gap-1">
            <button className="px-2 py-1 border border-gray-200 text-gray-300" disabled>‹</button>
            <button className="px-2 py-1 border border-blue-600 bg-blue-700 text-white">1</button>
            <button className="px-2 py-1 border border-gray-200 text-gray-300" disabled>›</button>
          </div>
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}
