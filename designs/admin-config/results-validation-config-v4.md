# Result & Validation Configuration — Functional Requirements Specification (consolidated)

**Status:** Draft for review · **Name confirmed:** Result & Validation Configuration (Casey, 2026-06-10).
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Route:** `/admin/results-validation-configuration` *(working — verify against the live admin tree)* · **SideNav:** Admin → Result & Validation Configuration · **Breadcrumb:** Home / Admin Management / Result & Validation Configuration
**Permission:** Admin bundle (binary — no fine-grained admin sub-permissions).
**Companion artifacts:** `results-validation-config-v4-preview.html` (mockup), `results-entry-v4-decisions.md` (D1–D22), drives `validation-page-v4-frs.md` and `results-entry-v4-frs.md`.
**Epics:** OGC-343. **Retires:** the flat *Result Entry Configuration* select-row/Modify table and the binary *validate all results* toggle.

---

## Lab Context

### Current State
Two separate admin surfaces govern how results are handled today. **Result Entry Configuration** is a flat table of thirteen settings (select a row, click *Modify*, edit one value) covering things like whether a technician name is required, whether techs can reject a test, and whether a note is required to modify a result. **Validation** is governed by a single binary site setting — *validate all results: Yes/No* — that either reviews every result once or auto-releases everything, with no way to require two-level review on high-risk units or auto-release normals on low-risk ones, and no per-lab-unit control.

### Pain
The split means an admin configures "how results work" in two unrelated places, and the validation control is too blunt for any real lab: high-risk units are stuck with one-touch review that fails ISO 15189, low-risk units are stuck reviewing every dipstick. The flat table's labels are cryptic (`roleForPatientOnResults`, `restrictFreeTextMethodEntry`), the select-row-then-Modify interaction is slow, and there's no preview of what a change will do. Validation level — a regulatory decision — has nowhere structured to live.

### What Changes
One page. It carries the structured **validation policy** (a lab-wide default plus per-lab-unit overrides, each a trigger + 0–5 sequential review levels + role bindings), and it absorbs every still-relevant result-handling setting as a **plain-language toggle grouped by purpose**, plus two new behaviors surfaced from the Validation redesign. The old flat table and the binary toggle are retired; the binary toggle migrates into the validation policy's lab-wide default. Each control keeps its real config key visible for traceability, dependent settings indent and disable, and a live **effective-configuration preview** shows the outcome before Save. ISO 15189 §7.5.1.2 multi-level review (clinical) and the EPA/WHO equivalents (environmental/vector) all become configurable per lab unit — needed for SILNAS Phase 1 Indonesia, where clinical, water-quality, and mosquito-pool labs coexist in one deployment.

---

## Overview

A single admin page consolidating result-handling and validation configuration. It replaces the flat *Result Entry Configuration* table and the binary *validate all results* toggle. Layout: a left section-nav over grouped tiles — **Validation policy**, **Result entry**, **Modification / rejection / retest**, **Release & display**, **Access & PII** — plus an effective-config preview. Validation policy is structured (lab-wide default + per-unit overrides); the other groups are plain-language toggles (the migrated legacy settings + two new flags). Gated by the `useMultiLevelValidation` feature flag during phased rollout (legacy binary UI when off).

**Naming & layout note:** working title only; the page does **not** keep the select-row/Modify pattern. Domain-based config *suggestions* are **not** offered — a new override inherits the lab-wide default (the domain *badge* is shown as fact); validation posture is a regulatory decision the lab owns.

---

## User Stories

1. As a Lab Manager, set a lab-wide validation default (trigger + levels + roles) that every unit inherits.
2. As a Lab Manager, configure a per-unit override (e.g. Hematology = 2 levels: Tech II → Supervisor) to meet ISO 15189, while other units keep the default.
3. As a Lab Manager, auto-release normals on a low-risk unit (Abnormal Only, 1 level) and auto-release entirely on Water Quality (No Results, 0 levels).
4. As a Lab Manager, turn off bulk release of clear results, or make a retest note required, to enforce my lab's policy.
5. As an admin, configure result-entry behaviors (tech name, free-text method, invalid-range alert, critical message) and modification/rejection rules in plain language, in one place.
6. As a Lab Director, preview the effective configuration before Save and see a summary across all units for an audit.

