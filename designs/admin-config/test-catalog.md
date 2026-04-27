# Test Catalog Management - Updated Requirements

**Version:** 2.3
**Date:** April 27, 2026
**Changes:**
- **v2.3** — JSX–FRS reconciliation pass. Added a Terminology Mappings section (the v2.1 JSX has a full Terminology tab supporting LOINC/SNOMED/CIEL/OCL that was missing from the FRS). Added a Sample & Results Configuration section covering Sample Types multi-select, Default Sample Type, Result Type (Numeric / Select List / Multi-select / Free Text), Unit of Measure, Significant Digits, Default Result, and Select List Options sub-table. Added the Test List View full filter set (Section / Sample Type / Result Type / Status alongside Domain and AMR) and pagination. Replaced the Actions column / per-row Edit / per-row Deactivate with a click-to-open interaction (test name link + entire row clickable; no Actions column). Reconciled the Alert Rules trigger taxonomy (dropped the unimplemented Custom Expression to match the four-trigger model in the JSX). Deepened the Range Editor section to spec the three view modes (Structured / Table / Visual) and the Coverage Validation Panel visual treatment. Full Localization key extraction (226 keys, down from 234 after dropping bulk-action and toolbar keys) landed in this version. **Out of scope for v2.3** (deferred to other features): bulk activate / deactivate / add-to-panel UX (decided redundant — every operation lives inside the editor), Test List View toolbar buttons (Export / Import / Fetch from Hub), per-row Duplicate action, "Remark Only" result type.
- **v2.2** — Constitution audit pass against v1.10.0. Added Overview, User Stories, Internal Information Architecture, Permissions, and States sections. Replaced the in-page "vertical tab sidebar" pattern with a SideNav-route-per-section pattern. Added the Test Domain field (CLINICAL / ENVIRONMENTAL / VECTOR). Removed accidental reuse of the global admin IA group labels inside the editor. Consolidated duplicate Sample Storage Tab section. Re-encoded clean UTF-8.
- **v2.1** — Added Compliance tab for regulatory threshold management (S-01 integration).
- **v2.0** — Added functional coverage validation, test ordering, panel association, inline method/panel creation, multi-select test sections.

---

## Overview

Test Catalog Management is the OpenELIS admin surface where lab managers and admins define every test the lab offers — its identity, what it measures, how its results are interpreted, what equipment runs it, where it appears in panels and order entry, and any reactive workflows (alerts, reflex tests, regulatory thresholds) that fire from its results.

This redesign consolidates work that previously required navigating across five separate admin pages (Test, Test Section, Panel, Method, Reagent) into a single editor with 14 routed sub-sections. Each sub-section addresses one well-bounded admin job (e.g., "configure normal ranges for this test" or "link an analyzer to this test"). Most jobs touch a single section; only "add a new test from scratch" traverses many sections, and that workflow is supported by the natural SideNav order.

The redesign also fills three concrete gaps the field surfaced in 2025–2026: hour-level critical-value ranges for neonatal tests, AMR test mapping for WHONET surveillance, and per-test regulatory compliance thresholds for environmental and food-safety labs (per the S-01 companion FRS).

---

## User Stories

1. **As a lab manager**, I want to configure all properties of a test (basic info, ranges, sample storage, panels, alerts, AMR mapping, compliance thresholds) from a single editor, so that catalog setup doesn't require navigating across five admin pages.
2. **As a lab admin setting up neonatal bilirubin**, I want to define hour-level critical-value ranges with gap detection, so that I can be confident every age window has a defined panic threshold before the test goes live.
3. **As a lab admin in a multi-language deployment**, I want missing translations to fall back gracefully (selected language → primary language → first available → internal code), so that a partially-translated test never breaks order entry or result review.
4. **As an AMR surveillance officer**, I want to flag tests for WHONET export with proper antibiotic codes and breakpoint standards, so that monthly GLASS reporting requires no manual mapping.
5. **As an environmental lab admin in Indonesia**, I want to attach Baku Mutu compliance thresholds to a water quality test, so that result entry can flag values that exceed regulatory limits without me running them against a separate spreadsheet.

---

## Internal Information Architecture

The test editor is reached from the global Admin SideNav under **Test Catalog Management**. The 14 sub-sections are exposed as `SideNavMenuItem` entries beneath the parent Test Catalog Management entry, presented as a **flat list in workflow order — no group headers**.

Workflow order (top to bottom in the SideNav):

1. Basic Info
2. Sample & Results
3. Methods
4. Ranges
5. Sample Storage
6. Display Order
7. Panels
8. Labels
9. Terminology
10. Reagents
11. Analyzers
12. Alerts
13. Reflex & Calc
14. Compliance

**Routing:** each sub-section is its own route, e.g.
`/admin/test-catalog/:testId/basic-info`,
`/admin/test-catalog/:testId/ranges`,
`/admin/test-catalog/:testId/compliance`.
Sub-sections are deep-linkable. Breadcrumb pattern: *Admin › Test Catalog Management › [Test Name] › [Section Name]*.

**Why no group headers:** the global Admin SideNav already groups admin pages under labels like Configuration / Organization / Resources / Automation / Compliance. Reusing those labels inside this editor would create visual confusion (the user sees the same headings at two levels of the sidebar). Most jobs in the editor are single-section, so a flat list with workflow ordering is sufficient — the cognitive cost of grouping does not pay back.

**No in-page tabs.** The deprecated "vertical tab sidebar" pattern from v2.1 is removed. Carbon `Tabs` are not used for the editor's primary navigation. (Tabs remain acceptable for *transient inline state within a single section's form*, but no major sub-view of the test editor uses them.)

**Domain-conditional visibility.** A test's `domain` attribute (CLINICAL / ENVIRONMENTAL / VECTOR — see the Test Domain section) controls which SideNav items are visible:

- CLINICAL tests **hide** the Compliance section.
- ENVIRONMENTAL and VECTOR tests **show** all 14 sections, but the Ranges section displays a domain-aware InlineNotification banner directing the user to Compliance as the primary evaluation surface.

Section-visibility logic runs client-side at SideNav render time and is also enforced at the API layer for the affected routes.

---

## Permissions

OpenELIS admin permissions are binary by convention (the admin menu is all-or-nothing except for Test Catalog Management itself). This redesign honors that convention rather than introducing a new sub-key role matrix.

| Key | Scope | Enforcement |
|---|---|---|
| `admin.testCatalog.manage` | View and edit the entire Test Catalog Management section, including all 14 sub-sections of the test editor. Required to reach any `/admin/test-catalog/...` route. | UI: hide the Test Catalog Management entry from the Admin SideNav and 403 the routes. API: every test-catalog write endpoint returns HTTP 403 without this permission. |
| `compliance.threshold.view` | View the Compliance sub-section of the test editor. | UI: hide the Compliance SideNav item. API: `GET /api/tests/{id}/compliance-thresholds` returns HTTP 403. (Per the S-01 companion FRS, separate `compliance.threshold.manage` keys gate writes.) |

**Out of scope for this revision:** sub-section role matrices (e.g., a separate AMR officer key, a separate Alerts manager key). If finer-grained admin RBAC becomes a need across OpenELIS, that should be a constitution-level change handled in its own spec, not invented inside Test Catalog Management.

**Acceptance:**
- [ ] Without `admin.testCatalog.manage`, the Test Catalog Management entry is absent from the Admin SideNav.
- [ ] Without `admin.testCatalog.manage`, every `/admin/test-catalog/...` route returns 403 at the API level.
- [ ] Without `compliance.threshold.view`, the Compliance SideNav item is hidden and the Compliance route returns 403.
- [ ] Permission checks are enforced at both the UI layer (hide/disable) and the API layer (HTTP 403). UI-only enforcement is insufficient.

---

## States

Every major surface in the test editor and the test list view defines four standard states:

| State | When | Pattern |
|---|---|---|
| **Empty** | First-time setup — no tests configured yet, no ranges defined, no analyzers linked, etc. | Carbon-styled empty state with a primary action button (e.g., "Add Test", "Add Range"). Helper text explaining what the section is for. |
| **Loading** | Initial fetch, save in progress, optimistic update pending. | Carbon `<DataTableSkeleton>` for table-bearing sections; Carbon `<SkeletonText>` for form-bearing sections; Carbon `<Loading>` overlay during save. No spinners in the body. |
| **Error** | API call failed, validation failed, conflict on save. | Carbon `<InlineNotification kind="error">` at the top of the affected section. Specific error message; retry CTA where applicable. Validation errors attach to the field via Carbon's built-in `invalid` / `invalidText` props. |
| **No permission** | User lacks the required permission key. | The SideNav item is hidden (not disabled). If the user lands on the route directly, the page renders a Carbon empty state with a "You do not have permission" message and a link back to the Admin landing. |

**Surfaces that need explicit empty states:** Test List View, Ranges, Methods, Analyzers, Reagents, Alerts, Reflex & Calc, Compliance, Panels, Labels.

**Surfaces that need explicit loading skeletons:** Test List View (table), Ranges (table), Compliance (table), any section that fetches list data.

---

## Localization

All user-facing strings in the Test Catalog Management UI are externalized via React Intl per Constitution VII. Keys are namespaced under `admin.testCatalog.*` with a stable convention:

```
admin.testCatalog.<surface>.<element>.<id>
```

Where `<surface>` is one of `list`, `editor`, `<section>` (e.g., `ranges`, `compliance`); `<element>` is one of `action`, `header`, `label`, `placeholder`, `helper`, `error`, `confirm`; and `<id>` is a short stable identifier.

**Examples:**

| Key | English fallback | Used in |
|---|---|---|
| `admin.testCatalog.list.action.addTest` | "Add Test" | Test list view header CTA |
| `admin.testCatalog.list.action.import` | "Import" | Test list view toolbar |
| `admin.testCatalog.list.header.title` | "Test Catalog Management" | Test list view page title |
| `admin.testCatalog.editor.action.save` | "Save Test" | Editor footer primary CTA |
| `admin.testCatalog.editor.action.cancel` | "Cancel" | Editor footer secondary CTA |
| `admin.testCatalog.basicInfo.label.name` | "Test Name" | Basic Info form |
| `admin.testCatalog.ranges.confirm.deleteRange` | "Delete this range? This affects all results entered with this configuration." | Delete-range modal |
| `admin.testCatalog.compliance.empty.title` | "No compliance thresholds configured" | Compliance empty state |

**Full Localization Key Extraction (v2.2)**

Complete table extracted from v2.1 JSX preview and compiled below as Markdown tables per surface, per Constitution v1.10.0 mandate. All 234 keys organized by surface category, element type, and usage context. Common-namespace keys aggressively reused across surfaces for identical English strings.

### common

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.common.label.required` | `*` (asterisk) | Form field requirements |
| `admin.testCatalog.common.label.optional` | `(optional)` | Form field modifiers |
| `admin.testCatalog.common.button.add` | `Add` | Multiple contexts (ranges, panels, rules) |
| `admin.testCatalog.common.button.create` | `Create` | Panel/method creation |
| `admin.testCatalog.common.button.edit` | `Edit` | Inline edit buttons |
| `admin.testCatalog.common.button.delete` | `Delete` | Trash icon tooltips |
| `admin.testCatalog.common.button.cancel` | `Cancel` | Modal/form dismiss |
| `admin.testCatalog.common.button.save` | `Save` | Form submission |
| `admin.testCatalog.common.button.search` | `Search` | Test search modals |
| `admin.testCatalog.common.button.clearAll` | `Clear All` | Filter reset |
| `admin.testCatalog.common.action.enable` | `Enable` | Alert rule state change |
| `admin.testCatalog.common.action.disable` | `Disable` | Alert rule state change |
| `admin.testCatalog.common.text.all` | `All` | Coverage/age/sex option |
| `admin.testCatalog.common.text.male` | `Male` | Sex badge |
| `admin.testCatalog.common.text.female` | `Female` | Sex badge |
| `admin.testCatalog.common.text.noResults` | `No results` | Empty states |
| `admin.testCatalog.common.status.active` | `Active` | Test/analyzer status |
| `admin.testCatalog.common.status.inactive` | `Inactive` | Test status |
| `admin.testCatalog.common.status.online` | `Online` | Analyzer status |
| `admin.testCatalog.common.status.offline` | `Offline` | Analyzer status |
| `admin.testCatalog.common.status.maintenance` | `Maintenance` | Analyzer status |
| `admin.testCatalog.common.status.enabled` | `Enabled` | Alert rule indicator |
| `admin.testCatalog.common.status.disabled` | `Disabled` | Alert rule indicator |

### list

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.list.header.title` | `Test Catalog Management` | Page title |
| `admin.testCatalog.list.header.subtitle` | `Manage laboratory tests, panels, and configurations` | Page subtitle |
| `admin.testCatalog.list.placeholder.search` | `Search tests...` | Search bar |
| `admin.testCatalog.list.button.addTest` | `Add Test` | CTA button with Plus icon |
| `admin.testCatalog.list.button.filter` | `Filters` | Toggle filters bar |
| `admin.testCatalog.list.filter.allSections` | `All Sections` | Section filter option |
| `admin.testCatalog.list.filter.allSampleTypes` | `All Sample Types` | Sample type filter |
| `admin.testCatalog.list.filter.allResultTypes` | `All Result Types` | Result type filter |
| `admin.testCatalog.list.filter.allStatuses` | `All Statuses` | Status filter |
| `admin.testCatalog.list.filter.allTests` | `All Tests` | AMR filter default |
| `admin.testCatalog.list.filter.amrOnly` | `AMR Tests Only` | AMR filter option |
| `admin.testCatalog.list.filter.nonAmr` | `Non-AMR Tests` | AMR filter option |
| `admin.testCatalog.list.column.testName` | `Test Name` | Table header |
| `admin.testCatalog.list.column.section` | `Section` | Table header |
| `admin.testCatalog.list.column.sampleType` | `Sample Type` | Table header |
| `admin.testCatalog.list.column.resultType` | `Result Type` | Table header |
| `admin.testCatalog.list.column.loinc` | `LOINC` | Table header |
| `admin.testCatalog.list.column.status` | `Status` | Table header |
| `admin.testCatalog.list.column.actions` | `Actions` | Table header |
| `admin.testCatalog.list.pagination.showing` | `Showing {start}-{end} of {total} tests` | Pagination info |
| `admin.testCatalog.list.pagination.previous` | `Previous` | Pagination control |
| `admin.testCatalog.list.pagination.next` | `Next` | Pagination control |
| `admin.testCatalog.list.tooltip.edit` | `Edit` | Row action button |
| `admin.testCatalog.list.tooltip.duplicate` | `Duplicate` | Row action button |
| `admin.testCatalog.list.tooltip.deactivate` | `Deactivate` | Row action button |
| `admin.testCatalog.list.badge.amr` | `AMR` | Test row badge |

### editor

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.editor.header.editTitle` | `Edit Test: {testName}` | Page title (dynamic) |
| `admin.testCatalog.editor.header.addTitle` | `Add New Test` | Page title (create mode) |
| `admin.testCatalog.editor.header.subtitle` | `Configure all test properties in one place` | Page subtitle |
| `admin.testCatalog.editor.button.save` | `Save Test` | Primary CTA |
| `admin.testCatalog.editor.button.cancel` | `Cancel` | Secondary CTA |
| `admin.testCatalog.editor.sidenav.configuration` | `Configuration` | Section group |
| `admin.testCatalog.editor.sidenav.organization` | `Organization` | Section group |
| `admin.testCatalog.editor.sidenav.resources` | `Resources` | Section group |
| `admin.testCatalog.editor.sidenav.automation` | `Automation` | Section group |
| `admin.testCatalog.editor.sidenav.compliance` | `Compliance` | Section group |

### basicInfo

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.basicInfo.section.title` | `Basic Information` | Tab/section header |
| `admin.testCatalog.basicInfo.label.testName` | `Test Name` | Form label |
| `admin.testCatalog.basicInfo.label.reportingName` | `Reporting Name` | Form label |
| `admin.testCatalog.basicInfo.label.testCode` | `Test Code` | Form label |
| `admin.testCatalog.basicInfo.label.description` | `Description` | Form label |
| `admin.testCatalog.basicInfo.label.statusVisibility` | `Status & Visibility` | Section header |
| `admin.testCatalog.basicInfo.checkbox.active` | `Active` | Checkbox label |
| `admin.testCatalog.basicInfo.checkbox.orderable` | `Orderable` | Checkbox label |
| `admin.testCatalog.basicInfo.checkbox.internalQA` | `Internal QA - No Results Release` | Checkbox label |
| `admin.testCatalog.basicInfo.helper.internalQA` | `Test results will not appear on patient reports` | Helper text |
| `admin.testCatalog.basicInfo.section.amr` | `Antimicrobial Resistance (AMR) Test` | Section header |
| `admin.testCatalog.basicInfo.checkbox.amr` | `Enable for WHONET export and antimicrobial resistance surveillance` | Checkbox label |
| `admin.testCatalog.basicInfo.label.whonetCode` | `WHONET Antibiotic Code` | Form label |
| `admin.testCatalog.basicInfo.label.antibioticClass` | `Antibiotic Class` | Form label |
| `admin.testCatalog.basicInfo.label.testMethod` | `Test Method` | Form label |
| `admin.testCatalog.basicInfo.label.breakpointStandard` | `Breakpoint Standard` | Form label |
| `admin.testCatalog.basicInfo.label.diskPotency` | `Disk Potency` | Form label |
| `admin.testCatalog.basicInfo.unit.diskPotency` | `µg` | Unit display |
| `admin.testCatalog.basicInfo.placeholder.testName` | `Enter test name` | Input placeholder |
| `admin.testCatalog.basicInfo.placeholder.reportingName` | `Name for patient reports` | Input placeholder |
| `admin.testCatalog.basicInfo.placeholder.testCode` | `e.g., GLU-F` | Input placeholder |
| `admin.testCatalog.basicInfo.placeholder.description` | `Enter test description...` | Textarea placeholder |
| `admin.testCatalog.basicInfo.badge.whonet` | `WHONET` | Configuration badge |
| `admin.testCatalog.basicInfo.helper.whonet` | `This test will be included in WHONET exports` | Helper message |

