import React, { useState } from 'react';
import { 
  Search, Plus, Edit, Trash2, ChevronDown, ChevronRight, 
  X, Check, AlertTriangle, GripVertical, Eye, EyeOff, 
  AlertCircle, CheckCircle, MoreVertical, Download, Upload,
  Folder, FolderOpen, FileText, ExternalLink, ArrowUpDown,
  Filter, RefreshCw, FileDown, FileUp, Info, ChevronLeft
} from 'lucide-react';

// ============================================
// DATA DICTIONARY MAIN PAGE
// ============================================

const DataDictionaryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [entrySearch, setEntrySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState('displayValue');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(['organisms']);

  // Sample categories with hierarchy
  const categories = [
    { id: 'all', name: 'All Categories', count: 744, isAll: true },
    { id: 'cg', name: 'Clinical General', code: 'CG', count: 89 },
    { id: 'rejection', name: 'Rejection Reasons', code: 'REJ', count: 24 },
    { id: 'sample-sources', name: 'Sample Sources', code: 'SRC', count: 45 },
    { 
      id: 'organisms', 
      name: 'Organisms', 
      code: 'ORG', 
      count: 156,
      children: [
        { id: 'org-bacteria', name: 'Bacteria', code: 'ORG-BAC', count: 98 },
        { id: 'org-viruses', name: 'Viruses', code: 'ORG-VIR', count: 32 },
        { id: 'org-parasites', name: 'Parasites', code: 'ORG-PAR', count: 26 },
      ]
    },
    { id: 'path-conc', name: 'Pathology - Conclusions', code: 'PATH-CONC', count: 18 },
    { id: 'path-req', name: 'Pathology - Pathologist Requests', code: 'PATH-REQ', count: 12 },
    { id: 'ihc-intensity', name: 'IHC Breast Cancer Report Intensity', code: 'IHC-INT', count: 6 },
    { id: 'ihc-cerb', name: 'IHC Breast Cancer Report CerbB2 Pattern', code: 'IHC-CERB', count: 5 },
    { id: 'ihc-mol', name: 'IHC Breast Cancer Report Molecular Subtype', code: 'IHC-MOL', count: 4 },
    { id: 'cyto-adeq', name: 'Cytology Specimen Adequacy - Satisfactory', code: 'CYTO-SAT', count: 8 },
    { id: 'stains', name: 'Stains', code: 'STAIN', count: 34 },
    { id: 'gram-results', name: 'Gram Stain Results', code: 'GRAM', count: 12 },
    { id: 'afb-results', name: 'AFB Smear Results', code: 'AFB', count: 8 },
    { id: 'blood-products', name: 'Blood Products', code: 'BP', count: 15 },
    { id: 'transfusion-reactions', name: 'Transfusion Reactions', code: 'TXN-RX', count: 22 },
  ];

  // Sample entries
  const allEntries = [
    { id: 1, categoryId: 'cg', displayValue: 'INFLUENZA VIRUS A RNA DETECTED', code: 'INFL-A-DET', localAbbr: '', loinc: '', snomed: '', isActive: true, usedIn: 3 },
    { id: 2, categoryId: 'cg', displayValue: 'INFLUENZA VIRUS A/H1 RNA DETECTED', code: 'INFL-A-H1', localAbbr: '', loinc: '', snomed: '', isActive: true, usedIn: 2 },
    { id: 3, categoryId: 'cg', displayValue: 'INFLUENZA VIRUS A/H5 RNA DETECTED', code: 'INFL-A-H5', localAbbr: '', loinc: '', snomed: '', isActive: true, usedIn: 1 },
    { id: 4, categoryId: 'cg', displayValue: 'INFLUENZA VIRUS A/H3 RNA DETECTED', code: 'INFL-A-H3', localAbbr: '', loinc: '', snomed: '', isActive: true, usedIn: 2 },
    { id: 5, categoryId: 'cg', displayValue: 'PRELIMINARY POSITIVE', code: 'PRELIM-POS', localAbbr: 'Prelim +', loinc: '', snomed: '', isActive: true, usedIn: 15 },
    { id: 6, categoryId: 'cg', displayValue: 'PRELIMINARY NEGATIVE', code: 'PRELIM-NEG', localAbbr: 'Prelim -', loinc: '', snomed: '', isActive: true, usedIn: 15 },
    { id: 7, categoryId: 'cg', displayValue: 'gram + rod', code: 'GRAM-P-ROD', localAbbr: '', loinc: '', snomed: '', isActive: false, usedIn: 0 },
    { id: 8, categoryId: 'cg', displayValue: 'gram - rod', code: 'GRAM-N-ROD', localAbbr: '', loinc: '', snomed: '', isActive: false, usedIn: 0 },
    { id: 9, categoryId: 'cg', displayValue: 'Bacillus species (not anthracis)', code: 'BAC-SP', localAbbr: '', loinc: '', snomed: '', isActive: true, usedIn: 4 },
    { id: 10, categoryId: 'cg', displayValue: 'Coded comments need to be added', code: 'CODED-TBD', localAbbr: '', loinc: '', snomed: '', isActive: true, usedIn: 0 },
    { id: 11, categoryId: 'rejection', displayValue: 'Hemolyzed specimen', code: 'REJ-HEM', localAbbr: 'Hemolyzed', loinc: '', snomed: '', isActive: true, usedIn: 45 },
    { id: 12, categoryId: 'rejection', displayValue: 'Insufficient quantity', code: 'REJ-QNS', localAbbr: 'QNS', loinc: '', snomed: '', isActive: true, usedIn: 67 },
    { id: 13, categoryId: 'rejection', displayValue: 'Improper container', code: 'REJ-CONT', localAbbr: '', loinc: '', snomed: '', isActive: true, usedIn: 23 },
    { id: 14, categoryId: 'rejection', displayValue: 'Clotted specimen', code: 'REJ-CLOT', localAbbr: 'Clotted', loinc: '', snomed: '', isActive: true, usedIn: 34 },
    { id: 15, categoryId: 'rejection', displayValue: 'Unlabeled specimen', code: 'REJ-UNLAB', localAbbr: 'No label', loinc: '', snomed: '', isActive: true, usedIn: 56 },
    { id: 16, categoryId: 'org-bacteria', displayValue: 'Escherichia coli', code: 'ECOLI', localAbbr: 'E. coli', loinc: '634-6', snomed: '112283007', isActive: true, usedIn: 89 },
    { id: 17, categoryId: 'org-bacteria', displayValue: 'Staphylococcus aureus', code: 'STAPH-AU', localAbbr: 'S. aureus', loinc: '634-6', snomed: '3092008', isActive: true, usedIn: 76 },
    { id: 18, categoryId: 'org-bacteria', displayValue: 'Klebsiella pneumoniae', code: 'KLEB-PN', localAbbr: 'K. pneumo', loinc: '', snomed: '56415008', isActive: true, usedIn: 45 },
    { id: 19, categoryId: 'stains', displayValue: 'Gram stain', code: 'GRAM', localAbbr: '', loinc: '664-3', snomed: '', isActive: true, usedIn: 120 },
    { id: 20, categoryId: 'stains', displayValue: 'Ziehl-Neelsen stain', code: 'ZN', localAbbr: 'ZN/AFB', loinc: '', snomed: '', isActive: true, usedIn: 45 },
    { id: 21, categoryId: 'stains', displayValue: 'India ink stain', code: 'INDIA-INK', localAbbr: '', loinc: '', snomed: '', isActive: true, usedIn: 12 },
    { id: 22, categoryId: 'stains', displayValue: 'Giemsa stain', code: 'GIEMSA', localAbbr: '', loinc: '', snomed: '', isActive: true, usedIn: 34 },
  ];

  // Filter entries based on selected category
  const getFilteredEntries = () => {
    let entries = allEntries;
    
    // Filter by category
    if (selectedCategory && selectedCategory.id !== 'all') {
      // Include child category entries if parent selected
      const categoryIds = [selectedCategory.id];
      if (selectedCategory.children) {
        selectedCategory.children.forEach(c => categoryIds.push(c.id));
      }
      entries = entries.filter(e => categoryIds.includes(e.categoryId));
    }
    
    // Filter by search
    if (entrySearch) {
      entries = entries.filter(e => 
        e.displayValue.toLowerCase().includes(entrySearch.toLowerCase()) ||
        e.code?.toLowerCase().includes(entrySearch.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter === 'active') {
      entries = entries.filter(e => e.isActive);
    } else if (statusFilter === 'inactive') {
      entries = entries.filter(e => !e.isActive);
    }
    
    return entries;
  };

  const filteredEntries = getFilteredEntries();

  // Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'usedIn') {
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
  const totalPages = Math.ceil(sortedEntries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + pageSize);

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

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter categories by search
  const filteredCategories = categories.filter(cat => {
    if (cat.isAll) return true;
    const matchesSearch = cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      cat.code?.toLowerCase().includes(categorySearch.toLowerCase());
    if (matchesSearch) return true;
    // Also check children
    if (cat.children) {
      return cat.children.some(child => 
        child.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        child.code?.toLowerCase().includes(categorySearch.toLowerCase())
      );
    }
    return false;
  });

  const getCategoryName = (categoryId) => {
    for (const cat of categories) {
      if (cat.id === categoryId) return cat.name;
      if (cat.children) {
        const child = cat.children.find(c => c.id === categoryId);
        if (child) return child.name;
      }
    }
    return categoryId;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Data Dictionary</h1>
            <p className="text-sm text-gray-500">Manage coded values and option lists</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Upload size={18} />
              Import
            </button>
            <button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Category Sidebar */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Categories</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Category List */}
          <div className="flex-1 overflow-y-auto">
            {filteredCategories.map(category => (
              <div key={category.id}>
                <div
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer border-l-3 ${
                    selectedCategory?.id === category.id 
                      ? 'bg-teal-50 border-l-teal-600 border-l-4' 
                      : 'hover:bg-gray-50 border-l-transparent border-l-4'
                  }`}
                >
                  {category.children ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(category.id); }}
                      className="p-0.5 hover:bg-gray-200 rounded"
                    >
                      {expandedCategories.includes(category.id) ? (
                        <ChevronDown size={14} className="text-gray-500" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-500" />
                      )}
                    </button>
                  ) : (
                    <div className="w-5" />
                  )}
                  
                  {category.isAll ? (
                    <Folder size={16} className="text-gray-400" />
                  ) : (
                    <FileText size={16} className="text-gray-400" />
                  )}
                  
                  <span className={`flex-1 text-sm truncate ${
                    selectedCategory?.id === category.id ? 'font-medium text-teal-700' : 'text-gray-700'
                  }`}>
                    {category.name}
                  </span>
                  
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory?.id === category.id 
                      ? 'bg-teal-200 text-teal-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {category.count}
                  </span>
                </div>

                {/* Child categories */}
                {category.children && expandedCategories.includes(category.id) && (
                  <div className="ml-4">
                    {category.children.map(child => (
                      <div
                        key={child.id}
                        onClick={() => {
                          setSelectedCategory(child);
                          setCurrentPage(1);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-l-2 ${
                          selectedCategory?.id === child.id 
                            ? 'bg-teal-50 border-l-teal-600' 
                            : 'hover:bg-gray-50 border-l-gray-200'
                        }`}
                      >
                        <div className="w-5" />
                        <FileText size={14} className="text-gray-400" />
                        <span className={`flex-1 text-sm truncate ${
                          selectedCategory?.id === child.id ? 'font-medium text-teal-700' : 'text-gray-600'
                        }`}>
                          {child.name}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          selectedCategory?.id === child.id 
                            ? 'bg-teal-200 text-teal-800' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {child.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Category Button */}
          <div className="p-4 border-t border-gray-200">
            <button 
              onClick={() => setShowAddCategoryModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-md border border-teal-200"
            >
              <Plus size={16} />
              Add Category
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedCategory ? (
            <>
              {/* Toolbar */}
              <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowAddEntryModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
                    >
                      <Plus size={18} />
                      Add Entry
                    </button>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search entries..."
                        value={entrySearch}
                        onChange={(e) => { setEntrySearch(e.target.value); setCurrentPage(1); }}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-64"
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
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {filteredEntries.length} entries
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
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28"
                          onClick={() => handleSort('localAbbr')}
                        >
                          <div className="flex items-center gap-2">
                            Local Abbr
                            <SortIcon field="localAbbr" />
                          </div>
                        </th>
                        {selectedCategory.isAll && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                            Category
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                          LOINC
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                          SNOMED
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                          onClick={() => handleSort('usedIn')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Used In
                            <SortIcon field="usedIn" />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedEntries.map((entry) => (
                        <tr 
                          key={entry.id} 
                          className={`hover:bg-gray-50 cursor-pointer ${!entry.isActive ? 'bg-gray-50' : ''}`}
                          onClick={() => { setSelectedEntry(entry); setShowAddEntryModal(true); }}
                        >
                          <td className="px-4 py-3">
                            <span className={`font-medium ${entry.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                              {entry.displayValue}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-gray-600">{entry.code || '-'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{entry.localAbbr || '-'}</span>
                          </td>
                          {selectedCategory.isAll && (
                            <td className="px-4 py-3">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {getCategoryName(entry.categoryId)}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-gray-500">{entry.loinc || '-'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-gray-500">{entry.snomed || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entry.usedIn > 0 ? (
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setSelectedEntry(entry);
                                  setShowUsageModal(true); 
                                }}
                                className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                              >
                                {entry.usedIn} tests
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entry.isActive ? (
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
                                onClick={() => { setSelectedEntry(entry); setShowAddEntryModal(true); }}
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
                  
                  {paginatedEntries.length === 0 && (
                    <div className="py-12 text-center text-gray-400">
                      <FileText size={32} className="mx-auto mb-2" />
                      <p>{entrySearch ? 'No entries match your search' : 'No entries in this category'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              <div className="bg-white border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredEntries.length)} of {filteredEntries.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Rows per page:</span>
                      <select 
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
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
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    <button 
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No category selected */
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Folder size={48} className="mx-auto mb-4" />
                <p className="text-lg">Select a category to view entries</p>
                <p className="text-sm mt-1">Choose from the sidebar or click "All Categories"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddEntryModal && (
        <AddEntryModal 
          entry={selectedEntry}
          category={selectedCategory}
          categories={categories}
          onClose={() => { setShowAddEntryModal(false); setSelectedEntry(null); }}
        />
      )}
      
      {showAddCategoryModal && (
        <AddCategoryModal 
          categories={categories}
          onClose={() => setShowAddCategoryModal(false)}
        />
      )}
      
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}
      
      {showExportModal && (
        <ExportModal 
          categories={categories}
          selectedCategory={selectedCategory}
          onClose={() => setShowExportModal(false)} 
        />
      )}
      
      {showUsageModal && selectedEntry && (
        <UsageModal 
          entry={selectedEntry}
          onClose={() => { setShowUsageModal(false); setSelectedEntry(null); }}
        />
      )}
    </div>
  );
};

// ============================================
// ADD/EDIT ENTRY MODAL
// ============================================

const AddEntryModal = ({ entry, category, categories, onClose }) => {
  const [categoryId, setCategoryId] = useState(entry?.categoryId || category?.id || '');
  const [displayValue, setDisplayValue] = useState(entry?.displayValue || '');
  const [code, setCode] = useState(entry?.code || '');
  const [localAbbr, setLocalAbbr] = useState(entry?.localAbbr || '');
  const [loincCode, setLoincCode] = useState(entry?.loinc || '');
  const [snomedCode, setSnomedCode] = useState(entry?.snomed || '');
  const [isActive, setIsActive] = useState(entry?.isActive ?? true);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // Flatten categories for dropdown
  const flatCategories = [];
  categories.forEach(cat => {
    if (!cat.isAll) {
      flatCategories.push(cat);
      if (cat.children) {
        cat.children.forEach(child => flatCategories.push({ ...child, parentName: cat.name }));
      }
    }
  });

  // Simulated duplicate check
  const checkDuplicates = (value) => {
    if (value.toLowerCase().includes('influenza')) {
      return {
        type: 'fuzzy',
        matches: [
          { displayValue: 'INFLUENZA VIRUS A RNA DETECTED', code: 'INFL-A-DET', isActive: true }
        ]
      };
    }
    return null;
  };

  const handleDisplayValueChange = (value) => {
    setDisplayValue(value);
    setConfirmed(false);
    if (value.length >= 3) {
      const warning = checkDuplicates(value);
      setDuplicateWarning(warning);
    } else {
      setDuplicateWarning(null);
    }
  };

  const canSave = categoryId && displayValue && (!duplicateWarning || confirmed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {entry ? 'Edit Dictionary Entry' : 'Add Dictionary Entry'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select category...</option>
              {flatCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentName ? `${cat.parentName} â†’ ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Display Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Value <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayValue}
              onChange={(e) => handleDisplayValueChange(e.target.value)}
              placeholder="e.g., INFLUENZA VIRUS A RNA DETECTED"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-500 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-800">Similar entries found</h4>
                  <div className="mt-2 space-y-2">
                    {duplicateWarning.matches.map((match, i) => (
                      <div key={i} className="bg-white rounded-md border border-amber-200 p-2">
                        <span className="font-medium text-gray-900">"{match.displayValue}"</span>
                        <span className="text-gray-500 ml-2">({match.code})</span>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-amber-800">I confirm this is a distinct entry</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Code and Local Abbreviation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., INFL-A-DET"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Abbreviation</label>
              <input
                type="text"
                value={localAbbr}
                onChange={(e) => setLocalAbbr(e.target.value)}
                placeholder="e.g., Infl A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* LOINC and SNOMED */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LOINC Code</label>
              <input
                type="text"
                value={loincCode}
                onChange={(e) => setLoincCode(e.target.value)}
                placeholder="e.g., 634-6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SNOMED Code</label>
              <input
                type="text"
                value={snomedCode}
                onChange={(e) => setSnomedCode(e.target.value)}
                placeholder="e.g., 112283007"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
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
            {entry ? 'Save Changes' : 'Add Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ADD CATEGORY MODAL
// ============================================

const AddCategoryModal = ({ categories, onClose }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Only top-level categories as parent options
  const parentOptions = categories.filter(c => !c.isAll && !c.children?.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add Category</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pathology - Gross Findings"
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
              placeholder="e.g., PATH-GROSS"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this category is used for..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">None (top-level category)</option>
              {parentOptions.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
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

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
          >
            Cancel
          </button>
          <button 
            disabled={!name || !code}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Category
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXPORT MODAL
// ============================================

const ExportModal = ({ categories, selectedCategory, onClose }) => {
  const [scope, setScope] = useState(selectedCategory && !selectedCategory.isAll ? 'selected' : 'all');
  const [selectedCategoryId, setSelectedCategoryId] = useState(selectedCategory?.id || '');
  const [format, setFormat] = useState('csv');
  const [includeInactive, setIncludeInactive] = useState(false);

  const flatCategories = [];
  categories.forEach(cat => {
    if (!cat.isAll) {
      flatCategories.push(cat);
      if (cat.children) {
        cat.children.forEach(child => flatCategories.push({ ...child, parentName: cat.name }));
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Export Dictionary</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Scope</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700">All Categories (744 entries)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="selected"
                  checked={scope === 'selected'}
                  onChange={() => setScope('selected')}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700">Selected Category:</span>
              </label>
              {scope === 'selected' && (
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="ml-7 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Choose category...</option>
                  {flatCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parentName ? `${cat.parentName} â†’ ${cat.name}` : cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Format</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700">CSV</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={() => setFormat('json')}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700">JSON</span>
              </label>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Options</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Include inactive entries</span>
            </label>
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
            disabled={scope === 'selected' && !selectedCategoryId}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// IMPORT MODAL
// ============================================

const ImportModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [importMode, setImportMode] = useState('both');
  const [createCategories, setCreateCategories] = useState(true);
  const [skipWarnings, setSkipWarnings] = useState(false);

  // Mock validation results
  const validationResults = {
    fileName: 'organisms.csv',
    totalEntries: 45,
    newEntries: 38,
    updateEntries: 5,
    warnings: [
      { entry: 'E. coli', similar: 'Escherichia coli', match: '85%' },
      { entry: 'Staph aureus', similar: 'Staphylococcus aureus', match: '78%' },
    ],
    preview: [
      { category: 'Organisms', entry: 'Klebsiella pneumoniae', status: 'new' },
      { category: 'Organisms', entry: 'Pseudomonas aeruginosa', status: 'new' },
      { category: 'Organisms', entry: 'Escherichia coli', status: 'update' },
      { category: 'Organisms', entry: 'E. coli', status: 'warning' },
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Import Dictionary</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && (
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors">
                  <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Drag and drop file here, or click to browse</p>
                  <p className="text-sm text-gray-400 mt-1">Accepts: .csv, .json</p>
                  <input 
                    type="file" 
                    accept=".csv,.json" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <button className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm">
                    Browse Files
                  </button>
                </div>
                {file && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <FileText size={16} />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>

              {/* Import Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Import Mode</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="add"
                      checked={importMode === 'add'}
                      onChange={() => setImportMode('add')}
                      className="w-4 h-4 text-teal-600 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Add new entries only</span>
                      <p className="text-xs text-gray-500">Skip entries that already exist</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="update"
                      checked={importMode === 'update'}
                      onChange={() => setImportMode('update')}
                      className="w-4 h-4 text-teal-600 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Update existing only</span>
                      <p className="text-xs text-gray-500">Update entries that match by code</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="both"
                      checked={importMode === 'both'}
                      onChange={() => setImportMode('both')}
                      className="w-4 h-4 text-teal-600 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Add and update</span>
                      <p className="text-xs text-gray-500">Recommended - creates new and updates existing</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Options</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createCategories}
                    onChange={(e) => setCreateCategories(e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Create new categories if they don't exist</span>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-3 text-sm">
                <FileText size={20} className="text-gray-400" />
                <span className="font-medium">{validationResults.fileName}</span>
                <span className="text-gray-500">{validationResults.totalEntries} entries</span>
              </div>

              {/* Results */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-gray-700">{validationResults.newEntries} new entries to add</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw size={16} className="text-blue-500" />
                  <span className="text-gray-700">{validationResults.updateEntries} existing entries to update</span>
                </div>
                {validationResults.warnings.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertTriangle size={16} />
                      <span>{validationResults.warnings.length} entries with warnings</span>
                    </div>
                    <div className="ml-6 mt-2 space-y-1">
                      {validationResults.warnings.map((w, i) => (
                        <p key={i} className="text-xs text-gray-500">
                          "{w.entry}" similar to existing "{w.similar}" ({w.match} match)
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Entry</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {validationResults.preview.map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-600">{item.category}</td>
                          <td className="px-3 py-2 text-gray-900">{item.entry}</td>
                          <td className="px-3 py-2">
                            {item.status === 'new' && (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <CheckCircle size={12} /> New
                              </span>
                            )}
                            {item.status === 'update' && (
                              <span className="inline-flex items-center gap-1 text-blue-600">
                                <RefreshCw size={12} /> Update
                              </span>
                            )}
                            {item.status === 'warning' && (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <AlertTriangle size={12} /> Duplicate?
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Skip warnings option */}
              {validationResults.warnings.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipWarnings}
                    onChange={(e) => setSkipWarnings(e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Skip entries with warnings</span>
                </label>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Import Complete</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>âœ“ 38 entries created</p>
                <p>âœ“ 5 entries updated</p>
                <p>âŠ˜ 2 entries skipped (duplicates)</p>
              </div>
              <button className="mt-6 text-sm text-teal-600 hover:text-teal-700">
                View Import Log
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          {step > 1 && step < 3 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
            >
              {step === 3 ? 'Done' : 'Cancel'}
            </button>
            {step === 1 && (
              <button 
                onClick={() => setStep(2)}
                disabled={!file}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Validate
                <ChevronRight size={18} />
              </button>
            )}
            {step === 2 && (
              <button 
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
              >
                <Upload size={18} />
                Import
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// USAGE MODAL
// ============================================

const UsageModal = ({ entry, onClose }) => {
  const usageData = {
    tests: [
      { name: 'Influenza A PCR', code: 'INFL-A-PCR' },
      { name: 'Respiratory Panel', code: 'RESP-PANEL' },
      { name: 'Viral Panel', code: 'VIRAL-PNL' },
    ],
    resultCount: 247
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Usage Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-500 mb-4">
            Entry: <span className="font-medium text-gray-900">"{entry.displayValue}"</span>
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Used in {usageData.tests.length} tests:
              </h4>
              <ul className="space-y-2">
                {usageData.tests.map((test, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                    <span className="text-gray-900">{test.name}</span>
                    <span className="text-gray-500">({test.code})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Found in <span className="font-medium">{usageData.resultCount}</span> results (last 12 months)
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default DataDictionaryPage;
