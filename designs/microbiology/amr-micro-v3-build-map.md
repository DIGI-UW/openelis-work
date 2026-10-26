# AMR Micro v3.2: build map (what exists, what must not change)

| | |
|---|---|
| **For** | Claude Code and developers building v3 |
| **Baseline** | OpenELIS develop at `f72854e` |
| **Spec** | `amr-micro-v3-frs.md` (v3 FRS) and the v2 FRS |
| **Preview** | `amr-micro-v3-preview.html`: the same map is the `BUILD_MAP` constant at the top of its script, and every area carries `data-build`, `data-files` and `data-v3` attributes |
| **Mockup** | `amr-micro-v3-mockup.jsx`: the developer handoff mockup in `@carbon/react` (Carbon v11), same screens and the same `BUILD_MAP`; checked by bundling with `@carbon/react` 1.118 and rendering every view with no errors; the one warning is Carbon's own Toggletip passing its deprecated `caret` prop internally |

## Rules

1. **built**: the area exists on develop. Keep its behaviour, layout, components, API and tests. Change **only** the items in its "v3 changes" list. If a v3 item seems to need a wider change, stop and ask; do not refactor around it.
2. **v2**: specced in the v2 FRS but not on develop. Build it to the v2 FRS first, then apply any v3 items.
3. **v3**: new in v3. Build it to the v3 FRS, reusing the existing components named here and in the FRS ("Reuse" tables).
4. Anything in the preview with class `anno`, `new` or `new3` is design commentary or a version chip. Never build it. The preview hides it unless "Design notes" is on.
5. The preview is a drawing, not code: its data, styles and helper components are not to be copied. Use Carbon React components and the existing OpenELIS patterns.
6. Every new user-facing string is an i18n key (the FRS lists them); existing keys are reused, not renamed.

## Map

### Case view (one component tree, `MicrobiologyCaseView.jsx`)

