# M-06 Expert Rules Engine — Functional Requirements Specification

**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-07
**Module:** Microbiology → Expert Rules (Phase 1B)
**Phase:** 1B
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec covers the Expert Rules engine that runs against AST Run state changes and produces flags and overrides. Phase 1B feature; Phase 1A ships with manual expert review (tech and supervisor apply rules manually via overrides in M-05).

> This FRS is self-contained. There is no separate addendum — every decision from the design review (Expert Review section always present with an empty state; the confirmation-test loop; reidentification → flag re-evaluation signal; decision-panel (inline) post-save behavior; reuse of the existing reflex/test-rules engine for confirmation/AST ordering) is written inline below.
>
> **Interaction model (Principle 3) — resolves design-check F-14.** The bench-facing **Expert Review Decision is an inline panel** that expands within the Case Detail Expert Review section — **not** a pop-up modal — consistent with M-04/M-05 (which log criticals and enter/override AST inline). Modals are reserved only for genuinely destructive confirmations. The **admin Expert Rule Editor** (`/admin/micro/expert-rules`) is a configuration surface, not bench work, so it may remain an overlay/page; the inline-bench rule applies to the Case Detail decision flow.

---

## 1. Overview

### 1.1 Purpose

Modern AST reporting is not just "here are the raw S/I/R values." Several patient-safety rules layer on top:

- **MRSA inference** — S. aureus oxacillin-R means resistant to all beta-lactams regardless of MIC. Force beta-lactam columns to R.
- **D-test required** — S. aureus erythromycin-R + clindamycin-S triggers a need for D-test before reporting clindamycin.
- **ESBL screen + confirm** — Enterobacterales with high cephalosporin MICs trigger phenotypic confirmation, then over-ride beta-lactams to R.
- **Cascade reporting** — Urines should report first-line antibiotics; second/third-line only when first-line fails.
- **Intrinsic resistance verification** — Some organisms are always resistant to specific drugs; the engine flags AST results that contradict (suggests technical error).

M-06 introduces a rules engine that evaluates AST Run state changes, produces flags requiring review, and (after review) applies overrides via the M-05 override mechanism.

### 1.2 Division of responsibility — the reflex/test-rules engine orders; M-06 decides phenotype

The micro cascade (positive → identify → AST → confirmation) is exactly what the existing **reflex / test-rules** engine (`test-rules-mvp-frs.md`) already does: a `Rule {type:reflex, conditionTree, actions}` evaluates a reported result and fires `OrderAction { target: test|panel, priority, reason }`. M-06 **reuses** that engine for the *ordering* decisions rather than inventing a parallel mechanism:

- **Reflexes drive the *what-to-order-next* cascade.** When an expert rule's decision is "order a confirmation test" (D-test, ESBL confirmation), the order is **fired through the existing reflex/test-rules action API** — the same path the molecular/analyzer work uses — not a bespoke M-06 ordering routine.
- **The reflex orders the AST panel from the organism default** once an organism is identified: `WHEN Organism ID is <organism> THEN order AST panel (per organism default)` — the organism's Default AST Panel (M-01) is the reflex's order target.
- **M-06 owns the phenotype/expert-rule decisions and overrides** — the engine reads AST patterns, raises flags, applies S/I/R overrides via M-05, and stamps phenotype flags on the isolate. It does not re-implement ordering.

This division (reflexes = ordering cascade; M-06 = phenotype/override decisions; the Case Workbench = workup state) is stated in M-00 and cross-referenced here.

### 1.3 Routes

| Surface | Route |
|---------|-------|
| Expert Rules admin (rule definitions) | `/admin/micro/expert-rules` |
| Expert Rule Editor (admin config surface — overlay/page; admin, not bench) | (admin) |
| Expert Review section in M-04 Case Detail | (embedded in Case Detail) |
| Expert Review Decision — **inline panel** (Principle 3) | (inline expansion within the Case Detail Expert Review section) |

### 1.4 Users

