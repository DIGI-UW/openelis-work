# Result Validation Page - Functional Requirements Specification

**Version:** 2.1 (Stage 1)
**Date:** March 4, 2026
**Changes from v2.0:** Scoped to Stage 1 delivery — multi-level validation with minimal UI/UX changes. Auto-validation, per-lab-unit overrides, and abnormal-only trigger deferred to Stage 2.

---

## Stage Summary

### What is Stage 1?

Stage 1 delivers the **core multi-signature validation pipeline** — the ability for a result to require approval from multiple reviewers before release — with the **smallest possible UI footprint** on the existing validation page.

### Stage 1 Scope

| Area | In Scope | Out of Scope (Stage 2) |
|------|----------|----------------------|
| **Backend** | Multi-level validation pipeline, validation history tracking, role-based queue filtering | — |
| **Admin Config** | New simplified "Validation Configuration" page with lab-wide defaults only | Per-lab-unit overrides |
| **Validation Trigger** | "All Results" (require validation) and "No Results" (skip validation) — binary, same as today | "Abnormal Results Only" trigger |
| **Auto-Validation** | Existing behavior preserved (skip validation = auto-release) | Abnormal-only auto-release, auto-validated results audit view |
| **Validation Page** | Level badge on rows, context-aware button labels, validation progress in expanded row | Full redesign of page header, config banners, auto-validated toggle |
| **Batch Actions** | Updated labels reflecting "advance" vs "release" | Mixed-level batch label refinements |
| **Data Model** | All v2 tables (validation_config, validation_level_config, validation_history) | scope_type = LAB_UNIT rows (deferred) |
| **API** | All v2 validation endpoints, simplified config endpoints | Per-lab-unit config endpoints |

### Design Principle

> **If a lab is configured for 1 validation level, the page should look and behave identically to today.** Multi-level indicators only appear when `validationLevelsRequired > 1`.

This means a lab running single-level validation sees zero UI changes after the upgrade. The new UI elements surface only for labs that opt into multi-level validation through the admin config.

---

## 1. Admin Validation Configuration (Stage 1 — Simplified)

### 1.1 Location in Admin UI

A new page replaces the existing **"Validate all results"** toggle:

**Admin → Validation Configuration**

This page contains only the **lab-wide default** configuration. The per-lab-unit override table from v2 is deferred to Stage 2.

### 1.2 Lab-Wide Default Configuration

#### Configuration Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `label.admin.validation.trigger` Validation Trigger | Radio group | Which results require validation | All Results |
| `label.admin.validation.levelsRequired` Validations Required | Number input (0–5) | How many sequential approvals before release | 1 |
| `label.admin.validation.level.N.role` Level N Role | Dropdown (permission-filtered roles) | Which role performs validation at this level | Validation (built-in role) |

#### Validation Trigger Options (Stage 1 — Simplified)

Only two options are available in Stage 1. The "Abnormal Results Only" option is visually present but disabled with a "Coming in Stage 2" tooltip, so the admin UI layout doesn't need to change later.

| Option | Behavior | Enabled in Stage 1? |
|--------|----------|---------------------|
| **No Results** | All results auto-validate and release on save. Equivalent to current "Validate all results = Yes" behavior. | Yes |
| **All Results** | Every result must pass through the full validation pipeline. This is the default. | Yes |
| **Abnormal Results Only** | *Displayed but disabled.* Tooltip: "Available in a future update." | No (disabled) |

#### Validations Required (Levels)

Identical to v2 spec (0–5 levels). Behavior:

| Value | Behavior | Button Label on Final Level |
|-------|----------|---------------------------|
| **0** | All results auto-validate on save. No manual validation step. | N/A |
| **1** | Single validation step (**current default behavior — no visible UI changes on validation page**). | "Validate & Release" |
| **2** | Two sequential validations. First validator approves; result moves to level 2 queue. Second validator approves and releases. | Level 1: "Validate (1 of 2)" / Level 2: "Validate & Release" |
| **3–5** | Same sequential pattern. | "Validate (N of M)" / final: "Validate & Release" |

#### Level Role Assignment

Identical to v2 spec. Dropdown populated from `GET /api/roles?permission=result.validate`. Same role can be assigned to multiple levels. Warning shown if no roles hold the permission.

**Constraint preserved:** The user who *entered* the result cannot validate it at any level.

### 1.3 Configuration Summary

