/**
 * Blood Bank: Issue-to-Patient & Emergency Release
 * OpenELIS Global — Spec 5 / OGC-461
 * Carbon React mockup — v1.0
 *
 * Views:
 *   "queue"   — Issue Queue worklist (APPROVED requests awaiting handover)
 *   "detail"  — Issue Case View (checklist + confirm issue)
 *   "history" — Issue History tab (ISSUED requests, read-only)
 *
 * Modals:
 *   emergencyModal  — Emergency Release form
 *   confirmModal    — Pre-submit confirmation before Confirm Issue
 */

import React, { useState, useCallback, useMemo, Fragment } from 'react';
import {
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  Button, Tag, Modal, InlineNotification, Checkbox, TextInput, TextArea,
  Select, SelectItem, NumberInput, Tabs, Tab, TabList, TabPanels, TabPanel,
  Breadcrumb, BreadcrumbItem, Tile, Stack, Grid, Column,
} from '@carbon/react';
import {
  Alarm, ArrowLeft, Checkmark, Warning, Add, View, Hospital,
} from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// i18n helper
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Realistic mock data
// ---------------------------------------------------------------------------
const APPROVED_REQUESTS = [
  {
    id: 'TR-2026-0441', patient: 'Amara Diallo', patientId: 'P-004821',
    dob: '1978-06-14', aboRh: 'B+', componentType: 'pRBC', units: 2,
    requestingClinician: 'Dr. Fatou Camara', approvedBy: 'Supervisor K. Mensah',
    approvedAt: '2026-03-25 07:42', waitMinutes: 73, isEmergency: false,
    crossmatch: 'Compatible',
    requestUnits: [
      { unitNumber: 'BB-2026-1102', aboRh: 'B+', componentType: 'pRBC', expiry: '2026-04-10', storage: 'Fridge 2A', crossmatch: 'Compatible' },
      { unitNumber: 'BB-2026-1103', aboRh: 'B+', componentType: 'pRBC', expiry: '2026-04-08', storage: 'Fridge 2A', crossmatch: 'Compatible' },
    ],
  },
  {
    id: 'TR-2026-0448', patient: 'Unknown Patient', patientId: 'EMERG-001',
    dob: '--', aboRh: 'O-', componentType: 'pRBC', units: 2,
    requestingClinician: 'Dr. Jean-Pierre Nkurunziza', approvedBy: 'Supervisor K. Mensah',
    approvedAt: '2026-03-25 08:51', waitMinutes: 4, isEmergency: true,
    crossmatch: 'Emergency Release -- No Crossmatch',
    requestUnits: [
      { unitNumber: 'BB-2026-0887', aboRh: 'O-', componentType: 'pRBC', expiry: '2026-03-29', storage: 'Fridge 1B', crossmatch: 'Not Performed' },
      { unitNumber: 'BB-2026-0891', aboRh: 'O-', componentType: 'pRBC', expiry: '2026-04-02', storage: 'Fridge 1B', crossmatch: 'Not Performed' },
    ],
  },
  {
    id: 'TR-2026-0451', patient: 'Celestine Okonkwo', patientId: 'P-007133',
    dob: '1990-02-28', aboRh: 'A+', componentType: 'FFP', units: 4,
    requestingClinician: 'Dr. Amara Sesay', approvedBy: 'Supervisor K. Mensah',
    approvedAt: '2026-03-25 08:58', waitMinutes: 22, isEmergency: false,
    crossmatch: 'Compatible',
    requestUnits: [
      { unitNumber: 'BB-2026-0955', aboRh: 'AB', componentType: 'FFP', expiry: '2026-09-15', storage: 'Freezer 3', crossmatch: 'Not Required (FFP)' },
      { unitNumber: 'BB-2026-0956', aboRh: 'AB', componentType: 'FFP', expiry: '2026-09-15', storage: 'Freezer 3', crossmatch: 'Not Required (FFP)' },
      { unitNumber: 'BB-2026-0957', aboRh: 'AB', componentType: 'FFP', expiry: '2026-08-30', storage: 'Freezer 3', crossmatch: 'Not Required (FFP)' },
      { unitNumber: 'BB-2026-0958', aboRh: 'AB', componentType: 'FFP', expiry: '2026-08-30', storage: 'Freezer 3', crossmatch: 'Not Required (FFP)' },
    ],
  },
];

