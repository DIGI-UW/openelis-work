import React, { useState } from 'react';
import { 
  Search, Plus, Filter, Download, Upload, Edit, Trash2, ChevronDown, ChevronRight, 
  Info, X, Check, AlertTriangle, ChevronLeft, FileText, Beaker, Star,
  GripVertical, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Layers, 
  MoreVertical, Building2, Link, Settings, File, Calendar, User,
  FileJson, FileSpreadsheet, ArrowUpDown
} from 'lucide-react';

// ============================================
// PANELS LIST VIEW
// ============================================

const PanelsList = ({ onSelectPanel, onEditPanel }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [labUnitFilter, setLabUnitFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Generate 500+ sample panels for demo
  const generatePanels = () => {
    const basePanels = [
      { name: 'Complete Blood Count', code: 'CBC', loincCode: '58410-2', labUnits: ['Hematology'], sampleTypes: ['Whole Blood EDTA'], testCount: 8 },
      { name: 'Basic Metabolic Panel', code: 'BMP', loincCode: '51990-0', labUnits: ['Chemistry'], sampleTypes: ['Serum', 'Plasma'], testCount: 8 },
      { name: 'Comprehensive Metabolic Panel', code: 'CMP', loincCode: '24323-8', labUnits: ['Chemistry'], sampleTypes: ['Serum', 'Plasma'], testCount: 14 },
      { name: 'Lipid Panel', code: 'LIPID', loincCode: '24331-1', labUnits: ['Chemistry'], sampleTypes: ['Serum'], testCount: 4 },
      { name: 'Liver Function Panel', code: 'LFT', loincCode: '24325-3', labUnits: ['Chemistry'], sampleTypes: ['Serum'], testCount: 7 },
      { name: 'Thyroid Panel', code: 'THYROID', loincCode: '24348-5', labUnits: ['Chemistry', 'Immunology'], sampleTypes: ['Serum'], testCount: 3 },
      { name: 'Coagulation Panel', code: 'COAG', loincCode: '34714-6', labUnits: ['Hematology'], sampleTypes: ['Plasma Citrate'], testCount: 3 },
      { name: 'Urinalysis Panel', code: 'UA', loincCode: '24356-8', labUnits: ['Urinalysis'], sampleTypes: ['Urine'], testCount: 10 },
      { name: 'Renal Function Panel', code: 'RFP', loincCode: '24362-6', labUnits: ['Chemistry'], sampleTypes: ['Serum'], testCount: 6 },
      { name: 'Hepatic Function Panel', code: 'HFP', loincCode: '24325-3', labUnits: ['Chemistry'], sampleTypes: ['Serum'], testCount: 8 },
      { name: 'Electrolyte Panel', code: 'ELEC', loincCode: '24326-1', labUnits: ['Chemistry'], sampleTypes: ['Serum', 'Plasma'], testCount: 4 },
      { name: 'Cardiac Biomarkers Panel', code: 'CARDIAC', loincCode: '29463-7', labUnits: ['Chemistry'], sampleTypes: ['Serum'], testCount: 5 },
      { name: 'Anemia Panel', code: 'ANEMIA', loincCode: '57021-8', labUnits: ['Hematology'], sampleTypes: ['Whole Blood EDTA'], testCount: 12 },
      { name: 'Iron Studies Panel', code: 'IRON', loincCode: '34530-6', labUnits: ['Chemistry'], sampleTypes: ['Serum'], testCount: 4 },
      { name: 'Diabetes Panel', code: 'DM', loincCode: '55399-0', labUnits: ['Chemistry'], sampleTypes: ['Serum', 'Plasma'], testCount: 5 },
    ];
    
    const allPanels = [];
    let id = 1;
    
    // Add base panels
    basePanels.forEach(panel => {
      allPanels.push({
        ...panel,
        id: id++,
        isActive: true,
        description: `Standard ${panel.name.toLowerCase()} for routine testing.`
      });
    });
    
    // Generate variations to reach 500+
    const prefixes = ['Pediatric', 'Geriatric', 'Emergency', 'Prenatal', 'Neonatal', 'Oncology', 'ICU', 'Outpatient', 'Inpatient', 'Screening'];
    const suffixes = ['Extended', 'Basic', 'Comprehensive', 'Rapid', 'Stat', 'Routine', 'Follow-up', 'Initial', 'Monitoring'];
    
    prefixes.forEach(prefix => {
      basePanels.forEach(panel => {
        allPanels.push({
          ...panel,
          id: id++,
          name: `${prefix} ${panel.name}`,
          code: `${prefix.substring(0, 3).toUpperCase()}-${panel.code}`,
          loincCode: `${panel.loincCode}-${id}`,
          isActive: Math.random() > 0.1,
          description: `${prefix} version of ${panel.name.toLowerCase()}.`
        });
      });
    });
    
    suffixes.forEach(suffix => {
      basePanels.forEach(panel => {
        allPanels.push({
          ...panel,
          id: id++,
          name: `${panel.name} - ${suffix}`,
          code: `${panel.code}-${suffix.substring(0, 3).toUpperCase()}`,
          loincCode: `${panel.loincCode}-${id}`,
          isActive: Math.random() > 0.1,
          description: `${suffix} version of ${panel.name.toLowerCase()}.`
        });
      });
    });
    
    // Add more combinations to exceed 500
    const departments = ['Lab A', 'Lab B', 'Reference Lab', 'Satellite'];
    departments.forEach(dept => {
      basePanels.slice(0, 8).forEach(panel => {
        allPanels.push({
          ...panel,
          id: id++,
          name: `${panel.name} (${dept})`,
          code: `${panel.code}-${dept.replace(/\s/g, '').substring(0, 3).toUpperCase()}`,
          loincCode: `${panel.loincCode}-${id}`,
          isActive: Math.random() > 0.15,
          description: `${panel.name} configured for ${dept}.`
        });
      });
    });
    
    return allPanels;
  };

  const panels = generatePanels();
  const labUnits = ['All Lab Units', 'Chemistry', 'Hematology', 'Immunology', 'Microbiology', 'Urinalysis'];

  // Filter panels
  const filteredPanels = panels.filter(panel => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && panel.isActive) || 
      (statusFilter === 'inactive' && !panel.isActive);
    const matchesLabUnit = labUnitFilter === 'all' || panel.labUnits.includes(labUnitFilter);
    const matchesSearch = panel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      panel.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (panel.loincCode && panel.loincCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesLabUnit && matchesSearch;
  });

  // Sort panels
  const sortedPanels = [...filteredPanels].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'testCount') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    } else {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedPanels.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPanels = sortedPanels.slice(startIndex, startIndex + pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortOrder === 'asc' 
      ? <ChevronDown size={14} className="text-teal-600" />
      : <ChevronRight size={14} className="text-teal-600 rotate-[-90deg]" />;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Panel Setup</h1>
            <p className="text-sm text-gray-500">Manage test panels and their configurations</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowImportExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
            >
              <ArrowUpDown size={18} />
              Import/Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
              <Plus size={18} />
              Add Panel
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, code, or LOINC..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <select 
            value={labUnitFilter}
            onChange={(e) => { setLabUnitFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            {labUnits.map(lu => (
              <option key={lu} value={lu === 'All Lab Units' ? 'all' : lu}>{lu}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="text-sm text-gray-500">
            {filteredPanels.length} panels
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Panel Name
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center gap-2">
                    Code
                    <SortIcon field="code" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
                  onClick={() => handleSort('loincCode')}
                >
                  <div className="flex items-center gap-2">
                    LOINC
                    <SortIcon field="loincCode" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Lab Units
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sample Types
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                  onClick={() => handleSort('testCount')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Tests
                    <SortIcon field="testCount" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPanels.map((panel) => (
                <tr 
                  key={panel.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEditPanel && onEditPanel(panel)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{panel.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-600">{panel.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-500">{panel.loincCode || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {panel.labUnits.slice(0, 2).map(lu => (
                        <span key={lu} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {lu}
                        </span>
                      ))}
                      {panel.labUnits.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{panel.labUnits.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {panel.sampleTypes.slice(0, 2).map(st => (
                        <span key={st} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {st}
                        </span>
                      ))}
                      {panel.sampleTypes.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{panel.sampleTypes.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600">{panel.testCount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {panel.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => onEditPanel && onEditPanel(panel)}
                        className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="More actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredPanels.length)} of {filteredPanels.length} panels
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <select 
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm ${
                      currentPage === pageNum 
                        ? 'bg-teal-600 text-white' 
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* Import/Export Modal */}
      {showImportExportModal && (
        <ImportExportModal 
          panels={panels}
          onClose={() => setShowImportExportModal(false)}
        />
      )}
    </div>
  );
};

// ============================================
// IMPORT/EXPORT MODAL
// ============================================

const ImportExportModal = ({ panels, onClose }) => {
  const [activeTab, setActiveTab] = useState('export');
  const [selectedPanels, setSelectedPanels] = useState([]);
  const [exportFormat, setExportFormat] = useState('json');
  const [includeTests, setIncludeTests] = useState(true);
  const [importMode, setImportMode] = useState('both');
  const [importFile, setImportFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPanels = panels.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePanel = (panelId) => {
    if (selectedPanels.includes(panelId)) {
      setSelectedPanels(selectedPanels.filter(id => id !== panelId));
    } else {
      setSelectedPanels([...selectedPanels, panelId]);
    }
  };

  const selectAll = () => setSelectedPanels(filteredPanels.map(p => p.id));
  const deselectAll = () => setSelectedPanels([]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Import/Export Panels</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('export')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'export' 
                  ? 'border-teal-500 text-teal-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Download size={16} className="inline mr-2" />
              Export
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'import' 
                  ? 'border-teal-500 text-teal-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Import
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              {/* Panel Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Select Panels to Export</label>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-xs text-teal-600 hover:text-teal-800">Select all</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={deselectAll} className="text-xs text-gray-500 hover:text-gray-700">Deselect all</button>
                  </div>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search panels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  />
                </div>
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {filteredPanels.map(panel => (
                    <label 
                      key={panel.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input 
                        type="checkbox"
                        checked={selectedPanels.includes(panel.id)}
                        onChange={() => togglePanel(panel.id)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{panel.name}</p>
                        <p className="text-xs text-gray-500">{panel.code} • {panel.testCount} tests</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedPanels.length} panels selected</p>
              </div>

              {/* Export Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="flex gap-3">
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer flex-1 ${
                    exportFormat === 'json' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="format" 
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex items-center gap-2">
                      <FileJson size={20} className="text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">JSON</p>
                        <p className="text-xs text-gray-500">For import</p>
                      </div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer flex-1 ${
                    exportFormat === 'csv' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="format" 
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={20} className="text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">CSV</p>
                        <p className="text-xs text-gray-500">For review</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Include</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={includeTests}
                    onChange={(e) => setIncludeTests(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Test assignments with order and panel LOINC codes</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors cursor-pointer">
                  {importFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileJson size={24} className="text-orange-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                        <p className="text-xs text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button 
                        onClick={() => setImportFile(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-gray-600 text-sm">Drop JSON file here or click to browse</p>
                      <p className="text-xs text-gray-500 mt-1">Only JSON format supported for import</p>
                    </>
                  )}
                </div>
              </div>

              {/* Import Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Import Mode</label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
                    importMode === 'create' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="create"
                      checked={importMode === 'create'}
                      onChange={() => setImportMode('create')}
                      className="mt-1 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Create new panels only</p>
                      <p className="text-xs text-gray-500">Skip panels with existing codes</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
                    importMode === 'update' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="update"
                      checked={importMode === 'update'}
                      onChange={() => setImportMode('update')}
                      className="mt-1 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Update existing panels only</p>
                      <p className="text-xs text-gray-500">Skip panels with new codes</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
                    importMode === 'both' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="both"
                      checked={importMode === 'both'}
                      onChange={() => setImportMode('both')}
                      className="mt-1 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Create and update</p>
                      <p className="text-xs text-gray-500">Process all panels in file</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Validation Preview (would show after file selected) */}
              {importFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Validation Preview</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Plus size={14} className="text-green-500" />
                      <span className="text-gray-700">3 panels to create</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Edit size={14} className="text-blue-500" />
                      <span className="text-gray-700">2 panels to update</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="text-gray-700">1 warning: Unknown test code "XYZ123"</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {activeTab === 'export' ? (
            <button 
              disabled={selectedPanels.length === 0}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download size={16} />
              Export {selectedPanels.length} Panel{selectedPanels.length !== 1 ? 's' : ''}
            </button>
          ) : (
            <button 
              disabled={!importFile}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Upload size={16} />
              Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PANEL EDITOR
// ============================================

const PanelEditor = ({ panel, initialTab = 'basic', onBack }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'tests', label: 'Tests', icon: Beaker },
  ];

  return (
    <div className="bg-gray-50 h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {panel ? `Edit: ${panel.name}` : 'Add New Panel'}
              </h1>
              <p className="text-sm text-gray-500">Configure panel settings and test assignments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
              Save Panel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Vertical Tabs */}
      <div className="flex flex-1 overflow-hidden">
        {/* Vertical Tab Sidebar */}
        <div className="w-52 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <nav className="p-2">
            <div className="mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuration</p>
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors mb-0.5 ${
                    activeTab === tab.id 
                      ? 'bg-teal-50 text-teal-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={activeTab === tab.id ? 'text-teal-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl">
            {activeTab === 'basic' && <BasicInfoTab panel={panel} />}
            {activeTab === 'tests' && <TestsTab panel={panel} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// BASIC INFO TAB
// ============================================

const BasicInfoTab = ({ panel }) => {
  const labUnits = ['Chemistry', 'Hematology', 'Immunology', 'Microbiology', 'Urinalysis'];
  const sampleTypes = ['Serum', 'Plasma', 'Whole Blood EDTA', 'Plasma Citrate', 'Urine', 'CSF'];
  const [selectedLabUnits, setSelectedLabUnits] = useState(panel?.labUnits || []);
  const [selectedSampleTypes, setSelectedSampleTypes] = useState(panel?.sampleTypes || []);

  const toggleLabUnit = (lu) => {
    if (selectedLabUnits.includes(lu)) {
      setSelectedLabUnits(selectedLabUnits.filter(l => l !== lu));
    } else {
      setSelectedLabUnits([...selectedLabUnits, lu]);
    }
  };

  const toggleSampleType = (st) => {
    if (selectedSampleTypes.includes(st)) {
      setSelectedSampleTypes(selectedSampleTypes.filter(s => s !== st));
    } else {
      setSelectedSampleTypes([...selectedSampleTypes, st]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Panel Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              defaultValue={panel?.name || ''}
              placeholder="e.g., Complete Blood Count"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              defaultValue={panel?.code || ''}
              placeholder="e.g., CBC"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LOINC Code
            </label>
            <input 
              type="text"
              defaultValue={panel?.loincCode || ''}
              placeholder="e.g., 58410-2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center gap-3 h-10">
              <button className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-teal-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
              <span className="text-sm text-gray-700">Active</span>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              rows={3}
              defaultValue={panel?.description || ''}
              placeholder="Detailed description of the panel..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Lab Units */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Lab Units</h2>
        <p className="text-sm text-gray-500 mb-4">Select which lab units can order this panel (at least one required)</p>
        
        <div className="grid grid-cols-3 gap-3">
          {labUnits.map(lu => (
            <label 
              key={lu}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedLabUnits.includes(lu) 
                  ? 'border-teal-500 bg-teal-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input 
                type="checkbox"
                checked={selectedLabUnits.includes(lu)}
                onChange={() => toggleLabUnit(lu)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">{lu}</span>
            </label>
          ))}
        </div>
        {selectedLabUnits.length === 0 && (
          <p className="text-sm text-red-500 mt-2">At least one lab unit is required</p>
        )}
      </div>

      {/* Sample Types */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Sample Types</h2>
        <p className="text-sm text-gray-500 mb-4">Select valid sample types for this panel (optional)</p>
        
        <div className="grid grid-cols-3 gap-3">
          {sampleTypes.map(st => (
            <label 
              key={st}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedSampleTypes.includes(st) 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input 
                type="checkbox"
                checked={selectedSampleTypes.includes(st)}
                onChange={() => toggleSampleType(st)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">{st}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TESTS TAB
// ============================================

const TestsTab = ({ panel }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [tests, setTests] = useState(panel?.tests || [
    { id: 1, name: 'White Blood Cell Count', code: 'WBC', testLoinc: '6690-2', panelLoinc: '6690-2', order: 1 },
    { id: 2, name: 'Red Blood Cell Count', code: 'RBC', testLoinc: '789-8', panelLoinc: '789-8', order: 2 },
    { id: 3, name: 'Hemoglobin', code: 'HGB', testLoinc: '718-7', panelLoinc: '718-7', order: 3 },
    { id: 4, name: 'Hematocrit', code: 'HCT', testLoinc: '4544-3', panelLoinc: '4544-3', order: 4 },
    { id: 5, name: 'Platelet Count', code: 'PLT', testLoinc: '777-3', panelLoinc: '777-3', order: 5 },
    { id: 6, name: 'MCV', code: 'MCV', testLoinc: '787-2', panelLoinc: '787-2', order: 6 },
    { id: 7, name: 'MCH', code: 'MCH', testLoinc: '785-6', panelLoinc: '785-6', order: 7 },
    { id: 8, name: 'MCHC', code: 'MCHC', testLoinc: '786-4', panelLoinc: '786-4', order: 8 },
  ]);
  const [draggedTest, setDraggedTest] = useState(null);

  const handleDragStart = (test) => {
    setDraggedTest(test);
  };

  const handleDragOver = (e, test) => {
    e.preventDefault();
    if (!draggedTest || draggedTest.id === test.id) return;
    
    const newTests = [...tests];
    const draggedIndex = newTests.findIndex(t => t.id === draggedTest.id);
    const targetIndex = newTests.findIndex(t => t.id === test.id);
    
    newTests.splice(draggedIndex, 1);
    newTests.splice(targetIndex, 0, draggedTest);
    
    // Renumber
    newTests.forEach((t, i) => t.order = i + 1);
    
    setTests(newTests);
  };

  const handleDragEnd = () => {
    setDraggedTest(null);
  };

  const handleOrderChange = (testId, newOrder) => {
    const numOrder = parseInt(newOrder);
    if (isNaN(numOrder) || numOrder < 1) return;
    
    const newTests = [...tests];
    const testIndex = newTests.findIndex(t => t.id === testId);
    const test = newTests[testIndex];
    
    // Remove and reinsert at new position
    newTests.splice(testIndex, 1);
    const insertIndex = Math.min(numOrder - 1, newTests.length);
    newTests.splice(insertIndex, 0, test);
    
    // Renumber all
    newTests.forEach((t, i) => t.order = i + 1);
    
    setTests(newTests);
  };

  const handlePanelLoincChange = (testId, newLoinc) => {
    setTests(tests.map(t => t.id === testId ? { ...t, panelLoinc: newLoinc } : t));
  };

  const removeTest = (testId) => {
    const newTests = tests.filter(t => t.id !== testId);
    newTests.forEach((t, i) => t.order = i + 1);
    setTests(newTests);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Panel Tests</h2>
            <p className="text-sm text-gray-500">{tests.length} tests in this panel</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
          >
            <Plus size={18} />
            Add Tests
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Drag rows to reorder, or edit the order number directly. Panel LOINC can differ from the test's LOINC code.
          </p>
        </div>

        {/* Test Table */}
        {tests.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-2 py-3"></th>
                  <th className="w-16 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test Name</th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test LOINC</th>
                  <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Panel LOINC</th>
                  <th className="w-16 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr 
                    key={test.id}
                    draggable
                    onDragStart={() => handleDragStart(test)}
                    onDragOver={(e) => handleDragOver(e, test)}
                    onDragEnd={handleDragEnd}
                    className={`border-t border-gray-100 hover:bg-gray-50 ${
                      draggedTest?.id === test.id ? 'opacity-50 bg-teal-50' : ''
                    }`}
                  >
                    <td className="px-2 py-3">
                      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <GripVertical size={16} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="1"
                        value={test.order}
                        onChange={(e) => handleOrderChange(test.id, e.target.value)}
                        className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-medium text-gray-900">{test.name}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-sm text-gray-600">{test.code}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-sm text-gray-400">{test.testLoinc}</span>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={test.panelLoinc || ''}
                        onChange={(e) => handlePanelLoincChange(test.id, e.target.value)}
                        placeholder="Enter LOINC"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button 
                        onClick={() => removeTest(test.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
            <Beaker size={32} className="mx-auto mb-2 opacity-50" />
            <p>No tests in this panel</p>
            <p className="text-sm">Add tests to define the panel</p>
          </div>
        )}
      </div>

      {/* Add Tests Modal */}
      {showAddModal && (
        <AddTestsModal 
          existingTestIds={tests.map(t => t.id)}
          onClose={() => setShowAddModal(false)}
          onAdd={(newTests) => {
            const startOrder = tests.length + 1;
            const testsToAdd = newTests.map((t, i) => ({
              ...t,
              order: startOrder + i,
              panelLoinc: ''
            }));
            setTests([...tests, ...testsToAdd]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

// ============================================
// ADD TESTS MODAL
// ============================================

const AddTestsModal = ({ existingTestIds, onClose, onAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [labUnitFilter, setLabUnitFilter] = useState('all');

  const availableTests = [
    { id: 10, name: 'RDW', code: 'RDW', testLoinc: '788-0', labUnit: 'Hematology', sampleType: 'Whole Blood EDTA' },
    { id: 11, name: 'MPV', code: 'MPV', testLoinc: '32623-1', labUnit: 'Hematology', sampleType: 'Whole Blood EDTA' },
    { id: 12, name: 'Neutrophils %', code: 'NEUT%', testLoinc: '770-8', labUnit: 'Hematology', sampleType: 'Whole Blood EDTA' },
    { id: 13, name: 'Lymphocytes %', code: 'LYMPH%', testLoinc: '736-9', labUnit: 'Hematology', sampleType: 'Whole Blood EDTA' },
    { id: 14, name: 'Monocytes %', code: 'MONO%', testLoinc: '5905-5', labUnit: 'Hematology', sampleType: 'Whole Blood EDTA' },
    { id: 15, name: 'Eosinophils %', code: 'EOS%', testLoinc: '713-8', labUnit: 'Hematology', sampleType: 'Whole Blood EDTA' },
    { id: 16, name: 'Basophils %', code: 'BASO%', testLoinc: '706-2', labUnit: 'Hematology', sampleType: 'Whole Blood EDTA' },
    { id: 17, name: 'Reticulocyte Count', code: 'RETIC', testLoinc: '17849-1', labUnit: 'Hematology', sampleType: 'Whole Blood EDTA' },
  ].filter(t => !existingTestIds.includes(t.id));

  const filteredTests = availableTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLabUnit = labUnitFilter === 'all' || test.labUnit === labUnitFilter;
    return matchesSearch && matchesLabUnit;
  });

  const toggleTest = (test) => {
    if (selectedTests.find(t => t.id === test.id)) {
      setSelectedTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Tests to Panel</h3>
          <p className="text-sm text-gray-500">Select tests to add to this panel</p>
        </div>
        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>
            <select 
              value={labUnitFilter}
              onChange={(e) => setLabUnitFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            >
              <option value="all">All Lab Units</option>
              <option value="Hematology">Hematology</option>
              <option value="Chemistry">Chemistry</option>
            </select>
          </div>

          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {filteredTests.length > 0 ? (
              filteredTests.map(test => (
                <label 
                  key={test.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input 
                    type="checkbox"
                    checked={!!selectedTests.find(t => t.id === test.id)}
                    onChange={() => toggleTest(test)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{test.name}</p>
                    <p className="text-xs text-gray-500">{test.code} • LOINC: {test.testLoinc}</p>
                  </div>
                </label>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No available tests found</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-500">{selectedTests.length} tests selected</span>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={() => onAdd(selectedTests)}
              disabled={selectedTests.length === 0}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add {selectedTests.length} Test{selectedTests.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

export default function PanelsApp() {
  const [view, setView] = useState('list');
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [initialTab, setInitialTab] = useState('basic');

  if (view === 'edit') {
    return (
      <PanelEditor 
        panel={selectedPanel}
        initialTab={initialTab}
        onBack={() => {
          setView('list');
          setSelectedPanel(null);
          setInitialTab('basic');
        }}
      />
    );
  }

  return (
    <PanelsList 
      onSelectPanel={setSelectedPanel}
      onEditPanel={(panel, tab = 'basic') => {
        setSelectedPanel(panel);
        setInitialTab(tab);
        setView('edit');
      }}
    />
  );
}
