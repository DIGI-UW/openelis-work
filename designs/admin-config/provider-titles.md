# FRS — Provider Title (Honorific) Field + Provider Titles Admin Page

**Status:** Draft for review
**Author:** Casey Iiams-Hauser (UW DIGI), drafted 2026-09-17
**Origin:** Field request from PNG / CPHL during a duplicate-Provider cleanup
**Contract:** CPHL PNG
**Jira:** OGC-1223
**Related:** OGC-1143 (Require requesting provider — provider optional / facility required)

---

## Lab Context

### Current State

Every test order in OpenELIS records who requested it. That person — a doctor, a nurse, a
health extension officer — is stored as a **Provider** record, and a Provider is just a name:
a first name and a last name, typed into two free-text boxes on the Provider Management admin
screen, or created on the fly from the order entry screen by whoever is receiving the specimen.

In Papua New Guinea, clinical staff are routinely referred to by rank or cadre rather than by
given name. A requisition form arriving at the Central Public Health Laboratory (CPHL) will say
"Dr Kila", "Sr Mary" (Sister, a senior nurse), "HEO Wanpis" (Health Extension Officer) or "RMO"
(Resident Medical Officer). The receptionist types what is on the form. There is nowhere to put
the rank, so it goes into the first name box, or the last name box, or both.

### Pain

CPHL is currently working through a large duplicate-Provider cleanup, and most of the
duplication traces back to this one missing field:

- **The same person exists several times over.** "Dr John Kila", "John Kila", "Kila, Dr John"
  and "DR JOHN KILA" are four Provider records for one clinician. Each new order picks one of
  them more or less at random, so no one can answer "how many orders did Dr Kila send us?"
- **Sorting and searching are unreliable.** A list sorted by last name interleaves people whose
  last name is actually "Dr". Typing "Kila" into the provider typeahead misses the records where
  the rank was typed ahead of the surname in the same box.
- **Some records are a rank and nothing else.** "HEO", "RMO", "Sister" — a title was recorded
  with no name at all, usually because the requisition itself only gave a rank. These are
  unusable as a provider identity, and they are indistinguishable from real records in the list.
- **Printed reports look wrong.** A report header reading "Requested by: Dr Dr John Kila" or
  "Requested by: HEO" undermines confidence in the lab's output with the clinicians it serves.

Every one of these costs the receptionist a few seconds of hesitation at order entry — pick the
right John Kila out of four — and costs the lab manager the ability to report by requester at all.

The list of ranks is also not the same everywhere. PNG needs HEO and RMO; a lab in Côte d'Ivoire
or Madagascar needs a different set entirely. A fixed list shipped in the code would be wrong for
almost every deployment, so the lab administrator has to be able to maintain their own.

### What Changes

The receptionist gets a separate Title dropdown next to the name fields. The rank goes there;
first and last name hold only the name. From that point on, one clinician is one Provider
record, found by typing their surname, displayed everywhere as "Dr John Kila" without anyone
ever having typed "Dr" into a name box.

The lab administrator gets a small page of their own — Provider Titles, sitting directly under
Provider Management — where they add the ranks their clinicians actually hold, give each one the
abbreviation that should print, and switch a title off when it falls out of use. The page ships
with the common honorifics already seeded, so a new deployment has a working list on day one.

This feature gives the title a proper home and a place to maintain the list. It does not go back
and clean up the records already in the database — CPHL's existing duplicate cleanup continues by
hand, and it gets easier the moment there is somewhere correct to put the rank.

---

## Overview

Add a Title (honorific / cadre) attribute to Provider records, separate from first and last name,
plus a small admin page for maintaining the list of available titles. Title is chosen from a
dropdown rather than typed, so the same clinician is always recorded the same way. Title
participates in display and filtering but never in name matching, so a provider is still found by
their name alone.

Scope is deliberately narrow: the field, the page that maintains its list, and the places the
title appears. No migration of existing records, no duplicate detection, no merge.

