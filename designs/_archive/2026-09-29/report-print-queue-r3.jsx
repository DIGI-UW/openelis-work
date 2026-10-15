// Route: /ReportPrintQueue
// SideNav: Reports → Report Print Queue
// r3: filter bar redesign (replaces r2 — development not started, no migration concerns).
//  • Facility / Ward / Requestor = FilterableMultiSelect with SERVER-SIDE typeahead
//    (thousands of Organizations/Providers — options fetched as the user types, ≥2 chars,
//    debounced; reuse the Add Order referring-site/provider autosuggest endpoints).
//  • Lab No is a first-class toolbar lookup (barcode scan / type + Enter), optional Range.
//  • Search by Patient opens an INLINE collapsible panel under the filter bar (no Modal).
//  • Targeted searches (patient or lab-no) are EXCLUSIVE: they clear + disable the browse
//    filters and search all time; a dismissible Tag + "Clear search" restores (FR-2-005).
//  • No preliminary-print confirmation (FR-4-007): the Completeness tag is the signal.
//  • Standard inline guidance (FR-1-008): status-legend info strip + field helpers.

import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack, Layer, Heading, Section,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent,
  TableBatchActions, TableBatchAction, TableSelectRow, TableSelectAll,
  Button, Tag, InlineNotification, Pagination, Select, SelectItem,
  FilterableMultiSelect, Breadcrumb, BreadcrumbItem, Tooltip, InlineLoading, TextInput,
} from '@carbon/react';
import { Printer, Search, Renew, ChevronDown, ChevronUp, Close } from '@carbon/icons-react';
// Existing, reused components — not reimplemented (FR-2-003 / FR-2-004 / BR-012).
// Gallery stubs: these live in the main OpenELIS app and are not available in the
// mockup viewer; rendered here so the preview is self-contained.
const SearchPatientForm = () => (
  <div style={{ padding: '0.5rem', border: '1px dashed #8d8d8d', borderRadius: '4px', color: '#525252', fontSize: '0.875rem' }}>
    SearchPatientForm (reused component — stub in gallery preview)
  </div>
);
const CustomLabNumberInput = ({ onChange, ...props }) => (
  <TextInput {...props} onChange={(e) => onChange && onChange(e, e.target.value)} />
);

const t = (key, fallback) => fallback || key;
const BATCH_LIMIT = 50;

// --- Reference data ----------------------------------------------------------
// NOTE (FR-2-001a): in production these option lists are NOT preloaded. Each
// FilterableMultiSelect fetches matches server-side as the user types (≥2 chars,
// ~300 ms debounce, ≤25 results + "keep typing" affordance), via the same
// autosuggest endpoints Add Order uses for Referring Site and Provider.
// The static arrays below stand in for one page of typeahead results.
const REPORT_TYPES = [
  { id: 'PATIENT', label: t('label.printQueue.reportType.patient', 'Patient Report') },
  { id: 'RESULT_EXPORT', label: t('label.printQueue.reportType.resultExport', 'Result Export') },
  { id: 'MALARIA_CASE', label: t('label.printQueue.reportType.malariaCase', 'Malaria Case Report') },
  { id: 'NON_CONFORMITY_NOTIFICATION', label: t('label.printQueue.reportType.nonConformity', 'Non-Conformity Notification') },
];

const FACILITIES = [
  'Hôpital Central Antananarivo',
  'Hôpital Universitaire Andohatapenaka',
  'Clinique Urbaine Nord',
  'Centre Hospitalier de Toamasina',
  'Centre de Santé de Base Analamanga',
];
const WARDS_BY_FACILITY = {
  'Hôpital Central Antananarivo': ['Médecine Interne', 'Pédiatrie', 'Maternité', 'Réanimation'],
  'Hôpital Universitaire Andohatapenaka': ['Néphrologie', 'Oncologie', 'Pédiatrie'],
  'Clinique Urbaine Nord': ['Urgences', 'Chirurgie', 'Consultation'],
  'Centre Hospitalier de Toamasina': ['Médecine Interne', 'Urgences'],
  'Centre de Santé de Base Analamanga': ['Consultation Générale', 'Maternité'],
};
const REQUESTORS = ['Dr. Rabe, Haja', 'Dr. Rasoa, Voahangy', 'Dr. Randria, Mamy', 'Dr. Rakoto, Solofo'];

