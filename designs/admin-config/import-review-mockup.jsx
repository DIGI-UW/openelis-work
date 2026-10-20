// Import Review: shared import preview for Locations & Organizations and the test catalog (developer handoff mockup)
// FRS: import-review-frs.md (v0.4) · Architecture: reference-data-config-frs.md (v0.6) · Preview: import-review-preview.html (v0.4)
// Routes: /MasterListsPage/locations/import (Admin > Locations & Organizations > Import / Export)
//         /MasterListsPage/CatalogImport (Admin > Test Catalogue Management > Import Catalog (CSV))
// Author: Casey · Date: 2026-10-20 · Built and rendered with @carbon/react 1.118.0, React 18.3.1
//
// READ FIRST: the yellow scenario bar and the "Preview only" strip are drawing aids, not part of the design.
// Mock data and the count model below show behaviour; the server owns the real counts (FR-C11).
// One page, no in-page tabs: review sections are Accordion items in the FR-B4 order, with one Show filter.
//
// ---------------------------------------------------------------------------------------------------------
// Localization. Every visible string goes through t(key, english). Existing keys (import-review-frs.md tables
// 1 to 3) are used where they exist. The keys below are NEW or Changed in v0.4 and listed in its tables 1 to 3.
//
// NEW and Changed keys in v0.4 (table 1 shared, table 2 L&O, table 3 catalog), English values:
//   label.importReview.todo.title              Before you apply
//   label.importReview.todo.progress           {done} of {total} done
//   label.importReview.todo.canWait            (can wait)
//   message.importReview.todo.foot               Questions you leave unanswered do not stop Apply. Those rows wait, and you can answer them later from Recent imports.
//   label.importReview.notAnswered        {count, plural, one {# not answered yet} other {# not answered yet}}
//   label.importReview.todo.answered           {count} answered
//   label.importReview.todo.toCheck            {count} to check
//   label.importReview.todo.checked            {count} checked
//   label.importReview.todo.leftToWait         {count} left to wait
//   button.importReview.todo.answer      Answer
//   button.importReview.todo.check       Check
//   button.importReview.todo.show        Show
//   label.importReview.todo.guarded            {field} changes
//   label.importReview.todo.warnings           Warnings: {check}
//   label.importReview.todo.capRows            {count} rows without a code
//   label.importReview.tag.notAnswered         Not answered yet
//   label.importReview.notAnswered     {count} not answered yet
//   label.importReview.section.allAnswered     all answered
//   label.importReview.section.records      {total, plural, one {# record} other {# records}}: {parts}
//   label.importReview.section.records     {total, plural, one {# record} other {# records}}: {parts}
//   label.importReview.section.part.updated    {count} updated
//   label.importReview.section.part.reactivated {count} reactivated
//   label.importReview.section.part.deactivated {count} deactivated
//   catalog.import.section.part.notOrderable {count} made not orderable
//   label.importReview.section.part.kept       {count} kept active
//   label.importReview.show              Show
//   label.importReview.show.all                All outcomes
//   label.importReview.show.option             {label} ({count})
//   label.importReview.column.whyMatched       Why matched
//   label.importReview.column.whyAsked         Why asked
//   label.importReview.column.candidates       Candidates
//   label.importReview.column.answer           Answer
//   label.importReview.column.whatChanges      What changes
//   catalog.import.whatChanges.ranges      Ranges: {parts}
//   message.importReview.bar.notAnswered         {count, plural, one {# row is not answered yet and will wait.} other {# rows are not answered yet and will wait.}}
//   message.importReview.bar.blocked             {count, plural, one {# thing left before you can apply} other {# things left before you can apply}}
//   button.importReview.bar.more                More actions
//   button.importReview.discard            Discard this preview
//   label.importReview.discard.title           Discard this preview?
//   message.importReview.discard.body            Your answers are discarded and nothing is applied. The run stays in Recent imports as Discarded, so others no longer see it as open.
//   button.importReview.discard.confirm         Discard preview
//   message.importReview.discard.done            Preview discarded. (title) / Nothing was applied. It stays in Recent imports as Discarded. (subtitle)
//   label.importReview.status.discarded        Discarded
//   label.importReview.warnings.ackOne         I have checked this warning
//   label.importReview.warnings.ackMany        I have checked these {count} warnings
//   label.importReview.warnings.heading        Warnings (will be applied; check each group)
//   message.importReview.confirm.warningsChecked {count, plural, one {# warning was checked and will be applied.} other {# warnings were checked and will be applied.}}
//   label.importReview.guarded.tickOne         I have checked the change to {field}
//   catalog.import.meaning.group           Changes what past results mean
//   catalog.import.meaning.help            {name} has {count} results. Changing its {field} would show them in the new {field}. A new version keeps past results as they were.
//   catalog.import.meaning.why             The {field} changes from {from} to {to}
//   catalog.import.newVersion      Create a new version of this test (recommended)
//   catalog.import.meaning.relabel         Same measurement, only the label changes
//   catalog.import.meaning.notEquivalent   {from} and {to} are different measurements. Choose a new version.
//   catalog.import.meaning.skip            Skip this row
//   catalog.import.meaning.result          A new test "{name}" ({code}, {to}) is created with the file's ranges. The current test becomes "{name} (to {date})", is made not orderable and keeps its {count} results as they were. These stay on the current test until you move them: {deps}.
//   catalog.import.warning.coverage.check          Range coverage
//   catalog.import.warning.coverage        After this import, {test} has no normal range for: {groups}. Their results will not be flagged.
//   button.importReview.exportCodes      Export with codes
//   message.importReview.exportCodes.started     Export with codes started
//   message.importReview.exportCodes.body        {file}: your {count} rows in your file's columns, plus the code of the record each one looks like. It will download when it is ready.
//   admin.locations.import.tooMany.help            If this file lists new places, treat them all as new. If they are the same places, add the code column and upload again: Export with codes gives you this file's rows with the matching codes filled in.
//   label.importReview.export.title            Export
//   label.importReview.export.area             What to export
//   button.importReview.export.download         Download CSV
//   admin.locations.export.help             The file starts with a line that records the filters used. If you import it back with Replace, only those records can be deactivated. Filter a list first (Organizations, Sampling Sites) to export part of it.
//   message.importReview.export.started          Export started
//   admin.locations.import.registry.label          About registry records
//   admin.locations.import.registry.help           From the facility registry. Name, code and location come from the registry and are not changed by this file. Active status and local settings are.
//   label.importReview.deactivate       Deactivate
//   catalog.import.makeNotOrderable Make not orderable
//   catalog.import.openAnalyses It has {count} open analyses, so it cannot be deactivated now. Not orderable: it leaves order entry; open analyses can still be completed and released.
//   label.importReview.deactivate.keepAllReach Answers all {count} records
//   button.importReview.clearAnswer        Clear this answer
//   catalog.import.underQuarter   (catalog) This file lists {listed} of the {total} records in its scope. Replace would take the other {others} out of use (tests with open analyses are made not orderable instead of deactivated). Did you mean Add & update?
//   preview.only.previewRows  Preview data: {count} sample rows shown.
//
// Existing keys that v0.4 retires: label.importReview.outcome.decision ("Needs decision", tiles removed),
//   label.importReview.group.unanswered ("{count} without an answer"), message.importReview.bar.pending
//   ("... wait for your answer ..."), message.importReview.bar.guarded (replaced by message.importReview.bar.blocked),
//   label.importReview.confirm.warnings (warnings are checked in place), button.importReview.keepSelectedActive,
//   label.importReview.column.fieldsChanging (replaced by label.importReview.column.whatChanges).
// ---------------------------------------------------------------------------------------------------------

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Accordion, AccordionItem, Button, Callout, Checkbox, ComposedModal, FileUploaderDropContainer,
  InlineNotification, ModalBody, ModalFooter, ModalHeader, OverflowMenu, OverflowMenuItem, Pagination,
  ProgressIndicator, ProgressStep, RadioButton, RadioButtonGroup, RadioTile, Select, SelectItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableHeader, TableRow, Tag, TileGroup, ToastNotification, Popover,
  PopoverContent, ProgressBar,
} from '@carbon/react';
import { CheckmarkFilled, ChevronDown, ChevronRight, CircleDash, Information, RadioButton as RadioIcon } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;
const fmt = n => n.toLocaleString('en-US');
const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;
const joinList = parts => parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : (parts[0] || '');

const PREVIEW_CSS = `
  body { background:#f4f4f4; margin:0; }
  .ir-banner { background:#0f62fe; color:#fff; padding:6px 1rem; font-size:12px; font-family:monospace; }
  .ir-scen { background:#fff8e1; border-bottom:1px dashed #b28600; padding:.5rem 1rem; font-size:13px; display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
  .ir-scen button { border:1px solid #b28600; background:#fff; padding:.25rem .625rem; font-size:13px; cursor:pointer; }
  .ir-scen button.sel { background:#b28600; color:#fff; }
  .ir-shell { display:flex; min-height:calc(100vh - 60px); }
  .ir-nav { width:240px; background:#fff; border-right:1px solid #e0e0e0; flex:none; padding-top:.5rem; font-size:14px; }
  .ir-nav .grp { font-size:12px; color:#6f6f6f; padding:.75rem 1rem .25rem; text-transform:uppercase; letter-spacing:.32px; }
  .ir-nav .parent { padding:.75rem 1rem; font-weight:600; }
  .ir-nav a { display:block; padding:.5rem 1rem .5rem 2rem; color:#525252; text-decoration:none; border-left:3px solid transparent; }
  .ir-nav a.active { background:#e0e0e0; color:#161616; border-left-color:#0f62fe; font-weight:600; }
  .ir-nav .muted { padding:.5rem 1rem; color:#6f6f6f; }
  .ir-main { flex:1; padding:1rem 2rem 2rem; min-width:0; max-width:1180px; }
  .ir-crumbs { font-size:14px; color:#525252; } .ir-crumbs a { color:#0f62fe; text-decoration:none; }
  .ir-title { font-size:28px; font-weight:400; margin:.5rem 0 .25rem; }
  .ir-explainer { font-size:14px; color:#525252; margin:0 0 1rem; max-width:52rem; }
  .ir-panel { background:#fff; padding:1rem 1.25rem; margin-bottom:1rem; }
  .ir-panel h3 { font-size:16px; font-weight:600; margin:0 0 .75rem; }
  .ir-summary { font-size:20px; font-weight:300; line-height:1.5; margin:0 0 .25rem; }
  .ir-sub { font-size:12px; color:#6f6f6f; }
  .ir-meta { font-size:14px; color:#525252; }
  .ir-todo { border:1px solid #e0e0e0; margin-top:1rem; }
  .ir-todo-hd { display:flex; align-items:center; gap:.75rem; padding:.5rem .875rem; background:#f4f4f4; }
  .ir-todo-hd h4 { margin:0; font-size:14px; font-weight:600; }
  .ir-todo-row { display:grid; grid-template-columns:24px minmax(0,1fr) minmax(0,220px) 110px; gap:.75rem; align-items:center; padding:.5rem .875rem; border-top:1px solid #e0e0e0; font-size:14px; }
  .ir-todo-foot { padding:.5rem .875rem; border-top:1px solid #e0e0e0; font-size:14px; color:#525252; }
  .ir-filter { display:flex; gap:1rem; align-items:flex-end; margin:0 0 .75rem; flex-wrap:wrap; }
  .ir-acc { background:#fff; }
  .ir-acc .cds--accordion__title { font-size:16px; font-weight:600; }
  .ir-acc .cds--accordion__content { padding-right:1rem; }
  .ir-cnt { font-weight:400; color:#525252; font-size:14px; margin-left:.375rem; }
  .ir-grp { border:1px solid #e0e0e0; margin-bottom:.75rem; }
  .ir-grp-hd { background:#f4f4f4; padding:.625rem .875rem; display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
  .ir-grp-hd h4 { margin:0; font-size:14px; font-weight:600; }
  .ir-grp-help { padding:.5rem .875rem 0; font-size:14px; color:#525252; }
  .ir-grp-answers { display:flex; gap:.75rem; padding:.625rem .875rem; flex-wrap:wrap; align-items:flex-start; }
  .ir-ga { display:flex; flex-direction:column; gap:.125rem; }
  .ir-ack { display:flex; gap:.5rem; align-items:center; padding:.5rem .75rem; background:#fcf4d6; }
  .ir-ack.on { background:#defbe6; }
  .ir-after td { background:#f4f4f4; }
  .ir-old { color:#525252; } .ir-new { font-weight:600; }
  .ir-bar { position:sticky; bottom:0; z-index:20; background:#fff; border-top:2px solid #0f62fe; box-shadow:0 -2px 8px rgba(0,0,0,.12); display:flex; gap:1rem; align-items:center; padding:.625rem 1rem; margin-top:1rem; flex-wrap:wrap; }
  .ir-bar .msg { flex:1; font-size:14px; min-width:280px; display:flex; flex-direction:column; gap:.125rem; }
  .ir-bar .btns { display:flex; gap:1px; align-items:center; }
  .ir-blocked { color:#a2191f; }
  .ir-saved { font-size:12px; color:#198038; margin-top:.25rem; } .ir-unsaved { font-size:12px; color:#8e6a00; margin-top:.25rem; }
  .ir-link { background:none; border:none; color:#0f62fe; cursor:pointer; padding:0; font-size:inherit; font-family:inherit; text-decoration:underline; }
  .ir-live { position:absolute; left:-9999px; }
  .ir-toast { position:fixed; top:1rem; right:1rem; z-index:9000; }
  .ir-preview-only { font-size:12px; color:#8e6a00; background:#fff8e1; border:1px dashed #b28600; padding:.375rem .625rem; margin:.5rem 0; }
  .ir-modes .cds--tile-group > div, .ir-modes fieldset > div { display:flex; gap:.75rem; flex-wrap:wrap; }
  .ir-modes .cds--tile { flex:1 1 220px; }
  .ir-scope { background:#f4f4f4; border-left:3px solid #0f62fe; padding:.625rem .875rem; font-size:14px; margin-top:.75rem; }
  .ir-dec td { vertical-align:top; }
`;

