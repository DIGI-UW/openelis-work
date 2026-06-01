/**
 * Validation Page — Interactive Preview v3
 * OpenELIS Global · Parallel to Results Entry v3 architecture
 * Route: /Validation (replaces /RoutineValidation, /TechnicalValidation, /SupervisorValidation)
 * SideNav: Validation
 *
 * ─────────────────────────────────────────────────────────────────────────
 *   IMPORTANT — IMPLEMENTATION NOTE
 *   This mockup uses Tailwind utility classes + raw HTML elements
 *   (<select>, <input>, <table>, <button>) for portable rendering
 *   in the gallery preview. Production implementation MUST use
 *   @carbon/react components per the §Carbon Component Map section
 *   of validation-page-v3-frs.md. Patterns the Tailwind mockup does
 *   NOT demonstrate but MUST be used in production:
 *     - Carbon Tabs / Tab / TabList / TabPanels / TabPanel
 *     - Carbon Modal / ComposedModal (for E-Sig)
 *     - Carbon ToastNotification / ActionableNotification
 *     - Carbon Accordion + AccordionItem (for collapsible sections)
 *     - Carbon DataTable + TableExpandRow + TableExpandedRow + TableSelectRow
 *     - Carbon Select / Dropdown / MultiSelect / TextArea
 * ─────────────────────────────────────────────────────────────────────────
 *
 * v3 changes vs v2.1:
 *   - Action bar at top of expanded panel (Usability H1 parity with Results Entry)
 *   - Smart default-open per section (Usability H2)
 *   - 6-tab layout → inline sections + 2 tabs (QA/QC, History)
 *   - Modification History banner at top of expanded panel (CFR Part 11 §11.10(e))
 *   - Critical Notification Display panel (read-only view of tech's GP47 record;
 *     "Log Notification Now" backfill affordance when missing)
 *   - Storage Location section (read-only)
 *   - Aliquots section (read-only)
 *   - Program Info section (read-only, up to 15 fields)
 *   - Polymorphic Result display — Dictionary (D) and Multi-Checkbox (M) labels resolved
 *   - Demographic-Aware Range Tag (CLSI EP28-A3c parity)
 *   - E-Signature modal on Release (Part 11)
 *   - Stale-page conflict guard
 *   - Patient avatar + copy-accession + nonconforming legend strip
 *   - PII visibility precedence (site-wide > role-based; matches Results Entry BR-026)
 *   - Workplan deep-link breadcrumb
 *   - Server-side pagination indicator (top)
 *
 * v3 preserves from v2.1 (OGC-343 scope):
 *   - Multi-level validation pipeline (0–5 levels)
 *   - Admin Validation Configuration page (rendered as stub here; full impl in v2.1 file)
 *   - Auto-validation
 *   - Per-lab-unit overrides
 *   - Role-based queue filtering
 *   - Validation progress timeline (now inside an inline section)
 */

