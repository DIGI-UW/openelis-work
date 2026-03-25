import { useState, Fragment } from "react";

// ─── Simulated installation config (Tier 2 toggles) ──────────────────────────
const TIER2_CONFIG = {
  specialRequirements: true,   // toggle to false to hide the section entirely
  reactionFlagging: true,       // toggle to false to hide reaction flag buttons
};

// ─── Seed data ────────────────────────────────────────────────────────────────
const PATIENT = {
  id: "P-100423",
  name: "Marie Dupont",
  dob: "1978-04-12",
  mrn: "MRN-88234",
};

const ABO_RH_HISTORY = [
  { date: "2026-03-10", abo: "O", rh: "Positive", accession: "BB-20260310-001", tech: "A. Kalinda" },
  { date: "2025-11-22", abo: "O", rh: "Positive", accession: "BB-20251122-004", tech: "J. Moreau" },
  { date: "2024-06-05", abo: "O", rh: "Positive", accession: "BB-20240605-007", tech: "A. Kalinda" },
];

const ANTIBODY_SCREEN_HISTORY = [
  { date: "2026-03-10", result: "Positive", accession: "BB-20260310-001" },
  { date: "2025-11-22", result: "Negative", accession: "BB-20251122-004" },
  { date: "2024-06-05", result: "Negative", accession: "BB-20240605-007" },
];

const ALLOANTIBODIES_SEED = [
  {
    id: 1, specificity: "Anti-E", significance: "HIGH",
    method: "Panel", dateIdentified: "2026-03-10",
    note: "Identified on pre-transfusion panel. All future pRBC must be E-antigen negative.",
  },
  {
    id: 2, specificity: "Anti-Lea", significance: "LOW",
    method: "Panel", dateIdentified: "2025-11-22",
    note: "Cold reactive; unlikely to be clinically significant at 37°C.",
  },
];

const REQUIREMENTS_SEED = [
  {
    id: 1, type: "IRRADIATED", label: "Irradiated",
    dateRecorded: "2025-09-01", clinician: "Dr. Fontaine",
    indication: "Post-allogeneic BMT — immunocompromised", active: true,
  },
];