// ---------------------------------------------------------------------------------------------------------
// Mock data (Papua New Guinea; Abidjan for the French file)
// ---------------------------------------------------------------------------------------------------------
const renames = [
  { line: 212, file: { name: 'Tokarara Urban Clinic', code: '', loc: 'Moresby North-West' }, cand: { name: 'Tokarara Clinic', code: 'NCD-TOK', loc: 'Moresby North-West', status: 'Active', open: 9 }, shared: 'Tokarara, same district' },
  { line: 388, file: { name: 'Kaugere Health Sub-Centre', code: '', loc: 'Moresby South' }, cand: { name: 'Kaugere Clinic', code: 'NCD-KAU', loc: 'Moresby South', status: 'Active', open: 3 }, shared: 'Kaugere, same district' },
  { line: 641, file: { name: 'Lae Urban Health Centre', code: '', loc: 'Lae Urban LLG' }, cand: { name: 'Lae Urban Clinic', code: 'MRB-LUC', loc: 'Lae Urban LLG', status: 'Active', open: 17 }, shared: 'Lae Urban, same LLG' },
  { line: 902, file: { name: 'Butibam Aid Post', code: '', loc: 'Lae Urban LLG' }, cand: { name: 'Butibam Village Aid Post', code: '', loc: 'Lae Urban LLG', status: 'Active', open: 0 }, shared: 'Butibam, same LLG' },
  { line: 1180, file: { name: 'Kainantu Rural Hospital', code: '', loc: 'Kainantu District' }, cand: { name: 'Kainantu District Hospital', code: 'EHP-KDH', loc: 'Kainantu District', status: 'Active', open: 21 }, shared: 'Kainantu, same district' },
  { line: 1477, file: { name: 'Wabag Hospital', code: '', loc: 'Wabag District' }, cand: { name: 'Wabag Provincial Hospital', code: 'ENG-WPH', loc: 'Wabag District', status: 'Active', open: 33 }, shared: 'Wabag, same district' },
];
const matches = [
  { line: 155, file: { name: 'Kila Kila Clinic', code: '', loc: 'Moresby South' }, why: 'Matches 2 records by name', cands: [
    { id: 'c1', name: 'Kilakila Clinic', code: 'NCD-KIL', loc: 'Moresby South', status: 'Active', open: 6 },
    { id: 'c2', name: 'Kila Kila Health Sub-Centre', code: 'NCD-KKS', loc: 'Moresby South', status: 'Inactive', open: 0 }] },
  { line: 733, file: { name: 'St Mary\'s Health Centre', code: '', loc: 'Mount Hagen Urban LLG' }, why: 'Two records have this exact name', cands: [
    { id: 'c3', name: 'St Mary\'s Health Centre', code: 'WHP-SMH', loc: 'Mount Hagen Urban LLG', status: 'Active', open: 4 },
    { id: 'c4', name: 'St Mary\'s Health Centre', code: 'WHP-SMR', loc: 'Mount Hagen Urban LLG', status: 'Active', open: 1 }] },
  { line: 1309, file: { name: 'Goroka Base Hospital', code: 'EHP-0001', loc: 'Goroka District' }, why: 'Name matches a record that already has a different code (GPH)', cands: [
    { id: 'c5', name: 'Goroka Provincial Hospital', code: 'GPH', loc: 'Goroka District', status: 'Active', open: 30 }] },
];
const updatedRows = [
  { id: 'u1', name: 'Port Moresby General Hospital', code: 'PMGH', type: 'Referring clinic, Referral lab', fields: [['Phone', '+675 325 6200', '+675 324 8200']] },
  { id: 'u2', name: 'Kilakila Clinic', code: 'NCD-KIL', type: 'Referring clinic', fields: [['GPS latitude', '', '-9.4705'], ['GPS longitude', '', '147.1810']] },
  { id: 'u3', name: 'Gerehu General Hospital', code: 'NCD-GGH', type: 'Referring clinic', guarded: true, usedBy: '1,240 open orders, national monthly report', fields: [['Reporting code', 'NCD-HC-01', 'NCD-0201']] },
  { id: 'u4', name: 'Tokarara Clinic', code: 'NCD-TOK', type: 'Referring clinic', guarded: true, usedBy: '9 open orders, national monthly report', fields: [['Reporting code', 'NCD-HC-07', 'NCD-0207']] },
  { id: 'u5', name: 'Badili Clinic', code: 'NCD-BAD', type: 'Referring clinic', guarded: true, usedBy: '14 open orders, national monthly report', fields: [['Reporting code', 'NCD-HC-03', 'NCD-0203']] },
  { id: 'u6', name: 'Hohola Clinic', code: 'NCD-HOH', type: 'Referring clinic', guarded: true, usedBy: '2 open orders, national monthly report', fields: [['Reporting code', 'NCD-HC-05', 'NCD-0205']] },
  { id: 'u7', name: 'Mount Hagen Provincial Hospital', code: 'MHPH', type: 'Referring clinic', registry: true, fields: [['Phone', '+675 542 1188', '+675 542 1100'], ['Contact name', 'Dr. P. Kuman', 'Dr. Paul Kuman']] },
  { id: 'u8', name: 'Angau Memorial Hospital', code: 'ANGAU', type: 'Referring clinic', fields: [['Email', 'lab@angau.gov.pg', ''], ['Category', 'Provincial hospital', 'National referral hospital']], cleared: 'Email' },
  { id: 'u9', name: 'Central Public Health Laboratory', code: 'CPHL', type: 'Referral lab', fields: [['Next review due', '2026-08-30', '2027-08-30'], ['Accreditation number', 'ISO-15189-PNG-004', 'ISO-15189-PNG-0042']] },
  { id: 'u10', name: 'Goroka Provincial Hospital', code: 'GPH', type: 'Referring clinic', fields: [['Report email addresses', 'lab@gph.gov.pg', 'lab@gph.gov.pg; results@gph.gov.pg']] },
];
const reactivatedRows = [{ id: 'r1', name: 'Medical Ward 3', code: 'PMGH-MW3', type: 'Ward / dept', parent: 'Port Moresby General Hospital', reactivated: true, fields: [['Active', 'Inactive', 'Active']] }];
const newRows = [
  ['Gerehu Urban Clinic', 'NCD-0219', 'Referring clinic', 'Moresby North-West', 6], ['Morata Health Sub-Centre', 'NCD-0220', 'Referring clinic', 'Moresby North-West', 5],
  ['Bomana Aid Post', 'CEN-0441', 'Referring clinic', 'Kairuku-Hiri District', 3], ['Malahang Clinic', 'MRB-0312', 'Referring clinic', 'Lae Urban LLG', 7],
  ['Bugandi Health Centre', 'MRB-0313', 'Referring clinic', 'Lae Urban LLG', 6], ['Nawaeb Rural Health Centre', 'MRB-0390', 'Referring clinic', 'Nawae District', 4],
  ['Kagamuga Clinic', 'WHP-0120', 'Referring clinic', 'Mount Hagen Urban LLG', 5], ['Kwikila District Hospital', 'CEN-0102', 'Referring clinic', 'Rigo District', 9],
  ['Asaro Health Centre', 'EHP-0144', 'Referring clinic', 'Goroka District', 4], ['Henganofi Health Centre', 'EHP-0151', 'Referring clinic', 'Henganofi District', 4],
  ['Wapenamanda Health Centre', 'ENG-0033', 'Referring clinic', 'Wapenamanda District', 5], ['Kundiawa General Hospital Lab', 'SIM-0002', 'Referral lab', 'Kundiawa-Gembogl District', 11],
  ['Gerehu Urban Clinic / Antenatal Clinic', 'NCD-0219-ANC', 'Ward / dept', 'Gerehu Urban Clinic', 3], ['Gerehu Urban Clinic / Outpatients', 'NCD-0219-OPD', 'Ward / dept', 'Gerehu Urban Clinic', 3],
  ['Malahang Clinic / Outpatients', 'MRB-0312-OPD', 'Ward / dept', 'Malahang Clinic', 3], ['Kwikila District Hospital / Maternity', 'CEN-0102-MAT', 'Ward / dept', 'Kwikila District Hospital', 3],
  ['Kwikila District Hospital / Outpatients', 'CEN-0102-OPD', 'Ward / dept', 'Kwikila District Hospital', 3], ['Kwikila District Hospital / Laboratory', 'CEN-0102-LAB', 'Ward / dept', 'Kwikila District Hospital', 3],
].map(([name, code, type, loc, f], i) => ({ id: 'n' + i, name, code, type, loc, f, similar: name === 'Bugandi Health Centre' ? 'Bugandi Health Center (inactive)' : null }));

