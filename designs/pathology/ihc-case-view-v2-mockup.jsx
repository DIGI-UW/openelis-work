// Route:      /ImmunohistochemistryCaseView/:immunohistochemistrySampleId
// SideNav:    Immunohistochemistry → Dashboard → Case View
// Breadcrumb: Home / Immunohistochemistry / Dashboard / Case [LabNumber]
// FRS:        ihc-case-view-v2.md v2.0
// Shell:      case-view-shell.md v1.0
// Epic:       OGC-265  — HELD from implementation pending the threshold-set mechanism
// Sibling:    pathology-case-view-mockup.jsx (OGC-264) — the shell components below are the same ones
//
// Reference implementation for developer handoff. Not production code: data is mocked and
// persistence is stubbed. What it IS authoritative about is the patterns — interpretive
// thresholds as versioned data resolved on a composite key, the provenance recorded with
// every result, and the Carbon components each requirement names.
//
// Non-negotiables visible in here, each traceable to the FRS:
//   * Thresholds are DATA, not code. Resolution is a lookup on a composite key.     (FR-5.1, FR-5.2)
//   * Every result stores its raw measurement AND the set that interpreted it.      (FR-5.1)
//   * The applied set's source and edition are displayed next to the category.      (FR-5.3)
//   * Freeze at report, apply forward. A new edition never rewrites a signed result. (FR-5.4)
//   * Override is allowed, requires a reason, and keeps the raw value and the set.  (FR-5.5)
//   * No matching set means "Not interpreted". Never fall back to another set.      (FR-5.6)
//   * HER2 IHC is 0 / 1+ / 2+ / 3+ — four distinct stored values, non-collapsible.  (FR-6.1)
//   * There is no ISH "Equivocal". Groups 2, 3, 4 route to concurrent IHC review.   (FR-6.5)
//   * Ki-67 5–30% reports as indeterminate. No 20% cutpoint exists in code.         (FR-7.5, FR-7.6)
//   * ER/PgR is percentage + intensity. Allred is supplementary, never the source.  (FR-7.4)
//   * Panel completion is derived from results, and the badge NAMES what is missing. (FR-4.3, FR-4.4)
//   * Blocks and slides are READ from the referring case. No IHC-side copies.       (FR-1.4, S-10)
//   * No enum, lookup or branch is keyed on a display label.                        (FR-12.1, AC-25)
//   * The screen states categories. It emits no therapy recommendation, anywhere.   (FR-9.3, AC-22)
//   * Operator and timestamp come from session + server. Never typed.               (FR-2.3)
//   * One click opens a report in a new tab. No per-row download/print/email.       (FR-10.1)
//   * Void, never delete.                                                           (S-10.4)

import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid, Column, Stack, Breadcrumb, BreadcrumbItem,
  Accordion, AccordionItem,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TextInput, TextArea, Select, SelectItem, NumberInput,
  Button, Tag, Tile, InlineNotification, Modal, Link,
} from '@carbon/react';
import { Save } from '@carbon/icons-react';

// i18n. Every visible string goes through this. Replace with useIntl() on integration.
// The shipped ImmunohistochemistryCaseView.jsx already uses an i18n breadcrumb key, so
// this must not regress. (FR-12)
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// FR-12.1 — THE CONVERSION HAZARD, HANDLED.
//
// The shipped component keys its arithmetic and its lookups on DISPLAY STRINGS:
//     intensityScores = { 'Negative': 0, 'Weak': 1, 'Moderate': 2, 'Strong': 3 }
//     her2Status === 'Positive'
//     panelMarkerStatus[marker.name]
// Translate any of those labels and the arithmetic silently changes answer. Every enum
// below is therefore { code, i18n, label } and every comparison is on `code`. Decoupling
// keys from labels is a PREREQUISITE of i18n here, not a later cleanup. (AC-25)
// ---------------------------------------------------------------------------
const INTENSITY = [
  { code: 'NEGATIVE', ordinal: 0, i18n: 'ihc.intensity.negative', label: 'Negative' },
  { code: 'WEAK',     ordinal: 1, i18n: 'ihc.intensity.weak',     label: 'Weak' },
  { code: 'MODERATE', ordinal: 2, i18n: 'ihc.intensity.moderate', label: 'Moderate' },
  { code: 'STRONG',   ordinal: 3, i18n: 'ihc.intensity.strong',   label: 'Strong' },
];
const intensityLabel = (code) => {
  const i = INTENSITY.find((x) => x.code === code);
  return i ? t(i.i18n, i.label) : '—';
};

// HER2 IHC: four distinct stored values. Nothing in this file collapses 0 and 1+, and
// nothing should be added that does. (FR-6.1, AC-13)
const HER2_IHC_SCORES = [
  { code: '0',  i18n: 'ihc.her2.score0',  label: '0',  criterion: 'No staining observed' },
  { code: '1+', i18n: 'ihc.her2.score1',  label: '1+', criterion: 'Incomplete, faint or barely perceptible staining in >10% of tumour cells' },
  { code: '2+', i18n: 'ihc.her2.score2',  label: '2+', criterion: 'Weak-to-moderate complete membrane staining in >10% of tumour cells' },
  { code: '3+', i18n: 'ihc.her2.score3',  label: '3+', criterion: 'Complete, intense circumferential membrane staining in >10% of tumour cells' },
];

const INTERNAL_CONTROL = [
  { code: 'PRESENT_ADEQUATE',   i18n: 'ihc.control.presentAdequate',   label: 'Present, adequate' },
  { code: 'PRESENT_INADEQUATE', i18n: 'ihc.control.presentInadequate', label: 'Present, inadequate' },
  { code: 'ABSENT',             i18n: 'ihc.control.absent',            label: 'Absent' },
];

const internalControlLabel = (code) => {
  const c = INTERNAL_CONTROL.find((x) => x.code === code);
  return c ? t(c.i18n, c.label) : '—';
};

// The existing ImmunohistochemistryStatus enum, plus UNDER_REVIEW. That is the only
// enum change — IHC has no bench stages of its own; the tissue work belongs to the
// referring histopathology case. (FR-2.1, FR-2.2, AC-4)
const STATUSES = [
  { code: 'IN_PROGRESS',       i18n: 'ihc.stage.inProgress',       label: 'In Progress' },
  { code: 'READY_PATHOLOGIST', i18n: 'ihc.stage.readyPathologist', label: 'Ready for Pathologist' },
  { code: 'UNDER_REVIEW',      i18n: 'ihc.stage.underReview',      label: 'Under Pathologist Review' },
  { code: 'COMPLETED',         i18n: 'ihc.stage.completed',        label: 'Completed' },
];
const statusIndex = (code) => STATUSES.findIndex((s) => s.code === code);

// Shared status vocabulary from the shell. A badge conveys state in TEXT as well as
// colour — never colour alone. (S-4.3, AC-29)
const TAG_KIND = {
  complete: 'green', critical: 'red', inProgress: 'blue',
  pending: 'purple', verified: 'teal', partial: 'warm-gray', none: 'gray',
};

