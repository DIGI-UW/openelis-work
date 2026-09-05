// Route: /MasterListsPage/addlInfoPatient
//        /MasterListsPage/addlInfoClinicalOrder
//        /MasterListsPage/addlInfoEnvOrder
//        /MasterListsPage/addlInfoVectorOrder
// SideNav: Admin Management → Order & Patient Entry Configuration → Additional Information
//          → { Patient screen | Clinical order | Environmental order | Vector order }
// Spec: designs/admin-config/patient-additional-info-surveillance-pmtct.md (v5.3)
//
// Four routes, one component. The active view comes from the route (FR-17); it is NOT an in-page
// mode. Domain and level both come from the view, so no question row carries a domain or level
// control (FR-16, FR-23).

import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid, Column, Stack, Layer, Tile,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem,
  Breadcrumb, BreadcrumbItem,
  Search, Toggle, TextInput, TextArea, Select, SelectItem, NumberInput,
  Button, IconButton, Tag, Modal, InlineNotification, DatePicker, DatePickerInput,
} from '@carbon/react';
import {
  Draggable, ArrowUp, ArrowDown, Add, TrashCan, ChevronDown, ChevronUp, ArrowRight, Save,
} from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

/* ------------------------------------------------------------------ constants */

// FR-17 — the four real configurations. There is deliberately no environmental or vector patient
// view: those orders carry no patient record (vector FR-V02-S1-001).
const VIEWS = [
  { id: 'patient', key: 'patientAddlInfo.nav.patientScreen', label: 'Patient screen',
    domain: 'CLINICAL', lvl: 'pat', route: '/MasterListsPage/addlInfoPatient' },
  { id: 'corder', key: 'patientAddlInfo.nav.clinicalOrder', label: 'Clinical order',
    domain: 'CLINICAL', lvl: 'ord', route: '/MasterListsPage/addlInfoClinicalOrder' },
  { id: 'eorder', key: 'patientAddlInfo.nav.envOrder', label: 'Environmental order',
    domain: 'ENVIRONMENTAL', lvl: 'ord', route: '/MasterListsPage/addlInfoEnvOrder' },
  { id: 'vorder', key: 'patientAddlInfo.nav.vectorOrder', label: 'Vector order',
    domain: 'VECTOR', lvl: 'ord', route: '/MasterListsPage/addlInfoVectorOrder' },
];

const VIEW_HELP = {
  pat: t('patientAddlInfo.surface.patientHelp',
    'Add / Modify Patient. Answered once and carried into every future order for this person.'),
  ord: t('patientAddlInfo.surface.orderHelp',
    'The Additional order details area on the order. Answered per order — a new order starts blank.'),
};

const TYPE_LABELS = {
  text: t('patientAddlInfo.type.text', 'Text'),
  single: t('patientAddlInfo.type.single', 'Single-select'),
  multi: t('patientAddlInfo.type.multi', 'Multi-select'),
  yesno: t('patientAddlInfo.type.yesno', 'Yes/No'),
  date: t('patientAddlInfo.type.date', 'Date'),
  datetime: t('patientAddlInfo.type.datetime', 'Date & time'),
  num: t('patientAddlInfo.type.num', 'Number'),
  dec: t('patientAddlInfo.type.dec', 'Decimal'),
  patientlink: t('patientAddlInfo.type.patientlink', 'Patient link'),
  addr: t('patientAddlInfo.type.addr', 'Address hierarchy'),
  combo: t('patientAddlInfo.type.combo', 'Search / typeahead'),
};
const CODED = ['single', 'multi', 'yesno'];
const AUTHORED_TYPES = ['text', 'single', 'multi', 'yesno', 'date', 'num', 'dec'];
const EXISTING_TYPES = ['text', 'single', 'multi', 'yesno'];
// Intrinsic types the admin can never change — fixed by the nature of the data (FR-12).
const INTRINSIC = ['date', 'datetime', 'num', 'patientlink', 'addr', 'combo'];

// FR-1d — one baseline section per (domain, level) pair.
const SEED_SECTIONS = [
  { id: 'G', nameKey: 'patientAddlInfo.section.patientDetails', name: 'Patient details',
    domain: 'CLINICAL', level: 'pat', system: true, domainLocked: true },
  { id: 'O', nameKey: 'patientAddlInfo.section.orderDetails', name: 'Order details',
    domain: 'CLINICAL', level: 'ord', system: true },
  { id: 'A', name: 'Disease Surveillance', domain: 'CLINICAL' },
  { id: 'B', name: 'HIV / PMTCT–EID', domain: 'CLINICAL' },
  { id: 'E', nameKey: 'patientAddlInfo.section.envOrderDetails', name: 'Environmental order details',
    domain: 'ENVIRONMENTAL', level: 'ord', system: true },
  { id: 'V', nameKey: 'patientAddlInfo.section.vectorOrderDetails', name: 'Vector order details',
    domain: 'VECTOR', level: 'ord', system: true },
];

