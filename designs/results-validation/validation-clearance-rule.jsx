// Route: /ResultValidation  (also /AccessionValidation, /AccessionValidationRange, /ResultValidationByTestDate)
// SideNav: Validation → Routine  (unchanged; no items added, removed or reordered)
// Feature: Validation clearance rule and empty-state explanation — OGC-817 / OGC-1029
// FRS: notes/validation-clearance-rule-frs-v0.1.md   Decisions: D-056, D-057
// Version-agnostic: shows the whole feature. Slicing lives in the breakdown guide.

import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell,
  Button, Tag, Modal, InlineNotification, Tile, Toggle,
  Breadcrumb, BreadcrumbItem,
} from '@carbon/react';
import { ChevronDown, ChevronUp } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// FR-1 / FR-3: the clearance predicate. Mirrors the server-side rule for display
// only; the authoritative evaluation is server-side on the rows the queue served
// (FR-5) and lives in one shared module (FR-6).
// ---------------------------------------------------------------------------
const QC_FAIL = 'FAIL';

export const isClear = (row) => {
  const rangeKnown = typeof row.normalRange === 'string' && row.normalRange.trim().length > 0;
  const qcFailed = row.qc && row.qc.verdict === QC_FAIL;
  return (
    rangeKnown &&
    row.flag === 'NORMAL' &&
    !qcFailed &&          // FR-3: a KNOWN failure blocks; absence is not an input
    !row.nceOpen &&
    !row.modified &&
    !row.critical &&
    !row.nonconforming &&
    !row.ackPending
  );
};

// FR-4: a multi-component analysis is clear only when every component row is.
export const allClear = (rows) => Array.isArray(rows) && rows.length > 0 && rows.every(isClear);

const SIGNAL_TAGS = {
  nceOpen:       { key: 'nce',           label: t('label.validation.signal.nce', 'NCE open'),         kind: 'red' },
  qcFail:        { key: 'qcfail',        label: t('label.validation.signal.qcfail', 'QC fail'),       kind: 'red' },
  modified:      { key: 'modified',      label: t('label.validation.signal.modified', 'Modified'),    kind: 'blue' },
  ackPending:    { key: 'ack',           label: t('label.validation.signal.ack', 'Ack pending'),      kind: 'purple' },
  nonconforming: { key: 'nonconforming', label: t('label.validation.signal.nonconforming', 'Nonconforming'), kind: 'warm-gray' },
  critical:      { key: 'critical',      label: t('label.validation.signal.critical', 'Critical'),    kind: 'red' },
};

const FLAG_TAG = {
  NORMAL:   { kind: 'green',     label: t('label.validation.flag.normal', 'Normal') },
  ABNORMAL: { kind: 'warm-gray', label: t('label.validation.flag.abnormal', 'Abnormal') },
  CRITICAL: { kind: 'red',       label: t('label.validation.flag.critical', 'Critical') },
  INVALID:  { kind: 'red',       label: t('label.validation.flag.invalid', 'Invalid') },
};

const signalsOf = (row) =>
  Object.entries(SIGNAL_TAGS)
    .filter(([field]) => (field === 'qcFail' ? row.qc && row.qc.verdict === QC_FAIL : row[field]))
    .map(([, tag]) => tag);

// ---------------------------------------------------------------------------
// FR-13 / FR-14 / FR-15: why the bulk action is unavailable, derived from the
// queue, never configured. Multiple reasons are named separately with counts.
// ---------------------------------------------------------------------------
function ClearLaneExplanation({ rows, clearCount, bulkEnabledForLab }) {
  if (!bulkEnabledForLab) {
    return <p className="oe-why">{t('label.validation.emptyState.bulkDisabled',
      'Bulk release is switched off for this laboratory.')}</p>;
  }
  if (rows.length === 0) {
    return <p className="oe-why">{t('label.validation.emptyState.queueEmpty',
      'Nothing is waiting for validation.')}</p>;
  }
  if (clearCount > 0) return null;

  const noReference = rows.filter(
    (r) => !(typeof r.normalRange === 'string' && r.normalRange.trim().length > 0)).length;
  const judgeable = rows.filter(
    (r) => typeof r.normalRange === 'string' && r.normalRange.trim().length > 0);

  const tally = {};
  judgeable.forEach((r) => {
    signalsOf(r).forEach((s) => { tally[s.label] = (tally[s.label] || 0) + 1; });
    if (r.flag && r.flag !== 'NORMAL') {
      const l = FLAG_TAG[r.flag].label;
      tally[l] = (tally[l] || 0) + 1;
    }
  });
  const dominant = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([label, n]) => `${label} (${n})`);

  return (
    <div>
      {judgeable.length > 0 && (
        <>
          <p className="oe-why">
            {t('label.validation.emptyState.signals',
               `All ${judgeable.length} results in this queue carry something to check before release.`)}
          </p>
          {dominant.length > 0 && (
            <p className="oe-why-hint">
              {t('label.validation.emptyState.signalsDetail', `Most common: ${dominant.join(', ')}.`)}
            </p>
          )}
        </>
      )}
      {noReference > 0 && (
        <>
          <p className="oe-why">
            {t('label.validation.emptyState.noReference',
               `${noReference} results are for tests with no reference value recorded in the test catalogue, so they cannot be judged as normal.`)}
          </p>
          <p className="oe-why-hint">
            {t('label.validation.emptyState.noReferenceHint',
               'Record an expected normal value for these tests in the Test Catalogue to let their results clear.')}
          </p>
        </>
      )}
    </div>
  );
}

