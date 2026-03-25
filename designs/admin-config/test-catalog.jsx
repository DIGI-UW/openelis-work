import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Download, Upload, Cloud, Edit, Copy, Trash2, ChevronDown, ChevronRight, Info, X, Check, AlertTriangle, ChevronLeft, Settings, Bell, Link, FlaskConical, FileText, Tag, Beaker, Activity, HelpCircle, GripVertical, Eye, EyeOff, AlertCircle, CheckCircle, ArrowUp, ArrowDown, Layers, Move, GitBranch, Zap, Mail, MessageSquare, Phone, Thermometer, Snowflake, Clock, Printer, Cpu } from 'lucide-react';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const normalizeToDays = (value, unit) => {
  switch(unit) {
    case 'hours': return value / 24;
    case 'days': return value;
    case 'weeks': return value * 7;
    case 'months': return value * 30.44;
    case 'years': return value * 365.25;
    default: return value;
  }
};

const formatAge = (value, unit) => {
  if (value === 999 && unit === 'years') return 'âˆž';
  return `${value} ${unit}`;
};

const formatAgeRange = (range) => {
  const from = formatAge(range.ageFrom, range.ageFromUnit);
  const to = formatAge(range.ageTo, range.ageToUnit);
  return `${from} â€“ ${to}`;
};

const getSexLabel = (sex) => {
  switch(sex) {
    case 'M': return 'Male';
    case 'F': return 'Female';
    case 'A': return 'All';
    default: return sex;
  }
};

