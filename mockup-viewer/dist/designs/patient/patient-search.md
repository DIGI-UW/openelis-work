# Patient Search (Shared Panel) — Functional Requirements Specification

**Version:** 1.2 — Draft for review (1.1: internal record ID removed from the table; External ID and referring-site ID added as configured identifier columns; Merge link follows Patient Merge's gate. 1.2: `/analyze` fixes: D-006 wording, source-tag colour change stated, FR-26 pre-fill rule, three missing strings. 1.3: merged patients hidden by default with a Show merged patients toggle, FR-18)
**Date:** 2026-09-08
**Owner:** Casey Iiams-Hauser, Director of Product
**Target:** NCE
**Inputs:** `patient-search-ux-brief.md` (clarified and crosschecked 2026-09-08), QA sweep of testing v3.2.2.0, develop-branch verification of `SearchPatientForm.tsx`, `PatientManagement.tsx`, `PatientSearchResults.java`, `LuceneSearchResultsDAOImpl.java`
**Companion:** `patient-search-preview.html`

---

## Lab Context

### Current State

Every laboratory visit begins at the reception desk with one question: which patient is this? The receptionist has something in hand, most often a national ID card, sometimes a previous lab request slip with a lab number on it, sometimes only a name and a date of birth. In OpenELIS they open Add or Modify Patient, or the first step of Add Order, and are shown two buttons ("Search for Patient" and "New Patient") above six fields: Patient Id, Previous Lab Number, Last Name, First Name, Date of Birth, and Gender. They fill whichever fields they think apply, then look for the Search button, which sits low on the form and is styled more quietly than the two buttons at the top. A table of matching patients appears beneath, and they pick one with a radio button. If the lab is connected to a national client registry (a central list of patients shared by many facilities), a second button, External Search, asks that registry too.

The same search form appears in eight places in the application: patient management, order entry, patient history, order modification, two results screens, and two reports. Two further copies of it exist in the new four-step order entry work and in the patient merge tool, each built separately.

### Pain

Reception cannot tell which of the two buttons at the top is the "current" one; the highlighted one does nothing when clicked, because it is already selected, and the one that actually searches is the quiet one further down. Pressing Enter after typing does nothing, so every search means finding that quiet button with the mouse. The field that accepts a national ID is labelled "Patient Id", so staff with a national ID card in hand either do not know where to type it or type it into the wrong field and see "no patient found" for a patient who exists. The results table loads each patient's photo one at a time and redraws itself as each photo arrives, so rows move under the cursor and the wrong row gets clicked. When several records share the same identifier (during testing, five records named "Abby Sebby" shared national ID 0123456), the table gives no warning and no detail that would separate them, so the receptionist picks one at random. And when a registry is connected, the whole table waits for the slowest source before anything appears.

The result is that the first thirty seconds of every visit are guesswork, and a wrong pick attaches an order, and eventually results, to the wrong person.

### What Changes

Reception types or scans the one thing they have, an ID number, a lab number, or a surname, into a single search box and presses Enter. Local matches appear immediately in a table whose rows do not move. If the lab is connected to a registry, a second group of results appears beneath a moment later without disturbing the first, and a patient known to both appears once. Rows that share an identifier are marked with a warning tag, and enough columns are shown to tell them apart. The search box says, in plain words, what it accepts. The mode switch between searching and creating a patient shows clearly which one is active, and creating a patient is only offered where it belongs: the patient page and clinical order entry. Every screen that asks "which patient?" uses this same panel, so the behaviour learned at the front desk is the behaviour everywhere.

---

## Overview

This specification redesigns the shared patient search panel (`SearchPatientForm`) that every OpenELIS screen uses to find a patient, and requires the two independent copies of it to adopt the shared panel. The panel gains a single smart search box expanded server-side across the identifiers the instance is configured with, an optional demographics refinement row, a stable results table with progressive loading of registry results, shared-identifier disambiguation, and a mode switch with a real selected state. External sources are searched whenever the administrator has configured them; no user-facing control includes or excludes them.

The panel is one component with one behaviour. Host pages decide only whether the New Patient mode is offered and what happens when a patient is selected.

### Navigation & URL

- **SideNav placement:** `Patient → Add or Modify Patient` (existing item; sibling order unchanged). The panel is also embedded in hosts under Order, Results, and Reports, which keep their own SideNav entries.
- **Breadcrumb:** `Home / Add Or Modify Patient` as rendered by the live app (`home.label`, `patient.label.modify`). Embedded hosts render their own breadcrumbs.
- **URL routes (existing on develop, reused):**
  - `/PatientManagement` — search mode
  - `/PatientManagement/new` — new patient mode
  - `/PatientManagement/:patientPK` — edit the selected patient
  - Deep-link query parameters `?patientId=<id>` (open a patient directly) and `?labNumber=<lab number>` (pre-fill and auto-select; used by Validation) continue to work.

---

## User Stories

1. As a **receptionist**, I want to type or scan the identifier I have in hand into one box and press Enter, so that I find the patient without deciding which field the identifier belongs to.
2. As a **receptionist**, I want local matches to appear at once even when the registry is slow, so that I am never waiting on a remote system to serve the patient in front of me.
3. As a **receptionist**, I want to be warned when several records share the same identifier and to see what separates them, so that I do not attach an order to the wrong person.
4. As a **laboratory administrator**, I want the client registry to be searched on every lookup once I have configured it, so that staff cannot bypass it and create a duplicate of a patient the registry already knows.
5. As a **developer of another OpenELIS screen**, I want to embed one patient search panel with a known selection contract, so that patient lookup behaves the same on my screen as at reception.

---

## Functional Requirements

### Mode control

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | On `/PatientManagement` and on the clinical Add Order patient step, the panel shows a two-segment mode control, **Search for Patient** and **New Patient**, rendered as a Carbon `ContentSwitcher`. Exactly one segment is selected at all times and the selected segment is exposed programmatically (`aria-selected="true"`). | Resolves WCAG 2.1 §4.1.2 finding. Replaces the primary/tertiary button pair. |
| FR-2 | On `/PatientManagement` the selected segment mirrors the route: `/PatientManagement` selects Search for Patient; `/PatientManagement/new` selects New Patient. Changing the segment changes the route; navigating to the route changes the segment. | Keeps both modes bookmarkable and preserves develop's existing routing. |
| FR-3 | While editing a patient (`/PatientManagement/:patientPK`) the mode control shows New Patient selected and disabled, as develop does today, with the edit form beneath. | No behaviour change; documented so the switcher covers all three routes. |
| FR-4 | On every other host of the panel (Patient History, Modify Order, Results, Patient Status Report, System Audit Events, Patient Merge, and the environmental workflow of order entry) the mode control is **not rendered**. The panel is search-only there. | New Patient exists only where a patient may legitimately be created: the patient page and clinical order entry. |

### Search input

| ID | Requirement | Notes |
|---|---|---|
| FR-5 | The panel has one search box (Carbon `Search`, large). It accepts a single term. Pressing Enter in the box, or activating the adjacent **Search** button, submits the search. There is exactly one submit action. | Resolves the Enter-to-submit finding. |
| FR-6 | The submitted term is sent to the server as one value. The server matches it, as exact or prefix matches, against every patient identifier type the instance has enabled, the lab number, and the last name. The client does not classify the term. | See Dependencies D-1. Identifier types are those governed by the Patient Entry configuration (national ID, ST number, subject number, and any others the configuration enables). |
| FR-7 | Helper text beneath the box lists what it accepts, built from the instance's enabled identifier types plus lab number and last name, e.g. "National ID, health ID, lab number, or last name". The list changes when configuration changes; nothing is hard-coded. | See Dependencies D-2 for the configuration read. |
| FR-8 | A search is not submitted while the term has fewer than two characters; the Search button is disabled and the box shows no error. Leading and trailing whitespace is ignored. | Performance guard for registry-scale databases. Threshold is a constant a developer may tune; two is the default. |
| FR-9 | A **Refine by demographics** control beneath the box, rendered as a single collapsed Carbon `Accordion` item, expands to reveal Date of Birth (date picker, future dates disallowed, locale format from configuration), Sex (Male / Female radio group, as today), and First Name (text input, existing first-name character rules applied). Refinements narrow the search; they never replace the term. | A date is only ever entered through the picker. Free text in the search box is never parsed as a date. |
| FR-10 | When any refinement has a value, it is shown beside the search box as a removable tag reading the field name and value (e.g. "Date of birth: 12/03/1988", "Sex: Female"). Removing the tag clears that refinement. Refinements are never summarised as a count. | Design-addendum: selected items show labels, not counts. |
| FR-11 | A search may be submitted with refinements only (no term) when at least one of Last Name or Date of Birth is set, so that a patient with no identifier in hand can still be found by surname and birth date. | Preserves today's demographics-only search. |
| FR-12 | The panel never renders a per-search control to include or exclude an external source. The External Search button and the Client Registry Search toggle are removed. | Decision 6. External scope is configuration, see FR-19. |

### Results: local group

| ID | Requirement | Notes |
|---|---|---|
| FR-13 | Local results render as soon as the local response arrives, in a Carbon `DataTable` titled **Patient results**, with radio-button row selection in the first column, sortable headers, and pagination as today. | Independent of any external request. |
| FR-14 | Columns, in order: (select), Photo, Last name, First name, Sex, Date of birth, then one column per identifier type the instance has enabled, in configuration order (National ID, Health ID (`subjectNumber`), External ID (`externalId`, the identifier assigned by the facility's electronic medical record, EMR), Referring-site patient ID (`referringSitePatientId`), ST number (`stNumber`)), then Mother's name, Contact phone, Source. Identifier columns for types the instance has not enabled are hidden. The internal OpenELIS record identifier is **not** shown. Header casing is sentence case, with "ID" kept upper case. The Source column's tag colours change from the shipped red (this laboratory) and green (client registry) to neutral blue and teal, because red and green read as fail and pass elsewhere in the app; Merged keeps its shipped magenta. | Every column traces to `PatientSearchResults` fields that exist today. Mother's name and contact phone are the disambiguation columns available without a data change; see Dependencies D-4 for last visit. The internal record key is long and is displayed nowhere else in the app; two records identical in every shown column are a merge case (FR-17), not a display case. Normalises style-guide drift D02/D56. |
| FR-15 | Every row has a fixed height. The Photo cell renders an initials placeholder immediately; the patient's photo, when one exists, is fetched after the local results have rendered and replaces the placeholder in place without changing the row's height or position. Photos load at most a few at a time and never trigger a table re-render. | Resolves the rows-move finding. The "few at a time" limit is a developer constant. |
| FR-16 | When two or more rows in the current result set share the same value for any identifier column (national ID, health ID, or another enabled identifier), each such row shows a red Carbon `Tag` reading **Shared ID** in the Source column, with a tooltip naming the shared identifier and value, e.g. "National ID 0123456 appears on 5 records". | Row-level so every host gets it. |
| FR-17 | For users who can open Patient Merge (see Access), the Shared ID tag is a link that opens Patient Merge pre-filtered to the shared identifier value. For other users the tag is informational only. | Merge remains its own feature; this is a doorway. "Can open Patient Merge" is whatever gate Patient Merge itself has: today, its existing role check; once the flexible RBAC revamp ships, the Patient Merge capability it defines and administrators assign to roles. This specification defines no permission of its own (D-006). See Dependencies D-5 and D-8. |
| FR-18 | Patients already merged into another record are **hidden from the results by default**. A **Show merged patients** toggle in the results table toolbar reveals them; the toggle is off on every new search and its state is not remembered. When shown, merged rows keep the existing magenta **Merged** tag with its "Merged into …" tooltip, cannot be selected (the row's radio is disabled), and are excluded from the Shared ID count in FR-16. | Mirrors the app-wide "hide deactivated by default, explicit show toggle" convention (D-002). A merged record is a pointer to its survivor, not a patient to pick. |

### Results: external groups and progressive loading

| ID | Requirement | Notes |
|---|---|---|
| FR-19 | If the administrator has enabled a client registry (`ENABLE_CLIENT_REGISTRY`) or an external patient source (`UseExternalPatientInfo`), every search also queries that source. Staff have no control to disable it. If neither is enabled, nothing in this section renders. | Decision 6, D-022 respected: connection configuration is unchanged and not exposed here. |
| FR-20 | The external query is issued at the same moment as the local query and its results are rendered in a separate group beneath the local table, titled by source (e.g. **Client registry results**). While pending, the group shows a Carbon `InlineLoading` line reading "Searching client registry…". Local rows never move as a consequence of external results arriving. | Decision 7. |
| FR-21 | An external result whose FHIR identifier matches a local patient is **not** shown in the external group. Instead the matching local row gains a green **In registry** tag in its Source column. | Dedupe by FHIR UUID; see Dependencies D-3 for the identifier contract. |
| FR-22 | External results with no local match render in the external group with the same columns as the local table, the source `Tag` per row (as today), and the existing **Import Patient** action, which creates the local record and then selects it. Import remains available only on external-only rows. | Existing import flow retained; it is now the only place it appears. |
| FR-23 | If the external source has not answered within the configured timeout, or returns an error, the group's loading line becomes an inline status: "Client registry did not respond. Local results are shown." with a **Retry** button that re-issues only the external query. Local results remain fully usable throughout. | Timeout value is the existing client-registry timeout if one exists; otherwise a developer constant, declared in D-3. |
| FR-24 | Sorting and pagination apply within a group. The two groups are never interleaved or sorted together. | Keeps rows stable. |

### Empty, loading, and error states

| ID | Requirement | Notes |
|---|---|---|
| FR-25 | Before any search is submitted, the results area shows a quiet empty state: "Search for a patient by ID, lab number, or name." No table header row is rendered. | Replaces today's "0-0 of 0 items". |
| FR-26 | When the local search returns no rows and no external source is enabled: "No patient matched *&lt;term&gt;*." On hosts that offer New Patient, the empty state also offers a **Create new patient** button that switches to New Patient mode. If the typed term passes the Validation Configuration character rules for the patient identifier and contains a digit, it is carried into the National ID field (or the single enabled identifier field if National ID is disabled); if it is alphabetic only, it is carried into Last name; otherwise nothing is pre-filled. | The distinct empty state the brief called for. Pre-fill is a convenience, never a guess the user cannot see and correct. |
| FR-27 | When the local search returns no rows and an external source is still pending: "No local patient matched *&lt;term&gt;*. Searching client registry…" The Create new patient button is not shown until the external result is known. | Prevents creating a duplicate while the registry is still answering. |
| FR-28 | When neither local nor external returned a match: "No patient matched *&lt;term&gt;* locally or in the client registry." Create new patient is offered on hosts that allow it. | |
| FR-29 | When the local search returned no rows and the external source failed: "No local patient matched *&lt;term&gt;*. The client registry did not respond." with Retry. Create new patient is offered, and a patient created from this state is flagged as created without a registry check (see Dependencies D-6). | The one remaining duplicate path, made visible rather than silent. |
| FR-30 | While the local search is pending, the results area shows a Carbon skeleton table of five fixed-height rows; the page is never covered by a full-screen loading overlay. | Replaces the current `Loading` overlay. |
| FR-31 | If the local search itself fails (network or server error), an inline error notification reads "Search could not be completed. Try again." with a Retry action. The typed term and refinements are preserved. | |

### Selection contract for host screens

| ID | Requirement | Notes |
|---|---|---|
| FR-32 | Selecting a row hands the host the full patient record, including photo when one exists, through the panel's existing selection callback, exactly as today. Hosts that embed the panel need no change to receive a selection. | Preserves `getSelectedPatient` for all eight consumers. |
| FR-33 | Hosts declare, through a single property, whether New Patient mode is offered (default: not offered). Only `/PatientManagement` and the clinical Add Order patient step set it. | FR-4. |
| FR-34 | The OGC-354 four-step order entry patient step and the Patient Merge search panel adopt this shared panel in place of their own search forms. Patient Merge embeds it search-only; clinical order entry embeds it with New Patient. | Declared in Dependencies D-7 as work in those epics. |

---

## Information & Data

**Patient.** The person being found. Attributes shown or matched: the identifiers the instance is configured to capture (national ID, health ID / subject number, external ID assigned by the EMR, referring-site patient ID, ST number, as enabled); the internal record identifier, used for selection and deep links but never displayed; last name, first name; sex; date of birth; mother's name; contact phone; photo; FHIR identifier (GUID); whether the record has been merged into another, and into which.

**Configured identifier types.** The set of identifier fields the instance captures on the patient form, governed by the Patient Entry configuration properties (`patientEntryConfig` domain). This set decides which identifiers the search term is matched against and which identifier columns appear.

**Search result.** One row per patient found, carrying the patient attributes above plus its **source**: this laboratory, the client registry, or the external patient source. A result may be marked as shared-identifier (its identifier value appears on more than one row in the set) and as in-registry (a registry result matched it by FHIR identifier).

**External source connection.** The administrator's existing configuration of the client registry and external patient source. Read only; this feature does not change it.

**Lifecycle.** A patient record is created (New Patient or Import Patient), edited, and may be merged into another. Merged records are hidden from search results unless the user chooses to show them, and are never selectable. No record is deleted.

All of the above exists in OpenELIS today. Two items the design would benefit from but that do not exist are declared in Dependencies rather than assumed: a last-visit date on the search result, and a "created without registry check" marker.

---

## Access

Accessible via the existing **Reception** role wherever the panel appears. Analysts, Validators, Providers and Admins reach it through screens they already use (Results, Patient History, reports) and can search and select there exactly as Reception does.

Searching, refining, selecting a patient, importing a registry-only patient, and creating a new patient are Reception capabilities, unchanged from today. On hosts where New Patient is not offered (FR-4), no user of any role sees the mode control.

The Shared ID tag's link into Patient Merge is visible only to users who can open Patient Merge. Today that is Patient Merge's existing role check. The flexible RBAC revamp plans to make Patient Merge its own capability that administrators add to roles; when it ships, the link follows that capability automatically, because the link simply asks "can this user open Patient Merge?" This specification does not define a permission and does not decide which roles get merge. Every other user sees the Shared ID tag without a link.

Whether the client registry or external source is searched is decided by the Admin in the existing connection configuration. No other role sees any control relating to it; a user without access to that configuration simply sees the registry group appear when it is enabled.

---

## Localization

Existing keys reused: `search.patient.label`, `new.patient.label`, `label.button.search`, `patient.last.name`, `patient.first.name`, `patient.gender`, `patient.male`, `patient.female`, `patient.dob`, `patient.subject.number`, `patient.natioanalid`, `patient.dataSourceName`, `patient.search.merged.tag`, `patient.search.nopatient`, `success.import.patient`, `error.import.patient`, `patient.label.modify`, `home.label`, `pagination.*`.

New keys, all under `patient.search.*`:

| Key | English fallback | Context |
|---|---|---|
| `patient.search.input.label` | Search for a patient | Search box accessible label |
| `patient.search.input.placeholder` | ID, lab number, or last name | Search box placeholder |
| `patient.search.input.helper` | Accepts {identifierTypes}, lab number, or last name | Helper text; `{identifierTypes}` is a localised, comma-joined list |
| `patient.search.identifier.nationalId` | national ID | Helper-text list item |
| `patient.search.identifier.subjectNumber` | health ID | Helper-text list item |
| `patient.search.identifier.stNumber` | ST number | Helper-text list item |
| `patient.search.identifier.externalId` | external ID | Helper-text list item |
| `patient.search.refine.title` | Refine by demographics | Accordion item title |
| `patient.search.refine.tag.dob` | Date of birth: {value} | Active refinement tag |
| `patient.search.refine.tag.sex` | Sex: {value} | Active refinement tag |
| `patient.search.refine.tag.firstName` | First name: {value} | Active refinement tag |
| `patient.search.refine.clear` | Clear refinements | Ghost button |
| `patient.search.results.title` | Patient results | Local table title |
| `patient.search.results.external.title` | {source} results | External group title, e.g. "Client registry results" |
| `patient.search.column.photo` | Photo | Column header |
| `patient.search.column.externalId` | External ID | Column header (EMR-assigned identifier) |
| `patient.search.column.referringSiteId` | Referring-site patient ID | Column header |
| `patient.search.column.stNumber` | ST number | Column header |
| `patient.search.column.mothersName` | Mother's name | Column header |
| `patient.search.column.contactPhone` | Contact phone | Column header |
| `patient.search.column.source` | Source | Column header (replaces `patient.dataSourceName` display text if desired) |
| `patient.search.tag.sharedId` | Shared ID | Row tag |
| `patient.search.tag.sharedId.tooltip` | {identifier} {value} appears on {count} records | Row tag tooltip |
| `patient.search.tag.sharedId.merge` | Open in Patient Merge | Link title (users with the Patient Merge capability) |
| `patient.search.tag.inRegistry` | In registry | Row tag |
| `patient.search.filter.showMerged` | Show merged patients | Results toolbar toggle |
| `patient.search.filter.mergedHidden` | {count} merged patient(s) hidden | Toolbar hint when merged rows exist and the toggle is off |
| `patient.search.external.loading` | Searching {source}… | Inline loading |
| `patient.search.external.failed` | {source} did not respond. Local results are shown. | Inline status |
| `patient.search.external.retry` | Retry | Button |
| `patient.search.external.folded` | {count} {source} match(es) already shown above as a local patient. | Status line when all registry hits folded |
| `patient.search.external.none` | No additional patients in {source}. | Status line when registry returned nothing new |
| `patient.search.empty.local.seeExternal` | No local patient matched "{term}". See {source} results below. | Empty state when only registry rows exist |
| `patient.search.empty.initial` | Search for a patient by ID, lab number, or name. | Pre-search empty state |
| `patient.search.empty.local` | No patient matched "{term}". | Empty state |
| `patient.search.empty.localPending` | No local patient matched "{term}". Searching {source}… | Empty state |
| `patient.search.empty.none` | No patient matched "{term}" locally or in {source}. | Empty state |
| `patient.search.empty.externalFailed` | No local patient matched "{term}". {source} did not respond. | Empty state |
| `patient.search.empty.create` | Create new patient | Empty-state action |
| `patient.search.error.local` | Search could not be completed. Try again. | Inline error |
| `patient.search.minLength` | Enter at least {n} characters | Helper text while under threshold (visually hidden, announced) |
| `patient.search.source.local` | This laboratory | Source tag |
| `patient.search.source.registry` | Client registry | Source tag / group title |
| `patient.search.source.external` | External source | Source tag / group title |
| `patient.search.photo.placeholder` | Photo of {name} not loaded | Placeholder alt text |
| `patient.search.import` | Import patient | Existing action, re-keyed from inline text |
| `patient.search.import.done` | Patient imported | Existing action state, re-keyed |

---

## Dependencies

**D-1. Single-term search parameter.** The patient search endpoint (`/rest/patient-search-results`) accepts a new single term (e.g. `q`) and expands it server-side, as exact or prefix matches, across the enabled identifier fields, lab number, and last name, using the existing Hibernate Search index over `Patient` (`LuceneSearchResultsDAOImpl`). No leading-wildcard or "contains" matching. The existing fielded parameters remain for refinements (`dateOfBirth`, `gender`, `firstName`) and for deep links. Small backend addition.

**D-2. Enabled identifier types exposed to the client.** The panel needs to know which identifier types the instance has enabled in order to build the helper text (FR-7) and hide unused columns (FR-14). Confirm whether the Patient Entry configuration properties already reach the client through `ConfigurationContext`; if not, expose them.

**D-3. Source-scoped requests and FHIR identifier on results.** The endpoint (or sibling endpoints) must answer for one source at a time (local, client registry, external source) so the client can render progressively. Local results already carry the FHIR identifier as `GUID`; the client registry response must carry the identifier the local record is linked by so FR-21 can fold matches. Confirm the client registry adapter returns it. Also confirm or introduce the external-source timeout used by FR-23.

**D-4. Last visit (optional).** The search result does not carry a last lab number or last visit date. If wanted as a disambiguation column, declare it as a new element on the search response. Not required for v1; FR-14 is written without it.

**D-5. Patient Merge deep link.** FR-17 needs Patient Merge to accept a pre-filter (identifier type and value) via its route. Small addition in the Merge feature.

**D-6. "Created without registry check" marker (optional).** FR-29 flags a patient created while the registry was unreachable so a later reconciliation can find it. No such marker exists. Declare as a new patient attribute or note; the registry's own matching remains the dedupe authority for records created offline.

**D-8. Patient Merge capability (RBAC revamp).** FR-17's link reuses Patient Merge's own access gate. The flexible RBAC revamp (`rbac-revamp-prd.md`) plans a dedicated Patient Merge capability assigned to roles; when it lands, the link inherits it with no change here. No permission is defined by this specification, consistent with decision D-006 (binary admin plus role bundles) until the RBAC revamp supersedes it.

**D-7. Fork convergence.** The OGC-354 order-step `PatientSearchSection.jsx` and the Merge `PatientSearchPanel.tsx` adopt the shared panel (FR-34). One story in each owning epic, not work inside this NCE.

**Existing constraints respected.** D-022: the external patient source's request format is hard-coded; this design reads the connection configuration and adds no endpoint configuration UI. No delete anywhere (D-002). No multitenancy (D-001).

---

## Out of Scope

- The patient create and edit form (`CreatePatientForm`) and its fields.
- The Patient Merge workflow itself, beyond the deep link in FR-17.
- Any user-facing control to include or exclude an external source, and any configuration of the client registry or external source connection.
- The `patient-photos` endpoint and photo storage; only the panel's loading behaviour changes.
- Renaming or re-casing routes (`/PatientManagement` and its children are reused as they are).
- The `EQASampleEntry` and `ExistingOrder` callers of the search endpoint, which use it without a form.
- Reconciliation of records created while the registry was unreachable (the registry's matching remains the authority; D-6 only makes such records findable).
- Patient ID card scanning's "ID Documents" column and the kiosk "Candidate" state; both are expected to land on this table later and must follow FR-15's fixed-row rule, but they are specified in their own documents.
