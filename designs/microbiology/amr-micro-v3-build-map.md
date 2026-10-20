# AMR Micro v3: build map (what exists, what must not change)

| | |
|---|---|
| **For** | Claude Code and developers building v3 |
| **Baseline** | OpenELIS develop at `f72854e` |
| **Spec** | `amr-micro-v3-frs.md` (v3 FRS) and the v2 FRS |
| **Preview** | `amr-micro-v3-preview.html`: the same map is the `BUILD_MAP` constant at the top of its script, and every area carries `data-build`, `data-files` and `data-v3` attributes |
| **Mockup** | `amr-micro-v3-mockup.jsx`: the developer handoff mockup in `@carbon/react` (Carbon v11), same screens and the same `BUILD_MAP`; checked by bundling with `@carbon/react` 1.118 and rendering every view with no errors or React warnings |

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
| Case header | **built** | `frontend/src/components/microbiology/MicrobiologyCaseView.jsx`<br>`frontend/src/components/microbiology/MicrobiologyCaseState.js` | Header card fields, Change lab unit, Log critical notification, Report NCE, Patient history. | - Status tag (In progress, Partial, Final, Amended) worked out from releases, with Stage (getMicrobiologyCurrentStep) as its subtitle (D-277, D-281)<br>- Referral and amendment tags beside the status (D-Q6)<br>- STAT as a red tag beside the case number (D-281)<br>- Sticky case bar: case number, patient, status, STAT, section links, Release partial and Release final (D-281) |
| Incoming results | **v2** | none yet | Build to v2 FRS (A-12, FR-09.6, FR-09.7). Not on develop. | none |
| 1 Case information | **built** | `frontend/src/components/microbiology/CaseInfoSummary.jsx`<br>`frontend/src/components/microbiology/OrderDetailPanel.jsx` | All fields and questionnaire. v2 changes per v2 FRS. | - None. No Clinical context field (D-272). |
| 2 Initial testing | **v2** | `frontend/src/components/microbiology/MicrobiologyCaseView.jsx` | Build to v2 FRS. Direct tests are ordinary tests released on their own. | none |
| 3 Referral point | **built** | `Clinical Order Entry v4 Refer out (ReferralStatusTag)` | Refer out flow and referral status tags. | - Open referrals drive the Referred and Referral returned tags in the header (D-Q6) |
| 4 Culture | **built** | `frontend/src/components/microbiology/CaseInoculationPanel.jsx`<br>`frontend/src/components/microbiology/CultureSetSummary.jsx`<br>`frontend/src/components/microbiology/CaseCultureTransitionPanel.jsx` | Inoculation rows, Mark positive, readings, subcultures, extension, worklist batch inoculation. v2 fields per v2 FRS. | - Rows grouped under their culture test (D-Q4)<br>- No Case role and no Culture checkbox; Inoculate adds the medium's culture test to the order (D-Q5)<br>- Inoculate button always visible, disabled until a medium is picked (D-280)<br>- Notes open under the culture or test row (D-284) |
| 5 Isolates | **built** | `frontend/src/components/microbiology/IsolatePanel.jsx` | Create, Identify, Re-identify, significance, labels, notes. | - ID method lists Method dictionary entries flagged Used for microbiology identification (D-Q2)<br>- Notes open under the isolate row (D-284) |
| 6 AST / DST | **built** | `frontend/src/components/microbiology/AstEntryPanel.jsx`<br>`frontend/src/components/microbiology/AstAttemptTable.jsx`<br>`frontend/src/components/microbiology/ReagentLotPicker.jsx` | Run setup, analyzer and manual entry, overrides with history, QC handling, validation, attempts, Use for reporting. | - Suggested strip with Add and Dismiss (optional reason in the same click), computed not stored (R-04, D-278, D-290)<br>- Default panel label from panel targeting (R-01)<br>- Disk lot per antibiotic gives disk content (R-15)<br>- Qualifier dropdown in the existing Record reading form, which opens under the antibiotic row (D-Q7, D-279, D-284)<br>- Report column: tick per antibiotic; reason shown only when it is not the routine rule (D-276, D-284)<br>- Notes on each run, opening under the run row; rule notes land there while the rule condition is met and, like every note, cannot be removed (D-275, D-284, D-291)<br>- Expert rule source on readings (R-06)<br>- Reagents, QC & Controls section (ReagentsQcSection.tsx from Results Entry) on the run, with one control row per antibiotic and expected ranges from the packs (R-23, D-293)<br>- Molecular resistance table from any test result mapped to an antibiotic or class; method is the test's linked Method (D-Q3, D-285) |
| 7 Additional testing | **v2** | none yet | Build to v2 FRS. | none |
| 8 Critical communication | **built** | `frontend/src/components/microbiology/CriticalCommunicationPanel.jsx` | Manual entries, acknowledgement and close as built. | - Automatic rows from alert rules: method Email, automatic, linked alert, status Sent (no acknowledgement) or Not sent with reason (R-22, D-292, D-295) |
| 9 Nonconformance | **built** | `frontend/src/components/microbiology/CaseNonconformancePanel.jsx` | Unchanged. | none |
| 10 Report | **built** | `frontend/src/components/microbiology/ReportReadinessPanel.jsx` | Readiness checklist, print preview, partial release. v2 per-result choice per v2 FRS. | - AST shown as one summary line per isolate (D-276)<br>- Final release blocked list and confirmation (D-Q1)<br>- Checklist uses Carbon status icons with text (D-283) |
| 11 Amendment | **built** | `frontend/src/components/microbiology/AmendmentHistoryPanel.jsx` | Unchanged. | none |
| 12 Timeline | **built** | `frontend/src/components/microbiology/CaseTimelinePanel.jsx` | Existing activity list. | - New activity types: suggestion added or dismissed, report tick changed, rule note removed, culture test added by inoculating (R-04, D-275, D-Q5) |

