import React, { useState } from 'react';

// Mock Data
const mockQCData = {
  instruments: [
    {
      id: 'INST-001',
      name: 'Hemoglobin Analyzer',
      status: 'pass',
      lastCalibrated: '2026-02-28',
      nextCalibration: '2026-03-28',
      location: 'Lab A',
      manufacturer: 'Abbott',
      controlChartData: [95, 98, 102, 101, 99, 104, 103, 100, 99, 98, 97, 101, 102, 100, 99],
      ruleViolations: [],
      qcRules: ['1-2s', '2-2s', 'R-4s', '4-1s', '10x', '2of3-2s']
    },
    {
      id: 'INST-002',
      name: 'Chemistry Analyzer',
      status: 'warning',
      lastCalibrated: '2026-02-20',
      nextCalibration: '2026-03-20',
      location: 'Lab B',
      manufacturer: 'Roche',
      controlChartData: [98, 101, 105, 103, 100, 108, 106, 102, 99, 97, 96, 100, 103, 101, 104],
      ruleViolations: ['1-2s'],
      qcRules: ['1-2s', '2-2s', 'R-4s', '4-1s', '10x', '2of3-2s']
    },
    {
      id: 'INST-003',
      name: 'Urinalysis System',
      status: 'error',
      lastCalibrated: '2026-02-15',
      nextCalibration: '2026-03-15',
      location: 'Lab C',
      manufacturer: 'Siemens',
      controlChartData: [92, 95, 110, 112, 115, 118, 120, 122, 125, 128, 130, 132, 135, 138, 140],
      ruleViolations: ['2-2s', '10x'],
      qcRules: ['1-2s', '2-2s', 'R-4s', '4-1s', '10x', '2of3-2s']
    },
    {
      id: 'INST-004',
      name: 'Immunoassay System',
      status: 'pass',
      lastCalibrated: '2026-02-25',
      nextCalibration: '2026-03-25',
      location: 'Lab A',
      manufacturer: 'Beckman Coulter',
      controlChartData: [100, 99, 101, 102, 98, 100, 101, 99, 100, 102, 101, 99, 98, 100, 99],
      ruleViolations: [],
      qcRules: ['1-2s', '2-2s', 'R-4s', '4-1s', '10x', '2of3-2s']
    },
    {
      id: 'INST-005',
      name: 'Blood Gas Analyzer',
      status: 'pass',
      lastCalibrated: '2026-03-01',
      nextCalibration: '2026-03-31',
      location: 'Lab D',
      manufacturer: 'GE Healthcare',
      controlChartData: [101, 100, 99, 101, 102, 100, 99, 101, 102, 100, 99, 101, 100, 102, 101],
      ruleViolations: [],
      qcRules: ['1-2s', '2-2s', 'R-4s', '4-1s', '10x', '2of3-2s']
    },
    {
      id: 'INST-006',
      name: 'Coagulation Analyzer',
      status: 'warning',
      lastCalibrated: '2026-02-18',
      nextCalibration: '2026-03-18',
      location: 'Lab B',
      manufacturer: 'Sysmex',
      controlChartData: [103, 104, 105, 107, 109, 111, 113, 115, 117, 119, 121, 123, 125, 127, 129],
      ruleViolations: ['4-1s'],
      qcRules: ['1-2s', '2-2s', 'R-4s', '4-1s', '10x', '2of3-2s']
    }
  ],
  alerts: [
    {
      id: 'ALT-001',
      instrumentId: 'INST-003',
      type: 'critical',
      message: 'Westgard Rules Violation: 10x Rule - Control values exceed acceptable range',
      timestamp: '2026-03-03T10:30:00Z',
      status: 'unresolved'
    },
    {
      id: 'ALT-002',
      instrumentId: 'INST-002',
      type: 'warning',
      message: 'Westgard Rules Violation: 1-2s Rule - Single control value outside 2SD',
      timestamp: '2026-03-03T09:15:00Z',
      status: 'unresolved'
    },
    {
      id: 'ALT-003',
      instrumentId: 'INST-006',
      type: 'warning',
      message: 'Westgard Rules Violation: 4-1s Rule - Four consecutive values exceeding 1SD',
      timestamp: '2026-03-03T08:45:00Z',
      status: 'unresolved'
    },
    {
      id: 'ALT-004',
      instrumentId: 'INST-001',
      type: 'info',
      message: 'Calibration due in 25 days',
      timestamp: '2026-03-01T14:20:00Z',
      status: 'resolved'
    }
  ],
  correctiveActions: [
    {
      id: 'CA-001',
      instrumentId: 'INST-003',
      alertId: 'ALT-001',
      title: 'Urinalysis System Recalibration',
      description: 'Recalibrate urinalysis system due to sustained control value drift',
      status: 'in-progress',
      assignedTo: 'John Smith',
      dueDate: '2026-03-05',
      createdDate: '2026-03-03',
      priority: 'high'
    },
    {
      id: 'CA-002',
      instrumentId: 'INST-002',
      alertId: 'ALT-002',
      title: 'Chemistry Analyzer QC Review',
      description: 'Review and rerun QC materials for chemistry analyzer',
      status: 'pending',
      assignedTo: 'Sarah Johnson',
      dueDate: '2026-03-04',
      createdDate: '2026-03-03',
      priority: 'medium'
    },
    {
      id: 'CA-003',
      instrumentId: 'INST-006',
      alertId: 'ALT-003',
      title: 'Coagulation System Verification',
      description: 'Verify coagulation system performance with fresh QC materials',
      status: 'pending',
      assignedTo: 'Mike Davis',
      dueDate: '2026-03-06',
      createdDate: '2026-03-03',
      priority: 'medium'
    },
    {
      id: 'CA-004',
      instrumentId: 'INST-001',
      alertId: null,
      title: 'Hemoglobin Analyzer Maintenance',
      description: 'Perform routine maintenance on hemoglobin analyzer',
      status: 'completed',
      assignedTo: 'John Smith',
      dueDate: '2026-02-28',
      createdDate: '2026-02-20',
      priority: 'low'
    }
  ],
  qcConfiguration: {
    organizationName: 'OpenELIS Global Laboratory',
    laboratoryName: 'Central Reference Lab',
    westgardRulesEnabled: true,
    rules: {
      '1-2s': { enabled: true, description: 'Single control value exceeds 2 standard deviations' },
      '2-2s': { enabled: true, description: 'Two consecutive control values exceed 2 standard deviations' },
      'R-4s': { enabled: true, description: 'Range between consecutive values exceeds 4 standard deviations' },
      '4-1s': { enabled: true, description: 'Four consecutive values exceed 1 standard deviation' },
      '10x': { enabled: true, description: 'Ten consecutive values on same side of mean' },
      '2of3-2s': { enabled: true, description: 'Two of three consecutive values exceed 2 standard deviations' }
    },
    controlMaterial: 'Liquid Unassayed',
    controlLevel: 'Level 1, Level 2, Level 3',
    samplingFrequency: '2 runs per shift',
    calibrationInterval: '30 days'
  }
};