| Role | Actions |
|------|---------|
| Lab Manager | Configure rule definitions; activate / deactivate rules |
| Microbiology Supervisor | Review flags, apply or reject suggested overrides |
| Microbiology Technician | Review flags for own cases; apply per supervisor SOP |
| System Administrator | All actions |

### 1.5 Integration

- **M-05 AST Entry & Interpretation** — Engine fires on AST Run state changes (new result, override, status to COMPLETE); applies overrides via the M-05 override mechanism.
- **M-04 Case Workbench Core** — Expert Review section in Case Detail renders flags; the Expert Review Decision **panel expands inline** (Principle 3).
- **Reflex / test-rules engine** (`test-rules-mvp-frs.md`) — confirmation-test orders and the organism-default AST panel order are fired through its `OrderAction` API (see §1.2).
- **M-08 Macro Library** — `ast` category macros in flag decision justifications.
- **M-09 WHONET Export** — Phenotype flag columns populated from engine outputs.
- **M-01 AMR Reference Data** — Rules reference organism groups, antibiotic classes; the organism Default AST Panel is the reflex order target.

---

## 2. Data model

### 2.1 Rule definitions

```
expert_rule_definition
├── rule_id (UUID PK)
├── code (text, unique, ≤ 30 chars uppercase — e.g., "MRSA_INFERENCE")
├── name (text, ≤ 200 chars)
├── description (text)
├── rule_type (enum: PHENOTYPE_INFERENCE, FLAG_REQUIRED, CASCADE_REPORTING, INTRINSIC_VERIFICATION, EXCEPTIONAL_PHENOTYPE)
├── trigger_condition (JSON — see §3)
├── action (JSON — see §4)
├── version (int, default 1; incremented on definition change)
├── active (bool, default true)
├── built_in (bool — true if shipped by OE, false if lab-customized)
├── seeded (bool)
└── audit columns

expert_rule_definition_version (immutable history)
├── version_id (PK)
├── rule_id (FK)
├── version (int)
├── trigger_condition_snapshot (JSON)
├── action_snapshot (JSON)
├── changed_at, changed_by
```

### 2.2 Flags raised on AST Runs

```
expert_rule_flag
├── flag_id (UUID PK)
├── ast_run_id (FK to micro_ast_run)
├── rule_id (FK to expert_rule_definition)
├── rule_version (int, snapshot at flag creation)
├── flag_status (enum: OPEN, AWAITING_CONFIRMATION, RESOLVED, DEFERRED, OVERRIDDEN)
├── detected_at (timestamp)
├── decision (enum: APPLIED, REJECTED, ORDER_CONFIRMATION, DEFERRED, nullable)
├── decided_at (timestamp, nullable)
├── decided_by (FK to user, nullable)
├── justification (text, macro-enabled, `ast` category, nullable)
├── linked_override_id (FK to micro_ast_override, nullable — set when decision results in an override)
├── confirmation_order_id (FK to the reflex-fired order, nullable — set when decision = ORDER_CONFIRMATION; see §5.3)
├── confirmation_result_id (FK to result, nullable — the confirmation test result that re-opens the flag; see §5.3)
├── review_needed (bool, default false — set true when the owning isolate is reidentified; see §5.4)
└── audit columns
```

`confirmation_order_id`, `confirmation_result_id`, and `review_needed` are the only data-model additions in this consolidation; they close the confirmation loop and the reidentification signal without new tables.

---

## 3. Trigger conditions

Rules describe what AST result patterns trigger them. The trigger_condition JSON is structured:

```json
{
  "match_organism": { "type": "GROUP", "value": "Enterobacterales" },
  "match_antibiotic_pattern": [
    { "antibiotic_code": "CRO", "interpretation": "R" }
  ],
  "match_specimen_type": "any"
}
```

### 3.1 Built-in rule examples

**MRSA inference:**

