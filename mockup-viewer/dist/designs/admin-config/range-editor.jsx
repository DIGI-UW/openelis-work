import React, { useState } from 'react';
import { Plus, Trash2, Info, AlertTriangle, Check, ChevronDown, ChevronRight, Edit, Copy, X, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================
// Enhanced Range Editor with Age/Sex Coverage
// ============================================

const RangeEditorV2 = () => {
  const [viewMode, setViewMode] = useState('structured'); // 'visual', 'table', 'structured'
  const [selectedRangeType, setSelectedRangeType] = useState('normal');
  const [expandedGroups, setExpandedGroups] = useState(['normal']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRange, setEditingRange] = useState(null);

  // Sample range data with age/sex specificity
  const [rangeData, setRangeData] = useState({
    normal: [
      { id: 1, sex: 'M', ageFrom: 0, ageFromUnit: 'days', ageTo: 5, ageToUnit: 'days', low: 1, high: 155 },
      { id: 2, sex: 'M', ageFrom: 6, ageFromUnit: 'days', ageTo: 14, ageToUnit: 'days', low: 1, high: 140 },
      { id: 3, sex: 'M', ageFrom: 15, ageFromUnit: 'days', ageTo: 1, ageToUnit: 'months', low: 1, high: 130 },
      { id: 4, sex: 'M', ageFrom: 1, ageFromUnit: 'months', ageTo: 1, ageToUnit: 'years', low: 1, high: 115 },
      { id: 5, sex: 'M', ageFrom: 1, ageFromUnit: 'years', ageTo: 999, ageToUnit: 'years', low: 5, high: 40 },
      { id: 6, sex: 'F', ageFrom: 0, ageFromUnit: 'days', ageTo: 55, ageToUnit: 'days', low: 1, high: 175 },
      { id: 7, sex: 'F', ageFrom: 56, ageFromUnit: 'days', ageTo: 1, ageToUnit: 'years', low: 1, high: 130 },
      { id: 8, sex: 'F', ageFrom: 1, ageFromUnit: 'years', ageTo: 999, ageToUnit: 'years', low: 5, high: 35 },
    ],
    valid: [
      { id: 101, sex: 'A', ageFrom: 0, ageFromUnit: 'days', ageTo: 999, ageToUnit: 'years', low: 0, high: 600 },
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
      { id: 301, sex: 'A', ageFrom: 0, ageFromUnit: 'days', ageTo: 999, ageToUnit: 'years', low: 0.1, high: 30 },
    ],
  });

  // Coverage validation
  const validateCoverage = (ranges, sex) => {
    // This would be more sophisticated in production
    // Checking if age ranges cover from birth (0) to max age with no gaps
    const sexRanges = ranges.filter(r => r.sex === sex || r.sex === 'A');
    if (sexRanges.length === 0) return { valid: false, gaps: ['No ranges defined'] };
    
    // Simplified check - in production would normalize all to same unit and check continuity
    return { valid: true, gaps: [] };
  };

  const maleCoverage = validateCoverage(rangeData.normal, 'M');
  const femaleCoverage = validateCoverage(rangeData.normal, 'F');

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

      {/* Coverage Status Banner */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Age Coverage:</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${maleCoverage.valid ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span className="text-sm text-gray-600">Male: {maleCoverage.valid ? 'Complete' : 'Gaps detected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${femaleCoverage.valid ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span className="text-sm text-gray-600">Female: {femaleCoverage.valid ? 'Complete' : 'Gaps detected'}</span>
            </div>
          </div>
          <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
            Validate Coverage
          </button>
        </div>
      </div>

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
                        onClick={(e) => { e.stopPropagation(); setShowAddModal(type.id); }}
                        className="p-1 text-gray-500 hover:text-teal-600 hover:bg-white rounded"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </button>

                  {/* Range List */}
                  {isExpanded && (
                    <div className="p-4">
                      {ranges.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No {type.label.toLowerCase()}s defined</p>
                          <button 
                            onClick={() => setShowAddModal(type.id)}
                            className="mt-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
                          >
                            + Add {type.label}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Group by Sex */}
                          {['M', 'F', 'A'].map(sex => {
                            const sexRanges = ranges.filter(r => r.sex === sex);
                            if (sexRanges.length === 0) return null;
                            
                            return (
                              <div key={sex} className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSexBadgeColor(sex)}`}>
                                    {getSexLabel(sex)}
                                  </span>
                                  <div className="flex-1 h-px bg-gray-200"></div>
                                </div>
                                <div className="space-y-2 ml-4">
                                  {sexRanges.sort((a, b) => a.ageFrom - b.ageFrom).map(range => (
                                    <div 
                                      key={range.id}
                                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300"
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="w-32">
                                          <span className="text-xs text-gray-500">Age Range</span>
                                          <p className="text-sm font-medium text-gray-900">{formatAgeRange(range)}</p>
                                        </div>
                                        <div className="w-24">
                                          <span className="text-xs text-gray-500">Low</span>
                                          <p className="text-sm font-medium text-gray-900">
                                            {range.low !== null ? range.low : 'â€”'}
                                          </p>
                                        </div>
                                        <div className="w-24">
                                          <span className="text-xs text-gray-500">High</span>
                                          <p className="text-sm font-medium text-gray-900">
                                            {range.high !== null ? range.high : 'â€”'}
                                          </p>
                                        </div>
                                        {/* Mini visual bar */}
                                        <div className="w-40 h-6 bg-gray-100 rounded relative overflow-hidden">
                                          {range.low !== null && range.high !== null && (
                                            <div 
                                              className={`absolute h-full ${colors.bar} rounded`}
                                              style={{ 
                                                left: `${(range.low / 200) * 100}%`,
                                                width: `${((range.high - range.low) / 200) * 100}%`
                                              }}
                                            ></div>
                                          )}
                                          {range.low === null && range.high !== null && (
                                            <div 
                                              className={`absolute h-full ${colors.bar} rounded-r`}
                                              style={{ left: '0%', width: `${(range.high / 200) * 100}%` }}
                                            ></div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                                          <Edit size={16} />
                                        </button>
                                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                          <Copy size={16} />
                                        </button>
                                        <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                                          <Trash2 size={16} />
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Range Type</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Sex</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Age From</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Age To</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Low</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">High</th>
                  <th className="px-3 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rangeTypes.map(type => {
                  const colors = getRangeTypeColor(type.id);
                  return rangeData[type.id]?.map(range => (
                    <tr key={range.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
                          {type.label}
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
                          <button className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
            <button className="mt-3 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium">
              <Plus size={16} />
              Add Range
            </button>
          </div>
        )}

        {viewMode === 'visual' && <VisualRangeView rangeData={rangeData} />}
      </div>

      {/* Range Type Info Panel */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start gap-2">
          <Info className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
          <div className="text-xs text-gray-600">
            <p className="font-medium text-gray-700 mb-1">Age/Sex-Specific Ranges</p>
            <p>All range types support age and sex-specific variations. The system validates that all possible age ranges are covered without gaps. Use "All" for sex when the range applies to both males and females.</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Range Modal */}
      {showAddModal && (
        <AddRangeModal 
          rangeType={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={(range) => {
            // Add range logic
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

// ============================================
// Visual Range View Component
// ============================================
const VisualRangeView = ({ rangeData }) => {
  const [selectedSex, setSelectedSex] = useState('M');
  const [selectedAgeValue, setSelectedAgeValue] = useState(30);
  const [selectedAgeUnit, setSelectedAgeUnit] = useState('years');

  const scale = { min: 0, max: 30 };
  const toPercent = (val) => Math.min(100, Math.max(0, ((val - scale.min) / (scale.max - scale.min)) * 100));

  // Find applicable ranges for selected age/sex
  const getApplicableRange = (ranges, sex, ageValue, ageUnit) => {
    // Simplified - in production would properly normalize age units
    return ranges.find(r => 
      (r.sex === sex || r.sex === 'A')
    ) || null;
  };

  const normalRange = getApplicableRange(rangeData.normal, selectedSex, selectedAgeValue, selectedAgeUnit);
  const validRange = getApplicableRange(rangeData.valid, selectedSex, selectedAgeValue, selectedAgeUnit);
  const criticalRange = getApplicableRange(rangeData.critical, selectedSex, selectedAgeValue, selectedAgeUnit);
  const reportingRange = getApplicableRange(rangeData.reporting, selectedSex, selectedAgeValue, selectedAgeUnit);

  return (
    <div className="space-y-6">
      {/* Demographic Selector */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">View ranges for:</label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sex:</label>
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
          <label className="text-sm text-gray-600">Age:</label>
          <input 
            type="number"
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

      {/* Visual Display */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">Scale: {scale.min} â€“ {scale.max} mg/dL</span>
          <span className="text-sm text-gray-500">
            Showing: {selectedSex === 'M' ? 'Male' : 'Female'}, {selectedAgeValue} {selectedAgeUnit}
          </span>
        </div>

        {/* Scale markers */}
        <div className="relative h-6 mb-2">
          <div className="absolute inset-x-0 flex justify-between text-xs text-gray-500">
            {[0, 5, 10, 15, 20, 25, 30].map(v => (
              <span key={v}>{v}</span>
            ))}
          </div>
        </div>

        {/* Range Bars */}
        <div className="space-y-3">
          {/* Valid Range */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-gray-700 flex items-center gap-1">
                Valid Range
                <button className="text-gray-400 hover:text-gray-600"><Info size={12} /></button>
              </div>
              <div className="flex-1 relative h-8 bg-gray-200 rounded">
                {validRange && (
                  <div 
                    className="absolute h-full bg-blue-200 rounded"
                    style={{ 
                      left: `${toPercent(validRange.low || 0)}%`, 
                      width: `${toPercent((validRange.high || scale.max) - (validRange.low || 0))}%` 
                    }}
                  />
                )}
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-blue-700">
                  {validRange ? `${validRange.low || 0} â€“ ${validRange.high || 'âˆž'}` : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Normal Range */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-gray-700 flex items-center gap-1">
                Normal Range
                <button className="text-gray-400 hover:text-gray-600"><Info size={12} /></button>
              </div>
              <div className="flex-1 relative h-8 bg-gray-200 rounded">
                {normalRange && (
                  <div 
                    className="absolute h-full bg-green-400 rounded"
                    style={{ 
                      left: `${toPercent(normalRange.low || 0)}%`, 
                      width: `${toPercent((normalRange.high || scale.max) - (normalRange.low || 0))}%` 
                    }}
                  />
                )}
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-green-800">
                  {normalRange ? `${normalRange.low} â€“ ${normalRange.high}` : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Critical Range */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-gray-700 flex items-center gap-1">
                Critical
                <button className="text-gray-400 hover:text-gray-600"><Info size={12} /></button>
              </div>
              <div className="flex-1 relative h-8 bg-gray-200 rounded">
                {criticalRange && criticalRange.low !== null && (
                  <div 
                    className="absolute h-full bg-red-400 rounded-l"
                    style={{ left: '0%', width: `${toPercent(criticalRange.low)}%` }}
                  />
                )}
                {criticalRange && criticalRange.high !== null && (
                  <div 
                    className="absolute h-full bg-red-400 rounded-r"
                    style={{ left: `${toPercent(criticalRange.high)}%`, right: '0' }}
                  />
                )}
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-red-800">
                  {criticalRange ? `<${criticalRange.low || 'â€”'} or >${criticalRange.high || 'â€”'}` : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Reporting Range */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-gray-700 flex items-center gap-1">
                Reporting
                <button className="text-gray-400 hover:text-gray-600"><Info size={12} /></button>
              </div>
              <div className="flex-1 relative h-8 bg-gray-200 rounded">
                {reportingRange && (
                  <div 
                    className="absolute h-full bg-purple-300 rounded"
                    style={{ 
                      left: `${toPercent(reportingRange.low || 0)}%`, 
                      width: `${toPercent((reportingRange.high || scale.max) - (reportingRange.low || 0))}%` 
                    }}
                  />
                )}
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-purple-800">
                  {reportingRange ? `${reportingRange.low} â€“ ${reportingRange.high}` : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span className="text-xs text-gray-600">Valid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span className="text-xs text-gray-600">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 rounded"></div>
            <span className="text-xs text-gray-600">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-300 rounded"></div>
            <span className="text-xs text-gray-600">Reporting</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Add Range Modal
// ============================================
const AddRangeModal = ({ rangeType, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sex: 'A',
    ageFrom: 0,
    ageFromUnit: 'days',
    ageTo: 999,
    ageToUnit: 'years',
    low: '',
    high: '',
  });

  const rangeTypeLabels = {
    normal: 'Normal Range',
    valid: 'Valid Range',
    critical: 'Critical Range',
    reporting: 'Reporting Range',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add {rangeTypeLabels[rangeType]}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Sex Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Applies To</label>
            <div className="flex gap-3">
              {[
                { value: 'A', label: 'All' },
                { value: 'M', label: 'Male Only' },
                { value: 'F', label: 'Female Only' },
              ].map(option => (
                <label 
                  key={option.value}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.sex === option.value 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-300 hover:bg-gray-50'
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
                  <span className="text-sm font-medium">{option.label}</span>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              Use 999 years for "to infinity" (no upper age limit)
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
                  {rangeType === 'critical' ? 'Critical Low (below)' : 'Low'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.low}
                  onChange={(e) => setFormData({...formData, low: e.target.value})}
                  placeholder={rangeType === 'critical' ? 'Leave blank if N/A' : '0'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {rangeType === 'critical' ? 'Critical High (above)' : 'High'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.high}
                  onChange={(e) => setFormData({...formData, high: e.target.value})}
                  placeholder={rangeType === 'critical' ? 'Leave blank if N/A' : '100'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            {rangeType === 'critical' && (
              <p className="text-xs text-gray-500 mt-2">
                Critical low: values below this trigger panic alerts. Critical high: values above this trigger panic alerts.
              </p>
            )}
          </div>

          {/* Coverage Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
              <div className="text-xs text-amber-700">
                <p className="font-medium">Coverage Check</p>
                <p>After saving, the system will validate that all age ranges are covered without gaps or overlaps.</p>
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
// Coverage Validation Panel
// ============================================
const CoverageValidationPanel = () => {
  const coverageData = {
    male: {
      complete: true,
      ranges: [
        { from: '0 days', to: '5 days', status: 'covered' },
        { from: '6 days', to: '14 days', status: 'covered' },
        { from: '15 days', to: '1 month', status: 'covered' },
        { from: '1 month', to: '1 year', status: 'covered' },
        { from: '1 year', to: 'âˆž', status: 'covered' },
      ]
    },
    female: {
      complete: false,
      ranges: [
        { from: '0 days', to: '55 days', status: 'covered' },
        { from: '56 days', to: '1 year', status: 'gap', message: 'Gap: 56 days to 1 year not covered' },
        { from: '1 year', to: 'âˆž', status: 'covered' },
      ]
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Age Coverage Validation</h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Male Coverage */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              Male
            </span>
            {coverageData.male.complete ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle size={14} />
                Complete
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={14} />
                Gaps detected
              </span>
            )}
          </div>
          <div className="space-y-1">
            {coverageData.male.ranges.map((range, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs ${
                  range.status === 'covered' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                <span>{range.from} â€“ {range.to}</span>
                <span>{range.status === 'covered' ? 'âœ“' : 'âœ—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Female Coverage */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-700">
              Female
            </span>
            {coverageData.female.complete ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle size={14} />
                Complete
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={14} />
                Gaps detected
              </span>
            )}
          </div>
          <div className="space-y-1">
            {coverageData.female.ranges.map((range, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs ${
                  range.status === 'covered' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                <span>{range.from} â€“ {range.to}</span>
                {range.status === 'gap' && <span title={range.message}>Gap!</span>}
                {range.status === 'covered' && <span>âœ“</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Export
// ============================================
export default function RangeEditorDemo() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Range Editor V2 - Age/Sex Specific Ranges</h1>
        <RangeEditorV2 />
        <CoverageValidationPanel />
      </div>
    </div>
  );
}