const SCENARIOS = {
  update: {
    label: 'Ministry update', page: 'org', files: [{ name: 'organizations-png-2026-10.csv', size: '412 KB', rows: 1840, sep: 'comma separated', enc: 'Excel CSV UTF-8', area: 'Facilities, wards & sites' }],
    fileWarn: 'These columns are not used and will be ignored: Region2', mode: 'merge',
    base: { facilities: 12, wards: 6, updated: 31, reactivated: 1, unchanged: 1767, rejected: 8, ignored: 1 },
    renames, matches, deact: [], deactOthers: 0, children: [], meaning: [],
    rejected: [
      { reason: 'nothing has the parent code NCD-MS2. Check the code, or add that record first.', lines: [301, 302, 305, 309, 311], col: 'parentCode' },
      { reason: 'GPS is not in decimal degrees (latitude -90 to 90, longitude -180 to 180).', lines: [77, 1102, 1650], col: 'gpsLatitude' },
    ],
    warnings: [
      { line: 48, msg: 'Gerehu General Hospital: automatic delivery is on and there is no delivery password. Patient reports will not be sent until one is set.', check: 'Automatic delivery, no password' },
      { line: 509, msg: 'Tokarara Clinic: automatic delivery is on and there is no delivery password. Patient reports will not be sent until one is set.', check: 'Automatic delivery, no password' },
      { line: 214, msg: 'Phone: looks like a spreadsheet changed it (=+675 325 1190). Check the cell in Excel.', check: 'Changed by a spreadsheet' },
    ],
    ignored: [{ what: 'Column "Region2"', detail: '412 rows had a value' }],
    guarded: { field: 'Reporting code', count: 4, text: '4 reporting codes change. National reports and exports will show the new codes from now on; past exports keep the old ones.' },
  },
  replace: {
    label: 'Replace (NCD clinics)', page: 'org', files: [{ name: 'organizations-ncd-clinics.csv', size: '18 KB', rows: 64, sep: 'comma separated', enc: 'Excel CSV UTF-8', area: 'Facilities, wards & sites' }],
    mode: 'replace', scope: 'This file has Referring clinic and Ward / Dept rows in National Capital District. Referral labs, sampling sites and geographic areas will not change. Wards / depts will only be replaced at Badili Clinic and Gordons Clinic. Records from the facility registry are never deactivated.',
    base: { facilities: 1, wards: 0, updated: 3, reactivated: 0, unchanged: 54, rejected: 0, ignored: 0 },
    renames: [], matches: [], meaning: [], deactOthers: 0,
    deact: [
      { id: 'd1', name: 'Gordons Clinic', code: 'NCD-GOR', type: 'Referring clinic', loc: 'Moresby North-East', open: 12, usedBy: ['12 open orders', '1 pending referral', 'Result delivery settings'] },
      { id: 'd2', name: 'Six Mile Aid Post', code: 'NCD-SMA', type: 'Referring clinic', loc: 'Moresby North-East', open: 3, usedBy: ['3 open orders'] },
      { id: 'd3', name: 'Hohola Youth Clinic', code: '', type: 'Referring clinic', loc: 'Moresby North-West', open: 0, usedBy: [] },
      { id: 'd4', name: 'Gordons Clinic / Dental', code: 'NCD-GOR-DEN', type: 'Ward / dept', loc: 'Gordons Clinic', open: 0, usedBy: [] },
    ],
    children: [{ line: 0, name: 'Badili Clinic', code: 'NCD-BAD', count: 2, wards: ['Badili Clinic / TB Clinic (5 open orders)', 'Badili Clinic / Outpatients (11 open orders)'] }],
    rejected: [], warnings: [], ignored: [],
  },
  empty: {
    label: 'Empty system', page: 'org', files: [{ name: 'organizations-png-national.csv', size: '402 KB', rows: 1800, sep: 'comma separated', enc: 'Excel CSV UTF-8', area: 'Facilities, wards & sites' }],
    mode: 'merge', dominant: { count: 1792, total: 1800, text: 'the region was not found. Import the geographic areas first.' },
    base: { facilities: 8, wards: 0, updated: 0, reactivated: 0, unchanged: 0, rejected: 1792, ignored: 0 },
    renames: [], matches: [], deact: [], deactOthers: 0, children: [], meaning: [],
    rejected: [{ reason: 'the region was not found. Import the geographic areas first (Geographic Areas, Import / Export).', lines: [2, 3, 4], more: 1789, col: 'parentName' }],
    warnings: [], ignored: [],
  },
  many: {
    label: 'Too many questions', page: 'org', files: [{ name: 'facilities-from-dhis2.csv', size: '96 KB', rows: 420, sep: 'comma separated', enc: 'Excel CSV UTF-8', area: 'Facilities, wards & sites' }],
    mode: 'merge', cap: 312,
    base: { facilities: 0, wards: 0, updated: 0, reactivated: 0, unchanged: 108, rejected: 0, ignored: 0 },
    renames: [], matches: [], deact: [], deactOthers: 0, children: [], meaning: [], rejected: [], warnings: [], ignored: [],
  },
  french: {
    label: 'French Excel file', page: 'org', files: [{ name: 'etablissements-abidjan.csv', size: '22 KB', rows: 96, sep: 'semicolon separated', enc: 'Excel CSV (Western European)', area: 'Facilities, wards & sites' }],
    mode: 'merge',
    base: { facilities: 2, wards: 0, updated: 3, reactivated: 0, unchanged: 90, rejected: 1, ignored: 0 },
    renames: [], matches: [], deact: [], deactOthers: 0, children: [], meaning: [],
    updatedOverride: [
      { id: 'fr1', name: 'Clinique Sainte-Thérèse', code: 'ABJ-0112', type: 'Referring clinic', fields: [['GPS latitude', '', '5.3364'], ['GPS longitude', '', '-4.0267']], info: 'Read 5,3364 as 5.3364 and -4,0267 as -4.0267' },
      { id: 'fr2', name: 'Centre de santé urbain de Treichville', code: 'ABJ-0140', type: 'Referring clinic', fields: [['Phone', '+225 21 24 00 00', '+225 21 24 11 90']] },
      { id: 'fr3', name: 'CHU de Cocody', code: 'ABJ-0001', type: 'Referring clinic, Referral lab', fields: [['Contact name', '', 'Dr Aya Koné']] },
    ],
    newOverride: [{ id: 'fn1', name: 'Formation sanitaire urbaine d\'Abobo-Baoulé', code: 'ABJ-0221', type: 'Referring clinic', loc: 'Abobo', f: 6 }, { id: 'fn2', name: 'Dispensaire de Koumassi Remblais', code: 'ABJ-0222', type: 'Referring clinic', loc: 'Koumassi', f: 5 }],
    rejected: [{ reason: 'write the number without thousands separators.', lines: [61], col: 'gpsLongitude', sample: '1.234,5' }],
    warnings: [], ignored: [], problemsSep: 'semicolon separated, Excel CSV (Western European)',
  },
  catalog: {
    label: 'Catalog: Hematology and ranges', page: 'catalog', files: [
      { name: 'tests-hematology-chemistry.csv', size: '11 KB', rows: 11, sep: 'comma separated', enc: 'Excel CSV UTF-8', area: 'Tests' },
      { name: 'result-limits-chemistry.csv', size: '4 KB', rows: 14, sep: 'comma separated', enc: 'Excel CSV UTF-8', area: 'Ranges' }],
    mode: 'replace', underQuarter: { listed: 11, total: 58, others: 47 },
    scope: 'This file has tests in Hematology and Chemistry. Tests in other lab units will not change. Ranges: the range set of each test listed in the ranges file is replaced (in either mode).',
    base: { tests: 1, ranges: 3, updated: 6, reactivated: 0, unchanged: 7, rejected: 1, ignored: 0, rangesRemoved: 4 },
    renames: [], matches: [{ line: 7, file: { name: 'Unit: mg/dl', code: '', loc: 'Fibrinogen' }, why: 'Not found exactly; one unit differs only in capitals', cands: [{ id: 'mgdl', name: 'mg/dL', code: 'UCUM mg/dL', loc: 'Units of measure', status: 'Active', open: 0 }], addUnit: 'mg/dl' }],
    meaning: [{ line: 3, name: 'Glucose, fasting', code: 'CHE-GLU', field: 'Unit', from: 'mg/dL', to: 'mmol/L', results: 12400, equivalent: false, deps: '2 panels, 1 analyzer mapping, LOINC 1558-6 (order routing)' }],
    deactOthers: 45,
    deact: [
      { id: 'cd1', name: 'Bleeding time (Ivy)', code: 'HEM-BT', type: 'Test', loc: 'Hematology', open: 0, usedBy: ['212 results', '1 panel'] },
      { id: 'cd2', name: 'ESR (Wintrobe)', code: 'HEM-ESRW', type: 'Test', loc: 'Hematology', open: 4, usedBy: ['4 open analyses', '3,102 results', '1 analyzer mapping', '1 reflex rule'], openAnalyses: 4 },
    ],
    children: [],
    rejected: [{ reason: 'the low limit is above the high limit (normal range 6.5 to 3.5).', lines: [12], col: 'lowNormal' }],
    warnings: [
      { line: 4, msg: 'Haemoglobin, normal range, Male 18+: the new range is 10 times the current one (130 to 170, was 13.0 to 17.0). Check the unit (g/L or g/dL).', check: 'Range scale' },
      { line: 9, msg: 'After this import, Glucose, fasting has no normal range for: children 1 to 17, infants under 1. Their results will not be flagged.', check: 'Range coverage' },
    ],
    ignored: [],
    guarded: { field: 'Significant digits', count: 1, text: 'Fibrinogen changes from 1 to 2 significant digits. Ranges shown on past results will use the new number of digits.' },
  },
};
const catalogUpdated = [
  { id: 'cu1', name: 'Glucose, fasting', code: 'CHE-GLU', type: 'Test', usedBy: '12,400 results, 2 panels, 1 analyzer mapping, LOINC 1558-6 (order routing)', fields: [], items: [['Range', 'Adult, both sexes, 18+', '', '3.9 to 5.5 mmol/L', 'Added'], ['Range', 'Child, 1 to 17', '70 to 100 mg/dL', '', 'Removed'], ['Range', 'Infant, under 1', '60 to 95 mg/dL', '', 'Removed'], ['Range', 'Female, 18+', '70 to 99 mg/dL', '', 'Removed'], ['Range', 'Male, 18+', '70 to 105 mg/dL', '', 'Removed']], note: 'The unit change is a question in Needs your answer. If you choose a new version, these ranges go on the new version.' },
  { id: 'cu2', name: 'Haemoglobin', code: 'HEM-HB', type: 'Test', fields: [], items: [['Range', 'Male, 18+', '13.0 to 17.0 g/dL', '130 to 170 g/L', 'Changed'], ['Range', 'Female, 18+', '12.0 to 15.0 g/dL', '120 to 150 g/L', 'Changed']], note: 'Past results keep the range they were reported with.' },
  { id: 'cu3', name: 'Platelet count', code: 'HEM-PLT', type: 'Test', fields: [['Reporting name', 'Platelets', 'Platelet count']] },
  { id: 'cu4', name: 'White cell count', code: 'HEM-WBC', type: 'Test', fields: [['Sort order', '4', '2']] },
  { id: 'cu5', name: 'Prothrombin time', code: 'HEM-PT', type: 'Test', fields: [['Sample types', 'Citrate plasma', 'Citrate plasma; Citrate whole blood']] },
  { id: 'cu6', name: 'Fibrinogen', code: 'HEM-FIB', type: 'Test', guarded: true, usedBy: '2,870 results', fields: [['Significant digits', '1', '2']] },
];

// ---------------------------------------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------------------------------------
function Shell({ page, children }) {
  const org = page === 'org';
  return <div className="ir-shell">
    <nav className="ir-nav" aria-label="Admin">
      <div className="grp">Admin</div>
      {org ? <>
        <div className="muted">Config</div>
        <div className="parent">Locations &amp; Organizations</div>
        <a href="#orgs">Organizations</a><a href="#sites">Sampling Sites</a><a href="#areas">Geographic Areas</a><a className="active" aria-current="page" href="#import">Import / Export</a>
        <div className="muted">Resources</div><div className="muted">Automation</div>
      </> : <>
        <div className="parent">Test Catalogue Management</div>
        <a href="#tests">Tests</a><a href="#panels">Panels</a><a href="#st">Sample Types</a><a href="#lu">Lab Units</a><a className="active" aria-current="page" href="#import">Import Catalog (CSV)</a>
      </>}
    </nav>
    <main className="ir-main">
      <div className="ir-crumbs">{org ? <><a href="#home">Home</a> / <a href="#admin">Admin Management</a> / <a href="#lo">Locations &amp; Organizations</a> / Import / Export</> : <><a href="#home">Home</a> / <a href="#admin">Admin Management</a> / Import Catalog (CSV)</>}</div>
      <h1 className="ir-title">{org ? 'Import / Export' : 'Import Catalog (CSV)'}</h1>
      <p className="ir-explainer">{org ? 'Load or update organizations, wards / depts, sampling sites and geographic areas from CSV files, in the same format the system uses at installation. Nothing is saved until you review the preview and apply it.' : 'Load or update the test catalog from CSV files: lab units, sample types, tests, ranges, panels, answers and more. Nothing is saved until you review the preview and apply it.'}</p>
      {children}
    </main>
  </div>;
}

function Steps({ step }) {
  const idx = ['upload', 'review', 'done'].indexOf(step);
  return <div style={{ marginBottom: '1rem' }}><ProgressIndicator currentIndex={idx} spaceEqually>
    <ProgressStep label={t('label.importReview.step.upload', 'Upload')} complete={idx > 0} />
    <ProgressStep label={t('label.importReview.step.review', 'Review')} complete={idx > 1} />
    <ProgressStep label={t('label.importReview.step.done', 'Done')} />
  </ProgressIndicator></div>;
}

function Pager({ total, shown, pageSize = 25 }) {
  return <div>
    <Pagination totalItems={total} pageSize={pageSize} pageSizes={[25, 50, 100]} page={1} size="md" />
    {shown < Math.min(pageSize, total) && <div className="ir-sub" style={{ padding: '.25rem 1rem' }}>{t('preview.only.previewRows', `Preview data: ${fmt(shown)} sample rows shown.`)}</div>}
  </div>;
}

// Toggletip pattern. Carbon's Toggletip (1.118) passes the deprecated Popover `caret` prop internally and logs a
// warning, so this mockup draws the same toggletip with Popover + PopoverContent. Use Toggletip when that is fixed.
function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false);
  return <Popover open={open} align="bottom-start" highContrast dropShadow={false} onRequestClose={() => setOpen(false)}>
    <button type="button" className="cds--toggletip-button" aria-label={label} aria-expanded={open} onClick={() => setOpen(o => !o)}><Information /></button>
    <PopoverContent><p style={{ padding: '1rem', maxWidth: 300, fontSize: 14 }}>{children}</p></PopoverContent>
  </Popover>;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return <div className="ir-toast"><ToastNotification kind="info" title={toast.title} subtitle={toast.text} timeout={4500} onClose={onClose} /></div>;
}

// ---------------------------------------------------------------------------------------------------------
// App with the preview-only scenario bar
// ---------------------------------------------------------------------------------------------------------
export default function App() {
  const [scenKey, setScenKey] = useState('update');
  return <div>
    <style>{PREVIEW_CSS}</style>
    <div className="ir-banner">Developer handoff mockup: Import Review (FRS v0.4) | Not a live application</div>
    <div className="ir-scen" role="region" aria-label="Preview scenarios (not part of the design)">
      <b>Preview scenario (not part of the design):</b>
      {Object.entries(SCENARIOS).map(([k, s]) => <button key={k} className={k === scenKey ? 'sel' : ''} onClick={() => setScenKey(k)}>{s.label}</button>)}
    </div>
    <ImportReview key={scenKey} sc={SCENARIOS[scenKey]} scenKey={scenKey} />
  </div>;
}

const SHOW_OPTIONS = [['all', 'All outcomes'], ['decision', 'Needs your answer'], ['deactivated', 'Will be deactivated'], ['updated', 'Will change'], ['new', 'New'], ['rejected', 'Rejected'], ['warning', 'Warnings'], ['ignored', 'Ignored'], ['unchanged', 'Unchanged']];

