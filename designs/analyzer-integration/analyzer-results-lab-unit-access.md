# FRS — Analyzer Results: Lab Unit Access Control

**Status:** Draft for review · **Version-agnostic** (version slicing happens in `/breakdown`)
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`)
**Related Jira:** OGC-1057 (upstream — analyzer lab unit picker) · OGC-1151 (nav role-filtering, shared mechanism) · OGC-1137 (Pending Imports inbox, inherits this rule) · OGC-288 (import page redesign, hosts the banner) · OGC-337 (introduced `analyzer.test_unit_ids`)

---

## Lab Context

### Current State

A clinical laboratory is divided into **lab units** — Haematology, Biochemistry, Microbiology, Serology and so on. Each is a bench with its own staff, its own instruments and its own tests. In OpenELIS a technician is granted rights per lab unit: a Haematology tech has "Results" rights for Haematology, which is what lets them enter and accept results for Haematology tests. That per-lab-unit model already governs the Result Entry screen, the Workplan, the Result Validation screen and the Logbook — open Result Entry and you are asked which of *your* lab units you want to work in.

Laboratory instruments — **analyzers** — send their results into OpenELIS electronically. A tech reviews an incoming run on the **Analyzer Results Import** screen and accepts the results into the system. Today that screen is reached from a menu that lists **every analyzer in the laboratory**, generated when the application starts, and it is shown to every user. The screen's only gate is a role called "Analyser Import" — but in practice that role belongs to the **bridge account**, the machine identity the instrument software signs in as to push results in. It is not how bench staff are granted access, so it gates nothing for a human user. There is a field on each analyzer recording which lab units it belongs to, added three years ago, but no screen has ever let anyone fill it in and no code has ever read it — it shows up only as a column on the admin list that says "3 unit(s)" without naming them.

### Pain

A Haematology technician opens the menu and sees the Microbiology analyzers, the Biochemistry analyzers and the molecular platform alongside their own. They can open any of them and read the pending results — patient identifiers, test names and values for benches they have no rights to. They can also accept those results into the patient record, which is a clinical action on a discipline they are not qualified in and not accountable for. The same technician, one screen away on Result Entry, is correctly shown only Haematology. Nothing distinguishes the two screens except that one respects lab units and the other has never been taught to.

It is worse than a display problem. The web address behind the screen (`/rest/AnalyzerResults`) has no authorization check on it at all: any signed-in user — a receptionist, a data clerk — can retrieve a run's results, or accept them, by typing the address. For a laboratory pursuing ISO 15189 accreditation — the international standard for quality and competence in medical laboratories, which most national reference laboratories are assessed against — "any user can release a result from any bench" is an audit finding, not a preference.

And because the lab-unit field on the analyzer has never been readable, nobody in the laboratory has any way to see or state which bench an instrument belongs to.

### What Changes

Access is decided by the one thing that already describes which bench a person works on: their results rights per lab unit. A technician sees only the analyzers that belong to the benches they work on. A Haematology tech opens the analyzer menu and finds their two haematology instruments — not the other eleven. If they follow a bookmark or a colleague's link to a Microbiology analyzer, they get a clear "you don't have access to this analyzer" page naming the bench they'd need rights to, rather than a screen full of someone else's patient results.

Inside an analyzer that legitimately serves two benches, a tech sees the results for their own bench and a line telling them how many results belong to the other one, so they know the run isn't fully theirs and can hand the rest to the right colleague. And the same restriction now holds no matter how the screen is reached, including by typing the address directly.

Because every analyzer's lab units are empty today, the change ships with a one-time step that works out each instrument's benches from the tests it is already configured to send — so on upgrade day the instruments are already sorted, and an administrator only has to correct the exceptions.

---

## Overview

This feature makes an analyzer's assigned lab units the basis for who may review and accept its results, using the per-lab-unit **Results** rights model OpenELIS already applies to Result Entry, Workplan, Validation and Logbook. Access is decided at two levels: the **analyzer** determines whether a user may open the screen at all, and the **test behind each result row** determines which rows they see once inside.

The existing **Analyser Import** role is deliberately *not* used as the gate: in practice it is granted to the bridge account that instrument software signs in as, not to bench staff, so it does not describe who should be reviewing results. Lab-unit Results rights do.

It also closes a live authorization gap on the endpoints behind the screen, and gives `analyzer.test_unit_ids` — dormant since OGC-337 — its first real consumer.

### Navigation & URL

- **SideNav placement:** `Results → Analyzer → [analyzer name]` — unchanged; the per-analyzer entries are filtered to the analyzers the user may open. (When the Pending Imports inbox lands under OGC-1137, this collapses to a single entry; the filtering rule specified here carries over unchanged.)
- **Breadcrumb:** `Home / Results / Analyzer / [analyzer name]`
- **URL route:** `` `/AnalyzerResults?id=<analyzerId>` `` — unchanged and canonical. The legacy `` `?type=<analyzerName>` `` alias resolves to the canonical form and is subject to the same check.

---

## User Stories

- **As a Haematology technician,** I want the analyzer menu to show only my bench's instruments, so I'm not scrolling past eleven analyzers I have no business opening.
- **As a technician on a shared multi-discipline analyzer,** I want to see my bench's results and a count of the ones that aren't mine, so I know the run isn't finished and who to hand it to.
- **As a laboratory manager,** I want a result released only by someone with rights to that bench, so I can show an assessor that release is controlled by discipline.
- **As a laboratory administrator,** I want to see and correct which lab units each analyzer belongs to, so the filtering matches how my lab is actually organised.
- **As a technician who follows an out-of-date bookmark,** I want a clear explanation of why I can't open an analyzer, so I ask for the right rights instead of assuming the system is broken.

---

## Functional Requirements

### A. Establishing which lab units an analyzer belongs to

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | Every analyzer carries a set of assigned lab units. The set may be empty, one, or many. | Existing `analyzer.test_unit_ids`. The control that sets it is delivered by OGC-1057 — see Dependencies. |
| FR-2 | On upgrade, a one-time step assigns lab units to every analyzer that has none, derived from the distinct lab units of the tests currently mapped to that analyzer. | Source is the analyzer's existing test mappings → test → lab unit. Runs once. |
| FR-3 | The one-time step never changes an analyzer that already has lab units assigned, and is safe to run again with no further effect. | Idempotent; protects any deployment that populated the field directly. |
| FR-4 | The one-time step records, per analyzer, which lab units it assigned and on what basis, so an administrator can review what it decided. | Reuses existing record-history behaviour; no new reporting screen. |
| FR-5 | An analyzer that still has no lab units after the one-time step — because it has no test mappings — is unrestricted: any user holding Results rights for any lab unit may open it. | Deliberate fail-open; a laboratory's existing workflow must not break on upgrade. |
| FR-6 | An analyzer with no lab units assigned is visibly marked as such on the Analyzers list, so an administrator can find and fix it. | Prevents "unrestricted" from being invisible. |

### B. Which analyzers a user may open

| ID | Requirement | Notes |
|---|---|---|
| FR-7 | A user may open an analyzer's results if they hold **Results** rights for at least one of that analyzer's assigned lab units. | The sole gate. Results rights are what already govern Result Entry, Workplan, Validation and Logbook. |
| FR-7a | The Analyser Import role is **not** a condition of opening the screen. | It is held by the bridge account that pushes results in, not by bench staff; using it as a gate would lock out the people the screen is for. Its existing use for the inbound push is untouched. |
| FR-8 | A user whose rights cover all lab units may open every analyzer. | The existing "all lab units" grant. Must be honoured explicitly or administrators lose access. |
| FR-9 | An unrestricted analyzer (FR-5) may be opened by any user holding Results rights for any lab unit. | A user with no Results rights at all — a receptionist, a data clerk — may not open it. |
| FR-10 | Menu entries for analyzers the user may not open are not rendered. | |
| FR-11 | Where the deployment requires a user to choose a lab unit when signing in, the analyzers offered are limited to that lab unit, consistent with Result Entry. | Existing `REQUIRE_LAB_UNIT_AT_LOGIN` behaviour; called out so the narrowing isn't read as a defect. |
| FR-12 | Reaching an analyzer the user may not open — by direct address, bookmark, or a shared link — shows an access-denied page. It names the analyzer and the lab unit(s) rights are required for, and offers a way back to the analyzers the user can open. It shows no result data of any kind. | Matches the access-denied state already shown elsewhere in the application. |
| FR-13 | A user holding Results rights but entitled to no analyzers at all sees no analyzer entries in the menu; reaching the screen directly shows an empty state explaining that no analyzers are assigned to their lab units and who to ask. | Distinct from "this analyzer has no pending results". |
| FR-13a | A user holding no Results rights for any lab unit sees no analyzer entries at all, and is denied on direct access. | Reception-only and clerical accounts. |
| FR-14 | The same rule governs every place analyzers are offered for results review, including the Pending Imports inbox when it is built. | One rule, consumed in several places — not restated per screen. |

### C. Which result rows a user sees

| ID | Requirement | Notes |
|---|---|---|
| FR-15 | Within an analyzer the user may open, a pending result row is shown only if the lab unit of that row's test is one the user holds Results rights for. | Reuses the existing lab-unit result filtering already used by Result Entry and the Logbook. |
| FR-16 | Where rows are hidden, the screen states how many are hidden and which lab unit(s) they belong to. It never shows their sample identifiers, test names or values. | The user must know the run isn't fully theirs; they must not learn what's in it. |
| FR-17 | Selection, bulk actions, progress counts and "select all" operate only on rows the user can see. | A user must never accept a row they cannot see. |
| FR-18 | Where every row is hidden, the screen says the run holds no results for the user's lab units — not that the run is empty. | Distinct from an empty run. |
| FR-19 | A user whose rights cover all lab units sees every row, with no hidden-row notice. | |

### D. The restriction holds however the screen is reached

| ID | Requirement | Notes |
|---|---|---|
| FR-20 | A user who is not entitled to an analyzer cannot retrieve its results, and cannot accept, reject or delete them, regardless of how they reach the system — including entering the address directly rather than using the menu. | Closes a live gap: these operations currently succeed for **any** signed-in user. See Dependencies → *Defect closed by this feature*. |
| FR-21 | A user who is entitled to an analyzer but not to a particular row cannot accept, reject or delete that row by any route. | Row-level rule matches FR-15. |
| FR-22 | Attempting an action the user is not entitled to leaves the results unchanged and is traceable. | *That* it is traceable is the requirement; how it is recorded is an implementation decision. |

**Note on "delete" (No-Hard-Delete, D-002).** Accept / reject / delete are the *existing* dispositions of a **pending imported result** — a record that has not yet entered the patient record and carries no clinical or audit significance until accepted. This is the narrow transient-scratch-data exception to the no-hard-delete rule, and this feature does not introduce, extend or change those actions. It only restricts who may perform them. No domain record gains a delete.

### E. Making the assignment visible

| ID | Requirement | Notes |
|---|---|---|
| FR-23 | The Analyzers list names each analyzer's assigned lab units rather than counting them. | Replaces the current "3 unit(s)". A tally may accompany the names; it may not replace them. |
| FR-24 | The lab units an analyzer serves are visible on its results screen, so a technician can see why a run is partly hidden. | Read-only on this screen; editing lives on the analyzer form. |

---

## Acceptance Criteria

- **AC-1** — A user holding Results rights for Haematology only, in a laboratory with analyzers assigned to Haematology, Microbiology and Biochemistry, sees only the Haematology analyzers in the menu. Whether or not they also hold Analyser Import makes no difference to what they see.
- **AC-2** — The same user, opening a Microbiology analyzer's address directly, sees the access-denied page naming that analyzer and Microbiology, and no result data. The response carries no results.
- **AC-3** — A user whose rights cover all lab units sees every analyzer in the menu and every row within each, with no hidden-row notice.
- **AC-4** — On an analyzer assigned to Haematology and Serology, a Haematology-only user sees the rows whose tests belong to Haematology, and a notice stating the number hidden and that they belong to Serology. No hidden sample identifier, test name or value appears anywhere in the response.
- **AC-5** — With rows hidden, "select all" selects only visible rows, and accepting the selection changes only those rows.
- **AC-6** — A user with no Results rights for any lab unit an analyzer serves cannot accept, reject or delete any of its rows by any route; the results are unchanged afterwards.
- **AC-7** — After the one-time step, an analyzer mapped only to Haematology tests is assigned Haematology; an analyzer mapped to Haematology and Serology tests is assigned both; an analyzer with no test mappings is assigned none and is marked as unassigned on the Analyzers list.
- **AC-8** — Running the one-time step a second time changes nothing, and it never alters an analyzer whose lab units were already set.
- **AC-9** — An analyzer with no assigned lab units can be opened by any user holding Results rights for any lab unit, and cannot be opened by a user holding no Results rights at all.
- **AC-9a** — The bridge account continues to deliver results into OpenELIS unchanged; nothing in this feature alters the inbound push.
- **AC-10** — The Analyzers list shows each analyzer's lab units by name; an analyzer with none shows the unassigned marker.
- **AC-11** — Opening a legacy `?type=<analyzerName>` address applies the same entitlement check as the canonical address and resolves to it.
- **AC-12** — Every string introduced by this feature renders from a translation key with no untranslated text in a non-English locale.

---

## Information & Data

Everything below is information OpenELIS holds today. No new record type is introduced.

| Information | Where it lives today | Used here for |
|---|---|---|
| An analyzer's assigned lab units | The analyzer record's lab-unit list (`analyzer.test_unit_ids`) | Deciding who may open the analyzer (FR-7) |
| Which tests an analyzer is configured to send | The analyzer's test mappings | Deriving the initial lab-unit assignment (FR-2) |
| The lab unit a test belongs to | The test record's lab unit | Deciding which rows a user sees (FR-15) |
| A user's Results rights per lab unit | The user's lab-unit role assignments, including the "all lab units" grant | Both decisions (FR-7, FR-15) |
| The lab unit chosen at sign-in, where required | Existing sign-in behaviour | Narrowing (FR-11) |
| Pending analyzer results and their analyses | Existing imported-result records | The rows being filtered (FR-15) |

**Note on how the assignment is stored.** An analyzer's lab units are held today as a plain list of identifiers on the analyzer record, with no link to the lab unit records themselves — so "which analyzers serve Haematology?" cannot be asked directly. This feature only needs the question asked the other way round ("which lab units does *this* analyzer serve?"), which the current shape answers. If a later feature needs the reverse — a per-lab-unit inbox across analyzers, for instance — a proper link between the two records is the honest ask, and it is flagged in Dependencies rather than assumed here.

---

## Access

**Who can use it.** The feature is governed entirely by the existing **Results** role, granted per lab unit. It introduces no new role. The **Analyser Import** role is not used as a gate here — it belongs to the bridge account that instrument software signs in as to deliver results, and its use for that inbound push is unchanged.

**Who can do what.**

| Action | Who can do it | What someone without it sees |
|---|---|---|
| Open an analyzer's results | Results rights for one of that analyzer's lab units (or rights covering all lab units) | The analyzer is absent from the menu; reaching it directly shows the access-denied page (FR-12) |
| See a result row | Results rights for the lab unit of that row's test | The row is not shown; a notice states how many are hidden and which lab unit they belong to (FR-16) |
| Accept, reject or delete a result row | Same rights as seeing it | The action is unavailable, and cannot be performed by another route (FR-20, FR-21) |
| Assign lab units to an analyzer | Global Administrator, on the analyzer form | The field is not editable. **Delivered by OGC-1057, not here.** |
| See which lab units an analyzer serves | Anyone who can see the Analyzers list or open the analyzer's results | — |

A user whose rights cover all lab units is unaffected by any of the filtering.

---

## Localization

Reuse first; every new key is domain-namespaced under `analyzerResults.*`.

| UI text | Key | Status |
|---|---|---|
| Analyzer | `common.analyzer` | REUSE |
| Analyzers | `common.analyzers` | REUSE |
| Results | `common.results` | REUSE |
| Result | `common.result` | REUSE |
| Test | `common.test` | REUSE |
| Sample ID | `common.sampleId` | REUSE |
| Home | `common.home` | REUSE |
| Back | `common.back` | REUSE |
| Accept | `common.accept` | REUSE |
| Reject | `common.reject` | REUSE |
| Test Name | `common.testName` | REUSE |
| Status | `common.status` | REUSE |
| Name | `common.name` | REUSE |
| Active | `common.active` | REUSE |
| Pending | `common.pending` | REUSE |
| Received | `common.received` | REUSE |
| Normal | `common.normal` | REUSE |
| Critical | `common.critical` | REUSE |
| Error | `common.error` | REUSE |
| Abnormal | *(verify against `en.json`)* | REUSE if present — the result-flag vocabulary is shared with Result Entry; PROMOTE to `common.abnormal` if it exists only under a feature key. Do not mint a new one. |
| Lab Unit | `analyzerResults.labUnit` | NEW |
| Lab Units | `analyzerResults.labUnits` | NEW |
| You don't have access to this analyzer | `analyzerResults.access.deniedTitle` | NEW |
| {analyzer} is assigned to {labUnits}. You need results access to one of those lab units to review its results. | `analyzerResults.access.deniedBody` | NEW (ICU placeholders, no plural syntax) |
| View analyzers you can access | `analyzerResults.access.deniedAction` | NEW |
| No analyzers in your lab units | `analyzerResults.access.emptyTitle` | NEW |
| No analyzers are assigned to the lab units you have results access to. Ask your administrator to assign this analyzer to your lab unit, or to grant you access. | `analyzerResults.access.emptyBody` | NEW |
| {count} results from other lab units are hidden | `analyzerResults.hiddenRows.title` | NEW (ICU placeholder) |
| These results belong to {labUnits}. A user with results access to those lab units must review them. | `analyzerResults.hiddenRows.body` | NEW |
| No results for your lab units in this run | `analyzerResults.hiddenRows.allHiddenTitle` | NEW |
| This run contains {count} results, all belonging to lab units you don't have results access to. | `analyzerResults.hiddenRows.allHiddenBody` | NEW |
| No lab units assigned | `analyzerResults.labUnits.unassigned` | NEW |
| Any user with analyzer import access can review this analyzer's results until lab units are assigned. | `analyzerResults.labUnits.unassignedHint` | NEW |

---

## Dependencies

**Upstream — must exist first**

- **OGC-1057 — Analyzer Types: guided analyzer setup (Ready).** Its Instrument step delivers *"name + lab unit(s)"* on the analyzer form. That is the only way an administrator can correct what the one-time step derives, or assign lab units to an analyzer with no test mappings. Without it this feature ships with a derived assignment nobody can edit through the interface.

**Shared mechanism — must not be built twice**

- **OGC-1151 — Sidebar/nav menu is not role-filtered (In Review).** That fix filters menu items from the signed-in user's roles and lab-unit role map. FR-10 is the lab-unit dimension of the same filter applied to the generated per-analyzer entries. These must land on **one** filtering mechanism.

**Downstream — inherits this rule**

- **OGC-1137 — Analyzer Pending Imports inbox (Backlog).** Already specced as lab-unit-scoped ("shows only runs from analyzers assigned to the tech's lab unit(s)"). It consumes FR-7 and FR-15; it should not restate them.
- **OGC-288 — Analyzer Results Import Page Redesign (In Progress).** The hidden-rows notice (FR-16) and the lab units display (FR-24) land on a screen being actively restructured. Placement needs coordinating rather than deciding twice.
- **The RBAC revamp.** Its PRD already lists analyzer results import as lab-unit-scopeable. This feature becomes one of the pre-built scoped roles rather than something the revamp has to invent.

**Defect closed by this feature**

- The endpoints behind the import screen carry no authorization today: any signed-in user can retrieve a run's results, and accept, reject or delete them, by address alone. The screen's only check is client-side, for a role that in practice belongs to the bridge account rather than to bench staff — so it neither restricts humans nor protects the data behind it. FR-20 closes this. It affects shipped versions and should be treated as a security fix, not a feature enhancement, when release-planning.

**Not required by this feature, flagged for later**

- A proper link between analyzers and lab unit records. The current list-of-identifiers shape answers "which lab units does this analyzer serve?" but not the reverse. A cross-analyzer, per-lab-unit inbox would need the reverse; when that is designed, the link is the honest prerequisite.

---

## Out of Scope

- **The lab unit picker on the analyzer form** — owned by OGC-1057.
- **The Pending Imports inbox layout** — owned by OGC-1137. Only its filtering rule is specified here.
- **The general nav role-filtering fix** — owned by OGC-1151. This extends it; it does not replace it.
- **Any change to result review itself** — quality control gating, mapping, exception handling and multi-component review are OGC-288, OGC-1136 and OGC-1129.
- **A per-lab-unit view across analyzers** — needs the analyzer↔lab unit link noted in Dependencies.
- **Finer-grained permissions than the existing role bundles** — the RBAC revamp's territory.
- **Changing who can assign lab units to an analyzer** — remains Global Administrator.