---

## Legacy settings crosswalk (reuse-first; verified against `ConfigurationProperties`)

Each former *Result Entry Configuration* setting maps to a control on this page (real config key preserved). Behaviors below are grounded in the shipped enum/controllers; items marked *(verify)* need a final code check before the label freezes.

| Config key (real) | Enum / behavior (verified) | v4 control · group |
|---|---|---|
| `validate all results` | `ALWAYS_VALIDATE_RESULTS` — "all results validated, otherwise just those [needing it]" | **Migrated** into Validation policy lab-wide default (Yes ⇒ all results / ≥1 level; No-equivalent handled by trigger) |
| `alertWhenInvalidResult` | `ALERT_FOR_INVALID_RESULTS` — tech gets an alert for results outside the valid range | "Alert when a result is outside the valid range" · Result entry |
| `allowResultRejection` | tech can reject an individual test + reason | "Allow result rejection (via NCE)" · Modification/rejection/retest |
| `validateTechnicalRejection` | `VALIDATE_REJECTED_TESTS` — if a tech rejects, the test is ready to be validated *(verify exact downstream flow)* | "Technical rejection is ready to validate" · Modification/rejection/retest |
| `modify results note required` | note required to modify a result | "Require a note when results are modified" · Modification/rejection/retest |
| `modify results role` | separate role required to modify | "Require a separate role to modify results" (+ role select) · Modification/rejection/retest |
| `restrictFreeTextMethodEntry` | users cannot enter new methods through result entry *(verify picklist behavior)* | "Restrict free-text method entry" · Result entry |
| `ResultTechnicianName` | `resultTechnicianName` — tech name required for results | "Require technician name on results" · Result entry |
| `autoFillTechNameBox` | autofill box for tech name | "Show an autofill box for the tech name" (indented; enabled only when tech name required) · Result entry |
| `autoFillTechNameUser` | autofill with logged-in user | "Autofill with the logged-in user" (indented) · Result entry |
| `customCriticalMessage` | override the default critical-result message | "Critical result message" (text area) · Result entry |
| `showValidationFailureIcon` | `failedValidationMarker` — show icon when an analysis failed validation | "Show validation-failure icon on the Results page" · Release & display |
| `roleForPatientOnResults` | `PATIENT_DATA_ON_RESULTS_BY_ROLE` — **verified:** when ON and the user lacks the **Patient Results** module permission, the controllers set `patientInfo = "---"` (mask patient identity; lab number/test still show). Lab-unit role filtering applies always, independent of this flag. Default OFF. | "Mask patient identity for users without Patient Results access" · Access & PII |

**Two new behaviors (no existing key):**
- **Allow bulk release of "clear" results** (NEW) — Release & display. Governs the Validation page's guarded "Release all clear" action (D20).
- **Require a note when sending for retest** (NEW) — Modification/rejection/retest. Note: distinct from `modify results note required` (which is for *modifications*); modeled the same way.

---

## Functional Requirements

### A. Validation policy (structured)
- **FR-A1. Lab-wide default:** a **Trigger** (`NO_RESULTS` auto-validate all / `ALL_RESULTS` / `ABNORMAL_ONLY`) + **Validations Required** stepper (0–5) + a **Role** select per level (filtered to roles holding `result.validate`). `validations_required = 0` forces Trigger = `NO_RESULTS`; `ABNORMAL_ONLY` + 0 levels is invalid.
- **FR-A2. Per-lab-unit overrides:** a table (Lab Unit, **Domain badge**, Trigger, Levels, Roles, Actions) with inline edit; a new override **inherits the lab-wide default** (no domain-based recommendation). Delete soft-deletes and reverts the unit to the default for new analyses; in-flight analyses keep their snapshot.
- **FR-A3.** Config in effect at analysis creation is **snapshotted** onto the Analysis (`validation_levels_required`); later edits don't retroactively change in-flight work.
- **FR-A4. Auto-validation** at runtime writes an `AUTO_VALIDATE` audit row with the full config snapshot.

