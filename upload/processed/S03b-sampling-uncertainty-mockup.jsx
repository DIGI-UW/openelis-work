/**
 * S-03b — Sampling Uncertainty Field
 * Addendum to S-03: Environmental Order Entry Integration (OGC-537)
 *
 * SCOPE ANNOTATION CONVENTION (same as S-07b):
 *   Gold dashed border + "S-03b NEW" badge  → new in this addendum
 *   Dimmed (72% opacity) + "S-07 EXISTING" badge → existing S-03 content shown for context only
 *
 * This mockup shows ONLY the Collection Conditions section.
 * It does NOT re-specify the full order entry form (S-03 §5.1–5.9).
 */

import React, { useState } from 'react';
import {
  Grid, Column, Stack,
  NumberInput, Select, SelectItem, TextInput, TextArea,
  Button, Tag, InlineNotification,
  Tile,
} from '@carbon/react';
import { Information } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  gold20:  '#fdd13a',
  gold40:  '#f1c21b',
  gold60:  '#b28600',
  gray10:  '#f4f4f4',
  gray20:  '#e0e0e0',
  gray50:  '#8d8d8d',
  gray70:  '#525252',
  gray100: '#161616',
  blue60:  '#0f62fe',
  blue10:  '#edf5ff',
  green50: '#24a148',
  red10:   '#fff1f1',
  red60:   '#da1e28',
};

// ── Scope Annotation Components ───────────────────────────────────────────────

function NewBadge({ label = 'S-03b NEW' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: C.gold40, color: C.gray100,
      fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
      padding: '2px 7px', borderRadius: 3,
      letterSpacing: '0.04em',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
    }}>
      {label}
    </span>
  );
}

function ExistingBadge({ label = 'S-03 EXISTING' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: C.gray20, color: C.gray70,
      fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
      padding: '2px 7px', borderRadius: 3,
      letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  );
}

/** Wraps new-scope content in a gold dashed border with a floating badge */
function NewRegion({ children, label = 'S-03b NEW', style = {} }) {
  return (
    <div style={{
      position: 'relative',
      border: `2px dashed ${C.gold40}`,
      borderRadius: 6,
      padding: '1.25rem 1rem 1rem',
      background: 'rgba(253,209,58,0.04)',
      ...style,
    }}>
      <div style={{
        position: 'absolute',
        top: -11,
        left: 10,
        background: '#fff',
        padding: '0 4px',
        lineHeight: 1,
      }}>
        <NewBadge label={label} />
      </div>
      {children}
    </div>
  );
}

/** Wraps existing content with dimming + badge */
function ExistingRegion({ children, label = 'S-03 EXISTING', style = {} }) {
  return (
    <div style={{
      position: 'relative',
      border: `1px solid ${C.gray20}`,
      borderRadius: 6,
      padding: '1.25rem 1rem 1rem',
      background: C.gray10,
      ...style,
    }}>
      <div style={{
        position: 'absolute',
        top: -11,
        left: 10,
        background: '#fff',
        padding: '0 4px',
        lineHeight: 1,
      }}>
        <ExistingBadge label={label} />
      </div>
      <div style={{ opacity: 0.68 }}>
        {children}
      </div>
    </div>
  );
}

// ── Scene 1: Step 1 Collection Conditions ────────────────────────────────────

