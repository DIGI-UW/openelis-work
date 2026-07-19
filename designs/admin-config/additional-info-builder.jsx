// Additional Information Builder — one builder, per-context (submenu switch)  [OGC-781 baked-in FR-28/FR-29]
// SideNav: Admin → Test Management → Additional Information → { Programs | Order form fields (Clinical/
//   Environmental/Vector) | Patient form fields }.  Breadcrumb: Home / Admin Management / Test Management / <leaf>.
//
// ONE questionnaire builder, reused across contexts (the submenu is the context switch):
//   • Programs — selectable per-order form (Basic Info: Name + Domain + Lab unit).
//   • Order form fields — ONE always-attached set PER order domain (Clinical/Env/Vector) — not a single
//     "every order" bucket, so shared-vs-unique-per-domain is expressible.
//   • Patient form fields — one cross-domain always-attached set.
// Shipped fields (seeded per context) are hide-not-delete (Visible toggle; retained — D-002); only
//   admin-added fields are deletable. Site-Information-managed fields (Region/District) are locked
//   (configure, not re-authored). Authored fields export as FHIR QuestionnaireResponse. JSON = paste/edit.
// This is the AUTHORING/config UI only — where the questions render on the order/patient forms already exists.

import React, { useState } from 'react';
import {
  SideNav, SideNavItems, SideNavLink, Grid, Column, Tile, TextInput, TextArea,
  Select, SelectItem, RadioButtonGroup, RadioButton, ContentSwitcher, Switch,
  Toggle, Tag, Button, InlineNotification, Checkbox,
} from '@carbon/react';
import { Add, TrashCan, Locked } from '@carbon/icons-react';

const TYPES = ['Boolean','Choice','Checkbox','Integer','Decimal','Date','Time','String','Text','Quantity'];
let UID = 1000;
const mk = (text, type, options = [], f = {}) => ({ id: ++UID, text, type, options, shipped: !!f.shipped, locked: !!f.locked, vis: f.vis !== false });

const CONTEXTS = {
  program: { label: 'Program (selected per order)', attach: 'Attaches to an order when a user picks this Program at order entry.', basicInfo: true,
    seed: () => [ mk('ARV during pregnancy?','Boolean'), mk('Recent maternal viral load (copies/ml)','Decimal'),
      mk('Reason for request','Choice',['1st PCR (6 wk)','2nd PCR (9 mo)','Confirmatory']), mk('Breastfeeding?','Boolean') ] },
  order_clinical: { label: 'Clinical order — every clinical order', attach: 'Always on every CLINICAL order (Step-1 “Clinical Information”).', leaf: 'Clinical order fields',
    seed: () => [ mk('Provisional Diagnosis','String',[],{shipped:true}), mk('Payment Status','Choice',['Cash','Insurance','Waived'],{shipped:true}) ] },
  order_environmental: { label: 'Environmental order — every env order', attach: 'Always on every ENVIRONMENTAL order (Step-1 env details).', leaf: 'Environmental order fields',
    seed: () => [ mk('Collection Method','Choice',['Grab','Composite'],{shipped:true}), mk('Water Temp (°C)','Decimal',[],{shipped:true}),
      mk('Ambient Temp (°C)','Decimal',[],{shipped:true}), mk('Weather','String',[],{shipped:true}),
      mk('Preservation Method','Choice',['Ice','Acid','None'],{shipped:true}), mk('Field Notes','Text',[],{shipped:true}),
      mk('Compliance Standards','Choice',['ISO 17025','National'],{shipped:true}) ] },
  order_vector: { label: 'Vector order — every vector order', attach: 'Always on every VECTOR order (Step-1 Sample section).', leaf: 'Vector order fields',
    seed: () => [ mk('Lifecycle Stage','Choice',['Adult','Larva','Pupa'],{shipped:true}), mk('Trap Type','Choice',['Light','BG','Ovitrap'],{shipped:true}),
      mk('Quantity in Pool','Integer',[],{shipped:true}), mk('Traps Deployed','Integer',[],{shipped:true}), mk('Nights Deployed','Integer',[],{shipped:true}) ] },
  patient: { label: 'Patient form — every patient', attach: 'Always on the patient form (Additional Information). Cross-domain.', leaf: 'Patient form fields',
    seed: () => [ mk('Education','Choice',['None','Primary','Secondary','Upper'],{shipped:true}),
      mk('Marital Status','Choice',['Single','Married','Divorced','Widowed'],{shipped:true}),
      mk('Nationality','Choice',['Malagasy','French','Other'],{shipped:true}),
      mk('Occupation','String',[],{shipped:true}), mk('Custom Notes','Text',[],{shipped:true}),
      mk('Health Region','String',[],{shipped:true,locked:true}), mk('Health District','String',[],{shipped:true,locked:true}) ] },
};