### Navigation & URL

Two pages are involved. Only the second is new.

**Provider Management (existing, modified)**

- **SideNav placement:** `Admin → Organization → Provider Management`
- **Breadcrumb:** `Home / Admin / Organization / Provider Management`
- **URL route:** `/MasterListsPage/providerMenu`

**Provider Titles (new)**

- **SideNav placement:** `Admin → Organization → Provider Management → Provider Titles`
  (SideNav submenu under Provider Management, not an in-page tab)
- **Breadcrumb:** `Home / Admin / Organization / Provider Management / Provider Titles`
- **URL route:** `/MasterListsPage/providerTitleMenu`

> **To verify before build:** the `Organization` SideNav group for Provider Management is taken
> from the admin IA inventory and has not been re-checked against `testing.openelis-global.org`
> for this spec. The `providerTitleMenu` editorKey is proposed to match the casing of its parent
> `providerMenu`. Confirm both against the live app before implementing — the breadcrumb, the
> SideNav path and the route must agree.

**Also affected (no new pages):** the inline provider-create path and the provider typeahead in
all three order entry lanes (Clinical, Environmental, Vector).

---

## User Stories

- As a **receptionist**, I want to pick a provider's title from a list so that I record the rank
  on the requisition without polluting the name fields.
- As a **receptionist**, I want to find a provider by typing only their surname so that I am not
  guessing whether the person who created the record put the rank first.
- As a **lab administrator**, I want to maintain the list of titles my clinicians actually hold,
  in one small page, so that staff are never forced to approximate.
- As a **lab administrator**, I want to switch a title off rather than delete it so that the
  providers already carrying it are not disturbed.
- As a **lab manager**, I want new providers recorded consistently from today onward so that
  reporting order volume by requesting provider becomes possible as the data turns over.

---

## Functional Requirements

### The Title field on a Provider

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | The Provider add and edit forms present a **Title** field as a single-select dropdown, positioned before First Name in the reading order. | Small closed set, so a Select is correct here; D-007's typeahead rule applies to large catalogs, not to honorifics. |
| FR-2 | Title is **optional**. A Provider with no title saves and displays normally. | Many providers legitimately have none. |
| FR-3 | The dropdown offers only **active** titles, in the configured sort order, followed by any inactive title the record already carries (shown as inactive, so an existing value is never silently dropped). | |
| FR-4 | The dropdown shows an empty option first, labelled with the "no title" placeholder, and it is the default for a new Provider. | |
| FR-5 | If no titles are configured, the Title field is hidden entirely rather than rendering an empty dropdown. | A deployment that does not want titles simply empties the list. |
| FR-6 | A Provider record must have a **last name**. A record whose only content is a title is rejected on save with an inline validation message. | Closes the "title only, no name" hole going forward. |
| FR-7 | Saving a Provider whose first or last name still contains a recognised title token raises a **non-blocking** inline warning suggesting the title be moved to the Title field. The user may save anyway. | Guidance, not a wall — a surname really can be "Mister". |
| FR-8 | The Provider Management results table shows Title as its own column, between the selection control and Last Name. | |
| FR-9 | Provider search matches against first name, last name and identifiers **only** — never against Title. | Searching "Dr" must not return every doctor. |
| FR-10 | Provider Management offers a **filter by Title**, populated from the active titles, additive to the text search. | This is how a user finds "all the HEOs". |
| FR-11 | Wherever a provider's name is displayed as a single string — order entry typeahead, order summary, printed reports, dashboards — it renders as `{Abbreviation} {First} {Last}`, with the title omitted cleanly when absent (no leading space, no stray separator). | One shared display helper; no per-screen string assembly. |
| FR-12 | The order entry provider typeahead matches on name only (per FR-9) but displays the full titled form (per FR-11) in both the option list and the selected value. | The user types "Kila" and sees "Dr John Kila". |
| FR-13 | A provider created inline from order entry offers the same Title dropdown as the admin form, with the same validation. | Otherwise the problem reopens through the side door. |
| FR-14 | Title is carried on the FHIR Practitioner resource as `name.prefix`, populated on export and read back on import. A Practitioner arriving with multiple prefixes takes the first and logs the rest. | Standard R4 mapping; no extension needed. |
| FR-15 | Existing Provider records are untouched by this change. A record whose name field still contains a title keeps displaying exactly as it does today until someone edits it. | No migration, no background rewrite. |