const ISSUANCE_LOG_SEED = [
  {
    id: 1, issueDate: "2026-03-12", unitNumber: "W2026-00441",
    component: "pRBC", aboRh: "O Pos", volume: "280 mL",
    tech: "J. Moreau", reaction: null,
  },
  {
    id: 2, issueDate: "2025-11-23", unitNumber: "W2025-01102",
    component: "pRBC", aboRh: "O Pos", volume: "295 mL",
    tech: "A. Kalinda", reaction: null,
  },
  {
    id: 3, issueDate: "2025-09-04", unitNumber: "W2025-00812",
    component: "pRBC", aboRh: "O Pos", volume: "295 mL",
    tech: "A. Kalinda",
    reaction: { category: "Non-hemolytic febrile", onsetTime: "2025-09-04 14:22", note: "Stopped transfusion. Clerical check clear. Repeat crossmatch negative. Unit sent to lab for investigation." },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TAG = {
  green:  "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red:    "bg-red-100 text-red-800",
  blue:   "bg-blue-100 text-blue-800",
  gray:   "bg-gray-100 text-gray-600",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
};

function Tag({ kind = "gray", children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TAG[kind]}`}>
      {children}
    </span>
  );
}

function Alert({ kind = "warning", title, body }) {
  const s = {
    error:   "bg-red-50 border-red-400 text-red-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
    info:    "bg-blue-50 border-blue-400 text-blue-800",
  };
  const icon = { error: "⊗", warning: "⚠", info: "ℹ" };
  return (
    <div className={`border-l-4 px-4 py-2.5 rounded mb-2 flex items-start gap-2 ${s[kind]}`}>
      <span className="font-bold mt-0.5">{icon[kind]}</span>
      <div>
        <span className="font-semibold text-sm">{title}</span>
        {body && <span className="text-sm ml-2">{body}</span>}
      </div>
    </div>
  );
}

function Accordion({ title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left rounded-t"
      >
        <span className="font-medium text-gray-800 flex items-center gap-2">
          {title}
          {badge && <Tag kind="blue">{badge}</Tag>}
        </span>
        <span className="text-gray-400 text-xs">{open ? "▲ collapse" : "▼ expand"}</span>
      </button>
      {open && <div className="p-4 border-t border-gray-200">{children}</div>}
    </div>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded shadow-xl flex items-center gap-3 z-50">
      <span className="text-green-400">✓</span>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

// ─── Derived header values ────────────────────────────────────────────────────
function deriveAboRhStatus(history) {
  if (!history.length) return { display: "No results on file", tag: "gray", status: "NONE" };
  const abos = [...new Set(history.map(r => r.abo))];
  const rhs  = [...new Set(history.map(r => r.rh))];
  if (abos.length > 1 || rhs.length > 1) return { display: "Discordant — supervisor review required", tag: "red", status: "DISCORDANT" };
  const confirmed = history.length >= 2;
  return {
    display: `${history[0].abo} ${history[0].rh}`,
    tag: confirmed ? "green" : "yellow",
    status: confirmed ? "CONFIRMED" : "UNCONFIRMED",
    label: confirmed ? "Confirmed" : "Unconfirmed — second sample required",
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PatientBloodBankRecord() {
  const [alloantibodies, setAlloantibodies] = useState(ALLOANTIBODIES_SEED);
  const [requirements, setRequirements]     = useState(REQUIREMENTS_SEED);
  const [issuanceLog, setIssuanceLog]       = useState(ISSUANCE_LOG_SEED);
  const [toast, setToast]                   = useState(null);

  // Alloantibody form
  const [addingAb, setAddingAb]           = useState(false);
  const [editingAbId, setEditingAbId]     = useState(null);
  const [abForm, setAbForm]               = useState({ specificity: "", significance: "HIGH", method: "Panel", dateIdentified: "", note: "" });
  const [abErrors, setAbErrors]           = useState({});

  // Requirement form (Tier 2)
  const [addingReq, setAddingReq]         = useState(false);
  const [reqForm, setReqForm]             = useState({ type: "IRRADIATED", label: "Irradiated", clinician: "", indication: "" });
  const [deactivateId, setDeactivateId]   = useState(null);
  const [deactivateReason, setDeactReason]= useState("RESOLVED");

  // Reaction flag form (Tier 2)
  const [flaggingId, setFlaggingId]       = useState(null);
  const [rxnForm, setRxnForm]             = useState({ category: "NON_HEMOLYTIC_FEBRILE", onsetTime: "", note: "" });
  const [rxnErrors, setRxnErrors]         = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const aboStatus   = deriveAboRhStatus(ABO_RH_HISTORY);
  const latestScreen = ANTIBODY_SCREEN_HISTORY[0];
  const screenPositive = latestScreen?.result === "Positive";
  const highAbs     = alloantibodies.filter(a => a.significance === "HIGH");
  const activeReqs  = requirements.filter(r => r.active);
  const anyReaction = issuanceLog.some(e => e.reaction);

  // ── Alloantibody handlers ─────────────────────────────────────────────────
  const REQ_OPTIONS = [
    { value: "IRRADIATED",   label: "Irradiated" },
    { value: "CMV_NEGATIVE", label: "CMV Negative" },
    { value: "LEUKOREDUCED", label: "Leukoreduced" },
    { value: "WASHED",       label: "Washed" },
    { value: "HLA_MATCHED",  label: "HLA Matched" },
  ];

  const validateAb = () => {
    const e = {};
    if (!abForm.specificity.trim()) e.specificity = "Antibody specificity is required.";
    if (!abForm.dateIdentified)     e.dateIdentified = "Date identified is required.";
    return e;
  };

  const handleSaveAb = () => {
    const e = validateAb();
    if (Object.keys(e).length) { setAbErrors(e); return; }
    if (editingAbId !== null) {
      setAlloantibodies(prev => prev.map(a => a.id === editingAbId ? { ...a, ...abForm } : a));
    } else {
      setAlloantibodies(prev => [...prev, { id: Date.now(), ...abForm }]);
    }
    setAddingAb(false); setEditingAbId(null);
    setAbForm({ specificity: "", significance: "HIGH", method: "Panel", dateIdentified: "", note: "" });
    setAbErrors({});
    showToast("Alloantibody record saved.");
  };

  const startEditAb = (a) => {
    setEditingAbId(a.id);
    setAbForm({ specificity: a.specificity, significance: a.significance, method: a.method, dateIdentified: a.dateIdentified, note: a.note || "" });
    setAddingAb(false); setAbErrors({});
  };

  // ── Requirement handlers ──────────────────────────────────────────────────
  const handleSaveReq = () => {
    setRequirements(prev => [...prev, {
      id: Date.now(), type: reqForm.type, label: reqForm.label,
      dateRecorded: new Date().toISOString().slice(0, 10),
      clinician: reqForm.clinician, indication: reqForm.indication, active: true,
    }]);
    setAddingReq(false);
    setReqForm({ type: "IRRADIATED", label: "Irradiated", clinician: "", indication: "" });
    showToast("Special requirement added.");
  };

  const handleDeactivate = () => {
    setRequirements(prev => prev.map(r => r.id === deactivateId ? { ...r, active: false } : r));
    setDeactivateId(null);
    showToast("Special requirement deactivated.");
  };

  // ── Reaction flag handler ─────────────────────────────────────────────────
  const validateRxn = () => {
    const e = {};
    if (!rxnForm.onsetTime) e.onsetTime = "Onset time is required.";
    return e;
  };

  const handleSaveReaction = () => {
    const e = validateRxn();
    if (Object.keys(e).length) { setRxnErrors(e); return; }
    setIssuanceLog(prev => prev.map(entry =>
      entry.id === flaggingId
        ? { ...entry, reaction: { category: rxnForm.category, onsetTime: rxnForm.onsetTime, note: rxnForm.note } }
        : entry
    ));
    setFlaggingId(null);
    setRxnForm({ category: "NON_HEMOLYTIC_FEBRILE", onsetTime: "", note: "" });
    setRxnErrors({});
    showToast("Transfusion reaction flagged. Workup note recorded.");
  };

  const RXN_CATEGORIES = [
    { value: "HEMOLYTIC",           label: "Hemolytic" },
    { value: "NON_HEMOLYTIC_FEBRILE", label: "Non-hemolytic febrile" },
    { value: "ALLERGIC",            label: "Allergic" },
    { value: "OTHER",               label: "Other" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

      {/* Nav */}
      <div className="bg-gray-900 text-white px-6 py-3 flex items-center gap-3 text-sm">
        <span className="font-semibold text-base">OpenELIS</span>
        <span className="text-gray-500">›</span>
        <span className="text-gray-300">Patients</span>
        <span className="text-gray-500">›</span>
        <span className="text-gray-300">{PATIENT.name}</span>
        <span className="text-gray-500">›</span>
        <span className="text-white font-medium">Blood Bank</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Patient header */}
        <div className="bg-white border border-gray-200 rounded p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">{PATIENT.name}</div>
            <div className="text-sm text-gray-500 mt-0.5">MRN: {PATIENT.mrn} · DOB: {PATIENT.dob} · ID: {PATIENT.id}</div>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded text-gray-600 cursor-pointer hover:bg-gray-200">Demographics</span>
            <span className="px-3 py-1 bg-blue-700 rounded text-white font-medium">Blood Bank</span>
          </div>
        </div>

        {/* ─── Clinical summary card ─────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded p-4 mb-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Clinical Summary</div>

          {/* Alerts */}
          {aboStatus.status === "DISCORDANT" && (
            <Alert kind="error" title="ABO/Rh Discordance" body="Validated typing results from separate draws disagree. Supervisor review required before issuing." />
          )}
          {screenPositive && (
            <Alert kind="warning" title="Antibody Screen Positive" body="Review alloantibody profile before proceeding." />
          )}
          {anyReaction && TIER2_CONFIG.reactionFlagging && (
            <Alert kind="warning" title="Transfusion Reaction on Record" body="This patient has a flagged reaction. Review issuance log." />
          )}

          {/* Summary fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {/* Confirmed ABO/Rh */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Confirmed ABO/Rh</div>
              {aboStatus.status === "DISCORDANT" ? (
                <Tag kind="red">Discordant</Tag>
              ) : (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-bold text-sm">{aboStatus.display}</span>
                  <Tag kind={aboStatus.tag}>{aboStatus.label}</Tag>
                </div>
              )}
            </div>

            {/* Latest screen */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Latest Antibody Screen</div>
              <div className="flex items-center gap-1">
                <Tag kind={screenPositive ? "red" : "green"}>{latestScreen?.result || "None"}</Tag>
                <span className="text-xs text-gray-400">{latestScreen?.date}</span>
              </div>
            </div>

            {/* High alloantibodies */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Clinically Significant Ab</div>
              {highAbs.length > 0
                ? <div className="flex flex-wrap gap-1">{highAbs.map(a => <Tag key={a.id} kind="red">{a.specificity}</Tag>)}</div>
                : <span className="text-xs text-gray-400">None identified</span>
              }
            </div>

            {/* Special requirements — Tier 2 only */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Special Requirements</div>
              {!TIER2_CONFIG.specialRequirements
                ? <span className="text-xs text-gray-300 italic">Not enabled</span>
                : activeReqs.length > 0
                  ? <div className="flex flex-wrap gap-1">{activeReqs.map(r => <Tag key={r.id} kind="orange">{r.label}</Tag>)}</div>
                  : <span className="text-xs text-gray-400">None</span>
              }
            </div>
          </div>
        </div>

        {/* ─── ABO/Rh History ────────────────────────────────────────────── */}
        <Accordion title="ABO/Rh Typing History" badge={`${ABO_RH_HISTORY.length} results`}>
          {aboStatus.status === "UNCONFIRMED" && (
            <Alert kind="warning" title="Unconfirmed" body="Only one validated typing result on file. A second sample is required for confirmation." />
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">ABO</th>
                <th className="pb-2 pr-4 font-medium">Rh</th>
                <th className="pb-2 pr-4 font-medium">Accession</th>
                <th className="pb-2 font-medium">Technologist</th>
              </tr>
            </thead>
            <tbody>
              {ABO_RH_HISTORY.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4 font-semibold">{r.abo}</td>
                  <td className="py-2 pr-4">{r.rh}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-blue-600">{r.accession}</td>
                  <td className="py-2 text-gray-600">{r.tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">Read-only. Populated from validated ABO/Rh typing orders.</p>
        </Accordion>

        {/* ─── Antibody Screen History ───────────────────────────────────── */}
        <Accordion title="Antibody Screen History" badge={`${ANTIBODY_SCREEN_HISTORY.length} results`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">Result</th>
                <th className="pb-2 font-medium">Accession</th>
              </tr>
            </thead>
            <tbody>
              {ANTIBODY_SCREEN_HISTORY.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4">
                    <Tag kind={r.result === "Positive" ? "red" : r.result === "Negative" ? "green" : "yellow"}>{r.result}</Tag>
                  </td>
                  <td className="py-2 font-mono text-xs text-blue-600">{r.accession}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">Read-only. Populated from validated antibody screen orders.</p>
        </Accordion>

        {/* ─── Alloantibody Profile ──────────────────────────────────────── */}
        <Accordion title="Alloantibody Profile" badge={alloantibodies.length > 0 ? `${alloantibodies.length} identified` : undefined}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-500">Historically identified antibodies - maintained regardless of current screen result.</p>
            <button
              className="bg-blue-700 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-800 whitespace-nowrap"
              onClick={() => { setAddingAb(true); setEditingAbId(null); setAbForm({ specificity: "", significance: "HIGH", method: "Panel", dateIdentified: "", note: "" }); setAbErrors({}); }}
            >
              + Add Alloantibody
            </button>
          </div>

          {/* Add / Edit form */}
          {(addingAb || editingAbId !== null) && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <div className="text-sm font-semibold text-blue-800 mb-3">
                {editingAbId !== null ? "Edit Alloantibody Entry" : "Add Identified Alloantibody"}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Antibody Specificity *</label>
                  <input
                    className={`w-full border rounded px-2 py-1.5 text-sm ${abErrors.specificity ? "border-red-500" : "border-gray-300"}`}
                    placeholder="e.g. anti-E, anti-K, anti-Jka"
                    value={abForm.specificity}
                    onChange={e => setAbForm(f => ({ ...f, specificity: e.target.value }))}
                  />
                  {abErrors.specificity && <p className="text-red-600 text-xs mt-1">{abErrors.specificity}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Clinical Significance *</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                    value={abForm.significance}
                    onChange={e => setAbForm(f => ({ ...f, significance: e.target.value }))}
                  >
                    <option value="HIGH">High</option>
                    <option value="LOW">Low</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Identification Method *</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                    value={abForm.method}
                    onChange={e => setAbForm(f => ({ ...f, method: e.target.value }))}
                  >
                    <option>Panel</option>
                    <option>Adsorption</option>
                    <option>Elution</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date Identified *</label>
                  <input
                    type="date"
                    className={`w-full border rounded px-2 py-1.5 text-sm ${abErrors.dateIdentified ? "border-red-500" : "border-gray-300"}`}
                    value={abForm.dateIdentified}
                    onChange={e => setAbForm(f => ({ ...f, dateIdentified: e.target.value }))}
                  />
                  {abErrors.dateIdentified && <p className="text-red-600 text-xs mt-1">{abErrors.dateIdentified}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Note</label>
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                    placeholder="Clinical context, panel details, etc."
                    value={abForm.note}
                    onChange={e => setAbForm(f => ({ ...f, note: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-800" onClick={handleSaveAb}>Save</button>
                <button className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50" onClick={() => { setAddingAb(false); setEditingAbId(null); setAbErrors({}); }}>Cancel</button>
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="pb-2 pr-4 font-medium">Specificity</th>
                <th className="pb-2 pr-4 font-medium">Significance</th>
                <th className="pb-2 pr-4 font-medium">Method</th>
                <th className="pb-2 pr-4 font-medium">Date Identified</th>
                <th className="pb-2 pr-4 font-medium">Note</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {alloantibodies.map(a => (
                <tr key={a.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 font-semibold">{a.specificity}</td>
                  <td className="py-2 pr-4">
                    <Tag kind={a.significance === "HIGH" ? "red" : a.significance === "LOW" ? "gray" : "yellow"}>{a.significance}</Tag>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{a.method}</td>
                  <td className="py-2 pr-4">{a.dateIdentified}</td>
                  <td className="py-2 pr-4 text-xs text-gray-500 max-w-xs truncate" title={a.note}>{a.note || "—"}</td>
                  <td className="py-2">
                    <button className="text-blue-600 text-xs hover:underline" onClick={() => startEditAb(a)}>Edit</button>
                  </td>
                </tr>
              ))}
              {alloantibodies.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-sm text-gray-400 text-center">No alloantibodies on record.</td></tr>
              )}
            </tbody>
          </table>
        </Accordion>

        {/* ─── Unit Issuance Log ─────────────────────────────────────────── */}
        <Accordion title="Unit Issuance Log" badge={`${issuanceLog.length} units`}>
          <p className="text-sm text-gray-500 mb-3">
            Read-only traceability record. Populated automatically by the Issue-to-Patient workflow.
            {TIER2_CONFIG.reactionFlagging && " Use the Flag Reaction button to record a workup note against an issued unit."}
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="pb-2 pr-3 font-medium">Issue Date</th>
                <th className="pb-2 pr-3 font-medium">Unit Number</th>
                <th className="pb-2 pr-3 font-medium">Component</th>
                <th className="pb-2 pr-3 font-medium">ABO/Rh</th>
                <th className="pb-2 pr-3 font-medium">Volume</th>
                <th className="pb-2 pr-3 font-medium">Outcome</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {issuanceLog.map(entry => (
                <Fragment key={entry.id}>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-3">{entry.issueDate}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-blue-600">{entry.unitNumber}</td>
                    <td className="py-2 pr-3">{entry.component}</td>
                    <td className="py-2 pr-3">{entry.aboRh}</td>
                    <td className="py-2 pr-3">{entry.volume}</td>
                    <td className="py-2 pr-3">
                      {entry.reaction
                        ? <Tag kind="red">Reaction flagged</Tag>
                        : <Tag kind="green">No reaction</Tag>
                      }
                    </td>
                    <td className="py-2">
                      {TIER2_CONFIG.reactionFlagging && !entry.reaction && (
                        <button
                          className="text-xs text-orange-600 hover:underline whitespace-nowrap"
                          onClick={() => { setFlaggingId(entry.id); setRxnForm({ category: "NON_HEMOLYTIC_FEBRILE", onsetTime: "", note: "" }); setRxnErrors({}); }}
                        >
                          Flag Reaction
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Reaction detail row */}
                  {entry.reaction && (
                    <tr className="border-b border-gray-100 bg-red-50">
                      <td colSpan={7} className="px-4 py-2 text-xs text-red-800">
                        <span className="font-semibold">{entry.reaction.category}</span>
                        {" · Onset: "}{entry.reaction.onsetTime}
                        {entry.reaction.note && <span className="ml-2 text-red-700">{entry.reaction.note}</span>}
                      </td>
                    </tr>
                  )}

                  {/* Inline reaction flag form */}
                  {flaggingId === entry.id && (
                    <tr>
                      <td colSpan={7} className="pb-3 pt-1">
                        <div className="bg-orange-50 border border-orange-200 rounded p-4 mx-0">
                          <div className="text-sm font-semibold text-orange-800 mb-3">
                            {"Flag Transfusion Reaction - "}{entry.unitNumber}
                          </div>
                          <p className="text-xs text-orange-700 mb-3">
                            Record a workup note. Full clinical documentation should be completed in the EMR.
                          </p>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Reaction Category *</label>
                              <select
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                value={rxnForm.category}
                                onChange={e => setRxnForm(f => ({ ...f, category: e.target.value }))}
                              >
                                {RXN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Onset Time *</label>
                              <input
                                type="datetime-local"
                                className={`w-full border rounded px-2 py-1.5 text-sm ${rxnErrors.onsetTime ? "border-red-500" : "border-gray-300"}`}
                                value={rxnForm.onsetTime}
                                onChange={e => setRxnForm(f => ({ ...f, onsetTime: e.target.value }))}
                              />
                              {rxnErrors.onsetTime && <p className="text-red-600 text-xs mt-1">{rxnErrors.onsetTime}</p>}
                            </div>
                            <div className="col-span-1">
                              {/* spacer */}
                            </div>
                            <div className="col-span-3">
                              <label className="block text-xs text-gray-600 mb-1">Workup Note <span className="text-gray-400">(max 500 chars)</span></label>
                              <textarea
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                rows={2}
                                maxLength={500}
                                placeholder="Clerical check result, repeat crossmatch status, actions taken..."
                                value={rxnForm.note}
                                onChange={e => setRxnForm(f => ({ ...f, note: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button className="bg-orange-600 text-white px-4 py-1.5 rounded text-sm hover:bg-orange-700" onClick={handleSaveReaction}>Save Flag</button>
                            <button className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50" onClick={() => { setFlaggingId(null); setRxnErrors({}); }}>Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </Accordion>

        {/* ─── Special Requirements (Tier 2) ────────────────────────────── */}
        {TIER2_CONFIG.specialRequirements ? (
          <Accordion title="Special Transfusion Requirements" badge={activeReqs.length > 0 ? `${activeReqs.length} active` : undefined}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-500">Mandatory product attributes enforced at crossmatch. Enabled for this installation.</p>
              <button
                className="bg-blue-700 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-800 whitespace-nowrap"
                onClick={() => setAddingReq(true)}
              >
                + Add Requirement
              </button>
            </div>

            {addingReq && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                <div className="text-sm font-semibold text-blue-800 mb-3">Add Special Requirement</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Requirement Type *</label>
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      value={reqForm.type}
                      onChange={e => {
                        const opt = REQ_OPTIONS.find(o => o.value === e.target.value);
                        setReqForm(f => ({ ...f, type: e.target.value, label: opt?.label || e.target.value }));
                      }}
                    >
                      {REQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ordering Clinician</label>
                    <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Dr. Name" value={reqForm.clinician} onChange={e => setReqForm(f => ({ ...f, clinician: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Clinical Indication</label>
                    <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Reason this requirement applies" value={reqForm.indication} onChange={e => setReqForm(f => ({ ...f, indication: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-800" onClick={handleSaveReq}>Save</button>
                  <button className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50" onClick={() => setAddingReq(false)}>Cancel</button>
                </div>
              </div>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="pb-2 pr-4 font-medium">Requirement</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Date Recorded</th>
                  <th className="pb-2 pr-4 font-medium">Clinician</th>
                  <th className="pb-2 pr-4 font-medium">Indication</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {requirements.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-semibold">{r.label}</td>
                    <td className="py-2 pr-4"><Tag kind={r.active ? "green" : "gray"}>{r.active ? "Active" : "Inactive"}</Tag></td>
                    <td className="py-2 pr-4">{r.dateRecorded}</td>
                    <td className="py-2 pr-4 text-gray-600">{r.clinician || "—"}</td>
                    <td className="py-2 pr-4 text-xs text-gray-500">{r.indication || "—"}</td>
                    <td className="py-2">
                      {r.active && (
                        <button
                          className="text-red-600 text-xs hover:underline"
                          onClick={() => { setDeactivateId(r.id); setDeactReason("RESOLVED"); }}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {requirements.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-sm text-gray-400 text-center">No special requirements recorded.</td></tr>
                )}
              </tbody>
            </table>
          </Accordion>
        ) : (
          <div className="border border-dashed border-gray-200 rounded p-4 mb-3 text-sm text-gray-400 text-center">
            Special Transfusion Requirements - not enabled for this installation
          </div>
        )}

        {/* ─── Deactivation modal ────────────────────────────────────────── */}
        {deactivateId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-xl p-6 w-96">
              <h3 className="font-semibold text-gray-900 mb-1">Deactivate Special Requirement</h3>
              <p className="text-sm text-gray-600 mb-4">Select a reason. The entry will remain on record as inactive.</p>
              <label className="block text-xs text-gray-600 mb-1">Reason *</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-4"
                value={deactivateReason}
                onChange={e => setDeactReason(e.target.value)}
              >
                <option value="RESOLVED">Clinical indication resolved</option>
                <option value="ORDERED_IN_ERROR">Ordered in error</option>
                <option value="OTHER">Other</option>
              </select>
              <div className="flex gap-2">
                <button className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700" onClick={handleDeactivate}>Deactivate</button>
                <button className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50" onClick={() => setDeactivateId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
