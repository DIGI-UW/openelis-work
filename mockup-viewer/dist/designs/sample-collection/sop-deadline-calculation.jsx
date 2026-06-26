/**
 * S-03d v2.0 — SOP Holding-Time Auto-Calc & Worklist Deadline Flagging
 * Addendum to S-03 v2.0 (Env/Vector only)
 *
 * Scope dropped from v1.0:
 *   - Generic Required-By field — split out to GENERIC-required-by-field-frs/mockup
 *
 * 3 scenes:
 *   1. Step 1 Order Entry — auto-calculated Required-By with "Suggested" tag
 *   2. Test Catalog Admin — SOP Max Holding Time row
 *   3. Env/Vector Worklist — Deadline column with color-coded indicators
 *
 * Annotation: NewRegion (gold dashed) for new content; ExistingRegion (dimmed) for context.
 */

import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TextInput, Select, SelectItem, NumberInput,
  Button, Tag, Tile, InlineNotification,
  DatePicker, DatePickerInput, TimePicker,
} from '@carbon/react';
import { Time, Calculator, Edit, WarningAlt, Checkmark } from '@carbon/icons-react';

const t = (k, f) => f || k;

const NewRegion = ({ children, label = 'S-03d v2 NEW' }) => (
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
  { id: 't-001', name: 'pH', loinc: '11558-4', holdingHours: 0.25 },          // 15 min
  { id: 't-002', name: 'Dissolved Oxygen', loinc: '19218-7', holdingHours: 0.25 },
  { id: 't-003', name: 'Total Coliform', loinc: '5794-0', holdingHours: 24 },  // 24 h
  { id: 't-004', name: 'BOD₅', loinc: '5839-3', holdingHours: 48 },             // 48 h
  { id: 't-005', name: 'Lead (Pb)', loinc: '5671-0', holdingHours: 168 },       // 7 days
];

const MOCK_WORKLIST = [
  { lab: 'ENV-2026-0410', site: 'WS-001 Ciliwung', collected: '2026-04-25 06:00', requiredBy: '2026-04-25 21:00', minutesLeft: 870 },
  { lab: 'ENV-2026-0411', site: 'WS-002 Cisadane', collected: '2026-04-25 04:30', requiredBy: '2026-04-25 19:30', minutesLeft: 510 },
  { lab: 'ENV-2026-0412', site: 'WS-001 Ciliwung', collected: '2026-04-25 02:00', requiredBy: '2026-04-25 17:00', minutesLeft: 180 },
  { lab: 'ENV-2026-0413', site: 'WS-003 Brantas', collected: '2026-04-24 22:00', requiredBy: '2026-04-25 13:00', minutesLeft: -120 },
];

function deadlineTag(minutesLeft) {
  if (minutesLeft < 0) return { type: 'red', label: 'Exceeded' };
  if (minutesLeft < 240) return { type: 'magenta', label: 'Imminent' };
  if (minutesLeft < 1440) return { type: 'warm-gray', label: 'Approaching' };
  return { type: 'green', label: 'On time' };
}

// ─── Component ──────────────────────────────────────────────────────

