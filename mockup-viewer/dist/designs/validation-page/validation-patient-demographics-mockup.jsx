import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TableSelectRow, TableSelectAll, TableBatchActions, TableBatchAction,
  Button, Tag, Tile, Breadcrumb, BreadcrumbItem,
  Checkbox, InlineNotification, Tabs, Tab, TabList, TabPanels, TabPanel,
} from '@carbon/react';
import { Checkmark, Close, Save } from '@carbon/icons-react';

// ─── i18n helper ───
const t = (key, fallback) => fallback || key;

// ─── Age calculation utility ───
const calculateAge = (dob, collectionDate) => {
  if (!dob || !collectionDate) return null;
  const birth = new Date(dob);
  const collection = new Date(collectionDate);
  if (birth > collection) return null;

  let years = collection.getFullYear() - birth.getFullYear();
  let months = collection.getMonth() - birth.getMonth();
  let days = collection.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(collection.getFullYear(), collection.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${days}D-${months}M-${years}Y`;
};

// ─── Sample data ───
const sampleResults = [
  {
    id: '1',
    accessionNumber: 'ACC-2026-001847',
    patientName: 'Rakoto, Jean',
    patientId: 'PID-00482',
    patientSex: 'M',
    patientDob: '2001-06-15',
    collectionDate: '2026-03-07',
    testName: 'Hemoglobin',
    result: '14.2',
    unit: 'g/dL',
    normalRange: '13.0–17.0',
    status: 'pending',
  },
  {
    id: '2',
    accessionNumber: 'ACC-2026-001847',
    patientName: 'Rakoto, Jean',
    patientId: 'PID-00482',
    patientSex: 'M',
    patientDob: '2001-06-15',
    collectionDate: '2026-03-07',
    testName: 'Creatinine',
    result: '1.3',
    unit: 'mg/dL',
    normalRange: '0.7–1.3',
    status: 'pending',
  },
  {
    id: '3',
    accessionNumber: 'ACC-2026-001848',
    patientName: 'Razafy, Marie',
    patientId: 'PID-00917',
    patientSex: 'F',
    patientDob: '2025-12-01',
    collectionDate: '2026-03-08',
    testName: 'Bilirubin (Total)',
    result: '5.8',
    unit: 'mg/dL',
    normalRange: '0.1–1.2',
    status: 'pending',
  },
  {
    id: '4',
    accessionNumber: 'ACC-2026-001848',
    patientName: 'Razafy, Marie',
    patientId: 'PID-00917',
    patientSex: 'F',
    patientDob: '2025-12-01',
    collectionDate: '2026-03-08',
    testName: 'WBC',
    result: '12.4',
    unit: '×10³/µL',
    normalRange: '5.0–19.5',
    status: 'pending',
  },
  {
    id: '5',
    accessionNumber: 'ACC-2026-001849',
    patientName: 'Andrianaivo, Hery',
    patientId: 'PID-01203',
    patientSex: null,
    patientDob: null,
    collectionDate: '2026-03-08',
    testName: 'Glucose (Fasting)',
    result: '98',
    unit: 'mg/dL',
    normalRange: '70–100',
    status: 'pending',
  },
];

// ─── Enrich data with computed age ───
const enrichedResults = sampleResults.map((r) => {
  const age = calculateAge(r.patientDob, r.collectionDate);
  return {
    ...r,
    patientAge: age || '\u2014', // em dash for missing
    sexShort: r.patientSex
      ? t(`label.validation.sex.${r.patientSex === 'M' ? 'male' : 'female'}.short`, r.patientSex)
      : t('label.validation.sex.unknown.short', 'U'),
    sexFull: r.patientSex === 'M'
      ? t('label.validation.sex.male', 'Male')
      : r.patientSex === 'F'
        ? t('label.validation.sex.female', 'Female')
        : t('label.validation.sex.unknown', 'Unknown'),
  };
});

// ─── DataTable headers ───
const headers = [
  { key: 'accessionNumber', header: t('label.validation.accessionNumber', 'Accession #') },
  { key: 'patientName', header: t('label.validation.patientName', 'Patient') },
  { key: 'sexShort', header: t('label.validation.patientSex', 'Sex') },
  { key: 'patientAge', header: t('label.validation.patientAge', 'Age (D-M-Y)') },
  { key: 'testName', header: t('label.validation.testName', 'Test') },
  { key: 'result', header: t('label.validation.result', 'Result') },
  { key: 'unit', header: t('label.validation.unit', 'Unit') },
  { key: 'normalRange', header: t('label.validation.normalRange', 'Normal Range') },
  { key: 'status', header: t('label.validation.status', 'Status') },
];

// ─── Patient Info Header Component ───
const PatientInfoHeader = ({ result }) => {
  if (!result) return null;
  return (
    <Tile style={{ marginBottom: '1rem' }}>
      <Grid>
        <Column lg={4} md={2} sm={4}>
          <Stack gap={2}>
            <span style={{ fontSize: '0.75rem', color: '#525252' }}>
              {t('label.validation.patientName', 'Patient')}
            </span>
            <strong>{result.patientName}</strong>
          </Stack>
        </Column>
        <Column lg={3} md={2} sm={2}>
          <Stack gap={2}>
            <span style={{ fontSize: '0.75rem', color: '#525252' }}>
              {t('label.validation.patientId', 'Patient ID')}
            </span>
            <strong>{result.patientId}</strong>
          </Stack>
        </Column>
        <Column lg={2} md={2} sm={2}>
          <Stack gap={2}>
            <span style={{ fontSize: '0.75rem', color: '#525252' }}>
              {t('label.validation.patientSex', 'Sex')}
            </span>
            <Tag kind="blue" size="sm">{result.sexFull}</Tag>
          </Stack>
        </Column>
        <Column lg={3} md={2} sm={2}>
          <Stack gap={2}>
            <span style={{ fontSize: '0.75rem', color: '#525252' }}>
              {t('label.validation.patientAge', 'Age (D-M-Y)')}
            </span>
            <strong>
              {result.patientDob
                ? calculateAge(result.patientDob, result.collectionDate) || t('label.validation.age.unknown', 'Unknown')
                : t('label.validation.age.unknown', 'Unknown')}
            </strong>
          </Stack>
        </Column>
        <Column lg={4} md={2} sm={2}>
          <Stack gap={2}>
            <span style={{ fontSize: '0.75rem', color: '#525252' }}>
              {t('label.validation.collectionDate', 'Collection Date')}
            </span>
            <strong>{result.collectionDate}</strong>
          </Stack>
        </Column>
      </Grid>
    </Tile>
  );
};

// ─── Status Tag mapping ───
const StatusTag = ({ status }) => {
  const map = {
    pending: { kind: 'purple', label: t('label.validation.status.pending', 'Pending') },
    accepted: { kind: 'green', label: t('label.validation.status.accepted', 'Accepted') },
    rejected: { kind: 'red', label: t('label.validation.status.rejected', 'Rejected') },
  };
  const s = map[status] || map.pending;
  return <Tag kind={s.kind} size="sm">{s.label}</Tag>;
};

// ─── Main Validation Screen ───
const ValidationPatientDemographicsMockup = () => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return enrichedResults;
    const lower = searchTerm.toLowerCase();
    return enrichedResults.filter(
      (r) =>
        r.accessionNumber.toLowerCase().includes(lower) ||
        r.patientName.toLowerCase().includes(lower) ||
        r.testName.toLowerCase().includes(lower)
    );
  }, [searchTerm]);

  // Show header for first result (or selected patient)
  const headerResult = filteredResults[0] || null;

  const handleValidate = () => {
    setNotification({
      kind: 'success',
      title: t('message.validation.accepted', 'Results validated successfully.'),
    });
    setSelectedRows([]);
  };

  const handleReject = () => {
    setNotification({
      kind: 'error',
      title: t('message.validation.rejected', 'Results rejected.'),
    });
    setSelectedRows([]);
  };

  return (
    <Grid>
      <Column lg={16} md={8} sm={4}>
        <Stack gap={5}>
          {/* ── Breadcrumb ── */}
          <Breadcrumb>
            <BreadcrumbItem href="#">{t('nav.home', 'Home')}</BreadcrumbItem>
            <BreadcrumbItem href="#">{t('nav.validation', 'Validation')}</BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              {t('nav.validation.routine', 'Routine Results')}
            </BreadcrumbItem>
          </Breadcrumb>

          {/* ── Page Title ── */}
          <h2>{t('heading.validation.routine', 'Routine Validation')}</h2>

          {/* ── Notification ── */}
          {notification && (
            <InlineNotification
              kind={notification.kind}
              title={notification.title}
              onCloseButtonClick={() => setNotification(null)}
            />
          )}

          {/* ── Patient Info Header ── */}
          <PatientInfoHeader result={headerResult} />

          {/* ── Results DataTable ── */}
          <DataTable
            rows={filteredResults}
            headers={headers}
            isSortable
            render={({
              rows,
              headers: hdrs,
              getTableProps,
              getHeaderProps,
              getRowProps,
              getSelectionProps,
              getBatchActionProps,
              selectedRows: batchSelected,
            }) => (
              <TableContainer
                title={t('heading.validation.results', 'Results Pending Validation')}
                description={t(
                  'label.validation.resultsDescription',
                  'Review results and verify reference ranges against patient sex and age.'
                )}
              >
                <TableToolbar>
                  <TableBatchActions {...getBatchActionProps()}>
                    <TableBatchAction
                      tabIndex={batchSelected.length === 0 ? -1 : 0}
                      renderIcon={Checkmark}
                      onClick={handleValidate}
                    >
                      {t('button.validation.accept', 'Accept')}
                    </TableBatchAction>
                    <TableBatchAction
                      tabIndex={batchSelected.length === 0 ? -1 : 0}
                      renderIcon={Close}
                      kind="danger"
                      onClick={handleReject}
                    >
                      {t('button.validation.reject', 'Reject')}
                    </TableBatchAction>
                  </TableBatchActions>
                  <TableToolbarContent>
                    <TableToolbarSearch
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t(
                        'placeholder.validation.search',
                        'Search by accession, patient, or test...'
                      )}
                    />
                  </TableToolbarContent>
                </TableToolbar>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      <TableSelectAll {...getSelectionProps()} />
                      {hdrs.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        <TableSelectRow {...getSelectionProps({ row })} />
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'status' ? (
                              <StatusTag status={cell.value} />
                            ) : cell.info.header === 'sexShort' ? (
                              <strong>{cell.value}</strong>
                            ) : cell.info.header === 'patientAge' ? (
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {cell.value}
                              </span>
                            ) : (
                              cell.value
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          />

          {/* ── Validation Action Buttons ── */}
          <Stack orientation="horizontal" gap={4}>
            <Button kind="primary" renderIcon={Checkmark} onClick={handleValidate}>
              {t('button.validation.acceptSelected', 'Accept Selected')}
            </Button>
            <Button kind="danger" renderIcon={Close} onClick={handleReject}>
              {t('button.validation.rejectSelected', 'Reject Selected')}
            </Button>
            <Button kind="secondary" renderIcon={Save}>
              {t('button.validation.save', 'Save')}
            </Button>
          </Stack>
        </Stack>
      </Column>
    </Grid>
  );
};

export default ValidationPatientDemographicsMockup;