// `hasData` is a write-once boolean (FR-14.5) — never a count. Counting answers per question would
// mean one aggregate query per row on every render of this page, over tables that only grow.
const SEED_QUESTIONS = [
  { id: 'G1', label: 'Health Region', lvl: 'pat', type: 'addr', origin: 'existing', sec: 'G', vis: true },
  { id: 'G2', label: 'Health District', lvl: 'pat', type: 'addr', origin: 'existing', sec: 'G', vis: true },
  { id: 'G3', label: 'Education', lvl: 'pat', type: 'single', dict: 'education', origin: 'existing', sec: 'G', vis: true },
  { id: 'G4', label: 'Marital Status', lvl: 'pat', type: 'single', dict: 'maritalStatus', origin: 'existing', sec: 'G', vis: true },
  { id: 'G5', label: 'Nationality', lvl: 'pat', type: 'single', dict: 'nationality', origin: 'existing', sec: 'G', vis: true },
  { id: 'G6', label: 'Occupation', lvl: 'pat', type: 'text', origin: 'existing', sec: 'G', vis: true },
  { id: 'G7', label: 'Target Disease Programme', lvl: 'pat', type: 'single', dict: 'program', origin: 'existing', sec: 'G', vis: true },
  { id: 'G8', label: 'Custom Notes', lvl: 'pat', type: 'text', origin: 'existing', sec: 'G', vis: false },

  { id: 'A1', label: 'Signs & symptoms', lvl: 'ord', type: 'text', origin: 'existing', sec: 'A', vis: true },
  { id: 'A2', label: 'Symptom onset date', lvl: 'ord', type: 'date', origin: 'existing', sec: 'A', vis: true },
  { id: 'A3', label: 'Case classification', lvl: 'ord', type: 'single', dict: 'caseClassification', origin: 'existing', sec: 'A', vis: true, req: true, hasData: true },
  { id: 'A4', label: 'Epidemiological link', lvl: 'ord', type: 'text', origin: 'existing', sec: 'A', vis: true },
  { id: 'A5', label: 'Travel to endemic region', lvl: 'ord', type: 'yesno', origin: 'existing', sec: 'A', vis: true },
  { id: 'A6', label: 'Dates of stay', lvl: 'ord', type: 'date', origin: 'existing', sec: 'A', vis: true },
  { id: 'A7', label: 'Medical history', lvl: 'pat', type: 'text', origin: 'existing', sec: 'A', vis: true },
  { id: 'A8', label: 'Comorbidity', lvl: 'pat', type: 'text', origin: 'existing', sec: 'A', vis: true },
  { id: 'A9', label: 'Prior vaccination', lvl: 'pat', type: 'text', origin: 'existing', sec: 'A', vis: false },
  { id: 'A10', label: 'Other', lvl: 'pat', type: 'text', origin: 'existing', sec: 'A', vis: false },

  { id: 'B1', label: 'Mother (patient link)', lvl: 'pat', type: 'patientlink', origin: 'existing', sec: 'B', vis: true, req: true, ph: 'Search patients…' },
  { id: 'B2', label: 'Mother HIV status', lvl: 'pat', type: 'single', dict: 'hivStatus', origin: 'existing', sec: 'B', vis: true },
  { id: 'B3', label: 'ARV during pregnancy', lvl: 'ord', type: 'yesno', origin: 'existing', sec: 'B', vis: true },
  { id: 'B4', label: 'Treatment type (mother)', lvl: 'ord', type: 'single', dict: 'arvTreatmentType', origin: 'existing', sec: 'B', vis: true },
  { id: 'B5', label: 'Recent maternal viral load', lvl: 'ord', type: 'yesno', origin: 'existing', sec: 'B', vis: true },
  { id: 'B6', label: 'Value (copies/ml)', lvl: 'ord', type: 'num', unit: 'copies/ml', origin: 'existing', sec: 'B', vis: true },
  { id: 'B7', label: 'Breastfeeding', lvl: 'ord', type: 'yesno', origin: 'existing', sec: 'B', vis: true },
  { id: 'B8', label: 'Breastfeeding duration (months)', lvl: 'ord', type: 'num', origin: 'existing', sec: 'B', vis: true },
  { id: 'B9', label: 'Weaning', lvl: 'ord', type: 'yesno', origin: 'existing', sec: 'B', vis: true },
  { id: 'B10', label: 'Weaning duration (months)', lvl: 'ord', type: 'num', origin: 'existing', sec: 'B', vis: true },
  { id: 'B11', label: 'Reason for request', lvl: 'ord', type: 'single', dict: 'eidRequestReason', origin: 'existing', sec: 'B', vis: true },
  { id: 'B12', label: 'At-risk population', lvl: 'pat', type: 'single', dict: 'riskPopulation', origin: 'existing', sec: 'B', vis: true },
  { id: 'B13', label: 'ARV treatment start date', lvl: 'pat', type: 'date', origin: 'existing', sec: 'B', vis: true },
  { id: 'B14', label: 'Treatment received', lvl: 'ord', type: 'single', dict: 'arvTreatmentType', origin: 'existing', sec: 'B', vis: true },
  { id: 'Q3', label: 'Infant feeding method at 6 weeks', lvl: 'ord', type: 'single', origin: 'authored', sec: 'B', vis: true },

  // ENVIRONMENTAL baseline — fields already specced in sample-collection/environmental-order-entry.md
  { id: 'E1', label: 'Sampling Site', lvl: 'ord', type: 'combo', origin: 'existing', sec: 'E', vis: true, ph: 'Site name or code…' },
  { id: 'E2', label: 'Submitter', lvl: 'ord', type: 'combo', origin: 'existing', sec: 'E', vis: true, req: true, ph: 'Search organizations…' },
  { id: 'E3', label: 'Container Type', lvl: 'ord', type: 'combo', origin: 'existing', sec: 'E', vis: true, ph: 'Search container types…' },
  { id: 'E4', label: 'GPS coordinates', lvl: 'ord', type: 'text', origin: 'existing', sec: 'E', vis: true },
  { id: 'E5', label: 'Location Details', lvl: 'ord', type: 'text', origin: 'existing', sec: 'E', vis: true },
  { id: 'E6', label: 'Address', lvl: 'ord', type: 'text', origin: 'existing', sec: 'E', vis: false },
  { id: 'E7', label: 'Collection Date/Time', lvl: 'ord', type: 'datetime', origin: 'existing', sec: 'E', vis: true },
  { id: 'E8', label: 'Notes', lvl: 'ord', type: 'text', origin: 'existing', sec: 'E', vis: true },

  // VECTOR baseline — vector-surveillance/vector-collection-workflow.md FR-V02-S1-002 / 002a
  { id: 'V1', label: 'Organism Group', lvl: 'ord', type: 'combo', origin: 'existing', sec: 'V', vis: true, req: true, ph: 'Mosquito, Tick, Rodent…' },
  { id: 'V2', label: 'Lifecycle Stage', lvl: 'ord', type: 'single', dict: 'vectorLifecycleStage', origin: 'existing', sec: 'V', vis: true },
  { id: 'V3', label: 'Quantity (organisms)', lvl: 'ord', type: 'num', origin: 'existing', sec: 'V', vis: true, req: true },
  { id: 'V4', label: 'Trap Type / Collection Method', lvl: 'ord', type: 'combo', origin: 'existing', sec: 'V', vis: true, ph: 'BG-Sentinel, CDC light trap…' },
  { id: 'V5', label: 'Sampling Site', lvl: 'ord', type: 'combo', origin: 'existing', sec: 'V', vis: true, ph: 'Site name or code…' },
  { id: 'V6', label: 'Time of Day', lvl: 'ord', type: 'single', dict: 'vectorTimeOfDay', origin: 'existing', sec: 'V', vis: true },
  { id: 'V7', label: 'Resting Context', lvl: 'ord', type: 'single', dict: 'vectorRestingContext', origin: 'existing', sec: 'V', vis: true },
  { id: 'V8', label: 'Human-Biting Catch', lvl: 'ord', type: 'yesno', origin: 'existing', sec: 'V', vis: true },
  { id: 'V9', label: 'Collection Context Notes', lvl: 'ord', type: 'text', origin: 'existing', sec: 'V', vis: false },
  { id: 'Q1', label: 'Bed net used at collection point', lvl: 'ord', type: 'yesno', origin: 'authored', sec: 'V', vis: true, hasData: true },
];