export default function S03dMockupV2() {
  const [scene, setScene] = useState(0);

  // Scene 1
  const [selectedTestIds, setSelectedTestIds] = useState(['t-001', 't-002', 't-003']);
  const [collectionDateTime, setCollectionDateTime] = useState('2026-04-25 06:00');
  const [userOverride, setUserOverride] = useState(false);

  const minHolding = useMemo(() => {
    const tests = MOCK_TESTS.filter(t => selectedTestIds.includes(t.id) && t.holdingHours);
    if (!tests.length) return null;
    return Math.min(...tests.map(t => t.holdingHours));
  }, [selectedTestIds]);

  const suggestedDeadline = useMemo(() => {
    if (!minHolding || !collectionDateTime) return null;
    const collected = new Date(collectionDateTime.replace(' ', 'T'));
    const deadline = new Date(collected.getTime() + minHolding * 3600 * 1000);
    return deadline.toISOString().slice(0, 16).replace('T', ' ');
  }, [minHolding, collectionDateTime]);

  const driverTest = MOCK_TESTS
    .filter(t => selectedTestIds.includes(t.id) && t.holdingHours === minHolding)[0];

  // Scene 2
  const [adminHolding, setAdminHolding] = useState({});

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Tabs selectedIndex={scene} onChange={({ selectedIndex }) => setScene(selectedIndex)}>
        <TabList aria-label="Scene">
          <Tab>1 — Step 1 Auto-Calc</Tab>
          <Tab>2 — Test Catalog Admin</Tab>
          <Tab>3 — Env/Vector Worklist</Tab>
        </TabList>
        <TabPanels>
          {/* ── Scene 1 — Step 1 with auto-calc Required-By ─────────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Step 1 — Required-By Auto-Calculation</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              When tests with SOP holding times are selected and a collection date/time is known,
              the system suggests <code>collection_datetime + min(sop_max_holding_hours)</code>
              and auto-populates the Required-By field with a "Suggested" tag.
            </p>

            <ExistingRegion>
              <Tile>
                <h5 style={{ marginBottom: 12 }}>{t('heading.tests', 'Suggested Tests')}</h5>
                <Table size="sm">
                  <TableHead>
                    <TableRow>
                      <TableHeader></TableHeader>
                      <TableHeader>Test</TableHeader>
                      <TableHeader>LOINC</TableHeader>
                      <TableHeader>SOP Max Holding (h)</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MOCK_TESTS.map(test => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTestIds.includes(test.id)}
                            onChange={() => setSelectedTestIds(prev =>
                              prev.includes(test.id) ? prev.filter(x => x !== test.id) : [...prev, test.id])}
                          />
                        </TableCell>
                        <TableCell>{test.name}</TableCell>
                        <TableCell><code style={{ fontSize: 12 }}>{test.loinc}</code></TableCell>
                        <TableCell>{test.holdingHours}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Tile>
              <Tile style={{ marginTop: 8 }}>
                <Grid>
                  <Column lg={4}>
                    <TextInput
                      id="coll-dt"
                      labelText="Collection Date/Time (default)"
                      value={collectionDateTime}
                      onChange={(e) => setCollectionDateTime(e.target.value)}
                    />
                  </Column>
                </Grid>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', marginBottom: 8 }}>
                  <Calculator size={20} />
                  <h5 style={{ margin: 0 }}>{t('heading.requiredBy', 'Required By (Auto-Calculated)')}</h5>
                  {!userOverride && suggestedDeadline && <Tag type="blue" size="sm">Suggested</Tag>}
                  {userOverride && <Tag type="gray" size="sm">User override</Tag>}
                </Stack>
                {suggestedDeadline ? (
                  <InlineNotification
                    kind="info"
                    title=""
                    subtitle={
                      <span>
                        Calculated from <strong>{collectionDateTime}</strong>
                        {' + '}
                        <strong>min({minHolding}h)</strong> driven by <code>{driverTest?.name}</code>.
                        Live-updates as tests change unless overridden.
                      </span>
                    }
                    hideCloseButton lowContrast
                    style={{ marginBottom: 12 }}
                  />
                ) : (
                  <p style={{ fontSize: 13, color: '#525252' }}>
                    Add tests with holding times + a collection date/time to auto-calculate.
                  </p>
                )}
                <Grid>
                  <Column lg={5}>
                    <TextInput
                      id="req-by"
                      labelText="Required By"
                      value={userOverride ? '2026-04-26 09:00' : (suggestedDeadline || '')}
                      readOnly={!userOverride}
                      placeholder="—"
                    />
                  </Column>
                  <Column lg={3} style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={Edit}
                      onClick={() => setUserOverride(!userOverride)}
                    >
                      {userOverride ? 'Re-enable auto-calc' : 'Override'}
                    </Button>
                  </Column>
                </Grid>
              </Tile>
            </NewRegion>
          </TabPanel>

          {/* ── Scene 2 — Test Catalog Admin ────────────────────────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Test Catalog Admin — SOP Max Holding Time</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The test catalog admin form gains a <strong>SOP Max Holding Time (hours)</strong> column for env/vector tests.
              Optional; null means "no SOP holding time defined."
            </p>

            <ExistingRegion>
              <Tile>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Test Name</TableHeader>
                      <TableHeader>LOINC</TableHeader>
                      <TableHeader>Domain</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MOCK_TESTS.map(test => (
                      <TableRow key={test.id}>
                        <TableCell>{test.name}</TableCell>
                        <TableCell><code style={{ fontSize: 12 }}>{test.loinc}</code></TableCell>
                        <TableCell><Tag type="purple" size="sm">Environmental</Tag></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <h5 style={{ marginBottom: 12 }}>SOP Max Holding Time — env/vector tests only</h5>
                <Table size="sm">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Test</TableHeader>
                      <TableHeader>SOP Max Holding (hours)</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MOCK_TESTS.map(test => (
                      <TableRow key={test.id}>
                        <TableCell>{test.name}</TableCell>
                        <TableCell>
                          <NumberInput
                            id={`hold-${test.id}`}
                            hideLabel
                            label=""
                            min={0}
                            value={adminHolding[test.id] ?? test.holdingHours}
                            onChange={(_, { value }) => setAdminHolding(prev => ({ ...prev, [test.id]: value }))}
                            size="sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Tile>
            </NewRegion>
          </TabPanel>

          {/* ── Scene 3 — Worklist ─────────────────────────────────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Env/Vector Testing Worklist — Deadline Column</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The env/vector testing worklist gains a color-coded <strong>Deadline</strong> column.
              Updates live as time elapses.
            </p>

            <NewRegion label="S-03d v2 NEW">
              <Tile>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Lab Number</TableHeader>
                      <TableHeader>Site</TableHeader>
                      <TableHeader>Collected</TableHeader>
                      <TableHeader>Required By</TableHeader>
                      <TableHeader>Deadline</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MOCK_WORKLIST.map(row => {
                      const tag = deadlineTag(row.minutesLeft);
                      return (
                        <TableRow key={row.lab}>
                          <TableCell><code>{row.lab}</code></TableCell>
                          <TableCell>{row.site}</TableCell>
                          <TableCell><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.collected}</span></TableCell>
                          <TableCell><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.requiredBy}</span></TableCell>
                          <TableCell>
                            <Tag type={tag.type} size="sm">{tag.label}</Tag>
                            <span style={{ fontSize: 11, color: '#525252', marginLeft: 8 }}>
                              {row.minutesLeft >= 0
                                ? `${Math.floor(row.minutesLeft / 60)}h ${row.minutesLeft % 60}m left`
                                : `Past by ${Math.abs(Math.floor(row.minutesLeft / 60))}h ${Math.abs(row.minutesLeft) % 60}m`}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <p style={{ fontSize: 12, color: '#525252', marginTop: 12 }}>
                  Color thresholds: ≥24h = green "On time"; 4–24h = warm-gray "Approaching"; &lt;4h = magenta "Imminent"; past = red "Exceeded".
                </p>
              </Tile>
            </NewRegion>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
