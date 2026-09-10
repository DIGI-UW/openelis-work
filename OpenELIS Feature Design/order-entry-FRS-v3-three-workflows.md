# Order Entry FRS v4 — Three Domain-Scoped Workflows

**Supersedes:** Order Entry FRS v3 — Three Domain-Scoped Workflows (25 Jun 2026,
`designs/sample-collection/order-entry-frs-v3-three-workflows.md`), which superseded the
Sample Collection Redesign / Order Entry FRS v2 (OGC-537).
**Status:** DRAFT for review. **Date:** 10 Sep 2026.
**Self-contained:** this document replaces v3 in full. Do not read the two side by side —
v3's content is absorbed here, and where v4 changes a v3 rule the change is called out inline
with a `Changed in v4` note so the reasoning survives. Version control carries the lineage.

**What is new in v4, in one paragraph.** Five client reports against the delivered order entry
were verified against a version-matched 3.2.2.0 instance in Sep 2026. Three were confirmed
defects, all rooted in the same thing: the wizard's order context is never reset, so the form
stays bound to the previous order's lab number and patient. That drove three decisions that
change v3's rules — **saving becomes explicit and autosave is removed**, **a lab number is
consumed when it is loaded into the form rather than when the order is saved**, and **a partially
completed order is a legitimate saved record**. Two Requester fields the rebuild dropped are
restored (Ward / Unit / Department, and an explicit Order Date), and a new Order Time is added.
Everything else in v3 stands.

---

## Lab Context

### Current State

A laboratory receives a request for testing — on paper, from a ward, from a clinic across town,
or from a field team with a cooler of water samples. Someone at the receiving desk, usually
called reception, types that request into OpenELIS. That act creates an **order**: who the
sample is from, which tests are wanted, who asked for them, and a **lab number** (also called
an accession number) that is written on the tube and follows the specimen everywhere afterwards.

The lab number is the thread that ties everything together. Once it is on a tube it cannot be
reused, changed, or shared with another specimen without losing track of whose result is whose.
OpenELIS therefore hands out lab numbers one at a time and never gives the same one twice.

Reception works through a four-stage wizard for clinical orders: enter the order, record the
collection, print labels and store the tube, then a quality check before testing begins.
Environmental and vector work skips the collection stage, because the sample was already
collected in the field before it arrived.

### Pain

The wizard does not clear itself. If reception opens an existing order from the dashboard and
then clicks "Enter Order" in the side menu to start a fresh one, the form is still holding the
previous order: its lab number, its program, its clinical notes, and around forty already-ticked
tests. Clicking "New Patient" shows the *previous* patient's name and national ID, and the
surname field cannot even be typed over.

About twenty-eight seconds later, with nobody touching anything, the application saves. It saves
to the previous order's lab number, carrying the previous patient's record. In testing this
landed on an order that already had a specimen and a completed glucose result against it. So a
receptionist starting what she believes is a new order for a new patient can silently alter a
different patient's existing order, and nothing on screen tells her it happened.

Two fields the old form had are also simply missing. There is no **ward** field, so a large
hospital's results come back to the building rather than to the ward that ordered them, and
someone walks them round. And there is no **order date**, so the date on the paper request slip
cannot be recorded at all — every order silently carries the date it was typed instead.

Finally, the form offers three different ways to save (`Save`, `Save & Next`, `Save Draft`)
without saying where any of them leaves you, plus the invisible automatic one, and the
"Saved / Unsaved" indicator reads **"Saved"** on a completely blank untouched form.

### What Changes

Reception opens Enter Order and gets an empty form with a fresh lab number reserved to it. Nothing
from the last order is on screen. Nothing saves until she says so, and she says so with a button
that names where she will end up: continue to collection, or save and leave. If she abandons the
order, she is told plainly that the lab number is spent and will not be reused.

She can record which ward asked for the test, so the report goes back to the ward. She can record
the date and time on the request slip rather than the moment she happened to type it, and both
default to now so the common case is one keystroke: none.

