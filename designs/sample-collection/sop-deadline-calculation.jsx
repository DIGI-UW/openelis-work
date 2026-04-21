/**
 * S-03d — SOP Deadline Calculation & Order Due Date
 * Addendum to S-03: Environmental Order Entry Integration (OGC-537)
 *
 * 3 scenes:
 *  1. Step 1 Order Entry — Required By field + SOP auto-calculation notification
 *  2. Test Catalog Admin — SOP Max Holding Time inline row expansion
 *  3. ENV Testing Worklist — Deadline column (green/amber/red) + filter chips
 *
 * Scope annotation convention:
 *   Gold dashed border + "S-03d NEW" badge  = new content added by this addendum
 *   Dimmed (72% opacity) + "EXISTING" badge = existing context shown for placement
 */

import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, Select, SelectItem, NumberInput, Toggle,
  Button, InlineNotification, Tag, Tile,
  DatePicker, DatePickerInput, TimePicker,
  Accordion, AccordionItem,
  Breadcrumb, BreadcrumbItem,
} from '@carbon/react';
import {
  Add, ChevronDown, ChevronUp, WarningAlt, Time, Calculator, Checkmark,
} from '@carbon/icons-react';

// ─── i18n stub ────────────────────────────────────────────────────────────────
const t = (key, fallback, params = {}) => {
  let str = fallback || key;
  Object.entries(params).forEach(([k, v]) => { str = str.replace(`{{${k}}}`, v); });
  return str;
};

// ─── Scope annotation components ──────────────────────────────────────────────
const NewRegion = ({ label = 'S-03d NEW', children, style = {} }) => (
  <div style={{
    border: '2px dashed #F1C21B',
    borderRadius: 6,
    padding: '12px',
    position: 'relative',
    ...style,
  }}>
    <span style={{
      position: 'absolute', top: -11, left: 12,
      background: '#F1C21B', color: '#000', fontSize: 11, fontWeight: 700,
      padding: '1px 8px', borderRadius: 4, letterSpacing: '0.04em',
    }}>{label}</span>
    {children}
  </div>
);

const ExistingRegion = ({ label = 'EXISTING', children, style = {} }) => (
  <div style={{ opacity: 0.72, position: 'relative', ...style }}>
    <span style={{
      position: 'absolute', top: 4, right: 8, zIndex: 1,
      background: '#8D8D8D', color: '#fff', fontSize: 10, fontWeight: 600,
      padding: '1px 6px', borderRadius: 4,
    }}>{label}</span>
    {children}
  </div>
);

// ─── Shared colour tokens ──────────────────────────────────────────────────────
const GOLD = '#F1C21B';