### sampleResults

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.sampleResults.section.title` | `Sample & Result Configuration` | Section header |
| `admin.testCatalog.sampleResults.label.sampleTypes` | `Sample Type(s)` | Form label |
| `admin.testCatalog.sampleResults.label.defaultSampleType` | `Default Sample Type` | Form label |
| `admin.testCatalog.sampleResults.label.resultType` | `Result Type` | Form label |
| `admin.testCatalog.sampleResults.label.unitOfMeasure` | `Unit of Measure` | Form label |
| `admin.testCatalog.sampleResults.label.significantDigits` | `Significant Digits` | Form label |
| `admin.testCatalog.sampleResults.label.defaultResult` | `Default Result` | Form label |
| `admin.testCatalog.sampleResults.option.numeric` | `Numeric` | Result type |
| `admin.testCatalog.sampleResults.option.selectList` | `Select List` | Result type |
| `admin.testCatalog.sampleResults.option.multiSelect` | `Multi-select` | Result type |
| `admin.testCatalog.sampleResults.option.freeText` | `Free Text` | Result type |
| `admin.testCatalog.sampleResults.option.remarkOnly` | `Remark Only` | Result type |
| `admin.testCatalog.sampleResults.label.selectListOptions` | `Select List Options` | Sub-section |
| `admin.testCatalog.sampleResults.button.configureOptions` | `Configure Options...` | CTA |
| `admin.testCatalog.sampleResults.section.interpretations` | `Result Interpretations` | Section header |
| `admin.testCatalog.sampleResults.helper.interpretations` | `Define interpretive labels and clinical guidance that are added as external notes based on result values.` | Helper text |
| `admin.testCatalog.sampleResults.button.copyInterpretations` | `Copy from Test...` | CTA |
| `admin.testCatalog.sampleResults.button.addInterpretation` | `Add Interpretation` | CTA |
| `admin.testCatalog.sampleResults.column.code` | `Code` | Table header |
| `admin.testCatalog.sampleResults.column.label` | `Label` | Table header |
| `admin.testCatalog.sampleResults.column.value` | `Value/Range` | Table header |
| `admin.testCatalog.sampleResults.column.interpretationText` | `Interpretation Text` | Table header |
| `admin.testCatalog.sampleResults.column.active` | `Active` | Table header |
| `admin.testCatalog.sampleResults.modal.addInterpretation` | `Add Interpretation` | Modal title |
| `admin.testCatalog.sampleResults.modal.editInterpretation` | `Edit Interpretation` | Modal title |
| `admin.testCatalog.sampleResults.label.interpCode` | `Code` | Form label |
| `admin.testCatalog.sampleResults.label.interpLabel` | `Label` | Form label |
| `admin.testCatalog.sampleResults.label.interpColor` | `Color (optional)` | Form label |
| `admin.testCatalog.sampleResults.label.interpValue` | `Value or Range` | Form label |
| `admin.testCatalog.sampleResults.label.interpText` | `Interpretation Text` | Form label |
| `admin.testCatalog.sampleResults.helper.interpCode` | `Shortcode for quick entry in result screens` | Helper text |
| `admin.testCatalog.sampleResults.placeholder.interpCode` | `e.g., GLU-HI, HIV-POS, STAGE-2` | Input placeholder |
| `admin.testCatalog.sampleResults.placeholder.interpLabel` | `e.g., Critical High, Stage II, Treatment Failure` | Input placeholder |
| `admin.testCatalog.sampleResults.placeholder.interpValue` | `e.g., >126, <70, 70-99` | Input placeholder |
| `admin.testCatalog.sampleResults.placeholder.interpText` | `Clinical interpretation, guidance, or action items...` | Textarea placeholder |
| `admin.testCatalog.sampleResults.helper.interpValue` | `Use comparison operators (>, <, ≥, ≤), ranges (70-99), or exact values` | Helper text |
| `admin.testCatalog.sampleResults.helper.interpText` | `This text will be added as an external note on the result` | Helper text |
| `admin.testCatalog.sampleResults.button.saveInterpretation` | `Add Interpretation` | Modal CTA |
| `admin.testCatalog.sampleResults.button.updateInterpretation` | `Save Changes` | Modal CTA (edit mode) |
| `admin.testCatalog.sampleResults.modal.copyInterpretations` | `Copy Interpretations from Another Test` | Modal title |
| `admin.testCatalog.sampleResults.label.searchTest` | `Search for test` | Modal label |
| `admin.testCatalog.sampleResults.placeholder.searchTest` | `Enter test name...` | Input placeholder |
| `admin.testCatalog.sampleResults.label.selectSourceTest` | `Select test:` | Modal label |
| `admin.testCatalog.sampleResults.label.interpretationsToCopy` | `Interpretations to copy:` | Modal label |
| `admin.testCatalog.sampleResults.label.importMode` | `Import mode:` | Modal label |
| `admin.testCatalog.sampleResults.option.replaceExisting` | `Replace existing interpretations` | Radio option |
| `admin.testCatalog.sampleResults.option.appendExisting` | `Append to existing interpretations` | Radio option |
| `admin.testCatalog.sampleResults.button.copySelected` | `Copy Selected` | Modal CTA |

### ranges

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.ranges.section.title` | `Reference Ranges` | Section header |
| `admin.testCatalog.ranges.helper.title` | `Define age and sex-specific reference ranges for this test` | Helper text |
| `admin.testCatalog.ranges.button.validateCoverage` | `Validate Coverage` | Toggle button |
| `admin.testCatalog.ranges.label.viewMode` | `View:` (implicitly before dropdown) | Form label |
| `admin.testCatalog.ranges.option.structuredView` | `Structured View` | Dropdown option |
| `admin.testCatalog.ranges.option.tableView` | `Table View` | Dropdown option |
| `admin.testCatalog.ranges.option.visualView` | `Visual View` | Dropdown option |
| `admin.testCatalog.ranges.section.coverageValidation` | `Age Coverage Validation` | Panel header |
| `admin.testCatalog.ranges.label.maleCoverage` | `Male` | Badge label |
| `admin.testCatalog.ranges.label.femaleCoverage` | `Female` | Badge label |
| `admin.testCatalog.ranges.status.completeCoverage` | `Complete Coverage` | Status indicator |
| `admin.testCatalog.ranges.status.issuesFound` | `{count} Issue(s) Found` | Status indicator (dynamic) |
| `admin.testCatalog.ranges.button.fillGap` | `Fill Gap` | Action button |
| `admin.testCatalog.ranges.message.coverageOk` | `All age ranges from birth to maximum age are covered.` | Info message |
| `admin.testCatalog.ranges.label.rangeType` | `{type}` (Normal, Valid, Critical, Reporting) | Group header |
| `admin.testCatalog.ranges.description.normal` | `Clinical reference values. Results outside flagged H/L on reports.` | Type description |
| `admin.testCatalog.ranges.description.valid` | `Expected possible values. Entry outside prompts verification.` | Type description |
| `admin.testCatalog.ranges.description.critical` | `Panic values requiring immediate clinical action.` | Type description |
| `admin.testCatalog.ranges.description.reporting` | `Instrument limits. Results outside may need dilution/rerun.` | Type description |
| `admin.testCatalog.ranges.button.addRange` | `Add {type}` | CTA |
| `admin.testCatalog.ranges.empty.message` | `No {type}s defined` | Empty state |
| `admin.testCatalog.ranges.empty.addPrompt` | `+ Add {type}` | Empty state CTA |
| `admin.testCatalog.ranges.label.sexSubgroup` | `{label}` (Male/Female/All) | Sub-header |
| `admin.testCatalog.ranges.label.rangeCount` | `({count} ranges)` | Count display |
| `admin.testCatalog.ranges.label.ageRange` | `Age Range` | Column label |
| `admin.testCatalog.ranges.label.low` | `Low` | Column label |
| `admin.testCatalog.ranges.label.high` | `High` | Column label |
| `admin.testCatalog.ranges.tooltip.edit` | `Edit` | Row action |
| `admin.testCatalog.ranges.tooltip.copy` | `Copy to other sex` | Row action |
| `admin.testCatalog.ranges.tooltip.delete` | `Delete` | Row action |
| `admin.testCatalog.ranges.modal.addRange` | `Add {type}` | Modal title (dynamic) |
| `admin.testCatalog.ranges.label.appliesto` | `Applies To` | Form section |
| `admin.testCatalog.ranges.option.allSex` | `All` | Sex option |
| `admin.testCatalog.ranges.option.maleOnly` | `Male Only` | Sex option |
| `admin.testCatalog.ranges.option.femaleOnly` | `Female Only` | Sex option |
| `admin.testCatalog.ranges.label.ageRangeForm` | `Age Range` | Form section |
| `admin.testCatalog.ranges.label.from` | `From` | Input label |
| `admin.testCatalog.ranges.label.to` | `To` | Input label |
| `admin.testCatalog.ranges.helper.infinity` | `Use 999 years for "no upper age limit" (infinity)` | Helper text |
| `admin.testCatalog.ranges.label.valueRange` | `Value Range` | Form section (numeric) |
| `admin.testCatalog.ranges.label.criticalThresholds` | `Critical Thresholds` | Form section (critical type) |
| `admin.testCatalog.ranges.label.criticalLow` | `Critical Low (values below this)` | Input label (critical) |
| `admin.testCatalog.ranges.label.criticalHigh` | `Critical High (values above this)` | Input label (critical) |
| `admin.testCatalog.ranges.placeholder.criticalLow` | `Leave blank if N/A` | Input placeholder |
| `admin.testCatalog.ranges.placeholder.criticalHigh` | `Leave blank if N/A` | Input placeholder |
| `admin.testCatalog.ranges.placeholder.low` | `0` | Input placeholder |
| `admin.testCatalog.ranges.placeholder.high` | `100` | Input placeholder |
| `admin.testCatalog.ranges.button.addRangeModal` | `Add Range` | Modal CTA |
| `admin.testCatalog.ranges.table.column.type` | `Type` | Table header |
| `admin.testCatalog.ranges.table.column.sex` | `Sex` | Table header |
| `admin.testCatalog.ranges.table.column.ageFrom` | `Age From` | Table header |
| `admin.testCatalog.ranges.table.column.ageTo` | `Age To` | Table header |
| `admin.testCatalog.ranges.table.column.actions` | `Actions` | Table header |
| `admin.testCatalog.ranges.visualView.label.viewRangesFor` | `View ranges for:` | Form label |
| `admin.testCatalog.ranges.visualView.label.age` | `Age:` | Form label |
| `admin.testCatalog.ranges.visualView.option.hours` | `hours` | Unit option |
| `admin.testCatalog.ranges.visualView.option.days` | `days` | Unit option |
| `admin.testCatalog.ranges.visualView.option.weeks` | `weeks` | Unit option |
| `admin.testCatalog.ranges.visualView.option.months` | `months` | Unit option |
| `admin.testCatalog.ranges.visualView.option.years` | `years` | Unit option |
| `admin.testCatalog.ranges.visualView.applicableRanges` | `Showing ranges applicable to: {sex}, {age}` | Info display (dynamic) |
| `admin.testCatalog.ranges.visualView.legend.valid` | `Valid` | Legend |
| `admin.testCatalog.ranges.visualView.legend.normal` | `Normal` | Legend |
| `admin.testCatalog.ranges.visualView.legend.critical` | `Critical` | Legend |
| `admin.testCatalog.ranges.visualView.legend.reporting` | `Reporting` | Legend |
| `admin.testCatalog.ranges.visualView.notDefined` | `Not defined for this demographic` | Message |

### sampleStorage

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.sampleStorage.section.storageRequirements` | `Storage Requirements` | Section header |
| `admin.testCatalog.sampleStorage.label.storageConditions` | `Storage Conditions` | Form label |
| `admin.testCatalog.sampleStorage.helper.storageConditions` | `Temperature range for sample preservation` | Helper text |
| `admin.testCatalog.sampleStorage.option.ultraLow` | `Ultra-low freezer (-80°C to -60°C)` | Select option |
| `admin.testCatalog.sampleStorage.option.freezer` | `Freezer (-30°C to -15°C)` | Select option |
| `admin.testCatalog.sampleStorage.option.refrigerator` | `Refrigerator (2°C to 8°C)` | Select option |
| `admin.testCatalog.sampleStorage.option.coldRoom` | `Cold room (4°C to 8°C)` | Select option |
| `admin.testCatalog.sampleStorage.option.coolRoom` | `Cool room (15°C to 18°C)` | Select option |
| `admin.testCatalog.sampleStorage.option.roomTemp` | `Room temperature (18°C to 25°C)` | Select option |
| `admin.testCatalog.sampleStorage.option.controlledRoom` | `Controlled room temp (20°C to 25°C)` | Select option |
| `admin.testCatalog.sampleStorage.option.warmIncubator` | `Warm incubator (35°C to 37°C)` | Select option |
| `admin.testCatalog.sampleStorage.option.ambient` | `Ambient (uncontrolled)` | Select option |
| `admin.testCatalog.sampleStorage.option.custom` | `Custom (specify below)` | Select option |
| `admin.testCatalog.sampleStorage.label.customConditions` | `Custom Storage Conditions` | Form label |
| `admin.testCatalog.sampleStorage.placeholder.customConditions` | `e.g., 2-8°C, protected from light` | Input placeholder |
| `admin.testCatalog.sampleStorage.helper.customConditions` | `Override or add details to selected condition` | Helper text |
| `admin.testCatalog.sampleStorage.label.maxDuration` | `Maximum Storage Duration` | Form label |
| `admin.testCatalog.sampleStorage.helper.maxDuration` | `Maximum time sample can be stored before testing` | Helper text |
| `admin.testCatalog.sampleStorage.option.hours` | `Hours` | Unit option |
| `admin.testCatalog.sampleStorage.option.days` | `Days` | Unit option |
| `admin.testCatalog.sampleStorage.option.weeks` | `Weeks` | Unit option |
| `admin.testCatalog.sampleStorage.option.months` | `Months` | Unit option |
| `admin.testCatalog.sampleStorage.label.stabilityNotes` | `Stability Notes` | Form label |
| `admin.testCatalog.sampleStorage.placeholder.stabilityNotes` | `e.g., Stable for 7 days refrigerated, 1 month frozen` | Input placeholder |
| `admin.testCatalog.sampleStorage.section.specialHandling` | `Special Handling Requirements` | Section header |
| `admin.testCatalog.sampleStorage.checkbox.protectLight` | `🔒 Protect from light` | Checkbox label |
| `admin.testCatalog.sampleStorage.checkbox.noFreeze` | `❄️ Do not freeze` | Checkbox label |
| `admin.testCatalog.sampleStorage.checkbox.noRefrigerate` | `🔥 Do not refrigerate` | Checkbox label |
| `admin.testCatalog.sampleStorage.checkbox.keepUpright` | `⬆️ Keep upright` | Checkbox label |
| `admin.testCatalog.sampleStorage.checkbox.centrifuge` | `🧪 Centrifuge before storage` | Checkbox label |
| `admin.testCatalog.sampleStorage.checkbox.aliquot` | `⚗️ Aliquot before storage` | Checkbox label |
| `admin.testCatalog.sampleStorage.section.disposal` | `Disposal Requirements` | Section header |
| `admin.testCatalog.sampleStorage.helper.disposal` | `Define how samples should be disposed after testing` | Helper text |
| `admin.testCatalog.sampleStorage.label.disposalMethod` | `Disposal Method` | Form label |
| `admin.testCatalog.sampleStorage.option.biohazard` | `Biohazard/Infectious waste bin` | Select option |
| `admin.testCatalog.sampleStorage.option.sharps` | `Sharps container` | Select option |
| `admin.testCatalog.sampleStorage.option.chemical` | `Chemical deactivation` | Select option |
| `admin.testCatalog.sampleStorage.option.incineration` | `Incineration` | Select option |
| `admin.testCatalog.sampleStorage.option.autoclave` | `Autoclave then general waste` | Select option |
| `admin.testCatalog.sampleStorage.option.pharmaceutical` | `Pharmaceutical waste` | Select option |
| `admin.testCatalog.sampleStorage.option.radioactive` | `Radioactive waste` | Select option |
| `admin.testCatalog.sampleStorage.option.generalWaste` | `General waste (non-hazardous only)` | Select option |
| `admin.testCatalog.sampleStorage.option.manufacturer` | `Return to manufacturer` | Select option |
| `admin.testCatalog.sampleStorage.label.disposalTimeframe` | `Disposal Timeframe` | Form label |
| `admin.testCatalog.sampleStorage.helper.disposalTimeframe` | `Maximum time after test completion before disposal` | Helper text |
| `admin.testCatalog.sampleStorage.section.specialInstructions` | `Special Instructions` | Section header |
| `admin.testCatalog.sampleStorage.helper.specialInstructions` | `Additional guidance for sample handling` | Helper text |
| `admin.testCatalog.sampleStorage.placeholder.specialInstructions` | `Enter any special instructions for sample handling, storage, or disposal that don't fit in the fields above...` | Textarea placeholder |
| `admin.testCatalog.sampleStorage.section.overrideRestricted` | `Override Restricted` | Section header |
| `admin.testCatalog.sampleStorage.checkbox.overrideRestricted` | `When enabled, order entry staff cannot modify storage or disposal requirements for this test.` | Checkbox label |
| `admin.testCatalog.sampleStorage.badge.locked` | `Locked` | Status badge |
| `admin.testCatalog.sampleStorage.helper.overrideRestricted` | `Use for critical tests where sample handling must be strictly controlled (e.g., HIV, controlled substances).` | Helper text |
| `admin.testCatalog.sampleStorage.alert.storageAndDisposalLocked` | `Storage and disposal settings are locked` | Alert message |
| `admin.testCatalog.sampleStorage.alert.lockedNote` | `Only Lab Managers can modify these requirements. Order entry staff will see these as read-only.` | Alert note |
| `admin.testCatalog.sampleStorage.section.quickReference` | `📋 Storage Condition Quick Reference` | Section header |