At the top of the config page, a simple summary line:

> **Current configuration:** [N] validation level(s), [Trigger], Roles: [Role 1 → Role 2 → ...]

No per-lab-unit override count or auto-release count (those are Stage 2).

### 1.4 Migration from Existing Setting

| Old Setting | New Equivalent |
|-------------|----------------|
| "Validate all results" = **Yes** (skip validation) | Validation Trigger = **No Results** OR Validations Required = **0** |
| "Validate all results" = **No** (require validation) | Validation Trigger = **All Results**, Validations Required = **1**, Role = **Validation** |

Existing installations see **no behavior change on upgrade**. The old toggle is replaced by the new config page, pre-populated to match the previous setting.

---

## 2. Validation Pipeline (Multi-Level) — Unchanged from v2

The backend pipeline logic is identical to v2 sections 3.1–3.4. Summarized here for completeness:

### 2.1 Status Flow

```
Single level (1 of 1):
  Entered → Awaiting Validation → Released

Multi-level (example: 2 levels):
  Entered → Awaiting Validation (Lv 1) → Awaiting Validation (Lv 2) → Released

Retest at any level:
  Awaiting Validation (Lv N) → Pending (fresh cycle on re-entry)
```

### 2.2 Validation Level Tracking

Each result carries `validationLevelsRequired`, `validationLevelCurrent`, and a `validationHistory` array. Identical to v2 section 3.2.

### 2.3 Role-Based Queue Filtering

Results appear to users based on their role matching the current pending level. Identical to v2 section 3.3.

### 2.4 Retest at Any Level

A validator at any level can send a result back for retest. Identical to v2 section 3.4.

---

## 3. Validation Page — Minimal UI Changes

### 3.1 Current UI Baseline

The existing validation page has this structure:

```
Home / Validation                               (breadcrumb + page title)

Search
Select Test Unit
[Immunohistochemistry ▾]                        (lab unit dropdown)

⚠ = Sample or Order is nonconforming...    ☐ Save All Normal  ☐ Save All Results  ☐ Retest All Tests

| Sample Info       | Test Name                    | Normal Range | Result | Save | Retest |
|-------------------|------------------------------|--------------|--------|------|--------|
| 24-TST-000-00R    | Actin Smooth Muscle (IHC)    |              | test   |  ☐   |   ☐    |
| 24-TST-000-00R    | Anti-CD22 (IHC)              |              | test   |  ☐   |   ☐    |
| ...               | ...                          | ...          | ...    |  ☐   |   ☐    |

Items per page [100 ▾]  1-14 of 14 items                              1 ▾ of 1 page  ◄ ►

[Save]                                          (primary button at bottom)
```

Key characteristics:

- **Flat table** — no expandable rows, no row-level action buttons
- **Checkbox-based workflow** — user checks "Save" or "Retest" per row, then clicks the bottom "Save" button to process all checked items at once
- **Bulk checkboxes** — "Save All Normal", "Save All Results", "Retest All Tests" in the info banner
- **Single Save button** — processes all checked rows in one batch
- **Lab unit dropdown** — filters results by test section (acts as queue selector)

### 3.2 Guiding Principle: Invisible When Single-Level

All new UI elements are **conditional on `validationLevelsRequired > 1`**. A lab using single-level validation sees the page exactly as it exists today.

### 3.3 Change 1: Add "Validation" Column to Table

A new column is inserted between "Result" and "Save" that shows validation level progress. This column is **only rendered when the lab is configured for multi-level validation** (i.e., the lab-wide default has `levelsRequired > 1`). For single-level labs, the table is unchanged.

#### Updated Table Structure (Multi-Level Only)

```
| Sample Info       | Test Name          | Normal Range | Result | Validation   | Save | Retest |
|-------------------|--------------------|--------------|--------|--------------|------|--------|
| 24-TST-000-00R    | Actin Smooth Muscle|              | test   | Level 1 of 2 |  ☐   |   ☐    |
| 24-TST-000-015    | AMACR (p504 s)     |              | 10-15% | Level 2 of 2 |  ☐   |   ☐    |
```

#### Validation Column Content