And a half-finished order is a real record she can come back to. It cannot move on to testing
until it has a specimen and a test on it, which is the safeguard that makes leaving it half-done
safe.

---

## Overview

Order entry is **three separate, domain-scoped workflows** — Clinical, Environmental, Vector —
built on one shared wizard framework, with domain-driven navigation and visibility. It is not one
workflow with a domain toggle.

This FRS covers the shared wizard framework, the per-domain stages and fields, the order state
lifecycle (lab number reservation, reset, save, discard), and the per-domain required-field
matrix.

### Navigation & URL

**Unchanged from v3.** No new page, route, SideNav slot or breadcrumb is introduced by v4 — the
changes are to the wizard's action bar and to which fields render inside stages that already
exist.

- **SideNav:** order-entry actions sit directly under the main **Menu**, one per domain —
  **Add Clinical Order**, **Add Environmental Order**, **Add Vector Order** — each opening its own
  workflow with any domain submenus beneath it. They are **not** nested under a single generic
  "Add Order" parent.
- **Breadcrumb:** `Home / <domain> Order / <stage>` — matching the SideNav path exactly.
- **Routes:** the existing per-domain wizard paths, one stage per path segment. The stage path is
  canonical and deep-linkable: pasting it loads that stage of that order.
- **Domain visibility:** which order-entry action a user sees is driven by the domain of their
  assigned lab unit(s); admins see all three.
- **Unit-level scoping** is finer than domain and follows the user's assigned lab unit(s). A user
  with access only to Hematology sees only Hematology orders in lists, dashboards and worklists —
  not all Clinical orders. Dashboards are separate per domain and each list is filtered to the
  user's units. Admins see all units and domains.

---

## User Stories

- **As a receptionist**, I want Enter Order to open empty with its own lab number, so that I never
  edit a previous patient's order while believing I am creating a new one.
- **As a receptionist**, I want to choose when my work is saved and be told where each button
  leaves me, so that I know whether the sample is recorded before I walk away from the desk.
- **As a receptionist**, I want to record the date and time from the request slip, so that
  turnaround is measured from when the clinician asked, not from when I got to the keyboard.
- **As a ward clerk in a large hospital**, I want the ordering ward captured on the order, so that
  the result comes back to my ward instead of to the hospital's front desk.
- **As a lab manager**, I want a half-entered order to survive as a record that cannot progress to
  testing, so that an interrupted booking-in is recoverable without becoming a testable order.

---

## Functional Requirements

### A. Order state lifecycle

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | Reaching an Enter Order stage to create a new order MUST reset all order context — requester, program, patient, samples, tests, clinical information, dates — and MUST generate and reserve a new lab number bound to the form. | **Changed in v4:** v3 §3 stated this as "Clean state (fixes G12)"; v4 adds the lab-number half, which is what makes it verifiable. |
| FR-2 | A lab number is **consumed when it is loaded into a form**, not when the order is saved. Once issued to a form it is marked used and the next generated number advances, whether or not the order is ever saved. | **New in v4.** Verified already true of the generator: five consecutive requests with nothing saved returned five distinct numbers. |
| FR-3 | A previously issued lab number MUST NOT appear in the lab number field of a new order. If it does, the reset in FR-1 did not run. | The falsifiable form of FR-1. |
| FR-4 | Reaching an Enter Order stage via **Continue** on an existing order, or via an explicit edit, MUST load that order and MUST NOT reset or re-reserve. | The exception to FR-1; distinguishing the two is the whole defect. |
| FR-5 | Choosing **New Patient** MUST clear any retained patient identity and MUST mark the patient record for creation, not update. All identity fields MUST be empty and editable. | Today the previous patient's surname, forename and national ID are pre-filled and the surname is not editable. |
| FR-6 | Navigating between stages of the **same** order MUST preserve that order's context. | FR-1 must not overreach into normal in-order navigation. |

### B. Save model

