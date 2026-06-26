// Route: /ReportPrintQueue
// SideNav: Reports → Report Print Queue
// r2: generalized to a report-type-agnostic queue with a generation lifecycle
// (QUEUED/GENERATING/READY/FAILED) layered on print status (UNPRINTED/PRINTED).
// v1 ships patient reports only (created directly in READY); other types + async are additive.

import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack, Layer, Heading, Section,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent,
  TableBatchActions, TableBatchAction, TableSelectRow, TableSelectAll,
  Button, Tag, InlineNotification, Pagination, ComboBox, Select, SelectItem,
  Breadcrumb, BreadcrumbItem, Tooltip, InlineLoading, Modal,
  RadioButtonGroup, RadioButton,
} from '@carbon/react';
import { Printer, Search, Renew } from '@carbon/icons-react';
// Existing, reused components — not reimplemented (see FRS FR-2-003 / BR-012).
// Gallery stubs: these components live in the main OpenELIS app and are not
// available in the mockup viewer; rendered here as plain inputs for preview.
const SearchPatientForm = ({ onSearchComplete }) => (
  <div style={{ padding: '0.5rem', border: '1px dashed #8d8d8d', borderRadius: '4px', color: '#525252', fontSize: '0.875rem' }}>
    SearchPatientForm (reused component — stub in gallery preview)
  </div>
);
const CustomLabNumberInput = ({ value, onChange, labelText }) => (
  <div style={{ padding: '0.5rem', border: '1px dashed #8d8d8d', borderRadius: '4px', color: '#525252', fontSize: '0.875rem' }}>
    CustomLabNumberInput: {labelText} (reused component — stub in gallery preview)
  </div>
);

const t = (key, fallback) => fallback || key;
const BATCH_LIMIT = 50;

// --- Reference data (would come from API) ----------------------------------
const REPORT_TYPES = [
  { id: 'PATIENT', label: t('label.printQueue.reportType.patient', 'Patient Report') },
  { id: 'RESULT_EXPORT', label: t('label.printQueue.reportType.resultExport', 'Result Export') },
  { id: 'MALARIA_CASE', label: t('label.printQueue.reportType.malariaCase', 'Malaria Case Report') },
  { id: 'NON_CONFORMITY_NOTIFICATION', label: t('label.printQueue.reportType.nonConformity', 'Non-Conformity Notification') },
];

const FACILITIES = [
  'Hôpital Central Antananarivo',
  'Clinique Urbaine Nord',
  'Centre de Santé de Base Analamanga',
];
const WARDS_BY_FACILITY = {
  'Hôpital Central Antananarivo': ['Médecine Interne', 'Pédiatrie', 'Maternité', 'Réanimation'],
  'Clinique Urbaine Nord': ['Urgences', 'Chirurgie', 'Consultation'],
  'Centre de Santé de Base Analamanga': ['Consultation Générale', 'Maternité'],
};
const REQUESTORS = ['Dr. Rabe', 'Dr. Rasoa', 'Dr. Randria', 'Dr. Rakoto'];

const TIME_WINDOW_OPTIONS = [
  { id: '1', label: t('label.printQueue.timeWindow24h', 'Last 24 Hours') },
  { id: '7', label: t('label.printQueue.timeWindow7d', 'Last 7 Days') },
  { id: '30', label: t('label.printQueue.timeWindow30d', 'Last 30 Days') },
  { id: '-1', label: t('label.printQueue.timeWindowAll', 'All Time') },
];

// generationStatus → Carbon Tag kind
const GEN_TAG = {
  QUEUED: { type: 'gray', label: t('label.printQueue.genQueued', 'Queued') },
  GENERATING: { type: 'blue', label: t('label.printQueue.genGenerating', 'Generating') },
  READY: { type: 'teal', label: t('label.printQueue.genReady', 'Ready') },
  FAILED: { type: 'red', label: t('label.printQueue.genFailed', 'Failed') },
};

