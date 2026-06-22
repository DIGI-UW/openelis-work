import React, { useState } from 'react';
import {
  Download, Filter, Clock, ChevronRight, X, Calendar, Info,
  ArrowUpDown, ChevronLeft, ExternalLink
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';

// ============================================
// COLOR PALETTE (OpenELIS / Carbon-like)
// ============================================
const colors = {
  tealPrimary: '#0E6B5E',
  tealDark: '#0A5249',
  tealLight: '#E6F5F2',
  tealMedium: '#B8DDD6',
  blue: '#0F62FE',
  blueLight: '#EDF5FF',
  green: '#198038',
  greenLight: '#DEFBE6',
  yellow: '#F1C21B',
  yellowLight: '#FFF8E1',
  orange: '#FF832B',
  orangeLight: '#FFF3EB',
  red: '#DA1E28',
  redLight: '#FFF1F1',
  purple: '#8A3FFC',
  purpleLight: '#F6F2FF',
  gray900: '#161616',
  gray800: '#262626',
  gray700: '#393939',
  gray600: '#525252',
  gray500: '#6F6F6F',
  gray400: '#8D8D8D',
  gray300: '#A8A8A8',
  gray200: '#C6C6C6',
  gray100: '#E0E0E0',
  gray50: '#F4F4F4',
  white: '#FFFFFF',
};

// ============================================
// MOCK DATA
// ============================================
const SEGMENTS = [
  { value: 'order-collection', label: 'Order to Collection' },
  { value: 'collection-receipt', label: 'Collection to Receipt' },
  { value: 'receipt-testing', label: 'Receipt to Testing Started' },
  { value: 'testing-result', label: 'Testing to Result Entry' },
  { value: 'result-validation', label: 'Result to Validation' },
  { value: 'receipt-validation', label: 'Receipt to Validation' },
  { value: 'overall', label: 'Overall (Order to Validation)' },
];

const STAT_CARDS = [
  { label: 'Total Results', value: '156', unit: '' },
  { label: 'Mean', value: '4h 32m', unit: '' },
  { label: 'Median', value: '3h 15m', unit: '' },
  { label: '90th Percentile', value: '8h 45m', unit: '' },
  { label: 'Min', value: '0h 12m', unit: '' },
  { label: 'Max', value: '72h 08m', unit: '' },
  { label: 'Std Dev', value: '6h 22m', unit: '' },
];

const HISTOGRAM_DATA = [
  { bin: '0-1h', count: 18, color: colors.green },
  { bin: '1-2h', count: 32, color: colors.green },
  { bin: '2-3h', count: 28, color: '#4CAF50' },
  { bin: '3-4h', count: 22, color: colors.yellow },
  { bin: '4-6h', count: 19, color: colors.yellow },
  { bin: '6-8h', count: 14, color: colors.orange },
  { bin: '8-12h', count: 10, color: colors.orange },
  { bin: '12-24h', count: 7, color: colors.red },
  { bin: '24-48h', count: 4, color: colors.red },
  { bin: '48h+', count: 2, color: '#8B0000' },
];

const BREAKDOWN_DATA = [
  { labUnit: 'Hematology', count: 48, mean: '3h 12m', median: '2h 45m', p90: '6h 30m' },
  { labUnit: 'Chemistry', count: 42, mean: '4h 55m', median: '3h 30m', p90: '9h 15m' },
  { labUnit: 'Microbiology', count: 28, mean: '8h 22m', median: '6h 10m', p90: '18h 45m' },
  { labUnit: 'Serology', count: 22, mean: '3h 48m', median: '2h 55m', p90: '7h 20m' },
  { labUnit: 'Parasitology', count: 16, mean: '2h 15m', median: '1h 50m', p90: '4h 10m' },
];

const DETAIL_DATA = [
  { labNo: 'LAB-2026-001234', testName: 'CBC', labUnit: 'Hematology', priority: 'ROUTINE', sampleType: 'Whole Blood', collected: '08:12', received: '08:45', started: '09:10', resulted: '09:52', validated: '10:15', selectedTat: '1h 30m', overallTat: '2h 03m' },
  { labNo: 'LAB-2026-001235', testName: 'Blood Culture', labUnit: 'Microbiology', priority: 'STAT', sampleType: 'Blood', collected: '07:30', received: '07:42', started: '08:00', resulted: '14:30', validated: '15:10', selectedTat: '7h 28m', overallTat: '7h 40m' },
  { labNo: 'LAB-2026-001236', testName: 'Liver Panel', labUnit: 'Chemistry', priority: 'ROUTINE', sampleType: 'Serum', collected: '09:00', received: '09:35', started: '10:15', resulted: '11:30', validated: '12:05', selectedTat: '2h 30m', overallTat: '3h 05m' },
  { labNo: 'LAB-2026-001237', testName: 'Malaria RDT', labUnit: 'Parasitology', priority: 'STAT', sampleType: 'Whole Blood', collected: '06:45', received: '06:52', started: '07:00', resulted: '07:22', validated: '07:35', selectedTat: '0h 43m', overallTat: '0h 50m' },
  { labNo: 'LAB-2026-001238', testName: 'HIV ELISA', labUnit: 'Serology', priority: 'ROUTINE', sampleType: 'Serum', collected: '10:20', received: '10:55', started: '11:30', resulted: '13:15', validated: '14:00', selectedTat: '3h 05m', overallTat: '3h 40m' },
  { labNo: 'LAB-2026-001239', testName: 'BMP', labUnit: 'Chemistry', priority: 'ROUTINE', sampleType: 'Serum', collected: '11:00', received: '11:40', started: '12:20', resulted: '13:45', validated: '14:30', selectedTat: '2h 50m', overallTat: '3h 30m' },
];

const TREND_DATA = [
  { date: 'Mar 25', median: 3.2, p90: 8.5, volume: 22 },
  { date: 'Mar 26', median: 3.5, p90: 9.1, volume: 25 },
  { date: 'Mar 27', median: 2.8, p90: 7.8, volume: 20 },
  { date: 'Mar 28', median: 3.1, p90: 8.2, volume: 24 },
  { date: 'Mar 29', median: 4.2, p90: 11.3, volume: 18 },
  { date: 'Mar 30', median: 3.0, p90: 7.5, volume: 26 },
  { date: 'Mar 31', median: 3.4, p90: 8.9, volume: 21 },
];

const DATE_PRESETS = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'This month', 'Last month', 'Custom'];

