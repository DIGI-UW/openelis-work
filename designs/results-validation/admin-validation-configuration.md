# Admin: Validation Configuration — FRS v3

**Status:** Draft
**Jira:** OGC-343 (this story), OGC-817 (sibling Validation Page v3), OGC-579 (impl story)
**Sibling FRS:** `designs/results-validation/validation-page.md` (Validation Page v3 consolidated)
**Last updated:** 2026-06-10

---

## Lab Context (Current State / Pain / What Changes)

In a clinical laboratory, **validation** is the supervisory step that sits between Results Entry — where a bench tech enters a numeric or categorical value off an analyzer or off a manual reading — and Release — where the result becomes part of the patient's clinical chart, the regulatory submission, or the surveillance feed. A validator (typically a Supervisor, Senior Tech, or Lab Manager) reviews each result against the patient demographics, the reference range, the analyzer QC, and the prior history, then signs off. In labs that practice multi-level review, that signoff happens twice: a Level 1 reviewer (often a Tech II) verifies the technical correctness, and a Level 2 reviewer (a Supervisor or Lab Manager) verifies the clinical interpretation before release. This pattern is mandated by ISO 15189 §7.5.1.2 for clinical labs and by EPA / regulatory equivalents for environmental labs, and is encouraged by WHO good-laboratory-practice guidance for surveillance labs running PCR pools.

OpenELIS Global today supports validation only in its most degenerate form. The admin surface is a **single binary toggle** in Site Information — "Validate all results" — with two values: when set to **Yes**, the system treats every result as pre-validated at the moment of Results Entry save and skips the Validation page entirely; when set to **No**, every result requires exactly one human review by a user holding the built-in Validation role before release. There is no way to require **two** levels of review in a high-risk lab unit like Hematology while allowing **zero** levels (auto-release) in a low-risk unit like Urinalysis dipsticks, no way to define a Level 1 vs Level 2 role binding, no way to auto-release results that fall inside the normal range while requiring review on abnormals, and no way to do any of this per lab unit. The result is that every site that deploys OpenELIS picks the worst-fit single setting and lives with it: high-risk labs are stuck with a one-touch review that fails ISO 15189; low-risk labs are stuck with mandatory review on every dipstick, which crushes throughput. There is also no audit trail at the configuration layer — the toggle changes silently in `site_information` with no record of who changed it or why.

After v3, the admin page replaces the binary toggle with a **rich configuration surface** organized around two concepts. First, a **lab-wide default** that applies to any lab unit that does not have an explicit override. Second, a table of **per-lab-unit overrides**, each one composed of a validation **Trigger** (No Results / All Results / Abnormal Only — controlling which results need human review), a **Validations Required** stepper (0 through 5 sequential levels), and a **Role assignment** for each level (filtered to roles holding the `result.validate` permission). The page lives at `/admin/validation-configuration`, exposes an Effective-Config preview that shows the analyst exactly what the Validation page will render after Save, writes audit events on every configuration change via the existing `@Audited` infrastructure, and migrates the current binary toggle into the new model without behavior change. Why now: SILNAS Phase 1 Indonesia deployment lands in Q3 2026 with Hematology and Chemistry both requiring 2-level review per the National Lab Quality Manual, Water Quality requiring 1-level review on abnormals only, and Vector PCR pools requiring 0-level auto-release on negatives and 1-level review on positives — all four patterns must coexist in the same deployment. The Validation Page v3 sibling spec (OGC-817) cannot ship without this admin page in place to drive its behavior.

---

## IA Placement

| Item | Value |
|---|---|
| **Sidenav label** | **Validation Configuration** (per direction from Casey 2026-06-10: preserved label because labs recognize "Validation" as a process name; do NOT bury under an Automation / Compliance grouping that would obscure the term) |
| **Sidenav parent** | **Admin** |
| **Route** | `/admin/validation-configuration` |
| **Permission gate** | Admin bundle (binary — per `feedback_openelis_admin_permissions`; no fine-grained admin sub-permissions are enforced in OpenELIS today) |
| **Breadcrumb** | `Home / Admin Management / Validation Configuration` (per `reference_admin_breadcrumb_label_quirk` — sidenav says "Admin", breadcrumbs say "Admin Management") |
| **i18n key (label)** | `nav.admin.validation.configuration` |

The page sits adjacent to other workflow-configuration pages (Test Catalog Management, Workplan Configuration, Order Entry Configuration). It does NOT live under an "Automation" or "Compliance" grouping; per Casey's IA decision, lab staff search the sidenav by recognizable process name ("Validation"), and the term itself is the wayfinding signal.

---

## User Stories

1. **S-01 — As a Lab Manager**, I want to set a single lab-wide default for validation behavior (trigger + levels + roles) so that every newly created lab unit inherits a sensible default without me having to configure each one.
2. **S-02 — As a Lab Manager**, I want to configure a per-lab-unit override for **Hematology** that requires **2 sequential levels** of review (Level 1 = Tech II role, Level 2 = Supervisor role) so that the lab meets ISO 15189 §7.5.1.2 for clinical hematology, while other lab units keep the default.
3. **S-03 — As a Lab Manager**, I want to enable **auto-validation for normal results in Urinalysis** (trigger = Abnormal Only, 1 level) so that the bench tech's dipstick reading auto-releases when within range and only abnormals go to the validator's queue, preserving throughput on a high-volume low-risk unit.
4. **S-04 — As a Lab Manager**, I want to **disable validation entirely** for a Water Quality lab unit (trigger = No Results, 0 levels) so that regulatory-limit results from EPA-accredited analyzers auto-release into the utility report without staff bottleneck.
5. **S-05 — As a Lab Director**, I want to see an **effective-config summary across all lab units at a glance** so I can audit our overall validation posture during an ISO 15189 surveillance audit without clicking into each unit.
6. **S-06 — As a Lab Manager**, I want to **preview a configuration change before saving** so I can see how the Validation page will render for an analyst after Save, and catch role-assignment mistakes (e.g. assigning a role that no user holds) before committing.