| ID | Requirement | Notes |
|---|---|---|
| FR-7 | The wizard offers exactly three save actions: **Save & Next** (persist, advance to the next stage), **Save & Exit** (persist, leave the workflow), **Discard** (do not persist, leave the workflow). | **Changed in v4.** Supersedes v3 §3's `Save` / `Save & Next` / `Save Draft`. `Save` never said where the user lands; `Save Draft` implies a class of record that does not exist. |
| FR-8 | There MUST be no automatic save. Nothing is written to the server without an explicit user action. | **Changed in v4.** v3 §3 said "Auto-save keeps the order recoverable (per v2 XC-1)". See FR-12 for what replaces that role. |
| FR-9 | **Save & Next** and **Save & Exit** persist **all** metadata present on the stage, in whatever state of completion it is in. A partially completed order is a valid saved record. | **New in v4.** Makes explicit what was previously ambiguous. |
| FR-10 | An order with no sample and no test on it MUST NOT be able to progress to testing. This is the safeguard that makes FR-9 safe. | Already true of the system; stated so it is not lost in a later change. |
| FR-11 | **Discard** MUST state its real consequences before proceeding: the order is not saved, and the reserved lab number is spent and will not be reused. Discard MUST NOT be labelled "Cancel". | "Cancel" promises an undo the system cannot deliver, because FR-2 spends the number on load. |
| FR-12 | Where an order has already been persisted, Discard MUST NOT hard-delete it. It marks the order cancelled, preserving the record. | Required by the no-hard-delete rule (D-002). |
| FR-13 | The saved-state indicator MUST reflect reality: unsaved changes present, or all changes saved. A form with no user input MUST NOT read as "Saved". | Today a completely fresh untouched form reads "Saved". |
| FR-14 | Leaving a stage with unsaved changes — including by in-app navigation — MUST prompt before the changes are lost. The prompt MUST NOT fire on a form the user has not modified. | The second half is OGC-1051, which reports the guard firing on untouched forms. One component, one fix. |
| FR-15 | Validation never throws a fatal or unrecoverable error. Blocking conditions appear as inline field errors, correctable in place. Server field errors surface to the user and are never swallowed by a generic "Save failed". | Carried from v3 §3 / §6. With FR-8 removing autosave, this is load-bearing rather than a nicety. |
| FR-16 | Entering a stage scrolls to the top and focuses the first actionable field. | Carried from v3 §3. |

### C. Dates on the order

| ID | Requirement | Notes |
|---|---|---|
| FR-17 | The Enter Order stage carries an **Order Date** — the date the order was raised, as written on the request slip. It defaults to the current date and is editable, including to past dates. | **Restored in v4.** The control exists in the shipped bundle, already defaults to the current date and is already editable; it is simply not rendered on the current form. |
| FR-18 | The Enter Order stage carries an **Order Time**, defaulting to the current time and editable. | **New in v4.** No equivalent exists in the frontend or the payload — see Dependencies. |
| FR-19 | **Required By** — the date a result is needed by — remains available on Clinical and Environmental orders, and continues to reject past dates. | Confirmed 10 Sep 2026: it stays on clinical, alongside FR-17. |
| FR-20 | Where both Order Date and Required By appear, each MUST carry helper text distinguishing them: Order Date is when the order was raised; Required By is when the result is needed. | Two dates one field apart, with opposite constraints, cannot be told apart from their labels alone. v3 §5 already requires helper text on every field. |
| FR-21 | All dates MUST be serialized using the configured Date locale (Admin → General Configuration → Site Information), including the dates inside the sample payload. | Carried from v3 §6, and now a **prerequisite** rather than a parallel defect — see Dependencies. |

### D. Requester block

