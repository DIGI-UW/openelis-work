// S-09 Pre-Analytical Eligibility Gate & Resampling — v3.0 mockup
// Route (Step 3): existing reception wizard — SideNav: Order → Add Order (Step 3 QA/QC + Intake Acceptance)
// Route (Admin):  Admin → General Configuration → Order Entry Configuration → Sample Acceptance Checklist
//                 (per-domain via SideNav submenu items; confirm exact OrderEntryConfiguration route against live)
//
// Simplification rewrite of v2.0: generic MANUAL checklist (no auto-compute engine),
// Resample action on the existing NCE dialog, lightweight master-list config decoupled
// from the Test Catalog editor. No new status enum, no new permission keys.

import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell,
  TextInput, TextArea, Select, SelectItem, RadioButton, RadioButtonGroup, Toggle,
  Button, IconButton, InlineNotification, Tag, Modal, Tile,
  Breadcrumb, BreadcrumbItem,
} from '@carbon/react';
import { Add, Edit, TrashCan, Renew, ArrowUp, ArrowDown } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ---- Mock data -------------------------------------------------------------
const DEFAULT_ITEMS = [
  { id: 1, label: 'Container intact and undamaged', domain: null, active: true },
  { id: 2, label: 'Label legible and matches request', domain: null, active: true },
  { id: 3, label: 'Sample volume / quantity adequate', domain: null, active: true },
  { id: 4, label: 'Cold chain / temperature acceptable', domain: null, active: true },
  { id: 5, label: 'Within acceptable transit time', domain: null, active: true },
  { id: 6, label: 'Request paperwork / chain-of-custody present', domain: null, active: true },
  // Domain-specific examples (appear only under their domain's checklist)
  { id: 7, label: 'Patient identifiers match request', domain: 'CLINICAL', active: true },
  { id: 8, label: 'Preservation medium appropriate', domain: 'ENVIRONMENTAL', active: true },
  // (Vector has no own items in this demo → it falls back to the lab-wide list.)
];
const DOMAINS = ['CLINICAL', 'ENVIRONMENTAL', 'VECTOR'];

const SAMPLES = [
  { id: 'ENV-2026-00231', type: 'Water — Surface', domain: 'ENVIRONMENTAL',
    collected: '2026-06-15 07:10', received: '2026-06-16 09:42', transit: '26h 32m', state: 'pending' },
  { id: 'ENV-2026-00232', type: 'Water — Ground', domain: 'ENVIRONMENTAL',
    collected: '2026-06-16 06:55', received: '2026-06-16 09:42', transit: '2h 47m', state: 'accepted' },
  { id: 'CLI-2026-04417', type: 'Whole Blood — EDTA', domain: 'CLINICAL',
    collected: '2026-06-16 08:20', received: '2026-06-16 09:30', transit: '1h 10m', state: 'review' },
  { id: 'VEC-2026-00088', type: 'Mosquito pool — CDC light trap', domain: 'VECTOR',
    collected: '2026-06-15 19:00', received: '2026-06-16 08:15', transit: '13h 15m', state: 'pending' },
];

const tagFor = (state) => ({
  accepted: { kind: 'green', text: t('tag.eligibility.accepted', 'Accepted') },
  review:   { kind: 'warm-gray', text: t('tag.eligibility.review', 'Review') },
  pending:  { kind: 'gray', text: t('tag.eligibility.pending', 'Pending') },
}[state]);

