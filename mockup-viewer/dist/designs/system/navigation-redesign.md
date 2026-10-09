# Navigation Redesign: Main Menu and Admin Sidebar, FRS v0.1

**Status:** Approved 2026-09-24 · **Date:** 2026-09-24 · **Owner:** Casey Iiams-Hauser
**Scope:** every entry in the main side menu (active, inactive, JSON-profile-only and runtime-generated) and every entry in the Admin sidebar
**Inventory source:** `clinlims.menu` on the develop dev stack (image 2026-09-23, 196 rows) + changesets merged to `develop` after that image (QA menu `qa/001`, Batch Workplan `104`, Custom Data Export `3.6.x.x/003`) + `volume/menu/menu_config.json` + `AdminSideNav.jsx` / `Admin.jsx` at `develop` 3f8d526
**Preview:** `navigation-redesign-preview.html`

---

## Lab Context

### Current State

Everyone in the lab reaches their work through the side menu on the left of every OpenELIS screen. A reception clerk uses it to enter orders and find patients, a bench technician to open a workplan and enter results, a supervisor to validate and release results, a quality officer to check quality control (QC) charts and non-conforming events, and a lab manager to run reports. The menu is built from a database table: each row is a link or a folder, and a deployment turns rows on or off in Admin › Menu Configuration. Admin pages have a second, separate sidebar that is hard-coded in the frontend.

Over the last year the team shipped three domain order workflows (clinical, environmental, vector), a Quality Assurance module, cold storage monitoring, analyzers, specialty dashboards, a report builder and much more. Each feature added its own rows wherever seemed reasonable at the time. Nothing was taken away. Today the main menu has **220 entries, 24 top-level items and folders nested up to five levels deep**, and the Admin sidebar has **28 top-level items holding 58 pages**, in no particular order.

### Pain

- **Two front doors to the same task.** Order entry is offered as "Add Order" (the old single form) and as "Add Clinical Order" (the new workflow). Alerts appears twice. WHONET export (the file format used to send antimicrobial resistance data to national surveillance) appears twice at two different URLs. Delayed Validation appears twice. A clerk who picks the wrong door gets a screen that doesn't match their training.
- **Reports are buried.** To run the "Activity Report by Test", a manager opens Reports › Routine › Management Reports › Activity Reports › By Test Type: five clicks through folders, when the Routine Reports page itself already lists every one of those reports.
- **One lab's workflow is in everyone's menu.** 55 entries exist only for a single research study run by one laboratory in Côte d'Ivoire: 52 under the "Study" folders in Order, Patient, Validation and Reports, plus Help › Process Documentation and its two PDF request forms. Every other deployment either hides them by hand or shows them to confused staff.
- **Stock installs hide finished features.** The default profile that ships with OpenELIS still lists the menu as it stood before EQA (external quality assessment), analyzers, Turnaround Time, cold storage, WHONET and the environmental and vector reports existed. A new deployment does not see those features until someone edits a JSON file on the server.
- **Admin is a flat pile.** Site Information, Reflex Tests, Logging and the Test Catalog sit side by side with no grouping, three finished admin pages (Barcode Configuration, Environmental Compliance Standards, Notification Triggers) are not in the sidebar at all, and a lab administrator setting up a new site cannot tell which pages matter first.

### What Changes

The main menu reads in the order of a lab's day: **Orders & Patients, Samples & Supplies, Testing, Quality, Reports, Administration**, each under a small section heading, with Home and Alerts pinned at the top. Nothing is more than three levels deep. Every destination has exactly one menu entry. Old bookmarks still work because every removed URL redirects to its replacement.