| ID | Requirement | Notes |
|---|---|---|
| FR-22 | Clinical orders carry a **Ward / Unit / Department** field — a sub-unit of the selected ordering facility identifying where the patient is (ICU, Maternity, Emergency). It is **disabled until a facility is selected**, then populated from that facility's sub-units. It is **optional**. | **Restored in v4.** v3 §4.1 already specified it, as optional. Environmental and Vector do not have it (no patient). |
| FR-23 | The Ward / Unit / Department control MUST be a filterable typeahead, not a plain dropdown. | A teaching hospital's ward list is not short (D-007). The control surviving in the bundle is a plain `Select`; this is a deliberate change. |
| FR-24 | Selecting a different facility MUST clear any previously chosen ward. | The wrong ward silently surviving a facility change is worse than an empty one. |
| FR-25 | Ordering **Site** and **Provider** are required for clinical orders, honouring the existing configuration, and bind to the order such that downstream saves use them. | Carried from v3 §5. An order that saves without a bound site returns no samples — the "silent empty order". |
| FR-26 | Records selected from a search are **read-only until the user clicks "Edit details"**. Newly added free-text records start editable. | Carried from v3 §5. Prevents stray keystrokes persisting to a saved facility, provider or requestor. |
| FR-27 | Where configuration **restricts** free-text entry, the "add new" affordance is shown **disabled with a message that adding entries is disabled by the administrator** — never silently hidden. | Carried from v3 §5. |
| FR-28 | Required fields are **configuration-driven**, honouring the existing Order Entry / Patient Entry configuration through the same API as the legacy form. The workflow MUST NOT hardcode its own required set. | Carried from v3 §5. Applies to FR-22's optionality too: it is a config default, not a constant. |

### E. Field behaviour carried forward from v3

| ID | Requirement | Notes |
|---|---|---|
| FR-29 | Sample type and requested tests are **optional pre-population** at Enter Order. The order can be saved and advanced without them. | v3 §5. |
| FR-30 | Quantity is blank by default and optional. Unit of measure derives from the test catalog where available and a blank UOM must not error the save; UOM is required only when a quantity is entered. | v3 §5. |
| FR-31 | Label printing is optional to advance. Storage assignment is optional to advance, and skipping storage MUST NOT require a click — unassigned samples are processed immediately. | v3 §5. |
| FR-32 | Program is not mandatory; it defaults to the "no program" (Routine Testing) program and MUST NOT gate advancement. | v3 §5. Clinical and Vector. |
| FR-33 | Every field carries concise instructional helper text explaining how it is used and when it applies. | v3 §5. FR-20 is one instance of this. |
| FR-34 | The QA Review stage hosts the **Sample Acceptance Checklist** resolved for the order's domain, with per-domain enforcement (Mandatory / Optional / Off, default Optional). A domain with its own items uses that list; otherwise it falls back to the lab-wide "All domains" list, never merged. A failed item can pre-fill a non-conformance. | v3 §5. Configured under Admin → General Configuration → Order Entry Configuration → Sample Acceptance Checklist, navigated by SideNav submenu. |

### F. Per-domain stages

| ID | Requirement | Notes |
|---|---|---|
| FR-35 | **Clinical:** Enter Order → Collect → Label & Store → QA Review. | v3 §4.1. |
| FR-36 | **Clinical Enter Order** carries: lab number (generated, FR-2), patient (search or New Patient, which requires a national ID), order date and time (FR-17/18), Required By (FR-19), program, clinical information, requester (site + provider + ward), priority. Sample type and tests are optional pre-population. | v3 §4.1 plus FR-17/18/22. |
| FR-37 | Tests and panels are found by **either name or code**. Sample type is not required to add a test at Enter Order; which sample each test maps to is settled at Collect. | v3 §4.1. |
| FR-38 | **At Collect** the collector uses the standard Add-Sample interaction — sample type picker, optional filter by lab unit, order panels, order tests (by name or code) — and confirms, edits or adds to whatever was pre-populated. There is no binding step-1-to-step-2 mapping; the collector is the authority on what was drawn. | v3 §4.1.1. Each **Add Sample** records a separate draw carrying its own panels and tests. |
| FR-39 | **Environmental:** Enter Order → Label & Store → QA Review (no Collect stage). Enter Order carries sampling site (registry search, required), applicable compliance standards (required), default collection conditions (collection method optional; water and ambient temperature, weather, preservation), GPS, per-sample manifest, "lab performed sampling", SOP maximum holding time, and the requester as organization plus contact. | v3 §4.2. |
| FR-40 | **Vector:** organism-based Enter Order, with species identification and pool deconvolution downstream at Results › Vector Identification. Enter Order carries sampling site (required), trap and collection metadata, organism and pool fields. No compliance-standards block and no GPS manifest. Program is optional. | v3 §4.3. |
| FR-41 | **Environmental and Vector requester model:** the requester is the customer requesting the test — a **Requesting Organization** (the company) plus a **Requestor** (the contact person). At least one is required. The full field set is captured for both: the organization's name and complete contact set, and the requestor's first and last name, phone, fax, email and department. Both are searched and stored exactly as the clinical requesting provider is. | v3 §5. Clinical uses site + provider instead of the organization/contact pair. |