```json
{
  "code": "MRSA_INFERENCE",
  "rule_type": "PHENOTYPE_INFERENCE",
  "trigger_condition": {
    "match_organism": { "type": "GROUP", "value": "Staphylococcus" },
    "match_antibiotic_pattern": [
      { "antibiotic_code": "OXA", "interpretation": "R" }
    ]
  },
  "action": {
    "type": "AUTO_OVERRIDE",
    "set_phenotype_flag": "MRSA",
    "override_all_in_class": ["Penicillin", "Aminopenicillin", "BL/BLI",
                              "Cephalosporin 1G", "Cephalosporin 2G",
                              "Cephalosporin 3G", "Cephalosporin 4G",
                              "Cephalosporin 5G", "Carbapenem"],
    "override_to": "R",
    "auto_apply": true,
    "require_supervisor_review": false,
    "justification_template": ".mrsac"
  }
}
```

**D-test required:**

```json
{
  "code": "D_TEST_REQUIRED",
  "rule_type": "FLAG_REQUIRED",
  "trigger_condition": {
    "match_organism": { "type": "GROUP", "value": "Staphylococcus" },
    "match_antibiotic_pattern": [
      { "antibiotic_code": "ERY", "interpretation": "R" },
      { "antibiotic_code": "CLI", "interpretation": "S" }
    ]
  },
  "action": {
    "type": "FLAG_ONLY",
    "flag_message": "ERY-R + CLI-S pattern detected. D-test recommended before reporting CLI.",
    "decision_options": [
      { "id": "ORDER_CONFIRMATION", "label": "Order D-test" },
      { "id": "D_TEST_NEGATIVE_REPORT_S", "label": "D-test negative — report CLI as S",
        "applies_override": false },
      { "id": "D_TEST_POSITIVE_REPORT_R", "label": "D-test positive — report CLI as R",
        "applies_override": { "antibiotic_code": "CLI", "override_to": "R" },
        "set_phenotype_flag": "D_TEST_POSITIVE" },
      { "id": "REPORT_R_CONSERVATIVE", "label": "Report CLI as R (conservative, without D-test)",
        "applies_override": { "antibiotic_code": "CLI", "override_to": "R" } }
    ]
  }
}
```

**ESBL screen:**

```json
{
  "code": "ESBL_SCREEN",
  "rule_type": "FLAG_REQUIRED",
  "trigger_condition": {
    "match_organism": { "type": "GROUP", "value": "Enterobacterales" },
    "match_antibiotic_pattern": [
      { "$any_of": [
        { "antibiotic_code": "CRO", "interpretation": "R" },
        { "antibiotic_code": "CTX", "interpretation": "R" },
        { "antibiotic_code": "CAZ", "interpretation": "R" }
      ]}
    ]
  },
  "action": {
    "type": "FLAG_ONLY",
    "flag_message": "Possible ESBL — 3GC resistance detected. Phenotypic confirmation recommended.",
    "decision_options": [
      { "id": "ORDER_CONFIRMATION", "label": "Order ESBL confirmation" },
      { "id": "ESBL_CONFIRMED", "label": "ESBL confirmed — apply phenotype override",
        "set_phenotype_flag": "ESBL_CONFIRM",
        "override_all_in_class_for_organism_group": ["Penicillin", "Aminopenicillin",
                                                       "BL/BLI",
                                                       "Cephalosporin 1G", "Cephalosporin 2G",
                                                       "Cephalosporin 3G", "Cephalosporin 4G",
                                                       "Cephalosporin 5G"],
        "override_to": "R",
        "justification_template": ".esblc" },
      { "id": "ESBL_RULED_OUT", "label": "ESBL ruled out — AST stands" }
    ]
  }
}
```

**Cascade reporting (urine):**

```json
{
  "code": "CASCADE_URINE",
  "rule_type": "CASCADE_REPORTING",
  "trigger_condition": {
    "match_organism": { "type": "GROUP", "value": "Enterobacterales" },
    "match_specimen_type": "urine"
  },
  "action": {
    "type": "CASCADE",
    "tier_1_visible_always": true,
    "tier_2_visible_when": "all_tier_1_R",
    "tier_3_visible_when": "all_tier_1_and_2_R",
    "auto_apply": true,
    "require_supervisor_review": false
  }
}
```

**Intrinsic resistance verification:**

