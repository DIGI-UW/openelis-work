# Clinical Order Entry v4: Functional Requirements Specification

| | |
|---|---|
| **Version** | v0.8 (ready for /breakdown: delta /analyze of v0.7 applied) |
| **Date** | 2026-09-25 |
| **Author** | Casey (Director of Product), drafted with Claude |
| **Status** | Draft for handoff. Full /analyze on v0.4 (35 findings) and delta /analyze on v0.7 (25 findings) applied |
| **Domain** | Clinical order entry. Environmental and vector adopt the shared parts (section L; `env-vector-order-entry-alignment.md`) |
| **Preview** | `clinical-order-entry-v4-preview.html` |
| **Research** | `order-entry-v4-research-brief.md` |
| **Absorbs** | External Lab IDs and Upstream Results handoff (order entry surface); Order Entry QA handoff 2026-09-25 (R-NET, R-DATA, R-TIME, R-FLOW, R-UX); open order entry Jira tickets (Appendix B) |

---

## Lab Context

### Current State

A patient arrives at the laboratory reception desk with a paper request form, or a courier arrives with a cool box of tubes collected at a health centre. The reception clerk types the patient, the requesting facility, the clinician and the requested tests into OpenELIS. The clerk then records each tube. Examples include a lavender-capped EDTA tube for a blood count (EDTA is ethylenediaminetetraacetic acid, an anticoagulant) and a gold-capped serum separator tube (SST) for chemistry. A culture swab also needs a note of where it was taken from. Each tube gets a barcode label, goes into a rack or fridge, and may be sent on to a reference laboratory. In OpenELIS today this is spread over four screens, and a busy central laboratory goes through them several hundred times a day.

### Pain

- **Work is lost or half-saved.** The four screens save separately, and one screen saves each tube's storage one request at a time. When the network drops mid-way, some tubes are stored and others are not, with no warning. On slow links a save that succeeded can be reported as failed, and the retry then fails with "lab number already in use".
- **Tubes and tests are not connected.** The system does not know a blood count needs an EDTA tube. It cannot suggest the tubes to expect, cannot stop a test being put on the wrong tube, and nobody can see at a glance whether every requested test has a tube.
- **Required details are missing or hidden.** Collection time is taken from the browser and receipt time from the server, so in Port Moresby samples are recorded as collected 14 hours after they arrived. The swab site is never captured. The label buttons on two of the screens do nothing.
- **Duplicates are easy to create.** A clerk can register a new patient without searching first, and an offline search shows "no results", which invites exactly that.

### What Changes

Reception works through one page in the order of the paper form: order, patient, requester, request details, then the tests. If the tubes arrived with the request, OpenELIS proposes which tubes to expect, and the clerk corrects that to what actually arrived. A second page, Prepare Samples, is used when someone else collects, splits or sorts the tubes. A table of the ordered tests always shows which tube each test is on, and which tests are still waiting for one. Every tube row shows its collection time, collector, body site and storage, and a Labels section right below lists the labels for every tube. Printing, referring, reporting a problem and removing are each one click. Each Save stores everything on the page or nothing, and the user never loses what they typed.

---

## Overview

This feature reworks clinical Add Order into **Enter Order** and **Prepare Samples**, plus an optional **Sample check** step. It introduces **Container Types** and **Body Sites** to the test catalog, so each test declares the containers it expects and swab samples carry a coded site and side. It also establishes three shared pieces, used on both steps and adopted later by environmental and vector order entry:

- an **ordered tests table**
- a **samples table**
- an **order summary strip**

Every save is one all-or-nothing transaction. Every existing order entry setting is preserved (section M).

It also reinstates the two-list test and panel chooser from the Sample Collection Redesign, built for catalogs of several thousand tests. It adds the provider title to the inline new-provider form, and makes patient, facility and provider creation search-first. Finally, it absorbs the order entry parts of the External Lab IDs and Upstream Results design.

### Design principles

1. **One job, one component.** The ordered tests table, the samples table and the summary strip are each single shared components.
2. **Required data is on the row, never behind an expand.** Expansion holds optional detail only.
3. **Test-first reconciliation.** The user can always see which tests were ordered and which tube, if any, each one is on.
4. **Everyday actions are one click, on a visible target.** Print, refer out, report non-conformity and remove are row icons and toolbar buttons, for one sample or many.
5. **Propose, show why, never overwrite.** Tube proposals and assignments carry a reason and never overwrite a value the user changed.
6. **Warn, do not wall.** A mismatch can proceed with a recorded deviation (ISO 15189:2022 clause 7.2.6.2).
7. **Every save is whole.** One Save is one server transaction; on failure nothing is stored and everything stays on screen.
8. **Search before create.** Patient, facility and provider are found first; creating is offered after a successful search, prefilled from it.
9. **Nothing configured is dropped.** Every existing setting keeps its effect (section M).

### Navigation & URL

| Page | SideNav | Breadcrumb | Route |
|---|---|---|---|
| Order dashboard | Orders & Patients → Add Clinical Order | `Home / Orders / Clinical Orders` | `/order/clinical` |
| 1. Enter Order | (step within the order) | `Home / Orders / Clinical Orders / Enter Order` | `/order/clinical/enter` |
| 2. Prepare Samples | (step within the order) | `Home / Orders / Clinical Orders / Prepare Samples` | `/order/clinical/collect` |
| 3. Sample check (optional) | (step within the order) | `Home / Orders / Clinical Orders / Sample check` | `/order/clinical/qa` |
| Container Types | Admin → Config → Test Catalog → Container Types, after Sample Types | `Home / Admin Management / Test Catalog / Container Types` | `/admin/TestCatalogList?entity=containertypes` |
| Body Sites | Admin → Config → Test Catalog → Body Sites, after Container Types | `Home / Admin Management / Test Catalog / Body Sites` | `/admin/TestCatalogList?entity=bodysites` |
| Test editor, Containers and Body site sections | Admin → Config → Test Catalog → Tests | `Home / Admin Management / Test Catalog / Tests / <test>` | existing `/MasterListsPage/TestCatalogEditor/*` |
| Sample Type settings | Admin → Config → Test Catalog → Sample Types | `Home / Admin Management / Test Catalog / Sample Types / <type>` | existing `/admin/TestCatalogList?entity=sampletypes` |
| Order Entry Configuration | Admin → Config → Order Entry Configuration | `Home / Admin Management / Order Entry Configuration` | `/MasterListsPage/SampleEntryConfigurationMenu` |
| Site Information | Admin → Config → Site Information | `Home / Admin Management / Site Information` | `/MasterListsPage/SiteInformationMenu` |

Route notes:

- **Step URLs.** The step routes keep their current URLs. Only the step 2 label changes, from "Collect" to "Prepare Samples".
- **Removed routes.** `/order/clinical/label` is removed (D-066 tier Remove) and redirects to `/order/clinical/collect` with `?id=` kept. The Modify Order screen is merged (FR-H3). `/SamplePatientEntry` redirects once electronic orders work in the new flow (FR-B17, Dependency 17).
- **Opening a saved order.** A saved order opens on any step with `?id=<orderId>`.
- **Test Catalog shell routes.** These use `?entity=`, following Sample Type Management v2.1. D-012's path-segment rule applies to `/MasterListsPage` editors.
- **Verification.** All routes must be verified against the live app before build (MUST C).

---

## User Stories

1. As a **reception clerk**, I want to find the patient, facility and clinician before I create anything, so that I do not make duplicates.
2. As a **reception clerk**, I want to add many tests and panels quickly from a very large catalog, by browsing a lab unit or typing codes from the paper form, so that entering a long request takes seconds.
3. As a **reception clerk**, when tubes arrive with the request, I want OpenELIS to propose which tubes to expect and let me correct them to what arrived, so that each tube is numbered and labelled in one pass.
4. As **anyone handling the order**, I want to see at a glance which tests were ordered and whether each one has a tube, so that nothing is missed.
5. As a **laboratory technician**, I want to reject a bad tube, refer several tubes, or remove one with a single click, so that routine actions don't slow me down.
6. As a **test catalog manager**, I want to set each test's expected containers and body site rules once, so that every order gets correct proposals and complete specimen details.
7. As a **quality officer**, I want to switch the Sample check step on or off, so that small laboratories are not forced through a step they do not use.

---

## Functional Requirements

### A. Saving and navigation (all steps)

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | Every step's footer shows three actions, in this order: **Discard**, **Save and exit**, **Save and next** (primary). On the last enabled step the primary reads **Save and finish**. On Sample check, see FR-F3. | Replaces Save, Save & Next and Save Draft ("Save Draft" performed the same save as Save). |
| FR-A2 | **Save and exit** saves and returns to the dashboard, with the order highlighted. **Save and next** saves and opens the next enabled step for the same order. | |
| FR-A3 | **Discard** throws away the step's unsaved changes after a confirmation that names what will be lost ("Discard 4 tests and 3 samples entered on this page?"). If the order was never saved, this discards the whole order and returns to the dashboard: the reserved lab number is recorded as unused, a scanned pre-printed number is not recorded as used, and an electronic order returns to the incoming list unchanged. If the order was saved before, the step reverts to its last saved state. | Destructive confirmation modal (D-005). |
| FR-A4 | **Cancel order** is available on a saved order from the dashboard row and from the order's page header. It requires a reason, marks the order and its tests Cancelled, and voids its samples with the same reason. Nothing is deleted. An order that is already complete cannot be cancelled. Cancelled orders are hidden by default, with "Show cancelled" to reveal them. | MUST D. |
| FR-A5 | Each Save is one all-or-nothing server operation covering everything on the step. That includes the order header, patient, requester, tests and panels, samples, aliquots, test-to-sample assignments, receipt and collection details, body sites, storage, referrals, non-conformity reports, label print requests, the no-patient override record, notification choices and billing fields. If any part fails, nothing from that Save is stored. | Printing and referral dispatch happen after the save (FR-I6, FR-E3a). |
| FR-A6 | When a Save fails, every value stays on screen, the page scrolls to the first problem, the field or row is marked, and a notification pinned beside the footer says in plain words what failed and that nothing was saved. | |
| FR-A7 | **Two levels of "required".** Each step defines what is needed to **save** (park the work) and what is needed to **complete** (move on). Save and exit needs the save level; Save and next needs the complete level. Levels per step: FR-B13 and FR-D7. | |
| FR-A8 | **Required fields are marked where they are.** A field required at either level shows the required marker on its label and is announced as required to screen readers, driven by the same condition. Conditional requirements (body site, national ID, provider or facility by configuration) gain the marker only when they apply. | OGC-1240. |
| FR-A9 | **To continue checklist.** While the step is not complete, a panel directly above the footer, headed "To continue to {next step}", lists every missing item in page order as a link ("Add the requesting facility", "Collector for 26CPHL00471-2"). Choosing an item scrolls to and focuses its field. The list updates live and disappears when the step is complete. | |
| FR-A10 | **Disabled actions explain themselves.** While the complete level is not met, **Save and next** is disabled and shows "{count} items needed to continue" beside it; it never disappears. **Save and exit** stays enabled. Pressed with the save level not met, it lists the problems and sends nothing. Every disabled control in order entry says, on hover and on keyboard focus, what enables it. | R-UX-2. |
| FR-A11 | **Messages.** Save results (saved, failed, or unknown with Retry) appear in a notification pinned beside the footer until dismissed, and at the field concerned. Messages are plain language, translated, and say what to do next. The same event never produces more than one notification. Messages never show field paths or translation keys. | R-UX-1, R-UX-3. |
| FR-A12 | **Progress indicator.** At the top of every step, one equal-width segment per enabled step. Step names are never truncated; they wrap to two lines if needed. Each segment shows its state at a glance with icon, colour and a short text line: **Done**, a filled green `CheckmarkFilled`, with "Done 10:42" (the time of the save that completed it); **Current**, blue with a thick top border, and "{n} to do" or "Ready"; **In progress**, a half-filled circle, with "Saved, {n} to do"; **Needs attention**, a red `WarningFilled`, with a reason ("Sample -2 rejected"); **Not started**, a gray outline. Done and Needs attention never rely on colour alone. On a saved order each segment opens its step. The dashboard row shows the same states as a compact row of step icons. Leaving a step with unsaved changes prompts Save, Discard or Stay. | |
| FR-A13 | Pressing Save twice, or a network retry, never creates a second order, sample or referral. | With FR-K3. |
| FR-A14 | **Lab number.** It is reserved when Enter Order opens, so concurrent users never get the same number. Reserved numbers are never reused, and a discarded one is recorded as unused with user and time, so a gap can be explained. The field also accepts a scanned pre-printed label. Accepted formats follow the site-wide pre-printed accession setting, and `validateAccessionNumber` checks format as the number is entered. Uniqueness is checked on save; a clash names the order that holds the number. | Keeps reservation (Casey, 2026-09-25). Defects to fix: Dependency 7. |
| FR-A15 | **New order resets.** New order, from the dashboard or after Save and finish, always opens an empty Enter Order with a new lab number. Opening a saved order with `?id=` always shows that order's saved data. The reset follows where the user came from, never leftover screen state. | OGC-1201 AR. |
| FR-A16 | A step route that does not exist for the order redirects to the order's next unfinished step, unless a named redirect applies (Route notes, FR-H3, FR-B17). It never shows a blank page. | OGC-1050. |

### B. Step 1: Enter Order

#### Page structure

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | **Page order.** Enter Order follows the paper request form top to bottom, as numbered, titled sections: **1. Order**, **2. Patient**, **3. Requester**, **4. Request details**, **5. Tests**, **6. Samples received with this order**, **7. Billing and notifications**, **8. Attachments**. Sections that a site's configuration turns off do not appear, and the numbering closes up (section M). | Today required-by and priority sit in Requester, and request date sits among diagnosis and payment. |
| FR-B1a | **Completed sections fold to one line.** Once a section's required fields are filled and the user moves past it, the Patient, Requester and Request details sections fold to a single summary line with **Edit** (for example "Kila Morea, F, 38 y, PNG-8814-2209"). A section with anything missing or invalid never folds. The test chooser folds to its Add by code field and an **Add tests** button once the order has tests; the ordered tests table stays open. Preview-only and admin-disabled sections are not shown. | Casey, 2026-09-26: less visual weight. Folding only completed sections keeps principle 2. |
| FR-B2 | **Order summary strip.** Pinned under the progress indicator on every step, it shows: the patient's name and two identifiers (date of birth and national ID or patient number), sex and age; the requesting facility and provider; a STAT Tag when priority is STAT; and counts, for example "6 tests: 5 with sample, 1 awaiting, 2 referred · 5 samples, 2 stored". Each count is a link that scrolls to and filters the matching rows. Before a patient is chosen, the strip shows "No patient selected". | Principle 3; ISO 15189:2022 7.2 two identifiers. |