// Simple SVG Icons
const IconAlertCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const IconCheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const IconChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// Header Component
function Header({ onMenuClick }) {
  return (
    <div style={{ backgroundColor: '#1f2937', color: 'white', padding: '1rem 1.5rem', borderBottom: '1px solid #374151' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onMenuClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            <IconMenu />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Laboratory Compliance Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
            OpenELIS Global
          </span>
        </div>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
          onClick={onClose}
        />
      )}
      <div
        style={{
          position: isOpen ? 'fixed' : 'absolute',
          left: 0,
          top: '3.5rem',
          width: '250px',
          backgroundColor: '#f3f4f6',
          borderRight: '1px solid #e5e7eb',
          zIndex: 50,
          maxHeight: 'calc(100vh - 3.5rem)',
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease'
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280' }}>
            Navigation
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <a href="#" style={{ padding: '0.75rem', color: '#1f2937', textDecoration: 'none', borderRadius: '0.375rem', backgroundColor: '#e5e7eb', display: 'block' }}>
              Dashboard
            </a>
            <a href="#" style={{ padding: '0.75rem', color: '#374151', textDecoration: 'none', borderRadius: '0.375rem', display: 'block' }}>
              Instruments
            </a>
            <a href="#" style={{ padding: '0.75rem', color: '#374151', textDecoration: 'none', borderRadius: '0.375rem', display: 'block' }}>
              Control Charts
            </a>
            <a href="#" style={{ padding: '0.75rem', color: '#374151', textDecoration: 'none', borderRadius: '0.375rem', display: 'block' }}>
              QC Configuration
            </a>
            <a href="#" style={{ padding: '0.75rem', color: '#374151', textDecoration: 'none', borderRadius: '0.375rem', display: 'block' }}>
              Reports
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// Tabs Component
function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{ borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', gap: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '1rem',
              backgroundColor: activeTab === tab.id ? 'white' : '#f9fafb',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? '#1f2937' : '#6b7280',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const statusStyles = {
    pass: { backgroundColor: '#d1fae5', color: '#065f46' },
    warning: { backgroundColor: '#fef3c7', color: '#92400e' },
    error: { backgroundColor: '#fee2e2', color: '#991b1b' },
    'in-progress': { backgroundColor: '#dbeafe', color: '#1e40af' },
    pending: { backgroundColor: '#fef3c7', color: '#92400e' },
    completed: { backgroundColor: '#d1fae5', color: '#065f46' },
    unresolved: { backgroundColor: '#fee2e2', color: '#991b1b' },
    resolved: { backgroundColor: '#d1fae5', color: '#065f46' }
  };

  const style = statusStyles[status] || statusStyles.pass;

  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '500',
      ...style
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Instrument Grid Card
function InstrumentCard({ instrument, onSelect }) {
  const statusIcons = {
    pass: <IconCheckCircle />,
    warning: <IconAlertTriangle />,
    error: <IconAlertCircle />
  };

  const statusColors = {
    pass: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  return (
    <div
      onClick={() => onSelect(instrument)}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        ':hover': { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
            {instrument.name}
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            {instrument.manufacturer} • {instrument.location}
          </p>
        </div>
        <div style={{ color: statusColors[instrument.status], display: 'flex' }}>
          {statusIcons[instrument.status]}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <div>
          <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280' }}>Last Calibrated</p>
          <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>
            {new Date(instrument.lastCalibrated).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280' }}>Next Calibration</p>
          <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>
            {new Date(instrument.nextCalibration).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>QC Rules Enabled</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {instrument.qcRules.map((rule) => (
            <span
              key={rule}
              style={{
                backgroundColor: '#f3f4f6',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#374151'
              }}
            >
              {rule}
            </span>
          ))}
        </div>
      </div>

      {instrument.ruleViolations.length > 0 && (
        <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem', borderLeft: '3px solid #ef4444' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#991b1b' }}>
            {instrument.ruleViolations.length} Westgard Rule Violation{instrument.ruleViolations.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

// Instrument Grid
function InstrumentGrid({ instruments, onSelectInstrument }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {instruments.map((instrument) => (
        <InstrumentCard
          key={instrument.id}
          instrument={instrument}
          onSelect={onSelectInstrument}
        />
      ))}
    </div>
  );
}

// Control Chart Component
function ControlChart({ data, instrumentName }) {
  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const range = max - min;
  const mean = 100;
  const twoSD = 4;

  const getY = (value) => {
    return ((value - min) / range) * 200;
  };

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 400;
    const y = 200 - getY(value);
    return `${x},${y}`;
  }).join(' ');

  const meanY = 200 - getY(mean);
  const upperLimitY = 200 - getY(mean + twoSD * 2);
  const lowerLimitY = 200 - getY(mean - twoSD * 2);

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
        Control Chart - {instrumentName}
      </h3>
      <svg width="100%" height="300" viewBox="0 0 500 250" style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
        <defs>
          <pattern id="gridPattern" width="40" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="20" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="40" y2="0" stroke="#e5e7eb" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="500" height="250" fill="white" />
        <rect width="500" height="250" fill="url(#gridPattern)" />

        {/* Upper control limit */}
        <line x1="0" y1={upperLimitY} x2="400" y2={upperLimitY} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" />

        {/* Mean line */}
        <line x1="0" y1={meanY} x2="400" y2={meanY} stroke="#3b82f6" strokeWidth="2" />

        {/* Lower control limit */}
        <line x1="0" y1={lowerLimitY} x2="400" y2={lowerLimitY} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" />

        {/* Data points line */}
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" />

        {/* Data points */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * 400;
          const y = 200 - getY(value);
          return (
            <circle key={index} cx={x} cy={y} r="3" fill="#10b981" />
          );
        })}

        {/* Axes */}
        <line x1="40" y1="0" x2="40" y2="220" stroke="#1f2937" strokeWidth="2" />
        <line x1="40" y1="220" x2="420" y2="220" stroke="#1f2937" strokeWidth="2" />

        {/* Labels */}
        <text x="20" y="115" fontSize="12" fill="#6b7280" textAnchor="end">Value</text>
        <text x="230" y="240" fontSize="12" fill="#6b7280" textAnchor="middle">Run Number</text>
      </svg>

      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
        <div>
          <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280' }}>UCL (2SD)</p>
          <p style={{ margin: 0, fontWeight: '600', color: '#ef4444' }}>{mean + twoSD * 2}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280' }}>Mean</p>
          <p style={{ margin: 0, fontWeight: '600', color: '#3b82f6' }}>{mean}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280' }}>LCL (2SD)</p>
          <p style={{ margin: 0, fontWeight: '600', color: '#ef4444' }}>{mean - twoSD * 2}</p>
        </div>
      </div>
    </div>
  );
}

// Alerts Feed Component
function AlertsFeed({ alerts, instruments }) {
  const getInstrumentName = (instrumentId) => {
    return instruments.find(i => i.id === instrumentId)?.name || 'Unknown';
  };

  const alertTypeIcons = {
    critical: <IconAlertCircle />,
    warning: <IconAlertTriangle />,
    info: <IconAlertTriangle />
  };

  const alertColors = {
    critical: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', icon: '#dc2626' },
    warning: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', icon: '#f59e0b' },
    info: { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af', icon: '#3b82f6' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {alerts.map((alert) => {
        const colors = alertColors[alert.type];
        return (
          <div
            key={alert.id}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: '0.5rem',
              padding: '1.25rem',
              backgroundColor: colors.bg
            }}
          >
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ color: colors.icon, paddingTop: '0.25rem', minWidth: '20px' }}>
                {alertTypeIcons[alert.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>
                      {getInstrumentName(alert.instrumentId)}
                    </p>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: colors.text }}>
                      {alert.message}
                    </p>
                  </div>
                  <StatusBadge status={alert.status} />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      {alerts.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          <p>No alerts at this time</p>
        </div>
      )}
    </div>
  );
}

// Corrective Actions Component
function CorrectiveActions({ actions, instruments }) {
  const getInstrumentName = (instrumentId) => {
    return instruments.find(i => i.id === instrumentId)?.name || 'Unknown';
  };

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {actions.map((action) => (
        <div
          key={action.id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1.25rem',
            backgroundColor: 'white'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>
                {getInstrumentName(action.instrumentId)}
              </p>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                {action.title}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: priorityColors[action.priority]
                }}
              />
              <StatusBadge status={action.status} />
            </div>
          </div>

          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#374151' }}>
            {action.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280' }}>Assigned To</p>
              <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>{action.assignedTo}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280' }}>Due Date</p>
              <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>
                {new Date(action.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280' }}>Created</p>
              <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>
                {new Date(action.createdDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
      {actions.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          <p>No corrective actions</p>
        </div>
      )}
    </div>
  );
}

// QC Configuration Component
function QCConfiguration({ config }) {
  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280' }}>
            Organization Settings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                Organization Name
              </label>
              <p style={{ margin: 0, padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', color: '#1f2937' }}>
                {config.organizationName}
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                Laboratory Name
              </label>
              <p style={{ margin: 0, padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', color: '#1f2937' }}>
                {config.laboratoryName}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280' }}>
            QC Settings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                Control Material
              </label>
              <p style={{ margin: 0, padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', color: '#1f2937' }}>
                {config.controlMaterial}
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                Calibration Interval
              </label>
              <p style={{ margin: 0, padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', color: '#1f2937' }}>
                {config.calibrationInterval}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280' }}>
          Westgard QC Rules
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {Object.entries(config.rules).map(([ruleName, ruleConfig]) => (
            <div
              key={ruleName}
              style={{
                padding: '1rem',
                backgroundColor: ruleConfig.enabled ? '#f0fdf4' : '#f9fafb',
                border: `1px solid ${ruleConfig.enabled ? '#bbf7d0' : '#e5e7eb'}`,
                borderRadius: '0.375rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                  {ruleName}
                </h4>
                <input
                  type="checkbox"
                  checked={ruleConfig.enabled}
                  readOnly
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                {ruleConfig.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Dashboard Overview
function DashboardOverview({ instruments, alerts, actions }) {
  const passCount = instruments.filter(i => i.status === 'pass').length;
  const warningCount = instruments.filter(i => i.status === 'warning').length;
  const errorCount = instruments.filter(i => i.status === 'error').length;

  const unresolvedAlerts = alerts.filter(a => a.status === 'unresolved').length;
  const inProgressActions = actions.filter(a => a.status === 'in-progress').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Passing</p>
        <p style={{ margin: 0, fontSize: '2.25rem', fontWeight: '700', color: '#10b981' }}>{passCount}</p>
      </div>
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Warnings</p>
        <p style={{ margin: 0, fontSize: '2.25rem', fontWeight: '700', color: '#f59e0b' }}>{warningCount}</p>
      </div>
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Errors</p>
        <p style={{ margin: 0, fontSize: '2.25rem', fontWeight: '700', color: '#ef4444' }}>{errorCount}</p>
      </div>
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Unresolved Alerts</p>
        <p style={{ margin: 0, fontSize: '2.25rem', fontWeight: '700', color: '#ef4444' }}>{unresolvedAlerts}</p>
      </div>
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>In Progress</p>
        <p style={{ margin: 0, fontSize: '2.25rem', fontWeight: '700', color: '#3b82f6' }}>{inProgressActions}</p>
      </div>
    </div>
  );
}

// Instrument Detail Modal
function InstrumentDetailModal({ instrument, onClose }) {
  if (!instrument) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 40
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: '100%',
            maxHeight: '90vh',
            backgroundColor: 'white',
            borderRadius: '1rem 1rem 0 0',
            boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.1)',
            overflowY: 'auto',
            animation: 'slideUp 0.3s ease'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
              {instrument.name}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                color: '#6b7280'
              }}
            >
              <IconX />
            </button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Manufacturer
                </label>
                <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>{instrument.manufacturer}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Location
                </label>
                <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>{instrument.location}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Last Calibrated
                </label>
                <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>
                  {new Date(instrument.lastCalibrated).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Next Calibration
                </label>
                <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>
                  {new Date(instrument.nextCalibration).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <ControlChart data={instrument.controlChartData} instrumentName={instrument.name} />
            </div>

            {instrument.ruleViolations.length > 0 && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#991b1b' }}>
                  Westgard Rule Violations
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#991b1b' }}>
                  {instrument.ruleViolations.map((violation, index) => (
                    <li key={index} style={{ fontSize: '0.875rem' }}>{violation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

// Main Dashboard Component
export default function WestgardDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInstrument, setSelectedInstrument] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'instruments', label: 'Instruments' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'corrective-actions', label: 'Corrective Actions' },
    { id: 'qc-config', label: 'QC Configuration' }
  ];

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          <div style={{ padding: '2rem' }}>
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.875rem', fontWeight: '700', color: '#1f2937' }}>
                  Dashboard Overview
                </h2>
                <DashboardOverview
                  instruments={mockQCData.instruments}
                  alerts={mockQCData.alerts}
                  actions={mockQCData.correctiveActions}
                />
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                  Recent Alerts
                </h3>
                <AlertsFeed
                  alerts={mockQCData.alerts.filter(a => a.status === 'unresolved').slice(0, 3)}
                  instruments={mockQCData.instruments}
                />
              </div>
            )}

            {activeTab === 'instruments' && (
              <div>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.875rem', fontWeight: '700', color: '#1f2937' }}>
                  Laboratory Instruments
                </h2>
                <InstrumentGrid
                  instruments={mockQCData.instruments}
                  onSelectInstrument={setSelectedInstrument}
                />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.875rem', fontWeight: '700', color: '#1f2937' }}>
                  System Alerts
                </h2>
                <AlertsFeed
                  alerts={mockQCData.alerts}
                  instruments={mockQCData.instruments}
                />
              </div>
            )}

            {activeTab === 'corrective-actions' && (
              <div>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.875rem', fontWeight: '700', color: '#1f2937' }}>
                  Corrective Actions
                </h2>
                <CorrectiveActions
                  actions={mockQCData.correctiveActions}
                  instruments={mockQCData.instruments}
                />
              </div>
            )}

            {activeTab === 'qc-config' && (
              <div>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.875rem', fontWeight: '700', color: '#1f2937' }}>
                  QC Configuration
                </h2>
                <QCConfiguration config={mockQCData.qcConfiguration} />
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedInstrument && (
        <InstrumentDetailModal
          instrument={selectedInstrument}
          onClose={() => setSelectedInstrument(null)}
        />
      )}
    </div>
  );
}
