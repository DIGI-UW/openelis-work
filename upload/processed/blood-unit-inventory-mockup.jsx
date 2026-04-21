import { useState, useMemo } from "react";

// NOTE: Previewable mockup using Tailwind CSS.
// Carbon React conversion to follow in implementation phase.

const COMPONENT_TYPES = [
  { id: 1, abbr: "pRBC", name: "Packed Red Blood Cells" },
  { id: 2, abbr: "FFP",  name: "Fresh Frozen Plasma"    },
  { id: 3, abbr: "PLT",  name: "Platelets"              },
  { id: 4, abbr: "CRYO", name: "Cryoprecipitate"        },
  { id: 5, abbr: "WB",   name: "Whole Blood"            },
];

const STORAGE_LOCATIONS = [
  { id: 1, code: "FRIDGE-1",  name: "Blood Bank Refrigerator 1" },
  { id: 2, code: "PLT-INC-A", name: "Platelet Incubator A"      },
  { id: 3, code: "FREEZER-1", name: "FFP Freezer 1"             },
];

const SPECIAL_ATTRS = ["Irradiated", "CMV Negative", "Leukoreduced", "Washed", "HLA Matched"];
const DISCARD_REASONS = [
  { id: "EXPIRED",    label: "Expired" },
  { id: "QUALITY",    label: "Quality issue / failed inspection" },
  { id: "NOT_NEEDED", label: "Ordered but not needed" },
  { id: "OTHER",      label: "Other" },
];

const now = new Date();
const dOut = d => new Date(now.getTime() + d * 86400000);

const SAMPLE_UNITS = [
  { id: 1, unitNumber: "W123456789", orderId: "BB-0041", ctId: 1, abo: "O",  rh: "−", exp: dOut(2),  storage: "FRIDGE-1",  status: "AVAILABLE",  validated: true,  supplier: "Regional Blood Center" },
  { id: 2, unitNumber: "W123456790", orderId: "BB-0042", ctId: 1, abo: "A",  rh: "+", exp: dOut(6),  storage: "FRIDGE-1",  status: "QUARANTINE", validated: false, supplier: "Regional Blood Center" },
  { id: 3, unitNumber: "P987654321", orderId: "BB-0043", ctId: 3, abo: "B",  rh: "+", exp: dOut(14), storage: "PLT-INC-A", status: "QUARANTINE", validated: false, supplier: "Regional Blood Center" },
  { id: 4, unitNumber: "F112233445", orderId: "BB-0044", ctId: 2, abo: "O",  rh: "+", exp: dOut(90), storage: "FREEZER-1", status: "RESERVED",   validated: true,  supplier: "City Blood Bank", linkedRequest: "TR-00142" },
  { id: 5, unitNumber: "W123456791", orderId: "BB-0045", ctId: 1, abo: "AB", rh: "+", exp: dOut(3),  storage: "FRIDGE-1",  status: "AVAILABLE",  validated: true,  supplier: "Regional Blood Center" },
];

const STATUS_STYLES = {
  QUARANTINE: { bg: "bg-purple-100 text-purple-800", label: "Quarantine" },
  AVAILABLE:  { bg: "bg-green-100 text-green-800",   label: "Available"  },
  RESERVED:   { bg: "bg-blue-100 text-blue-800",     label: "Reserved"   },
  ISSUED:     { bg: "bg-teal-100 text-teal-800",     label: "Issued"     },
  DISCARDED:  { bg: "bg-gray-100 text-gray-600",     label: "Discarded"  },
  EXPIRED:    { bg: "bg-red-100 text-red-700",       label: "Expired"    },
};

function daysUntil(d) { return Math.ceil((new Date(d) - now) / 86400000); }