### The Provider Titles admin page

| ID | Requirement | Notes |
|---|---|---|
| FR-16 | The page lists every configured title in a table with columns: **Title**, **Abbreviation**, **Sort order**, **Status**, **In use** (count of providers currently carrying it), and a row action menu. | "In use" is what makes deactivating a safe decision rather than a guess. |
| FR-17 | The table defaults to sorting by the configured sort order, and any column may be sorted. | |
| FR-18 | A **status filter** offers All / Active / Inactive, defaulting to Active. A free-text filter matches title and abbreviation. Both are reflected in the URL so a filtered view is linkable. | The list is small; these are the only two filters it needs. |
| FR-19 | A summary line above the table states the counts — total, active, inactive — and updates with the filter. | A count line, not a row of KPI tiles; the list is a dozen rows, not a dataset. |
| FR-20 | **Add Title** opens a modal with Title (required), Abbreviation (required), Sort order (optional, numeric) and Active (toggle, on by default). | |
| FR-21 | A row action **Edit** opens the same modal populated. Editing a title's text or abbreviation changes how it displays on every provider already carrying it — the modal says so when the record is in use. | Providers reference the title, they do not copy it. |
| FR-22 | A row action **Deactivate** (or **Activate**) flips the status. Deactivating never alters the providers carrying that title; it only removes the title from the dropdowns offered for new selections. | |
| FR-23 | Deactivating a title that is in use asks for confirmation naming the count: "12 providers currently use this title. They keep it; it just will not be offered for new records." | |
| FR-24 | There is **no delete action**. A title that was a mistake is deactivated. | "Preserve, Don't Delete." |
| FR-25 | Title text and abbreviation are each unique among active titles, case-insensitively. A duplicate is rejected on save with an inline message naming the existing entry. | |
| FR-26 | Abbreviation is capped at 10 characters; Title at 50. | Abbreviation is what prints in a report header and on a label. |
| FR-27 | The page has a real empty state — a short line explaining what titles are for and an Add Title action — shown when no titles exist at all. | |
| FR-28 | A fresh installation is **seeded** with the common honorifics (see Information & Data), all active. A deployment removes what it does not want by deactivating. | So the feature works on day one without a configuration step. |
| FR-29 | Every string introduced by this feature carries an i18n key with an English fallback, and the title values themselves are localisable per configured language. | |
| FR-30 | A user without Provider Management access sees the titled display form everywhere (FR-11) but reaches neither the Provider Titles page nor the title filter. | |

---

## Information & Data

**Provider** — a person who requests testing from the lab. Today a Provider carries a name (held
on an associated Person record), an NPI, an external identifier, a provider type, and an active
flag. This feature adds one attribute:

- **Title** — the honorific or cadre by which the provider is addressed on a requisition. Optional.
  A reference to an entry in the title list, not free text. It is a form of address, not a
  credential, and it carries no clinical authority — a provider's scope of practice is not
  inferable from it.

**Provider title** — one maintainable entry in the list. Its meaningful attributes:

| Attribute | Meaning |
|---|---|
| Title | The full form, e.g. "Health Extension Officer". What the administrator reads in the list. |
| Abbreviation | The short form that prints, e.g. "HEO". Max 10 characters. |
| Sort order | Where it sits in the dropdown, so the common ones come first rather than alphabetically. |
| Active | Whether it is offered for new selections. Inactive titles stay attached to the providers that already carry them. |
| In use | Derived, not stored: how many providers currently carry it. |