const getSexBadgeColor = (sex) => {
  switch(sex) {
    case 'M': return 'bg-blue-100 text-blue-700';
    case 'F': return 'bg-pink-100 text-pink-700';
    case 'A': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getRangeTypeColor = (type) => {
  switch(type) {
    case 'normal': return { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', bar: 'bg-green-400' };
    case 'valid': return { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-300' };
    case 'critical': return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', bar: 'bg-red-400' };
    case 'reporting': return { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-300' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700', bar: 'bg-gray-300' };
  }
};

// Sort ranges by normalized age
const sortRanges = (ranges) => {
  return [...ranges].sort((a, b) => {
    const aDays = normalizeToDays(a.ageFrom, a.ageFromUnit);
    const bDays = normalizeToDays(b.ageFrom, b.ageFromUnit);
    return aDays - bDays;
  });
};

// ============================================
// ENHANCED RANGE EDITOR WITH FUNCTIONAL VALIDATION
// ============================================

const RangeEditorV3 = () => {
  const [viewMode, setViewMode] = useState('structured');
  const [expandedGroups, setExpandedGroups] = useState(['normal', 'critical']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [showValidationPanel, setShowValidationPanel] = useState(true);

  // Range data with hour-level normal ranges for neonates
  // Intentional gap in Female: 56 days to 1 year is missing!
  const [rangeData, setRangeData] = useState({
    normal: [
      // Male ranges - starting from hours
      { id: 1, sex: 'M', ageFrom: 0, ageFromUnit: 'hours', ageTo: 24, ageToUnit: 'hours', low: 1, high: 100 },
      { id: 2, sex: 'M', ageFrom: 24, ageFromUnit: 'hours', ageTo: 48, ageToUnit: 'hours', low: 1, high: 120 },
      { id: 3, sex: 'M', ageFrom: 48, ageFromUnit: 'hours', ageTo: 72, ageToUnit: 'hours', low: 1, high: 140 },
      { id: 4, sex: 'M', ageFrom: 72, ageFromUnit: 'hours', ageTo: 5, ageToUnit: 'days', low: 1, high: 155 },
      { id: 5, sex: 'M', ageFrom: 5, ageFromUnit: 'days', ageTo: 14, ageToUnit: 'days', low: 1, high: 140 },
      { id: 6, sex: 'M', ageFrom: 14, ageFromUnit: 'days', ageTo: 1, ageToUnit: 'months', low: 1, high: 130 },
      { id: 7, sex: 'M', ageFrom: 1, ageFromUnit: 'months', ageTo: 1, ageToUnit: 'years', low: 1, high: 115 },
      { id: 8, sex: 'M', ageFrom: 1, ageFromUnit: 'years', ageTo: 999, ageToUnit: 'years', low: 5, high: 40 },
      // Female ranges - with intentional GAP from 56 days to 1 year
      { id: 9, sex: 'F', ageFrom: 0, ageFromUnit: 'hours', ageTo: 24, ageToUnit: 'hours', low: 1, high: 105 },
      { id: 10, sex: 'F', ageFrom: 24, ageFromUnit: 'hours', ageTo: 48, ageToUnit: 'hours', low: 1, high: 130 },
      { id: 11, sex: 'F', ageFrom: 48, ageFromUnit: 'hours', ageTo: 72, ageToUnit: 'hours', low: 1, high: 155 },
      { id: 12, sex: 'F', ageFrom: 72, ageFromUnit: 'hours', ageTo: 55, ageToUnit: 'days', low: 1, high: 175 },
      // GAP HERE: 55 days to 1 year is missing!
      { id: 13, sex: 'F', ageFrom: 1, ageFromUnit: 'years', ageTo: 999, ageToUnit: 'years', low: 5, high: 35 },
    ],
    valid: [
      { id: 101, sex: 'A', ageFrom: 0, ageFromUnit: 'hours', ageTo: 999, ageToUnit: 'years', low: 0, high: 600 },
    ],
    critical: [
      { id: 201, sex: 'A', ageFrom: 0, ageFromUnit: 'hours', ageTo: 23, ageToUnit: 'hours', low: null, high: 7.9 },
      { id: 202, sex: 'A', ageFrom: 24, ageFromUnit: 'hours', ageTo: 35, ageToUnit: 'hours', low: null, high: 10.9 },
      { id: 203, sex: 'A', ageFrom: 36, ageFromUnit: 'hours', ageTo: 47, ageToUnit: 'hours', low: null, high: 13.9 },
      { id: 204, sex: 'A', ageFrom: 48, ageFromUnit: 'hours', ageTo: 71, ageToUnit: 'hours', low: null, high: 14.9 },
      { id: 205, sex: 'A', ageFrom: 72, ageFromUnit: 'hours', ageTo: 13, ageToUnit: 'days', low: null, high: 17.9 },
      { id: 206, sex: 'A', ageFrom: 14, ageFromUnit: 'days', ageTo: 999, ageToUnit: 'years', low: null, high: 15.0 },
    ],
    reporting: [
      { id: 301, sex: 'A', ageFrom: 0, ageFromUnit: 'hours', ageTo: 999, ageToUnit: 'years', low: 0.1, high: 30 },
    ],
  });

  // Coverage validation logic
  const validateCoverage = useMemo(() => {
    const results = { 
      male: { complete: true, issues: [] }, 
      female: { complete: true, issues: [] } 
    };
    
    ['M', 'F'].forEach(sex => {
      const sexLabel = sex === 'M' ? 'male' : 'female';
      const ranges = rangeData.normal.filter(r => r.sex === sex || r.sex === 'A');
      
      // Normalize to days and sort
      const normalized = ranges.map(r => ({
        ...r,
        fromDays: normalizeToDays(r.ageFrom, r.ageFromUnit),
        toDays: normalizeToDays(r.ageTo, r.ageToUnit),
      })).sort((a, b) => a.fromDays - b.fromDays);

      if (normalized.length === 0) {
        results[sexLabel].complete = false;
        results[sexLabel].issues.push({
          type: 'gap',
          from: { value: 0, unit: 'hours' },
          to: { value: 999, unit: 'years' },
          message: `No normal ranges defined for ${sex === 'M' ? 'males' : 'females'}`,
          suggestedFill: null,
        });
      } else {
        // Check if starts at 0
        if (normalized[0].fromDays > 0.01) { // Small tolerance for floating point
          results[sexLabel].complete = false;
          results[sexLabel].issues.push({
            type: 'gap',
            from: { value: 0, unit: 'hours' },
            to: { value: normalized[0].ageFrom, unit: normalized[0].ageFromUnit },
            message: `Gap from birth to ${normalized[0].ageFrom} ${normalized[0].ageFromUnit}`,
            suggestedFill: normalized[0],
          });
        }

        // Check for gaps between ranges
        for (let i = 0; i < normalized.length - 1; i++) {
          const current = normalized[i];
          const next = normalized[i + 1];
          const gapDays = next.fromDays - current.toDays;
          
          // Allow small tolerance for contiguous ranges
          if (gapDays > 0.5) { // More than half a day gap
            results[sexLabel].complete = false;
            results[sexLabel].issues.push({
              type: 'gap',
              from: { value: current.ageTo, unit: current.ageToUnit },
              to: { value: next.ageFrom, unit: next.ageFromUnit },
              message: `Gap: ${current.ageTo} ${current.ageToUnit} to ${next.ageFrom} ${next.ageFromUnit}`,
              suggestedFill: current,
            });
          }
          
          // Check for overlaps
          if (next.fromDays < current.toDays - 0.01) {
            results[sexLabel].issues.push({
              type: 'overlap',
              from: { value: next.ageFrom, unit: next.ageFromUnit },
              to: { value: current.ageTo, unit: current.ageToUnit },
              message: `Overlap at ${next.ageFrom} ${next.ageFromUnit}`,
              ranges: [current, next],
            });
          }
        }

        // Check if ends at infinity
        const last = normalized[normalized.length - 1];
        if (last.toDays < normalizeToDays(100, 'years')) {
          results[sexLabel].complete = false;
          results[sexLabel].issues.push({
            type: 'gap',
            from: { value: last.ageTo, unit: last.ageToUnit },
            to: { value: 999, unit: 'years' },
            message: `Gap from ${last.ageTo} ${last.ageToUnit} to maximum age`,
            suggestedFill: last,
          });
        }
      }
    });

    return results;
  }, [rangeData.normal]);

  const handleFillGap = (issue, sex) => {
    const template = issue.suggestedFill;
    setPrefillData({
      rangeType: 'normal',
      sex: sex === 'male' ? 'M' : 'F',
      ageFrom: issue.from.value,
      ageFromUnit: issue.from.unit,
      ageTo: issue.to.value,
      ageToUnit: issue.to.unit,
      low: template?.low || '',
      high: template?.high || '',
      templateSource: template ? `Values from: ${template.ageFrom} ${template.ageFromUnit} â€“ ${template.ageTo} ${template.ageToUnit}` : null,
    });
    setShowAddModal('normal');
  };

  const handleCopyFromRange = (range, targetSex) => {
    setPrefillData({
      rangeType: 'normal',
      sex: targetSex,
      ageFrom: range.ageFrom,
      ageFromUnit: range.ageFromUnit,
      ageTo: range.ageTo,
      ageToUnit: range.ageToUnit,
      low: range.low,
      high: range.high,
      templateSource: `Copied from ${getSexLabel(range.sex)}: ${formatAgeRange(range)}`,
    });
    setShowAddModal('normal');
  };

  const toggleExpand = (type) => {
    setExpandedGroups(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const rangeTypes = [
    { id: 'normal', label: 'Normal Range', description: 'Clinical reference values. Results outside flagged H/L on reports.' },
    { id: 'valid', label: 'Valid Range', description: 'Expected possible values. Entry outside prompts verification.' },
    { id: 'critical', label: 'Critical Range', description: 'Panic values requiring immediate clinical action.' },
    { id: 'reporting', label: 'Reporting Range', description: 'Instrument limits. Results outside may need dilution/rerun.' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reference Ranges</h2>
            <p className="text-sm text-gray-500 mt-1">Define age and sex-specific reference ranges for this test</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowValidationPanel(!showValidationPanel)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${
                showValidationPanel ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CheckCircle size={16} />
              Validate Coverage
            </button>
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="structured">Structured View</option>
              <option value="table">Table View</option>
              <option value="visual">Visual View</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coverage Validation Panel */}
      {showValidationPanel && (
        <CoverageValidationPanel 
          coverage={validateCoverage} 
          onFillGap={handleFillGap}
          rangeData={rangeData}
          onCopyFromRange={handleCopyFromRange}
        />
      )}

      {/* Main Content */}
      <div className="p-4">
        {viewMode === 'structured' && (
          <div className="space-y-4">
            {rangeTypes.map((type) => {
              const colors = getRangeTypeColor(type.id);
              const ranges = rangeData[type.id] || [];
              const isExpanded = expandedGroups.includes(type.id);
              
              return (
                <div key={type.id} className={`border rounded-lg ${colors.border}`}>
                  {/* Range Type Header */}
                  <button
                    onClick={() => toggleExpand(type.id)}
                    className={`w-full flex items-center justify-between p-4 ${colors.bg} rounded-t-lg`}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                        {type.label}
                      </span>
                      <span className="text-sm text-gray-600">{type.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{ranges.length} range(s)</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPrefillData(null); setShowAddModal(type.id); }}
                        className="p-1 text-gray-500 hover:text-teal-600 hover:bg-white rounded"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </button>

                  {/* Range List - Grouped by Sex, Sorted by Age */}
                  {isExpanded && (
                    <div className="p-4">
                      {ranges.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No {type.label.toLowerCase()}s defined</p>
                          <button 
                            onClick={() => { setPrefillData(null); setShowAddModal(type.id); }}
                            className="mt-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
                          >
                            + Add {type.label}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Group by Sex */}
                          {['M', 'F', 'A'].map(sex => {
                            const sexRanges = sortRanges(ranges.filter(r => r.sex === sex));
                            if (sexRanges.length === 0) return null;
                            
                            return (
                              <div key={sex}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSexBadgeColor(sex)}`}>
                                    {getSexLabel(sex)}
                                  </span>
                                  <span className="text-xs text-gray-500">({sexRanges.length} ranges)</span>
                                  <div className="flex-1 h-px bg-gray-200"></div>
                                </div>
                                <div className="space-y-2 ml-4">
                                  {sexRanges.map((range, idx) => (
                                    <div 
                                      key={range.id}
                                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 group"
                                    >
                                      <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                                        <div className="w-40">
                                          <span className="text-xs text-gray-500">Age Range</span>
                                          <p className="text-sm font-medium text-gray-900">{formatAgeRange(range)}</p>
                                        </div>
                                        <div className="w-20">
                                          <span className="text-xs text-gray-500">Low</span>
                                          <p className="text-sm font-medium text-gray-900">
                                            {range.low !== null ? range.low : 'â€”'}
                                          </p>
                                        </div>
                                        <div className="w-20">
                                          <span className="text-xs text-gray-500">High</span>
                                          <p className="text-sm font-medium text-gray-900">
                                            {range.high !== null ? range.high : 'â€”'}
                                          </p>
                                        </div>
                                        {/* Mini visual bar */}
                                        <div className="w-32 h-6 bg-gray-100 rounded relative overflow-hidden">
                                          {range.low !== null && range.high !== null && (
                                            <div 
                                              className={`absolute h-full ${colors.bar} rounded`}
                                              style={{ 
                                                left: `${Math.max(0, (range.low / 200) * 100)}%`,
                                                width: `${Math.min(100, ((range.high - range.low) / 200) * 100)}%`
                                              }}
                                            ></div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Edit">
                                          <Edit size={14} />
                                        </button>
                                        <button 
                                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" 
                                          title="Copy to other sex"
                                          onClick={() => handleCopyFromRange(range, sex === 'M' ? 'F' : 'M')}
                                        >
                                          <Copy size={14} />
                                        </button>
                                        <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'table' && (
          <TableView rangeData={rangeData} rangeTypes={rangeTypes} />
        )}

        {viewMode === 'visual' && (
          <VisualRangeView rangeData={rangeData} />
        )}
      </div>

      {/* Add/Edit Range Modal */}
      {showAddModal && (
        <AddRangeModal 
          rangeType={showAddModal}
          prefillData={prefillData}
          onClose={() => { setShowAddModal(false); setPrefillData(null); }}
          onSave={(range) => {
            // Add range logic would go here
            setShowAddModal(false);
            setPrefillData(null);
          }}
        />
      )}
    </div>
  );
};

// ============================================
// COVERAGE VALIDATION PANEL
// ============================================

const CoverageValidationPanel = ({ coverage, onFillGap, rangeData, onCopyFromRange }) => {
  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <CheckCircle size={16} className="text-gray-500" />
        Age Coverage Validation
      </h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Male Coverage */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                Male
              </span>
              {coverage.male.complete ? (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle size={14} />
                  Complete Coverage
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertCircle size={14} />
                  {coverage.male.issues.length} Issue(s) Found
                </span>
              )}
            </div>
          </div>
          
          {coverage.male.issues.length > 0 ? (
            <div className="space-y-2">
              {coverage.male.issues.map((issue, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${
                    issue.type === 'gap' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-xs font-semibold uppercase ${
                        issue.type === 'gap' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {issue.type}
                      </span>
                      <p className={`mt-1 ${issue.type === 'gap' ? 'text-red-700' : 'text-amber-700'}`}>
                        {issue.message}
                      </p>
                    </div>
                    {issue.type === 'gap' && (
                      <button
                        onClick={() => onFillGap(issue, 'male')}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-700 bg-teal-100 hover:bg-teal-200 rounded transition-colors"
                      >
                        <Plus size={12} />
                        Fill Gap
                      </button>
                    )}
                  </div>
                  {issue.suggestedFill && (
                    <p className="text-xs text-gray-500 mt-2">
                      Suggested values from adjacent range: Low={issue.suggestedFill.low}, High={issue.suggestedFill.high}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
              All age ranges from birth to maximum age are covered.
            </div>
          )}
        </div>

        {/* Female Coverage */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-700">
                Female
              </span>
              {coverage.female.complete ? (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle size={14} />
                  Complete Coverage
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertCircle size={14} />
                  {coverage.female.issues.length} Issue(s) Found
                </span>
              )}
            </div>
          </div>
          
          {coverage.female.issues.length > 0 ? (
            <div className="space-y-2">
              {coverage.female.issues.map((issue, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${
                    issue.type === 'gap' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-xs font-semibold uppercase ${
                        issue.type === 'gap' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {issue.type}
                      </span>
                      <p className={`mt-1 ${issue.type === 'gap' ? 'text-red-700' : 'text-amber-700'}`}>
                        {issue.message}
                      </p>
                    </div>
                    {issue.type === 'gap' && (
                      <button
                        onClick={() => onFillGap(issue, 'female')}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-700 bg-teal-100 hover:bg-teal-200 rounded transition-colors"
                      >
                        <Plus size={12} />
                        Fill Gap
                      </button>
                    )}
                  </div>
                  {issue.suggestedFill && (
                    <p className="text-xs text-gray-500 mt-2">
                      Suggested values from adjacent range: Low={issue.suggestedFill.low}, High={issue.suggestedFill.high}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
              All age ranges from birth to maximum age are covered.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TABLE VIEW
// ============================================

const TableView = ({ rangeData, rangeTypes }) => {
  // Flatten and sort all ranges
  const allRanges = useMemo(() => {
    const flat = [];
    rangeTypes.forEach(type => {
      (rangeData[type.id] || []).forEach(range => {
        flat.push({ ...range, rangeType: type.id, rangeLabel: type.label });
      });
    });
    return flat.sort((a, b) => {
      // Sort by type, then sex, then age
      if (a.rangeType !== b.rangeType) return a.rangeType.localeCompare(b.rangeType);
      if (a.sex !== b.sex) return a.sex.localeCompare(b.sex);
      return normalizeToDays(a.ageFrom, a.ageFromUnit) - normalizeToDays(b.ageFrom, b.ageFromUnit);
    });
  }, [rangeData, rangeTypes]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-y border-gray-200">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sex</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Age From</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Age To</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Low</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">High</th>
            <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {allRanges.map(range => {
            const colors = getRangeTypeColor(range.rangeType);
            return (
              <tr key={`${range.rangeType}-${range.id}`} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
                    {range.rangeLabel}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSexBadgeColor(range.sex)}`}>
                    {getSexLabel(range.sex)}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-gray-900">
                  {range.ageFrom} {range.ageFromUnit}
                </td>
                <td className="px-3 py-3 text-sm text-gray-900">
                  {range.ageTo === 999 ? 'âˆž' : `${range.ageTo} ${range.ageToUnit}`}
                </td>
                <td className="px-3 py-3 text-sm text-gray-900">
                  {range.low !== null ? range.low : 'â€”'}
                </td>
                <td className="px-3 py-3 text-sm text-gray-900">
                  {range.high !== null ? range.high : 'â€”'}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600"><Edit size={14} /></button>
                    <button className="p-1 text-gray-400 hover:text-blue-600"><Copy size={14} /></button>
                    <button className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// VISUAL RANGE VIEW
// ============================================

const VisualRangeView = ({ rangeData }) => {
  const [selectedSex, setSelectedSex] = useState('M');
  const [selectedAgeValue, setSelectedAgeValue] = useState(1);
  const [selectedAgeUnit, setSelectedAgeUnit] = useState('days');

  const selectedAgeDays = normalizeToDays(selectedAgeValue, selectedAgeUnit);

  // Find applicable ranges for selected demographics
  const getApplicableRange = (ranges) => {
    return ranges.find(r => {
      const matchesSex = r.sex === selectedSex || r.sex === 'A';
      const fromDays = normalizeToDays(r.ageFrom, r.ageFromUnit);
      const toDays = normalizeToDays(r.ageTo, r.ageToUnit);
      const matchesAge = selectedAgeDays >= fromDays && selectedAgeDays <= toDays;
      return matchesSex && matchesAge;
    });
  };

  const normalRange = getApplicableRange(rangeData.normal);
  const validRange = getApplicableRange(rangeData.valid);
  const criticalRange = getApplicableRange(rangeData.critical);
  const reportingRange = getApplicableRange(rangeData.reporting);

  const scale = { min: 0, max: 200 };
  const toPercent = (val) => Math.min(100, Math.max(0, ((val - scale.min) / (scale.max - scale.min)) * 100));

  return (
    <div className="space-y-6">
      {/* Demographic Selector */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">View ranges for:</span>
        <div className="flex items-center gap-2">
          <select 
            value={selectedSex}
            onChange={(e) => setSelectedSex(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Age:</span>
          <input 
            type="number"
            min="0"
            value={selectedAgeValue}
            onChange={(e) => setSelectedAgeValue(Number(e.target.value))}
            className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          />
          <select 
            value={selectedAgeUnit}
            onChange={(e) => setSelectedAgeUnit(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="hours">hours</option>
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
            <option value="years">years</option>
          </select>
        </div>
      </div>

      {/* Applicable Ranges Display */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Showing ranges applicable to: <strong>{selectedSex === 'M' ? 'Male' : 'Female'}, {selectedAgeValue} {selectedAgeUnit} old</strong>
        </div>

        {/* Range Bars */}
        {[
          { label: 'Valid', range: validRange, color: 'bg-blue-300', textColor: 'text-blue-800' },
          { label: 'Normal', range: normalRange, color: 'bg-green-400', textColor: 'text-green-800' },
          { label: 'Critical', range: criticalRange, color: 'bg-red-400', textColor: 'text-red-800' },
          { label: 'Reporting', range: reportingRange, color: 'bg-purple-300', textColor: 'text-purple-800' },
        ].map(({ label, range, color, textColor }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-24 text-sm font-medium text-gray-700">{label}</div>
            <div className="flex-1 relative h-8 bg-gray-200 rounded">
              {range ? (
                <>
                  {range.low !== null && range.high !== null && (
                    <div 
                      className={`absolute h-full ${color} rounded`}
                      style={{ 
                        left: `${toPercent(range.low)}%`, 
                        width: `${toPercent(range.high) - toPercent(range.low)}%` 
                      }}
                    />
                  )}
                  {range.low === null && range.high !== null && (
                    <div 
                      className={`absolute h-full ${color} rounded-l`}
                      style={{ left: '0%', width: `${toPercent(range.high)}%` }}
                    />
                  )}
                  <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium ${textColor}`}>
                    {range.low ?? 'â€”'} â€“ {range.high ?? 'â€”'}
                  </span>
                </>
              ) : (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 italic">
                  Not defined for this demographic
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-300 rounded"></div><span className="text-xs text-gray-600">Valid</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-400 rounded"></div><span className="text-xs text-gray-600">Normal</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-400 rounded"></div><span className="text-xs text-gray-600">Critical</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-purple-300 rounded"></div><span className="text-xs text-gray-600">Reporting</span></div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ADD RANGE MODAL
// ============================================

const AddRangeModal = ({ rangeType, prefillData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sex: prefillData?.sex || 'A',
    ageFrom: prefillData?.ageFrom ?? 0,
    ageFromUnit: prefillData?.ageFromUnit || 'hours',
    ageTo: prefillData?.ageTo ?? 999,
    ageToUnit: prefillData?.ageToUnit || 'years',
    low: prefillData?.low ?? '',
    high: prefillData?.high ?? '',
  });

  const rangeTypeLabels = {
    normal: 'Normal Range',
    valid: 'Valid Range',
    critical: 'Critical Range',
    reporting: 'Reporting Range',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add {rangeTypeLabels[rangeType]}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Template Source Banner */}
        {prefillData?.templateSource && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Info size={16} />
              <span>{prefillData.templateSource}</span>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Sex Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Applies To</label>
            <div className="flex gap-3">
              {[
                { value: 'A', label: 'All', color: 'gray' },
                { value: 'M', label: 'Male Only', color: 'blue' },
                { value: 'F', label: 'Female Only', color: 'pink' },
              ].map(option => (
                <label 
                  key={option.value}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.sex === option.value 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="sex"
                    value={option.value}
                    checked={formData.sex === option.value}
                    onChange={(e) => setFormData({...formData, sex: e.target.value})}
                    className="sr-only"
                  />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSexBadgeColor(option.value)}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={formData.ageFrom}
                    onChange={(e) => setFormData({...formData, ageFrom: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <select
                    value={formData.ageFromUnit}
                    onChange={(e) => setFormData({...formData, ageFromUnit: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                    <option value="years">years</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={formData.ageTo}
                    onChange={(e) => setFormData({...formData, ageTo: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <select
                    value={formData.ageToUnit}
                    onChange={(e) => setFormData({...formData, ageToUnit: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                    <option value="years">years</option>
                  </select>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use 999 years for "no upper age limit" (infinity)
            </p>
          </div>

          {/* Value Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {rangeType === 'critical' ? 'Critical Thresholds' : 'Value Range'}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {rangeType === 'critical' ? 'Critical Low (values below this)' : 'Low'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.low}
                  onChange={(e) => setFormData({...formData, low: e.target.value})}
                  placeholder={rangeType === 'critical' ? 'Leave blank if N/A' : '0'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {rangeType === 'critical' ? 'Critical High (values above this)' : 'High'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.high}
                  onChange={(e) => setFormData({...formData, high: e.target.value})}
                  placeholder={rangeType === 'critical' ? 'Leave blank if N/A' : '100'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
          >
            Add Range
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TEST ORDERING FOR SAMPLE TYPE
// ============================================

const TestOrderingPanel = () => {
  const [tests, setTests] = useState([
    { id: 1, name: 'Glucose, Fasting', order: 1 },
    { id: 2, name: 'Hemoglobin A1c', order: 2 },
    { id: 3, name: 'Creatinine', order: 3 },
    { id: 4, name: 'BUN', order: 4 },
    { id: 5, name: 'ALT (SGPT)', order: 5 },
    { id: 6, name: 'AST (SGOT)', order: 6 },
    { id: 7, name: 'Bilirubin, Total', order: 7 },
    { id: 8, name: 'Albumin', order: 8 },
  ]);

  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedSampleType, setSelectedSampleType] = useState('serum');

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newTests = [...tests];
    const draggedTest = newTests[draggedItem];
    newTests.splice(draggedItem, 1);
    newTests.splice(index, 0, draggedTest);
    
    // Update order numbers
    newTests.forEach((test, idx) => test.order = idx + 1);
    
    setTests(newTests);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newTests = [...tests];
    [newTests[index - 1], newTests[index]] = [newTests[index], newTests[index - 1]];
    newTests.forEach((test, idx) => test.order = idx + 1);
    setTests(newTests);
  };

  const moveDown = (index) => {
    if (index === tests.length - 1) return;
    const newTests = [...tests];
    [newTests[index], newTests[index + 1]] = [newTests[index + 1], newTests[index]];
    newTests.forEach((test, idx) => test.order = idx + 1);
    setTests(newTests);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Test Display Order</h2>
          <p className="text-sm text-gray-500 mt-1">Drag and drop to reorder tests for this sample type</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sample Type:</label>
          <select 
            value={selectedSampleType}
            onChange={(e) => setSelectedSampleType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="serum">Serum</option>
            <option value="plasma">Plasma</option>
            <option value="whole_blood">Whole Blood</option>
            <option value="urine">Urine</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        {tests.map((test, index) => (
          <div
            key={test.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move transition-all ${
              draggedItem === index ? 'border-teal-500 bg-teal-50 shadow-lg' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 text-gray-400">
              <GripVertical size={16} />
              <span className="text-sm font-medium w-6">{test.order}.</span>
            </div>
            <span className="flex-1 text-sm font-medium text-gray-900">{test.name}</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ArrowUp size={16} />
              </button>
              <button 
                onClick={() => moveDown(index)}
                disabled={index === tests.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        This order determines how tests appear in order entry and result entry for the selected sample type.
      </p>
    </div>
  );
};

// ============================================
// PANEL ASSOCIATION WITH INLINE CREATE AND ORDERING
// ============================================

const PanelAssociationPanel = () => {
  const [selectedPanels, setSelectedPanels] = useState({
    1: { selected: true, order: 3 },  // BMP, position 3
    3: { selected: true, order: 2 },  // Lipid Panel, position 2
  });
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newPanelName, setNewPanelName] = useState('');
  const [expandedPanel, setExpandedPanel] = useState(null);

  const availablePanels = [
    { id: 1, name: 'Basic Metabolic Panel', testCount: 8, tests: ['Glucose', 'BUN', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium'] },
    { id: 2, name: 'Comprehensive Metabolic Panel', testCount: 14, tests: ['Glucose', 'BUN', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium', 'Total Protein', 'Albumin', 'Bilirubin', 'ALP', 'AST', 'ALT'] },
    { id: 3, name: 'Lipid Panel', testCount: 4, tests: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides'] },
    { id: 4, name: 'Liver Function Panel', testCount: 7, tests: ['Total Protein', 'Albumin', 'Bilirubin Total', 'Bilirubin Direct', 'ALP', 'AST', 'ALT'] },
    { id: 5, name: 'Renal Function Panel', testCount: 5, tests: ['BUN', 'Creatinine', 'eGFR', 'BUN/Creatinine Ratio', 'Uric Acid'] },
    { id: 6, name: 'Thyroid Panel', testCount: 3, tests: ['TSH', 'Free T4', 'Free T3'] },
  ];

  const togglePanel = (panelId, panel) => {
    setSelectedPanels(prev => {
      if (prev[panelId]?.selected) {
        // Deselect - remove from selection
        const newSelection = { ...prev };
        delete newSelection[panelId];
        setExpandedPanel(null);
        return newSelection;
      } else {
        // Select - add with default order at end
        setExpandedPanel(panelId);
        return {
          ...prev,
          [panelId]: { selected: true, order: panel.testCount + 1 }
        };
      }
    });
  };

  const updateOrder = (panelId, newOrder) => {
    setSelectedPanels(prev => ({
      ...prev,
      [panelId]: { ...prev[panelId], order: newOrder }
    }));
  };

  const handleAddPanel = () => {
    if (newPanelName.trim()) {
      // Would add to availablePanels and select it
      setNewPanelName('');
      setShowAddPanel(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Panel Membership</h2>
          <p className="text-sm text-gray-500 mt-1">Select which panels should include this test and set display order</p>
        </div>
        <button 
          onClick={() => setShowAddPanel(true)}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
        >
          <Plus size={16} />
          Create New Panel
        </button>
      </div>

      {/* Inline Add Panel Form */}
      {showAddPanel && (
        <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">New Panel Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPanelName}
              onChange={(e) => setNewPanelName(e.target.value)}
              placeholder="Enter panel name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              autoFocus
            />
            <button 
              onClick={handleAddPanel}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
            >
              Create
            </button>
            <button 
              onClick={() => { setShowAddPanel(false); setNewPanelName(''); }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {availablePanels.map(panel => {
          const isSelected = selectedPanels[panel.id]?.selected;
          const isExpanded = expandedPanel === panel.id;
          const currentOrder = selectedPanels[panel.id]?.order || panel.testCount + 1;
          
          return (
            <div 
              key={panel.id}
              className={`border-2 rounded-lg transition-colors ${
                isSelected 
                  ? 'border-teal-500 bg-teal-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {/* Panel Header */}
              <div 
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => togglePanel(panel.id, panel)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{panel.name}</p>
                  <p className="text-xs text-gray-500">{panel.testCount} tests</p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                      Position: {currentOrder}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedPanel(isExpanded ? null : panel.id); }}
                      className="p-1 text-teal-600 hover:bg-teal-100 rounded"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Order Selection */}
              {isSelected && isExpanded && (
                <div className="px-3 pb-3 border-t border-teal-200 mt-0 pt-3">
                  <div className="flex items-start gap-4">
                    {/* Order Input */}
                    <div className="w-56">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Display Position in Panel
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={panel.testCount + 1}
                          value={currentOrder}
                          onChange={(e) => updateOrder(panel.id, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-gray-500">of {panel.testCount + 1}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Enter a number or drag the test in the preview list
                      </p>
                    </div>
                    
                    {/* Preview of tests in panel with drag-drop */}
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Panel Test Order Preview <span className="text-gray-400 font-normal">â€” drag to reorder</span>
                      </label>
                      <div className="bg-white border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto">
                        <ol className="text-xs text-gray-600 space-y-0.5">
                          {panel.tests.map((test, idx) => {
                            const position = idx + 1;
                            const isInsertPoint = position === currentOrder;
                            
                            return (
                              <React.Fragment key={test}>
                                {isInsertPoint && (
                                  <li 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/plain', 'thisTest');
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    className="flex items-center gap-2 py-1.5 px-2 bg-teal-100 rounded text-teal-800 font-medium cursor-grab active:cursor-grabbing border-2 border-teal-300 border-dashed"
                                  >
                                    <GripVertical size={12} className="text-teal-500 flex-shrink-0" />
                                    <span className="w-4">{currentOrder}.</span>
                                    <span className="flex-1">â† THIS TEST (Glucose, Fasting)</span>
                                  </li>
                                )}
                                <li 
                                  className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('border-t-2', 'border-teal-400');
                                  }}
                                  onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('border-t-2', 'border-teal-400');
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-t-2', 'border-teal-400');
                                    const newPosition = position >= currentOrder ? position : position;
                                    updateOrder(panel.id, position >= currentOrder ? position + 1 : position);
                                  }}
                                >
                                  <span className="w-4 ml-4 text-gray-400">
                                    {position >= currentOrder ? position + 1 : position}.
                                  </span>
                                  <span>{test}</span>
                                </li>
                              </React.Fragment>
                            );
                          })}
                          {currentOrder > panel.testCount && (
                            <li 
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', 'thisTest');
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              className="flex items-center gap-2 py-1.5 px-2 bg-teal-100 rounded text-teal-800 font-medium cursor-grab active:cursor-grabbing border-2 border-teal-300 border-dashed"
                            >
                              <GripVertical size={12} className="text-teal-500 flex-shrink-0" />
                              <span className="w-4">{currentOrder}.</span>
                              <span className="flex-1">â† THIS TEST (Glucose, Fasting)</span>
                            </li>
                          )}
                        </ol>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <GripVertical size={10} /> Drag the highlighted row to change position
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Click on a selected panel to expand and set the display order. Use the number input or drag the test in the preview list.
      </p>
    </div>
  );
};

// ============================================
// TEST SECTION MULTI-SELECT
// ============================================

const TestSectionMultiSelect = () => {
  const [selectedSections, setSelectedSections] = useState(['chemistry']);
  
  const sections = [
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'hematology', name: 'Hematology' },
    { id: 'serology', name: 'Serology' },
    { id: 'immunology', name: 'Immunology' },
    { id: 'microbiology', name: 'Microbiology' },
    { id: 'urinalysis', name: 'Urinalysis' },
    { id: 'parasitology', name: 'Parasitology' },
    { id: 'molecular', name: 'Molecular Biology' },
  ];

  const toggleSection = (sectionId) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium text-gray-700">Test Section(s)</label>
        <span className="text-red-500">*</span>
        <button className="text-gray-400 hover:text-gray-600">
          <Info size={14} />
        </button>
      </div>
      <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
        <div className="space-y-2">
          {sections.map(section => (
            <label key={section.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedSections.includes(section.id)}
                onChange={() => toggleSection(section.id)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">{section.name}</span>
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Select one or more laboratory units that can perform this test
      </p>
    </div>
  );
};

// ============================================
// METHOD MANAGEMENT WITH INLINE CREATE
// ============================================

const MethodLinkingWithCreate = () => {
  const [linkedMethods, setLinkedMethods] = useState([
    { id: 1, code: 'HEX', name: 'Hexokinase', isDefault: true, effectiveDate: '2024-01-01' },
    { id: 2, code: 'GOX', name: 'Glucose Oxidase', isDefault: false, effectiveDate: '2020-01-01' },
  ]);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showCreateMethod, setShowCreateMethod] = useState(false);
  const [showCopyMethodsModal, setShowCopyMethodsModal] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodCode, setNewMethodCode] = useState('');

  const availableMethods = [
    { id: 3, code: 'GOD-PAP', name: 'Enzymatic (GOD-PAP)' },
    { id: 4, code: 'CLR', name: 'Colorimetric' },
    { id: 5, code: 'ISE', name: 'Ion-Selective Electrode' },
  ];

  const handleCreateMethod = () => {
    if (newMethodName.trim()) {
      // Would create method and add to linked
      setNewMethodName('');
      setShowCreateMethod(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Associated Methods</h2>
          <p className="text-sm text-gray-500 mt-1">Link analytical methods used to perform this test</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCopyMethodsModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Copy size={16} />
            Copy from Test...
          </button>
          <button 
            onClick={() => setShowAddMethod(!showAddMethod)}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium"
          >
            <Plus size={16} />
            Link Method
          </button>
        </div>
      </div>

      {/* Add Method Panel */}
      {showAddMethod && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Select Method to Link</label>
            <button 
              onClick={() => { setShowAddMethod(false); setShowCreateMethod(true); }}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              + Create New Method
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {availableMethods.map(method => (
              <button
                key={method.id}
                className="p-2 text-left text-sm border border-gray-200 rounded-md hover:bg-white hover:border-teal-500 flex items-center gap-2"
              >
                <code className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-mono">{method.code}</code>
                <span>{method.name}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowAddMethod(false)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Create New Method Panel */}
      {showCreateMethod && (
        <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Create New Method</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMethodCode}
              onChange={(e) => setNewMethodCode(e.target.value.toUpperCase())}
              placeholder="Code (e.g., HEX)"
              className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono uppercase"
            />
            <input
              type="text"
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              placeholder="Method name (e.g., Hexokinase Method)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              autoFocus
            />
            <button 
              onClick={handleCreateMethod}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
            >
              Create & Link
            </button>
            <button 
              onClick={() => { setShowCreateMethod(false); setNewMethodName(''); setNewMethodCode(''); }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Code is used for quick macro-style entry in result screens</p>
        </div>
      )}

      {/* Linked Methods List */}
      <div className="space-y-3">
        {linkedMethods.map((method) => (
          <div key={method.id} className={`p-4 border rounded-lg ${method.isDefault ? 'border-teal-300 bg-teal-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.isDefault ? 'bg-teal-200' : 'bg-gray-100'}`}>
                  <Settings className={method.isDefault ? 'text-teal-700' : 'text-gray-500'} size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">{method.code}</code>
                    <span className="font-medium text-gray-900">{method.name}</span>
                    {method.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-teal-200 text-teal-800 text-xs font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Effective: {method.effectiveDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button className="px-2 py-1 text-xs text-teal-600 hover:bg-teal-100 rounded font-medium">
                    Set Default
                  </button>
                )}
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                  <Edit size={16} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Copy Methods from Test Modal */}
      {showCopyMethodsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Copy Methods from Another Test</h3>
              <button onClick={() => setShowCopyMethodsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search for test</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter test name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                  />
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium">
                    Search
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select test:</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {['Fasting Glucose', 'Random Glucose', '2-Hour Glucose', 'HbA1c'].map((test, i) => (
                    <label key={i} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="radio" name="sourceTestMethod" className="text-teal-600 focus:ring-teal-500" />
                      <span className="text-sm text-gray-700">{test}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Methods to copy:</label>
                <div className="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-teal-600" />
                    <code className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">HEX</code>
                    <span className="text-sm text-gray-700">Hexokinase Method</span>
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">Default</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-teal-600" />
                    <code className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">GOX</code>
                    <span className="text-sm text-gray-700">Glucose Oxidase Method</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600" />
                    <code className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">ELEC</code>
                    <span className="text-sm text-gray-700">Electrode Method</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button 
                onClick={() => setShowCopyMethodsModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium">
                Copy Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// TEST LIST VIEW
// ============================================

const mockTests = [
  { id: 1, name: 'Glucose, Fasting', section: 'Chemistry', sampleType: 'Serum', resultType: 'Numeric', loinc: '1558-6', active: true, isAmr: false },
  { id: 2, name: 'Hemoglobin', section: 'Hematology', sampleType: 'Whole Blood', resultType: 'Numeric', loinc: '718-7', active: true, isAmr: false },
  { id: 3, name: 'HIV Rapid Test', section: 'Serology', sampleType: 'Serum', resultType: 'Select List', loinc: 'â€”', active: true, isAmr: false },
  { id: 4, name: 'Creatinine', section: 'Chemistry', sampleType: 'Serum', resultType: 'Numeric', loinc: '2160-0', active: true, isAmr: false },
  { id: 5, name: 'ALT (SGPT)', section: 'Chemistry', sampleType: 'Serum', resultType: 'Numeric', loinc: '1742-6', active: false, isAmr: false },
  { id: 6, name: 'CD4 Count', section: 'Immunology', sampleType: 'Whole Blood', resultType: 'Numeric', loinc: '24467-3', active: true, isAmr: false },
  { id: 7, name: 'Malaria RDT', section: 'Parasitology', sampleType: 'Whole Blood', resultType: 'Select List', loinc: 'â€”', active: true, isAmr: false },
  { id: 8, name: 'Bilirubin, Total', section: 'Chemistry', sampleType: 'Serum', resultType: 'Numeric', loinc: '1975-2', active: true, isAmr: false },
  { id: 9, name: 'Ampicillin Susceptibility', section: 'Microbiology', sampleType: 'Culture', resultType: 'Select List', loinc: '18864-9', active: true, isAmr: true, whonetCode: 'AMP' },
  { id: 10, name: 'Ciprofloxacin Susceptibility', section: 'Microbiology', sampleType: 'Culture', resultType: 'Select List', loinc: '18906-8', active: true, isAmr: true, whonetCode: 'CIP' },
  { id: 11, name: 'Gentamicin Susceptibility', section: 'Microbiology', sampleType: 'Culture', resultType: 'Select List', loinc: '18928-2', active: true, isAmr: true, whonetCode: 'GEN' },
];

const TestListView = ({ onEditTest, onAddTest }) => {
  const [selectedTests, setSelectedTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const toggleSelect = (id) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedTests(prev => 
      prev.length === mockTests.length ? [] : mockTests.map(t => t.id)
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Test Catalog Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage laboratory tests, panels, and configurations</p>
          </div>
          <button 
            onClick={onAddTest}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Plus size={18} />
            Add Test
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md transition-colors ${showFilters ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Filter size={18} />
            Filters
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Download size={18} />
              Export
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Upload size={18} />
              Import
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Cloud size={18} />
              Fetch from Hub
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
            <select className="px-3 py-2 border border-gray-300 rounded-md text-gray-700">
              <option>All Sections</option>
              <option>Chemistry</option>
              <option>Hematology</option>
              <option>Serology</option>
              <option>Immunology</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-gray-700">
              <option>All Sample Types</option>
              <option>Serum</option>
              <option>Whole Blood</option>
              <option>Urine</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-gray-700">
              <option>All Result Types</option>
              <option>Numeric</option>
              <option>Select List</option>
              <option>Text</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-gray-700">
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-gray-700">
              <option>All Tests</option>
              <option>AMR Tests Only</option>
              <option>Non-AMR Tests</option>
            </select>
            <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">Clear All</button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedTests.length > 0 && (
        <div className="bg-teal-50 border-b border-teal-200 px-6 py-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-teal-800 font-medium">{selectedTests.length} test(s) selected</span>
            <button className="text-sm text-teal-700 hover:text-teal-900 font-medium">Activate</button>
            <button className="text-sm text-teal-700 hover:text-teal-900 font-medium">Deactivate</button>
            <button className="text-sm text-teal-700 hover:text-teal-900 font-medium">Add to Panel</button>
            <button className="text-sm text-teal-700 hover:text-teal-900 font-medium">Export Selected</button>
            <button className="text-sm text-gray-500 hover:text-gray-700 ml-auto" onClick={() => setSelectedTests([])}>Clear Selection</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input 
                    type="checkbox" 
                    checked={selectedTests.length === mockTests.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Test Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Section</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sample Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Result Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">LOINC</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="w-24 px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockTests.map((test) => (
                <tr key={test.id} className={`hover:bg-gray-50 ${selectedTests.includes(test.id) ? 'bg-teal-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedTests.includes(test.id)}
                      onChange={() => toggleSelect(test.id)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onEditTest(test)}
                        className="text-teal-600 hover:text-teal-800 font-medium"
                      >
                        {test.name}
                      </button>
                      {test.isAmr && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700" title={`WHONET: ${test.whonetCode}`}>
                          AMR
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{test.section}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{test.sampleType}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {test.resultType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{test.loinc}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${test.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {test.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => onEditTest(test)}
                        className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Duplicate">
                        <Copy size={16} />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Deactivate">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Showing 1-8 of 347 tests</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1.5 bg-teal-600 text-white rounded-md text-sm">1</button>
            <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">2</button>
            <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">3</button>
            <span className="text-gray-500">...</span>
            <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">44</button>
            <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TEST EDITOR (TABBED INTERFACE)
// ============================================

const TestEditor = ({ test, onBack }) => {
  const [activeTab, setActiveTab] = useState('basic');

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'sample', label: 'Sample & Results', icon: Beaker },
    { id: 'ranges', label: 'Ranges', icon: Activity },
    { id: 'storage', label: 'Sample Storage', icon: Thermometer },
    { id: 'ordering', label: 'Display Order', icon: Layers },
    { id: 'panels', label: 'Panels', icon: Layers },
    { id: 'labels', label: 'Labels', icon: Printer },
    { id: 'terminology', label: 'Terminology', icon: Tag },
    { id: 'reagents', label: 'Reagents', icon: FlaskConical },
    { id: 'analyzers', label: 'Analyzers', icon: Cpu },
    { id: 'methods', label: 'Methods', icon: Settings },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'reflex', label: 'Reflex & Calc', icon: GitBranch },
  ];

  return (
    <div className="bg-gray-50 h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {test ? `Edit Test: ${test.name}` : 'Add New Test'}
              </h1>
              <p className="text-sm text-gray-500">Configure all test properties in one place</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
              Save Test
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Vertical Tabs */}
      <div className="flex flex-1 overflow-hidden">
        {/* Vertical Tab Sidebar */}
        <div className="w-56 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <nav className="p-2">
            <div className="mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuration</p>
            </div>
            {tabs.slice(0, 4).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors mb-0.5 ${
                    activeTab === tab.id 
                      ? 'bg-teal-50 text-teal-700 border-l-3 border-teal-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={activeTab === tab.id ? 'text-teal-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
            
            <div className="mt-4 mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Organization</p>
            </div>
            {tabs.slice(4, 7).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors mb-0.5 ${
                    activeTab === tab.id 
                      ? 'bg-teal-50 text-teal-700 border-l-3 border-teal-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={activeTab === tab.id ? 'text-teal-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
            
            <div className="mt-4 mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Resources</p>
            </div>
            {tabs.slice(7, 9).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors mb-0.5 ${
                    activeTab === tab.id 
                      ? 'bg-teal-50 text-teal-700 border-l-3 border-teal-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={activeTab === tab.id ? 'text-teal-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
            
            <div className="mt-4 mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Automation</p>
            </div>
            {tabs.slice(9).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors mb-0.5 ${
                    activeTab === tab.id 
                      ? 'bg-teal-50 text-teal-700 border-l-3 border-teal-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={activeTab === tab.id ? 'text-teal-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-5xl">
            {activeTab === 'basic' && <BasicInfoTab test={test} />}
            {activeTab === 'sample' && <SampleResultsTab test={test} />}
            {activeTab === 'ranges' && <RangeEditorV3 />}
            {activeTab === 'storage' && <SampleStorageTab />}
            {activeTab === 'ordering' && <TestOrderingPanel />}
            {activeTab === 'panels' && <PanelAssociationPanel />}
            {activeTab === 'labels' && <LabelsTab />}
            {activeTab === 'terminology' && <TerminologyMappingsTab />}
            {activeTab === 'reagents' && <ReagentLinkingTab />}
            {activeTab === 'analyzers' && <AnalyzerLinkingTab />}
            {activeTab === 'methods' && <MethodLinkingWithCreate />}
            {activeTab === 'alerts' && <AlertRulesTab />}
            {activeTab === 'reflex' && <ReflexCalculatedTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// BASIC INFO TAB
// ============================================

const BasicInfoTab = ({ test }) => {
  const [isAmrTest, setIsAmrTest] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="text-sm font-medium text-gray-700">Test Name</label>
              <span className="text-red-500">*</span>
              <button className="text-gray-400 hover:text-gray-600"><Info size={14} /></button>
            </div>
            <input 
              type="text" 
              defaultValue={test?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Enter test name"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="text-sm font-medium text-gray-700">Reporting Name</label>
              <button className="text-gray-400 hover:text-gray-600"><Info size={14} /></button>
            </div>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Name for patient reports"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="text-sm font-medium text-gray-700">Test Code</label>
              <button className="text-gray-400 hover:text-gray-600"><Info size={14} /></button>
            </div>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., GLU-F"
            />
          </div>

          <div>
            <TestSectionMultiSelect />
          </div>

          <div className="col-span-2">
            <div className="flex items-center gap-1 mb-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <button className="text-gray-400 hover:text-gray-600"><Info size={14} /></button>
            </div>
            <textarea 
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Enter test description..."
            />
          </div>

          <div className="col-span-2 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Status & Visibility</h3>
            <div className="flex items-center gap-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <span className="text-sm text-gray-700">Orderable</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <div>
                  <span className="text-sm text-gray-700">Internal QA - No Results Release</span>
                  <p className="text-xs text-gray-500">Test results will not appear on patient reports</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* AMR Test Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <input 
            type="checkbox" 
            checked={isAmrTest}
            onChange={(e) => setIsAmrTest(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Antimicrobial Resistance (AMR) Test</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                WHONET
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Enable for WHONET export and antimicrobial resistance surveillance
            </p>

            {/* AMR Configuration - shown when checked */}
            {isAmrTest && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="text-sm font-medium text-purple-900 mb-4">WHONET Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">WHONET Antibiotic Code</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <option value="">Select antibiotic...</option>
                      <option value="AMP">AMP - Ampicillin</option>
                      <option value="AMC">AMC - Amoxicillin/Clavulanic acid</option>
                      <option value="CIP">CIP - Ciprofloxacin</option>
                      <option value="GEN">GEN - Gentamicin</option>
                      <option value="MEM">MEM - Meropenem</option>
                      <option value="VAN">VAN - Vancomycin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Antibiotic Class</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <option value="">Select class...</option>
                      <option value="penicillins">Penicillins</option>
                      <option value="cephalosporins">Cephalosporins</option>
                      <option value="carbapenems">Carbapenems</option>
                      <option value="fluoroquinolones">Fluoroquinolones</option>
                      <option value="aminoglycosides">Aminoglycosides</option>
                      <option value="glycopeptides">Glycopeptides</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Test Method</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <option value="disk">Disk Diffusion</option>
                      <option value="mic">MIC</option>
                      <option value="etest">E-test</option>
                      <option value="vitek">VITEK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Breakpoint Standard</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <option value="clsi2024">CLSI 2024</option>
                      <option value="clsi2023">CLSI 2023</option>
                      <option value="eucast2024">EUCAST 2024</option>
                      <option value="eucast2023">EUCAST 2023</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Disk Potency</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="e.g., 10"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <span className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">Âµg</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-purple-700">
                  <Info size={14} />
                  <span>This test will be included in WHONET exports</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SAMPLE & RESULTS TAB
// ============================================

const SampleResultsTab = ({ test }) => {
  const [showCopyInterpretationsModal, setShowCopyInterpretationsModal] = useState(false);
  const [showAddInterpretationModal, setShowAddInterpretationModal] = useState(false);
  const [editingInterpretation, setEditingInterpretation] = useState(null);
  const [resultType, setResultType] = useState('numeric'); // 'numeric' or 'select'
  
  // Sample select list options (would come from test configuration)
  const selectListOptions = [
    { id: 1, value: 'Positive', displayOrder: 1 },
    { id: 2, value: 'Negative', displayOrder: 2 },
    { id: 3, value: 'Indeterminate', displayOrder: 3 },
    { id: 4, value: 'Reactive', displayOrder: 4 },
    { id: 5, value: 'Non-Reactive', displayOrder: 5 },
  ];

  // Available label colors
  const labelColors = [
    { id: 'red', name: 'Red', bg: 'bg-red-100', text: 'text-red-700', preview: 'bg-red-500' },
    { id: 'orange', name: 'Orange', bg: 'bg-orange-100', text: 'text-orange-700', preview: 'bg-orange-500' },
    { id: 'yellow', name: 'Yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', preview: 'bg-yellow-500' },
    { id: 'green', name: 'Green', bg: 'bg-green-100', text: 'text-green-700', preview: 'bg-green-500' },
    { id: 'teal', name: 'Teal', bg: 'bg-teal-100', text: 'text-teal-700', preview: 'bg-teal-500' },
    { id: 'blue', name: 'Blue', bg: 'bg-blue-100', text: 'text-blue-700', preview: 'bg-blue-500' },
    { id: 'purple', name: 'Purple', bg: 'bg-purple-100', text: 'text-purple-700', preview: 'bg-purple-500' },
    { id: 'pink', name: 'Pink', bg: 'bg-pink-100', text: 'text-pink-700', preview: 'bg-pink-500' },
    { id: 'gray', name: 'Gray', bg: 'bg-gray-100', text: 'text-gray-700', preview: 'bg-gray-500' },
  ];
  
  // Sample interpretations data with macro codes
  const [interpretations, setInterpretations] = useState([
    { id: 1, code: 'GLU-CRIT-H', resultType: 'numeric', label: 'Critical High', color: 'red', value: '>400', text: 'CRITICAL: Glucose severely elevated. Immediate clinical attention required.', isActive: true },
    { id: 2, code: 'GLU-HI', resultType: 'numeric', label: 'High', color: 'orange', value: '>126', text: 'Elevated fasting glucose. Consider diabetes screening and lifestyle modifications.', isActive: true },
    { id: 3, code: 'GLU-NL', resultType: 'numeric', label: 'Normal', color: 'green', value: '70-99', text: 'Fasting glucose within normal limits.', isActive: true },
    { id: 4, code: 'GLU-LO', resultType: 'numeric', label: 'Low', color: 'yellow', value: '<70', text: 'Hypoglycemia. Evaluate for symptoms and underlying cause.', isActive: true },
    { id: 5, code: 'GLU-CRIT-L', resultType: 'numeric', label: 'Critical Low', color: 'red', value: '<50', text: 'CRITICAL: Severe hypoglycemia. Immediate intervention required.', isActive: true },
  ]);

  // New interpretation form state
  const [newInterpretation, setNewInterpretation] = useState({
    code: '',
    label: '',
    color: 'gray',
    value: '',
    selectedValues: [], // Array for multi-select
    text: '',
    isActive: true
  });

  const handleAddInterpretation = () => {
    setEditingInterpretation(null);
    setNewInterpretation({
      code: '',
      label: '',
      color: 'gray',
      value: '',
      selectedValues: [],
      text: '',
      isActive: true
    });
    setShowAddInterpretationModal(true);
  };

  const handleEditInterpretation = (interp) => {
    setEditingInterpretation(interp);
    // Parse value back to array if it's a select list type
    const selectedVals = interp.resultType === 'select' 
      ? (interp.value.includes(',') ? interp.value.split(', ') : [interp.value])
      : [];
    setNewInterpretation({
      code: interp.code,
      label: interp.label,
      color: interp.color || 'gray',
      value: interp.resultType === 'select' ? '' : interp.value,
      selectedValues: selectedVals,
      text: interp.text,
      isActive: interp.isActive
    });
    setShowAddInterpretationModal(true);
  };

  const handleSaveInterpretation = () => {
    const isSelectList = resultType === 'select' || resultType === 'multiselect';
    const interpData = {
      id: editingInterpretation ? editingInterpretation.id : Math.max(...interpretations.map(i => i.id), 0) + 1,
      code: newInterpretation.code,
      resultType: isSelectList ? 'select' : 'numeric',
      label: newInterpretation.label,
      color: newInterpretation.color,
      value: isSelectList ? newInterpretation.selectedValues.join(', ') : newInterpretation.value,
      text: newInterpretation.text,
      isActive: newInterpretation.isActive
    };

    if (editingInterpretation) {
      setInterpretations(interpretations.map(i => i.id === editingInterpretation.id ? interpData : i));
    } else {
      setInterpretations([...interpretations, interpData]);
    }
    setShowAddInterpretationModal(false);
  };

  const handleDeleteInterpretation = (id) => {
    if (confirm('Are you sure you want to delete this interpretation?')) {
      setInterpretations(interpretations.filter(i => i.id !== id));
    }
  };

  const handleToggleActive = (id) => {
    setInterpretations(interpretations.map(i => 
      i.id === id ? { ...i, isActive: !i.isActive } : i
    ));
  };

  const getLabelStyle = (color) => {
    const colorDef = labelColors.find(c => c.id === color) || labelColors.find(c => c.id === 'gray');
    return `${colorDef.bg} ${colorDef.text}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Sample & Result Configuration</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Sample Type(s)</label>
                <span className="text-red-500">*</span>
              </div>
              <div className="border border-gray-300 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {['Serum', 'Plasma', 'Whole Blood', 'Urine', 'CSF'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={type === 'Serum'}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Default Sample Type</label>
              </div>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                <option value="">No default</option>
                <option value="serum" selected>Serum</option>
                <option value="plasma">Plasma</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Result Configuration</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Result Type <span className="text-red-500">*</span></label>
                <select 
                  value={resultType}
                  onChange={(e) => setResultType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="numeric">Numeric</option>
                  <option value="select">Select List</option>
                  <option value="multiselect">Multi-select</option>
                  <option value="text">Free Text</option>
                  <option value="remark">Remark Only</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Unit of Measure {resultType === 'numeric' && <span className="text-red-500">*</span>}</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  disabled={resultType !== 'numeric'}
                >
                  <option value="">Select unit...</option>
                  <option value="mgdl" selected>mg/dL</option>
                  <option value="mmoll">mmol/L</option>
                  <option value="gdl">g/dL</option>
                  <option value="ul">ÂµL</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Significant Digits</label>
                <input 
                  type="number" 
                  min="0" 
                  max="6"
                  defaultValue="0"
                  disabled={resultType !== 'numeric'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Default Result</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Optional default value"
                />
              </div>
            </div>

            {/* Select List Options Preview */}
            {(resultType === 'select' || resultType === 'multiselect') && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Select List Options</label>
                  <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                    Configure Options...
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectListOptions.map(opt => (
                    <span key={opt.id} className="px-2 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700">
                      {opt.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Interpretations Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Result Interpretations</h2>
            <p className="text-sm text-gray-500 mt-1">
              Define interpretive labels and clinical guidance that are added as external notes based on result values.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCopyInterpretationsModal(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Copy size={16} />
              Copy from Test...
            </button>
            <button 
              onClick={handleAddInterpretation}
              className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium"
            >
              <Plus size={16} />
              Add Interpretation
            </button>
          </div>
        </div>

        {interpretations.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-28">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-32">
                    {resultType === 'select' ? 'Selected Value' : 'Value/Range'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Interpretation Text</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-20">Active</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {interpretations.map((interp, index) => (
                  <tr key={interp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <GripVertical size={16} className="text-gray-400 cursor-grab" />
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">{interp.code}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLabelStyle(interp.color)}`}>
                        {interp.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{interp.value}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">{interp.text}</td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={interp.isActive} 
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        onChange={() => handleToggleActive(interp.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleEditInterpretation(interp)}
                          className="p-1 text-gray-400 hover:text-teal-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteInterpretation(interp.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No interpretations configured</p>
            <p className="text-sm text-gray-400 mt-1">Add interpretations to provide automatic clinical notes based on result values</p>
          </div>
        )}
      </div>

      {/* Add/Edit Interpretation Modal */}
      {showAddInterpretationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingInterpretation ? 'Edit Interpretation' : 'Add Interpretation'}
              </h3>
              <button onClick={() => setShowAddInterpretationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Code Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Code <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={newInterpretation.code}
                  onChange={(e) => setNewInterpretation({...newInterpretation, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., GLU-HI, HIV-POS, STAGE-2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 font-mono uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Shortcode for quick entry in result screens</p>
              </div>

              {/* Label and Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={newInterpretation.label}
                    onChange={(e) => setNewInterpretation({...newInterpretation, label: e.target.value})}
                    placeholder="e.g., Critical High, Stage II, Treatment Failure"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Color (optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={newInterpretation.color}
                      onChange={(e) => setNewInterpretation({...newInterpretation, color: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                    >
                      {labelColors.map(color => (
                        <option key={color.id} value={color.id}>{color.name}</option>
                      ))}
                    </select>
                    <div className={`w-8 h-8 rounded-md ${labelColors.find(c => c.id === newInterpretation.color)?.preview || 'bg-gray-500'}`}></div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {newInterpretation.label && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Preview:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLabelStyle(newInterpretation.color)}`}>
                    {newInterpretation.label}
                  </span>
                </div>
              )}

              {/* Value - different UI for numeric vs select list */}
              {resultType === 'select' || resultType === 'multiselect' ? (
                /* Select List Value - Multi-select checkboxes */
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    When Value(s) Selected <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto bg-white">
                    {selectListOptions.map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input 
                          type="checkbox"
                          checked={newInterpretation.selectedValues?.includes(opt.value) || false}
                          onChange={(e) => {
                            const currentValues = newInterpretation.selectedValues || [];
                            const newValues = e.target.checked 
                              ? [...currentValues, opt.value]
                              : currentValues.filter(v => v !== opt.value);
                            setNewInterpretation({...newInterpretation, selectedValues: newValues});
                          }}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">{opt.value}</span>
                      </label>
                    ))}
                  </div>
                  {newInterpretation.selectedValues?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {newInterpretation.selectedValues.map(val => (
                        <span key={val} className="inline-flex items-center px-2 py-0.5 rounded bg-teal-100 text-teal-700 text-xs">
                          {val}
                          <button 
                            type="button"
                            onClick={() => setNewInterpretation({
                              ...newInterpretation, 
                              selectedValues: newInterpretation.selectedValues.filter(v => v !== val)
                            })}
                            className="ml-1 text-teal-500 hover:text-teal-700"
                          >
                            Ã—
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Select one or more values that will trigger this interpretation</p>
                </div>
              ) : (
                /* Numeric/Text Value */
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Value or Range <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={newInterpretation.value}
                    onChange={(e) => setNewInterpretation({...newInterpretation, value: e.target.value})}
                    placeholder="e.g., >126, <70, 70-99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use comparison operators (&gt;, &lt;, &ge;, &le;), ranges (70-99), or exact values
                  </p>
                </div>
              )}

              {/* Interpretation Text */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Interpretation Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newInterpretation.text}
                  onChange={(e) => setNewInterpretation({...newInterpretation, text: e.target.value})}
                  rows={3}
                  placeholder="Clinical interpretation, guidance, or action items..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1">This text will be added as an external note on the result</p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="interpActive"
                  checked={newInterpretation.isActive}
                  onChange={(e) => setNewInterpretation({...newInterpretation, isActive: e.target.checked})}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="interpActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button 
                onClick={() => setShowAddInterpretationModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveInterpretation}
                disabled={!newInterpretation.code || !newInterpretation.label || !newInterpretation.text || 
                  (resultType === 'select' || resultType === 'multiselect' ? newInterpretation.selectedValues?.length === 0 : !newInterpretation.value)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium"
              >
                {editingInterpretation ? 'Save Changes' : 'Add Interpretation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Interpretations Modal */}
      {showCopyInterpretationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Copy Interpretations from Another Test</h3>
              <button onClick={() => setShowCopyInterpretationsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search for test</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter test name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                  />
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium">
                    Search
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select test:</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {[
                    { name: 'HbA1c (Hemoglobin A1c)', type: 'Numeric' },
                    { name: 'Breast Cancer Panel', type: 'Select List' },
                    { name: 'HIV Rapid Test', type: 'Select List' },
                    { name: 'PSA (Prostate Specific Antigen)', type: 'Numeric' },
                  ].map((test, i) => (
                    <label key={i} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="radio" name="sourceTest" className="text-teal-600 focus:ring-teal-500" />
                      <span className="text-sm text-gray-700">{test.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${test.type === 'Select List' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {test.type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Interpretations to copy:</label>
                <div className="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50 max-h-48 overflow-y-auto">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-1 rounded border-gray-300 text-teal-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">A1C-NL</code>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Normal</span>
                        <span className="text-xs text-gray-500">&lt;5.7%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">HbA1c within normal range. Continue current management.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-1 rounded border-gray-300 text-teal-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">A1C-PRE</code>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Prediabetes</span>
                        <span className="text-xs text-gray-500">5.7-6.4%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Consider lifestyle modifications and monitoring.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-1 rounded border-gray-300 text-teal-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">A1C-DM</code>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Diabetes</span>
                        <span className="text-xs text-gray-500">â‰¥6.5%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Consistent with diabetes mellitus diagnosis.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Import mode:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="importMode" className="text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm text-gray-700">Replace existing interpretations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="importMode" defaultChecked className="text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm text-gray-700">Append to existing interpretations</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button 
                onClick={() => setShowCopyInterpretationsModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium">
                Copy Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SAMPLE STORAGE TAB
// ============================================

const SampleStorageTab = () => {
  const [overrideRestricted, setOverrideRestricted] = useState(false);

  const storageConditions = [
    { value: 'ultra-low', label: 'Ultra-low freezer (-80Â°C to -60Â°C)', icon: 'ðŸ§Š', temp: '-80Â°C to -60Â°C' },
    { value: 'freezer', label: 'Freezer (-30Â°C to -15Â°C)', icon: 'â„ï¸', temp: '-30Â°C to -15Â°C' },
    { value: 'refrigerator', label: 'Refrigerator (2Â°C to 8Â°C)', icon: 'ðŸŒ¡ï¸', temp: '2Â°C to 8Â°C' },
    { value: 'cold-room', label: 'Cold room (4Â°C to 8Â°C)', icon: 'ðŸŒ¡ï¸', temp: '4Â°C to 8Â°C' },
    { value: 'cool-room', label: 'Cool room (15Â°C to 18Â°C)', icon: 'ðŸŒ¡ï¸', temp: '15Â°C to 18Â°C' },
    { value: 'room-temp', label: 'Room temperature (18Â°C to 25Â°C)', icon: 'ðŸ ', temp: '18Â°C to 25Â°C' },
    { value: 'controlled-room', label: 'Controlled room temp (20Â°C to 25Â°C)', icon: 'ðŸ ', temp: '20Â°C to 25Â°C' },
    { value: 'warm-incubator', label: 'Warm incubator (35Â°C to 37Â°C)', icon: 'ðŸ”¥', temp: '35Â°C to 37Â°C' },
    { value: 'ambient', label: 'Ambient (uncontrolled)', icon: 'ðŸŒ¡ï¸', temp: 'Uncontrolled' },
  ];

  const disposalMethods = [
    'Biohazard/Infectious waste bin',
    'Sharps container',
    'Chemical deactivation',
    'Incineration',
    'Autoclave then general waste',
    'Pharmaceutical waste',
    'Radioactive waste',
    'General waste (non-hazardous only)',
    'Return to manufacturer',
  ];

  return (
    <div className="space-y-6">
      {/* Storage Requirements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Thermometer className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Storage Requirements</h2>
            <p className="text-sm text-gray-500">Define how samples for this test should be stored</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Conditions <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
              <option value="">Select storage conditions...</option>
              {storageConditions.map(cond => (
                <option key={cond.value} value={cond.value}>
                  {cond.icon} {cond.label}
                </option>
              ))}
              <option value="custom">Custom (specify below)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Temperature range for sample preservation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Storage Conditions
            </label>
            <input 
              type="text"
              placeholder="e.g., 2-8Â°C, protected from light"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-xs text-gray-500 mt-1">Override or add details to selected condition</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Storage Duration <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input 
                type="number"
                min="1"
                defaultValue="72"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <select className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Maximum time sample can be stored before testing</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stability Notes
            </label>
            <input 
              type="text"
              placeholder="e.g., Stable for 7 days refrigerated, 1 month frozen"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Special Handling Requirements */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">Special Handling Requirements</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm text-gray-700">ðŸ”† Protect from light</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm text-gray-700">â„ï¸ Do not freeze</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm text-gray-700">ðŸ”¥ Do not refrigerate</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm text-gray-700">â¬†ï¸ Keep upright</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm text-gray-700">ðŸ§ª Centrifuge before storage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm text-gray-700">âš—ï¸ Aliquot before storage</span>
            </label>
          </div>
        </div>
      </div>

      {/* Disposal Requirements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Trash2 className="text-red-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Disposal Requirements</h2>
            <p className="text-sm text-gray-500">Define how samples should be disposed after testing</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disposal Method <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
              <option value="">Select disposal method...</option>
              {disposalMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disposal Timeframe
            </label>
            <div className="flex gap-2">
              <input 
                type="number"
                min="1"
                placeholder="e.g., 7"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <select className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Maximum time after test completion before disposal</p>
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="text-yellow-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Special Instructions</h2>
            <p className="text-sm text-gray-500">Additional guidance for sample handling</p>
          </div>
        </div>

        <textarea
          rows={4}
          placeholder="Enter any special instructions for sample handling, storage, or disposal that don't fit in the fields above..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      {/* Override Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <input 
            type="checkbox"
            checked={overrideRestricted}
            onChange={(e) => setOverrideRestricted(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Override Restricted</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                Locked
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              When enabled, order entry staff cannot modify storage or disposal requirements for this test. 
              Use for critical tests where sample handling must be strictly controlled (e.g., HIV, controlled substances).
            </p>
            
            {overrideRestricted && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  <span className="font-medium">Storage and disposal settings are locked</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Only Lab Managers can modify these requirements. Order entry staff will see these as read-only.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Reference Card */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">ðŸ“‹ Storage Condition Quick Reference</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Ultra-low Freezer</p>
            <p className="text-gray-600">-80Â°C to -60Â°C</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Freezer</p>
            <p className="text-gray-600">-30Â°C to -15Â°C</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Refrigerator</p>
            <p className="text-gray-600">2Â°C to 8Â°C</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Cool Room</p>
            <p className="text-gray-600">15Â°C to 18Â°C</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Room Temperature</p>
            <p className="text-gray-600">18Â°C to 25Â°C</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Warm Incubator</p>
            <p className="text-gray-600">35Â°C to 37Â°C</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LABELS TAB
// ============================================

const LabelsTab = () => {
  const [labelConfigs, setLabelConfigs] = useState([
    { id: 1, presetId: 'specimen', presetName: 'Specimen Label', defaultQty: 1, maxQty: 5, allowOverride: true },
    { id: 2, presetId: 'block', presetName: 'Block Label', defaultQty: 4, maxQty: 20, allowOverride: true },
    { id: 3, presetId: 'slide', presetName: 'Slide Label', defaultQty: 12, maxQty: 50, allowOverride: true },
    { id: 4, presetId: 'freezer', presetName: 'Freezer Label', defaultQty: 2, maxQty: 10, allowOverride: false },
  ]);
  const [allowCountOverride, setAllowCountOverride] = useState(true);

  const availablePresets = [
    { id: 'order', name: 'Order Label', category: 'Order', size: '50 Ã— 25 mm' },
    { id: 'specimen', name: 'Specimen Label', category: 'Specimen', size: '50 Ã— 25 mm' },
    { id: 'block', name: 'Block Label', category: 'Pathology', size: '26 Ã— 12 mm' },
    { id: 'slide', name: 'Slide Label', category: 'Pathology', size: '76 Ã— 26 mm' },
    { id: 'freezer', name: 'Freezer Label', category: 'Storage', size: '38 Ã— 19 mm' },
    { id: 'cryo', name: 'Cryo Vial Label', category: 'Storage', size: '32 Ã— 13 mm' },
  ];

  const handleRemoveLabel = (id) => {
    setLabelConfigs(labelConfigs.filter(c => c.id !== id));
  };

  const handleAddLabel = () => {
    const nextId = Math.max(...labelConfigs.map(c => c.id), 0) + 1;
    setLabelConfigs([...labelConfigs, {
      id: nextId,
      presetId: '',
      presetName: '',
      defaultQty: 1,
      maxQty: 10,
      allowOverride: true
    }]);
  };

  return (
    <div className="space-y-6">
      {/* Default Labels Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Default Labels for This Test</h2>
            <p className="text-sm text-gray-500 mt-1">When this test is ordered, automatically suggest these labels</p>
          </div>
          <button 
            onClick={handleAddLabel}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium"
          >
            <Plus size={16} />
            Add Label Type
          </button>
        </div>

        {labelConfigs.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Label Preset</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-28">Default Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-28">Max Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-32">Allow Override</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {labelConfigs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <select 
                        value={config.presetId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                      >
                        <option value="">Select preset...</option>
                        {availablePresets.map(preset => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name} ({preset.category} - {preset.size})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        min="1" 
                        value={config.defaultQty}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        min="1" 
                        value={config.maxQty}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={config.allowOverride}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleRemoveLabel(config.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Printer size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No label types configured</p>
            <p className="text-sm text-gray-400 mt-1">Add label presets to automatically suggest labels when this test is ordered</p>
          </div>
        )}
      </div>

      {/* Label Generation Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Label Generation Settings</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={allowCountOverride}
            onChange={(e) => setAllowCountOverride(e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">Allow label count override at order entry</span>
        </label>
        <p className="text-xs text-gray-500 mt-2 ml-6">
          When enabled, users can modify label quantities during order entry. Individual label types can still be locked via the "Allow Override" column above.
        </p>
      </div>

      {/* Order Entry Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Info size={16} />
          Order Entry Preview
        </h3>
        <p className="text-sm text-blue-800 mb-4">
          When this test is ordered, the Labels section will be pre-populated as follows:
        </p>
        <div className="bg-white rounded-lg border border-blue-200 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 text-left font-medium text-gray-700">Label Type</th>
                <th className="pb-2 text-center font-medium text-gray-700 w-20">Qty</th>
                <th className="pb-2 text-left font-medium text-gray-700">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labelConfigs.filter(c => c.presetId).map(config => (
                <tr key={config.id}>
                  <td className="py-2 text-gray-900">{config.presetName || 'Label'}</td>
                  <td className="py-2 text-center">
                    {config.allowOverride ? (
                      <span className="text-gray-900">{config.defaultQty}</span>
                    ) : (
                      <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{config.defaultQty}</span>
                    )}
                  </td>
                  <td className="py-2 text-gray-500 text-xs">This test</td>
                </tr>
              ))}
            </tbody>
          </table>
          {labelConfigs.some(c => !c.allowOverride) && (
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <AlertCircle size={12} />
              Gray quantities are locked and cannot be modified at order entry
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TERMINOLOGY MAPPINGS TAB
// ============================================

const TerminologyMappingsTab = () => {
  const [mappings] = useState([
    { id: 1, source: 'LOINC', code: '1558-6', relationship: 'SAME_AS', displayName: 'Fasting glucose [Mass/volume] in Serum or Plasma' },
    { id: 2, source: 'SNOMED', code: '271062006', relationship: 'SAME_AS', displayName: 'Fasting blood glucose measurement' },
  ]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Terminology Mappings</h2>
          <p className="text-sm text-gray-500 mt-1">Link this test to standard terminology codes for interoperability</p>
        </div>
        <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm">
          <Plus size={16} />
          Add Mapping
        </button>
      </div>

      <div className="space-y-4">
        {mappings.map((mapping) => (
          <div key={mapping.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  mapping.source === 'LOINC' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {mapping.source}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-gray-900">{mapping.code}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-teal-100 text-teal-700">
                      {mapping.relationship.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{mapping.displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"><Edit size={16} /></button>
                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Mapping Form */}
      <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Add New Mapping</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Terminology Source</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">Select...</option>
              <option value="LOINC">LOINC</option>
              <option value="SNOMED">SNOMED CT</option>
              <option value="CIEL">CIEL</option>
              <option value="OCL">Open Concept Lab</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
            <input type="text" placeholder="Enter code" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Relationship</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="SAME_AS">Same As</option>
              <option value="BROADER_THAN">Broader Than</option>
              <option value="NARROWER_THAN">Narrower Than</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium">Add</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// REAGENT LINKING TAB
// ============================================

const ReagentLinkingTab = () => {
  const [linkedReagents] = useState([
    { id: 1, name: 'Glucose Reagent R1', manufacturer: 'Roche', usageType: 'PRIMARY', quantityPerTest: 100, unit: 'ÂµL', stockLevel: 2500 },
    { id: 2, name: 'Glucose Reagent R2', manufacturer: 'Roche', usageType: 'SECONDARY', quantityPerTest: 50, unit: 'ÂµL', stockLevel: 1200 },
  ]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Associated Reagents</h2>
          <p className="text-sm text-gray-500 mt-1">Link reagents from inventory to track consumption</p>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-md text-sm font-medium">
          <Plus size={16} />
          Link Reagent
        </button>
      </div>

      <div className="space-y-3">
        {linkedReagents.map((reagent) => (
          <div key={reagent.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <FlaskConical className="text-teal-600" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{reagent.name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      reagent.usageType === 'PRIMARY' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {reagent.usageType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{reagent.manufacturer} â€¢ {reagent.quantityPerTest} {reagent.unit} per test</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{reagent.stockLevel.toLocaleString()} {reagent.unit}</span>
                  <p className="text-xs text-gray-500">Current Stock</p>
                </div>
                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><X size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ANALYZER LINKING TAB
// ============================================

const AnalyzerLinkingTab = () => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkedAnalyzers, setLinkedAnalyzers] = useState([
    { id: 1, name: 'Cobas c 501', manufacturer: 'Roche', serialNumber: 'SN-2024-0142', location: 'Chemistry Lab A', status: 'Online' },
    { id: 2, name: 'Cobas c 502', manufacturer: 'Roche', serialNumber: 'SN-2024-0143', location: 'Chemistry Lab B', status: 'Online' },
  ]);

  // Available analyzers from Master Lists (not yet linked)
  const availableAnalyzers = [
    { id: 3, name: 'AU680', manufacturer: 'Beckman Coulter', serialNumber: 'SN-2023-0098', location: 'Chemistry Lab A', status: 'Online' },
    { id: 4, name: 'Architect c8000', manufacturer: 'Abbott', serialNumber: 'SN-2022-0456', location: 'Chemistry Lab C', status: 'Maintenance' },
    { id: 5, name: 'Vitros 5600', manufacturer: 'Ortho Clinical', serialNumber: 'SN-2024-0201', location: 'STAT Lab', status: 'Online' },
  ];

  const [selectedAnalyzers, setSelectedAnalyzers] = useState([]);

  const handleToggleAnalyzer = (id) => {
    setSelectedAnalyzers(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleLinkAnalyzers = () => {
    const newAnalyzers = availableAnalyzers.filter(a => selectedAnalyzers.includes(a.id));
    setLinkedAnalyzers([...linkedAnalyzers, ...newAnalyzers]);
    setShowLinkModal(false);
    setSelectedAnalyzers([]);
  };

  const handleUnlinkAnalyzer = (id) => {
    if (confirm('Are you sure you want to unlink this analyzer?')) {
      setLinkedAnalyzers(linkedAnalyzers.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Linked Analyzers</h2>
            <p className="text-sm text-gray-500 mt-1">Select which analyzers can perform this test</p>
          </div>
          <button 
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            <Plus size={16} />
            Link Analyzer
          </button>
        </div>

        {linkedAnalyzers.length > 0 ? (
          <div className="space-y-3">
            {linkedAnalyzers.map((analyzer) => (
              <div key={analyzer.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Cpu className="text-gray-600" size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{analyzer.name}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          analyzer.status === 'Online' ? 'bg-green-100 text-green-700' : 
                          analyzer.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {analyzer.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{analyzer.manufacturer} â€¢ {analyzer.location}</p>
                      <p className="text-xs text-gray-400 mt-0.5">S/N: {analyzer.serialNumber}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUnlinkAnalyzer(analyzer.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Unlink analyzer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Cpu size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No analyzers linked</p>
            <p className="text-sm text-gray-400 mt-1">Link analyzers that can perform this test</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Analyzer Linking</p>
            <ul className="space-y-1 text-blue-700">
              <li>â€¢ Analyzers are configured in <span className="font-medium">Administration â†’ Master Lists â†’ Analyzers</span></li>
              <li>â€¢ Test code mapping is configured separately in the analyzer interface setup</li>
              <li>â€¢ Linking an analyzer indicates this test can be performed on that instrument</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Link Analyzer Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Link Analyzers</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {/* Analyzer Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Analyzers
                </label>
                <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                  {availableAnalyzers.filter(a => !linkedAnalyzers.find(la => la.id === a.id)).map(analyzer => (
                    <label 
                      key={analyzer.id} 
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedAnalyzers.includes(analyzer.id) ? 'bg-teal-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAnalyzers.includes(analyzer.id)}
                        onChange={() => handleToggleAnalyzer(analyzer.id)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{analyzer.name}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            analyzer.status === 'Online' ? 'bg-green-100 text-green-700' : 
                            analyzer.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {analyzer.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{analyzer.manufacturer} â€¢ {analyzer.location}</p>
                      </div>
                    </label>
                  ))}
                  {availableAnalyzers.filter(a => !linkedAnalyzers.find(la => la.id === a.id)).length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      All available analyzers are already linked
                    </div>
                  )}
                </div>
              </div>

              {selectedAnalyzers.length > 0 && (
                <p className="text-sm text-gray-600 mt-3">
                  {selectedAnalyzers.length} analyzer{selectedAnalyzers.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button 
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button 
                onClick={handleLinkAnalyzers}
                disabled={selectedAnalyzers.length === 0}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium"
              >
                Link Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// ALERT RULES TAB
// ============================================

const AlertRulesTab = () => {
  const [showAddRule, setShowAddRule] = useState(false);
  const [alertRules, setAlertRules] = useState([
    {
      id: 1,
      name: 'Critical Value Alert',
      enabled: true,
      triggerType: 'critical',
      channels: ['sms', 'email'],
      recipients: { orderingPhysician: true, patient: false, custom: null },
      smsTemplate: 'CRITICAL: {{test_name}} result {{result}} {{unit}} for {{patient_name}}. Please review immediately.'
    },
    {
      id: 2,
      name: 'Abnormal Result Notification',
      enabled: true,
      triggerType: 'abnormal',
      channels: ['email'],
      recipients: { orderingPhysician: true, patient: false, custom: null },
      smsTemplate: ''
    },
    {
      id: 3,
      name: 'Positive Result Alert',
      enabled: false,
      triggerType: 'specific',
      triggerValue: 'Positive',
      channels: ['sms'],
      recipients: { orderingPhysician: false, patient: true, custom: null },
      smsTemplate: 'Lab result ready for {{patient_name}}. Please contact your healthcare provider.'
    }
  ]);

  const getTriggerLabel = (type, value) => {
    switch(type) {
      case 'all': return 'All Results';
      case 'abnormal': return 'Abnormal (High or Low)';
      case 'critical': return 'Critical Value';
      case 'specific': return `Equals "${value}"`;
      default: return type;
    }
  };

  const toggleRule = (id) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Alert Rules</h2>
          <p className="text-sm text-gray-500 mt-1">Configure automated notifications when specific result conditions are met</p>
        </div>
        <button 
          onClick={() => setShowAddRule(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium text-sm"
        >
          <Plus size={16} />
          Add Rule
        </button>
      </div>

      {/* Alert Rules List */}
      <div className="space-y-4">
        {alertRules.map((rule) => (
          <div 
            key={rule.id} 
            className={`border rounded-lg overflow-hidden ${rule.enabled ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}`}
          >
            {/* Rule Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-medium text-gray-900">{rule.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleRule(rule.id)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                  <Edit size={16} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Rule Details */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-8">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">When</span>
                  <p className="text-sm text-gray-900 mt-1">
                    Result is <span className="font-medium text-teal-700">{getTriggerLabel(rule.triggerType, rule.triggerValue)}</span>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Notify Via</span>
                  <div className="flex items-center gap-2 mt-1">
                    {rule.channels.includes('sms') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">
                        <Phone size={12} /> SMS
                      </span>
                    )}
                    {rule.channels.includes('email') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs">
                        <Mail size={12} /> Email
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Recipients</span>
                  <div className="flex items-center gap-2 mt-1">
                    {rule.recipients.orderingPhysician && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                        Ordering Physician
                      </span>
                    )}
                    {rule.recipients.patient && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                        Patient
                      </span>
                    )}
                    {rule.recipients.custom && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                        {rule.recipients.custom}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {rule.smsTemplate && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">SMS Template</span>
                  <p className="text-sm text-gray-600 mt-1 font-mono bg-gray-50 p-2 rounded">
                    {rule.smsTemplate}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {alertRules.length === 0 && (
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <Bell className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600">No alert rules configured</p>
          <button 
            onClick={() => setShowAddRule(true)}
            className="mt-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
          >
            + Add your first alert rule
          </button>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Alert Rule</h3>
              <button onClick={() => setShowAddRule(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Rule Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Critical Value SMS Alert"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Trigger Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Alert when result is:</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Results' },
                    { value: 'abnormal', label: 'Abnormal (outside normal range)' },
                    { value: 'critical', label: 'Critical (panic value)' },
                    { value: 'specific', label: 'Specific Value' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="trigger" value={option.value} className="text-teal-600 focus:ring-teal-500" />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notification Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Send via:</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <Phone size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">SMS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <Mail size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Email</span>
                  </label>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Recipients:</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm text-gray-700">Ordering Physician (from order)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm text-gray-700">Patient (from patient record)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm text-gray-700">Custom recipient:</span>
                  </label>
                  <div className="ml-7 grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Phone: +1 555-123-4567"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <input 
                      type="email" 
                      placeholder="Email: user@example.com"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* SMS Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMS Template (160 char recommended)</label>
                <textarea 
                  rows={3}
                  placeholder="CRITICAL: {{test_name}} {{result}} {{unit}} for {{patient_name}}. Review immediately."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables: {"{{patient_name}}, {{patient_id}}, {{test_name}}, {{result}}, {{unit}}, {{reference_range}}"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => setShowAddRule(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium">
                Save Alert Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// REFLEX & CALCULATED RESULTS TAB
// ============================================

const ReflexCalculatedTab = () => {
  const reflexRules = [
    {
      id: 1,
      condition: '> 200 mg/dL',
      targetTests: ['Hemoglobin A1c'],
      mode: 'suggest'
    },
    {
      id: 2,
      condition: '= "Abnormal"',
      targetTests: ['Glucose Tolerance Test'],
      mode: 'auto'
    }
  ];

  const incomingReflex = [
    {
      id: 101,
      sourceTest: 'Glucose Tolerance Test',
      condition: '2-hour result > 140',
    }
  ];

  const calculationsUsingThis = [
    {
      id: 201,
      name: 'LDL Cholesterol (Calculated)',
      formula: 'Total_Chol - HDL - (Triglycerides / 5)',
      variableUsed: 'Not used - this test is Glucose'
    }
  ];

  const isCalculatedResult = false; // This test is not a calculated result

  return (
    <div className="space-y-6">
      {/* Reflex Tests Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reflex Tests</h2>
            <p className="text-sm text-gray-500 mt-1">Automatic test ordering based on results</p>
          </div>
        </div>

        {/* Rules triggered BY this test */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Rules triggered BY this test:</h3>
          {reflexRules.length > 0 ? (
            <div className="space-y-3">
              {reflexRules.map((rule) => (
                <div key={rule.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-gray-500">IF result</span>{' '}
                        <span className="font-medium text-gray-900">{rule.condition}</span>{' '}
                        <span className="text-gray-500">â†’ ORDER</span>{' '}
                        <span className="font-medium text-teal-700">{rule.targetTests.join(', ')}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        rule.mode === 'auto' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rule.mode === 'auto' ? 'Auto-order' : 'Suggest'}
                      </span>
                    </div>
                    <a 
                      href={`/MasterListsPage#reflex?ruleId=${rule.id}`}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      Edit in Master Lists
                      <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
              No reflex rules configured for this test
            </p>
          )}
        </div>

        {/* Rules that ORDER this test */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Rules that ORDER this test:</h3>
          {incomingReflex.length > 0 ? (
            <div className="space-y-3">
              {incomingReflex.map((rule) => (
                <div key={rule.id} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">â†³</span>
                      <span className="text-sm text-gray-700">
                        <span className="font-medium text-gray-900">{rule.sourceTest}</span>
                        <span className="text-gray-500"> when {rule.condition}</span>
                      </span>
                    </div>
                    <a 
                      href={`/MasterListsPage#reflex?ruleId=${rule.id}`}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      Edit in Master Lists
                      <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
              No other tests trigger this test as a reflex
            </p>
          )}
        </div>

        {/* Add new link */}
        <a 
          href="/MasterListsPage#reflex?action=add&triggerTestId=123"
          className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          <Plus size={16} />
          Add New Reflex Rule in Master Lists
          <ChevronRight size={14} />
        </a>
      </div>

      {/* Calculated Results Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Calculated Results</h2>
            <p className="text-sm text-gray-500 mt-1">Formulas that compute results from other test values</p>
          </div>
        </div>

        {/* Calculations that USE this test as input */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Calculations that USE this test as input:</h3>
          {calculationsUsingThis.length > 0 ? (
            <div className="space-y-3">
              {calculationsUsingThis.map((calc) => (
                <div key={calc.id} className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Zap className="text-purple-600" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{calc.name}</p>
                        <p className="text-xs text-gray-600 font-mono mt-0.5">{calc.formula}</p>
                      </div>
                    </div>
                    <a 
                      href={`/MasterListsPage#calculatedValue?calcId=${calc.id}`}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      Edit in Master Lists
                      <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
              This test is not used as input for any calculated results
            </p>
          )}
        </div>

        {/* This test IS a calculated result */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">This test IS a calculated result:</h3>
          {isCalculatedResult ? (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="text-green-600" size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Formula configured</p>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">[formula would show here]</p>
                  </div>
                </div>
                <a 
                  href="/MasterListsPage#calculatedValue?resultTestId=123"
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  Edit in Master Lists
                  <ChevronRight size={14} />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <Zap className="mx-auto text-gray-400 mb-2" size={24} />
              <p className="text-sm text-gray-600 mb-3">This test's result is not calculated from other values</p>
              <a 
                href="/MasterListsPage#calculatedValue?action=add&resultTestId=123"
                className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                <Plus size={16} />
                Configure in Master Lists
                <ChevronRight size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN DEMO EXPORT
// ============================================

export default function TestCatalogMockupsV3() {
  const [currentScreen, setCurrentScreen] = useState('list');
  const [selectedTest, setSelectedTest] = useState(null);
  const [activeDemo, setActiveDemo] = useState('full'); // 'full' or individual component demos

  const handleEditTest = (test) => {
    setSelectedTest(test);
    setCurrentScreen('editor');
  };

  const handleAddTest = () => {
    setSelectedTest(null);
    setCurrentScreen('editor');
  };

  const handleBack = () => {
    setCurrentScreen('list');
    setSelectedTest(null);
  };

  const demos = [
    { id: 'full', label: 'Full Application' },
    { id: 'ranges', label: 'Range Editor Only' },
    { id: 'ordering', label: 'Test Ordering Only' },
    { id: 'panels', label: 'Panel Association Only' },
    { id: 'methods', label: 'Method Linking Only' },
    { id: 'sections', label: 'Test Sections Only' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo Mode Selector */}
      <div className="bg-gray-800 text-white px-6 py-2">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Demo Mode:</span>
          <div className="flex gap-1">
            {demos.map(demo => (
              <button
                key={demo.id}
                onClick={() => { setActiveDemo(demo.id); setCurrentScreen('list'); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeDemo === demo.id 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeDemo === 'full' ? (
        <>
          {currentScreen === 'list' && (
            <TestListView 
              onEditTest={handleEditTest} 
              onAddTest={handleAddTest}
            />
          )}
          {currentScreen === 'editor' && (
            <TestEditor test={selectedTest} onBack={handleBack} />
          )}
        </>
      ) : (
        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Component Demo: {demos.find(d => d.id === activeDemo)?.label}</h2>
          </div>
          {activeDemo === 'ranges' && <RangeEditorV3 />}
          {activeDemo === 'ordering' && <TestOrderingPanel />}
          {activeDemo === 'panels' && <PanelAssociationPanel />}
          {activeDemo === 'methods' && <MethodLinkingWithCreate />}
          {activeDemo === 'sections' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md">
              <TestSectionMultiSelect />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
