// CSV Bulk Sample Intake (Environmental & Vector) — developer handoff mockup
// Route: entry point is a "Bulk import samples" action at the BOTTOM of the existing
//        Add Environmental Order / Add Vector Order → Enter Order page, below the
//        Per-Sample Manifest. It EXPANDS INLINE (Carbon inline-expansion, D-005) — not a modal, not a route.
// SideNav: Menu → Add Environmental Order (and Add Vector Order) → Enter Order
//
// Version-agnostic: shows the full feature. Release split (defined in the FRS, not here):
//   v1 = manifest template + manual column mapping + three-state validate + set-in-bulk + all-or-nothing commit
//   v2 = saved import profiles (persist a mapping)
//   v3 = container storage (box/plate layout, positions, place via shared LocationPicker)
//
// Data reuse (design-addendum MUST A): every field maps to an existing OpenELIS entity.
//   Order-level (set once in the order form, applied to all): Requesting Org, Requestor, Sampling Site,
//   Compliance Standard, Program. Per-sample manifest columns are below. No Sample.location (D-016).

import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell,
  ComboBox, FilterableMultiSelect, TextInput,
  Button, IconButton, Tag, Tile, InlineNotification, FileUploaderDropContainer,
  Breadcrumb, BreadcrumbItem, Toggle,
} from '@carbon/react';
import { Add, TrashCan, Upload, Download, WarningAltFilled, ErrorFilled, CheckmarkFilled } from '@carbon/icons-react';

// i18n helper — every visible string is wrapped (Constitution Principle 1)
const t = (key, fallback) => fallback || key;

// ---- Reference data (read from existing registries at runtime; sampled here) ----
const CATALOG = {
  sampleType: ['Surface Water', 'Drinking Water', 'Groundwater', 'Wastewater'], // hundreds in production → ComboBox, never Select (D-007)
  tests: ['Total Coliforms (TC)', 'E. coli (ECOLI)', 'Turbidity (TURB)', 'pH (PH)', 'Nitrate (NO3)'],
  container: ['500 mL Nalgene', '1 L HDPE bottle', 'Sterile Whirl-Pak', '250 mL amber glass'],
};

// ---- Per-sample manifest columns (mirror the live Enter Order manifest table) ----
// req: gates commit (red). bulk: offers Set-for-all. multi: multi-select. flagBlank: amber when empty.
const COLUMNS = [
  { key: 'clientId', label: t('order.bulkImport.col.clientId', 'Client Sample ID') },
  { key: 'sampleType', label: t('order.bulkImport.col.sampleType', 'Sample Type'), req: true, bulk: true, opts: 'sampleType' },
  { key: 'tests', label: t('order.bulkImport.col.tests', 'Tests / Panels'), req: true, bulk: true, opts: 'tests', multi: true },
  { key: 'container', label: t('order.bulkImport.col.container', 'Container'), bulk: true, opts: 'container' },
  { key: 'gpsLat', label: t('order.bulkImport.col.gpsLat', 'GPS Lat'), bulk: true },
  { key: 'gpsLng', label: t('order.bulkImport.col.gpsLng', 'GPS Lng'), bulk: true },
  { key: 'locationDetails', label: t('order.bulkImport.col.location', 'Location Details') },
  { key: 'collectionDate', label: t('order.bulkImport.col.date', 'Collection Date'), bulk: true },
  { key: 'collectionTime', label: t('order.bulkImport.col.time', 'Collection Time'), bulk: true, flagBlank: true }, // amber if blank → SOP hold-time; 12:00 AM placeholder on commit
];

const ORDER = { org: 'City Water Authority', requestor: 'A. Mbeki', site: 'Riverside Monitoring Station', standard: 'WHO Drinking Water 2022' };

// Uploaded rows: each cell is { raw, valid } from parse-time validation against the registries.
const UPLOADED = [
  { id: 1, clientId: { raw: 'RS-001', valid: true }, sampleType: { raw: '', valid: false }, tests: { raw: [], valid: false }, container: { raw: '500 mL Nalgene', valid: true }, gpsLat: { raw: '-6.208', valid: true }, gpsLng: { raw: '106.845', valid: true }, locationDetails: { raw: '', valid: true }, collectionDate: { raw: '04/03/2026', valid: true }, collectionTime: { raw: '', valid: false } },
  { id: 2, clientId: { raw: 'RS-002', valid: true }, sampleType: { raw: '', valid: false }, tests: { raw: [], valid: false }, container: { raw: '500 mL Nalgene', valid: true }, gpsLat: { raw: '-6.209', valid: true }, gpsLng: { raw: '106.846', valid: true }, locationDetails: { raw: '', valid: true }, collectionDate: { raw: '04/03/2026', valid: true }, collectionTime: { raw: '', valid: false } },
  { id: 3, clientId: { raw: 'RS-003', valid: true }, sampleType: { raw: '', valid: false }, tests: { raw: [], valid: false }, container: { raw: '500 mL Nalgene', valid: true }, gpsLat: { raw: '-6.215', valid: true }, gpsLng: { raw: '106.850', valid: true }, locationDetails: { raw: '', valid: true }, collectionDate: { raw: '06/13/2026', valid: false }, collectionTime: { raw: '', valid: false } },
];

