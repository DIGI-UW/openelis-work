// Route: /AnalyzerResults?id=<analyzerId>
// SideNav: Results → Analyzer → [analyzer name]
// Breadcrumb: Home / Results / Analyzer / [analyzer name]
//
// Analyzer Results — Lab Unit Access Control
// FRS: analyzer-results-lab-unit-access-frs.md
//
// Access model (FRS §Access):
//   Open an analyzer  → Results rights for ≥1 of the analyzer's assigned lab units (FR-7)
//                       …or the "all lab units" grant (FR-8)
//                       …or the analyzer has no lab units assigned (FR-5 / FR-9, fail-open)
//   See a result row  → Results rights for the lab unit of that row's test (FR-15)
//
// The Analyser Import role is deliberately NOT a gate here (FR-7a) — it belongs to the
// bridge account that instrument software signs in as, not to bench staff.

import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid, Column, Stack,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent,
  TableBatchActions, TableBatchAction, TableSelectRow, TableSelectAll,
  Button, InlineNotification, Tag, Tile,
  Breadcrumb, BreadcrumbItem, Loading,
} from '@carbon/react';
import { Warning, Locked, Checkmark, Close } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

/* ------------------------------------------------------------------ *
 * Access rules — the whole feature in three predicates.
 * Kept pure and exported so the same logic serves the menu (FR-10),
 * the page guard (FR-12) and the Pending Imports inbox (FR-14).
 * ------------------------------------------------------------------ */

/** A user with no Results rights for any lab unit reviews nothing (FR-13a). */
export const hasAnyResultsRights = (user) =>
  user.hasAllLabUnits || user.resultsLabUnits.length > 0;

/** FR-7 / FR-8 / FR-9 — may this user open this analyzer at all? */
export const canOpenAnalyzer = (user, analyzer) => {
  if (!hasAnyResultsRights(user)) return false;
  if (user.hasAllLabUnits) return true;
  if (analyzer.labUnits.length === 0) return true; // unassigned = unrestricted (FR-5)
  return analyzer.labUnits.some((u) => user.resultsLabUnits.includes(u));
};

/** FR-15 — may this user see this result row? Keyed on the row's TEST lab unit. */
export const canSeeResultRow = (user, row) => {
  if (user.hasAllLabUnits) return true;
  if (!row.labUnit) return true; // unmapped test on an unrestricted analyzer
  return user.resultsLabUnits.includes(row.labUnit);
};

/* ------------------------------------------------------------------ *
 * Lab unit chips — names, never a bare count (FR-23, design-addendum)
 * ------------------------------------------------------------------ */
export const LabUnitTags = ({ labUnits }) => {
  if (!labUnits || labUnits.length === 0) {
    return (
      <Tag type="warm-gray">
        {t('analyzerResults.labUnits.unassigned', 'No lab units assigned')}
      </Tag>
    );
  }
  return (
    <>
      {labUnits.map((unit) => (
        <Tag key={unit} type="blue">{unit}</Tag>
      ))}
    </>
  );
};

/* ------------------------------------------------------------------ *
 * FR-10 / FR-13 — the filtered Results → Analyzer menu
 * ------------------------------------------------------------------ */
export const AnalyzerSideNavMenu = ({ user, analyzers, selectedId, onSelect }) => {
  const visible = useMemo(
    () => analyzers.filter((a) => canOpenAnalyzer(user, a)),
    [user, analyzers],
  );

  // FR-13 — nothing to offer: render no analyzer entries at all.
  if (visible.length === 0) return null;

  return (
    <SideNavMenu title={t('common.analyzer', 'Analyzer')} defaultExpanded>
      {visible.map((a) => (
        <SideNavMenuItem
          key={a.id}
          href={`/AnalyzerResults?id=${a.id}`}
          isActive={a.id === selectedId}
          onClick={(e) => { e.preventDefault(); onSelect(a.id); }}
        >
          {a.name}
          {a.pendingCount > 0 && ` · ${a.pendingCount}`}
        </SideNavMenuItem>
      ))}
    </SideNavMenu>
  );
};

/* ------------------------------------------------------------------ *
 * FR-12 — access denied on direct URL. Shows no result data.
 * ------------------------------------------------------------------ */
