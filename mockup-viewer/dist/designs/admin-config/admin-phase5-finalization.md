# OpenELIS Admin Redesign — Phase 5 Finalization

**Version:** 2.0
**Date:** 2026-08-25
**Status:** For Casey's approval
**Supersedes:** `admin-phase5-roadmap.md` (2026-04-23) · `admin-mvp-scope.md` v1.8 (2026-05-14)
**Live baseline:** `https://testing.openelis-global.org`, **v3.2.2.0**, walked route-by-route 2026-08-25

---

## 1. Why this document exists

The admin redesign was planned in April 2026 and last revised on 2026-05-14, where it stopped at an
unanswered approval gate. Three months of development have shipped since. This document re-grounds
the whole Phase 5 program against what the application actually does today, resolves the
contradictions that accumulated inside the planning documents, and states a finalized disposition
for every admin page.

The headline: **the plan is not slightly stale, it is structurally stale.** Nine pages the roadmap
scheduled for design have already shipped. Five pages it scheduled for redesign are empty. Eleven
pages exist in the live app that the roadmap has never heard of. Two of the five "Top-5 priority"
pages are already modern Carbon screens that need polish, not redesign.

---

## 2. Live verification findings

I walked every admin route on v3.2.2.0. The live SideNav now carries **44 entries** resolving to
**33 distinct pages** across 8 collapsible groups — against the roadmap's assumed 42 pages in 11
buckets.

### 2.1 Shipped since the plan was written — remove from the design backlog

| Page | Live route | Roadmap said | Reality |
|---|---|---|---|
| Test Catalogue Editor | `/MasterListsPage/TestCatalogList` | Deferred to "separate project" | **Shipped** — routed 14-section editor |
| Panel Editor | `/MasterListsPage/TestCatalogList?entity=panels` | Deferred | **Shipped** |
| Sample Type Editor | `/MasterListsPage/SampleTypeEditor` | Deferred | **Shipped** |
| Lab Units | `/MasterListsPage/LabUnitManagement` | Not in roadmap | **Shipped** |
| Label Presets | `/MasterListsPage/labelPresets` | "Barcode Configuration — print-preview treatment" | **Shipped** as Label Presets; `barcodeConfiguration` now **redirects** here |
| Calendar Management | `/MasterListsPage/calendarManagement` | "Calendar grid — custom layout, allocate extra session" | **Shipped** — holidays, weekend config, CSV import/export, TAT working-time |
| Site Branding | `/MasterListsPage/SiteBrandingMenu` | "Live theme preview" | **Shipped** — logos, favicon, 3 colour tokens, reset |
| Translation Management | `/MasterListsPage/translationManagement` | To design | **Shipped** — per-locale progress, missing-only filter, CSV export |
| External Connections | `/MasterListsPage/externalConnections` | To design | **Shipped** — Carbon list with Deactivate |
| Logging Configuration | `/MasterListsPage/loggingManagement` | "Dev-facing" | **Shipped** — runtime log level + live log stream |
| Sample Acceptance Checklist | `/MasterListsPage/SampleAcceptanceChecklist/{all,clinical,environmental,vector}` | Not in roadmap | **Shipped** — domain-scoped checklists |
| Compliance Standards Administration | via Test Management hub | Not in roadmap | **Shipped** — but see §2.5, it has no SideNav entry |

**Net: 12 surfaces come off the design backlog.** The roadmap's estimate of "~30 sessions to full
coverage" was built on a page list that no longer exists.

### 2.2 Pages targeted for redesign that are **empty**

This is the single most consequential finding. Five of the pages the MVP scope planned to redesign
and retire contain **zero configuration rows** on a live instance:

| Page | Route | Rows | MVP Story B plan |
|---|---|---:|---|
| Result Entry Configuration | `ResultConfigurationMenu` | **0** | B.3 — "in-place redesign, inline form grouped by purpose" |
| Patient Entry Configuration | `PatientConfigurationMenu` | **0** | B.2 — merge with Order Entry |
| NonConformity Configuration | `NonConformityConfigurationMenu` | **0** | B.6 — "in-place redesign" |
| Printed Report Configuration | `PrintedReportsConfigurationMenu` | **0** | B.7 — "redesign with real-data preview affordance" |
| MenuStatement Configuration | `MenuStatementConfigMenu` | **0** | Legacy bucket — retire with Menu Configuration |

Two more are close to empty:

| Page | Rows | Content |
|---|---:|---|
| WorkPlan Configuration | 3 | `next visit on workplan`, `results on workplan`, `subject on workplan` |
| Validation Configuration | 4 | four `*Charset` allowed-character strings |

**Consequence:** four of Story B's nine surfaces (B.2 partly, B.3, B.6, B.7) are designing screens
with nothing on them, and two more (B.4, B.5) are designing a full page around 3–4 properties. Story
B as written spends most of its budget on the emptiest surfaces in the application.

### 2.3 Pages whose scope grew — existing designs now undersized

