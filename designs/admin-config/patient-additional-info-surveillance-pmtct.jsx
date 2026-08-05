// Patient & Order Additional Information — configurable, domain-sensitive  (v5, synced to preview)
// Admin tie-in: new "Additional Information" group in the redesigned Order & Patient Entry
//   Configuration page (designs/admin-config/order-patient-entry.html).
// Capture surfaces: Add Order (patient + new "Additional order details") · Patient screen
//   (edit = view, /PatientManagement).
//
// Model (all admin-controlled):
//  • 3 sections: General (existing fields folded in), Disease Surveillance, HIV/PMTCT–EID.
//  • Per section: Visible + Domain scope (CLINICAL/ENVIRONMENTAL/VECTOR — D-004, no BOTH). Order entry
//    is domain-routed, so a section shows only when the order's domain ∈ scope. Patient screen shows
//    enabled patient-level fields (cross-domain).
//  • Per field: admin-selectable Type {Text, Single-select, Multi-select, Yes/No}. LOCKED intrinsic
//    types {Date, Number, Patient link, Address hierarchy} can't be retyped. One Text type (single vs
//    multi-line is a rendering detail, not a type).
//  • Coded types → inline option editor, Dictionary-backed (add / deactivate, never delete — D-002);
//    admin types option text in the site's language (single-language deployment, English UI).
//  • Address hierarchy fields (Region/District) → show/hide + inline Label; delegates to the existing
//    Site Information geographic-unit-label + address API (values from Organization data). No back-end
//    change; not a Dictionary category. FHIR = Patient.address.
//  • FHIR: dev must map each element to a FHIR resource/element (FR-11).
//  • Levels (Casey): B2 mother HIV status = patient; A5/A6 travel + B14 treatment received = order.
//  • Ships OFF except the existing General fields (default on — no regression).

import React, { useState } from 'react';
import {
  Grid, Column, Stack, Toggle, Accordion, AccordionItem, Select, SelectItem,
  ComboBox, DatePicker, DatePickerInput, NumberInput, TextArea, TextInput,
  MultiSelect, Tag, InlineNotification, Button,
} from '@carbon/react';
import { Add, ChevronUp, ChevronDown } from '@carbon/icons-react';

const DOMAINS = ['CLINICAL', 'ENVIRONMENTAL', 'VECTOR'];
const CODED = ['single', 'multi', 'yesno'];
const LOCKED = ['date', 'number', 'patientlink', 'address'];
const TYPE_LABEL = { text: 'Text', single: 'Single-select', multi: 'Multi-select', yesno: 'Yes/No', date: 'Date', number: 'Number', patientlink: 'Patient link', address: 'Address hierarchy' };
const isCoded = (ty) => CODED.includes(ty);