---

## Cross-Domain Support

OpenELIS supports three sample domains (`CLINICAL`, `ENVIRONMENTAL`, `VECTOR` — per `feedback_domain_enum_no_both`, no `BOTH` value anywhere; the same enum applies to lab units, tests, and orders). Validation Configuration must work cleanly across all three because SILNAS Phase 1 has labs of all three domains in a single deployment.

### Domain attribute on Lab Unit

Each Lab Unit row in the override table carries the lab unit's `domain` attribute (already in the data model). A **Domain badge** column renders next to the unit name:

| Domain | Carbon `Tag` color | Use case |
|---|---|---|
| CLINICAL | `Tag kind="blue"` | Hematology, Chemistry, Microbiology, Serology |
| ENVIRONMENTAL | `Tag kind="green"` | Water Quality, Air Quality, Soil |
| VECTOR | `Tag kind="purple"` | Mosquito Pools, Tick Surveillance, Snail Hosts |

### Domain-aware default suggestions

When the admin creates a new override and selects a lab unit from the dropdown, the form **suggests** a starting config based on the unit's domain:

| Domain | Suggested trigger | Suggested levels | Rationale |
|---|---|---|---|
| CLINICAL | All Results | 1 | Current OpenELIS behavior — clinical results need human review |
| ENVIRONMENTAL | Abnormal Only | 1 | Most environmental results fall within regulatory limit; only out-of-spec readings need review |
| VECTOR | Abnormal Only | 1 | Most pool PCRs are negative; positives need review to inform downstream deconvolution decisions |

These are **suggestions, not enforced** — the admin can override any time, and the suggestion banner is dismissible. The suggestion fires only on initial override creation, not on edit.

### Validation Page UI label conventions inherit from sibling FRS

The labels rendered on the Validation Page itself (e.g. "Confirm clinician acknowledgment" -> "Confirm regulatory contact acknowledgment" -> "Confirm surveillance team acknowledgment") are governed by the sibling FRS at `designs/results-validation/validation-page.md`, §Cross-Domain Support. This admin page does NOT duplicate those mappings; it stores configuration only. The i18n keys for the **admin page's own** banners and labels follow the `label.foo.env` / `label.foo.vector` convention listed below.

---

## Scope

### In scope

- Lab-wide default configuration panel (Trigger + Validations Required + per-level Role)
- Per-lab-unit override table with Domain badge column and inline edit
- **Validation Trigger** radio: No Results / All Results / Abnormal Only
- **Validations Required** stepper (Carbon `NumberInput`, min=0, max=5)
- Per-level **Role** dropdown (Carbon `Select`), permission-filtered to roles holding `result.validate`
- **Effective-Config Preview** pane (live, shows what an analyst will see after Save)
- **Summary Banner** at the top of the page summarizing the effective configuration across all lab units (S-05)
- Auto-validation behavior at runtime + audit trail (`validated_by=SYSTEM`, `audit_action=AUTO_VALIDATE`)
- Migration logic from the existing binary "Validate all results" toggle to the new model
- Audit events on every config CRUD operation (CREATED / UPDATED / DELETED)
- Stale-page conflict guard for two-admin collision
- Empty-state handling when no roles hold `result.validate`
- Feature flag `useMultiLevelValidation` to gate the new surface during phased rollout

### Out of scope

- The Validation Page UI itself (governed by OGC-817 / sibling FRS)
- Delta-check threshold configuration — that lives in Test Catalog Management, not here
- **Role Builder** — the ability to mint custom roles holding `result.validate` exists in OpenELIS today; this page **consumes** the role list, it does not author roles
- FHIR result-release integration (separate surface)
- Per-test (rather than per-lab-unit) validation config — see §Future Considerations
- Separation-of-Duties enforcement (entry-author vs validator separation is handled at the Validation Page layer per sibling FRS; same-user-across-levels is allowed; see BR-V3CFG-003)
- LLM-assisted role recommendation (Catalyst — OGC-70 / OGC-113); see §Future Considerations

---

## Data Model — Schema Reuse First

Per `feedback_reuse_existing_data_elements`, every entity proposed below is first checked against existing OpenELIS schema, with the goal of riding on what's already there rather than minting parallel tables.

### Existing schema we re-use