| Page | Plan assumed | Live today |
|---|---|---|
| **Order Entry Configuration** | "only 2 settings each — natural merge candidate" with Patient Entry | **20 properties**, including `requesterRequired` (OGC-1143, shipped), 3 × `sampleAcceptCheck.*`, 3 × `gps*`, 4 × `restrictFreeText*`, `eqaEnabled`, `contactTracingEnabled` |
| **Site Information** | Four sub-domains: lab identity, patient search, banner, locale | **32 properties** — now also e-signature (21 CFR Part 11), freezer BACnet/Modbus ports, FHIR SNOMED container/non-conformity codes, `referralStuckThresholdDays`, `requireLabUnitAtLogin`, `siteOrganizationFhirUuid`, `boxLabelPrefix`, `overrideDefaultTranslation` |

The Order Entry / Patient Entry merge (B.2) rests on a premise that is now false in both directions:
Order Entry has ten times the settings assumed, and Patient Entry has none.

**Also contradicted:** MVP scope v1.8's header records "multi-locale fields dropped per Casey
2026-05-14 — labs set banner / address labels once in their primary language." The live app already
stores `bannerHeading` and `billingRefNumberLocalization` **per locale** ("English: Test LIMS /
French: Test LIMS"). The decision to drop multi-locale was overtaken by shipped behaviour.

### 2.4 Pages live today that the roadmap never listed

| Page | Route | Note |
|---|---|---|
| Vector Surveillance — Species | `/MasterListsPage/vectorSurveillanceSetup/species` | **Renders with no breadcrumb and no page title** — see §2.6 |
| Vector Surveillance — Trap Types | `…/trap-types` | |
| Vector Surveillance — Sampling Sites | `…/sampling-sites` | |
| Vector Surveillance — Manual Entry Field Map | `…/manual-entry-fields` | |
| Sample Acceptance Checklist × 4 | `/MasterListsPage/SampleAcceptanceChecklist/*` | Breadcrumb parents it under *Order Entry Configuration* |
| FHIR Data Export Status | `/MasterListsPage/dataExportStatus` | Read-only subscriber monitor |
| Lab Units | `/MasterListsPage/LabUnitManagement` | |
| Compliance Standards Administration | (no direct route in SideNav) | |

**IA consequence: Vector Surveillance needs a bucket.** Four pages with no home in IA v2.3 is not a
rounding error — it is a twelfth bucket. IA v2.3 was ratified before the vector work landed.

### 2.5 Route changes since the inventory snapshot

The skill's `admin-ia-inventory.md` is a v3.2.1.x snapshot and has drifted:

| Inventory says | Live v3.2.2.0 |
|---|---|
| `testManagement` | **`testManagementConfigMenu`** |
| `barcodeConfiguration` | **redirects to `labelPresets`** |
| `eqaProgram` | **renders blank** — gone from SideNav |
| (absent) | `labelPresets`, `externalConnections`, `dataExportStatus`, `calendarManagement`, `SampleTypeEditor`, `TestCatalogList`, `LabUnitManagement`, `SampleAcceptanceChecklist/*`, `vectorSurveillanceSetup/*`, `nonConformityMenuManagement`, `patientMenuManagement`, `studyMenuManagement`, `ResultConfigurationMenu`, `PatientConfigurationMenu`, `PrintedReportsConfigurationMenu`, `ValidationConfigurationMenu` |

`admin-ia-inventory.md` should be re-synced from this walk.

### 2.6 Defects found during the walk

| ID | Page | Finding | Severity |
|---|---|---|---|
| L-01 | Language Management | Red **trash-can Delete** action per row — a hard delete on a domain record. Violates design-addendum MUST D / D-002. | **CRITICAL** |
| L-02 | `/MasterListsPage/eqaProgram` | Renders blank. Same class as BUG-49 (`menuConfiguration`). Page is unreachable from the nav but the route still resolves. | HIGH |
| L-03 | Vector Surveillance sub-pages | Render with **no breadcrumb and no page title** — outside the admin shell chrome every other page uses. | HIGH |
| L-04 | Language Management, Translation Management | Breadcrumb reads `Home / Admin / …` while every other admin page reads `Home / Admin Management / …`. Contradicts D-013. | MEDIUM |
| L-05 | Site Branding | Breadcrumb reads `Home / Admin Management / Site Information / Site Branding` — parented under a page it has no relationship to. | MEDIUM |
| L-06 | Global Menu Configuration | Single flat checkbox tree of ~300 nodes with no search, no collapse-all, one Submit. The MVP scope's TreeView-performance risk is real and already present. | MEDIUM |
| L-07 | Test Management | Still a legacy link-hub of ~22 links, most pointing into JSP. The largest un-migrated admin surface. | MEDIUM |
| L-08 | List Plugins | Legacy gray table, not Carbon. | LOW |

---

## 3. Decisions locked in this finalization

| # | Decision | Basis |
|---|---|---|
| **F1** | **New `/admin/<bucket>/<page>` namespace** is the canonical admin URL structure. Every legacy `/MasterListsPage/<editorKey>` redirects to its new home. | Casey, 2026-08-25 |
| **F2** | **Y pivot stands.** Nine-to-eleven distributed surfaces in their IA-correct buckets, reached via SideNav submenus. There is **no** consolidated "Application Settings" tab page. | Casey, 2026-08-25; D-003 |
| **F3** | **Empty pages are retired, not redesigned.** A configuration page with zero rows is removed from the SideNav, its route redirected to its bucket landing. No design work is spent on it. | §2.2 |
| **F4** | **IA v2.3 gains a twelfth bucket: Vector Surveillance.** | §2.4 |
| **F5** | **Already-modern pages get a polish pass, not a redesign.** User Management, Provider Management, Organization Management and Dictionary Menu are shipped Carbon screens with the same Modify/Deactivate/Add + search + filter shape. | §2.1, §5 |
| **F6** | **Feature Flags becomes its own page** under System Administration, not "the 10th Application Settings tab." | Follows from F2; supersedes D-020 |

---

## 4. Finalized IA — 12 buckets, live-verified

Bucket identities from IA v2.3, plus Vector Surveillance (F4). Page counts reflect what actually
exists.

| # | Bucket | Route | Pages | Change vs IA v2.3 |
|---|---|---|---:|---|
| 1 | People & Access | `/admin/people-access` | 4 | — |
| 2 | Test Catalog | `/admin/test-catalog` | 9 | +3 (editors shipped) |
| 3 | Reference Data | `/admin/reference-data` | 1 | — |
| 4 | Workflow Tuning | `/admin/workflow-tuning` | 4 | −4 (empties retired) |
| 5 | Subscriptions & Notifications | `/admin/subscriptions` | 2 | +1 (Notify User moved here) |
| 6 | Lab Setup | `/admin/lab-setup` | 4 | — |
| 7 | Lab Identity | `/admin/lab-identity` | 3 | +1 (Label Presets) |
| 8 | Integrations | `/admin/integrations` | 3 | +1 (FHIR Data Export Status) |
| 9 | Reporting & Exchange | `/admin/reporting-exchange` | 1 | −1 (Printed Report retired) |
| 10 | System Administration | `/admin/system-admin` | 8 | −1 (net) |
| 11 | **Vector Surveillance** | `/admin/vector-surveillance` | 4 | **new bucket** |
| 12 | Legacy | `/admin/legacy` | 2 | −1 |
| | **Total** | | **45** | |

45 live pages, of which **21 need no design work at all**.

---

## 5. Per-page disposition

Legend — **SHIPPED**: live and modern, close the design item · **POLISH**: modern, needs a small
consistency pass · **REDESIGN**: real design work remains · **RETIRE**: remove from the nav ·
**5b**: deferred to Phase 5b · **DESIGN EXISTS**: spec is written but has not shipped

### 1. People & Access

| Page | Live route | Disposition | Note |
|---|---|---|---|
| User Management | `userManagement` | **POLISH** | Carbon list, Modify/Deactivate/Add, lab-unit-role filter, Only Active / Only Administrator. Roadmap called this "Page 1, full pattern exercise" — that work is largely done. |
| Role Management | — | **REDESIGN** | Does not exist. RBAC PRD + mockup written 2026-03-04, never shipped. The one genuine Top-5 gap. |
| Provider Management | `providerMenu` | **POLISH** | Carbon list. FHIR link fields still to confirm. |
| Organization Management | `organizationManagement` | **POLISH** | Carbon list with parent-org column. |

### 2. Test Catalog

| Page | Live route | Disposition | Note |
|---|---|---|---|
| Test Catalogue Editor | `TestCatalogList` | **SHIPPED** | 14-section routed editor |
| Panel Editor | `TestCatalogList?entity=panels` | **SHIPPED** | |
| Sample Type Editor | `SampleTypeEditor` | **SHIPPED** | |
| Lab Units | `LabUnitManagement` | **SHIPPED** | |
| Analyzer Test Name | `AnalyzerTestName` | **POLISH** | |
| Compliance Standards Admin | — | **REDESIGN (IA only)** | Shipped but reachable only via the Test Management link-hub. Needs a SideNav slot. |
| **Test Management** | `testManagementConfigMenu` | **REDESIGN** | ~22 legacy links into JSP. Largest remaining legacy surface; most of its links now duplicate the shipped Test Catalogue Editor. Candidate for outright retirement once each link has a modern home. |
| Program Entry | `program` | **DESIGN EXISTS** | Live page is still a raw "Edit Json" questionnaire box. `programs-management.md` v2 (OGC-781) is written and unshipped. |
| Reflex Tests Management | `reflex` | **5b** | Rule cards with Activate/Deactivate |
| Calculated Value Tests | `calculatedValue` | **5b** | |

### 3. Reference Data

| Page | Live route | Disposition |
|---|---|---|
| Dictionary Menu | `DictionaryMenu` | **POLISH** — Carbon list, Add/Modify/Deactivate, LOINC column |

### 4. Workflow Tuning

| Page | Live route | Disposition | Note |
|---|---|---|---|
| Order Entry Configuration | `SampleEntryConfigurationMenu` | **REDESIGN** | 20 properties. Existing design assumed 2. Needs re-scoping around the real property set. |
| Sample Acceptance Checklist × 4 | `SampleAcceptanceChecklist/*` | **SHIPPED** | Re-parent: breadcrumb currently nests under Order Entry Configuration |
| Batch test reassignment | `batchTestReassignment` | **POLISH** | |
| Validation Configuration | `ValidationConfigurationMenu` | **DECISION NEEDED** | 4 charset properties. See §8 Q1. |
| WorkPlan Configuration | `WorkPlanConfigurationMenu` | **DECISION NEEDED** | 3 properties. See §8 Q1. |
| Result Entry Configuration | `ResultConfigurationMenu` | **RETIRE** | 0 rows |
| Patient Entry Configuration | `PatientConfigurationMenu` | **RETIRE** | 0 rows |
| NonConformity Configuration | `NonConformityConfigurationMenu` | **RETIRE** | 0 rows |

### 5. Subscriptions & Notifications

| Page | Live route | Disposition |
|---|---|---|
| Test Notification Configuration | `testNotificationConfigMenu` | **POLISH** — per-test × 4-channel grid; benchmark at 176 tests |
| Notify User | `NotifyUser` | **POLISH** |

### 6. Lab Setup

| Page | Live route | Disposition | Note |
|---|---|---|---|
| Site Information | `SiteInformationMenu` | **REDESIGN** | 32 properties, grew from the assumed ~12. Still carries C039 (`patientSearchPassword` unmasked in the modify view — verify). |
| Calendar Management | `calendarManagement` | **SHIPPED** | |
| Language Management | `languageManagement` | **REDESIGN (defect)** | Fix L-01 hard delete → Deactivate; fix L-04 breadcrumb |
| Translation Management | `translationManagement` | **POLISH** | Fix L-04 breadcrumb |

### 7. Lab Identity

| Page | Live route | Disposition |
|---|---|---|
| Site Branding | `SiteBrandingMenu` | **SHIPPED** — fix L-05 breadcrumb parenting |
| Lab Number Management | `labNumber` | **POLISH** — format-once, irreversible; needs a confirm step |
| Label Presets | `labelPresets` | **SHIPPED** |

### 8. Integrations

| Page | Live route | Disposition |
|---|---|---|
| External Connections | `externalConnections` | **SHIPPED** |
| List Plugins | `PluginFile` | **POLISH** — legacy gray table (L-08) |
| FHIR Data Export Status | `dataExportStatus` | **SHIPPED** |

### 9. Reporting & Exchange

| Page | Live route | Disposition | Note |
|---|---|---|---|
| Result Reporting Configuration | `resultReportingConfiguration` | **REDESIGN** | Three hardcoded, visually identical feed blocks (Result Reporting / Malaria Surveillance / Malaria Case Report) each with URL + Enabled/Disabled + queue size. No design exists. Should become a list of configurable feeds. |
| Printed Report Configuration | `PrintedReportsConfigurationMenu` | **RETIRE** | 0 rows |

### 10. System Administration

| Page | Live route | Disposition | Note |
|---|---|---|---|
| Application Properties | `commonproperties` | **REDESIGN** | 61 properties in a flat two-column list of raw keys. C052 Critical; highest-priority target. `application-properties.html` design exists — re-verify against the current property set. |
| Feature Flags | — | **DESIGN EXISTS** | New page (F6). `feature-flags.html` written. |
| Menu Configuration × 5 | `globalMenuManagement`, `billingMenuManagement`, `nonConformityMenuManagement`, `patientMenuManagement`, `studyMenuManagement` | **REDESIGN** | One template, five scopes. L-06 performance risk is live. |
| Search Index Management | `SearchIndexManagement` | **POLISH** | Single break-glass button |
| Logging Configuration | `loggingManagement` | **SHIPPED** | |

### 11. Vector Surveillance (new bucket)

| Page | Live route | Disposition |
|---|---|---|
| Species | `vectorSurveillanceSetup/species` | **REDESIGN (IA only)** — fix L-03 missing shell |
| Trap Types | `vectorSurveillanceSetup/trap-types` | **REDESIGN (IA only)** |
| Sampling Sites | `vectorSurveillanceSetup/sampling-sites` | **REDESIGN (IA only)** |
| Manual Entry Field Map | `vectorSurveillanceSetup/manual-entry-fields` | **REDESIGN (IA only)** |

### 12. Legacy

| Page | Live route | Disposition |
|---|---|---|
| MenuStatement Configuration | `MenuStatementConfigMenu` | **RETIRE** — 0 rows |
| EQA Program Management | `eqaProgram` | **RETIRE** — blank page (L-02); EQA lives at `/EQAManagement` |
| Legacy Admin | `/api/OpenELIS-Global/MasterListsPage` | **KEEP** — pointer |

### Disposition summary

| Disposition | Count |
|---|---:|
| SHIPPED — close the item | 15 |
| POLISH — small consistency pass | 11 |
| REDESIGN — real design work | 10 |
| DESIGN EXISTS — spec written, unshipped | 2 |
| RETIRE | 6 |
| Phase 5b | 2 |
| Keep as pointer | 1 |

**Ten pages need genuine design work**, not the 42 the roadmap projected. Two more have finished
specs waiting to ship.

---

## 6. Route redirect table

Required by F1. Every legacy route redirects; no admin bookmark breaks.

| Legacy route | Canonical route |
|---|---|
| `/MasterListsPage/userManagement` | `/admin/people-access/users` |
| `/MasterListsPage/providerMenu` | `/admin/people-access/providers` |
| `/MasterListsPage/organizationManagement` | `/admin/people-access/organizations` |
| `/MasterListsPage/TestCatalogList` | `/admin/test-catalog/tests` |
| `/MasterListsPage/TestCatalogList?entity=panels` | `/admin/test-catalog/panels` |
| `/MasterListsPage/SampleTypeEditor` | `/admin/test-catalog/sample-types` |
| `/MasterListsPage/LabUnitManagement` | `/admin/test-catalog/lab-units` |
| `/MasterListsPage/AnalyzerTestName` | `/admin/test-catalog/analyzer-test-names` |
| `/MasterListsPage/testManagementConfigMenu` | `/admin/test-catalog/test-management` |
| `/MasterListsPage/testManagement` | `/admin/test-catalog/test-management` |
| `/MasterListsPage/program` | `/admin/test-catalog/programs` |
| `/MasterListsPage/reflex` | `/admin/test-catalog/reflex-tests` |
| `/MasterListsPage/calculatedValue` | `/admin/test-catalog/calculated-values` |
| `/MasterListsPage/DictionaryMenu` | `/admin/reference-data/dictionary` |
| `/MasterListsPage/SampleEntryConfigurationMenu` | `/admin/workflow-tuning/order-entry` |
| `/MasterListsPage/SampleAcceptanceChecklist/:domain` | `/admin/workflow-tuning/sample-acceptance/:domain` |
| `/MasterListsPage/batchTestReassignment` | `/admin/workflow-tuning/batch-reassignment` |
| `/MasterListsPage/ValidationConfigurationMenu` | `/admin/workflow-tuning/validation` *(pending §8 Q1)* |
| `/MasterListsPage/WorkPlanConfigurationMenu` | `/admin/workflow-tuning/workplan` *(pending §8 Q1)* |
| `/MasterListsPage/ResultConfigurationMenu` | `/admin/workflow-tuning` *(retired → bucket landing)* |
| `/MasterListsPage/PatientConfigurationMenu` | `/admin/workflow-tuning` *(retired)* |
| `/MasterListsPage/NonConformityConfigurationMenu` | `/admin/workflow-tuning` *(retired)* |
| `/MasterListsPage/testNotificationConfigMenu` | `/admin/subscriptions/test-notifications` |
| `/MasterListsPage/NotifyUser` | `/admin/subscriptions/notify-user` |
| `/MasterListsPage/SiteInformationMenu` | `/admin/lab-setup/site-information` |
| `/MasterListsPage/calendarManagement` | `/admin/lab-setup/calendar` |
| `/MasterListsPage/languageManagement` | `/admin/lab-setup/languages` |
| `/MasterListsPage/translationManagement` | `/admin/lab-setup/translations` |
| `/MasterListsPage/SiteBrandingMenu` | `/admin/lab-identity/branding` |
| `/MasterListsPage/labNumber` | `/admin/lab-identity/lab-numbers` |
| `/MasterListsPage/labelPresets` | `/admin/lab-identity/label-presets` |
| `/MasterListsPage/barcodeConfiguration` | `/admin/lab-identity/label-presets` *(already redirects live)* |
| `/MasterListsPage/externalConnections` | `/admin/integrations/external-connections` |
| `/MasterListsPage/PluginFile` | `/admin/integrations/plugins` |
| `/MasterListsPage/dataExportStatus` | `/admin/integrations/fhir-export-status` |
| `/MasterListsPage/resultReportingConfiguration` | `/admin/reporting-exchange/result-reporting` |
| `/MasterListsPage/PrintedReportsConfigurationMenu` | `/admin/reporting-exchange` *(retired)* |
| `/MasterListsPage/commonproperties` | `/admin/system-admin/application-properties` |
| `/MasterListsPage/globalMenuManagement` | `/admin/system-admin/menus/global` |
| `/MasterListsPage/billingMenuManagement` | `/admin/system-admin/menus/billing` |
| `/MasterListsPage/nonConformityMenuManagement` | `/admin/system-admin/menus/non-conformity` |
| `/MasterListsPage/patientMenuManagement` | `/admin/system-admin/menus/patient` |
| `/MasterListsPage/studyMenuManagement` | `/admin/system-admin/menus/study` |
| `/MasterListsPage/SearchIndexManagement` | `/admin/system-admin/search-index` |
| `/MasterListsPage/loggingManagement` | `/admin/system-admin/logging` |
| `/MasterListsPage/vectorSurveillanceSetup/:page` | `/admin/vector-surveillance/:page` |
| `/MasterListsPage/MenuStatementConfigMenu` | `/admin/legacy` *(retired)* |
| `/MasterListsPage/eqaProgram` | `/EQAManagement` *(retired; blank page today)* |
| `/MasterListsPage/menuConfiguration` | `/admin/system-admin/menus` *(fixes BUG-49 blank parent)* |
| `/MasterListsPage` | `/admin` |

**Rules:** 301 permanent for retained pages; retired pages redirect to their bucket landing with an
inline notification naming what happened to the setting. Query parameters carry through
(`?id=<uuid>` unchanged).

---

## 7. Reconciliation of `admin-mvp-scope.md`

The document contradicts itself. §4 was rewritten on 2026-05-13 for the Y pivot; §5.1, §6, §7 and
§11 were never updated and still describe the superseded tab model. Required edits:

| Section | Problem | Fix |
|---|---|---|
| §5.1 URL stability | Locks 3 URLs (`/admin/system-admin/application-settings`, `…/menu-configuration`, `/admin/subscriptions/test-notification`) from the tab model | Replace with the §6 redirect table above |
| §6 Page retirement map | All 15 pages "retired into Application Settings" with a Tab column | Rewrite: 6 pages retired outright (empty), 9 redesigned in place in their buckets |
| §7 IA consequences | 42 → 27 page count from tab consolidation | Rewrite: 45 live pages → 39 after retirements, across 12 buckets |
| §11 Q1 | "Application Properties folded permanently as the 9th tab" | Supersede — it is its own page under System Administration |
| §11 Q4 | "One tab per retired page (9 tabs) in MVP" | Supersede — no tab page exists |
| §11 Q5 | "Feature Flags ships as a 10th tab" | Supersede — own page (F6) |
| §4 headings | B.1–B.9 followed by a second B.2/B.3/B.4 | Renumber B.1–B.9 |
| Header v1.8 note | "multi-locale fields dropped" | Reverse — multi-locale is already live (§2.3) |
| §10 Risks | "Application Settings grows a 10th tab" | Remove — no longer applicable |

---

## 8. Decisions needed from Casey

**Q1 — The two thin Workflow Tuning pages.** Validation Configuration has 4 charset properties;
WorkPlan Configuration has 3. Both are too small to justify a page, but F2 rules out a tab-based
settings page. Options:

- **(a)** Keep both as minimal pages in Workflow Tuning. Consistent with F2; two very sparse screens.
- **(b)** Fold both into the Application Properties redesign as domain-grouped sections. Application
  Properties is already a property-management surface and these are the same `SystemConfiguration`
  rows — this is grouping within one surface, not a tab page, so it does not breach F2. *(Recommended.)*
- **(c)** Fold the 4 charsets into Application Properties and keep WorkPlan Configuration where it is,
  since its 3 settings are workflow-facing rather than system-facing.

**Q2 — Test Management (`testManagementConfigMenu`).** A ~22-link legacy hub whose links now largely
duplicate the shipped Test Catalogue Editor. Redesign it as a modern landing page, or retire it and
redistribute its remaining unique links (Spelling corrections, Batch renames, Compliance Standards)?
*Recommendation: retire.* It is the last big JSP doorway and the editor has superseded most of it.

**Q3 — Role Management.** The RBAC PRD is from March and has not shipped. Does it stay in Phase 5 as
the one real People & Access gap, or move to its own track given its size?

**Q4 — Defect handling.** L-01 (Language Management hard delete) is a live MUST-D violation and L-02
(blank `eqaProgram`) is a live broken route. File these as bugs now, independent of the redesign, or
fold them into the redesign tickets?

---

## 9. `/analyze` + `/crosscheck` findings

### Constitution / design-addendum

| ID | Pass | Finding | Severity |
|---|---|---|---|
| F-01 | D — MUST D / D-002 | Language Management ships a per-row hard Delete on a domain record | **CRITICAL** (live app, not the spec) |
| F-02 | I — Stubbed sections | `admin-shell-preview.html` stubs every page body with "Not yet designed". Acceptable for a shell preview, but it must not be the review artifact for page-level work | MEDIUM |
| F-03 | L — Lab Context | Neither `admin-phase5-roadmap.md` nor `admin-mvp-scope.md` has a `## Lab Context` section. Any FRS spun out of them must open with one | HIGH |
| F-04 | J — Access/roles | Both documents gate everything on `ADMIN_MENU` with "no per-bucket permission matrix in MVP", but the shell brief §5 leaves permission-based bucket hiding as an open question. A user without access must have a stated experience | HIGH |

### Cross-feature (decision log)

| ID | Decision | Conflict | Severity | Resolution |
|---|---|---|---|---|
| X-01 | **D-010** | D-010 fixes the global admin buckets as *Config / Organization / Resources / Automation / Compliance*. IA v2.3 uses eleven entirely different buckets. These have coexisted, contradicting, since April. | **CRITICAL** | Supersede D-010 with the 12-bucket IA in §4. This is the single most important ledger fix — every future admin placement cites D-010 today. |
| X-02 | **D-012** | D-012 makes `/MasterListsPage/<editorKey>` the GLOBAL admin URL pattern. F1 replaces it. | **CRITICAL** | Supersede D-012: legacy pattern for un-migrated pages, `/admin/<bucket>/<page>` canonical for the redesign. |
| X-03 | **D-020** | D-020 makes Feature Flags "the 10th Application Settings tab". F2/F6 remove that page. | HIGH | Supersede D-020. |
| X-04 | **D-013** | D-013 records breadcrumb "Admin Management". Live app now uses both "Admin" and "Admin Management" (L-04). | MEDIUM | Amend D-013: "Admin Management" is canonical; the "Admin" variant on Localization pages is a defect to fix. |
| X-05 | **D-021** | D-021 says Study Menu Configuration retires with the RETROCI flag. It is still live at `studyMenuManagement`. | MEDIUM | Re-confirm — instance of D-025 (Done ≠ shipped). |
| X-06 | **D-019** | Already correctly superseded — Label Presets shipped. No action. | — | Clean |

### Registry upkeep triggered

- `admin-ia-inventory.md` — re-sync from this walk (§2.5); it is a v3.2.1.x snapshot with 16 missing routes and 3 wrong ones.
- `current-state-gotchas.md` — add L-01 through L-08; add "Vector Surveillance admin pages exist".
- `decision-log.md` — supersede D-010, D-012, D-020; amend D-013; re-confirm D-021.
- `spec-registry.md` — add the Phase 5 finalization row.

---

## 10. What actually remains

Ordered by value, with the live evidence behind each:

1. **Application Properties** — 61 raw property keys in a flat list. C052 Critical. Design exists, needs re-verification against the current property set.
2. **Admin Shell (Story A)** — the frame. Brief approved April; re-scope to 12 buckets and the §6 redirect table.
3. **Menu Configuration × 5** — one template, five scopes; ~300-node tree needs search and collapse (L-06).
4. **Site Information** — 32 properties, up from ~12. Re-scope.
5. **Order Entry Configuration** — 20 properties, up from an assumed 2. Re-scope; drop the Patient Entry merge.
6. **Test Management** — retire or redesign (Q2).
7. **Result Reporting Configuration** — three hardcoded feed blocks → a configurable feed list. No design exists.
8. **Role Management** — RBAC PRD unshipped (Q3).
9. **Vector Surveillance × 4** — IA/shell fix only (L-03).
10. **Compliance Standards Administration** — SideNav slot only.

Plus two finished specs awaiting delivery: **Program Entry** (OGC-781) and **Feature Flags**.

**Revised estimate: ~10 design sessions, not ~30.** Two-thirds of the projected Phase 5 workload has
either shipped or evaporated.

---

## 11. What users will hate — and the plan changes that follow

A finalized plan that no admin wants is still a bad plan. This section is the adversarial pass,
ranked by how much pain each item causes. Several of these are criticisms of §1–§10 above.

### 11.1 The URL migration is scoped as a routing task. It is a documentation and training migration.

F1 changes 45 URLs. §6 answers that with a redirect table, as if redirects were the whole problem.
They are not.

`docs-manual/contracts.json` pins each manual section to **live routes plus on-load UI anchors**
(headings, labels, buttons), and `tests/docs/drift.check.spec.ts` asserts those anchors still exist.
Every manual section covering an admin page breaks on migration day in two ways at once: the pinned
route 404s or redirects, and the captured screenshots show a breadcrumb chain that no longer exists.
The contracts are already at `capturedVersion` 3.2.1.10 against a live 3.2.2.0 — the manual is
drifting *before* we touch anything.

Beyond the repo, nothing redirects:

- Locally-authored training decks and PDFs at each deployment, many in French, none in version control.
- Support muscle memory — "go to MasterListsPage slash commonproperties" is how the team talks.
- Deep links pasted into Jira tickets, emails and Slack going back two years.
- Admin bookmarks. Redirects cover these, but 50 redirects is 50 chances to miss one.

`/analyze` Pass N exists precisely to catch this and I ran it without flagging a single docs impact.
That was a miss.

**Change — F9.** The redirect table is a docs deliverable. Migration is not done until every affected
`contracts.json` section is re-captured, `capturedVersion` bumped, and the drift check is green.
Budget the re-capture explicitly; it is not free.

### 11.2 Forty-five pages get reorganized and there is no search

The shell brief §11 lists cross-bucket search as an open question, to be flagged "for Phase 6 if
admins ask for it." That is backwards. Search is not a nice-to-have that follows a reorganization —
it is the thing that makes a reorganization survivable. On day one, every admin's spatial memory of
the current nav is void, and the only recovery path on offer is browsing 12 buckets.

It is worse than the April plan assumed, because the inventory is 45 pages, not 42, and the buckets
are lopsided: System Administration holds 8, Reference Data holds 1.

**Change — F7.** Cross-bucket search ships **in Story A, with the shell**. It searches page names,
property keys, and i18n labels — so an admin who remembers `login.saml.entityId` but not which page
it lives on still lands in the right place.

### 11.3 My "empty pages" evidence is one instance — and the admin surface varies by build

This is the weakest claim in §2.2, and F3 rests entirely on it.

I observed zero rows on `testing.openelis-global.org` and concluded five pages are dead. One dev
instance is not evidence that a *production* deployment has nothing configured there. These are
`SystemConfiguration` rows filtered by category; a Madagascar or PNG database may well have rows in
categories that are empty on a test box. Result Entry Configuration is especially suspect — the
audit raised findings C045 and C046 against it, which implies it had content when it was audited.

The demo instance makes the general point sharply. `demo.openelis-global.org` runs **3.2.1.9**,
branded "Labsolution", and its admin nav is **materially different**: it has *Barcode Configuration*
where testing has *Label Presets*, and it has no Vector Surveillance group, no Sample Acceptance
Checklist, and no Test Catalogue Management group at all. The 45-page inventory in §4 is one build's
inventory, not the product's.

If we retire a page a deployment actually uses, those settings become unreachable. That is a
data-access regression, not a cleanup — and it is the kind of thing an admin discovers during an
accreditation audit.

**Change — F8, superseding F3.** No page is retired on single-instance evidence. Before any
retirement, run a row-count query against at least three real deployment databases (including one
distro). Empty everywhere → retire. Populated anywhere → it stays, and the redesign has to handle it.
Until that query runs, the six retirements in §5 are **provisional**.

### 11.4 The half-migrated state is the steady state, not a transition

Story A's fallback renders legacy JSP pages inside the new Carbon shell: a Carbon breadcrumb and rail
wrapped around a 2009 JSP form. Users experience that as two applications fighting, and it reads as
less finished than either one alone. April's risk register flagged it; my finalization did not
re-examine it.

With 10 pages still needing design and 2 specs unshipped, this mixed state persists for many
releases. It is not a brief awkward window.

**Change — F11.** Un-migrated pages do not get dressed in Carbon chrome. They open in an explicitly
marked legacy frame — one that says so — rather than being wrapped to look native. Honest beats
half-finished.

### 11.5 The Application Properties redesign may make it worse for the people who use it most

61 raw keys in a flat two-column list is genuinely bad for a newcomer. But it has one real virtue:
**Ctrl+F finds anything instantly**. Group those 61 keys into ~14 cards across 5 task-oriented groups
and an admin who knows `login.saml.entityId` now has to know which card owns it.

The heaviest users of this page are implementers and support engineers who already know the key
names. Grouping optimizes for the person who visits once and taxes the person who visits weekly.

**Change — F10.** The redesign keeps a flat **All properties** view with key search alongside the
grouped view. Grouping is the default; the flat list is one click away and searchable by raw key.

### 11.6 Menu Configuration risks adding ceremony without adding confidence

The ~300-node tree with a single Submit is bad. But if the redesign paginates or virtualizes per
scope, an admin making a bulk menu change now saves five times instead of once — and still has no
way to see what they changed before committing.

**Change.** The Menu Configuration redesign must include a pending-changes summary ("12 items shown,
3 hidden") before Submit. Reducing the tree without adding a diff trades one problem for another.

### 11.7 Francophone deployments get a *more* English admin than they have today

Live Translation Management reports French at **1257 / 2003 (62.8%)** — 746 strings already missing.
This plan adds a large batch of new strings: 12 bucket names, 45 page titles, every breadcrumb, every
retirement notice. Mandating `t(key, fallback)` guarantees a key exists; it does not produce a French
string. The fallback *is* the English text.

For Madagascar and Côte d'Ivoire, the visible result of an admin modernization is more English on
screen than before. That is a bad trade for the deployments that use admin most heavily.

**Change — F12.** New admin i18n keys ship with French. Story A is not done until `fr` coverage for
the new keys is 100%, and the coverage number goes in the Definition of Done.

### 11.8 There is no transition plan at all

§1–§10 give dispositions and routes and say nothing about day one. No feature flag, no opt-in period,
no "old navigation still available", no in-app affordance telling a returning admin that a page moved.
April at least raised the feature-flag idea in its risk register. I dropped it.

**Change — F15.** The new shell ships behind a flag, defaulting off, with the old nav available for
one full release. Deployments opt in when their local training is updated, not when we merge.

### 11.9 Retirement notices as written are dead ends

§6 says retired pages "redirect to their bucket landing with an inline notification naming what
happened." If the setting genuinely vanished, that notification tells an admin their setting is gone
and offers nothing further. Where did `results on workplan` go?

**Change — F14.** Every retirement notice either names the setting's new location and links to it, or
states plainly that the setting no longer applies and why. "This page has moved" is not an acceptable
message for a setting someone was looking for.

### 11.10 A twelfth bucket for a feature most deployments don't have

Vector Surveillance (F4) serves SILNAS Indonesia. Every other deployment gets a permanent bucket in
their admin rail for a module they don't run.

**Change — F13.** Buckets render only where their module is enabled. This also cleans up the demo
instance case in §11.3, where four buckets' worth of pages simply don't exist.

### 11.11 The uncomfortable question: who asked for this?

Nothing in the Phase 5 corpus cites user research. The 74 audit findings (C001–C074) are an expert
critique — a designer's read of the surface, not evidence of user demand. That does not make them
wrong, but it does mean the entire program is a designer-driven IA reorganization with no user
signal behind it.

Set against that: **Program Entry** is still a raw "Edit Json" textarea in production. Its v2 spec
(OGC-781) is written, approved and unshipped. That is a page where admins demonstrably struggle,
with a finished design sitting on a shelf, while the plan proposes ~10 sessions plus a large routing
migration to reorganize pages that mostly work.

**Change.** Before Story A gets a ticket, ship the two finished specs — Program Entry and Feature
Flags — and put the IA migration behind five to ten admin conversations at two deployments. If
admins report they can't find things, the reorganization is justified and we will know which buckets
are wrong. If they report that Application Properties and Program Entry are the pain, we have just
saved most of the program's cost and delivered the part that mattered.

### Summary of plan changes

| # | Change | Supersedes |
|---|---|---|
| **F7** | Cross-bucket search ships with the shell, not in Phase 6 | Shell brief §11 open question 3 |
| **F8** | No retirement on single-instance evidence; row-count query across ≥3 deployments first | **F3** |
| **F9** | Redirect table is a docs deliverable — re-capture and drift-check before "done" | §6 |
| **F10** | Application Properties keeps a flat, key-searchable All-properties view | §5 |
| **F11** | Legacy pages open in a marked legacy frame, not Carbon chrome | MVP scope §A.3 |
| **F12** | New admin i18n keys ship with French; coverage in the DoD | §8 non-functional |
| **F13** | Buckets render only where their module is enabled | **F4** |
| **F14** | Retirement notices name the destination or state the setting is gone | §6 |
| **F15** | Shell ships behind a flag; old nav available one full release | — |

And one sequencing change, which is the most important line in this document: **ship the two
finished specs and talk to ten admins before committing to the migration.**
