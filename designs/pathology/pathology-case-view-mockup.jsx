// Route:      /PathologyCaseView/:pathologySampleId
// SideNav:    Pathology → Dashboard → Case View
// Breadcrumb: Home / Pathology / Dashboard / Case [LabNumber]
// FRS:        pathology-case-view-v2.md v2.0
// Shell:      case-view-shell.md v1.0
// Epic:       OGC-264
//
// Reference implementation for developer handoff. Not production code: data is mocked and
// persistence is stubbed. What it IS authoritative about is the patterns — the derived
// section-state model, inline row expansion, derived counts, scan verification, and the
// Carbon components each requirement names.
//
// Non-negotiables visible in here, each traceable to the FRS:
//   * Section state is DERIVED from status + role. Never a stored completion flag.  (FR-2, S-4.1)
//   * Every count is computed over rows. No count column, no count input.           (FR-9.6)
//   * Cassette and block are ONE row; cassetteState moves CASSETTE -> BLOCK.        (FR-9.1)
//   * Every slide references its parent block.                                      (FR-9.2)
//   * Inline rows for edits and additions. Modals only for destructive confirm.     (D-005, D-011)
//   * Operator and timestamp come from session + server. Never typed.               (FR-2.4)
//   * Deactivate, never delete.                                                     (S-10.4)
//   * One click opens a report in a new tab. No per-row download/print/email.       (D-054)

import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid, Column, Stack, Breadcrumb, BreadcrumbItem,
  Accordion, AccordionItem,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent,
  TableSelectRow, TableSelectAll, TableBatchActions, TableBatchAction,
  TextInput, TextArea, Select, SelectItem, ComboBox, FilterableMultiSelect,
  NumberInput, Checkbox, RadioButton, RadioButtonGroup, Toggle,
  Button, IconButton, Tag, Tile, InlineNotification, Loading, Modal,
  Link, SkeletonText,
} from '@carbon/react';
import { Add, Printer, View, Renew, Undo, Save, CheckmarkFilled, WarningFilled } from '@carbon/icons-react';

// i18n. Every visible string goes through this. Replace with useIntl() on integration —
// the shipped PathologyCaseView.jsx already uses react-intl, so this must not regress. (FR-16)
const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Stage model — the shipped PathologyStatus enum, reworked per FR-2.1.
// Retired: CUTTING (-> GROSSING), SLICING (-> MICROTOMY), ADDITIONAL_REQUEST (-> derived flag).
// ---------------------------------------------------------------------------
const STAGES = [
  { key: 'ACCESSIONED',       i18n: 'pathology.stage.accessioned',      label: 'Accessioned',              mandatory: true },
  { key: 'GROSSING',          i18n: 'pathology.stage.grossing',         label: 'Grossing',                 mandatory: true },
  { key: 'DECALCIFICATION',   i18n: 'pathology.stage.decalcification',  label: 'Decalcification',          conditional: true },
  { key: 'PROCESSING',        i18n: 'pathology.stage.processing',       label: 'Processing' },
  { key: 'EMBEDDING',         i18n: 'pathology.stage.embedding',        label: 'Embedding' },
  { key: 'MICROTOMY',         i18n: 'pathology.stage.microtomy',        label: 'Microtomy' },
  { key: 'STAINING',          i18n: 'pathology.stage.staining',         label: 'Staining' },
  { key: 'COVERSLIPPING',     i18n: 'pathology.stage.coverslipping',    label: 'Coverslipping & QC' },
  { key: 'READY_PATHOLOGIST', i18n: 'pathology.stage.readyPathologist', label: 'Ready for Pathologist',    mandatory: true },
  { key: 'UNDER_REVIEW',      i18n: 'pathology.stage.underReview',      label: 'Under Pathologist Review' },
  { key: 'COMPLETED',         i18n: 'pathology.stage.completed',        label: 'Completed',                mandatory: true },
];
const stageIndex = (key) => STAGES.findIndex((s) => s.key === key);

// Forward-transition labels. The action bar's primary action is a function of status and
// role — never a fixed label, never a row of competing buttons. (S-7.2)
const ADVANCE_LABEL = {
  GROSSING:          ['pathology.action.beginGrossing',     'Begin grossing'],
  DECALCIFICATION:   ['pathology.action.sendForDecalc',     'Send for decalcification'],
  PROCESSING:        ['pathology.action.sendForProcessing', 'Send for processing'],
  EMBEDDING:         ['pathology.action.sendForEmbedding',  'Send for embedding'],
  MICROTOMY:         ['pathology.action.sendToMicrotomy',   'Send to microtomy'],
  STAINING:          ['pathology.action.sendForStaining',   'Send for staining'],
  COVERSLIPPING:     ['pathology.action.sendForCoverslip',  'Send for coverslipping'],
  READY_PATHOLOGIST: ['pathology.action.sendToPathologist', 'Send to pathologist'],
};

// Shared status vocabulary from the shell. A badge conveys state in TEXT as well as colour. (S-4.3)
const TAG_KIND = {
  complete: 'green', critical: 'red', inProgress: 'blue',
  pending: 'purple', verified: 'teal', partial: 'warm-gray', none: 'gray',
};

// ---------------------------------------------------------------------------
// Mock data. Shapes match the FRS Data Model, including the columns it adds.
// ---------------------------------------------------------------------------
const CASE = {
  pathologySampleId: 4021,
  labNumber: '24TST000010',
  status: 'MICROTOMY',
  requestDate: '2026-08-28',
  arrivalDate: '2026-08-29',
  specimen: 'Liver — right lobe, segment VII',
  specimenType: 'Core needle biopsy',
  procedure: 'Ultrasound-guided core needle biopsy',
  provisionalDiagnosis: 'Suspected hepatocellular carcinoma',
  priorSurgery: 'None recorded',
  clinicalHistory: 'Rule out malignancy. Elevated liver enzymes (ALT 156, AST 142). Ultrasound showed a 3.2 cm hypoechoic lesion.',
  provider: 'LISETTE, Jean Alex',
  facility: 'Jawaharlal Nehru Hospital',
  ward: 'Gastroenterology / Ward 4',
  technician: 'Kankan Musa, Mansa',
  pathologist: 'Samini, Privashi',
  decalcificationRequired: false,
  grossExam: 'Received in formalin, three cores of liver tissue, the longest 18 mm, tan-brown, one bearing a pale firm focus 6 mm across. Capsular surface identified on the fourth core. Entirely submitted in four cassettes.',
  microscopyExam: '',
  patient: { name: 'VAISHA, LAMALI', dob: '1985-06-15', age: 40, sex: 'M', identifiers: [
    { type: 'UHID', value: 'UHI123321IH' }, { type: 'NIC', value: '123457678' },
  ]},
  // Shell S-2 — a query over sibling Samples for the same Patient, not a stored field.
  priorResults: [
    { labNumber: '24TST000091', date: '2026-01-22', specimen: 'Liver core biopsy', conclusion: 'C22.0 Hepatocellular carcinoma', route: '/PathologyCaseView/3901' },
    { labNumber: '25IHC000044', date: '2026-02-04', specimen: 'Liver — IHC panel',  conclusion: 'HepPar-1 positive, CK7 negative', route: '/ImmunohistochemistryCaseView/812' },
  ],
};

// pathology_block — cassette and block are the SAME row. (FR-9.1)
const BLOCKS = [
  { id: 51, partDesignation: 'A', designation: 'A1', barcode: '24TST000010.A1', tissueTypeId: 'liver-lesion-central',  tissueType: 'Liver — lesion, central',        cassetteState: 'BLOCK',    storageLocationId: 'bs2-d5', storage: 'Block store 2 · Drawer 5', active: true },
  { id: 52, partDesignation: 'A', designation: 'A2', barcode: '24TST000010.A2', tissueTypeId: 'liver-lesion-periph',   tissueType: 'Liver — lesion, periphery',      cassetteState: 'BLOCK',    storageLocationId: 'bs2-d5', storage: 'Block store 2 · Drawer 5', active: true },
  { id: 53, partDesignation: 'A', designation: 'A3', barcode: '24TST000010.A3', tissueTypeId: 'liver-background',     tissueType: 'Liver — background parenchyma',  cassetteState: 'BLOCK',    storageLocationId: 'bs2-d5', storage: 'Block store 2 · Drawer 5', active: true },
  { id: 54, partDesignation: 'A', designation: 'A4', barcode: '24TST000010.A4', tissueTypeId: 'liver-capsular',       tissueType: 'Liver — capsular margin',        cassetteState: 'CASSETTE', storageLocationId: null,     storage: null,                        active: true },
];

