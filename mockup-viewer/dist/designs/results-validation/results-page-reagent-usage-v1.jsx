/**
 * Reagent Usage Capture v1 — Carbon mockup
 * --------------------------------------------------------------------
 * Slots a new "Reagent" row into the existing Result Entry expanded
 * panel, BETWEEN the Methods row and the Storage / NCE row.
 *
 * No Accordion — the row is always visible when the result is
 * expanded, matching the panel's existing inline-row pattern.
 *
 * Companion FRS: results-page-reagent-usage-v1-frs.md
 *
 * Drop-in target: existing Result Entry row's expanded panel,
 * inserted between the Methods row and the Storage/NCE row.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  ComboBox, Tile, Tag, NumberInput, Select, SelectItem,
  Button, IconButton, InlineNotification, Stack,
} from '@carbon/react';
import { Add, TrashCan, Edit } from '@carbon/icons-react';

const t = (key, fallback, ...args) =>
  args.reduce((s, v, i) => s.replaceAll(`{${i}}`, String(v)), fallback || key);

// ---------------------------------------------------------------------
// Search match helpers
// ---------------------------------------------------------------------
const ITEM_KIND = { LOT: 'lot', NAME: 'name' };

function formatSearchItem(item) {
  if (!item) return '';
  if (item.matchType === ITEM_KIND.LOT) {
    return `${item.lot.lotNumber} · ${item.reagentName} · exp ${item.lot.expires}`;
  }
  const count = item.lots?.length ?? 0;
  return `${item.reagentName} · ${count} lot${count === 1 ? '' : 's'}`;
}

// ---------------------------------------------------------------------
// Single Reagent Entry — three states (empty / picking-lot / resolved)
// ---------------------------------------------------------------------
function ReagentEntry({ entry, onChange, onRemove, canRemove, searchProvider }) {
  const [searchResults, setSearchResults] = useState([]);
  const [pendingReagent, setPendingReagent] = useState(null);

  const handleSearchChange = useCallback(async ({ inputValue }) => {
    if (!inputValue || inputValue.length < 2) {
      setSearchResults([]);
      return;
    }
    const results = await searchProvider(inputValue);
    setSearchResults(results);
  }, [searchProvider]);

  const handleSearchSelect = useCallback(({ selectedItem }) => {
    if (!selectedItem) return;
    if (selectedItem.matchType === ITEM_KIND.LOT) {
      onChange({
        ...entry,
        reagentId: selectedItem.reagentId,
        reagentName: selectedItem.reagentName,
        lotId: selectedItem.lot.lotId,
        lotNumber: selectedItem.lot.lotNumber,
        unit: selectedItem.lot.unit,
        lotMeta: selectedItem.lot,
      });
      setPendingReagent(null);
    } else {
      setPendingReagent(selectedItem);
      onChange({
        ...entry,
        reagentId: selectedItem.reagentId,
        reagentName: selectedItem.reagentName,
        lotId: null, lotNumber: null, unit: null, lotMeta: null,
      });
    }
  }, [entry, onChange]);

  const pickLotFromPending = useCallback((lot) => {
    if (lot.status === 'expired') return;
    onChange({
      ...entry,
      lotId: lot.lotId,
      lotNumber: lot.lotNumber,
      unit: lot.unit,
      lotMeta: lot,
    });
    setPendingReagent(null);
  }, [entry, onChange]);

  const handleQuantityChange = (_, { value }) => {
    onChange({ ...entry, quantityUsed: value === '' ? null : Number(value) });
  };

  const isResolved = entry.lotId && entry.lotMeta;
  const exceedsRemaining = isResolved && entry.quantityUsed != null
    && entry.quantityUsed > entry.lotMeta.remainingQuantity;

  const lowStock = isResolved && entry.quantityUsed
    && entry.lotMeta.reorderThreshold != null
    && (entry.lotMeta.remainingQuantity - entry.quantityUsed) < entry.lotMeta.reorderThreshold;

  const projectedRemaining = lowStock
    ? entry.lotMeta.remainingQuantity - entry.quantityUsed
    : null;

  // ----- State 1: Empty (search input) -----
  if (!isResolved && !pendingReagent) {
    return (
      <div className="reagent-entry reagent-entry--empty">
        <div style={{ flex: 1, minWidth: 280, maxWidth: 480 }}>
          <ComboBox
            id={`reagent-search-${entry.id}`}
            titleText="" /* label is on the row, not per entry */
            placeholder={t('placeholder.results.reagentUsage.search', 'Search reagent or lot number')}
            items={searchResults}
            itemToString={formatSearchItem}
            onInputChange={(inputValue) => handleSearchChange({ inputValue })}
            onChange={handleSearchSelect}
            shouldFilterItem={() => true}
            size="md"
          />
        </div>
        {canRemove && (
          <IconButton
            label={t('button.results.reagentUsage.remove', 'Remove')}
            kind="ghost"
            size="sm"
            onClick={onRemove}
          >
            <TrashCan />
          </IconButton>
        )}
      </div>
    );
  }

  // ----- State 2: Picking a lot after a name match -----
  if (pendingReagent) {
    return (
      <div className="reagent-entry reagent-entry--picking">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--cds-spacing-03)' }}>
            <strong style={{ fontSize: '0.875rem' }}>
              {t('label.results.reagentUsage.availableLots', 'Available lots (FIFO order)')}
              <span style={{ color: 'var(--cds-text-secondary)', fontWeight: 400, marginLeft: '0.5rem' }}>
                · {pendingReagent.reagentName}
              </span>
            </strong>
            <Button kind="ghost" size="sm" onClick={() => setPendingReagent(null)}>
              Cancel
            </Button>
          </div>
          <Stack gap={2}>
            {pendingReagent.lots.map(lot => (
              <Tile
                key={lot.lotId}
                style={{
                  padding: 'var(--cds-spacing-03)',
                  border: lot.fifoRank === 1 && lot.status !== 'expired'
                    ? '1px dashed var(--cds-support-info)'
                    : '1px solid var(--cds-border-subtle)',
                  opacity: lot.status === 'expired' ? 0.5 : 1,
                  cursor: lot.status === 'expired' ? 'not-allowed' : 'pointer',
                }}
                onClick={() => pickLotFromPending(lot)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)' }}>
                  <input type="radio" disabled={lot.status === 'expired'} readOnly />
                  <strong style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{lot.lotNumber}</strong>
                  {lot.fifoRank === 1 && lot.status !== 'expired' && (
                    <Tag size="sm" type="teal">{t('label.results.reagentUsage.fifoSuggested', 'FIFO Suggested')}</Tag>
                  )}
                  {lot.status === 'expiring-soon' && (
                    <Tag size="sm" type="warm-gray">{t('label.results.reagentUsage.expiring', 'Expiring')}</Tag>
                  )}
                  {lot.status === 'expired' && (
                    <Tag size="sm" type="red">{t('label.results.reagentUsage.expired', 'Expired')}</Tag>
                  )}
                </div>
                <div style={{ marginTop: 'var(--cds-spacing-02)', fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  Exp: {lot.expires} · {lot.remainingQuantity} {lot.unit} remaining
                </div>
              </Tile>
            ))}
          </Stack>
        </div>
      </div>
    );
  }

  // ----- State 3: Resolved (chip + Quantity + Unit + Remove) -----
  return (
    <div className="reagent-entry reagent-entry--resolved">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--cds-spacing-04)',
        flexWrap: 'wrap',
        flex: 1,
      }}>
        <div style={{
          padding: '0.25rem 0.625rem',
          background: 'var(--cds-layer)',
          border: '1px solid var(--cds-border-subtle)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--cds-spacing-02)',
          fontSize: '0.875rem',
        }}>
          <strong style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{entry.lotNumber}</strong>
          <span style={{ color: 'var(--cds-text-secondary)' }}>· {entry.reagentName}</span>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Edit}
            onClick={() => onChange({ id: entry.id })}
            iconDescription="Change reagent"
            hasIconOnly
            style={{ minBlockSize: 'auto', padding: '0.125rem' }}
          />
        </div>

        <div style={{ minWidth: 160, maxWidth: 200 }}>
          <NumberInput
            id={`qty-${entry.id}`}
            label={t('label.results.reagentUsage.quantityUsed', 'Quantity Used')}
            min={0}
            step={['mL', 'L'].includes(entry.unit) ? 0.1 : 1}
            value={entry.quantityUsed ?? ''}
            onChange={handleQuantityChange}
            invalid={exceedsRemaining}
            invalidText={t('error.results.reagentUsage.exceedsRemaining',
              'Cannot exceed remaining quantity ({0} {1}).',
              entry.lotMeta.remainingQuantity, entry.unit)}
            size="md"
          />
        </div>

        {(entry.lotMeta.allowedUnits?.length ?? 1) > 1 ? (
          <div style={{ minWidth: 100 }}>
            <Select
              id={`unit-${entry.id}`}
              labelText={t('label.results.reagentUsage.unit', 'Unit')}
              value={entry.unit}
              onChange={(e) => onChange({ ...entry, unit: e.target.value })}
              size="md"
            >
              {entry.lotMeta.allowedUnits.map(u =>
                <SelectItem key={u} value={u} text={u} />
              )}
            </Select>
          </div>
        ) : (
          <div style={{ alignSelf: 'flex-end', padding: '0.5rem 0', fontSize: '0.875rem' }}>
            {entry.unit}
          </div>
        )}
      </div>

      <IconButton
        label={t('button.results.reagentUsage.remove', 'Remove')}
        kind="ghost"
        size="sm"
        onClick={onRemove}
      >
        <TrashCan />
      </IconButton>

      {lowStock && (
        <div style={{ flexBasis: '100%', marginTop: 'var(--cds-spacing-03)' }}>
          <InlineNotification
            kind="warning"
            lowContrast
            hideCloseButton
            title=""
            subtitle={t('message.results.reagentUsage.lowStock',
              'Saving this result will leave {0} below reorder threshold ({1} {2} remaining). Notify your inventory officer.',
              entry.lotNumber,
              projectedRemaining?.toFixed(1),
              entry.unit)}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Reagent Row — what gets inserted between Methods and Storage rows
// ---------------------------------------------------------------------
let ENTRY_ID = 1;
const newEntry = () => ({ id: `entry-${ENTRY_ID++}` });

export default function ReagentRow({ entries, onChange, searchProvider }) {
  const safeEntries = entries && entries.length > 0 ? entries : [newEntry()];

  const updateEntry = (id, patch) => {
    onChange(safeEntries.map(e => e.id === id ? { ...e, ...patch } : e));
  };
  const removeEntry = (id) => {
    const remaining = safeEntries.filter(e => e.id !== id);
    onChange(remaining.length > 0 ? remaining : [newEntry()]);
  };
  const addEntry = () => {
    onChange([...safeEntries, newEntry()]);
  };

  // Whether the only-empty-entry remove is allowed
  const isOnlyEmptyEntry = (e, idx) =>
    safeEntries.length === 1 && !e.lotId && !e.reagentId;

  return (
    <div className="results-panel-row results-panel-row--reagent">
      <div className="results-panel-row__label">
        {t('label.results.reagentUsage.row', 'Reagent')}
      </div>
      <div className="results-panel-row__field">
        <Stack gap={3}>
          {safeEntries.map((entry, idx) => (
            <ReagentEntry
              key={entry.id}
              entry={entry}
              onChange={(patch) => updateEntry(entry.id, patch)}
              onRemove={() => removeEntry(entry.id)}
              canRemove={!isOnlyEmptyEntry(entry, idx)}
              searchProvider={searchProvider}
            />
          ))}
          <div>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Add}
              onClick={addEntry}
              disabled={safeEntries.length >= 12}
            >
              {t('button.results.reagentUsage.addAnother', 'Add another reagent')}
            </Button>
          </div>
        </Stack>
      </div>
    </div>
  );
}

/**
 * Suggested companion CSS (drop into the panel's existing stylesheet):
 *
 *   .results-panel-row {
 *     display: flex; gap: var(--cds-spacing-05); align-items: flex-start;
 *     padding: var(--cds-spacing-04) 0;
 *     border-top: 1px solid var(--cds-border-subtle);
 *   }
 *   .results-panel-row__label {
 *     min-width: 120px; padding-top: 0.375rem;
 *     font-size: 0.875rem; font-weight: 600; color: var(--cds-text-secondary);
 *   }
 *   .results-panel-row__field { flex: 1; }
 *   .reagent-entry {
 *     display: flex; gap: var(--cds-spacing-04);
 *     align-items: flex-end; flex-wrap: wrap;
 *   }
 */
