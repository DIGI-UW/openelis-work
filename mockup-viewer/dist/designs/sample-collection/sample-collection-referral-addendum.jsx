/**
 * OpenELIS Sample Collection Redesign — Addendum Mockup
 * Step 3 (Label & Store) with Refer Out integrated alongside Print Labels and Storage Assignment
 *
 * Design model: SAMPLE-LEVEL referral.
 *   - One row per physical sample (not per test).
 *   - Tests on each sample shown as Carbon Tags within the row.
 *   - Referring a sample carries every test on it to the same external lab.
 *   - Per-test referral inside a single sample is blocked by design (BR-REF-7).
 *
 * Source FRS: sample-collection-referral-addendum-frs-v2.1.md
 *   LBL-5…LBL-14, REF-1…REF-8, DSH-10…DSH-13, BR-REF-1…BR-REF-7
 *
 * Uses @carbon/react (Carbon v11) and @carbon/icons-react.
 * Constitution principle 3: inline row expansion for non-destructive actions; modal only for bulk.
 */

import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  ComboBox,
  DataTable,
  DatePicker,
  DatePickerInput,
  Dropdown,
  InlineNotification,
  Modal,
  NumberInput,
  OverflowMenu,
  OverflowMenuItem,
  Tag,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TextArea,
  TextInput,
  Tile,
  Tooltip,
} from '@carbon/react';
import {
  Add,
  ChevronDown,
  ChevronUp,
  Printer,
  Send,
  ArrowRight,
  Undo,
  Warning,
} from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// Mock data — Indonesian VL / ENV context
// ---------------------------------------------------------------------------

const REFERRING_LABS = [
  { id: 'lab-bbtkl-jkt', name: 'BBTKL Jakarta', fhirEnabled: true,  tat: '5 days' },
  { id: 'lab-eijkman',   name: 'Eijkman Institute', fhirEnabled: true,  tat: '3 days' },
  { id: 'lab-prodia',    name: 'Prodia Reference Lab', fhirEnabled: false, tat: '7 days' },
  { id: 'lab-silnas',    name: 'SILNAS Bandung', fhirEnabled: true,  tat: '4 days' },
];

const ORDER = {
  labNumber: '2026-00412',
  patientName: 'Siti Rahayu',
  patientId: 'P-88103',
  facility: 'Puskesmas Kebayoran',
  priority: 'Routine',
  collectedAt: '2026-04-22 09:14',
};

