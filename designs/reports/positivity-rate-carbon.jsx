/**
 * Positivity Rate Report & Dashboard Widget — OpenELIS Global
 * FRS: positivity-rate-frs.md | v1.0 | 2026-03-19
 *
 * This file contains three components:
 *   1. PositivityRateReport    — Full-page report with typeahead test search,
 *                               inline per-test positivity definition, DataTable + CSV export
 *   2. PositivityRateTile      — Reusable dashboard widget tile (single test, preset date ranges)
 *   3. App (default export)    — Demo shell showing both surfaces via tabs
 *
 * NOTE: There is no admin configuration page. Positivity definitions (match mode +
 * positive result codes) are configured inline within the report filter panel at
 * report generation time, per FR-4.1.
 */

import React, { useState, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Preset date range helpers
// ---------------------------------------------------------------------------
const fmt = (d) => d.toISOString().split('T')[0];

const PRESETS = [
  { key: 'LAST_7_DAYS',     label: 'Last 7 Days' },
  { key: 'MONTH_TO_DATE',   label: 'Month to Date' },
  { key: 'LAST_MONTH',      label: 'Last Month' },
  { key: 'QUARTER_TO_DATE', label: 'Quarter to Date' },
];

function resolvePreset(key) {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth();
  switch (key) {
    case 'LAST_7_DAYS': {
      const s = new Date(today); s.setDate(today.getDate() - 6);
      return { start: fmt(s), end: fmt(today) };
    }
    case 'MONTH_TO_DATE':
      return { start: fmt(new Date(y, m, 1)), end: fmt(today) };
    case 'LAST_MONTH':
      return { start: fmt(new Date(y, m - 1, 1)), end: fmt(new Date(y, m, 0)) };
    case 'QUARTER_TO_DATE': {
      const qStart = new Date(y, Math.floor(m / 3) * 3, 1);
      return { start: fmt(qStart), end: fmt(today) };
    }
    default: return { start: fmt(today), end: fmt(today) };
  }
}

function fmtDisplay(iso) {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-');
  return new Date(+y, +mo - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
import {
  Grid,
  Column,
  Stack,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TextInput,
  Checkbox,
  RadioButton,
  RadioButtonGroup,
  Button,
  InlineNotification,
  InlineLoading,
  Tag,
  Tile,
  Breadcrumb,
  BreadcrumbItem,
  DatePicker,
  DatePickerInput,
  Tooltip,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
} from '@carbon/react';
import {
  Download,
  Renew,
  ChevronDown,
  ChevronUp,
  Close,
} from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// i18n helper — replace with real i18n implementation
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_TESTS = [
  { id: 1, name: 'HIV Rapid Test' },
  { id: 2, name: 'Malaria RDT' },
  { id: 3, name: 'Syphilis RPR' },
  { id: 4, name: 'HBsAg' },
  { id: 5, name: 'COVID-19 Antigen' },
];

const MOCK_RESULT_CODES = {
  1: ['Positive', 'Negative', 'Invalid', 'Indeterminate'],
  2: ['Positive', 'Negative', 'Invalid'],
  3: ['Reactive', 'Non-Reactive', 'Weakly Reactive'],
  4: ['Positive', 'Negative'],
  5: ['Detected', 'Not Detected', 'Invalid'],
};

// No MOCK_CONFIGS — positivity definitions are configured inline at report time.

const MOCK_REPORT_DATA = [
  {
    testId: 1,
    testName: 'HIV Rapid Test',
    totalTested: 1240,
    totalPositive: 87,
    positivityRate: 7.02,
    normalResultCode: 'Negative',
    nonNormalRate: 8.47,
    resultBreakdown: [
      { resultCode: 'Positive',      count: 87,   rate: 7.02,  isPositive: true,  isNormal: false },
      { resultCode: 'Negative',      count: 1140, rate: 91.94, isPositive: false, isNormal: true  },
      { resultCode: 'Invalid',       count: 10,   rate: 0.81,  isPositive: false, isNormal: false },
      { resultCode: 'Indeterminate', count: 3,    rate: 0.24,  isPositive: false, isNormal: false },
    ],
  },
  {
    testId: 2,
    testName: 'Malaria RDT',
    totalTested: 843,
    totalPositive: 312,
    positivityRate: 37.01,
    normalResultCode: 'Negative',
    nonNormalRate: 38.55,
    resultBreakdown: [
      { resultCode: 'Positive', count: 312, rate: 37.01, isPositive: true,  isNormal: false },
      { resultCode: 'Negative', count: 518, rate: 61.45, isPositive: false, isNormal: true  },
      { resultCode: 'Invalid',  count: 13,  rate: 1.54,  isPositive: false, isNormal: false },
    ],
  },
  {
    testId: 3,
    testName: 'Syphilis RPR',
    totalTested: 567,
    totalPositive: 34,
    positivityRate: 5.99,
    normalResultCode: 'Non-Reactive',
    nonNormalRate: 8.64,
    resultBreakdown: [
      { resultCode: 'Reactive',       count: 34,  rate: 5.99,  isPositive: true,  isNormal: false },
      { resultCode: 'Weakly Reactive',count: 15,  rate: 2.65,  isPositive: true,  isNormal: false },
      { resultCode: 'Non-Reactive',   count: 518, rate: 91.36, isPositive: false, isNormal: true  },
    ],
  },
];

// ---------------------------------------------------------------------------
// 1. Positivity definitions are configured inline in the report filter — no admin page required.
// ---------------------------------------------------------------------------
// Positivity definitions are configured inline in the report filter — no admin page required.

// ---------------------------------------------------------------------------
// 1. TestPositivityConfig — inline per-test positivity definition form
// ---------------------------------------------------------------------------
function TestPositivityConfig({ test, config, onChange }) {
  const codes = MOCK_RESULT_CODES[test.id] || [];
  return (
    <Tile style={{ background: '#f4f4f4' }}>
      <Stack gap={3}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{test.testName || test.name}</p>
        <RadioButtonGroup
          legendText={t('label.positivityConfig.matchMode', 'Match Mode')}
          name={`mode-${test.id}`}
          valueSelected={config.matchMode}
          onChange={(val) => onChange({ ...config, matchMode: val, positiveResultCodes: [] })}
          orientation="horizontal"
        >
          <RadioButton labelText={t('label.positivityConfig.matchMode.specificCodes', 'Specific Result Codes')} value="SPECIFIC_CODES" id={`specific-${test.id}`} />
          <RadioButton labelText={t('label.positivityConfig.matchMode.allAbnormal', 'All Non-Normal Results')} value="ALL_ABNORMAL" id={`abnormal-${test.id}`} />
        </RadioButtonGroup>
        {config.matchMode === 'SPECIFIC_CODES' && codes.length > 0 && (
          <Stack gap={2}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#525252' }}>
              {t('label.positivityConfig.positiveResultCodes', 'Positive Result Code(s)')}
            </p>
            <Stack orientation="horizontal" gap={4}>
              {codes.map((code) => (
                <Checkbox
                  key={code}
                  id={`code-${test.id}-${code}`}
                  labelText={code}
                  checked={config.positiveResultCodes.includes(code)}
                  onChange={(_, { checked }) => {
                    const next = checked
                      ? [...config.positiveResultCodes, code]
                      : config.positiveResultCodes.filter((c) => c !== code);
                    onChange({ ...config, positiveResultCodes: next });
                  }}
                />
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// 2. PositivityRateReport
// ---------------------------------------------------------------------------
function PositivityRateReport() {
  const [searchText, setSearchText] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [testConfigs, setTestConfigs] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [filtersRestored] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [expandedReportRow, setExpandedReportRow] = useState(null);

  const filteredTestOptions = MOCK_TESTS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchText.toLowerCase()) &&
      !selectedTests.find((s) => s.id === t.id)
  );

  const addTest = (test) => {
    setSelectedTests((prev) => [...prev, test]);
    setTestConfigs((prev) => ({
      ...prev,
      [test.id]: { matchMode: 'SPECIFIC_CODES', positiveResultCodes: [] },
    }));
    setSearchText('');
  };

  const removeTest = (id) => {
    setSelectedTests((prev) => prev.filter((t) => t.id !== id));
    setTestConfigs((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const validate = () => {
    const errors = {};
    if (!startDate) errors.startDate = t('error.positivityReport.startDateRequired', 'Start date is required.');
    if (!endDate) errors.endDate = t('error.positivityReport.endDateRequired', 'End date is required.');
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errors.endDate = t('error.positivityReport.endBeforeStart', 'End date must be after start date.');
    }
    if (!selectedTests.length) errors.tests = t('error.positivityReport.testsRequired', 'At least one test must be selected.');
    const missingCodes = selectedTests.filter(
      (t) => testConfigs[t.id]?.matchMode === 'SPECIFIC_CODES' && !testConfigs[t.id]?.positiveResultCodes?.length
    );
    if (missingCodes.length) {
      errors.codes = `${t('error.positivityConfig.codesRequired', 'Select at least one positive code for')}: ${missingCodes.map((t) => t.name).join(', ')}`;
    }
    return errors;
  };

  const handleGenerate = () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setLoading(true);
    setReportData(null);
    setTimeout(() => {
      setReportData(MOCK_REPORT_DATA.filter((r) => selectedTests.find((t) => t.id === r.testId)));
      setLoading(false);
    }, 1200);
  };

  const handleReset = () => {
    setSearchText(''); setSelectedTests([]); setTestConfigs({});
    setStartDate(''); setEndDate('');
    setReportData(null); setFormErrors({}); setNotification(null); setExpandedReportRow(null);
  };

  const handleExportCsv = () => {
    if (!reportData) return;
    setNotification({ kind: 'success', message: t('message.positivityReport.exportSuccess', 'CSV export downloaded.') });
    setTimeout(() => setNotification(null), 3000);
  };

  const tableHeaders = [
    { key: 'expand', header: '' },
    { key: 'testName', header: t('label.positivityReport.testName', 'Test Name') },
    { key: 'totalTested', header: t('label.positivityReport.totalTested', 'Total Tested') },
    { key: 'totalPositive', header: t('label.positivityReport.totalPositive', 'Total Positive') },
    { key: 'positivityRate', header: t('label.positivityReport.positivityRate', 'Positivity Rate (%)') },
    { key: 'nonNormalRate', header: t('label.positivityReport.nonNormalRate', 'Non-Normal Rate (%)') },
  ];

  const tableRows = (reportData || []).map((r) => ({
    id: String(r.testId),
    expand: '',
    testName: r.testName,
    totalTested: r.totalTested.toLocaleString(),
    totalPositive: r.totalPositive.toLocaleString(),
    positivityRate: r.positivityRate !== null ? `${r.positivityRate.toFixed(2)}%` : t('label.positivityReport.naRate', 'N/A'),
    nonNormalRate: r.nonNormalRate !== null && r.nonNormalRate !== undefined ? `${r.nonNormalRate.toFixed(2)}%` : t('label.positivityReport.naRate', 'N/A'),
  }));

  return (
    <div style={{ padding: '2rem' }}>
      <Breadcrumb style={{ marginBottom: '1rem' }}>
        <BreadcrumbItem href="#">{t('nav.reports', 'Reports')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('heading.positivityReport.pageTitle', 'Positivity Rate Report')}</BreadcrumbItem>
      </Breadcrumb>

      <Stack gap={6}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
          {t('heading.positivityReport.pageTitle', 'Positivity Rate Report')}
        </h2>

        {filtersRestored && (
          <InlineNotification kind="info" title="" subtitle={t('message.positivityReport.filtersRestored', 'Your last filter selection has been restored.')} onCloseButtonClick={() => {}} />
        )}

        {/* Filter panel */}
        <Tile>
          <Stack gap={5}>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>{t('heading.positivityReport.filters', 'Report Filters')}</p>

            {/* Date range */}
            <Grid>
              <Column lg={4} md={4} sm={4}>
                <DatePicker datePickerType="single" onChange={([date]) => setStartDate(date ? date.toISOString().split('T')[0] : '')}>
                  <DatePickerInput id="report-start-date" labelText={t('label.positivityReport.startDate', 'Start Date')} placeholder="YYYY-MM-DD"
                    invalid={!!formErrors.startDate} invalidText={formErrors.startDate} />
                </DatePicker>
              </Column>
              <Column lg={4} md={4} sm={4}>
                <DatePicker datePickerType="single" onChange={([date]) => setEndDate(date ? date.toISOString().split('T')[0] : '')}>
                  <DatePickerInput id="report-end-date" labelText={t('label.positivityReport.endDate', 'End Date')} placeholder="YYYY-MM-DD"
                    invalid={!!formErrors.endDate} invalidText={formErrors.endDate} />
                </DatePicker>
              </Column>
            </Grid>

            {/* Test typeahead search */}
            <Stack gap={2}>
              <TextInput
                id="test-search"
                labelText={t('label.positivityReport.tests', 'Tests')}
                placeholder={t('placeholder.positivityReport.selectTests', 'Search and add tests…')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                invalid={!!formErrors.tests}
                invalidText={formErrors.tests}
              />
              {searchText && filteredTestOptions.length > 0 && (
                <Tile style={{ padding: '0.5rem', maxHeight: '12rem', overflowY: 'auto' }}>
                  {filteredTestOptions.map((test) => (
                    <Button key={test.id} kind="ghost" size="sm" style={{ width: '100%', justifyContent: 'flex-start' }}
                      onClick={() => addTest(test)}>
                      {test.name}
                    </Button>
                  ))}
                </Tile>
              )}
            </Stack>

            {/* Per-test positivity definition */}
            {selectedTests.length > 0 && (
              <Stack gap={3}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {t('label.positivityConfig.positiveResultCodes', 'Positivity Definition per Test')}
                </p>
                {formErrors.codes && (
                  <InlineNotification kind="error" title="" subtitle={formErrors.codes} onCloseButtonClick={() => setFormErrors((e) => ({ ...e, codes: undefined }))} />
                )}
                <Grid>
                  {selectedTests.map((test) => (
                    <Column key={test.id} lg={8} md={4} sm={4}>
                      <div style={{ position: 'relative' }}>
                        <Button kind="ghost" size="sm" hasIconOnly renderIcon={Close} iconDescription={t('button.positivityConfig.cancel', 'Remove')}
                          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 1 }}
                          onClick={() => removeTest(test.id)} />
                        <TestPositivityConfig
                          test={test}
                          config={testConfigs[test.id] || { matchMode: 'SPECIFIC_CODES', positiveResultCodes: [] }}
                          onChange={(cfg) => setTestConfigs((prev) => ({ ...prev, [test.id]: cfg }))}
                        />
                      </div>
                    </Column>
                  ))}
                </Grid>
              </Stack>
            )}

            <Stack orientation="horizontal" gap={3}>
              <Button kind="primary" renderIcon={Renew} onClick={handleGenerate} disabled={loading}>
                {loading ? t('message.positivityReport.generating', 'Generating report...') : t('button.positivityReport.generate', 'Generate Report')}
              </Button>
              <Button kind="ghost" onClick={handleReset} disabled={loading}>
                {t('button.positivityReport.reset', 'Reset')}
              </Button>
            </Stack>
          </Stack>
        </Tile>

        {notification && (
          <InlineNotification kind={notification.kind} title="" subtitle={notification.message} onCloseButtonClick={() => setNotification(null)} />
        )}

        {loading && <InlineLoading description={t('message.positivityReport.generating', 'Generating report...')} />}

        {!loading && reportData !== null && (
          <DataTable rows={tableRows} headers={tableHeaders}>
            {({ rows: tableRowsRendered, headers: tableHeadersRendered, getTableProps, getHeaderProps, getRowProps }) => (
              <TableContainer title={t('heading.positivityReport.results', 'Report Results')}>
                <TableToolbar>
                  <TableToolbarContent>
                    <Button kind="ghost" renderIcon={Download} onClick={handleExportCsv} disabled={!reportData || reportData.length === 0}>
                      {t('button.positivityReport.exportCsv', 'Export CSV')}
                    </Button>
                  </TableToolbarContent>
                </TableToolbar>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {tableHeadersRendered.map((header) => (
                        <TableHeader {...getHeaderProps({ header })} key={header.key}>{header.header}</TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRowsRendered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={tableHeadersRendered.length}>
                          <p style={{ padding: '1rem', color: '#525252' }}>
                            {t('message.positivityReport.noResults', 'No completed results found for the selected tests and date range.')}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableRowsRendered.map((row) => {
                        const rawRow = reportData?.find((r) => String(r.testId) === row.id);
                        const isExpanded = expandedReportRow === row.id;
                        return (
                          <React.Fragment key={row.id}>
                            <TableRow {...getRowProps({ row })}>
                              {row.cells.map((cell) => {
                                if (cell.info.header === 'expand') {
                                  return (
                                    <TableCell key={cell.id} style={{ width: '2rem' }}>
                                      <Button kind="ghost" size="sm" hasIconOnly
                                        renderIcon={isExpanded ? ChevronUp : ChevronDown}
                                        iconDescription={t('label.positivityReport.resultBreakdown', 'Result Breakdown')}
                                        onClick={() => setExpandedReportRow(isExpanded ? null : row.id)} />
                                    </TableCell>
                                  );
                                }
                                return <TableCell key={cell.id}>{cell.value}</TableCell>;
                              })}
                            </TableRow>

                            {isExpanded && rawRow && (
                              <TableRow>
                                <TableCell colSpan={tableHeadersRendered.length}>
                                  <Tile>
                                    <Stack gap={4}>
                                      <p style={{ fontWeight: 600 }}>
                                        {t('label.positivityReport.resultBreakdown', 'Result Breakdown')} — {rawRow.testName}
                                      </p>
                                      <StructuredListWrapper>
                                        <StructuredListHead>
                                          <StructuredListRow head>
                                            <StructuredListCell head>{t('label.positivityReport.resultCode', 'Result Code')}</StructuredListCell>
                                            <StructuredListCell head>{t('label.positivityReport.count', 'Count')}</StructuredListCell>
                                            <StructuredListCell head>{t('label.positivityReport.rate', 'Rate (%)')}</StructuredListCell>
                                            <StructuredListCell head>{t('label.positivityConfig.status', 'Type')}</StructuredListCell>
                                          </StructuredListRow>
                                        </StructuredListHead>
                                        <StructuredListBody>
                                          {rawRow.resultBreakdown.map((bd) => (
                                            <StructuredListRow key={bd.resultCode}>
                                              <StructuredListCell>{bd.resultCode}</StructuredListCell>
                                              <StructuredListCell>{bd.count.toLocaleString()}</StructuredListCell>
                                              <StructuredListCell>{bd.rate.toFixed(2)}%</StructuredListCell>
                                              <StructuredListCell>
                                                <Tag kind={bd.isNormal ? 'blue' : bd.isPositive ? 'green' : 'warm-gray'} size="sm">
                                                  {bd.isNormal ? t('label.positivityReport.normalResult', 'Normal')
                                                    : bd.isPositive ? t('label.positivityReport.positiveResult', 'Positive')
                                                    : t('label.positivityReport.otherResult', 'Other')}
                                                </Tag>
                                              </StructuredListCell>
                                            </StructuredListRow>
                                          ))}
                                          <StructuredListRow>
                                            <StructuredListCell><strong>{t('label.positivityReport.nonNormalSummary', 'Non-Normal Total')}</strong></StructuredListCell>
                                            <StructuredListCell><strong>{rawRow.resultBreakdown.filter((b) => !b.isNormal).reduce((s, b) => s + b.count, 0).toLocaleString()}</strong></StructuredListCell>
                                            <StructuredListCell>
                                              <strong>
                                                {rawRow.nonNormalRate !== null && rawRow.nonNormalRate !== undefined ? `${rawRow.nonNormalRate.toFixed(2)}%` : (
                                                  <Tooltip label={t('message.positivityReport.noNormalConfigured', 'Normal result code not configured for this test.')} align="top">
                                                    <span>{t('label.positivityReport.naRate', 'N/A')}</span>
                                                  </Tooltip>
                                                )}
                                              </strong>
                                            </StructuredListCell>
                                            <StructuredListCell><Tag kind="purple" size="sm">{t('label.positivityReport.nonNormalRate', 'Non-Normal Rate')}</Tag></StructuredListCell>
                                          </StructuredListRow>
                                        </StructuredListBody>
                                      </StructuredListWrapper>
                                    </Stack>
                                  </Tile>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        )}
      </Stack>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. PositivityRateTile — Reusable Dashboard Widget
// ---------------------------------------------------------------------------
const SESSION_KEY = (id) => `positivity_widget_preset_${id}`;

function PositivityRateTile({ config }) {
  const { testId, testName, defaultPreset = 'MONTH_TO_DATE' } = config;
  const savedPreset = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY(testId))) || defaultPreset;

  const [preset, setPreset] = useState(savedPreset);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { start, end } = resolvePreset(preset);

  const fetchData = useCallback(() => {
    setLoading(true); setData(null); setError(false);
    setTimeout(() => {
      setData(MOCK_REPORT_DATA.find((r) => r.testId === testId) || { totalTested: 0, totalPositive: 0, positivityRate: null });
      setLoading(false);
    }, 700);
  }, [testId, preset]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePreset = (p) => {
    setPreset(p);
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(SESSION_KEY(testId), p);
  };

  const rateTagKind = data && data.positivityRate !== null
    ? data.positivityRate >= 25 ? 'red' : data.positivityRate >= 10 ? 'warm-gray' : 'green'
    : 'gray';

  return (
    <Tile style={{ width: '320px', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <Stack gap={0}>
        <div style={{ padding: '1rem 1rem 0.5rem' }}>
          <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {t('heading.positivityWidget.title', 'Positivity Rate')}
              </p>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>{testName}</p>
            </div>
            {data && data.positivityRate !== null && (
              <Tag kind={rateTagKind}>
                {data.positivityRate >= 25 ? 'High' : data.positivityRate >= 10 ? 'Moderate' : 'Low'}
              </Tag>
            )}
          </Stack>
        </div>

        {/* Preset selector */}
        <div style={{ padding: '0 1rem 0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
            {PRESETS.map((p, i) => (
              <button key={p.key} onClick={() => handlePreset(p.key)}
                style={{
                  padding: '0.375rem 0.25rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                  borderLeft: i > 0 ? '1px solid #e0e0e0' : 'none',
                  background: preset === p.key ? '#0f62fe' : '#ffffff',
                  color: preset === p.key ? '#ffffff' : '#525252',
                  transition: 'background 0.15s',
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: '#8d8d8d', textAlign: 'center', marginTop: '0.375rem' }}>
            {fmtDisplay(start)} – {fmtDisplay(end)}
          </p>
        </div>

        {/* Metrics */}
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #e0e0e0', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
          {loading && <InlineLoading description={t('message.positivityWidget.loading', 'Loading...')} />}
          {error && <InlineNotification kind="error" title="" subtitle={t('error.positivityWidget.fetchFailed', 'Failed to load data.')} onCloseButtonClick={() => setError(false)} />}
          {!loading && !error && data && data.totalTested === 0 && (
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>{t('label.positivityWidget.noData', 'No data available for this period.')}</p>
          )}
          {!loading && !error && data && data.totalTested > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: data.positivityRate >= 25 ? '#da1e28' : data.positivityRate >= 10 ? '#f1620a' : '#198038' }}>
                  {data.positivityRate?.toFixed(1)}%
                </p>
                <p style={{ fontSize: '0.7rem', color: '#8d8d8d', marginTop: '0.25rem' }}>{t('label.positivityWidget.positivityRate', 'Positivity Rate')}</p>
              </div>
              <div style={{ borderLeft: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#161616' }}>{data.totalTested.toLocaleString()}</p>
                <p style={{ fontSize: '0.7rem', color: '#8d8d8d', marginTop: '0.25rem' }}>{t('label.positivityWidget.totalTested', 'Total Tested')}</p>
              </div>
              <div style={{ borderLeft: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#161616' }}>{data.totalPositive.toLocaleString()}</p>
                <p style={{ fontSize: '0.7rem', color: '#8d8d8d', marginTop: '0.25rem' }}>{t('label.positivityWidget.totalPositive', 'Total Positive')}</p>
              </div>
            </div>
          )}
        </div>
      </Stack>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// 4. App — Demo shell (tabs for each surface)
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', background: '#f4f4f4' }}>
      <div style={{ background: '#161616', color: '#ffffff', padding: '0.75rem 2rem', fontSize: '0.875rem', fontWeight: 600 }}>
        OpenELIS Global
      </div>
      <Tabs>
        <TabList aria-label={t('nav.demoNav', 'Demo Navigation')}>
          <Tab>{t('nav.dashboard', 'Dashboard')}</Tab>
          <Tab>{t('heading.positivityReport.pageTitle', 'Positivity Rate Report')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('nav.dashboard', 'Dashboard')}
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1.5rem' }}>
                {t('message.positivityWidget.loading', 'Pre-configured widgets — preset auto-loads on selection, last choice is remembered per widget.')}
              </p>
              <Stack orientation="horizontal" gap={5} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <PositivityRateTile config={{ testId: 1, testName: 'HIV Rapid Test', defaultPreset: 'MONTH_TO_DATE' }} />
                <PositivityRateTile config={{ testId: 2, testName: 'Malaria RDT', defaultPreset: 'LAST_7_DAYS' }} />
                <PositivityRateTile config={{ testId: 3, testName: 'Syphilis RPR', defaultPreset: 'QUARTER_TO_DATE' }} />
              </Stack>
            </div>
          </TabPanel>
          <TabPanel>
            <PositivityRateReport />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
