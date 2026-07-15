import React, { useState } from 'react';

const mockSampleTypes = [
  { id: '1', name: 'Serum', displayOrder: 1, active: true, testCount: 87, whonetCode: 'bl', storageTemp: '2–8°C', storageDuration: 72, storageDurationUnit: 'hours' },
  { id: '2', name: 'Plasma (EDTA)', displayOrder: 2, active: true, testCount: 45, whonetCode: 'bl', storageTemp: '2–8°C', storageDuration: 48, storageDurationUnit: 'hours' },
  { id: '3', name: 'Plasma (Heparin)', displayOrder: 3, active: true, testCount: 23, whonetCode: 'bl', storageTemp: '2–8°C', storageDuration: 48, storageDurationUnit: 'hours' },
  { id: '4', name: 'Whole Blood (EDTA)', displayOrder: 4, active: true, testCount: 34, whonetCode: 'bl', storageTemp: 'Room Temp', storageDuration: 24, storageDurationUnit: 'hours' },
  { id: '5', name: 'Urine - Random', displayOrder: 5, active: true, testCount: 28, whonetCode: 'ur', storageTemp: '2–8°C', storageDuration: 24, storageDurationUnit: 'hours' },
  { id: '6', name: 'Urine - 24 Hour', displayOrder: 6, active: true, testCount: 15, whonetCode: 'ur', storageTemp: '2–8°C', storageDuration: 72, storageDurationUnit: 'hours' },
  { id: '7', name: 'CSF', displayOrder: 7, active: true, testCount: 12, whonetCode: 'cs', storageTemp: 'Room Temp', storageDuration: 1, storageDurationUnit: 'hours' },
  { id: '8', name: 'Sputum', displayOrder: 8, active: true, testCount: 8, whonetCode: 'sp', storageTemp: '2–8°C', storageDuration: 24, storageDurationUnit: 'hours' },
  { id: '9', name: 'Stool', displayOrder: 9, active: true, testCount: 11, whonetCode: 'st', storageTemp: '2–8°C', storageDuration: 24, storageDurationUnit: 'hours' },
  { id: '10', name: 'Wound Swab', displayOrder: 10, active: true, testCount: 6, whonetCode: 'wo', storageTemp: 'Room Temp', storageDuration: 2, storageDurationUnit: 'hours' },
  { id: '11', name: 'Blood Culture', displayOrder: 11, active: true, testCount: 4, whonetCode: 'bl', storageTemp: 'Room Temp', storageDuration: 2, storageDurationUnit: 'hours' },
  { id: '12', name: 'Synovial Fluid', displayOrder: 12, active: false, testCount: 3, whonetCode: 'sf', storageTemp: 'Room Temp', storageDuration: 1, storageDurationUnit: 'hours' },
];

// Tests currently assigned to this sample type
const initialAssignedTests = [
  { id: '1', name: 'Glucose, Fasting', section: 'Chemistry', loinc: '1558-6', active: true },
  { id: '2', name: 'Creatinine', section: 'Chemistry', loinc: '2160-0', active: true },
  { id: '3', name: 'BUN', section: 'Chemistry', loinc: '3094-0', active: true },
  { id: '4', name: 'ALT (SGPT)', section: 'Chemistry', loinc: '1742-6', active: true },
  { id: '5', name: 'AST (SGOT)', section: 'Chemistry', loinc: '1920-8', active: true },
  { id: '6', name: 'Bilirubin, Total', section: 'Chemistry', loinc: '1975-2', active: true },
  { id: '7', name: 'Albumin', section: 'Chemistry', loinc: '1751-7', active: true },
  { id: '8', name: 'Total Protein', section: 'Chemistry', loinc: '2885-2', active: true },
];

