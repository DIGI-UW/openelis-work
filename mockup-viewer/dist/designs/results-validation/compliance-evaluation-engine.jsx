/**
 * S-05 v2.0 — Regulation-Scoped Reference Ranges
 * Reframed from v1.0 (Compliance Evaluation Engine) on 2026-04-26.
 *
 * 2026-04-29 reconciliation: S-05 v2.0 introduces NO schema changes of its own.
 * Regulation-scoped thresholds live on `ComplianceThreshold` (S-01-owned, gaining
 * borderline fields in S-01 v1.2). Standalone ranges live on `referenceRange`
 * (existing OE, unchanged). The two are mutually exclusive at evaluation time —
 * regulation supersedes standalone.
 *
 * 2 scenes:
 *   1. Reference Range Admin — STANDALONE ONLY. Regulation-scoped ranges are
 *      managed in Compliance Standard Admin (S-01). Banner points there.
 *   2. Results Entry — per-regulation status chips (PASS / FAIL / BORDERLINE /
 *      INFO — RegName), one chip per applicable regulation, plus dynamic
 *      reading-group "+ Add reading" affordance for multi-reading tests.
 *      Same chip pattern is inherited by Validation (no separate UX).
 */

import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TextInput, NumberInput, Select, SelectItem,
  Button, Tag, Tile, InlineNotification,
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';

const t = (k, f) => f || k;

const ExistingRegion = ({ children, label = 'EXISTING' }) => (
  <div style={{ opacity: 0.85, position: 'relative', marginBottom: 16 }}>
    <span style={{
      position: 'absolute', top: 4, right: 8, zIndex: 1,
      background: '#8D8D8D', color: '#fff', fontSize: 10, fontWeight: 600,
      padding: '1px 6px', borderRadius: 3,
    }}>{label}</span>
    {children}
  </div>
);

// ─── Mock data ──────────────────────────────────────────────────────

const STANDARDS = [
  { id: 'std-001', name: 'PP No. 22/2021 — Baku Mutu Air Permukaan', regNumber: 'PP No. 22/2021', version: '2021-01' },
  { id: 'std-003', name: 'WHO Drinking Water Guidelines (4th Ed)', regNumber: 'WHO-DWG-4', version: '2011-01' },
  { id: 'std-005', name: 'PermenKES No. 32/2017', regNumber: 'PMK No. 32/2017', version: '2017-01' },
];

// 2026-04-29 split: Scene 1 only shows STANDALONE (compliance_standard_id IS NULL)
// reference ranges. Regulation-scoped ranges live on ComplianceThreshold (S-01).
const STANDALONE_RANGES = [
  { id: 1, test: 'Hemoglobin', sampleType: 'Whole Blood (clinical)', min: 12.0, max: 16.0, unit: 'g/dL' },
  { id: 2, test: 'Glucose', sampleType: 'Serum (clinical)', min: 70, max: 110, unit: 'mg/dL' },
  { id: 3, test: 'pH', sampleType: '(any, no regulation)', min: 6.5, max: 8.5, unit: '—' },
];