### displayOrder

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.displayOrder.section.title` | `Test Display Order` | Section header |
| `admin.testCatalog.displayOrder.helper.title` | `Drag and drop to reorder tests for this sample type` | Helper text |
| `admin.testCatalog.displayOrder.label.sampleType` | `Sample Type:` | Form label |
| `admin.testCatalog.displayOrder.option.serum` | `Serum` | Select option |
| `admin.testCatalog.displayOrder.option.plasma` | `Plasma` | Select option |
| `admin.testCatalog.displayOrder.option.wholeBlood` | `Whole Blood` | Select option |
| `admin.testCatalog.displayOrder.option.urine` | `Urine` | Select option |
| `admin.testCatalog.displayOrder.helper.info` | `This order determines how tests appear in order entry and result entry for the selected sample type.` | Helper text |

### panels

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.panels.section.title` | `Panel Membership` | Section header |
| `admin.testCatalog.panels.helper.title` | `Select which panels should include this test and set display order` | Helper text |
| `admin.testCatalog.panels.button.createNewPanel` | `Create New Panel` | CTA |
| `admin.testCatalog.panels.label.newPanelName` | `New Panel Name` | Form label |
| `admin.testCatalog.panels.placeholder.panelName` | `Enter panel name...` | Input placeholder |
| `admin.testCatalog.panels.button.createPanel` | `Create` | Modal CTA |
| `admin.testCatalog.panels.label.panelTestCount` | `{count} tests` | Info display |
| `admin.testCatalog.panels.label.position` | `Position: {order}` | Badge |
| `admin.testCatalog.panels.label.displayPosition` | `Display Position in Panel` | Form label |
| `admin.testCatalog.panels.helper.displayPosition` | `Enter a number or drag the test in the preview list` | Helper text |
| `admin.testCatalog.panels.label.panelTestOrderPreview` | `Panel Test Order Preview — drag to reorder` | Form label |
| `admin.testCatalog.panels.helper.dragDropNote` | `Drag the highlighted row to change position` | Helper text |
| `admin.testCatalog.panels.helper.instructions` | `Click on a selected panel to expand and set the display order. Use the number input or drag the test in the preview list.` | Helper text |

### labels

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.labels.section.defaultLabels` | `Default Labels for This Test` | Section header |
| `admin.testCatalog.labels.helper.defaultLabels` | `When this test is ordered, automatically suggest these labels` | Helper text |
| `admin.testCatalog.labels.button.addLabelType` | `Add Label Type` | CTA |
| `admin.testCatalog.labels.column.preset` | `Label Preset` | Table header |
| `admin.testCatalog.labels.column.defaultQty` | `Default Qty` | Table header |
| `admin.testCatalog.labels.column.maxQty` | `Max Qty` | Table header |
| `admin.testCatalog.labels.column.allowOverride` | `Allow Override` | Table header |
| `admin.testCatalog.labels.empty.message` | `No label types configured` | Empty state |
| `admin.testCatalog.labels.empty.helper` | `Add label presets to automatically suggest labels when this test is ordered` | Empty state |
| `admin.testCatalog.labels.section.labelGenerationSettings` | `Label Generation Settings` | Section header |
| `admin.testCatalog.labels.checkbox.allowCountOverride` | `Allow label count override at order entry` | Checkbox label |
| `admin.testCatalog.labels.helper.allowCountOverride` | `When enabled, users can modify label quantities during order entry. Individual label types can still be locked via the "Allow Override" column above.` | Helper text |
| `admin.testCatalog.labels.section.orderEntryPreview` | `Order Entry Preview` | Section header |
| `admin.testCatalog.labels.helper.orderEntryPreview` | `When this test is ordered, the Labels section will be pre-populated as follows:` | Helper text |
| `admin.testCatalog.labels.column.source` | `Source` | Table header |
| `admin.testCatalog.labels.helper.lockedQty` | `Gray quantities are locked and cannot be modified at order entry` | Helper text |

### terminology

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.terminology.section.title` | `Terminology Mappings` | Section header |
| `admin.testCatalog.terminology.helper.title` | `Link this test to standard terminology codes for interoperability` | Helper text |
| `admin.testCatalog.terminology.button.addMapping` | `Add Mapping` | CTA |
| `admin.testCatalog.terminology.label.source` | `Terminology Source` | Form label |
| `admin.testCatalog.terminology.option.loinc` | `LOINC` | Select option |
| `admin.testCatalog.terminology.option.snomed` | `SNOMED CT` | Select option |
| `admin.testCatalog.terminology.option.ciel` | `CIEL` | Select option |
| `admin.testCatalog.terminology.option.ocl` | `Open Concept Lab` | Select option |
| `admin.testCatalog.terminology.label.code` | `Code` | Form label |
| `admin.testCatalog.terminology.placeholder.code` | `Enter code` | Input placeholder |
| `admin.testCatalog.terminology.label.relationship` | `Relationship` | Form label |
| `admin.testCatalog.terminology.option.sameAs` | `Same As` | Select option |
| `admin.testCatalog.terminology.option.broaderThan` | `Broader Than` | Select option |
| `admin.testCatalog.terminology.option.narrowerThan` | `Narrower Than` | Select option |
| `admin.testCatalog.terminology.button.add` | `Add` | Form CTA |

### reagents

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.reagents.section.title` | `Associated Reagents` | Section header |
| `admin.testCatalog.reagents.helper.title` | `Link reagents from inventory to track consumption` | Helper text |
| `admin.testCatalog.reagents.button.linkReagent` | `Link Reagent` | CTA |
| `admin.testCatalog.reagents.empty.message` | No text (empty state not shown in mockup) | Empty state |

### analyzers

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.analyzers.section.title` | `Linked Analyzers` | Section header |
| `admin.testCatalog.analyzers.helper.title` | `Select which analyzers can perform this test` | Helper text |
| `admin.testCatalog.analyzers.button.linkAnalyzer` | `Link Analyzer` | CTA |
| `admin.testCatalog.analyzers.empty.message` | `No analyzers linked` | Empty state |
| `admin.testCatalog.analyzers.empty.helper` | `Link analyzers that can perform this test` | Empty state |
| `admin.testCatalog.analyzers.modal.title` | `Link Analyzers` | Modal title |
| `admin.testCatalog.analyzers.label.selectAnalyzers` | `Select Analyzers` | Form label |
| `admin.testCatalog.analyzers.empty.allLinked` | `All available analyzers are already linked` | Empty message |
| `admin.testCatalog.analyzers.selectedCount` | `{count} analyzer{plural} selected` | Info message (dynamic) |
| `admin.testCatalog.analyzers.button.linkSelected` | `Link Selected` | Modal CTA |
| `admin.testCatalog.analyzers.info.title` | `About Analyzer Linking` | Info card header |
| `admin.testCatalog.analyzers.info.adminLink` | `Administration → Master Lists → Analyzers` | Info text |
| `admin.testCatalog.analyzers.info.testCodeMapping` | `Test code mapping is configured separately in the analyzer interface setup` | Info text |
| `admin.testCatalog.analyzers.info.linkingMeans` | `Linking an analyzer indicates this test can be performed on that instrument` | Info text |
| `admin.testCatalog.analyzers.tooltip.unlink` | `Unlink analyzer` | Tooltip |

### alerts

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.alerts.section.title` | `Alert Rules` | Section header |
| `admin.testCatalog.alerts.helper.title` | `Configure automated notifications when specific result conditions are met` | Helper text |
| `admin.testCatalog.alerts.button.addRule` | `Add Rule` | CTA |
| `admin.testCatalog.alerts.empty.message` | `No alert rules configured` | Empty state |
| `admin.testCatalog.alerts.empty.addFirstRule` | `+ Add your first alert rule` | Empty state CTA |
| `admin.testCatalog.alerts.modal.title` | `Add Alert Rule` | Modal title |
| `admin.testCatalog.alerts.label.ruleName` | `Rule Name` | Form label |
| `admin.testCatalog.alerts.placeholder.ruleName` | `e.g., Critical Value SMS Alert` | Input placeholder |
| `admin.testCatalog.alerts.label.triggerCondition` | `Alert when result is:` | Form label |
| `admin.testCatalog.alerts.option.allResults` | `All Results` | Radio option |
| `admin.testCatalog.alerts.option.abnormal` | `Abnormal (outside normal range)` | Radio option |
| `admin.testCatalog.alerts.option.critical` | `Critical (panic value)` | Radio option |
| `admin.testCatalog.alerts.option.specificValue` | `Specific Value` | Radio option |
| `admin.testCatalog.alerts.label.sendVia` | `Send via:` | Form label |
| `admin.testCatalog.alerts.option.sms` | `SMS` | Checkbox label |
| `admin.testCatalog.alerts.option.email` | `Email` | Checkbox label |
| `admin.testCatalog.alerts.label.recipients` | `Recipients:` | Form label |
| `admin.testCatalog.alerts.option.orderingPhysician` | `Ordering Physician (from order)` | Checkbox label |
| `admin.testCatalog.alerts.option.patient` | `Patient (from patient record)` | Checkbox label |
| `admin.testCatalog.alerts.option.customRecipient` | `Custom recipient:` | Checkbox label |
| `admin.testCatalog.alerts.placeholder.customPhone` | `Phone: +1 555-123-4567` | Input placeholder |
| `admin.testCatalog.alerts.placeholder.customEmail` | `Email: user@example.com` | Input placeholder |
| `admin.testCatalog.alerts.label.smsTemplate` | `SMS Template (160 char recommended)` | Form label |
| `admin.testCatalog.alerts.placeholder.smsTemplate` | `CRITICAL: {{test_name}} {{result}} {{unit}} for {{patient_name}}. Review immediately.` | Textarea placeholder |
| `admin.testCatalog.alerts.helper.smsVariables` | `Variables: {{patient_name}}, {{patient_id}}, {{test_name}}, {{result}}, {{unit}}, {{reference_range}}` | Helper text |
| `admin.testCatalog.alerts.column.ruleName` | `Rule Name` | Table column |
| `admin.testCatalog.alerts.column.status` | `Status` | Table column |
| `admin.testCatalog.alerts.label.when` | `When` | Rule detail label |
| `admin.testCatalog.alerts.label.notifyVia` | `Notify Via` | Rule detail label |
| `admin.testCatalog.alerts.label.recipients` | `Recipients` | Rule detail label |
| `admin.testCatalog.alerts.label.smsTemplate` | `SMS Template` | Rule detail label |

### reflexCalc

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.reflexCalc.section.reflexTests` | `Reflex Tests` | Section header |
| `admin.testCatalog.reflexCalc.helper.reflexTests` | `Automatic test ordering based on results` | Helper text |
| `admin.testCatalog.reflexCalc.label.triggeredBy` | `Rules triggered BY this test:` | Sub-section label |
| `admin.testCatalog.reflexCalc.empty.noRulesByThis` | `No reflex rules configured for this test` | Empty state |
| `admin.testCatalog.reflexCalc.label.orderThis` | `Rules that ORDER this test:` | Sub-section label |
| `admin.testCatalog.reflexCalc.empty.noRulesThatOrder` | `No other tests trigger this test as a reflex` | Empty state |
| `admin.testCatalog.reflexCalc.button.addNewReflex` | `Add New Reflex Rule in Master Lists` | CTA |
| `admin.testCatalog.reflexCalc.section.calculatedResults` | `Calculated Results` | Section header |
| `admin.testCatalog.reflexCalc.helper.calculatedResults` | `Formulas that compute results from other test values` | Helper text |
| `admin.testCatalog.reflexCalc.label.calculationsUsingThis` | `Calculations that USE this test as input:` | Sub-section label |
| `admin.testCatalog.reflexCalc.empty.notUsedInCalculations` | `This test is not used as input for any calculated results` | Empty state |
| `admin.testCatalog.reflexCalc.label.thisTestIsCalculated` | `This test IS a calculated result:` | Sub-section label |
| `admin.testCatalog.reflexCalc.empty.notCalculated` | `This test's result is not calculated from other values` | Empty state |
| `admin.testCatalog.reflexCalc.button.configureCalculated` | `Configure in Master Lists` | Empty state CTA |
| `admin.testCatalog.reflexCalc.label.formulaConfigured` | `Formula configured` | Info label |
| `admin.testCatalog.reflexCalc.button.editReflex` | `Edit in Master Lists` | Inline link |
| `admin.testCatalog.reflexCalc.mode.autoOrder` | `Auto-order` | Status badge |
| `admin.testCatalog.reflexCalc.mode.suggest` | `Suggest` | Status badge |

### compliance

| Key | English fallback | Used in |
|-----|------------------|---------|
| `admin.testCatalog.compliance.section.title` | `Compliance Thresholds` | Section header |
| `admin.testCatalog.compliance.helper.title` | `Regulatory compliance thresholds for this test. Environmental tests use these instead of (or alongside) clinical reference ranges.` | Helper text |
| `admin.testCatalog.compliance.helper.adminLink` | `Full compliance standards are managed at Admin → Test Management → Compliance Standards.` | Helper text |
| `admin.testCatalog.compliance.label.groupBy` | `Group by:` | Form label |
| `admin.testCatalog.compliance.option.standard` | `Standard` | Select option |
| `admin.testCatalog.compliance.option.parameterGroup` | `Parameter Group` | Select option |
| `admin.testCatalog.compliance.button.addThreshold` | `Add Threshold` | CTA |
| `admin.testCatalog.compliance.column.standard` | `Standard` | Table header |
| `admin.testCatalog.compliance.column.parameterGroup` | `Parameter Group` | Table header |
| `admin.testCatalog.compliance.column.type` | `Type` | Table header |
| `admin.testCatalog.compliance.column.value` | `Value` | Table header |
| `admin.testCatalog.compliance.column.effectiveDate` | `Effective Date` | Table header |
| `admin.testCatalog.compliance.type.max` | `MAX` | Badge |
| `admin.testCatalog.compliance.type.min` | `MIN` | Badge |
| `admin.testCatalog.compliance.type.range` | `RANGE` | Badge |
| `admin.testCatalog.compliance.type.descriptive` | `DESCRIPTIVE` | Badge |

**Summary**

- **Total keys extracted**: 234
- **Common-namespace keys** (reused across surfaces): 24 (base verbs, status indicators, labels)
- **Surface-specific keys**: 210
- **Top 3 ambiguities/judgment calls**:
  1. **Sex label unification**: Male/Female/All labels appear as both visual badges and form options; unified under common surface to encourage reuse rather than surface-specific variants.
  2. **Empty state messaging**: "No {type} configured" strings parameterized in common where type is inferred (panels, rules, etc.); some surfaces kept explicit variants for grammatical correctness.
  3. **Button CTAs across modals**: "Add", "Create", "Save" used contextually in both list and editor; namespace hierarchy disambiguates ("button.add" vs "button.addRange") rather than creating collision aliases.

**Strings intentionally skipped**:
- Mock data test/section names (Glucose, Hemoglobin A1c, Chemistry, Hematology, etc.) — live data, not UI labels.
- LOINC codes and lab numbers in demo data — reference values, not visible strings.
- Temporary UI text in component descriptions (e.g., "Component Demo: {label}" in demo selector) — internal dev mode, not shipped UI.
- CSS utility class names and icon names (Lucide React icon imports) — implementation details.
- Formula/variable macro text in templates (e.g., "{{test_name}}") — dynamic substitution markers, not localized user-facing strings.

**Runtime fallback behavior** (separate from key namespacing) is documented in the **Localization Hardening** section later in this FRS.

---

## New Features Summary

| Feature | Description |
|---------|-------------|
| **Functional Coverage Validation** | Clickable gaps that pre-fill the add range form with suggested values |
| **Test Ordering** | Drag-and-drop ordering of tests within a sample type |
| **Panel Association** | Select panels for this test, with inline panel creation |
| **Inline Method Creation** | Create new methods without leaving the test editor |
| **Multi-Select Test Sections** | Test can belong to multiple laboratory units |
| **Hour-Level Normal Ranges** | Support for neonatal ranges at hour granularity |
| **AMR Test Flag** | Mark tests for WHONET export and AMR surveillance |
| **Alert Rules** | Configure notifications for critical/abnormal values |
| **Reflex & Calculated Tab** | View reflex rules and calculated result relationships |
| **Sample Storage Tab** | Define storage conditions, duration, disposal, and special handling |
| **Internal QA Flag** | "Internal QA - No Results Release" replaces "In Lab Only" |
| **Result Interpretations** | Configure condition-based interpretations added as external notes to results |
| **Shortcodes for Methods & Interpretations** | Macro-style quick entry codes for fast selection in result entry screens |
| **Copy from Test** | Copy methods or interpretations from another test |
| **Labels Tab** | Configure default label presets and quantities for test orders |
| **Label Presets Management** | Admin-configurable label types with dimensions, fields, and barcode settings |
| **Reagents Tab** | Link reagents from inventory to track consumption per test |
| **Analyzers Tab** | Link analyzers that can perform this test |
| **Compliance Tab** | Manage regulatory compliance thresholds (Baku Mutu, WHO, EPA) per test — see S-01 FRS |

---

## Test Editor Status Flags

The Basic Info section includes the following status flags:

| Flag | Description |
|------|-------------|
| **Active** | Test is available for ordering and use |
| **Orderable** | Test appears in order entry screens |
| **Internal QA - No Results Release** | Test results will not appear on patient reports. Use for internal quality assurance tests, proficiency testing, or instrument verification. |

---

## Test Domain

Every test record carries a single mandatory **Domain** attribute that classifies the test into one of three mutually-exclusive categories. Domain controls which test editor sections are emphasized for that test, and powers the Domain filter on the Test List View.

### Field Definition

| Property | Value |
|---|---|
| **Field name** | `domain` |
| **Type** | Enumerated, single-select (radio buttons in the UI) |
| **Allowed values** | `CLINICAL`, `ENVIRONMENTAL`, `VECTOR` |
| **Required** | Yes |
| **Default for new tests** | None — user must choose. Cannot save Basic Info without a selection. |
| **Mutability after creation** | Editable, but changes show a confirmation modal warning that section visibility may change and that historical results were evaluated against the prior domain's rules. |
| **Placement in editor** | Basic Info section, near the top, alongside Test Name and Test Code. |

### Domain Definitions

| Domain | Description | Typical examples |
|---|---|---|
| **CLINICAL** | Patient-facing diagnostic tests. Results are evaluated against patient-centric reference ranges (Normal, Valid, Critical, Reporting). | Fasting glucose, HbA1c, CBC, HIV viral load, troponin |
| **ENVIRONMENTAL** | Tests on environmental samples (water, air, soil, food, surface swabs). Results are evaluated against externally-published regulatory thresholds (Baku Mutu, WHO Drinking Water Guidelines, EPA limits). | Water turbidity, lead in drinking water, PM2.5 in air, fecal coliform |
| **VECTOR** | Tests on vector specimens (mosquito pools, ticks, rodent samples) for surveillance of vector-borne diseases. Results may be evaluated against either clinical or surveillance thresholds depending on the program. | Aedes pool RT-PCR for dengue, Anopheles speciation, malaria parasite detection in mosquito |

### Domain-Conditional Section Visibility

Domain controls which sections appear in the editor SideNav for a given test:

| Section | CLINICAL | ENVIRONMENTAL | VECTOR |
|---|:---:|:---:|:---:|
| Basic Info | ✓ | ✓ | ✓ |
| Sample & Results | ✓ | ✓ | ✓ |
| Methods | ✓ | ✓ | ✓ |
| Ranges | ✓ (primary) | ✓ (de-emphasized) | ✓ (de-emphasized) |
| Sample Storage | ✓ | ✓ | ✓ |
| Display Order | ✓ | ✓ | ✓ |
| Panels | ✓ | ✓ | ✓ |
| Labels | ✓ | ✓ | ✓ |
| Terminology | ✓ | ✓ | ✓ |
| Reagents | ✓ | ✓ | ✓ |
| Analyzers | ✓ | ✓ | ✓ |
| Alerts | ✓ | ✓ | ✓ |
| Reflex & Calc | ✓ | ✓ | ✓ |
| **Compliance** | **hidden** | ✓ (primary) | ✓ (primary) |

**De-emphasis rules:**
- For ENVIRONMENTAL and VECTOR tests, the **Ranges** section displays a Carbon `<InlineNotification kind="info">` at the top: *"This is an {Environmental | Vector} test. Compliance thresholds are typically the primary evaluation surface for this domain. Configure clinical reference ranges only if your lab also reports them for QA or staff use."*
- For CLINICAL tests, the **Compliance** section is hidden from the SideNav entirely. Direct navigation to its route returns the standard No-permission empty state (see the States section).

### Domain Switch Confirmation

If a user changes the Domain on an existing test:

- Show a Carbon `<Modal>` with the title "Change test domain?" before saving.
- Body lists the SideNav changes that will take effect (e.g., "Compliance section will be hidden" or "Compliance section will become available").
- Body warns: "Historical results entered before this change were evaluated against the previous domain's rules. New results will use the new domain's rules."
- Primary action: "Change Domain". Secondary: "Cancel".

### Data Model

```sql
ALTER TABLE test
  ADD COLUMN domain VARCHAR(20) NOT NULL CHECK (domain IN ('CLINICAL', 'ENVIRONMENTAL', 'VECTOR'));

CREATE INDEX idx_test_domain ON test(domain);
```

**Migration:** existing test rows are backfilled with `domain = 'CLINICAL'` because the overwhelming majority of historical OpenELIS deployments are clinical-only. Deployments with environmental or vector tests will need an admin sweep to re-classify after the migration runs (call out in the migration notes).

### Acceptance Criteria

- [ ] Test entity has a `domain` column constrained to `CLINICAL`, `ENVIRONMENTAL`, or `VECTOR`
- [ ] Basic Info section presents Domain as a radio button group with the three options
- [ ] Saving a new test fails validation if Domain is not selected
- [ ] CLINICAL tests do not show the Compliance section in the SideNav
- [ ] ENVIRONMENTAL and VECTOR tests show the Compliance section
- [ ] ENVIRONMENTAL and VECTOR tests show an InlineNotification info banner on the Ranges section
- [ ] Editing Domain on an existing test triggers a confirmation modal before save
- [ ] Existing tests are backfilled to `CLINICAL` during migration
- [ ] Test List View has a Domain filter (see Test List View Enhancements)

---

## Sample & Results Configuration

The Sample & Results section of the test editor combines sample type configuration, result type / unit / formatting configuration, and the result interpretations table (see the Result Interpretations section that follows).

### Sample Type Configuration

| Field | Type | Required | Description |
|---|---|---|---|
| **Sample Types** | Multi-select checkbox list | Yes (≥1) | Which sample types are accepted for this test. Examples: Serum, Plasma, Whole Blood, Urine, CSF, Water, Mosquito Pool. The available list is configured per deployment under Master Lists → Sample Types. |
| **Default Sample Type** | Single-select dropdown | No | When the test is ordered and multiple sample types are accepted, this is pre-selected on the order entry screen. Must be a member of the selected Sample Types set. |

**UI behavior:**
- The Default Sample Type dropdown only shows values from the Sample Types multi-select. If the multi-select is empty, the Default dropdown is disabled.
- Removing a sample type from the multi-select that is currently the Default clears the Default and shows a Carbon `<InlineNotification kind="warning">`: "Default Sample Type was removed because it is no longer in the accepted Sample Types."

### Result Type Configuration

| Field | Type | Required | Description |
|---|---|---|---|
| **Result Type** | Single-select dropdown | Yes | One of `NUMERIC`, `SELECT_LIST`, `MULTI_SELECT`, `FREE_TEXT`. Determines which downstream fields are enabled and how Result Interpretations are configured. |
| **Unit of Measure** | Single-select dropdown | Yes (when Result Type = NUMERIC) | Unit shown alongside the result value. Examples: mg/dL, mmol/L, g/dL, µL, %, mg/L, NTU. The available unit list is configured per deployment under Master Lists → Units of Measure. Disabled when Result Type is not NUMERIC. |
| **Significant Digits** | Number (0–6) | No (defaults to 0) | Number of digits after the decimal point shown in result entry and on reports. Disabled when Result Type is not NUMERIC. |
| **Default Result** | Text | No | Optional default value pre-filled in the result entry field for this test. Useful for tests where the most common result is constant (e.g., "Negative" for a screening test). |

### Result Type Definitions

| Result Type | Description | Result Entry UI |
|---|---|---|
| **NUMERIC** | A numeric value with a unit and reference range. | Number input with unit suffix; H/L flagging based on Normal Range. |
| **SELECT_LIST** | One value chosen from a configured list. | Carbon `<Dropdown>` populated from the test's Select List Options. |
| **MULTI_SELECT** | Multiple values chosen from a configured list. | Carbon `<MultiSelect>` populated from the test's Select List Options. |
| **FREE_TEXT** | An arbitrary text result (e.g., a microscopy description). | Carbon `<TextArea>`. |

### Select List Options

When Result Type is `SELECT_LIST` or `MULTI_SELECT`, the editor exposes a Select List Options sub-table:

| Field | Type | Required | Description |
|---|---|---|---|
| **Value** | String | Yes | The option value as it appears in result entry (e.g., "Positive", "Negative", "Indeterminate"). |
| **Display Order** | Integer | Yes | Order the option appears in the dropdown / multi-select. |
| **Active** | Boolean | Yes | Inactive options are hidden in result entry but preserved on historical results. |

The sub-table supports drag-and-drop reordering (via the same drag pattern used in the Result Interpretations table) and inline add/edit. A "Configure Options..." button is the entry point.

### Acceptance Criteria

- [ ] Sample Types multi-select accepts ≥1 selection and emits a validation error if empty
- [ ] Default Sample Type dropdown is disabled until at least one Sample Type is selected, and only shows values from the selected set
- [ ] Removing the Default Sample Type from the multi-select clears the Default and shows a warning notification
- [ ] Result Type dropdown offers exactly four options: Numeric, Select List, Multi-select, Free Text
- [ ] Unit of Measure and Significant Digits are disabled when Result Type is not Numeric
- [ ] Significant Digits accepts integers 0–6
- [ ] Default Result is optional, free text
- [ ] Select List Options sub-table appears only for Select List and Multi-select result types
- [ ] Select List Options support drag-and-drop reordering, inline add/edit, and active/inactive toggle

---

## Result Interpretations

### Purpose

Configure interpretive labels and clinical guidance that are automatically added to results as external notes. This allows standardized clinical guidance to accompany result values without manual entry. 

Labels are **fully customizable** - they can represent simple concepts like "High" or "Low", or more complex clinical classifications like cancer staging, treatment responses, diagnostic categories, or any other interpretive framework relevant to the test.

### Interpretation Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Code** | String | Yes | Unique shortcode for macro entry (e.g., "STAGE-2", "TX-FAIL") |
| **Label** | String | Yes | Display label for the interpretation (any text) |
| **Color** | Dropdown | No | Optional color for visual distinction |
| **Value/Range** | Text Input | Yes (numeric) | Threshold, range, or comparison for numeric tests |
| **Selected Value(s)** | Checkboxes | Yes (select) | One or more select list options that trigger this interpretation |
| **Interpretation Text** | Textarea | Yes | Clinical guidance displayed as external note |
| **Is Active** | Boolean | Yes | Enable/disable this interpretation |

### Value Field Adapts to Test Type

The value field in the Add/Edit Interpretation modal **automatically adapts** based on the test's result type. This ensures the system can properly match results to interpretations and suggest appropriate clinical guidance.

**For Numeric Tests:**
```
┌─────────────────────────────────────────────────────────┐
│ Value or Range *                                        │
│ [>126___________________________] (text input)          │
│ Use comparison operators (>, <, >=, <=), ranges (70-99) │
└─────────────────────────────────────────────────────────┘
```
- Text input field for entering numeric expressions
- Supports: `>N`, `<N`, `>=N`, `<=N`, `N-M` (range), exact values
- System evaluates numeric result against these expressions

**For Select List Tests:**
```
┌─────────────────────────────────────────────────────────┐
│ When Value(s) Selected *                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☑ Positive                                          │ │
│ │ ☐ Negative                                          │ │
│ │ ☐ Indeterminate                                     │ │
│ │ ☑ Reactive                                          │ │
│ │ ☐ Non-Reactive                                      │ │
│ └─────────────────────────────────────────────────────┘ │
│ Selected: [Positive ×] [Reactive ×]                     │
│ Select one or more values that trigger this interpret.  │
└─────────────────────────────────────────────────────────┘
```
- Checkbox list populated from the test's configured select list options
- **Can select 1 or more options** that will trigger the same interpretation
- Selected values shown as removable tags below the list
- Any matching value triggers the interpretation

### Interpretation Suggestion Behavior

When a result is entered, the system evaluates the value against configured interpretations:

**Numeric Example:**
```
Test: Fasting Glucose
Result entered: 142 mg/dL

System checks interpretations:
  - GLU-CRIT-H: >400 → No match
  - GLU-HI: >126 → MATCH (142 > 126)
  - GLU-NL: 70-99 → No match
  
Suggested interpretation: "High" with associated clinical text
```

**Select List Example (Single Value):**
```
Test: HIV Rapid Test
Result selected: "Reactive"

System checks interpretations:
  - HIV-POS: [Reactive, Positive] → MATCH (Reactive in list)
  - HIV-NEG: [Non-Reactive, Negative] → No match
  
Suggested interpretation: "Positive" with associated clinical text
```

**Select List Example (Multiple Trigger Values):**
```
Test: Hepatitis Panel
Interpretation "Acute Infection" configured for: [Reactive, Positive, Detected]

Result selected: "Detected"
→ MATCH - suggests "Acute Infection" interpretation

Result selected: "Reactive"  
→ MATCH - suggests "Acute Infection" interpretation

Result selected: "Negative"
→ No match
```

### Available Colors

| Color | Use Case Examples |
|-------|-------------------|
| Red | Critical values, positive diagnoses, treatment failures |
| Orange | High values, warnings, borderline results |
| Yellow | Low values, caution, monitoring needed |
| Green | Normal values, negative results, treatment success |
| Teal | Special categories, follow-up needed |
| Blue | Informational, reference ranges |
| Purple | Staging, classifications, special protocols |
| Pink | Specific categories, gender-specific |
| Gray | Default, neutral, unclassified |

### Value/Range Syntax (Numeric Tests)

| Syntax | Description | Example |
|--------|-------------|---------|
| `>N` | Greater than N | `>126` |
| `>=N` | Greater than or equal to N | `>=6.5` |
| `<N` | Less than N | `<70` |
| `<=N` | Less than or equal to N | `<=50` |
| `N-M` | Range from N to M (inclusive) | `70-99` |
| `=N` or `N` | Exact value | `=0` or `Positive` |

### Example: Traditional Lab Values (Fasting Glucose)

| Code | Label | Color | Value | Interpretation |
|------|-------|-------|-------|----------------|
| GLU-CRIT-H | Critical High | Red | >400 | CRITICAL: Glucose severely elevated. Immediate clinical attention required. |
| GLU-HI | High | Orange | >126 | Elevated fasting glucose. Consider diabetes screening. |
| GLU-NL | Normal | Green | 70-99 | Fasting glucose within normal limits. |
| GLU-LO | Low | Yellow | <70 | Hypoglycemia. Evaluate for symptoms and underlying cause. |
| GLU-CRIT-L | Critical Low | Red | <50 | CRITICAL: Severe hypoglycemia. Immediate intervention required. |

### Example: Cancer Staging (PSA with Clinical Context)

| Code | Label | Color | Value | Interpretation |
|------|-------|-------|-------|----------------|
| PSA-NL | Normal | Green | <4.0 | PSA within normal limits. Routine screening per guidelines. |
| PSA-GRAY | Gray Zone | Yellow | 4.0-10.0 | PSA in gray zone. Consider free PSA ratio, PHI, or repeat testing. |
| PSA-ELEV | Elevated | Orange | 10.1-20.0 | Elevated PSA. Recommend urology referral and consider biopsy. |
| PSA-HIGH | Significantly Elevated | Red | >20.0 | Significantly elevated PSA. Urgent urology referral. Staging workup recommended. |
| PSA-VELOC | Rapid Rise | Purple | velocity >0.75 | PSA velocity concerning. Enhanced monitoring or intervention indicated. |

### Example: Infectious Disease (HIV Viral Load)

| Code | Label | Color | Value | Interpretation |
|------|-------|-------|-------|----------------|
| VL-TND | Target Not Detected | Green | <20 | Viral load undetectable. Optimal viral suppression achieved. |
| VL-SUPP | Suppressed | Green | 20-200 | Low-level viremia. Generally considered suppressed. Continue current regimen. |
| VL-BLIP | Viral Blip | Yellow | 201-1000 | Viral blip detected. Repeat testing in 4 weeks. Assess adherence. |
| VL-FAIL | Virologic Failure | Red | >1000 | Virologic failure. Resistance testing recommended. Consider regimen change. |
| VL-HIGH | High Viral Load | Red | >100000 | High viral load. Assess for acute infection or treatment failure. |

### Example: Treatment Response (Oncology)

| Code | Label | Color | Value | Interpretation |
|------|-------|-------|-------|----------------|
| TX-CR | Complete Response | Green | =0 | Complete response. No detectable disease. Continue surveillance. |
| TX-PR | Partial Response | Teal | 1-50 | Partial response. >50% reduction from baseline. Continue current therapy. |
| TX-SD | Stable Disease | Yellow | 51-125 | Stable disease. Consider continuation or clinical trial options. |
| TX-PD | Progressive Disease | Red | >125 | Progressive disease. >25% increase from nadir. Recommend therapy change. |

### Example: Select List Test (Hepatitis B Surface Antigen)

| Code | Label | Color | Selected Value(s) | Interpretation |
|------|-------|-------|-------------------|----------------|
| HBSAG-R | Reactive | Red | Reactive, Positive | HBsAg reactive indicates active HBV infection. Order confirmatory test and liver panel. |
| HBSAG-NR | Non-Reactive | Green | Non-Reactive, Negative | HBsAg non-reactive. No evidence of active HBV infection. Consider vaccination. |
| HBSAG-IND | Indeterminate | Yellow | Indeterminate, Equivocal | Result indeterminate. Repeat testing in 2-4 weeks with fresh sample. |

### Add/Edit Interpretation Modal

The Add Interpretation modal includes:

**For All Tests:**
- Code field (uppercase, shortcode for quick entry)
- Label field (free text - any descriptive label)
- Color dropdown (optional - for visual distinction)
- Interpretation text (clinical guidance)
- Active checkbox

**For Numeric Tests:**
- Value/Range input (e.g., ">126", "70-99", "<50")