### Worklist

| Area | State | Existing files | Keep | v3 changes only |
|---|---|---|---|---|
| Worklist | **built** | `frontend/src/components/microbiology/MicrobiologyWorklist.jsx` | Chips, bench sheet, batch inoculate, Needs attention. | - Status and tags under the lab number, one Status filter that also lists the tags (D-277, D-289)<br>- Needs attention also lists failed alert sends (R-22, D-295)<br>- Suggested count in Needs attention reasons (R-04) |

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
| Microbiology reference data > AST panels | **built** | `frontend/src/components/admin/microbiologyReference/AstPanelPage.jsx` | Panel list, panel editor, agents and tiers. | - Targeting: organism or group, sample types, Default for (R-01)<br>- Default disk content per agent (R-15) |
| Microbiology reference data > AST rules | **v3** | `frontend/src/components/admin/microbiologyReference/sectionConfig.js (new section)`<br>`frontend/src/components/admin/microbiologyReference/MicrobiologyReferenceAdmin.jsx` | New section in the existing Microbiology reference data admin. One page, no tabs: shared filters, Import, Export and History; Reporting rules, then Interpretation rules (M-06, not on develop), then one Preview. | - Whole page (R-06, R-10, D-287) |
| Microbiology reference data > Organisms, Antibiotics, Breakpoint standards | **built** | `frontend/src/components/admin/microbiologyReference/ReferenceDataPage.jsx`<br>`frontend/src/components/admin/microbiologyReference/BreakpointPage.jsx`<br>`frontend/src/components/admin/microbiologyReference/BreakpointRuleModal.jsx` | Existing list, edit modals, breakpoint rules, import. | - Organism synonyms, codes and hierarchy (R-12, R-13)<br>- Antibiotic master fields, AWaRe optional (R-19)<br>- Breakpoint indication, disk content, ECOFF, SDD (R-14 to R-17)<br>- AMR for R seed packs: status, package version and test vectors; a new release is a new pack applied through Import Review (R-18, R-21, D-286)<br>- QC range domain for AST control expected ranges (R-23) |

### Order entry

| Area | State | Existing files | Keep | v3 changes only |
|---|---|---|---|---|
| Enter Order | **built** | `Clinical Order Entry v4` | Order entry v4. v2 removed the Microbiology section. | - None beyond v2 |

## Not on develop yet (build from spec)

Incoming results, Initial testing, Additional testing (v2 FRS); the AST rules section (reporting and interpretation rules, v3 FRS R-10 and R-06). Everything else in the preview exists on develop and is changed only as listed.

## Upkeep

The `BUILD_MAP` constant at the top of the preview's script is the source. When a v3 decision adds or removes a change, update it there and update this file in the same commit, so the two cannot drift.