#### 1. Order

| ID | Requirement | Notes |
|---|---|---|
| FR-B3 | The Order section holds: the lab number (FR-A14); **Priority** (Routine or STAT); the **EQA** and **No patient** checkboxes (FR-B4); and a **Print order labels** shortcut (FR-I6). | The order labels themselves are edited in the Labels section (FR-I2). |
| FR-B4 | **EQA and No patient.** The EQA checkbox appears only when `eqaEnabled` is on. Ticking it also ticks No patient, suppresses the no-patient warning, and reveals EQA program, provider sample ID, deadline and EQA priority (default Standard). Ticking No patient alone shows the existing warning: results will not be evaluated against a reference range. When configuration requires a patient, No patient is shown disabled with the reason "A patient is required by Order Entry Configuration"; EQA stays available when enabled. | EQA fields as delivered by PR #4282 (confirm on develop, D-025); no EQA V2 behaviour (D-017). |

#### 2. Patient

| ID | Requirement | Notes |
|---|---|---|
| FR-B5 | **Search first.** The patient area opens in search mode with the shared patient search panel (OGC-1197). External patient source and client registry are searched only when `useExternalPatientSource` or `enableClientRegistry` are on. **Create new patient** appears only after a search has **succeeded**. That means a response came back, whether empty or not. The button opens the new-patient form with the search panel's own fields (identifier, last name, first name, date of birth) carried across one to one. | These two behaviours change the shared panel and apply wherever it is used; recorded against OGC-1197. |
| FR-B6 | A failed patient search shows "Search failed. Check the connection and try again." with Retry, never "no results", and does not unlock Create new patient. | R-NET-2, R-NET-3. |

#### 3. Requester

| ID | Requirement | Notes |
|---|---|---|
| FR-B7 | **Facility.** A search picker. **Add new facility** appears only after a search of at least 2 characters finds no match, and is shown disabled with its reason when `restrictFreeTextRefSiteEntry` is on. Ward or department is searched within the chosen facility. Add new facility keeps today's lightweight create (name only, flagged for review in Locations & Organizations); full facility details are edited there. | Retained current behaviour, justified under MUST E. | |
| FR-B8 | **Provider.** A search picker showing title, name and facility on each result. The name, phone, fax and email fields are not shown until a provider is picked or **Add new provider** is chosen after a search with no match. Add new provider is shown disabled with its reason when `restrictFreeTextProviderEntry` is on (the default). | Today typing into the name grid silently creates a provider. |
| FR-B9 | **Inline new provider.** Fields in order: **Title** (optional, a picker over the provider title list used by the Providers admin page), First name, Last name (required), Phone, Fax, Email. Fax and email are checked for format. The provider is saved with the title, which then shows wherever the provider's name appears. | OGC-1223 (In Review) targets this; develop at 2026-09-25 still lacks it. Re-verify when it lands. |
| FR-B10 | The Requester section also holds the requester contact and the **referring laboratory number** (the existing requester sample ID, relabelled; behaviour owned by the External Lab IDs FRS). **Remember site and requester** (the existing option, restored) keeps facility, ward, provider and requester contact for this user's next new order within the browser session. | OGC-1201 restore list. |

#### 4. Request details

| ID | Requirement | Notes |
|---|---|---|
| FR-B11 | **Order date and time** and **Required by** sit side by side at the top. Order date and time is when the clinician ordered the tests. It defaults to now in laboratory time (FR-K8) and cannot be in the future. Required by cannot be earlier than the order date. | Existing request date and required-by fields. |
| FR-B12 | Then **Program** with the program's additional order questions shown directly under it, **Provisional diagnosis**, and the optional **Next visit date** and **Sampling performed at** (test location code), shown only when their configuration switches are on (section M). | Additional information is its own epic (OGC-1144); this fixes only where it sits. |

#### 5. Tests

| ID | Requirement | Notes |
|---|---|---|
| FR-B13 | **Enter Order required levels.** **Save:** a patient (or No patient or EQA), and at least one test or panel. **Complete:** adds the facility and provider as configuration requires (`requesterRequired`, `SampleEntryReferralSiteNameRequired`, and `requireProviderEntry` once OGC-1143 adds it); the national ID of a new patient when `National ID required` is on; and receipt details when samples were received. No placeholder text ("Unknown", "null") is ever saved for a missing provider. A sample type is never required to add a test. | R-DATA-4 is met by FR-D7. |
| FR-B14 | **Test and panel chooser.** Two lists, stacked: **Order Panels** and **Order Tests**. Each has a search box matching name, code or LOINC. Each shows a checkbox list paged on the server, 25 per page, and above it the selected items as removable chips showing their full names. Two filters apply to both lists: **Lab unit** (default All lab units) and **Sample type** (optional, only narrows). Selections stay visible as chips across pages and filters. Inactive tests, and tests of a deactivated lab unit, are never offered. | Reinstates the Sample Collection Redesign chooser (ORD-7); D-007; OGC-1068; OGC-1207. |
| FR-B15 | **Add by code.** A single field above the lists accepts a test code or a panel code (Dependency 22), typed or scanned from the requisition, and adds it on Enter. It keeps focus for the next code, and gives an inline message for a code that matches nothing or matches an inactive test. | Keyboard-first fast path. |
| FR-B16 | **Panels.** Selecting a panel adds its member tests to the order, shown as belonging to that panel. Removing a panel also removes the member tests that came only from it, with an Undo notification. Tests also chosen on their own stay. Choosing a single test never attaches the panel it belongs to. The save records, for each test, the panel it came from, if any, and the order reloads with the same split. | Casey, 2026-09-25. R-DATA-2, TC-OEW-03; the fix replaces panel inference in the save (Dependency 15). |
| FR-B16a | **Panel integrity.** Removing a single member test from a selected panel keeps the panel, now marked modified. Everywhere the order is shown, a panel shows its full membership, never only its name or a chip: the ordered tests table, the summary strip, the Sample check step, results entry, validation and the patient report. The panel header reads "Liver Function Panel, 4 of 5 tests" with a **Modified** Tag. The removed member stays listed, struck through, with who removed it and when ("ALP, removed by Mary Kila 10:14"). The chooser's chip reads "Liver Function Panel 4/5". Before the order is saved, removing a member needs no reason. After save, it is a cancel with a required reason (FR-B21). The save records which members were deselected and by whom. | Casey, 2026-09-26. |
| FR-B16b | **Panels in Sample check are always expanded.** The Sample check step lists every ordered panel with all its members as rows, never collapsed to chips. Each member shows its status: on a sample, removed, cancelled, referred or tested elsewhere. A modified panel is highlighted, so the reviewer can confirm the change before releasing. | Casey, 2026-09-26. |
| FR-B17 | **Electronic orders.** When `external orders` is on, opening Enter Order with an external order reference prefills everything the order carried: patient, requester, tests, priority, referring laboratory number, results tested elsewhere and body site. An order that arrived without its specimen opens with section 6 on and Add sample focused. `/SamplePatientEntry` redirects to Enter Order with the same parameters (D-066 Merge, after Dependency 17). | OGC-1239 Part A. The incoming-orders queue (OGC-1073) is out of scope. |

#### The ordered tests table (shared, both steps)

| ID | Requirement | Notes |
|---|---|---|
| FR-B18 | Every selected test appears in the **Ordered tests** table, always open, directly under the chooser on Enter Order and at the top of Prepare Samples. Columns: Test (with its panel as a Tag, and code); Sample type; Expected container and required volume (for example "1 × K2EDTA 4 mL, min 2 mL"); **Sample**; Tested elsewhere (checkbox, FR-B20); and a remove icon. The table is grouped by panel, and standalone tests follow the panels. | Principle 3. One component. |
| FR-B19 | The **Sample** cell shows the sample the test is **actually assigned to**, as its suffix badge (`-1`). A proposed but unconfirmed assignment is shown differently: an outlined badge with "Proposed" until the samples are saved or the user confirms it. Otherwise the cell shows one of these statuses: "Not yet collected" (on Enter Order before samples exist), **Awaiting sample**, "Referred to {laboratory}", "Tested elsewhere: {laboratory}", or "Cancelled". On Prepare Samples it is where a test is assigned: a picker listing the order's samples, compatible ones first (FR-D5). | Answers "has every test been drawn". |
| FR-B20 | **Tested elsewhere.** Ticking the Tested elsewhere checkbox (helper text "Result reported by another laboratory") reveals the reported value and the performing laboratory on that row (a search picker defaulting to the referring facility). A test marked tested elsewhere needs no sample. The term replaces "upstream" everywhere in the product, including the External Lab IDs FRS surfaces. | From the External Lab IDs FRS; behaviour owned there. |
| FR-B21 | **Removing a test or panel.** An unsaved test or panel is removed at once, with Undo. A saved test is cancelled with a required reason; a saved panel is cancelled with a required reason, which cancels its members that are not on another panel or chosen on their own. Cancelled items stay visible struck through under "Show cancelled". Cancel and lab number change reasons are chosen from a short configurable list plus free text. | MUST D. |

#### 6. Samples received with this order

| ID | Requirement | Notes |
|---|---|---|
| FR-B22 | Section 6 is headed "Samples received with this order" and has a switch, off by default. Switched on, it expands in place to show the receipt fields and the shared samples table (section C), prefilled with proposed samples (FR-B24). Switching off with unsaved samples entered asks for confirmation. Once any sample on the order is saved, the switch is locked on and samples are voided individually (FR-C7). | MUST D. |
| FR-B23 | **Receipt fields**, above the table: **Received date and time** (defaults to now in laboratory time, not in the future) and **Received by** (defaults to the signed-in user, a user search picker). | ISO 15189:2022 7.2.6. |
| FR-B24 | **Proposed samples.** OpenELIS proposes one sample per container needed, from the ordered tests' expected containers (FR-G5), using the sharing rule (FR-B25). Why a sample was proposed is shown once, in the ordered tests table (each test's Sample cell names the proposed sample), and in a tooltip on the sample's Proposed Tag ("Proposed for Full Blood Count, HbA1c"). The samples table does not repeat the reason as a line under each row. HbA1c is glycated haemoglobin. | Principle 5. Casey, 2026-09-26: no duplication between the two tables. |
| FR-B25 | **Sharing rule.** Tests expecting the same container type share one container unless a test is marked "needs its own container". A test marked "needs its own container" shares only with tests of the same panel on this order that expect the same container type, for example one citrate tube for the Coagulation Screen (PT/INR and APTT). It never shares with other tests. For each container type, the proposed count is the largest count any single test asks for, not the sum. A test whose preferred container is not being proposed, but whose alternate is, shares the alternate. | Tube netting. |
| FR-B26 | The user can add or remove unsaved rows, change a row's container type, and change its sample type among those the container yields. A row the user changed is marked "Edited" until the step is saved, and is never changed by the proposal. After save, saved samples are never re-proposed. Adding or removing a test changes only untouched proposed rows, and says so ("Added 1 SST for Liver Function Panel"). | |
| FR-B27 | When samples are received, the samples table also shows the **Collected** column (FR-C2), so collection can be recorded at the desk. If it is left empty, Prepare Samples asks for it. **Save and next** opens Prepare Samples with assignments worked out (FR-D5). If nothing remains to decide there, Prepare Samples can be saved without further input. | |

#### 7. Billing and notifications

| ID | Requirement | Notes |
|---|---|---|
| FR-B31 | **Attachments (section 8).** Section 8 is the existing order attachments component, unchanged. An unsaved upload can be removed at once. An attachment on a saved order is deactivated with a reason, never deleted, and shown under "Show removed". | V-15. MUST D. |
| FR-B28 | **Billing.** When `billingRefNumber` is on, a **Billing reference** field appears, labelled per `billingRefNumberLocalization`. It comes with a **Paid** indicator on each test row of the ordered tests table: a manual toggle for now, designed to be set later from Odoo or a future billing module, and shown read-only when set by one. **Payment status** (order level) appears when `trackPayment` is on. | Casey, 2026-09-25: keep billing reference; add paid indicator bundled with it. |
| FR-B29 | **Result notifications.** When result notifications are configured (Test Notification Configuration and the patient results SMTP/SMS settings), each ordered test row offers **Notify patient** and **Notify provider**, each with the channels available (email, SMS) and the contact details used. Defaults come from Test Notification Configuration. | Casey, 2026-09-25: keep. Restores the legacy OrderResultReporting. |
| FR-B30 | **Contact tracing.** When `contactTracingEnabled` is on, **Index case name** and **Index case record number** appear, and print on the report as today. | Casey, 2026-09-25: keep. |