import React, { useState, useMemo, Fragment } from "react";
import {
  Search, Filter, Shield, ShieldCheck, ShieldAlert, Check, CheckCircle2, XCircle,
  AlertTriangle, AlertCircle, TrendingUp, TrendingDown, RotateCcw, Clock, User,
  Settings, Plus, Minus, Info, Eye, EyeOff, Lock, X, Bot, FileText, Beaker, History,
  Activity, Layers, ArrowRight, ChevronDown, ChevronRight, ChevronUp, Pencil,
  CircleDot, Circle, CheckCircle, Building2, FlaskConical, Microscope, Thermometer,
  Droplets, Zap, KeyRound, MapPin, BookOpen, Copy, Bell, Send, MessageSquare,
  Paperclip, ClipboardList
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// i18n stub
// ─────────────────────────────────────────────────────────────────────────
const t = (key, fallback, ...args) => {
  let text = fallback || key;
  args.forEach((arg, i) => { text = text.replace(`{${i}}`, arg); });
  return text;
};

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────
function evaluateResult(value, rangeBounds) {
  const num = parseFloat(value);
  if (value === "" || value == null || isNaN(num) || !rangeBounds) return "normal";
  const { normal, critical, valid } = rangeBounds;
  if (valid    && (num < valid.low    || num > valid.high))    return "invalid";
  if (critical && (num < critical.low || num > critical.high)) return "critical";
  if (normal   && (num < normal.low   || num > normal.high))   return "abnormal";
  return "normal";
}

function colorHash(str, palette) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

const AVATAR_PALETTE = ["#0f62fe", "#8a3ffc", "#198038", "#ff832b", "#d12771", "#005d5d"];

// ─────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────
const COLOR = {
  green:  { bg:"bg-green-100",  text:"text-green-800",  border:"border-green-400" },
  red:    { bg:"bg-red-100",    text:"text-red-800",    border:"border-red-400" },
  blue:   { bg:"bg-blue-100",   text:"text-blue-800",   border:"border-blue-400" },
  purple: { bg:"bg-purple-100", text:"text-purple-800", border:"border-purple-400" },
  teal:   { bg:"bg-teal-100",   text:"text-teal-800",   border:"border-teal-400" },
  amber:  { bg:"bg-amber-100",  text:"text-amber-800",  border:"border-amber-400" },
  gray:   { bg:"bg-gray-200",   text:"text-gray-700",   border:"border-gray-400" },
  "warm-gray": { bg:"bg-stone-200", text:"text-stone-700", border:"border-stone-400" },
  magenta:{ bg:"bg-fuchsia-100",text:"text-fuchsia-800",border:"border-fuchsia-400" },
};

const RANGE_INPUT_BORDER = { normal:"border-gray-300", abnormal:"border-yellow-500", critical:"border-orange-500", invalid:"border-red-800" };
const RANGE_CELL_BG = { normal:"", abnormal:"bg-yellow-50", critical:"bg-orange-50", invalid:"bg-red-950" };
const RANGE_CELL_TEXT = { normal:"text-gray-700", abnormal:"text-yellow-900", critical:"text-orange-900", invalid:"text-red-100" };
const RANGE_FLAG_BADGE = { abnormal:"bg-yellow-100 text-yellow-800", critical:"bg-orange-100 text-orange-900", invalid:"bg-red-900 text-red-100" };

// ─────────────────────────────────────────────────────────────────────────
// Mock data — mixed result types + critical notification record + modification history + aliquots + program info + storage
// ─────────────────────────────────────────────────────────────────────────
// Each lab unit carries a domain attribute (CLINICAL / ENVIRONMENTAL / VECTOR).
// Lab Unit selection drives currentDomain — no per-result domain branching needed.
const LAB_UNITS = [
  { id: "lu-hem",   name: "Hematology",          icon: Droplets,     domain: "CLINICAL" },
  { id: "lu-chem",  name: "Chemistry",           icon: FlaskConical, domain: "CLINICAL" },
  { id: "lu-micro", name: "Microbiology",        icon: Microscope,   domain: "CLINICAL" },
  { id: "lu-sero",  name: "Serology",            icon: Beaker,       domain: "CLINICAL" },
  { id: "lu-wq",    name: "Water Quality",       icon: Droplets,     domain: "ENVIRONMENTAL" },
  { id: "lu-vec",   name: "Vector Surveillance", icon: Microscope,   domain: "VECTOR" },
];

const DOMAIN_BADGE = {
  CLINICAL:      { label: "Clinical",      kind: "blue" },
  ENVIRONMENTAL: { label: "Environmental", kind: "green" },
  VECTOR:        { label: "Vector",        kind: "purple" },
};

const MOCK_RESULTS = [
  // R1 — routine normal result, multi-level (Hematology requires 2)
  {
    id: "r1", labNumber: "DEV01260000001234", sequenceNumber: "017-1",
    patient: { name: "Test, Patient A", id: "3456789", dob: "01/11/2012", sex: "M", age: "14y" },
    test: "WBC", testCode: "LOINC 6690-2", sampleType: "Whole Blood", analyzer: "Sysmex XN-L",
    rangeText: "4.00-10.00", unit: "x10⁹/L", selectedRangeLabel: "Pediatric Male (10–17y)",
    result: "7.5", currentResult: "", resultType: "N",
    rangeBounds: { normal: { low:4.0, high:10.0 }, critical: { low:2.0, high:30.0 }, valid: { low:0.1, high:100.0 } },
    isNormal: true, flags: [], nonconforming: false,
    enteredBy: "J. Smith", enteredAt: "10:30 02/26/2026", labUnit: "Hematology", qcStatus: "pass",
    validationLevelsRequired: 2, validationLevelCurrent: 1, validationHistory: [],
    notes: [], pastNotesLegacy: "",
    interpretation: null, modificationHistory: [],
    nce: null, program: null, storage: { path: null, coords: null, condition: null },
    aliquots: [], programFields: null,
    orderInfo: { clinician: "Dr. Chen", clinicianPhone: "+1 555-0111", department: "Pediatrics",
                 orderDate: "02/26/2026", priority: "Routine",
                 collectionDate: "02/26/2026 09:00", receivedDate: "02/26/2026 09:45",
                 clinicalNotes: "Annual physical, mild fatigue" },
    method: { id: "AUTO", label: "Automated", reagentLot: "LOT-2026-A45", reagentExpiry: "08/2026" },
    attachments: [], referral: null,
  },
  // R2 — critical glucose, single-level Chem, modified result, with full GP47 notification record
  {
    id: "r2", labNumber: "DEV01260000001235", sequenceNumber: "022-1",
    patient: { name: "Smith, Jane", id: "7891234", dob: "03/22/1985", sex: "F", age: "41y", nationalId: "TZ-100487291" },
    test: "Glucose, Fasting", testCode: "LOINC 1558-6", sampleType: "Serum", analyzer: "Cobas c 501",
    rangeText: "70-99", unit: "mg/dL", selectedRangeLabel: "Adult Female (18–65y)",
    result: "442", currentResult: "98", resultType: "N",
    rangeBounds: { normal: { low:70, high:99 }, critical: { low:50, high:400 }, valid: { low:20, high:600 } },
    isNormal: false, flags: ["above-normal","delta-check"], nonconforming: false,
    enteredBy: "M. Jones", enteredAt: "11:18 02/26/2026", labUnit: "Chemistry", qcStatus: "pass",
    validationLevelsRequired: 1, validationLevelCurrent: 1, validationHistory: [],
    notes: [
      { id: 1, date: "02/26/2026 11:20", author: "M. Jones", type: "internal",
        body: "Fasting glucose confirmed — patient fasted >8 hrs." },
      { id: 2, date: "02/26/2026 11:30", author: "M. Jones", type: "internal",
        body: "[Modification reason] Initial entry was 152, retested and rechecked — printout shows 442. Critical hyperglycemia." },
    ],
    pastNotesLegacy: "",
    interpretation: { code: "GLU-CRIT", label: "Critical Hyperglycemia",
      text: "Glucose >400 mg/dL is critically elevated. Immediate physician notification required. Consider DKA workup." },
    modificationHistory: [
      { id: 1, fromValue: "152", toValue: "442", modifiedBy: "M. Jones", modifiedAt: "02/26/2026 11:30",
        reason: "Initial entry was 152, retested and rechecked — printout shows 442. Critical hyperglycemia." },
    ],
    nce: null,
    program: { name: "EQA Round 4", priority: "URGENT", dueDate: "12/20/2025" },
    storage: { path: "Refrigerator B → Shelf 1 → Box 12", coords: "Pos A-09", condition: "2–8 °C" },
    aliquots: [
      { id: "DEV01260000001235-022.1", purpose: "Test", linkedTest: "HbA1c", status: "Created",
        createdAt: "02/26/2026 11:32", createdBy: "M. Jones", storage: "—" },
      { id: "DEV01260000001235-022.2", purpose: "Retention", linkedTest: null, status: "In-Storage",
        createdAt: "02/26/2026 11:33", createdBy: "M. Jones",
        storage: "Freezer A → Rack 3 → Shelf 1 → Box 4 (Pos C-02)" },
    ],
    programFields: [
      { label: "EQA Panel ID", value: "EQA-CHEM-2025-Q4-PANEL-07", type: "text" },
      { label: "Round Number", value: "4", type: "text" },
      { label: "Specimen Code", value: "S-2025-Q4-022", type: "text" },
      { label: "Expected Analyte", value: "Glucose", type: "text" },
      { label: "Submission Deadline", value: "12/20/2025 23:59", type: "datetime" },
      { label: "Round Coordinator", value: "Dr. F. Andriantefison", type: "text" },
    ],
    orderInfo: { clinician: "Dr. Patel", clinicianPhone: "+1 555-0222", department: "Endocrinology",
                 orderDate: "02/26/2026", priority: "STAT",
                 collectionDate: "02/26/2026 07:00", receivedDate: "02/26/2026 07:30",
                 clinicalNotes: "Suspected T2DM, recent weight loss, polydipsia" },
    method: { id: "AUTO", label: "Automated", reagentLot: "LOT-2026-G12", reagentExpiry: "06/2026" },
    attachments: [{ id: 1, name: "Cobas-printout-022.pdf", size: "124 KB", date: "02/26/2026" }],
    referral: null,
  },
  // R3 — HIV Rapid, dictionary single (D) result type, multi-level
  {
    id: "r3", labNumber: "DEV01260000001236", sequenceNumber: "031-1",
    patient: { name: "Test, Patient C", id: "5678901", dob: "09/15/1963", sex: "M", age: "62y" },
    test: "HIV 1/2 Rapid", testCode: "LOINC 49580-4", sampleType: "Whole Blood", analyzer: "MANUAL",
    rangeText: "—", unit: "", selectedRangeLabel: null,
    result: "HIV_R", currentResult: "", resultType: "D",
    dictionaryOptions: [
      { id: "HIV_NR", label: "Non-Reactive" },
      { id: "HIV_R",  label: "Reactive" },
      { id: "HIV_IND",label: "Indeterminate" },
      { id: "HIV_INV",label: "Invalid" },
    ],
    rangeBounds: null, isNormal: false, flags: [], nonconforming: false,
    enteredBy: "A. Lee", enteredAt: "09:45 02/26/2026", labUnit: "Serology", qcStatus: "pass",
    validationLevelsRequired: 2, validationLevelCurrent: 2,
    validationHistory: [
      { level: 1, validatedBy: "Dr. Williams", validatedAt: "02/26/2026 10:15", role: "Supervisor", action: "VALIDATE" }
    ],
    notes: [
      // BR-V3-016 dual-axis: visibility (internal/external) × context (entry/modification/validation)
      { id: 3, date: "02/26/2026 09:50", author: "A. Lee", context: "entry", visibility: "internal",
        body: "Strong reactive line at 60s. Repeating per SOP." },
      { id: 4, date: "02/26/2026 10:16", author: "Dr. Williams", context: "validation", visibility: "internal",
        body: "Level 1: Confirmed reactive on repeat. Send for confirmatory Western Blot." },
      { id: 5, date: "02/26/2026 10:18", author: "Dr. Williams", context: "validation", visibility: "external",
        body: "Result reactive on screening. Confirmatory testing recommended per HIV testing algorithm." },
    ],
    pastNotesLegacy: "",
    interpretation: { code: "HIV-REACTIVE", label: "Reactive — Send for Confirmation",
      text: "Reactive on screening rapid test. Confirmatory testing (Western Blot or HIV-1/2 differentiation) required per algorithm." },
        modificationHistory: [], nce: null, program: null,
    storage: { path: "Refrigerator A → Shelf 2 → Box 6", coords: "Pos B-12", condition: "2–8 °C" },
    aliquots: [], programFields: null,
    orderInfo: { clinician: "Dr. Adams", department: "Infectious Disease",
                 orderDate: "02/26/2026", priority: "Routine",
                 collectionDate: "02/26/2026 09:00", receivedDate: "02/26/2026 09:30",
                 clinicalNotes: "Pre-employment screening + risk-based test" },
    method: { id: "MAN", label: "Manual", reagentLot: "LOT-2026-HIV-K33", reagentExpiry: "07/2026" },
    attachments: [], referral: null,
  },
  // R4 — Stool O&P, multi-checkbox (M) result type
  {
    id: "r4", labNumber: "DEV01260000001237", sequenceNumber: "045-1",
    patient: { name: "Johnson, Robert", id: "5551234", dob: "08/12/1970", sex: "M", age: "55y" },
    test: "Stool — Microscopy (Ova & Parasites)", testCode: "LOINC 624-7", sampleType: "Stool", analyzer: "MANUAL — Microscopy",
    rangeText: "—", unit: "", selectedRangeLabel: null,
    result: "OVA_GL,OVA_EH", currentResult: "OVA_NEG", resultType: "M",
    dictionaryOptions: [
      { id: "OVA_AL", label: "Ascaris lumbricoides" },
      { id: "OVA_TT", label: "Trichuris trichiura" },
      { id: "OVA_HW", label: "Hookworm" },
      { id: "OVA_GL", label: "Giardia lamblia" },
      { id: "OVA_EH", label: "Entamoeba histolytica" },
      { id: "OVA_SM", label: "Schistosoma mansoni" },
      { id: "OVA_NEG",label: "No parasites seen" },
    ],
    rangeBounds: null, isNormal: false, flags: [], nonconforming: false,
    enteredBy: "K. Brown", enteredAt: "12:10 02/26/2026", labUnit: "Microbiology", qcStatus: "pass",
    validationLevelsRequired: 1, validationLevelCurrent: 1, validationHistory: [],
    notes: [], pastNotesLegacy: "",
    interpretation: null, modificationHistory: [],
    nce: null, program: null,
    storage: { path: "Specimen Cabinet — Stool → Shelf 2", coords: "Pos 14", condition: "RT" },
    aliquots: [], programFields: null,
    orderInfo: { clinician: "Dr. Asha Iyer", department: "Gastroenterology",
                 orderDate: "02/26/2026", priority: "Routine",
                 collectionDate: "02/26/2026 09:00", receivedDate: "02/26/2026 11:00",
                 clinicalNotes: "Recurrent abdominal pain, recent travel to East Africa" },
    method: { id: "MAN", label: "Manual", reagentLot: "—", reagentExpiry: "—" },
    attachments: [], referral: null,
  },
  // R5 — Critical Hgb without notification record (validator backfill scenario)
  {
    id: "r5", labNumber: "DEV01260000001238", sequenceNumber: "052-1",
    patient: { name: "Test, Patient D", id: "1234567", dob: "07/04/1997", sex: "F", age: "28y" },
    test: "Hemoglobin", testCode: "LOINC 718-7", sampleType: "Whole Blood", analyzer: "Sysmex XN-L",
    rangeText: "12.0-16.0", unit: "g/dL", selectedRangeLabel: "Adult Female (18–65y)",
    result: "5.8", currentResult: "14.1", resultType: "N",
    rangeBounds: { normal: { low:12, high:16 }, critical: { low:7, high:20 }, valid: { low:1, high:25 } },
    isNormal: false, flags: ["below-normal","delta-check"], nonconforming: false,
    enteredBy: "A. Lee", enteredAt: "09:45 02/26/2026", labUnit: "Hematology", qcStatus: "pass",
    validationLevelsRequired: 2, validationLevelCurrent: 1, validationHistory: [],
    notes: [
      { id: 5, date: "02/26/2026 09:50", author: "A. Lee", type: "internal",
        body: "Significant drop from previous (14.1 → 5.8). Delta check triggered. Verified with manual recount." },
    ],
    pastNotesLegacy: "",
    interpretation: { code: "HGB-CRIT", label: "Critical Anemia",
      text: "Hgb < 7.0 g/dL is critically low. Immediate physician notification required. Consider transfusion workup." },
    // BR-V3-003: Notification record MISSING — validator must backfill before releasing
        modificationHistory: [],
    nce: null, program: null,
    storage: { path: "Refrigerator B → Shelf 2 → Box 18", coords: "Pos D-04", condition: "2–8 °C" },
    aliquots: [], programFields: null,
    orderInfo: { clinician: "Dr. Adams", department: "Emergency",
                 orderDate: "02/26/2026", priority: "STAT",
                 collectionDate: "02/26/2026 09:00", receivedDate: "02/26/2026 09:30",
                 clinicalNotes: "Post-op day 2, dizziness, hypotensive" },
    method: { id: "AUTO", label: "Automated", reagentLot: "LOT-2026-A45", reagentExpiry: "08/2026" },
    attachments: [], referral: null,
  },
  // R6 — Auto-validated normal
  {
    id: "r6", labNumber: "DEV01260000001239", sequenceNumber: "060-1",
    patient: { name: "Patient F", id: "9999999", dob: "06/10/1985", sex: "F", age: "40y" },
    test: "TSH", testCode: "LOINC 3016-3", sampleType: "Serum", analyzer: "VIDAS",
    rangeText: "0.4-4.0", unit: "mIU/L", selectedRangeLabel: "Adult Female (18–65y)",
    result: "2.1", currentResult: "", resultType: "N",
    rangeBounds: { normal: { low:0.4, high:4.0 }, critical: { low:0.1, high:10 }, valid: { low:0.01, high:100 } },
    isNormal: true, flags: [], nonconforming: false,
    enteredBy: "K. Brown", enteredAt: "08:20 02/26/2026", labUnit: "Chemistry", qcStatus: "pass",
    validationLevelsRequired: 1, validationLevelCurrent: 1, validationHistory: [], isAutoValidated: true,
    notes: [], pastNotesLegacy: "",
    interpretation: null, modificationHistory: [],
    nce: null, program: null, storage: { path: null }, aliquots: [], programFields: null,
    orderInfo: { clinician: "Dr. Liu", priority: "Routine",
                 collectionDate: "02/26/2026 08:00", receivedDate: "02/26/2026 08:15",
                 clinicalNotes: "Thyroid screening" },
    method: { id: "AUTO", label: "Automated", reagentLot: "LOT-2026-V99", reagentExpiry: "09/2026" },
    attachments: [], referral: null,
  },
  // ENVIRONMENTAL demo row — Water Quality lab unit
  // Patient block becomes Site block; no Sex/Age columns; regulatory limit Tag replaces demographic
  {
    id: "ev1", labNumber: "ENV01260000000000004", sequenceNumber: "001-1",
    domain: "ENVIRONMENTAL",
    patient: { name: "Mwanza Water Tap A-14", id: "WQ-2026-091", dob: "—", sex: "—", age: "—" },
    site: { siteName: "Mwanza Water Tap A-14", gps: "−2.5147°S 32.9175°E", source: "Drinking water — chlorinated" },
    test: "E. coli (MPN/100 mL)", testCode: "LOINC 41863-2", sampleType: "Water (drinking)",
    analyzer: "MANUAL — Membrane filtration",
    rangeText: "0 (regulatory)", unit: "MPN/100 mL", selectedRangeLabel: null,
    regulatoryLimit: "WHO/EPA: 0 MPN/100 mL (drinking water)",
    result: "0", currentResult: "", resultType: "N",
    rangeBounds: { normal: { low: 0, high: 0 }, critical: { low: -1, high: 1 }, valid: { low: 0, high: 10000 } },
    isNormal: true, flags: [], nonconforming: false,
    enteredBy: "Field Tech (J. Mukasa)", enteredAt: "08:30 12/18/2025", labUnit: "Water Quality", qcStatus: "pass",
    validationLevelsRequired: 1, validationLevelCurrent: 1, validationHistory: [],
    notes: [], pastNotesLegacy: "",
    interpretation: null, modificationHistory: [],
    nce: null,
    program: { name: "Mwanza Water Quality Surveillance Q4", priority: "STANDARD" },
    storage: { path: "Refrigerator — Env → Shelf 1 → Box 2", coords: "Pos A-03", condition: "2–8 °C" },
    aliquots: [],
    programFields: [
      { label: "Surveillance Program",     value: "Lake Victoria Drinking Water Monitoring", type: "text" },
      { label: "Site ID",                  value: "MWZ-WQ-A14", type: "text" },
      { label: "Utility Operator",         value: "Mwanza Urban Water Authority (MWAUWASA)", type: "text" },
      { label: "Regulatory Reference",     value: "WHO 4th ed. §11.2; EPA SDWA §141.21", type: "longtext" },
      { label: "Chain of Custody Form",    value: "COC-MWZ-2025-Q4-091", type: "text" },
    ],
    orderInfo: { clinician: "J. Mukasa (Field Sampling Officer)", clinicianPhone: "+255 28 250 0000",
      department: "Environmental Surveillance",
      orderDate: "12/18/2025", priority: "Routine",
      collectionDate: "12/18/2025 07:30", receivedDate: "12/18/2025 08:00",
      clinicalNotes: "Routine quarterly drinking-water surveillance; post-chlorination tap" },
    method: { id: "MAN", label: "Manual", reagentLot: "LOT-2026-EC-A12", reagentExpiry: "04/2027" },
    attachments: [{ id: 1, name: "COC-MWZ-Q4-091.pdf", size: "188 KB", date: "12/18/2025" }],
    referral: null,
  },
  // VECTOR demo row — Vector Surveillance lab unit
  // Patient block becomes Trap block; Aliquots show pool composition; D-type result
  {
    id: "vec1", labNumber: "VEC01260000000000005", sequenceNumber: "012-1",
    domain: "VECTOR",
    patient: { name: "TRAP-2026-091 / An. gambiae × 5", id: "TRAP-2026-091", dob: "—", sex: "—", age: "—" },
    trap: { trapId: "TRAP-2026-091", gps: "−2.4128°S 32.8521°E", trapType: "CDC light trap",
            setDate: "12/16/2025 18:30", habitatNotes: "Rural village fringe; standing water 50m; LLIN ~75%" },
    test: "Plasmodium falciparum (pool PCR)", testCode: "LOINC LP14249-0",
    sampleType: "Mosquito pool (5 specimens)", analyzer: "Bio-Rad CFX96 (qPCR)",
    rangeText: "—", unit: "", selectedRangeLabel: null,
    result: "PF_NEG", currentResult: "", resultType: "D",
    dictionaryOptions: [
      { id: "PF_NEG", label: "Negative" },
      { id: "PF_POS", label: "Positive (Plasmodium falciparum detected)" },
      { id: "PF_INV", label: "Invalid (control failure)" },
    ],
    rangeBounds: null, isNormal: true, flags: [], nonconforming: false,
    enteredBy: "M. Bahari (Vector Lab)", enteredAt: "10:05 12/18/2025", labUnit: "Vector Surveillance", qcStatus: "pass",
    validationLevelsRequired: 1, validationLevelCurrent: 1, validationHistory: [],
    notes: [
      { id: 1, date: "12/18/2025 09:55", author: "M. Bahari", context: "entry", visibility: "internal",
        body: "Pool extracted using standard CTAB protocol. RNA integrity confirmed by gel." },
    ],
    pastNotesLegacy: "",
    interpretation: null, modificationHistory: [],
    nce: null,
    program: { name: "Lake Zone Malaria Vector Surveillance — IRS Cycle 4", priority: "STANDARD" },
    storage: { path: "Freezer C (Vector) → Rack 1 → Shelf 2 → Box 7", coords: "Pos B-08", condition: "−80 °C" },
    aliquots: [
      { id: "VEC01260000000000005-012.1", purpose: "Retention", linkedTest: "—",
        status: "In-Storage", createdAt: "12/17/2025 11:00", createdBy: "Field Tech",
        storage: "Freezer C → Rack 1 → Shelf 2 → Box 7 (Pos B-09)" },
      { id: "VEC01260000000000005-012.2", purpose: "Pool", linkedTest: "P. falciparum pool PCR",
        status: "Used", createdAt: "12/17/2025 11:00", createdBy: "Field Tech", storage: "—" },
    ],
    sample: { isPool: true,
      poolMembers: ["VEC01260000000000005-012.1-A","-012.1-B","-012.1-C","-012.1-D","-012.1-E"] },
    programFields: [
      { label: "Surveillance Program",   value: "Lake Zone Malaria Vector Monitoring", type: "text" },
      { label: "Program Officer",        value: "Dr. R. Mwita (NMCP)", type: "text" },
      { label: "Surveillance Cycle",     value: "IRS Cycle 4 (Q4 2025)", type: "text" },
      { label: "Mosquito Species (ID)",  value: "Anopheles gambiae s.l.", type: "text" },
      { label: "Pool Size",              value: "5 specimens", type: "text" },
      { label: "Habitat Notes",          value: "Rural village fringe; standing water 50m from trap", type: "longtext" },
    ],
    orderInfo: { clinician: "M. Bahari (Field Vector Collector)", clinicianPhone: "+255 28 250 0099",
      department: "Vector Surveillance Lab",
      orderDate: "12/17/2025", priority: "Routine",
      collectionDate: "12/17/2025 06:15", receivedDate: "12/17/2025 11:00",
      clinicalNotes: "Routine pool. Site historical Pf positivity ~3% (2024)." },
    method: { id: "AUTO", label: "Automated", reagentLot: "LOT-2026-PCR-K22", reagentExpiry: "10/2026" },
    attachments: [], referral: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Tiny reusable components
// ─────────────────────────────────────────────────────────────────────────
function Tag({ kind = "gray", children, title }) {
  const c = COLOR[kind] || COLOR.gray;
  return (
    <span title={title}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {children}
    </span>
  );
}

function PatientAvatar({ patient, size = 28 }) {
  const initials = (patient.name || "").split(",").map(p => p.trim()[0] || "").join("").slice(0,2).toUpperCase();
  const bg = colorHash(patient.id || patient.name, AVATAR_PALETTE);
  return (
    <span aria-hidden="true" style={{ width:size, height:size, background:bg }}
      className="inline-flex items-center justify-center rounded-full text-white text-xs font-semibold flex-shrink-0">
      {initials}
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { if (navigator?.clipboard) navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false), 1500); }}
      title="Copy" className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800">
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function SectionHeader({ label, open, onToggle, badge, action }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100"
      onClick={onToggle}>
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

// ─────────────────────────────────────────────────────────────────────────
// Modification History Banner (parity with Results Entry v3 / BR-V3-014)
// ─────────────────────────────────────────────────────────────────────────
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
            <span className="font-semibold text-amber-900">Modification History</span>
            <span className="text-amber-700">
              <span className="font-semibold">Original:</span> <span className="font-mono">{original}</span>
              <span className="mx-1.5">→</span>
              <span className="font-semibold">Current:</span> <span className="font-mono">{current}</span>
            </span>
            <span className="text-amber-600">·</span>
            <span className="text-amber-800">{mostRecent.modifiedBy}</span>
            <span className="text-amber-600">·</span>
            <span className="text-amber-700">{mostRecent.modifiedAt}</span>
          </div>
          <div className="text-amber-700 mt-1"><span className="font-semibold">Reason:</span> {mostRecent.reason}</div>
          {history.length > 1 && (
            <>
              <button onClick={() => setExpandAll(e => !e)} className="mt-1 text-xs text-amber-700 hover:underline">
                {expandAll ? "Hide history" : `View all history (${history.length})`}
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

// ─────────────────────────────────────────────────────────────────────────
// Critical Value indicator (BR-V3-003, revised)
// OpenELIS today does NOT track a structured CLSI GP47 read-back record at
// the validation level. The validator sees the existing critical flag
// (orange C badge + "Critical" tag from range tier evaluation) and any
// "[Critical acknowledged]" note the tech may have added at Results Entry.
// No fabricated panel, no fabricated backfill flow.
//
// If a structured GP47 critical_notification table is later added (per
// Results Entry v3 BR-033, which IS new functionality being proposed),
// then a future spec can wire a read-only display of that record here.
// Until then, this component renders a light awareness banner only when
// the row is in critical tier — pointing the validator at the existing
// notes and flag system as the source of acknowledgment evidence.
// ─────────────────────────────────────────────────────────────────────────
function CriticalAwarenessBanner({ isCritical }) {
  if (!isCritical) return null;
  return (
    <div className="border-b border-orange-200 bg-orange-50 px-4 py-2.5">
      <div className="flex items-start gap-3 text-xs">
        <AlertTriangle className="w-4 h-4 text-orange-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-orange-900">
          <span className="font-semibold">Critical value</span> — Confirm clinician acknowledgment via the existing notes / critical-flag audit before releasing.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Inline sections — all read-only on validator side (BR-V3-006)
// ─────────────────────────────────────────────────────────────────────────
// Note model (BR-V3-016):
//   - note.visibility — "internal" (in-lab only) | "external" (appears on patient report)
//   - note.context    — "entry" | "modification" | "validation" (workflow stage / authorship)
// Each note carries BOTH axes. The visibility flag is what determines whether the note
// flows to the patient/clinician report. Context is metadata about who wrote it / when.
function NoteContextBadge({ context }) {
  if (context === "validation") return <Tag kind="teal">Validation</Tag>;
  if (context === "modification") return <Tag kind="amber">Modification</Tag>;
  return null; // entry context shown implicitly via author + timestamp
}
function NoteVisibilityBadge({ visibility }) {
  if (visibility === "external") return <Tag kind="green" title="This note will appear on the patient report">📤 Send with Result</Tag>;
  return <Tag kind="purple" title="In-lab only — does not appear on the patient report">🔒 In Lab Only</Tag>;
}

function NotesSection({ result, onAddNote }) {
  const [open, setOpen] = useState((result.notes?.length || 0) > 0 || !!result.pastNotesLegacy);
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [visibility, setVisibility] = useState("internal"); // BR-V3-016: default In Lab Only

  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><MessageSquare className="w-4 h-4 inline mr-1.5 text-gray-500" />Notes</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={result.notes?.length ? `(${result.notes.length})` : null}
      />
      {open && (
        <div className="px-4 py-3 bg-white space-y-2">
          {(result.notes || []).length === 0 && !showForm && (
            <p className="text-xs text-gray-400">No notes yet.</p>
          )}
          {(result.notes || []).map(note => {
            // Back-compat: older notes use note.type which is the visibility axis only
            const noteVisibility = note.visibility ?? (note.type === "external" ? "external" : "internal");
            const noteContext = note.context ?? (note.type === "validation" ? "validation"
                                                : note.type === "modification" ? "modification"
                                                : "entry");
            return (
              <div key={note.id} className="flex gap-3 text-sm">
                <div className="flex-1 border-l-2 border-gray-200 pl-3">
                  <div className="flex gap-2 text-xs text-gray-400 mb-0.5 flex-wrap items-center">
                    <span>{note.date}</span>
                    <span className="text-gray-500 font-medium">{note.author}</span>
                    <NoteContextBadge context={noteContext} />
                    <NoteVisibilityBadge visibility={noteVisibility} />
                  </div>
                  <div className="text-gray-800 text-sm whitespace-pre-line">{note.body}</div>
                </div>
              </div>
            );
          })}
          {result.pastNotesLegacy && (
            <div className="text-xs text-gray-500 border-l-2 border-gray-100 pl-3 italic">
              <div className="font-medium text-gray-400 mb-0.5">Past notes (legacy):</div>
              <div className="whitespace-pre-line text-gray-600">{result.pastNotesLegacy}</div>
            </div>
          )}

          {/* Validators can ADD notes — BR-V3-007 + BR-V3-016 (visibility choice) */}
          {showForm ? (
            <div className="bg-gray-50 border border-gray-200 p-3 space-y-2">
              <div className="text-xs text-gray-700 mb-1">
                Context: <Tag kind="teal">Validation</Tag>
                <span className="text-gray-400 ml-1">(auto-set; this note is authored during validation)</span>
              </div>
              <div className="text-xs text-gray-700">
                <div className="mb-1 font-medium">Visibility <span className="text-red-500">*</span></div>
                <div className="flex gap-4 text-xs">
                  {[
                    { id: "internal", label: "🔒 In Lab Only", help: "Visible only to lab staff (default)" },
                    { id: "external", label: "📤 Send with Result", help: "Appears on the patient / clinician report" },
                  ].map(v => (
                    <label key={v.id} className="flex items-start gap-1.5 cursor-pointer">
                      <input type="radio" name={`note-visibility-${result.id}`} value={v.id}
                        checked={visibility === v.id} onChange={() => setVisibility(v.id)} className="mt-0.5" />
                      <span>
                        <span className="font-medium">{v.label}</span>
                        <span className="text-gray-400 block">{v.help}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <textarea rows={2} value={newNote} onChange={e => setNewNote(e.target.value)}
                placeholder="Add a validation note…" autoFocus
                className="w-full border border-gray-300 text-sm p-2 resize-none focus:outline-none focus:ring-1 focus:ring-teal-600" />
              <div className="flex gap-2">
                <button onClick={() => { if (newNote.trim()) { onAddNote?.(newNote, visibility); setNewNote(""); setVisibility("internal"); setShowForm(false); } }}
                  className="px-3 py-1 bg-teal-700 text-white text-xs font-medium hover:bg-teal-800">Save Note</button>
                <button onClick={() => setShowForm(false)}
                  className="px-3 py-1 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">Cancel</button>
              </div>
              {visibility === "external" && (
                <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-2">
                  <strong>This note will appear on the patient report.</strong> Make sure the wording is appropriate for the patient and clinician.
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs text-teal-700 hover:underline">
              <Plus className="w-3 h-3" /> Add Validation Note
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InterpretationSection({ interpretation }) {
  const [open, setOpen] = useState(!!interpretation);
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><Microscope className="w-4 h-4 inline mr-1.5 text-gray-500" />Interpretation</>}
        open={open} onToggle={() => setOpen(o => !o)}
        action={<span className="text-xs text-gray-400 italic">Read-only</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          {interpretation ? (
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-1">{interpretation.label}
                <span className="ml-2 text-xs text-gray-400 font-mono">{interpretation.code}</span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-line">{interpretation.text}</div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No interpretation entered.</p>
          )}
        </div>
      )}
    </div>
  );
}

function MethodSection({ method }) {
  const [open, setOpen] = useState(!!method?.reagentLot);
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><FlaskConical className="w-4 h-4 inline mr-1.5 text-gray-500" />Method & Reagents</>}
        open={open} onToggle={() => setOpen(o => !o)}
        action={<span className="text-xs text-gray-400 italic">Read-only</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Method</div>
              <div className="text-gray-800">{method?.label || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Reagent Lot</div>
              <div className="text-gray-800 font-mono">{method?.reagentLot || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Lot Expiry</div>
              <div className="text-gray-800">{method?.reagentExpiry || "—"}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400 italic">
            Read-only on validator. To change, reject back to tech for re-entry.
          </div>
        </div>
      )}
    </div>
  );
}

function OrderInfoSection({ orderInfo }) {
  const [open, setOpen] = useState(false);
  if (!orderInfo) return null;
  const fields = [
    { label: "Clinician", value: orderInfo.clinician },
    { label: "Phone", value: orderInfo.clinicianPhone },
    { label: "Department", value: orderInfo.department },
    { label: "Priority", value: orderInfo.priority },
    { label: "Collection Date/Time", value: orderInfo.collectionDate },
    { label: "Received Date/Time", value: orderInfo.receivedDate },
    { label: "Clinical Notes", value: orderInfo.clinicalNotes, span2: true },
  ].filter(f => f.value);
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><ClipboardList className="w-4 h-4 inline mr-1.5 text-gray-500" />Order Info</>}
        open={open} onToggle={() => setOpen(o => !o)}
        action={<span className="text-xs text-gray-400 italic">Read-only</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            {fields.map(f => (
              <div key={f.label} className={f.span2 ? "col-span-2" : ""}>
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

function ProgramInfoSection({ program, programFields }) {
  const [open, setOpen] = useState(true);
  if (!programFields || programFields.length === 0) return null;
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><BookOpen className="w-4 h-4 inline mr-1.5 text-gray-500" />Program Info</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={<span className="text-xs text-purple-700 font-medium">{program?.name}</span>}
        action={<span className="text-xs text-gray-400 italic">Read-only</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            {programFields.map(f => (
              <div key={f.label} className={f.type === "longtext" ? "col-span-3" : ""}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{f.label}</div>
                <div className="text-sm text-gray-800">{f.value || <span className="text-gray-300">—</span>}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StorageSection({ storage }) {
  const hasLocation = !!storage?.path;
  // H2 default: open when assigned (validator benefits from chain-of-custody visibility)
  const [open, setOpen] = useState(hasLocation);
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><MapPin className="w-4 h-4 inline mr-1.5 text-gray-500" />Storage Location</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={hasLocation ? null : "Unassigned"}
        action={<span className="text-xs text-gray-400 italic">Read-only</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          {hasLocation ? (
            <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Location</div>
                <div className="text-gray-800 font-mono">{storage.path}</div>
              </div>
              {storage.coords && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Position</div>
                  <div className="text-gray-800 font-mono">{storage.coords}</div>
                </div>
              )}
              {storage.condition && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Condition</div>
                  <div className="text-gray-800">{storage.condition}</div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              <strong className="text-gray-700">Unassigned</strong> — This sample item has no storage record.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AliquotsSection({ aliquots }) {
  const [open, setOpen] = useState((aliquots?.length || 0) > 0);
  if ((aliquots?.length || 0) === 0) return null;
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><Microscope className="w-4 h-4 inline mr-1.5 text-gray-500" />Aliquots (from this sample)</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={`(${aliquots.length})`}
        action={<span className="text-xs text-gray-400 italic">Read-only</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          <table className="w-full text-xs border border-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Aliquot ID", "Purpose", "Linked Test", "Status", "Created", "Storage"].map(h => (
                  <th key={h} className="text-left px-2 py-2 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aliquots.map(a => (
                <tr key={a.id} className="border-b border-gray-100">
                  <td className="px-2 py-2 font-mono text-gray-800">{a.id}</td>
                  <td className="px-2 py-2"><Tag kind="blue">{a.purpose}</Tag></td>
                  <td className="px-2 py-2 text-gray-600">{a.linkedTest || "—"}</td>
                  <td className="px-2 py-2"><Tag kind={a.status === "In-Storage" ? "teal" : "blue"}>{a.status}</Tag></td>
                  <td className="px-2 py-2 text-gray-500"><div>{a.createdAt}</div><div className="text-gray-400">{a.createdBy}</div></td>
                  <td className="px-2 py-2 text-gray-600 font-mono">{a.storage}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-gray-400 italic">
            Read-only on validator. Aliquot creation/destroy happens at Results Entry or Sample Reception.
          </div>
        </div>
      )}
    </div>
  );
}

function ReferralSection({ referral }) {
  const [open, setOpen] = useState(!!referral);
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><Send className="w-4 h-4 inline mr-1.5 text-gray-500" />Referral</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={referral ? <Tag kind="amber">Referred</Tag> : null}
        action={<span className="text-xs text-gray-400 italic">Read-only</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          {referral ? (
            <div className="text-sm text-gray-800">
              Referred to <strong>{referral.lab}</strong> on {referral.date} — Status: {referral.status}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No referral information.</p>
          )}
        </div>
      )}
    </div>
  );
}

function AttachmentsSection({ attachments }) {
  const list = attachments || [];
  const [open, setOpen] = useState(list.length > 0);
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><Paperclip className="w-4 h-4 inline mr-1.5 text-gray-500" />Attachments</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={list.length ? `(${list.length})` : null}
        action={<span className="text-xs text-gray-400 italic">Read-only</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          {list.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No attachments.</p>
          ) : (
            <div className="space-y-2">
              {list.map(att => (
                <div key={att.id} className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 text-sm">
                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-gray-800">{att.name}</div>
                    <div className="text-xs text-gray-400">{att.size} · {att.date}</div>
                  </div>
                  <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">View</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Validation Progress Timeline (multi-level pipeline — preserved from v2.1)
// Now lives inside an inline section labeled "Validation Pipeline"
// ─────────────────────────────────────────────────────────────────────────
function ValidationPipelineSection({ result }) {
  const [open, setOpen] = useState(result.validationLevelsRequired > 1);
  if (result.validationLevelsRequired <= 1) return null;
  const levels = [];
  for (let i = 1; i <= result.validationLevelsRequired; i++) {
    const histEntry = (result.validationHistory || []).find(h => h.level === i);
    levels.push({ number: i, completed: !!histEntry, history: histEntry });
  }
  return (
    <div className="border-b border-gray-200">
      <SectionHeader
        label={<><ShieldCheck className="w-4 h-4 inline mr-1.5 text-teal-600" />Validation Pipeline</>}
        open={open} onToggle={() => setOpen(o => !o)}
        badge={<span className="text-xs text-teal-700 font-medium">Level {result.validationLevelCurrent}/{result.validationLevelsRequired}</span>}
      />
      {open && (
        <div className="px-4 py-3 bg-white">
          <div className="space-y-2">
            {levels.map(level => (
              <div key={level.number} className="flex items-center gap-3">
                {level.completed
                  ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  : level.number === result.validationLevelCurrent
                    ? <CircleDot className="w-5 h-5 text-teal-500 flex-shrink-0" />
                    : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                <div className={`flex-1 text-sm ${level.completed ? "text-gray-600" : level.number === result.validationLevelCurrent ? "text-teal-700 font-medium" : "text-gray-400"}`}>
                  <span className="font-medium">Level {level.number}</span>
                  {level.completed && level.history && (
                    <span className="text-gray-500"> — {level.history.role} · {level.history.validatedBy} on {level.history.validatedAt}</span>
                  )}
                  {!level.completed && level.number === result.validationLevelCurrent && (
                    <span className="text-teal-600"> — Awaiting your validation</span>
                  )}
                  {!level.completed && level.number > result.validationLevelCurrent && (
                    <span className="text-gray-400"> — Pending</span>
                  )}
                </div>
                {level.number === result.validationLevelsRequired && (
                  <Tag kind="teal">Releases</Tag>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// E-Signature Modal (release-only — Part 11)
// ─────────────────────────────────────────────────────────────────────────
function ESignatureModal({ open, onSign, onCancel, batch }) {
  const [password, setPassword] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
      <div className="bg-white p-5 w-96 shadow-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-teal-700" />
          <h3 className="text-base font-semibold text-gray-900">E-Signature Required — Result Release</h3>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          You are about to release <strong>{batch.count}</strong> result(s) for <span className="font-mono">{batch.context}</span>.
          Per lab policy, validations that release results to clinicians must be e-signed (Part 11 §11.50, ISO 15189 §7.5.1.2).
        </p>
        <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full border border-gray-300 text-sm py-1.5 px-2 mb-3"
          placeholder="Enter your password to sign" />
        <p className="text-xs text-gray-400 mb-3">Meaning: APPROVED · Record type: RESULT_VALIDATION</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => { onSign(); setPassword(""); }} disabled={!password}
            className={`px-3 py-1.5 text-xs font-medium ${password ? "bg-teal-700 text-white hover:bg-teal-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            Sign &amp; Release
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Polymorphic Result display — D/M dictionary resolution
// ─────────────────────────────────────────────────────────────────────────
function renderResultValue(result) {
  if (!result.result) return <span className="text-gray-300">—</span>;
  if (result.resultType === "D") {
    const opt = result.dictionaryOptions?.find(o => o.id === result.result);
    return <span className="font-medium">{opt?.label || result.result}</span>;
  }
  if (result.resultType === "M") {
    const ids = (result.result || "").split(",").filter(Boolean);
    const labels = ids.map(id => result.dictionaryOptions?.find(o => o.id === id)?.label || id);
    return <span className="font-medium">{labels.join(", ")}</span>;
  }
  return <span className="font-mono">{result.result}</span>;
}

function renderCurrentResult(result) {
  if (!result.currentResult) return <span className="text-xs text-gray-300">—</span>;
  if (result.resultType === "D") {
    const opt = result.dictionaryOptions?.find(o => o.id === result.currentResult);
    return <span className="text-xs text-gray-500">{opt?.label || result.currentResult}</span>;
  }
  if (result.resultType === "M") {
    const ids = (result.currentResult || "").split(",").filter(Boolean);
    const labels = ids.map(id => result.dictionaryOptions?.find(o => o.id === id)?.label || id);
    return <span className="text-xs text-gray-500">{labels.join(", ") || "—"}</span>;
  }
  return <span className="text-xs text-gray-500 font-mono">{result.currentResult} {result.unit}</span>;
}

// ─────────────────────────────────────────────────────────────────────────
// Expanded Panel — primary action block at top + inline sections + tabs
// ─────────────────────────────────────────────────────────────────────────
const PANEL_TABS = [
  { key: "qaqc", label: "QA/QC", Icon: Shield },
  { key: "history", label: "History", Icon: History },
];

function ExpandedPanel({ result, onValidate, onReject, onRetest, onAddNote, requireESigOnRelease = true }) {
  const [activeTab, setActiveTab] = useState("qaqc");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRetestForm, setShowRetestForm] = useState(false);
  const [retestReason, setRetestReason] = useState("");

  const isCriticalTier = evaluateResult(result.result, result.rangeBounds) === "critical";
  const isInvalidTier  = evaluateResult(result.result, result.rangeBounds) === "invalid";
  const isFinal        = result.validationLevelCurrent >= result.validationLevelsRequired;
  // BR-V3-002: e-sig only gated on RELEASE (final-level validate)
  const releaseRequiresESig = isFinal && requireESigOnRelease;

  const validateLabel = isFinal ? "Validate & Release" : `Validate (Lv ${result.validationLevelCurrent}/${result.validationLevelsRequired}) — Advance`;
  const validateTooltip = releaseRequiresESig
    ? "Validate will prompt for e-signature before release."
    : "Validate without e-sig (intermediate level).";

  return (
    <div className="border-t border-gray-200">
      {/* Patient banner */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-gray-100 border-b border-gray-200 text-sm">
        <PatientAvatar patient={result.patient} size={36} />
        <span className="font-semibold text-gray-900">{result.patient.name}</span>
        <span className="text-gray-400 text-xs">ID: <strong className="text-gray-700">{result.patient.id}</strong></span>
        {result.patient.nationalId && <span className="text-gray-400 text-xs">Nat'l ID: <strong className="text-gray-700">{result.patient.nationalId}</strong></span>}
        <span className="text-gray-400 text-xs">DOB: <strong className="text-gray-700">{result.patient.dob}</strong></span>
        <span className="text-gray-400 text-xs">Sex: <strong className="text-gray-700">{result.patient.sex}</strong></span>
        <span className="text-gray-400 text-xs">Age: <strong className="text-gray-700">{result.patient.age}</strong></span>
        {result.orderInfo?.clinician && <span className="text-gray-400 text-xs">Clinician: <strong className="text-gray-700">{result.orderInfo.clinician}</strong></span>}
        {result.orderInfo?.priority === "STAT" && <Tag kind="red">STAT</Tag>}
      </div>

      {/* Program banner */}
      {result.program && (
        <div className={`flex items-center justify-between px-4 py-2 border-b text-xs ${
          result.program.priority === "CRITICAL" ? "bg-red-50 border-red-200" :
          result.program.priority === "URGENT"   ? "bg-amber-50 border-amber-200" :
                                                   "bg-purple-50 border-purple-200"
        }`}>
          <div className="flex items-center gap-2">
            <Shield className={`w-3.5 h-3.5 ${
              result.program.priority === "CRITICAL" ? "text-red-600" :
              result.program.priority === "URGENT"   ? "text-amber-600" :
                                                       "text-purple-600"
            }`} />
            <Tag kind={result.program.priority === "URGENT" ? "amber" : result.program.priority === "CRITICAL" ? "red" : "purple"}>
              EQA — {result.program.priority === "URGENT" ? "Urgent" : result.program.priority === "CRITICAL" ? "Critical" : "Standard"}
            </Tag>
            <span className="text-gray-700 font-semibold">{result.program.name}</span>
            {result.program.dueDate && <span className="text-gray-500">Due: {result.program.dueDate}</span>}
          </div>
        </div>
      )}

      {/* Modification History banner */}
      <ModificationHistoryBanner history={result.modificationHistory} />

      {/* Critical Value awareness banner — uses existing critical flag system, not a fabricated GP47 record */}
      <CriticalAwarenessBanner isCritical={isCriticalTier} />

      {/* ═══════════════════════════════════════════════════════════════════
          PRIMARY ACTION BLOCK (H1 parity) — action bar at top
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-end gap-4 px-4 py-3 bg-white border-b-2 border-teal-600 shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Result Value (Read-only)</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-base font-bold ${
              isInvalidTier ? "text-red-900" :
              isCriticalTier ? "text-orange-900" :
              result.flags?.includes("above-normal") || result.flags?.includes("below-normal") ? "text-yellow-900" :
              "text-gray-900"
            }`}>
              {renderResultValue(result)}
            </span>
            <span className="text-xs text-gray-500">{result.unit}</span>
            {isCriticalTier && <Tag kind="red">Critical</Tag>}
            {isInvalidTier && <Tag kind="red">Invalid</Tag>}
            {result.flags?.includes("above-normal") && <span className="text-red-600 font-bold text-xs">H</span>}
            {result.flags?.includes("below-normal") && <span className="text-blue-600 font-bold text-xs">L</span>}
            {result.flags?.includes("delta-check") && <span className="text-amber-600 font-bold text-xs" title="Delta check exceeded">Δ</span>}
          </div>
        </div>

        <div className="text-xs text-gray-500 flex items-center flex-wrap gap-2">
          <span>Ref: <span className="font-mono text-gray-800">{result.rangeText} {result.unit}</span></span>
          {/* BR-V3-005: demographic-aware range Tag */}
          {result.selectedRangeLabel && (
            <Tag kind="purple" title="Reference range selected based on patient demographics at sample collection date (CLSI EP28-A3c).">
              Range: {result.selectedRangeLabel}
            </Tag>
          )}
          {result.testCode && <span className="text-gray-400 font-mono text-xs">{result.testCode}</span>}
        </div>

        <div className="flex gap-2 ml-auto flex-wrap items-center">
          {/* Retest */}
          <button onClick={() => setShowRetestForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-400 text-amber-700 text-xs font-medium hover:bg-amber-50">
            <RotateCcw className="w-3.5 h-3.5" />
            Request Retest
          </button>

          {/* Reject */}
          <button onClick={() => setShowRejectForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-400 text-red-700 text-xs font-medium hover:bg-red-50">
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>

          {/* Validate (primary) */}
          <button
            onClick={() => onValidate?.(result.id, releaseRequiresESig)}
            title={validateTooltip}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              isFinal ? "bg-teal-700 text-white hover:bg-teal-800"
                      : "border border-teal-600 text-teal-700 hover:bg-teal-50"
            }`}>
            <CheckCircle className="w-3.5 h-3.5" />
            {validateLabel}
          </button>
        </div>
      </div>

      {/* Reject inline form */}
      {showRejectForm && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <label className="block text-xs font-semibold text-red-900 mb-1">
            Reject Reason <span className="text-red-700">*</span>
            <span className="font-normal text-gray-500 ml-1">(required — sends result back to Pending; tech re-enters)</span>
          </label>
          <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Why are you rejecting this result?"
            className="w-full border border-gray-300 text-xs p-2 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none" />
          <div className="flex gap-2 mt-2">
            <button onClick={() => { if (rejectReason.trim()) { onReject?.(result.id, rejectReason); setShowRejectForm(false); } }}
              className="px-3 py-1.5 bg-red-700 text-white text-xs font-medium hover:bg-red-800">
              Confirm Reject
            </button>
            <button onClick={() => setShowRejectForm(false)}
              className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}

      {/* Retest inline form */}
      {showRetestForm && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <label className="block text-xs font-semibold text-amber-900 mb-1">
            Retest Reason <span className="text-red-700">*</span>
            <span className="font-normal text-gray-500 ml-1">(creates a retest order; pipeline restarts at Level 1)</span>
          </label>
          <textarea rows={2} value={retestReason} onChange={e => setRetestReason(e.target.value)}
            placeholder="Why is a retest needed?"
            className="w-full border border-gray-300 text-xs p-2 focus:outline-none focus:ring-1 focus:ring-amber-600 resize-none" />
          <div className="flex gap-2 mt-2">
            <button onClick={() => { if (retestReason.trim()) { onRetest?.(result.id, retestReason); setShowRetestForm(false); } }}
              className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium hover:bg-amber-700">
              Confirm Retest
            </button>
            <button onClick={() => setShowRetestForm(false)}
              className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}

      {/* Invalid range warning */}
      {isInvalidTier && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border-b border-red-300">
          <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-red-900 text-xs">
            <span className="font-semibold">Result outside physiologically valid range</span> —
            this value is outside the test's configured valid range. Verify before releasing.
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECONDARY CONTEXT — inline sections (smart default-open per H2)
          ═══════════════════════════════════════════════════════════════════ */}
      <ValidationPipelineSection result={result} />
      <NotesSection result={result} onAddNote={(body, visibility) => onAddNote?.(result.id, body, visibility)} />
      <InterpretationSection interpretation={result.interpretation} />
      <MethodSection method={result.method} />
      <OrderInfoSection orderInfo={result.orderInfo} />
      <ProgramInfoSection program={result.program} programFields={result.programFields} />
      <StorageSection storage={result.storage} />
      <AliquotsSection aliquots={result.aliquots} />
      <ReferralSection referral={result.referral} />
      <AttachmentsSection attachments={result.attachments} />

      {/* Tabs — QA/QC + History only */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {PANEL_TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors ${
                activeTab === key
                  ? "border-teal-700 text-teal-700 font-semibold bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4">
        {activeTab === "qaqc" && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">QC Status</div>
              <div className={`inline-flex items-center gap-1 text-sm font-medium ${result.qcStatus === "pass" ? "text-emerald-700" : "text-red-700"}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${result.qcStatus === "pass" ? "bg-emerald-400" : "bg-red-400"}`} />
                {result.qcStatus === "pass" ? "Passed" : "Failed"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Control Values</div>
              <div className="text-gray-800">L1: 4.85 (4.5–5.2) · L2: 9.10 (8.5–9.8)</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Last QC Run</div>
              <div className="text-gray-800">02/26/2026 08:00</div>
            </div>
          </div>
        )}
        {activeTab === "history" && (
          <div className="text-sm text-gray-500">
            Previous results for this patient and test would appear here, with delta computation
            and prior validator names. (Demo content omitted for preview compactness.)
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Toast banner
// ─────────────────────────────────────────────────────────────────────────
function ToastBanner({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-start gap-3 p-3 shadow-lg border-l-4 text-sm ${
          t.kind === "success" ? "bg-green-50 border-green-500" :
          t.kind === "error" ? "bg-red-50 border-red-500" :
          t.kind === "warning" ? "bg-amber-50 border-amber-500" :
          "bg-blue-50 border-blue-500"
        }`}>
          <div className="flex-1 text-gray-800">{t.message}</div>
          <button onClick={() => onClose(t.id)} className="text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main Validation Page
// ─────────────────────────────────────────────────────────────────────────
function ValidationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [labUnit, setLabUnit] = useState("");
  const [statusFilter, setStatusFilter] = useState("awaiting-validation");
  const [showAutoValidated, setShowAutoValidated] = useState(false);
  const [showStat, setShowStat] = useState(false);
  const [expandedId, setExpandedId] = useState("r2");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const [esigOpen, setEsigOpen] = useState(false);
  const [esigPayload, setEsigPayload] = useState(null);
  // Site config simulation toggles
  const [showPatientNames, setShowPatientNames] = useState(false);
  const [userHasPatientPerm, setUserHasPatientPerm] = useState(true);
  const [requireESigOnRelease, setRequireESigOnRelease] = useState(true);
  const [workplanSource, setWorkplanSource] = useState(null);
  const [serverPage, setServerPage] = useState({ current: 1, total: 1 });

  // PII precedence (matches Results Entry BR-026)
  const shouldShowName = showPatientNames;
  const shouldMaskPII = !showPatientNames && !userHasPatientPerm;

  const addToast = (message, kind = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  const displayed = useMemo(() => MOCK_RESULTS.filter(r => {
    if (!showAutoValidated && r.isAutoValidated) return false;
    if (showStat && r.orderInfo?.priority !== "STAT") return false;
    if (statusFilter === "released" && r.status !== "released") return false;
    return true;
  }), [showAutoValidated, showStat, statusFilter]);

  const handleValidate = (resultId, requiresESig) => {
    if (requiresESig) {
      const r = MOCK_RESULTS.find(x => x.id === resultId);
      setEsigPayload({ resultIds: [resultId], count: 1, context: r?.labNumber });
      setEsigOpen(true);
    } else {
      addToast("Result advanced to next validation level.", "success");
      setExpandedId(null);
    }
  };

  const handleEsigSigned = () => {
    const count = esigPayload?.count || 0;
    addToast(`${count} result(s) released to clinician — e-signed.`, "success");
    setEsigOpen(false);
    setExpandedId(null);
    setEsigPayload(null);
  };

  const handleReject = (resultId, reason) => {
    addToast(`Result rejected — sent back to Pending. Reason logged: "${reason.slice(0, 50)}${reason.length > 50 ? '…' : ''}"`, "warning");
    setExpandedId(null);
  };

  const handleRetest = (resultId, reason) => {
    addToast(`Retest order created. Pipeline restarts at Level 1 when retest result lands.`, "warning");
    setExpandedId(null);
  };

  const handleAddNote = (resultId, body, visibility) => {
    const visLabel = visibility === "external" ? "Send with Result" : "In Lab Only";
    addToast(`Validation note saved — visibility: ${visLabel}.`, "success");
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedRows(next);
  };

  const selectedBatch = displayed.filter(r => selectedRows.has(r.id) && !r.isAutoValidated);
  const willRelease = selectedBatch.filter(r => r.validationLevelCurrent >= r.validationLevelsRequired);
  const willAdvance = selectedBatch.filter(r => r.validationLevelCurrent < r.validationLevelsRequired);
  const batchLabel = selectedBatch.length === 0 ? "Validate Selected"
    : willRelease.length === selectedBatch.length ? `Validate & Release Selected (${selectedBatch.length})`
    : willAdvance.length === selectedBatch.length ? `Validate Selected (${selectedBatch.length}) — advance`
    : `Validate Selected (${selectedBatch.length}) — ${willRelease.length} release, ${willAdvance.length} advance`;

  const handleBatchValidate = () => {
    if (willRelease.length > 0 && requireESigOnRelease) {
      setEsigPayload({ resultIds: selectedBatch.map(r => r.id), count: selectedBatch.length, context: `${selectedBatch.length} accessions` });
      setEsigOpen(true);
    } else {
      addToast(`${selectedBatch.length} result(s) validated — ${willRelease.length} released, ${willAdvance.length} advanced.`, "success");
      setSelectedRows(new Set());
    }
  };

  const TABLE_HEADERS = [
    { key: "select", label: "" }, { key: "expand", label: "" },
    { key: "samplePatient", label: "Sample / Patient" },
    { key: "sex", label: "Sex" }, { key: "age", label: "Age (D-M-Y)" },
    { key: "test", label: "Test" }, { key: "analyzer", label: "Analyzer" },
    { key: "result", label: "Result" }, { key: "currentResult", label: "Current Result" },
    { key: "range", label: "Range" }, { key: "status", label: "Status" },
    { key: "flags", label: "Flags" }, { key: "validation", label: "Validation" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-sm">
      <ToastBanner toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <ESignatureModal open={esigOpen} onSign={handleEsigSigned} onCancel={() => { setEsigOpen(false); setEsigPayload(null); }}
        batch={esigPayload || { count: 0, context: "" }} />

      {/* Preview banner */}
      <div className="bg-teal-50 border-b-2 border-teal-600 px-4 py-2 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-teal-700 font-semibold">🎨 Preview v3 — Validation</span>
        <span className="text-gray-500">— Parallel to Results Entry v3 architecture</span>
        <span className="ml-auto flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-teal-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Site:</span>
            <span className="text-gray-700">Show patient name</span>
            <button onClick={() => setShowPatientNames(v => !v)}
              className={`relative inline-flex h-4 w-8 cursor-pointer rounded-full ${showPatientNames ? "bg-teal-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow ${showPatientNames ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </span>
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-teal-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Role PII:</span>
            <span className="text-gray-700">User has PatientResults perm</span>
            <button onClick={() => setUserHasPatientPerm(v => !v)}
              className={`relative inline-flex h-4 w-8 cursor-pointer rounded-full ${userHasPatientPerm ? "bg-green-600" : "bg-red-500"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow ${userHasPatientPerm ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </span>
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-teal-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">E-Sig on release?</span>
            <button onClick={() => setRequireESigOnRelease(v => !v)}
              className={`relative inline-flex h-4 w-8 cursor-pointer rounded-full ${requireESigOnRelease ? "bg-teal-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow ${requireESigOnRelease ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </span>
          <span className="flex items-center gap-2 px-3 py-1 bg-white border border-teal-200 rounded text-gray-600">
            <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Workplan?</span>
            <button onClick={() => setWorkplanSource(v => v ? null : "WorkPlanByTest")}
              className={`relative inline-flex h-4 w-8 cursor-pointer rounded-full ${workplanSource ? "bg-purple-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow ${workplanSource ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </span>
        </span>
      </div>

      {/* Shell header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-2 text-sm">
        <span className="text-teal-400 font-bold">OpenELIS Global</span>
        <span className="text-gray-500">›</span>
        <span>Home</span>
        {workplanSource && (<>
          <span className="text-gray-500">›</span>
          <span>Workplan</span>
        </>)}
        <span className="text-gray-500">›</span>
        <span>Validation</span>
      </div>

      {/* Page heading */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-2xl font-light text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-teal-600" />
          Result Validation
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">Review and validate results before release to the clinical chart</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-52 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text"
            className="w-full pl-8 pr-3 py-2 border border-gray-400 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
            placeholder="Search by accession, patient, or test…"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="min-w-44">
          <div className="text-xs text-gray-500 mb-1">Lab Unit</div>
          <select className="w-full border border-gray-400 bg-gray-50 text-sm py-2 px-2 focus:outline-none focus:ring-1 focus:ring-teal-600"
            value={labUnit} onChange={(e) => setLabUnit(e.target.value)}>
            <option value="">All Lab Units</option>
            {LAB_UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {/* Domain badge — derived from selected Lab Unit (CLINICAL / ENVIRONMENTAL / VECTOR) */}
        {(() => {
          const selectedUnit = LAB_UNITS.find(u => u.id === labUnit);
          if (!selectedUnit?.domain) return null;
          const cfg = DOMAIN_BADGE[selectedUnit.domain];
          return (
            <div className="flex flex-col gap-1">
              <div className="text-xs text-gray-500">Domain</div>
              <Tag kind={cfg.kind} title="Domain inferred from the selected Lab Unit. Cannot be changed per-result.">
                {cfg.label}
              </Tag>
            </div>
          );
        })()}
        <div className="flex items-center gap-2 text-xs text-gray-500 ml-auto">
          <button onClick={() => setServerPage(p => ({ ...p, current: Math.max(1, p.current-1) }))}
            className="p-1 border border-gray-300 hover:bg-gray-100 disabled:opacity-40" disabled={serverPage.current === 1}>‹</button>
          <span>Server page <strong className="text-gray-700">{serverPage.current}</strong> / {serverPage.total}</span>
          <button onClick={() => setServerPage(p => ({ ...p, current: Math.min(p.total, p.current+1) }))}
            className="p-1 border border-gray-300 hover:bg-gray-100 disabled:opacity-40" disabled={serverPage.current === serverPage.total}>›</button>
        </div>
      </div>

      {/* Filter chips + stats */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 font-medium mr-1">Show:</span>
        {[
          { key: "awaiting-validation", label: "Awaiting Validation" },
          { key: "released", label: "Released" },
          { key: "all", label: "All" },
        ].map(s => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              statusFilter === s.key ? "bg-gray-800 border-gray-800 font-semibold text-white"
                                     : "border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}>{s.label}</button>
        ))}
        <button onClick={() => setShowStat(s => !s)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            showStat ? "bg-red-600 border-red-600 font-semibold text-white"
                     : "border-gray-200 text-gray-500 hover:bg-gray-100"
          }`}>STAT only</button>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer ml-3">
          <input type="checkbox" checked={showAutoValidated} onChange={() => setShowAutoValidated(v => !v)} />
          <Bot className="w-3.5 h-3.5" /> Show auto-validated
        </label>
        <span className="ml-auto text-xs text-gray-400">{displayed.length} result{displayed.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Nonconforming legend */}
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2 text-xs text-orange-900">
        <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
        = Sample or Order is nonconforming or Test has been rejected
      </div>

      {/* Batch action bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <span className="text-xs text-gray-500">{selectedRows.size} selected</span>
        <div className="flex-1" />
        <button onClick={handleBatchValidate} disabled={selectedBatch.length === 0}
          className="px-4 py-1.5 bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          {batchLabel}
        </button>
      </div>

      {/* Results Table */}
      <div className="mx-4 mt-4 bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-max">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              {TABLE_HEADERS.map(h => (
                <th key={h.key} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap">{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(result => {
              const isExpanded = expandedId === result.id;
              const isAuto = !!result.isAutoValidated;
              const tier = evaluateResult(result.result, result.rangeBounds);
              return (
                <Fragment key={result.id}>
                  <tr className={`border-b border-gray-100 transition-colors ${
                    isExpanded ? "bg-teal-50" :
                    isAuto ? "bg-gray-50 opacity-75" :
                    "hover:bg-gray-50"
                  }`}>
                    <td className="px-3 py-3 w-10">
                      {!isAuto && (
                        <input type="checkbox" checked={selectedRows.has(result.id)}
                          onChange={() => toggleSelect(result.id)} className="accent-teal-600" />
                      )}
                    </td>
                    <td className="px-3 py-3 w-10">
                      <button onClick={() => setExpandedId(isExpanded ? null : result.id)}
                        className="p-1 hover:bg-gray-200 rounded">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-teal-700" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </button>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <PatientAvatar patient={result.patient} size={28} />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-gray-700">{result.labNumber}-{result.sequenceNumber}</span>
                            <CopyButton text={`${result.labNumber}-${result.sequenceNumber}`} />
                            {result.nonconforming && (
                              <span title="Sample or order is nonconforming" className="ml-1 text-orange-600">
                                <AlertTriangle className="w-3 h-3 inline" />
                              </span>
                            )}
                          </div>
                          {shouldMaskPII ? (
                            <div className="text-xs text-gray-400 italic mt-0.5">— — —</div>
                          ) : shouldShowName ? (
                            <div className="text-xs font-medium text-gray-800 mt-0.5">{result.patient.name}</div>
                          ) : (
                            <div className="text-xs text-gray-500 mt-0.5">ID {result.patient.id}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{result.patient.sex}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{result.patient.age}</td>
                    <td className="px-3 py-3 max-w-48">
                      <div className="font-medium text-gray-900">{result.test}</div>
                      {result.testCode && <div className="text-xs text-gray-400 mt-0.5 font-mono">{result.testCode}</div>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{result.analyzer}</td>
                    <td className={`px-3 py-3 ${RANGE_CELL_BG[tier] || ""}`}>
                      <span className={`text-sm ${RANGE_CELL_TEXT[tier] || "text-gray-800"} ${tier !== "normal" ? "font-bold" : ""}`}>
                        {renderResultValue(result)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">{result.unit}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{renderCurrentResult(result)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-xs font-mono text-gray-700">{result.rangeText}</div>
                      {result.selectedRangeLabel && (
                        <Tag kind="purple" title="Reference range selected based on patient demographics (CLSI EP28-A3c).">
                          {result.selectedRangeLabel}
                        </Tag>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isAuto ? (
                        <Tag kind="gray"><Bot className="w-3 h-3 inline mr-0.5" />Auto</Tag>
                      ) : (
                        <Tag kind="warm-gray">Awaiting Val.</Tag>
                      )}
                      {result.modificationHistory?.length > 0 && (
                        <div className="mt-1">
                          <Tag kind="warm-gray" title="This result has been modified — see History banner in expanded panel">
                            <Pencil className="w-3 h-3 inline mr-0.5" />Modified
                          </Tag>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex gap-1 items-center flex-wrap">
                        {result.flags?.includes("above-normal") && <span className="text-red-600 font-bold text-xs">H</span>}
                        {result.flags?.includes("below-normal") && <span className="text-blue-600 font-bold text-xs">L</span>}
                        {result.flags?.includes("delta-check") && <span className="text-amber-600 font-bold text-xs" title="Delta check">Δ</span>}
                        {tier === "critical" && <span className={`px-1 py-0.5 rounded text-xs font-bold ${RANGE_FLAG_BADGE.critical}`}>C</span>}
                        {tier === "invalid" && <span className={`px-1 py-0.5 rounded text-xs font-bold ${RANGE_FLAG_BADGE.invalid}`}>!</span>}
                        {result.nce && <Tag kind="teal" title={`NCE ${result.nce.number}`}>NCE</Tag>}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {result.validationLevelsRequired > 1 && (
                        <Tag kind={result.validationLevelCurrent >= result.validationLevelsRequired ? "teal" : "blue"}
                          title={`At Level ${result.validationLevelCurrent} of ${result.validationLevelsRequired}`}>
                          {result.validationHistory?.length > 0 && <Check className="w-3 h-3 inline mr-0.5" />}
                          Validation {result.validationLevelCurrent}/{result.validationLevelsRequired}
                        </Tag>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={TABLE_HEADERS.length} className="p-0">
                        <ExpandedPanel result={result}
                          onValidate={handleValidate}
                          onReject={handleReject}
                          onRetest={handleRetest}
                          onAddNote={handleAddNote}
                          requireESigOnRelease={requireESigOnRelease} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="h-8" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Admin Validation Configuration — STUB (OGC-343)
// Full v2.1 implementation preserved in /designs/results-validation/validation-page.jsx history.
// This stub provides the link target so the view toggle remains functional;
// no scope changes from v2.1.
// ─────────────────────────────────────────────────────────────────────────
function AdminValidationConfig() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-sm">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 p-6">
        <h1 className="text-xl font-light text-gray-900 mb-2">Admin → Validation Configuration</h1>
        <p className="text-sm text-gray-500 mb-4">OGC-343 — Multi-Level Pipeline + Auto-Validation + Per-Unit Overrides</p>
        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>v3.0 note:</strong> The Admin Validation Configuration page is preserved unchanged from v2.1 (OGC-343 scope).
          See the v2.1 mockup file history for the full configuration UI (lab-wide default, per-unit overrides,
          permission-filtered role dropdowns, summary banner, validation trigger options).
          v3.0 changes affect only the Validation Page itself, not the admin configuration surface.
        </div>
        <div className="mt-4 text-xs text-gray-500 italic">
          Switch to "Validation Page" view above to see v3.0 changes.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Top-level view toggle
// ─────────────────────────────────────────────────────────────────────────
export default function ValidationMockupV3() {
  const [view, setView] = useState("validation");
  return (
    <div>
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center gap-3 text-xs">
        <span className="font-semibold">Validation v3 Mockup — view:</span>
        <button onClick={() => setView("validation")}
          className={`px-3 py-1 ${view === "validation" ? "bg-teal-600 text-white" : "border border-gray-600 text-gray-300 hover:bg-gray-800"}`}>
          Validation Page (v3)
        </button>
        <button onClick={() => setView("admin")}
          className={`px-3 py-1 ${view === "admin" ? "bg-teal-600 text-white" : "border border-gray-600 text-gray-300 hover:bg-gray-800"}`}>
          Admin Config (v2.1 — unchanged)
        </button>
      </div>
      {view === "validation" ? <ValidationPage /> : <AdminValidationConfig />}
    </div>
  );
}