---

## Information & Data

**The order.** A request for testing, identified by a **lab number** that is unique, never
reused, and consumed at the moment it is issued to a form. An order carries the requester, the
dates, zero or more samples, and the tests wanted on each. Its lifecycle through the wizard is
*being entered → entered → collected → labelled and stored → quality reviewed → available for
testing*. An order with no sample and no test cannot leave the entry stage for testing,
regardless of how much other metadata it carries.

**The lab number** is drawn from a single-issue generator. Two orders can never hold the same
number, and a number handed to a form that is then abandoned is spent — the sequence has already
moved on. This is why abandoning an order cannot be described as a cancellation with no effect.

**The patient**, for clinical orders, is either an existing record found by search or a new record
to be created. Which of the two it is, is a property of the order being entered, and getting it
wrong is what causes an edit to land on the wrong person. A new patient requires a national ID.

**The requester** is, for clinical orders, an ordering **facility** (site) plus an ordering
**provider**, optionally narrowed to a **ward / unit / department** which is a sub-unit of that
facility. For environmental and vector orders it is a requesting **organization** plus a
**requestor** contact. Facilities, providers, organizations and requestors are all existing
registry records, searched and bound rather than retyped.

**The dates.** An order carries the date and time it was raised (which defaults to now but
belongs to the request slip, so it may be in the past) and, optionally, a date by which the
result is needed (which cannot be in the past). These are different facts about different ends
of the order's life and are stored separately.

**Field mapping note for implementation.** The consolidated fix list (OGC-1146, finding L) maps
the ward field to a legacy `requesterDepartmentId`. The payload observed on 3.2.2.0 carries
`referringSiteDepartmentId` and `referringSiteDepartmentName`, populated from the referring
organization's departments. Confirm which the backend expects before wiring — the two names
suggest two different eras of the schema.

---

## Access

- **Who can use it:** the existing **Reception** role raises orders. No new role and no new
  permission key is introduced. Which of the three domain workflows a user sees follows the domain
  of their assigned lab unit(s); an administrator sees all three.
- **Who can do what:**
  - *Raise, save and discard an order:* Reception, within the domains their lab units cover.
    A user whose units do not cover a domain does not see that domain's order-entry action at all.
  - *Record collection details:* Reception or the collecting user, at the Collect stage.
  - *Complete the quality review:* per the Sample Acceptance Checklist's per-domain enforcement
    setting; a user without the rights for that stage sees it read-only.
  - *Set which fields are required, and whether free-text entry is allowed:* Admin, through the
    existing Order Entry / Patient Entry configuration. Reception sees the consequences, not the
    settings.
- A user without access to order entry does not reach the wizard; the menu action is not shown.

---

## Localization

Search before minting (Principle VII). Keys already present in the shipped bundle are marked
**REUSE** and MUST NOT be duplicated.