export const AnalyzerAccessDenied = ({ analyzer, onGoToAccessible }) => (
  <Tile style={{ maxWidth: '40rem', margin: '3rem auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
    <Locked size={32} style={{ marginBottom: '1rem' }} />
    <h3 style={{ fontWeight: 400, marginBottom: '0.75rem' }}>
      {t('analyzerResults.access.deniedTitle', "You don't have access to this analyzer")}
    </h3>
    <p style={{ marginBottom: '1rem' }}>
      {t(
        'analyzerResults.access.deniedBody',
        `${analyzer.name} is assigned to ${analyzer.labUnits.join(', ')}. You need results access to one of those lab units to review its results.`,
      )}
    </p>
    <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
      <LabUnitTags labUnits={analyzer.labUnits} />
    </Stack>
    <Button kind="primary" onClick={onGoToAccessible}>
      {t('analyzerResults.access.deniedAction', 'View analyzers you can access')}
    </Button>
  </Tile>
);

/* ------------------------------------------------------------------ *
 * FR-13 / FR-13a — no analyzers at all for this user
 * ------------------------------------------------------------------ */
export const NoAccessibleAnalyzers = () => (
  <Tile style={{ maxWidth: '40rem', margin: '3rem auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
    <h3 style={{ fontWeight: 400, marginBottom: '0.75rem' }}>
      {t('analyzerResults.access.emptyTitle', 'No analyzers in your lab units')}
    </h3>
    <p>
      {t(
        'analyzerResults.access.emptyBody',
        'No analyzers are assigned to the lab units you have results access to. Ask your administrator to assign this analyzer to your lab unit, or to grant you access.',
      )}
    </p>
  </Tile>
);

/* ------------------------------------------------------------------ *
 * FR-16 — how many rows are hidden and which lab units they belong to.
 * Never names a sample, a test or a value.
 * ------------------------------------------------------------------ */
export const HiddenResultsNotice = ({ hiddenCount, hiddenLabUnits }) => (
  <InlineNotification
    lowContrast
    kind="info"
    hideCloseButton
    style={{ maxWidth: 'none', marginBottom: '1rem' }}
    title={t('analyzerResults.hiddenRows.title', `${hiddenCount} results from other lab units are hidden`)}
    subtitle={t(
      'analyzerResults.hiddenRows.body',
      `These results belong to ${hiddenLabUnits.join(', ')}. A user with results access to those lab units must review them.`,
    )}
  />
);

/* ------------------------------------------------------------------ *
 * FR-5 / FR-6 — an analyzer nobody has scoped yet is open to everyone.
 * Say so, rather than letting "unrestricted" be invisible.
 * ------------------------------------------------------------------ */
export const UnassignedAnalyzerNotice = () => (
  <InlineNotification
    lowContrast
    kind="warning"
    hideCloseButton
    style={{ maxWidth: 'none', marginBottom: '1rem' }}
    title={t('analyzerResults.labUnits.unassigned', 'No lab units assigned')}
    subtitle={t(
      'analyzerResults.labUnits.unassignedHint',
      "Any user with results access can review this analyzer's results until lab units are assigned.",
    )}
  />
);

/* ------------------------------------------------------------------ *
 * The import review table, lab-unit filtered (FR-15 … FR-19, FR-24)
 * ------------------------------------------------------------------ */
const flagTag = (flag) => {
  switch (flag) {
    case 'critical': return <Tag type="red">{t('common.critical', 'Critical')}</Tag>;
    case 'abnormal': return <Tag type="warm-gray">{t('analyzerResults.flag.abnormal', 'Abnormal')}</Tag>;
    case 'error':    return <Tag type="red">{t('common.error', 'Error')}</Tag>;
    default:         return <Tag type="green">{t('common.normal', 'Normal')}</Tag>;
  }
};

export const AnalyzerResultsTable = ({ user, analyzer, rows, onAccept, onReject }) => {
  // FR-15 — the filter. Everything below operates on `visibleRows` only.
  const visibleRows = useMemo(() => rows.filter((r) => canSeeResultRow(user, r)), [user, rows]);
  const hiddenRows = useMemo(() => rows.filter((r) => !canSeeResultRow(user, r)), [user, rows]);
  const hiddenLabUnits = useMemo(
    () => [...new Set(hiddenRows.map((r) => r.labUnit).filter(Boolean))],
    [hiddenRows],
  );

  const headers = [
    { key: 'sampleId', header: t('common.sampleId', 'Sample ID') },
    { key: 'testName', header: t('common.testName', 'Test Name') },
    { key: 'labUnit',  header: t('analyzerResults.labUnit', 'Lab Unit') },
    { key: 'value',    header: t('common.result', 'Result') },
    { key: 'flag',     header: t('common.status', 'Status') },
    { key: 'received', header: t('common.received', 'Received') },
  ];

  // FR-18 — every row hidden is not the same as an empty run.
  if (visibleRows.length === 0 && rows.length > 0) {
    return (
      <Tile style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h4 style={{ fontWeight: 400, marginBottom: '0.5rem' }}>
          {t('analyzerResults.hiddenRows.allHiddenTitle', 'No results for your lab units in this run')}
        </h4>
        <p>
          {t(
            'analyzerResults.hiddenRows.allHiddenBody',
            `This run contains ${rows.length} results, all belonging to lab units you don't have results access to.`,
          )}
        </p>
      </Tile>
    );
  }

  return (
    <>
      {hiddenRows.length > 0 && (
        <HiddenResultsNotice hiddenCount={hiddenRows.length} hiddenLabUnits={hiddenLabUnits} />
      )}

      {/* FR-17 — DataTable is fed visibleRows, so selection, select-all and
          batch counts can only ever address rows the user is entitled to. */}
      <DataTable rows={visibleRows} headers={headers}>
        {({
          rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps,
          getSelectionProps, getBatchActionProps, selectedRows, getTableProps,
        }) => (
          <TableContainer
            title={analyzer.name}
            description={
              <Stack orientation="horizontal" gap={3}>
                <span>{t('analyzerResults.labUnits', 'Lab Units')}:</span>
                <LabUnitTags labUnits={analyzer.labUnits} />
              </Stack>
            }
          >
            <TableToolbar>
              <TableBatchActions {...getBatchActionProps()}>
                <TableBatchAction
                  renderIcon={Checkmark}
                  onClick={() => onAccept(selectedRows.map((r) => r.id))}
                >
                  {t('common.accept', 'Accept')}
                </TableBatchAction>
                <TableBatchAction
                  renderIcon={Close}
                  onClick={() => onReject(selectedRows.map((r) => r.id))}
                >
                  {t('common.reject', 'Reject')}
                </TableBatchAction>
              </TableBatchActions>
              <TableToolbarContent />
            </TableToolbar>

            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  <TableSelectAll {...getSelectionProps()} />
                  {dtHeaders.map((header) => (
                    <TableHeader key={header.key} {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dtRows.map((row) => {
                  const source = visibleRows.find((r) => r.id === row.id);
                  return (
                    <TableRow key={row.id} {...getRowProps({ row })}>
                      <TableSelectRow {...getSelectionProps({ row })} />
                      <TableCell>{source.sampleId}</TableCell>
                      <TableCell>{source.testName}</TableCell>
                      <TableCell><Tag type="blue">{source.labUnit}</Tag></TableCell>
                      <TableCell>{source.value}</TableCell>
                      <TableCell>{flagTag(source.flag)}</TableCell>
                      <TableCell>{source.received}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </>
  );
};

/* ------------------------------------------------------------------ *
 * Page composition — guard first, then render (FR-12, FR-13)
 * ------------------------------------------------------------------ */
const AnalyzerResultsPage = ({ user, analyzers, analyzerId, rows, loading, onSelect, onAccept, onReject }) => {
  const analyzer = analyzers.find((a) => a.id === analyzerId);
  const accessible = useMemo(
    () => analyzers.filter((a) => canOpenAnalyzer(user, a)),
    [user, analyzers],
  );

  const goToAccessible = useCallback(
    () => accessible.length > 0 && onSelect(accessible[0].id),
    [accessible, onSelect],
  );

  if (loading) return <Loading description={t('common.loading', 'Loading...')} withOverlay={false} />;

  return (
    <Grid fullWidth>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('common.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/results">{t('common.results', 'Results')}</BreadcrumbItem>
          <BreadcrumbItem href="/AnalyzerResults">{t('common.analyzer', 'Analyzer')}</BreadcrumbItem>
          {analyzer && <BreadcrumbItem isCurrentPage>{analyzer.name}</BreadcrumbItem>}
        </Breadcrumb>

        {accessible.length === 0 ? (
          <NoAccessibleAnalyzers />
        ) : !analyzer || !canOpenAnalyzer(user, analyzer) ? (
          <AnalyzerAccessDenied analyzer={analyzer} onGoToAccessible={goToAccessible} />
        ) : (
          <Stack gap={5} style={{ marginTop: '1rem' }}>
            {analyzer.labUnits.length === 0 && <UnassignedAnalyzerNotice />}
            <AnalyzerResultsTable
              user={user}
              analyzer={analyzer}
              rows={rows}
              onAccept={onAccept}
              onReject={onReject}
            />
          </Stack>
        )}
      </Column>
    </Grid>
  );
};

export default AnalyzerResultsPage;

/* ------------------------------------------------------------------ *
 * FR-23 — the Analyzers admin list column: names, not "3 unit(s)".
 * Drop-in replacement for the existing `testUnits` cell renderer.
 * ------------------------------------------------------------------ */
export const AnalyzerLabUnitsCell = ({ analyzer }) => (
  <Stack orientation="horizontal" gap={2}>
    <LabUnitTags labUnits={analyzer.labUnits} />
  </Stack>
);