// Dictionary-backed answer options (FR-3). Options deactivate, never delete (D-002).
const SEED_OPTIONS = {
  caseClassification: [{ t: 'Suspected', a: true }, { t: 'Probable', a: true }, { t: 'Confirmed', a: true }],
  hivStatus: [{ t: 'Positive', a: true }, { t: 'Negative', a: true }, { t: 'Unknown', a: true }],
  yesNo: [{ t: 'Yes', a: true }, { t: 'No', a: true }],
  arvTreatmentType: [{ t: 'AZT', a: true }, { t: 'NVP', a: true }, { t: 'TDF+3TC+DTG', a: true }],
  eidRequestReason: [{ t: '1st PCR (6 wk)', a: true }, { t: '2nd PCR (9 mo)', a: true }, { t: 'Confirmatory', a: true }],
  riskPopulation: [{ t: 'General population', a: true }, { t: 'Key population', a: true }],
  education: [{ t: 'None', a: true }, { t: 'Primary', a: true }, { t: 'Secondary', a: true }, { t: 'Upper', a: true }],
  maritalStatus: [{ t: 'Single', a: true }, { t: 'Married', a: true }, { t: 'Divorced', a: true }, { t: 'Widowed', a: true }],
  nationality: [{ t: 'Malagasy', a: true }, { t: 'French', a: true }, { t: 'Other', a: true }],
  program: [{ t: 'PMTCT', a: true }, { t: 'TB', a: true }, { t: 'Malaria', a: true }],
  Q3Opts: [{ t: 'Exclusive breastfeeding', a: true }, { t: 'Replacement feeding', a: true }, { t: 'Mixed feeding', a: true }],
  vectorLifecycleStage: [{ t: 'Egg', a: true }, { t: 'Larva', a: true }, { t: 'Pupa', a: true }, { t: 'Adult', a: true }, { t: 'Unknown', a: true }],
  vectorTimeOfDay: [{ t: 'Dawn', a: true }, { t: 'Daylight', a: true }, { t: 'Dusk', a: true }, { t: 'Night', a: true }, { t: 'Unknown', a: true }],
  vectorRestingContext: [{ t: 'Indoor', a: true }, { t: 'Outdoor', a: true }, { t: 'Unknown', a: true }],
};

const norm = (qs) => qs.map((q) => ({ req: false, hasData: false, isNew: false, vis: false, ...q }));
const clone = (x) => JSON.parse(JSON.stringify(x));
const secName = (s) => t(s.nameKey || s.name, s.name);

/* ------------------------------------------------------------------ component */