### C. The shared samples table (steps 1 and 2)

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | One samples table component is used on Enter Order and Prepare Samples, with the same rows, columns and actions, from the same data. Prepare Samples adds only the Aliquot action and the assignment behaviour. | Principle 1. |
| FR-C2 | **Columns.** Every column shown is visible on the row, never inside an expansion. **Always shown:** Select; **Sample number**; **Container** (cap swatch, name, volume); **Sample type**; **Tests** (Tags with full names); **Collected** (date, time and collector in one cell, each edited inline); **Storage** (location path or "Not stored"); **Status** (exceptions only, see FR-C2a and FR-C11: Pending save, Proposed, Referred, Non-conformity, Rejected, Voided, Holding time near or exceeded); row actions. Stored shows as the Storage cell, not as an extra Tag. There is no label status; "Prints after save" is only a pending-save marker on a print request. **Shown only when needed:** **Body site** (site and side), whenever any sample on the order has a sample type that uses body site. | Principle 2. |
| FR-C2a | **Tag kinds.** Status Tags use only Carbon Tag kinds: Pending save and Prints after save = blue; Stored = green; Referred and Tested elsewhere = purple; Awaiting sample = purple; Non-conformity = warm-gray with a warning icon; Rejected, Holding time exceeded and STAT = red; Voided and Cancelled = gray; Modified panel = warm-gray; Aliquot = cool-gray; holding time remaining = gray. | V-11. |
| FR-C3 | **Collected for all.** The Collected column header has **Fill all**. It asks for date, time and collector once (collector: a user picker, free text, or "Collected elsewhere, collector unknown") and fills every empty Collected cell, which then shows the values themselves. Collector never defaults to the signed-in user; a "Me" shortcut fills it deliberately. When `auto-fill collection date/time` is on, empty collection times default to the received time and are marked "Defaulted, confirm" until the user confirms or changes them. When the setting is off, they start empty. | Casey, 2026-09-25. "Collected elsewhere" is stored as the existing lab-performed-sampling flag, inverted. |
| FR-C4 | **Numbering.** Sample number is the order's lab number, a hyphen and the sample's position (`26CPHL00471-1`, `26CPHL00471-2`); an aliquot adds a dot and its position (`26CPHL00471-1.1` is the first aliquot of `-1`). This one scheme is used on every clinical screen, label, report and message; the dot form `26CPHL00471.1` is retired. Environmental and vector numbering (vector pool deconvolution uses `LABNO.X-Y` today) is decided in the alignment note before those domains adopt the shared table. Suffixes are fixed once saved and never reused, including for voided samples. A sample number follows its order's lab number; if the lab number is changed (FR-H3), every sample and aliquot number is re-derived, and the old numbers are recorded against them and never reissued. | Casey, 2026-09-26. Today the app mixes `-1` and `.1`; the label printer and search accept both during migration. |
| FR-C4a | **Suffix first on screen.** The lab number is shown once, in the table heading ("Samples for 26CPHL00471"). Each row shows the suffix as a prominent badge (`-1`, `-2`; aliquots `-1.1` indented), with the full number in smaller text beneath, copyable. Ordered tests Sample cells and status messages use the same badge. | Casey, 2026-09-26: the repeated lab number is hard to scan. |
| FR-C5 | Aliquots are indented rows directly under their parent. The table never nests deeper than one level; tests are Tags, never a sub-table. | |
| FR-C6 | **Row action icons**, visible on every row, one click each, using `@carbon/icons-react` as ghost icon-only Buttons (Carbon IconButton, size sm): **Print label** (`Printer`), **Refer out** (`SendAlt`), **Report non-conformity** (`WarningAlt`), **Remove** (`TrashCan`; on a saved sample **Void**, `Misuse`). On Prepare Samples, **Aliquot** (`Eyedropper`) is added. Other icons used: storage `Box`, locked quantity `Locked`, inline edit `Edit`, undo `Undo`, add `Add`, scan `Barcode`, holding time `Time`, expand `ChevronDown`. Each icon has a text tooltip and an accessible name. Refer out and Report non-conformity open as an inline panel under the row; Print label prints at once (FR-I6). | Principle 4. D-005. |
| FR-C7 | **Remove.** On an unsaved sample, Remove takes it out at once and shows Undo. On a saved sample, the same icon reads **Void**: it opens an inline reason field with Confirm under the row. The voided row stays visible, struck through, under "Show voided". Tests on a removed or voided sample return to Awaiting sample. | MUST D. |
| FR-C8 | **Toolbar**, always visible above the table: **Add sample** (a container type search picker, then a count); a **Scan** field (a scanned sample label selects that row); and **Print labels**, **Store**, **Refer out**, **Report non-conformity**. Each of the last four applies to the selected rows. With nothing selected, it opens with all rows preselected and lists them by sample number to confirm. Referring one sample or several is one action. | |
| FR-C9 | **Expanded row** (optional detail only): quantity and unit; collection method (a picker over the Clinical Collection Method list); specimen origin; sample temperature; collection conditions; GPS (when `gpsCoordinatesEnabled` is on, with its accuracy and timeout settings); lab performed sampling; notes. Aliquots show quantity, unit and sample type. | |
| FR-C10 | Empty state: "No samples yet. Add a sample or scan a label." with Add sample. | |
| FR-C11 | **Visual density.** To keep the page calm: tables use Carbon's compact row size with no zebra striping; colour appears only for exceptions (normal states are plain text); a row shows at most two status Tags plus "+n" with the rest in a tooltip; storage paths are truncated from the left with the full path in a tooltip; empty optional columns are not shown. | Casey, 2026-09-26. |

### D. Step 2: Prepare Samples

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | Prepare Samples shows, top to bottom: the ordered tests table (FR-B18), then the samples table (section C). If the order has no samples yet, the samples table opens with proposed samples (FR-B24, FR-B25), marked "Proposed, not yet confirmed"; nothing is saved until the user saves. When no receipt has been recorded on the order, the receipt fields (FR-B23) appear above the samples table. | Test-first on top. V-04. |
| FR-D2 | **Consent.** When `consentRequiredForCollection` (Site Information) is on, a consent section appears above the samples table and the complete level requires consent recorded. Off by default. | |
| FR-D3 | **Holding time.** When a test on a sample has a holding time in the test catalog (the test's holding time setting), the sample's Status shows time left. It counts from collection time, or from received time when collection is unknown, marked so. The Tag is gray while time remains, warm-gray with a warning icon when 20% or less of the limit remains, and red "Holding time exceeded" past it. The red Tag offers Report non-conformity prefilled. It never blocks. | OGC-1201 AP and AM. |
| FR-D4 | **Body site.** Where a sample's type uses body site (FR-N2), the Body site cell holds the site picker (the sample type's allowed sites). It defaults from the test when the test sets one (FR-N3). When the site has a side, **Side** (Left, Right, Bilateral) appears beside it. **Other site** appears as free text when "Other" is chosen. The field is required when the sample type says Required. | Section N. |
| FR-D5 | **Automatic assignment.** On opening the step, each test is assigned to a sample when exactly one compatible sample exists. Compatible means the sample's container type is one of the test's expected containers, or can be used as its sample type (FR-G6), and its sample type matches or can be used as the test's. Tests with more than one compatible sample show "Choose a sample" in their Sample cell, listing the compatible samples as one-click choices. | Principle 5. |
| FR-D6 | The user can move a test to another sample from its Sample cell, with compatible samples listed first. A manual assignment is marked "Assigned by you" until saved and is never changed by automatic assignment. | |
| FR-D7 | **Prepare Samples required levels.** **Save:** every sample has a container type (when the catalog defines containers for any of its tests) and a sample type, and every sample carries at least one test or is an aliquot parent (R-DATA-4, with a message naming the sample). **Complete:** adds the receipt date, time and receiver (when not recorded on Enter Order), collection details for every primary sample (collector, or collected elsewhere, and date and time), body site where required, consent where required, confirmation of any defaulted or out-of-order time, and no test left at "Choose a sample". Awaiting sample tests do not block completion. | |
| FR-D8 | **Incompatible sample.** Assigning a test to a sample it does not expect is allowed after an inline warning ("HbA1c expects an EDTA tube. This is an SST.") with **Cancel** and **Assign and record deviation**. The second opens the non-conformity form prefilled. | Principle 6. |
| FR-D9 | **Awaiting sample.** A test with no sample when the step is saved does not block the save. It stays Awaiting sample. A banner lists the tests by name, with **Add sample** and **Report non-conformity** (reject the test and request a new sample). | Casey, 2026-09-25. |
| FR-D10 | **Aliquot.** The Aliquot icon opens an inline form under the row with the number of aliquots, and for each: quantity and unit, and sample type (defaulting to the parent's, for example Plasma from a spun EDTA tube). New aliquots appear as indented rows and can take tests. The parent's remaining quantity is reduced, and the save is refused if aliquots exceed what the parent holds. Aliquoting stays available later from Sample Management. | Existing aliquot relationship. |
| FR-D11 | Tests can be added on Prepare Samples (add-on tests) with the same chooser (FR-B14), and go through automatic assignment. | |

### E. Per-sample actions

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | **Set storage** (toolbar Store, or the Storage cell) opens the shared storage location picker. Storing several samples places them in consecutive free positions in the chosen box or rack, shown for confirmation. When a test on the sample has storage locked in the test catalog (Override Restricted), its storage condition is read-only and only matching locations are offered. | OGC-657 storage model; OGC-979. |
| FR-E2 | **Refer out** (row icon or toolbar, one sample or many) opens one inline panel listing the chosen samples by number. It asks for the **Reference laboratory** (search picker), the **Tests to refer** on each sample (all ticked by default), the **Reason** (the existing referral reason list), and the other fields the existing clinical referral record holds. The form is the existing referral form in its return-to-page mode (Dependency 10); this FRS adds only the multi-sample list, the per-sample tests, Aliquot first and the existing-referral notice. If some tests on a sample are not referred, a warning says the tube leaves the laboratory and offers **Aliquot first**. On Enter Order, that saves the step and opens Prepare Samples with Aliquot open on that sample. | Existing referral per test and referral set. |
| FR-E3 | Refer out is available on Enter Order only for samples received with the order. Referral of an order before any sample exists is out of scope. | |
| FR-E3a | Saving a referral marks the sample for shipment, so it appears in Sample Shipment's unassigned samples. A test that already has an open referral (any referral status other than the completed, cancelled or rejected statuses) shows "Already referred to {laboratory} on {date}", and saving another from order entry changes nothing. **Dispatch** is a separate action after save, not part of the step's Save. | OGC-808; D-016. |
| FR-E4 | **Report non-conformity** (row icon or toolbar) opens the existing inline non-conformity form, prefilled with the order, the samples and their tests. The existing outcomes are offered: continue with a flag, reject the sample, and reject and request a new sample. A rejected sample shows Rejected, and its tests return to Awaiting sample. | Existing NCE form and resample. |
| FR-E5 | Storage, referrals, non-conformity reports and label print requests entered on a step are saved with that step's Save (FR-A5), shown as "Pending save" until then. | The shared storage picker, referral form and non-conformity form each gain a mode that returns their data to the page instead of saving on their own (Dependency 10). |

### F. Step 3: Sample check (optional)

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | The Sample check step is shown when the clinical sample acceptance setting (`sampleAcceptCheck.clinical`) is Mandatory or Optional, and hidden, including from the progress indicator, when it is Off. | Reuses the existing setting. |
| FR-F2 | Order Entry Configuration labels the setting plainly: "Sample acceptance checklist (clinical): Mandatory, Optional or Off. Off also hides the Sample check step." The checklist items stay under Admin → Compliance → Sample Acceptance Checklist. | D-068. |
| FR-F3 | Sample check shows the order summary strip, the ordered panels and tests (FR-B16b), one expandable row per sample (FR-F3b) with its Report non-conformity icon, and a footer whose primary action is **Release for testing** (replacing Save and finish), with **Return to Prepare Samples** (reason required) as a secondary action. Release for testing is disabled until Prepare Samples is complete, with the missing items named. When an item failed, the reason points to Report non-conformity or Request new sample on that sample. | |
| FR-F3b | **Checklist and evidence together.** Each sample is one row: suffix badge, container, sample type, tests, and a checklist status ("3 of 4 answered", "1 failed"). Expanding the row shows the sample acceptance checklist items for that sample, each **beside the recorded data it asks about**, so the reviewer never looks elsewhere:<br>• Identity: the patient's two identifiers and the sample number, to compare with the tube in hand.<br>• Container: the container recorded against the tests' expected containers, and any recorded deviation.<br>• Volume: the recorded quantity and unit, beside each test's required (minimum) volume and the sum of those minimums, the total the sample's tests need.<br>• Timing: collection and received times, and the holding time left.<br>• Body site, where the sample type uses it.<br>• Condition: any non-conformity already reported.<br>Each checklist item maps to the field it checks. An item with no matching recorded data says "Not recorded" and links to Prepare Samples. The row's answers are saved with the step. | Casey, 2026-09-26. The item-to-field mapping is part of the checklist item configuration (Dependency 27). |
| FR-F4 | Under Optional, releasing with items unanswered asks for a reason and records who proceeded, when and why. | OGC-1201 AB. |
| FR-F5 | **Order progress status:** **Entered** (Enter Order saved); **Samples prepared** (Prepare Samples complete); **Ready for testing** (when Sample check is on); **Cancelled**. An order is **complete** at Samples prepared with Sample check off, or at Ready for testing with it on. A complete order with Awaiting sample tests stays in the dashboard's Awaiting sample filter until each such test gets a sample or is rejected. | Replaces inferring completion from the checklist record. |

### G. Test catalog: container types and expected containers

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | **Container Types** list page, beside Sample Types. Columns: Name, Domain, Additive, Material, Nominal volume, Cap colour (swatch and name), Sample types it yields (Tags), Category, Used by, Status. Search, filters for domain and category, and "Show deactivated". | New entity. |
| FR-G2 | Add and edit by inline row expansion. Fields: Name, Code, Domain (one or more of Clinical, Environmental, Vector; never a combined value), Additive (the preservative for environmental containers), Material, Nominal volume and unit, Cap colour (colour picker plus colour name), Category, **Sample types it yields** (a filterable multi-select, as Tags), Standard code (optional, for FHIR), Active. | Identity is additive plus material; cap colour is display-only and editable per deployment. D-004. |
| FR-G3 | Container types are deactivated, never deleted. Deactivating one in use warns "Used by 14 tests (Full Blood Count, HbA1c, ... and 9 more, View all) and 1,204 samples. Existing samples keep it; it can no longer be proposed or chosen." | MUST D. |
| FR-G4 | Installs and upgrades are pre-seeded with the list in Appendix A, with ISO 6710 cap colours. Upgrades never overwrite an edited container type. The existing environmental container dictionary is imported under the Environmental domain (alignment note). | |
| FR-G5 | **Test editor, Containers section.** An ordered list of expected containers per test: one **Preferred** and any number of **Alternate**. Each has a count (default 1) and an optional minimum volume and unit. A test-level checkbox sets **Needs its own container**: the test then shares a container only with tests of its own panel (FR-B25). | FHIR SpecimenDefinition preferred and alternate pattern. |
| FR-G6 | The container picker lists containers yielding the test's sample type, then, in a second group, containers yielding another sample type that the user can mark **Can be used as {test's sample type}**. For example, Creatinine (Serum) can list a lithium heparin plasma separator tube as an Alternate that can be used as Serum. A sample in that container keeps its true sample type (Plasma) on the sample, labels and reports. The test keeps exactly one sample type. A can-be-used-as container can never be Preferred. | Casey, 2026-09-25. D-028 unchanged. |
| FR-G6b | **Secondary sample types are visible.** The test editor shows the test's sample types as **Primary** (its one sample type) and **Secondary** (sample types it accepts through can-be-used-as containers, each with the container, for example "Plasma, via PST, used as Serum"). The Sample Type screen shows "Primary for {n} tests" and "Secondary for {n} tests", each with the test names. | Casey, 2026-09-26. |
| FR-G7 | **Sample Type settings** gain **Default container type**, used for a test with no expected containers. | Hosted by Sample Type Management v2.1 (Dependency 20). |
| FR-G8 | A test with no expected containers, whose sample type has no default, gets no proposal; a sample can still be added by hand with any container type yielding its sample type. Container type is required on a sample only when the catalog defines containers for at least one of its tests. | Laboratories that do not track containers keep working. |

