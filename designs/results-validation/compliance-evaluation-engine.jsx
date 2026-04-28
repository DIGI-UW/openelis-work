/**
 * S-05 v2.0 — Regulation-Scoped Reference Ranges
 * Reframed from v1.0 (Compliance Evaluation Engine) on 2026-04-26.
 *
 * The v1.0 mockup showed a regulation banner + dedicated Compliance Detail Tile.
 * v2.0 drops both — evaluation reuses the existing OE Normal/Abnormal/Critical
 * inline indicator. The only NEW UI surface is:
 *   1. Reference Range Admin: Compliance Standard filter + form field
 *   2. Expanded result detail: 1-line "Threshold source" annotation
 *
 * 2 scenes:
 *   1. Reference Range Admin (with new Compliance Standard filter + form field)
 *   2. Results Entry — expanded result detail showing threshold-source annotation
 *      (the per-result inline indicator itself is unchanged — existing OE)
 */

import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TextInput, NumberInput, Select, SelectItem,
  Button, Tag, Tile, InlineNotification,
  Dropdown, ComboBox,
} from '@carbon/react';
import { Add, Edit, View, Filter as FilterIcon } from '@carbon/icons-react';

const t = (k, f) => f || k;

const NewRegion = ({ children, label = 'S-05 v2 NEW' }) => (
  <div style={{ border: '2px dashed #F1C21B', borderRadius: 6, padding: 12, position: 'relative', marginBottom: 16 }}>
    <span style={{
      position: 'absolute', top: -11, left: 12,
      background: '#F1C21B', color: '#000', fontSize: 11, fontWeight: 700,
      padding: '1px 8px', borderRadius: 4,
    }}>{label}</span>
    {children}
  </div>
);

