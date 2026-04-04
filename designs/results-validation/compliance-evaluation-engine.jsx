/**
 * S-05 Compliance Evaluation Engine — Results Entry Extension Mockup
 * OpenELIS Global
 *
 * Shows compliance evaluation integrated into results entry page:
 * - Compliance indicators (Pass/Marginal/Fail) alongside clinical range indicators
 * - Compliance summary banner at top
 * - Expanded detail panel with Compliance Tile
 * - Descriptive ComboBox for qualitative tests
 * - Unit mismatch warnings
 * - Override form for lab managers
 */
import { useState } from "react";
import {
  AlertCircle, ChevronDown, ChevronUp, Trash2, Check, X
} from "lucide-react";

// ---------------------------------------------------------------------------
// i18n stub
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function evaluateCompliance(resultValue, threshold) {
  if (!resultValue || resultValue === "") return "pending";

  const num = parseFloat(resultValue);
  if (isNaN(num)) return "pending";

  const { thresholdType, valueLower, valueUpper, marginPercent = 0 } = threshold;

  if (thresholdType === "MAX") {
    if (num > valueUpper) return "fail";
    const marginBound = valueUpper * (1 - marginPercent / 100);
    if (num > marginBound) return "marginal";
    return "pass";
  }

  if (thresholdType === "MIN") {
    if (num < valueLower) return "fail";
    const marginBound = valueLower * (1 + marginPercent / 100);
    if (num < marginBound) return "marginal";
    return "pass";
  }

  if (thresholdType === "RANGE") {
    if (num < valueLower || num > valueUpper) return "fail";
    const range = valueUpper - valueLower;
    const lowerMargin = valueLower + range * (marginPercent / 100);
    const upperMargin = valueUpper - range * (marginPercent / 100);
    if (num < lowerMargin || num > upperMargin) return "marginal";
    return "pass";
  }

  return "pending";
}