const HISTORY_REQUESTS = [
  {
    id: 'TR-2026-0389', patient: 'Ibrahim Toure', patientId: 'P-003201',
    componentType: 'pRBC', units: 2, issuedAt: '2026-03-24 14:22',
    issuedBy: 'Tech M. Adeyemi', receivedBy: 'Nurse Grace Acheampong', isEmergency: false,
  },
  {
    id: 'TR-2026-0401', patient: 'Fatima Al-Hassan', patientId: 'P-005567',
    componentType: 'PLT', units: 1, issuedAt: '2026-03-25 06:11',
    issuedBy: 'Tech M. Adeyemi', receivedBy: 'Dr. Raymond Owusu', isEmergency: false,
  },
];

const CHECKLIST_ITEMS = [
  { key: 'patientId', label: t('label.issue.checklist.patientId', 'Patient ID verified against unit label') },
  { key: 'expiry',    label: t('label.issue.checklist.expiry',    'Unit expiry date confirmed -- unit is not expired') },
  { key: 'condition', label: t('label.issue.checklist.condition', 'Unit condition visually inspected -- no discoloration, clots, or damage') },
  { key: 'compType',  label: t('label.issue.checklist.componentType', 'Blood component type matches transfusion request') },
];

// ---------------------------------------------------------------------------
// Component helpers
// ---------------------------------------------------------------------------
function WaitTimeBadge({ minutes }) {
  if (minutes > 60) {
    return <Tag kind="red" size="sm"><Alarm size={12} /> {minutes}{t('label.issue.minAbbr', 'min')}</Tag>;
  }
  if (minutes > 30) {
    return <Tag kind="warm-gray" size="sm">{minutes}{t('label.issue.minAbbr', 'min')}</Tag>;
  }
  return <Tag kind="green" size="sm">{minutes}{t('label.issue.minAbbr', 'min')}</Tag>;
}

