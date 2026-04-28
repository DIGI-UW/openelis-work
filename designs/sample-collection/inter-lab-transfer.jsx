/**
 * S-14 v1.0 — Inter-Lab Transfer & Subcontract
 * Addendum to existing OE Refer Out / Referral module
 *
 * Supersedes (merged): S-03c v1.0 + originally-planned S-14
 *
 * 2 scenes:
 *   1. Refer Out — Subcontract Metadata Panel (added below existing referral fields)
 *   2. Referral Dashboard — new Subcontract Status column + filter + Expected Return column
 */

import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TextInput, TextArea, Select, SelectItem,
  Button, Tag, Tile, IconButton,
  DatePicker, DatePickerInput, TimePicker,
  Dropdown,
} from '@carbon/react';
import { Edit, View, Save, Filter as FilterIcon, ArrowRight, Email } from '@carbon/icons-react';

const t = (k, f) => f || k;

const NewRegion = ({ children, label = 'S-14 NEW' }) => (
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

const STATUS_TAGS = {
  DRAFT: { type: 'gray', label: 'Draft' },
  DISPATCHED: { type: 'blue', label: 'Dispatched' },
  RECEIVED: { type: 'cyan', label: 'Received' },
  RESULTS_RETURNED: { type: 'teal', label: 'Results Returned' },
  CLOSED: { type: 'green', label: 'Closed' },
};

const MOCK_REFERRALS = [
  { id: 1, lab: 'ENV-2026-0410', target: 'Lab Bandung Selatan', tests: 'Pb, Hg, Cd', status: 'DISPATCHED', dispatched: '2026-04-22 14:30', expected: '2026-04-29', overdue: false },
  { id: 2, lab: 'ENV-2026-0408', target: 'PT Lab Sertifikasi', tests: 'COD, BOD₅', status: 'RECEIVED', dispatched: '2026-04-20 09:15', expected: '2026-04-27', overdue: false },
  { id: 3, lab: 'ENV-2026-0395', target: 'Lab UI Depok', tests: 'Microbiological panel', status: 'DISPATCHED', dispatched: '2026-04-15 11:00', expected: '2026-04-22', overdue: true },
  { id: 4, lab: 'CLN-2026-1102', target: 'Reference Lab Jakarta', tests: 'Genotyping', status: 'RESULTS_RETURNED', dispatched: '2026-04-10 08:00', expected: '2026-04-25', overdue: false },
  { id: 5, lab: 'ENV-2026-0420', target: 'Lab Surabaya', tests: 'Heavy metals panel', status: 'DRAFT', dispatched: null, expected: null, overdue: false },
];

// ─── Component ──────────────────────────────────────────────────────

export default function S14Mockup() {
  const [scene, setScene] = useState(0);

  // Scene 1
  const [agreementRef, setAgreementRef] = useState('SUB-2026-INDO-LAB-09');
  const [handoffDate, setHandoffDate] = useState('2026-04-25');
  const [handoffTime, setHandoffTime] = useState('14:30');
  const [expectedReturn, setExpectedReturn] = useState('2026-05-02');
  const [cocName, setCocName] = useState('Dr. Putri Lestari');
  const [cocPhone, setCocPhone] = useState('+62 812 3456 7890');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('DRAFT');

  // Scene 2
  const [statusFilter, setStatusFilter] = useState([]);
  const filtered = useMemo(() => {
    if (!statusFilter.length) return MOCK_REFERRALS;
    return MOCK_REFERRALS.filter(r => statusFilter.includes(r.status));
  }, [statusFilter]);

  const advanceStatus = () => {
    const next = { DRAFT: 'DISPATCHED', DISPATCHED: 'RECEIVED', RECEIVED: 'RESULTS_RETURNED', RESULTS_RETURNED: 'CLOSED' };
    setStatus(next[status] || status);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
      <Tabs selectedIndex={scene} onChange={({ selectedIndex }) => setScene(selectedIndex)}>
        <TabList aria-label="Scene">
          <Tab>1 — Refer Out (with Subcontract Panel)</Tab>
          <Tab>2 — Referral Dashboard (with new columns)</Tab>
        </TabList>
        <TabPanels>
          {/* ── Scene 1 — Refer Out with subcontract metadata ───────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Refer Out — Subcontract Metadata Panel</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The existing Refer Out screen gains a subcontract metadata panel below the standard referral fields.
              Generic to all order types — env, vector, clinical.
            </p>

            <ExistingRegion>
              <Tile>
                <h5 style={{ marginBottom: 12 }}>Refer Out — Standard Fields</h5>
                <Grid>
                  <Column lg={4}>
                    <TextInput id="src-lab" labelText="Source Lab Number" value="ENV-2026-0420" readOnly />
                  </Column>
                  <Column lg={4}>
                    <Select id="target-lab" labelText="Target Lab" defaultValue="Lab Surabaya">
                      <SelectItem value="Lab Surabaya" text="Lab Surabaya — Microbiology" />
                      <SelectItem value="Lab Bandung" text="Lab Bandung — Heavy Metals" />
                      <SelectItem value="Lab Jakarta" text="Reference Lab Jakarta" />
                    </Select>
                  </Column>
                  <Column lg={4}>
                    <TextInput id="tests" labelText="Tests Referred" value="Heavy metals panel (Pb, Hg, Cd)" readOnly />
                  </Column>
                </Grid>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', marginBottom: 12 }}>
                  <h5 style={{ margin: 0 }}>Subcontract Metadata</h5>
                  <Tag type={STATUS_TAGS[status].type} size="sm">{STATUS_TAGS[status].label}</Tag>
                </Stack>
                <Grid>
                  <Column lg={6}>
                    <TextInput
                      id="agreement-ref"
                      labelText={t('label.agreement', 'Agreement Reference')}
                      value={agreementRef}
                      onChange={(e) => setAgreementRef(e.target.value)}
                      placeholder="e.g., SUB-2026-INDO-LAB-09"
                    />
                  </Column>
                  <Column lg={3}>
                    <DatePicker datePickerType="single" value={handoffDate} onChange={([d]) => setHandoffDate(d?.toISOString().slice(0, 10))}>
                      <DatePickerInput id="handoff-date" labelText="Handoff Date *" placeholder="yyyy-mm-dd" />
                    </DatePicker>
                  </Column>
                  <Column lg={3}>
                    <TimePicker id="handoff-time" labelText="Handoff Time *" value={handoffTime} onChange={(e) => setHandoffTime(e.target.value)} />
                  </Column>
                  <Column lg={4}>
                    <DatePicker datePickerType="single" value={expectedReturn} onChange={([d]) => setExpectedReturn(d?.toISOString().slice(0, 10))}>
                      <DatePickerInput id="exp-return" labelText="Expected Return Date" placeholder="yyyy-mm-dd" />
                    </DatePicker>
                  </Column>
                  <Column lg={4}>
                    <TextInput id="coc-name" labelText="Chain-of-Custody Contact Name" value={cocName} onChange={(e) => setCocName(e.target.value)} />
                  </Column>
                  <Column lg={4}>
                    <TextInput id="coc-phone" labelText="Chain-of-Custody Contact Phone" value={cocPhone} onChange={(e) => setCocPhone(e.target.value)} />
                  </Column>
                  <Column lg={12}>
                    <TextArea id="notes" labelText="Notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </Column>
                </Grid>

                {/* Status workflow buttons */}
                <Stack orientation="horizontal" gap={3} style={{ marginTop: 16, alignItems: 'center' }}>
                  <p style={{ fontSize: 12, color: '#525252', flex: 1 }}>
                    Status transitions: DRAFT → DISPATCHED → RECEIVED → RESULTS_RETURNED → CLOSED.
                    Each transition logged with actor + timestamp.
                  </p>
                  {status !== 'CLOSED' && (
                    <Button
                      kind="primary"
                      size="sm"
                      renderIcon={ArrowRight}
                      onClick={advanceStatus}
                    >
                      Advance to {{ DRAFT: 'Dispatched', DISPATCHED: 'Received', RECEIVED: 'Results Returned', RESULTS_RETURNED: 'Closed' }[status]}
                    </Button>
                  )}
                </Stack>

                {status === 'DISPATCHED' && (
                  <div style={{ marginTop: 12, padding: 12, background: '#edf5ff', borderLeft: '3px solid #0f62fe', fontSize: 13 }}>
                    <Email size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    On dispatch: notification sent to <strong>{cocName}</strong> at the target lab,
                    plus optional WhatsApp/SMS to customer (per site config).
                  </div>
                )}
              </Tile>
            </NewRegion>

            <ExistingRegion>
              <Tile>
                <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
                  <Button kind="ghost">Cancel</Button>
                  <Button kind="primary" renderIcon={Save}>Save Referral</Button>
                </Stack>
              </Tile>
            </ExistingRegion>
          </TabPanel>

          {/* ── Scene 2 — Referral Dashboard with new columns ──────────── */}
          <TabPanel>
            <h3 style={{ margin: '16px 0' }}>Referral Dashboard — New Subcontract Status Column + Filter</h3>
            <p style={{ fontSize: 13, color: '#525252', marginBottom: 16 }}>
              The existing Referral dashboard gains: a Subcontract Status column with colored Tag,
              an Expected Return Date column with overdue flagging, and a multi-select Status filter.
              <strong> No new main-menu page</strong> — this is the same dashboard with new columns.
            </p>

            <ExistingRegion>
              <Tile>
                <Stack orientation="horizontal" gap={3} style={{ marginBottom: 12, alignItems: 'flex-end' }}>
                  <TextInput
                    id="search"
                    labelText="Search Referrals"
                    placeholder="Lab number, target lab…"
                    style={{ minWidth: 300 }}
                  />
                  <Dropdown
                    id="legacy-filter"
                    label="Order Type"
                    titleText="Order Type"
                    items={['All', 'Env', 'Vector', 'Clinical']}
                    initialSelectedItem="All"
                  />
                </Stack>
              </Tile>
            </ExistingRegion>

            <NewRegion>
              <Tile>
                <Stack orientation="horizontal" gap={3} style={{ marginBottom: 12, alignItems: 'flex-end' }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>New filter:</p>
                  <Dropdown
                    id="status-filter"
                    label="Subcontract Status"
                    titleText="Subcontract Status"
                    items={['DRAFT', 'DISPATCHED', 'RECEIVED', 'RESULTS_RETURNED', 'CLOSED']}
                    onChange={({ selectedItem }) => setStatusFilter(selectedItem ? [selectedItem] : [])}
                  />
                </Stack>

                <Table size="md">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Lab Number</TableHeader>
                      <TableHeader>Target Lab</TableHeader>
                      <TableHeader>Tests</TableHeader>
                      <TableHeader>Dispatched</TableHeader>
                      <TableHeader style={{ background: '#fcf4d6' }}>Subcontract Status (new)</TableHeader>
                      <TableHeader style={{ background: '#fcf4d6' }}>Expected Return (new)</TableHeader>
                      <TableHeader></TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map(r => {
                      const tag = STATUS_TAGS[r.status];
                      return (
                        <TableRow key={r.id}>
                          <TableCell><code style={{ fontSize: 12 }}>{r.lab}</code></TableCell>
                          <TableCell>{r.target}</TableCell>
                          <TableCell>{r.tests}</TableCell>
                          <TableCell>
                            {r.dispatched ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.dispatched}</span> : '—'}
                          </TableCell>
                          <TableCell>
                            <Tag type={tag.type} size="sm">{tag.label}</Tag>
                          </TableCell>
                          <TableCell>
                            {r.expected ? (
                              <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.expected}</span>
                                {r.overdue && <Tag type="red" size="sm">Past Due</Tag>}
                              </Stack>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Button kind="ghost" size="sm" renderIcon={View}>Open</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <p style={{ fontSize: 12, color: '#525252', marginTop: 8 }}>
                  ⚠️ Yellow column headers indicate new columns added by S-14. Showing {filtered.length} of {MOCK_REFERRALS.length} referrals.
                </p>
              </Tile>
            </NewRegion>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