// 2026-04-29 (rewritten): structured by test session → reading groups → component results.
// Per-regulation status chips replace combined-status rollup. Reading groups are dynamic
// for tests where allowsMultipleReadings === true.
const INITIAL_RESULT_TESTS = [
  {
    id: 'rt-001', accession: 'ENV-2026-0412.001', test: 'Turbidity', unit: 'NTU',
    components: [null], allowsMultipleReadings: false,
    readingGroups: [
      { id: 'rg-001-1', label: null, results: [
        { component: null, value: '18', evaluations: [
          { reg: 'PP No. 22/2021', status: 'PASS', label: '≤ 25 NTU' },
          { reg: 'WHO-DWG-4', status: 'FAIL', label: '≤ 5 NTU' },
        ]},
      ]},
    ],
  },
  {
    id: 'rt-002', accession: 'ENV-2026-0412.001', test: 'pH', unit: '—',
    components: [null], allowsMultipleReadings: false,
    readingGroups: [
      { id: 'rg-002-1', label: null, results: [
        { component: null, value: '7.2', evaluations: [
          { reg: 'PP No. 22/2021', status: 'PASS', label: '6.0 – 9.0' },
          { reg: 'WHO-DWG-4', status: 'PASS', label: '6.5 – 8.5' },
        ]},
      ]},
    ],
  },
  {
    id: 'rt-003', accession: 'ENV-2026-0412.001', test: 'Total Coliform', unit: 'MPN/100mL',
    components: [null], allowsMultipleReadings: false,
    readingGroups: [
      { id: 'rg-003-1', label: null, results: [
        // 4900 hits PP 22's borderline window (per-standard config in S-01 v1.2)
        // but is well inside FAIL territory for WHO-DWG-4 (limit = 0)
        { component: null, value: '4900', evaluations: [
          { reg: 'PP No. 22/2021', status: 'BORDERLINE', label: '≤ 5000 MPN/100mL' },
          { reg: 'WHO-DWG-4', status: 'FAIL', label: '0 MPN/100mL' },
        ]},
      ]},
    ],
  },
  // Multi-component, multi-reading noise pollution survey
  {
    id: 'rt-noise', accession: 'ENV-2026-0412.005', test: 'Noise Pollution Survey', unit: 'mixed',
    components: ['Heading (°)', 'Sound Pressure (dB)'], allowsMultipleReadings: true,
    readingGroups: [
      { id: 'rg-noise-1', label: 'Reading 1 — North face', results: [
        { component: 'Heading (°)', value: '90', evaluations: [
          { reg: '(informational)', status: 'INFO', label: 'no threshold' },
        ]},
        { component: 'Sound Pressure (dB)', value: '72', evaluations: [
          { reg: 'PP No. 41/1999', status: 'FAIL', label: '≤ 70 dB' },
          { reg: 'WHO Env Noise', status: 'FAIL', label: '≤ 65 dB' },
        ]},
      ]},
      { id: 'rg-noise-2', label: 'Reading 2 — East face', results: [
        { component: 'Heading (°)', value: '180', evaluations: [
          { reg: '(informational)', status: 'INFO', label: 'no threshold' },
        ]},
        { component: 'Sound Pressure (dB)', value: '64', evaluations: [
          { reg: 'PP No. 41/1999', status: 'PASS', label: '≤ 70 dB' },
          { reg: 'WHO Env Noise', status: 'PASS', label: '≤ 65 dB' },
        ]},
      ]},
    ],
  },
  {
    id: 'rt-notes', accession: 'ENV-2026-0412.001', test: 'Field Notes (free text)', unit: '',
    components: [null], allowsMultipleReadings: false,
    readingGroups: [
      { id: 'rg-notes-1', label: null, results: [
        { component: null, value: 'Collected 50m downstream', evaluations: [] },
      ]},
    ],
  },
];

// Carbon Tag types per S-05 v2.0 status:
//   PASS = green (within range)
//   FAIL = red (out of range)
//   BORDERLINE = warm-gray-on-yellow (within standard's borderline window — config in S-01)
//   INFO = cool-gray (no applicable threshold)
const STATUS_TAG_TYPE = {
  PASS: 'green',
  FAIL: 'red',
  BORDERLINE: 'warm-gray',  // closest Carbon match for yellow-ish
  INFO: 'cool-gray',
};

// ─── Component ──────────────────────────────────────────────────────