**Storage recommendation.** These are exactly the attributes of an existing Dictionary entry —
category, entry value, local abbreviation, active flag, sort order, and per-language localisation.
The recommendation is to hold provider titles as the Dictionary category `providerTitle` and build
the new page as a focused, purpose-built view over that category, rather than adding a new table.
That gets localisation, the CSV configuration loader and the existing audit behaviour for free,
and a distro can seed its own list through the standard `dictionaries` domain. The trade-off is
that the generic Dictionary admin can also reach these rows; `/MasterListsPage/providerTitleMenu`
is declared the canonical door. If the team would rather not overload Dictionary, a dedicated
`provider_title` table with the five columns above is the alternative — the page and every
requirement above are unchanged either way.

**Seed list.** Shipped active on a fresh installation:

| Sort | Title | Abbreviation |
|---|---|---|
| 10 | Doctor | Dr |
| 20 | Professor | Prof |
| 30 | Sister | Sr |
| 40 | Mister | Mr |
| 50 | Mistress | Mrs |
| 60 | Ms | Ms |

The PNG cadres — Health Extension Officer (HEO) and Resident Medical Officer (RMO) — are seeded
by the CPHL distro configuration rather than the global default, since they are specific to the
PNG health workforce. Other deployments add their own the same way, or through the page.

**Uniqueness.** Title does not participate in provider identity. Two providers with the same name
and different titles are still two records, and the feature does not assert otherwise; it removes
the *cause* of most duplicates rather than resolving the duplicates themselves.

**Existing records.** Providers created before this change carry no title, and whatever is in
their name fields stays there. They display exactly as they do today. When someone next edits such
a record, the Title dropdown is available and FR-7 nudges them to move the token across — the data
improves as it is touched, not in a batch.

---

## Access

- **Who can use it:** Provider Management already sits behind the administrator role; the Title
  field, the title filter and the Provider Titles page inherit that placement. The inline
  provider-create path in order entry is available to whoever can enter an order today, and the
  Title dropdown appears there on the same terms as the name fields.
- **Who can do what:**
  - *View a provider's title* — anyone who can see a provider name anywhere in the application.
    It is part of the displayed name, and there is nothing to hide.
  - *Set or change a title on a provider* — administrators via Provider Management; order entry
    users on a provider they are creating inline.
  - *Add, edit, activate or deactivate a title* — administrators only, via Provider Titles. A user
    without that access does not see the SideNav entry and a direct URL is refused.

---

## Localization