export default function AdditionalInformationConfig({ viewId: routeViewId = 'patient' }) {
  const [viewId, setViewId] = useState(routeViewId);
  const view = VIEWS.find((v) => v.id === viewId);
  const { domain, lvl: surface } = view;

  const [saved, setSaved] = useState(() =>
    clone({ sections: SEED_SECTIONS, qs: norm(SEED_QUESTIONS), opts: SEED_OPTIONS }));
  const [sections, setSections] = useState(() => clone(SEED_SECTIONS));
  const [qs, setQs] = useState(() => clone(norm(SEED_QUESTIONS)));
  const [opts, setOpts] = useState(() => clone(SEED_OPTIONS));

  const [openSec, setOpenSec] = useState({ G: true, O: true, A: true, B: true, E: true, V: true });
  const [showHidden, setShowHidden] = useState({});
  const [expanded, setExpanded] = useState(null);      // one question expanded at a time (FR-19)
  const [optDraft, setOptDraft] = useState('');
  const [newSecName, setNewSecName] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [reviewMode, setReviewMode] = useState(null);  // null | 'review' | 'cancel'
  const [query, setQuery] = useState('');
  const [drag, setDrag] = useState(null);

  const secOf = useCallback((sid) => sections.find((s) => s.id === sid), [sections]);
  const baselineOf = (dom, level) => sections.find((s) => s.system && s.domain === dom && s.level === level);
  const qsIn = useCallback((sid) => qs.filter((q) => q.sec === sid), [qs]);
  const qsHere = useCallback((sid) => qsIn(sid).filter((q) => q.lvl === surface), [qsIn, surface]);
  const catFor = (q) => (q.type === 'yesno' ? 'yesNo' : q.dict || `${q.id}Opts`);
  const isCoded = (q) => CODED.includes(q.type);
  const catUsage = (cat) => qs.filter((q) => isCoded(q) && catFor(q) === cat).length;
  const upd = (id, patch) => setQs((a) => a.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const goView = (id) => { setViewId(id); setExpanded(null); };
  const viewOfQuestion = useCallback((q) => {
    const s = sections.find((x) => x.id === q.sec) || { domain: 'CLINICAL' };
    return (VIEWS.find((v) => v.domain === s.domain && v.lvl === q.lvl) || VIEWS[0]).id;
  }, [sections]);

  /* --- FR-18 / FR-18.1: nothing commits on change; pending edits are attributed to a view --- */
  const pending = useMemo(() => {
    const out = [];
    const PROPS = { label: 'text', type: 'type', vis: 'visible', req: 'required', sec: 'section', unit: 'unit' };
    const prev = Object.fromEntries(saved.qs.map((q) => [q.id, q]));
    const show = (k, v) => (k === 'vis' || k === 'req' ? (v ? 'on' : 'off') : String(v ?? '—'));
    qs.forEach((q) => {
      const o = prev[q.id];
      if (!o) { out.push({ v: viewOfQuestion(q), what: q.label, prop: 'added' }); return; }
      Object.entries(PROPS).forEach(([k, name]) => {
        if ((q[k] ?? '') !== (o[k] ?? '')) {
          out.push({ v: viewOfQuestion(q), what: q.label, prop: name, from: show(k, o[k]), to: show(k, q[k]) });
        }
      });
    });
    saved.qs.forEach((q) => {
      if (!qs.find((x) => x.id === q.id)) out.push({ v: viewOfQuestion(q), what: q.label, prop: 'removed' });
    });
    sections.forEach((s) => {
      const now = qs.filter((q) => q.sec === s.id).map((q) => q.id).join(',');
      const was = saved.qs.filter((q) => q.sec === s.id).map((q) => q.id).join(',');
      // a re-order is ONE change, not one per question that shifted
      if (now !== was && [...now.split(',')].sort().join() === [...was.split(',')].sort().join()) {
        const level = (qs.find((q) => q.sec === s.id) || { lvl: 'ord' }).lvl;
        out.push({ v: (VIEWS.find((x) => x.domain === s.domain && x.lvl === level) || VIEWS[0]).id,
          what: secName(s), prop: 're-ordered' });
      }
      const o = saved.sections.find((x) => x.id === s.id);
      const sv = (VIEWS.find((x) => x.domain === s.domain && x.lvl === (s.level || 'ord')) || VIEWS[0]).id;
      if (!o) out.push({ v: sv, what: secName(s), prop: 'section added' });
      else if (s.name !== o.name) out.push({ v: sv, what: o.name, prop: 'section renamed', from: o.name, to: s.name });
    });
    saved.sections.forEach((s) => {
      if (!sections.find((x) => x.id === s.id)) {
        out.push({ v: (VIEWS.find((x) => x.domain === s.domain && x.lvl === (s.level || 'ord')) || VIEWS[0]).id,
          what: secName(s), prop: 'section deleted' });
      }
    });
    if (JSON.stringify(opts) !== JSON.stringify(saved.opts)) {
      out.push({ v: viewId, what: t('patientAddlInfo.config.responseOptions', 'Answer options'), prop: 'changed' });
    }
    return out;
  }, [qs, sections, opts, saved, viewId, viewOfQuestion]);

  const pendingByView = useMemo(() => {
    const m = {};
    pending.forEach((p) => { m[p.v] = (m[p.v] || 0) + 1; });
    return m;
  }, [pending]);
  const dirty = pending.length;
  const dirtyElsewhere = Object.keys(pendingByView).some((v) => v !== viewId);

  const doSave = () => {
    setReviewMode(null);
    const committed = qs.map((q) => ({ ...q, isNew: false }));
    setQs(committed);
    setSaved(clone({ sections, qs: committed, opts }));
  };
  const doCancel = () => {
    setSections(clone(saved.sections)); setQs(clone(saved.qs)); setOpts(clone(saved.opts));
    setExpanded(null); setReviewMode(null);
  };

  /* --- sections --- */
  const renameSec = (sid, v) => setSections((ss) => ss.map((s) => (s.id === sid ? { ...s, name: v } : s)));
  const moveSec = (sid, dir) => setSections((ss) => {
    const sibs = ss.filter((s) => s.domain === secOf(sid).domain);
    const i = sibs.findIndex((s) => s.id === sid);
    const target = sibs[i + dir];
    if (!target) return ss;
    const c = [...ss];
    const a = c.findIndex((s) => s.id === sid); const b = c.findIndex((s) => s.id === target.id);
    [c[a], c[b]] = [c[b], c[a]];
    return c;
  });
  // FR-1d: questions fall back to the baseline for their OWN domain and level — never across either.
  const deleteSec = (sid) => {
    const dom = secOf(sid).domain;
    setQs((a) => a.map((q) => (q.sec === sid
      ? { ...q, sec: (baselineOf(dom, q.lvl) || baselineOf(dom, 'ord')).id } : q)));
    setSections((ss) => ss.filter((s) => s.id !== sid));
  };
  const addSection = () => {
    const v = newSecName.trim();
    if (!v) return;
    const id = `S${Date.now()}`;
    setSections((ss) => [...ss, { id, name: v, domain }]);
    setOpenSec((o) => ({ ...o, [id]: true }));
    setNewSecName('');
  };

  /* --- questions --- */
  // FR-14: created hidden so a half-authored question never reaches a capture screen, and flagged
  // isNew so FR-21's hidden disclosure doesn't swallow it the moment it is created.
  const addQuestion = (sid) => {
    const id = `N${Date.now()}`;
    const sibs = qsIn(sid);
    const last = sibs[sibs.length - 1];
    const nq = { id, label: t('patientAddlInfo.config.newQuestion', 'New question'),
      lvl: secOf(sid).level || surface, type: 'text', origin: 'authored', sec: sid,
      vis: false, req: false, hasData: false, isNew: true };
    setQs((a) => {
      if (!last) return [...a, nq];
      const i = a.findIndex((q) => q.id === last.id);
      const c = [...a]; c.splice(i + 1, 0, nq); return c;
    });
    setOpenSec((o) => ({ ...o, [sid]: true }));
    setExpanded(id);
  };

  const reorderWithin = (id, mutate) => setQs((a) => {
    const q = a.find((x) => x.id === id);
    const sibs = a.filter((x) => x.sec === q.sec);
    const next = mutate(sibs, q);
    if (!next) return a;
    const slots = a.map((x, i) => (x.sec === q.sec ? i : -1)).filter((i) => i >= 0);
    const c = [...a];
    slots.forEach((slot, k) => { c[slot] = next[k]; });
    return c;
  });
  const moveQ = (id, dir) => reorderWithin(id, (sibs) => {
    const i = sibs.findIndex((x) => x.id === id);
    if (!sibs[i + dir]) return null;
    const c = [...sibs]; [c[i], c[i + dir]] = [c[i + dir], c[i]]; return c;
  });
  const moveQTo = (id, pos) => reorderWithin(id, (sibs, q) => {
    const from = sibs.findIndex((x) => x.id === id);
    if (from === pos) return null;
    const c = [...sibs]; c.splice(from, 1); c.splice(pos, 0, q); return c;
  });
  // FR-15.2 — drag is additive. Arrows and Move-to-position stay: drag alone fails WCAG 2.1 §2.1.1.
  const dropOn = (dragId, targetId) => {
    if (dragId === targetId) return;
    reorderWithin(dragId, (sibs, q) => {
      const to = sibs.findIndex((x) => x.id === targetId);
      if (to < 0) return null;                       // dropping outside the section is a no-op
      const from = sibs.findIndex((x) => x.id === dragId);
      const c = [...sibs]; c.splice(from, 1); c.splice(to, 0, q); return c;
    });
  };
  const removeQ = (id) => { setQs((a) => a.filter((q) => q.id !== id)); setConfirmRemove(null); setExpanded(null); };

  const addOption = (cat) => {
    const v = optDraft.trim();
    if (!v) return;
    setOpts((o) => ({ ...o, [cat]: [...(o[cat] || []), { t: v, a: true }] }));
    setOptDraft('');
  };
  const toggleOption = (cat, i) =>
    setOpts((o) => ({ ...o, [cat]: o[cat].map((x, j) => (j === i ? { ...x, a: !x.a } : x)) }));

  /* --- FR-20: search every question in every view --- */
  const results = query.trim()
    ? qs.filter((q) => q.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 40)
    : [];
  const gotoQuestion = (q) => {
    setViewId(viewOfQuestion(q));
    setOpenSec((o) => ({ ...o, [q.sec]: true }));
    if (!q.vis && !q.isNew) setShowHidden((h) => ({ ...h, [q.sec]: true }));
    setExpanded(q.id);
    setQuery('');
  };

  // A section appears under a view if it is single-level and matches, or holds questions at this
  // level, or is brand new and still empty (FR-23).
  const visibleSections = sections.filter((s) => s.domain === domain).filter((s) =>
    (s.level ? s.level === surface : qsHere(s.id).length > 0 || qsIn(s.id).length === 0));

  /* ---------------------------------------------------------------- rendering */

  const renderQuestionRow = (q, idx, list) => {
    const authored = q.origin === 'authored';
    const intrinsic = q.origin === 'existing' && INTRINSIC.includes(q.type);
    const typeLocked = intrinsic || q.hasData;   // FR-14.3
    const coded = isCoded(q);
    const isAddr = q.type === 'addr';
    const cat = catFor(q);
    const open = expanded === q.id;
    const options = coded ? opts[cat] || [] : [];
    const pos = list.findIndex((x) => x.id === q.id);
    const dropClass = drag && drag.over === q.id ? (drag.after ? 'drop-after' : 'drop-before') : '';
    // never offer a section of the wrong level: that would orphan the question in both views
    const sectionChoices = sections
      .filter((s) => s.domain === domain)
      .filter((s) => !s.level || s.level === q.lvl);

    return (
      <React.Fragment key={q.id}>
        <div
          className={`addl-info__row ${q.isNew ? 'addl-info__row--new' : ''} ${!q.vis && !q.isNew ? 'addl-info__row--off' : ''} ${dropClass}`}
          onDragOver={(e) => {
            if (!drag) return;
            e.preventDefault();
            const r = e.currentTarget.getBoundingClientRect();
            const after = e.clientY > r.top + r.height / 2;
            setDrag((d) => (d && (d.over !== q.id || d.after !== after) ? { ...d, over: q.id, after } : d));
          }}
          onDrop={(e) => { e.preventDefault(); if (drag) dropOn(drag.id, q.id); setDrag(null); }}
        >
          <span
            className="addl-info__drag"
            draggable
            title={t('patientAddlInfo.config.dragHandle', `Drag to reorder ${q.label}`)}
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDrag({ id: q.id, over: null, after: false }); }}
            onDragEnd={() => setDrag(null)}
          >
            <Draggable />
          </span>

          <IconButton kind="ghost" size="sm" disabled={idx === 0} onClick={() => moveQ(q.id, -1)}
            label={t('patientAddlInfo.config.moveUpNamed', `Move ${q.label} up`)}>
            <ArrowUp />
          </IconButton>
          <IconButton kind="ghost" size="sm" disabled={idx === list.length - 1} onClick={() => moveQ(q.id, 1)}
            label={t('patientAddlInfo.config.moveDownNamed', `Move ${q.label} down`)}>
            <ArrowDown />
          </IconButton>

          <Toggle id={`vis-${q.id}`} size="sm" toggled={q.vis} hideLabel
            labelText={t('patientAddlInfo.config.visible', 'Visible')}
            aria-label={`${t('patientAddlInfo.config.visible', 'Visible')}: ${q.label}`}
            onToggle={(v) => upd(q.id, { vis: v })} />

          <span className="addl-info__name">
            {authored ? (
              <TextInput id={`label-${q.id}`} size="sm" hideLabel
                labelText={t('patientAddlInfo.config.questionText', 'Question text')}
                value={q.label} onChange={(e) => upd(q.id, { label: e.target.value })} />
            ) : q.label}

            {/* FR-19.1 — the Required control moved into the panel; its signal stays on the row. */}
            {q.req && (
              <span className="addl-info__required"
                title={t('patientAddlInfo.config.requiredMark', 'Required')}>*</span>
            )}

            <Tag type={authored ? 'blue' : 'cool-gray'} size="sm"
              title={authored
                ? t('patientAddlInfo.config.badgeAddedHelp', 'You created this question. Full authoring; removable while unanswered.')
                : t('patientAddlInfo.config.badgeExistingHelp', "Built-in question. Configure it — it can't be re-authored or removed.")}>
              {authored ? t('patientAddlInfo.config.added', 'added') : t('patientAddlInfo.config.existing', 'existing')}
            </Tag>

            {q.isNew && (
              <Tag type="blue" size="sm">
                {t('patientAddlInfo.config.isNew', 'New — hidden until you switch it on')}
              </Tag>
            )}
            {q.hasData && (
              <Tag type="warm-gray" size="sm"
                title={t('patientAddlInfo.config.typeLockedDataWhy',
                  'This question has saved answers. Changing its type would make them unreadable.')}>
                {t('patientAddlInfo.config.hasData', 'Data entered')}
              </Tag>
            )}
          </span>

          {typeLocked ? (
            <Tag type="gray" size="sm" title={q.hasData && !intrinsic
              ? t('patientAddlInfo.config.typeLockedDataWhy', 'This question has saved answers. Changing its type would make them unreadable.')
              : t('patientAddlInfo.config.typeIntrinsic', "Fixed by the data's nature")}>
              {TYPE_LABELS[q.type]}
            </Tag>
          ) : (
            <Select id={`type-${q.id}`} size="sm" hideLabel noLabel
              labelText={t('patientAddlInfo.config.questionType', 'Type')}
              value={q.type} onChange={(e) => upd(q.id, { type: e.target.value })}>
              {(authored ? AUTHORED_TYPES : EXISTING_TYPES).map((k) => (
                <SelectItem key={k} value={k} text={TYPE_LABELS[k]} />
              ))}
            </Select>
          )}

          <Button kind="ghost" size="sm" aria-expanded={open}
            renderIcon={open ? ChevronUp : ChevronDown}
            onClick={() => { setExpanded(open ? null : q.id); setOptDraft(''); }}>
            {t('patientAddlInfo.config.configure', 'Configure')}
          </Button>
        </div>

        {open && (
          <Layer>
            <Tile className="addl-info__panel">
              <Grid narrow>
                {(authored || isAddr) && (
                  <Column lg={8} md={4} sm={4}>
                    <TextInput id={`text-${q.id}`} size="sm" value={q.label}
                      labelText={isAddr
                        ? t('patientAddlInfo.config.label', 'Label')
                        : t('patientAddlInfo.config.questionText', 'Question text')}
                      helperText={isAddr
                        ? t('patientAddlInfo.config.addrLabelHelp', 'Saved via the existing Site Information / address API')
                        : undefined}
                      onChange={(e) => upd(q.id, { label: e.target.value })} />
                  </Column>
                )}

                <Column lg={4} md={4} sm={4}>
                  <Toggle id={`req-${q.id}`} size="sm" toggled={q.req} disabled={!q.vis}
                    labelText={t('patientAddlInfo.config.required', 'Required')}
                    labelA={t('patientAddlInfo.config.optional', 'Optional')}
                    labelB={t('patientAddlInfo.config.blocksSave', 'Blocks save until answered')}
                    onToggle={(v) => upd(q.id, { req: v })} />
                </Column>

                <Column lg={4} md={4} sm={4}>
                  <Select id={`sec-${q.id}`} size="sm" value={q.sec}
                    labelText={t('patientAddlInfo.config.section', 'Section')}
                    helperText={t('patientAddlInfo.config.sectionHelp', 'Only sections that appear on this screen')}
                    onChange={(e) => upd(q.id, { sec: e.target.value })}>
                    {sectionChoices.map((s) => <SelectItem key={s.id} value={s.id} text={secName(s)} />)}
                  </Select>
                </Column>

                <Column lg={4} md={4} sm={4}>
                  <Select id={`pos-${q.id}`} size="sm" value={pos}
                    labelText={t('patientAddlInfo.config.moveToPosition', 'Move to position')}
                    onChange={(e) => moveQTo(q.id, parseInt(e.target.value, 10))}>
                    {list.map((_, i) => (
                      <SelectItem key={i} value={i} text={`${i + 1} of ${list.length}`} />
                    ))}
                  </Select>
                </Column>

                {(q.type === 'num' || q.type === 'dec') && (
                  <Column lg={4} md={4} sm={4}>
                    <TextInput id={`unit-${q.id}`} size="sm" value={q.unit || ''}
                      labelText={t('patientAddlInfo.config.unit', 'Unit')}
                      placeholder={t('patientAddlInfo.config.unitExample', 'copies/ml')}
                      helperText={t('patientAddlInfo.config.unitHelp', 'Written as the FHIR questionnaire-unit extension')}
                      onChange={(e) => upd(q.id, { unit: e.target.value })} />
                  </Column>
                )}

                {coded && (
                  <Column lg={16} md={8} sm={4}>
                    <p className="cds--label">{t('patientAddlInfo.config.responseOptions', 'Answer options')}</p>
                    <div className="addl-info__chips">
                      {options.map((o, i) => (
                        <Tag key={`${o.t}-${i}`} type={o.a ? 'outline' : 'gray'} filter
                          onClose={() => toggleOption(cat, i)}
                          title={o.a
                            ? t('patientAddlInfo.config.deactivate', 'Deactivate')
                            : t('patientAddlInfo.config.reactivate', 'Reactivate')}>
                          {o.t}
                        </Tag>
                      ))}
                      <TextInput id={`opt-${q.id}`} size="sm" hideLabel value={optDraft}
                        labelText={t('patientAddlInfo.config.addOption', 'Add option')}
                        placeholder={t('patientAddlInfo.config.addOptionPh', 'Add option…')}
                        onChange={(e) => setOptDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') addOption(cat); }} />
                      <Button kind="tertiary" size="sm" renderIcon={Add} onClick={() => addOption(cat)}>
                        {t('patientAddlInfo.config.add', 'Add')}
                      </Button>
                    </div>
                    <p className="cds--form__helper-text">
                      {catUsage(cat) > 1
                        ? t('patientAddlInfo.config.sharedCategory',
                          `Shared by ${catUsage(cat)} questions (${cat}) — editing affects all of them`)
                        : t('patientAddlInfo.config.optionsDeactivate',
                          'Options deactivate, never delete, so saved answers keep their meaning')}
                    </p>
                  </Column>
                )}

                <Column lg={16} md={8} sm={4}>
                  {/* FR-14.2 — removable only while it has never held data; otherwise hide it. */}
                  {!authored ? (
                    <p className="cds--form__helper-text">
                      {t('patientAddlInfo.config.noRemoveExisting',
                        'Built-in question — hide it instead of removing it. It keeps its existing FHIR mapping.')}
                    </p>
                  ) : q.hasData ? (
                    <p className="cds--form__helper-text">
                      {t('patientAddlInfo.config.removeBlockedData',
                        "Can't be removed — this question has data. Switch it off to take it off the form; the answers stay.")}
                    </p>
                  ) : (
                    <Button kind="danger--tertiary" size="sm" renderIcon={TrashCan}
                      onClick={() => setConfirmRemove(q)}>
                      {t('patientAddlInfo.config.remove', 'Remove question')}
                    </Button>
                  )}
                </Column>
              </Grid>
            </Tile>
          </Layer>
        )}
      </React.Fragment>
    );
  };

  const renderSection = (s, idx, arr) => {
    const here = qsHere(s.id);
    const shown = here.filter((q) => q.vis || q.isNew);
    const hidden = here.filter((q) => !q.vis && !q.isNew);
    const elsewhere = qsIn(s.id).filter((q) => q.lvl !== surface);
    const otherView = elsewhere.length
      ? VIEWS.find((v) => v.domain === s.domain && v.lvl === elsewhere[0].lvl) : null;
    const open = openSec[s.id] ?? true;
    const hiddenOpen = !!showHidden[s.id];

    return (
      <Tile key={s.id} className="addl-info__section">
        <div className="addl-info__section-head">
          <IconButton kind="ghost" size="sm" disabled={idx === 0} onClick={() => moveSec(s.id, -1)}
            label={t('patientAddlInfo.config.moveSectionUp', `Move section ${secName(s)} up`)}>
            <ArrowUp />
          </IconButton>
          <IconButton kind="ghost" size="sm" disabled={idx === arr.length - 1} onClick={() => moveSec(s.id, 1)}
            label={t('patientAddlInfo.config.moveSectionDown', `Move section ${secName(s)} down`)}>
            <ArrowDown />
          </IconButton>

          <TextInput id={`secname-${s.id}`} size="sm" hideLabel value={secName(s)}
            labelText={t('patientAddlInfo.config.sectionName', 'Section name')}
            onChange={(e) => renameSec(s.id, e.target.value)} />

          {s.system && (
            <Tag type="cool-gray" size="sm"
              title={t('patientAddlInfo.config.systemSectionHelp',
                'Baseline section for this view — renamable, not deletable')}>
              {t('patientAddlInfo.config.system', 'system')}
            </Tag>
          )}

          <span className="cds--form__helper-text">
            {t('patientAddlInfo.config.sectionCount',
              `${shown.filter((q) => q.vis).length} on · ${here.length} here`)}
          </span>

          {/* FR-23.3 — a section spanning both screens names its counterpart, so nobody concludes
              questions were deleted when the count changes between views. */}
          {otherView && (
            <Button kind="ghost" size="sm" renderIcon={ArrowRight}
              onClick={() => { goView(otherView.id); setOpenSec((o) => ({ ...o, [s.id]: true })); }}>
              {t('patientAddlInfo.config.counterpart',
                `${elsewhere.length} on ${t(otherView.key, otherView.label)}`)}
            </Button>
          )}

          {!s.system && (
            <IconButton kind="ghost" size="sm" onClick={() => deleteSec(s.id)}
              label={t('patientAddlInfo.config.deleteSection',
                "Delete section — questions return to this view's baseline")}>
              <TrashCan />
            </IconButton>
          )}

          <IconButton kind="ghost" size="sm" onClick={() => setOpenSec((o) => ({ ...o, [s.id]: !open }))}
            label={t('patientAddlInfo.config.expandSection', 'Expand section')}>
            {open ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        </div>

        {open && (
          <div className="addl-info__section-body">
            {shown.length > 0
              ? shown.map((q, i) => renderQuestionRow(q, i, here))
              : (
                <p className="cds--form__helper-text addl-info__empty">
                  {here.length > 0
                    ? t('patientAddlInfo.config.allSwitchedOff', 'Every question here is switched off.')
                    : s.id === 'O'
                      ? t('patientAddlInfo.config.orderDetailsEmpty',
                        'Questions asked on every clinical order, whatever the program. Nothing here yet — add the first one.')
                      : t('patientAddlInfo.config.sectionEmpty', 'Nothing here yet — add the first question.')}
                </p>
              )}

            {/* FR-21 — switched-off questions collapse out of the way. An answered question can
                never be removed, so without this a section's list only ever grows. */}
            {hiddenOpen && hidden.map((q) => renderQuestionRow(q, here.findIndex((x) => x.id === q.id), here))}

            <div className="addl-info__section-actions">
              <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => addQuestion(s.id)}>
                {t('patientAddlInfo.config.addQuestion', 'Add question')}
              </Button>
              {hidden.length > 0 && (
                <Button kind="ghost" size="sm"
                  onClick={() => setShowHidden((h) => ({ ...h, [s.id]: !hiddenOpen }))}>
                  {hiddenOpen
                    ? t('patientAddlInfo.config.hiddenHide', 'Hide switched-off questions')
                    : t('patientAddlInfo.config.hiddenShow', `${hidden.length} hidden — show`)}
                </Button>
              )}
            </div>
          </div>
        )}
      </Tile>
    );
  };

  const previewControl = (q) => {
    switch (q.type) {
      case 'text':
        return <TextArea id={`p-${q.id}`} labelText={q.label} hideLabel readOnly rows={2} />;
      case 'date':
        return (
          <DatePicker datePickerType="single">
            <DatePickerInput id={`p-${q.id}`} labelText={q.label} hideLabel placeholder={t('common.dateFormat', 'mm/dd/yyyy')} readOnly />
          </DatePicker>
        );
      case 'datetime':
        return <TextInput id={`p-${q.id}`} labelText={q.label} hideLabel readOnly placeholder={t('common.dateTimeFormat', 'mm/dd/yyyy --:--')} />;
      case 'num': case 'dec':
        return <NumberInput id={`p-${q.id}`} label={q.label} hideLabel readOnly value={0}
          helperText={q.unit} iconDescription="" />;
      case 'patientlink': case 'combo':
        return <TextInput id={`p-${q.id}`} labelText={q.label} hideLabel readOnly placeholder={q.ph || 'Search…'} />;
      case 'addr':
        return (
          <Select id={`p-${q.id}`} labelText={q.label} hideLabel disabled>
            <SelectItem value="" text={t('patientAddlInfo.preview.fromAddressHierarchy',
              'From address hierarchy (Organization data)')} />
          </Select>
        );
      default: {
        const active = (opts[catFor(q)] || []).filter((o) => o.a);
        return (
          <Select id={`p-${q.id}`} labelText={q.label} hideLabel disabled>
            {active.map((o) => <SelectItem key={o.t} value={o.t} text={o.t} />)}
          </Select>
        );
      }
    }
  };

  const previewSections = visibleSections
    .map((s) => ({ s, shown: qsHere(s.id).filter((q) => q.vis) }))
    .filter(({ shown }) => shown.length > 0);

  return (
    <Grid className="addl-info">
      {/* SideNav — FR-17. Four views, four routes. Not in-page tabs: the standing IA convention is
          that multi-view screens nest as SideNav submenu items. */}
      <Column lg={3} md={2} sm={4}>
        <SideNav isFixedNav expanded isChildOfHeader={false}
          aria-label={t('patientAddlInfo.nav.additionalInformation', 'Additional Information')}>
          <SideNavItems>
            <SideNavMenu title={t('patientAddlInfo.nav.additionalInformation', 'Additional Information')} defaultExpanded>
              {VIEWS.map((v) => (
                <SideNavMenuItem key={v.id} href={v.route} isActive={v.id === viewId}
                  onClick={(e) => { e.preventDefault(); goView(v.id); }}>
                  {t(v.key, v.label)}
                  {pendingByView[v.id] ? <Tag type="blue" size="sm">{pendingByView[v.id]}</Tag> : null}
                </SideNavMenuItem>
              ))}
            </SideNavMenu>
          </SideNavItems>
        </SideNav>
      </Column>

      <Column lg={7} md={4} sm={4}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/admin">{t('breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem href="/MasterListsPage/orderPatientEntryConfig">
            {t('breadcrumb.orderPatientEntryConfig', 'Order & Patient Entry Configuration')}
          </BreadcrumbItem>
          <BreadcrumbItem href={view.route} isCurrentPage>{t(view.key, view.label)}</BreadcrumbItem>
        </Breadcrumb>

        <h1 className="addl-info__title">
          {t('patientAddlInfo.nav.additionalInformation', 'Additional Information')} — {t(view.key, view.label)}
        </h1>

        {/* FR-23.1 — the view states its consequence: whether an answer follows the person. */}
        <InlineNotification kind="info" lowContrast hideCloseButton
          title={t(view.key, view.label)} subtitle={VIEW_HELP[surface]} />

        {/* FR-20 — search spans every view, because a question in another view is not collapsed,
            it is absent from the page entirely. */}
        <div className="addl-info__search">
          <Search size="lg" labelText={t('patientAddlInfo.config.search', 'Search questions')}
            placeholder={t('patientAddlInfo.config.searchPlaceholder', 'Search all views…')}
            value={query} onChange={(e) => setQuery(e.target.value)} />
          {query.trim() !== '' && (
            <Layer>
              <ul className="addl-info__results">
                {results.length === 0 && (
                  <li className="addl-info__result addl-info__result--none">
                    {t('patientAddlInfo.config.searchNone', `No question matches "${query.trim()}"`)}
                  </li>
                )}
                {results.map((q) => {
                  const s = secOf(q.sec);
                  const v = VIEWS.find((x) => x.domain === s.domain && x.lvl === q.lvl);
                  return (
                    <li key={q.id}>
                      <Button kind="ghost" size="sm" className="addl-info__result"
                        onClick={() => gotoQuestion(q)}>
                        <span>{q.label}</span>
                        {!q.vis && <Tag type="gray" size="sm">{t('patientAddlInfo.config.hidden', 'hidden')}</Tag>}
                        {q.origin === 'authored' && <Tag type="blue" size="sm">{t('patientAddlInfo.config.added', 'added')}</Tag>}
                        {q.hasData && <Tag type="warm-gray" size="sm">{t('patientAddlInfo.config.hasData', 'Data entered')}</Tag>}
                        <span className="addl-info__result-path">
                          {t(`domain.${s.domain.toLowerCase()}`, s.domain)} › {v ? t(v.key, v.label) : '—'} › {secName(s)}
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Layer>
          )}
        </div>

        <Stack gap={4}>
          {visibleSections.map((s, i, arr) => renderSection(s, i, arr))}

          <div className="addl-info__add-section">
            <TextInput id="new-section" size="sm" value={newSecName}
              labelText={t('patientAddlInfo.config.newSectionName', 'New section name')}
              onChange={(e) => setNewSecName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addSection(); }} />
            <Button kind="tertiary" size="sm" renderIcon={Add} onClick={addSection}>
              {t('patientAddlInfo.config.addSectionTo', `Add section to ${t(view.key, view.label)}`)}
            </Button>
          </div>
        </Stack>
      </Column>

      {/* Live preview — Programs FR-13.5 uses the same wording for the same thing. */}
      <Column lg={6} md={8} sm={4}>
        <h2 className="addl-info__preview-title">
          {t('patientAddlInfo.preview.title', 'Live preview')} — {t(view.key, view.label)}
        </h2>
        <Stack gap={4}>
          {previewSections.length === 0 && (
            <p className="cds--form__helper-text">
              {t('patientAddlInfo.preview.empty',
                'Nothing enabled for this screen — it looks exactly as it does today.')}
            </p>
          )}
          {previewSections.map(({ s, shown }) => (
            <Tile key={s.id}>
              <h3 className="addl-info__preview-section">{secName(s)}</h3>
              <Grid narrow>
                {shown.map((q) => (
                  <Column key={q.id} lg={q.type === 'text' ? 16 : 8} md={q.type === 'text' ? 8 : 4} sm={4}>
                    {/* clicking a question in the preview opens its configuration */}
                    <button type="button" className="addl-info__preview-field" onClick={() => gotoQuestion(q)}>
                      <span className="cds--label">
                        {q.label}{q.req && <span className="addl-info__required"> *</span>}
                        {q.origin === 'authored' && <Tag type="blue" size="sm">{t('patientAddlInfo.config.added', 'added')}</Tag>}
                      </span>
                      {previewControl(q)}
                    </button>
                  </Column>
                ))}
              </Grid>
            </Tile>
          ))}
        </Stack>
      </Column>

      {/* FR-18 / FR-18.1 — nothing is live until Save, and pending edits name the view they belong
          to: a bare count invites discarding work you cannot see. */}
      <div className="addl-info__savebar">
        <span className="addl-info__savebar-count">
          {dirty === 0
            ? t('patientAddlInfo.config.noChanges', 'No unsaved changes')
            : t('patientAddlInfo.config.unsavedCount',
              `${dirty} unsaved change${dirty === 1 ? '' : 's'} — nothing is live until you save`)}
          {dirty > 0 && (
            <span className="addl-info__savebar-where">
              {Object.keys(pendingByView).map((vid) => {
                const v = VIEWS.find((x) => x.id === vid);
                return (
                  <Button key={vid} kind="ghost" size="sm" onClick={() => goView(vid)}>
                    {t('patientAddlInfo.config.pendingIn',
                      `${pendingByView[vid]} on ${t(v.key, v.label)}`)}
                  </Button>
                );
              })}
            </span>
          )}
        </span>

        {Object.keys(pendingByView).length > 1 && (
          <Button kind="tertiary" onClick={() => setReviewMode('review')}>
            {t('patientAddlInfo.config.reviewChanges', 'Review changes')}
          </Button>
        )}
        <Button kind="secondary" disabled={dirty === 0}
          onClick={() => (dirtyElsewhere ? setReviewMode('cancel') : doCancel())}>
          {t('patientAddlInfo.config.cancel', 'Cancel')}
        </Button>
        <Button kind="primary" disabled={dirty === 0} renderIcon={Save} onClick={doSave}>
          {t('patientAddlInfo.config.save', 'Save')}
        </Button>
      </div>

      {reviewMode && (
        <Modal
          open
          modalHeading={reviewMode === 'cancel'
            ? t('patientAddlInfo.config.cancelConfirm', 'Discard unsaved changes?')
            : t('patientAddlInfo.config.reviewChanges', 'Review changes')}
          primaryButtonText={reviewMode === 'cancel'
            ? t('patientAddlInfo.config.discardAll', 'Discard all')
            : t('patientAddlInfo.config.close', 'Close')}
          secondaryButtonText={reviewMode === 'cancel'
            ? t('patientAddlInfo.config.keepEditing', 'Keep editing') : undefined}
          danger={reviewMode === 'cancel'}
          onRequestSubmit={() => (reviewMode === 'cancel' ? doCancel() : setReviewMode(null))}
          onRequestClose={() => setReviewMode(null)}
        >
          <p>{reviewMode === 'cancel'
            ? t('patientAddlInfo.config.cancelConfirmBody',
              "Some of these changes are on views you aren't looking at. Discarding removes all of them.")
            : t('patientAddlInfo.config.reviewBody',
              'Nothing below is live yet. Save commits every one of these in a single transaction.')}</p>
          {VIEWS.filter((v) => pendingByView[v.id]).map((v) => (
            <div key={v.id}>
              <h4 className="addl-info__review-group">{t(v.key, v.label)} — {pendingByView[v.id]}</h4>
              {pending.filter((p) => p.v === v.id).map((p, i) => (
                <p key={i} className="addl-info__review-row">
                  {p.what} — {p.prop}{p.from || p.to ? ` · ${p.from} → ${p.to}` : ''}
                </p>
              ))}
            </div>
          ))}
        </Modal>
      )}

      {confirmRemove && (
        <Modal
          open danger
          modalHeading={t('patientAddlInfo.config.removeConfirmTitle', 'Remove this question?')}
          primaryButtonText={t('patientAddlInfo.config.remove', 'Remove')}
          secondaryButtonText={t('patientAddlInfo.config.cancel', 'Cancel')}
          onRequestSubmit={() => removeQ(confirmRemove.id)}
          onRequestClose={() => setConfirmRemove(null)}
        >
          <p>{t('patientAddlInfo.config.removeConfirmBody',
            `"${confirmRemove.label}" has never been answered and will be removed from ${secName(secOf(confirmRemove.sec))}. Questions that already have saved answers can't be removed — switch them off instead.`)}</p>
        </Modal>
      )}
    </Grid>
  );
}
