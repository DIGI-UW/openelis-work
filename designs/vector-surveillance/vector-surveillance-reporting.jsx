/**
 * V-04 Vector Surveillance Reporting — React Mockup (v1.4)
 * Spec: vector-surveillance-reporting.md (v1.4)
 * Jira: OGC-585 (Epic: OGC-527)
 *
 * This component is the OpenELIS embedding shell for the Superset dashboard.
 * It does NOT contain custom charts — Superset owns all charting.
 *
 * Screens:
 *  1. Loading state   — while guest token is being fetched
 *  2. Error state     — Superset unreachable / token fetch failed
 *  3. Connected state — iframe with embedded Superset dashboard
 *  4. Infrastructure  — architecture diagram tab (design reference)
 *
 * v1.4 changes (vector expert validation pass):
 *  - Trap type stratification reactivated (V-04 §17.2 → completed). Dashboard #1 and #5
 *    gain trap-type filter dropdowns (passive traps + active collection methods).
 *  - Dashboard #4 gains a third toggle option: Sporozoite Rate (%). Same numerator as
 *    Observed, rescaled to per-100. Auto-disabled when positive_resolution_pct < 95%.
 *  - Lifecycle stage stratification across surveillance views; Dashboard #4 defaults
 *    to ADULT-only with toggle to include other stages.
 *  - NEW §6.6 Export Adapters — eWARS + SILANTOR CSV (column lists pending schema docs).
 *
 * v1.3 changes (FRS crosswalk April 2026):
 *  - V-04 v1.1 — trap_type removed from views and FHIR mapping (deferred per §17.2);
 *    pool_flag derived from quantity > 1; renamed vector_collection_lots →
 *    vector_collection_samples and vector_trap_catch_daily → vector_collection_density_daily.
 *  - V-04 v1.2 — QC exclusion: surveillance views filter QC samples (analysis_qaevent join);
 *    new vector_qc_monitoring view + Dashboard #7 "QC Pass Rate".
 *  - V-04 v1.3 — dual MIR metrics: classical (mir_classic) + hybrid (infection_rate_per_1000)
 *    with positive_resolution_pct diagnostic. Dashboard #4 toggle (ContentSwitcher).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Column, Stack,
  Button, Tag, Select, SelectItem, DatePicker, DatePickerInput,
  InlineNotification, Loading, Tile,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell,
  Accordion, AccordionItem,
  CodeSnippet,
} from '@carbon/react';
import {
  Launch, DocumentDownload, Renew, CheckmarkFilled,
  WarningFilled, ErrorFilled, ChevronDown, ChevronUp,
} from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// i18n stub
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Seed data — simulated API responses
// ---------------------------------------------------------------------------
const SITES = [
  { id: 'all',    name: t('label.vectorReport.siteFilter.all', 'All Sites') },
  { id: '1',      name: 'Bojongsoang — BPP-01' },
  { id: '2',      name: 'Margahayu — BPP-02' },
  { id: '3',      name: 'Antapani — BPP-03' },
  { id: '4',      name: 'Cileunyi — CIL-02' },
  { id: '5',      name: 'Jatisari — JAT-01' },
];

// Simulated guest token response (in production: POST /api/v1/vector/superset/guest-token)
const MOCK_TOKEN_RESPONSE = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
  dashboardUuid: 'vec-surv-overview-001',
  expiresAt: new Date(Date.now() + 300_000).toISOString(),
  supersetEmbedUrl: 'https://superset.example.org/embedded/vec-surv-overview-001',
};

// Simulated OHS view stats (for the infrastructure tab)
// v1.1: collection_lots → collection_samples, trap_catch_daily → collection_density_daily
// v1.2: + vector_qc_monitoring
const OHS_VIEW_STATS = [
  { view: 'vector_collection_samples',         rows: 312,  lastRefresh: '2026-04-20 09:45', status: 'OK' },
  { view: 'vector_specimen_ids',               rows: 4820, lastRefresh: '2026-04-20 09:45', status: 'OK' },
  { view: 'vector_pathogen_results',           rows: 186,  lastRefresh: '2026-04-20 09:45', status: 'OK' },
  { view: 'vector_mir_weekly',                 rows: 48,   lastRefresh: '2026-04-20 09:45', status: 'OK' },
  { view: 'vector_collection_density_daily',   rows: 624,  lastRefresh: '2026-04-20 09:45', status: 'OK' },
  { view: 'vector_qc_monitoring',              rows: 96,   lastRefresh: '2026-04-20 09:45', status: 'OK' },
];

// v1.1: deconvolution Task removed (V-03 v1.4 dropped DeconvolutionTask entity);
// outcomes derive from Specimen.parent + extension[deconvolutionStatus]. Provenance is optional.
const FHIR_PUSH_LOG = [
  { resource: 'Specimen',         pushed: 312,  failed: 0,  lastPush: '2026-04-20 09:44' },
  { resource: 'Observation',      pushed: 4820, failed: 2,  lastPush: '2026-04-20 09:44' },
  { resource: 'DiagnosticReport', pushed: 186,  failed: 0,  lastPush: '2026-04-20 09:44' },
  { resource: 'Provenance',       pushed: 18,   failed: 0,  lastPush: '2026-04-20 09:44' },
];

// ---------------------------------------------------------------------------
// Connection status tag
// ---------------------------------------------------------------------------
const ConnectionTag = ({ status }) => {
  const map = {
    connected:   { kind: 'green',  icon: <CheckmarkFilled size={12} />, label: t('label.vectorReport.connectionStatus.connected',   'Connected') },
    unavailable: { kind: 'red',    icon: <ErrorFilled size={12} />,     label: t('label.vectorReport.connectionStatus.unavailable', 'Dashboard Unavailable') },
    loading:     { kind: 'blue',   icon: null,                           label: 'Connecting…' },
  };
  const { kind, icon, label } = map[status] || map.loading;
  return (
    <Tag kind={kind} size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon} {label}
    </Tag>
  );
};

// ---------------------------------------------------------------------------
// Simulated embedded dashboard (placeholder when Superset isn't actually running)
// ---------------------------------------------------------------------------
function SimulatedDashboard({ dateFrom, dateTo, site }) {
  const siteName = SITES.find(s => s.id === site)?.name || 'All Sites';
  // v1.3 — MIR metric toggle for Dashboard #4 (ContentSwitcher pattern)
  // v1.4: 3-way toggle — observed | classic | sporozoite
  const [mirMode, setMirMode] = useState('observed');
  // v1.4: lifecycle + trap type filters (default ADULT, all trap types)
  const [lifecycleFilter, setLifecycleFilter] = useState('ADULT');
  const [trapTypeFilter, setTrapTypeFilter] = useState('ALL');
  const positiveResolutionPct = 67; // simulated — would come from API
  const sporozoiteAvailable = positiveResolutionPct >= 95;
  return (
    <div style={{
      width: '100%', height: '100%', background: '#1c1c1c', borderRadius: 4,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Superset top bar simulation */}
      <div style={{ background: '#0f0f0f', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span style={{ color: '#20a7c9', fontWeight: 700, fontSize: 14 }}>Superset</span>
        <span style={{ color: '#fff', fontSize: 13, opacity: 0.8 }}>Vector Surveillance Overview</span>
        <span style={{ marginLeft: 'auto', color: '#888', fontSize: 12 }}>
          {siteName} · {dateFrom} → {dateTo}
        </span>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: 16, flexShrink: 0 }}>
        {[
          { label: 'Total Samples',   value: '312',   sub: '↑ 18 this week' },
          { label: 'Total Organisms', value: '4,820', sub: '↑ 240 this week' },
          { label: 'Active Sites',    value: '5',     sub: 'of 7 reporting' },
          { label: 'Highest MIR (wk 16)', value: '12.4', sub: 'BPP-01 · Ae. aegypti · NS1' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#2a2a2a', borderRadius: 4, padding: 16 }}>
            <p style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{kpi.label}</p>
            <p style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{kpi.value}</p>
            <p style={{ color: '#20a7c9', fontSize: 11, marginTop: 4 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px 16px', flex: 1, minHeight: 0 }}>
        {/* Collection Density Trend (v1.4: trap type stratification reactivated; lifecycle filter added) */}
        <div style={{ background: '#2a2a2a', borderRadius: 4, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>Collection Density — Trend</p>
            {/* v1.4: trap type + lifecycle filter chips */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10 }}>
              <select value={lifecycleFilter}
                      onChange={e => setLifecycleFilter(e.target.value)}
                      style={{ fontSize: 10, padding: '2px 4px', background: '#1c1c1c', color: '#ccc', border: '1px solid #525252', cursor: 'pointer' }}>
                <option value="ADULT">Adult (default)</option>
                <option value="ALL">All stages</option>
                <option value="LARVA">Larva</option>
                <option value="PUPA">Pupa</option>
                <option value="EGG">Egg</option>
              </select>
              <select value={trapTypeFilter}
                      onChange={e => setTrapTypeFilter(e.target.value)}
                      style={{ fontSize: 10, padding: '2px 4px', background: '#1c1c1c', color: '#ccc', border: '1px solid #525252', cursor: 'pointer' }}>
                <option value="ALL">All trap types</option>
                <option value="BG_SENTINEL">BG-Sentinel</option>
                <option value="CDC_LIGHT_TRAP">CDC light trap</option>
                <option value="GRAVID_TRAP">Gravid trap</option>
                <option value="OVITRAP">Ovitrap</option>
                <option value="HUMAN_LANDING">Human-landing</option>
              </select>
            </div>
          </div>
          <p style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>organisms per collection event</p>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
              <polyline points="0,100 50,85 100,60 150,70 200,45 250,55 300,30 350,40 400,25"
                fill="none" stroke="#20a7c9" strokeWidth="2" />
              <polyline points="0,90 50,95 100,80 150,85 200,70 250,60 300,50 350,55 400,45"
                fill="none" stroke="#5aa700" strokeWidth="2" strokeDasharray="4 2" />
              {[0,50,100,150,200,250,300,350,400].map((x,i) => (
                <text key={x} x={x} y="118" fill="#666" fontSize="8" textAnchor="middle">
                  {['W9','W10','W11','W12','W13','W14','W15','W16','W17'][i]}
                </text>
              ))}
            </svg>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: '#20a7c9' }}>● BPP-01</span>
            <span style={{ fontSize: 11, color: '#5aa700' }}>● BPP-02</span>
          </div>
        </div>

        {/* Species Distribution */}
        <div style={{ background: '#2a2a2a', borderRadius: 4, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Species Distribution (Confirmed)</p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              {/* Simple donut */}
              <circle cx="50" cy="50" r="35" fill="none" stroke="#20a7c9" strokeWidth="20"
                strokeDasharray="131 82" strokeDashoffset="0" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="#5aa700" strokeWidth="20"
                strokeDasharray="60 153" strokeDashoffset="-131" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="#f1c21b" strokeWidth="20"
                strokeDasharray="22 191" strokeDashoffset="-191" />
            </svg>
            <div>
              {[
                { name: 'Ae. aegypti',        pct: '62%', color: '#20a7c9' },
                { name: 'Cx. quinquefasciatus', pct: '28%', color: '#5aa700' },
                { name: 'An. barbirostris',   pct: '10%', color: '#f1c21b' },
              ].map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ color: '#ccc', fontSize: 11 }}>{s.name}</span>
                  <span style={{ color: s.color, fontSize: 11, marginLeft: 'auto' }}>{s.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Infection Rate Heatmap — V-04 v1.3 dual-metric with toggle (Dashboard #4) */}
        <div style={{ background: '#2a2a2a', borderRadius: 4, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>Infection Rate by Species × Panel (per 1,000 organisms)</p>
            {/* Carbon ContentSwitcher pattern — toggle metric */}
            <div role="tablist" style={{ display: 'inline-flex', border: '1px solid #525252', borderRadius: 0, fontSize: 10, fontWeight: 500, lineHeight: 1 }}>
              <button role="tab" aria-selected={mirMode === 'observed'}
                      onClick={() => setMirMode('observed')}
                      style={{ padding: '4px 8px', background: mirMode === 'observed' ? '#fff' : 'transparent', color: mirMode === 'observed' ? '#161616' : '#ccc', border: 'none', cursor: 'pointer' }}>
                Observed /1k
              </button>
              <button role="tab" aria-selected={mirMode === 'classic'}
                      onClick={() => setMirMode('classic')}
                      style={{ padding: '4px 8px', background: mirMode === 'classic' ? '#fff' : 'transparent', color: mirMode === 'classic' ? '#161616' : '#ccc', border: 'none', borderLeft: '1px solid #525252', cursor: 'pointer' }}>
                Classical MIR
              </button>
              {/* v1.4: Sporozoite Rate (%) — third toggle, gated on resolution >= 95% */}
              <button role="tab" aria-selected={mirMode === 'sporozoite'}
                      disabled={!sporozoiteAvailable}
                      onClick={() => sporozoiteAvailable && setMirMode('sporozoite')}
                      title={sporozoiteAvailable
                        ? 'Sporozoite Rate (%) — anchored on VR-07 microscopy (V-03 §A.5.9)'
                        : `Disabled — needs ≥ 95% deconvolution coverage (currently ${positiveResolutionPct}%)`}
                      style={{
                        padding: '4px 8px',
                        background: mirMode === 'sporozoite' ? '#a56eff' : 'transparent',
                        color: mirMode === 'sporozoite' ? '#fff' : '#a56eff',
                        border: 'none',
                        borderLeft: '1px solid #525252',
                        cursor: sporozoiteAvailable ? 'pointer' : 'not-allowed',
                        opacity: sporozoiteAvailable ? 1 : 0.45,
                        fontWeight: 600,
                      }}>
                Sporozoite %
              </button>
            </div>
          </div>

          {/* v1.4: Lifecycle filter — sporozoite rate is meaningful only for adult females */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, color: '#888', marginBottom: 6 }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>Stratify:</span>
            <select value={lifecycleFilter}
                    onChange={e => setLifecycleFilter(e.target.value)}
                    style={{ fontSize: 10, padding: '2px 4px', background: '#2a2a2a', color: '#ccc', border: '1px solid #525252' }}>
              <option value="ADULT">Lifecycle: Adult only (default)</option>
              <option value="ADULT_PUPA">Lifecycle: Adult + Pupa</option>
              <option value="ALL">Lifecycle: All stages</option>
            </select>
            {!sporozoiteAvailable && (
              <span style={{ color: '#f1c21b', marginLeft: 8 }}>
                ⚠ Sporozoite Rate disabled — needs ≥ 95% deconvolution coverage
              </span>
            )}
          </div>

          {/* Partial-resolution warning (per Item 5 acceptance criteria) */}
          {positiveResolutionPct < 100 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#f1c21b', marginBottom: 6 }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, background: '#f1c21b', borderRadius: '50%', color: '#161616', fontWeight: 700, textAlign: 'center', lineHeight: '12px', fontSize: 9 }}>!</span>
              <span>
                Partial resolution: {positiveResolutionPct}% of positive pools deconvoluted.{' '}
                {mirMode === 'observed' && 'Observed uses classical fallback for the rest.'}
                {mirMode === 'classic' && 'Switch to Observed for exact counts.'}
                {mirMode === 'sporozoite' && 'Sporozoite Rate uses fallback for un-resolved pools.'}
              </span>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ color: '#888', textAlign: 'left', paddingBottom: 6, fontWeight: 400 }}>Species</th>
                {['W13','W14','W15','W16'].map(w => (
                  <th key={w} style={{ color: '#888', textAlign: 'center', fontWeight: 400 }}>{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                // observed = exact descendant positive count when resolved; classical fallback otherwise
                // classic  = (positive_pools / total_organisms) × 1000
                // sporozoite = same numerator as observed, rescaled to per-100 (% form)
                { species: 'Ae. aegypti',  observed: [2.1, 4.8, 9.6, 14.2], classic: [2.1, 4.8, 8.3, 12.4] },
                { species: 'Cx. quinque.', observed: [0,   1.2, 2.0,  3.1], classic: [0,   1.2, 2.0,  3.1] },
                { species: 'An. barb.',    observed: [0,   0,   0.8,  1.5], classic: [0,   0,   0.8,  1.5] },
              ].map(row => {
                // v1.4: 3-way mode resolution
                const sporozoite = row.observed.map(v => Number((v / 10).toFixed(2)));
                const active = mirMode === 'classic' ? row.classic
                             : mirMode === 'sporozoite' ? sporozoite
                             : row.observed;
                const colorScale = mirMode === 'sporozoite' ? 1.5 : 15;
                return (
                  <tr key={row.species}>
                    <td style={{ color: '#ccc', paddingRight: 8, paddingBottom: 4 }}>{row.species}</td>
                    {active.map((v, i) => {
                      const intensity = Math.min(v / colorScale, 1);
                      const bg = v === 0 ? '#1c1c1c' : `rgba(218, 30, 40, ${0.15 + intensity * 0.85})`;
                      // v1.4: tooltip shows ALL THREE metrics + resolution % per Dashboard #4 acceptance criteria
                      const tip = `Observed (per 1k): ${row.observed[i]}\nClassical MIR (per 1k): ${row.classic[i]}\nSporozoite Rate (%): ${sporozoite[i]}\nResolution: ${positiveResolutionPct}%`;
                      return (
                        <td key={i} title={tip}
                            style={{ background: bg, textAlign: 'center', color: intensity > 0.5 ? '#fff' : '#ccc', padding: '3px 8px', borderRadius: 2 }}>
                          {v || '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pathogen Positivity */}
        <div style={{ background: '#2a2a2a', borderRadius: 4, padding: 16 }}>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Pathogen Positivity Rate (%)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { panel: 'NS1 RT-PCR (Dengue)',    w13: 8,  w14: 12, w15: 18, w16: 24 },
              { panel: 'Malaria (PCR)',           w13: 2,  w14: 2,  w15: 4,  w16: 3  },
              { panel: 'Chikungunya RT-PCR',      w13: 0,  w14: 1,  w15: 2,  w16: 5  },
            ].map(p => (
              <div key={p.panel}>
                <p style={{ color: '#888', fontSize: 10, marginBottom: 3 }}>{p.panel}</p>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[p.w13, p.w14, p.w15, p.w16].map((v, i) => (
                    <div key={i} style={{ flex: 1, height: 24, background: '#3a3a3a', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: `${v * 3}%`, height: '100%', background: v > 15 ? '#da1e28' : '#f1c21b', transition: 'width 0.3s' }} />
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff', fontSize: 10 }}>{v}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {['W13','W14','W15','W16'].map(w => (
                    <p key={w} style={{ flex: 1, textAlign: 'center', color: '#666', fontSize: 9 }}>{w}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Quality Control section (V-04 v1.2 — Dashboard #7) ═══ */}
      {/* Visually separated from surveillance charts; QC samples are excluded from MIR / density per BR-V04-008 */}
      <div style={{ borderTop: '8px solid #0f0f0f', padding: '14px 16px 6px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, background: '#20a7c9', borderRadius: '50%' }} />
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: 0.16, textTransform: 'uppercase' }}>Quality Control</span>
          <span style={{ color: '#888', fontSize: 10 }}>QC samples are excluded from surveillance aggregates above (BR-V04-008).</span>
        </div>

        <div style={{ background: '#2a2a2a', borderRadius: 4, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>QC Pass Rate (per QA event type · last 4 weeks)</p>
            <span style={{ fontSize: 10, color: '#888' }}>Threshold: <strong style={{ color: '#5aa700' }}>≥ 95%</strong></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { type: 'Positive Control (expected POS)', vals: [96, 100, 92, 100],  flags: [false, false, true,  false] },
              { type: 'Negative Control (expected NEG)', vals: [100, 100, 100, 100], flags: [false, false, false, false] },
              { type: 'Blank (expected NEG)',            vals: [100, 88, 100, 100],  flags: [false, true,  false, false] },
            ].map(row => (
              <div key={row.type}>
                <p style={{ color: '#888', fontSize: 10, marginBottom: 3 }}>{row.type}</p>
                <div style={{ display: 'flex', gap: 2 }}>
                  {row.vals.map((v, i) => {
                    const fail = v < 95;
                    const warn = row.flags[i] && !fail;
                    const fillColor = fail ? '#da1e28' : warn ? '#f1c21b' : '#5aa700';
                    return (
                      <div key={i} style={{ flex: 1, height: 24, background: '#3a3a3a', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ width: `${v}%`, height: '100%', background: fillColor, transition: 'width 0.3s' }} />
                        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff', fontSize: 10 }}>
                          {v}%{(fail || warn) ? ' ⚠' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {['W13','W14','W15','W16'].map(w => (
                    <p key={w} style={{ flex: 1, textAlign: 'center', color: '#666', fontSize: 9 }}>{w}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: '#666', fontSize: 9, marginTop: 8 }}>
            Source: vector_qc_monitoring · pass = result matches expectation · Duplicate concordance computed downstream
          </p>
        </div>
      </div>
      {/* ═══ /Quality Control section ═══ */}

      <div style={{ background: '#0f0f0f', padding: '6px 16px', flexShrink: 0 }}>
        <p style={{ color: '#444', fontSize: 10 }}>
          ⚡ Mockup — simulates embedded Superset dashboard. In production this area is an &lt;iframe&gt; served by Apache Superset.
          Data last refreshed: 2026-04-20 09:45 (OHS ETL). Guest token expires in 4m 32s.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Infrastructure tab — pipeline status + code snippets
// ---------------------------------------------------------------------------
function InfrastructureTab() {
  const ohsHeaders = [
    { key: 'view',        header: 'OHS View' },
    { key: 'rows',        header: 'Rows' },
    { key: 'lastRefresh', header: 'Last Refresh' },
    { key: 'status',      header: 'Status' },
  ];
  const ohsRows = OHS_VIEW_STATS.map(r => ({
    id: r.view, ...r,
    status: <Tag kind="green" size="sm"><CheckmarkFilled size={12} /> {r.status}</Tag>,
  }));

  const fhirHeaders = [
    { key: 'resource', header: 'FHIR Resource' },
    { key: 'pushed',   header: 'Pushed' },
    { key: 'failed',   header: 'Failed' },
    { key: 'lastPush', header: 'Last Push' },
  ];
  const fhirRows = FHIR_PUSH_LOG.map(r => ({
    id: r.resource, ...r,
    failed: r.failed > 0
      ? <Tag kind="red" size="sm"><WarningFilled size={12} /> {r.failed}</Tag>
      : <Tag kind="green" size="sm">0</Tag>,
  }));

  return (
    <Stack gap={5}>
      {/* Architecture diagram */}
      <Tile>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Pipeline Architecture</h4>
        <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.8, color: '#161616', background: '#f4f4f4', padding: 16, borderRadius: 4, overflowX: 'auto' }}>
          <pre style={{ margin: 0 }}>{`OpenELIS (V-02 / V-03 data)
    │ FHIR Outbound Push (existing + V-04 extensions)
    ▼
HAPI FHIR Server  [:8080 internal]
    │ OHS SQL-on-FHIR ETL  (every 15 min, cron configurable)
    ▼
Postgres — vector_analytics schema
    ├── vector_collection_samples       ← top-level + aliquots; carries is_qc, is_pool
    ├── vector_specimen_ids
    ├── vector_pathogen_results         ← carries is_qc, qa_event_type
    ├── vector_mir_weekly               ← mir_classic + infection_rate_per_1000 + positive_resolution_pct
    ├── vector_collection_density_daily ← organisms_per_event (top-level only, QC excluded)
    └── vector_qc_monitoring            ← QC pass rate by qa_event_type
    │ SQLAlchemy connection
    ▼
Apache Superset  [/superset via nginx proxy]
    ├── Dashboard: Vector Surveillance Overview (6 surveillance + 1 QC chart)
    ├── Guest token API  → OpenELIS backend → frontend iframe
    └── Alert engine  → email on threshold breach

☁  Cloud swap: replace HAPI FHIR + Postgres with GCP FHIR Store + BigQuery`}
          </pre>
        </div>
      </Tile>

      {/* OHS view status */}
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>OHS View Status</h4>
        <DataTable rows={ohsRows} headers={ohsHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              <Table {...getTableProps()} size="sm">
                <TableHead>
                  <TableRow>
                    {headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id} {...getRowProps({ row })}>
                      {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </div>

      {/* FHIR push log */}
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>FHIR Outbound Push Log</h4>
        <DataTable rows={fhirRows} headers={fhirHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              <Table {...getTableProps()} size="sm">
                <TableHead>
                  <TableRow>
                    {headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id} {...getRowProps({ row })}>
                      {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </div>

      {/* Config snippets */}
      <Accordion>
        <AccordionItem title="docker-compose.yml additions">
          <CodeSnippet type="multi" feedback="Copied">{`  hapi-fhir:
    image: hapiproject/hapi:latest
    environment:
      spring.datasource.url: jdbc:postgresql://postgres-fhir:5432/fhir
      spring.datasource.username: \${FHIR_DB_USER}
      spring.datasource.password: \${FHIR_DB_PASSWORD}

  superset:
    image: apache/superset:latest
    environment:
      SUPERSET_SECRET_KEY: \${SUPERSET_SECRET_KEY}
    volumes:
      - ./superset_config.py:/app/pythonpath/superset_config.py
    ports:
      - "8088:8088"`}
          </CodeSnippet>
        </AccordionItem>
        <AccordionItem title="superset_config.py (key settings)">
          <CodeSnippet type="multi" feedback="Copied">{`FEATURE_FLAGS = {"EMBEDDED_SUPERSET": True}
GUEST_ROLE_NAME = "VectorSurveillanceGuest"
GUEST_TOKEN_JWT_EXP_SECONDS = 300

# RLS (deferrable — uncomment to enable)
# ENABLE_ROW_LEVEL_SECURITY = True`}
          </CodeSnippet>
        </AccordionItem>
        <AccordionItem title="Guest token API call (OpenELIS backend)">
          <CodeSnippet type="multi" feedback="Copied">{`POST /api/v1/security/guest_token
{
  "user": { "username": "coordinator_siti" },
  "resources": [{ "type": "dashboard", "id": "vec-surv-overview-001" }],
  "rls": []   // add { "clause": "site_id IN (1,3)" } when RLS enabled
}`}
          </CodeSnippet>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Main embedding shell
// ---------------------------------------------------------------------------
function EmbeddingShell() {
  // Simulate: 'loading' | 'connected' | 'error'
  const [connectionState, setConnectionState] = useState('loading');
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-20');
  const [site, setSite] = useState('all');
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);

  const fetchToken = useCallback(() => {
    setConnectionState('loading');
    // Simulate 1.2s API call
    setTimeout(() => {
      setConnectionState('connected');
      setTokenExpiresAt(MOCK_TOKEN_RESPONSE.expiresAt);
    }, 1200);
  }, []);

  useEffect(() => { fetchToken(); }, []);

  const handleApplyFilters = () => { fetchToken(); };

  return (
    <Stack gap={0}>
      {/* Header strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '10px 16px' }}>
        <Grid condensed>
          <Column lg={1} style={{ display: 'flex', alignItems: 'center' }}>
            <ConnectionTag status={connectionState} />
          </Column>
          <Column lg={3}>
            <DatePicker datePickerType="single" value={dateFrom} onChange={([d]) => d && setDateFrom(d.toISOString().slice(0,10))}>
              <DatePickerInput id="date-from" labelText={t('label.vectorReport.dateFrom', 'From')} size="sm" placeholder="yyyy-mm-dd" />
            </DatePicker>
          </Column>
          <Column lg={3}>
            <DatePicker datePickerType="single" value={dateTo} onChange={([d]) => d && setDateTo(d.toISOString().slice(0,10))}>
              <DatePickerInput id="date-to" labelText={t('label.vectorReport.dateTo', 'To')} size="sm" placeholder="yyyy-mm-dd" />
            </DatePicker>
          </Column>
          <Column lg={3}>
            <Select id="site-filter" labelText={t('label.vectorReport.siteFilter', 'Sampling Site')} size="sm"
              value={site} onChange={e => setSite(e.target.value)}>
              {SITES.map(s => <SelectItem key={s.id} value={s.id} text={s.name} />)}
            </Select>
          </Column>
          <Column lg={2} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <Button kind="primary" size="sm" onClick={handleApplyFilters}>
              {t('button.vectorReport.applyFilters', 'Apply')}
            </Button>
          </Column>
          <Column lg={4} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 8 }}>
            <Button kind="ghost" size="sm" renderIcon={DocumentDownload}
              disabled={connectionState !== 'connected'}>
              {t('button.vectorReport.exportPdf', 'Export PDF')}
            </Button>
            <Button kind="ghost" size="sm" renderIcon={Launch}
              disabled={connectionState !== 'connected'}>
              {t('button.vectorReport.openSuperset', 'Open in Superset')}
            </Button>
          </Column>
        </Grid>
      </div>

      {/* Dashboard area */}
      <div style={{ height: 'calc(100vh - 200px)', position: 'relative', background: '#161616' }}>

        {/* Loading state */}
        {connectionState === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4', gap: 16 }}>
            <Loading description={t('message.vectorReport.tokenRefreshing', 'Connecting to analytics service…')} withOverlay={false} />
            <p style={{ color: '#525252', fontSize: 14 }}>Fetching dashboard session…</p>
          </div>
        )}

        {/* Error state */}
        {connectionState === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4', padding: '2rem' }}>
            <div style={{ maxWidth: 560, width: '100%' }}>
              <InlineNotification
                kind="error"
                title={t('error.vectorReport.supersetUnavailable', 'The vector surveillance dashboard is temporarily unavailable.')}
                subtitle="Could not reach the Superset analytics service. Check that the superset Docker service is running."
                actions={
                  <Button kind="ghost" size="sm" renderIcon={Renew} onClick={fetchToken}>
                    {t('button.vectorReport.retry', 'Retry')}
                  </Button>
                }
              />
            </div>
          </div>
        )}

        {/* Connected — simulated dashboard */}
        {connectionState === 'connected' && (
          <SimulatedDashboard dateFrom={dateFrom} dateTo={dateTo} site={site} />
        )}
      </div>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Root — tabs: Dashboard | Infrastructure
// ---------------------------------------------------------------------------
export default function VectorSurveillanceReporting() {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4' }}>
      {/* Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '12px 16px 0' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>
          {t('heading.vectorReport.title', 'Vector Surveillance Dashboard')}
        </h1>
        <p style={{ fontSize: 13, color: '#525252', marginBottom: 12 }}>
          Reports → {t('nav.vectorReport.title', 'Vector Surveillance')}
        </p>

        <Tabs>
          <TabList aria-label="V-04 screens">
            <Tab>Dashboard</Tab>
            <Tab>Pipeline & Infrastructure</Tab>
          </TabList>
          <TabPanels>
            <TabPanel style={{ padding: 0 }}>
              <EmbeddingShell />
            </TabPanel>
            <TabPanel>
              <div style={{ padding: 'var(--cds-spacing-06)' }}>
                <InfrastructureTab />
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}
