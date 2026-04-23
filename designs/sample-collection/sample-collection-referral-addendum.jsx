import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent,
  TextInput, TextArea, ComboBox, DatePicker, DatePickerInput, Checkbox,
  Button, OverflowMenu, OverflowMenuItem,
  InlineNotification, Tag, Modal, Tile,
  ProgressIndicator, ProgressStep,
  Breadcrumb, BreadcrumbItem,
} from '@carbon/react';
import { Renew, ArrowRight, CheckmarkFilled, WarningAlt, Close } from '@carbon/icons-react';

// i18n helper — real impl wires to localization provider
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const REFERRING_LABS = [
  { id: 'lab-01', text: 'Balai Besar Teknik Kesehatan Lingkungan (BBTKL) Jakarta', fhirEnabled: true },
  { id: 'lab-02', text: 'Laboratorium Kesehatan Daerah — Yogyakarta', fhirEnabled: true },
  { id: 'lab-03', text: 'Eijkman Institute — Molecular Reference Lab', fhirEnabled: false },
  { id: 'lab-04', text: 'National Reference Laboratory — Antananarivo', fhirEnabled: true },
];

const INITIAL_ROWS = [
  { id: 'r1', sampleId: 'S.2026-00412.1', sampleType: 'Whole Blood EDTA', labNumber: '2026-00412', storage: 'Fridge A / Shelf 2 / Pos 14', test: 'HIV Viral Load (PCR)', referralState: 'inhouse' },
  { id: 'r2', sampleId: 'S.2026-00412.1', sampleType: 'Whole Blood EDTA', labNumber: '2026-00412', storage: 'Fridge A / Shelf 2 / Pos 14', test: 'HIV Drug Resistance Genotyping', referralState: 'inhouse' },
  { id: 'r3', sampleId: 'S.2026-00412.2', sampleType: 'Plasma', labNumber: '2026-00412', storage: 'Freezer B / Rack 1 / Pos 3', test: 'Hepatitis B DNA Quantitative', referralState: 'inhouse' },
  { id: 'r4', sampleId: 'S.2026-00412.2', sampleType: 'Plasma', labNumber: '2026-00412', storage: 'Freezer B / Rack 1 / Pos 3', test: 'Hepatitis C RNA Quantitative', referralState: 'inhouse' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function statusTag(state, labName, onRetry) {
  if (state === 'inhouse') return <Tag type="gray">{t('label.sampleCollection.referOut.inhouse', 'In-house')}</Tag>;
  if (state === 'referred') return <Tag type="purple">{t('label.sampleCollection.referOut.referredTo', 'Referred — ') + labName}</Tag>;
  if (state === 'sent') return <Tag type="blue">{t('label.sampleCollection.referOut.awaitingExternal', 'Awaiting External Results')}</Tag>;
  if (state === 'failed') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <Tag type="red">{t('label.sampleCollection.referOut.sendFailed', 'Send Failed — Retry')}</Tag>
        <Button kind="ghost" size="sm" renderIcon={Renew} onClick={onRetry}>
          {t('label.sampleCollection.referOut.action.retry', 'Retry Send')}
        </Button>
      </span>
    );
  }
  return null;
}

function deriveOrderStatus(rows) {
  const active = rows.filter(r => !r.voided);
  const referredCount = active.filter(r => r.referralState !== 'inhouse').length;
  const total = active.length;
  if (total === 0) return 'LABELING';
  if (referredCount === total) return 'REFERRED_OUT';
  return 'LABELING';
}

function headerStatusBadge(orderStatus, rows) {
  if (orderStatus === 'REFERRED_OUT') {
    return <Tag type="purple" size="md">{t('label.sampleCollection.referOut.status.fullyReferred', 'Referred Out')}</Tag>;
  }
  const referredCount = rows.filter(r => r.referralState !== 'inhouse').length;
  const total = rows.length;
  if (referredCount > 0) {
    return (
      <Tag type="purple" size="md">
        {t('label.sampleCollection.referOut.contextCard.referredPartial',
           `Referred (${referredCount} of ${total})`)}
      </Tag>
    );
  }
  return <Tag type="blue" size="md">Labeling</Tag>;
}