| Key | English fallback | Context |
|---|---|---|
| `provider.title` | Title | Field label on the Provider add/edit form and the results table column header |
| `provider.title.placeholder` | Select a title... | Empty option in the dropdown |
| `provider.title.none` | (none) | Displayed in the results table when a provider has no title |
| `provider.title.filter` | Filter by title | Label on the Provider Management title filter |
| `provider.title.helper` | The rank or form of address on the requisition. Leave the name fields for the name only. | Helper text under the Title field |
| `provider.validation.lastNameRequired` | A provider must have a last name. A title on its own is not enough to identify the requester. | FR-6 validation message |
| `provider.validation.titleInName` | "{token}" looks like a title. Consider moving it to the Title field. | FR-7 non-blocking warning |
| `breadcrumb.providerTitles` | Provider Titles | Breadcrumb leaf and SideNav submenu label |
| `providerTitle.page.title` | Provider Titles | Page heading |
| `providerTitle.page.subtitle` | The ranks and forms of address your clinicians use. These appear in the Title dropdown on a provider record. | Page description |
| `providerTitle.column.title` | Title | Table column |
| `providerTitle.column.abbreviation` | Abbreviation | Table column |
| `providerTitle.column.sortOrder` | Order | Table column |
| `providerTitle.column.status` | Status | Table column |
| `providerTitle.column.inUse` | In use | Table column |
| `providerTitle.status.active` | Active | Status tag |
| `providerTitle.status.inactive` | Inactive | Status tag |
| `providerTitle.filter.status` | Status | Status filter label |
| `providerTitle.filter.all` | All | Status filter option |
| `providerTitle.filter.search` | Search titles | Text filter placeholder |
| `providerTitle.summary.counts` | {total} titles — {active} active, {inactive} inactive | Summary line above the table |
| `providerTitle.action.add` | Add Title | Primary action |
| `providerTitle.action.edit` | Edit | Row action |
| `providerTitle.action.deactivate` | Deactivate | Row action |
| `providerTitle.action.activate` | Activate | Row action |
| `providerTitle.modal.addHeading` | Add a title | Modal heading |
| `providerTitle.modal.editHeading` | Edit title | Modal heading |
| `providerTitle.field.title` | Title | Modal field |
| `providerTitle.field.titleHelper` | The full form, e.g. Health Extension Officer. | Modal helper |
| `providerTitle.field.abbreviation` | Abbreviation | Modal field |
| `providerTitle.field.abbreviationHelper` | The short form that prints on reports, e.g. HEO. Up to 10 characters. | Modal helper |
| `providerTitle.field.sortOrder` | Order | Modal field |
| `providerTitle.field.active` | Active | Modal toggle |
| `providerTitle.edit.inUseNotice` | {count} providers use this title. Changing it here changes how it displays on all of them. | Shown in the edit modal when in use |
| `providerTitle.deactivate.confirmHeading` | Deactivate this title? | Confirmation heading |
| `providerTitle.deactivate.confirmBody` | {count} providers currently use this title. They keep it; it just will not be offered for new records. | Confirmation body |
| `providerTitle.validation.duplicate` | "{value}" is already in the list. | FR-25 |
| `providerTitle.validation.required` | Title and abbreviation are both required. | FR-20 |
| `providerTitle.empty.heading` | No titles configured | Empty state |
| `providerTitle.empty.body` | Titles are the ranks and forms of address on a requisition — Dr, Sr, HEO. Add the ones your clinicians use and they become available on every provider record. | Empty state |
| `providerTitle.saved` | Title saved | Success notification |

Title values themselves are localisable per configured language, through the same mechanism as
every other configurable list. They are not hardcoded and not translated in the frontend.

---

## Dependencies

- **A Title attribute on the Person record.** Person currently has no honorific or prefix field
  of any kind. This is new storage, shared with Patient and with the standalone Requestor contact
  used by environmental and vector orders. Only the Provider surfaces are in scope here; whether
  Patient should later expose the same attribute is a separate decision.
- **A seeded title list.** The global seed above ships with the application; the PNG cadres ship
  with the CPHL distro configuration. Both are configuration deliverables, not code.
- **A single provider display-name helper.** FR-11 requires one place that assembles the displayed
  name. Provider names are currently concatenated ad hoc at several call sites, including the
  legacy JSP Provider screen at `/api/OpenELIS-Global/ProviderMenu`; those call sites need to be
  found and routed through the helper, or they will keep printing untitled names.
- **Confirmation of the SideNav parent group and editorKey** against the live app, per the note in
  Navigation & URL.

---

## Out of Scope

- **Merging or deduplicating existing Provider records.** No merge action, no "these look like
  the same person" detection, no automatic deactivation. The CPHL backlog is resolved by hand.
- **Migrating existing records.** No script, no report, no supervised normalisation pass. Titles
  already sitting in name fields stay where they are until a person edits that record.
- **Deleting titles or Provider records.** Deactivation only.
- **Title on Patient records.** The storage is shared, the surface is not; adding it to patient
  demographics is a separate decision with its own reporting and printing consequences.
- **Credentials, qualifications, registration numbers or scope of practice.** Title is a form of
  address. A structured qualification field is a different feature with different governance.
- **Role or permission behaviour derived from a title.** An HEO is not a permission level.
- **Changing how providers are matched or created during FHIR/HL7 intake**, beyond reading and
  writing `name.prefix` (FR-14).