export default function S05MockupV2() {
  const [scene, setScene] = useState(0);
  const [resultTests, setResultTests] = useState(INITIAL_RESULT_TESTS);

  // ── Scene 2 reading-group handlers (dynamic + Add reading) ──
  const addReading = (testId) => {
    setResultTests(prev => prev.map(rt => {
      if (rt.id !== testId) return rt;
      const nextIdx = rt.readingGroups.length + 1;
      const template = rt.readingGroups[0]?.results || [];
      return {
        ...rt,
        readingGroups: [
          ...rt.readingGroups,
          {
            id: `${rt.id}-rg-${nextIdx}`,
            label: `Reading ${nextIdx} — (new)`,
            results: template.map(r => ({ component: r.component, value: '', evaluations: [] })),
          },
        ],
      };
    }));
  };

  const removeReading = (testId, rgId) => {
    setResultTests(prev => prev.map(rt => {
      if (rt.id !== testId) return rt;
      if (rt.readingGroups.length <= 1) return rt; // keep at least one
      return { ...rt, readingGroups: rt.readingGroups.filter(rg => rg.id !== rgId) };
    }));
  };

  const renderEvaluationChips = (evaluations) => {
    if (!evaluations || evaluations.length === 0) {
      return <span style={{ color: '#8d8d8d', fontSize: 12 }}>—</span>;
    }
    return (
      <Stack orientation="horizontal" gap={1} style={{ flexWrap: 'wrap' }}>
        {evaluations.map((ev, j) => (
          <Tag key={j} type={STATUS_TAG_TYPE[ev.status]} size="sm" title={ev.label}>
            {ev.status} — {ev.reg}
          </Tag>
        ))}
      </Stack>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
      <Tabs selectedIndex={scene} onChange={({ selectedIndex }) => setScene(selectedIndex)}>
        <TabList aria-label="Scene">
          <Tab>1 — Reference Range Admin (standalone only — see S-01 for regulation-scoped)</Tab>
          <Tab>2 — Results Entry (per-regulation chips + dynamic reading groups)</Tab>
        </TabList>
        <TabPanels>

          {/* ── Scene 1 — Reference Range Admin (standalone only) ─────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Reference Range Admin — standalone (non-regulation) only</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              <strong>2026-04-29 split.</strong> The existing OE Reference Range Admin manages only standalone ranges
              (where <code>compliance_standard_id IS NULL</code>), used when a test is ordered with no regulation.
              Regulation-scoped thresholds — including borderline windows — are managed in <strong>Compliance Standard
              Admin (S-01) → Edit Standard → Thresholds</strong>.
            </p>

            <InlineNotification
              kind="info"
              title="Where do regulation-scoped thresholds live?"
              subtitle="Reference ranges scoped to a compliance standard (e.g., PP No. 22/2021's Turbidity ≤ 25 NTU) are managed inside Compliance Standard Admin → Edit Standard → Thresholds (see S-01 v1.2). Borderline windows are configured per-threshold there too."
              hideCloseButton
              lowContrast
              style={{ maxWidth: '100%', marginBottom: 16 }}
            />

            <ExistingRegion>
              <Tile>
                <h5 style={{ marginBottom: 8 }}>Reference Range Management — standalone only</h5>
                <p style={{ fontSize: 12, color: '#525252', marginBottom: 12 }}>
                  Existing admin page · gates: <code>referenceRange.edit</code> · Filter: <code>compliance_standard_id IS NULL</code>
                </p>

                <Stack orientation="horizontal" gap={3} style={{ marginBottom: 12, alignItems: 'center' }}>
                  <Button kind="primary" size="sm" renderIcon={Add}>
                    {t('button.addStandaloneRange', 'Add Standalone Reference Range')}
                  </Button>
                  <span style={{ fontSize: 12, color: '#525252' }}>
                    To add a regulation-scoped threshold, go to Compliance Standard Admin (S-01).
                  </span>
                </Stack>

                <Table size="md">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Test</TableHeader>
                      <TableHeader>Sample Type</TableHeader>
                      <TableHeader>Min</TableHeader>
                      <TableHeader>Max</TableHeader>
                      <TableHeader>Unit</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {STANDALONE_RANGES.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} style={{ textAlign: 'center', fontStyle: 'italic', color: '#525252', padding: 24 }}>
                          No standalone ranges. Most env tests are regulation-scoped — manage them in S-01.
                        </TableCell>
                      </TableRow>
                    ) : STANDALONE_RANGES.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.test}</TableCell>
                        <TableCell>{r.sampleType}</TableCell>
                        <TableCell>{r.min ?? '—'}</TableCell>
                        <TableCell>{r.max ?? '—'}</TableCell>
                        <TableCell>{r.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <p style={{ fontSize: 12, color: '#525252', marginTop: 8 }}>
                  Showing {STANDALONE_RANGES.length} standalone range{STANDALONE_RANGES.length === 1 ? '' : 's'}.
                  Regulation-scoped thresholds (`ComplianceThreshold` rows) are hidden — manage them in Compliance Standard Admin (S-01).
                </p>
              </Tile>
            </ExistingRegion>

            <Tile style={{ background: '#edf5ff', borderLeft: '3px solid #0f62fe' }}>
              <h5 style={{ marginBottom: 8 }}>2026-04-29 admin split — what changed</h5>
              <ul style={{ fontSize: 13, marginLeft: 16 }}>
                <li>Existing OE Reference Range Admin stays clean (no new column, no compliance-standard filter)</li>
                <li>Regulation-scoped thresholds are owned by S-01's Compliance Standard editor (`ComplianceThreshold` entity, not `referenceRange`)</li>
                <li>Borderline proximity is also configured per-threshold in S-01 v1.2 (FR-3-013 / FR-3-014)</li>
                <li>Evaluator path: regulation supersedes standalone. Standalone only fires if the order has no regulation.</li>
              </ul>
            </Tile>
          </TabPanel>

          {/* ── Scene 2 — Results Entry: per-reg chips + dynamic reading groups ── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>
              Results Entry — Per-Regulation Status Chips + Dynamic Reading Groups
            </h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              <strong>2026-04-29 simplification.</strong> One chip per applicable regulation, format
              <code style={{ margin: '0 4px' }}>STATUS — RegName</code>. Colors: PASS green / BORDERLINE yellow /
              FAIL red / INFO cool-gray (no applicable threshold). Multi-reading tests get a
              <strong> + Add reading</strong> button on the test header. Same chip pattern is inherited verbatim by
              the Validation page (no separate UX).
            </p>

            <ExistingRegion>
              <Tile>
                <h5 style={{ marginBottom: 4 }}>
                  Order ENV-2026-0412 — selected regulations: PP No. 22/2021 + WHO-DWG-4
                </h5>
                <p style={{ fontSize: 12, color: '#525252' }}>
                  Existing page chrome · per-row chips render alongside the result value, no expand-detail panel needed
                </p>
              </Tile>
            </ExistingRegion>

            <ExistingRegion>
              <Tile>
                <Table size="md">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Accession</TableHeader>
                      <TableHeader>Test / Component</TableHeader>
                      <TableHeader>Result</TableHeader>
                      <TableHeader>Status — per regulation</TableHeader>
                      <TableHeader></TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultTests.map(rt => (
                      <React.Fragment key={rt.id}>
                        {/* Test header row */}
                        <TableRow style={{ background: '#f4f4f4' }}>
                          <TableCell><code style={{ fontSize: 12 }}>{rt.accession}</code></TableCell>
                          <TableCell colSpan={3} style={{ fontWeight: 600 }}>
                            {rt.test}
                            {rt.components.length > 1 && (
                              <span style={{ fontSize: 11, color: '#525252', fontWeight: 400, marginLeft: 8 }}>
                                · multi-component ({rt.components.length}) · {rt.readingGroups.length} reading{rt.readingGroups.length === 1 ? '' : 's'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell style={{ textAlign: 'right' }}>
                            {rt.allowsMultipleReadings && (
                              <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => addReading(rt.id)}>
                                {t('button.addReading', 'Add reading')}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Reading groups */}
                        {rt.readingGroups.map((rg) => (
                          <React.Fragment key={rg.id}>
                            {rg.label && (
                              <TableRow style={{ background: '#fff8e1' }}>
                                <TableCell></TableCell>
                                <TableCell colSpan={3} style={{ fontSize: 12, fontWeight: 600, color: '#491d8b' }}>
                                  ↳ {rg.label}
                                </TableCell>
                                <TableCell style={{ textAlign: 'right' }}>
                                  {rt.readingGroups.length > 1 && (
                                    <Button kind="ghost" size="sm" renderIcon={TrashCan}
                                            onClick={() => removeReading(rt.id, rg.id)}>
                                      {t('button.removeReading', 'Remove')}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}

                            {rg.results.map((r, ri) => (
                              <TableRow key={`${rg.id}-${ri}`}>
                                <TableCell></TableCell>
                                <TableCell>
                                  {r.component ? (
                                    <span style={{ paddingLeft: rg.label ? 16 : 0 }}>
                                      <Tag type="cyan" size="sm">{r.component}</Tag>
                                    </span>
                                  ) : (
                                    <span style={{ color: '#525252', fontStyle: 'italic', fontSize: 12 }}>(single value)</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {r.value
                                    ? <span><strong>{r.value}</strong> <span style={{ color: '#525252', fontSize: 12 }}>{rt.unit !== 'mixed' ? rt.unit : ''}</span></span>
                                    : <span style={{ color: '#525252', fontSize: 12, fontStyle: 'italic' }}>— pending</span>}
                                </TableCell>
                                <TableCell>{renderEvaluationChips(r.evaluations)}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </Tile>
            </ExistingRegion>

            <Tile style={{ background: '#edf5ff', borderLeft: '3px solid #0f62fe' }}>
              <h5 style={{ marginBottom: 8 }}>2026-04-29 simplifications demonstrated above</h5>
              <ul style={{ fontSize: 13, marginLeft: 16 }}>
                <li>Per-regulation status chip — single chip per reg per result row, format <code>STATUS — RegName</code></li>
                <li>Color rule: PASS green · BORDERLINE yellow · FAIL red · INFO cool-gray (no threshold)</li>
                <li>Reading groups stay (with header label) but are now dynamic — click <strong>+ Add reading</strong> on the multi-reading test header to append a new reading group with empty values</li>
                <li>Dropped: threshold-source list in expanded detail · combined-status rollup chip · per-standard threshold preview block</li>
                <li>BORDERLINE example: Total Coliform 4900 sits in PP No. 22/2021's borderline window (configured in S-01 v1.2) but well into FAIL territory for WHO-DWG-4 (limit = 0)</li>
                <li>Categorical observations remain S-05a (OGC-639) — separate ticket</li>
                <li>Same chip pattern renders verbatim on the Validation page — no separate UX (FR-04a)</li>
              </ul>
            </Tile>
          </TabPanel>

        </TabPanels>
      </Tabs>
    </div>
  );
}