```json
{
  "code": "INTRINSIC_VERIFY",
  "rule_type": "INTRINSIC_VERIFICATION",
  "trigger_condition": {
    "match_intrinsic_resistance": true
  },
  "action": {
    "type": "FLAG_ONLY",
    "flag_message": "{{organism}} is intrinsically resistant to {{antibiotic}}; reported S is suspect. Verify result.",
    "decision_options": [
      { "id": "CONFIRMED_S_BY_RETEST", "label": "Confirmed S by retest",
        "applies_override": false },
      { "id": "OVERRIDE_TO_R", "label": "Override to R (intrinsic resistance)",
        "applies_override": { "override_to": "R" },
        "justification_template": "Intrinsic resistance for organism" }
    ]
  }
}
```

---

## 4. Engine execution

### 4.1 Trigger points

The engine evaluates rules on:

- AST Run status transition to COMPLETE (all antibiotic results landed)
- Manual override save
- **Confirmation result landing** — when the result of a reflex-ordered confirmation test (D-test, ESBL confirmation) is reported, the engine re-opens the linked flag for decision (§5.3).
- Isolate organism update (reidentification — per crosswalk Q4 Rule 2, **does not auto-re-run** existing flags; instead it sets `review_needed = true` on each flag for that isolate and surfaces a "review applicability" signal — §5.4).

### 4.2 Execution flow

```
For each active rule in expert_rule_definition:
   For each Isolate in the Case:
      For each AST Run on that Isolate:
         Evaluate rule.trigger_condition against the AST Run's results
         If match:
            If rule.action.auto_apply == true AND rule.action.require_supervisor_review == false:
               Apply override directly (write to micro_ast_override + readings)
               Write flag with status = OVERRIDDEN, decision = APPLIED
               Set phenotype flag on Isolate (if specified)
            Else:
               Create expert_rule_flag with status = OPEN
               Surface in Case Detail Expert Review section
```

### 4.3 Auto-apply vs. manual review

| Rule | Auto-apply | Notes |
|------|------------|-------|
| MRSA inference | Yes | Patient-safety; non-negotiable |
| D-test required | No | Requires tech action (run D-test or decide manually) |
| ESBL screen | No | Phenotypic confirmation is a separate test |
| ESBL confirmed (after confirmation test) | Manual decision triggers override | Tech enters confirmation result and applies override |
| Cascade (urine) | Yes | Display-time only; doesn't override AST data |
| Intrinsic verification | No | Flag for review; may indicate technical error |

---

## 5. Expert Review section in Case Detail

### 5.0 Always present, with an empty state

The **Expert Review section is always rendered** in Case Detail — it does **not** appear only when flags exist. When there are no flags it shows an explicit empty state ("No expert flags") so techs always know where to look and never miss flags that arrived between visits. The section carries a one-line helper describing its purpose.

Empty state:

```
┌─ Expert Review ──────────────────────────────────────────────────────────────┐
│  Expert rules evaluate AST results and raise flags for review here.          │
│                                                                              │
│  No expert flags.                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

When the engine fires non-auto-apply flags, they surface in the section:

```
┌─ Expert Review ──────────────────────────────────────────────────────────────┐
│                                                                              │
│  Flags requiring attention:                                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠ Possible ESBL — Isolate 1 (E. coli)            [review needed]        │  │
│  │ 3GC resistance detected: Ceftriaxone R (MIC 16). Phenotypic            │  │
│  │ confirmation recommended.                                                │  │
│  │                                                                          │  │
│  │ Decision options:                                                        │  │
│  │ ( ) Order ESBL confirmation                                              │  │
│  │ ( ) ESBL confirmed — apply phenotype override                            │  │
│  │ ( ) ESBL ruled out — AST stands                                          │  │
│  │                                                                          │  │
│  │ [Review & Decide]                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Awaiting confirmation:                                                      │
│  ⏳ ESBL confirmation ordered — Isolate 2 (K. pneumoniae) → enter result    │
│                                                                              │
│  Resolved flags (this Case):                                                 │
│  ✓ Cascade Reporting (urine) — auto-applied                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