// ---------------------------------------------------------------------------
// Per-row referral form (inline expansion)
// ---------------------------------------------------------------------------
function InlineReferForm({ row, onSave, onCancel, xoaEnabled }) {
  const [referringLabId, setReferringLabId] = useState(null);
  const [reason, setReason] = useState('');
  const [expectedReturn, setExpectedReturn] = useState(null);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [error, setError] = useState(null);

  const save = () => {
    if (!referringLabId) {
      setError(t('error.referOut.noReferringLab', 'Select a referring lab before saving.'));
      return;
    }
    const lab = REFERRING_LABS.find(l => l.id === referringLabId);
    onSave({ rowId: row.id, lab, reason, expectedReturn, notifyCustomer });
  };

  return (
    <Tile style={{ padding: '1rem', backgroundColor: 'var(--cds-layer-02)' }}>
      <Stack gap={5}>
        <h5 style={{ margin: 0 }}>
          {t('label.sampleCollection.referOut.action.refer', 'Refer Out')} — {row.test}
        </h5>
        {error && (
          <InlineNotification
            kind="error"
            lowContrast
            title={error}
            hideCloseButton
          />
        )}
        <Grid narrow>
          <Column sm={4} md={4} lg={8}>
            <ComboBox
              id={`referring-lab-${row.id}`}
              titleText={t('label.sampleCollection.referOut.form.referringLab', 'Referring Lab') + ' *'}
              placeholder="Search referring labs…"
              items={REFERRING_LABS}
              itemToString={(item) => (item ? item.text : '')}
              selectedItem={REFERRING_LABS.find(l => l.id === referringLabId) || null}
              onChange={({ selectedItem }) => setReferringLabId(selectedItem ? selectedItem.id : null)}
            />
          </Column>
          <Column sm={4} md={4} lg={4}>
            <DatePicker datePickerType="single" onChange={(d) => setExpectedReturn(d[0])}>
              <DatePickerInput
                id={`expected-return-${row.id}`}
                labelText={t('label.sampleCollection.referOut.form.expectedReturn', 'Expected Return Date')}
                placeholder="mm/dd/yyyy"
              />
            </DatePicker>
          </Column>
          <Column sm={4} md={8} lg={8}>
            <TextArea
              id={`reason-${row.id}`}
              labelText={t('label.sampleCollection.referOut.form.reason', 'Reason (optional)')}
              rows={2}
              maxCount={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Column>
          {xoaEnabled && (
            <Column sm={4} md={8} lg={8}>
              <Checkbox
                id={`notify-${row.id}`}
                labelText={t('label.sampleCollection.referOut.form.notifyCustomer', 'Notify customer of referral')}
                checked={notifyCustomer}
                onChange={(_, { checked }) => setNotifyCustomer(checked)}
              />
            </Column>
          )}
        </Grid>
        <Stack orientation="horizontal" gap={3}>
          <Button kind="primary" size="sm" onClick={save}>
            {t('button.save', 'Save Referral')}
          </Button>
          <Button kind="ghost" size="sm" onClick={onCancel}>
            {t('button.cancel', 'Cancel')}
          </Button>
        </Stack>
      </Stack>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Bulk Refer Out modal
// ---------------------------------------------------------------------------
function BulkReferModal({ open, onClose, onConfirm, pendingRows, xoaEnabled }) {
  const [referringLabId, setReferringLabId] = useState(null);
  const [reason, setReason] = useState('');
  const [expectedReturn, setExpectedReturn] = useState(null);
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const sampleCount = useMemo(() => new Set(pendingRows.map(r => r.sampleId)).size, [pendingRows]);
  const testCount = pendingRows.length;
  const lab = REFERRING_LABS.find(l => l.id === referringLabId);

  const reset = () => {
    setReferringLabId(null);
    setReason('');
    setExpectedReturn(null);
    setNotifyCustomer(true);
  };

  const handleConfirm = () => {
    if (!referringLabId) return;
    onConfirm({ lab, reason, expectedReturn, notifyCustomer });
    reset();
  };

  return (
    <Modal
      open={open}
      onRequestClose={() => { reset(); onClose(); }}
      modalHeading={t('label.sampleCollection.referOut.bulk.modalTitle', 'Refer All Tests to External Lab')}
      primaryButtonText={t('button.confirmReferral', 'Refer All')}
      secondaryButtonText={t('button.cancel', 'Cancel')}
      onRequestSubmit={handleConfirm}
      primaryButtonDisabled={!referringLabId || testCount === 0}
      size="md"
    >
      {testCount === 0 ? (
        <InlineNotification
          kind="info"
          lowContrast
          title={t('error.referOut.bulkNoTests',
            'No in-house tests to refer. All tests on this order are already referred.')}
          hideCloseButton
        />
      ) : (
        <Stack gap={5}>
          <ComboBox
            id="bulk-referring-lab"
            titleText={t('label.sampleCollection.referOut.form.referringLab', 'Referring Lab') + ' *'}
            placeholder="Search referring labs…"
            items={REFERRING_LABS}
            itemToString={(item) => (item ? item.text : '')}
            selectedItem={lab || null}
            onChange={({ selectedItem }) => setReferringLabId(selectedItem ? selectedItem.id : null)}
          />
          <DatePicker datePickerType="single" onChange={(d) => setExpectedReturn(d[0])}>
            <DatePickerInput
              id="bulk-expected-return"
              labelText={t('label.sampleCollection.referOut.form.expectedReturn', 'Expected Return Date')}
              placeholder="mm/dd/yyyy"
            />
          </DatePicker>
          <TextArea
            id="bulk-reason"
            labelText={t('label.sampleCollection.referOut.form.reason', 'Reason (optional)')}
            rows={3}
            maxCount={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {xoaEnabled && (
            <Checkbox
              id="bulk-notify"
              labelText={t('label.sampleCollection.referOut.form.notifyCustomer', 'Notify customer of referral')}
              checked={notifyCustomer}
              onChange={(_, { checked }) => setNotifyCustomer(checked)}
            />
          )}
          <InlineNotification
            kind="warning"
            lowContrast
            title={t('label.sampleCollection.referOut.bulk.preview',
              `This will refer ${testCount} test${testCount === 1 ? '' : 's'} on ${sampleCount} sample${sampleCount === 1 ? '' : 's'}${lab ? ` to ${lab.text}` : ''}.`)}
            subtitle={lab && !lab.fhirEnabled
              ? 'This lab is paper/manifest only — no FHIR transmission will occur.'
              : lab
              ? 'FHIR ServiceRequest will be transmitted to the receiving lab.'
              : 'Select a referring lab to see transmission details.'}
            hideCloseButton
          />
        </Stack>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Step 3 — Label & Store with Refer Out
// ---------------------------------------------------------------------------
export default function LabelStoreWithReferOut() {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // In real app this comes from lab-unit config + global X-01 trigger state
  const xoaEnabled = true;
  const allowBulkReferOut = true;

  const orderStatus = useMemo(() => deriveOrderStatus(rows), [rows]);
  const pendingInhouseRows = useMemo(() => rows.filter(r => r.referralState === 'inhouse'), [rows]);

  const toggleExpand = (rowId) => setExpandedRowId(prev => prev === rowId ? null : rowId);

  const savePerRowReferral = useCallback(({ rowId, lab, reason, expectedReturn, notifyCustomer }) => {
    setRows(prev => prev.map(r =>
      r.id === rowId
        ? { ...r, referralState: 'referred', referringLab: lab.text, fhirEnabled: lab.fhirEnabled,
            reason, expectedReturn, notifyCustomer }
        : r
    ));
    setExpandedRowId(null);
    setNotification({ kind: 'success',
      title: t('label.sampleCollection.referOut.notification.success', `Referred 1 test to ${lab.text}.`) });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const confirmBulk = useCallback(({ lab, reason, expectedReturn, notifyCustomer }) => {
    const pendingIds = rows.filter(r => r.referralState === 'inhouse').map(r => r.id);
    setRows(prev => prev.map(r =>
      pendingIds.includes(r.id)
        ? { ...r, referralState: 'referred', referringLab: lab.text, fhirEnabled: lab.fhirEnabled,
            reason, expectedReturn, notifyCustomer }
        : r
    ));
    setBulkOpen(false);
    setNotification({ kind: 'success',
      title: t('label.sampleCollection.referOut.notification.success',
        `Referred ${pendingIds.length} tests to ${lab.text}.`) });
    setTimeout(() => setNotification(null), 5000);
  }, [rows]);

  const undoReferral = (rowId) => {
    setRows(prev => prev.map(r => r.id === rowId ? {
      ...r, referralState: 'inhouse', referringLab: null, fhirEnabled: null,
      reason: null, expectedReturn: null, notifyCustomer: null
    } : r));
    setNotification({ kind: 'info', title: 'Referral undone. Test returned to in-house queue.' });
    setTimeout(() => setNotification(null), 4000);
  };

  const retryFhirSend = (rowId) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, referralState: 'sent' } : r));
  };

  const headers = [
    { key: 'sampleId', header: 'Sample' },
    { key: 'sampleType', header: 'Type' },
    { key: 'storage', header: 'Storage' },
    { key: 'test', header: 'Test' },
    { key: 'referOut', header: 'Refer Out' },
    { key: 'actions', header: '' },
  ];

  return (
    <div style={{ padding: 'var(--cds-spacing-06)', maxWidth: '1440px', margin: '0 auto' }}>
      <Stack gap={6}>
        {/* Breadcrumb */}
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#">Add Order</BreadcrumbItem>
          <BreadcrumbItem href="#">Order 2026-00412</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Label & Store</BreadcrumbItem>
        </Breadcrumb>

        {/* Progress stepper */}
        <ProgressIndicator currentIndex={2}>
          <ProgressStep complete label="Enter Order" />
          <ProgressStep complete label="Collect Sample" />
          <ProgressStep current label="Label & Store" />
          <ProgressStep label={orderStatus === 'REFERRED_OUT' ? 'QA Review (skipped — fully referred)' : 'QA Review'}
            disabled={orderStatus === 'REFERRED_OUT'} />
        </ProgressIndicator>

        {/* Order Context Card */}
        <Tile style={{ padding: 'var(--cds-spacing-05)' }}>
          <Grid narrow>
            <Column sm={4} md={2} lg={3}>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Lab Number</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>2026-00412</div>
            </Column>
            <Column sm={4} md={3} lg={4}>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Patient</div>
              <div style={{ fontWeight: 500 }}>Ibu Sari Wulandari</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>F · 34 · NIK 3174012345678901</div>
            </Column>
            <Column sm={4} md={2} lg={3}>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Tests</div>
              <div>{rows.length} tests on {new Set(rows.map(r => r.sampleId)).size} samples</div>
            </Column>
            <Column sm={4} md={3} lg={6}>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Status</div>
              <Stack orientation="horizontal" gap={2} style={{ marginTop: '0.25rem' }}>
                {headerStatusBadge(orderStatus, rows)}
              </Stack>
            </Column>
          </Grid>
        </Tile>

        {notification && (
          <InlineNotification
            kind={notification.kind}
            lowContrast
            title={notification.title}
            onClose={() => setNotification(null)}
          />
        )}

        {orderStatus === 'REFERRED_OUT' && (
          <InlineNotification
            kind="info"
            lowContrast
            hideCloseButton
            title="Order fully referred out"
            subtitle="All tests on this order are referred to an external lab. Step 4 QA Review is skipped — the order will complete when external results return via referral result entry."
          />
        )}

        {/* Samples & Tests table */}
        <TableContainer
          title="Samples & Tests"
          description="Assign storage location, print labels, and refer individual tests or the whole order to an external lab."
        >
          <TableToolbar>
            <TableToolbarContent>
              <Button kind="secondary"
                renderIcon={ArrowRight}
                disabled={!allowBulkReferOut || pendingInhouseRows.length === 0}
                onClick={() => setBulkOpen(true)}>
                {t('label.sampleCollection.referOut.bulk.button', 'Bulk Refer Out')}
                {pendingInhouseRows.length > 0 && ` (${pendingInhouseRows.length})`}
              </Button>
              <Button kind="primary">Save & Next</Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table>
            <TableHead>
              <TableRow>
                {headers.map(h => <TableHeader key={h.key}>{h.header}</TableHeader>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => {
                const isExpanded = expandedRowId === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <TableRow>
                      <TableCell><code>{row.sampleId}</code></TableCell>
                      <TableCell>{row.sampleType}</TableCell>
                      <TableCell><span style={{ fontSize: '0.75rem' }}>{row.storage}</span></TableCell>
                      <TableCell>{row.test}</TableCell>
                      <TableCell>
                        {statusTag(row.referralState, row.referringLab, () => retryFhirSend(row.id))}
                      </TableCell>
                      <TableCell>
                        <OverflowMenu size="sm" flipped aria-label={`Actions for ${row.test}`}>
                          {row.referralState === 'inhouse' && (
                            <OverflowMenuItem
                              itemText={t('label.sampleCollection.referOut.action.refer', 'Refer Out')}
                              onClick={() => toggleExpand(row.id)}
                            />
                          )}
                          {row.referralState === 'referred' && (
                            <OverflowMenuItem
                              itemText={t('label.sampleCollection.referOut.action.undo', 'Undo Referral')}
                              hasDivider
                              onClick={() => undoReferral(row.id)}
                            />
                          )}
                          <OverflowMenuItem itemText="Edit Storage" />
                          <OverflowMenuItem itemText="Print Label" />
                        </OverflowMenu>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={headers.length} style={{ padding: 0 }}>
                          <InlineReferForm
                            row={row}
                            xoaEnabled={xoaEnabled}
                            onCancel={() => setExpandedRowId(null)}
                            onSave={savePerRowReferral}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <BulkReferModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onConfirm={confirmBulk}
        pendingRows={pendingInhouseRows}
        xoaEnabled={xoaEnabled}
      />
    </div>
  );
}
