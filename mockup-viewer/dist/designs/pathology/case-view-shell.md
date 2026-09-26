# Case View Shell — Shared Pattern for Pathology, IHC and Cytology

**FRS · Version 1.0 · 2026-09-04**
**Supersedes:** the shell implicitly asserted by `designs/pathology/pathology-case-view.md` (v1.0, December 2025), which `cytology-case-view.md` v2.0 cites as "the parent design pattern for the pathology module"
**Module:** Anatomic Pathology → shared case-detail pattern
**Applies to:** Pathology (`OGC-264`), Immunohistochemistry (`OGC-265`), Cytology (`OGC-266`)
**Role required:** each adopting screen's own existing module role bundle — this document introduces no roles

---

## Lab Context

*A developer-onboarding narrative for someone who has never worked in a clinical laboratory. Read this first. It stands on its own — no cross-references to other sections of this spec.*

### Current State

An anatomic pathology laboratory examines tissue and cells rather than blood chemistry. Three benches in OpenELIS do this today, and each has its own case-detail screen: **histopathology** (a surgeon removes tissue, the lab turns it into stained glass slides, a pathologist looks down a microscope and writes a diagnosis), **immunohistochemistry** or IHC (the same slides are stained with antibodies that mark specific proteins, and the pathologist scores how strongly each marker stains — this is how a breast cancer is typed for hormone-receptor and HER2 status, which decides the patient's drug therapy), and **cytology** (individual cells rather than tissue architecture — a cervical Pap smear is the common case).

The three benches are different sciences, but the shape of the screen is nearly identical. In every one of them a case arrives, a technician does staged bench work on physical objects, a pathologist reads the result and writes structured findings, the case is signed out, and a report is generated. All three screens show the same patient header, the same kind of collapsible work sections, the same slide list, and the same save-draft-then-sign-out rhythm.

They were designed separately, at different times, and they have drifted. The cytology screen was rewritten in May 2026 to a current standard: Carbon components by name, real database tables, one existing role bundle, translated strings, an audit trail. The histopathology and IHC screens are still on their December 2025 designs. The IHC one uses a Material-purple palette with no Carbon at all, has no localization, no permissions section, no section locking, no sign-out step and no reports section. The histopathology one invents database tables that already exist in the shipped code.

### Pain

Because the three screens have no shared definition, the same decision keeps being re-made, and re-made differently.

Three concrete examples from the current artifacts. First, the cytology spec declares that its "layout conventions (PatientHeader, sticky summary, slide list) follow" the histopathology spec — so it is formally inheriting from a document that was itself never brought up to standard, and nobody noticed for four months. Second, all three screens need a "who can act on this case now" rule, and today there are three different mechanisms: cytology drives it off one upstream field, histopathology invented a boolean that desynchronises from the case status enum it was supposed to reflect (so in that mockup the work sections unlock while the sidebar still shows a padlock, and the Generate Report button never enables at all), and IHC has no gating whatsoever — all its tabs are reachable in any order. Third, a malignant finding on a histopathology case is exactly as urgent as a malignant finding on a cytology case, but only cytology has a critical-result hook; the other two would let a cancer diagnosis be signed out with no alert path.

The engineering cost compounds. Each screen carries its own copy of the patient header, the section-locking logic, the action bar and the report list. A change to any of them — a new patient identifier, an accessibility fix, a status the dashboard needs to filter on — is three changes in three places, and in practice becomes one change in one place while the other two drift further.

### What Changes

After this work ships:

- One document defines the ten structural elements every anatomic-pathology case-detail screen has, and each screen's own FRS declares how it uses them rather than reinventing them. A developer opening the IHC screen having already built the histopathology one recognises the layout, the state model, the action bar and the save semantics immediately.
- The patient header carries the patient's **prior related anatomic-pathology results** — the same panel on all three screens — so a pathologist reading a case can see what this patient's previous biopsies, Pap smears and marker panels showed without opening a second tab.
- Every screen's case status is the real status enum its module already ships, and the sections, the progress indicator, the action bar and the dashboard filter all read that one value. There is no second source of truth about how far along a case is.
- A critical finding on any of the three benches emits the same `CriticalResultEvent`, gated by the same feature flag, so the alert path is built once.
- Every screen records who performed each significant step and when, captured from the session rather than typed, because `ISO 15189:2022` clause **7.3.1(d)** requires that "the identity of persons performing significant activities in examination processes be recorded."

A backend developer who has never worked in anatomic pathology should now know: there are three sibling screens, they share a skeleton, and this document is the skeleton.

---

## Overview

The Case View Shell is the shared structural pattern for the three anatomic-pathology case-detail screens. It is not a screen and has no route of its own; it is a conformance contract that Pathology, IHC and Cytology each implement, plus the shared components and conventions they hold in common. This FRS exists so that the layout, section-state model, status handling, action bar, critical-result path, localization convention and audit convention are specified once and consumed three times, instead of being re-decided per screen.

### Scope

**In scope (this FRS):** the ten shell elements and their required behaviour; the section state model; the status-transition and reopen contract; the critical-result emission contract; the shared `PatientHeader` and prior-results panel; the localization, audit-verb and Envers conventions the adopting screens follow; the per-screen variation table recording where each screen legitimately differs.

**Out of scope (parked, or owned elsewhere):**

- **Any one screen's clinical content** — Bethesda categories, histology bench stages, antibody scoring. Each adopting FRS owns its own domain.
- **The three module dashboards** — separate screens with their own worklists; this shell covers case detail only.
- **Label printing and barcode presets** — shared `barcodeWorkflow` orchestration, owned by `OGC-284` / `OGC-285`.
- **Report delivery, queueing and print presets** — owned by `OGC-1031`, anchor `OGC-431`.
- **Text macro expansion** — cross-cutting Macro Library, owned by `OGC-788` (in progress).
- **Whole-slide imaging** — tile serving, multi-scan, annotations and scanner metadata are a separate digital-pathology FRS. This shell covers only a single attached image per slide.
- **Interpretive threshold sets** — versioned, source-stamped biomarker and breakpoint tables, folded into the Catalog Subscription epic. IHC consumes them; this shell does not define them.
- **The Flexible RBAC revamp** — adopting screens use existing module role bundles; nothing here anticipates the revamp.

---

## User Stories

1. **As a pathologist**, I want the three case-detail screens to behave the same way, so that moving between a histopathology case, an IHC case and a Pap smear does not mean relearning where the save button is and what a padlock means.
2. **As a pathologist**, I want the patient's prior anatomic-pathology results on the case screen, so that I am not signing out a diagnosis while blind to what the last biopsy showed.
3. **As a lab manager**, I want each case's stage to be a single stored value that the screen, the progress indicator and the dashboard filter all read, so that the worklist tells me the truth about where work is sitting.
4. **As a referring clinician**, I want a malignant finding on any bench to require acknowledgment, so that no critical result is lost to follow-up because it happened to be diagnosed on the bench that lacked an alert path.
5. **As a developer**, I want the shell defined in one document with a conformance list, so that adding the fourth case view is a day of work rather than a fourth invention.

---

## Layout

A Workbench layout: an optional progress rail on the left, accordion work sections in the centre, a sticky Case Summary panel on the right, and an action bar below the grid.

```
 Home / <Module> / Dashboard / Case <LabNumber>
 <Module> Case — <LabNumber>
├──────────── PatientHeader (existing common component) ─────────────┤
│ SMITH, MARY │ DOB 1985-06-15 (40 y) │ F │ MRN … │  Status: <STATUS> │
│ ╭ Prior anatomic-pathology results ─────────────────────────────╮  │
│ │ Lab No      Date        Specimen     Conclusion              │  │
│ │ 24TST0009   2024-01-22  Liver core   C22.0 Hepatocellular ca.│  │
│ ╰──────────────────────────── [View full patient history] ─────╯  │
├────────────────────────────────────────────────────────────────────┤
│ ┌ RAIL ────┐ ┌ WORK SECTIONS ─────────────────┐ ╭ CASE SUMMARY ─╮ │
│ │ ✓ 1 …    │ │ ▾ 1. Case Information  [badge] │ │ Stage:  …     │ │
│ │ ● 2 …    │ │ ▾ 2. …                 [badge] │ │ Blocks: …     │ │
│ │   3 … ⚠2 │ │ ▸ 3. …   🔒 <lockedHint>       │ │ Slides: …     │ │
│ │ 🔒 4 …   │ │ ▾ 4. …                 [badge] │ │ Finding: …    │ │
│ └──────────┘ └────────────────────────────────┘ ╰───────────────╯ │
├────────────────────────────────────────────────────────────────────┤
│ Status: <STATUS>   [Discard changes] [Save draft] [<terminal>]     │
└────────────────────────────────────────────────────────────────────┘
```

Work sections are Carbon `Accordion` items. They may be **collapsed** when done and **disabled with a stated reason** when not yet reachable, but they are **never hidden**. A pathologist revises an earlier section after seeing later evidence — a gross description gets corrected once the sections are under the microscope, an adequacy call changes once obscuring material is found — and a wizard or a tab strip makes that a navigation cost. Tabs are additionally rejected because the pathologist needs the gross description and the microscopic description legible together at sign-out; tabs make that two clicks and a lost context.

---

## Functional Requirements

### S-1 · PatientHeader band

Backed by the existing shared `PatientHeader` component and the existing `Patient` / `Person` entities. No new data.

**S-1.1** Renders patient name, date of birth with computed age, sex, and the deployment's configured patient identifiers. Which identifiers appear is existing patient-identifier configuration, not a per-screen choice — a deployment using a national ID and a universal health ID shows both, one using an MRN shows that.

**S-1.2** Right-aligned, the band shows the case's current status as a Carbon `Tag` and the currently assigned staff for that case.

**S-1.3** The band is display-only. Reassignment happens from the module dashboard, not here.

### S-2 · Prior related results panel

Backed by existing sibling `Sample` rows for the same `Patient`. No new data; a query, not a table.

**S-2.1** A read-only panel inside or immediately below the header lists the patient's prior anatomic-pathology cases across all three benches — most recent first, capped at a configurable number of rows with a link to the full patient history. Columns: lab number, date, specimen, conclusion.

**S-2.2** The conclusion cell shows the coded conclusion where one exists and the free-text conclusion otherwise. Cross-bench by design: an IHC case's prior-results panel shows the histopathology case that referred it.

**S-2.3** If the patient has no prior anatomic-pathology cases, the panel renders an empty state, not a blank table with empty rows.

**S-2.4** No result is editable from this panel and no result is re-interpreted for display. A prior conclusion is shown as it was reported.

### S-3 · Accordion work sections

**S-3.1** Each screen's work sections are Carbon `Accordion` items in a single left-column stack, numbered, in workflow order.

**S-3.2** A display-only section (typically Case Information) is **collapsed by default**. Editable sections are expanded by default until complete, then may be collapsed by the user.

**S-3.3** Sections are never removed from the DOM on the basis of state or role. A section the current user cannot act on is **disabled with a reason**, so that the workflow remains legible to everyone who opens the case.

**S-3.4** Each section header carries the section title, an optional completion **badge** (a Carbon `Tag`), and — when disabled — an inline hint at 12px stating why.

**S-3.5** Section headers are keyboard-operable: `role="button"`, `aria-expanded` reflecting state, `tabIndex` 0 when actionable and -1 when disabled. Toggle visibility via the element's `hidden` property or a class, never by removing the node.

### S-4 · Section state model

Four states, and only four:

| State | Presentation | Interaction |
|---|---|---|
| **Open / editable** | expanded, live badge | fully interactive |
| **Complete** | collapsible, badge shows the outcome | interactive; revisable |
| **Disabled** | header at reduced opacity, `cursor: not-allowed`, inline `lockedHint` | header click is a no-op; body renders its explanation when opened programmatically |
| **Read-only** | expanded or collapsed, badge reads a display-only marker | no inputs |

**S-4.1** A section's state is **derived** from the case status, the user's role bundle and the section's own prerequisites. It is never stored as a separate flag. This requirement exists because the December 2025 pathology design stored a `caseReadyForReview` boolean alongside a case status enum, the two never synchronised, and the resulting screen both unlocked sections that the sidebar still showed as locked and permanently disabled its own primary action.

**S-4.2** Every disabled section states its own unlock condition in the `lockedHint`, in the user's language. "Locked" alone is not sufficient.

**S-4.3** Badge kinds follow the shared status vocabulary: `green` pass/complete/negative, `red` fail/critical/malignant, `blue` in progress, `purple` pending, `teal` verified, `warm-gray` intermediate, `gray` not started or unknown. A badge conveys state through its text as well as its colour.

### S-5 · Progress rail (optional element)

**S-5.1** A screen **SHOULD** render a left progress rail when it has **five or more gated sections**, and **SHOULD NOT** when it has fewer. Pathology renders it; IHC and Cytology do not.

**S-5.2** Each rail item shows the section name, a completion indicator, and — where the screen has a pending-request concept — a count badge that **names what is pending on hover and in its accessible label**, never a bare number alone.

**S-5.3** Rail items scroll the corresponding section into view. The rail is navigation within one page; it is not a substitute for the module's SideNav entry, and it never becomes the screen's only indication of section state.

### S-6 · Case Summary panel

**S-6.1** A `position: sticky` right-hand panel summarising the case's current state as label/value rows: current stage, the counts of the physical objects the screen tracks, the headline finding, and the report status.

**S-6.2** Every count in this panel is **derived from identified object rows**, never stored as a count and never typed by a user. See S-10.3.

**S-6.3** Where a value is unavailable the row renders `—` with a "not recorded" hint. No invented values, no zeroes standing in for unknowns.

### S-7 · Action bar

**S-7.1** A full-width bar below the grid, showing the case status on the left and the action group on the right.

**S-7.2** The action group is exactly: `Discard changes` (ghost), `Save draft` (secondary), and **one primary action determined by the case status and the current user's role**. Screens do not add a fourth button; a screen with several possible next steps expresses that through the primary action's label changing, not through a row of competing buttons.

**S-7.3** `Save draft` persists all in-progress fields with no validation and no status change, and is available at every status before the terminal one.

**S-7.4** The primary action validates, transitions status, and is disabled with an explanatory `title` when its preconditions are unmet. Its disabled condition is the *actual* precondition — not a proxy. A button whose tooltip names one condition while its code tests another is a defect, and was one in the December 2025 pathology mockup.

**S-7.5** An unsaved-changes indicator appears in the bar when the form is dirty, and navigation away from a dirty form warns.

### S-8 · Status transitions and reopen

**S-8.1** Each screen's case status is the status enum its own module already ships. A screen introduces no parallel status field, no completion boolean and no per-section completion timestamp column that duplicates a transition already recorded in the audit trail.

**S-8.2** Every transition records the actor and the timestamp, **captured from the session and the server clock** — never entered by the user. Typed operator names and typed dates are not attribution records. `ISO 15189:2022` **7.3.1(d)** requires the identity of persons performing significant activities to be recorded.

**S-8.3** Transitions are forward through the defined sequence, plus an explicit **reopen** from the terminal status back to the last pathologist-facing status. Reopen is available to the same role bundle that signed out — there is no separate reopen permission.

**S-8.4** Reopen **voids** the prior report row rather than deleting it, and audits the reopen. Nothing in the shell hard-deletes a domain record; see S-10.4.

**S-8.5** A screen's status values, their display strings and their ordering are the single source for that module's dashboard stage filter. Adding or relabelling a status is a change to the dashboard too, and the adopting FRS declares it as such.

### S-9 · Critical-result acknowledgment hook

**S-9.1** When a screen's finding reaches a severity its own FRS defines as critical, the screen renders a persistent Carbon `InlineNotification` (kind `warning`) with `role="alert"` at the top of the section holding that finding, stating that the finding will require acknowledgment.

**S-9.2** On the terminal transition, the screen emits a `CriticalResultEvent` for the case. The consumer — the Alerts Dashboard and the acknowledgment queue — is built in the Critical Result Acknowledgment work, not here. This shell emits; it does not consume.

**S-9.3** The feature flag `criticalResultAcknowledgmentEnabled` gates the downstream consumer only. The event is emitted regardless, and **sign-out is never blocked** by the absence or disablement of the acknowledgment feature.

**S-9.4** All three screens emit the same event type with the same payload shape. Severity determination is per-screen; the event is not.

### S-10 · Slide list and attached images

**S-10.1** A screen that tracks slides renders them as a list of **individually identified rows**, each with its own identifier, barcode, parentage, and status.

**S-10.2** A slide row may carry **one attached image**, uploaded via the existing Carbon `FileUploader` pattern already shipping on the cytology screen, and viewable inline. Multi-scan, preferred-scan selection, tile serving, scanner metadata and annotation are explicitly out of scope; see Scope.

**S-10.3** **Identified objects, not counts.** Blocks, slides and every other physical object a screen tracks are first-class rows with their own identity, parentage and event history. A count is a **derived value, never a stored fact**, and is never entered by a user. `ISO 15189:2022` **7.2.6.1(g)** requires "ensuring that all portions of the sample are unequivocally traceable to the original sample," which a stored count does not satisfy: a count records that three blocks were embedded but cannot say which three, nor which one is missing. Reconciliation at a handoff is therefore computed — and names the missing object — rather than being two numbers a technician keyed in.

**S-10.4** No hard delete. Blocks, slides, requests, conclusions and reports are deactivated or voided, never destroyed, and lists hide deactivated rows by default behind an explicit "Show deactivated" affordance. Beyond the audit and traceability rationale, `42 CFR 493.1105` requires histopathology slides retained **10 years** and blocks **2 years**. *Implementation note for the adopting FRS: `PathologySample` currently declares `blocks`, `slides`, `requests`, `conclusions` and `reports` as `@OneToMany(cascade = ALL, orphanRemoval = true)`, so removing a child from the collection hard-deletes the row. Closing that is a declared backend dependency, not a UI choice.*

---

## Conformance

An adopting screen's FRS **MUST** contain a Shell Conformance table stating, for each of S-1 to S-10, one of: `conforms`, `conforms with variation` plus the variation and its justification, or `not applicable` plus why. A screen may not silently omit an element.

| Element | Pathology | IHC | Cytology |
|---|---|---|---|
| S-1 PatientHeader | conforms | conforms | conforms |
| S-2 Prior related results | conforms | conforms | variation — narrower ("Prior Pap result") pending amendment |
| S-3 Accordion sections | conforms | conforms (converted from tab strip) | conforms |
| S-4 Section state model | conforms | conforms (introduced; had no gating) | conforms |
| S-5 Progress rail | conforms — rail **on** (8 gated sections) | rail **off** | rail **off** |
| S-6 Case Summary panel | conforms | conforms (introduced) | conforms |
| S-7 Action bar | conforms — primary action varies by status and actor | conforms (introduced sign-out) | conforms |
| S-8 Status transitions | conforms — `PathologyStatus`, reworked | conforms (introduced; had no status model) | conforms — `CytologyStatus` |
| S-9 Critical-result hook | conforms (introduced) | conforms (introduced) | conforms — the origin of this element |
| S-10 Identified objects | conforms — blocks and slides | conforms — **reuses the referring pathology case's** `PathologyBlock` and `PathologySlide` (already consumed by `ImmunohistochemistryCaseViewDisplayItem`); holds none of its own | conforms — slides only |

Cytology v2.0 conforms to nine of ten elements as written and needs one amendment (S-2) plus its `Related and prior art` bullet re-pointed at this document rather than at the December 2025 pathology FRS.

---

## Localization

Every visible string is wrapped in `t(key, fallback)` per Constitution Principle VII. Keys follow `<module>.<group>.<camelCaseLeaf>`, with `<module>` one of `pathology`, `ihc`, `cytology`. The shell fixes the **group vocabulary** so the three screens do not invent three names for the same thing:

| Group | Holds | Example |
|---|---|---|
| `section` | one key per work section | `pathology.section.grossing` |
| `stage` | one key per case status display string | `pathology.stage.embedding` |
| `action` | action-bar and row actions | `pathology.action.saveDraft` |
| `label` | field labels | `pathology.label.blockId` |
| `badge` | completion and status badge text | `pathology.badge.complete` |
| `locked` | section `lockedHint` strings | `pathology.locked.awaitingEmbedding` |
| `banner` | full-sentence notifications | `pathology.banner.criticalResult` |
| `empty` | empty-state copy | `pathology.empty.noPriorResults` |

Shared strings that would otherwise be triplicated — the action bar, the prior-results panel headers, the deactivated toggle, the shell's empty states — live under `caseView.*` and are reused by all three. New keys are added to `frontend/src/languages/en.json` and propagated to all shipped locales (fr, es, sw, ta, de, zh, ro, si). Existing keys are reused where present; an adopting FRS's Localization table marks each key `new` or `existing`.

---

## Audit Trail and Envers

**Audit verbs** follow `<MODULE>_<NOUN>_<PASTTENSE>` in SCREAMING_SNAKE — `PATHOLOGY_BLOCK_ADDED`, `IHC_CASE_SIGNED_OUT`, `CYTOLOGY_CASE_REOPENED`. Every state-changing action writes one `audit_trail` row; no reads are audited. Each adopting FRS tabulates its verbs with trigger, target and a non-PII payload summary. The actor is captured from Spring Security, never from a form field.

Every shell element that changes state has a verb: each status transition, each object added or deactivated, each report generated or voided, each critical event emitted, each reopen.

**Envers** `@Audited` is required on every entity holding clinical data or case state. Each adopting FRS lists its entities with an italic status — `*(existing)*`, `*(existing — verify still annotated; add if missing)*`, or `*(new — clinical data, must be audited)*` — and names the entities deliberately excluded with the reason. *Note for adopters: `PathologySample` is **not** currently `@Audited`; that is a declared dependency, not an assumption.*

---

## Non-functional Requirements

| Aspect | Target |
|---|---|
| Initial load | First contentful paint ≤ 1.5 s on a 4G connection from a 1× CPU mobile-class device (typical site profile in resource-constrained labs). Must not regress the existing screen's baseline. |
| Save draft | ≤ 500 ms server response on a case with ≤ 40 tracked objects. |
| Terminal transition | ≤ 2.0 s including report generation. |
| Accessibility | WCAG 2.1 AA. Section headers keyboard-operable with `aria-expanded`; every icon-only action carries an `aria-label`, not only a `title`; every status badge conveys state in text as well as colour; the critical-result banner is announced via `role="alert"`; modals trap focus, carry `role="dialog"` and close on Escape. |
| Localization | All shipped UI locales (en, fr, es, sw, ta, de, zh, ro, si). |
| Browser | Chrome / Edge / Firefox latest; tablet Safari read-only (pathologists read at a desktop microscope station). |

---

## Dependencies (named, not designed in this FRS)

| Dependency | Status | What this shell needs |
|---|---|---|
| **Global Critical Result Acknowledgment** | TODO | S-9 emits `CriticalResultEvent`. The consumer and Alerts Dashboard integration are built in that FRS, not here. Feature flag `criticalResultAcknowledgmentEnabled` gates the consumer only. |
| **`@Audited` on `PathologySample`** | Missing on `develop` | S-8 and the Envers convention assume case-state history. `PathologySample` extends `ProgramSample` and carries no `@Audited`. A backend story must add it. |
| **`orphanRemoval` on pathology collections** | Present on `develop`, and must be removed | S-10.4 forbids hard delete. `blocks`, `slides`, `requests`, `conclusions` and `reports` are `@OneToMany(cascade = ALL, orphanRemoval = true)`, so a UI that removes a child destroys the row. Needs a deactivation flag and the removal of `orphanRemoval`. |
| **Shared `barcodeWorkflow` print orchestration** | Built; rollout scheduled | Label printing is delegated, not designed. `OGC-284` lists Pathology and IHC Case View as M8 "Pathology family rollout via shared orchestration". `PathologyCaseView.jsx` already imports `PostSavePrintDialog`. |
| **Macro Library** | `OGC-788`, in progress | Adopting screens name which text fields consume macro expansion and consume the library. No screen defines its own macro model. |
| **Report Print Queue** | `OGC-1031`, anchor `OGC-431` | Adopting screens list report versions and open a report. Delivery, queueing and print presets are owned there. |
| **Interpretive threshold sets** | Folded into the Catalog Subscription epic | IHC consumes versioned, source-stamped threshold tables. Neither this shell nor the IHC FRS defines the subscription mechanism. |
| **Sample Storage model** | `OGC-657`, PR #3840 open | Where a screen records a physical storage location it reuses the shared storage model and `LocationPickerModal`, per `D-035`. No parallel storage tree. |

---

## Related and prior art

- **Cytology Case View v2.0** (`designs/pathology/cytology-case-view.md`) — the screen this shell was largely extracted from; conforms to nine of ten elements and is the reference implementation for S-9. Its `Related and prior art` bullet currently names the December 2025 pathology FRS as the parent pattern and should be re-pointed here.
- **Pathology Case View v2** (`OGC-264`) — the most structurally demanding adopter: eight gated stages, two actors, and the only screen rendering the progress rail.
- **IHC Case View v2** (`OGC-265`) — the adopter needing the most conversion work; introduces sections, gating, status, sign-out, reports and the critical-result hook, none of which it has today.
- **Global Critical Result Acknowledgment** — receiver of the `CriticalResultEvent` emitted by S-9.
- **Flexible RBAC revamp** — will eventually change how S-3.3 and S-7.2 resolve a user's capabilities. Nothing here anticipates it; adopting screens use existing module role bundles.

---

*End of FRS — v1.0, 2026-09-04*