| Area | State | Existing files | Keep | v3 changes only |
|---|---|---|---|---|
| Case header | **built** | `frontend/src/components/microbiology/MicrobiologyCaseView.jsx`<br>`frontend/src/components/microbiology/MicrobiologyCaseState.js` | Header card fields, Change lab unit, Log critical notification, Report NCE, Patient history. | - Status tag (In progress, Partial, Final, Amended) worked out from releases, with Stage (getMicrobiologyCurrentStep) as its subtitle (D-277, D-281)<br>- Referral and amendment tags beside the status (D-Q6)<br>- STAT as a red tag beside the case number (D-281)<br>- Sticky case bar: case number, patient, status, STAT, section links, Release partial and Release final (D-281)<br>- Next: link before the release buttons, from incoming results and the readiness blockers; scrolls to the section only (FR-R27.3, D-336)<br>- Every section header: purpose sentence in the body, green Complete Tag and one-line summary when no final-release check is left for it, starts closed only then, never auto-closes, reopens on new work, Enter or Space toggles with aria-expanded (R-27, D-335, D-337, D-338) |
| Incoming results | **v2** | none yet | Build to v2 FRS (A-12, FR-09.6, FR-09.7). Not on develop. | none |
| 1 Case information | **built** | `frontend/src/components/microbiology/CaseInfoSummary.jsx`<br>`frontend/src/components/microbiology/OrderDetailPanel.jsx` | All fields and questionnaire. v2 changes per v2 FRS. | - None. No Clinical context field (D-272). |
| 2 Initial testing | **v2** | `frontend/src/components/microbiology/MicrobiologyCaseView.jsx` | Build to v2 FRS. Direct tests are ordinary tests released on their own. | none |
| 3 Referral point | **built** | `Clinical Order Entry v4 Refer out (ReferralStatusTag)` | Refer out flow and referral status tags. | - Open referrals drive the Referred and Referral returned tags in the header (D-Q6) |
| 4 Culture and readings (was Culture) | **built** | `frontend/src/components/microbiology/CaseInoculationPanel.jsx`<br>`frontend/src/components/microbiology/CultureSetSummary.jsx`<br>`frontend/src/components/microbiology/CaseCultureTransitionPanel.jsx` | Inoculation rows, Mark positive, readings, subcultures, extension, worklist batch inoculation. v2 fields per v2 FRS. | - Rows grouped under their culture test (D-Q4)<br>- No Case role and no Culture checkbox; Inoculate adds the medium's culture test to the order (D-Q5)<br>- Inoculate button always visible, disabled until a medium is picked (D-280)<br>- Notes open under the culture or test row (D-284) |
| 5 Isolates and susceptibility | **built** | `frontend/src/components/microbiology/IsolatePanel.jsx` | Create, Identify, Re-identify, significance, labels, notes. | - ID method lists Method dictionary entries flagged Used for microbiology identification (D-Q2)<br>- Notes open under the isolate row (D-284)<br>- Merged with AST / DST into Isolates and susceptibility: each isolate opens in place with alerts as notifications, one antibiotic list across its runs (WHONET codes under names, From tag, Report tick), Enter new results as Disk, MIC or Etest with keyboard entry, and Runs, panels and QC inside (R-26, D-329 to D-332)<br>- Identify and Re-identify open under the isolate row; Organism uses the shared reference search, limited to the isolate's Gram stain with the limit removable (FR-R13.1b, reference-search-frs.md)<br>- Panels on this isolate row: one Tag per AST panel with its run state, + Add panel (built chooser), + Add antibiotic (supplementary run); no Panel for this organism or All antibiotics filter; panel antibiotics with no result listed as not started (FR-R26.4a, D-334)<br>- From, Report and Cascade explained with Carbon Toggletips (FR-R27.6)<br>- Empty state: No isolates yet. Add one when a culture grows. (FR-R27.6)<br>- Add panel chooser under the panels row: For this isolate (panels whose targeting matches the organism and sample type, grouped most specific first) and All panels (whole catalog, warns when not targeted), server-side search, Method and Standard filters, paged; replaces the v2 test and panel chooser for AST panels (R-28, D-342)<br>- One open panel per isolate row (Open, Re-identify, Notes), directly under the row; titled, scrolled into view below the case bar, focus on the title, brief outline, focus back on close (FR-R28.8, FR-R28.9, D-343)<br>- Antibiotic list grouped by class; expected resistance shown as R with no input (Skip testing on the Always R rule); no-breakpoint warnings on untested rows, Add antibiotic and chooser rows; MDR, XDR or PDR line at the top; EUCAST high dose beside an I (R-29, D-344 to D-347, D-349) |
| 5 Isolates and susceptibility: Run details and QC (was 6 AST / DST) | **built** | `frontend/src/components/microbiology/AstEntryPanel.jsx`<br>`frontend/src/components/microbiology/AstAttemptTable.jsx`<br>`frontend/src/components/microbiology/ReagentLotPicker.jsx` | Run setup, analyzer and manual entry, overrides with history, QC handling, validation, attempts, Use for reporting. | - Suggested strip with Add and Dismiss (optional reason in the same click), computed not stored (R-04, D-278, D-290)<br>- Default panel label from panel targeting (R-01)<br>- Disk lot per antibiotic gives disk content (R-15)<br>- Qualifier dropdown in the existing Record reading form, which opens under the antibiotic row (D-Q7, D-279, D-284)<br>- Report column: tick per antibiotic; reason shown only when it is not the routine rule (D-276, D-284)<br>- Notes on each run, opening under the run row; rule notes land there while the rule condition is met and, like every note, cannot be removed (D-275, D-284, D-291)<br>- Expert rule source on readings (R-06)<br>- Reagents, QC & Controls section (ReagentsQcSection.tsx from Results Entry) on the run, with one control row per antibiotic and expected ranges from the packs (R-23, D-293)<br>- Molecular resistance table from any test result mapped to an antibiotic or class; method is the test's linked Method (D-Q3, D-285)<br>- Breakpoint standard preselected from the lab default or the best organism exception, with the reason in the helper; empty and required when neither exists; never list order or the last run; analyzer runs with no standard wait uninterpreted (R-38, D-359) |
| 7 Additional testing | **v2** | none yet | Build to v2 FRS. | none |
| 8 Critical communication | **built** | `frontend/src/components/microbiology/CriticalCommunicationPanel.jsx` | Manual entries, acknowledgement and close as built. | - Automatic rows from alert rules: method Email, automatic, linked alert, status Sent (no acknowledgement) or Not sent with reason (R-22, D-292, D-295) |
| 9 Nonconformance | **built** | `frontend/src/components/microbiology/CaseNonconformancePanel.jsx` | Unchanged. | none |
| 10 Report and release (was Release) | **built** | `frontend/src/components/microbiology/ReportReadinessPanel.jsx` | Readiness checklist, print preview, partial release. v2 per-result choice per v2 FRS. | - AST shown as one summary line per isolate (D-276)<br>- Final release blocked list and confirmation (D-Q1)<br>- Checklist uses Carbon status icons with text (D-283) |
| 11 Amendment | **built** | `frontend/src/components/microbiology/AmendmentHistoryPanel.jsx` | Unchanged. | none |
| 12 Timeline | **built** | `frontend/src/components/microbiology/CaseTimelinePanel.jsx` | Existing activity list. | - New activity types: suggestion added or dismissed, report tick changed, rule note removed, culture test added by inoculating (R-04, D-275, D-Q5) |