The Study entries, the legacy "Add Order" form, the switched-off generic order workflow and other dead rows are removed from the code and the menu. A small number of entries that some deployments may still use (Generic Sample, two Côte d'Ivoire-specific reports) ship switched off, and a deployment can switch them back on in Menu Configuration. A stock install shows every finished feature, and each user still sees only the entries their role and lab units allow.

The Admin sidebar is grouped into five buckets, **Config, Organization, Resources, Automation, Compliance**, so an administrator can find a page by asking "what kind of thing am I changing?"

---

## Overview

This spec redesigns the information architecture (IA) of OpenELIS navigation. It does not redesign any page. It reorganizes and relabels existing menu rows, adds section headings using the `presentation_style = section` capability that landed in #4315 (OGC-479, 2026-09-23), adds icons using the same capability, removes or hides entries under a three-tier retirement rule, and regroups the hard-coded Admin sidebar.

Numbers, current → target:

| | Current | Target |
|---|---|---|
| Main menu entries (all rows, any state) | 220 | 119 (113 existing rows kept + 6 new heading/group rows) |
| Visible top-level items | 24 (no headings) | 30 across 6 labelled sections + 2 pinned |
| Maximum depth | 5 | 3 |
| Duplicate destinations | 7 | 0 |
| Admin top-level items | 28 | 5 buckets, 59 pages (3 orphan pages added, 2 removed) |

The top-level count rises because two deep folders (Quality Assurance, Reports) become section headings whose children sit at the top level. That trade is deliberate: a clerk scans six short labelled lists instead of opening a folder to discover what is inside it, and role and lab-unit filtering removes most of these items for any single user (a reception clerk sees roughly Home, Alerts, Orders, Patients, Sample Management and Help).

### Navigation & URL

- **Main menu:** no new pages; every kept entry keeps its current URL except the parents listed in FR-4 that lose a duplicate URL.
- **Admin sidebar:** every page keeps its `/MasterListsPage/<editorKey>` route; only its position and label change.
- **Menu Configuration** keeps its route `/MasterListsPage/globalMenuManagement`; its sidebar label becomes "Main Menu".
- **Breadcrumbs:** pages whose menu path changes update their breadcrumb to match (FR-15). Section headings are not breadcrumb crumbs. The "Admin" vs "Admin Management" breadcrumb drift is preserved (D-013).

---

## User Stories

- As a **reception clerk**, I want one obvious place to start an order for the kind of sample in front of me, so that I never land on an old form that doesn't match my training.
- As a **bench technician**, I want Workplan, Results and Validation next to each other under Testing, so that I can move through my shift without hunting.
- As a **quality officer**, I want QC, EQA, quality indicators, non-conforming events and audit trails in one Quality section, so that I can answer an inspector's question in three clicks.
- As a **lab manager**, I want every report one click from the Reports section, so that I don't need to remember which folder a report is filed under.
- As a **deployment administrator**, I want the menu to show every finished feature out of the box and let me switch off what my lab doesn't use, so that I don't have to edit server files to turn features on.

---

## Functional Requirements

Terms used below: NCE = non-conforming event; CAPA = corrective and preventive action; TAT = turnaround time; LNSP = Laboratoire National de Santé Publique (a national public health lab); JSP = the pre-React server-rendered pages.

### Structure

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | The main menu is organized into these sections, in this order: *(no heading)* Home, Alerts · **Orders & Patients** · **Samples & Supplies** · **Testing** · **Quality** · **Reports** · **Administration**. Section contents and order are as in Appendix A.1. | Headings follow the lab's day, not the order features were built |
| FR-2 | Section headings are menu rows with `presentation_style = 'section'` and no URL. Four are new rows (`menu_section_orders`, `menu_section_samples`, `menu_section_testing`, `menu_section_admin`). Two reuse existing rows restyled as headings: `menu_qa` becomes the **Quality** heading and `menu_reports` becomes the **Reports** heading, so their children move up one level without re-parenting. | Uses the #4315 renderer as is |
| FR-3 | No entry is more than three levels below its section heading (top-level item › child › grandchild). | Current maximum is 5 |
| FR-4 | A menu item that has children has no URL of its own. `menu_resultvalidation` (duplicated Routine) and `menu_analyzers` (duplicated Analyzers List) lose their URLs. `menu_inventory` and `menu_microbiology`, which each had a single child, become plain links to that child's URL and the child row is merged away. | Removes the "click parent, land on child" ambiguity |
| FR-5 | Every destination has exactly one menu entry. The seven duplicate pairs are resolved as listed in Appendix A.2 (Alerts, EQA Programs, EQA Distributions, Delayed Validation, WHONET export, Audit Trail, Admin dashboard). | Canonical WHONET entry is the Microbiology WHONET export (Q-3) |
| FR-6 | Every visible top-level item carries a Carbon icon. The frontend icon registry (`navigationIcons.js`) is extended with the keys in the Icon table below; each key is used by one top-level item only. Section headings and child items carry no icon. | Registry today has 9 keys |
| FR-7 | Two new group rows are added: **Referrals** (`menu_referrals`, under Orders, holds Sample Shipments and Referral Results; a referral is an order sent to another lab) and **Case Workbenches** (`menu_specialty`, holds Microbiology, Pathology, Immunohistochemistry, Cytology and Program Cases). | Gathers surfaces that were split across the menu |
| FR-8 | Entries are relabelled as listed in Appendix A.1 (e.g. "Order" → "Orders", "Add Clinical Order" → "Clinical", "Statistical QC" → "Quality Control", "NoteBook" → "Lab Notebook", "By Unit" → "By Lab Unit"). Each changed label gets a new i18n key; the old key is left in place if anything else uses it and deleted otherwise. | Constitution VII key hygiene |

### Retirement

| ID | Requirement | Notes |
|---|---|---|
| FR-9 | Every current entry is assigned exactly one disposition: **Keep**, **Merge**, **Hide** or **Remove** (Appendix A.2). No entry is left unassigned. | 113 kept, 22 merged, 7 hidden, 78 removed |
| FR-10 | **Remove** means the menu row is deleted, the route and page code that exist only for it are deleted (Constitution X), its i18n keys are deleted, and its URL redirects to the listed replacement or to Home when there is none. Remove applies to: all Study entries (52), Help › Process Documentation and its two PDFs, the legacy "Add Order" (`/SamplePatientEntry`), the switched-off generic order workflow, the runtime per-analyzer Results entries, and rows that are already switched off as duplicates or by earlier migrations. | Menu rows are navigation settings with no clinical or audit meaning, so deletion is allowed under the design addendum MUST D exception |
| FR-11 | **Merge** means the row is deleted because another entry already reaches the same page (a duplicate, a single child folded into its parent, an intermediate folder, or a report already listed on the Routine Reports landing page). Its URL, where it had one, redirects to the surviving entry. No page code is deleted. | |
| FR-12 | **Hide** means the row and its page stay, the row ships switched off (`is_active = false`), and an administrator can switch it on in Admin › Config › Menu Configuration › Main Menu. Hide applies to the Generic Sample entries (Create/Edit/Import/Enter Results) and, on the Routine Reports landing page, the HIV Test Summary and Routine CSV Report (both Côte d'Ivoire-specific). | Q-1 asks whether Generic Sample moves to Remove |
| FR-13 | The migration never switches **on** a row that a deployment had switched off, and never switches **off** a Keep row that a deployment had switched on. It re-parents, relabels, restyles and adds icons keyed on `element_id`, and is safe to run twice. | Protects local choices |
| FR-14 | The "Add Order" removal waits until the three domain order workflows are live on the target release (not only merged), per the add-order cleanup story. Until then `menu_sample_add` is hidden rather than removed. | D-025 Done ≠ shipped |

### Behavior

| ID | Requirement | Notes |
|---|---|---|
| FR-15 | Pages whose menu path changed update their breadcrumb to the new path (for example Referral Results: `Home / Orders / Referrals / Referral Results`). | Breadcrumb must match SideNav |
| FR-16 | Existing filtering keeps working: entries a user's role cannot open stay hidden (OGC-1151), domain workflows follow the user's lab-unit domains (OGC-1070), and the unified Results Entry flag `RESULTS_ENTRY_UNIFIED_ROUTE` still swaps Results Entry for the five legacy Results pages. | No new permission rules |
| FR-17 | A section heading whose children are all hidden for the current user is not shown. A group whose children are all hidden is not shown. | Avoids empty headings for narrow roles |
| FR-18 | Opening a page expands its section's group and marks the entry active, including for query-string URLs such as `/FreezerMonitoring?tab=2`. | Existing `useMenuAutoExpand` behavior carried over |
| FR-19 | **Billing** is shown only when a billing address is set in Billing Menu configuration. With no address it is hidden, instead of rendering a dead link. | Closes the root cause of OGC-469/470 |
| FR-20 | The shipped default profile `volume/menu/menu_config.json` is replaced so that a stock install shows the whole target menu. Its JSON-only entries (Microbiology, Microbiology WHONET export, Admin dashboard, Analyzer Import Issues) become database rows so Menu Configuration can see and toggle them. | Stock installs currently hide 32 active entries |
| FR-21 | Admin › Config › Menu Configuration › Main Menu shows section headings as headings, shows the new hierarchy, and no longer lists Removed or Merged rows. | Hidden rows stay listed so they can be switched on |

### Admin sidebar

| ID | Requirement | Notes |
|---|---|---|
| FR-22 | The Admin sidebar is grouped under five section headings in this order: **Config, Organization, Resources, Automation, Compliance** (D-010), with contents as in Appendix A.3. **Back to main menu** stays pinned at the top and **Legacy Admin** at the bottom. Clicking **Admin** in the main menu keeps today's behavior: the Admin sidebar replaces the main menu in the same panel, rather than expanding as a folder, because 59 pages would swamp the main menu. | |
| FR-23 | Three admin pages that are routed but missing from the sidebar are added: Barcode Configuration (`barcodeConfiguration`), Environmental Compliance Standards (`ComplianceStandardsAdmin`), Notification Triggers (`notificationTriggerConfig`). | Orphans found in `Admin.jsx` |
| FR-23a | Environmental Compliance Standards sits in **Resources**, next to Vector Surveillance, not in Compliance. It holds the regulatory limits (per parameter, per regulation) that environmental results are judged against, and it feeds the Environmental Compliance Dashboard. It has nothing to do with the lab's own accreditation or quality rules, so its label always carries "Environmental". The **Compliance** bucket is reserved for the lab's own quality rules. | Avoids confusing regulatory environmental limits with lab compliance (ISO 15189, accreditation) |
| FR-24 | Study Menu configuration (`studyMenuManagement`) is removed with the Study entries (D-021). MenuStatement Configuration (`MenuStatementConfigMenu`) is removed because Menu Configuration edits the same data (admin MVP decision Q2). Both routes redirect to Main Menu configuration. | |
| FR-25 | Reflex Tests and Calculated Values move inside Resources › Test Catalog. "Test Management (legacy)" stays in Resources because it is still the only way to reach Methods, Units of Measure and Result Select Lists; it is hidden when the Test Catalog covers those. | |
| FR-26 | Admin sidebar labels drop redundant words ("Result Entry Configuration" under Workflow Settings becomes "Result Entry"; "Dictionary Menu" becomes "Dictionary"). Page titles are unchanged. | Label changes only |
| FR-27 | Row fixes carried by the same migration: `menu_notebook` URL becomes `/NoteBookDashboard` to match the route's casing; `menu_microbiology` points at `/Microbiology/worklist`. | Today the notebook link works only because routing ignores case |

---

## Information & Data

This feature works only with data OpenELIS already holds.

- **Menu entry** (`clinlims.menu`): element ID (stable identifier, the key every change is matched on), parent, display order, label key, tooltip key, URL, open-in-new-window, active flag, hide-in-old-UI flag, and since 2026-09-23 presentation style (`section` or empty) and icon key.
- **Deployment menu profile** (`menu_config.json`): which entries a deployment includes or excludes, plus JSON-only entries and per-deployment overrides.
- **User scope** used for filtering: role, assigned lab units, and lab-unit domains (clinical, environmental, vector).
- **Admin sidebar**: not data; a hard-coded component. FR-22 to FR-26 change code only.

No new attributes are added. The six new rows (four section headings, two groups) use existing columns.

---

## Access

- Accessible via the existing roles. The redesign changes where entries sit, not who can open them.
- A user sees only the entries their role and lab units already allow (FR-16). Section headings and groups with nothing visible for that user are not shown (FR-17).
- Only an **Admin** can switch Hidden entries on or change menu configuration, as today.

---

## Icon table

| Icon key | Carbon icon | Used by |
|---|---|---|
| `home` | Home | Home (existing) |
| `alerts` | Notification | Alerts |
| `order` | DocumentAdd | Orders (existing) |
| `patient` | UserMultiple | Patients (existing) |
| `sample` | Catalog | Sample Management |
| `storage` | Box | Storage |
| `aliquot` | TestTool | Aliquoting |
| `inventory` | InventoryManagement | Inventory |
| `workplan` | Task | Workplan (existing) |
| `results` | Chemistry | Results (existing) |
| `validation` | CheckmarkOutline | Validation (existing) |
| `specialty` | Microscope | Case Workbenches |
| `analyzers` | Chip | Analyzers |
| `notebook` | Notebook | Lab Notebook |
| `qaOverview` | Dashboard | QA Overview |
| `qc` | ChartLineData | Quality Control |
| `eqa` | Certificate | EQA |
| `qi` | Meter | Quality Indicators |
| `nce` | WarningAlt | Non-Conformity & CAPA |
| `qms` | Policy | QMS & Improvement |
| `statusReport` | Report | Patient Status Report |
| `routineReports` | DocumentMultiple_01 | Routine Reports |
| `customExport` | DataTable | Custom Data Export |
| `tat` | Time | Turn Around Time |
| `whonet` | Export | WHONET Export |
| `environmental` | Earth | Environmental (reports) |
| `vector` | Bee | Vector Surveillance |
| `settings` | Settings | Admin (existing) |
| `billing` | Purchase | Billing |
| `help` | Help | Help |

All names were checked against `@carbon/icons-react` v11. The `reports` and `more` registry keys stop being used by the stock profile and stay in the registry for deployment profiles.

---

## Localization

REUSE = existing key, unchanged. CHANGE = existing key, English value updated. NEW = new key in the `sidenav.*` namespace (Constitution VII: no cross-feature reuse). All new and changed keys need entries in every shipped language file; Transifex picks them up from `en.json`.

| Key | English | Status | Used by |
|---|---|---|---|
| `sidenav.section.patientOrders` | Orders & Patients | CHANGE (was "Patient & Orders") | Section heading |
| `sidenav.section.samples` | Samples & Supplies | NEW | Section heading |
| `sidenav.section.testing` | Testing | NEW | Section heading |
| `sidenav.section.quality` | Quality | NEW | `menu_qa` as heading |
| `sidenav.label.reports` | Reports | REUSE | `menu_reports` as heading |
| `sidenav.section.administration` | Administration | REUSE | Section heading |
| `sidenav.label.orders` | Orders | NEW | `menu_sample` |
| `sidenav.label.orders.clinical` | Clinical | NEW | `menu_clinical_workflow` |
| `sidenav.label.orders.environmental` | Environmental | NEW | `menu_environmental_workflow` |
| `sidenav.label.orders.vector` | Vector | NEW | `menu_vector_workflow` |
| `sidenav.label.orders.printBarcodes` | Print Barcodes | NEW | `menu_sample_print_barcode` |
| `sidenav.label.patients` | Patients | NEW | `menu_patient` |
| `sidenav.label.patients.merge` | Merge Patients | NEW | `menu_patient_merge` |
| `sidenav.label.storage.samples` | Sample Storage | NEW | `menu_storage_management` |
| `sidenav.label.aliquoting` | Aliquoting | NEW | `menu_aliquot` |
| `sidenav.label.referrals` | Referrals | NEW | `menu_referrals` |
| `sidenav.label.referrals.shipments` | Sample Shipments | NEW | `menu_sample_shipment` |
| `sidenav.label.referrals.results` | Referral Results | NEW | `menu_results_referred` |
| `sidenav.label.inventory` | Inventory | REUSE | `menu_inventory` |
| `sidenav.label.workplan.byLabUnit` | By Lab Unit | NEW | `menu_workplan_bench` |
| `sidenav.label.caseWorkbenches` | Case Workbenches | NEW | `menu_specialty` |
| `sidenav.label.microbiology` | Microbiology | REUSE | `menu_microbiology` |
| `sidenav.label.programCases` | Program Cases | NEW | `order_programmes` |
| `sidenav.label.analyzers.list` | Analyzers | NEW | `menu_analyzers_list` |
| `sidenav.label.analyzers.importIssues` | Import Issues | NEW | `menu_administration_stuck_analyzer_events` |
| `sidenav.label.notebook` | Lab Notebook | CHANGE (was "NoteBook") | `menu_notebook` |
| `sidenav.label.qa.qualityControl` | Quality Control | NEW | `menu_qa_qc` |
| `sidenav.label.eqa.orders` | EQA Orders | NEW | `menu_eqa_orders` |
| `sidenav.label.eqa.programManagement` | Program Management | NEW | `menu_eqa_mgmt_programs` |
| `sidenav.label.nce.group` | Non-Conformity & CAPA | NEW | `menu_nonconformity` |
| `sidenav.label.audit.system` | Audit Trail: System Events | NEW | `menu_reports_audittrail_system` |
| `sidenav.label.audit.order` | Audit Trail: Order Events | NEW | `menu_reports_audittrail_order` |
| `sidenav.label.reports.whonet` | WHONET Export | NEW | `menu_microbiology_whonet` |
| `sidenav.label.reports.environmental` | Environmental | NEW | `menu_reports_environmental` |
| `sidenav.label.admin.bucket.config` | Config | NEW | Admin heading |
| `sidenav.label.admin.bucket.organization` | Organization | NEW | Admin heading |
| `sidenav.label.admin.bucket.resources` | Resources | NEW | Admin heading |
| `sidenav.label.admin.bucket.automation` | Automation | NEW | Admin heading |
| `sidenav.label.admin.bucket.compliance` | Compliance | NEW | Admin heading |
| `sidenav.label.admin.workflowSettings` | Workflow Settings | NEW | Replaces "General Configurations" |
| `sidenav.label.admin.menu.main` | Main Menu | NEW | Replaces "Global Menu" |
| `sidenav.label.admin.barcodeConfiguration` | Barcode Configuration | NEW | Orphan added |
| `sidenav.label.admin.environmentalComplianceStandards` | Environmental Compliance Standards | NEW | Orphan added (Resources) |
| `sidenav.label.admin.notificationTriggers` | Notification Triggers | NEW | Orphan added |

The remaining shortened Admin labels in Appendix A.3 (e.g. "Users", "Dictionary", "Search Index") each get a `sidenav.label.admin.*` key named after the page's editorKey. Keys used only by Removed entries are deleted (about 60, listed by the Remove rows in Appendix A.2).

---

## Dependencies

- **Section headings and icons in the menu table:** `479-005-menu-presentation` and the `ConfiguredSideNav` renderer (#4315, merged 2026-09-23). Built.
- **Icon registry extension:** 21 new keys in `navigationIcons.js` (Icon table). Not built.
- **Admin sidebar framework:** OGC-529 (in progress, herman Muhereza) moves the Admin sidebar onto the same renderer as the main menu. FR-22 can ship on the current hard-coded component, but is far cheaper after OGC-529; sequence after it if it lands this release.
- **Role filtering:** OGC-1151 (in review). FR-17 relies on it hiding items per role.
- **Domain filtering:** OGC-1070 (in review).
- **Add Order removal:** the three domain order workflows must be live on the release (FR-14).
- **Runs:** removing the runtime Results › Analyzer entries (`menu_results_analyzer`) depends on Runs (OGC-1200) supplying `/Results?run=`; until then those entries stay.

---

## Out of Scope

- Redesigning any page, including the Routine Reports landing page and the Menu Configuration editor.
- New permission rules, new roles, or changes to who can open what.
- Changes to deployment-specific profiles other than the shipped default (e.g. `projects/reporting-uat`); those owners re-point their profiles to the new element IDs.
- The Help menu's content redesign (OGC-137).
- The admin bucket landing pages and admin shell from the admin MVP; this spec only groups the existing sidebar.

---

## Open Questions

| # | Question | Recommendation |
|---|---|---|
| Q-1 | Generic Sample (Create/Edit/Import/Enter Results): Hide or Remove? It predates the environmental and vector workflows. | Hide in this release; Remove next release unless a deployment objects |
| Q-2 | Quality: promote the QA pillars to top level (this spec) or keep them under one "Quality Assurance" folder as shipped today in OGC-682? | **Resolved 2026-09-24 (Casey): promote.** The QA pillars move to top level under the Quality heading |
| Q-3 | WHONET: which of the two export pages is canonical? | **Resolved 2026-09-24 (Casey): Microbiology WHONET export** (`/Microbiology/whonet`) is canonical |
| Q-4 | "Add Order" (`/SamplePatientEntry`): any deployment still relying on the single-form flow without the domain workflows? | Remove once confirmed; hide meanwhile (FR-14) |
| Q-5 | Turn Around Time: stay in Reports, or move into Quality › Quality Indicators? | Stay in Reports for now; revisit when QI dashboards absorb TAT |

---

## Crosscheck

**Verdict: ⚠ Proceed with coordination.** No active GLOBAL decision is contradicted; three shipped or in-flight structures need their owners' agreement before build.

| Finding | Against | Severity | Resolution |
|---|---|---|---|
| Quality pillars promoted out of the `menu_qa` folder shipped today | OGC-682 / `qa/001` (Samuel) | HIGH | Resolved: Casey approved the rehome (Q-2); tell Samuel. Pillar rows are unchanged, only `menu_qa` is restyled |
| Analyzers group no longer holds QC | D-027 lists Quality Control under Analyzers | HIGH | Already true on develop (`qa-015`); supersede D-027's list with "Analyzers List, Analyzer Types, Import Issues" |
| Admin buckets use D-010's five, not the admin MVP's eleven (IA v2.3) | admin-mvp-scope §5.3 | MEDIUM | D-010 is the active decision; IA v2.3 was never built. Mark IA v2.3 superseded |
| Admin sidebar rework overlaps OGC-529 | OGC-529 (herman) | MEDIUM | Sequence after OGC-529 |
| Menu row filtering overlaps OGC-1151 and OGC-1070 | in review | MEDIUM | FR-16/FR-17 depend on them; no conflict |
| Reporting UAT profile references `menu_reports`, `menu_more_tools` and removed rows | `projects/reporting-uat/menu/menu_config.json` (Piotr) | MEDIUM | Profile owner re-points after this ships |
| Study retirement | D-021, OGC-353 | - | Aligned; this spec completes OGC-353 |
| Menu row deletion | Design addendum MUST D | - | Allowed: menu rows carry no clinical or audit meaning (FR-10) |

**Candidate decisions to log at approval** (next free ID after D-063): the main menu is organized by workflow sections in the FR-1 order; one destination, one entry; a parent with children has no URL; three-level maximum; the Keep/Merge/Hide/Remove retirement tiers.

---

## Appendix A: Crosswalks

### A.1 Target main menu

- Home: `/Dashboard` (icon `home`)
- Alerts: `/Alerts` (icon `alerts`)

**ORDERS & PATIENTS** (section heading, `menu_section_orders`)

- Orders (icon `order`)
  - Clinical
    - Dashboard: `/order/clinical`
    - Enter Order: `/order/clinical/enter`
    - Collect Sample: `/order/clinical/collect`
    - Label & Store: `/order/clinical/label`
    - QA Review: `/order/clinical/qa`
  - Environmental
    - Dashboard: `/order/environmental`
    - Enter Order: `/order/environmental/enter`
    - Label & Store: `/order/environmental/label`
    - QA Review: `/order/environmental/qa`
  - Vector
    - Dashboard: `/order/vector`
    - Enter Order: `/order/vector/enter`
    - Label & Store: `/order/vector/label`
    - QA Review: `/order/vector/qa`
  - Edit Order: `/SampleEdit?type=readwrite`
  - Incoming Orders: `/ElectronicOrders`
  - Batch Order Entry: `/SampleBatchEntrySetup`
  - Print Barcodes: `/PrintBarcode`
  - Referrals
    - Sample Shipments: `/SampleShipment`
    - Referral Results: `/SampleShipment/reference-lab-results`
- Patients (icon `patient`)
  - Add/Edit Patient: `/PatientManagement`
  - Patient History: `/PatientHistory`
  - Merge Patients: `/PatientMerge`

**SAMPLES & SUPPLIES** (section heading, `menu_section_samples`)

- Sample Management: `/SampleManagement` (icon `sample`)
- Storage (icon `storage`)
  - Sample Storage: `/Storage`
  - Cold Storage Monitoring
    - Dashboard: `/FreezerMonitoring?tab=0`
    - Corrective Actions: `/FreezerMonitoring?tab=1`
    - Historical Trends: `/FreezerMonitoring?tab=2`
    - Reports: `/FreezerMonitoring?tab=3`
    - Settings: `/FreezerMonitoring?tab=4`
- Aliquoting: `/Aliquot` (icon `aliquot`)
- Inventory: `/inventory` (icon `inventory`)

**TESTING** (section heading, `menu_section_testing`)

- Workplan (icon `workplan`)
  - Batch Workplan: `/Workplan`
  - By Test Type: `/WorkPlanByTest?type=test`
  - By Panel: `/WorkPlanByPanel?type=panel`
  - By Lab Unit: `/WorkPlanByTestSection?type=`
  - By Priority: `/WorkPlanByPriority?type=priority`
- Results (icon `results`)
  - Results Entry: `/Results`
  - By Unit: `/LogbookResults?type=` (shown only when unified Results Entry is off)
  - By Patient: `/PatientResults` (shown only when unified Results Entry is off)
  - By Order: `/AccessionResults` (shown only when unified Results Entry is off)
  - By Range of Order numbers: `/RangeResults` (shown only when unified Results Entry is off)
  - By Test, Date or Status: `/StatusResults?blank=true` (shown only when unified Results Entry is off)
  - Vector Identification: `/vector/identification`
- Validation (icon `validation`)
  - Routine: `/ResultValidation?type=&test=`
  - By Order: `/AccessionValidation`
  - By Range of Order Numbers: `/AccessionValidationRange`
  - By Date: `/ResultValidationByTestDate`
- Case Workbenches (icon `specialty`)
  - Microbiology: `/Microbiology/worklist`
  - Pathology: `/PathologyDashboard`
  - Immunohistochemistry: `/ImmunohistochemistryDashboard`
  - Cytology: `/CytologyDashboard`
  - Program Cases: `/genericProgram`
- Analyzers (icon `analyzers`)
  - Analyzers: `/analyzers`
  - Analyzer Types: `/analyzers/types`
  - Import Issues: `/AnalyzerResults?view=import-issues`
- Lab Notebook: `/NotebookDashboard` (icon `notebook`)

**QUALITY** (section heading, `menu_qa`)

- QA Overview: `/qa/overview` (icon `qaOverview`)
- Quality Control (icon `qc`)
  - QC Dashboard: `/qa/qc/dashboard`
  - QC Alerts: `/qa/qc/alerts`
  - QC Lot Management: `/qa/qc/control-lots`
  - Rule Configuration: `/qa/qc/rule-config`
  - Reagent QC: `/qa/qc/reagent-qc`
  - Analyzer Manual QC: `/qa/qc/manual-qc`
- EQA (icon `eqa`)
  - EQA Orders: `/qa/eqa/orders`
  - My Programs: `/qa/eqa/my-programs`
  - Program Management: `/qa/eqa/management`
  - Participants: `/qa/eqa/participants`
  - Distributions: `/qa/eqa/distribution`
  - Results & Analysis: `/qa/eqa/results`
- Quality Indicators (icon `qi`)
  - QI Dashboard: `/qa/qi/dashboard`
  - QI Configuration: `/qa/qi/config`
- Non-Conformity & CAPA (icon `nce`)
  - All NCEs: `/NceDashboard`
  - Report Non-Conforming Event: `/ReportNonConformingEvent`
  - View New Non-Conforming Events: `/ViewNonConformingEvent`
  - Corrective actions: `/NCECorrectiveAction`
  - CAPA Register: `/qa/qms/capa-register`
- QMS & Improvement (icon `qms`)
  - Audit Trail: System Events: `/AuditTrailReport?type=system`
  - Audit Trail: Order Events: `/AuditTrailReport?type=order`
  - Electronic Signature Log: `/qa/qms/e-signature-log`
  - Accreditation: `/qa/qms/accreditation`

**REPORTS** (section heading, `menu_reports`)

- Patient Status Report: `/Report?type=patient&report=patientCILNSP_vreduit` (icon `reports`)
- Routine: `/RoutineReports` (icon `reports`)
- Custom Data Export: `/CustomDataExport` (icon `reports`)
- Turn Around Time: `/TATReport` (icon `reports`)
- WHONET Export: `/Microbiology/whonet` (icon `reports`)
- Environmental (icon `reports`)
  - Compliance Dashboard: `/EnvironmentalDashboard`
  - Compliance Report: `/LaporanHasil`
- Vector Surveillance: `/VectorSurveillanceReport` (icon `reports`)

**ADMINISTRATION** (section heading, `menu_section_admin`)

- Admin: `/MasterListsPage` (icon `settings`)
- Billing (icon `billing`)
- Help (icon `help`)
  - User Manual: `/docs/UserManual`

### A.2 Every current main-menu entry and what happens to it

Source column: **db** = row in the develop dev database (2026-09-23 image); **head** = row added by a changeset merged to develop after that image (QA menu, Batch Workplan, Custom Data Export); **json** = entry defined only in the shipped default profile `volume/menu/menu_config.json`; **runtime** = generated in code. "Default profile" says whether a stock install shows it today.

| # | Element ID | Current location | Source | Active | Default profile | Disposition | New location / redirect | Reason |
|---|---|---|---|---|---|---|---|---|
| 1 | `menu_home` | Home | db | yes | yes | Keep | Home | - |
| 2 | `menu_generic_sample` | Generic Sample | db | yes | yes | **Hide** | - | Generic Sample (3.2) superseded by Environmental and Vector order workflows. Hide now; Remove once no deployment uses it |
| 3 | `menu_generic_sample_order` | Generic Sample › Create Order | db | yes | yes | **Hide** | - | Generic Sample (3.2) superseded by Environmental and Vector order workflows. Hide now; Remove once no deployment uses it |
| 4 | `menu_generic_sample_edit` | Generic Sample › Edit Order | db | yes | yes | **Hide** | - | Generic Sample (3.2) superseded by Environmental and Vector order workflows. Hide now; Remove once no deployment uses it |
| 5 | `menu_generic_sample_import` | Generic Sample › Import Samples | db | yes | yes | **Hide** | - | Generic Sample (3.2) superseded by Environmental and Vector order workflows. Hide now; Remove once no deployment uses it |
| 6 | `menu_generic_sample_results` | Generic Sample › Enter Results | db | yes | yes | **Hide** | - | Generic Sample (3.2) superseded by Environmental and Vector order workflows. Hide now; Remove once no deployment uses it |
| 7 | `menu_sample_management` | Generic Sample › Sample Management | db | yes | yes | Keep (changed) | Samples & Supplies › Sample Management | Moved out of Generic Sample |
| 8 | `menu_microbiology` | Microbiology | json | yes | yes | Keep (changed) | Testing › Case Workbenches › Microbiology | JSON-only row becomes a DB row; single child flattened |
| 9 | `menu_microbiology_worklist` | Microbiology › Microbiology worklist | json | yes | yes | Merge | → `/Microbiology/worklist` | Single child folded into Microbiology link |
| 10 | `menu_sample` | Order | db | yes | yes | Keep (changed) | Orders & Patients › Orders | Relabel "Order" to "Orders" |
| 11 | `menu_order_workflow` | Order › Add Generic Order | db | no | no | **Remove** | → `/order/clinical` | Generic order workflow, already off; superseded by the three domain workflows |
| 12 | `menu_order_dashboard` | Order › Add Generic Order › Dashboard | db | no | no | **Remove** | → `/order/clinical` | Generic order workflow, already off; superseded by the three domain workflows |
| 13 | `menu_order_enter` | Order › Add Generic Order › Enter Order | db | no | no | **Remove** | → `/order/clinical` | Generic order workflow, already off; superseded by the three domain workflows |
| 14 | `menu_order_collect` | Order › Add Generic Order › Collect Sample | db | no | no | **Remove** | → `/order/clinical` | Generic order workflow, already off; superseded by the three domain workflows |
| 15 | `menu_order_label` | Order › Add Generic Order › Label & Store | db | no | no | **Remove** | → `/order/clinical` | Generic order workflow, already off; superseded by the three domain workflows |
| 16 | `menu_order_qa` | Order › Add Generic Order › QA Review | db | no | no | **Remove** | → `/order/clinical` | Generic order workflow, already off; superseded by the three domain workflows |
| 17 | `menu_add_order` | Order › Add Generic Order | db | no | no | **Remove** | → `/order/clinical` | Generic order workflow, already off; superseded by the three domain workflows |
| 18 | `menu_clinical_workflow` | Order › Add Clinical Order | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Clinical | Relabel "Add Clinical Order"; domain-filtered (OGC-1070) |
| 19 | `menu_clinical_dashboard` | Order › Add Clinical Order › Dashboard | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Clinical › Dashboard | - |
| 20 | `menu_clinical_enter` | Order › Add Clinical Order › Enter Order | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Clinical › Enter Order | - |
| 21 | `menu_clinical_collect` | Order › Add Clinical Order › Collect Sample | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Clinical › Collect Sample | - |
| 22 | `menu_clinical_label` | Order › Add Clinical Order › Label & Store | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Clinical › Label & Store | - |
| 23 | `menu_clinical_qa` | Order › Add Clinical Order › QA Review | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Clinical › QA Review | - |
| 24 | `menu_environmental_workflow` | Order › Add Environmental Order | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Environmental | Relabel "Add Environmental Order" |
| 25 | `menu_environmental_dashboard` | Order › Add Environmental Order › Dashboard | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Environmental › Dashboard | - |
| 26 | `menu_environmental_enter` | Order › Add Environmental Order › Enter Order | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Environmental › Enter Order | - |
| 27 | `menu_environmental_collect` | Order › Add Environmental Order › Collect Sample | db | no | yes | **Remove** | → `/order/environmental` | Already off by design (030: environmental has no collection step) |
| 28 | `menu_environmental_label` | Order › Add Environmental Order › Label & Store | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Environmental › Label & Store | - |
| 29 | `menu_environmental_qa` | Order › Add Environmental Order › QA Review | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Environmental › QA Review | - |
| 30 | `menu_vector_workflow` | Order › Add Vector Order | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Vector | Relabel "Add Vector Order" |
| 31 | `menu_vector_dashboard` | Order › Add Vector Order › Dashboard | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Vector › Dashboard | - |
| 32 | `menu_vector_enter` | Order › Add Vector Order › Enter Order | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Vector › Enter Order | - |
| 33 | `menu_vector_label` | Order › Add Vector Order › Label & Store | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Vector › Label & Store | - |
| 34 | `menu_vector_qa` | Order › Add Vector Order › QA Review | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Vector › QA Review | - |
| 35 | `menu_sample_add` | Order › Add Order | db | yes | yes | **Remove** | → `/order/clinical/enter` | Legacy single "Add Order" (/SamplePatientEntry); second front door to order entry. Gate on domain workflows live (add-order-menu-cleanup story) |
| 36 | `menu_sample_create` | Order › Study | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 37 | `menu_sample_create_initial` | Order › Study › Initial Entry | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 38 | `menu_sample_create_double` | Order › Study › Double Entry | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 39 | `menu_sample_consult` | Order › Study › View | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 40 | `menu_study_sample_eorder` | Order › Study › Electronic Orders | db | yes | yes | **Remove** | → `/ElectronicOrders` | Study electronic orders; D-021 |
| 41 | `menu_sample_edit` | Order › Edit Order | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Edit Order | - |
| 42 | `menu_sample_eorder` | Order › Incoming Orders | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Incoming Orders | - |
| 43 | `menu_sample_batch_entry` | Order › Batch Order Entry | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Batch Order Entry | - |
| 44 | `menu_sample_print_barcode` | Order › Barcode | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Print Barcodes | Relabel "Barcode" |
| 45 | `menu_environmental_compliance` | Compliance Dashboard | db | yes | yes | Keep (changed) | Reports › Environmental › Compliance Dashboard | Moved from top level |
| 46 | `menu_patient` | Patient | db | yes | yes | Keep (changed) | Orders & Patients › Patients | Relabel "Patient" |
| 47 | `menu_patient_add_or_edit` | Patient › Add/Edit Patient | db | yes | yes | Keep (changed) | Orders & Patients › Patients › Add/Edit Patient | - |
| 48 | `menu_patienthistory` | Patient › Patient History | db | yes | yes | Keep (changed) | Orders & Patients › Patients › Patient History | - |
| 49 | `menu_patient_create` | Patient › Study | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 50 | `menu_patient_create_initial` | Patient › Study › Initial Entry | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 51 | `menu_patient_create_double` | Patient › Study › Double Entry | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 52 | `menu_patient_edit` | Patient › Study › Edit | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 53 | `menu_patient_consult` | Patient › Study › View | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 54 | `menu_patient_merge` | Patient › Merge Patient | db | yes | no | Keep (changed) | Orders & Patients › Patients › Merge Patients | Add to default profile (was excluded) |
| 55 | `menu_storage` | Storage | db | yes | yes | Keep | Samples & Supplies › Storage | - |
| 56 | `menu_storage_management` | Storage › Storage Management | db | yes | yes | Keep (changed) | Samples & Supplies › Storage › Sample Storage | Relabel "Storage Management" |
| 57 | `menu_storage_samples` | Storage › Storage Management › Sample Items | db | no | no | **Remove** | → `/Storage` | Already off (073 collapsed them into tabs on /Storage) |
| 58 | `menu_storage_rooms` | Storage › Storage Management › Rooms | db | no | no | **Remove** | → `/Storage` | Already off (073 collapsed them into tabs on /Storage) |
| 59 | `menu_storage_devices` | Storage › Storage Management › Devices | db | no | no | **Remove** | → `/Storage` | Already off (073 collapsed them into tabs on /Storage) |
| 60 | `menu_storage_shelves` | Storage › Storage Management › Shelves | db | no | no | **Remove** | → `/Storage` | Already off (073 collapsed them into tabs on /Storage) |
| 61 | `menu_storage_racks` | Storage › Storage Management › Racks | db | no | no | **Remove** | → `/Storage` | Already off (073 collapsed them into tabs on /Storage) |
| 62 | `menu_storage_boxes` | Storage › Storage Management › Boxes | db | no | no | **Remove** | → `/Storage` | Already off (073 collapsed them into tabs on /Storage) |
| 63 | `menu_freezer_monitoring` | Storage › Cold Storage Monitoring | db | yes | yes | Keep | Samples & Supplies › Storage › Cold Storage Monitoring | - |
| 64 | `menu_freezer_dashboard` | Storage › Cold Storage Monitoring › Dashboard | db | yes | no | Keep | Samples & Supplies › Storage › Cold Storage Monitoring › Dashboard | - |
| 65 | `menu_freezer_corrective` | Storage › Cold Storage Monitoring › Corrective Actions | db | yes | no | Keep | Samples & Supplies › Storage › Cold Storage Monitoring › Corrective Actions | - |
| 66 | `menu_freezer_trends` | Storage › Cold Storage Monitoring › Historical Trends | db | yes | no | Keep | Samples & Supplies › Storage › Cold Storage Monitoring › Historical Trends | - |
| 67 | `menu_freezer_reports` | Storage › Cold Storage Monitoring › Reports | db | yes | no | Keep | Samples & Supplies › Storage › Cold Storage Monitoring › Reports | - |
| 68 | `menu_freezer_settings` | Storage › Cold Storage Monitoring › Settings | db | yes | no | Keep | Samples & Supplies › Storage › Cold Storage Monitoring › Settings | - |
| 69 | `menu_sample_shipment` | Sample Shipment | db | yes | no | Keep (changed) | Orders & Patients › Orders › Referrals › Sample Shipments | Moved from top level |
| 70 | `menu_analyzers` | Analyzers | db | yes | no | Keep (changed) | Testing › Analyzers | Parent loses its URL (it duplicated Analyzers List) |
| 71 | `menu_analyzers_list` | Analyzers › Analyzers List | db | yes | no | Keep (changed) | Testing › Analyzers › Analyzers | Relabel "Analyzers List" |
| 72 | `menu_analyzers_types` | Analyzers › Analyzer Types | db | yes | no | Keep | Testing › Analyzers › Analyzer Types | - |
| 73 | `menu_analyzers_qc` | Analyzers › Quality Control | db | no | no | **Remove** | → `/qa/qc/dashboard` | Already off (qa-015); QC now lives under Quality > Quality Control |
| 74 | `menu_analyzers_qc_dashboard` | Analyzers › Quality Control › QC Dashboard | db | no | no | **Remove** | → `/qa/qc/dashboard` | Already off (qa-015); QC now lives under Quality > Quality Control |
| 75 | `menu_analyzers_qc_rule_config` | Analyzers › Quality Control › Rule Configuration | db | no | no | **Remove** | → `/qa/qc/dashboard` | Already off (qa-015); QC now lives under Quality > Quality Control |
| 76 | `menu_analyzers_qc_control_lots` | Analyzers › Quality Control › Control Lots | db | no | no | **Remove** | → `/qa/qc/dashboard` | Already off (qa-015); QC now lives under Quality > Quality Control |
| 77 | `menu_qa` | Quality Assurance | head | yes | no | Keep (changed) | (section heading) | Existing QA group row restyled as a section heading, so its pillars become top-level groups (depth 5 to 3) |
| 78 | `menu_qa_overview` | Quality Assurance › QA Overview | head | yes | no | Keep (changed) | Quality › QA Overview | - |
| 79 | `menu_qa_qc` | Quality Assurance › Statistical QC | head | yes | no | Keep (changed) | Quality › Quality Control | Relabel "Statistical QC": it also holds reagent and manual QC |
| 80 | `menu_qa_qc_dashboard` | Quality Assurance › Statistical QC › QC Dashboard | head | yes | no | Keep (changed) | Quality › Quality Control › QC Dashboard | - |
| 81 | `menu_qa_qc_alerts` | Quality Assurance › Statistical QC › QC Alerts | head | yes | no | Keep (changed) | Quality › Quality Control › QC Alerts | - |
| 82 | `menu_qa_qc_control_lots` | Quality Assurance › Statistical QC › QC Lot Management | head | yes | no | Keep (changed) | Quality › Quality Control › QC Lot Management | - |
| 83 | `menu_qa_qc_rule_config` | Quality Assurance › Statistical QC › Rule Configuration | head | yes | no | Keep (changed) | Quality › Quality Control › Rule Configuration | - |
| 84 | `menu_qa_qc_reagent_qc` | Quality Assurance › Statistical QC › Reagent QC | head | yes | no | Keep (changed) | Quality › Quality Control › Reagent QC | - |
| 85 | `menu_qa_qc_manual_qc` | Quality Assurance › Statistical QC › Analyzer Manual QC | head | yes | no | Keep (changed) | Quality › Quality Control › Analyzer Manual QC | - |
| 86 | `menu_eqa` | Quality Assurance › EQA | db | yes | no | Keep (changed) | Quality › EQA | Intermediate EQA Tests / EQA Management groups removed; role filtering still hides provider items |
| 87 | `menu_alerts` | Quality Assurance › EQA › Alerts | db | no | no | **Remove** | → `/Alerts` | Duplicate of Alerts, already off |
| 88 | `menu_eqa_management` | Quality Assurance › EQA › EQA Programs | db | no | no | **Remove** | → `/qa/eqa/management` | Duplicate of EQA Program Management, already off |
| 89 | `menu_eqa_distribution` | Quality Assurance › EQA › EQA Distributions | db | no | no | **Remove** | → `/qa/eqa/distribution` | Duplicate of EQA Distributions, already off |
| 90 | `menu_eqa_tests` | Quality Assurance › EQA › EQA Tests | db | yes | no | Merge | - | Intermediate group removed; children move up to EQA |
| 91 | `menu_eqa_orders` | Quality Assurance › EQA › EQA Tests › Orders | db | yes | no | Keep (changed) | Quality › EQA › EQA Orders | - |
| 92 | `menu_eqa_my_programs` | Quality Assurance › EQA › EQA Tests › My Programs | db | yes | no | Keep (changed) | Quality › EQA › My Programs | - |
| 93 | `menu_eqa_mgmt` | Quality Assurance › EQA › EQA Management | db | yes | no | Merge | - | Intermediate group removed; children move up to EQA |
| 94 | `menu_eqa_mgmt_programs` | Quality Assurance › EQA › EQA Management › Programs | db | yes | no | Keep (changed) | Quality › EQA › Program Management | - |
| 95 | `menu_eqa_mgmt_participants` | Quality Assurance › EQA › EQA Management › Participants | db | yes | no | Keep (changed) | Quality › EQA › Participants | - |
| 96 | `menu_eqa_mgmt_distributions` | Quality Assurance › EQA › EQA Management › Distributions | db | yes | no | Keep (changed) | Quality › EQA › Distributions | - |
| 97 | `menu_eqa_mgmt_results` | Quality Assurance › EQA › EQA Management › Results & Analysis | db | yes | no | Keep (changed) | Quality › EQA › Results & Analysis | - |
| 98 | `menu_qa_qi` | Quality Assurance › Quality Indicators | head | yes | no | Keep (changed) | Quality › Quality Indicators | - |
| 99 | `menu_qa_qi_dashboard` | Quality Assurance › Quality Indicators › QI Dashboard | head | yes | no | Keep (changed) | Quality › Quality Indicators › QI Dashboard | - |
| 100 | `menu_qa_qi_config` | Quality Assurance › Quality Indicators › QI Configuration | head | yes | no | Keep (changed) | Quality › Quality Indicators › QI Configuration | - |
| 101 | `menu_qa_qms` | Quality Assurance › QMS & Improvement | head | yes | no | Keep (changed) | Quality › QMS & Improvement | - |
| 102 | `menu_nonconformity` | Quality Assurance › QMS & Improvement › Non-Conform | db | yes | yes | Keep (changed) | Quality › Non-Conformity & CAPA | Promoted from QMS: reporting an NCE is an every-staff action |
| 103 | `menu_nce_dashboard` | Quality Assurance › QMS & Improvement › Non-Conform › All NCEs | db | yes | no | Keep (changed) | Quality › Non-Conformity & CAPA › All NCEs | - |
| 104 | `menu_non_conforming_report` | Quality Assurance › QMS & Improvement › Non-Conform › Report Non-Conforming Event | db | yes | yes | Keep (changed) | Quality › Non-Conformity & CAPA › Report Non-Conforming Event | - |
| 105 | `menu_non_conforming_view` | Quality Assurance › QMS & Improvement › Non-Conform › View New Non-Conforming Events | db | yes | yes | Keep (changed) | Quality › Non-Conformity & CAPA › View New Non-Conforming Events | - |
| 106 | `menu_non_conforming_corrective_actions` | Quality Assurance › QMS & Improvement › Non-Conform › Corrective actions | db | yes | yes | Keep (changed) | Quality › Non-Conformity & CAPA › Corrective actions | - |
| 107 | `menu_reports_audittrail` | Quality Assurance › QMS & Improvement › Audit Trail | db | yes | no | Merge | - | Group flattened into two QMS links |
| 108 | `menu_reports_audittrail_system` | Quality Assurance › QMS & Improvement › Audit Trail › System Events | db | yes | no | Keep (changed) | Quality › QMS & Improvement › Audit Trail: System Events | Audit Trail group flattened |
| 109 | `menu_reports_audittrail_order` | Quality Assurance › QMS & Improvement › Audit Trail › Order Events | db | yes | no | Keep (changed) | Quality › QMS & Improvement › Audit Trail: Order Events | - |
| 110 | `menu_qa_qms_esig_log` | Quality Assurance › QMS & Improvement › Electronic Signature Log | head | yes | no | Keep (changed) | Quality › QMS & Improvement › Electronic Signature Log | - |
| 111 | `menu_qa_qms_capa_register` | Quality Assurance › QMS & Improvement › CAPA Register | head | yes | no | Keep (changed) | Quality › Non-Conformity & CAPA › CAPA Register | Moved from QMS to sit with Corrective Actions |
| 112 | `menu_qa_qms_accreditation` | Quality Assurance › QMS & Improvement › Accreditation | head | yes | no | Keep (changed) | Quality › QMS & Improvement › Accreditation | - |
| 113 | `menu_alerts_standalone` | Alerts | db | yes | no | Keep | Alerts | Moved up from mid-menu: alerts are cross-cutting and time-sensitive |
| 114 | `menu_workplan` | Workplan | db | yes | yes | Keep | Testing › Workplan | - |
| 115 | `menu_workplan_test` | Workplan › By Test Type | db | yes | yes | Keep | Testing › Workplan › By Test Type | - |
| 116 | `menu_workplan_batch` | Workplan › Batch Workplan | head | yes | no | Keep | Testing › Workplan › Batch Workplan | - |
| 117 | `menu_workplan_panel` | Workplan › By Panel | db | yes | yes | Keep | Testing › Workplan › By Panel | - |
| 118 | `menu_workplan_bench` | Workplan › By Unit | db | yes | yes | Keep (changed) | Testing › Workplan › By Lab Unit | Relabel "By Unit" |
| 119 | `menu_workplan_priority` | Workplan › By Priority | db | yes | yes | Keep | Testing › Workplan › By Priority | - |
| 120 | `menu_pathology` | Pathology | db | yes | yes | Keep (changed) | Testing › Case Workbenches › Pathology | - |
| 121 | `menu_immunochem` | Immunohistochemistry | db | yes | yes | Keep (changed) | Testing › Case Workbenches › Immunohistochemistry | - |
| 122 | `menu_cytology` | Cytology | db | yes | yes | Keep (changed) | Testing › Case Workbenches › Cytology | - |
| 123 | `menu_results` | Results | db | yes | yes | Keep | Testing › Results | - |
| 124 | `menu_results_unified` | Results › Results Entry | db | yes | no | Keep | Testing › Results › Results Entry | Shown when RESULTS_ENTRY_UNIFIED_ROUTE=true (existing flag) |
| 125 | `menu_results_logbook` | Results › By Unit | db | yes | yes | Keep | Testing › Results › By Unit | - |
| 126 | `menu_results_patient` | Results › By Patient | db | yes | yes | Keep | Testing › Results › By Patient | - |
| 127 | `menu_results_accession` | Results › By Order | db | yes | yes | Keep | Testing › Results › By Order | - |
| 128 | `menu_results_referred` | Results › Referred Out | db | yes | yes | Keep (changed) | Orders & Patients › Orders › Referrals › Referral Results | Moved from Results; OGC-798 page |
| 129 | `menu_results_range` | Results › By Range of Order numbers | db | yes | yes | Keep | Testing › Results › By Range of Order numbers | - |
| 130 | `menu_results_status` | Results › By Test, Date or Status | db | yes | yes | Keep | Testing › Results › By Test, Date or Status | - |
| 131 | `menu_results_analyzer` | Results › Analyzer | runtime | yes | yes | **Remove** | → `/Results?run=` | Runtime per-analyzer Results entries; retire with Runs (OGC-1200, spec-registry) |
| 132 | `order_programmes` | Results › Order Programs | db | yes | no | Keep (changed) | Testing › Case Workbenches › Program Cases | Moved from Results; relabel "Order Programs" |
| 133 | `menu_vector_identification` | Results › Vector Identification | db | yes | no | Keep | Testing › Results › Vector Identification | - |
| 134 | `menu_resultvalidation` | Validation | db | yes | yes | Keep (changed) | Testing › Validation | Parent loses its URL (it duplicated Routine) |
| 135 | `menu_resultvalidation_routine` | Validation › Routine | db | yes | yes | Keep | Testing › Validation › Routine | - |
| 136 | `menu_resultvalidation_study` | Validation › Study | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 137 | `menu_resultvalidation_immunology` | Validation › Study › Immunology - Hematology | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 138 | `menu_resultvalidation_biochemistry` | Validation › Study › Biochemistry | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 139 | `menu_resultvalidation_serology` | Validation › Study › Serology | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 140 | `menu_resultvalidation_virology` | Validation › Study › Virology | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 141 | `menu_resultvalidation_dnapcr` | Validation › Study › Virology › DNA PCR | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 142 | `menu_resultvalidation_viralload` | Validation › Study › Virology › Viral Load | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 143 | `menu_resultvalidation_genotyping` | Validation › Study › Virology › Genotyping | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 144 | `menu_accession_validation` | Validation › By Order | db | yes | yes | Keep | Testing › Validation › By Order | - |
| 145 | `menu_accession_validation_range` | Validation › By Range of Order Numbers | db | yes | yes | Keep | Testing › Validation › By Range of Order Numbers | - |
| 146 | `menu_resultvalidation_date` | Validation › By Date | db | yes | yes | Keep | Testing › Validation › By Date | - |
| 147 | `menu_reports` | Reports | db | yes | yes | Keep (changed) | (section heading) | Existing Reports group row restyled as a section heading |
| 148 | `menu_reports_custom_data_export` | Reports › Custom Data Export | head | yes | no | Keep (changed) | Reports › Custom Data Export | - |
| 149 | `menu_reports_routine` | Reports › Routine | db | yes | yes | Keep (changed) | Reports › Routine | Link to the Routine Reports landing, which already lists every routine report; its 17 menu children are removed |
| 150 | `menu_reports_status_patient` | Reports › Routine › Patient Status Report | db | yes | yes | Keep (changed) | Reports › Patient Status Report | Promoted from Routine > Patient Status |
| 151 | `menu_reports_aggregate` | Reports › Routine › Aggregate Reports | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 152 | `menu_reports_aggregate_statistics` | Reports › Routine › Aggregate Reports › Statistics Report | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 153 | `menu_reports_aggregate_all` | Reports › Routine › Aggregate Reports › Summary of All Tests | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 154 | `menu_reports_aggregate_hiv` | Reports › Routine › Aggregate Reports › HIV Test Summary | db | yes | yes | **Hide** | → `/RoutineReports` | Country-specific report (Côte d'Ivoire LNSP): hide from the Routine Reports landing by default; deployment can enable |
| 155 | `menu_reports_management` | Reports › Routine › Management Reports | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 156 | `menu_reports_management_rejection` | Reports › Routine › Management Reports › Rejection Report | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 157 | `menu_reports_activity` | Reports › Routine › Management Reports › Activity Reports | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 158 | `menu_activity_report_test` | Reports › Routine › Management Reports › Activity Reports › By Test Type | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 159 | `menu_activity_report_panel` | Reports › Routine › Management Reports › Activity Reports › By Panel | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 160 | `menu_activity_report_bench` | Reports › Routine › Management Reports › Activity Reports › By Unit | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 161 | `menu_reports_referred` | Reports › Routine › Management Reports › Referred Out Tests Report | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 162 | `menu_reports_nonconformity` | Reports › Routine › Management Reports › Non Conformity Reports | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 163 | `menu_reports_nonconformity_date` | Reports › Routine › Management Reports › Non Conformity Reports › By Date | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 164 | `menu_reports_nonconformity_section` | Reports › Routine › Management Reports › Non Conformity Reports › By Unit and Reason | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 165 | `menu_reports_validation_backlog` | Reports › Routine › Management Reports › Delayed Validation | db | yes | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 166 | `menu_reports_auditTrail` | Reports › Routine › Management Reports › Audit Trail | db | no | yes | Merge | → `/RoutineReports` | Listed on the Routine Reports landing page already; menu copy removed |
| 167 | `menu_reports_export_routine` | Reports › Routine › Routine CSV Report | db | yes | yes | **Hide** | → `/RoutineReports` | Country-specific report (Côte d'Ivoire LNSP): hide from the Routine Reports landing by default; deployment can enable |
| 168 | `menu_microbiology_whonet` | Reports › WHONET export | json | yes | yes | Keep (changed) | Reports › WHONET Export | Canonical WHONET entry (OGC-782); JSON-only row becomes a DB row |
| 169 | `menu_reports_study` | Reports › Study | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 170 | `menu_reports_patients` | Reports › Study › Patient Status Report | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 171 | `menu_reports_arv` | Reports › Study › Patient Status Report › ARV | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 172 | `menu_reports_arv_initial1` | Reports › Study › Patient Status Report › ARV › ARV Initial Version 1 | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 173 | `menu_reports_arv_initial2` | Reports › Study › Patient Status Report › ARV › ARV Initial Version 2 | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 174 | `menu_reports_arv_followup1` | Reports › Study › Patient Status Report › ARV › ARV Follow-up Version 1 | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 175 | `menu_reports_arv_followup2` | Reports › Study › Patient Status Report › ARV › ARV Follow-up Version 2 | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 176 | `menu_reports_arv_all` | Reports › Study › Patient Status Report › ARV › ARV-Version | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 177 | `menu_reports_eid` | Reports › Study › Patient Status Report › EID | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 178 | `menu_reports_eid_version1` | Reports › Study › Patient Status Report › EID › EID Version 1 | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 179 | `menu_reports_eid_version2` | Reports › Study › Patient Status Report › EID › EID Version 2 | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 180 | `menu_reports_vl` | Reports › Study › Patient Status Report › VL | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 181 | `menu_reports_vl_version1` | Reports › Study › Patient Status Report › VL › VL Version Nationale | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 182 | `menu_reports_indeterminate` | Reports › Study › Patient Status Report › Indeterminate | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 183 | `menu_reports_indeterminate_version1` | Reports › Study › Patient Status Report › Indeterminate › Indeterminate Version 1 | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 184 | `menu_reports_indeterminate_version2` | Reports › Study › Patient Status Report › Indeterminate › Indeterminate Version 2 | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 185 | `menu_reports_indeterminate_location` | Reports › Study › Patient Status Report › Indeterminate › Indeterminate by Service | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 186 | `menu_reports_special` | Reports › Study › Patient Status Report › Special Request | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 187 | `menu_reports_patient_collection` | Reports › Study › Patient Status Report › Collected ARV Patient Report | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 188 | `menu_reports_patient_associated` | Reports › Study › Patient Status Report › Associated Patient Report | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 189 | `menu_reports_indicator` | Reports › Study › Indicator | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 190 | `menu_reports_indicator_performance` | Reports › Study › Indicator › Section Performance | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 191 | `menu_reports_validation_backlog.study` | Reports › Study › Indicator › Delayed Validation | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 192 | `menu_reports_nonconformity.study` | Reports › Study › Non Conformity Reports | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 193 | `menu_reports_nonconformity_date.study` | Reports › Study › Non Conformity Reports › By Date | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 194 | `menu_reports_nonconformity_section.study` | Reports › Study › Non Conformity Reports › By Unit and Reason | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 195 | `menu_reports_nonconformity.Labno` | Reports › Study › Non Conformity Reports › By Labno | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 196 | `menu_reports_nonconformity_notification.study` | Reports › Study › Non Conformity Reports › Non-conformity notification | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 197 | `menu_reports_followupRequired_ByLocation.study` | Reports › Study › Non Conformity Reports › Follow-up Required | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 198 | `menu_reports_export` | Reports › Study › Export By Date | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 199 | `menu_reports_export_general` | Reports › Study › Export By Date › General export | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 200 | `menu_reports_export_valid` | Reports › Study › Export By Date › Valid | db | no | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 201 | `menu_reports_export_specific` | Reports › Study › Export By Date › Viral Load Data Export | db | yes | yes | **Remove** | - | Study (RetroCI) workflow for one lab; D-021. Legacy JSP route |
| 202 | `menu_reports_auditTrail.study` | Reports › Study › Audit Trail | db | no | yes | **Remove** | - | Study; already off |
| 203 | `menu_reports_tatreport` | Reports › Turn Around Time | db | yes | no | Keep (changed) | Reports › Turn Around Time | - |
| 204 | `menu_reports_environmental` | Reports › Environmental Reports | db | yes | no | Keep (changed) | Reports › Environmental | - |
| 205 | `menu_reports_environmental_laporanhasil` | Reports › Environmental Reports › Compliance Report | db | yes | no | Keep (changed) | Reports › Environmental › Compliance Report | - |
| 206 | `menu_reports_vectorsurveillance` | Reports › Vector Surveillance | db | yes | no | Keep (changed) | Reports › Vector Surveillance | - |
| 207 | `menu_reports_whonet_export` | Reports › WHONET Report | db | yes | no | Merge | → `/Microbiology/whonet` | Duplicate WHONET export; legacy report route redirects to Microbiology WHONET export |
| 208 | `menu_administration` | Admin | db | yes | yes | Keep | Administration › Admin | - |
| 209 | `menu_administration_dashboard` | Admin › Admin dashboard | json | yes | yes | Merge | → `/MasterListsPage` | Same URL as Admin itself |
| 210 | `menu_administration_stuck_analyzer_events` | Admin › Stuck analyzer events | json | yes | yes | Keep (changed) | Testing › Analyzers › Import Issues | Moved from the JSON-only Admin child |
| 211 | `menu_billing` | Billing | db | yes | yes | Keep | Administration › Billing | Hidden unless a Billing URL is configured (fixes OGC-469/470 dead link) |
| 212 | `menu_aliquot` | Aliquot | db | yes | yes | Keep (changed) | Samples & Supplies › Aliquoting | Relabel "Aliquot" |
| 213 | `menu_notebook` | NoteBook | db | yes | yes | Keep (changed) | Testing › Lab Notebook | Relabel "NoteBook" |
| 214 | `menu_inventory` | Inventory | db | yes | yes | Keep (changed) | Samples & Supplies › Inventory | Flattened: single-child group becomes a link |
| 215 | `menu_inventory_management` | Inventory › Inventory Management | db | yes | yes | Merge | → `/inventory` | Single child folded into its parent link |
| 216 | `menu_help` | Help | db | yes | yes | Keep | Administration › Help | - |
| 217 | `menu_help_user_manual` | Help › User Manual | db | yes | yes | Keep | Administration › Help › User Manual | - |
| 218 | `menu_help_documents` | Help › Process Documentation | db | yes | yes | **Remove** | - | Côte d'Ivoire study PDFs (VL, DBS request forms) |
| 219 | `menu_help_form_VL` | Help › Process Documentation › VL Form | db | yes | yes | **Remove** | - | Côte d'Ivoire study PDF |
| 220 | `menu_help_form_DBS` | Help › Process Documentation › DBS Form | db | yes | yes | **Remove** | - | Côte d'Ivoire study PDF |

### A.3 Admin sidebar: target


**CONFIG** (section heading): How this lab's workflows behave

- Workflow Settings _(Was "General Configurations"; labels drop the repeated word "Configuration")_
  - Order Entry: `/MasterListsPage/SampleEntryConfigurationMenu`
  - Patient Entry: `/MasterListsPage/PatientConfigurationMenu`
  - Result Entry: `/MasterListsPage/ResultConfigurationMenu`
  - Validation: `/MasterListsPage/ValidationConfigurationMenu`
  - Workplan: `/MasterListsPage/WorkPlanConfigurationMenu`
  - Printed Reports: `/MasterListsPage/PrintedReportsConfigurationMenu`
- Application Properties: `/MasterListsPage/commonproperties`
- Menu Configuration
  - Main Menu: `/MasterListsPage/globalMenuManagement` _(Relabel "Global Menu")_
  - Billing Menu: `/MasterListsPage/billingMenuManagement`
  - Non-Conform Menu: `/MasterListsPage/nonConformityMenuManagement`
  - Patient Menu: `/MasterListsPage/patientMenuManagement`
- Lab Number Format: `/MasterListsPage/labNumber` _(Relabel "Lab Number Management")_
- Barcode Configuration: `/MasterListsPage/barcodeConfiguration` _(Orphan page added to the sidebar)_
- Label Presets: `/MasterListsPage/labelPresets`
- Calendar: `/MasterListsPage/calendarManagement`
- Localization
  - Languages: `/MasterListsPage/languageManagement`
  - Translations: `/MasterListsPage/translationManagement`

**ORGANIZATION** (section heading): Who the lab is and who works in it

- Site Information: `/MasterListsPage/SiteInformationMenu`
- Site Branding: `/MasterListsPage/SiteBrandingMenu`
- Users: `/MasterListsPage/userManagement`
- Notify Users: `/MasterListsPage/NotifyUser`
- Organizations: `/MasterListsPage/organizationManagement`
- Providers
  - Providers: `/MasterListsPage/providerMenu`
  - Provider Titles: `/MasterListsPage/providerTitleMenu`

**RESOURCES** (section heading): Catalog and reference data the lab tests against

- Test Catalog
  - Tests: `/MasterListsPage/TestCatalogList`
  - Panels: `/MasterListsPage/TestCatalogList?entity=panels`
  - Sample Types: `/MasterListsPage/SampleTypeEditor`
  - Lab Units: `/MasterListsPage/LabUnitManagement`
  - Import Catalog (CSV): `/MasterListsPage/CatalogImport`
  - Reflex Rules: `/MasterListsPage/reflex` _(Moved in from "Reflex Tests Configuration")_
  - Calculated Values: `/MasterListsPage/calculatedValue` _(Moved in)_
- Test Management (legacy): `/MasterListsPage/testManagementConfigMenu` _(Still the only door to Methods, Units of Measure and Result Select Lists; hide once the catalog covers them)_
- Microbiology Reference
  - Organisms: `/MasterListsPage/MicrobiologyReference/organisms`
  - Antibiotics: `/MasterListsPage/MicrobiologyReference/antibiotics`
  - AST Panels: `/MasterListsPage/MicrobiologyReference/ast-panels`
  - Culture Setups: `/MasterListsPage/MicrobiologyReference/culture-setups`
  - Breakpoints: `/MasterListsPage/MicrobiologyReference/breakpoints`
  - Patient Origins: `/MasterListsPage/MicrobiologyReference/patient-origins`
- Vector Surveillance
  - Species: `/MasterListsPage/vectorSurveillanceSetup/species`
  - Trap Types: `/MasterListsPage/vectorSurveillanceSetup/trap-types`
  - Sampling Sites: `/MasterListsPage/vectorSurveillanceSetup/sampling-sites`
  - Manual Entry Field Map: `/MasterListsPage/vectorSurveillanceSetup/manual-entry-fields`
- Environmental Compliance Standards: `/MasterListsPage/ComplianceStandardsAdmin` _(Orphan page added to the sidebar. Regulatory limits environmental results are judged against (feeds the Environmental Compliance Dashboard); not lab accreditation)_
- Programs: `/MasterListsPage/program` _(Relabel "Program Entry")_
- Dictionary: `/MasterListsPage/DictionaryMenu` _(Relabel "Dictionary Menu")_

**AUTOMATION** (section heading): Integrations, notifications and system upkeep

- External Connections: `/MasterListsPage/externalConnections`
- FHIR Data Export Status: `/MasterListsPage/dataExportStatus`
- Result Reporting: `/MasterListsPage/resultReportingConfiguration`
- Test Notifications: `/MasterListsPage/testNotificationConfigMenu`
- Notification Triggers: `/MasterListsPage/notificationTriggerConfig` _(Orphan page added to the sidebar)_
- Batch Test Reassignment: `/MasterListsPage/batchTestReassignment`
- Search Index: `/MasterListsPage/SearchIndexManagement`
- Logging: `/MasterListsPage/loggingManagement`
- Database Cleaning: `/MasterListsPage/DatabaseCleaning` _(Training installations only (existing gate))_

**COMPLIANCE** (section heading): The lab's own quality rules: which samples it accepts and why work is non-conforming

- Sample Acceptance Checklist
  - All Domains: `/MasterListsPage/SampleAcceptanceChecklist/all`
  - Clinical: `/MasterListsPage/SampleAcceptanceChecklist/clinical`
  - Environmental: `/MasterListsPage/SampleAcceptanceChecklist/environmental`
  - Vector: `/MasterListsPage/SampleAcceptanceChecklist/vector`
- Non-Conformity Reasons: `/MasterListsPage/NonConformityConfigurationMenu` _(Moved from General Configurations)_

Pinned below the buckets: **Back to main menu** (top, unchanged) and **Legacy Admin** (bottom, unchanged until no JSP-only admin page remains).


### A.4 Admin sidebar: every current entry

| Current group | Entry | editorKey | New bucket › location | Disposition |
|---|---|---|---|---|
| Reflex Tests Configuration | Reflex Tests Management | `reflex` | Resources › Test Catalog › Reflex Rules | Keep |
| Reflex Tests Configuration | Calculated Value Tests Management | `calculatedValue` | Resources › Test Catalog › Calculated Values | Keep |
| Microbiology reference data | Organisms | `MicrobiologyReference/organisms` | Resources › Microbiology Reference › Organisms | Keep |
| Microbiology reference data | Antibiotics | `MicrobiologyReference/antibiotics` | Resources › Microbiology Reference › Antibiotics | Keep |
| Microbiology reference data | AST Panels | `MicrobiologyReference/ast-panels` | Resources › Microbiology Reference › AST Panels | Keep |
| Microbiology reference data | Culture Setups | `MicrobiologyReference/culture-setups` | Resources › Microbiology Reference › Culture Setups | Keep |
| Microbiology reference data | Breakpoints | `MicrobiologyReference/breakpoints` | Resources › Microbiology Reference › Breakpoints | Keep |
| Microbiology reference data | Patient Origins | `MicrobiologyReference/patient-origins` | Resources › Microbiology Reference › Patient Origins | Keep |
| Test Catalogue Management | Sample Type Editor | `SampleTypeEditor` | Resources › Test Catalog › Sample Types | Keep |
| Test Catalogue Management | Test Catalogue Editor | `TestCatalogList` | Resources › Test Catalog › Tests | Keep |
| Test Catalogue Management | Panel Editor | `TestCatalogList?entity=panels` | Resources › Test Catalog › Panels | Keep |
| Test Catalogue Management | Lab Units Editor | `LabUnitManagement` | Resources › Test Catalog › Lab Units | Keep |
| Test Catalogue Management | Import Catalog (CSV) | `CatalogImport` | Resources › Test Catalog › Import Catalog (CSV) | Keep |
| - | Lab Number Management | `labNumber` | Config › Lab Number Format | Keep |
| - | Program Entry | `program` | Resources › Programs | Keep |
| Provider Management | Provider Management | `providerMenu` | Organization › Providers › Providers | Keep |
| Provider Management | Provider Titles | `providerTitleMenu` | Organization › Providers › Provider Titles | Keep |
| - | Label Presets | `labelPresets` | Config › Label Presets | Keep |
| Vector Surveillance | Species | `vectorSurveillanceSetup/species` | Resources › Vector Surveillance › Species | Keep |
| Vector Surveillance | Trap Types | `vectorSurveillanceSetup/trap-types` | Resources › Vector Surveillance › Trap Types | Keep |
| Vector Surveillance | Sampling Sites | `vectorSurveillanceSetup/sampling-sites` | Resources › Vector Surveillance › Sampling Sites | Keep |
| Vector Surveillance | Manual Entry Field Map | `vectorSurveillanceSetup/manual-entry-fields` | Resources › Vector Surveillance › Manual Entry Field Map | Keep |
| - | Organization Management | `organizationManagement` | Organization › Organizations | Keep |
| - | Result Reporting Configuration | `resultReportingConfiguration` | Automation › Result Reporting | Keep |
| - | User Management | `userManagement` | Organization › Users | Keep |
| - | Batch test reassignment and cancelation | `batchTestReassignment` | Automation › Batch Test Reassignment | Keep |
| - | Test Management | `testManagementConfigMenu` | Resources › Test Management (legacy) | Keep; hide once replaced |
| Menu Configuration | Global Menu | `globalMenuManagement` | Config › Menu Configuration › Main Menu | Keep |
| Menu Configuration | Billing Menu | `billingMenuManagement` | Config › Menu Configuration › Billing Menu | Keep |
| Menu Configuration | Non-Conform Menu | `nonConformityMenuManagement` | Config › Menu Configuration › Non-Conform Menu | Keep |
| Menu Configuration | Patient Menu | `patientMenuManagement` | Config › Menu Configuration › Patient Menu | Keep |
| Menu Configuration | Study Menu | `studyMenuManagement` | - | **Remove**: Study (RetroCI); D-021 |
| General Configurations | NonConformity Configuration | `NonConformityConfigurationMenu` | Compliance › Non-Conformity Reasons | Keep |
| General Configurations | MenuStatement Configuration | `MenuStatementConfigMenu` | - | **Remove**: Same data as Menu Configuration with an older UI (admin MVP Q2) |
| General Configurations | WorkPlan Configuration | `WorkPlanConfigurationMenu` | Config › Workflow Settings › Workplan | Keep |
| General Configurations | Site Information | `SiteInformationMenu` | Organization › Site Information | Keep |
| General Configurations | Site Branding | `SiteBrandingMenu` | Organization › Site Branding | Keep |
| General Configurations | Result Entry Configuration | `ResultConfigurationMenu` | Config › Workflow Settings › Result Entry | Keep |
| General Configurations | Patient Entry Configuration | `PatientConfigurationMenu` | Config › Workflow Settings › Patient Entry | Keep |
| General Configurations | Printed Report Configuration | `PrintedReportsConfigurationMenu` | Config › Workflow Settings › Printed Reports | Keep |
| General Configurations | Order Entry Configuration | `SampleEntryConfigurationMenu` | Config › Workflow Settings › Order Entry | Keep |
| General Configurations | Validation Configuration | `ValidationConfigurationMenu` | Config › Workflow Settings › Validation | Keep |
| Sample Acceptance Checklist | All domains | `SampleAcceptanceChecklist/all` | Compliance › Sample Acceptance Checklist › All Domains | Keep |
| Sample Acceptance Checklist | Clinical | `SampleAcceptanceChecklist/clinical` | Compliance › Sample Acceptance Checklist › Clinical | Keep |
| Sample Acceptance Checklist | Environmental | `SampleAcceptanceChecklist/environmental` | Compliance › Sample Acceptance Checklist › Environmental | Keep |
| Sample Acceptance Checklist | Vector | `SampleAcceptanceChecklist/vector` | Compliance › Sample Acceptance Checklist › Vector | Keep |
| - | Application Properties | `commonproperties` | Config › Application Properties | Keep |
| - | Test Notification Configuration | `testNotificationConfigMenu` | Automation › Test Notifications | Keep |
| - | Dictionary Menu | `DictionaryMenu` | Resources › Dictionary | Keep |
| - | Notify User | `NotifyUser` | Organization › Notify Users | Keep |
| - | Search Index Management | `SearchIndexManagement` | Automation › Search Index | Keep |
| - | Logging Configuration | `loggingManagement` | Automation › Logging | Keep |
| - | Database Cleaning (training only) | `DatabaseCleaning` | Automation › Database Cleaning | Keep |
| Localization | Language Management | `languageManagement` | Config › Localization › Languages | Keep |
| Localization | Translation Management | `translationManagement` | Config › Localization › Translations | Keep |
| - | External Connections | `externalConnections` | Automation › External Connections | Keep |
| - | FHIR Data Export Status | `dataExportStatus` | Automation › FHIR Data Export Status | Keep |
| - | Calendar Management | `calendarManagement` | Config › Calendar | Keep |
| - | Legacy Admin | (JSP) /MasterListsPage | Pinned bottom | Keep |
| (not in sidebar) | Barcode Configuration | `barcodeConfiguration` | Config › Barcode Configuration | Add (orphan page) |
| (not in sidebar) | Environmental Compliance Standards | `ComplianceStandardsAdmin` | Resources › Environmental Compliance Standards | Add (orphan page) |
| (not in sidebar) | Notification Triggers | `notificationTriggerConfig` | Automation › Notification Triggers | Add (orphan page) |