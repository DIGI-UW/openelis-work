import React, { useState, useMemo } from "react";
import {
  Search, ChevronDown, AlertTriangle, CheckCircle, Circle,
  Info, Copy, Shield, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// OpenELIS Global — Validation Page Stage 1 Mockup
// + Patient Demographics (Sex & Age D-M-Y)
//
// Minimal UI changes on top of the EXISTING flat-table layout.
//
// Changes from current UI:
//   1. New "Validation" column (only shown when multi-level)
//   2. Context-aware Save button label
//   3. Tooltip on level tag showing validation history
//   4. NEW: Sex and Age (D-M-Y) columns in results table
//
// Everything else (checkboxes, bulk actions, layout) is UNCHANGED.
// ═══════════════════════════════════════════════════════════════

// --- i18n stub (mirrors OpenELIS message properties pattern) ---
const messages = {
  "label.validation.patientSex": "Sex",
  "label.validation.patientAge": "Age (D-M-Y)",
  "label.validation.sex.male": "Male",
  "label.validation.sex.female": "Female",
  "label.validation.sex.unknown": "Unknown",
  "label.validation.sex.male.short": "M",
  "label.validation.sex.female.short": "F",
  "label.validation.sex.unknown.short": "U",
  "label.validation.age.unknown": "—",
  "label.validation.age.approximate.tooltip":
    "Age is approximate — sample collection date was not recorded",
  "label.validation.patientDemographics": "Patient Demographics",
};
const t = (key, fallback) => messages[key] || fallback || key;

// --- Age Calculation (D-M-Y format, relative to sample collection date) ---
const calculateAgeDMY = (dobStr, collectionDateStr) => {
  if (!dobStr) return null;
  // If no collection date, use current date and mark approximate
  const useApproximate = !collectionDateStr;
  const parse = (s) => {
    const [m, d, y] = s.split("/");
    return new Date(+y, +m - 1, +d);
  };
  const birth = parse(dobStr);
  const reference = collectionDateStr
    ? parse(collectionDateStr)
    : new Date();
  if (birth > reference) return null;

  let years = reference.getFullYear() - birth.getFullYear();
  let months = reference.getMonth() - birth.getMonth();
  let days = reference.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(reference.getFullYear(), reference.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const age = `${days}D-${months}M-${years}Y`;
  return useApproximate ? `~${age}` : age;
};

const getSexShort = (sex) => {
  if (sex === "M") return t("label.validation.sex.male.short", "M");
  if (sex === "F") return t("label.validation.sex.female.short", "F");
  return t("label.validation.sex.unknown.short", "U");
};

const getSexFull = (sex) => {
  if (sex === "M") return t("label.validation.sex.male", "Male");
  if (sex === "F") return t("label.validation.sex.female", "Female");
  return t("label.validation.sex.unknown", "Unknown");
};

// --- Lab Configuration (simulates admin setting) ---
const LAB_CONFIG = {
  levelsRequired: 2, // Change to 1 to see current/unchanged UI
  trigger: "all",
  levels: [
    { number: 1, roleName: "Supervisor" },
    { number: 2, roleName: "Lab Manager" },
  ],
};

// --- Mock Data ---
const MOCK_RESULTS = [
  {
    id: "r1",
    sampleInfo: "24-TST-000-00R",
    testName: "Actin Smooth Muscle",
    specimen: "Immunohistochemistry specimen",
    normalRange: "",
    result: "test",
    sex: "F",
    dob: "05/15/1988",
    collectionDate: "03/01/2026",
    validationLevelsRequired: LAB_CONFIG.levelsRequired,
    validationLevelCurrent: 1,
    validationHistory: [],
    isNonconforming: false,
  },
  {
    id: "r2",
    sampleInfo: "24-TST-000-00R",
    testName: "Anti-CD22",
    specimen: "Immunohistochemistry specimen",
    normalRange: "",
    result: "test",
    sex: "F",
    dob: "05/15/1988",
    collectionDate: "03/01/2026",
    validationLevelsRequired: LAB_CONFIG.levelsRequired,
    validationLevelCurrent: 1,
    validationHistory: [],
    isNonconforming: false,
  },
  {
    id: "r3",
    sampleInfo: "24-TST-000-00R",
    testName: "Anti-hepatocyte Specific Antigen (Hep Par-1)",
    specimen: "Immunohistochemistry specimen",
    normalRange: "",
    result: "test",
    sex: "F",
    dob: "05/15/1988",
    collectionDate: "03/01/2026",
    validationLevelsRequired: LAB_CONFIG.levelsRequired,
    validationLevelCurrent: 1,
    validationHistory: [],
    isNonconforming: false,
  },
  {
    id: "r4",
    sampleInfo: "24-TST-000-015",
    testName: "Actin Smooth Muscle",
    specimen: "Immunohistochemistry specimen",
    normalRange: "",
    result: "30 %",
    sex: "M",
    dob: "11/20/1975",
    collectionDate: "03/01/2026",
    validationLevelsRequired: LAB_CONFIG.levelsRequired,
    validationLevelCurrent: 2,
    validationHistory: [
      {
        level: 1,
        validatedBy: "Dr. Williams",
        validatedAt: "03/01/2026 10:15",
        role: "Supervisor",
        action: "VALIDATE",
      },
    ],
    isNonconforming: false,
  },
  {
    id: "r5",
    sampleInfo: "24-TST-000-015",
    testName: "AMACR (p504 s)",
    specimen: "Immunohistochemistry specimen",
    normalRange: "",
    result: "10-15 %",
    sex: "M",
    dob: "11/20/1975",
    collectionDate: "03/01/2026",
    validationLevelsRequired: LAB_CONFIG.levelsRequired,
    validationLevelCurrent: 2,
    validationHistory: [
      {
        level: 1,
        validatedBy: "Dr. Williams",
        validatedAt: "03/01/2026 10:15",
        role: "Supervisor",
        action: "VALIDATE",
      },
    ],
    isNonconforming: false,
  },
  {
    id: "r6",
    sampleInfo: "24-TST-000-015",
    testName: "Anti-CD 3",
    specimen: "Immunohistochemistry specimen",
    normalRange: "",
    result: "",
    sex: "M",
    dob: "11/20/1975",
    collectionDate: "03/01/2026",
    validationLevelsRequired: LAB_CONFIG.levelsRequired,
    validationLevelCurrent: 1,
    validationHistory: [],
    isNonconforming: true,
  },
  {
    id: "r7",
    sampleInfo: "TESTA240000000000053",
    testName: "Anti-ER",
    specimen: "Immunohistochemistry specimen",
    normalRange: "",
    result: "See Pathology Report",
    sex: "F",
    dob: "08/10/2000",
    collectionDate: "03/02/2026",
    validationLevelsRequired: LAB_CONFIG.levelsRequired,
    validationLevelCurrent: 2,
    validationHistory: [
      {
        level: 1,
        validatedBy: "J. Smith",
        validatedAt: "03/02/2026 14:30",
        role: "Supervisor",
        action: "VALIDATE",
      },
    ],
    isNonconforming: false,
  },
  // --- Neonatal patient (tests age D-M-Y for very young patients) ---
  {
    id: "r8",
    sampleInfo: "26-NEO-000-001",
    testName: "Bilirubin Total",
    specimen: "Serum specimen",
    normalRange: "0.1 - 12.0 mg/dL",
    result: "14.2 mg/dL",
    sex: "M",
    dob: "12/01/2025",
    collectionDate: "03/05/2026",
    validationLevelsRequired: LAB_CONFIG.levelsRequired,
    validationLevelCurrent: 1,
    validationHistory: [],
    isNonconforming: false,
  },
  // --- Missing DOB patient (tests graceful degradation) ---
  {
    id: "r9",
    sampleInfo: "26-UNK-000-002",
    testName: "CBC",
    specimen: "Blood specimen",
    normalRange: "",
    result: "See report",
    sex: null,
    dob: null,
    collectionDate: "03/03/2026",
    validationLevelsRequired: LAB_CONFIG.levelsRequired,
    validationLevelCurrent: 1,
    validationHistory: [],
    isNonconforming: false,
  },
];

// ═══════════════════════════════════
// Validation Level Tag + Tooltip
// ═══════════════════════════════════
const ValidationLevelTag = ({ result }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { validationLevelsRequired: total, validationLevelCurrent: current, validationHistory } = result;

  if (total <= 1) return null;

  const hasCompletedLevels = current > 1;
  const isAtFinalLevel = current === total;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
          isAtFinalLevel
            ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
        }`}
      >
        {hasCompletedLevels && <CheckCircle className="w-3 h-3" />}
        Validation {current}/{total}
      </button>

      {/* Tooltip / Popover */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 bg-gray-900 text-white rounded-lg shadow-xl p-3 text-xs">
          <div className="font-semibold mb-2 text-gray-200">Validation Progress</div>
          <div className="space-y-2">
            {Array.from({ length: total }, (_, i) => {
              const levelNum = i + 1;
              const historyEntry = validationHistory.find((h) => h.level === levelNum);
              const levelConfig = LAB_CONFIG.levels[i];
              const roleName = levelConfig?.roleName || "Validator";
              const isCurrent = levelNum === current;
              const isComplete = levelNum < current;

              return (
                <div key={levelNum} className="flex items-start gap-2">
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  ) : isCurrent ? (
                    <Circle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium text-gray-100">
                      Level {levelNum} ({roleName})
                    </div>
                    {isComplete && historyEntry ? (
                      <div className="text-gray-400">
                        {historyEntry.validatedBy} — {historyEntry.validatedAt}
                      </div>
                    ) : isCurrent ? (
                      <div className="text-blue-300">Awaiting your validation</div>
                    ) : (
                      <div className="text-gray-500">Pending</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════
// Main Validation Page
// ═══════════════════════════════════
export default function ValidationPageStage1() {
  const [selectedUnit, setSelectedUnit] = useState("Immunohistochemistry");
  const [saveChecked, setSaveChecked] = useState({});
  const [retestChecked, setRetestChecked] = useState({});
  const [saveAllNormal, setSaveAllNormal] = useState(false);
  const [saveAllResults, setSaveAllResults] = useState(false);
  const [retestAll, setRetestAll] = useState(false);

  const isMultiLevel = LAB_CONFIG.levelsRequired > 1;

  // Calculate save button label
  const saveButtonLabel = useMemo(() => {
    const checkedIds = Object.entries(saveChecked)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (!isMultiLevel || checkedIds.length === 0) return "Save";

    const willRelease = checkedIds.filter((id) => {
      const r = MOCK_RESULTS.find((x) => x.id === id);
      return r && r.validationLevelCurrent === r.validationLevelsRequired;
    });
    const willAdvance = checkedIds.filter((id) => {
      const r = MOCK_RESULTS.find((x) => x.id === id);
      return r && r.validationLevelCurrent < r.validationLevelsRequired;
    });

    if (willRelease.length > 0 && willAdvance.length > 0) {
      return `Save — ${willRelease.length} will release, ${willAdvance.length} will advance`;
    }
    if (willRelease.length > 0) {
      return `Save — validates & releases ${willRelease.length} result(s)`;
    }
    if (willAdvance.length > 0) {
      return `Save — advances ${willAdvance.length} result(s) to next level`;
    }
    return "Save";
  }, [saveChecked, isMultiLevel]);

  const handleSaveCheck = (id, checked) => {
    setSaveChecked((prev) => ({ ...prev, [id]: checked }));
    if (checked) setRetestChecked((prev) => ({ ...prev, [id]: false }));
  };

  const handleRetestCheck = (id, checked) => {
    setRetestChecked((prev) => ({ ...prev, [id]: checked }));
    if (checked) setSaveChecked((prev) => ({ ...prev, [id]: false }));
  };

  const handleSaveAllNormal = (checked) => {
    setSaveAllNormal(checked);
    if (checked) {
      const normalIds = {};
      MOCK_RESULTS.filter((r) => !r.isNonconforming).forEach((r) => {
        normalIds[r.id] = true;
      });
      setSaveChecked((prev) => ({ ...prev, ...normalIds }));
    }
  };

  const handleSaveAllResults = (checked) => {
    setSaveAllResults(checked);
    if (checked) {
      const allIds = {};
      MOCK_RESULTS.forEach((r) => {
        allIds[r.id] = true;
      });
      setSaveChecked((prev) => ({ ...prev, ...allIds }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page container */}
      <div className="max-w-[1280px] mx-auto px-6 py-4">
        {/* Breadcrumb */}
        <div className="text-sm text-blue-600 mb-1">
          <span className="hover:underline cursor-pointer">Home</span>
          <span className="text-gray-400 mx-1">/</span>
        </div>
        <h1 className="text-2xl font-normal text-gray-900 mb-6">Validation</h1>

        {/* Main content card */}
        <div className="bg-white rounded border border-gray-200 p-6">
          {/* Search section */}
          <div className="mb-6">
            <div className="text-base font-semibold text-gray-900 mb-1">Search</div>
            <div className="text-sm text-gray-500 mb-2">Select Test Unit</div>
            <div className="relative w-80">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full h-10 px-3 pr-10 border-2 border-blue-500 rounded bg-white text-sm text-gray-900 appearance-none focus:outline-none"
              >
                <option>Immunohistochemistry</option>
                <option>Hematology</option>
                <option>Chemistry</option>
                <option>Microbiology</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Info banner + bulk actions */}
          <div className="flex items-center gap-6 border border-gray-200 rounded-lg px-4 py-3 mb-4 bg-white">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>= Sample or Order is nonconforming or Test has been rejected</span>
            </div>
            <div className="flex items-center gap-6 ml-auto">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAllNormal}
                  onChange={(e) => handleSaveAllNormal(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                Save All Normal
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAllResults}
                  onChange={(e) => handleSaveAllResults(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                Save All Results
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={retestAll}
                  onChange={(e) => setRetestAll(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                Retest All Tests
              </label>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RESULTS TABLE — This is where changes live  */}
          {/* ═══════════════════════════════════════════ */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-sm font-medium text-gray-600 py-3 px-3 w-48">
                    Sample Info
                  </th>
                  {/* ═══ NEW: Sex & Age columns (Demographics Change) ═══ */}
                  <th className="text-left text-sm font-medium text-gray-600 py-3 px-3 w-12">
                    {t("label.validation.patientSex", "Sex")}
                  </th>
                  <th className="text-left text-sm font-medium text-gray-600 py-3 px-3 w-32">
                    {t("label.validation.patientAge", "Age (D-M-Y)")}
                  </th>
                  <th className="text-left text-sm font-medium text-gray-600 py-3 px-3">
                    Test Name
                  </th>
                  <th className="text-left text-sm font-medium text-gray-600 py-3 px-3 w-28">
                    Normal Range
                  </th>
                  <th className="text-left text-sm font-medium text-gray-600 py-3 px-3 w-28">
                    Result
                  </th>
                  {/* ═══ NEW COLUMN (Stage 1 Change #1) ═══ */}
                  {isMultiLevel && (
                    <th className="text-left text-sm font-medium text-gray-600 py-3 px-3 w-36">
                      Validation
                    </th>
                  )}
                  <th className="text-center text-sm font-medium text-gray-600 py-3 px-3 w-16">
                    Save
                  </th>
                  <th className="text-center text-sm font-medium text-gray-600 py-3 px-3 w-16">
                    Retest
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RESULTS.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{row.sampleInfo}</span>
                      </div>
                    </td>
                    {/* ═══ NEW: Sex & Age cells (Demographics Change) ═══ */}
                    <td className="py-4 px-3">
                      <span className="text-sm font-bold text-gray-800">
                        {getSexShort(row.sex)}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      {(() => {
                        const age = calculateAgeDMY(row.dob, row.collectionDate);
                        if (!age) return <span className="text-sm text-gray-400">{t("label.validation.age.unknown", "\u2014")}</span>;
                        const isApproximate = age.startsWith("~");
                        return (
                          <span
                            className={`text-sm font-mono ${isApproximate ? "text-amber-600 italic" : "text-gray-700"}`}
                            title={isApproximate ? t("label.validation.age.approximate.tooltip") : undefined}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {age}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        {row.isNonconforming && (
                          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        )}
                        <div>
                          <div className="text-sm text-gray-900">{row.testName}</div>
                          <div className="text-xs text-gray-500">({row.specimen})</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-700">{row.normalRange}</td>
                    <td className="py-4 px-3 text-sm text-gray-900">{row.result}</td>

                    {/* ═══ NEW: Validation level tag (Stage 1 Change #1) ═══ */}
                    {isMultiLevel && (
                      <td className="py-4 px-3">
                        <ValidationLevelTag result={row} />
                      </td>
                    )}

                    <td className="py-4 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!saveChecked[row.id]}
                        onChange={(e) => handleSaveCheck(row.id, e.target.checked)}
                        className="w-4 h-4 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!retestChecked[row.id]}
                        onChange={(e) => handleRetestCheck(row.id, e.target.checked)}
                        className="w-4 h-4 border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-0">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Items per page</span>
              <select className="h-8 px-2 border border-gray-300 rounded text-sm bg-white">
                <option>100</option>
                <option>50</option>
                <option>25</option>
              </select>
              <span className="ml-4">1-{MOCK_RESULTS.length} of {MOCK_RESULTS.length} items</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <select className="h-8 px-2 border border-gray-300 rounded text-sm bg-white">
                <option>1</option>
              </select>
              <span>of 1 page</span>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30" disabled>
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30" disabled>
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ SAVE BUTTON (Stage 1 Change #2) ═══ */}
        <div className="mt-4">
          <button className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded hover:bg-blue-700 transition-colors">
            {saveButtonLabel}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STAGE 1 CHANGE ANNOTATIONS (for review, not in prod)   */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-yellow-800 mb-3">
            <Info className="w-4 h-4" />
            Stage 1 + Demographics Changes Summary (annotation only — not shown in production)
          </div>
          <div className="space-y-2 text-sm text-yellow-700">
            <div className="flex items-start gap-2">
              <span className="font-bold text-yellow-800">Change #1:</span>
              <span>
                New "Validation" column added between Result and Save. Shows "Validation 1/2" or
                "Validation 2/2 ✓" tags. Hover/click shows tooltip with validation history
                (who validated, when). <strong>Only shown when lab config has levelsRequired &gt; 1</strong>.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-yellow-800">Change #2:</span>
              <span>
                Save button label updates dynamically based on what's checked. Shows counts of
                results that will release vs advance to next level. For single-level labs, label stays "Save".
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-yellow-800">Change #3:</span>
              <span>
                Tooltip on the validation tag (hover or click) shows full validation progress: completed
                levels with validator name/date, and pending levels.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-yellow-800">Change #4 (NEW — Demographics):</span>
              <span>
                New <strong>Sex</strong> and <strong>Age (D-M-Y)</strong> columns added between
                Sample Info and Test Name. Sex shows single-letter abbreviation (M/F/U). Age shows
                Days-Months-Years calculated from patient DOB relative to sample collection date
                (e.g., "4D-3M-0Y" for a 3-month-old neonate). Missing DOB shows "—". Missing
                collection date shows approximate age with "~" prefix in amber italic. Includes
                mock data for neonatal patient (r8) and missing-DOB patient (r9).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-yellow-800">Unchanged:</span>
              <span>
                Breadcrumb, page title, search/filter, bulk checkboxes (Save All Normal, Save All
                Results, Retest All Tests), pagination, flat table layout (no
                expandable rows). All of these remain identical to the current UI.
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-yellow-600">
            Try checking some Save checkboxes to see the Save button label change. Hover over the
            "Validation X/Y" tags to see the history tooltip. Note the neonatal patient (r8) showing
            a young age like "4D-3M-0Y" and the missing-DOB patient (r9) showing "—" for age.
          </div>
        </div>
      </div>
    </div>
  );
}
