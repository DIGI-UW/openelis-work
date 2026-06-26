import React, { useState } from 'react';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  DataTable,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  TextInput,
  Select,
  SelectItem,
  Dropdown,
  TextArea,
  ComboBox,
  NumberInput,
  Toggle,
  Tag,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Checkbox,
  FormGroup,
  FormLabel,
  SkeletonPlaceholder,
} from '@carbon/react';
import {
  Plus,
  Download,
  Upload,
  Edit,
  Eye,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';

/**
 * i18n: Sampling Site Registry Mockup
 * OpenELIS Global - S-02 Module
 * Demonstrates three views: List, Detail/Edit, and Inline Search
 */

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_SITES = [
  {
    code: 'WS-001',
    name: 'Sungai Ciliwung — Manggarai',
    type: 'WATER_SOURCE',
    subtype: 'River',
    region: 'DKI Jakarta',
    district: 'Jakarta Selatan',
    lat: -6.2088,
    lng: 106.8456,
    elevation: 45,
    zone: 'Urban',
    address: 'Jl. Benda No. 1, Mampang Prapatan, Jakarta Selatan',
    description: 'Primary water quality monitoring site at Ciliwung River confluence',
    lastCollection: '2026-03-28',
    totalCollections: 47,
    status: 'active',
    source: 'local',
    contactPerson: 'Dr. Budi Santoso',
    contactPhone: '+62-21-123-4567',
    created: '2024-01-15',
    modified: '2026-03-28',
    fhirId: 'Location/site-ws-001',
    lastSync: '2026-04-02 10:28',
  },
  {
    code: 'WS-002',
    name: 'Waduk Jatiluhur — Intake Point',
    type: 'WATER_SOURCE',
    subtype: 'Reservoir',
    region: 'Jawa Barat',
    district: 'Purwakarta',
    lat: -6.5341,
    lng: 107.3856,
    elevation: 157,
    zone: 'Suburban',
    address: 'Jl. Raya Waduk Jatiluhur, Purwakarta',
    description: 'Water intake monitoring for irrigation and drinking water',
    lastCollection: '2026-03-15',
    totalCollections: 23,
    status: 'active',
    source: 'hub',
    contactPerson: 'Ir. Siti Nurhaliza',
    contactPhone: '+62-264-001-123',
    created: '2024-02-10',
    modified: '2026-03-15',
    fhirId: 'Location/site-ws-002',
    lastSync: '2026-04-01 14:15',
  },
  {
    code: 'AT-001',
    name: 'Stasiun Pemantauan Udara Kemayoran',
    type: 'AIR_MONITORING',
    subtype: 'Fixed Station',
    region: 'DKI Jakarta',
    district: 'Jakarta Pusat',
    lat: -6.1544,
    lng: 106.8467,
    elevation: 25,
    zone: 'Urban',
    address: 'Jl. Benyamin Sueb No. 2, Kemayoran, Jakarta Pusat',
    description: 'Air quality monitoring station with PM2.5, PM10, and gas sensors',
    lastCollection: '2026-04-01',
    totalCollections: 156,
    status: 'active',
    source: 'local',
    contactPerson: 'Eng. Ahmad Wijaya',
    contactPhone: '+62-21-234-5678',
    created: '2023-06-01',
    modified: '2026-04-01',
    fhirId: 'Location/site-at-001',
    lastSync: '2026-04-02 09:45',
  },
  {
    code: 'VT-001',
    name: 'Perangkap Nyamuk — Kelurahan Ancol',
    type: 'VECTOR_TRAP',
    subtype: 'BG-Sentinel',
    region: 'DKI Jakarta',
    district: 'Jakarta Utara',
    lat: -6.1184,
    lng: 106.8316,
    elevation: 2,
    zone: 'Urban',
    address: 'Kelurahan Ancol, Jakarta Utara',
    description: 'Vector monitoring trap for mosquito surveillance program',
    lastCollection: '2026-03-30',
    totalCollections: 89,
    status: 'active',
    source: 'local',
    contactPerson: 'Dr. Hendra Kusuma',
    contactPhone: '+62-21-345-6789',
    created: '2024-05-20',
    modified: '2026-03-30',
    fhirId: 'Location/site-vt-001',
    lastSync: '2026-04-02 08:30',
  },
  {
    code: 'SS-001',
    name: 'Lahan Industri — Cikarang Barat',
    type: 'SOIL_SEDIMENT',
    subtype: 'Industrial Site',
    region: 'Jawa Barat',
    district: 'Bekasi',
    lat: -6.3167,
    lng: 107.15,
    elevation: 85,
    zone: 'Industrial',
    address: 'Kawasan Industri Jababeka, Cikarang Barat, Bekasi',
    description: 'Soil and sediment sampling from industrial area for contamination monitoring',
    lastCollection: '2026-02-20',
    totalCollections: 12,
    status: 'active',
    source: 'local',
    contactPerson: 'Ir. Wayan Sudarta',
    contactPhone: '+62-21-456-7890',
    created: '2025-01-10',
    modified: '2026-02-20',
    fhirId: 'Location/site-ss-001',
    lastSync: '2026-04-02 07:20',
  },
  {
    code: 'WS-003',
    name: 'Sumur SD Negeri 1 Gambir',
    type: 'WATER_SOURCE',
    subtype: 'Well',
    region: 'DKI Jakarta',
    district: 'Jakarta Pusat',
    lat: -6.1751,
    lng: 106.8272,
    elevation: 30,
    zone: 'Urban',
    address: 'Jl. Gambir No. 5, Jakarta Pusat',
    description: 'School well water quality monitoring',
    lastCollection: null,
    totalCollections: 0,
    status: 'inactive',
    source: 'local',
    contactPerson: 'Kepala Sekolah',
    contactPhone: '+62-21-567-8901',
    created: '2023-11-12',
    modified: '2023-12-01',
    fhirId: 'Location/site-ws-003',
    lastSync: '2023-12-02 06:00',
  },
];

const SITE_TYPES = [
  { value: 'WATER_SOURCE', label: 'Water Source', color: '#08bdba' },
  { value: 'AIR_MONITORING', label: 'Air Monitoring', color: '#0f62fe' },
  { value: 'VECTOR_TRAP', label: 'Vector Trap', color: '#ae5a24' },
  { value: 'SOIL_SEDIMENT', label: 'Soil/Sediment', color: '#525252' },
  { value: 'OTHER', label: 'Other', color: '#a8a8a8' },
];

const SITE_SUBTYPES = {
  WATER_SOURCE: ['River', 'Reservoir', 'Well', 'Stream', 'Lake', 'Borehole'],
  AIR_MONITORING: ['Fixed Station', 'Mobile Unit', 'Rooftop', 'Ground Level'],
  VECTOR_TRAP: ['BG-Sentinel', 'Light Trap', 'CDC Trap', 'Oviposition Trap'],
  SOIL_SEDIMENT: ['Industrial Site', 'Agricultural Site', 'Landfill', 'Park/Protected'],
  OTHER: ['Custom'],
};

const REGIONS = ['DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta'];
const DISTRICTS = {
  'DKI Jakarta': ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Utara', 'Jakarta Timur', 'Jakarta Barat'],
  'Jawa Barat': ['Purwakarta', 'Bekasi', 'Bogor', 'Bandung'],
  Banten: ['Serang', 'Tangerang'],
  'Jawa Tengah': ['Semarang', 'Yogyakarta'],
  'DI Yogyakarta': ['Sleman', 'Bantul'],
};

const ZONES = ['Urban', 'Suburban', 'Rural', 'Industrial', 'Agricultural', 'Protected'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getTypeColor = (type) => {
  const found = SITE_TYPES.find((t) => t.value === type);
  return found ? found.color : '#a8a8a8';
};

const getTypeLabel = (type) => {
  const found = SITE_TYPES.find((t) => t.value === type);
  return found ? found.label : 'Unknown';
};

// ============================================================================
// VIEW 1: SITE REGISTRY LIST
// ============================================================================

function SiteRegistryList() {
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null); // site code or null
  const [editingRow, setEditingRow] = useState(null); // site code or null (inline edit mode)
  const [forkingRow, setForkingRow] = useState(null); // site code or null (fork confirmation)
  const [deactivatingRow, setDeactivatingRow] = useState(null); // site code or null

  // i18n: sidebar categories
  const typeCounts = {
    all: SAMPLE_SITES.length,
    WATER_SOURCE: SAMPLE_SITES.filter((s) => s.type === 'WATER_SOURCE').length,
    AIR_MONITORING: SAMPLE_SITES.filter((s) => s.type === 'AIR_MONITORING').length,
    VECTOR_TRAP: SAMPLE_SITES.filter((s) => s.type === 'VECTOR_TRAP').length,
    SOIL_SEDIMENT: SAMPLE_SITES.filter((s) => s.type === 'SOIL_SEDIMENT').length,
  };

  // Filter sites
  let filtered = SAMPLE_SITES;
  if (selectedType !== 'all') {
    filtered = filtered.filter((s) => s.type === selectedType);
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter((s) => s.status === statusFilter);
  }
  if (regionFilter !== 'all') {
    filtered = filtered.filter((s) => s.region === regionFilter);
  }
  if (searchTerm) {
    filtered = filtered.filter((s) =>
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // i18n: status icon and label
  const getStatusDisplay = (status) => {
    if (status === 'active') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} style={{ color: '#0e6027' }} />
          <span style={{ fontSize: '0.875rem', color: '#0e6027' }}>Active</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <XCircle size={16} style={{ color: '#a8a8a8' }} />
        <span style={{ fontSize: '0.875rem', color: '#a8a8a8' }}>Inactive</span>
      </div>
    );
  };

  // i18n: data table rows
  const rows = filtered.map((site, idx) => ({
    id: `row-${idx}`,
    code: site.code,
    name: site.name,
    type: (
      <Tag
        type="gray"
        style={{
          backgroundColor: getTypeColor(site.type),
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        {getTypeLabel(site.type)}
      </Tag>
    ),
    subtype: site.subtype,
    location: `${site.district}, ${site.region}`,
    gps: `${site.lat.toFixed(4)}, ${site.lng.toFixed(4)}`,
    lastCollection: site.lastCollection || '—',
    status: getStatusDisplay(site.status),
    actions: (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#0f62fe',
            fontSize: '0.875rem',
            padding: '0.25rem 0.5rem',
          }}
        >
          <Edit size={16} style={{ marginRight: '0.25rem' }} />
          Edit
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#525252',
            fontSize: '0.875rem',
            padding: '0.25rem 0.5rem',
          }}
        >
          <Eye size={16} style={{ marginRight: '0.25rem' }} />
          View
        </button>
      </div>
    ),
  }));

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#f4f4f4' }}>
      {/* LEFT SIDEBAR */}
      <div
        style={{
          width: '14rem',
          backgroundColor: '#fff',
          borderRight: '1px solid #e0e0e0',
          padding: '1.5rem',
          overflowY: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* SITE TYPES SECTION */}
        <div style={{ marginBottom: '2rem' }}>
          <h4
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#161616',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {/* i18n: Site Types */}
            Site Types
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* All Sites */}
            <button
              onClick={() => setSelectedType('all')}
              style={{
                background: selectedType === 'all' ? '#e0e0e0' : 'transparent',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: selectedType === 'all' ? 600 : 400,
                color: '#161616',
              }}
            >
              <span>All Sites</span>
              <span style={{ float: 'right', color: '#666' }}>({typeCounts.all})</span>
            </button>

            {/* Water Sources */}
            <button
              onClick={() => setSelectedType('WATER_SOURCE')}
              style={{
                background: selectedType === 'WATER_SOURCE' ? '#e0e0e0' : 'transparent',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: selectedType === 'WATER_SOURCE' ? 600 : 400,
                color: '#161616',
              }}
            >
              <span>Water Sources</span>
              <span style={{ float: 'right', color: '#666' }}>({typeCounts.WATER_SOURCE})</span>
            </button>

            {/* Air Stations */}
            <button
              onClick={() => setSelectedType('AIR_MONITORING')}
              style={{
                background: selectedType === 'AIR_MONITORING' ? '#e0e0e0' : 'transparent',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: selectedType === 'AIR_MONITORING' ? 600 : 400,
                color: '#161616',
              }}
            >
              <span>Air Stations</span>
              <span style={{ float: 'right', color: '#666' }}>({typeCounts.AIR_MONITORING})</span>
            </button>

            {/* Vector Traps */}
            <button
              onClick={() => setSelectedType('VECTOR_TRAP')}
              style={{
                background: selectedType === 'VECTOR_TRAP' ? '#e0e0e0' : 'transparent',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: selectedType === 'VECTOR_TRAP' ? 600 : 400,
                color: '#161616',
              }}
            >
              <span>Vector Traps</span>
              <span style={{ float: 'right', color: '#666' }}>({typeCounts.VECTOR_TRAP})</span>
            </button>

            {/* Soil/Sediment */}
            <button
              onClick={() => setSelectedType('SOIL_SEDIMENT')}
              style={{
                background: selectedType === 'SOIL_SEDIMENT' ? '#e0e0e0' : 'transparent',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: selectedType === 'SOIL_SEDIMENT' ? 600 : 400,
                color: '#161616',
              }}
            >
              <span>Soil/Sediment</span>
              <span style={{ float: 'right', color: '#666' }}>({typeCounts.SOIL_SEDIMENT})</span>
            </button>
          </div>
        </div>

        {/* VIEWS SECTION */}
        <div>
          <h4
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#161616',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {/* i18n: Views */}
            Views
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? '#e0e0e0' : 'transparent',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: viewMode === 'list' ? 600 : 400,
                color: '#161616',
              }}
            >
              {/* i18n: List View */}
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              style={{
                background: viewMode === 'map' ? '#e0e0e0' : 'transparent',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: viewMode === 'map' ? 600 : 400,
                color: '#161616',
              }}
            >
              {/* i18n: Map View */}
              Map View
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
        {/* HEADER */}
        <div
          style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            {/* i18n: Sampling Site Registry */}
            Sampling Site Registry
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* FHIR Sync Status Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                background: '#defbe6',
                border: '1px solid #a7f0ba',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#0e6027',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#24a148', display: 'inline-block' }} />
              {/* i18n: FHIR Synced */}
              FHIR Synced — 2 min ago
            </div>
            <button
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                color: '#525252',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
              title="Sync Now — pull latest sites from FHIR server"
            >
              {/* i18n: Sync Now */}
              ↻ Sync Now
            </button>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#fff',
                border: '1px solid #0f62fe',
                color: '#0f62fe',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Upload size={16} />
              {/* i18n: Import */}
              Import
            </button>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#fff',
                border: '1px solid #0f62fe',
                color: '#0f62fe',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Download size={16} />
              {/* i18n: Export */}
              Export
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div
          style={{
            padding: '1rem 2rem',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0f62fe',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Plus size={16} />
            {/* i18n: Add Site */}
            Add Site
          </button>

          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '0.875rem',
              flex: '0 0 250px',
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="all">{/* i18n: Status */} All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="all">{/* i18n: Region */} All Regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* DATA TABLE */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#f4f4f4',
                  borderBottom: '1px solid #e0e0e0',
                }}
              >
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  <Checkbox />
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  {/* i18n: Code */}
                  Code
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  {/* i18n: Name */}
                  Name
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  {/* i18n: Type */}
                  Type
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  {/* i18n: Subtype */}
                  Subtype
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  {/* i18n: Location */}
                  Location
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  {/* i18n: GPS */}
                  GPS
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  {/* i18n: Last Collection */}
                  Last Collection
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  {/* i18n: Status */}
                  Status
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#161616',
                  }}
                >
                  {/* i18n: Actions */}
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((site, idx) => (
                  <React.Fragment key={idx}>
                    <tr
                      onClick={() => setExpandedRow(expandedRow === site.code ? null : site.code)}
                      style={{
                        borderBottom: '1px solid #e0e0e0',
                        backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#f0f0f0' : '#efefef';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fafafa';
                      }}
                    >
                      <td style={{ padding: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox />
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          fontFamily: 'monospace',
                          color: '#0f62fe',
                        }}
                      >
                        {site.code}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{site.name}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <Tag
                          type="gray"
                          style={{
                            backgroundColor: getTypeColor(site.type),
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >
                          {getTypeLabel(site.type)}
                        </Tag>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{site.subtype}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {site.district}, {site.region}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          color: '#525252',
                        }}
                      >
                        {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{site.lastCollection || '—'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {site.status === 'active' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={16} style={{ color: '#0e6027' }} />
                            <span style={{ color: '#0e6027' }}>Active</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <XCircle size={16} style={{ color: '#a8a8a8' }} />
                            <span style={{ color: '#a8a8a8' }}>Inactive</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1rem', color: '#525252' }}>
                            {expandedRow === site.code ? '▾' : '▸'}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDED DETAIL PANEL */}
                    {expandedRow === site.code && (
                      <tr
                        style={{
                          backgroundColor: site.source === 'hub' ? '#f8fbff' : '#fff',
                          borderBottom: '2px solid #e0e0e0',
                          borderLeft: `3px solid ${site.source === 'local' ? '#24a148' : '#0043ce'}`,
                        }}
                      >
                        <td colSpan="10" style={{ padding: '1.5rem' }}>
                          <div style={{ display: 'flex', gap: '2rem' }}>
                            {/* LEFT COLUMN (60%) */}
                            <div style={{ flex: '0 0 60%' }}>
                              <h4 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#161616' }}>
                                {site.code} — {site.name}
                              </h4>

                              {/* Type & Subtype */}
                              <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                  <Tag
                                    type="gray"
                                    style={{
                                      backgroundColor: getTypeColor(site.type),
                                      color: '#fff',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {getTypeLabel(site.type)}
                                  </Tag>
                                  <span style={{ fontSize: '0.875rem', color: '#525252' }}>{site.subtype}</span>
                                </div>
                              </div>

                              {/* Location */}
                              <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                                  Location
                                </label>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#161616' }}>
                                  {site.region} &gt; {site.district}
                                </p>
                              </div>

                              {/* Address */}
                              {site.address && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                                    Address
                                  </label>
                                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#161616' }}>
                                    {site.address}
                                  </p>
                                </div>
                              )}

                              {/* Description */}
                              {site.description && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                                    Description
                                  </label>
                                  <p
                                    style={{
                                      margin: '0.5rem 0 0 0',
                                      fontSize: '0.875rem',
                                      color: '#525252',
                                      fontStyle: 'italic',
                                      backgroundColor: '#f4f4f4',
                                      padding: '0.75rem',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    {site.description}
                                  </p>
                                </div>
                              )}

                              {/* Environmental Zone */}
                              <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                                  Environmental Zone
                                </label>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#161616' }}>
                                  {site.zone}
                                </p>
                              </div>

                              {/* Contact */}
                              <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                                  Contact
                                </label>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#161616' }}>
                                  {site.contactPerson} • {site.contactPhone}
                                </p>
                              </div>
                            </div>

                            {/* RIGHT COLUMN (40%) */}
                            <div style={{ flex: '0 0 40%' }}>
                              {/* GPS SECTION */}
                              <div
                                style={{
                                  backgroundColor: '#f4f4f4',
                                  borderRadius: '6px',
                                  padding: '1rem',
                                  marginBottom: '1.5rem',
                                }}
                              >
                                <h5 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.75rem 0', color: '#161616' }}>
                                  GPS Coordinates
                                </h5>
                                <div style={{ marginBottom: '0.75rem' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>Latitude</label>
                                  <p
                                    style={{
                                      margin: '0.25rem 0 0 0',
                                      fontSize: '0.875rem',
                                      fontFamily: 'monospace',
                                      color: '#161616',
                                    }}
                                  >
                                    {site.lat.toFixed(4)}
                                  </p>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>Longitude</label>
                                  <p
                                    style={{
                                      margin: '0.25rem 0 0 0',
                                      fontSize: '0.875rem',
                                      fontFamily: 'monospace',
                                      color: '#161616',
                                    }}
                                  >
                                    {site.lng.toFixed(4)}
                                  </p>
                                </div>
                                <button
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    backgroundColor: '#fff',
                                    border: '1px solid #0f62fe',
                                    color: '#0f62fe',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  Capture GPS
                                </button>
                              </div>

                              {/* COLLECTION HISTORY CARD */}
                              <div
                                style={{
                                  backgroundColor: '#f4f4f4',
                                  borderRadius: '6px',
                                  padding: '1rem',
                                  marginBottom: '1.5rem',
                                }}
                              >
                                <h5 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.75rem 0', color: '#161616' }}>
                                  Collection History
                                </h5>
                                <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>Last Collection:</span>
                                  <span style={{ fontSize: '0.875rem', color: '#161616' }}>{site.lastCollection || '—'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>Total Collections:</span>
                                  <span style={{ fontSize: '0.875rem', color: '#161616' }}>{site.totalCollections}</span>
                                </div>
                              </div>

                              {/* FHIR SYNC CARD */}
                              <div
                                style={{
                                  backgroundColor: '#f4f4f4',
                                  borderRadius: '6px',
                                  padding: '1rem',
                                  marginBottom: '1.5rem',
                                }}
                              >
                                <h5 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.75rem 0', color: '#161616' }}>
                                  FHIR Sync
                                </h5>
                                <div style={{ marginBottom: '0.5rem' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>Resource ID</label>
                                  <p
                                    style={{
                                      margin: '0.25rem 0 0 0',
                                      fontSize: '0.75rem',
                                      fontFamily: 'monospace',
                                      color: '#0f62fe',
                                    }}
                                  >
                                    {site.fhirId || 'N/A'}
                                  </p>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>Last Sync</label>
                                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#161616' }}>
                                    {site.lastSync || 'Never'}
                                  </p>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.375rem',
                                      padding: '0.25rem 0.5rem',
                                      background: '#defbe6',
                                      color: '#0e6027',
                                      borderRadius: '10px',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#24a148', display: 'inline-block' }} />
                                    Synced
                                  </span>
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>Server</label>
                                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#0f62fe' }}>
                                    hapi.openelis.org
                                  </p>
                                </div>
                              </div>

                              {/* SOURCE & TIMESTAMPS */}
                              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    backgroundColor: site.source === 'local' ? '#e5f6f5' : '#e3f1ff',
                                    color: site.source === 'local' ? '#0e6027' : '#0043ce',
                                  }}
                                >
                                  {site.source === 'local' ? 'LOCAL' : 'HUB'}
                                </span>
                              </div>

                              {/* TIMESTAMPS */}
                              <div style={{ fontSize: '0.75rem' }}>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: 600, color: '#666' }}>Created:</span>
                                  <span style={{ color: '#525252' }}>{site.created}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: 600, color: '#666' }}>Modified:</span>
                                  <span style={{ color: '#525252' }}>{site.modified}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ACTION BAR */}
                          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            {site.source === 'local' ? (
                              <>
                                <button
                                  onClick={() => setEditingRow(site.code)}
                                  style={{
                                    padding: '0.5rem 1.25rem',
                                    backgroundColor: '#0f62fe',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeactivatingRow(site.code)}
                                  style={{
                                    padding: '0.5rem 1.25rem',
                                    backgroundColor: '#fff',
                                    color: '#da1e28',
                                    border: '1px solid #da1e28',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  Deactivate
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setForkingRow(site.code)}
                                  style={{
                                    padding: '0.5rem 1.25rem',
                                    backgroundColor: '#0f62fe',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  Create Local Copy
                                </button>
                                <button
                                  disabled
                                  style={{
                                    padding: '0.5rem 1.25rem',
                                    backgroundColor: '#e0e0e0',
                                    color: '#a8a8a8',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '4px',
                                    cursor: 'not-allowed',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                  }}
                                  title="Managed by FHIR server — create a local copy to edit"
                                >
                                  Edit
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setExpandedRow(null)}
                              style={{
                                padding: '0.5rem 1.25rem',
                                backgroundColor: '#fff',
                                color: '#525252',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                              }}
                            >
                              Close
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* FORK CONFIRMATION PANEL */}
                    {forkingRow === site.code && (
                      <tr
                        style={{
                          backgroundColor: '#fff8e1',
                          borderBottom: '2px solid #e0e0e0',
                          borderLeft: '3px solid #f1c21b',
                        }}
                      >
                        <td colSpan="10" style={{ padding: '1.5rem' }}>
                          <div style={{ maxWidth: '600px' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.75rem 0', color: '#161616' }}>
                              Create Local Copy of {site.code}?
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: '#525252', margin: '0 0 1.5rem 0' }}>
                              This will create a new site record under your control that you can edit independently. The original HUB record will be optionally deactivated.
                            </p>

                            <div style={{ marginBottom: '1.5rem' }}>
                              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#161616' }}>
                                New Site Code
                              </label>
                              <input
                                type="text"
                                defaultValue={`${site.code}-LOCAL`}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                              <label style={{ fontSize: '0.875rem', color: '#161616' }}>
                                Deactivate the HUB original ({site.code})
                              </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setForkingRow(null)}
                                style={{
                                  padding: '0.5rem 1.25rem',
                                  backgroundColor: '#fff',
                                  color: '#525252',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => setForkingRow(null)}
                                style={{
                                  padding: '0.5rem 1.25rem',
                                  backgroundColor: '#0f62fe',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                }}
                              >
                                Create Local Copy
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* DEACTIVATE CONFIRMATION PANEL */}
                    {deactivatingRow === site.code && (
                      <tr
                        style={{
                          backgroundColor: '#fff1f1',
                          borderBottom: '2px solid #e0e0e0',
                          borderLeft: '3px solid #da1e28',
                        }}
                      >
                        <td colSpan="10" style={{ padding: '1.5rem' }}>
                          <div style={{ maxWidth: '600px' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.75rem 0', color: '#161616' }}>
                              Deactivate {site.code}?
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: '#525252', margin: '0 0 1.5rem 0' }}>
                              This site will no longer appear in searches. You can reactivate it later if needed.
                            </p>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setDeactivatingRow(null)}
                                style={{
                                  padding: '0.5rem 1.25rem',
                                  backgroundColor: '#fff',
                                  color: '#525252',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => setDeactivatingRow(null)}
                                style={{
                                  padding: '0.5rem 1.25rem',
                                  backgroundColor: '#da1e28',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                }}
                              >
                                Confirm Deactivate
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    {/* i18n: No sites found */}
                    No sites found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid #e0e0e0',
            textAlign: 'right',
            fontSize: '0.875rem',
            color: '#666',
          }}
        >
          {/* i18n: Showing X of Y sites */}
          Showing {filtered.length} of {SAMPLE_SITES.length} sites
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 2: SITE DETAIL / EDIT FORM
// ============================================================================

function SiteDetailForm({ initialSite = SAMPLE_SITES[0] }) {
  const [site, setSite] = useState(initialSite);
  const [selectedRegion, setSelectedRegion] = useState(site.region);
  const [selectedType, setSelectedType] = useState(site.type);

  const handleFieldChange = (field, value) => {
    setSite((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    handleFieldChange('region', region);
    handleFieldChange('district', '');
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    handleFieldChange('type', type);
    handleFieldChange('subtype', '');
  };

  // i18n: status indicator
  const getSourceBadge = (source) => {
    return (
      <div
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: source === 'hub' ? '#0f62fe' : '#e0e0e0',
          color: source === 'hub' ? '#fff' : '#525252',
        }}
      >
        {source === 'hub' ? 'HUB' : 'LOCAL'}
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
            {/* i18n: Edit Sampling Site */}
            Edit Sampling Site
          </h1>
          <p style={{ margin: 0, color: '#666' }}>
            {/* i18n: Code prefix */}
            {site.code} — {site.name}
          </p>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '2rem' }}>
          {/* LEFT COLUMN: FORM */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            {/* SITE CODE */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Site Code */}
                Site Code <span style={{ color: '#da1e28' }}>*</span>
              </label>
              <input
                type="text"
                value={site.code}
                onChange={(e) => handleFieldChange('code', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                {/* i18n: Auto-generated code help text */}
                Auto-generated. Edit to override.
              </p>
            </div>

            {/* SITE NAME */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Site Name */}
                Site Name <span style={{ color: '#da1e28' }}>*</span>
              </label>
              <input
                type="text"
                value={site.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* SITE TYPE */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Site Type */}
                Site Type <span style={{ color: '#da1e28' }}>*</span>
              </label>
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {SITE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBTYPE */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Subtype */}
                Subtype <span style={{ color: '#da1e28' }}>*</span>
              </label>
              <select
                value={site.subtype}
                onChange={(e) => handleFieldChange('subtype', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">— Select Subtype —</option>
                {SITE_SUBTYPES[selectedType]?.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* LOCATION SECTION */}
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem', color: '#161616' }}>
              {/* i18n: Location */}
              Location
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Region */}
                Region <span style={{ color: '#da1e28' }}>*</span>
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">— Select Region —</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: District */}
                District <span style={{ color: '#da1e28' }}>*</span>
              </label>
              <select
                value={site.district}
                onChange={(e) => handleFieldChange('district', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">— Select District —</option>
                {DISTRICTS[selectedRegion]?.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Town/Village */}
                Town / Village
              </label>
              <input
                type="text"
                value={site.zone}
                onChange={(e) => handleFieldChange('zone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Address */}
                Address
              </label>
              <textarea
                value={site.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  minHeight: '4rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Description */}
                Description
              </label>
              <textarea
                value={site.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  minHeight: '4rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Environmental Zone */}
                Environmental Zone
              </label>
              <select
                value={site.zone}
                onChange={(e) => handleFieldChange('zone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* CONTACT INFO */}
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem', color: '#161616' }}>
              {/* i18n: Contact Information */}
              Contact Information
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Contact Person */}
                Contact Person
              </label>
              <input
                type="text"
                value={site.contactPerson}
                onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {/* i18n: Contact Phone */}
                Contact Phone
              </label>
              <input
                type="tel"
                value={site.contactPhone}
                onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: GPS & METADATA */}
          <div>
            {/* GPS SECTION */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem', color: '#161616' }}>
                {/* i18n: GPS Coordinates */}
                GPS Coordinates
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {/* i18n: Latitude */}
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={site.lat}
                  onChange={(e) => handleFieldChange('lat', parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {/* i18n: Longitude */}
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={site.lng}
                  onChange={(e) => handleFieldChange('lng', parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {/* i18n: Elevation (meters) */}
                  Elevation (m)
                </label>
                <input
                  type="number"
                  value={site.elevation}
                  onChange={(e) => handleFieldChange('elevation', parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0f62fe',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <MapPin size={16} />
                {/* i18n: Capture GPS */}
                Capture GPS
              </button>
            </div>

            {/* MAP PLACEHOLDER */}
            <div
              style={{
                backgroundColor: '#f4f4f4',
                borderRadius: '8px',
                padding: '2rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                border: '2px dashed #e0e0e0',
              }}
            >
              <MapPin size={32} style={{ color: '#a8a8a8', marginBottom: '0.5rem' }} />
              <p style={{ margin: '0.5rem 0', color: '#a8a8a8', fontSize: '0.875rem', textAlign: 'center' }}>
                {/* i18n: Map placeholder text */}
                Map showing location at
              </p>
              <p
                style={{
                  margin: '0',
                  color: '#525252',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
              </p>
            </div>

            {/* COLLECTION HISTORY */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem', color: '#161616' }}>
                {/* i18n: Collection History */}
                Collection History
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {/* i18n: Last Collection */}
                  Last Collection:
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#161616' }}>
                  {site.lastCollection || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {/* i18n: Total Collections */}
                  Total Collections:
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#161616' }}>
                  {site.totalCollections}
                </span>
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid #0f62fe',
                  color: '#0f62fe',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {/* i18n: View Orders */}
                View Orders
              </button>
            </div>

            {/* STATUS & SOURCE */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {/* i18n: Status */}
                  Status
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleFieldChange('status', 'active')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: site.status === 'active' ? '#0e6027' : '#e0e0e0',
                      color: site.status === 'active' ? '#fff' : '#525252',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {/* i18n: Active */}
                    Active
                  </button>
                  <button
                    onClick={() => handleFieldChange('status', 'inactive')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: site.status === 'inactive' ? '#525252' : '#e0e0e0',
                      color: site.status === 'inactive' ? '#fff' : '#525252',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {/* i18n: Inactive */}
                    Inactive
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#f4f4f4',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {/* i18n: Source */}
                  Source:
                </span>
                {getSourceBadge(site.source)}
              </div>
            </div>

            {/* FHIR SYNC */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem', color: '#161616' }}>
                {/* i18n: FHIR Sync */}
                FHIR Location Sync
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {/* i18n: FHIR Resource ID */}
                  Resource ID:
                </span>
                <span style={{ fontSize: '0.75rem', color: '#525252', fontFamily: 'monospace' }}>Location/site-ws-001</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {/* i18n: Last Sync */}
                  Last Sync:
                </span>
                <span style={{ fontSize: '0.875rem', color: '#525252' }}>2026-04-02 10:28</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {/* i18n: Sync Status */}
                  Status:
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.125rem 0.5rem',
                    background: '#defbe6',
                    color: '#0e6027',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#24a148', display: 'inline-block' }} />
                  Synced
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {/* i18n: FHIR Server */}
                  Server:
                </span>
                <span style={{ fontSize: '0.75rem', color: '#0f62fe' }}>hapi.openelis.org</span>
              </div>
            </div>

            {/* TIMESTAMPS */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem', color: '#161616' }}>
                {/* i18n: Timestamps */}
                Timestamps
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {/* i18n: Created */}
                  Created:
                </span>
                <span style={{ fontSize: '0.875rem', color: '#525252' }}>{site.created}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {/* i18n: Modified */}
                  Modified:
                </span>
                <span style={{ fontSize: '0.875rem', color: '#525252' }}>{site.modified}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
          }}
        >
          <button
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#161616',
            }}
          >
            {/* i18n: Cancel */}
            Cancel
          </button>
          <button
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#0f62fe',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
            }}
          >
            {/* i18n: Save */}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 3: INLINE SITE SEARCH (ORDER ENTRY CONTEXT)
// ============================================================================

function InlineSiteSearch() {
  const [step] = useState(1);
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSite, setNewSite] = useState({
    name: '',
    type: 'WATER_SOURCE',
    subtype: '',
    region: '',
    district: '',
    lat: '',
    lng: '',
  });

  const handleSearch = () => {
    const results = SAMPLE_SITES.filter((site) => {
      const codeMatch = !searchCode || site.code.toLowerCase().includes(searchCode.toLowerCase());
      const nameMatch = !searchName || site.name.toLowerCase().includes(searchName.toLowerCase());
      const regionMatch = !searchRegion || site.region === searchRegion;
      return codeMatch && nameMatch && regionMatch;
    });
    setSearchResults(results);
  };

  const handleSelectSite = (site) => {
    setSelectedSite(site);
    setSearchResults([]);
    setShowNewForm(false);
  };

  const handleNewSiteChange = (field, value) => {
    setNewSite((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* STEP INDICATOR */}
        <div
          style={{
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: '#fff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#0f62fe',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}
          >
            {step}
          </div>
          <span style={{ fontWeight: 600, color: '#161616' }}>
            {/* i18n: Step indicator */}
            Step {step} of 4: Select Sampling Site
          </span>
        </div>

        {/* MAIN CONTENT */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 0, marginBottom: '1.5rem' }}>
            {/* i18n: Subject - Sampling Site */}
            Subject — Sampling Site
          </h2>

          {!selectedSite ? (
            <>
              {/* SEARCH SECTION */}
              <div
                style={{
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#f4f4f4',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem' }}>
                  {/* i18n: Search for Site */}
                  Search for Site
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {/* i18n: Site Code or Name */}
                      Site Code or Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., WS-001 or Ciliwung"
                      value={searchCode || searchName}
                      onChange={(e) => {
                        setSearchCode(e.target.value);
                        setSearchName(e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {/* i18n: Region */}
                      Region
                    </label>
                    <select
                      value={searchRegion}
                      onChange={(e) => setSearchRegion(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="">All Regions</option>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={handleSearch}
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#0f62fe',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Search size={16} />
                      {/* i18n: Search */}
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* SEARCH RESULTS */}
              {searchResults.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    {/* i18n: Search Results (count) */}
                    Search Results ({searchResults.length})
                  </h3>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.875rem',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '1px solid #e0e0e0' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                          {/* i18n: Code */}
                          Code
                        </th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                          {/* i18n: Name */}
                          Name
                        </th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                          {/* i18n: Type */}
                          Type
                        </th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                          {/* i18n: Location */}
                          Location
                        </th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>
                          {/* i18n: Action */}
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((site, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid #e0e0e0',
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                          }}
                        >
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#0f62fe' }}>
                            {site.code}
                          </td>
                          <td style={{ padding: '0.75rem' }}>{site.name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <Tag
                              type="gray"
                              style={{
                                backgroundColor: getTypeColor(site.type),
                                color: '#fff',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                              }}
                            >
                              {getTypeLabel(site.type)}
                            </Tag>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {site.district}, {site.region}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleSelectSite(site)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                backgroundColor: '#0f62fe',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              {/* i18n: Select */}
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* OR CREATE NEW SITE */}
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#f4f4f4',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <button
                  onClick={() => setShowNewForm(!showNewForm)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#fff',
                    border: '1px solid #0f62fe',
                    color: '#0f62fe',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: showNewForm ? '1rem' : 0,
                  }}
                >
                  <Plus size={16} />
                  {/* i18n: Create New Site */}
                  {showNewForm ? 'Cancel New Site' : '+ Create New Site'}
                </button>

                {showNewForm && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem' }}>
                      {/* i18n: New Site Details */}
                      New Site Details
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                          {/* i18n: Site Name */}
                          Site Name
                        </label>
                        <input
                          type="text"
                          value={newSite.name}
                          onChange={(e) => handleNewSiteChange('name', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                          {/* i18n: Site Type */}
                          Site Type
                        </label>
                        <select
                          value={newSite.type}
                          onChange={(e) => handleNewSiteChange('type', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                          }}
                        >
                          {SITE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                          {/* i18n: Subtype */}
                          Subtype
                        </label>
                        <select
                          value={newSite.subtype}
                          onChange={(e) => handleNewSiteChange('subtype', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="">Select Subtype</option>
                          {SITE_SUBTYPES[newSite.type]?.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                          {/* i18n: Region */}
                          Region
                        </label>
                        <select
                          value={newSite.region}
                          onChange={(e) => handleNewSiteChange('region', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="">Select Region</option>
                          {REGIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                          {/* i18n: District */}
                          District
                        </label>
                        <select
                          value={newSite.district}
                          onChange={(e) => handleNewSiteChange('district', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="">Select District</option>
                          {DISTRICTS[newSite.region]?.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                          {/* i18n: Latitude */}
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newSite.lat}
                          onChange={(e) => handleNewSiteChange('lat', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                          {/* i18n: Longitude */}
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newSite.lng}
                          onChange={(e) => handleNewSiteChange('lng', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSite({ ...newSite, code: 'NEW-001' });
                        setShowNewForm(false);
                      }}
                      style={{
                        padding: '0.5rem 1.5rem',
                        backgroundColor: '#0f62fe',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {/* i18n: Create Site */}
                      Create Site
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* SELECTED SITE CARD */}
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#f4f4f4',
                  borderRadius: '8px',
                  border: '2px solid #0e6027',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                    {/* i18n: Selected Site */}
                    Selected: {selectedSite.name}
                  </h3>
                  <button
                    onClick={() => setSelectedSite(null)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {/* i18n: Change */}
                    Change
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>
                      {/* i18n: Code */}
                      Code
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600 }}>
                      {selectedSite.code}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>
                      {/* i18n: Type */}
                      Type
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      <Tag
                        type="gray"
                        style={{
                          backgroundColor: getTypeColor(selectedSite.type),
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        {getTypeLabel(selectedSite.type)}
                      </Tag>
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>
                      {/* i18n: Location */}
                      Location
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      {selectedSite.district}, {selectedSite.region}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>
                      {/* i18n: GPS */}
                      GPS
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {selectedSite.lat?.toFixed(4) || 'N/A'}, {selectedSite.lng?.toFixed(4) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PROCEED MESSAGE */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#d0e2ff',
                  border: '1px solid #0f62fe',
                  borderRadius: '4px',
                  color: '#0043ce',
                  fontSize: '0.875rem',
                }}
              >
                {/* i18n: Proceed message */}
                Site selected. Click "Next" to proceed to the next step.
              </div>
            </>
          )}
        </div>

        {/* NAVIGATION BUTTONS */}
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
          }}
        >
          <button
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#161616',
            }}
          >
            {/* i18n: Previous */}
            Previous
          </button>
          <button
            disabled={!selectedSite}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: selectedSite ? '#0f62fe' : '#d0d0d0',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedSite ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
            }}
          >
            {/* i18n: Next */}
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: TAB SWITCHER
// ============================================================================

export default function S02SamplingRegistry() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {/* TAB BAR */}
      <div
        style={{
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          backgroundColor: '#fff',
        }}
      >
        <button
          onClick={() => setActiveTab(0)}
          style={{
            padding: '1rem 1.5rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 0 ? '#0f62fe' : '#525252',
            borderBottom: activeTab === 0 ? '3px solid #0f62fe' : 'none',
            marginBottom: '-1px',
          }}
        >
          {/* i18n: Site Registry List */}
          Site Registry List
        </button>
        <button
          onClick={() => setActiveTab(1)}
          style={{
            padding: '1rem 1.5rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 1 ? '#0f62fe' : '#525252',
            borderBottom: activeTab === 1 ? '3px solid #0f62fe' : 'none',
            marginBottom: '-1px',
          }}
        >
          {/* i18n: Site Detail Form */}
          Site Detail Form
        </button>
        <button
          onClick={() => setActiveTab(2)}
          style={{
            padding: '1rem 1.5rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 2 ? '#0f62fe' : '#525252',
            borderBottom: activeTab === 2 ? '3px solid #0f62fe' : 'none',
            marginBottom: '-1px',
          }}
        >
          {/* i18n: Order Entry — Site Search */}
          Order Entry — Site Search
        </button>
      </div>

      {/* TAB CONTENT */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && <SiteRegistryList />}
        {activeTab === 1 && <SiteDetailForm />}
        {activeTab === 2 && <InlineSiteSearch />}
      </div>
    </div>
  );
}