const isBlank = (v) => v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');

export default function BulkSampleImport({ domain = 'Environmental' }) {
  const [open, setOpen] = useState(true);          // inline expansion (D-005)
  const [colVal, setColVal] = useState({});        // Set-for-all values, keyed by column
  const [cellVal, setCellVal] = useState({});      // per-row overrides, keyed `${id}:${key}`
  const [openBulk, setOpenBulk] = useState(null);  // which column's Set-for-all editor is open
  const [compact, setCompact] = useState(false);   // hide columns identical across all rows

  // ---- three-state validation ----
  const cellInfo = useCallback((row, col) => {
    const c = COLUMNS.find((x) => x.key === col);
    const key = `${row.id}:${col}`;
    const hasOv = cellVal[key] !== undefined || colVal[col] !== undefined;
    const ov = cellVal[key] !== undefined ? cellVal[key] : colVal[col];
    const v = hasOv ? ov : row[col].raw;
    const valid = hasOv ? !isBlank(ov) : row[col].valid;
    if (c.req) return { v, state: (!isBlank(v) && valid) ? 'ok' : 'red' };
    if (isBlank(v)) return { v, state: c.flagBlank ? 'amber' : 'ok' };
    return { v, state: valid ? 'ok' : 'amber' };
  }, [colVal, cellVal]);

  const rowState = useCallback((row) => {
    let s = 'ok';
    COLUMNS.forEach((c) => { const st = cellInfo(row, c.key).state; if (st === 'red') s = 'red'; else if (st === 'amber' && s !== 'red') s = 'amber'; });
    return s;
  }, [cellInfo]);

  const counts = useMemo(() => {
    let ready = 0, amber = 0, red = 0;
    UPLOADED.forEach((r) => { const s = rowState(r); if (s === 'ok') ready++; else if (s === 'amber') amber++; else red++; });
    return { ready, amber, red, total: UPLOADED.length };
  }, [rowState]);

  const canCommit = counts.red === 0;

  const setForAll = (col, val) => setColVal((p) => ({ ...p, [col]: val }));
  const setCell = (row, col, val) => setCellVal((p) => ({ ...p, [`${row.id}:${col}`]: val }));
  const rowEdited = (row) => COLUMNS.some((c) => cellVal[`${row.id}:${c.key}`] !== undefined && colVal[c.key] !== undefined);
  const resetRow = (row) => setCellVal((p) => { const n = { ...p }; COLUMNS.forEach((c) => delete n[`${row.id}:${c.key}`]); return n; });

  // columns identical across every row (and all-OK) can be folded away in compact mode
  const uniformCols = COLUMNS.filter((c) => {
    const infos = UPLOADED.map((r) => cellInfo(r, c.key));
    if (infos.some((i) => i.state !== 'ok')) return false;
    if (infos.every((i) => isBlank(i.v))) return true;
    return new Set(infos.map((i) => JSON.stringify(i.v))).size === 1;
  });
  const shownCols = compact ? COLUMNS.filter((c) => c.key === 'clientId' || !uniformCols.includes(c)) : COLUMNS;
  const sharedCols = uniformCols.filter((c) => c.key !== 'clientId' && !UPLOADED.every((r) => isBlank(cellInfo(r, c.key).v)));

  const bulkValue = (c) => {
    if (colVal[c.key] !== undefined) return colVal[c.key];
    const infos = UPLOADED.map((r) => cellInfo(r, c.key));
    if (infos.some((i) => isBlank(i.v))) return null;
    return new Set(infos.map((i) => JSON.stringify(i.v))).size === 1 ? infos[0].v : null;
  };

  const TAG = { ok: { type: 'green', label: t('order.bulkImport.status.ready', 'Ready') }, amber: { type: 'warm-gray', label: t('order.bulkImport.status.advisory', 'Advisory') }, red: { type: 'red', label: t('order.bulkImport.status.required', 'Required') } };

  const renderPicker = (c, onDone) => {
    if (c.multi) {
      return (
        <FilterableMultiSelect
          id={`bulk-${c.key}`}
          titleText=""
          placeholder={t('order.bulkImport.addTest', 'Add a test / panel…')}
          items={CATALOG[c.opts]}
          itemToString={(i) => i || ''}
          onChange={({ selectedItems }) => onDone(selectedItems)}
        />
      );
    }
    if (c.opts) {
      return (
        <ComboBox
          id={`bulk-${c.key}`}
          titleText=""
          placeholder={t('order.bulkImport.pick', 'Set a value')}
          items={CATALOG[c.opts]}
          itemToString={(i) => i || ''}
          onChange={({ selectedItem }) => selectedItem && onDone(selectedItem)}
        />
      );
    }
    return (
      <TextInput
        id={`bulk-${c.key}`}
        labelText=""
        placeholder={c.key === 'collectionDate' ? 'DD/MM/YYYY' : c.key === 'collectionTime' ? 'HH:MM' : c.key.startsWith('gps') ? 'e.g. -6.2088' : ''}
        onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) onDone(e.target.value.trim()); }}
      />
    );
  };

  const Chips = ({ value, onRemove }) => (
    Array.isArray(value)
      ? value.map((x) => <Tag key={x} type="gray" filter onClose={() => onRemove(value.filter((y) => y !== x))}>{x}</Tag>)
      : <Tag type="gray" filter onClose={() => onRemove('')}>{value}</Tag>
  );

  return (
    <Stack gap={5}>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('breadcrumb.orders', 'Orders')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('order.add.env', `Add ${domain} Order`)}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('order.bulkImport.breadcrumb', 'Bulk Import')}</BreadcrumbItem>
      </Breadcrumb>

      {/* This importer expands inline at the bottom of the existing Enter Order page,
          below the Per-Sample Manifest. Order-level fields (below) are the page's existing fields. */}
      <Tile>
        <p style={{ color: 'var(--cds-text-secondary)' }}>
          {t('order.bulkImport.orderContext', `Applies to all samples: ${ORDER.org} · ${ORDER.requestor} · ${ORDER.site} · ${ORDER.standard}`)}
        </p>
        <Button kind={open ? 'tertiary' : 'primary'} renderIcon={Upload} onClick={() => setOpen((o) => !o)}>
          {t('order.bulkImport.title', 'Bulk import samples (CSV / Excel)')}
        </Button>
      </Tile>

      {open && (
        <>
          {/* Step 1 — template + upload + manual mapping (v1) */}
          <Tile>
            <h4>{t('order.bulkImport.step.upload', '1. Download the manifest template, upload & map columns')}</h4>
            <Stack orientation="horizontal" gap={3} style={{ margin: '0.5rem 0' }}>
              <Button kind="ghost" size="sm" renderIcon={Download}>{t('order.bulkImport.template.downloadCsv', 'Download CSV template')}</Button>
              <Button kind="ghost" size="sm" renderIcon={Download}>{t('order.bulkImport.template.downloadXlsx', 'Download Excel template')}</Button>
            </Stack>
            <FileUploaderDropContainer
              labelText={t('order.bulkImport.upload.dropzone', 'Drag a file here or browse (.csv, .xlsx)')}
              accept={['.csv', '.xlsx']}
            />
            {/* Column mapping (v1): exact header matches auto-fill; the operator maps the rest. No guessing. */}
            <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.75rem' }}>
              {t('order.bulkImport.mapping.hint', 'Columns are matched to manifest fields by header name; set any that did not match. Saving a mapping to reuse is v2.')}
            </p>
          </Tile>

          {/* Step 2 — set values & fix (three-state; set-in-bulk from headers) */}
          <Tile>
            <h4>{t('order.bulkImport.step.set', '2. Set values & fix')}</h4>
            <Stack orientation="horizontal" gap={5} style={{ margin: '0.5rem 0' }}>
              <span><strong>{counts.ready}</strong> {t('order.bulkImport.status.ready', 'ready')}</span>
              <span style={{ color: 'var(--cds-support-error)' }}><strong>{counts.red}</strong> {t('order.bulkImport.count.required', 'required missing')}</span>
              <span style={{ color: 'var(--cds-support-warning)' }}><strong>{counts.amber}</strong> {t('order.bulkImport.count.advisory', 'advisory (won’t block)')}</span>
            </Stack>
            <InlineNotification
              kind="info" lowContrast hideCloseButton
              title={t('order.bulkImport.required.title', 'Only Sample Type and ≥1 Test/Panel are required')}
              subtitle={t('order.bulkImport.required.sub', 'Other fields are optional; unmatched values show as advisory (amber) and never block. Blank Collection Time is advisory — a 12:00 AM placeholder is applied for SOP hold-time math.')}
            />

            {sharedCols.length > 0 && (
              <div style={{ margin: '0.5rem 0' }}>
                <span style={{ color: 'var(--cds-text-secondary)', fontSize: 12 }}>{t('order.bulkImport.sharedFor', `Same for all ${counts.total} samples:`)} </span>
                {sharedCols.map((c) => { const v = cellInfo(UPLOADED[0], c.key).v; return <Tag key={c.key} type="gray">{c.label}: {Array.isArray(v) ? v.join(', ') : v}</Tag>; })}
              </div>
            )}
            <Toggle id="compact" size="sm" labelText="" labelA={t('order.bulkImport.compactOff', 'Show all columns')} labelB={t('order.bulkImport.compactOn', 'Compact — hide columns identical for every row')} toggled={compact} onToggle={setCompact} />

            <TableContainer style={{ marginTop: '1rem' }}>
              <Table size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader>{t('order.bulkImport.col.status', 'Status')}</TableHeader>
                    {shownCols.map((c) => <TableHeader key={c.key}>{c.label}{c.req ? ' *' : ''}</TableHeader>)}
                  </TableRow>
                  {/* per-column Set-for-all row */}
                  <TableRow>
                    <TableCell>{t('order.bulkImport.setAll', 'set all ↓')}</TableCell>
                    {shownCols.map((c) => {
                      if (!c.bulk) return <TableCell key={c.key} />;
                      const bv = bulkValue(c);
                      return (
                        <TableCell key={c.key}>
                          <Button kind="primary" size="sm" onClick={() => setOpenBulk(openBulk === c.key ? null : c.key)}>
                            {bv != null ? t('order.bulkImport.change', 'Change') : t('order.bulkImport.setAllBtn', 'Set all')}
                          </Button>
                          {bv != null && <div style={{ marginTop: 4 }}><Chips value={bv} onRemove={(nv) => setForAll(c.key, nv)} /></div>}
                          {openBulk === c.key && (
                            <div style={{ marginTop: 4 }}>{renderPicker(c, (val) => { setForAll(c.key, val); setOpenBulk(null); })}</div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {UPLOADED.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Tag type={TAG[rowState(row)].type} renderIcon={rowState(row) === 'red' ? ErrorFilled : rowState(row) === 'amber' ? WarningAltFilled : CheckmarkFilled}>
                          {TAG[rowState(row)].label}
                        </Tag>
                        {rowEdited(row) && (
                          <Tag type="blue" filter onClose={() => resetRow(row)} title={t('order.bulkImport.editedTip', 'Edited individually — reset to batch value')}>
                            {t('order.bulkImport.edited', 'edited')}
                          </Tag>
                        )}
                      </TableCell>
                      {shownCols.map((c) => {
                        const s = cellInfo(row, c.key);
                        if (isBlank(s.v)) {
                          return <TableCell key={c.key} style={{ color: s.state === 'red' ? 'var(--cds-support-error)' : 'var(--cds-support-warning)' }}>{s.state === 'red' ? t('order.bulkImport.cell.required', 'required') : '—'}</TableCell>;
                        }
                        if (c.opts) {
                          return <TableCell key={c.key}><Chips value={s.v} onRemove={(nv) => setCell(row, c.key, nv)} /></TableCell>;
                        }
                        return <TableCell key={c.key}>{s.v}</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Tile>

          {/* Step 3 — pre-commit review + all-or-nothing create */}
          <Tile>
            <h4>{t('order.bulkImport.step.review', '3. Review & create orders')}</h4>
            <p><strong>{t('order.bulkImport.review.count', `You're about to create ${counts.total} samples on this order`)}</strong></p>
            <p style={{ color: 'var(--cds-text-secondary)' }}>
              {t('order.bulkImport.review.order', `Order (all): ${ORDER.org} · ${ORDER.site} · ${ORDER.standard}`)}<br />
              {t('order.bulkImport.review.shared', 'Shared across all: ')}
              {sharedCols.map((c) => { const v = cellInfo(UPLOADED[0], c.key).v; return <Tag key={c.key} type="gray">{c.label}: {Array.isArray(v) ? v.join(', ') : v}</Tag>; })}
              <br />{t('order.bulkImport.review.storage', 'Storage: loose (no container in v1). Blank collection times default to 12:00 AM for SOP math.')}
            </p>
            {!canCommit && (
              <InlineNotification kind="warning" lowContrast hideCloseButton
                title={t('order.bulkImport.commit.gateBlockedTitle', 'Set required fields first')}
                subtitle={t('order.bulkImport.commit.gateBlocked', `${counts.red} row(s) still missing Sample Type or a Test/Panel. Advisory rows don't block.`)} />
            )}
            <Button kind="primary" disabled={!canCommit} renderIcon={Add}>
              {t('order.bulkImport.action.commit', `Create ${counts.total} orders`)}
            </Button>
            <p style={{ color: 'var(--cds-text-secondary)', fontSize: 12, marginTop: '0.5rem' }}>
              {t('order.bulkImport.commit.atomic', 'All-or-nothing: if any row is rejected the whole batch rolls back — nothing half-created. Imported samples land exactly like hand-entered orders.')}
            </p>
          </Tile>
        </>
      )}
    </Stack>
  );
}