// ===========================================================================
// INTERPRETIVE THRESHOLD SETS
//
// This block is the whole point of the FRS, and on integration IT DOES NOT LIVE HERE.
// Threshold sets are versioned, source-stamped reference data delivered by the Catalog
// Subscription mechanism — the same mechanism that carries CLSI M100 and EUCAST AMR
// breakpoints, which is why it is one mechanism and not two. They are modelled as data
// in this file so the handoff shows the SHAPE the screen consumes:
//
//   * a stable `ref` that gets written onto the result,
//   * a `source` and `edition` that get displayed and reported,
//   * a `resolve` that turns a raw measurement into a category.
//
// What must never happen is a cutoff appearing as a literal in a component. If you find
// yourself typing `if (pct >= 20)` anywhere in the application, the design has been lost.
// (FR-5.1, FR-5.2, AC-8, AC-20)
// ===========================================================================
const THRESHOLD_SETS = {
  ER_PGR_2020: {
    ref: 'ASCO/CAP ER-PgR 2020 · v1',
    source: 'ASCO/CAP Guideline Update, Jan 2020 (JCO 10.1200/JCO.19.02309)',
    effective: '2020-01-13',
    // The composite key. A set is NOT identified by marker alone. PD-L1 has four
    // approved assays and five scoring systems whose cutoffs are explicitly not
    // interchangeable; a scalar threshold field would let a lab report a 22C3 cutoff
    // against an SP142 stain and see nothing wrong. (FR-5.2)
    key: { markers: ['ER', 'PGR'], clones: ['SP1', '1E2'], platform: 'VENTANA_ULTRA',
           scoringSystem: 'PERCENT_INTENSITY', tumourType: 'BREAST', indication: null },
    resolve: (pct) => {
      if (pct === null || Number.isNaN(pct)) return null;
      if (pct < 1)   return { categoryCode: 'NEGATIVE',     i18n: 'ihc.category.negative',    label: 'Negative',     kind: TAG_KIND.none };
      if (pct <= 10) return { categoryCode: 'LOW_POSITIVE', i18n: 'ihc.category.lowPositive', label: 'Low positive', kind: TAG_KIND.partial,
                              // Mandatory reporting comment. It is SET CONTENT, rendered
                              // automatically and not editable away. (FR-7.2)
                              mandatoryComment: ['ihc.banner.lowPositiveComment',
                                '1–10% staining is reported as low positive. There are limited data on endocrine responsiveness in this range.'] };
      return             { categoryCode: 'POSITIVE',     i18n: 'ihc.category.positive',    label: 'Positive',     kind: TAG_KIND.complete };
    },
  },

  KI67_IKWG_2021: {
    ref: 'IKWG Ki-67 2021 · v1',
    source: 'International Ki-67 in Breast Cancer Working Group, 2021 (JNCI 113:808)',
    effective: '2021-07-01',
    key: { markers: ['KI67'], clones: ['30-9', 'MIB-1'], platform: 'VENTANA_ULTRA',
           scoringSystem: 'PERCENT', tumourType: 'BREAST', indication: null },
    resolve: (pct) => {
      if (pct === null || Number.isNaN(pct)) return null;
      if (pct <= 5)  return { categoryCode: 'LOW',  i18n: 'ihc.category.low',  label: 'Low',  kind: TAG_KIND.complete };
      if (pct >= 30) return { categoryCode: 'HIGH', i18n: 'ihc.category.high', label: 'High', kind: TAG_KIND.critical };
      // The band between is reported AS indeterminate, with the guideline's own caveat.
      // It is not forced to a binary. IKWG found concordance in this range below what it
      // accepts, and says so. (FR-7.6, AC-20)
      return { categoryCode: 'INDETERMINATE', i18n: 'ihc.category.indeterminate', label: 'Indeterminate', kind: TAG_KIND.partial,
               mandatoryComment: ['ihc.banner.ki67Indeterminate',
                 'Values between 5% and 30% are not currently actionable; concordance in this range is below the threshold the guideline accepts.'] };
    },
  },

  // Present only to demonstrate why the edition must be recorded per result. A deployment
  // that must apply a different cutpoint does it by configuring a set whose source names
  // the requirement — never by editing a component. (FR-7.7)
  //
  // AC-20 says no 20% cutpoint exists in application code, and this does not contradict
  // it: the number below is MOCK REFERENCE DATA standing in for a subscribed set, in the
  // block this file's header says does not survive integration. If 20 ends up in a
  // component, a service or a validator, that is the violation.
  KI67_LEGACY_20: {
    ref: 'Local legacy Ki-67 20% · v0',
    source: 'Local protocol — single 20% cutpoint. Its regulatory anchor was withdrawn by the FDA in March 2023.',
    effective: '2018-01-01',
    deprecated: true,
    key: { markers: ['KI67'], clones: ['30-9', 'MIB-1'], platform: 'VENTANA_ULTRA',
           scoringSystem: 'PERCENT', tumourType: 'BREAST', indication: null },
    resolve: (pct) => {
      if (pct === null || Number.isNaN(pct)) return null;
      return pct < 20
        ? { categoryCode: 'LOW',  i18n: 'ihc.category.low',  label: 'Low',  kind: TAG_KIND.complete }
        : { categoryCode: 'HIGH', i18n: 'ihc.category.high', label: 'High', kind: TAG_KIND.critical };
    },
  },

  HER2_IHC_2023: {
    ref: 'ASCO/CAP HER2 IHC 2023 · v1',
    source: 'ASCO/CAP Guideline Update, Jun 2023 (JCO 10.1200/JCO.22.02864) — criteria unchanged from the 2018 focused update',
    effective: '2023-06-07',
    key: { markers: ['HER2'], clones: ['4B5'], platform: 'VENTANA_ULTRA',
           scoringSystem: 'HER2_IHC', tumourType: 'BREAST', indication: null },
    // No resolve(). The HER2 IHC score IS the stored value — the set supplies the
    // criteria the pathologist scores against and the vocabulary the report uses, and
    // it is not a function that collapses four values into two. (FR-6.1, FR-6.3)
    scoreCriteria: HER2_IHC_SCORES,
    // FR-6.3: whether a deployment renders a "HER2-low" descriptor is set vocabulary,
    // because ASCO/CAP declined to create the category in 2023 and ESMO uses it. The
    // stored value stays the 0/1+/2+/3+ score either way. (AC-14)
    lowDescriptor: null,
    reflexToIsh: ['2+'],
  },

  HER2_ISH_2023: {
    ref: 'ASCO/CAP HER2 ISH 2023 · Groups 1–5',
    source: 'ASCO/CAP 2018 focused update, confirmed 2023. The ISH equivocal category was abolished in 2018.',
    effective: '2023-06-07',
    key: { markers: ['HER2_ISH'], clones: ['INFORM HER2 Dual ISH'], platform: 'VENTANA_ULTRA',
           scoringSystem: 'ISH_RATIO', tumourType: 'BREAST', indication: null },
    resolve: (ratio, her2Signals) => {
      if (ratio === null || her2Signals === null || Number.isNaN(ratio) || Number.isNaN(her2Signals)) return null;
      const review = { categoryCode: 'CONCURRENT_IHC_REVIEW', i18n: 'ihc.category.concurrentIhcReview',
                       label: 'Requires concurrent IHC review', kind: TAG_KIND.partial };
      if (ratio >= 2.0 && her2Signals >= 4.0) return { group: 1, categoryCode: 'POSITIVE', i18n: 'ihc.category.positive', label: 'Positive', kind: TAG_KIND.critical };
      if (ratio >= 2.0 && her2Signals <  4.0) return { group: 2, ...review };
      if (ratio <  2.0 && her2Signals >= 6.0) return { group: 3, ...review };
      if (ratio <  2.0 && her2Signals >= 4.0) return { group: 4, ...review };
      return { group: 5, categoryCode: 'NEGATIVE', i18n: 'ihc.category.negative', label: 'Negative', kind: TAG_KIND.complete };
    },
  },

  // Superseded, and kept in the mockup deliberately. Switch a case to it and Group 4
  // becomes "Equivocal — retest with alternate assay", which is the pre-2018 model the
  // December 2025 design shipped. Same measurement, different answer: that is the
  // argument for recording the edition on the result. (FR-5.4, FR-6.5, AC-16)
  HER2_ISH_2013: {
    ref: 'ASCO/CAP HER2 ISH 2013 · superseded',
    source: 'ASCO/CAP 2013 Update (JCO 10.1200/JCO.2013.50.9984). Superseded in 2018.',
    effective: '2013-10-07',
    deprecated: true,
    key: { markers: ['HER2_ISH'], clones: ['INFORM HER2 Dual ISH'], platform: 'VENTANA_ULTRA',
           scoringSystem: 'ISH_RATIO', tumourType: 'BREAST', indication: null },
    resolve: (ratio, her2Signals) => {
      if (ratio === null || her2Signals === null) return null;
      if (ratio >= 2.0 || her2Signals >= 6.0) return { group: null, categoryCode: 'POSITIVE', i18n: 'ihc.category.positive', label: 'Positive', kind: TAG_KIND.critical };
      if (her2Signals >= 4.0 && her2Signals < 6.0) return { group: null, categoryCode: 'EQUIVOCAL', i18n: 'ihc.category.equivocal', label: 'Equivocal — retest with alternate assay', kind: TAG_KIND.pending };
      return { group: null, categoryCode: 'NEGATIVE', i18n: 'ihc.category.negative', label: 'Negative', kind: TAG_KIND.complete };
    },
  },

  // FR-5.6, AC-12 — named, seeded EMPTY. The specific loci counts and percentage-unstable
  // thresholds could not be verified against a primary source, and inventing them would
  // be worse than leaving them to the laboratory. A marker keyed here resolves to
  // "Not interpreted", which is the correct behaviour, not a bug.
  MMR_MSI: {
    ref: 'MMR / MSI — no set seeded',
    source: 'Named but deliberately empty pending laboratory or SME authorship.',
    effective: null,
    key: { markers: ['MLH1', 'PMS2', 'MSH2', 'MSH6'], clones: null, platform: null,
           scoringSystem: null, tumourType: null, indication: null },
    resolve: null,
  },
};

// Resolution on the FULL composite key. A set matching on marker alone is not a match.
// Returns null rather than a nearest-neighbour, and null means "Not interpreted" — never
// a silent fallback to another set. (FR-5.2, FR-5.6, AC-8, AC-12)
function resolveThresholdSet({ marker, clone, platform, scoringSystem, tumourType, indication }, preferredSetId) {
  const candidates = Object.entries(THRESHOLD_SETS).filter(([, s]) => {
    const k = s.key;
    if (!k.markers.includes(marker)) return false;
    if (k.clones && clone && !k.clones.includes(clone)) return false;
    if (k.platform && platform && k.platform !== platform) return false;
    if (k.scoringSystem && scoringSystem && k.scoringSystem !== scoringSystem) return false;
    if (k.tumourType && tumourType && k.tumourType !== tumourType) return false;
    if (k.indication && indication && k.indication !== indication) return false;
    return true;
  });
  if (!candidates.length) return null;
  const preferred = candidates.find(([id]) => id === preferredSetId);
  const [id, set] = preferred || candidates[0];
  return { id, ...set };
}

// ---------------------------------------------------------------------------
// Mock data. Shapes match the FRS Data Model, including the one new entity.
// The case is the same patient the Specimen Journey follows across all three benches.
// ---------------------------------------------------------------------------
const CASE = {
  immunohistochemistrySampleId: 812,
  labNumber: '25IHC000044',
  status: 'IN_PROGRESS',
  requestDate: '2026-08-18',
  arrivalDate: '2026-08-18',
  technician: 'Kankan Musa, Mansa',
  pathologist: 'Samini, Privashi',
  patient: {
    name: 'DOE, JANE', dob: '1965-07-22', age: 61, sex: 'F',
    identifiers: [{ type: 'UHID', value: 'UHI884420QQ' }],
  },

  // FR-1.2 — the referral relationship ALREADY EXISTS on the shipped entity:
  // ImmunohistochemistrySample.pathologySample is a @OneToOne on pathology_sample_id,
  // alongside a `reffered` Boolean. The misspelling is in the shipped schema and is
  // preserved deliberately rather than corrected in a migration that would touch a
  // shipped column for cosmetic reasons. Do not add a parallel column. (AC-2)
  reffered: true,
  referringCase: {
    pathologySampleId: 5120,
    labNumber: '25TST000210',
    date: '2026-08-14',
    specimen: 'Breast — left, upper outer quadrant',
    conclusion: 'C50.9 Invasive ductal carcinoma, grade 2',
    route: '/PathologyCaseView/5120',
  },

  // FR-3 — pre-analytics. These determine whether a predictive-marker result is valid
  // at all, and "not recorded" is itself a reportable fact. (FR-3.3, AC-5)
  coldIschemiaMinutes: 42,
  totalFixationMinutes: 1080,
  fixativeCode: 'NBF_10',
  panelTemplateId: 'BREAST_PREDICTIVE',
  interpretation: '',

  priorResults: [
    { labNumber: '25TST000210', date: '2026-08-14', specimen: 'Breast core biopsy', conclusion: 'C50.9 Invasive ductal carcinoma', route: '/PathologyCaseView/5120' },
    { labNumber: '24CYT000512', date: '2025-11-03', specimen: 'Breast FNA',         conclusion: 'Suspicious for malignancy',        route: '/CytologyCaseView/2210' },
  ],
};

// FR-1.4, AC-3 — blocks and slides are READ FROM THE REFERRING CASE and never copied.
// ImmunohistochemistryCaseViewDisplayItem already imports PathologyBlock and
// PathologySlide. One tissue block has one identity across both screens, and their
// designations and barcodes are the referring case's, per pathology FR-9.3.
const REFERRING_BLOCKS = [
  { id: 611, designation: 'A1', barcode: '25TST000210.A1', tissueType: 'Breast — tumour, central' },
  { id: 612, designation: 'A2', barcode: '25TST000210.A2', tissueType: 'Breast — tumour, periphery' },
];
const REFERRING_SLIDES = [
  { id: 9001, blockId: 611, designation: 'A1.1', barcode: '25TST000210.A1.1', stain: 'ER (SP1)' },
  { id: 9002, blockId: 611, designation: 'A1.2', barcode: '25TST000210.A1.2', stain: 'PgR (1E2)' },
  { id: 9003, blockId: 611, designation: 'A1.3', barcode: '25TST000210.A1.3', stain: 'HER2 (4B5)' },
  { id: 9004, blockId: 611, designation: 'A1.4', barcode: '25TST000210.A1.4', stain: 'Ki-67 (30-9)' },
  { id: 9005, blockId: 612, designation: 'A2.1', barcode: '25TST000210.A2.1', stain: 'HER2 dual ISH' },
];