function StatusTag({ isEmergency }) {
  if (isEmergency) return <Tag kind="red">{t('label.issue.emergencyFlag', 'Emergency')}</Tag>;
  return <Tag kind="purple">{t('label.issue.statusApproved', 'Approved')}</Tag>;
}

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------
function StatTile({ label, value, color }) {
  const borderColor = color === 'red' ? '#da1e28' : color === 'warm-gray' ? '#8d8d8d' : '#0f62fe';
  return (
    <Tile style={{ borderTop: `4px solid ${borderColor}`, padding: 'var(--cds-spacing-05)', minWidth: 160 }}>
      <p style={{ fontSize: 28, fontWeight: 600, color: borderColor, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#525252', marginTop: 4 }}>{label}</p>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Carbon SideNav shell (matching Spec 4 pattern)
// ---------------------------------------------------------------------------
function Shell({ children }) {
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [bloodBankExpanded, setBloodBankExpanded] = useState(true);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      {/* Fixed header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 48,
        background: '#161616', color: '#fff',
        display: 'flex', alignItems: 'center', zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,.3)',
      }}>
        <button
          onClick={() => setSideNavOpen(o => !o)}
          style={{ width: 48, height: 48, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label={t('nav.toggleMenu', 'Toggle navigation menu')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3"  width="20" height="2" rx="1" />
            <rect y="9"  width="20" height="2" rx="1" />
            <rect y="15" width="20" height="2" rx="1" />
          </svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', paddingLeft: 4 }}>
          {t('nav.productName', 'OpenELIS Global')}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 8 }}>
          {['bell', 'settings', 'user'].map(icon => (
            <button key={icon} style={{ width: 40, height: 48, background: 'none', border: 'none', color: '#c6c6c6', cursor: 'pointer', fontSize: 18 }}>
              {icon === 'bell' ? '\u{1F514}' : icon === 'settings' ? '\u2699\uFE0F' : '\u{1F464}'}
            </button>
          ))}
        </div>
      </header>

      {/* SideNav overlay */}
      {sideNavOpen && (
        <div
          style={{ position: 'fixed', inset: '48px 0 0 0', background: 'rgba(0,0,0,.4)', zIndex: 30 }}
          onClick={() => setSideNavOpen(false)}
        />
      )}

      {/* SideNav */}
      <nav style={{
        position: 'fixed', top: 48, left: 0, bottom: 0, width: 256,
        background: '#161616', zIndex: 40, overflowY: 'auto',
        transform: sideNavOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 200ms ease',
      }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
          {['Home', 'Add Order', 'Results', 'Patient'].map(item => (
            <li key={item}>
              <button style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', fontSize: 14, color: '#c6c6c6', cursor: 'pointer' }}>
                {item}
              </button>
            </li>
          ))}

          {/* Blood Bank expandable group */}
          <li>
            <button
              onClick={() => setBloodBankExpanded(o => !o)}
              style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', fontSize: 14, color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>{t('nav.bloodBank', 'Blood Bank')}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
                style={{ transition: 'transform 150ms', transform: bloodBankExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                <path d="M8 11L3 6h10z" />
              </svg>
            </button>
            {bloodBankExpanded && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {[
                  { label: t('nav.pretransfusion', 'Pre-Transfusion Testing'), active: false },
                  { label: t('nav.issueQueue', 'Issue Queue'), active: true },
                  { label: t('nav.inventory', 'Inventory'), active: false },
                  { label: t('nav.receiveUnit', 'Receive Unit'), active: false },
                  { label: t('nav.patientRecord', 'Patient Record'), active: false },
                ].map(sub => (
                  <li key={sub.label}>
                    <button style={{
                      width: '100%', textAlign: 'left', paddingLeft: 32, paddingRight: 16,
                      paddingTop: 10, paddingBottom: 10,
                      background: 'none', border: 'none',
                      borderLeft: sub.active ? '4px solid #0f62fe' : '4px solid transparent',
                      backgroundColor: sub.active ? '#393939' : 'transparent',
                      fontSize: 14,
                      color: sub.active ? '#fff' : '#c6c6c6',
                      fontWeight: sub.active ? 500 : 400,
                      cursor: 'pointer',
                    }}>
                      {sub.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {['Quality Control', 'Reports', 'Admin'].map(item => (
            <li key={item}>
              <button style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', fontSize: 14, color: '#c6c6c6', cursor: 'pointer' }}>
                {item}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <div style={{ paddingTop: 48 }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Issue Queue (worklist)
// ---------------------------------------------------------------------------
function IssueQueue({ onSelectRequest, onOpenEmergency }) {
  const [activeTab, setActiveTab] = useState(0);
  const [filterEmergency, setFilterEmergency] = useState(false);
  const [searchText, setSearchText] = useState('');

  const lateCount   = APPROVED_REQUESTS.filter(r => r.waitMinutes > 60).length;
  const emergCount  = APPROVED_REQUESTS.filter(r => r.isEmergency).length;

  const filtered = APPROVED_REQUESTS.filter(r => {
    if (filterEmergency && !r.isEmergency) return false;
    if (searchText && !r.patient.toLowerCase().includes(searchText.toLowerCase()) &&
        !r.id.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const queueHeaders = [
    { key: 'id',          header: t('label.issue.requestId', 'Request ID') },
    { key: 'patient',     header: t('label.issue.patient', 'Patient') },
    { key: 'patientId',   header: t('label.issue.patientId', 'Patient ID') },
    { key: 'componentType', header: t('label.issue.componentType', 'Component') },
    { key: 'units',       header: t('label.issue.units', 'Units') },
    { key: 'aboRh',       header: t('label.issue.aboRh', 'ABO/Rh') },
    { key: 'approvedAt',  header: t('label.issue.approvedAt', 'Approved At') },
    { key: 'waitTime',    header: t('label.issue.waitTime', 'Wait') },
    { key: 'status',      header: t('label.issue.status', 'Status') },
    { key: 'actions',     header: '' },
  ];

  const historyHeaders = [
    { key: 'id',            header: t('label.issue.requestId', 'Request ID') },
    { key: 'patient',       header: t('label.issue.patient', 'Patient') },
    { key: 'componentType', header: t('label.issue.componentType', 'Component') },
    { key: 'units',         header: t('label.issue.units', 'Units') },
    { key: 'issuedAt',      header: t('label.issue.issuedAt', 'Issued At') },
    { key: 'issuedBy',      header: t('label.issue.issuedBy', 'Issued By') },
    { key: 'receivedBy',    header: t('label.issue.receivedBy', 'Received By') },
    { key: 'emergency',     header: '' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '8px 24px' }}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#">{t('nav.bloodBank', 'Blood Bank')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('nav.issueQueue', 'Issue Queue')}</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px' }}>
        {/* Page title + Emergency Release button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 300, margin: 0, color: '#161616' }}>
              {t('heading.issue.queueTitle', 'Issue Queue')}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#525252' }}>
              {t('message.issue.queueSubtitle', 'Approved transfusion requests awaiting physical handover')}
            </p>
          </div>
          <Button
            kind="danger"
            renderIcon={Warning}
            onClick={onOpenEmergency}
          >
            {t('button.issue.emergencyRelease', 'Emergency Release')}
          </Button>
        </div>

        {/* Stat tiles */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <StatTile label={t('label.issue.statPending', 'Pending Issue')} value={APPROVED_REQUESTS.length} color="blue" />
          <StatTile label={t('label.issue.statLate', 'Late (>60 min)')} value={lateCount} color="warm-gray" />
          <StatTile label={t('label.issue.statEmergency', 'Emergency Release')} value={emergCount} color="red" />
        </div>

        {/* Tabs: Queue / History */}
        <Tabs selectedIndex={activeTab} onChange={({ selectedIndex }) => setActiveTab(selectedIndex)}>
          <TabList aria-label={t('heading.issue.queueTitle', 'Issue Queue')}>
            <Tab>{t('heading.issue.queueTitle', 'Pending Issue')}</Tab>
            <Tab>{t('heading.issue.historyTitle', 'Issue History')}</Tab>
          </TabList>
          <TabPanels>
            {/* ---- PENDING ISSUE TAB ---- */}
            <TabPanel>
              <DataTable rows={filtered.map(r => ({ ...r, id: r.id }))} headers={queueHeaders} isSortable>
                {({ rows, headers, getHeaderProps, getTableProps }) => (
                  <TableContainer>
                    <TableToolbar>
                      <TableToolbarContent>
                        <TableToolbarSearch
                          placeholder={t('placeholder.issue.search', 'Search patient or request ID...')}
                          value={searchText}
                          onChange={e => setSearchText(e.target.value)}
                        />
                        <Button
                          kind={filterEmergency ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => setFilterEmergency(f => !f)}
                          style={{ marginLeft: 8 }}
                        >
                          {t('button.issue.filterEmergency', 'Emergency Only')}
                        </Button>
                      </TableToolbarContent>
                    </TableToolbar>
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          {headers.map(h => (
                            <TableHeader key={h.key} {...getHeaderProps({ header: h })}>
                              {h.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map(row => {
                          const req = APPROVED_REQUESTS.find(r => r.id === row.id);
                          return (
                            <TableRow
                              key={row.id}
                              style={{ background: req.waitMinutes > 60 ? '#fff8f8' : 'transparent', cursor: 'pointer' }}
                              onClick={() => onSelectRequest(req)}
                            >
                              <TableCell>
                                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>{req.id}</span>
                              </TableCell>
                              <TableCell>
                                {req.isEmergency
                                  ? <span style={{ color: '#da1e28', fontWeight: 500 }}>{req.patient}</span>
                                  : req.patient}
                              </TableCell>
                              <TableCell><span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{req.patientId}</span></TableCell>
                              <TableCell><Tag kind="blue" size="sm">{req.componentType}</Tag></TableCell>
                              <TableCell>{req.units}</TableCell>
                              <TableCell><Tag kind="cool-gray" size="sm">{req.aboRh}</Tag></TableCell>
                              <TableCell style={{ fontSize: 13 }}>{req.approvedAt}</TableCell>
                              <TableCell><WaitTimeBadge minutes={req.waitMinutes} /></TableCell>
                              <TableCell><StatusTag isEmergency={req.isEmergency} /></TableCell>
                              <TableCell>
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  renderIcon={View}
                                  onClick={e => { e.stopPropagation(); onSelectRequest(req); }}
                                >
                                  {t('button.issue.issue', 'Issue')}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filtered.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={queueHeaders.length} style={{ textAlign: 'center', color: '#525252', padding: '2rem' }}>
                              {t('message.issue.emptyQueue', 'No approved requests awaiting issue.')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>
            </TabPanel>

            {/* ---- HISTORY TAB ---- */}
            <TabPanel>
              <DataTable rows={HISTORY_REQUESTS} headers={historyHeaders}>
                {({ rows, headers, getHeaderProps, getTableProps }) => (
                  <TableContainer>
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          {headers.map(h => (
                            <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map(row => {
                          const req = HISTORY_REQUESTS.find(r => r.id === row.id);
                          return (
                            <TableRow key={row.id}>
                              <TableCell><span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>{req.id}</span></TableCell>
                              <TableCell>{req.patient}</TableCell>
                              <TableCell><Tag kind="blue" size="sm">{req.componentType}</Tag></TableCell>
                              <TableCell>{req.units}</TableCell>
                              <TableCell style={{ fontSize: 13 }}>{req.issuedAt}</TableCell>
                              <TableCell style={{ fontSize: 13 }}>{req.issuedBy}</TableCell>
                              <TableCell style={{ fontSize: 13 }}>{req.receivedBy}</TableCell>
                              <TableCell>
                                {req.isEmergency ? <Tag kind="red" size="sm">{t('label.issue.emergencyFlag', 'Emergency')}</Tag> : null}
                                <Tag kind="teal" size="sm"><Checkmark size={12} /> {t('label.issue.statusIssued', 'Issued')}</Tag>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Issue Case View
// ---------------------------------------------------------------------------
function IssueCaseView({ request, onBack, onIssued }) {
  const [checklist, setChecklist] = useState({ patientId: false, expiry: false, condition: false, compType: false });
  const [receivedBy, setReceivedBy] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [issued, setIssued] = useState(false);

  const allChecked = Object.values(checklist).every(Boolean);
  const receivedByValid = receivedBy.trim().length >= 2;
  const canIssue = allChecked && receivedByValid;

  const handleConfirmIssue = () => {
    setConfirmOpen(false);
    setIssued(true);
    setTimeout(() => onIssued(), 1500);
  };

  const unitHeaders = [
    { key: 'unitNumber',   header: t('label.issue.unitNumber', 'Unit Number') },
    { key: 'aboRh',        header: t('label.issue.aboRh', 'ABO/Rh') },
    { key: 'componentType', header: t('label.issue.componentType', 'Component') },
    { key: 'expiryDate',   header: t('label.issue.expiryDate', 'Expiry Date') },
    { key: 'storage',      header: t('label.issue.storageLocation', 'Storage') },
    { key: 'crossmatch',   header: t('label.issue.crossmatchResult', 'Crossmatch') },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '8px 24px' }}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#" onClick={onBack}>{t('nav.bloodBank', 'Blood Bank')}</BreadcrumbItem>
          <BreadcrumbItem href="#" onClick={onBack}>{t('nav.issueQueue', 'Issue Queue')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{request.id}</BreadcrumbItem>
        </Breadcrumb>
      </div>

      {/* Success notification (post-issue) */}
      {issued && (
        <InlineNotification
          kind="success"
          title={t('message.issue.issueSuccess', 'Units issued successfully. Patient Blood Bank Record updated.')}
          style={{ marginBottom: 0 }}
        />
      )}

      {/* Emergency banner */}
      {request.isEmergency && (
        <InlineNotification
          kind="error"
          title={t('message.issue.emergencyBanner', 'Emergency Release -- No Crossmatch Performed. Confirm with clinical team before issue.')}
          style={{ marginBottom: 0 }}
        />
      )}

      <div style={{ display: 'flex', height: 'calc(100vh - 148px)' }}>
        {/* Left sidebar */}
        <aside style={{
          width: 240, flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #e0e0e0',
          overflowY: 'auto',
          padding: '16px 0',
        }}>
          <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #e0e0e0', marginBottom: 12 }}>
            <Button kind="ghost" size="sm" renderIcon={ArrowLeft} onClick={onBack}>
              {t('button.issue.backToQueue', 'Back to Issue Queue')}
            </Button>
          </div>

          <div style={{ padding: '0 16px' }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: '#8d8d8d', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                {t('label.issue.requestId', 'Request ID')}
              </p>
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, margin: 0 }}>{request.id}</p>
            </div>

            {request.isEmergency && (
              <div style={{ marginBottom: 12 }}>
                <Tag kind="red">{t('label.issue.emergencyFlag', 'EMERGENCY RELEASE')}</Tag>
              </div>
            )}

            {[
              { label: t('label.issue.patient', 'Patient'), value: request.patient },
              { label: t('label.issue.patientId', 'Patient ID'), value: request.patientId },
              { label: t('label.issue.dob', 'Date of Birth'), value: request.dob },
              { label: t('label.issue.aboRh', 'ABO/Rh'), value: request.aboRh },
              { label: t('label.issue.componentType', 'Component'), value: request.componentType },
              { label: t('label.issue.units', 'Units'), value: request.units },
              { label: t('label.issue.requestingClinician', 'Requesting Clinician'), value: request.requestingClinician },
              { label: t('label.issue.approvedBy', 'Approved By'), value: request.approvedBy },
              { label: t('label.issue.approvedAt', 'Approved At'), value: request.approvedAt },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: '#8d8d8d', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 13, margin: 0 }}>{value}</p>
              </div>
            ))}

            <div style={{ marginTop: 4 }}>
              <p style={{ fontSize: 11, color: '#8d8d8d', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                {t('label.issue.crossmatchResult', 'Crossmatch')}
              </p>
              {request.isEmergency
                ? <Tag kind="red" size="sm">{t('label.issue.noCrossmatch', 'No Crossmatch')}</Tag>
                : <Tag kind="green" size="sm"><Checkmark size={12} /> {t('label.issue.compatible', 'Compatible')}</Tag>
              }
            </div>
          </div>
        </aside>

        {/* Right panel */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Unit list */}
          <Tile style={{ marginBottom: 20, padding: 0 }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                {t('heading.issue.unitList', 'Units to Issue')}
              </h3>
            </div>
            <DataTable rows={request.requestUnits.map(u => ({ ...u, id: u.unitNumber }))} headers={unitHeaders}>
              {({ rows, headers, getHeaderProps, getTableProps }) => (
                <Table {...getTableProps()} size="sm">
                  <TableHead>
                    <TableRow>
                      {headers.map(h => (
                        <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(row => {
                      const unit = request.requestUnits.find(u => u.unitNumber === row.id);
                      return (
                        <TableRow key={row.id}>
                          <TableCell><span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{unit.unitNumber}</span></TableCell>
                          <TableCell><Tag kind="cool-gray" size="sm">{unit.aboRh}</Tag></TableCell>
                          <TableCell><Tag kind="blue" size="sm">{unit.componentType}</Tag></TableCell>
                          <TableCell style={{ fontSize: 13 }}>{unit.expiry}</TableCell>
                          <TableCell style={{ fontSize: 13 }}>{unit.storage}</TableCell>
                          <TableCell>
                            {unit.crossmatch === 'Compatible'
                              ? <Tag kind="green" size="sm">{unit.crossmatch}</Tag>
                              : unit.crossmatch === 'Not Performed'
                              ? <Tag kind="red" size="sm">{unit.crossmatch}</Tag>
                              : <Tag kind="gray" size="sm">{unit.crossmatch}</Tag>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          </Tile>

          {/* Pre-Issue Safety Checklist */}
          <Tile style={{ marginBottom: 20, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
              {t('heading.issue.checklist', 'Pre-Issue Safety Checklist')}
            </h3>
            <Stack gap={5}>
              {CHECKLIST_ITEMS.map(item => (
                <Checkbox
                  key={item.key}
                  id={`checklist-${item.key}`}
                  labelText={item.label}
                  checked={checklist[item.key]}
                  onChange={(_, { checked }) => setChecklist(prev => ({ ...prev, [item.key]: checked }))}
                  disabled={issued}
                />
              ))}
            </Stack>
          </Tile>

          {/* Received By */}
          <Tile style={{ marginBottom: 20, padding: 20 }}>
            <TextInput
              id="received-by"
              labelText={t('label.issue.receivedBy', 'Received By')}
              placeholder={t('label.issue.receivedByPlaceholder', 'Enter name of nurse or clinician collecting units')}
              value={receivedBy}
              onChange={e => setReceivedBy(e.target.value)}
              invalid={receivedBy.length > 0 && receivedBy.trim().length < 2}
              invalidText={t('error.issue.receivedByRequired', 'Received By is required and must be at least 2 characters.')}
              disabled={issued}
              style={{ maxWidth: 480 }}
            />
          </Tile>

          {/* Checklist incomplete warning */}
          {!canIssue && !issued && (
            <InlineNotification
              kind="warning"
              title={t('message.issue.checklistRequired', 'Complete all checklist items and enter a recipient name before issuing.')}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Wait time warning */}
          {request.waitMinutes > 60 && (
            <InlineNotification
              kind="warning"
              title={t('message.issue.lateWarning', 'This request has been approved for over 60 minutes. Please prioritize issue.')}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Action bar */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <Button
              kind="primary"
              renderIcon={Hospital}
              disabled={!canIssue || issued}
              onClick={() => setConfirmOpen(true)}
            >
              {t('button.issue.confirmIssue', 'Confirm Issue')}
            </Button>
            <Button kind="secondary" onClick={onBack} disabled={issued}>
              {t('button.issue.cancelIssue', 'Cancel')}
            </Button>
          </div>
        </main>
      </div>

      {/* Issue Confirmation Modal */}
      <Modal
        open={confirmOpen}
        modalHeading={t('heading.issue.confirmModal', 'Confirm Issue')}
        primaryButtonText={t('button.issue.confirmAndIssue', 'Confirm & Issue')}
        secondaryButtonText={t('button.issue.cancelIssue', 'Cancel')}
        danger
        onRequestSubmit={handleConfirmIssue}
        onRequestClose={() => setConfirmOpen(false)}
        onSecondarySubmit={() => setConfirmOpen(false)}
      >
        <p style={{ marginBottom: 16, lineHeight: 1.5 }}>
          {t('message.issue.confirmSummary',
            `You are about to issue ${request.units} unit(s) of ${request.componentType} to patient ${request.patient}. Received by: ${receivedBy}. This action cannot be undone.`
          )}
        </p>
        <div style={{ background: '#f4f4f4', padding: 16, borderRadius: 4 }}>
          {[
            [t('label.issue.patient', 'Patient'), request.patient],
            [t('label.issue.patientId', 'Patient ID'), request.patientId],
            [t('label.issue.componentType', 'Component'), request.componentType],
            [t('label.issue.units', 'Units'), request.units],
            [t('label.issue.receivedBy', 'Received By'), receivedBy],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#525252', minWidth: 120 }}>{label}:</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          {request.isEmergency && (
            <Tag kind="red" style={{ marginTop: 8 }}>{t('label.issue.emergencyFlag', 'Emergency Release -- No Crossmatch')}</Tag>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Emergency Release Modal
// ---------------------------------------------------------------------------
function EmergencyReleaseModal({ open, onClose, onCreated }) {
  const [patientSearch, setPatientSearch] = useState('');
  const [unknownPatient, setUnknownPatient] = useState(false);
  const [componentType, setComponentType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason || reason.trim().length < 10) {
      setError(t('error.issue.clinicalReasonRequired', 'Clinical reason must be at least 10 characters.'));
      return;
    }
    if (!pin) {
      setError(t('error.issue.supervisorPinInvalid', 'Supervisor password is required.'));
      return;
    }
    if (!componentType) {
      setError(t('error.issue.componentTypeRequired', 'Component type is required.'));
      return;
    }
    setError('');
    onCreated();
  };

  return (
    <Modal
      open={open}
      modalHeading={t('heading.issue.emergencyModal', 'Emergency Release')}
      primaryButtonText={t('button.issue.submitEmergency', 'Submit Emergency Release')}
      secondaryButtonText={t('button.issue.cancelIssue', 'Cancel')}
      danger
      onRequestSubmit={handleSubmit}
      onRequestClose={onClose}
      onSecondarySubmit={onClose}
      size="md"
    >
      <InlineNotification
        kind="warning"
        title={t('message.emergency.warning', 'Emergency release bypasses crossmatch testing. Only O-negative pRBC and AB FFP are permitted. Supervisor authorization is required.')}
        style={{ marginBottom: 20 }}
      />

      {error && (
        <InlineNotification
          kind="error"
          title={error}
          style={{ marginBottom: 16 }}
        />
      )}

      <Stack gap={5}>
        <TextInput
          id="emr-patient"
          labelText={t('label.issue.patient', 'Patient')}
          placeholder={t('placeholder.issue.patientSearch', 'Search by name or patient ID...')}
          value={patientSearch}
          onChange={e => setPatientSearch(e.target.value)}
          disabled={unknownPatient}
        />

        <Checkbox
          id="emr-unknown"
          labelText={t('label.issue.unknownPatient', 'Unknown Patient (O-negative pRBC only)')}
          checked={unknownPatient}
          onChange={(_, { checked }) => {
            setUnknownPatient(checked);
            if (checked) { setPatientSearch(''); setComponentType('pRBC (O-)'); }
          }}
        />

        <Select
          id="emr-component"
          labelText={t('label.issue.componentType', 'Component Type')}
          value={componentType}
          onChange={e => setComponentType(e.target.value)}
          disabled={unknownPatient}
        >
          <SelectItem value="" text={t('placeholder.issue.selectComponent', 'Select component...')} />
          <SelectItem value="pRBC (O-)" text="pRBC (O-negative)" />
          <SelectItem value="FFP (AB)"  text="FFP (AB)" />
        </Select>

        {unknownPatient && (
          <InlineNotification
            kind="info"
            title={t('message.emergency.oNegOnly', 'Unknown patient -- O-negative pRBC will be auto-selected.')}
          />
        )}

        <NumberInput
          id="emr-quantity"
          label={t('label.issue.quantity', 'Quantity')}
          value={quantity}
          min={1}
          max={4}
          onChange={(_, { value }) => setQuantity(value)}
        />

        <TextArea
          id="emr-reason"
          labelText={t('label.issue.clinicalReason', 'Clinical Reason')}
          placeholder={t('placeholder.issue.clinicalReason', 'Document the clinical urgency justifying emergency release (minimum 10 characters)...')}
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          invalid={reason.length > 0 && reason.trim().length < 10}
          invalidText={t('error.issue.clinicalReasonTooShort', 'Minimum 10 characters required.')}
        />

        <TextInput
          id="emr-pin"
          type="password"
          labelText={t('label.issue.supervisorPin', 'Supervisor Password')}
          placeholder={t('placeholder.issue.supervisorPin', 'Enter your password to authorize emergency release')}
          value={pin}
          onChange={e => setPin(e.target.value)}
        />
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------
export default function IssueToPatientApp() {
  const [view, setView] = useState('queue');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [successNotif, setSuccessNotif] = useState('');

  const handleSelectRequest = useCallback(req => {
    setSelectedRequest(req);
    setView('detail');
  }, []);

  const handleIssued = useCallback(() => {
    setSuccessNotif(t('message.issue.issueSuccess', 'Units issued successfully. Patient Blood Bank Record updated.'));
    setView('queue');
    setSelectedRequest(null);
  }, []);

  const handleEmergencyCreated = useCallback(() => {
    setEmergencyOpen(false);
    setSuccessNotif(t('message.issue.emergencyCreated', 'Emergency release request created and approved. Proceed to issue.'));
  }, []);

  return (
    <Shell>
      {successNotif && (
        <InlineNotification
          kind="success"
          title={successNotif}
          onCloseButtonClick={() => setSuccessNotif('')}
          style={{ position: 'sticky', top: 48, zIndex: 20 }}
        />
      )}

      {view === 'queue' && (
        <IssueQueue
          onSelectRequest={handleSelectRequest}
          onOpenEmergency={() => setEmergencyOpen(true)}
        />
      )}

      {view === 'detail' && selectedRequest && (
        <IssueCaseView
          request={selectedRequest}
          onBack={() => { setView('queue'); setSelectedRequest(null); }}
          onIssued={handleIssued}
        />
      )}

      <EmergencyReleaseModal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onCreated={handleEmergencyCreated}
      />
    </Shell>
  );
}
