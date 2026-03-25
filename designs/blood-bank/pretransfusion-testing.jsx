import { useState, Fragment, useRef } from "react";

// ─── Seed data ────────────────────────────────────────────────────────────────

const WORKLIST_SEED = [
  {
    id: 1, requestNumber: "TR-20260319-001", patientName: "Marie Dupont", mrn: "MRN-88234",
    component: "pRBC", qty: 2, type: "URGENT", status: "CROSSMATCH_COMPLETE",
    requiredBy: "2026-03-19 18:00", clinician: "Dr. Fontaine",
    aboRh: "O Pos", confirmedType: true,
    ward: "ICU-2",
  },
  {
    id: 2, requestNumber: "TR-20260319-002", patientName: "Jean Balogun", mrn: "MRN-44102",
    component: "FFP", qty: 4, type: "ROUTINE", status: "UNITS_SELECTED",
    requiredBy: "2026-03-20 10:00", clinician: "Dr. Osei",
    aboRh: "A Pos", confirmedType: true,
    ward: "Maternity",
  },
  {
    id: 3, requestNumber: "TR-20260319-003", patientName: "Amara Diallo", mrn: "MRN-77391",
    component: "pRBC", qty: 1, type: "EMERGENCY", status: "PENDING",
    requiredBy: "2026-03-19 14:30", clinician: "Dr. Mensah",
    aboRh: null, confirmedType: false,
    ward: "ER",
  },
  {
    id: 4, requestNumber: "TR-20260318-004", patientName: "Sophie Tremblay", mrn: "MRN-55821",
    component: "PLT", qty: 1, type: "ROUTINE", status: "APPROVED",
    requiredBy: "2026-03-19 09:00", clinician: "Dr. Fontaine",
    aboRh: "B Pos", confirmedType: true,
    ward: "Oncology",
  },
  {
    id: 5, requestNumber: "TR-20260318-005", patientName: "Kofi Mensah", mrn: "MRN-33201",
    component: "pRBC", qty: 2, type: "ROUTINE", status: "PENDING",
    requiredBy: "2026-03-20 08:00", clinician: "Dr. Osei",
    aboRh: "AB Pos", confirmedType: true,
    ward: "Surgery",
  },
];

