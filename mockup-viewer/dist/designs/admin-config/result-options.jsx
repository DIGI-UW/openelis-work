import React, { useState } from 'react';
import { 
  Search, Plus, Edit, Trash2, ChevronDown, ChevronRight, 
  X, Check, AlertTriangle, Star, GripVertical, Eye, EyeOff, 
  AlertCircle, CheckCircle, MoreVertical, Copy, ArrowUpDown,
  Beaker, Link, Globe, User, ChevronLeft, ExternalLink
} from 'lucide-react';

// ============================================
// RESULT OPTIONS LIST VIEW
// ============================================

const ResultOptionsList = ({ onEditOption, onManageFavorites }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState('displayValue');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('options'); // 'options' or 'favorites'

  const resultOptions = [
    { id: 1, displayValue: 'Positive', code: 'POS', conceptId: 'CONCEPT-001', isActive: true, usedBy: 47, dictionaries: ['SNOMED', 'LOINC'] },
    { id: 2, displayValue: 'Negative', code: 'NEG', conceptId: 'CONCEPT-002', isActive: true, usedBy: 52, dictionaries: ['SNOMED', 'LOINC'] },
    { id: 3, displayValue: 'Indeterminate', code: 'IND', conceptId: 'CONCEPT-003', isActive: true, usedBy: 38, dictionaries: ['SNOMED'] },
    { id: 4, displayValue: 'Reactive', code: 'REAC', conceptId: 'CONCEPT-004', isActive: true, usedBy: 23, dictionaries: ['SNOMED', 'LOINC'] },
    { id: 5, displayValue: 'Non-Reactive', code: 'NREAC', conceptId: 'CONCEPT-005', isActive: true, usedBy: 23, dictionaries: ['SNOMED', 'LOINC'] },
    { id: 6, displayValue: 'Borderline', code: 'BDL', conceptId: 'CONCEPT-006', isActive: true, usedBy: 12, dictionaries: ['SNOMED'] },
    { id: 7, displayValue: 'Detected', code: 'DET', conceptId: 'CONCEPT-007', isActive: true, usedBy: 31, dictionaries: ['SNOMED', 'LOINC'] },
    { id: 8, displayValue: 'Not Detected', code: 'NDET', conceptId: 'CONCEPT-008', isActive: true, usedBy: 31, dictionaries: ['SNOMED', 'LOINC'] },
    { id: 9, displayValue: 'Equivocal', code: 'EQV', conceptId: 'CONCEPT-009', isActive: true, usedBy: 8, dictionaries: ['SNOMED'] },
    { id: 10, displayValue: 'Type A', code: 'BT-A', conceptId: 'CONCEPT-010', isActive: true, usedBy: 4, dictionaries: ['SNOMED'] },
    { id: 11, displayValue: 'Type B', code: 'BT-B', conceptId: 'CONCEPT-011', isActive: true, usedBy: 4, dictionaries: ['SNOMED'] },
    { id: 12, displayValue: 'Type AB', code: 'BT-AB', conceptId: 'CONCEPT-012', isActive: true, usedBy: 4, dictionaries: ['SNOMED'] },
    { id: 13, displayValue: 'Type O', code: 'BT-O', conceptId: 'CONCEPT-013', isActive: true, usedBy: 4, dictionaries: ['SNOMED'] },
    { id: 14, displayValue: 'Rh Positive', code: 'RH-POS', conceptId: 'CONCEPT-014', isActive: true, usedBy: 3, dictionaries: ['SNOMED'] },
    { id: 15, displayValue: 'Rh Negative', code: 'RH-NEG', conceptId: 'CONCEPT-015', isActive: true, usedBy: 3, dictionaries: ['SNOMED'] },
    { id: 16, displayValue: 'Susceptible', code: 'S', conceptId: 'CONCEPT-016', isActive: true, usedBy: 156, dictionaries: ['SNOMED', 'WHONET'] },
    { id: 17, displayValue: 'Intermediate', code: 'I', conceptId: 'CONCEPT-017', isActive: true, usedBy: 156, dictionaries: ['SNOMED', 'WHONET'] },
    { id: 18, displayValue: 'Resistant', code: 'R', conceptId: 'CONCEPT-018', isActive: true, usedBy: 156, dictionaries: ['SNOMED', 'WHONET'] },
    { id: 19, displayValue: 'Trace', code: 'TRC', conceptId: 'CONCEPT-019', isActive: true, usedBy: 15, dictionaries: ['SNOMED'] },
    { id: 20, displayValue: 'Moderate', code: 'MOD', conceptId: 'CONCEPT-020', isActive: true, usedBy: 8, dictionaries: ['SNOMED'] },
    { id: 21, displayValue: 'Large', code: 'LRG', conceptId: 'CONCEPT-021', isActive: true, usedBy: 8, dictionaries: ['SNOMED'] },
    { id: 22, displayValue: 'Small', code: 'SML', conceptId: 'CONCEPT-022', isActive: true, usedBy: 8, dictionaries: ['SNOMED'] },
    { id: 23, displayValue: 'Present', code: 'PRES', conceptId: 'CONCEPT-023', isActive: true, usedBy: 12, dictionaries: ['SNOMED'] },
    { id: 24, displayValue: 'Absent', code: 'ABS', conceptId: 'CONCEPT-024', isActive: true, usedBy: 12, dictionaries: ['SNOMED'] },
    { id: 25, displayValue: 'Invalid', code: 'INV', conceptId: 'CONCEPT-025', isActive: false, usedBy: 0, dictionaries: [] },
    { id: 26, displayValue: 'Inconclusive', code: 'INCL', conceptId: 'CONCEPT-026', isActive: false, usedBy: 2, dictionaries: ['SNOMED'] },
  ];

  // Filter
  const filteredOptions = resultOptions.filter(opt => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && opt.isActive) || 
      (statusFilter === 'inactive' && !opt.isActive);
    const matchesSearch = opt.displayValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Sort
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'usedBy') {
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
  const totalPages = Math.ceil(sortedOptions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOptions = sortedOptions.slice(startIndex, startIndex + pageSize);

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
            <h1 className="text-xl font-semibold text-gray-900">Result Options</h1>
            <p className="text-sm text-gray-500">Manage select list values for test results</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
          >
            <Plus size={18} />
            Add Result Option
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('options')}
            className={`py-3 border-b-2 font-medium text-sm ${
              activeTab === 'options' 
                ? 'border-teal-600 text-teal-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Options
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-3 border-b-2 font-medium text-sm ${
              activeTab === 'favorites' 
                ? 'border-teal-600 text-teal-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Favorite Sets
          </button>
        </div>
      </div>

      {activeTab === 'options' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by display value or code..."
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
                {filteredOptions.length} options
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
                      onClick={() => handleSort('displayValue')}
                    >
                      <div className="flex items-center gap-2">
                        Display Value
                        <SortIcon field="displayValue" />
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
                      onClick={() => handleSort('conceptId')}
                    >
                      <div className="flex items-center gap-2">
                        Concept ID
                        <SortIcon field="conceptId" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Dictionaries
                    </th>
                    <th 
                      className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                      onClick={() => handleSort('usedBy')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Used By
                        <SortIcon field="usedBy" />
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
                  {paginatedOptions.map((option) => (
                    <tr 
                      key={option.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onEditOption && onEditOption(option)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{option.displayValue}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-600">{option.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">{option.conceptId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {option.dictionaries.map(dict => (
                            <span key={dict} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {dict}
                            </span>
                          ))}
                          {option.dictionaries.length === 0 && (
                            <span className="text-xs text-gray-400 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">{option.usedBy} tests</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {option.isActive ? (
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
                            onClick={() => onEditOption && onEditOption(option)}
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
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredOptions.length)} of {filteredOptions.length} options
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
        </>
      ) : (
        <FavoriteSetsTab />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddResultOptionModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

// ============================================
// FAVORITE SETS TAB
// ============================================

const FavoriteSetsTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const globalFavorites = [
    { 
      id: 1, 
      name: 'Qualitative Standard', 
      description: 'Standard Pos/Neg/Ind for qualitative tests',
      options: ['Positive', 'Negative', 'Indeterminate'],
      isGlobal: true
    },
    { 
      id: 2, 
      name: 'Reactive/Non-Reactive', 
      description: 'For serology and immunoassay tests',
      options: ['Reactive', 'Non-Reactive', 'Borderline'],
      isGlobal: true
    },
    { 
      id: 3, 
      name: 'Detected/Not Detected', 
      description: 'For molecular and PCR tests',
      options: ['Detected', 'Not Detected'],
      isGlobal: true
    },
    { 
      id: 4, 
      name: 'Blood Type ABO', 
      description: 'ABO blood group typing',
      options: ['Type A', 'Type B', 'Type AB', 'Type O'],
      isGlobal: true
    },
    { 
      id: 5, 
      name: 'Antimicrobial Susceptibility', 
      description: 'S/I/R for AST results',
      options: ['Susceptible', 'Intermediate', 'Resistant'],
      isGlobal: true
    },
  ];

  const personalFavorites = [
    { 
      id: 101, 
      name: 'HIV Results', 
      description: 'My commonly used HIV result options',
      options: ['Reactive', 'Non-Reactive', 'Indeterminate', 'Invalid'],
      isGlobal: false
    },
    { 
      id: 102, 
      name: 'Urine Dipstick', 
      description: 'Semi-quantitative results',
      options: ['Negative', 'Trace', 'Small', 'Moderate', 'Large'],
      isGlobal: false
    },
  ];

  const FavoriteSetCard = ({ set }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {set.isGlobal ? (
              <Globe size={16} className="text-blue-500" />
            ) : (
              <User size={16} className="text-gray-400" />
            )}
            <h3 className="font-medium text-gray-900">{set.name}</h3>
          </div>
          {set.description && (
            <p className="text-sm text-gray-500 mt-1">{set.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-3">
            {set.options.slice(0, 4).map((opt, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {opt}
              </span>
            ))}
            {set.options.length > 4 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                +{set.options.length - 4} more
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <button className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded" title="Edit">
            <Edit size={16} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="More">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Global Favorites */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Global Favorites</h2>
              <span className="text-sm text-gray-500">({globalFavorites.length})</span>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-md"
            >
              <Plus size={16} />
              Add Global Set
            </button>
          </div>
          <div className="grid gap-3">
            {globalFavorites.map(set => (
              <FavoriteSetCard key={set.id} set={set} />
            ))}
          </div>
        </div>

        {/* Personal Favorites */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={20} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">My Favorites</h2>
              <span className="text-sm text-gray-500">({personalFavorites.length})</span>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-md"
            >
              <Plus size={16} />
              Add Personal Set
            </button>
          </div>
          <div className="grid gap-3">
            {personalFavorites.map(set => (
              <FavoriteSetCard key={set.id} set={set} />
            ))}
            {personalFavorites.length === 0 && (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                <Star size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No personal favorite sets yet</p>
                <p className="text-sm text-gray-400 mt-1">Create sets for quick access to your commonly used options</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateFavoriteSetModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

// ============================================
// ADD RESULT OPTION MODAL
// ============================================

const AddResultOptionModal = ({ onClose, existingOption }) => {
  const [displayValue, setDisplayValue] = useState(existingOption?.displayValue || '');
  const [code, setCode] = useState(existingOption?.code || '');
  const [conceptId, setConceptId] = useState(existingOption?.conceptId || '');
  const [isActive, setIsActive] = useState(existingOption?.isActive ?? true);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [mappings, setMappings] = useState([
    { id: 1, dictionaryType: 'SNOMED-CT', code: '', display: '', isPrimary: true }
  ]);

  // Simulated duplicate check
  const checkDuplicates = (value) => {
    const knownOptions = [
      { displayValue: 'Positive', code: 'POS', isActive: true, usedBy: 47 },
      { displayValue: 'Pos', code: 'P', isActive: false, usedBy: 0 },
      { displayValue: 'Negative', code: 'NEG', isActive: true, usedBy: 52 },
    ];

    const exactMatch = knownOptions.find(o => 
      o.displayValue.toLowerCase() === value.toLowerCase()
    );
    
    if (exactMatch) {
      return { type: 'exact', matches: [exactMatch] };
    }

    const fuzzyMatches = knownOptions.filter(o => {
      const similarity = calculateSimilarity(o.displayValue.toLowerCase(), value.toLowerCase());
      return similarity > 0.6 && similarity < 1;
    });

    if (fuzzyMatches.length > 0) {
      return { type: 'fuzzy', matches: fuzzyMatches };
    }

    return null;
  };

  const calculateSimilarity = (a, b) => {
    if (a.includes(b) || b.includes(a)) return 0.8;
    // Simple length-based similarity for demo
    const maxLen = Math.max(a.length, b.length);
    const minLen = Math.min(a.length, b.length);
    return minLen / maxLen;
  };

  const handleDisplayValueChange = (value) => {
    setDisplayValue(value);
    setConfirmed(false);
    if (value.length >= 2) {
      const warning = checkDuplicates(value);
      setDuplicateWarning(warning);
    } else {
      setDuplicateWarning(null);
    }
  };

  const addMapping = () => {
    setMappings([...mappings, { 
      id: Date.now(), 
      dictionaryType: 'LOINC', 
      code: '', 
      display: '', 
      isPrimary: false 
    }]);
  };

  const removeMapping = (id) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  const canSave = displayValue && code && (!duplicateWarning || confirmed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {existingOption ? 'Edit Result Option' : 'Add Result Option'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Value <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayValue}
                onChange={(e) => handleDisplayValueChange(e.target.value)}
                placeholder="e.g., Positive"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., POS"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concept ID
              </label>
              <input
                type="text"
                value={conceptId}
                onChange={(e) => setConceptId(e.target.value)}
                placeholder="e.g., CONCEPT-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex items-center gap-3 h-[42px]">
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isActive ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isActive ? 'left-6' : 'left-1'
                  }`} />
                </button>
                <span className="text-sm text-gray-600">{isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-500 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-800">
                    {duplicateWarning.type === 'exact' 
                      ? 'This option already exists' 
                      : 'Similar options found'}
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    {duplicateWarning.type === 'exact'
                      ? 'An option with this exact name already exists. Please use the existing option.'
                      : 'We found options that may be duplicates:'}
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    {duplicateWarning.matches.map((match, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-md border border-amber-200 p-3">
                        <div>
                          <span className="font-medium text-gray-900">"{match.displayValue}"</span>
                          <span className="text-gray-500 ml-2">({match.code})</span>
                          {!match.isActive && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                          )}
                          {match.usedBy > 0 && (
                            <span className="text-sm text-gray-500 ml-2">â€¢ Used by {match.usedBy} tests</span>
                          )}
                        </div>
                        {!match.isActive && (
                          <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                            Reactivate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {duplicateWarning.type === 'fuzzy' && (
                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm text-amber-800">
                        I confirm this is a new, distinct concept
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dictionary Mappings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Dictionary Mappings
              </label>
              <button 
                onClick={addMapping}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                + Add Mapping
              </button>
            </div>
            
            <div className="space-y-2">
              {mappings.map((mapping, index) => (
                <div key={mapping.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <select 
                    value={mapping.dictionaryType}
                    onChange={(e) => {
                      const updated = [...mappings];
                      updated[index].dictionaryType = e.target.value;
                      setMappings(updated);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option>SNOMED-CT</option>
                    <option>LOINC</option>
                    <option>HL7</option>
                    <option>Custom</option>
                  </select>
                  <input
                    type="text"
                    value={mapping.code}
                    onChange={(e) => {
                      const updated = [...mappings];
                      updated[index].code = e.target.value;
                      setMappings(updated);
                    }}
                    placeholder="Dictionary Code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  />
                  <input
                    type="text"
                    value={mapping.display}
                    onChange={(e) => {
                      const updated = [...mappings];
                      updated[index].display = e.target.value;
                      setMappings(updated);
                    }}
                    placeholder="Display (optional)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <label className="flex items-center gap-1 text-sm text-gray-500 whitespace-nowrap">
                    <input
                      type="radio"
                      name="primaryMapping"
                      checked={mapping.isPrimary}
                      onChange={() => {
                        const updated = mappings.map(m => ({ ...m, isPrimary: m.id === mapping.id }));
                        setMappings(updated);
                      }}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    Primary
                  </label>
                  {mappings.length > 1 && (
                    <button 
                      onClick={() => removeMapping(mapping.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
          >
            Cancel
          </button>
          <button 
            disabled={!canSave}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {existingOption ? 'Save Changes' : 'Create Option'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CREATE FAVORITE SET MODAL
// ============================================

const CreateFavoriteSetModal = ({ onClose, existingSet }) => {
  const [name, setName] = useState(existingSet?.name || '');
  const [description, setDescription] = useState(existingSet?.description || '');
  const [isGlobal, setIsGlobal] = useState(existingSet?.isGlobal || false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOptions, setSelectedOptions] = useState(existingSet?.options || []);

  const allOptions = [
    { id: 1, displayValue: 'Positive', code: 'POS' },
    { id: 2, displayValue: 'Negative', code: 'NEG' },
    { id: 3, displayValue: 'Indeterminate', code: 'IND' },
    { id: 4, displayValue: 'Reactive', code: 'REAC' },
    { id: 5, displayValue: 'Non-Reactive', code: 'NREAC' },
    { id: 6, displayValue: 'Detected', code: 'DET' },
    { id: 7, displayValue: 'Not Detected', code: 'NDET' },
    { id: 8, displayValue: 'Susceptible', code: 'S' },
    { id: 9, displayValue: 'Intermediate', code: 'I' },
    { id: 10, displayValue: 'Resistant', code: 'R' },
  ];

  const filteredOptions = allOptions.filter(o =>
    o.displayValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOption = (option) => {
    const exists = selectedOptions.find(o => o.id === option.id);
    if (exists) {
      setSelectedOptions(selectedOptions.filter(o => o.id !== option.id));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const moveOption = (index, direction) => {
    const newOptions = [...selectedOptions];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOptions.length) return;
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    setSelectedOptions(newOptions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {existingSet ? 'Edit Favorite Set' : 'Create Favorite Set'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Set Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Qualitative Standard"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsGlobal(!isGlobal)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isGlobal ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isGlobal ? 'left-6' : 'left-1'
                }`} />
              </button>
              <div>
                <span className="text-sm font-medium text-gray-700">Global Favorite</span>
                <p className="text-xs text-gray-500">Make available to all users (admin only)</p>
              </div>
            </div>
          </div>

          {/* Options Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* Available Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Options
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                {filteredOptions.map(option => {
                  const isSelected = selectedOptions.some(o => o.id === option.id);
                  return (
                    <div
                      key={option.id}
                      onClick={() => toggleOption(option)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-gray-100 last:border-0 ${
                        isSelected ? 'bg-teal-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-900">{option.displayValue}</span>
                      <span className="text-xs font-mono text-gray-500">{option.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Options (ordered) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Options ({selectedOptions.length})
              </label>
              <div className="border border-gray-200 rounded-md min-h-[280px]">
                {selectedOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Star size={24} className="mb-2" />
                    <p className="text-sm">Select options from the left</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {selectedOptions.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2 px-3 py-2">
                        <GripVertical size={16} className="text-gray-300" />
                        <span className="w-6 text-center text-xs text-gray-400">{index + 1}</span>
                        <span className="flex-1 text-sm text-gray-900">{option.displayValue}</span>
                        <span className="text-xs font-mono text-gray-500">{option.code}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => moveOption(index, -1)}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronLeft size={14} className="rotate-90" />
                          </button>
                          <button 
                            onClick={() => moveOption(index, 1)}
                            disabled={index === selectedOptions.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronRight size={14} className="rotate-90" />
                          </button>
                          <button 
                            onClick={() => toggleOption(option)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
          >
            Cancel
          </button>
          <button 
            disabled={!name || selectedOptions.length === 0}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {existingSet ? 'Save Changes' : 'Create Set'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TEST EDITOR INTEGRATION - RESULT OPTIONS SECTION
// ============================================

const TestEditorResultOptions = () => {
  const [options, setOptions] = useState([
    { id: 1, displayValue: 'Reactive', code: 'REAC', order: 1 },
    { id: 2, displayValue: 'Non-Reactive', code: 'NREAC', order: 2 },
    { id: 3, displayValue: 'Indeterminate', code: 'IND', order: 3 },
  ]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const globalFavorites = [
    { id: 1, name: 'Qualitative Standard', options: ['Positive', 'Negative', 'Indeterminate'] },
    { id: 2, name: 'Blood Type ABO', options: ['Type A', 'Type B', 'Type AB', 'Type O'] },
    { id: 3, name: 'Reactive/Non-Reactive', options: ['Reactive', 'Non-Reactive', 'Borderline'] },
  ];

  const personalFavorites = [
    { id: 101, name: 'HIV Results', options: ['Reactive', 'Non-Reactive', 'Indeterminate'] },
  ];

  const removeOption = (optionId) => {
    setOptions(options.filter(o => o.id !== optionId));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">Result Options</h3>
          <span className="text-sm text-gray-500">{options.length} options</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Options Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
            >
              <Plus size={16} />
              Add Options
              <ChevronDown size={14} />
            </button>
            
            {showAddDropdown && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-2">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">
                    Global Favorites
                  </div>
                  {globalFavorites.map(fav => (
                    <button 
                      key={fav.id}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Star size={14} className="text-blue-500" />
                      <span>{fav.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{fav.options.length}</span>
                    </button>
                  ))}
                  
                  <div className="border-t border-gray-100 my-1" />
                  
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">
                    My Favorites
                  </div>
                  {personalFavorites.map(fav => (
                    <button 
                      key={fav.id}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Star size={14} className="text-gray-400" />
                      <span>{fav.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{fav.options.length}</span>
                    </button>
                  ))}
                  
                  <div className="border-t border-gray-100 my-1" />
                  
                  <button 
                    onClick={() => { setShowAddDropdown(false); setShowSearchModal(true); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Search size={14} className="text-gray-400" />
                    <span>Search All Options...</span>
                  </button>
                  <button 
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-teal-600"
                  >
                    <Plus size={14} />
                    <span>Create New Option...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowCopyModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Copy size={16} />
            Copy from Test
          </button>
          
          <button 
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Star size={16} />
            Save as Favorite
          </button>
        </div>
      </div>

      {/* Options Table */}
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-10 px-2 py-2"></th>
            <th className="w-14 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Display Value</th>
            <th className="w-24 px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
            <th className="w-16 px-2 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {options.map((option, index) => (
            <tr key={option.id} className="hover:bg-gray-50">
              <td className="px-2 py-2 text-center">
                <GripVertical size={16} className="text-gray-300 cursor-grab mx-auto" />
              </td>
              <td className="px-2 py-2">
                <input
                  type="number"
                  value={option.order}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[index].order = parseInt(e.target.value) || 0;
                    setOptions(updated);
                  }}
                  className="w-12 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </td>
              <td className="px-4 py-2">
                <span className="font-medium text-gray-900">{option.displayValue}</span>
              </td>
              <td className="px-4 py-2">
                <span className="font-mono text-sm text-gray-600">{option.code}</span>
              </td>
              <td className="px-2 py-2 text-center">
                <button 
                  onClick={() => removeOption(option.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <X size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {options.length === 0 && (
        <div className="py-12 text-center text-gray-400">
          <Beaker size={32} className="mx-auto mb-2" />
          <p>No result options configured</p>
          <p className="text-sm mt-1">Add options from favorites or search all available options</p>
        </div>
      )}

      {/* Copy from Test Modal */}
      {showCopyModal && (
        <CopyFromTestModal onClose={() => setShowCopyModal(false)} />
      )}

      {/* Search All Options Modal */}
      {showSearchModal && (
        <SearchOptionsModal onClose={() => setShowSearchModal(false)} />
      )}

      {/* Save as Favorite Modal */}
      {showSaveModal && (
        <SaveAsFavoriteModal 
          options={options} 
          onClose={() => setShowSaveModal(false)} 
        />
      )}
    </div>
  );
};

// ============================================
// COPY FROM TEST MODAL
// ============================================

const CopyFromTestModal = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);

  const tests = [
    { id: 1, name: 'HIV 1/2 Antibody', code: 'HIV-AB', labUnit: 'Immunology', options: ['Reactive', 'Non-Reactive', 'Indeterminate'] },
    { id: 2, name: 'Hepatitis B Surface Antigen', code: 'HBsAg', labUnit: 'Immunology', options: ['Reactive', 'Non-Reactive'] },
    { id: 3, name: 'RPR', code: 'RPR', labUnit: 'Serology', options: ['Reactive', 'Non-Reactive', 'Weakly Reactive'] },
    { id: 4, name: 'ABO Blood Type', code: 'ABO', labUnit: 'Blood Bank', options: ['Type A', 'Type B', 'Type AB', 'Type O'] },
    { id: 5, name: 'Malaria Smear', code: 'MAL-SM', labUnit: 'Parasitology', options: ['Positive', 'Negative'] },
  ];

  const filteredTests = tests.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Copy from Test</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests by name or code..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredTests.map(test => (
            <div
              key={test.id}
              onClick={() => setSelectedTest(test)}
              className={`px-6 py-3 cursor-pointer border-b border-gray-100 ${
                selectedTest?.id === test.id ? 'bg-teal-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{test.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({test.code})</span>
                </div>
                <span className="text-xs text-gray-400">{test.labUnit}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {test.options.map((opt, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          {selectedTest && (
            <span className="text-sm text-gray-500">
              Will copy {selectedTest.options.length} options from "{selectedTest.name}"
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
            >
              Cancel
            </button>
            <button 
              disabled={!selectedTest}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copy Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SEARCH OPTIONS MODAL
// ============================================

const SearchOptionsModal = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);

  const allOptions = [
    { id: 1, displayValue: 'Positive', code: 'POS', usedBy: 47, alreadyAdded: false },
    { id: 2, displayValue: 'Negative', code: 'NEG', usedBy: 52, alreadyAdded: false },
    { id: 3, displayValue: 'Indeterminate', code: 'IND', usedBy: 38, alreadyAdded: true },
    { id: 4, displayValue: 'Reactive', code: 'REAC', usedBy: 23, alreadyAdded: true },
    { id: 5, displayValue: 'Non-Reactive', code: 'NREAC', usedBy: 23, alreadyAdded: true },
    { id: 6, displayValue: 'Detected', code: 'DET', usedBy: 31, alreadyAdded: false },
    { id: 7, displayValue: 'Not Detected', code: 'NDET', usedBy: 31, alreadyAdded: false },
  ];

  const filteredOptions = allOptions.filter(o =>
    o.displayValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOption = (option) => {
    if (option.alreadyAdded) return;
    const exists = selectedOptions.find(o => o.id === option.id);
    if (exists) {
      setSelectedOptions(selectedOptions.filter(o => o.id !== option.id));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add Result Options</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by display value or code..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredOptions.map(option => {
            const isSelected = selectedOptions.some(o => o.id === option.id);
            return (
              <div
                key={option.id}
                onClick={() => toggleOption(option)}
                className={`px-6 py-3 cursor-pointer border-b border-gray-100 flex items-center gap-3 ${
                  option.alreadyAdded 
                    ? 'bg-gray-50 cursor-not-allowed' 
                    : isSelected 
                      ? 'bg-teal-50' 
                      : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={option.alreadyAdded}
                  onChange={() => {}}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50"
                />
                <div className="flex-1">
                  <span className={`font-medium ${option.alreadyAdded ? 'text-gray-400' : 'text-gray-900'}`}>
                    {option.displayValue}
                  </span>
                  <span className={`text-sm ml-2 ${option.alreadyAdded ? 'text-gray-400' : 'text-gray-500'}`}>
                    ({option.code})
                  </span>
                </div>
                {option.alreadyAdded ? (
                  <span className="text-xs text-gray-400">Already added</span>
                ) : (
                  <span className="text-xs text-gray-400">{option.usedBy} tests</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {selectedOptions.length} selected
          </span>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
            >
              Cancel
            </button>
            <button 
              disabled={selectedOptions.length === 0}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SAVE AS FAVORITE MODAL
// ============================================

const SaveAsFavoriteModal = ({ options, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Save as Favorite</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My HIV Results"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGlobal(!isGlobal)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isGlobal ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isGlobal ? 'left-6' : 'left-1'
              }`} />
            </button>
            <div>
              <span className="text-sm font-medium text-gray-700">Global Favorite</span>
              <p className="text-xs text-gray-500">Make available to all users</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm text-gray-500 mb-2">Options to save ({options.length}):</p>
            <div className="flex flex-wrap gap-1">
              {options.map((opt, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                  {opt.displayValue}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
          >
            Cancel
          </button>
          <button 
            disabled={!name}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Favorite
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

export default function ResultOptionsApp() {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'editor'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo Navigation */}
      <div className="bg-gray-800 text-white px-6 py-2">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Result Options Mockup Demo</span>
          <div className="flex gap-2 ml-8">
            <button
              onClick={() => setCurrentView('list')}
              className={`px-3 py-1 rounded text-sm ${currentView === 'list' ? 'bg-teal-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Admin List View
            </button>
            <button
              onClick={() => setCurrentView('editor')}
              className={`px-3 py-1 rounded text-sm ${currentView === 'editor' ? 'bg-teal-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Test Editor Integration
            </button>
          </div>
        </div>
      </div>

      {currentView === 'list' ? (
        <ResultOptionsList />
      ) : (
        <div className="p-6 max-w-5xl mx-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Test Editor - Results Tab</h2>
            <p className="text-sm text-gray-500">Result Options section when test result type is "Select List"</p>
          </div>
          <TestEditorResultOptions />
        </div>
      )}
    </div>
  );
}