// type = default type; existing = already in the app; dict = default Dictionary category for coded fields
const SECTIONS = {
  G: { title: 'General (existing Additional Information)', domains: ['CLINICAL','ENVIRONMENTAL','VECTOR'], items: [
    { id:'G1', label:'Health Region', lvl:'pat', type:'address', existing:true },
    { id:'G2', label:'Health District', lvl:'pat', type:'address', existing:true },
    { id:'G3', label:'Education', lvl:'pat', type:'single', dict:'education', existing:true },
    { id:'G4', label:'Marital Status', lvl:'pat', type:'single', dict:'maritalStatus', existing:true },
    { id:'G5', label:'Nationality', lvl:'pat', type:'single', dict:'nationality', existing:true },
    { id:'G6', label:'Occupation', lvl:'pat', type:'text', existing:true },
    { id:'G7', label:'Target Disease Programme', lvl:'pat', type:'single', dict:'program', existing:true },
    { id:'G8', label:'Custom Notes', lvl:'pat', type:'text', existing:true },
  ]},
  A: { title: 'Disease Surveillance', domains: ['CLINICAL'], items: [
    { id:'A1', label:'Signs & symptoms', lvl:'ord', type:'text' },
    { id:'A2', label:'Symptom onset date', lvl:'ord', type:'date' },
    { id:'A3', label:'Case classification', lvl:'ord', type:'single', dict:'caseClassification' },
    { id:'A4', label:'Epidemiological link', lvl:'ord', type:'text' },
    { id:'A5', label:'Travel to endemic region', lvl:'ord', type:'yesno' },
    { id:'A6', label:'Dates of stay', lvl:'ord', type:'date' },
    { id:'A7', label:'Medical history', lvl:'pat', type:'text' },
    { id:'A8', label:'Comorbidity', lvl:'pat', type:'text' },
    { id:'A9', label:'Prior vaccination', lvl:'pat', type:'text' },
    { id:'A10', label:'Other', lvl:'pat', type:'text' },
  ]},
  B: { title: 'HIV / PMTCT–EID', domains: ['CLINICAL'], items: [
    { id:'B1', label:'Mother (patient link)', lvl:'pat', type:'patientlink', ph:'Search patients…' },
    { id:'B2', label:'Mother HIV status', lvl:'pat', type:'single', dict:'hivStatus' },
    { id:'B3', label:'ARV during pregnancy', lvl:'ord', type:'yesno' },
    { id:'B4', label:'Treatment type (mother)', lvl:'ord', type:'single', dict:'arvTreatmentType' },
    { id:'B5', label:'Recent maternal viral load', lvl:'ord', type:'yesno' },
    { id:'B6', label:'Value (copies/ml)', lvl:'ord', type:'number' },
    { id:'B7', label:'Breastfeeding', lvl:'ord', type:'yesno' },
    { id:'B8', label:'Breastfeeding duration (months)', lvl:'ord', type:'number' },
    { id:'B9', label:'Weaning', lvl:'ord', type:'yesno' },
    { id:'B10', label:'Weaning duration (months)', lvl:'ord', type:'number' },
    { id:'B11', label:'Reason for request', lvl:'ord', type:'single', dict:'eidRequestReason' },
    { id:'B12', label:'At-risk population', lvl:'pat', type:'single', dict:'riskPopulation' },
    { id:'B13', label:'ARV treatment start date', lvl:'pat', type:'date' },
    { id:'B14', label:'Treatment received', lvl:'ord', type:'single', dict:'arvTreatmentType' },
  ]},
};

const SEED_OPTS = {
  caseClassification: ['Suspected','Probable','Confirmed'], hivStatus: ['Positive','Negative','Unknown'],
  yesNo: ['Yes','No'], arvTreatmentType: ['AZT','NVP','TDF+3TC+DTG'],
  eidRequestReason: ['1st PCR (6 wk)','2nd PCR (9 mo)','Confirmatory'], riskPopulation: ['General population','Key population'],
  education: ['None','Primary','Secondary','Upper'], maritalStatus: ['Single','Married','Divorced','Widowed'],
  nationality: ['Malagasy','French','Other'], program: ['PMTCT','TB','Malaria'],
};

const LvlTag = ({ lvl }) => <Tag type={lvl === 'pat' ? 'blue' : 'purple'} size="sm">{lvl === 'pat' ? 'patient' : 'order'}</Tag>;
const catFor = (f, ty) => (ty === 'yesno' ? 'yesNo' : (f.dict || f.id + 'Opts'));

// ---- Capture-surface control, rendered by the field's current type ----
function FieldControl({ f, ty, label, required, opts }) {
  const lab = <span>{label} <LvlTag lvl={f.lvl} /></span>;
  if (ty === 'text') return <TextArea labelText={lab} rows={2} id={f.id} required={required} />;
  if (ty === 'date') return <DatePicker datePickerType="single"><DatePickerInput id={f.id} labelText={lab} placeholder="mm/dd/yyyy" /></DatePicker>;
  if (ty === 'number') return <NumberInput label={lab} id={f.id} min={0} hideSteppers />;
  if (ty === 'patientlink') return <ComboBox id={f.id} titleText={lab} placeholder={f.ph || 'Search patients…'}
    items={[{ id:'m1', text:'ATANGANA, Marie' }, { id:'m2', text:'RAKOTO, Hanta' }]} itemToString={(i)=>i?i.text:''}
    helperText="Links the mother's record; fills code/name (read-only). Free-text fallback if she has no record." />;
  if (ty === 'address') return <TextInput id={f.id} labelText={lab} value="" readOnly placeholder="From address hierarchy (Organization data)" />;
  const items = (opts[catFor(f, ty)] || []).filter(o => o.active).map(o => o.text);
  if (ty === 'multi') return <MultiSelect id={f.id} titleText={lab} label="Select…" items={items} itemToString={(i)=>i||''} />;
  return (
    <Select id={f.id} labelText={lab} required={required}>
      <SelectItem value="" text="" />
      {items.map(o => <SelectItem key={o} value={o} text={o} />)}
    </Select>
  );
}

