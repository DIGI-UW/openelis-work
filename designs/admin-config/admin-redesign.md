# OpenELIS Administration: Standard, Page Register and Settings Pages
## Functional Requirements Specification, v1.1

| | |
|---|---|
| **Status** | Draft for review. Definitive version: supersedes every earlier admin redesign document listed in §21. |
| **Date** | 2026-10-15 |
| **Change log** | v1.1 (2026-10-15): aligned with Result Delivery FRS v0.2. Test Notifications and Notification Triggers become one **Notifications** group (Channels, Templates, Distribution Lists, Triggers; A-04, A-05, X-10 to X-12); lab-wide delivery settings join Configuration's Notifications area (CF-5b, Appendix B); Sent Messages is a main-menu Reports page; External Connections loses its email and SMS types and gains defect L-17; AS-31 records the delivery password exception; RM-8 helper text; AF-17 notes D-235; decision ID collision noted in §17. 2026-10-16, still v1.1: aligned with Result Delivery FRS v0.3: new setting `deliveryGiveUpHours` ("Stop retrying after (hours)", default 24) and `deliveryRetryMinutes` defaults to 1, 5, 15, 30, 60, so the Notifications area has eight delivery settings (CF-5b, N-17, CF-AC-14, Appendix B: 168 settings, 56 routine); until Configuration ships, the delivery settings are edited on the existing Site Information page (CF-5b); WhatsApp leaves External Connections only in Result Delivery Release 2 (A-01). v1.0 (2026-10-02): definitive version. |
| **Owner** | Casey Iiams-Hauser |
| **Jira** | None yet for Parts A to D except Report Management, which stays under Epic **OGC-1111** (V1 delivered through **OGC-932**). Suggested slicing in `admin-redesign-breakdown.md`. |
| **Verified against** | `DIGI-UW/OpenELIS-Global-2` `develop` at `313490dc` (2026-10-01): `Admin.jsx`, `AdminSideNav.jsx`, `AdminDashboard.jsx`, `Layout.jsx`, `Header.jsx`, `PageBreadCrumb.jsx`, `ConfigMenuDisplay.tsx`, `GenericConfigEdit.tsx`, `CommonProperties.jsx`, `CommonPropertiesController.java`, `SiteInformationMenuRestController.java`, the `site_information` seed after all `default` Liquibase changesets, and `volume/properties/common.properties` |
| **Builds on** | Navigation Redesign FRS v0.1 (approved 2026-09-24; its main-menu parts stand, its Admin sidebar parts FR-22 to FR-26 and Appendix A.3/A.4 are superseded by Part A here), Locations & Organizations FRS v0.3 (OGC-1363, merged 2026-10-01), Patient Report & Report Management FRS v2.4.1 (Part B moves here as §13), Result Delivery FRS v0.2 (governs the Notifications group, the Notifications settings area and Sent Messages) |
| **Governing decisions** | D-002, D-003, D-005, D-006 (superseded by D-235), D-008, D-009, D-010, D-012, D-013, D-021, D-064, D-065, D-066, D-068, D-069, D-104, D-111, D-112, D-151, D-152, D-156, D-160, D-174, D-225, D-232, D-235, D-241, D-243, and new D-190 to D-202 (§17) |

**How to read this.** Part A is the frame every admin page sits in: the sidebar, the admin home, breadcrumbs, routes and access. Part B is the admin UI standard: six page types and the rules every admin page follows. Part C registers every admin page that exists on `develop` or is planned, with its page type, the spec that governs it, and what it must change to meet Part B. Part D specifies in full the three pages this programme builds: **Configuration**, **Menu Configuration** and **Report Management**. Part E holds data, localization, dependencies, decisions and acceptance criteria.

Requirement IDs carry a prefix per part so they never collide with other specs: **AF** (admin frame), **AS** (admin standard), **CF** (Configuration), **MC** (Menu Configuration), **RM** (Report Management). Report Management keeps the V column it had in the patient report FRS; everything else is version-agnostic and sliced in the breakdown.

**Precedence.** Where a per-page spec in the register disagrees with Part B, Part B wins and the page's register row names the gap. A per-page spec keeps authority over everything Part B does not cover (its fields, its data, its workflow).

---

## Lab Context

### Current State

Every OpenELIS deployment is set up and kept running through the Admin section. An **implementer** (often a ministry IT officer or a partner engineer) stands a laboratory up: names it, sets the accession number prefix, connects it to the national patient registry and the FHIR (Fast Healthcare Interoperability Resources) server that exchanges records with other systems, loads the test catalog, and turns on the modules the lab uses. After go-live a **lab administrator** (a senior technologist or the quality manager) changes a smaller set of things while the lab runs: adds users, deactivates a provider who left, makes the requesting doctor mandatory, switches the sample acceptance checklist from optional to mandatory before an accreditation visit.

Both of them reach this work through the Admin sidebar, which on `develop` holds about 30 top-level entries with no section headings, and through an admin dashboard of 14 hand-picked tiles. Behind them sit about 60 pages built over ten years by different teams. Nine of those pages are the same old component: a table of Name, Description and Value where you tick a radio button, press **Modify**, edit one setting on a separate form and come back. Together they hold 111 settings. Application Properties holds 61 more in a flat list of raw key names such as `org.itech.login.saml.entityId`.

### Pain

Nobody can find a setting without already knowing where it lives. `referralStuckThresholdDays`, which decides when a sample sent to a reference lab is flagged as stuck, is on the page called Site Information. `eqaEnabled`, which switches on external quality assessment, is on Order Entry Configuration. None of the nine pages has a search box. Site Information shows 30 rows per page and holds 36, so `useExternalPatientSource`, the switch that turns on the patient registry connection, sits on page two while its address, username and password sit on page one. An administrator can configure the connection and never find the switch. OpenELIS's Director of Product says "even I can't find everything anymore."

Pages that look alike behave differently, so nothing learned on one carries to the next: Users still uses the select-a-row-then-Modify bar, Locations & Organizations edits in place, Test Catalog opens a full editor, Language Management deletes a language for good with a trash can, three pages switch views with tabs, breadcrumbs come in five shapes, and two finished pages have no sidebar entry at all. Some settings can destroy data or lock everyone out and nothing says so: `TrainingInstallation` ("Allows for deletion of all patient and sample data") sits as an ordinary true/false row under the 24-hour-clock setting. Application Properties appears to accept a change but keeps it only in memory until the next restart, and Site Information shows the patient registry password in plain text.

### What Changes

The sidebar reads as five short sections (Config, Organization, Resources, Automation, Compliance) with one entry per page, and the admin home is drawn from the same list. Every setting lives on one page, **Configuration**: the administrator opens it on the settings changed during normal operation (54 of 164 on a standard install), types a word or the raw key, edits in place and sees the stored value read back; the implementer switches to Setup and works through the rest area by area. Settings that belong together appear as one block, settings that can lose data or lock people out say so in a plain sentence before anyone opens them, passwords are never shown, and any setting can be shared as a link.

Every list behaves the same way: search at the top, a Status filter that hides deactivated records until asked, an **Add** button that opens a new row in place, an Active switch and an **Edit** button on each row, editing inside the row with Save and Cancel, and a History link showing who changed what. Nothing is deleted and nothing edits in a pop-up. A new admin page picks one of six page types instead of inventing a layout.

---

## 1. Overview

This FRS is the single, definitive design for the OpenELIS Admin section. It replaces four overlapping generations of admin design (the April 2026 IA v2.3 and Pattern Library, the May MVP scope, the August Phase 5 finalization and unified vision, and the Admin sidebar half of the September navigation redesign) with one frame, one standard and one register.

| | `develop` today | This FRS |
|---|---|---|
| Admin sidebar | About 30 top-level entries, no section headings, 2 finished pages reachable only from a tile, 1 sidebar group duplicated as in-page tabs | 5 section headings, every page reachable once from the sidebar |
| Admin home | 14 curated tiles, 2 misrouted | Generated from the sidebar definition (AF-9) |
| Settings | 111 on 9 property tables + 61 Application Properties; no search; paginated | 164 on one Configuration page (8 printed-report settings move to Report Management); searchable by label, description and key; never paginated |
| Page patterns | 5 breadcrumb shapes; modal, inline and select-and-Modify editing; hard delete on at least 3 pages; Tabs on 3 | One breadcrumb rule, one edit model, no hard delete, no Tabs |
| Menu Configuration | 5 separately built pages (Global, Billing, Non-Conform, Patient, Study) plus an empty MenuStatement page | One tree editor behind 4 sidebar children; Study and MenuStatement removed |
| Printed report settings | Printed Report Configuration property table | Report Management (§13) |

### 1.1 Navigation & URL

- **Admin sidebar:** grouped under five section headings, contents in §3.1. The Admin sidebar keeps replacing the main menu in the same panel when the user enters Admin, as it does today (`Layout.jsx` `isAdminNavRoute`).
- **Routes:** every admin page keeps `/MasterListsPage/<editorKey>` (D-012). New pages in this FRS: `/MasterListsPage/configuration` and `/MasterListsPage/reportManagement`. Menu Configuration keeps its four existing routes. There is no `/admin/<bucket>/<page>` migration and there are no bucket landing pages (D-190).
- **Admin home:** `/MasterListsPage` (exact). `/admin` keeps resolving to the same admin router, as it does today; it is not a separate namespace.
- **Breadcrumb:** `Home / Admin Management / [group] / Page` (AF-11 to AF-14, D-192).

---

## 2. User Stories

1. **As a lab administrator,** I want to find any setting by typing part of its name, its description or its raw key, so that I can change it without knowing which old screen owned it.
2. **As an implementer standing up a new laboratory,** I want to work through the setup settings area by area and see which are still at their shipped default, so that I know what I have not decided yet.
3. **As a lab administrator,** I want settings that can destroy data or lock people out to say so before I open them, so that I never discover the consequence afterwards.
4. **As a lab administrator,** I want every admin list to search, filter, add, edit and deactivate the same way, so that what I learn on one page works on the next.
5. **As a support engineer,** I want to send a colleague a link to one setting, one record or one page, so that I do not have to talk them through a navigation path.
6. **As a lab administrator,** I want to choose Letter or A4 once and manage the report's logos and signature on one page, so that the report fits our paper and carries our identity.
7. **As a designer or developer adding an admin page,** I want a short list of page types with fixed rules, so that a new page fits the rest of the admin without a design debate.

---

# Part A: The Admin Frame

## 3. Admin Sidebar

