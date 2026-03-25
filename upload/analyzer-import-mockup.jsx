const AnalyzerImportRedesign = () => {
  const [labNumberSearch, setLabNumberSearch] = React.useState('');
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [showQCPanel, setShowQCPanel] = React.useState(true);
  const [qcExpanded, setQcExpanded] = React.useState(true);

  // Icons
  const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
  const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
  const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
  const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
  const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
  const RotateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
  const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>;
  const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
  const AlertTriangle = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
  const AlertCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
  const TrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
  const TrendingDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>;
  const CpuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>;
  const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
  const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
  const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
  const ZapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
  const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
  const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>;
  const PrinterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>;
  const FlaskIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.58 16.5h12.85"/></svg>;
  const BeakerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>;
  const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
  const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
  const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
  const ShieldXIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m14.5 9-5 5"/><path d="m9.5 9 5 5"/></svg>;
  const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  const BanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>;

  // QC samples extracted from this run
  const qcSamplesInRun = [
    {
      id: 'qc-1',
      sampleId: 'QC-LOW-001',
      controlType: 'Low Control',
      controlLevel: 'Level 1',
      testName: 'WBC',
      result: '3.8',
      expectedRange: '3.5 - 4.2',
      unit: 'x10^9/L',
      status: 'pass',
      runTime: '09:40:12',
      runDate: '12/18/2025',
    },
    {
      id: 'qc-2',
      sampleId: 'QC-NORM-001',
      controlType: 'Normal Control',
      controlLevel: 'Level 2',
      testName: 'WBC',
      result: '7.2',
      expectedRange: '6.8 - 7.8',
      unit: 'x10^9/L',
      status: 'pass',
      runTime: '09:40:45',
      runDate: '12/18/2025',
    },
    {
      id: 'qc-3',
      sampleId: 'QC-HIGH-001',
      controlType: 'High Control',
      controlLevel: 'Level 3',
      testName: 'WBC',
      result: '18.5',
      expectedRange: '17.5 - 19.5',
      unit: 'x10^9/L',
      status: 'pass',
      runTime: '09:41:18',
      runDate: '12/18/2025',
    },
  ];

  // Example with a failed QC
  const qcSamplesWithFailure = [
    {
      id: 'qc-f1',
      sampleId: 'QC-LOW-002',
      controlType: 'Low Control',
      controlLevel: 'Level 1',
      testName: 'Glucose',
      result: '58',
      expectedRange: '65 - 75',
      unit: 'mg/dL',
      status: 'fail',
      runTime: '10:15:22',
      runDate: '12/18/2025',
      failureReason: 'Result below acceptable range',
    },
  ];

  // Determine overall QC status for the run
  const allQcPassed = qcSamplesInRun.every(qc => qc.status === 'pass');
  const hasQcFailure = qcSamplesWithFailure.some(qc => qc.status === 'fail');

  // Patient results - mark as non-conforming if QC failed
  const importedResults = [
    { id: 1, labNumber: 'TESTA240000000000004', patient: { name: 'Test, Patient' }, testName: 'White Blood Cells Count (WBC)', result: '6.16', unit: 'x10^9/L', normalRange: '4.00 - 10.00', testDate: '12/18/2025', importTime: '09:42:15', status: 'pending', flags: [], interpretation: { suggested: { label: 'Normal', color: 'green' } }, previousResult: { value: '5.8', date: '12/01/2025' }, qcStatus: allQcPassed ? 'pass' : 'fail', nonConforming: !allQcPassed },
    { id: 2, labNumber: 'TESTA240000000000004', patient: { name: 'Test, Patient' }, testName: 'Red Blood Cells Count (RBC)', result: '4.32', unit: 'x10^12/L', normalRange: '4.50 - 6.00', testDate: '12/18/2025', importTime: '09:42:15', status: 'pending', flags: ['below-normal'], interpretation: { suggested: { label: 'Low', color: 'yellow' } }, previousResult: { value: '4.78', date: '12/01/2025' }, qcStatus: allQcPassed ? 'pass' : 'fail', nonConforming: !allQcPassed },
    { id: 3, labNumber: 'TESTA240000000000004', patient: { name: 'Test, Patient' }, testName: 'Hemoglobin', result: '12.60', unit: 'g/dL', normalRange: '13.00 - 18.00', testDate: '12/18/2025', importTime: '09:42:15', status: 'pending', flags: ['below-normal'], interpretation: { suggested: { label: 'Low', color: 'yellow' } }, previousResult: null, qcStatus: allQcPassed ? 'pass' : 'fail', nonConforming: !allQcPassed },
    { id: 4, labNumber: 'TESTA240000000000004', patient: { name: 'Test, Patient' }, testName: 'Hematocrit', result: '40.0', unit: '%', normalRange: '40.0 - 52.0', testDate: '12/18/2025', importTime: '09:42:15', status: 'pending', flags: [], interpretation: { suggested: { label: 'Normal', color: 'green' } }, previousResult: { value: '42.1', date: '12/01/2025' }, qcStatus: allQcPassed ? 'pass' : 'fail', nonConforming: !allQcPassed },
    { id: 5, labNumber: 'TESTA240000000000005', patient: { name: 'Smith, Jane' }, testName: 'White Blood Cells Count (WBC)', result: '15.8', unit: 'x10^9/L', normalRange: '4.00 - 10.00', testDate: '12/18/2025', importTime: '09:45:22', status: 'pending', flags: ['above-normal', 'delta-check'], interpretation: { suggested: { label: 'High', color: 'orange' } }, deltaCheck: { previous: '8.2', change: '+92.7%', threshold: '50%' }, previousResult: { value: '8.2', date: '12/15/2025' }, qcStatus: allQcPassed ? 'pass' : 'fail', nonConforming: !allQcPassed },
    { id: 6, labNumber: 'TESTA240000000000005', patient: { name: 'Smith, Jane' }, testName: 'Platelet Count', result: '45', unit: 'x10^9/L', normalRange: '150 - 400', testDate: '12/18/2025', importTime: '09:45:22', status: 'pending', flags: ['below-normal', 'critical'], interpretation: { suggested: { label: 'Critical Low', color: 'red' } }, deltaCheck: { previous: '165', change: '-72.7%', threshold: '25%' }, previousResult: { value: '165', date: '12/15/2025' }, qcStatus: allQcPassed ? 'pass' : 'fail', nonConforming: !allQcPassed },
  ];

  // Recent QC history for sidebar
  const recentQCHistory = [
    { date: '12/18/2025', time: '09:41', status: 'pass', runId: 'RUN-2024-1218-001' },
    { date: '12/18/2025', time: '06:21', status: 'pass', runId: 'RUN-2024-1218-AM' },
    { date: '12/17/2025', time: '14:30', status: 'pass', runId: 'RUN-2024-1217-002' },
    { date: '12/17/2025', time: '06:15', status: 'pass', runId: 'RUN-2024-1217-AM' },
    { date: '12/16/2025', time: '06:18', status: 'pass', runId: 'RUN-2024-1216-AM' },
  ];

  const qcData = {
    analyzer: 'Sysmex XN-L',
    lastCalibration: '12/18/2025 06:00',
    reagents: [
      { name: 'Cellpack DCL', lot: 'LOT-2024-1234', expires: '01/15/2025', status: 'ok' },
      { name: 'Lysercell WNR', lot: 'LOT-2024-5678', expires: '12/25/2024', status: 'expiring' },
    ],
  };

  const getFlagIcon = (flag) => {
    switch (flag) {
      case 'above-normal': return <span className="text-orange-500"><TrendingUp /></span>;
      case 'below-normal': return <span className="text-yellow-600"><TrendingDown /></span>;
      case 'delta-check': return <span className="text-red-500"><AlertTriangle /></span>;
      case 'critical': return <span className="text-red-600"><AlertCircleIcon /></span>;
      default: return null;
    }
  };

  const toggleSelectAll = () => setSelectedRows(selectedRows.length === importedResults.length ? [] : importedResults.map(r => r.id));
  const toggleSelectRow = (id) => setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  const selectNormalOnly = () => setSelectedRows(importedResults.filter(r => r.flags.length === 0 && !r.nonConforming).map(r => r.id));

  const pendingCount = importedResults.filter(r => r.status === 'pending').length;
  const flaggedCount = importedResults.filter(r => r.flags.length > 0).length;
  const criticalCount = importedResults.filter(r => r.flags.includes('critical')).length;
  const nonConformingCount = importedResults.filter(r => r.nonConforming).length;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#" className="text-teal-600 hover:text-teal-700 text-sm">Home</a>
            <span className="text-gray-400">/</span>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CpuIcon /> Sysmex XN-L Analyzer
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Last sync: 09:45:22</span>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
              <RefreshIcon /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          
          {/* ==================== QC RESULTS FROM THIS RUN ==================== */}
          <div className={`bg-white rounded-lg border-2 mb-4 ${allQcPassed ? 'border-green-300' : 'border-red-300'}`}>
            {/* QC Header */}
            <div className={`px-4 py-3 flex items-center justify-between cursor-pointer ${allQcPassed ? 'bg-green-50' : 'bg-red-50'}`}
              onClick={() => setQcExpanded(!qcExpanded)}>
              <div className="flex items-center gap-3">
                {allQcPassed ? (
                  <span className="text-green-600"><ShieldCheckIcon /></span>
                ) : (
                  <span className="text-red-600"><ShieldXIcon /></span>
                )}
                <div>
                  <h2 className={`font-semibold ${allQcPassed ? 'text-green-900' : 'text-red-900'}`}>
                    QC Results from This Run
                  </h2>
                  <p className={`text-sm ${allQcPassed ? 'text-green-700' : 'text-red-700'}`}>
                    {allQcPassed 
                      ? `All ${qcSamplesInRun.length} controls passed - Patient results can be accepted`
                      : `QC FAILURE - Patient results marked as non-conforming`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {qcSamplesInRun.map((qc, idx) => (
                    <div key={idx} className={`w-3 h-3 rounded-full ${qc.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}`} 
                      title={`${qc.controlLevel}: ${qc.status.toUpperCase()}`} />
                  ))}
                </div>
                {qcExpanded ? <ChevronDown /> : <ChevronRight />}
              </div>
            </div>

            {/* QC Details */}
            {qcExpanded && (
              <div className="p-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                  {qcSamplesInRun.map((qc) => (
                    <div key={qc.id} className={`p-4 rounded-lg border-2 ${
                      qc.status === 'pass' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                          qc.status === 'pass' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {qc.status === 'pass' ? '✓ PASS' : '✗ FAIL'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <ClockIcon /> {qc.runTime}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900">{qc.controlType}</div>
                      <div className="text-sm text-gray-600">{qc.sampleId}</div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-500">Result</div>
                            <div className={`text-lg font-bold ${qc.status === 'pass' ? 'text-green-700' : 'text-red-700'}`}>
                              {qc.result} <span className="text-sm font-normal text-gray-500">{qc.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Expected</div>
                            <div className="text-sm text-gray-700">{qc.expectedRange}</div>
                          </div>
                        </div>
                      </div>
                      {qc.status === 'fail' && qc.failureReason && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                          <strong>Failure:</strong> {qc.failureReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* QC Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                    View Levey-Jennings Chart →
                  </button>
                  {!allQcPassed && (
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
                      <AlertTriangle /> Create Non-Conformity Report
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Non-Conformity Alert Banner (if QC failed) */}
          {!allQcPassed && (
            <div className="mb-4 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-red-600"><BanIcon /></span>
                <div className="flex-1">
                  <div className="font-semibold text-red-900">Non-Conformity Alert</div>
                  <div className="text-sm text-red-800">
                    QC failure detected in this run. All {nonConformingCount} patient results have been marked as non-conforming and cannot be released until the non-conformity is resolved.
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-red-700 bg-white hover:bg-red-50 rounded-md border border-red-300">
                  View Non-Conformity
                </button>
              </div>
            </div>
          )}

          {/* ==================== RUN SETTINGS ==================== */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <SettingsIcon /> Run Settings
                <span className="text-xs font-normal text-gray-500 ml-2">Applied to all {importedResults.length} results in this run</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-12 gap-6">
              {/* Analyzer (Read-only - source of import) */}
              <div className="col-span-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Analyzer</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CpuIcon />
                    <div>
                      <div className="font-medium text-gray-900">Sysmex XN-L</div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Online • QC Passed
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <CheckIcon /> Auto-assigned to all results
                </div>
              </div>

              {/* Reagent/Cartridge Selection */}
              <div className="col-span-9">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reagents / Cartridges Used This Run</label>
                  <button className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                    <PlusIcon /> Change Lots
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Selected reagent lots shown as chips */}
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                    <span className="text-teal-600"><BeakerIcon /></span>
                    <div>
                      <div className="text-sm font-medium text-teal-900">Cellpack DCL</div>
                      <div className="text-xs text-teal-700">LOT-2024-0892 <span className="text-amber-600">(Exp: 12/20)</span></div>
                    </div>
                    <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">FIFO</span>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                    <span className="text-teal-600"><BeakerIcon /></span>
                    <div>
                      <div className="text-sm font-medium text-teal-900">Lysercell WNR</div>
                      <div className="text-xs text-teal-700">LOT-2024-5678 <span className="text-amber-600">(Exp: 12/25)</span></div>
                    </div>
                    <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">FIFO</span>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                    <span className="text-teal-600"><BeakerIcon /></span>
                    <div>
                      <div className="text-sm font-medium text-teal-900">Fluorocell WDF</div>
                      <div className="text-xs text-teal-700">LOT-2024-9012 (Exp: 02/28)</div>
                    </div>
                    <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">FIFO</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <ZapIcon /> FIFO lots pre-selected based on received date. Reagent selections will be applied to all imported results.
                </div>
              </div>
            </div>
          </div>

          {/* Search & Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Filter by Lab Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div>
                  <input type="text" value={labNumberSearch} onChange={(e) => setLabNumberSearch(e.target.value)} placeholder="Enter lab number to filter..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="flex items-center gap-6 ml-auto">
                <div className="text-center"><div className="text-2xl font-semibold text-gray-900">{importedResults.length}</div><div className="text-xs text-gray-500">Total</div></div>
                <div className="text-center"><div className="text-2xl font-semibold text-amber-600">{pendingCount}</div><div className="text-xs text-gray-500">Pending</div></div>
                <div className="text-center"><div className="text-2xl font-semibold text-orange-600">{flaggedCount}</div><div className="text-xs text-gray-500">Flagged</div></div>
                {criticalCount > 0 && <div className="text-center"><div className="text-2xl font-semibold text-red-600">{criticalCount}</div><div className="text-xs text-gray-500">Critical</div></div>}
                {nonConformingCount > 0 && <div className="text-center"><div className="text-2xl font-semibold text-red-600">{nonConformingCount}</div><div className="text-xs text-gray-500">Non-Conf.</div></div>}
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedRows.length === importedResults.length} onChange={toggleSelectAll} className="rounded border-gray-300 text-teal-600" />
                  <span className="text-sm text-gray-600">{selectedRows.length > 0 ? `${selectedRows.length} selected` : 'Select all'}</span>
                </div>
                <button 
                  onClick={selectNormalOnly}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Select Normal Only
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${
                  allQcPassed 
                    ? 'text-white bg-teal-600 hover:bg-teal-700' 
                    : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                }`} disabled={!allQcPassed}>
                  <CheckIcon /> Import
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200">
                  <RotateIcon /> Retest
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200">
                  <XCircleIcon /> Ignore
                </button>
              </div>
            </div>
          </div>

          {/* Patient Results Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
              <h3 className="font-medium text-gray-700">Patient Results</h3>
            </div>
            
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="col-span-1">Select</div>
              <div className="col-span-3">Sample Info</div>
              <div className="col-span-2">Test Name</div>
              <div className="col-span-2">Result</div>
              <div className="col-span-2">Range</div>
              <div className="col-span-1">QC</div>
              <div className="col-span-1">Flags</div>
            </div>

            {importedResults.map((result) => (
              <div key={result.id} className={`border-b border-gray-200 last:border-b-0 ${
                result.nonConforming ? 'bg-red-50' : result.flags.includes('critical') ? 'bg-orange-50' : ''
              }`}>
                <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50">
                  <div className="col-span-1 flex items-center">
                    <input type="checkbox" checked={selectedRows.includes(result.id)} onChange={() => toggleSelectRow(result.id)} className="rounded border-gray-300 text-teal-600" />
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      {result.nonConforming && <span className="text-red-500" title="Non-conforming"><AlertTriangle /></span>}
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">{result.labNumber}</div>
                        <div className="text-xs text-gray-500">{result.patient.name}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-gray-900">{result.testName}</div>
                  <div className="col-span-2">
                    <div className={`text-sm font-semibold ${
                      result.flags.includes('critical') ? 'text-red-700' : result.flags.length > 0 ? 'text-amber-700' : 'text-gray-900'
                    }`}>
                      {result.result} <span className="font-normal text-gray-500 text-xs">{result.unit}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-xs text-gray-500">{result.normalRange}</div>
                  <div className="col-span-1">
                    {result.qcStatus === 'pass' ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        QC ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                        QC ✗
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center gap-1">
                    {result.flags.map((flag, idx) => <span key={idx}>{getFlagIcon(flag)}</span>)}
                    {result.flags.length === 0 && <span className="text-gray-300">—</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div>Items per page: <select className="px-2 py-1 border border-gray-300 rounded-md ml-1"><option>25</option><option>50</option><option>100</option></select> <span className="ml-2">1-{importedResults.length} of {importedResults.length}</span></div>
            <div>Page 1 of 1</div>
          </div>
        </div>

        {/* QA/QC Sidebar */}
        {showQCPanel && (
          <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-green-600"><ShieldCheckIcon /></span> QA/QC Status
              </h3>
              <button onClick={() => setShowQCPanel(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><XIcon /></button>
            </div>

            {/* Current Run QC Status */}
            <div className={`p-4 rounded-lg mb-4 ${allQcPassed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {allQcPassed ? <span className="text-green-600"><CheckCircleIcon /></span> : <span className="text-red-600"><AlertCircleIcon /></span>}
                <div className={`font-medium ${allQcPassed ? 'text-green-900' : 'text-red-900'}`}>
                  {allQcPassed ? 'Current Run: QC Passed' : 'Current Run: QC FAILED'}
                </div>
              </div>
              <div className={`text-xs ${allQcPassed ? 'text-green-700' : 'text-red-700'}`}>
                Run ID: RUN-2024-1218-001
              </div>
              <div className="mt-2 flex gap-1">
                {qcSamplesInRun.map((qc, idx) => (
                  <div key={idx} className={`flex-1 p-2 rounded text-center ${qc.status === 'pass' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="text-xs font-medium text-gray-600">L{idx + 1}</div>
                    <div className={`text-sm font-bold ${qc.status === 'pass' ? 'text-green-700' : 'text-red-700'}`}>{qc.result}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyzer Info */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Analyzer</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2"><CpuIcon /><span className="font-medium text-gray-900">{qcData.analyzer}</span></div>
                <div className="text-xs text-gray-500 mt-1">Last calibration: {qcData.lastCalibration}</div>
              </div>
            </div>

            {/* Recent QC History */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recent QC History</h4>
              <div className="space-y-2">
                {recentQCHistory.map((qc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-900">{qc.date} {qc.time}</div>
                      <div className="text-xs text-gray-500">{qc.runId}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      qc.status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {qc.status === 'pass' ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium">
                View Full QC History →
              </button>
            </div>

            {/* Reagent Status */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Reagent Status</h4>
              <div className="space-y-2">
                {qcData.reagents.map((reagent, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${reagent.status === 'expiring' ? 'bg-amber-50 border-amber-200' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{reagent.name}</span>
                      {reagent.status === 'expiring' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">EXPIRING</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Lot: {reagent.lot} • Expires: {reagent.expires}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!showQCPanel && (
          <button onClick={() => setShowQCPanel(true)} className="fixed right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 border-r-0 rounded-l-lg p-2 shadow-sm hover:bg-gray-50" title="Show QA/QC Panel">
            <span className="text-green-600"><ShieldCheckIcon /></span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AnalyzerImportRedesign;