function PreviewCtl({ q }) {
  if (q.type === 'Boolean') return <RadioButtonGroup name={`pv-${q.id}`}><RadioButton labelText="Yes" value="y" id={`y${q.id}`} /><RadioButton labelText="No" value="n" id={`n${q.id}`} /></RadioButtonGroup>;
  if (q.type === 'Choice') return <Select id={`pv-${q.id}`} labelText="" size="sm"><SelectItem value="" text={q.options[0] || '—'} /></Select>;
  if (q.type === 'Checkbox') return <>{(q.options.length ? q.options : ['option']).map((o,i) => <Checkbox key={i} id={`c${q.id}-${i}`} labelText={o} />)}</>;
  if (q.type === 'Text') return <TextArea labelText="" rows={2} id={`pv-${q.id}`} />;
  return <TextInput labelText="" id={`pv-${q.id}`} size="sm" />;
}

function QuestionCard({ q, onChange, onDelete }) {
  const coded = q.type === 'Choice' || q.type === 'Checkbox';
  // Hidden fields COLLAPSE to a compact row (toggle + label + badges) — not a greyed full card.
  if (!q.vis) {
    return (
      <Tile style={{ marginBottom: 6, padding: '4px 12px', background: 'var(--cds-layer-accent)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Toggle id={`vis-${q.id}`} size="sm" hideLabel labelText="Show" toggled={false} onToggle={() => onChange({ vis: true })} />
          <span style={{ flex: 1, fontSize: 12, color: 'var(--cds-text-secondary)' }}>{q.text}</span>
          <Tag type="cool-gray" size="sm">hidden</Tag>
          {q.locked ? <Tag type="blue" size="sm">Site Information</Tag> : q.shipped ? <Tag type="cool-gray" size="sm">shipped</Tag> : <Tag type="blue" size="sm">new</Tag>}
        </div>
      </Tile>
    );
  }
  return (
    <Tile style={{ marginBottom: 8, background: q.shipped ? 'var(--cds-layer-accent)' : undefined }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Toggle id={`vis-${q.id}`} size="sm" hideLabel labelText="Visible" toggled={q.vis} onToggle={(v) => onChange({ vis: v })} />
        <TextInput id={`t-${q.id}`} labelText="" hideLabel value={q.text} readOnly={q.locked} onChange={(e) => onChange({ text: e.target.value })} style={{ flex: 1 }} />
        <Select id={`ty-${q.id}`} labelText="" hideLabel size="sm" value={q.type} disabled={q.locked} onChange={(e) => onChange({ type: e.target.value })} style={{ maxWidth: 120 }}>
          {TYPES.map(t => <SelectItem key={t} value={t} text={t} />)}
        </Select>
        {q.locked ? <Tag type="blue" size="sm">Site Information</Tag> : q.shipped ? <Tag type="cool-gray" size="sm">shipped</Tag> : <Tag type="blue" size="sm">new</Tag>}
        {q.shipped || q.locked
          ? <Button hasIconOnly kind="ghost" size="sm" renderIcon={Locked} iconDescription="Shipped/managed — hide instead of delete" disabled />
          : <Button hasIconOnly kind="danger--ghost" size="sm" renderIcon={TrashCan} iconDescription="Delete" onClick={onDelete} />}
      </div>
      {coded && !q.locked && (
        <div style={{ marginTop: 8, marginLeft: 40 }}>
          {q.options.map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
              <TextInput id={`o-${q.id}-${i}`} labelText="" hideLabel size="sm" value={o} placeholder="Answer option"
                onChange={(e) => { const opts = [...q.options]; opts[i] = e.target.value; onChange({ options: opts }); }} style={{ maxWidth: 240 }} />
              <Button kind="ghost" size="sm" onClick={() => onChange({ options: q.options.filter((_, j) => j !== i) })}>Remove</Button>
            </div>
          ))}
          <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => onChange({ options: [...q.options, ''] })}>Add option</Button>
        </div>
      )}
    </Tile>
  );
}