| Existing entity | What it does today | How we use it |
|---|---|---|
| `Analysis.statusId` | Enum of analysis states: NotStarted, TechnicalAcceptance, TechnicalRejected, BiologistRejected, NonConforming_depr, Canceled, Finalized | We **extend** the enum with two new states: `AWAITING_VALIDATION` and `AUTO_VALIDATED`. We do NOT introduce a parallel `validation_status` column. Rationale: validation state is part of the analysis lifecycle, not orthogonal to it; an analysis in `AWAITING_VALIDATION` is by definition not Finalized and not Canceled. |
| `Audit` table (via `@Audited`) | Generic Envers-backed audit trail used by every `@Audited` entity in OpenELIS | We **ride this for validation_history entirely**. No parallel `validation_history` table. The validator's action becomes an `audit_action` code (`VALIDATE`, `AUTO_VALIDATE`, `RETEST`, `REJECT`) on the existing `Audit` table, with `target=analysis_id` and structured `payload` JSON. Rationale: audit infrastructure is mature, queryable, and already wired into reports; a parallel history table would duplicate it. |
| `Site_Information` properties | Flat key-value config used for site-wide settings (current "Validate all results" toggle lives here as `useValidationFlag`) | We migrate `useValidationFlag` into the new `validation_config` table as a lab-wide default row (`lab_unit_id IS NULL`). The legacy property is removed after migration completes; see §Migration Notes. We do NOT keep both. |
| `Role` + `Permission` join | Role-to-permission mapping that already exists for every OpenELIS role | We re-use the existing `permission` row keyed on `result.validate` (already present — it's what gates the Validation page today). The Role dropdown on this page is populated by `GET /api/admin/roles?permission=result.validate`. No new permission rows are needed. |

### New schema (minimum delta)

Two new tables, plus two new columns on `Analysis`. All `@Audited`.

#### Table: `validation_config`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `lab_unit_id` | FK -> `test_section.id` (nullable) | `NULL` = lab-wide default; non-NULL = per-unit override |
| `trigger` | enum | `NO_RESULTS` / `ALL_RESULTS` / `ABNORMAL_ONLY` |
| `validations_required` | smallint | 0-5; CHECK constraint enforces range |
| `is_active` | boolean | default `true`; soft-delete pattern |
| `version` | bigint | optimistic-locking version for stale-page guard |
| `created_at`, `updated_at`, `created_by`, `updated_by` | standard audit columns | |

**Unique constraint:** `UNIQUE (lab_unit_id) WHERE is_active = true` — one active config per lab unit; one active lab-wide default (`lab_unit_id IS NULL`).

#### Table: `validation_level_config`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID / serial PK | |
| `validation_config_id` | FK -> `validation_config.id` | ON DELETE CASCADE |
| `level_number` | smallint | 1-5; CHECK constraint enforces range |
| `role_id` | FK -> `role.id` | The role gating this level |
| `created_at`, `updated_at` | standard audit columns | |

**Unique constraint:** `UNIQUE (validation_config_id, level_number)`.

#### Extensions to `Analysis`

| Column | Type | Notes |
|---|---|---|
| `validation_levels_required` | smallint | **Snapshot** of the config in effect at the moment this Analysis was created (per BR-V3CFG-001 — config changes do not retroactively affect in-flight analyses) |
| `validation_level_current` | smallint | Current pending level; 0 = released, N = awaiting level N validation |
| `statusId` | enum | Extended with `AWAITING_VALIDATION`, `AUTO_VALIDATED` per above |

`Analysis` is already `@Audited`, so the new columns automatically participate in audit history.

### Migration mapping from current binary toggle

| Today (`Site_Information`) | After migration (`validation_config` lab-wide default) |
|---|---|
| `useValidationFlag = "Y"` ("Validate all results = Yes") | `trigger = NO_RESULTS`, `validations_required = 0` — i.e. nothing requires review, auto-release everything |
| `useValidationFlag = "N"` ("Validate all results = No") | `trigger = ALL_RESULTS`, `validations_required = 1`, Level 1 role = built-in Validation role |
| (no key set) | Same as `"N"` (default behavior preserved) |

**Backward compatibility:** No behavior change for existing sites until an admin opens the new page and edits something. The `useMultiLevelValidation` feature flag gates the new UI surface; when OFF, the legacy binary toggle UI renders. See §Feature Flag Pattern.

---

## Audit Events

All audit events ride on the existing `Audit` table via `@Audited`. No parallel audit table.

| Action code | Target | Payload (JSON) | Triggered by |
|---|---|---|---|
| `VALIDATION_CONFIG_CREATED` | `validation_config.id` | `{ labUnitId, trigger, validationsRequired, levels: [{ levelNumber, roleId }] }` | Admin Save on a new override or first creation of lab-wide default |
| `VALIDATION_CONFIG_UPDATED` | `validation_config.id` | `{ changedFields: [...], previousValues: {...}, newValues: {...} }` | Admin Save on any existing config |
| `VALIDATION_CONFIG_DELETED` | `validation_config.id` | `{ revertedTo: 'default' \| null, deletedConfig: {...} }` | Admin Delete on a per-unit override (reverts to default) or hard-delete of an inactive row |
| `VALIDATE` | `analysis_id` | `{ level, validatorId, roleId, eSignature?: {...} }` | Validator action at runtime (see sibling FRS) |
| `AUTO_VALIDATE` | `analysis_id` | `{ rule: 'no-results' \| 'normal-with-abnormal-only-trigger', configSnapshot: {...} }` | System job at result-save time when applicable |
| `RETEST` | `analysis_id` | `{ byUser, reason, retestAnalysisId }` | Validator Request Retest |
| `REJECT` | `analysis_id` | `{ byUser, reason, byLevel }` | Validator Reject |
| `STALE_PAGE_CONFLICT_ADMIN_VALIDATION_CONFIG` | `validation_config.id` | `{ attemptedBy, currentVersion, attemptedVersion }` | Admin tries to Save with a stale `version` |

The `configSnapshot` payload on `AUTO_VALIDATE` captures the full config that drove the auto-release decision, so an ISO 15189 surveillance audit can reconstruct exactly which trigger and level config released each auto-validated result. This is the single most important audit deliverable for the SILNAS Indonesia deployment per the National Lab Quality Manual review.

---

## Permissions

Per `feedback_openelis_admin_permissions`, OpenELIS admin permissions are **binary** — a user either holds the Admin bundle or they don't, with the single exception of Test Catalog Management (which already has its own carve-out). This page does NOT introduce fine-grained admin sub-permissions like `validation.config.view` / `.edit` / `.delete`, because the OpenELIS permission engine does not enforce them and inventing them would create dead UI states.

| Permission | Effect |
|---|---|
| **Admin bundle** | Required to access `/admin/validation-configuration`. Grants full read + write + delete. |
| **`result.validate`** | NOT required to access this page. This is the only **non-admin** permission referenced here — the role dropdown filters to roles holding this permission, but the admin themselves does not need to hold it. |

Other validation-related permissions (`results.validation.view`, etc.) are out of scope for this page; they are owned by OGC-579 (Validation Page implementation) and govern who can see and act on the Validation Page at runtime.

---

## Carbon Component Map

Per v3 requirement, every UI element on the page maps to an explicit `@carbon/react` component. The mockup may use Tailwind utility classes for portability, but the production build MUST use the components below.

| UI Element | `@carbon/react` Component | Notes |
|---|---|---|
| Page shell | `Grid` + `Column` | Standard admin page chrome |
| Page title | `<h1>` + `Tag` for feature-flag status | Title = "Validation Configuration" |
| **Summary Banner** (S-05) | `InlineNotification kind="info"` | "N lab units configured; M auto-validating; K requiring multi-level" |
| **Feature-flag-off banner** | `InlineNotification kind="info"` | Renders only when flag is OFF |
| **Lab-Wide Default panel** | `Tile` containing a `Form` | One per page |
| **Validation Trigger** radio group | `RadioButtonGroup` + `RadioButton` x 3 | Values: NO_RESULTS / ALL_RESULTS / ABNORMAL_ONLY |
| **Validations Required** stepper | `NumberInput` (min=0, max=5, step=1) | Increments levels via Add/Remove level rows |
| **Level N Role** dropdown | `Select` + `SelectItem` | One row per level; populated from `/api/admin/roles?permission=result.validate` |
| Add Level button | `Button kind="ghost"` with `Add` icon | Disabled when at max (5) |
| Remove Level button | `Button kind="ghost"` with `TrashCan` icon | Per-row; disabled when at min (0) |
| **Per-Unit Override table** | `DataTable` with `TableExpandRow` + `TableExpandedRow` | Expand reveals inline edit form |
| Override row columns | Lab Unit / Domain badge / Trigger / Levels / Roles summary / Status / Actions | |
| **Domain badge** | `Tag kind="blue"\|"green"\|"purple"` | CLINICAL / ENVIRONMENTAL / VECTOR |
| Add Override button (above table) | `Button kind="tertiary"` with `Add` icon | Opens inline new-row form at top of table |
| Add Override modal (alternative; mobile) | `Modal` | Same form as inline |
| Edit Override (inline) | `TableExpandedRow` containing same Form as Lab-Wide Default | |
| Delete Override | `Button kind="danger--ghost"` + `Modal` confirm | Confirms with "Revert to lab-wide default?" |
| **Effective-Config Preview** pane | `Tile` containing an embedded mini Validation Page render | Read-only; shows what an analyst will see post-Save |
| Preview "What if I Save?" toggle | `Toggle` | Switches between Current state and Pending (post-Save) state |
| **Save** button | `Button kind="primary"` | Disabled when no changes or when invalid (empty role dropdown) |
| **Reset to Default** button | `Button kind="ghost"` | Per-unit; clears override and reverts to lab-wide |
| Save confirmation | `InlineLoading` + `ToastNotification` (success) | |
| **Empty state — no roles hold `result.validate`** | `InlineNotification kind="warning"` + Save disabled | Body: "No roles with the Validate Results permission are configured. Configure a role in [Role Builder](link) before saving a multi-level validation configuration." |
| **Stale-page conflict** | `ToastNotification kind="error"` + page reload | "Configuration was changed by another admin. Reloading." |
| Domain-suggestion banner (on new override) | `InlineNotification kind="info"` (dismissible) | "This is an Environmental lab unit. Suggested config: Abnormal Only, 1 level." |
| Tooltips on Trigger options | `Toggletip` (Carbon 11) | Explains each trigger semantically |
| Audit-trail link (per row) | `Link` opening Audit page filtered to `target=validation_config.id` | |

---

## Feature Flag Pattern

Per `project_admin_mvp_feature_flag_pattern`, multi-level validation is gated behind a feature flag during phased rollout.

| Flag | Default | Effect |
|---|---|---|
| `useMultiLevelValidation` | **OFF** for upgrades, **ON** for new installs | When OFF, the page renders the **legacy binary toggle UI** (a single "Validate all results: Yes / No" radio) with an `InlineNotification kind="info"` banner reading: "Multi-level validation is available. Enable in [Feature Flags admin](/admin/feature-flags) to access the new configuration model." When ON, the full v3 surface renders. |

**Lab-wide default seeded on flag enable:** When an admin flips the flag from OFF to ON, the migration script (see §Migration Notes) seeds the lab-wide default row in `validation_config` from the current binary toggle value. No behavior change on the Validation Page until the admin actually edits the config.

**Down-flipping:** If the flag is flipped back OFF after configs have been edited, the legacy UI re-renders against the current lab-wide default row's effective binary value (`trigger=NO_RESULTS` and `levels=0` -> display as "Yes"; anything else -> display as "No"). Per-unit overrides become invisible but are **not** deleted — they re-surface when the flag goes ON again. This is the standard admin-flag pattern for OpenELIS.

---

## i18n Keys

All strings on the page wrap through `t(key, fallback)`. Keys follow the `label.foo` / `label.foo.env` / `label.foo.vector` convention; only keys that read differently across domains carry the `.env` / `.vector` suffix. Approximately 40 keys cover the main surface.

### Page chrome

| Key | English |
|---|---|
| `nav.admin.validation.configuration` | Validation Configuration |
| `label.admin.validation.config.title` | Validation Configuration |
| `label.admin.validation.config.title.env` | Validation Configuration |
| `label.admin.validation.config.title.vector` | Validation Configuration |
| `label.admin.validation.config.subtitle` | Configure validation triggers, level counts, and role assignments per lab unit. |
| `breadcrumb.admin.validation.configuration` | Validation Configuration |

### Lab-Wide Default panel

| Key | English |
|---|---|
| `label.admin.validation.labWideDefault.heading` | Lab-Wide Default |
| `label.admin.validation.labWideDefault.help` | Applies to any lab unit without a specific override below. |
| `label.admin.validation.trigger.heading` | Validation Trigger |
| `label.admin.validation.trigger.no-results` | Auto-validate all results |
| `label.admin.validation.trigger.no-results.env` | Auto-release all results |
| `label.admin.validation.trigger.no-results.vector` | Auto-release all results |
| `label.admin.validation.trigger.all-results` | Require validation on all results |
| `label.admin.validation.trigger.abnormal-only` | Require validation on abnormal results only |
| `label.admin.validation.trigger.abnormal-only.help` | Normal results auto-release; abnormal results enter the validation queue. |
| `label.admin.validation.validationsRequired.heading` | Validations Required |
| `label.admin.validation.validationsRequired.help` | Number of sequential review levels (0 to 5). |
| `label.admin.validation.level.role` | Role for Level {n} |
| `label.admin.validation.level.role.placeholder` | Select a role with Validate Results permission |
| `label.admin.validation.level.addLevel` | Add Level |
| `label.admin.validation.level.removeLevel` | Remove Level {n} |

### Per-Unit Override table

| Key | English |
|---|---|
| `label.admin.validation.overrides.heading` | Per-Lab-Unit Overrides |
| `label.admin.validation.overrides.help` | Specific configurations that override the lab-wide default. |
| `label.admin.validation.override.add` | Configure override |
| `label.admin.validation.override.column.labUnit` | Lab Unit |
| `label.admin.validation.override.column.domain` | Domain |
| `label.admin.validation.override.column.trigger` | Trigger |
| `label.admin.validation.override.column.levels` | Levels |
| `label.admin.validation.override.column.roles` | Roles |
| `label.admin.validation.override.column.status` | Status |
| `label.admin.validation.override.column.actions` | Actions |
| `label.admin.validation.override.action.edit` | Edit |
| `label.admin.validation.override.action.delete` | Delete (revert to default) |
| `label.admin.validation.override.action.viewAudit` | View audit trail |
| `label.admin.validation.override.emptyState` | No per-unit overrides. All lab units use the lab-wide default above. |

### Domain badges

| Key | English |
|---|---|
| `label.admin.validation.domain.clinical` | Clinical |
| `label.admin.validation.domain.env` | Environmental |
| `label.admin.validation.domain.vector` | Vector |

### Domain-aware suggestion banner

| Key | English |
|---|---|
| `label.admin.validation.domainSuggestion.clinical` | Suggested config: All Results, 1 level. |
| `label.admin.validation.domainSuggestion.env` | Most environmental results are within regulatory limit. Suggested config: Abnormal Only, 1 level. |
| `label.admin.validation.domainSuggestion.vector` | Most pool PCRs are negative. Suggested config: Abnormal Only, 1 level. |

### Effective-Config Preview pane

| Key | English |
|---|---|
| `label.admin.validation.preview.heading` | Effective Configuration Preview |
| `label.admin.validation.preview.help` | Shows what an analyst will see on the Validation page after Save. |
| `label.admin.validation.preview.toggleCurrent` | Current |
| `label.admin.validation.preview.togglePending` | After Save |
| `label.admin.validation.preview.empty` | Select a lab unit to preview its effective configuration. |

### Summary Banner (S-05)

| Key | English |
|---|---|
| `label.admin.validation.summary.template` | {totalUnits} lab units configured: {autoReleaseCount} auto-releasing, {singleLevelCount} single-level, {multiLevelCount} multi-level. |

### Save / Reset / Errors

| Key | English |
|---|---|
| `button.admin.validation.save` | Save Configuration |
| `button.admin.validation.reset` | Reset to Default |
| `message.admin.validation.saved` | Configuration saved. |
| `message.admin.validation.deleteConfirm` | Delete this override and revert {labUnit} to the lab-wide default? In-flight analyses keep their snapshot. |
| `warn.admin.validation.noEligibleRoles` | No roles with the Validate Results permission are configured. Configure a role in Role Builder before saving a multi-level validation configuration. |
| `warn.admin.validation.staleConflict` | Configuration was changed by another administrator. Reloading. |
| `warn.admin.validation.flagOff` | Multi-level validation is available. Enable in Feature Flags admin to access the new configuration model. |

---

## Business Rules

**BR-V3CFG-001 — Config snapshot at entry:** The validation configuration in effect at the moment an `Analysis` row is created is **snapshotted onto the Analysis** via `validation_levels_required` (column on `Analysis`). Subsequent admin edits to `validation_config` do **not** retroactively affect in-flight analyses. Rationale: an analyst who started reviewing a result yesterday at "Level 1 of 2" must not see it change to "Level 1 of 3" today because the admin added a level overnight.

**BR-V3CFG-002 — Entry-author separation:** The user who entered a result at Results Entry **cannot** validate that result at any level. Enforced at the API layer (`POST /api/v1/validation/validate` returns `403` with `reason=ENTRY_AUTHOR_CONFLICT` if `requesterId === analysis.enteredBy`). The admin Validation Configuration page does NOT expose a toggle for this — it is always on.

**BR-V3CFG-003 — Same user across multiple levels:** The same user MAY validate at multiple levels in sequence (e.g. a Lab Manager who holds both Level 1 and Level 2 roles can sign off on both passes). OpenELIS today does **not** enforce strict Separation of Duties (SoD) across levels. Sites that require strict SoD must enforce it via the existing Role Builder by ensuring no single user holds both roles. This is by design; see §Future Considerations.

**BR-V3CFG-004 — Role dropdown source of truth:** The Level N Role dropdown is populated **exclusively** from `GET /api/admin/roles?permission=result.validate`. If the API returns an empty list, the warning empty-state banner renders and Save is disabled. The dropdown does NOT fall back to "all roles" or "the built-in Validation role" — empty list = empty dropdown + warning.

**BR-V3CFG-005 — Auto-validation rides existing audit infrastructure:** When the system auto-validates a result (per `trigger=NO_RESULTS` or `trigger=ABNORMAL_ONLY` with normal result), it writes an `AUTO_VALIDATE` row to the existing `Audit` table via `@Audited`, with `validated_by=SYSTEM`, `analysis_id` as target, and the full `configSnapshot` in the payload. No parallel `validation_history` table is created.

**BR-V3CFG-006 — Override deletion reverts to lab-wide default:** Deleting a per-unit override **soft-deletes** the row (`is_active = false`) and writes a `VALIDATION_CONFIG_DELETED` audit event. **In-flight analyses keep their snapshot** (per BR-V3CFG-001); only **new** analyses for that lab unit start using the lab-wide default. The delete confirmation modal MUST surface this distinction in plain language.

**BR-V3CFG-007 — Cross-domain default suggestions are advisory:** When creating a new override and the selected lab unit's domain is non-clinical, the page surfaces the domain-appropriate suggestion (Abnormal Only / 1 level for ENVIRONMENTAL and VECTOR). The admin can override the suggestion at any time; the suggestion banner is dismissible and never enforced.

**BR-V3CFG-008 — Stale-page conflict guard:** Every `validation_config` row carries a `version` column (incremented on every UPDATE). Save requests include the loaded `version`; if the server-side `version` is higher, the API returns `409 CONFLICT` and the page surfaces a toast + reload. An audit event `STALE_PAGE_CONFLICT_ADMIN_VALIDATION_CONFIG` is written for compliance review.

**BR-V3CFG-009 — Lab-wide default cannot be deleted:** The lab-wide default row (`lab_unit_id IS NULL`) cannot be hard-deleted via the UI. It can only be edited. (If it is edited to `trigger=NO_RESULTS` and `validations_required=0`, that is the new effective default and equivalent to "no validation by default" — but the row itself persists.)

**BR-V3CFG-010 — Validations Required = 0 forces Trigger = NO_RESULTS:** When the admin sets `validations_required = 0`, the Trigger radio becomes disabled and is forced to `NO_RESULTS` (auto-release everything). The combination `trigger=ABNORMAL_ONLY` + `validations_required=0` is **invalid** (it would mean "review abnormal results with zero reviewers" — incoherent). Save is blocked if this combo is somehow submitted (defense-in-depth API check).

**BR-V3CFG-011 — Level role assignment is required when Validations Required >= 1:** Each level row must have a non-null Role selection before Save is enabled. Empty role on any level disables Save with an inline error.

**BR-V3CFG-012 — Inline edits are atomic per row:** Editing an override row commits via a single PUT to `/api/admin/validation-config/units/{labUnitId}`. The lab-wide default commits via a single PUT to `/api/admin/validation-config`. No multi-row batch save — each row is its own transaction. This simplifies the stale-page conflict path.

**BR-V3CFG-013 — Effective-Config Preview is read-only:** The preview pane renders a non-interactive miniature of the Validation Page using the **pending** (unsaved) config. It does NOT call the production Validation Page API; it calls `/api/admin/validation-config/preview` with the pending payload and receives a static rendered preview. Rationale: the preview must be safe to show before Save commits.

---

## API Endpoints

| Method | Path | Purpose | Permission |
|---|---|---|---|
| `GET` | `/api/admin/validation-config` | Fetch the lab-wide default (returns `{ trigger, validationsRequired, levels: [...], version }`) | Admin |
| `PUT` | `/api/admin/validation-config` | Update the lab-wide default. Body includes `version` for optimistic locking. Returns 409 on stale. | Admin |
| `GET` | `/api/admin/validation-config/units` | List all per-unit overrides as a table with Lab Unit, Domain, Trigger, Levels, Roles, Status | Admin |
| `GET` | `/api/admin/validation-config/units/{labUnitId}` | Fetch a specific override (or 404 if none) | Admin |
| `PUT` | `/api/admin/validation-config/units/{labUnitId}` | Create or update a per-unit override (upsert). Body includes `version`. | Admin |
| `DELETE` | `/api/admin/validation-config/units/{labUnitId}` | Soft-delete the override; the unit reverts to the lab-wide default for new analyses. In-flight analyses keep their snapshot. | Admin |
| `GET` | `/api/admin/roles?permission=result.validate` | List roles holding the `result.validate` permission. Source of truth for Level N Role dropdowns. | Admin |
| `POST` | `/api/admin/validation-config/preview` | Effective-Config preview. Body = pending validation_config payload; response = rendered preview describing what the analyst will see after Save. | Admin |
| `GET` | `/api/admin/lab-units?withDomain=true` | List all lab units with their `domain` attribute (used by the override-create dropdown and Domain badge column). | Admin |

All endpoints return JSON. Error envelope follows the standard OpenELIS pattern: `{ status, code, message, details? }`.

---

## Acceptance Criteria

### Functional — Lab-Wide Default Panel

- [ ] Page loads with the current lab-wide default fetched from `GET /api/admin/validation-config`
- [ ] Trigger radio group renders three options: No Results / All Results / Abnormal Only
- [ ] Validations Required `NumberInput` ranges 0-5; out-of-range entry is rejected client-side
- [ ] When Validations Required = 0, Trigger is forced to No Results and disabled per **BR-V3CFG-010**
- [ ] When Validations Required >= 1, N Level Role dropdowns render, each populated from `/api/admin/roles?permission=result.validate`
- [ ] If the role API returns empty, warning banner renders and Save is disabled per **BR-V3CFG-004**
- [ ] Save writes via `PUT /api/admin/validation-config` and emits `VALIDATION_CONFIG_UPDATED` audit event
- [ ] Save on stale version returns 409; toast + reload fires per **BR-V3CFG-008**

### Functional — Per-Unit Override Table

- [ ] Table lists all active overrides with columns: Lab Unit / Domain badge / Trigger / Levels / Roles summary / Status / Actions
- [ ] Domain badge color matches domain per Cross-Domain Support table
- [ ] Empty state renders helpful copy when no overrides exist
- [ ] "Configure override" button opens inline new-row form (or modal on narrow viewport)
- [ ] On selecting a lab unit, domain-aware suggestion banner renders per **BR-V3CFG-007**
- [ ] Suggestion banner is dismissible and never enforced
- [ ] Save on a new override emits `VALIDATION_CONFIG_CREATED`; save on existing emits `VALIDATION_CONFIG_UPDATED`
- [ ] Delete prompts the modal with in-flight-snapshot copy per **BR-V3CFG-006**; on confirm, soft-deletes and emits `VALIDATION_CONFIG_DELETED`

### Functional — Effective-Config Preview

- [ ] Preview pane renders mini Validation Page using pending payload via `POST /api/admin/validation-config/preview`
- [ ] Toggle switches between Current state and Pending (post-Save) state per **BR-V3CFG-013**
- [ ] Preview updates within 500ms of form change (debounced)
- [ ] Preview is non-interactive — no clicks register

### Functional — Summary Banner (S-05)

- [ ] Banner renders at top of page summarizing: total lab units, auto-releasing count, single-level count, multi-level count
- [ ] Counts update after Save (no full page reload required)

### Functional — Feature Flag

- [ ] When `useMultiLevelValidation = OFF`, legacy binary toggle renders with the "Multi-level validation available" banner
- [ ] When flag flips ON, lab-wide default row is seeded per Migration Notes
- [ ] Flipping flag OFF after edits hides the multi-level UI but does NOT delete per-unit overrides; flipping ON restores them

### Functional — Auto-Validation at Runtime

- [ ] When a result is saved at Results Entry and the effective config has `trigger=NO_RESULTS` and `validations_required=0`, the result auto-releases and emits `AUTO_VALIDATE` per **BR-V3CFG-005**
- [ ] When `trigger=ABNORMAL_ONLY` and result is within reference range, result auto-releases with the same audit event
- [ ] `configSnapshot` payload on `AUTO_VALIDATE` contains the full effective config

### Non-Functional

- [ ] All UI strings wrap through `t(key, fallback)` per i18n key list
- [ ] Carbon Component Map respected end-to-end
- [ ] WCAG 2.1 AA compliance (production using `@carbon/react`)
- [ ] French and Bahasa Indonesia locales tested — no layout breakage on Bahasa (typically 15-20% wider strings)
- [ ] Audit events written for every config CRUD per §Audit Events
- [ ] Page p95 load time < 800ms with 50 lab units configured
- [ ] Save round-trip < 400ms p95
- [ ] No `console.error` or accessibility violations in axe-core scan

### Integration

- [ ] Roles fetched from `/api/admin/roles?permission=result.validate` reflect Role Builder changes within 60s (existing role-cache TTL)
- [ ] Lab units fetched from `/api/admin/lab-units?withDomain=true` include domain attribute
- [ ] Saved config visible to the Validation Page UI immediately after Save (no cache-bust delay)
- [ ] Audit events appear in the standard `/admin/audit-trail` view filtered by `target_type=validation_config`
- [ ] In-flight analyses unaffected when config is edited (snapshot integrity) — verified by integration test
- [ ] Migration from legacy `useValidationFlag` runs idempotently (re-running does not double-seed)

---

## Migration Notes

Migration from the existing v2.1 binary toggle to the v3 admin config model is **two-phase**.

### Phase 1 — Schema migration (Liquibase changeset)

```sql
-- Create new tables
CREATE TABLE validation_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_unit_id     UUID NULL REFERENCES test_section(id),
  trigger         VARCHAR(32) NOT NULL CHECK (trigger IN ('NO_RESULTS','ALL_RESULTS','ABNORMAL_ONLY')),
  validations_required SMALLINT NOT NULL CHECK (validations_required BETWEEN 0 AND 5),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  version         BIGINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID NULL,
  updated_by      UUID NULL,
  CONSTRAINT chk_trigger_levels CHECK (NOT (trigger = 'ABNORMAL_ONLY' AND validations_required = 0))
);

CREATE UNIQUE INDEX idx_validation_config_unit_active
  ON validation_config (COALESCE(lab_unit_id, '00000000-0000-0000-0000-000000000000'))
  WHERE is_active = true;

CREATE TABLE validation_level_config (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_config_id  UUID NOT NULL REFERENCES validation_config(id) ON DELETE CASCADE,
  level_number          SMALLINT NOT NULL CHECK (level_number BETWEEN 1 AND 5),
  role_id               UUID NOT NULL REFERENCES role(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (validation_config_id, level_number)
);

-- Extend Analysis
ALTER TABLE analysis ADD COLUMN validation_levels_required SMALLINT NULL;
ALTER TABLE analysis ADD COLUMN validation_level_current   SMALLINT NULL;

-- Extend status enum (Hibernate enum; Liquibase via insert into status table)
INSERT INTO status (id, name) VALUES
  ('<uuid>', 'AWAITING_VALIDATION'),
  ('<uuid>', 'AUTO_VALIDATED');
```

All new tables get `@Audited` via the corresponding Hibernate entity annotations.

### Phase 2 — Data backfill

```sql
-- Seed lab-wide default from the existing binary toggle
INSERT INTO validation_config (lab_unit_id, trigger, validations_required, is_active)
SELECT
  NULL,
  CASE
    WHEN si.value = 'Y' THEN 'NO_RESULTS'
    ELSE 'ALL_RESULTS'
  END,
  CASE
    WHEN si.value = 'Y' THEN 0
    ELSE 1
  END,
  true
FROM site_information si
WHERE si.name = 'useValidationFlag'
LIMIT 1;

-- If the legacy maps to ALL_RESULTS/1, seed Level 1 = built-in Validation role
INSERT INTO validation_level_config (validation_config_id, level_number, role_id)
SELECT vc.id, 1, (SELECT id FROM role WHERE name = 'Validation' LIMIT 1)
FROM validation_config vc
WHERE vc.lab_unit_id IS NULL
  AND vc.trigger = 'ALL_RESULTS'
  AND vc.validations_required = 1;

-- Snapshot validation_levels_required onto all existing in-flight analyses
UPDATE analysis a
SET validation_levels_required = (
  SELECT validations_required FROM validation_config WHERE lab_unit_id IS NULL AND is_active = true LIMIT 1
),
    validation_level_current = CASE
      WHEN a.status_id = (SELECT id FROM status WHERE name = 'Finalized') THEN 0
      ELSE 1
    END
WHERE a.validation_levels_required IS NULL;

-- Retire the legacy property (after Phase 2 verified in staging)
DELETE FROM site_information WHERE name = 'useValidationFlag';
```

### Verification

- Run `SELECT COUNT(*) FROM validation_config WHERE lab_unit_id IS NULL` — must return exactly 1
- Run `SELECT COUNT(*) FROM analysis WHERE validation_levels_required IS NULL` — must return 0
- Spot-check 10 in-flight analyses on the Validation Page — same level count and behavior as pre-migration

### Rollback path

The migration is idempotent and reversible within 24 hours:

- `DELETE FROM validation_config; DELETE FROM validation_level_config;` (cascades)
- `ALTER TABLE analysis DROP COLUMN validation_levels_required, DROP COLUMN validation_level_current;`
- Restore `site_information` row from the pre-migration audit snapshot (kept for 30 days)

After 24 hours, audit history of new `VALIDATE` / `AUTO_VALIDATE` events on the `Audit` table cannot be cleanly rolled back without losing legitimate audit records; in that case, a forward-fix migration is preferred.

### Feature-flag rollout sequence

1. Ship schema migration (Phase 1) with `useMultiLevelValidation = OFF` — no UI change
2. Run data backfill (Phase 2) — silent
3. Verify in staging — no behavior change on Validation Page
4. Flip `useMultiLevelValidation = ON` per-site as labs are ready
5. Each lab confirms its lab-wide default and configures per-unit overrides as needed
6. Retire `useValidationFlag` property in next minor release (after 90 days of zero-rollback signal)

---

## Future Considerations

1. **LLM-assisted role assignment via Catalyst (OGC-70 / OGC-113)** — when those tools land, the Level N Role dropdown could surface a "Suggest role from policy document" affordance that reads the lab's quality manual PDF and proposes a role binding. Per `project_catalyst_llm_tool`, this is a future assistive layer, NOT a near-term replacement; the admin keeps full authority.
2. **Separation of Duties enforcement** — if Role Builder gains an explicit "users in this role cannot also hold role X" capability, the admin page could expose a SoD toggle on the level-role assignment form. Today, sites enforce SoD by careful role membership, which works for SILNAS but may not scale to larger deployments.
3. **Per-test validation config** — some labs want validation rules at the test level (e.g. "Hematology unit defaults to 2-level, but the CBC w/ Diff specifically requires 3-level because of pediatric ranges"). This is a sibling enhancement that would live as a `validation_config.test_id` column with an additional unique index. Out of scope for v3.0; tracked as a follow-up if SILNAS Phase 2 requires it.
4. **Time-based validation triggers** — STAT results bypass validation; routine results require 2-level. Mentioned by Casey 2026-05 as a future possibility. Would attach to the `validation_config` row as an additional trigger dimension. Not in v3.0.
5. **Validator queue depth visualization on the admin page** — surface "Level 1 has 47 results waiting; Level 2 has 8" inline with each override so the Lab Manager sees real-time bottlenecks. Useful for the Lab Director persona but adjacent to the configuration surface; better as a dashboard widget.
6. **Bulk override apply** — "Apply this configuration to all Clinical lab units." Convenient for SILNAS at deployment time; risky in steady state. Deferred until there is clear demand.

---

**End of FRS.**
