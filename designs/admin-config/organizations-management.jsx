// Organizations Management - React Mockup
// Following Test Catalog pattern with sidebar navigation

import React, { useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  Download,
  Upload,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Building2,
  MapPin,
  Home,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  TreePine,
  List,
  X,
  Check,
  ArrowLeft,
  Building,
  Users
} from 'lucide-react';

// ============================================
// ORGANIZATIONS MANAGEMENT PAGE
// ============================================

const OrganizationsManagement = () => {
  const [selectedEntityType, setSelectedEntityType] = useState('regions');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'tree'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [filterSource, setFilterSource] = useState('all'); // 'all', 'local', 'hub'
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedTreeNodes, setExpandedTreeNodes] = useState(['REG-001', 'DST-001']);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sample data
  const entityCounts = {
    regions: 12,
    districts: 45,
    facilities: 234,
    units: 567
  };

  const regions = [
    { id: 1, code: 'REG-001', name: 'Central Region', description: 'Central administrative region', districtCount: 8, source: 'local', isActive: true },
    { id: 2, code: 'REG-002', name: 'Eastern Region', description: 'Eastern administrative region', districtCount: 6, source: 'hub', isActive: true },
    { id: 3, code: 'REG-003', name: 'Western Region', description: 'Western administrative region', districtCount: 7, source: 'local', isActive: true },
    { id: 4, code: 'REG-004', name: 'Northern Region', description: 'Northern administrative region', districtCount: 5, source: 'hub', isActive: true },
    { id: 5, code: 'REG-005', name: 'Southern Region', description: 'Southern administrative region', districtCount: 4, source: 'local', isActive: false },
  ];

  const districts = [
    { id: 1, code: 'DST-001', name: 'Kampala District', regionCode: 'REG-001', regionName: 'Central Region', facilityCount: 45, source: 'local', isActive: true },
    { id: 2, code: 'DST-002', name: 'Wakiso District', regionCode: 'REG-001', regionName: 'Central Region', facilityCount: 32, source: 'hub', isActive: true },
    { id: 3, code: 'DST-003', name: 'Mukono District', regionCode: 'REG-001', regionName: 'Central Region', facilityCount: 28, source: 'local', isActive: true },
    { id: 4, code: 'DST-004', name: 'Jinja District', regionCode: 'REG-002', regionName: 'Eastern Region', facilityCount: 22, source: 'hub', isActive: true },
  ];

  const facilities = [
    { id: 1, code: 'FAC-001', name: 'Mulago National Referral Hospital', districtCode: 'DST-001', districtName: 'Kampala', facilityType: 'Hospital', labType: 'Reference Lab', isReferralLab: true, operationalPartner: 'MOH', unitCount: 24, source: 'hub', isActive: true },
    { id: 2, code: 'FAC-002', name: 'Kisenyi Health Center IV', districtCode: 'DST-001', districtName: 'Kampala', facilityType: 'Health Center IV', labType: 'District Lab', isReferralLab: false, operationalPartner: 'KCCA', unitCount: 8, source: 'local', isActive: true },
    { id: 3, code: 'FAC-003', name: 'Naguru Hospital', districtCode: 'DST-001', districtName: 'Kampala', facilityType: 'Hospital', labType: 'Regional Lab', isReferralLab: true, operationalPartner: 'MOH', unitCount: 12, source: 'local', isActive: true },
  ];

  const units = [
    { id: 1, code: 'WRD-001', name: 'Outpatient Department', facilityCode: 'FAC-001', facilityName: 'Mulago Hospital', unitType: 'Department', source: 'local', isActive: true },
    { id: 2, code: 'WRD-002', name: 'Inpatient Ward A', facilityCode: 'FAC-001', facilityName: 'Mulago Hospital', unitType: 'Ward', source: 'hub', isActive: true },
    { id: 3, code: 'WRD-003', name: 'Laboratory', facilityCode: 'FAC-001', facilityName: 'Mulago Hospital', unitType: 'Department', source: 'local', isActive: true },
  ];

  // Tree data structure
  const treeData = [
    {
      id: 'REG-001',
      name: 'Central Region',
      type: 'region',
      source: 'local',
      children: [
        {
          id: 'DST-001',
          name: 'Kampala District',
          type: 'district',
          source: 'local',
          children: [
            {
              id: 'FAC-001',
              name: 'Mulago National Referral Hospital',
              type: 'facility',
              source: 'hub',
              isReferralLab: true,
              children: [
                { id: 'WRD-001', name: 'Outpatient Department', type: 'unit', source: 'local' },
                { id: 'WRD-002', name: 'Inpatient Ward A', type: 'unit', source: 'hub' },
                { id: 'WRD-003', name: 'Laboratory', type: 'unit', source: 'local' },
              ]
            },
            {
              id: 'FAC-002',
              name: 'Kisenyi Health Center IV',
              type: 'facility',
              source: 'local',
              isReferralLab: false,
              children: []
            },
          ]
        },
        {
          id: 'DST-002',
          name: 'Wakiso District',
          type: 'district',
          source: 'hub',
          children: []
        },
      ]
    },
    {
      id: 'REG-002',
      name: 'Eastern Region',
      type: 'region',
      source: 'hub',
      children: []
    },
  ];

  const getEntityData = () => {
    switch (selectedEntityType) {
      case 'regions': return regions;
      case 'districts': return districts;
      case 'facilities': return facilities;
      case 'units': return units;
      default: return [];
    }
  };

  const getEntityIcon = (type) => {
    switch (type) {
      case 'regions': return MapPin;
      case 'districts': return Building2;
      case 'facilities': return Building;
      case 'units': return Users;
      default: return Building2;
    }
  };

  const SourceBadge = ({ source }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      source === 'local' 
        ? 'bg-gray-100 text-gray-700' 
        : 'bg-blue-100 text-blue-700'
    }`}>
      {source === 'local' ? <Home size={12} /> : <Globe size={12} />}
      {source === 'local' ? 'Local' : 'Hub'}
    </span>
  );

  const StatusBadge = ({ isActive }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-700' 
        : 'bg-gray-100 text-gray-500'
    }`}>
      {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const ReferralLabBadge = () => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
      âš•ï¸ Referral Lab
    </span>
  );

  // Tree Node Component
  const TreeNode = ({ node, level = 0 }) => {
    const isExpanded = expandedTreeNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const toggleExpand = () => {
      if (isExpanded) {
        setExpandedTreeNodes(expandedTreeNodes.filter(id => id !== node.id));
      } else {
        setExpandedTreeNodes([...expandedTreeNodes, node.id]);
      }
    };

    const getTypeIcon = () => {
      switch (node.type) {
        case 'region': return <MapPin size={16} className="text-blue-500" />;
        case 'district': return <Building2 size={16} className="text-green-500" />;
        case 'facility': return <Building size={16} className="text-orange-500" />;
        case 'unit': return <Users size={16} className="text-purple-500" />;
        default: return <Building2 size={16} />;
      }
    };

    return (
      <div>
        <div 
          className={`flex items-center gap-2 py-2 px-2 hover:bg-gray-50 rounded cursor-pointer`}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
          onClick={toggleExpand}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />
          ) : (
            <span className="w-4" />
          )}
          <span className={`w-5 h-5 rounded flex items-center justify-center ${
            node.source === 'local' ? 'bg-gray-100' : 'bg-blue-100'
          }`}>
            {node.source === 'local' ? <Home size={12} className="text-gray-600" /> : <Globe size={12} className="text-blue-600" />}
          </span>
          {getTypeIcon()}
          <span className="text-sm text-gray-900">{node.name}</span>
          <span className="text-xs text-gray-400">({node.id})</span>
          {node.isReferralLab && <ReferralLabBadge />}
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Organizations Management</h1>
            <p className="text-sm text-gray-500">Manage organizational hierarchy: regions, districts, facilities, and units</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Import Button */}
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload size={18} />
              Import
            </button>
            
            {/* Export Dropdown */}
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
                      <FileSpreadsheet size={16} className="text-gray-400" />
                      Export All (Excel)
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-gray-400" />
                      Export Current View
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Download size={16} className="text-gray-400" />
                      Download Template
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Hierarchy</h3>
            <nav className="space-y-1">
              {[
                { id: 'regions', label: 'Regions', icon: MapPin, count: entityCounts.regions },
                { id: 'districts', label: 'Districts', icon: Building2, count: entityCounts.districts },
                { id: 'facilities', label: 'Facilities', icon: Building, count: entityCounts.facilities },
                { id: 'units', label: 'Wards/Units', icon: Users, count: entityCounts.units },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedEntityType(item.id); setBreadcrumb([]); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                      selectedEntityType === item.id
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={18} />
                      {item.label}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedEntityType === item.id ? 'bg-teal-100' : 'bg-gray-100'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Views</h3>
            <nav className="space-y-1">
              <button
                onClick={() => setViewMode('list')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  viewMode === 'list'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List size={18} />
                List View
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  viewMode === 'tree'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TreePine size={18} />
                Tree View
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <div className="bg-white border-b border-gray-200 px-6 py-2">
              <div className="flex items-center gap-2 text-sm">
                <button 
                  onClick={() => setBreadcrumb([])}
                  className="text-teal-600 hover:text-teal-700"
                >
                  {selectedEntityType.charAt(0).toUpperCase() + selectedEntityType.slice(1)}
                </button>
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight size={14} className="text-gray-400" />
                    <span className={index === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : 'text-teal-600 hover:text-teal-700 cursor-pointer'}>
                      {item.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium"
                >
                  <Plus size={18} />
                  Add {selectedEntityType.slice(0, -1).charAt(0).toUpperCase() + selectedEntityType.slice(0, -1).slice(1)}
                </button>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-64"
                  />
                </div>

                {/* Filters */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Sources</option>
                  <option value="local">Local</option>
                  <option value="hub">Hub</option>
                </select>
              </div>

              <div className="text-sm text-gray-500">
                Showing {getEntityData().length} items
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {viewMode === 'list' ? (
              /* List View */
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      {selectedEntityType === 'districts' && (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Region</th>
                      )}
                      {selectedEntityType === 'facilities' && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">District</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lab Type</th>
                        </>
                      )}
                      {selectedEntityType === 'units' && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Facility</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit Type</th>
                        </>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {selectedEntityType === 'regions' ? 'Districts' : 
                         selectedEntityType === 'districts' ? 'Facilities' :
                         selectedEntityType === 'facilities' ? 'Units' : ''}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Regions Table */}
                    {selectedEntityType === 'regions' && regions.map(region => (
                      <tr key={region.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{region.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{region.name}</td>
                        <td className="px-4 py-3">
                          <button className="text-sm text-teal-600 hover:text-teal-700">
                            {region.districtCount} districts â†’
                          </button>
                        </td>
                        <td className="px-4 py-3"><SourceBadge source={region.source} /></td>
                        <td className="px-4 py-3"><StatusBadge isActive={region.isActive} /></td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Districts Table */}
                    {selectedEntityType === 'districts' && districts.map(district => (
                      <tr key={district.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{district.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{district.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{district.regionName}</td>
                        <td className="px-4 py-3">
                          <button className="text-sm text-teal-600 hover:text-teal-700">
                            {district.facilityCount} facilities â†’
                          </button>
                        </td>
                        <td className="px-4 py-3"><SourceBadge source={district.source} /></td>
                        <td className="px-4 py-3"><StatusBadge isActive={district.isActive} /></td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Facilities Table */}
                    {selectedEntityType === 'facilities' && facilities.map(facility => (
                      <tr key={facility.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{facility.code}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900 font-medium">{facility.name}</span>
                            {facility.isReferralLab && <ReferralLabBadge />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{facility.districtName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{facility.facilityType}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{facility.labType || 'â€”'}</td>
                        <td className="px-4 py-3">
                          <button className="text-sm text-teal-600 hover:text-teal-700">
                            {facility.unitCount} units â†’
                          </button>
                        </td>
                        <td className="px-4 py-3"><SourceBadge source={facility.source} /></td>
                        <td className="px-4 py-3"><StatusBadge isActive={facility.isActive} /></td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Units Table */}
                    {selectedEntityType === 'units' && units.map(unit => (
                      <tr key={unit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{unit.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{unit.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{unit.facilityName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{unit.unitType}</td>
                        <td className="px-4 py-3">â€”</td>
                        <td className="px-4 py-3"><SourceBadge source={unit.source} /></td>
                        <td className="px-4 py-3"><StatusBadge isActive={unit.isActive} /></td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Tree View */
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Organization Hierarchy</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setExpandedTreeNodes(treeData.map(n => n.id))}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      Expand All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      onClick={() => setExpandedTreeNodes([])}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  {treeData.map(node => (
                    <TreeNode key={node.id} node={node} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {viewMode === 'list' && (
            <div className="bg-white border-t border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Showing 1 to {getEntityData().length} of {getEntityData().length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Items per page:</span>
                    <select 
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page 1 of 1</span>
                  <button className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
    </div>
  );
};

// ============================================
// IMPORT MODAL COMPONENT
// ============================================

const ImportModal = ({ onClose }) => {
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: review, 4: confirm, 5: complete
  const [uploadedFile, setUploadedFile] = useState(null);

  // Sample import summary data
  const importSummary = {
    regions: { new: 2, updated: 1, unchanged: 9, errors: 0 },
    districts: { new: 5, updated: 3, unchanged: 37, errors: 1 },
    facilities: { new: 12, updated: 8, unchanged: 214, errors: 2 },
    units: { new: 45, updated: 12, unchanged: 510, errors: 0 }
  };

  const changesList = [
    { type: 'region', code: 'REG-013', name: 'Southern Region', change: 'new' },
    { type: 'region', code: 'REG-014', name: 'Coastal Region', change: 'new' },
    { type: 'region', code: 'REG-001', name: 'Central Region', change: 'updated', field: 'Description', oldValue: 'Central admin...', newValue: 'Central administrative region' },
    { type: 'district', code: 'DST-099', name: 'Unknown District', change: 'error', error: 'Invalid Region Code: REG-999' },
    { type: 'district', code: 'DST-046', name: 'Jinja District', change: 'new' },
    { type: 'facility', code: 'FAC-100', name: 'New Health Center', change: 'new' },
    { type: 'facility', code: 'FAC-001', name: 'Mulago Hospital', change: 'updated', field: 'Lab Type', oldValue: 'Regional Lab', newValue: 'Reference Lab' },
  ];

  const getChangeIcon = (change) => {
    switch (change) {
      case 'new': return <Plus size={14} className="text-green-500" />;
      case 'updated': return <Edit size={14} className="text-blue-500" />;
      case 'error': return <AlertTriangle size={14} className="text-red-500" />;
      default: return null;
    }
  };

  const getChangeBadge = (change) => {
    const styles = {
      new: 'bg-green-100 text-green-700',
      updated: 'bg-blue-100 text-blue-700',
      error: 'bg-red-100 text-red-700'
    };
    const labels = {
      new: 'ðŸ†• New',
      updated: 'âœï¸ Updated',
      error: 'âŒ Error'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[change]}`}>
        {labels[change]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Import Organizations
            {step > 1 && <span className="text-gray-400 font-normal"> - Step {step} of 5</span>}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Upload File</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-teal-500 transition-colors cursor-pointer">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your Excel file here, or click to browse</p>
                <p className="text-sm text-gray-400">Supported format: .xlsx</p>
              </div>
              <button className="mt-4 flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
                <Download size={16} />
                Download Template
              </button>
            </div>
          )}

          {/* Step 2: Preview Summary */}
          {step === 2 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Preview Changes</h3>
              <p className="text-sm text-gray-500 mb-4">File: organizations_upload.xlsx</p>
              
              <table className="w-full mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Entity Type</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">New</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Updated</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Unchanged</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(importSummary).map(([type, counts]) => (
                    <tr key={type}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{type}</td>
                      <td className="px-4 py-3 text-sm text-center text-green-600">{counts.new}</td>
                      <td className="px-4 py-3 text-sm text-center text-blue-600">{counts.updated}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-400">{counts.unchanged}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {counts.errors > 0 ? (
                          <span className="text-red-600 flex items-center justify-center gap-1">
                            {counts.errors} <AlertTriangle size={14} />
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(importSummary.districts.errors + importSummary.facilities.errors) > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    3 errors found - these rows will be skipped unless corrected
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review Changes */}
          {step === 3 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Review Changes</h3>
              
              <div className="flex items-center gap-2 mb-4">
                <button className="px-3 py-1.5 bg-teal-600 text-white rounded-md text-sm">All</button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm">New (64)</button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm">Updated (24)</button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm">Errors (3)</button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-10 px-4 py-2"><input type="checkbox" className="rounded" /></th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Change</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {changesList.map((item, index) => (
                      <tr key={index} className={item.change === 'error' ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            className="rounded" 
                            checked={item.change !== 'error'}
                            disabled={item.change === 'error'}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{item.type}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{item.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3">{getChangeBadge(item.change)}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-sm text-teal-600 hover:text-teal-700">
                            {item.change === 'updated' ? 'Diff' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-900 mb-2">You are about to import the following changes:</h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>â€¢ 64 new records will be created</li>
                      <li>â€¢ 24 existing records will be updated</li>
                      <li>â€¢ 3 rows with errors will be skipped</li>
                    </ul>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 mb-4">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">I understand that updated records will overwrite existing data</span>
              </label>

              <p className="text-sm text-gray-500">This action cannot be undone. Continue?</p>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Import completed successfully</h3>
              <div className="text-sm text-gray-600 space-y-1 mb-6">
                <p>âœ“ 64 records created</p>
                <p>âœ“ 24 records updated</p>
                <p className="text-yellow-600">âš ï¸ 3 rows skipped (errors)</p>
              </div>
              <button className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-2 mx-auto">
                <Download size={16} />
                Download Error Report
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {step > 1 && step < 5 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step < 5 && (
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            )}
            {step === 1 && (
              <button 
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium"
              >
                Next â†’
              </button>
            )}
            {step === 2 && (
              <button 
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium"
              >
                Review Changes â†’
              </button>
            )}
            {step === 3 && (
              <button 
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium"
              >
                Confirm â†’
              </button>
            )}
            {step === 4 && (
              <button 
                onClick={() => setStep(5)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium"
              >
                Import
              </button>
            )}
            {step === 5 && (
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationsManagement;
