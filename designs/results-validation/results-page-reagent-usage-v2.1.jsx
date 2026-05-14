/**
 * Results Entry — Method & Reagents Tab — v2.1 Reagent Usage Capture
 * --------------------------------------------------------------------
 * Drop-in replacement for the existing `<ReagentLotSelection>` block
 * inside the Method & Reagents tab of `results-page-mockup.jsx` (v2.0).
 *
 * Adds:
 *  - Quantity Used + Unit per selected lot
 *  - Reset-to-default ghost button
 *  - Override-reason TextInput when delta exceeds tolerance
 *  - Low-stock InlineNotification when remainingQuantity would dip
 *    below reorderThreshold after this save
 *  - Capture-mode handling (HIDDEN | OPTIONAL | REQUIRED) per Test
 *
 * Companion FRS: results-page-requirements-v2.1.md §Method & Reagents Tab
 *                §Reagent Usage Capture
 *                §Save & Inventory Decrement
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Stack, Tile, Tag, NumberInput, Select, SelectItem, TextInput,
  Button, InlineNotification,
} from '@carbon/react';
import { Renew, WarningAlt } from '@carbon/icons-react';

const t = (key, fallback, ...args) => {
  // i18n stub — replace ${0} ${1} in fallback with positional args
  return args.reduce((s, v, i) => s.replaceAll(`{${i}}`, String(v)), fallback || key);
};

// ---------------------------------------------------------------------
// Capture mode helpers
// ---------------------------------------------------------------------
const CAPTURE_MODE = { HIDDEN: 'HIDDEN', OPTIONAL: 'OPTIONAL', REQUIRED: 'REQUIRED' };

function isOverThreshold(quantity, defaultQty, tolerancePct = 25) {
  if (!defaultQty || defaultQty === 0) return false;
  const deltaPct = (Math.abs(quantity - defaultQty) / defaultQty) * 100;
  return deltaPct > tolerancePct;
}

function projectedRemainingPct(lot, quantity) {
  if (!lot.remainingQuantity || !lot.lotSize) return null;
  const projected = lot.remainingQuantity - quantity;
  return Math.max(0, (projected / lot.lotSize) * 100);
}

// ---------------------------------------------------------------------
// Single reagent block
// ---------------------------------------------------------------------
function ReagentBlock({ reagent, selection, onSelect, onQuantityChange, onUnitChange, onOverrideReasonChange, captureMode }) {
  const selectedLot = reagent.lots.find(l => l.lotNumber === selection?.lotNumber);
  const tolerance = reagent.overrideTolerancePct ?? 25;
  const defaultQty = reagent.defaultQuantity;
  const allowedUnits = reagent.allowedUnits ?? [reagent.unit];
  const multiUnit = allowedUnits.length > 1;

  const showOverrideReason = useMemo(() => {
    if (!selection?.quantityUsed) return false;
    return isOverThreshold(selection.quantityUsed, defaultQty, tolerance);
  }, [selection?.quantityUsed, defaultQty, tolerance]);

  const showReset = selection?.quantityUsed != null && selection.quantityUsed !== defaultQty;

  // Low-stock projection
  const lowStockWarning = useMemo(() => {
    if (!selectedLot || !selection?.quantityUsed || !selectedLot.reorderThreshold) return null;
    const remainingAfter = selectedLot.remainingQuantity - selection.quantityUsed;
    if (remainingAfter < selectedLot.reorderThreshold) {
      const daysOfStock = selectedLot.avgDailyConsumption
        ? Math.floor(remainingAfter / selectedLot.avgDailyConsumption)
        : null;
      return {
        lot: selectedLot.lotNumber,
        days: daysOfStock,
      };
    }
    return null;
  }, [selectedLot, selection?.quantityUsed]);

  // Required-but-missing validation
  const requiredMissing = captureMode === CAPTURE_MODE.REQUIRED &&
    (!selection?.lotNumber || !selection?.quantityUsed || selection.quantityUsed <= 0);

  return (
    <div style={{ marginBottom: 'var(--cds-spacing-05)' }}>
      <h5 style={{ margin: '0 0 var(--cds-spacing-03) 0', fontSize: '0.875rem', fontWeight: 600 }}>
        {reagent.name}
        {captureMode === CAPTURE_MODE.REQUIRED && (
          <span style={{ color: 'var(--cds-support-error)', marginLeft: '0.25rem' }}>*</span>
        )}
      </h5>

      <Stack gap={3}>
        {reagent.lots.map(lot => {
          const isSelected = selection?.lotNumber === lot.lotNumber;
          const isExpired = lot.status === 'expired';
          return (
            <Tile
              key={lot.lotNumber}
              style={{
                padding: 'var(--cds-spacing-04)',
                border: isSelected
                  ? '2px solid var(--cds-support-info)'
                  : (lot.fifoRank === 1 ? '1px dashed var(--cds-support-info)' : '1px solid var(--cds-border-subtle)'),
                background: isExpired ? 'var(--cds-layer-accent)' : (isSelected ? 'var(--cds-layer-selected)' : 'var(--cds-layer)'),
                opacity: isExpired ? 0.5 : 1,
                cursor: isExpired ? 'not-allowed' : 'pointer',
              }}
              onClick={() => !isExpired && !isSelected && onSelect(reagent.id, lot.lotNumber)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)' }}>
                <input
                  type="radio"
                  checked={isSelected}
                  disabled={isExpired}
                  onChange={() => onSelect(reagent.id, lot.lotNumber)}
                />
                <strong style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{lot.lotNumber}</strong>
                {lot.fifoRank === 1 && <Tag size="sm" type="teal">{t('label.results.reagent.fifoSuggested', 'FIFO Suggested')}</Tag>}
                {lot.status === 'expiring-soon' && <Tag size="sm" type="warm-gray">{t('label.results.reagent.expiring', 'Expiring')}</Tag>}
                {isExpired && <Tag size="sm" type="red">Expired</Tag>}
              </div>
              <div style={{ marginTop: 'var(--cds-spacing-02)', fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                Exp: {lot.expires} • {lot.remaining} remaining
              </div>

              {/* === v2.1 Quantity Used row, only when this lot is selected === */}
              {isSelected && (
                <div style={{
                  marginTop: 'var(--cds-spacing-04)',
                  paddingTop: 'var(--cds-spacing-04)',
                  borderTop: '1px solid var(--cds-border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--cds-spacing-04)', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 160 }}>
                      <NumberInput
                        id={`qty-${reagent.id}`}
                        label={t('label.results.reagent.quantityUsed', 'Quantity Used')}
                        min={0}
                        step={reagent.unit === 'µL' ? 10 : 0.1}
                        value={selection?.quantityUsed ?? defaultQty}
                        onChange={(_, { value }) => onQuantityChange(reagent.id, Number(value))}
                        invalidText={t('error.results.reagent.quantityRequired', 'Required')}
                        invalid={requiredMissing && !selection?.quantityUsed}
                      />
                    </div>

                    {multiUnit ? (
                      <div style={{ minWidth: 120 }}>
                        <Select
                          id={`unit-${reagent.id}`}
                          labelText={t('label.results.reagent.unit', 'Unit')}
                          value={selection?.unit ?? reagent.unit}
                          onChange={e => onUnitChange(reagent.id, e.target.value)}
                        >
                          {allowedUnits.map(u => <SelectItem key={u} value={u} text={u} />)}
                        </Select>
                      </div>
                    ) : (
                      <div style={{ alignSelf: 'flex-end', padding: '0.25rem 0', fontSize: '0.875rem' }}>
                        {reagent.unit}
                      </div>
                    )}

                    {showReset && (
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={Renew}
                        onClick={() => onQuantityChange(reagent.id, defaultQty)}
                      >
                        {t('button.results.reagent.resetDefault', 'Reset to default {0} {1}', defaultQty, reagent.unit)}
                      </Button>
                    )}
                  </div>

                  {showOverrideReason && (
                    <div style={{ marginTop: 'var(--cds-spacing-04)' }}>
                      <InlineNotification
                        kind="warning"
                        lowContrast
                        hideCloseButton
                        title=""
                        subtitle={t(
                          'message.results.reagent.overrideRequired',
                          '{0}% above default — provide override reason.',
                          Math.round(((selection.quantityUsed - defaultQty) / defaultQty) * 100)
                        )}
                      />
                      <TextInput
                        id={`override-${reagent.id}`}
                        labelText={t('label.results.reagent.overrideReason', 'Override reason')}
                        placeholder={t('placeholder.results.reagent.overrideReason', 'Why is the quantity outside the typical range?')}
                        value={selection?.overrideReason ?? ''}
                        onChange={e => onOverrideReasonChange(reagent.id, e.target.value)}
                        invalid={!selection?.overrideReason}
                        invalidText={t('error.results.reagent.overrideRequired', 'Override reason is required')}
                      />
                    </div>
                  )}

                  {lowStockWarning && (
                    <div style={{ marginTop: 'var(--cds-spacing-04)' }}>
                      <InlineNotification
                        kind="warning"
                        lowContrast
                        hideCloseButton
                        title=""
                        subtitle={t(
                          'message.results.reagent.lowStock',
                          'Saving this result will leave {0} below reorder threshold (estimated {1} days of stock remaining). Notify your inventory officer.',
                          lowStockWarning.lot,
                          lowStockWarning.days ?? '—'
                        )}
                      />
                    </div>
                  )}
                </div>
              )}
            </Tile>
          );
        })}

        {requiredMissing && !selection?.lotNumber && (
          <InlineNotification
            kind="error"
            lowContrast
            hideCloseButton
            title=""
            subtitle={t('message.results.reagent.requiredMissing',
              'This test requires reagent capture. Select a lot and enter a quantity for {0}.',
              reagent.name)}
          />
        )}
      </Stack>
    </div>
  );
}

