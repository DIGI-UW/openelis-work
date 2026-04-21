/**
 * Results Entry Page — Interactive Preview v3
 * OpenELIS Global · Structural fixes per critique
 *
 * Changes from v2:
 *  - Notes + Interpretation are always-visible sections above tabs (not tabs)
 *  - Report NCE inline form replaces reject workflow
 *  - Referral tab added (checkbox-gated fields)
 *  - QA/QC tab added
 *  - Order Info tab added
 *  - Patient name hidden in collapsed row (ID + calculated age shown)
 *  - Method & Reagents is default tab
 *  - Program banner in expanded panel
 */
import { useState } from "react";
import {
  Search, ChevronRight, ChevronDown, ChevronUp, Check, AlertTriangle,
  FileText, Microscope, Paperclip, History, FlaskConical, Send,
  Plus, Trash2, Download, X, Info, Shield, ClipboardList,
  MessageSquare, AlertCircle, ExternalLink, Pencil
} from "lucide-react";

// ---------------------------------------------------------------------------
// i18n stub
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

// ---------------------------------------------------------------------------
// Result range evaluation
// ---------------------------------------------------------------------------
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
// Mock data
// ---------------------------------------------------------------------------
const LAB_UNITS = [
  { id: "", name: "All Lab Units" },
  { id: "hematology", name: "Hematology" },
  { id: "chemistry", name: "Chemistry" },
  { id: "microbiology", name: "Microbiology" },
  { id: "immunology", name: "Immunology" },
];

const INITIAL_RESULTS = [
  {
    id: "1",
    labNumber: "DEV01250000000000",
    patient: { name: "Test, Patient", id: "3456789", dob: "01/11/2011", sex: "M" },
    testDate: "12/18/2025",
    testName: "White Blood Cells Count (WBC)",
    sampleType: "Whole Blood",
    normalRange: "4.00–10.00",
    unit: "x10⁹/L",
    rangeBounds: {
      normal:   { low: 4.00,  high: 10.00 },
      critical: { low: 2.00,  high: 30.00, lowMsg: "Critical leukopenia — WBC < 2.00 x10⁹/L", highMsg: "Critical leukocytosis — WBC > 30.00 x10⁹/L" },
      valid:    { low: 0.10,  high: 100.0 },
    },
    result: "",
    status: "pending",
    analyzer: null,
    flags: [],
    program: { name: "EQA Round 4", dueDate: "12/20/2025" },
    previousResults: [
      { date: "12/01/2025", value: "6.8", unit: "x10⁹/L", delta: null },
      { date: "11/15/2025", value: "7.2", unit: "x10⁹/L", delta: "+5.9%" },
    ],
    notes: [
      { id: 1, date: "12/18/2025 09:45", author: "J. Smith", type: "internal", body: "Sample hemolyzed, may need redraw." },
    ],
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
        { level: "Level 1", value: "5.2", expected: "5.0 ± 0.5", status: "pass" },
        { level: "Level 2", value: "10.8", expected: "10.5 ± 0.8", status: "pass" },
      ],
      analyzerStatus: "Online", lastCalibrated: "12/18/2025 06:00",
    },
    suggestedInterpretation: null,
    interpretationOptions: [
      { code: "WBC-NL",   label: "Normal",       color: "green",  range: "4.00–10.00", text: "WBC count within normal limits. No evidence of infection or hematologic abnormality." },
      { code: "WBC-LEUK", label: "Leukocytosis", color: "red",    range: ">10.00",     text: "Elevated WBC. May indicate infection, inflammation, stress response, or hematologic disorder." },
      { code: "WBC-LP",   label: "Leukopenia",   color: "stone",  range: "<4.00",      text: "Decreased WBC. May indicate bone marrow suppression, viral infection, or autoimmune condition." },
    ],
    qcStatus: "pass",
    deltaCheck: null,
    referral: null,
    // Pre-existing NCE filed for hemolyzed specimen
    nce: { number: "NCE-20251218-2341", status: "open", category: "Pre-Analytical", subcategory: "Specimen Integrity", severity: "Minor" },
  },
  {
    id: "2",
    labNumber: "DEV01250000000000",
    patient: { name: "Test, Patient", id: "3456789", dob: "01/11/2011", sex: "M" },
    testDate: "12/18/2025",
    testName: "Red Blood Cells Count (RBC)",
    sampleType: "Whole Blood",
    normalRange: "4.50–6.00",
    unit: "x10¹²/L",
    rangeBounds: {
      normal:   { low: 4.50, high: 6.00 },
      critical: { low: 2.50, high: 7.00, lowMsg: "Critical anemia — RBC < 2.50 x10¹²/L", highMsg: "Critical polycythemia — RBC > 7.00 x10¹²/L" },
      valid:    { low: 1.00, high: 9.00 },
    },
    result: "4.2",
    status: "awaiting-validation",
    analyzer: "Sysmex XN-L",
    flags: ["below-normal"],
    program: null,
    previousResults: [
      { date: "12/01/2025", value: "4.8", unit: "x10¹²/L", delta: null },
      { date: "11/15/2025", value: "4.7", unit: "x10¹²/L", delta: "-2.1%" },
    ],
    notes: [],
    attachments: [],
    orderInfo: {
      clinician: "Dr. Sarah Williams", clinicianPhone: "+1 555-0123",
      department: "Internal Medicine", priority: "Routine",
      collectionDate: "12/18/2025 08:30", receivedDate: "12/18/2025 09:00",
    },
    qcData: {
      overall: "pass",
      controls: [
        { level: "Level 1", value: "4.9", expected: "4.8 ± 0.3", status: "pass" },
        { level: "Level 2", value: "6.1", expected: "6.0 ± 0.4", status: "pass" },
      ],
      analyzerStatus: "Online", lastCalibrated: "12/18/2025 05:45",
    },
    suggestedInterpretation: { code: "RBC-ANEMOD", label: "Mild Anemia", color: "stone", text: "RBC count slightly below reference range. Suggests mild anemia. Recommend correlation with Hgb, Hct, and reticulocyte count." },
    interpretationOptions: [
      { code: "RBC-NL",     label: "Normal",                 color: "green", range: "4.50–6.00", text: "Red blood cell count within normal limits." },
      { code: "RBC-ANEMOD", label: "Mild Anemia",            color: "stone", range: "3.50–4.49", text: "RBC count slightly below reference range. Suggests mild anemia." },
      { code: "RBC-ANESEV", label: "Moderate-Severe Anemia", color: "red",   range: "<3.50",     text: "Significantly decreased RBC count. Urgent clinical evaluation recommended." },
    ],
    qcStatus: "pass",
    deltaCheck: null,
    referral: null,
    nce: null,
  },
  {
    id: "3",
    labNumber: "DEV01250000000001",
    patient: { name: "Smith, Jane", id: "7891234", dob: "05/22/1985", sex: "F" },
    testDate: "12/18/2025",
    testName: "Glucose, Fasting",
    sampleType: "Serum",
    normalRange: "70–99",
    unit: "mg/dL",
    rangeBounds: {
      normal:   { low: 70,  high: 99 },
      critical: { low: 50,  high: 400, lowMsg: "Critical hypoglycemia — Glucose < 50 mg/dL", highMsg: "Critical hyperglycemia — Glucose > 400 mg/dL" },
      valid:    { low: 20,  high: 600 },
    },
    result: "142",
    status: "awaiting-validation",
    analyzer: "Cobas c 501",
    flags: ["above-normal", "delta-check"],
    program: null,
    previousResults: [
      { date: "12/01/2025", value: "98",  unit: "mg/dL", delta: null },
      { date: "11/01/2025", value: "102", unit: "mg/dL", delta: "+4.1%" },
    ],
    notes: [{ id: 1, date: "12/18/2025 11:30", author: "K. Davis", type: "external", body: "Patient confirmed 12-hour fast prior to collection." }],
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
    suggestedInterpretation: { code: "GLU-DM", label: "Diabetes Mellitus", color: "red", text: "Fasting glucose ≥126 mg/dL is consistent with diabetes mellitus. Recommend confirmation with repeat fasting glucose or HbA1c." },
    interpretationOptions: [
      { code: "GLU-NL",   label: "Normal",                   color: "green", range: "70–99",       text: "Fasting glucose within normal limits." },
      { code: "GLU-IFG",  label: "Impaired Fasting Glucose", color: "stone", range: "100–125",     text: "Fasting glucose in prediabetic range. Recommend lifestyle modifications and periodic monitoring." },
      { code: "GLU-DM",   label: "Diabetes Mellitus",        color: "red",   range: "≥126",        text: "Fasting glucose ≥126 mg/dL is consistent with diabetes mellitus." },
      { code: "GLU-CRIT", label: "Critical Value",           color: "red",   range: "<50 or >400", text: "CRITICAL VALUE — Immediate physician notification required." },
    ],
    qcStatus: "pass",
    deltaCheck: { previous: "98", current: "142", change: "+44.9%", threshold: "20%" },
    referral: null,
    nce: null,
  },
  {
    id: "4",
    labNumber: "DEV01250000000002",
    patient: { name: "Johnson, Robert", id: "5551234", dob: "03/14/1960", sex: "M" },
    testDate: "12/18/2025",
    testName: "Potassium",
    sampleType: "Serum",
    normalRange: "3.5–5.0",
    unit: "mmol/L",
    rangeBounds: {
      normal:   { low: 3.5, high: 5.0 },
      critical: { low: 2.5, high: 6.5, lowMsg: "Critical hypokalemia — K⁺ < 2.5 mmol/L", highMsg: "Critical hyperkalemia — K⁺ > 6.5 mmol/L" },
      valid:    { low: 1.0, high: 10.0 },
    },
    result: "7.8",
    status: "awaiting-validation",
    analyzer: "Cobas c 501",
    flags: ["above-normal"],
    program: null,
    previousResults: [],
    notes: [],
    attachments: [],
    orderInfo: {
      clinician: "Dr. Lisa Park", clinicianPhone: "+1 555-0789",
      department: "Cardiology", priority: "Routine",
      collectionDate: "12/18/2025 10:15", receivedDate: "12/18/2025 10:45",
    },
    qcData: { overall: "none", controls: [], analyzerStatus: "—", lastCalibrated: "—" },
    suggestedInterpretation: null,
    interpretationOptions: [],
    qcStatus: "none",
    deltaCheck: null,
    referral: null,
    nce: null,
  },
];

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  pending:               { label: "Pending",              bg: "bg-gray-200",   text: "text-gray-700" },
  entered:               { label: "Entered",              bg: "bg-blue-100",   text: "text-blue-800" },
  "awaiting-validation": { label: "Awaiting Validation",  bg: "bg-amber-100",  text: "text-amber-800" },
  released:              { label: "Released",             bg: "bg-green-100",  text: "text-green-800" },
  cancelled:             { label: "Cancelled",            bg: "bg-red-100",    text: "text-red-700"   },
};

