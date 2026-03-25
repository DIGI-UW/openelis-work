import { useState } from "react";

// NOTE: Previewable mockup using Tailwind CSS.
// Carbon React conversion to follow in implementation phase.

const SEED_TYPES = [
  { id: 1, name: "Packed Red Blood Cells", abbr: "pRBC", volumeMl: 250, storage: "Refrigerated 1–6°C",       active: true,  seeded: true  },
  { id: 2, name: "Fresh Frozen Plasma",    abbr: "FFP",  volumeMl: 220, storage: "Frozen –18°C or below",   active: true,  seeded: true  },
  { id: 3, name: "Platelets",              abbr: "PLT",  volumeMl: 50,  storage: "Agitated Room Temp",       active: true,  seeded: true  },
  { id: 4, name: "Cryoprecipitate",        abbr: "CRYO", volumeMl: 15,  storage: "Frozen –18°C or below",   active: true,  seeded: true  },
  { id: 5, name: "Whole Blood",            abbr: "WB",   volumeMl: 450, storage: "Refrigerated 1–6°C",       active: true,  seeded: true  },
  { id: 6, name: "Granulocytes",           abbr: "GRA",  volumeMl: 200, storage: "Room Temperature 20–24°C",active: false, seeded: true  },
];

const STORAGE_OPTS = [
  "Refrigerated 1–6°C", "Frozen –18°C or below", "Frozen –65°C or below",
  "Room Temperature 20–24°C", "Agitated Room Temperature", "Other",
];

const EMPTY = { name: "", abbr: "", volumeMl: "", storage: "", description: "" };

function Badge({ color, label }) {
  const colors = {
    green:  "bg-green-100 text-green-800",
    gray:   "bg-gray-100 text-gray-600",
    teal:   "bg-teal-100 text-teal-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color]}`}>
      {label}
    </span>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded px-4 py-3">
      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
      </svg>
      <span className="text-sm text-green-800 flex-1">{message}</span>
      <button onClick={onClose} className="text-green-500 hover:text-green-700">✕</button>
    </div>
  );
}

function InlineForm({ form, setForm, errors, isSeeded, onSave, onCancel }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-2">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
          <input
            className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Packed Red Blood Cells"
          />
          {errors.name && <p className="text-xs text-red-600 mt-0.5">{errors.name}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Abbreviation <span className="text-red-500">*</span></label>
          <input
            className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.abbr ? "border-red-400 bg-red-50" : "border-gray-300"} ${isSeeded ? "bg-gray-100 cursor-not-allowed" : ""}`}
            value={form.abbr} onChange={e => setForm(f => ({ ...f, abbr: e.target.value }))}
            disabled={isSeeded} placeholder="e.g. pRBC"
          />
          {isSeeded && <p className="text-xs text-gray-400 mt-0.5">Locked for default types</p>}
          {errors.abbr && <p className="text-xs text-red-600 mt-0.5">{errors.abbr}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Default Volume (mL)</label>
          <input
            type="number" min="1" max="9999"
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.volumeMl} onChange={e => setForm(f => ({ ...f, volumeMl: e.target.value }))}
            placeholder="e.g. 250"
          />
        </div>
        <div className="col-span-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Storage Requirement <span className="text-red-500">*</span></label>
          <select
            className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.storage ? "border-red-400 bg-red-50" : "border-gray-300"}`}
            value={form.storage} onChange={e => setForm(f => ({ ...f, storage: e.target.value }))}
          >
            <option value="">Select...</option>
            {STORAGE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {errors.storage && <p className="text-xs text-red-600 mt-0.5">{errors.storage}</p>}
        </div>
        <div className="col-span-12">
          <details className="text-xs text-gray-500 cursor-pointer">
            <summary className="font-medium text-gray-600 hover:text-gray-800">Additional Details</summary>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2} maxLength={500}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </details>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onSave} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium">Save</button>
        <button onClick={onCancel} className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}

