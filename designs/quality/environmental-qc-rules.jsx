/**
 * S-08 v2.0 — QC Result Evaluation & Validation Warning
 * Reframed from v1.0: focuses on the downstream half (result eval + validator warning).
 * Dropped from v1.0:
 *   - QC Protocol Configuration admin page (per 2026-04-25: user knows requirements)
 *   - QC Sample Creation flow (already in S-03 v2.0 §5.3.2 quick-add buttons)
 *
 * 3 scenes:
 *   1. Test Catalog Admin — three new QC threshold fields per env/vector test
 *   2. Results Entry — "QC Status" column added to expanded panel
 *   3. Validation Screen — warning banner with required acknowledgment + justification
 */

import React, { useState } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TextInput, TextArea, NumberInput, Checkbox,
  Button, Tag, Tile, InlineNotification,
} from '@carbon/react';
import { Checkmark, Warning, Close, Edit, Save } from '@carbon/icons-react';

const t = (k, f) => f || k;

const NewRegion = ({ children, label = 'S-08 v2 NEW' }) => (
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

const MOCK_TESTS = [
  { id: 't-014', name: 'Lead (Pb)',     unit: 'mg/L',     blankThreshold: 0.003, rpdThreshold: 20, recoveryWindow: 20 },
  { id: 't-015', name: 'Mercury (Hg)',  unit: 'mg/L',     blankThreshold: 0.0001, rpdThreshold: 20, recoveryWindow: 20 },
  { id: 't-005', name: 'pH',            unit: '—',        blankThreshold: null,  rpdThreshold: 5,  recoveryWindow: 10 },
  { id: 't-008', name: 'COD',           unit: 'mg/L',     blankThreshold: 5,     rpdThreshold: 25, recoveryWindow: 20 },
];

const MOCK_RESULTS = [
  // Client samples
  { id: 'r-001', accession: 'ENV-2026-0412.001', sampleType: 'Surface Water', test: 'Lead (Pb)',     result: '0.05 mg/L',  qcType: null,        qcEval: null,    detail: null },
  { id: 'r-002', accession: 'ENV-2026-0412.001', sampleType: 'Surface Water', test: 'Mercury (Hg)',  result: '0.0008 mg/L', qcType: null,        qcEval: null,    detail: null },
  { id: 'r-003', accession: 'ENV-2026-0412.002', sampleType: 'Surface Water', test: 'Lead (Pb)',     result: '0.04 mg/L',  qcType: null,        qcEval: null,    detail: null },
  // QC samples
  { id: 'r-101', accession: 'QC-BLNK-001',       sampleType: '—',             test: 'Lead (Pb)',     result: '0.001 mg/L', qcType: 'BLANK',     qcEval: 'PASS',  detail: '0.001 ≤ 0.003 (threshold)' },
  { id: 'r-102', accession: 'QC-BLNK-001',       sampleType: '—',             test: 'Mercury (Hg)',  result: '0.0003 mg/L', qcType: 'BLANK',    qcEval: 'FAIL',  detail: '0.0003 > 0.0001 threshold (potential contamination)' },
  { id: 'r-103', accession: 'QC-DUP-001',        sampleType: '—',             test: 'Lead (Pb)',     result: '0.052 mg/L', qcType: 'DUPLICATE', qcEval: 'PASS',  detail: 'RPD = 3.9% (threshold 20%); parent ENV-2026-0412.001' },
  { id: 'r-104', accession: 'QC-CTRL-001',       sampleType: '—',             test: 'Lead (Pb)',     result: '0.078 mg/L', qcType: 'CONTROL',   qcEval: 'FAIL',  detail: 'Recovery 78% (window 80–120%); expected 0.100' },
];

const QC_EVAL_TAG = {
  PASS: { type: 'green', icon: <Checkmark size={14} />, label: 'QC Pass' },
  FAIL: { type: 'red',   icon: <Close size={14} />,     label: 'QC Fail' },
  N_A:  { type: 'gray',  icon: null,                     label: 'QC N/A' },
};

// ─── Component ──────────────────────────────────────────────────────

export default function S08MockupV2() {
  const [scene, setScene] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [justification, setJustification] = useState('');
  const failures = MOCK_RESULTS.filter(r => r.qcEval === 'FAIL');
  const canRelease = failures.length === 0 || (acknowledged && justification.trim().length > 0);

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
      <Tabs selectedIndex={scene} onChange={({ selectedIndex }) => setScene(selectedIndex)}>
        <TabList aria-label="Scene">
          <Tab>1 — Test Catalog Admin</Tab>
          <Tab>2 — Results Entry (QC Status)</Tab>
          <Tab>3 — Validation (Warning + Acknowledgment)</Tab>
        </TabList>
        <TabPanels>
          {/* ── Scene 1 — Test Catalog Admin ─────────────────────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Test Catalog Admin — QC Acceptance Thresholds</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              Three new optional fields per env/vector test: blank threshold (units of test),
              RPD threshold (%), and recovery window (%). These drive QC evaluation at result-save time.
            </p>

            <ExistingRegion>
              <Tile>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Test</TableHeader>
                      <TableHeader>Unit</TableHeader>
                      <TableHeader>Domain</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MOCK_TESTS.map(test => (
                      <TableRow key={test.id}>
                        <TableCell>{test.name}</TableCell>
                        <TableCell>{test.unit}</TableCell>
                        <TableCell><Tag type="purple" size="sm">Environmental</Tag></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <h5 style={{ marginBottom: 12 }}>QC Acceptance Thresholds — env/vector tests only</h5>
                <Table size="sm">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Test</TableHeader>
                      <TableHeader>Blank Threshold</TableHeader>
                      <TableHeader>RPD Threshold (%)</TableHeader>
                      <TableHeader>Recovery Window (± %)</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MOCK_TESTS.map(test => (
                      <TableRow key={test.id}>
                        <TableCell>{test.name}</TableCell>
                        <TableCell>
                          <NumberInput id={`bt-${test.id}`} hideLabel label="" size="sm"
                                       defaultValue={test.blankThreshold ?? ''} step={0.001} />
                        </TableCell>
                        <TableCell>
                          <NumberInput id={`rpd-${test.id}`} hideLabel label="" size="sm"
                                       defaultValue={test.rpdThreshold} min={0} max={100} />
                        </TableCell>
                        <TableCell>
                          <NumberInput id={`rec-${test.id}`} hideLabel label="" size="sm"
                                       defaultValue={test.recoveryWindow} min={0} max={100} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Tile>
            </NewRegion>
          </TabPanel>

          {/* ── Scene 2 — Results Entry with QC Status column ────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Results Entry — QC Status Column</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The Results Entry expanded panel gains a "QC Status" column.
              For client samples, status is shown when a duplicate exists.
              For QC samples (BLANK/DUPLICATE/CONTROL), status reflects auto-evaluation against the test's thresholds.
            </p>

            <ExistingRegion>
              <Tile>
                <h5>Order ENV-2026-0412 — Results Entry</h5>
                <Stack orientation="horizontal" gap={3}>
                  <Tag type="purple" size="sm">Environmental</Tag>
                  <p style={{ fontSize: 12, color: '#525252' }}>Site: WS-001 Ciliwung · 8 client samples · 4 QC samples</p>
                </Stack>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <h5 style={{ marginBottom: 12 }}>Results Table (with new QC Status column)</h5>
                <Table size="md">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Accession</TableHeader>
                      <TableHeader>Test</TableHeader>
                      <TableHeader>Result</TableHeader>
                      <TableHeader>Sample Kind</TableHeader>
                      <TableHeader style={{ background: '#fcf4d6' }}>QC Status (new)</TableHeader>
                      <TableHeader style={{ background: '#fcf4d6' }}>Detail (new)</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MOCK_RESULTS.map(r => {
                      const tag = r.qcEval ? QC_EVAL_TAG[r.qcEval] : null;
                      return (
                        <TableRow key={r.id}>
                          <TableCell><code style={{ fontSize: 12 }}>{r.accession}</code></TableCell>
                          <TableCell>{r.test}</TableCell>
                          <TableCell><strong>{r.result}</strong></TableCell>
                          <TableCell>
                            {r.qcType
                              ? <Tag type={r.qcType === 'BLANK' ? 'gray' : r.qcType === 'DUPLICATE' ? 'cyan' : 'green'} size="sm">{r.qcType}</Tag>
                              : <span style={{ color: '#525252', fontSize: 12 }}>Client sample</span>}
                          </TableCell>
                          <TableCell>
                            {tag ? (
                              <Stack orientation="horizontal" gap={1} style={{ alignItems: 'center' }}>
                                <Tag type={tag.type} size="sm">{tag.label}</Tag>
                              </Stack>
                            ) : <span style={{ color: '#8d8d8d', fontSize: 12 }}>—</span>}
                          </TableCell>
                          <TableCell>
                            <span style={{ fontSize: 12, color: r.qcEval === 'FAIL' ? '#a2191f' : '#525252' }}>
                              {r.detail || '—'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <p style={{ fontSize: 12, color: '#525252', marginTop: 12 }}>
                  ⚠️ Yellow column headers indicate new columns. QC evaluation runs at result-save time;
                  failed evaluations surface as warnings on the validation screen (Scene 3).
                </p>
              </Tile>
            </NewRegion>
          </TabPanel>

          {/* ── Scene 3 — Validation with warning + acknowledgment ─── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Validation Screen — QC Failure Warning</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              When a batch contains failed QC samples, a warning banner blocks Release Results
              until the validator acknowledges + provides justification (audit-logged).
            </p>

            <ExistingRegion>
              <Tile>
                <h5>Validation — Order ENV-2026-0412</h5>
                <Stack orientation="horizontal" gap={3}>
                  <Tag type="purple" size="sm">Environmental</Tag>
                  <p style={{ fontSize: 12, color: '#525252' }}>3 client results validated · 4 QC results auto-evaluated</p>
                </Stack>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <InlineNotification
                  kind="warning"
                  title={t('qc.warningTitle', `QC failures detected — ${failures.length} of ${MOCK_RESULTS.filter(r => r.qcType).length} QC samples failed acceptance criteria`)}
                  subtitle={t('qc.warningSubtitle', 'Review and acknowledge below before releasing results.')}
                  hideCloseButton lowContrast
                  style={{ marginBottom: 12 }}
                />

                <h5 style={{ marginBottom: 8 }}>Failed QC Samples</h5>
                <Table size="sm">
                  <TableHead>
                    <TableRow>
                      <TableHeader>QC Sample</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Test</TableHeader>
                      <TableHeader>Result</TableHeader>
                      <TableHeader>Detail</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {failures.map(r => (
                      <TableRow key={r.id}>
                        <TableCell><code style={{ fontSize: 12 }}>{r.accession}</code></TableCell>
                        <TableCell><Tag type={r.qcType === 'BLANK' ? 'gray' : 'green'} size="sm">{r.qcType}</Tag></TableCell>
                        <TableCell>{r.test}</TableCell>
                        <TableCell><strong>{r.result}</strong></TableCell>
                        <TableCell><span style={{ fontSize: 12, color: '#a2191f' }}>{r.detail}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div style={{ marginTop: 16, padding: 16, border: '1px solid #e0e0e0', background: '#fcf4d6' }}>
                  <h5 style={{ marginBottom: 8 }}>Required Acknowledgment</h5>
                  <Checkbox
                    id="ack-checkbox"
                    labelText={t('qc.ackLabel', 'I have reviewed the QC failures and assessed their impact on the result release.')}
                    checked={acknowledged}
                    onChange={(_, { checked }) => setAcknowledged(checked)}
                  />
                  <TextArea
                    id="ack-justify"
                    labelText={t('qc.justificationLabel', 'Justification (required, max 500 chars)')}
                    rows={2}
                    maxLength={500}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    style={{ marginTop: 12 }}
                    placeholder="Why are these results acceptable to release despite QC failure?"
                  />
                </div>

                <Stack orientation="horizontal" gap={3} style={{ marginTop: 16, justifyContent: 'flex-end' }}>
                  <Button kind="ghost">Return to Analyst</Button>
                  <Button kind="primary" disabled={!canRelease}>
                    {canRelease ? 'Release Results' : 'Acknowledge + justify to release'}
                  </Button>
                </Stack>
              </Tile>
            </NewRegion>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
