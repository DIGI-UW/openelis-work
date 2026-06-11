# Result Validation Page - Functional Requirements Specification

**Version:** 2.0  
**Date:** February 26, 2026  
**Changes from v1.0:** Multi-level validation pipeline, admin configuration, role-based validation levels, auto-validation for normal results, per-lab-unit overrides

---

## Overview

The Result Validation system controls how test results move from "Entered" to "Released" status. It encompasses both the admin configuration (how many validations are needed, who can perform them, and which results require them) and the validator-facing page (where authorized users review and approve results).

### Purpose

- Provide configurable validation pipelines at the lab-wide and lab-unit level
- Support zero, single, or multi-level validation workflows
- Enable auto-validation (skip validation) for configurable result subsets
- Make validation requirements and release behavior explicit and visible
- Maintain full audit trail including auto-validated results
- Support role-based validation assignments filtered to roles holding the `result.validate` permission

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Validation Level** | A single approval step in the pipeline. Each level is assigned a role. |
| **Validations Required** | The total number of validation levels a result must pass before release (0, 1, 2, etc.) |
| **Validation Trigger** | Which results require validation: None, All, or Abnormal Only |
| **Auto-Validation** | When validations required is 0, or when trigger is "Abnormal Only" and the result is normal, the system automatically validates and releases the result on save |
| **Release** | The final validation in the pipeline releases the result (makes it available to patient/EMR/reports) |

---

## 1. Validation Configuration (Admin)

### 1.1 Location in Admin UI

The validation configuration replaces the existing binary **"Validate all results"** setting under the Admin menu. The new configuration page is accessed via:

**Admin → Validation Configuration**

This page has two sections: a lab-wide default and per-lab-unit overrides.

### 1.2 Lab-Wide Default Configuration

The lab-wide default applies to all lab units that do not have a unit-specific override. This is the "starting point" — every lab unit inherits these settings unless explicitly overridden.

#### Configuration Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `label.admin.validation.trigger` Validation Trigger | Radio group | Which results require validation | All Results |
| `label.admin.validation.levelsRequired` Validations Required | Number input (0–5) | How many sequential approvals before release | 1 |
| `label.admin.validation.level.N.role` Level N Role | Dropdown (permission-filtered roles) | Which role can perform validation at this level | Validation (built-in role) |

#### Validation Trigger Options

| Option | `label.*` Key | Behavior |
|--------|---------------|----------|
| **No Results** | `label.admin.validation.trigger.none` | All results auto-validate and release on save. Validation page shows nothing for this lab unit. Equivalent to current "Validate all results = Yes" behavior. |
| **All Results** | `label.admin.validation.trigger.all` | Every result must pass through the full validation pipeline before release. This is the default. |
| **Abnormal Results Only** | `label.admin.validation.trigger.abnormal` | Results within the normal range auto-validate and release on save. Results outside normal range (flagged abnormal, critical, delta check) enter the validation pipeline. |

#### Validations Required (Levels)

| Value | Behavior | Button Label on Final Level |
|-------|----------|---------------------------|
| **0** | All results auto-validate on save. No manual validation step. Identical behavior to "No Results" trigger regardless of trigger setting. | N/A (no validation page interaction) |
| **1** | Single validation step (current default behavior). One authorized user reviews and approves. | `label.validation.action.validateRelease` "Validate & Release" |
| **2** | Two sequential validations. First validator approves; result moves to level 2 queue. Second validator approves and releases. | Level 1: `label.validation.action.validate` "Validate (1 of 2)" / Level 2: `label.validation.action.validateRelease` "Validate & Release" |
| **3–5** | Same sequential pattern. Each level must be completed in order. | Pattern: "Validate (N of M)" / final: "Validate & Release" |

#### Level Role Assignment

Each validation level has a role assignment dropdown populated from roles that hold the `result.validate` permission (`GET /api/roles?permission=result.validate`). Currently, only the built-in "Validation" role has this permission. As admins grant the `result.validate` permission to additional roles via the Role Builder, those roles will automatically appear in this dropdown.