export default function ComponentTypes() {
  const [rows, setRows]             = useState(SEED_TYPES);
  const [expandedRow, setExpandedRow] = useState(null);
  const [addingNew, setAddingNew]   = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [errors, setErrors]         = useState({});
  const [notification, setNotification] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [search, setSearch]         = useState("");

  const flash = msg => { setNotification(msg); setTimeout(() => setNotification(null), 4000); };

  const validate = (editingId = null) => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.abbr.trim()) e.abbr = "Abbreviation is required.";
    if (!form.storage)     e.storage = "Storage requirement is required.";
    if (form.name.trim() && rows.find(r => r.name.toLowerCase() === form.name.toLowerCase() && r.id !== editingId))
      e.name = "A component type with this name already exists.";
    if (form.abbr.trim() && rows.find(r => r.abbr.toLowerCase() === form.abbr.toLowerCase() && r.id !== editingId))
      e.abbr = "This abbreviation is already in use.";
    return e;
  };

  const handleAddSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setRows(p => [...p, { ...form, id: Date.now(), volumeMl: form.volumeMl ? parseInt(form.volumeMl) : null, active: true, seeded: false }]);
    setAddingNew(false); setForm(EMPTY); setErrors({});
    flash("Component type saved successfully.");
  };

  const handleEditSave = id => {
    const e = validate(id);
    if (Object.keys(e).length) { setErrors(e); return; }
    setRows(p => p.map(r => r.id === id ? { ...r, ...form, volumeMl: form.volumeMl ? parseInt(form.volumeMl) : null } : r));
    setExpandedRow(null); setErrors({});
    flash("Component type saved successfully.");
  };

  const openEdit = row => {
    setAddingNew(false);
    setExpandedRow(row.id);
    setForm({ name: row.name, abbr: row.abbr, volumeMl: row.volumeMl ?? "", storage: row.storage, description: row.description || "" });
    setErrors({});
  };

  const cancel = () => { setAddingNew(false); setExpandedRow(null); setForm(EMPTY); setErrors({}); };

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.abbr.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <span>Admin</span> <span className="mx-1">›</span>
          <span>Blood Bank</span> <span className="mx-1">›</span>
          <span className="text-gray-900 font-medium">Component Types</span>
        </nav>

        <h1 className="text-2xl font-light text-gray-900 mb-6">Component Types</h1>

        {notification && (
          <div className="mb-4">
            <Toast message={notification} onClose={() => setNotification(null)} />
          </div>
        )}

        {/* Table card */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <input
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              placeholder="Search component types..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <div className="flex-1" />
            <button
              onClick={() => { setAddingNew(true); setExpandedRow(null); setForm(EMPTY); setErrors({}); }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium"
            >
              <span className="text-lg leading-none">+</span> Add Component Type
            </button>
          </div>

          {/* Inline add form */}
          {addingNew && (
            <div className="px-4 pt-3">
              <InlineForm form={form} setForm={setForm} errors={errors} isSeeded={false} onSave={handleAddSave} onCancel={cancel} />
            </div>
          )}

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Abbreviation</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Default Volume (mL)</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Storage Requirement</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <>
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.name}
                        {row.seeded && <Badge color="teal" label="Default" />}
                      </div>
                    </td>
                    <td className="px-4 py-3"><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{row.abbr}</code></td>
                    <td className="px-4 py-3 text-gray-600">{row.volumeMl ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{row.storage}</td>
                    <td className="px-4 py-3">
                      {row.active ? <Badge color="green" label="Active" /> : <Badge color="gray" label="Inactive" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => expandedRow === row.id ? cancel() : openEdit(row)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          Edit {expandedRow === row.id ? "▲" : "▼"}
                        </button>
                        {row.active ? (
                          <button onClick={() => setDeactivateTarget(row)} className="text-gray-500 hover:text-red-600 text-sm">Deactivate</button>
                        ) : (
                          <button onClick={() => { setRows(p => p.map(r => r.id === row.id ? { ...r, active: true } : r)); flash("Component type activated."); }} className="text-gray-500 hover:text-green-600 text-sm">Activate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === row.id && (
                    <tr key={`edit-${row.id}`} className="border-b border-gray-100 bg-blue-50">
                      <td colSpan={6} className="px-4 py-3">
                        <InlineForm form={form} setForm={setForm} errors={errors} isSeeded={row.seeded} onSave={() => handleEditSave(row.id)} onCancel={cancel} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No component types found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Deactivate modal */}
        {deactivateTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Deactivate Component Type</h2>
              <p className="text-sm text-gray-600 mb-3">
                Are you sure you want to deactivate this component type? It will no longer appear in blood unit or transfusion request workflows.
              </p>
              <p className="text-sm font-semibold text-gray-800 mb-5">
                {deactivateTarget.name} ({deactivateTarget.abbr})
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeactivateTarget(null)} className="px-4 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => {
                    setRows(p => p.map(r => r.id === deactivateTarget.id ? { ...r, active: false } : r));
                    setDeactivateTarget(null);
                    flash("Component type deactivated.");
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