### Worklist

| Area | State | Existing files | Keep | v3 changes only |
|---|---|---|---|---|
| Worklist | **built** | `frontend/src/components/microbiology/MicrobiologyWorklist.jsx` | Chips, bench sheet, batch inoculate, Needs attention. | - Isolates view beside Cultures and AST: one row per isolate, S/I/R columns for the lab's antibiotics, filters for organism, Resistant to and dates (FR-R26.7, D-333)<br>- Status and tags under the lab number, one Status filter that also lists the tags (D-277, D-289)<br>- Needs attention also lists failed alert sends (R-22, D-295)<br>- Suggested count in Needs attention reasons (R-04) |

### Workplan

| Area | State | Existing files | Keep | v3 changes only |
|---|---|---|---|---|
| Workplan | **built** | `frontend/src/components/workplan/Workplan.jsx` | Existing workplan and print. v2 Microbiology bench type per v2 FRS. | none |

### Admin: test catalog and Methods

| Area | State | Existing files | Keep | v3 changes only |
|---|---|---|---|---|
| Test catalog, media links, Methods | **built** | `Test catalog editor (test_reagent_link)`<br>`Admin > Methods` | Test editor, Reagents and media section. v2 media links per v2 FRS. | - Methods: Used for microbiology identification checkbox (D-Q2)<br>- Catalog: no Case role (D-Q5)<br>- Alerts section (AlertsSection.jsx, AlertRuleModal.jsx, TestAlertRule): new trigger type Organism or resistance profile, validated results only (R-22, D-292)<br>- Coded result component: optional resistance mapping to an antibiotic or class (D-285) |

### Admin: Microbiology reference data

