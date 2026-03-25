import React, { useState } from 'react';
import { 
  Search, Download, ChevronDown, ChevronRight, 
  X, Check, AlertTriangle, Filter, Calendar,
  User, Settings, FileText, Database, Beaker,
  Shield, Box, Activity, LogIn, LogOut, Plus,
  Edit, Trash2, Eye, Upload, ArrowUpDown, Clock,
  ChevronLeft, MoreVertical, FileDown
} from 'lucide-react';

// ============================================
// SYSTEM EVENTS AUDIT TRAIL PAGE
// Menu: Reporting â†’ Audit Trail â†’ System Events
// ============================================

const SystemEventsAuditTrail = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedEntityType, setSelectedEntityType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState('eventTimestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Sample users for filter
  const users = [
    { id: 1, name: 'John Smith', username: 'jsmith' },
    { id: 2, name: 'Mary Jones', username: 'mjones' },
    { id: 3, name: 'Robert Wilson', username: 'rwilson' },
    { id: 4, name: 'Sarah Davis', username: 'sdavis' },
    { id: 5, name: 'System', username: 'system' },
  ];

  // Action types
  const actionTypes = [
    { code: 'CREATE', name: 'Create', color: 'green' },
    { code: 'UPDATE', name: 'Update', color: 'blue' },
    { code: 'DELETE', name: 'Delete', color: 'red' },
    { code: 'VIEW', name: 'View', color: 'gray' },
    { code: 'LOGIN', name: 'Login', color: 'teal' },
    { code: 'LOGOUT', name: 'Logout', color: 'slate' },
    { code: 'IMPORT', name: 'Import', color: 'orange' },
    { code: 'EXPORT', name: 'Export', color: 'purple' },
  ];

  // Entity types (grouped)
  const entityTypeGroups = [
    {
      label: 'Order Level',
      types: [
        { code: 'SAMPLE', name: 'Sample' },
        { code: 'ORDER', name: 'Order' },
        { code: 'RESULT', name: 'Result' },
      ]
    },
    {
      label: 'Test Catalog',
      types: [
        { code: 'TEST', name: 'Test' },
        { code: 'PANEL', name: 'Panel' },
        { code: 'METHOD', name: 'Method' },
        { code: 'LAB_UNIT', name: 'Lab Unit' },
        { code: 'RESULT_OPTION', name: 'Result Option' },
      ]
    },
    {
      label: 'Users & Security',
      types: [
        { code: 'USER', name: 'User' },
        { code: 'ROLE', name: 'Role' },
        { code: 'PERMISSION', name: 'Permission' },
      ]
    },
    {
      label: 'Configuration',
      types: [
        { code: 'DICTIONARY', name: 'Dictionary' },
        { code: 'INSTRUMENT', name: 'Instrument' },
        { code: 'QC', name: 'QC' },
        { code: 'STORAGE', name: 'Storage/Freezer' },
        { code: 'SETTINGS', name: 'System Settings' },
      ]
    },
  ];

  // Sample audit events
  const allEvents = [
    {
      id: 1,
      eventTimestamp: '2025-12-14T14:32:15Z',
      userId: 1,
      userName: 'John Smith',
      eventCategory: 'SYSTEM_LEVEL',
      actionType: 'UPDATE',
      entityType: 'TEST',
      entityId: '101',
      entityName: 'HIV 1/2 Antibody Screen',
      accessionNumber: null,
      description: 'Test configuration updated: name and LOINC code changed',
      changes: {
        before: { name: 'HIV 1/2 Antibody', loincCode: null, reportName: 'HIV Ab' },
        after: { name: 'HIV 1/2 Antibody Screen', loincCode: '75666-5', reportName: 'HIV 1/2 Ab Screen' },
        changedFields: ['name', 'loincCode', 'reportName']
      }
    },
    {
      id: 2,
      eventTimestamp: '2025-12-14T14:28:42Z',
      userId: 2,
      userName: 'Mary Jones',
      eventCategory: 'SYSTEM_LEVEL',
      actionType: 'CREATE',
      entityType: 'USER',
      entityId: '156',
      entityName: 'Amanda Thompson (athompson)',
      accessionNumber: null,
      description: 'New user account created',
      changes: {
        before: null,
        after: { firstName: 'Amanda', lastName: 'Thompson', username: 'athompson', role: 'Lab Technician' },
        changedFields: ['firstName', 'lastName', 'username', 'role']
      }
    },
    {
      id: 3,
      eventTimestamp: '2025-12-14T14:15:00Z',
      userId: 5,
      userName: 'System',
      eventCategory: 'SYSTEM_LEVEL',
      actionType: 'IMPORT',
      entityType: 'DICTIONARY',
      entityId: null,
      entityName: 'Organisms (45 entries)',
      accessionNumber: null,
      description: 'Dictionary import completed: 38 created, 5 updated, 2 skipped',
      changes: {
        summary: { created: 38, updated: 5, skipped: 2 },
        fileName: 'organisms.csv'
      }
    },
    {
      id: 4,
      eventTimestamp: '2025-12-14T13:45:22Z',
      userId: 3,
      userName: 'Robert Wilson',
      eventCategory: 'ORDER_LEVEL',
      actionType: 'UPDATE',
      entityType: 'RESULT',
      entityId: '89234',
      entityName: 'Hemoglobin',
      accessionNumber: 'LAB-2025-001234',
      description: 'Result value corrected',
      changes: {
        before: { value: '12.5', unit: 'g/dL' },
        after: { value: '13.5', unit: 'g/dL' },
        changedFields: ['value']
      }
    },
    {
      id: 5,
      eventTimestamp: '2025-12-14T13:30:00Z',
      userId: 1,
      userName: 'John Smith',
      eventCategory: 'SYSTEM_LEVEL',
      actionType: 'UPDATE',
      entityType: 'STORAGE',
      entityId: 'FRZ-001',
      entityName: 'Main Freezer -80Â°C',
      accessionNumber: null,
      description: 'Sample moved to storage location',
      changes: {
        sampleId: 'SMP-2025-5678',
        location: 'Rack 3, Box 2, Position A5'
      }
    },
    {
      id: 6,
      eventTimestamp: '2025-12-14T12:15:33Z',
      userId: 4,
      userName: 'Sarah Davis',
      eventCategory: 'ORDER_LEVEL',
      actionType: 'CREATE',
      entityType: 'ORDER',
      entityId: '45678',
      entityName: 'New Order',
      accessionNumber: 'LAB-2025-001235',
      description: 'Order created with 5 tests',
      changes: {
        after: { patientId: 'PT-12345', tests: ['CBC', 'BMP', 'Lipid Panel', 'TSH', 'HbA1c'] }
      }
    },
    {
      id: 7,
      eventTimestamp: '2025-12-14T11:45:00Z',
      userId: 2,
      userName: 'Mary Jones',
      eventCategory: 'SYSTEM_LEVEL',
      actionType: 'UPDATE',
      entityType: 'PANEL',
      entityId: '25',
      entityName: 'Comprehensive Metabolic Panel',
      accessionNumber: null,
      description: 'Panel tests updated: added Magnesium',
      changes: {
        before: { testCount: 14 },
        after: { testCount: 15, addedTests: ['Magnesium'] },
        changedFields: ['tests']
      }
    },
    {
      id: 8,
      eventTimestamp: '2025-12-14T10:30:15Z',
      userId: 1,
      userName: 'John Smith',
      eventCategory: 'SYSTEM_LEVEL',
      actionType: 'LOGIN',
      entityType: 'USER',
      entityId: '1',
      entityName: 'John Smith',
      accessionNumber: null,
      description: 'User logged in successfully',
      changes: null
    },
    {
      id: 9,
      eventTimestamp: '2025-12-14T10:00:00Z',
      userId: 3,
      userName: 'Robert Wilson',
      eventCategory: 'ORDER_LEVEL',
      actionType: 'UPDATE',
      entityType: 'SAMPLE',
      entityId: 'SMP-2025-5670',
      entityName: 'Blood Sample',
      accessionNumber: 'LAB-2025-001230',
      description: 'Sample rejected: Hemolyzed specimen',
      changes: {
        before: { status: 'Received' },
        after: { status: 'Rejected', rejectionReason: 'Hemolyzed specimen' },
        changedFields: ['status', 'rejectionReason']
      }
    },
    {
      id: 10,
      eventTimestamp: '2025-12-14T09:15:45Z',
      userId: 2,
      userName: 'Mary Jones',
      eventCategory: 'SYSTEM_LEVEL',
      actionType: 'DELETE',
      entityType: 'RESULT_OPTION',
      entityId: '89',
      entityName: 'Invalid (deactivated)',
      accessionNumber: null,
      description: 'Result option deactivated (was unused)',
      changes: {
        before: { isActive: true },
        after: { isActive: false },
        changedFields: ['isActive']
      }
    },
    {
      id: 11,
      eventTimestamp: '2025-12-13T16:45:00Z',
      userId: 4,
      userName: 'Sarah Davis',
      eventCategory: 'SYSTEM_LEVEL',
      actionType: 'EXPORT',
      entityType: 'DICTIONARY',
      entityId: null,
      entityName: 'All Categories',
      accessionNumber: null,
      description: 'Dictionary exported: 744 entries, CSV format',
      changes: {
        format: 'CSV',
        entryCount: 744,
        includeInactive: false
      }
    },
    {
      id: 12,
      eventTimestamp: '2025-12-13T15:30:22Z',
      userId: 1,
      userName: 'John Smith',
      eventCategory: 'SYSTEM_LEVEL',
      actionType: 'UPDATE',
      entityType: 'INSTRUMENT',
      entityId: 'INST-003',
      entityName: 'Beckman AU5800',
      accessionNumber: null,
      description: 'Instrument test mapping updated',
      changes: {
        before: { mappedTests: 45 },
        after: { mappedTests: 48, addedTests: ['Magnesium', 'Phosphorus', 'Uric Acid'] },
        changedFields: ['testMappings']
      }
    },
  ];

  // Filter system events
  const getFilteredEvents = () => {
    let events = allEvents.filter(e => e.eventCategory === 'SYSTEM_LEVEL');

    // Filter by user
    if (selectedUser !== 'all') {
      events = events.filter(e => e.userId === parseInt(selectedUser));
    }

    // Filter by action
    if (selectedAction !== 'all') {
      events = events.filter(e => e.actionType === selectedAction);
    }

    // Filter by entity type
    if (selectedEntityType !== 'all') {
      events = events.filter(e => e.entityType === selectedEntityType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      events = events.filter(e => 
        e.entityName?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      );
    }

    return events;
  };

  const filteredEvents = getFilteredEvents();

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'eventTimestamp') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedEvents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEvents = sortedEvents.slice(startIndex, startIndex + pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortOrder === 'asc' 
      ? <ChevronDown size={14} className="text-teal-600 rotate-180" />
      : <ChevronDown size={14} className="text-teal-600" />;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadge = (actionType) => {
    const action = actionTypes.find(a => a.code === actionType);
    const colorClasses = {
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      red: 'bg-red-100 text-red-700',
      gray: 'bg-gray-100 text-gray-600',
      teal: 'bg-teal-100 text-teal-700',
      slate: 'bg-slate-100 text-slate-600',
      orange: 'bg-orange-100 text-orange-700',
      purple: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[action?.color || 'gray']}`}>
        {action?.name || actionType}
      </span>
    );
  };

  const getEntityTypeIcon = (entityType) => {
    const icons = {
      TEST: Beaker,
      PANEL: Database,
      METHOD: Settings,
      LAB_UNIT: Box,
      USER: User,
      ROLE: Shield,
      SAMPLE: FileText,
      ORDER: FileText,
      RESULT: Activity,
      DICTIONARY: Database,
      INSTRUMENT: Settings,
      STORAGE: Box,
      RESULT_OPTION: Database,
    };
    const Icon = icons[entityType] || FileText;
    return <Icon size={14} className="text-gray-400" />;
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedUser('all');
    setSelectedAction('all');
    setSelectedEntityType('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">System Events Audit Trail</h1>
            <p className="text-sm text-gray-500">Track configuration and administrative changes</p>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
            >
              <Download size={18} />
              Export
              <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <FileDown size={16} className="text-gray-400" />
                    Export Current View (CSV)
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <FileDown size={16} className="text-gray-400" />
                    Export Current View (PDF)
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    Export Date Range...
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* User Filter */}
          <select
            value={selectedUser}
            onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => { setSelectedAction(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Actions</option>
            {actionTypes.map(action => (
              <option key={action.code} value={action.code}>{action.name}</option>
            ))}
          </select>

          {/* Entity Type Filter */}
          <select
            value={selectedEntityType}
            onChange={(e) => { setSelectedEntityType(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Entity Types</option>
            {entityTypeGroups.filter(g => g.label !== 'Order Level').map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.types.map(type => (
                  <option key={type.code} value={type.code}>{type.name}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Clear
          </button>

          {/* Results count */}
          <div className="text-sm text-gray-500 ml-auto">
            {filteredEvents.length} events
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="w-10 px-2 py-3"></th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-44"
                  onClick={() => handleSort('eventTimestamp')}
                >
                  <div className="flex items-center gap-2">
                    Timestamp
                    <SortIcon field="eventTimestamp" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center gap-2">
                    User
                    <SortIcon field="userName" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                  onClick={() => handleSort('actionType')}
                >
                  <div className="flex items-center gap-2">
                    Action
                    <SortIcon field="actionType" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
                  onClick={() => handleSort('entityType')}
                >
                  <div className="flex items-center gap-2">
                    Entity Type
                    <SortIcon field="entityType" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedEvents.map((event) => (
                <React.Fragment key={event.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                  >
                    <td className="px-2 py-3 text-center">
                      {expandedEventId === event.id ? (
                        <ChevronDown size={16} className="text-gray-400 mx-auto" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-900">{formatTimestamp(event.eventTimestamp)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{event.userName}</span>
                    </td>
                    <td className="px-4 py-3">
                      {getActionBadge(event.actionType)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getEntityTypeIcon(event.entityType)}
                        <span className="text-sm text-gray-600">{event.entityType.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{event.entityName}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-sm text-teal-600 hover:text-teal-700">
                        View
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Details */}
                  {expandedEventId === event.id && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 bg-gray-50">
                        <EventDetails event={event} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {paginatedEvents.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Activity size={32} className="mx-auto mb-2" />
              <p>No events found matching your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredEvents.length)} of {filteredEvents.length}
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
    </div>
  );
};

// ============================================
// ORDER EVENTS AUDIT TRAIL PAGE
// Menu: Reporting â†’ Audit Trail â†’ Order Events
// ============================================

const OrderEventsAuditTrail = () => {
  const [labNumberSearch, setLabNumberSearch] = useState('');
  const [searchedLabNumber, setSearchedLabNumber] = useState(null);
  const [orderNotFound, setOrderNotFound] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Sample order data
  const sampleOrders = {
    'LAB-2025-001234': {
      labNumber: 'LAB-2025-001234',
      patientName: 'John Doe',
      patientId: 'PT-12345',
      orderDate: '2025-12-14',
      tests: ['CBC', 'BMP', 'Lipid Panel', 'TSH', 'HbA1c'],
      status: 'Completed'
    },
    'LAB-2025-001230': {
      labNumber: 'LAB-2025-001230',
      patientName: 'Jane Smith',
      patientId: 'PT-12340',
      orderDate: '2025-12-14',
      tests: ['Urinalysis', 'Glucose'],
      status: 'In Progress'
    }
  };

  // Order-specific events
  const orderEventsData = {
    'LAB-2025-001234': [
      {
        id: 101,
        eventTimestamp: '2025-12-14T14:45:00Z',
        userId: 1,
        userName: 'John Smith',
        actionType: 'UPDATE',
        entityType: 'RESULT',
        entityId: '89235',
        entityName: 'Hemoglobin - Released',
        description: 'Result released to patient portal',
        changes: { before: { status: 'Validated' }, after: { status: 'Released' }, changedFields: ['status'] }
      },
      {
        id: 102,
        eventTimestamp: '2025-12-14T13:45:22Z',
        userId: 3,
        userName: 'Robert Wilson',
        actionType: 'UPDATE',
        entityType: 'RESULT',
        entityId: '89234',
        entityName: 'Hemoglobin',
        description: 'Result value corrected',
        changes: { before: { value: '12.5', unit: 'g/dL' }, after: { value: '13.5', unit: 'g/dL' }, changedFields: ['value'] }
      },
      {
        id: 103,
        eventTimestamp: '2025-12-14T13:30:00Z',
        userId: 2,
        userName: 'Mary Jones',
        actionType: 'UPDATE',
        entityType: 'RESULT',
        entityId: '89234',
        entityName: 'Hemoglobin',
        description: 'Result validated',
        changes: { before: { status: 'Entered' }, after: { status: 'Validated' }, changedFields: ['status'] }
      },
      {
        id: 104,
        eventTimestamp: '2025-12-14T12:30:00Z',
        userId: 3,
        userName: 'Robert Wilson',
        actionType: 'CREATE',
        entityType: 'RESULT',
        entityId: '89234',
        entityName: 'Hemoglobin',
        description: 'Result entered: 12.5 g/dL',
        changes: { after: { value: '12.5', unit: 'g/dL', status: 'Entered' } }
      },
      {
        id: 105,
        eventTimestamp: '2025-12-14T11:00:00Z',
        userId: 4,
        userName: 'Sarah Davis',
        actionType: 'UPDATE',
        entityType: 'SAMPLE',
        entityId: 'SMP-2025-5679',
        entityName: 'Blood Sample',
        description: 'Sample received in lab',
        changes: { before: { status: 'Collected' }, after: { status: 'Received' }, changedFields: ['status'] }
      },
      {
        id: 106,
        eventTimestamp: '2025-12-14T10:30:00Z',
        userId: 4,
        userName: 'Sarah Davis',
        actionType: 'UPDATE',
        entityType: 'SAMPLE',
        entityId: 'SMP-2025-5679',
        entityName: 'Blood Sample',
        description: 'Sample collected',
        changes: { before: { status: 'Ordered' }, after: { status: 'Collected', collectedBy: 'Sarah Davis' }, changedFields: ['status', 'collectedBy'] }
      },
      {
        id: 107,
        eventTimestamp: '2025-12-14T09:30:00Z',
        userId: 4,
        userName: 'Sarah Davis',
        actionType: 'CREATE',
        entityType: 'ORDER',
        entityId: '45678',
        entityName: 'Order Created',
        description: 'Order created with 5 tests: CBC, BMP, Lipid Panel, TSH, HbA1c',
        changes: { after: { patientId: 'PT-12345', tests: ['CBC', 'BMP', 'Lipid Panel', 'TSH', 'HbA1c'], status: 'Ordered' } }
      },
    ]
  };

  // Action types
  const actionTypes = [
    { code: 'CREATE', name: 'Create', color: 'green' },
    { code: 'UPDATE', name: 'Update', color: 'blue' },
    { code: 'DELETE', name: 'Delete', color: 'red' },
    { code: 'VIEW', name: 'View', color: 'gray' },
  ];

  const handleOrderSearch = () => {
    const trimmedLabNumber = labNumberSearch.trim().toUpperCase();
    if (!trimmedLabNumber) return;
    
    if (sampleOrders[trimmedLabNumber] || orderEventsData[trimmedLabNumber]) {
      setSearchedLabNumber(trimmedLabNumber);
      setOrderNotFound(false);
    } else {
      setSearchedLabNumber(null);
      setOrderNotFound(true);
    }
  };

  const clearOrderSearch = () => {
    setLabNumberSearch('');
    setSearchedLabNumber(null);
    setOrderNotFound(false);
    setExpandedEventId(null);
  };

  const getOrderEvents = () => {
    if (!searchedLabNumber) return [];
    return orderEventsData[searchedLabNumber] || [];
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadge = (actionType) => {
    const action = actionTypes.find(a => a.code === actionType);
    const colorClasses = {
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      red: 'bg-red-100 text-red-700',
      gray: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[action?.color || 'gray']}`}>
        {action?.name || actionType}
      </span>
    );
  };

  const getEntityTypeIcon = (entityType) => {
    const icons = {
      SAMPLE: FileText,
      ORDER: FileText,
      RESULT: Activity,
    };
    const Icon = icons[entityType] || FileText;
    return <Icon size={14} className="text-gray-400" />;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Order Events Audit Trail</h1>
            <p className="text-sm text-gray-500">View all audit events for a specific order</p>
          </div>
        </div>
      </div>

      {/* Search Section - Before Search */}
      {!searchedLabNumber && (
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Lab Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter Lab Number (e.g., LAB-2025-001234)"
                  value={labNumberSearch}
                  onChange={(e) => { setLabNumberSearch(e.target.value); setOrderNotFound(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleOrderSearch(); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <button
                onClick={handleOrderSearch}
                disabled={!labNumberSearch.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Search
              </button>
            </div>
            {orderNotFound && (
              <p className="mt-2 text-sm text-red-600">
                Order not found. Please check the Lab Number and try again.
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Enter a Lab Number to view all audit events for that order.
            </p>
          </div>
        </div>
      )}

      {/* Empty State - Before Search */}
      {!searchedLabNumber && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-400">
            <Search size={48} className="mx-auto mb-4" />
            <p className="text-lg">Enter a Lab Number to view order events</p>
            <p className="text-sm mt-1">All audit events for the order will be displayed</p>
          </div>
        </div>
      )}

      {/* Order Header - After Search */}
      {searchedLabNumber && sampleOrders[searchedLabNumber] && (
        <>
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-teal-600" />
                    <span className="font-semibold text-gray-900">{searchedLabNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sampleOrders[searchedLabNumber].status === 'Completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {sampleOrders[searchedLabNumber].status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Patient: {sampleOrders[searchedLabNumber].patientName} ({sampleOrders[searchedLabNumber].patientId})
                    <span className="mx-2">â€¢</span>
                    Ordered: {new Date(sampleOrders[searchedLabNumber].orderDate).toLocaleDateString()}
                    <span className="mx-2">â€¢</span>
                    Tests: {sampleOrders[searchedLabNumber].tests.length}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearOrderSearch}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  â† Search Another Order
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300"
                  >
                    <Download size={16} />
                    Export
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-2">
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                          Export as CSV
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                          Export as PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              {getOrderEvents().length} events for this order
            </div>
          </div>

          {/* Events Table */}
          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="w-10 px-2 py-3"></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Entity Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getOrderEvents().map((event) => (
                    <React.Fragment key={event.id}>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                      >
                        <td className="px-2 py-3 text-center">
                          {expandedEventId === event.id ? (
                            <ChevronDown size={16} className="text-gray-400 mx-auto" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{formatTimestamp(event.eventTimestamp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{event.userName}</span>
                        </td>
                        <td className="px-4 py-3">
                          {getActionBadge(event.actionType)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getEntityTypeIcon(event.entityType)}
                            <span className="text-sm text-gray-600">{event.entityType}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{event.entityName}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-sm text-teal-600 hover:text-teal-700">
                            View
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Details */}
                      {expandedEventId === event.id && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-gray-50">
                            <EventDetails event={event} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {getOrderEvents().length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  <Activity size={32} className="mx-auto mb-2" />
                  <p>No events found for this order</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// EVENT DETAILS COMPONENT
// ============================================

const EventDetails = ({ event }) => {
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'â€”';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const hasChanges = event.changes && (event.changes.before || event.changes.after);
  const changedFields = event.changes?.changedFields || [];

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-gray-500 uppercase">Event ID</span>
          <p className="text-sm font-mono text-gray-900">#{event.id}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase">Timestamp</span>
          <p className="text-sm text-gray-900">
            {new Date(event.eventTimestamp).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <span className="text-xs text-gray-500 uppercase">Description</span>
        <p className="text-sm text-gray-900">{event.description}</p>
      </div>

      {hasChanges && (
        <div>
          <span className="text-xs text-gray-500 uppercase mb-2 block">Changes</span>
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Field</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Before</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {changedFields.length > 0 ? (
                  changedFields.map((field) => (
                    <tr key={field}>
                      <td className="px-3 py-2 font-medium text-gray-700">{field}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {event.changes.before ? formatValue(event.changes.before[field]) : 'â€”'}
                      </td>
                      <td className="px-3 py-2 text-gray-900">
                        {event.changes.after ? formatValue(event.changes.after[field]) : 'â€”'}
                      </td>
                    </tr>
                  ))
                ) : (
                  // If no changedFields, show all after fields
                  Object.keys(event.changes.after || event.changes).map((field) => {
                    if (field === 'before' || field === 'after' || field === 'changedFields') return null;
                    return (
                      <tr key={field}>
                        <td className="px-3 py-2 font-medium text-gray-700">{field}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {event.changes.before ? formatValue(event.changes.before[field]) : 'â€”'}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {formatValue(event.changes.after?.[field] || event.changes[field])}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!hasChanges && event.changes && (
        <div>
          <span className="text-xs text-gray-500 uppercase mb-2 block">Details</span>
          <div className="bg-white border border-gray-200 rounded-md p-3">
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(event.changes, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// EXPORT COMPONENTS
// ============================================

export { SystemEventsAuditTrail, OrderEventsAuditTrail };
export default SystemEventsAuditTrail;