| Levels Required | Current Level | Cell Content | Styling |
|----------------|---------------|-------------|---------|
| 1 | 1 | *(column not shown)* | — |
| 2 | 1 | "Validation 1/2" | Carbon `Tag` (type="blue", size="sm") |
| 2 | 2 | "Validation 2/2" with ✓ icon | Carbon `Tag` (type="teal", size="sm") + `CheckmarkFilled16` |
| 3 | 2 | "Validation 2/3" with ✓ icon | Same pattern |

The format "Validation X/Y" is compact and immediately tells the user where they are in the pipeline. The ✓ icon indicates at least one prior level has been completed. A tooltip on hover shows who validated the completed level(s): "Level 1 validated by Dr. Williams on 02/26/2026 10:15".

**Implementation note:** Use the Carbon `Tag` component inline in a standard `<td>`. In the standalone mockup, Lucide icons (`CheckCircle`, `Circle`) are used as placeholders for the Carbon `CheckmarkFilled16` and `CircleDash16` icons.

### 3.4 Change 2: Context-Aware Save Button

The existing "Save" button at the bottom of the page updates its label to indicate what will happen when clicked. The button still processes all checked rows in one batch — the only change is the label text.

#### Save Button Label Logic

| Scenario | Button Label | Button Style |
|----------|-------------|-------------|
| Single-level lab (1 validation required) | "Save" | Primary blue *(no change)* |
| Multi-level lab, all checked rows at final level | "Save — validates & releases [N] result(s)" | Primary blue |
| Multi-level lab, all checked rows NOT at final level | "Save — advances [N] result(s) to next level" | Primary blue |
| Multi-level lab, mixed levels checked | "Save — [X] will release, [Y] will advance" | Primary blue |
| Nothing checked | "Save" (disabled) | Disabled *(no change from current behavior)* |

**Implementation note:** This is a label-only change on the existing `<Button>` component. The button color, position, and click behavior remain the same. The label updates dynamically as checkboxes are checked/unchecked.

### 3.5 Change 3: Validation History Tooltip on Level Tag

When a user hovers over or clicks the "Level X of Y" tag in the Validation column, a tooltip or popover shows the validation history for that result. This provides visibility into who has already validated without needing an expanded row view.

#### Tooltip Content

For a result at level 2 of 2:

```
┌──────────────────────────────────────────────┐
│  Validation Progress                          │
│  ✓ Level 1 (Supervisor)                      │
│    Dr. Williams — 02/26/2026 10:15           │
│  ○ Level 2 (Lab Manager)                     │
│    Awaiting your validation                   │
└──────────────────────────────────────────────┘
```

For a result at level 1 of 2:

```
┌──────────────────────────────────────────────┐
│  Validation Progress                          │
│  ○ Level 1 (Supervisor)                      │
│    Awaiting validation                        │
│  ○ Level 2 (Lab Manager)                     │
│    Pending                                    │
└──────────────────────────────────────────────┘
```

**Implementation note:** Use the Carbon `Tooltip` or `Popover` component attached to the Tag. The content is a simple list of levels with status. This avoids adding an expandable row mechanism (which is a v2 UI pattern) while still surfacing validation history.

### 3.6 Unchanged Sections

Everything else on the validation page remains identical to the current implementation:

- Breadcrumb and page title ("Home / Validation")
- Search section and "Select Test Unit" dropdown
- Info banner with nonconforming warning
- Bulk checkboxes: "Save All Normal", "Save All Results", "Retest All Tests" — labels unchanged
- Table columns: Sample Info, Test Name, Normal Range, Result, Save, Retest — unchanged
- Save and Retest checkbox behavior per row — unchanged
- Pagination (items per page, page navigation)
- No expandable rows — remains a flat table

---

## 4. Data Model — Full v2 Schema, Partially Used

Stage 1 creates all v2 tables to avoid a second migration in Stage 2. However, some columns/values won't be used until Stage 2.

### 4.1 validation_config

```sql
CREATE TABLE validation_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type          VARCHAR(20) NOT NULL DEFAULT 'LAB_DEFAULT',
  scope_id            UUID NULL,
  trigger             VARCHAR(20) NOT NULL DEFAULT 'ALL',
  levels_required     INTEGER NOT NULL DEFAULT 1 CHECK (levels_required BETWEEN 0 AND 5),
  created_by          UUID REFERENCES clinlims.system_user(id),
  created_at          TIMESTAMP NOT NULL DEFAULT now(),
  updated_by          UUID REFERENCES clinlims.system_user(id),
  updated_at          TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(scope_type, scope_id)
);
-- Stage 1: Only one row with scope_type = 'LAB_DEFAULT', scope_id = NULL
-- Stage 2: Additional rows with scope_type = 'LAB_UNIT', scope_id = lab_unit_id
```