const ExistingRegion = ({ children, label = 'EXISTING' }) => (
  <div style={{ opacity: 0.72, position: 'relative', marginBottom: 16 }}>
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

const REF_RANGES = [
  { id: 1, test: 'Turbidity', sampleType: 'Surface Water', min: null, max: 25, unit: 'NTU', standardId: 'std-001', standard: 'PP No. 22/2021' },
  { id: 2, test: 'Turbidity', sampleType: 'Drinking Water', min: null, max: 5, unit: 'NTU', standardId: 'std-003', standard: 'WHO-DWG-4' },
  { id: 3, test: 'Turbidity', sampleType: '(any)', min: null, max: 25, unit: 'NTU', standardId: null, standard: '(generic)' },
  { id: 4, test: 'pH', sampleType: 'Surface Water', min: 6.0, max: 9.0, unit: '—', standardId: 'std-001', standard: 'PP No. 22/2021' },
  { id: 5, test: 'pH', sampleType: 'Drinking Water', min: 6.5, max: 8.5, unit: '—', standardId: 'std-003', standard: 'WHO-DWG-4' },
  { id: 6, test: 'Total Coliform', sampleType: 'Surface Water', min: null, max: 5000, unit: 'MPN/100mL', standardId: 'std-001', standard: 'PP No. 22/2021' },
  { id: 7, test: 'Total Coliform', sampleType: 'Drinking Water', min: 0, max: 0, unit: 'MPN/100mL', standardId: 'std-003', standard: 'WHO-DWG-4' },
];

const RESULT_ROWS = [
  { id: 1, accession: 'ENV-2026-0412.001', test: 'Turbidity', value: '18', unit: 'NTU', flag: 'Normal', source: { type: 'compliance', label: 'PP No. 22/2021 — ≤ 25 NTU' } },
  { id: 2, accession: 'ENV-2026-0412.001', test: 'pH', value: '7.2', unit: '—', flag: 'Normal', source: { type: 'compliance', label: 'PP No. 22/2021 — 6.0 – 9.0' } },
  { id: 3, accession: 'ENV-2026-0412.001', test: 'Total Coliform', value: '6800', unit: 'MPN/100mL', flag: 'Abnormal', source: { type: 'compliance', label: 'PP No. 22/2021 — ≤ 5000 MPN/100mL' } },
  { id: 4, accession: 'ENV-2026-0412.001', test: 'Field Notes (free text)', value: 'Collected 50m downstream of discharge', unit: '', flag: null, source: null },
];

const FLAG_TAG = {
  Normal:   { type: 'green', label: '✓ Normal' },
  Abnormal: { type: 'magenta', label: '⚠ Abnormal' },
  Critical: { type: 'red', label: '✕ Critical' },
};

// ─── Component ──────────────────────────────────────────────────────

export default function S05MockupV2() {
  const [scene, setScene] = useState(0);
  const [filter, setFilter] = useState('All');
  const [expandedResultId, setExpandedResultId] = useState(3); // Total Coliform row expanded by default

  const filteredRanges = useMemo(() => {
    if (filter === 'All') return REF_RANGES;
    if (filter === '(generic)') return REF_RANGES.filter(r => r.standardId === null);
    return REF_RANGES.filter(r => r.standard === filter || (r.standardId && STANDARDS.find(s => s.id === r.standardId)?.regNumber === filter));
  }, [filter]);

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
      <Tabs selectedIndex={scene} onChange={({ selectedIndex }) => setScene(selectedIndex)}>
        <TabList aria-label="Scene">
          <Tab>1 — Reference Range Admin (with new Compliance Standard filter)</Tab>
          <Tab>2 — Results Entry (expanded detail with threshold source)</Tab>
        </TabList>
        <TabPanels>
          {/* ── Scene 1 — Reference Range Admin ──────────────────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Reference Range Admin — Compliance Standard scope dimension</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The existing reference range admin gains a Compliance Standard filter + form field.
              NULL = generic clinical reference range (existing behavior). Non-NULL scopes the row
              to a specific standard at a specific version.
            </p>

            <ExistingRegion>
              <Tile>
                <h5>Reference Range Management</h5>
                <p style={{ fontSize: 12, color: '#525252' }}>
                  Existing admin page · gates: <code>referenceRange.edit</code> (no new permission)
                </p>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <Stack orientation="horizontal" gap={3} style={{ marginBottom: 12, alignItems: 'flex-end' }}>
                  <Dropdown
                    id="std-filter"
                    titleText="Compliance Standard (new filter)"
                    label="Filter by standard"
                    items={['All', '(generic)', ...STANDARDS.map(s => s.regNumber)]}
                    selectedItem={filter}
                    onChange={({ selectedItem }) => setFilter(selectedItem || 'All')}
                  />
                  <Button kind="primary" size="sm" renderIcon={Add}>{t('button.addRange', 'Add Reference Range')}</Button>
                </Stack>

                <Table size="md">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Test</TableHeader>
                      <TableHeader>Sample Type</TableHeader>
                      <TableHeader>Min</TableHeader>
                      <TableHeader>Max</TableHeader>
                      <TableHeader>Unit</TableHeader>
                      <TableHeader style={{ background: '#fcf4d6' }}>Compliance Standard (new column)</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRanges.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.test}</TableCell>
                        <TableCell>{r.sampleType}</TableCell>
                        <TableCell>{r.min ?? '—'}</TableCell>
                        <TableCell>{r.max ?? '—'}</TableCell>
                        <TableCell>{r.unit}</TableCell>
                        <TableCell>
                          {r.standardId
                            ? <Tag type="purple" size="sm">{r.standard}</Tag>
                            : <span style={{ color: '#525252', fontSize: 12, fontStyle: 'italic' }}>{r.standard}</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p style={{ fontSize: 12, color: '#525252', marginTop: 8 }}>
                  ⚠️ Yellow column = new from S-05 v2. Showing {filteredRanges.length} of {REF_RANGES.length} rows.
                </p>
              </Tile>
            </NewRegion>

            <NewRegion label="S-05 v2 form addition">
              <Tile>
                <h5>Add / Edit Reference Range — form gains one field</h5>
                <Grid>
                  <Column lg={4}><TextInput id="rr-test" labelText="Test" defaultValue="Turbidity" readOnly /></Column>
                  <Column lg={4}><TextInput id="rr-sample" labelText="Sample Type" defaultValue="Surface Water" readOnly /></Column>
                  <Column lg={2}><NumberInput id="rr-min" label="Min" defaultValue={0} /></Column>
                  <Column lg={2}><NumberInput id="rr-max" label="Max" defaultValue={25} /></Column>
                  <Column lg={4} style={{ background: '#fcf4d6', padding: 8, borderRadius: 4 }}>
                    <Select id="rr-std" labelText="Compliance Standard (new — optional)" defaultValue="std-001">
                      <SelectItem value="" text="(generic — no compliance standard)" />
                      {STANDARDS.map(s => <SelectItem key={s.id} value={s.id} text={s.regNumber} />)}
                    </Select>
                  </Column>
                </Grid>
                <p style={{ fontSize: 12, color: '#525252', marginTop: 8 }}>
                  ⚠️ Yellow field = new from S-05 v2. NULL = generic; non-NULL scopes the row to that standard.
                </p>
              </Tile>
            </NewRegion>
          </TabPanel>

          {/* ── Scene 2 — Results Entry expanded detail ─────────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Results Entry — Expanded Result Detail with Threshold Source</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The per-result inline indicator itself is <strong>unchanged</strong> — existing OE
              Normal/Abnormal/Critical pattern. The only v2.0 addition is a one-line "Threshold source"
              annotation in the expanded result detail. <strong>No regulation banner</strong> on the
              page header (dropped from v1.0).
            </p>

            <ExistingRegion>
              <Tile>
                <h5>Results Entry — Order ENV-2026-0412</h5>
                <p style={{ fontSize: 12, color: '#525252' }}>
                  Existing page chrome · 4 result rows · click row to expand
                </p>
              </Tile>
            </ExistingRegion>

            <ExistingRegion>
              <Tile>
                <Table size="md">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Accession</TableHeader>
                      <TableHeader>Test</TableHeader>
                      <TableHeader>Result</TableHeader>
                      <TableHeader>Unit</TableHeader>
                      <TableHeader>Flag (existing)</TableHeader>
                      <TableHeader></TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {RESULT_ROWS.map(r => (
                      <React.Fragment key={r.id}>
                        <TableRow>
                          <TableCell><code style={{ fontSize: 12 }}>{r.accession}</code></TableCell>
                          <TableCell>{r.test}</TableCell>
                          <TableCell><strong>{r.value}</strong></TableCell>
                          <TableCell>{r.unit}</TableCell>
                          <TableCell>
                            {r.flag
                              ? <Tag type={FLAG_TAG[r.flag].type} size="sm">{FLAG_TAG[r.flag].label}</Tag>
                              : <span style={{ color: '#8d8d8d', fontSize: 12 }}>—</span>}
                          </TableCell>
                          <TableCell>
                            <Button kind="ghost" size="sm" renderIcon={View}
                              onClick={() => setExpandedResultId(expandedResultId === r.id ? null : r.id)}>
                              {expandedResultId === r.id ? 'Collapse' : 'Expand'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedResultId === r.id && (
                          <TableRow>
                            <TableCell colSpan={6} style={{ background: '#f4f4f4', padding: 0 }}>
                              <NewRegion label="S-05 v2 expanded detail">
                                <div style={{ padding: 12 }}>
                                  <h5 style={{ marginBottom: 8 }}>Result Detail — {r.test}</h5>
                                  {r.source ? (
                                    <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center', marginBottom: 8 }}>
                                      <Tag type="purple" size="sm">Threshold source</Tag>
                                      <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{r.source.label}</span>
                                    </Stack>
                                  ) : (
                                    <p style={{ fontSize: 12, color: '#525252', fontStyle: 'italic' }}>
                                      No reference range matched — no flag applied.
                                    </p>
                                  )}
                                  <p style={{ fontSize: 12, color: '#525252' }}>
                                    Existing override / comment / audit-trail fields below — unchanged.
                                  </p>
                                </div>
                              </NewRegion>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </Tile>
            </ExistingRegion>

            <Tile style={{ background: '#edf5ff', borderLeft: '3px solid #0f62fe' }}>
              <h5>What's NOT here (and that's the point)</h5>
              <ul style={{ fontSize: 13, marginLeft: 16 }}>
                <li>❌ No regulation banner at the top of the page (was in v1.0; dropped)</li>
                <li>❌ No "Compliance Detail Tile" component (was in v1.0; replaced by the 1-line annotation above)</li>
                <li>❌ No new visual flag tier (Pass / Marginal / Fail) — existing Normal / Abnormal / Critical do the work</li>
                <li>❌ No descriptive tag library (split out to S-05a OGC-639)</li>
              </ul>
            </Tile>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