function AddlSection({ sectionKey, cfg, surface, domain }) {
  const sec = SECTIONS[sectionKey];
  if (!cfg.sections[sectionKey].on) return null;
  if (surface === 'order' && !cfg.sections[sectionKey].domains.includes(domain)) return null;
  const shown = sec.items.filter(f => cfg.visible[f.id] && !(surface === 'patient' && f.lvl !== 'pat'));
  if (shown.length === 0) return null;
  const hasOrder = surface === 'order' && shown.some(f => f.lvl === 'ord');
  return (
    <AccordionItem title={sec.title} open>
      {hasOrder && <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginBottom: 8 }}>"order" fields live in the new "Additional order details" area on the order.</p>}
      <Grid narrow>
        {shown.map(f => {
          const ty = cfg.types[f.id];
          return (
            <Column key={f.id} lg={ty === 'text' ? 16 : 8} md={8} sm={4} style={{ marginBottom: 16 }}>
              <FieldControl f={f} ty={ty} label={cfg.labels[f.id]} required={cfg.required[f.id]} opts={cfg.opts} />
            </Column>
          );
        })}
      </Grid>
    </AccordionItem>
  );
}

// ---- Inline option editor (coded fields) ----
function OptionEditor({ cat, cfg, setCfg }) {
  const [draft, setDraft] = useState('');
  const list = cfg.opts[cat] || [];
  const add = () => { const v = draft.trim(); if (!v) return; setCfg(c => ({ ...c, opts: { ...c.opts, [cat]: [...(c.opts[cat] || []), { text: v, active: true }] } })); setDraft(''); };
  const toggle = (i) => setCfg(c => ({ ...c, opts: { ...c.opts, [cat]: c.opts[cat].map((x, j) => j === i ? { ...x, active: !x.active } : x) } }));
  const usage = Object.values(SECTIONS).flatMap(s => s.items).filter(f => isCoded(cfg.types[f.id]) && catFor(f, cfg.types[f.id]) === cat).length;
  return (
    <div style={{ margin: '2px 0 10px 2rem', padding: '0.5rem 0.75rem', background: 'var(--cds-highlight)', borderRadius: 4, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {list.map((o, i) => <Tag key={o.text + i} type={o.active ? 'blue' : 'gray'} filter size="sm" onClose={() => toggle(i)} title={o.active ? 'Deactivate' : 'Reactivate'}>{o.text}</Tag>)}
      {list.length === 0 && <span style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>No options yet —</span>}
      <TextInput id={`add-${cat}`} size="sm" labelText="" placeholder="Add option…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} style={{ maxWidth: 150 }} />
      <Button size="sm" kind="tertiary" renderIcon={Add} onClick={add}>Add</Button>
      {usage > 1 && <span style={{ fontSize: 11, color: 'var(--cds-text-secondary)', marginLeft: 'auto' }}>shared by {usage} fields · <code>{cat}</code></span>}
    </div>
  );
}

function AdminConfig({ cfg, setCfg }) {
  const [openSec, setOpenSec] = useState({ G: false, A: true, B: true });
  const [expField, setExpField] = useState(null);
  const setSec = (k, patch) => setCfg(c => ({ ...c, sections: { ...c.sections, [k]: { ...c.sections[k], ...patch } } }));
  const toggleDomain = (k, d) => { const cur = cfg.sections[k].domains; setSec(k, { domains: cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d] }); };
  const setType = (id, ty) => { setCfg(c => ({ ...c, types: { ...c.types, [id]: ty } })); setExpField(null); };
  const toggleVis = (id, k) => cfg.sections[k].on && setCfg(c => ({ ...c, visible: { ...c.visible, [id]: !c.visible[id] } }));
  const toggleReq = (id, k) => cfg.sections[k].on && cfg.visible[id] && setCfg(c => ({ ...c, required: { ...c.required, [id]: !c.required[id] } }));
  const setLabel = (id, v) => setCfg(c => ({ ...c, labels: { ...c.labels, [id]: v } }));

  return (
    <Stack gap={5}>
      {Object.entries(SECTIONS).map(([k, sec]) => {
        const shownCount = sec.items.filter(f => cfg.visible[f.id]).length;
        const open = openSec[k];
        return (
          <div key={k} style={{ border: '1px solid var(--cds-border-subtle)', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--cds-layer-accent)' }}>
              <Toggle id={`sec-${k}`} size="sm" hideLabel labelText={`${sec.title} visible`} toggled={cfg.sections[k].on} onToggle={(v) => setSec(k, { on: v })} />
              <span style={{ flex: 1, fontWeight: 600, fontSize: 13, cursor: 'pointer' }} onClick={() => setOpenSec(o => ({ ...o, [k]: !o[k] }))}>{sec.title}</span>
              <span style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>{shownCount}/{sec.items.length} shown</span>
              <Button kind="ghost" size="sm" hasIconOnly iconDescription={open ? 'Collapse' : 'Expand'} renderIcon={open ? ChevronUp : ChevronDown} onClick={() => setOpenSec(o => ({ ...o, [k]: !o[k] }))} />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 10px 0', opacity: cfg.sections[k].on ? 1 : 0.4 }}>
              <span style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>Domains:</span>
              {DOMAINS.map(d => <Tag key={d} size="sm" type={cfg.sections[k].domains.includes(d) ? 'green' : 'gray'} filter onClose={() => toggleDomain(k, d)} style={{ cursor: 'pointer' }}>{d.toLowerCase()}</Tag>)}
            </div>
            {open && (
              <div style={{ padding: '4px 10px 8px', opacity: cfg.sections[k].on ? 1 : 0.4 }}>
                {sec.items.map(f => {
                  const ty = cfg.types[f.id];
                  const locked = LOCKED.includes(ty);
                  const isAddr = ty === 'address';
                  const coded = isCoded(ty);
                  const rowOpen = expField === f.id;
                  return (
                    <div key={f.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: '1px solid var(--cds-border-subtle)' }}>
                        <Toggle id={`vis-${f.id}`} size="sm" hideLabel labelText={`${f.label} — visible`} toggled={cfg.sections[k].on && cfg.visible[f.id]} onToggle={() => toggleVis(f.id, k)} />
                        <span style={{ flex: 1, fontSize: 12 }}>{cfg.labels[f.id]} <LvlTag lvl={f.lvl} /> {f.existing && <Tag type="cool-gray" size="sm">existing</Tag>}</span>
                        {locked
                          ? <Tag type="gray" size="sm" title={isAddr ? 'Address hierarchy — values from Organization; label/show-hide via existing API' : 'Fixed by data type'}>{TYPE_LABEL[ty]} 🔒</Tag>
                          : <Select id={`ty-${f.id}`} size="sm" noLabel labelText="" value={ty} onChange={(e) => setType(f.id, e.target.value)} style={{ maxWidth: 130 }}>
                              <SelectItem value="text" text="Text" />
                              <SelectItem value="single" text="Single-select" />
                              <SelectItem value="multi" text="Multi-select" />
                              <SelectItem value="yesno" text="Yes/No" />
                            </Select>}
                        <span style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>Req</span>
                        <Toggle id={`req-${f.id}`} size="sm" hideLabel labelText={`${f.label} — required`} toggled={!!cfg.required[f.id]} onToggle={() => toggleReq(f.id, k)} />
                        {coded
                          ? <Button kind="ghost" size="sm" renderIcon={rowOpen ? ChevronUp : ChevronDown} onClick={() => setExpField(rowOpen ? null : f.id)} style={{ minWidth: 104 }}>{(cfg.opts[catFor(f, ty)] || []).filter(o => o.active).length} options</Button>
                          : isAddr
                            ? <Button kind="ghost" size="sm" renderIcon={rowOpen ? ChevronUp : ChevronDown} onClick={() => setExpField(rowOpen ? null : f.id)} style={{ minWidth: 104 }}>Label</Button>
                            : <span style={{ fontSize: 11, color: 'var(--cds-text-placeholder)', minWidth: 104, textAlign: 'right' }}>—</span>}
                      </div>
                      {rowOpen && coded && <OptionEditor cat={catFor(f, ty)} cfg={cfg} setCfg={setCfg} />}
                      {rowOpen && isAddr && (
                        <div style={{ margin: '2px 0 10px 2rem', padding: '0.5rem 0.75rem', background: 'var(--cds-highlight)', borderRadius: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <TextInput id={`lab-${f.id}`} size="sm" labelText="Label" value={cfg.labels[f.id]} onChange={(e) => setLabel(f.id, e.target.value)} style={{ maxWidth: 200 }} />
                          <span style={{ fontSize: 11, color: 'var(--cds-text-secondary)' }}>saved via existing Site Information / address API · values from Organization data (back end unchanged)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <InlineNotification kind="info" lowContrast hideCloseButton
        title="Inline, configurable — visibility, domain, type, responses"
        subtitle="Per section: Visible + Domain scope + collapse. Per field: Type (Text/Single/Multi/Yes-No; Date/Number/Patient-link/Address locked), Visible, Required. Coded → inline option editor (Dictionary-backed; add/deactivate). Address → inline Label via existing API. Existing General fields default on; new sections off." />
    </Stack>
  );
}

export default function PatientOrderAdditionalInfo() {
  const init = (fn) => { const o = {}; Object.values(SECTIONS).forEach(s => s.items.forEach(f => (o[f.id] = fn(f)))); return o; };
  const [cfg, setCfg] = useState({
    sections: { G: { on: true, domains: ['CLINICAL','ENVIRONMENTAL','VECTOR'] }, A: { on: true, domains: ['CLINICAL'] }, B: { on: true, domains: ['CLINICAL'] } },
    visible: init(() => true),
    required: { A3: true, B1: true },
    types: init(f => f.type),
    labels: init(f => f.label),
    opts: Object.fromEntries(Object.entries(SEED_OPTS).map(([k, arr]) => [k, arr.map(t => ({ text: t, active: true }))])),
  });
  const [surface, setSurface] = useState('order');
  const [domain, setDomain] = useState('CLINICAL');
  const anyOn = Object.values(cfg.sections).some(s => s.on);

  return (
    <Grid style={{ maxWidth: 1320, margin: '0 auto', paddingTop: '1rem' }}>
      <Column lg={7} md={8} sm={4}>
        <h4>Admin · Order & Patient Entry Configuration → Additional Information</h4>
        <AdminConfig cfg={cfg} setCfg={setCfg} />
      </Column>

      <Column lg={9} md={8} sm={4}>
        <Stack orientation="horizontal" gap={3} style={{ marginBottom: 8 }}>
          {['order','patient'].map(s => (
            <Button key={s} size="sm" kind={surface === s ? 'primary' : 'tertiary'} onClick={() => setSurface(s)}>{s === 'order' ? 'Order Entry' : 'Patient (Add/Modify)'}</Button>
          ))}
        </Stack>
        {surface === 'order' && (
          <Stack orientation="horizontal" gap={2} style={{ marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>Order domain:</span>
            {DOMAINS.map(d => <Button key={d} size="sm" kind={domain === d ? 'secondary' : 'ghost'} onClick={() => setDomain(d)}>{d.toLowerCase()}</Button>)}
          </Stack>
        )}
        <h4>Additional Information</h4>
        {!anyOn && <InlineNotification kind="info" lowContrast hideCloseButton title="No sections enabled" subtitle="Nothing shows by default. Enable a section in the admin panel." />}
        <Accordion>
          <AddlSection sectionKey="G" cfg={cfg} surface={surface} domain={domain} />
          <AddlSection sectionKey="A" cfg={cfg} surface={surface} domain={domain} />
          <AddlSection sectionKey="B" cfg={cfg} surface={surface} domain={domain} />
        </Accordion>
        {surface === 'order'
          ? <InlineNotification kind="info" lowContrast hideCloseButton style={{ marginTop: 12 }} title="Domain-sensitive" subtitle={`Showing sections scoped to ${domain.toLowerCase()}. Disease Surveillance & HIV/PMTCT are Clinical-only by default.`} />
          : <InlineNotification kind="info" lowContrast hideCloseButton style={{ marginTop: 12 }} title="Patient-level fields only" subtitle="Edit and view are the same screen. Per-order fields appear only at order entry (Additional order details)." />}
      </Column>
    </Grid>
  );
}
