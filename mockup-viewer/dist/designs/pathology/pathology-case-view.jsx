import React, { useState, useRef } from 'react';

// OpenELIS Pathology Case View Redesign Mockup
// Carbon Design System patterns with anchored sidebar navigation

const PathologyCaseView = () => {
  const [expandedSections, setExpandedSections] = useState({
    caseInfo: true,
    grossing: true,
    blocks: true,
    slides: false,
    staining: true,
    review: false,
    findings: false,
    reports: false,
  });
  
  const [caseData, setCaseData] = useState({
    labNumber: '24TST000010',
    requestDate: '2024-08-07',
    patientName: 'BISS, SEE',
    dob: '1985-03-15',
    gender: 'M',
    unitNumber: 'UN-2024-0847',
    privateReferenceNumber: 'PRN-55123',
    provider: 'Dr. Alexandre Mboule',
    specimen: 'Liver tissue, right lobe',
    specimenType: 'Tissue Biopsy',
    natureSiteOfSpecimen: 'Liver - Right Lobe, Segment VII',
    procedurePerformed: 'Ultrasound-guided core needle biopsy',
    provisionalDiagnosis: 'Suspected hepatocellular carcinoma',
    previousSurgeryTreatment: 'None',
    clinicalHistory: 'Rule out malignancy. Patient presents with elevated liver enzymes (ALT 156, AST 142). Ultrasound showed 3.2cm hypoechoic lesion.',
    status: 'PROCESSING',
    assignedTechnician: 'ELIS, Open',
    assignedPathologist: '',
  });

  const [grossingData, setGrossingData] = useState({
    status: 'Processing',
    technician: 'ELIS, Open',
    receivedDate: '2024-08-07',
    condition: 'Adequate',
    grossDescription: 'Irregular tissue fragment measuring 2.5 x 1.8 x 0.9 cm. Cut surface shows tan-white nodular appearance.',
    notes: '',
  });

  const [blocks, setBlocks] = useState([
    { id: 'A', barcode: '24TST000010.A', location: 'Rack 2, Slot 5', tissueType: 'Liver - Central', createdDate: '2024-08-07' },
    { id: 'B', barcode: '24TST000010.B', location: 'Rack 2, Slot 6', tissueType: 'Liver - Peripheral', createdDate: '2024-08-07' },
    { id: 'C', barcode: '24TST000010.C', location: 'Rack 2, Slot 7', tissueType: 'Margin', createdDate: '2024-08-07' },
  ]);

  const [slides, setSlides] = useState([
    { 
      id: 'S001', barcode: '24TST000010.A.S001', sourceBlock: 'A', location: 'Tray 1-A', 
      stainType: 'H&E', stainCode: 'H&E', stainStatus: 'Complete', stainedDate: '2024-08-08', stainedBy: 'ELIS, Open',
      scans: [
        { id: 'scan-1c', scannedDate: '2024-08-10 09:15', scanner: 'Aperio AT2', magnification: '40x', resolution: '98,304 × 65,536', fileSize: '1.4 GB', notes: 'Rescan - improved focus quality' },
        { id: 'scan-1b', scannedDate: '2024-08-09 14:32', scanner: 'Aperio AT2', magnification: '40x', resolution: '98,304 × 65,536', fileSize: '1.2 GB', notes: '' },
        { id: 'scan-1a', scannedDate: '2024-08-09 11:05', scanner: 'Aperio AT2', magnification: '20x', resolution: '49,152 × 32,768', fileSize: '680 MB', notes: 'Initial scan' },
      ]
    },
    { 
      id: 'S002', barcode: '24TST000010.A.S002', sourceBlock: 'A', location: 'Tray 1-B', 
      stainType: 'PAS', stainCode: 'PAS', stainStatus: 'Complete', stainedDate: '2024-08-08', stainedBy: 'ELIS, Open',
      scans: [
        { id: 'scan-2a', scannedDate: '2024-08-09 15:10', scanner: 'Aperio AT2', magnification: '40x', resolution: '85,120 × 54,272', fileSize: '980 MB', notes: '' },
      ]
    },
    { id: 'S003', barcode: '24TST000010.B.S003', sourceBlock: 'B', location: 'Tray 1-C', stainType: 'H&E', stainCode: 'H&E', stainStatus: 'In Progress', stainedDate: null, stainedBy: null, scans: [] },
    { id: 'S004', barcode: '24TST000010.B.S004', sourceBlock: 'B', location: 'Tray 1-D', stainType: 'Masson Trichrome', stainCode: 'TRIC', stainStatus: 'Pending', stainedDate: null, stainedBy: null, scans: [] },
    { id: 'S005', barcode: '24TST000010.C.S005', sourceBlock: 'C', location: 'Tray 1-E', stainType: null, stainCode: null, stainStatus: 'Not Assigned', stainedDate: null, stainedBy: null, scans: [] },
  ]);

  // Pathologist requests - unified for blocks, slides, and stains
  const [pathologistRequests, setPathologistRequests] = useState([
    { id: 1, requestType: 'SLIDE', targetType: 'Block', targetId: 'A', stainType: null, notes: 'Thinner slices needed - 3μm instead of standard 5μm', priority: 'URGENT', requestedBy: 'Dr. Mboule', requestDate: '2024-08-10', status: 'Pending' },
    { id: 2, requestType: 'STAIN', targetType: 'Slide', targetId: 'S001', stainType: 'Reticulin', notes: 'Assess fibrosis pattern', priority: 'NORMAL', requestedBy: 'Dr. Mboule', requestDate: '2024-08-10', status: 'Pending' },
    { id: 3, requestType: 'BLOCK', targetType: null, targetId: null, stainType: null, notes: 'Need additional margin tissue from superior aspect', priority: 'NORMAL', requestedBy: 'Dr. Mboule', requestDate: '2024-08-09', status: 'Complete' },
  ]);

  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [showReadyForReviewDialog, setShowReadyForReviewDialog] = useState(false);
  const [requestModalContext, setRequestModalContext] = useState({ type: null, target: null }); // For auto-populating
  const [showBulkStainModal, setShowBulkStainModal] = useState(false);
  const [selectedSlidesForStain, setSelectedSlidesForStain] = useState([]);
  const [showPrintBlockLabelsModal, setShowPrintBlockLabelsModal] = useState(false);
  const [showPrintSlideLabelsModal, setShowPrintSlideLabelsModal] = useState(false);
  const [showUploadScansModal, setShowUploadScansModal] = useState(false);
  const [showViewSlideModal, setShowViewSlideModal] = useState(false);
  const [showSelectScanModal, setShowSelectScanModal] = useState(false);
  const [selectedSlideForView, setSelectedSlideForView] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(4);
  const [alwaysOpenMostRecent, setAlwaysOpenMostRecent] = useState(false);

  // Calculate pending requests by section
  const pendingBlockRequests = pathologistRequests.filter(r => r.requestType === 'BLOCK' && r.status === 'Pending').length;
  const pendingSlideRequests = pathologistRequests.filter(r => r.requestType === 'SLIDE' && r.status === 'Pending').length;
  const pendingStainRequests = pathologistRequests.filter(r => r.requestType === 'STAIN' && r.status === 'Pending').length;
  const totalPendingRequests = pendingBlockRequests + pendingSlideRequests + pendingStainRequests;

  // Case workflow state
  const [caseReadyForReview, setCaseReadyForReview] = useState(false);

  const availableStainTypes = [
    'H&E (Hematoxylin & Eosin)',
    'PAS (Periodic Acid-Schiff)',
    'Masson Trichrome',
    'Reticulin',
    'Iron (Prussian Blue)',
    'Congo Red',
    'Oil Red O',
    'Giemsa',
    'Gram',
    'Ziehl-Neelsen (AFB)',
    'Mucicarmine',
    'Alcian Blue',
    'Elastic (EVG)',
    'Silver (GMS)',
  ];

  // Dictionary: Pathology - Techniques (with short code and full name)
  const [availableTechniques, setAvailableTechniques] = useState([
    { shortCode: 'HE', fullName: 'H&E (Hematoxylin & Eosin)' },
    { shortCode: 'IHC', fullName: 'Immunohistochemistry' },
    { shortCode: 'SS', fullName: 'Special Stains' },
    { shortCode: 'FS', fullName: 'Frozen Section' },
    { shortCode: 'MOL', fullName: 'Molecular' },
    { shortCode: 'FC', fullName: 'Flow Cytometry' },
    { shortCode: 'FISH', fullName: 'Fluorescence In Situ Hybridization' },
    { shortCode: 'PCR', fullName: 'Polymerase Chain Reaction' },
    { shortCode: 'EM', fullName: 'Electron Microscopy' },
    { shortCode: 'CG', fullName: 'Cytogenetics' },
  ]);
  const [selectedTechniques, setSelectedTechniques] = useState([]);
  const [techniqueSearch, setTechniqueSearch] = useState('');
  const [showTechniqueDropdown, setShowTechniqueDropdown] = useState(false);
  const [showAddTechniqueModal, setShowAddTechniqueModal] = useState(false);
  const [newTechniqueShortCode, setNewTechniqueShortCode] = useState('');
  const [newTechniqueFullName, setNewTechniqueFullName] = useState('');
  const [newTechniqueDoNotSave, setNewTechniqueDoNotSave] = useState(false);

  // Text Macros System
  const [textMacros, setTextMacros] = useState([
    // My Macros (current user's)
    { id: 1, shortCode: '.nmi', text: 'No malignancy identified in the examined sections. The tissue shows normal histological architecture with no evidence of dysplasia or neoplastic changes.', fieldType: 'ALL', owner: 'me', ownerName: 'Dr. Mboule', isShared: false, isEnabled: true },
    { id: 2, shortCode: '.chronic', text: 'Sections show chronic inflammatory infiltrate composed predominantly of lymphocytes and plasma cells. No granulomas or malignancy identified.', fieldType: 'MICROSCOPY', owner: 'me', ownerName: 'Dr. Mboule', isShared: false, isEnabled: true },
    { id: 3, shortCode: '.adequat', text: 'The specimen is adequate for evaluation. Tissue orientation maintained.', fieldType: 'GROSS', owner: 'me', ownerName: 'Dr. Mboule', isShared: false, isEnabled: true },
    // Shared Macros (other users')
    { id: 4, shortCode: '.hcc', text: 'Hepatocellular carcinoma, {grade}, composed of tumor cells arranged in trabecular and pseudoglandular patterns. {additional}', fieldType: 'MICROSCOPY', owner: 'user2', ownerName: 'Dr. Smith', isShared: true, isEnabled: true },
    { id: 5, shortCode: '.adeno', text: 'Adenocarcinoma, {differentiation}, measuring {size} in greatest dimension. Tumor extends to {depth}. Margins {margin_status}.', fieldType: 'MICROSCOPY', owner: 'user3', ownerName: 'Dr. Chen', isShared: true, isEnabled: true },
    { id: 6, shortCode: '.benign', text: 'Benign tissue with no evidence of malignancy or dysplasia.', fieldType: 'CONCLUSION', owner: 'user2', ownerName: 'Dr. Smith', isShared: true, isEnabled: false },
    // System Macros
    { id: 7, shortCode: '.insuff', text: 'Specimen insufficient for diagnosis. Recommend repeat sampling if clinically indicated.', fieldType: 'ALL', owner: 'system', ownerName: 'System', isShared: true, isEnabled: true },
    { id: 8, shortCode: '.defer', text: 'Defer to permanent sections for final diagnosis. Preliminary findings suggest {preliminary}.', fieldType: 'ALL', owner: 'system', ownerName: 'System', isShared: true, isEnabled: true },
  ]);
  const [showMacroDropdown, setShowMacroDropdown] = useState(null); // field name or null
  const [showManageMacrosModal, setShowManageMacrosModal] = useState(false);
  const [macroTab, setMacroTab] = useState('my'); // 'my', 'shared', 'system'
  const [showCreateMacroModal, setShowCreateMacroModal] = useState(false);
  const [editingMacro, setEditingMacro] = useState(null);
  const [newMacroShortCode, setNewMacroShortCode] = useState('');
  const [newMacroText, setNewMacroText] = useState('');
  const [newMacroFieldType, setNewMacroFieldType] = useState('ALL');
  const [newMacroIsShared, setNewMacroIsShared] = useState(false);
  const [macroSearchTerm, setMacroSearchTerm] = useState('');

  // Dictionary: Pathology - Diagnoses (with linked ICD-10 and SNOMED codes)
  const [availableDiagnoses, setAvailableDiagnoses] = useState([
    { id: 1, name: 'Adenocarcinoma', icd10: 'C80.1', snomed: '35917007' },
    { id: 2, name: 'Adenocarcinoma, well differentiated', icd10: 'C80.1', snomed: '1187437009' },
    { id: 3, name: 'Adenocarcinoma, moderately differentiated', icd10: 'C80.1', snomed: '1187438004' },
    { id: 4, name: 'Adenocarcinoma, poorly differentiated', icd10: 'C80.1', snomed: '1187439007' },
    { id: 5, name: 'Squamous cell carcinoma', icd10: 'C80.1', snomed: '28899001' },
    { id: 6, name: 'Squamous cell carcinoma in situ', icd10: 'D09.9', snomed: '59367005' },
    { id: 7, name: 'Chronic inflammation', icd10: 'K29.5', snomed: '84499006' },
    { id: 8, name: 'Acute inflammation', icd10: 'K29.0', snomed: '4532008' },
    { id: 9, name: 'Granulomatous inflammation', icd10: 'K29.6', snomed: '112631003' },
    { id: 10, name: 'Benign neoplasm', icd10: 'D36.9', snomed: '20376005' },
    { id: 11, name: 'Malignant neoplasm', icd10: 'C80.1', snomed: '363346000' },
    { id: 12, name: 'Hepatocellular carcinoma', icd10: 'C22.0', snomed: '25370001' },
    { id: 13, name: 'Cholangiocarcinoma', icd10: 'C22.1', snomed: '312104005' },
    { id: 14, name: 'Metastatic carcinoma', icd10: 'C79.9', snomed: '128462008' },
    { id: 15, name: 'Lymphoma', icd10: 'C85.9', snomed: '118600007' },
    { id: 16, name: 'No malignancy identified', icd10: 'Z03.1', snomed: '395100000' },
    { id: 17, name: 'Negative for malignancy', icd10: 'Z03.1', snomed: '395100000' },
    { id: 18, name: 'Atypical cells present', icd10: 'R85.614', snomed: '103647003' },
    { id: 19, name: 'Dysplasia, low grade', icd10: 'K31.A1', snomed: '1162766002' },
    { id: 20, name: 'Dysplasia, high grade', icd10: 'K31.A2', snomed: '1162767006' },
    { id: 21, name: 'Insufficient for diagnosis', icd10: 'R85.9', snomed: '125154007' },
    { id: 22, name: 'Defer to permanent sections', icd10: null, snomed: null },
    { id: 23, name: 'Invasive ductal carcinoma', icd10: 'C50.919', snomed: '408643008' },
    { id: 24, name: 'Invasive lobular carcinoma', icd10: 'C50.919', snomed: '89740008' },
  ]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]); // Now stores diagnosis objects
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);

  // Text field values for macro support
  const [grossExamFindings, setGrossExamFindings] = useState('');
  const [microscopyFindings, setMicroscopyFindings] = useState('');
  const [textConclusion, setTextConclusion] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const [reports, setReports] = useState([
    { id: 1, version: 1, generatedDate: '2024-08-14 09:15', generatedBy: 'Dr. Mboule', type: 'Draft' },
  ]);

  const [selectedReport, setSelectedReport] = useState(null);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
  const [newBlockTissueType, setNewBlockTissueType] = useState('');
  const [newBlockCount, setNewBlockCount] = useState(1);
  
  // Typeahead state for tissue type
  const [tissueTypeSearch, setTissueTypeSearch] = useState('');
  const [activeTissueTypeRow, setActiveTissueTypeRow] = useState(null);
  const [tissueTypeOptions, setTissueTypeOptions] = useState([
    'Liver - Central',
    'Liver - Peripheral',
    'Liver - Capsule',
    'Margin - Surgical',
    'Margin - Deep',
    'Tumor - Primary',
    'Tumor - Metastatic',
    'Lymph Node',
    'Skin - Epidermis',
    'Skin - Dermis',
    'Muscle',
    'Fat',
    'Bone',
    'Cartilage',
  ]);

  const sectionRefs = {
    caseInfo: useRef(null),
    grossing: useRef(null),
    blocks: useRef(null),
    slides: useRef(null),
    staining: useRef(null),
    review: useRef(null),
    findings: useRef(null),
    reports: useRef(null),
  };

  const scrollToSection = (sectionId) => {
    sectionRefs[sectionId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Section progress calculations
  const getSectionProgress = (sectionId) => {
    switch (sectionId) {
      case 'grossing':
        const grossingFields = [grossingData.status, grossingData.receivedDate, grossingData.condition, grossingData.grossDescription];
        const filledGrossing = grossingFields.filter(f => f && f.length > 0).length;
        return { filled: filledGrossing, total: 4, label: `${filledGrossing}/4 fields` };
      case 'blocks':
        return { filled: blocks.length, total: null, label: `${blocks.length} added` };
      case 'slides':
        return { filled: slides.length, total: null, label: `${slides.length} added` };
      case 'staining':
        return { filled: 0, total: 2, label: `0/2 fields` };
      case 'review':
        return { filled: 0, total: 3, label: 'locked' };
      case 'findings':
        return { filled: 0, total: 4, label: 'locked' };
      case 'reports':
        return { filled: reports.length, total: null, label: `${reports.length} report${reports.length !== 1 ? 's' : ''}` };
      default:
        return { filled: 0, total: 0, label: '' };
    }
  };

  const getSectionStatus = (sectionId) => {
    const progress = getSectionProgress(sectionId);
    if (sectionId === 'review' || sectionId === 'findings') {
      if (caseData.status !== 'READY_PATHOLOGIST' && caseData.status !== 'COMPLETED') {
        return 'locked';
      }
    }
    if (progress.total === null) {
      return progress.filled > 0 ? 'partial' : 'empty';
    }
    if (progress.filled === 0) return 'empty';
    if (progress.filled === progress.total) return 'complete';
    return 'partial';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#198038">
            <circle cx="10" cy="10" r="9" fill="#198038"/>
            <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
        );
      case 'partial':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="9" fill="none" stroke="#0f62fe" strokeWidth="2"/>
            <path d="M10 2 A8 8 0 0 1 18 10" fill="#0f62fe"/>
          </svg>
        );
      case 'locked':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#a8a8a8">
            <circle cx="10" cy="10" r="9" fill="none" stroke="#a8a8a8" strokeWidth="2"/>
            <rect x="7" y="9" width="6" height="5" rx="1"/>
            <path d="M8 9V7a2 2 0 014 0v2" fill="none" stroke="#a8a8a8" strokeWidth="1.5"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="9" fill="none" stroke="#c6c6c6" strokeWidth="2"/>
          </svg>
        );
    }
  };

  const canGenerateReport = () => {
    // Check if all required fields are filled for report generation
    return caseData.status === 'READY_PATHOLOGIST' || caseData.status === 'COMPLETED';
  };

  // Typeahead component for tissue type
  const TissueTypeahead = ({ value, onChange, rowId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState(value || '');
    const inputRef = useRef(null);
    
    const filteredOptions = tissueTypeOptions.filter(opt => 
      opt.toLowerCase().includes(searchText.toLowerCase())
    );
    
    const showAddNew = searchText.length > 0 && 
      !tissueTypeOptions.some(opt => opt.toLowerCase() === searchText.toLowerCase());
    
    const handleSelect = (option) => {
      setSearchText(option);
      onChange(option);
      setIsOpen(false);
    };
    
    const handleAddNew = () => {
      const newType = searchText.trim();
      if (newType && !tissueTypeOptions.includes(newType)) {
        setTissueTypeOptions(prev => [...prev, newType].sort());
        handleSelect(newType);
      }
    };
    
    return (
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search or add..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            borderBottom: isOpen ? '2px solid #0f62fe' : '1px solid #8d8d8d',
            background: '#f4f4f4',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
        {isOpen && (searchText.length > 0 || filteredOptions.length > 0) && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #e0e0e0',
            borderTop: 'none',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 100,
          }}>
            {filteredOptions.map((option, i) => (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: 'white',
                  borderBottom: '1px solid #f4f4f4',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e8f4fd'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                {option}
              </div>
            ))}
            {showAddNew && (
              <div
                onClick={handleAddNew}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: '#f0f7ff',
                  borderTop: '1px solid #e0e0e0',
                  fontSize: '14px',
                  color: '#0f62fe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f0f7ff'}
              >
                <span style={{ fontWeight: 600 }}>+</span>
                Add "{searchText}" as new tissue type
              </div>
            )}
            {filteredOptions.length === 0 && !showAddNew && (
              <div style={{
                padding: '10px 12px',
                color: '#525252',
                fontSize: '14px',
                fontStyle: 'italic',
              }}>
                Type to search...
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#f4f4f4',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #0f4c75 0%, #1a237e 100%)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '24px', cursor: 'pointer' }}>≡</div>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z"/>
            </svg>
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>
              Système d'Information Électronique de Laboratoire
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              Version: 3.2.0.2
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {['🔍', '🔔', '👤', '❓'].map((icon, i) => (
            <div key={i} style={{
              width: '36px',
              height: '36px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
            }}>
              {icon}
            </div>
          ))}
        </div>
      </div>

      {/* Page Header */}
      <div style={{ 
        background: 'white', 
        padding: '16px 24px',
        borderBottom: '1px solid #e0e0e0',
      }}>
        {/* Breadcrumb */}
        <div style={{ color: '#0f62fe', fontSize: '14px', marginBottom: '8px' }}>
          <span style={{ cursor: 'pointer' }}>Home</span>
          <span style={{ color: '#666', margin: '0 8px' }}>/</span>
          <span style={{ cursor: 'pointer' }}>Pathology</span>
          <span style={{ color: '#666', margin: '0 8px' }}>/</span>
          <span style={{ color: '#666' }}>{caseData.labNumber}</span>
        </div>
        
        {/* Title Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 400, 
              color: '#161616',
              margin: '0 0 8px 0',
            }}>
              Pathology Case - {caseData.labNumber}
            </h1>
            <div style={{ display: 'flex', gap: '24px', color: '#525252', fontSize: '14px' }}>
              <span><strong>Patient:</strong> {caseData.patientName}</span>
              <span><strong>DOB:</strong> {caseData.dob}</span>
              <span><strong>Gender:</strong> {caseData.gender}</span>
              <span style={{
                background: caseData.status === 'COMPLETED' ? '#d4edda' : '#fff3cd',
                padding: '2px 12px',
                borderRadius: '12px',
                fontWeight: 500,
              }}>
                {caseData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden',
      }}>
        {/* Sidebar Navigation */}
        <div style={{
          width: '240px',
          background: 'white',
          borderRight: '1px solid #e0e0e0',
          padding: '16px 0',
          position: 'sticky',
          top: 0,
          height: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }}>
          <div style={{ 
            padding: '0 16px 16px', 
            borderBottom: '1px solid #e0e0e0',
            marginBottom: '8px',
          }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: '#525252',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Case Progress
            </div>
          </div>

          {[
            { id: 'caseInfo', label: 'Case Information', noProgress: true },
            { id: 'grossing', label: 'Grossing' },
            { id: 'blocks', label: 'Blocks', pendingCount: pendingBlockRequests },
            { id: 'slides', label: 'Slides', pendingCount: pendingSlideRequests },
            { id: 'staining', label: 'Staining', pendingCount: pendingStainRequests },
            { id: 'review', label: 'Pathologist Review' },
            { id: 'findings', label: 'Findings & Conclusions' },
            { id: 'reports', label: 'Reports' },
          ].map((section) => {
            const status = getSectionStatus(section.id);
            const progress = getSectionProgress(section.id);
            const isLocked = status === 'locked';
            
            return (
              <div
                key={section.id}
                onClick={() => !isLocked && scrollToSection(section.id)}
                style={{
                  padding: '12px 16px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderLeft: expandedSections[section.id] ? '3px solid #0f62fe' : '3px solid transparent',
                  background: expandedSections[section.id] ? '#e8f4fd' : (section.pendingCount > 0 ? '#fff8e1' : 'transparent'),
                  opacity: isLocked ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isLocked) e.currentTarget.style.background = '#f4f4f4';
                }}
                onMouseLeave={(e) => {
                  if (!isLocked) e.currentTarget.style.background = expandedSections[section.id] ? '#e8f4fd' : (section.pendingCount > 0 ? '#fff8e1' : 'transparent');
                }}
              >
                {!section.noProgress && getStatusIcon(status)}
                {section.noProgress && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#525252">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#525252" strokeWidth="1.5"/>
                    <text x="10" y="14" textAnchor="middle" fontSize="10" fill="#525252">i</text>
                  </svg>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: isLocked ? '#a8a8a8' : '#161616', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {section.label}
                    {section.pendingCount > 0 && (
                      <span 
                        title={`${section.pendingCount} pending request(s) from pathologist`}
                        style={{
                          background: '#ff8f00',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        ⚠ {section.pendingCount}
                      </span>
                    )}
                  </div>
                  {!section.noProgress && (
                    <div style={{ fontSize: '12px', color: '#525252' }}>
                      {progress.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '24px',
          paddingBottom: '100px', // Space for sticky footer
        }}>
          {/* Case Information Section */}
          <div ref={sectionRefs.caseInfo} style={{ marginBottom: '24px' }}>
            <div style={{
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
            }}>
              <div 
                onClick={() => toggleSection('caseInfo')}
                style={{
                  padding: '16px 20px',
                  borderBottom: expandedSections.caseInfo ? '1px solid #e0e0e0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: '#f4f4f4',
                }}
              >
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Case Information</h2>
                <span style={{ fontSize: '20px', color: '#525252' }}>
                  {expandedSections.caseInfo ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedSections.caseInfo && (
                <div style={{ padding: '20px' }}>
                  {/* Row 1: Core identifiers */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '20px',
                    marginBottom: '20px',
                  }}>
                    {[
                      ['Lab Number', caseData.labNumber],
                      ['Request Date', caseData.requestDate],
                      ['Unit Number', caseData.unitNumber],
                      ['Private Reference Number', caseData.privateReferenceNumber],
                    ].map(([label, value], i) => (
                      <div key={i}>
                        <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>
                          {label}
                        </div>
                        <div style={{ fontSize: '14px', color: '#161616', fontWeight: i === 0 ? 600 : 400 }}>
                          {value || '—'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 2: Specimen info */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '20px',
                    marginBottom: '20px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid #e0e0e0',
                  }}>
                    {[
                      ['Specimen', caseData.specimen],
                      ['Specimen Type', caseData.specimenType],
                      ['Nature/Site of Specimen', caseData.natureSiteOfSpecimen],
                    ].map(([label, value], i) => (
                      <div key={i}>
                        <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>
                          {label}
                        </div>
                        <div style={{ fontSize: '14px', color: '#161616' }}>
                          {value || '—'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 3: Provider and procedure */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '20px',
                    marginBottom: '20px',
                  }}>
                    {[
                      ['Referring Provider', caseData.provider],
                      ['Procedure Performed', caseData.procedurePerformed],
                      ['Assigned Technician', caseData.assignedTechnician || 'Not assigned'],
                    ].map(([label, value], i) => (
                      <div key={i}>
                        <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>
                          {label}
                        </div>
                        <div style={{ fontSize: '14px', color: '#161616' }}>
                          {value || '—'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Full-width clinical fields */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>
                      Provisional Clinical Diagnosis
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#161616',
                      background: '#fff8e1',
                      padding: '12px',
                      borderRadius: '4px',
                      borderLeft: '3px solid #ff8f00',
                    }}>
                      {caseData.provisionalDiagnosis || '—'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>
                      Previous Surgery / Treatment
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#161616',
                      background: '#f4f4f4',
                      padding: '12px',
                      borderRadius: '4px',
                    }}>
                      {caseData.previousSurgeryTreatment || 'None reported'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>
                      Clinical History
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#161616',
                      background: '#f4f4f4',
                      padding: '12px',
                      borderRadius: '4px',
                    }}>
                      {caseData.clinicalHistory || '—'}
                    </div>
                  </div>

                  {/* Assignment row */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e0e0e0',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>
                        Assigned Pathologist
                      </div>
                      <div style={{ fontSize: '14px', color: caseData.assignedPathologist ? '#161616' : '#a8a8a8' }}>
                        {caseData.assignedPathologist || 'Not yet assigned'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>
                        Current Status
                      </div>
                      <span style={{
                        background: caseData.status === 'COMPLETED' ? '#d4edda' : '#fff3cd',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}>
                        {caseData.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grossing Section */}
          <div ref={sectionRefs.grossing} style={{ marginBottom: '24px' }}>
            <div style={{
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              borderLeft: '3px solid #0f62fe',
            }}>
              <div 
                onClick={() => toggleSection('grossing')}
                style={{
                  padding: '16px 20px',
                  borderBottom: expandedSections.grossing ? '1px solid #e0e0e0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Grossing</h2>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#525252',
                    background: '#e0e0e0',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    {getSectionProgress('grossing').label}
                  </span>
                </div>
                <span style={{ fontSize: '20px', color: '#525252' }}>
                  {expandedSections.grossing ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedSections.grossing && (
                <div style={{ padding: '20px' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    marginBottom: '20px',
                  }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: '#525252',
                        marginBottom: '8px',
                      }}>
                        Status <span style={{ color: '#da1e28' }}>*</span>
                      </label>
                      <select
                        value={grossingData.status}
                        onChange={(e) => setGrossingData({...grossingData, status: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: 'none',
                          borderBottom: '1px solid #8d8d8d',
                          background: '#f4f4f4',
                          fontSize: '14px',
                        }}
                      >
                        <option>Grossing</option>
                        <option>Processing</option>
                        <option>Cutting</option>
                        <option>Slicing</option>
                        <option>Staining</option>
                        <option>Ready for Pathologist</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: '#525252',
                        marginBottom: '8px',
                      }}>
                        Assigned Technician
                      </label>
                      <select
                        value={grossingData.technician}
                        onChange={(e) => setGrossingData({...grossingData, technician: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: 'none',
                          borderBottom: '1px solid #8d8d8d',
                          background: '#f4f4f4',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Select or leave for queue...</option>
                        <option>ELIS, Open</option>
                        <option>Tech, Lab</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: '#525252',
                        marginBottom: '8px',
                      }}>
                        Specimen Received Date <span style={{ color: '#da1e28' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={grossingData.receivedDate}
                        onChange={(e) => setGrossingData({...grossingData, receivedDate: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: 'none',
                          borderBottom: '1px solid #8d8d8d',
                          background: '#f4f4f4',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: '#525252',
                        marginBottom: '8px',
                      }}>
                        Specimen Condition
                      </label>
                      <select
                        value={grossingData.condition}
                        onChange={(e) => setGrossingData({...grossingData, condition: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: 'none',
                          borderBottom: '1px solid #8d8d8d',
                          background: '#f4f4f4',
                          fontSize: '14px',
                        }}
                      >
                        <option>Adequate</option>
                        <option>Compromised</option>
                        <option>Insufficient</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '12px', 
                      color: '#525252',
                      marginBottom: '8px',
                    }}>
                      Gross Description
                      <span style={{ fontWeight: 400, color: '#a8a8a8', fontSize: '11px', marginLeft: '8px' }}>
                        (supports macro codes)
                      </span>
                    </label>
                    <div style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        padding: '8px 12px',
                        background: '#f4f4f4',
                        borderBottom: '1px solid #e0e0e0',
                        display: 'flex',
                        gap: '8px',
                      }}>
                        {['B', 'I', 'U', '—', '•', '1.'].map((btn, i) => (
                          <button
                            key={i}
                            style={{
                              background: 'white',
                              border: '1px solid #e0e0e0',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontWeight: btn === 'B' ? 'bold' : 'normal',
                              fontStyle: btn === 'I' ? 'italic' : 'normal',
                              textDecoration: btn === 'U' ? 'underline' : 'none',
                            }}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={grossingData.grossDescription}
                        onChange={(e) => setGrossingData({...grossingData, grossDescription: e.target.value})}
                        placeholder="Enter gross description... (type macro code + Tab to expand)"
                        onKeyDown={(e) => {
                          if (e.key === 'Tab' || e.key === ' ') {
                            const words = grossingData.grossDescription.split(/\s/);
                            const lastWord = words[words.length - 1];
                            const macro = textMacros.find(m => 
                              m.shortCode === lastWord && 
                              m.isEnabled && 
                              (m.fieldType === 'GROSS' || m.fieldType === 'ALL')
                            );
                            if (macro) {
                              e.preventDefault();
                              const newText = grossingData.grossDescription.substring(0, grossingData.grossDescription.lastIndexOf(lastWord)) + macro.text;
                              setGrossingData({...grossingData, grossDescription: newText});
                            }
                          }
                        }}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: 'none',
                          fontSize: '14px',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    
                    {/* Quick-Insert Macro Bar for Gross Description */}
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px 12px', 
                      background: '#f9f9f9', 
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#525252', marginRight: '4px' }}>Quick insert:</span>
                        {textMacros
                          .filter(m => m.isEnabled && (m.fieldType === 'GROSS' || m.fieldType === 'ALL'))
                          .slice(0, 5)
                          .map(macro => (
                            <button
                              key={macro.id}
                              onClick={() => setGrossingData({...grossingData, grossDescription: grossingData.grossDescription + (grossingData.grossDescription ? ' ' : '') + macro.text})}
                              title={macro.text.substring(0, 100) + '...'}
                              style={{
                                background: 'white',
                                border: '1px solid #0f62fe',
                                color: '#0f62fe',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                              }}
                            >
                              {macro.shortCode}
                            </button>
                          ))
                        }
                        <button
                          onClick={() => setShowMacroDropdown(showMacroDropdown === 'grossingDesc' ? null : 'grossingDesc')}
                          style={{
                            background: 'transparent',
                            border: '1px solid #a8a8a8',
                            color: '#525252',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {showMacroDropdown === 'grossingDesc' ? 'Hide all ▲' : 'Show all ▼'}
                        </button>
                        <button
                          onClick={() => setShowManageMacrosModal(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#525252',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                          }}
                        >
                          ⚙️ Manage
                        </button>
                      </div>
                      
                      {/* Expanded Macro List */}
                      {showMacroDropdown === 'grossingDesc' && (
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid #e0e0e0',
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}>
                          <input
                            type="text"
                            placeholder="Search macros..."
                            value={macroSearchTerm}
                            onChange={(e) => setMacroSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', marginBottom: '8px' }}
                          />
                          {textMacros
                            .filter(m => {
                              const matchesField = m.fieldType === 'GROSS' || m.fieldType === 'ALL';
                              const matchesSearch = !macroSearchTerm || 
                                                    m.shortCode.toLowerCase().includes(macroSearchTerm.toLowerCase()) ||
                                                    m.text.toLowerCase().includes(macroSearchTerm.toLowerCase());
                              return matchesField && matchesSearch && m.isEnabled;
                            })
                            .map(macro => (
                              <div
                                key={macro.id}
                                onClick={() => {
                                  setGrossingData({...grossingData, grossDescription: grossingData.grossDescription + (grossingData.grossDescription ? ' ' : '') + macro.text});
                                  setShowMacroDropdown(null);
                                  setMacroSearchTerm('');
                                }}
                                style={{ 
                                  padding: '8px 10px', 
                                  cursor: 'pointer', 
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  background: 'white',
                                  border: '1px solid #e0e0e0',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e8f4fd'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 600, color: '#0f62fe', fontSize: '13px', fontFamily: 'monospace' }}>{macro.shortCode}</span>
                                  <span style={{ fontSize: '11px', color: '#a8a8a8' }}>{macro.ownerName}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#525252', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {macro.text.substring(0, 80)}...
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Blocks Section */}
          <div ref={sectionRefs.blocks} style={{ marginBottom: '24px' }}>
            <div style={{
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              borderLeft: '3px solid #0f62fe',
            }}>
              <div 
                onClick={() => toggleSection('blocks')}
                style={{
                  padding: '16px 20px',
                  borderBottom: expandedSections.blocks ? '1px solid #e0e0e0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Blocks</h2>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#525252',
                    background: '#e0e0e0',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    {blocks.length} added
                  </span>
                </div>
                <span style={{ fontSize: '20px', color: '#525252' }}>
                  {expandedSections.blocks ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedSections.blocks && (
                <div style={{ padding: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '16px',
                  }}>
                    <button
                      onClick={() => setShowAddBlockModal(true)}
                      style={{
                        background: '#0f62fe',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>+</span> Add Block(s)
                    </button>
                    <button
                      onClick={() => setShowPrintBlockLabelsModal(true)}
                      style={{
                        background: 'transparent',
                        color: '#0f62fe',
                        border: '1px solid #0f62fe',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      🖨 Print Labels
                    </button>
                    <button
                      onClick={() => {
                        setRequestModalContext({ type: 'BLOCK', target: null });
                        setShowAddRequestModal(true);
                      }}
                      title="Request additional block from pathologist"
                      style={{
                        background: 'transparent',
                        color: '#ff8f00',
                        border: '1px solid #ff8f00',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginLeft: 'auto',
                      }}
                    >
                      📋 Request Additional
                    </button>
                  </div>

                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                  }}>
                    <thead>
                      <tr style={{ background: '#e0e0e0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', width: '40px' }}>
                          <input type="checkbox" />
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Block ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Barcode</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Location</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tissue Type</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Created</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map((block, i) => (
                        <tr key={block.id} style={{ 
                          background: i % 2 === 0 ? 'white' : '#f9f9f9',
                          borderBottom: '1px solid #e0e0e0',
                        }}>
                          <td style={{ padding: '12px 16px' }}>
                            <input type="checkbox" />
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{block.id}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#525252' }}>{block.barcode}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <input
                              type="text"
                              value={block.location}
                              onChange={(e) => {
                                const updated = [...blocks];
                                updated[i].location = e.target.value;
                                setBlocks(updated);
                              }}
                              style={{
                                border: 'none',
                                borderBottom: '1px solid transparent',
                                background: 'transparent',
                                padding: '4px 0',
                                width: '100%',
                              }}
                              onFocus={(e) => e.target.style.borderBottom = '1px solid #0f62fe'}
                              onBlur={(e) => e.target.style.borderBottom = '1px solid transparent'}
                            />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <TissueTypeahead
                              value={block.tissueType}
                              onChange={(newValue) => {
                                const updated = [...blocks];
                                updated[i].tissueType = newValue;
                                setBlocks(updated);
                              }}
                              rowId={block.id}
                            />
                          </td>
                          <td style={{ padding: '12px 16px', color: '#525252' }}>{block.createdDate}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button 
                              onClick={() => setShowPrintBlockLabelsModal(true)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                marginRight: '8px',
                              }} title="Print Label">
                              🖨
                            </button>
                            <button style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              color: '#da1e28',
                            }} title="Remove">
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Slides Section */}
          <div ref={sectionRefs.slides} style={{ marginBottom: '24px' }}>
            <div style={{
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              borderLeft: '3px solid #0f62fe',
            }}>
              <div 
                onClick={() => toggleSection('slides')}
                style={{
                  padding: '16px 20px',
                  borderBottom: expandedSections.slides ? '1px solid #e0e0e0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Slides</h2>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#525252',
                    background: '#e0e0e0',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    {slides.length} added
                  </span>
                </div>
                <span style={{ fontSize: '20px', color: '#525252' }}>
                  {expandedSections.slides ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedSections.slides && (
                <div style={{ padding: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '16px',
                  }}>
                    <button
                      onClick={() => setShowAddSlideModal(true)}
                      style={{
                        background: '#0f62fe',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>+</span> Add Slide(s)
                    </button>
                    <button
                      onClick={() => setShowUploadScansModal(true)}
                      style={{
                        background: 'transparent',
                        color: '#0f62fe',
                        border: '1px solid #0f62fe',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      📤 Upload Scanned Slides
                    </button>
                    <button
                      onClick={() => setShowPrintSlideLabelsModal(true)}
                      style={{
                        background: 'transparent',
                        color: '#0f62fe',
                        border: '1px solid #0f62fe',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      🖨 Print Labels
                    </button>
                    <button
                      onClick={() => {
                        setRequestModalContext({ type: 'SLIDE', target: null });
                        setShowAddRequestModal(true);
                      }}
                      title="Request additional slide from pathologist"
                      style={{
                        background: 'transparent',
                        color: '#ff8f00',
                        border: '1px solid #ff8f00',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginLeft: 'auto',
                      }}
                    >
                      📋 Request Additional
                    </button>
                  </div>

                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                  }}>
                    <thead>
                      <tr style={{ background: '#e0e0e0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', width: '40px' }}>
                          <input type="checkbox" />
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Slide ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Barcode</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Source Block</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Location</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Stain Type</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Scan</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slides.map((slide, i) => (
                        <tr key={slide.id} style={{ 
                          background: i % 2 === 0 ? 'white' : '#f9f9f9',
                          borderBottom: '1px solid #e0e0e0',
                        }}>
                          <td style={{ padding: '12px 16px' }}>
                            <input type="checkbox" />
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{slide.id}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#525252' }}>{slide.barcode}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              background: '#e8f4fd',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}>
                              {slide.sourceBlock || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>{slide.location}</td>
                          <td style={{ padding: '12px 16px' }}>{slide.stainType || <em style={{ color: '#999' }}>(none)</em>}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {slide.scans && slide.scans.length > 0 ? (
                              <button 
                                onClick={() => {
                                  setSelectedSlideForView(slide);
                                  // If multiple scans and not set to always open most recent, show disambiguation
                                  if (slide.scans.length > 1 && !alwaysOpenMostRecent) {
                                    setSelectedScan(slide.scans[0]); // Pre-select most recent
                                    setShowSelectScanModal(true);
                                  } else {
                                    // Single scan or preference set - open viewer directly
                                    setSelectedScan(slide.scans[0]);
                                    setShowViewSlideModal(true);
                                  }
                                }}
                                style={{
                                  background: '#d4edda',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  position: 'relative',
                                }}>
                                🔬 View
                                {slide.scans.length > 1 && (
                                  <span style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
                                    background: '#0f62fe',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                  }}>
                                    {slide.scans.length}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <button 
                                onClick={() => setShowUploadScansModal(true)}
                                style={{
                                  background: '#f4f4f4',
                                  border: '1px dashed #8d8d8d',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  color: '#525252',
                                }}>
                                Upload
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button 
                              onClick={() => setShowPrintSlideLabelsModal(true)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                marginRight: '8px',
                              }} title="Print Label">
                              🖨
                            </button>
                            <button style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              color: '#da1e28',
                            }} title="Remove">
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Staining Section */}
          <div ref={sectionRefs.staining} style={{ marginBottom: '24px' }}>
            <div style={{
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              borderLeft: '3px solid #0f62fe',
            }}>
              <div 
                onClick={() => toggleSection('staining')}
                style={{
                  padding: '16px 20px',
                  borderBottom: expandedSections.staining ? '1px solid #e0e0e0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Staining</h2>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#525252',
                    background: '#e0e0e0',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    {slides.filter(s => s.stainStatus === 'Complete').length}/{slides.length} complete
                  </span>
                </div>
                <span style={{ fontSize: '20px', color: '#525252' }}>
                  {expandedSections.staining ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedSections.staining && (
                <div style={{ padding: '20px' }}>
                  {/* Action buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                  }}>
                    <button
                      onClick={() => setShowBulkStainModal(true)}
                      style={{
                        background: '#0f62fe',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>🎨</span> Apply Stain to Selected
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSlidesForStain(slides.map(s => s.id));
                      }}
                      style={{
                        background: 'transparent',
                        color: '#0f62fe',
                        border: '1px solid #0f62fe',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Select All Slides
                    </button>
                    <button
                      onClick={() => {
                        setRequestModalContext({ type: null, target: null });
                        setShowAddRequestModal(true);
                      }}
                      style={{
                        background: 'transparent',
                        color: '#198038',
                        border: '1px solid #198038',
                        padding: '10px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>+</span> Request Additional
                    </button>
                  </div>

                  {/* Staining status summary cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    marginBottom: '20px',
                  }}>
                    {[
                      { status: 'Complete', count: slides.filter(s => s.stainStatus === 'Complete').length, color: '#198038', bg: '#d4edda' },
                      { status: 'In Progress', count: slides.filter(s => s.stainStatus === 'In Progress').length, color: '#0f62fe', bg: '#e8f4fd' },
                      { status: 'Pending', count: slides.filter(s => s.stainStatus === 'Pending').length, color: '#f1c21b', bg: '#fff8e1' },
                      { status: 'Not Assigned', count: slides.filter(s => s.stainStatus === 'Not Assigned').length, color: '#a8a8a8', bg: '#f4f4f4' },
                    ].map((item) => (
                      <div key={item.status} style={{
                        background: item.bg,
                        padding: '12px 16px',
                        borderRadius: '4px',
                        borderLeft: `3px solid ${item.color}`,
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: item.color }}>
                          {item.count}
                        </div>
                        <div style={{ fontSize: '12px', color: '#525252' }}>
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Slides staining table */}
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                    Slide Staining Status
                  </h3>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    marginBottom: '24px',
                  }}>
                    <thead>
                      <tr style={{ background: '#e0e0e0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', width: '40px' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedSlidesForStain.length === slides.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSlidesForStain(slides.map(s => s.id));
                              } else {
                                setSelectedSlidesForStain([]);
                              }
                            }}
                          />
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Slide</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Block</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Stain Type</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Stained Date</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slides.map((slide, i) => (
                        <tr key={slide.id} style={{ 
                          background: selectedSlidesForStain.includes(slide.id) ? '#e8f4fd' : (i % 2 === 0 ? 'white' : '#f9f9f9'),
                          borderBottom: '1px solid #e0e0e0',
                        }}>
                          <td style={{ padding: '12px 16px' }}>
                            <input 
                              type="checkbox"
                              checked={selectedSlidesForStain.includes(slide.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSlidesForStain([...selectedSlidesForStain, slide.id]);
                                } else {
                                  setSelectedSlidesForStain(selectedSlidesForStain.filter(id => id !== slide.id));
                                }
                              }}
                            />
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>Slide {slide.id}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              background: '#e8f4fd',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}>
                              {slide.sourceBlock || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {slide.stainType ? (
                              <span style={{
                                background: '#f0e6ff',
                                color: '#7b1fa2',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 500,
                              }}>
                                {slide.stainType}
                              </span>
                            ) : (
                              <span style={{ color: '#a8a8a8', fontStyle: 'italic' }}>Not assigned</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              background: slide.stainStatus === 'Complete' ? '#d4edda' :
                                         slide.stainStatus === 'In Progress' ? '#e8f4fd' :
                                         slide.stainStatus === 'Pending' ? '#fff3cd' : '#f4f4f4',
                              color: slide.stainStatus === 'Complete' ? '#198038' :
                                     slide.stainStatus === 'In Progress' ? '#0f62fe' :
                                     slide.stainStatus === 'Pending' ? '#856404' : '#525252',
                            }}>
                              {slide.stainStatus}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#525252' }}>
                            {slide.stainedDate || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                // Mark as complete
                                const updated = [...slides];
                                updated[i].stainStatus = 'Complete';
                                updated[i].stainedDate = new Date().toISOString().split('T')[0];
                                setSlides(updated);
                              }}
                              disabled={slide.stainStatus === 'Complete' || !slide.stainType}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: slide.stainStatus === 'Complete' || !slide.stainType ? 'not-allowed' : 'pointer',
                                padding: '4px 8px',
                                opacity: slide.stainStatus === 'Complete' || !slide.stainType ? 0.3 : 1,
                              }}
                              title="Mark Complete"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => {
                                setRequestModalContext({ type: 'STAIN', target: slide.id });
                                setShowAddRequestModal(true);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 8px',
                              }}
                              title="Request Additional (opens with this slide selected)"
                            >
                              ➕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pathologist Requests section */}
                  {pathologistRequests.length > 0 && (
                    <>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Pathologist Requests
                        {totalPendingRequests > 0 && (
                          <span style={{
                            background: '#ff8f00',
                            color: 'white',
                            padding: '2px 10px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}>
                            ⚠ {totalPendingRequests} pending
                          </span>
                        )}
                      </h3>
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        fontSize: '14px',
                        marginBottom: '20px',
                      }}>
                        <thead>
                          <tr style={{ background: '#fff8e1' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>By</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Target</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Details</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Notes</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Priority</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pathologistRequests.map((request, i) => (
                            <tr key={request.id} style={{ 
                              background: request.status === 'Pending' ? '#fff8e1' : (i % 2 === 0 ? 'white' : '#f9f9f9'),
                              borderBottom: '1px solid #e0e0e0',
                            }}>
                              <td style={{ padding: '12px 16px', fontSize: '13px' }}>{request.requestDate}</td>
                              <td style={{ padding: '12px 16px', fontSize: '13px' }}>{request.requestedBy}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  background: request.requestType === 'BLOCK' ? '#e3f2fd' : 
                                             request.requestType === 'SLIDE' ? '#e8f5e9' : '#f0e6ff',
                                  color: request.requestType === 'BLOCK' ? '#1565c0' : 
                                         request.requestType === 'SLIDE' ? '#2e7d32' : '#7b1fa2',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                }}>
                                  {request.requestType}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                {request.targetId ? (
                                  <span style={{
                                    background: '#f4f4f4',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                  }}>
                                    {request.targetType} {request.targetId}
                                  </span>
                                ) : (
                                  <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                {request.stainType ? (
                                  <span style={{
                                    background: '#f0e6ff',
                                    color: '#7b1fa2',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                  }}>
                                    {request.stainType}
                                  </span>
                                ) : (
                                  <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px', maxWidth: '200px', fontSize: '13px', color: '#525252', fontStyle: 'italic' }}>
                                {request.notes || '—'}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: request.priority === 'STAT' ? '#ffebee' :
                                             request.priority === 'URGENT' ? '#fff3e0' : '#f5f5f5',
                                  color: request.priority === 'STAT' ? '#c62828' :
                                         request.priority === 'URGENT' ? '#e65100' : '#757575',
                                }}>
                                  {request.priority}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  background: request.status === 'Complete' ? '#d4edda' :
                                             request.status === 'In Progress' ? '#e8f4fd' : '#fff3cd',
                                  color: request.status === 'Complete' ? '#198038' :
                                         request.status === 'In Progress' ? '#0f62fe' : '#856404',
                                }}>
                                  {request.status === 'Pending' && '⚠ '}{request.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  {request.status === 'Pending' && (
                                    <button
                                      onClick={() => {
                                        const updated = [...pathologistRequests];
                                        updated[i].status = 'In Progress';
                                        setPathologistRequests(updated);
                                      }}
                                      style={{
                                        background: '#0f62fe',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                      }}
                                      title="Start Working"
                                    >
                                      Start
                                    </button>
                                  )}
                                  {request.status === 'In Progress' && (
                                    <button
                                      onClick={() => {
                                        const updated = [...pathologistRequests];
                                        updated[i].status = 'Complete';
                                        setPathologistRequests(updated);
                                      }}
                                      style={{
                                        background: '#198038',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Complete
                                    </button>
                                  )}
                                  {request.status === 'Complete' && (
                                    <button
                                      onClick={() => {
                                        const updated = [...pathologistRequests];
                                        updated[i].status = 'Pending';
                                        setPathologistRequests(updated);
                                      }}
                                      style={{
                                        background: 'transparent',
                                        color: '#da1e28',
                                        border: '1px solid #da1e28',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                      }}
                                      title="Revert to Pending"
                                    >
                                      Revert
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pathologist Review Section - Locked until Ready for Review */}
          <div ref={sectionRefs.review} style={{ marginBottom: '24px' }}>
            <div style={{
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              opacity: caseReadyForReview ? 1 : 0.6,
            }}>
              <div style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: caseReadyForReview ? '#161616' : '#a8a8a8' }}>
                    Pathologist Review
                  </h2>
                  {!caseReadyForReview && (
                    <span style={{
                      background: '#e0e0e0',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#525252',
                    }}>
                      🔒 Locked
                    </span>
                  )}
                  {caseReadyForReview && (
                    <span style={{
                      background: '#d4edda',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#198038',
                    }}>
                      ✓ Ready for Review
                    </span>
                  )}
                </div>
                {caseReadyForReview && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, review: !prev.review }))}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }}
                  >
                    {expandedSections.review ? '▼' : '▶'}
                  </button>
                )}
              </div>
              
              {!caseReadyForReview && (
                <div style={{ 
                  padding: '20px',
                  background: '#f9f9f9',
                  borderTop: '1px solid #e0e0e0',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    color: '#525252',
                  }}>
                    <span style={{ fontSize: '20px' }}>ℹ️</span>
                    <div>
                      <p style={{ margin: '0 0 8px', fontWeight: 500 }}>
                        This section will be available after clicking "Ready for Pathologist Review" in the footer.
                      </p>
                      <p style={{ margin: 0, fontSize: '13px' }}>
                        Current status: <strong>{caseData.status}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {caseReadyForReview && expandedSections.review && (
                <div style={{ padding: '20px', borderTop: '1px solid #e0e0e0' }}>
                  {/* Assigned Pathologist */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                      Assigned Pathologist
                    </label>
                    <select style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}>
                      <option value="">Select pathologist...</option>
                      <option value="dr-mboule">Dr. Mboule</option>
                      <option value="dr-smith">Dr. Smith</option>
                      <option value="dr-chen">Dr. Chen</option>
                    </select>
                  </div>

                  {/* Review Started */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                      Review Started Date
                    </label>
                    <input 
                      type="date" 
                      defaultValue={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '200px',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  {/* Technique Used - Dictionary backed with Short Codes */}
                  <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                      Technique(s) Used
                      <span style={{ fontWeight: 400, color: '#525252', fontSize: '12px', marginLeft: '8px' }}>
                        (search by code or name)
                      </span>
                    </label>
                    
                    {/* Selected techniques as tags */}
                    <div 
                      onClick={() => setShowTechniqueDropdown(true)}
                      style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '6px',
                        padding: '8px 12px',
                        minHeight: '44px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        cursor: 'text',
                        background: 'white',
                      }}
                    >
                      {selectedTechniques.map(tech => (
                        <span 
                          key={tech.shortCode}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#e8f4fd',
                            color: '#0f62fe',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                          title={tech.fullName}
                        >
                          <strong style={{ marginRight: '2px' }}>{tech.shortCode}</strong>
                          {tech.fullName.length > 20 ? tech.fullName.substring(0, 20) + '...' : tech.fullName}
                          {tech.oneTimeOnly && <span style={{ color: '#ff8f00', marginLeft: '4px' }} title="Not saved to dictionary">*</span>}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTechniques(prev => prev.filter(t => t.shortCode !== tech.shortCode));
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0 2px',
                              fontSize: '14px',
                              color: '#0f62fe',
                            }}
                          >×</button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder={selectedTechniques.length === 0 ? "Type code (e.g., HE) or name..." : ""}
                        value={techniqueSearch}
                        onChange={(e) => setTechniqueSearch(e.target.value)}
                        onFocus={() => setShowTechniqueDropdown(true)}
                        style={{
                          border: 'none',
                          outline: 'none',
                          flex: 1,
                          minWidth: '150px',
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    {/* Dropdown */}
                    {showTechniqueDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxHeight: '280px',
                        overflowY: 'auto',
                        zIndex: 100,
                      }}>
                        {availableTechniques
                          .filter(t => 
                            (t.shortCode.toLowerCase().includes(techniqueSearch.toLowerCase()) ||
                             t.fullName.toLowerCase().includes(techniqueSearch.toLowerCase())) &&
                            !selectedTechniques.some(st => st.shortCode === t.shortCode)
                          )
                          .map(tech => (
                            <div
                              key={tech.shortCode}
                              onClick={() => {
                                setSelectedTechniques(prev => [...prev, tech]);
                                setTechniqueSearch('');
                              }}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                borderBottom: '1px solid #f4f4f4',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f4f4f4'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <span style={{ 
                                fontWeight: 600, 
                                color: '#0f62fe',
                                minWidth: '45px',
                              }}>{tech.shortCode}</span>
                              <span style={{ color: '#525252' }}>{tech.fullName}</span>
                            </div>
                          ))
                        }
                        
                        {/* Add new option */}
                        {techniqueSearch && !availableTechniques.some(t => 
                          t.shortCode.toLowerCase() === techniqueSearch.toLowerCase() ||
                          t.fullName.toLowerCase() === techniqueSearch.toLowerCase()
                        ) && (
                          <>
                            <div style={{ borderTop: '1px solid #e0e0e0', margin: '4px 0' }} />
                            <div
                              onClick={() => {
                                setNewTechniqueFullName(techniqueSearch.trim());
                                setNewTechniqueShortCode('');
                                setNewTechniqueDoNotSave(false);
                                setShowAddTechniqueModal(true);
                                setShowTechniqueDropdown(false);
                              }}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#198038',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#d4edda'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <span>+</span> Add "{techniqueSearch}" as new technique...
                            </div>
                          </>
                        )}

                        {/* Close button */}
                        <div
                          onClick={() => setShowTechniqueDropdown(false)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#525252',
                            textAlign: 'center',
                            borderTop: '1px solid #e0e0e0',
                            background: '#f9f9f9',
                          }}
                        >
                          Close
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pathologist Notes - with Quick-Insert Macros */}
                  <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                      Review Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Enter any notes from the review process... (or type macro code + Tab to expand)"
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' || e.key === ' ') {
                          const words = reviewNotes.split(/\s/);
                          const lastWord = words[words.length - 1];
                          const macro = textMacros.find(m => 
                            m.shortCode === lastWord && 
                            m.isEnabled
                          );
                          if (macro) {
                            e.preventDefault();
                            const newText = reviewNotes.substring(0, reviewNotes.lastIndexOf(lastWord)) + macro.text;
                            setReviewNotes(newText);
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                    
                    {/* Quick-Insert Macro Bar */}
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px 12px', 
                      background: '#f9f9f9', 
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#525252', marginRight: '4px' }}>Quick insert:</span>
                        {textMacros
                          .filter(m => m.isEnabled)
                          .slice(0, 5)
                          .map(macro => (
                            <button
                              key={macro.id}
                              onClick={() => setReviewNotes(prev => prev + (prev ? ' ' : '') + macro.text)}
                              title={macro.text.substring(0, 100) + '...'}
                              style={{
                                background: 'white',
                                border: '1px solid #0f62fe',
                                color: '#0f62fe',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                              }}
                            >
                              {macro.shortCode}
                            </button>
                          ))
                        }
                        <button
                          onClick={() => setShowMacroDropdown(showMacroDropdown === 'reviewNotes' ? null : 'reviewNotes')}
                          style={{
                            background: 'transparent',
                            border: '1px solid #a8a8a8',
                            color: '#525252',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {showMacroDropdown === 'reviewNotes' ? 'Hide all ▲' : 'Show all ▼'}
                        </button>
                        <button
                          onClick={() => setShowManageMacrosModal(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#525252',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                          }}
                        >
                          ⚙️ Manage
                        </button>
                      </div>
                      
                      {/* Expanded Macro List */}
                      {showMacroDropdown === 'reviewNotes' && (
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid #e0e0e0',
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}>
                          <input
                            type="text"
                            placeholder="Search macros..."
                            value={macroSearchTerm}
                            onChange={(e) => setMacroSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', marginBottom: '8px' }}
                          />
                          {textMacros
                            .filter(m => {
                              const matchesSearch = !macroSearchTerm || 
                                                    m.shortCode.toLowerCase().includes(macroSearchTerm.toLowerCase()) ||
                                                    m.text.toLowerCase().includes(macroSearchTerm.toLowerCase());
                              return matchesSearch && m.isEnabled;
                            })
                            .map(macro => (
                              <div
                                key={macro.id}
                                onClick={() => {
                                  setReviewNotes(prev => prev + (prev ? ' ' : '') + macro.text);
                                  setShowMacroDropdown(null);
                                  setMacroSearchTerm('');
                                }}
                                style={{ 
                                  padding: '8px 10px', 
                                  cursor: 'pointer', 
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  background: 'white',
                                  border: '1px solid #e0e0e0',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e8f4fd'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 600, color: '#0f62fe', fontSize: '13px', fontFamily: 'monospace' }}>{macro.shortCode}</span>
                                  <span style={{ fontSize: '11px', color: '#a8a8a8' }}>{macro.ownerName}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#525252', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {macro.text.substring(0, 80)}...
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Request Additional button for pathologist */}
                  <div style={{ 
                    padding: '16px', 
                    background: '#f4f4f4', 
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '14px', color: '#525252' }}>
                      Need additional blocks, slides, or stains?
                    </span>
                    <button
                      onClick={() => {
                        setRequestModalContext({ type: null, target: null });
                        setShowAddRequestModal(true);
                      }}
                      style={{
                        background: '#0f62fe',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      + Request Additional
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Findings Section - Locked until Ready for Review */}
          <div ref={sectionRefs.findings} style={{ marginBottom: '24px' }}>
            <div style={{
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              opacity: caseReadyForReview ? 1 : 0.6,
            }}>
              <div style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: caseReadyForReview ? '#161616' : '#a8a8a8' }}>
                    Findings & Conclusions
                  </h2>
                  {!caseReadyForReview && (
                    <span style={{
                      background: '#e0e0e0',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#525252',
                    }}>
                      🔒 Locked
                    </span>
                  )}
                </div>
                {caseReadyForReview && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, findings: !prev.findings }))}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }}
                  >
                    {expandedSections.findings ? '▼' : '▶'}
                  </button>
                )}
              </div>
              
              {!caseReadyForReview && (
                <div style={{ 
                  padding: '20px',
                  background: '#f9f9f9',
                  borderTop: '1px solid #e0e0e0',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    color: '#525252',
                  }}>
                    <span style={{ fontSize: '20px' }}>ℹ️</span>
                    <div>
                      <p style={{ margin: '0 0 8px', fontWeight: 500 }}>
                        This section will be available after clicking "Ready for Pathologist Review" in the footer.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {caseReadyForReview && expandedSections.findings && (
                <div style={{ padding: '20px', borderTop: '1px solid #e0e0e0' }}>
                  
                  {/* Gross Exam Findings - with Quick-Insert Macros */}
                  <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                      Gross Exam Findings <span style={{ color: '#da1e28' }}>*</span>
                    </label>
                    <textarea
                      value={grossExamFindings}
                      onChange={(e) => setGrossExamFindings(e.target.value)}
                      placeholder="Enter gross examination findings... (or type macro code + Tab to expand)"
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' || e.key === ' ') {
                          const words = grossExamFindings.split(/\s/);
                          const lastWord = words[words.length - 1];
                          const macro = textMacros.find(m => 
                            m.shortCode === lastWord && 
                            m.isEnabled && 
                            (m.fieldType === 'GROSS' || m.fieldType === 'ALL')
                          );
                          if (macro) {
                            e.preventDefault();
                            const newText = grossExamFindings.substring(0, grossExamFindings.lastIndexOf(lastWord)) + macro.text;
                            setGrossExamFindings(newText);
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                    
                    {/* Quick-Insert Macro Bar */}
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px 12px', 
                      background: '#f9f9f9', 
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#525252', marginRight: '4px' }}>Quick insert:</span>
                        {textMacros
                          .filter(m => m.isEnabled && (m.fieldType === 'GROSS' || m.fieldType === 'ALL'))
                          .slice(0, 5)
                          .map(macro => (
                            <button
                              key={macro.id}
                              onClick={() => setGrossExamFindings(prev => prev + (prev ? ' ' : '') + macro.text)}
                              title={macro.text.substring(0, 100) + '...'}
                              style={{
                                background: 'white',
                                border: '1px solid #0f62fe',
                                color: '#0f62fe',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                              }}
                            >
                              {macro.shortCode}
                            </button>
                          ))
                        }
                        <button
                          onClick={() => setShowMacroDropdown(showMacroDropdown === 'gross' ? null : 'gross')}
                          style={{
                            background: 'transparent',
                            border: '1px solid #a8a8a8',
                            color: '#525252',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {showMacroDropdown === 'gross' ? 'Hide all ▲' : 'Show all ▼'}
                        </button>
                        <button
                          onClick={() => setShowManageMacrosModal(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#525252',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                          }}
                        >
                          ⚙️ Manage
                        </button>
                      </div>
                      
                      {/* Expanded Macro List */}
                      {showMacroDropdown === 'gross' && (
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid #e0e0e0',
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}>
                          <input
                            type="text"
                            placeholder="Search macros..."
                            value={macroSearchTerm}
                            onChange={(e) => setMacroSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', marginBottom: '8px' }}
                          />
                          {textMacros
                            .filter(m => {
                              const matchesField = m.fieldType === 'GROSS' || m.fieldType === 'ALL';
                              const matchesSearch = !macroSearchTerm || 
                                                    m.shortCode.toLowerCase().includes(macroSearchTerm.toLowerCase()) ||
                                                    m.text.toLowerCase().includes(macroSearchTerm.toLowerCase());
                              return matchesField && matchesSearch && m.isEnabled;
                            })
                            .map(macro => (
                              <div
                                key={macro.id}
                                onClick={() => {
                                  setGrossExamFindings(prev => prev + (prev ? ' ' : '') + macro.text);
                                  setShowMacroDropdown(null);
                                  setMacroSearchTerm('');
                                }}
                                style={{ 
                                  padding: '8px 10px', 
                                  cursor: 'pointer', 
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  background: 'white',
                                  border: '1px solid #e0e0e0',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e8f4fd'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 600, color: '#0f62fe', fontSize: '13px', fontFamily: 'monospace' }}>{macro.shortCode}</span>
                                  <span style={{ fontSize: '11px', color: '#a8a8a8' }}>{macro.ownerName}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#525252', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {macro.text.substring(0, 80)}...
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Microscopic Description - with Quick-Insert Macros */}
                  <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                      Microscopic Description <span style={{ color: '#da1e28' }}>*</span>
                    </label>
                    <textarea
                      value={microscopyFindings}
                      onChange={(e) => setMicroscopyFindings(e.target.value)}
                      placeholder="Enter microscopic findings... (or type macro code + Tab to expand)"
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' || e.key === ' ') {
                          const words = microscopyFindings.split(/\s/);
                          const lastWord = words[words.length - 1];
                          const macro = textMacros.find(m => 
                            m.shortCode === lastWord && 
                            m.isEnabled && 
                            (m.fieldType === 'MICROSCOPY' || m.fieldType === 'ALL')
                          );
                          if (macro) {
                            e.preventDefault();
                            const newText = microscopyFindings.substring(0, microscopyFindings.lastIndexOf(lastWord)) + macro.text;
                            setMicroscopyFindings(newText);
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                    
                    {/* Quick-Insert Macro Bar */}
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px 12px', 
                      background: '#f9f9f9', 
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#525252', marginRight: '4px' }}>Quick insert:</span>
                        {textMacros
                          .filter(m => m.isEnabled && (m.fieldType === 'MICROSCOPY' || m.fieldType === 'ALL'))
                          .slice(0, 5)
                          .map(macro => (
                            <button
                              key={macro.id}
                              onClick={() => setMicroscopyFindings(prev => prev + (prev ? ' ' : '') + macro.text)}
                              title={macro.text.substring(0, 100) + '...'}
                              style={{
                                background: 'white',
                                border: '1px solid #0f62fe',
                                color: '#0f62fe',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                              }}
                            >
                              {macro.shortCode}
                            </button>
                          ))
                        }
                        <button
                          onClick={() => setShowMacroDropdown(showMacroDropdown === 'microscopy' ? null : 'microscopy')}
                          style={{
                            background: 'transparent',
                            border: '1px solid #a8a8a8',
                            color: '#525252',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {showMacroDropdown === 'microscopy' ? 'Hide all ▲' : 'Show all ▼'}
                        </button>
                        <button
                          onClick={() => setShowManageMacrosModal(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#525252',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                          }}
                        >
                          ⚙️ Manage
                        </button>
                      </div>
                      
                      {/* Expanded Macro List */}
                      {showMacroDropdown === 'microscopy' && (
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid #e0e0e0',
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}>
                          <input
                            type="text"
                            placeholder="Search macros..."
                            value={macroSearchTerm}
                            onChange={(e) => setMacroSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', marginBottom: '8px' }}
                          />
                          {textMacros
                            .filter(m => {
                              const matchesField = m.fieldType === 'MICROSCOPY' || m.fieldType === 'ALL';
                              const matchesSearch = !macroSearchTerm || 
                                                    m.shortCode.toLowerCase().includes(macroSearchTerm.toLowerCase()) ||
                                                    m.text.toLowerCase().includes(macroSearchTerm.toLowerCase());
                              return matchesField && matchesSearch && m.isEnabled;
                            })
                            .map(macro => (
                              <div
                                key={macro.id}
                                onClick={() => {
                                  setMicroscopyFindings(prev => prev + (prev ? ' ' : '') + macro.text);
                                  setShowMacroDropdown(null);
                                  setMacroSearchTerm('');
                                }}
                                style={{ 
                                  padding: '8px 10px', 
                                  cursor: 'pointer', 
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  background: 'white',
                                  border: '1px solid #e0e0e0',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e8f4fd'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 600, color: '#0f62fe', fontSize: '13px', fontFamily: 'monospace' }}>{macro.shortCode}</span>
                                  <span style={{ fontSize: '11px', color: '#a8a8a8' }}>{macro.ownerName}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#525252', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {macro.text.substring(0, 80)}...
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Diagnosis - Dictionary backed with Add New, includes ICD-10/SNOMED */}
                  <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                      Diagnosis <span style={{ color: '#da1e28' }}>*</span>
                      <span style={{ fontWeight: 400, color: '#525252', fontSize: '12px', marginLeft: '8px' }}>
                        (search by name, ICD-10, or SNOMED code)
                      </span>
                    </label>
                    
                    {/* Selected diagnoses as tags with codes */}
                    <div 
                      onClick={() => setShowDiagnosisDropdown(true)}
                      style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '6px',
                        padding: '8px 12px',
                        minHeight: '44px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        cursor: 'text',
                        background: 'white',
                      }}
                    >
                      {selectedDiagnoses.map(diag => (
                        <span 
                          key={diag.id}
                          title={`ICD-10: ${diag.icd10 || 'N/A'} | SNOMED: ${diag.snomed || 'N/A'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#f0e6ff',
                            color: '#7b1fa2',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        >
                          {diag.name}
                          {diag.icd10 && (
                            <span style={{ 
                              fontSize: '10px', 
                              background: '#7b1fa2', 
                              color: 'white', 
                              padding: '1px 4px', 
                              borderRadius: '3px',
                              marginLeft: '4px',
                            }}>
                              {diag.icd10}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDiagnoses(prev => prev.filter(d => d.id !== diag.id));
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0 2px',
                              fontSize: '14px',
                              color: '#7b1fa2',
                            }}
                          >×</button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder={selectedDiagnoses.length === 0 ? "Search by name, ICD-10, or SNOMED code..." : ""}
                        value={diagnosisSearch}
                        onChange={(e) => setDiagnosisSearch(e.target.value)}
                        onFocus={() => setShowDiagnosisDropdown(true)}
                        style={{
                          border: 'none',
                          outline: 'none',
                          flex: 1,
                          minWidth: '200px',
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    {/* Dropdown */}
                    {showDiagnosisDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxHeight: '350px',
                        overflowY: 'auto',
                        zIndex: 100,
                      }}>
                        {/* Search hint */}
                        {!diagnosisSearch && (
                          <div style={{ 
                            padding: '8px 12px', 
                            fontSize: '12px', 
                            color: '#525252',
                            background: '#f9f9f9',
                            borderBottom: '1px solid #e0e0e0',
                          }}>
                            Type diagnosis name, ICD-10 code (e.g., C22.0), or SNOMED code
                          </div>
                        )}

                        {availableDiagnoses
                          .filter(d => {
                            const search = diagnosisSearch.toLowerCase();
                            const matchesName = d.name.toLowerCase().includes(search);
                            const matchesICD10 = d.icd10 && d.icd10.toLowerCase().includes(search);
                            const matchesSNOMED = d.snomed && d.snomed.includes(search);
                            const notSelected = !selectedDiagnoses.some(s => s.id === d.id);
                            return (matchesName || matchesICD10 || matchesSNOMED) && notSelected;
                          })
                          .slice(0, 10)
                          .map(diag => (
                            <div
                              key={diag.id}
                              onClick={() => {
                                setSelectedDiagnoses(prev => [...prev, diag]);
                                setDiagnosisSearch('');
                              }}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                borderBottom: '1px solid #f4f4f4',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f4f4f4'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <div style={{ fontWeight: 500 }}>{diag.name}</div>
                              <div style={{ fontSize: '12px', color: '#525252', marginTop: '2px' }}>
                                {diag.icd10 && <span style={{ marginRight: '12px' }}>ICD-10: <strong>{diag.icd10}</strong></span>}
                                {diag.snomed && <span>SNOMED: <strong>{diag.snomed}</strong></span>}
                              </div>
                            </div>
                          ))
                        }
                        
                        {/* Show count if more results */}
                        {diagnosisSearch && availableDiagnoses.filter(d => {
                          const search = diagnosisSearch.toLowerCase();
                          return (d.name.toLowerCase().includes(search) || 
                                  (d.icd10 && d.icd10.toLowerCase().includes(search)) ||
                                  (d.snomed && d.snomed.includes(search))) &&
                                 !selectedDiagnoses.some(s => s.id === d.id);
                        }).length > 10 && (
                          <div style={{ 
                            padding: '8px 12px', 
                            fontSize: '12px', 
                            color: '#525252',
                            fontStyle: 'italic',
                          }}>
                            {availableDiagnoses.filter(d => {
                              const search = diagnosisSearch.toLowerCase();
                              return (d.name.toLowerCase().includes(search) || 
                                      (d.icd10 && d.icd10.toLowerCase().includes(search)) ||
                                      (d.snomed && d.snomed.includes(search))) &&
                                     !selectedDiagnoses.some(s => s.id === d.id);
                            }).length - 10} more results...
                          </div>
                        )}
                        
                        {/* Add new option */}
                        {diagnosisSearch && !availableDiagnoses.some(d => 
                          d.name.toLowerCase() === diagnosisSearch.toLowerCase()
                        ) && (
                          <>
                            <div style={{ borderTop: '1px solid #e0e0e0', margin: '4px 0' }} />
                            <div
                              onClick={() => {
                                const newDiag = {
                                  id: Date.now(),
                                  name: diagnosisSearch.trim(),
                                  icd10: null,
                                  snomed: null
                                };
                                setAvailableDiagnoses(prev => [...prev, newDiag]);
                                setSelectedDiagnoses(prev => [...prev, newDiag]);
                                setDiagnosisSearch('');
                                alert(`"${newDiag.name}" has been added to the Diagnoses dictionary. You can add ICD-10/SNOMED codes via Administration.`);
                              }}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#198038',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#d4edda'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <span>+</span> Add "{diagnosisSearch}" to dictionary
                            </div>
                          </>
                        )}

                        {/* Close button */}
                        <div
                          onClick={() => setShowDiagnosisDropdown(false)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#525252',
                            textAlign: 'center',
                            borderTop: '1px solid #e0e0e0',
                            background: '#f9f9f9',
                          }}
                        >
                          Close
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Conclusion - with Quick-Insert Macros */}
                  <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                      Text Conclusion / Comments
                    </label>
                    <textarea
                      value={textConclusion}
                      onChange={(e) => setTextConclusion(e.target.value)}
                      placeholder="Additional narrative conclusion or comments... (or type macro code + Tab to expand)"
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' || e.key === ' ') {
                          const words = textConclusion.split(/\s/);
                          const lastWord = words[words.length - 1];
                          const macro = textMacros.find(m => 
                            m.shortCode === lastWord && 
                            m.isEnabled && 
                            (m.fieldType === 'CONCLUSION' || m.fieldType === 'ALL')
                          );
                          if (macro) {
                            e.preventDefault();
                            const newText = textConclusion.substring(0, textConclusion.lastIndexOf(lastWord)) + macro.text;
                            setTextConclusion(newText);
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                    
                    {/* Quick-Insert Macro Bar */}
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px 12px', 
                      background: '#f9f9f9', 
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#525252', marginRight: '4px' }}>Quick insert:</span>
                        {textMacros
                          .filter(m => m.isEnabled && (m.fieldType === 'CONCLUSION' || m.fieldType === 'ALL'))
                          .slice(0, 5)
                          .map(macro => (
                            <button
                              key={macro.id}
                              onClick={() => setTextConclusion(prev => prev + (prev ? ' ' : '') + macro.text)}
                              title={macro.text.substring(0, 100) + '...'}
                              style={{
                                background: 'white',
                                border: '1px solid #0f62fe',
                                color: '#0f62fe',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                              }}
                            >
                              {macro.shortCode}
                            </button>
                          ))
                        }
                        <button
                          onClick={() => setShowMacroDropdown(showMacroDropdown === 'conclusion' ? null : 'conclusion')}
                          style={{
                            background: 'transparent',
                            border: '1px solid #a8a8a8',
                            color: '#525252',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {showMacroDropdown === 'conclusion' ? 'Hide all ▲' : 'Show all ▼'}
                        </button>
                        <button
                          onClick={() => setShowManageMacrosModal(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#525252',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                          }}
                        >
                          ⚙️ Manage
                        </button>
                      </div>
                      
                      {/* Expanded Macro List */}
                      {showMacroDropdown === 'conclusion' && (
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid #e0e0e0',
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}>
                          <input
                            type="text"
                            placeholder="Search macros..."
                            value={macroSearchTerm}
                            onChange={(e) => setMacroSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', marginBottom: '8px' }}
                          />
                          {textMacros
                            .filter(m => {
                              const matchesField = m.fieldType === 'CONCLUSION' || m.fieldType === 'ALL';
                              const matchesSearch = !macroSearchTerm || 
                                                    m.shortCode.toLowerCase().includes(macroSearchTerm.toLowerCase()) ||
                                                    m.text.toLowerCase().includes(macroSearchTerm.toLowerCase());
                              return matchesField && matchesSearch && m.isEnabled;
                            })
                            .map(macro => (
                              <div
                                key={macro.id}
                                onClick={() => {
                                  setTextConclusion(prev => prev + (prev ? ' ' : '') + macro.text);
                                  setShowMacroDropdown(null);
                                  setMacroSearchTerm('');
                                }}
                                style={{ 
                                  padding: '8px 10px', 
                                  cursor: 'pointer', 
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  background: 'white',
                                  border: '1px solid #e0e0e0',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e8f4fd'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 600, color: '#0f62fe', fontSize: '13px', fontFamily: 'monospace' }}>{macro.shortCode}</span>
                                  <span style={{ fontSize: '11px', color: '#a8a8a8' }}>{macro.ownerName}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#525252', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {macro.text.substring(0, 80)}...
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ICD-10 / SNOMED Codes - Auto-populated from Diagnoses */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 500 }}>
                        Linked Codes
                      </label>
                      <span style={{ fontSize: '12px', color: '#525252' }}>
                        (auto-populated from selected diagnoses)
                      </span>
                    </div>
                    
                    {selectedDiagnoses.length === 0 ? (
                      <div style={{ 
                        padding: '16px', 
                        background: '#f9f9f9', 
                        borderRadius: '4px',
                        color: '#525252',
                        fontSize: '13px',
                        fontStyle: 'italic',
                      }}>
                        Select diagnoses above to see linked ICD-10 and SNOMED codes
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* ICD-10 Codes */}
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: '#525252' }}>
                            ICD-10 Code(s)
                          </label>
                          <div style={{
                            padding: '12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            background: '#f9f9f9',
                            minHeight: '44px',
                          }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {[...new Set(selectedDiagnoses.filter(d => d.icd10).map(d => d.icd10))].map(code => {
                                const diag = selectedDiagnoses.find(d => d.icd10 === code);
                                return (
                                  <span 
                                    key={code}
                                    title={diag?.name}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      background: '#e8f4fd',
                                      color: '#0043ce',
                                      padding: '6px 10px',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span style={{ fontFamily: 'monospace' }}>{code}</span>
                                    <span style={{ 
                                      fontSize: '11px', 
                                      color: '#525252',
                                      fontWeight: 400,
                                      maxWidth: '150px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {diag?.name}
                                    </span>
                                  </span>
                                );
                              })}
                              {selectedDiagnoses.filter(d => d.icd10).length === 0 && (
                                <span style={{ color: '#a8a8a8', fontSize: '13px', fontStyle: 'italic' }}>
                                  No ICD-10 codes linked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* SNOMED Codes */}
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: '#525252' }}>
                            SNOMED Code(s)
                          </label>
                          <div style={{
                            padding: '12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            background: '#f9f9f9',
                            minHeight: '44px',
                          }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {[...new Set(selectedDiagnoses.filter(d => d.snomed).map(d => d.snomed))].map(code => {
                                const diag = selectedDiagnoses.find(d => d.snomed === code);
                                return (
                                  <span 
                                    key={code}
                                    title={diag?.name}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      background: '#fff3e0',
                                      color: '#e65100',
                                      padding: '6px 10px',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span style={{ fontFamily: 'monospace' }}>{code}</span>
                                    <span style={{ 
                                      fontSize: '11px', 
                                      color: '#525252',
                                      fontWeight: 400,
                                      maxWidth: '150px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {diag?.name}
                                    </span>
                                  </span>
                                );
                              })}
                              {selectedDiagnoses.filter(d => d.snomed).length === 0 && (
                                <span style={{ color: '#a8a8a8', fontSize: '13px', fontStyle: 'italic' }}>
                                  No SNOMED codes linked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reports Section */}
          <div ref={sectionRefs.reports} style={{ marginBottom: '24px' }}>
            <div style={{
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
            }}>
              <div 
                onClick={() => toggleSection('reports')}
                style={{
                  padding: '16px 20px',
                  borderBottom: expandedSections.reports ? '1px solid #e0e0e0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Reports</h2>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#525252',
                    background: '#e0e0e0',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    {reports.length} report{reports.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{ fontSize: '20px', color: '#525252' }}>
                  {expandedSections.reports ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedSections.reports && (
                <div style={{ padding: '20px' }}>
                  {reports.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#525252',
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                      <p style={{ margin: '0 0 8px' }}>No reports generated yet.</p>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        Complete the Findings & Conclusions section to generate a report.
                      </p>
                    </div>
                  ) : (
                    <>
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        fontSize: '14px',
                        marginBottom: '20px',
                      }}>
                        <thead>
                          <tr style={{ background: '#e0e0e0' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>#</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Generated</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>By</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((report, i) => (
                            <tr 
                              key={report.id} 
                              style={{ 
                                background: selectedReport === report.id ? '#e8f4fd' : (i % 2 === 0 ? 'white' : '#f9f9f9'),
                                borderBottom: '1px solid #e0e0e0',
                                cursor: 'pointer',
                              }}
                              onClick={() => setSelectedReport(report.id)}
                            >
                              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{report.version}</td>
                              <td style={{ padding: '12px 16px' }}>{report.generatedDate}</td>
                              <td style={{ padding: '12px 16px' }}>{report.generatedBy}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  background: report.type === 'Final' ? '#d4edda' : '#fff3cd',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                }}>
                                  {report.type}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <button style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                }} title="View">👁️</button>
                                <button style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                }} title="Download">⬇️</button>
                                <button style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                }} title="Print">🖨️</button>
                                <button style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                }} title="Email">✉️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {selectedReport && (
                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                          }}>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                              Report Preview
                            </h3>
                            <button style={{
                              background: 'transparent',
                              border: '1px solid #0f62fe',
                              color: '#0f62fe',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}>
                              Full Screen 🔲
                            </button>
                          </div>
                          <div style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            padding: '24px',
                            background: 'white',
                            minHeight: '300px',
                          }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                              <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>PATHOLOGY REPORT</h2>
                              <p style={{ margin: 0, color: '#525252', fontSize: '14px' }}>
                                Côte d'Ivoire Régional Lab
                              </p>
                            </div>
                            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                              <p><strong>Patient:</strong> {caseData.patientName}</p>
                              <p><strong>Lab Number:</strong> {caseData.labNumber}</p>
                              <p><strong>Date:</strong> {caseData.requestDate}</p>
                              <p><strong>Specimen:</strong> {caseData.specimenType}</p>
                              <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
                              <p><strong>Gross Description:</strong></p>
                              <p style={{ color: '#525252' }}>{grossingData.grossDescription}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Action Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e0e0e0',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasUnsavedChanges && (
            <span style={{ 
              color: '#da1e28', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              ⚠️ Unsaved changes
            </span>
          )}
          <button
            style={{
              background: 'transparent',
              color: '#525252',
              border: 'none',
              padding: '12px 20px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Discard Changes
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            style={{
              background: 'transparent',
              color: '#0f62fe',
              border: '1px solid #0f62fe',
              padding: '12px 24px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Save Progress
          </button>
          
          {/* Ready for Pathologist Review Button */}
          {!caseReadyForReview && (
            <button
              onClick={() => {
                if (totalPendingRequests > 0) {
                  setShowReadyForReviewDialog(true);
                } else {
                  setCaseReadyForReview(true);
                  setExpandedSections(prev => ({ ...prev, review: true }));
                  alert('Case is now ready for pathologist review. Pathologist sections have been unlocked.');
                }
              }}
              style={{
                background: totalPendingRequests > 0 ? '#ff8f00' : 'transparent',
                color: totalPendingRequests > 0 ? 'white' : '#198038',
                border: totalPendingRequests > 0 ? 'none' : '1px solid #198038',
                padding: '12px 20px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '4px',
              }}
              title={totalPendingRequests > 0 ? `${totalPendingRequests} pending request(s)` : 'Mark case ready for pathologist review'}
            >
              {totalPendingRequests > 0 ? (
                <>
                  <span>⚠</span>
                  <span style={{ 
                    background: 'rgba(255,255,255,0.3)', 
                    padding: '2px 6px', 
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>{totalPendingRequests}</span>
                </>
              ) : (
                <span>✓</span>
              )}
              Ready for Pathologist
            </button>
          )}
          {caseReadyForReview && (
            <span style={{
              color: '#198038',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 16px',
              background: '#d4edda',
              borderRadius: '4px',
            }}>
              ✓ Ready for Review
            </span>
          )}
          
          <button
            disabled={!canGenerateReport()}
            style={{
              background: canGenerateReport() ? '#0f62fe' : '#c6c6c6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '14px',
              cursor: canGenerateReport() ? 'pointer' : 'not-allowed',
            }}
            title={!canGenerateReport() ? 'Complete Findings & Conclusions to generate report' : ''}
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Add Block Modal */}
      {showAddBlockModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Add Block(s)</h2>
              <button
                onClick={() => setShowAddBlockModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  color: '#161616',
                  marginBottom: '8px',
                }}>
                  Number of Blocks to Add
                </label>
                <input
                  type="number"
                  value={newBlockCount}
                  onChange={(e) => setNewBlockCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={20}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderBottom: '1px solid #8d8d8d',
                    background: '#f4f4f4',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#525252', marginTop: '4px' }}>
                  Maximum: 20 blocks at a time
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  color: '#161616',
                  marginBottom: '8px',
                }}>
                  Default Tissue Type
                </label>
                <TissueTypeahead
                  value={newBlockTissueType}
                  onChange={(val) => setNewBlockTissueType(val)}
                  rowId="modal"
                />
                <div style={{ fontSize: '12px', color: '#525252', marginTop: '4px' }}>
                  Optional - can be set per block after creation
                </div>
              </div>
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}>
              <button
                onClick={() => setShowAddBlockModal(false)}
                style={{
                  background: 'transparent',
                  color: '#0f62fe',
                  border: '1px solid #0f62fe',
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newBlocks = [];
                  for (let n = 0; n < newBlockCount; n++) {
                    newBlocks.push({
                      id: String.fromCharCode(65 + blocks.length + n),
                      location: '',
                      tissueType: newBlockTissueType,
                      createdDate: new Date().toISOString().split('T')[0]
                    });
                  }
                  setBlocks([...blocks, ...newBlocks]);
                  setNewBlockTissueType('');
                  setNewBlockCount(1);
                  setShowAddBlockModal(false);
                }}
                style={{
                  background: '#0f62fe',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                              Add Blocks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Apply Stain Modal */}
      {showBulkStainModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Apply Stain to Slides</h2>
              <button
                onClick={() => setShowBulkStainModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  color: '#161616',
                  marginBottom: '8px',
                }}>
                  Selected Slides
                </label>
                <div style={{
                  background: '#f4f4f4',
                  padding: '12px',
                  borderRadius: '4px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  {selectedSlidesForStain.length === 0 ? (
                    <span style={{ color: '#a8a8a8', fontStyle: 'italic' }}>No slides selected</span>
                  ) : (
                    selectedSlidesForStain.map(id => (
                      <span key={id} style={{
                        background: '#e8f4fd',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        Slide {id}
                        <button
                          onClick={() => setSelectedSlidesForStain(selectedSlidesForStain.filter(s => s !== id))}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '14px',
                            color: '#525252',
                          }}
                        >×</button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  color: '#161616',
                  marginBottom: '8px',
                }}>
                  Stain Type <span style={{ color: '#da1e28' }}>*</span>
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderBottom: '1px solid #8d8d8d',
                    background: '#f4f4f4',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select stain type...</option>
                  {availableStainTypes.map(stain => (
                    <option key={stain} value={stain}>{stain}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  color: '#161616',
                  marginBottom: '8px',
                }}>
                  Initial Status
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['Pending', 'In Progress', 'Complete'].map(status => (
                    <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" name="stainStatus" value={status} defaultChecked={status === 'Pending'} />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}>
              <button
                onClick={() => setShowBulkStainModal(false)}
                style={{
                  background: 'transparent',
                  color: '#0f62fe',
                  border: '1px solid #0f62fe',
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Apply stain to selected slides
                  setShowBulkStainModal(false);
                  setSelectedSlidesForStain([]);
                }}
                disabled={selectedSlidesForStain.length === 0}
                style={{
                  background: selectedSlidesForStain.length === 0 ? '#c6c6c6' : '#0f62fe',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: selectedSlidesForStain.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Apply Stain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Block Labels Modal */}
      {showPrintBlockLabelsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '700px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>🖨 Print Block Labels</h2>
              <button
                onClick={() => setShowPrintBlockLabelsModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f4f4f4', borderRadius: '4px' }}>
                <strong>Case:</strong> {caseData.labNumber} | <strong>Patient:</strong> {caseData.patientName}
              </div>

              <hr style={{ border: 'none', borderTop: '2px solid #e0e0e0', margin: '16px 0' }} />

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Select blocks to print:</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ background: 'transparent', border: '1px solid #e0e0e0', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>✓ Select All</button>
                    <button style={{ background: 'transparent', border: '1px solid #e0e0e0', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>Deselect All</button>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0' }}>
                  <thead>
                    <tr style={{ background: '#f4f4f4' }}>
                      <th style={{ padding: '8px', width: '40px' }}></th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Block</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Barcode</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Tissue Type</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>Copies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map(block => (
                      <tr key={block.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '8px', textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                        <td style={{ padding: '8px', fontWeight: 500 }}>{block.id}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '13px' }}>{block.barcode}</td>
                        <td style={{ padding: '8px' }}>{block.tissueType}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}><input type="number" min="1" defaultValue="1" style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #e0e0e0' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '16px 0' }} />

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Label Configuration</h4>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#525252', marginBottom: '6px' }}>Label Preset</label>
                  <select style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0' }}>
                    <option>Block Label - Standard (1" x 0.5")</option>
                    <option>Block Label - Large (1.5" x 0.75")</option>
                    <option>Freezer Block Label (1" x 0.375")</option>
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#525252', marginBottom: '6px' }}>Barcode Type</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="radio" name="blockBarcodeType" defaultChecked /> Code 128</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="radio" name="blockBarcodeType" /> QR Code</label>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Preview</h4>
                <div style={{ padding: '12px', background: 'white', border: '2px solid #333', borderRadius: '4px', width: '200px', fontFamily: 'monospace', fontSize: '11px' }}>
                  <div style={{ letterSpacing: '2px' }}>║║║║║║║║║║║║║║║║║║║║║</div>
                  <div style={{ fontWeight: 'bold' }}>{blocks[0]?.barcode}</div>
                  <div>{caseData.patientName} | {caseData.dob}</div>
                  <div>{blocks[0]?.tissueType}</div>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '4px', fontWeight: 500 }}>Total labels to print: {blocks.length}</div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowPrintBlockLabelsModal(false)} style={{ background: 'transparent', color: '#0f62fe', border: '1px solid #0f62fe', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { alert('Printing block labels...'); setShowPrintBlockLabelsModal(false); }} style={{ background: '#0f62fe', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>🖨 Print Labels</button>
            </div>
          </div>
        </div>
      )}

      {/* Print Slide Labels Modal */}
      {showPrintSlideLabelsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '750px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>🖨 Print Slide Labels</h2>
              <button
                onClick={() => setShowPrintSlideLabelsModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f4f4f4', borderRadius: '4px' }}>
                <strong>Case:</strong> {caseData.labNumber} | <strong>Patient:</strong> {caseData.patientName}
              </div>

              <hr style={{ border: 'none', borderTop: '2px solid #e0e0e0', margin: '16px 0' }} />

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Select slides to print:</span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select style={{ padding: '4px 8px', border: '1px solid #e0e0e0' }}>
                      <option>All Blocks</option>
                      {[...new Set(slides.map(s => s.sourceBlock))].map(b => <option key={b}>{b}</option>)}
                    </select>
                    <button style={{ background: 'transparent', border: '1px solid #e0e0e0', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>✓ Select All</button>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0' }}>
                  <thead>
                    <tr style={{ background: '#f4f4f4' }}>
                      <th style={{ padding: '8px', width: '40px' }}></th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Slide</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Barcode</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Stain</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Block</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>Copies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slides.map(slide => (
                      <tr key={slide.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '8px', textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                        <td style={{ padding: '8px', fontWeight: 500 }}>{slide.id}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>{slide.barcode}</td>
                        <td style={{ padding: '8px' }}>{slide.stainType || <em style={{ color: '#999' }}>(unstained)</em>}</td>
                        <td style={{ padding: '8px' }}>{slide.sourceBlock}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}><input type="number" min="1" defaultValue="1" style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #e0e0e0' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '16px 0' }} />

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Label Configuration</h4>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#525252', marginBottom: '6px' }}>Label Preset</label>
                  <select style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0' }}>
                    <option>Slide Label - Standard (1" x 0.375")</option>
                    <option>Slide Label - Wide (1.25" x 0.375")</option>
                    <option>Slide Label - Mini (0.75" x 0.25")</option>
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#525252', marginBottom: '6px' }}>Barcode Type</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="radio" name="slideBarcodeType" defaultChecked /> Code 128</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="radio" name="slideBarcodeType" /> QR Code</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="radio" name="slideBarcodeType" /> DataMatrix</label>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Preview</h4>
                <div style={{ padding: '8px 12px', background: 'white', border: '2px solid #333', borderRadius: '4px', width: '180px', fontFamily: 'monospace', fontSize: '10px' }}>
                  <div style={{ letterSpacing: '1px' }}>▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌</div>
                  <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{slides[0]?.barcode}</div>
                  <div>{caseData.patientName} | {slides[0]?.stainCode || 'H&E'} | {slides[0]?.sourceBlock}</div>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '4px', fontWeight: 500 }}>Total labels to print: {slides.length}</div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowPrintSlideLabelsModal(false)} style={{ background: 'transparent', color: '#0f62fe', border: '1px solid #0f62fe', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { alert('Printing slide labels...'); setShowPrintSlideLabelsModal(false); }} style={{ background: '#0f62fe', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>🖨 Print Labels</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Scanned Slides Modal */}
      {showUploadScansModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '700px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>📤 Upload Scanned Slides</h2>
              <button
                onClick={() => setShowUploadScansModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f4f4f4', borderRadius: '4px' }}>
                <strong>Case:</strong> {caseData.labNumber} | <strong>Patient:</strong> {caseData.patientName}
              </div>

              {/* Drop Zone */}
              <div style={{
                border: '2px dashed #0f62fe',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                background: '#f0f7ff',
                marginBottom: '20px',
                cursor: 'pointer',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
                <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Drag and drop slide images here</div>
                <div style={{ fontSize: '14px', color: '#525252', marginBottom: '12px' }}>or click to browse</div>
                <div style={{ fontSize: '12px', color: '#8d8d8d' }}>Supported formats: .svs, .ndpi, .tiff, .jpg, .png</div>
                <div style={{ fontSize: '12px', color: '#8d8d8d' }}>Max file size: 2GB per file</div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '16px 0' }} />

              {/* Auto-Match Setting */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <strong>Auto-Match by Barcode:</strong>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="radio" name="autoMatch" defaultChecked /> Enabled
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="radio" name="autoMatch" /> Disabled
                  </label>
                </label>
                <div style={{ fontSize: '12px', color: '#525252', marginTop: '4px' }}>
                  ℹ️ When enabled, files named with barcodes will auto-match to slides
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '16px 0' }} />

              {/* Pending Uploads */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Pending Uploads:</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0' }}>
                  <thead>
                    <tr style={{ background: '#f4f4f4' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>File Name</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Match</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 600, width: '60px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>24TST000010.A.S003.svs</td>
                      <td style={{ padding: '8px' }}><span style={{ color: '#198038' }}>✓ S003</span></td>
                      <td style={{ padding: '8px' }}><span style={{ color: '#198038', fontSize: '12px' }}>Ready</span></td>
                      <td style={{ padding: '8px', textAlign: 'center' }}><button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#da1e28' }}>×</button></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>slide_unknown.tiff</td>
                      <td style={{ padding: '8px' }}>
                        <select style={{ padding: '4px', fontSize: '12px', border: '1px solid #ff8f00', background: '#fff8e1' }}>
                          <option>⚠ Select slide...</option>
                          <option>S003</option>
                          <option>S004</option>
                          <option>S005</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}><span style={{ color: '#ff8f00', fontSize: '12px' }}>Needs Match</span></td>
                      <td style={{ padding: '8px', textAlign: 'center' }}><button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#da1e28' }}>×</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input type="checkbox" /> Overwrite existing images if slide already has scan
                </label>
              </div>

              <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '4px', fontSize: '14px' }}>
                2 files selected, 1 ready to upload
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowUploadScansModal(false)} style={{ background: 'transparent', color: '#0f62fe', border: '1px solid #0f62fe', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { alert('Uploading slides...'); setShowUploadScansModal(false); }} style={{ background: '#0f62fe', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>📤 Upload 1 File</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Additional Item Modal */}
      {showAddRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Request Additional Item</h2>
              <button
                onClick={() => { setShowAddRequestModal(false); setRequestModalContext({ type: null, target: null }); }}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >×</button>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Request Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Request Type *</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['BLOCK', 'SLIDE', 'STAIN'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="requestType" 
                        defaultChecked={requestModalContext.type === type || (type === 'STAIN' && requestModalContext.target?.startsWith('S'))}
                      />
                      <span style={{ fontSize: '14px' }}>Additional {type.charAt(0) + type.slice(1).toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '16px 0' }} />

              {/* Target */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Target *
                  {requestModalContext.target && (
                    <span style={{ fontWeight: 400, color: '#198038', marginLeft: '8px', fontSize: '12px' }}>(auto-populated)</span>
                  )}
                </label>
                <select 
                  defaultValue={requestModalContext.target || ''}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    fontSize: '14px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '4px',
                    background: requestModalContext.target ? '#f0fff0' : 'white',
                  }}
                >
                  <option value="">Select target...</option>
                  <optgroup label="Slides">
                    {slides.map(s => (
                      <option key={s.id} value={s.id}>{s.id} - {s.stainType || 'No stain'} - Block {s.sourceBlock}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Blocks">
                    {blocks.map(b => (
                      <option key={b.id} value={`block-${b.id}`}>Block {b.id} - {b.tissueType}</option>
                    ))}
                  </optgroup>
                </select>
                <div style={{ fontSize: '12px', color: '#525252', marginTop: '4px' }}>
                  ℹ️ For Block requests, select specimen area. For Slide requests, select source block. For Stain requests, select target slide.
                </div>
              </div>

              {/* Stain Type (conditional) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Stain Type (for Additional Stain only)</label>
                <select style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <option value="">Select stain type...</option>
                  {availableStainTypes.map(stain => (
                    <option key={stain} value={stain}>{stain}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Notes / Instructions *</label>
                <textarea 
                  placeholder="Provide specific instructions for the technician (e.g., 'thinner slices - 3μm instead of 5μm')"
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    fontSize: '14px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '4px',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#525252', marginTop: '4px' }}>
                  💡 Provide specific instructions for the technician
                </div>
              </div>

              {/* Priority */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Priority</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['NORMAL', 'URGENT', 'STAT'].map(priority => (
                    <label key={priority} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" name="priority" defaultChecked={priority === 'NORMAL'} />
                      <span style={{ 
                        fontSize: '14px',
                        color: priority === 'STAT' ? '#c62828' : priority === 'URGENT' ? '#e65100' : '#333',
                        fontWeight: priority !== 'NORMAL' ? 600 : 400,
                      }}>{priority}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => { setShowAddRequestModal(false); setRequestModalContext({ type: null, target: null }); }} 
                style={{ background: 'transparent', color: '#0f62fe', border: '1px solid #0f62fe', padding: '10px 20px', cursor: 'pointer' }}
              >Cancel</button>
              <button 
                onClick={() => { 
                  alert('Request submitted!'); 
                  setShowAddRequestModal(false); 
                  setRequestModalContext({ type: null, target: null }); 
                }} 
                style={{ background: '#0f62fe', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
              >Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Ready for Review Confirmation Dialog */}
      {showReadyForReviewDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#fff3cd',
            }}>
              <span style={{ fontSize: '24px' }}>⚠</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500, color: '#856404' }}>Outstanding Requests</h2>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', marginBottom: '16px', color: '#333' }}>
                There are <strong>{totalPendingRequests} pending request{totalPendingRequests > 1 ? 's' : ''}</strong> that have not been completed:
              </p>
              
              <ul style={{ margin: '0 0 20px 0', padding: '0 0 0 20px', fontSize: '13px', color: '#525252' }}>
                {pathologistRequests.filter(r => r.status === 'Pending').map(r => (
                  <li key={r.id} style={{ marginBottom: '8px' }}>
                    <strong>Additional {r.requestType.charAt(0) + r.requestType.slice(1).toLowerCase()}</strong>
                    {r.targetId && ` from ${r.targetType} ${r.targetId}`}
                    {r.stainType && `: ${r.stainType}`}
                    {r.notes && <span style={{ color: '#888' }}> — "{r.notes.substring(0, 50)}{r.notes.length > 50 ? '...' : ''}"</span>}
                  </li>
                ))}
              </ul>

              <p style={{ fontSize: '14px', color: '#666' }}>
                Are you sure you want to mark this case as ready for review?
                The pathologist will see these as incomplete.
              </p>
            </div>
            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid #e0e0e0', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <button 
                onClick={() => setShowReadyForReviewDialog(false)} 
                style={{ background: 'transparent', color: '#525252', border: '1px solid #e0e0e0', padding: '10px 16px', cursor: 'pointer' }}
              >Cancel</button>
              <button 
                onClick={() => {
                  setShowReadyForReviewDialog(false);
                  // Scroll to requests table
                  document.querySelector('[ref="staining"]')?.scrollIntoView({ behavior: 'smooth' });
                }} 
                style={{ background: 'transparent', color: '#0f62fe', border: '1px solid #0f62fe', padding: '10px 16px', cursor: 'pointer' }}
              >Complete Requests</button>
              <button 
                onClick={() => { 
                  setCaseReadyForReview(true);
                  setExpandedSections(prev => ({ ...prev, review: true }));
                  setShowReadyForReviewDialog(false); 
                  alert('Case is now ready for pathologist review (with pending requests logged). Pathologist sections have been unlocked.');
                }} 
                style={{ background: '#ff8f00', color: 'white', border: 'none', padding: '10px 16px', cursor: 'pointer' }}
              >Mark Ready Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Select Scan Modal (Disambiguation) */}
      {showSelectScanModal && selectedSlideForView && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '650px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Select Scan to View</h2>
              <button
                onClick={() => { setShowSelectScanModal(false); setSelectedSlideForView(null); setSelectedScan(null); }}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >×</button>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Slide Info */}
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f4f4f4', borderRadius: '4px' }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                  <strong>Slide:</strong> {selectedSlideForView.id} ({selectedSlideForView.barcode})
                </div>
                <div style={{ fontSize: '14px' }}>
                  <strong>Stain:</strong> {selectedSlideForView.stainType}
                </div>
              </div>

              <div style={{ 
                padding: '12px', 
                background: '#e8f4fd', 
                borderRadius: '4px', 
                marginBottom: '16px',
                fontSize: '14px',
                color: '#0043ce',
              }}>
                This slide has {selectedSlideForView.scans.length} scans available. Select one to view:
              </div>

              {/* Scans Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#f4f4f4' }}>
                    <th style={{ padding: '10px', width: '40px' }}></th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Scanned</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Scanner</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>Mag</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>Size</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSlideForView.scans.map((scan, index) => (
                    <tr 
                      key={scan.id} 
                      style={{ 
                        borderBottom: '1px solid #e0e0e0',
                        background: selectedScan?.id === scan.id ? '#e8f4fd' : 'white',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedScan(scan)}
                    >
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input 
                          type="radio" 
                          name="scanSelection" 
                          checked={selectedScan?.id === scan.id}
                          onChange={() => setSelectedScan(scan)}
                          style={{ width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontSize: '13px', fontWeight: index === 0 ? 600 : 400 }}>{scan.scannedDate}</div>
                        {index === 0 && (
                          <div style={{ fontSize: '11px', color: '#198038' }}>(most recent)</div>
                        )}
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px' }}>{scan.scanner}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px' }}>{scan.magnification}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>{scan.fileSize}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: '#525252' }}>{scan.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Preferences */}
              <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" /> Remember my selection for this slide
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={alwaysOpenMostRecent}
                    onChange={(e) => setAlwaysOpenMostRecent(e.target.checked)}
                  /> Always open most recent scan (skip this dialog)
                </label>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => { setShowSelectScanModal(false); setSelectedSlideForView(null); setSelectedScan(null); }} 
                style={{ background: 'transparent', color: '#0f62fe', border: '1px solid #0f62fe', padding: '10px 20px', cursor: 'pointer' }}
              >Cancel</button>
              <button 
                onClick={() => { 
                  setShowSelectScanModal(false); 
                  setShowViewSlideModal(true);
                }} 
                disabled={!selectedScan}
                style={{ 
                  background: selectedScan ? '#0f62fe' : '#c6c6c6', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  cursor: selectedScan ? 'pointer' : 'not-allowed' 
                }}
              >View Selected Scan</button>
            </div>
          </div>
        </div>
      )}

      {/* View Digital Slide Modal */}
      {showViewSlideModal && selectedSlideForView && selectedScan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '95%',
            maxWidth: '1200px',
            maxHeight: '95vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#161616',
              color: 'white',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>🔬 Digital Slide Viewer</h2>
              <button
                onClick={() => { setShowViewSlideModal(false); setSelectedSlideForView(null); setSelectedScan(null); }}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'white' }}
              >×</button>
            </div>
            <div style={{ display: 'flex', height: 'calc(95vh - 120px)' }}>
              {/* Left Panel - Slide Details */}
              <div style={{ width: '320px', borderRight: '1px solid #e0e0e0', padding: '20px', overflow: 'auto', background: '#f9f9f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#161616' }}>Slide Details</h3>
                
                <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#525252' }}>Slide:</span>
                    <span style={{ fontWeight: 600 }}>{selectedSlideForView.id}</span>
                    <span style={{ color: '#525252' }}>Barcode:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{selectedSlideForView.barcode}</span>
                    <span style={{ color: '#525252' }}>Block:</span>
                    <span>{selectedSlideForView.sourceBlock} ({blocks.find(b => b.id === selectedSlideForView.sourceBlock)?.tissueType || 'Unknown'})</span>
                  </div>
                </div>

                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#161616' }}>Staining Information</h4>
                <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#525252' }}>Stain Type:</span>
                    <span style={{ fontWeight: 500 }}>{selectedSlideForView.stainType}</span>
                    <span style={{ color: '#525252' }}>Status:</span>
                    <span>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: selectedSlideForView.stainStatus === 'Complete' ? '#198038' : '#ff8f00',
                        marginRight: '6px',
                      }}></span>
                      {selectedSlideForView.stainStatus}
                    </span>
                    <span style={{ color: '#525252' }}>Stained Date:</span>
                    <span>{selectedSlideForView.stainedDate || '—'}</span>
                    <span style={{ color: '#525252' }}>Stained By:</span>
                    <span>{selectedSlideForView.stainedBy || '—'}</span>
                  </div>
                </div>

                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#161616' }}>Scan Information</h4>
                {/* Scan Switcher (when multiple scans) */}
                {selectedSlideForView.scans.length > 1 && (
                  <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#e8f4fd', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#0043ce' }}>
                      Viewing scan {selectedSlideForView.scans.findIndex(s => s.id === selectedScan.id) + 1} of {selectedSlideForView.scans.length}
                    </span>
                    <select 
                      value={selectedScan.id}
                      onChange={(e) => setSelectedScan(selectedSlideForView.scans.find(s => s.id === e.target.value))}
                      style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #0f62fe', borderRadius: '4px', background: 'white' }}
                    >
                      {selectedSlideForView.scans.map((scan, idx) => (
                        <option key={scan.id} value={scan.id}>
                          {scan.scannedDate} ({scan.magnification}){idx === 0 ? ' - most recent' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#525252' }}>Scanned:</span>
                    <span>
                      {selectedScan.scannedDate}
                      {selectedSlideForView.scans.length > 1 && selectedSlideForView.scans[0].id === selectedScan.id && (
                        <span style={{ marginLeft: '6px', fontSize: '10px', background: '#198038', color: 'white', padding: '1px 4px', borderRadius: '2px' }}>latest</span>
                      )}
                    </span>
                    <span style={{ color: '#525252' }}>Scanner:</span>
                    <span>{selectedScan.scanner}</span>
                    <span style={{ color: '#525252' }}>Magnification:</span>
                    <span>{selectedScan.magnification}</span>
                    <span style={{ color: '#525252' }}>Resolution:</span>
                    <span style={{ fontSize: '11px' }}>{selectedScan.resolution}</span>
                    <span style={{ color: '#525252' }}>File Size:</span>
                    <span>{selectedScan.fileSize}</span>
                    {selectedScan.notes && (
                      <>
                        <span style={{ color: '#525252' }}>Notes:</span>
                        <span style={{ fontStyle: 'italic', color: '#525252' }}>{selectedScan.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#161616' }}>Patient</h4>
                <div style={{ padding: '12px', background: 'white', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#525252' }}>Name:</span>
                    <span style={{ fontWeight: 500 }}>{caseData.patientName}</span>
                    <span style={{ color: '#525252' }}>DOB:</span>
                    <span>{caseData.dob}</span>
                    <span style={{ color: '#525252' }}>Case #:</span>
                    <span>{caseData.labNumber}</span>
                  </div>
                </div>
              </div>

              {/* Right Panel - Image Viewer */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#2d2d2d' }}>
                {/* Image Area */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ 
                    width: '80%', 
                    height: '80%', 
                    background: 'linear-gradient(45deg, #3d3d3d 25%, transparent 25%), linear-gradient(-45deg, #3d3d3d 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3d3d3d 75%), linear-gradient(-45deg, transparent 75%, #3d3d3d 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    border: '1px solid #444',
                  }}>
                    <div style={{ textAlign: 'center', color: '#999' }}>
                      <div style={{ fontSize: '72px', marginBottom: '16px' }}>🔬</div>
                      <div style={{ fontSize: '16px' }}>Whole Slide Image</div>
                      <div style={{ fontSize: '14px', marginTop: '8px' }}>{selectedSlideForView.id} - {selectedSlideForView.stainType} @ {selectedScan.magnification}</div>
                      <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>Scanned: {selectedScan.scannedDate}</div>
                      <div style={{ fontSize: '11px', marginTop: '8px', color: '#555' }}>(OpenSeadragon viewer would render here)</div>
                    </div>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div style={{ padding: '12px 20px', background: '#1a1a1a', borderTop: '1px solid #444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
                        style={{ background: '#444', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}
                      >−</button>
                      <input 
                        type="range" 
                        min="1" 
                        max="40" 
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                        style={{ width: '200px' }}
                      />
                      <button 
                        onClick={() => setZoomLevel(Math.min(40, zoomLevel + 1))}
                        style={{ background: '#444', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}
                      >+</button>
                      <span style={{ color: 'white', fontSize: '14px', minWidth: '60px' }}>Zoom: {zoomLevel}x</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: '#444', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>🔍 Fit to Screen</button>
                      <button style={{ background: '#444', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>1:1 Actual Size</button>
                      <button style={{ background: '#444', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>⛶ Full Screen</button>
                      <button style={{ background: '#0f62fe', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>💾 Download</button>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div style={{ padding: '12px 20px', background: '#252525', borderTop: '1px solid #444', display: 'flex', justifyContent: 'space-between' }}>
                  <button 
                    onClick={() => {
                      const scannedSlides = slides.filter(s => s.scans && s.scans.length > 0);
                      const currentScannedIndex = scannedSlides.findIndex(s => s.id === selectedSlideForView.id);
                      if (currentScannedIndex > 0) {
                        const prevSlide = scannedSlides[currentScannedIndex - 1];
                        setSelectedSlideForView(prevSlide);
                        setSelectedScan(prevSlide.scans[0]); // Select most recent scan
                      }
                    }}
                    disabled={slides.filter(s => s.scans && s.scans.length > 0).findIndex(s => s.id === selectedSlideForView.id) === 0}
                    style={{ 
                      background: 'transparent', 
                      color: slides.filter(s => s.scans && s.scans.length > 0).findIndex(s => s.id === selectedSlideForView.id) === 0 ? '#666' : '#0f62fe', 
                      border: `1px solid ${slides.filter(s => s.scans && s.scans.length > 0).findIndex(s => s.id === selectedSlideForView.id) === 0 ? '#666' : '#0f62fe'}`, 
                      padding: '8px 16px', 
                      cursor: slides.filter(s => s.scans && s.scans.length > 0).findIndex(s => s.id === selectedSlideForView.id) === 0 ? 'not-allowed' : 'pointer', 
                      borderRadius: '4px', 
                      fontSize: '13px' 
                    }}
                  >
                    ← Previous Slide
                  </button>
                  <span style={{ color: '#999', fontSize: '13px', alignSelf: 'center' }}>
                    Slide {slides.filter(s => s.scans && s.scans.length > 0).findIndex(s => s.id === selectedSlideForView.id) + 1} of {slides.filter(s => s.scans && s.scans.length > 0).length} scanned
                  </span>
                  <button 
                    onClick={() => {
                      const scannedSlides = slides.filter(s => s.scans && s.scans.length > 0);
                      const currentScannedIndex = scannedSlides.findIndex(s => s.id === selectedSlideForView.id);
                      if (currentScannedIndex < scannedSlides.length - 1) {
                        const nextSlide = scannedSlides[currentScannedIndex + 1];
                        setSelectedSlideForView(nextSlide);
                        setSelectedScan(nextSlide.scans[0]); // Select most recent scan
                      }
                    }}
                    disabled={(() => {
                      const scannedSlides = slides.filter(s => s.scans && s.scans.length > 0);
                      const currentScannedIndex = scannedSlides.findIndex(s => s.id === selectedSlideForView.id);
                      return currentScannedIndex >= scannedSlides.length - 1;
                    })()}
                    style={{ 
                      background: 'transparent', 
                      color: (() => {
                        const scannedSlides = slides.filter(s => s.scans && s.scans.length > 0);
                        const currentScannedIndex = scannedSlides.findIndex(s => s.id === selectedSlideForView.id);
                        return currentScannedIndex >= scannedSlides.length - 1 ? '#666' : '#0f62fe';
                      })(), 
                      border: `1px solid ${(() => {
                        const scannedSlides = slides.filter(s => s.scans && s.scans.length > 0);
                        const currentScannedIndex = scannedSlides.findIndex(s => s.id === selectedSlideForView.id);
                        return currentScannedIndex >= scannedSlides.length - 1 ? '#666' : '#0f62fe';
                      })()}`, 
                      padding: '8px 16px', 
                      cursor: (() => {
                        const scannedSlides = slides.filter(s => s.scans && s.scans.length > 0);
                        const currentScannedIndex = scannedSlides.findIndex(s => s.id === selectedSlideForView.id);
                        return currentScannedIndex >= scannedSlides.length - 1 ? 'not-allowed' : 'pointer';
                      })(), 
                      borderRadius: '4px', 
                      fontSize: '13px' 
                    }}
                  >
                    Next Slide →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Technique Modal */}
      {showAddTechniqueModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '450px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Add New Technique</h2>
              <button
                onClick={() => setShowAddTechniqueModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Short Code <span style={{ color: '#da1e28' }}>*</span>
                  <span style={{ fontWeight: 400, color: '#525252', fontSize: '12px', marginLeft: '8px' }}>
                    (2-6 characters, e.g., EM, CYTO)
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={newTechniqueShortCode}
                  onChange={(e) => setNewTechniqueShortCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="e.g., EM"
                  style={{
                    width: '120px',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Full Name <span style={{ color: '#da1e28' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newTechniqueFullName}
                  onChange={(e) => setNewTechniqueFullName(e.target.value)}
                  placeholder="e.g., Electron Microscopy"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                background: '#fff8e1', 
                borderRadius: '4px',
                border: '1px solid #ffecb3',
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newTechniqueDoNotSave}
                    onChange={(e) => setNewTechniqueDoNotSave(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>Do not save for future cases</div>
                    <div style={{ fontSize: '12px', color: '#525252', marginTop: '2px' }}>
                      This technique will only be added to this case and will not appear in the dictionary for other cases.
                    </div>
                  </div>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddTechniqueModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #e0e0e0',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!newTechniqueShortCode || newTechniqueShortCode.length < 2 || !newTechniqueFullName}
                  onClick={() => {
                    const newTech = { 
                      shortCode: newTechniqueShortCode, 
                      fullName: newTechniqueFullName,
                      oneTimeOnly: newTechniqueDoNotSave,
                    };
                    if (!newTechniqueDoNotSave) {
                      setAvailableTechniques(prev => [...prev, newTech]);
                    }
                    setSelectedTechniques(prev => [...prev, newTech]);
                    setShowAddTechniqueModal(false);
                    setNewTechniqueShortCode('');
                    setNewTechniqueFullName('');
                    setNewTechniqueDoNotSave(false);
                    alert(newTechniqueDoNotSave 
                      ? `"${newTechniqueShortCode} - ${newTechniqueFullName}" added to this case only.`
                      : `"${newTechniqueShortCode} - ${newTechniqueFullName}" added to dictionary.`);
                  }}
                  style={{
                    background: (!newTechniqueShortCode || newTechniqueShortCode.length < 2 || !newTechniqueFullName) ? '#c6c6c6' : '#0f62fe',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: (!newTechniqueShortCode || newTechniqueShortCode.length < 2 || !newTechniqueFullName) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Add Technique
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Macros Modal */}
      {showManageMacrosModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '700px',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>⚙️ Manage Macros</h2>
              <button
                onClick={() => setShowManageMacrosModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >×</button>
            </div>
            
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
              <button
                onClick={() => {
                  setEditingMacro(null);
                  setNewMacroShortCode('');
                  setNewMacroText('');
                  setNewMacroFieldType('ALL');
                  setNewMacroIsShared(false);
                  setShowCreateMacroModal(true);
                }}
                style={{
                  background: '#0f62fe',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                + Create New Macro
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
              {[
                { key: 'my', label: 'My Macros', count: textMacros.filter(m => m.owner === 'me').length },
                { key: 'shared', label: 'Shared Macros', count: textMacros.filter(m => m.owner !== 'me' && m.owner !== 'system' && m.isShared).length },
                { key: 'system', label: 'System Macros', count: textMacros.filter(m => m.owner === 'system').length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setMacroTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: macroTab === tab.key ? 'white' : '#f4f4f4',
                    border: 'none',
                    borderBottom: macroTab === tab.key ? '2px solid #0f62fe' : '2px solid transparent',
                    fontSize: '14px',
                    fontWeight: macroTab === tab.key ? 600 : 400,
                    cursor: 'pointer',
                    color: macroTab === tab.key ? '#0f62fe' : '#525252',
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Macro List */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
              {textMacros
                .filter(m => {
                  if (macroTab === 'my') return m.owner === 'me';
                  if (macroTab === 'system') return m.owner === 'system';
                  return m.owner !== 'me' && m.owner !== 'system' && m.isShared;
                })
                .map(macro => (
                  <div
                    key={macro.id}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      background: macro.isEnabled ? 'white' : '#f9f9f9',
                      opacity: macro.isEnabled ? 1 : 0.7,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ 
                          fontWeight: 600, 
                          color: '#0f62fe', 
                          fontSize: '15px',
                          fontFamily: 'monospace',
                        }}>{macro.shortCode}</span>
                        <span style={{ 
                          marginLeft: '12px', 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          background: macro.fieldType === 'ALL' ? '#e8f4fd' : 
                                      macro.fieldType === 'GROSS' ? '#d4edda' :
                                      macro.fieldType === 'MICROSCOPY' ? '#f0e6ff' : '#fff3cd',
                          borderRadius: '4px',
                          color: '#525252',
                        }}>
                          {macro.fieldType === 'ALL' ? 'All Fields' : macro.fieldType}
                        </span>
                        {macro.owner !== 'me' && (
                          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#a8a8a8' }}>
                            by {macro.ownerName}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {macro.owner === 'me' ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingMacro(macro);
                                setNewMacroShortCode(macro.shortCode);
                                setNewMacroText(macro.text);
                                setNewMacroFieldType(macro.fieldType);
                                setNewMacroIsShared(macro.isShared);
                                setShowCreateMacroModal(true);
                              }}
                              style={{
                                background: 'transparent',
                                border: '1px solid #e0e0e0',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete macro "${macro.shortCode}"?`)) {
                                  setTextMacros(prev => prev.filter(m => m.id !== macro.id));
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: '1px solid #da1e28',
                                color: '#da1e28',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setTextMacros(prev => prev.map(m => 
                                m.id === macro.id ? { ...m, isEnabled: !m.isEnabled } : m
                              ));
                            }}
                            style={{
                              background: macro.isEnabled ? '#fff3cd' : '#d4edda',
                              border: 'none',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              color: macro.isEnabled ? '#856404' : '#198038',
                            }}
                          >
                            {macro.isEnabled ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#525252', 
                      lineHeight: '1.4',
                      maxHeight: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {macro.text}
                    </div>
                    {!macro.isEnabled && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#a8a8a8', fontStyle: 'italic' }}>
                        Disabled - will not appear in Insert Macro dropdown
                      </div>
                    )}
                  </div>
                ))
              }
              {textMacros.filter(m => {
                if (macroTab === 'my') return m.owner === 'me';
                if (macroTab === 'system') return m.owner === 'system';
                return m.owner !== 'me' && m.owner !== 'system' && m.isShared;
              }).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#a8a8a8' }}>
                  No macros in this category.
                  {macroTab === 'my' && ' Click "Create New Macro" to add one.'}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button
                onClick={() => setShowManageMacrosModal(false)}
                style={{
                  background: '#0f62fe',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Macro Modal */}
      {showCreateMacroModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            width: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
                {editingMacro ? 'Edit Macro' : 'Create New Macro'}
              </h2>
              <button
                onClick={() => setShowCreateMacroModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Short Code <span style={{ color: '#da1e28' }}>*</span>
                  <span style={{ fontWeight: 400, color: '#525252', fontSize: '12px', marginLeft: '8px' }}>
                    (starts with period, e.g., .nmi)
                  </span>
                </label>
                <input
                  type="text"
                  value={newMacroShortCode}
                  onChange={(e) => {
                    let val = e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '');
                    if (val && !val.startsWith('.')) val = '.' + val;
                    setNewMacroShortCode(val);
                  }}
                  placeholder=".nmi"
                  style={{
                    width: '150px',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Macro Text <span style={{ color: '#da1e28' }}>*</span>
                </label>
                <textarea
                  value={newMacroText}
                  onChange={(e) => setNewMacroText(e.target.value)}
                  placeholder="Enter the expanded text for this macro..."
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#525252', marginTop: '6px' }}>
                  Available placeholders: {'{specimen}'}, {'{site}'}, {'{size}'}, {'{date}'}, {'{grade}'}, {'{differentiation}'}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Field Type
                </label>
                <select
                  value={newMacroFieldType}
                  onChange={(e) => setNewMacroFieldType(e.target.value)}
                  style={{
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="ALL">All Fields</option>
                  <option value="GROSS">Gross Exam Findings only</option>
                  <option value="MICROSCOPY">Microscopic Description only</option>
                  <option value="CONCLUSION">Text Conclusion only</option>
                </select>
              </div>
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                background: '#f4f4f4', 
                borderRadius: '4px',
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newMacroIsShared}
                    onChange={(e) => setNewMacroIsShared(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>Share with all users</div>
                    <div style={{ fontSize: '12px', color: '#525252', marginTop: '2px' }}>
                      Other users will be able to see and use this macro. They can disable it for themselves if they prefer.
                    </div>
                  </div>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCreateMacroModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #e0e0e0',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!newMacroShortCode || newMacroShortCode.length < 2 || !newMacroText}
                  onClick={() => {
                    if (editingMacro) {
                      setTextMacros(prev => prev.map(m => 
                        m.id === editingMacro.id 
                          ? { ...m, shortCode: newMacroShortCode, text: newMacroText, fieldType: newMacroFieldType, isShared: newMacroIsShared }
                          : m
                      ));
                    } else {
                      const newMacro = {
                        id: Math.max(...textMacros.map(m => m.id)) + 1,
                        shortCode: newMacroShortCode,
                        text: newMacroText,
                        fieldType: newMacroFieldType,
                        owner: 'me',
                        ownerName: 'Dr. Mboule',
                        isShared: newMacroIsShared,
                        isEnabled: true,
                      };
                      setTextMacros(prev => [...prev, newMacro]);
                    }
                    setShowCreateMacroModal(false);
                    setEditingMacro(null);
                    alert(editingMacro ? 'Macro updated successfully.' : 'Macro created successfully.');
                  }}
                  style={{
                    background: (!newMacroShortCode || newMacroShortCode.length < 2 || !newMacroText) ? '#c6c6c6' : '#0f62fe',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: (!newMacroShortCode || newMacroShortCode.length < 2 || !newMacroText) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {editingMacro ? 'Save Changes' : 'Create Macro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathologyCaseView;