const TIME_WINDOW_OPTIONS = [
  { id: '1', label: t('label.printQueue.timeWindow24h', 'Last 24 Hours') },
  { id: '7', label: t('label.printQueue.timeWindow7d', 'Last 7 Days') },
  { id: '30', label: t('label.printQueue.timeWindow30d', 'Last 30 Days') },
  { id: '-1', label: t('label.printQueue.timeWindowAll', 'All Time') },
];

const GEN_TAG = {
  QUEUED: { type: 'gray', label: t('label.printQueue.genQueued', 'Queued') },
  GENERATING: { type: 'blue', label: t('label.printQueue.genGenerating', 'Generating') },
  READY: { type: 'teal', label: t('label.printQueue.genReady', 'Ready') },
  FAILED: { type: 'red', label: t('label.printQueue.genFailed', 'Failed') },
};

// --- Sample queue data (GET /rest/reports/print-queue) ------------------------
// autoQueued:false rows are only reachable via a targeted search (FR-2-005f / BR-015).
const INITIAL_QUEUE = [
  { id: '1', reportType: 'PATIENT', accessionNumber: 'LAB-2026-00891', patientId: 'P-10045', subjectLabel: 'LAB-2026-00891 — Rakoto, Jean', facility: 'Hôpital Central Antananarivo', ward: 'Médecine Interne', requestor: 'Dr. Rabe, Haja', queuedAt: '2026-07-06 08:42', generationStatus: 'READY', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: true, testsReported: 6, testsTotal: 7, autoQueued: true },
  { id: '2', reportType: 'PATIENT', accessionNumber: 'LAB-2026-00874', patientId: 'P-10032', subjectLabel: 'LAB-2026-00874 — Andriantsoa, Marie', facility: 'Hôpital Central Antananarivo', ward: 'Pédiatrie', requestor: 'Dr. Rasoa, Voahangy', queuedAt: '2026-07-06 07:15', generationStatus: 'READY', printStatus: 'UNPRINTED', isAmended: true, hasCriticalValue: false, testsReported: 1, testsTotal: 1, autoQueued: true },
  { id: '3', reportType: 'PATIENT', accessionNumber: 'LAB-2026-00865', patientId: 'P-10021', subjectLabel: 'LAB-2026-00865 — Razafy, Pierre', facility: 'Clinique Urbaine Nord', ward: 'Urgences', requestor: 'Dr. Randria, Mamy', queuedAt: '2026-07-05 14:30', generationStatus: 'READY', printStatus: 'PRINTED', isAmended: false, hasCriticalValue: false, testsReported: 5, testsTotal: 5, autoQueued: true },
  { id: '4', reportType: 'MALARIA_CASE', accessionNumber: '', patientId: '', subjectLabel: 'Weekly Malaria Case Report — Wk 27', facility: 'Clinique Urbaine Nord', ward: '', requestor: '', queuedAt: '2026-07-06 09:30', generationStatus: 'READY', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false, testsReported: null, testsTotal: null, autoQueued: true },
  { id: '5', reportType: 'RESULT_EXPORT', accessionNumber: '', patientId: '', subjectLabel: 'Result Export — Chemistry, 22 Jun–05 Jul', facility: '', ward: '', requestor: '', queuedAt: '2026-07-06 10:02', generationStatus: 'GENERATING', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false, testsReported: null, testsTotal: null, autoQueued: true },
  { id: '6', reportType: 'RESULT_EXPORT', accessionNumber: '', patientId: '', subjectLabel: 'Result Export — Microbiology, June', facility: '', ward: '', requestor: '', queuedAt: '2026-07-06 09:58', generationStatus: 'FAILED', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false, testsReported: null, testsTotal: null, autoQueued: true },
  { id: '7', reportType: 'PATIENT', accessionNumber: 'LAB-2026-00902', patientId: 'P-10071', subjectLabel: 'LAB-2026-00902 — Ratsima, Hery', facility: 'Hôpital Central Antananarivo', ward: 'Réanimation', requestor: 'Dr. Rabe, Haja', queuedAt: '2026-07-06 11:10', generationStatus: 'READY', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false, testsReported: 0, testsTotal: 9, autoQueued: false },
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
  // Browse filters (multi-select arrays — OR within a filter, AND across filters, FR-2-001a)
  const [reportType, setReportType] = useState('ALL');
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedWards, setSelectedWards] = useState([]);
  const [selectedRequestors, setSelectedRequestors] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [timeWindow, setTimeWindow] = useState('7');

  // Lab No toolbar lookup (FR-2-003): single scan/type + Enter, optional Range
  const [labFrom, setLabFrom] = useState('');
  const [labTo, setLabTo] = useState('');
  const [rangeOpen, setRangeOpen] = useState(false);

  // Inline patient search panel (FR-2-004)
  const [panelOpen, setPanelOpen] = useState(false);

  // Targeted search: null | { kind:'patient', patientId, name } | { kind:'labno', from, to }
  const [searchFilter, setSearchFilter] = useState(null);
  const searchActive = !!searchFilter; // FR-2-005a: browse filters cleared + disabled while active

  const [notification, setNotification] = useState(null);
  const [printingIds, setPrintingIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [queueData, setQueueData] = useState(INITIAL_QUEUE);

  // Ward is a subunit of Facility (FR-2-002): enabled only when ≥1 facility selected;
  // options = union of the selected facilities' child wards.
  const availableWards = useMemo(
    () => [...new Set(selectedFacilities.flatMap((f) => WARDS_BY_FACILITY[f] || []))],
    [selectedFacilities]
  );
  const handleFacilitiesChange = useCallback(({ selectedItems }) => {
    setSelectedFacilities(selectedItems);
    if (selectedItems.length === 0) {
      setSelectedWards([]); // clearing the last facility clears + re-disables ward
    } else {
      const union = new Set(selectedItems.flatMap((f) => WARDS_BY_FACILITY[f] || []));
      setSelectedWards((w) => w.filter((x) => union.has(x)));
    }
  }, []);

  const clearBrowseFilters = useCallback(() => {
    setReportType('ALL');
    setSelectedFacilities([]);
    setSelectedWards([]);
    setSelectedRequestors([]);
    setSelectedStatus('ALL');
    // Time Window preference intentionally NOT reset (FR-2-006)
  }, []);

  // FR-2-005: applying a targeted search clears + disables the browse filters
  const applyTargetedSearch = useCallback((filter) => {
    clearBrowseFilters();
    setSearchFilter(filter);
    setPanelOpen(false);
    setCurrentPage(1);
  }, [clearBrowseFilters]);

  const clearTargetedSearch = useCallback(() => {
    setSearchFilter(null);
    setLabFrom('');
    setLabTo('');
    setRangeOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    clearBrowseFilters();
    clearTargetedSearch();
  }, [clearBrowseFilters, clearTargetedSearch]);

  // FR-2-004d: the reused SearchPatientForm returns a patient via getSelectedPatient
  const handlePatientSelected = useCallback((patient) => {
    const name = `${patient.lastName || ''}, ${patient.firstName || ''}`.replace(/^, |, $/g, '');
    applyTargetedSearch({ kind: 'patient', patientId: patient.patientID || patient.patientPK, name: name || 'Patient' });
  }, [applyTargetedSearch]);

  // FR-2-003a–b: Enter (= barcode terminator) applies; optional inclusive range
  const handleLabNoSearch = useCallback(() => {
    if (!labFrom) return;
    if (labTo && labFrom > labTo) return; // error.printQueue.invalidLabRange surfaces inline
    applyTargetedSearch({ kind: 'labno', from: labFrom, to: rangeOpen && labTo ? labTo : null });
  }, [labFrom, labTo, rangeOpen, applyTargetedSearch]);

  const filteredRows = useMemo(() => {
    return queueData.filter((row) => {
      if (searchFilter) {
        // Targeted search: all-time, reaches in-progress orders, browse filters suspended (BR-013/BR-015)
        if (searchFilter.kind === 'patient') return row.patientId === searchFilter.patientId;
        const acc = row.accessionNumber || '';
        if (!acc) return false;
        if (searchFilter.to) return acc >= searchFilter.from && acc <= searchFilter.to;
        return acc === searchFilter.from;
      }
      if (row.autoQueued === false) return false; // default view = auto-queued only
      if (reportType !== 'ALL' && row.reportType !== reportType) return false;
      if (selectedFacilities.length && !selectedFacilities.includes(row.facility)) return false;
      if (selectedWards.length && !selectedWards.includes(row.ward)) return false;
      if (selectedRequestors.length && !selectedRequestors.includes(row.requestor)) return false;
      if (selectedStatus === 'UNPRINTED' && row.printStatus !== 'UNPRINTED') return false;
      if (selectedStatus === 'PRINTED' && row.printStatus !== 'PRINTED') return false;
      return true;
    });
  }, [queueData, searchFilter, reportType, selectedFacilities, selectedWards, selectedRequestors, selectedStatus]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const searchChipLabel = !searchFilter
    ? ''
    : searchFilter.kind === 'patient'
      ? t('label.printQueue.patientFilter', `Patient: ${searchFilter.name}`)
      : searchFilter.to
        ? t('label.printQueue.labNoRangeFilter', `Lab No: ${searchFilter.from}–${searchFilter.to}`)
        : t('label.printQueue.labNoFilter', `Lab No: ${searchFilter.from}`);

  const showNotification = useCallback((kind, title) => setNotification({ kind, title }), []);

  // FR-4-007: no preliminary-print confirmation — the Completeness tag is the signal.
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

        {/* FR-1-008a: page-level guidance — status legend with the actual Tags */}
        <InlineNotification
          kind="info"
          lowContrast
          hideCloseButton
          title={t('message.printQueue.pageGuidanceTitle', 'Validated reports land here automatically.')}
          subtitle={
            <Stack orientation="horizontal" gap={4} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <span><Tag type="purple" size="sm">{t('label.printQueue.statusUnprinted', 'Unprinted')}</Tag> {t('message.printQueue.guideUnprinted', 'validated, not yet printed')}</span>
              <span><Tag type="green" size="sm">{t('label.printQueue.statusPrinted', 'Printed')}</Tag> {t('message.printQueue.guidePrinted', 'PDF generated and the release recorded')}</span>
              <span><Tag type="blue" size="sm">{t('label.printQueue.statusAmended', 'Amended')}</Tag> {t('message.printQueue.guideAmended', 'new results validated after printing — reprint needed')}</span>
              <span><Tag type="blue" size="sm">{t('label.printQueue.genGenerating', 'Generating')}</Tag>/<Tag type="red" size="sm">{t('label.printQueue.genFailed', 'Failed')}</Tag> {t('message.printQueue.guideGenerating', 'requested report still being built')}</span>
            </Stack>
          }
        />

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
              <Column lg={2} md={4} sm={4}>
                <Select
                  id="filter-report-type"
                  labelText={t('label.printQueue.reportType', 'Report Type')}
                  value={reportType}
                  disabled={searchActive}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <SelectItem value="ALL" text={t('placeholder.printQueue.allReportTypes', 'All Report Types')} />
                  {REPORT_TYPES.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id} text={rt.label} />
                  ))}
                </Select>
              </Column>

              {/* FR-2-001a: server-side typeahead — wire onInputChange to the Add Order
                  referring-site autosuggest endpoint (≥2 chars, debounced, ≤25 results) */}
              <Column lg={3} md={4} sm={4}>
                <FilterableMultiSelect
                  id="filter-facility"
                  titleText={t('label.printQueue.facility', 'Facility')}
                  placeholder={t('placeholder.printQueue.facilitySearch', 'Search facilities...')}
                  helperText={t('helper.printQueue.typeToSearch', 'Type 2+ characters to search')}
                  items={FACILITIES}
                  selectedItems={selectedFacilities}
                  disabled={searchActive}
                  onChange={handleFacilitiesChange}
                />
              </Column>

              <Column lg={3} md={4} sm={4}>
                <FilterableMultiSelect
                  id="filter-ward"
                  titleText={t('label.printQueue.ward', 'Ward / Dept / Unit')}
                  placeholder={t('placeholder.printQueue.wardSearch', 'Search wards...')}
                  helperText={
                    !searchActive && selectedFacilities.length === 0
                      ? t('helper.printQueue.selectFacilityFirst', 'Select a facility first')
                      : undefined
                  }
                  items={availableWards}
                  selectedItems={selectedWards}
                  disabled={searchActive || selectedFacilities.length === 0}
                  onChange={({ selectedItems }) => setSelectedWards(selectedItems)}
                />
              </Column>

              {/* Wire onInputChange to the Add Order provider/requester autosuggest endpoint */}
              <Column lg={3} md={4} sm={4}>
                <FilterableMultiSelect
                  id="filter-requestor"
                  titleText={t('label.printQueue.requestor', 'Requestor')}
                  placeholder={t('placeholder.printQueue.requestorSearch', 'Search requestors...')}
                  helperText={t('helper.printQueue.typeToSearch', 'Type 2+ characters to search')}
                  items={REQUESTORS}
                  selectedItems={selectedRequestors}
                  disabled={searchActive}
                  onChange={({ selectedItems }) => setSelectedRequestors(selectedItems)}
                />
              </Column>

              {/* FR-2-003: first-class Lab No lookup — Enter (barcode terminator) applies */}
              <Column lg={3} md={4} sm={4}>
                <Stack orientation="horizontal" gap={2} style={{ alignItems: 'flex-end' }}>
                  <CustomLabNumberInput
                    id="filter-lab-no"
                    labelText={t('label.printQueue.labNo', 'Lab No')}
                    placeholder={t('placeholder.printQueue.scanLabNo', 'Scan or type lab number')}
                    helperText={t('helper.printQueue.scanHint', 'Scanning a barcode applies the filter instantly')}
                    value={labFrom}
                    onChange={(e, raw) => setLabFrom(raw)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLabNoSearch(); }}
                  />
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={rangeOpen ? ChevronUp : ChevronDown}
                    onClick={() => setRangeOpen((o) => !o)}
                  >
                    {t('button.printQueue.labNoRange', 'Range')}
                  </Button>
                </Stack>
              </Column>

              {rangeOpen && (
                <Column lg={2} md={4} sm={4}>
                  <CustomLabNumberInput
                    id="filter-lab-to"
                    labelText={t('label.printQueue.labNoTo', 'To Lab Number (optional)')}
                    value={labTo}
                    invalid={!!labTo && !!labFrom && labFrom > labTo}
                    invalidText={t('error.printQueue.invalidLabRange', '"From" lab number must not be greater than "To".')}
                    onChange={(e, raw) => setLabTo(raw)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLabNoSearch(); }}
                  />
                </Column>
              )}

              <Column lg={2} md={4} sm={4}>
                <Select
                  id="filter-status"
                  labelText={t('label.printQueue.statusFilter', 'Print Status')}
                  value={selectedStatus}
                  disabled={searchActive}
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
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={panelOpen ? ChevronUp : ChevronDown}
                    aria-expanded={panelOpen}
                    onClick={() => setPanelOpen((o) => !o)}
                  >
                    {t('button.printQueue.searchByPatient', 'Search by Patient')}
                  </Button>
                </Stack>
              </Column>
            </Grid>
          </Section>
        </Layer>

        {/* FR-2-005c: active targeted-search strip — dismissible Tag + explicit Clear */}
        {searchActive && (
          <InlineNotification
            kind="info"
            lowContrast
            hideCloseButton
            title={searchChipLabel}
            subtitle={t('helper.printQueue.filtersDisabled', 'Filters are disabled while a targeted search is active — searching all time.')}
            actionButtonLabel={t('button.printQueue.clearSearch', 'Clear search')}
            onActionButtonClick={clearTargetedSearch}
          />
        )}

        {/* FR-2-004: inline patient search panel — no Modal; reused component, local-only */}
        {panelOpen && (
          <Layer>
            <Section style={{ borderTop: '2px solid var(--cds-interactive)' }}>
              <Stack gap={4}>
                <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Heading style={{ fontSize: '0.875rem' }}>
                    {t('heading.printQueue.patientSearchPanel', 'Search by Patient')}
                  </Heading>
                  <Button kind="ghost" size="sm" renderIcon={Close} hasIconOnly
                    iconDescription={t('button.close', 'Close')}
                    onClick={() => setPanelOpen(false)} />
                </Stack>
                <SearchPatientForm
                  getSelectedPatient={handlePatientSelected}
                  suppressExternalSearch
                  hideClientRegistry
                />
              </Stack>
            </Section>
          </Layer>
        )}

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
                onClick={() => handlePrint(selectedRows.map((r) => r.id))}
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
                  <TableToolbarContent />
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

                            // Completeness (FR-1-007)
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
                                    {data.generationStatus === 'GENERATING' ? (
                                      <InlineLoading description={gen.label} status="active" />
                                    ) : !(data.testsTotal > 0 && isReady) ? (
                                      <Tag type={gen.type} size="sm">{gen.label}</Tag>
                                    ) : null}
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
                                      onClick={() => handlePrint([row.id])}
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
      </Stack>
    </Layer>
  );
}