// FR-4.1 — panel templates are dictionary and configuration content. They are NOT a
// compiled marker list, and they are NOT the four tables the December 2025 FRS proposed.
const PANEL_TEMPLATES = {
  BREAST_PREDICTIVE: {
    i18n: 'ihc.panel.breastPredictive', label: 'Breast predictive panel',
    markers: [
      { code: 'ER',       i18n: 'ihc.marker.er',      label: 'ER',            required: true },
      { code: 'PGR',      i18n: 'ihc.marker.pgr',     label: 'PgR',           required: true },
      { code: 'HER2',     i18n: 'ihc.marker.her2',    label: 'HER2 IHC',      required: true },
      { code: 'KI67',     i18n: 'ihc.marker.ki67',    label: 'Ki-67',         required: true },
      { code: 'HER2_ISH', i18n: 'ihc.marker.her2Ish', label: 'HER2 dual ISH', required: false, reflexOf: 'HER2' },
      // Two markers that exercise requirements the happy path hides.
      // AR has no consensus cutoff — proposed thresholds range across 1% and 10% with no
      // guideline owner — so it resolves to no set and reports "Not interpreted". (FR-5.6)
      { code: 'AR',       i18n: 'ihc.marker.ar',      label: 'AR (androgen receptor)', required: false },
      // Required and not yet scored, so the panel badge has something to NAME. (FR-4.4)
      { code: 'PDL1',     i18n: 'ihc.marker.pdl1',    label: 'PD-L1',          required: true },
    ],
  },
};

// ihc_marker_result — the one new entity. One row per marker scored. Note what every
// row carries: the raw measurement, and the identity of the set that interpreted it.
// The derived category is stored too, but it is a consequence, not the record. (FR-5.1)
const MARKER_RESULTS = [
  {
    id: 7001, markerCode: 'ER', clone: 'SP1', platform: 'VENTANA_ULTRA', platformLabel: 'Ventana BenchMark ULTRA',
    assayRegulatoryStatus: 'FDA_CLEARED', scoringSystem: 'PERCENT_INTENSITY', tumourType: 'BREAST',
    rawPercent: 85, rawIntensityCode: 'STRONG', cellsCounted: 400,
    thresholdSetRef: 'ASCO/CAP ER-PgR 2020 · v1', thresholdSetId: 'ER_PGR_2020',
    derivedCategoryCode: 'POSITIVE', overrideCategoryCode: null, overrideReason: null,
    alternativeScore: 'Allred 8/8', slideId: 9001,
    internalControlStatus: 'PRESENT_ADEQUATE', externalControlLot: 'CTRL-2026-0184', externalControlResult: 'PASS',
    notPerformedReason: null, recordedBy: 'Kankan Musa, Mansa', recordedAt: '2026-08-19 09:41',
  },
  {
    id: 7002, markerCode: 'PGR', clone: '1E2', platform: 'VENTANA_ULTRA', platformLabel: 'Ventana BenchMark ULTRA',
    assayRegulatoryStatus: 'FDA_CLEARED', scoringSystem: 'PERCENT_INTENSITY', tumourType: 'BREAST',
    rawPercent: 8, rawIntensityCode: 'MODERATE', cellsCounted: 400,
    thresholdSetRef: 'ASCO/CAP ER-PgR 2020 · v1', thresholdSetId: 'ER_PGR_2020',
    derivedCategoryCode: 'LOW_POSITIVE', overrideCategoryCode: null, overrideReason: null,
    alternativeScore: null, slideId: 9002,
    internalControlStatus: 'PRESENT_ADEQUATE', externalControlLot: 'CTRL-2026-0184', externalControlResult: 'PASS',
    notPerformedReason: null, recordedBy: 'Kankan Musa, Mansa', recordedAt: '2026-08-19 09:48',
  },
  {
    id: 7003, markerCode: 'HER2', clone: '4B5', platform: 'VENTANA_ULTRA', platformLabel: 'Ventana BenchMark ULTRA',
    assayRegulatoryStatus: 'FDA_CLEARED', scoringSystem: 'HER2_IHC', tumourType: 'BREAST',
    rawScore: '2+', cellsCounted: null,
    thresholdSetRef: 'ASCO/CAP HER2 IHC 2023 · v1', thresholdSetId: 'HER2_IHC_2023',
    derivedCategoryCode: '2+', overrideCategoryCode: null, overrideReason: null,
    alternativeScore: null, slideId: 9003,
    internalControlStatus: 'PRESENT_ADEQUATE', externalControlLot: 'CTRL-2026-0184', externalControlResult: 'PASS',
    notPerformedReason: null, recordedBy: 'Kankan Musa, Mansa', recordedAt: '2026-08-19 10:02',
  },
  {
    id: 7004, markerCode: 'KI67', clone: '30-9', platform: 'VENTANA_ULTRA', platformLabel: 'Ventana BenchMark ULTRA',
    assayRegulatoryStatus: 'FDA_CLEARED', scoringSystem: 'PERCENT', tumourType: 'BREAST',
    rawPercent: 18, cellsCounted: 500,
    thresholdSetRef: 'IKWG Ki-67 2021 · v1', thresholdSetId: 'KI67_IKWG_2021',
    derivedCategoryCode: 'INDETERMINATE', overrideCategoryCode: null, overrideReason: null,
    alternativeScore: null, slideId: 9004,
    internalControlStatus: 'PRESENT_ADEQUATE', externalControlLot: 'CTRL-2026-0184', externalControlResult: 'PASS',
    notPerformedReason: null, recordedBy: 'Kankan Musa, Mansa', recordedAt: '2026-08-19 10:15',
  },
  {
    id: 7005, markerCode: 'HER2_ISH', clone: 'INFORM HER2 Dual ISH', platform: 'VENTANA_ULTRA', platformLabel: 'Ventana BenchMark ULTRA',
    assayRegulatoryStatus: 'FDA_CLEARED', scoringSystem: 'ISH_RATIO', tumourType: 'BREAST',
    cellsCounted: 20, ishHer2Signals: 4.8, ishCep17Signals: 2.6, ishRatio: 1.85,
    thresholdSetRef: 'ASCO/CAP HER2 ISH 2023 · Groups 1–5', thresholdSetId: 'HER2_ISH_2023',
    derivedCategoryCode: 'CONCURRENT_IHC_REVIEW', overrideCategoryCode: null, overrideReason: null,
    alternativeScore: null, slideId: 9005,
    internalControlStatus: 'PRESENT_ADEQUATE', externalControlLot: 'CTRL-2026-0191', externalControlResult: 'PASS',
    notPerformedReason: null, recordedBy: 'Samini, Privashi', recordedAt: '2026-08-20 14:22',
  },
  // FR-5.6, AC-12 — the measurement is RECORDED and the category is withheld, because no
  // set exists for this key combination. This is the correct behaviour, not a bug and not
  // a blank row: the alternative is silently borrowing another marker's cutoff, which is
  // how a laboratory reports a number against rules that were never meant for it.
  {
    id: 7006, markerCode: 'AR', clone: 'SP107', platform: 'VENTANA_ULTRA', platformLabel: 'Ventana BenchMark ULTRA',
    assayRegulatoryStatus: 'LDT', scoringSystem: 'PERCENT', tumourType: 'BREAST',
    rawPercent: 30, cellsCounted: 300,
    thresholdSetRef: null, thresholdSetId: null,
    derivedCategoryCode: null, overrideCategoryCode: null, overrideReason: null,
    alternativeScore: null, slideId: null,
    internalControlStatus: 'PRESENT_ADEQUATE', externalControlLot: 'CTRL-2026-0184', externalControlResult: 'PASS',
    notPerformedReason: null, recordedBy: 'Kankan Musa, Mansa', recordedAt: '2026-08-19 10:31',
  },
];

// PD-L1 is on the panel and required, and has no row here at all — it has not been
// scored. That is what makes the panel badge say "Outstanding: PD-L1" rather than
// "5 of 6", and what correctly disables the primary action with a truthful tooltip.
// (FR-4.3, FR-4.4, S-7.4, AC-6)

const REPORTS = [];

const FIXATIVES = [
  { code: 'NBF_10', i18n: 'ihc.fixative.nbf10', label: '10% neutral buffered formalin' },
  { code: 'BOUIN',  i18n: 'ihc.fixative.bouin', label: "Bouin's solution" },
  { code: 'OTHER',  i18n: 'ihc.fixative.other', label: 'Other (specify)' },
];

// FR-3.2 — common properties, not literals. ihc.preanalytics.*
const PREANALYTIC_WINDOW = { coldIschemiaMaxMinutes: 60, fixationMinMinutes: 360, fixationMaxMinutes: 4320 };

// FR-11.1 — which categories a laboratory treats as critical is a LOCAL decision carried
// on the threshold set, not a hardcoded list. Modelled here as set-carried config.
const CRITICAL_CATEGORY_CODES = ['POSITIVE'];