// --- Sample queue data (GET /rest/reports/print-queue) ----------------------
// v1 rows are PATIENT/READY; the EXPORT/MALARIA rows demonstrate the lifecycle.
// testsReported/testsTotal drive the Completeness indicator (FR-1-007).
// autoQueued:false rows are only reachable via search (FR-2-003j) — they have no
// finalized-and-unprinted result yet, so they never appear in the default view.
const INITIAL_QUEUE = [
  { id: '1', reportType: 'PATIENT', accessionNumber: 'LAB-2026-00891', patientId: 'P-10045', subjectLabel: 'LAB-2026-00891 — Rakoto, Jean', facility: 'Hôpital Central Antananarivo', ward: 'Médecine Interne', requestor: 'Dr. Rabe', queuedAt: '2026-03-18 08:42', generationStatus: 'READY', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: true, testsReported: 6, testsTotal: 7, autoQueued: true },
  { id: '2', reportType: 'PATIENT', accessionNumber: 'LAB-2026-00874', patientId: 'P-10032', subjectLabel: 'LAB-2026-00874 — Andriantsoa, Marie', facility: 'Hôpital Central Antananarivo', ward: 'Pédiatrie', requestor: 'Dr. Rasoa', queuedAt: '2026-03-18 07:15', generationStatus: 'READY', printStatus: 'UNPRINTED', isAmended: true, hasCriticalValue: false, testsReported: 1, testsTotal: 1, autoQueued: true },
  { id: '3', reportType: 'PATIENT', accessionNumber: 'LAB-2026-00865', patientId: 'P-10021', subjectLabel: 'LAB-2026-00865 — Razafy, Pierre', facility: 'Clinique Urbaine Nord', ward: 'Urgences', requestor: 'Dr. Randria', queuedAt: '2026-03-17 14:30', generationStatus: 'READY', printStatus: 'PRINTED', isAmended: false, hasCriticalValue: false, testsReported: 5, testsTotal: 5, autoQueued: true },
  { id: '4', reportType: 'MALARIA_CASE', accessionNumber: '', patientId: '', subjectLabel: 'Weekly Malaria Case Report — Wk 11', facility: 'Clinique Urbaine Nord', ward: '', requestor: '', queuedAt: '2026-03-18 09:30', generationStatus: 'READY', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false, testsReported: null, testsTotal: null, autoQueued: true },
  { id: '5', reportType: 'RESULT_EXPORT', accessionNumber: '', patientId: '', subjectLabel: 'Result Export — Chemistry, 01–17 Mar', facility: '', ward: '', requestor: '', queuedAt: '2026-03-18 10:02', generationStatus: 'GENERATING', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false, testsReported: null, testsTotal: null, autoQueued: true },
  { id: '6', reportType: 'RESULT_EXPORT', accessionNumber: '', patientId: '', subjectLabel: 'Result Export — Microbiology, Feb', facility: '', ward: '', requestor: '', queuedAt: '2026-03-18 09:58', generationStatus: 'FAILED', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false, testsReported: null, testsTotal: null, autoQueued: true },
  { id: '7', reportType: 'PATIENT', accessionNumber: 'LAB-2026-00902', patientId: 'P-10071', subjectLabel: 'LAB-2026-00902 — Ratsima, Hery', facility: 'Hôpital Central Antananarivo', ward: 'Réanimation', requestor: 'Dr. Rabe', queuedAt: '2026-03-18 11:10', generationStatus: 'READY', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false, testsReported: 0, testsTotal: 9, autoQueued: false },
];

const TABLE_HEADERS = [
  { key: 'reportType', header: t('label.printQueue.reportType', 'Report Type') },
  { key: 'subjectLabel', header: t('label.printQueue.subject', 'Subject') },
  { key: 'facility', header: t('label.printQueue.facility', 'Facility') },
  { key: 'ward', header: t('label.printQueue.ward', 'Ward / Dept / Unit') },
  { key: 'requestor', header: t('label.printQueue.requestor', 'Requestor') },
  { key: 'queuedAt', header: t('label.printQueue.queuedAt', 'Validated / Queued At') },
  { key: 'completeness', header: t('label.printQueue.completeness', 'Completeness') },
  { key: 'status', header: t('label.printQueue.status', 'Status') },
  { key: 'actions', header: '' },
];

