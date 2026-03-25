import React from 'react';

const ResultsPageRedesign = () => {
  // Initial state - no data loaded until search/filter applied
  const [hasSearched, setHasSearched] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedLabUnit, setSelectedLabUnit] = React.useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  
  // Advanced filters
  const [filters, setFilters] = React.useState({
    labNumberFrom: '',
    labNumberTo: '',
    dateFrom: '',
    dateTo: '',
    testSection: '',
    status: '',
    showPendingOnly: false,
    showEnteredOnly: false,
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [totalResultCount, setTotalResultCount] = React.useState(0);
  
  // UI state
  const [expandedRow, setExpandedRow] = React.useState(null);
  const [selectedTab, setSelectedTab] = React.useState('method');
  const [interpretationText, setInterpretationText] = React.useState('');
  const [selectedInterpretation, setSelectedInterpretation] = React.useState(null);
  
  // Lab units for dropdown
  const labUnits = [
    { id: 'hematology', name: 'Hematology' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'microbiology', name: 'Microbiology' },
    { id: 'immunology', name: 'Immunology' },
    { id: 'urinalysis', name: 'Urinalysis' },
    { id: 'bloodbank', name: 'Blood Bank' },
  ];
  
  // Test sections for filter dropdown
  const testSections = [
    'Complete Blood Count',
    'Basic Metabolic Panel',
    'Lipid Panel',
    'Liver Function',
    'Thyroid Panel',
    'Coagulation',
  ];

  // Icons
  const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
  const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
  const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
  const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
  const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
  const MoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
  const CpuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>;
  const TrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
  const TrendingDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>;
  const AlertTriangle = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
  const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>;
  const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
  const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
  const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
  const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
  const ZapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
  const FlaskIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.58 16.5h12.85"/></svg>;
  const BeakerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>;
  const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
  const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  const AlertCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
  const RotateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
  const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
  const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;

  // Available analyzers for WBC test
  const availableAnalyzers = [
    { id: 'sysmex-xn', name: 'Sysmex XN-L', status: 'online', lastCalibrated: '12/18/2025 06:00', qcStatus: 'pass' },
    { id: 'sysmex-xs', name: 'Sysmex XS-1000i', status: 'online', lastCalibrated: '12/18/2025 05:45', qcStatus: 'pass' },
    { id: 'manual', name: 'Manual (Hemocytometer)', status: 'available', lastCalibrated: null, qcStatus: null },
  ];

  // Available reagent lots (sorted by FIFO - oldest first)
  const availableReagents = [
    { 
      id: 'reagent-1',
      name: 'Cellpack DCL', 
      lots: [
        { lotNumber: 'LOT-2024-0892', received: '10/15/2024', expires: '12/20/2024', remaining: '15%', fifoRank: 1, status: 'expiring-soon' },
        { lotNumber: 'LOT-2024-1234', received: '11/01/2024', expires: '01/15/2025', remaining: '85%', fifoRank: 2, status: 'ok' },
        { lotNumber: 'LOT-2024-1567', received: '12/01/2024', expires: '02/28/2025', remaining: '100%', fifoRank: 3, status: 'ok' },
      ]
    },
    { 
      id: 'reagent-2',
      name: 'Lysercell WNR', 
      lots: [
        { lotNumber: 'LOT-2024-5678', received: '11/10/2024', expires: '12/25/2024', remaining: '45%', fifoRank: 1, status: 'expiring-soon' },
        { lotNumber: 'LOT-2024-6012', received: '12/05/2024', expires: '02/15/2025', remaining: '100%', fifoRank: 2, status: 'ok' },
      ]
    },
    { 
      id: 'reagent-3',
      name: 'Fluorocell WDF', 
      lots: [
        { lotNumber: 'LOT-2024-9012', received: '11/20/2024', expires: '02/28/2025', remaining: '70%', fifoRank: 1, status: 'ok' },
      ]
    },
  ];

  const [selectedAnalyzer, setSelectedAnalyzer] = React.useState(null);
  const [selectedReagentLots, setSelectedReagentLots] = React.useState({});
  const [selectedMethod, setSelectedMethod] = React.useState('manual'); // 'manual' or 'analyzer'
  const [methodNotes, setMethodNotes] = React.useState('');

  // Macro codes that expand to full text (type code, press space/tab to expand)
  const macroCodes = {
    'MAN-HEM': 'Manual count performed using hemocytometer with improved Neubauer chamber.',
    'MAN-MICRO': 'Manual microscopic examination performed.',
    'MAN-DIFF': 'Manual differential count performed on stained blood smear.',
    'MAN-RECOUNT': 'Result verified by manual recount.',
    'MAN-DIL': 'Sample diluted prior to manual count.',
    'QNS': 'Quantity not sufficient for automated analysis.',
    'CLOT': 'Sample contained clots, manual method required.',
    'LIPEMIC': 'Lipemic sample, manual verification performed.',
    'HEMOLYZED': 'Hemolyzed sample, result may be affected.',
  };

  // Interpretation codes that can be used as macros in the interpretation text box
  const interpretationCodes = {
    // WBC interpretations
    'WBC-NL': 'White blood cell count within normal limits. No evidence of infection or hematologic abnormality.',
    'WBC-LEUK': 'Elevated WBC count. May indicate infection, inflammation, stress response, or hematologic disorder. Clinical correlation recommended.',
    'WBC-LEUKP': 'Decreased WBC count. May indicate bone marrow suppression, viral infection, or autoimmune condition. Follow-up testing recommended.',
    'WBC-NEUT': 'Elevated neutrophil count suggesting bacterial infection, inflammation, or stress response.',
    'WBC-LYMPH': 'Elevated lymphocyte percentage. Consider viral infection, chronic lymphocytic leukemia, or other lymphoproliferative disorder.',
    // RBC interpretations
    'RBC-NL': 'Red blood cell count within normal limits.',
    'RBC-ANEMOD': 'RBC count slightly below reference range. Suggests mild anemia. Recommend correlation with hemoglobin, hematocrit, and reticulocyte count.',
    'RBC-ANESEV': 'Significantly decreased RBC count indicating moderate to severe anemia. Urgent clinical evaluation recommended.',
    'RBC-POLY': 'Elevated RBC count. May indicate polycythemia vera, secondary polycythemia, or dehydration. Further workup recommended.',
    // Glucose interpretations
    'GLU-NL': 'Fasting glucose within normal limits. No evidence of glucose metabolism disorder.',
    'GLU-IFG': 'Fasting glucose in prediabetic range. Recommend lifestyle modifications and periodic monitoring.',
    'GLU-DM': 'Fasting glucose â‰¥126 mg/dL is consistent with diabetes mellitus. Recommend confirmation with repeat fasting glucose or HbA1c.',
    'GLU-HYPO': 'Low fasting glucose. May indicate insulin excess, adrenal insufficiency, or other metabolic disorder.',
    'GLU-CRIT': 'CRITICAL VALUE - Immediate physician notification required. Patient may require urgent intervention.',
  };

  // Handle macro expansion in method notes (method codes only)
  const handleMethodNotesChange = (e) => {
    let value = e.target.value;
    // Check if last word matches a method macro code (triggered by space)
    if (value.endsWith(' ')) {
      const words = value.trimEnd().split(' ');
      const lastWord = words[words.length - 1].toUpperCase();
      if (macroCodes[lastWord]) {
        words[words.length - 1] = macroCodes[lastWord];
        value = words.join(' ') + ' ';
      }
    }
    setMethodNotes(value);
  };

  // Handle macro expansion in interpretation text (interpretation codes only)
  const handleInterpretationTextChange = (e) => {
    let value = e.target.value;
    // Check if last word matches an interpretation code (triggered by space)
    if (value.endsWith(' ')) {
      const words = value.trimEnd().split(' ');
      const lastWord = words[words.length - 1].toUpperCase();
      if (interpretationCodes[lastWord]) {
        words[words.length - 1] = interpretationCodes[lastWord];
        value = words.join(' ') + ' ';
        // Also set the selected interpretation if it matches
        setSelectedInterpretation(lastWord);
      }
    }
    setInterpretationText(value);
  };

  const allResults = [
    {
      id: 1,
      labNumber: 'DEV01250000000000',
      patient: { name: 'Test, Patient', id: '3456789', dob: '01/11/2011', sex: 'M' },
      testDate: '12/18/2025',
      testName: 'White Blood Cells Count (WBC)',
      sampleType: 'Whole Blood',
      normalRange: '4.00 - 10.00',
      unit: 'x10^9/L',
      result: '',
      status: 'pending',
      analyzer: null,
      flags: [],
      program: { name: 'EQA Round 4', dueDate: '12/20/2025' },
      previousResults: [
        { date: '12/01/2025', value: '6.8', status: 'normal' },
        { date: '11/15/2025', value: '7.2', status: 'normal' },
      ],
      notes: [
        { id: 1, date: '12/18/2025 09:45', author: 'J. Smith', type: 'internal', body: 'Sample hemolyzed, may need redraw.' },
        { id: 2, date: '12/18/2025 10:15', author: 'M. Johnson', type: 'external', body: 'Patient on anticoagulation therapy.' },
      ],
      attachments: [
        { id: 1, name: 'Requisition_Form.pdf', type: 'pdf', size: '245 KB', uploadedBy: 'Order Entry', uploadedAt: '12/18/2025 08:00', source: 'order' },
        { id: 2, name: 'Previous_Results_Scan.jpg', type: 'image', size: '1.2 MB', uploadedBy: 'J. Smith', uploadedAt: '12/18/2025 09:30', source: 'result' },
      ],
      orderInfo: {
        clinician: 'Dr. Sarah Williams',
        clinicianPhone: '+1 555-0123',
        department: 'Internal Medicine',
        priority: 'Routine',
        collectionDate: '12/18/2025 08:30',
        receivedDate: '12/18/2025 09:00',
        clinicalHistory: 'Annual checkup, patient reports fatigue',
        diagnosis: 'R53.83 - Other fatigue',
        fastingStatus: 'Non-fasting',
        medicationList: 'Warfarin 5mg daily, Lisinopril 10mg daily',
        specialInstructions: 'Compare with previous EQA results',
        insuranceProvider: 'Blue Cross',
        authorizationNumber: 'AUTH-2024-78901',
      },
      suggestedInterpretation: null,
      interpretationOptions: [
        { code: 'WBC-NL', label: 'Normal', color: 'green', range: '4.00-10.00', text: 'White blood cell count within normal limits. No evidence of infection or hematologic abnormality.' },
        { code: 'WBC-LEUK', label: 'Leukocytosis', color: 'orange', range: '>10.00', text: 'Elevated WBC count. May indicate infection, inflammation, stress response, or hematologic disorder. Clinical correlation recommended.' },
        { code: 'WBC-LEUKP', label: 'Leukopenia', color: 'yellow', range: '<4.00', text: 'Decreased WBC count. May indicate bone marrow suppression, viral infection, or autoimmune condition. Follow-up testing recommended.' },
        { code: 'WBC-NEUT', label: 'Neutrophilia', color: 'orange', range: 'ANC >7.5', text: 'Elevated neutrophil count suggesting bacterial infection, inflammation, or stress response.' },
        { code: 'WBC-LYMPH', label: 'Lymphocytosis', color: 'blue', range: 'Lymph >40%', text: 'Elevated lymphocyte percentage. Consider viral infection, chronic lymphocytic leukemia, or other lymphoproliferative disorder.' },
      ],
      qcStatus: 'pass',
    },
    {
      id: 2,
      labNumber: 'DEV01250000000000',
      patient: { name: 'Test, Patient', id: '3456789', dob: '01/11/2011', sex: 'M' },
      testDate: '12/18/2025',
      testName: 'Red Blood Cells Count (RBC)',
      sampleType: 'Whole Blood',
      normalRange: '4.50 - 6.00',
      unit: 'x10^12/L',
      result: '4.2',
      status: 'entered',
      analyzer: 'Sysmex XN-L',
      flags: ['below-normal'],
      program: null,
      previousResults: [{ date: '12/01/2025', value: '4.8', status: 'normal' }],
      notes: [],
      attachments: [],
      orderInfo: {
        clinician: 'Dr. Sarah Williams',
        clinicianPhone: '+1 555-0123',
        department: 'Internal Medicine',
        priority: 'Routine',
        collectionDate: '12/18/2025 08:30',
        receivedDate: '12/18/2025 09:00',
      },
      suggestedInterpretation: { code: 'RBC-ANEMOD', label: 'Mild Anemia', color: 'yellow', text: 'RBC count slightly below reference range. Suggests mild anemia. Recommend correlation with hemoglobin, hematocrit, and reticulocyte count.' },
      interpretationOptions: [
        { code: 'RBC-NL', label: 'Normal', color: 'green', range: '4.50-6.00', text: 'Red blood cell count within normal limits.' },
        { code: 'RBC-ANEMOD', label: 'Mild Anemia', color: 'yellow', range: '3.50-4.49', text: 'RBC count slightly below reference range. Suggests mild anemia. Recommend correlation with hemoglobin, hematocrit, and reticulocyte count.' },
        { code: 'RBC-ANESEV', label: 'Moderate-Severe Anemia', color: 'red', range: '<3.50', text: 'Significantly decreased RBC count indicating moderate to severe anemia. Urgent clinical evaluation recommended. Consider iron studies, B12, folate, and peripheral smear.' },
        { code: 'RBC-POLY', label: 'Polycythemia', color: 'orange', range: '>6.00', text: 'Elevated RBC count. May indicate polycythemia vera, secondary polycythemia, or dehydration. Further workup recommended.' },
      ],
      qcStatus: 'pass',
    },
    {
      id: 3,
      labNumber: 'DEV01250000000001',
      patient: { name: 'Smith, Jane', id: '7891234', dob: '05/22/1985', sex: 'F' },
      testDate: '12/18/2025',
      testName: 'Glucose, Fasting',
      sampleType: 'Serum',
      normalRange: '70 - 99',
      unit: 'mg/dL',
      result: '142',
      status: 'entered',
      analyzer: 'Cobas c 501',
      flags: ['above-normal', 'delta-check'],
      program: null,
      previousResults: [{ date: '12/01/2025', value: '98', status: 'normal' }],
      notes: [
        { id: 1, date: '12/18/2025 11:30', author: 'K. Davis', type: 'external', body: 'Patient confirmed 12-hour fast prior to collection.' },
      ],
      attachments: [
        { id: 1, name: 'Insurance_Auth.pdf', type: 'pdf', size: '89 KB', uploadedBy: 'Order Entry', uploadedAt: '12/18/2025 06:45', source: 'order' },
      ],
      orderInfo: {
        clinician: 'Dr. Michael Chen',
        clinicianPhone: '+1 555-0456',
        department: 'Endocrinology',
        priority: 'STAT',
        collectionDate: '12/18/2025 07:00',
        receivedDate: '12/18/2025 07:30',
        clinicalHistory: 'Follow-up for prediabetes, weight loss program',
        fastingStatus: 'Fasting (12 hours)',
      },
      suggestedInterpretation: { code: 'GLU-DM', label: 'Diabetes Mellitus', color: 'red', text: 'Fasting glucose â‰¥126 mg/dL is consistent with diabetes mellitus. Recommend confirmation with repeat fasting glucose or HbA1c. Clinical correlation advised.' },
      interpretationOptions: [
        { code: 'GLU-NL', label: 'Normal', color: 'green', range: '70-99', text: 'Fasting glucose within normal limits. No evidence of glucose metabolism disorder.' },
        { code: 'GLU-IFG', label: 'Impaired Fasting Glucose', color: 'yellow', range: '100-125', text: 'Fasting glucose in prediabetic range. Recommend lifestyle modifications and periodic monitoring. Consider oral glucose tolerance test.' },
        { code: 'GLU-DM', label: 'Diabetes Mellitus', color: 'red', range: 'â‰¥126', text: 'Fasting glucose â‰¥126 mg/dL is consistent with diabetes mellitus. Recommend confirmation with repeat fasting glucose or HbA1c. Clinical correlation advised.' },
        { code: 'GLU-HYPO', label: 'Hypoglycemia', color: 'orange', range: '<70', text: 'Low fasting glucose. May indicate insulin excess, adrenal insufficiency, or other metabolic disorder. Clinical correlation required.' },
        { code: 'GLU-CRIT', label: 'Critical Value', color: 'red', range: '<50 or >400', text: 'CRITICAL VALUE - Immediate physician notification required. Patient may require urgent intervention.' },
      ],
      qcStatus: 'pass',
      deltaCheck: { previous: '98', change: '+44.9%', threshold: '20%' },
    },
  ];

  // State for displayed results (filtered from allResults)
  const [displayedResults, setDisplayedResults] = React.useState([]);

  // Simulate search/filter function
  const performSearch = () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      let filtered = [...allResults];
      
      // Apply search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
          r.labNumber.toLowerCase().includes(q) ||
          r.patient.id.toLowerCase().includes(q) ||
          r.patient.name.toLowerCase().includes(q) ||
          r.testName.toLowerCase().includes(q)
        );
      }
      
      // Apply lab unit filter (simulated - in real app would filter by lab unit)
      if (selectedLabUnit) {
        // For demo, filter by test type based on lab unit
        if (selectedLabUnit === 'hematology') {
          filtered = filtered.filter(r => 
            r.testName.includes('WBC') || r.testName.includes('RBC') || 
            r.testName.includes('Blood')
          );
        } else if (selectedLabUnit === 'chemistry') {
          filtered = filtered.filter(r => r.testName.includes('Glucose'));
        }
      }
      
      // Apply advanced filters
      if (filters.status) {
        filtered = filtered.filter(r => r.status === filters.status);
      }
      if (filters.showPendingOnly) {
        filtered = filtered.filter(r => r.status === 'pending');
      }
      if (filters.showEnteredOnly) {
        filtered = filtered.filter(r => r.status === 'entered');
      }
      
      setTotalResultCount(filtered.length);
      setDisplayedResults(filtered);
      setHasSearched(true);
      setIsLoading(false);
      setCurrentPage(1);
    }, 500);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery || selectedLabUnit) {
      performSearch();
    }
  };

  // Handle lab unit change
  const handleLabUnitChange = (value) => {
    setSelectedLabUnit(value);
    if (value) {
      // Auto-search when lab unit selected
      setTimeout(() => performSearch(), 100);
    }
  };

  // Clear all filters and reset
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLabUnit('');
    setFilters({
      labNumberFrom: '',
      labNumberTo: '',
      dateFrom: '',
      dateTo: '',
      testSection: '',
      status: '',
      showPendingOnly: false,
      showEnteredOnly: false,
    });
    setHasSearched(false);
    setDisplayedResults([]);
    setTotalResultCount(0);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalResultCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalResultCount);
  const paginatedResults = displayedResults.slice(startIndex, endIndex);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-700',
      entered: 'bg-blue-100 text-blue-700',
      'awaiting-validation': 'bg-amber-100 text-amber-700',
      released: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-200 text-gray-500 line-through',
    };
    return styles[status] || styles.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      entered: 'Entered',
      'awaiting-validation': 'Awaiting Validation',
      released: 'Released',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getFlagIcon = (flag) => {
    switch (flag) {
      case 'above-normal': return <span className="text-orange-500"><TrendingUp /></span>;
      case 'below-normal': return <span className="text-yellow-600"><TrendingDown /></span>;
      case 'delta-check': return <span className="text-red-500"><AlertTriangle /></span>;
      default: return null;
    }
  };

  const getQCStatusIndicator = (status) => {
    switch (status) {
      case 'pass': return <div className="w-2 h-2 rounded-full bg-green-500" title="QC Passed" />;
      case 'warning': return <div className="w-2 h-2 rounded-full bg-yellow-500" title="QC Warning" />;
      case 'fail': return <div className="w-2 h-2 rounded-full bg-red-500" title="QC Failed" />;
      default: return <div className="w-2 h-2 rounded-full bg-gray-300" />;
    }
  };

  const getInterpretationColor = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-700 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[color] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getLotStatusStyle = (status, isFifo) => {
    if (status === 'expiring-soon') return 'border-amber-300 bg-amber-50';
    if (status === 'expired') return 'border-red-300 bg-red-50 opacity-50';
    if (isFifo) return 'border-teal-300 bg-teal-50';
    return 'border-gray-200 bg-white';
  };

  const calculateAge = (dob) => {
    const [month, day, year] = dob.split('/');
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const [showNoteInput, setShowNoteInput] = React.useState(false);
  const [noteType, setNoteType] = React.useState('internal');
  const [noteText, setNoteText] = React.useState('');

  // Icons
  const MessageSquareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
  const PaperclipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
  const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
  const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
  const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
  const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
  const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Results Entry</h1>
            <p className="text-sm text-gray-500 mt-1">Enter and manage test results</p>
          </div>
          {hasSearched && (
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">{totalResultCount}</span> results found
            </div>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Lab Unit Dropdown */}
          <select 
            value={selectedLabUnit}
            onChange={(e) => handleLabUnitChange(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 w-48"
          >
            <option value="">Select Lab Unit...</option>
            {labUnits.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
          
          <span className="text-gray-400">or</span>
          
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              placeholder="Search by lab number, patient name/ID, accession..." 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" 
            />
          </div>
          
          {/* Search Button */}
          <button 
            type="submit"
            disabled={!searchQuery && !selectedLabUnit}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              searchQuery || selectedLabUnit
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Search
          </button>
          
          <button 
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1 px-3 py-2.5 border rounded-lg text-sm ${showAdvancedFilters ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <FilterIcon /> Filters {showAdvancedFilters ? 'â–²' : 'â–¼'}
          </button>
          
          {hasSearched && (
            <button 
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Lab Number From</label>
                <input 
                  type="text" 
                  value={filters.labNumberFrom}
                  onChange={(e) => setFilters({...filters, labNumberFrom: e.target.value})}
                  placeholder="e.g., DEV0125..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Lab Number To</label>
                <input 
                  type="text" 
                  value={filters.labNumberTo}
                  onChange={(e) => setFilters({...filters, labNumberTo: e.target.value})}
                  placeholder="To (optional)" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Date From</label>
                <input 
                  type="date" 
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Date To</label>
                <input 
                  type="date" 
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" 
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Test Section</label>
                <select
                  value={filters.testSection}
                  onChange={(e) => setFilters({...filters, testSection: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Sections</option>
                  {testSections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="entered">Entered</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Quick Filters</label>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.showPendingOnly}
                      onChange={(e) => setFilters({...filters, showPendingOnly: e.target.checked, showEnteredOnly: false})}
                      className="rounded border-gray-300 text-teal-600"
                    />
                    Pending
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.showEnteredOnly}
                      onChange={(e) => setFilters({...filters, showEnteredOnly: e.target.checked, showPendingOnly: false})}
                      className="rounded border-gray-300 text-teal-600"
                    />
                    Entered
                  </label>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={performSearch}
                  disabled={!searchQuery && !selectedLabUnit}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    searchQuery || selectedLabUnit
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Initial State - Before Search */}
      {!hasSearched && !isLoading && (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <SearchIcon />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search to View Results</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Select a lab unit from the dropdown or enter a search term to view pending results.
              This helps ensure only relevant data is loaded.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading results...</p>
          </div>
        </div>
      )}

      {/* Results View - After Search */}
      {hasSearched && !isLoading && (
        <>
          {/* Results Count Bar */}
          <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Found <span className="font-medium text-gray-900">{totalResultCount}</span> results
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                  {displayedResults.filter(r => r.status === 'pending').length} Pending
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {displayedResults.filter(r => r.status === 'entered').length} Entered
                </span>
              </div>
            </div>
          </div>

      {/* Results Table */}
      <div className="px-6 py-4">
        {paginatedResults.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div className="col-span-1"></div>
            <div className="col-span-2">Sample / Patient</div>
            <div className="col-span-2">Test</div>
            <div className="col-span-1">Analyzer</div>
            <div className="col-span-1">Range</div>
            <div className="col-span-2">Result</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Flags</div>
            <div className="col-span-1"></div>
          </div>

          {/* Result Rows */}
          {paginatedResults.map((result) => (
            <div key={result.id} className="border-b border-gray-200 last:border-b-0">
              {/* Main Row */}
              <div className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 cursor-pointer ${expandedRow === result.id ? 'bg-teal-50' : ''}`}
                onClick={() => setExpandedRow(expandedRow === result.id ? null : result.id)}>
                <div className="col-span-1 flex items-center gap-2">
                  {expandedRow === result.id ? <ChevronDown /> : <ChevronRight />}
                  {getQCStatusIndicator(result.qcStatus)}
                </div>

                <div className="col-span-2">
                  <div className="text-sm font-medium text-gray-900 truncate">{result.labNumber}</div>
                  <div className="text-xs text-gray-500">ID: {result.patient.id}</div>
                  <div className="text-xs text-gray-400">{result.patient.sex}, Age: {calculateAge(result.patient.dob)}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm font-medium text-gray-900">{result.testName}</div>
                  <div className="text-xs text-gray-500">{result.sampleType}</div>
                  {result.program && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 mt-1">
                      {result.program.name}
                    </span>
                  )}
                </div>

                <div className="col-span-1">
                  <div className="flex items-center gap-1.5">
                    <CpuIcon />
                    <span className="text-sm text-gray-600">{result.analyzer || 'â€”'}</span>
                  </div>
                </div>

                <div className="col-span-1">
                  <div className="text-sm text-gray-600">{result.normalRange}</div>
                  <div className="text-xs text-gray-400">{result.unit}</div>
                </div>

                <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                  <input type="text" defaultValue={result.result} placeholder="Enter result"
                    className={`w-full px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-teal-500 ${
                      result.flags.includes('above-normal') || result.flags.includes('delta-check') ? 'border-orange-300 bg-orange-50' :
                      result.flags.includes('below-normal') ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                    }`} />
                </div>

                <div className="col-span-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(result.status)}`}>
                    {result.status}
                  </span>
                </div>

                <div className="col-span-1 flex items-center gap-1">
                  {result.flags.map((flag, idx) => <span key={idx}>{getFlagIcon(flag)}</span>)}
                  {result.flags.length === 0 && <span className="text-gray-300">â€”</span>}
                </div>

                <div className="col-span-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Accept Result"><CheckIcon /></button>
                  <button 
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    className={`p-1.5 rounded ${showNoteInput ? 'text-teal-600 bg-teal-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`} 
                    title="Add Note">
                    <MessageSquareIcon />
                  </button>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {expandedRow === result.id && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                  {/* Patient Info Banner (shown only when expanded) */}
                  <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Patient</div>
                        <div className="text-sm font-medium text-gray-900">{result.patient.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Patient ID</div>
                        <div className="text-sm text-gray-900">{result.patient.id}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">DOB</div>
                        <div className="text-sm text-gray-900">{result.patient.dob}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Sex</div>
                        <div className="text-sm text-gray-900">{result.patient.sex}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Age</div>
                        <div className="text-sm text-gray-900">{calculateAge(result.patient.dob)} years</div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section - Always Visible */}
                  <div className="mb-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquareIcon /> Notes
                      </h4>
                      
                      {/* Notes Table */}
                      {result.notes.length > 0 ? (
                        <div className="mb-3 overflow-hidden rounded-lg border border-gray-200">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {result.notes.map((note) => (
                                <tr key={note.id}>
                                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{note.date}</td>
                                  <td className="px-3 py-2 text-gray-600">{note.author}</td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      note.type === 'internal' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {note.type === 'internal' ? 'In Lab Only' : 'Send with Result'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">{note.body}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : !showNoteInput && (
                        <p className="text-sm text-gray-500 mb-3">No notes for this result.</p>
                      )}

                      {/* Add Note Input */}
                      {showNoteInput && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-xs font-medium text-gray-500 uppercase">New Note</label>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="noteType" 
                                  value="internal"
                                  checked={noteType === 'internal'}
                                  onChange={() => setNoteType('internal')}
                                  className="text-teal-600" 
                                />
                                <span className="text-sm text-gray-700">In Lab Only</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="noteType" 
                                  value="external"
                                  checked={noteType === 'external'}
                                  onChange={() => setNoteType('external')}
                                  className="text-teal-600" 
                                />
                                <span className="text-sm text-gray-700">Send with Result</span>
                              </label>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <textarea 
                              rows={2}
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Enter note..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                            />
                            <div className="flex flex-col gap-1">
                              <button className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded">
                                Save Note
                              </button>
                              <button 
                                onClick={() => {
                                  setShowNoteInput(false);
                                  setNoteText('');
                                }}
                                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* New Note Button - Always at bottom right */}
                      {!showNoteInput && (
                        <div className="flex justify-end">
                          <button 
                            onClick={() => setShowNoteInput(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-md border border-teal-200"
                          >
                            <MessageSquareIcon /> New Note
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interpretation Section */}
                  <div className="mb-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileTextIcon /> Interpretation
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        {/* Available Interpretations */}
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                            Available Interpretations
                            <span className="ml-2 text-gray-400 font-normal normal-case">(click to use)</span>
                          </label>
                          {result.suggestedInterpretation && (
                            <div 
                              onClick={() => {
                                setSelectedInterpretation(result.suggestedInterpretation.code);
                                setInterpretationText(result.suggestedInterpretation.text);
                              }}
                              className={`mb-3 p-3 rounded-lg cursor-pointer transition-all ${
                                selectedInterpretation === result.suggestedInterpretation.code
                                  ? 'bg-blue-100 border-2 border-blue-400 ring-2 ring-blue-200'
                                  : 'bg-blue-50 border border-blue-200 hover:border-blue-300'
                              }`}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600"><ZapIcon /></span>
                                  <span className="text-xs font-medium text-blue-900">Suggested:</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getInterpretationColor(result.suggestedInterpretation.color)}`}>
                                    {result.suggestedInterpretation.label}
                                  </span>
                                </div>
                                {selectedInterpretation === result.suggestedInterpretation.code && (
                                  <span className="text-xs text-blue-700 font-medium">âœ“ Selected</span>
                                )}
                              </div>
                              <p className="text-xs text-blue-800 mt-1 line-clamp-2">{result.suggestedInterpretation.text}</p>
                            </div>
                          )}
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {result.interpretationOptions.map((opt) => (
                              <div 
                                key={opt.code} 
                                onClick={() => {
                                  setSelectedInterpretation(opt.code);
                                  setInterpretationText(opt.text);
                                }}
                                className={`p-3 rounded-lg cursor-pointer transition-all ${
                                  selectedInterpretation === opt.code
                                    ? 'border-2 border-teal-400 bg-teal-50 ring-2 ring-teal-200'
                                    : 'border border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                                }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getInterpretationColor(opt.color)}`}>
                                      {opt.label}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">{opt.code}</span>
                                    <span className="text-xs text-gray-400">({opt.range})</span>
                                  </div>
                                  {selectedInterpretation === opt.code && (
                                    <span className="text-xs text-teal-700 font-medium">âœ“ Selected</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{opt.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Interpretation Text */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interpretation Text</label>
                            {interpretationText && (
                              <button 
                                onClick={() => {
                                  setInterpretationText('');
                                  setSelectedInterpretation(null);
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600">
                                Clear
                              </button>
                            )}
                          </div>
                          <textarea 
                            rows={5} 
                            value={interpretationText}
                            onChange={handleInterpretationTextChange}
                            placeholder="Click an interpretation option, or type a code (e.g., WBC-NL) and press space to expand..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" />
                          <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                            <strong>Shortcut:</strong> Type an interpretation code (e.g., <span className="font-mono bg-gray-100 px-1">WBC-NL</span>, <span className="font-mono bg-gray-100 px-1">GLU-DM</span>) and press space to expand.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Program Banner */}
                  {result.program && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><FileTextIcon /></div>
                        <div>
                          <div className="font-medium text-purple-900">{result.program.name}</div>
                          <div className="text-sm text-purple-700">Due: {result.program.dueDate}</div>
                        </div>
                      </div>
                      <button className="text-sm text-purple-700 hover:text-purple-900 font-medium">View Program Details â†’</button>
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="flex items-center gap-1 border-b border-gray-200 mb-4">
                    {[
                      { id: 'method', label: 'Method & Reagents', icon: <FlaskIcon /> },
                      { id: 'orderinfo', label: 'Order Info', icon: <ClipboardListIcon /> },
                      { id: 'attachments', label: 'Attachments', icon: <PaperclipIcon /> },
                      { id: 'history', label: 'History', icon: <HistoryIcon /> },
                      { id: 'qaqc', label: 'QA/QC', icon: <CheckCircleIcon /> },
                      { id: 'referral', label: 'Referral', icon: <SendIcon /> },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                          selectedTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}>
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="min-h-[200px]">
                    {/* Method & Reagents Tab */}
                    {selectedTab === 'method' && (
                      <div className="grid grid-cols-2 gap-6">
                        {/* Method Selection */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <CpuIcon /> Method
                          </h4>
                          
                          {/* Method Type Selection */}
                          <div className="space-y-2 mb-4">
                            {/* Manual Option - Always Available */}
                            <label className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedMethod === 'manual'
                                ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}>
                              <div className="flex items-center gap-3">
                                <input type="radio" name="method" value="manual"
                                  checked={selectedMethod === 'manual'}
                                  onChange={() => { setSelectedMethod('manual'); setSelectedAnalyzer(null); }}
                                  className="text-teal-600 focus:ring-teal-500" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Manual</div>
                                  <div className="text-xs text-gray-500">Manual entry without analyzer</div>
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                default
                              </span>
                            </label>

                            {/* Analyzer Option */}
                            <label className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedMethod === 'analyzer'
                                ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}>
                              <div className="flex items-center gap-3">
                                <input type="radio" name="method" value="analyzer"
                                  checked={selectedMethod === 'analyzer'}
                                  onChange={() => setSelectedMethod('analyzer')}
                                  className="text-teal-600 focus:ring-teal-500" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Analyzer</div>
                                  <div className="text-xs text-gray-500">Result from automated analyzer</div>
                                </div>
                              </div>
                            </label>
                          </div>

                          {/* Manual Method - Notes/Details */}
                          {selectedMethod === 'manual' && (
                            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Method Details <span className="text-gray-400 font-normal">(optional)</span>
                              </label>
                              <textarea
                                rows={3}
                                value={methodNotes}
                                onChange={handleMethodNotesChange}
                                placeholder="Enter details or type a macro code (e.g., MAN-HEM, QNS, CLOT)..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                              />
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                <div className="text-xs text-blue-700">
                                  <strong>Macro codes:</strong> Type a code and press space to expand.
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.keys(macroCodes).map(code => (
                                    <span key={code} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-700">
                                      {code}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Analyzer Selection - Only when analyzer method selected */}
                          {selectedMethod === 'analyzer' && (
                            <div className="mt-4">
                              <label className="text-sm font-medium text-gray-600 mb-2 block">Select Analyzer</label>
                              <div className="space-y-2">
                                {availableAnalyzers.filter(a => a.id !== 'manual').map((analyzer) => (
                                  <label key={analyzer.id}
                                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                      selectedAnalyzer === analyzer.id 
                                        ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' 
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                      <input type="radio" name="analyzer" value={analyzer.id}
                                        checked={selectedAnalyzer === analyzer.id}
                                        onChange={() => setSelectedAnalyzer(analyzer.id)}
                                        className="text-teal-600 focus:ring-teal-500" />
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{analyzer.name}</div>
                                        {analyzer.lastCalibrated && (
                                          <div className="text-xs text-gray-500">Last calibrated: {analyzer.lastCalibrated}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {analyzer.qcStatus === 'pass' && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                          QC âœ“
                                        </span>
                                      )}
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        analyzer.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {analyzer.status}
                                      </span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reagent Selection */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <BeakerIcon /> Reagent Lots Used
                          </h4>
                          <div className="space-y-4">
                            {availableReagents.map((reagent) => (
                              <div key={reagent.id}>
                                <label className="text-sm font-medium text-gray-600 mb-2 block">{reagent.name}</label>
                                <div className="space-y-2">
                                  {reagent.lots.map((lot) => (
                                    <label key={lot.lotNumber}
                                      className={`flex items-center justify-between p-2.5 border-2 rounded-lg cursor-pointer transition-colors ${
                                        selectedReagentLots[reagent.id] === lot.lotNumber
                                          ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                                          : lot.fifoRank === 1 && !selectedReagentLots[reagent.id]
                                            ? 'border-teal-300 bg-teal-50/50 hover:border-teal-400'
                                            : getLotStatusStyle(lot.status, false)
                                      }`}>
                                      <div className="flex items-center gap-3">
                                        <input type="radio" name={`reagent-${reagent.id}`} value={lot.lotNumber}
                                          checked={selectedReagentLots[reagent.id] === lot.lotNumber}
                                          onChange={() => setSelectedReagentLots({...selectedReagentLots, [reagent.id]: lot.lotNumber})}
                                          className="text-teal-600 focus:ring-teal-500" />
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-gray-900">{lot.lotNumber}</span>
                                            {lot.fifoRank === 1 && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700 border border-teal-300">
                                                <ClockIcon /> FIFO Suggested
                                              </span>
                                            )}
                                            {lot.status === 'expiring-soon' && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                                <AlertCircleIcon /> Expiring
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            Exp: {lot.expires} â€¢ {lot.remaining} remaining
                                          </div>
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-xs text-blue-700">
                              <ZapIcon />
                              <span><strong>FIFO Suggestion:</strong> Lots marked "FIFO Suggested" are the oldest unexpired lots. Select them to ensure proper stock rotation.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Info Tab */}
                    {selectedTab === 'orderinfo' && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Order Information</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {result.orderInfo.clinician && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Ordering Clinician</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.clinician}</div>
                              {result.orderInfo.clinicianPhone && (
                                <div className="text-xs text-gray-500 mt-1">{result.orderInfo.clinicianPhone}</div>
                              )}
                            </div>
                          )}
                          {result.orderInfo.department && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Department</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.department}</div>
                            </div>
                          )}
                          {result.orderInfo.priority && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Priority</div>
                              <div className="text-sm text-gray-900">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  result.orderInfo.priority === 'STAT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {result.orderInfo.priority}
                                </span>
                              </div>
                            </div>
                          )}
                          {result.orderInfo.collectionDate && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Collection Date/Time</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.collectionDate}</div>
                            </div>
                          )}
                          {result.orderInfo.receivedDate && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Received Date/Time</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.receivedDate}</div>
                            </div>
                          )}
                          {result.orderInfo.fastingStatus && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Fasting Status</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.fastingStatus}</div>
                            </div>
                          )}
                          {result.orderInfo.clinicalHistory && (
                            <div className="col-span-2 p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Clinical History</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.clinicalHistory}</div>
                            </div>
                          )}
                          {result.orderInfo.diagnosis && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Diagnosis</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.diagnosis}</div>
                            </div>
                          )}
                          {result.orderInfo.medicationList && (
                            <div className="col-span-2 p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Medication List</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.medicationList}</div>
                            </div>
                          )}
                          {result.orderInfo.specialInstructions && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Special Instructions</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.specialInstructions}</div>
                            </div>
                          )}
                          {result.orderInfo.insuranceProvider && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Insurance Provider</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.insuranceProvider}</div>
                            </div>
                          )}
                          {result.orderInfo.authorizationNumber && (
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-500 uppercase mb-1">Authorization #</div>
                              <div className="text-sm text-gray-900">{result.orderInfo.authorizationNumber}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Attachments Tab */}
                    {selectedTab === 'attachments' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-md border border-teal-200">
                            <UploadIcon /> Upload File
                          </button>
                        </div>
                        
                        {result.attachments && result.attachments.length > 0 ? (
                          <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {result.attachments.map((attachment) => (
                                  <tr key={attachment.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        {attachment.type === 'image' ? (
                                          <span className="text-blue-500"><ImageIcon /></span>
                                        ) : (
                                          <span className="text-red-500"><FileIcon /></span>
                                        )}
                                        <span className="text-gray-900 font-medium">{attachment.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">{attachment.size}</td>
                                    <td className="px-3 py-2">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        attachment.source === 'order' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                                      }`}>
                                        {attachment.source === 'order' ? 'Order Entry' : 'Result Entry'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">{attachment.uploadedBy}</td>
                                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{attachment.uploadedAt}</td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-1">
                                        <button className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded" title="Download">
                                          <DownloadIcon />
                                        </button>
                                        {attachment.source === 'result' && (
                                          <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                                            <TrashIcon />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                            <PaperclipIcon />
                            <p className="text-sm text-gray-500 mt-2">No attachments</p>
                            <p className="text-xs text-gray-400 mt-1">Upload files or view attachments from order entry</p>
                          </div>
                        )}
                        
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-blue-700">
                            <ZapIcon />
                            <span>Files attached at order entry are marked <span className="font-medium">"Order Entry"</span> and cannot be deleted. Files uploaded during result entry can be removed.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* History Tab */}
                    {selectedTab === 'history' && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Previous Results</h4>
                        {result.deltaCheck && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-red-600"><AlertTriangle /></span>
                              <span className="text-sm font-medium text-red-900">Delta Check Alert</span>
                            </div>
                            <div className="mt-1 text-sm text-red-700">
                              Change of <span className="font-medium">{result.deltaCheck.change}</span> from previous value ({result.deltaCheck.previous}) exceeds threshold of {result.deltaCheck.threshold}
                            </div>
                          </div>
                        )}
                        {result.previousResults.length > 0 ? (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="pb-2 font-medium">Date</th>
                                <th className="pb-2 font-medium">Result</th>
                                <th className="pb-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.previousResults.map((prev, idx) => (
                                <tr key={idx} className="border-t border-gray-100">
                                  <td className="py-2 text-gray-600">{prev.date}</td>
                                  <td className="py-2">{prev.value} {result.unit}</td>
                                  <td className="py-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      prev.status === 'normal' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>{prev.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <HistoryIcon />
                            <p className="mt-2">No previous results for this test</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* QA/QC Tab */}
                    {selectedTab === 'qaqc' && (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Control Results</h4>
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600"><CheckCircleIcon /></span>
                              <span className="font-medium text-green-900">QC Status: Passed</span>
                            </div>
                            <div className="text-sm text-green-700 mt-1">All controls within acceptable range</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Method</h4>
                          <div className="p-3 border border-gray-200 rounded-lg flex items-center gap-3">
                            <CpuIcon />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {selectedMethod === 'manual' 
                                  ? 'Manual'
                                  : availableAnalyzers.find(a => a.id === selectedAnalyzer)?.name || 'No analyzer selected'
                                }
                              </div>
                              {selectedMethod === 'analyzer' && selectedAnalyzer && (
                                <div className="text-xs text-green-600">Online â€¢ QC Passed</div>
                              )}
                              {selectedMethod === 'manual' && (
                                <div className="text-xs text-gray-500">Manual entry</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Referral Tab */}
                    {selectedTab === 'referral' && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <input type="checkbox" id="referTest" className="rounded border-gray-300 text-teal-600" />
                          <label htmlFor="referTest" className="text-sm font-medium text-gray-700">Refer this test to a reference lab</label>
                        </div>
                        <div className="grid grid-cols-2 gap-4 opacity-50">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Referral Reason</label>
                            <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50">
                              <option>Select reason...</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Institute</label>
                            <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50">
                              <option>Select institute...</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Method:</span>{' '}
                      {selectedMethod === 'manual' 
                        ? 'Manual'
                        : selectedAnalyzer 
                          ? availableAnalyzers.find(a => a.id === selectedAnalyzer)?.name 
                          : <span className="text-gray-400 italic">Select analyzer</span>
                      }
                      {' â€¢ '}
                      {Object.keys(selectedReagentLots).length > 0 
                        ? `${Object.keys(selectedReagentLots).length} reagent lot${Object.keys(selectedReagentLots).length > 1 ? 's' : ''}`
                        : <span className="text-gray-400 italic">No reagent lots</span>
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded-md font-medium">Accept Result</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No results found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {paginatedResults.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            {/* Left side - showing info */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>
                Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
                <span className="font-medium text-gray-900">{endIndex}</span> of{' '}
                <span className="font-medium text-gray-900">{totalResultCount}</span> results
              </span>
            </div>
            
            {/* Center - page size selector */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-gray-500">per page</span>
            </div>
            
            {/* Right side - pagination controls */}
            <div className="flex items-center gap-1">
              {/* First page */}
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="First page"
              >
                Â«Â«
              </button>
              
              {/* Previous page */}
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1 mx-2">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                  
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }
                  
                  if (startPage > 1) {
                    pages.push(
                      <button key={1} onClick={() => setCurrentPage(1)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">1</button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="dots1" className="px-2 text-gray-400">...</span>);
                    }
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-1 rounded text-sm ${
                          currentPage === i
                            ? 'bg-teal-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<span key="dots2" className="px-2 text-gray-400">...</span>);
                    }
                    pages.push(
                      <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">{totalPages}</button>
                    );
                  }
                  
                  return pages;
                })()}
              </div>
              
              {/* Next page */}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
              
              {/* Last page */}
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Last page"
              >
                Â»Â»
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};

export default ResultsPageRedesign;