export default function AdditionalInfoBuilder() {
  const [ctx, setCtx] = useState('program');
  const [mode, setMode] = useState('visual');
  const [store, setStore] = useState(() => { const o = {}; Object.keys(CONTEXTS).forEach(k => (o[k] = CONTEXTS[k].seed())); return o; });
  const [name, setName] = useState('HIV / PMTCT–EID');
  const [domain, setDomain] = useState('CLINICAL');
  const C = CONTEXTS[ctx];
  const qs = store[ctx];
  const setQs = (fn) => setStore(m => ({ ...m, [ctx]: fn(m[ctx]) }));
  const setQ = (id, patch) => setQs(l => l.map(q => q.id === id ? { ...q, ...patch } : q));
  const visQ = qs.filter(q => q.vis);
  const authQ = qs.filter(q => !q.shipped && !q.locked); // admin-authored only — shipped/perma excluded from JSON
  const json = JSON.stringify({ resourceType: 'Questionnaire', status: 'active', item: authQ.map(q => ({ linkId: String(q.id), text: q.text, type: q.type.toLowerCase(), ...(q.options.length ? { answerOption: q.options.map(o => ({ valueString: o })) } : {}) })) }, null, 2);

  const NavLink = ({ id, label }) => <SideNavLink href="#" isActive={ctx === id} onClick={(e) => { e.preventDefault(); setCtx(id); setMode('visual'); }}>{label}</SideNavLink>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', minHeight: 640 }}>
      <SideNav isFixedNav expanded isChildOfHeader={false} aria-label="Additional Information">
        <SideNavItems>
          <NavLink id="program" label="Programs (per order)" />
          <div style={{ fontSize: 11, color: 'var(--cds-text-secondary)', padding: '8px 16px 2px' }}>Order form fields</div>
          <NavLink id="order_clinical" label="Clinical" />
          <NavLink id="order_environmental" label="Environmental" />
          <NavLink id="order_vector" label="Vector" />
          <NavLink id="patient" label="Patient form fields" />
        </SideNavItems>
      </SideNav>

      <div style={{ padding: '18px 26px', maxWidth: 1160 }}>
        <h3 style={{ fontWeight: 400 }}>{ctx === 'program' ? 'Programs' : C.leaf}</h3>
        <InlineNotification kind="info" lowContrast hideCloseButton title={C.label} subtitle={C.attach} style={{ maxWidth: '100%' }} />
        <InlineNotification kind="info" lowContrast hideCloseButton style={{ maxWidth: '100%', marginTop: 8 }}
          title="One builder, per-context"
          subtitle="The submenu switches context. Each order domain has its own always-on set (shared vs unique per domain is expressible); Patient is cross-domain; Programs are selectable per order. Authored fields → QuestionnaireResponse." />

        {C.basicInfo && (
          <Tile style={{ marginTop: 12 }}>
            <h5>Basic Info</h5>
            <Grid narrow style={{ marginTop: 8 }}>
              <Column lg={8}><TextInput id="pname" labelText="Program Name" value={name} onChange={(e) => setName(e.target.value)} /></Column>
              <Column lg={8}><TextInput id="unit" labelText="Lab unit(s)" defaultValue="Serology" /></Column>
            </Grid>
            <RadioButtonGroup legendText="Domain" name="domain" valueSelected={domain} onChange={setDomain} style={{ marginTop: 12 }}>
              <RadioButton labelText="Clinical" value="CLINICAL" id="d1" /><RadioButton labelText="Environmental" value="ENVIRONMENTAL" id="d2" /><RadioButton labelText="Vector" value="VECTOR" id="d3" />
            </RadioButtonGroup>
          </Tile>
        )}

        <Tile style={{ marginTop: 12 }}>
          <h5>Fields</h5>
          <InlineNotification kind="info" lowContrast hideCloseButton style={{ maxWidth: '100%' }}
            title="Shipped fields: hide, don't delete"
            subtitle="'shipped' fields ship with OpenELIS — toggle Visible off to hide (retained, D-002 — future use), not deletable. 'Site Information' fields (Region/District) are managed there. Only 'new' admin-added fields can be deleted. The preview shows visible fields only." />
          <ContentSwitcher selectedIndex={mode === 'visual' ? 0 : 1} onChange={({ index }) => setMode(index === 0 ? 'visual' : 'json')} style={{ maxWidth: 320, margin: '12px 0' }}>
            <Switch name="visual" text="Visual Builder" />
            <Switch name="json" text="JSON" />
          </ContentSwitcher>

          <Grid narrow>
            <Column lg={10} md={5} sm={4}>
              {mode === 'visual' ? (
                <>
                  {qs.map(q => <QuestionCard key={q.id} q={q} onChange={(p) => setQ(q.id, p)} onDelete={() => setQs(l => l.filter(x => x.id !== q.id))} />)}
                  <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => setQs(l => [...l, mk('New question', 'String')])}>Add question</Button>
                </>
              ) : (
                <>
                  <TextArea labelText="FHIR Questionnaire — admin-authored questions only" rows={14} value={json} readOnly />
                  <Button kind="secondary" size="sm" style={{ marginTop: 8 }}>Validate</Button>
                  <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)', marginTop: 6 }}>Only add/removable questions appear here. Shipped/permanent fields are not editable and are excluded from the JSON — manage them via the Visible toggle in the Visual Builder. Paste an LLM-authored or hand-written Questionnaire (no upload); round-trips for the supported subset.</p>
                </>
              )}
            </Column>
            <Column lg={6} md={3} sm={4}>
              <Tile>
                <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--cds-text-secondary)', marginBottom: 10 }}>Example — what staff sees ({visQ.length} visible)</div>
                {visQ.map(q => <div key={q.id} style={{ marginBottom: 12 }}><label style={{ fontSize: 12 }}>{q.text}</label><PreviewCtl q={q} /></div>)}
                {visQ.length === 0 && <p style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>All fields hidden.</p>}
              </Tile>
            </Column>
          </Grid>

          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Button kind="primary">Save</Button><Button kind="secondary">Cancel</Button>
          </div>
        </Tile>
      </div>
    </div>
  );
}