function ImportReview({ sc, scenKey }) {
  const isCatalog = sc.page === 'catalog';
  const [step, setStep] = useState('upload');
  const [mode, setMode] = useState(sc.mode);
  const [running, setRunning] = useState(null);
  const [answers, setAnswers] = useState({});
  const [groupAns, setGroupAns] = useState({});
  const [deactAns, setDeactAns] = useState({});
  const [keepAll, setKeepAll] = useState(false);
  const [reviewedDeact, setReviewedDeact] = useState(false);
  const [guardTick, setGuardTick] = useState(false);
  const [warnAck, setWarnAck] = useState({});
  const [capChoice, setCapChoice] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [replaceTick, setReplaceTick] = useState(false);
  const [showSection, setShowSection] = useState('all');
  const [openSecs, setOpenSecs] = useState({});
  const [sampleCheck, setSampleCheck] = useState(null);
  const [conn, setConn] = useState('ok');
  const [savedState, setSavedState] = useState('saved');
  const [changedDuringApply, setChangedDuringApply] = useState(false);
  const [result, setResult] = useState(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [undoKeep, setUndoKeep] = useState('keep');
  const [undoDone, setUndoDone] = useState(null);
  const [expanded, setExpanded] = useState({ u3: true, cu1: true, fr1: true });
  const [quarterAns, setQuarterAns] = useState(null);
  const [live, setLive] = useState('');
  const [changedRows, setChangedRows] = useState([]);
  const [discardAsk, setDiscardAsk] = useState(false);
  const [discarded, setDiscarded] = useState(false);
  const [toast, setToast] = useState(null);
  const [exportArea, setExportArea] = useState('organizations');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => { const tm = setTimeout(fn, ms); timers.current.push(tm); };
  const touch = () => { setSavedState('saving'); later(() => setSavedState('saved'), 600); };
  const showToast = (title, text) => setToast({ title, text, id: Date.now() });

  // ----- decision rows and the one count model (FR-B2, FR-C11) -----
  const decisionRows = useMemo(() => {
    const rows = [];
    sc.meaning.forEach(r => rows.push({ key: 'g' + r.line, group: 'meaning', r }));
    sc.renames.forEach(r => rows.push({ key: 'r' + r.line, group: 'rename', r }));
    sc.matches.forEach(r => rows.push({ key: 'm' + r.line, group: 'match', r }));
    if (mode === 'replace') sc.children.forEach(r => rows.push({ key: 'c' + r.name, group: 'children', r }));
    changedRows.forEach(r => rows.push({ key: 'x' + r.line, group: 'changed', r }));
    return rows;
  }, [sc, changedRows, mode]);
  const effective = row => answers[row.key] || groupAns[row.group] || null;
  const deactEff = d => deactAns[d.id] || (keepAll ? 'keep' : (d.openAnalyses ? 'notOrderable' : 'deactivate'));
  const isReplace = mode === 'replace';
  const isCompare = mode === 'compare';

  const counts = (() => {
    const b = sc.base;
    let facilities = b.facilities || 0, wards = b.wards || 0, tests = b.tests || 0, ranges = b.ranges || 0;
    let updated = b.updated, deactivated = 0, deactWards = 0, unchanged = b.unchanged, decision = 0, notOrd = 0;
    decisionRows.forEach(row => {
      const a = effective(row);
      if (!a) { decision++; return; }
      if (row.group === 'meaning' && a === 'newVersion') { tests++; notOrd++; }
      if (row.group === 'rename') { if (a === 'renamed') updated++; else facilities++; }
      if (row.group === 'match') { if (a.startsWith('use')) updated++; else if (a === 'new' && !isCatalog) facilities++; }
      if (row.group === 'children') { if (a === 'with') { deactivated++; deactWards += row.r.count; } else if (a === 'only') deactivated++; }
      if (row.group === 'changed') { if (a === 'file') updated++; else unchanged++; }
    });
    if (sc.cap) { const g = groupAns.capgroup; if (capChoice === 'new' || (capChoice === 'show' && g === 'new')) facilities += sc.cap; else if (capChoice === 'show' && g === 'renamed') updated += sc.cap; else decision += sc.cap; }
    if (isReplace) {
      sc.deact.forEach(d => { const e = deactEff(d); if (e === 'deactivate') { if (d.type === 'Ward / dept') deactWards++; else deactivated++; } else if (e === 'notOrderable') notOrd++; });
      if (!keepAll) deactivated += sc.deactOthers || 0;
    }
    return { facilities, wards, tests, ranges, updated, deactivated, deactWards, reactivated: b.reactivated, unchanged, decision, rejected: b.rejected, warnings: sc.warnings.length, ignored: b.ignored, notOrd, rangesRemoved: b.rangesRemoved || 0 };
  })();
  const adds = counts.facilities + counts.wards + counts.tests + counts.ranges;
  const deTotal = counts.deactivated + counts.deactWards;
  const changes = adds + counts.updated + deTotal + counts.reactivated + counts.notOrd;
  const deactScope = isReplace ? sc.deact.length + (sc.deactOthers || 0) : 0;

  // Summary clauses come from the area (FR-L4): admin.locations.import.summary.* or catalog.import.summary.*
  const summaryText = past => {
    const parts = [];
    const a = [];
    if (isCatalog) { if (counts.tests) a.push(plural(counts.tests, 'test', 'tests')); if (counts.ranges) a.push(plural(counts.ranges, 'range', 'ranges')); }
    else { if (counts.facilities) a.push(plural(counts.facilities, 'facility', 'facilities')); if (counts.wards) a.push(plural(counts.wards, 'ward / dept', 'wards / depts')); }
    if (a.length) parts.push((past ? 'added ' : 'adds ') + a.join(' and '));
    if (counts.updated) parts.push((past ? 'updated ' : 'updates ') + fmt(counts.updated));
    if (counts.reactivated) parts.push((past ? 'reactivated ' : 'reactivates ') + fmt(counts.reactivated));
    if (deTotal) parts.push((past ? 'deactivated ' : 'deactivates ') + (isCatalog ? plural(deTotal, 'test', 'tests') : [counts.deactivated ? plural(counts.deactivated, 'facility', 'facilities') : null, counts.deactWards ? plural(counts.deactWards, 'ward / dept', 'wards / depts') : null].filter(Boolean).join(' and ')));
    if (isCatalog && counts.notOrd) parts.push((past ? 'made ' : 'makes ') + plural(counts.notOrd, 'test', 'tests') + ' not orderable');
    if (isCatalog && counts.rangesRemoved) parts.push((past ? 'removed ' : 'removes ') + plural(counts.rangesRemoved, 'range', 'ranges'));
    if (!past && counts.unchanged) parts.push('leaves ' + fmt(counts.unchanged) + ' unchanged');
    if (!parts.length) return past ? 'Nothing was changed.' : 'This file changes nothing.';
    const list = joinList(parts);
    return past ? list.charAt(0).toUpperCase() + list.slice(1) + '.' : 'This file ' + list + '.';
  };

  const setAnswer = (k, v) => { setAnswers(x => ({ ...x, [k]: v })); touch(); const left = decisionRows.filter(r => r.key !== k && !effective(r)).length; setLive(`${decisionRows.length - left} answered, ${left} not answered yet`); };
  const setGroup = (g, v) => { setGroupAns(x => ({ ...x, [g]: v })); touch(); setLive('Group answered'); };
  const clearGroup = g => { setGroupAns(x => { const n = { ...x }; delete n[g]; return n; }); touch(); setLive('Group answers cleared'); };

  const simulate = (kind, after) => {
    setRunning({ kind, pct: 0 });
    let p = 0;
    const tick = () => { p += 20; setRunning(r => r && { ...r, pct: p }); if (p < 100) later(tick, 300); else { setRunning(null); after(); } };
    later(tick, 200);
  };
  const startPreview = () => simulate('preview', () => {
    setOpenSecs({ decision: true, deactivated: false, updated: !!sc.guarded, new: false, problems: sc.warnings.length > 0, unchanged: false, onlyHere: true });
    setStep('review');
  });
  const startApply = () => {
    setConfirm(false);
    simulate('apply', () => {
      const moved = changedDuringApply ? [{ line: 509, name: 'Tokarara Clinic', field: 'Phone', file: '+675 325 9911', atPreview: '+675 325 9900', now: '+675 325 9955', who: 'Joseph Kila, 15:42' }] : [];
      setChangedRows(moved);
      setResult({ text: summaryText(true), waiting: counts.decision, moved: moved.length, deact: deTotal, notOrd: counts.notOrd });
      setStep('done');
    });
  };

  // ----- "Before you apply" list (critique Z-3, Z-5) -----
  const groupTitle = { meaning: 'Changes what past results mean', rename: 'Possible renames', match: isCatalog ? 'Possible matches' : 'Several possible matches', children: 'Has active wards / depts not in this file', changed: 'Changed since preview' };
  const warnGroups = useMemo(() => { const m = {}; sc.warnings.forEach(w => { (m[w.check] = m[w.check] || []).push(w); }); return Object.entries(m); }, [sc]);
  const todo = [];
  Object.keys(groupTitle).forEach(g => {
    const rows = decisionRows.filter(r => r.group === g);
    if (!rows.length) return;
    const left = rows.filter(r => !effective(r)).length;
    todo.push({ id: 'todo-' + g, label: groupTitle[g], progress: left ? `${fmt(left)} not answered yet` : `${fmt(rows.length)} answered`, done: !left, blocking: false, section: 'decision', target: 'grp-' + g, action: 'Answer' });
  });
  if (sc.cap) {
    const capDone = capChoice === 'new' || capChoice === 'wait' || (capChoice === 'show' && !!groupAns.capgroup);
    todo.push({ id: 'todo-cap', label: `${fmt(sc.cap)} rows without a code`, progress: capChoice === 'wait' ? `${fmt(sc.cap)} left to wait` : capDone ? `${fmt(sc.cap)} answered` : `${fmt(sc.cap)} not answered yet`, done: capDone, blocking: false, section: 'decision', target: 'grp-cap', action: 'Answer' });
  }
  if (isReplace && deactScope > 0) todo.push({ id: 'todo-deact', label: 'Will be deactivated', progress: reviewedDeact ? 'Checked' : `${plural(deactScope, 'record', 'records')} to check`, done: reviewedDeact, blocking: true, section: 'deactivated', target: 'deact-table', action: 'Check' });
  if (sc.guarded) todo.push({ id: 'todo-guard', label: `${sc.guarded.field} changes`, progress: guardTick ? `${fmt(sc.guarded.count)} checked` : `${fmt(sc.guarded.count)} to check`, done: guardTick, blocking: true, section: 'updated', target: 'guard-tick', action: 'Check' });
  warnGroups.forEach(([check, ws], i) => todo.push({ id: 'todo-w' + i, label: `Warnings: ${check}`, progress: warnAck[check] ? `${fmt(ws.length)} checked` : `${fmt(ws.length)} to check`, done: !!warnAck[check], blocking: true, section: 'problems', target: 'warn-' + i, action: 'Check' }));
  const blockingLeft = todo.filter(x => x.blocking && !x.done).length;

  const isOpen = k => showSection !== 'all' ? true : !!openSecs[k];
  const setOpen = (k, v) => { setOpenSecs(o => ({ ...o, [k]: v })); if (k === 'deactivated' && v) { setReviewedDeact(true); touch(); } };
  const goTo = item => {
    setShowSection('all');
    setOpen(item.section, true);
    later(() => { const el = document.getElementById(item.target); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } }, 80);
  };
  const goPanel = () => { const el = document.getElementById('todo'); if (el) { el.scrollIntoView({ block: 'start' }); el.focus(); } };
  const nextUnanswered = () => { const el = document.querySelector('[data-unanswered="true"]'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } };

  // ======================================= UPLOAD =======================================
  if (step === 'upload') return <Shell page={sc.page}>
    <Steps step="upload" />
    <Toast toast={toast} onClose={() => setToast(null)} />
    {!isCatalog && <Callout kind="warning" lowContrast titleId="waiting-title" title="3 rows are not answered yet." subtitle="From the import of organizations-png-2026-09.csv on 14 October 2026." actionButtonLabel="Answer them" style={{ maxWidth: 'none', marginBottom: '.5rem' }} />}
    {!isCatalog && <InlineNotification kind="info" lowContrast hideCloseButton title={t('message.importReview.otherRun', "Open: Joseph Kila's preview of facilities-highlands.csv, 14:02.")} subtitle="Two imports of the same records can overlap; check with Joseph before applying." style={{ maxWidth: 'none', marginBottom: '.5rem' }} />}
    {discarded && <InlineNotification kind="info" lowContrast hideCloseButton title="Preview discarded." subtitle="Nothing was applied. It stays in Recent imports as Discarded." style={{ maxWidth: 'none', marginBottom: '.5rem' }} />}
    <div className="ir-panel">
      <h3>1. {t('label.importReview.files', 'Files')}</h3>
      <FileUploaderDropContainer labelText={t('help.importReview.drop', 'Drop CSV files here, or browse')} accept={['.csv', 'text/csv']} multiple />
      {sc.files.map(f => <div key={f.name} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e0e0e0', padding: '.75rem 0', fontSize: 14, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 600, minWidth: 220 }}>{f.name}<div className="ir-sub">{f.size}</div></div>
        <div style={{ flex: 1, minWidth: 260 }}>{fmt(f.rows)} rows, {f.sep}, {f.enc}, read as <b>{f.area}</b> <button className="ir-link">change</button>
          {sc.fileWarn && <div className="ir-sub" style={{ color: '#8e6a00', marginTop: '.25rem' }}>{sc.fileWarn}</div>}</div>
        <button className="ir-link">Remove</button>
      </div>)}
    </div>
    <div className="ir-panel ir-modes">
      <TileGroup legend={`2. ${t('label.importReview.mode', 'Import mode')}`} name="import-mode" valueSelected={mode} onChange={v => setMode(v)}>
        <RadioTile id="mode-merge" value="merge"><b>{t('label.importReview.mode.merge', 'Add & update')}</b><p className="ir-meta">{t('help.importReview.mode.merge', 'Add new records and update matching ones. Nothing else changes.')}</p></RadioTile>
        <RadioTile id="mode-replace" value="replace"><b>{t('label.importReview.mode.replace', 'Replace')}</b><p className="ir-meta">{t('help.importReview.mode.replace', 'Also deactivate records that this file covers but does not list. Values are not overwritten by this choice, and nothing is deleted.')}</p></RadioTile>
        <RadioTile id="mode-compare" value="compare"><b>{t('label.importReview.mode.compare', 'Compare only')}</b><p className="ir-meta">{t('help.importReview.mode.compare', 'Show the differences between this file and this server. Nothing can be applied.')}</p></RadioTile>
      </TileGroup>
      {mode === 'replace' && <div className="ir-scope"><b>{t('label.locations.import.forThisFile', 'For this file')}: </b>{sc.scope}</div>}
      {mode === 'compare' && <div className="ir-scope">The review will show what the file has that this server lacks, what differs, and what this server has that the file lacks. Nothing can be applied from a comparison; you can turn it into an import afterwards.</div>}
    </div>
    {running ? <div className="ir-panel" aria-live="polite">
      <ProgressBar label={`Checking ${fmt(Math.round(sc.files.reduce((x, f) => x + f.rows, 0) * running.pct / 100))} of ${fmt(sc.files.reduce((x, f) => x + f.rows, 0))} rows.`} helperText="You can leave this page; we will tell you when the preview is ready." value={running.pct} />
      <Button kind="ghost" size="sm" onClick={() => { timers.current.forEach(clearTimeout); setRunning(null); }}>{t('button.importReview.stop', 'Stop')}</Button>
    </div> : <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}><Button onClick={() => { setDiscarded(false); startPreview(); }}>{t('button.importReview.preview', 'Preview')}</Button><span className="ir-sub">{t('message.importReview.nothingSaved', 'Nothing is saved yet.')}</span></div>}
    {!isCatalog && <div className="ir-panel" style={{ marginTop: '1.5rem' }}>
      <h3>{t('label.importReview.export.title', 'Export')}</h3>
      <div className="ir-filter">
        <Select id="export-area" labelText={t('label.importReview.export.area', 'What to export')} value={exportArea} onChange={e => setExportArea(e.target.value)} style={{ minWidth: 260 }}>
          <SelectItem value="organizations" text={t('label.locations.import.area.organizations', 'Facilities, wards & sites')} />
          <SelectItem value="sites" text="Sampling sites" />
          <SelectItem value="areas" text={t('label.locations.import.area.values', 'Geographic areas')} />
        </Select>
        <Button kind="tertiary" onClick={() => showToast(t('message.importReview.export.started', 'Export started'), 'The CSV will download when it is ready.')}>{t('button.importReview.export.download', 'Download CSV')}</Button>
      </div>
      <p className="ir-meta" style={{ margin: 0 }}>{t('admin.locations.export.help', 'The file starts with a line that records the filters used. If you import it back with Replace, only those records can be deactivated. Filter a list first (Organizations, Sampling Sites) to export part of it.')}</p>
    </div>}
    <RecentImports isCatalog={isCatalog} discarded={discarded} />
  </Shell>;

  // ======================================= DONE =======================================
  if (step === 'done') return <Shell page={sc.page}>
    <Steps step="done" />
    {undoDone ? <InlineNotification kind="success" lowContrast hideCloseButton title={undoDone} subtitle="" style={{ maxWidth: 'none' }} /> : <>
      <InlineNotification kind="success" lowContrast hideCloseButton title={t('message.importReview.complete', 'Import applied.')} subtitle={`${result.text}${result.waiting ? ` ${plural(result.waiting, 'row was', 'rows were')} not answered and ${result.waiting === 1 ? 'is' : 'are'} waiting.` : ''}`} style={{ maxWidth: 'none' }} />
      {result.moved > 0 && <InlineNotification kind="warning" lowContrast hideCloseButton title="1 row was not applied because its record changed after the preview." subtitle="Tokarara Clinic's phone was changed by Joseph Kila at 15:42. Choose which value to keep in Changed since preview." style={{ maxWidth: 'none' }} />}
      <div className="ir-panel" style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        {(result.waiting > 0 || result.moved > 0) && <Button onClick={() => { setStep('review'); setShowSection('all'); setOpen('decision', true); }}>{t('button.importReview.answerWaiting', 'Answer the waiting rows')}</Button>}
        <Button kind="tertiary" size="sm">{t('button.importReview.report', 'Download result report')}</Button>
        <Button kind="tertiary" size="sm" onClick={() => setUndoOpen(true)}>{t('button.importReview.undo', 'Undo this import')}</Button>
        <Button kind="ghost" size="sm">{t('button.importReview.history', 'View history')}</Button>
      </div>
    </>}
    <RecentImports isCatalog={isCatalog} justApplied={!undoDone} undone={!!undoDone} />
    <ComposedModal open={undoOpen} onClose={() => setUndoOpen(false)} danger size="md">
      <ModalHeader label="Undo" title={`Undo the import of ${sc.files[0].name}?`} />
      <ModalBody>
        <h4>Will be deactivated ({isCatalog ? 1 : 18})</h4>
        <p className="ir-sub">Records this import created. Records now in use are listed first.</p>
        {!isCatalog && <RadioButtonGroup legendText="Kwikila District Hospital: in use, 2 open orders since the import" name="undo-kwikila" valueSelected={undoKeep} onChange={v => setUndoKeep(v)}>
          <RadioButton id="undo-keep" value="keep" labelText={t('label.importReview.undo.keep', 'Keep')} />
          <RadioButton id="undo-deact" value="deactivate" labelText={t('label.importReview.undo.deactivateAnyway', 'Deactivate anyway')} />
        </RadioButtonGroup>}
        <h4 style={{ marginTop: '1rem' }}>{t('label.importReview.undo.section.restore', 'Will be restored')} ({isCatalog ? 6 : 31})</h4>
        <p className="ir-meta">{isCatalog ? 'Fibrinogen: significant digits 2 back to 1. Haemoglobin: ranges back to 13.0 to 17.0 g/dL.' : 'Gerehu General Hospital: reporting code NCD-0201 back to NCD-HC-01. Port Moresby General Hospital: phone was changed later by Joseph Kila; the later value is kept.'}</p>
        <h4>{t('label.importReview.undo.section.reactivate', 'Will be reactivated')} ({fmt(result ? result.deact : 0)})</h4>
        <InlineNotification kind="warning" lowContrast hideCloseButton title={t('label.importReview.outside.title', 'Undo cannot take these back')} subtitle={(isCatalog ? 'Systems that already copied this catalog (an OpenMRS concept sync, an exported file, a FHIR export) keep the old values until they read them again. ' : 'Other systems that already copied these organizations (from a FHIR export or their own sync) keep the old values until they read them again. ') + t('message.importReview.outside.reports', 'Reports already issued keep the values they were issued with.')} />
      </ModalBody>
      <ModalFooter danger primaryButtonText={t('button.importReview.undo.confirm', 'Undo import')} secondaryButtonText="Cancel" onRequestClose={() => setUndoOpen(false)}
        onRequestSubmit={() => { setUndoOpen(false); setUndoDone(!isCatalog && undoKeep === 'keep' ? 'Undone, except 1 record kept because it is in use.' : 'Undone.'); }} />
    </ComposedModal>
  </Shell>;

  // ======================================= REVIEW =======================================
  const showAll = showSection === 'all';
  const visible = k => showAll || showSection === k || (k === 'problems' && ['rejected', 'warning', 'ignored'].includes(showSection));
  const updBase = isCatalog ? catalogUpdated : sc.updatedOverride ? sc.updatedOverride
    : scenKey === 'update' ? updatedRows : scenKey === 'replace' ? updatedRows.filter(u => ['u1', 'u2', 'u10'].includes(u.id)) : [];
  const updList = updBase.concat(!isCatalog && sc.base.reactivated ? reactivatedRows : []);
  const newList = isCatalog ? [{ id: 'cn1', name: 'D-dimer', code: 'HEM-DDI', type: 'Test', loc: 'Hematology', f: 8 }] : sc.newOverride ? sc.newOverride
    : scenKey === 'update' ? newRows : scenKey === 'replace' ? newRows.slice(2, 3) : scenKey === 'empty' ? newRows.slice(0, 8) : [];
  const changeCount = counts.updated + counts.reactivated;
  const changeHeader = `${plural(changeCount, 'record', 'records')}: ${[counts.updated ? `${fmt(counts.updated)} updated` : null, counts.reactivated ? `${fmt(counts.reactivated)} reactivated` : null].filter(Boolean).join(', ')}`;
  const deactHeader = (() => {
    if (!isReplace) return '';
    const de = sc.deact.filter(d => deactEff(d) === 'deactivate').length + (keepAll ? 0 : (sc.deactOthers || 0));
    const no = sc.deact.filter(d => deactEff(d) === 'notOrderable').length;
    const kept = deactScope - de - no;
    return `${plural(deactScope, 'record', 'records')}: ${[de ? `${fmt(de)} deactivated` : null, no ? `${fmt(no)} made not orderable` : null, kept ? `${fmt(kept)} kept active` : null].filter(Boolean).join(', ')}`;
  })();
  const probCount = sc.rejected.length + sc.warnings.length + sc.ignored.length;
  const probHeader = [counts.rejected ? `${fmt(counts.rejected)} rejected` : null, counts.warnings ? plural(counts.warnings, 'warning', 'warnings') : null, counts.ignored ? `${fmt(counts.ignored)} ignored` : null].filter(Boolean).join(', ');
  const showCounts = { decision: counts.decision, deactivated: deactScope, updated: changeCount, new: adds, rejected: counts.rejected, warning: counts.warnings, ignored: counts.ignored, unchanged: counts.unchanged };
  const hasDecisions = (decisionRows.length > 0 || !!sc.cap) && !isCompare;
  const title = (label, count) => <span>{label}<span className="ir-cnt">· {count}</span></span>;
  const inUseDeact = sc.deact.filter(d => deactEff(d) === 'deactivate' && d.open > 0);

  return <Shell page={sc.page}>
    <Steps step="review" />
    <div className="ir-live" aria-live="polite">{live}</div>
    <Toast toast={toast} onClose={() => setToast(null)} />
    {conn === 'lost' && <InlineNotification kind="warning" lowContrast hideCloseButton title="Connection lost." subtitle="Your import is still running on the server. This page will reconnect." style={{ maxWidth: 'none' }} />}
    {sc.dominant && <div style={{ marginBottom: '1rem' }}><InlineNotification kind="error" lowContrast hideCloseButton title={`${fmt(sc.dominant.count)} of ${fmt(sc.dominant.total)} rows:`} subtitle={sc.dominant.text} style={{ maxWidth: 'none', marginBottom: 0 }} />
      <Button kind="ghost" size="sm" onClick={() => setShowSection('rejected')}>See the problem</Button></div>}

    <div className="ir-panel">
      <p className="ir-summary">{isCompare ? `Compared with this server: the file has ${adds} records this server lacks, ${counts.updated} records differ, and this server has 27 records the file lacks.` : summaryText(false)}
        {!isCompare && counts.decision > 0 && <> <b>{plural(counts.decision, 'needs your answer before it can be applied.', 'need your answer before they can be applied.')}</b></>}</p>
      <div className="ir-sub">{sc.files.map(f => f.name).join(', ')} · {mode === 'merge' ? 'Add & update' : mode === 'replace' ? 'Replace' : 'Compare only'} · <b>{t('message.importReview.nothingSaved', 'Nothing is saved yet.')}</b></div>

      {!isCompare && todo.length > 0 && <div className="ir-todo" id="todo" tabIndex={-1} role="region" aria-labelledby="todo-h">
        <div className="ir-todo-hd"><h4 id="todo-h">{t('label.importReview.todo.title', 'Before you apply')}</h4><span className="ir-meta">{todo.filter(x => x.done).length} of {todo.length} done</span><span style={{ flex: 1 }} />
          <Button kind="ghost" size="sm" onClick={nextUnanswered} disabled={!counts.decision}>{t('button.importReview.nextUnanswered', 'Next unanswered')}</Button></div>
        {todo.map(item => <div className="ir-todo-row" key={item.id}>
          {item.done ? <CheckmarkFilled aria-hidden="true" style={{ fill: '#198038' }} /> : item.blocking ? <RadioIcon aria-hidden="true" style={{ fill: '#0f62fe' }} /> : <CircleDash aria-hidden="true" />}
          <span>{item.label}{!item.blocking && !item.done && <span className="ir-sub"> {t('label.importReview.todo.canWait', '(can wait)')}</span>}</span>
          <span className="ir-meta">{item.progress}</span>
          <span><button className="ir-link" onClick={() => goTo(item)} aria-label={`${item.done ? 'Show' : item.action}: ${item.label}`}>{item.done ? 'Show' : item.action}</button></span>
        </div>)}
        <div className="ir-todo-foot">{t('message.importReview.todo.foot', 'Questions you leave unanswered do not stop Apply. Those rows wait, and you can answer them later from Recent imports.')}</div>
      </div>}
    </div>

    {isReplace && sc.underQuarter && quarterAns !== 'continue' && <Callout kind="warning" lowContrast titleId="quarter-title" style={{ maxWidth: 'none', marginBottom: '1rem' }}
      title={`This file lists ${sc.underQuarter.listed} of the ${sc.underQuarter.total} records in its scope.`}
      subtitle={`Replace would take the other ${sc.underQuarter.others} out of use (tests with open analyses are made not orderable instead of deactivated). Did you mean Add & update?`}
      actionButtonLabel={t('button.importReview.switchMerge', 'Switch to Add & update')} onActionButtonClick={() => setMode('merge')}>
      <Button kind="ghost" size="sm" aria-describedby="quarter-title" onClick={() => setQuarterAns('continue')}>{t('button.importReview.continueReplace', 'Continue with Replace')}</Button>
    </Callout>}

    <div className="ir-filter">
      <Select id="show-sel" labelText={t('label.importReview.show', 'Show')} value={showSection} onChange={e => setShowSection(e.target.value)} style={{ minWidth: 260 }}>
        {SHOW_OPTIONS.filter(([k]) => k === 'all' || showCounts[k] > 0).map(([k, l]) => <SelectItem key={k} value={k} text={k === 'all' ? l : `${l} (${fmt(showCounts[k])})`} />)}
      </Select>
    </div>

    <Accordion align="start" size="lg" className="ir-acc">
      {/* ---------------- Needs your answer ---------------- */}
      {visible('decision') && hasDecisions && <AccordionItem title={title(t('label.importReview.section.needsAnswer', 'Needs your answer'), counts.decision ? `${fmt(counts.decision)} not answered yet` : 'all answered')} open={isOpen('decision')} onHeadingClick={({ isOpen: o }) => setOpen('decision', o)}>
        {sc.cap && <div className="ir-grp" id="grp-cap" tabIndex={-1}>
          <div className="ir-grp-hd"><h4>{fmt(sc.cap)} rows look like places you already have but carry no code</h4></div>
          <div style={{ padding: '.75rem .875rem', fontSize: 14 }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <span style={{ flex: 1, minWidth: 280 }}>{t('admin.locations.import.tooMany.help', 'If this file lists new places, treat them all as new. If they are the same places, add the code column and upload again: Export with codes gives you this file\'s rows with the matching codes filled in.')}</span>
              <Button kind="tertiary" size="sm" onClick={() => showToast(t('message.importReview.exportCodes.started', 'Export with codes started'), `facilities-from-dhis2-with-codes.csv: your ${fmt(sc.cap)} rows in your file's columns, plus the code of the record each one looks like. It will download when it is ready.`)}>{t('button.importReview.exportCodes', 'Export with codes')}</Button>
            </div>
            <div style={{ marginTop: '.75rem' }}>
              <RadioButtonGroup legendText={`${fmt(sc.cap)} rows without a code`} name="cap" orientation="vertical" valueSelected={capChoice} onChange={v => { setCapChoice(v); touch(); }}>
                <RadioButton id="cap-new" value="new" labelText={`Treat all ${fmt(sc.cap)} as new`} />
                <RadioButton id="cap-wait" value="wait" labelText="Leave them waiting (the rest can apply)" />
                <RadioButton id="cap-show" value="show" labelText={t('button.importReview.showAnyway', 'Show them anyway')} />
              </RadioButtonGroup>
            </div>
            {capChoice === 'show' && <div style={{ marginTop: '.75rem' }}><DecisionGroup id="grp-capgroup" title="Possible renames" help="These rows look like places you already have under another name." group="capgroup"
              rows={renames.map(r => ({ key: 'cap' + r.line, group: 'capgroup', r }))} total={sc.cap} effective={row => answers[row.key] || groupAns.capgroup || null} groupAns={groupAns} setGroup={setGroup} clearGroup={clearGroup} setSampleCheck={setSampleCheck}
              groupAnswers={[['new', 'All new places'], ['renamed', 'All the same place, renamed']]} kind="rename" setAnswer={setAnswer} /></div>}
          </div>
        </div>}
        {sc.meaning.length > 0 && <DecisionGroup id="grp-meaning" title={t('catalog.import.meaning.group', 'Changes what past results mean')} danger
          help="Glucose, fasting has 12,400 results. Changing its unit would show them in the new unit. A new version keeps past results as they were."
          group="meaning" rows={decisionRows.filter(r => r.group === 'meaning')} effective={effective} groupAns={groupAns} setGroup={setGroup} clearGroup={clearGroup} groupAnswers={[]} kind="meaning" setAnswer={setAnswer} />}
        {sc.renames.length > 0 && <DecisionGroup id="grp-rename" title={t('label.locations.import.rename.title', 'Possible renames')} help="These rows look like places you already have under another name. Common words (Health, Centre, Clinic, Hospital...) are ignored when matching."
          group="rename" rows={decisionRows.filter(r => r.group === 'rename')} total={sc.renames.length} effective={effective} groupAns={groupAns} setGroup={setGroup} clearGroup={clearGroup} setSampleCheck={setSampleCheck}
          groupAnswers={[['new', t('admin.locations.import.group.allNew', 'All new places')], ['renamed', t('admin.locations.import.group.allRenamed', 'All the same place, renamed')]]} kind="rename" setAnswer={setAnswer} />}
        {sc.matches.length > 0 && <DecisionGroup id="grp-match" title={isCatalog ? 'Possible matches' : t('label.importReview.group.match', 'Several possible matches')} help={isCatalog ? 'These values were not found exactly. Pick the one you meant, or add it.' : 'Each of these rows matches more than one existing record, or matches by name a record that has a different code.'}
          group="match" rows={decisionRows.filter(r => r.group === 'match')} effective={effective} groupAns={groupAns} setGroup={setGroup} clearGroup={clearGroup}
          groupAnswers={isCatalog ? [] : [['new', t('button.importReview.group.createAll', 'Create all as new')], ['skip', t('button.importReview.group.skipAll', 'Skip all')]]} kind="match" isCatalog={isCatalog} setAnswer={setAnswer} />}
        {isReplace && sc.children.length > 0 && <DecisionGroup id="grp-children" title={t('admin.locations.import.group.children', 'Has active wards / depts not in this file')} help="Replace would deactivate these facilities, but some of their wards / depts are outside this file's scope."
          group="children" rows={decisionRows.filter(r => r.group === 'children')} effective={effective} groupAns={groupAns} setGroup={setGroup} clearGroup={clearGroup}
          groupAnswers={[['keep', t('button.importReview.group.keepAllActive', 'Keep all active')]]} kind="children" setAnswer={setAnswer} />}
        {changedRows.length > 0 && <DecisionGroup id="grp-changed" title={t('label.importReview.group.changed', 'Changed since preview')} help={t('help.importReview.group.changed', 'Someone changed these records after this preview. Choose which value to keep.')}
          group="changed" rows={decisionRows.filter(r => r.group === 'changed')} effective={effective} groupAns={groupAns} setGroup={setGroup} clearGroup={clearGroup}
          groupAnswers={[['file', t('button.importReview.group.useFileAll', 'Use the file for all')], ['current', t('button.importReview.group.keepCurrentAll', 'Keep current for all')]]} kind="changed" setAnswer={setAnswer} />}
      </AccordionItem>}

      {/* ---------------- Will be deactivated ---------------- */}
      {visible('deactivated') && isReplace && deactScope > 0 && <AccordionItem title={title(t('label.importReview.section.willDeactivate', 'Will be deactivated'), deactHeader)} open={isOpen('deactivated')} onHeadingClick={({ isOpen: o }) => setOpen('deactivated', o)}>
        <div className="ir-scope" style={{ marginTop: 0, marginBottom: '.75rem' }}>{sc.scope}</div>
        <div className="ir-grp-answers" style={{ border: '1px solid #e0e0e0', marginBottom: '.5rem' }}>
          <div className="ir-ga"><Button kind="tertiary" size="sm" renderIcon={keepAll ? CheckmarkFilled : undefined} onClick={() => { setKeepAll(true); setDeactAns({}); touch(); }}>{t('button.importReview.group.keepAllActive', 'Keep all active')}</Button><span className="ir-sub">Answers all {fmt(deactScope)} records</span></div>
          {keepAll && <button className="ir-link" style={{ fontSize: 13, alignSelf: 'center' }} onClick={() => { setKeepAll(false); touch(); }}>Clear this answer</button>}
        </div>
        <TableContainer><Table size="md" id="deact-table" tabIndex={-1} className="ir-dec">
          <TableHead><TableRow>{['Name', 'Code', 'Type', 'Location or parent', isCatalog ? 'Open analyses' : 'Open orders', 'Used by', 'Answer'].map(h => <TableHeader key={h}>{h}</TableHeader>)}</TableRow></TableHead>
          <TableBody>{[...sc.deact].sort((a, b) => (b.open > 0) - (a.open > 0)).map(d => {
            const opts = d.openAnalyses ? [['notOrderable', 'Make not orderable'], ['keep', 'Keep active']] : [['deactivate', 'Deactivate'], ['keep', 'Keep active']];
            return <TableRow key={d.id}>
              <TableCell><b>{d.name}</b>{d.open > 0 && <div><Tag type="red" size="sm">{t('label.importReview.inUse', 'In use')}</Tag></div>}</TableCell>
              <TableCell>{d.code || 'none'}</TableCell><TableCell>{d.type}</TableCell><TableCell>{d.loc}</TableCell><TableCell>{fmt(d.open)}</TableCell>
              <TableCell className="ir-meta">{d.usedBy.length ? d.usedBy.join(', ') : 'Nothing'}</TableCell>
              <TableCell><RadioButtonGroup legendText={<span className="cds--visually-hidden">{d.name}</span>} name={'de-' + d.id} orientation="vertical" valueSelected={deactEff(d)} onChange={v => { setDeactAns(x => ({ ...x, [d.id]: v })); touch(); }}
                helperText={d.openAnalyses ? `It has ${d.openAnalyses} open analyses, so it cannot be deactivated now. Not orderable: it leaves order entry; open analyses can still be completed and released.` : undefined}>
                {opts.map(([k, l]) => <RadioButton key={k} id={`de-${d.id}-${k}`} value={k} labelText={l} />)}
              </RadioButtonGroup></TableCell>
            </TableRow>; })}</TableBody>
        </Table></TableContainer>
        {sc.deactOthers > 0 && <Pager total={deactScope} shown={sc.deact.length} />}
      </AccordionItem>}
      {visible('deactivated') && isCompare && <AccordionItem title={title(t('label.importReview.section.onlyHere', 'Only on this server'), '27 records the file does not list')} open={isOpen('onlyHere')} onHeadingClick={({ isOpen: o }) => setOpen('onlyHere', o)}>
        <Table size="md"><TableHead><TableRow>{['Name', 'Code', 'Type', 'Location'].map(h => <TableHeader key={h}>{h}</TableHeader>)}</TableRow></TableHead>
          <TableBody><TableRow><TableCell>Gordons Clinic</TableCell><TableCell>NCD-GOR</TableCell><TableCell>Referring clinic</TableCell><TableCell>Moresby North-East</TableCell></TableRow>
            <TableRow><TableCell>Six Mile Aid Post</TableCell><TableCell>NCD-SMA</TableCell><TableCell>Referring clinic</TableCell><TableCell>Moresby North-East</TableCell></TableRow></TableBody></Table>
        <Pager total={27} shown={2} />
      </AccordionItem>}

      {/* ---------------- Will change ---------------- */}
      {visible('updated') && updList.length > 0 && <AccordionItem title={title(t('label.importReview.section.willChange', 'Will change'), changeHeader)} open={isOpen('updated')} onHeadingClick={({ isOpen: o }) => setOpen('updated', o)}>
        {sc.guarded && <div className={`ir-ack ${guardTick ? 'on' : ''}`} style={{ display: 'block', marginBottom: '.75rem' }}>
          <div style={{ fontSize: 14 }}><b>{isCatalog ? 'Changes past results: ' : 'Changes reports: '}</b>{sc.guarded.text}</div>
          <Checkbox id="guard-tick" checked={guardTick} onChange={(e, { checked }) => { setGuardTick(checked); touch(); }}
            labelText={sc.guarded.count === 1 ? `I have checked the change to ${sc.guarded.field}` : `I have checked all ${fmt(sc.guarded.count)} changes to ${sc.guarded.field}`} />
        </div>}
        <TableContainer><Table size="md">
          <TableHead><TableRow><TableHeader aria-label="Expand" /><TableHeader>Name</TableHeader><TableHeader>Code</TableHeader><TableHeader>Type</TableHeader><TableHeader>{t('label.importReview.column.whatChanges', 'What changes')}</TableHeader><TableHeader>{t('label.importReview.column.outcome', 'Outcome')}</TableHeader></TableRow></TableHead>
          <TableBody>{[...updList].sort((a, b) => (!!b.guarded) - (!!a.guarded)).map(r => {
            const f = r.fields || [], it = r.items || [];
            const expandable = f.length > 1 || it.length > 0 || !!r.usedBy || !!r.info || !!r.registry;
            const what = f.length === 1 && !it.length ? <><span>{f[0][0]}: </span><span className="ir-old">{f[0][1] || 'empty'}</span> → <span className="ir-new">{r.cleared === f[0][0] ? 'cleared' : (f[0][2] || 'empty')}</span></>
              : [...f.map(x => r.cleared === x[0] ? `${x[0]} (cleared)` : x[0]), ...(it.length ? [`Ranges: ${joinList(['Added', 'Changed', 'Removed'].map(s => [s, it.filter(i => i[4] === s).length]).filter(([, n]) => n).map(([s, n]) => `${n} ${s.toLowerCase()}`))}`] : [])].join(', ');
            return <React.Fragment key={r.id}>
              <TableRow>
                <TableCell>{expandable && <Button kind="ghost" size="sm" hasIconOnly renderIcon={expanded[r.id] ? ChevronDown : ChevronRight} iconDescription={`Show changes, ${r.name}`} tooltipPosition="right" aria-expanded={!!expanded[r.id]} onClick={() => setExpanded(x => ({ ...x, [r.id]: !x[r.id] }))} />}</TableCell>
                <TableCell><b>{r.name}</b>{r.parent && <div className="ir-sub">{r.parent}</div>}
                  {r.guarded && <div><Tag type={isCatalog ? 'red' : 'magenta'} size="sm">{isCatalog ? 'Changes past results' : t('admin.locations.import.guarded.tag', 'Changes reports')}</Tag></div>}
                  {r.registry && <div style={{ display: 'flex', alignItems: 'center' }}><Tag type="cool-gray" size="sm">Registry</Tag>
                    <InfoTip label={t('admin.locations.import.registry.label', 'About registry records')}>{t('admin.locations.import.registry.help', 'From the facility registry. Name, code and location come from the registry and are not changed by this file. Active status and local settings are.')}</InfoTip></div>}
                </TableCell>
                <TableCell>{r.code}</TableCell><TableCell>{r.type}</TableCell><TableCell>{what}</TableCell>
                <TableCell><Tag type={r.reactivated ? 'teal' : 'blue'} size="sm">{r.reactivated ? t('label.importReview.outcome.reactivated', 'Reactivated') : t('label.importReview.outcome.updated', 'Updated')}</Tag></TableCell>
              </TableRow>
              {expandable && expanded[r.id] && <TableRow className="ir-after"><TableCell /><TableCell colSpan={5}>
                {r.usedBy && <div className="ir-meta" style={{ marginBottom: '.375rem' }}><b>{t('label.importReview.usedBy', 'Used by')}:</b> {r.usedBy}</div>}
                {f.length > 0 && <Table size="sm"><TableHead><TableRow><TableHeader>{t('label.importReview.column.field', 'Field')}</TableHeader><TableHeader>Now</TableHeader><TableHeader>{t('label.importReview.column.afterImport', 'After import')}</TableHeader></TableRow></TableHead><TableBody>
                  {f.map(([fl, o, n]) => <TableRow key={fl}><TableCell>{fl}</TableCell><TableCell className="ir-old">{o || 'empty'}</TableCell><TableCell className="ir-new">{r.cleared === fl ? <Tag type="warm-gray" size="sm">{t('label.importReview.outcome.cleared', 'Will be cleared')}</Tag> : (n || 'empty')}
                    {r.registry && fl === 'Phone' && <div className="ir-sub" style={{ color: '#8e6a00' }}>{t('warning.locations.import.registryOverwrite', 'Will be overwritten by the next registry sync')}</div>}</TableCell></TableRow>)}</TableBody></Table>}
                {r.info && <div className="ir-meta" style={{ marginTop: '.25rem' }}>{r.info}</div>}
                {it.length > 0 && <Table size="sm" style={{ marginTop: '.375rem' }}><TableHead><TableRow><TableHeader>Item</TableHeader><TableHeader>For</TableHeader><TableHeader>Now</TableHeader><TableHeader>{t('label.importReview.column.afterImport', 'After import')}</TableHeader><TableHeader aria-label="Change" /></TableRow></TableHead><TableBody>
                  {it.map(([k, fr, o, n, st], i) => <TableRow key={i}><TableCell>{k}</TableCell><TableCell>{fr}</TableCell><TableCell className="ir-old">{o || 'none'}</TableCell><TableCell className="ir-new">{n || 'none'}</TableCell><TableCell><Tag type={st === 'Removed' ? 'red' : st === 'Added' ? 'green' : 'blue'} size="sm">{st}</Tag></TableCell></TableRow>)}</TableBody></Table>}
                {r.note && <div className="ir-meta" style={{ marginTop: '.25rem' }}>{r.note}</div>}
              </TableCell></TableRow>}
            </React.Fragment>; })}</TableBody>
        </Table></TableContainer>
        <Pager total={changeCount} shown={updList.length} />
      </AccordionItem>}

      {/* ---------------- New ---------------- */}
      {visible('new') && adds > 0 && <AccordionItem title={title(t('label.importReview.section.new', 'New'), plural(adds, 'record', 'records'))} open={isOpen('new')} onHeadingClick={({ isOpen: o }) => setOpen('new', o)}>
        <Table size="md"><TableHead><TableRow>{['Name', 'Code', 'Type', 'Location or parent', 'Other fields set'].map(h => <TableHeader key={h}>{h}</TableHeader>)}</TableRow></TableHead>
          <TableBody>{newList.map(n => <TableRow key={n.id}><TableCell><b>{n.name}</b>{n.similar && <div className="ir-meta">Similar to {n.similar}</div>}</TableCell><TableCell>{n.code}</TableCell><TableCell>{n.type}</TableCell><TableCell>{n.loc}</TableCell><TableCell>{n.f}</TableCell></TableRow>)}</TableBody></Table>
        {isCatalog && <p className="ir-meta">Also: 3 ranges for D-dimer.{counts.tests > 1 ? ' And the new version of Glucose, fasting (mmol/L).' : ''}</p>}
        <Pager total={adds} shown={newList.length + (isCatalog ? counts.tests - 1 + counts.ranges : 0)} />
      </AccordionItem>}

      {/* ---------------- Problems ---------------- */}
      {visible('problems') && probCount > 0 && <AccordionItem title={title(t('label.importReview.section.problems', 'Problems'), probHeader)} open={isOpen('problems')} onHeadingClick={({ isOpen: o }) => setOpen('problems', o)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem', flexWrap: 'wrap', gap: '.5rem' }}>
          <span className="ir-meta">{sc.problemsSep ? `The download keeps your file's format: ${sc.problemsSep}.` : ''}</span>
          <Button kind="tertiary" size="sm">{t('button.importReview.downloadProblems', 'Download with problems')}</Button>
        </div>
        {(showAll || showSection === 'warning') && sc.warnings.length > 0 && <><h4 style={{ fontSize: 14, margin: '0 0 .5rem' }}>Warnings (will be applied; check each group)</h4>
          {warnGroups.map(([check, ws], i) => <div key={check} className="ir-grp">
            <div className="ir-grp-hd"><h4>{check}</h4><span className="ir-meta">{plural(ws.length, 'warning', 'warnings')}</span></div>
            <Table size="sm"><TableHead><TableRow><TableHeader>{t('label.importReview.column.line', 'Line')}</TableHeader><TableHeader>What to check</TableHeader></TableRow></TableHead>
              <TableBody>{ws.map((w, j) => <TableRow key={j}><TableCell>{w.line}</TableCell><TableCell>{w.msg}</TableCell></TableRow>)}</TableBody></Table>
            <div className={`ir-ack ${warnAck[check] ? 'on' : ''}`}><Checkbox id={'warn-' + i} checked={!!warnAck[check]} onChange={(e, { checked }) => { setWarnAck(x => ({ ...x, [check]: checked })); touch(); }}
              labelText={ws.length === 1 ? 'I have checked this warning' : `I have checked these ${ws.length} warnings`} /></div>
          </div>)}</>}
        {(showAll || showSection === 'rejected') && sc.rejected.length > 0 && <><h4 style={{ fontSize: 14, margin: '1rem 0 .5rem' }}>Rejected (not applied)</h4>
          <Table size="sm"><TableHead><TableRow><TableHeader>Rows</TableHeader><TableHeader>{t('label.importReview.column.message', 'What to do')}</TableHeader><TableHeader>Sample lines</TableHeader></TableRow></TableHead>
            <TableBody>{sc.rejected.map((g, i) => { const n = g.lines.length + (g.more || 0); return <TableRow key={i}><TableCell><b>{fmt(n)}</b></TableCell><TableCell>{g.col}: {g.sample ? `"${g.sample}": ` : ''}{g.reason}</TableCell>
              <TableCell className="ir-meta">{n === 1 ? 'Line' : 'Lines'} {g.lines.slice(0, 3).join(', ')}{n > 3 && <> · <button className="ir-link">Show all {fmt(n)}</button></>}</TableCell></TableRow>; })}</TableBody></Table></>}
        {(showAll || showSection === 'ignored') && sc.ignored.length > 0 && <><h4 style={{ fontSize: 14, margin: '1rem 0 .5rem' }}>Ignored</h4>{sc.ignored.map((g, i) => <div key={i} style={{ fontSize: 14 }}>{g.what}: {g.detail}. Not imported.</div>)}</>}
      </AccordionItem>}

      {/* ---------------- Unchanged ---------------- */}
      {visible('unchanged') && counts.unchanged > 0 && <AccordionItem title={title(t('label.importReview.section.unchanged', 'Unchanged'), plural(counts.unchanged, 'record', 'records'))} open={isOpen('unchanged')} onHeadingClick={({ isOpen: o }) => setOpen('unchanged', o)}>
        <p className="ir-meta">Loaded when opened, {fmt(Math.min(25, counts.unchanged))} at a time.</p>
      </AccordionItem>}
    </Accordion>

    <div className="ir-preview-only">Preview only: <Checkbox id="preview-changed" checked={changedDuringApply} onChange={(e, { checked }) => setChangedDuringApply(checked)} labelText="Another admin edits Tokarara Clinic during Apply" />
      <button className="ir-link" onClick={() => { setConn('lost'); setSavedState('unsaved'); later(() => { setConn('ok'); setSavedState('saved'); }, 2500); }}>Simulate a dropped connection</button></div>

    {/* ---------------- Apply bar ---------------- */}
    <div className="ir-bar" role="region" aria-label="Apply">
      {isCompare ? <><div className="msg">This is a comparison. Nothing can be applied from it.</div>
        <div className="btns"><Button kind="secondary" onClick={() => setStep('upload')}>{t('common.back', 'Back')}</Button><Button onClick={() => { setMode('merge'); simulate('preview', () => {}); }}>{t('button.importReview.useToUpdate', 'Use this file to update')}</Button></div></> : <>
        <div className="msg">
          <b>Apply {plural(changes, 'change', 'changes')}.</b>
          {counts.decision > 0 && <span>{counts.decision === 1 ? '1 row is not answered yet and will wait.' : `${fmt(counts.decision)} rows are not answered yet and will wait.`}</span>}
          {blockingLeft > 0 && <span className="ir-blocked">{blockingLeft === 1 ? '1 thing left before you can apply' : `${blockingLeft} things left before you can apply`} · <button className="ir-link" onClick={goPanel}>Show</button></span>}
          <span className={savedState === 'unsaved' ? 'ir-unsaved' : 'ir-saved'}>{savedState === 'unsaved' ? t('message.importReview.bar.unsaved', 'Not saved yet, reconnecting.') : savedState === 'saving' ? 'Saving...' : t('message.importReview.bar.saved', 'All answers saved.')}</span>
        </div>
        {running ? <div style={{ minWidth: 280 }} aria-live="polite"><ProgressBar label={`Applying ${running.pct}%.`} helperText="You can leave this page." value={running.pct} /></div> :
          <div className="btns">
            <Button kind="secondary" onClick={() => setStep('upload')}>{t('common.back', 'Back')}</Button>
            <Button kind={isReplace ? 'danger' : 'primary'} disabled={blockingLeft > 0 || conn === 'lost' || changes === 0} onClick={() => { setConfirm(true); setReplaceTick(false); }}>{t('button.importReview.apply', 'Apply')}</Button>
            <OverflowMenu aria-label={t('button.importReview.bar.more', 'More actions')} flipped direction="top" size="lg">
              <OverflowMenuItem isDelete itemText={t('button.importReview.discard', 'Discard this preview')} onClick={() => setDiscardAsk(true)} />
            </OverflowMenu>
          </div>}</>}
    </div>

    {/* ---------------- Confirm Apply ---------------- */}
    <ComposedModal open={confirm} onClose={() => setConfirm(false)} danger={isReplace} size="sm">
      <ModalHeader label={isReplace ? 'Replace' : 'Add & update'} title={t('label.importReview.confirm.title', 'Apply this import?')} />
      <ModalBody>
        <p>{summaryText(false)}</p>
        {counts.decision > 0 && <p>{counts.decision === 1 ? '1 row is not answered yet and will wait.' : `${fmt(counts.decision)} rows are not answered yet and will wait.`}</p>}
        {counts.rejected > 0 && <p>{plural(counts.rejected, 'rejected row is', 'rejected rows are')} left out.</p>}
        {counts.warnings > 0 && <p>{plural(counts.warnings, 'warning was', 'warnings were')} checked and will be applied.</p>}
        {isReplace && deTotal > 0 && <>
          {inUseDeact.length > 0 && <p>In use and will be deactivated: <b>{inUseDeact.map(d => `${d.name} (${d.open} open orders)`).join(', ')}</b>.</p>}
          <Checkbox id="confirm-replace" checked={replaceTick} onChange={(e, { checked }) => setReplaceTick(checked)} labelText={`I understand ${plural(deTotal, 'record will be deactivated', 'records will be deactivated')}`} /></>}
        <InlineNotification kind="warning" lowContrast hideCloseButton title={t('label.importReview.outside.title', 'Undo cannot take these back')}
          subtitle={(isCatalog ? 'Systems that already copied this catalog (an OpenMRS concept sync, an exported file, a FHIR export) keep the old values until they read them again. ' : 'Other systems that already copied these organizations (from a FHIR export or their own sync) keep the old values until they read them again. ') + 'Reports already issued keep their values.'} />
        <p className="ir-sub">{t('message.importReview.confirm.noStop', 'Apply cannot be stopped once it starts. You can undo it afterwards.')}</p>
      </ModalBody>
      <ModalFooter danger={isReplace} primaryButtonText={t('button.importReview.apply', 'Apply')} secondaryButtonText="Cancel" primaryButtonDisabled={isReplace && deTotal > 0 && !replaceTick}
        onRequestClose={() => setConfirm(false)} onRequestSubmit={startApply} />
    </ComposedModal>

    {/* ---------------- Discard ---------------- */}
    <ComposedModal open={discardAsk} onClose={() => setDiscardAsk(false)} danger size="sm">
      <ModalHeader label="Discard" title={t('label.importReview.discard.title', 'Discard this preview?')} />
      <ModalBody><p>{t('message.importReview.discard.body', 'Your answers are discarded and nothing is applied. The run stays in Recent imports as Discarded, so others no longer see it as open.')}</p></ModalBody>
      <ModalFooter danger primaryButtonText={t('button.importReview.discard.confirm', 'Discard preview')} secondaryButtonText="Cancel" onRequestClose={() => setDiscardAsk(false)}
        onRequestSubmit={() => { setDiscardAsk(false); setDiscarded(true); setAnswers({}); setGroupAns({}); setStep('upload'); }} />
    </ComposedModal>

    {/* ---------------- Group answer reaching unseen rows (FR-C3) ---------------- */}
    <ComposedModal open={!!sampleCheck} onClose={() => setSampleCheck(null)} size="md">
      <ModalHeader label="Possible renames" title={sampleCheck ? `Answer all ${fmt(sampleCheck.total)}: ${sampleCheck.label}?` : ''} />
      <ModalBody>
        <p>The 5 closest pairs. Check them before answering all {sampleCheck ? fmt(sampleCheck.total) : ''}:</p>
        <Table size="sm"><TableHead><TableRow><TableHeader>In your file</TableHeader><TableHeader>Already in OpenELIS</TableHeader><TableHeader>Why matched</TableHeader></TableRow></TableHead>
          <TableBody>{renames.slice(0, 5).map(r => <TableRow key={r.line}><TableCell>{r.file.name}</TableCell><TableCell>{r.cand.name} {r.cand.code}</TableCell><TableCell>They share: {r.shared}</TableCell></TableRow>)}</TableBody></Table>
        <p className="ir-sub">You can change any row afterwards, or clear this group's answers.</p>
      </ModalBody>
      <ModalFooter primaryButtonText={sampleCheck ? `Answer all ${fmt(sampleCheck.total)}` : 'Answer all'} secondaryButtonText="Cancel" onRequestClose={() => setSampleCheck(null)}
        onRequestSubmit={() => { setGroup(sampleCheck.group, sampleCheck.value); setSampleCheck(null); }} />
    </ComposedModal>
  </Shell>;
}

// ---------------------------------------------------------------------------------------------------------
// Decision groups: one table pattern for every group (FR-C2, critique Z-10)
// ---------------------------------------------------------------------------------------------------------
function DecisionGroup({ id, title, help, group, rows, total, effective, groupAns, setGroup, clearGroup, groupAnswers, setSampleCheck, kind, setAnswer, isCatalog, danger }) {
  const unanswered = rows.filter(r => !effective(r)).length;
  const reach = total || rows.length;
  const heads = { rename: ['In your file', 'Already in OpenELIS', 'Why matched'], match: ['In your file', 'Candidates', 'Why matched'], children: ['In your file', 'Already in OpenELIS', 'Why asked'],
    changed: ['In your file', 'At preview and now', 'Why asked'], meaning: ['In your file', 'Already in OpenELIS', 'Why asked'] }[kind];
  return <div className="ir-grp" id={id} tabIndex={-1} role="group" aria-label={title}>
    <div className="ir-grp-hd"><h4>{title}</h4>{danger && <Tag type="red" size="sm">Changes past results</Tag>}<span className="ir-meta">{plural(rows.length, 'row', 'rows')}{unanswered ? ` · ${fmt(unanswered)} not answered yet` : ' · all answered'}</span></div>
    <div className="ir-grp-help">{help}</div>
    {groupAnswers.length > 0 && <div className="ir-grp-answers">
      {groupAnswers.map(([v, l]) => <div className="ir-ga" key={v}>
        <Button kind="tertiary" size="sm" renderIcon={groupAns[group] === v ? CheckmarkFilled : undefined} onClick={() => (reach > 25 && setSampleCheck) ? setSampleCheck({ group, value: v, total: reach, label: l }) : setGroup(group, v)}>{l}</Button>
        <span className="ir-sub">Answers all {fmt(reach)} rows{reach > 25 ? `, ${Math.min(25, rows.length)} on this page` : ''}</span></div>)}
      {groupAns[group] && <button className="ir-link" style={{ fontSize: 13, alignSelf: 'center' }} onClick={() => clearGroup(group)}>{t('button.importReview.group.clear', "Clear this group's answers")}</button>}
    </div>}
    <TableContainer><Table size="md" className="ir-dec">
      <TableHead><TableRow><TableHeader>{t('label.importReview.column.line', 'Line')}</TableHeader>{heads.map(h => <TableHeader key={h}>{h}</TableHeader>)}<TableHeader>{t('label.importReview.column.answer', 'Answer')}</TableHeader></TableRow></TableHead>
      <TableBody>{rows.map(row => <DecisionRow key={row.key} row={row} eff={effective(row)} kind={kind} setAnswer={setAnswer} isCatalog={isCatalog} />)}</TableBody>
    </Table></TableContainer>
    {total > rows.length && <Pager total={total} shown={rows.length} />}
  </div>;
}

function DecisionRow({ row, eff, kind, setAnswer, isCatalog }) {
  const r = row.r;
  const name = r.file ? r.file.name : r.name;
  const label = `Line ${r.line || ''}, ${name}`;
  let cells, options = [], helper, after = null;
  if (kind === 'rename') {
    cells = [<><b>{r.file.name}</b><div className="ir-meta">{r.file.code || 'no code'} · {r.file.loc}</div></>,
      <><b>{r.cand.name}</b><div className="ir-meta">{r.cand.code || 'no code'} · {r.cand.loc} · {r.cand.status} · {plural(r.cand.open, 'open order', 'open orders')}</div></>,
      <span className="ir-meta">They share: {r.shared}</span>];
    options = [['renamed', t('label.locations.import.rename.same', 'Same place, renamed')], ['new', t('admin.locations.import.rename.new', 'New place')]];
    helper = `Same place, renamed updates ${r.cand.name} and keeps its history.`;
  } else if (kind === 'match') {
    cells = [<><b>{r.file.name}</b><div className="ir-meta">{r.file.code || 'no code'} · {r.file.loc}</div></>,
      <>{r.cands.map(c => <div key={c.id} style={{ marginBottom: '.25rem' }}><b>{c.name}</b><div className="ir-meta">{c.code} · {c.loc} · {c.status}{!isCatalog ? ` · ${plural(c.open, 'open order', 'open orders')}` : ''}</div></div>)}</>,
      <span className="ir-meta">{r.why}</span>];
    options = [...r.cands.map(c => ['use:' + c.id, `Use ${c.name} (${c.code})`]), r.addUnit ? ['new', `Add "${r.addUnit}" as a new unit`] : ['new', t('label.importReview.decision.new', 'Create new')], ['skip', t('label.importReview.decision.skip', 'Skip row')]];
  } else if (kind === 'children') {
    cells = [<span className="ir-meta">Not listed, so Replace deactivates it</span>, <><b>{r.name}</b> {r.code}<ul className="ir-meta" style={{ margin: '.25rem 0 0 1.25rem', padding: 0 }}>{r.wards.map(w => <li key={w}>{w}</li>)}</ul></>,
      <span className="ir-meta">{r.count} active wards / depts are outside this file's scope</span>];
    options = [['with', `Deactivate with its ${r.count} wards / depts`], ['only', `Deactivate ${r.name} only`], ['keep', t('button.importReview.keepActive', 'Keep active')]];
  } else if (kind === 'changed') {
    cells = [<><b>{r.name}</b><div className="ir-meta">{r.field}: {r.file}</div></>, <><div className="ir-meta">At preview: {r.atPreview}</div><div><b>Now: {r.now}</b></div><div className="ir-sub">Changed by {r.who}</div></>, <span className="ir-meta">Changed after the preview</span>];
    options = [['file', t('label.importReview.decision.useFile', "Use the file's value")], ['current', t('label.importReview.decision.keepCurrent', 'Keep the current value')]];
  } else if (kind === 'meaning') {
    cells = [<><b>{r.name}</b><div className="ir-meta">{r.field}: {r.to}</div></>, <><b>{r.name}</b> {r.code}<div className="ir-meta">{r.field}: {r.from} · {fmt(r.results)} results</div></>,
      <span className="ir-meta">The {r.field.toLowerCase()} changes from {r.from} to {r.to}</span>];
    options = [['newVersion', t('catalog.import.newVersion', 'Create a new version of this test (recommended)')], ['relabel', t('catalog.import.meaning.relabel', 'Same measurement, only the label changes'), !r.equivalent], ['skip', t('catalog.import.meaning.skip', 'Skip this row')]];
    if (!r.equivalent) helper = `${r.from} and ${r.to} are different measurements. Choose a new version.`;
    if (eff === 'newVersion') after = <TableRow className="ir-after"><TableCell /><TableCell colSpan={4} className="ir-meta">
      A new test "{r.name}" ({r.code}, {r.to}) is created with the file's ranges. The current test becomes "{r.name} (to 2026-10-20)", is made not orderable and keeps its {fmt(r.results)} results as they were. These stay on the current test until you move them: {r.deps}.</TableCell></TableRow>;
  }
  return <>
    <TableRow data-unanswered={!eff} tabIndex={-1} aria-label={label}>
      <TableCell>{r.line ? `Line ${r.line}` : ''}{!eff && <div><Tag type="purple" size="sm">{t('label.importReview.tag.notAnswered', 'Not answered yet')}</Tag></div>}</TableCell>
      {cells.map((c, i) => <TableCell key={i}>{c}</TableCell>)}
      <TableCell style={{ minWidth: 220 }}>
        <RadioButtonGroup legendText={<span className="cds--visually-hidden">{label}</span>} name={row.key} orientation="vertical" valueSelected={eff || ''} onChange={v => setAnswer(row.key, v)} helperText={helper}>
          {options.map(([v, l, dis]) => <RadioButton key={v} id={`${row.key}-${v}`} value={v} labelText={l} disabled={!!dis} />)}
        </RadioButtonGroup>
        {kind === 'match' && eff && eff.startsWith('use') && <Checkbox id={`${row.key}-remember`} labelText={t('label.importReview.decision.remember', 'Remember this name')} />}
      </TableCell>
    </TableRow>{after}</>;
}

function RecentImports({ isCatalog, justApplied, undone, discarded }) {
  const files = isCatalog ? 'tests-hematology-chemistry.csv, result-limits-chemistry.csv' : 'organizations-png-2026-10.csv';
  const rows = [
    ...(discarded ? [['2026-10-20 15:40', 'Casey', files, isCatalog ? 'Replace' : 'Add & update', 'Import', 'Discarded', '']] : []),
    ...(justApplied || undone ? [['2026-10-20 15:44', 'Casey', files, isCatalog ? 'Replace' : 'Add & update', 'Import', undone ? 'Undone, 1 kept' : 'Applied', undone ? '' : 'undo']] : []),
    ['2026-10-14 11:02', 'Joseph Kila', 'organizations-png-2026-09.csv', 'Add & update', 'Import', 'Applied with rows waiting', 'answer'],
    ['2026-10-09 09:30', 'Casey', 'organizations-staging-export.csv', 'Compare only', 'Compare', 'Preview ready', 'diff'],
    ['2026-10-02 16:15', 'Mary Kasu', 'sites-vector-2026.csv', 'Replace', 'Import', 'Expired', 'again'],
    ['2026-09-28 10:05', 'Casey', 'organizations-png-2026-08.csv', 'Add & update', 'Undo', 'Applied', ''],
  ];
  const tagFor = s => s === 'Preview ready' ? 'blue' : s.startsWith('Applied with') ? 'purple' : s.startsWith('Applied') ? 'green' : 'gray';
  return <div className="ir-panel" style={{ marginTop: '1.5rem' }}>
    <h3>{t('label.importReview.recent', 'Recent imports')}</h3>
    <Table size="md"><TableHead><TableRow>{['Date', 'User', 'Files', 'Mode', 'Type', 'Status', ''].map((h, i) => <TableHeader key={i}>{h}</TableHeader>)}</TableRow></TableHead>
      <TableBody>{rows.map((r, i) => <TableRow key={i}><TableCell>{r[0]}</TableCell><TableCell>{r[1]}</TableCell><TableCell>{r[2]}</TableCell><TableCell>{r[3]}</TableCell><TableCell>{r[4]}</TableCell>
        <TableCell><Tag type={tagFor(r[5])} size="sm">{r[5]}</Tag></TableCell>
        <TableCell style={{ fontSize: 13 }}>
          {r[6] === 'undo' && <button className="ir-link">{t('button.importReview.undo', 'Undo this import')}</button>}
          {r[6] === 'answer' && <button className="ir-link">{t('button.importReview.answerWaiting', 'Answer the waiting rows')} (3)</button>}
          {r[6] === 'diff' && <button className="ir-link">{t('button.importReview.differences', 'Download differences')}</button>}
          {r[6] === 'again' && <button className="ir-link">{t('button.importReview.previewAgain', 'Preview again with my answers')}</button>}
          {r[5] !== 'Discarded' && <> <button className="ir-link">{t('button.importReview.downloadProblems', 'Download with problems')}</button></>}
        </TableCell></TableRow>)}</TableBody></Table>
  </div>;
}