### H. Order dashboard and editing

| ID | Requirement | Notes |
|---|---|---|
| FR-H1 | Quick filters with counts, each clickable: In progress, Awaiting sample, Not stored, Has referred tests, Referral results pending, Awaiting sample check (when the step is on), Unpaid (when billing is on), Cancelled (off by default). | Replaces the removed labelling and storage step as a queue. |
| FR-H4 | **Split orders.** An order can have some tests referred while the rest go ahead in this laboratory. The dashboard shows both streams on the row: the order's in-laboratory progress (step icons, FR-A12), and a referral line such as "2 tests referred to PNGIMR, in transit" using the referral status. Filters are **Has referred tests** and **Referral results pending**. A referred test never holds back the order's own completion, and in-laboratory completion never hides a referral that is still open. Opening a split order shows its referred tests in the ordered tests table with their referral status. | Casey, 2026-09-26. Referral status from the existing referral record (D-016). |
| FR-H2a | The dashboard has a search box matching lab number, patient name or identifier, and referring laboratory number. | |
| FR-H2 | Each row shows lab number, patient, facility, progress status Tag, test count with awaiting count, sample count, and time since entered. Actions: **Open** (next unfinished step) and **Cancel order** (FR-A4). | |
| FR-H3 | **Editing uses the same steps.** Opening a saved order, from the dashboard, a search or a lab number, opens its steps with `?id=`. Every later change is made there. The Modify Order screen is merged (D-066 Merge): its menu row goes, and its URL redirects to Enter Order for the same order. **Change lab number** on a saved order's Order section requires a reason. It shows the old and new numbers for confirmation, re-derives sample numbers (FR-C4), and prompts the user to print new labels. The change is recorded, and the old number is retired, never reissued. Reception and Admin can do it. | Casey, 2026-09-25. Keeps OGC-1191 behaviour. |

### I. Labels

The laboratory defines its label types in Label Presets: up to ten or more, system and custom, each with its own size (for example a 25 × 76 mm specimen label, a 12 × 38 mm freezer label, a custom cryovial label). Tests define which label types and how many they need. Order entry brings the two together and lets the user override.

| ID | Requirement | Notes |
|---|---|---|
| FR-I1 | **Label types offered.** Every **active** preset in Label Presets is available, system or custom, whatever its number. Each preset is shown by its display name and size (for example "Freezer label, 12 × 38 mm"), never an internal key, and has a scope from its preset settings: per order or per sample. Inactive presets never appear. | Gap (a): the presets the laboratory added are not present in order entry today. OGC-988, OGC-1169. |
| FR-I2 | **Labels section.** A dedicated **Labels** section sits directly below the samples table on Enter Order and Prepare Samples (on Enter Order before any sample exists, it shows only Order labels). It is always open, never inside the samples table or a row expansion. It has two parts. **Order labels** is one row with a quantity for each order-level preset in use. **Sample labels** is a grid: one row per sample and aliquot, shown by suffix badge; one column per sample-level preset in use. Each column header shows the preset name, size and a Print column action. Each row has a Print row action. The section ends with **Print all labels** and the total count. | Casey, 2026-09-26: labels printed with every order must not be hidden, and the order label does not belong in the sample list. |
| FR-I3 | **Which label types are shown as columns.** The grid shows the presets linked to any test on the order, plus any preset whose own default is above zero. **Add label type** lists every other active preset and adds it as a column. **Show all label types** reveals every active preset at zero, so a laboratory with ten presets can reach them all without crowding the default view. | |
| FR-I4 | **Where quantities come from.** For each test on a sample, OpenELIS reads the presets linked to that test in the test catalog, with their default, maximum and allow-override. When several tests on the sample link the same preset, the highest default and the highest maximum apply. For order-level presets, the same rule runs across all tests on the order. A preset linked to no test uses its own default and maximum. Hovering a quantity shows where it came from: "2, from Full Blood Count", "1, preset default" or "3, changed by Mary Kila". The fixed "2 order labels plus 1 per specimen" rule is removed. The existing default and maximum label counts migrate into the presets' own defaults (Dependency 14). | Gap (b): the test catalog's label types and quantities are not respected today. OGC-990. |
| FR-I5 | **Overriding.** Any quantity can be changed with a number stepper, up to its maximum. A changed quantity is marked **Changed** and recorded with the print request. When a contributing test does not allow override, the quantity is read-only with the `Locked` icon and "Set by {test} in the test catalog". When the global "allow label override at order entry" setting is off, every quantity is read-only with that reason. | OGC-989. |
| FR-I5a | **Aliquots** get a row in the grid. Their quantities default from each preset's per-aliquot default where the preset has one; otherwise one of each sample-level preset in use. | Existing aliquot label default migrates here. |
| FR-I6 | **Printing.** Printing happens only for saved samples; printing from unsaved rows saves the step first. If generating the label file fails, the save is never undone; a notification offers Retry. The label file opens in the print window; when the browser blocks it, the file downloads instead and a notification says so. OpenELIS generates label files (PDF). It does not track whether labels were generated, printed or put on a tube; the person at the bench can see that. There is no label status anywhere in order entry. The Order section offers **Print order labels** as a shortcut to the same order-label row. | OGC-1201 S. |
| FR-I7 | There is one print control per row and per column, and no second reprint block on the page. Printing is always available and asks nothing, except that a quantity above the preset maximum needs the existing label override. | OGC-1169. Casey, 2026-09-26: no label tracking. |
| FR-I8 | Each physical sample gets one set of labels. The samples table, labels, storage and sample check all show exactly the saved samples, with no phantom rows. A requested sample type counts as fulfilled once a sample of that type is saved. | R-DATA-1, TC-OEW-05. |
| FR-I9 | A label with no provider prints nothing in that field, never a placeholder. Every sample label prints the full sample number (`26CPHL00471-1`) as text and barcode. | OGC-1143. |

### J. States

| ID | Requirement | Notes |
|---|---|---|
| FR-J1 | Loading: tables show skeleton rows; footer actions are disabled until the order has loaded. | |
| FR-J2 | A test with no container set: its Expected container cell reads "No container set in the test catalog", and Add sample is offered. | |
| FR-J3 | Server unreachable on Save: "Could not reach the server. Nothing was saved. Your entries are still here." with the Save actions available to retry. | |
| FR-J4 | Another user saved the order since it was opened: Save is refused with "This order was changed by {user} at {time}. Reload to see their changes." | Existing record versioning. |

### K. Connectivity, data integrity and time

Poor and dropping connectivity is a normal operating condition. Each requirement names the QA case re-run against the new build.

| ID | Requirement | QA case |
|---|---|---|
| FR-K1 | Opening any order entry page survives a server outage of at least 60 seconds. The page retries with growing gaps, shows a non-blocking "Reconnecting..." status, recovers on its own with nothing lost, and never shows a modal that sends the user away. | R-NET-1, TC-NET-02 (app shell) |
| FR-K2 | A failed lookup (patient, tests, sample types, facilities, providers, storage, container types, body sites) says it failed and offers Retry. Empty is shown only after a request succeeded. Nothing stays on "Loading..." forever. | R-NET-2, TC-NET-03, TC-NET-07 |
| FR-K3 | If a save reached the server but its reply was lost, retrying returns the original saved result. There is never an "already in use" dead end, a second order or a second sample. | R-NET-4, TC-NET-05 |
| FR-K4 | Unsaved entries on the current step survive a reload, a dropped connection and a renewed session. They are kept on that device only, readable only by the user who typed them, cleared on sign-out, on save or discard, and after 24 hours (configurable). After a failed save the user can see what was saved and what was not. | R-NET-5 |
| FR-K5 | One user action sends exactly one write, including double clicks and step transitions. | R-NET-6, TC-OEW-09 |
| FR-K6 | While saving, the Save actions are disabled and "Saving..." is shown; the outcome is always shown (saved, failed, or unknown with Retry). | R-NET-7, TC-NET-06 |
| FR-K7 | Reference data (sample types, tests, panels, container types, body sites, dropdown lists) is loaded once and reused across steps and orders. It is refreshed at most every 15 minutes and on reconnect, and a changed list applies from the next time a picker opens. | R-NET-8 |
| FR-K8 | **One clock.** The current moment always comes from the server's clock, which the deployment keeps accurate with network time synchronisation; the browser clock is never used for defaults or validation. Every default date and time is that moment in the **laboratory time zone**. Dates use the site's configured date format in all three order workflows. | R-TIME-1, R-TIME-4, TC-OEW-08, TC-ENV-05 |
| FR-K8a | The laboratory time zone (for example `Pacific/Port_Moresby`) is set in the distribution's configuration files in the distro repository; unset, it defaults to the server's time zone. Site Information shows it read-only: "Set by the distribution configuration". | Casey, 2026-09-25 |
| FR-K8b | When the user's computer clock differs from the server's by more than 5 minutes, a non-blocking notice says "This computer's clock is {n} minutes off. Times are taken from the laboratory server." | |
| FR-K9 | A valid local "today" is always accepted; a genuinely future date gets a plain message, not a format error. | R-TIME-2, TC-OEW-07 |
| FR-K10 | A collection time later than the received time warns on the field. Completing the step requires confirming "Collection time is after receipt". The value is saved as entered, with who confirmed it. | R-TIME-3 (Casey: warn and confirm) |
| FR-K11 | Going back and forward never clears a value the user saw, and a blank is never saved silently in place of a value shown. | R-DATA-5, TC-OEW-06 |
| FR-K12 | What was saved reads back identically on every step and on the dashboard: samples, tests, panels (with provenance), dates and times. | R-DATA-6, TC-EO-06 |
| FR-K13 | Compatible sample types for a test come only from its sample type mapping and the equivalents declared on its containers (FR-G6); the screen never falls back to an arbitrary list. | R-DATA-3, TC-OEW-04 |
| FR-K14 | A list the page needs that has not been configured says so and names the admin page that fixes it. | R-UX-4 |
| FR-K15 | Completing the last enabled step completes the order. A confirmation names the lab number and lists any Awaiting sample tests. The dashboard stops offering Continue. Progress counts only the workflow's real steps and only saved progress; a new unsaved order shows none done. | R-FLOW-1 to R-FLOW-3, TC-OEW-11, TC-ODB-02, TC-ENV-02, TC-VEC-02 |

**Must keep working** (QA handoff section 7, adopted unchanged as acceptance criteria):

1. Save with no patient and no sample type is blocked with a message, and no request is sent.
2. The saved payload matches exactly what the user selected, per sample.
3. Going back to Enter Order keeps patient, facility, sample types and tests.
4. A duplicate lab number is rejected and the existing order is left untouched.
5. The sample acceptance checklist blocks Release for testing until every item is answered, and when any item fails.
6. Dashboard Continue resumes at the correct step.
7. A saved order reopens with program, samples, tests, facility, request and received dates correct.
8. A save that fails before reaching the server keeps the form intact and says it was not saved.
9. A slow save disables the button and sends one request.
10. The environmental workflow runs end to end to completion.
11. A short outage (5 seconds or less) during page load recovers unnoticed.

### L. Reuse by environmental and vector order entry

| ID | Requirement | Notes |
|---|---|---|
| FR-L1 | The ordered tests table, the samples table and the summary strip are domain-neutral components with configurable columns. The samples table supports these row kinds: primary sample, aliquot, quality control child (blank, duplicate, control), and pool group (a collapsible vector pool row whose actions apply to the pool). It also supports an optional grouping key, for example a vector sampling site. The action set is the same in every domain. | |
| FR-L2 | A domain may skip Prepare Samples. Environmental and vector keep samples on Enter Order, with the samples table always on. | |
| FR-L3 | Sections A and K, the required levels, and FR-F1 and FR-F5 apply to every domain. Each domain defines its own save and complete requirement sets (patient for clinical; requester for environmental; sampling site (vector) and requester for vector). | |
| FR-L4 | Refer out allows domain-specific referral fields. Environmental and vector keep their subcontract and chain-of-custody fields. | |
| FR-L5 | Shared components use domain-neutral names and wording ("order", "requester"). | |

The environmental and vector screen changes themselves are in the alignment note.

### M. Configuration preserved

Every existing setting that affects order entry keeps its effect. Settings the current new flow ignores are marked **restore**.