**Stage 1 constraint:** `trigger` can only be `'NONE'` or `'ALL'`. The application layer enforces this; the DB allows `'ABNORMAL_ONLY'` for forward compatibility.

### 4.2 validation_level_config

```sql
CREATE TABLE validation_level_config (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_config_id  UUID NOT NULL REFERENCES validation_config(id) ON DELETE CASCADE,
  level_number          INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 5),
  role_id               UUID NOT NULL REFERENCES clinlims.system_role(id),
  UNIQUE(validation_config_id, level_number)
);
```

### 4.3 Result table extensions

```sql
ALTER TABLE clinlims.analysis
  ADD COLUMN validation_levels_required INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN validation_level_current   INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN validation_status          VARCHAR(30) DEFAULT 'PENDING_VALIDATION';
-- validation_status values: PENDING_VALIDATION, VALIDATED, RELEASED
-- AUTO_VALIDATED deferred to Stage 2
```

### 4.4 validation_history

```sql
CREATE TABLE validation_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id         UUID NOT NULL REFERENCES clinlims.result(id),
  level             INTEGER NOT NULL,
  action            VARCHAR(20) NOT NULL, -- VALIDATE, RETEST
  performed_by      UUID REFERENCES clinlims.system_user(id),
  performed_at      TIMESTAMP NOT NULL DEFAULT now(),
  role_id           UUID REFERENCES clinlims.system_role(id),
  rule_reference    TEXT NULL,
  notes             TEXT NULL
);
-- Stage 1: action is VALIDATE or RETEST only
-- Stage 2: adds AUTO_VALIDATE action
```

---

## 5. API Endpoints

### 5.1 Validation Configuration (Stage 1 — Simplified)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/validation/config` | Get lab-wide default configuration |
| PUT | `/api/admin/validation/config` | Update lab-wide default |
| GET | `/api/roles?permission=result.validate` | Get roles with validation permission |

**Deferred to Stage 2:**
- `GET/PUT/DELETE /api/admin/validation/config/lab-units/{id}` (per-unit overrides)
- `GET /api/admin/validation/config/lab-units` (list all unit configs)

