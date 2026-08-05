# M-03 Order Entry Micro Hook — Functional Requirements Specification

**Version:** 2.1 (adds Date of Admission — see *What changed from v2.0*)
**Date:** 2026-06-05
**Module:** Order Entry (existing OE module) — Microbiology-specific extension
**Phase:** 1A
**Owner:** Order Entry team (Microbiology Module M-00 is consumer)
**Status:** Draft
**Jira:** OGC-789

> This FRS is self-contained. It folds the AMR design-review edits (A-TC test-designation reconciliation, A-MIX mixed/multi-protocol handling, A-REUSE-1 culture-protocol→Method) **inline** below. There is no separate edits/addendum document.

This spec describes a small amendment to the existing OE Order Entry wizard: when an order routes to the Microbiology Case workflow, six micro-specific fields appear within Step 1's surface area. No new wizard step. This amendment lives in OE because it modifies the OE workflow; Micro is the consumer.

**What changed from v2.0 (2026-08-05).** Adds a seventh conditional field, **Date of Admission**, beside Patient Origin (§2.3). It is the missing input for the WHO GLASS `ORIGIN` classification: GLASS asks whether an infection was acquired in hospital or in the community, and the rule is *"infections are considered to be of hospital origin if patients had been hospitalized for more than 2 calendar days when the specimen was taken."* That derivation needs admission date + collection date + admitted/not. OpenELIS already has the second and third; verified 2026-08-05, it has **no admission date anywhere** — a repository-wide search for "admission" on `develop` returns zero results. Without it every record an OpenELIS site contributes to national surveillance is `ORIGIN=UNK`, and the hospital-acquired versus community-acquired split — a primary thing GLASS exists to measure — cannot be produced. **Patient Origin does not solve this**: `INP/OUT/ICU/EME/LTC` is *where the patient is*, not *when they arrived*, and the two are routinely conflated. See §2.3a.

**What changed from v1.0.** v1.0 hung Case creation on the OE clerk manually picking **Program = Microbiology** in Step 1. The design review (item A-TC) found this is the single largest cross-spec gap: there is no test attribute that says "ordering this test starts a Microbiology Case," so a clerk could order a Blood Culture under "Routine" and silently get no Case. v2.0 moves the trigger to a first-class **"Culture workflow" test attribute** (distinct from the AMR/WHONET surveillance flag) and routes through a **single trigger resolver** (§2.1a). The manual Program pick survives only as a derived/visible fallback, never the relied-upon mechanism. Per A-REUSE-1, the culture protocol is the test's **default Method**, not a new `culture_protocol` master.

---

## 1. Overview

### 1.1 Purpose

