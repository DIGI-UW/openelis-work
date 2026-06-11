// Route: /PatientReportPrintQueue
// SideNav: Reports → Patient Report Print Queue
// Revised (r1) after /analyze: Carbon-native layout (no hardcoded colors/spacing),
// combined-PDF batch print, 50-row batch guard, abnormal-flag-driven critical tag.

import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid,
  Column,
  Stack,
  Layer,
  Heading,
  Section,
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
  TableBatchActions,
  TableBatchAction,
  TableSelectRow,
  TableSelectAll,
  Button,
  Tag,
  InlineNotification,
  Pagination,
  ComboBox,
  Select,
  SelectItem,
  Breadcrumb,
  BreadcrumbItem,
  Tooltip,
} from '@carbon/react';
import { Printer, Search } from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// i18n helper — replace with the real translation function in production
// ---------------------------------------------------------------------------
const t = (key, fallback) => fallback || key;

const BATCH_LIMIT = 50;

// ---------------------------------------------------------------------------
// Static reference data (would come from API in production)
// ---------------------------------------------------------------------------
const FACILITIES = [
  'Hôpital Central Antananarivo',
  'Clinique Urbaine Nord',
  'Centre de Santé de Base Analamanga',
];

const WARDS_BY_FACILITY = {
  'Hôpital Central Antananarivo': [
    'Médecine Interne',
    'Pédiatrie',
    'Maternité',
    'Réanimation',
  ],
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

// ---------------------------------------------------------------------------
// Sample queue data (would come from GET /rest/reports/print-queue)
// hasCriticalValue is derived server-side from the result abnormal flag.
// ---------------------------------------------------------------------------
const INITIAL_QUEUE = [
  { id: '1', accessionNumber: 'LAB-2026-00891', patientName: 'Rakoto, Jean', facility: 'Hôpital Central Antananarivo', ward: 'Médecine Interne', requestor: 'Dr. Rabe', validatedAt: '2026-03-18 08:42', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: true },
  { id: '2', accessionNumber: 'LAB-2026-00874', patientName: 'Andriantsoa, Marie', facility: 'Hôpital Central Antananarivo', ward: 'Pédiatrie', requestor: 'Dr. Rasoa', validatedAt: '2026-03-18 07:15', printStatus: 'UNPRINTED', isAmended: true, hasCriticalValue: false },
  { id: '3', accessionNumber: 'LAB-2026-00865', patientName: 'Razafy, Pierre', facility: 'Clinique Urbaine Nord', ward: 'Urgences', requestor: 'Dr. Randria', validatedAt: '2026-03-17 14:30', printStatus: 'PRINTED', isAmended: false, hasCriticalValue: false },
  { id: '4', accessionNumber: 'LAB-2026-00901', patientName: 'Rakotondrabe, Luc', facility: 'Clinique Urbaine Nord', ward: 'Chirurgie', requestor: 'Dr. Rabe', validatedAt: '2026-03-18 09:05', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false },
  { id: '5', accessionNumber: 'LAB-2026-00855', patientName: 'Raharinoro, Sylvie', facility: 'Centre de Santé de Base Analamanga', ward: 'Maternité', requestor: 'Dr. Rakoto', validatedAt: '2026-03-16 08:55', printStatus: 'UNPRINTED', isAmended: false, hasCriticalValue: false },
];

// ---------------------------------------------------------------------------
// Table column definitions
// ---------------------------------------------------------------------------
const TABLE_HEADERS = [
  { key: 'accessionNumber', header: t('label.printQueue.accessionNumber', 'Accession Number') },
  { key: 'patientName', header: t('label.printQueue.patientName', 'Patient Name') },
  { key: 'facility', header: t('label.printQueue.facility', 'Facility') },
  { key: 'ward', header: t('label.printQueue.ward', 'Ward / Dept / Unit') },
  { key: 'requestor', header: t('label.printQueue.requestor', 'Requestor') },
  { key: 'validatedAt', header: t('label.printQueue.validatedAt', 'Validated At') },
  { key: 'status', header: t('label.printQueue.status', 'Status') },
  { key: 'actions', header: '' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PatientReportPrintQueue() {
  // Filter state
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedRequestor, setSelectedRequestor] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [timeWindow, setTimeWindow] = useState('7');

  // UI state
  const [notification, setNotification] = useState(null);
  const [printingIds, setPrintingIds] = useState(new Set());

  // Pagination state (persisted to user preferences via API in production)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Queue data (would come from API)
  const [queueData, setQueueData] = useState(INITIAL_QUEUE);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------
  const availableWards = useMemo(() => {
    if (!selectedFacility) return [];
    return WARDS_BY_FACILITY[selectedFacility] || [];
  }, [selectedFacility]);

  const filteredRows = useMemo(() => {
    return queueData.filter((row) => {
      if (selectedFacility && row.facility !== selectedFacility) return false;
      if (selectedWard && row.ward !== selectedWard) return false;
      if (selectedRequestor && row.requestor !== selectedRequestor) return false;
      if (selectedStatus === 'UNPRINTED' && row.printStatus !== 'UNPRINTED') return false;
      if (selectedStatus === 'PRINTED' && row.printStatus !== 'PRINTED') return false;
      return true;
    });
  }, [queueData, selectedFacility, selectedWard, selectedRequestor, selectedStatus]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleClearFilters = useCallback(() => {
    setSelectedFacility(null);
    setSelectedWard(null);
    setSelectedRequestor(null);
    setSelectedStatus('ALL');
    // Time Window preference intentionally NOT reset (FR-2-004)
  }, []);

  const showNotification = useCallback((kind, title) => {
    setNotification({ kind, title });
  }, []);

  // Single-row print → one PDF in a new tab.
  // Batch print → one combined PDF in a single new tab (FR-4-001); never one tab per row.
  const handlePrint = useCallback(
    async (ids) => {
      if (ids.length === 0) return;
      setPrintingIds(new Set(ids));
      // Simulate POST /rest/reports/print-queue/generate
      await new Promise((r) => setTimeout(r, 1400));
      setPrintingIds(new Set());

      setQueueData((prev) =>
        prev.map((row) =>
          ids.includes(row.id)
            ? { ...row, printStatus: 'PRINTED', isAmended: false }
            : row
        )
      );

      showNotification(
        'success',
        t('message.printQueue.printSuccess', `${ids.length} report(s) generated and marked as printed.`)
      );
    },
    [showNotification]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Layer>
      <Stack gap={5}>
        {/* Breadcrumb */}
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#">{t('nav.reports', 'Reports')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            {t('nav.printQueue.menuItem', 'Patient Report Print Queue')}
          </BreadcrumbItem>
        </Breadcrumb>

        <Heading>{t('heading.printQueue.title', 'Patient Report Print Queue')}</Heading>

        {/* Inline notification */}
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
              <Column lg={4} md={4} sm={4}>
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

              <Column lg={4} md={4} sm={4}>
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

              <Column lg={4} md={4} sm={4}>
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
                  onChange={(e) => setTimeWindow(e.target.value)}
                >
                  {TIME_WINDOW_OPTIONS.map((tw) => (
                    <SelectItem key={tw.id} value={tw.id} text={tw.label} />
                  ))}
                </Select>
              </Column>

              <Column lg={16} md={8} sm={4}>
                <Button kind="ghost" size="sm" onClick={handleClearFilters}>
                  {t('button.printQueue.clearFilters', 'Clear Filters')}
                </Button>
              </Column>
            </Grid>
          </Section>
        </Layer>

        {/* DataTable */}
        <DataTable rows={paginatedRows} headers={TABLE_HEADERS} isSortable>
          {({
            rows,
            headers,
            getHeaderProps,
            getRowProps,
            getSelectionProps,
            getBatchActionProps,
            selectedRows,
            getTableProps,
            getToolbarProps,
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
                title={t('heading.printQueue.queueTable', 'Print Queue')}
                description={t('message.printQueue.tableDescription', 'Accessions with newly validated results awaiting printing.')}
              >
                <TableToolbar {...getToolbarProps()}>
                  <TableBatchActions {...getBatchActionProps()}>
                    {overLimit ? (
                      <Tooltip
                        align="bottom"
                        label={t('error.printQueue.batchLimitExceeded', 'Batch print is limited to 50 accessions. Please reduce your selection.')}
                      >
                        {printSelectedBtn}
                      </Tooltip>
                    ) : (
                      printSelectedBtn
                    )}
                  </TableBatchActions>

                  <TableToolbarContent>
                    <Button kind="ghost" renderIcon={Search} size="sm">
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

                      return (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          <TableSelectRow {...getSelectionProps({ row })} />

                          {row.cells.map((cell) => {
                            if (cell.info.header === 'status') {
                              return (
                                <TableCell key={cell.id}>
                                  <Stack orientation="horizontal" gap={2}>
                                    <Tag type={data.printStatus === 'UNPRINTED' ? 'purple' : 'green'} size="sm">
                                      {data.printStatus === 'UNPRINTED'
                                        ? t('label.printQueue.statusUnprinted', 'Unprinted')
                                        : t('label.printQueue.statusPrinted', 'Printed')}
                                    </Tag>
                                    {data.isAmended && (
                                      <Tag type="blue" size="sm">
                                        {t('label.printQueue.statusAmended', 'Amended')}
                                      </Tag>
                                    )}
                                    {data.hasCriticalValue && (
                                      <Tag type="red" size="sm">
                                        {t('label.printQueue.critical', 'Critical Value')}
                                      </Tag>
                                    )}
                                  </Stack>
                                </TableCell>
                              );
                            }

                            if (cell.info.header === 'actions') {
                              return (
                                <TableCell key={cell.id}>
                                  <Button
                                    kind="primary"
                                    size="sm"
                                    renderIcon={Printer}
                                    disabled={isPrinting}
                                    onClick={() => handlePrint([row.id])}
                                  >
                                    {isPrinting
                                      ? t('button.printQueue.printing', 'Printing...')
                                      : t('button.printQueue.printSingle', 'Print')}
                                  </Button>
                                </TableCell>
                              );
                            }

                            return <TableCell key={cell.id}>{cell.value}</TableCell>;
                          })}
                        </TableRow>
                      );
                    })}

                    {/* Empty state */}
                    {filteredRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={headers.length + 1}>
                          <Stack gap={2} style={{ textAlign: 'center', padding: 'var(--cds-spacing-09) var(--cds-spacing-05)' }}>
                            <strong>{t('message.printQueue.empty', 'No reports in queue')}</strong>
                            <span>
                              {t('message.printQueue.emptySubtext', 'All reports have been printed, or no results have been validated in the selected time window.')}
                            </span>
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

        {/* Pagination */}
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
