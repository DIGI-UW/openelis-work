# M-03 Order Entry Micro Hook — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Order Entry (existing OE module) — Microbiology-specific extension
**Phase:** 1A
**Owner:** Order Entry team (Microbiology Module M-00 is consumer)
**Status:** Draft

This spec describes a small amendment to the existing OE Order Entry wizard: when the user selects "Microbiology" as the program in Step 1, six micro-specific fields appear within that same step's surface area. No new wizard step. This amendment lives in OE because it modifies the OE workflow; Micro is the consumer.

---

## 1. Overview

### 1.1 Purpose

Capture the micro-specific information at order time that downstream Micro Module workflows depend on: culture protocol, patient origin, number of sets, clinical history, antibiotic exposure flag, and critical-notification preference.

These fields appear conditionally — only when Program = MICROBIOLOGY. For all other programs (Routine, HIV, TB, EQA), the existing Step 1 renders unchanged.

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
- **M-04 Case Workbench Core** — consumes the micro fields when creating the Case on Sample save.
- **M-01 Reference Data** — Culture Protocol dropdown references the Culture Protocol master.
- **M-08 Macro Library** — Clinical History field is macro-enabled with `clinical` category.

---

## 2. Step 1 Program Selection — Microbiology branch

### 2.1 Existing Program dropdown

The existing OE Step 1 has a Program dropdown:

- Routine Testing
- HIV Program
- TB Program
- EQA / Proficiency Testing
- (other site-specific programs)

M-03 adds:

- **Microbiology** ← triggers the conditional micro fields

### 2.2 When Microbiology is selected

The Step 1 form expands inline (no modal, no new step) to show the micro fields. The expansion is in a `Tile` styled as a sub-section to make the relationship clear.

