import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// IHC CASE VIEW v2 - CALCULATED FIELDS & ENHANCEMENTS MOCKUP
// Features: Auto-Allred, Molecular SubType Suggestion, ISH Interpretation,
//           Panel Templates, Digital Pathology Integration
// ============================================================================

// Allred Score Calculator Logic
const calculateProportionScore = (percentage) => {
  if (percentage === 0 || percentage === '') return 0;
  if (percentage < 1) return 1;
  if (percentage <= 10) return 2;
  if (percentage <= 33) return 3;
  if (percentage <= 66) return 4;
  return 5;
};

const getProportionLabel = (score) => {
  const labels = ['0%', '<1%', '1-10%', '11-33%', '34-66%', '67-100%'];
  return labels[score] || '';
};

const intensityScores = { 'Negative': 0, 'Weak': 1, 'Moderate': 2, 'Strong': 3 };

// Molecular SubType Classification Logic
const suggestMolecularSubType = (er, pr, her2Status, ki67) => {
  if (er === '' || ki67 === '') return null;
  
  const erPositive = parseFloat(er) >= 1;
  const prPositive = parseFloat(pr) >= 1;
  const prHigh = parseFloat(pr) >= 20;
  const her2Positive = her2Status === 'Positive' || her2Status === '3+';
  const ki67Low = parseFloat(ki67) < 20;

  if (!erPositive && !prPositive && !her2Positive) {
    return { subtype: 'Triple-negative / Basal-like', confidence: 'High', reasoning: `ER- (${er}%), PR- (${pr}%), HER2-` };
  }
  if (!erPositive && !prPositive && her2Positive) {
    return { subtype: 'HER2-enriched', confidence: 'High', reasoning: `ER- (${er}%), PR- (${pr}%), HER2+` };
  }
  if (erPositive && her2Positive) {
    return { subtype: 'Luminal B (HER2-positive)', confidence: 'High', reasoning: `ER+ (${er}%), HER2+` };
  }
  if (erPositive && !her2Positive) {
    if (ki67Low && prHigh) {
      return { subtype: 'Luminal A', confidence: 'High', reasoning: `ER+ (${er}%), PR High (${pr}%), HER2-, Ki-67 Low (${ki67}%)` };
    } else {
      return { subtype: 'Luminal B (HER2-negative)', confidence: 'High', reasoning: `ER+ (${er}%), HER2-, Ki-67 High (${ki67}%) or PR Low` };
    }
  }
  return null;
};

// ISH Interpretation Logic (ASCO/CAP 2018)
const interpretISH = (avgHER2, avgCEP17) => {
  if (!avgHER2 || !avgCEP17 || avgCEP17 === 0) return null;
  
  const ratio = avgHER2 / avgCEP17;
  
  if (ratio >= 2.0) {
    if (avgHER2 >= 4.0) {
      return { group: 1, status: 'Positive', action: 'HER2-targeted therapy eligible', color: '#2e7d32' };
    } else {
      return { group: 2, status: 'Positive', action: 'HER2-targeted therapy eligible', color: '#2e7d32' };
    }
  } else {
    if (avgHER2 >= 6.0) {
      return { group: 3, status: 'Positive', action: 'HER2-targeted therapy eligible', color: '#2e7d32' };
    } else if (avgHER2 >= 4.0) {
      return { group: 4, status: 'Equivocal', action: 'Recommend retest with alternate assay', color: '#f57c00' };
    } else {
      return { group: 5, status: 'Negative', action: 'Not eligible for HER2-targeted therapy', color: '#757575' };
    }
  }
};

// Panel Templates Data
const panelTemplates = [
  {
    id: 'breast',
    name: 'Breast Cancer Standard',
    markers: [
      { name: 'ER', required: true },
      { name: 'PR', required: true },
      { name: 'HER2', required: true },
      { name: 'Ki-67', required: true },
      { name: 'E-cadherin', required: false },
    ]
  },
  {
    id: 'lymphoma',
    name: 'Lymphoma Panel',
    markers: [
      { name: 'CD20', required: true },
      { name: 'CD3', required: true },
      { name: 'CD10', required: true },
      { name: 'BCL-2', required: true },
      { name: 'BCL-6', required: true },
      { name: 'MUM1', required: true },
      { name: 'Ki-67', required: true },
      { name: 'CD5', required: false },
      { name: 'Cyclin D1', required: false },
    ]
  },
  {
    id: 'melanoma',
    name: 'Melanoma Panel',
    markers: [
      { name: 'S100', required: true },
      { name: 'HMB-45', required: true },
      { name: 'Melan-A', required: true },
      { name: 'SOX10', required: true },
      { name: 'Ki-67', required: false },
    ]
  },
  {
    id: 'lung',
    name: 'Lung Carcinoma Panel',
    markers: [
      { name: 'TTF-1', required: true },
      { name: 'Napsin A', required: true },
      { name: 'p40', required: true },
      { name: 'CK5/6', required: true },
      { name: 'Chromogranin', required: false },
      { name: 'Synaptophysin', required: false },
    ]
  },
  {
    id: 'gist',
    name: 'GIST Panel',
    markers: [
      { name: 'CD117', required: true },
      { name: 'DOG1', required: true },
      { name: 'CD34', required: true },
      { name: 'SMA', required: false },
      { name: 'Desmin', required: false },
      { name: 'S100', required: false },
    ]
  }
];