The same role can be assigned to multiple levels (since the same user is allowed to validate multiple levels per your requirements). When a new level is added, it defaults to the "Validation" role.

If no roles currently hold the `result.validate` permission, the role assignment section displays a warning: *"No roles currently hold the `result.validate` permission. Use the Role Builder to assign this permission before configuring validation levels."* The Save button is disabled until at least one role is available.

**Important constraint:** The user who *entered* the result cannot validate it at any level. This is enforced regardless of whether the same person can validate at multiple levels.

### 1.3 Per-Lab-Unit Overrides

Below the lab-wide defaults, a table shows each lab unit with its effective configuration. Any lab unit can override the lab-wide defaults.

#### Lab Unit Override Table

| Column | Description |
|--------|-------------|
| `label.admin.validation.labUnit` Lab Unit | Lab unit name |
| `label.admin.validation.source` Source | Badge: "Default" (inheriting) or "Override" (custom) |
| `label.admin.validation.trigger` Trigger | Current trigger setting |
| `label.admin.validation.levels` Levels | Number of validation levels |
| `label.admin.validation.roles` Roles | Comma-separated role names per level |
| `label.admin.validation.action` Action | "Edit Override" or "Reset to Default" |

When "Edit Override" is clicked, an inline expansion (not modal) shows the same configuration fields as the lab-wide default, pre-populated with the current effective values. Changes here only affect that lab unit. "Reset to Default" removes the override and re-inherits from the lab-wide default.

### 1.4 Configuration Summary Banner

At the top of the validation configuration page, a summary banner provides at-a-glance information:

| Element | Description |
|---------|-------------|
| `label.admin.validation.summary.default` Default Config | "Lab Default: [Trigger] / [N] level(s) / [Role names]" |
| `label.admin.validation.summary.overrides` Overrides | "[X] lab unit(s) with custom configuration" |
| `label.admin.validation.summary.autoRelease` Auto-Release Units | "[Y] lab unit(s) auto-releasing all results (0 validations or No Results trigger)" |

### 1.5 Relationship to Existing "Validate All Results" Setting

The existing "Validate all results" toggle in the admin menu is **replaced** by this configuration page. Migration mapping:

| Old Setting | New Equivalent |
|-------------|----------------|
| "Validate all results" = **Yes** (skip validation) | Validation Trigger = **No Results** OR Validations Required = **0** |
| "Validate all results" = **No** (require validation) | Validation Trigger = **All Results**, Validations Required = **1**, Role = **Validation** |

The data migration should set the new configuration to match whatever the existing toggle was set to, so existing installations see no behavior change on upgrade.

---

## 2. Auto-Validation Behavior

### 2.1 When Auto-Validation Occurs

Auto-validation happens at result save time (when a technician saves/accepts a result on the Results Entry page). The system checks the effective validation configuration for that result's lab unit and determines whether the result should enter the validation queue or be auto-released.

#### Decision Logic

```
On result save:
  1. Get effective config for result's lab unit (override or default)
  2. If validations_required == 0:
       → Auto-validate and release immediately
  3. If trigger == "No Results":
       → Auto-validate and release immediately
  4. If trigger == "Abnormal Only":
       a. Evaluate result against normal range
       b. If result is NORMAL (within range, no flags):
            → Auto-validate and release immediately
       c. If result is ABNORMAL (outside range, flagged, critical, delta check):
            → Enter validation pipeline at level 1
  5. If trigger == "All Results":
       → Enter validation pipeline at level 1
```

### 2.2 Auto-Validation Audit Trail

Every auto-validated result is logged with a system-generated audit entry:

| Audit Field | Value |
|-------------|-------|
| `action` | `AUTO_VALIDATE` |
| `performedBy` | `SYSTEM` |
| `timestamp` | Server timestamp at save time |
| `ruleReference` | Description of which rule triggered auto-validation |
| `resultId` | The result that was auto-validated |
| `level` | `0` (indicating no human validation) |

#### Rule Reference Examples

