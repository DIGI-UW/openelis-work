import React, { useState, useCallback, useMemo, Fragment } from "react";
import {
  Search, ChevronDown, ChevronRight, ChevronUp, Filter, Shield, ShieldCheck, ShieldAlert,
  Check, CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, RotateCcw,
  Clock, User, Settings, Plus, Minus, Info, Eye, EyeOff, Lock, Unlock, X, Bot,
  FileText, Beaker, History, Activity, Layers, ArrowRight, GripVertical, Pencil,
  CircleDot, Circle, CheckCircle, ChevronLeft, ChevronsLeft, ChevronsRight, MoreHorizontal,
  Building2, FlaskConical, Microscope, Thermometer, Droplets, Zap
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// OpenELIS Global — Validation Configuration & Page Mockup v2.1
// Two views: Admin Config + Validation Page
// v2.1: Added Enhancement E — Notes, Interpretation, full tab bar, range highlighting, NCE badges
// ═══════════════════════════════════════════════════════════════

// --- Localization Tag System ---
const i18n = {
  // Admin Config
  "label.admin.validation.title": "Validation Configuration",
  "label.admin.validation.subtitle": "Configure how results are validated before release",
  "label.admin.validation.labDefault": "Lab-Wide Default",
  "label.admin.validation.labUnitOverrides": "Lab Unit Overrides",
  "label.admin.validation.trigger": "Validation Trigger",
  "label.admin.validation.trigger.none": "No Results (auto-release all)",
  "label.admin.validation.trigger.all": "All Results",
  "label.admin.validation.trigger.abnormal": "Abnormal Results Only",
  "label.admin.validation.levelsRequired": "Validations Required",
  "label.admin.validation.level": "Validation Level",
  "label.admin.validation.role": "Required Role (must hold result.validate permission)",
  "label.admin.validation.role.hint": "Only roles with the result.validate permission are shown. Use the Role Builder to grant this permission to additional roles.",
  "label.admin.validation.role.noRoles": "No roles currently hold the result.validate permission. Use the Role Builder to assign this permission before configuring validation levels.",
  "label.admin.validation.addLevel": "Add Validation Level",
  "label.admin.validation.removeLevel": "Remove Level",
  "label.admin.validation.source.default": "Default",
  "label.admin.validation.source.override": "Override",
  "label.admin.validation.editOverride": "Edit Override",
  "label.admin.validation.resetDefault": "Reset to Default",
  "label.admin.validation.willRelease": "Results will be released after final validation",
  "label.admin.validation.willAutoRelease": "Results will auto-release on save (no manual validation)",
  "label.admin.validation.willAutoReleaseNormal": "Normal results will auto-release; abnormal results require validation",
  "label.admin.validation.saved": "Validation configuration saved successfully",
  // Validation Page
  "label.validation.title": "Result Validation",
  "label.validation.subtitle": "Review and validate results before release",
  "label.validation.count": "awaiting your validation",
  "label.validation.progress": "Level {0} of {1}",
  "label.validation.progress.complete": "Validated by {0} on {1}",
  "label.validation.progress.awaiting": "Awaiting validation",
  "label.validation.progress.awaitingYou": "Awaiting your validation",
  "label.validation.action.validate": "Validate ({0} of {1})",
  "label.validation.action.validateRelease": "Validate & Release",
  "label.validation.action.retest": "Retest",
  "label.validation.batch.validateRelease": "Validate & Release Selected",
  "label.validation.batch.validate": "Validate Selected — advances to next level",
  "label.validation.batch.validateMixed": "Validate Selected — {0} will release, {1} will advance",
  "label.validation.autoValidated": "Auto-validated",
  "label.validation.autoValidated.toggle": "Show auto-validated results",
  "label.validation.config.info": "{0}: {1} validation level(s), {2}",
  // Audit
  "label.audit.autoValidate.normalResult": "Auto-validated: Result within normal range (abnormal-only trigger)",
  "label.audit.autoValidate.zeroLevels": "Auto-validated: 0 validation levels configured",
  "label.audit.autoValidate.noValidation": "Auto-validated: Validation trigger set to 'No Results'",
};

const t = (key, ...args) => {
  let text = i18n[key] || key;
  args.forEach((arg, i) => { text = text.replace(`{${i}}`, arg); });
  return text;
};

// --- Mock Data ---
// Populated from GET /api/roles?permission=result.validate
// Only roles holding the "result.validate" permission appear here.
// Currently only the built-in "Validation" role has this permission;
// additional roles will appear as admins assign the permission via the Role Builder.
//
// Mockup shows a future state where the site has granted result.validate
// to additional custom roles via Role Builder:
const ROLES_WITH_VALIDATE_PERMISSION = [
  { id: "role-validation", name: "Validation" },
  // ↓ These would only appear after an admin grants result.validate via Role Builder
  { id: "role-supervisor", name: "Supervisor" },
  { id: "role-lab-manager", name: "Lab Manager" },
  { id: "role-senior-tech", name: "Senior Technician" },
];

const LAB_UNITS = [
  { id: "lu-hem", name: "Hematology", icon: Droplets },
  { id: "lu-chem", name: "Chemistry", icon: FlaskConical },
  { id: "lu-micro", name: "Microbiology", icon: Microscope },
  { id: "lu-sero", name: "Serology", icon: Beaker },
  { id: "lu-ua", name: "Urinalysis", icon: Thermometer },
  { id: "lu-mol", name: "Molecular", icon: Zap },
];

// --- Range evaluation (mirrors Results Entry logic) ---
function evaluateResult(value, rangeBounds) {
  const num = parseFloat(value);
  if (value === "" || value == null || isNaN(num) || !rangeBounds) return "normal";
  const { normal, critical, valid } = rangeBounds;
  if (valid    && (num < valid.low    || num > valid.high))    return "invalid";
  if (critical && (num < critical.low || num > critical.high)) return "critical";
  if (normal   && (num < normal.low   || num > normal.high))   return "abnormal";
  return "normal";
}

const RANGE_CELL_BG   = { normal: "", abnormal: "bg-yellow-50", critical: "bg-orange-50", invalid: "bg-red-950" };
const RANGE_CELL_TEXT  = { normal: "text-gray-800", abnormal: "text-yellow-900", critical: "text-orange-900", invalid: "text-red-100" };
const RANGE_FLAG_BADGE = { abnormal: "bg-yellow-100 text-yellow-800", critical: "bg-orange-100 text-orange-900", invalid: "bg-red-900 text-red-100" };

const MOCK_RESULTS = [
  {
    id: "r1", labNumber: "DEV01260000001234", patientId: "3456789", patientName: "Test, Patient A",
    sex: "M", age: "14y", dob: "01/11/2012", test: "WBC", sampleType: "Whole Blood",
    analyzer: "Sysmex XN-L", rangeText: "4.00-10.00", unit: "x10^9/L", result: "7.5",
    rangeBounds: { normal: { low: 4.0, high: 10.0 }, critical: { low: 2.0, high: 30.0 }, valid: { low: 0.1, high: 100.0 } },
    isNormal: true, flags: [], enteredBy: "J. Smith", enteredAt: "10:30",
    labUnit: "Hematology", qcStatus: "pass",
    validationLevelsRequired: 2, validationLevelCurrent: 1,
    validationHistory: [],
    notes: [],
    interpretation: null,
    nce: null,
    orderInfo: { clinician: "Dr. Chen", orderDate: "02/28/2026", priority: "Routine", clinicalNotes: "Annual physical", collection: "Venipuncture, left arm" },
    attachments: [],
    referral: null,
  },
  {
    id: "r2", labNumber: "DEV01260000001234", patientId: "3456789", patientName: "Test, Patient A",
    sex: "M", age: "14y", dob: "01/11/2012", test: "RBC", sampleType: "Whole Blood",
    analyzer: "Sysmex XN-L", rangeText: "4.50-5.50", unit: "x10^12/L", result: "3.90",
    rangeBounds: { normal: { low: 4.5, high: 5.5 }, critical: { low: 2.0, high: 8.0 }, valid: { low: 0.5, high: 15.0 } },
    isNormal: false, flags: ["below-normal"], enteredBy: "J. Smith", enteredAt: "10:30",
    labUnit: "Hematology", qcStatus: "pass",
    validationLevelsRequired: 2, validationLevelCurrent: 1,
    validationHistory: [],
    notes: [
      { id: 1, date: "02/26/2026 10:32", author: "J. Smith", type: "internal", body: "Slightly below range — patient has known iron deficiency. Correlate with ferritin." }
    ],
    interpretation: { code: "RBC-ANEMOD", label: "Mild Anemia", text: "RBC count slightly below reference range. Suggests mild anemia. Recommend correlation with Hgb, Hct, and reticulocyte count." },
    nce: null,
    orderInfo: { clinician: "Dr. Chen", orderDate: "02/28/2026", priority: "Routine", clinicalNotes: "Annual physical", collection: "Venipuncture, left arm" },
    attachments: [],
    referral: null,
  },
  {
    id: "r3", labNumber: "DEV01260000001235", patientId: "7891234", patientName: "Test, Patient B",
    sex: "F", age: "45y", dob: "03/22/1981", test: "Glucose", sampleType: "Serum",
    analyzer: "Indiko Plus", rangeText: "70-100", unit: "mg/dL", result: "142",
    rangeBounds: { normal: { low: 70, high: 100 }, critical: { low: 40, high: 500 }, valid: { low: 10, high: 1000 } },
    isNormal: false, flags: ["above-normal"], enteredBy: "M. Jones", enteredAt: "11:15",
    labUnit: "Chemistry", qcStatus: "pass",
    validationLevelsRequired: 1, validationLevelCurrent: 1,
    validationHistory: [],
    notes: [
      { id: 2, date: "02/26/2026 11:18", author: "M. Jones", type: "internal", body: "Fasting glucose confirmed — patient was fasting >8hrs." },
      { id: 3, date: "02/26/2026 11:20", author: "M. Jones", type: "internal", body: "[Modification reason] Initial entry was 152, rechecked and corrected to 142." },
    ],
    interpretation: { code: "GLU-DM", label: "Diabetes Mellitus", text: "Fasting glucose ≥126 mg/dL is consistent with diabetes mellitus. Recommend confirmation with repeat fasting glucose or HbA1c." },
    nce: null,
    orderInfo: { clinician: "Dr. Patel", orderDate: "02/27/2026", priority: "Urgent", clinicalNotes: "Suspected T2DM, recent weight loss", collection: "Venipuncture, right arm, fasting" },
    attachments: [{ id: 1, name: "glucose-qc-printout.pdf", size: "124 KB", date: "02/26/2026" }],
    referral: null,
  },
  {
    id: "r4", labNumber: "DEV01260000001235", patientId: "7891234", patientName: "Test, Patient B",
    sex: "F", age: "45y", dob: "03/22/1981", test: "Creatinine", sampleType: "Serum",
    analyzer: "Indiko Plus", rangeText: "0.6-1.2", unit: "mg/dL", result: "0.9",
    rangeBounds: { normal: { low: 0.6, high: 1.2 }, critical: { low: 0.2, high: 15.0 }, valid: { low: 0.1, high: 30.0 } },
    isNormal: true, flags: [], enteredBy: "M. Jones", enteredAt: "11:15",
    labUnit: "Chemistry", qcStatus: "pass",
    validationLevelsRequired: 1, validationLevelCurrent: 1,
    validationHistory: [],
    notes: [],
    interpretation: null,
    nce: null,
    orderInfo: { clinician: "Dr. Patel", orderDate: "02/27/2026", priority: "Urgent", clinicalNotes: "Suspected T2DM, recent weight loss", collection: "Venipuncture, right arm, fasting" },
    attachments: [],
    referral: null,
  },
  {
    id: "r5", labNumber: "DEV01260000001236", patientId: "5678901", patientName: "Test, Patient C",
    sex: "M", age: "62y", dob: "09/15/1963", test: "Hemoglobin", sampleType: "Whole Blood",
    analyzer: "Sysmex XN-L", rangeText: "13.0-17.0", unit: "g/dL", result: "10.2",
    rangeBounds: { normal: { low: 13.0, high: 17.0 }, critical: { low: 7.0, high: 20.0 }, valid: { low: 1.0, high: 25.0 } },
    isNormal: false, flags: ["below-normal", "delta-check"], enteredBy: "A. Lee", enteredAt: "09:45",
    labUnit: "Hematology", qcStatus: "pass",
    validationLevelsRequired: 2, validationLevelCurrent: 2,
    validationHistory: [
      { level: 1, validatedBy: "Dr. Williams", validatedAt: "02/26/2026 10:15", role: "Supervisor", action: "VALIDATE" }
    ],
    notes: [
      { id: 4, date: "02/26/2026 09:50", author: "A. Lee", type: "internal", body: "Significant drop from previous result (14.1 g/dL). Delta check triggered at -27.7%." },
      { id: 5, date: "02/26/2026 10:16", author: "Dr. Williams", type: "validation", body: "Level 1 review: confirmed with instrument QC. Forwarding for final validation." },
    ],
    interpretation: { code: "HGB-ANEMSEV", label: "Moderate Anemia", text: "Hemoglobin significantly below reference range with notable delta from previous. Consider GI bleed workup." },
    nce: null,
    orderInfo: { clinician: "Dr. Adams", orderDate: "02/26/2026", priority: "Stat", clinicalNotes: "Post-operative day 2, complaint of dizziness", collection: "Venipuncture, right arm" },
    attachments: [],
    referral: null,
  },
  {
    id: "r6", labNumber: "DEV01260000001237", patientId: "1234567", patientName: "Test, Patient D",
    sex: "F", age: "28y", dob: "07/04/1997", test: "TSH", sampleType: "Serum",
    analyzer: "VIDAS", rangeText: "0.4-4.0", unit: "mIU/L", result: "2.1",
    rangeBounds: { normal: { low: 0.4, high: 4.0 }, critical: { low: 0.1, high: 10.0 }, valid: { low: 0.01, high: 100.0 } },
    isNormal: true, flags: [], enteredBy: "K. Brown", enteredAt: "08:20",
    labUnit: "Chemistry", qcStatus: "pass",
    validationLevelsRequired: 1, validationLevelCurrent: 1,
    validationHistory: [],
    isAutoValidated: true,
    notes: [],
    interpretation: null,
    nce: null,
    orderInfo: { clinician: "Dr. Liu", orderDate: "02/25/2026", priority: "Routine", clinicalNotes: "Thyroid screening", collection: "Venipuncture, left arm" },
    attachments: [],
    referral: null,
  },
  {
    id: "r7", labNumber: "DEV01260000001238", patientId: "2345678", patientName: "Test, Patient E",
    sex: "M", age: "55y", dob: "08/12/1970", test: "Potassium", sampleType: "Serum",
    analyzer: "Indiko Plus", rangeText: "3.5-5.0", unit: "mmol/L", result: "7.8",
    rangeBounds: { normal: { low: 3.5, high: 5.0 }, critical: { low: 2.5, high: 6.5 }, valid: { low: 1.0, high: 15.0 } },
    isNormal: false, flags: ["above-normal"], enteredBy: "J. Smith", enteredAt: "09:10",
    labUnit: "Chemistry", qcStatus: "pass",
    validationLevelsRequired: 1, validationLevelCurrent: 1,
    validationHistory: [],
    notes: [
      { id: 6, date: "02/26/2026 09:12", author: "J. Smith", type: "internal", body: "Hemolyzed specimen — likely pseudohyperkalemia. NCE filed." },
    ],
    interpretation: null,
    nce: { number: "NCE-20260226-0891", status: "open", category: "Pre-Analytical", subcategory: "Specimen Integrity", severity: "Major" },
    orderInfo: { clinician: "Dr. Adams", orderDate: "02/26/2026", priority: "Stat", clinicalNotes: "Cardiac monitoring", collection: "Venipuncture, difficult draw" },
    attachments: [],
    referral: null,
    status: "cancelled",
  },
];


// ═══════════════════════════════════════════════
// COMPONENT: Admin Validation Configuration Page
// ═══════════════════════════════════════════════
const AdminValidationConfig = () => {
  const [labDefault, setLabDefault] = useState({
    trigger: "all",
    levelsRequired: 1,
    levels: [{ number: 1, roleId: "role-validation" }],
  });

  const [unitOverrides, setUnitOverrides] = useState({
    "lu-hem": {
      trigger: "all",
      levelsRequired: 2,
      levels: [
        { number: 1, roleId: "role-supervisor" },
        { number: 2, roleId: "role-lab-manager" },
      ],
    },
    "lu-micro": {
      trigger: "all",
      levelsRequired: 2,
      levels: [
        { number: 1, roleId: "role-senior-tech" },
        { number: 2, roleId: "role-supervisor" },
      ],
    },
    "lu-chem": {
      trigger: "abnormal",
      levelsRequired: 1,
      levels: [{ number: 1, roleId: "role-validation" }],
    },
  });

  const [expandedUnit, setExpandedUnit] = useState(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSave = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const addLevel = (config, setConfig) => {
    if (config.levelsRequired >= 5) return;
    const newLevel = config.levelsRequired + 1;
    setConfig({
      ...config,
      levelsRequired: newLevel,
      levels: [...config.levels, { number: newLevel, roleId: "role-validation" }],
    });
  };

  const removeLevel = (config, setConfig) => {
    if (config.levelsRequired <= 0) return;
    setConfig({
      ...config,
      levelsRequired: config.levelsRequired - 1,
      levels: config.levels.slice(0, -1),
    });
  };

  const getTriggerDescription = (trigger, levels) => {
    if (trigger === "none" || levels === 0) return t("label.admin.validation.willAutoRelease");
    if (trigger === "abnormal") return t("label.admin.validation.willAutoReleaseNormal");
    return t("label.admin.validation.willRelease");
  };

  const getTriggerBadge = (trigger) => {
    const styles = {
      none: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      all: "bg-blue-50 text-blue-700 border border-blue-200",
      abnormal: "bg-amber-50 text-amber-700 border border-amber-200",
    };
    const labels = {
      none: t("label.admin.validation.trigger.none"),
      all: t("label.admin.validation.trigger.all"),
      abnormal: t("label.admin.validation.trigger.abnormal"),
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[trigger]}`}>{labels[trigger]}</span>;
  };

  const overrideCount = Object.keys(unitOverrides).length;
  const autoReleaseCount = LAB_UNITS.filter(u => {
    const ov = unitOverrides[u.id];
    if (ov) return ov.trigger === "none" || ov.levelsRequired === 0;
    return labDefault.trigger === "none" || labDefault.levelsRequired === 0;
  }).length;

  const ConfigPanel = ({ config, onChange, isLabUnit = false }) => {
    const triggerColor = config.trigger === "none" ? "border-l-emerald-400" :
      config.trigger === "abnormal" ? "border-l-amber-400" : "border-l-blue-400";

    return (
      <div className={`bg-white rounded-lg border border-gray-200 border-l-4 ${triggerColor}`}>
        <div className="p-5 space-y-5">
          {/* Trigger */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              {t("label.admin.validation.trigger")}
            </label>
            <div className="space-y-2">
              {[
                { value: "none", label: t("label.admin.validation.trigger.none"), desc: "Skip validation entirely — results release when saved", icon: Zap },
                { value: "all", label: t("label.admin.validation.trigger.all"), desc: "Every result must be manually validated before release", icon: Shield },
                { value: "abnormal", label: t("label.admin.validation.trigger.abnormal"), desc: "Normal results auto-release; abnormal results require validation", icon: ShieldAlert },
              ].map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${config.trigger === opt.value ? "border-teal-400 bg-teal-50/50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                  <input type="radio" name={`trigger-${isLabUnit || 'default'}`} value={opt.value} checked={config.trigger === opt.value}
                    onChange={() => onChange({ ...config, trigger: opt.value })}
                    className="mt-1 accent-teal-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5 block">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Levels Required */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {t("label.admin.validation.levelsRequired")}
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => removeLevel(config, onChange)}
                disabled={config.levelsRequired <= 0}
                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <div className="w-12 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-lg text-gray-800">
                {config.levelsRequired}
              </div>
              <button onClick={() => addLevel(config, onChange)}
                disabled={config.levelsRequired >= 5}
                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">
                {config.levelsRequired === 0 ? "No manual validation" : `${config.levelsRequired} validation level${config.levelsRequired > 1 ? "s" : ""}`}
              </span>
            </div>
          </div>

          {/* Level Role Assignments */}
          {config.levelsRequired > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                {t("label.admin.validation.role")}
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Only roles with the <code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">result.validate</code> permission are shown. Use the Role Builder to grant this permission to additional roles.
              </p>
              {ROLES_WITH_VALIDATE_PERMISSION.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>No roles currently hold the <code className="px-1 py-0.5 bg-amber-100 rounded text-xs font-mono">result.validate</code> permission. Use the Role Builder to assign this permission before configuring validation levels.</span>
                </div>
              ) : (
              <div className="space-y-2">
                {config.levels.map((level, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex-shrink-0">
                      {level.number}
                    </div>
                    <div className="text-sm text-gray-600 font-medium w-16 flex-shrink-0">
                      Level {level.number}
                    </div>
                    <select value={level.roleId}
                      onChange={(e) => {
                        const newLevels = [...config.levels];
                        newLevels[idx] = { ...newLevels[idx], roleId: e.target.value };
                        onChange({ ...config, levels: newLevels });
                      }}
                      className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
                      {ROLES_WITH_VALIDATE_PERMISSION.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    {idx === config.levels.length - 1 && config.levelsRequired > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium whitespace-nowrap">
                        Releases result
                      </span>
                    )}
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* Behavior Summary */}
          <div className={`rounded-lg p-3 flex items-start gap-2.5 text-sm ${
            config.trigger === "none" || config.levelsRequired === 0
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : config.trigger === "abnormal"
                ? "bg-amber-50 border border-amber-200 text-amber-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}>
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{getTriggerDescription(config.trigger, config.levelsRequired)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {showSaveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-[slideIn_0.3s_ease-out]">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">{t("label.admin.validation.saved")}</span>
        </div>
      )}

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{labDefault.levelsRequired}</div>
            <div className="text-xs text-gray-500 mt-0.5">Default validation levels</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{overrideCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Lab units with overrides</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{autoReleaseCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Auto-releasing all results</div>
          </div>
        </div>
      </div>

      {/* Lab-Wide Default */}
      <div>
        <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          {t("label.admin.validation.labDefault")}
        </h3>
        <ConfigPanel config={labDefault} onChange={setLabDefault} />
      </div>

      {/* Lab Unit Overrides */}
      <div>
        <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-600" />
          {t("label.admin.validation.labUnitOverrides")}
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">Lab Unit</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">Source</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">Trigger</th>
                <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">Levels</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">Roles</th>
                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {LAB_UNITS.map((unit) => {
                const override = unitOverrides[unit.id];
                const effective = override || labDefault;
                const isOverride = !!override;
                const isExpanded = expandedUnit === unit.id;
                const Icon = unit.icon;

                return (
                  <Fragment key={unit.id}>
                    <tr className={`border-b border-gray-100 transition-colors ${isExpanded ? "bg-teal-50/30" : "hover:bg-gray-50"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">{unit.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOverride ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                          {isOverride ? t("label.admin.validation.source.override") : t("label.admin.validation.source.default")}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getTriggerBadge(effective.trigger)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-gray-800">{effective.levelsRequired}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {effective.levels.map((l, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {ROLES_WITH_VALIDATE_PERMISSION.find(r => r.id === l.roleId)?.name}
                            </span>
                          ))}
                          {effective.levelsRequired === 0 && <span className="text-xs text-gray-400 italic">None</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-50 font-medium transition-colors">
                            {isExpanded ? "Close" : t("label.admin.validation.editOverride")}
                          </button>
                          {isOverride && (
                            <button onClick={() => {
                              const next = { ...unitOverrides };
                              delete next[unit.id];
                              setUnitOverrides(next);
                            }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                              {t("label.admin.validation.resetDefault")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50/50 border-b border-gray-200">
                          <ConfigPanel
                            config={override || { ...labDefault }}
                            onChange={(newConfig) => setUnitOverrides({ ...unitOverrides, [unit.id]: newConfig })}
                            isLabUnit={unit.id}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave}
          className="px-6 py-2.5 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition-colors shadow-sm">
          Save Configuration
        </button>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════
// COMPONENT: Notes Section (always-visible, collapsible)
// ═══════════════════════════════════════════════════════
const NotesSection = ({ notes: initialNotes }) => {
  const [notes, setNotes] = useState(initialNotes || []);
  const [isOpen, setIsOpen] = useState(true);
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [...prev, {
      id: Date.now(), date: new Date().toLocaleString(), author: "Current Validator", type: "validation", body: newNote.trim()
    }]);
    setNewNote("");
  };

  const noteTypeBadge = (type) => {
    const styles = {
      internal: "bg-gray-100 text-gray-600",
      external: "bg-blue-50 text-blue-700",
      modification: "bg-amber-50 text-amber-700",
      validation: "bg-teal-50 text-teal-700",
    };
    return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${styles[type] || styles.internal}`}>{type}</span>;
  };

  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FileText className="w-4 h-4 text-gray-500" />
          {t("label.validation.notes", "Notes")}
          {notes.length > 0 && <span className="text-xs font-medium bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{notes.length}</span>}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-4 py-3 space-y-2 bg-white">
          {notes.length === 0 && (
            <div className="text-sm text-gray-400 italic py-1">{t("label.validation.notes.empty", "No notes on this result.")}</div>
          )}
          {notes.map(note => (
            <div key={note.id} className="flex gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex-shrink-0 mt-0.5">{noteTypeBadge(note.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-800">{note.body}</div>
                <div className="text-xs text-gray-400 mt-0.5">{note.author} · {note.date}</div>
              </div>
            </div>
          ))}
          {/* Add Note form */}
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
            <input
              type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
              placeholder={t("placeholder.validation.notes.add", "Add a validation note...")}
              className="flex-1 h-8 px-3 text-sm border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              onKeyDown={e => { if (e.key === "Enter") handleAddNote(); }}
            />
            <button onClick={handleAddNote} disabled={!newNote.trim()}
              className="px-3 h-8 text-xs font-semibold bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {t("button.validation.notes.save", "Save Note")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// COMPONENT: Interpretation Section (always-visible, read-only)
// ═══════════════════════════════════════════════════════════
const InterpretationSection = ({ interpretation }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Microscope className="w-4 h-4 text-gray-500" />
          {t("label.validation.interpretation", "Interpretation")}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-white">
          {!interpretation ? (
            <div className="text-sm text-gray-400 italic">{t("label.validation.interpretation.empty", "No interpretation entered.")}</div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{interpretation.label}</span>
                <span className="text-xs text-gray-400">{interpretation.code}</span>
              </div>
              <div className="text-sm text-gray-700">{interpretation.text}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════
// COMPONENT: Expanded Tabs (6-tab bar matching Results Entry)
// ═══════════════════════════════════════════════════
const ExpandedTabs = ({ result }) => {
  const [activeTab, setActiveTab] = useState("method");
  const tabs = [
    { id: "method",      label: t("label.validation.tab.method", "Method & Reagents") },
    { id: "orderInfo",   label: t("label.validation.tab.orderInfo", "Order Info") },
    { id: "attachments", label: t("label.validation.tab.attachments", "Attachments") },
    { id: "qaqc",        label: t("label.validation.tab.qaqc", "QA/QC") },
    { id: "history",     label: t("label.validation.tab.history", "History") },
    { id: "referral",    label: t("label.validation.tab.referral", "Referral") },
  ];

  return (
    <div className="mx-6 bg-white rounded-b-lg border border-gray-200 overflow-hidden mb-1">
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-teal-700 border-b-2 border-teal-600 bg-teal-50/30" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {activeTab === "method" && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Analyzer</div>
              <div className="text-gray-800">{result.analyzer}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Method</div>
              <div className="text-gray-800">Automated counting / Impedance</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reagent Lot / Expiry</div>
              <div className="text-gray-800">Lot 2026-A45 · Exp 08/2026</div>
            </div>
          </div>
        )}
        {activeTab === "orderInfo" && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("label.validation.orderInfo.clinician", "Ordering Clinician")}</div>
              <div className="text-gray-800">{result.orderInfo?.clinician || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("label.validation.orderInfo.date", "Order Date")}</div>
              <div className="text-gray-800">{result.orderInfo?.orderDate || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("label.validation.orderInfo.priority", "Priority")}</div>
              <div className="text-gray-800">
                {result.orderInfo?.priority === "Stat" ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">{result.orderInfo.priority}</span>
                ) : (
                  result.orderInfo?.priority || "—"
                )}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("label.validation.orderInfo.clinicalNotes", "Clinical Notes")}</div>
              <div className="text-gray-800">{result.orderInfo?.clinicalNotes || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("label.validation.orderInfo.collection", "Specimen Collection")}</div>
              <div className="text-gray-800">{result.orderInfo?.collection || "—"}</div>
            </div>
          </div>
        )}
        {activeTab === "attachments" && (
          <div>
            {(result.attachments || []).length === 0 ? (
              <div className="text-sm text-gray-400 italic">{t("label.validation.attachments.empty", "No attachments.")}</div>
            ) : (
              <div className="space-y-2">
                {result.attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-3 p-2 rounded border border-gray-100 hover:bg-gray-50">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{att.name}</div>
                      <div className="text-xs text-gray-400">{att.size} · {att.date}</div>
                    </div>
                    <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">View</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "qaqc" && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">QC Status</div>
              <div className={`inline-flex items-center gap-1 text-sm font-medium ${result.qcStatus === "pass" ? "text-emerald-700" : "text-red-700"}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${result.qcStatus === "pass" ? "bg-emerald-400" : "bg-red-400"}`} />
                {result.qcStatus === "pass" ? "Passed" : "Failed"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Control Values</div>
              <div className="text-gray-800">L1: 4.85 (4.5-5.2) · L2: 9.10 (8.5-9.8)</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last QC Run</div>
              <div className="text-gray-800">02/26/2026 08:00</div>
            </div>
          </div>
        )}
        {activeTab === "history" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2 pr-4">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2 pr-4">Result</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2 pr-4">Unit</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2 pr-4">Delta</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2">Validated By</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b border-gray-50">
                <td className="py-2 pr-4">02/26/2026</td>
                <td className={`py-2 pr-4 font-bold ${!result.isNormal ? "text-orange-600" : "text-gray-800"}`}>{result.result}</td>
                <td className="py-2 pr-4">{result.unit}</td>
                <td className="py-2 pr-4">{result.flags?.includes("delta-check") ? <span className="text-red-500 font-medium">-27.7%</span> : "—"}</td>
                <td className="py-2 italic text-gray-400">Awaiting</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 pr-4">02/20/2026</td>
                <td className="py-2 pr-4 font-medium">14.1</td>
                <td className="py-2 pr-4">{result.unit}</td>
                <td className="py-2 pr-4">—</td>
                <td className="py-2">Dr. Williams (Level 1), Dr. Adams (Level 2)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">02/12/2026</td>
                <td className="py-2 pr-4 font-medium">14.5</td>
                <td className="py-2 pr-4">{result.unit}</td>
                <td className="py-2 pr-4">+2.8%</td>
                <td className="py-2">Dr. Williams (Level 1), Dr. Adams (Level 2)</td>
              </tr>
            </tbody>
          </table>
        )}
        {activeTab === "referral" && (
          <div className="text-sm text-gray-400 italic">{result.referral ? `Referred to ${result.referral.lab} on ${result.referral.date} — Status: ${result.referral.status}` : t("label.validation.referral.empty", "No referral information.")}</div>
        )}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════
// COMPONENT: Validation Page (Updated v2.1)
// ═══════════════════════════════════════════
const ValidationPage = () => {
  const [hasSearched, setHasSearched] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabUnit, setSelectedLabUnit] = useState("lu-hem");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [expandedRow, setExpandedRow] = useState("r5");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAutoValidated, setShowAutoValidated] = useState(false);
  const [showRetestModal, setShowRetestModal] = useState(false);
  const [retestReason, setRetestReason] = useState("");

  const displayedResults = useMemo(() => {
    let results = MOCK_RESULTS.filter(r => !r.isAutoValidated || showAutoValidated);
    return results;
  }, [showAutoValidated]);

  const normalCount = displayedResults.filter(r => r.isNormal && !r.isAutoValidated).length;
  const abnormalCount = displayedResults.filter(r => !r.isNormal && !r.isAutoValidated).length;
  const flaggedCount = displayedResults.filter(r => r.flags?.includes("delta-check")).length;
  const autoCount = MOCK_RESULTS.filter(r => r.isAutoValidated).length;

  const toggleRow = (id) => {
    const next = new Set(selectedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRows(next);
  };

  const toggleAll = () => {
    if (selectedRows.size === displayedResults.filter(r => !r.isAutoValidated).length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(displayedResults.filter(r => !r.isAutoValidated).map(r => r.id)));
    }
  };

  const selectNormal = () => {
    setSelectedRows(new Set(displayedResults.filter(r => r.isNormal && !r.isAutoValidated).map(r => r.id)));
  };

  const getSelectedBatchLabel = () => {
    const selected = displayedResults.filter(r => selectedRows.has(r.id));
    const willRelease = selected.filter(r => r.validationLevelCurrent >= r.validationLevelsRequired);
    const willAdvance = selected.filter(r => r.validationLevelCurrent < r.validationLevelsRequired);
    if (willRelease.length === selected.length) return t("label.validation.batch.validateRelease") + ` (${selected.length})`;
    if (willAdvance.length === selected.length) return `Validate Selected (${selected.length}) — advances to next level`;
    return `Validate Selected (${selected.length}) — ${willRelease.length} will release, ${willAdvance.length} will advance`;
  };

  const getFlagIcon = (flag) => {
    switch (flag) {
      case "above-normal": return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case "below-normal": return <TrendingDown className="w-4 h-4 text-yellow-600" />;
      case "delta-check": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const ValidationProgressBadge = ({ result }) => {
    if (result.validationLevelsRequired <= 1) return null;
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
        <Layers className="w-3 h-3" />
        {t("label.validation.progress", result.validationLevelCurrent, result.validationLevelsRequired)}
      </span>
    );
  };

  const ValidationProgressTimeline = ({ result }) => {
    const levels = [];
    for (let i = 1; i <= result.validationLevelsRequired; i++) {
      const histEntry = result.validationHistory.find(h => h.level === i);
      levels.push({ number: i, completed: !!histEntry, history: histEntry });
    }
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-semibold text-gray-800">Validation Progress</span>
        </div>
        <div className="space-y-2">
          {levels.map((level, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {level.completed ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : level.number === result.validationLevelCurrent ? (
                <CircleDot className="w-5 h-5 text-teal-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
              )}
              <div className={`flex-1 text-sm ${level.completed ? "text-gray-600" : level.number === result.validationLevelCurrent ? "text-teal-700 font-medium" : "text-gray-400"}`}>
                <span className="font-medium">Level {level.number}</span>
                {level.completed && level.history && (
                  <span className="text-gray-500"> — {level.history.role} · {t("label.validation.progress.complete", level.history.validatedBy, level.history.validatedAt)}</span>
                )}
                {!level.completed && level.number === result.validationLevelCurrent && (
                  <span className="text-teal-600"> — {t("label.validation.progress.awaitingYou")}</span>
                )}
                {!level.completed && level.number > result.validationLevelCurrent && (
                  <span className="text-gray-400"> — {t("label.validation.progress.awaiting")}</span>
                )}
              </div>
              {level.number === result.validationLevelsRequired && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 border border-teal-200 font-medium">Releases</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          Hematology requires 2 validations for all results
        </div>
      </div>
    );
  };

  const ActionButton = ({ result }) => {
    const isFinal = result.validationLevelCurrent >= result.validationLevelsRequired;
    if (result.isAutoValidated) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium flex items-center gap-1">
          <Bot className="w-3 h-3" />
          {t("label.validation.autoValidated")}
        </span>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <button onClick={() => setShowRetestModal(true)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 font-medium transition-colors">
          {t("label.validation.action.retest")}
        </button>
        <button className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
          isFinal
            ? "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
            : "border border-teal-400 text-teal-700 hover:bg-teal-50"
        }`}>
          {isFinal
            ? t("label.validation.action.validateRelease")
            : t("label.validation.action.validate", result.validationLevelCurrent, result.validationLevelsRequired)
          }
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-600" />
            {t("label.validation.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{t("label.validation.subtitle")}</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2 text-right">
          <div className="text-2xl font-bold text-teal-700">{displayedResults.filter(r => !r.isAutoValidated).length}</div>
          <div className="text-xs text-teal-600">{t("label.validation.count")}</div>
        </div>
      </div>

      {/* Config Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">Hematology:</span> 2 validation levels, All Results ·
        <span className="font-medium ml-1">Chemistry:</span> 1 level, Abnormal Only
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="w-48">
          <select value={selectedLabUnit} onChange={(e) => setSelectedLabUnit(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none">
            <option value="">All Lab Units</option>
            {LAB_UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by lab number, patient ID, or test name..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" />
        </div>
        <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`h-10 px-3 rounded-lg border text-sm font-medium flex items-center gap-1.5 transition-colors ${showAdvancedFilters ? "border-teal-400 bg-teal-50 text-teal-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium cursor-pointer hover:bg-emerald-100 transition-colors">
          Normal: {normalCount}
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium cursor-pointer hover:bg-orange-100 transition-colors">
          Abnormal: {abnormalCount}
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium cursor-pointer hover:bg-red-100 transition-colors">
          Flagged: {flaggedCount}
        </span>
        <div className="h-4 w-px bg-gray-300" />
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
          <input type="checkbox" checked={showAutoValidated} onChange={() => setShowAutoValidated(!showAutoValidated)}
            className="accent-teal-600 rounded" />
          <Bot className="w-3.5 h-3.5" />
          {t("label.validation.autoValidated.toggle")} ({autoCount})
        </label>
      </div>

      {/* Batch Actions */}
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={selectedRows.size > 0 && selectedRows.size === displayedResults.filter(r => !r.isAutoValidated).length}
            onChange={toggleAll} className="accent-teal-600 rounded" />
          <span className="text-sm text-gray-600">Select All</span>
        </label>
        <button onClick={selectNormal}
          className="text-sm text-teal-700 hover:text-teal-800 font-medium transition-colors">
          Select Normal ({normalCount})
        </button>
        <div className="h-4 w-px bg-gray-300" />
        <span className="text-sm text-gray-500">{selectedRows.size} selected</span>
        <div className="flex-1" />
        <button disabled={selectedRows.size === 0} onClick={() => setShowRetestModal(true)}
          className="text-sm px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Retest Selected
        </button>
        <button disabled={selectedRows.size === 0}
          className="text-sm px-4 py-1.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm">
          {selectedRows.size > 0 ? getSelectedBatchLabel() : "Validate Selected"}
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-8 px-3 py-2.5"></th>
              <th className="w-8 px-1 py-2.5"></th>
              <th className="w-5 px-1 py-2.5"></th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2.5">Sample / Patient</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2.5">Test</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2.5">Analyzer</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2.5">Range</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2.5">Result</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2.5">Level</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2.5">Flags</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2.5">Entered</th>
              <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedResults.map((result) => {
              const isExpanded = expandedRow === result.id;
              const isSelected = selectedRows.has(result.id);

              return (
                <Fragment key={result.id}>
                  {/* Collapsed Row */}
                  <tr className={`border-b border-gray-100 transition-colors cursor-pointer ${
                    result.isAutoValidated ? "bg-gray-50/50 opacity-70" :
                    isSelected ? "bg-teal-50/30" :
                    !result.isNormal ? "hover:bg-orange-50/30" : "hover:bg-gray-50"
                  }`}>
                    <td className="px-3 py-2.5">
                      {!result.isAutoValidated && (() => {
                        const hasOpenNce = result.nce && result.nce.status === "open";
                        return hasOpenNce ? (
                          <input type="checkbox" disabled title={t("label.validation.nce.cannotValidate", "Cannot validate — open NCE")}
                            className="accent-gray-400 rounded cursor-not-allowed opacity-50" />
                        ) : (
                          <input type="checkbox" checked={isSelected} onChange={() => toggleRow(result.id)}
                            className="accent-teal-600 rounded" />
                        );
                      })()}
                    </td>
                    <td className="px-1 py-2.5">
                      <button onClick={() => setExpandedRow(isExpanded ? null : result.id)}>
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-gray-400" />
                          : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </button>
                    </td>
                    <td className="px-1 py-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${result.qcStatus === "pass" ? "bg-emerald-400" : "bg-red-400"}`}
                        title={result.qcStatus === "pass" ? "QC Passed" : "QC Failed"} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm font-mono font-medium text-gray-800">{result.labNumber}</div>
                      <div className="text-xs text-gray-500">{result.patientId} · {result.sex}/{result.age}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm font-medium text-gray-800">{result.test}</div>
                      <div className="text-xs text-gray-500">{result.sampleType}</div>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-600">{result.analyzer}</td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm text-gray-600">{result.rangeText}</div>
                      <div className="text-xs text-gray-400">{result.unit}</div>
                    </td>
                    <td className={`px-3 py-2.5 ${RANGE_CELL_BG[evaluateResult(result.result, result.rangeBounds)] || ""}`}>
                      <span className={`text-sm font-bold ${RANGE_CELL_TEXT[evaluateResult(result.result, result.rangeBounds)] || "text-gray-800"}`}>
                        {result.result}
                      </span>
                      {evaluateResult(result.result, result.rangeBounds) !== "normal" && (
                        <span className={`ml-1.5 text-xs font-semibold px-1 py-0.5 rounded ${RANGE_FLAG_BADGE[evaluateResult(result.result, result.rangeBounds)] || ""}`}>
                          {evaluateResult(result.result, result.rangeBounds) === "abnormal" ? (parseFloat(result.result) > (result.rangeBounds?.normal?.high || 0) ? "H" : "L") : evaluateResult(result.result, result.rangeBounds) === "critical" ? "C" : "!"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <ValidationProgressBadge result={result} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {result.flags?.map((f, i) => <span key={i}>{getFlagIcon(f)}</span>)}
                        {result.nce && (
                          <span className={`px-1.5 py-0.5 rounded border text-xs font-semibold tracking-wide ${result.nce.status === "open" ? "bg-teal-50 text-teal-700 border-teal-300" : "bg-gray-100 text-gray-500 border-gray-300"}`}
                            title={`NCE ${result.nce.number} · ${result.nce.category} / ${result.nce.subcategory} · ${result.nce.severity} · ${result.nce.status}`}>
                            NCE
                          </span>
                        )}
                        {(result.notes || []).length > 0 && (
                          <span className="text-xs text-gray-400" title={`${result.notes.length} note(s)`}>
                            <FileText className="w-3 h-3 inline" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs text-gray-500">{result.enteredBy}</div>
                      <div className="text-xs text-gray-400">{result.enteredAt}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <ActionButton result={result} />
                    </td>
                  </tr>

                  {/* Expanded Row — Full Detail Panel (Enhancement E) */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={12} className="bg-gray-50/50 border-b border-gray-200">
                        {/* Patient Banner */}
                        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{result.patientName}</div>
                              <div className="text-xs text-gray-500">DOB: {result.dob} · ID: {result.patientId} · {result.sex} / {result.age}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Entered by <span className="font-medium">{result.enteredBy}</span> at {result.enteredAt}
                          </div>
                        </div>

                        {/* Validation Progress Timeline */}
                        {result.validationLevelsRequired > 1 && (
                          <div className="px-6 py-2">
                            <ValidationProgressTimeline result={result} />
                          </div>
                        )}

                        {/* Delta Check Alert */}
                        {result.flags?.includes("delta-check") && (
                          <div className="mx-6 mt-2 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-semibold text-red-800">{t("label.validation.deltaAlert", "Delta Check Alert")}</div>
                              <div className="text-xs text-red-600">Previous: 14.1 g/dL (02/20/2026) · Change: -27.7% · Threshold: 20%</div>
                            </div>
                          </div>
                        )}

                        {/* Range alert banners */}
                        {evaluateResult(result.result, result.rangeBounds) === "critical" && (
                          <div className="mx-6 mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-semibold text-orange-800">{t("label.validation.range.critical", "Critical Value")}</div>
                              <div className="text-xs text-orange-700">Result is outside critical/panic range. Verify result and clinical significance.</div>
                            </div>
                          </div>
                        )}
                        {evaluateResult(result.result, result.rangeBounds) === "invalid" && (
                          <div className="mx-6 mt-2 bg-red-900 border border-red-700 rounded-lg p-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-300 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-semibold text-red-100">{t("label.validation.range.invalid", "Invalid Range")}</div>
                              <div className="text-xs text-red-200">Result is outside valid physiological range. Recommend investigation and retest.</div>
                            </div>
                          </div>
                        )}

                        {/* ── Always-visible: Notes (view + add) ── */}
                        <div className="mx-6 mt-3 bg-white rounded-t-lg border border-gray-200 border-b-0 overflow-hidden">
                          <NotesSection notes={result.notes} />
                        </div>

                        {/* ── Always-visible: Interpretation (read-only) ── */}
                        <div className="mx-6 bg-white border-x border-gray-200 overflow-hidden">
                          <InterpretationSection interpretation={result.interpretation} />
                        </div>

                        {/* Result Summary & Info */}
                        <div className="mx-6 bg-white border-x border-b border-gray-200 p-4">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{t("label.validation.resultValue", "Result Value")}</label>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold px-2 py-1 rounded ${RANGE_CELL_BG[evaluateResult(result.result, result.rangeBounds)] || "bg-gray-50"} ${RANGE_CELL_TEXT[evaluateResult(result.result, result.rangeBounds)] || "text-gray-800"}`}>
                                  {result.result}
                                </span>
                                <span className="text-sm text-gray-500">{result.unit}</span>
                                {evaluateResult(result.result, result.rangeBounds) === "abnormal" && <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">{t("label.validation.range.abnormal", "Abnormal")}</span>}
                                {evaluateResult(result.result, result.rangeBounds) === "critical" && <span className="text-xs font-semibold text-orange-900 bg-orange-100 px-1.5 py-0.5 rounded">{t("label.validation.range.critical", "Critical")}</span>}
                                {evaluateResult(result.result, result.rangeBounds) === "invalid"  && <span className="text-xs font-semibold text-red-100 bg-red-800 px-1.5 py-0.5 rounded">{t("label.validation.range.invalid", "Invalid")}</span>}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{t("label.validation.normalRange", "Normal Range")}</label>
                              <div className="text-sm text-gray-800 mt-2">{result.rangeText} {result.unit}</div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{t("label.validation.method", "Method / Analyzer")}</label>
                              <div className="text-sm text-gray-800 mt-2">{result.analyzer}</div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{t("label.validation.labUnit", "Lab Unit")}</label>
                              <div className="text-sm text-gray-800 mt-2">{result.labUnit}</div>
                            </div>
                          </div>
                        </div>

                        {/* ── Full 6-Tab Bar ── */}
                        <ExpandedTabs result={result} />

                        {/* Row Actions */}
                        <div className="mx-6 mb-4 mt-3 flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Lab #: {result.labNumber} · Test: {result.test}
                          </div>
                          <ActionButton result={result} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>Showing 1–{displayedResults.length} of {displayedResults.length} results</div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30" disabled>
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-teal-600 text-white font-medium text-sm">1</button>
          <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <ChevronsRight className="w-4 h-4" />
          </button>
          <select className="ml-2 h-8 px-2 rounded-lg border border-gray-200 text-sm">
            <option>25 / page</option>
            <option>50 / page</option>
            <option>100 / page</option>
          </select>
        </div>
      </div>

      {/* Retest Modal */}
      {showRetestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-gray-800">Send for Retest</span>
              </div>
              <button onClick={() => { setShowRetestModal(false); setRetestReason(""); }}
                className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                This result will be sent back for retesting. The status will be reset to "Pending" and the validation pipeline will restart from level 1.
              </p>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Retest Reason <span className="text-red-500">*</span>
                </label>
                <textarea value={retestReason} onChange={(e) => setRetestReason(e.target.value)}
                  placeholder="Enter the reason for requesting a retest..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none" />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-xs text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0" />
                Retest requests are logged in the audit trail with your user ID and timestamp. All previous validation steps will need to be repeated.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => { setShowRetestModal(false); setRetestReason(""); }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button disabled={!retestReason.trim()}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                Confirm Retest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════════
// MAIN APP: Tab switching between views
// ═══════════════════════════════════════
export default function App() {
  const [activeView, setActiveView] = useState("validation");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800">OpenELIS Global</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setActiveView("admin")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === "admin" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                Admin Config
              </span>
            </button>
            <button onClick={() => setActiveView("validation")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === "validation" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Validation Page
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User className="w-4 h-4" />
            <span>Dr. Adams (Lab Manager)</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="text-sm text-gray-500 flex items-center gap-1.5">
          {activeView === "admin" ? (
            <>
              <span className="hover:text-teal-600 cursor-pointer">Admin</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-800 font-medium">Validation Configuration</span>
            </>
          ) : (
            <>
              <span className="hover:text-teal-600 cursor-pointer">Results</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-800 font-medium">Validation</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {activeView === "admin" ? <AdminValidationConfig /> : <ValidationPage />}
      </div>
    </div>
  );
}