Capture the micro-specific information at order time that downstream Micro Module workflows depend on: culture protocol (= the test's default Method, per A-REUSE-1), patient origin, **date of admission**, number of sets, clinical history, antibiotic exposure flag, and critical-notification preference.

These fields appear conditionally — only when the order routes to the Microbiology Case workflow (determined by the trigger resolver of §2.1a). For all other orders (Routine, HIV, TB, EQA), the existing Step 1 renders unchanged.

### 1.2 Routes

| Surface | Route |
|---------|-------|
| Order Entry wizard Step 1 | `/order-entry/step-1` (existing) |

### 1.3 Users

| Role | Actions |
|------|---------|
| Reception staff / OE clerk | Fill micro fields when entering an order |
| Clinical lab staff | Same |
| ER / hospital staff (in some deployments) | Same |

### 1.4 Integration

- **OE Order Entry wizard** — primary host. M-03 adds a conditional section to Step 1.
- **Test Catalog (OGC-748)** — source of the **Culture-workflow** test attribute and the test's default **Method** (culture protocol). See §2.1a and A-TC reconciliation (§2.7).
- **M-04 Case Workbench Core** — consumes the micro fields when creating the Case on Sample save.
- **M-01 Reference Data** — the culture-protocol picker resolves to the test's default **Method** (A-REUSE-1), not a standalone Culture Protocol master.
- **M-08 Macro Library** — Clinical History field is macro-enabled with `clinical` category.

---

## 2. Step 1 — routing an order to the Microbiology Case workflow

### 2.1 Existing Program dropdown (now a derived signal, not the trigger)

The existing OE Step 1 has a Program dropdown:

- Routine Testing
- HIV Program
- TB Program
- EQA / Proficiency Testing
- (other site-specific programs)
- **Microbiology** (still selectable, but **no longer the primary trigger** — see §2.1a)

In v1.0 the clerk's manual choice of `Program = MICROBIOLOGY` was the only thing that created a Case. v2.0 demotes this to a derived/visible signal: the **Culture-workflow test attribute** is the authority. When a clerk adds a Culture-workflow test, the workflow routes itself and the Program is **auto-selected to Microbiology** (visible, but derived). The clerk no longer has to remember to pick the program, which removes the "clerk forgot the program → no Case" failure mode.

### 2.1a Single trigger resolver — the "Culture workflow" test attribute (A-TC)

**Decision (A-TC, recommended option 1).** Case creation is driven by a first-class per-test attribute, resolved in one place:

- **Culture-workflow attribute (carries a workflow type).** The Test Catalog (OGC-748) carries a per-test **"Culture workflow"** designation — "Set *Culture workflow* to make this test create a Microbiology Case and appear in the Worklist." It carries a **`workflow_type`**: **`BACTERIOLOGY`** (→ the M-04 bacterial Case profile) or **`MYCOBACTERIOLOGY_TB`** (→ the M-14 TB Case profile); `MYCOLOGY` is reserved for the future Mycology module (M-16). This is **distinct from the AMR/WHONET flag** (a *surveillance* marker). A test can be Culture-workflow (of a type) and/or AMR — separate concerns, not to be conflated.
- **Trigger resolver — returns the profile, not just yes/no.** One function `resolveMicroCaseTrigger(order)` (called by the OE wizard and the Sample-save hook) returns the **`workflow_type`** of the order's Culture-workflow test(s) — `BACTERIOLOGY`, `MYCOBACTERIOLOGY_TB`, or none. This is the **single source of truth** for both *whether* a Case is created and *which profile* it is. The conditional micro fields (§2.2), the info banner (§2.6), the auto-set of Program (§2.1), and the Case-creation hook (§5) all consult it — never a scattered `program == MICROBIOLOGY` check.
- **Workflow type → Case profile (the "which workflow" decision).** The returned `workflow_type` selects everything downstream: the **Case profile** (M-04 bacterial sections vs M-14 TB sections), the **breakpoint family** (CLSI/EUCAST clinical MIC vs **WHO-TB critical concentrations**, M-02), the **culture-protocol Method** (bacterial media vs MGIT/LJ), the **reflex cascade** variant, and the **WHONET export flavor** (bacterial vs TB, M-09). A tech never chooses "bacterial vs TB" — the **ordered test decides it**. One culture protocol per Case (A-MIX), so a specimen needing **both** routine culture and TB is **two ordered tests → two Cases on the same `SampleItem`** (one M-04 bacterial, one M-14 TB), each in its own profile — no second accessioning (§2A).
- **Derived Program fallback — and it never silently guesses TB.** If a deployment hasn't yet typed its culture tests, the resolver still fires on a manual `Program = MICROBIOLOGY` pick so a Case *is* created (this avoids the v1.0 "clerk forgot → silent no-Case" bug). The fallback case's `workflow_type` comes from a **deployment-level default** (reuse `site_information` config, e.g. `default_micro_workflow`):
  - a **bacteriology-only lab** sets it to `BACTERIOLOGY` → fallback cases are born bacterial, frictionless;
  - a lab that **also does TB** leaves it **unset** → the fallback case is created **`UNASSIGNED`** (`workflow_type IS NULL`) and the tech classifies it (M-04 §4.9).
  This is the reconciliation of the earlier "defaults to bacteriology" vs "UNASSIGNED" wording: **we only default to a workflow when the deployment has explicitly said it's safe to; otherwise we never guess** (defaulting a TB specimen to the bacterial profile would mean wrong breakpoints and a wrong report). Program-driven creation is a fallback, not the design intent — a fully typed catalog never reaches it.
- **Culture protocol = the test's default Method (A-REUSE-1).** When the resolver fires, the protocol picker is pre-filled from the test's **default Method** (`test_method.is_default`), not from a `default_culture_protocol_id` field and not from a new `culture_protocol` master. See §2.3 and A-TC (§2.7).

*Rationale:* one resolver = one source of truth for "does this order start a Case," and it keys off a real test attribute rather than a clerk's memory.

### 2.2 When the resolver fires (Culture-workflow test on the order)

The Step 1 form expands inline (no modal, no new step) to show the micro fields. The expansion is in a `Tile` styled as a sub-section to make the relationship clear. (When only the manual Program fallback is used, the same tile appears.)

```
┌─ Program Selection ─────────────────────────────────────────────────────────┐
│                                                                              │
│  Program: *  (auto-set to Microbiology by a Culture-workflow test)           │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Microbiology                                                          ▼ │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Microbiology Program Details ────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │ 🦠 This will create a Microbiology Case for culture and susceptibility │ │
│  │    testing.                                                             │ │
│  │                                                                         │ │
│  │ Culture Protocol (Method): *                                            │ │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │ │ Blood Culture Standard                                            ▼ │ │ │
│  │ └─────────────────────────────────────────────────────────────────────┘ │ │
│  │ Defaulted from the test's default Method; override if needed            │ │
│  │                                                                         │ │
│  │ Patient Origin:                                                         │ │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │ │ Emergency                                                         ▼ │ │ │
│  │ └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
│  │ Date of Admission:                                                      │
│  │ ┌─────────────────────┐                                                 │
│  │ │ 01/08/2026          │                                                 │
│  │ └─────────────────────┘                                                 │
│  │ Date admitted as an inpatient. Leave blank for outpatients              │
│  │ Collected 4 days after admission → hospital-origin for surveillance     │
│  │                                                                         │
│  │ Number of Sets:                                                         │ │
│  │ ┌──────────────┐                                                        │ │
│  │ │ 2            │                                                        │ │
│  │ └──────────────┘                                                        │ │
│  │ For blood cultures, typical is 2 sets from different sites              │ │
│  │                                                                         │ │
│  │ Clinical History:                                                       │ │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │ │ Fever 39.2, hypotension, possible sepsis. .abx2w                    │ │ │
│  │ └─────────────────────────────────────────────────────────────────────┘ │ │
│  │ Macros: `clinical` (type . for shortcuts)                              │ │
│  │                                                                         │ │
│  │ ☑ Patient has recent antibiotic exposure (within 2 weeks)              │ │
│  │                                                                         │ │
│  │ ☑ Notify clinician immediately for positive blood culture              │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Field specifications

| Field | Component | Required | Source / Default | Notes |
|-------|-----------|----------|------------------|-------|
| Culture Protocol (Method) | `ComboBox` referencing the active **Methods** linked to the test (A-REUSE-1) | Yes | Defaulted from the selected test's **default Method** (`test_method.is_default`); user can override with any Method linked to the test | Drives downstream culture setup; max incubation days come from the Method's culture-params extension (`incubation_hours`, `subculture_at_hours`, etc.) per A-REUSE-1 |
| Patient Origin | `Dropdown` referencing patient_origin reference table | No | Defaulted from requesting unit/ward if known | Used in WHONET export (Phase 1B) |
| **Date of Admission** | `DatePicker` (single, short) | No — **never blocks save** | Empty | Date the patient was admitted as an inpatient. Disabled when Patient Origin = Outpatient. Sole purpose is the GLASS `ORIGIN` derivation (§2.3a) — **new data element**, see §10 |
| Number of Sets | `NumberInput`, 1-10 | No | Default 1 (or 2 for blood cultures based on the Method) | Helper text contextual to specimen type |
| Clinical History | `MacroTextarea`, `clinical` category, ≤ 1000 chars | No | Empty | Captures relevant patient context |
| Antibiotic Exposure | `Checkbox` | No | Default false | "Patient has recent antibiotic exposure (within 2 weeks)" |
| Critical Value Notify | `Checkbox` | No | Default true for blood culture / CSF / sterile sites; false for non-sterile sites | "Notify clinician immediately for positive [specimen type]" |

> **A-REUSE-1 note.** "Culture protocol" is **the test's default Method**, not a new master. The picker lists Methods linked to the test via `test_method`; the default is the one with `is_default = true`. Incubation parameters (`incubation_hours`, `incubation_temp_celsius`, `atmosphere`, `subculture_at_hours`) are a small culture-params extension on `method`. There is no `default_culture_protocol_id` and no standalone `culture_protocol` table. M-01 drops the proposed `culture_protocol` master accordingly.

### 2.3a Date of Admission — what it is for, and what it is not

**What it is.** The date the patient was admitted to the facility as an inpatient. It is **not** the order date, the collection date, or the date the lab received the specimen. Its only job is to let the system work out **how many days the patient had been in hospital when the specimen was taken**.

**Why M-03 owns it.** The value has to be known at order entry — it is a fact about the patient's episode that reception has in front of them and the lab does not. Capturing it later means chasing it, which in practice means not capturing it.

**Conditional behaviour.**

- **Enabled** when Patient Origin is Inpatient, ICU, Long-term Care, Emergency, or Unknown. Emergency and Unknown stay enabled deliberately: an ER patient may well have been admitted, and forcing the clerk to fix Patient Origin first to record a date they already know is friction for no gain.
- **Disabled** when Patient Origin = Outpatient, with helper text explaining why ("Outpatients are not admitted — recorded as community-origin"). Do not hide it; a disappearing field reads as a bug.
- **Optional in every case.** It must never block Save, Continue, or Case creation. A lab that does no inpatient work should be able to ignore it permanently and never see a warning.

**Derivation is owned by M-09, not here.** M-03 captures the input; the `INFECTION_ORIGIN` value (`HO` / `CO` / `UNK`) is computed in the WHONET/GLASS export. M-03 must **not** compute, store, or display a stored origin classification — that would create a second source of truth that goes stale when a collection date is corrected. A **read-only inline hint** beside the date field ("Collected 4 days after admission → hospital-origin for surveillance") is allowed and encouraged, because it shows the clerk why the field matters; it is presentation, recomputed on render, never persisted.

**Degradation is part of the requirement.** The field will often be empty, and the export must still produce something defensible rather than failing:

| Situation | Derived `ORIGIN` |
|---|---|
| Patient Origin = Outpatient | `CO` — no date needed |
| Admitted, date present, collected ≤ 2 calendar days after admission | `CO` |
| Admitted, date present, collected > 2 calendar days after admission | `HO` |
| Admitted, **no date** | `UNK` |
| Patient Origin unknown and no date | `UNK` |

Two of those five rows resolve without the new field at all, which is worth stating plainly: even partial adoption is a large improvement on today, where **every** row is `UNK`.

### 2.4 Priority — NOT in Step 1

Per the v1.1 narrative critique: priority is an Order-level concept that lives on Step 3 (Add Order), not on Step 1 program details. M-03 does **not** include Priority in the micro fields. The existing Step 3 priority handling applies to all programs.

### 2.5 Validation

- Culture Protocol (Method) is required when the trigger resolver fires.
- Number of Sets is bounded 1-10.
- Clinical History ≤ 1000 chars.
- Date of Admission, when entered, must not be **in the future**, and must not be **later than the Step 2 Collection Date** — a patient cannot be admitted after their specimen was drawn. Both surface as inline, correctable field errors; neither is a blocking save failure.
- Date of Admission is serialized using the deployment's configured **Date locale** (Admin → General Configuration → Site Information), consistent with every other date in the payload. Flagged explicitly because a live defect already emits `MM/DD/YYYY` in the sampleXML while the app runs `DD/MM/YYYY`, producing a server 400 whenever the day-of-month exceeds 12 — a new user-typed date is a likely place for that to resurface.

Other fields are optional.

### 2.6 Info banner

When the trigger resolver fires (a Culture-workflow test is added, or Program = Microbiology is manually selected), an `InlineNotification` (kind=info, lowContrast) appears at the top of the micro fields tile:

> 🦠 This will create a Microbiology Case for culture and susceptibility testing.

This tells the order entry clerk that downstream Case creation will happen on Sample save. (The icon may be optional based on Carbon style guidelines; emoji used here for clarity in the spec sketch.)

### 2.7 A-TC reconciliation — the test-designation gap, resolved here

This subsection records the cross-spec reconciliation that v2.0 folds in, so the trigger is unambiguous for implementers across M-00, M-01, M-03, and the Test Catalog (OGC-748).

**The gap v1.0 had.** v1.0 created the Case when a Sample saved with `program = MICROBIOLOGY` (AC-M03-13), a program the clerk picked manually. The Test Catalog (OGC-748) has no micro `program` value, no `default_culture_protocol_id`, and no `valid_organisms`; its one real per-test flag is the **AMR flag**, which is a WHONET/surveillance marker, not a "run the culture workflow" marker. So nothing tied a test to Case creation, and the AMR flag did not trigger a Case.

**The resolution v2.0 adopts (A-TC option 1), now typed.**

1. A first-class **Culture-workflow designation** on the Test, carrying a **`workflow_type`** (`BACTERIOLOGY` / `MYCOBACTERIOLOGY_TB`; `MYCOLOGY` reserved) — distinct from, but able to imply, the AMR flag. A test so designated: (a) carries its culture protocol as the test's **default Method** (A-REUSE-1) and `valid_organisms` (added to the Test Catalog, referenced by M-01/M-03), and (b) **auto-routes the order to the matching Microbiology Case profile when ordered** — no separate manual Program pick. **The single concrete home for this attribute is specified in `test-catalog-micro-workflow-attribute.md`** (a foldable section of the Test Catalog v2.5 Basic Info editor): one nullable `test.culture_workflow_type` enum.
2. The manual Program pick is retained as a derived/visible fallback only (§2.1); the fallback defaults the case to `BACTERIOLOGY`.
3. Culture protocol = the test's default **Method** (`test_method.is_default`); no `default_culture_protocol_id`, no new `culture_protocol` master. The **AMR flag** and the **Culture-workflow designation** are separate concerns — a test can be one, both, or neither.
4. **Unassigned / wrong workflow (tech escape hatch).** If a deployment hasn't yet typed its culture tests, or a test was mis-typed, the resolver may produce a case with **no valid `workflow_type`**. Such a case is created in an **`UNASSIGNED` classification state**, flagged on the Worklist, and the **tech can set or change the workflow** from the Case Workbench (reuse the M-04 *Change workflow* action) — which re-instantiates the profile, breakpoint family, organism vocabulary, and prompts for the culture-protocol Method. Reassignment is audited (History/Note) and guarded once interpretive results exist. See M-04 §4.x (Change workflow).

**Editor helper text (Test Catalog).** "Set the *Microbiology workflow* (Bacteriology / Mycobacteriology–TB) to make this test create the matching Microbiology Case and appear in the Worklist." Keeps the workflow extensible to tests added later, and to new workflow types.

---

## 2A. Mixed and multi-protocol orders (A-MIX)

A micro Case is **keyed to `SampleItem` × `workflow_type`** (one workflow's workup of one physical specimen), with a **single culture protocol** per Case (the test's default Method). The resolver groups the order's micro tests by **(SampleItem, workflow_type)** and creates **one Case per group**. The mixes:

- **Micro + non-micro tests on one specimen.** The non-micro analyses follow the normal Sample → SampleItem → Analysis → Result path. The **Case covers only the micro workup** on that SampleItem: it does **not** show or block on the chemistry, and the micro report is independent. The resolver groups only the micro tests.
- **Bacterial + TB on one specimen.** Two Culture-workflow tests with **different** `workflow_type`s on the **same SampleItem** resolve to **two Cases that share one `sample_item_id`** — one bacterial (M-04), one TB (M-14) — each with its own profile, protocol, breakpoints, lifecycle, and report. **No second accessioning**, and the shared specimen is intrinsic (same SampleItem). The wizard surfaces an inline notification: "This specimen starts a Bacteriology case **and** a Mycobacteriology–TB case (same specimen)." Deliberate, not an error.
- **Two separate specimens** (a sputum for TB plus another for culture) arrive as **two SampleItems** → two Cases naturally.
- **Paired sets** (e.g. 2 blood-culture bottles): handled via `number_of_sets` **within one Case** — unchanged.
- **Panels and reflexes carry `workflow_type` through unchanged.** A **panel** bundling tests of different `workflow_type`s expands to the same multi-Case outcome — flag at panel configuration (a "mixed-workflow panel" warning). A **reflex/test-rule** ordering a follow-up culture/TB test is resolved **identically** by (SampleItem, workflow_type); a reflex adding a *different*-workflow test follows the two-Cases rule and does **not** reclassify the originating case. The resolver is the single decision point for ordered, panel, and reflex-ordered tests alike.
- **Panels and reflexes carry `workflow_type` through unchanged.** A **panel** that bundles tests of different `workflow_type`s expands to the same multi-Case outcome — flag this at panel configuration (a "mixed-workflow panel" warning) so it's intentional. A **reflex/test-rule** that orders a follow-up culture/TB test is resolved **identically**: the reflex-ordered test's own `workflow_type` decides its Case. A reflex that adds a *different*-workflow test (e.g. a positive bacterial screen reflexing a TB test) follows the two-Cases rule; it does **not** reclassify the originating case. The resolver is the single decision point for ordered, panel, and reflex-ordered tests alike.

---

## 3. Sample step (Step 2) — no changes

Standard Sample fields apply to all programs:

- Sample Type (required)
- Collection Date (required)
- Collection Time
- Sample Source / Site

M-03 does not modify Step 2.

---

## 4. Order step (Step 3) — no changes (Priority lives here)

Standard Order fields apply to all programs:

- Lab Number (auto-generated)
- Ordering Provider (required)
- Site / Ward
- Requester Phone
- **Priority** (Routine / Urgent / STAT) — set here for all programs

M-03 does not modify Step 3.

---

## 5. Save behavior

When the Order Entry wizard completes and Sample is saved:

1. Sample row created in `sample` table. For micro-routed orders, `program = MICROBIOLOGY` is recorded (auto-set by the resolver, §2.1).
2. The micro-specific fields are persisted (either on the Sample row if the existing OE schema supports program-specific columns, or in a `micro_order_data` sibling table — exact location verified during implementation per crosswalk Q1 sibling pattern). The chosen culture protocol is stored as the resolved **Method** reference (A-REUSE-1).
3. The Sample post-save hook calls the **single trigger resolver** (`resolveMicroCaseTrigger`, §2.1a); when it returns true it fires `MicroCaseService.createCaseForSample(sample_id)`.
4. M-04 creates one `micro_case` row with stage RECEIVED, scoped to the micro workup only (A-MIX). A second culture protocol on the same Sample is not created here (out of scope, §2A).

The user is returned to the standard OE post-save destination; the Micro module handles the Case visibility from its own surfaces (the Worklist).

---

## 6. Conditional rendering

The Microbiology Program Details tile is shown only when the **trigger resolver** (§2.1a) returns true — i.e. when a Culture-workflow test is on the order (primary) or `Program = MICROBIOLOGY` is manually selected (fallback).

- When the user removes the last Culture-workflow test, or changes the Program away from Microbiology, the tile collapses (with confirmation if data was entered: "Discard Microbiology details?").
- When a Culture-workflow test is re-added (or Microbiology re-selected), the tile re-appears with any previously entered values preserved within the same session.

---

## 7. Permissions

| Action | Permission |
|--------|-----------|
| Order a Culture-workflow test / see Microbiology in the Program dropdown | `micro.case.create` (typically granted to OE clerks at sites that do micro) |
| Fill micro fields | Same (no separate permission) |

Sites that don't do micro don't flag any test as Culture-workflow and don't grant the permission; the dropdown won't show Microbiology and no Case is created.

---

## 8. Acceptance criteria

- **AC-M03-01**: Ordering a test with **Culture workflow = true** routes the order to the Microbiology Case workflow via the single trigger resolver (§2.1a), and auto-sets Program = Microbiology (derived/visible).
- **AC-M03-02**: The trigger resolver also returns true on the manual `Program = MICROBIOLOGY` fallback; both paths render the Program Details tile inline.
- **AC-M03-03**: Culture-protocol picker lists the **Methods** linked to the test (A-REUSE-1); no `culture_protocol` master is referenced.
- **AC-M03-04**: Selecting a Culture-workflow test pre-fills the picker with the test's **default Method** (`test_method.is_default`).
- **AC-M03-05**: Patient Origin dropdown shows seeded values from M-01.
- **AC-M03-06**: Clinical History supports macro expansion (`clinical` category).
- **AC-M03-07**: Antibiotic Exposure checkbox saves correctly.
- **AC-M03-08**: Critical Value Notify checkbox default varies by specimen type.
- **AC-M03-09**: Priority is NOT in Step 1 micro fields (lives on Step 3 per existing OE).
- **AC-M03-10**: Validation: Culture Protocol (Method) required when the trigger resolver fires.
- **AC-M03-11**: Info banner displays when the resolver fires.
- **AC-M03-12**: Removing the last Culture-workflow test (or changing Program away from Microbiology) with data entered prompts confirmation.
- **AC-M03-13**: On Sample save, the **single trigger resolver** is consulted and, when true, a Case is auto-created in stage RECEIVED. No separate `program == MICROBIOLOGY` string check exists outside the resolver.
- **AC-M03-14**: All micro-specific fields are persisted and available to M-04; the culture protocol is stored as the resolved Method reference.
- **AC-M03-15**: The **Culture-workflow** attribute and the **AMR/WHONET** flag are independent — a test may be one, both, or neither; the AMR flag alone does **not** trigger a Case.
- **AC-M03-16**: Mixed micro + non-micro on one Sample creates a Case scoped to the micro workup only; the Case does not block on or display non-micro results (A-MIX).
- **AC-M03-17**: Two differing culture protocols on one Sample are rejected with the "enter a second sample" notification (out of scope for Phase 1A, A-MIX).
- **AC-M03-18**: NFR-04 (a11y) — micro fields keyboard-reachable.
- **AC-M03-19**: Date of Admission renders beside Patient Origin whenever the trigger resolver fires, and is **optional** — saving, continuing, and Case creation all succeed with it empty, with no warning.
- **AC-M03-20**: Date of Admission is disabled, with explanatory helper text, when Patient Origin = Outpatient; it is enabled for Inpatient, ICU, Long-term Care, Emergency, and Unknown. It is never hidden.
- **AC-M03-21**: A Date of Admission in the future, or later than the Step 2 Collection Date, produces an inline correctable field error — not a save failure or an unrecoverable error.
- **AC-M03-22**: Date of Admission is persisted with the other micro order fields and is readable by M-09; **no `INFECTION_ORIGIN` value is computed or stored by M-03**. Any origin text shown on Step 1 is a recomputed-on-render hint only.
- **AC-M03-23**: Date of Admission round-trips through the configured Date locale — a date with day-of-month > 12 saves and reloads unchanged.

---

## 9. i18n keys

Estimated 22-28 keys. Pattern:

```
orderEntry.step1.program.option.microbiology      "Microbiology"
orderEntry.step1.microbiology.tile.title          "Microbiology Program Details"
orderEntry.step1.microbiology.banner              "This will create a Microbiology Case for culture and susceptibility testing."
orderEntry.step1.microbiology.field.cultureProtocol.label "Culture Protocol (Method)"
orderEntry.step1.microbiology.field.cultureProtocol.helper "Defaulted from the test's default Method; override if needed"
orderEntry.step1.microbiology.field.patientOrigin.label "Patient Origin"
orderEntry.step1.microbiology.field.patientOrigin.option.inpatient "Inpatient"
orderEntry.step1.microbiology.field.patientOrigin.option.outpatient "Outpatient"
orderEntry.step1.microbiology.field.patientOrigin.option.icu "ICU"
orderEntry.step1.microbiology.field.patientOrigin.option.emergency "Emergency"
orderEntry.step1.microbiology.field.patientOrigin.option.longTermCare "Long-term Care"
orderEntry.step1.microbiology.field.patientOrigin.option.unknown "Unknown"
orderEntry.step1.microbiology.field.admissionDate.label "Date of Admission"
orderEntry.step1.microbiology.field.admissionDate.helper "Date the patient was admitted as an inpatient. Leave blank for outpatients."
orderEntry.step1.microbiology.field.admissionDate.helper.outpatient "Outpatients are not admitted — recorded as community-origin."
orderEntry.step1.microbiology.field.admissionDate.hint.origin "Collected {{days}} days after admission → hospital-origin for surveillance"
orderEntry.step1.microbiology.error.admissionDateFuture "Date of Admission cannot be in the future"
orderEntry.step1.microbiology.error.admissionDateAfterCollection "Date of Admission cannot be later than the collection date"
orderEntry.step1.microbiology.field.numberOfSets.label "Number of Sets"
orderEntry.step1.microbiology.field.numberOfSets.helper.blood "For blood cultures, typical is 2 sets from different sites"
orderEntry.step1.microbiology.field.clinicalHistory.label "Clinical History"
orderEntry.step1.microbiology.field.clinicalHistory.helper "Macros: `clinical` (type . for shortcuts)"
orderEntry.step1.microbiology.field.antibioticExposure.label "Patient has recent antibiotic exposure (within 2 weeks)"
orderEntry.step1.microbiology.field.criticalNotify.label "Notify clinician immediately for positive {{specimenType}}"
orderEntry.step1.microbiology.error.cultureProtocolRequired "Culture Protocol is required for Microbiology orders"
orderEntry.step1.microbiology.notice.twoProtocols "This sample has two culture protocols; enter a second sample for the second protocol."
orderEntry.step1.microbiology.confirm.discard.title "Discard Microbiology details?"
orderEntry.step1.microbiology.confirm.discard.message "You have entered Microbiology details. Changing the Program will discard them."
orderEntry.step1.microbiology.confirm.discard.confirm "Discard"
```

---

## 10. Open verification items

- Confirm the Test Catalog (OGC-748) lands the **Culture-workflow** attribute and `valid_organisms`, and exposes the test's default **Method** for the resolver to read (A-TC cross-spec item, tracked in M-00).
- Confirm exact location to persist micro-specific Order fields: on `sample` table (program-specific columns) vs. `micro_order_data` sibling table.
- Confirm OE Sample-save hook mechanism (per M-04 §3.2 — Case creation hook) calls the single trigger resolver.
- Confirm existing Program dropdown's render mechanism for conditional content (now keyed off the resolver).
- **Date of Admission is a genuinely new data element** (design-addendum MUST A / D-009). Nothing equivalent exists: `PatientType` (Inpatient / Outpatient) is present on `develop`, but a repository-wide search for "admission" returns zero results. **Storage location is the same open question as the other micro order fields** — `sample` vs. a `micro_order_data` sibling table — with one added constraint: it must be readable from whatever record the M-09 surveillance export queries. If a future non-micro programme needs it, it belongs on the patient episode rather than the micro sibling table; worth a five-minute decision with the OE team before implementation rather than after.
- Confirm `PatientType` (Inpatient / Outpatient) is reliably populated in practice. The origin derivation degrades to `UNK` without it, so an admission date on its own is not sufficient — and if `PatientType` is widely empty in real deployments, that is the more valuable thing to fix first.
- Worth asking one national coordinating centre whether partial origin (outpatients resolved to `CO`, admitted patients without a date left `UNK`) is preferable to none. The degradation table in §2.3a assumes yes; that assumption is cheap to test and expensive to get wrong.

---

## 11. References

- M-00 Microbiology Module Parent Specification (cross-cutting principles; A-TC tracked as an open cross-spec item)
- M-04 Case Workbench Core (consumes saved micro fields on Case creation; 1:1 Case↔Sample; A-MIX scope)
- M-01 AMR Reference Data (culture protocol = Method via A-REUSE-1; `valid_organisms`; Patient Origin)
- M-09 WHONET / GLASS Export (OGC-794) — **consumer** of Date of Admission; owns the `INFECTION_ORIGIN` (`HO`/`CO`/`UNK`) derivation and the >2-calendar-day rule
- WHO GLASS manual for early implementation, 2023 (ISBN 9789240076600) — source of the hospital-origin rule quoted in *What changed from v2.0*
- Test Catalog (OGC-748) — Culture-workflow attribute, AMR flag, default Method
- M-08 Macro Library (`clinical` category for Clinical History field)
- Existing OE Order Entry wizard (Step 1 / Step 2 / Step 3 documentation)
- AMR/Micro FRS review edits — A-TC, A-MIX, A-REUSE-1 (folded inline here)
- `amr-micro-narrative-v1-for-devs.md` Phase 1 §Pre-analytical
- v1.1 Workbench FRS §5 Order Entry hook (superseded by M-03)