// One row per physical sample. Tests carried as chip list.
const INITIAL_SAMPLES = [
  {
    id: 'S.2026-00412.1',
    type: 'Whole Blood (EDTA)',
    quantity: '4 mL',
    collectedAt: '2026-04-22 09:14',
    tests: [
      { code: 'VL',       name: 'HIV Viral Load' },
      { code: 'CD4',      name: 'CD4 Count' },
    ],
    storage: { freezer: 'F-02', shelf: 'S-3', box: 'B-14', position: 'A4' },
    labelsToPrint: 2,
    referral: null,
  },
  {
    id: 'S.2026-00412.2',
    type: 'Plasma',
    quantity: '2 mL',
    collectedAt: '2026-04-22 09:18',
    tests: [
      { code: 'HBVDNA',   name: 'Hepatitis B DNA PCR' },
      { code: 'HCV_AB',   name: 'HCV Antibody' },
    ],
    storage: { freezer: 'F-04', shelf: 'S-1', box: 'B-07', position: 'C2' },
    labelsToPrint: 1,
    referral: null,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusTag = (referral) => {
  if (!referral) return <Tag type="gray">In-house</Tag>;
  if (referral.state === 'REFERRED')  return <Tag type="purple">Referred — {referral.labName}</Tag>;
  if (referral.state === 'SENT')      return <Tag type="blue">Sent to External — {referral.labName}</Tag>;
  if (referral.state === 'AWAITING')  return <Tag type="blue">Awaiting External Results — {referral.labName}</Tag>;
  if (referral.state === 'SEND_FAIL') return <Tag type="red">Send Failed — Retry</Tag>;
  return <Tag type="gray">In-house</Tag>;
};

const countReferredSamples = (samples) =>
  samples.filter(s => s.referral && s.referral.state !== 'VOIDED').length;

const countInHouseSamples = (samples) =>
  samples.filter(s => !s.referral || s.referral.state === 'VOIDED').length;

const flattenInHouseTests = (samples) =>
  samples
    .filter(s => !s.referral || s.referral.state === 'VOIDED')
    .flatMap(s => s.tests);

// ---------------------------------------------------------------------------
// Per-sample inline refer-out form (LBL-6)
// ---------------------------------------------------------------------------

function InlineReferSampleForm({ sample, onCancel, onSave }) {
  const [labId, setLabId]   = useState(null);
  const [reason, setReason] = useState('');
  const [expected, setExpected] = useState('');
  const [notify, setNotify] = useState(true);
  const labObj = REFERRING_LABS.find(l => l.id === labId) || null;

  return (
    <div style={{ padding: '1rem 1.5rem', background: '#f4f4f4', borderLeft: '4px solid #8a3ffc' }}>
      <h5 style={{ marginBottom: '0.75rem' }}>
        Refer Sample to External Lab
      </h5>

      <InlineNotification
        kind="info"
        lowContrast
        hideCloseButton
        title="Sample-level referral"
        subtitle={`This will refer ${sample.type} (${sample.id}) and all ${sample.tests.length} tests on it: ${sample.tests.map(t => t.name).join(', ')}.`}
        style={{ marginBottom: '1rem', maxWidth: '100%' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <ComboBox
          id={`refer-lab-${sample.id}`}
          titleText="Referring Lab (required)"
          placeholder="Search external labs…"
          items={REFERRING_LABS}
          itemToString={(item) => (item ? item.name : '')}
          onChange={({ selectedItem }) => setLabId(selectedItem ? selectedItem.id : null)}
        />
        <DatePicker datePickerType="single" onChange={(d) => setExpected(d?.[0]?.toISOString?.() || '')}>
          <DatePickerInput
            id={`refer-expected-${sample.id}`}
            labelText="Expected Return Date (optional)"
            placeholder="yyyy-mm-dd"
          />
        </DatePicker>
      </div>

      <TextArea
        id={`refer-reason-${sample.id}`}
        labelText="Reason (optional)"
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ marginTop: '1rem' }}
      />

      <Checkbox
        id={`refer-notify-${sample.id}`}
        labelText="Notify customer of referral (X-01 REFERRAL_OUT event)"
        checked={notify}
        onChange={(_, { checked }) => setNotify(checked)}
        style={{ marginTop: '0.75rem' }}
      />

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Button
          kind="primary"
          renderIcon={Send}
          disabled={!labId}
          onClick={() => onSave({
            labId,
            labName: labObj?.name,
            reason,
            expected,
            notify,
            fhirEnabled: !!labObj?.fhirEnabled,
          })}
        >
          Save Referral
        </Button>
        <Button kind="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bulk refer-out modal (LBL-7)
// ---------------------------------------------------------------------------

function BulkReferModal({ open, samples, onClose, onConfirm }) {
  const [labId, setLabId] = useState(null);
  const [reason, setReason] = useState('');
  const [expected, setExpected] = useState('');
  const [notify, setNotify] = useState(true);

  const inHouseSamples = samples.filter(s => !s.referral || s.referral.state === 'VOIDED');
  const labObj = REFERRING_LABS.find(l => l.id === labId) || null;
  const sampleCount = inHouseSamples.length;
  const testCount   = inHouseSamples.reduce((sum, s) => sum + s.tests.length, 0);
  const sampleListText = inHouseSamples.map(s => `${s.type} (${s.id})`).join(', ');

  return (
    <Modal
      open={open}
      modalHeading="Refer All In-House Samples to External Lab"
      primaryButtonText="Refer All"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!labId || sampleCount === 0}
      onRequestClose={onClose}
      onRequestSubmit={() => onConfirm({
        labId,
        labName: labObj?.name,
        reason,
        expected,
        notify,
        fhirEnabled: !!labObj?.fhirEnabled,
      })}
    >
      <InlineNotification
        kind={sampleCount === 0 ? 'warning' : 'info'}
        lowContrast
        hideCloseButton
        title={sampleCount === 0 ? 'Nothing to refer' : `${sampleCount} samples / ${testCount} tests`}
        subtitle={sampleCount === 0
          ? 'All samples on this order are already referred.'
          : `This will refer ${sampleListText} and every test on them to the selected lab. Every physical specimen moves to the external site.`}
        style={{ marginBottom: '1rem' }}
      />

      <ComboBox
        id="bulk-refer-lab"
        titleText="Referring Lab (required)"
        placeholder="Search external labs…"
        items={REFERRING_LABS}
        itemToString={(item) => (item ? `${item.name}${item.fhirEnabled ? ' (FHIR)' : ''} • TAT ${item.tat}` : '')}
        onChange={({ selectedItem }) => setLabId(selectedItem ? selectedItem.id : null)}
      />

      <DatePicker datePickerType="single" onChange={(d) => setExpected(d?.[0]?.toISOString?.() || '')} style={{ marginTop: '1rem' }}>
        <DatePickerInput id="bulk-refer-expected" labelText="Expected Return Date (optional)" placeholder="yyyy-mm-dd" />
      </DatePicker>

      <TextArea
        id="bulk-refer-reason"
        labelText="Reason (optional)"
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ marginTop: '1rem' }}
      />

      <Checkbox
        id="bulk-refer-notify"
        labelText="Notify customer of referral (one REFERRAL_OUT event per sample)"
        checked={notify}
        onChange={(_, { checked }) => setNotify(checked)}
        style={{ marginTop: '0.75rem' }}
      />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Samples table (sample-centric rows, inline storage + refer out)
// ---------------------------------------------------------------------------

function SamplesTable({ samples, onReferSample, onUndoReferral, onEditStorage, onPrintLabel }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <TableContainer
      title="Samples"
      description="One row per physical sample. Tests on each sample travel together."
    >
      <Table size="md" useZebraStyles>
        <TableHead>
          <TableRow>
            <TableHeader />
            <TableHeader>Sample ID</TableHeader>
            <TableHeader>Type / Qty</TableHeader>
            <TableHeader>Tests on this sample</TableHeader>
            <TableHeader>Storage Location</TableHeader>
            <TableHeader>Labels</TableHeader>
            <TableHeader>Refer Out</TableHeader>
            <TableHeader />
          </TableRow>
        </TableHead>
        <TableBody>
          {samples.map((s) => {
            const isReferred = !!s.referral && s.referral.state !== 'VOIDED';
            const canUndo    = isReferred && s.referral.state === 'REFERRED';
            const storageStr = `${s.storage.freezer} / ${s.storage.shelf} / ${s.storage.box} / ${s.storage.position}`;

            return (
              <React.Fragment key={s.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      kind="ghost"
                      size="sm"
                      hasIconOnly
                      iconDescription={expandedId === s.id ? 'Collapse' : 'Expand'}
                      renderIcon={expandedId === s.id ? ChevronUp : ChevronDown}
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <strong>{s.id}</strong>
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#525252' }}>
                      Collected {s.collectedAt}
                    </span>
                  </TableCell>
                  <TableCell>
                    {s.type}
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#525252' }}>{s.quantity}</span>
                  </TableCell>
                  <TableCell>
                    {s.tests.map((t) => (
                      <Tag key={t.code} type={isReferred ? 'purple' : 'cyan'} size="sm">
                        {t.name}
                      </Tag>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Button kind="ghost" size="sm" onClick={() => onEditStorage(s.id)}>
                      {storageStr}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={Printer}
                      onClick={() => onPrintLabel(s.id)}
                    >
                      Print ({s.labelsToPrint})
                    </Button>
                  </TableCell>
                  <TableCell>{statusTag(s.referral)}</TableCell>
                  <TableCell>
                    <OverflowMenu flipped aria-label={`Actions for ${s.id}`}>
                      {!isReferred && (
                        <OverflowMenuItem
                          itemText="Refer Out Sample…"
                          onClick={() => setExpandedId(s.id)}
                        />
                      )}
                      {canUndo && (
                        <OverflowMenuItem
                          itemText="Undo Referral"
                          isDelete
                          onClick={() => onUndoReferral(s.id)}
                        />
                      )}
                      <OverflowMenuItem
                        itemText="Edit Storage Location"
                        onClick={() => onEditStorage(s.id)}
                      />
                      <OverflowMenuItem
                        itemText="Reprint Label"
                        onClick={() => onPrintLabel(s.id)}
                      />
                    </OverflowMenu>
                  </TableCell>
                </TableRow>

                {expandedId === s.id && !isReferred && (
                  <TableRow>
                    <TableCell colSpan={8} style={{ padding: 0 }}>
                      <InlineReferSampleForm
                        sample={s}
                        onCancel={() => setExpandedId(null)}
                        onSave={(payload) => {
                          onReferSample(s.id, payload);
                          setExpandedId(null);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )}

                {expandedId === s.id && isReferred && (
                  <TableRow>
                    <TableCell colSpan={8} style={{ background: '#f4f4f4', padding: '0.75rem 1.5rem' }}>
                      <strong>Referral details:</strong>{' '}
                      Referred to <em>{s.referral.labName}</em>
                      {s.referral.expected ? ` — expected back ${new Date(s.referral.expected).toISOString().slice(0, 10)}` : ''}
                      {s.referral.reason ? ` — reason: "${s.referral.reason}"` : ''}.
                      <br />
                      <span style={{ fontSize: '0.75rem', color: '#525252' }}>
                        {s.tests.length} test{s.tests.length === 1 ? '' : 's'} ({s.tests.map(t => t.name).join(', ')}) carried with this specimen.
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ---------------------------------------------------------------------------
// Print Labels section (LBL-2 — preserved)
// ---------------------------------------------------------------------------

function PrintLabelsSection({ samples, onPrintBatch }) {
  const [orderQty, setOrderQty]     = useState(1);
  const [sampleQty, setSampleQty]   = useState(1);
  const [slideQty, setSlideQty]     = useState(0);
  const [blockQty, setBlockQty]     = useState(0);
  const [freezerQty, setFreezerQty] = useState(0);

  return (
    <Tile style={{ marginBottom: '1rem' }}>
      <Accordion>
        <AccordionItem title="Print Labels (LBL-2)">
          <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1rem' }}>
            Labels travel with specimens — including referred ones. Keep label quantity ≥ 1 for any sample being shipped externally.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            <NumberInput id="lbl-order"   label="Order Label"   min={0} max={20} value={orderQty}   onChange={(_, { value }) => setOrderQty(value)} />
            <NumberInput id="lbl-sample"  label="Sample Label"  min={0} max={20} value={sampleQty}  onChange={(_, { value }) => setSampleQty(value)} />
            <NumberInput id="lbl-slide"   label="Slide Label"   min={0} max={20} value={slideQty}   onChange={(_, { value }) => setSlideQty(value)} />
            <NumberInput id="lbl-block"   label="Block Label"   min={0} max={20} value={blockQty}   onChange={(_, { value }) => setBlockQty(value)} />
            <NumberInput id="lbl-freezer" label="Freezer Label" min={0} max={20} value={freezerQty} onChange={(_, { value }) => setFreezerQty(value)} />
          </div>
          <Button
            kind="secondary"
            renderIcon={Printer}
            onClick={() => onPrintBatch({ orderQty, sampleQty, slideQty, blockQty, freezerQty })}
            style={{ marginTop: '1rem' }}
          >
            Print All Labels
          </Button>
        </AccordionItem>
      </Accordion>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Context card with Referred chip (REF-8)
// ---------------------------------------------------------------------------

function OrderContextCard({ order, samples }) {
  const referredCount = countReferredSamples(samples);
  const totalCount = samples.length;
  let referredChip = null;
  if (referredCount > 0) {
    referredChip = (
      <Tag type="purple">
        Referred {referredCount === totalCount ? '(all samples)' : `(${referredCount} of ${totalCount} samples)`}
      </Tag>
    );
  }

  return (
    <Tile style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div><strong>Lab #</strong><br />{order.labNumber}</div>
        <div><strong>Patient</strong><br />{order.patientName}</div>
        <div><strong>Patient ID</strong><br />{order.patientId}</div>
        <div><strong>Facility</strong><br />{order.facility}</div>
        <div><strong>Priority</strong><br /><Tag type="teal">{order.priority}</Tag></div>
        <div><strong>Samples</strong><br />{totalCount}</div>
        {referredChip && <div>{referredChip}</div>}
      </div>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Top-level Step 3 screen
// ---------------------------------------------------------------------------

export default function LabelStoreWithReferOut() {
  const [samples, setSamples] = useState(INITIAL_SAMPLES);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const referredCount = countReferredSamples(samples);
  const totalCount = samples.length;
  const inHouseCount = countInHouseSamples(samples);
  const allReferred = referredCount === totalCount && totalCount > 0;

  const referSample = (sampleId, payload) => {
    setSamples(prev => prev.map(s => s.id === sampleId
      ? { ...s, referral: { ...payload, state: payload.fhirEnabled ? 'SENT' : 'REFERRED' } }
      : s
    ));
    setToast({
      kind: 'success',
      title: `Referred 1 sample (${samples.find(s => s.id === sampleId)?.tests.length} tests) to ${payload.labName}.`,
      subtitle: 'X-01 REFERRAL_OUT event fired. Label and storage remain editable for logistics.',
    });
  };

  const undoReferral = (sampleId) => {
    setSamples(prev => prev.map(s => s.id === sampleId
      ? { ...s, referral: null }
      : s
    ));
    setToast({
      kind: 'info',
      title: 'Referral undone.',
      subtitle: 'Sample restored to in-house pipeline.',
    });
  };

  const bulkRefer = (payload) => {
    setSamples(prev => prev.map(s => (!s.referral || s.referral.state === 'VOIDED')
      ? { ...s, referral: { ...payload, state: payload.fhirEnabled ? 'SENT' : 'REFERRED' } }
      : s
    ));
    setBulkOpen(false);
    const refSampleCount = samples.filter(s => !s.referral).length;
    const refTestCount   = flattenInHouseTests(samples).length;
    setToast({
      kind: 'success',
      title: `Referred ${refSampleCount} samples (${refTestCount} tests) to ${payload.labName}.`,
      subtitle: 'One REFERRAL_OUT event fired per sample.',
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Step 3 — Label &amp; Store</h2>
      <p style={{ marginBottom: '1rem', color: '#525252' }}>
        Print labels, assign storage, and refer samples to external labs.
        Referrals are assigned per-sample — every test on a referred sample travels with the specimen.
      </p>

      <OrderContextCard order={ORDER} samples={samples} />

      {toast && (
        <InlineNotification
          kind={toast.kind}
          lowContrast
          title={toast.title}
          subtitle={toast.subtitle}
          onCloseButtonClick={() => setToast(null)}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {allReferred && (
        <InlineNotification
          kind="info"
          lowContrast
          hideCloseButton
          title="All samples referred — QA will be skipped (REF-2, REF-3)."
          subtitle="Order auto-transitions to REFERRED_OUT on save. The QA Review queue will not show this order."
          style={{ marginBottom: '1rem' }}
        />
      )}

      <PrintLabelsSection
        samples={samples}
        onPrintBatch={(cfg) => setToast({
          kind: 'success',
          title: 'Labels sent to printer.',
          subtitle: `${cfg.orderQty} order, ${cfg.sampleQty} sample, ${cfg.slideQty} slide, ${cfg.blockQty} block, ${cfg.freezerQty} freezer`,
        })}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: '#525252' }}>
          {inHouseCount} in-house sample{inHouseCount === 1 ? '' : 's'} • {referredCount} referred
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Tooltip label={inHouseCount === 0 ? 'No in-house samples to refer.' : 'Refer all remaining in-house samples to one external lab.'}>
            <Button
              kind="tertiary"
              renderIcon={Send}
              disabled={inHouseCount === 0}
              onClick={() => setBulkOpen(true)}
            >
              Bulk Refer Out
            </Button>
          </Tooltip>
        </div>
      </div>

      <SamplesTable
        samples={samples}
        onReferSample={referSample}
        onUndoReferral={undoReferral}
        onEditStorage={(sampleId) => setToast({
          kind: 'info',
          title: `Edit Storage for ${sampleId}`,
          subtitle: 'Inline storage assignment panel (LBL-3) opens here. Stays editable even after referral (BR-REF-4).',
        })}
        onPrintLabel={(sampleId) => setToast({
          kind: 'success',
          title: `Reprinted label for ${sampleId}`,
          subtitle: 'Reprint allowed for referred samples (BR-REF-4).',
        })}
      />

      <BulkReferModal
        open={bulkOpen}
        samples={samples}
        onClose={() => setBulkOpen(false)}
        onConfirm={bulkRefer}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <Button kind="secondary">← Back to Step 2 (Collect Sample)</Button>
        <Button kind="primary" renderIcon={ArrowRight}>
          {allReferred ? 'Close Order (Referred Out)' : 'Save & Next → Step 4 (QA Review)'}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Secondary mockup — Dashboard filter row (DSH-10, DSH-11)
// ---------------------------------------------------------------------------

export function OrderDashboardPreview() {
  const [referFilter, setReferFilter] = useState('any');

  const MOCK_ORDERS = [
    { lab: '2026-00412', patient: 'Siti Rahayu',     facility: 'Puskesmas Kebayoran', status: 'Labeling',     referred: 'partial', samples: '1 of 2' },
    { lab: '2026-00413', patient: 'Budi Santoso',    facility: 'RS Cipto',            status: 'Referred Out', referred: 'full',    samples: '2 of 2' },
    { lab: '2026-00414', patient: 'ENV-KBY-0412-01', facility: 'Kebayoran River',     status: 'QA Review',    referred: 'none',    samples: '0 of 3' },
    { lab: '2026-00415', patient: 'Ayu Lestari',     facility: 'Klinik Harapan',      status: 'Referred Out', referred: 'full',    samples: '1 of 1' },
    { lab: '2026-00416', patient: 'Dewi Sartika',    facility: 'Puskesmas Setiabudi', status: 'Labeling',     referred: 'partial', samples: '1 of 3' },
  ];

  const filtered = MOCK_ORDERS.filter(o => {
    if (referFilter === 'any')  return true;
    if (referFilter === 'has')  return o.referred !== 'none';
    if (referFilter === 'full') return o.referred === 'full';
    return true;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h3>Order Dashboard — Referred Out Filter (DSH-10, DSH-11)</h3>

      <Dropdown
        id="dsh-refer-filter"
        titleText="Referred Out"
        label="Any"
        items={[
          { id: 'any',  text: 'Any' },
          { id: 'has',  text: 'Has Referred Samples' },
          { id: 'full', text: 'Fully Referred Out' },
        ]}
        itemToString={(item) => (item ? item.text : '')}
        onChange={({ selectedItem }) => setReferFilter(selectedItem?.id || 'any')}
        style={{ maxWidth: '260px', marginBottom: '1rem' }}
      />

      <TableContainer>
        <Table size="md">
          <TableHead>
            <TableRow>
              <TableHeader>Lab #</TableHeader>
              <TableHeader>Patient / Subject</TableHeader>
              <TableHeader>Facility</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Referred Samples</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(o => (
              <TableRow key={o.lab}>
                <TableCell>{o.lab}</TableCell>
                <TableCell>{o.patient}</TableCell>
                <TableCell>{o.facility}</TableCell>
                <TableCell>
                  <Tag type={o.status === 'Referred Out' ? 'purple' : 'blue'}>{o.status}</Tag>
                  {o.referred === 'partial' && <Tag type="purple" size="sm">Referred ({o.samples})</Tag>}
                  {o.referred === 'full' && <Tag type="purple" size="sm">Referred (all samples)</Tag>}
                </TableCell>
                <TableCell>{o.samples}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