On `develop` the Admin sidebar is a hard-coded component (`AdminSideNav.jsx`). It replaces the main menu in the same panel whenever the route starts with `/MasterListsPage` or `/admin`. OGC-529 (PR #3546), which would have moved it onto the data-driven menu renderer, was closed without merging. Everything below can ship on the hard-coded component.

| ID | Requirement |
|---|---|
| AF-1 | The Admin sidebar is grouped under five section headings, in this order: **Config** (how this lab's workflows behave), **Organization** (who the lab is and who works in it), **Resources** (catalog and reference data the lab tests against), **Automation** (integrations, notifications and system upkeep), **Compliance** (the lab's own quality rules). Contents and order are in §3.1. Section headings are not links and carry no icon (D-010, D-064, D-190). |
| AF-2 | **Back to main menu** stays pinned at the top and **Legacy Admin** at the bottom, as today. |
| AF-3 | Every destination has exactly one sidebar entry. An entry with children has no route of its own and expands to show them. No entry sits more than three levels below its section heading (D-065). |
| AF-4 | Every top-level entry under a section heading carries a Carbon icon, and no two entries share one. Five pairs share an icon on `develop` today (§10, L-11). Children carry no icon. |
| AF-5 | Two finished pages that have no sidebar entry today are added: **Environmental Compliance Standards** (Resources) and **Notification Triggers** (Automation). Notification Triggers enters as the **Notifications** group (Channels, Templates, Distribution Lists, Triggers), which Result Delivery governs; its Sent Messages tab leaves admin and becomes the main-menu page Reports › Sent Messages (`/SentMessages`, D-232). Barcode Configuration is **not** added: its route already redirects to Label Presets (this corrects Navigation Redesign FR-23). |
| AF-6 | A group whose children are all hidden for the current user is not shown, and a section heading with nothing visible under it is not shown (Navigation Redesign FR-17). **Database Cleaning** shows only on training installations, as today. |
| AF-7 | Opening an admin page expands its group and marks the entry active. While a record editor (page type C, §7) is open, its sections show as children of the list's entry, as Test Catalog does today. |
| AF-7a | Transitional entries (§3.1) carry a gray "Merging" tag in the sidebar and on the admin home during the release before they are removed (CF-40). |
| AF-8 | The sidebar and the admin home (AF-9) are built from **one definition**: the sections, their entries, routes, labels and icons. Neither may list a page the other does not. Whether that definition is a code constant or the menu table (OGC-529) is the engineer's choice. |

### 3.1 Target sidebar

Page types are defined in §7. "Transitional" entries stay for one release after Configuration ships, then are removed in favour of it (CF-40). The register number links each entry to its row in §9.

| Section | Entry › child | Route (`/MasterListsPage/…`) | Type | Register |
|---|---|---|---|---|
| **Config** | Configuration | `configuration` | A Settings | C-01 |
| | Report Management | `reportManagement` | B Record list | C-02 |
| | Workflow Settings *(transitional)* › Order Entry · Patient Entry · Result Entry · Validation · Workplan · Non-Conformity | `SampleEntryConfigurationMenu` · `PatientConfigurationMenu` · `ResultConfigurationMenu` · `ValidationConfigurationMenu` · `WorkPlanConfigurationMenu` · `NonConformityConfigurationMenu` | legacy | C-03 to C-08 |
| | Application Properties *(transitional)* | `commonproperties` | legacy | C-09 |
| | Menu Configuration › Main Menu · Billing Menu · Non-Conform Menu · Patient Menu | `globalMenuManagement` · `billingMenuManagement` · `nonConformityMenuManagement` · `patientMenuManagement` | E Structure editor (Billing: C) | C-10 to C-13 |
| | Lab Number Format | `labNumber` | C Record editor | C-14 |
| | Label Presets | `labelPresets` | B Record list | C-15 |
| | Calendar | `calendarManagement` | B Record list (holidays, with a working-week tile) | C-16 |
| | Localization › Languages · Translations | `languageManagement` · `translationManagement` | B Record list | C-17, C-18 |
| **Organization** | Site Information *(transitional)* | `SiteInformationMenu` | legacy | O-01 |
| | Site Branding | `SiteBrandingMenu` | C Record editor | O-02 |
| | Users | `userManagement` | B Record list | O-03 |
| | Notify Users | `NotifyUser` | D Operations tool | O-04 |
| | Locations & Organizations › Organizations · Sampling Sites · Geographic Areas · Import / Export | `locations` · `locations/sites` · `locations/areas` · `locations/import` | B (Import / Export: D) | O-05 to O-08 |
| | Providers › Providers · Provider Titles | `providerMenu` · `providerTitleMenu` | B Record list | O-09, O-10 |
| **Resources** | Test Catalog › Tests · Panels · Sample Types · Lab Units · Import Catalog (CSV) · Reflex Rules · Calculated Values | `TestCatalogList` · `TestCatalogList?entity=panels` · `SampleTypeEditor` · `LabUnitManagement` · `CatalogImport` · `reflex` · `calculatedValue` | C (Import: D; Reflex, Calculated: B) | R-01 to R-07 |
| | Test Management (legacy) | `testManagementConfigMenu` | legacy hub | R-08 |
| | Microbiology Reference › Organisms · Antibiotics · AST Panels · Culture Methods · Breakpoint Standards · Patient Origins | `MicrobiologyReference/<section>` | B Record list | R-09 |
| | Vector Surveillance › Species · Trap Types · Manual Entry Field Map | `vectorSurveillanceSetup/species` · `/trap-types` · `/manual-entry-fields` | B Record list | R-10 |
| | Environmental Compliance Standards › Standards · Test Thresholds | `ComplianceStandardsAdmin/standards` · `ComplianceStandardsAdmin/thresholds` | B Record list | R-11 |
| | Programs | `program` | B Record list | R-12 |
| | Dictionary | `DictionaryMenu` | B Record list | R-13 |
| **Automation** | External Connections | `externalConnections` | B Record list | A-01 |
| | FHIR Data Export Status | `dataExportStatus` | F Monitor | A-02 |
| | Result Reporting | `resultReportingConfiguration` | C Record editor | A-03 |
| | Test Notifications *(transitional)* | `testNotificationConfigMenu` | legacy | A-04 |
| | Notifications › Channels · Templates · Distribution Lists · Triggers | `notificationTriggerConfig/channels` · `/templates` · `/lists` · `/triggers` | B Record list | A-05 |
| | Batch Test Reassignment | `batchTestReassignment` | D Operations tool | A-06 |
| | Search Index | `SearchIndexManagement` | D Operations tool | A-07 |
| | Logging | `loggingManagement` | D Operations tool | A-08 |
| | Database Cleaning *(training installations only)* | `DatabaseCleaning` | D Operations tool | A-09 |
| **Compliance** | Sample Acceptance Checklist › All Domains · Clinical · Environmental · Vector | `SampleAcceptanceChecklist/all` · `/clinical` · `/environmental` · `/vector` | B Record list | P-01 |

After the transition release the **Workflow Settings** group, **Application Properties** and **Site Information** entries are gone (Remove, D-066), and Config opens with Configuration, Report Management, Menu Configuration. **Test Notifications** leaves the sidebar once Result Delivery has moved its message texts to Templates and its patient settings to the per-test Patient messages setting (Result Delivery FR-H1, X-10).

Entries that leave the sidebar, with their redirects, are in §9.2. Where this table differs from Navigation Redesign Appendix A.3, Appendix A of this FRS lists each difference and why.

## 4. Admin Home

| ID | Requirement |
|---|---|
| AF-9 | `/MasterListsPage` (exact) shows the **admin home**: the page title "Admin Management" (the label every admin breadcrumb links back to), one sentence ("Set up and maintain this laboratory's OpenELIS."), a search box, then the five sections in sidebar order. Each section shows its heading, its one-line description from AF-1, and one Carbon `ClickableTile` per top-level entry with the entry's icon, label and a one-line description. A group's tile lists its children as links; only those links navigate, the tile itself does not (D-065). The content comes from the AF-8 definition, so the home can never show a page the sidebar does not, or misroute (today "General Configurations" opens Site Information). |
| AF-10 | The admin home search filters the tiles by page name and description as the user types. Below the tiles it always offers **Search settings for "{text}"**, which opens Configuration with `?q={text}` (CF-19). An admin who does not know whether something is a page or a setting finds either from one box. |

## 5. Breadcrumbs, Titles and Routes

| ID | Requirement |
|---|---|
| AF-11 | Every admin page renders the shared breadcrumb (`PageBreadCrumb`) as **`Home / Admin Management / [group …] / Page`**. "Admin Management" (`breadcrums.admin.managment`, existing key) links to the admin home. Section headings never appear as crumbs (D-192, amends D-013). |
| AF-12 | A group that has no route of its own (D-065) appears as a plain-text crumb. Example: `Home / Admin Management / Locations & Organizations / Sampling Sites`. |
| AF-13 | The last crumb is the page title, not linked. In a record editor the trail continues with the record and section: `Home / Admin Management / Test Catalog / Tests / Glucose (fasting) / Ranges`. |
| AF-14 | Pages that break this today are fixed (§10): Language and Translation Management say "Admin"; the three vector pages render no breadcrumb or title; Site Branding is parented under Site Information; the Sample Acceptance pages are parented under Order Entry Configuration; Environmental Compliance Standards and Programs are parented under Test Management; Provider Titles lacks the Providers group crumb. |
| AF-15 | Every admin page keeps `/MasterListsPage/<editorKey>` (D-012). A distinct view inside a page is a path segment (`locations/sites`); record IDs, filters, search text and open rows are query parameters (`?id=`, `?status=`, `?q=`). `/admin/...` keeps resolving to the same router and is never the canonical form. There is no `/admin/<bucket>/<page>` scheme and no bucket landing page (D-190). |
| AF-16 | A route that leaves the sidebar redirects to its replacement (§9.2), carrying query parameters through, and the destination shows an info notification naming what moved: "Order Entry Configuration is now part of Configuration. You are viewing the Orders & samples area." |

## 6. Access

| ID | Requirement |
|---|---|
| AF-17 | Admin stays behind the existing **Admin** role (`SecureRoute role={Roles.GLOBAL_ADMIN}` in `App.jsx`). This FRS adds no role and no permission key (D-006). D-006 is now superseded by D-235: a page whose own spec nominates `category:action` privileges follows that spec once privilege-based access (PR #3443) lands. The Notifications pages do so under Result Delivery (`notification:manage`; `distribution_list:manage` for Distribution Lists), and Users and Roles D-204 does so for its two pages. |
| AF-18 | Opening an admin URL without the role shows the application's existing access-refused behaviour. Hiding the Administration entry from such users in the main menu relies on menu filtering by role (OGC-1151, N-12). |
| AF-19 | Inside Admin every page and action is open to the Admin role. Where a page states a narrower rule today (Database Cleaning on training installations only), it keeps it. |

---

# Part B: The Admin UI Standard

## 7. Page Types

Every admin page is exactly one of six types. Pages waiting to merge or hide are marked *legacy (transitional)* in the register and are not redesigned. A new page names its type in its FRS and follows that type's rules plus the shared rules in §8 (D-193). This replaces the April Pattern Library's thirteen patterns and the August design system's archetypes.

| Type | What it is for | Shape | Examples |
|---|---|---|---|
| **A. Settings surface** | Key and value settings that change how the application behaves | One continuous, searchable list grouped by area; lifecycle and area filters; settings that form one decision shown as one block; inline edit; never paginated | Configuration (§11) |
| **B. Record list** | A collection of records the lab creates and maintains | Toolbar with search, filters, Status filter and Add; rows with an Active switch and Edit; Edit opens the row in place; server pagination for long lists | Locations & Organizations, Provider Titles, Programs, Label Presets, Report Management |
| **C. Record editor** | One record edited as a whole: a single form page, or a record from a list that is too big for a row (five or more sections) | Stacked sections with one Save, or a routed editor whose sections are sidebar children while the record is open; each section saves on its own | Site Branding, Lab Number Format, Result Reporting; Test Catalog tests, panels, sample types, lab units |
| **D. Operations tool** | An action a person runs occasionally, often to fix something | What the action does and when to use it, whether it is safe to run twice and how long it takes, the action, and its result | Search Index, Batch Test Reassignment, Notify Users, Import Catalog, Database Cleaning |
| **E. Structure editor** | A hierarchy edited as a shape rather than as rows | A tree with search, expand all and collapse all, changes collected and saved together after a pending-changes summary | Menu Configuration (§12) |
| **F. Monitor** | Read-only status | Current state, when it was last checked, a manual refresh, and an empty state that says what to do | FHIR Data Export Status (Sent Messages, once a tab of Notification Triggers, is now a main-menu Reports page under Result Delivery) |

## 8. Shared Rules

These apply to every admin page whatever its type. A rule that does not apply to a type says so.

### 8.1 Page header

| ID | Requirement |
|---|---|
| AS-1 | Every admin page opens with one shared page header: the breadcrumb (AF-11), the page title as the only `h1`, and one sentence saying what the page is for. Pages that need more explanation add a collapsible introduction under it (the Locations & Organizations `PageIntro` pattern), remembered closed per user. No shared admin header exists on `develop` today; building one is part of the first slice. |
| AS-2 | The page title never changes while the user works. Opening a row or a record never replaces it with a generic title such as "Edit Record". |
| AS-3 | The sidebar label may be shorter than the page title ("Languages" opens "Language Management"); the breadcrumb leaf always shows the page title. |

### 8.2 Moving between views

| ID | Requirement |
|---|---|
| AS-4 | A child view that has its own fields, actions or Save is a **sidebar child with its own route** (D-003). Admin pages never use Carbon `Tabs`, a `ContentSwitcher` or an internal left rail **to switch between views** (D-194). A `ContentSwitcher` may serve as a filter over one list (CF-8). |
| AS-5 | The same list narrowed (by area, type, status, domain) is an **in-page filter** in the toolbar, reflected in the URL. The test: would the user say they went *to* it, or that they *narrowed* the list? |
| AS-6 | `Accordion` is used only for optional or advanced content inside a form, never to move between views. |
| AS-7 | A form taller than two screens offers jump links to its sections at the top. |

### 8.3 Lists (types A and B)

| ID | Requirement |
|---|---|
| AS-8 | Lists are Carbon `DataTable`s. The toolbar holds, left to right: search, filters, the Status filter, and the primary **Add {thing}** button. |
| AS-9 | Search appears on any list that can exceed about 20 rows. It matches the name and every code or identifier the list shows, filters as the user types (300 ms debounce) and is kept in the URL (`?q=`). |
| AS-10 | Records that can be deactivated are filtered by a **Status** dropdown: Active, Inactive, All. It defaults to Active and is kept in the URL (`?status=`). An inactive row shows a gray "Inactive" tag (D-196). |
| AS-11 | Each row shows its **Active** switch and an **Edit** button, and at most one more visible action where the record type needs it (for example Duplicate). No overflow menu on admin list rows (D-111; this narrows D-104's overflow allowance for admin lists). A tree row adds a visible "Add {child}" button. The row itself is not clickable; in a type C list the record name is also a link to the editor. |
| AS-12 | Selection checkboxes and the Carbon batch bar appear only where batch work exists (Deactivate, Reactivate, Export selected). The bar shows the count beside the selected records' names, which scroll when there are many; names are never replaced by a count alone. |
| AS-13 | A list that can exceed 100 rows pages on the server: 25, 50 or 100 per page, default 25, with "1 to 25 of 312". The pager is hidden at 25 rows or fewer. Settings surfaces never page (D-202). |
| AS-14 | Whenever a search or filter is active the list says "Showing {n} of {N}" with **Clear filters**. |
| AS-15 | Default order is the list's display order where it has one, otherwise name A to Z. Columns the user would sort by are sortable. |

### 8.4 Editing and creating

| ID | Requirement |
|---|---|
| AS-16 | **Edit** opens the row in place (inline expansion). One row is open at a time. Opening another row while the open one has unsaved changes triggers the guard (AS-24) (D-005, D-195). |
| AS-17 | **Add {thing}** inserts a new row at the top of the list, already open, with defaults filled. Cancel removes it. There is no create modal and no separate create page, except for type C records, where Add opens a blank record in the editor. |
| AS-18 | A type C record editor has its own route (`…/<editorKey>/<id>/<section>`). Its sections are sidebar children of the list entry while the record is open, with "Back to {list}" first. Each section saves on its own. |
| AS-19 | Fields use Carbon form controls. Errors show inline on the field when it loses focus, and on Save a summary notification lists them with links to each field. A picker over a large or growing set is a searchable `ComboBox` (D-007). A multi-select shows the selected items' names, never only a count. |
| AS-20 | Each value has one editor. A value that another page owns shows read-only with a link to the page that edits it. |

### 8.5 Deactivating, never deleting

| ID | Requirement |
|---|---|
| AS-21 | Admin pages offer no Delete for records. The Active switch deactivates and reactivates (D-002). |
| AS-22 | Switching off a record that other records use opens a confirmation naming the use ("Used by 14 tests and 3 panels. They keep working, but it can no longer be chosen."). A record nothing uses switches off at once, with an Undo action in the toast for 10 seconds. |
| AS-23 | Allowed removals, each recorded in History: replacing or removing an uploaded image, unlinking two records (a test from a panel), and menu rows (D-066). |

### 8.6 Saving

| ID | Requirement |
|---|---|
| AS-24 | **Save** (primary) and **Cancel** (secondary) sit at the bottom of the open row, section or form, and stick to the bottom of the screen while the open area is taller than the screen. A page never shows two primary buttons. Closing, leaving, or opening another row with unsaved changes asks "Discard changes?" (D-197). |
| AS-25 | A successful save closes the row and shows the stored value read back from the server, with a toast naming what was saved ("Saved provider title Dr."). A block of several settings says how many changed ("Saved 1 of 5 settings"). A change that needs a server restart says so in the toast. |
| AS-26 | A failed save keeps everything the user entered, says what failed, and offers Retry. If the record changed since it was opened, the message names who changed it and when, and offers Reload. |
| AS-27 | There are no page-level "unsaved changes" bars and no autosave. The one exception is a type E structure editor, which collects changes across the tree and saves them together after a summary (MC-5). |

### 8.7 Confirmation and danger

| ID | Requirement |
|---|---|
| AS-28 | A modal appears only to confirm a change that loses data, locks people out or cannot be undone; to guard unsaved changes; to confirm switching off a record in use; to review a set of structure changes before saving (MC-5); or to confirm reverting to a shipped default (RM-17). Never to create, edit or view (D-005, D-195). |
| AS-29 | A change that can lose data, lock people out or cannot be undone is **marked**: a red left stripe on the row and one plain sentence saying what will happen ("Can permanently delete every patient and sample record"), visible before the row is opened. No category words such as "Destructive", and nothing else is marked (D-198). |
| AS-30 | Saving a marked change opens a Carbon danger modal that repeats the sentence and asks the user to type the item's name as shown on the page. Cancel has focus. |
| AS-31 | Secrets (passwords, tokens, keys) are never shown and never sent to the browser. The field reads "Set" or "Not set" with **Replace**, which opens a `PasswordInput`. **One exception:** a facility's or client's delivery password (Result Delivery; the Result delivery section in Locations & Organizations) can be shown and copied by users who hold `delivery:view_password`, because the lab gives it to the facility by phone and many people there need it. Every Show and Copy is recorded in History, and Generate and Change also need `organization:manage`. Connection secrets, such as channel passwords and tokens, stay under this rule (D-225, D-243). |

### 8.8 History

| ID | Requirement |
|---|---|
| AS-32 | Every open row, record and setting has a **History** link at the bottom that opens a timeline from the existing audit trail: who, when, which field, old value and new value. There is no reason-for-change field (D-112). |

### 8.9 Import and export

| ID | Requirement |
|---|---|
| AS-33 | A list that imports follows the Locations & Organizations pattern: an **Import / Export** sidebar child; a downloadable template; Add & update or Replace mode; a preview with a decision queue before anything is written; Replace deactivates and never deletes (D-108); a history of runs; and export in the same format as import. |

### 8.10 States, links and language

| ID | Requirement |
|---|---|
| AS-34 | Loading shows a skeleton shaped like the content. A load error names what failed and offers Retry. An empty list says what belongs there and offers the primary action. A list emptied by a filter names the filter and offers Clear filters. |
| AS-35 | Every view, filter set, open row and setting has a URL that reopens it. A link to something that no longer exists opens the page normally and says it was not found. |
| AS-36 | Every visible string comes from a translation key. Generic words reuse the shared `common.*` keys; new keys are `admin.{page}.*`, sidebar labels `sidenav.label.admin.*` (D-174, Constitution VII). New keys are added in English and their French translations are part of each slice's Definition of Done (Finalization F12, kept); other languages follow the normal translation workflow. A release is blocked if any marking sentence (AS-29) or confirmation text (AS-30) lacks French. Sentences that name a kind of record are whole-sentence keys per page (`admin.providerTitles.add` "Add provider title"), never a noun dropped into a shared template, and counts use ICU plural forms. |
| AS-37 | A value stored per language (`bannerHeading`, `billingRefNumberLocalization`) is edited with one input per active language. |
| AS-38 | Pages meet WCAG 2.1 AA. Edit buttons carry `aria-expanded`; focus moves to the first field when a row opens and back to its Edit button when it closes; Esc cancels (through the guard); modals trap focus; save results are announced through a polite live region. |

---

# Part C: Page Register

## 9. Every Admin Page

One row per page on `develop` (`313490dc`) or planned. **Disposition:** *Specified here* (Part D); *Conforms* (meets Part B, no work); *Consistency pass* (keep the page, fix only the listed gaps; no redesign); *Redesign* (its own spec, which must meet Part B); *Merge* or *Remove* (D-066; route redirects per §9.2); *Hide* (ships off, Admin can switch it on); *Planned* (not built; its spec must meet Part B).

**Gaps** cite Part B rule IDs. A consistency pass is not a redesign: it applies only the named rules to a page whose structure is otherwise untouched.

### 9.1 Pages

| # | Sidebar path | Route | Type | On `develop` | Governing spec | Disposition | Gaps against Part B |
|---|---|---|---|---|---|---|---|
| C-01 | Config › Configuration | `configuration` | A | Not built | §11 | Specified here | |
| C-02 | Config › Report Management | `reportManagement` | B | Not built (Printed Report Configuration is) | §13 | Specified here | |
| C-03 | Config › Workflow Settings › Order Entry | `SampleEntryConfigurationMenu` | legacy property table | Built, 22 settings | `order-entry-require-provider.md` (OGC-1143) for its one new setting | Remove one release after Configuration ships (CF-40) | Carries the cross-link banner (CF-39) until merged |
| C-04 | … › Patient Entry | `PatientConfigurationMenu` | legacy | Built, 9 settings | | Remove (CF-40) | as C-03 |
| C-05 | … › Result Entry | `ResultConfigurationMenu` | legacy | Built, 24 settings | `results-validation-config-v4.md` (OGC-1016 / OGC-343) | Remove (CF-40) | The v4 spec's settings move into Configuration's Results & validation area; its per-lab-unit validation override table stays its own type B list, placed by that spec. Its "left section-nav" (AS-4) and route `/admin/results-validation-configuration` (AF-15) are superseded |
| C-06 | … › Validation | `ValidationConfigurationMenu` | legacy | Built, 4 settings (character rules) | | Remove (CF-40) | as C-03 |
| C-07 | … › Workplan | `WorkPlanConfigurationMenu` | legacy | Built, 3 settings | | Remove (CF-40) | as C-03 |
| C-08 | … › Non-Conformity | `NonConformityConfigurationMenu` | legacy | Built, 4 settings | | Remove (CF-40) | Navigation Redesign labelled it "Non-Conformity Reasons" under Compliance, but it holds four switches about where non-conformities are reported, not a list of reasons (Appendix A) |
| C-09 | Config › Application Properties | `commonproperties` | legacy key grid | Built, 61 keys from the server properties file | | Remove (CF-40) | Saves change memory only and are lost at restart (L-10); Configuration shows these read-only until they persist (CF-33) |
| C-10 | Config › Menu Configuration › Main Menu | `globalMenuManagement` | E | Built: one flat checkbox tree of about 300 nodes, no search, one Submit | §12 | Specified here | |
| C-11 | … › Billing Menu | `billingMenuManagement` | C | Built | §12 | Specified here | |
| C-12 | … › Non-Conform Menu | `nonConformityMenuManagement` | E | Built | §12 | Specified here | |
| C-13 | … › Patient Menu | `patientMenuManagement` | E | Built | §12 | Specified here | |
| C-14 | Config › Lab Number Format | `labNumber` | C | Built | | Consistency pass | AS-29, AS-30: changing the format once samples exist cannot be undone, so it is marked and confirmed; AS-1 |
| C-15 | Config › Label Presets | `labelPresets` | B | Built (OGC-285) | `barcode-labels.md` v2.6 | Consistency pass | AS-17: Add opens a Carbon `Modal`; becomes a new open row (or a type C editor if a preset has five or more sections). AS-11: click-to-open rows become an Edit button. The duplicate Label Presets list in `test-catalog.md` with a Delete action is void (AS-21) |
| C-16 | Config › Calendar | `calendarManagement` | B | Built | `other/calendar-management.jsx` | Consistency pass | AS-21: holidays are hard-deleted (`DELETE /rest/calendar/holidays/{id}`); past holidays feed turnaround time, so they switch off instead |
| C-17 | Config › Localization › Languages | `languageManagement` | B | Built | | Consistency pass | AS-21: trash-can hard delete (`DELETE /rest/supportedlocales/{id}`), L-01, CRITICAL. AF-11: breadcrumb says "Admin" |
| C-18 | … › Translations | `translationManagement` | B | Built | | Consistency pass | AF-11: breadcrumb says "Admin" |
| O-01 | Organization › Site Information | `SiteInformationMenu` | legacy | Built, 36 settings | | Remove (CF-40) | Shows `patientSearchPassword` in plain text (L-09); fixed in Configuration by AS-31 |
| O-02 | Organization › Site Branding | `SiteBrandingMenu` | C | Built | | Consistency pass | AF-11: breadcrumb parented under Site Information (L-04) |
| O-03 | Organization › Users | `userManagement` | B | Built, legacy Modify / Deactivate / Add bar over radio-selected rows | `user-management.md` v1.0 (2026-04-23) | Redesign to that spec, conformed | AS-11, AS-16: the spec opens a user by clicking the row; use the Edit button. Its role-assignment modal becomes an inline added row (AS-17). Its "no audit in the UI" rule (FR-UM-38) gives way to AS-32 |
| O-04 | Organization › Notify Users | `NotifyUser` | D | Built | | Conforms | Check AS-1 |
| O-05 | Organization › Locations & Organizations › Organizations | `locations` | B (tree rows for wards) | Built (OGC-1363, #4500, 2026-10-01) | `locations-organizations.md` v0.3 | Conforms: **reference implementation for type B** | |
| O-06 | … › Sampling Sites | `locations/sites` | B | Built | same | Conforms | |
| O-07 | … › Geographic Areas | `locations/areas` | B (tree) | Built | same | Conforms | |
| O-08 | … › Import / Export | `locations/import` | D | Built | same | Conforms: **reference for AS-33** | |
| O-09 | Organization › Providers › Providers | `providerMenu` | B | Built, legacy action bar | | Consistency pass | AS-10, AS-11, AS-16, AS-17 |
| O-10 | … › Provider Titles | `providerTitleMenu` | B | Built (Title, Abbreviation, Sort order, in-use count) | `provider-titles.md` (OGC-1223, 2026-09-17) | Consistency pass; **reference page for slice 2** | AS-11: Activate / Deactivate buttons become the Active switch. AF-12: breadcrumb lacks the Providers group crumb. Spec corrections: FR-20 and FR-21 (create and edit in a modal) and the spec's `Home / Admin / Organization / …` crumb are void |
| O-11 | Organization › Roles *(after Users)* | planned | B | Not built (RBAC PR #3443 open) | `rbac-revamp-prd.md` (2026-03-04) | Planned | AS-21: the PRD deletes custom roles; deactivate instead. D-006: the PRD's `admin:roles` / `admin:role_management` keys are not part of this frame |
| R-01 | Resources › Test Catalog › Tests | `TestCatalogList`, editor `TestCatalogEditor/<id>/<section>` | C | Built | `test-catalog.md` v2.4, `test-catalog-completion-v2.md` | Conforms in structure (**reference implementation for type C**); consistency pass for AS-21 | AS-21: the Alerts section hard-deletes test alert rules (`TestAlertRuleRestController` `@DeleteMapping`), and the Accreditation section deletes accreditation enrollments, which define the accredited scope behind the report's † marker; both deactivate instead (an enrollment ends on a date). Spec corrections: `Admin › …` crumbs and the `/admin/test-catalog/…` route are void (AF-13, AF-15) |
| R-02 | … › Panels | `TestCatalogList?entity=panels` | C | Built | `panel.md` v2.2 | Conforms | AF-11 crumb in spec (`Home > Admin`) |
| R-03 | … › Sample Types | `SampleTypeEditor` | C | Built | `sample-type-management.md` v2.1 | Conforms | |
| R-04 | … › Lab Units | `LabUnitManagement` | C | Built | `lab-units.md` v2.0 | Conforms | |
| R-05 | … › Import Catalog (CSV) | `CatalogImport` | D | Built (OGC-1194) | | Conforms | AS-33 alignment (modes, decision queue) when next touched |
| R-06 | … › Reflex Rules | `reflex` | B | Built (rule cards) | `test-rules-mvp-frs.md` (draft, unbuilt) | Redesign to that spec, conformed | AS-21: the spec's Delete and batch Delete become deactivate. AS-11: row overflow menu. AF-15: its `/admin/testRules` acceptance criterion |
| R-07 | … › Calculated Values | `calculatedValue` | B | Built | `calculated-values-redesign-v2-preview.html` | Consistency pass | AS-1, AS-11 |
| R-08 | Resources › Test Management (legacy) | `testManagementConfigMenu` | legacy hub of about 22 links | Built | | Hide once Methods, Units of Measure and Result Select Lists have Test Catalog homes | Its child pages (`TestAdd`, `PanelCreate`, `UomManagement` and others) hide with it |
| R-09 | Resources › Microbiology Reference › Organisms · Antibiotics · AST Panels · Culture Methods · Breakpoint Standards · Patient Origins | `MicrobiologyReference/<section>` | B | Built (OGC-782) | `m-01-amr-reference-data.md` v2.0, `m-02-breakpoint-catalog.md` v2.0 | Consistency pass | AS-4: the page renders six Carbon Tabs that repeat the six sidebar children (L-06); remove the tabs. The AST panel trash icon removes an antibiotic from a panel, an allowed unlink (AS-23). Spec corrections: M-01's `ComposedModal` add and edit and its hard delete of unreferenced rows are void (AS-16, AS-17, AS-21). Plating templates (D-165) join as a seventh child when built |
| R-10 | Resources › Vector Surveillance › Species · Trap Types · Manual Entry Field Map | `vectorSurveillanceSetup/<page>` | B | Built | `vector-reference-data.md` v1.5 | Consistency pass | AS-1, AF-11: no breadcrumb and no title (L-03). Spec corrections: the spec's "Delete / Deactivate" wording and `tab.vectorRef.*` keys are void |
| R-11 | Resources › Environmental Compliance Standards › Standards · Test Thresholds | `ComplianceStandardsAdmin/standards`, `…/thresholds` (new sub-routes) | B | Built, reachable only from the Test Management hub | `compliance-standards-admin.md` v1.2 | Consistency pass | AF-5: add to the sidebar (D-068). AS-4: Standards / Test thresholds tabs become sidebar children. AS-21: parameter groups and thresholds are hard-deleted. AF-11: breadcrumb parented under Test Management |
| R-12 | Resources › Programs | `program` | B (inline multi-section editor) | Built (#3979, 2026-09-24) | `programs-management.md` v2.0 (OGC-781) | Consistency pass | AS-4: the Visual / JSON `ContentSwitcher` switches views; make them sidebar children or one view. AF-11: breadcrumb parented under Test Management. AS-10: "Show deactivated" toggle becomes the Status filter. AS-11: row overflow menu. AS-27: question cards save on blur; they save with the row |
| R-13 | Resources › Dictionary | `DictionaryMenu` | B | Built, legacy action bar | `data-dictionary.md` (2026-03) | Consistency pass | AS-11, AS-16, AS-17. The spec's category rail becomes a Category filter (AS-5); its edit modal and `DICTIONARY_DELETE` are void (AS-21, D-006) |
| R-14 | Resources › Test Catalog › Container Types | planned | C or B | Not built | Clinical Order Entry v4 (D-070) | Planned | |
| A-01 | Automation › External Connections | `externalConnections`, `externalConnectionEdit` | B | Built, legacy action bar and a separate edit page | Result Delivery FRS v0.2 (connection types) | Consistency pass | AS-11, AS-16: the separate edit page becomes the open row. The SMTP, BMP and SMPP types leave this page (WhatsApp in Result Delivery Release 2): Notifications › Channels edits the same `external_connection` rows (one per type), and nothing moves in the data. AS-31: `GET /rest/ExternalConnection` returns the decrypted password (L-17) |
| A-02 | Automation › FHIR Data Export Status | `dataExportStatus` | F | Built | | Conforms | |
| A-03 | Automation › Result Reporting | `resultReportingConfiguration` | C | Built, three fixed feed blocks | | Consistency pass | AS-24 to AS-26. Turning the three fixed feeds into a configurable list is an open question (§18, Q-2) |
| A-04 | Automation › Test Notifications *(transitional)* | `testNotificationConfigMenu`, `testNotificationConfig` | legacy | Built, per-test grid with a separate edit page | Result Delivery FRS v0.2 (FR-H1); `test-notification.html` (May preview) is void | Remove after Result Delivery's migration (tier Remove, D-066): message texts move to Templates, patient settings to the per-test Patient messages setting; routes redirect to Templates (X-10) | Not redesigned while it waits to be removed |
| A-05 | Automation › Notifications › Channels · Templates · Distribution Lists · Triggers | `notificationTriggerConfig/channels`, `/templates`, `/lists`, `/triggers` (new sub-routes; one route with tabs on `develop`) | B | Triggers, Templates and Sent Messages built as tabs on one route, reachable only from a dashboard tile; Channels and Distribution Lists not built | Result Delivery FRS v0.2; `notifications/notification-admin.jsx` for the built Triggers view | Redesign to that spec, conformed | AF-5: add to the sidebar. AS-4: the tabs, and nested tabs in Templates, become sidebar children. The Sent Messages tab leaves admin (X-11). Breadcrumb `Home / Admin Management / Notifications / <page>` (AF-11) |
| A-06 | Automation › Batch Test Reassignment | `batchTestReassignment` | D | Built | | Conforms | Sidebar label shortens to "Batch Test Reassignment"; the page title keeps "and Cancelation" |
| A-07 | Automation › Search Index | `SearchIndexManagement` | D | Built | | Consistency pass | Type D: say how long a rebuild takes and that it is safe to run twice |
| A-08 | Automation › Logging | `loggingManagement` | D with a live log | Built | | Conforms | |
| A-09 | Automation › Database Cleaning | `DatabaseCleaning` | D | Built, training installations only | | Consistency pass | AS-29, AS-30: mark and confirm by typing |
| P-01 | Compliance › Sample Acceptance Checklist › All Domains · Clinical · Environmental · Vector | `SampleAcceptanceChecklist/<domain>` | B | Built | | Consistency pass | AF-11: breadcrumb parented under Order Entry Configuration |

### 9.2 Entries that leave the sidebar

| # | Entry | Route | Disposition | Redirects to |
|---|---|---|---|---|
| X-01 | Printed Report Configuration | `PrintedReportsConfigurationMenu` | Remove (D-156) | `reportManagement` |
| X-02 | Study Menu | `studyMenuManagement` | Remove (D-021) | `globalMenuManagement` |
| X-03 | MenuStatement Configuration | `MenuStatementConfigMenu` | Remove: 0 settings on `develop` (its rows became menu switches in `2.8.x.x/menu.xml`) | `globalMenuManagement` |
| X-04 | Barcode Configuration | `barcodeConfiguration` | Merge: already redirects | `labelPresets` (unchanged) |
| X-05 | Organization Management | `organizationManagement` | Merged (done in OGC-1363) | `locations` (unchanged) |
| X-06 | Vector Surveillance › Sampling Sites | `vectorSurveillanceSetup/sampling-sites` | Merged (done in OGC-1363) | `locations/sites` (unchanged) |
| X-07 | Stuck analyzer events | `stuckAnalyzerEvents` | Merge, if it is the page the main menu reaches as Analyzers › Import Issues (D-069; confirm) | that main-menu entry |
| X-08 | Workflow Settings ×6, Application Properties, Site Information | as C-03 to C-09, O-01 | Remove one release after Configuration ships (CF-40) | `configuration?was=<editorKey>` |
| X-09 | Admin dashboard tiles "General Configurations", "Barcode Configuration" | | Replaced by the generated admin home (AF-9) | |
| X-10 | Test Notifications | `testNotificationConfigMenu`, `testNotificationConfig` | Remove after Result Delivery's migration (FR-H1; D-066) | `notificationTriggerConfig/templates` |
| X-11 | Notification Triggers › Sent Messages tab | `notificationTriggerConfig/sent` | Merge into the main-menu page Reports › Sent Messages (D-232) | `/SentMessages?product=trigger` |
| X-12 | Notification Triggers (one route with tabs) | `notificationTriggerConfig` | Becomes the Notifications group, which has no route of its own (AF-3) | `notificationTriggerConfig/triggers` |

Not to be built, so that nobody revives them from an older document: a Feature Flags page (D-200); bucket landing pages and the `/admin/<bucket>/<page>` scheme (D-190); an "Application Settings" page with tabs; a separate Lab Configuration page under any other name.

## 10. Defects Found on `develop`

| ID | Where | Finding | Severity | Fixed by |
|---|---|---|---|---|
| L-01 | Language Management | Trash-can hard delete of a language | CRITICAL (D-002) | C-17 |
| L-02 | Language, Translation Management | Breadcrumb "Admin" | MEDIUM | AF-14 |
| L-03 | Vector Surveillance pages | No breadcrumb, no title | HIGH | R-10 |
| L-04 | Site Branding | Breadcrumb parented under Site Information | MEDIUM | AF-14 |
| L-05 | Sample Acceptance Checklist | Breadcrumb parented under Order Entry Configuration | MEDIUM | AF-14 |
| L-06 | Microbiology Reference | Six tabs repeating the six sidebar children | MEDIUM | R-09 |
| L-07 | Environmental Compliance Standards, Notification Triggers | No sidebar entry | HIGH | AF-5 (Notification Triggers enters as the Notifications group) |
| L-08 | Admin dashboard | "General Configurations" opens Site Information; "Barcode Configuration" opens Label Presets | MEDIUM | AF-9 |
| L-09 | Site Information | `patientSearchPassword` is seeded unencrypted and shown in plain text | HIGH | CF-31 |
| L-10 | Application Properties | A save replaces the value in memory only and is lost at restart; the success toast shows before the request returns | HIGH | CF-33 |
| L-11 | Admin sidebar | Five icon pairs shared (Lab Number / Dictionary, Application Properties / Logging, External Connections / FHIR Export, Menu Configuration / Localization, Test Catalog / Legacy Admin) | LOW | AF-4 |
| L-12 | Calendar, Environmental Compliance Standards, Test Catalog | Holidays, parameter groups and thresholds, test alert rules and accreditation enrollments are hard-deleted | HIGH (D-002) | C-16, R-11, R-01 |
| L-16 | Environmental Compliance Standards, Programs, Provider Titles | Breadcrumbs parented under Test Management; Provider Titles lacks its group crumb | MEDIUM | AF-14 |
| L-13 | Global Menu Configuration | About 300 checkboxes in one flat tree with no search and one Submit | MEDIUM | §12 |
| L-14 | Property tables | `referralStuckThresholdDays` has value type `int`, which the shared edit form has no control for | MEDIUM | CF-22 |
| L-15 | `en.json` | "Reflex Tests  Management" has a double space | LOW | slice 1 |
| L-17 | External Connections | `GET /rest/ExternalConnection` returns the decrypted SMTP password to the browser (`ExternalConnectionRestController.java:60-84`; Result Delivery RD-X3) | HIGH | AS-31, A-01; Result Delivery FR-A5 |

---

# Part D: Pages Specified Here

## 11. Configuration

**Type A, Settings surface.** One page for every configuration setting OpenELIS has: the 102 settings on the seven Workflow Settings and Site Information property tables, the lab name from Printed Report Configuration, and the 61 keys Application Properties shows. 164 in all on `develop`; the list is data-driven, not hard-coded. The other eight printed-report settings move to Report Management (§13).

- **Sidebar:** Config › Configuration, first entry.
- **Breadcrumb:** `Home / Admin Management / Configuration`
- **Route:** `/MasterListsPage/configuration`. Positions: `?area=<areaId>`, `?life=routine|setup|all`, `?q=<text>`, `?setting=<key>`, `?block=<blockId>`, `?switches=1`.

### 11.1 Layout

```
Home / Admin Management / Configuration
Configuration
Every laboratory setting in one place. Search, or narrow the list by area.

[Search by name, description or key ............]   ( Routine | Setup | All )   [ ] Module switches only
Showing 54 of 164 settings · Show all

 Areas                     │ ORDERS & SAMPLES · 24 of 26
 All areas        54 of 164│  Require requesting provider ................................ Off
 Lab identity      1 of 9  │   Makes the requesting doctor mandatory when an order is registered.
 Language & display 4 of 5 │  GPS capture at collection                     3 settings     [Edit]
 Patients          7 of 22 │   Capture GPS coordinates  Off · Required accuracy 100 m · Timeout 10 s
 Orders & samples 24 of 26 │ ▌Accession number prefix                       Setup  12345   [Edit]
 …                         │ ▌ Cannot be changed once any sample has been registered.
```

### 11.2 The list

| ID | Requirement |
|---|---|
| CF-1 | The page lists every setting from the sources above in one continuous list. It never pages, in any view (AS-13). |
| CF-2 | Settings sit under area headings, in this order: Lab identity · Language & display · Patients · Orders & samples · Results & validation · Workplans · Labels & barcodes · Notifications · Integrations & exchange · Storage & devices · Security & access · Menus & help · System & server. Each setting's area is data (Dependency N-1); the draft assignment is Appendix B. |
| CF-3a | A **Was on** filter (`?was=<editorKey>`) narrows the list to the settings a retired page used to hold; it appears only when set by a link or redirect, with Clear. |
| CF-3 | The **Areas** filter on the left lists All areas and every area with its count in the current view. It narrows the list (AS-5); it is not navigation, and areas never appear in the sidebar. It defaults to All areas and sets `?area=`. |
| CF-4 | An area with nothing in the current view is not rendered in the list; it stays in the Areas filter with "0 of N". |
| CF-5 | Pages that are not settings but belong to an area appear in that area as a labelled link row: Site Branding and Locations & Organizations (Lab identity), Translations (Language & display), Report Management (Lab identity), Label Presets (Labels & barcodes), the Notifications pages Channels, Templates, Distribution Lists and Triggers (Notifications, CF-5b), External Connections (Integrations & exchange), Menu Configuration (Menus & help), Search Index and Logging (System & server). |
| CF-5b | **Notifications area.** Result Delivery's lab-wide delivery settings live here, not on a page of their own (D-241), stored as eight `site_information` entries (N-17, Appendix B): wait before sending a new report version (minutes, default 10), send partial reports automatically (default on), retry delays (default 1, 5, 15, 30 and 60 minutes, then every hour), stop retrying after (hours, default 24), default SMS country code, the public server address (needed for secure links, receipt confirmations and escalation; empty means all are off, which is the case for most labs), secure links (Off, Link as well as the attachment, Link instead of the attachment) and link lifetime (days, default 30). **Send a test** (`admin.configuration.notifications.sendTest`) sends a test email or SMS to a typed address or number with the current settings; it appears in Sent Messages as product Test, and the area confirms "Test sent to {0}. Its result shows in Sent Messages." (`admin.configuration.notifications.testSent`). Result Delivery reuses these two keys and mints none of its own for them. The area opens at `configuration?area=notifications` and starts with the link row to the Notifications pages (CF-5). The sender address (`org.openelisglobal.mail.from`) shows read-only with a link to Channels, which owns it (AS-20). There is no blind copy setting: `org.openelisglobal.mail.bcc` is retired, because a blind copy would send reports to an address nobody sees in the recipient list. For one release it shows as a read-only "Retired" row with that reason (Result Delivery FR-H5, AC-52, key `admin.notifications.settings.bccRetired`); it is not counted as a setting. The lab contact line used in messages and masked copies is the existing additional site information line (RM-8), not a setting here. Editing these settings needs `notification:manage` once privilege-based access lands (Result Delivery); until then the Admin role (CF-42). Until the Configuration page ships, the same `site_information` entries are edited on the existing Site Information page, so Result Delivery's first slices need no new settings page (Result Delivery, Releases). |
| CF-5a | Lab identity shows the laboratory time zone from the distribution configuration as a read-only information row (D-075), so it keeps a home when Site Information is retired. It is not counted as a setting. |
| CF-6 | Each row shows the setting's label, a one-sentence description, its current value in readable form ("On", "Off", "100 m", "English, French"), and, when it differs, the shipped default ("Default: Off"). The raw key shows on the open row. |

### 11.3 Routine and Setup

| ID | Requirement |
|---|---|
| CF-7 | Every setting is **Setup** (decided when the lab is installed) or **Routine** (changed while the lab runs). This is data (N-1). |
| CF-8 | A segmented control offers Routine · Setup · All. **Routine is the default view** (Casey, 2026-10-02). |
| CF-9 | Whenever the view hides settings the page says so in numbers, next to the control: "Showing 54 of 164 settings · Show all". Area headings and the Areas filter both read "{n} of {N}" (AS-14). |
| CF-10 | Search always covers **every** setting whatever the view, and each result shows its area and, when it is outside the current view, its lifecycle. |
| CF-11 | When every match lies outside the current view, the list says so above them: "No routine settings match 'configuration.dir'. 1 setup setting matches:" followed by the match. A filter never produces a silent "nothing found". |
| CF-12 | In the Setup view each setting still at its shipped default carries a gray "Default" tag, so an implementer sees what is undecided. |
| CF-13 | A setting shown outside its own lifecycle view carries a small lifecycle tag (Routine or Setup). |
| CF-14 | **Module switches only** narrows the list to the settings that turn a whole module or connection on or off (ten on `develop`: EQA samples, contact tracing, electronic orders, client registry search, external patient source, electronic signatures, freezer monitoring, unified Results Entry, Odoo billing, SAML sign-on). This replaces the Feature Flags page earlier plans proposed (D-200). Whether a setting is a module switch is data (N-1). |

### 11.4 Blocks of settings that form one decision

| ID | Requirement |
|---|---|
| CF-15 | Settings that describe one decision show as one **block**, in a meaningful order, and are edited and saved together: for example the five address labels (largest area first), the external patient source (switch, address, username, password), the freezer ports, the e-signature switch and its timeout. Membership and order are data (N-1); the draft blocks are in Appendix B. |
| CF-16 | A closed block shows every member and its current value on one or two lines. |
| CF-17 | Inside a block, a member that is the block's on/off switch disables the other members while it is off, saying why ("Turn on Use external patient source to set these"). |
| CF-18 | Saving a block writes only the members that changed and says so ("Saved 1 of 4 settings"). When marked members change, one confirmation lists each changed member's sentence and asks for the block title to be typed (CF-28). |

### 11.5 Search

| ID | Requirement |
|---|---|
| CF-19 | The search field stays in view while the list scrolls and filters as the user types. It matches the label, the description, the guidance text and the **raw key**, so `login.saml.entityId` and "SAML" both find the SAML block. `?q=` opens the page with a search applied (the admin home uses this, AF-10). |
| CF-20 | A search matching any member of a block returns the whole block, with the matching member highlighted. |
| CF-21 | A search that finds nothing anywhere names the text and offers Clear search. |

### 11.6 Editing

| ID | Requirement |
|---|---|
| CF-22 | **Edit** opens the row or block in place (AS-16). Each setting uses the control its type needs: Toggle for on/off, NumberInput for numbers (including `int`, which today has no control, L-14), Select or RadioButtonGroup for a fixed choice (`BarCodeType`: Barcode or QR; `sampleAcceptCheck.*`: Mandatory, Optional, Off), TextInput, TextArea for JSON with a format check, one input per active language for per-language values (AS-37). |
| CF-23a | A setting with no metadata (N-1), such as a server property a deployment added, still appears: area System & server, lifecycle Setup, its key as its label, text control, and it is listed in the completeness report (CF-37). Counts in this FRS are for the reference stack (develop 313490dc, `docker-compose` with `volume/properties/common.properties`); other installs differ. |
| CF-23 | A setting's control type and allowed values come from data captured from the existing editors and code, never guessed from the stored value (N-1). A setting whose type cannot be established shows as text and is listed in the internal completeness report (CF-37). |
| CF-24 | Save and Cancel follow AS-24 to AS-26: inside the open row, sticky, guarded, read back from the server, entries kept on failure. |
| CF-25 | Each open row shows the raw key, the default value, where the setting lived before ("Was on Site Information", during the transition release and the one after it), and a History link (AS-32). |
| CF-26 | Every saved change is written to the audit trail with user, time, key, old and new value. |
| CF-27 | A change that takes effect only after a server restart says so in the success toast, not as a permanent tag. |

### 11.7 Marked settings

| ID | Requirement |
|---|---|
| CF-28 | Settings that can lose data, lock people out or cannot be undone are marked as AS-29 describes, and saving one asks for its label to be typed (AS-30). On a read-only server-file row the marking is a warning only, until that row becomes editable (CF-33). Thirteen on `develop` (Appendix B), seven of them editable here today, among them: `TrainingInstallation` ("Can permanently delete every patient and sample record"), `Accession number prefix` ("Cannot be changed once any sample has been registered"), `requireLabUnitAtLogin` ("Can lock people out of OpenELIS or of work they can reach today"), the four character rules ("Narrowing a rule can stop existing records being saved"), the five SAML keys and `configuration.dir`. |
| CF-29 | Whether a setting is marked, and its sentence, are data (N-1). The red marking is the only danger signal; the other tags on this page are informational and gray or purple: Routine / Setup (CF-13), Default (CF-12), Module switch (CF-14), Server file (CF-33). |
| CF-30 | Marking sentences and their confirmation text are translated into French before release (AS-36). |

### 11.8 Secrets and server-file settings

| ID | Requirement |
|---|---|
| CF-31 | A secret setting (`patientSearchPassword` on `develop`) never shows its value and is never sent to the browser. The row reads "Set" or "Not set"; Edit offers Replace with a `PasswordInput` (AS-31). The value is stored encrypted (N-3). |
| CF-32 | Application Properties keys whose names contain "password" stay hidden, as `CommonPropertiesController` hides them today. |
| CF-33 | The 61 keys that come from the server's properties file (`common.properties`) show **read-only**, with the note "Set in the server's properties file. Ask your server administrator to change it." and a copy button for the key. Today a change on Application Properties lives only in memory and is lost at the next restart (L-10); showing them read-only stops OpenELIS claiming a change it does not keep. When a persisted store exists (N-4) they become editable and say "Takes effect after a restart." |

### 11.9 Guidance

| ID | Requirement |
|---|---|
| CF-34 | The closed row shows one sentence saying what the setting does, never a restatement of its label. It starts from the fuller description the old edit page shows, which is better than the list text (for the 24-hour clock: "Set to true to use 24 hour clock or false to use 12 hour clock" rather than "12 vs. 24 hour clock"). |
| CF-35 | The open row shows guidance as short prose: what the setting does, where its effect shows, its default and valid values, what changing it affects, and related settings. |
| CF-36 | Guidance on *why* a lab would change a setting is written by people who know. Where nobody has written it, that part is simply absent: no empty heading, no inferred reasoning. |
| CF-37 | Settings without written guidance, or with an unknown control type, are listed in an internal completeness report for the team. Administrators never see that state. |

### 11.10 Links, states and access

| ID | Requirement |
|---|---|
| CF-38 | Every setting and block has a link that opens the page, clears any filter that would hide it, scrolls to it, opens it and highlights it (`?setting=`, `?block=`). An unknown target opens the page and says "That setting wasn't found. Showing all settings." |
| CF-39 | **Two doors, one release.** While the old property tables, Application Properties and Site Information still exist, each carries an info notification "These settings are also in Configuration, where you can search all settings. [Open in Configuration]", and Configuration names the old page in the open row (CF-25). Both edit the same stored values. |
| CF-40 | **Retire the old pages.** One release after Configuration ships, the entries in §9.2 X-08 leave the sidebar and their page code and keys are deleted (tier Remove, D-066, Constitution X). Each route redirects to `configuration?was=<editorKey>`, which filters the list to the settings that lived on that page, with the AF-16 notification. The release gate: an automated check that every setting the old page edits appears in Configuration and saves. |
| CF-41 | Loading shows a skeleton of rows; a failed load names what failed and offers Retry (AS-34). The full list of 164 renders and is searchable in under one second on the reference server. |
| CF-42 | Access is the Admin role, as for every admin page (AF-17). Any administrator can change any setting, including marked ones; the typed confirmation guards against mistakes, it is not a permission. |

---

## 12. Menu Configuration

**Type E, Structure editor** (Main, Non-Conform and Patient Menu) and **type C** (Billing Menu). One editor component serves the three tree scopes (D-201). The editor changes which menu entries are switched on; it does not add, move or rename entries.

- **Sidebar:** Config › Menu Configuration › Main Menu · Billing Menu · Non-Conform Menu · Patient Menu
- **Breadcrumb:** `Home / Admin Management / Menu Configuration / Main Menu`
- **Routes:** `globalMenuManagement`, `billingMenuManagement`, `nonConformityMenuManagement`, `patientMenuManagement` (unchanged). `?q=` and `?node=<elementId>` for search and deep links.

| ID | Requirement |
|---|---|
| MC-1 | The tree shows the scope's menu as the user sees it: section headings rendered as headings (`presentation_style = section`), groups with their children, each entry with its translated label, its element ID in small monospace text (the route shows in its open detail) and an Active switch. Home and Alerts sit at the top with no heading (D-064). A group shows "{n} of {N} on". Removed and merged rows do not appear; hidden rows appear switched off so they can be turned on (Navigation Redesign FR-21). |
| MC-2 | The toolbar holds search (matches label, element ID and route; matching entries show with their parents, the rest are hidden, with "{n} matches"), **Expand all**, **Collapse all**, and a Show filter (All, On, Off). The tree opens with each section expanded one level. |
| MC-3 | Switching an entry marks it changed (a blue left bar and a "Changed" tag) without saving. A group switched off shows its children as "Hidden by {group}", their own switches unchanged. |
| MC-3a | Entries whose loss would lock administrators out (`menu_administration`, `menu_home`) cannot be switched off; their switch is disabled with the reason "Switching this off would remove the way into Admin." |
| MC-4 | With at least one change, a footer sticks to the bottom of the screen: "{n} changes" with **Review and save** (primary) and **Discard** (secondary). |
| MC-5 | **Review and save** opens a modal listing every change by its full path ("Turned off: Reports › Routine › Routine CSV Report"), grouped into turned on and turned off. **Save** commits them in one request, reads the tree back and shows "Saved {n} menu changes. Users see them the next time a page loads." This is the one save model that differs from AS-24, because a tree change is reviewed as a set (AS-27). |
| MC-6 | Leaving the page or switching scope with changes pending asks "Discard {n} changes?" (AS-24). |
| MC-7 | **Billing Menu** is a form: the billing address (URL, validated) and the Billing entry's Active switch, with Save and Cancel. The main menu shows Billing only when the address is set and the switch is on (Navigation Redesign FR-19). |
| MC-8 | Each entry's open detail shows its element ID, route and a History link (who switched it, when, on or off) (AS-32). |
| MC-9 | `studyMenuManagement` and `MenuStatementConfigMenu` redirect to Main Menu with the AF-16 notification (X-02, X-03). |
| MC-10 | A tree of 300 entries opens and searches in under one second; collapsed groups may render their children on first expand. |
| MC-11 | Access: the Admin role only (AF-17). |
| MC-12 | Out of scope: reordering entries, adding entries, renaming entries, and the menu auto-creation setting (`org.openelisglobal.menu.configuration.autocreate` stays in Configuration). |

---

## 13. Report Management

**Type B, Record list,** with a settings tile above the list. This section moved here from Part B of the Patient Report & Report Management FRS (v2.4.1) so that one admin FRS owns every admin page. Its content is unchanged except where noted **[changed]**; the patient report (the PDF) stays in that FRS, and delivery stays under Epic **OGC-1111**, V1 through **OGC-932**. Requirement IDs were FR-B1 to FR-B20; the crosswalk is in §13.6.

- **Sidebar:** Config › Report Management, directly after Configuration **[changed]**: Navigation Redesign put it last in Workflow Settings, a group this FRS empties after the transition release (CF-40), so it sits at the top level from the start and never moves (amends D-156's placement).
- **Breadcrumb:** `Home / Admin Management / Report Management` **[changed]**
- **Route:** `/MasterListsPage/reportManagement` (D-012). V2 deep link: `?report=<reportKey>` opens the list with that report open.
- **Retiring Printed Report Configuration:** tier Remove (D-066, D-156). The menu row, route and page code for `PrintedReportsConfigurationMenu` are deleted; the old URL redirects here. `LogoUploadController` redirects here too.

### 13.1 Layout

```
Home / Admin Management / Report Management
Report Management
Choose how OpenELIS prints reports for this lab.

┌ Print defaults ─────────────────────────────────────────────────────────────┐
│ Paper size   ( ) US Letter (8.5 × 11 in)   (•) A4 (210 × 297 mm)                 │
│ Page numbers on other reports  [On]                                  [Save]     │
└─────────────────────────────────────────────────────────────────────────────┘

[Search reports]                                         [ ] Show not configurable
  Report                    Category   Template
  Patient Status Report     Clinical   patient_letter / patient_a4  Shipped default   [Edit]
  Pathology Report          Clinical   PatientPathologyReport       Managed in code
```

### 13.2 Print defaults

| ID | Requirement | V |
|---|---|---|
| RM-1 | A **Print defaults** tile at the top holds settings that apply to every printed report: Paper size, and **[changed]** Page numbers on other reports. | 1 |
| RM-2 | **Paper size** is one lab-wide setting, US Letter or A4, shown as a Carbon `RadioButtonGroup`. A new install defaults to US Letter; a deployment's configuration can preset A4. Every report that ships a Letter and an A4 template follows it (in V1, the patient report). Other rows say "Letter only" (D-152). | 1 |
| RM-2a | **[changed] Page numbers on other reports** edits the existing `reportPageNumbers` setting for the reports still managed in code, so the setting keeps an editor when Printed Report Configuration is removed. The new patient templates always number pages and ignore it; the help text says so. If engineering confirms no remaining report reads `reportPageNumbers`, this control is dropped and the setting retired. | 1 |
| RM-3 | Saving shows a success notification. The next report generated uses the new values; PDFs already generated are unchanged. | 1 |

### 13.3 Report list

| ID | Requirement | V |
|---|---|---|
| RM-4 | A `DataTable` lists reports from the existing report configuration records (`reportconfiguration.Report`: display key, category, sort order, visibility; categories from `ReportCategory`), in their sort order. Columns: **Report**, **Category** (gray tag), **Template** (file name) with a tag: **Shipped default** (gray) or **Custom** (blue, V2). A toolbar search filters by name and category. Hidden report configurations (`is_visible` false) are not listed. | 1 |
| RM-5 | In V1 only the Patient Status Report row has an **Edit** button **[changed: opens through Edit, AS-11, AS-16]**. Other rows read "Managed in code" and have none. A **Show not configurable** toggle (off by default) shows or hides them. | 1 |
| RM-6 | In V2 a report becomes configurable once the report engine takes its template from this page's selection instead of a file name in code (N-9). Rows not yet converted keep "Managed in code". | 2 |

### 13.4 Patient report settings (open row)

Opening the Patient Status Report row shows its sections stacked top to bottom (no tabs, no accordion).

| ID | Requirement | V |
|---|---|---|
| RM-7 | **Header and branding.** Left header logo, right header logo and lab director signature image, each with a thumbnail in the shape it will print (**square** for the two logos, 4 : 1 for the signature), a Carbon `FileUploader` to replace it (PNG or JPEG, up to 2 MB) and Remove. They edit the existing image records (`headerLeftImage`, `headerRightImage`, `labDirectorSignature`). Help: logos "Square works best, at least 300 × 300 px. Other shapes are scaled to fit the square."; signature "At least 800 × 200 px on a white background." Replacing or removing an image is an audited setting change (AS-23). Reprints of older reports use the image current at reprint time, as today. | 1 |
| RM-8 | **Header lines.** Text inputs for the three existing lab director settings (`labDirectorTitle`, `labDirectorName`, `lab director`), which `report-level-signatures.md` §5.8.1 composes into the director line and the additional site information line (`additional site info`). The lab name (`SiteName`) shows read-only with a link **[changed]** to its editor in Configuration (`configuration?setting=SiteName`), so each value has one editor (AS-20). Helper text under the additional site information line tells the lab to put the phone number or email address for questions about results there: the same line prints on the report and is the lab contact in Result Delivery's messages and masked copies (Patient Report FR-A62). There is no page-number switch for the patient report: the new templates always number pages. | 1 |
| RM-9 | **Accreditation.** A read-only line names the active accrediting bodies and links to the accreditation admin pages (OGC-717 / OGC-718), where logos and visibility rules are managed. | 1 |
| RM-10 | **Signatures.** Reserved for the report signature settings OGC-302 defines (including its `esig.report.show_lab_director_signature` switch, which replaces today's rule of "show the signature image when one is uploaded"). Until OGC-302 ships it shows: "Electronic signature settings will appear here." | 1 |
| RM-11 | **Save** and **Cancel** at the bottom of the open row save the text settings together (AS-24 to AS-26). Image replace and remove save at once, as today. An invalid file shows the `FileUploader` invalid state and saves nothing. | 1 |

### 13.5 Template registry (V2) and audit

| ID | Requirement | V |
|---|---|---|
| RM-12 | **Where templates come from.** (a) The shipped templates bundled with the release; (b) custom templates a server operator places in the deployment's configuration folder, in a subfolder named for the report key. A custom template is one file, or a Letter / A4 pair named `<name>_letter.jrxml` and `<name>_a4.jrxml`, which then follows the paper size. The page has **no upload control** (D-151). | 2 |
| RM-13 | **Validation.** Each custom template is checked on discovery: well-formed, compiles, and uses only parameters and fields the report supplies. One that fails is listed "Not usable" with the reasons and cannot be selected. | 2 |
| RM-14 | **Selector.** A `RadioButtonGroup` lists the usable templates: the shipped default first, then custom ones by file name and modified date. The active one is selected. | 2 |
| RM-15 | **Preview.** **Preview with sample data** renders the selected template with the built-in sample order (N-10) and opens the PDF in a new tab. It never changes the active template and never reads patient data. A failure shows an inline error with the reason. | 2 |
| RM-16 | **Activate.** Save activates a different template only after it previewed successfully in the same session; until then Save is disabled with "Preview this template before activating it." | 2 |
| RM-17 | **Revert.** **Revert to shipped default** opens a Carbon `Modal` ("Revert Patient Status Report to the shipped template? The custom template stays in the configuration folder and can be selected again."). Nothing is deleted (D-002). | 2 |
| RM-18 | **Upgrades.** Reports on the shipped default take a newer shipped template automatically. A report on a custom template keeps it, and its row shows "A newer shipped template is available. This report uses a custom template." with **Preview shipped template**. | 2 |
| RM-19 | **History.** The open row's History link (AS-32) shows setting changes in V1; in V2 a table of the last ten template changes adds date, user, from and to. | 1, 2 |
| RM-20 | Every saved change is written to the audit trail with user, time, setting, old and new value: paper size, page numbers, header lines, image replace and remove (V1); template activate and revert (V2). | 1, 2 |
| RM-21 | Access: the Admin role, the access that opens Printed Report Configuration today (AF-17). Users without it do not see the entry, and the route refuses them. | 1 |

### 13.6 Crosswalk from the patient report FRS

| Patient report FRS v2.4.1 | This FRS | Note |
|---|---|---|
| §1.1 Report Management navigation | §13 header | Placement and breadcrumb changed |
| §9 Page Layout | §13.1 | Page numbers line added |
| FR-B1, FR-B2, FR-B3 | RM-1, RM-2, RM-3 | RM-2a new |
| FR-B4, FR-B5, FR-B6 | RM-4, RM-5, RM-6 | RM-5 opens through Edit |
| FR-B7 to FR-B11 | RM-7 to RM-11 | RM-8 links to Configuration; keys named |
| FR-B12 to FR-B18 | RM-12 to RM-18 | Unchanged |
| FR-B19 | RM-19 | History link in V1 too |
| FR-B20 | RM-20 | Page numbers added |
| §12 Access (Report Management bullet) | RM-21 | |
| §13.2 Admin page keys | §15.4 | `admin.reports.save` / `.cancel` replaced by `common.save` / `common.cancel` (D-174) |
| §15 AC-17 to AC-23, AC-27 to AC-32 | §19.5 RM-AC-1 to RM-AC-13 | |
| §11.2 N1, N5, N8 | §14.2 N-8, N-9, N-10 | |

The patient report FRS keeps a pointer in place of its Part B and keeps every Part A requirement, the Jasper notes and the patient report acceptance criteria.

---

# Part E: Data, Language, Decisions and Acceptance

## 14. Information & Data

This FRS names the data each page needs and leaves storage and API shape to the implementing engineer, except where an existing endpoint already does the job.

### 14.1 Reused (API & Data Reuse, D-174)

| Need | Reuse | Verified on `develop` 313490dc |
|---|---|---|
| Settings on the property tables | `site_information` rows by domain; `GET /rest/{X}Menu` lists a domain (`SiteInformationMenuRestController.java:56-170`), `GET` / `POST /rest/{X}?ID=` read and save one (`SiteInformationRestController.java:98, 235`) | Yes |
| Value types and per-language values | `site_information.value_type` (boolean, text, freeText, dictionary, logoUpload, int), `tag = localization` with a localization record per language | Yes |
| Application Properties | `GET /rest/properties` (`CommonPropertiesController`), read only (CF-33) | Yes |
| Report images | `POST /rest/logoUpload`, `GET /dbImage/siteInformation/{name}` | Yes |
| Report list | `reportconfiguration.Report`, `ReportCategory` | Yes (patient report FRS) |
| Menu entries | `clinlims.menu` (element ID, parent, order, label key, URL, active flag, presentation style, icon) and the endpoints Global Menu Configuration uses today | Table yes; endpoints to confirm |
| Change history | `site_information` and `menu` rows already write the generic audit trail (`auditTrailLog = true`); Locations & Organizations keeps its own change table (`OrganizationChange`). No endpoint reads history per record yet (N-14) | Yes |
| Breadcrumb | `PageBreadCrumb.jsx`, key `breadcrums.admin.managment` | Yes |
| Access | `SecureRoute role={Roles.GLOBAL_ADMIN}` | Yes |

### 14.2 New data and dependencies

| # | Item | Kind | For |
|---|---|---|---|
| N-1 | **Settings metadata**, one record per setting: area, lifecycle, block and order within it, whether it is the block's on/off switch (CF-17), marking sentence key, module-switch flag, control type and allowed values, guidance keys, the **shipped default** (`site_information` has no default column), a **needs restart** flag (CF-27) and the **page it came from** (CF-25, CF-3a). The existing `instructionKey` and `descriptionKey` on each `site_information` row are reused for the description and guidance where they hold text (D-174). Authored once, in one pass, from Appendix B; shipped with the release; a distribution's configuration can override it. | New data (content) | CF-2, CF-7, CF-14, CF-15, CF-22, CF-28, CF-34 |
| N-2 | **One settings read** returning every setting across sources with its metadata, current value, default and a version for conflict detection, never including secret values; **block save** writing only changed members and returning the stored values. May wrap the existing per-domain endpoints. | Backend | CF-1, CF-18, CF-24, CF-31 |
| N-3 | `patientSearchPassword` stored encrypted (the `encrypted` column exists; the seed sets it false) and never returned. | Data fix | CF-31 |
| N-4 | A persisted store for server-file properties, so a change survives a restart. Optional: until it exists these show read-only (CF-33). | Backend, optional | CF-33 |
| N-5 | Shared admin components: page header, list toolbar (search, filters, Status, Add), row actions (Active switch, Edit), open-row footer (sticky Save and Cancel, unsaved guard), History panel, danger marking and typed-confirmation modal. | Frontend | AS-1 to AS-32 |
| N-6 | One sidebar definition feeding the Admin sidebar and the admin home. | Frontend | AF-8, AF-9 |
| N-7 | Sub-routes for the views that are tabs today: `ComplianceStandardsAdmin/standards` and `/thresholds`; `notificationTriggerConfig/channels`, `/templates`, `/lists`, `/triggers` (Channels and Distribution Lists are new pages under Result Delivery; the `sent` tab redirects to `/SentMessages?product=trigger`, X-11); Microbiology Reference already has them. | Frontend | AS-4, R-11, A-05 |
| N-8 | **Paper size**: one lab-wide setting, LETTER or A4, stored with the other printed-report settings (suggested key `printedReport.defaultPaperSize`). Was patient report N1. | New setting | RM-2 |
| N-9 | **Template choice per report** and the engine change that resolves a report's template from it. Was patient report N5. | New data, engine change (V2) | RM-6, RM-12 to RM-18 |
| N-10 | **Sample order** fixture for template preview. Was patient report N8. | Fixture (V2) | RM-15 |
| N-11 | Menu Configuration saves many entry switches in one request and reads the tree back. | Backend (confirm the existing save) | MC-5 |
| N-12 | OGC-1151 (menu filtering by role, in review) for hiding empty groups and headings and the Administration entry. | Sibling ticket | AF-6, AF-18, AF-AC-6, RM-AC-6 |
| N-13 | OGC-302 report signature settings; OGC-717 / OGC-718 accreditation pages. | Sibling tickets | RM-9, RM-10 |
| N-14 | **History read** per record for each admin entity, from the audit trail or the entity's own change table; change logging added for any admin entity that does not write one. | Backend | AS-32 |
| N-15 | **Usage count** per record type for the in-use confirmation ("Used by 14 tests and 3 panels"). | Backend, per entity | AS-22 |
| N-16 | A **version and last editor** on admin records that lack them, for conflict detection. | Backend, per entity | AS-26 |
| N-17 | **Lab-wide delivery settings**: eight new `site_information` entries with N-1 metadata in the Notifications area (`deliveryHoldMinutes`, `deliverySendPartials`, `deliveryRetryMinutes`, `deliveryGiveUpHours`, `deliveryDefaultCountryCode`, `publicServerAddress`, `deliverySecureLinks`, `deliverySecureLinkDays`; Result Delivery FR-A16), plus the Send a test action. | New settings (D-241) | CF-5b |

## 15. Localization

New keys are added to `frontend/src/languages/en.json`; other languages follow the normal translation workflow. Before minting, run `npm run i18n:find -- "<text>"` (Constitution VII). **Status:** REUSE an existing key, or NEW.

### 15.1 Frame and shared components

| Key | English | Status |
|---|---|---|
| `breadcrums.admin.managment` | Admin Management | REUSE |
| `home.label` | Home | REUSE |
| `sidenav.label.admin.backToMainMenu` | Back to main menu | REUSE |
| `admin.legacy` | Legacy Admin | REUSE |
| `sidenav.label.admin.bucket.config` | Config | NEW (as Navigation Redesign) |
| `sidenav.label.admin.bucket.organization` | Organization | NEW |
| `sidenav.label.admin.bucket.resources` | Resources | NEW |
| `sidenav.label.admin.bucket.automation` | Automation | NEW |
| `sidenav.label.admin.bucket.compliance` | Compliance | NEW |
| `sidenav.label.admin.bucket.config.description` | How this lab's workflows behave | NEW |
| `sidenav.label.admin.bucket.organization.description` | Who the lab is and who works in it | NEW |
| `sidenav.label.admin.bucket.resources.description` | Catalog and reference data the lab tests against | NEW |
| `sidenav.label.admin.bucket.automation.description` | Integrations, notifications and system upkeep | NEW |
| `sidenav.label.admin.bucket.compliance.description` | The lab's own quality rules | NEW |
| `sidenav.label.admin.configuration` | Configuration | NEW |
| `sidenav.label.admin.workflowSettings` | Workflow Settings | NEW (as Navigation Redesign) |
| `sidenav.label.admin.menu.main` | Main Menu | NEW (as Navigation Redesign) |
| `sidenav.label.admin.environmentalComplianceStandards` | Environmental Compliance Standards | NEW |
| `sidenav.label.admin.notifications` | Notifications | NEW (as Result Delivery) |
| `sidenav.label.admin.notifications.channels` | Channels | NEW (as Result Delivery) |
| `sidenav.label.admin.notifications.templates` | Templates | NEW (as Result Delivery) |
| `sidenav.label.admin.notifications.lists` | Distribution Lists | NEW (as Result Delivery) |
| `sidenav.label.admin.notifications.triggers` | Triggers | NEW (as Result Delivery) |
| `sidenav.label.admin.<editorKey>` | the shortened labels in §3.1 ("Users", "Dictionary", "Search Index" and others) | NEW, one per shortened label |
| `admin.home.title` | Admin Management | REUSE `breadcrums.admin.managment` |
| `admin.home.subtitle` | Set up and maintain this laboratory's OpenELIS. | NEW |
| `admin.home.search` | Find an admin page or setting | NEW |
| `admin.home.searchSettings` | Search settings for "{0}" | NEW |
| `common.status` | Status | REUSE |
| `common.active` | Active | REUSE |
| `common.inactive` | Inactive | REUSE |
| `admin.<page>.add` | Add {record} (one whole sentence per page, e.g. `admin.providerTitles.add` "Add provider title") | NEW, one per page |
| `common.view` | View | REUSE (verify) |
| `common.close` | Close | REUSE (verify) |
| `common.edit` | Edit | REUSE |
| `common.save` | Save | REUSE |
| `common.cancel` | Cancel | REUSE |
| `common.search` | Search | REUSE |
| `common.all` | All | REUSE |
| `admin.common.showing` | Showing {0} of {1} | NEW |
| `admin.common.clearFilters` | Clear filters | NEW |
| `admin.common.history` | History | NEW |
| `admin.common.history.entry` | {0} changed {1} from {2} to {3} | NEW |
| `admin.<page>.saved` | Saved {record} {0}. (one per page, e.g. "Saved provider title {0}.") | NEW, one per page |
| `admin.common.savedCount` | Saved {count} of {total} settings. | NEW |
| `admin.common.saveFailed` | That didn't save. Your changes are still here. | NEW |
| `admin.common.conflict` | {0} changed this on {1}. Reload to see their version. | NEW |
| `admin.common.reload` | Reload | NEW |
| `common.retry` | Retry | REUSE |
| `admin.common.discard.title` | Discard changes? | NEW |
| `common.discard` | Discard | REUSE |
| `admin.common.discard.body` | Your changes have not been saved. | NEW |
| `admin.common.inUse.title` | Switch off {0}? | NEW |
| `admin.common.inUse.body` | Used by {0}. They keep working, but it can no longer be chosen. | NEW |
| `admin.common.undo` | Undo | NEW |
| `admin.common.deactivated` | {0} switched off. | NEW |
| `admin.common.typeToConfirm` | Type "{0}" to confirm | NEW |
| `admin.common.secret.set` | Set | NEW |
| `admin.common.secret.notSet` | Not set | NEW |
| `admin.common.secret.replace` | Replace | NEW |
| `admin.common.notFound` | That item wasn't found. | NEW |
| `admin.common.moved` | {0} is now part of {1}. | NEW |
| `admin.common.movedArea` | You are viewing the settings that were on {0}. | NEW |
| `admin.common.backToList` | Back to {0} | NEW |
| `admin.common.loadFailed` | {0} couldn't be loaded. | NEW |
| `admin.common.empty` | Nothing here yet. | NEW (pages add their own sentence, AS-34) |
| `admin.common.filteredEmpty` | Nothing matches these filters. | NEW |
| `admin.common.copyLink` | Copy link | NEW |
| `admin.common.linkCopied` | Link copied. | NEW |
| `admin.common.tag.merging` | Merging | NEW |
| `admin.home.notAPage` | Not a page? | NEW |

### 15.2 Configuration

| Key | English | Status |
|---|---|---|
| `admin.configuration.title` | Configuration | NEW |
| `admin.configuration.subtitle` | Every laboratory setting in one place. Search, or narrow the list by area. | NEW |
| `admin.configuration.search` | Search by name, description or key | NEW |
| `admin.configuration.areas` | Areas | NEW |
| `admin.configuration.allAreas` | All areas | NEW |
| `admin.configuration.life.routine` | Routine | NEW (do **not** point at `common.routine`, which means routine testing as opposed to study testing) |
| `admin.configuration.life.setup` | Setup | NEW |
| `admin.configuration.life.routineHint` | Settings changed while the lab is running | NEW |
| `admin.configuration.life.setupHint` | Set once when the lab is installed | NEW |
| `admin.configuration.switchesOnly` | Module switches only | NEW |
| `admin.configuration.showing` | Showing {0} of {1} settings | NEW |
| `admin.configuration.showAll` | Show all | NEW |
| `admin.configuration.outsideView` | No {view} settings match "{text}". {count, plural, one {# {other} setting matches:} other {# {other} settings match:}} | NEW (ICU plural) |
| `admin.configuration.matchAll` | {count, plural, one {# setting matches "{text}" across all areas and lifecycles} other {# settings match "{text}" across all areas and lifecycles}} | NEW (ICU plural) |
| `admin.configuration.allSettings` | All {0} settings | NEW |
| `admin.configuration.wasFilter` | Was on {0} | NEW |
| `admin.configuration.ownPage` | Its own page | NEW |
| `admin.configuration.openPage` | Open {0} | NEW |
| `admin.configuration.tag.moduleSwitch` | Module switch | NEW |
| `admin.configuration.tag.serverFile` | Server file | NEW |
| `admin.configuration.confirm.title` | Confirm this change | NEW |
| `admin.configuration.timeZone` | Laboratory time zone | NEW |
| `admin.configuration.notifications.sendTest` | Send a test | NEW |
| `admin.configuration.notifications.testSent` | Test sent to {0}. Its result shows in Sent Messages. | NEW |
| `admin.configuration.noResults` | No settings match "{0}". | NEW |
| `admin.configuration.clearSearch` | Clear search | NEW |
| `admin.configuration.default` | Default | NEW |
| `admin.configuration.defaultIs` | Default: {0} | NEW |
| `admin.configuration.key` | Key | NEW |
| `admin.configuration.wasOn` | Was on {0} | NEW |
| `admin.configuration.dependsOn` | Turn on {0} to set these. | NEW |
| `admin.configuration.restart` | Saved. This takes effect after the server restarts. | NEW |
| `admin.configuration.serverFile` | Set in the server's properties file. Ask your server administrator to change it. | NEW |
| `admin.configuration.copyKey` | Copy key | NEW |
| `admin.configuration.settingNotFound` | That setting wasn't found. Showing all settings. | NEW |
| `admin.configuration.loadFailed` | Settings couldn't be loaded. | NEW |
| `admin.configuration.alsoHere` | These settings are also in Configuration, where you can search all settings. | NEW |
| `admin.configuration.openHere` | Open in Configuration | NEW |
| `admin.configuration.area.<id>` | the 13 area names in CF-2 | NEW (13) |
| `admin.configuration.area.<id>.description` | the 13 one-line area descriptions (Appendix B) | NEW (13) |
| `admin.configuration.block.<id>` | block titles (Appendix B) | NEW |
| `admin.configuration.setting.<key>.label` / `.description` / `.guidance` / `.marking` | per-setting content (N-1) | NEW, content |

### 15.3 Menu Configuration

| Key | English | Status |
|---|---|---|
| `admin.menuConfig.search` | Search menu entries | NEW |
| `admin.menuConfig.expandAll` | Expand all | NEW |
| `admin.menuConfig.collapseAll` | Collapse all | NEW |
| `admin.menuConfig.show.on` | On | NEW |
| `admin.menuConfig.show.off` | Off | NEW |
| `admin.menuConfig.groupCount` | {0} of {1} on | NEW |
| `admin.menuConfig.changed` | Changed | NEW |
| `admin.menuConfig.hiddenBy` | Hidden by {0} | NEW |
| `admin.menuConfig.changes` | {count, plural, one {# change} other {# changes}} | NEW (ICU plural) |
| `admin.menuConfig.matches` | {count, plural, one {# match} other {# matches}} | NEW (ICU plural) |
| `admin.menuConfig.show` | Show | NEW |
| `admin.menuConfig.show.all` | All | REUSE `common.all` |
| `admin.menuConfig.locked` | Switching this off would remove the way into Admin. | NEW |
| `admin.menuConfig.subtitle.main` | Switch main menu entries on or off. Changes are reviewed together before they are saved. | NEW |
| `admin.menuConfig.billing.subtitle` | Where the Billing entry in the main menu sends people. | NEW |
| `admin.menuConfig.billing.entry` | Billing entry | NEW |
| `admin.menuConfig.billing.invalid` | Enter a full address starting with http:// or https:// | NEW |
| `admin.menuConfig.billing.shown` | Billing shows in the main menu. | NEW |
| `admin.menuConfig.billing.hiddenNoAddress` | Billing is hidden from the main menu: no address is set. | NEW |
| `admin.menuConfig.billing.hiddenOff` | Billing is hidden from the main menu: the entry is off. | NEW |
| `admin.menuConfig.review` | Review and save | NEW |
| `admin.menuConfig.review.title` | {count, plural, one {Save # menu change?} other {Save # menu changes?}} | NEW (ICU plural) |
| `admin.menuConfig.review.on` | Turned on | NEW |
| `admin.menuConfig.review.off` | Turned off | NEW |
| `admin.menuConfig.saved` | {count, plural, one {Saved # menu change.} other {Saved # menu changes.}} Users see them the next time a page loads. | NEW (ICU plural) |
| `admin.menuConfig.billing.address` | Billing address | NEW |
| `admin.menuConfig.billing.help` | Billing appears in the main menu only when an address is set and the entry is on. | NEW |

### 15.4 Report Management

The keys in Patient Report FRS v2.4.1 §13.2 move here unchanged (`sidenav.label.admin.reportManagement`, `admin.reports.*`), with three changes: `admin.reports.save` and `admin.reports.cancel` are dropped for `common.save` and `common.cancel` (D-174); `admin.reports.lines.siteNameLink` reads "Edit in Configuration"; and three keys are added:

| Key | English | Status |
|---|---|---|
| `admin.reports.defaults.pageNumbers` | Page numbers on other reports | NEW |
| `admin.reports.defaults.pageNumbers.help` | For reports still managed in code. The patient report always numbers its pages. | NEW |
| `admin.reports.lines.additionalSiteInfo.help` | Put the phone number or email address for questions about results here. It prints on every report and is the lab contact in messages the lab sends. | NEW (RM-8) |

## 16. Out of Scope

- The main menu (Navigation Redesign FRS v0.1 keeps it).
- Designing Role Management (RBAC), NCE configuration, QI configuration and the analyzer screens; they must meet Part B when designed (O-11).
- Container Types (R-14), which Clinical Order Entry v4 owns.
- Creating or deleting settings; per-setting permissions; a view-only admin (D-006).
- Reordering, adding or renaming menu entries (MC-12).
- Changing what any page's records hold. A consistency pass changes presentation and behaviour only.
- A visual report designer (D-151).
- The content of the Notifications pages (Channels, Templates, Distribution Lists, Triggers) and of Sent Messages, which Result Delivery governs. This FRS places them and holds the admin pages to Part B.

## 17. Decisions

New decisions take **D-190 to D-202**. The Microbiology v2 drafts in `upload/` (`amr-micro-v2-amendments.md` and the patient report FRS's D-181) already use D-175 to D-182 without a ledger entry yet, so D-183 to D-189 are left for them; confirm against the log when `skill/consolidation-2026-10` merges.

**ID collision (2026-10-15).** The shared decision log already holds Microbiology decisions under D-190 to D-206, so D-190 to D-202 here (and Users and Roles D-203 to D-206) collide with ledger IDs. They are not renumbered in this version and will be renumbered in a later pass; until then cite them with the spec name, for example "Admin Redesign D-199".

| ID | Decision | Why | Scope | Changes |
|---|---|---|---|---|
| D-190 | The Admin sidebar has five section headings, Config, Organization, Resources, Automation, Compliance; every admin page keeps `/MasterListsPage/<editorKey>`; there are no bucket landing pages. IA v2.3's 11 buckets, Phase 5 Finalization's 12, and the `/admin/<bucket>/<page>` migration are withdrawn | The approved navigation redesign and the decision log already chose this; the other models were never built and moving every URL would break every manual page and bookmark for no user gain | GLOBAL | Reaffirms D-010, D-012; withdraws Finalization F1 to F4, F6, F8, F10, F11, F13 and F15; keeps F5 (as consistency passes), F7 in part (AF-10), F9 (§20), F12 (AS-36) and F14 (AF-16) |
| D-191 | The admin home is generated from the same definition as the sidebar, plus a search that also searches settings | A curated tile set drifted and misrouted | FEATURE | |
| D-192 | Admin breadcrumb is `Home / Admin Management / [group …] / Page`; groups without a route are plain text; section headings are never crumbs; "Admin" variants are defects | One shape instead of five | GLOBAL | Amends D-013 |
| D-193 | Every admin page is one of six types (Settings surface, Record list, Record editor, Operations tool, Structure editor, Monitor) and follows its rules plus the shared rules | New pages pick a type instead of inventing a layout | GLOBAL | Replaces Pattern Library v1.0 and the August archetypes |
| D-194 | In admin, a distinct view is a sidebar child with its own route; the same list narrowed is an in-page filter; no Tabs, ContentSwitchers, internal rails or navigation accordions | One navigation device per job | GLOBAL | Refines D-003 |
| D-195 | Admin editing: an Edit button opens the row in place, one at a time; Add opens a new row at the top; records with five or more sections open in a routed record editor; no create or edit modals; modals only for destructive or irreversible confirmation, the unsaved guard and in-use deactivation | 17 page specs edit inline and 10 in modals; the shipped reference pages (Locations & Organizations, Test Catalog) are inline or routed | GLOBAL | Amends D-005 (5+ sections go to the record editor, not a modal); makes D-111 active |
| D-196 | Deactivated records are reached through a Status filter (Active, Inactive, All), default Active, kept in the URL | Makes D-002's "show deactivated" affordance one concrete control, matching the shipped reference list | GLOBAL | Refines D-002 |
| D-197 | Admin saving: Save and Cancel in the open row or section, sticky; unsaved-changes guard; value read back; entries kept on failure; no page-level dirty bars; no autosave; structure editors save after a summary | A save that is not read back hid silent failures; page-level bars and autosave each appeared once and confused the rest | GLOBAL | |
| D-198 | One danger marking: red stripe plus a plain sentence, only for changes that lose data, lock people out or cannot be undone; saving needs the item's name typed | A marking on everything means nothing; category words do not say what will happen | GLOBAL | |
| D-199 | Configuration replaces the property tables, Site Information and Application Properties: Routine view by default with "n of N" and search across all; old pages merge one release later; server-file properties read-only until persisted; secrets never displayed | One place to find any setting, without claiming changes OpenELIS does not keep | FEATURE | Casey 2026-10-02 (Routine default, merge after one release); Result Delivery's lab-wide delivery settings join the Notifications area here instead of a page of their own (D-241, CF-5b) |
| D-200 | There is no Feature Flags page. Module switches are Configuration settings with a "Module switches only" filter; menu visibility stays in Menu Configuration | A second page for the same booleans would recreate two doors | FEATURE | Supersedes D-020; Casey 2026-10-02 |
| D-201 | Menu Configuration is one tree editor behind four sidebar children (Main, Billing, Non-Conform, Patient); Study Menu and MenuStatement are removed | Each scope is its own tree with its own save (D-003); one implementation instead of five | FEATURE | Casey 2026-10-02 |
| D-202 | Settings surfaces never page; record lists that can exceed 100 rows page on the server (25, 50, 100) and always say "n of N" | A page boundary hid a whole integration's switch; long catalogs still need paging | GLOBAL | |

Also: **D-111** and **D-112** move from provisional to active (applied across admin by AS-11 and AS-32). **D-104** is narrowed for admin lists by D-111 and D-195 (no row overflow menu). **D-068** is amended: the Compliance section holds the Sample Acceptance Checklist; the four non-conformity reporting switches are settings in Configuration. **D-075** keeps its read-only time zone, shown in Configuration (CF-5a). **D-156** keeps its decision; its placement becomes Config › Report Management. The design addendum's "Show deactivated toggle" and "modals for 5+ sections" lines must change in the same pull request that logs D-195 and D-196, or `/analyze` will flag every conforming page.

## 18. Open Questions

| # | Question | Recommendation |
|---|---|---|
| Q-1 | Do the 13 areas match where administrators look? | Run `admin-redesign-findability-test.html` with three or four administrators before the area assignment (N-1) is final. Where most agree with each other and not with Appendix B, Appendix B moves |
| Q-2 | Should Result Reporting become a list of configurable feeds (type B) instead of three fixed blocks? | Not in this programme; consistency pass only |
| Q-3 | How should server-file properties persist (N-4): a database override layer, or writing the file? | Engineering choice; until then read-only |
| Q-4 | Is `stuckAnalyzerEvents` the page the main menu reaches as Analyzers › Import Issues? | If yes, Merge (X-07); if not, place it in Automation |
| Q-5 | Does any report managed in code still read `reportPageNumbers`? | If none, drop RM-2a and retire the setting |
| Q-6 | When can Test Management (legacy) be hidden? | When Methods, Units of Measure and Result Select Lists have Test Catalog homes |
| Q-7 | `auto-fill collection date/time`: code default `true`, properties file and seed `false` | Settle in code before writing its guidance |
| Q-8 | Which of `labDirectorTitle`, `labDirectorName` and `lab director` holds the title, the given name and the surname (carried from the patient report FRS)? | Confirm in code before RM-8 is built |

## 19. Acceptance Criteria

### 19.1 Frame

- [ ] **AF-AC-1** The Admin sidebar shows Config, Organization, Resources, Automation and Compliance in that order with the entries of §3.1; no destination appears twice; Environmental Compliance Standards and the Notifications group (Channels, Templates, Distribution Lists, Triggers) open from the sidebar; Sent Messages does not appear in the Admin sidebar.
- [ ] **AF-AC-2** No two top-level entries share an icon; section headings and children carry none.
- [ ] **AF-AC-3** The admin home shows the same entries as the sidebar, in the same order. Typing "barcode" leaves the Label Presets tile and offers "Search settings for "barcode"", which opens Configuration with that search applied.
- [ ] **AF-AC-4** Every admin page's breadcrumb starts `Home / Admin Management`. Language Management, Translation Management, Site Branding, the Sample Acceptance pages, the three vector pages, Environmental Compliance Standards, Programs and Provider Titles follow AF-11 to AF-13.
- [ ] **AF-AC-5** Each route in §9.2 redirects to its target with query parameters kept and shows the moved notification.
- [ ] **AF-AC-6** A user without the Admin role sees no Administration entry and cannot open any admin route.

### 19.2 Standard (checked on Provider Titles after its consistency pass, and on any page claiming to conform)

- [ ] **AS-AC-1** The list opens with Status = Active; switching to Inactive shows only deactivated rows with the Inactive tag; the URL holds the status and search, and reopening the URL restores them.
- [ ] **AS-AC-2** Add opens a new, open row at the top; Cancel removes it; no modal appears when adding or editing.
- [ ] **AS-AC-3** Edit opens one row; pressing Edit on another row after changing a field asks "Discard changes?".
- [ ] **AS-AC-4** Save closes the row and shows the value read back; with the network blocked, Save keeps the entries and shows Retry.
- [ ] **AS-AC-5** Switching off a title used by providers shows the confirmation naming the count; switching off an unused title happens at once with Undo for 10 seconds.
- [ ] **AS-AC-6** History shows who changed the title, when, and the old and new value; no reason was asked.
- [ ] **AS-AC-7** With the keyboard only, a user can search, open a row, edit, save and reach History; focus returns to the Edit button on close.
- [ ] **AS-AC-8** No page in the admin renders a Carbon `Tabs` component.

### 19.3 Configuration

- [ ] **CF-AC-1** On the reference stack (CF-23a), the page opens on Routine and says "Showing 54 of 164 settings"; the Areas filter shows "n of N" per area; nothing pages.
- [ ] **CF-AC-2** In Routine, searching `configuration.dir` shows "No routine settings match 'configuration.dir'. 1 setup setting matches:" with that setting listed below it.
- [ ] **CF-AC-3** Searching "SAML" returns the SAML block with every member; searching "Modbus" returns the Freezer monitoring block with both ports.
- [ ] **CF-AC-4** Use external patient source is visible in the Integrations & exchange area in the Setup view with its address, username and password, without any paging.
- [ ] **CF-AC-5** Changing the 24-hour clock saves, closes the row and shows the value read back; reloading shows the same value.
- [ ] **CF-AC-6** Training installation shows a red stripe and its sentence while closed; saving it asks for "Training installation" to be typed and does nothing until it matches.
- [ ] **CF-AC-7** The service password row reads "Set" or "Not set"; the browser's network responses for the page contain no password value.
- [ ] **CF-AC-8** Every `org.openelisglobal.*` and `org.itech.*` key shows read-only with the server-file note and a working Copy key.
- [ ] **CF-AC-9** The banner heading edits as one input per active language; saving French does not change English.
- [ ] **CF-AC-10** Opening `?setting=configuration.dir` from the Routine default switches the view so the setting shows, opens and highlights it.
- [ ] **CF-AC-11** On the reference stack, Module switches only shows ten settings.
- [ ] **CF-AC-12** Saving the GPS block after changing only the timeout says "Saved 1 of 3 settings" and the audit trail records one change.
- [ ] **CF-AC-13** During the transition release each old settings page shows the cross-link notification; after the merge release each old route opens the matching Configuration area with the moved notification.
- [ ] **CF-AC-14** `configuration?area=notifications` shows the link row to the Notifications pages, the eight delivery settings with their defaults (wait 10 minutes, send partial reports on, retries after 1, 5, 15, 30 and 60 minutes, stop retrying after 24 hours, default SMS country code empty, public server address empty, secure links Off and disabled while the address is empty, link lifetime 30 days), Send a test, the sender address read-only with a link to Channels, and `org.openelisglobal.mail.bcc` as a read-only "Retired" row with no editor.

### 19.4 Menu Configuration

- [ ] **MC-AC-1** Main Menu shows section headings as headings and every group with "n of N on"; Removed and Merged rows are absent, Hidden rows present and off.
- [ ] **MC-AC-2** Searching "CSV" shows the matching entries with their parents and a match count.
- [ ] **MC-AC-3** Switching three entries shows "3 changes"; Review lists them by full path; Save sends one request; reloading shows the new state.
- [ ] **MC-AC-4** Leaving with pending changes asks to discard them.
- [ ] **MC-AC-5** With no billing address set, Billing does not appear in the main menu even when its switch is on.
- [ ] **MC-AC-6** `studyMenuManagement` and `MenuStatementConfigMenu` redirect to Main Menu.

### 19.5 Report Management

- [ ] **RM-AC-1** Report Management opens at `/MasterListsPage/reportManagement` from Config › Report Management; the old route redirects; the Printed Reports entry and page are gone.
- [ ] **RM-AC-2** Saving A4 makes the next Patient Status Report print on A4.
- [ ] **RM-AC-3** Replacing the left logo changes it on the next report; the thumbnail is square; a non-image file shows the uploader's invalid state and nothing changes.
- [ ] **RM-AC-4** The list follows the existing report configuration's names, categories and order; other rows show "Managed in code", have no Edit, and are hidden unless Show not configurable is on.
- [ ] **RM-AC-5** Each saved change writes an audit entry with user, time, old and new value.
- [ ] **RM-AC-6** A user without the Admin role does not see Report Management and cannot open its route.
- [ ] **RM-AC-7** Page strings come from translation keys; switching the UI to French shows no English.
- [ ] **RM-AC-8** (V2) A valid custom template (single or Letter / A4 pair) in the configuration folder appears in the selector; one with an unknown parameter appears "Not usable" with the parameter named.
- [ ] **RM-AC-9** (V2) Preview renders the sample order, opens a PDF and leaves the active template unchanged; Save stays disabled until a preview succeeds.
- [ ] **RM-AC-10** (V2) Revert shows the modal, restores the shipped template and leaves the custom file selectable.
- [ ] **RM-AC-11** (V2) After an upgrade, a shipped-default report uses the newer template; a custom-template report keeps it and shows the notice with Preview shipped template.
- [ ] **RM-AC-12** (V2) The page offers no way to upload a template.
- [ ] **RM-AC-13** (V2) History lists the last ten template changes with date, user, from and to.

## 20. Docs Impact

Shipping this changes published manual pages: the nine property-table pages, Application Properties, Printed Report Configuration, Menu Configuration (five pages), the admin dashboard, Language Management, Test Notification Configuration (retired by Result Delivery), Notification Triggers (its tabs become the Notifications pages and Sent Messages moves to the main menu), External Connections (the email and SMS connection types move to Channels), and every page whose sidebar label or breadcrumb changes. Each slice's Feature Doc child re-captures the affected pages at Acceptance with the `openelis-user-manual` skill and bumps their `capturedVersion` in `docs-manual/contracts.json`. The PNG MoH ICT training deck "S7 Ep6 Admin Configuration Essentials" uses the old sidebar and needs its screenshots re-taken.

## 21. What This Supersedes

| Document | Where | Now |
|---|---|---|
| Admin Pattern Library v1.0 (2026-04-20) | `designs/admin-config/admin-pattern-library.md`, `.html` | Archived; replaced by Part B |
| Admin Shell Design Brief v0.1 (2026-04-23) | `designs/admin-config/admin-shell.md`, `.html` | Archived; replaced by Part A |
| Admin Redesign MVP Scope v1.8 (2026-05-14) | `designs/admin-config/admin-mvp-scope.md` | Archived |
| Admin Redesign Phase 5 Roadmap (2026-04-23) | `designs/admin-config/admin-phase5-roadmap.md` | Archived |
| Admin Redesign Phase 5 Finalization v2.0 (2026-08-25) | `designs/admin-config/admin-phase5-finalization.md`, `.html` | Archived; its defect list is refreshed in §10 |
| Admin MVP previews (2026-06-12): Application Properties, Feature Flags, Menu Configuration, Site Information, Order & Patient Entry, Validation Rules, Workplan, Test Notification | `designs/admin-config/*.html` | Archived |
| Organizations Management (2026-03) | `designs/admin-config/organizations-management.md`, `.jsx` | Archived; superseded by Locations & Organizations |
| IA v2.3 and the Phase 0 roadmap and Pattern Audit (April 2026) | `OpenELIS Feature Design/admin-menu-redesign-roadmap.md`, `.xlsx`, `admin-patterns-audit.md` | Archived |
| Admin Unified Design Vision v1.1, Admin MVP v1.0 and its adversarial review, Lab Configuration design brief, V2 plan, FRS v2.0 and both previews, full-admin preview (2026-08-25 to 27) | `upload/` (held, never registered) | Archived; Configuration (§11) carries their surviving requirements |
| Admin area findability test (2026-08-27) | `upload/admin-area-findability-test.html` | Kept as `admin-redesign-findability-test.html`, updated to the area names in CF-2 (Q-1) |
| Navigation Redesign FRS v0.1, FR-22 to FR-26 and Appendix A.3 / A.4 | `designs/system/navigation-redesign.md` | Admin sidebar parts superseded by Part A; main-menu parts stand |
| Patient Report & Report Management FRS v2.4.1, Part B | `designs/reports/patient-report-redesign.md` | Moved here as §13; Part B replaced by a pointer |

---

## Appendix A: Differences from Navigation Redesign Appendix A.3

| A.3 says | This FRS | Why |
|---|---|---|
| Config › Workflow Settings holds six pages including Printed Reports | Configuration added first; Report Management top-level; Workflow Settings transitional, then removed | D-199, D-156 |
| Config › Barcode Configuration added as an orphan | Not added | The route already redirects to Label Presets (OGC-285) |
| Organization › Organizations | Organization › Locations & Organizations with four children | OGC-1363 merged 2026-10-01 |
| Resources › Vector Surveillance › Sampling Sites | Removed from Vector | Moved to Locations & Organizations (D-106) |
| Resources › Microbiology Reference › Culture Setups, Breakpoints | Culture Methods, Breakpoint Standards | Shipped labels on `develop`; culture setups retired (D-113) |
| Resources › Environmental Compliance Standards (one entry) | A group with Standards and Test Thresholds | Replaces the page's tabs (AS-4) |
| Automation › Notification Triggers (one entry); Test Notifications | Automation › Notifications, a group with Channels, Templates, Distribution Lists, Triggers; Test Notifications transitional, then removed; Sent Messages moves to the main menu (Reports) | Replaces the page's tabs (AS-4) and merges both notification entries (Result Delivery v0.2, D-232) |
| Compliance › Non-Conformity Reasons (`NonConformityConfigurationMenu`) | Workflow Settings › Non-Conformity, then removed in favour of Configuration | The page holds four switches about where non-conformities are reported, not a list of reasons |
| Config › Application Properties, Organization › Site Information kept | Transitional, then removed in favour of Configuration | D-199 |
| (absent) Stuck analyzer events | Merged into the main menu's Import Issues, if the same page | D-069, Q-4 |

---

## Appendix B: Configuration Settings Register (draft)

The draft area, lifecycle, block and marking for every setting on `develop` 313490dc, seeded from the August curation of 59 settings on v3.2.2.0 and completed for the rest. It is the starting point for N-1, not final content: the findability test (Q-1) and the guidance authoring pass may move settings. "Today on" names the page that edits the setting now. Labels are proposed English for `admin.configuration.setting.<key>.label`.

| Area (`id`) | Description | Settings | Routine |
|---|---|---:|---:|
| Lab identity (`identity`) | What this lab is called and the identifiers it carries | 9 | 1 |
| Language & display (`lang`) | Languages, date and time formats, interface wording | 5 | 4 |
| Patients (`patients`) | The patient record: which fields appear, which are required, what may be typed | 22 | 7 |
| Orders & samples (`orders`) | How an order is placed and a sample received | 26 | 24 |
| Results & validation (`results`) | Result entry and how results are released | 25 | 15 |
| Workplans (`workplan`) | What prints on a workplan | 3 | 3 |
| Labels & barcodes (`labels`) | Barcode symbology and label prefixes | 2 | 0 |
| Notifications (`notifications`) | How reports and messages are sent: wait before sending, partial reports, retries and how long to keep trying, SMS country code, secure link address | 8 | 2 |
| Integrations & exchange (`integ`) | Connections to outside systems | 41 | 0 |
| Storage & devices (`storage`) | Freezers and monitoring hardware | 7 | 0 |
| Security & access (`security`) | How people sign in and what they may see | 7 | 0 |
| Menus & help (`menus`) | Menu auto-creation and help links | 4 | 0 |
| System & server (`system`) | Server-level settings, page sizes and maintenance | 9 | 0 |
| **Total** | | **168** | **56** |

Marked settings: 13. Module switches: 10. Blocks: 35.

Counts are for `develop` 313490dc except the Notifications row, which shows the area after Result Delivery v0.3: its four server-file keys leave (the sender address and both SMS keys are owned by Channels; the blind copy is retired) and eight new `site_information` settings arrive (CF-5b, N-17). So the total is 168 with 56 routine, and the blocks go from 36 to 37 (Email sending and SMS sending go; Automatic sending, Sending and retries, and Secure links are new), and the server-file keys shown here fall from 61 to 57. The `develop` counts used elsewhere in this FRS (164 settings, 54 routine: CF-9, CF-41, CF-AC-1) hold until Result Delivery's settings ship.

#### Lab identity

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `org.openelisglobal.facility.city` | City | Application Properties | text | Setup | Lab location for exchange | Server file (CF-33) |
| `org.openelisglobal.facility.country` | Country | Application Properties | text | Setup | Lab location for exchange | Server file (CF-33) |
| `org.openelisglobal.facility.district` | District | Application Properties | text | Setup | Lab location for exchange | Server file (CF-33) |
| `org.openelisglobal.facility.id` | Facility identifier | Application Properties | text | Setup | Lab location for exchange | Server file (CF-33) |
| `org.openelisglobal.facility.postalcode` | Postal code | Application Properties | text | Setup | Lab location for exchange | Server file (CF-33) |
| `org.openelisglobal.facility.state` | State or province | Application Properties | text | Setup | Lab location for exchange | Server file (CF-33) |
| `bannerHeading` | Banner heading | Site Information | text (per language) | Routine |  |  |
| `SiteName` | Laboratory name | Printed Report | text | Setup |  |  |
| `siteNumber` | Site number | Site Information | text | Setup |  |  |

#### Language & display

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `24 hour clock` | 24-hour clock | Site Information | boolean | Routine | Language & date defaults |  |
| `allowLanguageChange` | Allow language change at login | Site Information | boolean | Routine | Language & date defaults |  |
| `default date locale` | Default date format | Site Information | choice | Routine | Language & date defaults |  |
| `default language locale` | Default language | Site Information | choice | Routine | Language & date defaults |  |
| `overrideDefaultTranslation` | Use translation files on the server | Site Information | boolean | Setup |  |  |

#### Patients

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `Address line 1 label` | Address line 1 | Site Information | text | Setup | Address & geographic labels |  |
| `Address line 2 label` | Address line 2 | Site Information | text | Setup | Address & geographic labels |  |
| `Address line 3 label` | Address line 3 | Site Information | text | Setup | Address & geographic labels |  |
| `Geographic Unit 1 Label` | Geographic unit 1 | Site Information | text | Setup | Address & geographic labels |  |
| `Geographic Unit 2 Label` | Geographic unit 2 | Site Information | text | Setup | Address & geographic labels |  |
| `useNewAddressHierarchy` | Use the configurable address hierarchy | Patient Entry | boolean | Setup | Address & geographic labels |  |
| `Allow duplicate national ids` | Allow duplicate national IDs | Patient Entry | boolean | Setup | Duplicate identifiers |  |
| `Allow duplicate subject number` | Allow duplicate subject numbers | Patient Entry | boolean | Setup | Duplicate identifiers |  |
| `firstNameCharset` | First name | Validation | text | Setup | Name & identifier character rules | **Marked:** Narrowing a rule can stop existing records being saved |
| `lastNameCharset` | Last name | Validation | text | Setup | Name & identifier character rules | **Marked:** Narrowing a rule can stop existing records being saved |
| `patientIdCharset` | Patient identifier | Validation | text | Setup | Name & identifier character rules | **Marked:** Narrowing a rule can stop existing records being saved |
| `userNameCharset` | Username | Validation | text | Setup | Name & identifier character rules | **Marked:** Narrowing a rule can stop existing records being saved |
| `default nationality` | Default nationality | Patient Entry | text | Setup | Nationality |  |
| `supportPatientNationality` | Record nationality | Patient Entry | boolean | Setup | Nationality | Block switch (CF-17) |
| `validate phone format` | Enforce phone number format | Site Information | boolean | Routine | Phone number format |  |
| `phone format` | Phone number format | Site Information | text | Routine | Phone number format |  |
| `Patient age required` | Date of birth required | Order Entry | boolean | Routine | Required patient fields |  |
| `National ID required` | National ID required | Patient Entry | boolean | Routine | Required patient fields |  |
| `Patient ID required` | Patient ID required | Patient Entry | boolean | Routine | Required patient fields |  |
| `Patient sex required` | Sex required | Order Entry | boolean | Routine | Required patient fields |  |
| `Subject number required` | Subject number required | Patient Entry | boolean | Routine | Required patient fields |  |
| `patientGpsCaptureEnabled` | Capture GPS at patient registration | Patient Entry | boolean | Setup |  |  |

#### Orders & samples

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `billingRefNumberLocalization` | Billing reference label | Order Entry | text (per language) | Routine | Billing reference number |  |
| `billingRefNumber` | Billing reference number | Order Entry | boolean | Routine | Billing reference number | Block switch (CF-17) |
| `restrictFreeTextRequestorEntry` | Environmental and vector requestors | Order Entry | boolean | Routine | Free-text entry at order entry |  |
| `restrictFreeTextProviderEntry` | Providers | Order Entry | boolean | Routine | Free-text entry at order entry |  |
| `restrictFreeTextRefSiteEntry` | Referring sites | Order Entry | boolean | Routine | Free-text entry at order entry |  |
| `restrictFreeTextSampSiteEntry` | Sampling sites | Order Entry | boolean | Routine | Free-text entry at order entry |  |
| `gpsCoordinatesEnabled` | Capture GPS coordinates | Order Entry | boolean | Routine | GPS capture at collection | Block switch (CF-17) |
| `gpsRequiredAccuracyMeters` | Required accuracy (metres) | Order Entry | number | Routine | GPS capture at collection |  |
| `gpsTimeoutSeconds` | Timeout (seconds) | Order Entry | number | Routine | GPS capture at collection |  |
| `sampleAcceptCheck.clinical` | Clinical | Order Entry | choice: MANDATORY, OPTIONAL, OFF | Routine | Sample acceptance enforcement |  |
| `sampleAcceptCheck.environmental` | Environmental | Order Entry | choice: MANDATORY, OPTIONAL, OFF | Routine | Sample acceptance enforcement |  |
| `sampleAcceptCheck.vector` | Vector | Order Entry | choice: MANDATORY, OPTIONAL, OFF | Routine | Sample acceptance enforcement |  |
| `Collection as unit` | At collection | NonConformity | boolean | Routine | Where non-conformities are reported |  |
| `Reception as unit` | At reception | NonConformity | boolean | Routine | Where non-conformities are reported |  |
| `sample id required` | Require the requester's sample ID | NonConformity | boolean | Routine | Where non-conformities are reported |  |
| `sortQaEvents` | Sort non-conformity reasons alphabetically | NonConformity | boolean | Routine | Where non-conformities are reported |  |
| `Accession number prefix` | Accession number prefix | Site Information | text | Setup |  | **Marked:** Cannot be changed once any sample has been registered |
| `contactTracingEnabled` | Contact tracing fields | Order Entry | boolean | Routine |  | Module switch |
| `referralStuckThresholdDays` | Days before a referral is flagged as stuck | Site Information | number | Routine |  |  |
| `eqaEnabled` | EQA samples | Order Entry | boolean | Routine |  | Module switch |
| `auto-fill collection date/time` | Fill collection date and time at registration | Order Entry | boolean | Routine |  |  |
| `Program` | Program on orders | Order Entry | boolean | Setup |  |  |
| `consentRequiredForCollection` | Require consent before collection | Site Information | boolean | Routine |  |  |
| `requesterRequired` | Require requesting provider | Order Entry | boolean | Routine |  |  |
| `trackPayment` | Track patient payment | Order Entry | boolean | Routine |  |  |
| `validateAccessionNumber` | Validate accession number format | Order Entry | boolean | Routine |  |  |

#### Results & validation

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `modify results note required` | Require a note when a result is changed | Result Entry | boolean | Routine | Changing released results |  |
| `modify results role` | Require a separate role to change results | Result Entry | boolean | Routine | Changing released results |  |
| `esigSessionTimeoutMinutes` | E-signature session timeout (minutes) | Site Information | number | Setup | Electronic signatures |  |
| `electronicSignatureEnabled` | Require electronic signatures | Site Information | boolean | Setup | Electronic signatures | Block switch (CF-17); Module switch |
| `pathology.stage.COVERSLIPPING.enabled` | Coverslipping & QC | Result Entry | boolean | Setup | Pathology workflow stages |  |
| `pathology.stage.DECALCIFICATION.enabled` | Decalcification | Result Entry | boolean | Setup | Pathology workflow stages |  |
| `pathology.stage.EMBEDDING.enabled` | Embedding | Result Entry | boolean | Setup | Pathology workflow stages |  |
| `pathology.stage.MICROTOMY.enabled` | Microtomy | Result Entry | boolean | Setup | Pathology workflow stages |  |
| `pathology.stage.PROCESSING.enabled` | Processing | Result Entry | boolean | Setup | Pathology workflow stages |  |
| `pathology.stage.STAINING.enabled` | Staining | Result Entry | boolean | Setup | Pathology workflow stages |  |
| `pathology.stage.UNDER_REVIEW.enabled` | Under pathologist review | Result Entry | boolean | Setup | Pathology workflow stages |  |
| `autoFillTechNameUser` | Fill technician name from the signed-in user | Result Entry | boolean | Routine | Technician name on results |  |
| `autoFillTechNameBox` | Offer a technician name box | Result Entry | boolean | Routine | Technician name on results |  |
| `ResultTechnicianName` | Require technician name on results | Result Entry | boolean | Routine | Technician name on results |  |
| `alertWhenInvalidResult` | Alert on a result outside the valid range | Result Entry | boolean | Routine |  |  |
| `allowBulkReleaseClear` | Allow releasing all clear results at once | Result Entry | boolean | Routine |  |  |
| `allowResultRejection` | Allow technicians to reject a test | Result Entry | boolean | Routine |  |  |
| `qcFailBlocksValidation` | Block release of results with an open QC failure | Result Entry | boolean | Routine |  |  |
| `customCriticalMessage` | Critical result message | Result Entry | text | Routine |  |  |
| `retestNoteRequired` | Require a note when sending a result for retest | Result Entry | boolean | Routine |  |  |
| `validateTechnicalRejection` | Send technical rejections to validation | Result Entry | boolean | Routine |  |  |
| `showValidationFailureIcon` | Show the failed-validation icon | Result Entry | boolean | Routine |  |  |
| `restrictFreeTextMethodEntry` | Stop new methods being typed at result entry | Result Entry | boolean | Routine |  |  |
| `resultsEntryUnifiedRoute` | Unified Results Entry worklist | Result Entry | boolean | Setup |  | Module switch |
| `validate all results` | Validate every result, including normal ones | Result Entry | boolean | Routine |  |  |

#### Workplans

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `next visit on workplan` | Next visit date | Workplan | boolean | Routine | Workplan print options |  |
| `results on workplan` | Space for handwritten results | Workplan | boolean | Routine | Workplan print options |  |
| `subject on workplan` | Subject number instead of name | Workplan | boolean | Routine | Workplan print options |  |

#### Labels & barcodes

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `BarCodeType` | Barcode symbology | Site Information | choice: BARCODE, QR | Setup |  |  |
| `boxLabelPrefix` | Shipping box label prefix | Site Information | text | Setup |  |  |

#### Notifications

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `deliveryHoldMinutes` | Wait before sending a new report version (minutes) | New (Result Delivery) | number, default 10 | Routine | Automatic sending |  |
| `deliverySendPartials` | Send partial reports automatically | New (Result Delivery) | boolean, default on | Routine | Automatic sending |  |
| `deliveryRetryMinutes` | Retry after (minutes) | New (Result Delivery) | number list, default 1, 5, 15, 30, 60 | Setup | Sending and retries | After the last delay, every hour until `deliveryGiveUpHours` |
| `deliveryGiveUpHours` | Stop retrying after (hours) | New (Result Delivery) | number, default 24 | Setup | Sending and retries | A message still not sent this long after it was queued is marked Failed (Result Delivery FR-A8) |
| `deliveryDefaultCountryCode` | Default SMS country code | New (Result Delivery) | text | Setup | Sending and retries |  |
| `publicServerAddress` | Public server address | New (Result Delivery) | text (URL) | Setup | Secure links | Needed for secure links, receipt confirmations and escalation; empty means all are off (most labs) |
| `deliverySecureLinks` | Secure links | New (Result Delivery) | choice: Off, Link as well as the attachment, Link instead of the attachment; default Off | Setup | Secure links | Available only when the public server address is set |
| `deliverySecureLinkDays` | Link lifetime (days) | New (Result Delivery) | number, default 30 | Setup | Secure links |  |

Moved out of this area by Result Delivery (CF-5b): `org.openelisglobal.mail.from` (sender address) is owned by Notifications › Channels and shows here as a read-only row with a link (AS-20); `org.openelisglobal.notification.bmp.provider` and `org.openelisglobal.notification.twilio.from` are edited on the SMS channel in Channels (Twilio stays a gateway choice beside TextIt); `org.openelisglobal.mail.bcc` is retired and shows for one release as a read-only "Retired" row (not counted). **Send a test** sits at the end of the area as an action, not a setting.

#### Integrations & exchange

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `org.openelisglobal.crserver.uri` | Client registry address | Application Properties | text | Setup | Client registry server | Server file (CF-33) |
| `org.openelisglobal.crserver.username` | Client registry username | Application Properties | text | Setup | Client registry server | Server file (CF-33) |
| `org.openelisglobal.requester.firstName` | Default requester given name | Application Properties | text | Setup | Default requester for FHIR orders | Server file (CF-33) |
| `org.openelisglobal.requester.identifier` | Default requester identifier | Application Properties | text | Setup | Default requester for FHIR orders | Server file (CF-33) |
| `org.openelisglobal.requester.phone` | Default requester phone | Application Properties | text | Setup | Default requester for FHIR orders | Server file (CF-33) |
| `org.openelisglobal.requester.lastName` | Default requester surname | Application Properties | text | Setup | Default requester for FHIR orders | Server file (CF-33) |
| `patientSearchURL` | Service address | Site Information | text (URL) | Setup | External patient source |  |
| `patientSearchPassword` | Service password | Site Information | secret | Setup | External patient source | Secret (CF-31) |
| `patientSearchLogOnUser` | Service username | Site Information | text | Setup | External patient source |  |
| `useExternalPatientSource` | Use external patient source | Site Information | boolean | Setup | External patient source | Block switch (CF-17); Module switch |
| `fhirContainerTypeDisplay` | Container type display name | Site Information | text | Setup | FHIR specimen container code |  |
| `fhirContainerTypeCode` | Container type SNOMED CT code | Site Information | text | Setup | FHIR specimen container code |  |
| `org.openelisglobal.fhirstore.uri` | FHIR store address | Application Properties | text | Setup | FHIR store | Server file (CF-33) |
| `org.openelisglobal.fhirstore.username` | FHIR store username | Application Properties | text | Setup | FHIR store | Server file (CF-33) |
| `org.openelisglobal.fhir.subscriber.allowHTTP` | Allow plain HTTP subscribers | Application Properties | text | Setup | FHIR subscription | Server file (CF-33) |
| `org.openelisglobal.fhir.subscriber.resources` | Resources sent to subscribers | Application Properties | text | Setup | FHIR subscription | Server file (CF-33) |
| `org.openelisglobal.fhir.subscriber` | Subscriber address | Application Properties | text | Setup | FHIR subscription | Server file (CF-33) |
| `org.openelisglobal.fhir.subscriber.backup.interval` | Subscriber backup interval | Application Properties | text | Setup | FHIR subscription | Server file (CF-33) |
| `org.openelisglobal.fhir.transformOnStartup` | Transform records to FHIR at startup | Application Properties | text | Setup | FHIR subscription | Server file (CF-33) |
| `org.openelisglobal.facilitylist.fhirstore` | Facility registry address | Application Properties | text | Setup | Facility registry | Server file (CF-33) |
| `org.openelisglobal.facilitylist.auth` | Facility registry authentication | Application Properties | text | Setup | Facility registry | Server file (CF-33) |
| `org.openelisglobal.facilitylist.authurl` | Facility registry sign-in address | Application Properties | text | Setup | Facility registry | Server file (CF-33) |
| `org.openelisglobal.facilitylist.username` | Facility registry username | Application Properties | text | Setup | Facility registry | Server file (CF-33) |
| `org.openelisglobal.ocl.import.default.testsection` | Default lab unit for OCL imports | Application Properties | text | Setup | OCL import defaults | Server file (CF-33) |
| `org.openelisglobal.ocl.import.default.sampletype` | Default sample type for OCL imports | Application Properties | text | Setup | OCL import defaults | Server file (CF-33) |
| `org.openelisglobal.odoo.baseUrl` | Odoo address | Application Properties | text | Setup | Odoo billing | Server file (CF-33) |
| `org.openelisglobal.odoo.enabled` | Odoo billing | Application Properties | text | Setup | Odoo billing | Block switch (CF-17); Module switch; Server file (CF-33) |
| `org.openelisglobal.odoo.database` | Odoo database | Application Properties | text | Setup | Odoo billing | Server file (CF-33) |
| `org.openelisglobal.odoo.username` | Odoo username | Application Properties | text | Setup | Odoo billing | Server file (CF-33) |
| `org.openelisglobal.odoo.map.testname.locale` | Test name language sent to Odoo | Application Properties | text | Setup | Odoo billing | Server file (CF-33) |
| `org.openelisglobal.providerlist.fhirstore` | Provider registry address | Application Properties | text | Setup | Provider registry | Server file (CF-33) |
| `org.openelisglobal.providerlist.poll.frequency` | Provider registry polling interval (ms) | Application Properties | text | Setup | Provider registry | Server file (CF-33) |
| `org.openelisglobal.remote.poll.frequency` | Polling interval (ms) | Application Properties | text | Setup | Remote order source | Server file (CF-33) |
| `org.openelisglobal.remote.source.uri` | Remote order source address | Application Properties | text | Setup | Remote order source | Server file (CF-33) |
| `org.openelisglobal.remote.source.identifier` | Remote source identifier | Application Properties | text | Setup | Remote order source | Server file (CF-33) |
| `org.openelisglobal.remote.source.updateStatus` | Send status updates to the source | Application Properties | text | Setup | Remote order source | Server file (CF-33) |
| `external orders` | Accept electronic orders from other sites | Order Entry | boolean | Setup |  | Module switch |
| `enableClientRegistry` | Enable client registry search | Site Information | boolean | Setup |  | Module switch |
| `org.openelisglobal.task.useBasedOn` | Link tasks to their orders (basedOn) | Application Properties | text | Setup |  | Server file (CF-33) |
| `fhirNonConformityCodes` | Non-conformity SNOMED CT codes | Site Information | text (JSON) | Setup |  |  |
| `siteOrganizationFhirUuid` | This lab's FHIR Organization ID | Site Information | text | Setup |  |  |

#### Storage & devices

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `freezer.bacnet.udp.port` | BACnet UDP port | Site Information | number | Setup | Freezer monitoring |  |
| `freezer.monitoring.enabled` | Freezer monitoring | Site Information | boolean | Setup | Freezer monitoring | Block switch (CF-17); Module switch |
| `freezer.modbus.tcp.port` | Modbus TCP port | Site Information | number | Setup | Freezer monitoring |  |
| `freezer.modbus.timeout.ms` | Modbus timeout (ms) | Site Information | number | Setup | Freezer monitoring |  |
| `org.openelisglobal.freezermonitoring.modbus.initial-delay` | Delay before first poll | Application Properties | text | Setup | Freezer monitoring schedule | Server file (CF-33) |
| `org.openelisglobal.freezermonitoring.modbus.poll-interval` | Polling interval | Application Properties | text | Setup | Freezer monitoring schedule | Server file (CF-33) |
| `org.openelisglobal.freezermonitoring.retention-cron` | Reading clean-up schedule | Application Properties | text | Setup | Freezer monitoring schedule | Server file (CF-33) |

#### Security & access

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `org.itech.login.saml.entityId` | Entity identifier | Application Properties | text | Setup | SAML single sign-on | **Marked:** A wrong value can stop everyone signing in; Server file (CF-33) |
| `org.itech.login.saml.metadatalocation` | Identity provider metadata address | Application Properties | text | Setup | SAML single sign-on | **Marked:** A wrong value can stop everyone signing in; Server file (CF-33) |
| `org.itech.login.saml.registrationId` | Registration name | Application Properties | text | Setup | SAML single sign-on | **Marked:** A wrong value can stop everyone signing in; Server file (CF-33) |
| `org.itech.login.saml` | SAML sign-on | Application Properties | text | Setup | SAML single sign-on | **Marked:** A wrong value can stop everyone signing in; Block switch (CF-17); Module switch; Server file (CF-33) |
| `org.itech.login.saml.loginpage` | Show on the sign-in page | Application Properties | text | Setup | SAML single sign-on | **Marked:** A wrong value can stop everyone signing in; Server file (CF-33) |
| `requireLabUnitAtLogin` | Require lab unit at login | Site Information | boolean | Setup |  | **Marked:** Can lock people out of OpenELIS or of work they can reach today |
| `roleForPatientOnResults` | Restrict patient details on results by role | Result Entry | boolean | Setup |  |  |

#### Menus & help

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `org.openelisglobal.help.release-notes.url` | Release notes link | Application Properties | text | Setup | Help links | Server file (CF-33) |
| `org.openelisglobal.help.tutorials.url` | Tutorials link | Application Properties | text | Setup | Help links | Server file (CF-33) |
| `org.openelisglobal.help.manual.url` | User manual link | Application Properties | text | Setup | Help links | Server file (CF-33) |
| `org.openelisglobal.menu.configuration.autocreate` | Create menu entries from configuration files | Application Properties | text | Setup |  | Server file (CF-33) |

#### System & server

| Key | Label | Today on | Type | Life | Block | Marking / note |
|---|---|---|---|---|---|---|
| `org.openelisglobal.paging.displaylist.pageSize` | Display list rows per page | Application Properties | text | Setup | List page sizes | Server file (CF-33) |
| `org.openelisglobal.paging.orderprograms.pageSize` | Order programs per page | Application Properties | text | Setup | List page sizes | Server file (CF-33) |
| `org.openelisglobal.paging.patients.pageSize` | Patients per page | Application Properties | text | Setup | List page sizes | Server file (CF-33) |
| `org.openelisglobal.paging.results.pageSize` | Results per page | Application Properties | text | Setup | List page sizes | Server file (CF-33) |
| `org.openelisglobal.paging.validation.pageSize` | Validation rows per page | Application Properties | text | Setup | List page sizes | Server file (CF-33) |
| `org.openelisglobal.configuration.dir` | Configuration folder | Application Properties | text | Setup |  | **Marked:** A wrong path can stop the server starting; Server file (CF-33) |
| `org.openelisglobal.program.autocreate` | Create programs from configuration files | Application Properties | text | Setup |  | Server file (CF-33) |
| `org.openelisglobal.configuration.autocreate` | Load configuration files at startup | Application Properties | text | Setup |  | Server file (CF-33) |
| `TrainingInstallation` | Training installation | Site Information | boolean | Setup |  | **Marked:** Can permanently delete every patient and sample record |