### 5.2 Validation Actions — Unchanged from v2

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/validation/validate` | Validate result(s) at current level |
| POST | `/api/validation/retest` | Send result(s) for retest |
| GET | `/api/validation/queue` | Get results awaiting validation (filtered by user role + current level) |
| GET | `/api/validation/result/{id}/history` | Get validation history for a result |

**Deferred to Stage 2:**
- `GET /api/validation/auto-validated` (auto-validated results audit view)

### 5.3 Validate Endpoint Request/Response

Identical to v2 section 7.3:

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

### 5.4 Queue Endpoint Response Update

The `GET /api/validation/queue` response now includes level tracking fields for each result:

```json
{
  "results": [
    {
      "id": "uuid-1",
      "labNumber": "DEV01260000001234",
      "test": "WBC",
      "result": "7.5",
      "validationLevelsRequired": 2,
      "validationLevelCurrent": 1,
      "validationHistory": [],
      "...existing fields..."
    }
  ]
}
```

---

## 6. Permissions — Unchanged from v2

All permission codes from v2 section 8 are implemented in Stage 1. The `validation.auto.view` permission exists but is unused until Stage 2.

---

## 7. Localization Tags (Stage 1 Subset)

### Admin Configuration

| Tag | Default (English) |
|-----|-------------------|
| `label.admin.validation.title` | Validation Configuration |
| `label.admin.validation.subtitle` | Configure how results are validated before release |
| `label.admin.validation.labDefault` | Lab-Wide Default |
| `label.admin.validation.trigger` | Validation Trigger |
| `label.admin.validation.trigger.none` | No Results (auto-release all) |
| `label.admin.validation.trigger.all` | All Results |
| `label.admin.validation.trigger.abnormal` | Abnormal Results Only |
| `label.admin.validation.trigger.abnormal.disabled` | Available in a future update |
| `label.admin.validation.levelsRequired` | Validations Required |
| `label.admin.validation.level` | Validation Level |
| `label.admin.validation.role` | Required Role (must hold result.validate permission) |
| `label.admin.validation.role.hint` | Only roles with the result.validate permission are shown. Use the Role Builder to grant this permission to additional roles. |
| `label.admin.validation.role.noRoles` | No roles currently hold the result.validate permission. Use the Role Builder to assign this permission before configuring validation levels. |
| `label.admin.validation.addLevel` | Add Validation Level |
| `label.admin.validation.removeLevel` | Remove Level |
| `label.admin.validation.willRelease` | Results will be released after final validation |
| `label.admin.validation.willAutoRelease` | Results will auto-release on save (no manual validation) |
| `label.admin.validation.saved` | Validation configuration saved |
| `label.admin.validation.summary` | Current configuration: {0} validation level(s), {1} |

### Validation Page

| Tag | Default (English) |
|-----|-------------------|
| `label.validation.progress` | Validation {0}/{1} |
| `label.validation.progress.complete` | Validated by {0} on {1} |
| `label.validation.progress.awaiting` | Awaiting validation |
| `label.validation.progress.awaitingYou` | Awaiting your validation |
| `label.validation.progress.configNote` | Lab default: {0} validation(s) required for all results |
| `label.validation.action.validate` | Validate ({0} of {1}) |
| `label.validation.action.validateRelease` | Validate & Release |
| `label.validation.action.retest` | Retest |
| `label.validation.batch.validateRelease` | Validate & Release Selected ({0}) |
| `label.validation.batch.validate` | Validate Selected ({0}) — advances to next level |
| `label.validation.batch.validateMixed` | Validate Selected ({0}) — {1} will release, {2} will advance |

### Audit Trail

| Tag | Default (English) |
|-----|-------------------|
| `label.audit.validation.validate` | Validated at level {0} of {1} |
| `label.audit.validation.release` | Validated and released (level {0} of {1}) |
| `label.audit.validation.retest` | Sent for retest at level {0} |

---

## 8. Acceptance Criteria (Stage 1)

### Admin Configuration

- [ ] New "Validation Configuration" page accessible via Admin menu
- [ ] Old "Validate all results" toggle is removed / redirects to new page
- [ ] Validation trigger radio group shows All Results and No Results as active options
- [ ] "Abnormal Results Only" option is visible but disabled with tooltip
- [ ] Validations Required number input accepts 0–5
- [ ] Level role dropdowns populate from roles with `result.validate` permission
- [ ] Adding a level adds a new role dropdown defaulting to Validation role
- [ ] If no roles hold `result.validate` permission, warning displayed and Save disabled
- [ ] Removing a level removes the highest-numbered level
- [ ] Summary line updates in real-time as settings change
- [ ] Save persists configuration and shows success notification
- [ ] Configuration changes take effect on next result save (not retroactive)

### Multi-Level Validation (Backend)

- [ ] Results entering validation pipeline have `validationLevelsRequired` set from current config
- [ ] Validation at non-final level advances `validationLevelCurrent` to next level
- [ ] Validation at final level releases result (sets status to RELEASED)
- [ ] Each validation action is recorded in `validation_history` with user, role, timestamp, level
- [ ] Retest at any level resets to Pending and clears pipeline (history preserved)
- [ ] Validation history preserved when result is retested and re-enters pipeline
- [ ] Result entry technician excluded from validating their own result at any level
- [ ] `GET /api/validation/queue` filters results by current user's role matching pending level

### Validation Page — Validation Column

- [ ] Labs with `levelsRequired == 1` show **no** Validation column (table identical to current UI)
- [ ] Labs with `levelsRequired > 1` show a "Validation" column between Result and Save
- [ ] Column cells show "Validation X/Y" using Carbon `Tag` component
- [ ] Tags at level 2+ include ✓ icon indicating prior level(s) complete
- [ ] Hovering/clicking the tag shows a tooltip/popover with validation history

### Validation Page — Save Button

- [ ] Single-level labs show "Save" button with no label change (identical to current UI)
- [ ] Multi-level labs: Save button label updates dynamically based on checked rows
- [ ] Label shows count of results that will release vs advance when applicable
- [ ] Bulk checkboxes ("Save All Normal", "Save All Results", "Retest All Tests") unchanged
- [ ] Save and Retest checkboxes per row unchanged

### Validation Page — Validation History Tooltip

- [ ] Tooltip shows all levels with status (completed with who/when, pending, awaiting)
- [ ] "Awaiting your validation" shown when current user's role matches pending level
- [ ] Tooltip uses Carbon `Tooltip` or `Popover` component

### Role-Based Filtering

- [ ] Validation queue filtered to current user's applicable roles
- [ ] Users see results where their role matches the pending level's required role
- [ ] Users with multiple matching roles see all applicable results
- [ ] Count badge reflects filtered count

### Migration / Backward Compatibility

- [ ] Existing "Validate all results = Yes" maps to trigger "No Results"
- [ ] Existing "Validate all results = No" maps to trigger "All Results", 1 level, Validation role
- [ ] **No visible UI change for labs using single-level validation after upgrade**
- [ ] Old API endpoints continue to work with single-level validation

---

## 9. Security Considerations — Unchanged from v2

All security requirements from v2 section 11 apply in Stage 1:

- RBAC enforcement on config page and validation actions
- API-level role verification against current validation level before allowing validate
- Result entry user cannot validate own result (server-side enforcement)
- Full audit trail for all validation actions
- Config snapshot at result entry time (stored on result, not retroactive)
- Original result values preserved in history when edited during validation
- All timestamps server-side

---

## 10. UI Change Summary (Developer Quick Reference)

This section summarizes exactly what changes on the validation page for developers doing front-end work. The key insight is that the **current flat-table-with-checkboxes layout is preserved**. No expandable rows, no per-row action buttons.

### Validation Page Changes (3 total)

| # | Change | Where | Description | Effort |
|---|--------|-------|-------------|--------|
| 1 | Validation column | Table `<th>` + `<td>` | New column with "Level X of Y" `Tag`. Only rendered when `levelsRequired > 1`. | Small |
| 2 | Save button label | Bottom `<Button>` | Label changes dynamically to show advance/release counts when multi-level rows are checked. | Small |
| 3 | History tooltip | On level `Tag` | Hover/click on "Level X of Y" tag shows validation progress popover. | Medium |

### New Admin Page

| File / Component | Description | Effort |
|-----------------|-------------|--------|
| Admin menu / routing | Add "Validation Configuration" under Admin menu | Small |
| New: `ValidationConfig.jsx` | Lab-wide config page: trigger radio, levels count, role dropdowns | Medium-Large |

### Carbon for React Components Used

| Component | Usage |
|-----------|-------|
| `Tag` (type="blue"/"teal", size="sm") | Level indicator in Validation column |
| `Tooltip` or `Popover` | Validation history on tag hover/click |
| `CheckmarkFilled16`, `CircleDash16` | Progress indicators in tooltip |
| `Button` (kind="primary") | Existing Save button — label change only |
| `RadioButtonGroup` + `RadioButton` | Admin: Validation trigger selection |
| `NumberInput` | Admin: Validations required |
| `Select` | Admin: Role dropdown per level |
| `InlineNotification` | Admin: Save success, warnings |
| `Tooltip` | Admin: Disabled "Abnormal Only" option hint |

---

## 11. Stage 2 Preview

The following features are deferred to Stage 2 and are **not** part of this delivery. They are listed here so Stage 1 decisions are made with forward compatibility in mind.

| Feature | Why Deferred | Stage 1 Preparation |
|---------|-------------|-------------------|
| Abnormal Results Only trigger | Requires normal range evaluation logic at save time | DB schema supports the value; UI shows disabled option |
| Per-lab-unit overrides | Significant admin UI work (override table, inline edit) | DB schema supports `scope_type = 'LAB_UNIT'`; API structure planned |
| Auto-validation audit view | New toggle/tab on validation page + audit query | `validation_history` table supports `AUTO_VALIDATE` action |
| Auto-validated results badge in patient history | Cross-page UI change | `validation_status` column supports `AUTO_VALIDATED` value |
| Config banner on validation page | Per-lab-unit context needed to be meaningful | Deferred until per-unit overrides exist |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-19 | Claude | Initial draft — single-level validation page |
| 2.0 | 2026-02-26 | Claude | Multi-level validation pipeline, admin configuration, role-based levels, auto-validation, per-lab-unit overrides, localization tags |
| 2.1 | 2026-03-04 | Claude | Stage 1 scoping — minimal UI/UX changes for multi-level validation. Defers auto-validation triggers, per-lab-unit overrides, and abnormal-only trigger to Stage 2. Adds developer quick reference. |
