import React, { useState } from 'react';
import {
  Clock, TrendingUp, TrendingDown, AlertTriangle, Activity, Eye,
  ArrowRight, ArrowUpRight, ArrowDownRight, ExternalLink, BarChart3
} from 'lucide-react';

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

// Chart colors for multi-series
const chartColors = ['#0E6B5E', '#0F62FE', '#8A3FFC', '#FF832B', '#DA1E28', '#198038'];
// HELPER: Format TAT
// ============================================
const formatTat = (hours) => {
  if (hours == null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatTatShort = (hours) => {
  if (hours == null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
};
// V2 Dashboard KPI data
const dashboardKPIs = [
  { label: 'Avg TAT Today', value: '2h 48m', change: -8, trend: 'down', color: colors.green },
  { label: 'STAT Avg TAT', value: '0h 42m', change: -12, trend: 'down', color: colors.green },
  { label: 'Breaching Target', value: '14', change: 3, trend: 'up', color: colors.red },
  { label: 'Orders in Progress', value: '67', change: 0, trend: 'flat', color: colors.blue },
];
const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variantStyles = {
    default: { bg: colors.gray100, color: colors.gray600 },
    success: { bg: colors.greenLight, color: colors.green },
    warning: { bg: colors.yellowLight, color: '#946200' },
    danger: { bg: colors.redLight, color: colors.red },
    info: { bg: colors.blueLight, color: colors.blue },
    teal: { bg: colors.tealLight, color: colors.tealPrimary },
    purple: { bg: colors.purpleLight, color: colors.purple },
    orange: { bg: colors.orangeLight, color: colors.orange },
  };
  const s = variantStyles[variant] || variantStyles.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: size === 'sm' ? '1px 8px' : '2px 10px',
      borderRadius: '9999px', fontSize: size === 'sm' ? '11px' : '12px',
      fontWeight: 500, backgroundColor: s.bg, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const TATDashboard = () => {

  const renderDashboard = () => (
    <div>
      <div style={{
        padding: '12px 16px', backgroundColor: colors.purpleLight, borderRadius: '6px',
        marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
        border: `1px solid ${colors.purple}33`,
      }}>
        <Eye size={16} color={colors.purple} />
        <span style={{ fontSize: '13px', color: colors.purple, fontWeight: 500 }}>
          V2 Preview — TAT Analytics Dashboard (future version with configurable targets and real-time monitoring)
        </span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {dashboardKPIs.map((kpi, i) => (
          <div key={i} style={{
            padding: '20px', backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
            borderRadius: '8px', borderLeft: `4px solid ${kpi.color}`,
          }}>
            <div style={{ fontSize: '12px', color: colors.gray500, fontWeight: 500, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {kpi.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: colors.gray900, lineHeight: 1 }}>{kpi.value}</span>
              <span style={{ 
                fontSize: '12px', fontWeight: 600, 
                color: kpi.trend === 'down' ? colors.green : kpi.trend === 'up' ? colors.red : colors.gray400,
                marginBottom: '4px',
              }}>
                {kpi.trend === 'down' ? '↓' : kpi.trend === 'up' ? '↑' : '—'} {kpi.change !== 0 ? `${Math.abs(kpi.change)}%` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Target Compliance Grid */}
      <div style={{
        backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
        borderRadius: '6px', padding: '20px', marginBottom: '24px',
      }}>
        <SectionDivider label="Target Compliance by Lab Unit" action={
          <Badge variant="info">Configurable Targets</Badge>
        } />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}` }}>Lab Unit</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}` }}>Target</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}` }}>Current Median</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}` }}>Compliance</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: colors.gray600, backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray100}`, width: '200px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { unit: 'Hematology', target: '2h', median: '1h 48m', compliance: 94, status: 'ok' },
              { unit: 'Chemistry', target: '4h', median: '3h 10m', compliance: 87, status: 'ok' },
              { unit: 'Serology', target: '4h', median: '3h 30m', compliance: 82, status: 'warning' },
              { unit: 'Parasitology', target: '2h', median: '1h 15m', compliance: 96, status: 'ok' },
              { unit: 'Microbiology', target: '72h', median: '42h', compliance: 91, status: 'ok' },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{row.unit}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: colors.gray500 }}>≤ {row.target}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{row.median}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <span style={{ fontWeight: 600, color: row.compliance >= 90 ? colors.green : row.compliance >= 80 ? '#946200' : colors.red }}>
                    {row.compliance}%
                  </span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ flex: 1, maxWidth: '120px', height: '8px', backgroundColor: colors.gray100, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${row.compliance}%`, height: '100%', borderRadius: '4px',
                        backgroundColor: row.compliance >= 90 ? colors.green : row.compliance >= 80 ? colors.yellow : colors.red,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    {row.compliance >= 90 ? (
                      <CheckCircle2 size={16} color={colors.green} />
                    ) : (
                      <AlertTriangle size={16} color={colors.yellow} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mini Trend + Delayed Orders Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 7-Day Trend */}
        <div style={{
          backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
          borderRadius: '6px', padding: '20px',
        }}>
          <SectionDivider label="7-Day TAT Trend (Median)" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData.slice(-7)} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gray100} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.gray500 }} />
              <YAxis tick={{ fontSize: 10, fill: colors.gray500 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="median" stroke={colors.tealPrimary} strokeWidth={2.5} dot={{ r: 3, fill: colors.tealPrimary }} name="Median TAT" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Delayed Orders */}
        <div style={{
          backgroundColor: colors.white, border: `1px solid ${colors.gray100}`,
          borderRadius: '6px', padding: '20px',
        }}>
          <SectionDivider label="Currently Exceeding Target" action={
            <Badge variant="danger">14 orders</Badge>
          } />
          <div style={{ fontSize: '13px' }}>
            {[
              { lab: 'DEV01260000042', test: 'Blood Culture', unit: 'Micro', tat: '96h 30m', target: '72h' },
              { lab: 'DEV01260000038', test: 'AFB Smear', unit: 'Micro', tat: '78h 15m', target: '72h' },
              { lab: 'DEV01260000051', test: 'HIV Viral Load', unit: 'Serology', tat: '8h 20m', target: '4h' },
              { lab: 'DEV01260000055', test: 'TSH', unit: 'Chemistry', tat: '5h 45m', target: '4h' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '8px 12px', borderBottom: `1px solid ${colors.gray100}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <a href="#" style={{ color: colors.tealPrimary, textDecoration: 'none', fontWeight: 500, fontSize: '12px' }} onClick={e => e.preventDefault()}>
                    {item.lab}
                  </a>
                  <div style={{ fontSize: '12px', color: colors.gray500 }}>{item.test} · {item.unit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: colors.red, fontSize: '13px' }}>{item.tat}</div>
                  <div style={{ fontSize: '11px', color: colors.gray400 }}>target: ≤ {item.target}</div>
                </div>
              </div>
            ))}
            <div style={{ padding: '8px 12px', textAlign: 'center' }}>
              <a href="#" style={{ color: colors.tealPrimary, fontSize: '12px', textDecoration: 'none' }} onClick={e => e.preventDefault()}>
                View all 14 orders →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          <span style={{ color: colors.gray400, fontSize: '13px' }}>▸ Reports</span>
          <span style={{ color: colors.gray400, fontSize: '13px' }}>▸ Turn Around Time</span>
          <span style={{ color: colors.gray400, fontSize: '13px' }}>▸ Dashboard</span>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: colors.gray900, margin: '0 0 4px 0' }}>
            TAT Analytics Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: colors.gray500, margin: 0 }}>
            Real-time turnaround time monitoring and target compliance
          </p>
        </div>
        {renderDashboard()}
      </div>
    </div>
  );
};

export default TATDashboard;
