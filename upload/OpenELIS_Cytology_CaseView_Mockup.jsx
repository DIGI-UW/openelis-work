import React, { useState } from 'react';

// OpenELIS Cytology Case View Redesign Mockup
// Wizard-style Bethesda System Algorithm Interface

const CytologyCaseView = () => {
  const [currentStep, setCurrentStep] = useState(3); // Demo showing step 3
  
  const [expandedSections, setExpandedSections] = useState({
    caseInfo: false,
  });

  const [caseData] = useState({
    labNumber: '24CYT000042',
    requestDate: '2024-10-15',
    patientName: 'SMITH, MARY',
    dob: '1985-06-15',
    gender: 'F',
    age: 39,
    unitNumber: 'UN-2024-2847',
    provider: 'Dr. Jennifer Williams',
    specimen: 'Cervical/vaginal smear',
    specimenType: 'ThinPrep',
    clinicalHistory: 'Routine Pap smear. LMP 10/01/2024. No symptoms.',
    previousPap: 'NILM (2021)',
    status: 'SCREENING',
    assignedScreener: 'Sarah Johnson, CT(ASCP)',
  });

  // Algorithm state
  const [adequacy, setAdequacy] = useState('satisfactory');
  const [adequacyLimitations, setAdequacyLimitations] = useState([]);
  const [unsatisfactoryReason, setUnsatisfactoryReason] = useState('');
  
  const [generalCategory, setGeneralCategory] = useState('epithelial');
  
  const [organisms, setOrganisms] = useState(['none']);
  const [nonNeoplasticFindings, setNonNeoplasticFindings] = useState(['none']);
  
  const [abnormalityType, setAbnormalityType] = useState('squamous');
  const [squamousAbnormality, setSquamousAbnormality] = useState('hsil');
  const [glandularAbnormality, setGlandularAbnormality] = useState('');
  
  const [otherFindings, setOtherFindings] = useState('');
  
  const [hpvTested, setHpvTested] = useState('yes');
  const [hpvResult, setHpvResult] = useState('positive');
  const [hpv16, setHpv16] = useState('positive');
  const [hpv18, setHpv18] = useState('negative');
  const [hpvOther, setHpvOther] = useState('negative');
  const [hpvMethod, setHpvMethod] = useState('cobas');
  
  const [hormonal, setHormonal] = useState('not_evaluated');
  const [additionalComments, setAdditionalComments] = useState('');
  const [recommendationOverride, setRecommendationOverride] = useState('');
  const [showSystemSuggestion, setShowSystemSuggestion] = useState(true);
  const [copied, setCopied] = useState(false);

  const steps = [
    { id: 1, label: 'Specimen Adequacy', short: 'Adequacy' },
    { id: 2, label: 'General Category', short: 'Category' },
    { id: 3, label: 'Findings', short: 'Findings' },
    { id: 4, label: 'HPV Testing', short: 'HPV' },
    { id: 5, label: 'Review & Report', short: 'Review' },
  ];

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const toggleCheckbox = (value, array, setArray) => {
    if (value === 'none') {
      setArray(['none']);
    } else {
      const newArray = array.filter(v => v !== 'none');
      if (newArray.includes(value)) {
        const result = newArray.filter(v => v !== value);
        setArray(result.length === 0 ? ['none'] : result);
      } else {
        setArray([...newArray, value]);
      }
    }
  };

  const getRecommendation = () => {
    // Simplified recommendation engine
    if (adequacy === 'unsatisfactory') {
      return { code: 'REPEAT', text: 'Repeat Pap smear', risk: 'low' };
    }
    
    if (generalCategory === 'nilm') {
      if (hpvResult === 'negative') {
        return { code: 'ROUTINE_5YR', text: 'Routine screening in 5 years (co-test) or 3 years (cytology alone)', risk: 'low' };
      }
      if (hpv16 === 'positive' || hpv18 === 'positive') {
        return { code: 'COLPO', text: 'Colposcopy recommended', risk: 'intermediate' };
      }
      return { code: 'REPEAT_1YR', text: 'Repeat co-test in 1 year', risk: 'low' };
    }
    
    if (squamousAbnormality === 'asc_us') {
      if (hpvResult === 'negative') {
        return { code: 'REPEAT_3YR', text: 'Repeat co-test in 3 years', risk: 'low' };
      }
      return { code: 'COLPO', text: 'Colposcopy recommended', risk: 'intermediate' };
    }
    
    if (squamousAbnormality === 'asc_h' || squamousAbnormality === 'lsil') {
      return { code: 'COLPO', text: 'Colposcopy recommended', risk: 'intermediate' };
    }
    
    if (squamousAbnormality === 'hsil' || squamousAbnormality === 'hsil_suspicious') {
      return { code: 'COLPO_IMMEDIATE', text: 'Immediate colposcopy or expedited treatment (excision) acceptable for non-pregnant patients ≥25 years', risk: 'high' };
    }
    
    if (squamousAbnormality === 'scc') {
      return { code: 'ONCOLOGY', text: 'Refer to gynecologic oncology', risk: 'malignant' };
    }
    
    if (glandularAbnormality) {
      if (glandularAbnormality.includes('adeno')) {
        return { code: 'ONCOLOGY', text: 'Refer to gynecologic oncology', risk: 'malignant' };
      }
      if (glandularAbnormality === 'ais') {
        return { code: 'EXCISION', text: 'Excisional procedure recommended', risk: 'high' };
      }
      return { code: 'COLPO_EMC', text: 'Colposcopy with endocervical sampling; endometrial sampling if ≥35 or abnormal bleeding', risk: 'high' };
    }
    
    return { code: 'COLPO', text: 'Colposcopy recommended', risk: 'intermediate' };
  };

  const recommendation = getRecommendation();

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return { bg: '#d4edda', color: '#198038', border: '#198038' };
      case 'intermediate': return { bg: '#fff3cd', color: '#856404', border: '#ff8f00' };
      case 'high': return { bg: '#f8d7da', color: '#c82333', border: '#da1e28' };
      case 'malignant': return { bg: '#721c24', color: 'white', border: '#721c24' };
      default: return { bg: '#e0e0e0', color: '#525252', border: '#525252' };
    }
  };

  const riskColors = getRiskColor(recommendation.risk);

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
          <div style={{ fontSize: '24px', cursor: 'pointer', color: 'white' }}>≡</div>
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
              Liberia Laboratory Information System
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
          <span style={{ cursor: 'pointer' }}>Cytology</span>
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
              Cytology Case - {caseData.labNumber}
            </h1>
            <div style={{ display: 'flex', gap: '24px', color: '#525252', fontSize: '14px', flexWrap: 'wrap' }}>
              <span><strong>Patient:</strong> {caseData.patientName}</span>
              <span><strong>DOB:</strong> {caseData.dob}</span>
              <span><strong>Age:</strong> {caseData.age}</span>
              <span><strong>Gender:</strong> {caseData.gender}</span>
              <span style={{
                background: '#e8f4fd',
                padding: '2px 12px',
                borderRadius: '12px',
                fontWeight: 500,
                color: '#0f62fe',
              }}>
                {caseData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '24px',
        paddingBottom: '100px',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Case Information - Collapsible */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e0e0e0',
          }}>
            <div 
              onClick={() => setExpandedSections({...expandedSections, caseInfo: !expandedSections.caseInfo})}
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
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px',
                }}>
                  {[
                    ['Lab Number', caseData.labNumber],
                    ['Request Date', caseData.requestDate],
                    ['Provider', caseData.provider],
                    ['Specimen', caseData.specimen],
                    ['Specimen Type', caseData.specimenType],
                    ['Screener', caseData.assignedScreener],
                  ].map(([label, value], i) => (
                    <div key={i}>
                      <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '14px', color: '#161616' }}>{value || '—'}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>Clinical History</div>
                  <div style={{ fontSize: '14px', color: '#161616', background: '#f4f4f4', padding: '12px', borderRadius: '4px' }}>
                    {caseData.clinicalHistory}
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#525252', marginBottom: '4px' }}>Previous Pap Result</div>
                  <div style={{ fontSize: '14px', color: '#161616' }}>{caseData.previousPap}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bethesda Classification Wizard */}
        <div style={{
          background: 'white',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0',
          borderLeft: '4px solid #e91e63',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e0e0e0',
            background: '#fce4ec',
          }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#c2185b' }}>
              Bethesda Classification
            </h2>
          </div>

          {/* Progress Indicator */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              {/* Progress Line */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '40px',
                right: '40px',
                height: '2px',
                background: '#e0e0e0',
                zIndex: 0,
              }} />
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '40px',
                width: `${((currentStep - 1) / (steps.length - 1)) * (100 - 8)}%`,
                height: '2px',
                background: '#e91e63',
                zIndex: 1,
              }} />
              
              {steps.map((step) => {
                const status = getStepStatus(step.id);
                return (
                  <div
                    key={step.id}
                    onClick={() => status === 'completed' && setCurrentStep(step.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: status === 'completed' ? 'pointer' : 'default',
                      zIndex: 2,
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: status === 'completed' ? '#4caf50' : 
                                  status === 'current' ? '#e91e63' : 'white',
                      border: status === 'upcoming' ? '2px solid #e0e0e0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: status === 'upcoming' ? '#a8a8a8' : 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}>
                      {status === 'completed' ? '✓' : step.id}
                    </div>
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: status === 'upcoming' ? '#a8a8a8' : '#161616',
                      fontWeight: status === 'current' ? 600 : 400,
                      textAlign: 'center',
                    }}>
                      {step.short}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div style={{ padding: '24px' }}>
            {/* Step 1: Specimen Adequacy */}
            {currentStep === 1 && (
              <div>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 500 }}>
                  Step 1: Specimen Adequacy
                </h3>
                <p style={{ color: '#525252', marginBottom: '20px' }}>
                  Is the specimen adequate for evaluation?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    border: adequacy === 'satisfactory' ? '2px solid #e91e63' : '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: adequacy === 'satisfactory' ? '#fce4ec' : 'white',
                  }}>
                    <input
                      type="radio"
                      name="adequacy"
                      checked={adequacy === 'satisfactory'}
                      onChange={() => setAdequacy('satisfactory')}
                      style={{ marginRight: '12px', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>Satisfactory for evaluation</div>
                      <div style={{ fontSize: '13px', color: '#525252', marginTop: '4px' }}>
                        Specimen meets criteria for adequacy
                      </div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    border: adequacy === 'satisfactory_limited' ? '2px solid #e91e63' : '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: adequacy === 'satisfactory_limited' ? '#fce4ec' : 'white',
                  }}>
                    <input
                      type="radio"
                      name="adequacy"
                      checked={adequacy === 'satisfactory_limited'}
                      onChange={() => setAdequacy('satisfactory_limited')}
                      style={{ marginRight: '12px', marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>Satisfactory for evaluation, but limited by:</div>
                      {adequacy === 'satisfactory_limited' && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {['Partially obscuring blood', 'Partially obscuring inflammation', 'Scant cellularity', 'Absent transformation zone/endocervical component'].map(opt => (
                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                              <input
                                type="checkbox"
                                checked={adequacyLimitations.includes(opt)}
                                onChange={() => toggleCheckbox(opt, adequacyLimitations, setAdequacyLimitations)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    border: adequacy === 'unsatisfactory' ? '2px solid #da1e28' : '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: adequacy === 'unsatisfactory' ? '#fff0f0' : 'white',
                  }}>
                    <input
                      type="radio"
                      name="adequacy"
                      checked={adequacy === 'unsatisfactory'}
                      onChange={() => setAdequacy('unsatisfactory')}
                      style={{ marginRight: '12px', marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: '#da1e28' }}>Unsatisfactory for evaluation</div>
                      {adequacy === 'unsatisfactory' && (
                        <div style={{ marginTop: '12px' }}>
                          <select
                            value={unsatisfactoryReason}
                            onChange={(e) => setUnsatisfactoryReason(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                            }}
                          >
                            <option value="">Select reason...</option>
                            <option value="scant">Scant squamous cellularity</option>
                            <option value="blood">Obscuring blood (&gt;75%)</option>
                            <option value="inflammation">Obscuring inflammation (&gt;75%)</option>
                            <option value="unlabeled">Unlabeled specimen</option>
                            <option value="broken">Slide broken/unreadable</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: General Category */}
            {currentStep === 2 && (
              <div>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 500 }}>
                  Step 2: General Categorization
                </h3>
                <p style={{ color: '#525252', marginBottom: '20px' }}>
                  What is the general interpretation?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    border: generalCategory === 'nilm' ? '2px solid #4caf50' : '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: generalCategory === 'nilm' ? '#e8f5e9' : 'white',
                  }}>
                    <input
                      type="radio"
                      name="category"
                      checked={generalCategory === 'nilm'}
                      onChange={() => setGeneralCategory('nilm')}
                      style={{ marginRight: '12px', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#198038' }}>
                        Negative for Intraepithelial Lesion or Malignancy (NILM)
                      </div>
                      <div style={{ fontSize: '13px', color: '#525252', marginTop: '4px' }}>
                        No evidence of neoplasia
                      </div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    border: generalCategory === 'epithelial' ? '2px solid #e91e63' : '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: generalCategory === 'epithelial' ? '#fce4ec' : 'white',
                  }}>
                    <input
                      type="radio"
                      name="category"
                      checked={generalCategory === 'epithelial'}
                      onChange={() => setGeneralCategory('epithelial')}
                      style={{ marginRight: '12px', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#c2185b' }}>
                        Epithelial Cell Abnormality
                      </div>
                      <div style={{ fontSize: '13px', color: '#525252', marginTop: '4px' }}>
                        Squamous or glandular cell abnormality identified
                      </div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    border: generalCategory === 'other' ? '2px solid #ff9800' : '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: generalCategory === 'other' ? '#fff3e0' : 'white',
                  }}>
                    <input
                      type="radio"
                      name="category"
                      checked={generalCategory === 'other'}
                      onChange={() => setGeneralCategory('other')}
                      style={{ marginRight: '12px', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#e65100' }}>Other</div>
                      <div style={{ fontSize: '13px', color: '#525252', marginTop: '4px' }}>
                        Endometrial cells in a woman ≥45 years of age
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Findings */}
            {currentStep === 3 && generalCategory === 'epithelial' && (
              <div>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 500 }}>
                  Step 3: Epithelial Cell Abnormality
                </h3>
                <p style={{ color: '#525252', marginBottom: '20px' }}>
                  What type of epithelial abnormality?
                </p>

                {/* Abnormality Type */}
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  marginBottom: '24px',
                  background: '#f4f4f4',
                  padding: '12px',
                  borderRadius: '4px',
                }}>
                  {[
                    { value: 'squamous', label: 'Squamous Cell' },
                    { value: 'glandular', label: 'Glandular Cell' },
                    { value: 'both', label: 'Both' },
                  ].map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="abnormalityType"
                        checked={abnormalityType === opt.value}
                        onChange={() => setAbnormalityType(opt.value)}
                      />
                      <span style={{ fontWeight: abnormalityType === opt.value ? 600 : 400 }}>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Squamous Abnormalities */}
                {(abnormalityType === 'squamous' || abnormalityType === 'both') && (
                  <div style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '20px',
                    marginBottom: '16px',
                    background: '#fafafa',
                  }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#c2185b' }}>
                      Squamous Cell Abnormalities
                    </h4>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#525252', marginBottom: '8px', fontWeight: 500 }}>
                        Atypical Squamous Cells:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="squamous"
                            checked={squamousAbnormality === 'asc_us'}
                            onChange={() => setSquamousAbnormality('asc_us')}
                          />
                          <span style={{
                            background: '#fff3cd',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}>ASC-US</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>of undetermined significance</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="squamous"
                            checked={squamousAbnormality === 'asc_h'}
                            onChange={() => setSquamousAbnormality('asc_h')}
                          />
                          <span style={{
                            background: '#ffe0b2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}>ASC-H</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>cannot exclude HSIL</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#525252', marginBottom: '8px', fontWeight: 500 }}>
                        Squamous Intraepithelial Lesion:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="squamous"
                            checked={squamousAbnormality === 'lsil'}
                            onChange={() => setSquamousAbnormality('lsil')}
                          />
                          <span style={{
                            background: '#fff3cd',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}>LSIL</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Low-grade</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="squamous"
                            checked={squamousAbnormality === 'hsil'}
                            onChange={() => setSquamousAbnormality('hsil')}
                          />
                          <span style={{
                            background: '#f8d7da',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#c82333',
                            fontWeight: 600,
                          }}>HSIL</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>High-grade</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="squamous"
                            checked={squamousAbnormality === 'hsil_suspicious'}
                            onChange={() => setSquamousAbnormality('hsil_suspicious')}
                          />
                          <span style={{
                            background: '#f8d7da',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#c82333',
                          }}>HSIL</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>with features suspicious for invasion</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '13px', color: '#525252', marginBottom: '8px', fontWeight: 500 }}>
                        Carcinoma:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="squamous"
                            checked={squamousAbnormality === 'scc'}
                            onChange={() => setSquamousAbnormality('scc')}
                          />
                          <span style={{
                            background: '#721c24',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}>Squamous cell carcinoma</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Glandular Abnormalities */}
                {(abnormalityType === 'glandular' || abnormalityType === 'both') && (
                  <div style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '20px',
                    background: '#fafafa',
                  }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#7b1fa2' }}>
                      Glandular Cell Abnormalities
                    </h4>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#525252', marginBottom: '8px', fontWeight: 500 }}>
                        Atypical Glandular Cells (AGC):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'agc_endo_nos'}
                            onChange={() => setGlandularAbnormality('agc_endo_nos')}
                          />
                          <span style={{
                            background: '#ffe0b2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}>AGC</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Endocervical cells, NOS</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'agc_endom_nos'}
                            onChange={() => setGlandularAbnormality('agc_endom_nos')}
                          />
                          <span style={{
                            background: '#ffe0b2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}>AGC</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Endometrial cells, NOS</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'agc_nos'}
                            onChange={() => setGlandularAbnormality('agc_nos')}
                          />
                          <span style={{
                            background: '#ffe0b2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}>AGC</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Glandular cells, NOS</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#525252', marginBottom: '8px', fontWeight: 500 }}>
                        Atypical Glandular Cells, Favor Neoplastic:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'agc_fn_endo'}
                            onChange={() => setGlandularAbnormality('agc_fn_endo')}
                          />
                          <span style={{
                            background: '#f8d7da',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#c82333',
                          }}>AGC-FN</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Endocervical cells</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'agc_fn_nos'}
                            onChange={() => setGlandularAbnormality('agc_fn_nos')}
                          />
                          <span style={{
                            background: '#f8d7da',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#c82333',
                          }}>AGC-FN</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Glandular cells, NOS</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#525252', marginBottom: '8px', fontWeight: 500 }}>
                        Adenocarcinoma In Situ:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'ais'}
                            onChange={() => setGlandularAbnormality('ais')}
                          />
                          <span style={{
                            background: '#f8d7da',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#c82333',
                            fontWeight: 600,
                          }}>AIS</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Endocervical adenocarcinoma in situ</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '13px', color: '#525252', marginBottom: '8px', fontWeight: 500 }}>
                        Adenocarcinoma:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'adeno_endo'}
                            onChange={() => setGlandularAbnormality('adeno_endo')}
                          />
                          <span style={{
                            background: '#721c24',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}>Adenocarcinoma</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Endocervical</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'adeno_endom'}
                            onChange={() => setGlandularAbnormality('adeno_endom')}
                          />
                          <span style={{
                            background: '#721c24',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}>Adenocarcinoma</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Endometrial</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'adeno_extra'}
                            onChange={() => setGlandularAbnormality('adeno_extra')}
                          />
                          <span style={{
                            background: '#721c24',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}>Adenocarcinoma</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>Extrauterine</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="glandular"
                            checked={glandularAbnormality === 'adeno_nos'}
                            onChange={() => setGlandularAbnormality('adeno_nos')}
                          />
                          <span style={{
                            background: '#721c24',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}>Adenocarcinoma</span>
                          <span style={{ color: '#525252', fontSize: '13px' }}>NOS</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: NILM Findings */}
            {currentStep === 3 && generalCategory === 'nilm' && (
              <div>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 500 }}>
                  Step 3: Additional Findings (NILM)
                </h3>

                <div style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '20px',
                  marginBottom: '16px',
                  background: '#fafafa',
                }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Organisms</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { value: 'trichomonas', label: 'Trichomonas vaginalis' },
                      { value: 'candida', label: 'Fungal organisms (Candida spp.)' },
                      { value: 'bv', label: 'Shift in flora suggestive of bacterial vaginosis' },
                      { value: 'actinomyces', label: 'Actinomyces spp.' },
                      { value: 'hsv', label: 'Herpes simplex virus' },
                      { value: 'none', label: 'None identified' },
                    ].map(opt => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={organisms.includes(opt.value)}
                          onChange={() => toggleCheckbox(opt.value, organisms, setOrganisms)}
                        />
                        <span style={{ fontSize: '14px' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '20px',
                  background: '#fafafa',
                }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Other Non-Neoplastic Findings</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { value: 'reactive_inflammation', label: 'Reactive changes - Inflammation' },
                      { value: 'reactive_radiation', label: 'Reactive changes - Radiation' },
                      { value: 'reactive_iud', label: 'Reactive changes - IUD' },
                      { value: 'atrophy', label: 'Atrophy' },
                      { value: 'none', label: 'None' },
                    ].map(opt => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={nonNeoplasticFindings.includes(opt.value)}
                          onChange={() => toggleCheckbox(opt.value, nonNeoplasticFindings, setNonNeoplasticFindings)}
                        />
                        <span style={{ fontSize: '14px' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: HPV Testing */}
            {currentStep === 4 && (
              <div>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 500 }}>
                  Step 4: HPV Co-Testing
                </h3>
                <p style={{ color: '#525252', marginBottom: '20px' }}>
                  Was HPV testing performed?
                </p>

                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  marginBottom: '24px',
                }}>
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'pending', label: 'Pending' },
                  ].map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="hpvTested"
                        checked={hpvTested === opt.value}
                        onChange={() => setHpvTested(opt.value)}
                      />
                      <span style={{ fontWeight: hpvTested === opt.value ? 600 : 400 }}>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {hpvTested === 'yes' && (
                  <div style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '20px',
                    background: '#fafafa',
                  }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600 }}>HPV Results</h4>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Overall HPV Result:</div>
                      <div style={{ display: 'flex', gap: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="hpvResult"
                            checked={hpvResult === 'positive'}
                            onChange={() => setHpvResult('positive')}
                          />
                          <span style={{
                            background: hpvResult === 'positive' ? '#f8d7da' : 'transparent',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            color: hpvResult === 'positive' ? '#c82333' : '#161616',
                            fontWeight: hpvResult === 'positive' ? 600 : 400,
                          }}>Positive</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="hpvResult"
                            checked={hpvResult === 'negative'}
                            onChange={() => setHpvResult('negative')}
                          />
                          <span style={{
                            background: hpvResult === 'negative' ? '#d4edda' : 'transparent',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            color: hpvResult === 'negative' ? '#198038' : '#161616',
                            fontWeight: hpvResult === 'negative' ? 600 : 400,
                          }}>Negative</span>
                        </label>
                      </div>
                    </div>

                    {hpvResult === 'positive' && (
                      <div style={{
                        background: '#fff8e1',
                        padding: '16px',
                        borderRadius: '4px',
                        marginBottom: '20px',
                      }}>
                        <div style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
                          Genotype-Specific Results:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                          {[
                            { key: 'hpv16', label: 'HPV 16', value: hpv16, setter: setHpv16 },
                            { key: 'hpv18', label: 'HPV 18', value: hpv18, setter: setHpv18 },
                            { key: 'hpvOther', label: 'Other HR-HPV', value: hpvOther, setter: setHpvOther },
                          ].map(item => (
                            <div key={item.key}>
                              <div style={{ fontSize: '13px', marginBottom: '6px', color: '#525252' }}>{item.label}:</div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {['positive', 'negative', 'not_tested'].map(opt => (
                                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                    <input
                                      type="radio"
                                      name={item.key}
                                      checked={item.value === opt}
                                      onChange={() => item.setter(opt)}
                                    />
                                    {opt === 'positive' ? '+' : opt === 'negative' ? '−' : 'N/T'}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: '14px', marginBottom: '8px' }}>Test Method:</div>
                      <select
                        value={hpvMethod}
                        onChange={(e) => setHpvMethod(e.target.value)}
                        style={{
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '200px',
                        }}
                      >
                        <option value="cobas">Cobas HPV Test</option>
                        <option value="hc2">Hybrid Capture 2</option>
                        <option value="aptima">Aptima HPV Assay</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review & Recommendation */}
            {currentStep === 5 && (
              <div>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 500 }}>
                  Step 5: Review & Recommendation
                </h3>

                {/* Summary */}
                <div style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '20px',
                  marginBottom: '20px',
                  background: '#fafafa',
                }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', color: '#525252' }}>
                    Summary
                  </h4>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#525252', textTransform: 'uppercase' }}>Specimen Adequacy</div>
                      <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#4caf50' }}>✓</span>
                        Satisfactory for evaluation
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#525252', textTransform: 'uppercase' }}>Interpretation</div>
                      <div style={{ fontSize: '14px' }}>
                        <span style={{
                          background: '#f8d7da',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          color: '#c82333',
                          fontWeight: 600,
                        }}>
                          HSIL - High-grade squamous intraepithelial lesion
                        </span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#525252', textTransform: 'uppercase' }}>HPV Co-Testing</div>
                      <div style={{ fontSize: '14px' }}>
                        <span style={{
                          background: '#f8d7da',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          color: '#c82333',
                        }}>
                          HPV Positive (HPV 16 detected)
                        </span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#525252', textTransform: 'uppercase' }}>Additional Findings</div>
                      <div style={{ fontSize: '14px', color: '#525252' }}>None</div>
                    </div>
                  </div>
                </div>

                {/* User's Recommendation - FREE TEXT FIRST */}
                <div style={{
                  border: '2px solid #e91e63',
                  borderRadius: '4px',
                  padding: '20px',
                  marginBottom: '20px',
                  background: '#fff',
                }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#c2185b' }}>
                    Your Recommendation <span style={{ color: '#da1e28' }}>*</span>
                  </h4>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#525252' }}>
                    Enter your clinical recommendation based on the findings above.
                  </p>
                  <textarea
                    value={recommendationOverride}
                    onChange={(e) => setRecommendationOverride(e.target.value)}
                    rows={3}
                    placeholder="Enter your recommendation for follow-up management..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* System Suggestion - Collapsible, Copyable */}
                <div style={{
                  border: `1px solid ${riskColors.border}`,
                  borderRadius: '4px',
                  marginBottom: '20px',
                  overflow: 'hidden',
                }}>
                  <div 
                    onClick={() => setShowSystemSuggestion(!showSystemSuggestion)}
                    style={{
                      padding: '12px 16px',
                      background: '#f4f4f4',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>
                        💡 ASCCP Guideline Suggestion
                      </span>
                      <span style={{
                        background: riskColors.color,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}>
                        {recommendation.risk} risk
                      </span>
                    </div>
                    <span style={{ fontSize: '16px', color: '#525252' }}>
                      {showSystemSuggestion ? '▼' : '▶'}
                    </span>
                  </div>
                  
                  {showSystemSuggestion && (
                    <div style={{ padding: '16px', background: riskColors.bg }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        gap: '16px',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#525252', marginBottom: '8px' }}>
                            Based on HSIL cytology with HPV 16 positive:
                          </div>
                          <div 
                            id="system-recommendation"
                            style={{
                              background: 'white',
                              padding: '12px 16px',
                              borderRadius: '4px',
                              border: `1px solid ${riskColors.border}`,
                              fontSize: '14px',
                              fontWeight: 500,
                              color: riskColors.color,
                            }}
                          >
                            {recommendation.text}
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#525252',
                            marginTop: '8px',
                            fontStyle: 'italic',
                          }}>
                            Reference: 2019 ASCCP Risk-Based Management Guidelines
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(recommendation.text);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            style={{
                              background: 'white',
                              border: '1px solid #e0e0e0',
                              padding: '8px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {copied ? '✓ Copied' : '📋 Copy'}
                          </button>
                          <button
                            onClick={() => {
                              setRecommendationOverride(recommendation.text);
                            }}
                            style={{
                              background: '#e91e63',
                              color: 'white',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            ↑ Use This
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Comments */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    Additional Comments
                  </label>
                  <textarea
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    rows={3}
                    placeholder="Any additional notes for the report..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Current Selections Bar */}
            <div style={{
              marginTop: '24px',
              padding: '12px 16px',
              background: '#e8f4fd',
              borderRadius: '4px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '13px',
            }}>
              <span><strong>Adequacy:</strong> ✓ Satisfactory</span>
              <span style={{ color: '#a8a8a8' }}>|</span>
              <span><strong>Category:</strong> Epithelial Abnormality</span>
              <span style={{ color: '#a8a8a8' }}>|</span>
              <span style={{ color: '#c82333', fontWeight: 600 }}><strong>Type:</strong> Squamous - HSIL</span>
              <span style={{ color: '#a8a8a8' }}>|</span>
              <span style={{ color: '#c82333' }}><strong>HPV:</strong> Positive (16+)</span>
            </div>

            {/* Navigation Buttons */}
            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                style={{
                  background: 'transparent',
                  color: currentStep === 1 ? '#a8a8a8' : '#0f62fe',
                  border: `1px solid ${currentStep === 1 ? '#e0e0e0' : '#0f62fe'}`,
                  padding: '12px 24px',
                  fontSize: '14px',
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                disabled={currentStep === 5}
                style={{
                  background: currentStep === 5 ? '#a8a8a8' : '#e91e63',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  fontSize: '14px',
                  cursor: currentStep === 5 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
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
        <div style={{ display: 'flex', gap: '12px' }}>
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
          <button
            disabled={currentStep < 5}
            style={{
              background: currentStep < 5 ? '#c6c6c6' : '#e91e63',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '14px',
              cursor: currentStep < 5 ? 'not-allowed' : 'pointer',
            }}
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CytologyCaseView;