function SceneStep1() {
  const [unitType, setUnitType] = useState('%');
  const [customUnit, setCustomUnit] = useState('');
  const [uncertainty, setUncertainty] = useState('');
  const [collectionMethod, setCollectionMethod] = useState('');
  const [validationError, setValidationError] = useState('');

  const unitOptions = [
    { value: '%', label: 'Relative (%)' },
    { value: 'mg/L', label: 'mg/L' },
    { value: 'μg/L', label: 'μg/L' },
    { value: 'CFU/100 mL', label: 'CFU/100 mL' },
    { value: 'other', label: 'Other (free text)' },
  ];

  const validate = () => {
    const val = parseFloat(uncertainty);
    if (!uncertainty || isNaN(val)) {
      setValidationError(t('collectionConditions.samplingUncertainty.required',
        'Sampling uncertainty is required for environmental orders.'));
      return false;
    }
    if (val <= 0) {
      setValidationError(t('collectionConditions.samplingUncertainty.nonZero',
        'Uncertainty value must be greater than 0.'));
      return false;
    }
    if (unitType === '%' && val > 100) {
      setValidationError(t('collectionConditions.samplingUncertainty.percentMax',
        'Relative uncertainty cannot exceed 100%.'));
      return false;
    }
    if (unitType === 'other' && !customUnit.trim()) {
      setValidationError(t('collectionConditions.samplingUncertainty.unitRequired',
        'Please specify the unit.'));
      return false;
    }
    setValidationError('');
    return true;
  };

  const resolvedUnit = unitType === 'other' ? (customUnit || '?') : unitType;

  return (
    <div>
      {/* Scope explanation banner */}
      <InlineNotification
        kind="info"
        title="S-03b mockup scope:"
        subtitle="This scene shows only the Collection Conditions section of Step 1. Existing S-03 fields are shown dimmed for context. The new Sampling Uncertainty field is highlighted in gold."
        lowContrast
        hideCloseButton
        style={{ marginBottom: '1.5rem' }}
      />

      <Tile style={{ padding: '1.5rem', maxWidth: 720 }}>
        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.25rem',
          borderBottom: `1px solid ${C.gray20}`,
          paddingBottom: '0.75rem',
        }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.gray100 }}>
            {t('collectionConditions.title', 'Collection Conditions')}
          </h4>
          <Tag kind="blue" size="sm">Environmental</Tag>
        </div>

        <Stack gap={5}>
          {/* Existing fields — dimmed */}
          <ExistingRegion>
            <Grid narrow>
              <Column sm={2} md={4}>
                <NumberInput
                  id="water-temp"
                  label={t('collectionConditions.waterTemp', 'Water Temperature (°C)')}
                  placeholder="e.g. 22.5"
                  min={-10} max={50} step={0.1}
                />
              </Column>
              <Column sm={2} md={4}>
                <NumberInput
                  id="ambient-temp"
                  label={t('collectionConditions.ambientTemp', 'Ambient Temperature (°C)')}
                  placeholder="e.g. 28.0"
                  min={-20} max={60} step={0.1}
                />
              </Column>
              <Column sm={2} md={4}>
                <Select
                  id="weather"
                  labelText={t('collectionConditions.weather', 'Weather Conditions')}
                >
                  <SelectItem value="" text="Select weather..." />
                  <SelectItem value="clear" text="Clear" />
                  <SelectItem value="cloudy" text="Cloudy" />
                  <SelectItem value="rain" text="Rain" />
                  <SelectItem value="storm" text="Storm" />
                  <SelectItem value="wind" text="Wind" />
                  <SelectItem value="other" text="Other" />
                </Select>
              </Column>
              <Column sm={2} md={4}>
                <Select
                  id="collection-method"
                  labelText={t('collectionConditions.collectionMethod', 'Collection Method')}
                  value={collectionMethod}
                  onChange={e => setCollectionMethod(e.target.value)}
                >
                  <SelectItem value="" text="Select method... *" />
                  <SelectItem value="grab" text="Manual Grab" />
                  <SelectItem value="composite-time" text="Composite (Time)" />
                  <SelectItem value="composite-flow" text="Composite (Flow)" />
                  <SelectItem value="automated" text="Automated Sampler" />
                  <SelectItem value="passive" text="Passive" />
                  <SelectItem value="trap" text="Trap Collection" />
                  <SelectItem value="other" text="Other" />
                </Select>
              </Column>
              <Column sm={4} md={8}>
                <TextInput
                  id="preservation"
                  labelText={t('collectionConditions.preservation', 'Preservation Method')}
                  placeholder='e.g. "HNO3 acidification, 4°C cooler"'
                />
              </Column>
            </Grid>
          </ExistingRegion>

          {/* NEW: Sampling Uncertainty field */}
          <NewRegion label="S-03b NEW — FR-01">
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: C.gray100,
                marginBottom: '0.375rem',
                letterSpacing: '0.16px',
              }}>
                {t('collectionConditions.samplingUncertainty.label', 'Sampling Uncertainty')}
                {' '}
                <span style={{ color: C.red60, fontWeight: 700 }}>*</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Value input */}
                <div style={{ width: 140 }}>
                  <NumberInput
                    id="sampling-uncertainty-value"
                    hideLabel
                    label=""
                    placeholder={t('collectionConditions.samplingUncertainty.placeholder', 'e.g. 2.50')}
                    min={0.01} max={999.99} step={0.01}
                    value={uncertainty}
                    onChange={(e, { value }) => {
                      setUncertainty(value !== undefined ? String(value) : e.target.value);
                      setValidationError('');
                    }}
                    invalid={!!validationError}
                  />
                </div>

                {/* Unit select */}
                <div style={{ width: 180 }}>
                  <Select
                    id="sampling-uncertainty-unit"
                    hideLabel
                    labelText="Unit"
                    value={unitType}
                    onChange={e => { setUnitType(e.target.value); setValidationError(''); }}
                  >
                    {unitOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} text={opt.label} />
                    ))}
                  </Select>
                </div>

                {/* Custom unit — visible only when "Other" */}
                {unitType === 'other' && (
                  <div style={{ width: 120 }}>
                    <TextInput
                      id="sampling-uncertainty-custom-unit"
                      hideLabel
                      labelText="Custom unit"
                      placeholder={t('collectionConditions.samplingUncertainty.customUnit', 'Specify unit')}
                      value={customUnit}
                      maxLength={20}
                      onChange={e => { setCustomUnit(e.target.value); setValidationError(''); }}
                    />
                  </div>
                )}

                {/* Live preview pill */}
                {uncertainty && parseFloat(uncertainty) > 0 && (
                  <Tag kind="teal" style={{ alignSelf: 'center', marginTop: 2 }}>
                    ± {uncertainty} {resolvedUnit}
                  </Tag>
                )}
              </div>

              {/* Helper text */}
              <p style={{ fontSize: 12, color: C.gray50, marginTop: '0.375rem', marginBottom: 0 }}>
                {t('collectionConditions.samplingUncertainty.helper',
                  'Field/sampling uncertainty — not analytical measurement uncertainty')}
              </p>

              {/* Validation error */}
              {validationError && (
                <p style={{ fontSize: 12, color: C.red60, marginTop: '0.25rem', marginBottom: 0 }}>
                  {validationError}
                </p>
              )}
            </div>
          </NewRegion>

          {/* Field Notes — existing, dimmed */}
          <ExistingRegion label="S-03 EXISTING">
            <TextArea
              id="field-notes"
              labelText={t('collectionConditions.fieldNotes', 'Field Notes')}
              placeholder="Any additional observations about collection conditions..."
              rows={3}
              maxCount={1000}
              enableCounter
            />
          </ExistingRegion>

          {/* Demo validate button */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button kind="ghost" size="sm">
              {t('button.back', 'Back')}
            </Button>
            <Button kind="primary" size="sm" onClick={validate}>
              {t('button.nextStep', 'Next: Collect Sample →')}
            </Button>
          </div>
        </Stack>
      </Tile>
    </div>
  );
}

