/**
 * S-05b — Final Storage Disposition FHIR Publishing
 * Addendum to S-05: Compliance Evaluation Engine (OGC-547)
 *
 * SCOPE ANNOTATION CONVENTION:
 *   Gold dashed border + "S-05b NEW" badge → new in this addendum
 *   Dimmed (72% opacity) + "EXISTING" badge → existing content for context only
 *
 * Two scenes:
 *   1. Disposition → FHIR Push Flow  — end-to-end flow diagram with live simulation
 *   2. FHIR Specimen Payload Explorer — interactive JSON viewer for the Specimen resource
 */

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  gold20: '#fdd13a', gold40: '#f1c21b', gold60: '#b28600',
  blue60: '#0f62fe', blue70: '#0043ce', blue10: '#edf5ff', blue20: '#d0e2ff',
  green50: '#defbe6', green60: '#198038',
  red10: '#fff1f1', red60: '#da1e28',
  teal10: '#d9fbfb', teal60: '#007d79',
  purple10: '#f6f2ff', purple60: '#8a3ffc',
  cyan10: '#e5f6ff', cyan60: '#00539a',
  yellow10: '#fdf4c4', yellow70: '#8e6a00',
  gray10: '#f4f4f4', gray20: '#e0e0e0', gray30: '#c6c6c6',
  gray50: '#8d8d8d', gray70: '#525252', gray90: '#262626', gray100: '#161616',
  white: '#ffffff', border: '#e0e0e0',
  topBarBg: '#161616',
};

const TAG_STYLES = {
  green:  { bg: C.green50,  color: C.green60,  border: '#a7f0ba' },
  red:    { bg: C.red10,    color: C.red60,    border: '#ffa4a9' },
  teal:   { bg: C.teal10,   color: C.teal60,   border: '#9ef0f0' },
  blue:   { bg: C.blue10,   color: C.blue70,   border: C.blue20 },
  purple: { bg: C.purple10, color: C.purple60, border: '#d4bbff' },
  cyan:   { bg: C.cyan10,   color: C.cyan60,   border: '#bae6ff' },
  gray:   { bg: C.gray10,   color: C.gray70,   border: C.gray30 },
  gold:   { bg: C.yellow10, color: C.gold60,   border: C.gold40 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE ANNOTATION PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function NewBadge({ label = 'S-05b NEW' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: C.gold40, color: C.gray100,
      fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
      padding: '2px 7px', borderRadius: 3,
      letterSpacing: '0.04em', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
    }}>{label}</span>
  );
}

function ExistingBadge({ label = 'EXISTING' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: C.gray20, color: C.gray70,
      fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
      padding: '2px 7px', borderRadius: 3, letterSpacing: '0.04em',
    }}>{label}</span>
  );
}

function NewRegion({ children, label = 'S-05b NEW', style = {} }) {
  return (
    <div style={{
      position: 'relative', border: `2px dashed ${C.gold40}`,
      borderRadius: 6, padding: '1.25rem 1rem 1rem',
      background: 'rgba(253,209,58,0.04)', ...style,
    }}>
      <span style={{ position: 'absolute', top: -10, left: 12, background: C.white, padding: '0 6px' }}>
        <NewBadge label={label} />
      </span>
      {children}
    </div>
  );
}

function ExistingBox({ children, label = 'EXISTING', style = {} }) {
  return (
    <div style={{
      border: `1.5px solid ${C.gray20}`, borderRadius: 4, padding: '12px 16px',
      opacity: 0.72, background: C.white, position: 'relative', ...style,
    }}>
      <span style={{ position: 'absolute', top: -10, left: 12, background: C.white, padding: '0 6px' }}>
        <ExistingBadge label={label} />
      </span>
      {children}
    </div>
  );
}