// Mock digital slides data
const mockSlides = [
  { id: 1, stain: 'ER', status: 'Strong 3+', thumbnail: '🟤' },
  { id: 2, stain: 'PR', status: 'Moderate 2+', thumbnail: '🟡' },
  { id: 3, stain: 'HER2', status: 'Score 2+', thumbnail: '🟠' },
  { id: 4, stain: 'Ki-67', status: '15%', thumbnail: '🔵' },
];

export default function IHCCaseViewV2() {
  // Report type state
  const [reportType, setReportType] = useState('breast');
  
  // Hormone receptor scoring state
  const [erPercentage, setErPercentage] = useState(85);
  const [erIntensity, setErIntensity] = useState('Strong');
  const [erAllredLocked, setErAllredLocked] = useState(false);
  const [erAllredManual, setErAllredManual] = useState('');
  
  const [prPercentage, setPrPercentage] = useState(45);
  const [prIntensity, setPrIntensity] = useState('Moderate');
  const [prAllredLocked, setPrAllredLocked] = useState(false);
  const [prAllredManual, setPrAllredManual] = useState('');
  
  // Proliferation & HER2 state
  const [ki67, setKi67] = useState(15);
  const [her2Pattern, setHer2Pattern] = useState('Incomplete membrane staining in >10% of tumor cells');
  const [her2Assessment, setHer2Assessment] = useState('Equivocal');
  const [her2Score, setHer2Score] = useState('2+');
  
  // ISH state
  const [cancerNuclei, setCancerNuclei] = useState(50);
  const [avgHER2, setAvgHER2] = useState(5.2);
  const [avgCEP17, setAvgCEP17] = useState(2.1);
  const [ishLocked, setIshLocked] = useState(false);
  
  // Molecular subtype state
  const [molecularSubtype, setMolecularSubtype] = useState('');
  const [subtypeAccepted, setSubtypeAccepted] = useState(false);
  
  // Diagnosis state
  const [diagnosis, setDiagnosis] = useState('Invasive ductal carcinoma, Grade 2, Nottingham score 6/9 (tubules 3, nuclear 2, mitoses 1). Tumor size 1.8 cm.');
  
  // Panel template state
  const [selectedPanel, setSelectedPanel] = useState('breast');
  const [panelMarkerStatus, setPanelMarkerStatus] = useState({});
  
  // Digital pathology state
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSlide, setCompareSlide] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(10);
  
  // Active section for demo
  const [activeSection, setActiveSection] = useState('scoring');

  // Calculate Allred scores
  const erAllredCalculated = useMemo(() => {
    const ps = calculateProportionScore(erPercentage);
    const is = intensityScores[erIntensity] || 0;
    return ps + is;
  }, [erPercentage, erIntensity]);

  const prAllredCalculated = useMemo(() => {
    const ps = calculateProportionScore(prPercentage);
    const is = intensityScores[prIntensity] || 0;
    return ps + is;
  }, [prPercentage, prIntensity]);

  const erAllred = erAllredLocked ? (erAllredManual || erAllredCalculated) : erAllredCalculated;
  const prAllred = prAllredLocked ? (prAllredManual || prAllredCalculated) : prAllredCalculated;

  // Suggest molecular subtype
  const subtypeSuggestion = useMemo(() => {
    return suggestMolecularSubType(erPercentage, prPercentage, her2Assessment, ki67);
  }, [erPercentage, prPercentage, her2Assessment, ki67]);

  // ISH interpretation
  const ishRatio = avgCEP17 > 0 ? (avgHER2 / avgCEP17).toFixed(2) : '';
  const ishInterpretation = useMemo(() => {
    return interpretISH(parseFloat(avgHER2), parseFloat(avgCEP17));
  }, [avgHER2, avgCEP17]);

  // Panel completion
  const currentPanel = panelTemplates.find(p => p.id === selectedPanel);
  const requiredMarkers = currentPanel?.markers.filter(m => m.required) || [];
  const completedMarkers = requiredMarkers.filter(m => panelMarkerStatus[m.name] === 'complete').length;

  // Styles
  const styles = {
    container: {
      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f4f4f4',
      minHeight: '100vh',
    },
    header: {
      background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
      color: 'white',
      padding: '16px 24px',
    },
    breadcrumb: {
      fontSize: '14px',
      opacity: 0.9,
      marginBottom: '8px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      margin: '0 0 8px 0',
    },
    patientInfo: {
      fontSize: '14px',
      opacity: 0.9,
    },
    nav: {
      display: 'flex',
      gap: '4px',
      padding: '16px 24px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e0e0e0',
    },
    navButton: (active) => ({
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      backgroundColor: active ? '#7b1fa2' : 'transparent',
      color: active ? 'white' : '#7b1fa2',
      transition: 'all 0.2s',
    }),
    content: {
      padding: '24px',
    },
    section: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px',
      overflow: 'hidden',
    },
    sectionHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#161616',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    sectionBody: {
      padding: '20px',
    },
    subsection: {
      backgroundColor: '#fafafa',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '16px',
      border: '1px solid #e8e8e8',
    },
    subsectionTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#525252',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px',
      flexWrap: 'wrap',
    },
    label: {
      fontSize: '14px',
      color: '#525252',
      minWidth: '80px',
      fontWeight: 500,
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      fontSize: '14px',
      width: '80px',
      textAlign: 'center',
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      fontSize: '14px',
      backgroundColor: 'white',
      minWidth: '150px',
    },
    allredDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: '#e8f5e9',
      borderRadius: '4px',
      border: '1px solid #c8e6c9',
    },
    allredLocked: {
      backgroundColor: '#fff3e0',
      border: '1px solid #ffe0b2',
    },
    allredValue: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#2e7d32',
    },
    calculationHint: {
      fontSize: '12px',
      color: '#666',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    lockButton: {
      padding: '4px 8px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    suggestionBox: {
      backgroundColor: '#e3f2fd',
      border: '1px solid #90caf9',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px',
    },
    suggestionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
    },
    suggestionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#1565c0',
    },
    suggestionReasoning: {
      fontSize: '13px',
      color: '#555',
      marginBottom: '12px',
    },
    buttonGroup: {
      display: 'flex',
      gap: '8px',
    },
    primaryButton: {
      padding: '8px 16px',
      backgroundColor: '#7b1fa2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
    },
    secondaryButton: {
      padding: '8px 16px',
      backgroundColor: 'white',
      color: '#7b1fa2',
      border: '1px solid #7b1fa2',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
    },
    ishInterpretation: (color) => ({
      backgroundColor: color + '15',
      border: `2px solid ${color}`,
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px',
    }),
    ishStatus: (color) => ({
      fontSize: '18px',
      fontWeight: 600,
      color: color,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }),
    panelGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '12px',
    },
    panelCard: (selected) => ({
      padding: '16px',
      border: selected ? '2px solid #7b1fa2' : '1px solid #e0e0e0',
      borderRadius: '8px',
      cursor: 'pointer',
      backgroundColor: selected ? '#f3e5f5' : 'white',
      transition: 'all 0.2s',
    }),
    markerList: {
      marginTop: '16px',
    },
    markerItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      backgroundColor: '#fafafa',
      borderRadius: '4px',
      marginBottom: '8px',
      border: '1px solid #e8e8e8',
    },
    markerStatus: (status) => ({
      fontSize: '12px',
      padding: '2px 8px',
      borderRadius: '12px',
      backgroundColor: status === 'complete' ? '#e8f5e9' : '#fff3e0',
      color: status === 'complete' ? '#2e7d32' : '#f57c00',
    }),
    progressBar: {
      height: '8px',
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '12px',
    },
    progressFill: (percent) => ({
      height: '100%',
      width: `${percent}%`,
      backgroundColor: percent === 100 ? '#4caf50' : '#7b1fa2',
      transition: 'width 0.3s',
    }),
    slideGrid: {
      display: 'flex',
      gap: '12px',
      overflowX: 'auto',
      padding: '8px 0',
    },
    slideThumb: (selected) => ({
      width: '100px',
      height: '100px',
      border: selected ? '3px solid #7b1fa2' : '2px solid #e0e0e0',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      backgroundColor: selected ? '#f3e5f5' : 'white',
      flexShrink: 0,
    }),
    slideEmoji: {
      fontSize: '32px',
      marginBottom: '4px',
    },
    slideName: {
      fontSize: '12px',
      fontWeight: 500,
    },
    viewer: {
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '16px',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
    },
    viewerControls: {
      display: 'flex',
      gap: '8px',
      marginTop: '16px',
    },
    viewerButton: {
      padding: '8px 12px',
      backgroundColor: '#333',
      color: 'white',
      border: '1px solid #555',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
    },
    comparisonView: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginTop: '16px',
    },
    comparisonPane: {
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '16px',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
    },
    footer: {
      position: 'sticky',
      bottom: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #e0e0e0',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
    },
    badge: (color) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: color + '20',
      color: color,
    }),
    warningBox: {
      backgroundColor: '#fff8e1',
      border: '1px solid #ffcc80',
      borderRadius: '6px',
      padding: '12px',
      marginTop: '12px',
      fontSize: '13px',
      color: '#e65100',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    },
    ki67Hint: (isLow) => ({
      fontSize: '12px',
      color: isLow ? '#2e7d32' : '#d32f2f',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px',
    }),
  };

  const renderScoringSection = () => (
    <>
      {/* Report Type Selector */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📋 Report Configuration</h3>
        </div>
        <div style={styles.sectionBody}>
          <div style={styles.row}>
            <span style={styles.label}>Report Type:</span>
            <select 
              style={styles.select} 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="breast">Breast Cancer Hormone Receptor Status Report</option>
              <option value="ish">Dual In Situ Hybridisation (ISH) Report</option>
              <option value="generic">Generic IHC Report</option>
            </select>
          </div>
        </div>
      </div>

      {reportType === 'breast' && (
        <>
          {/* Hormone Receptor Scoring with Auto-Allred */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <span style={styles.badge('#7b1fa2')}>AUTO-CALC</span>
                Hormone Receptor Scoring
              </h3>
            </div>
            <div style={styles.sectionBody}>
              {/* ER Row */}
              <div style={styles.subsection}>
                <div style={styles.subsectionTitle}>Estrogen Receptor (ER)</div>
                <div style={styles.row}>
                  <span style={styles.label}>ER %</span>
                  <input 
                    type="number" 
                    style={styles.input}
                    value={erPercentage}
                    onChange={(e) => setErPercentage(e.target.value)}
                    min="0"
                    max="100"
                  />
                  <span style={{color: '#666'}}>nuclear staining</span>
                  
                  <span style={styles.label}>Intensity</span>
                  <select 
                    style={styles.select}
                    value={erIntensity}
                    onChange={(e) => setErIntensity(e.target.value)}
                  >
                    <option>Negative</option>
                    <option>Weak</option>
                    <option>Moderate</option>
                    <option>Strong</option>
                  </select>
                </div>
                
                <div style={styles.row}>
                  <span style={styles.label}>Allred Score</span>
                  <div style={{...styles.allredDisplay, ...(erAllredLocked ? styles.allredLocked : {})}}>
                    {erAllredLocked ? (
                      <input
                        type="number"
                        style={{...styles.input, width: '50px', border: 'none', backgroundColor: 'transparent'}}
                        value={erAllredManual}
                        onChange={(e) => setErAllredManual(e.target.value)}
                        min="0"
                        max="8"
                      />
                    ) : (
                      <span style={styles.allredValue}>{erAllred}</span>
                    )}
                    <span style={{color: '#666'}}>/ 8</span>
                    {!erAllredLocked && <span style={{color: '#4caf50', fontSize: '12px'}}>✓ Auto-calculated</span>}
                    {erAllredLocked && <span style={{color: '#f57c00', fontSize: '12px'}}>🔒 Locked</span>}
                  </div>
                  <button 
                    style={styles.lockButton}
                    onClick={() => {
                      setErAllredLocked(!erAllredLocked);
                      if (!erAllredLocked) setErAllredManual(erAllredCalculated.toString());
                    }}
                  >
                    {erAllredLocked ? '🔓 Unlock' : '🔒 Lock'}
                  </button>
                </div>
                
                {!erAllredLocked && (
                  <div style={styles.calculationHint}>
                    ℹ️ Proportion: {calculateProportionScore(erPercentage)} ({getProportionLabel(calculateProportionScore(erPercentage))}) + Intensity: {intensityScores[erIntensity]} ({erIntensity}) = {erAllredCalculated}
                  </div>
                )}
              </div>
              
              {/* PR Row */}
              <div style={styles.subsection}>
                <div style={styles.subsectionTitle}>Progesterone Receptor (PR)</div>
                <div style={styles.row}>
                  <span style={styles.label}>PR %</span>
                  <input 
                    type="number" 
                    style={styles.input}
                    value={prPercentage}
                    onChange={(e) => setPrPercentage(e.target.value)}
                    min="0"
                    max="100"
                  />
                  <span style={{color: '#666'}}>nuclear staining</span>
                  
                  <span style={styles.label}>Intensity</span>
                  <select 
                    style={styles.select}
                    value={prIntensity}
                    onChange={(e) => setPrIntensity(e.target.value)}
                  >
                    <option>Negative</option>
                    <option>Weak</option>
                    <option>Moderate</option>
                    <option>Strong</option>
                  </select>
                </div>
                
                <div style={styles.row}>
                  <span style={styles.label}>Allred Score</span>
                  <div style={{...styles.allredDisplay, ...(prAllredLocked ? styles.allredLocked : {})}}>
                    {prAllredLocked ? (
                      <input
                        type="number"
                        style={{...styles.input, width: '50px', border: 'none', backgroundColor: 'transparent'}}
                        value={prAllredManual}
                        onChange={(e) => setPrAllredManual(e.target.value)}
                        min="0"
                        max="8"
                      />
                    ) : (
                      <span style={styles.allredValue}>{prAllred}</span>
                    )}
                    <span style={{color: '#666'}}>/ 8</span>
                    {!prAllredLocked && <span style={{color: '#4caf50', fontSize: '12px'}}>✓ Auto-calculated</span>}
                    {prAllredLocked && <span style={{color: '#f57c00', fontSize: '12px'}}>🔒 Locked</span>}
                  </div>
                  <button 
                    style={styles.lockButton}
                    onClick={() => {
                      setPrAllredLocked(!prAllredLocked);
                      if (!prAllredLocked) setPrAllredManual(prAllredCalculated.toString());
                    }}
                  >
                    {prAllredLocked ? '🔓 Unlock' : '🔒 Lock'}
                  </button>
                </div>
                
                {!prAllredLocked && (
                  <div style={styles.calculationHint}>
                    ℹ️ Proportion: {calculateProportionScore(prPercentage)} ({getProportionLabel(calculateProportionScore(prPercentage))}) + Intensity: {intensityScores[prIntensity]} ({prIntensity}) = {prAllredCalculated}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Proliferation & HER2 */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Proliferation & HER2</h3>
            </div>
            <div style={styles.sectionBody}>
              <div style={styles.row}>
                <span style={styles.label}>Ki-67 (MiB 1)</span>
                <input 
                  type="number" 
                  style={styles.input}
                  value={ki67}
                  onChange={(e) => setKi67(e.target.value)}
                  min="0"
                  max="100"
                />
                <span style={{color: '#666'}}>% of tumor cells positive</span>
              </div>
              <div style={styles.ki67Hint(ki67 < 20)}>
                {ki67 < 20 ? '✓ Low proliferation (<20%)' : '⚠️ High proliferation (≥20%)'}
              </div>
              
              <div style={{marginTop: '20px'}}>
                <div style={styles.row}>
                  <span style={styles.label}>CerbB2/HER2 staining pattern:</span>
                </div>
                <textarea
                  style={{...styles.input, width: '100%', height: '60px', textAlign: 'left'}}
                  value={her2Pattern}
                  onChange={(e) => setHer2Pattern(e.target.value)}
                />
              </div>
              
              <div style={{...styles.row, marginTop: '16px'}}>
                <span style={styles.label}>HER2 Assessment</span>
                <select 
                  style={styles.select}
                  value={her2Assessment}
                  onChange={(e) => setHer2Assessment(e.target.value)}
                >
                  <option>Negative</option>
                  <option>Equivocal</option>
                  <option>Positive</option>
                </select>
                
                <span style={styles.label}>Score</span>
                <select 
                  style={styles.select}
                  value={her2Score}
                  onChange={(e) => setHer2Score(e.target.value)}
                >
                  <option>0</option>
                  <option>1+</option>
                  <option>2+</option>
                  <option>3+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Molecular SubType Suggestion */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <span style={styles.badge('#1565c0')}>AI SUGGEST</span>
                Diagnosis & Molecular SubType
              </h3>
            </div>
            <div style={styles.sectionBody}>
              <div style={{marginBottom: '16px'}}>
                <label style={{...styles.label, display: 'block', marginBottom: '8px'}}>Histological Diagnosis:</label>
                <textarea
                  style={{...styles.input, width: '100%', height: '80px', textAlign: 'left'}}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
              
              {subtypeSuggestion && !subtypeAccepted && (
                <div style={styles.suggestionBox}>
                  <div style={styles.suggestionHeader}>
                    <span style={{fontSize: '20px'}}>💡</span>
                    <span style={styles.suggestionTitle}>Suggested: {subtypeSuggestion.subtype}</span>
                    <span style={styles.badge('#1565c0')}>{subtypeSuggestion.confidence} Confidence</span>
                  </div>
                  <div style={styles.suggestionReasoning}>
                    Based on: {subtypeSuggestion.reasoning}
                  </div>
                  <div style={styles.buttonGroup}>
                    <button 
                      style={styles.primaryButton}
                      onClick={() => {
                        setMolecularSubtype(subtypeSuggestion.subtype);
                        setSubtypeAccepted(true);
                      }}
                    >
                      ✓ Accept Suggestion
                    </button>
                    <select 
                      style={styles.select}
                      value={molecularSubtype}
                      onChange={(e) => {
                        setMolecularSubtype(e.target.value);
                        setSubtypeAccepted(true);
                      }}
                    >
                      <option value="">Choose Different...</option>
                      <option>Luminal A</option>
                      <option>Luminal B (HER2-negative)</option>
                      <option>Luminal B (HER2-positive)</option>
                      <option>HER2-enriched</option>
                      <option>Triple-negative / Basal-like</option>
                    </select>
                  </div>
                </div>
              )}
              
              {subtypeAccepted && (
                <div style={{...styles.row, marginTop: '16px'}}>
                  <span style={styles.label}>Molecular SubType:</span>
                  <select 
                    style={styles.select}
                    value={molecularSubtype}
                    onChange={(e) => setMolecularSubtype(e.target.value)}
                  >
                    <option>Luminal A</option>
                    <option>Luminal B (HER2-negative)</option>
                    <option>Luminal B (HER2-positive)</option>
                    <option>HER2-enriched</option>
                    <option>Triple-negative / Basal-like</option>
                  </select>
                  <span style={styles.badge('#4caf50')}>✓ Selected</span>
                </div>
              )}
              
              <div style={styles.warningBox}>
                <span>⚠️</span>
                <span>Final molecular subtype classification requires clinical correlation and should be confirmed by the reporting pathologist.</span>
              </div>
            </div>
          </div>
        </>
      )}

      {reportType === 'ish' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.badge('#7b1fa2')}>AUTO-INTERPRET</span>
              ISH Scoring
            </h3>
          </div>
          <div style={styles.sectionBody}>
            <div style={styles.subsection}>
              <div style={styles.row}>
                <span style={styles.label}>Number of Cancer nuclei counted:</span>
                <input 
                  type="number" 
                  style={styles.input}
                  value={cancerNuclei}
                  onChange={(e) => setCancerNuclei(e.target.value)}
                />
              </div>
              
              <div style={styles.row}>
                <span style={styles.label}>Average HER2 signals per nucleus:</span>
                <input 
                  type="number" 
                  step="0.1"
                  style={styles.input}
                  value={avgHER2}
                  onChange={(e) => setAvgHER2(e.target.value)}
                />
              </div>
              
              <div style={styles.row}>
                <span style={styles.label}>Average CEP17 signals per nucleus:</span>
                <input 
                  type="number" 
                  step="0.1"
                  style={styles.input}
                  value={avgCEP17}
                  onChange={(e) => setAvgCEP17(e.target.value)}
                />
              </div>
              
              <div style={styles.row}>
                <span style={styles.label}>HER2/CEP17 Ratio:</span>
                <div style={styles.allredDisplay}>
                  <span style={styles.allredValue}>{ishRatio}</span>
                  <span style={{color: '#4caf50', fontSize: '12px'}}>✓ Auto-calculated</span>
                </div>
              </div>
            </div>
            
            {ishInterpretation && (
              <div style={styles.ishInterpretation(ishInterpretation.color)}>
                <div style={styles.ishStatus(ishInterpretation.color)}>
                  🔬 HER2 Status: {ishInterpretation.status.toUpperCase()} (Group {ishInterpretation.group})
                </div>
                <div style={{marginTop: '12px', fontSize: '14px', color: '#333'}}>
                  <strong>Criteria:</strong> Ratio {parseFloat(ishRatio) >= 2.0 ? '≥' : '<'} 2.0 ({ishRatio}) 
                  {' AND '} Avg HER2 {avgHER2 >= 6.0 ? '≥6.0' : avgHER2 >= 4.0 ? '≥4.0 and <6.0' : '<4.0'} ({avgHER2})
                </div>
                <div style={{marginTop: '8px', fontSize: '14px'}}>
                  <strong>→ ASCO/CAP 2018 Group {ishInterpretation.group}:</strong> {ishInterpretation.action}
                </div>
                
                {ishInterpretation.status === 'Positive' && (
                  <div style={{marginTop: '12px', color: '#2e7d32', fontWeight: 500}}>
                    ✓ Patient eligible for HER2-targeted therapy
                  </div>
                )}
                {ishInterpretation.status === 'Equivocal' && (
                  <div style={{marginTop: '12px', color: '#f57c00', fontWeight: 500}}>
                    ⚠️ Recommend retesting with an alternative HER2 assay
                  </div>
                )}
                
                <div style={{...styles.buttonGroup, marginTop: '16px'}}>
                  <button style={styles.primaryButton}>✓ Accept Interpretation</button>
                  <button style={styles.secondaryButton}>Override</button>
                </div>
              </div>
            )}
            
            <div style={{...styles.row, marginTop: '20px'}}>
              <span style={styles.label}>IHC (CerbB2) Score:</span>
              <select style={styles.select}>
                <option>0</option>
                <option>1+</option>
                <option>2+</option>
                <option>3+</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderPanelSection = () => (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>📋 Panel Templates</h3>
      </div>
      <div style={styles.sectionBody}>
        <div style={{marginBottom: '20px'}}>
          <label style={{...styles.label, display: 'block', marginBottom: '12px'}}>Select Panel Template:</label>
          <div style={styles.panelGrid}>
            {panelTemplates.map(panel => (
              <div 
                key={panel.id}
                style={styles.panelCard(selectedPanel === panel.id)}
                onClick={() => setSelectedPanel(panel.id)}
              >
                <div style={{fontWeight: 600, marginBottom: '8px'}}>{panel.name}</div>
                <div style={{fontSize: '12px', color: '#666'}}>
                  {panel.markers.filter(m => m.required).length} required markers
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {currentPanel && (
          <div style={styles.subsection}>
            <div style={styles.subsectionTitle}>
              📋 {currentPanel.name}
            </div>
            
            <div style={{marginBottom: '12px', fontWeight: 500}}>Required Markers:</div>
            <div style={styles.markerList}>
              {currentPanel.markers.filter(m => m.required).map(marker => (
                <div key={marker.name} style={styles.markerItem}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <input 
                      type="checkbox" 
                      checked={panelMarkerStatus[marker.name] === 'complete'}
                      onChange={(e) => setPanelMarkerStatus({
                        ...panelMarkerStatus,
                        [marker.name]: e.target.checked ? 'complete' : 'pending'
                      })}
                    />
                    <span>{marker.name}</span>
                  </div>
                  <span style={styles.markerStatus(panelMarkerStatus[marker.name] || 'pending')}>
                    {panelMarkerStatus[marker.name] === 'complete' ? 'Complete' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{marginTop: '20px', marginBottom: '12px', fontWeight: 500}}>Optional Markers:</div>
            <div style={styles.markerList}>
              {currentPanel.markers.filter(m => !m.required).map(marker => (
                <div key={marker.name} style={styles.markerItem}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <input 
                      type="checkbox"
                      checked={panelMarkerStatus[marker.name] === 'complete'}
                      onChange={(e) => setPanelMarkerStatus({
                        ...panelMarkerStatus,
                        [marker.name]: e.target.checked ? 'complete' : 'pending'
                      })}
                    />
                    <span style={{color: '#666'}}>{marker.name}</span>
                  </div>
                  <span style={styles.markerStatus(panelMarkerStatus[marker.name] || 'pending')}>
                    {panelMarkerStatus[marker.name] === 'complete' ? 'Complete' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{marginTop: '20px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                <span style={{fontSize: '13px', fontWeight: 500}}>Panel Completion</span>
                <span style={{fontSize: '13px', color: '#666'}}>
                  {completedMarkers}/{requiredMarkers.length} required markers
                </span>
              </div>
              <div style={styles.progressBar}>
                <div style={styles.progressFill(requiredMarkers.length > 0 ? (completedMarkers / requiredMarkers.length) * 100 : 0)} />
              </div>
            </div>
            
            <div style={{...styles.buttonGroup, marginTop: '20px'}}>
              <button style={styles.secondaryButton}>+ Add Additional Marker</button>
              <button style={styles.secondaryButton}>Save as Custom Template</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDigitalPathologySection = () => (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>🔬 Digital Slides</h3>
        <span style={{fontSize: '14px', color: '#666'}}>{mockSlides.length} slides available</span>
      </div>
      <div style={styles.sectionBody}>
        <div style={styles.slideGrid}>
          {mockSlides.map(slide => (
            <div 
              key={slide.id}
              style={styles.slideThumb(selectedSlide === slide.id)}
              onClick={() => setSelectedSlide(slide.id)}
            >
              <span style={styles.slideEmoji}>{slide.thumbnail}</span>
              <span style={styles.slideName}>{slide.stain}</span>
              <span style={{fontSize: '10px', color: '#666'}}>{slide.status}</span>
            </div>
          ))}
        </div>
        
        {selectedSlide && !compareMode && (
          <div style={styles.viewer}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>
              {mockSlides.find(s => s.id === selectedSlide)?.thumbnail}
            </div>
            <div style={{fontSize: '18px', fontWeight: 500}}>
              {mockSlides.find(s => s.id === selectedSlide)?.stain} Stain
            </div>
            <div style={{fontSize: '14px', color: '#aaa', marginTop: '8px'}}>
              Zoom: {zoomLevel}x
            </div>
            <div style={{fontSize: '12px', color: '#888', marginTop: '16px'}}>
              [Whole Slide Image Viewer]
            </div>
            <div style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
              Pan and zoom to navigate • Click and drag to move
            </div>
            <div style={styles.viewerControls}>
              <button style={styles.viewerButton} onClick={() => setZoomLevel(Math.min(40, zoomLevel + 5))}>🔍+ Zoom In</button>
              <button style={styles.viewerButton} onClick={() => setZoomLevel(Math.max(1, zoomLevel - 5))}>🔍- Zoom Out</button>
              <button style={styles.viewerButton} onClick={() => setZoomLevel(10)}>↻ Reset</button>
              <button style={styles.viewerButton}>📐 Measure</button>
              <button style={styles.viewerButton}>✏️ Annotate</button>
              <button style={styles.viewerButton} onClick={() => setCompareMode(true)}>⬜ Compare</button>
            </div>
          </div>
        )}
        
        {compareMode && (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}>
              <span style={{fontWeight: 500}}>Side-by-Side Comparison</span>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <input type="checkbox" id="sync" defaultChecked />
                <label htmlFor="sync" style={{fontSize: '13px'}}>🔗 Synchronized navigation</label>
                <button 
                  style={{...styles.viewerButton, marginLeft: '16px'}}
                  onClick={() => setCompareMode(false)}
                >
                  ✕ Exit Compare
                </button>
              </div>
            </div>
            <div style={styles.comparisonView}>
              <div>
                <select style={{...styles.select, width: '100%', marginBottom: '8px'}}>
                  {mockSlides.map(s => (
                    <option key={s.id} value={s.id}>{s.stain}</option>
                  ))}
                </select>
                <div style={styles.comparisonPane}>
                  <span style={{fontSize: '36px'}}>🟤</span>
                  <span style={{marginTop: '8px'}}>ER (Strong 3+)</span>
                </div>
              </div>
              <div>
                <select style={{...styles.select, width: '100%', marginBottom: '8px'}} defaultValue="3">
                  {mockSlides.map(s => (
                    <option key={s.id} value={s.id}>{s.stain}</option>
                  ))}
                </select>
                <div style={styles.comparisonPane}>
                  <span style={{fontSize: '36px'}}>🟠</span>
                  <span style={{marginTop: '8px'}}>HER2 (Score 2+)</span>
                </div>
              </div>
            </div>
          </>
        )}
        
        <div style={{...styles.buttonGroup, marginTop: '16px', justifyContent: 'flex-end'}}>
          <button style={styles.secondaryButton}>⛶ Expand to Full Screen</button>
          <button style={styles.secondaryButton}>↗ Open in External Viewer</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.breadcrumb}>Home / Immunohistochemistry / 24IHC000015</div>
        <h1 style={styles.title}>Immunohistochemistry Case - 24IHC000015</h1>
        <div style={styles.patientInfo}>
          Patient: DOE, JANE | DOB: 1965-07-22 | F | Status: IN_PROGRESS
        </div>
      </div>
      
      {/* Navigation */}
      <div style={styles.nav}>
        <button 
          style={styles.navButton(activeSection === 'scoring')}
          onClick={() => setActiveSection('scoring')}
        >
          📊 Report Scoring
        </button>
        <button 
          style={styles.navButton(activeSection === 'panels')}
          onClick={() => setActiveSection('panels')}
        >
          📋 Panel Templates
        </button>
        <button 
          style={styles.navButton(activeSection === 'slides')}
          onClick={() => setActiveSection('slides')}
        >
          🔬 Digital Slides
        </button>
      </div>
      
      {/* Content */}
      <div style={styles.content}>
        {activeSection === 'scoring' && renderScoringSection()}
        {activeSection === 'panels' && renderPanelSection()}
        {activeSection === 'slides' && renderDigitalPathologySection()}
      </div>
      
      {/* Sticky Footer */}
      <div style={styles.footer}>
        <button style={styles.secondaryButton}>Discard Changes</button>
        <button style={styles.secondaryButton}>Save Progress</button>
        <button style={styles.primaryButton}>Generate Report</button>
      </div>
    </div>
  );
}