function ExpiryCell({ date }) {
  const d = daysUntil(date);
  if (d < 0)  return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Expired</span>;
  if (d <= 3) return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">{d}d</span>;
  if (d <= 7) return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">{d}d</span>;
  return <span className="text-gray-600 text-sm">{d}d</span>;
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.AVAILABLE;
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${s.bg}`}>{s.label}</span>;
}

function parseISBT(raw) {
  if (!raw.startsWith("=")) return null;
  return { unitNumber: raw.slice(1), abo: "O", rh: "−", ctId: "1", exp: dOut(35).toISOString().split("T")[0] };
}

const EMPTY_FORM = { unitNumber: "", ctId: "", abo: "", rh: "", exp: "", storageId: "", supplier: "", attrs: [] };

function ReceiveForm({ onSave, onDone }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [autoFilled, setAutoFilled] = useState(false);

  const handleScan = val => {
    const p = parseISBT(val);
    if (p) { setForm(f => ({ ...f, unitNumber: val, abo: p.abo, rh: p.rh, ctId: p.ctId, exp: p.exp })); setAutoFilled(true); }
    else   { setForm(f => ({ ...f, unitNumber: val })); setAutoFilled(false); }
  };

  const validate = () => {
    const e = {};
    if (!form.unitNumber.trim()) e.unitNumber = "Unit number is required.";
    if (!form.ctId)    e.ctId    = "Component type is required.";
    if (!form.abo)     e.abo     = "ABO group is required.";
    if (!form.rh)      e.rh      = "Rh type is required.";
    if (!form.exp)     e.exp     = "Expiration date is required.";
    if (!form.storageId) e.storageId = "Storage location is required.";
    return e;
  };

  const handleSave = andAnother => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
    if (andAnother) { setForm(EMPTY_FORM); setErrors({}); setAutoFilled(false); }
  };

  const F = ({ id, label, required, err, children }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {err && <p className="text-xs text-red-600 mt-0.5">{err}</p>}
    </div>
  );
  const inputCls = err => `w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? "border-red-400 bg-red-50" : "border-gray-300"}`;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-600 rounded p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Receive Blood Unit</h3>
        <span className="text-xs text-gray-500 bg-blue-100 px-2 py-0.5 rounded">Blood Bank Program — order will be created automatically</span>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-3">
          <F id="unit" label="Unit Number" required err={errors.unitNumber}>
            <input autoFocus className={inputCls(errors.unitNumber)} value={form.unitNumber}
              onChange={e => handleScan(e.target.value)} placeholder="Scan ISBT 128 or type..." />
            {autoFilled && <p className="text-xs text-blue-600 mt-0.5">✓ Auto-filled from barcode</p>}
          </F>
        </div>
        <div className="col-span-3">
          <F id="ct" label="Component Type" required err={errors.ctId}>
            <select className={inputCls(errors.ctId)} value={form.ctId} onChange={e => setForm(f => ({ ...f, ctId: e.target.value }))}>
              <option value="">Select...</option>
              {COMPONENT_TYPES.map(c => <option key={c.id} value={String(c.id)}>{c.abbr} — {c.name}</option>)}
            </select>
          </F>
        </div>
        <div className="col-span-1">
          <F id="abo" label="ABO" required err={errors.abo}>
            <select className={inputCls(errors.abo)} value={form.abo} onChange={e => setForm(f => ({ ...f, abo: e.target.value }))}>
              <option value="">—</option>
              {["A","B","AB","O"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </F>
        </div>
        <div className="col-span-1">
          <F id="rh" label="Rh" required err={errors.rh}>
            <select className={inputCls(errors.rh)} value={form.rh} onChange={e => setForm(f => ({ ...f, rh: e.target.value }))}>
              <option value="">—</option>
              <option value="+">Positive (+)</option>
              <option value="−">Negative (−)</option>
            </select>
          </F>
        </div>
        <div className="col-span-2">
          <F id="exp" label="Expiration Date" required err={errors.exp}>
            <input type="date" className={inputCls(errors.exp)} value={form.exp} onChange={e => setForm(f => ({ ...f, exp: e.target.value }))} />
          </F>
        </div>
        <div className="col-span-3">
          <F id="storage" label="Storage Location" required err={errors.storageId}>
            <select className={inputCls(errors.storageId)} value={form.storageId} onChange={e => setForm(f => ({ ...f, storageId: e.target.value }))}>
              <option value="">Select...</option>
              {STORAGE_LOCATIONS.map(l => <option key={l.id} value={String(l.id)}>{l.name} ({l.code})</option>)}
            </select>
          </F>
        </div>
        <div className="col-span-3">
          <F id="supplier" label="Supplier / Blood Center">
            <input className={inputCls(false)} value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Regional Blood Center" />
          </F>
        </div>
        <div className="col-span-12">
          <details className="text-xs">
            <summary className="text-gray-500 cursor-pointer font-medium hover:text-gray-700">Special Attributes (optional)</summary>
            <div className="flex flex-wrap gap-2 mt-2">
              {SPECIAL_ATTRS.map(a => (
                <label key={a} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" className="rounded" checked={form.attrs.includes(a)}
                    onChange={e => setForm(f => ({ ...f, attrs: e.target.checked ? [...f.attrs, a] : f.attrs.filter(x => x !== a) }))} />
                  {a}
                </label>
              ))}
            </div>
          </details>
        </div>
      </div>

      <div className="mt-3 p-2.5 bg-blue-100 rounded text-xs text-blue-800 flex items-center gap-2">
        <span>ℹ</span> Default confirmatory tests will be ordered automatically: <strong>ABO Grouping, Rh Typing</strong>
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => handleSave(false)} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium">Receive & Order Tests</button>
        <button onClick={() => handleSave(true)}  className="px-4 py-1.5 bg-white border border-blue-600 text-blue-600 text-sm rounded hover:bg-blue-50 font-medium">Receive & Next Unit</button>
        <button onClick={onDone} className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50">Done</button>
      </div>
    </div>
  );
}

function DetailPanel({ unit }) {
  const ct = COMPONENT_TYPES.find(c => c.id === unit.ctId);
  return (
    <div className="bg-gray-50 border-t border-gray-200 px-4 py-4">
      <div className="grid grid-cols-5 gap-4 text-sm mb-4">
        <div><p className="text-xs text-gray-500 mb-0.5">Order</p><code className="text-xs bg-white border px-1.5 py-0.5 rounded">{unit.orderId}</code></div>
        <div><p className="text-xs text-gray-500 mb-0.5">Component Type</p><p>{ct?.name}</p></div>
        <div><p className="text-xs text-gray-500 mb-0.5">Expiration</p><p>{new Date(unit.exp).toLocaleDateString()}</p></div>
        <div><p className="text-xs text-gray-500 mb-0.5">Storage</p><code className="text-xs bg-white border px-1.5 py-0.5 rounded">{unit.storage}</code></div>
        <div><p className="text-xs text-gray-500 mb-0.5">Supplier</p><p>{unit.supplier || "—"}</p></div>
      </div>
      {unit.linkedRequest && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">Linked Transfusion Request:</span>
          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{unit.linkedRequest}</span>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Confirmatory Tests</p>
        <div className="flex gap-3">
          {["ABO Grouping", "Rh Typing"].map(test => (
            <div key={test} className="flex items-center gap-2 bg-white border rounded px-3 py-2 text-sm">
              <span>{test}</span>
              {unit.validated
                ? <><span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">{test === "ABO Grouping" ? unit.abo : (unit.rh === "+" ? "Pos" : "Neg")}</span>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-teal-100 text-teal-800">Validated</span></>
                : <span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800">Pending</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BloodUnitInventory() {
  const [units, setUnits] = useState(SAMPLE_UNITS);
  const [showForm, setShowForm] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);
  const [discardTarget, setDiscardTarget] = useState(null);
  const [discardReason, setDiscardReason] = useState("");

  const flash = msg => { setNotification(msg); setTimeout(() => setNotification(null), 5000); };

  const filtered = useMemo(() => {
    let list = units;
    if (statusFilter === "ACTIVE") list = list.filter(u => ["QUARANTINE","AVAILABLE","RESERVED"].includes(u.status));
    else if (statusFilter !== "ALL") list = list.filter(u => u.status === statusFilter);
    if (search) list = list.filter(u => u.unitNumber.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [units, statusFilter, search]);

  const expiryCount = useMemo(() =>
    units.filter(u => ["QUARANTINE","AVAILABLE"].includes(u.status) && daysUntil(u.exp) <= 3).length, [units]);

  const handleReceiveSave = form => {
    const sl = STORAGE_LOCATIONS.find(l => String(l.id) === form.storageId);
    setUnits(p => [...p, {
      id: Date.now(), unitNumber: form.unitNumber,
      orderId: `BB-00${50 + p.length}`,
      ctId: parseInt(form.ctId), abo: form.abo, rh: form.rh,
      exp: new Date(form.exp), storage: sl?.code || "",
      status: "QUARANTINE", validated: false, supplier: form.supplier,
    }]);
    flash(`Unit ${form.unitNumber} received. Confirmatory tests ordered.`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="text-sm text-gray-500 mb-6">
          <span>Blood Bank</span> <span className="mx-1">›</span>
          <span className="text-gray-900 font-medium">Inventory</span>
        </nav>
        <h1 className="text-2xl font-light text-gray-900 mb-6">Blood Unit Inventory</h1>

        {/* Notifications */}
        {notification && (
          <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded px-4 py-3">
            <span className="text-green-700 text-sm flex-1">{notification}</span>
            <button onClick={() => setNotification(null)} className="text-green-500">✕</button>
          </div>
        )}
        {expiryCount > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded px-4 py-3">
            <span className="text-amber-700 text-sm">⚠ {expiryCount} unit(s) are expiring within 3 days. Review inventory.</span>
          </div>
        )}

        {showForm && <ReceiveForm onSave={handleReceiveSave} onDone={() => setShowForm(false)} />}

        {/* Table card */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-wrap">
            <input className="border border-gray-300 rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by unit number..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ACTIVE">Active units</option>
              <option value="ALL">All units</option>
              <option value="QUARANTINE">Quarantine</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="DISCARDED">Discarded</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <div className="flex-1" />
            <button onClick={() => { setShowForm(true); setExpandedRow(null); }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium">
              <span className="text-lg leading-none">+</span> Receive Unit
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                {["Unit Number","Order","Component","ABO / Rh","Expiration","Storage","Status","Days to Expiry",""].map(h => (
                  <th key={h} className="px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <>
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(p => p === u.id ? null : u.id)}>
                    <td className="px-4 py-3"><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{u.unitNumber}</code></td>
                    <td className="px-4 py-3"><code className="text-xs text-gray-500">{u.orderId}</code></td>
                    <td className="px-4 py-3">{COMPONENT_TYPES.find(c => c.id === u.ctId)?.abbr}</td>
                    <td className="px-4 py-3 font-medium">{u.abo} {u.rh}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(u.exp).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{u.storage}</code></td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3"><ExpiryCell date={u.exp} /></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        {["QUARANTINE","AVAILABLE"].includes(u.status) && (
                          <button onClick={() => setDiscardTarget(u)} className="text-red-500 hover:text-red-700 text-xs font-medium">Discard</button>
                        )}
                        <span className="text-gray-400 text-xs">{expandedRow === u.id ? "▲" : "▼"}</span>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === u.id && (
                    <tr key={`detail-${u.id}`}>
                      <td colSpan={9}><DetailPanel unit={u} /></td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">No units found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discard modal */}
      {discardTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Discard Unit</h2>
            <p className="text-sm text-gray-600 mb-3">Are you sure you want to discard this unit? This cannot be undone.</p>
            <p className="text-sm font-semibold mb-4">
              {discardTarget.unitNumber} — {discardTarget.abo} {discardTarget.rh} · Order {discardTarget.orderId}
            </p>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
            <select className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm mb-4"
              value={discardReason} onChange={e => setDiscardReason(e.target.value)}>
              <option value="">Select a reason...</option>
              {DISCARD_REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setDiscardTarget(null); setDiscardReason(""); }} className="px-4 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50">Cancel</button>
              <button
                disabled={!discardReason}
                onClick={() => {
                  setUnits(p => p.map(u => u.id === discardTarget.id ? { ...u, status: "DISCARDED" } : u));
                  flash(`Unit ${discardTarget.unitNumber} discarded.`);
                  setDiscardTarget(null); setDiscardReason("");
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