// pathology_slide — note blockId, the parentage that does not exist in the schema today. (FR-9.2)
const SLIDES = [
  { id: 91, blockId: 51, designation: 'A1.1', barcode: '24TST000010.A1.1', level: '1', stain: 'H&E',              stainStatus: 'complete',   labelVerifiedAt: '2026-08-31 09:02', labelVerifiedBy: 'Tech, Lab', coverslipQc: 'pass', active: true },
  { id: 92, blockId: 51, designation: 'A1.2', barcode: '24TST000010.A1.2', level: '2', stain: 'H&E',              stainStatus: 'complete',   labelVerifiedAt: '2026-08-31 09:04', labelVerifiedBy: 'Tech, Lab', coverslipQc: 'pass', active: true },
  { id: 93, blockId: 51, designation: 'A1.3', barcode: '24TST000010.A1.3', level: '3', stain: 'H&E',              stainStatus: 'complete',   labelVerifiedAt: '2026-08-31 09:06', labelVerifiedBy: 'Tech, Lab', coverslipQc: 'pass', active: false, deactivationReason: 'Section folded' },
  { id: 94, blockId: 52, designation: 'A2.1', barcode: '24TST000010.A2.1', level: '1', stain: 'H&E',              stainStatus: 'complete',   labelVerifiedAt: '2026-08-31 09:11', labelVerifiedBy: 'Tech, Lab', coverslipQc: 'pass', active: true },
  { id: 95, blockId: 52, designation: 'A2.2', barcode: '24TST000010.A2.2', level: '1', stain: 'Reticulin',        stainStatus: 'inProgress', labelVerifiedAt: '2026-08-31 09:14', labelVerifiedBy: 'Tech, Lab', coverslipQc: null,   active: true },
  { id: 96, blockId: 53, designation: 'A3.1', barcode: '24TST000010.A3.1', level: '1', stain: 'H&E',              stainStatus: 'complete',   labelVerifiedAt: '2026-08-31 09:18', labelVerifiedBy: 'Tech, Lab', coverslipQc: 'pass', active: true },
  { id: 97, blockId: 53, designation: 'A3.2', barcode: '24TST000010.A3.2', level: '2', stain: 'Masson trichrome', stainStatus: 'pending',    labelVerifiedAt: '2026-08-31 09:20', labelVerifiedBy: 'Tech, Lab', coverslipQc: null,   active: true },
];

// pathology_request — the EXISTING table, with the columns FR-10 adds.
const REQUESTS = [
  { id: 21, requestKind: 'SLIDE', targetBlockId: 52, targetSlideId: null, value: 'Deeper sections at 3 µm rather than 5 µm — lesional interface not represented', priority: 'URGENT', requestedBy: 'Samini, P.', requestedDate: '2026-08-31', status: 'OPENED' },
  { id: 22, requestKind: 'STAIN', targetBlockId: null, targetSlideId: 94, value: 'Reticulin to assess fibrosis pattern', priority: 'NORMAL', requestedBy: 'Samini, P.', requestedDate: '2026-08-31', status: 'OPENED' },
  { id: 23, requestKind: 'BLOCK', targetBlockId: null, targetSlideId: null, value: 'Additional capsular margin tissue from the superior aspect', priority: 'NORMAL', requestedBy: 'Samini, P.', requestedDate: '2026-08-30', status: 'COMPLETED' },
];

const CONSULTATIONS = [
  { id: 7, consultedUser: 'Chen, Wei', reason: 'Difficult differential — HCC vs. cholangiocarcinoma', preTreatment: true, status: 'REQUESTED', requestedAt: '2026-09-01 11:02', outcome: null, outcomeNote: null },
];

const STAGE_EVENTS = [
  { stage: 'PROCESSING', enteredAt: '2026-08-29 17:40', enteredBy: 'Kankan Musa, M.', completedAt: '2026-08-30 07:05', completedBy: 'Kankan Musa, M.', direction: 'FORWARD', runReference: 'TP-2026-0841', notes: 'Tissue-Tek VIP · Overnight standard' },
  { stage: 'EMBEDDING',  enteredAt: '2026-08-30 08:10', enteredBy: 'Kankan Musa, M.', completedAt: null, completedBy: null, direction: 'FORWARD', runReference: null, notes: null },
];

const CONCLUSIONS = [
  { id: 31, type: 'DICTIONARY', dictionaryId: 'dx-c220', code: 'C22.0', value: 'Hepatocellular carcinoma', malignant: true },
  { id: 32, type: 'DICTIONARY', dictionaryId: 'dx-k746', code: 'K74.6', value: 'Cirrhosis, unspecified',   malignant: false },
];
const TECHNIQUES = [
  { id: 1, shortCode: 'H&E', fullName: 'Haematoxylin & eosin' },
  { id: 2, shortCode: 'RET', fullName: 'Reticulin' },
];
const REPORTS = [
  { id: 61, versionNumber: 2, generatedDate: '2026-09-02 14:30', generatedBy: 'Samini, P.', reportType: 'FINAL', voided: false },
  { id: 62, versionNumber: 1, generatedDate: '2026-09-01 09:05', generatedBy: 'Samini, P.', reportType: 'DRAFT', voided: false },
];

// Dictionary-backed pickers. Real catalogues grow, so these are ComboBox/typeahead, not
// static Select — a static select over a growing catalogue is a D-007 violation.
const STAIN_DICTIONARY  = ['H&E', 'Reticulin', 'Masson trichrome', 'PAS', 'PAS-D', 'Perls iron', 'Congo red', 'Ziehl-Neelsen', 'Grocott (GMS)', 'Orcein'];
const TISSUE_DICTIONARY = ['Liver — lesion, central', 'Liver — lesion, periphery', 'Liver — background parenchyma', 'Liver — capsular margin'];

// Per-deployment stage enablement (FR-2.3), from common properties.
const STAGE_ENABLED = {
  ACCESSIONED: true, GROSSING: true, DECALCIFICATION: true, PROCESSING: true,
  EMBEDDING: true, MICROTOMY: true, STAINING: true, COVERSLIPPING: true,
  READY_PATHOLOGIST: true, UNDER_REVIEW: true, COMPLETED: true,
};
const SCAN_VERIFICATION_REQUIRED = true; // pathology.microtomy.scanVerificationRequired

// ===========================================================================