// ── Scene 2: Step 2 Pre-population (carry-forward) ────────────────────────────

function SceneStep2() {
  const [uncertainty, setUncertainty] = useState('3.50');
  const [unitType, setUnitType] = useState('%');

  return (
    <div>
      <InlineNotification
        kind="info"
        title="S-03b carry-forward (ENV-3-002):"
        subtitle="Value entered in Step 1 is pre-populated here. Collector can confirm or override. Same field — no duplicate entry."
        lowContrast
        hideCloseButton
        style={{ marginBottom: '1.5rem' }}
      />

      <Tile style={{ padding: '1.5rem', maxWidth: 720 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.25rem',
          borderBottom: `1px solid ${C.gray20}`,
          paddingBottom: '0.75rem',
        }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Collection Conditions — Step 2
          </h4>
          <Tag kind="blue" size="sm">Environmental</Tag>
        </div>

        <Stack gap={5}>
          {/* Existing Step 2 fields dimmed */}
          <ExistingRegion>
            <Grid narrow>
              <Column sm={2} md={4}>
                <NumberInput id="s2-water-temp" label="Water Temperature (°C)"
                  value={22.5} />
              </Column>
              <Column sm={2} md={4}>
                <NumberInput id="s2-ambient-temp" label="Ambient Temperature (°C)"
                  value={28.0} />
              </Column>
              <Column sm={2} md={4}>
                <Select id="s2-weather" labelText="Weather Conditions">
                  <SelectItem value="cloudy" text="Cloudy" />
                </Select>
              </Column>
              <Column sm={2} md={4}>
                <Select id="s2-method" labelText="Collection Method">
                  <SelectItem value="grab" text="Manual Grab" />
                </Select>
              </Column>
              <Column sm={4} md={8}>
                <TextInput id="s2-preservation" labelText="Preservation Method"
                  value="HNO3 acidification, 4°C cooler" />
              </Column>
              <Column sm={4} md={8}>
                <TextInput id="s2-gps" labelText="GPS Coordinates (COL-3)"
                  value="-6.2088, 106.8456" />
              </Column>
            </Grid>
          </ExistingRegion>

          {/* Pre-populated Sampling Uncertainty */}
          <NewRegion label="S-03b — Pre-populated from Step 1 (FR-06)">
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: C.gray100, marginBottom: '0.375rem', letterSpacing: '0.16px',
              }}>
                {t('collectionConditions.samplingUncertainty.label', 'Sampling Uncertainty')}
                {' '}<span style={{ color: C.red60 }}>*</span>
                {' '}
                <span style={{
                  fontSize: 11, fontWeight: 400, color: C.gray50,
                  fontStyle: 'italic',
                }}>
                  — pre-filled from Step 1, editable
                </span>
              </label>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ width: 140 }}>
                  <NumberInput
                    id="s2-uncertainty-value"
                    hideLabel label=""
                    min={0.01} max={999.99} step={0.01}
                    value={uncertainty}
                    onChange={(e, { value }) => setUncertainty(String(value ?? ''))}
                  />
                </div>
                <div style={{ width: 180 }}>
                  <Select id="s2-unit" hideLabel labelText="Unit"
                    value={unitType} onChange={e => setUnitType(e.target.value)}>
                    <SelectItem value="%" text="Relative (%)" />
                    <SelectItem value="mg/L" text="mg/L" />
                    <SelectItem value="μg/L" text="μg/L" />
                    <SelectItem value="CFU/100 mL" text="CFU/100 mL" />
                    <SelectItem value="other" text="Other (free text)" />
                  </Select>
                </div>
                <Tag kind="teal" style={{ alignSelf: 'center', marginTop: 2 }}>
                  ± {uncertainty} {unitType}
                </Tag>
              </div>
              <p style={{ fontSize: 12, color: C.gray50, marginTop: '0.375rem', marginBottom: 0 }}>
                {t('collectionConditions.samplingUncertainty.helper',
                  'Field/sampling uncertainty — not analytical measurement uncertainty')}
              </p>
            </div>
          </NewRegion>

          <ExistingRegion label="S-03 EXISTING">
            <TextArea id="s2-notes" labelText="Field Notes" rows={2}
              value="Sampled during morning low-tide window, 07:15 WIB." />
          </ExistingRegion>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button kind="ghost" size="sm">Back</Button>
            <Button kind="primary" size="sm">Save Collection →</Button>
          </div>
        </Stack>
      </Tile>
    </div>
  );
}