// ─── Scene 1: Step 1 Order Entry ──────────────────────────────────────────────
function Scene1_OrderEntry() {
  const [requiredByDate, setRequiredByDate] = useState('');
  const [requiredByTime, setRequiredByTime] = useState('');
  const [calculationMode, setCalculationMode] = useState('auto'); // 'auto' | 'overridden' | 'pending'
  const [tests, setTests] = useState([
    { id: 1, name: 'Total Coliform Count', holdingHours: 6, selected: true },
    { id: 2, name: 'E. coli (MPN)', holdingHours: 6, selected: true },
    { id: 3, name: 'Nitrate–N', holdingHours: 48, selected: true },
    { id: 4, name: 'pH', holdingHours: null, selected: true },
  ]);
  const [collectionDate] = useState('2026-04-21');
  const [collectionTime] = useState('08:30');

  const minHolding = useMemo(() => {
    const hours = tests
      .filter(t => t.selected && t.holdingHours !== null)
      .map(t => t.holdingHours);
    return hours.length ? Math.min(...hours) : null;
  }, [tests]);

  const calculatedDeadline = useMemo(() => {
    if (!minHolding) return null;
    const base = new Date(`${collectionDate}T${collectionTime}:00`);
    const d = new Date(base.getTime() + minHolding * 3600 * 1000);
    return {
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toTimeString().slice(0, 5),
    };
  }, [minHolding, collectionDate, collectionTime]);

  const testsWithHolding = tests.filter(t => t.selected && t.holdingHours !== null);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", maxWidth: 900 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <BreadcrumbItem href="#">Order</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Enter Order — Step 1</BreadcrumbItem>
      </Breadcrumb>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
        Enter Order — Step 1
      </h2>
      <p style={{ color: '#525252', fontSize: 13, marginBottom: 24 }}>
        Environmental Order · Lab No: <strong>ENV-2026-04217</strong>
      </p>

      <Stack gap={6}>

        {/* ── EXISTING: Patient / Subject info ── */}
        <ExistingRegion>
          <Tile style={{ padding: '12px 16px' }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Subject / Location</p>
            <Grid condensed>
              <Column lg={6} md={4}>
                <TextInput id="site" labelText="Sampling Site" value="Sungai Ciliwung — Station 4" readOnly />
              </Column>
              <Column lg={6} md={4}>
                <TextInput id="requester" labelText="Requester / Collector" value="BPOM Region III" readOnly />
              </Column>
            </Grid>
          </Tile>
        </ExistingRegion>

        {/* ── EXISTING: Priority ── */}
        <ExistingRegion>
          <Tile style={{ padding: '12px 16px' }}>
            <Grid condensed>
              <Column lg={4} md={3}>
                <Select id="priority" labelText="Priority" defaultValue="routine">
                  <SelectItem value="routine" text="Routine" />
                  <SelectItem value="urgent" text="Urgent" />
                  <SelectItem value="stat" text="STAT" />
                </Select>
              </Column>
              <Column lg={4} md={3}>
                <Select id="program" labelText="Environmental Program" defaultValue="drinking">
                  <SelectItem value="drinking" text="Drinking Water — PERMENKES 492/2010" />
                  <SelectItem value="surface" text="Surface Water — PP 22/2021" />
                </Select>
              </Column>
            </Grid>
          </Tile>
        </ExistingRegion>

        {/* ── S-03d NEW: Required By field ── */}
        <NewRegion>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            {t('order.requiredBy', 'Required By')}
          </p>

          <Grid condensed>
            <Column lg={6} md={4}>
              <DatePicker
                datePickerType="single"
                value={calculatedDeadline ? calculatedDeadline.date : requiredByDate}
                onChange={(dates, dateStr) => {
                  setRequiredByDate(dateStr);
                  setCalculationMode('overridden');
                }}
              >
                <DatePickerInput
                  id="required-by-date"
                  labelText={t('order.requiredByDate', 'Required by (date)')}
                  placeholder="DD/MM/YYYY"
                  helperText={!calculationMode || calculationMode === 'pending'
                    ? t('order.requiredByHelper', 'Leave blank if no deadline applies.')
                    : undefined
                  }
                />
              </DatePicker>
            </Column>
            <Column lg={4} md={3}>
              <TimePicker
                id="required-by-time"
                labelText={t('order.requiredByTime', 'Time')}
                value={calculatedDeadline && calculationMode === 'auto' ? calculatedDeadline.time : requiredByTime}
                onChange={e => {
                  setRequiredByTime(e.target.value);
                  setCalculationMode('overridden');
                }}
              />
            </Column>
          </Grid>

          {/* Auto-calculation notification */}
          {calculationMode === 'auto' && calculatedDeadline && (
            <div style={{ marginTop: 12 }}>
              <InlineNotification
                kind="info"
                title=""
                subtitle={t(
                  'order.deadlineCalculated',
                  'Required-by date auto-calculated from collection date ({{collDate}} {{collTime}}) + shortest SOP holding time ({{hours}}h — "{{testName}}"). You may override this value.',
                  {
                    collDate: '21 Apr 2026',
                    collTime: '08:30',
                    hours: minHolding,
                    testName: tests.find(t => t.holdingHours === minHolding && t.selected)?.name || '',
                  }
                )}
                lowContrast
                style={{ marginTop: 0 }}
              >
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <strong>Holding times:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {testsWithHolding.map(test => (
                      <li key={test.id} style={{ color: test.holdingHours === minHolding ? '#DA1E28' : '#525252' }}>
                        {test.name}: <strong>{test.holdingHours}h</strong>
                        {test.holdingHours === minHolding && ' ← most restrictive'}
                      </li>
                    ))}
                    {tests.filter(t => t.selected && t.holdingHours === null).map(test => (
                      <li key={test.id} style={{ color: '#8D8D8D' }}>
                        {test.name}: <em>no SOP holding time configured</em>
                      </li>
                    ))}
                  </ul>
                </div>
              </InlineNotification>
            </div>
          )}

          {calculationMode === 'overridden' && calculatedDeadline && (
            <div style={{ marginTop: 12 }}>
              <InlineNotification
                kind="warning"
                title=""
                subtitle={t(
                  'order.deadlineOverridden',
                  'Required-by date manually set. SOP calculated: {{calculatedDate}} {{calculatedTime}}. The manual value will be saved.',
                  { calculatedDate: calculatedDeadline.date, calculatedTime: calculatedDeadline.time }
                )}
                lowContrast
              />
            </div>
          )}

          {/* Reset link when overridden */}
          {calculationMode === 'overridden' && (
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Calculator}
              style={{ marginTop: 8 }}
              onClick={() => setCalculationMode('auto')}
            >
              {t('order.resetToCalculated', 'Reset to SOP-calculated deadline')}
            </Button>
          )}
        </NewRegion>

        {/* ── EXISTING: Requested Tests ── */}
        <ExistingRegion>
          <Tile style={{ padding: '12px 16px' }}>
            <p style={{ fontWeight: 600, marginBottom: 12 }}>Requested Tests</p>
            <div className="cds--data-table-container">
              <table className="cds--data-table cds--data-table--sm">
                <thead>
                  <tr>
                    <th><span className="cds--table-header-label">Test / Panel</span></th>
                    <th><span className="cds--table-header-label">Sample Type</span></th>
                    <th><span className="cds--table-header-label">SOP Hold</span></th>
                  </tr>
                </thead>
                <tbody>
                  {tests.filter(t => t.selected).map(test => (
                    <tr key={test.id}>
                      <td>{test.name}</td>
                      <td>Water — Surface</td>
                      <td>
                        {test.holdingHours !== null
                          ? <Tag kind={test.holdingHours === minHolding ? 'red' : 'green'} size="sm">{test.holdingHours}h</Tag>
                          : <Tag kind="gray" size="sm">—</Tag>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tile>
        </ExistingRegion>

        {/* Save actions */}
        <Stack orientation="horizontal" gap={3}>
          <Button kind="primary">{t('button.saveAndContinue', 'Save & Continue to Step 2')}</Button>
          <Button kind="ghost">{t('button.saveDraft', 'Save Draft')}</Button>
        </Stack>

      </Stack>
    </div>
  );
}

// ─── Scene 2: Test Catalog Admin — SOP Holding Time ───────────────────────────
function Scene2_TestCatalogAdmin() {
  const [expandedRow, setExpandedRow] = useState(1);
  const [holdingValue, setHoldingValue] = useState(6);
  const [holdingUnit, setHoldingUnit] = useState('hours');
  const [saved, setSaved] = useState(false);

  const tests = [
    { id: 1, name: 'Total Coliform Count', category: 'Microbiology', sampleType: 'Water', sopHours: 6, domain: 'ENV/Vector' },
    { id: 2, name: 'E. coli (MPN)', category: 'Microbiology', sampleType: 'Water', sopHours: 6, domain: 'ENV/Vector' },
    { id: 3, name: 'Nitrate–N', category: 'Chemistry', sampleType: 'Water', sopHours: 48, domain: 'ENV/Vector' },
    { id: 4, name: 'pH (field)', category: 'Chemistry', sampleType: 'Water', sopHours: null, domain: 'ENV/Vector' },
    { id: 5, name: 'Hemoglobin', category: 'Hematology', sampleType: 'Whole Blood', sopHours: null, domain: 'Clinical' },
  ];

  const headers = [
    { key: 'name', header: 'Test Name' },
    { key: 'category', header: 'Category' },
    { key: 'sampleType', header: 'Sample Type' },
    { key: 'domain', header: 'Domain' },
    { key: 'sopHours', header: 'SOP Hold' },
    { key: 'actions', header: '' },
  ];

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", maxWidth: 1000 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <BreadcrumbItem href="#">Administration</BreadcrumbItem>
        <BreadcrumbItem href="#">Test Catalog Management</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>ENV / Vector Tests</BreadcrumbItem>
      </Breadcrumb>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Test Catalog Management</h2>
      <p style={{ color: '#525252', fontSize: 13, marginBottom: 24 }}>
        Configure SOP maximum holding times for ENV and Vector tests. Holding times are used to auto-calculate testing deadlines on order entry.
      </p>

      <NewRegion label="S-03d NEW — SOP Holding Time column" style={{ marginBottom: 24 }}>
        <InlineNotification
          kind="info"
          title="SOP Max Holding Time"
          subtitle="Configure the maximum time from sample collection to result entry for each ENV/Vector test. Only shown for ENV and Vector domain tests. Clinical tests are not affected."
          lowContrast
          style={{ marginBottom: 16 }}
        />

        <TableContainer>
          <Table size="lg">
            <TableHead>
              <TableRow>
                {headers.map(h => (
                  <TableHeader key={h.key}>{h.header}</TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.map(row => (
                <React.Fragment key={row.id}>
                  <TableRow>
                    <TableCell><strong>{row.name}</strong></TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.sampleType}</TableCell>
                    <TableCell>
                      <Tag kind={row.domain === 'Clinical' ? 'gray' : 'blue'} size="sm">
                        {row.domain}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      {row.domain !== 'Clinical'
                        ? (row.sopHours !== null
                          ? <Tag kind="green" size="sm">{row.sopHours}h</Tag>
                          : <Tag kind="warm-gray" size="sm">Not set</Tag>)
                        : <span style={{ color: '#8D8D8D', fontSize: 12 }}>N/A</span>
                      }
                    </TableCell>
                    <TableCell>
                      {row.domain !== 'Clinical' && (
                        <Button
                          kind="ghost"
                          size="sm"
                          renderIcon={expandedRow === row.id ? ChevronUp : ChevronDown}
                          onClick={() => {
                            setExpandedRow(prev => prev === row.id ? null : row.id);
                            setSaved(false);
                          }}
                        >
                          {expandedRow === row.id ? 'Close' : 'Edit'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Inline expansion for SOP holding time */}
                  {expandedRow === row.id && (
                    <TableRow>
                      <TableCell colSpan={6} style={{ padding: 0 }}>
                        <Tile style={{ margin: '0 1rem 1rem', padding: '1rem 1.25rem', borderLeft: `4px solid ${GOLD}` }}>
                          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                            {t('admin.test.sopHoldingTime', 'SOP Max Holding Time')} — {row.name}
                          </p>
                          <p style={{ fontSize: 12, color: '#525252', marginBottom: 16 }}>
                            {t('admin.test.sopHoldingTimeHelper', 'Maximum time from collection to result. Used to calculate testing deadlines for ENV/Vector orders.')}
                          </p>

                          <Grid condensed>
                            <Column lg={4} md={3}>
                              <NumberInput
                                id={`holding-value-${row.id}`}
                                label={t('admin.test.holdingValue', 'Maximum holding time')}
                                value={holdingValue}
                                min={1}
                                max={10000}
                                step={1}
                                onChange={(e, { value }) => setHoldingValue(value)}
                              />
                            </Column>
                            <Column lg={3} md={2} style={{ paddingTop: 24 }}>
                              <Select
                                id={`holding-unit-${row.id}`}
                                labelText={t('admin.test.holdingUnit', 'Unit')}
                                value={holdingUnit}
                                onChange={e => setHoldingUnit(e.target.value)}
                              >
                                <SelectItem value="hours" text="Hours" />
                                <SelectItem value="days" text="Days (stored as hours)" />
                              </Select>
                            </Column>
                            <Column lg={5} md={3} style={{ paddingTop: 42, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {holdingUnit === 'days' && holdingValue && (
                                <Tag kind="blue" size="sm">= {holdingValue * 24}h stored</Tag>
                              )}
                            </Column>
                          </Grid>

                          {saved && (
                            <InlineNotification
                              kind="success"
                              title=""
                              subtitle={`SOP holding time saved: ${holdingValue} ${holdingUnit} (${holdingUnit === 'days' ? holdingValue * 24 : holdingValue}h). This will be used in deadline calculations on new orders.`}
                              lowContrast
                              style={{ marginTop: 12 }}
                            />
                          )}

                          <Stack orientation="horizontal" gap={3} style={{ marginTop: 16 }}>
                            <Button
                              kind="primary"
                              size="sm"
                              renderIcon={Checkmark}
                              onClick={() => setSaved(true)}
                            >
                              {t('button.save', 'Save Holding Time')}
                            </Button>
                            <Button
                              kind="ghost"
                              size="sm"
                              onClick={() => { setExpandedRow(null); setSaved(false); }}
                            >
                              {t('button.cancel', 'Cancel')}
                            </Button>
                            {row.sopHours !== null && (
                              <Button kind="danger--ghost" size="sm">
                                {t('button.clear', 'Clear (no SOP deadline)')}
                              </Button>
                            )}
                          </Stack>
                        </Tile>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </NewRegion>
    </div>
  );
}

// ─── Scene 3: ENV Testing Worklist — Deadline column ─────────────────────────
function Scene3_Worklist() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'approaching' | 'overdue'

  const now = new Date('2026-04-21T10:00:00');

  const orders = [
    { id: 'ENV-2026-04001', site: 'Sungai Ciliwung — Sta. 4', standard: 'PERMENKES 492/2010', status: 'In Progress', requiredBy: new Date('2026-04-21T11:30:00'), tests: 3 },
    { id: 'ENV-2026-04002', site: 'Danau Toba — North Shore', standard: 'PP 22/2021', status: 'In Progress', requiredBy: new Date('2026-04-21T14:00:00'), tests: 5 },
    { id: 'ENV-2026-04003', site: 'Air Bersih — Kec. Gambir', standard: 'PERMENKES 492/2010', status: 'Pending', requiredBy: new Date('2026-04-21T08:00:00'), tests: 4 },
    { id: 'ENV-2026-04004', site: 'Sungai Musi — Sta. 12', standard: 'PP 22/2021', status: 'In Progress', requiredBy: new Date('2026-04-22T09:00:00'), tests: 6 },
    { id: 'ENV-2026-04005', site: 'Kolam Waduk Jatiluhur', standard: 'PERMENKES 492/2010', status: 'Pending', requiredBy: null, tests: 2 },
    { id: 'ENV-2026-04006', site: 'Sungai Brantas — Sta. 3', standard: 'PP 22/2021', status: 'In Progress', requiredBy: new Date('2026-04-21T13:30:00'), tests: 3 },
  ];

  const APPROACHING_THRESHOLD_H = 4;

  function getDeadlineStatus(requiredBy) {
    if (!requiredBy) return 'none';
    const diffMs = requiredBy - now;
    const diffH = diffMs / (1000 * 3600);
    if (diffH < 0) return 'exceeded';
    if (diffH <= APPROACHING_THRESHOLD_H) return 'approaching';
    return 'ok';
  }

  function formatRelative(requiredBy) {
    if (!requiredBy) return '—';
    const diffMs = requiredBy - now;
    const abs = Math.abs(diffMs);
    const h = Math.floor(abs / (1000 * 3600));
    const m = Math.floor((abs % (1000 * 3600)) / 60000);
    const label = `${h}h ${m}m`;
    return diffMs < 0 ? `${label} ago` : `in ${label}`;
  }

  const deadlineTagProps = {
    none: { kind: 'gray', label: '—' },
    ok: { kind: 'green', label: '' },
    approaching: { kind: 'warm-gray', label: '' },
    exceeded: { kind: 'red', label: '' },
  };

  const filtered = orders
    .filter(o => {
      if (searchQuery && !o.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !o.site.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeFilter === 'approaching') return getDeadlineStatus(o.requiredBy) === 'approaching';
      if (activeFilter === 'overdue') return getDeadlineStatus(o.requiredBy) === 'exceeded';
      return true;
    })
    .sort((a, b) => {
      if (!a.requiredBy && !b.requiredBy) return 0;
      if (!a.requiredBy) return 1;
      if (!b.requiredBy) return -1;
      return a.requiredBy - b.requiredBy;
    });

  const overdueCount = orders.filter(o => getDeadlineStatus(o.requiredBy) === 'exceeded').length;
  const approachingCount = orders.filter(o => getDeadlineStatus(o.requiredBy) === 'approaching').length;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", maxWidth: 1100 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <BreadcrumbItem href="#">Results</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>ENV Testing Worklist</BreadcrumbItem>
      </Breadcrumb>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>ENV Testing Worklist</h2>
          <p style={{ color: '#525252', fontSize: 13 }}>
            {filtered.length} orders · Sorted by deadline (nearest first)
          </p>
        </div>
        <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
          {overdueCount > 0 && (
            <Tag kind="red" renderIcon={WarningAlt}>{overdueCount} Overdue</Tag>
          )}
          {approachingCount > 0 && (
            <Tag kind="warm-gray">{approachingCount} Approaching deadline</Tag>
          )}
        </Stack>
      </div>

      <NewRegion label="S-03d NEW — Deadline column + filter chips" style={{ marginBottom: 0 }}>

        {/* Filter chips */}
        <Stack orientation="horizontal" gap={3} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#525252', alignSelf: 'center' }}>Filter:</span>
          {['all', 'approaching', 'overdue'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '4px 14px',
                borderRadius: 16,
                border: activeFilter === f ? '2px solid #0F62FE' : '1px solid #8D8D8D',
                background: activeFilter === f ? '#0F62FE' : 'transparent',
                color: activeFilter === f ? '#fff' : '#161616',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {f === 'all' ? 'All orders' : f === 'approaching' ? `Approaching deadline (${approachingCount})` : `Overdue (${overdueCount})`}
            </button>
          ))}

          <div style={{ marginLeft: 'auto' }}>
            <input
              placeholder="Search lab no or site..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px', border: '1px solid #8D8D8D', borderRadius: 4,
                fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", width: 220,
              }}
            />
          </div>
        </Stack>

        <TableContainer>
          <Table size="lg">
            <TableHead>
              <TableRow>
                <TableHeader>Lab Number</TableHeader>
                <TableHeader>Sampling Site</TableHeader>
                <TableHeader>Standard</TableHeader>
                <TableHeader>Tests</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader style={{ color: GOLD, fontWeight: 700 }}>
                  ↑ Deadline {/* ← sorted column indicator */}
                </TableHeader>
                <TableHeader></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(order => {
                const status = getDeadlineStatus(order.requiredBy);
                const rowBg = status === 'exceeded'
                  ? 'rgba(218, 30, 40, 0.05)'
                  : status === 'approaching'
                    ? 'rgba(241, 194, 27, 0.06)'
                    : 'transparent';
                return (
                  <TableRow key={order.id} style={{ background: rowBg }}>
                    <TableCell>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.id}</span>
                    </TableCell>
                    <TableCell>{order.site}</TableCell>
                    <TableCell style={{ fontSize: 12, color: '#525252' }}>{order.standard}</TableCell>
                    <TableCell>{order.tests} tests</TableCell>
                    <TableCell>
                      <Tag kind={order.status === 'In Progress' ? 'blue' : 'purple'} size="sm">
                        {order.status}
                      </Tag>
                    </TableCell>

                    {/* ── Deadline cell ── */}
                    <TableCell>
                      {status === 'none' ? (
                        <span style={{ color: '#8D8D8D', fontSize: 13 }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {status === 'exceeded' && <WarningAlt size={16} style={{ color: '#DA1E28', flexShrink: 0 }} />}
                          <Tag kind={deadlineTagProps[status].kind} size="sm">
                            {formatRelative(order.requiredBy)}
                          </Tag>
                          <span style={{ fontSize: 11, color: '#525252' }}>
                            {order.requiredBy?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Button kind="ghost" size="sm">
                        Enter Results
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Legend */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#F4F4F4', borderRadius: 4 }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Deadline status legend</p>
          <Stack orientation="horizontal" gap={4} style={{ flexWrap: 'wrap' }}>
            <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center' }}>
              <Tag kind="green" size="sm">in Xh Ym</Tag>
              <span style={{ fontSize: 12, color: '#525252' }}>&gt; 4h remaining</span>
            </Stack>
            <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center' }}>
              <Tag kind="warm-gray" size="sm">in Xh Ym</Tag>
              <span style={{ fontSize: 12, color: '#525252' }}>≤ 4h remaining (approaching)</span>
            </Stack>
            <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center' }}>
              <WarningAlt size={14} style={{ color: '#DA1E28' }} />
              <Tag kind="red" size="sm">Xh Ym ago</Tag>
              <span style={{ fontSize: 12, color: '#525252' }}>Deadline exceeded</span>
            </Stack>
            <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#8D8D8D' }}>—</span>
              <span style={{ fontSize: 12, color: '#525252' }}>No deadline set</span>
            </Stack>
          </Stack>
          <p style={{ fontSize: 11, color: '#525252', marginTop: 8 }}>
            Approaching threshold: 4h (configurable in Administration → Site Information → Order Settings)
          </p>
        </div>
      </NewRegion>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
const SCENES = [
  { id: 1, label: 'Step 1 — Required By + SOP Auto-Calc', component: Scene1_OrderEntry },
  { id: 2, label: 'Admin — SOP Holding Time per Test', component: Scene2_TestCatalogAdmin },
  { id: 3, label: 'ENV Worklist — Deadline Column', component: Scene3_Worklist },
];

export default function S03dMockup() {
  const [activeScene, setActiveScene] = useState(1);
  const Scene = SCENES.find(s => s.id === activeScene)?.component;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Scene selector */}
      <div style={{
        background: '#161616', color: '#fff',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginRight: 8 }}>
          S-03d — SOP Deadline Calculation
        </span>
        {SCENES.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveScene(s.id)}
            style={{
              padding: '6px 16px',
              background: activeScene === s.id ? GOLD : 'transparent',
              color: activeScene === s.id ? '#000' : '#fff',
              border: `1px solid ${activeScene === s.id ? GOLD : '#525252'}`,
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: activeScene === s.id ? 700 : 400,
            }}
          >
            Scene {s.id}: {s.label}
          </button>
        ))}
      </div>

      {/* Scope legend */}
      <div style={{
        background: '#F4F4F4', borderBottom: '1px solid #E0E0E0',
        padding: '6px 24px', display: 'flex', gap: 24, alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, border: `2px dashed ${GOLD}`, borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: '#525252' }}>S-03d NEW</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, background: '#E0E0E0', borderRadius: 2, opacity: 0.72 }} />
          <span style={{ fontSize: 12, color: '#525252' }}>EXISTING (context)</span>
        </div>
      </div>

      {/* Scene content */}
      <div style={{ padding: '24px 32px', minHeight: 600 }}>
        {Scene && <Scene />}
      </div>
    </div>
  );
}