// ---- Step 3 checklist side panel ------------------------------------------
function ChecklistPanel({ sample, items, onReportNce }) {
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState({});
  const set = (id, v) => setAnswers((a) => ({ ...a, [id]: v }));
  // Precedence (FR-04): domain list overrides lab-wide; lab-wide is the fallback.
  // When a domain has its own list, lab-wide items render visible-disabled.
  const own = items.filter((i) => i.active && i.domain === sample.domain);
  const labWide = items.filter((i) => i.active && !i.domain);
  const active = own.length ? own : labWide; // resolved list only; superseded items are NOT shown here (FR-04)
  const anyFail = active.some((i) => answers[i.id] === 'FAIL');
  // Failed items + notes are handed to the NCE dialog to pre-populate the reason (FR-07A).
  const failed = active.filter((i) => answers[i.id] === 'FAIL')
    .map((i) => ({ label: i.label, note: notes[i.id] || '' }));

  return (
    <Tile style={{ padding: '1rem', borderLeft: '3px solid var(--cds-border-interactive)' }}>
      <h4 style={{ marginBottom: '0.5rem' }}>{t('label.eligibility.checklist.title', 'Acceptance checklist')} — {sample.id}</h4>

      {/* Read-only context */}
      <div style={{ background: 'var(--cds-layer-02)', padding: '0.75rem', marginBottom: '1rem', fontSize: 12 }}>
        <strong>{sample.type}</strong> · {sample.domain}<br />
        Collected {sample.collected} · Received {sample.received}<br />
        {t('label.eligibility.context.transit', 'Transit time')}: <strong>{sample.transit}</strong>
        {sample.transit.startsWith('26') &&
          <span> &nbsp;<Tag kind="warm-gray" size="sm">long transit — your call</Tag></span>}
      </div>

      <Stack gap={5}>
        {active.map((item) => (
          <div key={item.id}>
            <RadioButtonGroup legendText={item.label} name={`item-${item.id}`}
              valueSelected={answers[item.id]} onChange={(v) => set(item.id, v)}>
              <RadioButton labelText={t('label.eligibility.answer.pass', 'Pass')} value="PASS" id={`p-${item.id}`} />
              <RadioButton labelText={t('label.eligibility.answer.fail', 'Fail')} value="FAIL" id={`f-${item.id}`} />
              <RadioButton labelText={t('label.eligibility.answer.na', 'N/A')} value="NA" id={`n-${item.id}`} />
            </RadioButtonGroup>
            {answers[item.id] === 'FAIL' &&
              <TextInput id={`note-${item.id}`} labelText="" size="sm"
                value={notes[item.id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                placeholder={t('label.eligibility.note.placeholder', 'Optional — note any observed condition')} />}
          </div>
        ))}
      </Stack>

      <Stack orientation="horizontal" gap={3} style={{ marginTop: '1.25rem' }}>
        <Button kind="primary" size="sm" disabled={anyFail}>{t('button.accept', 'Accept sample')}</Button>
        <Button kind={anyFail ? 'danger--tertiary' : 'ghost'} size="sm" onClick={() => onReportNce(failed)}>
          {t('button.reportNce', 'Report NCE')}
        </Button>
      </Stack>
    </Tile>
  );
}

// ---- NCE dialog with Resample action --------------------------------------
function NceDialog({ open, onClose, sample, failed = [] }) {
  const [action, setAction] = useState('continue');
  // FR-07A: reason pre-populates from the failed checklist items + notes.
  const prefill = failed.length
    ? failed.map((f) => `${f.label}: FAIL${f.note ? ` — ${f.note}` : ''}`).join('\n')
    : '';
  return (
    <Modal key={prefill} open={open} onRequestClose={onClose} modalHeading={`Report NCE — ${sample?.id}`}
      primaryButtonText={t('button.commit', 'Commit')} secondaryButtonText={t('button.cancel', 'Cancel')}
      onRequestSubmit={onClose}>
      <TextArea labelText="Reason (pre-filled from failed checklist items — editable)" rows={Math.max(2, failed.length)}
        defaultValue={prefill} />
      <div style={{ marginTop: '1rem' }}>
        <RadioButtonGroup legendText="Sample action" name="sample-action" orientation="vertical"
          valueSelected={action} onChange={setAction}>
          <RadioButton labelText={t('label.nce.sampleAction.continue', 'Continue with NCE flag')} value="continue" id="a-c" />
          <RadioButton labelText={t('label.nce.sampleAction.reject', 'Reject sample')} value="reject" id="a-r" />
          <RadioButton labelText={t('label.nce.sampleAction.resample', 'Resample (new)')} value="resample" id="a-rs" />
        </RadioButtonGroup>
        {action === 'resample' &&
          <InlineNotification kind="info" lowContrast hideCloseButton style={{ marginTop: '0.75rem' }}
            title="Resample"
            subtitle={t('help.nce.sampleAction.resample',
              'Reject this sample and create a new collection order for re-collection. The requester will be notified.')} />}
      </div>
    </Modal>
  );
}

// ---- Step 3 screen ---------------------------------------------------------
function Step3({ items }) {
  const [selected, setSelected] = useState(SAMPLES[0]);
  const [nceOpen, setNceOpen] = useState(false);
  const [nceFailed, setNceFailed] = useState([]);
  const openNce = (failed) => { setNceFailed(failed); setNceOpen(true); };
  return (
    <Grid>
      <Column lg={10} md={5} sm={4}>
        <TableContainer title="Step 3 — QA/QC + Intake Acceptance"
          description="Select a sample to complete its acceptance checklist">
          <Table>
            <TableHead><TableRow>
              <TableHeader>Lab #</TableHeader><TableHeader>Sample type</TableHeader>
              <TableHeader>Transit</TableHeader><TableHeader>Eligibility</TableHeader>
            </TableRow></TableHead>
            <TableBody>
              {SAMPLES.map((s) => {
                const tg = tagFor(s.state);
                return (
                  <TableRow key={s.id} onClick={() => setSelected(s)}
                    isSelected={selected.id === s.id} style={{ cursor: 'pointer' }}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>{s.type}</TableCell>
                    <TableCell>{s.transit}</TableCell>
                    <TableCell><Tag kind={tg.kind} size="sm">{tg.text}</Tag></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Column>
      <Column lg={6} md={3} sm={4}>
        <ChecklistPanel sample={selected} items={items} onReportNce={openNce} />
      </Column>
      <NceDialog open={nceOpen} onClose={() => setNceOpen(false)} sample={selected} failed={nceFailed} />
    </Grid>
  );
}

// ---- Checklist item master-list admin -------------------------------------
const cap = (d) => d.charAt(0) + d.slice(1).toLowerCase();

// `domain` is the SideNav-selected leaf: 'ALL' | 'CLINICAL' | 'ENVIRONMENTAL' | 'VECTOR'
function ChecklistAdmin({ domain, items, enforcement, setEnforcement }) {
  const isAll = domain === 'ALL';
  const own = items.filter((i) => (isAll ? !i.domain : i.domain === domain));
  const labWide = items.filter((i) => !i.domain);
  const usesFallback = !isAll && own.length === 0; // domain has no list → lab-wide applies

  return (
    <Stack gap={6}>
      <h3 style={{ fontWeight: 400 }}>
        Sample Acceptance Checklist — {isAll ? 'All domains' : cap(domain)}
      </h3>

      {!isAll && (
        <Tile style={{ padding: '1rem' }}>
          <Select id={`enf-${domain}`}
            labelText={`${t('label.eligibility.enforcement', 'Checklist enforcement')} — ${cap(domain)}`}
            value={enforcement[domain]} onChange={(e) => setEnforcement({ ...enforcement, [domain]: e.target.value })}
            style={{ maxWidth: 360 }}>
            <SelectItem value="MANDATORY" text={t('option.eligibility.enforcement.mandatory', 'Mandatory')} />
            <SelectItem value="OPTIONAL" text={t('option.eligibility.enforcement.optional', 'Optional')} />
            <SelectItem value="OFF" text={t('option.eligibility.enforcement.off', 'Off')} />
          </Select>
        </Tile>
      )}

      {usesFallback && (
        <InlineNotification kind="info" lowContrast hideCloseButton
          title={`No ${cap(domain)} items configured`}
          subtitle="The lab-wide (All domains) checklist applies for this domain. Add an item here to override it." />
      )}

      {/* This domain's own (editable) items */}
      <TableContainer title={isAll ? 'Lab-wide items (apply unless a domain overrides)' : `${cap(domain)} items`}>
        <Table>
          <TableHead><TableRow>
            <TableHeader>Order</TableHeader><TableHeader>Label</TableHeader>
            <TableHeader>Active</TableHeader><TableHeader></TableHeader>
          </TableRow></TableHead>
          <TableBody>
            {own.map((it, idx) => (
              <TableRow key={it.id}>
                <TableCell>
                  <IconButton kind="ghost" size="sm" label="Up" disabled={idx === 0}><ArrowUp /></IconButton>
                  <IconButton kind="ghost" size="sm" label="Down" disabled={idx === own.length - 1}><ArrowDown /></IconButton>
                </TableCell>
                <TableCell>{it.label}</TableCell>
                <TableCell><Toggle id={`act-${it.id}`} size="sm" defaultToggled={it.active} labelA="" labelB="" /></TableCell>
                <TableCell>
                  <IconButton kind="ghost" size="sm" label="Edit"><Edit /></IconButton>
                  <IconButton kind="ghost" size="sm" label="Deactivate"><TrashCan /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button kind="primary" renderIcon={Add} size="sm">{t('button.addItem', 'Add item')}</Button>

      {/* Lab-wide items shown visible-disabled when this domain has its own list (FR-03/FR-04) */}
      {!isAll && own.length > 0 && (
        <TableContainer title="Lab-wide items — superseded here (edit from “All domains”)"
          description="Shown for reference; the domain list above takes precedence.">
          <Table>
            <TableHead><TableRow>
              <TableHeader>Label</TableHeader><TableHeader>Status for this domain</TableHeader>
            </TableRow></TableHead>
            <TableBody>
              {labWide.map((it) => (
                <TableRow key={it.id}>
                  <TableCell style={{ opacity: 0.5 }}>{it.label}</TableCell>
                  <TableCell><Tag size="sm" kind="gray">Superseded</Tag></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

// ---- App shell -------------------------------------------------------------
// Navigation is a Carbon SideNav with submenu items (OpenELIS IA) — NOT in-page tabs.
export default function S09Mockup() {
  const [route, setRoute] = useState({ screen: 'step3' });
  const [items] = useState(DEFAULT_ITEMS);
  const [enforcement, setEnforcement] = useState({ CLINICAL: 'OPTIONAL', ENVIRONMENTAL: 'MANDATORY', VECTOR: 'MANDATORY' });
  const onAdmin = route.screen === 'admin';
  const crumbTail = onAdmin
    ? ['Admin', 'General Configuration', 'Order Entry Configuration', 'Sample Acceptance Checklist', route.domain === 'ALL' ? 'All domains' : cap(route.domain)]
    : ['Order', 'Add Order', 'QA-QC + Intake Acceptance'];

  return (
    <div style={{ display: 'flex' }}>
      <SideNav isFixedNav expanded isChildOfHeader={false} aria-label="Side navigation">
        <SideNavItems>
          <SideNavMenu title="Order" defaultExpanded>
            <SideNavMenuItem isActive={route.screen === 'step3'} onClick={() => setRoute({ screen: 'step3' })}>
              QA-QC + Intake Acceptance
            </SideNavMenuItem>
          </SideNavMenu>
          <SideNavMenu title="Order Entry Config · Acceptance Checklist" defaultExpanded>
            {['ALL', ...DOMAINS].map((d) => (
              <SideNavMenuItem key={d} isActive={onAdmin && route.domain === d}
                onClick={() => setRoute({ screen: 'admin', domain: d })}>
                {d === 'ALL' ? 'All domains' : cap(d)}
              </SideNavMenuItem>
            ))}
          </SideNavMenu>
        </SideNavItems>
      </SideNav>

      <div style={{ padding: '1rem 2rem', flex: 1 }}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#">Home</BreadcrumbItem>
          {crumbTail.slice(0, -1).map((c) => <BreadcrumbItem key={c} href="#">{c}</BreadcrumbItem>)}
          <BreadcrumbItem isCurrentPage>{crumbTail[crumbTail.length - 1]}</BreadcrumbItem>
        </Breadcrumb>
        <div style={{ marginTop: '1rem' }}>
          {route.screen === 'step3'
            ? <Step3 items={items} />
            : <ChecklistAdmin domain={route.domain} items={items} enforcement={enforcement} setEnforcement={setEnforcement} />}
        </div>
      </div>
    </div>
  );
}