### B. Result entry settings
- **FR-B1.** Toggles: `alertWhenInvalidResult`, `restrictFreeTextMethodEntry`, `ResultTechnicianName`; the two autofill toggles (`autoFillTechNameBox`, `autoFillTechNameUser`) **indent under and disable unless** "Require technician name" is on. `customCriticalMessage` is a multi-line text field.

### C. Modification / rejection / retest
- **FR-C1.** Toggles: `allowResultRejection` (rejection is recorded as an NCE), `validateTechnicalRejection`, `modify results note required`, `modify results role` (reveals a role select when on), and **Require a note when sending for retest** (NEW). These drive the corresponding Results Entry / Validation behaviors.

### D. Release & display
- **FR-D1.** **Allow bulk release of "clear" results** (NEW) governs the Validation "Release all clear" guarded action; `showValidationFailureIcon` toggles the Results-page failed-validation icon.

### E. Access & PII
- **FR-E1.** `roleForPatientOnResults` toggles role-based **patient-identity masking** (per the verified behavior above). Site-wide Show Patient Name still takes precedence (PII precedence rule).

### F. Page behavior
- **FR-F1.** Summary banner across all units; live **effective-config preview** reflecting policy + key flags; **per-row/per-section Save** with optimistic-locking **stale-page guard**; every config change **audited** (`VALIDATION_CONFIG_CREATED/UPDATED/DELETED`, plus a config-changed event for the migrated toggles). Empty-state when no role holds `result.validate` (Save disabled).
- **FR-F2.** Feature flag `useMultiLevelValidation` gates the surface; off ⇒ legacy binary UI with an "available" banner; on ⇒ seeds the lab-wide default from the binary toggle (no behavior change until edited).
- **FR-F3. Deprecate the old page with a redirect.** The legacy *Result Entry Configuration* route (the flat select-row/Modify table) **redirects to this consolidated page** once the consolidation ships; the old route is retired (not left as a second editor). Until cutover, the redirect is gated by the same feature flag so a site can fall back. Each migrated setting writes to the same `Site_Information` key it does today, so no data migration is needed for the absorbed settings.

---

## Data Model (reuse-first)
- **New:** `validation_config` (lab_unit_id nullable = default vs override; trigger; validations_required 0–5; is_active; version) and `validation_level_config` (level_number 1–5; role_id), both `@Audited`; `Analysis.validation_levels_required` + `validation_level_current`; `Analysis.statusId` extended with `AWAITING_VALIDATION`, `AUTO_VALIDATED`. (Per OGC-343.)
- **Reused:** the legacy toggles continue to live as `Site_Information` properties (same keys as the crosswalk) — this page is a better editor over them; `validate all results` migrates into `validation_config`. `Role`/`Permission` (`result.validate`) for level role dropdowns. `Audit` (Envers) for all history — no parallel tables.

## Permissions & Audit
- **Permission:** Admin bundle (binary). `result.validate` is referenced only to populate level role dropdowns (the admin need not hold it).
- **Audit:** config CRUD events + `AUTO_VALIDATE` (with config snapshot) + `STALE_PAGE_CONFLICT_ADMIN_VALIDATION_CONFIG`. Changes to the migrated legacy toggles are audited as config updates.
- **Envers:** new `validation_config*` tables `@Audited`.

## Localization
Plain-language labels + help per the crosswalk, each with an i18n key; `.env`/`.vector` suffix only where text differs by domain (clinical fallback). ~50 keys; see mockup for the surface.

## Out of scope
The Validation page UI (OGC-817 / `validation-page-v4-frs.md`); the Results Entry UI; Role Builder (consumed, not authored); per-test (vs per-unit) validation config; delta-check thresholds; FHIR release integration.

## Open questions / dependencies
- **Page name** — working title "Result & Validation Configuration"; confirm.
- **Route + SideNav slot** — verify against the live admin tree before build.
- **Verify** the exact behavior of `validateTechnicalRejection` and `restrictFreeTextMethodEntry` against the controllers before the labels freeze (the rest are confirmed).
- Whether the migrated legacy toggles should also become **per-lab-unit** (today site-wide) — deferred unless a deployment needs it.
