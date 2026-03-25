import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Calendar, Download,
  AlertTriangle, CheckCircle, Clock, Users, FileText, 
  ArrowUp, ArrowDown, Activity, RefreshCw, Filter
} from 'lucide-react';

const MetricCard = ({ title, value, change, positive, icon: Icon, color }) => (
  <div className="bg-white rounded-lg border p-4">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
          {change}
        </div>
      )}
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs text-gray-500 mt-1">{title}</div>
  </div>
);

const SimpleBar = ({ label, value, max, color }) => (
  <div className="flex items-center gap-3">
    <div className="w-32 text-sm text-right truncate">{label}</div>
    <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
      <div className={`h-6 rounded-full ${color} flex items-center justify-end pr-2`}
        style={{ width: `${Math.max((value / max) * 100, 8)}%` }}>
        <span className="text-xs font-medium text-white">{value}</span>
      </div>
    </div>
  </div>
);

const PieSlice = ({ color, label, value, total }) => {
  const pct = ((value / total) * 100).toFixed(0);
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-sm ${color}`}></div>
      <span className="text-sm flex-1">{label}</span>
      <span className="text-sm font-medium">{value}</span>
      <span className="text-xs text-gray-500">({pct}%)</span>
    </div>
  );
};

const TrendLine = ({ data, height = 120 }) => {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((d.value - min) / range) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height }}>
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <polyline fill="none" stroke="#0d9488" strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = height - ((d.value - min) / range) * (height - 20) - 10;
          return <circle key={i} cx={x} cy={y} r="3" fill="#0d9488" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        {data.filter((_, i) => i % 2 === 0).map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
};

export default function NCEAnalytics() {
  const [dateRange, setDateRange] = useState('30d');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const trendData = [
    { label: 'Week 1', value: 8 }, { label: 'Week 2', value: 12 },
    { label: 'Week 3', value: 9 }, { label: 'Week 4', value: 15 },
    { label: 'Week 5', value: 11 }, { label: 'Week 6', value: 7 },
    { label: 'Week 7', value: 10 }, { label: 'Week 8', value: 13 },
  ];

  const categoryData = [
    { label: 'Pre-Analytical', value: 22, color: 'bg-blue-500' },
    { label: 'Analytical', value: 12, color: 'bg-green-500' },
    { label: 'Post-Analytical', value: 8, color: 'bg-purple-500' },
    { label: 'Administrative', value: 5, color: 'bg-gray-500' },
  ];
  const totalCategory = categoryData.reduce((s, d) => s + d.value, 0);

  const severityData = [
    { label: 'Critical', value: 5, color: 'bg-red-500' },
    { label: 'Major', value: 22, color: 'bg-orange-500' },
    { label: 'Minor', value: 20, color: 'bg-yellow-500' },
  ];
  const maxSeverity = Math.max(...severityData.map(d => d.value));

  const rootCauseData = [
    { label: 'Human Error', value: 15, color: 'bg-red-400' },
    { label: 'Specimen Issue', value: 10, color: 'bg-orange-400' },
    { label: 'Process Gap', value: 7, color: 'bg-amber-400' },
    { label: 'Equipment Failure', value: 5, color: 'bg-yellow-400' },
    { label: 'Training Deficiency', value: 4, color: 'bg-lime-400' },
    { label: 'Environmental', value: 3, color: 'bg-green-400' },
    { label: 'Reagent/Supply', value: 2, color: 'bg-teal-400' },
    { label: 'Other', value: 1, color: 'bg-gray-400' },
  ];
  const maxRootCause = Math.max(...rootCauseData.map(d => d.value));

  const rejectionReasonData = [
    { label: 'Hemolyzed', value: 12, color: 'bg-red-400' },
    { label: 'QNS', value: 8, color: 'bg-orange-400' },
    { label: 'Missing Label', value: 6, color: 'bg-amber-400' },
    { label: 'Clotted', value: 5, color: 'bg-yellow-400' },
    { label: 'Wrong Tube', value: 4, color: 'bg-lime-400' },
  ];
  const maxRejection = Math.max(...rejectionReasonData.map(d => d.value));

  const triggerData = [
    { label: 'Mandatory', value: 18, color: 'bg-red-400' },
    { label: 'Prompted', value: 15, color: 'bg-amber-400' },
    { label: 'Manual', value: 14, color: 'bg-blue-400' },
  ];
  const maxTrigger = Math.max(...triggerData.map(d => d.value));

  const dismissalRate = 23;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-teal-600" /> NCE Analytics
            </h1>
            <p className="text-sm text-gray-500">Quality metrics and trend analysis</p>
          </div>
          <div className="flex gap-2">
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="12m">Last 12 Months</option>
              <option value="custom">Custom Range</option>
            </select>
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-1">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard title="Total NCEs" value="47" change="12% vs prior" positive={false}
            icon={AlertTriangle} color="bg-amber-100 text-amber-700" />
          <MetricCard title="Avg Resolution" value="5.2 days" change="0.8 days" positive={true}
            icon={Clock} color="bg-blue-100 text-blue-700" />
          <MetricCard title="CAPA Effective" value="94%" change="2%" positive={true}
            icon={CheckCircle} color="bg-green-100 text-green-700" />
          <MetricCard title="Recurrence Rate" value="6%" change="2%" positive={true}
            icon={RefreshCw} color="bg-purple-100 text-purple-700" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          {/* NCE Trend */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" /> NCE Trend (Weekly)
            </h3>
            <TrendLine data={trendData} />
          </div>

          {/* By Category */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">NCEs by Category</h3>
            <div className="flex gap-6">
              {/* Simple visual pie representation */}
              <div className="w-32 h-32 rounded-full border-8 border-blue-500 relative flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold">{totalCategory}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {categoryData.map(d => (
                  <PieSlice key={d.label} color={d.color} label={d.label} value={d.value} total={totalCategory} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          {/* By Severity */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">NCEs by Severity</h3>
            <div className="space-y-3">
              {severityData.map(d => <SimpleBar key={d.label} label={d.label} value={d.value} max={maxSeverity} color={d.color} />)}
            </div>
          </div>

          {/* By Trigger Type */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">NCEs by Trigger Type</h3>
            <div className="space-y-3">
              {triggerData.map(d => <SimpleBar key={d.label} label={d.label} value={d.value} max={maxTrigger} color={d.color} />)}
            </div>
            <div className="mt-3 pt-3 border-t text-sm text-gray-600">
              Prompted NCEs dismissed: <strong className="text-amber-700">{dismissalRate}%</strong>
            </div>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-2 gap-4">
          {/* Root Cause Pareto */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">Root Cause Analysis (Pareto)</h3>
            <div className="space-y-2">
              {rootCauseData.map(d => <SimpleBar key={d.label} label={d.label} value={d.value} max={maxRootCause} color={d.color} />)}
            </div>
          </div>

          {/* Top Rejection Reasons */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">Top 5 Rejection Reasons</h3>
            <div className="space-y-2">
              {rejectionReasonData.map(d => <SimpleBar key={d.label} label={d.label} value={d.value} max={maxRejection} color={d.color} />)}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">Average Time to Closure by Category</h3>
            <div className="space-y-2">
              {[
                { label: 'Pre-Analytical', days: 3.2 },
                { label: 'Analytical', days: 6.8 },
                { label: 'Post-Analytical', days: 4.5 },
                { label: 'Administrative', days: 8.1 },
              ].map(d => (
                <div key={d.label} className="flex justify-between text-sm">
                  <span>{d.label}</span>
                  <span className="font-medium">{d.days} days</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">CAPA Completion Rate</h3>
            <div className="space-y-2">
              {[
                { label: 'Completed on time', value: 28, color: 'bg-green-500' },
                { label: 'Completed late', value: 5, color: 'bg-amber-500' },
                { label: 'In Progress', value: 8, color: 'bg-blue-500' },
                { label: 'Overdue', value: 2, color: 'bg-red-500' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${d.color}`}></div>
                  <span className="text-sm flex-1">{d.label}</span>
                  <span className="text-sm font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">NCEs by Department</h3>
            <div className="space-y-2">
              {[
                { label: 'Chemistry', value: 15 },
                { label: 'Hematology', value: 12 },
                { label: 'Microbiology', value: 8 },
                { label: 'Phlebotomy', value: 7 },
                { label: 'Pathology', value: 5 },
              ].map((d, i) => (
                <div key={d.label} className="flex justify-between text-sm">
                  <span>{d.label}</span>
                  <span className="font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
