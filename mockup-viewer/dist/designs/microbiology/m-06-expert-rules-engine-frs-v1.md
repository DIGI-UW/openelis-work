# M-06 Expert Rules Engine — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Microbiology → Expert Rules (Phase 1B)
**Phase:** 1B
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec covers the Expert Rules engine that runs against AST Run state changes and produces flags and overrides. Phase 1B feature; Phase 1A ships with manual expert review (tech and supervisor apply rules manually via overrides in M-05).

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

### 1.2 Routes

| Surface | Route |
|---------|-------|
| Expert Rules admin (rule definitions) | `/admin/micro/expert-rules` |
| Expert Rule Editor modal | (modal overlay) |
| Expert Review section in M-04 Case Detail | (embedded in Case Detail) |
| Expert Review Decision modal | (modal invoked from Case Detail flags) |

### 1.3 Users

| Role | Actions |
|------|---------|
| Lab Manager | Configure rule definitions; activate / deactivate rules |
| Microbiology Supervisor | Review flags, apply or reject suggested overrides |
| Microbiology Technician | Review flags for own cases; apply per supervisor SOP |
| System Administrator | All actions |

### 1.4 Integration

- **M-05 AST Entry & Interpretation** — Engine fires on AST Run state changes (new result, override, status to COMPLETE).
- **M-04 Case Workbench Core** — Expert Review section in Case Detail renders flags; Expert Review Decision modal invoked.
- **M-08 Macro Library** — `ast` category macros in flag decision justifications.
- **M-09 WHONET Export** — Phenotype flag columns populated from engine outputs.
- **M-01 AMR Reference Data** — Rules reference organism groups, antibiotic classes.

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
└── audit columns
```

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
- Isolate organism update (reidentification — but per crosswalk Q4 Rule 2, **does not auto-re-run** existing flags; flags surface as "review applicability")

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

When the engine fires non-auto-apply flags, they surface in the Case Detail Expert Review section:

```
┌─ Expert Review ──────────────────────────────────────────────────────────────┐
│                                                                              │
│  Flags requiring attention:                                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠ Possible ESBL — Isolate 1 (E. coli)                                  │  │
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
│  Resolved flags (this Case):                                                 │
│  ✓ Cascade Reporting (urine) — auto-applied                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Expert Review Decision modal

Clicking "Review & Decide" opens a modal with the full flag context:

```
┌─ Expert Review — Isolate 1 (E. coli) — Possible ESBL ───────────────────────┐
│                                                                              │
│  Flag triggered: 2026-05-12 11:47 by ESBL Screen rule                       │
│  Pattern: Ceftriaxone R (MIC 16) — 3GC resistance flag                      │
│                                                                              │
│  Decision: *                                                                 │
│  (•) Order ESBL confirmation                                                 │
│      Adds an ESBL confirmation card task to the Case                         │
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
2. If decision applies override: writes `micro_ast_override` rows via M-05 mechanism; links flag.flag_id → override.
3. If decision = ORDER_CONFIRMATION: creates a sub-task on the Case for the lab to run confirmation; flag status stays AWAITING_CONFIRMATION.
4. Timeline event EXPERT_RULE_DECISION written.
5. Phenotype flag on Isolate set (if action specifies).

### 5.2 Confirmation result re-evaluation

When a confirmation test result comes in (e.g., ESBL phenotypic test results entered), the tech returns to the flag and clicks ESBL confirmed / ESBL ruled out. The flag transitions to RESOLVED with the corresponding override applied.

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
- **AC-M06-09**: Expert Review Decision modal applies override via M-05 mechanism.
- **AC-M06-10**: Phenotype flags set on Isolate; visible in Case Detail and WHONET export.
- **AC-M06-11**: Rule version snapshotted on flag creation.
- **AC-M06-12**: Per crosswalk Q4 Rule 2: rule re-evaluation on reidentification is NOT automatic; flags surface as "review applicability."
- **AC-M06-13**: NFR-05 (engine execution < 500ms per AST Run).
- **AC-M06-14**: All actions respect permissions.

---

## 10. i18n keys

Estimated 60-80 keys including all rule names, decision labels, phenotype labels.

---

## 11. Open verification items

- Confirm rule engine implementation approach (in-app vs. external rules service).
- Confirm whether OE has any existing rules-engine infrastructure to reuse (e.g., for QC rules or alerts).

---

## 12. References

- M-00 Microbiology Module Parent Specification
- M-04 Case Workbench Core (Expert Review section)
- M-05 AST Entry & Interpretation (override mechanism)
- M-09 WHONET Export (phenotype columns)
- v1.1 AMR Configuration FRS §6 (Expert Rules — superseded by M-06)
- v1.1 Workbench FRS §11 (Expert Review — superseded by M-06)
- CLSI M100 (Expert Rules guidance)
- EUCAST Expert Rules (alternative ruleset)