// ── Scene 3: QA Review Completeness Warning (FR-09) ──────────────────────────

function SceneQA() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div>
      <InlineNotification
        kind="info"
        title="S-03b QA integration (FR-09):"
        subtitle="Sampling uncertainty is added to the ENV completeness check. Missing value surfaces as a warning (not hard block) alongside existing ENV completeness items."
        lowContrast
        hideCloseButton
        style={{ marginBottom: '1.5rem' }}
      />

      <Tile style={{ padding: '1.5rem', maxWidth: 720 }}>
        <h4 style={{ margin: '0 0 1rem', fontSize: 16, fontWeight: 600 }}>
          QA Review — Environmental Completeness Checks
        </h4>

        {/* Existing completeness checks — dimmed */}
        <ExistingRegion>
          <Stack gap={3}>
            {[
              { label: 'GPS coordinates recorded', ok: true },
              { label: 'Sampling site linked to order', ok: true },
              { label: 'Compliance standard selected', ok: true },
              { label: 'Collection method specified', ok: true },
            ].map(({ label, ok }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <Tag kind={ok ? 'green' : 'red'} size="sm">
                  {ok ? '✓' : '✗'}
                </Tag>
                <span style={{ fontSize: 14, color: C.gray70 }}>{label}</span>
              </div>
            ))}
          </Stack>
        </ExistingRegion>

        {/* New: Sampling Uncertainty completeness warning */}
        {!dismissed && (
          <NewRegion label="S-03b NEW — FR-09" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Tag kind="warm-gray" size="sm">⚠</Tag>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.gray100 }}>
                  Sampling uncertainty not recorded
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: 13, color: C.gray70 }}>
                  This field is required for this program. The order can proceed, but the Laporan Hasil
                  will be incomplete. Please enter a value before generating the report.
                </p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <Button kind="primary" size="sm">
                    Go to Collection Conditions
                  </Button>
                  <Button kind="ghost" size="sm" onClick={() => setDismissed(true)}>
                    Acknowledge &amp; continue
                  </Button>
                </div>
              </div>
            </div>
          </NewRegion>
        )}

        {dismissed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginTop: '1rem', padding: '0.75rem',
            background: C.gray10, borderRadius: 4,
          }}>
            <Tag kind="warm-gray" size="sm">⚠</Tag>
            <span style={{ fontSize: 13, color: C.gray70, fontStyle: 'italic' }}>
              Sampling uncertainty warning acknowledged by QA officer.
            </span>
          </div>
        )}
      </Tile>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