// All available tests (for adding)
const allAvailableTests = [
  ...initialAssignedTests,
  { id: '9', name: 'Hemoglobin A1c', section: 'Chemistry', loinc: '4548-4', active: true },
  { id: '10', name: 'Lipid Panel', section: 'Chemistry', loinc: '24331-1', active: true },
  { id: '11', name: 'Thyroid Panel', section: 'Chemistry', loinc: '34530-6', active: true },
  { id: '12', name: 'Electrolytes', section: 'Chemistry', loinc: '24326-1', active: true },
  { id: '13', name: 'CBC with Differential', section: 'Hematology', loinc: '57021-8', active: true },
  { id: '14', name: 'PT/INR', section: 'Coagulation', loinc: '34714-6', active: true },
  { id: '15', name: 'aPTT', section: 'Coagulation', loinc: '14979-9', active: true },
  { id: '16', name: 'Vitamin D, 25-Hydroxy', section: 'Chemistry', loinc: '1989-3', active: true },
  { id: '17', name: 'Iron Studies', section: 'Chemistry', loinc: '34530-6', active: true },
  { id: '18', name: 'Magnesium', section: 'Chemistry', loinc: '2601-3', active: true },
];

const initialWhonetCodes = [
  { code: 'bl', name: 'Blood' },
  { code: 'ur', name: 'Urine' },
  { code: 'sp', name: 'Sputum' },
  { code: 'cs', name: 'Cerebrospinal fluid' },
  { code: 'st', name: 'Stool/feces' },
  { code: 'wo', name: 'Wound' },
  { code: 'sf', name: 'Synovial fluid' },
  { code: 'ba', name: 'Bronchoalveolar lavage' },
  { code: 'pl', name: 'Pleural fluid' },
];

const disposalMethods = [
  { id: '1', name: 'Biohazard Bin' },
  { id: '2', name: 'Incineration' },
  { id: '3', name: 'Chemical Deactivation' },
  { id: '4', name: 'Autoclave Sterilization' },
  { id: '5', name: 'Standard Medical Waste' },
];

const storageOptions = ['2–8°C (Refrigerated)', '-20°C (Frozen)', '-70°C (Ultra-frozen)', 'Room Temperature (15–25°C)'];