const COMPATIBLE_UNITS_SEED = [
  { id: "u1", unitNumber: "W2026-00441", aboRh: "O Pos", attrs: ["Irradiated"], daysToExpiry: 18, storage: "BB-Fridge-1", compatible: true, reasons: [] },
  { id: "u2", unitNumber: "W2026-00512", aboRh: "O Pos", attrs: ["Leukoreduced"], daysToExpiry: 5,  storage: "BB-Fridge-1", compatible: true, reasons: [] },
  { id: "u3", unitNumber: "W2026-00388", aboRh: "O Neg", attrs: [], daysToExpiry: 22, storage: "BB-Fridge-2", compatible: false, reasons: ["Rh-negative unit: patient is Rh-positive (acceptable but confirm intent)"] },
  { id: "u4", unitNumber: "W2026-00601", aboRh: "A Pos", attrs: [], daysToExpiry: 11, storage: "BB-Fridge-1", compatible: false, reasons: ["ABO incompatible: patient is O Pos, unit is A Pos"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TAG = {
  green:  "bg-green-100 text-green-800",
  red:    "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  blue:   "bg-blue-100 text-blue-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
  gray:   "bg-gray-100 text-gray-600",
  teal:   "bg-teal-100 text-teal-800",
};

function Tag({ kind = "gray", children }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TAG[kind]}`}>{children}</span>;
}

function Alert({ kind = "warning", title, body }) {
  const s = {
    error:   "bg-red-50 border-red-400 text-red-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
    info:    "bg-blue-50 border-blue-400 text-blue-800",
  };
  const icon = { error: "!", warning: "!", info: "i" };
  return (
    <div className={`border-l-4 px-4 py-2.5 rounded mb-3 flex items-start gap-2 ${s[kind]}`}>
      <span className="font-bold mt-0.5 shrink-0 text-sm">{icon[kind]}</span>
      <div>
        <span className="font-semibold text-sm">{title}</span>
        {body && <span className="text-sm ml-1">{body}</span>}
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded shadow-xl flex items-center gap-3 z-50">
      <span className="text-green-400">&#10003;</span>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white text-lg">x</button>
    </div>
  );
}

const STATUS_META = {
  PENDING:              { kind: "purple", label: "Pending" },
  UNITS_SELECTED:       { kind: "blue",   label: "Units Selected" },
  CROSSMATCH_COMPLETE:  { kind: "yellow", label: "Crossmatch Complete" },
  APPROVED:             { kind: "green",  label: "Approved" },
  CANCELLED:            { kind: "gray",   label: "Cancelled" },
  ISSUED:               { kind: "teal",   label: "Issued" },
};

const TYPE_META = {
  ROUTINE:   { kind: "gray",   label: "Routine" },
  URGENT:    { kind: "orange", label: "Urgent" },
  EMERGENCY: { kind: "red",    label: "EMERGENCY" },
};

// Sidebar workflow stages for case view
const WORKFLOW_STAGES = [
  { id: "info",         label: "Request Info",       status: "PENDING" },
  { id: "patient",      label: "Patient Blood Bank",  status: "PENDING" },
  { id: "units",        label: "Unit Selection",      status: "UNITS_SELECTED" },
  { id: "crossmatch",   label: "Crossmatch Results",  status: "CROSSMATCH_COMPLETE" },
  { id: "approval",     label: "Approval",            status: "APPROVED" },
];

// Section status icon (mirrors Pathology case view pattern)
function SectionIcon({ stageStatus, reqStatus }) {
  const reqIdx  = ["PENDING","UNITS_SELECTED","CROSSMATCH_COMPLETE","APPROVED","CANCELLED","ISSUED"].indexOf(reqStatus);
  const stgIdx  = ["PENDING","UNITS_SELECTED","CROSSMATCH_COMPLETE","APPROVED"].indexOf(stageStatus);

  let state = "empty";
  if (stageStatus === "PENDING") state = "active";           // always active
  else if (stgIdx >= 0 && reqIdx >= stgIdx) state = "complete";
  else if (stgIdx > 0 && reqIdx === stgIdx - 1) state = "active";
  else state = "locked";

  if (state === "complete") return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="#198038">
      <circle cx="10" cy="10" r="9" fill="#198038"/>
      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  );
  if (state === "active") return (
    <svg width="18" height="18" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9" fill="none" stroke="#0f62fe" strokeWidth="2"/>
      <circle cx="10" cy="10" r="5" fill="#0f62fe"/>
    </svg>
  );
  if (state === "locked") return (
    <svg width="18" height="18" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9" fill="none" stroke="#c6c6c6" strokeWidth="2"/>
      <rect x="7" y="9" width="6" height="5" rx="1" fill="#c6c6c6"/>
      <path d="M8 9V7a2 2 0 014 0v2" fill="none" stroke="#c6c6c6" strokeWidth="1.5"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9" fill="none" stroke="#c6c6c6" strokeWidth="2"/>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TransfusionRequestWorkflow() {
  const [requests, setRequests]       = useState(WORKLIST_SEED);
  const [view, setView]               = useState("worklist"); // worklist | new | detail
  const [selectedId, setSelectedId]   = useState(null);
  const [toast, setToast]             = useState(null);

  // Dashboard filters
  const [filterStatus,    setFilterStatus]    = useState("ALL");
  const [filterType,      setFilterType]      = useState("ALL");
  const [filterComponent, setFilterComponent] = useState("ALL");
  const [searchTerm,      setSearchTerm]      = useState("");

  // New request form
  const [newForm, setNewForm]     = useState({ patient: "", mrn: "", component: "pRBC", qty: 1, clinician: "", indication: "", requiredBy: "", type: "ROUTINE", ward: "" });
  const [newErrors, setNewErrors] = useState({});

  // Unit selection
  const [selectedUnits, setSelectedUnits]     = useState({});
  const [overrideTarget, setOverrideTarget]   = useState(null);
  const [overrideReason, setOverrideReason]   = useState("");
  const [overrideError, setOverrideError]     = useState("");

  // Crossmatch results
  const [xmResults, setXmResults]             = useState({
    "1-u1": { result: "COMPATIBLE", notes: "IS and AHG phase compatible.", enteredBy: "A. Kalinda", enteredAt: "2026-03-19 09:41" },
  });
  const [enteringResultFor, setEnteringResultFor] = useState(null);
  const [resultForm, setResultForm]           = useState({ result: "COMPATIBLE", notes: "" });

  // Case view section expand/collapse
  const [expanded, setExpanded] = useState({ info: true, patient: true, units: true, crossmatch: true, approval: true });
  const toggleSection = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Scroll refs for sidebar nav
  const sectionRefs = {
    info:       useRef(null),
    patient:    useRef(null),
    units:      useRef(null),
    crossmatch: useRef(null),
    approval:   useRef(null),
  };
  const scrollTo = (id) => sectionRefs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("NO_LONGER_REQUIRED");

  // Navigation state - Carbon SideNav pattern
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [bloodBankExpanded, setBloodBankExpanded] = useState(true);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const selectedRequest = requests.find(r => r.id === selectedId);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const validateNew = () => {
    const e = {};
    if (!newForm.patient.trim())   e.patient   = "Patient name is required.";
    if (!newForm.clinician.trim()) e.clinician = "Ordering clinician is required.";
    if (!newForm.qty || newForm.qty < 1) e.qty = "Quantity must be at least 1.";
    return e;
  };

  const handleCreateRequest = () => {
    const e = validateNew();
    if (Object.keys(e).length) { setNewErrors(e); return; }
    const newReq = {
      id: Date.now(),
      requestNumber: `TR-20260319-00${requests.length + 1}`,
      patientName: newForm.patient, mrn: newForm.mrn || "MRN-TBD",
      component: newForm.component, qty: parseInt(newForm.qty),
      type: newForm.type, status: "PENDING",
      requiredBy: newForm.requiredBy || "-", clinician: newForm.clinician,
      aboRh: null, confirmedType: false,
      ward: newForm.ward,
    };
    setRequests(prev => [newReq, ...prev]);
    setNewForm({ patient: "", mrn: "", component: "pRBC", qty: 1, clinician: "", indication: "", requiredBy: "", type: "ROUTINE", ward: "" });
    setNewErrors({});
    setView("worklist");
    showToast(`Request ${newReq.requestNumber} created.`);
  };

  const getSelectedUnitsForRequest = (reqId) => selectedUnits[reqId] || [];

  const handleSelectUnit = (reqId, unit) => {
    if (!unit.compatible) {
      setOverrideTarget({ reqId, unit });
      setOverrideReason(""); setOverrideError("");
      return;
    }
    addUnit(reqId, unit.id);
  };

  const addUnit = (reqId, unitId) => {
    setSelectedUnits(prev => ({ ...prev, [reqId]: [...(prev[reqId] || []), unitId] }));
    setRequests(prev => prev.map(r => r.id === reqId && r.status === "PENDING" ? { ...r, status: "UNITS_SELECTED" } : r));
    showToast("Unit selected and reserved.");
  };

  const handleConfirmOverride = () => {
    if (!overrideReason.trim()) { setOverrideError("Override reason is required."); return; }
    addUnit(overrideTarget.reqId, overrideTarget.unit.id);
    setOverrideTarget(null); setOverrideReason(""); setOverrideError("");
    showToast("Unit selected with override recorded.");
  };

  const handleRemoveUnit = (reqId, unitId) => {
    setSelectedUnits(prev => {
      const updated = (prev[reqId] || []).filter(id => id !== unitId);
      return { ...prev, [reqId]: updated };
    });
    showToast("Unit removed. Reservation released.");
  };

  const xmKey = (reqId, unitId) => `${reqId}-${unitId}`;

  const handleSaveResult = (reqId, unitId) => {
    const key = xmKey(reqId, unitId);
    setXmResults(prev => ({
      ...prev,
      [key]: { ...resultForm, enteredBy: "Current User", enteredAt: new Date().toLocaleString() },
    }));
    setEnteringResultFor(null);
    setResultForm({ result: "COMPATIBLE", notes: "" });
    const allUnits = selectedUnits[reqId] || [];
    const allEntered = allUnits.every(uid => {
      const k = xmKey(reqId, uid);
      return k === key || xmResults[k];
    });
    if (allEntered && allUnits.length > 0) {
      setRequests(prev => prev.map(r =>
        r.id === reqId && r.status === "UNITS_SELECTED" ? { ...r, status: "CROSSMATCH_COMPLETE" } : r
      ));
      showToast("All crossmatch results entered. Request ready for approval.");
    } else {
      showToast("Result saved.");
    }
  };

  const handleApprove = (reqId) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "APPROVED" } : r));
    showToast("Request approved. Units ready for issue.");
  };

  const handleCancel = () => {
    setRequests(prev => prev.map(r => r.id === cancelTarget ? { ...r, status: "CANCELLED" } : r));
    setSelectedUnits(prev => ({ ...prev, [cancelTarget]: [] }));
    setCancelTarget(null);
    setView("worklist");
    showToast("Request cancelled. Reserved units released.");
  };

  const openCase = (id) => {
    setSelectedId(id);
    setExpanded({ info: true, patient: true, units: true, crossmatch: true, approval: true });
    setView("detail");
  };

  // ── Dashboard stat helpers ─────────────────────────────────────────────────

  const active = requests.filter(r => r.status !== "CANCELLED" && r.status !== "ISSUED");
  const statCounts = {
    ALL:                 active.length,
    PENDING:             active.filter(r => r.status === "PENDING").length,
    UNITS_SELECTED:      active.filter(r => r.status === "UNITS_SELECTED").length,
    CROSSMATCH_COMPLETE: active.filter(r => r.status === "CROSSMATCH_COMPLETE").length,
    APPROVED:            active.filter(r => r.status === "APPROVED").length,
    EMERGENCY:           active.filter(r => r.type === "EMERGENCY").length,
  };

  const filteredRequests = active.filter(r => {
    if (filterStatus !== "ALL" && filterStatus !== "EMERGENCY" && r.status !== filterStatus) return false;
    if (filterStatus === "EMERGENCY" && r.type !== "EMERGENCY") return false;
    if (filterType !== "ALL" && r.type !== filterType) return false;
    if (filterComponent !== "ALL" && r.component !== filterComponent) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!r.patientName.toLowerCase().includes(q) && !r.mrn.toLowerCase().includes(q) && !r.requestNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── Dashboard view — Pathology Dashboard pattern ───────────────────────────
  // Stat tiles: large white cards, title + big number, no color borders
  // Below: single white card with search + filters + clean data table + pagination

  const [myRequestsOnly, setMyRequestsOnly] = useState(false);
  const [itemsPerPage] = useState(10);

  const filteredForTable = filteredRequests.filter(r => !myRequestsOnly || r.clinician === "Dr. Fontaine");

  // Today's date range label for the "approved this week" tile
  const weekLabel = "17/03/2026 - 24/03/2026";

  const renderDashboard = () => (
    <div>
      {/* Page title — matches "Pathology" heading style */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-normal text-gray-900">Pre-Transfusion Testing</h2>
        <button
          className="bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-800"
          onClick={() => setView("new")}
        >
          + New Request
        </button>
      </div>

      {/* Stat tiles — 4-wide, white cards, plain number + label, no color borders */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Requests in Progress",
            value: active.filter(r => ["PENDING","UNITS_SELECTED","CROSSMATCH_COMPLETE"].includes(r.status)).length,
            filterKey: null,
          },
          {
            label: "Awaiting Approval",
            value: active.filter(r => r.status === "CROSSMATCH_COMPLETE").length,
            filterKey: "CROSSMATCH_COMPLETE",
          },
          {
            label: "Emergency Requests",
            value: active.filter(r => r.type === "EMERGENCY").length,
            filterKey: "EMERGENCY",
          },
          {
            label: `Approved (Week ${weekLabel})`,
            value: requests.filter(r => r.status === "APPROVED").length,
            filterKey: "APPROVED",
          },
        ].map((tile, i) => (
          <button
            key={i}
            onClick={() => tile.filterKey && setFilterStatus(prev => prev === tile.filterKey ? "ALL" : tile.filterKey)}
            className={`bg-white rounded shadow-sm p-5 text-left transition-all hover:shadow-md ${filterStatus === tile.filterKey ? "ring-2 ring-blue-500" : ""}`}
          >
            <p className="text-gray-600 text-sm mb-2">{tile.label}</p>
            <p className="text-3xl font-bold text-gray-900">{tile.value}</p>
          </button>
        ))}
      </div>

      {/* Case list card — search + filters row + table + pagination */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        {/* Search + filter controls — matches Pathology dashboard layout exactly */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
          <div className="relative w-96">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">&#128269;</span>
            <input
              className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 text-sm"
              placeholder="Search by Request # or Patient Name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-600">Filters:</span>
            <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={myRequestsOnly}
                onChange={e => setMyRequestsOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              My requests
            </label>
            <select
              className="border border-gray-300 rounded px-3 py-1.5 text-sm min-w-44"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="UNITS_SELECTED">Units Selected</option>
              <option value="CROSSMATCH_COMPLETE">Crossmatch Complete</option>
              <option value="APPROVED">Approved</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
            <select
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              value={filterComponent}
              onChange={e => setFilterComponent(e.target.value)}
            >
              <option value="ALL">All Components</option>
              <option value="pRBC">pRBC</option>
              <option value="FFP">FFP</option>
              <option value="PLT">Platelets</option>
              <option value="CRYO">Cryoprecipitate</option>
            </select>
          </div>
        </div>

        {/* Data table — clean, minimal, matches Pathology dashboard table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-700 font-semibold border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-semibold">Required By</th>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">Last Name</th>
              <th className="px-4 py-3 font-semibold">First Name</th>
              <th className="px-4 py-3 font-semibold">Component</th>
              <th className="px-4 py-3 font-semibold">Clinician</th>
              <th className="px-4 py-3 font-semibold">Ward</th>
              <th className="px-4 py-3 font-semibold">Request #</th>
            </tr>
          </thead>
          <tbody>
            {filteredForTable.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  No requests match the current filters.
                </td>
              </tr>
            ) : (
              [...filteredForTable]
                .sort((a, b) => (b.type === "EMERGENCY" ? 1 : 0) - (a.type === "EMERGENCY" ? 1 : 0))
                .map(req => {
                  const nameParts = req.patientName.split(" ");
                  const lastName  = nameParts[nameParts.length - 1].toUpperCase();
                  const firstName = nameParts.slice(0, -1).join(" ");
                  return (
                    <tr
                      key={req.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => openCase(req.id)}
                    >
                      <td className="px-4 py-3 text-gray-700">{req.requiredBy}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{STATUS_META[req.status].label.toUpperCase().replace(/ /g, "_")}</td>
                      <td className="px-4 py-3 text-gray-900">{lastName}</td>
                      <td className="px-4 py-3 text-gray-900">{firstName}</td>
                      <td className="px-4 py-3 text-gray-700">{req.component} x{req.qty}</td>
                      <td className="px-4 py-3 text-gray-700">{req.clinician}</td>
                      <td className="px-4 py-3 text-gray-700">{req.ward || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{req.requestNumber}</td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            Items per page
            <select className="border border-gray-300 rounded px-2 py-1 text-sm ml-1">
              <option>10</option>
              <option>25</option>
              <option>100</option>
            </select>
          </span>
          <span className="ml-2">1-{filteredForTable.length} of {filteredForTable.length} items</span>
          <div className="ml-auto flex items-center gap-2">
            <span>1 of 1 page</span>
            <button className="border border-gray-300 rounded px-2 py-1 text-gray-400 cursor-not-allowed">&#8249;</button>
            <button className="border border-gray-300 rounded px-2 py-1 text-gray-400 cursor-not-allowed">&#8250;</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── New request form ───────────────────────────────────────────────────────

  const renderNewForm = () => (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-5 text-sm">
        <button className="text-blue-600 hover:underline" onClick={() => setView("worklist")}>Pre-Transfusion Testing</button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-700 font-medium">New Transfusion Request</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">New Transfusion Request</h2>
      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Patient Name *</label>
            <input
              className={`w-full border rounded px-3 py-2 text-sm ${newErrors.patient ? "border-red-500" : "border-gray-300"}`}
              placeholder="Search patient name or MRN"
              value={newForm.patient}
              onChange={e => setNewForm(f => ({ ...f, patient: e.target.value }))}
            />
            {newErrors.patient && <p className="text-red-600 text-xs mt-1">{newErrors.patient}</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">MRN</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="MRN-XXXXX"
              value={newForm.mrn}
              onChange={e => setNewForm(f => ({ ...f, mrn: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ward / Location</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="e.g. ICU-2, ER, Maternity"
              value={newForm.ward}
              onChange={e => setNewForm(f => ({ ...f, ward: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Component Type *</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={newForm.component} onChange={e => setNewForm(f => ({ ...f, component: e.target.value }))}>
              <option value="pRBC">pRBC</option>
              <option value="FFP">FFP</option>
              <option value="PLT">Platelets</option>
              <option value="CRYO">Cryoprecipitate</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Quantity *</label>
            <input
              type="number" min="1"
              className={`w-full border rounded px-3 py-2 text-sm ${newErrors.qty ? "border-red-500" : "border-gray-300"}`}
              value={newForm.qty}
              onChange={e => setNewForm(f => ({ ...f, qty: e.target.value }))}
            />
            {newErrors.qty && <p className="text-red-600 text-xs mt-1">{newErrors.qty}</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Request Type *</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={newForm.type} onChange={e => setNewForm(f => ({ ...f, type: e.target.value }))}>
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Required By</label>
            <input type="datetime-local" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={newForm.requiredBy} onChange={e => setNewForm(f => ({ ...f, requiredBy: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Ordering Clinician *</label>
            <input
              className={`w-full border rounded px-3 py-2 text-sm ${newErrors.clinician ? "border-red-500" : "border-gray-300"}`}
              placeholder="Dr. Name"
              value={newForm.clinician}
              onChange={e => setNewForm(f => ({ ...f, clinician: e.target.value }))}
            />
            {newErrors.clinician && <p className="text-red-600 text-xs mt-1">{newErrors.clinician}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Clinical Indication</label>
            <textarea rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Why blood product is being requested" value={newForm.indication} onChange={e => setNewForm(f => ({ ...f, indication: e.target.value }))} />
          </div>
        </div>
        {newForm.type === "EMERGENCY" && (
          <div className="mt-3">
            <Alert kind="error" title="Emergency Request" body="This request will be flagged for immediate action and routed to the Emergency Release pathway." />
          </div>
        )}
        <div className="flex gap-2 mt-5">
          <button className="bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-800" onClick={handleCreateRequest}>Create Request</button>
          <button className="border border-gray-300 text-gray-600 px-5 py-2 rounded text-sm hover:bg-gray-50" onClick={() => setView("worklist")}>Cancel</button>
        </div>
      </div>
    </div>
  );

  // ── Case view: Pathology-pattern with sidebar + collapsible sections ────────

  const renderDetail = () => {
    if (!selectedRequest) return null;
    const req = selectedRequest;
    const reqSelectedUnits = getSelectedUnitsForRequest(req.id);
    const canSelectUnits  = req.confirmedType && req.status !== "APPROVED" && req.status !== "CANCELLED";
    const canApprove      = req.status === "CROSSMATCH_COMPLETE";
    const unitsLocked     = !req.confirmedType;
    const crossmatchLocked = reqSelectedUnits.length === 0;
    const approvalLocked  = req.status !== "CROSSMATCH_COMPLETE" && req.status !== "APPROVED";

    // Per-section stage status for sidebar icons
    const stageStatusMap = {
      info:       "PENDING",
      patient:    "PENDING",
      units:      "UNITS_SELECTED",
      crossmatch: "CROSSMATCH_COMPLETE",
      approval:   "APPROVED",
    };

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Breadcrumb + case header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2 text-sm mb-2">
            <button className="text-blue-600 hover:underline" onClick={() => setView("worklist")}>Pre-Transfusion Testing</button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">{req.requestNumber}</span>
            <Tag kind={TYPE_META[req.type].kind}>{TYPE_META[req.type].label}</Tag>
            <Tag kind={STATUS_META[req.status].kind}>{STATUS_META[req.status].label}</Tag>
          </div>
          <div className="flex items-baseline gap-6 text-sm text-gray-600">
            <span>
              <span className="font-semibold text-gray-900 text-base">{req.patientName}</span>
              <span className="ml-2 text-gray-400 text-xs">{req.mrn}</span>
            </span>
            <span>Component: <span className="font-medium text-gray-900">{req.component} x{req.qty}</span></span>
            <span>Clinician: <span className="font-medium text-gray-900">{req.clinician}</span></span>
            <span>Required By: <span className="font-medium text-gray-900">{req.requiredBy}</span></span>
            {req.ward && <span>Ward: <span className="font-medium text-gray-900">{req.ward}</span></span>}
          </div>
        </div>

        {/* Sidebar + main content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 148px)" }}>

          {/* Left sidebar - sticky, 240px */}
          <div
            style={{ width: 240, flexShrink: 0, overflowY: "auto", position: "sticky", top: 0, alignSelf: "flex-start" }}
            className="bg-gray-50 border-r border-gray-200 py-4"
          >
            <div className="px-4 mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workflow</p>
            </div>
            <nav>
              {WORKFLOW_STAGES.map(stage => {
                const reqIdx  = ["PENDING","UNITS_SELECTED","CROSSMATCH_COMPLETE","APPROVED"].indexOf(req.status);
                const stgIdx  = ["PENDING","UNITS_SELECTED","CROSSMATCH_COMPLETE","APPROVED"].indexOf(stage.status);
                const isActive = stgIdx <= reqIdx || stage.status === "PENDING";
                return (
                  <button
                    key={stage.id}
                    onClick={() => scrollTo(stage.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${isActive ? "text-gray-800 hover:bg-gray-100" : "text-gray-400 cursor-default"}`}
                  >
                    <SectionIcon stageStatus={stageStatusMap[stage.id]} reqStatus={req.status} />
                    <span className={`${isActive ? "font-medium" : ""}`}>{stage.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar summary */}
            <div className="px-4 mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Units</p>
              <p className="text-sm text-gray-700">
                {reqSelectedUnits.length} of {req.qty} selected
              </p>
              {reqSelectedUnits.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {reqSelectedUnits.filter(uid => xmResults[xmKey(req.id, uid)]).length}/{reqSelectedUnits.length} crossmatches entered
                </p>
              )}
            </div>
          </div>

          {/* Main scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

            {/* ── Section: Request Info ── */}
            <div ref={sectionRefs.info} className="bg-white border border-gray-200 rounded">
              <button
                className="w-full flex items-center justify-between px-5 py-3 text-left"
                onClick={() => toggleSection("info")}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon stageStatus="PENDING" reqStatus={req.status} />
                  <span className="font-semibold text-gray-900 text-sm">Request Information</span>
                </div>
                <span className="text-gray-400 text-xs">{expanded.info ? "v" : ">"}</span>
              </button>
              {expanded.info && (
                <div className="px-5 pb-4 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm mt-3">
                    <div><span className="text-gray-500 text-xs">Request #</span><div className="font-mono font-medium text-blue-700">{req.requestNumber}</div></div>
                    <div><span className="text-gray-500 text-xs">Component</span><div className="font-medium">{req.component} x{req.qty}</div></div>
                    <div><span className="text-gray-500 text-xs">Urgency</span><div className="mt-0.5"><Tag kind={TYPE_META[req.type].kind}>{TYPE_META[req.type].label}</Tag></div></div>
                    <div><span className="text-gray-500 text-xs">Ordering Clinician</span><div>{req.clinician}</div></div>
                    <div><span className="text-gray-500 text-xs">Required By</span><div>{req.requiredBy}</div></div>
                    <div><span className="text-gray-500 text-xs">Ward / Location</span><div>{req.ward || "Not specified"}</div></div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Section: Patient Blood Bank ── */}
            <div ref={sectionRefs.patient} className="bg-white border border-gray-200 rounded">
              <button
                className="w-full flex items-center justify-between px-5 py-3 text-left"
                onClick={() => toggleSection("patient")}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon stageStatus="PENDING" reqStatus={req.status} />
                  <span className="font-semibold text-gray-900 text-sm">Patient Blood Bank Record</span>
                </div>
                <span className="text-gray-400 text-xs">{expanded.patient ? "v" : ">"}</span>
              </button>
              {expanded.patient && (
                <div className="px-5 pb-4 border-t border-gray-100 mt-0">
                  {req.confirmedType ? (
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-500 mb-1">ABO / Rh Type</p>
                        <p className="text-lg font-bold text-gray-900">{req.aboRh}</p>
                        <Tag kind="green">Confirmed (2 concordant)</Tag>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-500 mb-2">Active Antibodies</p>
                        <div className="flex flex-col gap-1">
                          <Tag kind="red">Anti-E (High titre)</Tag>
                          <Tag kind="yellow">Anti-Jk(a) (Weak)</Tag>
                        </div>
                      </div>
                      <div className="col-span-2 bg-orange-50 border border-orange-200 rounded p-3">
                        <p className="text-xs font-semibold text-orange-700 mb-1">Active Special Requirements</p>
                        <div className="flex gap-2 flex-wrap">
                          <Tag kind="orange">Irradiated</Tag>
                          <Tag kind="orange">CMV-negative preferred</Tag>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Alert kind="warning" title="No confirmed ABO/Rh type on record" body="A type and screen must be completed before units can be selected." />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Section: Unit Selection ── */}
            <div ref={sectionRefs.units} className={`bg-white border rounded ${unitsLocked ? "border-gray-100 opacity-60" : "border-gray-200"}`}>
              <button
                className="w-full flex items-center justify-between px-5 py-3 text-left"
                onClick={() => !unitsLocked && toggleSection("units")}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon stageStatus="UNITS_SELECTED" reqStatus={req.status} />
                  <span className="font-semibold text-gray-900 text-sm">Unit Selection</span>
                  {reqSelectedUnits.length > 0 && (
                    <span className="text-xs text-gray-400">{reqSelectedUnits.length} selected</span>
                  )}
                </div>
                {unitsLocked
                  ? <span className="text-xs text-gray-400 italic">Requires confirmed ABO/Rh</span>
                  : <span className="text-gray-400 text-xs">{expanded.units ? "v" : ">"}</span>
                }
              </button>
              {!unitsLocked && expanded.units && (
                <div className="px-5 pb-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mt-3 mb-3">
                    Compatible pool for {req.component}. Incompatible units require a documented supervisor override to select.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                        <th className="pb-2 pr-3 font-medium">Unit #</th>
                        <th className="pb-2 pr-3 font-medium">ABO/Rh</th>
                        <th className="pb-2 pr-3 font-medium">Attributes</th>
                        <th className="pb-2 pr-3 font-medium">Expires</th>
                        <th className="pb-2 pr-3 font-medium">Location</th>
                        <th className="pb-2 pr-3 font-medium">Compatibility</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPATIBLE_UNITS_SEED.map(unit => {
                        const alreadySelected = reqSelectedUnits.includes(unit.id);
                        return (
                          <tr key={unit.id} className={`border-b border-gray-100 last:border-0 ${alreadySelected ? "bg-green-50" : ""}`}>
                            <td className="py-2 pr-3 font-mono text-xs text-blue-600">{unit.unitNumber}</td>
                            <td className="py-2 pr-3 font-medium">{unit.aboRh}</td>
                            <td className="py-2 pr-3">
                              {unit.attrs.length > 0
                                ? unit.attrs.map(a => <Tag key={a} kind="orange">{a}</Tag>)
                                : <span className="text-xs text-gray-400">None</span>
                              }
                            </td>
                            <td className="py-2 pr-3">
                              <Tag kind={unit.daysToExpiry <= 3 ? "red" : unit.daysToExpiry <= 7 ? "yellow" : "gray"}>
                                {unit.daysToExpiry}d
                              </Tag>
                            </td>
                            <td className="py-2 pr-3 text-xs text-gray-600">{unit.storage}</td>
                            <td className="py-2 pr-3">
                              {unit.compatible
                                ? <Tag kind="green">Compatible</Tag>
                                : (
                                  <span className="flex items-center gap-1">
                                    <Tag kind="red">Incompatible</Tag>
                                    <span className="text-xs text-gray-400 cursor-help" title={unit.reasons.join("; ")}>(?)</span>
                                  </span>
                                )
                              }
                            </td>
                            <td className="py-2">
                              {alreadySelected
                                ? <button className="text-xs text-red-600 hover:underline" onClick={() => handleRemoveUnit(req.id, unit.id)}>Remove</button>
                                : (
                                  <button
                                    disabled={req.status === "APPROVED" || req.status === "CANCELLED"}
                                    className={`text-xs px-2 py-1 rounded disabled:opacity-40 ${unit.compatible ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-orange-50 text-orange-700 border border-orange-300 hover:bg-orange-100"}`}
                                    onClick={() => handleSelectUnit(req.id, unit)}
                                  >
                                    {unit.compatible ? "Select" : "Override"}
                                  </button>
                                )
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Section: Crossmatch Results ── */}
            <div ref={sectionRefs.crossmatch} className={`bg-white border rounded ${crossmatchLocked ? "border-gray-100 opacity-60" : "border-gray-200"}`}>
              <button
                className="w-full flex items-center justify-between px-5 py-3 text-left"
                onClick={() => !crossmatchLocked && toggleSection("crossmatch")}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon stageStatus="CROSSMATCH_COMPLETE" reqStatus={req.status} />
                  <span className="font-semibold text-gray-900 text-sm">Crossmatch Results</span>
                  {reqSelectedUnits.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {reqSelectedUnits.filter(uid => xmResults[xmKey(req.id, uid)]).length}/{reqSelectedUnits.length} entered
                    </span>
                  )}
                </div>
                {crossmatchLocked
                  ? <span className="text-xs text-gray-400 italic">Select units first</span>
                  : <span className="text-gray-400 text-xs">{expanded.crossmatch ? "v" : ">"}</span>
                }
              </button>
              {!crossmatchLocked && expanded.crossmatch && (
                <div className="px-5 pb-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mt-3 mb-3">
                    Results entered using standard result entry workflow, filtered to crossmatch orders for this request.
                  </p>

                  {reqSelectedUnits.some(uid => xmResults[xmKey(req.id, uid)]?.result === "INCOMPATIBLE") && (
                    <Alert kind="error" title="Incompatible crossmatch result" body="A supervisor override is required before this request can be approved." />
                  )}

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                        <th className="pb-2 pr-3 font-medium">Unit</th>
                        <th className="pb-2 pr-3 font-medium">ABO/Rh</th>
                        <th className="pb-2 pr-3 font-medium">Test</th>
                        <th className="pb-2 pr-3 font-medium">Result</th>
                        <th className="pb-2 pr-3 font-medium">Entered By</th>
                        <th className="pb-2 pr-3 font-medium">Notes</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {reqSelectedUnits.map(uid => {
                        const unit     = COMPATIBLE_UNITS_SEED.find(u => u.id === uid);
                        const isOver   = !unit?.compatible;
                        const key      = xmKey(req.id, uid);
                        const saved    = xmResults[key];
                        const isEntering = enteringResultFor === key;
                        const rKind    = saved?.result === "COMPATIBLE" ? "green" : saved?.result === "INCOMPATIBLE" ? "red" : saved?.result === "INCONCLUSIVE" ? "yellow" : "gray";

                        return (
                          <Fragment key={uid}>
                            <tr className={`border-b border-gray-100 ${isEntering ? "bg-blue-50" : ""}`}>
                              <td className="py-2 pr-3 font-mono text-xs text-blue-600">{unit?.unitNumber}</td>
                              <td className="py-2 pr-3">{unit?.aboRh}</td>
                              <td className="py-2 pr-3 text-xs text-gray-600">Antiglobulin XM</td>
                              <td className="py-2 pr-3">
                                {saved
                                  ? <Tag kind={rKind}>{saved.result.charAt(0) + saved.result.slice(1).toLowerCase()}</Tag>
                                  : <Tag kind="gray">Pending</Tag>
                                }
                                {isOver && <span className="ml-1"><Tag kind="orange">Override</Tag></span>}
                              </td>
                              <td className="py-2 pr-3 text-xs text-gray-500">{saved?.enteredBy || "-"}</td>
                              <td className="py-2 pr-3 text-xs text-gray-500 max-w-xs truncate">{saved?.notes || "-"}</td>
                              <td className="py-2">
                                {req.status !== "APPROVED" && req.status !== "CANCELLED" && (
                                  isEntering
                                    ? <button className="text-xs text-gray-500 hover:underline" onClick={() => setEnteringResultFor(null)}>Cancel</button>
                                    : (
                                      <button
                                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                                        onClick={() => {
                                          setEnteringResultFor(key);
                                          setResultForm({ result: saved?.result || "COMPATIBLE", notes: saved?.notes || "" });
                                        }}
                                      >
                                        {saved ? "Edit" : "Enter Result"}
                                      </button>
                                    )
                                )}
                              </td>
                            </tr>
                            {isEntering && (
                              <tr className="bg-blue-50">
                                <td colSpan={7} className="px-4 pb-4 pt-1">
                                  <div className="border border-blue-200 rounded bg-white p-4">
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Result Entry</span>
                                      <span className="text-xs text-gray-400">Order: XM-{req.requestNumber}-{uid.toUpperCase()}</span>
                                      <span className="text-xs text-gray-400">|</span>
                                      <span className="text-xs text-gray-400">Test: Antiglobulin Crossmatch</span>
                                      <span className="text-xs text-gray-400">|</span>
                                      <span className="text-xs text-gray-400">Unit: {unit?.unitNumber}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 items-end">
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Result *</label>
                                        <select
                                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-medium"
                                          value={resultForm.result}
                                          onChange={e => setResultForm(f => ({ ...f, result: e.target.value }))}
                                        >
                                          <option value="COMPATIBLE">Compatible</option>
                                          <option value="INCOMPATIBLE">Incompatible</option>
                                          <option value="INCONCLUSIVE">Inconclusive</option>
                                        </select>
                                      </div>
                                      <div className="col-span-2">
                                        <label className="block text-xs text-gray-600 mb-1">Notes</label>
                                        <input
                                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                          placeholder="e.g. IS and AHG phase compatible. No agglutination."
                                          value={resultForm.notes}
                                          onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))}
                                        />
                                      </div>
                                    </div>
                                    {resultForm.result === "INCOMPATIBLE" && (
                                      <div className="mt-3">
                                        <Alert kind="error" title="Incompatible result" body="Saving will require a supervisor override before approval." />
                                      </div>
                                    )}
                                    <div className="flex gap-2 mt-3">
                                      <button className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-800" onClick={() => handleSaveResult(req.id, uid)}>Save Result</button>
                                      <button className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50" onClick={() => setEnteringResultFor(null)}>Cancel</button>
                                    </div>
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
              )}
            </div>

            {/* ── Section: Approval ── */}
            <div ref={sectionRefs.approval} className={`bg-white border rounded ${approvalLocked ? "border-gray-100 opacity-60" : "border-gray-200"}`}>
              <button
                className="w-full flex items-center justify-between px-5 py-3 text-left"
                onClick={() => !approvalLocked && toggleSection("approval")}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon stageStatus="APPROVED" reqStatus={req.status} />
                  <span className="font-semibold text-gray-900 text-sm">Approval</span>
                </div>
                {approvalLocked && req.status !== "APPROVED"
                  ? <span className="text-xs text-gray-400 italic">All crossmatches must be entered</span>
                  : <span className="text-gray-400 text-xs">{expanded.approval ? "v" : ">"}</span>
                }
              </button>
              {!approvalLocked && expanded.approval && (
                <div className="px-5 pb-4 border-t border-gray-100">
                  {req.status === "APPROVED" ? (
                    <div className="mt-3">
                      <div className="bg-green-50 border border-green-200 rounded p-4 flex items-start gap-3">
                        <span className="text-green-600 text-xl mt-0.5">&#10003;</span>
                        <div>
                          <p className="font-semibold text-green-800">Request Approved</p>
                          <p className="text-sm text-green-700 mt-0.5">Units are cleared and ready for issue to patient. Proceed to Issue-to-Patient workflow.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-4">
                        All {reqSelectedUnits.length} crossmatch result{reqSelectedUnits.length !== 1 ? "s" : ""} entered. Approve to clear units for issue to patient.
                      </p>
                      {reqSelectedUnits.some(uid => xmResults[xmKey(req.id, uid)]?.result === "INCOMPATIBLE") && (
                        <div className="mb-4">
                          <Alert kind="error" title="Incompatible result present" body="Supervisor override must be documented before approval." />
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">Supervisor Override Reason *</label>
                            <textarea rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Document clinical justification for approving despite incompatible crossmatch..." />
                          </div>
                        </div>
                      )}
                      <button
                        className="bg-green-700 text-white px-5 py-2 rounded text-sm font-medium hover:bg-green-800"
                        onClick={() => handleApprove(req.id)}
                      >
                        &#10003; Approve Request
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom spacer for sticky footer */}
            <div className="h-16"></div>
          </div>
        </div>

        {/* Sticky footer action bar - mirrors Pathology pattern */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-3 z-10">
          <button
            className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50"
            onClick={() => setView("worklist")}
          >
            Back to Worklist
          </button>
          <div className="flex-1"></div>
          {req.status !== "CANCELLED" && req.status !== "ISSUED" && req.status !== "APPROVED" && (
            <button
              className="border border-red-300 text-red-600 px-4 py-1.5 rounded text-sm hover:bg-red-50"
              onClick={() => { setCancelTarget(req.id); setCancelReason("NO_LONGER_REQUIRED"); }}
            >
              Cancel Request
            </button>
          )}
          {canApprove && (
            <button
              className="bg-green-700 text-white px-5 py-2 rounded text-sm font-medium hover:bg-green-800"
              onClick={() => handleApprove(req.id)}
            >
              &#10003; Approve Request
            </button>
          )}
          {req.status === "APPROVED" && (
            <button className="bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-800">
              Proceed to Issue
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Modals ────────────────────────────────────────────────────────────────

  const renderOverrideModal = () => {
    if (!overrideTarget) return null;
    const { unit } = overrideTarget;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded shadow-xl p-6 w-[480px]">
          <h3 className="font-semibold text-gray-900 mb-1">Compatibility Override Required</h3>
          <p className="text-sm text-gray-600 mb-3">
            Unit <span className="font-mono text-blue-600">{unit.unitNumber}</span> has a compatibility concern:
          </p>
          <ul className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-800 space-y-1">
            {unit.reasons.map((r, i) => <li key={i}>- {r}</li>)}
          </ul>
          <label className="block text-xs text-gray-600 mb-1">
            Override Reason * <span className="text-gray-400">(recorded in audit log)</span>
          </label>
          <textarea
            rows={3}
            className={`w-full border rounded px-3 py-2 text-sm mb-1 ${overrideError ? "border-red-500" : "border-gray-300"}`}
            placeholder="Explain clinical justification for proceeding..."
            value={overrideReason}
            onChange={e => setOverrideReason(e.target.value)}
          />
          {overrideError && <p className="text-red-600 text-xs mb-3">{overrideError}</p>}
          <div className="flex gap-2 mt-2">
            <button className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700" onClick={handleConfirmOverride}>
              Confirm Override and Select
            </button>
            <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50" onClick={() => setOverrideTarget(null)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCancelModal = () => {
    if (!cancelTarget) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded shadow-xl p-6 w-96">
          <h3 className="font-semibold text-gray-900 mb-1">Cancel Transfusion Request</h3>
          <p className="text-sm text-gray-600 mb-4">All reserved units will be released back to available inventory.</p>
          <label className="block text-xs text-gray-600 mb-1">Reason *</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4" value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
            <option value="PATIENT_CANCELLED">Patient cancelled</option>
            <option value="NO_LONGER_REQUIRED">No longer required</option>
            <option value="INCORRECT_REQUEST">Incorrect request</option>
            <option value="OTHER">Other</option>
          </select>
          <div className="flex gap-2">
            <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700" onClick={handleCancel}>Cancel Request</button>
            <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50" onClick={() => setCancelTarget(null)}>Keep Request</button>
          </div>
        </div>
      </div>
    );
  };

  // -- Shell (Carbon UI Shell pattern: single fixed header + slide-out SideNav)

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

      {/* ── Fixed Carbon-style header bar ── */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-[#161616] text-white flex items-center z-50 shadow">

        {/* Hamburger / menu toggle */}
        <button
          onClick={() => setSideNavOpen(o => !o)}
          className="w-12 h-12 flex items-center justify-center hover:bg-white/10 shrink-0 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3"  width="20" height="2" rx="1"/>
            <rect y="9"  width="20" height="2" rx="1"/>
            <rect y="15" width="20" height="2" rx="1"/>
          </svg>
        </button>

        {/* Product name */}
        <span className="text-sm font-semibold tracking-wide pl-1">OpenELIS Global</span>

        {/* Right-side global actions */}
        <div className="ml-auto flex items-center">
          {/* Notifications */}
          <button className="w-12 h-12 flex items-center justify-center hover:bg-white/10 transition-colors" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
              <path d="M28.7 21.6L26 17.4V13a10 10 0 00-9-9.95V1h-2v2.05A10 10 0 006 13v4.4l-2.7 4.2A1 1 0 004 23h8a4 4 0 008 0h8a1 1 0 00.7-1.4zM16 25a2 2 0 01-2-2h4a2 2 0 01-2 2z"/>
            </svg>
          </button>
          {/* Settings */}
          <button className="w-12 h-12 flex items-center justify-center hover:bg-white/10 transition-colors" title="Settings">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
              <path d="M27 16.76V15.24l1.9-1.68a2 2 0 00.4-2.48l-2-3.46a2 2 0 00-2.34-.88l-2.4.8a11.13 11.13 0 00-2.52-1.46L19.5 3.6A2 2 0 0017.54 2H14.46A2 2 0 0012.5 3.6l-.54 2.48A11.13 11.13 0 009.44 7.54l-2.4-.8a2 2 0 00-2.34.88L2.7 11.08a2 2 0 00.4 2.48L5 15.24V16.76l-1.9 1.68a2 2 0 00-.4 2.48l2 3.46a2 2 0 002.34.88l2.4-.8a11.13 11.13 0 002.52 1.46l.54 2.48A2 2 0 0014.46 30h3.08a2 2 0 001.96-1.6l.54-2.48A11.13 11.13 0 0022.56 24.46l2.4.8a2 2 0 002.34-.88l2-3.46a2 2 0 00-.4-2.48zm-11 1.24a4 4 0 110-4 4 4 0 010 4z"/>
            </svg>
          </button>
          {/* User avatar */}
          <button className="w-12 h-12 flex items-center justify-center hover:bg-white/10 transition-colors" title="Current User">
            <div className="w-7 h-7 rounded-full bg-[#6f6f6f] flex items-center justify-center text-xs font-bold select-none">CU</div>
          </button>
        </div>
      </header>

      {/* ── SideNav overlay (dim background; click to close) ── */}
      {sideNavOpen && (
        <div
          className="fixed inset-0 top-12 bg-black/40 z-30"
          onClick={() => setSideNavOpen(false)}
        />
      )}

      {/* ── Carbon SideNav slide-out ── */}
      <nav
        aria-label="Main navigation"
        className={`fixed top-12 left-0 bottom-0 w-64 bg-[#161616] z-40 overflow-y-auto
          transition-transform duration-200 ${sideNavOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <ul className="py-2">

          {/* Simple top-level items */}
          {["Home", "Add Order", "Results", "Patient"].map(item => (
            <li key={item}>
              <button className="w-full text-left px-4 py-2.5 text-sm text-[#c6c6c6] hover:bg-white/10 hover:text-white transition-colors">
                {item}
              </button>
            </li>
          ))}

          {/* Blood Bank -- expandable SideNavMenu (active section) */}
          <li>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-white font-semibold flex items-center justify-between hover:bg-white/10 transition-colors"
              onClick={() => setBloodBankExpanded(o => !o)}
            >
              <span>Blood Bank</span>
              {/* Chevron */}
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
                className={`transition-transform duration-150 shrink-0 ${bloodBankExpanded ? "rotate-180" : ""}`}
              >
                <path d="M8 11L3 6h10z"/>
              </svg>
            </button>
            {bloodBankExpanded && (
              <ul>
                {[
                  { label: "Pre-Transfusion Testing", active: true  },
                  { label: "Inventory",               active: false },
                  { label: "Receive Unit",            active: false },
                  { label: "Patient Record",          active: false },
                ].map(sub => (
                  <li key={sub.label}>
                    <button
                      className={`w-full text-left pl-8 pr-4 py-2.5 text-sm border-l-4 transition-colors ${
                        sub.active
                          ? "border-[#0f62fe] bg-[#393939] text-white font-medium"
                          : "border-transparent text-[#c6c6c6] hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {sub.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Remaining top-level items */}
          {["Quality Control", "Reports", "Admin"].map(item => (
            <li key={item}>
              <button className="w-full text-left px-4 py-2.5 text-sm text-[#c6c6c6] hover:bg-white/10 hover:text-white transition-colors">
                {item}
              </button>
            </li>
          ))}

        </ul>
      </nav>

      {/* ── Main content area -- offset by fixed header ── */}
      <div className="pt-12">

        {view === "detail" ? (
          renderDetail()
        ) : (
          <>
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200 px-6 py-2 text-xs text-gray-500 flex items-center gap-1.5">
              <span className="hover:underline cursor-pointer">Home</span>
              <span>/</span>
              <span className="hover:underline cursor-pointer">Blood Bank</span>
              <span>/</span>
              <span className="text-gray-800 font-medium">
                {view === "new" ? "New Transfusion Request" : "Pre-Transfusion Testing"}
              </span>
            </div>
            <div className="max-w-7xl mx-auto px-6 py-6">
              {view === "worklist" && renderDashboard()}
              {view === "new"      && renderNewForm()}
            </div>
          </>
        )}

      </div>

      {renderOverrideModal()}
      {renderCancelModal()}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