function PathologyCaseView() {
  // Server state (stubbed).
  const [caseData, setCaseData] = useState(CASE);
  const [blocks, setBlocks] = useState(BLOCKS);
  const [slides, setSlides] = useState(SLIDES);
  const [requests, setRequests] = useState(REQUESTS);

  // UI state. Note what is NOT here: no per-section completion flag, no caseReadyForReview
  // boolean. Section state is derived below. (S-4.1)
  const [expandedBlockId, setExpandedBlockId] = useState(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [notification, setNotification] = useState(null);
  const [scan, setScan] = useState({ block: '', slide: '' });

  // Current user's capabilities come from the existing Histopathology role bundle.
  // No per-action permission keys. (Permissions / D-006)
  const user = { name: 'Kankan Musa, Mansa', hasHistopathologyBundle: true, isPathologist: false };

  const si = stageIndex(caseData.status);
  const reached = useCallback((key) => si >= stageIndex(key), [si]);

  // ---- Derived values. Every count is computed. No count is stored. (FR-9.6) ----
  const activeBlocks = useMemo(() => blocks.filter((b) => b.active), [blocks]);
  const embeddedBlocks = useMemo(() => activeBlocks.filter((b) => b.cassetteState === 'BLOCK'), [activeBlocks]);
  const outstandingCassettes = useMemo(
    () => activeBlocks.filter((b) => b.cassetteState === 'CASSETTE'), [activeBlocks]);
  const activeSlides = useMemo(() => slides.filter((s) => s.active), [slides]);
  const stainedSlides = useMemo(() => activeSlides.filter((s) => s.stainStatus === 'complete'), [activeSlides]);
  const openRequests = useMemo(() => requests.filter((r) => r.status === 'OPENED'), [requests]);
  const criticalConclusion = useMemo(() => CONCLUSIONS.some((c) => c.malignant), []);

  // Replaces the retired ADDITIONAL_REQUEST status — a case shows this flag at whatever
  // stage it is genuinely in, rather than losing its stage to represent outstanding work.
  const hasOpenRequests = openRequests.length > 0;

  // Scan verification (FR-7.3). A slide label must resolve to its scanned block.
  const scanMatch = Boolean(scan.block && scan.slide && scan.slide.startsWith(`${scan.block}.`));
  const scanMismatch = Boolean(scan.block && scan.slide && !scanMatch);

  const notify = (kind, title, subtitle) => setNotification({ kind, title, subtitle });

  // ---- Section state, derived from status + role. Four states only. (S-4) ----
  const sectionState = useCallback((stageKey, opts = {}) => {
    if (!STAGE_ENABLED[stageKey]) {
      return { disabled: true, hint: t('pathology.locked.stageDisabled', 'Not tracked at this laboratory') };
    }
    if (opts.conditional && !caseData.decalcificationRequired) {
      return { disabled: true, hint: t('pathology.locked.decalcNotRequired', 'Not required for this specimen') };
    }
    if (!reached(stageKey)) {
      return {
        disabled: true,
        hint: t('pathology.locked.awaitingStage', 'Available once the case reaches {stage}')
          .replace('{stage}', t(STAGES[stageIndex(stageKey)].i18n, STAGES[stageIndex(stageKey)].label)),
      };
    }
    if (opts.pathologistOnly && !user.isPathologist) {
      return { disabled: true, hint: t('pathology.locked.pathologistOnly', 'Pathologist review') };
    }
    return { disabled: false, hint: null };
  }, [caseData.decalcificationRequired, reached, user.isPathologist]);

  // ---- Transitions. Operator and timestamp are captured, never typed. (FR-2.4) ----
  const advanceStage = () => {
    const next = STAGES.slice(si + 1).find((s) => STAGE_ENABLED[s.key]
      && !(s.conditional && !caseData.decalcificationRequired));
    if (!next) return;
    if (next.key === 'READY_PATHOLOGIST' && hasOpenRequests) {
      // Permitted after a confirmation naming each open request; the override is audited. (FR-10.11)
      setConfirmDeactivate({ kind: 'openRequests', next: next.key });
      return;
    }
    setCaseData((c) => ({ ...c, status: next.key }));
    notify('success', t('pathology.toast.stageAdvanced', 'Stage advanced'),
      t('pathology.toast.attributionCaptured', 'Operator and timestamp captured from the session.'));
  };

  const returnStage = () => setConfirmDeactivate({ kind: 'returnStage' });

  const embedCassette = (blockId) => {
    setBlocks((bs) => bs.map((b) => b.id === blockId
      ? { ...b, cassetteState: 'BLOCK', embeddedBy: user.name, embeddedAt: 'server-clock' } : b));
    setDirty(true);
  };

  // Deactivate, never delete. This is the only place a modal is warranted. (S-10.4, D-005)
  const deactivateSlide = (slide, reason) => {
    setSlides((ss) => ss.map((s) => s.id === slide.id ? { ...s, active: false, deactivationReason: reason } : s));
    setConfirmDeactivate(null);
    notify('info', t('pathology.toast.slideDeactivated', 'Slide deactivated'),
      t('pathology.toast.retained', 'The record is retained and remains visible under “Show deactivated”.'));
  };

  // The action bar's primary action. Its disabled condition is the ACTUAL precondition —
  // never a proxy, and always the condition its tooltip states. (S-7.4, FR-15.4)
  const primaryAction = () => {
    if (caseData.status === 'COMPLETED') {
      return { label: t('pathology.action.reopen', 'Reopen case'), kind: 'secondary', disabled: false, onClick: returnStage };
    }
    if (user.isPathologist && (caseData.status === 'READY_PATHOLOGIST' || caseData.status === 'UNDER_REVIEW')) {
      const ready = caseData.grossExam.trim() && caseData.microscopyExam.trim() && CONCLUSIONS.length > 0;
      return {
        label: t('pathology.action.signOut', 'Sign out & finalize'),
        kind: 'primary',
        disabled: !ready,
        title: ready ? '' : t('pathology.tooltip.signOutBlocked',
          'Enter the macroscopic and microscopic descriptions and at least one conclusion'),
        onClick: () => notify('success', t('pathology.toast.signedOut', 'Case signed out'),
          criticalConclusion
            ? t('pathology.toast.criticalEmitted', 'Report opened in a new tab. A critical-result event was emitted.')
            : t('pathology.toast.reportOpened', 'Report opened in a new tab.')),
      };
    }
    const next = STAGES.slice(si + 1).find((s) => STAGE_ENABLED[s.key]);
    const [k, f] = ADVANCE_LABEL[next?.key] || ['pathology.action.advance', 'Advance'];
    return { label: t(k, f), kind: 'primary', disabled: false, onClick: advanceStage };
  };
  const primary = primaryAction();

  return (
    <Grid className="pathology-case-view" fullWidth>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/PathologyDashboard">{t('breadcrumb.pathology', 'Pathology')}</BreadcrumbItem>
          <BreadcrumbItem href="/PathologyDashboard">{t('breadcrumb.dashboard', 'Dashboard')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            {t('pathology.label.case', 'Pathology Case')} {caseData.labNumber}
          </BreadcrumbItem>
        </Breadcrumb>

        <h1>{t('pathology.label.case', 'Pathology Case')} — {caseData.labNumber}</h1>

        {/* Shell S-1: existing shared PatientHeader. Which identifiers show is existing
            patient-identifier configuration, not a per-screen choice. */}
        <PatientHeader
          patient={caseData.patient}
          statusTag={<Tag type={TAG_KIND.inProgress}>{t(STAGES[si].i18n, STAGES[si].label)}</Tag>}
          assigned={`${caseData.technician} · ${caseData.pathologist}`}
        />

        {/* Shell S-2: a query over sibling Samples for this Patient. Cross-bench. */}
        <PriorResultsPanel results={caseData.priorResults} />

        {notification && (
          <InlineNotification
            kind={notification.kind}
            title={notification.title}
            subtitle={notification.subtitle}
            onCloseButtonClick={() => setNotification(null)}
            lowContrast
          />
        )}
      </Column>

      {/* Shell S-5: the rail renders because this screen has 8 gated sections (>= 5). */}
      <Column lg={3} md={2} sm={4}>
        <ProgressRail
          stages={STAGES}
          currentIndex={si}
          enabled={STAGE_ENABLED}
          conditionalSkipped={!caseData.decalcificationRequired}
          openRequests={openRequests}
        />
      </Column>

      <Column lg={9} md={4} sm={4}>
        <Accordion>
          {/* ---------------- 1 · Case Information (display-only) ---------------- */}
          <AccordionItem title={<SectionTitle
              n={1} label={t('pathology.section.caseInfo', 'Case Information')}
              badge={<span className="cds--type-helper-text-01">{t('caseView.badge.readOnly', 'Read only')}</span>} />}>
            <CaseInformation caseData={caseData} />
          </AccordionItem>

          {/* ---------------- 2 · Grossing ---------------- */}
          <SectionItem
            n={2} i18nKey="pathology.section.grossing" label="Grossing"
            state={sectionState('GROSSING')}
            badge={<Tag type={TAG_KIND.complete}>
              {t('pathology.badge.cassettes', '{n} cassettes').replace('{n}', activeBlocks.length)}
            </Tag>}
          >
            <Stack gap={5}>
              <TextArea
                id="grossExam"
                labelText={t('pathology.label.grossExam', 'Macroscopic description')}
                helperText={t('pathology.helper.macroSupported', 'Supports macro codes (Macro Library, OGC-788)')}
                value={caseData.grossExam}
                rows={5}
                onChange={(e) => { setCaseData((c) => ({ ...c, grossExam: e.target.value })); setDirty(true); }}
              />
              <Checkbox
                id="decalcRequired"
                labelText={t('pathology.label.decalcRequired', 'Specimen requires decalcification')}
                helperText={t('pathology.helper.decalcGate', 'Makes the Decalcification stage reachable')}
                checked={caseData.decalcificationRequired}
                onChange={(_, { checked }) => { setCaseData((c) => ({ ...c, decalcificationRequired: checked })); setDirty(true); }}
              />
              <CassetteTable
                blocks={activeBlocks}
                tissueDictionary={TISSUE_DICTIONARY}
                onPrint={(b) => notify('info', t('pathology.toast.printQueued', 'Label sent to print'), b.barcode)}
              />
            </Stack>
          </SectionItem>

          {/* ---------------- 3 · Decalcification (conditional) ---------------- */}
          <SectionItem
            n={3} i18nKey="pathology.section.decalcification" label="Decalcification"
            state={sectionState('DECALCIFICATION', { conditional: true })}
            badge={!caseData.decalcificationRequired
              ? <span className="cds--type-helper-text-01">{t('caseView.badge.notApplicable', 'n/a')}</span>
              : <Tag type={TAG_KIND.inProgress}>{t('caseView.badge.inProgress', 'In progress')}</Tag>}
          >
            <InlineNotification
              kind="info" lowContrast hideCloseButton
              title={t('pathology.locked.decalcNotRequired', 'Not required for this specimen')}
              subtitle={t('pathology.helper.decalcShown',
                'The stage is enabled at this laboratory but was not flagged at grossing, so the case skips it. Shown rather than hidden.')}
            />
          </SectionItem>

          {/* ---------------- 4 · Processing (run-based) ---------------- */}
          <SectionItem
            n={4} i18nKey="pathology.section.processing" label="Processing"
            state={sectionState('PROCESSING')}
            badge={<Tag type={TAG_KIND.complete}>TP-2026-0841</Tag>}
          >
            <Stack gap={5}>
              <InlineNotification
                kind="warning" lowContrast hideCloseButton
                title={t('pathology.banner.runReferenceInterimTitle', 'Processor runs are not yet managed in OpenELIS')}
                subtitle={t('pathology.banner.runReferenceInterim',
                  'Record the run reference as it appears on the instrument. It becomes a real reference once run management exists.')}
              />
              <StageEventDetail event={STAGE_EVENTS.find((e) => e.stage === 'PROCESSING')} blocks={activeBlocks} />
            </Stack>
          </SectionItem>

          {/* ---------------- 5 · Embedding — derived reconciliation ---------------- */}
          <SectionItem
            n={5} i18nKey="pathology.section.embedding" label="Embedding"
            state={sectionState('EMBEDDING')}
            badge={<Tag type={outstandingCassettes.length ? TAG_KIND.partial : TAG_KIND.complete}>
              {t('pathology.badge.embeddedOf', '{embedded} of {total} embedded')
                .replace('{embedded}', embeddedBlocks.length).replace('{total}', activeBlocks.length)}
            </Tag>}
          >
            <Stack gap={5}>
              {/* Reconciliation NAMES the outstanding object. A count cannot. (FR-6.3) */}
              {outstandingCassettes.length > 0 && (
                <InlineNotification
                  kind="warning" lowContrast hideCloseButton
                  title={t('pathology.badge.embeddedOf', '{embedded} of {total} embedded')
                    .replace('{embedded}', embeddedBlocks.length).replace('{total}', activeBlocks.length)}
                  subtitle={t('pathology.badge.outstanding', '{designation} outstanding')
                    .replace('{designation}', outstandingCassettes.map((b) => b.designation).join(', '))}
                />
              )}
              <EmbeddingTable blocks={activeBlocks} onEmbed={embedCassette} />
            </Stack>
          </SectionItem>

          {/* ---------------- 6 · Microtomy — nested, scan-verified ---------------- */}
          <SectionItem
            n={6} i18nKey="pathology.section.microtomy" label="Microtomy"
            state={sectionState('MICROTOMY')}
            badge={<Tag type={TAG_KIND.inProgress}>
              {t('pathology.badge.slides', '{n} slides').replace('{n}', activeSlides.length)}
            </Tag>}
          >
            <Stack gap={5}>
              {SCAN_VERIFICATION_REQUIRED && (
                <ScanVerification
                  scan={scan} setScan={setScan} match={scanMatch} mismatch={scanMismatch}
                />
              )}
              <Button kind="ghost" size="sm" onClick={() => setShowDeactivated((v) => !v)}>
                {showDeactivated
                  ? t('caseView.action.hideDeactivated', 'Hide deactivated')
                  : t('caseView.action.showDeactivated', 'Show deactivated')}
              </Button>
              {/* Blocks expand to the slides cut from them — the bench works block by block.
                  Inline row expansion, never a modal. (FR-7.1, D-005) */}
              <MicrotomyTable
                blocks={embeddedBlocks}
                slides={showDeactivated ? slides : activeSlides}
                expandedBlockId={expandedBlockId}
                onToggleBlock={(id) => setExpandedBlockId((cur) => (cur === id ? null : id))}
                stainDictionary={STAIN_DICTIONARY}
                onDeactivate={(slide) => setConfirmDeactivate({ kind: 'slide', slide })}
                onPrint={(s) => notify('info', t('pathology.toast.printQueued', 'Label sent to print'), s.barcode)}
              />
            </Stack>
          </SectionItem>

          {/* ---------------- 7 · Staining ---------------- */}
          <SectionItem
            n={7} i18nKey="pathology.section.staining" label="Staining"
            state={sectionState('STAINING')}
            badge={<Tag type={stainedSlides.length === activeSlides.length ? TAG_KIND.complete : TAG_KIND.inProgress}>
              {t('pathology.badge.stainedOf', '{stained} of {total} stained')
                .replace('{stained}', stainedSlides.length).replace('{total}', activeSlides.length)}
            </Tag>}
          >
            <StainingTable slides={activeSlides} blocks={activeBlocks} stainDictionary={STAIN_DICTIONARY}
              onBatch={(selected) => notify('info',
                t('pathology.toast.batchStain', 'Stain applied'),
                // Names the slides, not a count. (labels-not-counts)
                selected.map((s) => s.designation).join(', '))} />
          </SectionItem>

          {/* ---------------- 8 · Coverslipping & QC ---------------- */}
          <SectionItem
            n={8} i18nKey="pathology.section.coverslipping" label="Coverslipping & QC"
            state={sectionState('COVERSLIPPING')}
            badge={<Tag type={TAG_KIND.verified}>
              {t('pathology.badge.qcPass', '{n} pass').replace('{n}', activeSlides.filter((s) => s.coverslipQc === 'pass').length)}
            </Tag>}
          >
            <CoverslippingTable slides={activeSlides} />
          </SectionItem>

          {/* ---------------- 9 · Pathologist Review ---------------- */}
          <SectionItem
            n={9} i18nKey="pathology.section.review" label="Pathologist Review"
            state={sectionState('READY_PATHOLOGIST')}
            badge={hasOpenRequests
              ? <Tag type={TAG_KIND.critical}>
                  {t('pathology.badge.openRequests', '{n} open requests').replace('{n}', openRequests.length)}
                </Tag>
              : <Tag type={TAG_KIND.complete}>{t('pathology.badge.noOpenRequests', 'No open requests')}</Tag>}
          >
            <Stack gap={6}>
              <PathologistAssignment caseData={caseData} />
              <RequestsTable
                requests={requests} blocks={activeBlocks} slides={activeSlides}
                newRequestOpen={newRequestOpen}
                onToggleNew={() => setNewRequestOpen((v) => !v)}
                onRaise={(req) => { setRequests((rs) => [{ ...req, id: Date.now(), status: 'OPENED' }, ...rs]); setNewRequestOpen(false); }}
                onComplete={(r) => setRequests((rs) => rs.map((x) => x.id === r.id ? { ...x, status: 'COMPLETED' } : x))}
                onRevert={(r) => setRequests((rs) => rs.map((x) => x.id === r.id ? { ...x, status: 'OPENED' } : x))}
              />
              <ConsultationPanel consultations={CONSULTATIONS} />
            </Stack>
          </SectionItem>

          {/* ---------------- 10 · Findings & Conclusion ---------------- */}
          <SectionItem
            n={10} i18nKey="pathology.section.findings" label="Findings & Conclusion"
            state={sectionState('READY_PATHOLOGIST')}
            badge={criticalConclusion
              ? <Tag type={TAG_KIND.critical}>{t('pathology.badge.malignant', 'Malignant')}</Tag>
              : <Tag type={TAG_KIND.none}>{t('caseView.badge.pending', 'Pending')}</Tag>}
          >
            <FindingsSection
              caseData={caseData} setCaseData={setCaseData} setDirty={setDirty}
              conclusions={CONCLUSIONS} techniques={TECHNIQUES} critical={criticalConclusion}
            />
          </SectionItem>

          {/* ---------------- 11 · Reports ---------------- */}
          <SectionItem
            n={11} i18nKey="pathology.section.reports" label="Reports"
            state={{ disabled: false, hint: null }}
            badge={REPORTS.length
              ? <Tag type={TAG_KIND.complete}>v{REPORTS[0].versionNumber} {REPORTS[0].reportType.toLowerCase()}</Tag>
              : <Tag type={TAG_KIND.none}>{t('caseView.badge.none', 'None')}</Tag>}
          >
            <ReportsSection
              reports={REPORTS}
              canGenerate={Boolean(caseData.grossExam.trim() && caseData.microscopyExam.trim() && CONCLUSIONS.length)}
            />
          </SectionItem>
        </Accordion>
      </Column>

      {/* Shell S-6: sticky Case Summary. Every count here is derived. */}
      <Column lg={4} md={2} sm={4}>
        <CaseSummary
          stage={STAGES[si]} cassettes={activeBlocks.length} embedded={embeddedBlocks.length}
          outstanding={outstandingCassettes} slides={activeSlides} stained={stainedSlides.length}
          openRequests={openRequests} consultations={CONSULTATIONS}
          critical={criticalConclusion} reports={REPORTS}
        />
      </Column>

      {/* Shell S-7: action bar. Ghost / secondary / one status-and-role-driven primary. */}
      <Column lg={16} md={8} sm={4}>
        <div className="pathology-case-view__action-bar">
          <div>
            {t('caseView.label.status', 'Status')}: <strong>{t(STAGES[si].i18n, STAGES[si].label)}</strong>
            {hasOpenRequests && <Tag type={TAG_KIND.critical}>
              {t('pathology.badge.openRequests', '{n} open requests').replace('{n}', openRequests.length)}
            </Tag>}
            {criticalConclusion && <Tag type={TAG_KIND.critical}>
              {t('pathology.badge.criticalCase', 'Critical-result case')}
            </Tag>}
            {dirty && <span className="cds--type-helper-text-01">
              {t('caseView.label.unsavedChanges', 'Unsaved changes')}
            </span>}
          </div>
          <Stack orientation="horizontal" gap={3}>
            <Button kind="ghost" disabled={!dirty}>{t('caseView.action.discard', 'Discard changes')}</Button>
            <Button kind="ghost" renderIcon={Undo} onClick={returnStage}>
              {t('pathology.action.returnStage', 'Return to previous stage')}
            </Button>
            <Button kind="secondary" renderIcon={Save} onClick={() => setDirty(false)}>
              {t('caseView.action.saveDraft', 'Save draft')}
            </Button>
            <Button kind={primary.kind} disabled={primary.disabled} title={primary.title} onClick={primary.onClick}>
              {primary.label}
            </Button>
          </Stack>
        </div>
      </Column>

      {/* The only modals on this screen: destructive confirmation and the open-request
          override. Everything else is inline. (D-005) */}
      {confirmDeactivate?.kind === 'slide' && (
        <Modal
          open danger
          modalHeading={t('pathology.modal.deactivateSlideHeading', 'Deactivate slide {designation}?')
            .replace('{designation}', confirmDeactivate.slide.designation)}
          primaryButtonText={t('caseView.action.deactivate', 'Deactivate')}
          secondaryButtonText={t('caseView.action.cancel', 'Cancel')}
          onRequestClose={() => setConfirmDeactivate(null)}
          onRequestSubmit={() => deactivateSlide(confirmDeactivate.slide, 'Deactivated by user')}
        >
          <p>{t('pathology.modal.deactivateSlideBody',
            'The slide record is retained and stays visible under “Show deactivated”. Slides are never deleted — 42 CFR 493.1105 requires them retained for 10 years.')}</p>
          <TextInput id="deactivationReason" labelText={t('caseView.label.reason', 'Reason')} required />
        </Modal>
      )}

      {confirmDeactivate?.kind === 'openRequests' && (
        <Modal
          open
          modalHeading={t('pathology.modal.openRequestsHeading', 'Outstanding bench requests')}
          primaryButtonText={t('pathology.action.sendAnyway', 'Send anyway')}
          secondaryButtonText={t('caseView.action.cancel', 'Cancel')}
          onRequestClose={() => setConfirmDeactivate(null)}
          onRequestSubmit={() => {
            setCaseData((c) => ({ ...c, status: confirmDeactivate.next }));
            setConfirmDeactivate(null);
            notify('warning', t('pathology.toast.overridden', 'Sent with open requests'),
              t('pathology.toast.overriddenAudited', 'The override was audited.'));
          }}
        >
          <p>{t('pathology.banner.openRequests',
            'This case has {count} open bench requests. Sending it to the pathologist will show them as incomplete.')
            .replace('{count}', openRequests.length)}</p>
          {/* Names each request by its instruction. Not a count. */}
          <ul>
            {openRequests.map((r) => (
              <li key={r.id}>
                <strong>{r.requestKind}</strong> — {r.value}
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </Grid>
  );
}

// ===========================================================================
// Shell components. These are the pieces S-1 to S-7 define, and they are consumed by
// Cytology and IHC too — extract them to a shared module on integration rather than
// leaving them here, or the current drift repeats.
// ===========================================================================

function SectionTitle({ n, label, badge }) {
  return (
    <span className="caseView__section-title">
      <span>{n}. {label}</span>
      {badge}
    </span>
  );
}

// The shell's accordion item: title, badge, and disabled-with-a-stated-reason.
// A section is NEVER removed from the DOM on the basis of state or role. (S-3.3)
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

// Shell S-2. A query over sibling Samples for this Patient — cross-bench, read-only,
// never re-interpreted for display.
function PriorResultsPanel({ results }) {
  if (!results.length) {
    return (
      <Tile>
        <p>{t('pathology.empty.noPriorResults', 'No prior anatomic-pathology results for this patient.')}</p>
      </Tile>
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

// Shell S-5. Optional: on at >= 5 gated sections. Badges NAME what is pending. (S-5.2)
function ProgressRail({ stages, currentIndex, enabled, conditionalSkipped, openRequests }) {
  return (
    <nav aria-label={t('caseView.label.caseProgress', 'Case progress')}>
      <ul className="caseView__rail">
        {stages.map((s, i) => {
          const notTracked = !enabled[s.key];
          const skipped = s.conditional && conditionalSkipped;
          const done = i < currentIndex;
          const current = i === currentIndex;
          const showBadge = s.key === 'READY_PATHOLOGIST' && openRequests.length > 0;
          return (
            <li key={s.key} aria-current={current ? 'step' : undefined}
                className={[
                  'caseView__rail-item',
                  current ? 'caseView__rail-item--current' : '',
                  notTracked || skipped ? 'caseView__rail-item--na' : '',
                  i > currentIndex ? 'caseView__rail-item--locked' : '',
                ].join(' ')}>
              {done && <CheckmarkFilled aria-label={t('caseView.a11y.complete', 'Complete')} />}
              <span>{t(s.i18n, s.label)}</span>
              {showBadge && (
                <Tag type={TAG_KIND.critical}
                  // The accessible label names what is pending, not just a number.
                  title={openRequests.map((r) => r.value).join('; ')}>
                  {t('pathology.badge.openRequests', '{n} open requests').replace('{n}', openRequests.length)}
                </Tag>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function CaseSummary({ stage, cassettes, embedded, outstanding, slides, stained, openRequests, consultations, critical, reports }) {
  const row = (k, v) => (
    <div className="caseView__summary-row" key={k}>
      <span className="cds--type-helper-text-01">{k}</span><span>{v}</span>
    </div>
  );
  return (
    <Tile className="caseView__summary">
      <h4>{t('caseView.label.caseSummary', 'Case summary')}</h4>
      {row(t('caseView.label.stage', 'Stage'), <Tag type={TAG_KIND.inProgress}>{t(stage.i18n, stage.label)}</Tag>)}
      {row(t('pathology.label.cassettes', 'Cassettes'), cassettes)}
      {row(t('pathology.label.blocksEmbedded', 'Blocks embedded'), `${embedded} / ${cassettes}`)}
      {outstanding.length > 0 && row(t('caseView.label.outstanding', 'Outstanding'),
        <Tag type={TAG_KIND.partial}>{outstanding.map((b) => b.designation).join(', ')}</Tag>)}
      {row(t('pathology.label.slides', 'Slides'), slides.length)}
      {row(t('pathology.label.stained', 'Stained'), `${stained} / ${slides.length}`)}
      {row(t('pathology.label.openRequests', 'Open requests'),
        openRequests.length ? <Tag type={TAG_KIND.critical}>{openRequests.length}</Tag> : '—')}
      {row(t('pathology.label.secondOpinion', 'Second opinion'),
        consultations.some((c) => c.status === 'REQUESTED')
          ? <Tag type={TAG_KIND.pending}>{t('caseView.badge.awaiting', 'Awaiting')}</Tag> : '—')}
      {row(t('pathology.label.conclusion', 'Conclusion'),
        critical ? <Tag type={TAG_KIND.critical}>{t('pathology.badge.malignant', 'Malignant')}</Tag> : '—')}
      {row(t('pathology.label.report', 'Report'),
        reports.length ? `v${reports[0].versionNumber}` : t('caseView.badge.none', 'None'))}
    </Tile>
  );
}

// ===========================================================================
// Pathology sections. Abbreviated where the pattern is already established above —
// the full field lists are in the FRS, and the preview shows the populated state.
// ===========================================================================

function CaseInformation({ caseData }) {
  const rows = [
    [t('pathology.label.labNumber', 'Lab number'), caseData.labNumber],
    [t('pathology.label.requestDate', 'Request date'), caseData.requestDate],
    [t('pathology.label.arrivalDate', 'Specimen arrival date'), caseData.arrivalDate],
    [t('pathology.label.specimen', 'Specimen'), caseData.specimen],
    [t('pathology.label.specimenType', 'Specimen type'), caseData.specimenType],
    [t('pathology.label.procedure', 'Procedure performed'), caseData.procedure],
    [t('pathology.label.provider', 'Referring provider'), caseData.provider],
    [t('pathology.label.facility', 'Referring facility'), caseData.facility],
    [t('pathology.label.ward', 'Ward / dept / unit'), caseData.ward],
    [t('pathology.label.provisional', 'Provisional diagnosis'), caseData.provisionalDiagnosis],
    [t('pathology.label.priorSurgery', 'Previous surgery / treatment'), caseData.priorSurgery],
    [t('pathology.label.pathologist', 'Assigned pathologist'), caseData.pathologist],
  ];
  return (
    <Stack gap={3}>
      {rows.map(([k, v]) => (
        <div className="caseView__field-row" key={k}>
          <span className="cds--type-helper-text-01">{k}</span>
          {/* Unavailable fields render an em dash and a hint. No invented fields. (FR-1) */}
          <span>{v || <span className="cds--type-helper-text-01">— {t('caseView.label.notRecorded', 'not recorded')}</span>}</span>
        </div>
      ))}
      <div>
        <span className="cds--type-helper-text-01">{t('pathology.label.clinicalHistory', 'Clinical history')}</span>
        <p>{caseData.clinicalHistory}</p>
      </div>
    </Stack>
  );
}

function CassetteTable({ blocks, tissueDictionary, onPrint }) {
  const headers = [
    { key: 'designation', header: t('pathology.label.blockDesignation', 'Designation') },
    { key: 'barcode', header: t('pathology.label.barcode', 'Barcode') },
    { key: 'tissueType', header: t('pathology.label.tissueType', 'Tissue type') },
    { key: 'cassetteState', header: t('pathology.label.state', 'State') },
  ];
  return (
    <DataTable rows={blocks.map((b) => ({ ...b, id: String(b.id) }))} headers={headers}>
      {({ rows, headers: hs, getHeaderProps, getRowProps, getTableProps }) => (
        <TableContainer title={t('pathology.label.cassettes', 'Cassettes')}
          description={t('pathology.helper.barcodeAtGrossing',
            'Barcodes are assigned here, where the label is physically applied.')}>
          <TableToolbar>
            <TableToolbarContent>
              <Button kind="ghost" size="sm" renderIcon={Add}>
                {t('pathology.action.addCassette', 'Add cassette')}
              </Button>
              <Button kind="ghost" size="sm" renderIcon={Printer}>
                {/* Delegates to the shared barcodeWorkflow flow — OGC-284. Do not build a dialog. */}
                {t('pathology.action.printSelected', 'Print labels for selected')}
              </Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table {...getTableProps()} size="sm">
            <TableHead>
              <TableRow>
                {hs.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                <TableHeader />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const block = blocks.find((b) => String(b.id) === row.id);
                return (
                  <TableRow key={row.id} {...getRowProps({ row })}>
                    <TableCell>{block.designation}</TableCell>
                    <TableCell>{block.barcode}</TableCell>
                    <TableCell>
                      {/* Growing catalogue -> ComboBox, not a static Select. (D-007) */}
                      <ComboBox
                        id={`tissue-${block.id}`} size="sm"
                        items={tissueDictionary}
                        selectedItem={block.tissueType}
                        titleText=""
                        placeholder={t('pathology.placeholder.tissueType', 'Select tissue type')}
                      />
                    </TableCell>
                    <TableCell>
                      <Tag type={block.cassetteState === 'BLOCK' ? TAG_KIND.verified : TAG_KIND.pending}>
                        {block.cassetteState === 'BLOCK'
                          ? t('pathology.badge.block', 'Block')
                          : t('pathology.badge.cassette', 'Cassette')}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <Button kind="ghost" size="sm" renderIcon={Printer}
                        iconDescription={t('pathology.action.printLabel', 'Print label')}
                        hasIconOnly onClick={() => onPrint(block)} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

function EmbeddingTable({ blocks, onEmbed }) {
  return (
    <TableContainer title={t('pathology.section.embedding', 'Embedding')}>
      <Table size="sm">
        <TableHead>
          <TableRow>
            <TableHeader>{t('pathology.label.blockDesignation', 'Cassette')}</TableHeader>
            <TableHeader>{t('pathology.label.barcode', 'Barcode')}</TableHeader>
            <TableHeader>{t('pathology.label.tissueType', 'Tissue')}</TableHeader>
            <TableHeader>{t('pathology.label.storageLocation', 'Storage')}</TableHeader>
            <TableHeader>{t('pathology.label.embeddedBy', 'Embedded by')}</TableHeader>
            <TableHeader />
          </TableRow>
        </TableHead>
        <TableBody>
          {blocks.map((b) => (
            <TableRow key={b.id}>
              <TableCell>{b.designation}</TableCell>
              <TableCell>{b.barcode}</TableCell>
              <TableCell>{b.tissueType}</TableCell>
              <TableCell>
                {/* Reuses the shared sample Storage model + LocationPickerModal (D-035),
                    not the free-text `location` column the table carries today. */}
                {b.storage || <span className="cds--type-helper-text-01">—</span>}
              </TableCell>
              <TableCell>
                {b.embeddedBy
                  ? <>{b.embeddedBy}<br /><span className="cds--type-helper-text-01">{b.embeddedAt}</span></>
                  : <Tag type={TAG_KIND.pending}>{t('pathology.badge.notEmbedded', 'Not embedded')}</Tag>}
              </TableCell>
              <TableCell>
                {b.cassetteState === 'CASSETTE' && (
                  <Button kind="primary" size="sm" onClick={() => onEmbed(b.id)}>
                    {t('pathology.action.embed', 'Embed')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// FR-7.3 — the highest-value control on the screen. 52% of all mislabelling happens at
// this transition. The label is printed and verified BEFORE the section is cut.
function ScanVerification({ scan, setScan, match, mismatch }) {
  return (
    <Tile className="pathology__scan-verification">
      <h5>{t('pathology.label.scanVerification', 'Scan verification before sectioning')}</h5>
      <p className="cds--type-helper-text-01">
        {t('pathology.helper.scanVerification',
          'Scan the block, print its slide label, then scan the printed label back before cutting.')}
      </p>
      <Stack orientation="horizontal" gap={5}>
        <TextInput id="scanBlock" size="sm"
          labelText={t('pathology.label.scanBlock', 'Block barcode')}
          value={scan.block} onChange={(e) => setScan((s) => ({ ...s, block: e.target.value }))} />
        <TextInput id="scanSlide" size="sm"
          labelText={t('pathology.label.scanSlideLabel', 'Printed slide label')}
          value={scan.slide} onChange={(e) => setScan((s) => ({ ...s, slide: e.target.value }))} />
      </Stack>
      {match && (
        <InlineNotification kind="success" lowContrast hideCloseButton
          title={t('pathology.banner.labelMatch', 'Match confirmed')}
          subtitle={t('pathology.banner.labelMatchDetail',
            'The slide row may be committed. Verification time and operator are recorded.')} />
      )}
      {mismatch && (
        // role="alert" is applied by Carbon for error notifications; the mismatch is audited.
        <InlineNotification kind="error" lowContrast hideCloseButton
          title={t('pathology.banner.labelMismatchTitle', 'Label does not match block')}
          subtitle={t('pathology.banner.labelMismatch',
            'Scanned slide label {slideBarcode} does not match block {blockBarcode}. The slide was not created.')
            .replace('{slideBarcode}', scan.slide).replace('{blockBarcode}', scan.block)} />
      )}
    </Tile>
  );
}

// Nested block -> slides. Inline expansion, inline add. No modal. (FR-7.1, D-005, D-011)
function MicrotomyTable({ blocks, slides, expandedBlockId, onToggleBlock, stainDictionary, onDeactivate, onPrint }) {
  return (
    <TableContainer title={t('pathology.section.microtomy', 'Microtomy')}
      description={t('pathology.helper.blockByBlock', 'Blocks expand to the slides cut from them.')}>
      <Table size="sm">
        <TableHead>
          <TableRow>
            <TableHeader>{t('pathology.label.blockSlide', 'Block / slide')}</TableHeader>
            <TableHeader>{t('pathology.label.barcode', 'Barcode')}</TableHeader>
            <TableHeader>{t('pathology.label.level', 'Level')}</TableHeader>
            <TableHeader>{t('pathology.label.stain', 'Stain')}</TableHeader>
            <TableHeader>{t('pathology.label.labelVerified', 'Label')}</TableHeader>
            <TableHeader />
          </TableRow>
        </TableHead>
        <TableBody>
          {blocks.map((b) => {
            const childSlides = slides.filter((s) => s.blockId === b.id);
            const expanded = expandedBlockId === b.id;
            return (
              <React.Fragment key={b.id}>
                <TableRow className="pathology__block-row">
                  <TableCell>
                    <Button kind="ghost" size="sm" onClick={() => onToggleBlock(b.id)}
                      aria-expanded={expanded}>
                      {b.designation}
                    </Button>
                  </TableCell>
                  <TableCell>{b.barcode}</TableCell>
                  <TableCell colSpan={2}>{b.tissueType}</TableCell>
                  <TableCell colSpan={2}>
                    <span className="cds--type-helper-text-01">
                      {t('pathology.badge.slides', '{n} slides').replace('{n}', childSlides.length)}
                    </span>
                    <Button kind="ghost" size="sm" renderIcon={Add}>
                      {t('pathology.action.addSlide', 'Add slide')}
                    </Button>
                  </TableCell>
                </TableRow>
                {expanded && childSlides.map((s) => (
                  <TableRow key={s.id} className={s.active ? '' : 'pathology__slide-row--deactivated'}>
                    <TableCell className="pathology__slide-cell">{s.designation}</TableCell>
                    <TableCell>{s.barcode}</TableCell>
                    <TableCell>{s.level}</TableCell>
                    <TableCell>
                      <ComboBox id={`stain-${s.id}`} size="sm" items={stainDictionary}
                        selectedItem={s.stain} titleText=""
                        placeholder={t('pathology.placeholder.stain', 'Select stain')} />
                    </TableCell>
                    <TableCell>
                      {!s.active
                        ? <Tag type={TAG_KIND.none}>{t('caseView.badge.deactivated', 'Deactivated')}</Tag>
                        : s.labelVerifiedAt
                          ? <Tag type={TAG_KIND.verified}>{t('pathology.badge.verified', 'Verified')}</Tag>
                          : <Tag type={TAG_KIND.none}>{t('pathology.badge.unverified', 'Unverified')}</Tag>}
                    </TableCell>
                    <TableCell>
                      {s.active && (
                        <Stack orientation="horizontal" gap={2}>
                          <Button kind="ghost" size="sm" hasIconOnly renderIcon={Printer}
                            iconDescription={t('pathology.action.printLabel', 'Print label')}
                            onClick={() => onPrint(s)} />
                          {/* Deactivate, never delete. (S-10.4) */}
                          <Button kind="ghost" size="sm" onClick={() => onDeactivate(s)}>
                            {t('caseView.action.deactivate', 'Deactivate')}
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function StainingTable({ slides, blocks, stainDictionary, onBatch }) {
  const headers = [
    { key: 'designation', header: t('pathology.label.slideDesignation', 'Slide') },
    { key: 'block', header: t('pathology.label.blockDesignation', 'Block') },
    { key: 'stain', header: t('pathology.label.stain', 'Stain') },
    { key: 'stainStatus', header: t('caseView.label.status', 'Status') },
  ];
  const rows = slides.map((s) => ({
    ...s, id: String(s.id),
    block: blocks.find((b) => b.id === s.blockId)?.designation ?? '—',
  }));
  return (
    <DataTable rows={rows} headers={headers}>
      {({ rows: rs, headers: hs, getHeaderProps, getRowProps, getSelectionProps, getBatchActionProps, selectedRows, getTableProps }) => (
        <TableContainer title={t('pathology.section.staining', 'Staining')}>
          <TableToolbar>
            <TableBatchActions {...getBatchActionProps()}>
              <TableBatchAction onClick={() => onBatch(selectedRows.map((r) => rows.find((x) => x.id === r.id)))}>
                {t('pathology.action.applyStain', 'Apply stain to selected')}
              </TableBatchAction>
            </TableBatchActions>
            <TableToolbarContent />
          </TableToolbar>
          <Table {...getTableProps()} size="sm">
            <TableHead>
              <TableRow>
                <TableSelectAll {...getSelectionProps()} />
                {hs.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                <TableHeader />
              </TableRow>
            </TableHead>
            <TableBody>
              {rs.map((row) => {
                const s = rows.find((x) => x.id === row.id);
                return (
                  <TableRow key={row.id} {...getRowProps({ row })}>
                    <TableSelectRow {...getSelectionProps({ row })} />
                    <TableCell>{s.designation}</TableCell>
                    <TableCell>{s.block}</TableCell>
                    <TableCell>
                      <ComboBox id={`stain-sec-${s.id}`} size="sm" items={stainDictionary}
                        selectedItem={s.stain} titleText="" />
                    </TableCell>
                    <TableCell><Tag type={TAG_KIND[s.stainStatus] ?? TAG_KIND.none}>{s.stainStatus}</Tag></TableCell>
                    <TableCell>
                      {s.stainStatus !== 'complete' && (
                        <Button kind="ghost" size="sm">{t('pathology.action.markStained', 'Mark stained')}</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

function CoverslippingTable({ slides }) {
  return (
    <TableContainer title={t('pathology.section.coverslipping', 'Coverslipping & QC')}
      description={t('pathology.helper.stageConfigurable',
        'This stage can be switched off per deployment; when off it renders n/a rather than disappearing.')}>
      <Table size="sm">
        <TableHead>
          <TableRow>
            <TableHeader>{t('pathology.label.slideDesignation', 'Slide')}</TableHeader>
            <TableHeader>{t('pathology.label.stain', 'Stain')}</TableHeader>
            <TableHeader>{t('pathology.label.qc', 'Coverslip / QC')}</TableHeader>
            <TableHeader />
          </TableRow>
        </TableHead>
        <TableBody>
          {slides.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.designation}</TableCell>
              <TableCell>{s.stain}</TableCell>
              <TableCell>
                {s.coverslipQc === 'pass'
                  ? <Tag type={TAG_KIND.verified}>{t('pathology.badge.qcPassed', 'Pass')}</Tag>
                  : <Tag type={TAG_KIND.none}>{t('pathology.badge.qcAwaiting', 'Awaiting')}</Tag>}
              </TableCell>
              <TableCell>
                {s.coverslipQc !== 'pass' && (
                  <Stack orientation="horizontal" gap={2}>
                    <Button kind="ghost" size="sm">{t('pathology.action.qcPass', 'Pass')}</Button>
                    <Button kind="ghost" size="sm">{t('pathology.action.qcFail', 'Fail')}</Button>
                  </Stack>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function PathologistAssignment({ caseData }) {
  return (
    <Stack gap={4}>
      {/* Typeahead over users holding the Histopathology bundle — not a hardcoded name list. */}
      <ComboBox
        id="assignedPathologist"
        titleText={t('pathology.label.pathologist', 'Assigned pathologist')}
        helperText={t('pathology.helper.pathologistSource', 'Users holding the Histopathology role bundle')}
        items={['Samini, Privashi', 'Chen, Wei', 'Mboule, A.']}
        selectedItem={caseData.pathologist}
      />
      <TextArea id="reviewNotes" rows={3}
        labelText={t('pathology.label.reviewNotes', 'Review notes')}
        helperText={t('pathology.helper.macroSupported', 'Supports macro codes (Macro Library, OGC-788)')} />
    </Stack>
  );
}

// FR-10 — the EXISTING pathology_request table. New requests are an inline row at the top
// of this table, and the target picker is FILTERED BY KIND. (FR-10.2, FR-10.4)
function RequestsTable({ requests, blocks, slides, newRequestOpen, onToggleNew, onRaise, onComplete, onRevert }) {
  const [kind, setKind] = useState('SLIDE');
  const [target, setTarget] = useState(null);
  const [stain, setStain] = useState(null);
  const [priority, setPriority] = useState('NORMAL');
  const [instruction, setInstruction] = useState('');

  // Filtered by kind: blocks for a slide request, slides for a stain request. Never one
  // flat list of everything on the case.
  const targetItems = kind === 'SLIDE'
    ? blocks.map((b) => ({ id: b.id, label: `${t('pathology.label.blockDesignation', 'Block')} ${b.designation} — ${b.tissueType}` }))
    : kind === 'STAIN'
      ? slides.map((s) => ({ id: s.id, label: `${t('pathology.label.slideDesignation', 'Slide')} ${s.designation} — ${s.stain}` }))
      : [];

  const describeTarget = (r) => {
    if (r.targetBlockId) return `${t('pathology.label.blockDesignation', 'Block')} ${blocks.find((b) => b.id === r.targetBlockId)?.designation ?? '—'}`;
    if (r.targetSlideId) return `${t('pathology.label.slideDesignation', 'Slide')} ${slides.find((s) => s.id === r.targetSlideId)?.designation ?? '—'}`;
    return '—';
  };

  return (
    <TableContainer title={t('pathology.label.benchRequests', 'Bench requests')}>
      <TableToolbar>
        <TableToolbarContent>
          <Button kind="secondary" size="sm" renderIcon={Add} onClick={onToggleNew}>
            {newRequestOpen
              ? t('caseView.action.cancel', 'Cancel')
              : t('pathology.action.requestWork', 'New request')}
          </Button>
        </TableToolbarContent>
      </TableToolbar>
      <Table size="sm">
        <TableHead>
          <TableRow>
            <TableHeader>{t('caseView.label.raised', 'Raised')}</TableHeader>
            <TableHeader>{t('caseView.label.by', 'By')}</TableHeader>
            <TableHeader>{t('pathology.label.requestKind', 'Type')}</TableHeader>
            <TableHeader>{t('pathology.label.requestTarget', 'Target')}</TableHeader>
            <TableHeader>{t('pathology.label.requestInstruction', 'Instruction')}</TableHeader>
            <TableHeader>{t('pathology.label.priority', 'Priority')}</TableHeader>
            <TableHeader>{t('caseView.label.status', 'Status')}</TableHeader>
            <TableHeader />
          </TableRow>
        </TableHead>
        <TableBody>
          {newRequestOpen && (
            <TableRow className="pathology__inline-new">
              <TableCell colSpan={8}>
                <Stack gap={4}>
                  <Stack orientation="horizontal" gap={5}>
                    <RadioButtonGroup name="requestKind" legendText={t('pathology.label.requestKind', 'Request type')}
                      valueSelected={kind} onChange={(v) => { setKind(v); setTarget(null); }}>
                      <RadioButton labelText={t('pathology.label.additionalBlock', 'Additional block')} value="BLOCK" id="rk-block" />
                      <RadioButton labelText={t('pathology.label.additionalSlide', 'Additional slide')} value="SLIDE" id="rk-slide" />
                      <RadioButton labelText={t('pathology.label.additionalStain', 'Additional stain')} value="STAIN" id="rk-stain" />
                    </RadioButtonGroup>
                    {kind !== 'BLOCK' && (
                      <ComboBox id="requestTarget"
                        titleText={t('pathology.label.requestTarget', 'Target')}
                        helperText={t('pathology.helper.targetFiltered', 'Filtered by request type')}
                        items={targetItems} itemToString={(i) => i?.label ?? ''}
                        selectedItem={target} onChange={({ selectedItem }) => setTarget(selectedItem)} />
                    )}
                    {/* Stain appears ONLY for a STAIN request. (FR-10.5) */}
                    {kind === 'STAIN' && (
                      <ComboBox id="requestStain" titleText={t('pathology.label.stain', 'Stain')}
                        items={STAIN_DICTIONARY} selectedItem={stain}
                        onChange={({ selectedItem }) => setStain(selectedItem)} />
                    )}
                    <Select id="requestPriority" labelText={t('pathology.label.priority', 'Priority')}
                      value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <SelectItem value="NORMAL" text={t('pathology.priority.normal', 'Normal')} />
                      <SelectItem value="URGENT" text={t('pathology.priority.urgent', 'Urgent')} />
                      <SelectItem value="STAT" text={t('pathology.priority.stat', 'STAT')} />
                    </Select>
                  </Stack>
                  <TextArea id="requestInstruction" rows={2} required
                    labelText={t('pathology.label.requestInstruction', 'Instruction')}
                    helperText={t('pathology.helper.instructionRequired',
                      'Required — the instruction is the point of the request')}
                    placeholder={t('pathology.placeholder.instruction',
                      'e.g. deeper sections at 3 µm rather than 5 µm')}
                    value={instruction} onChange={(e) => setInstruction(e.target.value)} />
                  <Stack orientation="horizontal" gap={3}>
                    <Button kind="primary" size="sm" disabled={!instruction.trim()}
                      onClick={() => onRaise({
                        requestKind: kind, priority, value: instruction,
                        targetBlockId: kind === 'SLIDE' ? target?.id ?? null : null,
                        targetSlideId: kind === 'STAIN' ? target?.id ?? null : null,
                        requestedBy: 'current user', requestedDate: 'server-clock',
                      })}>
                      {t('pathology.action.raiseRequest', 'Raise request')}
                    </Button>
                    <Button kind="ghost" size="sm" onClick={onToggleNew}>
                      {t('caseView.action.cancel', 'Cancel')}
                    </Button>
                  </Stack>
                </Stack>
              </TableCell>
            </TableRow>
          )}
          {requests.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.requestedDate}</TableCell>
              <TableCell>{r.requestedBy}</TableCell>
              <TableCell>
                <Tag type={r.requestKind === 'BLOCK' ? TAG_KIND.pending : r.requestKind === 'SLIDE' ? TAG_KIND.inProgress : TAG_KIND.verified}>
                  {r.requestKind}
                </Tag>
              </TableCell>
              <TableCell>{describeTarget(r)}</TableCell>
              <TableCell>{r.value}</TableCell>
              <TableCell>
                <Tag type={r.priority === 'NORMAL' ? TAG_KIND.none : TAG_KIND.critical}>{r.priority}</Tag>
              </TableCell>
              <TableCell>
                <Tag type={r.status === 'OPENED' ? TAG_KIND.pending : TAG_KIND.complete}>{r.status}</Tag>
              </TableCell>
              <TableCell>
                {r.status === 'OPENED'
                  ? <Button kind="ghost" size="sm" onClick={() => onComplete(r)}>{t('caseView.action.complete', 'Complete')}</Button>
                  : <Button kind="ghost" size="sm" renderIcon={Renew} onClick={() => onRevert(r)}>{t('caseView.action.revert', 'Revert')}</Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// FR-11 — the outcome is a QUERYABLE FIELD, not a comment, because CAP/ADASP guidance
// requires review results to be monitored continuously.
function ConsultationPanel({ consultations }) {
  const c = consultations[0];
  return (
    <Tile>
      <h5>{t('pathology.label.secondOpinion', 'Second opinion')}</h5>
      {c ? (
        <Stack gap={3}>
          <div className="caseView__field-row">
            <span className="cds--type-helper-text-01">{t('pathology.label.consultedPathologist', 'Consulting pathologist')}</span>
            <span>{c.consultedUser}</span>
          </div>
          <div className="caseView__field-row">
            <span className="cds--type-helper-text-01">{t('caseView.label.reason', 'Reason')}</span>
            <span>{c.reason}</span>
          </div>
          <div className="caseView__field-row">
            <span className="cds--type-helper-text-01">{t('pathology.label.preTreatment', 'Requested before treatment')}</span>
            <span>{c.preTreatment ? t('caseView.label.yes', 'Yes') : t('caseView.label.no', 'No')}</span>
          </div>
          <div className="caseView__field-row">
            <span className="cds--type-helper-text-01">{t('pathology.label.consultationOutcome', 'Outcome')}</span>
            <span>
              {c.outcome
                ? <Tag type={c.outcome === 'AGREE' ? TAG_KIND.complete : TAG_KIND.partial}>{c.outcome}</Tag>
                : <Tag type={TAG_KIND.pending}>{t('caseView.badge.awaiting', 'Awaiting response')}</Tag>}
            </span>
          </div>
        </Stack>
      ) : (
        <p>{t('pathology.empty.noConsultation', 'No second opinion requested on this case.')}</p>
      )}
      <Button kind="secondary" size="sm">
        {t('pathology.action.requestConsultation', 'Request second opinion')}
      </Button>
      <p className="cds--type-helper-text-01">
        {t('pathology.helper.consultationRules',
          'Review triggers are configurable rules and never block sign-out.')}
      </p>
    </Tile>
  );
}

function FindingsSection({ caseData, setCaseData, setDirty, conclusions, techniques, critical }) {
  return (
    <Stack gap={6}>
      {critical && (
        // Carbon applies role="alert" to error/warning notifications. (FR-14.2)
        <InlineNotification kind="warning" lowContrast hideCloseButton
          title={t('pathology.banner.criticalResultTitle', 'Critical result')}
          subtitle={t('pathology.banner.criticalResult',
            'This conclusion requires critical-result acknowledgment by the ordering clinician. The case will be flagged in the Alerts Dashboard on sign-out.')} />
      )}
      {/* Persists to the EXISTING grossExam / microscopyExam columns. There is deliberately
          no second gross-description field on this screen. (FR-12.3) */}
      <TextArea id="findingsGross" rows={4}
        labelText={t('pathology.label.grossExam', 'Macroscopic description')}
        helperText={t('pathology.helper.macroSupported', 'Supports macro codes (Macro Library, OGC-788)')}
        value={caseData.grossExam}
        onChange={(e) => { setCaseData((c) => ({ ...c, grossExam: e.target.value })); setDirty(true); }} />
      <TextArea id="findingsMicro" rows={6}
        labelText={t('pathology.label.microscopyExam', 'Microscopic description')}
        helperText={t('pathology.helper.macroSupported', 'Supports macro codes (Macro Library, OGC-788)')}
        value={caseData.microscopyExam}
        onChange={(e) => { setCaseData((c) => ({ ...c, microscopyExam: e.target.value })); setDirty(true); }} />

      {/* Existing PathologyTechnique entity. Selections are labelled chips, never a count. */}
      <FilterableMultiSelect
        id="techniques"
        titleText={t('pathology.label.techniques', 'Techniques used')}
        items={techniques}
        initialSelectedItems={techniques}
        itemToString={(i) => (i ? `${i.shortCode} — ${i.fullName}` : '')}
      />

      {/* Coded conclusions are pathology_conclusion rows with type = DICTIONARY.
          No new diagnosis table. Which code system the dictionary carries is deployment
          configuration. (FR-13.1, FR-13.3) */}
      <FilterableMultiSelect
        id="codedConclusion"
        titleText={t('pathology.label.codedConclusion', 'Coded conclusion')}
        helperText={t('pathology.helper.conclusionSearch', 'Searchable by name or code')}
        items={conclusions}
        initialSelectedItems={conclusions}
        itemToString={(i) => (i ? `${i.code} ${i.value}` : '')}
      />

      <TextArea id="narrativeConclusion" rows={3}
        labelText={t('pathology.label.conclusion', 'Narrative conclusion')} />

      <Checkbox id="referIhc"
        labelText={t('pathology.label.referIhc', 'Refer to Immunohistochemistry')}
        helperText={t('pathology.helper.ihcReferral',
          'Creates the linked IHC case using the existing relationship. Does not block sign-out.')} />
    </Stack>
  );
}

// FR-15 — one click opens the report in a new tab. No per-row View/Download/Print/Email.
// The tab's own PDF viewer does all of that. (D-054)
function ReportsSection({ reports, canGenerate }) {
  const openReport = (r) => window.open(`/rest/pathology/report/${r.id}`, '_blank', 'noopener');
  return (
    <Stack gap={5}>
      <Stack orientation="horizontal" gap={3}>
        <Button kind="primary" size="sm"
          disabled={!canGenerate}
          // The tooltip states the ACTUAL condition the code tests. (FR-15.4)
          title={canGenerate ? '' : t('pathology.tooltip.generateBlocked',
            'Enter the macroscopic and microscopic descriptions and at least one conclusion')}
          onClick={() => window.open('/rest/pathology/report/generate', '_blank', 'noopener')}>
          {t('pathology.action.generateReport', 'Generate report')}
        </Button>
        <Button kind="secondary" size="sm">
          {t('pathology.action.uploadReport', 'Upload report')}
        </Button>
      </Stack>
      {reports.length === 0 ? (
        <p>{t('pathology.empty.noReports',
          'No reports yet. Complete the findings and conclusion to generate one.')}</p>
      ) : (
        <TableContainer title={t('pathology.section.reports', 'Reports')}
          description={t('pathology.helper.reportOpensNewTab',
            'Selecting a report opens it in a new tab, where download, print and email are available.')}>
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
                <TableRow key={r.id} onClick={() => openReport(r)} style={{ cursor: 'pointer' }}
                  title={t('pathology.tooltip.openReport', 'Open report v{v} in a new tab').replace('{v}', r.versionNumber)}>
                  <TableCell>v{r.versionNumber}</TableCell>
                  <TableCell>{r.generatedDate}</TableCell>
                  <TableCell>{r.generatedBy}</TableCell>
                  <TableCell>
                    <Tag type={r.reportType === 'FINAL' ? TAG_KIND.complete : TAG_KIND.inProgress}>
                      {r.reportType}
                    </Tag>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

function StageEventDetail({ event, blocks }) {
  if (!event) return <SkeletonText />;
  const rows = [
    [t('pathology.label.runReference', 'Run reference'), event.runReference ?? '—'],
    [t('pathology.label.instrumentProgram', 'Instrument / program'), event.notes ?? '—'],
    [t('pathology.label.runWindow', 'Run start / end'), `${event.enteredAt} → ${event.completedAt ?? '—'}`],
    [t('pathology.label.cassettesInRun', 'Cassettes in this run'), blocks.map((b) => b.designation).join(', ')],
    // Operator and timestamps are display-only here — they came from the session and the
    // server clock, and nothing on this screen lets a user type them. (FR-2.4)
    [t('caseView.label.operator', 'Operator'), event.enteredBy],
  ];
  return (
    <Stack gap={3}>
      {rows.map(([k, v]) => (
        <div className="caseView__field-row" key={k}>
          <span className="cds--type-helper-text-01">{k}</span><span>{v}</span>
        </div>
      ))}
    </Stack>
  );
}

export default PathologyCaseView;