const typeLabel = (id) => (REPORT_TYPES.find((r) => r.id === id) || {}).label || id;

export default function ReportPrintQueue() {
  const [reportType, setReportType] = useState('ALL');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedRequestor, setSelectedRequestor] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [timeWindow, setTimeWindow] = useState('7');

  const [notification, setNotification] = useState(null);
  const [printingIds, setPrintingIds] = useState(new Set());

  // Search Patient / Accession (FR-2-003): modal + active search filter (mutually exclusive modes)
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState('patient'); // 'patient' | 'labno'
  const [labFrom, setLabFrom] = useState('');
  const [labTo, setLabTo] = useState('');
  // searchFilter: null | { kind:'patient', patientId, name } | { kind:'labno', from, to }
  const [searchFilter, setSearchFilter] = useState(null);
  const searchActive = !!searchFilter;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [queueData, setQueueData] = useState(INITIAL_QUEUE);

  const availableWards = useMemo(
    () => (selectedFacility ? WARDS_BY_FACILITY[selectedFacility] || [] : []),
    [selectedFacility]
  );

  const filteredRows = useMemo(() => {
    return queueData.filter((row) => {
      // Default view = auto-queued only; search surfaces in-progress orders too (FR-2-003j / BR-015)
      if (!searchFilter && row.autoQueued === false) return false;
      if (reportType !== 'ALL' && row.reportType !== reportType) return false;
      if (selectedFacility && row.facility !== selectedFacility) return false;
      if (selectedWard && row.ward !== selectedWard) return false;
      if (selectedRequestor && row.requestor !== selectedRequestor) return false;
      // Targeted search filter (BR-013: overrides Time Window — not modelled here since mock is unscoped)
      if (searchFilter?.kind === 'patient' && row.patientId !== searchFilter.patientId) return false;
      if (searchFilter?.kind === 'labno') {
        const acc = row.accessionNumber || '';
        if (!acc) return false;
        if (searchFilter.to) {
          if (acc < searchFilter.from || acc > searchFilter.to) return false;
        } else if (acc !== searchFilter.from) {
          return false;
        }
      }
      if (selectedStatus === 'UNPRINTED' && row.printStatus !== 'UNPRINTED') return false;
      if (selectedStatus === 'PRINTED' && row.printStatus !== 'PRINTED') return false;
      return true;
    });
  }, [queueData, reportType, selectedFacility, selectedWard, selectedRequestor, searchFilter, selectedStatus]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleClearFilters = useCallback(() => {
    setReportType('ALL');
    setSelectedFacility(null);
    setSelectedWard(null);
    setSelectedRequestor(null);
    setSelectedStatus('ALL');
    setSearchFilter(null);
    // Time Window preference intentionally NOT reset (FR-2-004)
  }, []);

  // Mode A: the reused SearchPatientForm returns a patient via getSelectedPatient (FR-2-003d).
  const handlePatientSelected = useCallback((patient) => {
    const name = `${patient.lastName || ''}, ${patient.firstName || ''}`.replace(/^, |, $/g, '');
    setSearchFilter({ kind: 'patient', patientId: patient.patientID || patient.patientPK, name: name || 'Patient' });
    setSearchOpen(false);
  }, []);

  // Mode B: single lab number or inclusive From–To range (FR-2-003e–f).
  const handleLabNoSearch = useCallback(() => {
    if (!labFrom) return;
    if (labTo && labFrom > labTo) return; // error.printQueue.invalidLabRange
    setSearchFilter({ kind: 'labno', from: labFrom, to: labTo || null });
    setSearchOpen(false);
  }, [labFrom, labTo]);

  const searchChipLabel = !searchFilter
    ? ''
    : searchFilter.kind === 'patient'
      ? t('label.printQueue.patientFilter', `Patient: ${searchFilter.name}`)
      : searchFilter.to
        ? t('label.printQueue.labNoRangeFilter', `Lab No: ${searchFilter.from}–${searchFilter.to}`)
        : t('label.printQueue.labNoFilter', `Lab No: ${searchFilter.from}`);

  const showNotification = useCallback((kind, title) => setNotification({ kind, title }), []);

  // Preliminary-print confirmation (FR-4-007): gate printing of Partial entries
  const [confirmPrint, setConfirmPrint] = useState(null); // { ids, reported, total }
  const isPartial = (row) =>
    row.reportType === 'PATIENT' && row.testsTotal > 0 && row.testsReported < row.testsTotal;

  // Single = one PDF/tab; batch = ONE combined PDF in a single tab. READY only.
  const handlePrint = useCallback(
    async (ids) => {
      if (ids.length === 0) return;
      setPrintingIds(new Set(ids));
      await new Promise((r) => setTimeout(r, 1400));
      setPrintingIds(new Set());
      setQueueData((prev) =>
        prev.map((row) =>
          ids.includes(row.id) ? { ...row, printStatus: 'PRINTED', isAmended: false } : row
        )
      );
      showNotification(
        'success',
        t('message.printQueue.printSuccess', `${ids.length} report(s) generated and marked as printed.`)
      );
    },
    [showNotification]
  );

  // Gate Partial prints behind a preliminary confirmation (FR-4-007).
  const requestPrint = useCallback(
    (ids) => {
      const rows = queueData.filter((r) => ids.includes(r.id));
      const partials = rows.filter(isPartial);
      if (partials.length > 0) {
        const p = partials[0];
        setConfirmPrint({ ids, reported: p.testsReported, total: p.testsTotal, multi: partials.length > 1 });
      } else {
        handlePrint(ids);
      }
    },
    [queueData, handlePrint]
  );

  const handleRetry = useCallback((id) => {
    setQueueData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, generationStatus: 'QUEUED' } : row))
    );
  }, []);

  return (
    <Layer>
      <Stack gap={5}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#">{t('nav.reports', 'Reports')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            {t('nav.printQueue.menuItem', 'Report Print Queue')}
          </BreadcrumbItem>
        </Breadcrumb>

        <Heading>{t('heading.printQueue.title', 'Report Print Queue')}</Heading>

        {notification && (
          <InlineNotification
            kind={notification.kind}
            title={notification.title}
            lowContrast
            onCloseButtonClick={() => setNotification(null)}
          />
        )}

        {/* Filter toolbar */}
        <Layer>
          <Section>
            <Grid condensed>
              <Column lg={3} md={4} sm={4}>
                <Select
                  id="filter-report-type"
                  labelText={t('label.printQueue.reportType', 'Report Type')}
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <SelectItem value="ALL" text={t('placeholder.printQueue.allReportTypes', 'All Report Types')} />
                  {REPORT_TYPES.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id} text={rt.label} />
                  ))}
                </Select>
              </Column>

              <Column lg={3} md={4} sm={4}>
                <ComboBox
                  id="filter-facility"
                  titleText={t('label.printQueue.facility', 'Facility')}
                  placeholder={t('placeholder.printQueue.facilitySearch', 'Search facilities...')}
                  items={FACILITIES}
                  selectedItem={selectedFacility}
                  onChange={({ selectedItem }) => {
                    setSelectedFacility(selectedItem);
                    setSelectedWard(null);
                  }}
                />
              </Column>

              <Column lg={3} md={4} sm={4}>
                <ComboBox
                  id="filter-ward"
                  titleText={t('label.printQueue.ward', 'Ward / Dept / Unit')}
                  placeholder={t('placeholder.printQueue.wardSearch', 'Search wards...')}
                  items={availableWards}
                  selectedItem={selectedWard}
                  disabled={!selectedFacility}
                  onChange={({ selectedItem }) => setSelectedWard(selectedItem)}
                />
              </Column>

              <Column lg={3} md={4} sm={4}>
                <ComboBox
                  id="filter-requestor"
                  titleText={t('label.printQueue.requestor', 'Requestor')}
                  placeholder={t('placeholder.printQueue.requestorSearch', 'Search requestors...')}
                  items={REQUESTORS}
                  selectedItem={selectedRequestor}
                  onChange={({ selectedItem }) => setSelectedRequestor(selectedItem)}
                />
              </Column>

              <Column lg={2} md={4} sm={4}>
                <Select
                  id="filter-status"
                  labelText={t('label.printQueue.statusFilter', 'Print Status')}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <SelectItem value="ALL" text={t('label.printQueue.statusAll', 'All')} />
                  <SelectItem value="UNPRINTED" text={t('label.printQueue.statusUnprinted', 'Unprinted')} />
                  <SelectItem value="PRINTED" text={t('label.printQueue.statusPrinted', 'Printed')} />
                </Select>
              </Column>

              <Column lg={2} md={4} sm={4}>
                <Select
                  id="filter-time-window"
                  labelText={t('label.printQueue.timeWindow', 'Time Window')}
                  value={timeWindow}
                  disabled={searchActive} /* BR-013: targeted search overrides Time Window */
                  helperText={searchActive ? t('helper.printQueue.timeWindowOverridden', 'Ignored while searching') : undefined}
                  onChange={(e) => setTimeWindow(e.target.value)}
                >
                  {TIME_WINDOW_OPTIONS.map((tw) => (
                    <SelectItem key={tw.id} value={tw.id} text={tw.label} />
                  ))}
                </Select>
              </Column>

              <Column lg={16} md={8} sm={4}>
                <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
                  <Button kind="ghost" size="sm" onClick={handleClearFilters}>
                    {t('button.printQueue.clearFilters', 'Clear Filters')}
                  </Button>
                  {searchFilter && (
                    <Tag
                      type="outline"
                      filter
                      onClose={() => setSearchFilter(null)}
                      title={t('button.printQueue.clearSearchFilter', 'Remove search filter')}
                    >
                      {searchChipLabel}
                    </Tag>
                  )}
                </Stack>
              </Column>
            </Grid>
          </Section>
        </Layer>

        {/* DataTable */}
        <DataTable rows={paginatedRows} headers={TABLE_HEADERS} isSortable>
          {({
            rows, headers, getHeaderProps, getRowProps, getSelectionProps,
            getBatchActionProps, selectedRows, getTableProps, getToolbarProps,
          }) => {
            const overLimit = selectedRows.length > BATCH_LIMIT;
            const printSelectedBtn = (
              <TableBatchAction
                tabIndex={getBatchActionProps().shouldShowBatchActions ? 0 : -1}
                renderIcon={Printer}
                disabled={overLimit}
                onClick={() => requestPrint(selectedRows.map((r) => r.id))}
              >
                {t('button.printQueue.printSelected', `Print Selected (${selectedRows.length})`)}
              </TableBatchAction>
            );

            return (
              <TableContainer
                title={t('heading.printQueue.queueTable', 'Report Print Queue')}
                description={t('message.printQueue.tableDescription', 'Reports ready to print, plus reports still being generated.')}
              >
                <TableToolbar {...getToolbarProps()}>
                  <TableBatchActions {...getBatchActionProps()}>
                    {overLimit ? (
                      <Tooltip align="bottom" label={t('error.printQueue.batchLimitExceeded', 'Batch print is limited to 50 reports. Please reduce your selection.')}>
                        {printSelectedBtn}
                      </Tooltip>
                    ) : (
                      printSelectedBtn
                    )}
                  </TableBatchActions>
                  <TableToolbarContent>
                    <Button kind="ghost" renderIcon={Search} size="sm" onClick={() => setSearchOpen(true)}>
                      {t('button.printQueue.search', 'Search Patient / Accession')}
                    </Button>
                  </TableToolbarContent>
                </TableToolbar>

                <Table {...getTableProps()} size="lg">
                  <TableHead>
                    <TableRow>
                      <TableSelectAll {...getSelectionProps()} />
                      {headers.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.map((row) => {
                      const data = queueData.find((d) => d.id === row.id);
                      if (!data) return null;
                      const isPrinting = printingIds.has(row.id);
                      const isReady = data.generationStatus === 'READY';
                      const gen = GEN_TAG[data.generationStatus];

                      return (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          <TableSelectRow
                            {...getSelectionProps({ row })}
                            disabled={!isReady}
                          />

                          {row.cells.map((cell) => {
                            if (cell.info.header === 'reportType') {
                              return <TableCell key={cell.id}>{typeLabel(data.reportType)}</TableCell>;
                            }

                            // Completeness (FR-1-007): test-based reports show Final/Partial + count
                            if (cell.info.header === 'completeness') {
                              const testBased = data.testsTotal != null && data.testsTotal > 0;
                              if (!testBased) {
                                return <TableCell key={cell.id} style={{ color: 'var(--cds-text-secondary)' }}>{t('label.printQueue.notApplicable', '—')}</TableCell>;
                              }
                              const final = data.testsReported >= data.testsTotal;
                              const pct = Math.round((data.testsReported / data.testsTotal) * 100);
                              return (
                                <TableCell key={cell.id}>
                                  <Stack orientation="horizontal" gap={2} style={{ alignItems: 'center' }}>
                                    <Tag type={final ? 'teal' : 'warm-gray'} size="sm">
                                      {final
                                        ? t('label.printQueue.completenessFinal', 'Final')
                                        : t('label.printQueue.completenessPartial', 'Partial')}
                                    </Tag>
                                    <span title={t('label.printQueue.testsReportedFull', `${data.testsReported} of ${data.testsTotal} tests reported`)}
                                      style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                      {data.testsReported}/{data.testsTotal}
                                    </span>
                                    <span aria-hidden style={{ width: 36, height: 4, background: 'var(--cds-layer-accent)', borderRadius: 2, overflow: 'hidden' }}>
                                      <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: final ? 'var(--cds-support-success)' : 'var(--cds-support-warning)' }} />
                                    </span>
                                  </Stack>
                                </TableCell>
                              );
                            }

                            if (cell.info.header === 'status') {
                              return (
                                <TableCell key={cell.id}>
                                  <Stack orientation="horizontal" gap={2}>
                                    {/* Generation status — suppressed for test-based READY rows
                                        (Completeness column conveys readiness); shown for async
                                        types and any non-READY state */}
                                    {data.generationStatus === 'GENERATING' ? (
                                      <InlineLoading description={gen.label} status="active" />
                                    ) : !(data.testsTotal > 0 && isReady) ? (
                                      <Tag type={gen.type} size="sm">{gen.label}</Tag>
                                    ) : null}
                                    {/* Print status — only meaningful once READY */}
                                    {isReady && (
                                      <Tag type={data.printStatus === 'UNPRINTED' ? 'purple' : 'green'} size="sm">
                                        {data.printStatus === 'UNPRINTED'
                                          ? t('label.printQueue.statusUnprinted', 'Unprinted')
                                          : t('label.printQueue.statusPrinted', 'Printed')}
                                      </Tag>
                                    )}
                                    {data.isAmended && (
                                      <Tag type="blue" size="sm">{t('label.printQueue.statusAmended', 'Amended')}</Tag>
                                    )}
                                    {data.hasCriticalValue && (
                                      <Tag type="red" size="sm">{t('label.printQueue.critical', 'Critical Value')}</Tag>
                                    )}
                                  </Stack>
                                </TableCell>
                              );
                            }

                            if (cell.info.header === 'actions') {
                              return (
                                <TableCell key={cell.id}>
                                  {data.generationStatus === 'FAILED' ? (
                                    <Button kind="tertiary" size="sm" renderIcon={Renew} onClick={() => handleRetry(row.id)}>
                                      {t('button.printQueue.retry', 'Retry')}
                                    </Button>
                                  ) : (
                                    <Button
                                      kind="primary"
                                      size="sm"
                                      renderIcon={Printer}
                                      disabled={!isReady || isPrinting}
                                      onClick={() => requestPrint([row.id])}
                                    >
                                      {isPrinting
                                        ? t('button.printQueue.printing', 'Printing...')
                                        : t('button.printQueue.printSingle', 'Print')}
                                    </Button>
                                  )}
                                </TableCell>
                              );
                            }

                            return <TableCell key={cell.id}>{cell.value}</TableCell>;
                          })}
                        </TableRow>
                      );
                    })}

                    {filteredRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={headers.length + 1}>
                          <Stack gap={2} style={{ textAlign: 'center', padding: 'var(--cds-spacing-09) var(--cds-spacing-05)' }}>
                            <strong>{t('message.printQueue.empty', 'No reports in queue')}</strong>
                            <span>{t('message.printQueue.emptySubtext', 'All reports have been printed, or no results have been validated in the selected time window.')}</span>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          }}
        </DataTable>

        <Pagination
          totalItems={filteredRows.length}
          pageSize={pageSize}
          pageSizes={[10, 20, 50, 100]}
          page={currentPage}
          onChange={({ page, pageSize: newSize }) => {
            setCurrentPage(page);
            setPageSize(newSize);
          }}
        />

        {/* Search Patient / Accession — two mutually exclusive modes (FR-2-003).
            passiveModal: Mode A selection is driven by SearchPatientForm's getSelectedPatient
            callback; Mode B has its own Search button. Both apply a targeted filter that
            overrides the Time Window (BR-013) and show a dismissible Tag. */}
        <Modal
          open={searchOpen}
          passiveModal
          modalHeading={t('heading.printQueue.searchModal', 'Search Patient / Accession')}
          onRequestClose={() => setSearchOpen(false)}
          size="lg"
        >
          <Stack gap={5}>
            <RadioButtonGroup
              legendText=""
              name="search-mode"
              valueSelected={searchMode}
              onChange={(v) => setSearchMode(v)}
            >
              <RadioButton labelText={t('label.printQueue.searchModePatient', 'By Patient')} value="patient" id="mode-patient" />
              <RadioButton labelText={t('label.printQueue.searchModeLabNo', 'By Lab Number')} value="labno" id="mode-labno" />
            </RadioButtonGroup>

            {searchMode === 'patient' ? (
              // Mode A — reused component, local-only
              <SearchPatientForm
                getSelectedPatient={handlePatientSelected}
                suppressExternalSearch
                hideClientRegistry
              />
            ) : (
              // Mode B — single lab number or inclusive From–To range
              <Grid>
                <Column lg={8} md={4} sm={4}>
                  <CustomLabNumberInput
                    id="search-lab-from"
                    labelText={t('label.printQueue.labNoFrom', 'From Lab Number')}
                    value={labFrom}
                    onChange={(e, raw) => setLabFrom(raw)}
                  />
                </Column>
                <Column lg={8} md={4} sm={4}>
                  <CustomLabNumberInput
                    id="search-lab-to"
                    labelText={t('label.printQueue.labNoTo', 'To Lab Number (optional)')}
                    value={labTo}
                    onChange={(e, raw) => setLabTo(raw)}
                  />
                </Column>
                <Column lg={16}>
                  {labFrom && labTo && labFrom > labTo && (
                    <InlineNotification
                      kind="error"
                      lowContrast
                      hideCloseButton
                      title={t('error.printQueue.invalidLabRange', '"From" lab number must not be greater than "To".')}
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                  <Button
                    kind="tertiary"
                    size="md"
                    renderIcon={Search}
                    disabled={!labFrom || (labTo && labFrom > labTo)}
                    onClick={handleLabNoSearch}
                    style={{ marginTop: '0.75rem' }}
                  >
                    {t('button.printQueue.search', 'Search')}
                  </Button>
                </Column>
              </Grid>
            )}
          </Stack>
        </Modal>

        {/* Preliminary-print confirmation (FR-4-007) */}
        <Modal
          open={!!confirmPrint}
          modalHeading={t('heading.printQueue.preliminaryConfirm', 'Preliminary report')}
          primaryButtonText={t('button.printQueue.printAnyway', 'Print anyway')}
          secondaryButtonText={t('button.cancel', 'Cancel')}
          onRequestClose={() => setConfirmPrint(null)}
          onRequestSubmit={() => { const ids = confirmPrint.ids; setConfirmPrint(null); handlePrint(ids); }}
          size="sm"
        >
          <p>
            {t(
              'message.printQueue.preliminaryConfirm',
              confirmPrint
                ? `Preliminary report — ${confirmPrint.reported} of ${confirmPrint.total} tests reported.${confirmPrint.multi ? ' One or more selected reports are preliminary.' : ''} Print anyway?`
                : ''
            )}
          </p>
        </Modal>
      </Stack>
    </Layer>
  );
}