| Area | State | Existing files | Keep | v3 changes only |
|---|---|---|---|---|
| Microbiology reference data > AST panels | **built** | `frontend/src/components/admin/microbiologyReference/AstPanelPage.jsx` | Panel list, panel editor, agents and tiers. | - Targeting: organism or group, sample types, Default for (R-01)<br>- Default disk content per agent (R-15)<br>- Tier picker 1 to 4: add Tier 4, On request (FR-R1.6, D-313) |
| Microbiology reference data > AST rules | **v3** | `frontend/src/components/admin/microbiologyReference/sectionConfig.js (new section)`<br>`frontend/src/components/admin/microbiologyReference/MicrobiologyReferenceAdmin.jsx` | New section in the existing Microbiology reference data admin. One page, no tabs: shared filters, Import, Export and History; Reporting rules, then Interpretation rules (M-06, not on develop), then one Preview. | - Whole page (R-06, R-10, D-287)<br>- Interpretation rules: Action column (Set to R, Infer, Flag); Flag rules raise isolate alerts that join the run expert flags (FR-R6.6 to FR-R6.8, D-339)<br>- Always R rules gain Skip testing, on by default (FR-R29.1, D-344) |
| Microbiology reference data > Organisms, Antibiotics, Breakpoint standards | **built** | `frontend/src/components/admin/microbiologyReference/ReferenceDataPage.jsx`<br>`frontend/src/components/admin/microbiologyReference/BreakpointPage.jsx`<br>`frontend/src/components/admin/microbiologyReference/BreakpointRuleModal.jsx` | Existing list, edit modals, breakpoint rules, import. | - Organism synonyms, codes and hierarchy (R-12, R-13)<br>- Antibiotic master fields, AWaRe optional (R-19)<br>- Breakpoint indication, disk content, ECOFF, SDD (R-14 to R-17)<br>- AMR for R seed packs: status, package version and test vectors; a new release is a new pack applied through Import Review (R-18, R-21, D-286)<br>- Local breakpoints as a layer over the pack: Change and Add local breakpoint, reason and history, Local Tag with the pack value beside it, pack differences in Import Review; replaces edit-in-place; one breakpoint row per disk content (R-25, D-326, D-327)<br>- Organism and antibiotic pickers use the shared reference search: server type-ahead plus a search dialog (FR-R13.1b, reference-search-frs.md)<br>- QC range domain for AST control expected ranges (R-23)<br>- LOINC written on AST results by method; French and Spanish names for antibiotics, classes and organism groups seeded from the package (FR-R29.5, FR-R29.7, D-348, D-350)<br>- Proposed, decided in OGC-1535 (Part E): No breakpoint rules stop fallback, NS, dilution-step MIC comparison, indication terms with urine fallback and an anaerobe level, Screen agents, vectors from the package boundary rules, 2025 and 2026 packs with CLSI gated, seeded rows pass admin validation (R-30 to R-37)<br>- Breakpoint standards: Lab default flag on one active edition and an Organism exceptions list (R-38) |

### Order entry

| Area | State | Existing files | Keep | v3 changes only |
|---|---|---|---|---|
| Enter Order | **built** | `frontend/src/components/order/steps/ClinicalOrderEnter.jsx`<br>`frontend/src/components/order/steps/sections/TestedElsewhereFields.jsx`<br>`frontend/src/components/order/steps/sections/CultureBottleFields.jsx`<br>`frontend/src/components/order/steps/sections/MicroOrderPreview.jsx` | Stepped Enter Order (Clinical Order Entry v4): micro tests in the ordinary chooser, bottles with set number and container, Tested elsewhere in the row overflow. | - Live What this order will open panel kept as built; adds "ISO-1 reported as {organism}" for a received isolate (FR-R24.1, D-323)<br>- Save notification links to the cases opened (FR-R24.2)<br>- Reported organism on Tested elsewhere through the reference search (FR-R24.4, D-324)<br>- Bottle containers from the v4 container types (FR-R24.3, D-325)<br>- No AST panel in the chooser, the lab's or a sender's (FR-R24.5, AC-R-21) |

## Not on develop yet (build from spec)

Incoming results, Initial testing, Additional testing (v2 FRS); the AST rules section (reporting and interpretation rules, v3 FRS R-10 and R-06). Everything else in the preview exists on develop and is changed only as listed.

## Upkeep

The `BUILD_MAP` constant at the top of the preview's script is the source. When a v3 decision adds or removes a change, update it there and update this file in the same commit, so the two cannot drift.