// ===========================================================================
// Main screen
// ===========================================================================
function ImmunohistochemistryCaseView() {
  const [caseData, setCaseData] = useState(CASE);
  const [markerResults, setMarkerResults] = useState(MARKER_RESULTS);

  // UI state. Note what is NOT here: no per-marker "complete" checkbox, no panel
  // completion meter, no caseReadyForReview boolean. All of that is derived below.
  // The December 2025 design drove its completion meter off a human ticking a box per
  // marker, which measures diligence in ticking rather than whether the work is done.
  // (FR-4.3, S-4.1)
  const [dirty, setDirty] = useState(false);
  const [notification, setNotification] = useState(null);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [confirmReopen, setConfirmReopen] = useState(false);

  // Capabilities come from the existing Histopathology role bundle — IHC is a bench in
  // the same department. No new per-action permission keys. (Permissions, AC-27)
  const user = { name: 'Samini, Privashi', hasHistopathologyBundle: true, isPathologist: true };

  const si = statusIndex(caseData.status);
  const reached = useCallback((code) => si >= statusIndex(code), [si]);
  const notify = (kind, title, subtitle) => setNotification({ kind, title, subtitle });

  const template = PANEL_TEMPLATES[caseData.panelTemplateId];

  // ---- Derived values. Completion is computed over rows; nothing is a stored flag. ----
  const resultFor = useCallback(
    (markerCode) => markerResults.find((r) => r.markerCode === markerCode) || null,
    [markerResults]);

  const hasResult = useCallback(
    (r) => Boolean(r) && (r.rawPercent != null || r.rawScore != null || r.ishRatio != null), []);

  // FR-4.3 — required markers with a result. FR-4.4 — and we keep the LIST, not a count,
  // because the badge must name what is outstanding. (AC-6)
  const requiredMarkers = useMemo(
    () => template.markers.filter((m) => m.required), [template]);
  const outstandingMarkers = useMemo(
    () => requiredMarkers.filter((m) => {
      const r = resultFor(m.code);
      return !hasResult(r) || Boolean(r?.notPerformedReason);
    }), [requiredMarkers, resultFor, hasResult]);
  const panelComplete = outstandingMarkers.length === 0;

  // FR-7.3, AC-18 — internal control status is REQUIRED for every ER or PgR result
  // scoring 0–10%. A marker missing it cannot be complete.
  const missingInternalControl = useMemo(
    () => markerResults.filter((r) =>
      ['ER', 'PGR'].includes(r.markerCode) &&
      r.rawPercent != null && r.rawPercent <= 10 &&
      !r.internalControlStatus), [markerResults]);

  // FR-8.3, AC-21 — a failed external control blocks completion. The failed run is
  // RETAINED, not overwritten; the repeat is a new row.
  const failedControls = useMemo(
    () => markerResults.filter((r) => r.externalControlResult === 'FAIL'), [markerResults]);

  // FR-5.6, AC-12 — results whose key combination matched no set. These are recorded
  // and reported as "Not interpreted". They are not errors and they are not blanks.
  const notInterpreted = useMemo(
    () => markerResults.filter((r) => !r.thresholdSetRef), [markerResults]);

  // FR-11.1 — criticality is read off the applied set's configuration.
  const criticalResults = useMemo(
    () => markerResults.filter((r) =>
      CRITICAL_CATEGORY_CODES.includes(r.overrideCategoryCode || r.derivedCategoryCode)),
    [markerResults]);

  const preanalyticsOutOfWindow =
    (caseData.coldIschemiaMinutes != null && caseData.coldIschemiaMinutes > PREANALYTIC_WINDOW.coldIschemiaMaxMinutes) ||
    (caseData.totalFixationMinutes != null && (
      caseData.totalFixationMinutes < PREANALYTIC_WINDOW.fixationMinMinutes ||
      caseData.totalFixationMinutes > PREANALYTIC_WINDOW.fixationMaxMinutes));

  // ---- Section state, derived from status + role. Four states only. (S-4) ----
  // A section is never removed from the DOM on the basis of state or role — it is
  // disabled with a stated reason. (S-3.3)
  const sectionState = useCallback((opts = {}) => {
    if (opts.requiresStatus && !reached(opts.requiresStatus)) {
      return {
        disabled: true,
        hint: t('ihc.locked.awaitingPathologist', 'Available once the case is sent to the pathologist'),
      };
    }
    if (opts.pathologistOnly && !user.isPathologist) {
      return { disabled: true, hint: t('caseView.locked.pathologistOnly', 'Pathologist review') };
    }
    return { disabled: false, hint: null };
  }, [reached, user.isPathologist]);

  // ---- Transitions. Actor and timestamp come from the session and the server. ----
  const advance = (toCode) => {
    setCaseData((c) => ({ ...c, status: toCode }));
    notify('success',
      t('ihc.toast.statusChanged', 'Status updated'),
      t('caseView.toast.attributionCaptured', 'Actor and timestamp captured from the session.'));
  };

  // FR-5.5, AC-11 — override keeps the raw measurement AND the set that would have
  // applied. Nothing is lost, and the reason is mandatory.
  const applyOverride = (result, categoryCode, reason) => {
    setMarkerResults((rs) => rs.map((r) => r.id === result.id
      ? { ...r, overrideCategoryCode: categoryCode, overrideReason: reason,
          overriddenBy: user.name, overriddenAt: 'server-clock' }
      : r));
    setOverrideTarget(null);
    setDirty(true);
    notify('info', t('ihc.toast.overridden', 'Category overridden'),
      t('ihc.toast.overrideAudited', 'The raw measurement and the set that would have applied are both retained. The override is audited.'));
  };

  // The action bar's single primary action. Its disabled condition is the ACTUAL
  // precondition, and it is the same condition the tooltip states. (S-7.4)
  const primaryAction = () => {
    if (caseData.status === 'COMPLETED') {
      return { label: t('caseView.action.reopen', 'Reopen case'), kind: 'secondary',
               disabled: false, onClick: () => setConfirmReopen(true) };
    }
    if (user.isPathologist && (caseData.status === 'READY_PATHOLOGIST' || caseData.status === 'UNDER_REVIEW')) {
      // FR-9.5 — both the interpretation and every required marker must be complete.
      const ready = panelComplete && caseData.interpretation.trim().length > 0
        && failedControls.length === 0 && missingInternalControl.length === 0;
      return {
        label: t('ihc.action.signOut', 'Sign out & finalize'),
        kind: 'primary',
        disabled: !ready,
        title: ready ? '' : t('ihc.tooltip.signOutBlocked',
          'Record every required marker with its control status and enter the interpretation'),
        onClick: () => {
          setCaseData((c) => ({ ...c, status: 'COMPLETED' }));
          // FR-11.3 — the event is emitted; criticalResultAcknowledgmentEnabled gates
          // only the CONSUMER. Sign-out is never blocked by it. (AC-24)
          notify('success', t('ihc.toast.signedOut', 'Case signed out'),
            criticalResults.length > 0
              ? t('ihc.toast.criticalEmitted', 'Report opened in a new tab. A critical-result event was emitted.')
              : t('caseView.toast.reportOpened', 'Report opened in a new tab.'));
        },
      };
    }
    return {
      label: t('ihc.action.sendToPathologist', 'Send to pathologist'),
      kind: 'primary',
      disabled: !panelComplete || failedControls.length > 0,
      title: panelComplete && failedControls.length === 0 ? '' : t('ihc.tooltip.sendBlocked',
        'Every required marker needs a result and a passing external control'),
      onClick: () => advance('READY_PATHOLOGIST'),
    };
  };
  const primary = primaryAction();

  return (
    <Grid className="ihc-case-view" fullWidth>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/ImmunohistochemistryDashboard">{t('breadcrumb.ihc', 'Immunohistochemistry')}</BreadcrumbItem>
          <BreadcrumbItem href="/ImmunohistochemistryDashboard">{t('breadcrumb.dashboard', 'Dashboard')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            {t('ihc.label.case', 'Immunohistochemistry Case')} {caseData.labNumber}
          </BreadcrumbItem>
        </Breadcrumb>

        <h1>{t('ihc.label.case', 'Immunohistochemistry Case')} — {caseData.labNumber}</h1>

        {/* Shell S-1. Replaces the hardcoded purple gradient banner and its single flat
            patient string. Which identifiers show is existing patient-identifier
            configuration, not a per-screen choice. */}
        <PatientHeader
          patient={caseData.patient}
          statusTag={<Tag type={TAG_KIND.inProgress}>{t(STATUSES[si].i18n, STATUSES[si].label)}</Tag>}
          assigned={`${caseData.technician} · ${caseData.pathologist}`}
        />

        {/* Shell S-2. Cross-bench: histopathology and cytology cases for this patient. */}
        <PriorResultsPanel results={caseData.priorResults} />

        {/* FR-11.2 — role="alert" so it is announced, and it never blocks sign-out. */}
        {criticalResults.length > 0 && (
          <InlineNotification
            kind="warning" lowContrast hideCloseButton role="alert"
            title={t('ihc.badge.criticalResult', 'Critical result')}
            subtitle={t('ihc.banner.criticalResult',
              'This result requires critical-result acknowledgment by the ordering clinician. The case will be flagged in the Alerts Dashboard on sign-out.')}
          />
        )}

        {notification && (
          <InlineNotification
            kind={notification.kind} title={notification.title} subtitle={notification.subtitle}
            onCloseButtonClick={() => setNotification(null)} lowContrast
          />
        )}
      </Column>

      {/* Shell S-5: NO progress rail. This screen has three gated sections, below the
          S-5.1 threshold of five, so the sticky Case Summary is the orientation device.
          The rail is an option in the shell, not a fixture. (AC-1) */}
      <Column lg={11} md={5} sm={4}>
        <Accordion>
          {/* ---------------- 1 · Case Information & Referral (display-only) ---------------- */}
          <AccordionItem title={<SectionTitle
            n={1} label={t('ihc.section.caseInfo', 'Case Information & Referral')}
            badge={<span className="cds--type-helper-text-01">{t('caseView.badge.readOnly', 'Read only')}</span>} />}>
            <CaseInformationAndReferral caseData={caseData} blocks={REFERRING_BLOCKS} slides={REFERRING_SLIDES} />
          </AccordionItem>

          {/* ---------------- 2 · Specimen & Pre-analytics ---------------- */}
          <SectionItem
            n={2} i18nKey="ihc.section.preanalytics" label="Specimen & Pre-analytics"
            state={sectionState()}
            badge={preanalyticsOutOfWindow
              ? <Tag type={TAG_KIND.partial}>{t('caseView.badge.outOfWindow', 'Out of window')}</Tag>
              : <Tag type={TAG_KIND.complete}>{t('caseView.badge.complete', 'Complete')}</Tag>}
          >
            <PreAnalytics
              caseData={caseData} setCaseData={setCaseData} setDirty={setDirty}
              outOfWindow={preanalyticsOutOfWindow}
            />
          </SectionItem>

          {/* ---------------- 3 · Panel & Markers ---------------- */}
          <SectionItem
            n={3} i18nKey="ihc.section.panel" label="Panel & Markers"
            state={sectionState()}
            /* FR-4.4 — the badge NAMES the outstanding markers. It is not "4 of 5". */
            badge={panelComplete
              ? <Tag type={TAG_KIND.complete}>{t('caseView.badge.complete', 'Complete')}</Tag>
              : <Tag type={TAG_KIND.partial}>
                  {t('ihc.badge.markersOutstanding', 'Outstanding: {markers}')
                    .replace('{markers}', outstandingMarkers.map((m) => t(m.i18n, m.label)).join(', '))}
                </Tag>}
          >
            <PanelSection
              template={template} resultFor={resultFor} hasResult={hasResult}
              outstanding={outstandingMarkers}
            />
          </SectionItem>

          {/* ---------------- 4 · Marker Results — the section the FRS exists for ---------------- */}
          <SectionItem
            n={4} i18nKey="ihc.section.markerResults" label="Marker Results"
            state={sectionState()}
            badge={notInterpreted.length > 0
              ? <Tag type={TAG_KIND.partial}>{t('ihc.badge.notInterpreted', 'Not interpreted')}</Tag>
              : <Tag type={TAG_KIND.verified}>
                  {t('ihc.badge.setsInForce', '{n} threshold sets')
                    .replace('{n}', new Set(markerResults.map((r) => r.thresholdSetId)).size)}
                </Tag>}
          >
            <MarkerResultsSection
              markerResults={markerResults} setMarkerResults={setMarkerResults}
              setDirty={setDirty} slides={REFERRING_SLIDES}
              onOverride={(r) => setOverrideTarget(r)}
            />
          </SectionItem>

          {/* ---------------- 5 · Controls ---------------- */}
          <SectionItem
            n={5} i18nKey="ihc.section.controls" label="Controls"
            state={sectionState()}
            badge={failedControls.length > 0
              ? <Tag type={TAG_KIND.critical}>{t('caseView.badge.failed', 'Failed')}</Tag>
              : <Tag type={TAG_KIND.complete}>{t('caseView.badge.pass', 'Pass')}</Tag>}
          >
            <ControlsSection
              markerResults={markerResults} failedControls={failedControls}
              missingInternalControl={missingInternalControl}
            />
          </SectionItem>

          {/* ---------------- 6 · Findings & Interpretation ---------------- */}
          <SectionItem
            n={6} i18nKey="ihc.section.findings" label="Findings & Interpretation"
            state={sectionState({ requiresStatus: 'READY_PATHOLOGIST' })}
            badge={caseData.interpretation
              ? <Tag type={TAG_KIND.complete}>{t('caseView.badge.complete', 'Complete')}</Tag>
              : <Tag type={TAG_KIND.pending}>{t('caseView.badge.pending', 'Pending')}</Tag>}
          >
            <FindingsSection
              caseData={caseData} setCaseData={setCaseData} setDirty={setDirty}
              markerResults={markerResults}
            />
          </SectionItem>

          {/* ---------------- 7 · Reports ---------------- */}
          <SectionItem
            n={7} i18nKey="ihc.section.reports" label="Reports"
            state={sectionState()}
            badge={REPORTS.length
              ? <Tag type={TAG_KIND.complete}>v{REPORTS[0].versionNumber}</Tag>
              : <span className="cds--type-helper-text-01">{t('caseView.badge.none', 'None')}</span>}
          >
            <ReportsSection
              reports={REPORTS}
              canGenerate={panelComplete && caseData.interpretation.trim().length > 0}
            />
          </SectionItem>
        </Accordion>
      </Column>

      {/* Shell S-6: sticky case summary. Every marker's current category and the sets
          in force, because with no rail this is the orientation device. */}
      <Column lg={5} md={3} sm={4}>
        <CaseSummary
          status={STATUSES[si]} caseData={caseData} template={template}
          markerResults={markerResults} outstanding={outstandingMarkers}
          critical={criticalResults} reports={REPORTS}
        />
      </Column>

      {/* Shell S-7: action bar. Ghost / secondary / one status-and-role-driven primary. */}
      <Column lg={16} md={8} sm={4}>
        <div className="ihc-case-view__action-bar">
          <div>
            {t('caseView.label.status', 'Status')}: <strong>{t(STATUSES[si].i18n, STATUSES[si].label)}</strong>
            {failedControls.length > 0 && (
              <Tag type={TAG_KIND.critical}>{t('ihc.badge.controlFailed', 'Control failed')}</Tag>
            )}
            {criticalResults.length > 0 && (
              <Tag type={TAG_KIND.critical}>{t('ihc.badge.criticalResult', 'Critical result')}</Tag>
            )}
            {dirty && (
              <span className="cds--type-helper-text-01">{t('caseView.label.unsavedChanges', 'Unsaved changes')}</span>
            )}
          </div>
          <Stack orientation="horizontal" gap={3}>
            <Button kind="ghost" disabled={!dirty}>{t('caseView.action.discard', 'Discard changes')}</Button>
            <Button kind="secondary" renderIcon={Save} onClick={() => setDirty(false)}>
              {t('caseView.action.saveDraft', 'Save draft')}
            </Button>
            <Button kind={primary.kind} disabled={primary.disabled} title={primary.title} onClick={primary.onClick}>
              {primary.label}
            </Button>
          </Stack>
        </div>
      </Column>

      {/* The only modals on this screen. Everything else is inline. */}
      {overrideTarget && (
        <OverrideModal
          result={overrideTarget}
          onCancel={() => setOverrideTarget(null)}
          onSubmit={applyOverride}
        />
      )}

      {confirmReopen && (
        <Modal
          open
          modalHeading={t('ihc.modal.reopenHeading', 'Reopen this case?')}
          primaryButtonText={t('caseView.action.reopen', 'Reopen')}
          secondaryButtonText={t('caseView.action.cancel', 'Cancel')}
          onRequestClose={() => setConfirmReopen(false)}
          onRequestSubmit={() => { setConfirmReopen(false); advance('UNDER_REVIEW'); }}
        >
          {/* FR-2.4 — reopen VOIDS the prior report row rather than deleting it. (AC-28) */}
          <p>{t('ihc.modal.reopenBody',
            'The case returns to Under Pathologist Review and the current report version is voided. The report record is retained — reports are never deleted.')}</p>
          <p className="cds--type-helper-text-01">{t('ihc.modal.reopenFrozen',
            'Existing marker results keep the threshold set they were interpreted under. A newer guideline edition does not rewrite them.')}</p>
        </Modal>
      )}
    </Grid>
  );
}

// ===========================================================================
// Shell components. These are S-1 to S-7, and they are the SAME components the
// Pathology and Cytology case views consume. On integration extract them to a shared
// module rather than leaving a copy in each screen — three divergent copies is exactly
// the drift the shell FRS exists to stop. (OGC-1195)
// ===========================================================================

function SectionTitle({ n, label, badge }) {
  return (
    <span className="caseView__section-title">
      <span>{n}. {label}</span>
      {badge}
    </span>
  );
}

function SectionItem({ n, i18nKey, label, state, badge, children }) {
  return (
    <AccordionItem
      disabled={state.disabled}
      title={<SectionTitle
        n={n}
        label={t(i18nKey, label)}
        badge={state.disabled
          ? <span className="cds--type-helper-text-01">{state.hint}</span>
          : badge}
      />}
    >
      {children}
    </AccordionItem>
  );
}

function PatientHeader({ patient, statusTag, assigned }) {
  return (
    <Tile className="caseView__patient-header">
      <Stack orientation="horizontal" gap={6}>
        <strong>{patient.name}</strong>
        <span>{t('caseView.label.dob', 'DOB')} {patient.dob} ({patient.age})</span>
        <span>{patient.sex}</span>
        {patient.identifiers.map((id) => (
          <span key={id.type} className="cds--type-helper-text-01">{id.type} {id.value}</span>
        ))}
        <span className="caseView__patient-header-right">
          {statusTag}
          <span className="cds--type-helper-text-01">{assigned}</span>
        </span>
      </Stack>
    </Tile>
  );
}

function PriorResultsPanel({ results }) {
  if (!results.length) {
    return (
      <Tile><p>{t('caseView.empty.noPriorResults', 'No prior anatomic-pathology results for this patient.')}</p></Tile>
    );
  }
  return (
    <TableContainer title={t('caseView.label.priorResults', 'Prior anatomic-pathology results')}>
      <Table size="sm">
        <TableHead>
          <TableRow>
            <TableHeader>{t('caseView.label.labNumber', 'Lab no.')}</TableHeader>
            <TableHeader>{t('caseView.label.date', 'Date')}</TableHeader>
            <TableHeader>{t('caseView.label.specimen', 'Specimen')}</TableHeader>
            <TableHeader>{t('caseView.label.conclusion', 'Conclusion')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r) => (
            <TableRow key={r.labNumber}>
              <TableCell><Link href={r.route}>{r.labNumber}</Link></TableCell>
              <TableCell>{r.date}</TableCell>
              <TableCell>{r.specimen}</TableCell>
              <TableCell>{r.conclusion}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function CaseSummary({ status, caseData, template, markerResults, outstanding, critical, reports }) {
  const row = (k, v) => (
    <div className="caseView__summary-row" key={k}>
      <span className="cds--type-helper-text-01">{k}</span><span>{v}</span>
    </div>
  );
  const setsInForce = [...new Set(markerResults.map((r) => r.thresholdSetRef).filter(Boolean))];
  return (
    <Tile className="caseView__summary">
      <h4>{t('caseView.label.caseSummary', 'Case summary')}</h4>
      {row(t('caseView.label.status', 'Status'), <Tag type={TAG_KIND.inProgress}>{t(status.i18n, status.label)}</Tag>)}
      {row(t('ihc.label.referredFrom', 'Referred from'),
        caseData.referringCase
          ? <Link href={caseData.referringCase.route}>{caseData.referringCase.labNumber}</Link>
          : <span className="cds--type-helper-text-01">—</span>)}
      {row(t('ihc.label.panelTemplate', 'Panel template'), t(template.i18n, template.label))}

      {/* Every marker's current category, each with the set that produced it. (FR-5.3) */}
      {markerResults.map((r) => {
        const cat = categoryOf(r);
        return row(markerLabel(r.markerCode), (
          <span>
            <Tag type={cat.kind}>{t(cat.i18n, cat.label)}</Tag>
            {r.overrideCategoryCode && (
              <span className="cds--type-helper-text-01"> {t('caseView.badge.overridden', 'overridden')}</span>
            )}
          </span>
        ));
      })}

      {outstanding.length > 0 && row(t('caseView.label.outstanding', 'Outstanding'),
        <Tag type={TAG_KIND.partial}>{outstanding.map((m) => t(m.i18n, m.label)).join(', ')}</Tag>)}
      {row(t('ihc.label.thresholdSet', 'Threshold sets'),
        <span className="cds--type-helper-text-01">{setsInForce.join(' · ')}</span>)}
      {row(t('caseView.label.critical', 'Critical'),
        critical.length ? <Tag type={TAG_KIND.critical}>{t('caseView.badge.yes', 'Yes')}</Tag> : '—')}
      {row(t('caseView.label.report', 'Report'),
        reports.length ? `v${reports[0].versionNumber}` : t('caseView.badge.none', 'None'))}
    </Tile>
  );
}

// ===========================================================================
// Shared display helpers
// ===========================================================================

const MARKER_LABELS = {
  ER: ['ihc.marker.er', 'ER'], PGR: ['ihc.marker.pgr', 'PgR'],
  HER2: ['ihc.marker.her2', 'HER2 IHC'], KI67: ['ihc.marker.ki67', 'Ki-67'],
  HER2_ISH: ['ihc.marker.her2Ish', 'HER2 dual ISH'],
  AR: ['ihc.marker.ar', 'AR (androgen receptor)'], PDL1: ['ihc.marker.pdl1', 'PD-L1'],
};
const markerLabel = (code) => {
  const m = MARKER_LABELS[code];
  return m ? t(m[0], m[1]) : code;
};

// The category a result currently reports: the override if there is one, otherwise the
// derived value. Both are retained on the row; this only chooses what to SHOW. (FR-5.5)
const CATEGORY_LABELS = {
  POSITIVE:               ['ihc.category.positive', 'Positive', TAG_KIND.complete],
  NEGATIVE:               ['ihc.category.negative', 'Negative', TAG_KIND.none],
  LOW_POSITIVE:           ['ihc.category.lowPositive', 'Low positive', TAG_KIND.partial],
  LOW:                    ['ihc.category.low', 'Low', TAG_KIND.complete],
  HIGH:                   ['ihc.category.high', 'High', TAG_KIND.critical],
  INDETERMINATE:          ['ihc.category.indeterminate', 'Indeterminate', TAG_KIND.partial],
  CONCURRENT_IHC_REVIEW:  ['ihc.category.concurrentIhcReview', 'Requires concurrent IHC review', TAG_KIND.partial],
  EQUIVOCAL:              ['ihc.category.equivocal', 'Equivocal — retest with alternate assay', TAG_KIND.pending],
  '0':  ['ihc.her2.score0', '0',  TAG_KIND.none],
  '1+': ['ihc.her2.score1', '1+', TAG_KIND.none],
  '2+': ['ihc.her2.score2', '2+', TAG_KIND.partial],
  '3+': ['ihc.her2.score3', '3+', TAG_KIND.critical],
};
function categoryOf(result) {
  const code = result.overrideCategoryCode || result.derivedCategoryCode;
  if (!code) {
    return { i18n: 'ihc.badge.notInterpreted', label: 'Not interpreted', kind: TAG_KIND.partial };
  }
  const [i18n, label, kind] = CATEGORY_LABELS[code] || [code, code, TAG_KIND.none];
  return { i18n, label, kind };
}

// FR-5.3, AC-9 — the set is DISPLAYED, not hidden. A pathologist should never have to
// ask which rules a number was read against.
function ThresholdBadge({ result }) {
  if (!result.thresholdSetRef) {
    return (
      <InlineNotification
        kind="info" lowContrast hideCloseButton
        title={t('ihc.badge.notInterpreted', 'Not interpreted')}
        subtitle={t('ihc.banner.noThresholdSet',
          'No threshold set exists for this marker, clone, assay and scoring-system combination. The measurement is recorded but not interpreted.')}
      />
    );
  }
  const set = THRESHOLD_SETS[result.thresholdSetId];
  return (
    <div className="ihc__threshold-badge">
      <Tag type={set?.deprecated ? TAG_KIND.pending : TAG_KIND.verified}>{result.thresholdSetRef}</Tag>
      <p className="cds--type-helper-text-01">{set?.source}</p>
      {set?.deprecated && (
        <InlineNotification
          kind="warning" lowContrast hideCloseButton role="alert"
          title={t('ihc.banner.setSupersededTitle', 'This threshold set has been superseded')}
          subtitle={t('ihc.banner.setSuperseded',
            'Results already signed out under it keep it — a newer edition applies forward, never backward.')}
        />
      )}
    </div>
  );
}

// FR-5.1 — the provenance CAP requires a predictive-marker report to state.
function Provenance({ result }) {
  const rows = [
    [t('ihc.label.clone', 'Antibody clone / probe'), result.clone],
    [t('ihc.label.platform', 'Assay & platform'),
      `${result.platformLabel} · ${result.assayRegulatoryStatus === 'FDA_CLEARED'
        ? t('ihc.label.fdaCleared', 'FDA-cleared') : t('ihc.label.ldt', 'Laboratory-developed')}`],
    [t('ihc.label.scoringSystem', 'Scoring method'), result.scoringSystem],
    [t('ihc.label.cellsCounted', 'Cells / nuclei counted'), result.cellsCounted ?? '—'],
    [t('ihc.label.internalControl', 'Internal control'), internalControlLabel(result.internalControlStatus)],
    [t('ihc.label.externalControlLot', 'External control lot'), result.externalControlLot ?? '—'],
    // Never typed. Session user and server clock. (FR-2.3)
    [t('caseView.label.recordedBy', 'Recorded by'), `${result.recordedBy} · ${result.recordedAt}`],
  ];
  return (
    <Stack gap={2} className="ihc__provenance">
      {rows.map(([k, v]) => (
        <div className="caseView__field-row" key={k}>
          <span className="cds--type-helper-text-01">{k}</span><span>{v}</span>
        </div>
      ))}
    </Stack>
  );
}

// ===========================================================================
// IHC sections
// ===========================================================================

function CaseInformationAndReferral({ caseData, blocks, slides }) {
  const rows = [
    [t('caseView.label.labNumber', 'Lab number'), caseData.labNumber],
    [t('caseView.label.requestDate', 'Request date'), caseData.requestDate],
    [t('caseView.label.arrivalDate', 'Specimen arrival date'), caseData.arrivalDate],
    [t('ihc.label.pathologist', 'Assigned pathologist'), caseData.pathologist],
  ];
  return (
    <Stack gap={5}>
      {rows.map(([k, v]) => (
        <div className="caseView__field-row" key={k}>
          <span className="cds--type-helper-text-01">{k}</span>
          <span>{v || <span className="cds--type-helper-text-01">— {t('caseView.label.notRecorded', 'not recorded')}</span>}</span>
        </div>
      ))}

      {/* FR-1.2 / FR-1.3 — the referral is SURFACED, not re-entered. A case ordered
          directly, with no referring pathology case, renders an em dash and a hint —
          not an error and not an empty table. */}
      <div className="caseView__field-row">
        <span className="cds--type-helper-text-01">{t('ihc.label.referredFrom', 'Referred from')}</span>
        <span>
          {caseData.referringCase ? (
            <>
              <Link href={caseData.referringCase.route}>{caseData.referringCase.labNumber}</Link>
              {' · '}{caseData.referringCase.date}{' · '}{caseData.referringCase.conclusion}
            </>
          ) : (
            <span className="cds--type-helper-text-01">
              — {t('ihc.empty.noReferral', 'This case was not referred from a histopathology case.')}
            </span>
          )}
        </span>
      </div>

      {/* FR-1.4, AC-3 — READ from the referring case. No IHC-side block or slide row is
          created, and no designation or barcode is minted here. One tissue block has one
          identity across both screens; duplicating it is how the two drift. */}
      <TableContainer
        title={t('ihc.label.blocksFromReferral', 'Blocks available from the referring case')}
        description={t('ihc.helper.readFromReferral',
          'Read from the referring histopathology case. Designations and barcodes are that case’s — nothing is created here.')}
      >
        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>{t('caseView.label.designation', 'Designation')}</TableHeader>
              <TableHeader>{t('caseView.label.barcode', 'Barcode')}</TableHeader>
              <TableHeader>{t('caseView.label.tissueType', 'Tissue')}</TableHeader>
              <TableHeader>{t('ihc.label.slidesCut', 'Slides cut for this case')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {blocks.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.designation}</TableCell>
                <TableCell><code>{b.barcode}</code></TableCell>
                <TableCell>{b.tissueType}</TableCell>
                {/* Computed over rows. There is no slide-count column anywhere. */}
                <TableCell>
                  {slides.filter((s) => s.blockId === b.id).map((s) => s.designation).join(', ') || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function PreAnalytics({ caseData, setCaseData, setDirty, outOfWindow }) {
  const set = (field) => (e) => {
    const raw = e.target.value;
    setCaseData((c) => ({ ...c, [field]: raw === '' ? null : Number(raw) }));
    setDirty(true);
  };
  return (
    <Stack gap={5}>
      {/* FR-3.2, AC-5 — out-of-window warns and carries a report comment. It does NOT
          block scoring: the pathologist may still legitimately report with a caveat. */}
      {outOfWindow && (
        <InlineNotification
          kind="warning" lowContrast hideCloseButton
          title={t('ihc.banner.preanalyticsOutOfWindowTitle', 'Pre-analytic times outside the laboratory window')}
          subtitle={t('ihc.banner.preanalyticsOutOfWindow',
            'Recorded times fall outside the laboratory’s acceptable window. The result may be reported with a qualifying comment.')}
        />
      )}
      <NumberInput
        id="coldIschemia" min={0} step={1}
        label={t('ihc.label.coldIschemia', 'Cold-ischemia time (minutes)')}
        helperText={t('ihc.helper.coldIschemia', 'Excision to fixation. Configured maximum: {n} minutes.')
          .replace('{n}', PREANALYTIC_WINDOW.coldIschemiaMaxMinutes)}
        value={caseData.coldIschemiaMinutes ?? ''}
        onChange={set('coldIschemiaMinutes')}
      />
      <NumberInput
        id="fixationTime" min={0} step={1}
        label={t('ihc.label.fixationTime', 'Total fixation time (minutes)')}
        helperText={t('ihc.helper.fixationTime', 'Configured window: {min}–{max} minutes.')
          .replace('{min}', PREANALYTIC_WINDOW.fixationMinMinutes)
          .replace('{max}', PREANALYTIC_WINDOW.fixationMaxMinutes)}
        value={caseData.totalFixationMinutes ?? ''}
        onChange={set('totalFixationMinutes')}
      />
      <Select
        id="fixative" labelText={t('ihc.label.fixative', 'Fixative')}
        value={caseData.fixativeCode ?? ''}
        onChange={(e) => { setCaseData((c) => ({ ...c, fixativeCode: e.target.value })); setDirty(true); }}
      >
        <SelectItem value="" text={t('caseView.label.selectOne', 'Select…')} />
        {FIXATIVES.map((f) => <SelectItem key={f.code} value={f.code} text={t(f.i18n, f.label)} />)}
      </Select>
      {/* FR-3.3 — unknown is RECORDED as unknown, never defaulted. "Not recorded" is
          itself a reportable fact, and a defaulted 0 would be a lie on a report. */}
      <p className="cds--type-helper-text-01">
        {t('ihc.helper.timesUnknown',
          'Where the specimen was fixed at a referring facility and the times are unknown, leave the field empty. It is reported as “not recorded” rather than defaulted.')}
      </p>
    </Stack>
  );
}

function PanelSection({ template, resultFor, hasResult, outstanding }) {
  return (
    <Stack gap={5}>
      <Select
        id="panelTemplate" labelText={t('ihc.label.panelTemplate', 'Panel template')}
        helperText={t('ihc.helper.panelTemplate',
          'Panel templates are dictionary and configuration content authored by the laboratory, not a compiled marker list.')}
        value={template.i18n} onChange={() => {}}
      >
        <SelectItem value={template.i18n} text={t(template.i18n, template.label)} />
      </Select>

      <TableContainer title={t('ihc.section.panel', 'Panel & Markers')}>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>{t('ihc.label.marker', 'Marker')}</TableHeader>
              <TableHeader>{t('caseView.label.required', 'Required')}</TableHeader>
              <TableHeader>{t('ihc.label.clone', 'Antibody clone / probe')}</TableHeader>
              <TableHeader>{t('caseView.label.status', 'Status')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {template.markers.map((m) => {
              const r = resultFor(m.code);
              // FR-4.3, AC-6 — status is DERIVED from whether a result exists. There is
              // no per-marker "Complete" checkbox on this screen, and adding one would
              // reintroduce the exact defect this design removed.
              const done = hasResult(r) && !r?.notPerformedReason;
              return (
                <TableRow key={m.code}>
                  <TableCell>
                    {t(m.i18n, m.label)}
                    {m.reflexOf && (
                      <span className="cds--type-helper-text-01">
                        {' '}{t('ihc.label.reflexOf', 'reflex of {marker}').replace('{marker}', markerLabel(m.reflexOf))}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{m.required ? t('caseView.badge.yes', 'Yes') : t('caseView.badge.optional', 'Optional')}</TableCell>
                  <TableCell>{r?.clone ?? '—'}</TableCell>
                  <TableCell>
                    {r?.notPerformedReason
                      ? <Tag type={TAG_KIND.none}>{t('ihc.badge.notPerformed', 'Not performed')}</Tag>
                      : done
                        ? <Tag type={TAG_KIND.complete}>{t('caseView.badge.recorded', 'Recorded')}</Tag>
                        : <Tag type={TAG_KIND.partial}>{t('caseView.badge.pending', 'Pending')}</Tag>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Inline, not a modal. (D-005) */}
      <Button kind="ghost" size="sm">{t('ihc.action.addMarker', 'Add marker')}</Button>

      {outstanding.length > 0 && (
        <p className="cds--type-helper-text-01">
          {t('ihc.badge.markersOutstanding', 'Outstanding: {markers}')
            .replace('{markers}', outstanding.map((m) => t(m.i18n, m.label)).join(', '))}
        </p>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Marker Results — one card per marker. The card shape follows the SCORING SYSTEM,
// because that is what actually differs: a percentage-and-intensity marker, a HER2 IHC
// score, an ISH count. What does not differ is that every card shows the raw
// measurement, the applied set, and the category the set produced. (FR-5)
// ---------------------------------------------------------------------------
function MarkerResultsSection({ markerResults, setMarkerResults, setDirty, slides, onOverride }) {
  const update = (id, patch) => {
    setMarkerResults((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty(true);
  };
  return (
    <Stack gap={6}>
      {markerResults.map((r) => (
        <MarkerCard
          key={r.id} result={r} slides={slides}
          onChange={(patch) => update(r.id, patch)}
          onOverride={() => onOverride(r)}
        />
      ))}
    </Stack>
  );
}

function MarkerCard({ result, slides, onChange, onOverride }) {
  const slide = slides.find((s) => s.id === result.slideId);
  const cat = categoryOf(result);
  return (
    <Tile className="ihc__marker-card">
      <Stack gap={4}>
        <h5>
          {markerLabel(result.markerCode)}
          {slide && <span className="cds--type-helper-text-01"> · {t('caseView.label.slide', 'Slide')} {slide.designation}</span>}
        </h5>

        {result.scoringSystem === 'PERCENT_INTENSITY' && <PercentIntensityFields result={result} onChange={onChange} />}
        {result.scoringSystem === 'HER2_IHC'          && <Her2IhcFields          result={result} onChange={onChange} />}
        {result.scoringSystem === 'ISH_RATIO'         && <IshFields             result={result} onChange={onChange} />}
        {result.scoringSystem === 'PERCENT'           && <PercentFields         result={result} onChange={onChange} />}

        {/* The category, and immediately beside it the set that produced it. These two
            are never separated — a category without its provenance is not a result. */}
        <div className="ihc__category-row">
          <span className="cds--type-helper-text-01">{t('ihc.label.derivedCategory', 'Category')}</span>
          <Tag type={cat.kind}>{t(cat.i18n, cat.label)}</Tag>
          <Button kind="ghost" size="sm" onClick={onOverride}>
            {t('ihc.action.overrideCategory', 'Override category')}
          </Button>
        </div>
        <ThresholdBadge result={result} />

        {/* FR-5.5, AC-11 — an override is visibly marked on screen and in the report,
            and both the raw measurement and the set that WOULD have applied are kept. */}
        {result.overrideCategoryCode && (
          <InlineNotification
            kind="info" lowContrast hideCloseButton
            title={t('ihc.banner.overriddenTitle', 'Category manually overridden')}
            subtitle={`${t('ihc.banner.overridden', 'Category manually overridden from {derived} to {override}.')
              .replace('{derived}', result.derivedCategoryCode)
              .replace('{override}', result.overrideCategoryCode)} ${result.overrideReason}`}
          />
        )}

        <Provenance result={result} />
      </Stack>
    </Tile>
  );
}

// FR-7.1, FR-7.4 — percentage AND intensity are the required elements in CAP's Breast
// Biomarker template. Allred is recorded alongside as a supplementary score and is NEVER
// the source of the derived category. The December 2025 design made Allred the primary
// derivation with its own auto-calculation, which inverts the current guidance. (AC-19)
function PercentIntensityFields({ result, onChange }) {
  const set = resolveThresholdSet({
    marker: result.markerCode, clone: result.clone, platform: result.platform,
    scoringSystem: result.scoringSystem, tumourType: result.tumourType, indication: null,
  }, result.thresholdSetId);
  const resolved = set?.resolve ? set.resolve(result.rawPercent) : null;
  return (
    <Stack gap={4}>
      <NumberInput
        id={`pct-${result.id}`} min={0} max={100} step={1}
        label={t('ihc.label.percentStained', '% cells stained')}
        value={result.rawPercent ?? ''}
        onChange={(e) => onChange({ rawPercent: e.target.value === '' ? null : Number(e.target.value) })}
      />
      <Select
        id={`int-${result.id}`} labelText={t('ihc.label.intensity', 'Intensity')}
        value={result.rawIntensityCode ?? ''}
        onChange={(e) => onChange({ rawIntensityCode: e.target.value })}
      >
        <SelectItem value="" text={t('caseView.label.selectOne', 'Select…')} />
        {/* value is the CODE. The label is only ever displayed. (FR-12.1, AC-25) */}
        {INTENSITY.map((i) => <SelectItem key={i.code} value={i.code} text={t(i.i18n, i.label)} />)}
      </Select>
      <TextInput
        id={`alt-${result.id}`}
        labelText={t('ihc.label.alternativeScore', 'Alternative score (e.g. Allred)')}
        helperText={t('ihc.helper.alternativeScore',
          'Supplementary only. It is recorded alongside the required elements and never derives the category.')}
        value={result.alternativeScore ?? ''}
        onChange={(e) => onChange({ alternativeScore: e.target.value })}
      />
      {/* FR-7.2 — the mandatory comment is SET CONTENT, rendered automatically. The
          pathologist may add to it; they cannot edit it away. */}
      {resolved?.mandatoryComment && (
        <InlineNotification
          kind="info" lowContrast hideCloseButton
          title={t('ihc.banner.mandatoryCommentTitle', 'Mandatory reporting comment')}
          subtitle={t(resolved.mandatoryComment[0], resolved.mandatoryComment[1])}
        />
      )}
      {/* FR-7.3, AC-18 — internal control is required at 0–10% and the marker cannot be
          completed without it. */}
      {result.rawPercent != null && result.rawPercent <= 10 && (
        <Select
          id={`ic-${result.id}`}
          labelText={t('ihc.label.internalControl', 'Internal control')}
          helperText={t('ihc.helper.internalControlRequired',
            'Required for every ER or PgR result scoring 0–10%. The marker cannot be completed without it.')}
          invalid={!result.internalControlStatus}
          invalidText={t('ihc.error.internalControlRequired', 'Internal control status is required at this percentage')}
          value={result.internalControlStatus ?? ''}
          onChange={(e) => onChange({ internalControlStatus: e.target.value })}
        >
          <SelectItem value="" text={t('caseView.label.selectOne', 'Select…')} />
          {INTERNAL_CONTROL.map((c) => <SelectItem key={c.code} value={c.code} text={t(c.i18n, c.label)} />)}
        </Select>
      )}
    </Stack>
  );
}

// FR-6.1, AC-13 — four radio-equivalent values, stored as four values. There is no
// Negative / Equivocal / Positive field on this screen and there must never be one:
// since trastuzumab deruxtecan was extended to IHC 1+ and 2+/ISH-negative disease, the
// 0-versus-1+ distinction determines drug eligibility, and collapsing it at capture
// destroys information no downstream code can recover.
function Her2IhcFields({ result, onChange }) {
  const set = THRESHOLD_SETS.HER2_IHC_2023;
  const reflexes = set.reflexToIsh.includes(result.rawScore);
  return (
    <Stack gap={4}>
      <Select
        id={`her2-${result.id}`} labelText={t('ihc.label.her2Score', 'HER2 IHC score')}
        value={result.rawScore ?? ''}
        onChange={(e) => onChange({ rawScore: e.target.value, derivedCategoryCode: e.target.value })}
      >
        <SelectItem value="" text={t('caseView.label.selectOne', 'Select…')} />
        {HER2_IHC_SCORES.map((s) => (
          <SelectItem key={s.code} value={s.code} text={`${t(s.i18n, s.label)} — ${s.criterion}`} />
        ))}
      </Select>
      <p className="cds--type-helper-text-01">
        {t('ihc.helper.her2Distinct',
          '0 and 1+ are distinct, non-collapsible stored values. Whether this deployment additionally renders a “HER2-low” descriptor is threshold-set vocabulary — ASCO/CAP declined to create the category in 2023, ESMO uses it — and the stored value remains the score.')}
      </p>
      {reflexes && (
        <InlineNotification
          kind="info" lowContrast hideCloseButton
          title={t('ihc.banner.reflexToIshTitle', 'Reflexes to dual ISH')}
          subtitle={t('ihc.banner.reflexToIsh',
            'A 2+ IHC score reflexes to in-situ hybridisation. The ISH marker is scored on its own row with its own threshold set.')}
        />
      )}
    </Stack>
  );
}

// FR-6.4, FR-6.5, AC-15, AC-16 — nuclei counted, signal averages, derived ratio, and a
// group from the applied set. Groups 2, 3 and 4 route to CONCURRENT IHC REVIEW. There is
// no equivocal category: the 2018 focused update abolished it, and the December 2025
// design's "Group 4 → Equivocal, retest with alternate assay" is the pre-2018 model.
function IshFields({ result, onChange }) {
  const ratio = result.ishCep17Signals ? +(result.ishHer2Signals / result.ishCep17Signals).toFixed(3) : null;
  const set = THRESHOLD_SETS[result.thresholdSetId];
  const resolved = set?.resolve ? set.resolve(ratio, result.ishHer2Signals) : null;
  return (
    <Stack gap={4}>
      <NumberInput
        id={`counted-${result.id}`} min={0} step={1}
        label={t('ihc.label.cellsCounted', 'Cells / nuclei counted')}
        value={result.cellsCounted ?? ''}
        onChange={(e) => onChange({ cellsCounted: Number(e.target.value) })}
      />
      <NumberInput
        id={`her2sig-${result.id}`} min={0} step={0.1}
        label={t('ihc.label.ishHer2Signals', 'Average HER2 signals per nucleus')}
        value={result.ishHer2Signals ?? ''}
        onChange={(e) => onChange({ ishHer2Signals: Number(e.target.value) })}
      />
      <NumberInput
        id={`cep17-${result.id}`} min={0} step={0.1}
        label={t('ihc.label.ishCep17Signals', 'Average CEP17 signals per nucleus')}
        value={result.ishCep17Signals ?? ''}
        onChange={(e) => onChange({ ishCep17Signals: Number(e.target.value) })}
      />
      <div className="caseView__field-row">
        <span className="cds--type-helper-text-01">{t('ihc.label.ishRatio', 'HER2 / CEP17 ratio')}</span>
        {/* Derived, and stored, for report fidelity — never typed. */}
        <span><strong>{ratio ?? '—'}</strong></span>
      </div>
      {resolved?.group != null && (
        <div className="caseView__field-row">
          <span className="cds--type-helper-text-01">{t('ihc.label.ishGroup', 'ISH group')}</span>
          <span><strong>{resolved.group}</strong></span>
        </div>
      )}
    </Stack>
  );
}

// FR-7.5, FR-7.6, AC-20 — the raw percentage is shown prominently because it is the
// durable observation; the band is the interpretation and it may change. No 20% cutpoint
// exists anywhere in this file's logic — the legacy 20% set exists as DATA, and switching
// a case to it is a configuration act with a source stamped on it.
function PercentFields({ result, onChange }) {
  const set = THRESHOLD_SETS[result.thresholdSetId];
  const resolved = set?.resolve ? set.resolve(result.rawPercent) : null;
  return (
    <Stack gap={4}>
      <NumberInput
        id={`pct-${result.id}`} min={0} max={100} step={1}
        label={t('ihc.label.percentStained', '% cells stained')}
        value={result.rawPercent ?? ''}
        onChange={(e) => onChange({ rawPercent: e.target.value === '' ? null : Number(e.target.value) })}
      />
      {resolved?.mandatoryComment && (
        <InlineNotification
          kind="info" lowContrast hideCloseButton
          title={t('ihc.banner.mandatoryCommentTitle', 'Mandatory reporting comment')}
          subtitle={t(resolved.mandatoryComment[0], resolved.mandatoryComment[1])}
        />
      )}
    </Stack>
  );
}

// FR-8 — this section does not exist in the current design at all, and accreditation
// requires it.
function ControlsSection({ markerResults, failedControls, missingInternalControl }) {
  return (
    <Stack gap={5}>
      {/* FR-8.3, AC-21 — a failed external control BLOCKS marker completion. The failed
          run is retained; the repeat is a new row, not an overwrite. */}
      {failedControls.length > 0 && (
        <InlineNotification
          kind="error" lowContrast hideCloseButton role="alert"
          title={t('ihc.banner.controlFailedTitle', 'External control failed')}
          subtitle={t('ihc.banner.controlFailed',
            'The external control for this run failed. The marker cannot be completed until the run is repeated.')}
        />
      )}
      {missingInternalControl.length > 0 && (
        <InlineNotification
          kind="warning" lowContrast hideCloseButton
          title={t('ihc.banner.internalControlMissingTitle', 'Internal control status missing')}
          subtitle={t('ihc.banner.internalControlMissing',
            'Internal control status is required for every ER or PgR result scoring 0–10%: {markers}')
            .replace('{markers}', missingInternalControl.map((r) => markerLabel(r.markerCode)).join(', '))}
        />
      )}

      <TableContainer title={t('ihc.section.controls', 'Controls')}>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>{t('ihc.label.marker', 'Marker')}</TableHeader>
              <TableHeader>{t('ihc.label.externalControlLot', 'External control lot')}</TableHeader>
              <TableHeader>{t('ihc.label.externalControlResult', 'External control')}</TableHeader>
              <TableHeader>{t('ihc.label.internalControl', 'Internal control')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {markerResults.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{markerLabel(r.markerCode)}</TableCell>
                  <TableCell>{r.externalControlLot ?? '—'}</TableCell>
                  <TableCell>
                    <Tag type={r.externalControlResult === 'PASS' ? TAG_KIND.complete : TAG_KIND.critical}>
                      {r.externalControlResult === 'PASS'
                        ? t('ihc.control.pass', 'Pass') : t('ihc.control.fail', 'Fail')}
                    </Tag>
                  </TableCell>
                  <TableCell>{internalControlLabel(r.internalControlStatus)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* FR-8.4 — assay validation and proficiency-testing records are LABORATORY-level,
          not case-level. The section links to them; it does not hold them. Neither
          surface exists yet, which is why this is a stated seam rather than a stub. */}
      <p className="cds--type-helper-text-01">
        {t('ihc.helper.validationRecords',
          'Assay validation and proficiency-testing records are laboratory-level records, not held on the case. This section links to them once that surface exists.')}
      </p>
    </Stack>
  );
}

function FindingsSection({ caseData, setCaseData, setDirty, markerResults }) {
  return (
    <Stack gap={5}>
      <TextArea
        id="interpretation" rows={6}
        labelText={t('ihc.label.interpretation', 'Interpretation')}
        helperText={t('caseView.helper.macroSupported', 'Supports macro codes (Macro Library, OGC-788)')}
        value={caseData.interpretation}
        onChange={(e) => { setCaseData((c) => ({ ...c, interpretation: e.target.value })); setDirty(true); }}
      />

      {/* A structured summary of every marker with its category and applied set. This is
          the correlation the pathologist is on this screen to make, and the three-button
          tab strip in the current design made the scores and the interpretation mutually
          invisible. (Layout) */}
      <TableContainer title={t('ihc.label.markerSummary', 'Marker summary')}>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>{t('ihc.label.marker', 'Marker')}</TableHeader>
              <TableHeader>{t('caseView.label.rawMeasurement', 'Raw measurement')}</TableHeader>
              <TableHeader>{t('ihc.label.derivedCategory', 'Category')}</TableHeader>
              <TableHeader>{t('ihc.label.thresholdSet', 'Threshold set applied')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {markerResults.map((r) => {
              const cat = categoryOf(r);
              return (
                <TableRow key={r.id}>
                  <TableCell>{markerLabel(r.markerCode)}</TableCell>
                  <TableCell>{rawMeasurementText(r)}</TableCell>
                  <TableCell><Tag type={cat.kind}>{t(cat.i18n, cat.label)}</Tag></TableCell>
                  <TableCell className="cds--type-helper-text-01">
                    {r.thresholdSetRef ?? t('ihc.badge.notInterpreted', 'Not interpreted')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* FR-9.3, AC-22 — THE SCREEN RENDERS NO THERAPY RECOMMENDATION. The December 2025
          design's "Patient eligible for HER2-targeted therapy" and "Recommend retesting
          with an alternative HER2 assay" are removed and not replaced. A laboratory
          report states what was measured and how it was categorised; eligibility and
          retesting decisions belong to the clinician and to the lab's own SOP.
          If you are about to add a string here that tells someone what to DO, stop. */}
      <p className="cds--type-helper-text-01">
        {t('ihc.helper.noEligibilityStatements',
          'This screen reports marker categories. Therapy eligibility and retesting are clinical decisions made outside the laboratory report.')}
      </p>
    </Stack>
  );
}

function rawMeasurementText(r) {
  if (r.rawScore != null) return r.rawScore;
  if (r.ishRatio != null) {
    return t('ihc.value.ishRaw', 'ratio {ratio}, {her2} HER2 signals, {n} nuclei')
      .replace('{ratio}', r.ishRatio).replace('{her2}', r.ishHer2Signals).replace('{n}', r.cellsCounted);
  }
  if (r.rawPercent != null) {
    return r.rawIntensityCode
      ? `${r.rawPercent}% · ${intensityLabel(r.rawIntensityCode)}`
      : `${r.rawPercent}%`;
  }
  return '—';
}

// FR-10 — identical behaviour to the pathology screen. One click, new tab, no per-row
// action buttons. Generation is gated on the ACTUAL precondition and the tooltip states
// that same condition — the December 2025 mockup gated on case status, tooltipped a
// different condition, and was permanently dead. (AC-23)
function ReportsSection({ reports, canGenerate }) {
  const openReport = (r) => window.open(`/rest/ihc/report/${r.id}`, '_blank', 'noopener');
  return (
    <Stack gap={5}>
      <Button
        kind="primary" size="sm" disabled={!canGenerate}
        title={canGenerate ? '' : t('ihc.tooltip.generateBlocked',
          'Record every required marker and enter the interpretation')}
        onClick={() => window.open('/rest/ihc/report/generate', '_blank', 'noopener')}
      >
        {t('caseView.action.generateReport', 'Generate report')}
      </Button>

      {reports.length === 0 ? (
        <p>{t('ihc.empty.noReports', 'No reports yet. Complete the interpretation to generate one.')}</p>
      ) : (
        <TableContainer
          title={t('ihc.section.reports', 'Reports')}
          description={t('caseView.helper.reportOpensNewTab',
            'Selecting a report opens it in a new tab, where download, print and email are available.')}
        >
          <Table size="sm">
            <TableHead>
              <TableRow>
                <TableHeader>{t('caseView.label.version', 'Version')}</TableHeader>
                <TableHeader>{t('caseView.label.generated', 'Generated')}</TableHeader>
                <TableHeader>{t('caseView.label.by', 'By')}</TableHeader>
                <TableHeader>{t('caseView.label.type', 'Type')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((r) => (
                <TableRow
                  key={r.id} onClick={() => openReport(r)} style={{ cursor: 'pointer' }}
                  title={t('caseView.tooltip.openReport', 'Open report v{v} in a new tab').replace('{v}', r.versionNumber)}
                >
                  <TableCell>v{r.versionNumber}</TableCell>
                  <TableCell>{r.generatedDate}</TableCell>
                  <TableCell>{r.generatedBy}</TableCell>
                  <TableCell>
                    <Tag type={r.reportType === 'FINAL' ? TAG_KIND.complete : TAG_KIND.inProgress}>{r.reportType}</Tag>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* FR-10.3 — what the report must state per marker. Named here because it is the
          requirement most likely to be lost between the screen and the report template. */}
      <p className="cds--type-helper-text-01">
        {t('ihc.helper.reportContents',
          'Per marker the report states: antibody clone or probe, assay and platform, scoring method, raw measurement, derived category, the threshold set with its source and edition, control status, and the pre-analytic times.')}
      </p>
    </Stack>
  );
}

// FR-5.5, AC-11 — the reason is mandatory. This is one of the two places a modal is
// warranted on this screen, because the action needs a deliberate confirmation and a
// reason before it commits.
function OverrideModal({ result, onCancel, onSubmit }) {
  const [category, setCategory] = useState(result.overrideCategoryCode || '');
  const [reason, setReason] = useState(result.overrideReason || '');
  const valid = category && reason.trim().length > 0;
  const options = result.scoringSystem === 'HER2_IHC'
    ? HER2_IHC_SCORES.map((s) => s.code)
    : ['POSITIVE', 'LOW_POSITIVE', 'NEGATIVE', 'LOW', 'INDETERMINATE', 'HIGH', 'CONCURRENT_IHC_REVIEW'];
  return (
    <Modal
      open
      modalHeading={t('ihc.modal.overrideHeading', 'Override the derived category')}
      primaryButtonText={t('ihc.action.overrideCategory', 'Override category')}
      secondaryButtonText={t('caseView.action.cancel', 'Cancel')}
      primaryButtonDisabled={!valid}
      onRequestClose={onCancel}
      onRequestSubmit={() => onSubmit(result, category, reason)}
    >
      <Stack gap={5}>
        <p>{t('ihc.modal.overrideBody',
          'The raw measurement and the threshold set that would have applied are both retained. The override is marked on the result and in the report, and it is audited.')}</p>
        <div className="caseView__field-row">
          <span className="cds--type-helper-text-01">{t('ihc.modal.derivedWas', 'Derived category')}</span>
          <span><strong>{result.derivedCategoryCode ?? t('ihc.badge.notInterpreted', 'Not interpreted')}</strong></span>
        </div>
        <div className="caseView__field-row">
          <span className="cds--type-helper-text-01">{t('ihc.label.thresholdSet', 'Threshold set applied')}</span>
          <span>{result.thresholdSetRef ?? '—'}</span>
        </div>
        <Select
          id="overrideCategory" labelText={t('ihc.modal.overrideTo', 'Override to')}
          value={category} onChange={(e) => setCategory(e.target.value)}
        >
          <SelectItem value="" text={t('caseView.label.selectOne', 'Select…')} />
          {options.map((code) => (
            <SelectItem key={code} value={code}
              text={t(...(CATEGORY_LABELS[code] ? [CATEGORY_LABELS[code][0], CATEGORY_LABELS[code][1]] : [code, code]))} />
          ))}
        </Select>
        <TextInput
          id="overrideReason" required
          labelText={t('caseView.label.reason', 'Reason')}
          invalid={reason.trim().length === 0}
          invalidText={t('ihc.error.overrideReasonRequired', 'A reason is required to override a derived category')}
          value={reason} onChange={(e) => setReason(e.target.value)}
        />
      </Stack>
    </Modal>
  );
}

export default ImmunohistochemistryCaseView;