const ListView = ({ onEdit, onAdd }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState([]);

  const filtered = mockSampleTypes.filter(st => {
    const matchSearch = st.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && st.active) || (filter === 'inactive' && !st.active);
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Sample Type Management</h1>
            <p className="text-sm text-gray-500">Configure sample types, storage defaults, and test associations</p>
          </div>
          <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2">
            <span className="text-lg">+</span> Add Sample Type
          </button>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-3 flex gap-4">
        <input
          type="text"
          placeholder="Search sample types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs px-3 py-2 border rounded"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border rounded">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {selected.length > 0 && (
        <div className="bg-blue-50 border-b px-6 py-2 flex items-center gap-4">
          <span className="text-sm font-medium text-blue-800">{selected.length} selected</span>
          <button className="text-sm text-blue-700 font-medium">Activate</button>
          <button className="text-sm text-blue-700 font-medium">Deactivate</button>
          <button className="text-sm text-gray-500 ml-auto" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      <div className="p-6">
        <div className="bg-white rounded border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" className="rounded" onChange={(e) => setSelected(e.target.checked ? filtered.map(f => f.id) : [])} checked={selected.length === filtered.length && filtered.length > 0} />
                </th>
                <th className="px-3 py-3 text-left font-semibold">Sample Type</th>
                <th className="px-3 py-3 text-left font-semibold">Order</th>
                <th className="px-3 py-3 text-left font-semibold">WHONET</th>
                <th className="px-3 py-3 text-left font-semibold">Tests</th>
                <th className="px-3 py-3 text-left font-semibold">Storage Default</th>
                <th className="px-3 py-3 text-left font-semibold">Status</th>
                <th className="w-16 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(st => (
                <tr key={st.id} className={`hover:bg-gray-50 ${selected.includes(st.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" className="rounded" checked={selected.includes(st.id)} onChange={() => setSelected(prev => prev.includes(st.id) ? prev.filter(x => x !== st.id) : [...prev, st.id])} />
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => onEdit(st)} className="text-blue-600 hover:text-blue-800 font-medium">
                      {st.name}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-gray-100 text-xs font-medium">{st.displayOrder}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-mono">{st.whonetCode}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{st.testCount} tests</span>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    {st.storageTemp} • {st.storageDuration}{st.storageDurationUnit[0]}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {st.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => onEdit(st)} className="p-1 text-gray-400 hover:text-blue-600">✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 mt-4">Showing {filtered.length} of {mockSampleTypes.length} sample types</p>
      </div>
    </div>
  );
};

// Add Test Modal
const AddTestModal = ({ onClose, onAdd, assignedTestIds }) => {
  const [search, setSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);

  const availableTests = allAvailableTests.filter(t => !assignedTestIds.includes(t.id));
  const filteredTests = availableTests.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.section.toLowerCase().includes(search.toLowerCase()) ||
    t.loinc.includes(search)
  );

  const toggleTest = (id) => {
    setSelectedTests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAdd = () => {
    const testsToAdd = allAvailableTests.filter(t => selectedTests.includes(t.id));
    onAdd(testsToAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Add Tests to Sample Type</h2>
            <p className="text-sm text-gray-500">Select tests to associate with this sample type</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded text-gray-500">✕</button>
        </div>
        
        <div className="px-6 py-3 border-b">
          <input
            type="text"
            placeholder="Search by test name, section, or LOINC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            autoFocus
          />
        </div>

        {selectedTests.length > 0 && (
          <div className="px-6 py-2 bg-blue-50 border-b flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800">{selectedTests.length} test(s) selected</span>
            <button onClick={() => setSelectedTests([])} className="text-sm text-blue-600 hover:text-blue-800 ml-auto">Clear selection</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {filteredTests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {availableTests.length === 0 
                ? "All available tests are already assigned to this sample type."
                : "No tests found matching your search."}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTests.map(test => (
                <label 
                  key={test.id} 
                  className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                    selectedTests.includes(test.id) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(test.id)}
                    onChange={() => toggleTest(test.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{test.name}</p>
                    <p className="text-xs text-gray-500">{test.section} • LOINC: {test.loinc}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${test.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {test.active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded font-medium hover:bg-gray-50">Cancel</button>
          <button 
            onClick={handleAdd} 
            disabled={selectedTests.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add {selectedTests.length > 0 ? `${selectedTests.length} Test(s)` : 'Tests'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Remove Test Confirmation Modal
const RemoveTestModal = ({ test, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            ⚠️
          </div>
          <div>
            <h2 className="text-lg font-semibold">Remove Test from Sample Type?</h2>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to remove <strong>{test.name}</strong> from this sample type? 
              The test will no longer be associated with this sample type for ordering.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700">
            Remove Test
          </button>
        </div>
      </div>
    </div>
  );
};

// Add WHONET Code Modal
const AddWhonetCodeModal = ({ onClose, onAdd, existingCodes }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!code.trim()) {
      setError('Code is required');
      return;
    }
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (code.length > 4) {
      setError('Code must be 4 characters or less');
      return;
    }
    if (existingCodes.some(c => c.code.toLowerCase() === code.toLowerCase())) {
      setError('This code already exists');
      return;
    }
    onAdd({ code: code.toLowerCase(), name });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Add New WHONET Code</h2>
            <p className="text-sm text-gray-500">Create a custom WHONET specimen code</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded text-gray-500">✕</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="font-medium text-yellow-800">⚠️ Custom Code</p>
            <p className="text-yellow-700 text-xs mt-1">
              Custom codes may not be recognized by WHONET software. Use standard WHONET codes when possible.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              placeholder="e.g., ab"
              maxLength={4}
              className="w-full px-3 py-2 border rounded font-mono uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">2-4 character code (lowercase)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Specimen Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g., Amniotic fluid"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">
            Add Code
          </button>
        </div>
      </div>
    </div>
  );
};

const EditorView = ({ sampleType, onBack }) => {
  const [tab, setTab] = useState('basic');
  const [form, setForm] = useState({
    name: sampleType?.name || '',
    description: '',
    active: sampleType?.active ?? true,
    displayOrder: sampleType?.displayOrder || 1,
    whonetCode: sampleType?.whonetCode || '',
    storageConditions: sampleType?.storageTemp || '',
    storageDuration: sampleType?.storageDuration || '',
    storageDurationUnit: sampleType?.storageDurationUnit || 'hours',
    disposalMethod: '1',
    specialInstructions: '',
  });

  // Test management state
  const [assignedTests, setAssignedTests] = useState(initialAssignedTests);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [testToRemove, setTestToRemove] = useState(null);

  // WHONET code management state
  const [whonetCodes, setWhonetCodes] = useState(initialWhonetCodes);
  const [showAddWhonetModal, setShowAddWhonetModal] = useState(false);

  const handleAddTests = (tests) => {
    setAssignedTests(prev => [...prev, ...tests]);
  };

  const handleRemoveTest = () => {
    setAssignedTests(prev => prev.filter(t => t.id !== testToRemove.id));
    setTestToRemove(null);
  };

  const handleAddWhonetCode = (newCode) => {
    setWhonetCodes(prev => [...prev, newCode]);
    setForm(prev => ({ ...prev, whonetCode: newCode.code }));
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📄' },
    { id: 'order', label: 'Display Order', icon: '↕️' },
    { id: 'tests', label: 'Associated Tests', icon: '🔬' },
    { id: 'storage', label: 'Storage & Disposal', icon: '🌡️' },
    { id: 'whonet', label: 'WHONET Mapping', icon: '🔗' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modals */}
      {showAddTestModal && (
        <AddTestModal 
          onClose={() => setShowAddTestModal(false)}
          onAdd={handleAddTests}
          assignedTestIds={assignedTests.map(t => t.id)}
        />
      )}
      {testToRemove && (
        <RemoveTestModal
          test={testToRemove}
          onClose={() => setTestToRemove(null)}
          onConfirm={handleRemoveTest}
        />
      )}
      {showAddWhonetModal && (
        <AddWhonetCodeModal
          onClose={() => setShowAddWhonetModal(false)}
          onAdd={handleAddWhonetCode}
          existingCodes={whonetCodes}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded">← Back</button>
            <div>
              <h1 className="text-xl font-semibold">{sampleType ? `Edit: ${sampleType.name}` : 'Add New Sample Type'}</h1>
              <p className="text-sm text-gray-500">Configure sample type properties</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onBack} className="px-4 py-2 border rounded font-medium">Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded font-medium">Save</button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 bg-white border-r p-2 shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-3 py-2 rounded mb-1 text-sm font-medium flex items-center gap-2 ${tab === t.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'basic' && (
            <div className="max-w-lg bg-white rounded border p-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sample Type Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="e.g., Serum" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded" rows={3} placeholder="Optional..." />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Active Status</p>
                    <p className="text-xs text-gray-500">Inactive won't appear in order entry</p>
                  </div>
                  <button onClick={() => setForm({...form, active: !form.active})} className={`w-11 h-6 rounded-full relative ${form.active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.active ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'order' && (
            <div className="max-w-lg bg-white rounded border p-6">
              <h3 className="text-lg font-semibold mb-4">Display Order</h3>
              <p className="text-sm text-gray-500 mb-4">Drag to reorder how sample types appear in dropdowns</p>
              <div className="space-y-1">
                {mockSampleTypes.filter(s => s.active).sort((a,b) => a.displayOrder - b.displayOrder).map(st => (
                  <div key={st.id} className={`flex items-center gap-3 p-3 border rounded ${st.displayOrder === form.displayOrder ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <span className="text-gray-400 cursor-grab">⋮⋮</span>
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-xs font-medium">{st.displayOrder}</span>
                    <span className="flex-1 font-medium">{st.name}</span>
                    {st.displayOrder === form.displayOrder && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Current</span>}
                    <button className="text-gray-400 hover:text-gray-600">↑</button>
                    <button className="text-gray-400 hover:text-gray-600">↓</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'tests' && (
            <div className="max-w-2xl bg-white rounded border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Associated Tests</h3>
                  <p className="text-sm text-gray-500">Tests that use this sample type for ordering</p>
                </div>
                <button 
                  onClick={() => setShowAddTestModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1"
                >
                  + Add Tests
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="text-blue-800">
                  <strong>Note:</strong> Adding or removing tests here will update the test's sample type assignment. 
                  Changes are applied when you save.
                </p>
              </div>

              {assignedTests.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded">
                  <p className="text-gray-500 mb-2">No tests assigned to this sample type</p>
                  <button 
                    onClick={() => setShowAddTestModal(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    + Add your first test
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedTests.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 group">
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.section} • LOINC: {t.loinc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {t.active ? 'Active' : 'Inactive'}
                        </span>
                        <button 
                          onClick={() => setTestToRemove(t)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove test"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-4">
                {assignedTests.length} test(s) associated with this sample type
              </p>
            </div>
          )}

          {tab === 'storage' && (
            <div className="max-w-2xl space-y-4">
              <div className="bg-white rounded border p-6">
                <h3 className="text-lg font-semibold mb-4">Storage Conditions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Storage Conditions</label>
                    <select value={form.storageConditions} onChange={e => setForm({...form, storageConditions: e.target.value})} className="w-full px-3 py-2 border rounded">
                      <option value="">Select...</option>
                      {storageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Storage Duration</label>
                      <input type="number" value={form.storageDuration} onChange={e => setForm({...form, storageDuration: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Unit</label>
                      <select value={form.storageDurationUnit} onChange={e => setForm({...form, storageDurationUnit: e.target.value})} className="w-full px-3 py-2 border rounded">
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded border p-6">
                <h3 className="text-lg font-semibold mb-4">Disposal Requirements</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Disposal Method</label>
                    <select value={form.disposalMethod} onChange={e => setForm({...form, disposalMethod: e.target.value})} className="w-full px-3 py-2 border rounded">
                      {disposalMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Special Instructions</label>
                    <textarea value={form.specialInstructions} onChange={e => setForm({...form, specialInstructions: e.target.value})} className="w-full px-3 py-2 border rounded" rows={3} placeholder="e.g., Protect from light..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'whonet' && (
            <div className="max-w-2xl bg-white rounded border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">WHONET Specimen Code Mapping</h3>
                  <p className="text-sm text-gray-500">Map to WHONET code for AMR surveillance exports</p>
                </div>
                <button 
                  onClick={() => setShowAddWhonetModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  + Add New Code
                </button>
              </div>
              
              {form.whonetCode ? (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="font-medium text-green-800">✓ Currently mapped to "{form.whonetCode}" ({whonetCodes.find(c => c.code === form.whonetCode)?.name})</p>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="font-medium text-yellow-800">⚠ Not mapped - will be excluded from WHONET exports</p>
                </div>
              )}

              <input type="text" placeholder="Search WHONET codes..." className="w-full px-3 py-2 border rounded mb-4" />
              
              <div className="border rounded divide-y max-h-80 overflow-y-auto">
                <label className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="whonet" checked={!form.whonetCode} onChange={() => setForm({...form, whonetCode: ''})} />
                  <span className="text-gray-400">—</span>
                  <span className="italic text-gray-500">No mapping (exclude from export)</span>
                </label>
                {whonetCodes.map(c => (
                  <label key={c.code} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="whonet" checked={form.whonetCode === c.code} onChange={() => setForm({...form, whonetCode: c.code})} />
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-mono">{c.code}</span>
                    <span>{c.name}</span>
                    {!initialWhonetCodes.find(ic => ic.code === c.code) && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded ml-auto">Custom</span>
                    )}
                  </label>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                WHONET codes are standardized specimen type identifiers for AMR surveillance reporting to GLASS.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);

  return view === 'list' 
    ? <ListView onEdit={(st) => { setSelected(st); setView('editor'); }} onAdd={() => { setSelected(null); setView('editor'); }} />
    : <EditorView sampleType={selected} onBack={() => { setView('list'); setSelected(null); }} />;
}