The `[review needed]` badge appears per-flag after the owning isolate has been reidentified (§5.4); the "Awaiting confirmation" group lists flags in `AWAITING_CONFIRMATION` with a direct path to enter the confirmation result (§5.3).

### 5.1 Expert Review Decision — inline panel

Clicking "Review & Decide" **expands an inline panel** in place (Principle 3 — no overlay) with the full flag context:

```
┌─ Expert Review — Isolate 1 (E. coli) — Possible ESBL ───────────────────────┐
│                                                                              │
│  Flag triggered: 2026-05-12 11:47 by ESBL Screen rule                       │
│  Pattern: Ceftriaxone R (MIC 16) — 3GC resistance flag                      │
│                                                                              │
│  Decision: *                                                                 │
│  (•) Order ESBL confirmation                                                 │
│      Orders the ESBL confirmation test via the reflex engine and keeps       │
│      this flag open awaiting the result                                      │
│  ( ) ESBL confirmed — apply phenotype override                               │
│      Forces all penicillins / cephalosporins / aztreonam to R                │
│  ( ) ESBL ruled out — AST stands                                             │
│      Closes flag; AST results stand as-is                                    │
│                                                                              │
│  Justification: *                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ .esblc                                                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  Macros: `ast` (type . for shortcuts)                                       │
│                                                                              │
│  Reviewed by: Olivia Mendez (current user)                                  │
│                                                                              │
│  [Cancel]                                                            [Save] │
└──────────────────────────────────────────────────────────────────────────────┘
```

On save:

1. `expert_rule_flag` row updated with decision, justification, decided_at, decided_by.
2. If decision applies override: writes `micro_ast_override` rows via M-05 mechanism; links `flag.linked_override_id` → override.
3. If decision = ORDER_CONFIRMATION: the confirmation test is **ordered through the reflex/test-rules action API** (not a bespoke routine), the resulting order id is stored in `flag.confirmation_order_id`, and the flag status moves to `AWAITING_CONFIRMATION` (§5.3).
4. Timeline event EXPERT_RULE_DECISION written.
5. Phenotype flag on Isolate set (if action specifies).

**Post-save behavior (decision modal):** on a successful save the **modal closes**, a **success toast** confirms the recorded decision ("Decision saved — ESBL confirmation ordered"), and the Expert Review section updates in place: an applied override moves the flag to the "Resolved flags" group; an ORDER_CONFIRMATION decision moves it to the "Awaiting confirmation" group with a link to enter the result; a "ruled out" decision closes the flag. Any created confirmation order appears as an "Awaiting confirmation" entry **with a link** to the order/result-entry point. If the save fails, the modal stays open and shows an inline error; no flag state changes.

### 5.2 Confirmation-test loop — where the result is entered and how it re-opens the flag

A flag with decision = ORDER_CONFIRMATION sits in `AWAITING_CONFIRMATION` until its confirmation result is reported. The loop is closed as follows:

- **Where the confirmation result is entered.** The reflex-ordered confirmation test (D-test, ESBL phenotypic test) is a standard Test Catalog test on the case; its result is entered through the normal result-entry path **and** is reachable directly from the flag's "Awaiting confirmation" entry, which deep-links to that confirmation test's result-entry point. The confirmation result is **not** a free-form field on the flag — it is a real result so it carries its own audit, can be analyzer-pushed, and appears in the case like any other result.
- **How recording it re-opens the flag.** When the confirmation result is reported, the engine (trigger point §4.1) sets `flag.confirmation_result_id`, transitions the flag from `AWAITING_CONFIRMATION` back to `OPEN`, and re-surfaces it in "Flags requiring attention" — now pre-annotated with the confirmation outcome (e.g., "ESBL confirmation: POSITIVE") so the tech's remaining choice is just confirmed vs. ruled-out.
- **Closing the loop.** The tech opens the re-opened flag, picks "ESBL confirmed" (applies the override via M-05) or "ESBL ruled out" (AST stands). The flag transitions to `RESOLVED`; if an override was applied, `linked_override_id` is set and the phenotype flag is stamped on the isolate.