// ============================================
// BADGE COMPONENT
// ============================================
const Badge = ({ children, bg, color: textColor }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 10px', borderRadius: '9999px', fontSize: '12px',
    fontWeight: 500, backgroundColor: bg, color: textColor,
    whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

// ============================================
// SUMMARY TAB
// ============================================
const SummaryTab = () => (
  <div>
    {/* Stat Cards */}
    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
      {STAT_CARDS.map((card, i) => (
        <div key={i} style={{
          flex: '1 1 140px', minWidth: '130px',
          backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
          borderRadius: '6px', overflow: 'hidden',
        }}>
          <div style={{
            height: '4px', backgroundColor: colors.tealPrimary,
          }} />
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: colors.gray900 }}>
              {card.value}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Histogram */}
    <div style={{
      backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
      borderRadius: '6px', padding: '20px', marginBottom: '24px',
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.gray800, margin: '0 0 16px 0' }}>
        Distribution of TAT
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={HISTOGRAM_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gray100} />
          <XAxis dataKey="bin" tick={{ fontSize: 12, fill: colors.gray500 }} />
          <YAxis tick={{ fontSize: 12, fill: colors.gray500 }} />
          <Tooltip
            contentStyle={{ fontSize: '12px', border: `1px solid ${colors.gray200}`, borderRadius: '4px' }}
            formatter={(value) => [`${value} results`, 'Count']}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {HISTOGRAM_DATA.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Breakdown Table */}
    <div style={{
      backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
      borderRadius: '6px', overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.gray100}` }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.gray800, margin: 0 }}>
          Breakdown by Lab Unit
        </h3>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            {['Lab Unit', 'Count', 'Mean', 'Median', '90th Percentile'].map(h => (
              <th key={h} style={{
                padding: '10px 16px', textAlign: h === 'Lab Unit' ? 'left' : 'right',
                fontWeight: 600, fontSize: '12px', color: colors.gray600,
                backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}`,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BREAKDOWN_DATA.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${colors.gray100}` }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.gray50}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td style={{ padding: '10px 16px', fontWeight: 500, color: colors.gray800 }}>{row.labUnit}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', color: colors.gray600 }}>{row.count}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', color: colors.gray600 }}>{row.mean}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', color: colors.gray800, fontWeight: 500 }}>{row.median}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', color: colors.orange, fontWeight: 500 }}>{row.p90}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ============================================
// DETAIL LIST TAB
// ============================================
const DetailListTab = () => (
  <div>
    {/* Toolbar */}
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '12px',
    }}>
      <div style={{ fontSize: '13px', color: colors.gray500 }}>
        Showing 1-6 of 156 results
      </div>
      <button style={{
        padding: '6px 12px', backgroundColor: colors.white, border: `1px solid ${colors.gray200}`,
        borderRadius: '4px', fontSize: '12px', color: colors.gray600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        <Download size={14} /> Export CSV
      </button>
    </div>

    {/* Table */}
    <div style={{
      backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
      borderRadius: '6px', overflow: 'auto',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1100px' }}>
        <thead>
          <tr>
            {['Lab No.', 'Test', 'Lab Unit', 'Priority', 'Sample Type', 'Collected', 'Received', 'Started', 'Resulted', 'Validated', 'Segment TAT', 'Overall TAT'].map(h => (
              <th key={h} style={{
                padding: '10px 12px', textAlign: 'left',
                fontWeight: 600, fontSize: '11px', color: colors.gray600,
                backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}`,
                whiteSpace: 'nowrap',
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                  {h} <ArrowUpDown size={10} color={colors.gray400} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DETAIL_DATA.map((row, i) => (
            <tr key={i} style={{
              borderBottom: `1px solid ${colors.gray100}`,
              borderLeft: row.priority === 'STAT' ? `3px solid ${colors.red}` : '3px solid transparent',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.gray50}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td style={{ padding: '8px 12px', fontWeight: 500, color: colors.tealPrimary, whiteSpace: 'nowrap' }}>{row.labNo}</td>
              <td style={{ padding: '8px 12px', color: colors.gray800 }}>{row.testName}</td>
              <td style={{ padding: '8px 12px', color: colors.gray600 }}>{row.labUnit}</td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{
                  padding: '1px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 500,
                  backgroundColor: row.priority === 'STAT' ? colors.redLight : colors.gray50,
                  color: row.priority === 'STAT' ? colors.red : colors.gray600,
                }}>
                  {row.priority}
                </span>
              </td>
              <td style={{ padding: '8px 12px', color: colors.gray600, whiteSpace: 'nowrap' }}>{row.sampleType}</td>
              <td style={{ padding: '8px 12px', color: colors.gray500, fontFamily: 'monospace', fontSize: '11px' }}>{row.collected}</td>
              <td style={{ padding: '8px 12px', color: colors.gray500, fontFamily: 'monospace', fontSize: '11px' }}>{row.received}</td>
              <td style={{ padding: '8px 12px', color: colors.gray500, fontFamily: 'monospace', fontSize: '11px' }}>{row.started}</td>
              <td style={{ padding: '8px 12px', color: colors.gray500, fontFamily: 'monospace', fontSize: '11px' }}>{row.resulted}</td>
              <td style={{ padding: '8px 12px', color: colors.gray500, fontFamily: 'monospace', fontSize: '11px' }}>{row.validated}</td>
              <td style={{ padding: '8px 12px', fontWeight: 500, color: colors.gray800 }}>{row.selectedTat}</td>
              <td style={{ padding: '8px 12px', fontWeight: 500, color: colors.gray800 }}>{row.overallTat}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', fontSize: '12px', color: colors.gray500,
    }}>
      <span>1-6 of 156</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button disabled style={{
          padding: '4px 8px', border: `1px solid ${colors.gray200}`, borderRadius: '4px',
          backgroundColor: colors.white, color: colors.gray300, cursor: 'not-allowed', fontSize: '12px',
        }}>
          <ChevronLeft size={14} />
        </button>
        <button style={{
          padding: '4px 10px', border: `1px solid ${colors.gray200}`, borderRadius: '4px',
          backgroundColor: colors.tealPrimary, color: colors.white, cursor: 'pointer', fontSize: '12px', fontWeight: 500,
        }}>1</button>
        <button style={{
          padding: '4px 10px', border: `1px solid ${colors.gray200}`, borderRadius: '4px',
          backgroundColor: colors.white, color: colors.gray600, cursor: 'pointer', fontSize: '12px',
        }}>2</button>
        <button style={{
          padding: '4px 10px', border: `1px solid ${colors.gray200}`, borderRadius: '4px',
          backgroundColor: colors.white, color: colors.gray600, cursor: 'pointer', fontSize: '12px',
        }}>...</button>
        <button style={{
          padding: '4px 10px', border: `1px solid ${colors.gray200}`, borderRadius: '4px',
          backgroundColor: colors.white, color: colors.gray600, cursor: 'pointer', fontSize: '12px',
        }}>26</button>
        <button style={{
          padding: '4px 8px', border: `1px solid ${colors.gray200}`, borderRadius: '4px',
          backgroundColor: colors.white, color: colors.gray600, cursor: 'pointer', fontSize: '12px',
        }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  </div>
);

// ============================================
// TRENDS TAB
// ============================================
const TrendsTab = () => (
  <div>
    {/* Interval selector */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.gray800, margin: 0 }}>
        TAT Trends
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '12px', color: colors.gray500 }}>Interval:</label>
        <select style={{
          padding: '5px 10px', border: `1px solid ${colors.gray200}`, borderRadius: '4px',
          fontSize: '12px', backgroundColor: colors.white,
        }}>
          <option>Daily</option>
          <option>Weekly</option>
          <option>Monthly</option>
        </select>
      </div>
    </div>

    {/* Chart */}
    <div style={{
      backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
      borderRadius: '6px', padding: '20px',
    }}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={TREND_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gray100} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.gray500 }} />
          <YAxis tick={{ fontSize: 12, fill: colors.gray500 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: colors.gray500 } }} />
          <Tooltip
            contentStyle={{ fontSize: '12px', border: `1px solid ${colors.gray200}`, borderRadius: '4px' }}
            formatter={(value, name) => {
              const label = name === 'median' ? 'Median' : name === 'p90' ? '90th Percentile' : 'Volume';
              return [`${value}${name === 'volume' ? ' results' : 'h'}`, label];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => value === 'median' ? 'Median' : '90th Percentile'}
          />
          <Bar dataKey="median" fill={colors.tealPrimary} radius={[3, 3, 0, 0]} name="median" />
          <Bar dataKey="p90" fill={colors.orange} radius={[3, 3, 0, 0]} name="p90" />
        </BarChart>
      </ResponsiveContainer>

      {/* Volume overlay note */}
      <div style={{
        marginTop: '12px', padding: '8px 12px', backgroundColor: colors.gray50,
        borderRadius: '4px', fontSize: '12px', color: colors.gray500,
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <Info size={14} />
        Daily volume: {TREND_DATA.map(d => d.volume).join(', ')} results
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const TATReport = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [datePreset, setDatePreset] = useState('Last 30 days');
  const [calcMode, setCalcMode] = useState('working');
  const [segment, setSegment] = useState('receipt-validation');
  const [includeCancelled, setIncludeCancelled] = useState(false);

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'detail', label: 'Detail List' },
    { id: 'trends', label: 'Trends' },
  ];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: colors.gray50, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: colors.tealPrimary, padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: colors.white, fontSize: '14px', fontWeight: 600 }}>OpenELIS Global</span>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ color: colors.tealPrimary, fontSize: '13px', cursor: 'pointer' }}>Home</span>
          <span style={{ color: colors.gray400, fontSize: '13px' }}>&#9656; Reports</span>
          <span style={{ color: colors.gray400, fontSize: '13px' }}>&#9656; TAT Report</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: colors.gray900, margin: '0 0 4px 0' }}>
            Turn Around Time Report
          </h1>
          <p style={{ fontSize: '14px', color: colors.gray500, margin: 0 }}>
            Analyze laboratory turnaround times across configurable workflow segments
          </p>
        </div>

        {/* Filter Bar */}
        <div style={{
          backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
          borderRadius: '6px', padding: '16px 20px', marginBottom: '16px',
        }}>
          {/* Row 1: Date presets */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: colors.gray600, marginBottom: '6px', display: 'block' }}>
              Date Range
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DATE_PRESETS.map(preset => (
                <button key={preset} onClick={() => setDatePreset(preset)} style={{
                  padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
                  border: datePreset === preset ? `1px solid ${colors.tealPrimary}` : `1px solid ${colors.gray200}`,
                  backgroundColor: datePreset === preset ? colors.tealLight : colors.white,
                  color: datePreset === preset ? colors.tealPrimary : colors.gray600,
                  cursor: 'pointer',
                }}>
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Date From, Date To, Segment */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: colors.gray600, marginBottom: '4px', display: 'block' }}>Date From</label>
              <input type="date" defaultValue="2026-03-01" style={{
                width: '100%', padding: '7px 10px', border: `1px solid ${colors.gray200}`,
                borderRadius: '4px', fontSize: '13px', backgroundColor: colors.white, boxSizing: 'border-box',
              }} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: colors.gray600, marginBottom: '4px', display: 'block' }}>Date To</label>
              <input type="date" defaultValue="2026-03-31" style={{
                width: '100%', padding: '7px 10px', border: `1px solid ${colors.gray200}`,
                borderRadius: '4px', fontSize: '13px', backgroundColor: colors.white, boxSizing: 'border-box',
              }} />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: colors.gray600, marginBottom: '4px', display: 'block' }}>TAT Segment</label>
              <select value={segment} onChange={e => setSegment(e.target.value)} style={{
                width: '100%', padding: '7px 10px', border: `1px solid ${colors.gray200}`,
                borderRadius: '4px', fontSize: '13px', backgroundColor: colors.white, boxSizing: 'border-box',
              }}>
                {SEGMENTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Lab Unit, Test/Panel, Priority, Sample Type, Ordering Site */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Lab Unit', placeholder: 'All Units' },
              { label: 'Test / Panel', placeholder: 'All Tests' },
              { label: 'Priority', placeholder: 'All Priorities' },
              { label: 'Sample Type', placeholder: 'All Types' },
              { label: 'Ordering Site', placeholder: 'All Sites' },
            ].map(field => (
              <div key={field.label} style={{ flex: '1 1 150px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: colors.gray600, marginBottom: '4px', display: 'block' }}>{field.label}</label>
                <select style={{
                  width: '100%', padding: '7px 10px', border: `1px solid ${colors.gray200}`,
                  borderRadius: '4px', fontSize: '13px', backgroundColor: colors.white,
                  color: colors.gray400, boxSizing: 'border-box',
                }}>
                  <option>{field.placeholder}</option>
                </select>
              </div>
            ))}
          </div>

          {/* Row 4: Calculation mode toggle, Include Cancelled, Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Calendar / Working Time toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: colors.gray600, marginRight: '4px' }}>Mode:</label>
                {['calendar', 'working'].map(mode => (
                  <button key={mode} onClick={() => setCalcMode(mode)} style={{
                    padding: '5px 14px', fontSize: '12px', fontWeight: 500,
                    border: `1px solid ${calcMode === mode ? colors.tealPrimary : colors.gray200}`,
                    backgroundColor: calcMode === mode ? colors.tealPrimary : colors.white,
                    color: calcMode === mode ? colors.white : colors.gray600,
                    borderRadius: mode === 'calendar' ? '4px 0 0 4px' : '0 4px 4px 0',
                    cursor: 'pointer',
                  }}>
                    {mode === 'calendar' ? 'Calendar Time' : 'Working Time'}
                  </button>
                ))}
              </div>

              {/* Include Cancelled */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.gray600, cursor: 'pointer' }}>
                <input type="checkbox" checked={includeCancelled} onChange={e => setIncludeCancelled(e.target.checked)} />
                Include Cancelled / Rejected
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{
                padding: '8px 20px', backgroundColor: colors.tealPrimary, color: colors.white,
                border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <Filter size={14} /> Generate
              </button>
              <button style={{
                padding: '8px 16px', backgroundColor: colors.white, color: colors.gray600,
                border: `1px solid ${colors.gray200}`, borderRadius: '4px', fontSize: '13px', cursor: 'pointer',
              }}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Working Time info bar */}
        {calcMode === 'working' && (
          <div style={{
            background: colors.blueLight, border: `1px solid #C1DEFF`,
            borderRadius: '4px', padding: '10px 16px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.gray700,
          }}>
            <Info size={16} color={colors.blue} />
            <span>
              <strong>Working Time mode:</strong> 8 weekend days and 2 holidays excluded from calculations.{' '}
              <a href="#" style={{ color: colors.blue, textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                Manage Calendar <ExternalLink size={12} />
              </a>
            </span>
          </div>
        )}

        {/* Filter summary badges */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Badge bg={colors.blue} textColor={colors.white}>Receipt to Validation</Badge>
          <Badge bg={colors.purple} textColor={colors.white}>Working Time</Badge>
          <Badge bg={colors.gray600} textColor={colors.white}>2026-03-01 &mdash; 2026-03-31</Badge>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0', borderBottom: `2px solid ${colors.gray100}`, marginBottom: '20px',
        }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 20px', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? colors.tealPrimary : colors.gray500,
              backgroundColor: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${colors.tealPrimary}` : '2px solid transparent',
              cursor: 'pointer', marginBottom: '-2px',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && <SummaryTab />}
        {activeTab === 'detail' && <DetailListTab />}
        {activeTab === 'trends' && <TrendsTab />}
      </div>
    </div>
  );
};

export default TATReport;