| Key | English fallback | Context | Status |
|---|---|---|---|
| `sample.requestDate` | Order Date | FR-17 field label | **REUSE** — in bundle |
| `sample.label.orderdate` | Order date | FR-17 alternate/summary label | **REUSE** — in bundle |
| `sample.label.dept` | Ward / Unit / Department | FR-22 field label | **REUSE** — in bundle |
| `order.department.label` | Ward / Unit / Department | FR-22, the surviving control's own key | **REUSE** — in bundle |
| `common.action.saveAndNext` | Save & Next | FR-7 primary action | NEW — `common.*` per key-reuse rule |
| `common.action.saveAndExit` | Save & Exit | FR-7 secondary action | NEW — `common.*` |
| `common.action.discard` | Discard | FR-7 tertiary action | NEW — `common.*` |
| `order.discard.confirm.title` | Discard this order? | FR-11 confirmation heading | NEW |
| `order.discard.confirm.body` | This order will not be saved. Lab number {labNo} is already in use and will not be reused. | FR-11 confirmation body; `{labNo}` interpolated | NEW |
| `order.state.unsaved` | Unsaved changes | FR-13 indicator | NEW |
| `order.state.saved` | All changes saved | FR-13 indicator | NEW |
| `order.leave.confirm.title` | Leave without saving? | FR-14 navigation guard | NEW |
| `order.leave.confirm.body` | Your changes to this order have not been saved. | FR-14 navigation guard | NEW |
| `order.time.label` | Order Time | FR-18 field label | NEW |
| `order.orderDate.helper` | The date the order was raised, as written on the request slip. Defaults to today. | FR-20 helper text | NEW |
| `order.requiredBy.helper` | The date the result is needed by. Cannot be in the past. | FR-20 helper text | NEW |
| `order.department.helper` | The ward or unit within the ordering facility that requested this test. Optional. | FR-22 helper text | NEW |
| `order.department.selectFacilityFirst` | Select an ordering facility to choose a ward. | FR-22 disabled state | NEW |

---

## Dependencies

- **Order Time is new data.** No `requestTime` (or equivalent) exists in the frontend bundle or
  in the order payload on either the released or the current build. FR-18 requires a new attribute
  on the order, backend persistence for it, and a decision on whether it travels in the sample
  payload the way the order date does. Declared here rather than assumed (D-009).
- **The date-locale serialization fix is a prerequisite, not a parallel task.** FR-8 removes
  autosave, and v3 named autosave as what kept a bad order recoverable. What made orders
  unrecoverable was the date desync: the sample payload emitted `MM/DD/YYYY` while the app used
  `DD/MM/YYYY`, so any order dated after the 12th of the month failed with a server 400 shown as a
  generic "Save failed", and once in that state the order could never save. FR-21 fixes the cause.
  **FR-8 MUST NOT ship before FR-21.**
- **FR-13, FR-14 and FR-8 are one change.** Removing autosave while the saved indicator still
  lies, and with no navigation guard, replaces a data-integrity defect with plain data loss. They
  ship together or not at all.
- **The unsaved-changes guard already partly exists** and is in progress under OGC-1051, which
  reports it firing on untouched forms — the mirror image of FR-13. Coordinate rather than build a
  second guard.
- **Lab-unit → domain assignment** (Test Catalog work) feeds the domain visibility in Navigation.
- **Department and role scoping** — OGC-391 (department and scoped assignment) and OGC-392
  (effective permissions) underpin unit-level scoping.
- **The Sample Acceptance Checklist** (S-09 / OGC-580) provides FR-34's item list and per-domain
  enforcement; it was not present in the inspected `develop` snapshot.
- **The save model must be one shared component** across all three domain lanes. If it is
  implemented on the clinical lane only, environmental and vector keep `Save Draft` and the model
  diverges by domain.

---

## Out of Scope

- **CSV bulk intake** for Environmental and Vector (template download, upload, validating
  preview) — deferred to a later version as a community candidate (OGC-1075). Clinical has no
  bulk import; it does not fit a patient-by-patient workflow.
- **The remaining findings on OGC-1146** — the Collect-stage test selection dead-end, sample
  rejection and non-conformance at collection, the duplicate QA checklist, provider-search
  duplicates, refer-out, result-reporting notifications and attachments. They share these screens
  but are separate work with their own findings.
- **Retiring the legacy order-entry routes.** Two legacy paradigms still coexist alongside the
  three lanes; choosing and deprecating is its own decision.
- **Changing the number of stages per domain**, or the internals of Collect, Label & Store and
  QA Review beyond the save actions and the fields named above.