### 5.3 Confirmation order fired through the reflex engine

The confirmation order created by an ORDER_CONFIRMATION decision is not a new ordering mechanism — it is an `OrderAction { target: <confirmation test>, priority, reason }` fired through the existing reflex/test-rules action API (§1.2). This is the same path used when an organism is identified and the reflex orders the organism's Default AST panel. M-06 stores only the resulting `confirmation_order_id` on the flag to track the loop.

### 5.4 Reidentification → flag re-evaluation signal

Per crosswalk Q4 Rule 2, reidentifying an isolate does **not** auto-re-run existing flags (the organism that produced them may have changed, so silent re-evaluation could be wrong). Instead the engine surfaces a concrete "review applicability" signal:

- A **banner on the Expert Review section** ("This isolate was reidentified — review whether its expert flags still apply").
- A per-flag **`review needed` badge** on every flag whose owning isolate was reidentified (`flag.review_needed = true`).
- A **"Re-evaluate flags for this isolate"** action that re-runs the engine for that isolate's current organism, clearing the `review_needed` badges and replacing stale flags with freshly evaluated ones (old flags move to Resolved/superseded with an audit note).

Until the tech acts, the badges and banner persist so reidentification can never silently drop or keep an inapplicable flag.

---

## 6. Expert Rule admin

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Microbiology / Expert Rules                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search...]   Type: [All ▼]   Status: [Active ▼]                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Code              │ Name                          │ Type        │ Status  │ │
├───────────────────┼───────────────────────────────┼─────────────┼─────────┤ │
│ MRSA_INFERENCE    │ MRSA Inference                │ Phenotype   │ Active  │ │
│ D_TEST_REQUIRED   │ D-Test Required               │ Flag        │ Active  │ │
│ ESBL_SCREEN       │ ESBL Screen                   │ Flag        │ Active  │ │
│ ESBL_CONFIRMED    │ ESBL Confirmed Phenotype      │ Phenotype   │ Active  │ │
│ CASCADE_URINE     │ Cascade Reporting (urine)     │ Cascade     │ Active  │ │
│ INTRINSIC_VERIFY  │ Intrinsic Resistance Verify   │ Flag        │ Active  │ │
└───────────────────┴───────────────────────────────┴─────────────┴─────────┘
```

Lab manager can:

- View built-in rules (read-only — built_in = true).
- Activate / deactivate (toggle).
- Create custom rules (built_in = false) for lab-specific SOP.
- View rule definition history (per `expert_rule_definition_version`).

Custom rule editor is complex (rule JSON construction) — Phase 1B may ship without a UI for custom rule creation; lab manager edits a JSON file or works with the developer. Full UI editor is Phase 2+.

---

## 7. Phenotype flags

Phenotype flags surface in two places:

- **Isolate row in Case Detail** — shows a `Tag` with the phenotype (MRSA, ESBL, CRE, VRE, MDR, XDR, PDR, D_TEST_POSITIVE).
- **WHONET export columns (M-09)** — one column per phenotype with P/N/blank.

Phenotype flags are stored on the Isolate (not just derived from rules at display time) so they survive rule changes and are queryable.

```
micro_isolate_phenotype (junction)
├── isolate_id (FK)
├── phenotype_code (enum: MRSA, ESBL_SCREEN, ESBL_CONFIRM, CRE, VRE,
│                          CARBAPENEMASE, MDR, XDR, PDR, D_TEST_POSITIVE)
├── status (enum: PRESENT, ABSENT, INDETERMINATE)
├── set_by_rule_id (FK to expert_rule_definition, nullable)
├── set_at, set_by
```

---

## 8. Permissions

| Action | Permission |
|--------|-----------|
| View Expert Review section | `micro.case.view` |
| Make Expert Review decisions | `micro.expert.review` |
| Configure rule definitions | `micro.expert.config` |
| Apply auto-applied overrides (engine) | (system; no user permission) |

---

## 9. Acceptance criteria

- **AC-M06-01**: Five built-in rules shipped (MRSA, D-test, ESBL screen, ESBL confirmed, Cascade urine, Intrinsic verify).
- **AC-M06-02**: Engine fires on AST Run COMPLETE transition.
- **AC-M06-03**: MRSA inference auto-applies override on S. aureus + OXA-R; sets MRSA phenotype.
- **AC-M06-04**: D-test required flag opens with four decision options.
- **AC-M06-05**: ESBL screen flag opens with three decision options.
- **AC-M06-06**: Cascade urine rule hides tier 2/3 antibiotics unless tier 1 all R.
- **AC-M06-07**: Intrinsic verification flag opens when an organism reports S to its intrinsic resistance.
- **AC-M06-08**: Expert Review section in Case Detail renders open flags.
- **AC-M06-09**: Expert Review Decision inline panel applies override via M-05 mechanism.
- **AC-M06-10**: Phenotype flags set on Isolate; visible in Case Detail and WHONET export.
- **AC-M06-11**: Rule version snapshotted on flag creation.
- **AC-M06-12**: Per crosswalk Q4 Rule 2: rule re-evaluation on reidentification is NOT automatic; flags surface as "review applicability."
- **AC-M06-13**: NFR-05 (engine execution < 500ms per AST Run).
- **AC-M06-14**: All actions respect permissions.
- **AC-M06-15** *(folds C1)*: The Expert Review section is **always present** in Case Detail, including an explicit "No expert flags" empty state when no flags exist.
- **AC-M06-16** *(folds C2)*: An ORDER_CONFIRMATION decision orders the confirmation test (via the reflex engine), moves the flag to AWAITING_CONFIRMATION, and links `confirmation_order_id`. The confirmation result is entered through the normal result-entry path (reachable from the flag's "Awaiting confirmation" entry), not a free-form flag field.
- **AC-M06-17** *(folds C2)*: When the confirmation result is reported, the engine sets `confirmation_result_id` and re-opens the flag (AWAITING_CONFIRMATION → OPEN), pre-annotated with the confirmation outcome, so the tech can finalize confirmed vs. ruled-out.
- **AC-M06-18** *(folds C3)*: Reidentifying an isolate sets `review_needed = true` on its flags, shows a section banner and per-flag "review needed" badge, and exposes a "Re-evaluate flags for this isolate" action; nothing is auto-re-run.
- **AC-M06-19** *(folds C4)*: On decision save the inline panel collapses, a success toast shows, the Expert Review section updates in place (flag moves to the correct group), and any created confirmation sub-task appears in "Awaiting confirmation" with a link; a failed save keeps the panel open with an inline error and no state change.
- **AC-M06-20** *(reuse)*: Confirmation orders and the organism-default AST panel order are fired through the existing reflex/test-rules `OrderAction` API, not a parallel ordering mechanism.

---

## 10. i18n keys

Estimated 70-90 keys including all rule names, decision labels, phenotype labels, the empty-state copy (`micro.expert.empty`), the "review needed" badge (`micro.expert.flag.reviewNeeded`), the reidentification banner (`micro.expert.reidentBanner`), the re-evaluate action (`micro.expert.reEvaluate`), and the awaiting-confirmation group (`micro.expert.awaitingConfirmation`).

---

## 11. Open verification items

- Confirm rule engine implementation approach (in-app vs. external rules service).
- Confirm the reflex/test-rules `OrderAction` contract used for confirmation orders (target, priority, reason) and the order id returned for `confirmation_order_id`.

---

## 12. References

- M-00 Microbiology Module Parent Specification (workflow-automation = reflex/test-rules engine; division of responsibility)
- M-04 Case Workbench Core (Expert Review section)
- M-05 AST Entry & Interpretation (override mechanism)
- M-09 WHONET Export (phenotype columns)
- `test-rules-mvp-frs.md` — existing reflex/test-rules engine (confirmation + AST-panel ordering)
- v1.1 AMR Configuration FRS §6 (Expert Rules — superseded by M-06)
- v1.1 Workbench FRS §11 (Expert Review — superseded by M-06)
- CLSI M100 (Expert Rules guidance)
- EUCAST Expert Rules (alternative ruleset)