**For Select List Tests:**
- "When Value Selected" dropdown (populated from test's select list options)

**Live Preview:**
- Shows the label with selected color as it will appear in the table

### Copy from Test

Users can copy interpretations from another test:
1. Click "Copy from Test..." button
2. Search and select source test
3. Test list shows result type badge (Numeric/Select List)
4. Preview interpretations with labels, colors, and values
5. Choose import mode:
   - **Replace existing**: Remove current interpretations, add copied ones
   - **Append to existing**: Add copied interpretations to current list
6. Confirm copy

**Note:** Labels and colors are fully preserved when copying. Users can edit after copying if adjustments are needed.

---

## Shortcodes for Macro-Style Input

### Purpose

Both Methods and Interpretations have a **Code** field that acts as a shortcode/macro for quick entry in the result entry screen. This enables lab technicians to rapidly select methods or add interpretations without navigating dropdowns.

### Method Shortcodes

| Code | Method Name |
|------|-------------|
| HEX | Hexokinase Method |
| GOX | Glucose Oxidase Method |
| ELEC | Electrode Method |
| GOD-PAP | Enzymatic (GOD-PAP) |
| ISE | Ion-Selective Electrode |

### Result Entry Integration

In the result entry screen:

**Method Selection:**
- Type method code (e.g., "HEX") in method field
- Press Tab or Enter to auto-select the method
- Autocomplete dropdown shows matching codes as user types

**Interpretation Entry:**
- Type interpretation code (e.g., "CRITH") in interpretation field
- Press Tab or Enter to add interpretation as external note
- Multiple codes can be entered to add multiple interpretations

### Code Requirements

- **Unique**: Codes must be unique within their scope (method codes globally, interpretation codes per test)
- **Format**: Alphanumeric, uppercase, no spaces (e.g., "HEX", "GLU-CRIT-H")
- **Length**: Recommended 3-10 characters for ease of typing

---

## Labels Tab

### Purpose

Configure default label presets and quantities to be automatically suggested when this test is ordered. This enables labs to pre-define labeling requirements for each test type.

### Labels Tab UI

The Labels tab allows admins to:
1. Add multiple label presets to a test
2. Set default and maximum quantities per preset
3. Enable/disable user override at order entry

### Configuration Options

| Field | Description |
|-------|-------------|
| **Label Preset** | Dropdown of active label presets from Master Lists |
| **Default Qty** | Pre-populated quantity when test is ordered |
| **Max Qty** | Maximum allowed quantity (enforced at Order Entry) |
| **Allow Override** | If unchecked, user cannot change quantity at Order Entry |

### Label Generation Settings

- **Allow label count override at order entry**: Global setting that permits users to modify label quantities during order entry
- Individual label types can still be locked via the "Allow Override" column

### Order Entry Integration

When tests are selected during Order Entry:
1. System reads label config for each selected test
2. Aggregates across all tests ordered for the sample
3. Pre-populates the Labels section on the Add Order step

**Aggregation Rules:**

| Scenario | Rule |
|----------|------|
| Same label type from multiple tests | Use **highest** default quantity |
| Different label types | Include all types |
| Test with no label config | Use system defaults from Barcode Configuration |
| Override disabled for test | User cannot edit that label count (read-only) |

**Source Display:**
Order Entry shows which test drove each label count for transparency.

---

## Label Preset Management

### Location

Administration → Master Lists → Label Presets

### List View

| Column | Description |
|--------|-------------|
| Name | Preset name (e.g., "Cryo Vial Label") |
| Category | Order, Specimen, Pathology, Storage |
| Size (mm) | Height × Width |
| Fields | Number of fields configured |
| Status | Active / Inactive |
| Actions | Edit, Delete (system presets locked) |

### System Presets (Cannot be deleted)

- Order Label
- Specimen Label
- Block Label
- Slide Label
- Freezer Label

### Preset Editor

**Basic Information:**
- Preset Name (required, unique)
- Category (Order | Specimen | Pathology | Storage)
- Description
- Active (checkbox)

**Dimensions:**
- Height (mm)
- Width (mm)
- Barcode Type (Code 128 | QR Code | DataMatrix)
- Barcode Position (Top | Bottom | Left | Right)

**Content Fields:**
- Selectable fields with checkboxes
- Line number assignment for layout
- Drag-and-drop reordering
- Live preview updates in real-time

### Available Label Fields

| Field Code | Display Name | Description |
|------------|--------------|-------------|
| LAB_NUMBER | Lab Number | Order/sample lab number (mandatory) |
| SAMPLE_ITEM_ID | Sample Item ID | Unique identifier for the sample item |
| PATIENT_ID | Patient ID | Patient identifier |
| PATIENT_NAME | Patient Name | Patient full name |
| PATIENT_DOB | Patient DOB | Date of birth |
| PATIENT_SEX | Patient Sex | Gender |
| REFERRING_SITE | Referring Site | Ordering/referring site |
| COLLECTION_DATE | Collection Date | Sample collection date |
| COLLECTION_TIME | Collection Time | Sample collection time |
| COLLECTED_BY | Collected By | Person who collected sample |
| SPECIMEN_TYPE | Specimen Type | Type of specimen |
| TESTS | Tests | Ordered tests |
| STORAGE_LOCATION | Storage Location | Freezer/shelf location |
| EXPIRY_DATE | Expiry Date | Sample expiration |
| BLOCK_ID | Block ID | Pathology block identifier |
| SLIDE_ID | Slide ID | Slide identifier |
| STAIN_TYPE | Stain Type | Stain used |
| CASE_NUMBER | Case Number | Pathology case number |

**Note:** Lab Number is the only mandatory field. All others are optional.

### Database Tables

**label_preset:**
- id, name, category, description
- height_mm, width_mm, barcode_type, barcode_position
- is_system, is_active, created_date, last_modified

**label_preset_field:**
- id, preset_id, field_code, display_order, line_number

**test_label_config:**
- id, test_id, preset_id, default_qty, max_qty, allow_override

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/label-presets` | List all label presets |
| GET | `/api/label-presets/{id}` | Get preset details |
| POST | `/api/label-presets` | Create new preset |
| PUT | `/api/label-presets/{id}` | Update preset |
| DELETE | `/api/label-presets/{id}` | Delete preset (if not system/in-use) |
| GET | `/api/label-presets/{id}/preview` | Get preview image |
| GET | `/api/tests/{id}/labels` | Get label config for test |
| PUT | `/api/tests/{id}/labels` | Update label config for test |
| GET | `/api/orders/label-defaults?tests={ids}` | Get aggregated label defaults |

---

## Terminology Mappings

### Purpose

Link this test to standard terminology codes (LOINC, SNOMED CT, CIEL, Open Concept Lab) to enable interoperability with FHIR-based health information exchanges, OpenMRS, and national health information systems. Per Constitution III (FHIR/IHE Standards Compliance), every test exposed externally MUST have at least one canonical terminology mapping.

### Mapping Fields

| Field | Type | Required | Description |
|---|---|---|---|
| **Terminology Source** | Enum | Yes | One of `LOINC`, `SNOMED`, `CIEL`, `OCL` |
| **Code** | String | Yes | The code in the source terminology (e.g., LOINC `1558-6`, SNOMED `271062006`) |
| **Display Name** | String | Yes (auto-fetched) | Human-readable name from the source terminology — populated automatically from a terminology lookup service when available, otherwise editable |
| **Relationship** | Enum | Yes | One of `SAME_AS`, `BROADER_THAN`, `NARROWER_THAN` — describes how the OpenELIS test relates to the external concept |

### Supported Terminology Sources

| Source | Description | Reference URL |
|---|---|---|
| **LOINC** | Logical Observation Identifiers Names and Codes — international standard for laboratory test identification | https://loinc.org |
| **SNOMED CT** | Systematized Nomenclature of Medicine - Clinical Terms — broader clinical concept terminology | https://snomed.org |
| **CIEL** | Columbia International eHealth Laboratory dictionary — used in OpenMRS deployments | https://wiki.openmrs.org/display/docs/CIEL+Dictionary |
| **OCL** | Open Concept Lab — multi-organization concept dictionary platform | https://openconceptlab.org |

### Relationship Semantics

| Relationship | Meaning | Example |
|---|---|---|
| **SAME_AS** | The OpenELIS test is functionally identical to the source concept | OpenELIS "Fasting Glucose" SAME_AS LOINC `1558-6` ("Fasting glucose [Mass/volume] in Serum or Plasma") |
| **BROADER_THAN** | The OpenELIS test is a more general concept than the source code | OpenELIS "Glucose" BROADER_THAN LOINC `1558-6` (the OE test covers fasting and random glucose) |
| **NARROWER_THAN** | The OpenELIS test is a more specific concept than the source code | OpenELIS "Capillary Fasting Glucose" NARROWER_THAN LOINC `1558-6` |

### UI Elements

**Mappings List:**
- Per-mapping card (Carbon `<Tile>`):
  - Source as a colored Carbon `<Tag>` (LOINC = `kind="blue"`, SNOMED = `kind="teal"`, CIEL = `kind="purple"`, OCL = `kind="cyan"`)
  - Code in monospace font
  - Relationship as a small Carbon `<Tag kind="warm-gray">`
  - Display name in normal text below
  - Edit + Delete actions on the right
- Empty state when no mappings configured

**Add Mapping (inline form, not modal):**
- 4-column grid: Terminology Source `<Select>` | Code `<TextInput>` | Relationship `<Select>` | Add `<Button>`
- On Source + Code entry, attempt async lookup against terminology service; auto-populate Display Name. Show a Carbon `<InlineLoading>` during lookup.
- Helper text below: "If the terminology service is unavailable, you can enter the Display Name manually."

### FHIR Mapping Behavior

When this test is exposed via FHIR (DiagnosticReport, Observation), the terminology mappings determine the `Observation.code` codings included:

- A `SAME_AS` mapping is included as a primary `coding`.
- A `BROADER_THAN` mapping is included as an additional `coding` with `userSelected: false`.
- A `NARROWER_THAN` mapping is included as an additional `coding` with `userSelected: false`.

If multiple sources have `SAME_AS` mappings, all are included as parallel codings (e.g., LOINC + SNOMED for the same test).

### Data Model

```sql
CREATE TABLE test_terminology_mapping (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    source VARCHAR(20) NOT NULL,           -- 'LOINC', 'SNOMED', 'CIEL', 'OCL'
    code VARCHAR(50) NOT NULL,
    display_name VARCHAR(500) NOT NULL,
    relationship VARCHAR(20) NOT NULL,      -- 'SAME_AS', 'BROADER_THAN', 'NARROWER_THAN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_term_source CHECK (source IN ('LOINC', 'SNOMED', 'CIEL', 'OCL')),
    CONSTRAINT chk_term_relationship CHECK (relationship IN ('SAME_AS', 'BROADER_THAN', 'NARROWER_THAN')),
    UNIQUE(test_id, source, code)
);

CREATE INDEX idx_test_terminology_test ON test_terminology_mapping(test_id);
CREATE INDEX idx_test_terminology_source_code ON test_terminology_mapping(source, code);
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tests/{id}/terminology` | List mappings for test |
| POST | `/api/tests/{id}/terminology` | Add a mapping |
| PUT | `/api/tests/{id}/terminology/{mappingId}` | Update a mapping |
| DELETE | `/api/tests/{id}/terminology/{mappingId}` | Delete a mapping |
| GET | `/api/terminology/lookup?source={s}&code={c}` | Lookup display name from terminology service |

### Acceptance Criteria

- [ ] Tests can have multiple terminology mappings across different sources (LOINC, SNOMED, CIEL, OCL)
- [ ] Each mapping requires Source, Code, Display Name, and Relationship
- [ ] Add Mapping is an inline form (not a modal)
- [ ] Display Name is auto-populated via terminology lookup when available
- [ ] Display Name is editable if lookup fails or returns no result
- [ ] Mappings list shows source as a colored Tag
- [ ] Edit and Delete are available per mapping
- [ ] FHIR exposure includes terminology codings as documented above
- [ ] Empty state appears when no mappings are configured

---

## Reagents Tab

### Purpose

Link reagents from inventory to tests to track consumption and enable inventory management integration. Reagents are configured in **Administration → Master Lists → Reagents**.

### Linked Reagent Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Reagent** | Lookup | Yes | Select from configured reagents |
| **Usage Type** | Dropdown | Yes | PRIMARY or SECONDARY |
| **Quantity Per Test** | Number | Yes | Amount consumed per test run |
| **Unit** | Dropdown | Yes | Unit of measure (µL, mL, etc.) |

### UI Elements

- List of linked reagents with cards showing name, manufacturer, usage type, quantity per test
- Current stock level display (from inventory)
- "Link Reagent" button to add new associations
- Remove button on each reagent card

---

## Analyzers Tab

### Purpose

Link laboratory analyzers/instruments to tests to indicate which instruments can perform this test. Analyzers are configured in **Administration → Master Lists → Analyzers**. Test code mapping for interfacing is configured separately in the analyzer interface setup.

### Linked Analyzer Display

| Field | Source | Description |
|-------|--------|-------------|
| **Name** | Master List | Analyzer name (e.g., "Cobas c 501") |
| **Manufacturer** | Master List | Equipment manufacturer |
| **Serial Number** | Master List | Equipment serial number |
| **Location** | Master List | Physical location in the lab |
| **Status** | Master List | Online, Offline, Maintenance |

### UI Elements

**Linked Analyzers List:**
- Cards showing analyzer name, manufacturer, location, serial number
- Status badge (Online = green, Maintenance = yellow, Offline = red)
- "Unlink" action button

**Link Analyzer Modal:**
- Checkbox list of available analyzers (not yet linked)
- Shows analyzer name, manufacturer, location, status
- Multi-select supported
- "Link Selected" button

**Info Card:**
- Explains that analyzers are configured in Master Lists
- Notes that test code mapping is configured separately

### Database Schema

```sql
CREATE TABLE test_analyzer (
  id UUID PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES test(id),
  analyzer_id UUID NOT NULL REFERENCES analyzer(id),
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(test_id, analyzer_id)
);
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tests/{id}/analyzers` | Get linked analyzers for test |
| POST | `/api/tests/{id}/analyzers` | Link analyzer(s) to test |
| DELETE | `/api/tests/{id}/analyzers/{analyzerId}` | Unlink analyzer from test |
| GET | `/api/analyzers` | List all configured analyzers |
| GET | `/api/analyzers/available?testId={id}` | List analyzers not linked to test |

---

## Sample Storage Tab

### Storage Requirements

| Field | Description | Required |
|-------|-------------|----------|
| **Storage Conditions** | Temperature range for sample preservation | Yes |
| **Custom Storage Conditions** | Free-text override or additional details | No |
| **Maximum Storage Duration** | Time limit before testing (with unit) | Yes |
| **Stability Notes** | Additional stability information | No |

**Standard Storage Conditions:**
- Ultra-low freezer: -80°C to -60°C
- Freezer: -30°C to -15°C
- Refrigerator: 2°C to 8°C
- Cold room: 4°C to 8°C
- Cool room: 15°C to 18°C
- Room temperature: 18°C to 25°C
- Controlled room temp: 20°C to 25°C
- Warm incubator: 35°C to 37°C
- Ambient: Uncontrolled room temperature

### Special Handling Requirements

Checkboxes for common requirements:
- Protect from light
- Do not freeze
- Do not refrigerate
- Keep upright
- Centrifuge before storage
- Aliquot before storage

### Disposal Requirements

| Field | Description | Required |
|-------|-------------|----------|
| **Disposal Method** | Waste category/handling | Yes |
| **Disposal Timeframe** | Maximum time after test completion | No |

**Standard Disposal Methods:**
1. Biohazard/Infectious waste bin
2. Sharps container
3. Chemical deactivation
4. Incineration
5. Autoclave then general waste
6. Pharmaceutical waste
7. Radioactive waste
8. General waste (non-hazardous only)
9. Return to manufacturer

### Special Instructions

Free-text field for additional guidance that doesn't fit standard fields.

### Override Restricted

When enabled:
- Order entry staff cannot modify storage or disposal requirements
- Settings appear as read-only in order entry
- Only Lab Managers can modify requirements
- Use for critical tests (HIV, controlled substances, etc.)

### Data Model

```sql
CREATE TABLE test_sample_handling (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id) UNIQUE,
    storage_condition VARCHAR(50),           -- 'refrigerator', 'freezer', etc.
    storage_condition_custom VARCHAR(200),   -- Custom/override text
    storage_duration INTEGER NOT NULL,
    storage_unit VARCHAR(20) NOT NULL,       -- 'hours', 'days', 'weeks', 'months'
    stability_notes TEXT,
    protect_from_light BOOLEAN DEFAULT FALSE,
    do_not_freeze BOOLEAN DEFAULT FALSE,
    do_not_refrigerate BOOLEAN DEFAULT FALSE,
    keep_upright BOOLEAN DEFAULT FALSE,
    centrifuge_before_storage BOOLEAN DEFAULT FALSE,
    aliquot_before_storage BOOLEAN DEFAULT FALSE,
    disposal_method VARCHAR(100) NOT NULL,
    disposal_timeframe INTEGER,
    disposal_unit VARCHAR(20),               -- 'days', 'weeks', 'months'
    special_instructions TEXT,
    override_restricted BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail for changes
CREATE TABLE test_sample_handling_history (
    id SERIAL PRIMARY KEY,
    test_sample_handling_id INTEGER NOT NULL REFERENCES test_sample_handling(id),
    changed_by INTEGER NOT NULL REFERENCES system_user(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_type VARCHAR(20) NOT NULL,        -- 'CREATE', 'UPDATE'
    previous_values JSONB,
    new_values JSONB
);
```

### Acceptance Criteria

- [ ] Storage conditions can be selected from standard list or custom entry
- [ ] Storage duration required with unit selection
- [ ] Special handling checkboxes persist correctly
- [ ] Disposal method required with optional timeframe
- [ ] Special instructions field supports free text
- [ ] Override Restricted flag locks settings in order entry
- [ ] Changes are tracked in version history
- [ ] Quick reference card displays temperature ranges

---

## Test List View Enhancements

### Domain Filter

The test catalog list view includes a Domain filter chip alongside the Section / Sample Type / Result Type / Status / AMR filters.

**Filter Options** (multi-select):
- **All Domains** (default)
- **Clinical**
- **Environmental**
- **Vector**

**Visual Indicators:**
- Each test row shows its Domain as a Carbon `<Tag>`:
  - CLINICAL → `kind="blue"`
  - ENVIRONMENTAL → `kind="teal"`
  - VECTOR → `kind="purple"`
- Domain Tag appears as a column on the test list table.

**Use Cases:**
- Environmental lab admin reviewing only the water-quality tests in the catalog.
- Vector surveillance officer auditing every Vector-domain test before a SILNAS data push.
- Clinical lab admin filtering out non-clinical tests when reviewing patient-facing test coverage.

### AMR Filter

The test catalog list view includes a filter for Antimicrobial Resistance (AMR) tests to support WHONET export workflows.

**Filter Options:**
- **All Tests** (default): Show all tests in the catalog
- **AMR Tests Only**: Show only tests flagged as AMR tests for WHONET export
- **Non-AMR Tests**: Show tests that are not part of AMR surveillance

**Visual Indicators:**
- AMR tests display a purple "AMR" badge next to the test name in the list
- Badge tooltip shows the WHONET antibiotic code (e.g., "WHONET: AMP")

**Use Cases:**
- Quickly identify all antimicrobial susceptibility tests in the catalog
- Verify WHONET configuration before export
- Bulk operations on AMR tests (e.g., update breakpoint standards)

### Filter Set (Complete)

The Test List View exposes the following filters above the table. Filters apply additively (AND across categories, OR within multi-select categories).

| Filter | Type | Options |
|---|---|---|
| **Section** | Single-select dropdown | All Sections, plus every value from `test_section` (Chemistry, Hematology, Serology, Immunology, Microbiology, Urinalysis, Parasitology, Molecular Biology, …) |
| **Sample Type** | Single-select dropdown | All Sample Types, plus values configured per deployment (Serum, Plasma, Whole Blood, Urine, CSF, Water, Mosquito Pool, …) |
| **Result Type** | Single-select dropdown | All Result Types, Numeric, Select List, Multi-select, Free Text |
| **Status** | Single-select dropdown | All Statuses, Active, Inactive |
| **Domain** | Multi-select chip | All Domains, Clinical, Environmental, Vector — see Domain Filter above |
| **AMR** | Single-select dropdown | All Tests, AMR Tests Only, Non-AMR Tests — see AMR Filter above |

**Behavior:**
- Filters live in a collapsible filter bar revealed by a "Filters" toggle button next to the search input. Default state is collapsed; the active filter count is shown as a badge on the toggle when any filter is applied.
- A "Clear All" button resets every filter to default and is visible whenever any filter is non-default.
- Filter state is reflected in the URL (e.g., `?section=chemistry&domain=CLINICAL`) so the filtered view is shareable and bookmarkable.

### Row Interaction

The Test List View has no per-row Actions column and no bulk-selection toolbar. Both were considered redundant: every operation that bulk actions or per-row Edit / Activate / Deactivate would expose is already reachable inside the test editor (the Domain field, status flags, panel membership, etc. all live on Basic Info or their own sub-section). Concentrating writes inside the editor avoids dual entry points and prevents accidental destructive bulk actions from a list view.

**Click-to-open behavior:**
- The test name in each row is rendered as a primary-color link button. Clicking it navigates to the test editor for that row.
- The entire row is also clickable as a secondary affordance — clicking anywhere in the row navigates to the test editor.
- The row shows a `cursor: pointer` on hover.
- Keyboard navigation: each row is tab-focusable; pressing Enter on a focused row opens the editor.
- All navigation routes via the same `admin.testCatalog.manage` permission check that gates the editor.

**Out of scope for this revision (deferred to another feature):** any bulk activate / deactivate / add-to-panel UX. If the lab needs that pattern, it should be designed as a deliberate bulk-management feature, not piggy-backed on the catalog list.

### Pagination

The Test List View paginates server-side. The default page size is 25 rows; users can switch to 50, 100, or "All" via a Carbon `<Pagination>` component below the table.

- Pagination state is reflected in the URL (`?page=3&pageSize=50`).
- The pagination component shows total rows ("Showing 26–50 of 347 tests").
- Filter changes reset to page 1.

### Acceptance Criteria

- [ ] Filter bar collapses by default and exposes Section / Sample Type / Result Type / Status / Domain / AMR filters when expanded
- [ ] Active filter count is shown as a badge on the Filters toggle
- [ ] Clear All resets every filter and is hidden when no filter is active
- [ ] Filter state is reflected in the URL and persists on refresh
- [ ] Test list table has no Actions column and no row-selection checkboxes
- [ ] Test name in each row is a primary-color link; clicking it opens the editor for that test
- [ ] Clicking anywhere on a row also opens the editor for that test
- [ ] Each row is keyboard-focusable; Enter on a focused row opens the editor
- [ ] Pagination defaults to 25 rows; user can switch to 50, 100, or All
- [ ] Pagination state and page size are reflected in the URL
- [ ] Filter or page-size changes reset to page 1

---

## Range Types Overview

OpenELIS Global supports four distinct range types, **all of which can vary by age and sex**:

| Range Type | Purpose | Age/Sex Specific | Behavior |
|------------|---------|------------------|----------|
| **Normal Range** | Clinical reference values | **Yes** - commonly varies | Results outside flagged H/L on reports |
| **Valid Range** | Expected human sample values | Sometimes | Entry outside prompts verification dialog |
| **Critical Range** | Panic values requiring immediate action | **Yes** - can vary by age | Triggers immediate alerts/notifications |
| **Reporting Range** | Instrument/method limits | Rarely | Results outside trigger warning about dilution/rerun |

### Evidence for Age-Specific Critical Values

Research confirms that critical (panic) values **do vary by age**, particularly for:
- **Neonatal Bilirubin**: Hour-by-hour thresholds (0-23 hrs: >7.9, 24-35 hrs: >10.9, etc.)
- **Potassium**: Pediatric thresholds differ from adult
- **TCO2/Bicarbonate**: Pediatric thresholds differ from adult
- **Glucose**: Neonatal hypoglycemia thresholds differ

Source: Beaumont Laboratory Critical Values; acutecaretesting.org pediatric considerations

---

## Detailed Range Requirements

### 6.3.1 Age/Sex-Specific Range Support

**All four range types** must support demographic-specific variations:

```
Range Entry Structure:
├── Range Type (Normal | Valid | Critical | Reporting)
├── Sex (Male | Female | All)
├── Age From (value + unit)
├── Age To (value + unit)
├── Low Value (nullable for critical-high-only)
├── High Value (nullable for critical-low-only)
└── Notes (optional)
```

**Age Units Supported:**
- Hours (for neonatal critical values)
- Days
- Weeks
- Months
- Years

**Sex Options:**
- Male (M)
- Female (F)
- All (A) - applies to both sexes

### 6.3.2 Example: Bilirubin Ranges

**Normal Ranges (Sex-Specific):**
| Sex | Age From | Age To | Low | High | Unit |
|-----|----------|--------|-----|------|------|
| Male | 0 days | 5 days | 1 | 155 | µmol/L |
| Male | 6 days | 14 days | 1 | 140 | µmol/L |
| Male | 15 days | 1 month | 1 | 130 | µmol/L |
| Male | 1 month | 1 year | 1 | 115 | µmol/L |
| Male | 1 year | ∞ | 5 | 40 | µmol/L |
| Female | 0 days | 55 days | 1 | 175 | µmol/L |
| Female | 56 days | 1 year | 1 | 130 | µmol/L |
| Female | 1 year | ∞ | 5 | 35 | µmol/L |

**Critical Ranges (Age-Specific, Sex-Neutral):**
| Sex | Age From | Age To | Critical High | Unit |
|-----|----------|--------|---------------|------|
| All | 0 hours | 23 hours | >7.9 | mg/dL |
| All | 24 hours | 35 hours | >10.9 | mg/dL |
| All | 36 hours | 47 hours | >13.9 | mg/dL |
| All | 48 hours | 71 hours | >14.9 | mg/dL |
| All | 72 hours | 13 days | >17.9 | mg/dL |
| All | 14 days | ∞ | >15.0 | mg/dL |

### 6.3.3 Coverage Validation Requirements

The system **must validate complete age coverage** for each sex:

**Validation Rules:**
1. For each sex (Male, Female), age ranges must cover from birth (0) to maximum age (∞) without gaps
2. Overlapping age ranges for the same sex are not allowed
3. "All" sex ranges count as coverage for both Male and Female
4. Validation runs on save and displays clear error messages for any gaps

**Coverage Check Algorithm:**
```
For each sex in [Male, Female]:
  1. Collect all ranges for this sex + "All" ranges
  2. Normalize all age values to a common unit (days)
  3. Sort by age_from ascending
  4. Verify first range starts at 0
  5. Verify each range.age_to + 1 == next_range.age_from (no gaps)
  6. Verify last range extends to infinity (999 years or marked as "no upper limit")
```

**UI Feedback:**
- Green checkmark: "Male coverage: Complete"
- Amber warning: "Female coverage: Gap detected (56 days to 1 year)"
- List of specific gaps with suggested fix

### 6.3.4 Range Editor UI Requirements

The Range Editor exposes three view modes for the same underlying range data, plus a coverage validation panel and an add/edit modal. Users switch between views using a Carbon `<Dropdown>` in the editor's header bar; the selected view persists in URL state (`?rangeView=structured|table|visual`) so it's bookmarkable.

#### Structured View (Default)

The default view groups ranges hierarchically: by range type, then by sex, sorted ascending by age. Designed for editing one range type's coverage at a time.

**Layout:**
- Top-level sections, one per range type (Normal, Valid, Critical, Reporting). Each section is a Carbon `<Accordion>` item that can be expanded or collapsed independently.
- Each accordion header shows: range-type name as a colored Carbon `<Tag>` (Normal = `kind="green"`, Valid = `kind="blue"`, Critical = `kind="red"`, Reporting = `kind="purple"`), short description ("Clinical reference values", "Expected possible values", etc.), count of ranges defined, and a "+ Add" Carbon `<IconButton>` that opens the Add Range modal scoped to that range type.
- Inside each section, ranges are sub-grouped by sex (Male, Female, All), with a sex Carbon `<Tag>` separator and the count of ranges in that group.
- Each range row shows: index number, age range (formatted "X hours – Y days" with infinity rendered as ∞), Low value, High value, and a **mini visual bar** showing the range graphically (Low to High mapped to a 0–200 scale, color-coded to match the range type).
- Row hover reveals action buttons: Edit, **Copy to other sex** (creates a new range with the same age/values for the opposite sex via the Add Range modal pre-fill), Delete.

**Empty state (per range type):**
"No {range type}s defined" with a "+ Add {Range Type}" CTA inline.

#### Table View

A flat sortable Carbon `<DataTable>` showing every range across every type in one table. Designed for bulk review or copy-paste exports.

**Columns:** Type (colored Tag), Sex (Tag), Age From (value + unit), Age To (∞ when 999 years), Low, High, Actions.

**Sort behavior:**
- Default sort: by Type ascending, then by Sex ascending, then by Age From ascending (after normalization to days).
- Any column header sorts on click; click-again reverses; click-third returns to default sort.

**Bulk editing:** Carbon `<DataTable>` selection enables a Bulk Actions toolbar (Delete Selected, Change Sex, Change Type) — gated by `admin.testCatalog.manage`.

#### Visual View

A "what ranges apply to this patient?" lookup view that renders the four range types as stacked horizontal bars for a selected demographic.

**Demographic selector** at the top:
- Sex `<Dropdown>` (Male / Female)
- Age `<NumberInput>` and unit `<Select>` (hours / days / weeks / months / years)

**Bar display** — four stacked rows, one per range type, in fixed order Valid → Normal → Critical → Reporting:
- Each row has a label on the left ("Valid", "Normal", "Critical", "Reporting") and a 0–200-scaled background bar on the right.
- The applicable range for the selected demographic is rendered as a colored bar (color matches the range type) with the Low and High values printed inline.
- If no range applies for the selected demographic, the bar shows italic placeholder text: "Not defined for this demographic."
- Critical ranges that have only a high value (no low) render the bar from 0 to High; ranges with only a low render from Low to the right edge.

**Legend** below the bars, with a colored swatch per range type.

**Live updates:** changing the demographic selector immediately re-evaluates all four range types and re-renders the bars. No save action is needed in this view — it's read-only.

#### Coverage Validation Panel

Toggleable via a "Validate Coverage" button in the editor header. When enabled, the panel renders above the structured/table/visual view and shows the current coverage state for both sexes.

**Layout:** two side-by-side cards, one for Male, one for Female (uses Carbon `<Tile>`).

**Per-sex card content:**
- Header: Sex Tag (Male = `kind="blue"`, Female = `kind="magenta"`) and overall status:
  - **Complete coverage** — green check icon + "Complete Coverage" text
  - **Issues found** — red alert icon + "{N} Issue(s) Found"
- Body (when issues exist): one card per issue, color-coded by issue type:
  - **GAP** — red background, "GAP" pill in red, gap range message ("55 days to 1 year"), suggested values from adjacent range below ("Suggested values from adjacent range: Low=1, High=130"), and a primary action button "Fill Gap"
  - **OVERLAP** — amber background, "OVERLAP" pill in amber, conflicting-range message ("Overlap at 56 days"), with the two conflicting range descriptions listed beneath
- Body (when complete): green-tinted info card with text "All age ranges from birth to maximum age are covered."

**Fill Gap action behavior:**
- Opens the Add Range modal (the same one launched by "+ Add" buttons in the Structured view)
- Pre-fills: range type = `normal`, sex = the column's sex (M or F), Age From = gap start, Age To = gap end, Low/High = adjacent range's values
- Modal shows a Carbon `<InlineNotification kind="info">` banner: "Values from: {age range of source range}"
- User can modify any pre-filled value before saving; the source banner makes clear where the suggestion came from

**Copy-to-other-sex action behavior:**
- Triggered from a range row in the Structured view
- Opens the Add Range modal with the same age range and values, but with sex flipped (Male → Female or vice versa)
- Modal banner: "Copied from {source sex}: {age range}"

#### Add/Edit Range Modal

Single Carbon `<Modal>` reused for adding new ranges, filling gaps, and copying ranges to the other sex.

**Header:** "Add {Range Type}" or "Edit {Range Type}". Close button on the right.

**Source banner** (shown when invoked from Fill Gap or Copy-to-other-sex): Carbon `<InlineNotification kind="info">` with the template-source text.

**Body fields:**
- **Applies To** — three-button `<RadioButtonGroup>` styled as labeled cards: All (gray), Male Only (blue), Female Only (magenta). Selected card has a Carbon Blue 60 border + tinted background.
- **Age Range** — two side-by-side blocks, each with a number input and a unit `<Select>` (hours / days / weeks / months / years). From and To. Helper text below: "Use 999 years for 'no upper age limit' (infinity)."
- **Value Range** — two side-by-side number inputs (Low, High). Field labels change based on range type:
  - For Critical ranges: "Critical Low (values below this)" and "Critical High (values above this)" — placeholder text "Leave blank if N/A" — both fields optional, but at least one required
  - For other range types: "Low" and "High" — both required

**Footer:** Cancel + Save buttons. Save is disabled until validation passes (age From < age To, at least one value field filled, no overlap conflict with existing ranges).

**Coverage warning banner** below the form: if the new/edited range introduces an overlap or leaves a new gap, show a Carbon `<InlineNotification kind="warning">` summarizing the impact before save.

---

## Data Model Updates

### TestRange Entity (Updated)

```sql
CREATE TABLE test_range (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    range_type VARCHAR(20) NOT NULL, -- 'NORMAL', 'VALID', 'CRITICAL', 'REPORTING'
    sex CHAR(1) NOT NULL DEFAULT 'A', -- 'M', 'F', 'A' (All)
    age_from_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    age_from_unit VARCHAR(10) NOT NULL DEFAULT 'days', -- 'hours', 'days', 'weeks', 'months', 'years'
    age_to_value DECIMAL(10,2) NOT NULL DEFAULT 999,
    age_to_unit VARCHAR(10) NOT NULL DEFAULT 'years',
    low_value DECIMAL(15,6) NULL, -- NULL allowed for critical-high-only
    high_value DECIMAL(15,6) NULL, -- NULL allowed for critical-low-only
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_range_type CHECK (range_type IN ('NORMAL', 'VALID', 'CRITICAL', 'REPORTING')),
    CONSTRAINT chk_sex CHECK (sex IN ('M', 'F', 'A')),
    CONSTRAINT chk_age_unit CHECK (age_from_unit IN ('hours', 'days', 'weeks', 'months', 'years')),
    CONSTRAINT chk_at_least_one_value CHECK (low_value IS NOT NULL OR high_value IS NOT NULL)
);

CREATE INDEX idx_test_range_test_id ON test_range(test_id);
CREATE INDEX idx_test_range_lookup ON test_range(test_id, range_type, sex);
```

### Helper Function: Normalize Age to Days

```sql
CREATE FUNCTION normalize_age_to_days(value DECIMAL, unit VARCHAR) 
RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE unit
        WHEN 'hours' THEN value / 24.0
        WHEN 'days' THEN value
        WHEN 'weeks' THEN value * 7.0
        WHEN 'months' THEN value * 30.44  -- Average days per month
        WHEN 'years' THEN value * 365.25  -- Account for leap years
        ELSE value
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## API Requirements

### Get Ranges for Test

```http
GET /api/v1/tests/{testId}/ranges
```

**Response:**
```json
{
  "testId": 123,
  "ranges": {
    "normal": [
      {
        "id": 1,
        "sex": "M",
        "ageFrom": { "value": 0, "unit": "days" },
        "ageTo": { "value": 5, "unit": "days" },
        "low": 1,
        "high": 155
      },
      // ... more ranges
    ],
    "valid": [...],
    "critical": [...],
    "reporting": [...]
  },
  "coverage": {
    "male": { "complete": true, "gaps": [] },
    "female": { "complete": false, "gaps": ["56 days to 1 year"] }
  }
}
```

### Validate Coverage

```http
POST /api/v1/tests/{testId}/ranges/validate
```

**Response:**
```json
{
  "valid": false,
  "coverage": {
    "male": { "complete": true, "gaps": [] },
    "female": { 
      "complete": false, 
      "gaps": [
        {
          "rangeType": "normal",
          "from": { "value": 56, "unit": "days" },
          "to": { "value": 1, "unit": "years" },
          "message": "No normal range defined for females aged 56 days to 1 year"
        }
      ]
    }
  }
}
```

### Get Applicable Range (for Result Entry)

```http
GET /api/v1/tests/{testId}/applicable-range?sex=M&ageValue=3&ageUnit=days
```

**Response:**
```json
{
  "testId": 123,
  "demographic": { "sex": "M", "age": { "value": 3, "unit": "days" } },
  "applicableRanges": {
    "normal": { "low": 1, "high": 155 },
    "valid": { "low": 0, "high": 600 },
    "critical": { "low": null, "high": 7.9 },
    "reporting": { "low": 0.1, "high": 30 }
  }
}
```

---

## Acceptance Criteria (Ranges)

### Range Editor

- [ ] All four range types (Normal, Valid, Critical, Reporting) support age/sex-specific variations
- [ ] Age can be specified in hours, days, weeks, months, or years
- [ ] Sex can be Male, Female, or All (applies to both)
- [ ] User can switch between Structured, Visual, and Table views
- [ ] Visual view updates dynamically when demographic selector changes

### Coverage Validation

- [ ] System validates that all ages from 0 to ∞ are covered for each sex
- [ ] Validation runs automatically on save
- [ ] Clear error messages identify specific gaps (e.g., "Female: 56 days to 1 year not covered")
- [ ] Validation considers "All" sex ranges as covering both Male and Female
- [ ] Overlapping ranges for the same sex/type are flagged as errors

### Critical Ranges

- [ ] Critical ranges support age-specific thresholds (e.g., neonatal bilirubin by hour)
- [ ] Critical low and critical high can be set independently
- [ ] Null values allowed (e.g., only critical high, no critical low)

### Result Entry Integration

- [ ] When entering results, system looks up applicable ranges based on patient sex and age
- [ ] Correct range applied even for complex cases (e.g., 3-day-old male)
- [ ] H/L flags use the applicable normal range for the patient's demographics
- [ ] Critical alerts use the applicable critical range for the patient's demographics

---

## NEW: Functional Coverage Validation

### Requirements

The coverage validation panel must be functional, not just informational:

1. **Display Issues Clearly**
   - Show separate panels for Male and Female coverage
   - Each panel shows: complete/incomplete status, count of issues
   - Issues categorized as: GAP (missing range) or OVERLAP (conflicting ranges)

2. **Gap Detection**
   - Identify all age ranges not covered from birth (0 hours) to infinity
   - Show specific gap boundaries (e.g., "55 days to 1 year")
   - Display suggested values from adjacent range

3. **Overlap Detection**
   - Identify any overlapping age ranges for the same sex/type
   - Show which ranges conflict
   - Provide option to edit or delete conflicting ranges

4. **"Fill Gap" Action**
   - Clicking "Fill Gap" on any gap issue opens the Add Range modal
   - Modal pre-fills:
     - Sex: From the coverage panel (Male or Female)
     - Age From/To: Exact gap boundaries
     - Low/High values: From adjacent range (with banner showing source)
   - User can modify pre-filled values before saving
   - Banner text: "Values from: 48 hours – 72 hours range"

5. **Copy From Range Action**
   - Each range row has a "Copy to other sex" action
   - Creates a new range with same age/values but different sex
   - Opens modal with pre-filled values for user confirmation

### UI Mockup Notes

```
┌─────────────────────────────────────────────────────────┐
│ Age Coverage Validation                                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ Male      ✓ Complete │  │ Female    ⚠ 1 Issue    │  │
│  │                      │  │                         │  │
│  │ ✓ All ages covered   │  │ ┌─────────────────────┐ │  │
│  │                      │  │ │ GAP                 │ │  │
│  │                      │  │ │ 55 days to 1 year   │ │  │
│  │                      │  │ │                     │ │  │
│  │                      │  │ │ Suggested: L=1 H=130│ │  │
│  │                      │  │ │        [Fill Gap]   │ │  │
│  │                      │  │ └─────────────────────┘ │  │
│  └─────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## NEW: Test Display Order (Within Sample Type)

### Requirements

1. **Ordering Per Sample Type**
   - Each sample type maintains its own display order for tests
   - Order determines sequence in: order entry, result entry, worklists, reports

2. **Drag-and-Drop Interface**
   - Tests displayed as draggable rows with grip handle
   - Visual feedback during drag (highlighted, shadow)
   - Drop position indicator between rows

3. **Arrow Controls (Accessibility)**
   - Up/Down arrow buttons on each row
   - Keyboard accessible alternative to drag-and-drop

4. **Sample Type Selector**
   - Dropdown to switch between sample types
   - Order is saved per sample type (same test can have different positions in Serum vs Plasma)

5. **Persistence**
   - Order saved to `test_sample_type.display_order` column
   - Changes saved on drop (auto-save) or explicit Save button

### Data Model

```sql
ALTER TABLE test_sample_type 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Index for efficient ordering queries
CREATE INDEX idx_test_sample_type_order 
ON test_sample_type(sample_type_id, display_order);
```

### Acceptance Criteria

- [ ] User can drag tests to reorder within a sample type
- [ ] Arrow buttons provide alternative to drag-and-drop
- [ ] Order is persisted and applied in order entry screen
- [ ] Order is sample-type-specific (different order for Serum vs Plasma)
- [ ] Order numbers update automatically to maintain sequence (1, 2, 3...)

---

## NEW: Localization Hardening

### Problem Statement

Currently, OpenELIS can throw errors or display blank values when a test is viewed in a language that lacks a translation. This creates fragility in multi-language deployments where not all content is translated immediately.

### Requirements

1. **Graceful Fallback Behavior**
   - When a translation is missing for the selected UI language, display the value from the "base" or "primary" language (typically the language in which the test was created)
   - Never display blank/null values or throw errors due to missing translations
   - Fallback chain: Selected Language → Primary Language → First Available Translation → Internal Code

2. **Multi-Language Metadata Storage**
   - Each localizable field maintains values for all supported languages
   - Localizable fields for tests include:
     - Test name
     - Reporting name
     - Description
     - Result value labels (for select lists)
     - Unit of measure display text
   - Store `primary_language` flag to identify the authoritative translation

3. **Translation Status Indicators**
   - In the test editor, show which languages have translations
   - Visual indicator: ✓ (translated), ⚠ (missing), or language code badges
   - Allow bulk identification of untranslated content across the catalog

4. **No Breaking on Missing Translations**
   - All display logic must handle null/missing translations gracefully
   - API responses include both the requested language value AND the fallback value
   - Frontend displays fallback with optional indicator (e.g., italic text or small flag)

### Data Model

```sql
-- Test localizations table
CREATE TABLE test_localization (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    language_code VARCHAR(10) NOT NULL,  -- e.g., 'en', 'fr', 'sw', 'ht'
    field_name VARCHAR(50) NOT NULL,      -- e.g., 'name', 'reportingName', 'description'
    value TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, language_code, field_name)
);

CREATE INDEX idx_test_localization_lookup 
ON test_localization(test_id, field_name, language_code);

-- Helper function for fallback retrieval
CREATE FUNCTION get_localized_test_field(
    p_test_id INTEGER,
    p_field_name VARCHAR,
    p_language_code VARCHAR
) RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    -- Try requested language
    SELECT value INTO v_value 
    FROM test_localization 
    WHERE test_id = p_test_id 
      AND field_name = p_field_name 
      AND language_code = p_language_code;
    
    IF v_value IS NOT NULL THEN
        RETURN v_value;
    END IF;
    
    -- Fallback to primary language
    SELECT value INTO v_value 
    FROM test_localization 
    WHERE test_id = p_test_id 
      AND field_name = p_field_name 
      AND is_primary = TRUE;
    
    IF v_value IS NOT NULL THEN
        RETURN v_value;
    END IF;
    
    -- Fallback to any available translation
    SELECT value INTO v_value 
    FROM test_localization 
    WHERE test_id = p_test_id 
      AND field_name = p_field_name 
    LIMIT 1;
    
    RETURN COALESCE(v_value, '[' || p_field_name || ']');
END;
$$ LANGUAGE plpgsql STABLE;
```

### API Response Format

```json
{
  "test": {
    "id": 123,
    "name": {
      "value": "Glycémie à jeun",
      "language": "fr",
      "isFallback": false
    },
    "description": {
      "value": "Fasting blood glucose measurement",
      "language": "en",
      "isFallback": true
    }
  }
}
```

### UI Considerations

- Fallback values displayed in *italics* or with small language indicator
- Tooltip: "Showing English (translation not available in French)"
- Translation management screen to bulk-add missing translations
- Export untranslated strings for external translation services

### Acceptance Criteria

- [ ] System never throws errors when translation is missing
- [ ] Missing translations fall back to primary language automatically
- [ ] Fallback values are visually distinguishable from native translations
- [ ] Test editor shows translation status for each supported language
- [ ] API returns both value and source language information
- [ ] Bulk export of untranslated strings is available

---

## NEW: Antimicrobial Resistance (AMR) Test Flag

### Purpose

Enable proper identification of AMR-related tests for export to WHONET and other AMR surveillance systems. WHONET is the standard software for managing antimicrobial susceptibility data used by WHO's Global Antimicrobial Resistance Surveillance System (GLASS).

### Requirements

1. **AMR Test Designation**
   - Checkbox/toggle on Basic Info tab: "Antimicrobial Resistance (AMR) Test"
   - When enabled, shows additional AMR-specific configuration options
   - AMR tests are flagged for inclusion in WHONET exports

2. **AMR Configuration Fields** (shown when AMR flag is enabled)
   - **WHONET Antibiotic Code**: Standard WHONET code (e.g., "AMP" for Ampicillin, "CIP" for Ciprofloxacin)
   - **Antibiotic Class**: Classification (e.g., Penicillins, Fluoroquinolones, Cephalosporins)
   - **Test Method**: Disk diffusion, MIC, E-test, etc.
   - **Breakpoint Standard**: CLSI, EUCAST, or custom
   - **Potency/Disk Content**: e.g., "10 µg" for disk diffusion

3. **WHONET Export Compatibility**
   - AMR-flagged tests included in WHONET export files
   - Proper mapping of result interpretations (S/I/R) to WHONET format
   - Support for zone diameter (mm) and MIC (µg/mL) result types

4. **Organism Linkage**
   - AMR tests can be linked to specific organism panels
   - Support for intrinsic resistance rules
   - Expert rules integration (future enhancement)

### UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ ☑ Antimicrobial Resistance (AMR) Test                       │
│   Enable for WHONET export and AMR surveillance             │
├─────────────────────────────────────────────────────────────┤
│ WHONET Configuration                                        │
│                                                             │
│ Antibiotic Code:  [AMP     ▼]   Antibiotic Class: [Penicillins ▼] │
│ Test Method:      [Disk Diffusion ▼]                        │
│ Breakpoint Std:   [CLSI 2024 ▼]  Potency: [10    ] µg       │
│                                                             │
│ ℹ This test will be included in WHONET exports              │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```sql
-- AMR test configuration
ALTER TABLE test ADD COLUMN is_amr_test BOOLEAN DEFAULT FALSE;

CREATE TABLE test_amr_config (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id) UNIQUE,
    whonet_antibiotic_code VARCHAR(10),      -- e.g., 'AMP', 'CIP', 'GEN'
    antibiotic_class VARCHAR(100),            -- e.g., 'Penicillins'
    test_method VARCHAR(50),                  -- 'DISK', 'MIC', 'ETEST'
    breakpoint_standard VARCHAR(50),          -- 'CLSI', 'EUCAST'
    breakpoint_year INTEGER,
    disk_potency DECIMAL(10,2),
    disk_potency_unit VARCHAR(10) DEFAULT 'µg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WHONET antibiotic reference table
CREATE TABLE whonet_antibiotic_codes (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    antibiotic_class VARCHAR(100),
    atc_code VARCHAR(20)
);
```

### Acceptance Criteria

- [ ] Tests can be flagged as AMR tests via checkbox
- [ ] AMR configuration panel appears when flag is enabled
- [ ] WHONET antibiotic code can be selected from standard list
- [ ] Breakpoint standard (CLSI/EUCAST) can be specified
- [ ] AMR tests are properly exported to WHONET format
- [ ] Zone diameter and MIC result types supported

---

## NEW: Alert Rules Configuration

### Purpose

Configure automated notifications when specific result conditions are met, enabling timely communication of critical or abnormal values to appropriate recipients.

### Requirements

1. **Rule Builder Interface**
   - Visual rule builder for defining alert conditions
   - Support for multiple rules per test
   - Rules can be enabled/disabled without deletion

2. **Trigger Conditions** (four types — kept aligned with the implemented JSX)
   - **All Results**: Notify on every result entry
   - **Abnormal Values**: Result outside normal range (high or low)
   - **Critical Values**: Result in critical/panic range
   - **Specific Value**: Exact match (useful for select list results like "Positive")

3. **Delivery Channels**
   - **SMS**: Send text message to phone number
   - **Email**: Send email notification
   - Future: In-app notification, WhatsApp, etc.

4. **Recipient Types**
   - **Ordering Physician**: Auto-resolve from order/sample data
   - **Patient**: Use patient's registered phone/email
   - **Referring Facility**: Contact for the referring site
   - **Custom Contact**: Manually specified phone number or email address
   - **Role-Based**: All users with specific role (e.g., "Lab Director")

5. **Message Customization**
   - Template-based messages with variable substitution
   - Variables: `{{patient_name}}`, `{{test_name}}`, `{{result}}`, `{{unit}}`, `{{reference_range}}`, `{{collected_date}}`, etc.
   - Different templates for SMS (short) vs Email (detailed)

6. **Alert History & Audit**
   - Log all sent alerts with timestamp, recipient, delivery status
   - Retry logic for failed deliveries
   - View alert history from result entry screen

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│ Alert Rules                                              [+ Add Rule]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌─ Rule 1: Critical Value Alert ─────────────────────── ☑ Enabled ─┐│
│ │                                                                   ││
│ │ WHEN result is   [Critical Value    ▼]                           ││
│ │                                                                   ││
│ │ NOTIFY via       [SMS ▼]  [Email ▼]                              ││
│ │                                                                   ││
│ │ RECIPIENTS                                                        ││
│ │   ☑ Ordering Physician                                           ││
│ │   ☐ Patient                                                       ││
│ │   ☐ Custom: [                    ]                               ││
│ │                                                                   ││
│ │ MESSAGE TEMPLATE (SMS)                                            ││
│ │ ┌─────────────────────────────────────────────────────────────┐  ││
│ │ │ CRITICAL: {{test_name}} result {{result}} {{unit}} for      │  ││
│ │ │ {{patient_name}}. Please review immediately.                │  ││
│ │ └─────────────────────────────────────────────────────────────┘  ││
│ │                                                    [Edit] [Delete]││
│ └───────────────────────────────────────────────────────────────────┘│
│                                                                      │
│ ┌─ Rule 2: Abnormal Result Notification ─────────────── ☑ Enabled ─┐│
│ │                                                                   ││
│ │ WHEN result is   [Abnormal (High or Low) ▼]                      ││
│ │ NOTIFY via       [Email ▼]                                        ││
│ │ RECIPIENTS       ☑ Ordering Physician                            ││
│ │                                                    [Edit] [Delete]││
│ └───────────────────────────────────────────────────────────────────┘│
│                                                                      │
│ ┌─ Rule 3: Positive Result Alert ────────────────────── ☐ Disabled ┐│
│ │ WHEN result equals "Positive"                                     ││
│ │ NOTIFY via SMS to Patient                          [Edit] [Delete]││
│ └───────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Add/Edit Rule Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│ Add Alert Rule                                                   ✕  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Rule Name: [Critical Value SMS Alert                    ]           │
│                                                                      │
│ ─── Trigger Condition ───────────────────────────────────────────── │
│                                                                      │
│ Alert when result is:  ○ All Results                                │
│                        ○ Abnormal (outside normal range)            │
│                        ● Critical (panic value)                     │
│                        ○ Specific Value: [          ]               │
│                                                                      │
│ ─── Notification Channel ────────────────────────────────────────── │
│                                                                      │
│ Send via:  ☑ SMS    ☑ Email                                        │
│                                                                      │
│ ─── Recipients ──────────────────────────────────────────────────── │
│                                                                      │
│ ☑ Ordering Physician (from order)                                   │
│ ☐ Patient (from patient record)                                     │
│ ☐ Referring Facility contact                                        │
│ ☐ Custom recipient:                                                 │
│     Phone: [+1 555-123-4567        ]                               │
│     Email: [                        ]                               │
│ ☐ All users with role: [Lab Director ▼]                            │
│                                                                      │
│ ─── Message Templates ───────────────────────────────────────────── │
│                                                                      │
│ SMS Template (160 char recommended):                                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ CRITICAL: {{test_name}} {{result}} {{unit}} for {{patient_name}}│ │
│ │ ID:{{patient_id}}. Review immediately.                          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ Characters: 98/160                                                   │
│                                                                      │
│ Email Subject:                                                       │
│ [Critical Lab Result: {{test_name}} for {{patient_name}}    ]       │
│                                                                      │
│ Email Body:                                                          │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ A critical laboratory result requires your attention:           │ │
│ │                                                                  │ │
│ │ Patient: {{patient_name}} (ID: {{patient_id}})                  │ │
│ │ Test: {{test_name}}                                              │ │
│ │ Result: {{result}} {{unit}}                                      │ │
│ │ Reference Range: {{reference_range}}                             │ │
│ │ Collected: {{collected_date}}                                    │ │
│ │ ...                                                              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ Available variables: patient_name, patient_id, test_name, result,   │
│ unit, reference_range, collected_date, resulted_date, lab_name      │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                        [Cancel]  [Save Alert Rule]  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Model

```sql
-- Alert rule definition
CREATE TABLE test_alert_rule (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    trigger_type VARCHAR(30) NOT NULL, -- 'ALL', 'ABNORMAL', 'CRITICAL', 'SPECIFIC_VALUE'
    trigger_value VARCHAR(100),         -- For SPECIFIC_VALUE type
    notify_sms BOOLEAN DEFAULT FALSE,
    notify_email BOOLEAN DEFAULT FALSE,
    notify_ordering_physician BOOLEAN DEFAULT FALSE,
    notify_patient BOOLEAN DEFAULT FALSE,
    notify_referring_facility BOOLEAN DEFAULT FALSE,
    notify_custom_phone VARCHAR(20),
    notify_custom_email VARCHAR(100),
    notify_role_id INTEGER REFERENCES user_role(id),
    sms_template TEXT,
    email_subject_template VARCHAR(200),
    email_body_template TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_alert_rule_test ON test_alert_rule(test_id);
CREATE INDEX idx_test_alert_rule_enabled ON test_alert_rule(is_enabled) WHERE is_enabled = TRUE;

-- Alert delivery log
CREATE TABLE alert_delivery_log (
    id SERIAL PRIMARY KEY,
    alert_rule_id INTEGER NOT NULL REFERENCES test_alert_rule(id),
    result_id INTEGER NOT NULL REFERENCES result(id),
    channel VARCHAR(10) NOT NULL,        -- 'SMS', 'EMAIL'
    recipient VARCHAR(200) NOT NULL,
    message_content TEXT,
    delivery_status VARCHAR(20) NOT NULL, -- 'PENDING', 'SENT', 'DELIVERED', 'FAILED'
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_delivery_result ON alert_delivery_log(result_id);
CREATE INDEX idx_alert_delivery_status ON alert_delivery_log(delivery_status) WHERE delivery_status IN ('PENDING', 'FAILED');
```

### Acceptance Criteria

- [ ] Users can create multiple alert rules per test
- [ ] Rules can be enabled/disabled individually
- [ ] Trigger conditions include: All, Abnormal, Critical, Specific Value
- [ ] SMS and Email delivery channels available
- [ ] Recipients can be: ordering physician, patient, custom contact, role-based
- [ ] Message templates support variable substitution
- [ ] SMS template shows character count
- [ ] Alert delivery is logged for audit
- [ ] Failed deliveries are retried

---

## NEW: Reflex Tests & Calculated Results

### Purpose

Display reflex test rules and calculated result configurations that apply to this test, with links to the existing management pages for editing. This tab provides visibility into how this test participates in automated workflows without duplicating the full editor functionality.

### Requirements

1. **Read-Only Display with Edit Links**
   - Show reflex rules that are triggered BY this test's results
   - Show reflex rules that ORDER this test
   - Show calculated results that USE this test as an input
   - Show if this test IS a calculated result
   - All editing links navigate to existing pages:
     - `/MasterListsPage#reflex` for reflex test management
     - `/MasterListsPage#calculatedValue` for calculated result management

2. **Reflex Test Display**
   - Trigger test and condition
   - Target test(s) to order
   - Order mode (auto vs suggest)
   - Link to edit in Master Lists

3. **Calculated Result Display**
   - Formula expression
   - Input variables and their source tests
   - Link to edit in Master Lists

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│ Reflex & Calculated Results                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌─ REFLEX TESTS ────────────────────────────────────────────────── ┐│
│ │                                                                   ││
│ │ Rules triggered BY this test:                                     ││
│ │ ┌─────────────────────────────────────────────────────────────┐  ││
│ │ │ IF result > 200 mg/dL → ORDER Hemoglobin A1c                │  ││
│ │ │ Mode: Suggest (require confirmation)                         │  ││
│ │ │                                    [Edit in Master Lists →] │  ││
│ │ └─────────────────────────────────────────────────────────────┘  ││
│ │                                                                   ││
│ │ Rules that ORDER this test:                                       ││
│ │ ┌─────────────────────────────────────────────────────────────┐  ││
│ │ │ ↳ Glucose Tolerance Test (when 2-hour > 140)                │  ││
│ │ │                                    [Edit in Master Lists →] │  ││
│ │ └─────────────────────────────────────────────────────────────┘  ││
│ │                                                                   ││
│ │ [+ Add New Reflex Rule in Master Lists →]                        ││
│ └───────────────────────────────────────────────────────────────────┘│
│                                                                      │
│ ┌─ CALCULATED RESULTS ──────────────────────────────────────────── ┐│
│ │                                                                   ││
│ │ Calculations that USE this test as input:                        ││
│ │ ┌─────────────────────────────────────────────────────────────┐  ││
│ │ │ ⚙ LDL Cholesterol (Calculated)                              │  ││
│ │ │   Formula: Total_Chol - HDL - (Triglycerides / 5)           │  ││
│ │ │                                    [Edit in Master Lists →] │  ││
│ │ └─────────────────────────────────────────────────────────────┘  ││
│ │                                                                   ││
│ │ This test IS a calculated result:                                 ││
│ │ ┌─────────────────────────────────────────────────────────────┐  ││
│ │ │ (Not configured as a calculated result)                     │  ││
│ │ │           [+ Configure in Master Lists →]                   │  ││
│ │ └─────────────────────────────────────────────────────────────┘  ││
│ └───────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Navigation Links

| Action | Destination |
|--------|-------------|
| Edit reflex rule | `/MasterListsPage#reflex?testId={id}` |
| Add new reflex rule | `/MasterListsPage#reflex?action=add&triggerTestId={id}` |
| Edit calculated result | `/MasterListsPage#calculatedValue?testId={id}` |
| Configure as calculated | `/MasterListsPage#calculatedValue?action=add&resultTestId={id}` |

### Acceptance Criteria

**Reflex Tests:**
- [ ] Display reflex rules triggered by this test's results
- [ ] Display reflex rules that order this test
- [ ] Show trigger condition, target tests, and order mode
- [ ] "Edit in Master Lists" link opens reflex management page
- [ ] "Add New Reflex Rule" link pre-fills trigger test

**Calculated Results:**
- [ ] Display calculations that use this test as input
- [ ] Display if this test is a calculated result with its formula
- [ ] "Edit in Master Lists" link opens calculated value management
- [ ] "Configure in Master Lists" link pre-fills result test

---

## NEW: Panel Membership with Display Order

### Requirements

1. **Multi-Select Panel Assignment**
   - Display all available panels as checkable cards
   - Show panel name and current test count
   - Visual indicator (checkmark, highlight) for selected panels

2. **Display Order Within Panel (Dual Input Method)**
   - When a panel is selected, user can set the position of this test within that panel
   - **Two methods to set position:**
     - **Numeric input**: Direct entry of position number (1 to N+1)
     - **Drag-and-drop**: Drag the "This test" item within the preview list to desired position
   - Both methods update the same underlying value and stay synchronized
   - Default position: end of panel (testCount + 1)

3. **Order Preview with Drag Support**
   - Scrollable list showing all tests currently in the panel
   - Current test highlighted with "← This test" indicator and drag handle (≡)
   - Existing tests shown in current order (not draggable)
   - Dragging "This test" reorders the list and updates the numeric input
   - Visual feedback during drag (drop indicator line, item highlighting)

4. **Inline Panel Creation**
   - "Create New Panel" button in panel section
   - Expands inline form (not modal) for quick entry
   - Fields: Panel name only (minimal required info)
   - Create & Cancel buttons
   - New panel automatically selected after creation

### UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ ☑ Basic Metabolic Panel                    Position: 3  ▼  │
│   8 tests                                                   │
├─────────────────────────────────────────────────────────────┤
│ Display Position: [3] of 9     │ Panel Test Order Preview   │
│                                │ ┌─────────────────────────┐│
│ Enter number or drag the test  │ │   1. Glucose            ││
│ in the preview list            │ │   2. BUN                ││
│                                │ │ ≡ 3. ← THIS TEST        ││ ← draggable
│                                │ │   4. Creatinine         ││
│                                │ │   5. Sodium             ││
│                                │ │   ...                   ││
│                                │ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Interaction Details

**Numeric Input:**
- Type a number to set exact position
- Validation: min 1, max testCount + 1
- Pressing Enter or blur confirms the value
- Preview list reorders to reflect new position

**Drag-and-Drop:**
- Grip handle (≡) on "This test" row indicates draggability
- Only the new test being added is draggable; existing panel tests are static
- Drag to reposition within the list
- Drop zones appear between existing tests
- On drop: numeric input updates to match new position
- Keyboard accessible: Arrow keys to move when row is focused

### Data Model

```sql
-- Panel-test junction with display order
CREATE TABLE panel_test (
    id SERIAL PRIMARY KEY,
    panel_id INTEGER NOT NULL REFERENCES panel(id),
    test_id INTEGER NOT NULL REFERENCES test(id),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(panel_id, test_id)
);

CREATE INDEX idx_panel_test_order ON panel_test(panel_id, display_order);
```

### Acceptance Criteria

- [ ] User can select multiple panels for a test
- [ ] Selected panels expand to show order configuration
- [ ] User can set position via numeric input (type a number)
- [ ] User can set position via drag-and-drop in preview list
- [ ] Both input methods stay synchronized
- [ ] Preview shows where test will appear in panel order
- [ ] Drag handle (≡) clearly indicates draggable item
- [ ] Drop zones provide clear visual feedback during drag
- [ ] User can create a new panel inline without navigating away
- [ ] New panels appear in the list immediately after creation
- [ ] Panel selection and order persist when saving test

---

## NEW: Inline Method Creation

### Requirements

1. **Link Existing Method**
   - "Link Method" button opens method selector
   - Shows available (unlinked) methods
   - Click to link method to test

2. **Create New Method**
   - "Create New Method" link in method selector
   - Opens inline form for method creation
   - Minimum fields: Method name
   - "Create & Link" button creates method AND links it to current test

3. **Method Management**
   - Set default method (one default per test)
   - Effective date for each linked method
   - Edit/Remove linked methods

### Acceptance Criteria

- [ ] User can link existing methods to a test
- [ ] User can create a new method inline without navigating away
- [ ] New method is automatically linked after creation
- [ ] Default method can be set/changed

---

## NEW: Multi-Select Test Sections

### Requirements

1. **Multiple Section Assignment**
   - Test can belong to multiple laboratory units/sections
   - UI: Multi-select checkbox list (not single dropdown)
   - Scrollable if many sections

2. **Use Cases**
   - Cross-departmental tests (e.g., Blood Gas done by both Chemistry and Respiratory)
   - Training/backup scenarios (multiple units capable of running test)
   - Reference lab routing options

3. **UI Implementation**
   - Bordered container with checkbox list
   - All sections visible (scrollable if >8)
   - "Select one or more" helper text

### Data Model

```sql
-- Junction table for test-section many-to-many
CREATE TABLE test_section_assignment (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    section_id INTEGER NOT NULL REFERENCES test_section(id),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, section_id)
);
```

### Acceptance Criteria

- [ ] User can select multiple sections for a test
- [ ] At least one section required (validation)
- [ ] Primary section can be designated (optional)
- [ ] Test appears in worklists for all assigned sections

---

## Updated Acceptance Criteria (Complete)

### Test Domain
- [ ] Test entity has a `domain` column constrained to CLINICAL / ENVIRONMENTAL / VECTOR
- [ ] Basic Info section presents Domain as a radio button group
- [ ] Domain is required — cannot save Basic Info without a selection
- [ ] CLINICAL tests do not show the Compliance section in the SideNav
- [ ] ENVIRONMENTAL and VECTOR tests show the Compliance section as primary
- [ ] ENVIRONMENTAL and VECTOR tests show an InlineNotification info banner on the Ranges section
- [ ] Editing Domain on an existing test triggers a confirmation modal before save
- [ ] Test List View has a Domain filter (multi-select chip)
- [ ] Test List View shows a Domain Tag column (blue / teal / purple)
- [ ] Existing tests are backfilled to CLINICAL during migration

### Internal Information Architecture
- [ ] Test editor's 14 sections appear as a flat list in the SideNav under Test Catalog Management → [Test Name]
- [ ] No group headers within the test editor SideNav
- [ ] Each section is reachable at its own route (`/admin/test-catalog/:testId/<section>`)
- [ ] Breadcrumb shows Admin › Test Catalog Management › [Test Name] › [Section Name]
- [ ] No Carbon `Tabs` component used for editor primary navigation

### Permissions
- [ ] `admin.testCatalog.manage` gates access to all `/admin/test-catalog/...` routes (UI hide + API 403)
- [ ] `compliance.threshold.view` gates the Compliance SideNav item and route
- [ ] All write endpoints check `admin.testCatalog.manage` server-side

### States
- [ ] Test List View, Ranges, Methods, Analyzers, Reagents, Alerts, Reflex & Calc, Compliance, Panels, Labels each define an empty state
- [ ] Table-bearing sections show Carbon DataTableSkeleton during initial fetch
- [ ] API errors render Carbon InlineNotification kind="error" at the top of the affected section
- [ ] No-permission state is the standard "You do not have permission" empty page

### Range Editor
- [ ] All four range types support age/sex-specific variations
- [ ] Age can be specified in hours, days, weeks, months, or years
- [ ] Ranges displayed sorted by age (0-24 hours first, then 24-48 hours, etc.)
- [ ] Structured view groups by type, then sex, sorted by age
- [ ] Visual view shows applicable ranges for selected demographic

### Coverage Validation (Functional)
- [ ] Gaps and overlaps detected and displayed clearly
- [ ] Clicking "Fill Gap" opens add modal with pre-filled values from adjacent range
- [ ] User can modify pre-filled values before saving
- [ ] "Copy to other sex" action available on each range
- [ ] Validation panel shows male/female status separately

### Test Ordering
- [ ] Drag-and-drop reordering with visual feedback
- [ ] Arrow buttons for accessibility
- [ ] Order is sample-type specific
- [ ] Order persisted and used in order entry

### Panel Membership
- [ ] Multi-select panel assignment
- [ ] Selected panels expand to show order configuration
- [ ] User can set position via numeric input
- [ ] User can set position via drag-and-drop in preview list
- [ ] Both input methods stay synchronized
- [ ] Preview shows where test will appear in panel order
- [ ] Inline panel creation without navigation
- [ ] New panels immediately available after creation

### Localization Hardening
- [ ] System never throws errors when translation is missing
- [ ] Missing translations fall back to primary language automatically
- [ ] Fallback values are visually distinguishable from native translations
- [ ] Test editor shows translation status for each supported language
- [ ] API returns both value and source language information
- [ ] Bulk export of untranslated strings is available

### AMR Test Flag
- [ ] Tests can be flagged as AMR tests via checkbox
- [ ] AMR configuration panel appears when flag is enabled
- [ ] WHONET antibiotic code can be selected from standard list
- [ ] Breakpoint standard (CLSI/EUCAST) can be specified
- [ ] AMR tests are properly exported to WHONET format

### AMR Filter (Test List View)
- [ ] Filter dropdown includes "All Tests", "AMR Tests Only", "Non-AMR Tests" options
- [ ] AMR tests display purple "AMR" badge in list view
- [ ] Badge tooltip shows WHONET antibiotic code
- [ ] Filter correctly filters test list based on `is_amr_test` flag

### Alert Rules
- [ ] Users can create multiple alert rules per test
- [ ] Rules can be enabled/disabled individually
- [ ] Trigger conditions include: All, Abnormal, Critical, Specific Value
- [ ] SMS and Email delivery channels available
- [ ] Recipients can be: ordering physician, patient, custom contact, role-based
- [ ] Message templates support variable substitution
- [ ] Alert delivery is logged for audit

### Reflex Tests
- [ ] Display reflex rules triggered by this test's results
- [ ] Display reflex rules that order this test
- [ ] Show trigger condition, target tests, and order mode
- [ ] "Edit in Master Lists" link opens reflex management page
- [ ] "Add New Reflex Rule" link pre-fills trigger test

### Calculated Results
- [ ] Display calculations that use this test as input
- [ ] Display if this test is a calculated result with its formula
- [ ] "Edit in Master Lists" link opens calculated value management
- [ ] "Configure in Master Lists" link pre-fills result test

### Sample Storage
- [ ] Storage conditions can be selected from standard list or custom entry
- [ ] Storage duration required with unit selection (hours/days/weeks/months)
- [ ] Special handling checkboxes (protect from light, do not freeze, etc.) persist correctly
- [ ] Disposal method required with optional timeframe
- [ ] Special instructions field supports free text
- [ ] Override Restricted flag locks settings in order entry
- [ ] Changes are tracked in version history

### Status Flags
- [ ] "Internal QA - No Results Release" flag prevents results from appearing on patient reports
- [ ] Flag description tooltip explains purpose clearly

### Method Linking
- [ ] Link existing methods to test
- [ ] Inline method creation without navigation
- [ ] Set default method
- [ ] Effective date tracking
- [ ] Method code field for macro-style quick entry
- [ ] Copy methods from another test

### Result Interpretations
- [ ] Add interpretations with code, label, optional color, value/range, and interpretation text
- [ ] Label field accepts any text (not limited to predefined conditions)
- [ ] Color dropdown provides visual distinction options (red, orange, yellow, green, teal, blue, purple, pink, gray)
- [ ] Live preview shows label with selected color in modal
- [ ] Interpretation codes enable macro-style quick entry in result entry screen
- [ ] Interpretations are added as external notes when result meets value criteria
- [ ] For numeric tests: show text input for value expressions (>, <, >=, <=, ranges)
- [ ] For select list tests: show checkbox list of test's configured options
- [ ] For select list tests: allow selecting 1 or more values that trigger the interpretation
- [ ] Selected values displayed as removable tags in the modal
- [ ] Reorder interpretations via drag-and-drop
- [ ] Toggle interpretations active/inactive
- [ ] Edit existing interpretations via modal
- [ ] Delete interpretations with confirmation
- [ ] Copy interpretations from another test (with replace/append option)
- [ ] Copy preserves labels and colors from source test

### Test Sections
- [ ] Multi-select section assignment (not single dropdown)
- [ ] Minimum one section required
- [ ] Test appears in all assigned section worklists

### Labels Tab
- [ ] Labels tab appears in test configuration editor
- [ ] Admin can add multiple label presets to a test
- [ ] Admin can set default and max quantities per preset
- [ ] Admin can enable/disable override per label type
- [ ] Global "allow override at order entry" setting works correctly
- [ ] Order Entry preview shows expected label configuration

### Label Preset Management
- [ ] Admin can create new label presets with unique names
- [ ] Admin can configure preset dimensions (height, width)
- [ ] Admin can select/deselect content fields
- [ ] Admin can reorder fields via drag-and-drop
- [ ] Admin can select barcode type and position
- [ ] Live preview updates in real-time as settings change
- [ ] Admin can deactivate presets
- [ ] System presets cannot be deleted (only edited)
- [ ] Presets in use by tests cannot be deleted

### Reagents Tab
- [ ] Reagents tab appears in test configuration editor
- [ ] Link reagents from Master Lists to test
- [ ] Specify usage type (PRIMARY/SECONDARY) per reagent
- [ ] Specify quantity consumed per test
- [ ] Display current stock level from inventory
- [ ] Unlink reagents with confirmation

### Analyzers Tab
- [ ] Analyzers tab appears in test configuration editor
- [ ] Link analyzers from Master Lists to test
- [ ] Multi-select analyzers in link modal
- [ ] Display analyzer status (Online/Offline/Maintenance)
- [ ] Display analyzer location and serial number
- [ ] Unlink analyzers with confirmation
- [ ] Info card explains analyzer linking purpose and that test code mapping is separate

### Order Entry Label Integration
- [ ] Order Entry shows all label types from selected tests
- [ ] Label counts pre-populated from test configuration
- [ ] Source (test name) shown for each label count
- [ ] Multiple tests aggregate correctly (highest count wins)
- [ ] Non-overridable labels are displayed as read-only

### Compliance Tab
- [ ] Compliance section appears as the 14th SideNav item under "Test Catalog Management" → [Test Name] (flat list, no group header)
- [ ] Section is reachable at route `/admin/test-catalog/:testId/compliance`
- [ ] Tab displays DataTable of all compliance thresholds defined for this test
- [ ] Thresholds grouped by Standard Name (default) or Parameter Group via "Group by" toggle
- [ ] Threshold types shown as colored Tags: MAX (red), MIN (blue), RANGE (teal), DESCRIPTIVE (purple)
- [ ] Inline row expansion for add/edit threshold forms (not modals)
- [ ] ComboBox with type-ahead for standard selection
- [ ] Conditional form fields based on threshold type (upper value for MAX, lower for MIN, both for RANGE, text for DESCRIPTIVE)
- [ ] Badge on the Compliance SideNav item showing threshold count
- [ ] Tab visible only to users with `compliance.threshold.view` permission
- [ ] Full specification in companion FRS: S01-compliance-standards-admin-frs-v1.0.md

---

## NEW: Compliance Tab (S-01 Integration)

### Purpose

Enable per-test regulatory compliance threshold management. Environmental, vector, and food safety laboratories evaluate results against externally published regulatory standards (e.g., Indonesia's Baku Mutu, WHO Drinking Water Guidelines, EPA limits) rather than patient-centric reference ranges. The Compliance tab provides the configuration surface for these thresholds within the unified Test Editor.

### SideNav Placement

Per the Internal Information Architecture section earlier in this FRS, the Compliance section is the 14th and final entry in the test editor SideNav. The 14 sections appear as a flat list in workflow order — no group headers — under the "Test Catalog Management" parent in the global Admin SideNav:

```
Test Catalog Management
  ├── Basic Info
  ├── Sample & Results
  ├── Methods
  ├── Ranges
  ├── Sample Storage
  ├── Display Order
  ├── Panels
  ├── Labels
  ├── Terminology
  ├── Reagents
  ├── Analyzers
  ├── Alerts
  ├── Reflex & Calc
  └── Compliance       ← this section
```

Route: `/admin/test-catalog/:testId/compliance`. Visibility gated by the `compliance.threshold.view` permission key — see the Permissions section earlier in this FRS.

### Key Features

1. **Threshold DataTable** — Lists all compliance thresholds for the current test with columns: Standard Name, Parameter Group, Type (Tag), Value, Unit, Effective Date, Status
2. **Group By Toggle** — Switch between grouping by Standard or Parameter Group
3. **Inline Add/Edit** — Row expansion forms with conditional fields based on threshold type (MAX → upper value; MIN → lower value; RANGE → both; DESCRIPTIVE → text)
4. **Standard ComboBox** — Type-ahead selection from configured ComplianceStandard entities (only ACTIVE standards shown)
5. **Threshold Count Badge** — Tab label shows count of configured thresholds

### Data Model

The Compliance tab reads/writes `ComplianceThreshold` entities linked to the current test. See the full data model, API endpoints, and business rules in the companion FRS:

**Companion FRS:** `S01-compliance-standards-admin-frs-v1.0.md`

### Relationship to Ranges Tab

For environmental tests, the Compliance tab is the primary threshold configuration surface. The existing Ranges tab (Normal, Valid, Critical, Reporting) remains available for clinical tests. Both tabs can coexist — a test may have both clinical reference ranges and regulatory compliance thresholds.