const SCENES = [
  { id: 'step1', label: 'Step 1 — Enter Order (Collection Conditions)' },
  { id: 'step2', label: 'Step 2 — Collect Sample (carry-forward)' },
  { id: 'qa',    label: 'QA Review — Completeness Check' },
];

export default function App() {
  const [scene, setScene] = useState('step1');

  return (
    <div style={{
      fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
      minHeight: '100vh',
      background: '#f4f4f4',
    }}>
      {/* Header */}
      <div style={{
        background: '#0f62fe', color: '#fff',
        padding: '0.75rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.8, fontFamily: 'monospace' }}>
            S-03b Mockup · OGC-537 Addendum
          </div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>
            Sampling Uncertainty Field — Collection Conditions
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{
            background: '#f1c21b', color: '#161616',
            fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
            padding: '3px 8px', borderRadius: 3,
          }}>
            S-03b NEW
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
            padding: '3px 8px', borderRadius: 3,
          }}>
            S-03 EXISTING (context only)
          </span>
        </div>
      </div>

      {/* Scene tabs */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex', gap: 0,
        padding: '0 1.5rem',
      }}>
        {SCENES.map(s => (
          <button
            key={s.id}
            onClick={() => setScene(s.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.875rem 1.25rem',
              fontSize: 14, color: scene === s.id ? '#0f62fe' : '#525252',
              fontWeight: scene === s.id ? 600 : 400,
              borderBottom: scene === s.id ? '3px solid #0f62fe' : '3px solid transparent',
              transition: 'color 0.1s',
              fontFamily: 'inherit',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Scene content */}
      <div style={{ padding: '1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        {scene === 'step1' && <SceneStep1 />}
        {scene === 'step2' && <SceneStep2 />}
        {scene === 'qa'    && <SceneQA />}
      </div>
    </div>
  );
}