| Setting | Where set | Effect in v4 | FR |
|---|---|---|---|
| `National ID required` | Patient Entry Configuration | National ID required for a new patient, at the complete level | FR-B13 |
| `Allow duplicate national ids`, `Allow duplicate subject number`, `Subject number required` | Patient Entry Configuration | Server checks kept in the whole-step save | FR-A5 |
| `default nationality`, `patientGpsCaptureEnabled`, `useNewAddressHierarchy`, patient alias and ID document labels, name and ID character sets, phone format settings | Patient Entry / Site Information | Unchanged (shared new-patient form) | FR-B5 |
| `useExternalPatientSource`, `enableClientRegistry` | Site Information | **Restore:** gate external and registry search | FR-B5 |
| PatientRequired (form field) | Field set | Patient required unless No patient or EQA | FR-B4, FR-B13 |
| `requesterRequired` | Order Entry | Requester required at complete level | FR-B13 |
| `SampleEntryReferralSiteNameRequired` | Field set | Facility required at complete level | FR-B13 |
| `requireProviderEntry` | Order Entry (added by OGC-1143, in progress) | Provider required at complete level | FR-B13 |
| `restrictFreeTextRefSiteEntry` | Order Entry | Add new facility disabled with reason | FR-B7 |
| `restrictFreeTextProviderEntry` (default on) | Order Entry | **Restore:** Add new provider disabled with reason | FR-B8 |
| `restrictFreeTextRequestorEntry`, `restrictFreeTextSampSiteEntry` | Order Entry | Environmental and vector | FR-L3 |
| `eqaEnabled` | Order Entry | **Restore:** EQA checkbox shown only when on | FR-B4 |
| Program (`ORDER_PROGRAM`) | Order Entry | Program saved with the order | FR-B12 |
| Next visit date, test location code (form fields) | Field set | **Restore:** shown only when on | FR-B12 |
| `trackPayment` | Order Entry | **Restore:** Payment status shown only when on | FR-B28 |
| `billingRefNumber`, `billingRefNumberLocalization` | Order Entry | Billing reference and Paid indicator | FR-B28 |
| `contactTracingEnabled` | Order Entry | Index case fields | FR-B30 |
| Test Notification Configuration, patient results SMTP/SMS settings | Admin | Result notification choices per test | FR-B29 |
| `external orders` | Site Information | Electronic orders open in Enter Order | FR-B17 |
| `gpsCoordinatesEnabled`, `gpsRequiredAccuracyMeters`, `gpsTimeoutSeconds` | Order Entry | **Restore:** GPS shown only when on | FR-C9 |
| `auto-fill collection date/time` | Order Entry | Default collection time to received time, marked "Defaulted, confirm" | FR-C3 |
| `consentRequiredForCollection` | Site Information | Consent section and requirement | FR-D2 |
| `sampleAcceptCheck.clinical`, `.environmental`, `.vector` | Order Entry | Sample check enforcement; Off hides the step | FR-F1, FR-L3 |
| `validateAccessionNumber` | Order Entry | **Restore:** lab number format checked on entry | FR-A14 |
| Accession format, prefix, alphanumeric prefix | Order Entry / Site Information | Number generation unchanged | FR-A14 |
| `prePrintUseAltAccession`, `prePrintAltAccessionPrefix` | Label Presets (OGC-1217) | Accepted pre-printed formats | FR-A14 |
| `numDefault*Labels`, `numMax*Labels` | Barcode Configuration | Migrated into preset defaults and maximums | FR-I4, Dependency 14 |
| Label content and size fields, `BarCodeType` | Barcode Configuration / Site Information | Unchanged, applied when rendering | FR-I1 |
| `default date locale` | Site Information | Date format in all workflows | FR-K8 |
| `24 hour clock` | Site Information | Time entry and display follow it | FR-K8 |
| Laboratory time zone (new) | Distribution configuration | Clock for all defaults | FR-K8a |
| `Patient ID required`, `supportPatientNationality` | Patient Entry | Have no effect anywhere today; removed with a migration note | Dependency 18 |
| `orderEntryWorkflowType` | Order Entry | Not exposed today; replaced by the per-domain menu (OGC-1070) | Out of scope |

### N. Body site and laterality (configure, capture, use)

