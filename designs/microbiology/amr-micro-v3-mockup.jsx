// AMR Micro v3: Case view, worklist and Microbiology reference data (developer handoff mockup)
// Routes: /Microbiology/cases/:caseId · /Microbiology/worklist · Admin › Microbiology reference data (sections: AST panels, AST rules, Organisms, Antibiotics, Breakpoint standards)
// SideNav: Microbiology › Case / Worklist; Admin › Microbiology reference data › AST rules (new section beside AST panels)
// FRS: amr-micro-v3-frs.md (draft 0.21) · Build map: amr-micro-v3-build-map.md · Preview: amr-micro-v3-preview.html
//
// READ FIRST (Claude Code and developers): BUILD_MAP below lists every screen area as
//   built (on develop f72854e: keep it, change only the listed v3 items), v2 (build to the v2 FRS),
//   or v3 (new). Elements with className "anno", "new" or "new3" are design commentary and version
//   chips: never build them (the "Design notes" checkbox shows them). Mock data and the small
//   adapters (Sel, Inp, Area, Btn, Tag, Notice) are drawing aids, not code to copy.
import React, { useState, useEffect, useRef } from 'react';
import {
  Breadcrumb, BreadcrumbItem, Button, Checkbox, Modal, RadioButton,
  Select, SelectItem, SelectItemGroup, Table, TableBody, TableCell, TableHead, TableHeader,
  TableRow, Tag as CarbonTag, TextArea, TextInput,
} from '@carbon/react';
import { CheckmarkFilled, ErrorFilled, InformationFilled, Misuse, WarningAltFilled } from '@carbon/icons-react';

const PREVIEW_CSS = '\n  body { background:#f4f4f4; margin:0; font-family:\'IBM Plex Sans\', system-ui, sans-serif; }\n  .preview-banner { background:#0f62fe; color:#fff; padding:6px 1rem; font-size:12px; font-family:monospace; }\n  .shell { display:flex; min-height:calc(100vh - 28px); }\n  .side { width:240px; background:#fff; border-right:1px solid #e0e0e0; padding:1rem 0; flex-shrink:0; }\n  .side button { display:block; width:100%; text-align:left; padding:.6rem 1rem; border:0; background:none; font-size:14px; cursor:pointer; color:#161616; }\n  .side button.on { background:#e5f6ff; border-left:3px solid #0f62fe; font-weight:600; }\n  .side h6 { font-size:12px; color:#525252; padding:.5rem 1rem; margin:0; text-transform:uppercase; letter-spacing:.32px; }\n  .main { flex:1; padding:1rem 2rem 4rem; max-width:1200px; min-width:0; }\n  /* narrow screens (D-289): the page never scrolls sideways; a table wider than its section scrolls inside it */\n  .sec { overflow-x:auto; }\n  @media (max-width:1100px) { .side { width:200px; } .main { padding:1rem 1rem 4rem; } .hdr { gap:1rem; } }\n  .crumbs { font-size:12px; color:#525252; margin-bottom:.5rem; }\n  .crumbs a { color:#0f62fe; text-decoration:none; }\n  h1 { font-size:24px; font-weight:400; margin:.25rem 0 1rem; }\n  .sec { background:#fff; margin-bottom:1rem; border:1px solid #e0e0e0; }\n  .sec-h { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; border-bottom:1px solid #e0e0e0; cursor:pointer; }\n  .sec-h h3 { font-size:16px; font-weight:600; margin:0; display:flex; gap:.5rem; align-items:center; }\n  .sec-b { padding:1rem; }\n  .num { display:inline-flex; width:22px; height:22px; border-radius:50%; background:#e0e0e0; font-size:12px; align-items:center; justify-content:center; }\n  .new { font-size:11px; background:#d0e2ff; color:#0043ce; padding:1px 6px; border-radius:8px; font-weight:600; }\n  .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; }\n  .field label { display:block; font-size:12px; color:#525252; margin-bottom:4px; }\n  .field .req { color:#da1e28; margin-left:2px; }\n  .cds--btn--danger--ghost { color:#da1e28; background:transparent; }\n  .field .helper { font-size:12px; color:#525252; margin-top:4px; line-height:16px; }\n  .field .helper.warn { color:#8e6a00; }\n  .field input, .field select, .field textarea { width:100%; box-sizing:border-box; background:#f4f4f4; border:0; border-bottom:1px solid #8d8d8d; padding:8px; font-size:14px; font-family:inherit; }\n  .field.missing input, .field.missing select { border-bottom:2px solid #f1c21b; }\n  table.t { width:100%; border-collapse:collapse; font-size:14px; }\n  table.t th { text-align:left; background:#e0e0e0; padding:8px; font-weight:600; font-size:13px; }\n  table.t td { padding:8px; border-bottom:1px solid #e0e0e0; vertical-align:top; }\n  .cds--tag { white-space:nowrap; display:inline-block; margin:0 4px 4px 0; }\n  tr.sub td:first-child { padding-left:28px; }\n  tr.sub td { background:#fafafa; }\n  .row-actions { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.75rem; }\n  .muted { color:#6f6f6f; font-size:12px; }\n  .hdr { background:#fff; border:1px solid #e0e0e0; padding:1rem; margin-bottom:1rem; display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-start; }\n  .hdr div b { display:block; font-size:12px; color:#525252; font-weight:400; }\n  .incoming { border-left:4px solid #f1c21b; }\n  .note-box { background:#f2f4f8; padding:.75rem; font-size:13px; border-left:3px solid #8d8d8d; }\n  .inline-panel { background:#f4f4f4; padding:1rem; margin-top:.75rem; }\n  table.rt { table-layout:fixed; }\n  table.rt td { word-wrap:break-word; }\n  .seg { display:inline-flex; border:1px solid #8d8d8d; }\n  .seg button { background:#fff; border:0; border-right:1px solid #e0e0e0; padding:4px 12px; min-height:32px; font-size:14px; cursor:pointer; }\n  .seg button.on { background:#0f62fe; color:#fff; }\n  .menu { position:absolute; right:0; top:100%; z-index:5; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,.3); display:flex; flex-direction:column; min-width:190px; }\n  .menu button { background:#fff; border:0; text-align:left; padding:8px 12px; font-size:14px; cursor:pointer; }\n  .menu button:hover { background:#e8e8e8; }\n  .cds--btn { min-height:32px; padding:6px 14px; }\n  .cds--tag { margin:0 4px 0 0; }\n  .card-row { display:flex; gap:1rem; margin-bottom:1rem; flex-wrap:wrap; }\n  .card { background:#fff; border:1px solid #e0e0e0; padding:1rem; min-width:150px; cursor:pointer; }\n  .card.on { border:2px solid #0f62fe; }\n  .card .n { font-size:28px; }\n  .ref { border-left:4px solid #8a3ffc; }\n  /* Worklist filter chips and toast (same look as the Results worklist) */\n  .subtitle { color:#525252; font-size:14px; margin-bottom:1rem; }\n  .chips { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:1rem; }\n  .chip { border:1px solid #8d8d8d; background:#fff; border-radius:16px; padding:4px 12px; font-size:13px; cursor:pointer; display:inline-flex; gap:6px; align-items:center; }\n  .chip.on { background:#e0e0e0; border-color:#161616; font-weight:600; }\n  .chip .count { background:#161616; color:#fff; border-radius:10px; padding:0 7px; font-size:11px; }\n  .chip .count.red { background:#da1e28; }\n  .chip .count.blue { background:#0043ce; }\n  .runlist { background:#fff; border:1px solid #e0e0e0; padding:8px 0; margin-bottom:1rem; }\n  .runlist-row { display:grid; grid-template-columns:120px 90px 1fr 90px 110px 100px; gap:8px; padding:8px 16px; font-size:13px; align-items:center; cursor:pointer; }\n  .runlist-row:hover { background:#f4f4f4; }\n  .runlist-head { font-weight:600; color:#525252; font-size:12px; cursor:default; }\n  .header-stack { margin-bottom:1rem; border:1px solid #e0e0e0; }\n  .tile { background:#fff; padding:1rem; border-bottom:1px solid #e0e0e0; }\n  .tile h4 { font-size:14px; font-weight:600; margin:0 0 8px; letter-spacing:.16px; }\n  .kv { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:8px 24px; font-size:13px; }\n  .kv .k { color:#525252; font-size:12px; }\n  .verdict-row { display:grid; gap:12px; align-items:center; padding:8px 0; border-top:1px solid #e0e0e0; font-size:13px; }\n  .icon-btn { background:none; border:none; cursor:pointer; font-size:14px; color:#0f62fe; padding:0; }\n  .tag-batched { background:#e8daff; color:#6929c4; }\n  .expand { background:#f4f4f4; padding:1rem; border-top:1px solid #e0e0e0; }\n  .expand .zone { background:#fff; padding:12px; border:1px solid #e0e0e0; }\n  .zone-title { font-size:12px; font-weight:600; color:#525252; margin-bottom:8px; }\n  .toast { position:fixed; right:1.5rem; bottom:1.5rem; z-index:10; min-width:320px; }\n  .mono { font-family:\'IBM Plex Mono\', monospace; font-size:13px; }\n  .progress { font-size:13px; color:#525252; display:inline-flex; gap:8px; align-items:center; }\n  .sel { width:16px; height:16px; }\n  .dim { color:#6f6f6f; }\n  .sheet-paper { background:#fff; width:794px; padding:28px 32px; box-shadow:0 1px 6px rgba(0,0,0,.25); color:#161616; }\n  .sheet-t { width:100%; border-collapse:collapse; font-size:13px; }\n  .sheet-t th { text-align:left; border-bottom:1.5px solid #161616; padding:4px; font-size:12px; }\n  .sheet-t td { border-bottom:1px solid #c6c6c6; padding:7px 4px; vertical-align:top; }\n  .sheet-t tr.grp td { background:#e0e0e0; font-weight:600; }\n  @media print { body * { visibility:hidden; } .sheet-paper, .sheet-paper * { visibility:visible; } .sheet-paper { position:absolute; left:0; top:0; box-shadow:none; width:auto; } .no-print { display:none; } @page { size:A4 portrait; margin:12mm; } }\n  .new3 { font-size:11px; background:#defbe6; color:#0e6027; padding:1px 6px; border-radius:8px; font-weight:600; }\n  .sugg { background:#e8f8f6; border-left:4px solid #007d79; padding:.75rem; margin-bottom:.75rem; }\n  .sugg-row { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; padding:6px 0; border-top:1px solid #9ef0f0; }\n  .sugg-row:first-of-type { border-top:0; }\n  tr.ct-head td { background:#edf5ff; border-bottom:1px solid #a6c8ff; }\n  .modal-bg { position:fixed; inset:0; background:rgba(22,22,22,.5); z-index:20; display:flex; align-items:center; justify-content:center; }\n  .modal { background:#fff; width:520px; max-width:92vw; box-shadow:0 4px 16px rgba(0,0,0,.4); }\n  .modal h3 { font-size:20px; font-weight:400; margin:0; padding:1rem 1rem .5rem; }\n  .modal .mb { padding:0 1rem 1rem; font-size:14px; }\n  .modal .mf { display:flex; }\n  .modal .mf button { flex:1; min-height:56px; border:0; font-size:14px; cursor:pointer; text-align:left; padding:0 1rem; }\n  .cond { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin:4px 0; }\n  .legend { font-size:12px; color:#525252; margin-top:2rem; padding-top:1rem; border-top:1px solid #e0e0e0; }\n  /* design notes layer (D-282) */\n  body:not(.notes-on) .anno, body:not(.notes-on) .new, body:not(.notes-on) .new3 { display:none !important; }\n  body.notes-on [data-build="built"] { outline:2px dashed #8d8d8d; outline-offset:2px; }\n  body.notes-on [data-build="v2"] { outline:2px dashed #0f62fe; outline-offset:2px; }\n  body.notes-on [data-build="v3"] { outline:2px solid #24a148; outline-offset:2px; }\n  .build-strip { font-size:12px; padding:.5rem 1rem; background:#f4f4f4; border-bottom:1px solid #e0e0e0; color:#393939; }\n  .build-strip b { font-weight:600; }\n  .anno.note-box { border-left-color:#8d8d8d; }\n  .legend-b { font-size:12px; margin:.5rem 0 0; color:#393939; }\n  .legend-b span { display:inline-block; width:12px; height:12px; margin-right:6px; vertical-align:-2px; }\n  /* product notices: Carbon inline notification look (D-282) */\n  .notice { display:flex; gap:.5rem; align-items:flex-start; padding:.75rem 1rem; font-size:14px; border-left:3px solid; }\n  .notice.info { background:#edf5ff; border-color:#0043ce; }\n  .notice.warning { background:#fcf4d6; border-color:#f1c21b; }\n  .notice.success { background:#defbe6; border-color:#24a148; }\n  .notice svg { flex:none; margin-top:2px; }\n  /* sticky case bar (D-281) */\n  .casebar { position:sticky; top:0; z-index:6; background:#fff; border:1px solid #e0e0e0; padding:.5rem 1rem; margin-bottom:1rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap; box-shadow:0 2px 6px rgba(0,0,0,.08); }\n  .casebar .jump { display:flex; gap:.25rem; flex-wrap:wrap; font-size:12px; }\n  .casebar .jump a { color:#0f62fe; text-decoration:none; padding:2px 6px; }\n  .casebar .jump a:hover, .casebar .jump a:focus { text-decoration:underline; }\n  tr.expand > td { background:#f4f4f4; border-left:3px solid #0f62fe; padding:.5rem .75rem; }\n  tr.expand .inline-panel { margin:0; }\n  .chk { display:flex; gap:6px; align-items:flex-start; }\n';
const t = (key, fallback) => fallback || key;

// Build map (D-282): one entry per screen area. Read this before building anything from this preview.
const BUILD_DEV = 'f72854e';
const BUILD_MAP = [{"key": "header", "view": "case", "area": "Case header", "state": "built", "files": ["frontend/src/components/microbiology/MicrobiologyCaseView.jsx", "frontend/src/components/microbiology/MicrobiologyCaseState.js"], "keep": "Header card fields, Change lab unit, Log critical notification, Report NCE, Patient history.", "v3": ["Status tag (In progress, Partial, Final, Amended) worked out from releases, with Stage (getMicrobiologyCurrentStep) as its subtitle (D-277, D-281)", "Referral and amendment tags beside the status (D-Q6)", "STAT as a red tag beside the case number (D-281)", "Sticky case bar: case number, patient, status, STAT, section links, Release partial and Release final (D-281)"]}, {"key": "incoming", "view": "case", "area": "Incoming results", "state": "v2", "files": [], "keep": "Build to v2 FRS (A-12, FR-09.6, FR-09.7). Not on develop.", "v3": []}, {"key": "caseInfo", "view": "case", "area": "1 Case information", "state": "built", "files": ["frontend/src/components/microbiology/CaseInfoSummary.jsx", "frontend/src/components/microbiology/OrderDetailPanel.jsx"], "keep": "All fields and questionnaire. v2 changes per v2 FRS.", "v3": ["None. No Clinical context field (D-272)."]}, {"key": "initial", "view": "case", "area": "2 Initial testing", "state": "v2", "files": ["frontend/src/components/microbiology/MicrobiologyCaseView.jsx"], "keep": "Build to v2 FRS. Direct tests are ordinary tests released on their own.", "v3": []}, {"key": "referral", "view": "case", "area": "3 Referral point", "state": "built", "files": ["Clinical Order Entry v4 Refer out (ReferralStatusTag)"], "keep": "Refer out flow and referral status tags.", "v3": ["Open referrals drive the Referred and Referral returned tags in the header (D-Q6)"]}, {"key": "culture", "view": "case", "area": "4 Culture", "state": "built", "files": ["frontend/src/components/microbiology/CaseInoculationPanel.jsx", "frontend/src/components/microbiology/CultureSetSummary.jsx", "frontend/src/components/microbiology/CaseCultureTransitionPanel.jsx"], "keep": "Inoculation rows, Mark positive, readings, subcultures, extension, worklist batch inoculation. v2 fields per v2 FRS.", "v3": ["Rows grouped under their culture test (D-Q4)", "No Case role and no Culture checkbox; Inoculate adds the medium's culture test to the order (D-Q5)", "Inoculate button always visible, disabled until a medium is picked (D-280)", "Notes open under the culture or test row (D-284)"]}, {"key": "isolates", "view": "case", "area": "5 Isolates", "state": "built", "files": ["frontend/src/components/microbiology/IsolatePanel.jsx"], "keep": "Create, Identify, Re-identify, significance, labels, notes.", "v3": ["ID method lists Method dictionary entries flagged Used for microbiology identification (D-Q2)", "Notes open under the isolate row (D-284)"]}, {"key": "ast", "view": "case", "area": "6 AST / DST", "state": "built", "files": ["frontend/src/components/microbiology/AstEntryPanel.jsx", "frontend/src/components/microbiology/AstAttemptTable.jsx", "frontend/src/components/microbiology/ReagentLotPicker.jsx"], "keep": "Run setup, analyzer and manual entry, overrides with history, QC handling, validation, attempts, Use for reporting.", "v3": ["Suggested strip with Add and Dismiss (optional reason in the same click), computed not stored (R-04, D-278, D-290)", "Default panel label from panel targeting (R-01)", "Disk lot per antibiotic gives disk content (R-15)", "Qualifier dropdown in the existing Record reading form, which opens under the antibiotic row (D-Q7, D-279, D-284)", "Report column: tick per antibiotic; reason shown only when it is not the routine rule (D-276, D-284)", "Notes on each run, opening under the run row; rule notes land there while the rule condition is met and, like every note, cannot be removed (D-275, D-284, D-291)", "Expert rule source on readings (R-06)", "Reagents, QC & Controls section (ReagentsQcSection.tsx from Results Entry) on the run, with one control row per antibiotic and expected ranges from the packs (R-23, D-293)", "Molecular resistance table from any test result mapped to an antibiotic or class; method is the test's linked Method (D-Q3, D-285)"]}, {"key": "additional", "view": "case", "area": "7 Additional testing", "state": "v2", "files": [], "keep": "Build to v2 FRS.", "v3": []}, {"key": "critical", "view": "case", "area": "8 Critical communication", "state": "built", "files": ["frontend/src/components/microbiology/CriticalCommunicationPanel.jsx"], "keep": "Manual entries, acknowledgement and close as built.", "v3": ["Automatic rows from alert rules: method Email, automatic, linked alert, status Sent (no acknowledgement) or Not sent with reason (R-22, D-292, D-295)"]}, {"key": "nce", "view": "case", "area": "9 Nonconformance", "state": "built", "files": ["frontend/src/components/microbiology/CaseNonconformancePanel.jsx"], "keep": "Unchanged.", "v3": []}, {"key": "report", "view": "case", "area": "10 Report", "state": "built", "files": ["frontend/src/components/microbiology/ReportReadinessPanel.jsx"], "keep": "Readiness checklist, print preview, partial release. v2 per-result choice per v2 FRS.", "v3": ["AST shown as one summary line per isolate (D-276)", "Final release blocked list and confirmation (D-Q1)", "Checklist uses Carbon status icons with text (D-283)"]}, {"key": "amendment", "view": "case", "area": "11 Amendment", "state": "built", "files": ["frontend/src/components/microbiology/AmendmentHistoryPanel.jsx"], "keep": "Unchanged.", "v3": []}, {"key": "timeline", "view": "case", "area": "12 Timeline", "state": "built", "files": ["frontend/src/components/microbiology/CaseTimelinePanel.jsx"], "keep": "Existing activity list.", "v3": ["New activity types: suggestion added or dismissed, report tick changed, rule note removed, culture test added by inoculating (R-04, D-275, D-Q5)"]}, {"key": "wl", "view": "wl", "area": "Worklist", "state": "built", "files": ["frontend/src/components/microbiology/MicrobiologyWorklist.jsx"], "keep": "Chips, bench sheet, batch inoculate, Needs attention.", "v3": ["Status and tags under the lab number, one Status filter that also lists the tags (D-277, D-289)", "Needs attention also lists failed alert sends (R-22, D-295)", "Suggested count in Needs attention reasons (R-04)"]}, {"key": "wp", "view": "wp", "area": "Workplan", "state": "built", "files": ["frontend/src/components/workplan/Workplan.jsx"], "keep": "Existing workplan and print. v2 Microbiology bench type per v2 FRS.", "v3": []}, {"key": "adm", "view": "adm", "area": "Test catalog, media links, Methods", "state": "built", "files": ["Test catalog editor (test_reagent_link)", "Admin > Methods"], "keep": "Test editor, Reagents and media section. v2 media links per v2 FRS.", "v3": ["Methods: Used for microbiology identification checkbox (D-Q2)", "Catalog: no Case role (D-Q5)", "Alerts section (AlertsSection.jsx, AlertRuleModal.jsx, TestAlertRule): new trigger type Organism or resistance profile, validated results only (R-22, D-292)", "Coded result component: optional resistance mapping to an antibiotic or class (D-285)"]}, {"key": "panels", "view": "panels", "area": "Microbiology reference data > AST panels", "state": "built", "files": ["frontend/src/components/admin/microbiologyReference/AstPanelPage.jsx"], "keep": "Panel list, panel editor, agents and tiers.", "v3": ["Targeting: organism or group, sample types, Default for (R-01)", "Default disk content per agent (R-15)"]}, {"key": "rules", "view": "rules", "area": "Microbiology reference data > AST rules", "state": "v3", "files": ["frontend/src/components/admin/microbiologyReference/sectionConfig.js (new section)", "frontend/src/components/admin/microbiologyReference/MicrobiologyReferenceAdmin.jsx"], "keep": "New section in the existing Microbiology reference data admin. One page, no tabs: shared filters, Import, Export and History; Reporting rules, then Interpretation rules (M-06, not on develop), then one Preview.", "v3": ["Whole page (R-06, R-10, D-287)"]}, {"key": "ref", "view": "ref", "area": "Microbiology reference data > Organisms, Antibiotics, Breakpoint standards", "state": "built", "files": ["frontend/src/components/admin/microbiologyReference/ReferenceDataPage.jsx", "frontend/src/components/admin/microbiologyReference/BreakpointPage.jsx", "frontend/src/components/admin/microbiologyReference/BreakpointRuleModal.jsx"], "keep": "Existing list, edit modals, breakpoint rules, import.", "v3": ["Organism synonyms, codes and hierarchy (R-12, R-13)", "Antibiotic master fields, AWaRe optional (R-19)", "Breakpoint indication, disk content, ECOFF, SDD (R-14 to R-17)", "AMR for R seed packs: status, package version and test vectors; a new release is a new pack applied through Import Review (R-18, R-21, D-286)", "QC range domain for AST control expected ranges (R-23)"]}, {"key": "oe", "view": "oe", "area": "Enter Order", "state": "built", "files": ["Clinical Order Entry v4"], "keep": "Order entry v4. v2 removed the Microbiology section.", "v3": ["None beyond v2"]}];
const BUILD = Object.fromEntries(BUILD_MAP.map(b => [b.key, b]));
const STATE_LABEL = { built: 'Built on develop: keep', v2: 'v2 FRS, not on develop: build to v2', v3: 'New in v3: build to v3' };
function buildAttrs(key) { const b = BUILD[key]; return b ? { 'data-build': b.state, 'data-files': b.files.join(', '), 'data-v3': b.v3.join(' | ') } : {}; }
function BuildStrip({ k }) { const b = BUILD[k]; if (!b) return null;
  return <div className="build-strip anno"><b>{STATE_LABEL[b.state]}</b>{b.files.length > 0 && <> · {b.files.map(f => f.split('/').pop()).join(', ')}</>}<div><b>Keep:</b> {b.keep}</div>{b.v3.length > 0 && <div><b>v3 changes only:</b> {b.v3.join('; ')}</div>}</div>; }
function Anno({ children, style }) { return <div className="note-box anno" style={style}>{children}</div>; }
// Notice: Carbon inline notification markup. Build as InlineNotification (lowContrast, no close), or as
// ActionableNotification with inline when it carries an action button (InlineNotification allows none).
const NOTICE_ICON = { info: InformationFilled, warning: WarningAltFilled, success: CheckmarkFilled, error: ErrorFilled };
function Notice({ kind = 'info', children, style }) {
  const Icon = NOTICE_ICON[kind];
  return <div className={`cds--inline-notification cds--inline-notification--low-contrast cds--inline-notification--${kind}`} role={kind === 'warning' || kind === 'error' ? 'alert' : 'status'} style={{ maxWidth: 'none', ...style }}>
    <div className="cds--inline-notification__details"><Icon className="cds--inline-notification__icon" /><div className="cds--inline-notification__text-wrapper"><div className="cds--inline-notification__subtitle">{children}</div></div></div></div>;
}
function Check({ ok, children }) {
  return <div className="chk">{ok ? <CheckmarkFilled aria-label={t('micro.checklist.done', 'Done')} style={{ fill: 'var(--cds-support-success, #24a148)' }} /> : <Misuse aria-label={t('micro.checklist.missing', 'Missing')} style={{ fill: 'var(--cds-support-error, #da1e28)' }} />}<span>{children}</span></div>;
}

function Tag({ kind = 'gray', children }) { return <CarbonTag type={kind} size="sm">{children}</CarbonTag>; }
function Btn({ kind = 'primary', children, onClick, disabled }) { return <Button kind={kind} size="sm" onClick={onClick} disabled={disabled}>{children}</Button>; }

/* Form adapters. They keep this drawing close to the reviewed preview while rendering real Carbon
   components. When building, use Select / TextInput / Checkbox / RadioButton / TextArea directly with
   their own labelText (the visible label is the surrounding Field or label). */
let __uid = 0; const uid = p => p + '-' + (++__uid);
function optionsOf(children) {
  const out = [];
  React.Children.forEach(children, c => {
    if (!c) return;
    if (Array.isArray(c)) { out.push(...optionsOf(c)); return; }
    if (c.type === React.Fragment) { out.push(...optionsOf(c.props.children)); return; }
    if (c.type === 'optgroup') { out.push(<SelectItemGroup key={c.props.label} label={c.props.label}>{optionsOf(c.props.children)}</SelectItemGroup>); return; }
    if (c.type === 'option') { const text = React.Children.toArray(c.props.children).join(''); out.push(<SelectItem key={c.key || (c.props.value ?? text)} value={c.props.value ?? text} text={text} disabled={c.props.disabled} />); }
  });
  return out;
}
function Sel({ children, style, ...p }) {
  const [id] = useState(() => uid('sel'));
  return <div style={style}><Select id={id} labelText={p['aria-label'] || t('label.select', 'Select')} hideLabel size="sm" {...p}>{optionsOf(children)}</Select></div>;
}
function Inp({ type = 'text', style, ...p }) {
  const [id] = useState(() => uid('in'));
  const label = p['aria-label'] || p.placeholder || t('label.value', 'Value');
  if (type === 'checkbox') return <span style={{ display: 'inline-block', verticalAlign: 'middle' }}><Checkbox id={id} labelText={label} hideLabel {...p} /></span>;
  if (type === 'radio') return <RadioButton id={id} labelText={label} hideLabel value={p.value || id} {...p} />;
  return <TextInput id={id} type={type} labelText={label} hideLabel size="sm" style={style} {...p} />;
}
function Area({ style, ...p }) { const [id] = useState(() => uid('ta')); return <TextArea id={id} labelText={p['aria-label'] || p.placeholder || t('label.note', 'Note')} hideLabel style={style} {...p} />; }

function Field({ label, req, final, surv, missing, children }) {
  return <div className={`field ${missing ? 'missing' : ''}`}>
    <label>{label}{req && <span className="req">*</span>}{final && <span className="req">◆</span>}</label>
    {children}
    {final && <div className={`helper ${missing ? 'warn' : ''}`}>{missing ? t('microbiology.case.requiredBeforeFinal', 'Needed before final report') + ' (missing)' : t('microbiology.case.requiredBeforeFinal', 'Needed before final report')}</div>}
    {surv && <div className={`helper ${missing ? 'warn' : ''}`}>{t('microbiology.case.neededForSurveillance', 'Needed for surveillance')}{missing ? ' (missing; never blocks release)' : ''}</div>}
  </div>;
}
function Section({ n, title, isNew, tags, children, open = true, cls = '', bk }) {
  const [o, setO] = useState(open);
  return <div className={`sec ${cls}`} id={'sec-' + n} {...buildAttrs(bk)}>
    <div className="sec-h" onClick={() => setO(!o)}>
      <h3><span className="num">{n}</span>{title}{isNew && <span className="new">v2</span>}{tags}</h3>
      <span className="muted">{o ? 'Collapse' : 'Expand'}</span>
    </div>
    <BuildStrip k={bk} />
    {o && <div className="sec-b">{children}</div>}
  </div>;
}

/* ---------- CASE VIEW ---------- */
/* ---------- One result entry pattern for every case test row (FR-06.5) ---------- */
const GRADES = ['None', 'Rare', 'Few', 'Moderate', 'Many'];
function ComponentRows({ rows }) {
  return <Table size="sm" style={{ background: '#fff' }}><TableHead><TableRow><TableHeader style={{ width: '35%' }}>Component</TableHeader><TableHeader>Result</TableHeader><TableHeader>Flag</TableHeader></TableRow></TableHead>
    <TableBody>{rows.map(r => <TableRow key={r.c}><TableCell>{r.c}</TableCell><TableCell><Sel defaultValue={r.v} style={{ width: '100%' }}>{r.opts.map(o => <option key={o}>{o}</option>)}</Sel></TableCell><TableCell>{r.flag ? <Tag kind="red">{r.flag}</Tag> : <span className="muted">none</span>}</TableCell></TableRow>)}</TableBody></Table>;
}
const NotesCtx = React.createContext(null);
const NOTE_SEED = {
  gram: [{ d: '23 Sep 09:12', a: 'J. Kaupa', type: 'I', body: 'Thick smear; re-stained once before reading.' }],
  'MGIT-004812-A': [{ d: '28 Sep 08:40', a: 'R. Opa', type: 'E', body: 'Positive signal on day 5; purity subculture set up.' }],
  'ISO-1': [{ d: '28 Sep 10:05', a: 'R. Opa', type: 'I', body: 'MPT64 read at 15 minutes; clear band.' }],
};
function NotesPanel({ id, printable = true, bare, underCulture }) {
  const { notes, addNote } = React.useContext(NotesCtx);
  const list = notes[id] || [];
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState('I');
  const [body, setBody] = useState('');
  const save = () => { if (!body.trim()) return; addNote(id, { d: '30 Sep ' + '09:30', a: 'J. Kaupa', type, body: body.trim() }); setBody(''); setType('I'); setAdding(false); };
  return <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '.75rem', marginTop: bare ? 0 : '.75rem' }}>
    <div style={{ fontWeight: 600, marginBottom: '.4rem' }}>{t('microbiology.case.notes.title', 'Notes')}</div>
    {list.length ? <Table size="sm"><TableHead><TableRow><TableHeader style={{ width: '16%' }}>Date/time</TableHeader><TableHeader style={{ width: '14%' }}>Author</TableHeader><TableHeader style={{ width: '18%' }}>Type</TableHeader><TableHeader>Note</TableHeader></TableRow></TableHead>
      <TableBody>{list.map((n, i) => <TableRow key={i}><TableCell>{n.d}</TableCell><TableCell>{n.a}</TableCell><TableCell>{n.type === 'E' ? <Tag kind="blue">{t('label.results.notes.sendWithResult', 'Send with Result')}</Tag> : <Tag kind="gray">{t('label.results.notes.inLabOnly', 'In Lab Only')}</Tag>}{n.rule && <div><Tag kind="teal">{t('micro.notes.fromRule', 'From rule')}</Tag></div>}</TableCell><TableCell style={{ whiteSpace: 'normal' }}>{n.body}{n.rule && <div className="muted" style={{ fontSize: 12 }}>{t('micro.notes.ruleSource', 'Added by the reporting rule {rule} while its condition is met. Like every note it cannot be removed; if it should not apply, change the rule.').replace('{rule}', n.rule)}</div>}</TableCell></TableRow>)}</TableBody></Table>
      : <div className="muted">No notes yet.</div>}
    {adding ? <div style={{ marginTop: '.5rem' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 6, fontSize: 14 }}>
        <label><Inp type="radio" name={'nt-' + id} checked={type === 'I'} onChange={() => setType('I')} style={{ width: 'auto', marginRight: 4 }} />{t('label.results.notes.inLabOnly', 'In Lab Only')}</label>
        <label><Inp type="radio" name={'nt-' + id} checked={type === 'E'} onChange={() => setType('E')} style={{ width: 'auto', marginRight: 4 }} />{t('label.results.notes.sendWithResult', 'Send with Result')}</label></div>
      {underCulture && type === 'E' && <div className="helper" style={{ marginBottom: 6 }}>{t('microbiology.case.notes.printsUnderCulture', 'Prints under the culture result on the report.')}</div>}
      <div className="field"><Area rows={3} value={body} onChange={e => setBody(e.target.value)} placeholder="Note text" style={{ width: '100%' }} /></div>
      {type === 'E' && !printable && <Notice kind="warning" style={{ margin: '.4rem 0' }}>{t('microbiology.case.notes.notPrinted', 'This result is not on the report, so this note will not print')}</Notice>}
      <div className="row-actions"><Btn onClick={save}>{t('microbiology.case.notes.save', 'Save note')}</Btn><Btn kind="ghost" onClick={() => setAdding(false)}>Cancel</Btn></div>
    </div> : <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.4rem' }}><Btn kind="tertiary" onClick={() => setAdding(true)}>{t('button.results.notes.newNote', 'New Note')}</Btn></div>}
  </div>;
}
function NoteCount({ id }) { const { notes } = React.useContext(NotesCtx); const n = (notes[id] || []).length; return n ? <span className="muted" style={{ fontSize: 12 }}> · {n} note{n > 1 ? 's' : ''}</span> : null; }

function ResultEditor({ row, onClose, printable }) {
  const [prev, setPrev] = useState(!!row.external);
  return <div className="inline-panel" style={{ marginTop: 0 }}>
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>{row.test} <span className="muted" style={{ fontWeight: 400 }}>· result type: {row.type === 'components' ? 'several components (graded observations use dictionary grades, D-185)' : row.type === 'numeric' ? 'number with unit' : 'coded list'} (from the test catalog)</span></div>
    {row.type === 'coded' && <Field label="Result" req><Sel defaultValue={row.result || ''} style={{ maxWidth: 520 }}><option value="">Select</option>{(row.opts || []).map(o => <option key={o}>{o}</option>)}</Sel></Field>}
    {row.type === 'components' && <ComponentRows rows={row.components} />}
    {row.type === 'numeric' && <div className="grid" style={{ gridTemplateColumns: '200px 120px 1fr' }}><Field label="Result" req><Inp defaultValue={row.result} /></Field><Field label="Unit"><Inp disabled defaultValue={row.unit} /></Field><div className="muted" style={{ alignSelf: 'end' }}>Reference range {row.range}</div></div>}
    <div className="grid" style={{ marginTop: '.75rem' }}>
      <div className="field"><label>&nbsp;</label><label style={{ color: '#161616', fontSize: 14 }}><Inp type="checkbox" style={{ width: 'auto', marginRight: 6 }} checked={prev} onChange={e => setPrev(e.target.checked)} />{t('microbiology.case.testedElsewhere', 'Tested elsewhere')} <span className="muted">(result reported by another laboratory, or earlier)</span></label></div>
      {prev && <Field label={t('microbiology.case.performedBy', 'Performed by')} req><Inp list="orgs" defaultValue={row.external ? 'Goroka Provincial Hospital Laboratory' : ''} placeholder="Search the Organizations list or a user" /><datalist id="orgs"><option value="Goroka Provincial Hospital Laboratory" /><option value="Mount Hagen Provincial Hospital Laboratory" /><option value="J. Kaupa (user)" /></datalist></Field>}
      {prev && <Field label={t('microbiology.case.datePerformed', 'Date performed')} req><Inp defaultValue="22/09/2026" /></Field>}
      {row.state && row.state !== 'Not started' && <div className="muted" style={{ gridColumn: '1 / -1' }}>{t('microbiology.case.history.enteredBy', 'Entered by {0}, {1}').replace('{0}', row.by || 'J. Kaupa').replace('{1}', '02 Oct 08:40')}{row.state === 'Validated' && <> · {t('microbiology.case.history.validatedBy', 'Validated by {0}, {1}').replace('{0}', 'R. Opa').replace('{1}', '02 Oct 09:15')}</>}</div>}
      {!prev && <Field label="Reagent lot" req={row.lotRequired}><Sel defaultValue={row.lot || ''}><option value="">Select lot</option><option>ZN stain kit, lot 22071, exp 03/2027</option><option>Xpert MTB/RIF Ultra cartridges, lot 1000-2231</option><option>Gram stain kit, lot 44120</option></Sel></Field>}
    </div>
    <NotesPanel id={row.id} printable={printable} />
    <p className="muted anno" style={{ margin: '.5rem 0' }}>Flags (High, Low, Abnormal, Critical) are applied from the test catalog as on Results Entry. Saving records the result as Awaiting validation; a validator validates or returns it (the OpenELIS analysis statuses, D-191). With Block self-validation on, the person who entered it cannot validate it.</p>
    <div className="row-actions"><Btn onClick={onClose}>Save result</Btn><Btn kind="ghost" onClick={onClose}>Cancel</Btn></div>
  </div>;
}
function CaseTestTable({ rows, labOnly, setLabOnly, showOn }) {
  const [open, setOpen] = useState(null);
  const [menu, setMenu] = useState(null);
  const cols = showOn ? 7 : 7;
  return <Table size="sm" className="t rt">
    <colgroup><col style={{ width: '19%' }} /><col style={{ width: '29%' }} /><col style={{ width: '8%' }} /><col style={{ width: '15%' }} /><col style={{ width: '11%' }} /><col style={{ width: '8%' }} /><col style={{ width: '10%' }} /></colgroup>
    <TableHead><TableRow><TableHeader>Test</TableHeader><TableHeader>Result</TableHeader><TableHeader>Flag</TableHeader><TableHeader>{t('microbiology.case.performedBy', 'Performed by')}</TableHeader><TableHeader>Reagent lot</TableHeader><TableHeader>Status</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
    <TableBody>{rows.map(r => <React.Fragment key={r.id}>
      <TableRow>
        <TableCell>{r.test}<NoteCount id={r.id} />{r.on && <div className="muted">On {r.on}</div>}
          <div>{r.external && <Tag kind="gray">{t('microbiology.case.external', 'External result')}</Tag>}{labOnly[r.id] && <Tag kind="gray">{t('microbiology.case.inLabOnly', 'In lab only')}</Tag>}{r.addedBy && <Tag kind="cool-gray">{t('microbiology.case.addedBy', 'Added by {user}').replace('{user}', r.addedBy)}</Tag>}{r.placedBy && <Tag kind="blue">{r.placedBy}</Tag>}</div></TableCell>
        <TableCell style={{ whiteSpace: 'normal' }}>{r.display ? r.display : <span className="muted">Not entered</span>}</TableCell>
        <TableCell>{r.flag ? <Tag kind="red">{r.flag}</Tag> : <span className="muted">none</span>}</TableCell>
        <TableCell>{r.by || <span className="muted">n/a</span>}</TableCell>
        <TableCell className="muted">{r.lot || (r.external ? 'n/a (external)' : 'n/a')}</TableCell>
        <TableCell><Tag kind={r.state === 'Validated' ? 'green' : r.state === 'Awaiting validation' ? 'warm-gray' : 'gray'}>{r.state}</Tag></TableCell>
        <TableCell style={{ position: 'relative' }}>
          <Btn kind="ghost" onClick={() => setOpen(open === r.id ? null : r.id)}>{r.display ? 'Edit' : 'Enter'}</Btn>
          <Btn kind="ghost" onClick={() => setMenu(menu === r.id ? null : r.id)}>⋯</Btn>
          {menu === r.id && <div className="menu"><button onClick={() => { setLabOnly({ ...labOnly, [r.id]: !labOnly[r.id] }); setMenu(null); }}>{labOnly[r.id] ? 'Turn off In lab only' : 'Mark In lab only'}</button><button onClick={() => setMenu(null)}>{t('microbiology.case.moveResult', 'Move result')}</button><button onClick={() => setMenu(null)}>Cancel test (reason)</button></div>}
        </TableCell>
      </TableRow>
      {open === r.id && <TableRow><TableCell colSpan={cols} style={{ padding: 0 }}><ResultEditor row={r} onClose={() => setOpen(null)} printable={!labOnly[r.id]} /></TableCell></TableRow>}
    </React.Fragment>)}</TableBody></Table>;
}

const MEDIA_SEED = [
  { name: 'BBL MGIT 7 mL tube', tracked: true, unit: 'tube', atm: 'Aerobic (ambient air)', temp: 37, lots: [{ n: '5327611', exp: '01/2027', left: 212 }, { n: '5311020', exp: '08/2026', why: 'Expired' }] },
  { name: 'Löwenstein-Jensen slope', tracked: true, unit: 'slope', atm: 'Aerobic (ambient air)', temp: 37, lots: [{ n: 'LJ-2609 (prepared in-house)', exp: '11/2026', left: 40 }, { n: 'LJ-2608', exp: '10/2026', why: 'QC failed' }] },
  { name: 'Blood agar (sheep) plate', tracked: true, unit: 'plate', atm: 'CO₂-enriched (5 to 10%)', temp: 35, lots: [{ n: 'BA-26-117', exp: '10/2026', left: 64 }] },
  { name: 'Chocolate agar plate', tracked: true, unit: 'plate', atm: 'CO₂-enriched (5 to 10%)', temp: 35, lots: [{ n: 'CA-26-052', exp: '10/2026', left: 18 }] },
  { name: 'MacConkey agar plate', tracked: true, unit: 'plate', atm: 'Aerobic (ambient air)', temp: 35, lots: [{ n: 'MAC-26-090', exp: '11/2026', left: 51 }] },
  { name: 'CLED agar plate', tracked: true, unit: 'plate', atm: 'Aerobic (ambient air)', temp: 35, lots: [{ n: 'CLED-26-201', exp: '11/2026', left: 88 }] },
  { name: 'Selenite F broth', tracked: true, unit: 'tube', atm: 'Aerobic (ambient air)', temp: 35, lots: [{ n: 'SEL-26-014', exp: '12/2026', left: 30 }] },
  { name: 'BACTEC Plus Aerobic/F bottle', tracked: false, atm: 'Aerobic (ambient air)', temp: 35 },
  { name: 'BACTEC Lytic/10 Anaerobic/F bottle', tracked: false, atm: 'Anaerobic', temp: 35 },
  { name: 'Middlebrook 7H11 agar (from QMRL)', tracked: false, atm: 'CO₂-enriched (5 to 10%)', temp: 37 },
];
const ATMS = ['Aerobic (ambient air)', 'CO₂-enriched (5 to 10%)', 'Candle jar', 'Anaerobic', 'Microaerophilic'];
/* ---------- Extend incubation (FR-05.3a, D-179): from any open culture row, with a reason ---------- */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function addTime(str, n, unit) {
  const [d, m, hm] = String(str).split(' '); if (!hm) return str; const [h, mi] = hm.split(':');
  const dt = new Date(2026, MON.indexOf(m), +d, +h, +mi); dt.setTime(dt.getTime() + n * (unit === 'Hours' ? 3600e3 : 86400e3));
  const p2 = x => String(x).padStart(2, '0'); return `${p2(dt.getDate())} ${MON[dt.getMonth()]} ${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
}
/* ---------- Positive at (FR-05.4b, D-180): exact date and time, default server time, editable; elapsed to the minute ---------- */
const SERVER_NOW = '02 Oct 10:15';
function parseT(str) { const [d, m, hm] = String(str || '').trim().split(/\s+/); if (!hm || MON.indexOf(m) < 0) return null; const [h, mi] = hm.split(':'); if (mi === undefined) return null; const dt = new Date(2026, MON.indexOf(m), +d, +h, +mi); return isNaN(dt) ? null : dt; }
function elapsed(a, b) {
  const s = parseT(a), e = parseT(b); if (!s || !e || e < s) return '';
  const mins = Math.round((e - s) / 60000), d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  const u = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  return [d ? u(d, 'day') : null, u(h, 'hour'), u(m, 'minute')].filter(Boolean).join(' ');
}
function PosTag({ r, onEdit }) {
  return <div><Tag kind="green">Positive</Tag>
    <div style={{ fontSize: 12 }}><b>{r.posAt}</b>{r.posBy && <span className="muted"> · {r.posBy}</span>}</div>
    <div className="muted" style={{ fontSize: 12 }}>{t('microbiology.case.inoc.ttp', 'Time to positivity')}: {elapsed(r.start, r.posAt)}</div>
    {onEdit && <Btn kind="ghost" onClick={onEdit}>{t('microbiology.case.inoc.editPositiveAt', 'Edit positive time')}</Btn>}</div>;
}
function PositiveAtPanel({ row, onSave, onCancel }) {
  const editing = row.state === 'Positive';
  const [v, setV] = useState(row.posAt || SERVER_NOW);
  const dt = parseT(v), ok = dt && dt >= parseT(row.start) && dt <= parseT(SERVER_NOW);
  return <div className="inline-panel">
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>{editing ? t('microbiology.case.inoc.editPositiveAt', 'Edit positive time') : t('microbiology.case.inoc.markPositive', 'Mark positive')}: {row.cid} <span className="new">v2</span> <span className="muted" style={{ fontWeight: 400 }}>Inoculated at {row.start}</span></div>
    <div className="grid">
      <Field label={t('microbiology.case.inoc.positiveAt', 'Positive at')} req><Inp value={v} onChange={e => setV(e.target.value)} aria-label="Positive at" /><div className={`helper ${ok ? '' : 'warn'}`}>{ok ? (editing ? 'The Timeline keeps the old and new times' : 'Defaults to now (server time); change it to when growth was seen') : 'Use DD Mon HH:MM, not before Inoculated at and not in the future'}</div></Field>
      <Field label={t('microbiology.case.inoc.ttp', 'Time to positivity')}><Inp disabled value={ok ? elapsed(row.start, v) : ''} aria-label="Time to positivity" /><div className="helper">From Inoculated at, in days, hours and minutes</div></Field>
    </div>
    <div className="row-actions"><Btn disabled={!ok} onClick={() => onSave(v)}>{editing ? t('common.save', 'Save') : t('microbiology.case.inoc.markPositive', 'Mark positive')}</Btn><Btn kind="ghost" onClick={onCancel}>Cancel</Btn></div>
  </div>;
}
const EXT_REASONS = ['Colonies too small to identify or pick', 'Slow-growing organism suspected', 'Fastidious organism suspected (for example endocarditis)', 'Clinician request', 'Other'];
function ExtendPanel({ row, onSave, onCancel }) {
  const [n, setN] = useState(row.unit === 'Days' ? (row.dur >= 28 ? 14 : 2) : 24);
  const [unit, setUnit] = useState(row.unit || 'Hours');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  return <div className="inline-panel">
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>{t('microbiology.case.inoc.extend', 'Extend incubation')}: {row.cid} <span className="new">v2</span> <span className="muted" style={{ fontWeight: 400 }}>{row.medium} · now ends {row.ends}</span></div>
    <div className="grid">
      <Field label={t('microbiology.case.inoc.extendBy', 'Extend by')} req><div style={{ display: 'flex', gap: 8 }}><Inp value={n} onChange={e => setN(+e.target.value || 0)} style={{ width: '40%' }} aria-label="Extend by" /><Sel value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '60%' }}><option>Hours</option><option>Days</option></Sel></div></Field>
      <Field label={t('microbiology.case.inoc.extendReason', 'Reason')} req><Sel value={reason} onChange={e => setReason(e.target.value)} aria-label="Extend reason"><option value="" disabled>Select</option>{EXT_REASONS.map(x => <option key={x}>{x}</option>)}</Sel><div className="helper">Dictionary: Extend incubation reason</div></Field>
      {reason === 'Other' && <Field label="Note" req><Inp value={note} onChange={e => setNote(e.target.value)} /></Field>}
      <Field label={t('microbiology.case.inoc.newEnd', 'New incubation end')}><Inp disabled value={addTime(row.ends, n, unit)} /><div className="helper">Next check moves with it when Check every is set; the row stays open</div></Field>
    </div>
    <div className="row-actions"><Btn disabled={!reason || !n || (reason === 'Other' && !note)} onClick={() => onSave({ n, unit, reason: reason === 'Other' ? note : reason, ends: addTime(row.ends, n, unit) })}>{t('microbiology.case.inoc.extend', 'Extend incubation')}</Btn><Btn kind="ghost" onClick={onCancel}>Cancel</Btn></div>
  </div>;
}
const MediaCtx = React.createContext(null);

function MediumPicker({ onPrefill, initial }) {
  const { media, setMedia } = React.useContext(MediaCtx);
  const [q, setQ] = useState(initial || '');
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(initial ? media.find(m => m.name === initial) : null);
  const [lot, setLot] = useState('');
  const hits = media.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));
  const exact = media.some(m => m.name.toLowerCase() === q.trim().toLowerCase());
  const pick = m => { setPicked(m); setQ(m.name); setOpen(false); const first = (m.lots || []).find(l => !l.why); setLot(first ? first.n : ''); onPrefill && onPrefill(m); };
  const addNew = () => { const n = q.trim(); if (!n) return; const m = { name: n, tracked: false, atm: 'Aerobic (ambient air)', temp: 35 }; setMedia([...media, m]); pick(m); };
  return <>
    <Field label={t('microbiology.case.inoc.medium', 'Medium')} req>
      <div style={{ position: 'relative' }}>
        <Inp value={q} placeholder={t('microbiology.case.inoc.searchMedium', 'Search media')} onFocus={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true); setPicked(null); }} />
        {open && <div className="menu" style={{ left: 0, right: 'auto', width: '100%' }}>
          {hits.map(m => <button key={m.name} onClick={() => pick(m)}>{m.name} {m.tracked ? <Tag kind="teal">{t('microbiology.case.inoc.tracked', 'Tracked')}</Tag> : <Tag kind="warm-gray">{t('microbiology.case.inoc.notTrackedTag', 'Not tracked')}</Tag>}</button>)}
          {q.trim() && !exact && <button onMouseDown={e => e.preventDefault()} onClick={addNew} style={{ color: '#0f62fe' }}>+ {t('microbiology.case.inoc.addMedium', 'Add new')}: "{q.trim()}" <span className="muted">(created not tracked)</span></button>}
        </div>}
      </div>
      <div className="helper">{t('microbiology.case.inoc.mediumHelp', 'Microbiology medium items. Tracked media need a lot; not tracked media have none.')}</div>
    </Field>
    {picked && !picked.tracked ? <Field label={t('microbiology.case.inoc.lot', 'Lot')}><div style={{ paddingTop: 6 }}><Tag kind="warm-gray">{t('microbiology.case.inoc.notTrackedTag', 'Not tracked')}</Tag></div><div className="helper">No lot and no stock change; the Timeline records it.</div></Field>
    : <Field label={t('microbiology.case.inoc.lot', 'Lot')} req>
      <Sel value={lot} onChange={e => setLot(e.target.value)} disabled={!picked}>
        <option value="">{picked ? (picked.lots.some(l => !l.why) ? 'Select a lot' : 'No usable lot') : 'Pick a medium first'}</option>
        {picked && picked.lots.map(l => <option key={l.n} value={l.n} disabled={!!l.why}>Lot {l.n}, exp {l.exp}{l.why ? ` (${l.why})` : `, ${l.left} ${picked.unit}s left`}</option>)}</Sel>
      <div className="helper">{picked && !picked.lots.some(l => !l.why) ? t('microbiology.case.inoc.noUsableLot', 'No usable lot in Inventory. Receive a lot, or choose another medium.') : picked ? `Last lot used in this lab unit preselected. Recorded on the row; stock is not changed here.` : 'Scan a lot barcode to fill Medium and Lot.'}</div>
    </Field>}
  </>;
}

const TEMPLATE_TB = { name: 'Sputum, TB culture', rows: [
  { medium: 'BBL MGIT 7 mL tube', atm: 'Aerobic (ambient air)', temp: 37, dur: 42, unit: 'Days', every: 7 },
  { medium: 'Löwenstein-Jensen slope', atm: 'Aerobic (ambient air)', temp: 37, dur: 56, unit: 'Days', every: 7 } ] };
const TEMPLATE_BC = { name: 'Blood culture bottle (positive bottle subculture)', rows: [
  { medium: 'Blood agar (sheep) plate', atm: 'CO₂-enriched (5 to 10%)', temp: 35, dur: 48, unit: 'Hours', every: 24 },
  { medium: 'MacConkey agar plate', atm: 'Aerobic (ambient air)', temp: 35, dur: 48, unit: 'Hours', every: 24 },
  { medium: 'Chocolate agar plate', atm: 'CO₂-enriched (5 to 10%)', temp: 35, dur: 48, unit: 'Hours', every: 24 } ] };
function TemplateProposal({ template, onApply }) {
  const { media } = React.useContext(MediaCtx);
  const [on, setOn] = useState(template.rows.map(() => true));
  return <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '.75rem', marginBottom: '.75rem' }}>
    <div style={{ fontWeight: 600, marginBottom: '.4rem' }}>{t('microbiology.case.inoc.applyTemplate', 'Apply linked media: {name}').replace('{name}', template.name)} <span className="new">v2</span> <span className="muted" style={{ fontWeight: 400 }}>from Admin › Plating templates; a suggestion, not a gate</span></div>
    <Table size="sm"><TableHead><TableRow><TableHeader style={{ width: 30 }}></TableHeader><TableHeader>Medium</TableHeader><TableHeader>Lot</TableHeader><TableHeader>Atmosphere · °C</TableHeader><TableHeader>Incubation</TableHeader></TableRow></TableHead>
      <TableBody>{template.rows.map((r, i) => { const m = media.find(x => x.name === r.medium) || {}; return <TableRow key={i}>
        <TableCell><Inp type="checkbox" aria-label={'Use ' + r.medium} checked={on[i]} onChange={() => { const c = [...on]; c[i] = !c[i]; setOn(c); }} style={{ width: 'auto' }} /></TableCell>
        <TableCell>{r.medium} {m.tracked ? <Tag kind="teal">Tracked</Tag> : <Tag kind="warm-gray">Not tracked</Tag>}</TableCell>
        <TableCell>{m.tracked ? <Sel aria-label={'Lot for ' + r.medium} defaultValue={(m.lots.find(l => !l.why) || {}).n}>{m.lots.map(l => <option key={l.n} value={l.n} disabled={!!l.why}>Lot {l.n}{l.why ? ` (${l.why})` : ''}</option>)}</Sel> : <span className="muted">n/a</span>}</TableCell>
        <TableCell>{r.atm} · {r.temp} °C</TableCell><TableCell>{r.dur} {r.unit}, check every {r.every} {r.unit}</TableCell></TableRow>; })}</TableBody></Table>
    <div className="row-actions"><Btn onClick={() => onApply(on.filter(Boolean).length)}>Add {on.filter(Boolean).length} rows</Btn><Btn kind="ghost">{t('microbiology.case.printLabels', 'Print labels')}</Btn><span className="muted" style={{ alignSelf: 'center' }}>Container identifiers are generated (lab number, medium code, sequence) and can be edited.</span></div>
  </div>;
}

function PatientHistory({ ex }) {
  return <div className="inline-panel" style={{ background: '#fff', border: '1px solid #e0e0e0', marginTop: '-0.5rem', marginBottom: '1rem' }}>
    <div style={{ fontWeight: 600, marginBottom: '.4rem' }}>{t('microbiology.case.patientHistory', 'Patient history')} <span className="new">v2</span> <span className="muted" style={{ fontWeight: 400 }}>earlier micro cases for {ex.patientName}, any order, lab units you hold rights in</span></div>
    {ex.history.length ? <Table size="sm"><TableHead><TableRow><TableHeader>Date</TableHeader><TableHeader>Case</TableHeader><TableHeader>Specimen</TableHeader><TableHeader>Program</TableHeader><TableHeader>Organisms and key resistance</TableHeader><TableHeader>State</TableHeader></TableRow></TableHead>
      <TableBody>{ex.history.map(r => <TableRow key={r[1]}><TableCell>{r[0]}</TableCell><TableCell><a href="#" style={{ color: '#0f62fe' }}>{r[1]}</a></TableCell><TableCell>{r[2]}</TableCell><TableCell>{r[3]}</TableCell><TableCell>{r[4].includes('ESBL') ? <>{r[4].replace(', ESBL', '')} <Tag kind="red">ESBL</Tag></> : r[4]}</TableCell><TableCell><Tag kind="green">{r[5]}</Tag></TableCell></TableRow>)}</TableBody></Table>
      : <div className="muted">No earlier micro cases.</div>}
    {ex.historyNote && <p className="muted" style={{ marginTop: '.4rem' }}>{ex.historyNote}</p>}
  </div>;
}

/* ---------- The standard test and panel chooser (order entry component), used in Initial testing, AST / DST and Additional testing ---------- */
function TestChooser({ ch, onAdd, onCancel }) {
  const [picked, setPicked] = useState([]);
  const [q, setQ] = useState(ch.q || '');
  const [on, setOn] = useState(ch.on ? ch.on[0] : '');
  const toggle = x => setPicked(p => p.includes(x) ? p.filter(y => y !== x) : [...p, x]);
  const tests = ch.tests.filter(x => !q || x.toLowerCase().includes(q.toLowerCase()));
  const [allPanels, setAllPanels] = useState(false);
  const otherPanels = ch.suggested ? ['Staphylococcus disk diffusion panel', 'Streptococcus pneumoniae panel', 'Haemophilus panel', 'Enterococcus panel'] : [];
  return <div className="inline-panel">
    <div className="muted" style={{ marginBottom: '.5rem' }}>The normal OpenELIS test and panel chooser (same component as order entry), {ch.filter}. <label style={{ marginLeft: 8 }}><Inp type="checkbox" /> Show all lab units</label></div>
    {ch.on && <div className="grid" style={{ marginBottom: '.5rem' }}><Field label={t('microbiology.case.chooser.on', 'On')} req><Sel value={on} onChange={e => setOn(e.target.value)} aria-label="Chooser on">{ch.on.map(o => <option key={o}>{o}</option>)}</Sel><div className="helper">{ch.onHelp}</div></Field></div>}
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ background: '#fff', padding: '.75rem', border: '1px solid #e0e0e0' }}>
        <b style={{ fontSize: 13 }}>Order Panels</b>{ch.suggested && <span className="muted"> · panels whose targeting matches the organism</span>}
        <div className="field" style={{ margin: '.5rem 0' }}><Inp placeholder="Search name, code or LOINC" /></div>
        {ch.panels.map(x => <label key={x} style={{ display: 'block', fontSize: 14, padding: '4px 0' }}><Inp type="checkbox" checked={picked.includes(x)} onChange={() => toggle(x)} style={{ marginRight: 6 }} />{x}</label>)}
        {allPanels && otherPanels.map(x => <label key={x} style={{ display: 'block', fontSize: 14, padding: '4px 0' }}><Inp type="checkbox" checked={picked.includes(x)} onChange={() => toggle(x)} style={{ marginRight: 6 }} />{x} <span className="muted">(not targeted at this organism)</span></label>)}
        <div className="muted">1 to {ch.panels.length + (allPanels ? otherPanels.length : 0)} of {ch.panels.length + otherPanels.length}</div>
        {otherPanels.length > 0 && <Btn kind="ghost" onClick={() => setAllPanels(!allPanels)}>{allPanels ? 'Show matching panels only' : t('micro.case.chooser.showAll', 'Show all panels')}</Btn>}
      </div>
      <div style={{ background: '#fff', padding: '.75rem', border: '1px solid #e0e0e0' }}>
        <b style={{ fontSize: 13 }}>Order Tests</b>
        <div className="field" style={{ margin: '.5rem 0' }}><Inp placeholder="Search name, code or LOINC" value={q} onChange={e => setQ(e.target.value)} /></div>
        {tests.map(x => <label key={x} style={{ display: 'block', fontSize: 14, padding: '4px 0' }}><Inp type="checkbox" checked={picked.includes(x)} onChange={() => toggle(x)} style={{ marginRight: 6 }} />{x}</label>)}
        <div className="muted">1 to {tests.length} of {ch.tests.length}</div>
      </div>
    </div>
    <div style={{ margin: '.75rem 0' }}>{picked.map(x => <Tag key={x} kind="blue">{x} <span style={{ cursor: 'pointer' }} onClick={() => toggle(x)}>✕</span></Tag>)}{!picked.length && <span className="muted">Nothing selected</span>}</div>
    <p className="muted" style={{ marginTop: '.5rem' }}>{ch.after}</p>
    <div className="row-actions"><Btn disabled={!picked.length} onClick={() => onAdd(picked, on)}>Add</Btn><Btn kind="ghost" onClick={onCancel}>Cancel</Btn></div>
  </div>;
}

/* ---------- How the case prints in the patient report: grouped under four sub-headers (OGC-1111 FR-A42, FR-A42a, D-181) ---------- */
const PRINT_GROUPS = [['initial', 'Initial testing'], ['culture', 'Culture'], ['ast', 'AST / DST'], ['additional', 'Additional testing']];
function ReportPrint({ ex, items }) {
  const line = (r, k) => <div key={k} style={{ paddingLeft: r.ind ? 10 * r.ind : 0, borderLeft: r.bar ? '2px solid #161616' : 0, fontWeight: r.b ? 700 : 400, color: r.muted ? '#595959' : '#161616', fontStyle: r.i ? 'italic' : 'normal' }}>{r.t}{r.r && <span style={{ float: 'right', fontWeight: r.rb === false ? 400 : 700, fontStyle: r.ri ? 'italic' : 'normal' }}>{r.r}</span>}</div>;
  return <div style={{ marginTop: '1rem', border: '1px solid #161616', padding: '.5rem', fontFamily: 'IBM Plex Sans', fontSize: 12, background: '#fff' }}>
    <div style={{ fontWeight: 700, borderBottom: '1px solid #161616', marginBottom: 4, textTransform: 'uppercase' }}>{ex.labUnit}</div>
    {PRINT_GROUPS.map(([g, label]) => {
      let lastIso = null; const rows = [];
      items.filter(i => i.group === g && !i.derived).forEach(i => { if (i.iso && i.iso !== lastIso) { rows.push({ t: i.isoLabel, b: true }); lastIso = i.iso; } rows.push(...i.print); });
      const derived = items.filter(i => i.group === g && i.derived).flatMap(i => i.print);
      if (!rows.length && !derived.length) return null;
      return <div key={g} className="print-group" data-group={g} style={{ marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginTop: 4 }}>{t('report.patient.micro.group.' + g, label)}</div>
        {rows.map(line)}{derived.map((r, k) => line(r, 'd' + k))}
      </div>;
    })}
    {ex.report.callback && <div style={{ color: '#595959', fontStyle: 'italic' }}>{ex.report.callback}</div>}
    <div className="muted anno" style={{ marginTop: 4 }}>How it prints inside the patient report (OGC-1111 §7.4, FR-A42a), black and white. Groups with nothing ticked are left out.</div>
  </div>;
}

/* ---------- Tests on a culture are catalog tests (D-183); graded observations are multi-component results (D-185) ---------- */
const GRAM_C = ['Gram-positive cocci in clusters', 'Gram-positive cocci in chains', 'Gram-negative bacilli', 'Gram-positive bacilli', 'Gram-negative diplococci', 'Yeasts', 'Pus cells', 'Epithelial cells'];
const comps = (list, opts) => list.map(c => ({ c, v: '', opts }));
// Mock of what the test catalog holds for tests set up for a culture: result type and the Reportable setting, which starts a test In lab only when off (D-204)
const CULTURE_TEST_DEFS = {
  'Gram stain, culture': { inLabOnly: false, components: comps(GRAM_C, GRADES) },
  'ZN stain, culture': { inLabOnly: true, components: [{ c: 'Acid-fast bacilli', v: '', opts: ['Not seen', 'Seen'] }, { c: 'Serpentine cording', v: '', opts: ['Absent', 'Present'] }] },
  'Auramine stain, culture': { inLabOnly: true, components: [{ c: 'Fluorescent bacilli', v: '', opts: ['Not seen', 'Seen'] }] },
  'Wet mount, culture': { inLabOnly: true, components: comps(['Motile bacilli', 'Yeasts', 'Pus cells'], GRADES) },
  'Lactophenol cotton blue mount': { inLabOnly: true, components: [{ c: 'Hyphae', v: '', opts: ['Not seen', 'Septate', 'Aseptate'] }, { c: 'Conidia', v: '', opts: ['Not seen', 'Seen'] }] },
  'India ink stain, culture': { inLabOnly: true, components: [{ c: 'Encapsulated yeasts', v: '', opts: ['Not seen', 'Seen'] }] },
  'Catalase': { inLabOnly: true, components: [{ c: 'Catalase', v: '', opts: ['Negative', 'Positive'] }] },
  'Coagulase (tube)': { inLabOnly: true, components: [{ c: 'Coagulase', v: '', opts: ['Negative', 'Positive'] }] },
  'Oxidase': { inLabOnly: true, components: [{ c: 'Oxidase', v: '', opts: ['Negative', 'Positive'] }] },
  'BioFire BCID2 panel': { inLabOnly: false, components: [{ c: 'Klebsiella pneumoniae group', v: '', opts: ['Not detected', 'Detected'] }, { c: 'Escherichia coli', v: '', opts: ['Not detected', 'Detected'] }, { c: 'Staphylococcus aureus', v: '', opts: ['Not detected', 'Detected'] }, { c: 'CTX-M', v: '', opts: ['Not detected', 'Detected'] }, { c: 'KPC', v: '', opts: ['Not detected', 'Detected'] }] },
  'Xpert MTB/RIF Ultra (culture)': { inLabOnly: false, components: [{ c: 'MTB', v: '', opts: ['Not detected', 'Detected, low', 'Detected, medium', 'Detected, high'] }, { c: 'Rifampicin resistance', v: '', opts: ['Not detected', 'Detected', 'Indeterminate'] }] },
  'MPT64 antigen (culture)': { inLabOnly: false, components: [{ c: 'MPT64', v: '', opts: ['Negative', 'Positive'] }] },
};
const compDisplay = cs => cs.filter(c => c.v).map(c => `${c.c}: ${GRADES.includes(c.v) ? c.v.toLowerCase() : c.v}`).join('; ');
const newChild = (test, from, n, extra = {}) => { const d = CULTURE_TEST_DEFS[test]; return { id: (test.startsWith('Gram') ? 'GS-' : 'T-') + n, kind: 'test', test, from, components: d.components.map(c => ({ ...c })), display: '', state: 'Not started', inLabOnly: d.inLabOnly, at: '', by: '', ...extra }; };
function ChildEditor({ m, onSave, onCancel }) {
  const [vals, setVals] = useState(m.components.map(c => c.v || ''));
  const shown = m.components.map((c, k) => ({ ...c, v: vals[k] }));
  return <div className="inline-panel">
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>{m.test} on {m.from} · {m.id} <span className="muted anno" style={{ fontWeight: 400 }}>· result type: several components, from the test catalog (OGC-1126, the Results Entry control; D-185)</span></div>
    <Table size="sm" style={{ background: '#fff' }}><TableHead><TableRow><TableHeader style={{ width: '40%' }}>Component</TableHeader><TableHeader>Result</TableHeader></TableRow></TableHead>
      <TableBody>{m.components.map((c, k) => <TableRow key={c.c}><TableCell>{c.c}</TableCell><TableCell><Sel value={vals[k]} aria-label={c.c} onChange={e => setVals(vals.map((x, j) => j === k ? e.target.value : x))} style={{ width: '100%' }}><option value="">Not read (not reported)</option>{c.opts.map(o => <option key={o}>{o}</option>)}</Sel></TableCell></TableRow>)}</TableBody></Table>
    <div className="helper">{m.components[0].opts === GRADES ? 'Grades come from the Dictionary category Microscopy grade (D-187).' : 'Results from the test\'s dictionary in the test catalog.'} Components left blank are not reported.</div>
    <div className="grid" style={{ marginTop: '.5rem' }}><Field label="Reagent lot"><Sel><option>{m.test.startsWith('Gram') ? 'Gram stain kit, lot 44120, exp 06/2027' : m.test.startsWith('ZN') ? 'ZN stain kit, lot 22071, exp 03/2027' : 'Linked kit lot (M-12)'}</option></Sel></Field><Field label={t('microbiology.case.microscopy.readAt', 'Read at')}><Inp disabled value="Save time (server clock)" /></Field></div>
    <div className="muted">Prints as: {compDisplay(shown) || 'nothing yet'}{m.inLabOnly ? ' (In lab only: not on the report)' : ''}</div>
    <NotesPanel id={m.id} printable={!m.inLabOnly} underCulture />
    <div className="row-actions"><Btn disabled={!vals.some(Boolean)} onClick={() => onSave(shown)}>Save result</Btn><Btn kind="ghost" onClick={onCancel}>Cancel</Btn></div>
  </div>;
}

/* ---------- Program questionnaires: from the existing Programs admin, rendered by the order entry questionnaire component (D-186) ---------- */
const QUESTIONNAIRES = {
  'TB Program': [['TB history', 'select', ['New', 'Previously treated', 'DR-TB contact'], true], ['Treatment month', 'number'], ['Specimen number', 'text', 'TB-2026-0417/2'], ['Collection timing', 'select', ['Spot', 'Early morning']], ['Collection method', 'select', ['Expectorated', 'Induced', 'Aspirate']]],
  'AMR surveillance': [['Device in place at collection', 'select', ['None', 'Urinary catheter', 'Central line', 'Ventilator']], ['Antibiotics in the last 48 hours', 'select', ['No', 'Yes', 'Unknown']]],
  'Bacteriology (routine)': [],
  'Mycology': [['Immunocompromised', 'select', ['No', 'Yes', 'Unknown']]],
};
function ProgramQuestionnaire({ program, answers }) {
  const qs = QUESTIONNAIRES[program] || [];
  return <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #e0e0e0', padding: '.75rem' }}>
    <div style={{ fontWeight: 600, marginBottom: '.4rem' }}>{t('microbiology.case.programQuestions', 'Program questions')}: {program || 'no Program'} <span className="muted" style={{ fontWeight: 400 }}>the Program's questionnaire from Admin › Programs, shown with the order entry questionnaire component (existing); answers given at order entry show here</span></div>
    {qs.length ? <div className="grid">{qs.map(([q, type, opts, req]) => <Field key={q} label={q} final={req} missing={req}>{type === 'select' ? <Sel defaultValue="" aria-label={q}><option value="">Select</option>{opts.map(o => <option key={o}>{o}</option>)}</Sel> : <Inp aria-label={q} defaultValue={type === 'text' ? opts : ''} placeholder={type === 'number' ? 'e.g. 2' : ''} />}</Field>)}</div> : <div className="muted">This Program has no questionnaire.</div>}
  </div>;
}

/* ---------- v3 helpers ---------- */
// Culture test linked to each medium (the test catalog's Reagents and media links, D-Q5)
const MEDIUM_CT = { 'BBL MGIT 7 mL tube': 'TB culture (MGIT)', 'Löwenstein-Jensen slope': 'TB culture (LJ)', 'Blood agar (sheep) plate': 'Bacterial culture', 'Chocolate agar plate': 'Bacterial culture', 'MacConkey agar plate': 'Bacterial culture', 'CLED agar plate': 'Bacterial culture', 'Selenite F broth': 'Bacterial culture', 'BACTEC Plus Aerobic/F bottle': 'Blood culture', 'BACTEC Lytic/10 Anaerobic/F bottle': 'Blood culture' };
const CULTURE_TESTS = ['Bacterial culture', 'Fungal culture', 'TB culture (MGIT)', 'TB culture (LJ)', 'Blood culture'];
// Interpretation wording follows the standard (R-16): EUCAST I reads "Susceptible, increased exposure"
const interpLabel = (i, bp) => i === 'I' && /EUCAST/.test(bp) ? t('micro.interp.i.eucast', 'Susceptible, increased exposure') + ' (I)' : i === 'SDD' ? t('micro.interp.sdd', 'Susceptible dose-dependent') + ' (SDD)' : i;
const STATUS_KIND = { 'In progress': 'blue', 'Partial': 'cyan', 'Final': 'green', 'Amended': 'magenta' };
// Tag colours, one meaning each (D-283): teal = set by the system (default, rule, expert rule, from rule); purple = referral or elsewhere; red = R or STAT; green = S or done; gray = provenance and visibility; status colours above.
const QUALS = ['=', '≤', '<', '≥', '>'];
function ReleaseConfirm({ count, version, onConfirm, onCancel }) {
  return <Modal open modalHeading={t('micro.release.final.confirmTitle', 'Release final report?')} primaryButtonText={t('micro.release.final.confirm', 'Release final')} secondaryButtonText={t('common.cancel', 'Cancel')} onRequestSubmit={onConfirm} onRequestClose={onCancel} size="sm">
    <p>{t('micro.release.final.confirmBody', 'The case will be locked. {count} results will be released as report version {version}. Any later change needs an amendment.').replace('{count}', count).replace('{version}', version)}</p>
  </Modal>;
}

function CaseView({ ex }) {
  const [labUnit, setLabUnit] = useState(ex.labUnit);
  const [notes, setNotes] = useState(ex.notes);
  const addNote = (id, n) => setNotes(prev => ({ ...prev, [id]: [...(prev[id] || []), n] }));
  const [notesOpen, setNotesOpen] = useState(null);
  const [media, setMedia] = useState(MEDIA_SEED);
  const [histOpen, setHistOpen] = useState(false);
  const [program, setProgram] = useState(ex.program);
  const track = (PROGRAM_TRACKS[program] || '');
  const [editChild, setEditChild] = useState(null);
  const [chooserFor, setChooserFor] = useState(null);
  const [micro, setMicro] = useState(ex.children);
  const [addMenu, setAddMenu] = useState(null);
  const [dismissFor, setDismissFor] = useState(null);
  const [subCount, setSubCount] = useState(1);
  const [timeFor, setTimeFor] = useState(null);
  const [timeVal, setTimeVal] = useState('');
  const [extFor, setExtFor] = useState(null);
  const [posFor, setPosFor] = useState(null);
  const [subPurpose, setSubPurpose] = useState('');
  const [inocAtm, setInocAtm] = useState(ex.template.rows[0].atm);
  const [inocTemp, setInocTemp] = useState(String(ex.template.rows[0].temp));
  const [subAtm, setSubAtm] = useState('Aerobic (ambient air)');
  const [changingLU, setChangingLU] = useState(false);
  const [incoming, setIncoming] = useState(ex.incoming);
  const [initial, setInitial] = useState(ex.initial);
  const [additional, setAdditional] = useState(ex.additional);
  const [panels, setPanels] = useState(ex.astPanels);
  const [adding, setAdding] = useState(null);
  const [bp, setBp] = useState(ex.ast.bp);
  const [mode, setMode] = useState('Analyzer');
  const [inoc, setInoc] = useState(ex.inoc);
  const [isolates, setIsolates] = useState(ex.isolates);
  const [validated, setValidated] = useState(false);
  const [ackSender, setAckSender] = useState(false); // FR-02.13c, D-219
  const setOutcome = (i, v) => { const c = [...inoc]; c[i] = { ...c[i], state: v, next: 'n/a', log: [...c[i].log, 'Day ' + c[i].day + ': marked ' + v.toLowerCase() + ' · ' + ex.tech] }; setInoc(c); };
  const [subForm, setSubForm] = useState(false);
  const [subFrom, setSubFrom] = useState('');
  const subSuffix = (parent) => { const last = parent.split('-').pop(); return parent.includes('-SUB-') ? last + '.' : last; };
  const subIds = (parent, count) => { if (!parent) return []; const n0 = inoc.filter(r => r.from === parent).length; return Array.from({ length: count }, (_, k) => `BA-SUB-${ex.labShort}-${subSuffix(parent)}${n0 + k + 1}`); };
  const addSub = () => { if (!subFrom) return; const ids = subIds(subFrom, subCount); setInoc([...inoc, ...ids.map(cid => ({ cid, ct: (inoc.find(x => x.cid === subFrom) || {}).ct, from: subFrom, purpose: subPurpose, medium: 'Blood agar (sheep) plate', lot: 'Lot BA-26-117', atm: subAtm, temp: 35, dur: 48, unit: 'Hours', every: 24, eunit: 'Hours', start: SERVER_NOW, ends: addTime(SERVER_NOW, 48, 'Hours'), next: addTime(SERVER_NOW, 24, 'Hours'), state: 'Incubating', day: 1, log: [] }))]); setSubForm(false); setSubFrom(''); setSubCount(1); setSubPurpose(''); };
  const ordered = (() => { const out = []; const walk = (parent, depth) => inoc.forEach((r, i) => { if ((r.from || '') === parent) { out.push({ r, i, depth }); walk(r.cid, depth + 1); } }); walk('', 0); return out; })();
  const [isoForm, setIsoForm] = useState(false);
  const [isoNew, setIsoNew] = useState({ from: '', gram: '', sig: 'Unknown' });
  const [referOpen, setReferOpen] = useState(false);
  const [labOnly, setLabOnly] = useState(ex.labOnly);
  const [reportSel, setReportSel] = useState(Object.fromEntries(ex.report.items.map(i => [i.k, i.on])));
  const [origin, setOrigin] = useState(ex.info.origin);
  const [admission, setAdmission] = useState(ex.info.admission);
  const admMissing = origin !== 'Outpatient' && !admission; // FR-03.5, D-211: never blocks
  const senderDiffs = ex.ast.sender ? ex.ast.readings.filter(a => a.sender && a.sender !== a.interp).map(a => a.drug) : [];
  const [rcvAt, setRcvAt] = useState(ex.received ? ex.received.atSender : '');
  const [tl, setTl] = useState(ex.timeline);
  const [releases, setReleases] = useState(ex.report.releases);
  const status = releases.some(r => /^Amended/.test(r[0])) ? 'Amended' : releases.some(r => /^Final/.test(r[0])) ? 'Final' : releases.length ? 'Partial' : 'In progress'; // D-277: worked out, not stored
  const [confirmFinal, setConfirmFinal] = useState(false);
  const [sugg, setSugg] = useState(ex.suggestions || []);
  const [cultureTests, setCultureTests] = useState(ex.cultureTests || []);
  const [inocMed, setInocMed] = useState('');
  const [pickCt, setPickCt] = useState('');
  const [saveLink, setSaveLink] = useState(true);
  const [astMethod, setAstMethod] = useState(ex.ast.method);
  const [readings, setReadings] = useState(ex.ast.readings);
  const [recFor, setRecFor] = useState(null);
  const [recQ, setRecQ] = useState('=');
  const [recV, setRecV] = useState('');
  const astItem = drug => ex.report.items.find(i => i.group === 'ast' && !i.derived && i.print && i.print[0] && i.print[0].t === drug);
  const log = (what) => setTl(x => [[SERVER_NOW, what + ' · ' + ex.tech], ...x]); // FR-07.2c, FR-09.7

  const accept = (id, where) => {
    const it = incoming.find(i => i.id === id);
    if (where.startsWith('Initial')) setInitial([...initial, { id: 'inc' + id, test: it.test, type: 'coded', opts: [it.value], result: it.value, display: it.value, flag: '', by: it.source, state: 'Awaiting validation', placedBy: t('microbiology.case.placement.placedBy', 'Placed by {user}').replace('{user}', ex.tech) }]);
    const withLinked = it.linked && !where.startsWith('Initial') && !where.startsWith('Additional');
    log(`Placed ${it.test} from Incoming results in ${where}${withLinked ? ` with ${it.linked.length} linked results from the same message` : ''}`);
    setIncoming(incoming.filter(i => i.id !== id));
  };
  const [reading, setReading] = useState(null);
  const markChecked = (i, v) => { const c = [...inoc]; c[i] = { ...c[i], state: v === 'Significant growth' ? 'Positive' : 'Incubating', ...(v === 'Significant growth' ? { posAt: SERVER_NOW, posBy: ex.tech } : {}), next: v === 'Significant growth' ? 'n/a' : addTime(SERVER_NOW, c[i].every || 1, c[i].eunit || 'Days'), log: [...c[i].log, 'Day ' + c[i].day + ': ' + v.toLowerCase() + ' · ' + ex.tech] }; setInoc(c); setReading(null); };
  // FR-10.1g: a reflex rule adds a pending Gram stain under a blood culture bottle when it turns positive
  const markPositive = (cid, v) => {
    const r = inoc.find(x => x.cid === cid);
    setInoc(inoc.map(x => x.cid === cid ? { ...x, log: [...x.log, x.state === 'Positive' ? `Positive at changed from ${x.posAt} to ${v} · ${ex.tech}` : `Marked positive at ${v} (${elapsed(x.start, v)}) · ${ex.tech}`], state: 'Positive', next: 'n/a', posAt: v, posBy: x.state === 'Positive' && x.posBy && x.posBy.includes('signal') ? x.posBy + ', time edited by ' + ex.tech : ex.tech } : x));
    if (r && r.state !== 'Positive' && r.bottle && !micro.some(m => m.from === cid && m.test === 'Gram stain, culture')) setMicro(m => [...m, newChild('Gram stain, culture', cid, m.filter(x => x.test === 'Gram stain, culture').length + 1, { rule: 'Blood culture result = Positive: Gram stain, culture', inLabOnly: false, at: v })]);
  };
  const addChild = (test, cid) => { const n = micro.filter(x => (test.startsWith('Gram') ? x.test.startsWith('Gram') : !x.test.startsWith('Gram'))).length + 1; const c = newChild(test, cid, n, { at: SERVER_NOW }); setMicro(m => [...m, c]); return c.id; };
  const saveChild = (id, components) => setMicro(micro.map(x => x.id === id ? { ...x, components, display: compDisplay(components), state: 'Awaiting validation', at: SERVER_NOW, by: ex.tech } : x));
  // report items: the example's items plus the reportable Gram stains (from the culture rows) and any added isolates
  // tests on a culture that are not In lab only and have a result are culture results (FR-11.2); they print once validated
  const gramItems = micro.filter(m => m.kind === 'test' && !m.inLabOnly && m.display).map(m => ({ k: m.id, group: 'culture', sec: 'Culture · ' + m.id, label: m.test + ' on ' + m.from + ': ' + m.display, d: m.state === 'Validated' ? 'On' : 'On, prints once validated', on: true, order: 11, print: m.state === 'Validated' ? [{ t: m.test + ' (' + m.from + ')', r: m.display, ind: 1 }] : [] }));
  const allItems = [...ex.report.items, ...gramItems].filter(i => !i.hideIf || !labOnly[i.hideIf]).sort((a, b) => (a.order || 0) - (b.order || 0));
  const runNotes = Object.entries(notes).filter(([id]) => id.startsWith('RUN ')).flatMap(([id, ns]) => ns.filter(n => n.type === 'E').map((n, j) => ({ k: 'rn' + id + j, group: 'ast', order: 59, print: [{ t: 'Note', r: n.body, ri: true, ind: 1 }] })));
  const printed = [...allItems.filter(i => reportSel[i.k] !== false && (reportSel[i.k] || i.on)), ...runNotes].sort((a, b) => (a.order || 0) - (b.order || 0));

  const readingForm = recFor ? (<div className="inline-panel"><div style={{ fontWeight: 600, marginBottom: '.5rem' }}>{t('micro.ast.recordReading', 'Record reading')} <span className="muted anno" style={{ fontWeight: 400 }}>the v2 form; <span className="new3">v3</span> adds the Qualifier dropdown</span></div>
        <div className="grid" style={{ gridTemplateColumns: '220px 140px 200px 1fr' }}>
          <Field label="Antibiotic" req><Sel value={recFor} onChange={e => setRecFor(e.target.value)} aria-label="Antibiotic">{readings.map(r => <option key={r.drug}>{r.drug}</option>)}</Sel></Field>
          <Field label={t('micro.ast.qualifier', 'Qualifier')}><Sel value={recQ} onChange={e => setRecQ(e.target.value)} aria-label="Qualifier">{QUALS.map(q => <option key={q}>{q}</option>)}</Sel></Field>
          <Field label="Value" req><Inp value={recV} aria-label="Reading value" onChange={e => { const v = e.target.value; const m = v.match(/^(<=|>=|<|>|≤|≥)\s*(.*)$/); if (m) { setRecQ({ '<=': '≤', '>=': '≥' }[m[1]] || m[1]); setRecV(m[2]); } else setRecV(v); }} placeholder="e.g. 0.25" /><div className="helper">Typing &lt;= or &gt;= sets the qualifier</div></Field>
          <div className="muted anno" style={{ alignSelf: 'end' }}>Readings from an analyzer fill their row here with value, qualifier and source; accept or override them in place (D-Q7). A capped value that cannot decide the category returns "Result range does not allow interpretation".</div></div>
        <div className="row-actions"><Btn disabled={!recV} onClick={() => { setReadings(readings.map(r => r.drug === recFor ? { ...r, raw: (recQ === '=' ? '' : recQ) + recV + ' µg/mL', source: 'Manual', interp: 'S' } : r)); log(`Reading entered for ${recFor}: ${recQ === '=' ? '' : recQ}${recV} µg/mL`); setRecFor(null); }}>Save reading</Btn><Btn kind="ghost" onClick={() => setRecFor(null)}>Cancel</Btn></div></div>) : null;
  const missing = [...ex.report.checklist.filter(c => typeof c === 'string' && c.startsWith('✗')).map(c => c.slice(2)), ...ex.report.checklist.filter(c => Array.isArray(c) && c[0] === 'ast' && !validated).map(() => 'AST run 1 must be validated before final release.'), ...ex.report.checklist.filter(c => Array.isArray(c) && c[0] === 'program' && !program).map(() => 'Program is required before final release.')];
  const releasePartial = () => { setReleases([...releases, ['Partial', '02/10/2026 10:15 · ' + ex.tech]]); log(`Partial report released as version ${releases.length + 1}`); };
  const SECTIONS = [['1', 'Case information'], ['2', 'Initial testing'], ['4', 'Culture'], ['5', 'Isolates'], ['6', 'AST / DST'], ['7', 'Additional testing'], ['10', 'Report'], ['12', 'Timeline']];
  return <MediaCtx.Provider value={{ media, setMedia }}><NotesCtx.Provider value={{ notes, addNote }}><div>
    <Breadcrumb noTrailingSlash style={{ marginBottom: '.5rem' }}><BreadcrumbItem href="#">Home</BreadcrumbItem><BreadcrumbItem href="#">Microbiology</BreadcrumbItem><BreadcrumbItem href="#">Worklist</BreadcrumbItem><BreadcrumbItem isCurrentPage>Case {ex.lab}</BreadcrumbItem></Breadcrumb>
    <div className="casebar" {...buildAttrs('header')} role="region" aria-label={t('micro.case.bar', 'Case summary')}>
      <b>{ex.lab}</b><span className="muted" style={{ fontSize: 13 }}>{ex.patient.split(' · ')[0]}</span>
      <Tag kind={STATUS_KIND[status]}>{status}</Tag>{(ex.statusTags || []).map(x => <Tag key={x} kind="purple">{x}</Tag>)}{ex.priority === 'STAT' && <Tag kind="red">STAT</Tag>}
      <nav className="jump" aria-label={t('micro.case.jumpTo', 'Jump to section')}>{SECTIONS.map(([n, l]) => <a key={n} href={'#sec-' + n} onClick={e => { e.preventDefault(); const el = document.getElementById('sec-' + n); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>{t('micro.case.section.' + n, l)}</a>)}</nav>
      <span style={{ flex: 1 }}></span>
      <Btn kind="secondary" disabled={status === 'Final'} onClick={releasePartial}>{t('microbiology.case.report.releasePartial', 'Release partial report')}</Btn>
      <Btn disabled={missing.length > 0 || status === 'Final'} onClick={() => setConfirmFinal(true)}>{missing.length > 0 && status !== 'Final' ? t('micro.release.final.missingCount', 'Release final ({count} missing)').replace('{count}', missing.length) : t('micro.release.final', 'Release final')}</Btn>
      <span className="new3">v3 D-281</span>
    </div>
    {confirmFinal && <ReleaseConfirm count={printed.length} version={releases.length + 1} onCancel={() => setConfirmFinal(false)} onConfirm={() => { setReleases([...releases, ['Final', '02/10/2026 10:15 · ' + ex.tech]]); setConfirmFinal(false); log(`Final report released as version ${releases.length + 1}; case locked`); }} />}
    <h1 style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>Case {ex.lab}{ex.priority === 'STAT' && <Tag kind="red">STAT</Tag>}</h1>

    <div className="hdr">
      <div><b>Patient</b>{ex.patient}</div>
      <div><b>{ex.samplesLabel}</b>{ex.sampleSummary}</div>
      <div><b>Body site</b>{ex.site}</div>
      {ex.setLines && <div><b>{t('microbiology.case.cultureSet.summary', '{test}: {sets} sets, {bottles} bottles').replace('{test}', 'Blood culture').replace('{sets}', String(ex.setLines.length)).replace('{bottles}', '4')}</b>{ex.setLines.map(l => <div key={l} className="muted" style={{ fontSize: 12 }}>{l}</div>)}</div>}
      <div><b>{t('microbiology.case.program', 'Program')}</b>{program || <span className="muted">{t('microbiology.case.programNotSet', 'Program not set')}</span>} {track && <Tag kind="gray">{track} track</Tag>} <span className="muted anno">(Case information; drives questions and exports, D-178)</span></div>
      <div><b>{t('microbiology.case.labUnit', 'Lab unit')}</b>{labUnit} <button className="cds--btn cds--btn--ghost cds--btn--sm" onClick={() => setChangingLU(!changingLU)}>{t('microbiology.case.changeLabUnit', 'Change lab unit')}</button></div>
      <div {...buildAttrs('header')}><b>{t('micro.case.status', 'Status')} <span className="new3">v3</span></b><Tag kind={STATUS_KIND[status]}>{t('micro.case.status.' + status, status)}</Tag>{(ex.statusTags || []).map(x => <Tag key={x} kind="purple">{x}</Tag>)}<div style={{ fontSize: 12, color: '#525252' }}>{ex.stage.map(([k, l]) => l).join(', ')}</div><div className="muted anno" style={{ fontSize: 12 }}>Status worked out from the releases; Stage (the existing current step) is its subtitle; tags from open referrals and amendments; nothing stored (D-Q6, D-277, D-281)</div></div>
      {ex.related ? <div><b>{t('microbiology.case.relatedOnSpecimen', 'Also on this specimen')}</b><a href="#" style={{ color: '#0f62fe' }}>{ex.related}</a></div> : <div><b>Priority</b>{ex.priority}</div>}
      <div className="row-actions" style={{ marginTop: 0 }}><Btn kind="secondary">Log critical notification</Btn><Btn kind="tertiary">Report NCE</Btn><Btn kind="tertiary" onClick={() => setHistOpen(!histOpen)}>{t('microbiology.case.patientHistory', 'Patient history')} ({ex.history.length})</Btn></div>
    </div>
    {histOpen && <PatientHistory ex={ex} />}
    {changingLU && <div className="inline-panel" style={{ marginTop: '-0.5rem', marginBottom: '1rem', background: '#fff', border: '1px solid #e0e0e0' }}>
      <div className="grid"><Field label="New lab unit" req><Sel value={labUnit} onChange={e => setLabUnit(e.target.value)}><option>TB</option><option>Microbiology</option></Sel></Field>
        <div className="muted anno" style={{ alignSelf: 'end' }}>Relabels the case: it moves to that lab unit's Worklist and edit rights follow that lab unit. The Program and tests do not change; if that lab unit already has a case for this order and sample type, it offers to join it. Clinical lab units only (D-120). Recorded on the Timeline; no reason needed; not available after final release.</div></div>
      <div className="row-actions"><Btn onClick={() => setChangingLU(false)}>Save</Btn><Btn kind="ghost" onClick={() => setChangingLU(false)}>Cancel</Btn></div>
    </div>}
    {ex.why && <Anno style={{ marginBottom: '1rem' }}>{ex.why}</Anno>}

    {incoming.length > 0 && <Section bk="incoming" n="!" title={t('microbiology.case.section.incoming', 'Incoming results')} isNew cls="incoming" tags={<Tag kind="warm-gray">{incoming.length} waiting</Tag>}>
      <p className="muted" style={{ marginBottom: '.75rem' }}>Results for tests not yet on this case. One click places a result where you choose; the system does not guess. Placed in the wrong place? Use Move result. A result for a test already on the case goes straight to its row.</p>
      <Table size="sm"><TableHead><TableRow><TableHeader>Test</TableHeader><TableHeader>Value</TableHeader><TableHeader>Source</TableHeader><TableHeader>Received</TableHeader><TableHeader>{t('microbiology.case.incoming.placeIn', 'Place in')}</TableHeader></TableRow></TableHead>
        <TableBody>{incoming.map(i => { const opts = ['Initial testing', ...isolates.map(s => 'Isolate: ' + s.id), ...isolates.map(s => 'AST / DST: ' + s.id), 'Additional testing'];
          const plus = o => i.linked && !o.startsWith('Initial') && !o.startsWith('Additional') ? ` + ${i.linked.length} linked` : '';
          return <TableRow key={i.id}><TableCell>{i.test}</TableCell><TableCell>{i.value}{i.linked && <div className="muted" style={{ marginTop: 4 }}>{t('microbiology.case.incoming.linkedResults', '{count} linked results from the same message').replace('{count}', i.linked.length)}: {i.linked.map(l => l[0] + ' ' + l[1]).join('; ')}</div>}</TableCell><TableCell>{i.source}</TableCell><TableCell>{i.at}</TableCell>
          <TableCell><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{opts.map(o => <Btn key={o} kind="tertiary" onClick={() => accept(i.id, o)}>{o}{plus(o)}</Btn>)}</div></TableCell></TableRow>; })}</TableBody></Table>
      <p className="muted anno" style={{ marginTop: '.5rem' }}>Results from one message linked to one organism stay together (FR-09.6). A placed or moved result shows Placed by or Moved from, and the validator confirms the placement (FR-09.7).</p>
    </Section>}

    <Section bk="caseInfo" n="1" title={t('microbiology.case.section.caseInfo', 'Case information')} isNew tags={<span className="muted">&nbsp;moved from order entry · ◆ = needed before final report · Needed for surveillance never blocks</span>}>
      <div className="grid">
        {ex.received && <>
          <Field label="Sending laboratory"><Inp disabled value={ex.received.lab} /><div className="helper">From Tested elsewhere at order entry (Organizations list)</div></Field>
          <Field label={t('microbiology.case.reportedIdentification', 'Reported identification')}><Inp disabled value={ex.received.reportedId} /><div className="helper">The sender's organism; ISO-1 keeps it beside the identification made here</div></Field>
          <Field label={t('microbiology.case.originalSpecimenType', 'Original specimen type')} final><Sel defaultValue={ex.received.original} aria-label="Original specimen type"><option>Urine</option><option>Blood</option><option>Wound swab</option><option>Sputum</option><option>Cerebrospinal fluid</option></Sel></Field>
          <Field label="Collected"><Inp disabled value={ex.received.collected} /><div className="helper">The original specimen's collection date (from the line list)</div></Field>
          <Field label={t('microbiology.case.receivedAt', 'Received at {laboratory}').replace('{laboratory}', ex.received.lab)}><Inp value={rcvAt} onChange={e => setRcvAt(e.target.value)} aria-label="Received at sending laboratory" placeholder="DD/MM/YYYY" /><div className="helper">When the sending laboratory received the specimen (optional)</div></Field>
          <Field label={t('microbiology.case.receivedAt', 'Received at {laboratory}').replace('{laboratory}', 'CPHL')}><Inp disabled value={ex.received.here} /><div className="helper">The Isolate sample's received date</div></Field>
        </>}
        <Field label={t('microbiology.case.program', 'Program')} final><Sel value={program} onChange={e => setProgram(e.target.value)} aria-label="Program"><option value="">Select</option>{Object.keys(PROGRAM_TRACKS).map(p => <option key={p}>{p}</option>)}</Sel><div className="helper">Programs with Show on Microbiology case (Programs admin). Its questionnaire shows below; its track decides the exports.</div></Field>
        <Field label={t('microbiology.case.purpose', 'Culture purpose')} req><Sel defaultValue="Diagnostic"><option>Diagnostic</option><option>Screening</option><option>Treatment follow-up</option><option>Survey or study</option><option>EQA / proficiency</option></Sel><div className="helper">Default Diagnostic. Only Diagnostic counts in the antibiogram and GLASS.</div></Field>
        <Field label="Patient origin" final><Sel value={origin} onChange={e => setOrigin(e.target.value)} aria-label="Patient origin"><option>Outpatient</option><option>Inpatient</option><option>ICU</option><option>Emergency</option></Sel></Field>
        <Field label="Date of admission" surv={origin !== 'Outpatient'} missing={admMissing}>{origin !== 'Outpatient' ? <Inp value={admission} onChange={e => setAdmission(e.target.value)} placeholder="DD/MM/YYYY" aria-label="Date of admission" /> : <Inp disabled placeholder="Outpatients are not admitted" />}</Field>
        {ex.info.ward && <Field label="Ward"><Inp defaultValue={ex.info.ward} /></Field>}
        {track === 'Bacterial' && <Field label={t('microbiology.case.infectionOrigin', 'Infection origin (derived)')}><Inp disabled value={origin === 'Outpatient' ? 'Community origin' : admission ? 'Hospital origin (collected 5 days after admission)' : t('microbiology.case.infectionOrigin.unknown', 'Unknown (no admission date)')} /><div className="helper">GLASS rule: more than 2 days after admission is hospital origin. Shown for Bacterial-track Programs.</div></Field>}
        <Field label="Clinical diagnosis / reason for test"><Inp defaultValue={ex.info.diagnosis} /></Field>
        {(QUESTIONNAIRES[program] || []).length > 0 && <ProgramQuestionnaire key={program} program={program} />}
        {ex.setLines && <Field label="Number of sets"><Inp disabled value={ex.info.sets} /><div className="helper">Counted from the collected bottles</div></Field>}
        <div style={{ gridColumn: '1 / -1' }}><div className="muted anno" style={{ fontSize: 12, marginBottom: 4 }}>{t('microbiology.case.samples', 'Samples')} <span className="new">v2</span> one row per sample, each with its own body site and collection time (FR-04.3)</div>
          <Table size="sm" style={{ background: '#fff' }}><TableHead><TableRow><TableHeader>Sample</TableHeader><TableHeader>Type · container</TableHeader><TableHeader>Set</TableHeader><TableHeader>Body site · side</TableHeader><TableHeader>Collected</TableHeader><TableHeader>Collector</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
            <TableBody>{ex.info.samples.map(s => <TableRow key={s[0]}>{s.map((c, j) => <TableCell key={j}>{c}</TableCell>)}<TableCell><Btn kind="ghost">Correct site</Btn></TableCell></TableRow>)}</TableBody></Table>
          <div className="muted" style={{ marginTop: 4 }}>{ex.info.samplesNote}</div></div>
        <div className="field" style={{ gridColumn: '1 / -1' }}><label>{t('microbiology.orderDetail.clinicalHistory', 'Clinical history')}</label><Area rows={4} maxLength={4000} defaultValue={ex.info.history} style={{ width: '100%', background: '#fff', border: 0, borderBottom: '1px solid #8d8d8d', padding: 8, fontFamily: 'inherit', fontSize: 14 }} /><div className="helper" style={{ textAlign: 'right' }}>{ex.info.history.length} of 4000 characters</div></div>
      </div>
      <div className="muted" style={{ marginTop: '.5rem' }}>{ex.info.appliesTo}</div>
      <div style={{ marginTop: '1rem' }}>
        <label className="muted">{t('microbiology.case.priorAntibiotics', 'Prior antibiotics')}</label>
        <Table size="sm" style={{ marginTop: 4 }}><TableHead><TableRow><TableHeader>Agent</TableHeader><TableHeader>Date started</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
          <TableBody>{ex.info.priorAb.map(a => <TableRow key={a[0]}><TableCell>{a[0]}</TableCell><TableCell>{a[1]}</TableCell><TableCell><Btn kind="ghost">Remove</Btn></TableCell></TableRow>)}</TableBody></Table>
        <div className="row-actions"><Btn kind="ghost">+ Add antibiotic</Btn></div>
      </div>
    </Section>

    <Section bk="initial" n="2" title={t('microbiology.case.section.initialTesting', 'Initial testing')} isNew>
      {initial.length ? <CaseTestTable rows={initial} labOnly={labOnly} setLabOnly={setLabOnly} /> : <div className="muted">{ex.noInitial}</div>}
      <div className="muted" style={{ marginTop: '.4rem' }}>Every row enters its result the same way: Enter or Edit opens the full-width editor for the test's result type (coded list, graded observations, several components, or a number with unit). The same editor is used in Additional testing. Reagent lot is required when the test's M-12 link is Required.</div>
      {adding === 'initial' ? <TestChooser ch={ex.choosers.initial} onCancel={() => setAdding(null)} onAdd={p => { setInitial([...initial, ...p.map((x, k) => ({ id: 'add' + initial.length + k, test: x, type: 'components', components: GRAM_C.map(c => ({ c, v: '', opts: ['', ...GRADES] })), display: '', flag: '', by: '', state: 'Not started', addedBy: ex.tech }))]); p.forEach(x => log(`Added ${x} to Initial testing, on the specimen`)); setAdding(null); }} />
        : <div className="row-actions"><Btn kind="tertiary" onClick={() => setAdding('initial')}>+ {t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Btn></div>}
    </Section>

    <Section bk="referral" n="3" title="Referral point" isNew cls="ref" tags={<span className="muted anno">&nbsp;existing component (Clinical Order Entry v4 Refer out, built): reuse, do not re-implement. v2 adds only what to refer</span>}>
      <p className="muted" style={{ marginBottom: '.5rem' }}>Same Refer out section, form, fields and statuses as order entry. Saved referrals are dispatched from Sample Shipment.</p>
      <Table size="sm"><TableHead><TableRow><TableHeader>Sample</TableHeader><TableHeader>Sample type</TableHeader><TableHeader>Tests</TableHeader><TableHeader>Reference laboratory</TableHeader><TableHeader>Status</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
        <TableBody>
          {ex.referrals.map(r => <TableRow key={r[0] + r[2]}><TableCell>{r[0]}{r[1] && <div className="muted">{r[1]}</div>}</TableCell><TableCell>{r[2]}</TableCell><TableCell>{r[3]}</TableCell><TableCell>{r[4]}</TableCell><TableCell><Tag kind="teal">{r[5]}</Tag></TableCell><TableCell><Btn kind="ghost">Edit</Btn></TableCell></TableRow>)}
          {!ex.referrals.length && referOpen !== 'saved' && <TableRow><TableCell colSpan={6} className="muted">Nothing referred.</TableCell></TableRow>}
          {referOpen === 'saved' && <TableRow><TableCell>{ex.sampleIds[0]}</TableCell><TableCell>{ex.sampleType}</TableCell><TableCell>{ex.referTests[0]}</TableCell><TableCell>{ex.refLabs[0]}</TableCell><TableCell><Tag kind="blue">Requested</Tag></TableCell><TableCell style={{ whiteSpace: 'nowrap' }}><Btn kind="ghost">Edit</Btn><Btn kind="ghost">Dispatch</Btn></TableCell></TableRow>}
        </TableBody></Table>
      {referOpen === true ? <div className="inline-panel">
        <div className="grid">
          <Field label="Reference laboratory" req><Inp list="ref-labs" defaultValue={ex.refLabs[0]} /><datalist id="ref-labs">{ex.refLabs.map(l => <option key={l} value={l} />)}</datalist></Field>
          <Field label="Reason for referral" req><Sel defaultValue="Test not available"><option>Test not available</option><option>Confirmation</option><option>Quality control</option><option>Equipment failure</option></Sel></Field>
          <Field label="Referrer"><Inp list="refr" defaultValue={ex.tech} /><datalist id="refr"><option value={ex.tech} /></datalist></Field>
          <Field label="Hand-off date"><Inp defaultValue="02/10/2026" /></Field>
          <Field label="Hand-off time"><Inp defaultValue="10:30" /></Field>
          <Field label="Expected return date"><Inp defaultValue="09/10/2026" /></Field>
        </div>
        <div style={{ marginTop: '.75rem' }}><label className="muted">Tests to refer</label>
          <div>{ex.referTests.map((x, k) => <label key={x} style={{ marginRight: 16 }}><Inp type="checkbox" defaultChecked={k === 0} /> {x}</label>)}</div>
          <Notice kind="info" style={{ marginTop: '.5rem' }}>Tests not referred stay here, but this {ex.sampleType.toLowerCase()} leaves the laboratory. <Btn kind="ghost">Aliquot first</Btn></Notice></div>
        <Field label="Notes"><Inp placeholder="Optional" /></Field>
        <div className="row-actions"><Btn onClick={() => setReferOpen('saved')}>Save referral</Btn><Btn kind="ghost" onClick={() => setReferOpen(false)}>Cancel</Btn></div>
      </div>
      : <div className="row-actions"><Btn kind="secondary" onClick={() => setReferOpen(true)}>{t('microbiology.case.referRemaining', 'Refer remaining work')}</Btn><span className="muted" style={{ alignSelf: 'center' }}>Opens the same Refer out panel as order entry with this case's tests ticked. A single test or an isolate is referred from its row menu.</span></div>}
    </Section>

    <Section bk="culture" n="4" title={t('microbiology.case.section.culture', 'Culture')} tags={<><span className="new">v2 fields</span> <span className="new3">v3 culture tests</span></>}>
      <p className="muted" style={{ marginBottom: '.5rem' }}>{ex.cultureNote} Each culture is marked positive or no growth on its own; every positive row shows when it turned positive and the time to positivity to the minute. Extend incubation keeps an open row going longer, with a reason.</p>
      <Table size="sm"><TableHead><TableRow><TableHeader>Container</TableHeader><TableHeader>Medium · lot · atmosphere · °C</TableHeader><TableHeader>Incubation</TableHeader><TableHeader>Inoculated → {t('microbiology.case.inoc.ends', 'Incubation ends')}</TableHeader><TableHeader>{t('microbiology.case.inoc.nextCheck', 'Next check')}</TableHeader><TableHeader>State</TableHeader><TableHeader>Read log</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
        <TableBody>{cultureTests.map(ct => { const rows = ordered.filter(o => o.r.ct === ct.name); return <React.Fragment key={ct.name}>
          <TableRow className="ct-head"><TableCell colSpan={8}><b>{ct.name}</b> <Tag kind={/Positive|Growth/.test(ct.result) ? 'green' : 'blue'}>{ct.result}</Tag> <Tag kind={ct.state === 'Validated' ? 'green' : ct.state === 'Awaiting validation' ? 'warm-gray' : 'gray'}>{ct.state}</Tag>{ct.added.startsWith('Added by') ? <Tag kind="cool-gray">{ct.added}</Tag> : <span className="muted"> {ct.added}</span>}
            <span className="muted anno"> · culture test on the order; its result is the culture result (D-Q4){rows.length ? `, ${rows.length} container${rows.length > 1 ? 's' : ''}` : ''}</span></TableCell></TableRow>
          {rows.map(({ r, i, depth }) => <React.Fragment key={r.cid}><TableRow className={depth ? 'sub' : ''}>
          <TableCell style={depth ? { paddingLeft: 12 + depth * 20 } : {}}>{depth ? <span className="muted">↳ Subculture </span> : null}<span className="muted">{r.cid}</span>{r.set && <div className="muted">{r.set}</div>}{r.purpose && <div className="muted">{r.purpose}</div>}</TableCell>
          <TableCell>{r.medium}<div className="muted">{r.nt ? <Tag kind="warm-gray">{t('microbiology.case.inoc.notTrackedTag', 'Not tracked')}</Tag> : r.lot} · {r.atm} · {r.temp} °C</div></TableCell>
          <TableCell>{r.dur} {r.unit}{(r.ext || []).map((x, j) => <div key={j}><Tag kind="cyan">+{x.n} {x.unit.toLowerCase()} {t('microbiology.case.inoc.extended', 'extended')}</Tag></div>)}{(r.ext || []).length > 0 && <div className="muted">{(r.ext || []).length} {(r.ext || []).length > 1 ? 'extensions' : 'extension'}</div>}<div className="muted">{r.bottle ? 'Continuous (' + r.analyzer + ')' : t('microbiology.case.inoc.checkEvery', 'Check every') + ' ' + r.every + ' ' + r.eunit}</div></TableCell>
          <TableCell>{timeFor === r.cid ? <div><Inp value={timeVal} onChange={e => setTimeVal(e.target.value)} style={{ width: 120 }} aria-label="Inoculated at" /> <Btn kind="ghost" onClick={() => { setInoc(inoc.map(x => x.cid === r.cid ? { ...x, start: timeVal, log: x.log } : x)); setTimeFor(null); }}>Save</Btn></div>
            : <>{r.start} → {r.ends}{r.log.length === 0 && r.state !== 'Positive' && <> <Btn kind="ghost" onClick={() => { setTimeFor(r.cid); setTimeVal(r.start); }}>{t('microbiology.case.inoc.editTime', 'Edit time')}</Btn></>}</>}<div className="muted">{t('microbiology.case.inoc.dayOf', 'Day')} {r.day} of {r.dur + (r.unit === 'Days' ? (r.ext || []).reduce((a, x) => a + (x.unit === 'Days' ? x.n : 0), 0) : 0)}</div></TableCell><TableCell>{r.next}</TableCell>
          <TableCell>{r.state === 'Check due' ? <Tag kind="warm-gray">{t('microbiology.case.inoc.checkDue', 'Check due')}</Tag> : r.state === 'Positive' ? <PosTag r={r} onEdit={() => setPosFor(r.cid)} /> : r.state === 'No growth' ? <Tag kind="gray">No growth</Tag> : <Tag kind="blue">Incubating</Tag>}</TableCell>
          <TableCell className="muted" style={{ maxWidth: 220 }}>{r.log.map((l, j) => <div key={j}>{l}</div>)}</TableCell>
          <TableCell>{r.state === 'Check due' && (reading === i ? <div><Sel onChange={e => markChecked(i, e.target.value)} defaultValue="" title="Dictionary: Culture reading" aria-label="Reading"><option value="" disabled>Reading (Dictionary: Culture reading)</option><option>No growth</option><option>Normal flora</option><option>Mixed growth</option><option>Significant growth</option></Sel></div> : <Btn kind="ghost" onClick={() => setReading(i)}>{t('microbiology.case.inoc.recordReading', 'Record reading')}</Btn>)}
            {(r.state === 'Check due' || r.state === 'Incubating') && <div><Btn kind="ghost" onClick={() => setPosFor(r.cid)}>{t('microbiology.case.inoc.markPositive', 'Mark positive')}</Btn><Btn kind="ghost" onClick={() => setOutcome(i, 'No growth')}>{t('microbiology.case.inoc.markNoGrowth', 'Mark no growth')}</Btn></div>}
            <div style={{ position: 'relative' }}><Btn kind="ghost" onClick={() => setAddMenu(addMenu === r.cid ? null : r.cid)}>{t('microbiology.case.culture.add', 'Add')} ▾</Btn>{addMenu === r.cid && <div className="menu">
              <button onClick={() => { setEditChild(addChild('Gram stain, culture', r.cid)); setAddMenu(null); }}>{t('microbiology.case.gram.add', 'Gram stain')}</button>
              <button onClick={() => { setChooserFor(r.cid); setAddMenu(null); }}>{t('microbiology.case.growth.testOnCulture', 'Test on this culture')}</button>
              <button onClick={() => { setSubForm(true); setSubFrom(r.cid); setAddMenu(null); }}>{t('microbiology.case.subculture', 'Subculture')}</button></div>}</div>
            {r.state !== 'No growth' && r.state !== 'Contaminated' && !(r.bottle && r.state === 'Positive') && <div><Btn kind="ghost" onClick={() => setExtFor(r.cid)}>{t('microbiology.case.inoc.extend', 'Extend incubation')}</Btn></div>}
            <div><Btn kind="ghost">{t('microbiology.case.printLabel', 'Print label')}</Btn></div>
            <div><Btn kind="ghost" onClick={() => setNotesOpen(notesOpen === r.cid ? null : r.cid)}>{t('microbiology.case.notes.count', 'Notes ({count})').replace('{count}', (notes[r.cid] || []).length)}</Btn></div></TableCell></TableRow>
          {notesOpen === r.cid && <TableRow className="expand"><TableCell colSpan={8}><NotesPanel id={r.cid} bare underCulture /></TableCell></TableRow>}
          {micro.filter(m => m.from === r.cid).map(m => <React.Fragment key={m.id}><TableRow className="sub">
            <TableCell style={{ paddingLeft: 12 + (depth + 1) * 20 }}><span className="muted">↳ Test </span><span className="muted">{m.id}</span>{m.rule && <div><span className="cds--tag cds--tag--teal" style={{ whiteSpace: 'normal' }}>{t('microbiology.case.addedByRule', 'Added by rule')}: {m.rule}</span></div>}</TableCell>
            <TableCell colSpan={3}>{m.test} {m.inLabOnly && <Tag kind="gray">{t('microbiology.case.inLabOnly', 'In lab only')}</Tag>}<div>{m.display ? <b>{m.display}</b> : <span className="muted">{t('microbiology.case.gram.noResult', 'No result yet')}</span>}</div></TableCell>
            <TableCell className="muted">{m.at}</TableCell>
            <TableCell><Tag kind={m.state === 'Validated' ? 'green' : m.state === 'Awaiting validation' ? 'warm-gray' : 'gray'}>{m.state}</Tag></TableCell>
            <TableCell className="muted">{m.by}</TableCell>
            <TableCell>{!m.display ? <Btn kind="tertiary" onClick={() => setEditChild(m.id)}>{t('microbiology.case.gram.enterResult', 'Enter result')}</Btn> : m.state !== 'Validated' && <><Btn kind="ghost" onClick={() => setEditChild(m.id)}>{t('common.edit', 'Edit')}</Btn><Btn kind="ghost" onClick={() => setMicro(micro.map(x => x.id === m.id ? { ...x, state: 'Validated' } : x))}>{t('label.validate', 'Validate')}</Btn></>}
              <div><Btn kind="ghost" onClick={() => setMicro(micro.map(x => x.id === m.id ? { ...x, inLabOnly: !x.inLabOnly } : x))}>{m.inLabOnly ? t('microbiology.case.inLabOnly.off', 'Turn off In lab only') : t('microbiology.case.inLabOnly.on', 'Mark In lab only')}</Btn></div>
              <Btn kind="ghost" onClick={() => setNotesOpen(notesOpen === m.id ? null : m.id)}>{t('microbiology.case.notes.count', 'Notes ({count})').replace('{count}', (notes[m.id] || []).length)}</Btn></TableCell></TableRow>
            {editChild === m.id && <TableRow><TableCell colSpan={8} style={{ padding: 0 }}><ChildEditor m={m} onCancel={() => setEditChild(null)} onSave={cs => { saveChild(m.id, cs); setEditChild(null); }} /></TableCell></TableRow>}
            {notesOpen === m.id && <TableRow className="expand"><TableCell colSpan={8}><NotesPanel id={m.id} bare underCulture printable={!m.inLabOnly} /></TableCell></TableRow>}
          </React.Fragment>)}
          </React.Fragment>)}
        </React.Fragment>; })}
          {!ordered.length && ex.received && <TableRow><TableCell colSpan={8}><Tag kind="green">{t('microbiology.case.receivedIsolateOutcome', 'Growth (received isolate)')}</Tag> <span className="muted anno">No primary specimen is inoculated. A purity or identification subculture is added from ISO-1 as on any isolate (FR-02.13).</span></TableCell></TableRow>}</TableBody></Table>
      {posFor && <PositiveAtPanel row={inoc.find(r => r.cid === posFor)} onCancel={() => setPosFor(null)} onSave={v => { markPositive(posFor, v); setPosFor(null); }} />}
      {extFor && <ExtendPanel row={inoc.find(r => r.cid === extFor)} onCancel={() => setExtFor(null)} onSave={x => { setInoc(inoc.map(r => r.cid === extFor ? { ...r, ends: x.ends, ext: [...(r.ext || []), x], log: [...r.log, `${t('microbiology.case.inoc.extendedLog', 'Incubation extended')} ${x.n} ${x.unit} (${x.reason}); now ends ${x.ends} · ${ex.tech}`] } : r)); setExtFor(null); }} />}
      {chooserFor && <div><div className="muted" style={{ marginTop: '.5rem' }}>{t('microbiology.case.growth.testOnCulture', 'Test on this culture')}: {chooserFor}</div><TestChooser ch={ex.choosers.culture} onCancel={() => setChooserFor(null)} onAdd={p => { p.forEach(x => addChild(x, chooserFor)); setChooserFor(null); }} /></div>}
      {subForm && <div className="inline-panel"><div className="grid">
        <Field label={t('microbiology.case.subculture.fromCulture', 'From culture')} req><Sel value={subFrom} onChange={e => setSubFrom(e.target.value)}>
          <option value="" disabled>Select a culture</option>
          {[...inoc.filter(r => r.state === 'Positive'), ...inoc.filter(r => r.state !== 'Positive')].map(r => <option key={r.cid} value={r.cid}>{r.cid}, {r.medium}, {r.state === 'Positive' ? 'positive' : r.state.toLowerCase()}</option>)}</Sel><div className="helper">Positive cultures first; any culture can be subcultured</div></Field>
        {subFrom && (inoc.find(r => r.cid === subFrom) || {}).state !== 'Positive' && <Field label={t('microbiology.case.subculture.purpose', 'Purpose')} req><Sel value={subPurpose} onChange={e => setSubPurpose(e.target.value)} aria-label="Purpose"><option value="" disabled>Select</option><option>Enrichment</option><option>Blind or terminal subculture</option><option>Purity</option><option>Other</option></Sel><div className="helper">Asked when the culture has no growth · Dictionary: Subculture purpose</div></Field>}
        <MediumPicker onPrefill={m => setSubAtm(m.atm)} />
        <Field label="Atmosphere" req><Sel value={subAtm} onChange={e => setSubAtm(e.target.value)}>{ATMS.map(a => <option key={a}>{a}</option>)}</Sel></Field>
        <Field label="Container identifiers" req>{subIds(subFrom, subCount).map(id => <Inp key={id} defaultValue={id} style={{ marginBottom: 4 }} />)}{!subFrom && <Inp disabled placeholder="Generated from the culture" />}<div className="helper">The next numbers for this culture; editable</div></Field></div>
        <Btn kind="ghost" onClick={() => setSubCount(subCount + 1)}>{t('microbiology.case.subculture.addMedium', '+ Add another medium')}</Btn>{subCount > 1 && <span className="muted"> {subCount} subcultures, one row each</span>}
        <div className="row-actions"><Btn onClick={addSub}>Add {subCount > 1 ? subCount + ' subcultures' : 'subculture'}</Btn><Btn kind="ghost" onClick={() => { setSubForm(false); setSubCount(1); }}>Cancel</Btn></div></div>}
      <p className="muted" style={{ marginTop: '.4rem' }}>Every culture and subculture row has an Add menu: Gram stain (the chooser with Gram stain, culture already picked), Test on this culture (the standard chooser, filtered to tests set up for this sample type or Isolate: microscopy, rapid ID, Xpert on a culture), Subculture. Each test's results come from the test catalog; In lab only decides whether it reports, defaulted from the catalog (microscopy on, Gram off). A test with no result yet (added, or added by a reflex rule) shows Enter result.</p>
      {!ex.received && <div className="inline-panel">
        <div className="muted" style={{ marginBottom: '.5rem' }}>+ Start inoculation</div>
        <TemplateProposal template={ex.template} onApply={() => {}} />
        <div className="muted" style={{ marginBottom: '.5rem' }}>Or add one row (pre-filled from the previous row):</div>
        <div className="grid">
          <MediumPicker onPrefill={m => { setInocAtm(m.atm); setInocTemp(String(m.temp)); setInocMed(m.name); setPickCt(''); }} />
          <Field label="Atmosphere" req><Sel value={inocAtm} onChange={e => setInocAtm(e.target.value)}>{ATMS.map(a => <option key={a}>{a}</option>)}</Sel><div className="helper">Pre-filled from the medium's usual atmosphere when Inventory records one · Dictionary: Culture atmosphere</div></Field>
          <Field label="Container identifier" req><Inp defaultValue={ex.nextContainer} /></Field>
          <Field label="Temperature (°C)"><Inp value={inocTemp} onChange={e => setInocTemp(e.target.value)} /></Field>
          <Field label={t('microbiology.case.inoc.duration', 'Incubation duration')} req><div style={{ display: 'flex', gap: 8 }}><Inp defaultValue={ex.template.rows[0].dur} style={{ width: '40%' }} /><Sel defaultValue={ex.template.rows[0].unit} style={{ width: '60%' }}><option>Days</option><option>Hours</option></Sel></div></Field>
          <Field label={t('microbiology.case.inoc.checkEvery', 'Check every') + ' (optional)'}><div style={{ display: 'flex', gap: 8 }}><Inp defaultValue={ex.template.rows[0].every} style={{ width: '40%' }} /><Sel defaultValue={ex.template.rows[0].unit} style={{ width: '60%' }}><option>Days</option><option>Hours</option></Sel></div></Field>
        </div>
        {!inocMed && <div className="row-actions"><Btn disabled>{t('micro.inoculate.addRow', 'Inoculate')}</Btn><span className="muted">{t('micro.inoculate.pickMediumFirst', 'Pick a medium to inoculate')}</span></div>}
        {inocMed && (() => { const linked = MEDIUM_CT[inocMed]; const ctName = linked || pickCt; const onOrder = cultureTests.some(c => c.name === ctName);
          return <Notice kind="info" style={{ marginTop: '.75rem' }}><span className="new3">v3</span>{' '}
            {!linked && <><b>{t('micro.inoculate.pickCultureTest', '{medium} is not linked to a culture test. Choose one.').replace('{medium}', inocMed)}</b>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '6px 0' }}><Sel value={pickCt} onChange={e => setPickCt(e.target.value)} aria-label="Culture test"><option value="">Search culture tests</option>{CULTURE_TESTS.map(c => <option key={c}>{c}</option>)}</Sel>
              <label style={{ fontSize: 14 }}><Inp type="checkbox" checked={saveLink} onChange={e => setSaveLink(e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />{t('micro.inoculate.saveMediumLink', 'Link {medium} to {cultureTest} for next time').replace('{medium}', inocMed).replace('{cultureTest}', pickCt || 'it')}</label></div></>}
            {ctName && (onOrder ? <>{t('micro.inoculate.usesCultureTest', 'Uses {cultureTest}, already on this order.').replace('{cultureTest}', ctName)}</> : <b>{t('micro.inoculate.addsCultureTest', '{cultureTest} will be added to this order for {sample}').replace('{cultureTest}', ctName).replace('{sample}', ex.sampleIds[0])}</b>)}
            <div className="muted anno">A test is a culture because media are linked to it in the test catalog; inoculating is what adds it to the order, tagged Added by you and on the Timeline. Several media of one culture test sit under that test (D-Q5).</div>
            <div className="row-actions"><Btn disabled={!ctName} onClick={() => { const cid = ex.nextContainer; if (!onOrder) { setCultureTests([...cultureTests, { name: ctName, result: 'In progress, day 1', state: 'Not started', added: 'Added by ' + ex.tech + ' by inoculating ' + inocMed }]); log(`${ctName} added to the order for ${ex.sampleIds[0]} by inoculating ${inocMed} ${cid}`); } setInoc([...inoc, { cid, ct: ctName, from: '', medium: inocMed, lot: 'Lot selected', atm: inocAtm, temp: +inocTemp || 35, dur: ex.template.rows[0].dur, unit: ex.template.rows[0].unit, every: ex.template.rows[0].every, eunit: ex.template.rows[0].unit, start: SERVER_NOW, ends: addTime(SERVER_NOW, ex.template.rows[0].dur, ex.template.rows[0].unit), next: addTime(SERVER_NOW, ex.template.rows[0].every, ex.template.rows[0].unit), state: 'Incubating', day: 1, log: [] }]); setInocMed(''); }}>{t('micro.inoculate.addRow', 'Inoculate')}</Btn></div>
          </Notice>; })()}
      </div>}
    </Section>

    <Section bk="isolates" n="5" title="Isolates" tags={<span className="muted anno">&nbsp;existing component (M-04, built): reuse, do not re-implement. Drawing abbreviated; v2 additions only as listed (A-16)</span>}>
      <Table size="sm"><TableHead><TableRow><TableHeader>Isolate</TableHeader><TableHeader>{t('microbiology.case.isolate.pickedFrom', 'Picked from')}</TableHeader><TableHeader>Gram / morphology</TableHeader><TableHeader>Organism</TableHeader><TableHeader>ID method · confidence</TableHeader><TableHeader>Significance</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
        <TableBody>{isolates.map(s => <React.Fragment key={s.id}><TableRow><TableCell>{s.id} {s.organism ? <Tag kind="green">Identified</Tag> : <Tag kind="warm-gray">Not identified</Tag>}</TableCell><TableCell className="muted">{s.from}</TableCell><TableCell>{s.gram}</TableCell><TableCell>{s.organism ? <i>{s.organism}</i> : <span className="muted">Identify</span>}{s.received && <div><Tag kind="purple">{t('microbiology.case.receivedFrom', 'Received from {0}').replace('{0}', s.received)}</Tag></div>}{s.reportedId && <div className="muted">{t('microbiology.case.reportedIdentification', 'Reported identification')}: <i>{s.reportedId}</i>{s.reportedId === s.organism ? ' (agrees)' : ''}</div>}</TableCell><TableCell>{s.idm}</TableCell><TableCell><Tag kind={s.sig === 'Clinically significant' ? 'green' : 'gray'}>{s.sig}</Tag></TableCell>
          <TableCell style={{ minWidth: 150 }}><Btn kind="ghost">{s.organism ? 'Re-identify' : 'Identify'}</Btn><Btn kind="ghost">Log critical</Btn><Btn kind="ghost">{t('microbiology.case.printLabel', 'Print label')}</Btn><Btn kind="ghost" onClick={() => setNotesOpen(notesOpen === s.id ? null : s.id)}>{t('microbiology.case.notes.count', 'Notes ({count})').replace('{count}', (notes[s.id] || []).length)} <span className="new">v2</span></Btn></TableCell></TableRow>
          {notesOpen === s.id && <TableRow className="expand"><TableCell colSpan={7}><NotesPanel id={s.id} bare /></TableCell></TableRow>}</React.Fragment>)}</TableBody></Table>
      {ex.isoNote && <Anno style={{ marginTop: '.75rem' }}>{ex.isoNote}</Anno>}
      {isoForm ? <div className="inline-panel"><div className="grid">
        <Field label={t('microbiology.case.isolate.pickedFrom', 'Picked from')} req><Sel value={isoNew.from} onChange={e => setIsoNew({ ...isoNew, from: e.target.value })} aria-label="Picked from"><option value="" disabled>Select a culture with growth</option>{inoc.filter(r => r.state === 'Positive').map(r => <option key={r.cid} value={r.cid}>{r.cid}, {r.medium}</option>)}</Sel><div className="helper">One positive culture can give several isolates</div></Field>
        <Field label="Label" req><Inp value={'ISO-' + (isolates.length + 1)} readOnly /></Field>
        <Field label="Gram stain" req><Sel value={isoNew.gram} onChange={e => setIsoNew({ ...isoNew, gram: e.target.value })} aria-label="Isolate Gram stain"><option value="" disabled>Select</option>{ex.isoGrams.map(g => <option key={g}>{g}</option>)}</Sel></Field>
        <Field label="Significance" req><Sel value={isoNew.sig} onChange={e => setIsoNew({ ...isoNew, sig: e.target.value })}><option>Unknown</option><option>Clinically significant</option><option>Contaminant</option><option>Normal flora</option></Sel></Field></div>
        <div className="row-actions"><Btn disabled={!isoNew.from || !isoNew.gram} onClick={() => { setIsolates([...isolates, { id: 'ISO-' + (isolates.length + 1), from: isoNew.from, gram: isoNew.gram, organism: '', idm: '', sig: isoNew.sig }]); setIsoForm(false); setIsoNew({ from: '', gram: '', sig: 'Unknown' }); }}>Create isolate</Btn><Btn kind="ghost" onClick={() => setIsoForm(false)}>Cancel</Btn></div></div>
      : <div className="row-actions"><Btn kind="tertiary" onClick={() => setIsoForm(true)}>+ Add isolate</Btn></div>}
      <div className="muted anno" style={{ marginTop: '.5rem' }}>Identification history: none. Create and Identify forms unchanged: label, gram stain, colony morphology, significance (Unknown, Clinically significant, Contaminant, Normal flora), organism, ID method, confidence, reason during an amendment. <span className="new3">v3</span> ID method lists the Method dictionary entries marked Used for microbiology identification (MALDI-TOF, VITEK 2, biochemical, molecular; D-Q2), with search. Re-identification reason shows only when an organism is already set.</div>
    </Section>

    <Section bk="ast" n="6" title={t('microbiology.case.section.astDst', 'AST / DST')} tags={<><span className="new">v2 add panel</span> <span className="new3">v3 suggestions, reporting rules</span></>}>
      {sugg.length > 0 && <div className="sugg"><div style={{ fontWeight: 600, marginBottom: 4 }}>{t('micro.case.suggested.title', 'Suggested')} <span className="new3">v3</span> <span className="muted anno" style={{ fontWeight: 400 }}>worked out from the reporting rules and the results each time; nothing is stored until you add or dismiss (R-04)</span></div>
        {sugg.map(x => <div key={x.id} className="sugg-row"><b>{x.name}</b><span className="muted">on {x.on}</span><Tag kind="teal">{x.reason}</Tag><span className="muted">{x.why}</span><span style={{ flex: 1 }}></span>
          <Btn onClick={() => { if (x.kind === 'panel') setPanels([...panels, { name: x.name, on: x.on, added: 'Added by ' + ex.tech + ' from suggestion', method: astMethod + ' · ' + bp, run: 'Not started', val: 'n/a' }]); setSugg(sugg.filter(y => y.id !== x.id)); log(`Added ${x.name} to ${x.on} from suggestion: ${x.reason}`); }}>{t('micro.case.suggested.add', 'Add')}</Btn>
          <div style={{ position: 'relative' }}><Btn kind="ghost" onClick={() => setDismissFor(dismissFor === x.id ? null : x.id)}>{t('micro.case.suggested.dismiss', 'Dismiss')} ▾</Btn>
            {dismissFor === x.id && <div className="menu" role="menu">{[['', t('micro.case.suggested.dismiss.noReason', 'Dismiss')], ['Not indicated', t('micro.case.suggested.reason.notIndicated', 'Not indicated')], ['Tested elsewhere', t('micro.case.suggested.reason.elsewhere', 'Tested elsewhere')], ['Not available', t('micro.case.suggested.reason.notAvailable', 'Not available in this lab')]].map(([v, l]) => <button key={l} role="menuitem" onClick={() => { setSugg(sugg.filter(y => y.id !== x.id)); setDismissFor(null); log(`Dismissed suggestion ${x.name} on ${x.on}${v ? ': ' + v : ''} (comes back only if the condition stops being met and is met again)`); }}>{l}</button>)}</div>}</div></div>)}</div>}
      <Table size="sm" style={{ marginBottom: '.75rem' }}><TableHead><TableRow><TableHeader>Panels</TableHeader><TableHeader>On</TableHeader><TableHeader>Added</TableHeader><TableHeader>Method · standard</TableHeader><TableHeader>Run</TableHeader><TableHeader>Validation</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
        <TableBody>{panels.map(p => <React.Fragment key={p.name + p.on}><TableRow><TableCell>{p.name}</TableCell><TableCell>{p.on}</TableCell><TableCell>{p.added === 'Organism default' ? <><Tag kind="teal">{t('micro.case.panel.default', 'Default')}</Tag> <span className="muted">{p.defaultFor ? t('micro.case.suggested.reason.default', 'Default for {organism} from {sampleType}').replace('{organism}', p.defaultFor.split(', ')[0]).replace('{sampleType}', p.defaultFor.split(', ')[1]) : ''} {p.addedNote}</span></> : p.added.includes('from suggestion') ? <Tag kind="cool-gray">{p.added}</Tag> : p.added}</TableCell><TableCell>{p.method}</TableCell><TableCell>{p.run}</TableCell><TableCell>{p.val === 'Awaiting validation' ? (validated ? <Tag kind="green">Validated</Tag> : <Tag kind="warm-gray">Awaiting validation</Tag>) : <span className="muted">{p.val}</span>}</TableCell><TableCell><Btn kind="ghost" onClick={() => setNotesOpen(notesOpen === 'RUN ' + p.name ? null : 'RUN ' + p.name)}>{t('microbiology.case.notes.count', 'Notes ({count})').replace('{count}', (notes['RUN ' + p.name] || []).length)}</Btn></TableCell></TableRow>
          {notesOpen === 'RUN ' + p.name && <TableRow className="expand"><TableCell colSpan={7}><div className="muted anno">The v2 notes panel, now on each AST run. Notes from reporting rules land here as Send with Result notes while the rule's condition is met; like every note they cannot be removed (D-275, D-291).</div><NotesPanel id={'RUN ' + p.name} bare /></TableCell></TableRow>}</React.Fragment>)}</TableBody></Table>
      <p className="muted" style={{ marginBottom: '.75rem' }}>Each panel is its own run. One positive culture can give several isolates, and one isolate several panels (for a bacterial isolate, for example the VITEK card plus a disk diffusion supplement). When two runs test the same agent, the report uses the run marked Use for reporting for that agent.</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '.75rem' }}>
        <Field label="Isolate" req><Sel>{isolates.map(s => <option key={s.id}>{s.id} {s.organism || '(not identified)'}</option>)}</Sel></Field>
        <Field label="Panel" req><Sel>{panels.map(p => <option key={p.name + p.on}>{p.name}</option>)}</Sel><div className="helper"><a href="#" className="cds--link" style={{ color: '#0f62fe', fontSize: 12 }}>Adjust panel</a> (reason required if changed)</div></Field>
        <Field label="Method" req><Sel value={astMethod} onChange={e => setAstMethod(e.target.value)} aria-label="AST method"><option>MGIT 960 (critical concentration)</option><option>VITEK 2</option><option>Phoenix</option><option>Etest</option><option>Broth microdilution</option><option>Disk diffusion (zone)</option></Sel></Field>
        <Field label="Breakpoint standard" req><Sel value={bp} onChange={e => setBp(e.target.value)}><option>WHO critical concentrations 2024</option><option>CLSI M100 36th ed. (2026)</option><option>EUCAST v15.0 (2025)</option></Sel><div className="helper">{ex.ast.bpHelp}</div></Field>
        <Field label="Entry mode"><Sel value={mode} onChange={e => setMode(e.target.value)}><option>Analyzer</option><option>Manual</option></Sel></Field>
        {mode === 'Analyzer' && <Field label="Analyzer" req><Sel><option>{ex.ast.analyzer}</option></Sel></Field>}
        {mode === 'Analyzer' && <Field label="Card / tube set ID" req><Inp defaultValue={ex.ast.card} /></Field>}
        {astMethod !== 'Disk diffusion (zone)' && <Field label="Reagent lot"><Sel><option>{ex.ast.lot}</option></Sel></Field>}
      </div>
      {astMethod === 'Disk diffusion (zone)' && <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '.75rem', marginBottom: '.75rem' }}><b style={{ fontSize: 14 }}>{t('micro.ast.diskLots', 'Disk lots')}</b> <span className="new3">v3</span> <span className="muted anno">the existing reagent lot picker (M-12); each disk item carries its antibiotic and content, so the content comes from the lot you pick (R-15)</span>
        <Table size="sm" style={{ marginTop: 6 }}><TableHead><TableRow><TableHeader>Antibiotic</TableHeader><TableHeader>Disk lot</TableHeader><TableHeader>Content</TableHeader></TableRow></TableHead>
          <TableBody>{[['Ceftazidime-avibactam', 'CZA disks, lot 2611-04, exp 05/2027', '10/4 µg'], ['Fosfomycin', 'FOS disks, lot 2607-11, exp 02/2027', '200 µg'], ['Colistin', 'Not tracked in Inventory', 'Panel default: 10 µg']].map(r => <TableRow key={r[0]}><TableCell>{r[0]}</TableCell><TableCell><Sel defaultValue={r[1]} aria-label={'Disk lot for ' + r[0]}><option>{r[1]}</option><option>Not tracked in Inventory</option></Sel></TableCell><TableCell>{r[2]}</TableCell></TableRow>)}</TableBody></Table>
        <div className="helper">With no disk lot picked, the panel's default content is used. Zones are interpreted only with a breakpoint for the same content.</div></div>}
      {!ex.ast.agentLabel.startsWith('Drug') && <AstControls lot={ex.ast.lot} analyzer={mode === 'Analyzer' ? ex.ast.analyzer : ''} />}
      <Notice kind="info" style={{ marginBottom: '.75rem' }}>{ex.ast.runNote}</Notice>
      <Table size="sm"><TableHead><TableRow><TableHeader>{ex.ast.agentLabel}</TableHeader><TableHeader>{t('micro.ast.methodStandard', 'Method · standard')}</TableHeader><TableHeader>Raw</TableHeader><TableHeader>Source</TableHeader><TableHeader>Interpretation</TableHeader><TableHeader>{t('microbiology.case.report.include', 'Report')} <span className="new3">v3</span></TableHeader>{ex.ast.sender && <TableHeader>{t('microbiology.case.ast.senderColumn', 'Sender ({laboratory})').replace('{laboratory}', ex.ast.sender)}</TableHeader>}<TableHeader></TableHeader></TableRow></TableHead>
        <TableBody>{readings.map(a => <React.Fragment key={a.drug}><TableRow><TableCell>{a.drug}{a.note && <div className="muted">{a.note}</div>}</TableCell><TableCell>{a.method}{a.raw && <div className="muted" style={{ fontSize: 12 }}>{a.matched || bp}</div>}</TableCell><TableCell>{a.raw || <span className="muted">awaiting</span>}</TableCell><TableCell>{a.override ? <Tag kind="warm-gray">Override</Tag> : a.expert ? <><Tag kind="teal">{t('micro.case.override.source.expertRule', 'Expert rule')}</Tag><div className="muted" style={{ fontSize: 12 }}>{a.expert}</div></> : a.source === 'Analyzer' ? <>{a.source}<div className="muted" style={{ fontSize: 12 }}>{t('micro.ast.source.analyzer', 'From {analyzer}').replace('{analyzer}', ex.ast.analyzer)}</div></> : a.source}</TableCell>
          <TableCell><Tag kind={a.interp === 'R' || a.interp === 'Positive' ? 'red' : a.interp === 'S' ? 'green' : a.interp === 'Pending' ? 'gray' : 'warm-gray'}>{interpLabel(a.interp, bp)}</Tag>{a.instr && <span className="muted"> (instrument: {a.instr})</span>}{a.sender && a.sender !== a.interp && <Tag kind="magenta">{t('microbiology.case.ast.differsFromSender', 'Differs from sender')}</Tag>}</TableCell>
          <TableCell>{(() => { const it = astItem(a.drug); if (!it) return <span className="muted">n/a</span>; const on = reportSel[it.k] !== undefined ? reportSel[it.k] : it.on; return <><Inp type="checkbox" aria-label={'Report ' + a.drug} title={it.d} checked={on} onChange={e => { setReportSel({ ...reportSel, [it.k]: e.target.checked }); log(`${a.drug}: changed from ${e.target.checked ? 'not reported to reported' : 'reported to not reported'}`); }} />{(() => { const changed = reportSel[it.k] !== undefined && reportSel[it.k] !== it.on; return changed || !/^(Report · rule:|On$|No rule)/.test(it.d) ? <div className="muted" style={{ fontSize: 12 }}>{changed ? t('micro.case.reportChoice.changed', 'Changed by you') : it.d}</div> : null; })()}</>; })()}</TableCell>{ex.ast.sender && <TableCell>{a.sender ? <Tag kind="gray">{a.sender}</Tag> : <span className="muted">not tested</span>}</TableCell>}<TableCell>{a.raw ? <Btn kind="ghost">{a.override || a.expert ? 'Revert override' : 'Override'}</Btn> : <span className="muted">awaiting</span>}</TableCell></TableRow>
          {recFor === a.drug && <TableRow className="expand"><TableCell colSpan={20}>{readingForm}</TableCell></TableRow>}</React.Fragment>)}</TableBody></Table>
      {senderDiffs.length > 0 && !validated && <Notice kind="warning" style={{ marginTop: '.75rem' }}><b>{t('microbiology.case.ast.senderDiffers', "Susceptibility differs from the sender's: {agents}").replace('{agents}', senderDiffs.join(', '))}</b> {ackSender ? <Tag kind="green">Acknowledged by {ex.tech}</Tag> : <><span className="muted anno">Acknowledge before validating (FR-02.13c). </span><Inp placeholder="Note (optional)" aria-label="Acknowledgement note" style={{ width: 220 }} /> <Btn kind="tertiary" onClick={() => { setAckSender(true); log(`Acknowledged: susceptibility differs from the sender's (${senderDiffs.join(', ')})`); }}>Acknowledge</Btn></>}</Notice>}
      <div className="row-actions"><Btn kind="secondary" onClick={() => { const f = readings.find(r => !r.raw) || readings[0]; setRecFor(recFor ? null : f.drug); setRecQ('='); setRecV(''); if (!recFor) setTimeout(() => { const e = document.querySelector('tr.expand'); if (e) { e.scrollIntoView({ block: 'center' }); const c = e.querySelector('select, input'); if (c) c.focus(); } }, 50); }}>Record reading</Btn>{ex.ast.blocked ? <button className="cds--btn cds--btn--primary cds--btn--sm" disabled>{ex.ast.blocked}</button> : senderDiffs.length > 0 && !ackSender && !validated ? <button className="cds--btn cds--btn--primary cds--btn--sm" disabled>Validate run: Accept results</button> : <Btn kind={validated ? 'secondary' : 'primary'} onClick={() => setValidated(!validated)}>{validated ? 'Undo validation' : 'Validate run: Accept results'}</Btn>}<Btn kind="ghost">New attempt (Repeat or Retest)</Btn></div>
      <Table size="sm" style={{ marginTop: '.5rem' }}><TableHead><TableRow><TableHeader>Attempt</TableHeader><TableHeader>Method</TableHeader><TableHeader>Status</TableHeader><TableHeader>Reporting</TableHeader></TableRow></TableHead>
        <TableBody><TableRow><TableCell>1 <Tag kind="gray">Original</Tag></TableCell><TableCell>{ex.ast.method}</TableCell><TableCell>{validated ? 'Validated' : 'Results in'}</TableCell><TableCell>Included</TableCell></TableRow></TableBody></Table>
      <div className="muted anno" style={{ marginTop: '.5rem' }}>Kept as built (A-16): QC failed handling (invalidate and repeat, or override QC with reason), organism mismatch warning, no-breakpoint warning, override history with show original, review gating, Use for reporting across attempts.</div>
      {ex.ast.rule && <div style={{ marginTop: '.75rem' }}><Tag kind="teal">{t('microbiology.case.addedByRule', 'Added by rule')}: {ex.ast.rule[0]}</Tag><span className="muted">{ex.ast.rule[1]}</span></div>}
      <div style={{ marginTop: '.75rem' }}><span className="muted">{ex.ast.classLabel} (derived from organism and results): </span>{ex.ast.classTags.map(c => <Tag key={c} kind="red">{c}</Tag>)}<span className="muted">{ex.ast.classNote}</span></div>
      {ex.ast.molecular && <div style={{ marginTop: '.75rem', background: '#fff', border: '1px solid #e0e0e0', padding: '.75rem' }}><b style={{ fontSize: 14 }}>{t('micro.molecularResistance.title', 'Molecular resistance')}</b> <span className="new3">v3</span> <span className="muted">{t('micro.molecularResistance.help', 'From results of tests on this case whose results are mapped to an antibiotic')}</span> <span className="muted anno">Any catalog test can feed this table: the test's coded result component carries the mapping (antibiotic or class; value to R or S). The method (GeneXpert, line probe assay, multiplex PCR, sequencing) is the Method linked to the test, not part of the rule. No result, no row; no mapped results, no table (D-Q3, D-285).</span>
        <Table size="sm" style={{ marginTop: 6 }}><TableHead><TableRow><TableHeader>{t('micro.molecularResistance.drug', 'Antibiotic')}</TableHeader><TableHeader>Result</TableHeader><TableHeader>{t('micro.molecularResistance.testMethod', 'Test · method')}</TableHeader><TableHeader>Performed</TableHeader><TableHeader>{t('micro.molecularResistance.phenotypic', 'Phenotypic result')}</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
          <TableBody>{ex.ast.molecular.map(m => <TableRow key={m[0]}><TableCell>{m[0]}</TableCell><TableCell><Tag kind={m[1].startsWith('Resistance detected') ? 'red' : 'green'}>{m[1]}</Tag></TableCell><TableCell>{m[2]}<div className="muted" style={{ fontSize: 12 }}>{m[6]}</div></TableCell><TableCell className="muted">{m[3]}</TableCell><TableCell>{m[4]}</TableCell><TableCell>{m[5] === 'agree' ? <Tag kind="gray">{t('micro.molecularResistance.agrees', 'Agrees')}</Tag> : m[5] === 'pending' ? <span className="muted">pending</span> : <Tag kind="magenta">{t('micro.molecularResistance.discordant', 'Molecular and phenotypic results disagree for {drug}').replace('{drug}', m[0])}</Tag>}</TableCell></TableRow>)}</TableBody></Table></div>}
      {adding === 'ast' ? <TestChooser ch={{ ...ex.choosers.ast, suggested: sugg.map(x => x.name + ' (' + x.reason + ')') }} onCancel={() => setAdding(null)} onAdd={(p, on) => { setPanels([...panels, ...p.map(x => ({ name: x, on: on.split(' ')[0], added: 'Added by ' + ex.tech + ' with the chooser', method: ex.ast.method + ' · ' + bp, run: 'Not started', val: 'n/a' }))]); p.forEach(x => log(`Added ${x} to AST / DST, on ${on.split(' ')[0]}`)); setAdding(null); }} />
        : <div className="row-actions"><Btn kind="tertiary" onClick={() => setAdding('ast')}>+ {t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Btn><span className="muted" style={{ alignSelf: 'center' }}>Opens the standard test and panel chooser on the isolate; breakpoints follow the panel, test or antibiotic.</span></div>}
    </Section>

    <Section bk="additional" n="7" title={t('microbiology.case.section.additionalTesting', 'Additional testing')} isNew>
      {additional.length ? <CaseTestTable rows={additional} labOnly={labOnly} setLabOnly={setLabOnly} showOn /> : <div className="muted">No additional tests.</div>}
      {adding === 'additional' ? <TestChooser ch={ex.choosers.additional} onCancel={() => setAdding(null)} onAdd={(p, on) => { setAdditional([...additional, ...p.map((x, k) => ({ id: 'addl' + additional.length + k, test: x, on, type: 'coded', opts: ['Detected', 'Not detected'], display: '', flag: '', by: '', state: 'Not started', addedBy: ex.tech }))]); p.forEach(x => log(`Added ${x} to Additional testing, on ${on}`)); setAdding(null); }} />
        : <div className="row-actions"><Btn kind="tertiary" onClick={() => setAdding('additional')}>+ {t('microbiology.case.addTestOrPanel', 'Add test or panel')}</Btn><span className="muted" style={{ alignSelf: 'center' }}>Any catalog test, on the specimen or an isolate. In lab only can be set on any added test and turned off again; changes go to the Timeline.</span></div>}
    </Section>

    <Section bk="critical" n="8" title="Critical communication" open={false} tags={<span className="muted anno">&nbsp;existing component (M-04, built): reuse, do not re-implement. Drawing abbreviated; v2 additions only as listed (A-16)</span>}>
      <Table size="sm"><TableHead><TableRow><TableHeader>Target</TableHeader><TableHeader>Recipient</TableHeader><TableHeader>Method</TableHeader><TableHeader>Message</TableHeader><TableHeader>{t('microbiology.case.critical.outcome', 'Outcome')}</TableHeader><TableHeader>Status</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
        <TableBody>{ex.critical.map(c => <TableRow key={c[0]}><TableCell>{c[0]}</TableCell><TableCell>{c[1]}</TableCell><TableCell>{c[2]}</TableCell><TableCell>{c[3]}</TableCell><TableCell>{c[4]}</TableCell><TableCell><Tag kind={c[5] === 'Open' ? 'warm-gray' : c[5] === 'Closed' || c[5] === 'Sent' ? 'green' : 'blue'}>{c[5]}</Tag></TableCell><TableCell>{c[5] !== 'Closed' && c[5] !== 'Sent' && <Btn kind="ghost">{c[5] === 'Open' ? 'Acknowledge' : 'Close (resolution note)'}</Btn>}</TableCell></TableRow>)}</TableBody></Table>
      <div className="muted" style={{ marginTop: '.5rem' }}>Each call also writes a row in the shared critical callback log, so it prints under the result on the patient report and counts in the callback reports.</div>
      <p className="muted anno" style={{ marginTop: '.5rem' }}><span className="new3">v3 D-292</span> An alert rule on the culture test (Test catalog › Alerts) that matches a resistance profile or organism sends its email when the isolate's AST or identification is validated, and adds the row above with method "Email, automatic", linked to the alert, status Sent. An automatic email needs no acknowledgement; the row is the record that it went (D-295). Only a failed send needs action: it shows "Not sent" with the reason and appears in Needs attention so someone can phone. The email names no patient: lab number, organism, profile, sample type and ward only.</p>
    </Section>
    <Section bk="nce" n="9" title="Nonconformance" open={false} tags={<span className="muted anno">&nbsp;existing component (M-04, built): reuse, do not re-implement. Drawing abbreviated; v2 additions only as listed (A-16)</span>}>
      <div className="muted">No NCE on this case. Report NCE and Mark specimen lost keep their fields (category, type, reporting unit, severity, description, immediate action) and dispositions (Flag only, Reject tests, Retest a run or one antibiotic).</div>
    </Section>
    <Section bk="report" n="10" title="Report" tags={<><span className="new">v2 per-result choice, grouped</span> <span className="new3">v3 reasons, final release</span></>}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <Table size="sm"><TableHead><TableRow><TableHeader>{t('microbiology.case.report.include', 'Report')}</TableHeader><TableHeader>Result</TableHeader><TableHeader>{t('micro.case.reportChoice.reason', 'Why it starts ticked or not')}</TableHeader></TableRow></TableHead>
            <TableBody>{PRINT_GROUPS.map(([g, label]) => { const all = allItems.filter(i => i.group === g); const agents = g === 'ast' ? all.filter(i => !i.derived) : []; const its = all.filter(i => !agents.includes(i)); if (!all.length) return null; const isoOf = i => i.isoLabel || i.iso || 'ISO-1'; const isoGroups = [...new Set(agents.map(isoOf))]; return <React.Fragment key={g}>
              <TableRow><TableCell colSpan={3} style={{ background: '#e0e0e0', fontWeight: 600 }}>{label}</TableCell></TableRow>
              {isoGroups.map(il => { const ag = agents.filter(i => isoOf(i) === il); const n = ag.filter(i => reportSel[i.k] !== undefined ? reportSel[i.k] : i.on).length; return <TableRow key={il}><TableCell></TableCell><TableCell><span className="muted">AST / DST · {il}</span><br />{t('micro.case.report.astSummary', '{reported} of {total} antibiotics reported').replace('{reported}', n).replace('{total}', ag.length)}</TableCell><TableCell className="muted">{t('micro.case.report.astSummaryHelp', 'Ticked in the Report column of AST / DST, from the reporting rules')} <span className="new3">v3</span></TableCell></TableRow>; })}
              {its.map(i => <TableRow key={i.k}><TableCell><Inp type="checkbox" aria-label={'Report ' + i.k} checked={reportSel[i.k] !== undefined ? reportSel[i.k] : i.on} onChange={e => { setReportSel({ ...reportSel, [i.k]: e.target.checked }); log(`${i.label}: changed from ${e.target.checked ? 'not reported to reported' : 'reported to not reported'}`); }} /></TableCell><TableCell><span className="muted">{i.sec}</span><br />{i.label}</TableCell><TableCell className="muted">{i.d}</TableCell></TableRow>)}
            </React.Fragment>; })}</TableBody></Table>
          <div className="row-actions"><Btn kind="ghost" onClick={() => { setReportSel(Object.fromEntries(ex.report.items.map(i => [i.k, i.on]))); log('Report choices reset to defaults'); }}>{t('micro.case.reportChoice.resetToDefaults', 'Reset to defaults')}</Btn></div>
          <p className="muted anno" style={{ marginTop: '.5rem' }}>Grouped the way the report prints (FR-A42a): Initial testing, Culture, AST / DST, Additional testing. Microscopy exams, Gram stains with Report this result off and In lab only tests are never listed. <span className="new3">v3</span> Antibiotics are ticked in the Report column of the AST / DST table, next to their reading, so R, I and S are shown once on the case (and once more in the print preview); here each isolate is one summary line (D-276). Each antibiotic starts ticked or not from the lab's reporting rules, and says which rule decided it; a cascade agent ticks when its condition is met. Every result is still saved, exported to WHONET and counted, whatever the tick. Any change is a Timeline entry.</p>
        </div>
        <div>
          <div className="note-box"><b>Final report checklist</b>{ex.report.checklist.map((c, k) => { const [ok, txt] = c[0] === 'ast' ? [validated, validated ? 'AST run 1 validated' : 'AST run 1 not validated'] : c[0] === 'program' ? [!!program, program ? 'Program set' : 'Program not set'] : [c.startsWith('✓'), c.slice(2)]; return <Check key={k} ok={ok}>{txt}</Check>; })}{admMissing && <div className="muted">Note, does not block: {t('microbiology.case.report.admissionMissing', 'Admission date missing: exports with infection origin Unknown')}</div>}</div>
          <Table size="sm" style={{ marginTop: '1rem' }}><TableHead><TableRow><TableHeader>Version</TableHeader><TableHeader>Released</TableHeader></TableRow></TableHead>
            <TableBody>{releases.map((r, k) => <TableRow key={k}><TableCell>{k + 1} · {r[0]}</TableCell><TableCell>{r[1]}</TableCell></TableRow>)}{!releases.length && <TableRow><TableCell colSpan={2} className="muted">Nothing released yet.</TableCell></TableRow>}</TableBody></Table>
          <ReportPrint ex={{ ...ex, labUnit }} items={printed} />
          {(() => { return <><div className="row-actions"><Btn kind="secondary" disabled={status === 'Final'} onClick={releasePartial}>{t('microbiology.case.report.releasePartial', 'Release partial report')}</Btn>
              <Btn disabled={missing.length > 0 || status === 'Final'} onClick={() => setConfirmFinal(true)}>{t('micro.release.final', 'Release final')}</Btn></div>
              {missing.length > 0 && status !== 'Final' && <div className="cds--inline-notification cds--inline-notification--warning" style={{ maxWidth: 'none' }}><div className="cds--inline-notification__details"><div className="cds--inline-notification__text-wrapper"><div className="cds--inline-notification__title">{t('micro.release.final.blocked', 'Final release needs:')}</div><div className="cds--inline-notification__subtitle">{missing.map((m, k) => <div key={k}>{m}</div>)}</div></div></div></div>}
              <div className="muted anno">Partial release is one click and can be repeated. Final release asks first, because it locks the case (D-Q1).</div>
</>; })()}
          <div className="muted" style={{ marginTop: '.5rem' }}>Exports: {track === 'Bacterial' ? 'Bacterial track, so after final release the isolate goes to the WHONET and GLASS-AMR exports (Diagnostic purpose).' : track === 'TB' ? 'TB track, so the case goes to the NTP and GLASS-TB exports.' : 'no track until a Program is set.'}</div>
        </div>
      </div>
    </Section>

    <Section bk="amendment" n="11" title="Amendment" open={false} tags={<span className="muted anno">&nbsp;existing component (M-04, built): reuse, do not re-implement. Drawing abbreviated; v2 additions only as listed (A-16)</span>}>
      <div className="muted">Available after final release: Open amendment (reason), Cancel amendment (reason), Release amended report; history and report versions with "corrects version N".</div>
    </Section>
    <Section bk="timeline" n="12" title="Timeline" open={false}>
      <Table size="sm"><TableBody>{tl.map((r, k) => <TableRow key={k}><TableCell className="muted">{r[0]}</TableCell><TableCell>{r[1]}</TableCell></TableRow>)}</TableBody></Table>
    </Section>
  </div></NotesCtx.Provider></MediaCtx.Provider>;
}

const PROGRAM_TRACKS = { 'TB Program': 'TB', 'AMR surveillance': 'Bacterial', 'Bacteriology (routine)': 'Bacterial', 'Mycology': 'Mycology' };

/* ---------- Example data: the same Case view draws both ---------- */
const TB_EX = {
  lab: 'CPHL26-004812', labShort: '004812', tech: 'J. Kaupa', patientName: 'Kila Nou', patient: 'Kila Nou, M, 34 y · UHID 88120034',
  samplesLabel: 'Sample', sampleSummary: 'CPHL26-004812-1 · Sputum', sampleIds: ['CPHL26-004812-1'], sampleType: 'Sputum', site: 'Lower respiratory tract',
  labUnit: 'TB', program: 'TB Program', stage: [['blue', 'AST / DST in progress']], status: 'Partial', statusTags: ['Referred'], related: 'Bacterial culture · Microbiology (switch)',
  history: [['12 Jun 2026', 'CPHL26-002981', 'Sputum, lower respiratory tract', 'TB Program', 'MTB detected (Xpert), rifampicin resistance not detected', 'Final'], ['03 Mar 2026', 'CPHL26-000884', 'Urine, midstream', 'Bacteriology (routine)', 'E. coli ≥10⁵ CFU/mL, ESBL', 'Final']],
  historyNote: 'For a Treatment follow-up case this panel also shows the baseline TB case and the follow-up smear, Xpert and culture results by treatment month.',
  notes: NOTE_SEED,
  incoming: [
    { id: 1, test: 'Xpert MTB/XDR', value: 'INH resistance detected (katG); FQ resistance not detected', source: 'GeneXpert GX-02', at: '28 Sep 09:12' },
    { id: 2, test: 'Species ID (MALDI-TOF Biotyper)', value: 'Mycobacterium tuberculosis complex', source: 'MALDI-TOF Biotyper (MB-01)', at: '28 Sep 10:40' },
    { id: 3, test: 'Identification (QMRL Brisbane)', value: 'Mycobacterium tuberculosis complex', source: 'Referral return: QMRL Brisbane', at: '29 Sep 08:05', linked: [['Moxifloxacin (MGIT, 0.25 µg/mL)', 'S'], ['Bedaquiline (MGIT, 1 µg/mL)', 'S'], ['Linezolid (MGIT, 1 µg/mL)', 'S']] }],
  info: { origin: 'Outpatient', admission: '', diagnosis: 'Presumptive DR-TB, cough 6 weeks', specimenNumber: 'TB-2026-0417/2', sets: '1',
    samples: [['CPHL26-004812-1', 'Sputum · sterile container', '', 'Lower respiratory tract', '28 Sep 07:10', 'Ward nurse']],
    samplesNote: 'A blood culture case from two sets lists its four bottles here, each with its own arm and time (see the blood culture example). Correct site opens the order steps at that sample (FR-04.2).',
    history: 'Cough 6 weeks, weight loss 6 kg, night sweats. Previously treated for drug-susceptible TB in 2025 (completed 6 months HRZE at Gerehu clinic). Household contact of a confirmed RR-TB case (brother, diagnosed August 2026). HIV negative, tested July 2026.',
    appliesTo: 'Applies to all 2 cases on this order: patient origin, admission date, diagnosis, clinical history, prior antibiotics and TB history. Priority comes from the order.',
    priorAb: [['Amoxicillin', '10 Sep 2026'], ['Rifampicin / isoniazid (HRZE)', '02 Jun 2025']] },
  initial: [
    { id: 'smear', test: 'AFB smear (Ziehl-Neelsen)', type: 'coded', opts: ['Negative', 'Scanty (1 to 9 AFB per 100 fields)', '1+', '2+', '3+'], result: '2+', display: '2+ (10 to 99 AFB per 100 fields)', flag: 'Critical', by: 'J. Kaupa (this lab)', lot: 'ZN stain kit, lot 22071', lotRequired: true, state: 'Validated' },
    { id: 'xpert', test: 'Xpert MTB/RIF Ultra', type: 'components', components: [{ c: 'MTB', v: 'Detected, medium', opts: ['Not detected', 'Trace', 'Detected, very low', 'Detected, low', 'Detected, medium', 'Detected, high'] }, { c: 'Rifampicin resistance', v: 'Detected', opts: ['Not detected', 'Detected', 'Indeterminate'], flag: 'Critical' }], display: 'MTB detected, medium; rifampicin resistance detected', flag: 'Critical', by: 'Goroka Provincial Hospital Laboratory, 22 Sep 2026', external: true, state: 'Validated' },
    { id: 'gram', test: 'Gram stain (direct)', type: 'components', components: GRAM_C.map(c => ({ c, v: c === 'Pus cells' ? 'Many' : c === 'Gram-positive cocci in clusters' ? 'Few' : '', opts: ['', ...GRADES] })), display: 'Pus cells: many; Gram-positive cocci in clusters: few', flag: '', by: 'J. Kaupa (this lab)', lot: 'Gram stain kit, lot 44120', state: 'Awaiting validation' },
    { id: 'wet', test: 'Wet preparation', type: 'components', components: ['Pus cells', 'Motile bacilli', 'Yeasts'].map(c => ({ c, v: '', opts: ['', ...GRADES] })), display: '', flag: '', by: '', state: 'Not started' }],
  noInitial: '',
  additional: [
    { id: 'wgs', test: 'Whole genome sequencing (MTB)', on: 'isolate sample CPHL26-004812-1.1 (ISO-1)', type: 'components', components: [{ c: 'Lineage', v: 'Lineage 2 (Beijing)', opts: ['Lineage 1', 'Lineage 2 (Beijing)', 'Lineage 4'] }, { c: 'Rifampicin (rpoB)', v: 'Resistant (S450L)', opts: ['Susceptible', 'Resistant (S450L)'], flag: 'Critical' }], display: '', flag: '', by: 'QMRL Brisbane (referred)', state: 'Not started' },
    { id: 'lpa', test: 'Line probe assay MTBDRsl', on: 'ISO-1', type: 'components', components: [{ c: 'Fluoroquinolones (gyrA, gyrB)', v: 'No mutation detected', opts: ['No mutation detected', 'Mutation detected'] }, { c: 'Second-line injectables (rrs, eis)', v: 'No mutation detected', opts: ['No mutation detected', 'Mutation detected'] }], display: 'No fluoroquinolone or injectable resistance mutations', flag: '', by: 'R. Opa (this lab)', lot: 'GenoType MTBDRsl kit, lot 8830', state: 'Validated' }],
  labOnly: { wgs: true, lpa: false, smear: false, xpert: false, gram: false, wet: false },
  choosers: {
    culture: { filter: 'pre-filtered to tests set up for Sputum or Isolate (tests on a culture), TB lab unit listed first', q: '', panels: [], tests: ['ZN stain, culture', 'Auramine stain, culture', 'Xpert MTB/RIF Ultra (culture)', 'MPT64 antigen (culture)', 'Gram stain, culture'], after: 'Each pick is listed under the culture row with its catalog result type and In lab only default.' },
    initial: { filter: 'pre-filtered to Sputum, TB lab unit listed first', q: 'stain', panels: ['TB direct microscopy panel (ZN + auramine)', 'TB molecular panel (Xpert MTB/RIF Ultra + MTB/XDR)'], tests: ['Gram stain (direct)', 'Auramine (LED fluorescence) smear', 'India ink stain'], after: 'Added tests appear as rows above, each entered with the same editor as every other row (including Tested elsewhere).' },
    ast: { filter: 'pre-filtered to DST panels and drugs for the isolate\'s organism (M. tuberculosis complex)', on: ['ISO-1 M. tuberculosis complex'], onHelp: 'The isolate the panel or test runs on', panels: ['TB second-line DST v2', 'TB new and repurposed drugs DST (BDQ, LZD, CFZ, DLM)', 'TB first-line DST v3 (already on ISO-1)'], tests: ['Bedaquiline (MGIT, 1.0 µg/mL)', 'Linezolid (MGIT, 1.0 µg/mL)', 'Moxifloxacin (MGIT, 1.0 µg/mL)', 'Pretomanid (MGIT)'], after: 'Each panel becomes its own run on the isolate; its breakpoints follow the panel (WHO critical concentrations).' },
    additional: { filter: 'any catalog test, on the specimen or an isolate', on: ['ISO-1', 'Specimen CPHL26-004812-1'], onHelp: 'Run on an isolate or on the specimen', panels: ['TB molecular panel (Xpert MTB/RIF Ultra + MTB/XDR)'], tests: ['Line probe assay MTBDRplus', 'Whole genome sequencing (MTB)', 'Niacin test'], after: 'Added tests appear as rows in Additional testing.' } },
  referrals: [['CPHL26-004812-1.1', 'isolate sample (ISO-1)', 'Isolate', 'TB second-line DST (phenotypic)', 'QMRL Brisbane', 'Received']],
  referTests: ['Xpert MTB/XDR', 'TB culture', 'TB first-line DST'], refLabs: ['CPHL Port Moresby, TB reference laboratory', 'QMRL Brisbane', 'PNG Institute of Medical Research'],
  cultureNote: 'MGIT is read by the analyzer; LJ slopes are read by hand every 7 days.',
  inoc: [
    { cid: 'MGIT-004812-A', ct: 'TB culture (MGIT)', from: '', medium: 'BBL MGIT 7 mL tube', lot: 'Lot 5327611', atm: 'Aerobic (ambient air)', temp: 37, dur: 42, unit: 'Days', every: 7, eunit: 'Days', start: '23 Sep 08:30', ends: '04 Nov 08:30', next: 'n/a', state: 'Positive', posAt: '28 Sep 03:42', posBy: 'MGIT 960 signal', day: 5, log: ['Day 5 (28 Sep 03:42): positive signal (MGIT 960, matched by container ID)'] },
    { cid: 'LJ-004812-B', ct: 'TB culture (LJ)', from: '', medium: 'Löwenstein-Jensen slope', lot: 'Lot LJ-2609 (prepared in-house)', atm: 'Aerobic (ambient air)', temp: 37, dur: 56, unit: 'Days', every: 7, eunit: 'Days', start: '23 Sep 08:30', ends: '18 Nov 08:30', next: '28 Sep 08:30', state: 'Check due', day: 5, log: ['Day 1 (24 Sep): no growth'] },
    { cid: 'LJ-SUB-004812-A1', ct: 'TB culture (MGIT)', from: 'MGIT-004812-A', medium: 'Middlebrook 7H11 agar (from QMRL)', nt: true, atm: 'Aerobic (ambient air)', temp: 37, dur: 28, unit: 'Days', every: 7, eunit: 'Days', start: '28 Sep 11:00', ends: '26 Oct 11:00', next: '05 Oct 11:00', state: 'Incubating', day: 1, log: [] },
    { cid: 'BA-SUB-004812-A2', ct: 'TB culture (MGIT)', from: 'MGIT-004812-A', purpose: 'Purity', medium: 'Blood agar (sheep) plate', lot: 'Lot BA-26-117', atm: 'Aerobic (ambient air)', temp: 37, dur: 48, unit: 'Hours', every: 24, eunit: 'Hours', start: '28 Sep 11:05', ends: '30 Sep 11:05', next: '29 Sep 11:05', state: 'Incubating', day: 1, log: [] }],
  children: [{ id: 'T-1', kind: 'test', test: 'ZN stain, culture', from: 'MGIT-004812-A', components: [{ c: 'Acid-fast bacilli', v: 'Seen', opts: ['Not seen', 'Seen'] }, { c: 'Serpentine cording', v: 'Present', opts: ['Absent', 'Present'] }], display: 'Acid-fast bacilli: Seen; Serpentine cording: Present', state: 'Validated', inLabOnly: true, at: '28 Sep 08:50', by: 'R. Opa' }],
  gramDefault: [{ what: 'Gram-positive cocci in clusters', grade: 'Many' }],
  cultureTest: { test: 'Xpert MTB/RIF Ultra', type: 'components', components: [{ c: 'MTB', v: 'Detected, high', opts: ['Not detected', 'Detected, low', 'Detected, medium', 'Detected, high'] }, { c: 'Rifampicin resistance', v: 'Not detected', opts: ['Not detected', 'Detected', 'Indeterminate'] }], display: 'MTB detected, high; rifampicin resistance not detected', flag: '', by: 'R. Opa (this lab)', lot: 'cartridge lot 1000-2231', state: 'Awaiting validation' },
  cultureTests: [
    { name: 'TB culture (MGIT)', result: 'Positive on day 5', state: 'Awaiting validation', added: 'Ordered at reception' },
    { name: 'TB culture (LJ)', result: 'In progress, day 5 of 56', state: 'Not started', added: 'Added by J. Kaupa by inoculating Löwenstein-Jensen slope (23 Sep 08:30)' }],
  template: TEMPLATE_TB, nextContainer: 'MGIT-004812-C',
  isolates: [{ id: 'ISO-1', from: 'MGIT-004812-A (positive day 5)', gram: 'AFB, cording · rough buff colonies on LJ', organism: 'Mycobacterium tuberculosis complex', idm: 'MPT64 antigen (placed from Incoming results) · 99%', sig: 'Clinically significant' }],
  isoGrams: ['AFB', 'Gram-positive cocci', 'Gram-negative bacilli'],
  isoNote: <><b>Example from a bacterial urine case:</b> ISO-1 <i>E. coli</i> · <Tag kind="warm-gray">{t('microbiology.case.repeatIsolate', 'Same organism on {labNumber}, {days} days ago, AST done').replace('{labNumber}', 'CPHL26-004655').replace('{days}', '6')}</Tag> <Btn kind="ghost">{t('microbiology.case.referPreviousAst', 'Refer to previous susceptibility')}</Btn><div className="muted">Removes the organism default panel with that reason; the report prints "Susceptibility as reported on CPHL26-004655 (24/09/2026)". A panel can still be added.</div></>,
  astPanels: [{ name: 'TB first-line DST v3', on: 'ISO-1', added: 'Organism default', defaultFor: 'M. tuberculosis complex, Sputum', addedNote: '(also requested by rule: RR on Xpert; one copy only)', method: 'MGIT 960 · WHO critical concentrations 2024', run: 'Run 1, results in', val: 'Awaiting validation' },
    { name: 'TB second-line DST v2', on: 'ISO-1', added: 'Added with the chooser', method: 'MGIT 960 · WHO critical concentrations 2024', run: 'Not started', val: 'n/a' }],
  ast: { bp: 'WHO critical concentrations 2024', bpHelp: 'Default from the organism (MTB: WHO critical concentrations); another standard needs a reason', method: 'MGIT 960 (critical concentration)', analyzer: 'BD MGIT 960 (TB-01)', card: 'MGIT-2609-0441', lot: 'BACTEC MGIT SIRE kit, lot 6214803, exp 03/2027 (FEFO)', agentLabel: 'Drug',
    runNote: <>Run 1 (Original) <Tag kind="blue">Results in</Tag> from BD MGIT 960 TB-01, tube set MGIT-2609-0441, software 5.07. QC passed. Expert flags: 1 unacknowledged <Btn kind="ghost">Acknowledge flags (reason)</Btn></>,
    readings: [{ drug: 'Rifampicin', method: 'MGIT', raw: '1.0 µg/mL', source: 'Analyzer', interp: 'R' }, { drug: 'Isoniazid', method: 'MGIT', raw: '0.1 µg/mL', source: 'Analyzer', interp: 'R' }, { drug: 'Ethambutol', method: 'MGIT', raw: '5.0 µg/mL', source: 'Override', override: true, interp: 'S', instr: 'I' }, { drug: 'Pyrazinamide', method: 'MGIT PZA', raw: '', source: '', interp: 'Pending' }],
    blocked: 'Validate run: Accept results (1 reading and 1 flag outstanding)', rule: ['RR detected on Xpert', 'Xpert MTB/XDR added automatically on 23 Sep; cancel like any added test.'],
    classLabel: t('microbiology.case.tbClassification', 'Resistance classification'), classTags: ['MDR-TB'], classNote: 'rifampicin R + isoniazid R; second-line pending. Uses the molecular and phenotypic results together (D-Q3).',
    molecular: [['Rifampicin', 'Resistance detected', 'MTB/RIF Ultra', 'Goroka Provincial Hospital Laboratory, 22 Sep 2026', 'R (MGIT, run 1)', 'agree', 'GeneXpert'],
      ['Isoniazid', 'Resistance detected (katG)', 'MTB/XDR', 'In Incoming results, not placed yet', 'R (MGIT, run 1)', 'agree', 'GeneXpert'],
      ['Fluoroquinolones', 'Resistance not detected', 'MTBDRsl', 'This laboratory, 30 Sep 2026 (Additional testing)', 'Second-line DST pending', 'pending', 'Line probe assay']] },
  suggestions: [{ id: 's1', kind: 'panel', name: 'TB new and repurposed drugs DST (BDQ, LZD, CFZ, DLM)', on: 'ISO-1', reason: 'Rifampicin is R AND isoniazid is R', why: 'Cascade reporting rule: test and report bedaquiline, linezolid, clofazimine and delamanid' }],
  critical: [['Result: GeneXpert RIF', 'Dr. Wari, Chest Clinic (ext. 4412)', 'Phone', 'Rifampicin resistance detected', 'Read back confirmed', 'Acknowledged'], ['Case: RR-TB', 'National TB Programme, DR-TB desk', 'Email', 'New RR-TB, CPHL26-004812', 'Reached, no read-back', 'Open']],
  report: {
    items: [
      { k: 'smear', group: 'initial', order: 1, sec: 'Initial testing', label: 'AFB smear: 2+', d: 'On', on: true, print: [{ t: 'AFB smear (Sputum)', r: '2+' }] },
      { k: 'xpert', group: 'initial', order: 2, sec: 'Initial testing', label: 'Xpert MTB/RIF Ultra: MTB detected, RIF resistance detected (previous report, Goroka)', d: 'On', on: true, print: [{ t: 'Xpert MTB/RIF Ultra † (Performed by Goroka Provincial Hospital Laboratory)', r: 'MTB detected, RIF resistance detected' }] },
      { k: 'gramd', group: 'initial', order: 3, sec: 'Initial testing', label: 'Gram stain (direct): pus cells many; GPC in clusters few', d: 'On, prints once validated', on: true, print: [] },
      { k: 'cult', group: 'culture', order: 10, sec: 'Culture', label: 'TB culture: in progress (day 5 of 56)', d: 'On', on: true, print: [{ t: 'TB culture (MGIT, LJ)', r: 'Positive (MGIT); LJ in progress, day 5 of 56', ri: true }] },
      { k: 'iso', group: 'culture', order: 30, sec: 'Isolates', label: 'Isolate 1: M. tuberculosis complex', d: 'On (significant)', on: true, print: [{ t: 'Isolate 1: Mycobacterium tuberculosis complex', r: 'significant', rb: false, ind: 1 }] },
      { k: 'rif', group: 'ast', iso: 'ISO-1', isoLabel: 'Isolate 1: Mycobacterium tuberculosis complex', order: 40, sec: 'DST', label: 'Rifampicin R', d: 'Report · rule: M. tuberculosis complex, any sample type', on: true, print: [{ t: 'Rifampicin', r: 'R · WHO critical concentration 1.0 µg/mL', ind: 1, bar: true }] },
      { k: 'inh', group: 'ast', iso: 'ISO-1', isoLabel: 'Isolate 1: Mycobacterium tuberculosis complex', order: 41, sec: 'DST', label: 'Isoniazid R', d: 'Report · rule: M. tuberculosis complex, any sample type', on: true, print: [{ t: 'Isoniazid', r: 'R · 0.1 µg/mL', ind: 1, bar: true }] },
      { k: 'emb', group: 'ast', iso: 'ISO-1', isoLabel: 'Isolate 1: Mycobacterium tuberculosis complex', order: 42, sec: 'DST', label: 'Ethambutol S', d: 'Cascade not met · reported when rifampicin is S', on: false, print: [{ t: 'Ethambutol', r: 'S · 5.0 µg/mL', ind: 1 }] },
      { k: 'pza', group: 'ast', iso: 'ISO-1', isoLabel: 'Isolate 1: Mycobacterium tuberculosis complex', order: 43, sec: 'DST', label: 'Pyrazinamide (pending)', d: 'Not final', on: false, print: [{ t: 'Pyrazinamide', r: 'To follow', ri: true, ind: 1 }] },
      { k: 'cls', group: 'ast', derived: true, order: 49, sec: 'DST', label: 'Resistance classification: MDR-TB', d: 'On', on: true, print: [{ t: 'Resistance classification', r: 'MDR-TB' }] },
      { k: 'lpa', group: 'additional', hideIf: 'lpa', order: 50, sec: 'Additional testing', label: 'MTBDRsl: no FQ or injectable resistance', d: 'On', on: true, print: [{ t: 'Line probe assay MTBDRsl (on Isolate 1)', r: 'No fluoroquinolone or injectable resistance mutations' }] },
      { k: 'wgs', group: 'additional', hideIf: 'wgs', order: 51, sec: 'Additional testing', label: 'Whole genome sequencing (pending)', d: 'Off (was in lab only)', on: false, print: [{ t: 'Whole genome sequencing (MTB)', r: 'To follow', ri: true }] }],
    checklist: ['✗ Culture outcome: LJ-004812-B and LJ-SUB-004812-A1 still incubating', '✓ All isolates identified', ['ast'], '✗ Pyrazinamide DST pending', '✗ TB history is needed before final report'],
    releases: [['Partial (smear, GeneXpert)', '23/09/2026 · J. Kaupa'], ['Partial (MTBC growth, DST to follow)', '28/09/2026 · R. Opa']],
    callback: 'Callback: Dr. Wari, 23/09/2026 10:40, by J. Kaupa. Read back confirmed.', blocking: 4 },
  timeline: [['28 Sep 11:20', 'Suggested on ISO-1: TB new and repurposed drugs DST, because rifampicin is R and isoniazid is R (reporting rule, Cascade)'], ['28 Sep 10:02', 'Lab unit changed from Microbiology to TB · R. Opa'], ['23 Sep 08:30', 'TB culture (LJ) added to the order for CPHL26-004812-1 by inoculating Löwenstein-Jensen slope LJ-004812-B · J. Kaupa'], ['28 Sep 11:00', 'Subculture LJ-SUB-004812-A1 from MGIT-004812-A · J. Kaupa'], ['28 Sep 03:42', 'MGIT-004812-A positive at 28 Sep 03:42 by analyzer signal (4 days 19 hours 12 minutes) · MGIT 960'], ['24 Sep 08:40', 'Reading, Day 1: LJ-004812-B, no growth · J. Kaupa'], ['28 Sep 11:15', 'ISO-1 referred to QMRL Brisbane (second-line DST) · J. Kaupa']],
};

const BC_AGENTS = [
  ['Ampicillin', '≥32', 'R', 'Expert rule: Klebsiella, ampicillin always R (EUCAST expected phenotypes)', 'Report · rule: Enterobacterales, any sample type'], ['Amoxicillin-clavulanate', '16/8', 'I', '', 'Report · rule: Enterobacterales, any sample type'], ['Piperacillin-tazobactam', '8/4', 'S', '', 'Report · rule: Enterobacterales, any sample type'],
  ['Ceftriaxone', '≥64', 'R', '', 'Report · rule: Enterobacterales, any sample type'], ['Ceftazidime', '16', 'R', '', 'Report · rule: Enterobacterales, any sample type'], ['Cefepime', '8', 'SDD', '', 'Report · rule: Enterobacterales, any sample type'],
  ['Ertapenem', '≤0.12', 'S', '', 'Cascade met · ceftriaxone is R'], ['Meropenem', '≤0.25', 'S', '', 'Cascade met · ceftriaxone is R'], ['Gentamicin', '≥16', 'R', '', 'Report · rule: Enterobacterales, any sample type'],
  ['Amikacin', '≤2', 'S', '', 'Cascade met · gentamicin is R'], ['Ciprofloxacin', '≥4', 'R', '', 'Report · rule: Enterobacterales, any sample type'], ['Trimethoprim-sulfamethoxazole', '≥320', 'R', '', 'Report · rule: Enterobacterales, any sample type']];
const BC_ISO = 'Isolate 1: Klebsiella pneumoniae';
const BC_EX = {
  lab: 'CPHL26-004831', labShort: '004831', tech: 'P. Hiri', patientName: 'Mere Toua', patient: 'Mere Toua, F, 61 y · UHID 88120771',
  setLines: ['Set 1: left arm, 07:25, aerobic and anaerobic', 'Set 2: right arm, 07:31, aerobic and anaerobic'], samplesLabel: 'Samples', sampleSummary: '4 samples, 2 sites · Blood culture bottle', sampleIds: ['CPHL26-004831-3'], sampleType: 'Blood culture bottle', site: 'Peripheral vein, left arm; right arm',
  labUnit: 'Microbiology', program: 'AMR surveillance', stage: [['blue', 'AST in progress']], status: 'Partial', statusTags: [], related: '', priority: 'STAT',
  history: [], historyNote: '',
  why: <><b>Why this is one case:</b> four bottles on one order, all Blood culture bottle, all for the Microbiology lab unit, and Blood culture is marked Collected in sets (FR-02.4, FR-02.4a). The same Case view as the TB example: no culture type and no path. What differs is the Program, which here brings the AMR surveillance questions and puts the case in the Bacterial-track exports.</>,
  notes: { 'RUN VITEK 2 AST-N405 (Enterobacterales)': [{ d: '02 Oct 03:16', a: 'Reporting rule', type: 'E', rule: 'Klebsiella pneumoniae · Blood · Ceftriaxone (When R)', body: 'Meropenem 25 mg/kg up to 1 g 8-hourly IV should be considered for this resistant isolate.' }], 'BC-004831-1N': [{ d: '01 Oct 09:40', a: 'P. Hiri', type: 'I', body: 'Same organism as 1A (Gram and BCID2 agree); no separate isolate worked up.' }] },
  incoming: [{ id: 1, test: 'Carbapenemase (NG-Test CARBA 5)', value: 'Not detected', source: 'Bench reader (CR-01)', at: '02 Oct 09:55' }],
  info: { origin: 'Inpatient', admission: '24/09/2026', ward: 'Medical ward 3, Port Moresby General Hospital', diagnosis: 'Fever 39.4 °C, rigors, suspected sepsis; urinary catheter in place', sets: '2 (counted from the samples)',
    samples: [['CPHL26-004831-1', 'Blood culture bottle · BacT/ALERT FA Plus (aerobic), 9 mL', '1', 'Peripheral vein · left arm', '29 Sep 06:40', 'Ward nurse'], ['CPHL26-004831-2', 'Blood culture bottle · BacT/ALERT FN Plus (anaerobic), 8 mL', '1', 'Peripheral vein · left arm', '29 Sep 06:40', 'Ward nurse'], ['CPHL26-004831-3', 'Blood culture bottle · BacT/ALERT FA Plus (aerobic), 10 mL', '2', 'Peripheral vein · right arm', '29 Sep 06:55', 'Ward nurse'], ['CPHL26-004831-4', 'Blood culture bottle · BacT/ALERT FN Plus (anaerobic), 6 mL', '2', 'Peripheral vein · right arm', '29 Sep 06:55', 'Ward nurse']],
    samplesNote: 'The header reads "4 samples, 2 sites". Correct site opens the order steps at that sample (FR-04.2).',
    history: 'Admitted 24 Sep with pyelonephritis; urinary catheter since admission. Started ceftriaxone 27 Sep. Fever and rigors overnight 28 to 29 Sep.',
    appliesTo: 'Applies to all cases on this order: patient origin, admission date, diagnosis, clinical history and prior antibiotics. Priority comes from the order.',
    priorAb: [['Ceftriaxone', '27 Sep 2026']] },
  initial: [], noInitial: 'No direct tests on blood culture bottles. The Gram stain and the rapid panel are done on a positive bottle, so they sit under that bottle in Culture.',
  additional: [{ id: 'wgsb', test: 'Whole genome sequencing (K. pneumoniae, AMR surveillance)', on: 'isolate sample CPHL26-004831-1.1 (ISO-1)', type: 'coded', opts: ['Pending'], display: '', flag: '', by: 'PNG Institute of Medical Research (referred)', state: 'Not started' }],
  labOnly: { wgsb: true },
  choosers: {
    culture: { filter: 'pre-filtered to tests set up for Blood culture bottle or Isolate (tests on a culture), Microbiology lab unit listed first', q: '', panels: [], tests: ['Gram stain, culture', 'BioFire BCID2 panel', 'Catalase', 'Coagulase (tube)', 'Oxidase', 'Wet mount, culture', 'India ink stain, culture'], after: 'Each pick is listed under the culture row with its catalog result type and In lab only default.' },
    initial: { filter: 'pre-filtered to Blood culture bottle, Microbiology lab unit listed first', q: '', panels: ['Blood culture identification panel (BCID2)'], tests: ['Gram stain (direct)', 'Malaria RDT (from bottle)'], after: 'Added tests appear as rows above, each entered with the same editor as every other row.' },
    ast: { filter: 'pre-filtered to AST panels and antibiotics for the isolate\'s organism (Enterobacterales)', on: ['ISO-1 K. pneumoniae'], onHelp: 'The isolate the panel or test runs on', panels: ['Enterobacterales disk diffusion supplement', 'Carbapenemase confirmation panel (mCIM, eCIM)', 'VITEK 2 AST-N405 (already on ISO-1)'], tests: ['Ceftazidime-avibactam (disk)', 'Colistin (broth microdilution)', 'Fosfomycin (agar dilution)', 'Tigecycline (MIC)'], after: 'Each panel becomes its own run on the isolate; its breakpoints follow the panel (the lab\'s CLSI M100 edition for Enterobacterales).' },
    additional: { filter: 'any catalog test, on the specimen or an isolate', on: ['ISO-1', 'Specimen CPHL26-004831-1'], onHelp: 'Run on an isolate or on the specimen', panels: [], tests: ['Whole genome sequencing (bacterial)', 'String test (hypermucoviscosity)', 'Carbapenemase (NG-Test CARBA 5)'], after: 'Added tests appear as rows in Additional testing.' } },
  referrals: [],
  referTests: ['Whole genome sequencing (bacterial)', 'Carbapenemase confirmation panel (mCIM, eCIM)'], refLabs: ['PNG Institute of Medical Research', 'QMRL Brisbane'],
  cultureNote: 'Bottles are read by the blood culture analyzer, so there is no Check every and no manual readings until a bottle flags. Set 1 flagged positive; set 2 keeps incubating to day 5.',
  inoc: [
    { cid: 'BC-004831-1A', ct: 'Blood culture', from: '', set: 'Set 1 · left arm · CPHL26-004831-1', bottle: true, analyzer: 'BacT/ALERT VIRTUO BC-01', medium: 'BacT/ALERT FA Plus (aerobic)', lot: 'Lot 4127893', atm: 'Aerobic (ambient air)', temp: 35, dur: 5, unit: 'Days', every: 1, eunit: 'Days', start: '29 Sep 08:30', ends: '04 Oct 08:30', next: 'n/a', state: 'Positive', posAt: '29 Sep 22:18', posBy: 'BacT/ALERT signal', day: 1, log: ['29 Sep 22:18: positive signal (BacT/ALERT VIRTUO, matched by bottle barcode)'] },
    { cid: 'BC-004831-1N', ct: 'Blood culture', from: '', set: 'Set 1 · left arm · CPHL26-004831-2', bottle: true, analyzer: 'BacT/ALERT VIRTUO BC-01', medium: 'BacT/ALERT FN Plus (anaerobic)', lot: 'Lot 4127550', atm: 'Anaerobic', temp: 35, dur: 5, unit: 'Days', every: 1, eunit: 'Days', start: '29 Sep 08:30', ends: '04 Oct 08:30', next: 'n/a', state: 'Positive', posAt: '30 Sep 03:42', posBy: 'BacT/ALERT signal', day: 1, log: ['30 Sep 03:42: positive signal'] },
    { cid: 'BC-004831-2A', ct: 'Blood culture', from: '', set: 'Set 2 · right arm · CPHL26-004831-3', bottle: true, analyzer: 'BacT/ALERT VIRTUO BC-01', medium: 'BacT/ALERT FA Plus (aerobic)', lot: 'Lot 4127893', atm: 'Aerobic (ambient air)', temp: 35, dur: 5, unit: 'Days', every: 1, eunit: 'Days', start: '29 Sep 08:32', ends: '04 Oct 08:32', next: 'n/a', state: 'Incubating', day: 4, log: [] },
    { cid: 'BC-004831-2N', ct: 'Blood culture', from: '', set: 'Set 2 · right arm · CPHL26-004831-4', bottle: true, analyzer: 'BacT/ALERT VIRTUO BC-01', medium: 'BacT/ALERT FN Plus (anaerobic)', lot: 'Lot 4127550', atm: 'Anaerobic', temp: 35, dur: 5, unit: 'Days', every: 1, eunit: 'Days', start: '29 Sep 08:32', ends: '04 Oct 08:32', next: 'n/a', state: 'Incubating', day: 4, log: [] },
    { cid: 'BA-SUB-004831-1A1', ct: 'Blood culture', from: 'BC-004831-1A', medium: 'Blood agar (sheep) plate', lot: 'Lot BA-26-117', atm: 'CO₂-enriched (5 to 10%)', temp: 35, dur: 48, unit: 'Hours', every: 24, eunit: 'Hours', start: '30 Sep 07:30', ends: '02 Oct 07:30', next: 'n/a', state: 'Positive', posAt: '01 Oct 07:40', posBy: 'P. Hiri', day: 2, log: ['01 Oct 07:40: significant growth, grey mucoid colonies'] },
    { cid: 'BA-SUB-004831-1A2', ct: 'Blood culture', from: 'BC-004831-1A', medium: 'MacConkey agar plate', lot: 'Lot MAC-26-090', atm: 'Aerobic (ambient air)', temp: 35, dur: 48, unit: 'Hours', every: 24, eunit: 'Hours', start: '30 Sep 07:30', ends: '02 Oct 07:30', next: 'n/a', state: 'Positive', posAt: '01 Oct 07:40', posBy: 'P. Hiri', day: 2, log: ['01 Oct 07:40: lactose-fermenting mucoid colonies'] },
    { cid: 'BA-SUB-004831-1A3', ct: 'Blood culture', from: 'BC-004831-1A', medium: 'Chocolate agar plate', lot: 'Lot CA-26-052', atm: 'CO₂-enriched (5 to 10%)', temp: 35, dur: 48, unit: 'Hours', every: 24, eunit: 'Hours', start: '30 Sep 07:30', ends: '03 Oct 07:30', next: '03 Oct 07:30', state: 'Positive', posAt: '01 Oct 07:40', posBy: 'P. Hiri', day: 2, ext: [{ n: 24, unit: 'Hours', reason: 'Colonies too small to identify or pick' }], log: ['01 Oct 07:40: pinpoint colonies, too small to pick', 'Incubation extended 24 Hours (Colonies too small to identify or pick); now ends 03 Oct 07:30 · P. Hiri'] }],
  children: [
    { id: 'GS-1', kind: 'test', test: 'Gram stain, culture', from: 'BC-004831-1A', components: GRAM_C.map(c => ({ c, v: c === 'Gram-negative bacilli' ? 'Many' : '', opts: GRADES })), display: 'Gram-negative bacilli: many', state: 'Validated', inLabOnly: false, at: '30 Sep 07:20', by: 'P. Hiri' },
    { id: 'T-1', kind: 'test', test: 'BioFire BCID2 panel', from: 'BC-004831-1A', components: [{ c: 'Klebsiella pneumoniae group', v: 'Detected', opts: ['Not detected', 'Detected'] }, { c: 'Escherichia coli', v: 'Not detected', opts: ['Not detected', 'Detected'] }, { c: 'Staphylococcus aureus', v: 'Not detected', opts: ['Not detected', 'Detected'] }, { c: 'CTX-M', v: 'Detected', opts: ['Not detected', 'Detected'] }, { c: 'KPC', v: 'Not detected', opts: ['Not detected', 'Detected'] }], display: 'Klebsiella pneumoniae group: Detected; CTX-M: Detected; KPC: Not detected', state: 'Validated', inLabOnly: false, at: '30 Sep 08:45', by: 'BioFire FilmArray (FA-01)' },
    { id: 'GS-2', kind: 'test', test: 'Gram stain, culture', from: 'BC-004831-1N', components: GRAM_C.map(c => ({ c, v: '', opts: GRADES })), display: '', state: 'Not started', inLabOnly: false, rule: 'Blood culture result = Positive: Gram stain, culture', at: '30 Sep 03:42', by: '' }],
  gramDefault: [{ what: 'Gram-negative bacilli', grade: 'Many' }],
  cultureTest: { test: 'BioFire BCID2 panel', type: 'components', components: [{ c: 'Klebsiella pneumoniae group', v: 'Detected', opts: ['Not detected', 'Detected'] }, { c: 'CTX-M', v: 'Detected', opts: ['Not detected', 'Detected'], flag: 'Critical' }], display: 'K. pneumoniae group detected; CTX-M detected', flag: '', by: 'BioFire FilmArray (FA-01)', lot: 'BCID2 pouch lot 2209814', state: 'Awaiting validation' },
  cultureTests: [{ name: 'Blood culture', result: 'Positive: set 1, both bottles; set 2 in progress', state: 'Awaiting validation', added: 'Ordered at reception · Collected in sets: 2 sets, 4 bottles' }],
  template: TEMPLATE_BC, nextContainer: 'BA-SUB-004831-1N1',
  isolates: [{ id: 'ISO-1', from: 'BA-SUB-004831-1A1', gram: 'Gram-negative bacilli · grey mucoid, lactose fermenter on MacConkey', organism: 'Klebsiella pneumoniae', idm: 'MALDI-TOF Biotyper (MB-01) · score 2.31', sig: 'Clinically significant' }],
  isoGrams: ['Gram-negative bacilli', 'Gram-positive cocci in clusters', 'Gram-positive cocci in chains', 'Yeasts'],
  isoNote: <>The anaerobic bottle grew the same organism (BCID2 and Gram agree), so no second isolate is worked up; a note on BC-004831-1N records it. Use + Add isolate when a second colony type grows.</>,
  astPanels: [{ name: 'VITEK 2 AST-N405 (Enterobacterales)', on: 'ISO-1', added: 'Organism default', defaultFor: 'Enterobacterales, any sample type', method: 'VITEK 2 MIC · CLSI M100 36th ed. (2026)', run: 'Run 1, results in', val: 'Awaiting validation' }],
  suggestions: [{ id: 's1', kind: 'panel', name: 'Enterobacterales disk diffusion supplement', on: 'ISO-1', reason: 'Ceftriaxone is R AND gentamicin is R', why: 'Cascade reporting rule: test and report ceftazidime-avibactam, fosfomycin and colistin' }],
  ast: { bp: 'CLSI M100 36th ed. (2026)', bpHelp: 'Default from the organism (Enterobacterales: the lab\'s CLSI M100 edition); another standard needs a reason', method: 'VITEK 2', analyzer: 'VITEK 2 Compact (VK-01)', card: '2741 0093 5521', lot: 'VITEK 2 AST-N405 cards, lot 5471230, exp 04/2027', agentLabel: 'Antibiotic',
    runNote: <>Run 1 (Original) <Tag kind="blue">Results in</Tag> from VITEK 2 Compact VK-01, card 2741 0093 5521, 02 Oct 03:15. QC passed. Expert rules applied: 2 (intrinsic ampicillin resistance; ESBL phenotype).</>,
    readings: [...BC_AGENTS.map(a => ({ drug: a[0], method: 'VITEK 2 MIC', raw: a[1] + ' µg/mL', source: 'Analyzer', interp: a[2], expert: a[3] })), { drug: 'ESBL test', method: 'VITEK 2 AES', raw: 'n/a', source: 'Analyzer', interp: 'Positive', note: 'Agrees with CTX-M on BCID2', matched: 'VITEK 2 AES' }],
    blocked: '', rule: null, classLabel: t('microbiology.case.resistanceProfile', 'Resistance profile'), classTags: ['ESBL', 'MDR'], classNote: 'non-susceptible in 6 antibiotic classes; carbapenems susceptible. The same organism-driven rules that give MDR-TB on a TB isolate (D-178).',
    molecular: [['Third-generation cephalosporins (class)', 'Resistance marker detected (CTX-M)', 'BioFire BCID2 panel', 'This laboratory, 30 Sep 2026 (Culture, T-1)', 'Ceftriaxone R, ceftazidime R (VITEK 2, run 1)', 'agree', 'Multiplex PCR'], ['Carbapenems (class)', 'Resistance marker not detected (KPC)', 'BioFire BCID2 panel', 'This laboratory, 30 Sep 2026 (Culture, T-1)', 'Meropenem S, ertapenem S (VITEK 2, run 1)', 'agree', 'Multiplex PCR']] },
  critical: [['ISO-1', 'Infection prevention and control (email list)', 'Email, automatic', 'Alert rule "Resistant organism": ESBL, MDR Klebsiella pneumoniae, blood culture, Medical ward 3', 'Delivered 02 Oct 10:02', 'Sent'], ['Gram stain GS-1', 'Dr. Kaia, Medical ward 3 (ext. 2210)', 'Phone', 'Positive blood culture, Gram-negative bacilli, set 1', 'Read back confirmed', 'Closed'], ['Test T-1 (BCID2)', 'Dr. Kaia, Medical ward 3', 'Phone', 'K. pneumoniae with CTX-M (likely ESBL): ceftriaxone not effective', 'Read back confirmed', 'Closed']],
  report: {
    items: [
      { k: 'set1', group: 'culture', order: 10, sec: 'Culture · set 1', label: 'Blood culture, set 1 (left arm): positive, both bottles', d: 'On', on: true, print: [{ t: 'Blood culture, set 1 (left arm)', r: 'Positive, aerobic and anaerobic bottles' }] },
      { k: 'set2', group: 'culture', order: 20, sec: 'Culture · set 2', label: 'Blood culture, set 2 (right arm): no growth to date', d: 'On', on: true, print: [{ t: 'Blood culture, set 2 (right arm)', r: 'In progress (day 4 of 5)', ri: true, rb: false }] },
      { k: 'iso', group: 'culture', order: 30, sec: 'Isolates', label: BC_ISO, d: 'On (significant)', on: true, print: [{ t: BC_ISO, r: 'significant', rb: false, ind: 1 }] },
      ...BC_AGENTS.map((a, k) => ({ k: 'ag' + k, group: 'ast', iso: 'ISO-1', isoLabel: BC_ISO, order: 40 + k, sec: 'AST', label: `${a[0]} ${a[2]}`, d: a[4], on: true, print: [{ t: a[0], r: `${a[2]} · ${a[1]} µg/mL · CLSI M100 36th ed.`, ind: 1, bar: a[2] === 'R' }] })),
      { k: 'prof', group: 'ast', derived: true, order: 60, sec: 'AST', label: 'Resistance profile: ESBL, MDR', d: 'On', on: true, print: [{ t: 'Resistance profile', r: 'ESBL, MDR' }] },
      { k: 'wgsb', group: 'additional', hideIf: 'wgsb', order: 70, sec: 'Additional testing', label: 'Whole genome sequencing (pending)', d: 'Off (In lab only)', on: false, print: [{ t: 'Whole genome sequencing (on Isolate 1)', r: 'To follow', ri: true }] }],
    checklist: ['✗ Culture outcome: BC-004831-2A and BC-004831-2N incubating to 04 Oct', '✓ All isolates identified', ['ast'], '✗ Gram stain GS-2 has no result', ['program']],
    releases: [['Partial (positive set 1, Gram)', '30/09/2026 07:35 · P. Hiri'], ['Partial (BCID2: K. pneumoniae, CTX-M)', '30/09/2026 09:00 · P. Hiri']],
    callback: 'Callback: Dr. Kaia, 30/09/2026 07:30, by P. Hiri. Read back confirmed.', blocking: 3 },
  timeline: [['02 Oct 03:16', 'Suggested on ISO-1: Enterobacterales disk diffusion supplement, because ceftriaxone is R and gentamicin is R (reporting rule, Cascade)'], ['02 Oct 03:16', 'Ampicillin on ISO-1 set to R by expert rule "Klebsiella: ampicillin always R" (measured R)'], ['02 Oct 03:15', 'AST run 1 results in, VITEK 2 VK-01 · 12 antibiotics, ESBL positive'], ['01 Oct 09:30', 'ISO-1 identified, K. pneumoniae (MALDI-TOF) · P. Hiri'], ['01 Oct 07:42', 'BA-SUB-004831-1A3 incubation extended 24 Hours, colonies too small to identify or pick · P. Hiri'], ['30 Sep 07:30', '3 subcultures from BC-004831-1A (blood, MacConkey, chocolate agar) · P. Hiri'], ['30 Sep 07:20', 'Gram stain GS-1 on BC-004831-1A, reportable · P. Hiri'], ['30 Sep 03:42', 'BC-004831-1N positive at 30 Sep 03:42 (19 hours 12 minutes); Gram stain GS-2 added by rule (positive blood culture bottle)'], ['29 Sep 22:18', 'BC-004831-1A positive at 29 Sep 22:18 by analyzer signal (13 hours 48 minutes) · BacT/ALERT VIRTUO'], ['29 Sep 08:10', 'Case opened from order CPHL26-004831: 4 bottles, Blood culture (Collected in sets), Program AMR surveillance from the order']],
};

/* ---------- Example data: a received isolate from a sentinel site (FR-02.13 to FR-02.13c, D-218, D-219) ---------- */
const RI_LAB = 'Mount Hagen Provincial Hospital Laboratory';
const RI_ISO = 'Isolate 1: Escherichia coli (received from ' + RI_LAB + ')';
// [agent, MIC here, interpretation here, sender's interpretation ('' = not tested by the sender)]
const RI_AGENTS = [['Ampicillin', '≥32', 'R', 'R'], ['Amoxicillin-clavulanate', '8/4', 'S', 'S'], ['Ceftriaxone', '≥64', 'R', 'S'], ['Ceftazidime', '16', 'R', ''],
  ['Meropenem', '≤0.25', 'S', ''], ['Gentamicin', '≤1', 'S', 'S'], ['Ciprofloxacin', '≥4', 'R', 'S'], ['Trimethoprim-sulfamethoxazole', '≥320', 'R', 'R']];
const RI_EX = {
  ...BC_EX,
  lab: 'CPHL26-005102', labShort: '005102', tech: 'P. Hiri', patientName: 'Joseph Kuri', patient: 'Joseph Kuri, M, 47 y · from the sentinel site line list',
  setLines: undefined, samplesLabel: 'Sample', sampleSummary: 'CPHL26-005102-1 · Isolate (original specimen: Urine)', sampleIds: ['CPHL26-005102-1'], sampleType: 'Isolate', site: 'n/a (isolate)',
  labUnit: 'Microbiology', program: 'AMR surveillance', stage: [['blue', 'AST in progress']], status: 'In progress', statusTags: [], related: '', priority: 'Routine', history: [], historyNote: '',
  why: <><b>A received isolate from a sentinel site:</b> one Isolate sample entered from the {RI_LAB} line list, with Bacterial culture ticked Tested elsewhere and its reported organism (FR-02.13, FR-02.13a). The case opens with ISO-1 Received from that laboratory and the culture side closed as Growth (received isolate). The sender's AST is a Tested elsewhere panel on ISO-1 (FR-02.13b); where it disagrees with the AST done here, the run asks the validator to acknowledge it (FR-02.13c).</>,
  notes: {}, incoming: [],
  received: { lab: RI_LAB, reportedId: 'Escherichia coli', original: 'Urine', collected: '29 Sep 2026', atSender: '30/09/2026', here: '03 Oct 2026 09:20' },
  info: { origin: 'Outpatient', admission: '', diagnosis: 'From the line list: urinary tract infection (sentinel surveillance)', sets: '1',
    samples: [['CPHL26-005102-1', 'Isolate · agar slope', '', 'n/a (isolate)', '29 Sep (original specimen)', 'Line list']],
    samplesNote: 'Entered at order entry from the sentinel site line list (FR-02.13a); there is no line list import.',
    history: '', appliesTo: 'Applies to all cases on this order.', priorAb: [] },
  initial: [], noInitial: 'No direct tests on a received isolate.',
  additional: [], labOnly: {}, referrals: [],
  cultureNote: 'A received isolate arrives grown, so there is no inoculation of a primary specimen.',
  inoc: [], children: [], nextContainer: 'BA-SUB-005102-ISO1-1', suggestions: [],
  cultureTests: [{ name: 'Bacterial culture', result: 'Growth (received isolate)', state: 'Tested elsewhere', added: 'Ordered at reception · Tested elsewhere: ' + RI_LAB }],
  isolates: [{ id: 'ISO-1', from: 'Received isolate', gram: 'Gram-negative bacilli · lactose fermenter on MacConkey (purity check)', organism: 'Escherichia coli', idm: 'MALDI-TOF Biotyper (MB-01) · score 2.24', sig: 'Clinically significant', received: RI_LAB, reportedId: 'Escherichia coli' }],
  isoNote: null,
  astPanels: [{ name: 'Disk diffusion panel (as reported)', on: 'ISO-1', added: 'Tested elsewhere', method: 'Disk diffusion · standard as reported', run: 'External run: ' + RI_LAB + ', 6 agents', val: 'External (not validated here)' },
    { name: 'VITEK 2 AST-N405 (Enterobacterales)', on: 'ISO-1', added: 'Organism default', defaultFor: 'Enterobacterales, any sample type', method: 'VITEK 2 MIC · CLSI M100 36th ed. (2026)', run: 'Run 1, results in', val: 'Awaiting validation' }],
  ast: { ...BC_EX.ast, molecular: null, sender: RI_LAB,
    runNote: <>Run 1 (Original) <Tag kind="blue">Results in</Tag> from VITEK 2 Compact VK-01, 06 Oct 03:10. QC passed. The Sender column shows the {RI_LAB} panel, recorded as Tested elsewhere: kept as reported, never recalculated, never counted in surveillance (FR-02.13b).</>,
    readings: RI_AGENTS.map(a => ({ drug: a[0], method: 'VITEK 2 MIC', raw: a[1] + ' µg/mL', source: 'Analyzer', interp: a[2], sender: a[3] })),
    classTags: ['ESBL'], classNote: 'third-generation cephalosporins and ciprofloxacin resistant here, both reported susceptible by the sender.' },
  critical: [],
  report: {
    items: [
      { k: 'iso', group: 'culture', order: 30, sec: 'Isolates', label: RI_ISO, d: 'On', on: true, print: [{ t: 'Isolate received from ' + RI_LAB + ' †', r: 'Escherichia coli', rb: false }] },
      { k: 'snd', group: 'ast', order: 39, sec: 'AST · Tested elsewhere', label: 'Sender AST, ' + RI_LAB + ' (external)', d: 'Off (Tested elsewhere)', on: false, print: [{ t: 'Sender AST (' + RI_LAB + ') †', r: 'Ceftriaxone S, Ciprofloxacin S, Gentamicin S', rb: false, ind: 1 }] },
      ...RI_AGENTS.map((a, k) => ({ k: 'ri' + k, group: 'ast', iso: 'ISO-1', isoLabel: RI_ISO, order: 40 + k, sec: 'AST', label: `${a[0]} ${a[2]}`, d: 'Report · rule: Enterobacterales, any sample type', on: true, print: [{ t: a[0], r: `${a[2]} · ${a[1]} µg/mL · CLSI M100 36th ed.`, ind: 1, bar: a[2] === 'R' }] }))],
    checklist: ['✓ Culture outcome: Growth (received isolate)', '✓ ISO-1 identified', ['ast'], ['program']],
    releases: [], callback: '', blocking: 1 },
  timeline: [['06 Oct 03:10', 'AST run 1 results in, VITEK 2 VK-01 · 8 antibiotics'], ['04 Oct 10:05', 'ISO-1 identified, E. coli (MALDI-TOF), agrees with the reported identification · P. Hiri'], ['03 Oct 10:30', 'Sender AST recorded as Tested elsewhere on ISO-1 (' + RI_LAB + ', from the line list) · R. Opa'], ['03 Oct 09:20', 'Case opened from order CPHL26-005102: Isolate, Bacterial culture Tested elsewhere (' + RI_LAB + ', reported Escherichia coli), received at that laboratory 30 Sep · R. Opa']],
};

/* ---------- WORKLIST (bench work on the Worklist, no run: FR-12.6, D-172) ---------- */
const AWAITING = [
  { id: 'a1', lab: 'CPHL26-004820', who: 'Grace Wari', lu: 'Microbiology', spec: 'Urine, midstream', st: 'Urine', rec: '01 Oct 08:10' },
  { id: 'a2', lab: 'CPHL26-004821', who: 'Peter Gima', lu: 'Microbiology', spec: 'Urine, catheter', st: 'Urine', rec: '01 Oct 08:22' },
  { id: 'a3', lab: 'CPHL26-004823', who: 'Lucy Bona', lu: 'Microbiology', spec: 'Urine, midstream', st: 'Urine', rec: '01 Oct 08:40' },
  { id: 'a4', lab: 'CPHL26-004826', who: 'John Kerowa', lu: 'Microbiology', spec: 'Urine, midstream', st: 'Urine', rec: '01 Oct 09:05' },
  { id: 'a5', lab: 'CPHL26-004827', who: 'Ruth Kaupa', lu: 'Microbiology', spec: 'Wound swab, left foot', st: 'Wound swab', rec: '01 Oct 09:12' },
];
const DUE_ROWS = [
  { id: 'd1', kind: 'check', cid: 'CPHL26-004790-CLED-1', lab: 'CPHL26-004790', who: 'Mary Siune', med: 'CLED agar plate', day: 'Day 1 of 2', over: 6 },
  { id: 'd2', kind: 'check', cid: 'CPHL26-004790-BA-1', lab: 'CPHL26-004790', who: 'Mary Siune', med: 'Blood agar (sheep) plate', day: 'Day 1 of 2', over: 6 },
  { id: 'd3', kind: 'check', cid: 'CPHL26-004777-BA-1', lab: 'CPHL26-004777', who: 'Ward 4 surfaces (site)', med: 'Blood agar (sheep) plate', day: 'Day 1 of 2' },
  { id: 'd3b', kind: 'check', cid: 'CPHL26-004777-MAC-1', lab: 'CPHL26-004777', who: 'Ward 4 surfaces (site)', med: 'MacConkey agar plate', day: 'Day 1 of 2' },
  { id: 'd4', kind: 'check', cid: 'LJ-004812-B', lab: 'CPHL26-004812', who: 'Kila Nou', med: 'Löwenstein-Jensen slope', day: 'Day 35 of 56', stat: true },
  { id: 'd5', kind: 'final', cid: 'CPHL26-004801-CLED-1', lab: 'CPHL26-004801', who: 'Tom Ila', med: 'CLED agar plate', day: 'Day 2 of 2' },
  { id: 'd6', kind: 'final', cid: 'CPHL26-004801-BA-1', lab: 'CPHL26-004801', who: 'Tom Ila', med: 'Blood agar (sheep) plate', day: 'Day 2 of 2', over: 3 },
  { id: 'd7', kind: 'final', cid: 'CPHL26-004802-CLED-1', lab: 'CPHL26-004802', who: 'Anna Raka', med: 'CLED agar plate', day: 'Day 2 of 2', growth: 'Significant growth on Day 1' },
  { id: 'd7b', kind: 'final', cid: 'CPHL26-004802-BA-1', lab: 'CPHL26-004802', who: 'Anna Raka', med: 'Blood agar (sheep) plate', day: 'Day 2 of 2' },
  { id: 'd8', kind: 'final', cid: 'BC-004795-A', lab: 'CPHL26-004795', who: 'Ruth Kaupa', med: 'BACTEC Plus Aerobic/F bottle', day: 'Day 5 of 5', instr: true },
  { id: 'd8b', kind: 'final', cid: 'BC-004795-B', lab: 'CPHL26-004795', who: 'Ruth Kaupa', med: 'BACTEC Lytic/10 Anaerobic/F bottle', day: 'Day 5 of 5', instr: true },
];
const TEMPLATE = { name: 'Bacterial culture, Urine (CLED agar plate, Blood agar (sheep) plate)', media: [['CLED', 'CLED agar plate', ['CLED-26-201, exp 11/2026', 'CLED-26-188, exp 10/2026 (expiring)']], ['BA', 'Blood agar (sheep) plate', ['BA-26-117, exp 10/2026', 'BA-26-121, exp 12/2026']]] };

function Chip({ on, onClick, children, count, red, blue }) {
  return <span className={`chip ${on ? 'on' : ''}`} onClick={onClick}>{children}{count !== undefined && <span className={`count ${red ? 'red' : ''} ${blue ? 'blue' : ''}`}>{count}</span>}</span>;
}

function InoculatePanel({ cases, onSave, onCancel }) {
  const [lots, setLots] = useState({});
  const missing = TEMPLATE.media.filter(([c]) => !lots[c]).map(([, n]) => n);
  return <div className="sec" style={{ borderLeft: '4px solid #0f62fe' }}><div className="sec-b">
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Inoculate {cases.length} cases <span className="muted" style={{ fontWeight: 400 }}>(inline panel; each case gets its own rows and Timeline entry)</span></div>
    <div className="grid">
      <Field label={t('microbiology.worklist.template', 'Plating template') + ' (Urine)'}><Sel><option>{TEMPLATE.name}</option></Sel></Field>
      <Field label={t('microbiology.case.inoc.inoculatedAt', 'Inoculated at')}><Inp defaultValue="02 Oct 09:30" /><div className="helper">Defaults to the save time; set it to when the plates were inoculated</div></Field>
      {TEMPLATE.media.map(([c, n, opts]) => <Field key={c} label={`Lot for ${n} (tracked)`} req><Sel value={lots[c] || ''} onChange={e => setLots({ ...lots, [c]: e.target.value })}><option value="">{t('microbiology.worklist.chooseLot', 'Choose a lot')}</option>{opts.map(o => <option key={o}>{o}</option>)}</Sel></Field>)}
    </div>
    <p className="muted" style={{ margin: '.5rem 0' }}>{t('microbiology.worklist.inoculateSummary', `Creates ${cases.length * 2} plates on ${cases.length} cases: CLED ${cases.length}, BA ${cases.length}`)}. Container IDs: {cases[0].lab}-CLED-1, {cases[0].lab}-BA-1 and so on. Lots are recorded on each plate; stock is not changed.</p>
    <div className="row-actions">
      <Btn disabled={missing.length > 0} onClick={() => onSave(lots)}>Save</Btn>
      <Btn kind="secondary" onClick={onCancel}>{t('common.cancel', 'Cancel')}</Btn>
      {missing.length > 0 && <span className="muted" style={{ alignSelf: 'center' }}>Choose a lot for {missing.join(' and ')}.</span>}
    </div>
  </div></div>;
}

/* ---------- Bench sheet (FR-12.7, D-174): printed from a Worklist filter, reopened by its number ---------- */
const SHEET_TEMPLATES = { Urine: ['CLED agar plate', 'Blood agar (sheep) plate'] };
const SHEET_TITLES = { attention: 'Needs attention', awaiting: 'Awaiting inoculation', check: 'Check due', final: 'Final read due' };
function sheetGroups(sheet) {
  if (sheet.chip === 'attention') return [['', sheet.rows]];
  const key = sheet.chip === 'awaiting' ? r => r.st : r => r.med;
  const out = [];
  [...sheet.rows].sort((a, b) => (key(a) + a.lab).localeCompare(key(b) + b.lab)).forEach(r => { let g = out.find(x => x[0] === key(r)); if (!g) { g = [key(r), []]; out.push(g); } g[1].push(r); });
  return out;
}
function Barcode({ text }) {
  return <div style={{ display: 'inline-block', textAlign: 'center' }}><div style={{ height: 34, width: 170, background: 'repeating-linear-gradient(90deg,#000 0 2px,#fff 2px 3px,#000 3px 4px,#fff 4px 7px,#000 7px 10px,#fff 10px 11px)' }}></div><div className="mono" style={{ fontSize: 11 }}>{text}</div></div>;
}
function BenchSheet({ sheet, onClose }) {
  const box = <span style={{ display: 'inline-block', width: 14, height: 14, border: '1.5px solid #161616', verticalAlign: 'middle' }}></span>;
  const write = w => <span style={{ display: 'inline-block', width: w, borderBottom: '1px solid #161616', height: 16 }}></span>;
  const reading = sheet.chip === 'check' || sheet.chip === 'final';
  return <div className="sheet-wrap">
    <div className="row-actions no-print" style={{ marginBottom: '.5rem' }}><Btn onClick={() => window.print()}>Print</Btn><Btn kind="ghost" onClick={onClose}>Close</Btn><span className="muted anno" style={{ alignSelf: 'center' }}>The existing Workplan print, Microbiology bench layout (D-188); paper size from the deployment. Nothing on any case changes when it is printed.</span></div>
    <div className="sheet-paper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #161616', paddingBottom: 8, marginBottom: 8 }}>
        <div><div style={{ fontSize: 12 }}>Central Public Health Laboratory, Port Moresby · {sheet.lu}</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{t('workplan.type.microBench', 'Workplan · Microbiology bench')}: {sheet.title}{sheet.reprint ? ' (Reprint)' : ''}</div>
          <div style={{ fontSize: 12 }}>{t('microbiology.sheet.printedBy', `Printed by ${sheet.by}, ${sheet.at}`)} · {sheet.rows.length} rows · {sheet.scope}</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontWeight: 600 }} className="mono">{sheet.no}</div><Barcode text={sheet.no} /></div>
      </div>
      <Table size="sm" className="sheet-t"><TableHead><TableRow>
        <TableHeader style={{ width: 40 }}>Done</TableHeader><TableHeader>Lab number</TableHeader><TableHeader>Patient or site</TableHeader>
        {reading ? <><TableHeader>Container · day</TableHeader><TableHeader style={{ width: 70 }}>Reading</TableHeader><TableHeader style={{ width: 90 }}>Quantity</TableHeader></> : sheet.chip === 'awaiting' ? <><TableHeader>Specimen</TableHeader><TableHeader>Media to plate</TableHeader></> : <><TableHeader>Why</TableHeader><TableHeader style={{ width: 160 }}>Notes</TableHeader></>}
        <TableHeader style={{ width: 60 }}>Initials</TableHeader></TableRow></TableHead>
        <TableBody>{sheetGroups(sheet).map(([g, rows]) => <React.Fragment key={g || 'all'}>
          {g && <TableRow className="grp"><TableCell colSpan={7}>{g} ({rows.length})</TableCell></TableRow>}
          {rows.map(r => <TableRow key={r.id}>
            <TableCell>{box}</TableCell><TableCell style={{ whiteSpace: 'nowrap' }}><b>{r.lab}</b></TableCell><TableCell>{r.who}</TableCell>
            {reading ? <><TableCell className="mono" style={{ fontSize: 11 }}>{r.cid} · {r.day} · {r.kind === 'final' ? 'Final' : 'Check'}</TableCell>
              <TableCell>{r.instr ? <span style={{ fontSize: 11 }}>{t('microbiology.sheet.confirmOnScreen', 'Confirm on screen')}</span> : write(56)}</TableCell><TableCell>{r.instr ? '' : write(80)}</TableCell></>
              : sheet.chip === 'awaiting' ? <><TableCell style={{ fontSize: 12 }}>{r.spec}</TableCell><TableCell style={{ fontSize: 12 }}>{SHEET_TEMPLATES[r.st] ? SHEET_TEMPLATES[r.st].map(m => <div key={m}>{box} {m}</div>) : <div>{t('microbiology.sheet.noTemplate', 'No template: write the media')}<div>{write(150)}</div></div>}</TableCell></>
              : <><TableCell style={{ fontSize: 12 }}>{(r.reasons || []).join(', ')}</TableCell><TableCell>{write(150)}</TableCell></>}
            <TableCell>{write(48)}</TableCell></TableRow>)}
          {sheet.chip === 'awaiting' && g && SHEET_TEMPLATES[g] && <TableRow><TableCell colSpan={7} style={{ fontSize: 12 }}>{SHEET_TEMPLATES[g].map(m => <span key={m} style={{ marginRight: 24 }}>{t('microbiology.sheet.lotUsed', 'Lot used')}, {m}: {write(110)}</span>)}</TableCell></TableRow>}
        </React.Fragment>)}</TableBody></Table>
      <div style={{ borderTop: '1px solid #161616', marginTop: 10, paddingTop: 6, fontSize: 11, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span>{reading ? t('microbiology.sheet.codes', 'Reading codes: NG No growth, NF Normal flora, MG Mixed growth, SG Significant growth (write the quantity), C Contaminated') : sheet.chip === 'awaiting' ? 'Tick each medium as it is plated; write the lot used once per medium.' : ''}</span>
        <span style={{ whiteSpace: 'nowrap' }}>{t('microbiology.sheet.confidential', 'Contains patient information. Shred after use.')} · {sheet.no} · Page 1 of 1</span>
      </div>
    </div>
  </div>;
}

const QC_STRAINS = { 'Enterobacterales': { strain: 'Escherichia coli ATCC 25922', lot: 'QC-EC25922-2610', ranges: { Ampicillin: '2 to 8', Ceftriaxone: '0.03 to 0.12', Gentamicin: '0.25 to 1', Ciprofloxacin: '0.004 to 0.016', Meropenem: '0.008 to 0.06' } } };
const inRange = (range, v) => { const [lo, hi] = range.split(' to ').map(Number); const x = Number(String(v).replace(/[^0-9.]/g, '')); return v !== '' && !isNaN(x) && x >= lo && x <= hi; };
/* The built "Reagents, QC & Controls" section of Results Entry (ReagentsQcSection.tsx, OGC-1024 and OGC-1025,
   POST /rest/qc/results from OGC-1147), placed on the AST run. v3 adds one control row per antibiotic (D-293). */
function AstControls({ lot, analyzer }) {
  const q = QC_STRAINS.Enterobacterales;
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState(Object.fromEntries(Object.keys(q.ranges).map(k => [k, ''])));
  const [saved, setSaved] = useState(null);
  const all = Object.keys(q.ranges).every(k => vals[k] !== '');
  const fails = Object.keys(q.ranges).filter(k => vals[k] !== '' && !inRange(q.ranges[k], vals[k]));
  return <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '.75rem', marginBottom: '.75rem' }}>
    <b style={{ fontSize: 14 }}>{t('label.results.section.reagents', 'Reagents, QC & Controls')}</b> <span className="muted anno">the Results Entry section, reused on the AST run (D-293)</span>
    <div style={{ marginTop: 6 }}>{t('label.results.reagents.lotsUsed', 'Lots used')}: {lot} <Tag kind="green">{t('micro.lot.qcPassed', 'Lot QC passed')}</Tag> <span className="muted">{analyzer ? t('label.results.reagents.summary.analyzer', 'Analyzer QC') + ': ' + analyzer + ', passed' : ''}</span></div>
    {saved ? <Notice kind={saved === 'Pass' ? 'success' : 'warning'} style={{ marginTop: '.5rem' }}>{saved === 'Pass' ? t('label.results.control.capture.recorded', 'Control result recorded.') : t('label.results.control.capture.recordedBlocked', 'Control result recorded. Reporting is blocked for covered results until a passing repeat is recorded.')}</Notice>
      : !open ? <div className="row-actions"><Btn kind="tertiary" onClick={() => setOpen(true)}>{t('label.results.control.capture.record', 'Record control result')}</Btn><span className="muted" style={{ alignSelf: 'center' }}>{t('micro.astQc.when', 'For a new lot, and on the schedule your QC policy sets for this panel')}</span></div>
      : <div style={{ marginTop: '.5rem' }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}><Field label={t('label.results.control.capture.lot', 'Control lot')}><Sel aria-label="Control lot" defaultValue={q.lot}><option value={q.lot}>{q.strain}, lot {q.lot}</option></Sel><div className="helper">{t('micro.astQc.strainHelp', 'QC strains are control lots in QC › Control Lots')}</div></Field></div>
        <Table size="sm" style={{ marginTop: 6 }}><TableHead><TableRow><TableHeader>Antibiotic</TableHeader><TableHeader>{t('label.results.control.capture.measured', 'Measured value')}</TableHeader><TableHeader>{t('label.results.control.capture.expected', 'Expected value')}</TableHeader><TableHeader>{t('label.results.control.capture.outcome', 'Outcome')}</TableHeader></TableRow></TableHead>
          <TableBody>{Object.keys(q.ranges).map(k => <TableRow key={k}><TableCell>{k}</TableCell><TableCell><Inp aria-label={'Control measured value for ' + k} value={vals[k]} style={{ width: 110 }} onChange={e => setVals({ ...vals, [k]: e.target.value })} placeholder="µg/mL" /></TableCell><TableCell>{q.ranges[k]} µg/mL<div className="muted" style={{ fontSize: 12 }}>QC range from the reference pack</div></TableCell>
            <TableCell>{vals[k] === '' ? <span className="muted">awaiting</span> : inRange(q.ranges[k], vals[k]) ? <Tag kind="green">{t('label.results.control.capture.pass', 'Pass')}</Tag> : <Tag kind="red">{t('label.results.control.capture.fail', 'Fail')}</Tag>}</TableCell></TableRow>)}</TableBody></Table>
        {fails.length > 0 && <Notice kind="warning" style={{ marginTop: '.5rem' }}>{t('label.results.control.capture.blockedHint', 'A failing control blocks reporting for covered results; a repeat run is expected.')} ({fails.join(', ')})</Notice>}
        <div className="row-actions"><Btn disabled={!all} onClick={() => { setSaved(fails.length ? 'Fail' : 'Pass'); setOpen(false); }}>{t('label.results.control.capture.record', 'Record control result')}</Btn><Btn kind="ghost" onClick={() => setOpen(false)}>Cancel</Btn></div>
        <p className="muted anno">As built: each row posts a control result to /rest/qc/results; a failing control opens an NCE and holds the covered results at validation; history is in the QC dashboard. v3 adds a row per antibiotic with the expected range filled from the QC range domain of the reference packs (EUCAST ships; CLSI entered by the lab), and a passing control on a lot in QC Pending sets the lot's QC status to Passed (D-293).</p></div>}
  </div>;
}

function Worklist() {
  const [card, setCard] = useState('attention');
  const [chip, setChip] = useState('attention');
  const [sel, setSel] = useState([]);
  const [due, setDue] = useState(DUE_ROWS);
  const [awaiting, setAwaiting] = useState(AWAITING);
  const [inoc, setInoc] = useState(false);
  const [toast, setToast] = useState(null);
  const [wlExt, setWlExt] = useState(null);
  const [wlExtReason, setWlExtReason] = useState('');
  const [neg, setNeg] = useState(false);
  const [sheetView, setSheetView] = useState(null);
  const [sheets, setSheets] = useState([{ no: 'BS-261001-07', chip: 'final', title: 'Final read due', lu: 'Microbiology', by: 'J. Kaupa', at: '01 Oct 2026 16:10', scope: 'all rows in the filter', rows: DUE_ROWS.filter(r => r.kind === 'final') }]);
  const [openSheet, setOpenSheet] = useState(null);
  const [sheetPick, setSheetPick] = useState(false);
  const [sheetNo, setSheetNo] = useState('');
  const [done, setDone] = useState({ });
  const [rows, setRows] = useState([
    { lab: 'CPHL26-004812', who: 'Kila Nou', lu: 'TB', spec: 'Sputum', reasons: ['Check due', 'Incoming results', 'Suggested: 1'], day: 'Day 35 of 42', status: 'Partial', tags: ['Referred'] },
    { lab: 'CPHL26-004831', who: 'Mere Toua', lu: 'Microbiology', spec: 'Blood culture, 2 sets', reasons: ['Suggested: 1'], day: 'Day 4 of 5', status: 'Partial', tags: [] },
    { lab: 'CPHL26-004790', who: 'Mary Siune', lu: 'Microbiology', spec: 'Urine', reasons: ['Check due'], day: 'Day 1 of 2', status: 'In progress', tags: [] },
    { lab: 'CPHL26-004801', who: 'Tom Ila', lu: 'Microbiology', spec: 'Urine', reasons: ['Incubation complete'], day: 'Day 2 of 2', status: 'In progress', tags: [] },
    { lab: 'CPHL26-004702', who: 'Tau Morea', lu: 'TB', spec: 'Sputum', reasons: ['Referral returned'], day: 'Referred', status: 'Partial', tags: ['Referral returned'] },
    { lab: 'CPHL26-004828', who: 'Joseph Aisi', lu: 'Microbiology', spec: 'Wound swab (Bacterial culture)', reasons: ['Program not set'], day: 'Received 08:12', status: 'In progress', tags: [] },
    { lab: 'CPHL26-004795', who: 'Ruth Kaupa', lu: 'Microbiology', spec: 'Blood culture, 2 sets', reasons: ['Instrument negative to confirm'], day: 'Day 5 of 5', status: 'In progress', tags: [] },
    { lab: 'CPHL26-004655', who: 'Grace Wari', lu: 'Microbiology', spec: 'Urine', reasons: ['Amendment to release'], day: 'Complete', status: 'Final', tags: ['Amendment open'] },
  ]);
  const say = (msg, undo) => { setToast({ msg, undo }); setTimeout(() => setToast(x => (x && x.msg === msg ? null : x)), 6000); };
  const byUrgency = (a, b) => (b.stat ? 1 : 0) - (a.stat ? 1 : 0) || (b.over || 0) - (a.over || 0);
  const checks = due.filter(r => r.kind === 'check').sort(byUrgency), finals = due.filter(r => r.kind === 'final').sort(byUrgency);
  const filterList = chip === 'check' ? checks : chip === 'final' ? finals : chip === 'awaiting' ? awaiting : [];
  const list = openSheet && openSheet.chip !== 'attention' ? sheetGroups(openSheet).flatMap(([g, rs]) => rs.map(r => ({ ...r, grp: g, gone: !(due.some(d => d.id === r.id) || awaiting.some(a => a.id === r.id)) }))) : filterList;
  const picked = list.filter(r => sel.includes(r.id));
  const skipReason = r => r.instr ? 'needs Confirm (instrument negative)' : r.growth ? 'growth already recorded, open the case' : null;
  const recordNoGrowth = (targets) => {
    const go = targets.filter(r => !skipReason(r));
    const before = due;
    setDue(due.filter(r => !go.some(g => g.id === r.id)));
    setDone(d => ({ ...d, ...Object.fromEntries(go.map(r => [r.id, 'No growth recorded by you, 08:40'])) }));
    setSel([]);
    const f = go.filter(r => r.kind === 'final').length;
    say(`${t('microbiology.worklist.recorded', `No growth recorded on ${go.length} rows`)}${f ? `; ${f} final reads also record the row outcome No growth` : '; next checks set'}. On each case's Timeline.`, () => setDue(before));
  };
  const types = [...new Set(picked.map(p => p.st))];
  const refusal = chip === 'awaiting' && types.length > 1 ? t('microbiology.worklist.oneSampleType', `Inoculate needs one sample type: ${picked.filter(p => p.st !== picked[0].st).length} selected case is ${picked.filter(p => p.st !== picked[0].st)[0].st}`) : '';
  const go = picked.filter(r => !skipReason(r)), skipped = picked.filter(r => skipReason(r));
  const printSheet = () => {
    const src = chip === 'attention' ? rows.map(r => ({ ...r, id: r.lab })) : list;
    const chosen = picked.length ? picked : src;
    const sh = { no: `BS-261002-0${sheets.length + 2}`, chip, title: SHEET_TITLES[chip], lu: 'Microbiology', by: 'J. Kaupa', at: '02 Oct 2026 08:05', scope: picked.length ? 'selected rows' : 'all rows in the filter', rows: chosen };
    setSheets([sh, ...sheets]); setSheetView(sh);
  };
  const openByNo = no => { const sh = sheets.find(x => x.no === no.trim()); if (sh) { setOpenSheet(sh); setSheetPick(false); setSel([]); setChip(sh.chip); } else say(`No sheet ${no} in the last 7 days.`); };
  if (sheetView) return <BenchSheet sheet={sheetView} onClose={() => setSheetView(null)} />;
  return <div>
    <Breadcrumb noTrailingSlash style={{ marginBottom: '.5rem' }}><BreadcrumbItem href="#">Home</BreadcrumbItem><BreadcrumbItem href="#">Microbiology</BreadcrumbItem><BreadcrumbItem isCurrentPage>Worklist</BreadcrumbItem></Breadcrumb>
    <h1>Worklist</h1>
    <div className="seg" style={{ marginBottom: '.75rem' }}><button className="on">{t('microbiology.worklist.mode.cultures', 'Cultures')}</button><button>{t('microbiology.worklist.mode.ast', 'AST')}</button></div>
    <div className="card-row">
      {[['attention', t('microbiology.worklist.card.attention', 'Needs attention'), rows.length], ['incubating', 'Incubating', 31], ['positive', 'Growth detected', 9], ['ast', 'AST / DST in progress', 14], ['ready', 'Ready to finalize', 6]].map(([k, l, n]) =>
        <div key={k} className={`card ${card === k ? 'on' : ''}`} onClick={() => setCard(k)}><div className="muted">{l}</div><div className="n">{n}</div></div>)}
    </div>
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '.75rem' }}>
      <div className="field" style={{ width: 220 }}><label>{t('micro.worklist.filter.status', 'Status')} <span className="new3">v3</span></label><Sel><option>All</option><optgroup label="Status"><option>In progress</option><option>Partial</option><option>Final</option><option>Amended</option></optgroup><optgroup label="Tag"><option>Referred</option><option>Referral returned</option><option>Amendment open</option></optgroup></Sel></div>
      <div className="field" style={{ width: 200 }}><label>{t('microbiology.worklist.filter.program', 'Program')}</label><Sel><option>All</option><option>TB Program</option><option>AMR surveillance</option><option>Bacteriology (routine)</option><option>Mycology</option></Sel></div>
      <div className="field" style={{ width: 260 }}><label>Lab unit</label><Sel><option>All (TB, Microbiology, Environmental Microbiology)</option><option>TB</option><option>Microbiology</option><option>Environmental Microbiology</option></Sel></div>
    </div>
    <div className="chips">
      {[['attention', t('microbiology.worklist.card.attention', 'Needs attention'), rows.length], ['awaiting', t('microbiology.worklist.awaitingInoculation', 'Awaiting inoculation'), awaiting.length], ['check', t('microbiology.worklist.checkDue', 'Check due'), checks.length], ['final', t('microbiology.worklist.finalReadDue', 'Final read due'), finals.length]].map(([k, l, n]) =>
        <Chip key={k} on={chip === k} onClick={() => { setChip(k); setSel([]); setInoc(false); setOpenSheet(null); }} count={n} blue={k !== 'attention'}>{l}</Chip>)}
      <span style={{ flex: 1 }}></span>
      {(chip === 'check' || chip === 'final') && <Btn disabled={!go.length} onClick={() => recordNoGrowth(picked)}>{t('microbiology.worklist.noGrowthBulk', `No growth (${go.length})`)}</Btn>}
      {chip === 'awaiting' && <Btn disabled={!picked.length || !!refusal} onClick={() => setInoc(true)}>{t('microbiology.worklist.inoculate', `Inoculate (${picked.length})`)}</Btn>}
      {!openSheet && <Btn kind="tertiary" onClick={printSheet}>{t('microbiology.worklist.printSheet', 'Print workplan')}{picked.length ? ` (${picked.length})` : ''}</Btn>}
      <Btn kind="ghost" onClick={() => setSheetPick(!sheetPick)}>{t('microbiology.worklist.openSheet', 'Open sheet')}</Btn>
    </div>
    {sheetPick && <div className="sec"><div className="sec-b"><div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
      <div className="field" style={{ width: 280 }}><label>Sheet number (type or scan the barcode)</label><Inp value={sheetNo} onChange={e => setSheetNo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') openByNo(sheetNo); }} placeholder="BS-261001-07" /></div>
      <Btn onClick={() => openByNo(sheetNo)}>Open</Btn></div>
      <div className="muted" style={{ marginTop: '.5rem' }}>Your sheets, last 7 days:</div>
      {sheets.map(x => <div key={x.no}><a href="#" style={{ color: '#0f62fe' }} onClick={e => { e.preventDefault(); openByNo(x.no); }}>{x.no}</a> <span className="muted">{x.title} · {x.rows.length} rows · {x.at}</span></div>)}
    </div></div>}
    {openSheet && <div className="note-box" style={{ marginBottom: '.75rem', display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <b>{t('microbiology.sheet.banner', `Sheet ${openSheet.no}: ${openSheet.title}, printed by ${openSheet.by}, ${openSheet.at}`)}</b>
      <span className="muted">Same rows, same order and groups as the paper.</span><span style={{ flex: 1 }}></span>
      <Btn kind="tertiary" onClick={() => setSheetView({ ...openSheet, reprint: true })}>{t('microbiology.worklist.reprint', 'Reprint')}</Btn>
      <Btn kind="ghost" onClick={() => setOpenSheet(null)}>{t('microbiology.worklist.closeSheet', 'Close sheet')}</Btn></div>}
    {(chip === 'check' || chip === 'final') && picked.length > 0 && <p className="muted" style={{ marginTop: '-.5rem' }}>{t('microbiology.worklist.noGrowthSummary', `Records No growth on ${go.length} rows: ${go.filter(r => r.kind === 'check').length} checks, ${go.filter(r => r.kind === 'final').length} final reads`)}.{skipped.length > 0 && ` ${t('microbiology.worklist.skipped', `${skipped.length} will be skipped`)}: ${skipped.map(r => `${r.cid} ${skipReason(r)}`).join('; ')}.`}</p>}
    {refusal && <p className="muted" style={{ marginTop: '-.5rem', color: '#da1e28' }}>{refusal}</p>}
    {inoc && <InoculatePanel cases={picked} onCancel={() => setInoc(false)} onSave={() => { const before = awaiting; setAwaiting(awaiting.filter(a => !picked.some(p => p.id === a.id))); const n = picked.length; setSel([]); setInoc(false); say(`${n} cases inoculated: ${n * 2} culture rows created with lots recorded, no stock change. Print plate labels (${n * 2})?`, () => setAwaiting(before)); }} />}
    {chip !== 'attention' && <div className="sec"><Table size="sm"><TableHead><TableRow>
      <TableHeader style={{ width: 28 }}><Inp type="checkbox" className="sel" title="Select all in this filter" checked={list.length > 0 && list.every(x => sel.includes(x.id))} onChange={e => setSel(e.target.checked ? list.map(x => x.id) : [])} /></TableHeader>
      {chip === 'awaiting' ? <><TableHeader>Lab number</TableHeader><TableHeader>Patient or site</TableHeader><TableHeader>Lab unit</TableHeader><TableHeader>Specimen</TableHeader><TableHeader>Received</TableHeader></>
        : <><TableHeader>Container</TableHeader><TableHeader>Lab number</TableHeader><TableHeader>Patient or site</TableHeader><TableHeader>Medium</TableHeader><TableHeader>Incubation</TableHeader><TableHeader></TableHeader></>}
    </TableRow></TableHead><TableBody>{list.map((r, i) => <React.Fragment key={r.id}>{openSheet && r.grp && (i === 0 || list[i - 1].grp !== r.grp) && <TableRow><TableCell colSpan={7} style={{ background: '#e0e0e0', fontWeight: 600 }}>{r.grp}</TableCell></TableRow>}<TableRow>
      <TableCell><Inp type="checkbox" className="sel" disabled={r.gone} checked={sel.includes(r.id)} onChange={() => setSel(s => s.includes(r.id) ? s.filter(x => x !== r.id) : [...s, r.id])} /></TableCell>
      {chip === 'awaiting' ? <><TableCell><a href="#" style={{ color: '#0f62fe' }}>{r.lab}</a></TableCell><TableCell>{r.who}</TableCell><TableCell>{r.lu}</TableCell><TableCell>{r.spec}</TableCell><TableCell>{r.rec}</TableCell></>
        : <><TableCell className="mono">{r.cid}</TableCell><TableCell>{r.lab}</TableCell><TableCell>{r.who}</TableCell><TableCell>{r.med}</TableCell><TableCell>{r.day}{r.stat && <> <Tag kind="red">STAT</Tag></>}{r.over && <div><Tag kind="red">{t('microbiology.worklist.overdue', 'Overdue {0}').replace('{0}', r.over + ' h')}</Tag></div>}{r.growth && <div><Tag kind="red">{r.growth}</Tag></div>}{r.instr && <div><Tag kind="purple">BACTEC FX: negative, protocol complete</Tag></div>}</TableCell>
          <TableCell style={{ whiteSpace: 'nowrap' }}>{r.gone ? <Tag kind="green">{done[r.id] || 'Recorded since printing'}</Tag> : r.instr ? <Btn kind="ghost" onClick={() => { setDue(due.filter(x => x.id !== r.id)); say(`${r.cid}: instrument negative confirmed; row outcome No growth.`); }}>{t('microbiology.case.inoc.confirm', 'Confirm')}</Btn>
            : !r.growth && <Btn kind="tertiary" onClick={() => recordNoGrowth([r])}>{t('microbiology.worklist.noGrowth', 'No growth')}</Btn>}
            {r.kind === 'final' && !r.gone && !r.instr && <Btn kind="ghost" onClick={() => { setWlExt(r.id); setWlExtReason(''); }}>{t('microbiology.worklist.extend', 'Extend 24 h')}</Btn>}
            <Btn kind="ghost">{t('microbiology.worklist.openCase', 'Open case')}</Btn></TableCell></>}
    </TableRow>{wlExt === r.id && <TableRow><TableCell></TableCell><TableCell colSpan={6}><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span className="muted">{t('microbiology.case.inoc.extend', 'Extend incubation')} {r.cid} by 24 Hours:</span><Sel value={wlExtReason} onChange={e => setWlExtReason(e.target.value)} aria-label="Extend reason"><option value="" disabled>Reason</option>{EXT_REASONS.filter(x => x !== 'Other').map(x => <option key={x}>{x}</option>)}</Sel><Btn disabled={!wlExtReason} onClick={() => { const keep = due; setDue(due.filter(x => x.id !== r.id)); setWlExt(null); say(`${r.cid}: incubation extended 24 Hours (${wlExtReason}); it comes back on Final read due tomorrow.`, () => setDue(keep)); }}>Extend</Btn><Btn kind="ghost" onClick={() => setWlExt(null)}>Cancel</Btn><span className="muted">Other lengths and reasons: Extend incubation on the case.</span></div></TableCell></TableRow>}</React.Fragment>)}</TableBody></Table>{list.length === 0 && <p className="muted" style={{ padding: '1rem' }}>Nothing due.</p>}</div>}
    {chip === 'attention' && <div className="sec"><Table size="sm"><TableHead><TableRow><TableHeader>Lab number</TableHeader><TableHeader>Patient or site</TableHeader><TableHeader>Lab unit</TableHeader><TableHeader>Specimen</TableHeader><TableHeader>Why it needs attention</TableHeader><TableHeader>Incubation</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
      <TableBody>{rows.map(r => <TableRow key={r.lab}><TableCell><a href="#" style={{ color: '#0f62fe' }}>{r.lab}</a><div><Tag kind={STATUS_KIND[r.status]}>{r.status}</Tag>{r.tags.map(x => <Tag key={x} kind="purple">{x}</Tag>)}</div></TableCell><TableCell>{r.who}</TableCell><TableCell>{r.lu}</TableCell><TableCell>{r.spec}</TableCell>
        <TableCell>{r.reasons.map(x => <Tag key={x} kind={x === 'Incubation complete' ? 'red' : x === 'Check due' ? 'warm-gray' : x === 'Program not set' ? 'warm-gray' : x.startsWith('Suggested') ? 'teal' : /Referr/.test(x) ? 'purple' : 'gray'}>{x}</Tag>)}</TableCell><TableCell>{r.day}</TableCell>
        <TableCell>{r.reasons.includes('Program not set') && <Sel defaultValue="" aria-label="Program" onChange={e => { setRows(rows.map(x => x.lab === r.lab ? { ...x, reasons: x.reasons.filter(y => y !== 'Program not set') } : x)); say(`${r.lab}: Program ${e.target.value} set (Timeline).`); }}><option value="" disabled>{t('microbiology.case.program', 'Program')}</option><option>Bacteriology (routine)</option><option>AMR surveillance</option><option>TB Program</option></Sel>}
          {r.reasons.includes('Instrument negative to confirm') && (neg ? <span className="muted">BC-004795-A to -D: No growth, protocol complete, confirmed by J. Kaupa</span> : <div><span className="muted">BACTEC FX: 4 bottles negative, protocol complete</span> <Btn kind="ghost" onClick={() => setNeg(true)}>{t('microbiology.case.inoc.confirm', 'Confirm')}</Btn></div>)}</TableCell></TableRow>)}</TableBody></Table></div>}
    <p className="muted anno"><span className="new3">v3</span> Status is one of In progress, Partial, Final or Amended; Referred, Referral returned and Amendment open are tags (D-Q6). "Suggested" counts isolates with a suggestion nobody has added or dismissed (R-04). Final cases leave the bench lists; each culture test appears once; the lab unit filter lists active, visible units only (R-BENCH-2).</p>
    <p className="muted anno">Check due and Final read due list culture rows, STAT first, then the most overdue (D-199); an overdue row shows how late it is. Check due covers both due and overdue rows. No growth on a check records the reading and sets the next check; on a final read it also records the row outcome. Extend 24 h on a final read keeps the row open for another day, with a reason (colonies not mature enough to read or pick). Anything else is read on the case (Open case). Every write is the case's own, on its Timeline, with Undo in the toast. Disabled offline.</p>
    <div className="legend">Try: Final read due, Print bench sheet to see the paper (grouped by medium, name and lab number on every row); Open sheet, BS-261001-07, then No growth on a row and see it marked recorded; Check due, No growth on one row, then Undo; Final read due, select all, No growth (3), and see the skipped rows named; Awaiting inoculation, tick the four urines, Inoculate, choose the lots, Save; tick the wound swab too to see the refusal.</div>
    {toast && <div className="toast"><div className="cds--inline-notification cds--inline-notification--success" style={{ maxWidth: 520 }}><div className="cds--inline-notification__details"><div className="cds--inline-notification__text-wrapper"><div className="cds--inline-notification__title">Done</div><div className="cds--inline-notification__subtitle">{toast.msg} {toast.undo && <button className="cds--btn cds--btn--ghost cds--btn--sm" onClick={() => { toast.undo(); setToast(null); }}>{t('common.undo', 'Undo')}</button>}</div></div></div></div></div>}
  </div>;
}

function CatalogFieldDemo() {
  const [on, setOn] = useState('Yes');
  const [progs, setProgs] = useState([['TB Program', true, 'TB'], ['AMR surveillance', true, 'Bacterial'], ['Bacteriology (routine)', true, 'Bacterial'], ['Mycology', true, 'Mycology'], ['HIV Program', false, ''], ['Malaria Program', false, '']]);
  const [methods, setMethods] = useState([['MALDI-TOF', true], ['VITEK 2', true], ['Biochemical (manual)', true], ['Molecular (PCR)', true], ['EIA', false], ['HIV test kit', false], ['Syphilis test kit', false], ['HPLC', false]]);
  return <div>
  <div className="sec" style={{ marginBottom: '1.5rem' }}><div className="sec-b">
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Test catalog: Bacterial culture <span className="muted" style={{ fontWeight: 400 }}>(Basic Info, abbreviated; the rest of the test editor is unchanged)</span> <span className="new">v2</span> <span className="new3">v3: no Case role</span></div>
    <div className="grid">
      <Field label={t('catalog.test.opensMicroCase', 'Opens a Microbiology case')}><Sel value={on} onChange={e => setOn(e.target.value)}><option>No</option><option>Yes</option></Sel><div className="helper">On the create form and the edit form. No: results go through Results as usual. Yes: the test opens or joins the case for its order, sample type and lab unit.</div></Field>
      <Field label="Reportable (existing)"><Sel defaultValue="Yes"><option>Yes</option><option>No</option></Sel><div className="helper">{t('catalog.test.reportable.microHelp', 'When off, this test starts In lab only on a Microbiology case.')}</div></Field>
      {on === 'Yes' && <Field label={t('catalog.test.collectedInSets', 'Collected in sets')}><Sel defaultValue="No"><option>No</option><option>Yes</option></Sel><div className="helper">Yes for blood culture: every bottle on the order joins one case</div></Field>}
    </div>
    <div className="note-box anno" style={{ marginTop: '.75rem' }}><span className="new3">v3</span> There is no Case role and no Culture checkbox (D-Q5). A test is a culture because media are linked to it (Reagents and media, below): inoculating a medium on a case adds its culture test to the order if it is not there. Direct tests (Gram stain, AFB smear, Xpert, India ink) are ordinary tests, ordered at reception or added on the case, each validated and released on its own. Case-role tests ("Microbiology case", "TB case") are retired; on upgrade, open orders that use one are listed for review.</div>
  </div></div>
  <div className="sec" style={{ marginBottom: '1.5rem' }}><div className="sec-b">
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Test catalog: Blood culture · {t('label.testCatalog.alerts.title', 'Alerts')} (existing section) <span className="new3">v3 trigger</span></div>
    <Table size="sm"><TableHead><TableRow><TableHeader>Rule</TableHeader><TableHeader>{t('label.testCatalog.alerts.field.trigger', 'Trigger')}</TableHeader><TableHeader>Notify</TableHeader><TableHeader>{t('label.testCatalog.alerts.field.ack', 'Acknowledgement')}</TableHeader><TableHeader>Status</TableHeader></TableRow></TableHead>
      <TableBody>
        <TableRow><TableCell>Resistant organism</TableCell><TableCell><Tag kind="teal">{t('label.testCatalog.alerts.trigger.MICRO_PROFILE', 'Organism or resistance profile')}</Tag><div className="muted">Resistance profile is CRE, ESBL, MRSA or VRE</div></TableCell><TableCell>Email: infection prevention and control list<div className="muted">Role: Microbiology validator (in-app)</div></TableCell><TableCell>{t('label.testCatalog.alerts.ack.notRequired', 'Not required')}</TableCell><TableCell><Tag kind="green">Active</Tag></TableCell></TableRow>
        <TableRow><TableCell>Candida auris</TableCell><TableCell><Tag kind="teal">{t('label.testCatalog.alerts.trigger.MICRO_PROFILE', 'Organism or resistance profile')}</Tag><div className="muted">Organism is Candida auris</div></TableCell><TableCell>Email: infection prevention and control list</TableCell><TableCell>{t('label.testCatalog.alerts.ack.notRequired', 'Not required')}</TableCell><TableCell><Tag kind="green">Active</Tag></TableCell></TableRow>
        <TableRow><TableCell>Critical value</TableCell><TableCell><Tag kind="gray">{t('label.testCatalog.alerts.trigger.CRITICAL', 'Critical')}</Tag></TableCell><TableCell>Ordering physician (phone, logged)</TableCell><TableCell>Required</TableCell><TableCell><Tag kind="green">Active</Tag></TableCell></TableRow></TableBody></Table>
    <p className="muted anno" style={{ marginTop: '.5rem' }}>The existing Alerts section and rule editor (AlertsSection.jsx, AlertRuleModal.jsx; TestAlertRule with notify email, custom email, role and acknowledgement). v3 adds one trigger type, "Organism or resistance profile", whose value is an organism or group (taxonomy matcher, R-12) or a resistance profile from the existing classification (ESBL, CRE, MRSA, VRE, MDR, MDR-TB). It fires on validated results only, so infection control gets an email the way critical results already reach people (D-292).</p>
  </div></div>
  <div className="sec" style={{ marginBottom: '1.5rem' }}><div className="sec-b">
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Methods (existing Admin › Methods) <span className="new3">v3 column</span></div>
    <Table size="sm"><TableHead><TableRow><TableHeader>Method</TableHeader><TableHeader>{t('admin.method.microIdentification', 'Used for microbiology identification')}</TableHeader></TableRow></TableHead>
      <TableBody>{methods.map((m, i) => <TableRow key={m[0]}><TableCell>{m[0]}</TableCell><TableCell><Inp type="checkbox" checked={m[1]} aria-label={'Used for microbiology identification: ' + m[0]} onChange={e => setMethods(methods.map((x, k) => k === i ? [x[0], e.target.checked] : x))} style={{ width: 'auto' }} /></TableCell></TableRow>)}</TableBody></Table>
    <p className="muted anno">The isolate's ID method lists only the methods ticked here, by their translated names (D-Q2). Nothing else changes in the Method dictionary.</p>
  </div></div>
  <div className="sec" style={{ marginBottom: '1.5rem' }}><div className="sec-b">
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Test catalog: MTB/RIF Ultra · Result components (existing editor) <span className="new3">v3 resistance mapping</span></div>
    <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '.5rem' }}>
      <Field label="Method"><Sel aria-label="Method" defaultValue="GeneXpert"><option>GeneXpert</option><option>Line probe assay</option><option>Multiplex PCR</option><option>Sequencing</option></Sel><div className="helper">The existing Method linked to the test; it names the technique</div></Field></div>
    <Table size="sm"><TableHead><TableRow><TableHeader>Component</TableHeader><TableHeader>Result type</TableHeader><TableHeader>{t('catalog.test.component.resistanceFor', 'Resistance for')}</TableHeader><TableHeader>{t('catalog.test.component.valueMapping', 'Values')}</TableHeader></TableRow></TableHead>
      <TableBody><TableRow><TableCell>MTB</TableCell><TableCell>Coded: Detected (very low to high), Not detected, Trace, Invalid</TableCell><TableCell><Sel aria-label="Resistance for MTB" defaultValue=""><option value="">None</option></Sel></TableCell><TableCell className="muted">n/a</TableCell></TableRow>
        <TableRow><TableCell>Rifampicin resistance</TableCell><TableCell>Coded: Detected, Not detected, Indeterminate</TableCell><TableCell><Sel aria-label="Resistance for Rifampicin resistance" defaultValue="Rifampicin"><option value="">None</option><option>Rifampicin</option><option>Fluoroquinolones (class)</option></Sel></TableCell>
          <TableCell>{[['Detected', 'R'], ['Not detected', 'S'], ['Indeterminate', 'No interpretation']].map(([v, r]) => <div key={v} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}><span style={{ width: 110 }}>{v}</span><Sel aria-label={'Interpretation for ' + v} defaultValue={r} style={{ width: 170 }}><option>R</option><option>S</option><option>No interpretation</option></Sel></div>)}</TableCell></TableRow></TableBody></Table>
    <p className="muted anno">Any coded component can carry a resistance mapping to an antibiotic or an antibiotic class. Mapped results show in the case's Molecular resistance table beside DST or AST and feed the resistance classification; the method comes from the test, so nothing names a vendor (D-285).</p>
  </div></div>
  <div className="sec" style={{ marginBottom: '1.5rem' }}><div className="sec-b">
    <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Programs (existing admin) <span className="new">v2 columns</span></div>
    <Table size="sm"><TableHead><TableRow><TableHeader>Program</TableHeader><TableHeader>{t('admin.program.showOnMicroCase', 'Show on Microbiology case')}</TableHeader><TableHeader>{t('admin.program.reportingTrack', 'Reporting track')}</TableHeader><TableHeader>Questionnaire</TableHeader></TableRow></TableHead>
      <TableBody>{progs.map((r, i) => <TableRow key={r[0]}><TableCell>{r[0]}</TableCell><TableCell><Inp type="checkbox" checked={r[1]} aria-label={`Show ${r[0]} on Microbiology case`} onChange={e => setProgs(progs.map((x, k) => k === i ? [x[0], e.target.checked, e.target.checked ? (x[2] || 'Bacterial') : ''] : x))} style={{ width: 'auto' }} /></TableCell>
        <TableCell>{r[1] ? <Sel aria-label={`Reporting track for ${r[0]}`} value={r[2]} onChange={e => setProgs(progs.map((x, k) => k === i ? [x[0], x[1], e.target.value] : x))}><option>Bacterial</option><option>TB</option><option>Mycology</option></Sel> : <span className="muted">n/a</span>}</TableCell>
        <TableCell className="muted">{r[0] === 'TB Program' ? 'TB history, treatment month' : r[0] === 'AMR surveillance' ? 'Admission date, prior antibiotics' : 'none'}</TableCell></TableRow>)}</TableBody></Table>
    <p className="muted anno">Reporting track values come from the Dictionary category Reporting track (D-207). The programs ticked here are the Program choices in a case's Case information. The questionnaire shows in Case information; the reporting track decides the exports (WHONET and GLASS-AMR: Bacterial; NTP and GLASS-TB: TB).</p>
  </div></div>
  </div>;
}

function MediaLinksAdmin() {
  const [links, setLinks] = useState([
    ['Gram stain kit', 'Reagent', 'Any', '', '', '', 'from the item', ''],
    ['CLED agar plate', 'Medium', 'Urine', '1', '24 Hours', '24 Hours', 'Aerobic (ambient air), 35 °C', '1 µL'],
    ['Blood agar (sheep) plate', 'Medium', 'Urine', '2', '24 Hours', '24 Hours', 'CO₂-enriched (5 to 10%), 35 °C', '1 µL'],
    ['Blood agar (sheep) plate', 'Medium', 'Sputum', '1', '48 Hours', '24 Hours', 'CO₂-enriched (5 to 10%), 35 °C', ''],
    ['Chocolate agar plate', 'Medium', 'Sputum', '2', '48 Hours', '24 Hours', 'CO₂-enriched (5 to 10%), 35 °C', ''],
    ['MacConkey agar plate', 'Medium', 'Sputum', '3', '48 Hours', '24 Hours', 'Aerobic (ambient air), 35 °C', ''],
    ['XLD agar', 'Medium', 'Stool', '1', '24 Hours', '', 'Aerobic (ambient air), 35 °C', ''],
    ['Selenite F broth', 'Medium', 'Stool', '2', '18 Hours', '', 'Aerobic (ambient air), 35 °C', ''],
  ]);
  const [reqTracked, setReqTracked] = useState(false);
  const [blockSelf, setBlockSelf] = useState(false);
  return <div>
    <Breadcrumb noTrailingSlash style={{ marginBottom: '.5rem' }}><BreadcrumbItem href="#">Home</BreadcrumbItem><BreadcrumbItem href="#">Admin Management</BreadcrumbItem><BreadcrumbItem isCurrentPage>Test catalog and settings</BreadcrumbItem></Breadcrumb>
    <CatalogFieldDemo />
    <div className="sec" style={{ marginBottom: '1.5rem' }}><div className="sec-b">
      <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Dictionary categories used by Microbiology <span className="muted anno" style={{ fontWeight: 400 }}>(existing Admin › Dictionary: add, edit, deactivate; no micro-only lists, D-187)</span> <span className="new">v2 seed data</span></div>
      <Table size="sm"><TableHead><TableRow><TableHeader>Category</TableHeader><TableHeader>Seeded entries</TableHeader><TableHeader>Used in</TableHeader></TableRow></TableHead>
        <TableBody>{[['Culture atmosphere', 'Aerobic (ambient air); CO₂-enriched (5 to 10%); Candle jar; Anaerobic; Microaerophilic', 'Culture and subculture rows'], ['Culture reading', 'NG No growth; NF Normal flora; MG Mixed growth; SG Significant growth', 'Record reading, bench sheet codes'], ['Culture quantity', '<10³ CFU/mL; 10³ to 10⁴; 10⁴ to 10⁵; ≥10⁵ CFU/mL; scanty; +; ++; +++', 'Record reading'], ['Subculture purpose', 'Enrichment; Blind or terminal subculture; Purity; Other', 'Subculture from a row with no growth'], ['Extend incubation reason', 'Colonies too small to identify or pick; Slow-growing organism suspected; Fastidious organism suspected; Clinician request; Other', 'Extend incubation'], ['Microscopy grade', 'None; Rare; Few; Moderate; Many', 'Gram stain and other graded components'], ['Reporting track', 'Bacterial; TB; Mycology', 'Programs admin, surveillance exports (D-207)']].map(r => <TableRow key={r[0]}><TableCell>{r[0]}</TableCell><TableCell className="muted">{r[1]}</TableCell><TableCell>{r[2]}</TableCell></TableRow>)}</TableBody></Table>
      <div style={{ fontWeight: 600, margin: '1rem 0 .5rem' }}>Reflex rule (existing Admin › Reflex Tests, D-189) <span className="new">v2 seed</span></div>
      <Table size="sm"><TableHead><TableRow><TableHeader>When</TableHeader><TableHeader>Then add</TableHeader><TableHeader>On</TableHeader><TableHeader>Status</TableHeader></TableRow></TableHead>
        <TableBody><TableRow><TableCell>Blood culture result = Positive</TableCell><TableCell>Gram stain, culture (In lab only off)</TableCell><TableCell>the bottle that turned positive</TableCell><TableCell><Tag kind="green">Active</Tag></TableCell></TableRow></TableBody></Table>
      <p className="muted anno">The culture result is a result of the culture test (FR-05.5a), so the reflex engine and critical rules read it like any other result.</p>
    </div></div>
    <h1>Test catalog: Bacterial culture · {t('catalog.test.reagentsAndMedia', 'Reagents and media')} <span className="new">v2</span></h1>
    <p className="muted anno" style={{ marginBottom: '.75rem' }}><span className="new3">v3</span> These links are what make Bacterial culture a culture test: inoculating one of these media on a case adds Bacterial culture to the order if it is not there (D-Q5). The built Reagents section of the test (test_reagent_link) also takes Microbiology medium items (D-208). Start inoculation and Inoculate on the Worklist propose this culture test's media for the case's sample type; nothing on a case depends on them. Media links have no quantity and never change stock (D-169, D-197). There is no Plating templates admin.</p>
    <div className="row-actions" style={{ marginBottom: '.5rem' }}><Btn onClick={() => setLinks([...links, ['Chocolate agar plate', 'Medium', 'Any', String(links.length), '48 Hours', '', 'CO₂-enriched (5 to 10%), 35 °C', '']])}>+ Add reagent or medium</Btn></div>
    <div className="sec"><Table size="sm"><TableHead><TableRow><TableHeader>Item</TableHeader><TableHeader>Type</TableHeader><TableHeader>{t('catalog.test.mediaLink.sampleType', 'Sample type')}</TableHeader><TableHeader>{t('catalog.test.mediaLink.order', 'Order')}</TableHeader><TableHeader>{t('catalog.test.mediaLink.duration', 'Duration')}</TableHeader><TableHeader>{t('catalog.test.mediaLink.checkEvery', 'Check every')}</TableHeader><TableHeader>Atmosphere, temperature</TableHeader><TableHeader>{t('catalog.test.mediaLink.loopVolume', 'Loop volume')}</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
      <TableBody>{links.map((r, i) => <TableRow key={r[0] + r[2] + i}><TableCell>{r[0]}</TableCell><TableCell><Tag kind={r[1] === 'Medium' ? 'teal' : 'gray'}>{r[1]}</Tag></TableCell><TableCell>{r[2] === 'Any' ? <span className="muted">{t('catalog.test.mediaLink.anySampleType', 'Any sample type')}</span> : r[2]}</TableCell><TableCell>{r[3]}</TableCell><TableCell>{r[4]}</TableCell><TableCell>{r[5]}</TableCell><TableCell className="muted">{r[6]}</TableCell><TableCell>{r[7]}</TableCell><TableCell><Btn kind="ghost">Edit</Btn><Btn kind="ghost" onClick={() => setLinks(links.filter((x, k) => k !== i))}>Remove</Btn></TableCell></TableRow>)}</TableBody></Table></div>
    <div className="sec" style={{ marginTop: '1.5rem' }}><div className="sec-b">
      <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Settings <span className="new">v2</span></div>
      <div className="grid">
        <Field label={t('microbiology.labUnit.requireTrackedMedia', 'Require tracked media') + ' (lab unit: Microbiology)'}><label style={{ color: '#161616', fontSize: 14 }}><Inp type="checkbox" checked={reqTracked} onChange={e => setReqTracked(e.target.checked)} style={{ width: 'auto', marginRight: 6 }} aria-label="Require tracked media" />{reqTracked ? 'Required: only tracked media with a usable lot; Add new hidden' : 'Not required'}</label><div className="helper">D-196. Rows saved before keep their media.</div></Field>
        <Field label={t('siteInfo.blockSelfValidation', 'Block self-validation') + ' (site)'}><label style={{ color: '#161616', fontSize: 14 }}><Inp type="checkbox" checked={blockSelf} onChange={e => setBlockSelf(e.target.checked)} style={{ width: 'auto', marginRight: 6 }} aria-label="Block self-validation" />{blockSelf ? 'Blocked: the person who entered a result cannot validate it' : 'Not blocked'}</label><div className="helper">D-191. Applies on the Validation page and on case validation.</div></Field>
      </div>
    </div></div>
  </div>;
}

/* ---------- v3 ADMIN: AST panels targeting (R-01) ---------- */
const PANELS_SEED = [
  { name: 'Urine stamp', level: 'Enterobacterales (order)', types: ['Urine'], def: true, agents: [['Ampicillin', '10 µg'], ['Amoxicillin-clavulanate', '20/10 µg'], ['Ceftriaxone', '30 µg'], ['Gentamicin', '10 µg'], ['Norfloxacin', '10 µg'], ['Nitrofurantoin', '100 µg'], ['Trimethoprim-sulfamethoxazole', '1.25/23.75 µg']] },
  { name: 'Gram neg stamp', level: 'Enterobacterales (order)', types: [], def: true, agents: [['Ampicillin', '10 µg'], ['Amoxicillin-clavulanate', '20/10 µg'], ['Ceftriaxone', '30 µg'], ['Gentamicin', '10 µg'], ['Ciprofloxacin', '5 µg'], ['Trimethoprim-sulfamethoxazole', '1.25/23.75 µg'], ['Chloramphenicol', '30 µg']] },
  { name: 'MDR extras', level: 'Enterobacterales (order)', types: [], def: false, agents: [['Meropenem', '10 µg'], ['Ceftazidime', '10 µg'], ['Piperacillin', '30 µg'], ['Amikacin', '30 µg']] },
  { name: 'GNR disc set', level: 'Pseudomonas (genus)', types: [], def: true, agents: [['Gentamicin', '10 µg'], ['Ciprofloxacin', '5 µg']] },
  { name: 'MRGN disc set', level: 'Pseudomonas (genus)', types: [], def: true, agents: [['Tobramycin', '10 µg'], ['Meropenem', '10 µg'], ['Ceftazidime', '10 µg'], ['Piperacillin-tazobactam', '30/6 µg'], ['Amikacin', '30 µg']] },
  { name: 'Enterococcus urine', level: 'Enterococcus (genus)', types: ['Urine'], def: true, agents: [['Ampicillin', '2 µg'], ['Nitrofurantoin', '100 µg'], ['Vancomycin', '5 µg']] },
  { name: 'Enterococcus blood', level: 'Enterococcus (genus)', types: ['Blood culture bottle'], def: true, agents: [['Benzylpenicillin', '1 unit'], ['Ampicillin', '2 µg'], ['Vancomycin', '5 µg']] },
  { name: 'VITEK 2 AST-N405 (Enterobacterales)', level: 'Enterobacterales (order)', types: ['Blood culture bottle'], def: true, agents: [['12 antibiotics (MIC card)', 'n/a']] },
];
function AstPanelsAdmin() {
  const [panels, setPanels] = useState(PANELS_SEED);
  const [open, setOpen] = useState(null);
  return <div>
    <Breadcrumb noTrailingSlash style={{ marginBottom: '.5rem' }}><BreadcrumbItem href="#">Home</BreadcrumbItem><BreadcrumbItem href="#">Admin</BreadcrumbItem><BreadcrumbItem href="#">{t('microbiology.admin.title', 'Microbiology reference data')}</BreadcrumbItem><BreadcrumbItem isCurrentPage>AST Panels</BreadcrumbItem></Breadcrumb>
    <h1>AST Panels <span className="new3">v3 targeting</span></h1>
    <p className="subtitle">The existing AST Panels page. v3 adds targeting: when an isolate is identified, every panel with "Add automatically" at the best-matching organism level and sample type is added (R-01). Tier and Report default are gone from the panel; reporting is in Reporting Rules.</p>
    <div className="sec"><Table size="sm"><TableHead><TableRow><TableHeader>Panel</TableHeader><TableHeader>{t('admin.micro.panel.targetOrganism', 'Organism or group')}</TableHeader><TableHeader>{t('admin.micro.panel.targetSampleTypes', 'Sample types')}</TableHeader><TableHeader>{t('admin.micro.panel.default', 'Add automatically when identified')}</TableHeader><TableHeader>Antibiotics</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
      <TableBody>{panels.map((pn, i) => <React.Fragment key={pn.name}><TableRow>
        <TableCell>{pn.name}</TableCell><TableCell>{pn.level}</TableCell><TableCell>{pn.types.length ? pn.types.map(x => <Tag key={x} kind="gray">{x}</Tag>) : <span className="muted">Any sample type</span>}</TableCell>
        <TableCell>{pn.def ? <Tag kind="teal">Yes</Tag> : <span className="muted">No (added from a suggestion or the chooser)</span>}</TableCell><TableCell>{pn.agents.length}</TableCell>
        <TableCell><Btn kind="ghost" onClick={() => setOpen(open === i ? null : i)}>{open === i ? 'Close' : 'Edit'}</Btn></TableCell></TableRow>
        {open === i && <TableRow><TableCell colSpan={6} style={{ padding: 0 }}><div className="inline-panel" style={{ marginTop: 0 }}>
          <div className="grid">
            <Field label={t('admin.micro.panel.targetOrganism', 'Organism or group')} req><Inp list="taxa" defaultValue={pn.level} /><datalist id="taxa"><option value="Enterobacterales (order)" /><option value="Klebsiella pneumoniae complex (species group)" /><option value="Pseudomonas (genus)" /><option value="Pseudomonas aeruginosa (species)" /><option value="Enterococcus (genus)" /><option value="Gram-negative (Gram stain)" /></datalist><div className="helper">Any taxon from the organism list: species, species group, genus, family, order or Gram stain</div></Field>
            <Field label={t('admin.micro.panel.targetSampleTypes', 'Sample types')}><div>{pn.types.map(x => <Tag key={x} kind="blue">{x} ✕</Tag>)}</div><Inp placeholder="Search sample types" /><div className="helper">Empty means any sample type. A listed sample type beats any.</div></Field>
            <Field label={t('admin.micro.panel.default', 'Add automatically when identified')}><label style={{ color: '#161616', fontSize: 14 }}><Inp type="checkbox" checked={pn.def} onChange={e => setPanels(panels.map((x, k) => k === i ? { ...x, def: e.target.checked } : x))} style={{ width: 'auto', marginRight: 6 }} />{pn.def ? 'Yes' : 'No'}</label></Field>
          </div>
          <Table size="sm" style={{ marginTop: '.75rem', background: '#fff' }}><TableHead><TableRow><TableHeader>Antibiotic</TableHeader><TableHeader>{t('admin.micro.panel.defaultDiskContent', 'Default disk content')}</TableHeader></TableRow></TableHead>
            <TableBody>{pn.agents.map(a => <TableRow key={a[0]}><TableCell>{a[0]}</TableCell><TableCell>{a[1]}</TableCell></TableRow>)}</TableBody></Table>
          <div className="helper">The disk content normally comes from the disk lot picked at AST setup; the default here is used when disks are not tracked in Inventory (R-15).</div>
          <div className="row-actions"><Btn onClick={() => setOpen(null)}>Save (new panel version)</Btn><Btn kind="ghost" onClick={() => setOpen(null)}>Cancel</Btn></div></div></TableCell></TableRow>}
      </React.Fragment>)}</TableBody></Table></div>
    <div className="note-box anno">Example: <b>Urine stamp</b> (Enterobacterales, Urine) and <b>Gram neg stamp</b> (Enterobacterales, any): <i>E. coli</i> from urine gets Urine stamp only; from blood, Gram neg stamp only. <b>GNR</b> and <b>MRGN disc sets</b> share the same best match, so a <i>Pseudomonas</i> isolate gets both. Matching uses one taxonomy matcher shared with breakpoints and reporting rules (R-12).</div>
  </div>;
}

/* ---------- v3 ADMIN: Reporting rules, one table per lab (R-02, R-03, R-10) ---------- */
const RULES_SEED = [
  { org: 'Enterobacterales (order)', types: '', ind: '', ab: 'Ampicillin', def: 'Report' },
  { org: 'Enterobacterales (order)', types: '', ind: '', ab: 'Meropenem', def: 'Cascade', cond: [['Ceftriaxone', 'is R'], ['OR', 'Gentamicin', 'is R']], auto: false },
  { org: 'Enterobacterales (order)', types: '', ind: '', ab: 'Ceftazidime', def: 'Cascade', cond: [['Ceftriaxone', 'is R'], ['OR', 'Gentamicin', 'is R']], auto: false },
  { org: 'Enterobacterales (order)', types: '', ind: '', ab: 'Amikacin', def: 'Cascade', cond: [['Ceftriaxone', 'is R'], ['OR', 'Gentamicin', 'is R']], auto: false },
  { org: 'Enterobacterales (order)', types: 'Urine', ind: '', ab: 'Ciprofloxacin', def: 'Cascade', cond: [['Norfloxacin', 'is R']], auto: false },
  { org: 'Enterobacterales (order)', types: 'Urine', ind: '', ab: 'Nitrofurantoin', def: 'Report' },
  { org: 'Enterobacterales (order)', types: '', ind: '', ab: 'Nitrofurantoin', def: "Don't report", note: '' },
  { org: 'Escherichia coli (species)', types: 'Blood, CSF', ind: '', ab: 'Ceftriaxone', def: 'Report', note: 'Meropenem 25 mg/kg up to 1 g 8-hourly IV should be considered for this resistant isolate. Double the dose in meningitis.', when: 'When R' },
  { org: 'Klebsiella pneumoniae (species)', types: 'Blood', ind: '', ab: 'Ceftriaxone', def: 'Report', note: 'Meropenem 25 mg/kg up to 1 g 8-hourly IV should be considered for this resistant isolate.', when: 'When R' },
  { org: 'Salmonella (genus)', types: '', ind: '', ab: 'Ceftriaxone', def: "Don't report" },
  { org: 'Salmonella (genus)', types: 'Blood', ind: '', ab: 'Ceftriaxone', def: 'Report' },
  { org: 'Streptococcus pneumoniae (species)', types: '', ind: 'Non-meningitis', ab: 'Benzylpenicillin', def: 'Report' },
  { org: 'Streptococcus pneumoniae (species)', types: '', ind: 'Meningitis', ab: 'Benzylpenicillin', def: "Don't report" },
  { org: 'Streptococcus pneumoniae (species)', types: 'CSF', ind: 'Meningitis', ab: 'Benzylpenicillin', def: 'Report' },
  { org: 'Enterococcus (genus)', types: 'Urine', ind: '', ab: 'Nitrofurantoin', def: 'Cascade', cond: [['Ampicillin', 'is S']], auto: false },
  { org: 'Enterococcus (genus)', types: '', ind: '', ab: 'Vancomycin', def: 'Cascade', cond: [['Ampicillin', 'is R']], auto: false },
  { org: 'Pseudomonas (genus)', types: '', ind: '', ab: 'Meropenem', def: 'Cascade', cond: [['Ceftazidime', 'is R'], ['AND', 'Piperacillin-tazobactam', 'is R']], auto: false },
  { org: 'Pseudomonas (genus)', types: '', ind: '', ab: 'Amikacin', def: 'Cascade', cond: [['All other tested agents', 'are R']], auto: false },
  { org: 'Salmonella, non-typhoidal (group)', types: 'Faeces', ind: '', ab: '(isolate)', def: '', note: 'Antibiotic therapy is NOT usually indicated for enteric infection due to this organism.', when: 'Always' },
];
const condText = c => (c || []).map(x => x.length === 3 ? `${x[0]} ${x[1]} ${x[2]}` : `${x[0]} ${x[1]}`).join(' ');
function ReportingRulesAdmin() {
  const [rules, setRules] = useState(RULES_SEED);
  const [open, setOpen] = useState(null);
  const [hist, setHist] = useState(false);
  const [fOrg, setFOrg] = useState('All');
  const [unmatched, setUnmatched] = useState('Report');
  const [pv, setPv] = useState({ org: 'Klebsiella pneumoniae', st: 'Blood culture bottle', cro: 'R', gen: 'R' });
  const shown = rules.filter(r => fOrg === 'All' || r.org === fOrg);
  const groups = [...new Set(shown.map(r => r.org))];
  const casc = pv.cro === 'R' || pv.gen === 'R';
  return <div>
    <Breadcrumb noTrailingSlash style={{ marginBottom: '.5rem' }}><BreadcrumbItem href="#">Home</BreadcrumbItem><BreadcrumbItem href="#">Admin</BreadcrumbItem><BreadcrumbItem href="#">{t('microbiology.admin.title', 'Microbiology reference data')}</BreadcrumbItem><BreadcrumbItem isCurrentPage>{t('microbiology.admin.astRules.title', 'AST rules')}</BreadcrumbItem></Breadcrumb>
    <h1>{t('microbiology.admin.astRules.title', 'AST rules')} <span className="new3">v3 D-287</span></h1>
    <p className="subtitle">{t('microbiology.admin.astRules.subtitle', 'Everything the lab decides about an AST result, on one page, laid out like its AST reporting SOP. Reporting rules decide whether an antibiotic starts ticked on the report, and a Cascade rule also suggests testing it when its condition is met. Interpretation rules change what the result is: always R, or an agent inferred from another. Every result is still saved and exported, whatever the tick.')}</p>
    <div className="sec"><div className="sec-b"><div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <Field label={t('admin.micro.reportingRules.standard', 'Written for')}><Sel defaultValue="CLSI"><option>CLSI</option><option>EUCAST</option><option>Local</option></Sel><div className="helper">The lab interprets with CLSI M100 36th ed. (2026), so no warning</div></Field>
      <Field label={t('admin.micro.reportingRules.unmatchedDefault', 'Agents with no matching rule')}><Sel value={unmatched} onChange={e => setUnmatched(e.target.value)}><option>Report</option><option>Don't report</option></Sel></Field>
      <Field label="Organism"><Sel aria-label="Organism filter" value={fOrg} onChange={e => setFOrg(e.target.value)}><option>All</option>{[...new Set(rules.map(r => r.org))].map(o => <option key={o}>{o}</option>)}</Sel></Field>
      <div style={{ alignSelf: 'end', display: 'flex', gap: 6, flexWrap: 'wrap' }}><Btn kind="tertiary">Import</Btn><Btn kind="tertiary">Export</Btn><Btn kind="ghost" onClick={() => setHist(!hist)}>{t('admin.micro.reportingRules.history', 'History')}</Btn></div>
    </div>
    <p className="muted anno" style={{ margin: '.5rem 0 0' }}>Import and Export open the shared Import Review (Preview, Apply, Undo). The CLSI and EUCAST starters arrive the same way, as a preview against this table; nothing changes until you apply (R-08, R-09). No profiles, versions or Activate step (D-271).</p></div></div>
    {hist && <div className="sec"><div className="sec-b"><b>History</b> <span className="muted">every edit is audited; imports show their run</span>
      <Table size="sm" style={{ marginTop: 6 }}><TableHead><TableRow><TableHeader>When</TableHeader><TableHeader>Who</TableHeader><TableHeader>Change</TableHeader></TableRow></TableHead><TableBody>
        <TableRow><TableCell>14/10/2026 11:02</TableCell><TableCell>K. Lavu</TableCell><TableCell>Pseudomonas · Amikacin: Report → Cascade (all other tested agents are R)</TableCell></TableRow>
        <TableRow><TableCell>14/10/2026 10:40</TableCell><TableCell>K. Lavu</TableCell><TableCell>Import run IR-0031 applied: CLSI starter, 212 rules added, 0 changed (Undo available until 21/10/2026)</TableCell></TableRow>
        <TableRow><TableCell>02/10/2026 09:15</TableCell><TableCell>R. Opa</TableCell><TableCell>Escherichia coli · Blood, CSF · Ceftriaxone: note added (When R)</TableCell></TableRow></TableBody></Table></div></div>}
    <h2 style={{ fontSize: 18, fontWeight: 400, margin: '1.5rem 0 .25rem' }}>{t('microbiology.admin.astRules.reporting', 'Reporting rules')}</h2>
    <p className="muted" style={{ marginBottom: '.5rem' }}>{t('microbiology.admin.astRules.reportingHelp', 'Whether an antibiotic starts ticked on the report, and what to suggest testing next')}</p>
    <div className="sec"><Table size="sm"><TableHead><TableRow><TableHeader>Antibiotic</TableHeader><TableHeader>{t('admin.micro.reportingRules.col.sampleTypes', 'Sample types')}</TableHeader><TableHeader>{t('admin.micro.reportingRules.col.indication', 'Indication')}</TableHeader><TableHeader>{t('admin.micro.reportingRules.col.reportDefault', 'Report default')}</TableHeader><TableHeader>{t('admin.micro.reportingRules.col.condition', 'Condition')}</TableHeader><TableHeader>{t('admin.micro.reportingRules.col.autoAdd', 'Add automatically')}</TableHeader><TableHeader>{t('admin.micro.reportingRules.col.note', 'Note')}</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
      <TableBody>{groups.map(g => <React.Fragment key={g}><TableRow><TableCell colSpan={8} style={{ background: '#e0e0e0', fontWeight: 600 }}>{g}</TableCell></TableRow>
        {shown.map((r, i0) => { const i = rules.indexOf(r); if (r.org !== g) return null; return <React.Fragment key={i}><TableRow>
          <TableCell>{r.ab}</TableCell><TableCell>{r.types || <span className="muted">Any</span>}</TableCell><TableCell>{r.ind || <span className="muted">Any</span>}</TableCell>
          <TableCell>{r.def ? <Tag kind={r.def === 'Report' ? 'green' : r.def === 'Cascade' ? 'teal' : r.def === "Don't report" ? 'gray' : 'warm-gray'}>{r.def}</Tag> : <span className="muted">n/a</span>}</TableCell>
          <TableCell>{r.cond ? condText(r.cond) : <span className="muted">none</span>}</TableCell><TableCell>{r.def === 'Cascade' ? (r.auto ? 'Yes' : 'No') : ''}</TableCell><TableCell className="muted" style={{ maxWidth: 220 }}>{r.note ? `${r.when}: ${r.note}` : ''}</TableCell>
          <TableCell><Btn kind="ghost" onClick={() => setOpen(open === i ? null : i)}>{open === i ? 'Close' : 'Edit'}</Btn></TableCell></TableRow>
          {open === i && <TableRow><TableCell colSpan={8} style={{ padding: 0 }}><div className="inline-panel" style={{ marginTop: 0 }}>
            <div className="grid">
              <Field label="Antibiotic" req><Inp list="abs" defaultValue={r.ab} /><datalist id="abs"><option value="Ampicillin" /><option value="Meropenem" /><option value="Nitrofurantoin" /><option value="(isolate)" /></datalist><div className="helper">Search by name, code or other names</div></Field>
              <Field label="Report default" req><Sel value={r.def} onChange={e => setRules(rules.map((x, k) => k === i ? { ...x, def: e.target.value, cond: e.target.value === 'Cascade' ? (x.cond || [['Ceftriaxone', 'is R']]) : undefined } : x))}><option>Report</option><option>Don't report</option><option>Report only if R</option><option>Cascade</option></Sel></Field>
              <Field label={t('admin.micro.reportingRules.col.indication', 'Indication')}><Sel defaultValue={r.ind}><option value="">Any</option><option>Meningitis</option><option>Non-meningitis</option><option>Uncomplicated urinary tract infection</option><option>Oral</option><option>Intravenous</option></Sel><div className="helper">For agents the guideline interprets twice</div></Field>
            </div>
            {r.def === 'Cascade' && <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '.75rem', marginTop: '.75rem' }}><b style={{ fontSize: 13 }}>Condition</b> <span className="muted anno">the Test Rules condition editor (blocked by the Test Rules MVP, D-259)</span>
              {r.cond.map((c, k) => <div key={k} className="cond">{k > 0 && <Sel defaultValue={c[0]} aria-label="And or" style={{ width: 80 }}><option>AND</option><option>OR</option></Sel>}<Sel defaultValue={c.length === 3 ? c[1] : c[0]} aria-label="Agent"><option>Ceftriaxone</option><option>Gentamicin</option><option>Norfloxacin</option><option>Ampicillin</option><option>Ceftazidime</option><option>Piperacillin-tazobactam</option><option>All other tested agents</option></Sel><Sel defaultValue={c.length === 3 ? c[2] : c[1]} aria-label="Predicate"><option>is R</option><option>is S</option><option>is I</option><option>is SDD</option><option>are R</option></Sel></div>)}
              <Btn kind="ghost">+ Add condition</Btn>
              <label style={{ display: 'block', fontSize: 14, marginTop: 6 }}><Inp type="checkbox" defaultChecked={r.auto} style={{ width: 'auto', marginRight: 6 }} />{t('admin.micro.reportingRules.col.autoAdd', 'Add automatically')} <span className="muted">(off: suggested on the isolate, one click to add)</span></label></div>}
            <div className="grid" style={{ marginTop: '.75rem' }}><Field label={t('admin.micro.reportingRules.col.note', 'Note')}><Inp defaultValue={r.note} placeholder="Optional; printed with the result" /></Field><Field label="When"><Sel defaultValue={r.when || 'Always'}><option>Always</option><option>When R</option><option>When S</option></Sel></Field>
              <div className="notice info" style={{ fontSize: 12 }}>Breakpoint note (M-02, CLSI M100 36th ed.): {r.ab === 'Benzylpenicillin' ? 'Report penicillin with the meningitis and non-meningitis breakpoints for isolates other than CSF.' : 'none for this organism and agent'}</div></div>
            <div className="row-actions"><Btn onClick={() => setOpen(null)}>Save</Btn><Btn kind="ghost" onClick={() => setOpen(null)}>Cancel</Btn><Btn kind="ghost">Deactivate</Btn></div></div></TableCell></TableRow>}
        </React.Fragment>; })}</React.Fragment>)}</TableBody></Table>
      <div className="row-actions" style={{ padding: '0 1rem 1rem' }}><Btn kind="tertiary">+ Add rule</Btn></div></div>
    <ExpertRulesAdmin embedded fOrg={fOrg} />
    <div className="sec"><div className="sec-b"><b>{t('admin.micro.reportingRules.preview', 'Preview')}</b> <span className="muted">try an isolate against the rules, expert rules and panels</span>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 6 }}>
        <Field label="Organism"><Sel value={pv.org} onChange={e => setPv({ ...pv, org: e.target.value })}><option>Klebsiella pneumoniae</option><option>Escherichia coli</option></Sel></Field>
        <Field label="Sample type"><Sel value={pv.st} onChange={e => setPv({ ...pv, st: e.target.value })}><option>Blood culture bottle</option><option>Urine</option></Sel></Field>
        <Field label="Ceftriaxone"><Sel value={pv.cro} onChange={e => setPv({ ...pv, cro: e.target.value })}><option>S</option><option>I</option><option>R</option></Sel></Field>
        <Field label="Gentamicin"><Sel value={pv.gen} onChange={e => setPv({ ...pv, gen: e.target.value })}><option>S</option><option>R</option></Sel></Field></div>
      <Table size="sm" style={{ marginTop: 6 }}><TableHead><TableRow><TableHeader>Step</TableHeader><TableHeader>Result</TableHeader><TableHeader>Why</TableHeader></TableRow></TableHead><TableBody>
        <TableRow><TableCell>Default panels</TableCell><TableCell>{pv.st === 'Urine' ? 'Urine stamp' : 'VITEK 2 AST-N405 (Enterobacterales)'}</TableCell><TableCell className="muted">Best match: Enterobacterales, {pv.st === 'Urine' ? 'Urine' : 'Blood culture bottle'}</TableCell></TableRow>
        {pv.org === 'Klebsiella pneumoniae' && <TableRow><TableCell>Expert rules</TableCell><TableCell>Ampicillin set to R</TableCell><TableCell className="muted">Klebsiella: ampicillin always R (EUCAST expected phenotypes)</TableCell></TableRow>}
        <TableRow><TableCell>Suggested</TableCell><TableCell>{casc ? 'MDR extras (meropenem, ceftazidime, piperacillin, amikacin)' : 'Nothing'}</TableCell><TableCell className="muted">{casc ? 'Cascade met: ceftriaxone is R OR gentamicin is R, and MDR extras holds every agent on that condition' : 'Cascade conditions not met'}</TableCell></TableRow>
        <TableRow><TableCell>Report</TableCell><TableCell>{pv.st === 'Urine' ? 'Ampicillin, nitrofurantoin, ceftriaxone, gentamicin, norfloxacin ticked' : 'Ampicillin, ceftriaxone, gentamicin ticked; nitrofurantoin not reported'}{casc ? '; MDR extras ticked once tested' : ''}</TableCell><TableCell className="muted">Rules above; other agents use the lab default ({unmatched})</TableCell></TableRow></TableBody></Table></div></div>
  </div>;
}

/* ---------- v3 ADMIN: Expert rules (M-06), seeded from the AMR package (R-06) ---------- */
const EXPERT_SEED = [
  ['Klebsiella (genus, except K. aerogenes)', '', 'Ampicillin, amoxicillin, ticarcillin R', 'EUCAST expected phenotypes v1.2', true],
  ['Enterobacter cloacae complex (species group)', '', 'Ampicillin, amoxicillin-clavulanate, cefazolin, cefoxitin R', 'EUCAST expected phenotypes v1.2', true],
  ['Citrobacter koseri (species)', '', 'Ampicillin, amoxicillin, ticarcillin R', 'EUCAST expected phenotypes v1.2', true],
  ['Staphylococcus (genus)', 'Cefoxitin is R', 'All beta-lactams R (flucloxacillin printed as R, inferred from cefoxitin)', 'EUCAST breakpoint tables v15', true],
  ['Campylobacter (genus)', 'Erythromycin is S', 'Clarithromycin, azithromycin S (inferred)', 'EUCAST expert rules v3.3', true],
  ['Salmonella (genus)', 'Pefloxacin is S or R', 'Ciprofloxacin the same (inferred from the pefloxacin screen)', 'Local (CPHL)', true],
  ['Serratia marcescens (species)', '', 'Amikacin R', 'Local (CPHL)', true],
];
function ExpertRulesAdmin({ embedded, fOrg = 'All' }) {
  const g = fOrg === 'All' ? '' : fOrg.split(' ')[0];
  const rules = EXPERT_SEED.filter(r => !g || r[0].startsWith(g) || (g === 'Enterobacterales' && /Klebsiella|Enterobacter|Citrobacter|Salmonella|Serratia/.test(r[0])));
  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 400, margin: '1.5rem 0 .25rem' }}>{t('microbiology.admin.astRules.interpretation', 'Interpretation rules')} <span className="new3">M-06</span></h2>
    <p className="muted">Rules that change an interpretation: always R (expected resistant phenotypes) and inferred agents ("report as"). They are applied as automatic overrides with the rule named; the measured value stays visible and a validator can revert it. Whether an agent prints is decided by the reporting rules above, not here (D-270).</p>
    <div className="row-actions" style={{ marginBottom: '.75rem' }}><Btn kind="tertiary">+ Add interpretation rule</Btn><span className="muted" style={{ alignSelf: 'center' }}>The starter comes from the AMR package's interpretive rules (EUCAST: 58 expected phenotypes, 57 expert rules, breakpoint-table rules). CLSI has no equivalent file.</span></div>
    <div className="sec"><Table size="sm"><TableHead><TableRow><TableHeader>Organism</TableHeader><TableHeader>When</TableHeader><TableHeader>Then</TableHeader><TableHeader>Source</TableHeader><TableHeader>Status</TableHeader><TableHeader></TableHeader></TableRow></TableHead>
      <TableBody>{rules.map(r => <TableRow key={r[0] + r[2]}><TableCell>{r[0]}</TableCell><TableCell>{r[1] || <span className="muted">always</span>}</TableCell><TableCell>{r[2]}</TableCell><TableCell>{r[3].startsWith('Local') ? <Tag kind="gray">{r[3]}</Tag> : <Tag kind="teal">{r[3]}</Tag>}</TableCell><TableCell><Tag kind="green">Active</Tag></TableCell><TableCell><Btn kind="ghost">Edit</Btn><Btn kind="ghost">Deactivate</Btn></TableCell></TableRow>)}</TableBody></Table></div>
    <div className="note-box anno">On a case: a reading changed by an expert rule shows the source "Expert rule" and the rule's name; an inferred agent (flucloxacillin from cefoxitin) gets its own row marked "Inferred from cefoxitin". A measured S on an always-R agent also raises the intrinsic verification flag, because it may mean a misidentification.</div>
  </div>;
}

/* ---------- v3 ADMIN: AMR reference data from the AMR for R package (R-12 to R-21) ---------- */
function ReferenceDataAdmin() {
  const [q, setQ] = useState('aerogenes');
  const [pinned, setPinned] = useState(false);
  const hits = [['Klebsiella aerogenes', 'species', 'Formerly Enterobacter aerogenes', 1], ['Enterobacter aerogenes', 'synonym', 'Resolves to Klebsiella aerogenes', 0], ['Aerococcus urinae', 'species', '', 1.5]].filter(h => !q || h[0].toLowerCase().includes(q.toLowerCase()) || h[2].toLowerCase().includes(q.toLowerCase()));
  return <div>
    <Breadcrumb noTrailingSlash style={{ marginBottom: '.5rem' }}><BreadcrumbItem href="#">Home</BreadcrumbItem><BreadcrumbItem href="#">Admin</BreadcrumbItem><BreadcrumbItem href="#">{t('microbiology.admin.title', 'Microbiology reference data')}</BreadcrumbItem><BreadcrumbItem isCurrentPage>Organisms, antibiotics and breakpoints</BreadcrumbItem></Breadcrumb>
    <h1>AMR reference data <span className="new3">v3</span></h1>
    <div className="sec"><div className="sec-b"><b>Seed pack</b>
      <Table size="sm" style={{ marginTop: 6 }}><TableHead><TableRow><TableHeader>Pack</TableHeader><TableHeader>Source</TableHeader><TableHeader>Contents</TableHeader><TableHeader>Test vectors</TableHeader><TableHeader>Licence</TableHeader></TableRow></TableHead>
        <TableBody><TableRow><TableCell>AMR reference data 2026.1</TableCell><TableCell>AMR for R v3.1.0.9004 (DIGI-UW fork = upstream 5fc152a)</TableCell><TableCell>103,222 organisms (69,915 accepted, 27,042 synonyms), 506 antimicrobials, EUCAST 2026 and CLSI 2026 breakpoints (human and ECOFF), expected phenotypes, dosage</TableCell><TableCell><Tag kind="green">0 differences</Tag> <span className="muted">from as.sir()</span></TableCell><TableCell><Tag kind="warm-gray">Clearance pending</Tag> <span className="muted anno">GPL-2.0 vs MPL-2.0; ships as a separate pack (R-21)</span></TableCell></TableRow></TableBody></Table>
      <p className="muted">Loaded through the shared Import Review. Veterinary breakpoint rows are not loaded. A pack whose interpretations differ from the package's test vectors is refused.</p></div></div>
    <div className="sec"><div className="sec-b"><b>Organisms</b> <span className="muted">the whole list is seeded; search ranks common pathogens first; synonyms resolve to the current name</span>
      <div className="field" style={{ maxWidth: 360, margin: '.5rem 0' }}><Inp aria-label="Search organisms" value={q} onChange={e => setQ(e.target.value)} placeholder="Search organisms, synonyms or codes" /></div>
      <Table size="sm"><TableHead><TableRow><TableHeader>Name</TableHeader><TableHeader>Rank</TableHeader><TableHeader>Note</TableHeader><TableHeader>Commonness</TableHeader></TableRow></TableHead>
        <TableBody>{hits.map(h => <TableRow key={h[0]}><TableCell><i>{h[0]}</i></TableCell><TableCell>{h[1]}</TableCell><TableCell className="muted">{h[2]}</TableCell><TableCell>{h[3] === 1 ? 'Common human pathogen' : h[3] ? 'Less common' : ''}</TableCell></TableRow>)}</TableBody></Table>
      <div style={{ marginTop: '.75rem', background: '#fff', border: '1px solid #e0e0e0', padding: '.75rem' }}>
        <b><i>Klebsiella aerogenes</i></b> <Tag kind="gray">{t('admin.micro.organism.formerly', 'Formerly {oldName}').replace('{oldName}', 'Enterobacter aerogenes')}</Tag>
        <div className="kv" style={{ marginTop: 6 }}>
          <div><div className="k">{t('admin.micro.organism.taxonomy', 'Taxonomy')}</div>Bacteria › Pseudomonadota › Gammaproteobacteria › Enterobacterales › Enterobacteriaceae › Klebsiella</div>
          <div><div className="k">Gram stain</div>Gram-negative</div>
          <div><div className="k">{t('admin.micro.organism.groups', 'Groups')}</div><Tag kind="blue">Enterobacterales ESCPPM (lab)</Tag></div>
          <div><div className="k">Codes</div>AMR B_KLBSL_AERG · WHONET kae · SNOMED 1005001</div>
          <div><div className="k">Isolates reported before the rename</div>keep "Enterobacter aerogenes"</div>
        </div>
        <div className="row-actions"><Btn kind="ghost" onClick={() => setPinned(!pinned)}>{pinned ? 'Unpin' : t('admin.micro.organism.pin', 'Pin to top')}</Btn><Btn kind="ghost">{t('admin.micro.organism.hide', 'Hide in pickers')}</Btn><span className="muted" style={{ alignSelf: 'center' }}>Initial significance and display name are local settings and survive pack updates.</span></div></div>
    </div></div>
    <div className="sec"><div className="sec-b"><b>Antibiotics</b> <span className="muted">all 506 seeded; pickers show the lab's panel agents first</span>
      <Table size="sm" style={{ marginTop: 6 }}><TableHead><TableRow><TableHeader>Name</TableHeader><TableHeader>Codes</TableHeader><TableHeader>{t('admin.micro.antibiotic.atc', 'ATC code')}</TableHeader><TableHeader>{t('admin.micro.antibiotic.synonyms', 'Other names')}</TableHeader><TableHeader>{t('admin.micro.antibiotic.loinc', 'LOINC codes')}</TableHeader><TableHeader>{t('admin.micro.antibiotic.aware', 'WHO AWaRe group')}</TableHeader></TableRow></TableHead>
        <TableBody><TableRow><TableCell>Ampicillin</TableCell><TableCell>AMR AMP · WHONET AMP</TableCell><TableCell>J01CA01</TableCell><TableCell className="muted">amp, ampicilina, pentrexyl</TableCell><TableCell className="muted">MIC 28-1; disk 7-1</TableCell><TableCell>Access</TableCell></TableRow>
          <TableRow><TableCell>Meropenem</TableCell><TableCell>AMR MEM · WHONET MEM</TableCell><TableCell>J01DH02</TableCell><TableCell className="muted">mero, merrem</TableCell><TableCell className="muted">MIC 6652-2; disk 6653-0</TableCell><TableCell>Watch</TableCell></TableRow>
          <TableRow><TableCell>Colistin</TableCell><TableCell>AMR COL · WHONET COL</TableCell><TableCell>J01XB01</TableCell><TableCell className="muted">polymyxin E</TableCell><TableCell className="muted">MIC 29493-7</TableCell><TableCell>Reserve</TableCell></TableRow></TableBody></Table>
      <p className="muted">Other names match analyzer results and imports without a manual mapping. AWaRe is optional, loaded from WHO's list.</p></div></div>
    <div className="sec"><div className="sec-b"><b>Breakpoints</b> <span className="muted anno">keyed by organism level, antibiotic, method, indication and disk content (R-14, R-15)</span>
      <Table size="sm" style={{ marginTop: 6 }}><TableHead><TableRow><TableHeader>Organism</TableHeader><TableHeader>Antibiotic</TableHeader><TableHeader>Method</TableHeader><TableHeader>{t('admin.micro.breakpoint.indication', 'Indication')}</TableHeader><TableHeader>{t('admin.micro.breakpoint.diskContent', 'Disk content')}</TableHeader><TableHeader>Type</TableHeader><TableHeader>S ≤ / ≥</TableHeader><TableHeader>R &gt; / &lt;</TableHeader></TableRow></TableHead>
        <TableBody>{[['Streptococcus pneumoniae', 'Benzylpenicillin', 'MIC', 'Meningitis', '', 'Clinical', '0.06', '0.06'], ['Streptococcus pneumoniae', 'Benzylpenicillin', 'MIC', 'Non-meningitis', '', 'Clinical', '2', '4'], ['Enterococcus (genus)', 'Ampicillin', 'Disk', 'Any', '2 µg', 'Clinical', '10', '8'], ['Enterobacterales (order)', 'Ampicillin', 'Disk', 'Any', '10 µg', 'Clinical', '17', '13'], ['Escherichia coli', 'Ciprofloxacin', 'MIC', 'Any', '', 'ECOFF (WT/NWT)', '0.06', ''], ['Enterobacterales (order)', 'Cefepime', 'MIC', 'Any', '', 'Clinical, SDD', '2', '16']].map((r, k) => <TableRow key={k}>{r.map((c, j) => <TableCell key={j}>{c || <span className="muted">n/a</span>}</TableCell>)}</TableRow>)}</TableBody></Table>
      <div style={{ marginTop: '.75rem' }}><b style={{ fontSize: 13 }}>{t('admin.micro.sampleType.defaultIndication', 'Default indication')} by sample type</b>
        <Table size="sm" style={{ marginTop: 4 }}><TableHead><TableRow><TableHeader>Sample type</TableHeader><TableHeader>Default indication</TableHeader></TableRow></TableHead><TableBody><TableRow><TableCell>Cerebrospinal fluid</TableCell><TableCell>Meningitis</TableCell></TableRow><TableRow><TableCell>Urine</TableCell><TableCell>Uncomplicated urinary tract infection</TableCell></TableRow><TableRow><TableCell>Blood culture bottle</TableCell><TableCell className="muted">None: both meningitis and non-meningitis lines show where the guideline has both; the technician unticks one on Report choices (D-272)</TableCell></TableRow></TableBody></Table></div>
      <p className="muted anno">Environmental isolates use ECOFFs (wild type, non-wild type) by default; on clinical isolates the ECOFF result is shown to staff, never printed (R-17).</p></div></div>
  </div>;
}

/* ---------- WORKPLAN (existing page): Microbiology bench type, D-188 ---------- */
function WorkplanView() {
  const [type, setType] = useState('Microbiology bench');
  const [chip, setChip] = useState('final');
  const [sheet, setSheet] = useState(null);
  if (sheet) return <BenchSheet sheet={sheet} onClose={() => setSheet(null)} />;
  const rows = chip === 'awaiting' ? AWAITING : DUE_ROWS.filter(r => r.kind === (chip === 'check' ? 'check' : 'final'));
  return <div>
    <Breadcrumb noTrailingSlash style={{ marginBottom: '.5rem' }}><BreadcrumbItem href="#">Home</BreadcrumbItem><BreadcrumbItem isCurrentPage>Workplan</BreadcrumbItem></Breadcrumb>
    <h1>Workplan</h1>
    <div className="note-box anno" style={{ marginBottom: '1rem' }}>Existing Workplan page and print (by test section, test, panel, priority): reuse, do not re-implement. v2 adds the <b>Microbiology bench</b> type, its filters and the bench layout (FR-12.7). The Worklist's Print workplan opens the same print.</div>
    <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      <Field label="Workplan type" req><Sel value={type} onChange={e => setType(e.target.value)} aria-label="Workplan type">{['Test section', 'Test', 'Panel', 'Priority', 'Microbiology bench'].map(x => <option key={x}>{x}</option>)}</Sel></Field>
      {type === 'Microbiology bench' && <Field label="Filter" req><Sel value={chip} onChange={e => setChip(e.target.value)} aria-label="Workplan filter"><option value="awaiting">Awaiting inoculation</option><option value="check">Check due</option><option value="final">Final read due</option></Sel></Field>}
      {type === 'Microbiology bench' && <Field label="Lab unit"><Sel><option>Microbiology</option><option>TB</option></Sel></Field>}
    </div>
    {type === 'Microbiology bench' ? <>
      <div className="sec" style={{ marginTop: '1rem' }}><Table size="sm"><TableHead><TableRow><TableHeader>Lab number</TableHeader><TableHeader>Patient or site</TableHeader><TableHeader>{chip === 'awaiting' ? 'Specimen' : 'Container · medium'}</TableHeader><TableHeader>{chip === 'awaiting' ? 'Received' : 'Due'}</TableHeader></TableRow></TableHead>
        <TableBody>{rows.map(r => <TableRow key={r.id || r.lab}><TableCell>{r.lab}</TableCell><TableCell>{r.who}</TableCell><TableCell>{chip === 'awaiting' ? r.spec : r.cid + ' · ' + r.med}</TableCell><TableCell>{chip === 'awaiting' ? r.rec : r.day}</TableCell></TableRow>)}</TableBody></Table></div>
      <div className="row-actions"><Btn onClick={() => setSheet({ no: 'BS-261002-09', chip, title: SHEET_TITLES[chip], lu: 'Microbiology', by: 'J. Kaupa', at: '02 Oct 2026 08:20', scope: 'all rows in the filter', rows })}>Print workplan</Btn></div>
    </> : <p className="muted" style={{ marginTop: '1rem' }}>The existing workplan for this type is unchanged.</p>}
  </div>;
}

/* ---------- ORDER ENTRY ---------- */
function OrderEntry() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [samples, setSamples] = useState([
    { id: '-1', type: 'Sputum', site: 'Lower respiratory tract', time: '28 Sep 07:10', tests: ['Xpert MTB/RIF Ultra'] },
    { id: '-2', type: 'Blood, aerobic bottle', site: 'Venous blood, left arm', time: '28 Sep 07:25', tests: ['Blood culture'] },
    { id: '-3', type: 'Blood, anaerobic bottle', site: 'Venous blood, left arm', time: '28 Sep 07:25', tests: ['Blood culture'] },
    { id: '-4', type: 'Blood, aerobic bottle', site: 'Venous blood, right arm', time: '28 Sep 07:31', tests: ['Blood culture'] },
    { id: '-5', type: 'Blood, anaerobic bottle', site: 'Venous blood, right arm', time: '28 Sep 07:31', tests: ['Blood culture'] },
    { id: '-6', type: 'Serum', site: '', time: '28 Sep 07:25', tests: ['RPR'] },
    { id: '-7', type: 'Wound swab', site: 'Wound, lower leg', time: '28 Sep 07:40', tests: ['Bacterial culture'] },
    { id: '-8', type: 'Isolate', site: '', time: '27 Sep 15:00', tests: ['Bacterial culture', 'VITEK 2 AST-N405'], elsewhere: { test: 'Bacterial culture', lab: 'Port Moresby General Hospital Laboratory', value: 'Escherichia coli', receivedAt: '26 Sep' } },
  ]);
  const [sets, setSets] = useState({ '-2': '1', '-3': '1', '-4': '2', '-5': '2' });
  const bottles = samples.filter(sm => sets[sm.id]);
  const setWarn = [];
  ['1', '2', '3'].forEach(n => { const b = bottles.filter(sm => sets[sm.id] === n); if (b.length === 1) setWarn.push(t('order.sample.set.warn.single', 'Set {0} has one bottle').replace('{0}', n)); const ty = b.map(x => x.type); ty.forEach((x, i) => { if (ty.indexOf(x) !== i) setWarn.push(t('order.sample.set.warn.sameType', 'Set {0} has two {1} bottles').replace('{0}', n).replace('{1}', x.includes('aerobic') && !x.includes('anaerobic') ? 'aerobic' : 'anaerobic')); }); });
  const nSets = new Set(Object.values(sets)).size;

  const SITES = ['Lower respiratory tract', 'Venous blood, left arm', 'Venous blood, right arm', 'Central line', 'Wound, lower leg', 'Wound, forearm', 'Urethra'];
  const setSample = (si, patch) => { const c = [...samples]; c[si] = { ...c[si], ...patch }; setSamples(c); };
  const catalog = [['Bacterial culture', 'Microbiology', 'test'], ['TB culture', 'TB', 'test'], ['TB investigation', 'TB culture, AFB smear, Xpert MTB/RIF Ultra', 'panel'], ['Fungal culture', 'Microbiology', 'test'], ['Gram stain', 'Microbiology', 'test'], ['AFB smear (ZN)', 'TB', 'test']];
  const hits = catalog.filter(c => q && c[0].toLowerCase().includes(q.toLowerCase()));
  const add = name => { const c = [...samples]; if (!c[0].tests.includes(name)) c[0] = { ...c[0], tests: [...c[0].tests, name] }; setSamples(c); setQ(''); setOpen(false); };
  const remove = (si, name) => { const c = [...samples]; c[si] = { ...c[si], tests: c[si].tests.filter(x => x !== name) }; setSamples(c); };
  const generic = ['TB culture', 'Bacterial culture', 'Blood culture', 'Fungal culture', 'Xpert MTB/RIF Ultra', 'AFB smear (ZN)', 'Gram stain'];
  const s1 = samples[0].tests;
  const cases = [];
  if (s1.some(x => ['Xpert MTB/RIF Ultra', 'AFB smear (ZN)', 'TB culture'].includes(x))) cases.push(['TB case (first micro test: ' + s1.find(x => ['Xpert MTB/RIF Ultra', 'AFB smear (ZN)', 'TB culture'].includes(x)) + ')', '-1 Sputum', 'TB', s1.includes('TB culture') ? 'Culture joins the same case' : 'No culture ordered: releases on the Xpert result; a reflex TB culture on RR joins it']);
  if (s1.includes('Bacterial culture') || s1.includes('Fungal culture')) cases.push([[s1.includes('Bacterial culture') && 'Bacterial culture', s1.includes('Fungal culture') && 'Fungal culture'].filter(Boolean).join(' + '), '-1 Sputum', 'Microbiology', 'Another lab unit than the TB case, so a related case on the same sample; bacterial and fungal cultures in Microbiology share it']);
  cases.push(['Blood culture case in Microbiology', `-2 to -5: ${nSets} sets, 4 bottles`, 'Microbiology', 'One case for the order; reception set the set numbers; site and time only warn (D-192).']);
  const iso = samples.find(sm => sm.elsewhere);
  if (iso) cases.push(['Bacterial culture case in Microbiology (received isolate)', `${iso.id} Isolate`, 'Microbiology', `Tested elsewhere: ${iso.elsewhere.lab}, reported ${iso.elsewhere.value}. Opens with ISO-1 Received from that laboratory; AST here (D-194).`]);
  samples.filter(sm => sm.id === '-7').forEach(sm => cases.push(['Bacterial culture case in Microbiology', `${sm.id} ${sm.type}`, 'Microbiology', 'The culture test ordered here; more cultures are added on the case by inoculating (D-Q5)']));
  return <div>
    <Breadcrumb noTrailingSlash style={{ marginBottom: '.5rem' }}><BreadcrumbItem href="#">Home</BreadcrumbItem><BreadcrumbItem href="#">Orders &amp; Patients</BreadcrumbItem><BreadcrumbItem isCurrentPage>Enter Order</BreadcrumbItem></Breadcrumb>
    <h1>Enter Order: Samples and tests</h1>
    <div className="note-box anno" style={{ marginBottom: '1rem' }}>v2: there is no Microbiology section. Micro tests (cultures and direct tests such as Xpert, AFB smear and Gram stain) are picked here like any other test (Clinical Order Entry v4 FR-B14); the first one on a sample opens its case. <span className="new3">v3</span> There are no case tests and no Case role: reception orders the culture test (or a direct test) itself, and more cultures are added on the case by inoculating (D-Q5). One case per order, sample type and lab unit; the case's own Program is set in Case information (D-178). The order's Program plays no part. Blood culture: one sample per bottle, each with its own body site and collection time.</div>
    <div className="sec"><div className="sec-b">
      <div className="grid" style={{ marginBottom: '1rem' }}>
        <Field label={t('common.program', 'Program')}><Sel defaultValue="TB Program"><option>None</option><option>TB Program</option><option>HIV Program</option></Sel><div className="helper">Never routes micro work; its questionnaire answers are the same record on the case (D-198)</div></Field>
        <Field label="Provisional diagnosis"><Inp defaultValue="Presumptive TB, sepsis" /></Field>
      </div>
      <Table size="sm"><TableHead><TableRow><TableHeader style={{ width: '20%' }}>Sample</TableHeader><TableHeader style={{ width: '22%' }}>Body site · collected</TableHeader><TableHeader style={{ width: '9%' }}>{t('order.sample.setNumber', 'Set')}</TableHeader><TableHeader>Tests</TableHeader></TableRow></TableHead>
        <TableBody>{samples.map((sm, si) => <TableRow key={sm.id}><TableCell>{sm.id} · {sm.type}</TableCell><TableCell><div className="field"><Sel value={sm.site} onChange={e => setSample(si, { site: e.target.value })} aria-label={`Body site for ${sm.id}`}><option value="">No body site</option>{SITES.map(x => <option key={x}>{x}</option>)}</Sel></div><div className="field" style={{ marginTop: 4 }}><Inp value={sm.time} onChange={e => setSample(si, { time: e.target.value })} aria-label={`Collected at for ${sm.id}`} /></div></TableCell>
          <TableCell>{sets[sm.id] ? <Sel value={sets[sm.id]} onChange={e => setSets({ ...sets, [sm.id]: e.target.value })} aria-label={`Set for ${sm.id}`}>{['1', '2', '3'].map(n => <option key={n} value={n}>{t('order.sample.set.option', 'Set {0}').replace('{0}', n)}</option>)}</Sel> : <span className="muted">n/a</span>}</TableCell>
          <TableCell>{sm.elsewhere && <div style={{ marginBottom: 4 }}><Tag kind="purple">Tested elsewhere</Tag> <span className="muted">{sm.elsewhere.test}: {sm.elsewhere.lab} (Organizations list), reported {sm.elsewhere.value}{sm.elsewhere.receivedAt && `, ${t('microbiology.case.receivedAt', 'Received at {laboratory}').replace('{laboratory}', 'that laboratory')} ${sm.elsewhere.receivedAt}`}</span></div>}{sm.tests.map(x => <span key={x} style={{ marginRight: 4 }}><Tag kind={generic.includes(x) ? 'teal' : 'gray'}>{x}{si === 0 && <button onClick={() => remove(si, x)} aria-label={'Remove ' + x} style={{ border: 0, background: 'none', cursor: 'pointer', marginLeft: 2, minWidth: 32, minHeight: 32 }}>×</button>}</Tag></span>)}
            {si === 0 && <div className="field" style={{ position: 'relative', marginTop: 6, maxWidth: 360 }}>
              <Inp aria-label="Search tests or panels" value={q} placeholder="Search tests or panels" onFocus={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true); }} />
              {open && hits.length > 0 && <div className="menu" style={{ left: 0, right: 'auto', width: '100%' }}>{hits.map(c => <button key={c[0]} onClick={() => add(c[0])}>{c[0]} <span className="muted">({c[2] === 'panel' ? 'panel: ' + c[1] : c[1]})</span></button>)}</div>}
              <div className="helper">Try "culture" or "smear". Same picker as every other test.</div></div>}</TableCell></TableRow>)}</TableBody></Table>
      <div className="inline-panel">
        <b style={{ fontSize: 14 }}>{t('order.micro.summary.title', 'What this order will open')}</b> <span className="new">v2</span> <span className="muted anno">live, updates as tests and samples change; saves nothing (D-190)</span>
        {setWarn.length > 0 && <div className="cds--inline-notification cds--inline-notification--warning" style={{ maxWidth: 'none', marginTop: '.5rem' }}><div className="cds--inline-notification__details"><div className="cds--inline-notification__text-wrapper"><div className="cds--inline-notification__title">Check the sets</div><div className="cds--inline-notification__subtitle">{setWarn.join('; ')}. You can still save.</div></div></div></div>}
        <Table size="sm" style={{ marginTop: '.5rem' }}><TableHead><TableRow><TableHeader>Case opens for</TableHeader><TableHeader>Samples</TableHeader><TableHeader>Lab unit</TableHeader><TableHeader>Note</TableHeader></TableRow></TableHead>
          <TableBody>{cases.map(c => <TableRow key={c[0]}><TableCell><Tag kind="teal">{t('order.micro.tag.opensCase', 'Opens a case')}</Tag> {c[0]}</TableCell><TableCell>{c[1]}</TableCell><TableCell>{c[2]}</TableCell><TableCell className="muted">{c[3]}</TableCell></TableRow>)}
            <TableRow><TableCell><Tag kind="gray">{t('order.micro.tag.staysInResults', 'Stays in Results')}</Tag> RPR</TableCell><TableCell>-6 Serum</TableCell><TableCell>Microbiology (serology)</TableCell><TableCell className="muted">RPR has Opens a Microbiology case: No, so it stays on Results even in the micro lab unit</TableCell></TableRow>
            <TableRow><TableCell colSpan={4} className="muted">{t('order.micro.summary.reflex', 'If {0}: adds {1}').replace('{0}', 'Blood culture result = Positive').replace('{1}', 'Gram stain, culture on that bottle')} (reflex rule)</TableCell></TableRow></TableBody></Table>
        <div style={{ marginTop: '.75rem', background: '#fff', border: '1px solid #e0e0e0', padding: '.75rem' }}>
          <div className="muted" style={{ fontSize: 12 }}>Blood culture case header</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}><span><b>{t('microbiology.case.cultureSet.summary', '{test}: {sets} sets, {bottles} bottles').replace('{test}', 'Blood culture').replace('{sets}', '2').replace('{bottles}', '4')}</b> <span className="muted">Set 1: left arm, 07:25, aerobic and anaerobic | Set 2: right arm, 07:31, aerobic and anaerobic</span></span>
            <Btn kind="ghost">{t('microbiology.case.splitCases', 'Split into separate cases')} (reason)</Btn><span className="muted">Only a sample with no results on the case can be split off.</span></div>
        </div>
        <div className="note-box anno" style={{ marginTop: '.75rem' }}>Removed from order entry in v2: the Microbiology section, Culture rows, + Another culture, culture protocol, culture purpose, patient origin, admission date, number of sets as a typed field (it is counted from the Set numbers), clinical history, antibiotic exposure. Case details are entered on the case; Program questions are answered here or on the case, one record (D-198).</div>
      </div>
    </div></div>
  </div>;
}

function App() {
  const [view, setView] = useState('case');
  const [notesOn, setNotesOn] = useState(false);
  useEffect(() => { document.body.classList.toggle('notes-on', notesOn); }, [notesOn]);
  const page = BUILD_MAP.find(b => b.view === view && !['case'].includes(b.view));
  return <div className="shell"><style>{PREVIEW_CSS}</style>
    <div className="side">
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 600, marginBottom: '.25rem' }}><Inp type="checkbox" checked={notesOn} onChange={e => setNotesOn(e.target.checked)} style={{ width: 'auto' }} />{'Design notes'}</label>
      <div className="legend-b">Off: the product as users see it. On: design notes, version chips and build state.</div>
      {notesOn && <div className="legend-b"><div><span style={{ outline: '2px dashed #8d8d8d' }}></span>Built on develop {BUILD_DEV}: keep</div><div><span style={{ outline: '2px dashed #0f62fe' }}></span>v2 FRS, not on develop</div><div><span style={{ outline: '2px solid #24a148' }}></span>New in v3</div><div style={{ marginTop: 4 }}>Builders: read BUILD_MAP in the source, or amr-micro-v3-build-map.md.</div></div>}
      <h6>Microbiology</h6>
      <button className={view === 'case' ? 'on' : ''} onClick={() => setView('case')}>Case view (TB example)</button>
      <button className={view === 'bc' ? 'on' : ''} onClick={() => setView('bc')}>Case view (blood culture, AMR example)</button>
      <button className={view === 'ri' ? 'on' : ''} onClick={() => setView('ri')}>Case view (received isolate, sentinel site)</button>
      <button className={view === 'wl' ? 'on' : ''} onClick={() => setView('wl')}>Worklist (Needs attention, bench work)</button>
      <h6 style={{ marginTop: '1rem' }}>Workplan</h6>
      <button className={view === 'wp' ? 'on' : ''} onClick={() => setView('wp')}>Workplan: Microbiology bench</button>
      <h6 style={{ marginTop: '1rem' }}>Admin</h6>
      <button className={view === 'adm' ? 'on' : ''} onClick={() => setView('adm')}>Test catalog, programs, media links, settings</button>
      <button className={view === 'panels' ? 'on' : ''} onClick={() => setView('panels')}>Microbiology reference data: AST panels <span className="new3">v3</span></button>
      <button className={view === 'rules' ? 'on' : ''} onClick={() => setView('rules')}>Microbiology reference data: AST rules <span className="new3">v3</span></button>
      <button className={view === 'ref' ? 'on' : ''} onClick={() => setView('ref')}>Microbiology reference data: Organisms, Antibiotics, Breakpoint standards <span className="new3">v3</span></button>
      <h6 style={{ marginTop: '1rem' }}>Orders &amp; Patients</h6>
      <button className={view === 'oe' ? 'on' : ''} onClick={() => setView('oe')}>Enter Order: samples and tests</button>
    </div>
    <div className="main" {...(page ? buildAttrs(page.key) : {})}>{page && <BuildStrip k={page.key} />}{view === 'case' ? <CaseView key="tb" ex={TB_EX} /> : view === 'bc' ? <CaseView key="bc" ex={BC_EX} /> : view === 'ri' ? <CaseView key="ri" ex={RI_EX} /> : view === 'wl' ? <Worklist /> : view === 'wp' ? <WorkplanView /> : view === 'adm' ? <MediaLinksAdmin /> : view === 'panels' ? <AstPanelsAdmin /> : view === 'rules' ? <ReportingRulesAdmin /> : view === 'expert' ? <ExpertRulesAdmin /> : view === 'ref' ? <ReferenceDataAdmin /> : <OrderEntry />}</div>
  </div>;
}

export default App;