```
┌─ Program Selection ─────────────────────────────────────────────────────────┐
│                                                                              │
│  Program: *                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Microbiology                                                          ▼ │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Microbiology Program Details ────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │ 🦠 This will create a Microbiology Case for culture and susceptibility │ │
│  │    testing.                                                             │ │
│  │                                                                         │ │
│  │ Culture Protocol: *                                                     │ │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │ │ Blood Culture Standard                                            ▼ │ │ │
│  │ └─────────────────────────────────────────────────────────────────────┘ │ │
│  │ Defaulted from the selected test; override if needed                    │ │
│  │                                                                         │ │
│  │ Patient Origin:                                                         │ │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │ │ Emergency                                                         ▼ │ │ │
│  │ └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
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
| Culture Protocol | `ComboBox` referencing active `culture_protocol` records | Yes | Defaulted from the selected test's `default_culture_protocol_id` (via M-01); user can override | Drives downstream culture setup, max incubation days |
| Patient Origin | `Dropdown` referencing patient_origin reference table | No | Defaulted from requesting unit/ward if known | Used in WHONET export (Phase 1B) |
| Number of Sets | `NumberInput`, 1-10 | No | Default 1 (or 2 for blood cultures based on culture protocol) | Helper text contextual to specimen type |
| Clinical History | `MacroTextarea`, `clinical` category, ≤ 1000 chars | No | Empty | Captures relevant patient context |
| Antibiotic Exposure | `Checkbox` | No | Default false | "Patient has recent antibiotic exposure (within 2 weeks)" |
| Critical Value Notify | `Checkbox` | No | Default true for blood culture / CSF / sterile sites; false for non-sterile sites | "Notify clinician immediately for positive [specimen type]" |

### 2.4 Priority — NOT in Step 1

Per the v1.1 narrative critique: priority is an Order-level concept that lives on Step 3 (Add Order), not on Step 1 program details. M-03 does **not** include Priority in the micro fields. The existing Step 3 priority handling applies to all programs.

### 2.5 Validation

- Culture Protocol is required when Program = MICROBIOLOGY.
- Number of Sets is bounded 1-10.
- Clinical History ≤ 1000 chars.

Other fields are optional.

### 2.6 Info banner

When Microbiology is selected, an `InlineNotification` (kind=info, lowContrast) appears at the top of the micro fields tile:

> 🦠 This will create a Microbiology Case for culture and susceptibility testing.

This tells the order entry clerk that downstream Case creation will happen on Sample save. (The icon may be optional based on Carbon style guidelines; emoji used here for clarity in the spec sketch.)

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

1. Sample row created in `sample` table with `program = MICROBIOLOGY`.
2. The micro-specific fields are persisted (either on the Sample row if the existing OE schema supports program-specific columns, or in a `micro_order_data` sibling table — exact location verified during implementation per crosswalk Q1 sibling pattern).
3. Sample post-save hook fires `MicroCaseService.createCaseForSample(sample_id)`.
4. M-04 creates `micro_case` row with stage RECEIVED.

The user is returned to the standard OE post-save destination; the Micro module handles the Case visibility from its own surfaces (Pending Cultures Worklist).

---

## 6. Conditional rendering

The Microbiology Program Details tile is shown only when:

- Program = MICROBIOLOGY in the dropdown.

When the user changes the dropdown to something else, the tile collapses (with confirmation if data was entered: "Discard Microbiology details?").

When the user re-selects Microbiology, the tile re-appears with any previously entered values preserved within the same session.

---

## 7. Permissions

| Action | Permission |
|--------|-----------|
| See Microbiology in the Program dropdown | `micro.case.create` (typically granted to OE clerks at sites that do micro) |
| Fill micro fields | Same (no separate permission) |

Sites that don't do micro don't need the permission; the dropdown won't show Microbiology.

---

## 8. Acceptance criteria

- **AC-M03-01**: Microbiology appears in the Program dropdown for users with `micro.case.create` permission.
- **AC-M03-02**: Selecting Microbiology renders the Program Details tile inline.
- **AC-M03-03**: Culture Protocol dropdown shows active records from M-01.
- **AC-M03-04**: Selecting a test with a default protocol pre-fills the dropdown.
- **AC-M03-05**: Patient Origin dropdown shows seeded values from M-01 §6.2.
- **AC-M03-06**: Clinical History supports macro expansion (`clinical` category).
- **AC-M03-07**: Antibiotic Exposure checkbox saves correctly.
- **AC-M03-08**: Critical Value Notify checkbox default varies by specimen type.
- **AC-M03-09**: Priority is NOT in Step 1 micro fields (lives on Step 3 per existing OE).
- **AC-M03-10**: Validation: Culture Protocol required when Program = MICROBIOLOGY.
- **AC-M03-11**: Info banner displays when Microbiology selected.
- **AC-M03-12**: Changing Program away from Microbiology with data entered prompts confirmation.
- **AC-M03-13**: On Sample save, Case is auto-created in stage RECEIVED.
- **AC-M03-14**: All micro-specific fields are persisted and available to M-04.
- **AC-M03-15**: NFR-04 (a11y) — micro fields keyboard-reachable.

---

## 9. i18n keys

Estimated 20-25 keys. Pattern:

```
orderEntry.step1.program.option.microbiology      "Microbiology"
orderEntry.step1.microbiology.tile.title          "Microbiology Program Details"
orderEntry.step1.microbiology.banner              "This will create a Microbiology Case for culture and susceptibility testing."
orderEntry.step1.microbiology.field.cultureProtocol.label "Culture Protocol"
orderEntry.step1.microbiology.field.cultureProtocol.helper "Defaulted from the selected test; override if needed"
orderEntry.step1.microbiology.field.patientOrigin.label "Patient Origin"
orderEntry.step1.microbiology.field.patientOrigin.option.inpatient "Inpatient"
orderEntry.step1.microbiology.field.patientOrigin.option.outpatient "Outpatient"
orderEntry.step1.microbiology.field.patientOrigin.option.icu "ICU"
orderEntry.step1.microbiology.field.patientOrigin.option.emergency "Emergency"
orderEntry.step1.microbiology.field.patientOrigin.option.longTermCare "Long-term Care"
orderEntry.step1.microbiology.field.patientOrigin.option.unknown "Unknown"
orderEntry.step1.microbiology.field.numberOfSets.label "Number of Sets"
orderEntry.step1.microbiology.field.numberOfSets.helper.blood "For blood cultures, typical is 2 sets from different sites"
orderEntry.step1.microbiology.field.clinicalHistory.label "Clinical History"
orderEntry.step1.microbiology.field.clinicalHistory.helper "Macros: `clinical` (type . for shortcuts)"
orderEntry.step1.microbiology.field.antibioticExposure.label "Patient has recent antibiotic exposure (within 2 weeks)"
orderEntry.step1.microbiology.field.criticalNotify.label "Notify clinician immediately for positive {{specimenType}}"
orderEntry.step1.microbiology.error.cultureProtocolRequired "Culture Protocol is required for Microbiology orders"
orderEntry.step1.microbiology.confirm.discard.title "Discard Microbiology details?"
orderEntry.step1.microbiology.confirm.discard.message "You have entered Microbiology details. Changing the Program will discard them."
orderEntry.step1.microbiology.confirm.discard.confirm "Discard"
```

---

## 10. Open verification items

- Confirm exact location to persist micro-specific Order fields: on `sample` table (program-specific columns) vs. `micro_order_data` sibling table.
- Confirm OE Sample-save hook mechanism (per M-04 §3.2 — Case creation hook).
- Confirm existing Program dropdown's render mechanism for conditional content.

---

## 11. References

- M-00 Microbiology Module Parent Specification
- M-04 Case Workbench Core (consumes saved micro fields on Case creation)
- M-01 AMR Reference Data (Culture Protocol, Patient Origin references)
- M-08 Macro Library (`clinical` category for Clinical History field)
- Existing OE Order Entry wizard (Step 1 / Step 2 / Step 3 documentation)
- `amr-micro-narrative-v1-for-devs.md` Phase 1 §Pre-analytical
- v1.1 Workbench FRS §5 Order Entry hook (superseded by M-03)