| ID | Requirement | Notes |
|---|---|---|
| FR-N1 | **Body Sites** admin page (Test Catalog). It lists the body site list with Name (translated), Code and code system (SNOMED CT, optional), **Has a side** (lateralizable), sort order, Active, and Used by. It offers inline add and edit, Show deactivated, and CSV import and export following the catalog CSV loader pattern. It is the cleaned-up existing Source of Sample list: the legacy rows are imported. Rows that are really collection methods or timings (Midstream, Clean Catch, Venous, EDTA, Acute, Convalescent) and test rows are deactivated. The four rows with a side baked into the name ("Left Lower Lobe" and similar) are split into site plus side. | MUST D. The legacy list has no admin page and no codes today. |
| FR-N2 | **Sample Type settings** gain **Body site**: Not used (default), Optional or Required, and **Allowed body sites** (a filterable multi-select from the Body Sites list, shown as Tags). | |
| FR-N3 | **Test editor, Body site section** (shown when the test's sample type uses body site): an optional **Default body site**, chosen from the sample type's allowed sites, and **Lock** (the site cannot be changed at order entry). For example, Throat Culture defaults to Throat, locked; Wound Culture has no default. | |
| FR-N4 | **Capture.** In the samples table Body site cell (FR-D4). Side appears only for sites with a side. "Other" asks for free text up to 40 characters. | |
| FR-N5 | **One display string.** Wherever a sample is described, its specimen reads as sample type, site and side, for example "Swab, wound, left lower leg". That means: results entry and validation sample headers, the micro case header, sample search results, the order summary strip, and Sample Management. | |
| FR-N6 | **Patient report.** The current clinical and microbiology report templates show the specimen line with site and side. | |
| FR-N7 | **Labels.** A new optional label content field, **Body site**, prints the abbreviated site and side after the sample type, truncated to fit. | Label preset content (OGC-1218). |
| FR-N8 | **FHIR out.** `Specimen.collection.bodySite` carries the SNOMED CT coding when the site has one, and text including the side. The side is sent as a SNOMED CT laterality qualifier (Left 7771000, Right 24028007, Bilateral 51440002), in the form the OpenELIS FHIR implementation guide documents. | Today text only. |
| FR-N9 | **FHIR in and e-orders.** On Specimen intake and on electronic orders (via the referenced Specimen), body site is matched on code and system first and display text second. Laterality is mapped. An unmatched site is kept as free text and flagged. The order screen shows the received site for confirmation. | Today display text only, no laterality. |
| FR-N10 | **HL7 v2 in**, where that interface is used: SPM-8 maps to body site and SPM-9 to side. | |
| FR-N11 | **WHONET export.** An optional configured column carries the site (code or name) with side. Off by default. | |

---

## Information & Data

### Reused as is

| Information | Source |
|---|---|
| Order: lab number, request (order) date, received date, received time, status, priority, required-by date, program, provisional diagnosis, payment status, next visit date, test location code, requester sample identifier, billing reference number, contact tracing index name and number | Existing order record; received date and time are carried in the order data with no field bound today |
| EQA fields: program, provider sample ID, deadline, priority | PR #4282 |
| No-patient override record | OGC-1239 |
| Requested sample types on the order (tests without a sample) | Existing requested sample type records |
| Sample item: type of sample, quantity, unit, collection date, collector, collection method, specimen origin, temperature, conditions, GPS, lab performed sampling, received date, rejected and reason, voided and reason, external id, position, free-text container, source of sample, source other | Existing sample item |
| Aliquot relationship: parent, child, position, quantity transferred, remaining quantity | Existing |
| Test holding time; test sample handling (storage, Override Restricted) | Existing test catalog |
| Clinical Collection Method and Specimen Origin lists | Existing dictionaries |
| Source of sample list | Existing, becomes Body Sites |
| Sample storage assignment and movement; storage hierarchy | Shared Sample Storage model (OGC-657) |
| Referral per test, referral set, referral status, referred-out flag, reference laboratory | Existing |
| Non-conformity event and its sample and test links; resample | Existing |
| Consent record; sample acceptance checklist responses | Existing (S-09) |
| Label presets (per order and per sample), per-test preset links (default, maximum, allow override), label print records | OGC-285 |
| Provider title list (Providers admin) | Existing; inline use blocked on OGC-1223 (Dependency 26) |
| Result notification configuration per test | Existing (legacy OrderResultReporting) |
| Order attachments | Existing attachments component |
| Order entry, patient entry, site information and barcode settings in section M | Existing |

### Lifecycle

- **Order:** Entered → Samples prepared → Ready for testing (Sample check on) or complete (Sample check off). Any state before complete can go to Cancelled, with a reason.
- **Sample:** Proposed (unsaved) → Saved → Rejected (non-conformity) or Voided (with a reason; also covers order cancellation). Stored and Referred show alongside.
- **Test on an order:**
  - Not yet collected
  - Awaiting sample, which moves to and from Assigned (to one sample or aliquot)
  - Referred
  - Tested elsewhere
  - Cancelled (with a reason)
  - Paid (when billing is on)

### Uniqueness

- **Lab number** is unique in the deployment and never reused.
- **Sample suffix** is unique within its order; **aliquot suffix** is unique within its parent.
- **A test** is on at most one sample at a time.

---

## Access

Accessible via existing roles; no new permission names.

- **Reception** can use Enter Order and Prepare Samples, every per-sample action, Change lab number and Cancel order.
- **Laboratory technicians** (the existing Results role, verified on develop) can use Prepare Samples, add add-on tests, cancel a test with a reason, and its per-sample actions, and view Enter Order.
- **Refer out** is available to the Reception role, which holds the Sample Shipment Management module on develop, and to Global Administrator. Others see the Refer out icon and toolbar button disabled, with "You need referral access".
- **Sample check** can be completed by the role holding sample acceptance today (QA Officer, labelled "Sample Receiver"). Others see the step read-only.
- **Paid** can be toggled by Reception and Admin while billing is manual. Once a billing module sets it, it is read-only for everyone.
- **Container Types**, **Body Sites**, the test editor's Containers and Body site sections, and the Sample Type settings: Test Catalog Manager and Admin edit; others see them read-only.
- **Order Entry Configuration** and **Site Information**: Admin only.

- **Panel code** is edited in Panel Management by Test Catalog Manager and Admin. The **checklist item to field mapping** is Admin only (Compliance). **Removing an attachment** and **overriding label quantities** are available to Reception and the Results role.

Void sample, Change lab number, Cancel order, deviations and release overrides are all recorded with user, time and reason.

---

## Localization

Keys follow constitution Principle VII (Key Reuse & Hygiene). REUSE keys are verified in `frontend/src/languages/en.json` on develop (2026-09-25). NEW keys use the namespaces `order.nav`, `order.step`, `order.save`, `order.continue`, `order.summary`, `order.entry`, `order.tests`, `order.samples`, `order.prepare`, `order.referral`, `order.label`, `order.acceptance`, `order.dashboard`, `order.status`, `order.labNumber`, `order.config`, `order.billing`, `order.notify`, `admin.containerType`, `admin.bodySite`, `testCatalog.containers`, `testCatalog.bodySite`, `testCatalog.sampleType` and `admin.site`. Generic strings use `common.*`. Before minting, run `npm run i18n:find` for each NEW key.

| Key | English | Context | Reuse |
|---|---|---|---|
| `common.cancel` | Cancel | Many | REUSE |
| `common.save` | Save | Many | REUSE |
| `common.saving` | Saving... | Save in progress | REUSE |
| `common.retry` | Retry | Failed lookups, save unknown, printing | REUSE |
| `common.confirm` | Confirm | Void, change lab number | REUSE |
| `common.remove` | Remove | Row icon, test remove | REUSE |
| `common.status` | Status | Column | REUSE |
| `common.name` | Name | Column | REUSE |
| `common.category` | Category | Column | REUSE |
| `common.code` | Code | Column | REUSE |
| `common.active` | Active | Field | REUSE |
| `order.sampleCheck.release` | Release for testing | Sample check primary | NEW |
| `common.patient` | Patient | Section | REUSE |
| `common.tests` | Tests | Section, column | REUSE |
| `common.panels` | Panels | Chooser | REUSE |
| `common.sampleType` | Sample type | Column, filter | REUSE |
| `common.collected` | Collected | Column | REUSE |
| `common.received` | Received | Receipt | REUSE |
| `common.requester` | Requester | Section | REUSE |
| `common.priority` | Priority | Order section | REUSE |
| `common.program` | Program | Request details | REUSE |
| `common.provider` | Provider | Requester | REUSE |
| `common.labNumber` | Lab number | Order section | REUSE |
| `common.printLabel` | Print label | Row icon | REUSE |
| `common.quantity` | Quantity | Labels, aliquot | REUSE |
| `common.notes` | Notes | Expanded row | REUSE |
| `common.storageLocation` | Storage location | Column | REUSE |
| `common.referenceLab` | Reference lab | Refer out | REUSE |
| `common.inProgress` | In progress | Status, filter | REUSE |
| `common.completed` | Completed | Status | REUSE |
| `common.pending` | Pending | Status | REUSE |
| `common.deactivate` | Deactivate | Admin rows | REUSE |
| `common.createAliquot` | Create aliquot | Row icon | REUSE |
| `common.routine` | Routine | Priority option | REUSE |
| `order.priority` | Priority | Field label | REUSE |
| `order.requestDate` | Order date | Field label; English text becomes "Order date and time" | REUSE (text update) |
| `sample.requiredBy` | Required by | Field | REUSE |
| `order.provisionalDiagnosis` | Provisional diagnosis | Field | REUSE |
| `order.paymentStatus` | Payment status | Field | REUSE |
| `order.nextVisitDate` | Next visit date | Field | REUSE |
| `order.testLocationCode` | Sampling performed at | Field | REUSE |
| `order.remember.site.and.requester.label` | Remember site and requester | Requester | REUSE |
| `order.noPatient` | This order has no patient | Checkbox | REUSE |
| `order.noPatient.warning.title` | Results will not be evaluated against a reference range | Warning | REUSE |
| `order.noPatient.warning.subtitle` | Without a patient there is no age or sex ... | Warning | REUSE |
| `eqa.order.programme`, `eqa.order.providerSampleId`, `eqa.order.deadline`, `eqa.order.priority` | EQA fields | EQA | REUSE |
| `order.requester.fax.label`, `order.requester.email.label`, `order.requester.firstName.label`, `order.requester.lastName.label`, `order.requester.phone.label` | Provider fields | Inline provider | REUSE |
| `common.stat` | STAT | Priority option, summary Tag | NEW (common) |
| `common.discard` | Discard | Footer | NEW (common) |
| `common.undo` | Undo | Remove notifications | NEW (common) |
| `common.stay` | Stay | Leave prompt | NEW (common) |
| `common.reconnecting` | Reconnecting... | Connectivity | NEW (common) |
| `common.showCancelled` | Show cancelled | Tests, dashboard | NEW (common) |
| `common.showVoided` | Show voided | Samples | NEW (common) |
| `common.showDeactivated` | Show deactivated | Admin lists | NEW (common; replaces the per-feature duplicates) |
| `common.open` | Open | Dashboard | NEW (common) |
| `order.nav.saveExit` | Save and exit | Footer | NEW |
| `order.nav.saveNext` | Save and next | Footer | NEW |
| `order.nav.saveFinish` | Save and finish | Footer | NEW |
| `order.nav.discard.title` | Discard unsaved changes? | Modal | NEW |
| `order.nav.discard.body` | {tests} tests and {samples} samples entered on this page will be lost. | Modal | NEW |
| `order.nav.leave` | You have unsaved changes on this step. | Leave prompt | NEW |
| `order.step.enter` | Enter Order | Step | NEW |
| `order.step.prepare` | Prepare Samples | Step | NEW |
| `order.step.sampleCheck` | Sample check | Step | NEW |
| `order.step.notStarted` | Not started | Indicator | NEW |
| `order.step.attention` | Needs attention | Indicator | NEW |
| `order.step.done` | Done | Indicator | NEW |
| `order.save.nothingSaved` | Nothing was saved. {problem}. Your entries are still here. | Save failure | NEW |
| `order.save.unreachable` | Could not reach the server. | Save failure detail | NEW |
| `order.save.unknown` | We could not confirm the save. Retry to check. | Lost reply | NEW |
| `order.save.done` | Order {labNo} saved | Confirmation | NEW |
| `order.save.doneAwaiting` | Order {labNo} saved. Still awaiting a sample: {tests} | Confirmation | NEW |
| `order.save.conflict` | This order was changed by {user} at {time}. Reload to see their changes. | Conflict | NEW |
| `order.save.noTests` | {sample} has no test. Assign a test or remove the sample. | Save check (R-DATA-4) | NEW |
| `order.nav.discard.order` | Discard order | Modal primary, unsaved order | NEW |
| `order.nav.discard.changes` | Discard changes | Modal primary, saved order | NEW |
| `order.save.problems` | Fix these before saving: {problems} | Pre-save check | NEW |
| `order.save.restored` | Unsaved entries from {time} were restored. | Restored work | NEW |
| `order.continue.heading` | To continue to {step} | Checklist | NEW |
| `order.continue.count` | {count} items needed to continue | Beside Save and next | NEW |
| `order.continue.item.patient` | Select or create the patient | Item | NEW |
| `order.continue.item.test` | Add at least one test | Item | NEW |
| `order.continue.item.facility` | Add the requesting facility | Item | NEW |
| `order.continue.item.provider` | Add the requesting provider | Item | NEW |
| `order.continue.item.nationalId` | National ID for the new patient | Item | NEW |
| `order.continue.item.receipt` | Received date and time | Item | NEW |
| `order.continue.item.container` | Container type for {sample} | Item | NEW |
| `order.continue.item.collector` | Collector for {sample} | Item | NEW |
| `order.continue.item.collectionTime` | Collection date and time for {sample} | Item | NEW |
| `order.continue.item.bodySite` | Body site for {sample} | Item | NEW |
| `order.continue.item.choice` | Choose a sample for {test} | Item | NEW |
| `order.continue.item.consent` | Record consent | Item | NEW |
| `order.continue.item.confirmTime` | Confirm the time for {sample} | Item | NEW |
| `order.summary.noPatient` | No patient selected | Summary strip | NEW |
| `order.summary.tests` | {count} tests: {withSample} with sample, {awaiting} awaiting, {referred} referred | Summary strip | NEW |
| `order.summary.samples` | {count} samples, {stored} stored | Summary strip | NEW |
| `order.labNumber.scan` | Or scan a pre-printed label | Order section | NEW |
| `order.labNumber.taken` | Lab number {labNo} is already used by order {holder}. | Clash | NEW |
| `order.labNumber.change` | Change lab number | Saved order | NEW |
| `order.labNumber.change.confirm` | {old} becomes {new}. Print new labels for every tube. | Confirmation | NEW |
| `order.labNumber.change.reason` | Reason for changing the lab number | Field | NEW |
| `order.entry.section.order` | Order | Section | NEW |
| `order.entry.section.requestDetails` | Request details | Section | NEW |
| `order.entry.section.received` | Samples received with this order | Section | NEW |
| `order.entry.section.billing` | Billing and notifications | Section | NEW |
| `order.entry.eqa` | EQA sample | Checkbox | NEW |
| `order.entry.noPatient.disabled` | A patient is required by Order Entry Configuration. | Disabled reason | NEW |
| `order.entry.patient.createNew` | Create new patient | After search | NEW |
| `order.entry.patient.searchFailed` | Search failed. Check the connection and try again. | Failure | NEW |
| `order.entry.facility.addNew` | Add new facility | After empty search | NEW |
| `order.entry.provider.addNew` | Add new provider | After empty search | NEW |
| `order.entry.provider.title` | Title | Inline provider | NEW |
| `order.entry.addNew.restricted` | Adding new entries here is turned off in Order Entry Configuration. | Disabled reason | NEW |
| `order.entry.requiredBy.beforeOrder` | Required by cannot be before the order date. | Validation | NEW |
| `order.entry.date.future` | {field} cannot be in the future. | Validation | NEW |
| `order.entry.received.toggle` | Samples received with this order | Switch | NEW |
| `order.entry.received.by` | Received by | Receipt | NEW |
| `order.entry.received.locked` | Saved samples are voided one at a time from the table. | Locked switch reason | NEW |
| `order.entry.received.offConfirm` | Remove the {count} samples entered? | Confirm | NEW |
| `order.tests.filter.labUnit` | Lab unit | Chooser filter | NEW |
| `order.tests.filter.allLabUnits` | All lab units | Filter option | NEW |
| `order.tests.search.tests` | Search tests by name, code or LOINC | Chooser | NEW |
| `order.tests.search.panels` | Search panels by name or LOINC | Chooser | NEW |
| `order.tests.addByCode` | Add by code | Fast path | NEW |
| `order.tests.addByCode.none` | No active test or panel has code {code}. | Fast path error | NEW |
| `order.tests.paging` | Showing {from} to {to} of {total} | Chooser | NEW |
| `order.tests.table.heading` | Ordered tests | Table | NEW |
| `order.tests.col.expected` | Expected container | Column | NEW |
| `order.tests.col.sample` | Sample | Column | NEW |
| `order.tests.col.testedElsewhere` | Tested elsewhere | Column | NEW |
| `order.tests.testedElsewhere.help` | Result reported by another laboratory | Helper | NEW |
| `order.tests.col.paid` | Paid | Column | NEW |
| `order.tests.notCollected` | Not yet collected | Sample cell | NEW |
| `order.tests.awaiting` | Awaiting sample | Sample cell, filter | NEW |
| `order.tests.referredTo` | Referred to {lab} | Sample cell | NEW |
| `order.tests.testedElsewhereAt` | Tested elsewhere: {lab} | Sample cell | NEW (replaces the External Lab IDs FRS "performed upstream" wording) |
| `order.tests.chooseSample` | Choose a sample | Sample cell | NEW |
| `order.tests.assignedByYou` | Assigned by you | Marker | NEW |
| `order.tests.panelModified` | Modified | Panel Tag | NEW |
| `order.tests.panelCount` | {panel}, {included} of {total} tests | Panel header | NEW |
| `order.tests.memberRemoved` | {test}, removed by {user} {time} | Struck-through member | NEW |
| `order.tests.panelChip` | {panel} {included}/{total} | Chooser chip | NEW |
| `order.tests.panelRemoved` | Removed {panel} and {count} of its tests. | Undo notification | NEW |
| `order.tests.cancel.reason` | Reason for cancelling this test | Field | NEW |
| `order.tests.noContainer` | No container set in the test catalog | Cell | NEW |
| `order.samples.proposedFor` | Proposed for {tests} | Proposed Tag tooltip | NEW |
| `order.samples.edited` | Edited | Marker | NEW |
| `order.samples.proposalChanged` | Added {count} {container} for {test} | Notification | NEW |
| `order.samples.proposedUnconfirmed` | Proposed, not yet confirmed | Banner | NEW |
| `order.samples.col.number` | Sample number | Column | NEW |
| `order.samples.col.container` | Container | Column | NEW |
| `order.samples.col.bodySite` | Body site | Column | NEW |
| `order.samples.notStored` | Not stored | Storage cell | NEW |
| `order.samples.fillAll` | Fill all | Collected header | NEW |
| `order.samples.me` | Me | Collector shortcut | NEW |
| `order.samples.collectedElsewhere` | Collected elsewhere, collector unknown | Collector option | NEW |
| `order.samples.defaulted` | Defaulted, confirm | Time marker | NEW |
| `order.samples.add` | Add sample | Toolbar | NEW (replaces the Collect page key being removed) |
| `order.samples.addCount` | Number of samples | Add sample | NEW |
| `order.samples.scan` | Scan a sample label | Toolbar | NEW |
| `order.samples.store` | Store | Toolbar | NEW |
| `order.samples.printLabels` | Print labels | Toolbar | NEW |
| `order.samples.applyTo` | Apply to these samples: {samples} | Toolbar confirm | NEW |
| `order.samples.empty` | No samples yet. Add a sample or scan a label. | Empty state | NEW |
| `order.samples.void` | Void | Row icon on saved sample | NEW |
| `order.samples.void.reason` | Reason for voiding | Field | NEW |
| `order.samples.status.stored` | Stored | Tag | NEW |
| `order.samples.status.referred` | Referred | Tag, filter | NEW |
| `order.samples.status.nonconformity` | Non-conformity | Tag | NEW |
| `order.samples.status.rejected` | Rejected | Tag | NEW |
| `order.samples.status.voided` | Voided | Tag | NEW |
| `order.samples.status.aliquot` | Aliquot | Tag | NEW |
| `order.samples.status.pendingSave` | Pending save | Tag | NEW |
| `order.samples.referralAccess` | You need referral access | Disabled reason | NEW |
| `order.prepare.consent.heading` | Consent | Section | NEW |
| `order.prepare.holdingTime.left` | {time} left | Tag | NEW |
| `order.prepare.holdingTime.exceeded` | Holding time exceeded | Tag, NCE prefill | NEW |
| `order.prepare.holdingTime.fromReceipt` | Counted from receipt (collection time unknown) | Tag helper | NEW |
| `order.prepare.side` | Side | Body site | NEW |
| `order.prepare.side.left` | Left | Option | NEW |
| `order.prepare.side.right` | Right | Option | NEW |
| `order.prepare.side.bilateral` | Bilateral | Option | NEW |
| `order.prepare.bodySite.other` | Other site | Field | NEW |
| `order.prepare.incompatible` | {test} expects {expected}. This is {actual}. | Warning | NEW |
| `order.prepare.recordDeviation` | Assign and record deviation | Warning action | NEW |
| `order.prepare.awaitingBanner` | These tests have no sample yet and stay on the order as Awaiting sample: {tests} | Banner | NEW |
| `order.prepare.aliquot.count` | Number of aliquots | Aliquot form | NEW |
| `order.prepare.aliquot.overdrawn` | Aliquots total {total}, more than the {remaining} left in {sample}. | Error | NEW |
| `order.prepare.afterReceipt` | Collection time is after receipt. | Warning | NEW |
| `order.prepare.afterReceipt.confirm` | Confirm: collection time is after receipt | Checkbox | NEW |
| `order.referral.testsToRefer` | Tests to refer | Refer panel | NEW |
| `order.referral.reason` | Reason for referral | Refer panel | NEW |
| `order.referral.partial` | Tests not referred stay here, but this tube leaves the laboratory. | Warning | NEW |
| `order.referral.aliquotFirst` | Aliquot first | Action | NEW |
| `order.referral.existing` | Already referred to {lab} on {date} | Existing referral | NEW |
| `order.referral.dispatchLater` | Dispatch the shipment after saving, from Sample Shipment. | Helper | NEW |
| `order.label.addType` | Add label type | Labels section | NEW |
| `order.entry.section.attachments` | Attachments | Section | NEW |
| `order.attachments.showRemoved` | Show removed | Attachments | NEW |
| `order.attachments.removeReason` | Reason for removing this attachment | Attachments | NEW |
| `order.step.attention.rejected` | Sample {sample} rejected | Needs attention reason | NEW |
| `order.step.attention.newTest` | {test} has no sample | Needs attention reason | NEW |
| `order.step.attention.holdingTime` | Holding time exceeded on {sample} | Needs attention reason | NEW |
| `order.continue.countOne` | 1 item needed to continue | Singular | NEW |
| `order.tests.member.onSample` | On {sample} | Panel member status | NEW |
| `order.tests.member.removed` | Removed | Panel member status | NEW |
| `testCatalog.containers.ownContainer.help` | Shares a container only with tests of its own panel | Helper | NEW |
| `order.label.section` | Labels | Section | NEW |
| `order.label.sampleLabels` | Sample labels | Grid heading | NEW |
| `order.label.showAll` | Show all label types | Toggle | NEW |
| `order.label.printColumn` | Print column | Column action | NEW |
| `order.label.printRow` | Print row | Row action | NEW |
| `order.label.total` | {count} labels in total | Section footer | NEW |
| `order.label.fromPreset` | {qty}, preset default | Quantity source | NEW |
| `order.label.changedBy` | {qty}, changed by {user} | Quantity source | NEW |
| `order.label.changed` | Changed | Marker | NEW |
| `order.label.overrideOff` | Label quantities cannot be changed at order entry (Order Entry Configuration). | Lock reason | NEW |
| `order.samples.heading` | Samples for {labNo} | Table heading | NEW |
| `order.tests.proposed` | Proposed | Outlined badge | NEW |
| `common.edit` | Edit | Folded section | REUSE |
| `common.addTests` | Add tests | Folded chooser | REUSE |
| `testCatalog.sampleType.primary` | Primary | Test editor | NEW |
| `testCatalog.sampleType.secondary` | Secondary | Test editor | NEW |
| `testCatalog.sampleType.secondaryVia` | {sampleType}, via {container}, used as {primary} | Test editor | NEW |
| `testCatalog.sampleType.usage` | Primary for {primary} tests, secondary for {secondary} tests | Sample Type screen | NEW |
| `order.label.orderLabels` | Order labels | Order section | NEW |
| `order.label.printOrder` | Print order labels | Order section | NEW |
| `order.label.printAll` | Print all labels | Footer area | NEW |
| `order.label.fromTest` | {qty}, from {test} | Quantity source | NEW |
| `order.label.locked` | Set by {test} in the test catalog | Lock reason | NEW |
| `order.label.afterSave` | Prints after save | Unsaved rows | NEW |
| `order.label.failed` | The label file could not be generated. The order is saved. | Notification | NEW |
| `order.label.downloaded` | The print window was blocked, so the labels were downloaded instead. | Notification | NEW |
| `order.sampleCheck.answered` | {answered} of {total} answered | Row status | NEW |
| `order.sampleCheck.failedCount` | {count} failed | Row status | NEW |
| `order.sampleCheck.notRecorded` | Not recorded. Add it in Prepare Samples. | Evidence | NEW |
| `order.sampleCheck.minVolume` | {test} needs at least {volume} | Evidence | NEW |
| `order.sampleCheck.totalVolume` | Tests on this sample need {total} in all; recorded {recorded} | Evidence | NEW |
| `order.sampleCheck.panels.heading` | Ordered panels and tests | Sample check section | NEW |
| `order.sampleCheck.return` | Return to Prepare Samples | Secondary action | NEW |
| `order.sampleCheck.return.reason` | Reason for returning | Field | NEW |
| `order.sampleCheck.disabled.incomplete` | Prepare Samples is not complete: {items} | Disabled reason | NEW |
| `order.sampleCheck.disabled.failed` | {item} failed on {sample}. Report a non-conformity or request a new sample. | Disabled reason | NEW |
| `order.sampleCheck.proceedReason` | Reason for releasing with unanswered items | Field | NEW |
| `order.dashboard.filter.notStored` | Not stored | Filter | NEW |
| `order.dashboard.filter.awaitingSampleCheck` | Awaiting sample check | Filter | NEW |
| `order.dashboard.filter.unpaid` | Unpaid | Filter | NEW |
| `order.dashboard.referralLine` | {count} tests referred to {lab}, {status} | Dashboard row | NEW |
| `order.dashboard.filter.hasReferred` | Has referred tests | Filter | NEW |
| `order.dashboard.filter.referralPending` | Referral results pending | Filter | NEW |
| `order.step.doneAt` | Done {time} | Progress indicator | NEW |
| `order.step.toDo` | {count} to do | Progress indicator | NEW |
| `order.step.savedToDo` | Saved, {count} to do | Progress indicator | NEW |
| `order.step.ready` | Ready | Progress indicator | NEW |
| `order.dashboard.search` | Search by lab number, patient or referring lab number | Dashboard | NEW |
| `order.dashboard.cancelOrder` | Cancel order | Row action | NEW |
| `order.dashboard.cancel.reason` | Reason for cancelling | Field | NEW |
| `order.dashboard.modifyMoved` | Modify Order has moved here. Open an order to change it. | Notice | NEW |
| `order.status.entered` | Entered | Tag | NEW |
| `order.status.samplesPrepared` | Samples prepared | Tag | NEW |
| `order.status.readyForTesting` | Ready for testing | Tag | NEW |
| `order.status.cancelled` | Cancelled | Tag, filter | NEW |
| `order.config.emptyList` | No {list} are set up yet. An administrator can add them in {adminPage}. | Empty configuration | NEW |
| `order.clock.drift` | This computer's clock is {minutes} minutes off. Times are taken from the laboratory server. | Notice | NEW |
| `order.billing.reference` | Billing reference | Field (label overridable by setting) | NEW |
| `testCatalog.panel.code` | Panel code | Panel Management | NEW |
| `order.billing.paid` | Paid | Toggle | NEW |
| `order.billing.paidExternal` | Set by the billing system | Read-only reason | NEW |
| `order.notify.patient` | Notify patient | Test row | NEW |
| `order.notify.provider` | Notify provider | Test row | NEW |
| `order.notify.email` | Email | Channel | NEW |
| `order.notify.sms` | SMS | Channel | NEW |
| `order.contactTracing.indexName` | Index case name | Field | NEW |
| `order.contactTracing.indexNumber` | Index case record number | Field | NEW |
| `admin.containerType.title` | Container Types | Page | NEW |
| `admin.containerType.domain` | Domain | Column, field | NEW |
| `admin.containerType.additive` | Additive | Column | NEW |
| `admin.containerType.material` | Material | Column | NEW |
| `admin.containerType.volume` | Nominal volume | Column | NEW |
| `admin.containerType.cap` | Cap colour | Column | NEW |
| `admin.containerType.capName` | Colour name | Field | NEW |
| `admin.containerType.yields` | Sample types it yields | Column | NEW |
| `admin.containerType.standardCode` | Standard code | Field | NEW |
| `admin.containerType.usedBy` | Used by | Column | NEW |
| `admin.containerType.deactivate.warn` | Used by {count} tests ({names}) and {samples} samples. Existing samples keep it; it can no longer be proposed or chosen. | Warning | NEW |
| `admin.bodySite.title` | Body Sites | Page | NEW |
| `admin.bodySite.codeSystem` | Code system | Field | NEW |
| `admin.bodySite.hasSide` | Has a side | Field | NEW |
| `admin.bodySite.sortOrder` | Sort order | Field | NEW |
| `testCatalog.containers.heading` | Containers | Test editor | NEW |
| `testCatalog.containers.preferred` | Preferred | Tag | NEW |
| `testCatalog.containers.alternate` | Alternate | Tag | NEW |
| `testCatalog.containers.count` | Count | Field | NEW |
| `testCatalog.containers.minVolume` | Minimum volume | Field | NEW |
| `testCatalog.containers.ownContainer` | Needs its own container | Checkbox | NEW |
| `testCatalog.containers.usedAs` | Used as {sampleType} | Option, Tag | NEW |
| `testCatalog.containers.yieldsGroup` | Yield {sampleType} | Picker group | NEW |
| `testCatalog.containers.usedAsGroup` | Can be used as {sampleType} for this test | Picker group | NEW |
| `testCatalog.bodySite.heading` | Body site | Test editor | NEW |
| `testCatalog.bodySite.default` | Default body site | Field | NEW |
| `testCatalog.bodySite.lock` | Lock at order entry | Checkbox | NEW |
| `testCatalog.sampleType.defaultContainer` | Default container type | Field | NEW |
| `testCatalog.sampleType.bodySite` | Body site | Field | NEW |
| `testCatalog.sampleType.bodySite.notUsed` | Not used | Option | NEW |
| `testCatalog.sampleType.bodySite.optional` | Optional | Option | NEW |
| `testCatalog.sampleType.bodySite.required` | Required | Option | NEW |
| `testCatalog.sampleType.allowedSites` | Allowed body sites | Field | NEW |
| `admin.orderEntry.acceptance.label` | Sample acceptance checklist (clinical) | Config | NEW |
| `admin.orderEntry.acceptance.help` | Off also hides the Sample check step. | Config helper | NEW |
| `admin.site.timeZone` | Laboratory time zone | Site Information | NEW |
| `admin.site.timeZone.help` | Set by the distribution configuration | Site Information | NEW |

Container type, body site and category names in seed data are data, translated through the existing localization mechanism, not UI keys.

---

## Dependencies

1. **Container Type (new data):**
   - name, code, domain (one or more of Clinical, Environmental, Vector; never a combined value, D-004)
   - additive, material, nominal volume and unit, cap colour and name, category
   - the sample types it yields, an optional standard code, and active

   The sample's existing free-text container field, shared by all three domains, links to it; existing values stay readable. A migration adds the domain values (D-030).
2. **Test expected containers (new data):** an ordered list of container types per test, each preferred or alternate, with a count, optional minimum volume and unit, and a "can be used as the test's sample type" flag on alternates. Also a test-level "needs its own container" flag. This reverses the multi-sample spec's out-of-scope line on expected counts.
3. **Sample type settings (new data):** default container type; body site Not used, Optional or Required; allowed body sites.
4. **Body sites (new data on the existing list):** code, code system, translated names, "has a side", sort order, active; the description length made consistent (the database allows 40, the mapping 20). Legacy clean-up per FR-N1.
5. **Laterality (new data):** one value per sample (left, right, bilateral, or none).
6. **Test default body site (new data):** per test, with a lock flag.
7. **Lab number defects:**
   - the "no increment" path increments;
   - the year-number format relies on an in-memory list that is not shared across servers and is lost on restart;
   - the new flow does not call lab number format validation.
8. **Whole-step save.** The backend accepts one step's full content in one operation and rejects duplicate submission. This replaces: the storage assignment loop, the fire-and-forget storage-skipped call, the separate referral save, and label requests and override records written after commit.
9. **Order progress status (new data):** Entered, Samples prepared, Ready for testing, Cancelled, with a reason. Plus per-step progress: for each step, whether it is complete, the time of the save that completed it, and a Needs attention flag with its reason. Needs attention is raised when, after the step was complete, a sample on it is rejected or voided, a test is added that has no sample, or a holding time is exceeded. Plus the unused lab number record (user, time), the receiver on the order (FR-B23), the collection-after-receipt confirmation (who, when), the Optional-acceptance proceed record (who, when, why), and per-test panel provenance.
10. **Shared components.** Reused and fenced (D-063):
    - the patient search panel (OGC-1197)
    - the storage location picker (OGC-657)
    - the inline non-conformity form
    - the referral form
    - label presets (OGC-285)

    The storage picker, non-conformity form and referral form gain a mode that returns data to the page instead of saving on their own (FR-E5). That is a change to each component. The patient search panel changes as FR-B5 and FR-B6 describe.
11. **External Lab IDs and Upstream Results FRS** owns the referring laboratory number and tested-elsewhere behaviour (its "upstream" wording is replaced by "tested elsewhere"). Its open question on e-orders carrying results still applies.
12. **Pre-seed data:** Appendix A containers; default container per seeded sample type; the cleaned body site list.
13. **Catalog-wide test and panel search.** A server-paged search over tests (name, code, LOINC) and panels (name, panel code, LOINC), with lab unit and optional sample type filters, returning each item's type, sample types and lab unit. Panel sample types come from SAMPLETYPE_PANEL (D-029).
14. **Label preset blockers and migration:**
    - Blockers: OGC-1227 (presets cannot be edited), OGC-1219 (preset migration discards dimensions and quantities), OGC-1218 (content editor, including the body site field), OGC-1217 (pre-printed setting), and OGC-988 and OGC-761 (catalog picker limited to four presets).
    - Migration: the `numDefault*` and `numMax*` counts move into preset defaults.
15. **Fix now** (QA handoff; the new screens reuse this code):
    - the app-shell session check (FR-K1)
    - the requested sample type never marked fulfilled (FR-I8)
    - panel attached from a member test, where the save infers panels order-wide (FR-B16)
    - `/rest/test-sample-types` returning empty (FR-K13)
    - server protection against repeated order saves and storage-skipped (FR-K3, FR-K5)
    - date validation against the laboratory's local date (FR-K9)
    - HTTP 500 on sample type names over 40 characters (OGC-1171)
    - ISO dates rejected by the order API (OGC-1135)
    - silent referral transitions (OGC-1215)
16. **Laboratory time zone** in the distribution configuration (FR-K8a).
17. **Legacy retirement prerequisites.** These must land before `/SamplePatientEntry` is removed:
    - electronic orders in the new flow (OGC-1239 Part A)
    - result notification choices (FR-B29)
18. **Dead settings.** `Patient ID required` and `supportPatientNationality` have no effect anywhere and are removed with a migration note.
19. **Downstream body site and laterality.** Changes to results and validation headers, the micro case header, sample search, the patient report templates, label content, FHIR in and out, HL7 v2 intake and WHONET export (section N).
20. **Coordination:**
    - Sample Type Management v2.1 (OGC-296, OGC-538) hosts the FR-G7 and FR-N2 fields.
    - Test Catalog Completion v2 (OGC-949) hosts the Containers and Body site sections.
    - Both FRSs get a cross-reference.
21. **Billing integration.** The Paid indicator is manual until Odoo or a future billing module sets it. That integration is future work.
22. **Panel code (new data):** a unique code per panel, edited in Panel Management (v2.2) and loaded by the catalog CSV loader, with a migration leaving existing panels without a code until set.
23. **Per-test paid flag (new data):** paid yes or no per ordered test, its source (manual or billing system), who set it and when (FR-B28).
24. **Panel membership changes (new data):** per ordered panel, which members were deselected, by whom and when (FR-B16a).
25. **Further records:** the test cancel reason; the Return to Prepare Samples record (who, when, why); lab number change history, with the old sample numbers kept against each sample (FR-C4, FR-H3); the confirmation of a defaulted collection time (who, when).
26. **Provider title in order entry** is blocked on OGC-1223 landing on develop (FR-B9).
27. **Checklist item to field mapping (new data):** each sample acceptance checklist item can name the sample field it checks (identity, container, quantity, collection time, received time, holding time, body site, condition), so Sample check shows the evidence beside it (FR-F3b). It is set in Admin → Compliance → Sample Acceptance Checklist. Checklist answers are recorded per sample; if the existing S-09 responses are per order, per-sample responses are new data.
28. **Attachment deactivation (new data):** active flag, reason, who and when on each order attachment (FR-B31). The attachments component gains a "Show removed" view; that is a change to it.
29. **Per-aliquot label default (new data):** each label preset gains an optional per-aliquot default; the existing aliquot label default count migrates into it (FR-I5a).
30. **Reason lists (new data):** three short, translatable lists (cancel test, cancel order, change lab number), managed as dictionary categories in the existing Dictionary Menu, each with "Other" plus free text (FR-B21, FR-A4, FR-H3).
31. **Numbering migration:** saved samples keep their existing numbers; new samples on any order use `-n` and `-n.m`. Search, scan and the label printer accept both forms. There is one aliquot level (no aliquot of an aliquot) (FR-C4).

---

## Superseded positions and proposed decisions

The highest decision ID in the repository copy was D-069 on 2026-09-25. The IDs below are provisional; re-check before writing.

| Earlier position | Source | Replaced by |
|---|---|---|
| Four clinical steps (Enter, Collect, Label and Store, QA Review) | Sample Collection Redesign v2.0; Order Entry FRS v3 | Two steps plus optional Sample check |
| No test matching step 1 to step 2 (26 Jun 2026) | Order Entry FRS v3 §4.1.1 | Assignment in the ordered tests table (FR-D5, D6) |
| No expected sample count per test in the catalog | Multi-sample order entry | Expected containers (FR-G5) |
| Refer Out on the Label and Store step | Referral addendum v2.1 | Per-sample and multi-sample Refer out (FR-E2) |
| New Patient mode up front on Add Order | Patient search FRS (OGC-1197) | Create after a successful search (FR-B5) |
| Separate Modify Order screen | Current app | Edit through the steps (FR-H3) |
| Fixed "2 order labels plus 1 per specimen" | Barcode configuration | Presets and test links (FR-I4) |
| Save Draft | Current new flow | Save and exit (FR-A1) |
| Collector defaults to the signed-in user or the requester | Current new flow | Collector never defaulted (FR-C3) |
| Removing a panel keeps its tests | Environmental order entry v2 §5.1.6.B | Removed with Undo (FR-B16), all domains |

| Provisional ID | Decision | Scope |
|---|---|---|
| D-070 | A container type is separate from sample type. It yields one or more sample types, its identity is additive plus material (preservative for environmental), it carries a domain, and its cap colour is display-only. The sample's container field links to it. | GLOBAL |
| D-071 | Proposed samples use the sharing rule, and the system never overwrites a value the user changed. | FEATURE |
| D-072 | One order entry save is one all-or-nothing operation covering everything on the step. Printing and dispatch follow the save and never undo it. | GLOBAL |
| D-073 | The ordered tests table, samples table and summary strip are shared, domain-neutral components in every order entry domain. | GLOBAL |
| D-074 | Order entry has two levels of required (save and complete). A disabled Save and next always shows the To continue checklist. | GLOBAL |
| D-075 | The current moment comes from the server clock. Every default is in the laboratory time zone set by the distribution. The browser clock is never used. | GLOBAL |
| D-076 | An alternate container can be used as the test's sample type. The test keeps one sample type (D-028); the sample keeps its true type. | GLOBAL |
| D-077 | A saved order is changed through its order entry steps. Lab number reassignment is deliberate, reasoned and recorded. | FEATURE |
| D-078 | Required data sits on the row, never behind an expansion; everyday row actions are one click. | GLOBAL |
| D-080 | A panel always shows its full membership wherever an order is shown; a modified panel says so, removed members stay listed with who removed them, and the Sample check step shows panels expanded. | GLOBAL |
| D-081 | Panels carry a unique panel code. | GLOBAL |
| D-082 | Clinical sample numbers are `{labNo}-{n}`; aliquots are `{labNo}-{n}.{m}`, one aliquot level. One scheme on every clinical screen, label and report; environmental and vector follow once their alignment decides pool numbering. | FEATURE |
| D-083 | Product wording: "Tested elsewhere" replaces "upstream"; the optional last step is "Sample check", its action "Release for testing", its status "Ready for testing". | GLOBAL |
| D-084 | Order entry labels are edited in one Labels section: order labels plus a sample-by-preset grid, over every active preset, with test catalog defaults and overrides within limits. | GLOBAL |
| D-079 | Body site is configured on the sample type (Not used, Optional, Required, allowed sites), with a test-level default. Laterality is a separate value, and both travel to reports, labels, FHIR and WHONET. | GLOBAL |

---

## Docs impact

These published manual pages drift when this ships. Each needs re-capture and re-verification under the Feature Doc for the v4 Epic:

- **Changed pages:**
  - Clinical order entry: Enter Order and Prepare Samples.
  - QA Review, now Sample check.
  - Order Entry Configuration (acceptance label).
  - Site Information (time zone).
- **Retired pages** (replaced by Prepare Samples and editing through the steps):
  - Collect.
  - Label and Store.
  - Modify Order.
- **Also changed:** the order dashboard; Barcode Configuration (label counts migrated); Patient Entry Configuration (dead settings removed); Label Presets; Sample Shipment (samples marked for shipment); Sample Type settings; and the pages that show the specimen string (results entry, validation, micro case, sample search, Sample Management, patient report).
- **New pages:**
  - Container Types.
  - Body Sites.
  - The Test editor's Containers and Body site sections.

Docs status: pending. A spec-registry row is to be added on approval. Its footprint:

- **Entities:**
  - Sample, SampleItem
  - container type (new), test expected containers (new), body site fields (new), order progress status (new)
  - Referral, NCE, storage, label presets
- **Routes:** `/order/clinical/*`, `?entity=containertypes`, `?entity=bodysites`.

---

## Out of Scope

- **Environmental and vector screen changes**, beyond the shared contracts in section L (see the alignment note).
- **Counting rules for results tested elsewhere.** These are owned by the External Lab IDs FRS.
- **Referral of a whole order before any sample exists.**
- **Collection lists and phlebotomy rounds.**
- **Patient merge and duplicate resolution.**
- **Full SNOMED CT body-structure search.** Body sites use the curated list.
- **Minimum-volume enforcement.** The value is stored and displayed, never blocking.
- **The incoming electronic orders queue** (OGC-1073). FR-B17 covers opening one order.
- **Configurable additional patient and order information** (OGC-1144), beyond where it sits.
- **Billing integration** with Odoo or a billing module. The Paid indicator is manual for now.
- **Layout changes to the patient registration form itself.**

---

## Settled decisions and defaults

Settled by Casey on 2026-09-25:

- **Samples and steps:**
  - Container separate from sample type.
  - Shared tubes (netting).
  - Lab number reserved on load.
  - Sample check hidden when the setting is Off.
  - Body site as a coded list plus Other.
  - Awaiting sample with NCE reject.
- **Time:**
  - Server clock with laboratory time zone from the distribution.
  - Warn and confirm when collection is after receipt.
- **Catalog:** equivalent sample types.
- **Editing:** edit through the steps.
- **Legacy features and billing:**
  - Keep result notifications, billing reference and contact tracing.
  - Add a Paid indicator bundled with billing.
- **Collection time:** auto-fill as a visible default.
- **Panels:** removing a panel removes its tests, with Undo.
- **Layout:** the v0.4 layout rework.

Settled by Casey on 2026-09-26:

- **Panel code:** panels gain a unique code, so Add by code works for panels.
- **Own-container tests:** share a container only within their panel.
- **Panel integrity:** panels always show full membership with a Modified marker, and the Sample check step shows panels expanded, never as chips.

Settled by Casey on 2026-09-26 (continued):

- **Terminology:** "Tested elsewhere"; "Sample check", "Release for testing", "Ready for testing".
- **Numbering:** `-1`, `-2` for samples, `-1.1` for the first aliquot of `-1`, with the suffix shown first on screen.
- **Labels:** a dedicated Labels section over every active preset, with test defaults and overrides.
- **Secondary sample types** are shown on the test editor and the Sample Type screen.
- **Labels are not tracked:** no generated or printed status anywhere.
- **Progress indicator:** clear done, current and attention states, labels never truncated.
- **Split orders:** referred and in-laboratory tests are tracked separately on the dashboard.
- **No duplication:** the proposal reason appears once, in the ordered tests table; that table shows actual versus proposed assignment.

Defaults taken as agreed unless changed:

- Unsaved work is kept per user on the device for 24 hours.
- Label combining uses the highest default and the highest maximum.
- One test's lock locks the combined row.
- Sample-level presets combine per sample.
- The holding-time Tag turns warm-gray with a warning icon at 20% remaining.
- Reference data refreshes at most every 15 minutes.

---

## Appendix A: pre-seeded container types (clinical domain)

Cap colours are ISO 6710 defaults. Sites using the European colour code edit the colour. Sample types that do not exist in a deployment are skipped, not created. Lithium heparin and plasma separator tubes are commonly used as serum-equivalent for chemistry tests; that is set per test (FR-G6), not here. "Other (specify)" yields every sample type.

| Category | Container type | Additive | Default cap | Yields |
|---|---|---|---|---|
| Blood | K2EDTA tube 4 mL | K2EDTA | Lavender | Whole blood, Plasma |
| Blood | K2EDTA tube 2 mL (paediatric) | K2EDTA | Lavender | Whole blood, Plasma |
| Blood | EDTA microtainer | K2EDTA | Lavender | Whole blood |
| Blood | Sodium citrate 3.2% tube | Sodium citrate | Light blue | Plasma (citrated) |
| Blood | Plain serum tube | Clot activator | Red | Serum |
| Blood | Serum separator tube (SST) | Clot activator, gel | Gold | Serum |
| Blood | Lithium heparin tube | Lithium heparin | Green | Plasma, Whole blood |
| Blood | Plasma separator tube (PST) | Lithium heparin, gel | Light green | Plasma |
| Blood | Sodium heparin tube | Sodium heparin | Dark green | Whole blood, Plasma |
| Blood | Fluoride oxalate tube | Sodium fluoride, potassium oxalate | Grey | Plasma |
| Blood | Trace element tube | None or K2EDTA | Royal blue | Serum, Whole blood |
| Blood | ACD tube | Acid citrate dextrose | Yellow | Whole blood |
| Blood | ESR tube | Sodium citrate | Black | Whole blood |
| Blood | Dried blood spot card | None | None | Dried blood spot |
| Blood | Capillary tube | Heparin or none | None | Whole blood |
| Blood culture | Aerobic blood culture bottle | Broth | Blue | Blood (culture) |
| Blood culture | Anaerobic blood culture bottle | Broth | Purple | Blood (culture) |
| Blood culture | Paediatric blood culture bottle | Broth | Pink | Blood (culture) |
| Swab | Dry swab | None | None | Swab |
| Swab | Amies gel transport swab | Amies gel | Blue | Swab |
| Swab | Liquid Amies flocked swab (ESwab) | Liquid Amies | White | Swab |
| Swab | Viral transport medium tube with swab | VTM | Red | Swab (viral) |
| Swab | Molecular transport tube with swab | Inactivating medium | Orange | Swab (molecular) |
| Urine | Sterile urine container | None | White | Urine |
| Urine | Boric acid urine tube | Boric acid | Red | Urine |
| Urine | 24-hour urine container | None or preservative | Orange | Urine (24 h) |
| Urine | Urine molecular transport tube | Preservative | Yellow | Urine (molecular) |
| Stool | Stool container | None | Brown | Stool |
| Stool | Cary-Blair transport | Cary-Blair | Orange | Stool (culture) |
| Stool | Formalin or SAF vial | Formalin or SAF | Green | Stool (parasitology) |
| Respiratory | Sputum container | None | Red | Sputum |
| Other | Sterile CSF tube | None | White | CSF |
| Other | Sterile container | None | White | Body fluid, Tissue |
| Other | Microscope slide | None | None | Smear |
| Other | Other (specify) | None | None | All sample types |

---

## Appendix B: Jira tickets folded in

Applied 2026-09-26 under Epic OGC-1266. Tickets with code in flight are never closed as absorbed; they finish and are linked. The two label problems raised on 2026-09-25 have no ticket of their own; they are FR-I1 and FR-I4, tracing to OGC-988 and OGC-990.

| Ticket | Status | Handling | FRS |
|---|---|---|---|
| OGC-1066 Order Entry realignment (Epic) | Ready | Close as superseded by the v4 Epic, after moving its open children | whole FRS |
| OGC-1069 Step 1 to step 2 linkage (Option C) | Icebox | Close as superseded | FR-D5, D6 |
| OGC-358 Build the Label and Store step | To be assigned | Close as superseded | sections C, E, I |
| OGC-990 Labels: order entry aggregation | Backlog | Absorb and close; reconcile with the label request service on develop | FR-I4 |
| OGC-988 Labels: per-test linked presets | Backlog | Update: every active preset | FR-I1 |
| OGC-989 Labels: allow override | Backlog | Order entry half absorbed; catalog toggle stays under OGC-761 | FR-I5 |
| OGC-761 Test Catalog Labels (Epic) | Backlog | Update: drop the four-fixed-presets limit | FR-I1 |
| OGC-1169 Label rows show keys; quantity not editable; duplicate reprint | Backlog | Keep for the Print Bar Code Labels page; order entry rules absorbed | FR-I1, I5, I7 |
| OGC-1068 Config-driven required fields per domain | Backlog | Clinical absorbed; rescope to environmental and vector | FR-A7, B13, B14 |
| OGC-1201 Order entry issue list | In Review | Keep, link; its decisions are carried | FR-A15, B4, B10, C9, D3, F4, I6 |
| OGC-1239 Retire legacy Add Order | Backlog | Keep, link; Part A blocks retiring the legacy route | FR-A5, B4, B17 |
| OGC-1240 Required fields visual only; national ID | Backlog | Keep, link (app-wide); order entry part absorbed | FR-A8, B13 |
| OGC-1197 Patient search (Epic) | Backlog | Update with FR-B5 and FR-B6 | FR-B5, B6 |
| OGC-1223 Provider Title | In Review | Finish, then close; FR-B9 re-verifies | FR-B9 |
| OGC-1143 Require requesting provider | In Progress | Finish, link | FR-B13, I9 |
| OGC-808 Refer Out hook on Step 3 | In Review | Update its criteria to the per-sample and multi-sample panel; keep dedupe and shipment flag | FR-E2, E3a |
| OGC-979 Storage lock | Backlog | Keep, link | FR-E1 |
| OGC-1207 Deactivated lab unit tests orderable | Backlog | Keep, link | FR-B14 |
| OGC-1171, OGC-1135, OGC-1215 | Backlog | Keep, link (fix now) | Dependency 15 |
| OGC-1227, OGC-1219, OGC-1218, OGC-1217 | Backlog | Keep, link as blockers | Dependency 14 |
| OGC-1221, OGC-1191 Edit Order defects | In Review | Finish and close; behaviour carried | FR-H3 |
| OGC-1070 Per-domain navigation | In Review | Finish and close | Navigation |
| OGC-1222 Program deletion white-screens | In Review | Finish and close; Program deactivate follow-up has no ticket yet | FR-K2 |
| OGC-1051, OGC-1050, OGC-1049, OGC-1060, OGC-1161, OGC-1182, OGC-1192 | Various | Keep; environmental and vector alignment | section L |
| OGC-1073 External orders queue | Icebox | Keep, out of scope | Out of Scope |
| OGC-1144 Additional information (Epic) | Backlog | Keep, out of scope beyond placement | FR-B12 |
| OGC-1139 Login and session hang | Backlog | Keep, link to the FR-K1 shell fix | FR-K1 |
