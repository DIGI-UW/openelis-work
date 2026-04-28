/**
 * S-09 v2.0 — Pre-Analytical Eligibility Gate & Resampling
 * Addendum to S-03 v2.0 §5.3 (Step 3 QA/QC + Intake Acceptance)
 *
 * Rebased from v1.0:
 *   - 4-step model → 3-step model (Step 3 instead of Step 4)
 *   - Eligibility Worklist → Order Dashboard filter on status=PENDING_INTAKE
 *   - Shipment batch grouping deferred (P2)
 *   - Vector CollectionLot variant deferred (V-02)
 *
 * 4 scenes:
 *   1. SampleType Admin — new "Acceptance Criteria" tab
 *   2. Step 3 sample row + criteria checklist side panel (Eligible / Review tags)
 *   3. NCE dialog with new "Resample" radio option
 *   4. Lab Unit admin — per-domain gate behavior config
 */

import React, { useState } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TextInput, TextArea, NumberInput, Select, SelectItem, RadioButton, RadioButtonGroup,
  Button, Tag, Tile, InlineNotification, Modal,
  Toggle,
} from '@carbon/react';
import { Checkmark, Close, Warning, ArrowRight, Email } from '@carbon/icons-react';

const t = (k, f) => f || k;

const NewRegion = ({ children, label = 'S-09 v2 NEW' }) => (
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

// ─── Mock Data ──────────────────────────────────────────────────────

const MOCK_SAMPLES = [
  { id: 's-1', idx: 1, type: 'Surface Water', accession: 'ENV-2026-0412.001',
    transitH: 4, volMl: 500, tempC: 4.5, status: 'eligible' },
  { id: 's-2', idx: 2, type: 'Surface Water', accession: 'ENV-2026-0412.002',
    transitH: 26, volMl: 500, tempC: 6.0, status: 'review' /* transit > 24h */ },
  { id: 's-3', idx: 3, type: 'Groundwater', accession: 'ENV-2026-0412.003',
    transitH: 8, volMl: 250, tempC: 18.0, status: 'review' /* temp out of range, vol low */ },
];

const SAMPLETYPE_CRITERIA = {
  'Surface Water': {
    transitMaxH: 24,
    volumeMin: 500, volumeMax: 1000,
    tempMin: 0, tempMax: 6,
    containers: ['Sterile bottle (HDPE)', 'Brown glass'],
  },
  'Groundwater': {
    transitMaxH: 24,
    volumeMin: 500, volumeMax: 1000,
    tempMin: 0, tempMax: 6,
    containers: ['Sterile bottle (HDPE)'],
  },
};

// Label-completeness handled by existing OE label management module — not part of S-09.
const evaluateCriteria = (sample) => {
  const c = SAMPLETYPE_CRITERIA[sample.type];
  if (!c) return [];
  return [
    { name: 'Transit time max',  pass: sample.transitH <= c.transitMaxH,
      detail: `${sample.transitH}h vs max ${c.transitMaxH}h` },
    { name: 'Volume in range',   pass: sample.volMl >= c.volumeMin && sample.volMl <= c.volumeMax,
      detail: `${sample.volMl}mL vs ${c.volumeMin}–${c.volumeMax}mL` },
    { name: 'Receipt temp in range', pass: sample.tempC >= c.tempMin && sample.tempC <= c.tempMax,
      detail: `${sample.tempC}°C vs ${c.tempMin}–${c.tempMax}°C` },
    { name: 'Container type valid', pass: true,
      detail: c.containers[0] },
  ];
};

// ─── Component ──────────────────────────────────────────────────────

export default function S09MockupV2() {
  const [scene, setScene] = useState(0);
  const [openSampleId, setOpenSampleId] = useState(null);
  const [showNceDialog, setShowNceDialog] = useState(false);
  const [nceAction, setNceAction] = useState('flag');
  const [nceReason, setNceReason] = useState('TRANSIT-EXCEEDED');

  const openSample = MOCK_SAMPLES.find(s => s.id === openSampleId);
  const criteria = openSample ? evaluateCriteria(openSample) : [];

  // Scene 4
  const [gateConfig, setGateConfig] = useState({ Clinical: 'Prompted', Env: 'Mandatory', Vector: 'Mandatory' });

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
      <Tabs selectedIndex={scene} onChange={({ selectedIndex }) => { setScene(selectedIndex); setOpenSampleId(null); }}>
        <TabList aria-label="Scene">
          <Tab>1 — SampleType Acceptance Criteria</Tab>
          <Tab>2 — Step 3 with Criteria Checklist</Tab>
          <Tab>3 — NCE Dialog (Resample option)</Tab>
          <Tab>4 — Lab Unit Gate Config</Tab>
        </TabList>
        <TabPanels>
          {/* ── Scene 1 — SampleType Admin Acceptance Criteria tab ──── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>SampleType Admin — Acceptance Criteria Tab</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The existing SampleType admin form gains a new "Acceptance Criteria" tab where admins
              configure rules per SampleType. Optional — if no criteria set, the gate is effectively skipped.
            </p>

            <ExistingRegion>
              <Tile>
                <h5>SampleType: Surface Water</h5>
                <p style={{ fontSize: 12, color: '#525252' }}>Existing tabs: Basic Info | Domain Classification | <strong>Acceptance Criteria (NEW)</strong></p>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <h5 style={{ marginBottom: 12 }}>Acceptance Criteria — Surface Water</h5>
                <Grid>
                  <Column lg={4}>
                    <NumberInput id="transit" label="Transit time max (hours)" defaultValue={24} min={0} />
                  </Column>
                  <Column lg={4}>
                    <NumberInput id="vol-min" label="Volume min (mL)" defaultValue={500} />
                  </Column>
                  <Column lg={4}>
                    <NumberInput id="vol-max" label="Volume max (mL)" defaultValue={1000} />
                  </Column>
                  <Column lg={4}>
                    <NumberInput id="temp-min" label="Receipt temp min (°C)" defaultValue={0} step={0.1} />
                  </Column>
                  <Column lg={4}>
                    <NumberInput id="temp-max" label="Receipt temp max (°C)" defaultValue={6} step={0.1} />
                  </Column>
                  <Column lg={12}>
                    <TextInput id="containers" labelText="Required container types (comma-separated)"
                               defaultValue="Sterile bottle (HDPE), Brown glass" />
                  </Column>
                  <Column lg={12}>
                    <p style={{ fontSize: 12, color: '#525252', marginTop: 8 }}>
                      <em>Note: label-completeness checks are handled by the existing OE label management module — not configured here.</em>
                    </p>
                  </Column>
                </Grid>
              </Tile>
            </NewRegion>
          </TabPanel>

          {/* ── Scene 2 — Step 3 with criteria checklist ─────────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Step 3 (S-03 v2.0) — Per-Sample Eligibility</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              Each sample row at S-03 v2.0 §5.3 now shows an Eligible / Review tag based on the auto-evaluated
              criteria. Click <strong>Open Eligibility</strong> to inspect the per-sample checklist.
            </p>

            <ExistingRegion>
              <Tile>
                <h5>Order ENV-2026-0412 — Step 3 (Sample Intake)</h5>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <Table size="md">
                  <TableHead>
                    <TableRow>
                      <TableHeader>#</TableHeader>
                      <TableHeader>Sample Type</TableHeader>
                      <TableHeader>Accession</TableHeader>
                      <TableHeader style={{ background: '#fcf4d6' }}>Eligibility (new)</TableHeader>
                      <TableHeader>NCE Button (existing)</TableHeader>
                      <TableHeader></TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MOCK_SAMPLES.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.idx}</TableCell>
                        <TableCell>{s.type}</TableCell>
                        <TableCell><code style={{ fontSize: 12 }}>{s.accession}</code></TableCell>
                        <TableCell>
                          {s.status === 'eligible'
                            ? <Tag type="green" size="sm">✓ Eligible</Tag>
                            : <Tag type="warm-gray" size="sm">⚠ Review</Tag>}
                        </TableCell>
                        <TableCell>
                          <Button kind="tertiary" size="sm" renderIcon={Warning} onClick={() => setShowNceDialog(true)}>
                            Flag NCE
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button kind="ghost" size="sm" onClick={() => setOpenSampleId(s.id)}>
                            Open Eligibility →
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Tile>
            </NewRegion>

            {openSample && (
              <NewRegion label="S-09 v2 Side Panel">
                <Tile>
                  <h5>Eligibility Checklist — {openSample.accession} ({openSample.type})</h5>
                  <Table size="sm">
                    <TableHead>
                      <TableRow>
                        <TableHeader style={{ width: 60 }}>Status</TableHeader>
                        <TableHeader>Criterion</TableHeader>
                        <TableHeader>Detail</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {criteria.map(c => (
                        <TableRow key={c.name}>
                          <TableCell>
                            {c.pass
                              ? <Tag type="green" size="sm">✓</Tag>
                              : <Tag type="red" size="sm">✕</Tag>}
                          </TableCell>
                          <TableCell>{c.name}</TableCell>
                          <TableCell><span style={{ fontSize: 12, color: c.pass ? '#525252' : '#a2191f' }}>{c.detail}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p style={{ fontSize: 12, color: '#525252', marginTop: 12 }}>
                    Failing criteria pre-populate the NCE dialog reason picklist when the operator clicks Flag NCE.
                  </p>
                  <Stack orientation="horizontal" gap={3} style={{ marginTop: 12 }}>
                    <Button kind="ghost" onClick={() => setOpenSampleId(null)}>Close</Button>
                    <Button kind="primary" onClick={() => { setShowNceDialog(true); setOpenSampleId(null); }}>
                      Flag NCE with these reasons →
                    </Button>
                  </Stack>
                </Tile>
              </NewRegion>
            )}
          </TabPanel>

          {/* ── Scene 3 — NCE dialog with Resample option ─────────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>NCE Dialog — New "Resample" Radio Option</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The existing OE NCE dialog (coded reason + decision) gains a third sample_action option: <strong>Resample</strong>.
              On commit, Resample creates a linked new Draft order pre-populated from the original and notifies the customer.
            </p>

            <Button onClick={() => setShowNceDialog(true)}>Open NCE Dialog (demo)</Button>

            <Modal
              open={showNceDialog}
              modalHeading="Flag NCE — Sample ENV-2026-0412.002"
              primaryButtonText="Commit"
              secondaryButtonText="Cancel"
              onRequestClose={() => setShowNceDialog(false)}
              onRequestSubmit={() => setShowNceDialog(false)}
            >
              <ExistingRegion>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#525252', marginBottom: 6 }}>NCE Reason (existing coded picklist)</p>
                  <Select
                    id="nce-reason"
                    labelText=""
                    hideLabel
                    value={nceReason}
                    onChange={(e) => setNceReason(e.target.value)}
                  >
                    <SelectItem value="TRANSIT-EXCEEDED" text="Transit time exceeded" />
                    <SelectItem value="COND-BROKEN" text="Cold-chain broken" />
                    <SelectItem value="CONT-DAMAGED" text="Container damaged" />
                    <SelectItem value="VOL-INSUFFICIENT" text="Volume insufficient" />
                  </Select>
                </div>
              </ExistingRegion>

              <NewRegion label="S-09 v2 NEW">
                <p style={{ fontSize: 12, color: '#525252', marginBottom: 6 }}>Sample Action (new third radio)</p>
                <RadioButtonGroup
                  name="sample-action"
                  valueSelected={nceAction}
                  onChange={(value) => setNceAction(value)}
                  orientation="vertical"
                >
                  <RadioButton id="action-flag" labelText="Continue with NCE flag (existing)" value="flag" />
                  <RadioButton id="action-reject" labelText="Reject sample (existing)" value="reject" />
                  <RadioButton id="action-resample" labelText="Resample — create linked new order + notify customer (NEW)" value="resample" />
                </RadioButtonGroup>

                {nceAction === 'resample' && (
                  <div style={{ marginTop: 12, padding: 12, background: '#edf5ff', borderLeft: '3px solid #0f62fe', fontSize: 13 }}>
                    <strong>On commit:</strong>
                    <ul style={{ marginTop: 6, marginLeft: 16 }}>
                      <li>Original sample marked <code>REJECTED_RESAMPLING</code> (terminal)</li>
                      <li>New Draft order created with <code>resampled_from = ENV-2026-0412</code>; site, standard, sample types, tests pre-populated</li>
                      <li><Email size={14} style={{ verticalAlign: 'middle' }} /> Notification sent to original requester via configured channel (email or TextIt SMS)</li>
                    </ul>
                  </div>
                )}
              </NewRegion>

              <ExistingRegion>
                <TextArea
                  id="nce-notes"
                  labelText="Notes (existing free-text)"
                  rows={2}
                  placeholder="Additional context for the NCE record"
                />
              </ExistingRegion>
            </Modal>
          </TabPanel>

          {/* ── Scene 4 — Lab Unit gate config ─────────────────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Lab Unit Admin — Gate Behavior per Domain</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              Each lab unit configures gate behavior per-domain: <strong>Mandatory</strong> (block submit until criteria met),
              <strong> Prompted</strong> (show but allow override), or <strong>Disabled</strong> (criteria checklist hidden).
              SILNAS labs configure Mandatory for all three domains.
            </p>

            <ExistingRegion>
              <Tile>
                <h5>Lab Unit — Env Lab Jakarta</h5>
                <Grid>
                  <Column lg={4}><TextInput id="ln" labelText="Name" value="Env Lab Jakarta" readOnly /></Column>
                  <Column lg={4}><TextInput id="ld" labelText="Domain Assignment" value="Environmental" readOnly /></Column>
                </Grid>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <h5 style={{ marginBottom: 12 }}>Eligibility Gate Behavior</h5>
                <Table size="sm">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Domain</TableHeader>
                      <TableHeader>Gate Behavior</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['Clinical', 'Env', 'Vector'].map(d => (
                      <TableRow key={d}>
                        <TableCell>{d}</TableCell>
                        <TableCell>
                          <Select
                            id={`gb-${d}`}
                            labelText="" hideLabel size="sm"
                            value={gateConfig[d]}
                            onChange={(e) => setGateConfig(prev => ({ ...prev, [d]: e.target.value }))}
                          >
                            <SelectItem value="Mandatory" text="Mandatory — block submit if any sample failing" />
                            <SelectItem value="Prompted"  text="Prompted — show but allow single-click override" />
                            <SelectItem value="Disabled"  text="Disabled — hide criteria checklist" />
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Tile>
            </NewRegion>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