// ---------------------------------------------------------------------
// Reagent Lot Selection block — top-level export
// ---------------------------------------------------------------------
export default function ReagentLotSelection({
  reagents,                          // AvailableReagent[]
  selections,                        // selectedReagentLots[]
  captureMode = CAPTURE_MODE.OPTIONAL,
  onSelectionsChange,
}) {
  if (captureMode === CAPTURE_MODE.HIDDEN) return null;

  const updateSelection = useCallback((reagentId, patch) => {
    const next = [...(selections || [])];
    const idx = next.findIndex(s => s.reagentId === reagentId);
    const reagent = reagents.find(r => r.id === reagentId);
    if (idx >= 0) {
      next[idx] = { ...next[idx], ...patch };
    } else {
      next.push({
        reagentId,
        reagentName: reagent?.name,
        unit: reagent?.unit,
        ...patch,
      });
    }
    onSelectionsChange(next);
  }, [reagents, selections, onSelectionsChange]);

  return (
    <div>
      <h4 style={{ marginBottom: 'var(--cds-spacing-04)' }}>
        {t('label.results.reagent.title', 'Reagent Lots Used')}
      </h4>

      <Stack gap={5}>
        {reagents.map(reagent => {
          const selection = selections?.find(s => s.reagentId === reagent.id);
          return (
            <ReagentBlock
              key={reagent.id}
              reagent={reagent}
              selection={selection}
              captureMode={captureMode}
              onSelect={(rid, lotNumber) => updateSelection(rid, {
                lotNumber,
                quantityUsed: reagent.defaultQuantity,  // pre-fill on selection
                unit: reagent.unit,
              })}
              onQuantityChange={(rid, quantityUsed) => updateSelection(rid, { quantityUsed })}
              onUnitChange={(rid, unit) => updateSelection(rid, { unit })}
              onOverrideReasonChange={(rid, overrideReason) => updateSelection(rid, { overrideReason })}
            />
          );
        })}
      </Stack>

      <InlineNotification
        kind="info"
        lowContrast
        hideCloseButton
        title=""
        subtitle={t('message.results.reagent.fifoHint',
          'Lots marked "FIFO Suggested" are the oldest unexpired lots. Select them to ensure proper stock rotation.')}
        style={{ marginTop: 'var(--cds-spacing-05)' }}
      />
    </div>
  );
}