function evaluateDescriptive(selectedTags, expectedTags) {
  if (!selectedTags || selectedTags.length === 0) return "pending";
  // Pass if all expected tags are in selected tags
  const hasAll = expectedTags.every(et => selectedTags.includes(et));
  return hasAll ? "pass" : "fail";
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const COMPLIANCE_STANDARD = {
  name: "PP No. 22/2021 — Drinking Water Quality",
  version: "2021",
};

const DESCRIPTIVE_TAGS = [
  { code: "ODOR_NONE", category: "Odor", displayText: "No odor" },
  { code: "ODOR_CLEAR", category: "Odor", displayText: "Odorless" },
  { code: "COLOR_CLEAR", category: "Color", displayText: "Clear" },
  { code: "COLOR_COLORLESS", category: "Color", displayText: "Colorless" },
];

const INITIAL_RESULTS = [
  {
    id: "1",
    labNumber: "WQ-001",
    testName: "pH",
    sampleType: "Water Sample",
    normalRange: "6.5–8.5",
    unit: "pH",
    result: "7.8",
    status: "entered",
    compliance: {
      thresholdType: "RANGE",
      parameterGroup: "Physical Parameters",
      valueLower: 6.5,
      valueUpper: 8.5,
      marginPercent: 10,
      status: "pass",
      standardId: 101,
    },
  },
  {
    id: "2",
    labNumber: "WQ-001",
    testName: "Turbidity",
    sampleType: "Water Sample",
    normalRange: "max 5",
    unit: "NTU",
    result: "4.5",
    status: "entered",
    compliance: {
      thresholdType: "MAX",
      parameterGroup: "Physical Parameters",
      valueUpper: 5.0,
      marginPercent: 15,
      status: "marginal",
      standardId: 101,
    },
  },
  {
    id: "3",
    labNumber: "WQ-001",
    testName: "Lead",
    sampleType: "Water Sample",
    normalRange: "max 0.01",
    unit: "mg/L",
    result: "0.015",
    status: "entered",
    compliance: {
      thresholdType: "MAX",
      parameterGroup: "Chemical Parameters",
      valueUpper: 0.01,
      marginPercent: 10,
      status: "fail",
      standardId: 101,
      unitMismatch: false,
    },
  },
  {
    id: "4",
    labNumber: "WQ-001",
    testName: "E. coli",
    sampleType: "Water Sample",
    normalRange: "max 0",
    unit: "CFU/100mL",
    result: "0",
    status: "entered",
    compliance: {
      thresholdType: "MAX",
      parameterGroup: "Microbiological Parameters",
      valueUpper: 0,
      marginPercent: 0,
      status: "pass",
      standardId: 101,
    },
  },
  {
    id: "5",
    labNumber: "WQ-001",
    testName: "Odor",
    sampleType: "Water Sample",
    normalRange: "Expected: Odorless, Clear",
    unit: "Descriptive",
    result: "ODOR_NONE,COLOR_CLEAR",
    resultTags: ["No odor", "Clear"],
    status: "entered",
    compliance: {
      thresholdType: "DESCRIPTIVE",
      parameterGroup: "Physical Parameters",
      expectedTags: ["ODOR_NONE"],
      status: "pass",
      standardId: 101,
      tagCategoryHint: "Odor",
    },
  },
];

// ---------------------------------------------------------------------------
// Tiny Components
// ---------------------------------------------------------------------------
function ComplianceTag({ status }) {
  const config = {
    pass: { label: "Compliant", bg: "bg-green-100", text: "text-green-800" },
    marginal: { label: "Marginal", bg: "bg-yellow-100", text: "text-yellow-800" },
    fail: { label: "Non-Compliant", bg: "bg-red-100", text: "text-red-800" },
    "unit-mismatch": { label: "Unit Mismatch", bg: "bg-purple-100", text: "text-purple-800" },
    pending: { label: null, bg: null, text: null },
  };
  const cfg = config[status] || config.pending;
  if (!cfg.label) return null;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

function ComplianceSummaryBanner({ results }) {
  const pass = results.filter(r => r.compliance?.status === "pass").length;
  const marginal = results.filter(r => r.compliance?.status === "marginal").length;
  const fail = results.filter(r => r.compliance?.status === "fail").length;

  let overallStatus = "pending";
  if (fail > 0) overallStatus = "fail";
  else if (marginal > 0) overallStatus = "marginal";
  else if (pass === results.length) overallStatus = "pass";

  const statusConfig = {
    pass: { label: "All Compliant", bg: "bg-green-50", border: "border-green-200", text: "text-green-800" },
    marginal: { label: "Issues Found", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800" },
    fail: { label: "Issues Found", bg: "bg-red-50", border: "border-red-200", text: "text-red-800" },
    pending: { label: "Pending", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800" },
  };

  const cfg = statusConfig[overallStatus];

  return (
    <div className={`border-l-4 ${cfg.border} ${cfg.bg} p-4 mb-4`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-semibold ${cfg.text}`}>{COMPLIANCE_STANDARD.name}</h3>
          <p className={`text-xs ${cfg.text} mt-1`}>
            {t("label.compliance.summary.pass", "Pass")} {pass} · {t("label.compliance.summary.marginal", "Marginal")} {marginal} · {t("label.compliance.summary.fail", "Fail")} {fail}
          </p>
        </div>
        <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
      </div>
    </div>
  );
}

function DescriptiveTagSelector({ selectedTags, onTagToggle }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen(!open)}
      >
        {selectedTags.length === 0 ? t("label.compliance.tags.selectTags", "Select observed conditions") : `${selectedTags.length} selected`}
      </button>
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {DESCRIPTIVE_TAGS.map(tag => (
            <label key={tag.code} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.code)}
                onChange={() => onTagToggle(tag.code)}
                className="rounded"
              />
              <span className="ml-2 text-sm">{tag.displayText}</span>
              <span className="ml-auto text-xs text-gray-400">{tag.category}</span>
            </label>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {selectedTags.map(tc => {
          const tag = DESCRIPTIVE_TAGS.find(t => t.code === tc);
          return tag ? (
            <span key={tc} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              {tag.displayText}
              <button onClick={() => onTagToggle(tc)} className="ml-1 hover:text-blue-900"><X className="w-3 h-3" /></button>
            </span>
          ) : null;
        })}
      </div>
    </div>
  );
}

function ComplianceDetailTile({ result, onOverrideOpen }) {
  const comp = result.compliance;
  if (!comp) return null;

  const thresholdLabel = {
    MAX: `≤ ${comp.valueUpper}`,
    MIN: `≥ ${comp.valueLower}`,
    RANGE: `${comp.valueLower}–${comp.valueUpper}`,
    DESCRIPTIVE: comp.expectedTags?.join(", ") || "—",
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">{t("label.compliance.evaluation.title", "Compliance Evaluation")}</h4>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div>
          <span className="text-gray-500">{t("label.compliance.evaluation.standard", "Standard")}</span>
          <p className="text-gray-900 font-medium">{COMPLIANCE_STANDARD.name}</p>
        </div>
        <div>
          <span className="text-gray-500">{t("label.compliance.evaluation.version", "Version")}</span>
          <p className="text-gray-900 font-medium">{COMPLIANCE_STANDARD.version}</p>
        </div>
        <div>
          <span className="text-gray-500">{t("label.compliance.evaluation.parameterGroup", "Parameter Group")}</span>
          <p className="text-gray-900 font-medium">{comp.parameterGroup}</p>
        </div>
        <div>
          <span className="text-gray-500">{t("label.compliance.evaluation.thresholdType", "Type")}</span>
          <p className="text-gray-900 font-medium">{comp.thresholdType}</p>
        </div>
      </div>

      <table className="w-full text-xs mb-4 border border-gray-200 rounded">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left text-gray-600 font-semibold border-b">Type</th>
            <th className="px-2 py-1 text-left text-gray-600 font-semibold border-b">Limit</th>
            <th className="px-2 py-1 text-left text-gray-600 font-semibold border-b">Margin %</th>
            <th className="px-2 py-1 text-left text-gray-600 font-semibold border-b">Result</th>
            <th className="px-2 py-1 text-left text-gray-600 font-semibold border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="px-2 py-1">{comp.thresholdType}</td>
            <td className="px-2 py-1">{thresholdLabel} {result.unit}</td>
            <td className="px-2 py-1">{comp.marginPercent || 0}%</td>
            <td className="px-2 py-1 font-medium">{result.result} {result.unit}</td>
            <td className="px-2 py-1"><ComplianceTag status={comp.status} /></td>
          </tr>
        </tbody>
      </table>

      <button
        onClick={() => onOverrideOpen(result.id)}
        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {t("button.compliance.override", "Override")}
      </button>
    </div>
  );
}

function OverrideForm({ result, onClose, onSave }) {
  const [overrideValue, setOverrideValue] = useState("pass");
  const [justification, setJustification] = useState("");

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50 mt-2">
      <h5 className="text-sm font-semibold text-gray-900 mb-3">{t("label.compliance.override.title", "Override Evaluation")}</h5>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t("label.compliance.override.value", "Override To")}</label>
          <select value={overrideValue} onChange={e => setOverrideValue(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
            <option value="pass">Pass / Compliant</option>
            <option value="fail">Fail / Non-Compliant</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t("label.compliance.override.justification", "Justification")}</label>
          <textarea
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder={t("label.compliance.override.justificationPlaceholder", "Explain why...")}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded min-h-[60px]"
          />
          <p className="text-xs text-gray-500 mt-1">Min 10 characters</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onSave(result.id, overrideValue, justification)}
            disabled={justification.length < 10}
            className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {t("button.compliance.override.save", "Save Override")}
          </button>
          <button
            onClick={() => onClose()}
            className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            {t("button.compliance.override.cancel", "Cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results List Row (collapsed)
// ---------------------------------------------------------------------------
function ResultRow({ result, expanded, onToggle, onResultChange, onTagToggle }) {
  const isDescriptive = result.compliance?.thresholdType === "DESCRIPTIVE";
  const selectedTags = isDescriptive ? (result.result || "").split(",").filter(t => t) : [];

  return (
    <div className="border border-gray-200 rounded-lg mb-3">
      {/* Collapsed row */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white cursor-pointer hover:bg-gray-50"
        onClick={() => onToggle(result.id)}
      >
        <div className="w-6 h-6 flex items-center justify-center">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-900">{result.labNumber}</p>
          </div>
          <div>
            <p className="text-gray-900">{result.testName}</p>
          </div>
          <div>
            <p className="text-gray-600">{result.sampleType}</p>
          </div>
          <div>
            <p className="text-gray-600">{result.normalRange}</p>
          </div>
          <div>
            {isDescriptive ? (
              <div className="flex flex-wrap gap-1">
                {result.resultTags?.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
                {result.resultTags?.length > 2 && <span className="text-xs text-gray-600">+{result.resultTags.length - 2}</span>}
              </div>
            ) : (
              <p className="font-medium text-gray-900">{result.result}</p>
            )}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <ComplianceTag status={result.compliance?.status} />
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-4">
            {/* Input field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Result Value</label>
              {isDescriptive ? (
                <DescriptiveTagSelector selectedTags={selectedTags} onTagToggle={tags => onTagToggle(result.id, tags)} />
              ) : (
                <input
                  type="text"
                  value={result.result}
                  onChange={e => onResultChange(result.id, e.target.value)}
                  placeholder="Enter numeric value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              )}
            </div>

            {/* Unit mismatch warning (example) */}
            {result.id === "3" && (
              <div className="flex gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800">
                  {t("message.compliance.evaluation.unitMismatch", "Unit mismatch: result in {0}, threshold in {1}. Cannot auto-evaluate.")}
                </p>
              </div>
            )}

            {/* Compliance detail tile */}
            <ComplianceDetailTile result={result} onOverrideOpen={() => {}} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function S05ComplianceEvaluationMockup() {
  const [results, setResults] = useState(INITIAL_RESULTS);
  const [expandedId, setExpandedId] = useState(null);
  const [overrideOpen, setOverrideOpen] = useState({});

  const handleToggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleResultChange = (id, value) => {
    setResults(results.map(r => {
      if (r.id !== id) return r;
      const comp = r.compliance;
      if (!comp) return { ...r, result: value };
      const newStatus = evaluateCompliance(value, comp);
      return {
        ...r,
        result: value,
        compliance: { ...comp, status: newStatus },
      };
    }));
  };

  const handleTagToggle = (id, tags) => {
    setResults(results.map(r => {
      if (r.id !== id) return r;
      const comp = r.compliance;
      if (!comp) return r;
      const newStatus = evaluateDescriptive(tags, comp.expectedTags || []);
      return {
        ...r,
        result: tags.join(","),
        resultTags: DESCRIPTIVE_TAGS.filter(dt => tags.includes(dt.code)).map(dt => dt.displayText),
        compliance: { ...comp, status: newStatus },
      };
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Results Entry — With Compliance Evaluation</h1>
        <p className="text-sm text-gray-600 mt-1">Extended from S-04 Results Entry, showing integrated compliance indicators</p>
      </div>

      {/* Compliance Summary Banner */}
      <ComplianceSummaryBanner results={results} />

      {/* Results Table */}
      <div className="space-y-2">
        {results.map(result => (
          <ResultRow
            key={result.id}
            result={result}
            expanded={expandedId === result.id}
            onToggle={handleToggle}
            onResultChange={handleResultChange}
            onTagToggle={handleTagToggle}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Compliance Indicators</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <ComplianceTag status="pass" />
            <span className="text-gray-600">Result meets regulatory threshold</span>
          </div>
          <div className="flex items-center gap-2">
            <ComplianceTag status="marginal" />
            <span className="text-gray-600">Within marginal zone (approaching limit)</span>
          </div>
          <div className="flex items-center gap-2">
            <ComplianceTag status="fail" />
            <span className="text-gray-600">Exceeds regulatory threshold — non-compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <ComplianceTag status="unit-mismatch" />
            <span className="text-gray-600">Unit conversion not possible — requires manual review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