const COLOR_CONFIG = {
  green:  { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-400" },
  red:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-400" },
  stone:  { bg: "bg-stone-100",  text: "text-stone-700",  border: "border-stone-400" },
  blue:   { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-400" },
  purple: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-400" },
  teal:   { bg: "bg-teal-100",   text: "text-teal-800",   border: "border-teal-400" },
  gray:   { bg: "bg-gray-200",   text: "text-gray-700",   border: "border-gray-400" },
};

const QC_DOT = {
  pass: "bg-green-500", warning: "bg-yellow-400", fail: "bg-red-500", none: "bg-gray-300",
};

// Result range visual styles
// empty/normal  — no highlight
// abnormal      — yellow  (outside normal range)
// critical      — orange  (panic / critical value, requires acknowledgment)
// invalid       — dark red (outside valid physiological range — likely instrument error)
const RANGE_INPUT_BORDER = {
  empty:    "border-gray-300",
  normal:   "border-gray-400",
  abnormal: "border-yellow-500",
  critical: "border-orange-500",
  invalid:  "border-red-800",
};
const RANGE_CELL_BG = {
  empty:    "",
  normal:   "",
  abnormal: "bg-yellow-50",
  critical: "bg-orange-50",
  invalid:  "bg-red-950",
};
const RANGE_CELL_TEXT = {
  empty:    "text-gray-700",
  normal:   "text-gray-700",
  abnormal: "text-yellow-900",
  critical: "text-orange-900",
  invalid:  "text-red-100",
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

// ---------------------------------------------------------------------------
// Tiny reusable components
// ---------------------------------------------------------------------------
function Tag({ color = "gray", children }) {
  const c = COLOR_CONFIG[color] || COLOR_CONFIG.gray;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {children}
    </span>
  );
}

function StatusTag({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const colorMap = { pending: "gray", entered: "blue", "awaiting-validation": "stone", released: "green", cancelled: "red" };
  return <Tag color={colorMap[status] || "gray"}>{c.label}</Tag>;
}

function SectionHeader({ label, open, onToggle, badge }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {label}
        {badge && <span className="text-xs font-normal text-gray-400">{badge}</span>}
      </div>
      {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient Banner
// ---------------------------------------------------------------------------
function PatientBanner({ patient, orderInfo }) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-gray-100 border-b border-gray-200 text-sm">
      <span className="font-semibold text-gray-900">{patient.name}</span>
      <span className="text-gray-400 text-xs">ID: <strong className="text-gray-700">{patient.id}</strong></span>
      <span className="text-gray-400 text-xs">DOB: <strong className="text-gray-700">{patient.dob}</strong></span>
      <span className="text-gray-400 text-xs">Sex: <strong className="text-gray-700">{patient.sex}</strong></span>
      {orderInfo?.clinician && <span className="text-gray-400 text-xs">Clinician: <strong className="text-gray-700">{orderInfo.clinician}</strong></span>}
      {orderInfo?.department && <span className="text-gray-400 text-xs">Dept: <strong className="text-gray-700">{orderInfo.department}</strong></span>}
      {orderInfo?.priority && <Tag color={orderInfo.priority === "STAT" ? "red" : "gray"}>{orderInfo.priority}</Tag>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Always-visible Notes section
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
        label={<><MessageSquare className="w-4 h-4 inline mr-1.5 text-gray-500" />Notes</>}
        open={open}
        onToggle={() => setOpen(o => !o)}
        badge={notes.length ? `(${notes.length})` : null}
      />
      {open && (
        <div className="px-4 py-3 space-y-2 bg-white">
          {notes.length === 0 && !showForm && (
            <p className="text-xs text-gray-400">No notes yet.</p>
          )}
          {notes.map(note => (
            <div key={note.id} className="flex gap-3 text-sm">
              <div className="flex-1 border-l-2 border-gray-200 pl-3">
                <div className="flex gap-2 text-xs text-gray-400 mb-0.5 flex-wrap">
                  <span>{note.date}</span>
                  <span className="text-gray-500 font-medium">{note.author}</span>
                  <Tag color={note.type === "internal" ? "purple" : "teal"}>
                    {note.type === "internal" ? "In Lab Only" : "Send with Result"}
                  </Tag>
                </div>
                <div className="text-gray-800 text-sm">{note.body}</div>
              </div>
            </div>
          ))}

          {showForm ? (
            <div className="bg-gray-50 border border-gray-200 p-3 space-y-2">
              <div className="flex gap-4 text-xs">
                {["internal", "external"].map(type => (
                  <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name={`note-type-${result.id}`} value={type}
                      checked={noteType === type} onChange={() => setNoteType(type)} />
                    {type === "internal" ? "In Lab Only" : "Send with Result"}
                  </label>
                ))}
              </div>
              <textarea
                className="w-full border border-gray-300 text-sm p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                rows={2} value={newNote} onChange={e => setNewNote(e.target.value)}
                placeholder="Enter note…" autoFocus
              />
              <div className="flex gap-2">
                <button onClick={addNote} className="px-3 py-1 bg-blue-700 text-white text-xs font-medium hover:bg-blue-800">Save Note</button>
                <button onClick={() => setShowForm(false)} className="px-3 py-1 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs text-blue-700 hover:underline">
              <Plus className="w-3 h-3" /> New Note
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
        label={<><Microscope className="w-4 h-4 inline mr-1.5 text-gray-500" />Interpretation</>}
        open={open}
        onToggle={() => setOpen(o => !o)}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          {result.suggestedInterpretation && (
            <div className="flex gap-2 p-2.5 mb-3 bg-blue-50 border-l-4 border-blue-600 text-xs">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span><strong className="text-blue-700">Suggestion: </strong>
                <span className="text-gray-700">{result.suggestedInterpretation.label} — {result.suggestedInterpretation.text}</span>
              </span>
            </div>
          )}

          {result.interpretationOptions.length === 0 ? (
            <p className="text-xs text-gray-400 mb-2">No interpretation templates configured for this test.</p>
          ) : (
            <div className="flex gap-3 mb-3">
              {/* Option cards — horizontal scroll on small viewports */}
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

              {/* Text area */}
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">Interpretation text</span>
                  {text && <button onClick={() => { setText(""); setSelected(null); }} className="text-xs text-gray-400 hover:text-gray-700">Clear</button>}
                </div>
                <textarea
                  className="flex-1 min-h-20 border border-gray-300 text-xs p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  value={text} onChange={e => setText(e.target.value)}
                  placeholder="Select a template or type interpretation code (e.g. WBC-NL) and press space to expand…"
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
// Program banner (conditional)
// ---------------------------------------------------------------------------
function ProgramBanner({ program }) {
  if (!program) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-purple-50 border-b border-purple-200 text-xs">
      <div className="flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-purple-600" />
        <span className="font-semibold text-purple-700">{program.name}</span>
        {program.dueDate && <span className="text-purple-500">Due: {program.dueDate}</span>}
      </div>
      <button className="flex items-center gap-1 text-purple-600 hover:underline">
        View Program Details <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Report NCE inline form (replaces reject workflow)
// ---------------------------------------------------------------------------
function ReportNceForm({ result, onSubmit, onCancel }) {
  const [category, setCategory] = useState("Analytical");
  const [subcategory, setSubcategory] = useState("Testing Error");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [retest, setRetest] = useState(false);

  const subcats = NCE_SUBCATEGORIES[category] || [];

  const handleSubmit = () => {
    if (!severity) return;
    const nceNum = genNceNumber();
    onSubmit({ nceNumber: nceNum, category, subcategory, severity, description, retest });
  };

  return (
    <div className="border border-amber-300 bg-amber-50 mx-4 mb-3 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <AlertTriangle className="w-4 h-4" />
          Report Non-Conformity Event
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-amber-700">
        Reporting this NCE will mark the result as <strong>Cancelled</strong> and create a Non-Conformity record linked to this result. You can complete investigation details in the NCE module.
      </p>

      {/* Pre-filled context */}
      <div className="bg-white border border-gray-200 px-3 py-2 text-xs text-gray-600">
        <span className="font-medium text-gray-700">Auto-linked: </span>
        {result.testName} · {result.labNumber} · Result: {result.result || "not entered"}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category <span className="text-red-500">*</span></label>
          <select className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={category} onChange={e => { setCategory(e.target.value); setSubcategory(""); }}>
            {Object.keys(NCE_SUBCATEGORIES).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory <span className="text-red-500">*</span></label>
          <select className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={subcategory} onChange={e => setSubcategory(e.target.value)}>
            {subcats.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Severity <span className="text-red-500">*</span></label>
          <select className="w-full border border-gray-300 text-xs py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={severity} onChange={e => setSeverity(e.target.value)}>
            <option value="">Select…</option>
            <option value="critical">Critical — patient safety risk</option>
            <option value="major">Major — significant quality impact</option>
            <option value="minor">Minor — limited impact</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Brief Description</label>
        <textarea className="w-full border border-gray-300 text-xs p-2 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
          rows={2} value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Describe what happened (optional — can be completed in NCE module)" />
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
        <input type="checkbox" checked={retest} onChange={e => setRetest(e.target.checked)} />
        Retest required — request new sample / repeat analysis
      </label>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSubmit} disabled={!severity}
          className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
            severity ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}>
          <AlertCircle className="w-3.5 h-3.5" />
          Submit NCE & Cancel Result
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------

// Method & Reagents
function MethodTab({ result }) {
  const [method, setMethod] = useState(result.analyzer ? "automated" : "manual");
  const [methodText, setMethodText] = useState("");

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-6 text-sm">
        {[["manual", "Manual"], ["automated", "Automated — Analyzer"]].map(([val, lbl]) => (
          <label key={val} className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name={`method-${result.id}`} value={val}
              checked={method === val} onChange={() => setMethod(val)} />
            {lbl}
          </label>
        ))}
      </div>

      {method === "manual" && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Method Description</div>
          <textarea
            className="w-full border border-gray-300 text-sm p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            rows={3} value={methodText} onChange={e => setMethodText(e.target.value)}
            placeholder="Type MAN- for macros (e.g. MAN-DIFF, MAN-HEM, QNS, CLOT, HEMOLYZED)…"
          />
          <div className="text-xs text-gray-400 mt-1">Macros: MAN-DIFF · MAN-HEM · MAN-MICRO · QNS · CLOT · HEMOLYZED</div>
        </div>
      )}

      {method === "automated" && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-36">
            <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Analyzer</div>
            <select className="w-full border border-gray-300 text-sm p-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-600">
              <option value="">Select analyzer…</option>
              {["Sysmex XN-L (Online ✓)", "Sysmex XS-1000i (Online ✓)", "Cobas c 501 (Online ✓)"].map(a => (
                <option key={a} selected={result.analyzer && a.startsWith(result.analyzer)}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200">
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Reagent Lots (FIFO)
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Reagent", "Lot Number", "Expires", "Remaining", "FIFO"].map(h => (
                <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-amber-50 border-b border-gray-100">
              <td className="px-3 py-2">Cellpack DCL</td>
              <td className="px-3 py-2 font-mono">LOT-2024-0892</td>
              <td className="px-3 py-2 text-yellow-700 font-medium">12/20/2024 ⚠</td>
              <td className="px-3 py-2">15%</td>
              <td className="px-3 py-2"><Tag color="blue">Use First</Tag></td>
            </tr>
            <tr>
              <td className="px-3 py-2">Cellpack DCL</td>
              <td className="px-3 py-2 font-mono">LOT-2024-1234</td>
              <td className="px-3 py-2">01/15/2025</td>
              <td className="px-3 py-2">85%</td>
              <td className="px-3 py-2 text-gray-400">Next</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Order Info
function OrderInfoTab({ orderInfo }) {
  if (!orderInfo || Object.keys(orderInfo).length === 0) {
    return <div className="p-4 text-sm text-gray-400">No order information available.</div>;
  }
  const fields = [
    { label: "Ordering Clinician", value: orderInfo.clinician },
    { label: "Phone", value: orderInfo.clinicianPhone },
    { label: "Department", value: orderInfo.department },
    { label: "Priority", value: orderInfo.priority },
    { label: "Collection Date/Time", value: orderInfo.collectionDate },
    { label: "Received Date/Time", value: orderInfo.receivedDate },
    { label: "Fasting Status", value: orderInfo.fastingStatus },
    { label: "Clinical History", value: orderInfo.clinicalHistory },
    { label: "Diagnosis", value: orderInfo.diagnosis },
  ].filter(f => f.value);

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">
        {fields.map(f => (
          <div key={f.label} className={f.label === "Clinical History" || f.label === "Diagnosis" ? "col-span-3 sm:col-span-1" : ""}>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{f.label}</div>
            <div className="text-sm text-gray-800">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Attachments
function AttachmentsTab({ result }) {
  const [attachments] = useState(result.attachments);
  return (
    <div className="p-4 space-y-2">
      {attachments.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded p-8 text-center text-sm text-gray-400">
          <Paperclip className="w-5 h-5 mx-auto mb-1" />
          No attachments. <button className="text-blue-700 underline">Upload file</button>
        </div>
      ) : attachments.map(att => (
        <div key={att.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 text-sm">
          <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{att.name}</div>
            <div className="text-xs text-gray-400">{att.size} · {att.uploadedBy} · {att.uploadedAt}</div>
          </div>
          {att.source === "order" && <Tag color="purple">Order Entry</Tag>}
          <button className="p-1.5 hover:bg-gray-100 rounded" title="Download"><Download className="w-4 h-4 text-gray-500" /></button>
          {att.source !== "order" && (
            <button className="p-1.5 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
          )}
        </div>
      ))}
      {attachments.length > 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded p-4 text-center text-xs text-gray-400">
          <Plus className="w-4 h-4 mx-auto mb-0.5" />
          Drag & drop or <button className="text-blue-700 underline">browse</button>
        </div>
      )}
    </div>
  );
}

// QA/QC
function QAQCTab({ result }) {
  const qc = result.qcData;
  return (
    <div className="p-4 space-y-4">
      {/* Overall status */}
      <div className={`flex items-center gap-3 p-3 border rounded ${
        qc.overall === "pass" ? "bg-green-50 border-green-200" :
        qc.overall === "fail" ? "bg-red-50 border-red-200" :
        qc.overall === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
      }`}>
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${QC_DOT[qc.overall] || QC_DOT.none}`} />
        <span className="text-sm font-semibold capitalize">{qc.overall === "none" ? "No QC Data" : `QC ${qc.overall.charAt(0).toUpperCase() + qc.overall.slice(1)}`}</span>
        <span className="text-xs text-gray-500 ml-auto">Analyzer: {qc.analyzerStatus} · Last calibrated: {qc.lastCalibrated}</span>
      </div>

      {/* Control results */}
      {qc.controls.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Control Results
          </div>
          {qc.controls.map((ctrl, i) => (
            <div key={i} className={`flex items-center gap-4 px-3 py-2 text-sm ${i < qc.controls.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className={`w-2 h-2 rounded-full ${ctrl.status === "pass" ? "bg-green-500" : ctrl.status === "warning" ? "bg-yellow-400" : "bg-red-500"}`} />
              <span className="font-medium w-20">{ctrl.level}</span>
              <span className="font-mono">{ctrl.value}</span>
              <span className="text-gray-400 text-xs">Expected: {ctrl.expected}</span>
              <span className={`ml-auto text-xs font-semibold ${ctrl.status === "pass" ? "text-green-700" : "text-red-700"}`}>
                {ctrl.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {qc.overall === "none" && (
        <p className="text-sm text-gray-400">No QC data available for this test and analyzer combination.</p>
      )}
    </div>
  );
}

// History
function HistoryTab({ result }) {
  return (
    <div className="p-4 space-y-3">
      {result.deltaCheck && (
        <div className="flex gap-2 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-yellow-800">Delta Check Alert: </span>
            <span className="text-gray-700">
              Changed <strong>{result.deltaCheck.change}</strong> from previous
              ({result.deltaCheck.previous} → {result.deltaCheck.current} {result.unit}).
              Threshold: {result.deltaCheck.threshold}
            </span>
          </div>
        </div>
      )}

      {result.previousResults.length === 0 ? (
        <p className="text-sm text-gray-400">No previous results on record for this patient and test.</p>
      ) : (
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Previous Results — {result.testName}
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-6 px-4 py-2 bg-blue-50 text-sm font-semibold">
              <span className="w-28 text-gray-400 font-normal text-xs">Today</span>
              <span className="font-mono w-24">{result.result || "—"} {result.unit}</span>
              <Tag color="blue">Current</Tag>
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
                  {result.deltaCheck && i === 0 && <span className="ml-2"><Tag color="red">⚠ Δ Exceeded</Tag></span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Referral
function ReferralTab({ result }) {
  const [referred, setReferred] = useState(!!result.referral);
  const [reason, setReason] = useState("");
  const [institute, setInstitute] = useState("");
  const [testName, setTestName] = useState(result.testName);
  const [sentDate, setSentDate] = useState("");

  return (
    <div className="p-4 space-y-4">
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input type="checkbox" checked={referred} onChange={e => setReferred(e.target.checked)} className="w-4 h-4" />
        Refer this test to an external laboratory
      </label>

      {!referred && (
        <p className="text-xs text-gray-400">Check the box above to enable referral fields.</p>
      )}

      {referred && (
        <div className="space-y-3 border border-gray-200 rounded p-3 bg-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 pb-2">
            Referral Details
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Referral Reason <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 text-sm p-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={reason} onChange={e => setReason(e.target.value)}>
                <option value="">Select reason…</option>
                <option>Capacity — send-out test</option>
                <option>Equipment malfunction</option>
                <option>Specialist confirmation required</option>
                <option>Patient request</option>
                <option>Regulatory requirement</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Institute <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 text-sm p-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={institute} onChange={e => setInstitute(e.target.value)}>
                <option value="">Select institution…</option>
                <option>National Reference Laboratory</option>
                <option>University Hospital Lab</option>
                <option>Regional Reference Center</option>
                <option>WHO Collaborating Center</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Test to Perform</label>
              <input type="text" className="w-full border border-gray-300 text-sm p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={testName} onChange={e => setTestName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sent Date</label>
              <input type="date" className="w-full border border-gray-300 text-sm p-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={sentDate} onChange={e => setSentDate(e.target.value)} />
            </div>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-sm font-medium hover:bg-blue-800">
            <Send className="w-4 h-4" />
            Save Referral
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded Panel (full)
// ---------------------------------------------------------------------------
const PANEL_TABS = [
  { key: "method",  label: "Method/Reagents", Icon: FlaskConical },
  { key: "order",   label: "Order Info",       Icon: ClipboardList },
  { key: "attach",  label: "Attachments",      Icon: Paperclip },
  { key: "qaqc",    label: "QA/QC",            Icon: Shield },
  { key: "history", label: "History",          Icon: History },
  { key: "referral",label: "Referral",         Icon: Send },
];

function ExpandedPanel({ result, onSave, onNceSubmit }) {
  const [activeTab, setActiveTab]           = useState("method");
  const [resultValue, setResultValue]       = useState(result.result);
  const [showNceForm, setShowNceForm]       = useState(false);
  const [criticalAcknowledged, setCriticalAcknowledged] = useState(false);

  // Modification workflow
  const isModification   = result.status === "awaiting-validation" || result.status === "released";
  const isReleasedResult = result.status === "released";
  const [modifyConfirmed,    setModifyConfirmed]    = useState(!isReleasedResult);
  const [modificationNote,   setModificationNote]   = useState("");

  // Derived range state — recalculates live as tech types
  const resultState  = evaluateResult(resultValue, result.rangeBounds);
  const isCritical   = resultState === "critical";
  const isInvalid    = resultState === "invalid";
  const criticalMsg  = getCriticalMsg(resultValue, result.rangeBounds);
  const hasValue     = resultValue.trim() !== "";
  const isDirty      = resultValue !== result.result; // value changed from last-saved state
  const noteRequired = isModification && modifyConfirmed;
  const canSave      = hasValue
    && (!isCritical || criticalAcknowledged)
    && (!isReleasedResult || modifyConfirmed)
    && (!noteRequired || modificationNote.trim() !== "");

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
      {/* Patient banner — full name visible here */}
      <PatientBanner patient={result.patient} orderInfo={result.orderInfo} />

      {/* ── Released result warning — must confirm before modification is allowed ── */}
      {isReleasedResult && !modifyConfirmed && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-b-2 border-amber-500">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-900 text-sm">Result Has Been Validated and Released</div>
            <div className="text-xs text-amber-800 mt-0.5">
              This result has already been accepted by a validator and may have been reported to the clinician.
              Modifying it will create an audit event and return it to the Validation queue for re-approval.
              A reason for the modification will be required.
            </div>
          </div>
          <button onClick={() => setModifyConfirmed(true)}
            className="px-3 py-2 bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 flex-shrink-0 whitespace-nowrap rounded-sm">
            I understand — proceed
          </button>
        </div>
      )}
      {isReleasedResult && modifyConfirmed && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          <Pencil className="w-3 h-3" />
          Modifying a validated result — changes will require re-validation.
        </div>
      )}
      {/* ── Awaiting-validation modification notice (not yet released) ── */}
      {result.status === "awaiting-validation" && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 border-b border-blue-200 text-xs text-blue-700">
          <Pencil className="w-3 h-3" />
          This result is queued for validation. Modifying it requires a reason note — changes will remain in the Validation queue.
        </div>
      )}

      {/* Delta check alert */}
      {result.deltaCheck && (
        <div className="flex gap-2 px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-yellow-800">Delta Check Alert: </span>
            <span className="text-gray-700">
              {result.testName} changed <strong>{result.deltaCheck.change}</strong> from previous
              ({result.deltaCheck.previous} → {result.deltaCheck.current} {result.unit}).
              Threshold: {result.deltaCheck.threshold}
            </span>
          </div>
        </div>
      )}

      {/* ── Always-visible sections ── */}
      <NotesSection result={result} />
      <InterpretationSection result={result} />
      <ProgramBanner program={result.program} />

      {/* ── Result entry action bar ── */}
      <div className="flex flex-wrap items-end gap-4 px-4 py-3 bg-white border-b border-gray-200">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Result Value</div>
          <div className="flex items-baseline gap-2">
            <input type="text" value={resultValue} onChange={e => handleResultChange(e.target.value)}
              placeholder="—"
              className={`w-28 border-b-2 focus:outline-none text-sm font-mono py-1 ${RANGE_INPUT_BORDER[resultState] || "border-gray-400"} ${resultState === "invalid" ? "bg-red-50 text-red-900" : resultState === "critical" ? "bg-orange-50 text-orange-900" : resultState === "abnormal" ? "bg-yellow-50 text-yellow-900" : "bg-transparent"}`}
            />
            <span className="text-xs text-gray-500">{result.unit}</span>
            {/* Live range tier badge */}
            {resultState === "abnormal" && <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">Abnormal</span>}
            {resultState === "critical" && <span className="text-xs font-semibold text-orange-900 bg-orange-100 px-1.5 py-0.5 rounded">Critical</span>}
            {resultState === "invalid"  && <span className="text-xs font-semibold text-red-100 bg-red-800 px-1.5 py-0.5 rounded">Invalid</span>}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Ref: <span className="font-mono text-gray-800">{result.normalRange} {result.unit}</span>
          {result.rangeBounds?.critical && (
            <span className="ml-2 text-orange-600">Critical: &lt;{result.rangeBounds.critical.low} or &gt;{result.rangeBounds.critical.high}</span>
          )}
        </div>

        <div className="flex gap-2 ml-auto flex-wrap items-center">
          {/* Report NCE */}
          {!showNceForm && (
            <button onClick={() => setShowNceForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-400 text-amber-700 text-xs font-medium hover:bg-amber-50">
              <AlertTriangle className="w-3.5 h-3.5" />
              Report Non-Conformity
            </button>
          )}

          {/* Save / Modify — label and availability depend on status and state */}
          <button
            onClick={() => canSave && onSave(result.id, resultValue, modificationNote)}
            disabled={!canSave}
            title={
              !hasValue                                  ? "Enter a result value to save"
              : isReleasedResult && !modifyConfirmed     ? "Confirm the modification warning above before saving"
              : noteRequired && !modificationNote.trim() ? "A reason for modification is required"
              : isCritical && !criticalAcknowledged      ? "Acknowledge the critical value before saving"
              : ""
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              canSave
                ? isModification
                  ? "bg-blue-700 text-white hover:bg-blue-800"
                  : "bg-blue-700 text-white hover:bg-blue-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}>
            {isModification && !isDirty ? <Pencil className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {isModification && !isDirty ? "Modify Result" : "Save Result"}
          </button>
        </div>
      </div>

      {/* ── Modification note — required when editing a previously saved result ── */}
      {noteRequired && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Reason for modification <span className="text-red-500">*</span>
            <span className="font-normal text-gray-400 ml-1">(required — will be added to the audit trail)</span>
          </label>
          <textarea
            rows={2}
            value={modificationNote}
            onChange={e => setModificationNote(e.target.value)}
            placeholder="Describe why this result is being modified…"
            className="w-full border border-gray-300 text-xs p-2 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
          />
        </div>
      )}

      {/* ── Invalid range warning — outside physiological limits ── */}
      {isInvalid && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-900 border-b border-red-700">
          <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-red-100 text-xs">
            <span className="font-semibold text-red-50">Result outside valid range — </span>
            {resultValue} {result.unit} is outside the physiologically valid range of{" "}
            {result.rangeBounds.valid.low}–{result.rangeBounds.valid.high} {result.unit}.{" "}
            Verify the result and repeat analysis if necessary. Do not report until confirmed.
          </div>
        </div>
      )}

      {/* ── Critical value acknowledgment banner ── */}
      {isCritical && !criticalAcknowledged && (
        <div className="flex items-start gap-3 px-4 py-3 bg-orange-50 border-b-2 border-orange-500">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-orange-900 text-sm">Critical Value — Physician Notification Required</div>
            <div className="text-xs text-orange-800 mt-0.5">
              {criticalMsg}. Per laboratory policy, the responsible clinician must be notified before or upon result reporting.
              Acknowledge below to confirm notification has been or will be made before saving.
            </div>
          </div>
          <button onClick={() => setCriticalAcknowledged(true)}
            className="px-3 py-2 bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 flex-shrink-0 whitespace-nowrap rounded-sm">
            I Acknowledge
          </button>
        </div>
      )}
      {isCritical && criticalAcknowledged && (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-b border-orange-200 text-xs text-orange-700">
          <Check className="w-3.5 h-3.5 text-orange-600" />
          Critical value acknowledged — clinician notification confirmed. You may now save.
        </div>
      )}

      {/* NCE inline form — appears below action bar */}
      {showNceForm && (
        <ReportNceForm result={result} onSubmit={handleNceSubmit} onCancel={() => setShowNceForm(false)} />
      )}

      {/* ── Tabs ── */}
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
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50">
        {activeTab === "method"  && <MethodTab result={result} />}
        {activeTab === "order"   && <OrderInfoTab orderInfo={result.orderInfo} />}
        {activeTab === "attach"  && <AttachmentsTab result={result} />}
        {activeTab === "qaqc"    && <QAQCTab result={result} />}
        {activeTab === "history" && <HistoryTab result={result} />}
        {activeTab === "referral"&& <ReferralTab result={result} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function ToastBanner({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-start gap-3 p-3 shadow-lg border-l-4 text-sm ${
          t.kind === "success" ? "bg-green-50 border-green-500" :
          t.kind === "error"   ? "bg-red-50 border-red-500"    :
          t.kind === "warning" ? "bg-amber-50 border-amber-500" : "bg-blue-50 border-blue-500"
        }`}>
          <span className="flex-1 text-gray-800">{t.message}</span>
          <button onClick={() => onClose(t.id)} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
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
  // Admin config: results.entry.showPatientName (default: false)
  const [showPatientNames, setShowPatientNames] = useState(false);

  const addToast = (message, kind = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleSave = (resultId, value, modificationNote) => {
    if (!value?.trim()) {
      addToast("Result value is required before saving.", "error");
      return;
    }
    const prevResult = results.find(r => r.id === resultId);
    const isModification = prevResult?.status === "awaiting-validation" || prevResult?.status === "released";
    setResults(prev => prev.map(r => {
      if (r.id !== resultId) return r;
      const updatedNotes = modificationNote?.trim()
        ? [...(r.notes || []), {
            id: Date.now(),
            date: new Date().toLocaleString(),
            author: "Current User",
            type: "internal",
            body: `[Modification reason] ${modificationNote.trim()}`,
          }]
        : r.notes;
      return { ...r, result: value, status: "awaiting-validation", notes: updatedNotes };
    }));
    setExpandedId(null);
    addToast(
      isModification
        ? "Result modified and returned to Validation queue."
        : "Result saved and queued for validation.",
      "success"
    );
  };

  const handleNceSubmit = (resultId, nceData) => {
    setResults(prev => prev.map(r =>
      r.id === resultId ? {
        ...r,
        status: "cancelled",
        // Store filed NCE so the flag badge is visible in the table
        nce: {
          number:      nceData.nceNumber,
          status:      "open",
          category:    nceData.category,
          subcategory: nceData.subcategory,
          severity:    nceData.severity,
        },
      } : r
    ));
    setExpandedId(null);
    addToast(
      `NCE ${nceData.nceNumber} created. Result marked as Cancelled. Open NCE module to complete investigation.`,
      "warning"
    );
  };

  const filtered = results.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || r.testName.toLowerCase().includes(q) ||
      r.labNumber.toLowerCase().includes(q) || r.patient.id.includes(q);
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const TABLE_HEADERS = ["Lab Number / Patient", "Test Name", "Sample", "Ref. Range", "Result", "Flags", "QC", "Status", "Actions"];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-sm">
      <ToastBanner toasts={toasts} onClose={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Preview banner + admin config simulation */}
      <div className="bg-blue-50 border-b-2 border-blue-600 px-4 py-2 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-blue-700 font-semibold">🎨 Preview v3</span>
        <span className="text-gray-500">— Results Entry · Carbon Design System · OpenELIS Global</span>
        <span className="ml-auto flex items-center gap-3">
          {/* Simulated admin config toggle */}
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Admin Config:</span>
            <span className="text-gray-700">Show patient name in results list</span>
            <button
              onClick={() => setShowPatientNames(v => !v)}
              className={`relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                showPatientNames ? "bg-blue-600" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={showPatientNames}
              title="Toggle: Admin › General Config › Results Entry › Show Patient Name"
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                showPatientNames ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
            <span className={`font-medium ${showPatientNames ? "text-blue-700" : "text-gray-400"}`}>
              {showPatientNames ? "On" : "Off"}
            </span>
          </span>
          <span className="text-gray-400">Interactive mockup</span>
        </span>
      </div>

      {/* Shell header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-2 text-sm">
        <span className="text-blue-400 font-bold">OpenELIS Global</span>
        <span className="text-gray-500">›</span>
        <span>Results</span>
        <span className="text-gray-500">›</span>
        <span>Results Entry</span>
      </div>

      {/* Page heading */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-2xl font-light text-gray-900">Results Entry</h1>
        <p className="text-gray-500 text-xs mt-0.5">Enter and manage test results for pending laboratory orders</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-52 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text"
              className="w-full pl-8 pr-3 py-2 border border-gray-400 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder="Search or scan barcode — lab number, patient ID, test name…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="min-w-44">
            <div className="text-xs text-gray-500 mb-1">Lab Unit <span className="text-red-500">*</span></div>
            <select className="w-full border border-gray-400 bg-gray-50 text-sm py-2 px-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={labUnit} onChange={e => setLabUnit(e.target.value)}>
              {LAB_UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {["Date From", "Date To"].map(lbl => (
            <div key={lbl} className="min-w-36">
              <div className="text-xs text-gray-500 mb-1">{lbl}</div>
              <input type="date" defaultValue="2025-12-18"
                className="w-full border border-gray-400 bg-gray-50 text-sm py-2 px-2 focus:outline-none focus:ring-1 focus:ring-blue-600" />
            </div>
          ))}

          <button className="px-4 py-2 bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 whitespace-nowrap">
            Load Results
          </button>
        </div>
      </div>

      {/* Status filter bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 font-medium mr-1">Show:</span>
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
              {s === "All" ? "All" : STATUS_CONFIG[s]?.label || s} ({count})
            </button>
          );
        })}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="mx-4 mt-4 bg-white border border-gray-200 shadow-sm">
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={TABLE_HEADERS.length + 1} className="text-center py-12 text-gray-400 text-sm">
                  {searchQuery ? "No results match your search." : "Select a lab unit and date range, then click Load Results."}
                </td>
              </tr>
            )}

            {filtered.map(result => {
              const isExpanded = expandedId === result.id;
              const isCancelled = result.status === "cancelled";

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
                          aria-label={isExpanded ? "Collapse" : "Expand"}>
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-blue-700" />
                            : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </button>
                      )}
                    </td>

                    {/* Lab Number / Patient */}
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs text-gray-700">{result.labNumber}</div>
                      {showPatientNames ? (
                        /* Admin config ON: show full patient name */
                        <div className="text-xs font-medium text-gray-800 mt-0.5">{result.patient.name}</div>
                      ) : (
                        /* Admin config OFF (default): privacy-safe — ID + sex + calculated age */
                        <div className="text-xs text-gray-500 mt-0.5">
                          ID {result.patient.id} · {result.patient.sex} · {calcAge(result.patient.dob)}
                        </div>
                      )}
                      {result.program && (
                        <div className="mt-1"><Tag color="purple">{result.program.name}</Tag></div>
                      )}
                    </td>

                    {/* Test Name */}
                    <td className="px-3 py-3 max-w-48">
                      <div className={`font-medium ${isCancelled ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {result.testName}
                      </div>
                      {result.analyzer && (
                        <div className="text-xs text-gray-400 mt-0.5">🔬 {result.analyzer}</div>
                      )}
                    </td>

                    {/* Sample */}
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">{result.sampleType}</td>

                    {/* Ref Range */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-700">{result.normalRange}</span>
                      <span className="text-xs text-gray-400 ml-1">{result.unit}</span>
                    </td>

                    {/* Result — colored by range tier */}
                    {(() => {
                      const rs = evaluateResult(result.result, result.rangeBounds);
                      return (
                        <td className={`px-3 py-3 ${RANGE_CELL_BG[rs] || ""}`}>
                          {isCancelled ? (
                            <span className="text-xs text-gray-400 line-through">{result.result || "—"}</span>
                          ) : (
                            <input type="text" value={result.result} placeholder="—"
                              onChange={e => setResults(prev => prev.map(r =>
                                r.id === result.id ? { ...r, result: e.target.value } : r
                              ))}
                              className={`w-20 border-b-2 focus:outline-none text-xs font-mono py-0.5 bg-transparent ${RANGE_INPUT_BORDER[rs] || "border-gray-300"} ${RANGE_CELL_TEXT[rs] || "text-gray-700"}`}
                            />
                          )}
                        </td>
                      );
                    })()}

                    {/* Flags — H/L/Δ + range tier badges (C=critical, !=invalid) + NCE badge */}
                    {(() => {
                      const rs = evaluateResult(result.result, result.rangeBounds);
                      const hasNce = !!result.nce;
                      const hasAnyFlag = result.flags.length > 0 || rs === "critical" || rs === "invalid" || hasNce;
                      const nceColor = result.nce?.status === "closed"
                        ? "bg-gray-100 text-gray-600 border-gray-300"
                        : "bg-teal-50 text-teal-800 border-teal-400";
                      return (
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex gap-1 items-center flex-wrap">
                            {result.flags.includes("above-normal") && <span className="text-red-600 font-bold text-xs" title="Above normal range">H</span>}
                            {result.flags.includes("below-normal") && <span className="text-blue-600 font-bold text-xs" title="Below normal range">L</span>}
                            {result.flags.includes("delta-check") && <span className="text-amber-600 font-bold text-xs" title="Delta check threshold exceeded">Δ</span>}
                            {rs === "critical" && (
                              <span className={`px-1 py-0.5 rounded text-xs font-bold ${RANGE_FLAG_BADGE.critical}`} title="Critical/panic value — acknowledgment required">C</span>
                            )}
                            {rs === "invalid" && (
                              <span className={`px-1 py-0.5 rounded text-xs font-bold ${RANGE_FLAG_BADGE.invalid}`} title="Outside physiologically valid range">!</span>
                            )}
                            {hasNce && (
                              <span
                                className={`px-1.5 py-0.5 rounded border text-xs font-semibold tracking-wide ${nceColor}`}
                                title={`NCE ${result.nce.number} · ${result.nce.category} / ${result.nce.subcategory} · ${result.nce.severity} · ${result.nce.status}`}
                              >
                                NCE
                              </span>
                            )}
                            {!hasAnyFlag && <span className="text-gray-300 text-xs">—</span>}
                          </div>
                        </td>
                      );
                    })()}

                    {/* QC */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${QC_DOT[result.qcStatus] || QC_DOT.none}`} aria-hidden="true" />
                        <span className="text-xs text-gray-500 capitalize">{result.qcStatus === "none" ? "—" : result.qcStatus}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3"><StatusTag status={result.status} /></td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      {!isCancelled && result.result.trim() !== "" && (() => {
                        const isModification = result.status === "awaiting-validation" || result.status === "released";
                        const isReleased     = result.status === "released";
                        if (isModification) {
                          // Open expanded panel for the full modification workflow (note + optional confirmation)
                          return (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : result.id)}
                              className={`flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap border font-medium ${
                                isReleased
                                  ? "border-amber-500 text-amber-700 hover:bg-amber-50"
                                  : "border-blue-600 text-blue-700 hover:bg-blue-50"
                              }`}
                              title={isReleased ? "Result has been validated — click to modify" : "Modify this saved result"}>
                              <Pencil className="w-3 h-3" />
                              Modify Result
                            </button>
                          );
                        }
                        // First save — quick inline action
                        return (
                          <button onClick={() => handleSave(result.id, result.result)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-700 text-white hover:bg-blue-800 whitespace-nowrap"
                            title="Save result — sends to Validation queue">
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                        );
                      })()}
                      {isCancelled && result.nce && (
                        <span
                          className="px-1.5 py-0.5 rounded border text-xs font-semibold tracking-wide bg-teal-50 text-teal-800 border-teal-400"
                          title={`${result.nce.number} · ${result.nce.category} / ${result.nce.subcategory} · ${result.nce.severity}`}
                        >
                          NCE
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded panel */}
                  {isExpanded && !isCancelled && (
                    <tr key={`${result.id}-exp`} className="bg-gray-50">
                      <td colSpan={TABLE_HEADERS.length + 1} className="p-0">
                        <ExpandedPanel result={result} onSave={handleSave} onNceSubmit={handleNceSubmit} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white text-xs text-gray-500">
          <div className="flex items-center gap-2">
            Items per page:
            <select className="border border-gray-300 bg-gray-50 py-1 px-1 text-xs">
              <option>10</option><option>25</option><option>50</option>
            </select>
          </div>
          <span>1–{filtered.length} of {filtered.length}</span>
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