function Tag({ kind = 'gray', children }) {
  const s = TAG_STYLES[kind] || TAG_STYLES.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Btn({ children, kind = 'primary', onClick, disabled, small, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '6px 12px' : '10px 20px',
    borderRadius: 2, fontSize: small ? 12 : 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
  };
  const variants = {
    primary:   { ...base, background: disabled ? C.gray30 : C.blue60, color: C.white },
    secondary: { ...base, background: C.gray10, color: C.gray90, border: `1px solid ${C.gray30}` },
    ghost:     { ...base, background: 'transparent', color: C.blue60 },
    tertiary:  { ...base, background: 'transparent', color: C.blue60, border: `1px solid ${C.blue60}` },
  };
  return <button style={{ ...(variants[kind] || base), ...style }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function PageShell({ title, subtitle, breadcrumb, children }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", background: C.gray10, minHeight: '100%' }}>
      <div style={{ background: C.topBarBg, height: 48, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <span style={{ color: C.gray10, fontWeight: 700, fontSize: 15 }}>OpenELIS Global</span>
        {breadcrumb && <span style={{ color: C.gray50, fontSize: 13, marginLeft: 24 }}>{breadcrumb}</span>}
      </div>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '20px 32px 16px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.gray100 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: C.gray70, marginTop: 4 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 32 }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — DISPOSITION → FHIR PUSH FLOW
// ─────────────────────────────────────────────────────────────────────────────

const DISPOSITION_OPTIONS = [
  { value: 'biorepository', label: 'Biorepository', fhirStatus: 'available', tag: 'teal', icon: '🗄' },
  { value: 'disposed', label: 'Disposed / Destroyed', fhirStatus: 'unavailable', tag: 'red', icon: '🗑' },
  { value: 'temporary', label: 'Temporary Storage', fhirStatus: null, tag: 'gray', icon: '📦' },
];

const PUSH_STEPS = [
  { id: 'openellis', label: 'OpenELIS Storage Module', icon: '💾', color: C.gray70 },
  { id: 'event', label: 'SPECIMEN_DISPOSITION_FINAL event', icon: '⚡', color: C.gold60, isNew: true },
  { id: 'queue', label: 'Async FHIR Push Queue (3× retry)', icon: '📤', color: C.blue60, isNew: true },
  { id: 'hapi', label: 'HAPI FHIR Server (OHS)', icon: '🔷', color: C.purple60 },
  { id: 'etl', label: 'OHS SQL-on-FHIR ETL', icon: '🔄', color: C.teal60 },
  { id: 'dashboard', label: 'Future Dashboard Queries', icon: '📊', color: C.gray50 },
];

function SceneFlow() {
  const [disposition, setDisposition] = useState('biorepository');
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [done, setDone] = useState(false);
  const [pushLog, setPushLog] = useState(null);

  const selected = DISPOSITION_OPTIONS.find(d => d.value === disposition);
  const willPush = disposition !== 'temporary';

  async function simulate() {
    setRunning(true);
    setDone(false);
    setPushLog(null);
    const steps = willPush
      ? ['openells', 'event', 'queue', 'hapi', 'etl']
      : ['openells', 'skip'];

    const stepsToRun = willPush
      ? ['openells', 'event', 'queue', 'hapi', 'etl']
      : ['openells'];

    for (let i = 0; i < stepsToRun.length; i++) {
      setActiveStep(i);
      await new Promise(r => setTimeout(r, 700));
    }
    setActiveStep(null);
    setDone(true);
    setRunning(false);

    if (willPush) {
      setPushLog({
        eventType: 'SPECIMEN_DISPOSITION_FINAL',
        sampleId: 'ENV-2026-00841-S1',
        fhirSpecimenId: 'Specimen/openelis-env-2026-00841-s1',
        fhirStatus: selected.fhirStatus,
        dispositionType: selected.value,
        pushedAt: new Date().toLocaleTimeString(),
        status: 'SUCCESS',
      });
    }
  }

  const stepStyle = (i, total) => ({
    display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0,
  });

  return (
    <PageShell
      title="Final Storage Disposition — FHIR Publishing Flow"
      breadcrumb="Storage → Sample Disposition"
      subtitle="S-05b adds a FHIR Specimen update to the existing disposition save event for ENV/Vector samples."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left: disposition selector (existing UI context) */}
        <div>
          <ExistingBox label="EXISTING — Disposition UI (Storage Module)" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.gray100, marginBottom: 12 }}>
              Record Final Disposition
            </div>
            <div style={{ fontSize: 12, color: C.gray70, marginBottom: 8 }}>Sample: ENV-2026-00841-S1</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DISPOSITION_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 3, border: `1.5px solid ${disposition === opt.value ? C.blue60 : C.gray20}`, background: disposition === opt.value ? C.blue10 : C.white }}>
                  <input type="radio" name="disp" value={opt.value} checked={disposition === opt.value} onChange={() => { setDisposition(opt.value); setDone(false); setActiveStep(null); setPushLog(null); }} style={{ accentColor: C.blue60 }} />
                  <span style={{ fontSize: 16 }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.gray100 }}>{opt.label}</div>
                    {opt.fhirStatus
                      ? <div style={{ fontSize: 11, color: C.gray50 }}>FHIR: Specimen.status = <code style={{ fontFamily: 'monospace' }}>{opt.fhirStatus}</code></div>
                      : <div style={{ fontSize: 11, color: C.gray50 }}>No FHIR push — temporary, not final</div>
                    }
                  </div>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Btn kind="primary" small onClick={simulate} disabled={running}>
                {running ? 'Saving…' : 'Save Disposition'}
              </Btn>
            </div>
          </ExistingBox>

          {/* S-05b callout */}
          <NewRegion label="S-05b NEW — What fires after save">
            {disposition === 'temporary' ? (
              <div style={{ fontSize: 13, color: C.gray70 }}>
                <strong>Temporary</strong> storage does not trigger a FHIR push.
                FHIR push fires only on <Tag kind="teal">Biorepository</Tag> or <Tag kind="red">Disposed</Tag>.
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.gray90 }}>
                <code style={{ fontFamily: 'monospace', fontSize: 12, background: C.yellow10, padding: '2px 6px', borderRadius: 3 }}>SPECIMEN_DISPOSITION_FINAL</code> event fires →
                async FHIR push queue → <strong>HAPI FHIR Specimen update</strong>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: C.gray70 }}>Specimen.status:</span>
                  <Tag kind={selected.tag}>{selected.fhirStatus}</Tag>
                  <Tag kind="gold">+ specimen-final-disposition ext</Tag>
                </div>
              </div>
            )}
          </NewRegion>
        </div>

        {/* Right: flow diagram */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.gray100, marginBottom: 20 }}>
            End-to-End Pipeline
          </div>

          {/* Step flow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {PUSH_STEPS.map((step, i) => {
              const isActive = running && activeStep === i;
              const isDone2 = done && i <= (willPush ? 3 : 0);
              const isSkipped = !willPush && i > 0;
              const isFuture = step.id === 'dashboard';

              return (
                <div key={step.id}>
                  {/* Step box */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 20px', borderRadius: 6,
                    border: `2px solid ${isActive ? C.blue60 : isDone2 ? C.green60 : step.isNew ? C.gold40 : C.gray20}`,
                    background: isActive ? C.blue10 : isDone2 ? C.green50 : step.isNew ? C.yellow10 : isSkipped ? C.gray10 : C.white,
                    opacity: isSkipped ? 0.4 : isFuture ? 0.55 : 1,
                    transition: 'all 0.3s',
                  }}>
                    <span style={{ fontSize: 22 }}>{step.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.gray100 }}>{step.label}</span>
                        {step.isNew && <NewBadge />}
                        {isFuture && <Tag kind="gray">Future — no changes in v1.0</Tag>}
                      </div>
                      {step.id === 'event' && (
                        <div style={{ fontSize: 11, color: C.gray70, marginTop: 3 }}>
                          Fired only for <Tag kind="teal">Biorepository</Tag> or <Tag kind="red">Disposed</Tag> — not Temporary
                        </div>
                      )}
                      {step.id === 'queue' && (
                        <div style={{ fontSize: 11, color: C.gray70, marginTop: 3 }}>
                          Same queue as V-04 vector FHIR pushes · 3× retry · delivery logging
                        </div>
                      )}
                      {step.id === 'hapi' && (
                        <div style={{ fontSize: 11, color: C.gray70, marginTop: 3 }}>
                          PUT Specimen/{`<id>`} — updates status + specimen-final-disposition extension
                        </div>
                      )}
                      {step.id === 'etl' && (
                        <div style={{ fontSize: 11, color: C.gray70, marginTop: 3 }}>
                          OHS SQL-on-FHIR views — query pattern provided in §7 of FRS (no ETL changes in v1.0)
                        </div>
                      )}
                      {step.id === 'dashboard' && (
                        <div style={{ fontSize: 11, color: C.gray70, marginTop: 3 }}>
                          Future: disposal rate by month, biorepository utilisation, sample lifecycle trends
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 80, textAlign: 'right' }}>
                      {isActive && <span style={{ color: C.blue60, fontSize: 13 }}>⏳ pushing…</span>}
                      {isDone2 && !isActive && <span style={{ color: C.green60, fontSize: 16 }}>✓</span>}
                      {isSkipped && <span style={{ color: C.gray50, fontSize: 12 }}>skipped</span>}
                    </div>
                  </div>
                  {/* Connector arrow */}
                  {i < PUSH_STEPS.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0', color: C.gray30, fontSize: 20 }}>↓</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Push log */}
          {pushLog && (
            <div style={{ marginTop: 24, background: C.gray100, borderRadius: 4, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.green50, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✓ FHIR push logged
                <NewBadge label="S-05b NEW" />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#d4d4d4', lineHeight: 1.8 }}>
                {JSON.stringify(pushLog, null, 2).split('\n').map((line, i) => (
                  <div key={i} style={{ color: line.includes('SUCCESS') ? '#a6e22e' : line.includes('FHIR') || line.includes('disposition') ? '#e6db74' : '#d4d4d4' }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {done && !willPush && (
            <div style={{ marginTop: 24, padding: '12px 16px', background: C.gray10, borderRadius: 4, fontSize: 13, color: C.gray70 }}>
              Temporary storage saved in OpenELIS. No FHIR push — not a final disposition.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — FHIR SPECIMEN PAYLOAD EXPLORER
// ─────────────────────────────────────────────────────────────────────────────

function ScenePayload() {
  const [disposition, setDisposition] = useState('biorepository');
  const [expandedSections, setExpandedSections] = useState({ status: true, extension: true, existing: false });

  const isBiorepository = disposition === 'biorepository';

  function toggle(key) {
    setExpandedSections(p => ({ ...p, [key]: !p[key] }));
  }

  const bioExtension = {
    "url": "https://openelis-global.org/fhir/StructureDefinition/specimen-final-disposition",
    "extension": [
      { "url": "dispositionType", "valueCode": "biorepository" },
      { "url": "dispositionDate", "valueDate": "2026-04-20" },
      { "url": "storageLocation", "valueString": "BLHD-REPO-BOX-A14-POS-07" },
      { "url": "disposedBy", "valueReference": { "reference": "Practitioner/openelis-user-142" } },
      { "url": "dispositionNotes", "valueString": "Long-term archival per PP 82/2001 retention schedule" },
    ]
  };

  const disposedExtension = {
    "url": "https://openelis-global.org/fhir/StructureDefinition/specimen-final-disposition",
    "extension": [
      { "url": "dispositionType", "valueCode": "disposed" },
      { "url": "dispositionDate", "valueDate": "2026-04-20" },
      { "url": "disposedBy", "valueReference": { "reference": "Practitioner/openelis-user-142" } },
      { "url": "dispositionNotes", "valueString": "Exceeded holding time — disposed per lab SOP" },
    ]
  };

  const dispExt = isBiorepository ? bioExtension : disposedExtension;

  const specimen = {
    "resourceType": "Specimen",
    "id": "openelis-env-2026-00841-s1",
    "status": isBiorepository ? "available" : "unavailable",
    "identifier": [{ "system": "https://openelis-global.org/fhir/NamingSystem/specimen-id", "value": "ENV-2026-00841-S1" }],
    "subject": { "reference": "ServiceRequest/openelis-env-2026-00841" },
    "collection": {
      "collectedDateTime": "2026-04-15T09:00:00+07:00",
      "collector": { "reference": "Practitioner/openelis-user-097" },
      "bodySite": { "text": "Sungai Ciliwung — KM 42" }
    },
    "extension": [dispExt]
  };

  function JsonLine({ indent = 0, keyName, value, isNew, isLast = true }) {
    const pad = '  '.repeat(indent);
    const valStr = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        <span style={{ color: '#75715e', minWidth: 20, userSelect: 'none', fontSize: 11, lineHeight: '20px' }}></span>
        <span style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: '20px' }}>
          <span style={{ color: '#75715e' }}>{pad}</span>
          {keyName && <span style={{ color: '#e6db74' }}>"{keyName}": </span>}
          <span style={{ color: isNew ? C.gold40 : typeof value === 'string' ? '#a6e22e' : '#fd971f' }}>
            {valStr}
          </span>
          {!isLast && <span style={{ color: '#d4d4d4' }}>,</span>}
        </span>
        {isNew && (
          <span style={{ marginLeft: 8, marginTop: 3, flexShrink: 0 }}>
            <NewBadge label="S-05b" />
          </span>
        )}
      </div>
    );
  }

  const sectionStyle = (expanded) => ({
    background: C.gray100, borderRadius: 4, overflow: 'hidden',
    marginBottom: 12, border: `1px solid ${C.gray90}`,
  });

  const sectionHeader = (label, key, isNew, count) => (
    <div
      onClick={() => toggle(key)}
      style={{
        padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        background: isNew ? 'rgba(241,194,27,0.12)' : C.gray90,
        borderBottom: expandedSections[key] ? `1px solid ${C.gray90}` : 'none',
      }}
    >
      <span style={{ color: C.gray50, fontFamily: 'monospace', fontSize: 11 }}>{expandedSections[key] ? '▼' : '▶'}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: isNew ? C.gold40 : '#e6db74', fontWeight: 600 }}>{label}</span>
      {isNew && <NewBadge label="S-05b NEW" />}
      {count && <span style={{ fontSize: 11, color: C.gray50 }}>{count}</span>}
    </div>
  );

  return (
    <PageShell
      title="FHIR Specimen Payload — specimen-final-disposition Extension"
      breadcrumb="HAPI FHIR R4 · PUT Specimen/{id}"
      subtitle="Interactive view of the Specimen resource as pushed to the OHS HAPI FHIR server. Toggle disposition type to compare payloads."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: controls */}
        <div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.gray100, marginBottom: 12 }}>Disposition Type</div>
            {[
              { value: 'biorepository', label: 'Biorepository', fhirStatus: 'available' },
              { value: 'disposed', label: 'Disposed', fhirStatus: 'unavailable' },
            ].map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
                <input type="radio" name="disp2" value={opt.value} checked={disposition === opt.value} onChange={() => setDisposition(opt.value)} style={{ accentColor: C.blue60 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: C.gray50 }}>status: <code style={{ fontFamily: 'monospace' }}>{opt.fhirStatus}</code></div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gray100, marginBottom: 12 }}>Extension Fields</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { field: 'dispositionType', required: true, note: 'disposed | biorepository' },
                { field: 'dispositionDate', required: true, note: 'Date recorded in OpenELIS' },
                { field: 'storageLocation', required: false, note: 'Biorepository only' },
                { field: 'disposedBy', required: false, note: 'Practitioner reference' },
                { field: 'dispositionNotes', required: false, note: 'Free text, max 500' },
              ].map(({ field, required, note }) => (
                <div key={field} style={{ padding: '8px 10px', background: C.gray10, borderRadius: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <code style={{ fontFamily: 'monospace', fontSize: 11, color: C.gold60 }}>{field}</code>
                    {required && <span style={{ fontSize: 10, color: C.red60, fontWeight: 700 }}>*</span>}
                    {!isBiorepository && field === 'storageLocation' && <Tag kind="gray">omitted</Tag>}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray50, marginTop: 2 }}>{note}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: C.gray50 }}>
              Extension URL namespace: <br />
              <code style={{ fontFamily: 'monospace', fontSize: 10, wordBreak: 'break-all' }}>https://openelis-global.org/fhir/</code>
            </div>
          </div>
        </div>

        {/* Right: JSON payload */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <code style={{ fontFamily: 'monospace', fontSize: 12, background: C.gray90, color: '#a6e22e', padding: '4px 12px', borderRadius: 3 }}>
              PUT /fhir/Specimen/openelis-env-2026-00841-s1
            </code>
            <Tag kind={isBiorepository ? 'teal' : 'red'}>{isBiorepository ? 'available' : 'unavailable'}</Tag>
          </div>

          {/* Status section */}
          <div style={sectionStyle(expandedSections.status)}>
            {sectionHeader('"status" (updated)', 'status', true)}
            {expandedSections.status && (
              <div style={{ padding: '12px 16px' }}>
                <JsonLine keyName="status" value={isBiorepository ? 'available' : 'unavailable'} isNew />
                <div style={{ fontSize: 11, color: C.gray50, marginTop: 6, fontFamily: 'monospace' }}>
                  // FHIR R4: available = accessible in biorepository<br />
                  // unavailable = no longer accessible (disposed/destroyed)
                </div>
              </div>
            )}
          </div>

          {/* Existing fields section */}
          <div style={sectionStyle(expandedSections.existing)}>
            {sectionHeader('"identifier", "subject", "collection" (unchanged)', 'existing', false, '— existing fields')}
            {expandedSections.existing && (
              <div style={{ padding: '12px 16px', opacity: 0.7 }}>
                {['identifier', 'subject', 'collection'].map(key => (
                  <div key={key} style={{ fontFamily: 'monospace', fontSize: 12, color: '#d4d4d4', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>"{key}": <span style={{ color: '#75715e' }}>{'{ ... }'}</span></span>
                    <ExistingBadge label="V-04 mapping" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extension section */}
          <div style={sectionStyle(expandedSections.extension)}>
            {sectionHeader('"extension" — specimen-final-disposition', 'extension', true)}
            {expandedSections.extension && (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#d4d4d4', lineHeight: 1.8 }}>
                  <div><span style={{ color: '#e6db74' }}>"extension"</span>: {'['}</div>
                  <div style={{ marginLeft: 16 }}>{'{'}</div>
                  <div style={{ marginLeft: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span><span style={{ color: '#e6db74' }}>"url"</span>: <span style={{ color: '#a6e22e' }}>"…/specimen-final-disposition"</span>,</span>
                  </div>
                  <div style={{ marginLeft: 32 }}><span style={{ color: '#e6db74' }}>"extension"</span>: {'['}</div>

                  {dispExt.extension.map((sub, i) => {
                    const isStorageAndDisposed = sub.url === 'storageLocation' && !isBiorepository;
                    const valKey = Object.keys(sub).find(k => k !== 'url');
                    const val = typeof sub[valKey] === 'object' ? JSON.stringify(sub[valKey]) : sub[valKey];
                    return (
                      <div key={i} style={{ marginLeft: 56, opacity: isStorageAndDisposed ? 0.35 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span>{'{'} <span style={{ color: '#e6db74' }}>"url"</span>: <span style={{ color: C.gold40 }}>"{sub.url}"</span>, <span style={{ color: '#e6db74' }}>"{valKey}"</span>: <span style={{ color: '#a6e22e' }}>"{val}"</span> {'}'},</span>
                          <NewBadge label="S-05b" />
                          {isStorageAndDisposed && <Tag kind="gray">omitted if disposed</Tag>}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginLeft: 32 }}>{']'}</div>
                  <div style={{ marginLeft: 16 }}>{'}'}</div>
                  <div>{']'}</div>
                </div>
              </div>
            )}
          </div>

          {/* CodeSystem callout */}
          <div style={{
            padding: '14px 16px', borderRadius: 4,
            borderLeft: `4px solid ${C.gold40}`, background: C.yellow10,
            fontSize: 12, color: C.gray90,
          }}>
            <strong>One-time deployment step:</strong> Load <code style={{ fontFamily: 'monospace', fontSize: 11 }}>specimen-final-disposition</code> StructureDefinition and <code style={{ fontFamily: 'monospace', fontSize: 11 }}>specimen-disposition-type</code> CodeSystem to HAPI FHIR before first push. Confirm extension URL conventions with V-04 FHIR review (OGC-586) before implementation.
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────

const SCENES = [
  { id: 1, label: 'Disposition → FHIR Push Flow', sub: 'End-to-end pipeline with live simulation' },
  { id: 2, label: 'FHIR Specimen Payload', sub: 'Interactive JSON explorer — specimen-final-disposition extension' },
];

export default function App() {
  const [scene, setScene] = useState(1);

  const navBtnStyle = (active) => ({
    padding: '10px 20px', fontSize: 13, fontWeight: active ? 700 : 400,
    cursor: 'pointer', border: 'none',
    borderBottom: active ? `3px solid ${C.gold40}` : `3px solid transparent`,
    background: active ? C.yellow10 : C.gray10,
    color: active ? C.gold60 : C.gray70,
    transition: 'all 0.15s', textAlign: 'left',
  });

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", minHeight: '100vh', background: C.gray10 }}>
      {/* Header */}
      <div style={{
        background: C.gray100, padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `3px solid ${C.gold40}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: C.white, fontWeight: 700, fontSize: 16 }}>S-05b — Final Storage Disposition FHIR Publishing</span>
            <NewBadge />
          </div>
          <div style={{ color: C.gray50, fontSize: 12, marginTop: 4 }}>
            Addendum to S-05 (Compliance Evaluation) · OGC-527 Layer 4 · Same HAPI FHIR server as V-04 · Must Have, Phase 1 (Bogor)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag kind="gold">Draft</Tag>
          <Tag kind="gray">v1.0</Tag>
        </div>
      </div>

      {/* Scene nav */}
      <div style={{ background: C.gray10, borderBottom: `1px solid ${C.border}`, display: 'flex', overflowX: 'auto' }}>
        {SCENES.map(s => (
          <button key={s.id} style={navBtnStyle(scene === s.id)} onClick={() => setScene(s.id)}>
            <div>Scene {s.id}: {s.label}</div>
            <div style={{ fontSize: 11, color: C.gray50, fontWeight: 400, marginTop: 2 }}>{s.sub}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {scene === 1 && <SceneFlow />}
        {scene === 2 && <ScenePayload />}
      </div>
    </div>
  );
}
