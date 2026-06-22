import React, { useState } from 'react';
import { 
  Search, Plus, Filter, Download, Upload, Edit, Trash2, ChevronDown, ChevronRight, 
  Info, X, Check, AlertTriangle, ChevronLeft, FileText, Beaker, Star,
  GripVertical, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Layers, 
  MoreVertical, Building2, Link, Settings, File, Calendar, User,
  FlaskConical, Cpu, Package, ExternalLink, Paperclip, ArrowUpDown
} from 'lucide-react';

// ============================================
// METHODS LIST VIEW
// ============================================

const MethodsList = ({ onSelectMethod, onEditMethod }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [labUnitFilter, setLabUnitFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const methods = [
    { 
      id: 1, 
      name: 'ELISA - HIV 1/2 Antibody', 
      code: 'ELISA-HIV', 
      isActive: true,
      labUnits: ['Immunology', 'Serology'],
      testCount: 12,
      defaultForCount: 8,
      instrumentCount: 3,
      reagentCount: 5,
      documentCount: 2,
      description: 'Enzyme-linked immunosorbent assay for detection of HIV 1/2 antibodies in serum or plasma specimens.'
    },
    { 
      id: 2, 
      name: 'Chemiluminescence Immunoassay', 
      code: 'CLIA', 
      isActive: true,
      labUnits: ['Immunology', 'Chemistry'],
      testCount: 28,
      defaultForCount: 25,
      instrumentCount: 2,
      reagentCount: 12,
      documentCount: 4,
      description: 'Automated chemiluminescent immunoassay platform for high-throughput testing.'
    },
    { 
      id: 3, 
      name: 'PCR - Real Time', 
      code: 'RT-PCR', 
      isActive: true,
      labUnits: ['Molecular Biology'],
      testCount: 18,
      defaultForCount: 18,
      instrumentCount: 4,
      reagentCount: 8,
      documentCount: 6,
      description: 'Real-time polymerase chain reaction for nucleic acid amplification and detection.'
    },
    { 
      id: 4, 
      name: 'Spectrophotometry', 
      code: 'SPEC', 
      isActive: true,
      labUnits: ['Chemistry', 'Hematology'],
      testCount: 45,
      defaultForCount: 40,
      instrumentCount: 6,
      reagentCount: 20,
      documentCount: 3,
      description: 'Quantitative measurement using light absorption at specific wavelengths.'
    },
    { 
      id: 5, 
      name: 'Flow Cytometry', 
      code: 'FACS', 
      isActive: true,
      labUnits: ['Immunology', 'Hematology'],
      testCount: 15,
      defaultForCount: 15,
      instrumentCount: 2,
      reagentCount: 10,
      documentCount: 5,
      description: 'Laser-based cell counting and sorting technology for immunophenotyping.'
    },
    { 
      id: 6, 
      name: 'Microscopy - Manual', 
      code: 'MICRO-MAN', 
      isActive: true,
      labUnits: ['Microbiology', 'Hematology', 'Urinalysis'],
      testCount: 22,
      defaultForCount: 18,
      instrumentCount: 0,
      reagentCount: 6,
      documentCount: 2,
      description: 'Manual microscopic examination by trained technologist.'
    },
    { 
      id: 7, 
      name: 'Rapid Diagnostic Test', 
      code: 'RDT', 
      isActive: false,
      labUnits: ['Immunology'],
      testCount: 5,
      defaultForCount: 2,
      instrumentCount: 0,
      reagentCount: 3,
      documentCount: 1,
      description: 'Point-of-care lateral flow immunoassay for rapid screening.'
    },
    { 
      id: 8, 
      name: 'Ion-Selective Electrode', 
      code: 'ISE', 
      isActive: true,
      labUnits: ['Chemistry'],
      testCount: 8,
      defaultForCount: 8,
      instrumentCount: 3,
      reagentCount: 4,
      documentCount: 2,
      description: 'Electrochemical measurement of ion concentrations.'
    },
    { 
      id: 9, 
      name: 'Turbidimetry', 
      code: 'TURB', 
      isActive: true,
      labUnits: ['Chemistry', 'Immunology'],
      testCount: 12,
      defaultForCount: 10,
      instrumentCount: 2,
      reagentCount: 8,
      documentCount: 2,
      description: 'Measurement of light scattered by suspended particles.'
    },
    { 
      id: 10, 
      name: 'Nephelometry', 
      code: 'NEPH', 
      isActive: true,
      labUnits: ['Immunology'],
      testCount: 10,
      defaultForCount: 10,
      instrumentCount: 1,
      reagentCount: 6,
      documentCount: 3,
      description: 'Detection of light scattered at an angle by immune complexes.'
    },
    { 
      id: 11, 
      name: 'Automated Cell Counter', 
      code: 'AUTO-CC', 
      isActive: true,
      labUnits: ['Hematology'],
      testCount: 15,
      defaultForCount: 15,
      instrumentCount: 4,
      reagentCount: 10,
      documentCount: 4,
      description: 'Automated hematology analyzer for complete blood counts.'
    },
    { 
      id: 12, 
      name: 'Coagulation Analyzer', 
      code: 'COAG-AUTO', 
      isActive: true,
      labUnits: ['Hematology'],
      testCount: 8,
      defaultForCount: 8,
      instrumentCount: 2,
      reagentCount: 12,
      documentCount: 3,
      description: 'Automated coagulation testing platform.'
    },
    { 
      id: 13, 
      name: 'Mass Spectrometry', 
      code: 'MS', 
      isActive: true,
      labUnits: ['Chemistry', 'Toxicology'],
      testCount: 25,
      defaultForCount: 25,
      instrumentCount: 2,
      reagentCount: 15,
      documentCount: 8,
      description: 'High-sensitivity detection and quantification of analytes.'
    },
    { 
      id: 14, 
      name: 'HPLC', 
      code: 'HPLC', 
      isActive: true,
      labUnits: ['Chemistry', 'Toxicology'],
      testCount: 18,
      defaultForCount: 18,
      instrumentCount: 3,
      reagentCount: 20,
      documentCount: 5,
      description: 'High-performance liquid chromatography for compound separation.'
    },
    { 
      id: 15, 
      name: 'Culture - Bacterial', 
      code: 'CULT-BAC', 
      isActive: true,
      labUnits: ['Microbiology'],
      testCount: 30,
      defaultForCount: 28,
      instrumentCount: 1,
      reagentCount: 25,
      documentCount: 6,
      description: 'Traditional bacterial culture and identification.'
    },
    { 
      id: 16, 
      name: 'MALDI-TOF', 
      code: 'MALDI', 
      isActive: true,
      labUnits: ['Microbiology'],
      testCount: 20,
      defaultForCount: 20,
      instrumentCount: 1,
      reagentCount: 5,
      documentCount: 4,
      description: 'Rapid microbial identification by mass spectrometry.'
    },
    { 
      id: 17, 
      name: 'Agglutination', 
      code: 'AGGLUT', 
      isActive: true,
      labUnits: ['Immunology', 'Blood Bank'],
      testCount: 15,
      defaultForCount: 12,
      instrumentCount: 0,
      reagentCount: 10,
      documentCount: 3,
      description: 'Visual detection of antibody-antigen reactions.'
    },
    { 
      id: 18, 
      name: 'Western Blot', 
      code: 'WB', 
      isActive: false,
      labUnits: ['Immunology', 'Molecular Biology'],
      testCount: 5,
      defaultForCount: 5,
      instrumentCount: 1,
      reagentCount: 8,
      documentCount: 4,
      description: 'Confirmatory testing by protein separation and detection.'
    },
  ];

  const labUnits = ['All Lab Units', 'Chemistry', 'Hematology', 'Immunology', 'Microbiology', 'Molecular Biology', 'Serology', 'Toxicology', 'Urinalysis', 'Blood Bank'];

  // Filter methods
  const filteredMethods = methods.filter(method => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && method.isActive) || 
      (statusFilter === 'inactive' && !method.isActive);
    const matchesLabUnit = labUnitFilter === 'all' || method.labUnits.includes(labUnitFilter);
    const matchesSearch = method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      method.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesLabUnit && matchesSearch;
  });

  // Sort methods
  const sortedMethods = [...filteredMethods].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'testCount' || sortField === 'instrumentCount' || sortField === 'documentCount') {
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
  const totalPages = Math.ceil(sortedMethods.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedMethods = sortedMethods.slice(startIndex, startIndex + pageSize);

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
            <h1 className="text-xl font-semibold text-gray-900">Method Setup</h1>
            <p className="text-sm text-gray-500">Manage laboratory methods and their associations</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
            <Plus size={18} />
            Add Method
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or code..."
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
            {filteredMethods.length} methods
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
                    Method Name
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Lab Units
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
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28"
                  onClick={() => handleSort('instrumentCount')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Instruments
                    <SortIcon field="instrumentCount" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                  onClick={() => handleSort('documentCount')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Docs
                    <SortIcon field="documentCount" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedMethods.map((method) => (
                <tr 
                  key={method.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEditMethod && onEditMethod(method)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{method.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-600">{method.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {method.labUnits.slice(0, 2).map(lu => (
                        <span key={lu} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {lu}
                        </span>
                      ))}
                      {method.labUnits.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{method.labUnits.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600">{method.testCount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600">{method.instrumentCount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600">{method.documentCount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {method.isActive ? (
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
                        onClick={() => onEditMethod && onEditMethod(method)}
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
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredMethods.length)} of {filteredMethods.length} methods
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

      {/* Deactivate Modal */}
      {showDeactivateModal && selectedMethod && (
        <DeactivateMethodModal 
          method={selectedMethod}
          methods={methods.filter(m => m.id !== selectedMethod.id && m.isActive)}
          onClose={() => setShowDeactivateModal(false)}
        />
      )}
    </div>
  );
};

// ============================================
// DEACTIVATE METHOD MODAL
// ============================================

const DeactivateMethodModal = ({ method, methods, onClose }) => {
  const [step, setStep] = useState(1);
  const [action, setAction] = useState(null);
  const [selectedReplacement, setSelectedReplacement] = useState('');
  const [transferDefault, setTransferDefault] = useState(true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Step 1: Impact Summary */}
        {step === 1 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Deactivate Method</h3>
                <p className="text-sm text-gray-500">Review impact before deactivating</p>
              </div>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <p className="text-gray-600 mb-4">
                You are about to deactivate: <strong>{method?.name}</strong>
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-amber-800 mb-2">This method is currently assigned to:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-sm text-amber-700">
                    <Beaker size={14} />
                    <span>{method?.testCount} tests (default method for {method?.defaultForCount} tests)</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-amber-700">
                    <Cpu size={14} />
                    <span>{method?.instrumentCount} instruments</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-amber-700">
                    <FlaskConical size={14} />
                    <span>{method?.reagentCount} reagents</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm font-medium text-gray-700 mb-3">What would you like to do with assigned tests?</p>
              
              <div className="space-y-2">
                <label 
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    action === 'leave' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="deactivate-action" 
                    value="leave"
                    checked={action === 'leave'}
                    onChange={() => setAction('leave')}
                    className="mt-1 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Leave tests without this method</p>
                    <p className="text-sm text-gray-500">Tests will have one fewer method option available</p>
                  </div>
                </label>
                
                <label 
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    action === 'reassign' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="deactivate-action" 
                    value="reassign"
                    checked={action === 'reassign'}
                    onChange={() => setAction('reassign')}
                    className="mt-1 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Reassign tests to a different method</p>
                    <p className="text-sm text-gray-500">Select a replacement method for affected tests</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => setStep(action === 'reassign' ? 2 : 3)}
                disabled={!action}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 2: Select Replacement */}
        {step === 2 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reassign Tests to New Method</h3>
              <p className="text-sm text-gray-500">Select a replacement method for the {method?.testCount} affected tests</p>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select replacement method: <span className="text-red-500">*</span>
                </label>
                <select 
                  value={selectedReplacement}
                  onChange={(e) => setSelectedReplacement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Select method...</option>
                  {methods.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Tests to reassign ({method?.testCount}):</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle size={14} className="text-teal-500" />
                    HIV 1/2 Antibody <span className="text-xs text-gray-400">(default)</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle size={14} className="text-teal-500" />
                    HIV Confirmatory <span className="text-xs text-gray-400">(default)</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle size={14} className="text-teal-500" />
                    HIV Rapid Test <span className="text-xs text-gray-400">(default)</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle size={14} className="text-teal-500" />
                    Hepatitis B Surface Antigen
                  </div>
                  <div className="text-sm text-gray-400 italic">... and {method?.testCount - 4} more tests</div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={transferDefault}
                  onChange={(e) => setTransferDefault(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Transfer "default method" status to new method ({method?.defaultForCount} tests)</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button 
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!selectedReplacement}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deactivation</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">The following actions will be performed:</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-800">
                  <Check size={16} className="text-blue-500" />
                  <span>Deactivate method: <strong>{method?.name}</strong></span>
                </div>
                {action === 'reassign' ? (
                  <>
                    <div className="flex items-center gap-2 text-blue-800">
                      <Check size={16} className="text-blue-500" />
                      <span>Reassign {method?.testCount} tests to new method</span>
                    </div>
                    {transferDefault && (
                      <div className="flex items-center gap-2 text-blue-800">
                        <Check size={16} className="text-blue-500" />
                        <span>Transfer default status for {method?.defaultForCount} tests</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-blue-800">
                    <Check size={16} className="text-blue-500" />
                    <span>Remove method from {method?.testCount} tests</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Instrument and reagent links will be preserved but the method will not appear in active method lists.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button 
                onClick={() => setStep(action === 'reassign' ? 2 : 1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// METHOD EDITOR
// ============================================

const MethodEditor = ({ method, initialTab = 'basic', onBack }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Paperclip },
    { id: 'tests', label: 'Tests', icon: Beaker },
    { id: 'instruments', label: 'Instruments', icon: Cpu },
    { id: 'reagents', label: 'Reagents', icon: FlaskConical },
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
                {method ? `Edit: ${method.name}` : 'Add New Method'}
              </h1>
              <p className="text-sm text-gray-500">Configure method settings and associations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
              Save Method
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
            {tabs.slice(0, 2).map((tab) => {
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
            
            <div className="mt-4 mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Associations</p>
            </div>
            {tabs.slice(2).map((tab) => {
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
            {activeTab === 'basic' && <BasicInfoTab method={method} />}
            {activeTab === 'documents' && <DocumentsTab />}
            {activeTab === 'tests' && <TestsTab method={method} />}
            {activeTab === 'instruments' && <InstrumentsTab />}
            {activeTab === 'reagents' && <ReagentsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// BASIC INFO TAB
// ============================================

const BasicInfoTab = ({ method }) => {
  const labUnits = ['Chemistry', 'Hematology', 'Immunology', 'Microbiology', 'Molecular Biology', 'Serology', 'Urinalysis'];
  const [selectedLabUnits, setSelectedLabUnits] = useState(method?.labUnits || []);

  const toggleLabUnit = (lu) => {
    if (selectedLabUnits.includes(lu)) {
      setSelectedLabUnits(selectedLabUnits.filter(l => l !== lu));
    } else {
      setSelectedLabUnits([...selectedLabUnits, lu]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              defaultValue={method?.name || ''}
              placeholder="e.g., ELISA - HIV 1/2 Antibody"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              defaultValue={method?.code || ''}
              placeholder="e.g., ELISA-HIV"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              rows={3}
              defaultValue={method?.description || ''}
              placeholder="Detailed description of the method..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference URL
            </label>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="url"
                placeholder="https://example.com/method-documentation"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Link to external documentation or reference material</p>
          </div>
        </div>
      </div>

      {/* Lab Units */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Lab Units</h2>
        <p className="text-sm text-gray-500 mb-4">Select which lab units use this method (at least one required)</p>
        
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

      {/* Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
        
        <div className="flex items-start gap-4">
          <button
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-teal-600"
          >
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
          </button>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Active</p>
            <p className="text-sm text-gray-500 mt-1">
              This method appears in method selection lists and can be assigned to tests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DOCUMENTS TAB
// ============================================

const DocumentsTab = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const documents = [
    { id: 1, name: 'SOP-ELISA-HIV-v2.1.pdf', type: 'SOP', version: '2.1', effectiveDate: '2024-06-01', size: '2.4 MB', uploadedBy: 'John Smith', uploadedAt: '2024-05-28' },
    { id: 2, name: 'ELISA-HIV-Training-Guide.pdf', type: 'Training', version: '1.0', effectiveDate: '2024-01-15', size: '5.1 MB', uploadedBy: 'Jane Doe', uploadedAt: '2024-01-10' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <p className="text-sm text-gray-500">SOPs, training materials, and reference documents</p>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
          >
            <Upload size={18} />
            Upload Document
          </button>
        </div>

        {documents.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Document</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Version</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Effective</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <FileText className="text-red-600" size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.size} â€¢ Uploaded by {doc.uploadedBy}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      doc.type === 'SOP' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{doc.version}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{doc.effectiveDate}</span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button className="text-teal-600 hover:text-teal-800 text-sm">Download</button>
                    <button className="text-gray-500 hover:text-gray-700 text-sm">Edit</button>
                    <button className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p>No documents uploaded</p>
            <p className="text-sm">Upload SOPs and reference materials for this method</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600 text-sm">Drop file here or click to browse</p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, XLS, XLSX (max 25MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                <input 
                  type="text"
                  placeholder="Auto-filled from filename"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                  <option value="sop">SOP (Standard Operating Procedure)</option>
                  <option value="reference">Reference</option>
                  <option value="training">Training Material</option>
                  <option value="validation">Validation Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input 
                    type="text"
                    placeholder="e.g., 1.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                  <input 
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// TESTS TAB
// ============================================

const TestsTab = ({ method }) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);

  const assignedTests = [
    { id: 1, name: 'HIV 1/2 Antibody', code: 'HIV-AB', sampleType: 'Serum', labUnit: 'Immunology', isDefault: true },
    { id: 2, name: 'HIV Confirmatory', code: 'HIV-CONF', sampleType: 'Serum', labUnit: 'Immunology', isDefault: true },
    { id: 3, name: 'HIV Rapid Test', code: 'HIV-RAPID', sampleType: 'Whole Blood', labUnit: 'Immunology', isDefault: true },
    { id: 4, name: 'Hepatitis B Surface Antigen', code: 'HBsAg', sampleType: 'Serum', labUnit: 'Immunology', isDefault: false },
    { id: 5, name: 'Hepatitis C Antibody', code: 'HCV-AB', sampleType: 'Serum', labUnit: 'Immunology', isDefault: false },
  ];

  const defaultCount = assignedTests.filter(t => t.isDefault).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assigned Tests</h2>
            <p className="text-sm text-gray-500">
              This method is assigned to {assignedTests.length} tests (default for {defaultCount} tests)
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPanelModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
            >
              <Layers size={18} />
              Assign to Panel
            </button>
            <button 
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
            >
              <Plus size={18} />
              Assign to Tests
            </button>
          </div>
        </div>

        {assignedTests.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Test</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Sample Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Lab Unit</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Default</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedTests.map((test) => (
                <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{test.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-gray-600">{test.code}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{test.sampleType}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {test.labUnit}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {test.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-teal-600">
                        <Star size={14} fill="currentColor" />
                        Default
                      </span>
                    ) : (
                      <button className="text-sm text-gray-500 hover:text-teal-600">Set as default</button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Beaker size={32} className="mx-auto mb-2 opacity-50" />
            <p>No tests assigned</p>
            <p className="text-sm">Assign this method to tests or panels</p>
          </div>
        )}
      </div>

      {/* Assign to Panel Modal */}
      {showPanelModal && (
        <AssignToPanelModal 
          method={method}
          onClose={() => setShowPanelModal(false)}
        />
      )}

      {/* Assign to Tests Modal */}
      {showAssignModal && (
        <AssignToTestsModal 
          method={method}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
};

// ============================================
// ASSIGN TO PANEL MODAL
// ============================================

const AssignToPanelModal = ({ method, onClose }) => {
  const [selectedPanel, setSelectedPanel] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);

  const panels = [
    { id: 1, name: 'Basic Metabolic Panel', code: 'BMP', testCount: 8 },
    { id: 2, name: 'Comprehensive Metabolic Panel', code: 'CMP', testCount: 14 },
    { id: 3, name: 'Hepatitis Panel', code: 'HEP', testCount: 6 },
    { id: 4, name: 'HIV Screening Panel', code: 'HIV-SCR', testCount: 4 },
  ];

  const selectedPanelData = panels.find(p => p.id.toString() === selectedPanel);

  const previewTests = [
    { name: 'HIV 1/2 Antibody', alreadyAssigned: true },
    { name: 'HIV p24 Antigen', alreadyAssigned: false },
    { name: 'HIV Confirmatory', alreadyAssigned: true },
    { name: 'CD4 Count', alreadyAssigned: false },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Assign Method to Panel</h3>
          <p className="text-sm text-gray-500">Add this method to all tests in a panel</p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Panel
            </label>
            <select 
              value={selectedPanel}
              onChange={(e) => setSelectedPanel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select a panel...</option>
              {panels.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.testCount} tests)</option>
              ))}
            </select>
          </div>

          {selectedPanel && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  This will add "{method?.name || 'ELISA - HIV 1/2 Antibody'}" to {selectedPanelData?.testCount} tests:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {previewTests.map((test, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {test.alreadyAssigned ? (
                        <>
                          <Check size={14} className="text-gray-400" />
                          <span className="text-gray-500">{test.name}</span>
                          <span className="text-xs text-gray-400">(already assigned)</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} className="text-teal-500" />
                          <span className="text-gray-700">{test.name}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Set as default method for these tests</span>
              </label>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            disabled={!selectedPanel}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign to Panel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ASSIGN TO TESTS MODAL
// ============================================

const AssignToTestsModal = ({ method, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [labUnitFilter, setLabUnitFilter] = useState('all');

  const availableTests = [
    { id: 10, name: 'Rubella IgG', code: 'RUB-IGG', labUnit: 'Immunology' },
    { id: 11, name: 'Rubella IgM', code: 'RUB-IGM', labUnit: 'Immunology' },
    { id: 12, name: 'CMV IgG', code: 'CMV-IGG', labUnit: 'Immunology' },
    { id: 13, name: 'CMV IgM', code: 'CMV-IGM', labUnit: 'Immunology' },
    { id: 14, name: 'Toxoplasma IgG', code: 'TOXO-IGG', labUnit: 'Immunology' },
    { id: 15, name: 'Toxoplasma IgM', code: 'TOXO-IGM', labUnit: 'Immunology' },
    { id: 16, name: 'HSV-1 IgG', code: 'HSV1-IGG', labUnit: 'Immunology' },
    { id: 17, name: 'HSV-2 IgG', code: 'HSV2-IGG', labUnit: 'Immunology' },
  ];

  const toggleTest = (testId) => {
    if (selectedTests.includes(testId)) {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    } else {
      setSelectedTests([...selectedTests, testId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Assign Method to Tests</h3>
          <p className="text-sm text-gray-500">Select tests to assign this method to</p>
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
              <option value="immunology">Immunology</option>
              <option value="chemistry">Chemistry</option>
            </select>
          </div>

          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {availableTests.map(test => (
              <label 
                key={test.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <input 
                  type="checkbox"
                  checked={selectedTests.includes(test.id)}
                  onChange={() => toggleTest(test.id)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{test.name}</p>
                  <p className="text-xs text-gray-500">{test.code} â€¢ {test.labUnit}</p>
                </div>
              </label>
            ))}
          </div>

          {selectedTests.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Set as default method for selected tests</span>
            </label>
          )}
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
              onClick={onClose}
              disabled={selectedTests.length === 0}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign to Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// INSTRUMENTS TAB
// ============================================

const InstrumentsTab = () => {
  const instruments = [
    { id: 1, name: 'ARCHITECT i2000SR', code: 'ARCH-I2000', type: 'Immunoassay Analyzer', isPrimary: true, status: 'Active' },
    { id: 2, name: 'Cobas e411', code: 'COBAS-E411', type: 'Immunoassay Analyzer', isPrimary: false, status: 'Active' },
    { id: 3, name: 'ADVIA Centaur XP', code: 'ADVIA-CXP', type: 'Immunoassay Analyzer', isPrimary: false, status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Linked Instruments</h2>
            <p className="text-sm text-gray-500">Instruments/analyzers that can perform this method</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
            <Plus size={18} />
            Add Instrument
          </button>
        </div>

        {instruments.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Instrument</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Primary</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instruments.map((inst) => (
                <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{inst.name}</p>
                      <p className="text-xs font-mono text-gray-500">{inst.code}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{inst.type}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {inst.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {inst.isPrimary ? (
                      <span className="inline-flex items-center gap-1 text-teal-600">
                        <Star size={14} fill="currentColor" />
                        Primary
                      </span>
                    ) : (
                      <button className="text-sm text-gray-500 hover:text-teal-600">Set as primary</button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Cpu size={32} className="mx-auto mb-2 opacity-50" />
            <p>No instruments linked</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// REAGENTS TAB
// ============================================

const ReagentsTab = () => {
  const reagents = [
    { id: 1, name: 'HIV Ag/Ab Combo Reagent Kit', code: 'ABB-07P42', manufacturer: 'Abbott', usageNotes: 'Use within 30 days of opening', stockStatus: 'In Stock' },
    { id: 2, name: 'HIV Calibrator', code: 'ABB-07P44', manufacturer: 'Abbott', usageNotes: '', stockStatus: 'In Stock' },
    { id: 3, name: 'HIV Control (Positive)', code: 'ABB-07P45', manufacturer: 'Abbott', usageNotes: 'Run daily', stockStatus: 'Low Stock' },
    { id: 4, name: 'HIV Control (Negative)', code: 'ABB-07P46', manufacturer: 'Abbott', usageNotes: 'Run daily', stockStatus: 'In Stock' },
    { id: 5, name: 'Pre-Trigger Solution', code: 'ABB-07P01', manufacturer: 'Abbott', usageNotes: '', stockStatus: 'In Stock' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Linked Reagents</h2>
            <p className="text-sm text-gray-500">Reagent kits and consumables used by this method</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
            <Plus size={18} />
            Add Reagent
          </button>
        </div>

        {reagents.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reagent</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Manufacturer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Usage Notes</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Stock</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reagents.map((reagent) => (
                <tr key={reagent.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{reagent.name}</p>
                      <p className="text-xs font-mono text-gray-500">{reagent.code}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{reagent.manufacturer}</span>
                  </td>
                  <td className="py-3 px-4">
                    {reagent.usageNotes ? (
                      <span className="text-sm text-gray-600">{reagent.usageNotes}</span>
                    ) : (
                      <button className="text-sm text-gray-400 hover:text-teal-600">Add notes</button>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      reagent.stockStatus === 'In Stock' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {reagent.stockStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button className="text-gray-500 hover:text-gray-700 text-sm">Edit</button>
                    <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FlaskConical size={32} className="mx-auto mb-2 opacity-50" />
            <p>No reagents linked</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

export default function MethodsApp() {
  const [view, setView] = useState('list');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [initialTab, setInitialTab] = useState('basic');

  if (view === 'edit') {
    return (
      <MethodEditor 
        method={selectedMethod}
        initialTab={initialTab}
        onBack={() => {
          setView('list');
          setSelectedMethod(null);
          setInitialTab('basic');
        }}
      />
    );
  }

  return (
    <MethodsList 
      onSelectMethod={setSelectedMethod}
      onEditMethod={(method, tab = 'basic') => {
        setSelectedMethod(method);
        setInitialTab(tab);
        setView('edit');
      }}
    />
  );
}
