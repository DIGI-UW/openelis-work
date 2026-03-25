import React, { useState } from 'react';
import { 
  Search, Plus, Filter, Download, Upload, Edit, Trash2, ChevronDown, ChevronRight, 
  Info, X, Check, AlertTriangle, ChevronLeft, Settings, FileText, Users, Beaker,
  GripVertical, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Layers, 
  FolderKanban, Workflow, Package, MoreVertical, RefreshCw, Copy, Building2,
  FlaskConical, ClipboardList, Database, GitBranch
} from 'lucide-react';

// ============================================
// LAB UNITS LIST VIEW
// ============================================

const LabUnitsList = ({ onSelectUnit, onEditUnit }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState('displayOrder');
  const [sortOrder, setSortOrder] = useState('asc');

  const labUnits = [
    { 
      id: 1, name: 'Clinical Chemistry', code: 'CHEM', isActive: true, displayOrder: 1, 
      tests: 47, panels: 8, programs: 3, projects: 2, workflows: 2,
      testList: ['Glucose, Fasting', 'HbA1c', 'Cholesterol, Total', 'Triglycerides', 'HDL', 'LDL', 'BUN', 'Creatinine', 'ALT', 'AST'],
      panelList: ['Basic Metabolic Panel', 'Comprehensive Metabolic Panel', 'Lipid Panel', 'Liver Function Tests', 'Renal Panel'],
      programList: ['Diabetes Management', 'Cardiovascular Risk', 'Chronic Kidney Disease'],
      workflowList: ['Dual Entry with Supervisor Review', 'Auto-Verification for Normal Results']
    },
    { 
      id: 2, name: 'Hematology', code: 'HEMA', isActive: true, displayOrder: 2, 
      tests: 32, panels: 5, programs: 2, projects: 1, workflows: 1,
      testList: ['CBC', 'Hemoglobin', 'Hematocrit', 'WBC', 'Platelet Count', 'RBC', 'MCV', 'MCH', 'MCHC', 'RDW'],
      panelList: ['Complete Blood Count', 'Coagulation Panel', 'Anemia Panel', 'Iron Studies', 'Reticulocyte Panel'],
      programList: ['Anemia Management', 'Anticoagulation Clinic'],
      workflowList: ['Standard Result Entry']
    },
    { 
      id: 3, name: 'Microbiology', code: 'MICRO', isActive: true, displayOrder: 3, 
      tests: 56, panels: 12, programs: 4, projects: 3, workflows: 3,
      testList: ['Blood Culture', 'Urine Culture', 'Stool Culture', 'Wound Culture', 'Sputum Culture', 'CSF Culture', 'Gram Stain', 'AFB Smear'],
      panelList: ['Respiratory Panel', 'GI Pathogen Panel', 'STI Panel', 'Sepsis Panel', 'Meningitis Panel'],
      programList: ['HIV Program', 'TB Program', 'Infection Control', 'AMR Surveillance'],
      workflowList: ['Culture Review', 'Sensitivity Verification', 'Critical Value Alert']
    },
    { 
      id: 4, name: 'Immunology/Serology', code: 'IMMU', isActive: true, displayOrder: 4, 
      tests: 28, panels: 6, programs: 5, projects: 0, workflows: 1,
      testList: ['HIV Ab', 'Hepatitis B Surface Ag', 'Hepatitis C Ab', 'RPR', 'ANA', 'RF', 'CRP', 'ESR'],
      panelList: ['Hepatitis Panel', 'Autoimmune Panel', 'Allergy Panel', 'Immunoglobulin Panel'],
      programList: ['HIV Program', 'Hepatitis Screening', 'Autoimmune Clinic', 'Transplant', 'Rheumatology'],
      workflowList: ['Confirmatory Testing Required']
    },
    { 
      id: 5, name: 'Molecular Biology', code: 'MOL', isActive: true, displayOrder: 5, 
      tests: 18, panels: 3, programs: 2, projects: 4, workflows: 2,
      testList: ['HIV Viral Load', 'HCV Viral Load', 'HBV DNA', 'COVID-19 PCR', 'TB PCR', 'HPV Genotyping'],
      panelList: ['Respiratory Viral Panel', 'STI PCR Panel', 'Oncology Panel'],
      programList: ['HIV Program', 'Hepatitis Treatment'],
      workflowList: ['Dual Entry Required', 'Batch Release']
    },
    { 
      id: 6, name: 'Urinalysis', code: 'UA', isActive: true, displayOrder: 6, 
      tests: 15, panels: 2, programs: 0, projects: 0, workflows: 1,
      testList: ['Urinalysis Complete', 'Urine Microscopy', 'Urine Protein', 'Urine Glucose', 'Urine pH', 'Specific Gravity'],
      panelList: ['Complete Urinalysis', 'Urine Drug Screen'],
      programList: [],
      workflowList: ['Standard Result Entry']
    },
    { 
      id: 7, name: 'Blood Bank', code: 'BB', isActive: false, displayOrder: 7, 
      tests: 22, panels: 4, programs: 1, projects: 0, workflows: 2,
      testList: ['ABO Typing', 'Rh Typing', 'Antibody Screen', 'Crossmatch', 'DAT', 'Antibody ID'],
      panelList: ['Type and Screen', 'Type and Crossmatch', 'Antibody Panel', 'Transfusion Panel'],
      programList: ['Transfusion Services'],
      workflowList: ['Dual Entry Required', 'Supervisor Release']
    },
    { 
      id: 8, name: 'Cytology', code: 'CYTO', isActive: false, displayOrder: 8, 
      tests: 8, panels: 1, programs: 0, projects: 1, workflows: 1,
      testList: ['Pap Smear', 'FNA Cytology', 'Body Fluid Cytology', 'Urine Cytology', 'Sputum Cytology'],
      panelList: ['Cervical Screening'],
      programList: [],
      workflowList: ['Pathologist Review']
    },
    { 
      id: 9, name: 'Histopathology', code: 'HISTO', isActive: true, displayOrder: 9, 
      tests: 12, panels: 2, programs: 1, projects: 2, workflows: 2,
      testList: ['Tissue Biopsy', 'Frozen Section', 'Special Stains', 'IHC Panel'],
      panelList: ['Biopsy Panel', 'Cancer Markers'],
      programList: ['Oncology'],
      workflowList: ['Pathologist Review', 'Dual Sign-out']
    },
    { 
      id: 10, name: 'Toxicology', code: 'TOX', isActive: true, displayOrder: 10, 
      tests: 25, panels: 4, programs: 1, projects: 0, workflows: 1,
      testList: ['Drug Screen', 'Alcohol Level', 'Heavy Metals', 'Therapeutic Drug Monitoring'],
      panelList: ['Urine Drug Screen', 'Serum Drug Screen', 'Heavy Metal Panel', 'TDM Panel'],
      programList: ['Substance Abuse'],
      workflowList: ['Chain of Custody']
    },
    { 
      id: 11, name: 'Point of Care', code: 'POC', isActive: true, displayOrder: 11, 
      tests: 18, panels: 3, programs: 0, projects: 1, workflows: 1,
      testList: ['Glucose POC', 'HbA1c POC', 'Lipid POC', 'PT/INR POC', 'Pregnancy Test'],
      panelList: ['Diabetes POC', 'Cardiac POC', 'Coag POC'],
      programList: [],
      workflowList: ['Auto-Verification']
    },
    { 
      id: 12, name: 'Parasitology', code: 'PARA', isActive: true, displayOrder: 12, 
      tests: 14, panels: 2, programs: 2, projects: 0, workflows: 1,
      testList: ['Malaria Smear', 'Stool O&P', 'Pinworm Prep', 'Giardia Antigen'],
      panelList: ['Malaria Panel', 'GI Parasite Panel'],
      programList: ['Malaria Program', 'Tropical Medicine'],
      workflowList: ['Microscopy Review']
    },
  ];

  // Filter lab units
  const filteredUnits = labUnits.filter(unit => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && unit.isActive) || 
      (statusFilter === 'inactive' && !unit.isActive);
    const matchesSearch = unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Sort lab units
  const sortedUnits = [...filteredUnits].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (['displayOrder', 'tests', 'panels', 'programs', 'workflows'].includes(sortField)) {
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
  const totalPages = Math.ceil(sortedUnits.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUnits = sortedUnits.slice(startIndex, startIndex + pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <GripVertical size={14} className="text-gray-400" />;
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
            <h1 className="text-xl font-semibold text-gray-900">Lab Unit Setup</h1>
            <p className="text-sm text-gray-500">Manage laboratory sections and their assignments</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              <Upload size={18} />
              Import
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              <Download size={18} />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
              <Plus size={18} />
              Add Lab Unit
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
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
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
            {filteredUnits.length} lab units
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
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                  onClick={() => handleSort('displayOrder')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Order
                    <SortIcon field="displayOrder" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Lab Unit Name
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center gap-2">
                    Code
                    <SortIcon field="code" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                  onClick={() => handleSort('tests')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Tests
                    <SortIcon field="tests" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                  onClick={() => handleSort('panels')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Panels
                    <SortIcon field="panels" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                  onClick={() => handleSort('programs')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Programs
                    <SortIcon field="programs" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                  onClick={() => handleSort('workflows')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Workflows
                    <SortIcon field="workflows" />
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
              {paginatedUnits.map((unit) => (
                <tr 
                  key={unit.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEditUnit && onEditUnit(unit)}
                >
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-500">{unit.displayOrder}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{unit.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-600">{unit.code}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600">{unit.tests}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600">{unit.panels}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600">{unit.programs}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600">{unit.workflows}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {unit.isActive ? (
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
                        onClick={() => onEditUnit && onEditUnit(unit)}
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
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredUnits.length)} of {filteredUnits.length} lab units
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
      {showDeactivateModal && selectedUnit && (
        <DeactivateLabUnitModal 
          unit={selectedUnit}
          onClose={() => setShowDeactivateModal(false)}
        />
      )}
    </div>
  );
};
// ============================================
// DEACTIVATE FROM LIST MODAL
// ============================================

const DeactivateFromListModal = ({ unit, labUnits, onClose, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [action, setAction] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedTests, setSelectedTests] = useState(unit?.testList || []);
  const [selectedPanels, setSelectedPanels] = useState(unit?.panelList || []);
  const [selectedPrograms, setSelectedPrograms] = useState(unit?.programList || []);
  const [selectedWorkflows, setSelectedWorkflows] = useState(unit?.workflowList || []);

  const totalAffected = (unit?.testList?.length || 0) + (unit?.panelList?.length || 0) + 
                        (unit?.programList?.length || 0) + (unit?.workflowList?.length || 0);

  const totalSelected = selectedTests.length + selectedPanels.length + 
                        selectedPrograms.length + selectedWorkflows.length;

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const selectAllInCategory = (sourceList, setList) => {
    setList([...sourceList]);
  };

  const deselectAllInCategory = (setList) => {
    setList([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Step 1: Warning and Options */}
        {step === 1 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Deactivate {unit?.name}?</h3>
                <p className="text-sm text-gray-500">This lab unit has assigned items that will be affected</p>
              </div>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  Deactivating this lab unit will leave the following items without an active lab unit:
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {unit?.workflowList?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <GitBranch size={14} />
                      <span>{unit.workflowList.length} workflows</span>
                    </div>
                  )}
                  {unit?.programList?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <ClipboardList size={14} />
                      <span>{unit.programList.length} programs</span>
                    </div>
                  )}
                  {unit?.panelList?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <Layers size={14} />
                      <span>{unit.panelList.length} panels</span>
                    </div>
                  )}
                  {unit?.testList?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <Beaker size={14} />
                      <span>{unit.tests} tests</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm font-medium text-gray-700 mb-3">What would you like to do?</p>
              
              <div className="space-y-2">
                <label 
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    action === 'deactivate-only' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="deactivate-action" 
                    value="deactivate-only"
                    checked={action === 'deactivate-only'}
                    onChange={() => setAction('deactivate-only')}
                    className="mt-1 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Deactivate lab unit only</p>
                    <p className="text-sm text-gray-500">Items will remain assigned but the lab unit will be hidden from order entry</p>
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
                    <p className="font-medium text-gray-900">Reassign items to another lab unit</p>
                    <p className="text-sm text-gray-500">Move all or selected items to a different lab unit before deactivating</p>
                  </div>
                </label>
                
                <label 
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    action === 'deactivate-all' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="deactivate-action" 
                    value="deactivate-all"
                    checked={action === 'deactivate-all'}
                    onChange={() => setAction('deactivate-all')}
                    className="mt-1 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Deactivate lab unit and all assigned tests</p>
                    <p className="text-sm text-gray-500">All tests will also be deactivated and hidden from order entry</p>
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
                onClick={() => {
                  if (action === 'reassign') {
                    setStep(2);
                  } else if (action === 'deactivate-all') {
                    setStep(3);
                  } else {
                    onConfirm();
                  }
                }}
                disabled={!action}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 2: Select items to reassign */}
        {step === 2 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Items to Reassign</h3>
              <p className="text-sm text-gray-500">Choose which items to move to another lab unit</p>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {/* Destination Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reassign to: <span className="text-red-500">*</span>
                </label>
                <select 
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Select destination lab unit...</option>
                  {labUnits.map(lu => (
                    <option key={lu.id} value={lu.id}>{lu.name} ({lu.code})</option>
                  ))}
                </select>
              </div>

              {/* Item Selection */}
              <div className="space-y-4">
                {/* Workflows */}
                {unit?.workflowList?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-700">Workflows</span>
                        <span className="text-sm text-gray-500">({selectedWorkflows.length}/{unit.workflowList.length} selected)</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => selectAllInCategory(unit.workflowList, setSelectedWorkflows)}
                          className="text-xs text-teal-600 hover:text-teal-800"
                        >
                          Select all
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          onClick={() => deselectAllInCategory(setSelectedWorkflows)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Deselect all
                        </button>
                      </div>
                    </div>
                    <div className="p-2 max-h-32 overflow-y-auto">
                      {unit.workflowList.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedWorkflows.includes(item)}
                            onChange={() => toggleItem(selectedWorkflows, setSelectedWorkflows, item)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Programs */}
                {unit?.programList?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={16} className="text-green-600" />
                        <span className="font-medium text-gray-700">Programs</span>
                        <span className="text-sm text-gray-500">({selectedPrograms.length}/{unit.programList.length} selected)</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => selectAllInCategory(unit.programList, setSelectedPrograms)}
                          className="text-xs text-teal-600 hover:text-teal-800"
                        >
                          Select all
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          onClick={() => deselectAllInCategory(setSelectedPrograms)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Deselect all
                        </button>
                      </div>
                    </div>
                    <div className="p-2 max-h-32 overflow-y-auto">
                      {unit.programList.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedPrograms.includes(item)}
                            onChange={() => toggleItem(selectedPrograms, setSelectedPrograms, item)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Panels */}
                {unit?.panelList?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={16} className="text-purple-600" />
                        <span className="font-medium text-gray-700">Panels</span>
                        <span className="text-sm text-gray-500">({selectedPanels.length}/{unit.panelList.length} selected)</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => selectAllInCategory(unit.panelList, setSelectedPanels)}
                          className="text-xs text-teal-600 hover:text-teal-800"
                        >
                          Select all
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          onClick={() => deselectAllInCategory(setSelectedPanels)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Deselect all
                        </button>
                      </div>
                    </div>
                    <div className="p-2 max-h-32 overflow-y-auto">
                      {unit.panelList.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedPanels.includes(item)}
                            onChange={() => toggleItem(selectedPanels, setSelectedPanels, item)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tests */}
                {unit?.testList?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Beaker size={16} className="text-blue-600" />
                        <span className="font-medium text-gray-700">Tests</span>
                        <span className="text-sm text-gray-500">({selectedTests.length}/{unit.testList.length} selected)</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => selectAllInCategory(unit.testList, setSelectedTests)}
                          className="text-xs text-teal-600 hover:text-teal-800"
                        >
                          Select all
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          onClick={() => deselectAllInCategory(setSelectedTests)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Deselect all
                        </button>
                      </div>
                    </div>
                    <div className="p-2 max-h-40 overflow-y-auto">
                      {unit.testList.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedTests.includes(item)}
                            onChange={() => toggleItem(selectedTests, setSelectedTests, item)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{totalSelected}</strong> items selected for reassignment.
                  {totalAffected - totalSelected > 0 && (
                    <span className="text-blue-600"> ({totalAffected - totalSelected} items will remain without an active lab unit)</span>
                  )}
                </p>
              </div>
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
                  onClick={onConfirm}
                  disabled={!selectedDestination || totalSelected === 0}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reassign & Deactivate
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Confirm deactivate all */}
        {step === 3 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Bulk Deactivation</h3>
                <p className="text-sm text-gray-500">This action will deactivate multiple items</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">The following will be deactivated and hidden from order entry:</p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-800">
                  <X size={16} className="text-red-500" />
                  <span className="font-medium">{unit?.name}</span> lab unit
                </div>
                {unit?.tests > 0 && (
                  <div className="flex items-center gap-2 text-red-700">
                    <X size={16} className="text-red-500" />
                    <span>{unit.tests} tests</span>
                  </div>
                )}
                {unit?.panelList?.length > 0 && (
                  <div className="flex items-center gap-2 text-red-700">
                    <X size={16} className="text-red-500" />
                    <span>{unit.panelList.length} panels</span>
                  </div>
                )}
                {unit?.programList?.length > 0 && (
                  <div className="flex items-center gap-2 text-red-700">
                    <X size={16} className="text-red-500" />
                    <span>{unit.programList.length} programs</span>
                  </div>
                )}
                {unit?.workflowList?.length > 0 && (
                  <div className="flex items-center gap-2 text-red-700">
                    <X size={16} className="text-red-500" />
                    <span>{unit.workflowList.length} workflows</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-4">
                This action can be reversed by reactivating items individually.
              </p>
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
                  onClick={onConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                >
                  Deactivate All
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
// LAB UNIT EDITOR (TABBED INTERFACE)
// ============================================

const LabUnitEditor = ({ unit, initialTab = 'basic', onBack }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'tests', label: 'Tests', icon: Beaker },
    { id: 'panels', label: 'Panels', icon: Layers },
    { id: 'programs', label: 'Programs', icon: ClipboardList },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'import-export', label: 'Import/Export', icon: Database },
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
                {unit ? `Edit: ${unit.name}` : 'Add New Lab Unit'}
              </h1>
              <p className="text-sm text-gray-500">Configure lab unit settings and assignments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
              Save Lab Unit
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
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Assignments</p>
            </div>
            {tabs.slice(2, 6).map((tab) => {
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
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</p>
            </div>
            {tabs.slice(6).map((tab) => {
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
            {activeTab === 'basic' && <BasicInfoTab unit={unit} />}
            {activeTab === 'workflows' && <WorkflowsTab />}
            {activeTab === 'tests' && <TestsTab unit={unit} />}
            {activeTab === 'panels' && <PanelsTab />}
            {activeTab === 'programs' && <ProgramsTab />}
            {activeTab === 'projects' && <ProjectsTab />}
            {activeTab === 'import-export' && <ImportExportTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// BASIC INFO TAB
// ============================================

const BasicInfoTab = ({ unit }) => {
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isActive, setIsActive] = useState(unit?.isActive ?? true);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab Unit Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              defaultValue={unit?.name || ''}
              placeholder="e.g., Clinical Chemistry"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code/Abbreviation <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              defaultValue={unit?.code || ''}
              placeholder="e.g., CHEM"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              rows={3}
              defaultValue=""
              placeholder="Optional description of this lab unit..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <input 
              type="number"
              min="1"
              defaultValue={unit?.displayOrder || 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-xs text-gray-500 mt-1">Order in dropdowns and menus</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              External ID
            </label>
            <input 
              type="text"
              placeholder="For integration mapping"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
        
        <div className="flex items-start gap-4">
          <button
            onClick={() => {
              if (isActive) {
                setShowDeactivateModal(true);
              } else {
                setIsActive(true);
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? 'bg-teal-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {isActive ? 'Active' : 'Inactive'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isActive 
                ? 'This lab unit appears in order entry and reports.'
                : 'This lab unit is hidden from order entry but historical data is preserved.'}
            </p>
            {unit && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Current assignments:</strong> {unit.tests} tests, {unit.panels} panels, {unit.programs} programs, {unit.projects} projects
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <DeactivateModal 
          unit={unit} 
          onClose={() => setShowDeactivateModal(false)}
          onConfirm={() => {
            setIsActive(false);
            setShowDeactivateModal(false);
          }}
        />
      )}
    </div>
  );
};

// ============================================
// DEACTIVATE MODAL
// ============================================

const DeactivateModal = ({ unit, onClose, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [option, setOption] = useState('keep');
  const [confirmText, setConfirmText] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {step === 1 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Deactivate Lab Unit</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">
                You are about to deactivate: <strong>{unit?.name}</strong>
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-amber-800 mb-2">This will affect:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>â€¢ {unit?.tests || 0} tests</li>
                  <li>â€¢ {unit?.panels || 0} panels</li>
                  <li>â€¢ {unit?.programs || 0} programs</li>
                  <li>â€¢ {unit?.projects || 0} projects</li>
                </ul>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Deactivated lab units are hidden from order entry but historical data is preserved.
              </p>

              <p className="text-sm font-medium text-gray-700 mb-3">What would you like to do with assigned items?</p>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="deactivate-option" 
                    value="keep"
                    checked={option === 'keep'}
                    onChange={() => setOption('keep')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Keep assignments</p>
                    <p className="text-sm text-gray-500">Items remain assigned but unit is hidden</p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="deactivate-option" 
                    value="deactivate-all"
                    checked={option === 'deactivate-all'}
                    onChange={() => setOption('deactivate-all')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Deactivate all assigned items</p>
                    <p className="text-sm text-gray-500">All tests, panels, programs, and projects will be deactivated</p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="deactivate-option" 
                    value="reassign"
                    checked={option === 'reassign'}
                    onChange={() => setOption('reassign')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Reassign items to another lab unit first</p>
                    <p className="text-sm text-gray-500">Move all items before deactivating</p>
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
                onClick={() => setStep(option === 'deactivate-all' ? 3 : option === 'reassign' ? 2 : 4)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reassign Items Before Deactivation</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">Select destination for each item type:</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tests ({unit?.tests || 0})
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select lab unit...</option>
                  <option value="hema">Hematology</option>
                  <option value="micro">Microbiology</option>
                  <option value="immu">Immunology/Serology</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Panels ({unit?.panels || 0})
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select lab unit...</option>
                  <option value="hema">Hematology</option>
                  <option value="micro">Microbiology</option>
                  <option value="immu">Immunology/Serology</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Programs ({unit?.programs || 0})
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select lab unit...</option>
                  <option value="hema">Hematology</option>
                  <option value="micro">Microbiology</option>
                  <option value="immu">Immunology/Serology</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projects ({unit?.projects || 0})
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select lab unit...</option>
                  <option value="hema">Hematology</option>
                  <option value="micro">Microbiology</option>
                  <option value="immu">Immunology/Serology</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button 
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Reassign and Deactivate
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-semibold">Confirm Bulk Deactivation</h3>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">This will deactivate:</p>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-gray-700">
                  <X size={16} className="text-red-500" />
                  {unit?.name} lab unit
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <X size={16} className="text-red-500" />
                  {unit?.tests || 0} tests (will not appear in order entry)
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <X size={16} className="text-red-500" />
                  {unit?.panels || 0} panels (will not appear in order entry)
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <X size={16} className="text-red-500" />
                  {unit?.programs || 0} programs (patients can still be enrolled)
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <X size={16} className="text-red-500" />
                  {unit?.projects || 0} projects (existing samples preserved)
                </li>
              </ul>

              <p className="text-sm text-gray-500 mb-4">
                This action can be reversed by reactivating the lab unit and its items individually.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type "DEACTIVATE" to confirm:
                </label>
                <input 
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="DEACTIVATE"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button 
                onClick={onConfirm}
                disabled={confirmText !== 'DEACTIVATE'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deactivate All
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deactivation</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="text-blue-600" size={20} />
                <div>
                  <p className="text-blue-800">
                    <strong>{unit?.name}</strong> will be deactivated.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    All {unit?.tests} tests, {unit?.panels} panels, {unit?.programs} programs, and {unit?.projects} projects will remain assigned but the lab unit will be hidden from order entry.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button 
                onClick={onConfirm}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md"
              >
                Deactivate Lab Unit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// WORKFLOWS TAB
// ============================================

const WorkflowsTab = () => {
  const assignedWorkflows = [
    { id: 1, name: 'Dual Entry with Supervisor Review', type: 'Result Entry', isDefault: true },
    { id: 2, name: 'Auto-Verification for Normal Results', type: 'Validation', isDefault: false },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assigned Workflows</h2>
            <p className="text-sm text-gray-500">Workflows control result entry and validation processes</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
            <Plus size={18} />
            Assign Workflow
          </button>
        </div>

        {assignedWorkflows.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Workflow</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Default</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedWorkflows.map((workflow) => (
                <tr key={workflow.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{workflow.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {workflow.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {workflow.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-teal-600">
                        <CheckCircle size={16} />
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
            <GitBranch size={32} className="mx-auto mb-2 opacity-50" />
            <p>No workflows assigned</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// TESTS TAB
// ============================================

const TestsTab = ({ unit }) => {
  const [selectedTests, setSelectedTests] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  const assignedTests = [
    { id: 1, name: 'Glucose, Fasting', code: 'GLU', loinc: '1558-6', isActive: true, isPrimary: true },
    { id: 2, name: 'HbA1c', code: 'HBA1C', loinc: '4548-4', isActive: true, isPrimary: true },
    { id: 3, name: 'Cholesterol, Total', code: 'CHOL', loinc: '2093-3', isActive: true, isPrimary: true },
    { id: 4, name: 'Triglycerides', code: 'TRIG', loinc: '2571-8', isActive: true, isPrimary: true },
    { id: 5, name: 'HDL Cholesterol', code: 'HDL', loinc: '2085-9', isActive: true, isPrimary: false },
    { id: 6, name: 'LDL Cholesterol', code: 'LDL', loinc: '2089-1', isActive: false, isPrimary: true },
  ];

  const toggleTest = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const toggleAll = () => {
    if (selectedTests.length === assignedTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(assignedTests.map(t => t.id));
    }
  };

  const activeCount = assignedTests.filter(t => t.isActive).length;
  const inactiveCount = assignedTests.filter(t => !t.isActive).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assigned Tests</h2>
            <p className="text-sm text-gray-500">
              {assignedTests.length} tests assigned ({activeCount} active, {inactiveCount} inactive)
            </p>
          </div>
          <button 
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
          >
            <Plus size={18} />
            Assign Tests
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedTests.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <span className="text-sm font-medium text-blue-800">{selectedTests.length} selected</span>
            <div className="flex-1" />
            <button 
              onClick={() => setShowReassignModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 rounded"
            >
              <RefreshCw size={14} />
              Reassign
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 rounded">
              <Eye size={14} />
              Activate
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 rounded">
              <EyeOff size={14} />
              Deactivate
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
              <Trash2 size={14} />
              Remove
            </button>
          </div>
        )}

        {/* Tests Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <input 
                  type="checkbox"
                  checked={selectedTests.length === assignedTests.length}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Test Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Code</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">LOINC</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Primary</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignedTests.map((test) => (
              <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input 
                    type="checkbox"
                    checked={selectedTests.includes(test.id)}
                    onChange={() => toggleTest(test.id)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900">{test.name}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-gray-600">{test.code}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-gray-600">{test.loinc}</span>
                </td>
                <td className="py-3 px-4">
                  {test.isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {test.isPrimary ? (
                    <CheckCircle size={16} className="text-teal-600" />
                  ) : (
                    <button className="text-xs text-gray-500 hover:text-teal-600">Set primary</button>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <ReassignTestsModal 
          tests={assignedTests.filter(t => selectedTests.includes(t.id))}
          sourceUnit={unit}
          onClose={() => setShowReassignModal(false)}
        />
      )}
    </div>
  );
};

// ============================================
// REASSIGN TESTS MODAL
// ============================================

const ReassignTestsModal = ({ tests, sourceUnit, onClose }) => {
  const [keepReference, setKeepReference] = useState(true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Reassign {tests.length} Tests</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-600 mb-4">
            You are about to reassign {tests.length} tests from: <strong>{sourceUnit?.name}</strong>
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select destination lab unit:
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
              <option value="">Select lab unit...</option>
              <option value="hema">Hematology</option>
              <option value="micro">Microbiology</option>
              <option value="immu">Immunology/Serology</option>
              <option value="mol">Molecular Biology</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input 
              type="checkbox"
              checked={keepReference}
              onChange={(e) => setKeepReference(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Keep reference to original unit (secondary assignment)</span>
          </label>

          <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-xs font-medium text-gray-500 mb-2">Tests to reassign:</p>
            <ul className="space-y-1">
              {tests.map(test => (
                <li key={test.id} className="text-sm text-gray-700">
                  â€¢ {test.name} ({test.code})
                </li>
              ))}
            </ul>
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
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md"
          >
            Reassign Tests
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PANELS TAB
// ============================================

const PanelsTab = () => {
  const assignedPanels = [
    { id: 1, name: 'Basic Metabolic Panel', code: 'BMP', testCount: 8, isActive: true },
    { id: 2, name: 'Comprehensive Metabolic Panel', code: 'CMP', testCount: 14, isActive: true },
    { id: 3, name: 'Lipid Panel', code: 'LIPID', testCount: 4, isActive: true },
    { id: 4, name: 'Liver Function Tests', code: 'LFT', testCount: 7, isActive: false },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assigned Panels</h2>
            <p className="text-sm text-gray-500">{assignedPanels.length} panels assigned</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
            <Plus size={18} />
            Assign Panels
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Panel Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Code</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tests</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignedPanels.map((panel) => (
              <tr key={panel.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900">{panel.name}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-gray-600">{panel.code}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-600">{panel.testCount} tests</span>
                </td>
                <td className="py-3 px-4">
                  {panel.isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button className="text-teal-600 hover:text-teal-800 text-sm">View Tests</button>
                  <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// PROGRAMS TAB
// ============================================

const ProgramsTab = () => {
  const assignedPrograms = [
    { id: 1, name: 'HIV Program', code: 'HIV', orderForm: 'HIV Order Entry Form', patients: 1245, isActive: true },
    { id: 2, name: 'Diabetes Management', code: 'DM', orderForm: 'Diabetes Panel Form', patients: 892, isActive: true },
    { id: 3, name: 'TB Program', code: 'TB', orderForm: 'TB Screening Form', patients: 456, isActive: true },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assigned Programs</h2>
            <p className="text-sm text-gray-500">Clinical programs with custom order entry forms</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
            <Plus size={18} />
            Assign Program
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Program</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Code</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order Entry Form</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Active Patients</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignedPrograms.map((program) => (
              <tr key={program.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900">{program.name}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-gray-600">{program.code}</span>
                </td>
                <td className="py-3 px-4">
                  <a href="#" className="text-teal-600 hover:text-teal-800 text-sm">{program.orderForm}</a>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-600">{program.patients.toLocaleString()}</span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button className="text-teal-600 hover:text-teal-800 text-sm">Configure</button>
                  <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// PROJECTS TAB
// ============================================

const ProjectsTab = () => {
  const assignedProjects = [
    { id: 1, name: 'COVID-19 Surveillance Study', code: 'COV-SURV', pi: 'Dr. Smith', status: 'Active', samples: 2456, dateRange: 'Jan 2024 - Dec 2025' },
    { id: 2, name: 'Antimicrobial Resistance Monitoring', code: 'AMR-MON', pi: 'Dr. Johnson', status: 'Active', samples: 1823, dateRange: 'Mar 2024 - Mar 2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assigned Projects</h2>
            <p className="text-sm text-gray-500">Lab notebook projects with custom order entry screens</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
            <Plus size={18} />
            Assign Project
          </button>
        </div>

        {assignedProjects.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Project</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">PI</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Samples</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date Range</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedProjects.map((project) => (
                <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-medium text-gray-900">{project.name}</span>
                      <p className="text-xs font-mono text-gray-500">{project.code}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">{project.pi}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">{project.samples.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-500">{project.dateRange}</span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button className="text-teal-600 hover:text-teal-800 text-sm">View Details</button>
                    <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FolderKanban size={32} className="mx-auto mb-2 opacity-50" />
            <p>No projects assigned</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// IMPORT/EXPORT TAB
// ============================================

const ImportExportTab = () => {
  const [exportOption, setExportOption] = useState('config-only');

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Configuration</h2>
            <p className="text-sm text-gray-500">Download lab unit configuration as JSON or CSV</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What to export:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="export-option" 
                  value="config-only"
                  checked={exportOption === 'config-only'}
                  onChange={() => setExportOption('config-only')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Lab unit configuration only</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="export-option" 
                  value="with-tests"
                  checked={exportOption === 'with-tests'}
                  onChange={() => setExportOption('with-tests')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Lab unit + test assignments</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="export-option" 
                  value="full"
                  checked={exportOption === 'full'}
                  onChange={() => setExportOption('full')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Lab unit + all assignments (tests, panels, programs, projects, workflows)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
              <Download size={18} />
              Export as JSON
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium">
              <Download size={18} />
              Export as CSV
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Upload className="text-green-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Import Configuration</h2>
            <p className="text-sm text-gray-500">Upload lab unit configuration from JSON file</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer">
          <Upload className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600 mb-1">Drop JSON file here or click to browse</p>
          <p className="text-xs text-gray-500">Supports .json files exported from OpenELIS</p>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Import mode:</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option value="create">Create new lab units only</option>
            <option value="update">Update existing (match by code)</option>
            <option value="both">Create new + update existing</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================

export default function LabUnitsApp() {
  const [view, setView] = useState('list');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [initialTab, setInitialTab] = useState('basic');

  if (view === 'edit') {
    return (
      <LabUnitEditor 
        unit={selectedUnit}
        initialTab={initialTab}
        onBack={() => {
          setView('list');
          setSelectedUnit(null);
          setInitialTab('basic');
        }}
      />
    );
  }

  return (
    <LabUnitsList 
      onSelectUnit={setSelectedUnit}
      onEditUnit={(unit, tab = 'basic') => {
        setSelectedUnit(unit);
        setInitialTab(tab);
        setView('edit');
      }}
    />
  );
}