| Scenario | Rule Reference Text |
|----------|-------------------|
| 0 validations required | `label.audit.autoValidate.zeroLevels` "Auto-validated: Lab unit configured with 0 validation levels" |
| Trigger = No Results | `label.audit.autoValidate.noValidation` "Auto-validated: Lab unit configured with validation trigger 'No Results'" |
| Trigger = Abnormal Only, result normal | `label.audit.autoValidate.normalResult` "Auto-validated: Result within normal range (config: validate abnormal only). Value: [value], Range: [low]-[high]" |

### 2.3 Auto-Validated Results Visibility

Auto-validated results do NOT appear in the validation queue. They move directly from "Entered" to "Released" status. However, they can be found:

- In the patient's result history with an "Auto-validated" badge
- In the system audit trail with the `AUTO_VALIDATE` action
- In reports with an auto-validation indicator (distinct from human-validated)

---

## 3. Validation Pipeline (Multi-Level)

### 3.1 Status Flow with Multiple Levels

```
┌─────────┐     ┌─────────┐     ┌────────────────────┐     ┌────────────────────┐     ┌──────────┐
│ Pending  │ ──▶ │ Entered │ ──▶ │ Awaiting           │ ──▶ │ Awaiting           │ ──▶ │ Released │
│          │     │         │     │ Validation (Lv 1)  │     │ Validation (Lv 2)  │     │          │
└─────────┘     └─────────┘     └────────────────────┘     └────────────────────┘     └──────────┘
                                         │                          │
                                         │ Retest                   │ Retest
                                         ▼                          ▼
                                    ┌─────────┐               ┌─────────┐
                                    │ Pending  │               │ Pending  │
                                    └─────────┘               └─────────┘
```

**With auto-validation (0 levels, or normal result with abnormal-only trigger):**

```
┌─────────┐     ┌─────────┐     ┌──────────┐
│ Pending  │ ──▶ │ Entered │ ──▶ │ Released │   (auto-validated on save)
│          │     │         │     │          │
└─────────┘     └─────────┘     └──────────┘
```

### 3.2 Validation Level Tracking

Each result in the validation pipeline carries:

| Field | Type | Description |
|-------|------|-------------|
| `validationLevelsRequired` | Integer | Total levels needed (from config at time of entry) |
| `validationLevelCurrent` | Integer | Next level needing validation (1-indexed) |
| `validationHistory` | Array | List of completed validations |

Each entry in `validationHistory`:

| Field | Type | Description |
|-------|------|-------------|
| `level` | Integer | Which level was validated |
| `validatedBy` | User ID | User who performed validation |
| `validatedAt` | Timestamp | When validation occurred |
| `role` | String | Role the user was acting under |
| `action` | Enum | VALIDATE, RETEST, AUTO_VALIDATE |
| `notes` | String | Optional validator comment |

### 3.3 Role-Based Queue Filtering

The validation page filters results based on the current user's roles and the validation level configuration:

- A result at level 1 awaiting validation appears only to users with the role assigned to level 1
- A result at level 2 appears only to users with the role assigned to level 2
- If a user has roles for multiple levels, they see results for all applicable levels (since the same user can validate multiple levels)
- The result entry technician is excluded from validating their own results at any level

### 3.4 Retest at Any Level

A validator at any level can send a result back for retest. This resets the result to "Pending" status and clears the validation pipeline (all previous validations are preserved in history but a fresh validation cycle begins when re-entered).

---

## 4. Validation Page Updates

### 4.1 Access Control (Updated)

- Page access requires any role that is assigned to at least one validation level in any lab unit configuration
- The existing "Validation" role remains the default and is the only role with `result.validate` out of the box
- Additional roles granted `result.validate` via the Role Builder will also be available for level assignment and grant validation page access when configured
- Users only see results where their role matches the current pending validation level

### 4.2 Page Header Updates

The page header now shows context-aware information:

| Element | Description |
|---------|-------------|
| **Page Title** | `label.validation.title` "Result Validation" with shield icon |
| **Subtitle** | `label.validation.subtitle` "Review and validate results before release" |
| **Count Badge** | `label.validation.count` "[N] awaiting your validation" (filtered to current user's role queue) |
| **Config Banner** | When viewing a lab unit, show effective config: "[Lab Unit]: [N] validation level(s), [Trigger]" |

### 4.3 Validation Level Indicator (New)

Each row in the validation table now shows its validation progress:

#### Collapsed Row Addition

A validation progress indicator appears in the row, showing the current level and total required:

| Levels Required | Current Level | Display |
|----------------|---------------|---------|
| 1 | 1 | No extra indicator (current behavior) |
| 2 | 1 | `label.validation.progress` "Level 1 of 2" badge (teal) |
| 2 | 2 | "Level 2 of 2" badge (teal, with 1 check) |
| 3 | 2 | "Level 2 of 3" badge (teal, with 1 check) |

#### Expanded Row Addition

In the expanded row, a "Validation Progress" section appears above the existing tabs:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Validation Progress                                                         │
│                                                                              │
│  ● Level 1 (Supervisor) ─── ✓ Validated by J. Smith, 12/18/2025 10:45      │
│  ○ Level 2 (Lab Manager) ─── Awaiting your validation                        │
│                                                                              │
│  Config: Hematology requires 2 validations for all results                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

Each completed level shows: validated by, timestamp, role. The current pending level shows "Awaiting validation" (or "Awaiting your validation" if the current user's role matches).

### 4.4 Context-Aware Action Buttons (Updated)

All validation action buttons now reflect whether the action will release the result or just advance it to the next level:

#### Single Row Actions

| Scenario | Button Label | Button Style |
|----------|-------------|-------------|
| Single level, level 1 of 1 | `label.validation.action.validateRelease` "Validate & Release" | Primary (teal) |
| Multi-level, NOT final level | `label.validation.action.validate` "Validate (1 of 2)" | Secondary (outlined teal) |
| Multi-level, final level | `label.validation.action.validateRelease` "Validate & Release" | Primary (teal) |
| Any level | `label.validation.action.retest` "Retest" | Amber/warning |

#### Batch Actions

| Scenario | Button Label |
|----------|-------------|
| All selected are at their final level | `label.validation.batch.validateRelease` "Validate & Release Selected ([N])" |
| Mixed levels in selection | `label.validation.batch.validateMixed` "Validate Selected ([N]) — [X] will release, [Y] will advance" |
| All selected are NOT at final level | `label.validation.batch.validate` "Validate Selected ([N]) — advances to next level" |

### 4.5 Auto-Validated Results View (New)

A new toggle or tab allows validators to view recently auto-validated results for auditing purposes:

| Element | Description |
|---------|-------------|
| `label.validation.autoValidated.toggle` Toggle | "Show auto-validated" checkbox in the filter bar |
| Display | Auto-validated results shown with a distinct "Auto-validated" badge (gray/system) |
| Read-only | These results cannot be acted on (already released) but can be reviewed |
| Audit info | Shows the auto-validation rule reference |

---

## 5. Validation Page (Unchanged Sections)

The following sections from v1.0 remain unchanged:

- **Initial State (Before Search)** — search-before-load pattern
- **Search and Filter Bar** — lab unit dropdown, free-text search
- **Advanced Filters Panel** — lab number range, date range, test section, analyzer, entered by, quick filters
- **Quick Stats** — normal/abnormal/flagged counts
- **Results Table layout** — column structure, collapsed/expanded row views
- **Expanded Row Details** — patient banner, entry info, result editing, interpretation, notes, attachments
- **Tabs** — Method & Reagents, History, QA/QC
- **Retest Modal** — reason required, audit logged
- **Pagination** — page size options, navigation

---

## 6. Data Model Updates

### 6.1 Validation Configuration Table

```
Table: validation_config
  id                  UUID PRIMARY KEY
  scope_type          ENUM('LAB_DEFAULT', 'LAB_UNIT')
  scope_id            UUID NULL  -- NULL for LAB_DEFAULT, lab_unit_id for LAB_UNIT
  trigger             ENUM('NONE', 'ALL', 'ABNORMAL_ONLY')
  levels_required     INTEGER (0-5)
  created_by          UUID REFERENCES users(id)
  created_at          TIMESTAMP
  updated_by          UUID REFERENCES users(id)
  updated_at          TIMESTAMP
  UNIQUE(scope_type, scope_id)
```

### 6.2 Validation Level Configuration Table

```
Table: validation_level_config
  id                  UUID PRIMARY KEY
  validation_config_id UUID REFERENCES validation_config(id) ON DELETE CASCADE
  level_number        INTEGER (1-5)
  role_id             UUID REFERENCES roles(id)
  UNIQUE(validation_config_id, level_number)
```

### 6.3 Result Validation Tracking (Extension to existing result table)

```
-- New columns on result/analysis table:
  validation_levels_required  INTEGER DEFAULT 1
  validation_level_current    INTEGER DEFAULT 1
  validation_status           ENUM('PENDING_VALIDATION', 'AUTO_VALIDATED', 'VALIDATED', 'RELEASED')
```

### 6.4 Validation History Table

```
Table: validation_history
  id                  UUID PRIMARY KEY
  result_id           UUID REFERENCES result(id)
  level               INTEGER
  action              ENUM('VALIDATE', 'RETEST', 'AUTO_VALIDATE')
  performed_by        UUID NULL REFERENCES users(id) -- NULL for SYSTEM
  performed_at        TIMESTAMP
  role_id             UUID NULL REFERENCES roles(id)
  rule_reference      TEXT NULL -- For AUTO_VALIDATE entries
  notes               TEXT NULL
```

---

## 7. API Endpoints

### 7.1 Validation Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/validation/config` | Get lab-wide default configuration |
| PUT | `/api/admin/validation/config` | Update lab-wide default |
| GET | `/api/admin/validation/config/lab-units` | Get all lab unit configs (effective) |
| GET | `/api/admin/validation/config/lab-units/{id}` | Get specific lab unit config |
| PUT | `/api/admin/validation/config/lab-units/{id}` | Create/update lab unit override |
| DELETE | `/api/admin/validation/config/lab-units/{id}` | Remove lab unit override (revert to default) |
| GET | `/api/roles?permission=result.validate` | Get roles with validation permission (for dropdown population) |

### 7.2 Validation Actions (Updated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/validation/validate` | Validate result(s) at current level |
| POST | `/api/validation/retest` | Send result(s) for retest |
| GET | `/api/validation/queue` | Get results awaiting validation (filtered by user role) |
| GET | `/api/validation/auto-validated` | Get recently auto-validated results (for audit view) |
| GET | `/api/validation/result/{id}/history` | Get validation history for a result |

### 7.3 Validate Endpoint Request/Response

**Request:**
```json
{
  "resultIds": ["uuid-1", "uuid-2"],
  "notes": "Optional validation comment"
}
```

**Response:**
```json
{
  "validated": [
    {
      "resultId": "uuid-1",
      "newLevel": 2,
      "released": false,
      "message": "Advanced to level 2 of 2"
    },
    {
      "resultId": "uuid-2",
      "newLevel": null,
      "released": true,
      "message": "Validated and released"
    }
  ]
}
```

---

## 8. Permissions

### 8.1 Permission Codes

| Code | Description |
|------|-------------|
| `validation.config.view` | View validation configuration |
| `validation.config.edit` | Edit validation configuration (lab-wide and per-unit) |
| `validation.results.view` | View results awaiting validation |
| `validation.results.validate` | Validate results at current level |
| `validation.results.retest` | Send results for retest |
| `validation.results.edit` | Edit result values during validation |
| `validation.auto.view` | View auto-validated results (audit) |
| `result.validate` | **Gate permission for validation level assignment.** Roles holding this permission appear in the validation level role dropdown. Currently only the built-in "Validation" role has this permission; the Role Builder allows granting it to additional roles. |

### 8.2 Role Assignments

| Role | Permissions |
|------|-------------|
| System Administrator | All validation permissions |
| Lab Manager | All validation permissions |
| Validation (built-in default) | `result.validate`, `validation.results.*` |
| Custom roles (when granted via Role Builder) | `result.validate` makes them available for level assignment; page-level permissions (`validation.results.*`) are granted separately as needed |

---

## 9. Localization Tags

All user-facing text uses localization tags. Key additions for v2.0:

### Admin Configuration

| Tag | Default (English) |
|-----|-------------------|
| `label.admin.validation.title` | Validation Configuration |
| `label.admin.validation.subtitle` | Configure how results are validated before release |
| `label.admin.validation.labDefault` | Lab-Wide Default |
| `label.admin.validation.labUnitOverrides` | Lab Unit Overrides |
| `label.admin.validation.trigger` | Validation Trigger |
| `label.admin.validation.trigger.none` | No Results (auto-release all) |
| `label.admin.validation.trigger.all` | All Results |
| `label.admin.validation.trigger.abnormal` | Abnormal Results Only |
| `label.admin.validation.levelsRequired` | Validations Required |
| `label.admin.validation.level` | Validation Level |
| `label.admin.validation.role` | Required Role (must hold result.validate permission) |
| `label.admin.validation.role.hint` | Only roles with the result.validate permission are shown. Use the Role Builder to grant this permission to additional roles. |
| `label.admin.validation.role.noRoles` | No roles currently hold the result.validate permission. Use the Role Builder to assign this permission before configuring validation levels. |
| `label.admin.validation.addLevel` | Add Validation Level |
| `label.admin.validation.removeLevel` | Remove Level |
| `label.admin.validation.source.default` | Default |
| `label.admin.validation.source.override` | Override |
| `label.admin.validation.editOverride` | Edit Override |
| `label.admin.validation.resetDefault` | Reset to Default |
| `label.admin.validation.willRelease` | Results will be released after final validation |
| `label.admin.validation.willAutoRelease` | Results will auto-release on save (no manual validation) |
| `label.admin.validation.willAutoReleaseNormal` | Normal results will auto-release; abnormal results require validation |
| `label.admin.validation.saved` | Validation configuration saved |

### Validation Page

| Tag | Default (English) |
|-----|-------------------|
| `label.validation.title` | Result Validation |
| `label.validation.subtitle` | Review and validate results before release |
| `label.validation.count` | {0} awaiting your validation |
| `label.validation.progress` | Level {0} of {1} |
| `label.validation.progress.complete` | Validated by {0} on {1} |
| `label.validation.progress.awaiting` | Awaiting validation |
| `label.validation.progress.awaitingYou` | Awaiting your validation |
| `label.validation.action.validate` | Validate ({0} of {1}) |
| `label.validation.action.validateRelease` | Validate & Release |
| `label.validation.action.retest` | Retest |
| `label.validation.batch.validateRelease` | Validate & Release Selected ({0}) |
| `label.validation.batch.validate` | Validate Selected ({0}) — advances to next level |
| `label.validation.batch.validateMixed` | Validate Selected ({0}) — {1} will release, {2} will advance |
| `label.validation.autoValidated` | Auto-validated |
| `label.validation.autoValidated.toggle` | Show auto-validated results |
| `label.validation.config.info` | {0}: {1} validation level(s), {2} |

### Audit Trail

| Tag | Default (English) |
|-----|-------------------|
| `label.audit.validation.validate` | Validated at level {0} of {1} |
| `label.audit.validation.release` | Validated and released (level {0} of {1}) |
| `label.audit.validation.retest` | Sent for retest at level {0} |
| `label.audit.autoValidate.zeroLevels` | Auto-validated: 0 validation levels configured |
| `label.audit.autoValidate.noValidation` | Auto-validated: Validation trigger set to 'No Results' |
| `label.audit.autoValidate.normalResult` | Auto-validated: Result within normal range (abnormal-only trigger). Value: {0}, Range: {1}-{2} |

---

## 10. Acceptance Criteria

### Admin Configuration

- [ ] Lab-wide default config page loads with current settings
- [ ] Validation trigger radio group works (None, All, Abnormal Only)
- [ ] Validations Required number input accepts 0–5
- [ ] Level role dropdowns populate from roles with `result.validate` permission (`GET /api/roles?permission=result.validate`)
- [ ] Adding a level adds a new role dropdown (defaults to Validation role)
- [ ] If no roles hold `result.validate` permission, warning displayed and Save disabled
- [ ] Removing a level removes the highest-numbered level
- [ ] Summary banner updates in real-time as settings change
- [ ] Release behavior text updates based on trigger + level combination
- [ ] Save persists configuration and shows success notification
- [ ] Lab unit override table shows all lab units with effective config
- [ ] "Default" / "Override" badge displayed correctly
- [ ] Inline edit for lab unit override works
- [ ] "Reset to Default" removes override and re-inherits
- [ ] Configuration changes take effect on next result save (not retroactive)

### Auto-Validation

- [ ] Results auto-validate when validations_required = 0
- [ ] Results auto-validate when trigger = "No Results"
- [ ] Normal results auto-validate when trigger = "Abnormal Only"
- [ ] Abnormal results enter validation pipeline when trigger = "Abnormal Only"
- [ ] Auto-validated results logged with `AUTO_VALIDATE` action
- [ ] Auto-validated results show rule reference in audit trail
- [ ] Auto-validated results do NOT appear in validation queue
- [ ] Auto-validated results show "Auto-validated" badge in patient history

### Multi-Level Validation

- [ ] Results with 2+ levels show validation progress in collapsed row
- [ ] Expanded row shows validation progress timeline (completed + pending levels)
- [ ] Validation at non-final level advances result to next level
- [ ] Validation at final level releases result
- [ ] Button label says "Validate (N of M)" for non-final levels
- [ ] Button label says "Validate & Release" for final level
- [ ] Retest at any level resets to Pending and clears pipeline
- [ ] Validation history preserved when result is retested and re-enters pipeline
- [ ] Result entry technician excluded from validating their own result at any level

### Role-Based Filtering

- [ ] Validation queue filtered to current user's applicable roles
- [ ] Users see results where their role matches the pending level's required role
- [ ] Users with multiple matching roles see all applicable results
- [ ] Count badge reflects filtered count (not total awaiting)

### Batch Actions

- [ ] Batch validate with all-final-level selection shows "Validate & Release"
- [ ] Batch validate with mixed levels shows accurate counts in label
- [ ] Batch validate with all-non-final shows "advances to next level"
- [ ] Batch retest works at any level

### Migration / Backward Compatibility

- [ ] Existing "Validate all results = Yes" maps to trigger "No Results"
- [ ] Existing "Validate all results = No" maps to trigger "All Results", 1 level, Validation role (built-in)
- [ ] No behavior change for existing installations on upgrade
- [ ] Old API endpoints continue to work with single-level validation

---

## 11. Security Considerations

### RBAC Enforcement

- Validation configuration page restricted to users with `validation.config.edit` permission
- API endpoints verify role matches for the current validation level before allowing validate action
- Result entry user cannot validate their own result (enforced server-side)
- User ID and role logged with every validation action

### Audit Trail

All actions are logged:

- Result auto-validated (system, with rule reference)
- Result validated at level N (user, role, timestamp)
- Result released (final validation, user, role, timestamp)
- Result sent for retest (user, level, reason, timestamp)
- Result value edited during validation (old value, new value, user)
- Validation configuration changed (who, what changed, when)

### Data Integrity

- Validation level config is snapshot at result entry time (stored on result)
- Config changes do not retroactively affect results already in the pipeline
- Original result values preserved in history when edited during validation
- Retest reason is required and cannot be empty
- All timestamps use server time

---

## 12. Future Enhancements (v3)

### Separation of Duties Mode

- Configurable per lab unit: require different users at each validation level
- Currently same user can validate multiple levels; this would add an enforcement option

### Conditional Validation Rules

- Configure additional rules beyond normal/abnormal (e.g., QC status, specific tests, critical values)
- Rule engine for complex auto-validation logic

### Validation SLA / Turnaround Alerts

- Configure maximum time a result should wait at each validation level
- Alert when validation SLA is approaching or breached

### Delegation / Escalation

- If primary validator is unavailable, auto-escalate to backup role after configurable timeout
- Delegation workflow for temporary validation authority

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-19 | Claude | Initial draft — single-level validation page |
| 2.0 | 2026-02-26 | Claude | Multi-level validation pipeline, admin configuration, role-based levels, auto-validation, per-lab-unit overrides, localization tags |