// FR-10 / FR-12: renders only when a QC fact exists. No constant placeholder.
function QcVerdictRow({ qc }) {
  if (!qc) return null;
  const kind = qc.verdict === QC_FAIL ? 'red' : 'teal';
  const label = qc.verdict === QC_FAIL
    ? t('label.validation.qc.fail', 'Fail')
    : t('label.validation.qc.pass', 'Pass');
  return (
    <>
      <dt>{t('label.validation.qc.verdict', 'Quality control')}</dt>
      <dd><Tag type={kind}>{label}</Tag> <span className="oe-muted">{qc.source}</span></dd>
    </>
  );
}

// FR-16: the confirm list plus one line naming what clearance did and did not check.
function ReleaseAllClearModal({ open, rows, onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      modalHeading={t('label.validation.releaseAllClear', 'Release all clear') + ` (${rows.length})`}
      primaryButtonText={t('button.validation.signAndRelease', 'Sign and release')}
      secondaryButtonText={t('button.cancel', 'Cancel')}
      onRequestClose={onClose}
      onRequestSubmit={onConfirm}
      size="lg"
    >
      <TableContainer>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>{t('label.validation.labNo', 'Lab no.')}</TableHeader>
              <TableHeader>{t('label.validation.subject', 'Patient')}</TableHeader>
              <TableHeader>{t('label.validation.test', 'Test')}</TableHeader>
              <TableHeader>{t('label.validation.result', 'Result')}</TableHeader>
              <TableHeader>{t('label.validation.range', 'Reference range')}</TableHeader>
              <TableHeader>{t('label.validation.flag', 'Flag')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.accession}-${r.test}`}>
                <TableCell>{r.accession}</TableCell>
                <TableCell>{r.subject}</TableCell>
                <TableCell>{r.test}</TableCell>
                <TableCell>{r.value}</TableCell>
                <TableCell>{r.normalRange}</TableCell>
                <TableCell><Tag type={FLAG_TAG[r.flag].kind}>{FLAG_TAG[r.flag].label}</Tag></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <p className="oe-scope-note">
        {t('label.validation.release.scope',
           'Clearance checks the reference range, result flags, non-conformities, edits after save and critical acknowledgment, and stops any result with a recorded quality-control failure. It does not confirm that quality control was performed.')}
      </p>
    </Modal>
  );
}

export default function ValidationQueue({
  rows = [],
  autoValidatedRows = [],      // FR-8: shown as already released, outside both lanes
  bulkEnabledForLab = true,
  onRelease = () => {},
  onRetest = () => {},
}) {
  const [filter, setFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [includeAutoValidated, setIncludeAutoValidated] = useState(false);
  const [notice, setNotice] = useState(null);

  const toggleRow = useCallback(
    (id) => setExpandedRow((prev) => (prev === id ? null : id)), []);

  const clearRows = useMemo(() => rows.filter(isClear), [rows]);
  const needsReviewRows = useMemo(() => rows.filter((r) => !isClear(r)), [rows]);

  // FR-A3 (inherited): lane counts are computed from the whole queue, not the active filter.
  const counts = useMemo(() => {
    const c = { all: rows.length, needsReview: needsReviewRows.length };
    Object.values(SIGNAL_TAGS).forEach((tag) => {
      c[tag.key] = rows.filter((r) => signalsOf(r).some((s) => s.key === tag.key)).length;
    });
    c.abnormal = rows.filter((r) => r.flag === 'ABNORMAL').length;
    return c;
  }, [rows, needsReviewRows]);

  const visibleRows = useMemo(() => {
    if (filter === 'all') return rows;
    if (filter === 'needsReview') return needsReviewRows;
    if (filter === 'abnormal') return rows.filter((r) => r.flag === 'ABNORMAL');
    return rows.filter((r) => signalsOf(r).some((s) => s.key === filter));
  }, [filter, rows, needsReviewRows]);

  const bulkEnabled = bulkEnabledForLab && clearRows.length > 0;

  const headers = [
    t('label.validation.labNo', 'Lab no.'),
    t('label.validation.subject', 'Patient'),
    t('label.validation.test', 'Test'),
    t('label.validation.result', 'Result'),
    t('label.validation.range', 'Reference range'),
    t('label.validation.flag', 'Flag'),
    t('label.validation.checkBeforeRelease', 'Check before release'),
    t('label.validation.lane', 'Lane'),
  ];

  const handleConfirm = () => {
    setConfirmOpen(false);
    onRelease(clearRows);
    // FR-17: releasing produces visible confirmation, not a silently vanishing row.
    setNotice(t('message.validation.released', `Released ${clearRows.length} results.`));
  };

  return (
    <Grid fullWidth>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('label.breadcrumb.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/validation">{t('label.breadcrumb.validation', 'Validation')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('label.breadcrumb.routine', 'Routine')}</BreadcrumbItem>
        </Breadcrumb>

        {notice && (
          <InlineNotification
            kind="success"
            title={notice}
            onCloseButtonClick={() => setNotice(null)}
            lowContrast
          />
        )}

        {/* Lane summary, explanation and the guarded bulk action */}
        <Tile>
          <Stack orientation="horizontal" gap={7}>
            <div>
              <p className="oe-lane-count">{clearRows.length}</p>
              <p className="oe-lane-label">{t('label.validation.clear', 'Clear')}</p>
            </div>
            <div>
              <p className="oe-lane-count">{needsReviewRows.length}</p>
              <p className="oe-lane-label">{t('label.validation.needsReview', 'Needs review')}</p>
            </div>
            <div style={{ flex: 1 }}>
              <ClearLaneExplanation
                rows={rows}
                clearCount={bulkEnabledForLab ? clearRows.length : 0}
                bulkEnabledForLab={bulkEnabledForLab}
              />
            </div>
            <Button
              kind="primary"
              disabled={!bulkEnabled}
              onClick={() => setConfirmOpen(true)}
            >
              {t('label.validation.releaseAllClear', 'Release all clear')}
              {` (${bulkEnabledForLab ? clearRows.length : 0})`}
            </Button>
          </Stack>
        </Tile>

        {/* Signal filters with live counts */}
        <Stack orientation="horizontal" gap={3} className="oe-filter-row">
          {[['all', t('label.validation.filter.all', 'All')],
            ['needsReview', t('label.validation.needsReview', 'Needs review')],
            ['nce', SIGNAL_TAGS.nceOpen.label],
            ['qcfail', SIGNAL_TAGS.qcFail.label],
            ['modified', SIGNAL_TAGS.modified.label],
            ['ack', SIGNAL_TAGS.ackPending.label],
            ['critical', SIGNAL_TAGS.critical.label],
            ['abnormal', FLAG_TAG.ABNORMAL.label]].map(([key, label]) => (
            <Tag
              key={key}
              type={filter === key ? 'blue' : 'gray'}
              filter={false}
              onClick={() => setFilter(key)}
            >
              {`${label} (${counts[key] || 0})`}
            </Tag>
          ))}
          <Toggle
            id="include-auto-validated"
            size="sm"
            labelText={t('label.validation.includeAutoValidated', 'Include auto-validated')}
            toggled={includeAutoValidated}
            onToggle={setIncludeAutoValidated}
          />
        </Stack>

        <TableContainer title={t('label.validation.queue', 'Results awaiting validation')}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader />
                {headers.map((h) => <TableHeader key={h}>{h}</TableHeader>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={headers.length + 1}>
                    {t('label.validation.emptyState.queueEmpty', 'Nothing is waiting for validation.')}
                  </TableCell>
                </TableRow>
              )}
              {visibleRows.map((row) => {
                const id = `${row.accession}-${row.test}`;
                const cleared = isClear(row);
                const rowSignals = signalsOf(row);
                const hasRange = typeof row.normalRange === 'string' && row.normalRange.trim().length > 0;
                return (
                  <React.Fragment key={id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          iconDescription={t('button.expand', 'Review')}
                          renderIcon={expandedRow === id ? ChevronUp : ChevronDown}
                          onClick={() => toggleRow(id)}
                        />
                      </TableCell>
                      <TableCell>{row.accession}</TableCell>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell>{row.test}</TableCell>
                      <TableCell>{row.value}</TableCell>
                      <TableCell>
                        {hasRange ? row.normalRange
                          : <span className="oe-muted">{t('label.validation.range.none', 'Not recorded')}</span>}
                      </TableCell>
                      <TableCell>
                        {row.flag ? <Tag type={FLAG_TAG[row.flag].kind}>{FLAG_TAG[row.flag].label}</Tag> : null}
                      </TableCell>
                      <TableCell>
                        {rowSignals.map((s) => <Tag key={s.key} type={s.kind}>{s.label}</Tag>)}
                      </TableCell>
                      <TableCell>
                        <Tag type={cleared ? 'green' : 'warm-gray'}>
                          {cleared ? t('label.validation.clear', 'Clear')
                                   : t('label.validation.needsReview', 'Needs review')}
                        </Tag>
                      </TableCell>
                    </TableRow>

                    {expandedRow === id && (
                      <TableRow>
                        <TableCell colSpan={headers.length + 1}>
                          <Tile style={{ padding: '1rem' }}>
                            <dl className="oe-review-summary">
                              <dt>{t('label.validation.result', 'Result')}</dt>
                              <dd>
                                {row.value}{' '}
                                {row.flag && <Tag type={FLAG_TAG[row.flag].kind}>{FLAG_TAG[row.flag].label}</Tag>}
                              </dd>
                              <dt>{t('label.validation.range', 'Reference range')}</dt>
                              <dd>
                                {hasRange ? row.normalRange
                                  : <span className="oe-muted">
                                      {t('label.validation.range.noneForTest',
                                         'Not recorded for this test')}
                                    </span>}
                              </dd>
                              <dt>{t('label.validation.method', 'Method')}</dt>
                              <dd>{row.method}</dd>
                              <dt>{t('label.validation.analyzer', 'Analyzer')}</dt>
                              <dd>{row.analyzer || <span className="oe-muted">
                                {t('label.validation.analyzer.none', 'Not instrument-based')}</span>}</dd>
                              <dt>{t('label.validation.enteredBy', 'Entered by')}</dt>
                              <dd>{row.enteredBy}</dd>
                              {/* FR-10: absent QC renders nothing at all */}
                              <QcVerdictRow qc={row.qc} />
                            </dl>

                            <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                              <Button kind="primary" size="sm"
                                onClick={() => { onRelease([row]);
                                  setNotice(t('message.validation.released', 'Released 1 result.')); }}>
                                {t('button.validation.validateRelease', 'Validate & release')}
                              </Button>
                              <Button kind="tertiary" size="sm"
                                onClick={() => { onRetest([row]);
                                  setNotice(t('message.validation.retestRequested',
                                              'Retest requested for 1 result.')); }}>
                                {t('button.validation.retest', 'Retest')}
                              </Button>
                              <Button kind="danger--tertiary" size="sm">
                                {t('button.validation.reject', 'Reject (file NCE)')}
                              </Button>
                            </Stack>
                          </Tile>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* FR-8: auto-validated rows are already released and sit outside both lanes */}
        {includeAutoValidated && (
          <TableContainer
            title={t('label.validation.autoValidated', 'Auto-validated')}
            description={t('label.validation.autoValidated.description',
              'Already released by automated validation, which applies the same clearance rule. Not counted in either lane.')}
          >
            <Table size="sm">
              <TableHead>
                <TableRow>
                  <TableHeader>{t('label.validation.labNo', 'Lab no.')}</TableHeader>
                  <TableHeader>{t('label.validation.subject', 'Patient')}</TableHeader>
                  <TableHeader>{t('label.validation.test', 'Test')}</TableHeader>
                  <TableHeader>{t('label.validation.result', 'Result')}</TableHeader>
                  <TableHeader>{t('label.validation.status', 'Status')}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {autoValidatedRows.map((r) => (
                  <TableRow key={`${r.accession}-${r.test}`}>
                    <TableCell>{r.accession}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>{r.test}</TableCell>
                    <TableCell>{r.value}</TableCell>
                    <TableCell>
                      <Tag type="green">
                        {t('label.validation.releasedAutomatically', 'Released automatically')}
                      </Tag>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <ReleaseAllClearModal
          open={confirmOpen}
          rows={clearRows}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      </Column>
    </Grid>
  );
}
